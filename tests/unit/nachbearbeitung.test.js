/**
 * Nachbearbeitung bereinigten Markups — Vertrag SENKEN R1, docs/bugfixes.md (SENKEN)
 *
 * BEFUND (Gutachten, Sonde A): parseEntityLinks(), parseWikiLinks(), renderClickableDice()
 * und addTOCAnchors() ersetzten per Regex im SERIALISIERTEN, bereits bereinigten Markup. Ein
 * Treffer darf dort in einem Attributwert beginnen oder enden — `[[npcs:1:x<span
 * class="]]…">`, `<span title="1d6…">`, `<span title="<h2>k</h2>…">` —, die Ersetzung fuegt
 * `"` ein und beendet das Attribut, der Rest des Werts wird Markup. Browser vor der Aenderung
 * von 2025 serialisieren `<`/`>` in Attributwerten roh: dort wurde aus dem Rest ein echtes
 * Element (im Gutachten mit einer Bild-Kanarie gemessen, im Wiki, in der Schnellreferenz und
 * im Statblock). Heutige Browser kodieren sie; dort setzte die App ihre eigenen Attribute
 * (data-action …) auf ein Element aus Daten, und ein Link mit `1d6` oder `[[x]]` im href
 * verlor sein Ziel.
 *
 * FIX: bearbeiteMarkup()/ersetzeImText() (utils/basic.js) parsen inert, ersetzen NUR in
 * Textknoten und bauen den Ersatz als Knoten. Dieser Test laedt die echten Module in eine
 * vm-Werkbank mit dem DOM von jsdom und prueft jede Funktion unter BEIDEN Serialisierungen:
 * jsdom selbst serialisiert wie die Browser vor 2025 (`<` roh im Attribut — als Vorbedingung
 * festgehalten, sonst waere der Fall leer), die heutige wird nachgebildet. Der E2E-Waechter
 * tests/e2e/features/senken-kanarie.spec.js faehrt dieselbe Klasse am gebauten Buendel
 * (Eingang "alt" und die Attributgrenzen-Kanarien).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
// loader.js-relative Pfade in AUSFUEHRBAREM Code: genau diese Module laufen unten.
const MODULE = [
    'utils/basic.js',
    'systems/entity-links.js',
    'features/wiki/wiki.js',
    'features/wiki/wiki-crud.js',
    'features/bestiary/bestiary-render.js'
];

function werkbank(wiki = []) {
    const ctx = {
        console,
        document,
        DOMParser,
        Node,
        LINK_ICONS: { npcs: '👤', quests: '📜' },
        window: { D: { wiki } }
    };
    vm.createContext(ctx);
    for (const rel of MODULE) {
        const abs = path.join(ROOT, rel);
        vm.runInContext(fs.readFileSync(abs, 'utf8'), ctx, { filename: abs });
    }
    return ctx;
}

/** Ersetzt den innerHTML-Getter: `kodiert` = heutige Serialisierung (`<`/`>` als Entitaet). */
function serialisierungSetzen(kodiert) {
    const echt = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    const LEER = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'wbr', 'col', 'area']);
    const text = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const attr = s => {
        const t = s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        return kodiert ? t.replace(/</g, '&lt;').replace(/>/g, '&gt;') : t;
    };
    const knoten = n => {
        if (n.nodeType === 3) return text(n.data);
        if (n.nodeType !== 1) return '';
        let s = '<' + n.localName;
        for (const a of n.attributes) s += ` ${a.name}="${attr(a.value)}"`;
        s += '>';
        if (LEER.has(n.localName)) return s;
        return s + [...n.childNodes].map(knoten).join('') + `</${n.localName}>`;
    };
    Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: true,
        get() {
            return [...this.childNodes].map(knoten).join('');
        },
        set(v) {
            echt.set.call(this, v);
        }
    });
    return () => Object.defineProperty(Element.prototype, 'innerHTML', echt);
}

/** Eingeschleust ist, was nach dem Parsen als Element mit data-kanarie oder als <img> steht. */
function eingeschleust(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return [...doc.body.querySelectorAll('img, [data-kanarie]')].map(e => e.outerHTML);
}

/** Alle Elemente samt Attributen (fuer "die App setzt ihre Attribute auf Daten"). */
function elemente(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return [...doc.body.querySelectorAll('*')];
}

const GRENZE_MARKE =
    '<p>Regel</p>[[npcs:1:x<span class="]]<img src=kanarie-q.png data-kanarie=q>">y</span>';
const GRENZE_WIKI = '<p>T</p>[[x<span class="]]<img src=kanarie-w.png data-kanarie=w>">y</span>';
const GRENZE_WUERFEL =
    '<p><span title="1d6<img src=kanarie-d.png data-kanarie=d>">Biss</span> +5</p>';
const GRENZE_TOC = '<p><span title="<h2>k</h2><img src=kanarie-t.png data-kanarie=t>">z</span></p>';

test('Vorbedingung: jsdom serialisiert `<` in Attributwerten roh (wie Browser vor 2025)', () => {
    const d = document.createElement('div');
    d.innerHTML = '<span title="a<b>c"></span>';
    expect(d.innerHTML).toBe('<span title="a<b>c"></span>');
});

describe.each([
    ['vor 2025 (jsdom, `<` roh im Attribut)', null],
    ['heute (`<`/`>` im Attribut kodiert, nachgebildet)', true]
])('Serialisierung %s', (_name, kodiert) => {
    let zurueck = () => {};
    beforeEach(() => {
        if (kodiert) zurueck = serialisierungSetzen(true);
    });
    afterEach(() => zurueck());

    describe('ersetzeImText()', () => {
        const fett = (doc, t) => {
            const b = doc.createElement('b');
            b.title = `"${t}"`;
            b.textContent = t;
            return b;
        };

        test('ersetzt im Text, nicht im Attribut und nicht ueber eine Elementgrenze', () => {
            const ctx = werkbank();
            const aus = ctx.ersetzeImText(
                '<p title="xx">ein xx</p><i>x</i>x <a href="https://e.org/xx">xx</a>',
                /xx/g,
                fett
            );
            const doc = new DOMParser().parseFromString(aus, 'text/html');
            expect(doc.querySelector('p').getAttribute('title')).toBe('xx');
            expect(doc.querySelector('a').getAttribute('href')).toBe('https://e.org/xx');
            expect([...doc.querySelectorAll('b')].map(b => b.title)).toEqual(['"xx"', '"xx"']);
            // `<i>x</i>x` ist kein Treffer: Lookaround und Treffer enden an der Grenze
            expect(doc.querySelector('i').textContent).toBe('x');
        });

        test('null aus dem Bauer laesst den Treffer als Text stehen; leere Eingabe -> ""', () => {
            const ctx = werkbank();
            expect(ctx.ersetzeImText('<p>a xx b</p>', /xx/g, () => null)).toBe('<p>a xx b</p>');
            expect(ctx.ersetzeImText('', /x/g, fett)).toBe('');
            expect(ctx.ersetzeImText(null, /x/g, fett)).toBe('');
        });

        test('Lookbehind sieht nur den eigenen Textknoten (wie frueher das `>` davor)', () => {
            const ctx = werkbank();
            const aus = ctx.ersetzeImText('<b>3</b>+5 und 3+5', /(?<![\d])\+\d/g, fett);
            expect(elemente(aus).filter(e => e.localName === 'b' && e.title)).toHaveLength(1);
        });
    });

    describe('parseEntityLinks()', () => {
        test('Marke ueber eine Attributgrenze schleust nichts ein (Gutachten, Sonde A)', () => {
            const aus = werkbank().parseEntityLinks(GRENZE_MARKE);
            expect(eingeschleust(aus)).toEqual([]);
            // die Marke bleibt Text, kein fremdes Element bekommt data-action
            expect(elemente(aus).filter(e => e.hasAttribute('data-action'))).toEqual([]);
        });

        test('legitime Marke: Name mit &, <, " woertlich in Text und title', () => {
            const aus = werkbank().parseEntityLinks(
                '<p>Siehe [[npcs:7:Bäcker &amp; &lt;Zunft&gt; "Hans"]].</p>'
            );
            const span = elemente(aus).find(e => e.classList.contains('entity-link'));
            expect(span.getAttribute('data-action')).toBe('navigate-entity');
            expect(span.getAttribute('data-type')).toBe('npcs');
            expect(span.getAttribute('data-id')).toBe('7');
            expect(span.getAttribute('title')).toBe('npcs: Bäcker & <Zunft> "Hans"');
            expect(span.textContent).toBe('👤 Bäcker & <Zunft> "Hans"');
        });

        test('Typ aus Object.prototype liefert das Ersatzsymbol, keinen Funktionstext', () => {
            const aus = werkbank().parseEntityLinks('[[constructor:1:X]]');
            expect(elemente(aus)[0].textContent).toBe('🔗 X');
        });
    });

    describe('parseWikiLinks()', () => {
        test('Marke ueber eine Attributgrenze schleust nichts ein', () => {
            const ctx = werkbank();
            const aus = ctx.parseWikiLinks(ctx.sanitizeHTML(GRENZE_WIKI));
            expect(eingeschleust(aus)).toEqual([]);
            expect(elemente(aus).filter(e => e.hasAttribute('data-action'))).toEqual([]);
        });

        test('ein href mit [[…]] bleibt unberuehrt, der Link im Text wird gebaut', () => {
            const ctx = werkbank([{ title: 'Götter & Co' }]);
            const aus = ctx.parseWikiLinks(
                ctx.sanitizeHTML(
                    '<p><a href="https://e.org/?q=[[x]]">Suche</a> [[Götter &amp; Co]]</p>'
                )
            );
            const els = elemente(aus);
            expect(els.find(e => e.localName === 'a').getAttribute('href')).toBe(
                'https://e.org/?q=[[x]]'
            );
            const link = els.find(e => e.classList.contains('wiki-link'));
            // Der Titel ist der Text der Seite: "Götter & Co" findet seinen Eintrag
            expect(link.className).toBe('wiki-link');
            expect(link.getAttribute('data-value')).toBe('Götter & Co');
            expect(link.getAttribute('data-exists')).toBe('true');
        });
    });

    describe('renderClickableDice()', () => {
        test('Formel in einem Attribut schleust nichts ein und bleibt Attribut', () => {
            const aus = werkbank().renderClickableDice(GRENZE_WUERFEL);
            expect(eingeschleust(aus)).toEqual([]);
            const knoepfe = elemente(aus).filter(e => e.classList.contains('bestiary-dice'));
            // nur das +5 im Text bekommt einen Knopf; das title behaelt seinen Wert
            expect(knoepfe.map(k => k.getAttribute('data-value'))).toEqual(['1d20+5']);
            expect(elemente(aus).filter(e => e.hasAttribute('data-action'))).toHaveLength(1);
            expect(elemente(aus).find(e => e.localName === 'span').title).toMatch(/^1d6<img /);
        });

        test('legitime Formeln und Boni wie bisher; ein href mit 1d6+2 bleibt Ziel', () => {
            const aus = werkbank().renderClickableDice(
                '<p>Biss: +5 zum Treffen, 2W6+3 Stich, <a href="https://e.org/r?w=1d6+2">R</a></p>'
            );
            const els = elemente(aus);
            const knoepfe = els.filter(e => e.classList.contains('bestiary-dice'));
            expect(knoepfe.map(k => [k.getAttribute('data-value'), k.textContent])).toEqual([
                ['1d20+5', '+5'],
                ['2W6+3', '2W6+3']
            ]);
            expect(knoepfe[0].getAttribute('title')).toBe('Würfeln');
            expect(els.find(e => e.localName === 'a').getAttribute('href')).toBe(
                'https://e.org/r?w=1d6+2'
            );
        });
    });

    describe('addTOCAnchors()', () => {
        test('Ueberschrift in einem Attribut schleust nichts ein', () => {
            const ctx = werkbank();
            const aus = ctx.addTOCAnchors(ctx.sanitizeHTML(GRENZE_TOC));
            expect(eingeschleust(aus)).toEqual([]);
            expect(elemente(aus).filter(e => e.id)).toEqual([]);
        });

        test('Kennungen wie extractWikiTOC(): nur Ueberschriften aus reinem Text, in Reihenfolge', () => {
            const ctx = werkbank();
            const roh =
                '<h2>Eins</h2><p>a</p><h3><b>fett</b></h3><h2>Zwei &amp; mehr</h2><h4>Drei</h4>';
            const aus = ctx.addTOCAnchors(ctx.sanitizeHTML(roh));
            const kennungen = elemente(aus)
                .filter(e => e.id)
                .map(e => [e.id, e.textContent]);
            expect(kennungen).toEqual([
                ['toc-0', 'Eins'],
                ['toc-1', 'Zwei & mehr'],
                ['toc-2', 'Drei']
            ]);
            // Dieselben Kennungen; die Inhaltsliste liest den Text dekodiert ("&amp;" -> "&")
            expect(ctx.extractWikiTOC(roh).map(h => [h.id, h.text])).toEqual([
                ['toc-0', 'Eins'],
                ['toc-1', 'Zwei & mehr'],
                ['toc-2', 'Drei']
            ]);
        });
    });
});
