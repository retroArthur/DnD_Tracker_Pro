/**
 * Kein verwaistes Kommentarende in den Stilblaettern
 *
 * DER BEFUND (UAT-Runde 7). Die Lupe der globalen Suche schwebte seit Maerz 2026
 * ueber dem Start-Reiter. Ursache war kein Layoutfehler, sondern ein Kommentar:
 * bei der CSS-Aufteilung (900271a, 2026-03-18) blieb das oeffnende Zeichen eines
 * Banners auf der anderen Seite des Schnitts. assets/styles/dmscreen.css begann
 * seither mit
 *
 *       GLOBAL SEARCH
 *       ============================================================ * /
 *     .global-search-container { position: relative; ... }
 *
 * und der Parser las Bannertext und Selektor als EINEN ungueltigen Selektor —
 * die ganze Regel war tot, sieben Monate lang, ohne dass ein Tor etwas sah. Die
 * Diagnose hat denselben Fehler dann beinahe ein zweites Mal gemacht: ihr
 * vorgeschlagener Erklaertext enthielt woertlich das Kommentarende und haette die
 * Korrektur auf dieselbe Weise getoetet (gemessen in der Gegenpruefung).
 *
 * DIESER WAECHTER zaehlt Kommentarenden, die ausserhalb eines Kommentars stehen.
 * Zwei gibt es heute, beide gemessen und beide mit totem Inhalt dahinter — sie
 * stehen als GEZAEHLTE Ausnahme in BEKANNTE_WAISEN und muessen genau so oft
 * vorkommen: eine neue Waise stellt rot, eine reparierte auch (dann den Eintrag
 * streichen).
 *
 *   dmscreen.css  "GLOBAL SEARCH"-Banner. Die Regel dahinter bleibt tot; ihr
 *                 `position: relative` steht seit UAT-Runde 7 am Dateiende. Den
 *                 Kopf NICHT durch ein nachgetragenes Zeichen reparieren: das
 *                 weckte auch `margin-left: auto` auf und schoebe das Suchfeld
 *                 quer durch die Kopfzeile.
 *   tools.css     "RANDOM TABLES"-Banner; `.rt-empty` ist dadurch tot (null
 *                 Regeln im CSSOM). Eigener Befund: eine Reparatur aendert
 *                 berechnete Stile in einer Ansicht und damit den Stil-Sollstand.
 *
 * (Das Kommentarende ist in diesem Kopf absichtlich als "* /" geschrieben —
 * im Klartext beendete es diesen Blockkommentar, die Fehlerklasse selbst.)
 */

const fs = require('fs');
const path = require('path');

const STILE = path.join(__dirname, '..', '..', 'assets', 'styles');

const BEKANNTE_WAISEN = {
    'dmscreen.css': 1,
    'tools.css': 1
};

/**
 * Zerlegt CSS-Quelltext und meldet jedes Kommentarende ausserhalb eines
 * Kommentars (mit Zeile) sowie einen am Dateiende noch offenen Kommentar.
 *
 * ZEICHENKETTEN WERDEN BEWUSST NICHT UEBERSPRUNGEN. Die erste Fassung tat es und
 * wurde von ihrer eigenen Mutation widerlegt: ein vorzeitig geschlossener
 * Kommentar, dessen ausgelaufener Rest ein Anfuehrungszeichen enthaelt
 * (`... liest "BANNER === * / .x" als EINEN Selektor * /`), oeffnet ausserhalb
 * des Kommentars eine Zeichenkette — und die verschluckte das echte
 * Kommentarende. Der Waechter blieb gruen, die Regel dahinter war tot. Ein
 * Kommentarende IN einer Zeichenkette gibt es im Baum nicht; wer eines braucht,
 * schreibt es maskiert ("*\/").
 * @param {string} text
 * @returns {{ waisen: number[], offenAb: number|null }}
 */
function zerlege(text) {
    const waisen = [];
    let zeile = 1;
    let kommentarAb = null;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const n = text[i + 1];
        if (c === '\n') {
            zeile++;
            continue;
        }
        if (kommentarAb !== null) {
            if (c === '*' && n === '/') {
                kommentarAb = null;
                i++;
            }
            continue;
        }
        if (c === '/' && n === '*') {
            kommentarAb = zeile;
            i++;
        } else if (c === '*' && n === '/') {
            waisen.push(zeile);
            i++;
        }
    }
    return { waisen, offenAb: kommentarAb };
}

const dateien = fs
    .readdirSync(STILE)
    .filter(f => f.endsWith('.css'))
    .sort();

describe('Kein verwaistes Kommentarende in assets/styles', () => {
    test('der Zerleger erkennt die Fehlerklasse (Gegenprobe gegen Leerlauf)', () => {
        expect(zerlege('a{}\n  BANNER\n  ===== */\n.b{}').waisen).toEqual([3]);
        expect(zerlege('/* ok */ .a{} /* zwei\n Zeilen */ .b{}').waisen).toEqual([]);
        expect(zerlege("Banner mit Apostroph's\n === */").waisen).toEqual([2]);
        expect(zerlege('/* offen').offenAb).toBe(1);
        // Die Mutation, an der die erste Fassung scheiterte: der ausgelaufene
        // Rest eines vorzeitig geschlossenen Kommentars enthaelt ein
        // Anfuehrungszeichen. Ein Zerleger, der Zeichenketten ueberspringt, sieht
        // das echte Kommentarende dahinter nicht.
        expect(
            zerlege('/* liest "BANNER === */ .x" als EINEN Selektor */\n.probe { color: red; }')
                .waisen
        ).toEqual([1]);
        // Bewusst streng: ein Kommentarende in einer Zeichenkette gilt als
        // verdaechtig (maskiert schreiben).
        expect(zerlege('.a{content:"*/"}').waisen).toEqual([1]);
        expect(zerlege('.a{content:"*\\/"}').waisen).toEqual([]);
    });

    test('die Stilblaetter werden gefunden', () => {
        // BASE-01/empty: ohne Dateien prueft der Fall nichts.
        expect(dateien.length).toBeGreaterThanOrEqual(15);
    });

    test('kein Stilblatt endet in einem offenen Kommentar', () => {
        const offen = dateien
            .map(f => ({ f, ab: zerlege(fs.readFileSync(path.join(STILE, f), 'utf8')).offenAb }))
            .filter(x => x.ab !== null)
            .map(x => `${x.f}: Kommentar ab Zeile ${x.ab} nie geschlossen`);
        expect(offen).toEqual([]);
    });

    test('verwaiste Kommentarenden nur dort, wo sie gezaehlt sind — und genau so oft', () => {
        const ist = {};
        const orte = [];
        for (const f of dateien) {
            const { waisen } = zerlege(fs.readFileSync(path.join(STILE, f), 'utf8'));
            if (waisen.length) {
                ist[f] = waisen.length;
                orte.push(...waisen.map(z => `${f}:${z}`));
            }
        }
        const alle = [...new Set([...Object.keys(ist), ...Object.keys(BEKANNTE_WAISEN)])].sort();
        const abweichend = alle
            .filter(f => (ist[f] || 0) !== (BEKANNTE_WAISEN[f] || 0))
            .map(f => `${f}: gezaehlt ${ist[f] || 0}, gefuehrt ${BEKANNTE_WAISEN[f] || 0}`);
        if (abweichend.length) {
            throw new Error(
                'Verwaiste Kommentarenden weichen von BEKANNTE_WAISEN ab — ' +
                    abweichend.join('; ') +
                    '. Gefunden an: ' +
                    (orte.join(', ') || '(keinem Ort)') +
                    '. Eine neue Waise toetet die Regel dahinter; eine reparierte ' +
                    'gehoert aus der Liste gestrichen.'
            );
        }
        expect(abweichend).toEqual([]);
    });
});
