/**
 * Unit Tests - Character Advancement (Phase 6 — Spieler-Verwaltung)
 * Wave-0 Grundlage: Alle vier Pure Helpers + Migration 5.0.0 + Fixtures
 *
 * Abgedeckte Behavior-Anforderungen (06-01-PLAN.md <behavior>):
 *  - calcSkillModifier: ungeübt / geübt / Expertise, Grenzwerte
 *  - canLevelUp: Grenzwerte 299/300, Max-Level 20
 *  - getXPForCR: Bruch-CRs '1/8'/'1/4'/'1/2', ganze CRs, unbekannte CRs
 *  - distributeXP: gleichmäßige Verteilung, Rest, leeres Array (T-06-02)
 *  - XP_LEVEL_THRESHOLDS vs XP_THRESHOLDS klar getrennt (T-06-03)
 *  - Migration 5.0.0: backfills xp/skillProficiencies/skillExpertise/attacks + levelingMode
 */

const {
    calcSkillModifier,
    canLevelUp,
    getXPForCR,
    distributeXP,
    XP_LEVEL_THRESHOLDS
} = require('../../utils/testable-utils');

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SHARED CHARACTER FIXTURES
// ============================================================

/**
 * Rogue Level 5 mit DEX 18 und Expertise in Heimlichkeit (stealth)
 * Erwartung: calcSkillModifier(rogueL5, 'stealth') === 10
 *   DEX mod = Math.floor((18-10)/2) = 4
 *   profBonus = Math.ceil(5/4)+1 = 3
 *   Expertise factor = 2
 *   Total = 4 + 3*2 = 10
 */
function makeRogueL5() {
    return {
        name: 'Testschurke',
        level: 5,
        attributes: { str: 10, dex: 18, con: 12, int: 10, wis: 10, cha: 10 },
        skillProficiencies: { stealth: true },
        skillExpertise: { stealth: true }
    };
}

/**
 * Einfacher Charakter ohne Fertigkeitenübung, Level 1
 * DEX = 14 → Modifier = +2, keine Prof → total = 2
 */
function makePlainChar() {
    return {
        name: 'Einfacher Charakter',
        level: 1,
        attributes: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
        skillProficiencies: {},
        skillExpertise: {}
    };
}

/**
 * Charakter an der Level-2-Grenze (xp = 300, Level 1)
 */
function makeCharAtLevelThreshold() {
    return {
        name: 'Fast Level 2',
        level: 1,
        xp: 300,
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    };
}

// ============================================================
// MIGRATION HELPERS
// ============================================================

let MIGRATIONS_VM;

beforeAll(() => {
    // Lade version-migration.js in einem vm-Kontext (wie in migration.test.js).
    // MIGRATIONS ist const in version-migration.js und daher nicht direkt im context-Objekt.
    // version-migration.js exportiert es via window.MIGRATIONS — daher aus context.window lesen.
    const context = {
        window: {
            APP_CONFIG: global.APP_CONFIG,
            ErrorHandler: { log: jest.fn() },
            getSpellSlotsForClass: jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0])
        },
        APP_CONFIG: global.APP_CONFIG,
        console: console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/spellslots/version-migration.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    // MIGRATIONS wird via window.MIGRATIONS = MIGRATIONS exportiert (version-migration.js Ende)
    MIGRATIONS_VM = context.window.MIGRATIONS;
});

// ============================================================
// calcSkillModifier
// ============================================================

describe('calcSkillModifier()', () => {
    test('Expertise (Schurke L5, DEX 18, Heimlichkeit) → 10', () => {
        const ch = makeRogueL5();
        expect(calcSkillModifier(ch, 'stealth')).toBe(10);
    });

    test('Nur Übung ohne Expertise → attrMod + profBonus×1', () => {
        const ch = {
            level: 5,
            attributes: { str: 10, dex: 18, con: 10, int: 10, wis: 10, cha: 10 },
            skillProficiencies: { stealth: true },
            skillExpertise: {}
        };
        // DEX mod = 4, profBonus = 3, factor = 1 → 4 + 3*1 = 7
        expect(calcSkillModifier(ch, 'stealth')).toBe(7);
    });

    test('Kein Übung → nur attrMod', () => {
        const ch = makePlainChar();
        // DEX 14 → mod = 2; keine Prof → 2 + 0 = 2
        expect(calcSkillModifier(ch, 'stealth')).toBe(2);
    });

    test('Unbekannter Skill-Key → 0', () => {
        const ch = makeRogueL5();
        expect(calcSkillModifier(ch, 'nonExistentSkill')).toBe(0);
    });

    test('Charakter ohne attributes → Fallback auf 10 → mod 0', () => {
        const ch = { level: 1, skillProficiencies: {}, skillExpertise: {} };
        expect(calcSkillModifier(ch, 'athletics')).toBe(0);
    });

    test('Charakter mit explizitem proficiencyBonus überschreibt Formel', () => {
        const ch = {
            level: 1,
            proficiencyBonus: 5, // Explizit gesetzt (z.B. magische Verstärkung)
            attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            skillProficiencies: { athletics: true },
            skillExpertise: {}
        };
        // STR mod = 0, profBonus = 5 (explizit), factor = 1 → 0 + 5 = 5
        expect(calcSkillModifier(ch, 'athletics')).toBe(5);
    });

    test('STR-basierte Fertigkeit (athletics) mit STR 20', () => {
        const ch = {
            level: 4,
            attributes: { str: 20, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            skillProficiencies: { athletics: true },
            skillExpertise: {}
        };
        // STR mod = 5, profBonus = Math.ceil(4/4)+1 = 2, factor = 1 → 5 + 2 = 7
        expect(calcSkillModifier(ch, 'athletics')).toBe(7);
    });
});

// ============================================================
// canLevelUp
// ============================================================

describe('canLevelUp()', () => {
    test('Level 1, xp=300 → true (genau an Schwelle)', () => {
        expect(canLevelUp({ level: 1, xp: 300 })).toBe(true);
    });

    test('Level 1, xp=299 → false (knapp unter Schwelle)', () => {
        expect(canLevelUp({ level: 1, xp: 299 })).toBe(false);
    });

    test('Level 1, xp=0 → false (noch kein XP)', () => {
        expect(canLevelUp({ level: 1, xp: 0 })).toBe(false);
    });

    test('Level 20, xp=999999 → false (bereits Max-Level)', () => {
        expect(canLevelUp({ level: 20, xp: 999999 })).toBe(false);
    });

    test('Level 19, xp=355000 → true (an der Level-20-Schwelle)', () => {
        expect(canLevelUp({ level: 19, xp: 355000 })).toBe(true);
    });

    test('Level 19, xp=354999 → false (knapp unter Level 20)', () => {
        expect(canLevelUp({ level: 19, xp: 354999 })).toBe(false);
    });

    test('Charakter ohne xp-Feld → xp defaults zu 0 → false', () => {
        expect(canLevelUp({ level: 1 })).toBe(false);
    });

    test('Charakter ohne level-Feld → Level 1 angenommen', () => {
        expect(canLevelUp({ xp: 300 })).toBe(true);
    });
});

// ============================================================
// getXPForCR
// ============================================================

describe('getXPForCR()', () => {
    test("'1/8' → 25", () => {
        expect(getXPForCR('1/8')).toBe(25);
    });

    test("'1/4' → 50", () => {
        expect(getXPForCR('1/4')).toBe(50);
    });

    test("'1/2' → 100", () => {
        expect(getXPForCR('1/2')).toBe(100);
    });

    test('1 (Number) → 200', () => {
        expect(getXPForCR(1)).toBe(200);
    });

    test('0 → 10', () => {
        expect(getXPForCR(0)).toBe(10);
    });

    test("'unknown' → 0 (unbekannter CR)", () => {
        expect(getXPForCR('unknown')).toBe(0);
    });

    test('2 Wölfe (CR 1/4) = 100 XP gesamt', () => {
        const wolf1 = getXPForCR('1/4');
        const wolf2 = getXPForCR('1/4');
        expect(wolf1 + wolf2).toBe(100);
    });

    test('CR 30 (Tiamat-Klasse) = 155000', () => {
        expect(getXPForCR(30)).toBe(155000);
    });
});

// ============================================================
// distributeXP
// ============================================================

describe('distributeXP()', () => {
    test('400 XP auf 4 Charaktere → je 100, Rest 0', () => {
        const chars = [{ xp: 0 }, { xp: 0 }, { xp: 0 }, { xp: 0 }];
        const result = distributeXP(400, chars);
        expect(result.share).toBe(100);
        expect(result.remainder).toBe(0);
        chars.forEach(c => expect(c.xp).toBe(100));
    });

    test('401 XP auf 4 Charaktere → share 100, remainder 1', () => {
        const chars = [{ xp: 0 }, { xp: 0 }, { xp: 0 }, { xp: 0 }];
        const result = distributeXP(401, chars);
        expect(result.share).toBe(100);
        expect(result.remainder).toBe(1);
        chars.forEach(c => expect(c.xp).toBe(100));
    });

    test('XP werden zu vorhandenem xp addiert', () => {
        const chars = [{ xp: 500 }, { xp: 200 }];
        distributeXP(100, chars);
        expect(chars[0].xp).toBe(550);
        expect(chars[1].xp).toBe(250);
    });

    test('Leeres Array → share 0, remainder = totalXP (T-06-02, keine Division durch 0)', () => {
        const result = distributeXP(400, []);
        expect(result.share).toBe(0);
        expect(result.remainder).toBe(400);
    });

    test('null activeChars → share 0, remainder = totalXP (T-06-02)', () => {
        const result = distributeXP(200, null);
        expect(result.share).toBe(0);
        expect(result.remainder).toBe(200);
    });

    test('Charakter ohne xp-Feld → defaults zu 0 vor Addition', () => {
        const chars = [{ name: 'Kein XP-Feld' }];
        distributeXP(300, chars);
        expect(chars[0].xp).toBe(300);
    });

    test('1 Charakter erhält alle XP', () => {
        const chars = [{ xp: 0 }];
        const result = distributeXP(250, chars);
        expect(result.share).toBe(250);
        expect(result.remainder).toBe(0);
        expect(chars[0].xp).toBe(250);
    });
});

// ============================================================
// XP_LEVEL_THRESHOLDS — Konstanten-Integrität (T-06-03)
// ============================================================

describe('XP_LEVEL_THRESHOLDS Konstante', () => {
    test('Hat 20 Einträge (Level 1–20)', () => {
        expect(XP_LEVEL_THRESHOLDS).toHaveLength(20);
    });

    test('Index 0 (Level 1) = 0 XP (Startpunkt)', () => {
        expect(XP_LEVEL_THRESHOLDS[0]).toBe(0);
    });

    test('Index 1 (Level 2) = 300 XP', () => {
        expect(XP_LEVEL_THRESHOLDS[1]).toBe(300);
    });

    test('Index 19 (Level 20) = 355000 XP', () => {
        expect(XP_LEVEL_THRESHOLDS[19]).toBe(355000);
    });

    test('Streng monoton steigend', () => {
        for (let i = 1; i < XP_LEVEL_THRESHOLDS.length; i++) {
            expect(XP_LEVEL_THRESHOLDS[i]).toBeGreaterThan(XP_LEVEL_THRESHOLDS[i - 1]);
        }
    });
});

// ============================================================
// Migration 5.0.0 — Schema-Felder + levelingMode
// ============================================================

describe("Migration '5.0.0'", () => {
    test("MIGRATIONS enthält den Schlüssel '5.0.0'", () => {
        expect(MIGRATIONS_VM).toBeDefined();
        expect(typeof MIGRATIONS_VM['5.0.0']).toBe('function');
    });

    test("Kein Schlüssel '6.0.0' vorhanden (korrekte Versionierung)", () => {
        expect(MIGRATIONS_VM['6.0.0']).toBeUndefined();
    });

    test('Backfills xp auf 0 bei fehlendem Feld', () => {
        const data = {
            characters: [{ name: 'Alter Charakter' }],
            settings: {}
        };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.characters[0].xp).toBe(0);
    });

    test('Backfills skillProficiencies auf {} bei fehlendem Feld', () => {
        const data = {
            characters: [{ name: 'Alter Charakter' }],
            settings: {}
        };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.characters[0].skillProficiencies).toEqual({});
    });

    test('Backfills skillExpertise auf {} bei fehlendem Feld', () => {
        const data = {
            characters: [{ name: 'Alter Charakter' }],
            settings: {}
        };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.characters[0].skillExpertise).toEqual({});
    });

    test('Backfills attacks auf [] bei fehlendem Feld', () => {
        const data = {
            characters: [{ name: 'Alter Charakter' }],
            settings: {}
        };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.characters[0].attacks).toEqual([]);
    });

    test('Setzt data.settings.levelingMode auf "xp" wenn undefined', () => {
        const data = { characters: [], settings: {} };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.settings.levelingMode).toBe('xp');
    });

    test('Erstellt data.settings wenn nicht vorhanden', () => {
        const data = { characters: [] };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.settings).toBeDefined();
        expect(migrated.settings.levelingMode).toBe('xp');
    });

    test('Überschreibt NICHT vorhandene xp-Werte', () => {
        const data = {
            characters: [{ name: 'Erfahrener Char', xp: 5000 }],
            settings: {}
        };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.characters[0].xp).toBe(5000);
    });

    test('Überschreibt NICHT vorhandene skillProficiencies', () => {
        const data = {
            characters: [{ name: 'Geübt', skillProficiencies: { stealth: true } }],
            settings: {}
        };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.characters[0].skillProficiencies).toEqual({ stealth: true });
    });

    test('Überschreibt NICHT vorhandenen levelingMode', () => {
        const data = {
            characters: [],
            settings: { levelingMode: 'milestone' }
        };
        const migrated = MIGRATIONS_VM['5.0.0'](data);
        expect(migrated.settings.levelingMode).toBe('milestone');
    });

    test('Sicherer Umgang mit leerem characters-Array', () => {
        const data = { characters: [], settings: {} };
        expect(() => MIGRATIONS_VM['5.0.0'](data)).not.toThrow();
    });

    test('Sicherer Umgang mit fehlendem characters-Array (T-06-01)', () => {
        const data = { settings: {} };
        expect(() => MIGRATIONS_VM['5.0.0'](data)).not.toThrow();
    });

    test('Gibt data zurück', () => {
        const data = { characters: [], settings: {} };
        const result = MIGRATIONS_VM['5.0.0'](data);
        expect(result).toBe(data);
    });
});
