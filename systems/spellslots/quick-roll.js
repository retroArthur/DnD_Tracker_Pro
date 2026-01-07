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
    if (isCrit) msg = '🎉 Kritisch! d20: 20';
    if (isFail) msg = '💀 Patzer! d20: 1';
    
    showToast(msg);
    
    // Zur Würfelhistorie hinzufügen
    D.diceHistory = D.diceHistory || [];
    D.diceHistory.unshift({ dice: `d${sides}`, result, timestamp: Date.now() });
    if (D.diceHistory.length > 50) D.diceHistory = D.diceHistory.slice(0, 50);
}

async function load() {
    const key = window.STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    try {
        let s = StorageAPI.get(key, null);
        
        // Fallback zu IndexedDB wenn localStorage leer
        if (!s) {
            try {
                s = await loadFromIndexedDBFallback(key);
                if (s) {
                    log('[LOAD] Daten aus IndexedDB geladen');
                    showToast('💾 Kampagne aus IndexedDB geladen', 'info', 3000);
                }
            } catch(e) {
                log('[LOAD] Keine Daten in IndexedDB:', e.message);
            }
        }
        
        if (s) {
            // Sichere JSON-Parse
            let p;
            try {
                p = JSON.parse(s);
            } catch (parseError) {
                ErrorHandler.log('load', parseError, 'JSON Parse fehlgeschlagen');
                ErrorHandler.showError('Kampagnendaten sind beschädigt');
                return;
            }
            
            // Prüfe auf valides Objekt
            if (!p || typeof p !== 'object') {
                ErrorHandler.log('load', new Error('Ungültige Datenstruktur'));
                return;
            }
            
            // Versionierung und Migration
            if (!p._version || compareVersions(p._version, CURRENT_VERSION) < 0) {
                log(`[LOAD] Migriere Daten von ${p._version || 'unbekannt'} auf ${CURRENT_VERSION}`);
                try {
                    p = migrateData(p);
                } catch (migrateError) {
                    ErrorHandler.log('load', migrateError, 'Migration fehlgeschlagen');
                    // Fahre trotzdem fort mit unmigierten Daten
                }
            }

            // Merge imported data into D (D is now const, cannot reassign)
            Object.assign(window.D, p);

            if (!D.encounters) D.encounters = [];
            if (!D.spells) D.spells = [];
            if (!D.links) D.links = [];
            if (!D.filters) D.filters = [];
            if (!D.mindmap) D.mindmap = { nodes: [], connections: [] };
            if (!D.calendar) D.calendar = { day: 1, month: 4, year: 1492, events: [] };
            if (!D._nextId) D._nextId = {};

            // Setze aktuelle Version
            D._version = CURRENT_VERSION;

            // Validiere Datenintegrität
            const validation = validateDataIntegrity();
            if (!validation.valid) {
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler.log('load', new Error('Data repairs performed'), validation.repairs.join('; '));
                }
                // Speichere reparierte Daten
                setTimeout(() => save(), 1000);
            }

            // Pre-compute spellClasses arrays for performance
            if (D.spells && Array.isArray(D.spells)) {
                D.spells.forEach(spell => {
                    // Pre-compute spellClasses array from comma-separated string
                    if (spell.spellClass && !spell.spellClasses) {
                        spell.spellClasses = spell.spellClass.split(',').map(c => c.trim());
                    }
                });
            }
        }
    } catch(e) { 
        ErrorHandler.log('load', e);
        ErrorHandler.showError('Fehler beim Laden der Kampagne');
    }
}

function exportAllDataAsFile() {
    try {
        const exp = { ...D }; delete exp._nextId;

        // Kampagnennamen hinzufügen
        const index = getCampaignIndex();
        if (index.active === APP_CONFIG.STORAGE_KEY) {
            exp._campaignName = 'Standard-Kampagne';
        } else {
            const campaign = index.campaigns.find(c => c.key === index.active);
            exp._campaignName = campaign?.name || 'Unbenannte Kampagne';
        }
        exp._exportDate = new Date().toISOString();
        exp._version = '2.11';

        const filename = exp._campaignName.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '-');
        const json = JSON.stringify(exp, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);

        showToast('📁 Daten exportiert');
    } catch (err) {
        showToast('❌ Export fehlgeschlagen: ' + err.message, 'error');
        console.error('[Export] Error:', err);
    }
}

// ============================================================
