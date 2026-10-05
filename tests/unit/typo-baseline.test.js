'use strict';

/**
 * tools/typo-baseline.js — das Grundlinienwerkzeug der Welle 5
 * (Design-Handoff v3, Welle 5, Pruefbefunde W5-A Runde 1)
 *
 * WARUM DIESE TESTS UEBERHAUPT ENTSTEHEN. Das Werkzeug traegt die Abnahme der
 * ganzen Welle: die Aktenlage fuehrt `--diff` unter "Befehle" als
 * Abnahme-Gegenueberstellung, und Schritt 6 derselben Welle stellt 95
 * Schriftgewichte um. Ein Werkzeug, das in dieser Rolle "OK" meldet, obwohl
 * jedes Gewicht gesprungen ist, ist schlechter als keins: es verspricht eine
 * Pruefung, die es nicht leistet, und wer seinen Rueckgabewert als Tor
 * verdrahtet, bekommt gruen. Bis zu diesen Tests pruefte NICHTS das Werkzeug
 * selbst.
 *
 * GEMESSENER AUSGANGSZUSTAND (2026-10-05, HEAD 03ee2dd, vor der Behebung):
 *
 *   1. Die geschriebene Grundlinie fuehrt je Element DREI Felder. Sichtbarkeit
 *      (`sb`) und eigener Textknoten (`txt`) werden in `erhebeImBrowser()`
 *      korrekt erhoben — mit eigenem Kommentar, der sie "den Unterschied
 *      zwischen einem Befund und einem Fehlalarm" nennt — und beim Schreiben
 *      verworfen (`elemente[e.k] = [e.px, e.fw, e.lh]`). Eigener Lauf
 *      `--nur dark-375`: 5552 Eintraege, alle Tupelbreite 3, Index 3 und 4
 *      `undefined`. Die Frage, die D-06 stellt — "wie viel SICHTBARER TEXT
 *      liegt unter 11 px?" — ist aus der Datei nicht beantwortbar.
 *      Verschaerfend: die zwei ueberlebenden Summen `unterGrenzeSichtbar`
 *      (375 px: 107) und `unterGrenzeMitText` (375 px: 229) rechnen ueber
 *      DIESELBE DOM-Menge mit ZWEI verschiedenen Filtern, stehen im selben
 *      Objekt nebeneinander und laden damit zur Lesart "107 sichtbar, davon
 *      229 mit Text" ein, die arithmetisch unmoeglich ist.
 *
 *   2. `--diff` liefert Rueckgabewert 0, obwohl etwas Erhebliches passiert
 *      ist. Vier eigene Eingaben, Rueckgabewerte unmaskiert nachgemessen:
 *      (a) kein gemeinsamer Schluessel -> "verglichene Schluessel: 0" und
 *      "OK", 0; (b) Gewicht UND Zeilenhoehe auf JEDEM der zwei gemeinsamen
 *      Schluessel geaendert -> "Gewicht geaendert: 2, Zeilenhoehe geaendert:
 *      2" und "OK", 0; (c) der Lauf fehlt in der neuen Datei -> "kein
 *      Vergleich" und "OK", 0; (d) 2000 von 2500 Schluesseln fehlen -> "OK",
 *      0. Nur die Kontrolle (e), eine Groessenaenderung von +6 px, ergibt 1.
 *      Ursache: `ueberschreitungen += ueber.length` ist der EINZIGE Zaehler,
 *      und `main()` leitet den Rueckgabewert nur daraus ab.
 *
 * WAS DIESE TESTS NICHT TUN. Sie starten keinen Browser. Die Erhebung selbst
 * (`erhebe()`, `einLauf()`) braucht Chromium und das gebaute Buendel und ist
 * hier nicht pruefbar; geprueft werden die zwei Stellen, an denen das Werkzeug
 * aus Messwerten ein URTEIL macht — die gespeicherte Form und der Vergleich.
 * Genau dort lagen beide Befunde.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const api = require('../../tools/typo-baseline.js');

/** Eine Erhebung in der Form, die `--diff` liest — ein Lauf, benannte
 *  Elemente, leeres Protokoll. Mehr braucht der Vergleich nicht. */
function erhebung(elemente, zusatz = {}) {
    return {
        werkzeug: 'tools/typo-baseline.js',
        head: 'pruefstand',
        laeufe: { 'dark-1440': { elemente, protokoll: [], ...zusatz } }
    };
}

/** Ein Rohdatensatz, wie `erhebeImBrowser()` ihn liefert. */
function roh(px, { sb = 1, txt = 1, fw = '400', lh = 'normal' } = {}) {
    return { k: 'v|div#' + px + '-' + sb + '-' + txt, px, fw, lh, sb, txt };
}

describe('W5-A-01 — die geschriebene Grundlinie behaelt Sichtbarkeit und Textknoten', () => {
    test('das Werkzeug stellt die gespeicherte Tupelform bereit', () => {
        // Vor der Behebung baut `sammeln()` das Tupel inline und es gibt
        // nichts, was man pruefen koennte. Die Form IST der Vertrag der
        // Grundlinie — sie gehoert an eine benannte, exportierte Stelle.
        expect(typeof api.tupel).toBe('function');
        expect(api.TUPEL_BREITE).toBe(5);
    });

    test('das Tupel fuehrt fuenf Felder: Groesse, Gewicht, Zeilenhoehe, sichtbar, Textknoten', () => {
        expect(api.tupel({ px: 8, fw: '400', lh: 'normal', sb: 1, txt: 0 })).toEqual([
            8,
            '400',
            'normal',
            1,
            0
        ]);
        expect(api.tupel({ px: 14, fw: '600', lh: '21px', sb: 0, txt: 1 })).toEqual([
            14,
            '600',
            '21px',
            0,
            1
        ]);
    });

    test('fehlende Flaggen werden auf 0 normalisiert, nicht auf undefined', () => {
        // Sonst stehen in der Datei `null`-Werte, und ein Leser kann
        // "unsichtbar" nicht von "nicht erhoben" unterscheiden.
        expect(api.tupel({ px: 12, fw: '400', lh: 'normal' })).toEqual([12, '400', 'normal', 0, 0]);
    });
});

describe('W5-A-01 — jede Kennzahl nennt ihre Bezugsmenge', () => {
    test('die Kennzahlen entstehen an einer pruefbaren Stelle', () => {
        expect(typeof api.kennzahlen).toBe('function');
    });

    test('unterGrenzeSichtbarMitText ist die Zahl, die D-06 verlangt', () => {
        // Drei Elemente unter 11 px, bewusst so gewaehlt, dass die drei
        // heutigen Summen auseinanderfallen:
        //   sichtbar + Text  -> der echte Lesbarkeitsbefund
        //   sichtbar, kein Text -> eine SVG-Beschriftung/.slot-pip-Art, E-4
        //   unsichtbar, Text -> im Baum, aber niemand sieht es
        const k = api.kennzahlen([
            roh(8, { sb: 1, txt: 1 }),
            roh(7, { sb: 1, txt: 0 }),
            roh(9, { sb: 0, txt: 1 }),
            roh(14, { sb: 1, txt: 1 })
        ]);
        expect(k.unterGrenzeDom).toBe(3);
        expect(k.unterGrenzeSichtbar).toBe(2);
        expect(k.unterGrenzeMitText).toBe(2);
        // Genau diese Zahl war bisher aus keiner Ausgabe gewinnbar — und sie
        // ist die einzige der vier, die die Frage "liest hier jemand Text
        // unter 11 px?" beantwortet.
        expect(k.unterGrenzeSichtbarMitText).toBe(1);
    });

    test('die Kopfzahl der Konsole ist nicht mehr die groesste der drei', () => {
        // Vorher meldete die Konsole `unterGrenzeDom` (375 px: 249) als
        // Kopfzahl, also die Menge einschliesslich aller unsichtbaren
        // Knoten. Die Kennzahl, die den Bericht traegt, muss benannt sein.
        expect(typeof api.kopfzeile).toBe('function');
        const zeile = api.kopfzeile('dark-375', api.kennzahlen([roh(8), roh(14)]));
        expect(zeile).toMatch(/sichtbar/);
        expect(zeile).toMatch(/mit Text/);
    });
});

describe('W5-A-02 — der Rueckgabewert von --diff urteilt nicht nur ueber die Groesse', () => {
    test('ein Gewichtswechsel an jedem gemeinsamen Schluessel ist ein Befund', () => {
        const alt = erhebung({ 'v|div#0': [16, '600', '21px'], 'v|p#0': [14, 'bold', '18px'] });
        const neu = erhebung({ 'v|div#0': [16, '300', '21px'], 'v|p#0': [14, '400', '18px'] });
        const r = api.vergleiche(alt, neu, 2);
        expect(r.gewichtswechsel).toBe(2);
        expect(r.befunde).toBeGreaterThan(0);
    });

    test('ein Zeilenhoehenwechsel ist ein Befund', () => {
        const alt = erhebung({ 'v|div#0': [16, '400', '21px'] });
        const neu = erhebung({ 'v|div#0': [16, '400', '40px'] });
        const r = api.vergleiche(alt, neu, 2);
        expect(r.zeilenhoehenwechsel).toBe(1);
        expect(r.befunde).toBeGreaterThan(0);
    });

    test('ein Sichtbarkeitswechsel ist ein Befund, sobald beide Seiten ihn fuehren', () => {
        const alt = erhebung({ 'v|div#0': [16, '400', '21px', 1, 1] });
        const neu = erhebung({ 'v|div#0': [16, '400', '21px', 0, 1] });
        const r = api.vergleiche(alt, neu, 2);
        expect(r.sichtbarkeitswechsel).toBe(1);
        expect(r.befunde).toBeGreaterThan(0);
    });

    test('drei-Feld-Grundlinien melden KEINEN Sichtbarkeitswechsel', () => {
        // Rueckwaertsvertraeglichkeit: die eingefrorene Grundlinie der
        // Vermessung (typo-grundlinie/grundlinie-v5.json) fuehrt in allen
        // fuenf Laeufen Tupelbreite 3. Ein Vergleich gegen sie darf nicht
        // 3700 Sichtbarkeitswechsel erfinden, nur weil die Flagge fehlt.
        const alt = erhebung({ 'v|div#0': [16, '400', '21px'] });
        const neu = erhebung({ 'v|div#0': [16, '400', '21px', 1, 1] });
        const r = api.vergleiche(alt, neu, 2);
        expect(r.sichtbarkeitswechsel).toBe(0);
        expect(r.befunde).toBe(0);
    });

    test('ein leerer Vergleich ist ein Befund, nicht ein unauffaelliger Lauf', () => {
        // Fall (a) der Messung: beide Seiten voll, kein Schluessel gemeinsam.
        const alt = erhebung({ 'v|div#0': [16, '400', '21px'] });
        const neu = erhebung({ 'w|span#0': [16, '400', '21px'] });
        const r = api.vergleiche(alt, neu, 2);
        expect(r.leereVergleiche).toBe(1);
        expect(r.befunde).toBeGreaterThan(0);
        expect(r.zeilen.join('\n')).toMatch(/VERGLEICH LEER/);
    });

    test('ein Lauf, der nur auf einer Seite steht, ist ein Befund', () => {
        // Fall (c) der Messung.
        const alt = erhebung({ 'v|div#0': [16, '400', '21px'] });
        const neu = { werkzeug: 'x', head: 'y', laeufe: {} };
        const r = api.vergleiche(alt, neu, 2);
        expect(r.einseitigeLaeufe).toBe(1);
        expect(r.befunde).toBeGreaterThan(0);
    });

    test('fehlende Schluessel werden beziffert und benannt — im Urteil nur auf Verlangen', () => {
        // Fall (d) der Messung: 2000 von 2500 Schluesseln weg, kein Wert
        // geaendert. Warum das NICHT in den Rueckgabewert geht: einseitige
        // Schluessel sind im Bestand nachgemessen haeufig gutartig (die
        // Aktenlage fuehrt 28 bzw. 1915 aus nachladenden Listen). Ein Tor,
        // das daran immer rot ist, wird abgeschaltet und schuetzt dann nichts
        // mehr. Die Zahl muss aber in der Schlusszeile STEHEN, sonst liest
        // niemand sie.
        const alt = {};
        const neu = {};
        for (let i = 0; i < 2500; i++) {
            alt['v|div#' + i] = [16, '400', '21px'];
            if (i < 500) neu['v|div#' + i] = [16, '400', '21px'];
        }
        const locker = api.vergleiche(erhebung(alt), erhebung(neu), 2);
        expect(locker.fehlendeSchluessel).toBe(2000);
        expect(locker.befunde).toBe(0);
        const streng = api.vergleiche(erhebung(alt), erhebung(neu), 2, {
            schluesselStreng: true
        });
        expect(streng.befunde).toBeGreaterThan(0);
    });

    test('ein Formular, das nicht aufgeht, ist ein Befund', () => {
        // `erhebeZustandOffen()` schreibt "offen=false" nur ins Protokoll.
        // Eine gescheiterte Zustandsherstellung heisst: der Zustand "offen"
        // ist in der Grundlinie teilweise leer — und genau dort liegen die
        // kleinsten Schriftgroessen der App.
        const alt = erhebung(
            { 'v|div#0': [16, '400', '21px'] },
            {
                protokoll: ['offen/char-form: offen=false']
            }
        );
        const neu = erhebung(
            { 'v|div#0': [16, '400', '21px'] },
            {
                protokoll: ['offen/char-form: offen=false']
            }
        );
        const r = api.vergleiche(alt, neu, 2);
        expect(r.zustandNichtHergestellt).toBe(2);
        expect(r.befunde).toBeGreaterThan(0);
    });

    test('ein nicht gefundener Umschalter wird beziffert, ist aber kein Befund', () => {
        // Nachgemessen am 2026-10-05: 9 der 12 Eintraege in FORMULARE haben
        // gar keinen `toggle-collapse`-Umschalter im Markup (nur char-form,
        // enc-form und session-form haben einen). Das ist eine Luecke der
        // Erhebungsbreite und als eigener Punkt in der Aktenlage gefuehrt —
        // kein Urteil ueber die verglichenen Werte. Die Zahl muss sichtbar
        // sein, damit die Luecke nicht in Vergessenheit geraet.
        const p = { protokoll: ['offen/npc-form: kein Umschalter gefunden'] };
        const r = api.vergleiche(
            erhebung({ 'v|div#0': [16, '400', '21px'] }, p),
            erhebung({ 'v|div#0': [16, '400', '21px'] }, p),
            2
        );
        expect(r.umschalterFehlt).toBe(2);
        expect(r.befunde).toBe(0);
    });

    test('--egal nimmt einen benannten Wechsel aus dem Urteil, nennt ihn aber weiter', () => {
        // Schritt 6 stellt 95 Gewichte ABSICHTLICH um. Ohne diesen Ausweg
        // waere der Rueckgabewert dort zwangslaeufig 1 und das Tor wertlos.
        const alt = erhebung({ 'v|div#0': [16, '600', '21px'] });
        const neu = erhebung({ 'v|div#0': [16, '500', '21px'] });
        const r = api.vergleiche(alt, neu, 2, { egal: ['gewicht'] });
        expect(r.gewichtswechsel).toBe(1);
        expect(r.befunde).toBe(0);
        expect(r.zeilen.join('\n')).toMatch(/Gewicht geaendert: 1/);
    });

    test('Kontrolle: eine Groessenueberschreitung bleibt ein Befund', () => {
        const alt = erhebung({ 'v|div#0': [16, '400', '21px'] });
        const neu = erhebung({ 'v|div#0': [22, '400', '21px'] });
        const r = api.vergleiche(alt, neu, 2);
        expect(r.ueberschreitungen).toBe(1);
        expect(r.befunde).toBeGreaterThan(0);
    });

    test('Kontrolle: zwei gleiche Erhebungen bleiben ohne Befund', () => {
        const e = { 'v|div#0': [16, '400', '21px', 1, 1], 'v|p#0': [14, '600', '18px', 1, 0] };
        const r = api.vergleiche(erhebung(e), erhebung(e), 2);
        expect(r.befunde).toBe(0);
        expect(r.leereVergleiche).toBe(0);
    });
});

describe('W5-A-02 — die Schlusszeile nennt, worueber geurteilt wurde', () => {
    test('die Schlusszeile entsteht an einer pruefbaren Stelle', () => {
        expect(typeof api.schlusszeile).toBe('function');
    });

    test('der gruene Fall nennt jede gepruefte Eigenschaft namentlich', () => {
        // "OK — keine Aenderung ueber 2 px" war die alte Zusage. Sie klang
        // wie "nichts hat sich bewegt" und bedeutete "die Groesse hat sich
        // nicht bewegt". Der Unterschied muss in der Zeile stehen.
        const z = api.schlusszeile(api.vergleiche(erhebung({}), erhebung({}), 2), 2);
        expect(z).toMatch(/Groesse/);
        expect(z).toMatch(/Gewicht/);
        expect(z).toMatch(/Zeilenhoehe/);
        expect(z).toMatch(/Sichtbarkeit/);
    });

    test('die Schlusszeile nennt auch, was NICHT im Urteil steckt', () => {
        const alt = {};
        const neu = {};
        for (let i = 0; i < 30; i++) {
            alt['v|div#' + i] = [16, '400', '21px'];
            if (i < 10) neu['v|div#' + i] = [16, '400', '21px'];
        }
        const z = api.schlusszeile(api.vergleiche(erhebung(alt), erhebung(neu), 2), 2);
        expect(z).toMatch(/NICHT im Urteil/);
        expect(z).toMatch(/20/);
    });
});

describe('W5-A-02 — main() gibt den Befund als Rueckgabewert weiter', () => {
    let verzeichnis;
    let stumm;

    beforeAll(() => {
        verzeichnis = fs.mkdtempSync(path.join(os.tmpdir(), 'typo-baseline-'));
    });

    beforeEach(() => {
        stumm = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        stumm.mockRestore();
    });

    afterAll(() => {
        fs.rmSync(verzeichnis, { recursive: true, force: true });
    });

    const schreibe = (name, inhalt) => {
        const p = path.join(verzeichnis, name);
        fs.writeFileSync(p, JSON.stringify(inhalt));
        return p;
    };

    test('Gewichts- und Zeilenhoehenwechsel ergeben Rueckgabewert 1', async () => {
        const a = schreibe('gw-alt.json', erhebung({ 'v|div#0': [16, '600', '21px'] }));
        const b = schreibe('gw-neu.json', erhebung({ 'v|div#0': [16, '300', '40px'] }));
        await expect(api.main(['--diff', a, b])).resolves.toBe(1);
    });

    test('ein leerer Vergleich ergibt Rueckgabewert 1', async () => {
        const a = schreibe('leer-alt.json', erhebung({ 'v|div#0': [16, '400', '21px'] }));
        const b = schreibe('leer-neu.json', erhebung({ 'w|span#0': [16, '400', '21px'] }));
        await expect(api.main(['--diff', a, b])).resolves.toBe(1);
    });

    test('ein einseitiger Lauf ergibt Rueckgabewert 1', async () => {
        const a = schreibe('eins-alt.json', erhebung({ 'v|div#0': [16, '400', '21px'] }));
        const b = schreibe('eins-neu.json', { werkzeug: 'x', head: 'y', laeufe: {} });
        await expect(api.main(['--diff', a, b])).resolves.toBe(1);
    });

    test('Kontrolle: zwei gleiche Erhebungen ergeben Rueckgabewert 0', async () => {
        const e = erhebung({ 'v|div#0': [16, '400', '21px', 1, 1] });
        const a = schreibe('gleich-alt.json', e);
        const b = schreibe('gleich-neu.json', e);
        await expect(api.main(['--diff', a, b])).resolves.toBe(0);
    });
});
