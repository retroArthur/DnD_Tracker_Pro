// [SECTION:VERSION_MIGRATION]
// Extrahiert aus spellslots.js
// Versionierung & Migration
// Zeilen: 86
// VERSIONIERUNG & MIGRATION
// ============================================================
// Alias für Rückwärtskompatibilität
const CURRENT_VERSION = window.APP_CONFIG.VERSION;
const MIGRATIONS = {
    '2.3.0': data => {
        // Migration von 2.2 auf 2.3
        // Conditions-Format ändern
        data.characters?.forEach(c => {
            if (c.conditions && Array.isArray(c.conditions)) {
                // Altes Format: [{type: 'poisoned', ...}] -> Neues Format: ['poisoned']
                if (c.conditions[0] && typeof c.conditions[0] === 'object') {
                    c.conditions = c.conditions.map(cond => cond.type || cond);
                }
            }
        });
        return data;
    },
    '2.4.0': data => {
        // Migration auf 2.4
        // Zauberslots initialisieren
        const getSpellSlotsForClass = window.getSpellSlotsForClass;
        data.characters?.forEach(c => {
            if (!c.spellSlotsMax) {
                c.spellSlotsMax = getSpellSlotsForClass(c.characterClass, c.level || 1);
            }
            if (!c.spellSlotsUsed) {
                c.spellSlotsUsed = [0, 0, 0, 0, 0, 0, 0, 0, 0];
            }
        });
        // Kalender initialisieren
        if (!data.calendar) {
            data.calendar = {
                day: 1,
                month: 4, // Mirtul
                year: 1492,
                events: []
            };
        }
        // Quest timestamps
        data.quests?.forEach(q => {
            if (!q.createdAt) {
                q.createdAt = Date.now();
            }
        });
        return data;
    },
    '2.6.1': data => {
        // STAB-02 / D-09: Smart-Strip — leere mindmap-Seeds still entfernen
        if (data.mindmap) {
            const hasRealContent =
                (data.mindmap.nodes && data.mindmap.nodes.length > 0) ||
                (data.mindmap.connections && data.mindmap.connections.length > 0);
            if (!hasRealContent) {
                delete data.mindmap; // leerer Seed -> still entfernen
            }
            // Echte Inhalte bleiben hier unangetastet — der Import-Pfad (import-export.js)
            // loest VOR migrateData() den Hinweis-Dialog + Export aus (D-09/D-10).
        }
        return data;
    }
};
function migrateData(data) {
    const dataVersion = data._version || '2.2.0';
    let currentData = data;
    const versions = Object.keys(MIGRATIONS).sort();
    const ErrorHandler = window.ErrorHandler;
    for (const version of versions) {
        if (compareVersions(dataVersion, version) < 0) {
            console.log(`[MIGRATION] Migriere von ${dataVersion} auf ${version}`);
            try {
                currentData = MIGRATIONS[version](currentData);
                currentData._version = version;
            } catch (e) {
                ErrorHandler.log('migrateData', e, `Migration failed for version ${version}`);
            }
        }
    }
    currentData._version = CURRENT_VERSION;
    return currentData;
}
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
        if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
    }
    return 0;
}
// ============================================================
