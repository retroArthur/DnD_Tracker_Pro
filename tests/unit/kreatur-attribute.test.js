/**
 * Kreaturen-Editor: Attributmodifikator (KREATUR-ATTRIBUTE, U1b und U4)
 *
 * DER BEFUND: die sechs Attributfelder des Kreaturen-Editors zeigen nach jeder
 * Eingabe "+0" (bzw. im Bearbeiten-Modus den Modifikator des geladenen Werts),
 * und jeder Klick, jede Taste schreibt einen Fehler. Sie hingen an der
 * generischen Knopf-Aktion `call`; die kann ein Eingabefeld nicht bedienen
 * (Befund, Ursache und Faelle am gebauten Buendel:
 * tests/e2e/features/kreatur-attribute.spec.js).
 *
 * DIESE DATEI prueft die zwei Bausteine des Vertrags am echten Quelltext, per
 * `vm` in einer Sandbox (Muster tests/unit/event-delegation.test.js):
 *
 *   U4  features/bestiary/bestiary-editor.js (R2): `updateBstAttrMod(attr)`
 *       nimmt den Schluessel als Text, rechnet `parseInt(wert) || 10` und
 *       floor((v-10)/2) mit Vorzeichen — UNGEKLEMMT wie im Encounter- und im
 *       Party-Formular (Nutzerentscheidung a: 35 -> "+12") —, schreibt nur
 *       #bst-<attr>-mod (kein D, kein save(), kein saveUndoState()) und kehrt
 *       bei einem fremden Schluessel zurueck. updateAllBstAttrMods rechnet alle
 *       sechs. Der window-Export entfaellt (Export-Audit: kein Leser mehr).
 *   U1b ui/actions/entity-actions.js (R3): der Handler 'update-bst-attr-mod'
 *       reicht `ctx.target.dataset.value` weiter und liest NIE ctx.value — bei
 *       input/change ist das der getippte Wert, bei leerem Feld der
 *       data-value-Rueckfall.
 *
 * Am Stand 543706c6 (vor dem Fix) sind rot: U1b (der Handler fehlt), die
 * U4-Faelle mit Schluessel als Text (die heutige Signatur liest `.target` von
 * einem String und schreibt nichts) und der Export-Fall. Gruen als Gegenprobe:
 * fremder Schluessel schreibt nichts, updateAllBstAttrMods.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const EDITOR_PATH = path.join(__dirname, '../../features/bestiary/bestiary-editor.js');
const ENTITY_ACTIONS_PATH = path.join(__dirname, '../../ui/actions/entity-actions.js');

const ATTR = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
/** Was der Test vor dem Aufruf in jede Modifikator-Anzeige schreibt: kein
 *  Wert, den die Rechnung je ergibt — ein Feld, das nicht beschrieben wird,
 *  faellt daran auf. */
const UNBERUEHRT = 'unberuehrt';

/**
 * Laedt features/bestiary/bestiary-editor.js in eine frische Sandbox. Die
 * Felder sind schlichte Objekte mit `value` bzw. `textContent`, `window.$`
 * liefert sie nach ID. D, save und saveUndoState sind Fallen, die jeden Zugriff
 * mitschreiben.
 * @param {Record<string, string>} werte Feldwerte je Attribut
 */
function ladeEditor(werte) {
    /** @type {Record<string, any>} */
    const elemente = {};
    ATTR.forEach(a => {
        elemente['bst-' + a] = { value: werte[a] !== undefined ? werte[a] : '10' };
        elemente['bst-' + a + '-mod'] = { textContent: UNBERUEHRT };
    });
    const zugriffe = [];
    const falle = name =>
        new Proxy(
            {},
            {
                get(_, k) {
                    zugriffe.push(name + '.' + String(k));
                    return undefined;
                }
            }
        );
    const save = jest.fn();
    const saveUndoState = jest.fn();
    const windowStub = {
        $: id => elemente[id] || null,
        D: falle('D'),
        save,
        saveUndoState
    };
    const context = { window: windowStub, D: windowStub.D, save, saveUndoState, console };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(EDITOR_PATH, 'utf8'), context);
    return { context, windowStub, elemente, zugriffe, save, saveUndoState };
}

/** Die sechs Anzeigen als Objekt. */
function anzeigen(elemente) {
    return Object.fromEntries(ATTR.map(a => [a, elemente['bst-' + a + '-mod'].textContent]));
}

describe('updateBstAttrMod(attr) — der Schluessel als Text (KREATUR-ATTRIBUTE, U4)', () => {
    test.each([
        ['8', '-1'],
        ['18', '+4'],
        ['10', '+0'],
        ['1', '-5'],
        ['30', '+10']
    ])('GE-Feld %p zeigt %p', (wert, soll) => {
        const { context, elemente } = ladeEditor({ dex: wert });

        context.updateBstAttrMod('dex');

        expect(elemente['bst-dex-mod'].textContent).toBe(soll);
    });

    test.each([
        ['', '+0', 'leeres Feld (Rueckfall 10 wie saveBestiary)'],
        ['0', '+0', '"0" (parseInt || 10)'],
        ['35', '+12', 'ueber 30, ungeklemmt (Entscheidung a)'],
        ['-5', '-8', 'unter 1, ungeklemmt (Entscheidung a)']
    ])('Feld %p zeigt %p — %s', (wert, soll) => {
        const { context, elemente } = ladeEditor({ str: wert });

        context.updateBstAttrMod('str');

        expect(elemente['bst-str-mod'].textContent).toBe(soll);
    });

    test('schreibt NUR die eigene Anzeige — die fuenf anderen bleiben unberuehrt', () => {
        const { context, elemente } = ladeEditor({ con: '7' });

        context.updateBstAttrMod('con');

        expect(anzeigen(elemente)).toEqual({
            str: UNBERUEHRT,
            dex: UNBERUEHRT,
            con: '-2',
            int: UNBERUEHRT,
            wis: UNBERUEHRT,
            cha: UNBERUEHRT
        });
    });

    test.each([['xyz'], [''], ['updateBstAttrMod'], ['18']])(
        'fremder Schluessel %p schreibt nichts und wirft nicht (Gegenprobe)',
        fremd => {
            const { context, elemente } = ladeEditor({ str: '18' });

            expect(() => context.updateBstAttrMod(fremd)).not.toThrow();

            expect(anzeigen(elemente)).toEqual(Object.fromEntries(ATTR.map(a => [a, UNBERUEHRT])));
        }
    );

    test('kein Zugriff auf D, kein save(), kein saveUndoState() — die Anzeige ist keine Datenaenderung', () => {
        const { context, zugriffe, save, saveUndoState } = ladeEditor({ wis: '20' });

        context.updateBstAttrMod('wis');

        expect(zugriffe).toEqual([]);
        expect(save).not.toHaveBeenCalled();
        expect(saveUndoState).not.toHaveBeenCalled();
    });

    test('updateAllBstAttrMods rechnet alle sechs (Gegenprobe: beim Oeffnen stimmt die Anzeige schon heute)', () => {
        const { context, elemente } = ladeEditor({
            str: '18',
            dex: '14',
            con: '12',
            int: '8',
            wis: '10',
            cha: '6'
        });

        context.updateAllBstAttrMods();

        expect(anzeigen(elemente)).toEqual({
            str: '+4',
            dex: '+2',
            con: '+1',
            int: '-1',
            wis: '+0',
            cha: '-2'
        });
    });

    test('window.updateBstAttrMod entfaellt — Export-Audit: der Handler ruft die Funktionsdeklaration, sonst liest niemand den Export', () => {
        const { windowStub } = ladeEditor({});

        expect(windowStub.updateBstAttrMod).toBeUndefined();
    });
});

describe("Handler 'update-bst-attr-mod' liest den Schluessel aus dem Feld, nie ctx.value (KREATUR-ATTRIBUTE, U1b)", () => {
    /** Laedt ui/actions/entity-actions.js mit gestubbter EventDelegation. */
    function ladeAktionen() {
        const handlers = new Map();
        const updateBstAttrMod = jest.fn();
        const context = {
            window: {},
            EventDelegation: { registerAction: (name, handler) => handlers.set(name, handler) },
            updateBstAttrMod,
            console
        };
        vm.createContext(context);
        vm.runInContext(fs.readFileSync(ENTITY_ACTIONS_PATH, 'utf8'), context);
        return { handlers, updateBstAttrMod };
    }

    // Die Kontexte sind die, die ui/event-delegation.js baut: bei input/change
    // `value = target.value || target.dataset.value`, beim Klick
    // `value = target.dataset.value`.
    test.each([
        ['input mit getipptem Wert', 'input', '18', '18', 'dex'],
        ['change mit getipptem Wert', 'change', '7', '7', 'con'],
        ['input bei leerem Feld (data-value-Rueckfall)', 'input', '', 'cha', 'cha'],
        ['click', 'click', '20', 'wis', 'wis']
    ])(
        '%s (%s): Feld %p, ctx.value %p -> updateBstAttrMod(%p)',
        (_, typ, feldwert, ctxWert, schluessel) => {
            const { handlers, updateBstAttrMod } = ladeAktionen();
            const handler = handlers.get('update-bst-attr-mod');
            expect(typeof handler).toBe('function');

            handler({
                id: null,
                type: null,
                value: ctxWert,
                target: { dataset: { value: schluessel }, value: feldwert },
                event: { type: typ }
            });

            expect(updateBstAttrMod).toHaveBeenCalledTimes(1);
            expect(updateBstAttrMod).toHaveBeenCalledWith(schluessel);
        }
    );
});
