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
            markdownOnboardingSeen: false
        },
        _nextId: {},
        // Phase 3: Bestiary
        bestiary: [],            // Eigene Kreaturen (CRUD + Undo + Export)
        bestiaryFavorites: [],   // Nur ID-Keys (SRD: String-Key, Eigene: 'custom:123')
        // Phase 5: Welt & Story
        sessionPreps: [],        // WELT-01 Session-Prep-Assistent
        factions: []             // WELT-05 Fraktionen & Ruf
    };
}

// Initialize global D object
window.D = initializeData();

// Export functions
window.initializeData = initializeData;
