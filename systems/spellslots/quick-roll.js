// [SECTION:QUICK_ROLL]
// Extrahiert aus spellslots.js
// Quick Roll System
// Zeilen: 113
// Quick Roll für Keyboard Shortcuts
function quickRoll(sides) {
    const result = Math.floor(Math.random() * sides) + 1;
    const isCrit = sides === 20 && result === 20;
    const isFail = sides === 20 && result === 1;
    let msg = `🎲 d${sides}: ${result}`;
    if (isCrit)
        msg = '🎉 Kritisch! d20: 20';
    if (isFail)
        msg = '💀 Patzer! d20: 1';
    showToast(msg);
    // Zur Würfelhistorie hinzufügen
    const D = window.D;
    D.diceHistory = D.diceHistory || [];
    D.diceHistory.unshift({ dice: `d${sides}`, result, timestamp: Date.now() });
    if (D.diceHistory.length > 50)
        D.diceHistory = D.diceHistory.slice(0, 50);
}
// (D-07) Zeige Konflikts-Dialog wenn LS-Schatten (ohne _ts) und neuere IDB-Daten existieren.
// Feuert NICHT wenn Inhalt identisch ist (kein unnötiger Dialog am Spieltisch).
function showStorageConflictDialog(lsData, idbData, onUseLS, onUseIDB) {
    // Identischer Inhalt: kein Dialog nötig
    if (lsData === idbData) {
        if (typeof onUseLS === 'function') onUseLS();
        return;
    }
    // Konflikts-Dialog anzeigen
    if (typeof window.showStorageConflictDialog === 'function') {
        window.showStorageConflictDialog(lsData, idbData, onUseLS, onUseIDB);
    } else {
        // Fallback: IDB-Daten bevorzugen (neuere Quelle)
        if (typeof onUseIDB === 'function') onUseIDB();
    }
}
window.showStorageConflictDialogInternal = showStorageConflictDialog;
async function load() {
    const STORAGE_KEY = window.STORAGE_KEY;
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    const D = window.D;
    const ErrorHandler = window.ErrorHandler;
    const APP_CONFIG = window.APP_CONFIG;
    const CURRENT_VERSION = APP_CONFIG.VERSION;
    try {
        let s = StorageAPI.get(key, null);
        const lsTimestamp = StorageAPI.get(key + '_ts', null);
        // (D-01/D-07) Stale-Shadow-Detection: LS vorhanden, aber ohne _ts
        // → prüfe ob IDB neuere Daten hat
        if (s && !lsTimestamp) {
            try {
                const idbRecord = await window.loadFromIndexedDBFallbackRaw(key);
                if (idbRecord && idbRecord.data && idbRecord.data !== s) {
                    // IDB hat andere (neuere) Daten — Konflikts-Dialog
                    showStorageConflictDialog(
                        s,
                        idbRecord.data,
                        () => { /* LS-Daten nutzen — s bleibt unverändert */ },
                        () => { s = idbRecord.data; }
                    );
                }
                // Identischer Inhalt: kein Dialog, s bleibt (kein Datenverlust)
            }
            catch (e) {
                // IDB nicht verfügbar — LS-Daten nutzen
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler && ErrorHandler.log('load', e, '[D-07] IDB-Konfliktprüfung fehlgeschlagen');
                }
            }
        }
        // Fallback zu IndexedDB wenn localStorage leer
        if (!s) {
            try {
                const loadFromIndexedDBFallback = window.loadFromIndexedDBFallback;
                s = await loadFromIndexedDBFallback(key);
                if (s) {
                    if (APP_CONFIG.DEBUG_MODE) {
                        ErrorHandler && ErrorHandler.log('load', null, '[LOAD] Daten aus IndexedDB geladen');
                    }
                    showToast('💾 Kampagne aus IndexedDB geladen', 'info', 3000);
                }
            }
            catch (e) {
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler && ErrorHandler.log('load', e, '[LOAD] Keine Daten in IndexedDB');
                }
            }
        }
        if (s) {
            // Sichere JSON-Parse
            let p;
            try {
                p = JSON.parse(s);
            }
            catch (parseError) {
                ErrorHandler.log('load', parseError, 'JSON Parse fehlgeschlagen');
                ErrorHandler.showError('Kampagnendaten sind beschädigt');
                return;
            }
            // Prüfe auf valides Objekt
            if (!p || typeof p !== 'object') {
                ErrorHandler.log('load', new Error('Ungültige Datenstruktur'));
                return;
            }
            // (D-05/STAB-06) Legacy-Stempel-Normalisierung: '2.11' wurde fälschlicherweise
            // als "neuer als 2.6.x" behandelt (compareVersions: 11 > 6).
            // Normalisierung auf '2.0.0' stellt sicher, dass Migration korrekt ausgeführt wird.
            if (p._version === '2.11') {
                p._version = '2.0.0';
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler && ErrorHandler.log('load', null, '[LOAD] Legacy-Stempel 2.11 auf 2.0.0 normalisiert');
                }
            }
            // Versionierung und Migration
            if (!p._version || compareVersions(p._version, CURRENT_VERSION) < 0) {
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler && ErrorHandler.log('load', null, `[LOAD] Migriere von ${p._version || 'unbekannt'} auf ${CURRENT_VERSION}`);
                }
                try {
                    p = migrateData(p);
                }
                catch (migrateError) {
                    ErrorHandler.log('load', migrateError, 'Migration fehlgeschlagen');
                    // Fahre trotzdem fort mit unmigierten Daten
                }
            }
            // Merge imported data into D (D is now const, cannot reassign)
            Object.assign(D, p);
            if (!D.encounters)
                D.encounters = [];
            if (!D.spells)
                D.spells = [];
            if (!D.links)
                D.links = [];
            if (!D.filters)
                D.filters = [];
            if (!D.calendar)
                D.calendar = { day: 1, month: 4, year: 1492, events: [] };
            if (!D._nextId)
                D._nextId = {};
            // Setze aktuelle Version
            D._version = CURRENT_VERSION;
            // Validiere Datenintegrität
            const validateDataIntegrity = window.validateDataIntegrity;
            const validation = validateDataIntegrity();
            if (!validation.valid) {
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler.log('load', new Error('Data repairs performed'), validation.repairs.join('; '));
                }
                // Speichere reparierte Daten
                const save = window.save;
                setTimeout(() => save(), 1000);
            }
            // Pre-compute spellClasses arrays for performance
            if (D.spells && Array.isArray(D.spells)) {
                D.spells.forEach((spell) => {
                    // Pre-compute spellClasses array from comma-separated string
                    if (spell.spellClass && !spell.spellClasses) {
                        spell.spellClasses = spell.spellClass.split(',').map((c) => c.trim());
                    }
                });
            }
        }
    }
    catch (e) {
        ErrorHandler.log('load', e);
        ErrorHandler.showError('Fehler beim Laden der Kampagne');
    }
}
function exportAllDataAsFile() {
    const D = window.D;
    const APP_CONFIG = window.APP_CONFIG;
    try {
        const exp = { ...D };
        delete exp._nextId;
        // Kampagnennamen hinzufügen
        const getCampaignIndex = window.getCampaignIndex;
        const index = getCampaignIndex();
        if (index.active === APP_CONFIG.STORAGE_KEY) {
            exp._campaignName = 'Standard-Kampagne';
        }
        else {
            const campaign = index.campaigns.find((c) => c.key === index.active);
            exp._campaignName = campaign?.name || 'Unbenannte Kampagne';
        }
        exp._exportDate = new Date().toISOString();
        // (D-05/STAB-06) Dynamische Versionsnummer statt hartkodiertem Stempel '2.11'
        exp._version = APP_CONFIG.VERSION;
        const filename = exp._campaignName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '-');
        const json = JSON.stringify(exp, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('📁 Daten exportiert');
    }
    catch (err) {
        showToast('❌ Export fehlgeschlagen: ' + err.message, 'error');
        console.error('[Export] Error:', err);
    }
}
// ============================================================
