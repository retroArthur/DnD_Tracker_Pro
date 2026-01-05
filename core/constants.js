// [SECTION:DND_CONSTANTS]
// D&D 5e KONSTANTEN - @dnd @constants @rules
// ============================================================

/**
 * Inventar-Kategorien für Loot und Items
 * @type {Object.<string, string>}
 */
const CATS = Object.freeze({
    weapons: '⚔️ Waffen',
    armor: '🛡️ Rüstung',
    potions: '🧪 Tränke',
    scrolls: '📜 Schriftrollen',
    gems: '💎 Edelsteine',
    rings: '💍 Ringe',
    amulets: '📿 Amulette',
    wondrous: '✨ Wundersame Gegenstände',
    misc: '📦 Sonstiges'
});

/**
 * Link-Kategorien für externe Ressourcen
 * @type {Object.<string, string>}
 */
const LINK_CATS = Object.freeze({
    rules: '📖 Regeln',
    tools: '🛠️ Tools',
    maps: '🗺️ Karten',
    music: '🎵 Musik',
    images: '🖼️ Bilder',
    other: '📌 Sonstiges'
});

/**
 * D&D 5e Zustände (Conditions) mit deutschen Namen, Icons und Beschreibungen
 * @type {Object.<string, {name: string, icon: string, desc: string}>}
 */
const CONDITIONS = Object.freeze({
    blinded: { 
        name: 'Geblendet', 
        icon: '👁️', 
        desc: 'Kann nicht sehen. Auto-Fehlschlag bei Sicht-Würfen. Angriffe haben Nachteil, Angriffe gegen haben Vorteil.' 
    },
    charmed: { 
        name: 'Bezaubert', 
        icon: '💕', 
        desc: 'Kann den Bezaubernden nicht angreifen. Bezaubernder hat Vorteil bei sozialen Würfen.' 
    },
    deafened: { 
        name: 'Taub', 
        icon: '🔇', 
        desc: 'Kann nicht hören. Auto-Fehlschlag bei Hör-Würfen.' 
    },
    frightened: { 
        name: 'Verängstigt', 
        icon: '😨', 
        desc: 'Nachteil auf Würfe solange Quelle der Angst sichtbar. Kann sich nicht willentlich nähern.' 
    },
    grappled: { 
        name: 'Gepackt', 
        icon: '🤼', 
        desc: 'Geschwindigkeit 0. Endet wenn Packer kampfunfähig oder entfernt wird.' 
    },
    incapacitated: { 
        name: 'Kampfunfähig', 
        icon: '💫', 
        desc: 'Kann keine Aktionen oder Reaktionen ausführen.' 
    },
    invisible: { 
        name: 'Unsichtbar', 
        icon: '👻', 
        desc: 'Kann nicht gesehen werden. Angriffe haben Vorteil, Angriffe gegen haben Nachteil.' 
    },
    paralyzed: { 
        name: 'Gelähmt', 
        icon: '⚡', 
        desc: 'Kampfunfähig, kann nicht sprechen/bewegen. Auto-Fehlschlag STR/DEX Rettungswürfe. Angriffe haben Vorteil, Nahkampf-Treffer sind kritisch.' 
    },
    petrified: { 
        name: 'Versteinert', 
        icon: '🗿', 
        desc: 'In unbelebte Substanz verwandelt. Gewicht x10, altert nicht. Resistenz gegen allen Schaden.' 
    },
    poisoned: { 
        name: 'Vergiftet', 
        icon: '🤢', 
        desc: 'Nachteil auf Angriffs- und Fähigkeitswürfe.' 
    },
    prone: { 
        name: 'Liegend', 
        icon: '🛌', 
        desc: 'Kann nur kriechen. Nachteil auf Angriffe. Nahkampf hat Vorteil, Fernkampf hat Nachteil.' 
    },
    restrained: { 
        name: 'Festgesetzt', 
        icon: '⛓️', 
        desc: 'Geschwindigkeit 0. Angriffe haben Nachteil. Angriffe gegen haben Vorteil. Nachteil auf DEX-Rettungswürfe.' 
    },
    stunned: { 
        name: 'Betäubt', 
        icon: '💥', 
        desc: 'Kampfunfähig, kann nicht bewegen, kann nur stammeln. Auto-Fehlschlag STR/DEX. Angriffe haben Vorteil.' 
    },
    unconscious: { 
        name: 'Bewusstlos', 
        icon: '😵', 
        desc: 'Kampfunfähig, lässt alles fallen, fällt liegend. Auto-Fehlschlag STR/DEX. Angriffe haben Vorteil, Nahkampf kritisch.' 
    },
    exhaustion: { 
        name: 'Erschöpfung', 
        icon: '😩', 
        desc: 'Stufen 1-6 mit kumulativen Effekten. Stufe 6 = Tod.' 
    },
    concentration: { 
        name: 'Konzentration', 
        icon: '🎯', 
        desc: 'Hält einen Zauber aufrecht. Bei Schaden CON-Rettungswurf (min. 10 oder halber Schaden).' 
    }
});

/**
 * Verfügbare Tag-Farben (CSS-Variablen-Namen)
 * @type {string[]}
 */
const TAG_COLORS = Object.freeze([
    'red', 'green', 'blue', 'yellow', 'purple',
    'orange', 'pink', 'cyan', 'gold'
]);

/**
 * Condition-Farben für Initiative-Tracker Effekte
 * @type {Object.<string, string>}
 */
const CONDITION_COLORS = Object.freeze({
    blinded: 'red', charmed: 'purple', deafened: 'yellow', frightened: 'purple',
    grappled: 'purple', incapacitated: 'red', invisible: 'blue', paralyzed: 'red',
    petrified: 'red', poisoned: 'green', prone: 'yellow', restrained: 'red',
    stunned: 'red', unconscious: 'red', exhaustion: 'yellow', concentration: 'blue'
});

/**
 * D&D 5e Schadenstypen mit Icons
 * @type {Object.<string, {name: string, icon: string}>}
 */
const DAMAGE_TYPES = Object.freeze({
    bludgeoning: { name: 'Wucht', icon: '🔨' },
    piercing: { name: 'Stich', icon: '🗡️' },
    slashing: { name: 'Hieb', icon: '⚔️' },
    fire: { name: 'Feuer', icon: '🔥' },
    cold: { name: 'Kälte', icon: '❄️' },
    lightning: { name: 'Blitz', icon: '⚡' },
    thunder: { name: 'Donner', icon: '🔊' },
    acid: { name: 'Säure', icon: '🧪' },
    poison: { name: 'Gift', icon: '☠️' },
    necrotic: { name: 'Nekrotisch', icon: '💀' },
    radiant: { name: 'Strahlend', icon: '✨' },
    psychic: { name: 'Psychisch', icon: '🧠' },
    force: { name: 'Energie', icon: '💥' }
});

/**
 * D&D 5e Zauberschulen mit Icons
 * @type {Object.<string, {name: string, icon: string}>}
 */
const SPELL_SCHOOLS = Object.freeze({
    abjuration: { name: 'Bannmagie', icon: '🛡️' },
    conjuration: { name: 'Beschwörung', icon: '🌀' },
    divination: { name: 'Erkenntnismagie', icon: '👁️' },
    enchantment: { name: 'Verzauberung', icon: '💫' },
    evocation: { name: 'Hervorrufung', icon: '⚡' },
    illusion: { name: 'Illusion', icon: '🎭' },
    necromancy: { name: 'Nekromantie', icon: '💀' },
    transmutation: { name: 'Verwandlung', icon: '🔄' }
});

/**
 * D&D 5e Attribute
 * @type {Object.<string, {name: string, abbr: string}>}
 */
const ATTRIBUTES = Object.freeze({
    str: { name: 'Stärke', abbr: 'STR' },
    dex: { name: 'Geschicklichkeit', abbr: 'DEX' },
    con: { name: 'Konstitution', abbr: 'CON' },
    int: { name: 'Intelligenz', abbr: 'INT' },
    wis: { name: 'Weisheit', abbr: 'WIS' },
    cha: { name: 'Charisma', abbr: 'CHA' }
});

/**
 * D&D 5e Fertigkeiten mit zugehörigem Attribut (erweiterte Info)
 * Hinweis: SKILLS (ohne _INFO) existiert bereits mit anderer Struktur für Würfelsystem
 * @type {Object.<string, {name: string, attr: string}>}
 */
const SKILL_INFO = Object.freeze({
    acrobatics: { name: 'Akrobatik', attr: 'dex' },
    animalHandling: { name: 'Tierkunde', attr: 'wis' },
    arcana: { name: 'Arkane Kunde', attr: 'int' },
    athletics: { name: 'Athletik', attr: 'str' },
    deception: { name: 'Täuschung', attr: 'cha' },
    history: { name: 'Geschichte', attr: 'int' },
    insight: { name: 'Motiv erkennen', attr: 'wis' },
    intimidation: { name: 'Einschüchtern', attr: 'cha' },
    investigation: { name: 'Nachforschungen', attr: 'int' },
    medicine: { name: 'Heilkunde', attr: 'wis' },
    nature: { name: 'Naturkunde', attr: 'int' },
    perception: { name: 'Wahrnehmung', attr: 'wis' },
    performance: { name: 'Auftreten', attr: 'cha' },
    persuasion: { name: 'Überzeugen', attr: 'cha' },
    religion: { name: 'Religion', attr: 'int' },
    sleightOfHand: { name: 'Fingerfertigkeit', attr: 'dex' },
    stealth: { name: 'Heimlichkeit', attr: 'dex' },
    survival: { name: 'Überlebenskunst', attr: 'wis' }
});

/**
 * Seltenheitsstufen für magische Gegenstände
 * @type {Object.<string, {name: string, color: string}>}
 */
const RARITIES = Object.freeze({
    common: { name: 'Gewöhnlich', color: 'var(--text)' },
    uncommon: { name: 'Ungewöhnlich', color: 'var(--green)' },
    rare: { name: 'Selten', color: 'var(--blue)' },
    veryRare: { name: 'Sehr Selten', color: 'var(--purple)' },
    legendary: { name: 'Legendär', color: 'var(--orange)' },
    artifact: { name: 'Artefakt', color: 'var(--gold)' }
});

/**
 * Seltenheits-Labels (deutsche Namen) - verwendet lowercase keys für Loot-System
 * @type {Object.<string, string>}
 */
const RARITY_LABELS = Object.freeze({
    normal: 'Normal',
    common: 'Gewöhnlich',
    uncommon: 'Ungewöhnlich',
    rare: 'Selten',
    veryrare: 'Sehr selten',
    legendary: 'Legendär'
});

/**
 * Seltenheits-Farben für Loot-System - verwendet lowercase keys
 * @type {Object.<string, string>}
 */
const RARITY_COLORS = Object.freeze({
    normal: 'var(--text)',
    common: '#4ade80',
    uncommon: '#60a5fa',
    rare: '#a78bfa',
    veryrare: '#facc15',
    legendary: '#fb923c'
});

/**
 * Herkunfts-Labels für Loot-Items
 * @type {Object.<string, string>}
 */
const ORIGIN_LABELS = Object.freeze({
    campaign: '📜 Kampagne',
    quest: '🎯 Quest',
    summon: '✨ Beschwörung',
    loot: '💰 Loot',
    find: '🔍 Fund',
    purchase: '🛒 Kauf',
    gift: '🎁 Geschenk',
    craft: '🔨 Hergestellt'
});

/**
 * Tag-Labels für Loot-Items mit Icons
 * @type {Object.<string, string>}
 */
const LOOT_TAG_LABELS = Object.freeze({
    weapon: '⚔️ Waffe', armor: '🛡️ Rüstung', potion: '🧪 Trank', scroll: '📜 Schriftrolle', ring: '💍 Ring',
    wand: '🪄 Zauberstab', rod: '🏛️ Zepter', staff: '🪵 Stecken', wondrous: '✨ Wundersam', ammunition: '🏹 Munition', focus: '🔮 Fokus',
    light: '🪶 Leicht', heavy: '🏋️ Schwer', finesse: '⚡ Finesse', 'two-handed': '🙌 Zweihändig', versatile: '↔️ Vielseitig',
    reach: '📏 Reichweite', thrown: '🎯 Wurf', loading: '⏳ Laden', silvered: '🥈 Silber', adamantine: '💠 Adamant',
    'light-armor': '👕 Leichte Rüst.', 'medium-armor': '🦺 Mittlere Rüst.', 'heavy-armor': '🛡️ Schwere Rüst.', shield: '🔰 Schild',
    attunement: '🔮 Einstimmung', charges: '⚡ Ladungen', consumable: '💨 Verbrauchsgut', cursed: '💀 Verflucht', sentient: '🧠 Intelligent',
    head: '👑 Kopf', neck: '📿 Hals', back: '🧥 Rücken', body: '👔 Körper', hands: '🧤 Hände', finger: '💍 Finger', waist: '🎗️ Taille', feet: '👢 Füße',
    fire: '🔥 Feuer', cold: '❄️ Kälte', lightning: '⚡ Blitz', acid: '🧪 Säure', poison: '☠️ Gift', necrotic: '💀 Nekrotisch', radiant: '☀️ Strahlend', healing: '💚 Heilung',
    tool: '🔧 Werkzeug', gemstone: '💎 Edelstein', art: '🖼️ Kunstobjekt', container: '📦 Behälter', key: '🗝️ Schlüssel', document: '📄 Dokument'
});

// ============================================================
// INITIATIVE CONSTANTS
// ============================================================
const INIT_CONSTANTS = Object.freeze({
    PERMANENT_DURATION: 999,
    DEATH_SAVE_THRESHOLD: 3,
    CONCENTRATION_DC_MIN: 10,
    CONCENTRATION_DC_DIVISOR: 2,
    D20_SIDES: 20,
    ABILITY_MOD_BASE: 10,
    ABILITY_MOD_DIVISOR: 2
});

const COMBATANT_TYPES = Object.freeze({
    PLAYER: 'player',
    ENEMY: 'enemy',
    ALLY: 'ally',
    LAIR: 'lair'
});

// ============================================================
// MAP CONSTANTS
// ============================================================
const MAP_CONSTANTS = Object.freeze({
    ZOOM: { min: 0.1, max: 5, factorIn: 1.1, factorOut: 0.9 },
    GRID: { defaultSize: 50, minSize: 20, maxSize: 200, dndMeterConversion: 1.524 },
    FOG: { defaultBrushSize: 50, hideThreshold: 5 },
    TOOLTIP_OFFSET: 15,
    CONVERSIONS: { feetPerMeter: 3.28084, milesPerFeet: 5280, kmPerMeter: 1000, metersPerMile: 1609.34 },
    TRAVEL_SPEED_MH: 5000
});

const MARKER_ICONS = Object.freeze({
    party: '👥', poi: '📍', danger: '⚠️', quest: '📜', item: '💎',
    secret: '❓', secretdoor: '🚪', npc: '🧑', action: '⚡', encounter: '⚔️',
    entrance: '🚩', exit: '🏁', shop: '🛒', blacksmith: '⚒️', house: '🏠',
    tavern: '🍺', inn: '🛏️', dicetest: '🎲', ruins: '🏚️', magic: '✨',
    tower: '🗼', lair: '🐉', note: '📝'
});

// ============================================================
// ENTITY ICONS - Zentralisierte Icons für alle Entity-Typen
// ============================================================
/**
 * Icons für alle Entity-Typen (plural keys für Arrays/Listen)
 * @type {Object.<string, string>}
 */
const ENTITY_ICONS = Object.freeze({
    characters: '👥',
    npcs: '🎭',
    locations: '🏠',
    quests: '📜',
    encounters: '👹',
    spells: '✨',
    loot: '💎',
    wiki: '📖',
    shops: '🛒',
    sessions: '📓'
});

/**
 * Icons für Entity-Links (unterstützt sowohl Singular als auch Plural)
 * Verwendet für [[type:id:name]] Pattern und Verlinkungen
 * @type {Object.<string, string>}
 */
const LINK_ICONS = Object.freeze({
    // Plural forms (primär)
    npcs: '🎭',
    locations: '🏠',
    quests: '📜',
    characters: '👥',
    encounters: '👹',
    spells: '✨',
    loot: '💎',
    wiki: '📖',
    // Singular forms (für Kompatibilität)
    npc: '🎭',
    location: '🏠',
    quest: '📜',
    character: '👤',
    encounter: '⚔️',
    spell: '✨',
    item: '💎'
});

/**
 * Typnamen für Entities (deutsche Labels)
 * @type {Object.<string, string>}
 */
const ENTITY_TYPE_NAMES = Object.freeze({
    npcs: 'NPC',
    locations: 'Ort',
    quests: 'Quest',
    characters: 'Charakter',
    encounters: 'Gegner',
    spells: 'Zauber',
    loot: 'Item',
    wiki: 'Wiki'
});

// ============================================================
// EDITOR CONSTANTS
// ============================================================
const EDITOR_FONTS = Object.freeze({
    'arial': "Arial, Helvetica, sans-serif",
    'serif': "Georgia, 'Times New Roman', serif",
    'mono': "'Courier New', Consolas, monospace",
    'roboto': "Roboto, sans-serif",
    'inter': "Inter, sans-serif",
    'poppins': "Poppins, sans-serif",
    'source-sans': "'Source Sans Pro', sans-serif"
});

const READ_ALOUD_STYLES = Object.freeze({
    'parchment': { name: 'Pergament', icon: '📜' },
    'crimson': { name: 'Karmesin', icon: '🍷' },
    'violet': { name: 'Violett', icon: '🔮' },
    'sage': { name: 'Salbei', icon: '🌿' },
    'sky': { name: 'Himmel', icon: '☁️' },
    'slate': { name: 'Schiefer', icon: '🪨' }
});

const TOOLBAR_DIMENSIONS = Object.freeze({ width: 380, height: 80, padding: 10 });

const SPELLS_PER_PAGE = 50;

// ============================================================
// GLOBAL DATA OBJECT
// ============================================================
let D = {
    locations: [], npcs: [], quests: [], characters: [], sessionNotes: [], quickNotes: '',
    initiative: { combatants: [], currentTurn: 0, round: 1 },
    loot: [], items: [], encounters: [], spells: [], links: [], wiki: [],
    filters: [], mindmap: { nodes: [], connections: [] },
    calendar: { day: 1, month: 0, year: 1492, events: [] },
    tags: [], // Global tags system
    settings: { theme: 'dark', lastView: 'dashboard' },
    dmScreenLayout: null, // DM Screen widget layout
    dmScreenNotes: '', // DM Screen session notes
    _nextId: {}
};

let currentLootFilter = 'all';
let currentLocFilter = 'all';
let currentSpellFilter = 'all';
let currentSpellLevelFilter = 'all';
let currentSpellSchoolFilter = 'all';
let selectedNode = null;
let triggerCount = 0;

// View-Mode State (grid oder list)
let viewModes = {
    npcs: 'grid',
    locations: 'grid',
    encounters: 'grid'
};

// View-Mode Toggle Funktion
function setViewMode(type, mode) {
    if (!viewModes.hasOwnProperty(type)) {
        console.warn(`[setViewMode] Unknown type: ${type}`);
        return;
    }
    
    viewModes[type] = mode;
    
    // Buttons aktualisieren
    document.querySelectorAll(`[data-action="set-view-mode"][data-type="${type}"]`).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === mode);
    });
    
    // Entsprechende Render-Funktion aufrufen
    const renderMap = {
        npcs: () => typeof renderNPCList === 'function' && renderNPCList(),
        locations: () => typeof renderLocations === 'function' && renderLocations(),
        encounters: () => typeof renderEncounters === 'function' && renderEncounters()
    };
    
    if (renderMap[type]) {
        renderMap[type]();
    }
    
    log(`[ViewMode] ${type} → ${mode}`);
}