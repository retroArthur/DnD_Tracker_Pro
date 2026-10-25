/**
 * Der keydown-Zweig des Verteilers — Ausnahmematrix (TAST, Schritt 3)
 * ===================================================================
 *
 * WAS HIER GEPRUEFT WIRD UND WAS NICHT. Ob die Leertaste auf einem
 * ertabulierten Knopf am Ende die richtige Handlung ausloest, kann nur ein
 * Browser beantworten — dafuer gibt es
 * `tests/e2e/features/tastatur-verteiler.spec.js` (24 Faelle, zwei
 * Kampagnengroessen, echte Tastendruecke). Dieser Fall hier urteilt ueber
 * die ENTSCHEIDUNGSTABELLE davor: welche Taste auf welcher Quelle ueberhaupt
 * abgefangen wird. Das sind viele kleine Faelle, von denen mehrere im
 * Browser gar nicht erreichbar sind — `a[href][data-action]` ist im
 * gebauten Dokument unsichtbar, `input[type=button|submit|reset]` kommt
 * nicht vor, und eine GEHALTENE Taste (`e.repeat`) laesst sich mit
 * Playwright nicht verlaesslich erzeugen. Genau die stehen hier.
 *
 * WARUM DIE MATRIX TRAGEND IST. Am gebauten Buendel gezaehlt sitzen im
 * Dokument Tippflaechen MIT eigener Aktion oder IN einem Element mit
 * Aktion: der Wiki-Editor als `div[contenteditable][data-action]`, ein
 * `textarea` INNERHALB von `div[data-action="backdrop-close"]`, 38
 * `input[type=checkbox]` in `label[data-action="toggle-selected"]`, 15
 * Suchfelder und ~45 Auswahllisten mit eigener Aktion. Ein Zweig, der die
 * Leertaste dort abfaengt, macht den Wiki-Editor unbenutzbar und schliesst
 * die Schnellnotizen beim Tippen. Die Schranke muss darum an der QUELLE des
 * Ereignisses haengen, nicht am aufgeloesten Ziel — sonst greift sie beim
 * Textfeld in einer Schale mit Aktion nicht. Die Faelle unten pruefen beide
 * Lagen getrennt.
 *
 * DER KLICK GEHT AUF DIE QUELLE, NICHT AUF DAS AUFGELOESTE ZIEL. Das ist
 * keine Geschmacksfrage: `backdrop-close` (ui/actions/ui-actions.js) prueft
 * `ctx.event.target === ctx.target` und schliesst nur, wenn der Klick die
 * Schale selbst getroffen hat. Ein Klick auf das aufgeloeste Ziel wuerde
 * diese Pruefung immer erfuellen — ein Tastendruck auf irgendetwas
 * INNERHALB der Schale wuerde den Dialog schliessen. Der letzte Fall unten
 * ist der Waechter dafuer.
 *
 * Lade-Muster identisch zu
 * `tests/unit/event-delegation-console-fallback.test.js` (vm-Sandbox um
 * ui/event-delegation.js).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../ui/event-delegation.js');

/**
 * Laedt ui/event-delegation.js in eine frische Sandbox und registriert eine
 * Aktion `tun`.
 */
function ladeVerteiler() {
    const context = {
        window: {},
        console,
        ErrorHandler: { log: jest.fn() },
        parseEntityId: id => (id != null ? parseInt(id, 10) : null)
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
    // `const EventDelegation = {...}` landet als globale Lexical-Binding im
    // vm-Kontext, nicht als Property des context-Objekts (Node-vm-Eigenheit).
    const EventDelegation = vm.runInContext('EventDelegation', context);
    const gerufen = [];
    EventDelegation.registerAction('tun', ctx => gerufen.push(ctx));
    return { EventDelegation, gerufen };
}

/**
 * Baut eine Quelle (das fokussierte Element) samt Klickzaehler.
 * @param {Object} [opts]
 * @param {string} [opts.tagName]
 * @param {string} [opts.type] INPUT-Art
 * @param {boolean} [opts.isContentEditable]
 * @param {Object|null} [opts.ziel] Was `closest('[data-action]')` liefert; `undefined` = die Quelle selbst
 * @param {string} [opts.action] data-action auf der Quelle, wenn sie selbst das Ziel ist
 * @param {string[]} [opts.attribute] vorhandene Attribute fuer hasAttribute()
 */
function quelle(opts = {}) {
    const el = {
        tagName: opts.tagName || 'DIV',
        type: opts.type,
        isContentEditable: !!opts.isContentEditable,
        dataset: { action: opts.action === undefined ? 'tun' : opts.action },
        klicks: 0,
        hasAttribute: name => (opts.attribute || []).includes(name),
        click() {
            el.klicks++;
        }
    };
    el.closest = sel => {
        if (sel !== '[data-action]') return null;
        if (opts.ziel !== undefined) return opts.ziel;
        return el.dataset.action ? el : null;
    };
    return el;
}

/**
 * Baut ein keydown-Ereignis mit Zaehlern fuer preventDefault und
 * stopPropagation.
 */
function ereignis(key, ziel, extra = {}) {
    return {
        key,
        target: ziel,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        repeat: false,
        verhindert: 0,
        gestoppt: 0,
        preventDefault() {
            this.verhindert++;
        },
        stopPropagation() {
            this.gestoppt++;
        },
        ...extra
    };
}

/**
 * Fuehrt den Zweig aus und gibt die Messwerte zurueck.
 */
function druecke(key, el, extra) {
    const { EventDelegation } = ladeVerteiler();
    const e = ereignis(key, el, extra);
    EventDelegation._handleKeydown(e);
    return { verhindert: e.verhindert, gestoppt: e.gestoppt, klicks: el.klicks };
}

describe('EventDelegation._handleKeydown — welche Taste abgefangen wird', () => {
    test.each([
        ['Enter', 1],
        [' ', 1],
        ['a', 0],
        ['Escape', 0],
        ['Tab', 0],
        ['ArrowRight', 0],
        ['F5', 0],
        ['1', 0]
    ])('Taste "%s" loest %i mal aus', (key, erwartet) => {
        const el = quelle();
        const m = druecke(key, el);
        expect(m.klicks).toBe(erwartet);
        expect(m.verhindert).toBe(erwartet);
        expect(m.gestoppt).toBe(erwartet);
    });

    test.each([['ctrlKey'], ['metaKey'], ['altKey'], ['shiftKey']])(
        'mit %s bleibt die Taste beim Browser',
        flagge => {
            for (const key of ['Enter', ' ']) {
                const el = quelle();
                const m = druecke(key, el, { [flagge]: true });
                expect(m.klicks).toBe(0);
                expect(m.verhindert).toBe(0);
                expect(m.gestoppt).toBe(0);
            }
        }
    );

    test('eine GEHALTENE Taste unterdrueckt weiter die Vorgabe, loest aber nicht erneut aus', () => {
        // Ohne diese Trennung wuerde ein gehaltenes Enter in Dauerfeuer
        // ausarten; ohne das preventDefault im repeat-Fall wuerde die
        // gehaltene Leertaste ab dem zweiten Anschlag die Seite wegrollen.
        for (const key of ['Enter', ' ']) {
            const el = quelle();
            const m = druecke(key, el, { repeat: true });
            expect(m.klicks).toBe(0);
            expect(m.verhindert).toBe(1);
            expect(m.gestoppt).toBe(1);
        }
    });
});

describe('EventDelegation._handleKeydown — Tippflaechen behalten ihre Taste', () => {
    test.each([
        ['TEXTAREA', undefined],
        ['SELECT', undefined],
        ['INPUT', 'text'],
        ['INPUT', 'search'],
        ['INPUT', 'number'],
        ['INPUT', 'checkbox'],
        ['INPUT', 'radio'],
        ['INPUT', 'range'],
        ['INPUT', 'file'],
        ['INPUT', 'date'],
        ['INPUT', 'email'],
        ['INPUT', 'password'],
        ['INPUT', 'color'],
        ['INPUT', undefined]
    ])('%s[type=%s] mit eigener Aktion wird nicht abgefangen', (tagName, type) => {
        for (const key of ['Enter', ' ']) {
            const el = quelle({ tagName, type });
            const m = druecke(key, el);
            expect(m.klicks).toBe(0);
            expect(m.verhindert).toBe(0);
            expect(m.gestoppt).toBe(0);
        }
    });

    test.each([['button'], ['submit'], ['reset']])(
        'INPUT[type=%s] ist ein Knopf in Feldgestalt und WIRD abgefangen',
        type => {
            for (const key of ['Enter', ' ']) {
                const el = quelle({ tagName: 'INPUT', type });
                const m = druecke(key, el);
                expect(m.klicks).toBe(1);
                expect(m.verhindert).toBe(1);
            }
        }
    );

    test('contentEditable behaelt die Taste, auch mit eigener Aktion (der Wiki-Editor)', () => {
        for (const key of ['Enter', ' ']) {
            const el = quelle({ isContentEditable: true });
            const m = druecke(key, el);
            expect(m.klicks).toBe(0);
            expect(m.verhindert).toBe(0);
        }
    });

    test('ein Textfeld IN einer Schale mit Aktion behaelt die Taste (die Schnellnotizen)', () => {
        // Die Schranke haengt an der QUELLE. Haenge sie am aufgeloesten
        // Ziel, waere dieser Fall rot: das `textarea` traegt selbst keine
        // Aktion, der `div[data-action="backdrop-close"]` darueber schon.
        const schale = { tagName: 'DIV', dataset: { action: 'tun' }, klicks: 0, click() {} };
        for (const key of ['Enter', ' ']) {
            const el = quelle({ tagName: 'TEXTAREA', action: null, ziel: schale });
            const m = druecke(key, el);
            expect(m.klicks).toBe(0);
            expect(m.verhindert).toBe(0);
        }
    });

    test('Enter auf einem Verweis bleibt dessen eigene Handlung, die Leertaste nicht', () => {
        // Aus Enter macht der Browser auf `a[href]` selbst ein `click`, das
        // der Klick-Zweig ohnehin bekommt. Die Leertaste rollt dort nur die
        // Seite — die darf der Zweig uebernehmen.
        const mitHref = () => quelle({ tagName: 'A', attribute: ['href'] });
        expect(druecke('Enter', mitHref())).toEqual({ verhindert: 0, gestoppt: 0, klicks: 0 });
        expect(druecke(' ', mitHref())).toEqual({ verhindert: 1, gestoppt: 1, klicks: 1 });
        // Ein Anker OHNE href ist kein Verweis.
        expect(druecke('Enter', quelle({ tagName: 'A' }))).toEqual({
            verhindert: 1,
            gestoppt: 1,
            klicks: 1
        });
    });
});

describe('EventDelegation._handleKeydown — nur bei einer registrierten Aktion', () => {
    test('ohne [data-action]-Vorfahr passiert nichts (z.B. ein <summary>)', () => {
        for (const key of ['Enter', ' ']) {
            const el = quelle({ tagName: 'SUMMARY', action: null, ziel: null });
            const m = druecke(key, el);
            expect(m.klicks).toBe(0);
            expect(m.verhindert).toBe(0);
            expect(m.gestoppt).toBe(0);
        }
    });

    test('eine UNBEKANNTE Aktion wird nicht geschluckt', () => {
        // Sonst wuerde die Taste an Elementen mit unregistrierter Aktion
        // verschwinden, ohne dass etwas passiert — dieselbe Schranke wie im
        // Klick-Zweig, der auch erst bei einem Treffer preventDefault ruft.
        for (const key of ['Enter', ' ']) {
            const el = quelle({ action: 'gibtesnicht' });
            const m = druecke(key, el);
            expect(m.klicks).toBe(0);
            expect(m.verhindert).toBe(0);
            expect(m.gestoppt).toBe(0);
        }
    });

    test('eine Quelle ohne closest/click wirft nicht (document, SVG-Knoten)', () => {
        const { EventDelegation } = ladeVerteiler();
        for (const roh of [null, {}, { closest: () => null }, { click: () => {} }]) {
            const e = ereignis('Enter', roh);
            expect(() => EventDelegation._handleKeydown(e)).not.toThrow();
            expect(e.verhindert).toBe(0);
        }
    });
});

describe('EventDelegation._handleKeydown — der Klick geht auf die Quelle', () => {
    test('bei einem Vorfahren als Ziel wird die QUELLE geklickt, nicht der Vorfahr', () => {
        const vorfahr = { tagName: 'DIV', dataset: { action: 'tun' }, klicks: 0 };
        vorfahr.click = () => vorfahr.klicks++;
        const el = quelle({ tagName: 'SPAN', action: null, ziel: vorfahr });

        const { EventDelegation } = ladeVerteiler();
        EventDelegation._handleKeydown(ereignis('Enter', el));

        // Die Quelle wird geklickt, der Vorfahr NICHT — sonst erfuellt
        // `backdrop-close` seine `event.target === target`-Pruefung und
        // schliesst den Dialog bei jedem Tastendruck darin.
        expect(el.klicks).toBe(1);
        expect(vorfahr.klicks).toBe(0);
    });

    test('ist die Quelle selbst das Ziel, wird genau sie einmal geklickt', () => {
        const el = quelle();
        const { EventDelegation } = ladeVerteiler();
        EventDelegation._handleKeydown(ereignis(' ', el));
        expect(el.klicks).toBe(1);
    });
});
