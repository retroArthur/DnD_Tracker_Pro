/**
 * Das ✕ eines Suchfeldes hat EINE Quelle: die Aktion des Feldes (SUCHE-LEEREN)
 * ===========================================================================
 *
 * WAS HIER GEPRUEFT WIRD UND WAS NICHT. Ob das ✕ in den 15 Suchfeldern des
 * Buendels mit Maus, Tastatur und Finger richtig leert, misst
 * `tests/e2e/features/suche-leeren.spec.js` am gebauten Buendel (W1–W7).
 * Zwei Regeln des Vertrags kann ein Browser dort nicht sehen, ohne dass man
 * dem Dokument etwas unterschiebt — darum stehen sie hier:
 *
 *   R1  KEINE ZWEITE LISTE. Der Fehler war eine literal gepflegte Liste
 *       Feld -> Renderfunktion (`searchRenderMap` in ui/actions/ui-actions.js),
 *       die bei jeder fremden ID schwieg; vier ✕ kamen ins Markup, die Liste
 *       nicht — die dritte Drift derselben Liste. Ein "Fix", der die Liste um
 *       die vier Felder verlaengert, macht im Buendel alles gruen und laesst
 *       die naechste Drift offen. Hier steht darum ein Feld, das KEINE Liste
 *       kennen kann (eigene ID, eigene Renderfunktion bzw. eigene Aktion): das
 *       ✕ muss es ueber seine eigene Aktion leeren — denselben Weg wie das
 *       Tippen, ein `input` am Feld mit bubbles:true durch den Verteiler.
 *   R4  NICHTS WIRD STILL VERSCHLUCKT. Nennt das data-value eines ✕ kein
 *       textartiges INPUT mit registrierter Aktion, meldet der Zweig das ueber
 *       ErrorHandler.log — mit dem data-value in der Meldung, ohne zu werfen
 *       und ohne neuen Konsolen-Ausweg (console-hygiene pinnt in
 *       ui-actions.js genau zwei).
 *   R6  KEIN WEITERES SYNTHETISCHES EREIGNIS: genau ein `input`, kein
 *       `change`. Und R5: ein spaeteres change mit demselben leeren Wert (der
 *       Browser feuert es beim Verlassen des Feldes) zeichnet nicht ein
 *       zweites Mal — BESTIAR-KLICK R1 im Verteiler faengt es, weil das
 *       `input` den Wert '' zugestellt hat.
 *   R3  Der Fokus steht danach im Feld (der Klick fokussiert vorher das ✕,
 *       wie der mousedown im Browser).
 *   R2  Das ✕ verliert `.visible` auch bei einer Feldaktion, die es nicht
 *       selbst nachzieht — im Buendel ziehen es beide Aktionen nach, der
 *       Browser saehe das Fehlen im Helfer nicht (Nachpruefung, Mutant m9).
 *
 * Ob der Weg im Zweig 'clear-search' oder in der Hilfe `clearSearch()`
 * (utils/basic.js) steht, ist Nutzerentscheidung (2) und hier gleich: die
 * Datei laedt beide Quellen und den Verteiler und klickt das ✕ wie die App.
 *
 * LADEN: die drei Quellen (utils/basic.js, ui/event-delegation.js,
 * ui/actions/ui-actions.js) laufen als Skripte nacheinander in EINEM
 * vm-Kontext — wie die <script>-Kette der App teilen sie sich dessen globalen
 * Gueltigkeitsbereich (auch die `const` der Vorgaenger). Der Kontext traegt
 * das `document` und die DOM-Konstruktoren des jsdom-Fensters dieser Datei,
 * und `window` ist er selbst — so landen Funktionsdeklarationen und
 * `window.<name>` am selben Ort wie im Buendel. `EventDelegation.init()`
 * haengt die Lauscher an `document`; ein Klick auf das ✕ geht dann denselben
 * Weg wie im Buendel. (Ein indirektes eval reicht nicht: `const` bleibt dort
 * im eval eingeschlossen, die Quellen saehen einander nicht.)
 *
 * DER ALTE ZWEIG IN DIESEM KONTEXT: `searchRenderMap` wertet beim Bauen alle
 * elf Renderfunktionen aus, und keine davon gibt es hier — der Zweig wirft
 * also einen ReferenceError, den der Verteiler ueber ErrorHandler.log meldet.
 * Im Buendel schweigt er stattdessen. Die R4-Faelle verlangen darum eine
 * Meldung, die das data-value nennt, und KEINEN Reference- oder TypeError —
 * ein Absturz ist keine Meldung.
 *
 * WIE GEURTEILT WIRD: jede Zusage steht als benannter Schluessel in EINEM
 * Objekt, das mit dem Soll verglichen wird — ein roter Lauf zeigt im Diff
 * JEDE gebrochene Zusage mit ihrem Namen, nicht nur die erste. Vorbedingungen
 * stehen davor, einzeln und hart.
 *
 * DER ROTE LAUF und DIE GEGENPROBE: siehe Kopf von
 * tests/e2e/features/suche-leeren.spec.js.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WURZEL = path.join(__dirname, '../..');
const QUELLEN = ['utils/basic.js', 'ui/event-delegation.js', 'ui/actions/ui-actions.js'];

/** @type {jest.Mock} */
let fehlerLog;
/** Der Kontext, in dem die drei Quellen laufen — zugleich ihr `window`. */
let app;
/** `EventDelegation` aus dem Kontext (eine `const`, keine Eigenschaft). */
let verteiler;

beforeAll(() => {
    fehlerLog = jest.fn();
    /** @type {Record<string, any>} */
    const kontext = {
        document,
        console,
        setTimeout,
        clearTimeout,
        getComputedStyle: window.getComputedStyle.bind(window),
        ErrorHandler: { log: fehlerLog },
        // EventDelegation.init() meldet sich ueber das globale log().
        log: () => {}
    };
    // Die DOM-Konstruktoren des jsdom-Fensters (Event, InputEvent,
    // HTMLInputElement, …), damit `instanceof` und `new Event` dieselben sind
    // wie die der Elemente.
    for (const name of Object.getOwnPropertyNames(window)) {
        if (/^[A-Z]/.test(name) && typeof window[name] === 'function' && !(name in kontext)) {
            kontext[name] = window[name];
        }
    }
    kontext.window = kontext;
    app = vm.createContext(kontext);
    for (const quelle of QUELLEN) {
        vm.runInContext(fs.readFileSync(path.join(WURZEL, quelle), 'utf8'), app, {
            filename: quelle
        });
    }
    verteiler = vm.runInContext('EventDelegation', app);
    verteiler.init();
});

beforeEach(() => {
    document.body.innerHTML = '';
    fehlerLog.mockClear();
});

afterEach(() => {
    jest.restoreAllMocks();
});

/**
 * Ein Suchfeld mit ✕ im Behaelter, wie die Templates es bauen.
 * @param {Object} o
 * @param {string} o.id
 * @param {string} [o.aktion] data-action des Feldes ('' = keine)
 * @param {string} [o.render] data-render des Feldes
 * @param {string} [o.typ]
 * @param {string|null} [o.kreuzWert] data-value des ✕ (null = keins)
 */
function feldMitKreuz({ id, aktion = 'search-input', render = '', typ = 'text', kreuzWert = id }) {
    const behaelter = document.createElement('div');
    behaelter.className = 'search-wrapper';
    const input = document.createElement('input');
    input.type = typ;
    input.id = id;
    if (aktion) input.dataset.action = aktion;
    if (render) input.dataset.render = render;
    const kreuz = document.createElement('button');
    kreuz.className = 'search-clear-btn';
    kreuz.dataset.action = 'clear-search';
    if (kreuzWert !== null) kreuz.dataset.value = kreuzWert;
    kreuz.textContent = '✕';
    behaelter.append(input, kreuz);
    document.body.appendChild(behaelter);
    return { input, kreuz };
}

/** "Tippen" hier: Wert setzen, input feuern — wie der Browser. */
function tippen(input, text) {
    input.focus();
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Wie der Browser: mousedown fokussiert den Knopf, dann der Klick. */
function kreuzKlicken(kreuz) {
    kreuz.focus();
    kreuz.click();
}

/** Ein Fehlerobjekt — auch eines aus dem vm-Kontext (dort ist `Error` ein
 *  anderer Konstruktor, `instanceof` greift nicht). */
function istFehler(a) {
    return (
        !!a && typeof a === 'object' && typeof a.name === 'string' && typeof a.message === 'string'
    );
}

/** Text jeder Meldung an ErrorHandler.log, je Aufruf eine Zeile. */
function meldungen() {
    return fehlerLog.mock.calls.map(args =>
        args.map(a => (istFehler(a) ? a.name + ': ' + a.message : String(a))).join(' | ')
    );
}

/** Abstuerze unter den Meldungen (Reference- oder TypeError). */
function abstuerze() {
    return fehlerLog.mock.calls
        .flat()
        .filter(a => istFehler(a) && (a.name === 'ReferenceError' || a.name === 'TypeError'))
        .map(a => a.name + ': ' + a.message);
}

describe('R1: ein Feld, das keine Liste kennt, leert das ✕ ueber seine eigene Aktion', () => {
    test('search-input mit eigener Renderfunktion: leer, mit "" neu gezeichnet, ✕ ohne .visible, Fokus im Feld', () => {
        const gezeichnetMit = [];
        app.renderSucheLeerenProbe = () => {
            gezeichnetMit.push(document.getElementById('suche-leeren-probe').value);
        };
        const { input, kreuz } = feldMitKreuz({
            id: 'suche-leeren-probe',
            render: 'renderSucheLeerenProbe'
        });
        tippen(input, 'gob');
        // Vorbedingung: Tippen zeichnet ueber die Aktion des Feldes, ✕ sichtbar
        expect(gezeichnetMit).toEqual(['gob']);
        expect(kreuz.classList.contains('visible')).toBe(true);

        kreuzKlicken(kreuz);

        expect({
            'das Feld ist leer': input.value,
            'gezeichnet mit (je Zeichnen der Wert im Feld)': gezeichnetMit,
            'das ✕ traegt .visible': kreuz.classList.contains('visible'),
            'R3: der Fokus steht im Feld': document.activeElement === input,
            'Abstuerze im Zweig': abstuerze()
        }).toEqual({
            'das Feld ist leer': '',
            'gezeichnet mit (je Zeichnen der Wert im Feld)': ['gob', ''],
            'das ✕ traegt .visible': false,
            'R3: der Fokus steht im Feld': true,
            'Abstuerze im Zweig': []
        });
    });

    test('eigene registrierte Aktion statt search-input (wie das Wiki-Suchfeld): genau diese Aktion laeuft mit ""', () => {
        const zugestellt = [];
        verteiler.registerAction('suche-leeren-eigene-aktion', ctx => {
            zugestellt.push({ ziel: ctx.target.id, wert: ctx.target.value, art: ctx.event.type });
        });
        const { input, kreuz } = feldMitKreuz({
            id: 'suche-leeren-eigen',
            aktion: 'suche-leeren-eigene-aktion'
        });
        tippen(input, 'gob');
        // Vorbedingung: Tippen stellt die eigene Aktion zu
        expect(zugestellt).toHaveLength(1);

        kreuzKlicken(kreuz);

        expect({
            'das Feld ist leer': input.value,
            'was das ✕ an die Aktion des Feldes zustellt': zugestellt.slice(1),
            'R3: der Fokus steht im Feld': document.activeElement === input,
            'Abstuerze im Zweig': abstuerze()
        }).toEqual({
            'das Feld ist leer': '',
            'was das ✕ an die Aktion des Feldes zustellt': [
                { ziel: 'suche-leeren-eigen', wert: '', art: 'input' }
            ],
            'R3: der Fokus steht im Feld': true,
            'Abstuerze im Zweig': []
        });
    });
});

describe('R2: das ✕ verliert .visible auch bei einer Aktion, die es nicht nachzieht', () => {
    // Heute ziehen beide Feldaktionen ('search-input', 'wiki-search-input')
    // das ✕ selbst nach; im Buendel faellt darum nicht auf, wenn der Helfer es
    // nicht tut. Ein kuenftiges Feld mit eigener Aktion soll das aber nicht
    // muessen — der Helfer zieht es generisch ueber den Behaelter nach. Ohne
    // diesen Fall sah nur die Lint-Ratsche, wenn der Aufruf im Helfer wegfiel
    // (Nachpruefung, Mutant m9: E2E und diese Datei gruen, ESLint 358).
    test('registrierte Aktion ohne updateSearchClear: nach dem ✕ traegt das ✕ kein .visible', () => {
        const zugestellt = [];
        verteiler.registerAction('suche-leeren-ohne-kreuz', ctx => {
            zugestellt.push(ctx.target.value);
        });
        const { input, kreuz } = feldMitKreuz({
            id: 'suche-leeren-ohne-kreuz',
            aktion: 'suche-leeren-ohne-kreuz'
        });
        tippen(input, 'gob');
        // Vorbedingung: die Aktion laeuft beim Tippen und zieht das ✕ NICHT nach
        expect(zugestellt).toEqual(['gob']);
        expect(kreuz.classList.contains('visible')).toBe(false);
        // Das ✕ ist sichtbar, wie nach einer Suche, die es zeigte.
        kreuz.classList.add('visible');

        kreuzKlicken(kreuz);

        expect({
            'das Feld ist leer': input.value,
            'die Aktion des Feldes bekam': zugestellt.slice(1),
            'das ✕ traegt .visible': kreuz.classList.contains('visible'),
            'Abstuerze im Zweig': abstuerze()
        }).toEqual({
            'das Feld ist leer': '',
            'die Aktion des Feldes bekam': [''],
            'das ✕ traegt .visible': false,
            'Abstuerze im Zweig': []
        });
    });
});

describe('R6/R5: genau ein synthetisches input, kein change — und kein zweites Zeichnen danach', () => {
    test('das ✕ feuert am Feld genau ein input (bubbles) und kein change; ein nachlaufendes change zeichnet nicht', () => {
        let gezeichnet = 0;
        app.renderSucheLeerenZaehlung = () => {
            gezeichnet++;
        };
        const { input, kreuz } = feldMitKreuz({
            id: 'suche-leeren-zaehlung',
            render: 'renderSucheLeerenZaehlung'
        });
        tippen(input, 'gob');
        const amFeld = [];
        for (const art of ['input', 'change']) {
            input.addEventListener(art, e =>
                amFeld.push(art + (e.bubbles ? '' : ' (bubbles:false)'))
            );
        }
        gezeichnet = 0;

        kreuzKlicken(kreuz);
        const durchKreuz = gezeichnet;
        const ereignisseDurchKreuz = amFeld.slice();

        // R5: das change, das der Browser beim Verlassen des Feldes nachreicht,
        // traegt denselben leeren Wert — BESTIAR-KLICK R1 schluckt es, weil
        // das input den Wert '' zugestellt hat.
        input.dispatchEvent(new Event('change', { bubbles: true }));

        expect({
            'R1/R6: Ereignisse am Feld durch das ✕': ereignisseDurchKreuz,
            'so oft zeichnet das ✕ die Ansicht': durchKreuz,
            'R5: so oft zeichnet ein nachlaufendes change erneut': gezeichnet - durchKreuz,
            'Abstuerze im Zweig': abstuerze()
        }).toEqual({
            'R1/R6: Ereignisse am Feld durch das ✕': ['input'],
            'so oft zeichnet das ✕ die Ansicht': 1,
            'R5: so oft zeichnet ein nachlaufendes change erneut': 0,
            'Abstuerze im Zweig': []
        });
    });
});

describe('R4: ein ✕, das sich nicht aufloesen laesst, wird gemeldet, nicht verschluckt', () => {
    /**
     * Baut das jeweilige Ziel und liefert das data-value des ✕.
     * @type {Array<[string, () => string]>}
     */
    const faelle = [
        ['data-value nennt keine vorhandene ID', () => 'suche-leeren-gibt-es-nicht'],
        [
            'data-value nennt ein DIV',
            () => {
                const d = document.createElement('div');
                d.id = 'suche-leeren-div';
                document.body.appendChild(d);
                return 'suche-leeren-div';
            }
        ],
        [
            'data-value nennt ein Kontrollkaestchen',
            () => {
                feldMitKreuz({ id: 'suche-leeren-haken', typ: 'checkbox', render: 'renderNix' });
                return 'suche-leeren-haken';
            }
        ],
        [
            'data-value nennt ein Textfeld ohne data-action',
            () => {
                feldMitKreuz({ id: 'suche-leeren-ohne-aktion', aktion: '' });
                return 'suche-leeren-ohne-aktion';
            }
        ],
        [
            'data-value nennt ein Textfeld mit nicht registrierter Aktion',
            () => {
                feldMitKreuz({ id: 'suche-leeren-fremd', aktion: 'suche-leeren-gibt-es-nicht' });
                return 'suche-leeren-fremd';
            }
        ]
    ];

    test.each(faelle)('%s: ErrorHandler.log nennt das data-value, kein Absturz', (_name, bauen) => {
        const wert = bauen();
        const konsole = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { kreuz } = feldMitKreuz({
            id: 'suche-leeren-traeger',
            render: 'renderNix',
            kreuzWert: wert
        });
        fehlerLog.mockClear();

        expect(() => kreuzKlicken(kreuz)).not.toThrow();

        const m = meldungen();
        expect({
            'Meldungen an ErrorHandler.log, die das data-value nennen': m.some(z =>
                z.includes(wert)
            )
                ? 'mindestens eine'
                : m,
            'Abstuerze im Zweig': abstuerze(),
            'Aufrufe von console.error am ErrorHandler vorbei': konsole.mock.calls.length
        }).toEqual({
            'Meldungen an ErrorHandler.log, die das data-value nennen': 'mindestens eine',
            'Abstuerze im Zweig': [],
            'Aufrufe von console.error am ErrorHandler vorbei': 0
        });
    });

    test('ein ✕ ohne data-value: gemeldet, kein Absturz', () => {
        const konsole = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { kreuz } = feldMitKreuz({ id: 'suche-leeren-ohne-wert', kreuzWert: null });
        fehlerLog.mockClear();

        expect(() => kreuzKlicken(kreuz)).not.toThrow();

        expect({
            'ErrorHandler.log meldet das ✕ ohne Ziel': meldungen().length > 0,
            'Abstuerze im Zweig': abstuerze(),
            'Aufrufe von console.error am ErrorHandler vorbei': konsole.mock.calls.length
        }).toEqual({
            'ErrorHandler.log meldet das ✕ ohne Ziel': true,
            'Abstuerze im Zweig': [],
            'Aufrufe von console.error am ErrorHandler vorbei': 0
        });
    });
});
