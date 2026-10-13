/**
 * ui/modal-focus.js — Einstieg, Fokusfalle, Rueckkehr zum Oeffner (T-D)
 * ============================================================================
 *
 * WAS HIER GEPRUEFT WIRD und was NICHT. Die Verhaltenszusicherungen am
 * echten Buendel — Fokus landet innen, 45 Spruenge bleiben innen, Rueckkehr
 * zum Oeffner, keine Doppelausloesung — stehen in
 * `tests/e2e/features/modal-fokus.spec.js` und werden dort mit ECHTEN
 * Tastendruecken gemessen. Diese Datei prueft die Entscheidungslogik des
 * Moduls isoliert: welche Schale als die oberste gilt, was als Haltepunkt
 * zaehlt, was die Beschriftung schreibt, und wie der Oeffner verwaltet wird.
 *
 * DER WICHTIGSTE FALL IST DER ERSTE. `oberstesModal()` darf NICHT die letzte
 * Schale in Dokumentreihenfolge nehmen. Genau das tat die erste Fassung, und
 * fuer die 35 Schalen aus den Vorlagen ist es falsch: ihre Reihenfolge steht
 * in `assets/templates/`, nicht in der Reihenfolge, in der sie geoeffnet
 * werden. Am Buendel gemessen: #about-modal auf, dann #theme-modal auf,
 * Escape — und geschlossen wurde #about-modal, weil es in der Vorlage
 * dahinter steht. Der Spielleiter schliesst den Dialog, den er sieht, und es
 * verschwindet der darunter.
 *
 * `getBoundingClientRect()` WIRD ERSETZT, und das ist hier Pflicht. jsdom
 * rechnet kein Layout und meldet fuer jedes Element 0x0 — der
 * Sichtbarkeitstest des Moduls haelt dann ALLES fuer unsichtbar und
 * `haltepunkte()` kaeme immer leer zurueck. Der Ersatz gibt eine Flaeche
 * zurueck, ausser bei Elementen mit der Marke `data-leer`; `display` und
 * `visibility` kommen weiter aus dem echten `getComputedStyle` von jsdom,
 * das Inline-Stile korrekt aufloest. Geprueft wird also die Logik des
 * Moduls, nicht eine Attrappe davon.
 */

const fs = require('fs');
const path = require('path');

const MODULE_PATH = 'ui/modal-focus.js';
const SOURCE = fs.readFileSync(path.join(__dirname, '..', '..', MODULE_PATH), 'utf8');

/** @type {any} */
let ModalFocus;
let rectErsatz;

beforeAll(() => {
    // Flaeche vortaeuschen, solange das Element nicht als leer markiert ist.
    rectErsatz = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
        /** @this {Element} */
        function () {
            const leer = this.hasAttribute && this.hasAttribute('data-leer');
            const w = leer ? 0 : 100;
            const h = leer ? 0 : 20;
            return {
                width: w,
                height: h,
                top: 0,
                left: 0,
                right: w,
                bottom: h,
                x: 0,
                y: 0,
                toJSON() {}
            };
        }
    );

    // Das Modul EINMAL laden, gegen das echte jsdom-Dokument. Die
    // Umschlag-Funktion ersetzt den `<script>`-Rahmen des Buendels: die
    // Modulkonstanten bleiben `const`, und die Selbstaufruf-Zeile am
    // Dateiende laeuft mit. Dasselbe Muster wie
    // `tests/unit/keyboard-reach.test.js` — ein zweiter Lauf im selben
    // Bereich waere ein SyntaxError, darum genau einmal.
    const fensterAttrappe = global.window;
    const umschlag = new Function('window', 'document', 'getComputedStyle', SOURCE);
    umschlag(fensterAttrappe, global.document, global.getComputedStyle);
    ModalFocus = fensterAttrappe.ModalFocus;
    if (!ModalFocus) throw new Error(`${MODULE_PATH} hat window.ModalFocus nicht gesetzt`);
});

afterAll(() => {
    if (rectErsatz) rectErsatz.mockRestore();
});

afterEach(() => {
    document.body.innerHTML = '';
});

/**
 * Baut eine Dialogschale.
 * @param {string} id
 * @param {string} inhalt Markup fuer den Inhalt
 * @param {boolean} offen `show`-Klasse setzen
 */
function schale(id, inhalt, offen = true) {
    const d = document.createElement('div');
    d.className = 'modal-overlay' + (offen ? ' show' : '');
    d.id = id;
    d.innerHTML = inhalt;
    document.body.appendChild(d);
    return d;
}

describe('ModalFocus.oberstesModal — die zuletzt geoeffnete Schale gewinnt', () => {
    test('nicht die letzte in Dokumentreihenfolge, sondern die zuletzt geoeffnete', () => {
        const a = schale('a-modal', '<button>A</button>');
        const b = schale('b-modal', '<button>B</button>');
        // b steht HINTER a im Dokument — wie #about-modal hinter #theme-modal
        // in der Vorlage. Geoeffnet wird aber erst b, dann a.
        ModalFocus.einstieg(b);
        ModalFocus.einstieg(a);
        expect(ModalFocus.oberstesModal()).toBe(a);

        // Und in der anderen Reihenfolge ebenso: zuletzt geoeffnet gewinnt.
        ModalFocus.einstieg(b);
        expect(ModalFocus.oberstesModal()).toBe(b);
    });

    test('unter zwei unverfolgten Schalen gewinnt die spaetere im Dokument', () => {
        const a = schale('a-modal', '<button>A</button>');
        const b = schale('b-modal', '<button>B</button>');
        // Keine von beiden lief durch einstieg() — beide haben keine
        // Oeffnungsnummer. Dann bleibt es beim alten Verhalten.
        expect(ModalFocus.oberstesModal()).toBe(b);
        expect(a).toBeTruthy();
    });

    test('eine geschlossene Schale zaehlt nicht, auch wenn sie zuletzt offen war', () => {
        const a = schale('a-modal', '<button>A</button>');
        const b = schale('b-modal', '<button>B</button>');
        ModalFocus.einstieg(b);
        ModalFocus.einstieg(a);
        a.classList.remove('show');
        expect(ModalFocus.oberstesModal()).toBe(b);
    });

    test('ohne offene Schale ist es null', () => {
        schale('zu-modal', '<button>X</button>', false);
        expect(ModalFocus.oberstesModal()).toBeNull();
    });

    test('#quicknotes-modal zaehlt mit — es traegt .modal-backdrop, nicht .modal-overlay', () => {
        // Das Selektorloch, an dem die Schale als EINZIGE von 36 auf Escape
        // offen blieb. Sie muss ueber ihre id erfasst werden.
        const q = document.createElement('div');
        q.className = 'modal-backdrop show';
        q.id = 'quicknotes-modal';
        q.innerHTML = '<button>Q</button>';
        document.body.appendChild(q);
        expect(ModalFocus.oberstesModal()).toBe(q);

        // Ohne `show` darf sie NICHT als offen gelten: der Knoten liegt
        // dauerhaft im Dokument.
        q.classList.remove('show');
        expect(ModalFocus.oberstesModal()).toBeNull();
    });
});

describe('ModalFocus.haltepunkte — was als Halt zaehlt', () => {
    test('nimmt Knoepfe, Felder, Auswahlen, Verweise mit href und tabindex 0', () => {
        const m = schale(
            'h-modal',
            '<button>1</button>' +
                '<input type="text">' +
                '<select><option>x</option></select>' +
                '<textarea></textarea>' +
                '<a href="#x">v</a>' +
                '<div tabindex="0">d</div>' +
                '<div contenteditable="true">c</div>'
        );
        expect(ModalFocus.haltepunkte(m)).toHaveLength(7);
    });

    test('laesst abgeschaltete Bedienelemente und tabindex -1 draussen', () => {
        const m = schale(
            'h2-modal',
            '<button disabled>1</button>' +
                '<input type="text" disabled>' +
                '<div tabindex="-1">d</div>' +
                '<a>ohne href</a>' +
                '<button>echt</button>'
        );
        const h = ModalFocus.haltepunkte(m);
        expect(h).toHaveLength(1);
        expect(h[0].textContent).toBe('echt');
    });

    test('laesst weggeschaltete und flaechenlose Elemente draussen', () => {
        const m = schale(
            'h3-modal',
            '<button style="display:none">weg</button>' +
                '<button style="visibility:hidden">unsichtbar</button>' +
                '<button data-leer>ohne Flaeche</button>' +
                '<button>sichtbar</button>'
        );
        const h = ModalFocus.haltepunkte(m);
        expect(h).toHaveLength(1);
        expect(h[0].textContent).toBe('sichtbar');
    });

    test('meldet Dokumentreihenfolge', () => {
        const m = schale('h4-modal', '<button>a</button><button>b</button><button>c</button>');
        expect(ModalFocus.haltepunkte(m).map(e => e.textContent)).toEqual(['a', 'b', 'c']);
    });
});

describe('ModalFocus.beschrifte — role, aria-modal und der Name (O-8)', () => {
    test('setzt role und aria-modal und zeigt aria-labelledby auf den Titel', () => {
        const m = schale(
            'b1-modal',
            '<div class="modal-header"><span class="modal-title">Beute</span></div>'
        );
        ModalFocus.beschrifte(m);
        expect(m.getAttribute('role')).toBe('dialog');
        expect(m.getAttribute('aria-modal')).toBe('true');
        const ziel = m.getAttribute('aria-labelledby');
        expect(ziel).toBe('b1-modal-titel');
        expect(document.getElementById(ziel).textContent).toBe('Beute');
    });

    test('nimmt eine vorhandene id des Titels, statt sie zu ueberschreiben', () => {
        const m = schale(
            'b2-modal',
            '<div class="modal-header"><h3 id="eigene-id">Zauber</h3></div>'
        );
        ModalFocus.beschrifte(m);
        expect(m.getAttribute('aria-labelledby')).toBe('eigene-id');
    });

    test('ohne Ueberschrift bekommt die Schale einen generischen Namen', () => {
        const m = schale('b3-modal', '<button>nur ein Knopf</button>');
        ModalFocus.beschrifte(m);
        expect(m.getAttribute('aria-labelledby')).toBeNull();
        expect(m.getAttribute('aria-label')).toBe('Dialog');
    });

    test('eine schon vorhandene Beschriftung bleibt unberuehrt', () => {
        const m = schale(
            'b4-modal',
            '<div class="modal-header"><span class="modal-title">Titel</span></div>'
        );
        m.setAttribute('aria-label', 'Von Hand benannt');
        ModalFocus.beschrifte(m);
        expect(m.getAttribute('aria-label')).toBe('Von Hand benannt');
        expect(m.getAttribute('aria-labelledby')).toBeNull();
    });

    test('ist mehrfach aufrufbar, ohne etwas zu veraendern', () => {
        const m = schale(
            'b5-modal',
            '<div class="modal-header"><span class="modal-title">T</span></div>'
        );
        ModalFocus.beschrifte(m);
        const vorher = m.outerHTML;
        ModalFocus.beschrifte(m);
        ModalFocus.beschrifte(m);
        expect(m.outerHTML).toBe(vorher);
    });
});

describe('ModalFocus — Oeffner merken und zurueckgeben', () => {
    test('der gemerkte Oeffner bekommt den Fokus zurueck', () => {
        const oeffner = document.createElement('button');
        document.body.appendChild(oeffner);
        oeffner.focus();
        expect(document.activeElement).toBe(oeffner);

        const m = schale('o1-modal', '<button>im Dialog</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        expect(m.contains(document.activeElement)).toBe(true);

        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(oeffner);
    });

    test('ein zweites kehreZurueck gibt den Fokus NICHT noch einmal weg', () => {
        // Der Eintrag wird beim ersten Mal verbraucht. Sonst koennte ein
        // doppelter Schliessweg den Fokus an einen alten Oeffner schicken.
        const oeffner = document.createElement('button');
        const anderer = document.createElement('button');
        document.body.appendChild(oeffner);
        document.body.appendChild(anderer);
        oeffner.focus();

        const m = schale('o2-modal', '<button>x</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(oeffner);

        anderer.focus();
        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(anderer);
    });

    test('ohne Oeffner bleibt der Fokus, wo er ist', () => {
        const irgendwo = document.createElement('button');
        document.body.appendChild(irgendwo);
        const m = schale('o3-modal', '<button>x</button>');
        // merkeOeffner bei Fokus auf <body> darf nichts merken.
        document.body.focus();
        ModalFocus.merkeOeffner(m);
        irgendwo.focus();
        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(irgendwo);
    });

    test('ein entfernter Oeffner wird nicht angesprungen', () => {
        const oeffner = document.createElement('button');
        document.body.appendChild(oeffner);
        oeffner.focus();
        const m = schale('o4-modal', '<button>x</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        oeffner.remove();
        // Darf nicht werfen und darf nichts anspringen.
        expect(() => ModalFocus.kehreZurueck(m)).not.toThrow();
    });

    test('einstieg laesst einen Fokus, der schon im Dialog liegt, unberuehrt', () => {
        // Tragend: mehrere Oeffner setzen den Fokus selbst — showHpCalculator
        // landet im ersten FELD, und der Schliessknopf steht davor. Ohne
        // diese Bedingung wuerde der Einstieg die bessere Fuehrung zerstoeren.
        const m = schale('o5-modal', '<button>schliessen</button><input id="feld">');
        const feld = m.querySelector('#feld');
        feld.focus();
        ModalFocus.einstieg(m);
        expect(document.activeElement).toBe(feld);
    });
});

describe('ModalFocus — die Fokusfalle laeuft im Kreis', () => {
    /** Einen echten Tab-Anschlag auf das aktive Element schicken. */
    function tab(shift = false) {
        const ev = new window.KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: shift,
            bubbles: true,
            cancelable: true
        });
        document.activeElement.dispatchEvent(ev);
        return ev;
    }

    test('vom letzten Halt geht es auf den ersten, nicht nach draussen', () => {
        const draussen = document.createElement('button');
        document.body.appendChild(draussen);
        const m = schale('f1-modal', '<button>eins</button><button>zwei</button>');
        ModalFocus.einstieg(m);
        const h = ModalFocus.haltepunkte(m);
        h[h.length - 1].focus();

        const ev = tab();
        expect(ev.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(h[0]);
    });

    test('mit Shift geht es vom ersten Halt auf den letzten', () => {
        const m = schale('f2-modal', '<button>eins</button><button>zwei</button>');
        ModalFocus.einstieg(m);
        const h = ModalFocus.haltepunkte(m);
        h[0].focus();

        tab(true);
        expect(document.activeElement).toBe(h[h.length - 1]);
    });

    test('in der Mitte geht es um GENAU einen Halt weiter', () => {
        const m = schale('f3-modal', '<button>1</button><button>2</button><button>3</button>');
        ModalFocus.einstieg(m);
        const h = ModalFocus.haltepunkte(m);
        h[0].focus();
        tab();
        expect(document.activeElement).toBe(h[1]);
        tab();
        expect(document.activeElement).toBe(h[2]);
    });

    test('liegt der Fokus draussen, holt der Tabulator ihn herein', () => {
        const draussen = document.createElement('button');
        document.body.appendChild(draussen);
        const m = schale('f4-modal', '<button>eins</button><button>zwei</button>');
        ModalFocus.einstieg(m);
        draussen.focus();

        tab();
        expect(m.contains(document.activeElement)).toBe(true);
        expect(document.activeElement).toBe(ModalFocus.haltepunkte(m)[0]);
    });

    test('OHNE offene Schale greift die Falle nicht', () => {
        // Die Gegenprobe: sonst waere der Tabulator der ganzen App gekapert.
        const a = document.createElement('button');
        document.body.appendChild(a);
        a.focus();
        const ev = tab();
        expect(ev.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(a);
    });

    test('eine Schale ohne Haltepunkt schluckt die Taste, statt nach draussen zu lassen', () => {
        const draussen = document.createElement('button');
        document.body.appendChild(draussen);
        const m = schale('f5-modal', '<span>nur Text</span>');
        ModalFocus.einstieg(m);
        draussen.focus();
        const ev = tab();
        expect(ev.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(draussen);
    });

    test('eine Zusatztaste bleibt beim Browser', () => {
        const m = schale('f6-modal', '<button>eins</button><button>zwei</button>');
        ModalFocus.einstieg(m);
        const h = ModalFocus.haltepunkte(m);
        h[0].focus();
        const ev = new window.KeyboardEvent('keydown', {
            key: 'Tab',
            ctrlKey: true,
            bubbles: true,
            cancelable: true
        });
        document.activeElement.dispatchEvent(ev);
        expect(ev.defaultPrevented).toBe(false);
        expect(document.activeElement).toBe(h[0]);
    });
});

describe('ModalFocus.statistik — Diagnose', () => {
    test('meldet die offene Schale und ihre Haltepunktzahl', () => {
        const m = schale('s1-modal', '<button>a</button><button>b</button>');
        ModalFocus.einstieg(m);
        const s = ModalFocus.statistik();
        expect(s.aktiv).toBe(true);
        expect(s.offen).toBe('s1-modal');
        expect(s.haltepunkte).toBe(2);
    });

    test('ohne Schale meldet sie null', () => {
        expect(ModalFocus.statistik().offen).toBeNull();
    });
});

describe('ModalFocus — der gleichwertige Oeffner, wenn der echte neu gezeichnet wurde', () => {
    /**
     * Einen Oeffnerknopf mit Kennung bauen.
     * @param {Record<string,string>} daten
     */
    function knopf(daten) {
        const b = document.createElement('button');
        Object.entries(daten).forEach(([k, v]) => b.setAttribute('data-' + k, v));
        document.body.appendChild(b);
        return b;
    }

    test('der ersetzte Oeffner bekommt den Fokus, nicht <body>', () => {
        // DER BEFUND VON RUNDE 1 in seiner kleinsten Form. Am Buendel
        // gemessen: `applyHpChange()` ruft `renderInit()`, der Knopf, von dem
        // aus geoeffnet wurde, ist danach ein ANDERER Knoten — und der Fokus
        // landete auf <body>, 47 echte Tabulatorspruenge vom Ziel entfernt.
        const alt = knopf({ action: 'show-hp-calculator', id: '1', type: 'combatant' });
        alt.focus();
        const m = schale('g1-modal', '<button>im Dialog</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);

        // Die Liste wird neu gezeichnet: alter Knoten weg, gleichwertiger da.
        alt.remove();
        const neu = knopf({ action: 'show-hp-calculator', id: '1', type: 'combatant' });

        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(neu);
    });

    test('ein Knopf mit anderer id ist NICHT gleichwertig', () => {
        // Sonst landete der Fokus am falschen Kaempfer — schlimmer als
        // <body>, weil die naechste Leertaste dort etwas tut.
        const alt = knopf({ action: 'show-hp-calculator', id: '1', type: 'combatant' });
        alt.focus();
        const m = schale('g2-modal', '<button>x</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        alt.remove();
        knopf({ action: 'show-hp-calculator', id: '2', type: 'combatant' });

        const vorher = document.activeElement;
        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(vorher);
    });

    test('auch data-type und data-value muessen stimmen', () => {
        // `data-value` traegt bei `show-modal` die Schalen-ID. Ohne diesen
        // Vergleich gaebe der Rueckweg den Fokus an den Knopf eines FREMDEN
        // Dialogs mit derselben Aktion.
        const alt = knopf({ action: 'show-modal', value: 'about-modal' });
        alt.focus();
        const m = schale('g3-modal', '<button>x</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        alt.remove();
        knopf({ action: 'show-modal', value: 'theme-modal' });
        const richtig = knopf({ action: 'show-modal', value: 'about-modal' });

        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(richtig);
    });

    test('ein unsichtbarer Treffer wird uebersprungen', () => {
        const alt = knopf({ action: 'neu-npc', id: '7' });
        alt.focus();
        const m = schale('g4-modal', '<button>x</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        alt.remove();
        const leer = knopf({ action: 'neu-npc', id: '7' });
        leer.setAttribute('data-leer', ''); // 0x0 im Rect-Ersatz
        const sichtbar = knopf({ action: 'neu-npc', id: '7' });

        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(sichtbar);
    });

    test('ein Oeffner OHNE data-action bekommt keinen Rueckfall', () => {
        // Das alte Verhalten bleibt: der Fokus bleibt, wo er ist. Ein
        // Kopfzeilen-Element ohne Aktion hat keine Kennung, nach der sich
        // suchen liesse.
        const alt = document.createElement('button');
        document.body.appendChild(alt);
        alt.focus();
        const m = schale('g5-modal', '<button>x</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        alt.remove();
        knopf({ action: 'irgendwas' });

        const vorher = document.activeElement;
        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(vorher);
    });

    test('ein noch stehender, nur unsichtbarer Oeffner wird NICHT ersetzt', () => {
        // Stufe 2 darf Stufe 1 nicht ueberstimmen. Sonst gaebe ein
        // vorruebergehend ausgeblendeter Oeffner den Fokus an einen anderen
        // Knopf weiter, obwohl sein eigener Knoten noch steht.
        const alt = knopf({ action: 'show-hp-calculator', id: '1' });
        alt.focus();
        const m = schale('g6-modal', '<button>x</button>');
        ModalFocus.merkeOeffner(m);
        ModalFocus.einstieg(m);
        alt.setAttribute('data-leer', '');
        const anderer = knopf({ action: 'show-hp-calculator', id: '1' });

        const vorher = document.activeElement;
        ModalFocus.kehreZurueck(m);
        expect(document.activeElement).toBe(vorher);
        expect(document.activeElement).not.toBe(anderer);
    });

    test('sucheGleichwertigen ohne Kennung gibt null', () => {
        expect(ModalFocus.sucheGleichwertigen(undefined)).toBeNull();
        expect(
            ModalFocus.sucheGleichwertigen({ aktion: '', id: '', typ: '', wert: '' })
        ).toBeNull();
    });
});
