/**
 * Kreaturen-Editor: Attributmodifikator (KREATUR-ATTRIBUTE, U1b, U4 und U5)
 *
 * DER BEFUND: die sechs Attributfelder des Kreaturen-Editors zeigen nach jeder
 * Eingabe "+0" (bzw. im Bearbeiten-Modus den Modifikator des geladenen Werts),
 * und jeder Klick, jede Taste schreibt einen Fehler. Sie hingen an der
 * generischen Knopf-Aktion `call`; die kann ein Eingabefeld nicht bedienen
 * (Befund, Ursache und Faelle am gebauten Buendel:
 * tests/e2e/features/kreatur-attribute.spec.js).
 *
 * DIESE DATEI prueft drei Bausteine des Vertrags am echten Quelltext — die
 * zwei Funktionen per `vm` in einer Sandbox (Muster
 * tests/unit/event-delegation.test.js), das Markup tagweise:
 *
 *   U4  features/bestiary/bestiary-editor.js (R2): `updateBstAttrMod(attr)`
 *       nimmt den Schluessel als Text, rechnet `parseInt(wert) || 10` und
 *       floor((v-10)/2) mit Vorzeichen — UNGEKLEMMT wie im Encounter- und im
 *       Party-Formular (Nutzerentscheidung a: 35 -> "+12") —, schreibt nur
 *       #bst-<attr>-mod (kein D, kein save(), kein saveUndoState()) und kehrt
 *       bei einem fremden Schluessel zurueck. updateAllBstAttrMods rechnet alle
 *       sechs. Die explizite Zuweisung `window.updateBstAttrMod = …` entfaellt
 *       (Export-Audit: kein Leser mehr). Im Browser bleibt
 *       window.updateBstAttrMod trotzdem eine Funktion — die
 *       Top-Level-Funktionsdeklaration legt die Eigenschaft selbst an (am
 *       gebauten Buendel nachgemessen, dev und prod, an Basis und Kopf
 *       gleich); die Sandbox hier trennt `window` vom globalen Objekt und
 *       sieht nur die Zuweisung.
 *   U1b ui/actions/entity-actions.js (R3): der Handler 'update-bst-attr-mod'
 *       reicht `ctx.target.dataset.value` weiter und liest NIE ctx.value — bei
 *       input/change ist das der getippte Wert, bei leerem Feld der
 *       data-value-Rueckfall.
 *   U5  assets/templates/view-bestiary.html (R1): die sechs Felder tragen die
 *       eigene Aktion, den Schluessel in data-value und kein data-attr.
 *
 * Am Stand 543706c6 (vor dem Fix) sind rot: U1b (der Handler fehlt), die
 * U4-Faelle mit Schluessel als Text (die heutige Signatur liest `.target` von
 * einem String und schreibt nichts) und der Export-Fall. Gruen als Gegenprobe:
 * fremder Schluessel schreibt nichts, updateAllBstAttrMods.
 *
 * NACHPRUEFUNG (zwei Regeln waren unbewacht, je an einem Mutanten gemessen):
 * der Fall "fremder Schluessel" legt seither ein Feldpaar zum fremden
 * Schluessel an. Vorher lieferte `window.$('bst-xyz')` ohnehin null, und ein
 * Mutant OHNE die Schluesselpruefung von R2 blieb gruen (21 von 21); jetzt
 * sind an ihm alle vier Faelle rot. U5 ist neu: ein Mutant, an dessen sechs
 * Feldern data-attr stehen blieb, war in U2 (event-delegation.test.js), W9
 * und allen uebrigen Faellen gruen; U5 ist an ihm rot und nennt alle sechs
 * Felder. Am Stand 543706c6 ist U5 ebenfalls rot (`call` und data-attr).
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
 * @param {string[]} [fremde] Schluessel AUSSERHALB der sechs, fuer die die
 *   Sandbox trotzdem ein Paar bst-<schluessel> (Wert "18") und
 *   bst-<schluessel>-mod anlegt — ohne dieses Paar kehrte die Funktion schon an
 *   `!inputEl` zurueck, und die Schluesselpruefung von R2 waere unbewacht.
 */
function ladeEditor(werte, fremde = []) {
    /** @type {Record<string, any>} */
    const elemente = {};
    ATTR.forEach(a => {
        elemente['bst-' + a] = { value: werte[a] !== undefined ? werte[a] : '10' };
        elemente['bst-' + a + '-mod'] = { textContent: UNBERUEHRT };
    });
    fremde.forEach(f => {
        elemente['bst-' + f] = { value: '18' };
        elemente['bst-' + f + '-mod'] = { textContent: UNBERUEHRT };
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

    // Die Sandbox legt fuer den fremden Schluessel ein eigenes Feldpaar an (Wert "18"):
    // nur so sieht der Fall die Schluesselpruefung selbst und nicht bloss ein fehlendes
    // Element. Nachpruefung: an einem Mutanten ohne die Pruefung blieb die fruehere Form
    // dieses Falls gruen, weil `window.$('bst-xyz')` ohnehin null lieferte.
    test.each([['xyz'], [''], ['updateBstAttrMod'], ['18']])(
        'fremder Schluessel %p schreibt nichts und wirft nicht — auch wenn ein Feldpaar dazu existiert (R2)',
        fremd => {
            const { context, elemente } = ladeEditor({ str: '18' }, [fremd]);

            expect(() => context.updateBstAttrMod(fremd)).not.toThrow();

            expect(anzeigen(elemente)).toEqual(Object.fromEntries(ATTR.map(a => [a, UNBERUEHRT])));
            expect(elemente['bst-' + fremd + '-mod'].textContent).toBe(UNBERUEHRT);
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

    // Geprueft wird die gestrichene ZUWEISUNG (Export-Audit am Quelltext). Im Browser ist
    // window.updateBstAttrMod weiter eine Funktion: die Top-Level-Funktionsdeklaration legt
    // die Eigenschaft selbst an (eigene, nicht konfigurierbare Eigenschaft, nach dem Laden
    // abgelesen, dev und prod, an Basis und Kopf gleich).
    test('die Zuweisung window.updateBstAttrMod = … entfaellt — Export-Audit: der Handler ruft die Funktionsdeklaration, sonst liest niemand den Export', () => {
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

describe('Markup der sechs Attributfelder (KREATUR-ATTRIBUTE, R1, U5)', () => {
    // R1 verlangt drei Dinge am Markup: die eigene Aktion, den Schluessel in data-value
    // und KEIN data-attr mehr (sein einziger Leser war die alte Signatur
    // updateBstAttrMod(ctx) mit ctx.target.dataset.attr). U2 (event-delegation.test.js)
    // und W9 (Spec) pruefen nur, dass kein Formularfeld `call` traegt — ein Fix, der das
    // tote data-attr stehen liesse, bliebe dort gruen (Nachpruefung, an einem Mutanten
    // gemessen). Gelesen wird TAGWEISE: die Vorlage ist CRLF, Tag-Anfang und data-action
    // stehen auf verschiedenen Zeilen.
    const TEMPLATE_PATH = path.join(__dirname, '../../assets/templates/view-bestiary.html');

    /** Wert eines Attributs im Tag, oder null, wenn es fehlt. */
    function attribut(tag, name) {
        const m = tag.match(new RegExp('\\s' + name + '\\s*=\\s*"([^"]*)"'));
        return m ? m[1] : null;
    }

    test('jedes der sechs Felder steht genau einmal da, mit data-action="update-bst-attr-mod", data-value = Schluessel, ohne data-attr', () => {
        const tags = fs.readFileSync(TEMPLATE_PATH, 'utf8').match(/<input\b[^>]*>/gi) || [];

        const ist = Object.fromEntries(
            ATTR.map(a => {
                const eigene = tags.filter(t => attribut(t, 'id') === 'bst-' + a);
                return [
                    a,
                    eigene.map(t => ({
                        action: attribut(t, 'data-action'),
                        value: attribut(t, 'data-value'),
                        attr: attribut(t, 'data-attr')
                    }))
                ];
            })
        );

        expect(ist).toEqual(
            Object.fromEntries(
                ATTR.map(a => [a, [{ action: 'update-bst-attr-mod', value: a, attr: null }]])
            )
        );
    });
});
