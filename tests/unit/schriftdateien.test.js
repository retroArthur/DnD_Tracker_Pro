'use strict';

/**
 * schriftdateien — Ratsche fuer die gebuendelten woff2 (SCHR)
 *
 * Bewacht eine Zusicherung, die kein 404 und kein Konsolenfehler zeigt: dass
 * die lokal gebuendelten Schriften die Zeichen ENTHALTEN, die diese deutsche
 * App darstellt. Eine woff2 mit falschem Subset laedt sauber, der Browser
 * findet darin kein 'A' und faellt zeichenweise auf `Arial` zurueck —
 * unsichtbar fuer jede Netzwerk- und Fehlerpruefung.
 *
 * Gemessen wird ueber `tools/pruefe-schriftdateien.js` (woff2-Kopf ->
 * Tabellenverzeichnis -> Brotli -> cmap, Glyph-ID-aufgeloest).
 *
 * Die Dateiliste kommt AUS fonts.css, nie aus einem Literal hier — ein
 * Waechter mit eigener Liste uebersieht die achte Datei.
 *
 * ======================================================================
 * DIE MESSLOGIK IST AM 2026-10-13 GEKIPPT (Dateiaustausch, Commit b0ada5b)
 * ======================================================================
 * Bis dahin trugen ALLE zehn gebuendelten Dateien das falsche Subset
 * (Kyrillisch bzw. Devanagari), keine kannte ein lateinisches 'A'. Diese
 * Ratsche hielt diesen Befund fest: die Ausnahmeliste war VOLL, und der
 * Anker gegen Leerlauf war die KURZE Liste der wirklich getragenen Zeichen
 * (' ' in allen zehn, dazu 'A'/'Ä' in Inter).
 *
 * Jetzt tragen alle sieben Dateien den lateinischen Satz vollstaendig.
 * Damit ist jene Verankerung nicht nur ueberholt, sondern UNBRAUCHBAR, und
 * zwar aus einem Grund, der beim Umbau leicht uebersehen wird:
 *
 *   Solange die Dateien kaputt waren, war "traegt fast nichts" eine
 *   auffaellige Aussage. Eine auf `fehlend = alles` festgenagelte
 *   Fehlliste liess sich daran erkennen. Heute ist "traegt alles" die
 *   WAHRHEIT — eine auf `fehlend = []` festgenagelte Fehlliste ist vom
 *   richtigen Urteil mit gesunden Dateien allein NICHT zu unterscheiden.
 *
 * Darum ist der Anker vom URTEIL auf die ROHDATEN der cmap umgezogen:
 * exakte Glyphenzahl, die VOLLSTAENDIGE Blockverteilung (vorher nur ein
 * Block je Datei) und `ZUGABE_ANKER` — Zeichen, die jede Datei traegt und
 * die absichtlich NICHT im deutschen Satz stehen. Dazu kommt in Teil 0 eine
 * Gegenprobe mit synthetischen cmap-Daten, weil der gesunde Bestand selbst
 * keine Datei mehr hergibt, an der ein Nein des Messwerkzeugs zu sehen waere.
 *
 * Die Eigenschaft, auf die es ankommt, ist unveraendert:
 * BEI KAPUTTEM MESSWERKZEUG WIRD DIESE RATSCHE ROT, NICHT GRUEN.
 */

const path = require('path');
const werkzeug = require('../../tools/pruefe-schriftdateien.js');

// ----------------------------------------------------------------------
// SCHRIFT_AUSNAHMEN — Dateien, die den deutschen Zeichensatz NICHT tragen
// und deren Zustand als bekannt gilt.
//
// DIESE LISTE IST BEWUSST LEER, NICHT ABWESEND — nach dem Vorbild von
// `EXEC_COMMAND_ALLOWLIST` in `tests/e2e/features/editor-floating.spec.js`,
// deren leere Fassung ebenfalls eine Aussage ist und keine Auslassung.
//
// BIS ZUM 2026-10-13 STANDEN HIER ALLE ZEHN DATEIEN:
//     roboto-400, roboto-700                 kyrillisch, 155 kyr. Glyphen
//     inter-400, inter-500, inter-600        kyrillisch, 148 kyr. Glyphen
//     poppins-400, poppins-500, poppins-600  Devanagari,  94 Dev. Glyphen
//     source-sans-pro-400, -600              kyrillisch,  56 kyr. Glyphen
// Sie trugen dieses Subset seit ihrer Geburt (1c3245b, `feat(02-02):
// PWA-Grundlage`); eine richtige Fassung hat es nie gegeben. Die Liste
// beschrieb also keinen Sonderfall, sondern den vollstaendigen Ist-Zustand.
//
// Mit dem Austausch (b0ada5b) ist sie leer geworden — nicht aus Nachsicht,
// sondern weil kein Eintrag mehr WAHR waere: die Verwesungsprobe in Teil 4
// hat genau das erzwungen und stellte beim Austausch von selbst rot.
//
// DIE GEFAHR HAT DIE RICHTUNG GEWECHSELT. Vorher war zu befuerchten, dass
// die Liste nach einer Reparatur zur Luege wird. Jetzt ist zu befuerchten,
// dass jemand eine Datei EINTRAEGT, um einen echten Regress stillzustellen.
// Teil 4 prueft darum nicht mehr nur die (leeren) Eintraege, sondern
// beweisend am gesunden Bestand, dass JEDER heute moegliche Eintrag
// abgewiesen wuerde — eine leere Liste allein ist trivial sauber und waere
// kein Beweis.
// ----------------------------------------------------------------------
const SCHRIFT_AUSNAHMEN = {};

const AUSNAHMEN_SOLL = 0;

// ----------------------------------------------------------------------
// SCHRIFTDATEIEN_SOLL — die Zahl der gebuendelten Dateien, EXAKT.
//
// ENTSCHEIDUNG (2026-10-13): festnageln (`toBe`), nicht als Untergrenze
// fuehren (`toBeGreaterThanOrEqual`). Vorher stand hier `MINDEST_DATEIEN =
// 10` an drei Stellen, geheftet an den damaligen Zehnerbau. Heute sind es
// sieben Dateien und sieben @font-face-Bloecke (zwei variable Familien
// liefern alle Gewichte aus je einer Datei).
//
// BEGRUENDUNG. Der Zweck dieser Zahl ist Leerlauf-Erkennung, nicht eine
// Politik "die App muss mindestens N Schriften ausliefern". Der Kommentar
// der alten Fassung sagte das schon: gegen `>= 0` wuerde ein leeres
// Parse-Ergebnis (fonts.css-Regex kaputt, Verzeichnis verschoben) gruen
// durchlaufen, weil "keine Datei verletzt die Regel" trivial wahr ist.
// Fuer diesen Zweck ist die exakte Zahl strikt staerker:
//
//   - Sie faengt den Leerlauf genauso (0 ist nicht 7).
//   - Sie faengt zusaetzlich das WACHSEN. Eine achte Datei, die in
//     fonts.css, sw.js und Verzeichnis gleichzeitig auftaucht, ist von
//     Teil 5 und Teil 7 aus nicht zu sehen — die pruefen Mengen-
//     GLEICHHEIT der drei Enden, und drei einträchtig gewachsene Enden
//     sind untereinander gleich. Nur die exakte Zahl zwingt dann einen
//     Menschen, die achte Datei zu bemerken.
//   - Eine Untergrenze, die bei jeder Strukturaenderung nach unten
//     korrigiert wird, ist leer: sie behauptet immer nur, was gerade
//     ohnehin gilt. Genau das war der Zustand, in dem `10` vier Monate
//     ueber zehn kaputten Dateien stand.
//
// DER PREIS IST GEWOLLT: jede Strukturaenderung am Schriftbestand macht
// diese Zeile rot und muss hier ABSICHTLICH nachgezogen werden. Dasselbe
// Prinzip tragen `AUSNAHMEN_SOLL` und `GEMESSENE_SCHRIFTEN`. Der SCHR-Vorfall
// konnte vier Monate laufen, weil niemand den Bestand ansehen MUSSTE.
// ----------------------------------------------------------------------
const SCHRIFTDATEIEN_SOLL = 7;

// ----------------------------------------------------------------------
// GEMESSENE_SCHRIFTEN — Gegenprobe gegen Leerlauf, auf ROHDATEN verankert.
//
// Der Zweck ist NICHT, die Subsets zu bewerten, sondern zu beweisen, dass
// der Parser echte Daten liest. Bei einem kaputten Parser (Brotli-Block an
// der falschen Stelle, Tabellenlaengen falsch addiert, cmap-Offsets
// verschoben) werden aus diesen Zahlen Nullen oder der Block verschwindet —
// und der Test ist rot. Eine Ratsche, die auch bei kaputtem Messwerkzeug
// gruen bleibt, ist wertlos.
//
// WARUM HIER DIE VOLLE BLOCKVERTEILUNG STEHT UND NICHT EIN BLOCK JE DATEI:
// vorher genuegte ein Block, weil er das FALSCHE Subset benannte (Inter 148
// kyrillisch) und damit von sich aus auffaellig war. Ein lateinischer Block
// ist unauffaellig; erst die vollstaendige Verteilung ist eine Aussage, die
// ein kaputter Parser nicht zufaellig trifft.
//
// `fvar` ist die Gewichtsachse der Datei (Teil 8): `null` heisst "keine
// fvar-Tabelle, statische Schrift", sonst `{ <achse>: [min, standard, max] }`.
// Dass bei fuenf Dateien ausdruecklich `null` steht, ist Absicht — liefert
// Google Poppins kuenftig variabel, wird diese Zeile rot und ein Mensch muss
// entscheiden, ob `font-weight: 400` dort ein Bereich werden soll.
//
// Zahlen gemessen am Stand b0ada5b mit `node tools/pruefe-schriftdateien.js`.
// ----------------------------------------------------------------------
const GEMESSENE_SCHRIFTEN = {
    'roboto-variable.woff2': {
        glyphen: 229,
        bloecke: {
            'Basic Latin': 95,
            'Latin-1 Supplement': 96,
            'Latin Extended-A': 3,
            'IPA/Modifier': 4,
            Punctuation: 18,
            Currency: 1,
            'Letterlike/Arrows': 1,
            'Math Operators': 1
        },
        fvar: { wght: [100, 400, 900] }
    },
    'inter-variable.woff2': {
        glyphen: 230,
        bloecke: {
            'Basic Latin': 95,
            'Latin-1 Supplement': 95,
            'Latin Extended-A': 3,
            'IPA/Modifier': 5,
            Punctuation: 18,
            Currency: 1,
            'Letterlike/Arrows': 3,
            'Math Operators': 1
        },
        fvar: { wght: [100, 400, 900] }
    },
    'poppins-400.woff2': {
        glyphen: 217,
        bloecke: {
            'Basic Latin': 95,
            'Latin-1 Supplement': 96,
            'Latin Extended-A': 3,
            'IPA/Modifier': 4,
            Punctuation: 13,
            Currency: 1,
            'Letterlike/Arrows': 1,
            'Math Operators': 2
        },
        fvar: null
    },
    'poppins-500.woff2': {
        glyphen: 217,
        bloecke: {
            'Basic Latin': 95,
            'Latin-1 Supplement': 96,
            'Latin Extended-A': 3,
            'IPA/Modifier': 4,
            Punctuation: 13,
            Currency: 1,
            'Letterlike/Arrows': 1,
            'Math Operators': 2
        },
        fvar: null
    },
    'poppins-600.woff2': {
        glyphen: 217,
        bloecke: {
            'Basic Latin': 95,
            'Latin-1 Supplement': 96,
            'Latin Extended-A': 3,
            'IPA/Modifier': 4,
            Punctuation: 13,
            Currency: 1,
            'Letterlike/Arrows': 1,
            'Math Operators': 2
        },
        fvar: null
    },
    'source-sans-pro-400.woff2': {
        glyphen: 231,
        bloecke: {
            'Basic Latin': 95,
            'Latin-1 Supplement': 96,
            'Latin Extended-A': 3,
            'IPA/Modifier': 5,
            Punctuation: 17,
            Currency: 1,
            'Letterlike/Arrows': 3,
            'Math Operators': 2
        },
        fvar: null
    },
    'source-sans-pro-600.woff2': {
        glyphen: 231,
        bloecke: {
            'Basic Latin': 95,
            'Latin-1 Supplement': 96,
            'Latin Extended-A': 3,
            'IPA/Modifier': 5,
            Punctuation: 17,
            Currency: 1,
            'Letterlike/Arrows': 3,
            'Math Operators': 2
        },
        fvar: null
    }
};

// ----------------------------------------------------------------------
// ZUGABE_ANKER — der Ersatz fuer den alten `getragen`-Anker.
//
// Zeichen, die JEDE der sieben Dateien traegt (gemessen: 113 solche
// Zeichen) und die ABSICHTLICH NICHT im deutschen Satz stehen. Genau das
// macht sie als Anker brauchbar: sie koennen in `codepunkte` nur stehen,
// wenn die cmap wirklich gelesen wurde. Kein Rechenweg, der aus
// `DEUTSCHE_CODEPUNKTE` abgeleitet ist, kann sie erzeugen.
//
// U+2212 ist der sauberste der fuenf: das Werkzeug schliesst ihn
// AUSDRUECKLICH aus `DEUTSCHER_ZEICHENSATZ` aus (dokumentiert in
// `tools/pruefe-schriftdateien.js`, "Bewusst NICHT enthalten"). Er steht
// trotzdem in Googles `latin`-unicode-range und damit in jeder der sieben
// Dateien — ein Zeichen, das das Urteil nie anfasst und die Messung belegt.
// ----------------------------------------------------------------------
const ZUGABE_ANKER = Object.freeze([
    0x00a0, // geschuetztes Leerzeichen
    0x0152, // OE-Ligatur
    0x0153, // oe-Ligatur
    0x2122, // Markenzeichen
    0x2212 // echtes Minus — vom deutschen Satz ausdruecklich ausgenommen
]);

// Einmal messen, alle Teile lesen dieselbe Messung. Steht VOR den
// Hilfsfunktionen, weil `verwesungsBefund()` auf NACH_NAME zugreift.
const ERGEBNIS = werkzeug.pruefeAlle();
const QUELLEN = werkzeug.leseSchriftQuellen();
const NACH_NAME = new Map(ERGEBNIS.dateien.map(d => [d.name, d]));

// Laenge des fvar-Kopfes (OpenType): major, minor, axesArrayOffset,
// reserved, axisCount, axisSize, instanceCount, instanceSize — 8 x uint16.
const FVAR_KOPF_LAENGE = 16;

/**
 * Baut eine cmap-Untertabelle im Format 4 aus Segmenten.
 *
 * Zweck: synthetische Gegenprobe. Der gesunde Bestand traegt ueberall
 * alles, also gibt es keine Datei mehr, an der ein NEIN des Messwerkzeugs
 * zu beobachten waere. Ohne eine solche Gegenprobe bliebe ungeprueft, ob
 * der Leser ueberhaupt noch zwischen "Glyphe vorhanden" und "nicht
 * vorhanden" unterscheidet.
 *
 * Feldfolge nach OpenType (format, length, language, segCountX2,
 * searchRange, entrySelector, rangeShift, endCode[], reservedPad,
 * startCode[], idDelta[], idRangeOffset[]).
 * @param {Array<{start: number, ende: number, delta: number}>} segmente
 * @returns {Buffer}
 */
function baueFormat4(segmente) {
    const n = segmente.length;
    const buf = Buffer.alloc(16 + 8 * n);
    buf.writeUInt16BE(4, 0);
    buf.writeUInt16BE(buf.length, 2);
    buf.writeUInt16BE(0, 4);
    buf.writeUInt16BE(n * 2, 6);
    segmente.forEach((s, i) => {
        buf.writeUInt16BE(s.ende, 14 + i * 2);
        buf.writeUInt16BE(s.start, 16 + n * 2 + i * 2);
        buf.writeInt16BE(s.delta, 16 + n * 4 + i * 2);
        buf.writeUInt16BE(0, 16 + n * 6 + i * 2);
    });
    return buf;
}

/**
 * Der Befund der Verwesungsprobe fuer EINEN moeglichen Ausnahme-Eintrag.
 *
 * Als eigene Funktion und nicht inline im Testkoerper, damit die Probe auch
 * bei LEERER Ausnahmeliste Zaehne hat: Teil 4 kann sie so gegen den
 * gesunden Bestand fahren und beweisen, dass jeder heute denkbare Eintrag
 * abgewiesen wuerde.
 * @param {string} name Dateiname, z. B. 'poppins-400.woff2'
 * @returns {string|null} Begruendung der Abweisung, oder null wenn der
 *   Eintrag berechtigt waere.
 */
function verwesungsBefund(name) {
    const datei = NACH_NAME.get(name);
    if (!datei) {
        return `${name} steht auf SCHRIFT_AUSNAHMEN, wird von fonts.css aber nicht eingebunden`;
    }
    if (datei.traegtDeutsch) {
        return (
            `${name} steht auf SCHRIFT_AUSNAHMEN, traegt den deutschen ` +
            `Zeichensatz aber vollstaendig. Die Datei ist in Ordnung — nimm sie ` +
            `aus SCHRIFT_AUSNAHMEN heraus und senke AUSNAHMEN_SOLL.`
        );
    }
    return null;
}

describe('SCHR — Schriftdateien tragen den deutschen Zeichensatz', () => {
    // ------------------------------------------------------------------
    // Teil 0 — Waechter des Waechters: ohne diese Faelle koennte alles
    // Folgende leer durchlaufen.
    // ------------------------------------------------------------------
    describe('Teil 0 — Waechter des Waechters', () => {
        test(`Genau ${SCHRIFTDATEIEN_SOLL} Dateien werden geprueft`, () => {
            expect(ERGEBNIS.geprueft).toBe(SCHRIFTDATEIEN_SOLL);
        });

        test('Der deutsche Zeichensatz ist nicht leer und enthaelt Alphabet, Ziffern, Umlaute', () => {
            expect(werkzeug.DEUTSCHE_CODEPUNKTE.length).toBeGreaterThanOrEqual(90);
            for (const zeichen of ['A', 'Z', 'a', 'z', '0', '9', 'Ä', 'ö', 'ß']) {
                expect(werkzeug.DEUTSCHE_CODEPUNKTE).toContain(zeichen.codePointAt(0));
            }
        });

        test.each(Object.keys(GEMESSENE_SCHRIFTEN))(
            'Gegenprobe gegen Leerlauf: %s liest echte cmap-Daten',
            name => {
                const soll = GEMESSENE_SCHRIFTEN[name];
                const datei = NACH_NAME.get(name);
                expect(datei).toBeDefined();
                expect(datei.fehler).toBeNull();

                // Die Tabellenlaengen muessen den entpackten Strom genau
                // ausfuellen — belegt die Annahme "Tabellen liegen ohne
                // Polsterung in Verzeichnisreihenfolge".
                expect(datei.laengenStimmen).toBe(true);

                expect(datei.glyphen).toBe(soll.glyphen);

                // Die VOLLE Blockverteilung, nicht ein Block daraus. Als
                // Objekt verglichen, damit auch ein ZUSAETZLICHER Block
                // auffaellt (ein griechischer etwa) und nicht nur ein
                // fehlender.
                const gemessen = {};
                for (const b of datei.bloecke) gemessen[b.name] = b.anzahl;
                expect(gemessen).toEqual(soll.bloecke);

                // Zwei Wege, dieselbe Aussage: die Fehlliste muss genau das
                // Komplement der GELESENEN Codepunkte sein. Bricht einer der
                // beiden Rechenwege allein, faellt es hier auf.
                expect(datei.codepunkte.length).toBe(datei.glyphen);
                const ausCodepunkten = werkzeug.DEUTSCHER_ZEICHENSATZ.filter(
                    z => !datei.codepunkte.includes(z.codePointAt(0))
                ).sort();
                expect(datei.fehlendeZeichen.slice().sort()).toEqual(ausCodepunkten);
            }
        );

        test.each(Object.keys(GEMESSENE_SCHRIFTEN))(
            'Gegenprobe gegen Leerlauf: %s traegt die Zugabe-Anker ausserhalb des deutschen Satzes',
            name => {
                const datei = NACH_NAME.get(name);
                expect(datei).toBeDefined();
                for (const codepunkt of ZUGABE_ANKER) {
                    // Nicht im Urteilssatz — kann also nur aus der cmap kommen.
                    expect(werkzeug.DEUTSCHE_CODEPUNKTE).not.toContain(codepunkt);
                    expect(datei.codepunkte).toContain(codepunkt);
                }
            }
        );

        test('Keine cmap-Untertabelle blieb wegen unbekannten Formats ungelesen', () => {
            for (const datei of ERGEBNIS.dateien) {
                if (datei.fehler) continue;
                expect(datei.nichtUnterstuetzteFormate).toEqual([]);
                expect(datei.untertabellen).toBeGreaterThan(0);
            }
        });

        // --------------------------------------------------------------
        // Synthetische Gegenprobe: das Messwerkzeug kann NEIN sagen.
        //
        // Notwendig geworden, weil der gesunde Bestand ueberall alles
        // traegt. Mit zehn kaputten Dateien war jedes Nein im Bestand
        // selbst zu sehen; heute gibt es dort kein Nein mehr, und ein
        // Leser, der blind alles als abgedeckt meldet, waere am Bestand
        // nicht von einem richtigen zu unterscheiden.
        // --------------------------------------------------------------
        describe('Synthetische Gegenprobe: der cmap-Leser unterscheidet vorhanden/fehlend', () => {
            test('Eine cmap mit nur A und B liefert genau A und B', () => {
                const buf = baueFormat4([
                    { start: 0x41, ende: 0x42, delta: 1 },
                    // Die normative Schlussgruppe zeigt auf Glyphe 0 und
                    // darf NICHT als abgedeckt gemeldet werden.
                    { start: 0xffff, ende: 0xffff, delta: 1 }
                ]);
                const gelesen = werkzeug.leseCmapUntertabelle(buf, 0);
                expect(gelesen.unterstuetzt).toBe(true);
                expect(gelesen.format).toBe(4);
                expect(gelesen.codepunkte).toEqual([0x41, 0x42]);
            });

            test('Der deutsche Satz gilt an einer A/B-cmap als NICHT getragen', () => {
                const buf = baueFormat4([{ start: 0x41, ende: 0x42, delta: 1 }]);
                const vorhanden = new Set(werkzeug.leseCmapUntertabelle(buf, 0).codepunkte);
                const fehlend = werkzeug.DEUTSCHE_CODEPUNKTE.filter(c => !vorhanden.has(c));
                // 100 Zeichen im Satz, 'A' und 'B' davon getragen.
                expect(fehlend.length).toBe(werkzeug.DEUTSCHE_CODEPUNKTE.length - 2);
                expect(fehlend).toContain('Ä'.codePointAt(0));
            });

            test('Ein Bereich, der auf Glyphe 0 zeigt, gilt als NICHT getragen', () => {
                // Die dokumentierte Falle: wer nur startCode/endCode liest,
                // meldet 'A' hier als abgedeckt, obwohl die Schrift nur
                // .notdef dafuer hat.
                const buf = baueFormat4([{ start: 0x41, ende: 0x41, delta: -0x41 }]);
                expect(werkzeug.leseCmapUntertabelle(buf, 0).codepunkte).toEqual([]);
            });

            test('zaehleBloecke ordnet synthetische Codepunkte dem richtigen Block zu', () => {
                const bloecke = werkzeug.zaehleBloecke(new Set([0x41, 0x42, 0x410, 0x905]));
                expect(bloecke).toEqual([
                    { name: 'Basic Latin', anzahl: 2 },
                    { name: 'Cyrillic', anzahl: 1 },
                    { name: 'Devanagari', anzahl: 1 }
                ]);
            });
        });
    });

    // ------------------------------------------------------------------
    // Teil 1 — Pfade
    // ------------------------------------------------------------------
    describe('Teil 1 — jede url() aus fonts.css zeigt auf eine vorhandene Datei', () => {
        test(`fonts.css fuehrt genau ${SCHRIFTDATEIEN_SOLL} Einbindungen`, () => {
            expect(QUELLEN.length).toBe(SCHRIFTDATEIEN_SOLL);
        });

        test.each(QUELLEN.map(q => [q.url, q]))('%s ist vorhanden', (url, quelle) => {
            expect(quelle.vorhanden).toBe(true);
        });
    });

    // ------------------------------------------------------------------
    // Teil 2 — Lesbarkeit
    // ------------------------------------------------------------------
    describe('Teil 2 — jede Datei ist ein lesbares woff2 mit cmap', () => {
        test.each(ERGEBNIS.dateien.map(d => [d.name, d]))(
            '%s ist lesbares woff2 mit cmap',
            (name, datei) => {
                expect(datei.fehler).toBeNull();
                expect(datei.numTables).toBeGreaterThan(0);
                expect(datei.formate.length).toBeGreaterThan(0);
                expect(datei.glyphen).toBeGreaterThan(0);
            }
        );
    });

    // ------------------------------------------------------------------
    // Teil 3 — die eigentliche Zusicherung
    //
    // GEKIPPT: vorher war der Ausnahmezweig der Normalfall (10 von 10) und
    // der Erfolgszweig toter Code. Jetzt ist es umgekehrt — alle sieben
    // Dateien laufen durch den Erfolgszweig, der Ausnahmezweig ist bei
    // leerer Liste unerreichbar und bleibt als Falle fuer den Rueckfall.
    // ------------------------------------------------------------------
    describe('Teil 3 — jede Datei traegt den deutschen Satz oder steht auf SCHRIFT_AUSNAHMEN', () => {
        test(`SCHRIFT_AUSNAHMEN fuehrt genau ${AUSNAHMEN_SOLL} Eintraege`, () => {
            expect(Object.keys(SCHRIFT_AUSNAHMEN)).toHaveLength(AUSNAHMEN_SOLL);
        });

        test('Jeder Eintrag in SCHRIFT_AUSNAHMEN nennt einen Grund', () => {
            for (const [name, grund] of Object.entries(SCHRIFT_AUSNAHMEN)) {
                expect(typeof grund).toBe('string');
                expect(grund.trim().length).toBeGreaterThan(10);
                expect(NACH_NAME.has(name)).toBe(true);
            }
        });

        test.each(ERGEBNIS.dateien.map(d => [d.name, d]))(
            '%s traegt den deutschen Satz oder ist freigestellt',
            (name, datei) => {
                if (Object.prototype.hasOwnProperty.call(SCHRIFT_AUSNAHMEN, name)) {
                    // Unerreichbar, solange die Liste leer ist. Bleibt
                    // stehen, damit ein Rueckfall auf kaputte Dateien nicht
                    // zugleich den Ausnahmeweg neu erfinden muss — und
                    // damit ein Eintrag hier nicht still durchlaeuft.
                    expect(datei.traegtDeutsch).toBe(false);
                    expect(datei.fehlendeZeichen.length).toBeGreaterThan(0);
                    return;
                }
                expect(datei.fehlendeZeichen).toEqual([]);
                expect(datei.traegtDeutsch).toBe(true);
            }
        );
    });

    // ------------------------------------------------------------------
    // Teil 4 — Verwesungsprobe
    //
    // GEKIPPT. Vorher: "keine Ausnahme ueberlebt ihre Reparatur" — die
    // Probe bewachte eine volle Liste gegen das Veralten. Jetzt ist die
    // Liste leer, und eine leere Liste ist trivial sauber. Die Probe muss
    // darum in der ANDEREN Richtung Zaehne haben: sie beweist am gesunden
    // Bestand, dass ein Eintrag fuer eine funktionierende Datei abgewiesen
    // wird. Erst damit ist die Freistellung kein Schlupfloch, mit dem sich
    // ein kuenftiger echter Regress stillstellen laesst.
    // ------------------------------------------------------------------
    describe('Teil 4 — Verwesungsprobe: keine Freistellung ohne Befund', () => {
        const eintraege = Object.keys(SCHRIFT_AUSNAHMEN);

        test('Die Ausnahmeliste nennt nur Dateien, die fonts.css auch einbindet', () => {
            for (const name of eintraege) {
                expect(NACH_NAME.has(name)).toBe(true);
            }
        });

        if (eintraege.length > 0) {
            test.each(eintraege)(
                '%s traegt den deutschen Satz wirklich nicht (sonst von der Liste nehmen)',
                name => {
                    const befund = verwesungsBefund(name);
                    if (befund) throw new Error(befund);
                    expect(befund).toBeNull();
                }
            );
        }

        // Die Faelle, die bei LEERER Liste die Arbeit tun.
        test.each(ERGEBNIS.dateien.map(d => d.name))(
            '%s wuerde als Ausnahme-Eintrag heute abgewiesen',
            name => {
                // Haette jemand diese Datei eingetragen, um sie
                // stillzustellen, waere der Eintrag unbegruendet — denn die
                // Datei ist in Ordnung.
                expect(verwesungsBefund(name)).toMatch(/traegt den deutschen Zeichensatz aber/);
            }
        );

        test('Ein Eintrag fuer eine unbekannte Datei wird abgewiesen', () => {
            expect(verwesungsBefund('gibt-es-nicht.woff2')).toMatch(
                /wird von fonts\.css aber nicht eingebunden/
            );
        });
    });

    // ------------------------------------------------------------------
    // Teil 5 — Drift-Waechter sw.js <-> fonts.css
    // ------------------------------------------------------------------
    describe('Teil 5 — sw.js precacht genau die Schriften aus fonts.css', () => {
        test('Beide Listen sind mengengleich', () => {
            const cssMenge = [...new Set(ERGEBNIS.drift.cssNamen)].sort();
            const swMenge = [...new Set(ERGEBNIS.drift.swNamen)].sort();
            // Mengengleich, nicht nur gleich lang: zwei Listen gleicher
            // Laenge koennen voellig verschiedene Dateien fuehren.
            expect(swMenge).toEqual(cssMenge);
            expect(ERGEBNIS.drift.nurInCss).toEqual([]);
            expect(ERGEBNIS.drift.nurInSw).toEqual([]);
            expect(ERGEBNIS.drift.deckungsgleich).toBe(true);
        });

        test(`sw.js fuehrt genau ${SCHRIFTDATEIEN_SOLL} Schriftpfade`, () => {
            // Auf der ROHEN Liste, nicht auf der Menge: ein doppelt
            // eingetragener Pfad faellt damit ebenfalls auf.
            expect(ERGEBNIS.drift.swNamen.length).toBe(SCHRIFTDATEIEN_SOLL);
        });
    });

    // ------------------------------------------------------------------
    // Teil 6 — das Werkzeug fuehrt keine eigene Dateiliste
    // ------------------------------------------------------------------
    describe('Teil 6 — die Dateiliste stammt aus fonts.css, nicht aus einem Literal', () => {
        test('Kein konkreter Schriftdateiname steht als Literal im Werkzeug', () => {
            const fs = require('fs');
            const quelle = fs.readFileSync(
                path.join(werkzeug.REPO_ROOT, 'tools/pruefe-schriftdateien.js'),
                'utf8'
            );
            // Der Waechter darf keinen konkreten Schriftnamen kennen; sonst
            // uebersieht er die achte Datei. Geprueft wird auf die gemessenen
            // Dateinamen, nicht auf die Endung '.woff2' — die braucht das
            // Werkzeug fuer den sw.js-Ausdruck legitim.
            const treffer = ERGEBNIS.drift.cssNamen.filter(name => quelle.includes(name));
            expect(treffer).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 7 — Drift-Waechter Verzeichnis <-> fonts.css
    //
    // DER BLINDE FLECK, DEN DIESER TEIL SCHLIESST (Gegenpruefung Runde 2,
    // B-07). Die Dateiliste dieses Waechters kommt aus fonts.css
    // (`leseSchriftQuellen()`), die Liste des Kopierschritts in build.py
    // aus dem VERZEICHNIS ("Keine Dateiliste", ausdruecklich so gewollt).
    // Beide Enden waren dadurch verschieden, und das war messbar:
    //
    //     $ cp assets/fonts/roboto-400.woff2 assets/fonts/elfte-400.woff2
    //     $ npx jest tests/unit/schriftdateien.test.js   -> 60 passed
    //     $ python -m pytest tests/build/test_build_fonts.py -q -> 6 passed
    //     $ python build.py   -> 11 Schriftdateien nach dist/assets/fonts/
    //     $ ls dist/assets/fonts/elfte-400.woff2   -> vorhanden
    //
    // Eine woff2, die im Verzeichnis liegt und keine @font-face-Regel hat,
    // wurde also von niemandem geprueft und von build.py veroeffentlicht.
    // Das Versprechen im Kopf der E2E-Datei ("ein weiteres Face faellt damit
    // auf, statt uebersehen zu werden") galt nur fuer ein Face in fonts.css,
    // nicht fuer eine Datei auf der Platte. tests/build/test_build_fonts.py
    // vergleicht Verzeichnis gegen Verzeichnis und kann den Unterschied
    // ebenfalls nicht sehen.
    //
    // Heute ist eine solche Datei ohne CSS-Verweis inert — aber sie wird
    // ausgeliefert, und genau diese Luecke behauptet der Waechter zu
    // schliessen. Die Verzeichnisse kommen aus den aufgeloesten url()-Pfaden,
    // nicht aus einem Literal: Teil 6 bleibt gueltig.
    // ------------------------------------------------------------------
    describe('Teil 7 — das Verzeichnis traegt keine Datei, die fonts.css nicht nennt', () => {
        test(`Das Verzeichnis traegt genau ${SCHRIFTDATEIEN_SOLL} woff2`, () => {
            expect(ERGEBNIS.drift.verzeichnisse.length).toBeGreaterThan(0);
            expect(ERGEBNIS.drift.verzeichnisNamen.length).toBe(SCHRIFTDATEIEN_SOLL);
        });

        test('Beide Listen sind mengengleich', () => {
            const cssMenge = [...new Set(ERGEBNIS.drift.cssNamen)].sort();
            const verzeichnisMenge = [...new Set(ERGEBNIS.drift.verzeichnisNamen)].sort();
            expect(verzeichnisMenge).toEqual(cssMenge);
        });

        test('Keine woff2 liegt im Verzeichnis, ohne in fonts.css zu stehen', () => {
            // Diese Dateien wuerde build.py mitkopieren und veroeffentlichen,
            // ohne dass irgendein Waechter sie je gelesen haette.
            expect(ERGEBNIS.drift.nurImVerzeichnis).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 8 — die Gewichtsachse: `font-weight: 100 900` nur auf einer
    // Datei, die das wirklich kann.
    //
    // DER REGRESS, DEN NUR DIESER TEIL SIEHT. Seit b0ada5b liefern Roboto
    // und Inter alle Gewichte aus je EINER variablen Datei; fonts.css
    // schreibt dafuer `font-weight: 100 900`. Diese Angabe ist ein
    // VERSPRECHEN UEBER DEN DATEIINHALT, und niemand prueft es: holt
    // jemand wieder eine Einzelgewicht-Datei, oder faellt Google auf
    // statische Dateien zurueck, dann steht der Bereich auf einer Datei
    // ohne `wght`-Achse. Der Browser meldet keinen Fehler — er taeuscht
    // Fettschrift dann nur noch synthetisch nach (verzerrte Glyphen statt
    // echter Schnitte). Kein 404, kein Konsolenfehler, keine fehlende
    // Glyphe: genau die Fehlerklasse, fuer die diese Ratsche gebaut ist.
    //
    // Geprueft wird das PAAR aus CSS-Angabe und Dateifaehigkeit, nicht nur
    // die Datei: so faellt auch ein NEUER Face mit Bereich auf einer
    // statischen Datei auf. Die Faces kommen aus fonts.css, nicht aus
    // einem Literal — Teil 6 bleibt gueltig.
    // ------------------------------------------------------------------
    describe('Teil 8 — jeder Gewichtsbereich in fonts.css steht auf einer variablen Datei', () => {
        test.each(Object.keys(GEMESSENE_SCHRIFTEN))('%s: fvar-Achsen wie gemessen', name => {
            const soll = GEMESSENE_SCHRIFTEN[name];
            const datei = NACH_NAME.get(name);
            expect(datei).toBeDefined();
            expect(datei.fehler).toBeNull();

            // Eine fvar-Tabelle, die vorhanden aber unlesbar ist, darf NICHT
            // als "statisch" durchgehen — das waere von einer echten
            // statischen Schrift nicht zu unterscheiden.
            expect(datei.achsenFehler).toBeNull();

            if (soll.fvar === null) {
                expect(datei.hatFvar).toBe(false);
                expect(datei.achsen).toEqual([]);
                return;
            }

            expect(datei.hatFvar).toBe(true);
            const gemessen = {};
            for (const a of datei.achsen) gemessen[a.tag] = [a.min, a.standard, a.max];
            expect(gemessen).toEqual(soll.fvar);
        });

        test('Genau 2 der 7 Dateien tragen eine fvar-Tabelle', () => {
            // Gegenprobe gegen Leerlauf: haengt der fvar-Leser durch und
            // meldet ueberall "keine Achse", faellt es hier auf, nicht erst
            // beim naechsten Schriftwechsel.
            const variabel = ERGEBNIS.dateien.filter(d => d.hatFvar).map(d => d.name);
            expect(variabel.sort()).toEqual(['inter-variable.woff2', 'roboto-variable.woff2']);
        });

        test('Genau 2 @font-face-Bloecke fuehren einen Gewichtsbereich', () => {
            const faces = werkzeug.leseSchriftFaces();
            expect(faces).toHaveLength(SCHRIFTDATEIEN_SOLL);
            const bereiche = faces.filter(f => f.istBereich);
            expect(bereiche.map(f => f.familie).sort()).toEqual(['Inter', 'Roboto']);
            // Und die uebrigen fuehren ein Einzelgewicht, keines ohne Angabe:
            // ein `font-weight`, das der Leser nicht versteht, wuerde sonst
            // still als "kein Bereich" gelten und die Pruefung umgehen.
            for (const face of faces) {
                expect(Number.isFinite(face.gewichtVon)).toBe(true);
                expect(Number.isFinite(face.gewichtBis)).toBe(true);
                expect(face.gewichtBis).toBeGreaterThanOrEqual(face.gewichtVon);
            }
        });

        test('Jeder Face mit Gewichtsbereich zeigt auf eine Datei mit passender wght-Achse', () => {
            const faces = werkzeug.leseSchriftFaces();
            for (const face of faces) {
                if (!face.istBereich) continue;
                for (const name of face.dateinamen) {
                    const datei = NACH_NAME.get(name);
                    expect(datei).toBeDefined();
                    const wght = (datei.achsen || []).find(a => a.tag === 'wght');
                    if (!wght) {
                        throw new Error(
                            `${face.familie} erklaert in fonts.css den Gewichtsbereich ` +
                                `${face.gewichtVon}..${face.gewichtBis}, aber ${name} hat keine ` +
                                `wght-Achse. Der Browser taeuscht Fettschrift dann nur nach. ` +
                                `Entweder eine variable Datei holen oder den Bereich in ` +
                                `Einzelgewichte aufloesen.`
                        );
                    }
                    // Die Achse muss den erklaerten Bereich DECKEN, nicht nur
                    // existieren: eine Achse 400..700 unter der Angabe
                    // `100 900` ist derselbe Fehler, nur kleiner.
                    expect(wght.min).toBeLessThanOrEqual(face.gewichtVon);
                    expect(wght.max).toBeGreaterThanOrEqual(face.gewichtBis);
                }
            }
        });

        // ------------------------------------------------------------------
        // DIE GEGENRICHTUNG UND DER WERT — was die Faelle darueber NICHT
        // sehen, und was die E2E-Haelfte allein nicht tragen soll.
        //
        // Der Fall darueber prueft 'Bereich erklaert -> Achse deckt ihn', und
        // `Genau 2 @font-face-Bloecke fuehren einen Gewichtsbereich` prueft
        // die ANZAHL der Bereiche gegen eine namentliche Liste. Zwei Luecken
        // bleiben, beide nachgestellt und nicht vermutet (Gegenpruefung,
        // Befund 1):
        //
        //   VERSCHMAELERN. `font-weight: 100 900` -> `300 500` auf Roboto:
        //       $ npx jest tests/unit/schriftdateien.test.js  -> 73 passed / 73
        //       $ node tools/pruefe-schriftdateien.js --check -> exit 0
        //       $ npx playwright test ...schriftdateien.spec.js
        //                                                     -> 1 failed / 15
        //     Diese Datei und das Werkzeug sehen NICHTS: der Bereich bleibt
        //     ein Bereich, und die Achse 100..900 deckt 300..500 muehelos.
        //     Im Browser klemmen aber sechs der neun Gewichte auf die
        //     Bereichsgrenzen — gemessen Roboto
        //     [1104.27 x3, 1123.28, 1135.09 x5], drei verschiedene Breiten
        //     statt neun. Die ANZAHL der Bereiche ist also nicht genug, der
        //     WERT muss festgenagelt werden.
        //
        //   ZUSAMMENZIEHEN. `100 900` -> `400`: faengt diese Datei heute
        //     schon (der Bereich verschwindet aus der namentlichen Liste),
        //     aber nur deshalb, weil die Liste ein Literal ist. Als
        //     STRUKTURAUSSAGE — 'genau die Dateien mit Achse stehen unter
        //     einem Bereich' — gilt sie unabhaengig von der Liste und bleibt
        //     richtig, wenn Google die Bauart der naechsten Familie wechselt.
        //
        // ARBEITSTEILUNG, ausdruecklich festgehalten: dasselbe Paar prueft
        // `tests/e2e/features/schriftdateien.spec.js` Teil 6 am laufenden
        // Browser (dort bei `hatWghtAchse()` begruendet). Dass sich die zwei
        // Haelften ergaenzen, stand bis hierher in keiner der beiden Dateien
        // und war damit Zufall statt Zusicherung.
        // ------------------------------------------------------------------
        test('Genau die Dateien mit wght-Achse stehen unter einem Gewichtsbereich', () => {
            const faces = werkzeug.leseSchriftFaces();
            expect(faces).toHaveLength(SCHRIFTDATEIEN_SOLL);

            /** Achse mit echter Spanne — `min === max` gibt kein Zwischengewicht her. */
            const achse = name => {
                const a = (NACH_NAME.get(name)?.achsen || []).find(x => x.tag === 'wght');
                return a && a.max > a.min ? a : null;
            };

            const drift = [];
            let mitAchse = 0;
            let ohneAchse = 0;
            for (const face of faces) {
                for (const name of face.dateinamen) {
                    expect(NACH_NAME.get(name)).toBeDefined();
                    const a = achse(name);
                    if (a) mitAchse++;
                    else ohneAchse++;
                    if (Boolean(a) === face.istBereich) continue;
                    drift.push(
                        a
                            ? `${face.familie}/${name}: Achse wght ${a.min}..${a.max}, ` +
                                  `fonts.css erklaert aber font-weight: ${face.gewichtRoh} ` +
                                  `(Einzelgewicht). Chromium schaltet die Achse dann ab.`
                            : `${face.familie}/${name}: fonts.css erklaert den Bereich ` +
                                  `${face.gewichtVon}..${face.gewichtBis}, die Datei hat ` +
                                  `keine wght-Achse mit Spanne.`
                    );
                }
            }
            // Gegenprobe gegen Leerlauf: beide Seiten des Paars sind belegt.
            // Haengt der fvar-Leser durch, waere `mitAchse` 0 und der
            // Vergleich oben fuer die statischen Faces trivial erfuellt.
            expect(mitAchse).toBeGreaterThan(0);
            expect(ohneAchse).toBeGreaterThan(0);
            expect(drift).toEqual([]);
        });

        test('Ein erklaerter Gewichtsbereich schoepft die wght-Achse voll aus', () => {
            const faces = werkzeug.leseSchriftFaces();
            const bereiche = faces.filter(f => f.istBereich);
            // Gegenprobe gegen Leerlauf: ohne einen einzigen Bereich prueft
            // die Schleife unten nichts.
            expect(bereiche.length).toBeGreaterThan(0);

            const zuEng = [];
            for (const face of bereiche) {
                for (const name of face.dateinamen) {
                    const a = (NACH_NAME.get(name)?.achsen || []).find(x => x.tag === 'wght');
                    expect(a).toBeDefined();
                    if (a.min === face.gewichtVon && a.max === face.gewichtBis) continue;
                    zuEng.push(
                        `${face.familie}/${name}: fonts.css erklaert ` +
                            `${face.gewichtVon}..${face.gewichtBis}, die Achse kann ` +
                            `${a.min}..${a.max}. Was ausserhalb der Erklaerung liegt, ` +
                            `klemmt der Browser auf die Bereichsgrenze — die Datei ist ` +
                            `bezahlt und die Schnitte sind nicht nutzbar.`
                    );
                }
            }
            expect(zuEng).toEqual([]);
        });

        test('Das Werkzeug urteilt selbst gleich (--check sieht dasselbe)', () => {
            // Zwei Wege, dieselbe Aussage — wie bei der Fehlliste in Teil 0.
            // Der Fall oben rechnet die Paarung im Test nach; `pruefeAlle()`
            // fuehrt sie fuer `--check` selbst. Laufen die beiden
            // auseinander, prueft die CI etwas anderes als diese Ratsche.
            expect(ERGEBNIS.achsenVerstoesse).toEqual([]);
        });

        test('leseGewichtsbereich trennt Bereich, Einzelgewicht und Unlesbares', () => {
            // Gegenprobe am Leser selbst: der gesunde Bestand enthaelt kein
            // Gegenbeispiel, an dem ein NEIN zu sehen waere.
            expect(werkzeug.leseGewichtsbereich('100 900')).toEqual([100, 900]);
            expect(werkzeug.leseGewichtsbereich('400')).toEqual([400, 400]);
            expect(werkzeug.leseGewichtsbereich('normal')).toEqual([400, 400]);
            expect(werkzeug.leseGewichtsbereich('bold')).toEqual([700, 700]);
            // Fehlende Angabe ist die CSS-Vorgabe `normal`, kein Fehler.
            expect(werkzeug.leseGewichtsbereich(null)).toEqual([400, 400]);
            // Unlesbares ergibt NaN und nicht 400 — sonst wuerde es still
            // als "kein Bereich" gelten und die Achsenpruefung umgehen.
            expect(werkzeug.leseGewichtsbereich('bolder')[0]).toBeNaN();
        });

        test('leseFvar laesst eine unlesbare Tabelle nicht als statisch durchgehen', () => {
            // Eine fvar-Tabelle, die eine Achse ankuendigt, aber abgeschnitten
            // ist: muss WERFEN, nicht eine leere Achsenliste liefern — die
            // waere von einer echten statischen Schrift nicht zu
            // unterscheiden. Dasselbe Argument wie bei unbekannten
            // cmap-Formaten.
            const buf = Buffer.alloc(FVAR_KOPF_LAENGE);
            buf.writeUInt16BE(1, 0); // major
            buf.writeUInt16BE(0, 2); // minor
            buf.writeUInt16BE(FVAR_KOPF_LAENGE, 4); // achsenOffset
            buf.writeUInt16BE(2, 6); // reserved
            buf.writeUInt16BE(1, 8); // achsenZahl — eine Achse angekuendigt
            buf.writeUInt16BE(20, 10); // achsenGroesse
            expect(() => werkzeug.leseFvar(buf, 0, buf.length)).toThrow(
                /reicht ueber das Tabellenende/
            );
        });
    });
});
