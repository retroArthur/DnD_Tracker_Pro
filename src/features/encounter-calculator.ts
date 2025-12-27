/**
 * D&D 5e Encounter Calculator (TypeScript)
 * Berechnet Encounter-Schwierigkeit basierend auf DMG-Regeln
 * @module features/encounter-calculator
 * @version 2.7.0
 */

// ============================================================
// TYPES
// ============================================================

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface XPThreshold {
    easy: number;
    medium: number;
    hard: number;
    deadly: number;
}

export interface Monster {
    cr: string;
    count: number;
    name?: string;
}

export interface EncounterResult {
    difficulty: Difficulty;
    baseXP: number;
    adjustedXP: number;
    multiplier: number;
    monsterCount: number;
    thresholds: XPThreshold;
    xpPerPlayer: number;
}

export interface MultiplierEntry {
    count: number;
    multiplier: number;
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * XP-Schwellen nach Charakterstufe (DMG S. 82)
 */
export const XP_THRESHOLDS: Record<number, XPThreshold> = {
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
};

/**
 * CR zu XP Umrechnung (DMG S. 275)
 */
export const CR_TO_XP: Record<string, number> = {
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
};

/**
 * Encounter-Multiplikatoren basierend auf Monsteranzahl (DMG S. 82)
 */
export const ENCOUNTER_MULTIPLIERS: MultiplierEntry[] = [
    { count: 1, multiplier: 1 },
    { count: 2, multiplier: 1.5 },
    { count: 3, multiplier: 2 },
    { count: 7, multiplier: 2.5 },
    { count: 11, multiplier: 3 },
    { count: 15, multiplier: 4 }
];

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Holt XP für einen Challenge Rating
 * @param cr - Challenge Rating als String
 * @returns XP-Wert oder 0
 */
export function getXPForCR(cr: string): number {
    return CR_TO_XP[cr] ?? 0;
}

/**
 * Berechnet die Party-XP-Schwellen
 * @param partyLevels - Array der Charakterstufen
 * @returns Kombinierte XP-Schwellen
 */
export function getPartyThresholds(partyLevels: number[]): XPThreshold {
    const thresholds: XPThreshold = { easy: 0, medium: 0, hard: 0, deadly: 0 };

    for (const level of partyLevels) {
        const clampedLevel = Math.min(Math.max(level, 1), 20);
        const t = XP_THRESHOLDS[clampedLevel];
        thresholds.easy += t.easy;
        thresholds.medium += t.medium;
        thresholds.hard += t.hard;
        thresholds.deadly += t.deadly;
    }

    return thresholds;
}

/**
 * Berechnet den Encounter-Multiplikator
 * @param monsterCount - Anzahl der Monster
 * @param partySize - Anzahl der Spieler
 * @returns Multiplikator
 */
export function getMultiplier(monsterCount: number, partySize: number): number {
    let mult = 1;

    for (const entry of ENCOUNTER_MULTIPLIERS) {
        if (monsterCount >= entry.count) {
            mult = entry.multiplier;
        }
    }

    // Anpassung für kleine/große Gruppen
    if (partySize < 3) mult += 0.5;
    else if (partySize > 5) mult -= 0.5;

    return Math.max(0.5, mult);
}

/**
 * Bestimmt die Schwierigkeit basierend auf XP und Schwellen
 * @param adjustedXP - Adjustierte XP
 * @param thresholds - Party-Schwellen
 * @returns Schwierigkeitsgrad
 */
export function getDifficulty(adjustedXP: number, thresholds: XPThreshold): Difficulty {
    if (adjustedXP >= thresholds.deadly) return 'deadly';
    if (adjustedXP >= thresholds.hard) return 'hard';
    if (adjustedXP >= thresholds.medium) return 'medium';
    if (adjustedXP >= thresholds.easy) return 'easy';
    return 'trivial';
}

/**
 * Berechnet die vollständige Encounter-Schwierigkeit
 * @param partyLevels - Array der Charakterstufen
 * @param monsters - Array der Monster mit CR und Anzahl
 * @returns Encounter-Ergebnis
 */
export function calculateEncounterDifficulty(
    partyLevels: number[],
    monsters: Monster[]
): EncounterResult {
    // Leere Eingaben behandeln
    if (!partyLevels.length || !monsters.length) {
        return {
            difficulty: 'trivial',
            baseXP: 0,
            adjustedXP: 0,
            multiplier: 1,
            monsterCount: 0,
            thresholds: { easy: 0, medium: 0, hard: 0, deadly: 0 },
            xpPerPlayer: 0
        };
    }

    // Party-Schwellen berechnen
    const thresholds = getPartyThresholds(partyLevels);

    // Monster-XP summieren
    let baseXP = 0;
    let monsterCount = 0;

    for (const monster of monsters) {
        const xp = getXPForCR(monster.cr);
        const count = monster.count || 1;
        baseXP += xp * count;
        monsterCount += count;
    }

    // Multiplikator anwenden
    const multiplier = getMultiplier(monsterCount, partyLevels.length);
    const adjustedXP = Math.round(baseXP * multiplier);

    // Schwierigkeit bestimmen
    const difficulty = getDifficulty(adjustedXP, thresholds);

    // XP pro Spieler (Base XP, nicht adjusted)
    const xpPerPlayer = partyLevels.length > 0 ? Math.floor(baseXP / partyLevels.length) : 0;

    return {
        difficulty,
        baseXP,
        adjustedXP,
        multiplier,
        monsterCount,
        thresholds,
        xpPerPlayer
    };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Berechnet XP pro Spieler
 * @param totalXP - Gesamt-XP
 * @param playerCount - Anzahl Spieler
 * @returns XP pro Spieler
 */
export function calculateXPPerPlayer(totalXP: number, playerCount: number): number {
    if (playerCount <= 0) return 0;
    return Math.floor(totalXP / playerCount);
}

/**
 * Schlägt Monster-Anzahl für Ziel-Schwierigkeit vor
 * @param targetXP - Ziel-XP
 * @param monsterCR - Monster CR
 * @param partySize - Party-Größe
 * @returns Empfohlene Anzahl
 */
export function suggestMonsterCount(
    targetXP: number,
    monsterCR: string,
    partySize: number
): number {
    const monsterXP = getXPForCR(monsterCR);
    if (monsterXP === 0) return 0;

    for (let count = 1; count <= 20; count++) {
        const mult = getMultiplier(count, partySize);
        const adjustedXP = monsterXP * count * mult;
        if (adjustedXP >= targetXP) {
            return count;
        }
    }

    return 20;
}

/**
 * Gibt Schwierigkeits-Label auf Deutsch zurück
 * @param difficulty - Schwierigkeit
 * @returns Deutsches Label
 */
export function getDifficultyLabel(difficulty: Difficulty): string {
    const labels: Record<Difficulty, string> = {
        trivial: 'Trivial',
        easy: 'Leicht',
        medium: 'Mittel',
        hard: 'Schwer',
        deadly: 'Tödlich'
    };
    return labels[difficulty];
}

/**
 * Gibt Schwierigkeits-Farbe zurück
 * @param difficulty - Schwierigkeit
 * @returns CSS-Farbklasse
 */
export function getDifficultyColor(difficulty: Difficulty): string {
    const colors: Record<Difficulty, string> = {
        trivial: 'var(--text-muted)',
        easy: 'var(--green)',
        medium: 'var(--yellow)',
        hard: 'var(--orange)',
        deadly: 'var(--red)'
    };
    return colors[difficulty];
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    XP_THRESHOLDS,
    CR_TO_XP,
    ENCOUNTER_MULTIPLIERS,
    getXPForCR,
    getPartyThresholds,
    getMultiplier,
    getDifficulty,
    calculateEncounterDifficulty,
    calculateXPPerPlayer,
    suggestMonsterCount,
    getDifficultyLabel,
    getDifficultyColor
};
