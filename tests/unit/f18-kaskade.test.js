/**
 * Waechter fuer die F-18-Fehlerklasse (UAT-Einheit U2)
 *
 * WAS BEWACHT WIRD. Commit f514ba4 hat 131 Deklarationen nach der Regel
 * verschoben "der spaetere Block bleibt, die Eigenschaften die nur der fruehere
 * setzte wandern hinein". Die Begruendung gilt nur fuer den Vergleich DER ZWEI
 * KOPIEN und ist falsch, sobald zwischen ihnen eine DRITTE Regel gleicher
 * Spezifitaet stand, die dieselbe Eigenschaft setzt: gegen die hatte die
 * fruehere Kopie verloren, nach dem Umzug gewinnt sie. Fund F2 (U1) und drei
 * weitere Stellen (U2) sind so entstanden.
 *
 * Bewacht wird deshalb nicht ein Zustand, sondern eine BEZIEHUNG: das
 * Verzeichnis aller Paare, bei denen allein die Ladereihenfolge entscheidet
 * (gleiche Spezifitaet, gleicher !important-Rang, sich schneidende
 * Eigenschaft, verschiedene Werte, ein Element im Bestand, das beide
 * Selektoren tragen kann). Verschiebt jemand eine der bewachten
 * Deklarationen ueber eine solche Regel hinweg, dreht sich die Zeile und der
 * Test faellt.
 *
 * WARUM NICHT ALLE DEKLARATIONEN. Ueber den ganzen Baum sind es 4864 Paare
 * (nachgemessen, 15,5s Laufzeit) — eine Ratsche, die bei jeder gewoehnlichen
 * CSS-Aenderung rot wuerde und deshalb nichts bewacht. Bewacht wird die Menge,
 * die f514ba4 angefasst hat: Deklarationen mit `F-18: aus der Dublette
 * uebernommen`, plus die drei in U2 zurueckverlegten Bloecke, die ihre Herkunft
 * nicht mehr je Deklaration tragen und deshalb mit `F-18-BEWACHT` im Block
 * markiert sind.
 *
 * WARUM OHNE GIT. `actions/checkout@v7` in .github/workflows/ci.yml holt
 * standardmaessig eine Tiefe von 1 — `git show f514ba4~1:...` gibt es in der CI
 * nicht. Die Verlaufsanalyse (`--verlauf`) braucht die Historie und laeuft
 * deshalb von Hand; dieser Test kommt mit dem Arbeitsbaum aus.
 */

const fs = require('fs');
const path = require('path');
const T = require('../../tools/check-f18-kaskade.js');

const REPO = path.join(__dirname, '..', '..');

describe('F-18 — Reihenfolge-Abhaengigkeiten gleicher Spezifitaet', () => {
    let inv;
    let baum;
    let aktuell;

    beforeAll(() => {
        inv = T.elementInventar();
        baum = T.baumAus(null);
        aktuell = T.abhaengigkeiten(baum, inv);
    });

    test('das Verzeichnis entspricht dem eingefrorenen Stand', () => {
        const basis = T.ladeBasis();
        expect(basis).not.toBeNull();
        const p = T.pruefe(aktuell, basis);
        const bericht = [
            ...p.gedreht.map(x => `GEAENDERT ${x.id}\n    vorher: ${x.vorher.gewinner}\n    jetzt:  ${x.gewinner}`),
            ...p.neuePaare.map(x => `NEU ${x.id}\n    gewinnt: ${x.gewinner}`),
            ...p.entfallene.map(x => `ENTFALLEN ${x.id}`)
        ].join('\n');
        expect(bericht).toBe('');
        expect(p.ok).toBe(true);
    });

    test('der Stand ist nicht leer — sonst bewacht die Ratsche nichts', () => {
        expect(aktuell.length).toBeGreaterThan(50);
        expect(baum.filter(d => d.marker).length).toBeGreaterThan(100);
    });

    // ------------------------------------------------------------------
    // Mutationsbeleg: die Pruefung muss die Fehlerklasse SELBST finden,
    // nicht nur eine Datei mit einer anderen vergleichen. Beide Kaskaden
    // unten bestehen aus denselben zwei Regeln — nur ihre Reihenfolge
    // unterscheidet sich, genau wie bei F2.
    // ------------------------------------------------------------------
    const BEWACHT = '/* F-18-BEWACHT */';
    const SCHALE = `.view.active { ${BEWACHT} display: block; }`;
    const DRITTE = '.loc-view.active { display: flex; }';

    function kunstBaum(dateiInhalt) {
        const namen = Object.keys(dateiInhalt);
        return T.baum(d => dateiInhalt[d] ?? null, namen);
    }

    test('Mutationsbeleg — eine gedrehte Reihenfolge wird erkannt', () => {
        const heil = kunstBaum({ 'a.css': SCHALE, 'b.css': DRITTE });
        const krank = kunstBaum({ 'a.css': DRITTE, 'b.css': SCHALE });

        const pHeil = T.abhaengigkeiten(heil, inv);
        const pKrank = T.abhaengigkeiten(krank, inv);

        // Beide Anordnungen erzeugen dasselbe Paar ...
        expect(pHeil).toHaveLength(1);
        expect(pKrank).toHaveLength(1);
        // ... aber mit verschiedenen Gewinnern.
        expect(pHeil[0].gewinner).toContain('.loc-view.active');
        expect(pKrank[0].gewinner).toContain('.view.active');

        // Und die Pruefung meldet den Unterschied.
        const urteil = T.pruefe(pKrank, { abhaengigkeiten: pHeil });
        expect(urteil.ok).toBe(false);
        const gemeldet = [...urteil.gedreht, ...urteil.neuePaare, ...urteil.entfallene];
        expect(gemeldet.length).toBeGreaterThan(0);
    });

    test('Mutationsbeleg — die heile Reihenfolge gilt als unveraendert', () => {
        const heil = kunstBaum({ 'a.css': SCHALE, 'b.css': DRITTE });
        const nochmal = kunstBaum({ 'a.css': SCHALE, 'b.css': DRITTE });
        const urteil = T.pruefe(T.abhaengigkeiten(nochmal, inv), {
            abhaengigkeiten: T.abhaengigkeiten(heil, inv)
        });
        expect(urteil.ok).toBe(true);
    });

    // ------------------------------------------------------------------
    // Trennschaerfe: die Pruefung darf nur bei GLEICHER Spezifitaet
    // anschlagen. Der bekannte Fall `.modal-overlay { display: none }`
    // (nach dmscreen.css, 12. @import, verschoben) gegen das frueher
    // stehende `.modal-overlay.show { display: flex }` (dashboard.css, 11.)
    // hat dieselbe Gestalt wie F2, bricht aber nicht — `.show` traegt eine
    // Klasse mehr. Eine Pruefung, die ihn meldet, ist zu grob.
    // ------------------------------------------------------------------
    test('hoehere Spezifitaet der Dritten ist kein Befund (.modal-overlay.show)', () => {
        const paare = T.abhaengigkeiten(
            kunstBaum({
                'a.css': '.modal-overlay.show { display: flex; }',
                'b.css': `.modal-overlay { ${BEWACHT} display: none; }`
            }),
            inv
        );
        expect(paare).toHaveLength(0);
        expect(T.spezifitaet('.modal-overlay.show')).toEqual([0, 2, 0]);
        expect(T.spezifitaet('.modal-overlay')).toEqual([0, 1, 0]);
    });

    test('niedrigere Spezifitaet der Dritten ist kein Befund', () => {
        const paare = T.abhaengigkeiten(
            kunstBaum({
                'a.css': 'button { display: inline-block; }',
                'b.css': `.btn { ${BEWACHT} display: inline-flex; }`
            }),
            inv
        );
        expect(paare).toHaveLength(0);
    });

    test('ein Element, das es nicht gibt, ist kein Befund', () => {
        // `.char-tag` und `.char-action-btn` haben gleiche Spezifitaet und
        // setzen beide `background` — aber kein Element im Bestand traegt
        // beide Klassen. Ohne diese Pruefung meldete das Werkzeug 4726
        // statt 49 Kandidaten (nachgemessen).
        const paare = T.abhaengigkeiten(
            kunstBaum({
                'a.css': '.char-action-btn { background: #111; }',
                'b.css': `.char-tag { ${BEWACHT} background: #222; }`
            }),
            inv
        );
        expect(paare).toHaveLength(0);
    });

    test('Kurzschreibweisen zaehlen als Kollision (border gegen border-color)', () => {
        expect(T.propsSchneiden('border', 'border-color')).toBe(true);
        expect(T.propsSchneiden('padding', 'padding-left')).toBe(true);
        expect(T.propsSchneiden('font', 'font-size')).toBe(true);
        expect(T.propsSchneiden('background', 'color')).toBe(false);
    });

    // ------------------------------------------------------------------
    // Die drei in U2 zurueckverlegten Bloecke stehen wirklich vor ihren
    // Varianten. Eine Zeilennummer waere sproede; geprueft wird die
    // Kaskadennummer, also genau das, worauf es ankommt.
    // ------------------------------------------------------------------
    const frueherAls = (b, aSel, aProp, bSel, bProp) => {
        const f = (sel, prop) => b.find(d => d.selektorListe === sel && d.prop === prop && d.ctx === '(top)');
        const x = f(aSel, aProp);
        const y = f(bSel, bProp);
        if (!x) return `${aSel} { ${aProp} } fehlt`;
        if (!y) return `${bSel} { ${bProp} } fehlt`;
        return x.ordnung < y.ordnung;
    };

    test('die drei zurueckverlegten Bloecke stehen vor ihren Varianten', () => {
        expect(frueherAls(baum, '.editor-toolbar .editor-btn', 'display', '.editor-toolbar .editor-btn-text', 'display')).toBe(true);
        expect(frueherAls(baum, '.editor-toolbar .editor-btn', 'font-size', '.editor-toolbar .editor-btn-type', 'font-size')).toBe(true);
        expect(frueherAls(baum, '.btn:hover', 'background', '.btn-secondary:hover', 'background')).toBe(true);
        expect(frueherAls(baum, '.btn:hover', 'background', '.hp-calc-btn.damage', 'background')).toBe(true);
        expect(frueherAls(baum, '.form-group label', 'display', '.spell-classes-grid label', 'display')).toBe(true);
    });

    test('die Kaskadenreihenfolge kommt aus dem @import-Hub, nicht alphabetisch', () => {
        const hub = T.kaskadeOrdnung(fs.readFileSync(path.join(REPO, 'assets', 'styles.css'), 'utf8'));
        expect(hub[0]).toBe('fonts.css');
        expect(hub.indexOf('core.css')).toBeLessThan(hub.indexOf('dmscreen.css'));
        expect(hub.indexOf('editors.css')).toBeLessThan(hub.indexOf('spells.css'));
        // Alphabetisch stuende bestiary.css vor core.css — tut es hier nicht.
        expect(hub.indexOf('bestiary.css')).toBeGreaterThan(hub.indexOf('core.css'));
    });
});
