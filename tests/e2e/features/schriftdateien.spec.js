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
 *      Einheit 1 gemessen, statt es zu behaupten.
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
// ----------------------------------------------------------------------
const SCHRIFT_FAMILIEN_AUSNAHMEN = {};

const AUSNAHMEN_SOLL = 0;

// Untergrenzen gegen Leerlauf. Gegen `>= 0`: ein leeres Parse-Ergebnis
// (fonts.css-Regex kaputt, EDITOR_FONTS nicht exportiert) wuerde sonst gruen
// durchlaufen, weil "keine Familie verletzt die Regel" trivial wahr ist.
const MINDEST_FACES = 10;
const MINDEST_MENUEEINTRAEGE = 7;

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

        test(`window.EDITOR_FONTS fuehrt mindestens ${MINDEST_MENUEEINTRAEGE} Eintraege`, async ({
            page
        }) => {
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            expect(menue).toBeTruthy();
            expect(Object.keys(menue).length).toBeGreaterThanOrEqual(MINDEST_MENUEEINTRAEGE);
        });

        test('Jeder Menuestack endet auf eine generische Familie', async ({ page }) => {
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
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
        });

        test(
            `Genau ${GEBUENDELTE_MENUEEINTRAEGE_SOLL} Menueeintraege nennen zuerst eine ` +
                `gebuendelte Familie`,
            async ({ page }) => {
                await ladeApp(page);
                const menue = await page.evaluate(() => window.EDITOR_FONTS);
                const gebuendelt = Object.entries(menue)
                    .filter(([, stack]) => CSS_FAMILIEN.includes(ersteFamilie(stack)))
                    .map(([k]) => k)
                    .sort();
                expect(gebuendelt).toHaveLength(GEBUENDELTE_MENUEEINTRAEGE_SOLL);
            }
        );

        test('Der Probetext enthaelt kein Zeichen, das eine der zehn Dateien traegt', async () => {
            // Gegen das Werkzeug aus Einheit 1 gemessen, nicht behauptet.
            // Diese Probe ist der Grund, warum Teil 1-3 ueberhaupt etwas
            // sagen: ein Probetext mit ' ', 'A', 'Ä' oder 'B' wuerde den
            // Rueckfall VERLASSEN und die Breiten unterschiedlich machen —
            // die Probe meldete dann "die Schrift funktioniert".
            const werkzeug = schriftWerkzeug;
            const ergebnis = werkzeug.pruefeAlle();
            expect(ergebnis.dateien.length).toBeGreaterThanOrEqual(MINDEST_FACES);
            const getragen = new Set();
            for (const datei of ergebnis.dateien) {
                for (const zeichen of werkzeug.DEUTSCHER_ZEICHENSATZ) {
                    if (!datei.fehlendeZeichen.includes(zeichen)) getragen.add(zeichen);
                }
            }
            // Gegenprobe gegen Leerlauf: eine kaputte Messung wuerde hier
            // eine leere Menge liefern und die Zusicherung trivial erfuellen.
            expect(getragen.size).toBeGreaterThan(0);
            const kollision = [...PROBETEXT].filter(z => getragen.has(z));
            expect(
                kollision,
                `Der Probetext "${PROBETEXT}" enthaelt Zeichen, die eine gebuendelte ` +
                    `Datei traegt: ${JSON.stringify(kollision)}. Damit verlaesst die ` +
                    `Messung den Rueckfall und Teil 1-3 messen nichts.`
            ).toEqual([]);
        });

        test('Nicht-Leerlauf: monospace und serif sind messbar verschieden', async ({ page }) => {
            await ladeApp(page);
            const { breiten } = await messeBreiten(page, {
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
        });

        test('Alle Faces stehen beim Messen auf "loaded", keines auf "unloaded"', async ({
            page
        }) => {
            await ladeApp(page);
            const { faceStatus } = await messeBreiten(page, { mono: { stack: 'monospace' } });
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
        for (const face of FACES) {
            const menueSchluessel = face.familie;
            test(`${face.datei} (${face.familie} ${face.gewicht}) traegt zum Rendern bei`, async ({
                page
            }) => {
                await ladeApp(page);
                const { breiten } = await messeBreiten(page, {
                    mit: { stack: `'${face.familie}', monospace`, gewicht: face.gewicht },
                    ohne: { stack: 'monospace', gewicht: face.gewicht },
                    nichtda: {
                        stack: `'${FAMILIE_OHNE_DATEI}', monospace`,
                        gewicht: face.gewicht
                    }
                });
                // Der haerteste Vergleichspunkt: eine Familie, die es nicht
                // gibt, ist vom reinen Rueckfall nicht zu unterscheiden.
                expect(breiten.nichtda).toBe(breiten.ohne);
                const aufListe = Object.prototype.hasOwnProperty.call(
                    SCHRIFT_FAMILIEN_AUSNAHMEN,
                    menueSchluessel
                );
                if (aufListe) {
                    expect(breiten.mit).toBe(breiten.ohne);
                    return;
                }
                expect(
                    breiten.mit,
                    `'${face.familie}' ${face.gewicht} rendert GENAU so breit wie der ` +
                        `reine monospace-Rueckfall (${breiten.ohne}px) und genau so breit ` +
                        `wie eine Familie, die es nicht gibt. Die Datei ${face.datei} ` +
                        `traegt keinen der Buchstaben aus "${PROBETEXT}".`
                ).not.toBe(breiten.ohne);
            });
        }
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

        async function waehleSchriftImEditor(page, menueSchluessel) {
            await page.evaluate(() => window.switchView('wiki'));
            await page.waitForSelector('#view-wiki', { state: 'visible' });
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', `SCHR ${menueSchluessel}`);
            const editor = page.locator(`#${EDITOR_ID}`);
            await editor.click();
            await editor.pressSequentially(PROBETEXT);
            await page.keyboard.press('Control+a');
            await page.selectOption(
                `[data-action="set-editor-font"][data-editor="${EDITOR_ID}"]`,
                menueSchluessel
            );
            await page.waitForSelector(`#${EDITOR_ID} font[face]`);
        }

        for (const familie of CSS_FAMILIEN) {
            test(`"${familie}" im Schriftmenue rendert nicht wie sein Rueckfall`, async ({
                page
            }) => {
                await ladeApp(page);
                const menue = await page.evaluate(() => window.EDITOR_FONTS);
                const eintrag = Object.entries(menue).find(
                    ([, stack]) => ersteFamilie(stack) === familie
                );
                expect(eintrag, `Keine EDITOR_FONTS-Familie nennt "${familie}"`).toBeTruthy();
                const [schluessel, stack] = eintrag;

                await waehleSchriftImEditor(page, schluessel);

                const messung = await page.evaluate(
                    ({ editorId, rueckfall }) => {
                        const el = document.querySelector(`#${editorId} font[face]`);
                        const cs = getComputedStyle(el);
                        const host = document.createElement('div');
                        host.style.cssText =
                            'position:absolute;left:-99999px;top:0;visibility:hidden;';
                        document.body.appendChild(host);
                        const mach = familie => {
                            const s = document.createElement('span');
                            s.style.cssText =
                                `font-family:${familie};font-size:${cs.fontSize};` +
                                `font-weight:${cs.fontWeight};font-style:${cs.fontStyle};` +
                                `letter-spacing:${cs.letterSpacing};` +
                                `word-spacing:${cs.wordSpacing};` +
                                'white-space:pre;display:inline-block;';
                            s.textContent = el.textContent;
                            host.appendChild(s);
                            return s.getBoundingClientRect().width;
                        };
                        const ergebnis = {
                            face: el.getAttribute('face'),
                            text: el.textContent,
                            lebend: el.getBoundingClientRect().width,
                            nachgebaut: mach(cs.fontFamily),
                            rueckfall: mach(rueckfall)
                        };
                        host.remove();
                        return ergebnis;
                    },
                    { editorId: EDITOR_ID, rueckfall: rueckfallStack(stack) }
                );

                // Die App hat die Schrift wirklich gesetzt — sonst messen wir
                // am falschen Element.
                expect(messung.face).toContain(familie);
                expect(messung.text).toBe(PROBETEXT);
                // Und der Nachbau ist dem lebenden Element treu — sonst sagt
                // der Vergleich unten nichts ueber das, was im Editor steht.
                expect(messung.nachgebaut).toBeCloseTo(messung.lebend, 1);

                const aufListe = Object.prototype.hasOwnProperty.call(
                    SCHRIFT_FAMILIEN_AUSNAHMEN,
                    familie
                );
                if (aufListe) {
                    expect(messung.nachgebaut).toBe(messung.rueckfall);
                    return;
                }
                expect(
                    messung.nachgebaut,
                    `Nach der Wahl von "${schluessel}" im Schriftmenue traegt der Text ` +
                        `face="${messung.face}" und rendert GENAU so breit ` +
                        `(${messung.rueckfall}px) wie ohne die erste Familie. Der Nutzer ` +
                        `bekommt den Rueckfall.`
                ).not.toBe(messung.rueckfall);
            });
        }
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
            const antworten = [];
            page.on('response', async r => {
                if (!/\.woff2(\?|$)/i.test(r.url())) return;
                let laenge = null;
                try {
                    laenge = (await r.body()).length;
                } catch (e) {
                    laenge = null;
                }
                antworten.push({
                    name: r.url().split('/').pop(),
                    status: r.status(),
                    laenge
                });
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
            await page.waitForTimeout(1500);

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

        test('document.fonts.check() beantwortet die Frage NICHT', async ({ page }) => {
            await ladeApp(page);
            const ergebnis = await page.evaluate(
                async ({ text, nichtda }) => {
                    const paare = [];
                    document.fonts.forEach(ff => paare.push([ff.family, ff.weight]));
                    for (const [f, w] of paare) {
                        try {
                            await document.fonts.load(`${w} 16px "${f}"`, text);
                        } catch (e) {
                            /* egal */
                        }
                    }
                    await document.fonts.ready;
                    const familien = [...new Set(paare.map(p => p[0]))];
                    const antworten = {};
                    for (const f of [...familien, nichtda]) {
                        antworten[f] = document.fonts.check(`400 16px "${f}"`, text);
                    }
                    return antworten;
                },
                { text: PROBETEXT, nichtda: FAMILIE_OHNE_DATEI }
            );
            // WARUM DIESE PROBE EINE ZUSICHERUNG IST UND KEIN KOMMENTAR.
            // `check()` liefert nach Spezifikation `true`, sobald der Text mit
            // der Liste INKLUSIVE Rueckfaellen darstellbar ist. Es sagt also
            // nichts darueber, ob die GENANNTE Familie etwas beitraegt — hier
            // nachgemessen: es liefert `true` auch fuer eine Familie, zu der
            // es keine Datei und keine @font-face-Regel gibt. Darum laeuft der
            // Ladebeleg oben ueber die Netzwerkantworten und nicht ueber
            // `check()`. Solange diese Zusicherung haelt, ist die
            // Entscheidung begruendet; kippt sie, gehoert sie neu bewertet.
            expect(
                ergebnis[FAMILIE_OHNE_DATEI],
                'document.fonts.check() meldet eine Familie ohne Datei als nicht ' +
                    'darstellbar — dann ist check() hier doch brauchbar und dieser ' +
                    'Teil gehoert neu bewertet.'
            ).toBe(true);
            for (const familie of CSS_FAMILIEN) {
                expect(ergebnis[familie]).toBe(true);
            }
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

        test('Jeder Eintrag nennt eine Familie, die EDITOR_FONTS anbietet', async ({ page }) => {
            await ladeApp(page);
            const menue = await page.evaluate(() => window.EDITOR_FONTS);
            const menueFamilien = Object.values(menue).map(ersteFamilie);
            for (const name of eintraege) {
                expect(menueFamilien, `${name} steht in keinem Menueeintrag`).toContain(name);
            }
        });

        test('Verwesungsprobe: keine Ausnahme ueberlebt ihre Reparatur', async ({ page }) => {
            await ladeApp(page);
            if (eintraege.length === 0) {
                // Leere Liste: nichts zu verwesen. Die Laengenprobe oben
                // haelt den Zustand fest.
                expect(AUSNAHMEN_SOLL).toBe(0);
                return;
            }
            const stapel = {};
            for (const name of eintraege) {
                stapel[`${name}__mit`] = { stack: `'${name}', monospace` };
                stapel[`${name}__ohne`] = { stack: 'monospace' };
            }
            const { breiten } = await messeBreiten(page, stapel);
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
