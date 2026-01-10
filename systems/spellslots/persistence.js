// [SECTION:PERSISTENCE]
// Extrahiert aus spellslots.js
// Save/Load Funktionen
// Zeilen: 164
// PERSISTENCE
// ============================================================
let saveTimeout = null;
// Sofortiges Speichern (für kritische Aktionen)
async function saveImmediate() {
    const autosaveToggle = $('autosave-toggle');
    if (!autosaveToggle?.checked)
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
        // Warnung bei Größenannäherung
        if (dataSizeMB > LS_WARNING_MB && dataSizeMB <= LS_LIMIT_MB) {
            console.warn(`[STORAGE] Datengröße nähert sich Limit: ${dataSizeMB.toFixed(2)}MB / ${LS_LIMIT_MB}MB`);
            showToast(`⚠️ Kampagne wird groß (${dataSizeMB.toFixed(1)}MB). Backup empfohlen!`, 'warning', 5000);
        }
        // Automatischer Fallback zu IndexedDB bei Überschreitung
        if (dataSizeMB > LS_LIMIT_MB) {
            console.warn(`[STORAGE] localStorage Limit überschritten (${dataSizeMB.toFixed(2)}MB). Fallback zu IndexedDB...`);
            await saveToIndexedDBFallback(key, dataString);
            updateSaveIndicator('saved');
            showToast('💾 Große Kampagne in IndexedDB gespeichert', 'success');
            broadcastSave();
            return;
        }
        // Normaler localStorage-Save
        const saveResult = StorageAPI.set(key, dataString);
        if (!saveResult.success) {
            // Fehler beim Speichern → werfe Error für catch-Block
            throw new Error(saveResult.error);
        }
        updateSaveIndicator('saved');
        broadcastSave();
        // Zusätzliches IndexedDB-Backup bei großen Daten (>2MB)
        if (dataSizeMB > 2) {
            saveToIndexedDBFallback(key, dataString).catch(e => console.log('[IDB Backup] Optional backup failed:', e));
        }
    }
    catch (e) {
        console.error('[STORAGE] localStorage save failed:', e);
        // Fallback zu IndexedDB bei Fehler
        try {
            await saveToIndexedDBFallback(key, dataString);
            updateSaveIndicator('saved');
            showToast('💾 In IndexedDB gespeichert (localStorage voll)', 'warning');
            broadcastSave();
        }
        catch (idbError) {
            console.error('[STORAGE] IndexedDB fallback failed:', idbError);
            updateSaveIndicator('error');
            showToast('❌ Speichern fehlgeschlagen! Daten exportieren empfohlen!', 'error', 8000);
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
// Load mit IndexedDB-Fallback
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
// Debounced Save (für häufige Änderungen)
// Als Variable definiert, um spätere Erweiterung (Decorator-Pattern) zu ermöglichen
const save = function (showMessage = false) {
    const autosaveToggle = $('autosave-toggle');
    if (!autosaveToggle?.checked)
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
            // Automatischer Fallback zu IndexedDB bei Überschreitung
            if (dataSizeMB > LS_LIMIT_MB) {
                await saveToIndexedDBFallback(key, dataString);
                updateSaveIndicator('saved');
                broadcastSave();
                if (showMessage)
                    showToast('💾 In IndexedDB gespeichert', 'success');
                return;
            }
            const saveResult = StorageAPI.set(key, dataString);
            if (!saveResult.success) {
                throw new Error(saveResult.error);
            }
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
                updateSaveIndicator('saved');
                broadcastSave();
                showToast('💾 In IndexedDB gespeichert (localStorage voll)', 'warning');
            }
            catch (idbError) {
                ErrorHandler.log('save', idbError, 'IndexedDB Fallback');
                updateSaveIndicator('error');
                ErrorHandler.showError('Speichern fehlgeschlagen!');
            }
        }
    }, 300);
};

// Export to global scope
window.save = save;
window.saveImmediate = saveImmediate;
window.load = load;
window.loadFromBackup = loadFromBackup;