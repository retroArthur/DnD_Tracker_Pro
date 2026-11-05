/**
 * Der change-Zweig des Verteilers — R1 aus dem Vertrag BESTIAR-KLICK
 * =================================================================
 *
 * DER BEFUND. Nach dem Tippen in ein Suchfeld wurde der ERSTE Klick auf einen
 * Treffer verschluckt — im Bestiar, in sechs weiteren Listen und in Feldern mit
 * eigener Aktion (Wiki-Suchfeld, "Zauber zuweisen", "Items zuweisen").
 * Gemessen am Buendel zu 71dd26b6: das Feld verliert beim mousedown den Fokus,
 * Chromium feuert SYNCHRON `change`, `ui/event-delegation.js` stellt dieselbe
 * Aktion wie fuer `input` noch einmal zu, die Liste wird per innerHTML neu
 * gezeichnet — fuer einen Wert, den sie beim Tippen laengst gezeichnet hat. Der
 * mousedown-Knoten ist weg, und aus mousedown und mouseup entsteht kein click.
 *
 * DIE REGEL (R1). NUR im data-action-Zweig wird ein `change` auf einem
 * TEXTARTIGEN INPUT (text, search, url, email, tel, password, number) nicht
 * zugestellt, wenn derselbe Handler fuer DIESES Element den IDENTISCHEN Wert
 * schon per `input` bekommen hat. Gemerkt wird in `_handleInput`, verglichen
 * in `_handleChange`.
 *
 * WAS UNBERUEHRT BLEIBT, und warum jeder Fall unten traegt:
 *   - der Legacy-Zweig `data-on-change`: `validateAssignItemQty` haengt NUR an
 *     `change` und hat keinen input-Pfad (die Mengenfelder in "Items
 *     zuweisen"). Ein pauschales "change auf Text-/Zahlfeldern ueberspringen"
 *     wuerde das Klemmen auf den Bestand abschalten.
 *   - SELECT, checkbox und radio: ihr Wert ist kein Getipptes — eine Checkbox
 *     meldet bei JEDEM Umschalten `value === 'on'`. Eine Regel, die nur Werte
 *     vergleicht, wuerde dort jedes zweite Ereignis schlucken.
 *   - file (Markdown-Import und Soundboard unterscheiden input/change), range
 *     und date; ebenso TEXTAREA, die R1 nicht nennt. Die Zeile file faehrt die
 *     App wirklich: beide Datei-Aktionen lesen NUR beim change, und ohne die
 *     Typschranke sind `tests/e2e/features/markdown-austausch.spec.js` und
 *     `tests/e2e/features/soundboard.spec.js` rot (21 von 31 Faellen, am
 *     Mutanten nachgemessen) — das change desselben Dateinamens wuerde als
 *     "nichts Neues" verschluckt. Die uebrigen Zeilen haelt nur diese Tabelle.
 *
 * WAS NUR EIN BROWSER BEANTWORTEN KANN — ob danach der erste Klick wirklich
 * waehlt —, steht in `tests/e2e/features/bestiar-klick.spec.js` (W1–W6, echte
 * Klicks und Taps). Dieser Fall urteilt ueber die ENTSCHEIDUNGSTABELLE davor:
 * welches change zugestellt wird. Viele Zeilen davon (radio, range, date, ein
 * Wert, der sich ohne input aendert, eine Aktion, die zwischen input und change
 * wechselt) faehrt keine Ansicht der App, und gerade dort entscheidet sich,
 * ob ein Fix zu weit greift.
 *
 * AM BASISSTAND 71dd26b6 sind genau die Faelle der ersten Gruppe rot (der
 * Verteiler stellt jedes change zu); alle Faelle der zweiten Gruppe sind dort
 * gruen und muessen es bleiben.
 *
 * Lade-Muster identisch zu `tests/unit/event-delegation-keydown.test.js`
 * (vm-Sandbox um ui/event-delegation.js).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../ui/event-delegation.js');

/** Die INPUT-Arten, fuer die R1 gilt. */
const TEXTARTIG = ['text', 'search', 'url', 'email', 'tel', 'password', 'number'];

/**
 * Laedt ui/event-delegation.js in eine frische Sandbox und registriert zwei
 * Aktionen, die jeden Aufruf mitschreiben.
 */
function ladeVerteiler() {
    const validateAssignItemQty = jest.fn();
    const context = {
        window: { validateAssignItemQty },
        console,
        ErrorHandler: { log: jest.fn() },
        parseEntityId: id => (id != null ? parseInt(id, 10) : null)
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
    // `const EventDelegation = {...}` landet als globale Lexical-Binding im
    // vm-Kontext, nicht als Property des context-Objekts (Node-vm-Eigenheit).
    const EventDelegation = vm.runInContext('EventDelegation', context);
    /** @type {{aktion: string, typ: string, wert: string}[]} */
    const gerufen = [];
    for (const aktion of ['tun', 'anders']) {
        EventDelegation.registerAction(aktion, ctx =>
            gerufen.push({ aktion, typ: ctx.event.type, wert: ctx.target.value })
        );
    }
    return { EventDelegation, gerufen, validateAssignItemQty };
}

/**
 * Ein Formularelement, wie der Verteiler es sieht. `type` wie im DOM: ein
 * INPUT ohne Attribut meldet 'text', ein SELECT 'select-one', ein TEXTAREA
 * 'textarea'.
 * @param {Object} [opts]
 * @param {string} [opts.tagName]
 * @param {string} [opts.type]
 * @param {string} [opts.value]
 * @param {string|null} [opts.action]
 * @param {string} [opts.onChange] Legacy data-on-change
 */
function feld(opts = {}) {
    /** @type {Record<string, string>} */
    const dataset = {};
    const action = opts.action === undefined ? 'tun' : opts.action;
    if (action) dataset.action = action;
    if (opts.onChange) dataset.onChange = opts.onChange;
    return {
        tagName: opts.tagName || 'INPUT',
        type: opts.type || 'text',
        value: opts.value === undefined ? '' : opts.value,
        dataset
    };
}

/**
 * Stellt eine Folge von Ereignissen zu. Jeder Schritt ist
 * `['input'|'change', element, wert]` — der Wert wird VOR dem Ereignis ins
 * Element geschrieben, wie beim Tippen.
 * @param {ReturnType<typeof ladeVerteiler>['EventDelegation']} ed
 * @param {Array<[string, ReturnType<typeof feld>, string]>} schritte
 */
function folge(ed, schritte) {
    for (const [typ, el, wert] of schritte) {
        el.value = wert;
        const e = { type: typ, target: el };
        if (typ === 'input') ed._handleInput(e);
        else ed._handleChange(e);
    }
}

describe('R1 — ein change mit dem schon per input zugestellten Wert wird NICHT noch einmal zugestellt', () => {
    test.each(TEXTARTIG)(
        'INPUT[type=%s]: input "gob", dann change "gob" -> nur das input',
        type => {
            const { EventDelegation, gerufen } = ladeVerteiler();
            const el = feld({ type });
            folge(EventDelegation, [
                ['input', el, 'gob'],
                ['change', el, 'gob']
            ]);
            expect(gerufen.map(g => g.typ)).toEqual(['input']);
        }
    );

    test('Tippen in drei Anschlaegen, das change traegt den letzten Wert -> nicht zugestellt', () => {
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ type: 'text' });
        folge(EventDelegation, [
            ['input', el, 'g'],
            ['input', el, 'go'],
            ['input', el, 'gob'],
            ['change', el, 'gob']
        ]);
        expect(gerufen.map(g => g.typ)).toEqual(['input', 'input', 'input']);
    });

    test('"gobx" und Backspace — dieselbe Trefferliste, das change auf "gob" wird nicht zugestellt', () => {
        // Gemessen: auch dieser Weg brauchte zwei Klicks. Verglichen wird mit
        // dem ZULETZT per input zugestellten Wert, nicht mit dem ersten.
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ type: 'search' });
        folge(EventDelegation, [
            ['input', el, 'gob'],
            ['input', el, 'gobx'],
            ['input', el, 'gob'],
            ['change', el, 'gob']
        ]);
        expect(gerufen.map(g => g.typ)).toEqual(['input', 'input', 'input']);
    });

    test('zweiter Durchgang am selben Feld: wieder nur die input-Ereignisse', () => {
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ type: 'text' });
        folge(EventDelegation, [
            ['input', el, 'gob'],
            ['change', el, 'gob'],
            ['input', el, 'gobl'],
            ['change', el, 'gobl']
        ]);
        expect(gerufen.map(g => g.typ + ':' + g.wert)).toEqual(['input:gob', 'input:gobl']);
    });
});

describe('R1 — was weiter zugestellt wird', () => {
    test('der Wert weicht vom zuletzt per input zugestellten ab -> change wird zugestellt', () => {
        // Etwa ein Wert, den Code nach dem Tippen ins Feld schreibt: dann hat
        // der Handler ihn noch NICHT gesehen.
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ type: 'text' });
        folge(EventDelegation, [
            ['input', el, 'gob'],
            ['change', el, 'goblin']
        ]);
        expect(gerufen.map(g => g.typ + ':' + g.wert)).toEqual(['input:gob', 'change:goblin']);
    });

    test('ein change ohne vorheriges input wird zugestellt', () => {
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ type: 'text' });
        folge(EventDelegation, [['change', el, 'gob']]);
        expect(gerufen.map(g => g.typ)).toEqual(['change']);
    });

    test('gemerkt wird je ELEMENT: dasselbe Wort in einem anderen Feld wird zugestellt', () => {
        const { EventDelegation, gerufen } = ladeVerteiler();
        const a = feld({ type: 'text' });
        const b = feld({ type: 'text' });
        folge(EventDelegation, [
            ['input', a, 'gob'],
            ['change', b, 'gob']
        ]);
        expect(gerufen.map(g => g.typ)).toEqual(['input', 'change']);
    });

    test('gemerkt wird je HANDLER: traegt das Feld inzwischen eine andere Aktion, wird zugestellt', () => {
        // "derselbe Handler fuer dieses Element" — ein Handler, der den Wert
        // nie bekommen hat, darf nicht leer ausgehen.
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ type: 'text' });
        folge(EventDelegation, [['input', el, 'gob']]);
        el.dataset.action = 'anders';
        folge(EventDelegation, [['change', el, 'gob']]);
        expect(gerufen.map(g => g.aktion + ':' + g.typ)).toEqual(['tun:input', 'anders:change']);
    });

    test.each([
        ['SELECT', 'select-one', 'goblin'],
        ['INPUT', 'checkbox', 'on'],
        ['INPUT', 'radio', 'on'],
        ['INPUT', 'file', 'C:\\fakepath\\notiz.md'],
        ['INPUT', 'range', '5'],
        ['INPUT', 'date', '2026-11-03'],
        ['TEXTAREA', 'textarea', 'gob']
    ])('%s[type=%s]: input und change werden BEIDE zugestellt', (tagName, type, wert) => {
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ tagName, type });
        folge(EventDelegation, [
            ['input', el, wert],
            ['change', el, wert]
        ]);
        expect(gerufen.map(g => g.typ)).toEqual(['input', 'change']);
    });

    test('Checkbox, zweimal umgeschaltet: jedes change kommt an, obwohl der Wert immer "on" ist', () => {
        const { EventDelegation, gerufen } = ladeVerteiler();
        const el = feld({ type: 'checkbox' });
        folge(EventDelegation, [
            ['input', el, 'on'],
            ['change', el, 'on'],
            ['input', el, 'on'],
            ['change', el, 'on']
        ]);
        expect(gerufen.map(g => g.typ)).toEqual(['input', 'change', 'input', 'change']);
    });

    test('Legacy data-on-change auf einem Zahlfeld (validateAssignItemQty) bleibt am change', () => {
        // Das Mengenfeld in "Items zuweisen" hat KEINE Aktion und keinen
        // input-Pfad; getippt wird trotzdem, und das change muss klemmen.
        const { EventDelegation, gerufen, validateAssignItemQty } = ladeVerteiler();
        const el = feld({ type: 'number', action: null, onChange: 'validateAssignItemQty' });
        folge(EventDelegation, [
            ['input', el, '9'],
            ['change', el, '9']
        ]);
        expect(validateAssignItemQty).toHaveBeenCalledTimes(1);
        expect(validateAssignItemQty).toHaveBeenCalledWith(el);
        expect(gerufen).toEqual([]);
    });
});
