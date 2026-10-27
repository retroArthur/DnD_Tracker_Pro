/**
 * Unit — Wurfeintrag aus Schnellreferenz, Bestiar, Schnellwurf und DM-Screen (WUERFEL)
 *
 * BEFUND, GEGEN DEN DIESE DATEI GESCHRIEBEN IST: rollQrefDice() trug ueber
 * `window.addToHistory(...)` ein — eine Funktion, die es nie gab — und
 * wuerfelte mit einem eigenen Parser, der den Modifikator verlor und das W
 * der deutschen Statbloecke nicht kannte. quickRoll() schrieb nur
 * D.diceHistory. dmsRollDice() trug eine ungueltige Freiformel als Wurf mit
 * Summe 0 ein, nachdem parseDiceNotation() per alert() abgelehnt hatte. Am
 * gebauten Buendel misst das tests/e2e/features/wurf-verlauf.spec.js; diese
 * Datei haelt die Grenzen fest, die man am Bildschirm schlecht erreicht:
 * die Obergrenze der Wuerfelzahl, den Lauf OHNE das Wuerfelmodul (die
 * Unit-Werkbaenke laden quick-reference.js und quick-roll.js ohne
 * dice-core.js) und dass KEINE Eingabe den alert() von parseDiceNotation()
 * erreicht.
 *
 * Werkbank: die echten Quellmodule per vm.runInContext() in einer schlanken
 * Sandbox, wie tests/unit/dmscreen-config.test.js. Math.random ist eine
 * Schattenkopie mit festem 0,5 (d20 = 11, d6 = 4) — nie das echte Math
 * mutieren, das gilt fuer den ganzen Jest-Prozess.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Die loader.js-relativen Pfade stehen in AUSFUEHRBAREM Code: genau diese
// Module werden unten geladen und ausgefuehrt.
const WUERFEL_KERN = 'features/dice/dice-core.js';
const SCHNELLREFERENZ = 'systems/spellslots/quick-reference.js';
const SCHNELLWURF = 'systems/spellslots/quick-roll.js';
const DM_SCREEN_BASIS = 'features/dmscreen/dmscreen-widgets-base.js';

/**
 * Baut eine Sandbox und laedt die genannten Module hinein.
 * @param {string[]} module - loader.js-relative Pfade
 * @param {Object} [zusatz] - weitere Globale (z. B. ein Ersatz-parseDiceNotation)
 */
function sandbox(module, zusatz = {}) {
    const FesteMath = Object.create(Math);
    FesteMath.random = () => 0.5;
    const context = {
        console,
        Math: FesteMath,
        Date,
        alert: jest.fn(),
        // renderDiceHistory()/dmsRollDice() suchen ihre Anzeige — hier gibt es keine.
        $: () => null,
        showToast: jest.fn(),
        statsIdbPut: jest.fn(),
        D: { diceHistory: [] },
        ...zusatz
    };
    context.window = context;
    context.globalThis = context;
    vm.createContext(context);
    for (const rel of module) {
        const abs = path.join(PROJECT_ROOT, rel);
        vm.runInContext(fs.readFileSync(abs, 'utf8'), context, { filename: abs });
    }
    return context;
}

/** Der Verlauf als schlichte Daten (ohne Zeitstempel). */
function verlauf(ctx) {
    return vm
        .runInContext('diceHistory', ctx)
        .map(h => ({ notation: h.notation, result: h.result, rolls: [...h.rolls] }));
}

/** Meldungen eines Typs (z. B. 'error') aus dem showToast-Ersatz. */
function meldungen(ctx, typ) {
    return ctx.showToast.mock.calls.filter(c => (c[1] || 'success') === typ).map(c => c[0]);
}

/**
 * Formeln, die NICHT gewuerfelt werden duerfen — und an denen der alte
 * Parser oder eine zu lockere Vorpruefung den alert() erreicht haette.
 */
const UNGUELTIG = [
    'abc',
    'd',
    '1d',
    'W6x',
    '1d6+',
    '1d6++2',
    '1d6 (Feuer)',
    '+4',
    '1e6',
    '2d20kh1',
    '1d6*2',
    '1d6+2d4'
];

describe('WUERFEL — rollQrefDice() traegt ein und rechnet richtig', () => {
    test('W1: "1W6+2" wird als "1d6+2" gewuerfelt, mit Modifikator, und landet in Verlauf und Statistik', () => {
        const ctx = sandbox([WUERFEL_KERN, SCHNELLREFERENZ]);
        ctx.rollQrefDice('1W6+2');
        expect(verlauf(ctx)).toEqual([{ notation: '1d6+2', result: 6, rolls: [4] }]);
        expect(ctx.statsIdbPut).toHaveBeenCalledTimes(1);
        expect(ctx.statsIdbPut.mock.calls[0][0]).toMatchObject({
            notation: '1d6+2',
            result: 6,
            rolls: [4]
        });
        expect(meldungen(ctx, 'info')).toEqual(['🎲 1W6+2 = 6 (4+2)']);
        expect(ctx.alert).not.toHaveBeenCalled();
    });

    test('W2: der Trefferbonus "1d20+4" ergibt 15, nicht 11', () => {
        const ctx = sandbox([WUERFEL_KERN, SCHNELLREFERENZ]);
        ctx.rollQrefDice('1d20+4');
        expect(verlauf(ctx)).toEqual([{ notation: '1d20+4', result: 15, rolls: [11] }]);
    });

    test('W3: Leerzeichen und grosses W werden einmal normalisiert ("2 W6 - 1" -> "2d6-1")', () => {
        const ctx = sandbox([WUERFEL_KERN, SCHNELLREFERENZ]);
        ctx.rollQrefDice('2 W6 - 1');
        expect(verlauf(ctx)).toEqual([{ notation: '2d6-1', result: 7, rolls: [4, 4] }]);
    });

    test.each(UNGUELTIG)(
        'W4: "%s" wird abgewiesen — Fehlermeldung, kein Eintrag, KEIN alert()',
        formel => {
            const ctx = sandbox([WUERFEL_KERN, SCHNELLREFERENZ]);
            ctx.rollQrefDice(formel);
            expect(ctx.alert).not.toHaveBeenCalled();
            expect(verlauf(ctx)).toEqual([]);
            expect(ctx.statsIdbPut).not.toHaveBeenCalled();
            expect(meldungen(ctx, 'error')).toEqual(['Ungültige Würfelformel']);
        }
    );

    test('W5: Obergrenze 100 Wuerfel — "100W6" wird gewuerfelt, "101W6" abgewiesen (CLAUDE.md Regel 7)', () => {
        const ctx = sandbox([WUERFEL_KERN, SCHNELLREFERENZ]);
        ctx.rollQrefDice('100W6');
        expect(verlauf(ctx)).toHaveLength(1);
        expect(verlauf(ctx)[0].rolls).toHaveLength(100);

        ctx.rollQrefDice('101W6');
        ctx.rollQrefDice('99999W6');
        expect(verlauf(ctx)).toHaveLength(1);
        expect(meldungen(ctx, 'error')).toHaveLength(2);
        expect(meldungen(ctx, 'error')[0]).toContain('100');
        expect(ctx.alert).not.toHaveBeenCalled();
    });

    test('W6: der Schadensart-Chip des Wuerfel-Tabs beschriftet seine eigenen Wuerfe, nicht Schnellreferenz und Schnellwurf', () => {
        const ctx = sandbox([WUERFEL_KERN, SCHNELLREFERENZ, SCHNELLWURF]);
        vm.runInContext("selectedDamageType = 'Feuer'", ctx);
        // Bestehende Aufrufer (drei Argumente) unveraendert: mit Zusatz.
        ctx.addToDiceHistory('1d6', 4, [4]);
        ctx.rollQrefDice('1d6');
        ctx.quickRoll(20);
        expect(verlauf(ctx).map(h => h.notation)).toEqual(['1d20', '1d6', '1d6 (Feuer)']);
        // Die Statistik bekam nie einen Zusatz — daran aendert sich nichts.
        expect(ctx.statsIdbPut.mock.calls.map(c => c[0].notation)).toEqual(['1d6', '1d6', '1d20']);
    });
});

describe('WUERFEL — Laeufe ohne Wuerfelmodul (Unit-Werkbaenke) werfen nicht', () => {
    test('W7: ohne parseDiceNotation() eine eigene Meldung, nicht "Ungültige Würfelformel"', () => {
        const ctx = sandbox([SCHNELLREFERENZ]);
        expect(() => ctx.rollQrefDice('1d6')).not.toThrow();
        const fehler = meldungen(ctx, 'error');
        expect(fehler).toHaveLength(1);
        expect(fehler[0]).not.toBe('Ungültige Würfelformel');
    });

    test('W8: ohne addToDiceHistory() wird gewuerfelt und gemeldet, ohne zu werfen', () => {
        const parseDiceNotation = jest.fn(() => ({
            total: 6,
            rolls: [4],
            keptRolls: [4],
            modifier: 2
        }));
        const ctx = sandbox([SCHNELLREFERENZ], { parseDiceNotation });
        expect(() => ctx.rollQrefDice('1W6+2')).not.toThrow();
        expect(parseDiceNotation).toHaveBeenCalledWith('1d6+2');
        expect(meldungen(ctx, 'info')).toEqual(['🎲 1W6+2 = 6 (4+2)']);
    });

    test('W9: quickRoll() ohne Wuerfelmodul schreibt D.diceHistory weiter und wirft nicht', () => {
        const ctx = sandbox([SCHNELLWURF]);
        expect(() => ctx.quickRoll(20)).not.toThrow();
        expect(ctx.D.diceHistory).toHaveLength(1);
        expect(ctx.D.diceHistory[0]).toMatchObject({ dice: 'd20', result: 11 });
    });
});

describe('WUERFEL — quickRoll() traegt in Verlauf und Statistik ein', () => {
    test('W10: R/Alt+Ziffer/Befehlspalette — "1d<Seiten>", Summe, ein Wuerfel', () => {
        const ctx = sandbox([WUERFEL_KERN, SCHNELLWURF]);
        ctx.quickRoll(20);
        ctx.quickRoll(6);
        expect(verlauf(ctx)).toEqual([
            { notation: '1d6', result: 4, rolls: [4] },
            { notation: '1d20', result: 11, rolls: [11] }
        ]);
        expect(ctx.statsIdbPut).toHaveBeenCalledTimes(2);
        // Der Schreibzugriff auf D.diceHistory bleibt (Migration, Backup-Heuristik).
        expect(ctx.D.diceHistory).toHaveLength(2);
    });
});

describe('WUERFEL — dmsRollDice() wuerfelt nur gueltige Formeln', () => {
    test('W11: "2d6+3" wird gewuerfelt und eingetragen', () => {
        const ctx = sandbox([WUERFEL_KERN, DM_SCREEN_BASIS]);
        expect(ctx.dmsRollDice('2d6+3')).toBe(11);
        expect(verlauf(ctx)).toEqual([{ notation: '2d6+3', result: 11, rolls: [4, 4] }]);
    });

    test('W12: "4d6kh3" bleibt erlaubt — dieselbe Grammatik wie parseDiceNotation()', () => {
        const ctx = sandbox([WUERFEL_KERN, DM_SCREEN_BASIS]);
        expect(ctx.dmsRollDice('4d6kh3')).toBe(12);
        expect(verlauf(ctx)).toHaveLength(1);
        expect(ctx.alert).not.toHaveBeenCalled();
    });

    test.each(UNGUELTIG.filter(f => f !== '2d20kh1'))(
        'W13: "%s" ist kein Wurf — kein Eintrag, keine Statistik, KEIN alert(), eine Fehlermeldung',
        formel => {
            const ctx = sandbox([WUERFEL_KERN, DM_SCREEN_BASIS]);
            expect(ctx.dmsRollDice(formel)).toBeNull();
            expect(ctx.alert).not.toHaveBeenCalled();
            expect(verlauf(ctx)).toEqual([]);
            expect(ctx.statsIdbPut).not.toHaveBeenCalled();
            expect(meldungen(ctx, 'error')).toHaveLength(1);
        }
    );
});
