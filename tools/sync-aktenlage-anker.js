'use strict';

/**
 * sync-aktenlage-anker — Design-Handoff v3, Welle 2, Schritt 1
 *
 * R-06 in `tests/unit/design-consistency.test.js` bewacht 124 Zeilenanker der
 * Form `datei.css:ZEILE` in `.planning/HANDOFF-V3-OFFENE-PUNKTE.md`. Jede
 * eingefuegte oder entfernte Zeile in einer der 14 gefuehrten CSS-Dateien
 * verschiebt Anker und macht die Ratsche rot — auch dann, wenn die Aenderung
 * inhaltlich voellig in Ordnung ist. Genau das ist in Welle 1 schon einmal
 * passiert (34 von 128 Ankern zeigten nach einem Kommentar-Commit auf eine
 * Leerzeile oder eine schliessende Klammer).
 *
 * Welle 2 fasst dieselben 14 Dateien an. Dieses Werkzeug leitet die Anker aus
 * dem CSS neu her, damit die Aktenlage nicht von Hand nachgezaehlt werden
 * muss:
 *
 *     node tools/sync-aktenlage-anker.js --check    meldet Abweichungen, Exit 1
 *     node tools/sync-aktenlage-anker.js --write    schreibt sie in die Akte
 *     node tools/sync-aktenlage-anker.js --json     maschinenlesbarer Befund
 *
 * ES IST KEIN ZWEITES URTEIL, SONDERN DASSELBE. Die beiden Zerlegungen unten
 * (`gefuehrteStellen`, `farbstellen`) sind zeichengleiche Nachbildungen der
 * Funktionen, die R-06 benutzt. Wer eine davon aendert, ohne die Ratsche
 * mitzuaendern, bekommt ein Werkzeug, das eine Akte "repariert", die der Test
 * danach trotzdem verwirft. Die Zuordnung (welcher Anker gehoert zu welcher
 * Deklaration) ist die EINZIGE Zutat, die R-06 nicht hat: der Test prueft
 * `zeile -> Deklaration`, das Werkzeug muss `Selektor + Rolle -> Zeile`
 * rueckwaerts aufloesen.
 *
 * Formvorbild: `tools/css-usage-report.js` (strikter Modus, nur die beiden
 * Node-Standardmodule, benannte Konstanten fuer Pfade, Kernfunktionen einzeln
 * exportiert, Direktaufruf-Zweig am Ende).
 */

const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const CSS_DIR = path.join(REPO, 'assets', 'styles');
const AKTE = path.join(REPO, '.planning', 'HANDOFF-V3-OFFENE-PUNKTE.md');

// ----------------------------------------------------------------------
// Zerlegung 1: die CSS-Seite. Zeichenweise, damit einzeilige Regeln
// (`.a { margin: 0; color: var(--gold); }`) genauso erfasst werden wie
// mehrzeilige. Nachbildung von `farbstellen()` in R-06.
// ----------------------------------------------------------------------
function farbstellen(cssText) {
    const zeilen = cssText.split(/\r?\n/);
    const out = [];
    const stapel = [];
    let selBuf = '';
    for (let i = 0; i < zeilen.length; i++) {
        let buf = '';
        const roh = zeilen[i];
        for (let c = 0; c < roh.length; c++) {
            const ch = roh[c];
            if (ch === '{') {
                stapel.push(
                    (selBuf + buf)
                        .replace(/\/\*[\s\S]*?\*\//g, '')
                        .replace(/\s+/g, ' ')
                        .trim()
                );
                selBuf = '';
                buf = '';
            } else if (ch === '}') {
                stapel.pop();
                selBuf = '';
                buf = '';
            } else if (ch === ';') {
                const m = buf.trim().match(/^color\s*:\s*var\(\s*(--[\w-]+)\s*\)$/);
                if (m && stapel.length) {
                    out.push({ zeile: i + 1, sel: stapel[stapel.length - 1], rolle: m[1] });
                }
                buf = '';
            } else buf += ch;
        }
        selBuf += buf + ' ';
        if (!stapel.length && /^\s*$/.test(roh)) selBuf = '';
    }
    return out;
}

// ----------------------------------------------------------------------
// Zerlegung 2: die Aktenseite. Tabellenzeilen der Gruppen A-D und der
// Codeblock der Gruppe E. Nachbildung von `gefuehrteStellen()` in R-06,
// zusaetzlich mit dem Zeilenindex der Akte, den das Schreiben braucht.
// ----------------------------------------------------------------------
const TABELLENZEILE = /^\|\s*`([\w-]+\.css):(\d+)`\s*\|\s*`([^`]+)`\s*\|\s*`(--[\w-]+)`\s*\|/;
const GRUPPE_E_EINTRAG = /^(\s+)(\d+)(\s+)(\S.*?)\s*$/;

function gefuehrteStellen(text) {
    const out = [];
    let inE = false;
    let aktDatei = null;
    text.split(/\r?\n/).forEach((l, i) => {
        const t = l.match(TABELLENZEILE);
        if (t) {
            out.push({
                art: 'tabelle',
                akteZeile: i,
                datei: t[1],
                zeile: Number(t[2]),
                sel: t[3],
                rolle: t[4]
            });
            return;
        }
        if (/^### Gruppe E/.test(l)) {
            inE = true;
            return;
        }
        if (/^### /.test(l)) inE = false;
        if (!inE) return;
        const d = l.match(/^([\w-]+\.css)\s*$/);
        if (d) {
            aktDatei = d[1];
            return;
        }
        const e = l.match(GRUPPE_E_EINTRAG);
        if (e && aktDatei) {
            out.push({
                art: 'gruppeE',
                akteZeile: i,
                datei: aktDatei,
                zeile: Number(e[2]),
                sel: e[4],
                rolle: null
            });
        }
    });
    return out;
}

// ----------------------------------------------------------------------
// Zuordnung. Ein gefuehrter Anker passt auf eine Deklaration, wenn der
// Selektor uebereinstimmt (oder in deren Selektorliste vorkommt — R-06
// erlaubt das ausdruecklich) und, falls die Akte eine Rolle nennt, auch
// die Rolle. Bleiben mehrere, gewinnt die naechstgelegene noch freie
// Deklaration; Gleichstand wird gemeldet statt geraten.
// ----------------------------------------------------------------------
function passt(kandidat, stelle) {
    const teile = kandidat.sel.split(',').map(x => x.trim());
    if (kandidat.sel !== stelle.sel && !teile.includes(stelle.sel)) return false;
    if (stelle.rolle && kandidat.rolle !== stelle.rolle) return false;
    return true;
}

function zuordnen(stellen, indexProDatei) {
    const ergebnis = [];
    const dateien = [...new Set(stellen.map(s => s.datei))];
    dateien.forEach(datei => {
        const idx = indexProDatei[datei];
        const eigene = stellen.filter(s => s.datei === datei);
        if (!idx) {
            eigene.forEach(s =>
                ergebnis.push({ stelle: s, neu: null, grund: 'Datei gibt es nicht (mehr)' })
            );
            return;
        }
        const kandidaten = new Map(eigene.map(s => [s, idx.filter(k => passt(k, s))]));
        const belegt = new Set();
        // Erst die eindeutigen — sie duerfen den mehrdeutigen nichts wegnehmen.
        const offen = [];
        eigene.forEach(s => {
            const k = kandidaten.get(s);
            if (k.length === 1) {
                belegt.add(k[0].zeile);
                ergebnis.push({ stelle: s, neu: k[0].zeile, grund: null });
            } else offen.push(s);
        });
        // Dann die mehrdeutigen, aufsteigend nach kleinstem Abstand.
        offen
            .slice()
            .sort((a, b) => abstand(a, kandidaten.get(a)) - abstand(b, kandidaten.get(b)))
            .forEach(s => {
                const frei = kandidaten.get(s).filter(k => !belegt.has(k.zeile));
                if (!frei.length) {
                    ergebnis.push({
                        stelle: s,
                        neu: null,
                        grund: kandidaten.get(s).length
                            ? 'alle passenden Deklarationen sind schon einem anderen Anker zugeordnet'
                            : 'keine passende color-var-Deklaration'
                    });
                    return;
                }
                const sortiert = frei
                    .slice()
                    .sort((a, b) => Math.abs(a.zeile - s.zeile) - Math.abs(b.zeile - s.zeile));
                if (
                    sortiert.length > 1 &&
                    Math.abs(sortiert[0].zeile - s.zeile) === Math.abs(sortiert[1].zeile - s.zeile)
                ) {
                    ergebnis.push({
                        stelle: s,
                        neu: null,
                        grund:
                            `mehrdeutig — ${sortiert[0].zeile} und ${sortiert[1].zeile} liegen ` +
                            'gleich weit entfernt'
                    });
                    return;
                }
                belegt.add(sortiert[0].zeile);
                ergebnis.push({ stelle: s, neu: sortiert[0].zeile, grund: null });
            });
    });
    return ergebnis;
}

function abstand(stelle, kandidaten) {
    if (!kandidaten || !kandidaten.length) return Number.MAX_SAFE_INTEGER;
    return Math.min(...kandidaten.map(k => Math.abs(k.zeile - stelle.zeile)));
}

// ----------------------------------------------------------------------
// Befund erheben.
// ----------------------------------------------------------------------
function analyse() {
    const akteText = fs.readFileSync(AKTE, 'utf8');
    const stellen = gefuehrteStellen(akteText);
    const indexProDatei = {};
    [...new Set(stellen.map(s => s.datei))].forEach(datei => {
        const p = path.join(CSS_DIR, datei);
        if (fs.existsSync(p)) indexProDatei[datei] = farbstellen(fs.readFileSync(p, 'utf8'));
    });
    const zuordnung = zuordnen(stellen, indexProDatei);
    const abweichungen = [];
    const ungeloest = [];
    zuordnung.forEach(z => {
        if (z.neu === null) {
            ungeloest.push({
                datei: z.stelle.datei,
                zeile: z.stelle.zeile,
                sel: z.stelle.sel,
                rolle: z.stelle.rolle,
                grund: z.grund
            });
            return;
        }
        if (z.neu !== z.stelle.zeile) {
            abweichungen.push({
                datei: z.stelle.datei,
                alt: z.stelle.zeile,
                neu: z.neu,
                sel: z.stelle.sel,
                rolle: z.stelle.rolle
            });
        }
    });
    return { anker: stellen.length, abweichungen, ungeloest, zuordnung, akteText };
}

// ----------------------------------------------------------------------
// Schreiben. Nur die Zahl wird ersetzt, und in Gruppe E bleibt die
// Feldbreite erhalten — die Akte ist ein Lesedokument, kein Datensatz.
// ----------------------------------------------------------------------
function schreiben(befund) {
    const zeilen = befund.akteText.split(/\r?\n/);
    let n = 0;
    befund.zuordnung.forEach(z => {
        if (z.neu === null || z.neu === z.stelle.zeile) return;
        const i = z.stelle.akteZeile;
        if (z.stelle.art === 'tabelle') {
            zeilen[i] = zeilen[i].replace(
                new RegExp('`' + z.stelle.datei.replace('.', '\\.') + ':' + z.stelle.zeile + '`'),
                '`' + z.stelle.datei + ':' + z.neu + '`'
            );
        } else {
            const m = zeilen[i].match(GRUPPE_E_EINTRAG);
            const breite = m[1].length + m[2].length;
            const neu = String(z.neu);
            const fuell = ' '.repeat(Math.max(1, breite - neu.length));
            zeilen[i] = fuell + neu + m[3] + m[4];
        }
        n++;
    });
    const zeilenende = befund.akteText.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(AKTE, zeilen.join(zeilenende), 'utf8');
    return n;
}

function bericht(befund) {
    const zeilen = [];
    zeilen.push(`Aktenlage: ${AKTE}`);
    zeilen.push(`Gefuehrte Anker: ${befund.anker}`);
    zeilen.push(`Abweichungen:   ${befund.abweichungen.length}`);
    befund.abweichungen.forEach(a => {
        zeilen.push(`  ${a.datei}:${a.alt} -> :${a.neu}   ${a.sel}${a.rolle ? ' ' + a.rolle : ''}`);
    });
    if (befund.ungeloest.length) {
        zeilen.push(`Nicht aufloesbar: ${befund.ungeloest.length}`);
        befund.ungeloest.forEach(u => {
            zeilen.push(
                `  ${u.datei}:${u.zeile}  ${u.sel}${u.rolle ? ' ' + u.rolle : ''} — ${u.grund}`
            );
        });
    }
    return zeilen.join('\n');
}

module.exports = {
    farbstellen,
    gefuehrteStellen,
    passt,
    zuordnen,
    analyse,
    schreiben,
    bericht,
    AKTE,
    CSS_DIR
};

// ----------------------------------------------------------------------
// Direktaufruf-Zweig. --check beendet mit Exit 1, solange Anker abweichen
// oder nicht aufloesbar sind; --write zieht die aufloesbaren nach und
// meldet die uebrigen trotzdem.
// ----------------------------------------------------------------------
if (require.main === module) {
    const args = process.argv.slice(2);
    const willJson = args.includes('--json');
    const willCheck = args.includes('--check');
    const willWrite = args.includes('--write');

    const befund = analyse();

    if (willWrite) {
        const n = schreiben(befund);
        if (!willJson) console.log(`[sync-aktenlage-anker --write] ${n} Anker nachgezogen.`);
    }

    if (willJson) {
        console.log(
            JSON.stringify({
                anker: befund.anker,
                abweichungen: befund.abweichungen,
                ungeloest: befund.ungeloest
            })
        );
    } else if (!willWrite) {
        console.log(bericht(befund));
    }

    if (willCheck) {
        const fehler = befund.abweichungen.length + befund.ungeloest.length;
        if (fehler > 0) {
            console.error(
                `[sync-aktenlage-anker --check] ${befund.abweichungen.length} Abweichung(en) und ` +
                    `${befund.ungeloest.length} nicht aufloesbare Stelle(n) bei ${befund.anker} Ankern.`
            );
            process.exit(1);
        }
        console.error(
            `[sync-aktenlage-anker --check] OK — 0 Abweichungen bei ${befund.anker} Ankern.`
        );
    }
}
