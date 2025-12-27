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

let D = {
    locations: [], npcs: [], quests: [], characters: [], sessionNotes: [], quickNotes: '',
    initiative: { combatants: [], currentTurn: 0, round: 1 },
    loot: [], items: [], encounters: [], spells: [], links: [], wiki: [],
    filters: [], mindmap: { nodes: [], connections: [] },
    calendar: { day: 1, month: 0, year: 1492, events: [] },
    tags: [], // Global tags system
    settings: { theme: 'dark', lastView: 'dashboard' },
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