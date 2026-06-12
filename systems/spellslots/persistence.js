// [SECTION:PERSISTENCE]
// Extrahiert aus spellslots.js
// Save/Load Funktionen
// Zeilen: 164
// PERSISTENCE
// ============================================================
let saveTimeout = null;
// Sofortiges Speichern (für kritische Aktionen)
async function saveImmediate() {
    // Toggle ist optional: existiert er und ist ungecheckt → Save überspringen.
    // Fehlt das Toggle (aktueller UI-Zustand), wird gespeichert (Default = aktiv).
    const autosaveToggle = $('autosave-toggle');
    if (autosaveToggle && !autosaveToggle.checked)
        return;
    const STORAGE_KEY = window.STORAGE_KEY;
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    const D = window.D;
    const updateSaveIndicator = window.updateSaveIndicator;
    const broadcastSave = window.broadcastSave;
    updateSaveIndicator('saving');
    const dataString = JSON.stringify(D);
    const dataSizeMB = new Blob([dataString]).size / (1024 * 1024);
    // localStorage Limit: ~5-10MB je nach Browser
    const LS_LIMIT_MB = 5;
    const LS_WARNING_MB = 4;
    try {
        // (D-08) 4-MB-Warnung einmal pro Sitzung — kein Toast-Spam am Spieltisch
        if (dataSizeMB > LS_WARNING_MB && dataSizeMB <= LS_LIMIT_MB) {
            if (!window._sizeWarningSeen) {
                window._sizeWarningSeen = true;
                showToast(`⚠️ Kampagne wird groß (${dataSizeMB.toFixed(1)}MB). Backup empfohlen!`, 'warning', 5000);
            }
        }
        // (D-01 / STAB-05) IDB-only-Pfad bei >5MB: LS-Schatten entfernen nach bestätigtem IDB-Write
        if (dataSizeMB > LS_LIMIT_MB) {
            await saveToIndexedDBFallback(key, dataString);
            // Reihenfolge zwingend: erst await IDB-Write, DANN LS löschen (Pitfall 1)
            StorageAPI.remove(key);
            StorageAPI.remove(key + '_ts');
            updateSaveIndicator('saved');
            // (D-02) Sitzungs-Hinweis einmal pro Sitzung, kein Per-Save-Toast
            if (!window._idbModeSeen) {
                window._idbModeSeen = true;
                showToast('💾 Kampagne im IndexedDB-Modus (>5MB). Daten sicher gespeichert.', 'info', 4000);
            }
            broadcastSave();
            return;
        }
        // Normaler localStorage-Save
        const saveResult = StorageAPI.set(key, dataString);
        if (!saveResult.success) {
            // Fehler beim Speichern → werfe Error für catch-Block
            throw new Error(saveResult.error);
        }
        // (D-01) Begleit-Timestamp für Konflikt-Erkennung beim Laden
        StorageAPI.set(key + '_ts', String(Date.now()));
        updateSaveIndicator('saved');
        broadcastSave();
        // Zusätzliches IndexedDB-Backup bei großen Daten (>2MB)
        if (dataSizeMB > 2) {
            saveToIndexedDBFallback(key, dataString).catch(e => {
                if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                    window.ErrorHandler && window.ErrorHandler.log('saveImmediate', e, '[IDB Backup] Optional backup failed');
                }
            });
        }
    }
    catch (e) {
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
            window.ErrorHandler && window.ErrorHandler.log('saveImmediate', e, 'localStorage save failed');
        }
        // Fallback zu IndexedDB bei Fehler
        try {
            await saveToIndexedDBFallback(key, dataString);
            // (D-01) Begleit-Timestamp für IDB-Fallback entfernen (IDB hat eigenen timestamp)
            StorageAPI.remove(key + '_ts');
            updateSaveIndicator('saved');
            showToast('💾 In IndexedDB gespeichert (localStorage voll)', 'warning');
            broadcastSave();
        }
        catch (idbError) {
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG_MODE) {
                window.ErrorHandler && window.ErrorHandler.log('saveImmediate', idbError, 'IndexedDB fallback failed');
            }
            // (D-03) Lauter Fehler-Toast + automatischer Export-Versuch
            updateSaveIndicator('error');
            showToast('❌ Speichern fehlgeschlagen! Daten gehen sonst verloren — JETZT exportieren!', 'error', 10000);
            if (typeof window.exportAllDataAsFile === 'function') {
                window.exportAllDataAsFile();
            }
        }
    }
}
// IndexedDB Fallback für große Kampagnen
async function saveToIndexedDBFallback(key, dataString) {
    const initIndexedDB = window.initIndexedDB;
    let idb = window.idb;
    if (!idb)
        await initIndexedDB();
    idb = window.idb; // Reload after init
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readwrite');
        const store = transaction.objectStore('campaigns');
        const request = store.put({ id: key, data: dataString, timestamp: Date.now() });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
// Load mit IndexedDB-Fallback (gibt nur .data zurück)
async function loadFromIndexedDBFallback(key) {
    const initIndexedDB = window.initIndexedDB;
    let idb = window.idb;
    if (!idb)
        await initIndexedDB();
    idb = window.idb; // Reload after init
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readonly');
        const store = transaction.objectStore('campaigns');
        const request = store.get(key);
        request.onsuccess = () => {
            if (request.result) {
                resolve(request.result.data);
            }
            else {
                reject(new Error('No data found'));
            }
        };
        request.onerror = () => reject(request.error);
    });
}
// (D-01/D-07) Raw-Read: gibt das vollständige {id, data, timestamp}-Record zurück.
// Wird vom Load-Pfad in quick-roll.js für den Timestamp-Vergleich benötigt.
async function loadFromIndexedDBFallbackRaw(key) {
    const initIndexedDB = window.initIndexedDB;
    let idb = window.idb;
    if (!idb)
        await initIndexedDB();
    idb = window.idb;
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['campaigns'], 'readonly');
        const store = transaction.objectStore('campaigns');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null); // {id, data, timestamp} | null
        request.onerror = () => reject(request.error);
    });
}
// Debounced Save (für häufige Änderungen)
// Als Variable definiert, um spätere Erweiterung (Decorator-Pattern) zu ermöglichen
const save = function (showMessage = false) {
    // Toggle ist optional (siehe saveImmediate). Fehlt es → Save defaultet auf aktiv.
    const autosaveToggle = $('autosave-toggle');
    if (autosaveToggle && !autosaveToggle.checked)
        return;
    const updateSaveIndicator = window.updateSaveIndicator;
    updateSaveIndicator('saving');
    if (saveTimeout)
        clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(async () => {
        const STORAGE_KEY = window.STORAGE_KEY;
        const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
        const D = window.D;
        const ErrorHandler = window.ErrorHandler;
        const broadcastSave = window.broadcastSave;
        // Sichere JSON-Serialisierung
        let dataString;
        try {
            dataString = JSON.stringify(D);
        }
        catch (serializeError) {
            ErrorHandler.log('save', serializeError, 'JSON Serialisierung fehlgeschlagen');
            updateSaveIndicator('error');
            ErrorHandler.showError('Daten konnten nicht serialisiert werden');
            return;
        }
        const dataSizeMB = new Blob([dataString]).size / (1024 * 1024);
        const LS_LIMIT_MB = 5;
        try {
            // (D-01 / STAB-05) IDB-only-Pfad: LS-Schatten nach bestätigtem IDB-Write entfernen
            if (dataSizeMB > LS_LIMIT_MB) {
                await saveToIndexedDBFallback(key, dataString);
                StorageAPI.remove(key);
                StorageAPI.remove(key + '_ts');
                updateSaveIndicator('saved');
                broadcastSave();
                // (D-02) Sitzungs-Hinweis statt Per-Save-Toast
                if (!window._idbModeSeen) {
                    window._idbModeSeen = true;
                    showToast('💾 Kampagne im IndexedDB-Modus (>5MB). Daten sicher gespeichert.', 'info', 4000);
                }
                return;
            }
            const saveResult = StorageAPI.set(key, dataString);
            if (!saveResult.success) {
                throw new Error(saveResult.error);
            }
            // (D-01) Begleit-Timestamp setzen
            StorageAPI.set(key + '_ts', String(Date.now()));
            updateSaveIndicator('saved');
            broadcastSave();
            if (showMessage)
                showToast('💾 Gespeichert', 'success');
        }
        catch (e) {
            ErrorHandler.log('save', e, 'localStorage');
            // Fallback zu IndexedDB
            try {
                await saveToIndexedDBFallback(key, dataString);
                StorageAPI.remove(key + '_ts');
                updateSaveIndicator('saved');
                broadcastSave();
                showToast('💾 In IndexedDB gespeichert (localStorage voll)', 'warning');
            }
            catch (idbError) {
                ErrorHandler.log('save', idbError, 'IndexedDB Fallback');
                updateSaveIndicator('error');
                // (D-03) Laut bei IDB-Fehler
                showToast('❌ Speichern fehlgeschlagen! Daten gehen sonst verloren — JETZT exportieren!', 'error', 10000);
                if (typeof window.exportAllDataAsFile === 'function') {
                    window.exportAllDataAsFile();
                }
            }
        }
    }, 300);
};

// Export to global scope
window.save = save;
window.saveImmediate = saveImmediate;
window.loadFromIndexedDBFallbackRaw = loadFromIndexedDBFallbackRaw;
// Note: load() and loadFromBackup() are defined in systems/backups.js
