// [SECTION:QUICK_ROLL]
// Extrahiert aus spellslots.js
// Quick Roll System
// Zeilen: 113

import { StorageAPI } from '@utils/basic';
import { showToast } from '@utils/utilities';
import { compareVersions, migrateData } from './version-migration';

// Quick Roll für Keyboard Shortcuts
export function quickRoll(sides: number): void {
    const result = Math.floor(Math.random() * sides) + 1;
    const isCrit = sides === 20 && result === 20;
    const isFail = sides === 20 && result === 1;

    let msg = `🎲 d${sides}: ${result}`;
    if (isCrit) msg = '🎉 Kritisch! d20: 20';
    if (isFail) msg = '💀 Patzer! d20: 1';

    showToast(msg);

    // Zur Würfelhistorie hinzufügen
    const D = (window as any).D;
    D.diceHistory = D.diceHistory || [];
    D.diceHistory.unshift({ dice: `d${sides}`, result, timestamp: Date.now() });
    if (D.diceHistory.length > 50) D.diceHistory = D.diceHistory.slice(0, 50);
}

export async function load(): Promise<void> {
    const STORAGE_KEY = (window as any).STORAGE_KEY;
    const key = (window as any).STORAGE_KEY_OVERRIDE || STORAGE_KEY;
    const D = (window as any).D;
    const ErrorHandler = (window as any).ErrorHandler;
    const APP_CONFIG = (window as any).APP_CONFIG;
    const CURRENT_VERSION = APP_CONFIG.VERSION;

    try {
        let s = StorageAPI.get(key, null);

        // Fallback zu IndexedDB wenn localStorage leer
        if (!s) {
            try {
                const loadFromIndexedDBFallback = (window as any).loadFromIndexedDBFallback;
                s = await loadFromIndexedDBFallback(key);
                if (s) {
                    console.log('[LOAD] Daten aus IndexedDB geladen');
                    showToast('💾 Kampagne aus IndexedDB geladen', 'info', 3000);
                }
            } catch(e: any) {
                console.log('[LOAD] Keine Daten in IndexedDB:', e.message);
            }
        }

        if (s) {
            // Sichere JSON-Parse
            let p: any;
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
                console.log(`[LOAD] Migriere Daten von ${p._version || 'unbekannt'} auf ${CURRENT_VERSION}`);
                try {
                    p = migrateData(p);
                } catch (migrateError) {
                    ErrorHandler.log('load', migrateError, 'Migration fehlgeschlagen');
                    // Fahre trotzdem fort mit unmigierten Daten
                }
            }

            // Merge imported data into D (D is now const, cannot reassign)
            Object.assign(D, p);

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
            const validateDataIntegrity = (window as any).validateDataIntegrity;
            const validation = validateDataIntegrity();
            if (!validation.valid) {
                if (APP_CONFIG.DEBUG_MODE) {
                    ErrorHandler.log('load', new Error('Data repairs performed'), validation.repairs.join('; '));
                }
                // Speichere reparierte Daten
                const save = (window as any).save;
                setTimeout(() => save(), 1000);
            }

            // Pre-compute spellClasses arrays for performance
            if (D.spells && Array.isArray(D.spells)) {
                D.spells.forEach((spell: any) => {
                    // Pre-compute spellClasses array from comma-separated string
                    if (spell.spellClass && !spell.spellClasses) {
                        spell.spellClasses = spell.spellClass.split(',').map((c: string) => c.trim());
                    }
                });
            }
        }
    } catch(e) {
        ErrorHandler.log('load', e);
        ErrorHandler.showError('Fehler beim Laden der Kampagne');
    }
}

export function exportAllDataAsFile(): void {
    const D = (window as any).D;
    const APP_CONFIG = (window as any).APP_CONFIG;

    try {
        const exp: any = { ...D };
        delete exp._nextId;

        // Kampagnennamen hinzufügen
        const getCampaignIndex = (window as any).getCampaignIndex;
        const index = getCampaignIndex();
        if (index.active === APP_CONFIG.STORAGE_KEY) {
            exp._campaignName = 'Standard-Kampagne';
        } else {
            const campaign = index.campaigns.find((c: any) => c.key === index.active);
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
    } catch (err: any) {
        showToast('❌ Export fehlgeschlagen: ' + err.message, 'error');
        console.error('[Export] Error:', err);
    }
}

// ============================================================
