/**
 * Ansichts-Schalen — Bauart und Aktenlage (UAT-Einheit U1, Runde 1)
 *
 * WARUM ES DIESE RATSCHE BRAUCHT. Die Kaskadenkorrektur der fuenf
 * Master-Detail-Schalen hat drei Deklarationen MITGEZOGEN, die nicht der
 * eigentliche Hebel waren: `overflow: hidden` an `.enc-view.active`
 * (encounters.css), `grid-template-rows: minmax(0, 1fr)` an der gemeinsamen
 * Rasterregel (core.css) und die Gleichstellung des Hoehenbudgets an
 * `.loot-view.active`
 * (npcs.css). Jede der drei bekam einen erklaerenden Kommentar — und alle drei
 * Kommentare schrieben ihrer Zeile eine Wirkung zu, die eine Mutationsprobe am
 * gebauten Buendel widerlegt. Das ist kein Schoenheitsfehler: wer eine Zeile
 * fuer tragend haelt, haelt den Rueckfall fuer abgedeckt und nimmt die
 * wirklich tragende Zeile guten Gewissens zurueck.
 *
 * DIE MESSUNG (dist/dnd-tracker-bundled.html an HEAD, je EINE Deklaration im
 * Buendel zurueckgenommen, 24 Eintraege je Liste, 60x Mausrad, 1280x720 und
 * 1920x1080; Skripte unter <scratch>/uat-fix/fix-kommentar/):
 *
 *   zurueckgenommen                       Wirkung
 *   ------------------------------------  ----------------------------------
 *   encounters.css `overflow-y: auto`     KEINE. Raster, Master und Detail in
 *                                         allen fuenf Ansichten auf den Pixel
 *                                         wie HEAD, letzte von 24 Begegnungen
 *                                         bei 621..695px, anklickbar.
 *   core.css `grid-template-rows`         KEINE. Ueberhang 0px, alles
 *                                         erreichbar.
 *   core.css Detail `height: 100%`        Detail ragt 86/86/161/184px unter
 *                                         die Rasterkante, Liste bleibt
 *                                         erreichbar.
 *   BEIDE core.css-Zeilen zusammen        Master UND Detail ragen 184px unter
 *                                         die Kante, letzte Begegnung bei
 *                                         top=805px -> unerreichbar, Truhe
 *                                         695..769px -> nicht anklickbar.
 *   npcs.css `- 60px` statt `- 120px`     Schale 660 statt 600px hoch, 119
 *                                         statt 59px unter dem Fensterrand,
 *                                         Werkzeugleiste rutscht beim
 *                                         Blaettern hinter die Kopfzeile —
 *                                         letzter Eintrag aber weiter bei
 *                                         534..608px und anklickbar.
 *
 * Die 805px gehoeren also dem PAAR in core.css, nicht der einen Zeile in
 * encounters.css und nicht einer core.css-Zeile allein.
 *
 * Diese Datei traegt zwei Waechter:
 *   1. BAUART — die fuenf Schalen fuehren dieselben vier Deklarationen. Das
 *      ist die einzige Begruendung, die den drei mitgezogenen Zeilen bleibt,
 *      und sie ist pruefbar. Faellt eine Schale heraus (zurueck auf
 *      `overflow-y: auto`, zurueck auf `- 60px` oder auf eine verdrahtete
 *      Zahl statt `--view-frame-height`), meldet es der Waechter.
 *   2. AKTENLAGE — die Kommentarbloecke der drei Zeilen fuehren nicht die
 *      widerlegten Wendungen und nennen den Messbefund. Vorbild ist die
 *      Aktenlage-Ratsche in design-consistency.test.js: eine Behauptung, die
 *      nur in einem Kommentar steht, prueft niemand nach.
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const STIL = path.join(REPO, 'assets', 'styles');

function lies(datei) {
    return fs.readFileSync(path.join(STIL, datei), 'utf8');
}

/**
 * Rumpf der Regel, deren Anker (Selektor samt `{`) uebergeben wird. Der Anker
 * muss GENAU EINMAL vorkommen — sonst misst der Waechter eine andere Regel als
 * gemeint, und das lautlos.
 */
function regelRumpf(inhalt, anker) {
    const treffer = inhalt.split(anker).length - 1;
    if (treffer !== 1) {
        throw new Error(`Anker ${JSON.stringify(anker)} kommt ${treffer}x vor (erwartet 1)`);
    }
    const start = inhalt.indexOf(anker) + anker.length;
    const ende = inhalt.indexOf('}', start);
    return inhalt.slice(start, ende);
}

/** Die Deklarationen eines Rumpfes als normalisierte `eigenschaft: wert`-Liste. */
function deklarationen(rumpf) {
    return rumpf
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split(';')
        .map(z => z.trim().replace(/\s+/g, ' '))
        .filter(Boolean);
}

/**
 * Der Kommentarblock, der UNMITTELBAR vor dem Anker steht (nur Leerraum
 * dazwischen). Fehlt er, ist das ein Befund fuer sich: die drei Zeilen sind
 * ohne Begruendung nicht zu verstehen.
 */
function kommentarVor(inhalt, anker) {
    const i = inhalt.indexOf(anker);
    if (i < 0) throw new Error(`Anker ${JSON.stringify(anker)} nicht gefunden`);
    const davor = inhalt.slice(0, i);
    const ende = davor.lastIndexOf('*/');
    if (ende < 0) return null;
    if (davor.slice(ende + 2).trim() !== '') return null;
    const start = davor.lastIndexOf('/*', ende);
    return start < 0 ? null : davor.slice(start, ende + 2);
}

/* ------------------------------------------------------------------ BAUART */

/** Reitername, Datei, Anker, Bezeichnung — die fuenf Master-Detail-Schalen. */
const SCHALEN = [
    ['Orte', 'core.css', '.loc-view.active {'],
    ['NSCs', 'npcs.css', '.npc-view.active {'],
    ['Schatzkammer', 'npcs.css', '.loot-view.active {'],
    ['Begegnungen', 'encounters.css', '.enc-view.active {'],
    ['Bestiar', 'bestiary.css', '\n.bestiary-view.active {']
];

/**
 * Die Bauart, auf die die Korrektur alle fuenf gebracht hat.
 *
 * Die dritte Zeile hiess bis 2026-10 `height: calc(100vh - 120px)`. Die
 * Gleichstellung aller fuenf auf diese Zahl hat den UNTERSCHIED beseitigt, nicht
 * den Fehler: 120px waren selbst zu wenig, die Umrahmung ist 134px hoch (102
 * Kopfzeile + 16 + 16 Innenabstand von .main-content) und mit stehendem
 * Umzugs-Band 195px. Seit U6 kommt das Budget aus der gemessenen Versatzkette
 * (`--view-frame-height`, updateStickyOffsets()); der Rueckfallwert 134px gilt
 * nur vor deren erstem Lauf. Beleg: tests/e2e/features/hoehenbudget.spec.js.
 */
const BAUART = [
    'display: flex',
    'flex-direction: column',
    'height: calc(100vh - var(--view-frame-height, 134px))',
    'overflow: hidden'
];

describe('Ansichts-Schalen — Bauart', () => {
    test('die fuenf Master-Detail-Schalen fuehren dieselben vier Deklarationen', () => {
        // Gegenprobe: ohne Schalen liefe die Schleife ueber Leerlauf.
        expect(SCHALEN.length).toBe(5);

        const befunde = [];
        SCHALEN.forEach(([name, datei, anker]) => {
            const ist = deklarationen(regelRumpf(lies(datei), anker));
            if (ist.join(' | ') !== BAUART.join(' | ')) {
                befunde.push(
                    `${name} (${datei}): [${ist.join(' | ')}] — ` +
                        `erwartet [${BAUART.join(' | ')}]`
                );
            }
        });
        expect(befunde).toEqual([]);
    });
});

/* --------------------------------------------------------------- AKTENLAGE */

/**
 * Je mitgezogene Deklaration: wo ihr Kommentar steht, welche Wendungen die
 * Messung widerlegt hat (`verboten`) und welchen Befund der Kommentar nennen
 * muss (`gefordert`).
 *
 * Zu `Ohne diese Zeile` in core.css: die Wendung ist nicht an sich falsch, aber
 * sie stand dort vor genau der Zahl (805px), die die Ruecknahme dieser einen
 * Zeile NICHT hervorbringt. Wer den Gegenfall dieser Zeile beschreibt, muss die
 * zweite Bedingung mitnennen — das verlangt `gefordert: /BEIDE/`.
 */
const AKTENLAGE = [
    {
        was: 'encounters.css `overflow: hidden` an .enc-view.active',
        datei: 'encounters.css',
        anker: '.enc-view.active {',
        verboten: [/ins Gegenteil/, /EINZIGE/, /liess den letzten Eintrag/],
        gefordert: [/wirkungslos/, /core\.css/]
    },
    {
        was: 'core.css `grid-template-rows: minmax(0, 1fr)` an der Rasterregel',
        datei: 'core.css',
        anker: 'grid-template-rows: minmax(0, 1fr);',
        verboten: [/Ohne diese Zeile/],
        gefordert: [/BEIDE/]
    },
    {
        was: 'npcs.css Hoehenbudget an .loot-view.active',
        datei: 'npcs.css',
        anker: '.loot-view.active {',
        verboten: [/ausserhalb des klickbaren Bereichs/],
        gefordert: [/erreichbar/]
    }
];

describe('Ansichts-Schalen — Aktenlage der mitgezogenen Zeilen', () => {
    test('kein Kommentar schreibt seiner Zeile eine widerlegte Wirkung zu', () => {
        // Gegenprobe: ohne Eintraege liefe die Schleife ueber Leerlauf.
        expect(AKTENLAGE.length).toBe(3);

        const befunde = [];
        AKTENLAGE.forEach(eintrag => {
            const block = kommentarVor(lies(eintrag.datei), eintrag.anker);
            if (!block) {
                befunde.push(`${eintrag.was}: kein Kommentarblock unmittelbar davor`);
                return;
            }
            eintrag.verboten.forEach(muster => {
                if (muster.test(block)) {
                    befunde.push(
                        `${eintrag.was}: fuehrt die widerlegte Wendung ${muster} — ` +
                            `die Messung im Kopf dieser Datei sagt das Gegenteil`
                    );
                }
            });
            eintrag.gefordert.forEach(muster => {
                if (!muster.test(block)) {
                    befunde.push(
                        `${eintrag.was}: nennt den Messbefund ${muster} nicht — ` +
                            `eine Begruendung ohne Messung ist wieder nur eine Behauptung`
                    );
                }
            });
        });
        expect(befunde.sort()).toEqual([]);
    });
});
