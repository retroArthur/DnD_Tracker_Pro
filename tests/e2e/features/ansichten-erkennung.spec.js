/**
 * DIE ERKENNUNG DER ANSICHTEN — die Ableitung, die an der Schreibweise hing
 * =======================================================================
 *
 * WORUEBER DIESE DATEI URTEILT. Drei Waechterfamilien des Tastatur-Strangs
 * leiten ihre Ansichtenliste aus dem gebauten Buendel ab statt sie
 * abzutippen (`tests/e2e/helpers/ansichten.js`). Die Zusage lautet: wer
 * eine Ansicht einbaut, bekommt sie mitgeprueft, ohne eine Zeile zu
 * pflegen.
 *
 * BEFUND 14 DER GEGENPRUEFUNG: diese Zusage hing an der REIHENFOLGE DER
 * ATTRIBUTE im Markup. Der Ausdruck verlangte `id` unmittelbar vor
 * `class="view"`, nur Kleinbuchstaben und keinen Unterstrich. Gemessen
 * gegen fuenf Schreibweisen desselben Abschnitts:
 *
 *   id dann class                       GEFUNDEN
 *   class vor id                        VERFEHLT
 *   ein Attribut dazwischen             VERFEHLT
 *   Grossbuchstabe in der Kennung       VERFEHLT
 *   Unterstrich in der Kennung          VERFEHLT
 *
 * Alle 24 echten Abschnitte schreiben heute `id="view-X" class="view…"`,
 * die Liste war also korrekt — aber die Zusage galt nur fuer eine
 * Schreibweise. Praktisch schmal (eine verfehlte Ansicht ohne
 * Navigationsreiter rutscht still durch, mit Reiter wird Fall (0) der
 * Erreichbarkeits-Ratsche rot und sagt es laut), und es ist die eine
 * Stelle, an der "abgeleitet statt abgetippt" von der Formatierung des
 * Markups abhing.
 *
 * WARUM SIE EINE PLAYWRIGHT-DATEI OHNE BROWSER IST. Die Pruefung braucht
 * weder Seite noch Buendel, nur die Zeichenkette — Jest waere der
 * natuerliche Ort. Er kann es hier aber nicht: die Jest-Faelle dieses
 * Hauses laufen als CommonJS (`require`, kein Babel-Vorsatz), und
 * `tests/e2e/helpers/ansichten.js` muss ESM sein, weil die zwei
 * Playwright-Dateien es `import`ieren. Eine zweite Fassung des Erkenners
 * nur fuer den Test waere genau die Doppelquelle, die diese Arbeit
 * beseitigt. Der Fall kostet ohne Browser rund 5 ms.
 */

import { test, expect } from '@playwright/test';
import { ansichtenAusHtml } from '../helpers/ansichten.js';

/**
 * Derselbe Abschnitt in fuenf Schreibweisen. Jede ist gueltiges HTML und
 * jede ergibt im Browser dieselbe Ansicht.
 */
const SCHREIBWEISEN = [
    {
        name: 'id dann class',
        html: '<div id="view-neu25" class="view">x</div>',
        kennung: 'neu25'
    },
    {
        name: 'class VOR id',
        html: '<div class="view" id="view-neu25">x</div>',
        kennung: 'neu25'
    },
    {
        name: 'ein Attribut dazwischen',
        html: '<div id="view-neu25" data-x="1" class="view">x</div>',
        kennung: 'neu25'
    },
    {
        name: 'Grossbuchstabe in der Kennung',
        html: '<div id="view-Neu25" class="view">x</div>',
        kennung: 'Neu25'
    },
    {
        name: 'Unterstrich in der Kennung',
        html: '<div id="view-neu_25" class="view">x</div>',
        kennung: 'neu_25'
    }
];

test.describe('Ansichtserkennung — unabhaengig von der Schreibweise', () => {
    for (const s of SCHREIBWEISEN) {
        test(`findet den Abschnitt: ${s.name}`, () => {
            const { abschnitte } = ansichtenAusHtml(s.html);
            expect(abschnitte).toEqual([s.kennung]);
        });
    }

    test('mehrere Abschnitte in gemischten Schreibweisen, alle gefunden', () => {
        const html = SCHREIBWEISEN.map((s, i) =>
            s.html.replace('view-' + s.kennung, 'view-a' + i)
        ).join('\n');
        const { abschnitte } = ansichtenAusHtml(html);
        expect(abschnitte).toEqual(['a0', 'a1', 'a2', 'a3', 'a4']);
    });

    test('ein weiteres Wort in der Klassenliste stoert nicht', () => {
        const { abschnitte } = ansichtenAusHtml(
            '<div id="view-x1" class="view active">a</div>' +
                '<div class="wrapper view" id="view-x2">b</div>'
        );
        expect(abschnitte).toEqual(['x1', 'x2']);
    });

    test('section und main zaehlen genauso wie div', () => {
        const { abschnitte } = ansichtenAusHtml(
            '<section id="view-s1" class="view">a</section>' +
                '<main class="view" id="view-m1">b</main>'
        );
        expect(abschnitte).toEqual(['m1', 's1']);
    });

    // DIE GEGENPROBE, DAMIT DER AUSDRUCK NICHT ZU GIERIG WIRD. Ein
    // Element, das `view` nur als TEIL eines Klassennamens traegt, ist
    // keine Ansicht — `viewport` und `view-header` sind im Haus belegt.
    test('ein Klassenname, der nur mit "view" beginnt, ist keine Ansicht', () => {
        const { abschnitte } = ansichtenAusHtml(
            '<div id="view-fehl" class="viewport">a</div>' +
                '<div id="view-fehl2" class="view-header">b</div>'
        );
        expect(abschnitte).toEqual([]);
    });

    // UND EIN ELEMENT OHNE `view-`-Praefix in der id ist keine Ansicht,
    // auch wenn es die Klasse traegt.
    test('die Klasse allein genuegt nicht — die id muss view-X lauten', () => {
        const { abschnitte } = ansichtenAusHtml('<div id="irgendwas" class="view">a</div>');
        expect(abschnitte).toEqual([]);
    });

    test('die Reiter werden mit ihrer Beschriftung gelesen', () => {
        const { reiter, beschriftung } = ansichtenAusHtml(
            '<button class="nav-tab" data-view="neu25">🧪 Pruef25</button>'
        );
        expect(reiter).toEqual(['neu25']);
        expect(beschriftung.get('neu25')).toBe('🧪 Pruef25');
    });
});
