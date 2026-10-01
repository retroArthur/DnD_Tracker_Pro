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

/**
 * Bezeichnung, Datei, Anker, Reitername — die fuenf Master-Detail-Schalen.
 *
 * Der vierte Eintrag ist der Name, unter dem `switchView()` die Ansicht
 * anfaehrt; die Deckungs-Ratsche weiter unten braucht ihn, um die Liste der
 * Messmatrix in tests/e2e/features/hoehenbudget.spec.js gegen diese fuenf zu
 * halten. Die BAUART-Probe liest ihn nicht und bleibt davon unberuehrt.
 */
const SCHALEN = [
    ['Orte', 'core.css', '.loc-view.active {', 'locations'],
    ['NSCs', 'npcs.css', '.npc-view.active {', 'npcs'],
    ['Schatzkammer', 'npcs.css', '.loot-view.active {', 'loot'],
    ['Begegnungen', 'encounters.css', '.enc-view.active {', 'encounter'],
    ['Bestiar', 'bestiary.css', '\n.bestiary-view.active {', 'bestiary']
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

/* ------------------------------------------------------- DECKUNG DER MATRIX */

/**
 * WARUM ES DIESE DRITTE RATSCHE BRAUCHT (M3, Runde 1). Die Messmatrix in
 * tests/e2e/features/hoehenbudget.spec.js fuhr VIER der fuenf Schalen — und
 * schrieb in ihren eigenen Kommentar, die Schalen trugen "VIER unabhaengige
 * `height: calc(100vh - var(--view-frame-height, ..))`-Deklarationen in drei
 * Stilblaettern". Gezaehlt sind es FUENF in VIER (bestiary.css, core.css,
 * encounters.css, npcs.css zweimal): die Bestiar-Schale fehlte in der Liste UND
 * in der Bestandsaufnahme. Der zweite Teil ist der schlimmere — eine Luecke,
 * die sich selbst als Vollstaendigkeit ausgibt, sucht niemand.
 *
 * Die Ratsche haelt die beiden Dinge zusammen, die auseinanderlaufen koennen:
 *   1. DECKUNG — die Ansichtsliste, die die Matrix faehrt, nennt alle fuenf
 *      Reiter.
 *   2. ZENSUS — der Kommentar der Matrix nennt dieselben Zahlen, die ein Zaehlen
 *      der Stilblaetter ergibt, und nennt jedes beteiligte Stilblatt beim Namen.
 *
 * Kommt eine sechste Schale hinzu, wird die Ratsche rot, bis beides nachgezogen
 * ist. Sie prueft Quelltext, nicht das Buendel — gemessen wird das Hoehenbudget
 * selbst in hoehenbudget.spec.js; hier steht nur, dass die Messung nichts
 * auslaesst und ihre Bestandsaufnahme stimmt.
 */
const MATRIX_SPEC = path.join(REPO, 'tests', 'e2e', 'features', 'hoehenbudget.spec.js');

/** Die Deklaration, auf die BAUART alle fuenf Schalen gebracht hat. */
const BUDGET_ZEILE = 'height: calc(100vh - var(--view-frame-height';

/** Deutsche Zahlwoerter, so wie die Kommentare dieser Dateien sie schreiben. */
const ZAHLWORT = { eine: 1, zwei: 2, drei: 3, vier: 4, fuenf: 5, sechs: 6, sieben: 7, acht: 8 };

/**
 * Zaehlt die Hoehenbudget-Deklaration ueber ALLE Stilblaetter in assets/styles/
 * — nicht ueber die Liste SCHALEN. Sonst pruefte der Zensus seine eigene
 * Annahme. Dass beide Zahlen zusammenfallen, sichert die erste Zusicherung.
 */
function budgetZensus() {
    const treffer = [];
    fs.readdirSync(STIL)
        .filter(n => n.endsWith('.css'))
        .sort()
        .forEach(name => {
            lies(name)
                .split('\n')
                .forEach((zeile, i) => {
                    if (zeile.includes(BUDGET_ZEILE)) treffer.push(`${name}:${i + 1}`);
                });
        });
    return { treffer, dateien: [...new Set(treffer.map(t => t.split(':')[0]))] };
}

/** Das Array-Literal hinter `marker` bis zu seiner schliessenden Zeile `];`. */
function arrayLiteral(quelle, marker) {
    const i = quelle.indexOf(marker);
    if (i < 0) return null;
    const ende = quelle.indexOf('\n];', i);
    return ende < 0 ? null : quelle.slice(i, ende + 3);
}

/**
 * Die Reiternamen der Ansichtsliste, die die Messmatrix faehrt.
 *
 * Bevorzugt `MATRIX_ANSICHTEN`; fehlt die, faellt der Waechter auf `ANSICHTEN`
 * zurueck — sonst meldete er eine fehlende Variable statt der fehlenden
 * Deckung, und das waere die unbrauchbarere Fehlermeldung von beiden. Ein
 * `...ANSICHTEN` im Literal zieht die vier gesaeten Reiter mit herein.
 */
function matrixReiter(quelle) {
    const vier = arrayLiteral(quelle, 'const ANSICHTEN = [');
    let block = arrayLiteral(quelle, 'const MATRIX_ANSICHTEN = [');
    if (!block) block = vier;
    else if (block.includes('...ANSICHTEN')) block += '\n' + (vier || '');
    if (!block) return null;
    return (block.match(/'([^']+)'/g) || []).map(s => s.slice(1, -1));
}

describe('Ansichts-Schalen — Deckung der Messmatrix', () => {
    test('die Messmatrix faehrt alle fuenf Schalen', () => {
        const zensus = budgetZensus();
        // Gegenprobe: ein Zensus ohne Treffer liesse jede Zusicherung leerlaufen.
        expect(zensus.treffer.length).toBe(SCHALEN.length);

        const quelle = fs.readFileSync(MATRIX_SPEC, 'utf8');
        const reiter = matrixReiter(quelle);

        // Jests `expect` nimmt nur EIN Argument — der Befund muss deshalb IN den
        // verglichenen Wert, nicht in eine Meldung daneben. Dieselbe Bauart wie
        // die beiden Waechter oben in dieser Datei.
        const befunde = [];
        if (!reiter) {
            befunde.push(`keine Ansichtsliste in ${path.basename(MATRIX_SPEC)} gefunden`);
        } else {
            SCHALEN.forEach(([bez, datei, , name]) => {
                if (!reiter.includes(name)) {
                    befunde.push(
                        `die Messmatrix laesst ${bez} ('${name}', ${datei}) aus — ` +
                            `gefahren werden [${reiter.join(', ')}]`
                    );
                }
            });
        }
        expect(befunde).toEqual([]);
    });

    test('der Kommentar der Matrix nennt den gezaehlten Zensus', () => {
        const zensus = budgetZensus();
        const quelle = fs.readFileSync(MATRIX_SPEC, 'utf8');
        const block = kommentarVor(quelle, 'const MATRIX_BREITEN = [');

        const befunde = [];
        if (!block) {
            expect(['kein Kommentarblock unmittelbar vor MATRIX_BREITEN']).toEqual([]);
            return;
        }
        const zahlwort = (muster, was) => {
            const t = block.match(muster);
            if (!t) {
                befunde.push(`der Kommentar nennt ${was} nicht in pruefbarer Form (${muster})`);
                return null;
            }
            const n = ZAHLWORT[t[1].toLowerCase()];
            if (n === undefined) befunde.push(`${was}: "${t[1]}" ist kein gefuehrtes Zahlwort`);
            return n === undefined ? null : n;
        };
        const istDekl = zahlwort(/(\w+) unabhaengige/, 'die Zahl der Deklarationen');
        const istBlatt = zahlwort(/in (\w+) Stilblaettern/, 'die Zahl der Stilblaetter');
        if (istDekl !== null && istDekl !== zensus.treffer.length) {
            befunde.push(
                `der Kommentar behauptet ${istDekl} Deklarationen, gezaehlt sind ` +
                    `${zensus.treffer.length}: ${zensus.treffer.join(', ')}`
            );
        }
        if (istBlatt !== null && istBlatt !== zensus.dateien.length) {
            befunde.push(
                `der Kommentar behauptet ${istBlatt} Stilblaetter, gezaehlt sind ` +
                    `${zensus.dateien.length}: ${zensus.dateien.join(', ')}`
            );
        }
        zensus.dateien.forEach(datei => {
            if (!block.includes(datei)) befunde.push(`der Kommentar nennt ${datei} nicht`);
        });
        expect(befunde).toEqual([]);
    });
});
