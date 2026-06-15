// TypeScript Migration: Converted from core/constants.js
// Note: window.D initialization moved to core/data.ts
// [SECTION:DND_CONSTANTS]
// D&D 5e KONSTANTEN - @dnd @constants @rules
// ============================================================
/**
 * Inventar-Kategorien für Loot und Items
 * @type {Object.<string, string>}
 */
const CATS = {
    weapons: '⚔️ Waffen',
    armor: '🛡️ Rüstung',
    potions: '🧪 Tränke',
    scrolls: '📜 Schriftrollen',
    gems: '💎 Edelsteine',
    rings: '💍 Ringe',
    amulets: '📿 Amulette',
    wondrous: '✨ Wundersame Gegenstände',
    misc: '📦 Sonstiges'
};
/**
 * Link-Kategorien für externe Ressourcen
 * @type {Object.<string, string>}
 */
const LINK_CATS = {
    rules: '📖 Regeln',
    tools: '🛠️ Tools',
    maps: '🗺️ Karten',
    music: '🎵 Musik',
    images: '🖼️ Bilder',
    other: '📌 Sonstiges'
};
/**
 * D&D 5e Zustände (Conditions) mit deutschen Namen, Icons und Beschreibungen
 * @type {Object.<string, {name: string, icon: string, desc: string}>}
 */
const CONDITIONS = {
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
};
/**
 * Verfügbare Tag-Farben (CSS-Variablen-Namen)
 * @type {string[]}
 */
const TAG_COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'gold'];
/**
 * Condition-Farben für Initiative-Tracker Effekte
 * @type {Object.<string, string>}
 */
const CONDITION_COLORS = {
    blinded: 'red',
    charmed: 'purple',
    deafened: 'yellow',
    frightened: 'purple',
    grappled: 'purple',
    incapacitated: 'red',
    invisible: 'blue',
    paralyzed: 'red',
    petrified: 'red',
    poisoned: 'green',
    prone: 'yellow',
    restrained: 'red',
    stunned: 'red',
    unconscious: 'red',
    exhaustion: 'yellow',
    concentration: 'blue'
};
/**
 * D&D 5e Schadenstypen mit Icons
 * @type {Object.<string, {name: string, icon: string}>}
 */
const DAMAGE_TYPES = {
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
};
/**
 * D&D 5e Zauberschulen mit Icons
 * @type {Object.<string, {name: string, icon: string}>}
 */
const SPELL_SCHOOLS = {
    abjuration: { name: 'Bannmagie', icon: '🛡️' },
    conjuration: { name: 'Beschwörung', icon: '🌀' },
    divination: { name: 'Erkenntnismagie', icon: '👁️' },
    enchantment: { name: 'Verzauberung', icon: '💫' },
    evocation: { name: 'Hervorrufung', icon: '⚡' },
    illusion: { name: 'Illusion', icon: '🎭' },
    necromancy: { name: 'Nekromantie', icon: '💀' },
    transmutation: { name: 'Verwandlung', icon: '🔄' }
};
/**
 * D&D 5e Attribute
 * @type {Object.<string, {name: string, abbr: string}>}
 */
const ATTRIBUTES = {
    str: { name: 'Stärke', abbr: 'STR' },
    dex: { name: 'Geschicklichkeit', abbr: 'DEX' },
    con: { name: 'Konstitution', abbr: 'CON' },
    int: { name: 'Intelligenz', abbr: 'INT' },
    wis: { name: 'Weisheit', abbr: 'WIS' },
    cha: { name: 'Charisma', abbr: 'CHA' }
};
/**
 * D&D Combat Constants
 * HP thresholds and death save limits
 * @type {Object}
 */
const COMBAT_CONSTANTS = {
    HP_CRITICAL_THRESHOLD: 25, // At or below 25% HP = critical
    HP_BLOODIED_THRESHOLD: 50, // At or below 50% HP = bloodied
    DEATH_SAVE_SUCCESSES: 3, // Successes needed to stabilize
    DEATH_SAVE_FAILURES: 3 // Failures = death
};
/**
 * UI Timing Constants (in milliseconds)
 * Debounce and throttle delays for UI interactions
 * @type {Object}
 */
const UI_TIMING = {
    DM_SCREEN_SYNC_DELAY: 150, // DM screen live-sync debounce
    AOE_UPDATE_DEBOUNCE: 50, // AoE target display update
    SELECTION_CHANGE_DEBOUNCE: 150 // Floating toolbar selection
};
/**
 * D&D 5e Fertigkeiten mit zugehörigem Attribut (erweiterte Info)
 * Hinweis: SKILLS (ohne _INFO) existiert bereits mit anderer Struktur für Würfelsystem
 * @type {Object.<string, {name: string, attr: string}>}
 */
const SKILL_INFO = {
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
};
/**
 * Seltenheitsstufen für magische Gegenstände
 * @type {Object.<string, {name: string, color: string}>}
 */
const RARITIES = {
    common: { name: 'Gewöhnlich', color: 'var(--text)' },
    uncommon: { name: 'Ungewöhnlich', color: 'var(--green)' },
    rare: { name: 'Selten', color: 'var(--blue)' },
    veryRare: { name: 'Sehr Selten', color: 'var(--purple)' },
    legendary: { name: 'Legendär', color: 'var(--orange)' },
    artifact: { name: 'Artefakt', color: 'var(--gold)' }
};
/**
 * Seltenheits-Labels (deutsche Namen) - verwendet lowercase keys für Loot-System
 * @type {Object.<string, string>}
 */
const RARITY_LABELS = {
    normal: 'Normal',
    common: 'Gewöhnlich',
    uncommon: 'Ungewöhnlich',
    rare: 'Selten',
    veryrare: 'Sehr selten',
    legendary: 'Legendär'
};
/**
 * Seltenheits-Farben für Loot-System - verwendet lowercase keys
 * @type {Object.<string, string>}
 */
const RARITY_COLORS = {
    normal: 'var(--text)',
    common: '#4ade80',
    uncommon: '#60a5fa',
    rare: '#a78bfa',
    veryrare: '#facc15',
    legendary: '#fb923c'
};
/**
 * Herkunfts-Labels für Loot-Items
 * @type {Object.<string, string>}
 */
const ORIGIN_LABELS = {
    campaign: '📜 Kampagne',
    quest: '🎯 Quest',
    summon: '✨ Beschwörung',
    loot: '💰 Loot',
    find: '🔍 Fund',
    purchase: '🛒 Kauf',
    gift: '🎁 Geschenk',
    craft: '🔨 Hergestellt'
};
/**
 * Tag-Labels für Loot-Items mit Icons
 * @type {Object.<string, string>}
 */
const LOOT_TAG_LABELS = {
    weapon: '⚔️ Waffe',
    armor: '🛡️ Rüstung',
    potion: '🧪 Trank',
    scroll: '📜 Schriftrolle',
    ring: '💍 Ring',
    wand: '🪄 Zauberstab',
    rod: '🏛️ Zepter',
    staff: '🪵 Stecken',
    wondrous: '✨ Wundersam',
    ammunition: '🏹 Munition',
    focus: '🔮 Fokus',
    light: '🪶 Leicht',
    heavy: '🏋️ Schwer',
    finesse: '⚡ Finesse',
    'two-handed': '🙌 Zweihändig',
    versatile: '↔️ Vielseitig',
    reach: '📏 Reichweite',
    thrown: '🎯 Wurf',
    loading: '⏳ Laden',
    silvered: '🥈 Silber',
    adamantine: '💠 Adamant',
    'light-armor': '👕 Leichte Rüst.',
    'medium-armor': '🦺 Mittlere Rüst.',
    'heavy-armor': '🛡️ Schwere Rüst.',
    shield: '🔰 Schild',
    attunement: '🔮 Einstimmung',
    charges: '⚡ Ladungen',
    consumable: '💨 Verbrauchsgut',
    cursed: '💀 Verflucht',
    sentient: '🧠 Intelligent',
    head: '👑 Kopf',
    neck: '📿 Hals',
    back: '🧥 Rücken',
    body: '👔 Körper',
    hands: '🧤 Hände',
    finger: '💍 Finger',
    waist: '🎗️ Taille',
    feet: '👢 Füße',
    fire: '🔥 Feuer',
    cold: '❄️ Kälte',
    lightning: '⚡ Blitz',
    acid: '🧪 Säure',
    poison: '☠️ Gift',
    necrotic: '💀 Nekrotisch',
    radiant: '☀️ Strahlend',
    healing: '💚 Heilung',
    tool: '🔧 Werkzeug',
    gemstone: '💎 Edelstein',
    art: '🖼️ Kunstobjekt',
    container: '📦 Behälter',
    key: '🗝️ Schlüssel',
    document: '📄 Dokument'
};
// ============================================================
// INITIATIVE CONSTANTS
// ============================================================
const INIT_CONSTANTS = {
    PERMANENT_DURATION: 999,
    DEATH_SAVE_THRESHOLD: 3,
    CONCENTRATION_DC_MIN: 10,
    CONCENTRATION_DC_DIVISOR: 2,
    D20_SIDES: 20,
    ABILITY_MOD_BASE: 10,
    ABILITY_MOD_DIVISOR: 2
};
const COMBATANT_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    ALLY: 'ally',
    LAIR: 'lair'
};
// ============================================================
// ENTITY ICONS - Zentralisierte Icons für alle Entity-Typen
// ============================================================
/**
 * Icons für alle Entity-Typen (plural keys für Arrays/Listen)
 * @type {Object.<string, string>}
 */
const ENTITY_ICONS = {
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
};
/**
 * Icons für Entity-Links (unterstützt sowohl Singular als auch Plural)
 * Verwendet für [[type:id:name]] Pattern und Verlinkungen
 * @type {Object.<string, string>}
 */
const LINK_ICONS = {
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
};
/**
 * Typnamen für Entities (deutsche Labels)
 * @type {Object.<string, string>}
 */
const ENTITY_TYPE_NAMES = {
    npcs: 'NPC',
    locations: 'Ort',
    quests: 'Quest',
    characters: 'Charakter',
    encounters: 'Gegner',
    spells: 'Zauber',
    loot: 'Item',
    wiki: 'Wiki'
};

// ============================================================
// MARKDOWN PATTERNS
// ============================================================
/**
 * Markdown syntax patterns for live shortcuts and parsing
 * @type {Object.<string, RegExp>}
 */
const MARKDOWN_PATTERNS = {
    BOLD: /(\*\*|__)((?:(?!\1).)+)\1/g,
    ITALIC: /(\*|_)((?:(?!\1).)+)\1/g,
    STRIKE: /(~~)((?:(?!\1).)+)\1/g,
    CODE: /(`)((?:(?!\1).)+)\1/g,
    HEADING: /^(#{1,6})\s+(.+)$/gm,
    LINK: /\[([^\]]+)\]\(([^\)]+)\)/g,
    BLOCKQUOTE: /^>\s+(.+)$/gm,
    LIST_ITEM: /^[-*]\s+(.+)$/gm,
    READ_ALOUD: /:::read-aloud\n([\s\S]*?)\n:::/g
};

// ============================================================
// PHASE 5: HARPTOS/FAERÛN-KALENDER-KONSTANTEN
// ============================================================
/**
 * Harptos-Kalender: 12 Monate à 30 Tage (Faerûn / Forgotten Realms)
 * Hammer = Monat 1 (1-basiert)
 * @type {Array<{nr: number, name: string, jahreszeit: string}>}
 */
const HARPTOS_MONTHS = [
    { nr: 1,  name: 'Hammer',    jahreszeit: 'winter'    },
    { nr: 2,  name: 'Alturiak',  jahreszeit: 'winter'    },
    { nr: 3,  name: 'Ches',      jahreszeit: 'fruehling' },
    { nr: 4,  name: 'Tarsakh',   jahreszeit: 'fruehling' },
    { nr: 5,  name: 'Mirtul',    jahreszeit: 'fruehling' },
    { nr: 6,  name: 'Kythorn',   jahreszeit: 'sommer'    },
    { nr: 7,  name: 'Flamerule', jahreszeit: 'sommer'    },
    { nr: 8,  name: 'Eleasis',   jahreszeit: 'sommer'    },
    { nr: 9,  name: 'Eleint',    jahreszeit: 'herbst'    },
    { nr: 10, name: 'Marpenoth', jahreszeit: 'herbst'    },
    { nr: 11, name: 'Uktar',     jahreszeit: 'herbst'    },
    { nr: 12, name: 'Nightal',   jahreszeit: 'winter'    }
];
/**
 * Harptos-Festtage (5 reguläre Intercalary-Tage)
 * Position: nach dem angegebenen Monat (nachMonat = 1-basierte Monatsnummer)
 * @type {Array<{name: string, nachMonat: number}>}
 */
const HARPTOS_FESTIVALS = [
    { name: 'Midwinter',          nachMonat: 1  },
    { name: 'Greengrass',         nachMonat: 4  },
    { name: 'Midsummer',          nachMonat: 7  },
    { name: 'Highharvestide',     nachMonat: 9  },
    { name: 'Feast of the Moon',  nachMonat: 11 }
];
/**
 * Jahreszeiten-Mapping: Harptos-Monatsnummer (1–12) → Jahreszeit-String
 * Festtage erben die Jahreszeit des Vormonats.
 * @type {Object.<number, string>}
 */
const HARPTOS_SEASONS = {
    1:  'winter',
    2:  'winter',
    3:  'fruehling',
    4:  'fruehling',
    5:  'fruehling',
    6:  'sommer',
    7:  'sommer',
    8:  'sommer',
    9:  'herbst',
    10: 'herbst',
    11: 'herbst',
    12: 'winter'
};

/**
 * PHB Charakteraufstieg: Kumulativer XP-Bedarf pro Stufe (D&D 5e, PHB S.15)
 * ACHTUNG: NICHT zu verwechseln mit XP_THRESHOLDS (Encounter-Schwierigkeit in encounter-calculator.js)
 * XP_THRESHOLDS = Begegnungsschwierigkeit (easy/medium/hard/deadly) — DMG S.82
 * XP_LEVEL_THRESHOLDS = Charakteraufstieg (Level 1→20) — PHB S.15
 * Index ist 0-basiert: XP_LEVEL_THRESHOLDS[0] = 0 (Level 1), XP_LEVEL_THRESHOLDS[1] = 300 (Level 2)
 * @type {number[]}
 */
const XP_LEVEL_THRESHOLDS = [
    0,       // Level 1  (Startpunkt)
    300,     // Level 2
    900,     // Level 3
    2700,    // Level 4
    6500,    // Level 5
    14000,   // Level 6
    23000,   // Level 7
    34000,   // Level 8
    48000,   // Level 9
    64000,   // Level 10
    85000,   // Level 11
    100000,  // Level 12
    120000,  // Level 13
    140000,  // Level 14
    165000,  // Level 15
    195000,  // Level 16
    225000,  // Level 17
    265000,  // Level 18
    305000,  // Level 19
    355000   // Level 20
];

// ============================================================
// NAMESPACE EXPORTS (neue Struktur)
// ============================================================
// D&D Spielregel-Konstanten
window.DND_RULES = Object.freeze({
    CONDITIONS,
    CONDITION_COLORS,
    DAMAGE_TYPES,
    SPELL_SCHOOLS,
    ATTRIBUTES,
    SKILL_INFO,
    RARITIES,
    RARITY_LABELS,
    RARITY_COLORS,
    COMBAT_CONSTANTS,
    INIT_CONSTANTS,
    COMBATANT_TYPES,
    CATS,
    LINK_CATS,
    ORIGIN_LABELS,
    LOOT_TAG_LABELS,
    TAG_COLORS,
    HARPTOS_MONTHS,
    HARPTOS_FESTIVALS,
    HARPTOS_SEASONS,
    XP_LEVEL_THRESHOLDS
});

// UI/App-Konstanten
window.UI_CONSTANTS = Object.freeze({
    UI_TIMING,
    ENTITY_ICONS,
    LINK_ICONS,
    ENTITY_TYPE_NAMES,
    MARKDOWN_PATTERNS
});

// ============================================================
// LEGACY EINZELEXPORTS (abwaertskompatibel, werden schrittweise entfernt)
// ============================================================
window.CATS = CATS;
window.LINK_CATS = LINK_CATS;
window.CONDITIONS = CONDITIONS;
window.TAG_COLORS = TAG_COLORS;
window.CONDITION_COLORS = CONDITION_COLORS;
window.DAMAGE_TYPES = DAMAGE_TYPES;
window.SPELL_SCHOOLS = SPELL_SCHOOLS;
window.ATTRIBUTES = ATTRIBUTES;
window.COMBAT_CONSTANTS = COMBAT_CONSTANTS;
window.UI_TIMING = UI_TIMING;
window.SKILL_INFO = SKILL_INFO;
window.RARITIES = RARITIES;
window.RARITY_LABELS = RARITY_LABELS;
window.RARITY_COLORS = RARITY_COLORS;
window.ORIGIN_LABELS = ORIGIN_LABELS;
window.LOOT_TAG_LABELS = LOOT_TAG_LABELS;
window.INIT_CONSTANTS = INIT_CONSTANTS;
window.COMBATANT_TYPES = COMBATANT_TYPES;
window.ENTITY_ICONS = ENTITY_ICONS;
window.LINK_ICONS = LINK_ICONS;
window.ENTITY_TYPE_NAMES = ENTITY_TYPE_NAMES;
window.MARKDOWN_PATTERNS = MARKDOWN_PATTERNS;
window.HARPTOS_MONTHS = HARPTOS_MONTHS;
window.HARPTOS_FESTIVALS = HARPTOS_FESTIVALS;
window.HARPTOS_SEASONS = HARPTOS_SEASONS;
window.XP_LEVEL_THRESHOLDS = XP_LEVEL_THRESHOLDS;
