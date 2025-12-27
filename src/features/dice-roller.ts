/**
 * D&D 5e Dice Roller (TypeScript)
 * Core dice rolling functionality
 * @module features/dice-roller
 * @version 2.7.0
 */

// ============================================================
// TYPES
// ============================================================

export interface DiceRollResult {
    total: number;
    rolls: number[];
    keptRolls?: number[];
    modifier: number;
}

export interface RollHistoryEntry {
    notation: string;
    result: number | string;
    rolls: (number | string)[];
    time: Date;
}

export interface SkillDefinition {
    name: string;
    skill: string;
}

export type AttributeKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface SkillsByAttribute {
    str: SkillDefinition[];
    dex: SkillDefinition[];
    con: SkillDefinition[];
    int: SkillDefinition[];
    wis: SkillDefinition[];
    cha: SkillDefinition[];
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * D&D 5e Skills organized by attribute
 */
export const SKILLS: SkillsByAttribute = {
    str: [{ name: 'Athletik', skill: 'athletics' }],
    dex: [
        { name: 'Akrobatik', skill: 'acrobatics' },
        { name: 'Fingerfertigkeit', skill: 'sleightOfHand' },
        { name: 'Heimlichkeit', skill: 'stealth' }
    ],
    con: [],
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
};

/**
 * Standard dice types in D&D
 */
export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DiceType = (typeof DICE_TYPES)[number];

// ============================================================
// CORE DICE FUNCTIONS
// ============================================================

/**
 * Rolls a single die with the specified number of sides
 * @param sides - Number of sides on the die
 * @returns Random result between 1 and sides
 */
export function rollDice(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
}

/**
 * Rolls multiple dice of the same type
 * @param count - Number of dice to roll
 * @param sides - Number of sides on each die
 * @returns Array of individual roll results
 */
export function rollMultipleDice(count: number, sides: number): number[] {
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
        rolls.push(rollDice(sides));
    }
    return rolls;
}

/**
 * Parses and evaluates dice notation
 * Supports: 2d6+3, 4d6kh3, 1d20+5, 2d20kl1
 * @param notation - Dice notation string
 * @returns Roll result or null if invalid
 */
export function parseDiceNotation(notation: string): DiceRollResult | null {
    const match = notation.toLowerCase().match(/^(\d+)?d(\d+)(k[hl](\d+))?([+-]\d+)?$/);
    if (!match) return null;

    const count = parseInt(match[1]) || 1;
    const sides = parseInt(match[2]);
    const keep = match[3];
    const keepCount = parseInt(match[4]) || 1;
    const modifier = parseInt(match[5]) || 0;

    const rolls = rollMultipleDice(count, sides);

    let keptRolls = [...rolls];
    if (keep) {
        const sorted = [...rolls].sort((a, b) => b - a);
        if (keep.includes('h')) {
            keptRolls = sorted.slice(0, keepCount);
        } else if (keep.includes('l')) {
            keptRolls = sorted.slice(-keepCount);
        }
    }

    const total = keptRolls.reduce((a, b) => a + b, 0) + modifier;
    return { total, rolls, keptRolls, modifier };
}

/**
 * Rolls with advantage (2d20, keep highest)
 * @returns Roll result
 */
export function rollAdvantage(): DiceRollResult {
    return parseDiceNotation('2d20kh1')!;
}

/**
 * Rolls with disadvantage (2d20, keep lowest)
 * @returns Roll result
 */
export function rollDisadvantage(): DiceRollResult {
    return parseDiceNotation('2d20kl1')!;
}

/**
 * Rolls stats using 4d6 drop lowest method
 * @returns Array of 6 stat values
 */
export function rollStats(): number[] {
    const stats: number[] = [];
    for (let i = 0; i < 6; i++) {
        const result = parseDiceNotation('4d6kh3');
        if (result) {
            stats.push(result.total);
        }
    }
    return stats;
}

/**
 * Simulates a coin flip
 * @returns 'Kopf' (heads) or 'Zahl' (tails)
 */
export function flipCoin(): 'Kopf' | 'Zahl' {
    return Math.random() < 0.5 ? 'Kopf' : 'Zahl';
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculates the ability modifier for a given score
 * @param score - Ability score (1-30)
 * @returns Modifier value
 */
export function getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * Calculates proficiency bonus for a given level
 * @param level - Character level (1-20)
 * @returns Proficiency bonus
 */
export function getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
}

/**
 * Formats a modifier for display (+X or -X)
 * @param mod - Modifier value
 * @returns Formatted string
 */
export function formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Checks if a roll is a natural 20
 * @param rolls - Array of roll results
 * @returns True if any roll is 20
 */
export function isNatural20(rolls: number[]): boolean {
    return rolls.includes(20);
}

/**
 * Checks if a roll is a natural 1
 * @param rolls - Array of roll results
 * @returns True if any roll is 1
 */
export function isNatural1(rolls: number[]): boolean {
    return rolls.includes(1);
}

/**
 * Calculates critical hit damage (doubles dice count)
 * @param notation - Original damage notation (e.g., "2d6+3")
 * @returns Critical damage notation (e.g., "4d6+3") or null if invalid
 */
export function getCriticalDamageNotation(notation: string): string | null {
    const match = notation.toLowerCase().match(/^(\d+)?d(\d+)([+-]\d+)?$/);
    if (!match) return null;

    const count = (parseInt(match[1]) || 1) * 2;
    const sides = parseInt(match[2]);
    const modifier = match[3] || '';

    return `${count}d${sides}${modifier}`;
}

/**
 * Resolves an attack roll against a target AC
 * @param attackBonus - Attack bonus to add
 * @param targetAC - Target's armor class
 * @param advantage - Whether to roll with advantage
 * @returns Attack result
 */
export function resolveAttack(
    attackBonus: number,
    targetAC: number,
    advantage: boolean = false
): {
    roll: number;
    total: number;
    hits: boolean;
    isCritical: boolean;
    isFumble: boolean;
    rolls: number[];
} {
    let rolls: number[];
    let roll: number;

    if (advantage) {
        const result = rollAdvantage();
        rolls = result.rolls;
        roll = result.keptRolls![0];
    } else {
        roll = rollDice(20);
        rolls = [roll];
    }

    const total = roll + attackBonus;
    const isCritical = roll === 20;
    const isFumble = roll === 1;
    const hits = isCritical || (!isFumble && total >= targetAC);

    return { roll, total, hits, isCritical, isFumble, rolls };
}

/**
 * Resolves a saving throw
 * @param modifier - Save modifier
 * @param dc - Difficulty class
 * @returns Save result
 */
export function resolveSavingThrow(
    modifier: number,
    dc: number
): {
    roll: number;
    total: number;
    success: boolean;
    isCritical: boolean;
    isFumble: boolean;
} {
    const roll = rollDice(20);
    const total = roll + modifier;
    const isCritical = roll === 20;
    const isFumble = roll === 1;
    const success = isCritical || (!isFumble && total >= dc);

    return { roll, total, success, isCritical, isFumble };
}

// ============================================================
// MULTIPLE ROLL UTILITIES
// ============================================================

/**
 * Rolls the same notation multiple times
 * @param notation - Dice notation
 * @param count - Number of times to roll
 * @returns Array of results and total sum
 */
export function rollMultiple(
    notation: string,
    count: number
): { results: number[]; total: number; allRolls: number[] } | null {
    const results: number[] = [];
    const allRolls: number[] = [];

    for (let i = 0; i < count; i++) {
        const result = parseDiceNotation(notation);
        if (result) {
            results.push(result.total);
            allRolls.push(...result.rolls);
        } else {
            return null;
        }
    }

    const total = results.reduce((a, b) => a + b, 0);
    return { results, total, allRolls };
}

/**
 * Validates dice notation without rolling
 * @param notation - Notation to validate
 * @returns True if valid
 */
export function isValidNotation(notation: string): boolean {
    return /^(\d+)?d(\d+)(k[hl](\d+))?([+-]\d+)?$/i.test(notation);
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
    SKILLS,
    DICE_TYPES,
    rollDice,
    rollMultipleDice,
    parseDiceNotation,
    rollAdvantage,
    rollDisadvantage,
    rollStats,
    flipCoin,
    getModifier,
    getProficiencyBonus,
    formatModifier,
    isNatural20,
    isNatural1,
    getCriticalDamageNotation,
    resolveAttack,
    resolveSavingThrow,
    rollMultiple,
    isValidNotation
};
