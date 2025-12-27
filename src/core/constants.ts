/**
 * D&D Tracker - D&D 5e Constants (TypeScript)
 * @module core/constants
 * @version 2.7.0
 */

// ============================================================
// INVENTORY CATEGORIES
// ============================================================

export const INVENTORY_CATEGORIES = Object.freeze({
    weapons: '⚔️ Waffen',
    armor: '🛡️ Rüstung',
    potions: '🧪 Tränke',
    scrolls: '📜 Schriftrollen',
    gems: '💎 Edelsteine',
    rings: '💍 Ringe',
    amulets: '📿 Amulette',
    wondrous: '✨ Wundersame Gegenstände',
    misc: '📦 Sonstiges'
} as const);

export type InventoryCategory = keyof typeof INVENTORY_CATEGORIES;

// ============================================================
// LINK CATEGORIES
// ============================================================

export const LINK_CATEGORIES = Object.freeze({
    rules: '📖 Regeln',
    tools: '🛠️ Tools',
    maps: '🗺️ Karten',
    music: '🎵 Musik',
    images: '🖼️ Bilder',
    other: '📌 Sonstiges'
} as const);

export type LinkCategory = keyof typeof LINK_CATEGORIES;

// ============================================================
// CONDITIONS
// ============================================================

export interface ConditionDefinition {
    readonly name: string;
    readonly icon: string;
    readonly desc: string;
}

export const CONDITIONS = Object.freeze({
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
        desc: 'Kampfunfähig, kann nicht sprechen/bewegen. Auto-Fehlschlag STR/DEX. Nahkampf-Treffer sind kritisch.'
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
        desc: 'Geschwindigkeit 0. Angriffe haben Nachteil. Angriffe gegen haben Vorteil.'
    },
    stunned: {
        name: 'Betäubt',
        icon: '💥',
        desc: 'Kampfunfähig, kann nicht bewegen, kann nur stammeln. Auto-Fehlschlag STR/DEX.'
    },
    unconscious: {
        name: 'Bewusstlos',
        icon: '😵',
        desc: 'Kampfunfähig, lässt alles fallen, fällt liegend. Auto-Fehlschlag STR/DEX. Nahkampf-Treffer sind kritisch.'
    },
    exhaustion: {
        name: 'Erschöpfung',
        icon: '😓',
        desc: '1: Nachteil Fähigkeiten. 2: Geschw. halbiert. 3: Nachteil Angriffe/Rettung. 4: HP halbiert. 5: Geschw. 0. 6: Tod.'
    },
    concentration: {
        name: 'Konzentration',
        icon: '🎯',
        desc: 'Hält einen Zauber aufrecht. Bei Schaden: KON-Rettung (SG 10 oder halber Schaden).'
    }
} as const);

export type ConditionKey = keyof typeof CONDITIONS;

// ============================================================
// DAMAGE TYPES
// ============================================================

export const DAMAGE_TYPES = Object.freeze({
    slashing: { name: 'Hieb', icon: '🗡️' },
    piercing: { name: 'Stich', icon: '🏹' },
    bludgeoning: { name: 'Wucht', icon: '🔨' },
    fire: { name: 'Feuer', icon: '🔥' },
    cold: { name: 'Kälte', icon: '❄️' },
    lightning: { name: 'Blitz', icon: '⚡' },
    thunder: { name: 'Schall', icon: '💥' },
    acid: { name: 'Säure', icon: '🧪' },
    poison: { name: 'Gift', icon: '☠️' },
    necrotic: { name: 'Nekrotisch', icon: '💀' },
    radiant: { name: 'Strahlend', icon: '✨' },
    force: { name: 'Energie', icon: '💫' },
    psychic: { name: 'Psychisch', icon: '🧠' }
} as const);

export type DamageTypeKey = keyof typeof DAMAGE_TYPES;

// ============================================================
// SPELL SCHOOLS
// ============================================================

export const SPELL_SCHOOLS = Object.freeze({
    abjuration: { name: 'Bannmagie', icon: '🛡️', color: '#60a5fa' },
    conjuration: { name: 'Beschwörung', icon: '🌀', color: '#fbbf24' },
    divination: { name: 'Erkenntnismagie', icon: '👁️', color: '#a78bfa' },
    evocation: { name: 'Hervorrufung', icon: '💥', color: '#ef4444' },
    illusion: { name: 'Illusion', icon: '🎭', color: '#f472b6' },
    necromancy: { name: 'Nekromantie', icon: '💀', color: '#6b7280' },
    transmutation: { name: 'Verwandlung', icon: '🔄', color: '#4ade80' },
    enchantment: { name: 'Verzauberung', icon: '💕', color: '#fb923c' }
} as const);

export type SpellSchoolKey = keyof typeof SPELL_SCHOOLS;

// ============================================================
// RARITY
// ============================================================

export const RARITY = Object.freeze({
    common: { name: 'Gewöhnlich', color: 'var(--text)' },
    uncommon: { name: 'Ungewöhnlich', color: 'var(--green)' },
    rare: { name: 'Selten', color: 'var(--blue)' },
    veryRare: { name: 'Sehr Selten', color: 'var(--purple)' },
    legendary: { name: 'Legendär', color: 'var(--orange)' },
    artifact: { name: 'Artefakt', color: 'var(--gold)' }
} as const);

export type RarityKey = keyof typeof RARITY;

// ============================================================
// CREATURE TYPES
// ============================================================

export const CREATURE_TYPES = Object.freeze([
    'Aberration',
    'Bestie',
    'Drache',
    'Elementar',
    'Fee',
    'Himmlisch',
    'Humanoid',
    'Konstrukt',
    'Monströsität',
    'Pflanze',
    'Riese',
    'Schleim',
    'Teufel',
    'Untot'
] as const);

export type CreatureType = (typeof CREATURE_TYPES)[number];

// ============================================================
// ALIGNMENTS
// ============================================================

export const ALIGNMENTS = Object.freeze({
    LG: 'Rechtschaffen Gut',
    NG: 'Neutral Gut',
    CG: 'Chaotisch Gut',
    LN: 'Rechtschaffen Neutral',
    N: 'Neutral',
    CN: 'Chaotisch Neutral',
    LE: 'Rechtschaffen Böse',
    NE: 'Neutral Böse',
    CE: 'Chaotisch Böse'
} as const);

export type AlignmentKey = keyof typeof ALIGNMENTS;

// ============================================================
// LANGUAGES
// ============================================================

export const LANGUAGES = Object.freeze([
    'Gemein',
    'Zwergisch',
    'Elfisch',
    'Gnomisch',
    'Halblingisch',
    'Orkisch',
    'Goblin',
    'Drakonisch',
    'Riesisch',
    'Abyssal',
    'Celestisch',
    'Infernal',
    'Primordial',
    'Sylvan',
    'Tiefsprache',
    'Diebeszeichen'
] as const);

export type Language = (typeof LANGUAGES)[number];

// ============================================================
// ABILITY SCORES
// ============================================================

export const ABILITY_SCORES = Object.freeze({
    str: { name: 'Stärke', abbr: 'STR', icon: '💪' },
    dex: { name: 'Geschicklichkeit', abbr: 'GES', icon: '🎯' },
    con: { name: 'Konstitution', abbr: 'KON', icon: '❤️' },
    int: { name: 'Intelligenz', abbr: 'INT', icon: '🧠' },
    wis: { name: 'Weisheit', abbr: 'WEI', icon: '👁️' },
    cha: { name: 'Charisma', abbr: 'CHA', icon: '💬' }
} as const);

export type AbilityKey = keyof typeof ABILITY_SCORES;

// ============================================================
// SKILLS
// ============================================================

export const SKILLS = Object.freeze({
    str: [{ name: 'Athletik', skill: 'athletics' }],
    dex: [
        { name: 'Akrobatik', skill: 'acrobatics' },
        { name: 'Fingerfertigkeit', skill: 'sleightOfHand' },
        { name: 'Heimlichkeit', skill: 'stealth' }
    ],
    int: [
        { name: 'Arkane Kunde', skill: 'arcana' },
        { name: 'Geschichte', skill: 'history' },
        { name: 'Nachforschungen', skill: 'investigation' },
        { name: 'Naturkunde', skill: 'nature' },
        { name: 'Religion', skill: 'religion' }
    ],
    wis: [
        { name: 'Heilkunde', skill: 'medicine' },
        { name: 'Motiv erkennen', skill: 'insight' },
        { name: 'Tierumgang', skill: 'animalHandling' },
        { name: 'Überleben', skill: 'survival' },
        { name: 'Wahrnehmung', skill: 'perception' }
    ],
    cha: [
        { name: 'Auftreten', skill: 'performance' },
        { name: 'Einschüchtern', skill: 'intimidation' },
        { name: 'Täuschung', skill: 'deception' },
        { name: 'Überzeugen', skill: 'persuasion' }
    ]
} as const);

// ============================================================
// XP THRESHOLDS BY LEVEL
// ============================================================

export interface XPThreshold {
    readonly easy: number;
    readonly medium: number;
    readonly hard: number;
    readonly deadly: number;
}

export const XP_THRESHOLDS: Readonly<Record<number, XPThreshold>> = Object.freeze({
    1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
    2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
    3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
    4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
    5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
    6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
    7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
    8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
    9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
    10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
    11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
    12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
    13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
    14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
    15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
    16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
    17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
    18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
    19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
    20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 }
});

// ============================================================
// CR TO XP
// ============================================================

export const CR_TO_XP: Readonly<Record<string, number>> = Object.freeze({
    '0': 10,
    '1/8': 25,
    '1/4': 50,
    '1/2': 100,
    '1': 200,
    '2': 450,
    '3': 700,
    '4': 1100,
    '5': 1800,
    '6': 2300,
    '7': 2900,
    '8': 3900,
    '9': 5000,
    '10': 5900,
    '11': 7200,
    '12': 8400,
    '13': 10000,
    '14': 11500,
    '15': 13000,
    '16': 15000,
    '17': 18000,
    '18': 20000,
    '19': 22000,
    '20': 25000,
    '21': 33000,
    '22': 41000,
    '23': 50000,
    '24': 62000,
    '25': 75000,
    '26': 90000,
    '27': 105000,
    '28': 120000,
    '29': 135000,
    '30': 155000
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get modifier from ability score
 */
export function getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * Get proficiency bonus for level
 */
export function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
}

/**
 * Get XP for CR
 */
export function getXPForCR(cr: string): number {
    return CR_TO_XP[cr] ?? 0;
}

/**
 * Parse CR to numeric value
 */
export function parseCR(cr: string): number {
    if (cr.includes('/')) {
        const [num, den] = cr.split('/').map(Number);
        return num / den;
    }
    return parseFloat(cr) || 0;
}

/**
 * Format modifier with sign
 */
export function formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : String(mod);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    INVENTORY_CATEGORIES,
    LINK_CATEGORIES,
    CONDITIONS,
    DAMAGE_TYPES,
    SPELL_SCHOOLS,
    RARITY,
    CREATURE_TYPES,
    ALIGNMENTS,
    LANGUAGES,
    ABILITY_SCORES,
    SKILLS,
    XP_THRESHOLDS,
    CR_TO_XP,
    getModifier,
    getProficiencyBonus,
    getXPForCR,
    parseCR,
    formatModifier
};
