const STORAGE_KEY = window.APP_CONFIG.STORAGE_KEY;
function initializeData() {
    return {
        locations: [],
        npcs: [],
        quests: [],
        characters: [],
        sessionNotes: [],
        storyArcs: [],
        quickNotes: '',
        initiative: {
            combatants: [],
            currentTurn: 0,
            round: 1
        },
        loot: [],
        encounters: [],
        spells: [],
        links: [],
        wiki: [],
        filters: [],
        calendar: {
            day: 1,
            month: 0,
            year: 1492,
            events: []
        },
        tags: [],
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            enableMarkdownShortcuts: true,
            enableMarkdownImportExport: true,
            markdownOnboardingSeen: false,
            // Phase 6: Spieler-Verwaltung
            // 'xp' = XP-basierter Aufstieg | 'milestone' = manueller Level-Bump
            levelingMode: 'xp'
        },
        _nextId: {},
        // ============================================================
        // CHARAKTER-SCHEMA — Feldübersicht (alle Felder in saveCharacter/editChar)
        // ============================================================
        // Jedes character-Objekt in D.characters[] enthält (Phase 6 Ergänzungen):
        //   xp: Number (Standard 0) — kumulativer XP-Stand; Migration 5.0.0 backfills
        //   skillProficiencies: {} — Schlüssel = SKILL_INFO-Keys, Wert = true/false
        //   skillExpertise: {} — Schlüssel = SKILL_INFO-Keys, Wert = true (doppelter Übungsbonus)
        //   attacks: [] — Array von { name: string, attackBonus: number|string, damage: string, damageType?: string }
        // Bearbeitung und Lesen: party-crud.js (saveCharacter/editChar), Anzeige: party-details.js
        // Phase 3: Bestiary
        bestiary: [],            // Eigene Kreaturen (CRUD + Undo + Export)
        bestiaryFavorites: [],   // Nur ID-Keys (SRD: String-Key, Eigene: 'custom:123')
        // Phase 5: Welt & Story
        sessionPreps: [],        // WELT-01 Session-Prep-Assistent
        factions: [],            // WELT-05 Fraktionen & Ruf
        // Phase 7: Soundboard — Szenen-Konfiguration (Blobs NICHT in D — nur IDB)
        soundboard: {
            scenes: []           // [{ id, name, slot, tracks:[{ blobId, volume }] }]
        }
    };
}

// Initialize global D object
window.D = initializeData();

// Export functions
window.initializeData = initializeData;
