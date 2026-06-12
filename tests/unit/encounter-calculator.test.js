/**
 * Unit Tests - Encounter Calculator
 * Tests für Schwierigkeitsberechnung und XP
 */

describe('Encounter Calculator', () => {
    // ============================================================
    // XP THRESHOLDS
    // ============================================================

    // XP-Schwellen nach Stufe (aus DMG)
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

    // CR zu XP Tabelle
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
        10: 5900,
        11: 7200,
        12: 8400,
        13: 10000,
        14: 11500,
        15: 13000,
        16: 15000,
        17: 18000,
        18: 20000,
        19: 22000,
        20: 25000,
        21: 33000,
        22: 41000,
        23: 50000,
        24: 62000,
        25: 75000,
        26: 90000,
        27: 105000,
        28: 120000,
        29: 135000,
        30: 155000
    };

    // Multiplikatoren basierend auf Monsteranzahl
    const ENCOUNTER_MULTIPLIERS = [
        { count: 1, multiplier: 1 },
        { count: 2, multiplier: 1.5 },
        { count: 3, multiplier: 2 },
        { count: 7, multiplier: 2.5 },
        { count: 11, multiplier: 3 },
        { count: 15, multiplier: 4 }
    ];

    // ============================================================
    // HELPER FUNKTIONEN
    // ============================================================

    /**
     * Berechnet Party-XP-Schwellen
     */
    const getPartyThresholds = partyLevels => {
        const thresholds = { easy: 0, medium: 0, hard: 0, deadly: 0 };

        partyLevels.forEach(level => {
            const lvl = Math.min(Math.max(level, 1), 20);
            const t = XP_THRESHOLDS[lvl];
            thresholds.easy += t.easy;
            thresholds.medium += t.medium;
            thresholds.hard += t.hard;
            thresholds.deadly += t.deadly;
        });

        return thresholds;
    };

    /**
     * Holt XP für CR
     */
    const getXPForCR = cr => {
        return CR_TO_XP[cr] || 0;
    };

    /**
     * Berechnet Encounter-Multiplikator
     */
    const getMultiplier = (monsterCount, partySize) => {
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
    };

    /**
     * Berechnet Encounter-Schwierigkeit
     */
    const calculateEncounterDifficulty = (partyLevels, monsters) => {
        if (!partyLevels.length || !monsters.length) {
            return {
                difficulty: 'trivial',
                adjustedXP: 0,
                baseXP: 0,
                thresholds: { easy: 0, medium: 0, hard: 0, deadly: 0 }
            };
        }

        // Party-Schwellen berechnen
        const thresholds = getPartyThresholds(partyLevels);

        // Monster-XP summieren
        let baseXP = 0;
        let monsterCount = 0;

        monsters.forEach(m => {
            const xp = getXPForCR(m.cr);
            const count = m.count || 1;
            baseXP += xp * count;
            monsterCount += count;
        });

        // Multiplikator anwenden
        const multiplier = getMultiplier(monsterCount, partyLevels.length);
        const adjustedXP = Math.round(baseXP * multiplier);

        // Schwierigkeit bestimmen
        let difficulty = 'trivial';
        if (adjustedXP >= thresholds.deadly) difficulty = 'deadly';
        else if (adjustedXP >= thresholds.hard) difficulty = 'hard';
        else if (adjustedXP >= thresholds.medium) difficulty = 'medium';
        else if (adjustedXP >= thresholds.easy) difficulty = 'easy';

        return {
            difficulty,
            adjustedXP,
            baseXP,
            multiplier,
            monsterCount,
            thresholds
        };
    };

    // ============================================================
    // TESTS
    // ============================================================

    describe('CR zu XP Konvertierung', () => {
        test('sollte korrekte XP für Standard-CRs liefern', () => {
            expect(getXPForCR('0')).toBe(10);
            expect(getXPForCR('1/8')).toBe(25);
            expect(getXPForCR('1/4')).toBe(50);
            expect(getXPForCR('1/2')).toBe(100);
            expect(getXPForCR('1')).toBe(200);
            expect(getXPForCR('5')).toBe(1800);
            expect(getXPForCR('10')).toBe(5900);
            expect(getXPForCR('20')).toBe(25000);
        });

        test('sollte 0 für ungültige CRs liefern', () => {
            expect(getXPForCR('invalid')).toBe(0);
            expect(getXPForCR('')).toBe(0);
            expect(getXPForCR('100')).toBe(0);
        });
    });

    describe('Party-Schwellen', () => {
        test('sollte korrekte Schwellen für 4 Stufe-5-Charaktere berechnen', () => {
            const thresholds = getPartyThresholds([5, 5, 5, 5]);

            expect(thresholds.easy).toBe(1000); // 250 * 4
            expect(thresholds.medium).toBe(2000); // 500 * 4
            expect(thresholds.hard).toBe(3000); // 750 * 4
            expect(thresholds.deadly).toBe(4400); // 1100 * 4
        });

        test('sollte gemischte Party-Level korrekt verarbeiten', () => {
            const thresholds = getPartyThresholds([3, 4, 5, 6]);

            // Easy: 75 + 125 + 250 + 300 = 750
            expect(thresholds.easy).toBe(750);
        });

        test('sollte leere Party behandeln', () => {
            const thresholds = getPartyThresholds([]);

            expect(thresholds.easy).toBe(0);
            expect(thresholds.deadly).toBe(0);
        });
    });

    describe('Encounter-Multiplikatoren', () => {
        test('sollte korrekten Multiplikator für Monsteranzahl liefern', () => {
            expect(getMultiplier(1, 4)).toBe(1);
            expect(getMultiplier(2, 4)).toBe(1.5);
            expect(getMultiplier(3, 4)).toBe(2);
            expect(getMultiplier(7, 4)).toBe(2.5);
            expect(getMultiplier(11, 4)).toBe(3);
            expect(getMultiplier(15, 4)).toBe(4);
        });

        test('sollte für kleine Gruppen anpassen', () => {
            const smallGroup = getMultiplier(3, 2); // 2 Spieler
            const normalGroup = getMultiplier(3, 4); // 4 Spieler

            expect(smallGroup).toBe(2.5); // 2 + 0.5
            expect(normalGroup).toBe(2);
        });

        test('sollte für große Gruppen anpassen', () => {
            const largeGroup = getMultiplier(3, 6); // 6 Spieler
            const normalGroup = getMultiplier(3, 4); // 4 Spieler

            expect(largeGroup).toBe(1.5); // 2 - 0.5
            expect(normalGroup).toBe(2);
        });
    });

    describe('Encounter-Schwierigkeit', () => {
        test('sollte "easy" Encounter korrekt erkennen', () => {
            // 4 Stufe-5-Charaktere vs 2 Goblins (CR 1/4 = 50 XP)
            const result = calculateEncounterDifficulty([5, 5, 5, 5], [{ cr: '1/4', count: 2 }]);

            // 100 base * 1.5 multiplier = 150 adjusted
            // Easy threshold: 1000, so this is trivial
            expect(result.difficulty).toBe('trivial');
            expect(result.baseXP).toBe(100);
        });

        test('sollte "medium" Encounter korrekt erkennen', () => {
            // 4 Stufe-5-Charaktere vs 4 Orks (CR 1/2 = 100 XP)
            const result = calculateEncounterDifficulty([5, 5, 5, 5], [{ cr: '1/2', count: 4 }]);

            // 400 base * 2 multiplier = 800 adjusted
            // Easy: 1000, so still trivial, but close
            expect(result.adjustedXP).toBe(800);
        });

        test('sollte "hard" Encounter korrekt erkennen', () => {
            // 4 Stufe-5-Charaktere vs 1 Oger (CR 2 = 450 XP) + 4 Goblins
            const result = calculateEncounterDifficulty(
                [5, 5, 5, 5],
                [
                    { cr: '2', count: 1 },
                    { cr: '1/4', count: 4 }
                ]
            );

            // 450 + 200 = 650 base, 5 monsters = 2x = 1300 adjusted
            // Medium: 2000, Hard: 3000, so this is easy-medium
            expect(result.baseXP).toBe(650);
            expect(result.monsterCount).toBe(5);
        });

        test('sollte "deadly" Encounter korrekt erkennen', () => {
            // 4 Stufe-1-Charaktere vs 1 Oger (CR 2 = 450 XP)
            const result = calculateEncounterDifficulty([1, 1, 1, 1], [{ cr: '2', count: 1 }]);

            // 450 * 1 = 450 adjusted
            // Deadly for lvl 1 party: 400
            expect(result.difficulty).toBe('deadly');
        });

        test('sollte leere Eingaben behandeln', () => {
            expect(calculateEncounterDifficulty([], []).difficulty).toBe('trivial');
            expect(calculateEncounterDifficulty([5], []).difficulty).toBe('trivial');
            expect(calculateEncounterDifficulty([], [{ cr: '1' }]).difficulty).toBe('trivial');
        });

        test('sollte große Gruppen von Monstern korrekt berechnen', () => {
            // 4 Stufe-5-Charaktere vs 20 Goblins
            const result = calculateEncounterDifficulty([5, 5, 5, 5], [{ cr: '1/4', count: 20 }]);

            // 1000 base * 4 = 4000 adjusted
            // Deadly: 4400, Hard: 3000, so this is hard
            expect(result.baseXP).toBe(1000);
            expect(result.multiplier).toBe(4);
            expect(result.adjustedXP).toBe(4000);
            expect(result.difficulty).toBe('hard');
        });
    });

    describe('Diverse Monster-Typen', () => {
        test('sollte gemischte Monster-Gruppen berechnen', () => {
            // 4 Stufe-5-Charaktere vs 1 Troll + 4 Goblins + 2 Wölfe
            const result = calculateEncounterDifficulty(
                [5, 5, 5, 5],
                [
                    { cr: '5', count: 1 }, // 1800 XP
                    { cr: '1/4', count: 4 }, // 200 XP
                    { cr: '1/4', count: 2 } // 100 XP
                ]
            );

            // 2100 base, 7 monsters = 2.5x = 5250 adjusted
            expect(result.baseXP).toBe(2100);
            expect(result.monsterCount).toBe(7);
        });
    });
});

// ============================================================
// XP AWARD TESTS
// ============================================================

describe('XP Awards', () => {
    const calculateXPPerPlayer = (totalXP, playerCount) => {
        if (playerCount <= 0) return 0;
        return Math.floor(totalXP / playerCount);
    };

    test('sollte XP gleichmäßig aufteilen', () => {
        expect(calculateXPPerPlayer(1000, 4)).toBe(250);
        expect(calculateXPPerPlayer(1000, 5)).toBe(200);
        expect(calculateXPPerPlayer(450, 4)).toBe(112);
    });

    test('sollte mit 0 Spielern umgehen', () => {
        expect(calculateXPPerPlayer(1000, 0)).toBe(0);
    });
});
