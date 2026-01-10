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
        mindmap: {
            nodes: [],
            connections: []
        },
        calendar: {
            day: 1,
            month: 0,
            year: 1492,
            events: []
        },
        tags: [],
        settings: {
            theme: 'dark',
            lastView: 'dashboard'
        },
        _nextId: {}
    };
}

// Initialize global D object
window.D = initializeData();

// Export functions
window.initializeData = initializeData;
//# sourceMappingURL=data.js.map