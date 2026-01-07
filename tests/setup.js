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
    randomTables: [],
    monsterFavorites: [],
    mindmap: { nodes: [], connections: [] },
    initiative: { combatants: [], currentTurn: 0, round: 1 },
    calendar: { day: 1, month: 0, year: 1492, events: [] },
    sessionNotes: [],
    quickNotes: '',
    tags: [],
    filters: [],
    settings: { theme: 'dark', lastView: 'dashboard' },
    dmScreenLayout: null,
    dmScreenNotes: '',
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
// Alias for backwards compatibility (renderInitiative doesn't exist in production)
global.renderInitiative = global.renderInit;
global.renderRandomTables = jest.fn();
global.renderTabContent = jest.fn();  // Tab registry system

// ============================================================
// ENCOUNTER CALCULATOR MOCKS
// ============================================================

global.CR_TO_XP = {
    "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
    "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
    "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
    "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
    "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000
};

// Calculator state
let calculatorMonsters = [];

global.calculatePartyThresholds = jest.fn(() => {
    const party = D.characters || [];
    if (party.length === 0) return { totalPCs: 0, easy: 0, medium: 0, hard: 0, deadly: 0 };
    return { totalPCs: party.length, easy: 100, medium: 200, hard: 300, deadly: 400 };
});

global.calculateMonsterXP = jest.fn(() => {
    if (calculatorMonsters.length === 0) return { baseXP: 0, finalXP: 0, multiplier: 1, totalMonsters: 0 };
    const baseXP = calculatorMonsters.reduce((sum, m) => sum + (CR_TO_XP[m.cr] || 0) * m.count, 0);
    return { baseXP, finalXP: baseXP, multiplier: 1, totalMonsters: calculatorMonsters.length };
});

global.getDifficulty = jest.fn((xp, thresholds) => {
    if (xp === 0) return { level: 'trivial', label: 'Trivial' };
    if (xp < thresholds.easy) return { level: 'trivial', label: 'Trivial' };
    if (xp < thresholds.medium) return { level: 'easy', label: 'Easy' };
    if (xp < thresholds.hard) return { level: 'medium', label: 'Medium' };
    if (xp < thresholds.deadly) return { level: 'hard', label: 'Hard' };
    return { level: 'deadly', label: 'Deadly' };
});

// ============================================================
// INITIATIVE MOCKS
// ============================================================

global.nextTurn = jest.fn(() => {
    if (!D.initiative.combatants || D.initiative.combatants.length === 0) return;
    D.initiative.currentTurn = (D.initiative.currentTurn + 1) % D.initiative.combatants.length;
    if (D.initiative.currentTurn === 0) D.initiative.round++;
});

global.prevTurn = jest.fn(() => {
    if (!D.initiative.combatants || D.initiative.combatants.length === 0) return;
    D.initiative.currentTurn--;
    if (D.initiative.currentTurn < 0) {
        D.initiative.currentTurn = D.initiative.combatants.length - 1;
        D.initiative.round = Math.max(1, D.initiative.round - 1);
    }
});

global.removeCombatant = jest.fn((id) => {
    if (!D.initiative.combatants) return;
    const idx = D.initiative.combatants.findIndex(c => c.id === id);
    if (idx === -1) return; // Gracefully handle non-existent ID
    D.initiative.combatants.splice(idx, 1);
});

// ============================================================
// MONSTER FAVORITES MOCKS
// ============================================================

global.loadMonsterFavorite = jest.fn((id) => {
    const fav = (D.monsterFavorites || []).find(f => f.id === id);
    if (!fav) return; // Gracefully handle non-existent ID
    calculatorMonsters = JSON.parse(JSON.stringify(fav.monsters));
});

global.deleteMonsterFavorite = jest.fn((id) => {
    if (!D.monsterFavorites) return;
    const idx = D.monsterFavorites.findIndex(f => f.id === id);
    if (idx === -1) return; // Gracefully handle non-existent ID
    D.monsterFavorites.splice(idx, 1);
});

global.saveMonsterFavorite = jest.fn(() => {
    if (calculatorMonsters.length === 0) {
        showToast('Füge zuerst Monster hinzu');
        return;
    }
    // In real impl, would prompt for name
});

// ============================================================
// ENTITY CRUD MOCKS
// ============================================================

global.deleteChar = jest.fn((id) => {
    const idx = D.characters.findIndex(c => c.id === id);
    if (idx === -1) return; // Gracefully handle non-existent ID
    D.characters.splice(idx, 1);
});

global.deleteNpc = jest.fn((id) => {
    const idx = D.npcs.findIndex(n => n.id === id);
    if (idx === -1) return; // Gracefully handle non-existent ID
    D.npcs.splice(idx, 1);
});

global.deleteLoc = jest.fn((id) => {
    const idx = D.locations.findIndex(l => l.id === id);
    if (idx === -1) return; // Gracefully handle non-existent ID
    D.locations.splice(idx, 1);
});

global.deleteQuest = jest.fn((id) => {
    const idx = D.quests.findIndex(q => q.id === id);
    if (idx === -1) return; // Gracefully handle non-existent ID
    D.quests.splice(idx, 1);
});

// Aliases for test compatibility
global.deleteCharacter = global.deleteChar;
global.deleteNPC = global.deleteNpc;
global.deleteLocation = global.deleteLoc;

// ============================================================
// ID GENERATION
// ============================================================

global.genId = jest.fn((prefix) => {
    if (!global.D._nextId[prefix]) {
        global.D._nextId[prefix] = 0;
    }
    return ++global.D._nextId[prefix];
});

// ============================================================
// SAVE/LOAD MOCKS (with proper error handling)
// ============================================================

// Custom JSON.stringify that handles circular references
const safeStringify = (obj) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Circular]';
            }
            seen.add(value);
        }
        return value;
    });
};

global.save = jest.fn(() => {
    try {
        localStorage.setItem(APP_CONFIG.STORAGE_KEY, safeStringify(D));
    } catch (e) {
        console.warn('[TEST] Save failed:', e.message);
    }
});

global.saveImmediate = jest.fn(() => {
    try {
        localStorage.setItem(APP_CONFIG.STORAGE_KEY, safeStringify(D));
    } catch (e) {
        console.warn('[TEST] SaveImmediate failed:', e.message);
    }
});

global.load = jest.fn(() => {
    const data = localStorage.getItem(APP_CONFIG.STORAGE_KEY);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            Object.assign(D, parsed);
        } catch (e) {
            console.warn('[TEST] Corrupted JSON, keeping defaults');
            // Keep current D structure intact
        }
    }
});

// Undo System Mocks
let undoStack = [];
let redoStack = [];

global.saveUndoState = jest.fn(() => {
    undoStack.push(JSON.parse(safeStringify(D)));
    if (undoStack.length > 30) undoStack.shift();
    redoStack = [];
});

global.pushUndo = jest.fn((label) => {
    global.saveUndoState();
});

global.undo = jest.fn(() => {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.parse(safeStringify(D)));
    const prev = undoStack.pop();
    Object.assign(D, prev);
});

global.redo = jest.fn(() => {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.parse(safeStringify(D)));
    const next = redoStack.pop();
    Object.assign(D, next);
});

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
        randomTables: [],
        monsterFavorites: [],
        mindmap: { nodes: [], connections: [] },
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        calendar: { day: 1, month: 0, year: 1492, events: [] },
        sessionNotes: [],
        quickNotes: '',
        tags: [],
        filters: [],
        settings: { theme: 'dark', lastView: 'dashboard' },
        dmScreenLayout: null,
        dmScreenNotes: '',
        _nextId: {}
    };

    // Calculator state zurücksetzen
    calculatorMonsters = [];

    // Undo/Redo stacks zurücksetzen
    undoStack = [];
    redoStack = [];

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
