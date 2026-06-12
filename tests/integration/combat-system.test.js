/**
 * Integration Tests - Combat System
 * Testet Initiative-Tracking, Kampfrunden und HP-Management im Kampf
 */

const { getModifier, parseDiceNotation, nextId, clamp } = require('../../utils/testable-utils');

describe('Combat System Integration', () => {
    let combat;
    let dataStore;

    // Combatant Factory
    const createCombatant = (overrides = {}) => ({
        id: nextId('combatants', dataStore),
        name: 'Combatant',
        type: 'character',
        initiative: 10,
        hpCurrent: 20,
        hpMax: 20,
        ac: 15,
        conditions: [],
        isPlayer: true,
        ...overrides
    });

    // Monster Factory
    const createMonster = (overrides = {}) => ({
        id: nextId('combatants', dataStore),
        name: 'Monster',
        type: 'encounter',
        initiative: 10,
        hpCurrent: 30,
        hpMax: 30,
        ac: 13,
        conditions: [],
        isPlayer: false,
        ...overrides
    });

    beforeEach(() => {
        dataStore = { _nextId: {} };
        combat = {
            combatants: [],
            currentTurn: 0,
            round: 1,
            isActive: false
        };
    });

    // ============================================================
    // INITIATIVE MANAGEMENT
    // ============================================================

    describe('Initiative-Management', () => {
        test('sollte Combatants nach Initiative sortieren', () => {
            combat.combatants = [
                createCombatant({ name: 'Slow', initiative: 5 }),
                createCombatant({ name: 'Fast', initiative: 20 }),
                createCombatant({ name: 'Medium', initiative: 12 })
            ];

            combat.combatants.sort((a, b) => b.initiative - a.initiative);

            expect(combat.combatants[0].name).toBe('Fast');
            expect(combat.combatants[1].name).toBe('Medium');
            expect(combat.combatants[2].name).toBe('Slow');
        });

        test('sollte Initiative mit DEX-Modifier berechnen', () => {
            const rollInitiative = (dexScore, diceRoll) => {
                return diceRoll + getModifier(dexScore);
            };

            expect(rollInitiative(14, 10)).toBe(12); // 10 + 2
            expect(rollInitiative(8, 15)).toBe(14); // 15 - 1
            expect(rollInitiative(10, 7)).toBe(7); // 7 + 0
        });

        test('sollte bei gleicher Initiative nach DEX-Modifier sortieren', () => {
            combat.combatants = [
                createCombatant({ name: 'LowDex', initiative: 15, dexScore: 10 }),
                createCombatant({ name: 'HighDex', initiative: 15, dexScore: 18 }),
                createCombatant({ name: 'MidDex', initiative: 15, dexScore: 14 })
            ];

            // Sortiere nach Initiative, dann nach DEX
            combat.combatants.sort((a, b) => {
                if (b.initiative !== a.initiative) {
                    return b.initiative - a.initiative;
                }
                return getModifier(b.dexScore || 10) - getModifier(a.dexScore || 10);
            });

            expect(combat.combatants[0].name).toBe('HighDex');
            expect(combat.combatants[1].name).toBe('MidDex');
            expect(combat.combatants[2].name).toBe('LowDex');
        });
    });

    // ============================================================
    // TURN MANAGEMENT
    // ============================================================

    describe('Zug-Management', () => {
        beforeEach(() => {
            combat.combatants = [
                createCombatant({ name: 'Fighter', initiative: 18 }),
                createMonster({ name: 'Goblin 1', initiative: 15 }),
                createCombatant({ name: 'Wizard', initiative: 12 }),
                createMonster({ name: 'Goblin 2', initiative: 8 })
            ];
            combat.combatants.sort((a, b) => b.initiative - a.initiative);
            combat.isActive = true;
        });

        test('sollte zum nächsten Zug wechseln', () => {
            const nextTurn = () => {
                combat.currentTurn++;
                if (combat.currentTurn >= combat.combatants.length) {
                    combat.currentTurn = 0;
                    combat.round++;
                }
            };

            expect(combat.combatants[combat.currentTurn].name).toBe('Fighter');

            nextTurn();
            expect(combat.combatants[combat.currentTurn].name).toBe('Goblin 1');

            nextTurn();
            expect(combat.combatants[combat.currentTurn].name).toBe('Wizard');

            nextTurn();
            expect(combat.combatants[combat.currentTurn].name).toBe('Goblin 2');
        });

        test('sollte Runde erhöhen wenn alle dran waren', () => {
            const nextTurn = () => {
                combat.currentTurn++;
                if (combat.currentTurn >= combat.combatants.length) {
                    combat.currentTurn = 0;
                    combat.round++;
                }
            };

            expect(combat.round).toBe(1);

            // Durchlaufe alle 4 Combatants
            nextTurn();
            nextTurn();
            nextTurn();
            nextTurn();

            expect(combat.round).toBe(2);
            expect(combat.currentTurn).toBe(0);
        });

        test('sollte zum vorherigen Zug zurückkehren können', () => {
            combat.currentTurn = 2;
            combat.round = 2;

            const prevTurn = () => {
                combat.currentTurn--;
                if (combat.currentTurn < 0) {
                    combat.currentTurn = combat.combatants.length - 1;
                    combat.round = Math.max(1, combat.round - 1);
                }
            };

            prevTurn();
            expect(combat.currentTurn).toBe(1);

            prevTurn();
            expect(combat.currentTurn).toBe(0);

            prevTurn();
            expect(combat.currentTurn).toBe(3);
            expect(combat.round).toBe(1);
        });
    });

    // ============================================================
    // DAMAGE & HEALING
    // ============================================================

    describe('Schaden & Heilung', () => {
        test('sollte Schaden anwenden und HP reduzieren', () => {
            const target = createCombatant({ hpCurrent: 25, hpMax: 25 });

            const applyDamage = (combatant, damage) => {
                combatant.hpCurrent = clamp(combatant.hpCurrent - damage, 0, combatant.hpMax);
                return combatant;
            };

            applyDamage(target, 10);
            expect(target.hpCurrent).toBe(15);

            applyDamage(target, 20);
            expect(target.hpCurrent).toBe(0); // Nicht unter 0
        });

        test('sollte Heilung anwenden und HP erhöhen', () => {
            const target = createCombatant({ hpCurrent: 10, hpMax: 30 });

            const applyHealing = (combatant, healing) => {
                combatant.hpCurrent = clamp(combatant.hpCurrent + healing, 0, combatant.hpMax);
                return combatant;
            };

            applyHealing(target, 15);
            expect(target.hpCurrent).toBe(25);

            applyHealing(target, 10);
            expect(target.hpCurrent).toBe(30); // Nicht über Max
        });

        test('sollte Würfelschaden parsen und berechnen', () => {
            const dice = parseDiceNotation('2d6+3');

            expect(dice.count).toBe(2);
            expect(dice.sides).toBe(6);
            expect(dice.modifier).toBe(3);

            // Simuliere Würfelwurf (min/max Berechnung)
            const minDamage = dice.count * 1 + dice.modifier;
            const maxDamage = dice.count * dice.sides + dice.modifier;

            expect(minDamage).toBe(5); // 2×1 + 3
            expect(maxDamage).toBe(15); // 2×6 + 3
        });
    });

    // ============================================================
    // CONDITIONS
    // ============================================================

    describe('Zustände (Conditions)', () => {
        test('sollte Zustand hinzufügen', () => {
            const target = createCombatant({ conditions: [] });

            const addCondition = (combatant, condition) => {
                if (!combatant.conditions.includes(condition)) {
                    combatant.conditions.push(condition);
                }
            };

            addCondition(target, 'Vergiftet');
            addCondition(target, 'Verlangsamt');

            expect(target.conditions).toContain('Vergiftet');
            expect(target.conditions).toContain('Verlangsamt');
        });

        test('sollte doppelte Zustände verhindern', () => {
            const target = createCombatant({ conditions: [] });

            const addCondition = (combatant, condition) => {
                if (!combatant.conditions.includes(condition)) {
                    combatant.conditions.push(condition);
                }
            };

            addCondition(target, 'Betäubt');
            addCondition(target, 'Betäubt');

            expect(target.conditions).toHaveLength(1);
        });

        test('sollte Zustand entfernen', () => {
            const target = createCombatant({
                conditions: ['Vergiftet', 'Verlangsamt', 'Blind']
            });

            const removeCondition = (combatant, condition) => {
                combatant.conditions = combatant.conditions.filter(c => c !== condition);
            };

            removeCondition(target, 'Verlangsamt');

            expect(target.conditions).toEqual(['Vergiftet', 'Blind']);
        });
    });

    // ============================================================
    // COMBAT FLOW
    // ============================================================

    describe('Kampfablauf', () => {
        test('sollte kompletten Kampf simulieren', () => {
            // Setup: 2 Players vs 2 Goblins
            combat.combatants = [
                createCombatant({
                    name: 'Fighter',
                    initiative: 18,
                    hpCurrent: 40,
                    hpMax: 40,
                    ac: 18
                }),
                createCombatant({
                    name: 'Wizard',
                    initiative: 14,
                    hpCurrent: 20,
                    hpMax: 20,
                    ac: 12
                }),
                createMonster({ name: 'Goblin 1', initiative: 12, hpCurrent: 7, hpMax: 7, ac: 15 }),
                createMonster({ name: 'Goblin 2', initiative: 10, hpCurrent: 7, hpMax: 7, ac: 15 })
            ];
            combat.combatants.sort((a, b) => b.initiative - a.initiative);
            combat.isActive = true;

            const applyDamage = (combatant, damage) => {
                combatant.hpCurrent = clamp(combatant.hpCurrent - damage, 0, combatant.hpMax);
            };

            const isDefeated = combatant => combatant.hpCurrent <= 0;

            const getActiveEnemies = () =>
                combat.combatants.filter(c => !c.isPlayer && c.hpCurrent > 0);

            const getActivePlayers = () =>
                combat.combatants.filter(c => c.isPlayer && c.hpCurrent > 0);

            // Runde 1: Fighter tötet Goblin 1
            applyDamage(combat.combatants[2], 10);
            expect(isDefeated(combat.combatants[2])).toBe(true);
            expect(getActiveEnemies()).toHaveLength(1);

            // Wizard nimmt Schaden
            applyDamage(combat.combatants[1], 5);
            expect(combat.combatants[1].hpCurrent).toBe(15);

            // Goblin 2 greift an
            applyDamage(combat.combatants[1], 4);
            expect(combat.combatants[1].hpCurrent).toBe(11);

            // Runde 2: Fighter tötet Goblin 2
            combat.round = 2;
            applyDamage(combat.combatants[3], 10);
            expect(isDefeated(combat.combatants[3])).toBe(true);

            // Kampf vorbei
            expect(getActiveEnemies()).toHaveLength(0);
            expect(getActivePlayers()).toHaveLength(2);
        });

        test('sollte besiegte Combatants aus Initiativliste entfernen können', () => {
            combat.combatants = [
                createCombatant({ name: 'Fighter', initiative: 18 }),
                createMonster({ name: 'Goblin', initiative: 12, hpCurrent: 0 }),
                createCombatant({ name: 'Wizard', initiative: 10 })
            ];

            const removeDefeated = () => {
                combat.combatants = combat.combatants.filter(c => c.hpCurrent > 0);
            };

            removeDefeated();

            expect(combat.combatants).toHaveLength(2);
            expect(combat.combatants.find(c => c.name === 'Goblin')).toBeUndefined();
        });
    });

    // ============================================================
    // ATTACK RESOLUTION
    // ============================================================

    describe('Angriffsauflösung', () => {
        test('sollte Treffer/Verfehlen bestimmen', () => {
            const resolveAttack = (attackRoll, attackBonus, targetAC) => {
                const total = attackRoll + attackBonus;
                const isCritical = attackRoll === 20;
                const isFumble = attackRoll === 1;
                return {
                    roll: attackRoll,
                    total,
                    hit: isCritical || (!isFumble && total >= targetAC), // Nat 20 trifft immer, Nat 1 verfehlt immer
                    critical: isCritical,
                    fumble: isFumble
                };
            };

            const hit = resolveAttack(15, 5, 18);
            expect(hit.total).toBe(20);
            expect(hit.hit).toBe(true);

            const miss = resolveAttack(10, 3, 18);
            expect(miss.total).toBe(13);
            expect(miss.hit).toBe(false);

            const critical = resolveAttack(20, 0, 25);
            expect(critical.critical).toBe(true);
            expect(critical.hit).toBe(true); // Nat 20 trifft immer

            const fumble = resolveAttack(1, 10, 5);
            expect(fumble.fumble).toBe(true);
        });

        test('sollte kritischen Schaden berechnen', () => {
            const calculateDamage = (diceNotation, isCritical = false) => {
                const dice = parseDiceNotation(diceNotation);
                if (!dice) return 0;

                // Kritisch: doppelte Würfelanzahl
                const count = isCritical ? dice.count * 2 : dice.count;

                // Durchschnittlicher Schaden für Tests
                const avgRoll = (dice.sides + 1) / 2;
                return Math.floor(count * avgRoll + dice.modifier);
            };

            const normalDamage = calculateDamage('2d6+3', false);
            const criticalDamage = calculateDamage('2d6+3', true);

            expect(criticalDamage).toBeGreaterThan(normalDamage);
        });
    });
});
