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
 * Waechter mit eigener Liste uebersieht die elfte Datei.
 */

const path = require('path');
const werkzeug = require('../../tools/pruefe-schriftdateien.js');

// ----------------------------------------------------------------------
// SCHRIFT_AUSNAHMEN — Dateien, die den deutschen Zeichensatz NICHT tragen
// und deren Zustand als bekannt gilt.
//
// DIESE LISTE IST BEWUSST VOLL, NICHT ABWESEND — nach dem Vorbild von
// `EXEC_COMMAND_ALLOWLIST` in `tests/e2e/features/editor-floating.spec.js`,
// die bewusst LEER und nicht abwesend ist. Hier ist es umgekehrt: alle zehn
// gebuendelten Dateien tragen seit ihrer Geburt (Commit 1c3245b,
// `feat(02-02): PWA-Grundlage`) das falsche Subset. Es gab nie eine richtige
// Fassung. Die Liste beschreibt also keinen Sonderfall, sondern den
// vollstaendigen Ist-Zustand.
//
// BEIM AUSTAUSCH DER DATEIEN MUSS DIESE LISTE LEER WERDEN. Jede Datei, die
// hier steht und den deutschen Satz in Wahrheit traegt, stellt Teil 4
// (Verwesungsprobe) rot — ohne diese Probe wuerde die Liste nach der
// Reparatur zur Luege und der Waechter waere wertlos.
//
// AUSNAHMEN_SOLL nagelt die Laenge auf genau 10. Eine elfte kaputte Datei
// faellt damit sofort auf, statt sich in einer offenen Liste zu verstecken.
// ----------------------------------------------------------------------
const SCHRIFT_AUSNAHMEN = {};

const AUSNAHMEN_SOLL = 10;

// Mindestzahl geprueefter Dateien. Gegen `>= 0`: ein leeres Parse-Ergebnis
// (fonts.css-Regex kaputt, Verzeichnis verschoben) wuerde sonst gruen
// durchlaufen, weil "keine Datei verletzt die Regel" trivial wahr ist.
const MINDEST_DATEIEN = 10;

// ----------------------------------------------------------------------
// GEMESSENE_BLOECKE — Gegenprobe gegen Leerlauf.
//
// Der Zweck ist NICHT, die Subsets zu bewerten, sondern zu beweisen, dass
// der Parser echte Daten liest. Bei einem kaputten Parser (Brotli-Block an
// der falschen Stelle, Tabellenlaengen falsch addiert, cmap-Offsets
// verschoben) werden aus diesen Zahlen Nullen oder der Block verschwindet —
// und der Test ist rot. Eine Ratsche, die auch bei kaputtem Messwerkzeug
// gruen bleibt, ist wertlos.
//
// Zahlen gemessen am Stand 4e0d810 mit `node tools/pruefe-schriftdateien.js`.
// ----------------------------------------------------------------------
const GEMESSENE_BLOECKE = {
    'roboto-400.woff2': { block: 'Cyrillic', anzahl: 155, glyphen: 180 },
    'roboto-700.woff2': { block: 'Cyrillic', anzahl: 155, glyphen: 180 },
    'inter-400.woff2': { block: 'Cyrillic', anzahl: 148, glyphen: 157 },
    'inter-500.woff2': { block: 'Cyrillic', anzahl: 148, glyphen: 157 },
    'inter-600.woff2': { block: 'Cyrillic', anzahl: 148, glyphen: 157 },
    'poppins-400.woff2': { block: 'Devanagari', anzahl: 94, glyphen: 105 },
    'poppins-500.woff2': { block: 'Devanagari', anzahl: 94, glyphen: 105 },
    'poppins-600.woff2': { block: 'Devanagari', anzahl: 94, glyphen: 105 },
    'source-sans-pro-400.woff2': { block: 'Cyrillic', anzahl: 56, glyphen: 61 },
    'source-sans-pro-600.woff2': { block: 'Cyrillic', anzahl: 56, glyphen: 61 }
};

// Einmal messen, alle Teile lesen dieselbe Messung.
const ERGEBNIS = werkzeug.pruefeAlle();
const QUELLEN = werkzeug.leseSchriftQuellen();
const NACH_NAME = new Map(ERGEBNIS.dateien.map(d => [d.name, d]));

describe('SCHR — Schriftdateien tragen den deutschen Zeichensatz', () => {
    // ------------------------------------------------------------------
    // Waechter des Waechters: ohne diese zwei Faelle koennte alles
    // Folgende leer durchlaufen.
    // ------------------------------------------------------------------
    describe('Waechter des Waechters', () => {
        test(`Mindestens ${MINDEST_DATEIEN} Dateien werden ueberhaupt geprueft`, () => {
            expect(ERGEBNIS.geprueft).toBeGreaterThanOrEqual(MINDEST_DATEIEN);
        });

        test('Der deutsche Zeichensatz ist nicht leer und enthaelt Alphabet, Ziffern, Umlaute', () => {
            expect(werkzeug.DEUTSCHE_CODEPUNKTE.length).toBeGreaterThanOrEqual(90);
            for (const zeichen of ['A', 'Z', 'a', 'z', '0', '9', 'Ä', 'ö', 'ß']) {
                expect(werkzeug.DEUTSCHE_CODEPUNKTE).toContain(zeichen.codePointAt(0));
            }
        });

        test.each(Object.keys(GEMESSENE_BLOECKE))(
            'Gegenprobe gegen Leerlauf: %s liest echte cmap-Daten',
            name => {
                const soll = GEMESSENE_BLOECKE[name];
                const datei = NACH_NAME.get(name);
                expect(datei).toBeDefined();
                expect(datei.fehler).toBeNull();

                // Die Tabellenlaengen muessen den entpackten Strom genau
                // ausfuellen — belegt die Annahme "Tabellen liegen ohne
                // Polsterung in Verzeichnisreihenfolge".
                expect(datei.laengenStimmen).toBe(true);

                expect(datei.glyphen).toBe(soll.glyphen);
                const block = datei.bloecke.find(b => b.name === soll.block);
                expect(block).toBeDefined();
                expect(block.anzahl).toBe(soll.anzahl);
            }
        );

        test('Keine cmap-Untertabelle blieb wegen unbekannten Formats ungelesen', () => {
            for (const datei of ERGEBNIS.dateien) {
                if (datei.fehler) continue;
                expect(datei.nichtUnterstuetzteFormate).toEqual([]);
                expect(datei.untertabellen).toBeGreaterThan(0);
            }
        });
    });

    // ------------------------------------------------------------------
    // Teil 1 — Pfade
    // ------------------------------------------------------------------
    describe('Teil 1 — jede url() aus fonts.css zeigt auf eine vorhandene Datei', () => {
        test(`fonts.css fuehrt ${MINDEST_DATEIEN} oder mehr Einbindungen`, () => {
            expect(QUELLEN.length).toBeGreaterThanOrEqual(MINDEST_DATEIEN);
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
                    return;
                }
                expect(datei.fehlendeZeichen).toEqual([]);
                expect(datei.traegtDeutsch).toBe(true);
            }
        );
    });

    // ------------------------------------------------------------------
    // Teil 4 — Verwesungsprobe
    // ------------------------------------------------------------------
    describe('Teil 4 — Verwesungsprobe: keine Ausnahme ueberlebt ihre Reparatur', () => {
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
                    const datei = NACH_NAME.get(name);
                    expect(datei).toBeDefined();
                    if (datei.traegtDeutsch) {
                        throw new Error(
                            `${name} steht auf SCHRIFT_AUSNAHMEN, traegt den deutschen ` +
                                `Zeichensatz aber vollstaendig. Die Datei wurde repariert — ` +
                                `nimm sie aus SCHRIFT_AUSNAHMEN heraus und senke ` +
                                `AUSNAHMEN_SOLL auf ${eintraege.length - 1}.`
                        );
                    }
                    expect(datei.traegtDeutsch).toBe(false);
                }
            );
        }
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

        test('sw.js fuehrt ueberhaupt Schriftpfade (Gegenprobe gegen Leerlauf)', () => {
            expect(ERGEBNIS.drift.swNamen.length).toBeGreaterThanOrEqual(MINDEST_DATEIEN);
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
            // uebersieht er die elfte Datei. Geprueft wird auf die gemessenen
            // Dateinamen, nicht auf die Endung '.woff2' — die braucht das
            // Werkzeug fuer den sw.js-Ausdruck legitim.
            const treffer = ERGEBNIS.drift.cssNamen.filter(name => quelle.includes(name));
            expect(treffer).toEqual([]);
        });
    });
});
