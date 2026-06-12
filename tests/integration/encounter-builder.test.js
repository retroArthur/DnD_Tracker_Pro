/**
 * Integration Tests - Encounter Builder
 * Testet das Zusammenspiel von Party, Monstern und Schwierigkeitsberechnung
 */

const { getModifier, getProficiencyBonus, nextId } = require('../../utils/testable-utils');

describe('Encounter Builder Integration', () => {
    let dataStore;

    // XP Thresholds (DMG)
    const XP_THRESHOLDS = {
        1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
        2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
        3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
        4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
        5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
        6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
        7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
        8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
        9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
        10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 }
    };

    // CR to XP Table
    const CR_TO_XP = {
        0: 10,
        '1/8': 25,
        '1/4': 50,
        '1/2': 100,
        1: 200,
        2: 450,
        3: 700,
        4: 1100,
        5: 1800,
        6: 2300,
        7: 2900,
        8: 3900,
        9: 5000,
        10: 5900
    };

    // Encounter Multipliers
    const getMultiplier = (monsterCount, partySize) => {
        const multipliers = [
            { count: 1, mult: 1 },
            { count: 2, mult: 1.5 },
            { count: 3, mult: 2 },
            { count: 7, mult: 2.5 },
            { count: 11, mult: 3 },
            { count: 15, mult: 4 }
        ];

        let mult = 1;
        for (const m of multipliers) {
            if (monsterCount >= m.count) mult = m.mult;
        }

        if (partySize < 3) mult += 0.5;
        else if (partySize > 5) mult -= 0.5;

        return Math.max(0.5, mult);
    };

    // Character Factory
    const createCharacter = (overrides = {}) => ({
        id: nextId('characters', dataStore),
        name: 'Hero',
        level: 5,
        characterClass: 'Kämpfer',
        attributes: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
        hpCurrent: 44,
        hpMax: 44,
        ac: 18,
        ...overrides
    });

    // Monster Template Factory
    const createMonsterTemplate = (overrides = {}) => ({
        id: nextId('encounters', dataStore),
        name: 'Monster',
        cr: '1',
        ac: 13,
        hp: 22,
        ...overrides
    });

    beforeEach(() => {
        dataStore = {
            characters: [],
            encounters: [],
            _nextId: {}
        };
    });

    // ============================================================
    // PARTY ANALYSIS
    // ============================================================

    describe('Party-Analyse', () => {
        test('sollte Party-Schwellen berechnen', () => {
            dataStore.characters = [
                createCharacter({ level: 5 }),
                createCharacter({ level: 5 }),
                createCharacter({ level: 5 }),
                createCharacter({ level: 5 })
            ];

            const getPartyThresholds = characters => {
                const thresholds = { easy: 0, medium: 0, hard: 0, deadly: 0 };
                characters.forEach(char => {
                    const lvl = Math.min(Math.max(char.level, 1), 10);
                    const t = XP_THRESHOLDS[lvl];
                    thresholds.easy += t.easy;
                    thresholds.medium += t.medium;
                    thresholds.hard += t.hard;
                    thresholds.deadly += t.deadly;
                });
                return thresholds;
            };

            const thresholds = getPartyThresholds(dataStore.characters);

            expect(thresholds.easy).toBe(1000); // 250 * 4
            expect(thresholds.medium).toBe(2000); // 500 * 4
            expect(thresholds.hard).toBe(3000); // 750 * 4
            expect(thresholds.deadly).toBe(4400); // 1100 * 4
        });

        test('sollte gemischte Party-Level verarbeiten', () => {
            dataStore.characters = [
                createCharacter({ level: 3 }),
                createCharacter({ level: 5 }),
                createCharacter({ level: 5 }),
                createCharacter({ level: 7 })
            ];

            const avgLevel =
                dataStore.characters.reduce((sum, c) => sum + c.level, 0) /
                dataStore.characters.length;

            expect(avgLevel).toBe(5);
        });
    });

    // ============================================================
    // ENCOUNTER BUILDING
    // ============================================================

    describe('Encounter-Erstellung', () => {
        test('sollte Monster zur Encounter-Liste hinzufügen', () => {
            const encounter = {
                monsters: [],
                addMonster: function (template, count = 1) {
                    this.monsters.push({ ...template, count });
                }
            };

            encounter.addMonster(createMonsterTemplate({ name: 'Goblin', cr: '1/4' }), 4);
            encounter.addMonster(createMonsterTemplate({ name: 'Hobgoblin', cr: '1/2' }), 2);

            expect(encounter.monsters).toHaveLength(2);
            expect(encounter.monsters[0].count).toBe(4);
        });

        test('sollte Encounter-XP berechnen', () => {
            const calculateEncounterXP = monsters => {
                let baseXP = 0;
                let totalCount = 0;

                monsters.forEach(m => {
                    const xp = CR_TO_XP[m.cr] || 0;
                    baseXP += xp * m.count;
                    totalCount += m.count;
                });

                return { baseXP, totalCount };
            };

            const monsters = [
                { cr: '1/4', count: 4 }, // 50 * 4 = 200
                { cr: '1/2', count: 2 } // 100 * 2 = 200
            ];

            const result = calculateEncounterXP(monsters);

            expect(result.baseXP).toBe(400);
            expect(result.totalCount).toBe(6);
        });

        test('sollte adjustierte XP mit Multiplikator berechnen', () => {
            const baseXP = 400;
            const monsterCount = 6;
            const partySize = 4;

            const multiplier = getMultiplier(monsterCount, partySize);
            const adjustedXP = Math.round(baseXP * multiplier);

            expect(multiplier).toBe(2); // 3-6 Monster = 2x
            expect(adjustedXP).toBe(800);
        });
    });

    // ============================================================
    // DIFFICULTY ASSESSMENT
    // ============================================================

    describe('Schwierigkeitsbewertung', () => {
        const assessDifficulty = (adjustedXP, thresholds) => {
            if (adjustedXP >= thresholds.deadly) return 'deadly';
            if (adjustedXP >= thresholds.hard) return 'hard';
            if (adjustedXP >= thresholds.medium) return 'medium';
            if (adjustedXP >= thresholds.easy) return 'easy';
            return 'trivial';
        };

        test('sollte triviale Encounter erkennen', () => {
            const thresholds = { easy: 1000, medium: 2000, hard: 3000, deadly: 4400 };
            expect(assessDifficulty(500, thresholds)).toBe('trivial');
        });

        test('sollte easy Encounter erkennen', () => {
            const thresholds = { easy: 1000, medium: 2000, hard: 3000, deadly: 4400 };
            expect(assessDifficulty(1500, thresholds)).toBe('easy');
        });

        test('sollte medium Encounter erkennen', () => {
            const thresholds = { easy: 1000, medium: 2000, hard: 3000, deadly: 4400 };
            expect(assessDifficulty(2500, thresholds)).toBe('medium');
        });

        test('sollte hard Encounter erkennen', () => {
            const thresholds = { easy: 1000, medium: 2000, hard: 3000, deadly: 4400 };
            expect(assessDifficulty(3500, thresholds)).toBe('hard');
        });

        test('sollte deadly Encounter erkennen', () => {
            const thresholds = { easy: 1000, medium: 2000, hard: 3000, deadly: 4400 };
            expect(assessDifficulty(5000, thresholds)).toBe('deadly');
        });
    });

    // ============================================================
    // ENCOUNTER BALANCING
    // ============================================================

    describe('Encounter-Balancing', () => {
        test('sollte empfohlene Monster-Anzahl für Ziel-Schwierigkeit berechnen', () => {
            const suggestMonsterCount = (targetXP, monsterCR, partySize) => {
                const monsterXP = CR_TO_XP[monsterCR] || 0;
                if (monsterXP === 0) return 0;

                // Iterativ die beste Anzahl finden
                for (let count = 1; count <= 20; count++) {
                    const mult = getMultiplier(count, partySize);
                    const adjustedXP = monsterXP * count * mult;
                    if (adjustedXP >= targetXP) {
                        return count;
                    }
                }
                return 20;
            };

            // Für 4 Level-5 Charaktere, medium = 2000 XP
            const count = suggestMonsterCount(2000, '1', 4);

            // CR 1 = 200 XP, brauchen etwa 2000/200 = 10 mit Multiplikator
            expect(count).toBeGreaterThan(0);
            expect(count).toBeLessThan(20);
        });

        test('sollte Solo-Boss-Encounter ausbalancieren', () => {
            // Party: 4 Level-5 Charaktere
            const partyThresholds = { easy: 1000, medium: 2000, hard: 3000, deadly: 4400 };

            // Solo Boss CR 5 = 1800 XP, Multiplier 1x
            const bossXP = CR_TO_XP['5'];
            const adjustedXP = bossXP * getMultiplier(1, 4);

            expect(adjustedXP).toBe(1800); // Medium difficulty
            expect(adjustedXP).toBeGreaterThan(partyThresholds.easy);
            expect(adjustedXP).toBeLessThan(partyThresholds.medium);
        });

        test('sollte Horde-Encounter ausbalancieren', () => {
            // Party: 4 Level-5 Charaktere vs 8 Goblins (CR 1/4)
            const goblinXP = CR_TO_XP['1/4']; // 50
            const count = 8;
            const multiplier = getMultiplier(count, 4); // 2.5x
            const adjustedXP = goblinXP * count * multiplier;

            expect(adjustedXP).toBe(1000); // 50 * 8 * 2.5 = 1000
        });
    });

    // ============================================================
    // XP REWARDS
    // ============================================================

    describe('XP-Belohnungen', () => {
        test('sollte XP gleichmäßig auf Party aufteilen', () => {
            const totalXP = 1800; // CR 5 Monster
            const partySize = 4;

            const xpPerPlayer = Math.floor(totalXP / partySize);

            expect(xpPerPlayer).toBe(450);
        });

        test('sollte Gesamt-XP für Session berechnen', () => {
            const encounters = [
                { baseXP: 400, multiplier: 1.5 }, // 600 adjusted
                { baseXP: 1800, multiplier: 1 }, // 1800 adjusted
                { baseXP: 700, multiplier: 2 } // 1400 adjusted
            ];

            const sessionXP = encounters.reduce(
                (total, enc) => total + Math.round(enc.baseXP * enc.multiplier),
                0
            );

            const xpPerPlayer = Math.floor(sessionXP / 4);

            expect(sessionXP).toBe(3800);
            expect(xpPerPlayer).toBe(950);
        });
    });

    // ============================================================
    // FULL WORKFLOW
    // ============================================================

    describe('Kompletter Workflow', () => {
        test('sollte kompletten Encounter-Building-Workflow durchlaufen', () => {
            // 1. Party erstellen
            dataStore.characters = [
                createCharacter({ name: 'Fighter', level: 5 }),
                createCharacter({ name: 'Wizard', level: 5 }),
                createCharacter({ name: 'Cleric', level: 5 }),
                createCharacter({ name: 'Rogue', level: 5 })
            ];

            // 2. Party analysieren
            const partySize = dataStore.characters.length;
            const partyLevels = dataStore.characters.map(c => c.level);
            const thresholds = { easy: 1000, medium: 2000, hard: 3000, deadly: 4400 };

            // 3. Monster für "Hard" Encounter wählen
            const monsters = [
                { name: 'Troll', cr: '5', count: 1 }, // 1800 XP
                { name: 'Goblin', cr: '1/4', count: 4 } // 200 XP
            ];

            // 4. XP berechnen
            const baseXP = CR_TO_XP['5'] * 1 + CR_TO_XP['1/4'] * 4;
            const totalMonsters = 5;
            const multiplier = getMultiplier(totalMonsters, partySize);
            const adjustedXP = Math.round(baseXP * multiplier);

            // 5. Schwierigkeit bewerten
            let difficulty = 'trivial';
            if (adjustedXP >= thresholds.deadly) difficulty = 'deadly';
            else if (adjustedXP >= thresholds.hard) difficulty = 'hard';
            else if (adjustedXP >= thresholds.medium) difficulty = 'medium';
            else if (adjustedXP >= thresholds.easy) difficulty = 'easy';

            // Assertions
            expect(baseXP).toBe(2000); // 1800 + 200
            expect(multiplier).toBe(2); // 3-6 Monster
            expect(adjustedXP).toBe(4000); // 2000 * 2
            expect(difficulty).toBe('hard'); // 4000 >= 3000

            // 6. XP pro Spieler nach Sieg
            const xpPerPlayer = Math.floor(baseXP / partySize);
            expect(xpPerPlayer).toBe(500);
        });
    });
});
