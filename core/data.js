const STORAGE_KEY = APP_CONFIG.STORAGE_KEY;
function initializeData() {
    return {
        locations: [],
        npcs: [],
        quests: [],
        characters: [],
        sessionNotes: [],
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
//# sourceMappingURL=data.js.map