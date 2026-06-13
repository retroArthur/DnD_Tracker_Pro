/**
 * initiative-mob.js Unit-Tests — Wave-0 Validierungs-Kontrakt
 * Testet: parseLegendaryResistanceCount(), getMobAlive(), calcMobHits(), createMobCombatant()
 *
 * Analog: tests/unit/srd-monsters.test.js — vm.runInContext-Muster
 * Nyquist Wave-0: Alle reinen Funktionen muessen VOR UI-Integration grueen sein.
 * Der DMG-Mob-Regel-Test ist der einzelne Korrekturpunkt fuer die [ASSUMED]-Formel (D-13b).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: initiative-mob.js in vm-Kontext laden
// ============================================================

let parseLegendaryResistanceCount;
let getMobAlive;
let calcMobHits;
let createMobCombatant;

beforeAll(() => {
    // Kontext bereitstellen: window, console, Math, nextId-Stub
    const context = {
        window: {
            nextId: () => 1   // Test-Stub: echtes nextId() nicht verfuegbar in vm
        },
        console: console,
        Math: Math
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../features/initiative-mob.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    // Funktionen aus window extrahieren
    parseLegendaryResistanceCount = context.window.parseLegendaryResistanceCount;
    getMobAlive                   = context.window.getMobAlive;
    calcMobHits                   = context.window.calcMobHits;
    createMobCombatant            = context.window.createMobCombatant;
});

// ============================================================
// TESTS: parseLegendaryResistanceCount()
// ============================================================

describe('parseLegendaryResistanceCount()', () => {
    test('erkennt deutsches Format "3-mal taeglich"', () => {
        const monster = {
            traits: [
                { name: 'Legendäre Resistenz (3-mal täglich)', desc: '...' }
            ]
        };
        expect(parseLegendaryResistanceCount(monster)).toBe(3);
    });

    test('erkennt englisches Format "(2/Day)"', () => {
        const monster = {
            traits: [
                { name: 'Legendary Resistance (2/Day)', desc: '...' }
            ]
        };
        expect(parseLegendaryResistanceCount(monster)).toBe(2);
    });

    test('gibt 0 zurueck wenn kein LR-Trait vorhanden', () => {
        const monster = {
            traits: [
                { name: 'Mehrfachangriff', desc: 'Der Ork trifft zweimal.' }
            ]
        };
        expect(parseLegendaryResistanceCount(monster)).toBe(0);
    });

    test('gibt 0 zurueck bei null', () => {
        expect(parseLegendaryResistanceCount(null)).toBe(0);
    });

    test('gibt 0 zurueck bei fehlendem traits-Feld', () => {
        expect(parseLegendaryResistanceCount({ name: 'Goblin' })).toBe(0);
    });

    test('gibt 0 zurueck bei leerer traits-Liste', () => {
        expect(parseLegendaryResistanceCount({ traits: [] })).toBe(0);
    });

    test('erkennt HTML-String-Format (Custom-Kreatur)', () => {
        const monster = {
            traits: '<p><strong>Legendäre Resistenz (3-mal täglich)</strong>: ...</p>'
        };
        expect(parseLegendaryResistanceCount(monster)).toBe(3);
    });
});

// ============================================================
// TESTS: getMobAlive()
// ============================================================

describe('getMobAlive()', () => {
    test('berechnet lebende Kreaturen per Ceiling-Division', () => {
        const cb = { mob: { poolHp: 35, individualMaxHp: 7 } };
        expect(getMobAlive(cb)).toBe(5);  // ceil(35/7) = 5
    });

    test('gibt 1 zurueck bei 1 HP und 7 individualMaxHp', () => {
        const cb = { mob: { poolHp: 1, individualMaxHp: 7 } };
        expect(getMobAlive(cb)).toBe(1);  // ceil(1/7) = 1
    });

    test('gibt 0 zurueck bei 0 Pool-HP (Mob besiegt)', () => {
        const cb = { mob: { poolHp: 0, individualMaxHp: 7 } };
        expect(getMobAlive(cb)).toBe(0);  // max(0, ceil(0/7)) = 0
    });

    test('gibt 1 zurueck wenn kein cb.mob vorhanden', () => {
        const cb = { name: 'Einzelner Kombattant', currentHp: 20 };
        expect(getMobAlive(cb)).toBe(1);
    });

    test('Ceiling: 34 poolHp / 7 individualMaxHp = 5', () => {
        const cb = { mob: { poolHp: 34, individualMaxHp: 7 } };
        expect(getMobAlive(cb)).toBe(5);  // ceil(34/7) = 4.857... → ceil = 5
    });
});

// ============================================================
// TESTS: calcMobHits() — DMG-Mob-Regel (D-13b) [ASSUMED]
// INIT-03 / DMG-Mob-Regel — einzelner Korrekturpunkt fuer die [ASSUMED]-Formel
// Anker-Case: 10 Goblins, +4 Angriff, AC 15 → needed=11, fraction=0.5, Treffer=5
// ============================================================

describe('calcMobHits() — INIT-03 / DMG-Mob-Regel', () => {
    test('INIT-03 / DMG-Mob-Regel: 10 Goblins (+4) vs AC 15 = 5 Treffer', () => {
        // needed = max(2, 15-4) = 11
        // fraction = (21-11)/20 = 10/20 = 0.5
        // hits = floor(10 * 0.5) = 5
        expect(calcMobHits(10, 4, 15)).toBe(5);
    });

    test('Hohe RK: needed >= 20 → nur Nat-20 (5% Mindest-Treffer)', () => {
        // needed = max(2, 30-0) = 30 → klemmt auf Nat-20-Pfad
        // hits = max(1, floor(10 * 0.05)) = max(1, 0) = 1
        const hits = calcMobHits(10, 0, 30);
        expect(hits).toBeGreaterThanOrEqual(1);  // Mindestens 1 Treffer (Nat-20)
    });

    test('Einfacher Treffer: +8 Angriff vs AC 10', () => {
        // needed = max(2, 10-8) = 2
        // fraction = (21-2)/20 = 19/20 = 0.95
        // hits = floor(10 * 0.95) = 9
        expect(calcMobHits(10, 8, 10)).toBe(9);
    });

    test('Kein Treffer unmoeglich: max(0, ...) Grenzwert', () => {
        // Auch bei guenstiger Ruestung kein negativer Wert
        const hits = calcMobHits(0, 10, 10);
        expect(hits).toBeGreaterThanOrEqual(0);
    });

    test('needed = 2 Minimum (max(2, ...) Clamp)', () => {
        // targetAC - attackBonus = 5 - 10 = -5 → needed = max(2, -5) = 2
        // fraction = (21-2)/20 = 0.95
        // hits = floor(10 * 0.95) = 9
        expect(calcMobHits(10, 10, 5)).toBe(9);
    });
});

// ============================================================
// TESTS: createMobCombatant()
// ============================================================

describe('createMobCombatant()', () => {
    test('setzt mob.count korrekt', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 10, 'srd');
        expect(cb.mob.count).toBe(10);
    });

    test('setzt mob.individualMaxHp auf Basiswert', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 10, 'srd');
        expect(cb.mob.individualMaxHp).toBe(7);
    });

    test('currentHp === maxHp === mob.poolHp bei Erstellung', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 10, 'srd');
        expect(cb.currentHp).toBe(cb.maxHp);
        expect(cb.currentHp).toBe(cb.mob.poolHp);
    });

    test('mob.poolHp ist positiv', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 10, 'srd');
        expect(cb.mob.poolHp).toBeGreaterThan(0);
    });

    test('Name endet auf -Schwarm', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 5, 'srd');
        expect(cb.name).toBe('Goblin-Schwarm');
    });

    test('type ist monster', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 5, 'srd');
        expect(cb.type).toBe('monster');
    });

    test('statblockRef.id ist monster._id bei SRD-Monstern', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 5, 'srd');
        expect(cb.statblockRef.id).toBe('goblin');
        expect(cb.statblockRef.source).toBe('srd');
    });

    test('statblockRef.id ist monster.id bei Custom-Monstern', () => {
        const monster = { name: 'Eigener Boss', hp: 100, dex: 10, ac: 16, cr: '5', id: 42, _id: undefined };
        const cb = createMobCombatant(monster, 3, 'custom');
        expect(cb.statblockRef.id).toBe(42);
        expect(cb.statblockRef.source).toBe('custom');
    });

    test('attackMode startet als nfach', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 10, 'srd');
        expect(cb.mob.attackMode).toBe('nfach');
    });

    test('Pool-HP Variation ist positiv (count=10 Goblins)', () => {
        const monster = { name: 'Goblin', hp: 7, dex: 14, ac: 13, cr: '1/4', _id: 'goblin' };
        const cb = createMobCombatant(monster, 10, 'srd');
        // Pool muss > 0 und plausibel sein (10 * 7 * 0.9 = 63 bis 10 * 7 * 1.1 = 77)
        expect(cb.mob.poolHp).toBeGreaterThanOrEqual(1);
        expect(cb.mob.poolHp).toBeLessThanOrEqual(200); // vernuenftiger Maximalwert
    });
});
