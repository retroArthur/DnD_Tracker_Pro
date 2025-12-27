/**
 * Jest Test Setup
 * Initialisiert globale Variablen und Mocks für Tests
 */

// ============================================================
// GLOBALE VARIABLEN MOCKEN
// ============================================================

// APP_CONFIG Mock
global.APP_CONFIG = Object.freeze({
    VERSION: '2.7.0-test',
    DEBUG_MODE: false,
    PERF_MODE: false,
    STORAGE_KEY: 'dnd-tracker-test',
    BACKUP_KEY: 'dnd-tracker-backups-test',
    CAMPAIGN_INDEX_KEY: 'dnd-tracker-campaigns-test',
    THEME_KEY: 'dnd-tracker-theme-test',
    LAYOUT_KEY: 'dnd-tracker-layout-test',
    UNDO_LIMIT: 30,
    MAX_BACKUPS: 5,
    MAX_BACKUP_SIZE_MB: 2,
    BACKUP_INTERVAL: 5 * 60 * 1000,
    AUTOSAVE_DELAY: 1500,
    TOAST_DURATION: 2000,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 100,
    VIRTUAL_SCROLL_THRESHOLD: 50,
    LAZY_LOAD_THRESHOLD: '200px',
    MAX_LEVEL: 20,
    ATTRIBUTE_MIN: 1,
    ATTRIBUTE_MAX: 30,
});

// D (Daten) Mock - Leere Grundstruktur
global.D = {
    characters: [],
    npcs: [],
    locations: [],
    quests: [],
    encounters: [],
    loot: [],
    spells: [],
    wiki: [],
    links: [],
    shops: [],
    mindmap: { nodes: [], connections: [] },
    initiative: { combatants: [], currentTurn: 0, round: 1 },
    calendar: { day: 1, month: 0, year: 1492, events: [] },
    sessionNotes: [],
    quickNotes: '',
    tags: [],
    filters: [],
    settings: { theme: 'dark', lastView: 'dashboard' },
    _nextId: {}
};

// ============================================================
// DOM MOCKS
// ============================================================

// $ Funktion Mock
global.$ = jest.fn((id) => document.getElementById(id));

// $$ Funktion Mock
global.$$ = jest.fn((selector) => document.querySelectorAll(selector));

// ============================================================
// UTILITY MOCKS
// ============================================================

// esc Funktion
global.esc = jest.fn((s) => {
    if (s === null || s === undefined) return '';
    if (s === 0) return '0';
    if (!s) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
});

// sanitizeHTML Mock (vereinfacht)
global.sanitizeHTML = jest.fn((html) => {
    if (!html) return '';
    // Einfache Sanitization für Tests
    return html.replace(/<script[^>]*>.*?<\/script>/gi, '')
               .replace(/on\w+\s*=/gi, '');
});

// nextId Mock
global.nextId = jest.fn((type) => {
    if (!global.D._nextId[type]) {
        global.D._nextId[type] = 0;
    }
    return ++global.D._nextId[type];
});

// debounce Mock (sofortige Ausführung für Tests)
global.debounce = jest.fn((fn) => fn);

// throttle Mock (sofortige Ausführung für Tests)
global.throttle = jest.fn((fn) => fn);

// ============================================================
// STORAGE MOCKS
// ============================================================

// localStorage Mock
const localStorageMock = {
    store: {},
    getItem: jest.fn((key) => localStorageMock.store[key] || null),
    setItem: jest.fn((key, value) => {
        localStorageMock.store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
        delete localStorageMock.store[key];
    }),
    clear: jest.fn(() => {
        localStorageMock.store = {};
    }),
    get length() {
        return Object.keys(this.store).length;
    },
    key: jest.fn((index) => {
        const keys = Object.keys(localStorageMock.store);
        return keys[index] || null;
    })
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// ============================================================
// UI MOCKS
// ============================================================

global.showToast = jest.fn();
global.showModal = jest.fn();
global.hideModal = jest.fn();

// ============================================================
// RENDER MOCKS
// ============================================================

global.renderAll = jest.fn();
global.renderParty = jest.fn();
global.renderNPCList = jest.fn();
global.renderLocations = jest.fn();
global.renderQuests = jest.fn();
global.renderEncounters = jest.fn();
global.renderLoot = jest.fn();
global.renderSpells = jest.fn();
global.renderInit = jest.fn();

// ============================================================
// SAVE/LOAD MOCKS
// ============================================================

global.save = jest.fn(() => {
    localStorage.setItem(APP_CONFIG.STORAGE_KEY, JSON.stringify(D));
});

global.load = jest.fn(() => {
    const data = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (data) {
        Object.assign(D, JSON.parse(data));
    }
});

global.pushUndo = jest.fn();
global.undo = jest.fn();
global.redo = jest.fn();

// ============================================================
// HELPER FUNKTIONEN FÜR TESTS
// ============================================================

/**
 * Reset alle Mocks und Daten
 */
global.resetTestState = () => {
    // D zurücksetzen
    global.D = {
        characters: [],
        npcs: [],
        locations: [],
        quests: [],
        encounters: [],
        loot: [],
        spells: [],
        wiki: [],
        links: [],
        shops: [],
        mindmap: { nodes: [], connections: [] },
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        calendar: { day: 1, month: 0, year: 1492, events: [] },
        sessionNotes: [],
        quickNotes: '',
        tags: [],
        filters: [],
        settings: { theme: 'dark', lastView: 'dashboard' },
        _nextId: {}
    };
    
    // localStorage leeren
    localStorage.clear();
    
    // Alle Mock-Aufrufe zurücksetzen
    jest.clearAllMocks();
};

/**
 * Erstellt einen Test-Character
 */
global.createTestCharacter = (overrides = {}) => {
    return {
        id: nextId('characters'),
        name: 'Test Hero',
        playerName: 'Tester',
        characterClass: 'Kämpfer',
        subclass: '',
        race: 'Mensch',
        level: 5,
        background: 'Soldat',
        alignment: 'LG',
        weight: 80,
        height: 180,
        attributes: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
        saveProficiencies: { str: true, dex: false, con: true, int: false, wis: false, cha: false },
        hpCurrent: 44,
        hpMax: 44,
        tempHp: 0,
        armorClass: 18,
        initiative: 2,
        speed: '9m',
        proficiencyBonus: 3,
        hitDice: '5d10',
        passivePerception: 11,
        inspiration: false,
        resistances: [],
        immunities: [],
        languages: ['Gemein'],
        spellSlots: {},
        currency: { pm: 0, gm: 50, em: 0, sm: 10, km: 5 },
        notes: '',
        avatar: '',
        ...overrides
    };
};

/**
 * Erstellt einen Test-NPC
 */
global.createTestNPC = (overrides = {}) => {
    return {
        id: nextId('npcs'),
        name: 'Test NPC',
        role: 'Händler',
        race: 'Mensch',
        locationId: null,
        chapter: '',
        filterId: null,
        quests: [],
        info: [],
        relationships: [],
        description: 'Ein Test-NPC',
        triggers: [],
        dialogs: [],
        ...overrides
    };
};

/**
 * Erstellt einen Test-Encounter
 */
global.createTestEncounter = (overrides = {}) => {
    return {
        id: nextId('encounters'),
        name: 'Goblin',
        creatureType: 'Humanoid',
        cr: '1/4',
        ac: 15,
        init: 2,
        hp: 7,
        speed: '9m',
        perception: 9,
        str: '8/-1',
        dex: '14/+2',
        con: '10/+0',
        int: '10/+0',
        wis: '8/-1',
        cha: '8/-1',
        languages: ['Gemein', 'Goblin'],
        traits: '',
        equipment: 'Krummsäbel',
        actions: 'Krummsäbel: +4, 1d6+2',
        ...overrides
    };
};

// ============================================================
// BEFORE EACH HOOK
// ============================================================

beforeEach(() => {
    resetTestState();
});

// ============================================================
// CONSOLE UNTERDRÜCKUNG (optional)
// ============================================================

// Unterdrücke console.log in Tests (außer Fehler)
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn()
// };
