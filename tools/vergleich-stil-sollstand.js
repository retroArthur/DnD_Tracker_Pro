'use strict';

/**
 * vergleich-stil-sollstand — Design-Handoff v3, Welle 5 (Pruefbefund W5-E Runde 1)
 *
 * WARUM ES DIESES WERKZEUG GIBT. Jede Welle, die berechnete Stile absichtlich
 * aendert, muss den Stil-Sollstand
 * (`tests/e2e/baselines/computed-style-baseline.json`) danach neu erheben — so
 * steht es im Kopf von `tests/e2e/features/computed-style-diff.spec.js`, und
 * die Wellen W5-C, W5-D und W5-E haben es dreimal getan. Die Neuerhebung
 * SCHREIBT den einzigen Waechter im Baum neu, der eine unbeabsichtigte
 * Bildaenderung faengt. Sie ist deshalb nur zulaessig, wenn vorher beziffert
 * ist, WAS sich bewegt hat und WARUM — und genau diese Rechnung ist in W5-E
 * von Hand gefuehrt worden und falsch ausgefallen.
 *
 * DER IRRTUM, GEGEN DEN DIESES WERKZEUG GEBAUT IST. Der Sollstand traegt je
 * Ansicht ZWEI Felder: `keys` (die Liste der Elementsignaturen) und `digests`
 * (die Hashwerte dazu). Wer `keys` vergleicht, sieht Zugaenge und Abgaenge —
 * aber eine Wertaenderung an einem BESTEHENDEN Schluessel ist auf den
 * Schluessellisten unsichtbar, weil sich der Schluessel dabei nicht aendert.
 * Fuer W5-E ergab die Schluesselmengen-Rechnung "0 geaendert, 63 Zugaenge, 0
 * Abgaenge"; auf den Werten gerechnet sind es **284 geaendert**, 63 Zugaenge,
 * 0 Abgaenge. Die Zahl 0 ist dreimal in den Baum gelangt (Commit-Nachricht
 * 4de0e3a, Aktenlage, Bericht), und mit ihr der Satz, es sei nichts zu
 * beweisen. `vergleiche()` rechnet ausschliesslich auf `digests`.
 *
 * WAS DIE REKONSTRUKTION LEISTET, und warum sie der Kern ist. Die Zahl "284
 * bewegt" allein ist noch kein Freispruch: bewegt haben koennte sich auch eine
 * Farbe, ein Rahmen, ein Schatten. Der Digest ist ein SHA-256 ueber zwoelf
 * Eigenschaften in fester Reihenfolge und sagt nur DASS, nicht WAS. Also:
 * nimm den heutigen Satz aller zwoelf Werte aus dem lokalen Vollabzug, ersetze
 * darin NUR die Eigenschaften, deren Aenderung die Welle beabsichtigt hat,
 * durch Kandidatenwerte, und pruefe, ob eine Kombination den ALTEN Digest
 * exakt reproduziert. Trifft sie, sind die uebrigen zehn Eigenschaften
 * unveraendert — bewiesen, nicht behauptet —, und der alte Wert ist nebenbei
 * wiederhergestellt. Trifft keine, hat sich etwas anderes bewegt, und das ist
 * ein Befund.
 * Fuer W5-E: 284 von 284 erklaert, 0 unerklaert, verteilt auf 38 Signaturen
 * (194 Digests Gewicht 700 -> 600, 81 Groesse 13,3333 -> 12 px, 6 Groesse
 * 17,6 -> 16 px, 3 Groesse 13,6 -> 12 px).
 *
 * WAS ES NICHT IST — und das steht hier, weil CLAUDE.md fuer genau diese
 * Unehrlichkeit eine eigene Mahnung fuehrt (Phase 15, GATE-04: ein `--check`,
 * das niemand fahrt, ist eine Behauptung). Dies ist KEIN Tor und laeuft in
 * KEINER Pipeline. Die Rekonstruktion braucht zwei Eingaben, die in der CI
 * nicht liegen:
 *   - den lokalen Vollabzug `tests/e2e/test-results/computed-style-snapshot.json`
 *     (per `.gitignore` ausgeschlossen, entsteht bei jedem Lauf des
 *     Vergleichslaufs, auch bei einem roten),
 *   - die Vorfassung des Sollstands aus der Git-Historie
 *     (`actions/checkout@v7` holt Tiefe 1).
 * Es ist ein HANDGEFAHRENES Berichtswerkzeug fuer den Augenblick der
 * Neuerhebung — dieselbe Bauart und dieselbe Einschraenkung wie `--verlauf` in
 * `tools/check-f18-kaskade.js`. Ueber den echten Sollstand urteilt weiterhin
 * der Vergleichslauf in der E2E-Suite, bei jedem Lauf.
 * Geprueft wird das Werkzeug von `tests/unit/stil-sollstand-vergleich.test.js`.
 *
 * AUFRUF:
 *   node tools/vergleich-stil-sollstand.js --alt <ref|datei> [--neu <ref|datei>]
 *                                          [--vollabzug <datei>] [--schluessel]
 *
 *   --alt         Vorfassung. Entweder ein Dateipfad oder eine Git-Referenz
 *                 (dann wird `git show <ref>:<sollstandpfad>` gelesen).
 *   --neu         Nachfassung, Standard: die Datei im Arbeitsbaum.
 *   --vollabzug   Lokaler Vollabzug fuer die Rekonstruktion. Ohne ihn wird nur
 *                 gezaehlt, nicht zugeordnet.
 *   --schluessel  Nennt zusaetzlich jeden bewegten Schluessel einzeln.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const SOLLSTAND_REL = 'tests/e2e/baselines/computed-style-baseline.json';
const SPEC_REL = 'tests/e2e/features/computed-style-diff.spec.js';
const VOLLABZUG_REL = 'tests/e2e/test-results/computed-style-snapshot.json';

/**
 * Die zwoelf Eigenschaften und die Digestlaenge werden AUS DEM VERGLEICHSLAUF
 * GELESEN, nicht hier nachgebaut. Zwei handgepflegte Kopien derselben Liste
 * sind die Fehlerklasse ARCH-01 (`build.py` gegen `loader.js`); dieselbe
 * Vorsicht gilt fuer die Reihenfolge, denn `digestElement()` verkettet nach
 * ihr. Weicht die Liste ab, ist jede Rekonstruktion wertlos — darum ist das
 * Fehlschlagen hier hart und nicht stillschweigend.
 */
function leseVertragAusSpec() {
    const quelle = fs.readFileSync(path.join(REPO, SPEC_REL), 'utf8');
    const block = quelle.match(/const PROPERTIES = \[([\s\S]*?)\];/);
    if (!block) throw new Error(`PROPERTIES nicht in ${SPEC_REL} gefunden`);
    const eigenschaften = block[1]
        .split(',')
        .map(s => s.trim().replace(/^'|'$/g, ''))
        .filter(Boolean);
    const laenge = quelle.match(/const DIGEST_HEX_LENGTH = (\d+);/);
    if (!laenge) throw new Error(`DIGEST_HEX_LENGTH nicht in ${SPEC_REL} gefunden`);
    return { eigenschaften, digestLaenge: Number(laenge[1]) };
}

const VERTRAG = leseVertragAusSpec();
const EIGENSCHAFTEN = VERTRAG.eigenschaften;
const DIGEST_HEX_LAENGE = VERTRAG.digestLaenge;

// Trennzeichen wie im Vergleichslauf: U+241F, kommt in keinem berechneten Wert vor.
const TRENNER = '␟';

/**
 * Digest eines Elementsatzes — Zeichen fuer Zeichen die Rechnung von
 * `digestElement()` im Vergleichslauf, inklusive des Leerzeichens fuer eine
 * fehlende Eigenschaft.
 * @param {Record<string,string>} satz
 * @returns {string}
 */
function digest(satz) {
    const serialisiert = EIGENSCHAFTEN.map(p =>
        Object.prototype.hasOwnProperty.call(satz, p) ? String(satz[p]) : ' '
    ).join(TRENNER);
    return crypto
        .createHash('sha256')
        .update(serialisiert)
        .digest('hex')
        .slice(0, DIGEST_HEX_LAENGE);
}

/**
 * Vergleicht zwei Sollstands-Fassungen auf den DIGESTWERTEN.
 *
 * Drei Arten, getrennt gezaehlt und nicht vermischt: geaenderter Wert an einem
 * gemeinsamen Schluessel, Zugang (Schluessel nur in der Nachfassung), Abgang
 * (Schluessel nur in der Vorfassung). Die erste Art ist die, die eine
 * Schluesselmengen-Rechnung nicht sehen kann.
 *
 * @param {object} alt Vorfassung
 * @param {object} neu Nachfassung
 * @returns {{durchgaenge: object, summe: object, geaenderteSchluessel: string[],
 *            neueSchluessel: string[], weggefalleneSchluessel: string[]}}
 */
function vergleiche(alt, neu) {
    const durchgaenge = {};
    const summe = { vorher: 0, nachher: 0, geaendert: 0, zugang: 0, abgang: 0 };
    const geaenderteSchluessel = [];
    const neueSchluessel = [];
    const weggefalleneSchluessel = [];

    for (const durchgang of Object.keys(alt)) {
        const z = { vorher: 0, nachher: 0, geaendert: 0, zugang: 0, abgang: 0 };
        const ansichten = new Set([
            ...Object.keys(alt[durchgang] || {}),
            ...Object.keys(neu[durchgang] || {})
        ]);
        for (const ansicht of ansichten) {
            const da = ((alt[durchgang] || {})[ansicht] || {}).digests || {};
            const db = ((neu[durchgang] || {})[ansicht] || {}).digests || {};
            z.vorher += Object.keys(da).length;
            z.nachher += Object.keys(db).length;
            for (const k of Object.keys(da)) {
                if (!(k in db)) {
                    z.abgang++;
                    weggefalleneSchluessel.push(`${durchgang}/${ansicht}/${k}`);
                } else if (da[k] !== db[k]) {
                    z.geaendert++;
                    geaenderteSchluessel.push(`${durchgang}/${ansicht}/${k}`);
                }
            }
            for (const k of Object.keys(db)) {
                if (!(k in da)) {
                    z.zugang++;
                    neueSchluessel.push(`${durchgang}/${ansicht}/${k}`);
                }
            }
        }
        durchgaenge[durchgang] = z;
        for (const f of Object.keys(summe)) summe[f] += z[f];
    }

    return { durchgaenge, summe, geaenderteSchluessel, neueSchluessel, weggefalleneSchluessel };
}

/** Die beiden Eigenschaften, die die Welle 5 beabsichtigt bewegt hat. */
const STANDARD_KANDIDATEN_EIGENSCHAFTEN = ['fontSize', 'fontWeight'];

/** Kurzname fuer die Meldung — deutsche UI-Sprache, wie der Rest der Berichte. */
const EIGENSCHAFT_KURZ = { fontSize: 'Groesse', fontWeight: 'Gewicht' };

/**
 * Sammelt die im Vollabzug vorkommenden Werte einer Eigenschaft — die
 * natuerliche Kandidatenmenge: ein alter Wert ist fast immer einer, der
 * irgendwo im Baum weiter vorkommt (13,3333 px etwa an jedem noch
 * ungestalteten Bedienelement).
 * @param {object} abzug
 * @param {string} eigenschaft
 * @returns {string[]}
 */
function werteAusAbzug(abzug, eigenschaft) {
    const menge = new Set();
    for (const durchgang of Object.keys(abzug)) {
        for (const ansicht of Object.keys(abzug[durchgang] || {})) {
            const els = ((abzug[durchgang] || {})[ansicht] || {}).elements || {};
            for (const k of Object.keys(els)) {
                const w = els[k][eigenschaft];
                if (w !== undefined) menge.add(String(w));
            }
        }
    }
    return [...menge];
}

/**
 * Baut die Kandidatenmengen fuer die Rekonstruktion: alles, was im Abzug
 * vorkommt, plus ein feines px-Raster fuer Groessen, die es heute nirgends
 * mehr gibt, plus die neun Gewichtsstufen und ihre Schluesselwoerter.
 * @param {object} abzug
 * @returns {Record<string,string[]>}
 */
function standardKandidaten(abzug) {
    const groessen = new Set(werteAusAbzug(abzug, 'fontSize'));
    // 5,00 bis 48,00 px in Hundertstelschritten — Chromium rundet berechnete
    // Groessen auf sechs signifikante Stellen, die praktisch vorkommenden
    // Werte liegen alle auf zwei Dezimalen oder sind unten einzeln ergaenzt.
    for (let px = 500; px <= 4800; px++) {
        groessen.add((px / 100).toFixed(2).replace(/\.?0+$/, '') + 'px');
    }
    // Die em-Rechnungen des Altbestands ergeben wiederkehrende Drittelwerte,
    // die das Hundertstelraster nicht trifft.
    for (const extra of [
        '13.3333px',
        '11.1111px',
        '12.2222px',
        '10.6667px',
        '8.88889px',
        '17.6px',
        '14.4px',
        '16.8px',
        '19.2px',
        '21.6px',
        '9.6px',
        '11.2px',
        '12.8px',
        '15.4px',
        '7.70667px',
        '13.6px',
        '16.32px'
    ]) {
        groessen.add(extra);
    }
    const gewichte = new Set(werteAusAbzug(abzug, 'fontWeight'));
    for (const g of [
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',
        '900',
        'normal',
        'bold'
    ]) {
        gewichte.add(g);
    }
    return { fontSize: [...groessen], fontWeight: [...gewichte] };
}

/**
 * Weist eigenschaftsgenau nach, WAS sich an den bewegten Digests bewegt hat.
 *
 * @param {object} alt Vorfassung des Sollstands
 * @param {object} neu Nachfassung des Sollstands
 * @param {object} abzug Lokaler Vollabzug, passend zur NACHfassung
 * @param {{kandidaten?: Record<string,string[]>}} [opts]
 * @returns {{bewegt: number, erklaert: number, unerklaert: string[], zuordnung: object[]}}
 */
function rekonstruiere(alt, neu, abzug, opts = {}) {
    const kandidaten = opts.kandidaten || standardKandidaten(abzug);
    const felder = Object.keys(kandidaten).filter(f => EIGENSCHAFTEN.includes(f));
    if (felder.length === 0) throw new Error('keine gueltige Eigenschaft in den Kandidaten');

    let bewegt = 0;
    let erklaert = 0;
    const unerklaert = [];
    const nachSignatur = new Map();

    for (const durchgang of Object.keys(alt)) {
        for (const ansicht of Object.keys(alt[durchgang] || {})) {
            const da = ((alt[durchgang] || {})[ansicht] || {}).digests || {};
            const db = ((neu[durchgang] || {})[ansicht] || {}).digests || {};
            const els = ((abzug[durchgang] || {})[ansicht] || {}).elements || {};
            for (const k of Object.keys(da)) {
                if (!(k in db) || da[k] === db[k]) continue;
                bewegt++;
                const ort = `${durchgang}/${ansicht}/${k}`;
                const satz = els[k];
                if (!satz) {
                    unerklaert.push(`${ort}: nicht im Vollabzug`);
                    continue;
                }
                // Gegenprobe gegen die naechstliegende Fehlbedienung: ein
                // Vollabzug aus einem anderen Baumzustand als die Nachfassung.
                // Ohne sie rechnete die Rekonstruktion auf fremden Werten.
                if (digest(satz) !== db[k]) {
                    unerklaert.push(`${ort}: Vollabzug passt nicht zum neuen Digest`);
                    continue;
                }
                const treffer = sucheKombination(satz, da[k], felder, kandidaten);
                if (!treffer) {
                    unerklaert.push(
                        `${ort}: keine Kombination aus ${felder.join('/')} reproduziert den alten Digest`
                    );
                    continue;
                }
                erklaert++;
                const was = felder
                    .filter(f => treffer[f] !== satz[f])
                    .map(f => `${EIGENSCHAFT_KURZ[f] || f} ${treffer[f]} -> ${satz[f]}`);
                const signatur = k.replace(/#\d+$/, '');
                const kennung = `${signatur}\u0000${was.join(', ')}`;
                nachSignatur.set(kennung, (nachSignatur.get(kennung) || 0) + 1);
            }
        }
    }

    const zuordnung = [...nachSignatur.entries()]
        .map(([kennung, anzahl]) => {
            const [signatur, aenderung] = kennung.split('\u0000');
            return { signatur, aenderung, anzahl };
        })
        .sort(
            (a, b) =>
                b.anzahl - a.anzahl ||
                a.signatur.localeCompare(b.signatur) ||
                a.aenderung.localeCompare(b.aenderung)
        );

    return { bewegt, erklaert, unerklaert, zuordnung };
}

/**
 * Durchlaeuft das Kreuzprodukt der Kandidatenwerte und liefert die erste
 * Kombination, die den Zieldigest trifft — oder null.
 * @param {Record<string,string>} satz
 * @param {string} ziel
 * @param {string[]} felder
 * @param {Record<string,string[]>} kandidaten
 * @returns {Record<string,string>|null}
 */
function sucheKombination(satz, ziel, felder, kandidaten) {
    const probe = { ...satz };
    // Der HEUTIGE Wert gehoert in jede Kandidatenmenge, auch wenn der Aufrufer
    // ihn nicht nennt: bewegt sich an einem Element nur die Groesse, muss das
    // Gewicht auf seinem unveraenderten Wert stehen bleiben koennen. Ohne diese
    // Ergaenzung bliebe genau dieser — haeufigste — Fall unerklaert, und zwar
    // stillschweigend als "andere Eigenschaft bewegt". Bei der vollen
    // Kandidatenmenge aus dem Vollabzug fiel es nicht auf, weil die heutigen
    // Werte dort ohnehin alle vorkommen; bei einer engen Menge ist es tragend.
    const mengen = {};
    for (const feld of felder) {
        const m = new Set(kandidaten[feld]);
        if (Object.prototype.hasOwnProperty.call(satz, feld)) m.add(satz[feld]);
        mengen[feld] = [...m];
    }
    const laufe = tiefe => {
        if (tiefe === felder.length) {
            return digest(probe) === ziel ? { ...probe } : null;
        }
        const feld = felder[tiefe];
        for (const wert of mengen[feld]) {
            probe[feld] = wert;
            const t = laufe(tiefe + 1);
            if (t) return t;
        }
        probe[feld] = satz[feld];
        return null;
    };
    return laufe(0);
}

/**
 * Formt das Ergebnis von `vergleiche()` als Tabelle — die Form, die in eine
 * Commit-Nachricht und in die Aktenlage gehoert. Die Kopfzeile nennt
 * ausdruecklich, dass auf WERTEN gerechnet wurde; der Bericht, der den Befund
 * erzeugt hat, liess genau diese Angabe offen.
 * @param {ReturnType<typeof vergleiche>} e
 * @param {{schluessel?: boolean}} [opts]
 * @returns {string}
 */
function bericht(e, opts = {}) {
    const z = [];
    z.push('Stil-Sollstand, verglichen auf den DIGESTWERTEN (nicht auf den Schluesselmengen):');
    z.push('');
    z.push('    Durchgang       vorher  nachher  geaendert  Zugaenge  Abgaenge');
    z.push('    --------------  ------  -------  ---------  --------  --------');
    const zeile = (name, s) =>
        '    ' +
        name.padEnd(14) +
        '  ' +
        String(s.vorher).padStart(6) +
        '  ' +
        String(s.nachher).padStart(7) +
        '  ' +
        String(s.geaendert).padStart(9) +
        '  ' +
        String(s.zugang).padStart(8) +
        '  ' +
        String(s.abgang).padStart(8);
    for (const [name, s] of Object.entries(e.durchgaenge)) z.push(zeile(name, s));
    z.push('    ----------------------------------------------------------------');
    z.push(zeile('SUMME', e.summe));
    if (opts.schluessel && e.geaenderteSchluessel.length) {
        z.push('');
        z.push('Bewegte Schluessel:');
        for (const k of e.geaenderteSchluessel) z.push('    ' + k);
    }
    return z.join('\n');
}

/**
 * Formt das Ergebnis von `rekonstruiere()`.
 * @param {ReturnType<typeof rekonstruiere>} r
 * @returns {string}
 */
function berichtRekonstruktion(r) {
    const z = [];
    z.push('');
    z.push('Eigenschaftsgenaue Zuordnung der bewegten Digests:');
    z.push(`    bewegt:     ${r.bewegt}`);
    z.push(`    erklaert:   ${r.erklaert}`);
    z.push(`    unerklaert: ${r.unerklaert.length}`);
    if (r.unerklaert.length) {
        z.push('');
        z.push('UNERKLAERT — hier hat sich eine andere Eigenschaft bewegt:');
        for (const u of r.unerklaert) z.push('    ' + u);
    }
    if (r.zuordnung.length) {
        z.push('');
        z.push('    Anzahl  Signatur / Aenderung');
        for (const e of r.zuordnung) {
            z.push(`    ${String(e.anzahl).padStart(6)}  ${e.signatur} | ${e.aenderung}`);
        }
    }
    return z.join('\n');
}

/**
 * Liest eine Fassung: Dateipfad, oder Git-Referenz (dann per `git show`).
 * @param {string} angabe
 * @returns {object}
 */
function leseFassung(angabe) {
    if (fs.existsSync(angabe)) return JSON.parse(fs.readFileSync(angabe, 'utf8'));
    const roh = execFileSync('git', ['show', `${angabe}:${SOLLSTAND_REL}`], {
        cwd: REPO,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024
    });
    return JSON.parse(roh);
}

function main(argv) {
    const arg = name => {
        const i = argv.indexOf(name);
        return i >= 0 ? argv[i + 1] : null;
    };
    const altAngabe = arg('--alt');
    if (!altAngabe) {
        process.stdout.write(
            'Aufruf: node tools/vergleich-stil-sollstand.js --alt <ref|datei> ' +
                '[--neu <ref|datei>] [--vollabzug <datei>] [--schluessel]\n'
        );
        return 2;
    }
    const neuAngabe = arg('--neu') || path.join(REPO, SOLLSTAND_REL);
    const alt = leseFassung(altAngabe);
    const neu = leseFassung(neuAngabe);
    const e = vergleiche(alt, neu);
    process.stdout.write(bericht(e, { schluessel: argv.includes('--schluessel') }) + '\n');

    const abzugAngabe = arg('--vollabzug') || path.join(REPO, VOLLABZUG_REL);
    if (!fs.existsSync(abzugAngabe)) {
        process.stdout.write(
            `\nKein Vollabzug unter ${abzugAngabe} — nur gezaehlt, nicht zugeordnet.\n` +
                'Der Abzug entsteht bei jedem Lauf des Vergleichslaufs:\n' +
                '    npx playwright test tests/e2e/features/computed-style-diff.spec.js\n'
        );
        return 0;
    }
    const abzug = JSON.parse(fs.readFileSync(abzugAngabe, 'utf8'));
    const r = rekonstruiere(alt, neu, abzug);
    process.stdout.write(berichtRekonstruktion(r) + '\n');
    return r.unerklaert.length === 0 ? 0 : 1;
}

if (require.main === module) {
    process.exitCode = main(process.argv.slice(2));
}

module.exports = {
    EIGENSCHAFTEN,
    DIGEST_HEX_LAENGE,
    STANDARD_KANDIDATEN_EIGENSCHAFTEN,
    SOLLSTAND_REL,
    VOLLABZUG_REL,
    digest,
    vergleiche,
    rekonstruiere,
    standardKandidaten,
    werteAusAbzug,
    bericht,
    berichtRekonstruktion,
    leseFassung
};
