/**
 * Inventar-Kategorien für Loot und Items
 * @type {Object.<string, string>}
 */
declare const CATS: {
    weapons: string;
    armor: string;
    potions: string;
    scrolls: string;
    gems: string;
    rings: string;
    amulets: string;
    wondrous: string;
    misc: string;
};
/**
 * Link-Kategorien für externe Ressourcen
 * @type {Object.<string, string>}
 */
declare const LINK_CATS: {
    rules: string;
    tools: string;
    maps: string;
    music: string;
    images: string;
    other: string;
};
/**
 * D&D 5e Zustände (Conditions) mit deutschen Namen, Icons und Beschreibungen
 * @type {Object.<string, {name: string, icon: string, desc: string}>}
 */
declare const CONDITIONS: {
    blinded: {
        name: string;
        icon: string;
        desc: string;
    };
    charmed: {
        name: string;
        icon: string;
        desc: string;
    };
    deafened: {
        name: string;
        icon: string;
        desc: string;
    };
    frightened: {
        name: string;
        icon: string;
        desc: string;
    };
    grappled: {
        name: string;
        icon: string;
        desc: string;
    };
    incapacitated: {
        name: string;
        icon: string;
        desc: string;
    };
    invisible: {
        name: string;
        icon: string;
        desc: string;
    };
    paralyzed: {
        name: string;
        icon: string;
        desc: string;
    };
    petrified: {
        name: string;
        icon: string;
        desc: string;
    };
    poisoned: {
        name: string;
        icon: string;
        desc: string;
    };
    prone: {
        name: string;
        icon: string;
        desc: string;
    };
    restrained: {
        name: string;
        icon: string;
        desc: string;
    };
    stunned: {
        name: string;
        icon: string;
        desc: string;
    };
    unconscious: {
        name: string;
        icon: string;
        desc: string;
    };
    exhaustion: {
        name: string;
        icon: string;
        desc: string;
    };
    concentration: {
        name: string;
        icon: string;
        desc: string;
    };
};
/**
 * Verfügbare Tag-Farben (CSS-Variablen-Namen)
 * @type {string[]}
 */
declare const TAG_COLORS: string[];
/**
 * Condition-Farben für Initiative-Tracker Effekte
 * @type {Object.<string, string>}
 */
declare const CONDITION_COLORS: {
    blinded: string;
    charmed: string;
    deafened: string;
    frightened: string;
    grappled: string;
    incapacitated: string;
    invisible: string;
    paralyzed: string;
    petrified: string;
    poisoned: string;
    prone: string;
    restrained: string;
    stunned: string;
    unconscious: string;
    exhaustion: string;
    concentration: string;
};
/**
 * D&D 5e Schadenstypen mit Icons
 * @type {Object.<string, {name: string, icon: string}>}
 */
declare const DAMAGE_TYPES: {
    bludgeoning: {
        name: string;
        icon: string;
    };
    piercing: {
        name: string;
        icon: string;
    };
    slashing: {
        name: string;
        icon: string;
    };
    fire: {
        name: string;
        icon: string;
    };
    cold: {
        name: string;
        icon: string;
    };
    lightning: {
        name: string;
        icon: string;
    };
    thunder: {
        name: string;
        icon: string;
    };
    acid: {
        name: string;
        icon: string;
    };
    poison: {
        name: string;
        icon: string;
    };
    necrotic: {
        name: string;
        icon: string;
    };
    radiant: {
        name: string;
        icon: string;
    };
    psychic: {
        name: string;
        icon: string;
    };
    force: {
        name: string;
        icon: string;
    };
};
/**
 * D&D 5e Zauberschulen mit Icons
 * @type {Object.<string, {name: string, icon: string}>}
 */
declare const SPELL_SCHOOLS: {
    abjuration: {
        name: string;
        icon: string;
    };
    conjuration: {
        name: string;
        icon: string;
    };
    divination: {
        name: string;
        icon: string;
    };
    enchantment: {
        name: string;
        icon: string;
    };
    evocation: {
        name: string;
        icon: string;
    };
    illusion: {
        name: string;
        icon: string;
    };
    necromancy: {
        name: string;
        icon: string;
    };
    transmutation: {
        name: string;
        icon: string;
    };
};
/**
 * D&D 5e Attribute
 * @type {Object.<string, {name: string, abbr: string}>}
 */
declare const ATTRIBUTES: {
    str: {
        name: string;
        abbr: string;
    };
    dex: {
        name: string;
        abbr: string;
    };
    con: {
        name: string;
        abbr: string;
    };
    int: {
        name: string;
        abbr: string;
    };
    wis: {
        name: string;
        abbr: string;
    };
    cha: {
        name: string;
        abbr: string;
    };
};
/**
 * D&D Combat Constants
 * HP thresholds and death save limits
 * @type {Object}
 */
declare const COMBAT_CONSTANTS: {
    HP_CRITICAL_THRESHOLD: number;
    HP_BLOODIED_THRESHOLD: number;
    DEATH_SAVE_SUCCESSES: number;
    DEATH_SAVE_FAILURES: number;
};
/**
 * UI Timing Constants (in milliseconds)
 * Debounce and throttle delays for UI interactions
 * @type {Object}
 */
declare const UI_TIMING: {
    DM_SCREEN_SYNC_DELAY: number;
    AOE_UPDATE_DEBOUNCE: number;
    SELECTION_CHANGE_DEBOUNCE: number;
};
/**
 * D&D 5e Fertigkeiten mit zugehörigem Attribut (erweiterte Info)
 * Hinweis: SKILLS (ohne _INFO) existiert bereits mit anderer Struktur für Würfelsystem
 * @type {Object.<string, {name: string, attr: string}>}
 */
declare const SKILL_INFO: {
    acrobatics: {
        name: string;
        attr: string;
    };
    animalHandling: {
        name: string;
        attr: string;
    };
    arcana: {
        name: string;
        attr: string;
    };
    athletics: {
        name: string;
        attr: string;
    };
    deception: {
        name: string;
        attr: string;
    };
    history: {
        name: string;
        attr: string;
    };
    insight: {
        name: string;
        attr: string;
    };
    intimidation: {
        name: string;
        attr: string;
    };
    investigation: {
        name: string;
        attr: string;
    };
    medicine: {
        name: string;
        attr: string;
    };
    nature: {
        name: string;
        attr: string;
    };
    perception: {
        name: string;
        attr: string;
    };
    performance: {
        name: string;
        attr: string;
    };
    persuasion: {
        name: string;
        attr: string;
    };
    religion: {
        name: string;
        attr: string;
    };
    sleightOfHand: {
        name: string;
        attr: string;
    };
    stealth: {
        name: string;
        attr: string;
    };
    survival: {
        name: string;
        attr: string;
    };
};
/**
 * Seltenheitsstufen für magische Gegenstände
 * @type {Object.<string, {name: string, color: string}>}
 */
declare const RARITIES: {
    common: {
        name: string;
        color: string;
    };
    uncommon: {
        name: string;
        color: string;
    };
    rare: {
        name: string;
        color: string;
    };
    veryRare: {
        name: string;
        color: string;
    };
    legendary: {
        name: string;
        color: string;
    };
    artifact: {
        name: string;
        color: string;
    };
};
/**
 * Seltenheits-Labels (deutsche Namen) - verwendet lowercase keys für Loot-System
 * @type {Object.<string, string>}
 */
declare const RARITY_LABELS: {
    normal: string;
    common: string;
    uncommon: string;
    rare: string;
    veryrare: string;
    legendary: string;
};
/**
 * Seltenheits-Farben für Loot-System - verwendet lowercase keys
 * @type {Object.<string, string>}
 */
declare const RARITY_COLORS: {
    normal: string;
    common: string;
    uncommon: string;
    rare: string;
    veryrare: string;
    legendary: string;
};
/**
 * Herkunfts-Labels für Loot-Items
 * @type {Object.<string, string>}
 */
declare const ORIGIN_LABELS: {
    campaign: string;
    quest: string;
    summon: string;
    loot: string;
    find: string;
    purchase: string;
    gift: string;
    craft: string;
};
/**
 * Tag-Labels für Loot-Items mit Icons
 * @type {Object.<string, string>}
 */
declare const LOOT_TAG_LABELS: {
    weapon: string;
    armor: string;
    potion: string;
    scroll: string;
    ring: string;
    wand: string;
    rod: string;
    staff: string;
    wondrous: string;
    ammunition: string;
    focus: string;
    light: string;
    heavy: string;
    finesse: string;
    'two-handed': string;
    versatile: string;
    reach: string;
    thrown: string;
    loading: string;
    silvered: string;
    adamantine: string;
    'light-armor': string;
    'medium-armor': string;
    'heavy-armor': string;
    shield: string;
    attunement: string;
    charges: string;
    consumable: string;
    cursed: string;
    sentient: string;
    head: string;
    neck: string;
    back: string;
    body: string;
    hands: string;
    finger: string;
    waist: string;
    feet: string;
    fire: string;
    cold: string;
    lightning: string;
    acid: string;
    poison: string;
    necrotic: string;
    radiant: string;
    healing: string;
    tool: string;
    gemstone: string;
    art: string;
    container: string;
    key: string;
    document: string;
};
declare const INIT_CONSTANTS: {
    PERMANENT_DURATION: number;
    DEATH_SAVE_THRESHOLD: number;
    CONCENTRATION_DC_MIN: number;
    CONCENTRATION_DC_DIVISOR: number;
    D20_SIDES: number;
    ABILITY_MOD_BASE: number;
    ABILITY_MOD_DIVISOR: number;
};
declare const COMBATANT_TYPES: {
    PLAYER: string;
    ENEMY: string;
    ALLY: string;
    LAIR: string;
};
declare const MAP_CONSTANTS: {
    ZOOM: {
        min: number;
        max: number;
        factorIn: number;
        factorOut: number;
    };
    GRID: {
        defaultSize: number;
        minSize: number;
        maxSize: number;
        dndMeterConversion: number;
    };
    FOG: {
        defaultBrushSize: number;
        hideThreshold: number;
    };
    TOOLTIP_OFFSET: number;
    CONVERSIONS: {
        feetPerMeter: number;
        milesPerFeet: number;
        kmPerMeter: number;
        metersPerMile: number;
    };
    TRAVEL_SPEED_MH: number;
};
declare const MARKER_ICONS: {
    party: string;
    poi: string;
    danger: string;
    quest: string;
    item: string;
    secret: string;
    secretdoor: string;
    npc: string;
    action: string;
    encounter: string;
    entrance: string;
    exit: string;
    shop: string;
    blacksmith: string;
    house: string;
    tavern: string;
    inn: string;
    dicetest: string;
    ruins: string;
    magic: string;
    tower: string;
    lair: string;
    note: string;
};
/**
 * Icons für alle Entity-Typen (plural keys für Arrays/Listen)
 * @type {Object.<string, string>}
 */
declare const ENTITY_ICONS: {
    characters: string;
    npcs: string;
    locations: string;
    quests: string;
    encounters: string;
    spells: string;
    loot: string;
    wiki: string;
    shops: string;
    sessions: string;
};
/**
 * Icons für Entity-Links (unterstützt sowohl Singular als auch Plural)
 * Verwendet für [[type:id:name]] Pattern und Verlinkungen
 * @type {Object.<string, string>}
 */
declare const LINK_ICONS: {
    npcs: string;
    locations: string;
    quests: string;
    characters: string;
    encounters: string;
    spells: string;
    loot: string;
    wiki: string;
    npc: string;
    location: string;
    quest: string;
    character: string;
    encounter: string;
    spell: string;
    item: string;
};
/**
 * Typnamen für Entities (deutsche Labels)
 * @type {Object.<string, string>}
 */
declare const ENTITY_TYPE_NAMES: {
    npcs: string;
    locations: string;
    quests: string;
    characters: string;
    encounters: string;
    spells: string;
    loot: string;
    wiki: string;
};
type ConditionKey = keyof typeof CONDITIONS;
type TagColor = typeof TAG_COLORS[number];
//# sourceMappingURL=constants.d.ts.map