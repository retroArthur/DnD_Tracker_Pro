// @ts-check
/**
 * E2E — Die gebuendelten Web-Schriften tragen nichts bei (SCHR, Einheit 2).
 *
 * WAS EINHEIT 1 SCHON BEWIESEN HAT, und warum das nicht genuegt.
 * `tests/unit/schriftdateien.test.js` liest die zehn woff2 in `assets/fonts/`
 * auf Dateiebene (woff2-Kopf -> Tabellenverzeichnis -> Brotli -> cmap) und
 * zeigt: keine einzige traegt das lateinische Alphabet. Das ist eine Aussage
 * ueber DATEIKOEPFE. Diese Probe hier macht die Aussage ueber den
 * BROWSER — sie misst, was gerendert wird, nicht was in der cmap steht. Beide
 * Waechter muessen reden, weil ein Dateikopf-Befund nicht zwingend eine
 * Folge hat: ein Browser koennte den fehlenden Glyphen aus einer anderen
 * Quelle holen, eine `unicode-range` koennte die Datei gar nicht erst
 * anfordern, oder die Datei koennte ueberhaupt nicht geladen werden. Keine
 * dieser Erklaerungen trifft zu — aber das ist eine Messung, keine Annahme.
 *
 * DIE POINTE, in zwei getrennten Teilen belegt:
 *   Teil 1-3  Die vier Familien sind von ihrem Rueckfall NICHT zu
 *             unterscheiden. Sie sind sogar von einer Familie, die es
 *             ueberhaupt nicht gibt, nicht zu unterscheiden.
 *   Teil 4    Und trotzdem laden sie. Zehn Dateien, zehn Antworten mit
 *             Status 200, 195.276 Byte, alle zehn Faces auf `loaded`.
 * Es ist also kein 404 und kein Ladefehler. Die Dateien sind in Ordnung und
 * nutzlos. Vier der sieben Eintraege im Schriftmenue der Editoren
 * (`EDITOR_FONTS`, core/constants.js) sind damit seit dem ersten Tag
 * Dekoration: wer "Inter" waehlt, bekommt Arial.
 *
 * WIE GEMESSEN WIRD (Breitenvergleich, plattformunabhaengig). Zwei Spannen,
 * identisch in Groesse, Gewicht, Laufweite und Umbruchverhalten:
 *
 *     A   font-family: 'Inter', monospace
 *     B   font-family: monospace
 *
 * Traegt Inter die Buchstaben des Probetexts, rendert A in Inter und ist
 * breiter oder schmaler als B. Traegt es sie nicht, faellt A zeichenweise auf
 * monospace zurueck und beide sind GENAU gleich breit. `monospace` als
 * Rueckfall und nicht der echte `Arial`-Rueckfall der App: Arial ist auf
 * `ubuntu-latest` nicht installiert, `monospace` auf jedem System. In dieser
 * Sitzung haben benannte Systemschriften schon zwoelf CI-Fehlschlaege
 * verursacht (siehe den Kopf von `breite-schrift.spec.js`); eine Probe, die
 * auf Arial oder Georgia baut, misst die Schriftausstattung des Laeufers,
 * nicht diesen Fehler. Teil 2 prueft den echten Stack zusaetzlich — dort
 * haelt die Aussage trotzdem plattformunabhaengig, weil BEIDE Seiten
 * denselben Rueckfall aufloesen (Begruendung dort).
 *
 * DREI MESSFALLEN, alle nachgemessen, alle vermieden:
 *
 *   1. DER PROBETEXT DARF KEIN ZEICHEN ENTHALTEN, DAS DIE SCHRIFT TRAEGT.
 *      Die zehn Dateien sind nicht voellig leer: ueber alle zehn hinweg
 *      tragen sie genau vier Zeichen des deutschen Satzes — ' ', 'A', 'Ä',
 *      'B' (gemessen mit dem Werkzeug aus Einheit 1). Das LEERZEICHEN ist die
 *      gemeinste Falle: fuer `'Inter', monospace` kommt der Vorschub des
 *      Leerzeichens dann aus Inter (schmal) und der des Rests aus monospace
 *      (0.6em). Nachgemessen bei 40px:
 *          'Handgemenge 42 Zaehmkraft'   A=528.33  B=549.81   -> ungleich
 *          'Handgemenge42Zaehmkraft'     A=505.83  B=505.83   -> gleich
 *      Mit Leerzeichen haette diese Probe also "Inter funktioniert" gemeldet.
 *      Der Probetext unten enthaelt kein Leerzeichen, kein 'A', kein 'Ä' und
 *      kein 'B' — und Teil 0 nagelt genau das fest, gegen das Werkzeug aus
 *      Einheit 1 gemessen, statt es zu behaupten. Der Waechter schneidet
 *      gegen die VOLLE cmap (gemessen 289 Codepunkte), nicht gegen den
 *      deutschen Satz: 285 der 289 stehen ausserhalb, und U+00A0 — in allen
 *      zehn Dateien, optisch ein Leerzeichen — ist genau die Falle, fuer die
 *      dieser Punkt geschrieben wurde.
 *
 *   2. DIE FACES MUESSEN GELADEN SEIN, BEVOR GEMESSEN WIRD. fonts.css setzt
 *      `font-display: swap`. Waehrend der Tauschfrist rendert der Browser im
 *      Rueckfall — A und B waeren gleich breit, und die Probe waere gruen,
 *      ohne irgendetwas ueber die Schrift zu sagen. Darum wird jedes Face
 *      ueber `document.fonts.load()` erzwungen, auf `document.fonts.ready`
 *      gewartet, und Teil 0 prueft, dass alle zehn auf `loaded` stehen.
 *      Dass dieser Zustand sich wirklich verfehlen laesst, ist gemessen: aus
 *      einem Verzeichnis ohne `assets/fonts/` stehen alle zehn auf `error`
 *      (siehe die file://-Messung im Bericht).
 *
 *   3. CHROMIUM LAEDT WEB-SCHRIFTEN FAUL. Ohne `unicode-range` und ohne
 *      Nutzung fordert der Browser KEINE der zehn Dateien an — beim blanken
 *      Laden der App sind es nachgemessen NULL Anfragen, nicht zehn. Die App
 *      selbst benutzt keine der vier Familien (die drei Tokens
 *      `--font-abadi`/`--font-roboto`/`--font-arial` in core.css:392-395
 *      haben je 0 Verweise, `--font-ui` ist 'Segoe UI'). Die 195.276 Byte
 *      fliessen erst, wenn jemand im Editor eine der vier Schriften waehlt.
 *      Teil 4 belegt beide Haelften getrennt.
 *
 * KEINE EIGENEN LISTEN. Die Faces kommen aus `assets/styles/fonts.css`, die
 * Menuefamilien aus `window.EDITOR_FONTS` der laufenden App. Ein elftes Face
 * oder ein fuenfter Menueeintrag mit gebuendelter Schrift faellt damit auf,
 * statt uebersehen zu werden — dieselbe Regel wie in Einheit 1 ("ein
 * Waechter, der seine eigene Liste mitbringt, uebersieht die elfte Datei").
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedPopulatedSession, waitForAppReady } from '../helpers/test-utils.js';
// Das Messwerkzeug aus Einheit 1. Es liest die cmap der zehn Dateien und ist
// hier die Quelle fuer EINE Frage: welche Zeichen tragen die Dateien
// ueberhaupt? Daraus folgt, welche Zeichen im Probetext nicht vorkommen
// duerfen (Messfalle 1). `tools/package.json` haelt das Werkzeug auf
// CommonJS; der ESM-Import liefert die benannten Exporte ueber die Interop.
import * as schriftWerkzeug from '../../../tools/pruefe-schriftdateien.js';

const REPO_ROOT = process.cwd();
const FONTS_CSS = path.join(REPO_ROOT, 'assets/styles/fonts.css');

// ----------------------------------------------------------------------
// SCHRIFT_FAMILIEN_AUSNAHMEN — Menuefamilien, die zu ihrem Rueckfall NICHTS
// beitragen und deren Zustand als bekannt gilt.
//
// BEWUSST VOLL, NICHT ABWESEND — Gegenstueck zu `EXEC_COMMAND_ALLOWLIST` in
// `editor-floating.spec.js`, die bewusst LEER und nicht abwesend ist, und
// baugleich zu `SCHRIFT_AUSNAHMEN` in `tests/unit/schriftdateien.test.js`:
// gezaehlte Laenge, Grund je Eintrag, Verwesungsprobe. Beide Waechter sollen
// eine Sprache sprechen.
//
// BEIM AUSTAUSCH DER DATEIEN MUSS DIESE LISTE LEER WERDEN. Jede Familie, die
// hier steht und in Wahrheit beitraegt, stellt Teil 5 (Verwesungsprobe) rot.
// Ohne diese Probe wuerde die Liste nach der Reparatur zur Luege und der
// Waechter waere wertlos.
//
// WARUM ALLE VIER DRINSTEHEN. Es gab nie eine richtige Fassung: `git log --
// assets/fonts/` zeigt genau einen Commit (1c3245b, `feat(02-02):
// PWA-Grundlage`). Die Liste beschreibt also keinen Sonderfall, sondern den
// vollstaendigen Ist-Zustand des Schriftmenues — vier von sieben Eintraegen.
//
// DIE GRUENDE SIND GEMESSEN, NICHT GESCHAETZT. Breite in Pixel = diese Probe
// bei 40px auf "Handgemenge42Zaehmkraft"; Glyphen und Block = das Werkzeug
// aus Einheit 1 (`node tools/pruefe-schriftdateien.js`). Beide Zahlen stehen
// bewusst in jedem Eintrag: die eine ist die Folge, die andere die Ursache.
// ----------------------------------------------------------------------
const SCHRIFT_FAMILIEN_AUSNAHMEN = {
    Roboto:
        'kyrillisches Subset (155 von 180 Glyphen), kein lateinisches A; 400 und 700 ' +
        'rendern auf 505.828125px, exakt der monospace-Rueckfall',
    Inter:
        'kyrillisches Subset (148 von 157 Glyphen), nur A und Ä aus Latin; 400, 500 und ' +
        '600 rendern auf 505.828125px, exakt der monospace-Rueckfall',
    Poppins:
        'Devanagari-Subset (94 von 105 Glyphen); 400, 500 und 600 rendern auf ' +
        '505.828125px, exakt der monospace-Rueckfall',
    'Source Sans Pro':
        'kyrillisches Subset (56 von 61 Glyphen), nur A und B aus Latin; 400 und 600 ' +
        'rendern auf 505.828125px, exakt der monospace-Rueckfall'
};

// Festgenagelt auf genau 4. Eine fuenfte nutzlose Familie faellt damit sofort
// auf, statt sich in einer offenen Liste zu verstecken — und eine reparierte
// Familie zwingt zum Senken, weil Teil 5 sie sonst rot stellt.
const AUSNAHMEN_SOLL = 4;

// Untergrenzen gegen Leerlauf. Gegen `>= 0`: ein leeres Parse-Ergebnis
// (fonts.css-Regex kaputt, EDITOR_FONTS nicht exportiert) wuerde sonst gruen
// durchlaufen, weil "keine Familie verletzt die Regel" trivial wahr ist.
const MINDEST_FACES = 10;
const MINDEST_MENUEEINTRAEGE = 7;
// Untergrenze fuer die Zahl der Familien aus fonts.css (gemessen 4). Teil 1
// und Teil 3 fuehren ihre Untergrenze selbst: die von Teil 0 liegt in einem
// FREMDEN describe, und ein gezielter `--grep`-Lauf traegt sie nicht mit.
const MINDEST_CSS_FAMILIEN = 4;

// Untergrenze fuer die Vereinigung ALLER Codepunkte, die die zehn Dateien
// tragen — gemessen 289 (`leseCmap()` je Datei, Mengenvereinigung). Der
// Probetext-Waechter unten schneidet gegen diese Menge und nicht mehr gegen
// die 100 Zeichen des deutschen Satzes: 285 der 289 stehen AUSSERHALB des
// deutschen Satzes, U+00A0 unter ihnen, und U+00A0 tragen alle zehn. Es sieht
// aus wie ein Leerzeichen und ist damit genau die "gemeinste Falle" aus
// Messfalle 1 — die alte Fassung des Waechters konnte es nicht sehen
// (gemessen: mit U+00A0 im Probetext blieb er gruen, waehrend Teil 1, Teil 3
// und Teil 5 rot wurden und zum ABBAU der Ausnahmeliste aufforderten).
const MINDEST_GETRAGENE_CODEPUNKTE = 200;

// Genau so viele Menueeintraege nennen zuerst eine Familie, die fonts.css
// einbindet. Festgenagelt, damit ein fuenfter gebuendelter Eintrag auffaellt.
const GEBUENDELTE_MENUEEINTRAEGE_SOLL = 4;

// Summe der zehn Dateigroessen, mit `ls -l` und ueber die Netzwerkantworten
// gegengemessen. Nicht "gut 200 KB" — die genaue Zahl.
const BYTE_SUMME_SOLL = 195276;

// ----------------------------------------------------------------------
// Der Probetext. Deutsche Buchstaben und Ziffern, und bewusst OHNE die vier
// Zeichen, die irgendeine der zehn Dateien traegt (' ', 'A', 'Ä', 'B' —
// siehe Messfalle 1 im Kopf). Teil 0 prueft das gegen das Werkzeug aus
// Einheit 1, statt es zu behaupten.
// ----------------------------------------------------------------------
const PROBETEXT = 'Handgemenge42Zaehmkraft';

// Messgroesse. 40px statt 16px: der Breitenunterschied zwischen zwei
// Schriften waechst linear mit der Groesse, die Rundung auf Geraetepixel
// nicht — bei 40px ist das Verhaeltnis von Signal zu Rundung rund 2.5-fach
// besser.
const MESSGROESSE = '40px';

// Eine Familie, die es garantiert nicht gibt. Sie ist der haerteste
// Vergleichspunkt von Teil 2: eine gebuendelte Schrift, die von DIESER nicht
// zu unterscheiden ist, traegt nachweislich nichts bei.
const FAMILIE_OHNE_DATEI = 'Gibtesnichtxyzqjk';

// ----------------------------------------------------------------------
// DER MESSKOERPER — eine Quelle, nicht fuenf.
//
// `mitStack()` ist die EINZIGE Stelle, an der eine gebuendelte Familie in
// einen Messkoerper geschrieben wird. Vorher stand derselbe Ausdruck
// viermal im Text, und das war die Luecke: kuerzte man ihn auf den reinen
// Rueckfall, nannte die Probe die Familie an keiner Stelle mehr und
// verglich `monospace` gegen `monospace` — alle 13 Faelle blieben gruen,
// weil die VOLLE Ausnahmeliste ueberall GLEICHHEIT fordert und keine
// absolute Breite festgenagelt ist. Jede Verfaelschung in Richtung
// Rueckfall machte die lebenden Zusicherungen also wahrer, nie falscher.
// Die Gegenprobe dagegen steht unten: KONTROLLE.
// ----------------------------------------------------------------------
const RUECKFALL = 'monospace';

/** Der Messkoerper, der die Familie nennt. Einzige Quelle. */
function mitStack(familie) {
    return `'${familie}', ${RUECKFALL}`;
}

// ----------------------------------------------------------------------
// KONTROLLE — die Gegenrichtung, ohne die "traegt nichts bei" nicht von
// "wir haben die Familie nie gefragt" zu unterscheiden ist.
//
// Jede der zehn Dateien traegt mindestens EIN Zeichen (gemessen: U+0020 in
// allen zehn, dazu 'A'/'Ä' in Inter und 'A'/'B' in Source Sans Pro). Mit
// diesem Zeichen MUSS derselbe Messkoerper, der oben Gleichheit zeigt, einen
// Unterschied zeigen. Das ist die Kontrolle in der Gegenrichtung:
//   - zeigt sie keinen Unterschied, misst die Probe die Familie nicht, und
//     die Gleichheit beim Probetext sagt nichts ueber die Schrift;
//   - zeigt sie einen, ist die Gleichheit beim Probetext ein echter Befund.
// Die Zeichen kommen aus der cmap (Werkzeug aus Einheit 1), nicht aus einem
// Literal hier: nach einem Austausch der Dateien waehlt die Kontrolle von
// selbst ein anderes Zeichen.
//
// Plattformunabhaengig, weil beide Seiten dieselbe GEBUENDELTE Datei gegen
// denselben generischen Rueckfall stellen — keine benannte Systemschrift.
// ----------------------------------------------------------------------
const KONTROLL_WIEDERHOLUNGEN = 8;
const KONTROLL_ZEICHEN_MAX = 4;
// Ab welchem Abstand in Pixel die Kontrolle als "unterscheidbar" gilt. 1px
// bei 40px Messgroesse — dieselbe Schwelle wie die mono/serif-Kontrolle in
// Teil 0.
const KONTROLL_MINDESTABSTAND = 1;

const WERKZEUG_ERGEBNIS = schriftWerkzeug.pruefeAlle();
const CODEPUNKTE_JE_DATEI = new Map(
    WERKZEUG_ERGEBNIS.dateien.map(d => [d.name, d.codepunkte || []])
);

/**
 * Taugt der Codepunkt als Messzeichen? Steuerzeichen und kombinierende
 * Zeichen haben keinen eigenen Vorschub und messen darum nichts.
 */
function messbarerCodepunkt(c) {
    return c >= 0x20 && c !== 0x7f && !(c >= 0x0300 && c <= 0x036f);
}

/**
 * Die messbaren Codepunkte, die ALLE genannten Dateien tragen (Schnittmenge).
 * @param {string[]} dateinamen
 * @returns {number[]}
 */
function kontrollCodepunkte(dateinamen) {
    let menge = null;
    for (const name of dateinamen) {
        const cps = new Set((CODEPUNKTE_JE_DATEI.get(name) || []).filter(messbarerCodepunkt));
        menge = menge === null ? cps : new Set([...menge].filter(c => cps.has(c)));
    }
    return [...(menge || [])].sort((a, b) => a - b).slice(0, KONTROLL_ZEICHEN_MAX);
}

/** Der Kontrolltext zu einer Dateimenge, oder '' wenn sie nichts Messbares traegt. */
function kontrollText(dateinamen) {
    return kontrollCodepunkte(dateinamen)
        .map(c => String.fromCodePoint(c).repeat(KONTROLL_WIEDERHOLUNGEN))
        .join('');
}

/** Lesbare Benennung der Kontrollzeichen fuer die Fehlermeldung. */
function kontrollZeichenNamen(dateinamen) {
    return kontrollCodepunkte(dateinamen).map(c => schriftWerkzeug.zeigeCodepunkt(c));
}

/** Die Dateien einer Familie, aus fonts.css. */
function dateienDerFamilie(familie) {
    return FACES.filter(f => f.familie === familie).map(f => f.datei);
}

const GENERISCHE_FAMILIEN = [
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded',
    'math',
    'emoji',
    'fangsong'
];

// ----------------------------------------------------------------------
// fonts.css lesen — Familie, Gewicht und Datei je @font-face.
// ----------------------------------------------------------------------
function leseFaces() {
    const quelle = fs.readFileSync(FONTS_CSS, 'utf8');
    const faces = [];
    const bloecke = quelle.match(/@font-face\s*\{[^}]*\}/g) || [];
    for (const block of bloecke) {
        const familie = (block.match(/font-family\s*:\s*['"]?([^;'"]+)['"]?\s*;/) || [])[1];
        const gewicht = (block.match(/font-weight\s*:\s*(\d+)\s*;/) || [])[1];
        const datei = (block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/) || [])[1];
        if (familie && gewicht && datei) {
            faces.push({
                familie: familie.trim(),
                gewicht: Number(gewicht),
                datei: datei.split('/').pop()
            });
        }
    }
    return faces;
}

const FACES = leseFaces();
const CSS_FAMILIEN = [...new Set(FACES.map(f => f.familie))].sort();

/** Erstes benanntes Glied eines font-family-Stacks, ohne Anfuehrungszeichen. */
function ersteFamilie(stack) {
    return (stack.split(',')[0] || '').trim().replace(/^['"]|['"]$/g, '');
}

/** Derselbe Stack ohne sein erstes Glied — der Rueckfall, den die App nutzt. */
function rueckfallStack(stack) {
    return stack.split(',').slice(1).join(',').trim();
}

// ----------------------------------------------------------------------
// Die Messung im Browser. EINE Funktion, die alles in einem Rutsch tut:
// Faces erzwingen, auf `ready` warten, dann Breiten abnehmen. Sie gibt den
// Face-Status mit zurueck, damit Teil 0 beweisen kann, dass zum Messzeitpunkt
// wirklich geladen war (Messfalle 2).
// ----------------------------------------------------------------------
async function messeBreiten(page, stapel, text = PROBETEXT, groesse = MESSGROESSE) {
    return page.evaluate(
        async ({ stapel, text, groesse }) => {
            const paare = [];
            document.fonts.forEach(ff => paare.push([ff.family, ff.weight]));
            for (const [familie, gewicht] of paare) {
                try {
                    await document.fonts.load(`${gewicht} 16px "${familie}"`, text);
                } catch (e) {
                    /* Status wird unten mitgemeldet; hier nicht werfen. */
                }
            }
            await document.fonts.ready;

            const faceStatus = {};
            document.fonts.forEach(ff => {
                faceStatus[`${ff.family}/${ff.weight}`] = ff.status;
            });

            const host = document.createElement('div');
            host.id = 'schr-messplatz';
            host.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;';
            document.body.appendChild(host);
            const breiten = {};
            for (const [name, eintrag] of Object.entries(stapel)) {
                const span = document.createElement('span');
                span.style.cssText =
                    `font-family:${eintrag.stack};` +
                    `font-size:${groesse};` +
                    `font-weight:${eintrag.gewicht || 400};` +
                    'font-style:normal;letter-spacing:0;word-spacing:0;' +
                    'white-space:pre;display:inline-block;';
                span.textContent = text;
                host.appendChild(span);
                breiten[name] = span.getBoundingClientRect().width;
            }
            host.remove();
            return { breiten, faceStatus };
        },
        { stapel, text, groesse }
    );
}

/** Gefuellte Kampagne, gebautes Bundle, App fertig initialisiert. */
async function ladeApp(page) {
    await seedPopulatedSession(page);
    await page.goto(`file:///${REPO_ROOT.replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`);
    await waitForAppReady(page);
}

test.describe('SCHR — die gebuendelten Web-Schriften tragen nichts bei', () => {
    // ------------------------------------------------------------------
    // Teil 0 — Waechter des Waechters.
    // Ohne diese Faelle koennte alles Folgende leer durchlaufen.
    // ------------------------------------------------------------------
    test.describe('Teil 0 — Waechter des Waechters', () => {
        test(`fonts.css fuehrt mindestens ${MINDEST_FACES} Faces`, async () => {
            expect(FACES.length).toBeGreaterThanOrEqual(MINDEST_FACES);
            expect(CSS_FAMILIEN.length).toBeGreaterThanOrEqual(1);
            for (const f of FACES) {
                expect(f.familie).toBeTruthy();
                expect(f.gewicht).toBeGreaterThan(0);
                expect(f.datei).toMatch(/\.woff2$/);
            }
        });

        test('Das Schriftmenue der laufenden App ist vollstaendig und hat ueberall Rueckfall', async ({
            page
        }) => {
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            expect(menue).toBeTruthy();
            expect(Object.keys(menue).length).toBeGreaterThanOrEqual(MINDEST_MENUEEINTRAEGE);

            // Die einzige Aussage, die sich fuer die drei Systemfamilien
            // (arial/serif/mono) plattformunabhaengig treffen laesst: kein
            // Eintrag kann ohne Rueckfall enden. Ob Georgia oder Courier New
            // installiert ist, ist eine Eigenschaft des Rechners, nicht
            // dieses Baums — darum macht Teil 1 ueber sie keine Aussage.
            for (const [schluessel, stack] of Object.entries(menue)) {
                const glieder = stack.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
                expect(glieder.length, `${schluessel} hat keinen Rueckfall`).toBeGreaterThan(1);
                expect(
                    GENERISCHE_FAMILIEN,
                    `${schluessel} endet auf "${glieder[glieder.length - 1]}"`
                ).toContain(glieder[glieder.length - 1]);
            }

            const gebuendelt = Object.entries(menue)
                .filter(([, stack]) => CSS_FAMILIEN.includes(ersteFamilie(stack)))
                .map(([k]) => k)
                .sort();
            expect(gebuendelt).toHaveLength(GEBUENDELTE_MENUEEINTRAEGE_SOLL);
        });

        test('Der Probetext enthaelt kein Zeichen, das eine der zehn Dateien traegt', async () => {
            // Gegen das Werkzeug aus Einheit 1 gemessen, nicht behauptet.
            // Diese Probe ist der Grund, warum Teil 1-3 ueberhaupt etwas
            // sagen: ein Probetext mit ' ', 'A', 'Ä' oder 'B' wuerde den
            // Rueckfall VERLASSEN und die Breiten unterschiedlich machen —
            // die Probe meldete dann "die Schrift funktioniert".
            const werkzeug = schriftWerkzeug;
            const ergebnis = werkzeug.pruefeAlle();
            expect(ergebnis.dateien.length).toBeGreaterThanOrEqual(MINDEST_FACES);

            // Gegen die VOLLE cmap, nicht gegen den deutschen Satz. Die alte
            // Fassung schnitt gegen `DEUTSCHER_ZEICHENSATZ` und sah damit nur
            // 4 der 289 getragenen Codepunkte — U+00A0 war fuer sie
            // unsichtbar, obwohl alle zehn Dateien es tragen.
            const getragen = new Set();
            for (const datei of ergebnis.dateien) {
                expect(
                    Array.isArray(datei.codepunkte),
                    `${datei.name}: das Werkzeug liefert keine Codepunktliste`
                ).toBe(true);
                for (const c of datei.codepunkte) getragen.add(c);
            }
            // Gegenprobe gegen Leerlauf: eine kaputte Messung wuerde hier
            // eine leere Menge liefern und die Zusicherung trivial erfuellen.
            expect(getragen.size).toBeGreaterThanOrEqual(MINDEST_GETRAGENE_CODEPUNKTE);
            // Als Codepunkt gemeldet, nicht als Zeichen: ein unsichtbarer
            // Treffer (U+00A0) waere in der Fehlermeldung sonst nicht zu
            // erkennen.
            const kollision = [...PROBETEXT]
                .filter(z => getragen.has(z.codePointAt(0)))
                .map(z => werkzeug.zeigeCodepunkt(z.codePointAt(0)));
            expect(
                kollision,
                `Der Probetext "${PROBETEXT}" enthaelt Zeichen, die eine gebuendelte ` +
                    `Datei traegt: ${JSON.stringify(kollision)}. Damit verlaesst die ` +
                    `Messung den Rueckfall und Teil 1-3 messen nichts.`
            ).toEqual([]);
        });

        test('Nicht-Leerlauf: das Messwerkzeug unterscheidet, und alle Faces sind geladen', async ({
            page
        }) => {
            await ladeApp(page);
            const { breiten, faceStatus } = await messeBreiten(page, {
                mono: { stack: 'monospace' },
                serif: { stack: 'serif' },
                leer: { stack: 'monospace' }
            });
            // Zwei generische Familien, auf JEDEM System verschieden — auch
            // auf ubuntu-latest. Keine benannte Systemschrift als Kontrolle:
            // Arial und Georgia fehlen auf Linux.
            expect(breiten.mono).toBeGreaterThan(0);
            expect(Math.abs(breiten.mono - breiten.serif)).toBeGreaterThan(1);
            // Und zwei gleich gebaute Spannen messen gleich — sonst ist die
            // Gleichheit in Teil 1 kein Befund, sondern Rauschen.
            expect(breiten.leer).toBe(breiten.mono);

            // Messfalle 2: ohne diese Zusicherung messen Teil 1-3 nur die
            // Tauschfrist von `font-display: swap`.
            expect(Object.keys(faceStatus).length).toBeGreaterThanOrEqual(MINDEST_FACES);
            for (const [name, status] of Object.entries(faceStatus)) {
                expect(status, `${name} steht auf "${status}", nicht "loaded"`).toBe('loaded');
            }
        });
    });

    // ------------------------------------------------------------------
    // Teil 1 — Breitenvergleich gegen den synthetischen Rueckfall.
    // Je gebuendeltes Face ein Fall, also auch je Gewicht.
    // ------------------------------------------------------------------
    test.describe('Teil 1 — jedes gebuendelte Face gegen monospace', () => {
        // ALLE ZEHN FACES IN EINEM FALL AUF EINER SEITE, nicht zehn Faelle mit
        // zehn Seiten. Das ist kein Stilentscheid, sondern gemessen: in der
        // ersten Fassung lud diese Datei 25-mal das 3,7-MB-Bundle, und der
        // volle Lauf stellte fuenf FREMDE Faelle rot —
        // `eingaberahmen.spec.js` W6-R-07 Fall 1 (vier Themes) und Fall 2.
        // Diese sammeln ihre Felder ueber feste Wartefristen (400/380/180 ms)
        // und verlangen mehr als 150 sichtbare Felder; unter der zusaetzlichen
        // Last reichten die Fristen nicht. Einzeln laufen sie gruen (12
        // passed), und der Kontrolllauf der vollen Suite OHNE diese Datei
        // ebenfalls (634 passed / 39 skipped / 0 failed). Die Last war die
        // Ursache, nicht ein Logikfehler — die Fremdfaelle sind also
        // lastempfindlich, und diese Probe nimmt darauf Ruecksicht, statt sie
        // umzuschreiben. Je Face bleibt der Befund einzeln benannt: die
        // Zusicherung meldet eine Liste, keine Summe.
        test('Alle gebuendelten Faces tragen zum Rendern bei', async ({ page }) => {
            // Eigene Untergrenze, nicht die des Nachbar-describe. Vorher lag
            // sie allein in Teil 0: mit leerer Facesliste lief dieser Fall
            // gruen ueber NULL Messungen durch, und ein gezielter
            // `--grep "Teil 1"`-Lauf konnte das nicht erkennen.
            expect(FACES.length, 'fonts.css liefert keine Faces').toBeGreaterThanOrEqual(
                MINDEST_FACES
            );
            await ladeApp(page);
            const stapel = {};
            for (const face of FACES) {
                const s = `${face.familie}/${face.gewicht}`;
                stapel[`${s}__mit`] = {
                    stack: mitStack(face.familie),
                    gewicht: face.gewicht
                };
                stapel[`${s}__ohne`] = { stack: RUECKFALL, gewicht: face.gewicht };
                stapel[`${s}__nichtda`] = {
                    stack: mitStack(FAMILIE_OHNE_DATEI),
                    gewicht: face.gewicht
                };
                // Die Gegenrichtung: derselbe Messkoerper, aber mit einem
                // Zeichen, das GENAU DIESE Datei traegt.
                stapel[`${s}__kontrolle`] = {
                    stack: mitStack(face.familie),
                    gewicht: face.gewicht,
                    text: kontrollText([face.datei])
                };
                stapel[`${s}__kontrolleOhne`] = {
                    stack: RUECKFALL,
                    gewicht: face.gewicht,
                    text: kontrollText([face.datei])
                };
            }
            const { breiten } = await messeBreiten(page, stapel);

            const stummeFaces = [];
            let gemessen = 0;
            for (const face of FACES) {
                const s = `${face.familie}/${face.gewicht}`;
                const mit = breiten[`${s}__mit`];
                const ohne = breiten[`${s}__ohne`];
                const nichtda = breiten[`${s}__nichtda`];
                expect(ohne, `${s}: Rueckfall messbar`).toBeGreaterThan(0);
                // Der haerteste Vergleichspunkt: eine Familie, die es nicht
                // gibt, ist vom reinen Rueckfall nicht zu unterscheiden.
                expect(nichtda, `${s}: nicht vorhandene Familie`).toBe(ohne);

                // Der Messkoerper nennt die Familie ueberhaupt. Billig, und
                // genau die Luecke, die eine Kuerzung auf den reinen
                // Rueckfall hinterliess.
                expect(
                    stapel[`${s}__mit`].stack,
                    `${s}: der Messkoerper nennt die Familie nicht`
                ).toContain(face.familie);

                // DIE KONTROLLE. Ohne sie ist "traegt nichts bei" von "wir
                // haben die Familie nie gefragt" nicht zu unterscheiden.
                const zeichen = kontrollZeichenNamen([face.datei]);
                expect(
                    zeichen.length,
                    `${face.datei} traegt kein messbares Zeichen — dann ist die ` +
                        `Kontrolle in der Gegenrichtung nicht durchfuehrbar.`
                ).toBeGreaterThan(0);
                const kontrolle = breiten[`${s}__kontrolle`];
                const kontrolleOhne = breiten[`${s}__kontrolleOhne`];
                expect(kontrolle, `${s}: Kontrolle messbar`).toBeGreaterThan(0);
                expect(
                    Math.abs(kontrolle - kontrolleOhne),
                    `${s}: Der Messkoerper nennt "${face.familie}" und misst mit ` +
                        `${zeichen.join(' ')} — Zeichen, die ${face.datei} laut cmap ` +
                        `TRAEGT. Trotzdem ist er vom reinen Rueckfall nicht zu ` +
                        `unterscheiden (${kontrolle}px gegen ${kontrolleOhne}px). Dann ` +
                        `misst diese Probe die Familie ueberhaupt nicht, und die ` +
                        `Gleichheit beim Probetext sagt nichts ueber die Schrift.`
                ).toBeGreaterThan(KONTROLL_MINDESTABSTAND);
                gemessen++;

                const aufListe = Object.prototype.hasOwnProperty.call(
                    SCHRIFT_FAMILIEN_AUSNAHMEN,
                    face.familie
                );
                if (aufListe) {
                    expect(
                        mit,
                        `${face.datei} steht auf SCHRIFT_FAMILIEN_AUSNAHMEN, rendert aber ` +
                            `${mit}px statt ${ohne}px — die Datei traegt doch etwas bei.`
                    ).toBe(ohne);
                    continue;
                }
                if (mit === ohne) {
                    stummeFaces.push(`${face.datei} (${s}) ${mit}px`);
                }
            }
            // Es wurde wirklich je Face gemessen, nicht nur die Schleife
            // betreten. `stummeFaces` ist bei leerer Schleife trivial leer.
            expect(gemessen, 'kein einziges Face wurde gemessen').toBe(FACES.length);
            expect(
                stummeFaces,
                `Diese Faces rendern "${PROBETEXT}" GENAU so breit wie der reine ` +
                    `monospace-Rueckfall und genau so breit wie eine Familie, die es ` +
                    `ueberhaupt nicht gibt. Sie tragen keinen der Buchstaben.`
            ).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 2 — derselbe Vergleich am ECHTEN Stack aus EDITOR_FONTS.
    //
    // Hier ist der Rueckfall nicht `monospace`, sondern der, den die App
    // wirklich setzt (`Arial, sans-serif`). Das bleibt trotzdem
    // plattformunabhaengig, weil BEIDE Seiten denselben Rueckfall aufloesen:
    // fehlt Arial, loesen beide auf sans-serif auf und die GLEICHHEIT haelt
    // weiter. Nur die Ungleichheits-Richtung waere plattformabhaengig, und
    // die traegt die Kontrolle in Teil 0, nicht dieser Fall.
    // ------------------------------------------------------------------
    test.describe('Teil 2 — der echte Stack aus EDITOR_FONTS', () => {
        test('Jeder gebuendelte Menueeintrag unterscheidet sich von seinem Rueckfall', async ({
            page
        }) => {
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            const gebuendelt = Object.entries(menue).filter(([, stack]) =>
                CSS_FAMILIEN.includes(ersteFamilie(stack))
            );
            expect(gebuendelt.length).toBe(GEBUENDELTE_MENUEEINTRAEGE_SOLL);

            const stapel = {};
            for (const [schluessel, stack] of gebuendelt) {
                const rueckfall = rueckfallStack(stack);
                stapel[`${schluessel}__voll`] = { stack };
                stapel[`${schluessel}__rueckfall`] = { stack: rueckfall };
                stapel[`${schluessel}__nichtda`] = {
                    stack: `'${FAMILIE_OHNE_DATEI}', ${rueckfall}`
                };
            }
            const { breiten } = await messeBreiten(page, stapel);

            const befund = [];
            for (const [schluessel, stack] of gebuendelt) {
                const voll = breiten[`${schluessel}__voll`];
                const rueck = breiten[`${schluessel}__rueckfall`];
                const nichtda = breiten[`${schluessel}__nichtda`];
                expect(rueck).toBeGreaterThan(0);
                // Auch hier: der Nichtvorhandene ist die Messlatte.
                expect(nichtda).toBe(rueck);
                befund.push({
                    schluessel,
                    familie: ersteFamilie(stack),
                    voll,
                    rueck,
                    gleich: voll === rueck
                });
            }

            const unerwartetGleich = befund.filter(
                b =>
                    b.gleich &&
                    !Object.prototype.hasOwnProperty.call(SCHRIFT_FAMILIEN_AUSNAHMEN, b.familie)
            );
            expect(
                unerwartetGleich.map(b => `${b.schluessel} (${b.familie}) ${b.voll}px`),
                'Diese Menueeintraege rendern GENAU so breit wie ihr Rueckfall ohne die ' +
                    'erste Familie und genau so breit wie eine Familie, die es nicht gibt. ' +
                    'Wer sie im Editor waehlt, bekommt den Rueckfall.'
            ).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 3 — der echte Menueweg im Wiki-Editor.
    //
    // Teil 1 und 2 messen Stacks. Dieser Teil geht den Weg, den der Nutzer
    // geht: Text tippen, markieren, im Schriftmenue der Werkzeugleiste eine
    // der vier waehlen. Die App erzeugt dabei ein <font face="...">
    // (ui/editors/rich-text.js, applyFontFamilyToSelection) — und dessen
    // gerenderte Breite ist die Antwort auf "was bekommt der Nutzer?".
    // ------------------------------------------------------------------
    test.describe('Teil 3 — der Menueweg im Wiki-Editor', () => {
        const EDITOR_ID = 'wiki-content';

        // EIN FALL, EINE SEITE, EIN FORMULAR — aus demselben Lastgrund wie in
        // Teil 1 (dort begruendet). Die vier Familien laufen nacheinander im
        // SELBEN Editor, und das ist sogar der treuere Weg: ein zweiter Griff
        // ins Schriftmenue trifft in `applyFontFamilyToSelection()` den Zweig
        // `existingFont.setAttribute('face', ...)`, also genau das, was
        // passiert, wenn ein DM im Editor die Schrift noch einmal wechselt.
        async function tippeProbetext(page) {
            await page.evaluate(() => window.switchView('wiki'));
            await page.waitForSelector('#view-wiki', { state: 'visible' });
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'SCHR Messtext');
            const editor = page.locator(`#${EDITOR_ID}`);
            await editor.click();
            await editor.pressSequentially(PROBETEXT);
        }

        async function waehleSchrift(page, menueSchluessel) {
            // Vor jedem Griff die Auswahl neu setzen: nach `selectOption`
            // liegt der Fokus auf dem Select, und `setEditorFont()` stellt nur
            // einen GESPEICHERTEN Bereich wieder her. Fokus per Tastatur, wie
            // im Auftrag verlangt — der Klick bringt den Einfuegepunkt in den
            // Editor, `Strg+A` markiert dessen Inhalt.
            const editor = page.locator(`#${EDITOR_ID}`);
            await editor.click();
            await page.keyboard.press('Control+a');
            await page.selectOption(
                `[data-action="set-editor-font"][data-editor="${EDITOR_ID}"]`,
                menueSchluessel
            );
            await page.waitForSelector(`#${EDITOR_ID} font[face]`);
        }

        test('Jede gebuendelte Familie im Schriftmenue rendert wie ihr Rueckfall', async ({
            page
        }) => {
            // Eigene Untergrenze, wie in Teil 1: mit leerer Facesliste war
            // dieser Fall gruen ueber null Messungen, und die Untergrenze lag
            // im fremden describe von Teil 0.
            expect(CSS_FAMILIEN.length, 'fonts.css liefert keine Familien').toBeGreaterThanOrEqual(
                MINDEST_CSS_FAMILIEN
            );
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            await tippeProbetext(page);

            const befunde = [];
            let gemessen = 0;
            for (const familie of CSS_FAMILIEN) {
                const eintrag = Object.entries(menue).find(
                    ([, stack]) => ersteFamilie(stack) === familie
                );
                expect(eintrag, `Keine EDITOR_FONTS-Familie nennt "${familie}"`).toBeTruthy();
                const [schluessel, stack] = eintrag;

                await waehleSchrift(page, schluessel);

                const messung = await page.evaluate(
                    ({ editorId, rueckfall, kontrollZeichenText }) => {
                        const el = document.querySelector(`#${editorId} font[face]`);
                        const cs = getComputedStyle(el);
                        const host = document.createElement('div');
                        host.style.cssText =
                            'position:absolute;left:-99999px;top:0;visibility:hidden;';
                        document.body.appendChild(host);
                        const mach = (familie, text = el.textContent) => {
                            const s = document.createElement('span');
                            s.style.cssText =
                                `font-family:${familie};font-size:${cs.fontSize};` +
                                `font-weight:${cs.fontWeight};font-style:${cs.fontStyle};` +
                                `letter-spacing:${cs.letterSpacing};` +
                                `word-spacing:${cs.wordSpacing};` +
                                'white-space:pre;display:inline-block;';
                            s.textContent = text;
                            host.appendChild(s);
                            return s.getBoundingClientRect().width;
                        };
                        // `rechnerFamilie` ist der Stapel, den der Browser
                        // fuer das LEBENDE Element wirklich aufgeloest hat.
                        // Er wird mitgemeldet und unten geprueft: ohne ihn
                        // liess sich diese Messung auf Rueckfall-gegen-
                        // Rueckfall verkuerzen, ohne dass etwas rot wurde.
                        const rechnerFamilie = cs.fontFamily;
                        const ergebnis = {
                            face: el.getAttribute('face'),
                            rechnerFamilie,
                            rueckfallStack: rueckfall,
                            text: el.textContent,
                            lebend: el.getBoundingClientRect().width,
                            rueckfall: mach(rueckfall),
                            kontrolle: mach(rechnerFamilie, kontrollZeichenText),
                            kontrolleRueckfall: mach(rueckfall, kontrollZeichenText)
                        };
                        host.remove();
                        return ergebnis;
                    },
                    {
                        editorId: EDITOR_ID,
                        rueckfall: rueckfallStack(stack),
                        kontrollZeichenText: kontrollText(dateienDerFamilie(familie))
                    }
                );

                // Die App hat die Schrift wirklich gesetzt — sonst messen wir
                // am falschen Element. Entscheidend beim Lauf im selben
                // Editor: `face` muss die AKTUELLE Familie nennen, nicht noch
                // die vorige.
                expect(messung.face, `face nach der Wahl von "${schluessel}"`).toContain(familie);
                expect(messung.text).toBe(PROBETEXT);
                // Der Browser hat die Familie fuer das lebende Element
                // wirklich angefordert, und der Rueckfall nennt sie wirklich
                // nicht. Beides muss dastehen, sonst vergleicht der Schluss
                // unten zwei Rueckfaelle.
                expect(
                    messung.rechnerFamilie,
                    `${familie}: der Rechnerstil des lebenden Elements nennt die Familie nicht`
                ).toContain(familie);
                expect(
                    messung.rueckfallStack,
                    `${familie}: der Rueckfall nennt die Familie noch`
                ).not.toContain(familie);
                // DIE KONTROLLE, hier am echten Menueweg: mit einem Zeichen,
                // das die Dateien dieser Familie TRAGEN, muss derselbe
                // Rechnerstil breiter oder schmaler rendern als der Rueckfall.
                const zeichen = kontrollZeichenNamen(dateienDerFamilie(familie));
                expect(
                    zeichen.length,
                    `${familie} traegt kein messbares Zeichen — Kontrolle nicht durchfuehrbar.`
                ).toBeGreaterThan(0);
                expect(
                    Math.abs(messung.kontrolle - messung.kontrolleRueckfall),
                    `${familie}: der Rechnerstil "${messung.rechnerFamilie}" rendert ` +
                        `${zeichen.join(' ')} — Zeichen, die diese Familie laut cmap ` +
                        `TRAEGT — genau so breit wie der Rueckfall. Dann misst Teil 3 ` +
                        `die Familie nicht und der Vergleich unten sagt nichts.`
                ).toBeGreaterThan(KONTROLL_MINDESTABSTAND);
                gemessen++;

                const aufListe = Object.prototype.hasOwnProperty.call(
                    SCHRIFT_FAMILIEN_AUSNAHMEN,
                    familie
                );
                // Gemessen wird am LEBENDEN Element, nicht an einem Nachbau
                // mit derselben Familienangabe. Der Nachbau war der Punkt, an
                // dem sich diese Messung auf Rueckfall-gegen-Rueckfall
                // verkuerzen liess; `lebend` ist das <font face>, das die App
                // selbst erzeugt hat. `toBeCloseTo(…, 1)` statt `toBe`: ein
                // lebendes Inline-Element und eine nachgebaute Spanne liegen
                // nicht bitgenau, sondern unter 0.05px auseinander (vorher
                // ueber die Treue-Zusicherung des Nachbaus belegt).
                if (aufListe) {
                    expect(
                        messung.lebend,
                        `${familie} steht auf SCHRIFT_FAMILIEN_AUSNAHMEN, rendert im Editor ` +
                            `aber ${messung.lebend}px statt ${messung.rueckfall}px.`
                    ).toBeCloseTo(messung.rueckfall, 1);
                    continue;
                }
                if (Math.abs(messung.lebend - messung.rueckfall) < 0.05) {
                    befunde.push(
                        `"${schluessel}" -> face="${messung.face}" ` +
                            `${messung.lebend}px == Rueckfall "${rueckfallStack(stack)}"`
                    );
                }
            }
            expect(gemessen, 'keine einzige Familie wurde gemessen').toBe(CSS_FAMILIEN.length);
            expect(
                befunde,
                'Nach der Wahl dieser Eintraege im Schriftmenue rendert der Text GENAU so ' +
                    'breit wie ohne die erste Familie. Der Nutzer bekommt den Rueckfall.'
            ).toEqual([]);
        });
    });

    // ------------------------------------------------------------------
    // Teil 4 — und trotzdem laden sie. Die Pointe, getrennt belegt.
    // ------------------------------------------------------------------
    test.describe('Teil 4 — die Dateien laden, sie sind nur nutzlos', () => {
        test('Beim blanken Laden fordert Chromium KEINE der zehn Dateien an', async ({ page }) => {
            const gesehen = [];
            page.on('response', r => {
                if (/\.woff2(\?|$)/i.test(r.url())) gesehen.push(r.url().split('/').pop());
            });
            await ladeApp(page);
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(2000);
            // Messfalle 3: ohne `unicode-range` und ohne Nutzung laedt
            // Chromium faul. Die App selbst benutzt keine der vier Familien.
            // Das ist ein Befund, keine Formalie: die 195.276 Byte fliessen
            // erst, wenn jemand im Editor eine der vier waehlt.
            expect(gesehen).toEqual([]);
        });

        test(`Erzwungen laden alle ${MINDEST_FACES} mit Status 200, ${BYTE_SUMME_SOLL} Byte`, async ({
            page
        }) => {
            // Der Horcher sammelt SYNCHRON. Ein `async`-Horcher, der erst
            // `await r.body()` abwartet und danach schiebt, waere ein Rennen:
            // Playwright wartet auf das Versprechen eines Horchers NICHT, der
            // Eintrag koennte also nach den Zusicherungen unten landen und die
            // Namensliste waere mal vollstaendig, mal nicht. Die Koerper
            // werden darum erst im Testkoerper gelesen, wo `await` zaehlt.
            const rohAntworten = [];
            page.on('response', r => {
                if (/\.woff2(\?|$)/i.test(r.url())) rohAntworten.push(r);
            });
            const fehlgeschlagen = [];
            page.on('requestfailed', r => {
                if (/\.woff2(\?|$)/i.test(r.url())) {
                    fehlgeschlagen.push({
                        name: r.url().split('/').pop(),
                        fehler: r.failure() ? r.failure().errorText : '?'
                    });
                }
            });

            await ladeApp(page);
            const { faceStatus } = await messeBreiten(page, { mono: { stack: 'monospace' } });
            // Auf die Namen warten statt auf eine feste Frist: unter Last ist
            // jede feste Frist entweder zu kurz (Fehlalarm) oder verschwendet.
            await expect
                .poll(() => rohAntworten.length, { timeout: 15000 })
                .toBeGreaterThanOrEqual(FACES.length);

            // Im selben Lauf mitgenommen (eine Seite statt zwei, Lastgrund
            // siehe Teil 1): `document.fonts.check()` kann die Frage dieser
            // Probe nicht beantworten.
            const checkAntworten = await page.evaluate(
                ({ text, nichtda }) => {
                    const familien = new Set();
                    document.fonts.forEach(ff => familien.add(ff.family));
                    const antworten = {};
                    for (const f of [...familien, nichtda]) {
                        antworten[f] = document.fonts.check(`400 16px "${f}"`, text);
                    }
                    return antworten;
                },
                { text: PROBETEXT, nichtda: FAMILIE_OHNE_DATEI }
            );
            // WARUM DAS EINE ZUSICHERUNG IST UND KEIN KOMMENTAR.
            // `check()` liefert nach Spezifikation `true`, sobald der Text mit
            // der Liste INKLUSIVE Rueckfaellen darstellbar ist. Es sagt also
            // nichts darueber, ob die GENANNTE Familie etwas beitraegt — hier
            // nachgemessen: es liefert `true` auch fuer eine Familie, zu der
            // es keine Datei und keine @font-face-Regel gibt. Darum laeuft der
            // Ladebeleg ueber die Netzwerkantworten und nicht ueber `check()`.
            // Solange diese Zusicherung haelt, ist die Entscheidung
            // begruendet; kippt sie, gehoert sie neu bewertet.
            expect(
                checkAntworten[FAMILIE_OHNE_DATEI],
                'document.fonts.check() meldet eine Familie ohne Datei als nicht ' +
                    'darstellbar — dann ist check() hier doch brauchbar und der ' +
                    'Ladebeleg gehoert neu bewertet.'
            ).toBe(true);
            for (const familie of CSS_FAMILIEN) {
                expect(checkAntworten[familie], `check() fuer ${familie}`).toBe(true);
            }

            const antworten = [];
            for (const r of rohAntworten) {
                let laenge = null;
                try {
                    laenge = (await r.body()).length;
                } catch (e) {
                    laenge = null;
                }
                antworten.push({ name: r.url().split('/').pop(), status: r.status(), laenge });
            }

            // Kein 404, kein Ladefehler — das ist die Pointe.
            expect(fehlgeschlagen).toEqual([]);
            const namen = antworten.map(a => a.name).sort();
            expect(namen).toEqual(FACES.map(f => f.datei).sort());
            for (const a of antworten) {
                expect(a.status, `${a.name} antwortete mit ${a.status}`).toBe(200);
            }
            for (const [name, status] of Object.entries(faceStatus)) {
                expect(status, `${name} steht auf "${status}"`).toBe('loaded');
            }
            const summe = antworten.reduce((s, a) => s + (a.laenge || 0), 0);
            expect(summe).toBe(BYTE_SUMME_SOLL);
        });
    });

    // ------------------------------------------------------------------
    // Teil 5 — die Ratsche: gezaehlte Ausnahmeliste mit Verwesungsprobe.
    // ------------------------------------------------------------------
    test.describe('Teil 5 — gezaehlte Ausnahmeliste', () => {
        const eintraege = Object.keys(SCHRIFT_FAMILIEN_AUSNAHMEN);

        test(`SCHRIFT_FAMILIEN_AUSNAHMEN fuehrt genau ${AUSNAHMEN_SOLL} Eintraege`, async () => {
            expect(eintraege).toHaveLength(AUSNAHMEN_SOLL);
        });

        test('Jeder Eintrag nennt einen Grund', async () => {
            for (const [name, grund] of Object.entries(SCHRIFT_FAMILIEN_AUSNAHMEN)) {
                expect(typeof grund, `${name} hat keinen Grund`).toBe('string');
                expect(grund.length, `${name}: Grund zu kurz`).toBeGreaterThan(20);
            }
        });

        test('Jeder Eintrag nennt eine Familie, die fonts.css einbindet', async () => {
            for (const name of eintraege) {
                expect(CSS_FAMILIEN, `${name} steht in keiner @font-face-Regel`).toContain(name);
            }
        });

        test('Verwesungsprobe: keine Ausnahme ueberlebt ihre Reparatur', async ({ page }) => {
            await ladeApp(page);

            // Im selben Lauf mitgenommen (Lastgrund siehe Teil 1): jeder
            // Eintrag muss eine Familie nennen, die das Menue wirklich
            // anbietet. Ein Tippfehler im Schluessel koennte die
            // Verwesungsprobe sonst leerlaufen lassen.
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            const menueFamilien = Object.values(menue).map(ersteFamilie);
            for (const name of eintraege) {
                expect(menueFamilien, `${name} steht in keinem Menueeintrag`).toContain(name);
            }

            if (eintraege.length === 0) {
                // Leere Liste: nichts zu verwesen. Die Laengenprobe oben
                // haelt den Zustand fest.
                expect(AUSNAHMEN_SOLL).toBe(0);
                return;
            }
            const stapel = {};
            for (const name of eintraege) {
                stapel[`${name}__mit`] = { stack: mitStack(name) };
                stapel[`${name}__ohne`] = { stack: RUECKFALL };
                stapel[`${name}__kontrolle`] = {
                    stack: mitStack(name),
                    text: kontrollText(dateienDerFamilie(name))
                };
                stapel[`${name}__kontrolleOhne`] = {
                    stack: RUECKFALL,
                    text: kontrollText(dateienDerFamilie(name))
                };
            }
            const { breiten } = await messeBreiten(page, stapel);

            // Dieselbe Kontrolle wie in Teil 1, hier je Familie: ohne sie
            // wuerde eine Verfaelschung des Messkoerpers in Richtung
            // Rueckfall die Verwesungsprobe WAHRER machen statt falscher.
            for (const name of eintraege) {
                const zeichen = kontrollZeichenNamen(dateienDerFamilie(name));
                expect(
                    zeichen.length,
                    `${name} traegt kein messbares Zeichen — Kontrolle nicht durchfuehrbar.`
                ).toBeGreaterThan(0);
                expect(
                    Math.abs(breiten[`${name}__kontrolle`] - breiten[`${name}__kontrolleOhne`]),
                    `${name}: der Messkoerper nennt die Familie und misst mit ` +
                        `${zeichen.join(' ')}, Zeichen die ihre Dateien laut cmap TRAGEN — ` +
                        `und ist trotzdem vom reinen Rueckfall nicht zu unterscheiden. ` +
                        `Dann prueft die Verwesungsprobe nichts.`
                ).toBeGreaterThan(KONTROLL_MINDESTABSTAND);
            }

            const repariert = eintraege.filter(n => breiten[`${n}__mit`] !== breiten[`${n}__ohne`]);
            expect(
                repariert,
                `Diese Familien stehen auf SCHRIFT_FAMILIEN_AUSNAHMEN, tragen aber in ` +
                    `Wahrheit bei. Nimm sie von der Liste und senke AUSNAHMEN_SOLL auf ` +
                    `${eintraege.length - repariert.length}.`
            ).toEqual([]);
        });
    });
});
