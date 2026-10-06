/**
 * Der Waechter des Sollstands-Vergleichs
 * (Design-Handoff v3, Welle 5, Schritte 6, 7 und 8 — Pruefbefund W5-E Runde 1)
 *
 * WARUM ES DIESE DATEI GIBT. Die Einheit W5-E hat den Stil-Sollstand
 * (`tests/e2e/baselines/computed-style-baseline.json`) bewusst neu erhoben und
 * das Ergebnis mit dem Satz begleitet: "DASS SICH KEIN BESTEHENDER DIGEST
 * BEWEGT, IST GEPRUEFT UND NICHT GEHOFFT" — Tabelle `geaendert: 0` in allen
 * drei Durchgaengen (Commit 4de0e3a). Das war falsch. Gemessen haben sich
 * **284 von 3549** bestehenden Digests bewegt.
 *
 * DER IRRTUM IST EIN DATEIFELD WEIT. Jede Ansicht im Sollstand traegt ZWEI
 * Felder: `keys` (die Liste der Elementsignaturen) und `digests` (die
 * Hashwerte zu diesen Signaturen). Wer `keys` vergleicht, sieht Zugaenge und
 * Abgaenge — aber eine Wertaenderung an einem BESTEHENDEN Schluessel ist auf
 * den Schluessellisten unsichtbar, weil der Schluessel sich gerade nicht
 * aendert. Auf `keys` gerechnet kommt fuer dieselbe Welle exakt
 * "0 geaendert, 63 Zugaenge, 0 Abgaenge" heraus — Ziffer fuer Ziffer die
 * Tabelle, die in der Akte stand. Der Vergleich hat also nicht falsch
 * gerechnet, er hat das falsche Feld gelesen.
 *
 * WARUM DAS EIN BEFUND UND KEINE SCHOENHEITSKORREKTUR IST. Der Sollstand ist
 * der einzige Waechter im Baum, der eine UNBEABSICHTIGTE Bildaenderung faengt:
 * er haengt an zwoelf berechneten Eigenschaften je Element und meldet jede
 * Bewegung, ohne zu wissen, welche gewollt war. Eine Neuerhebung schreibt
 * diesen Waechter neu — und sie ist nur dann zulaessig, wenn vorher bewiesen
 * ist, dass in den bewegten Werten nichts Unbeabsichtigtes steckt. Unter einer
 * Zusage "0 bewegt" bleibt dieser Beweis ungefuehrt, weil es scheinbar nichts
 * zu beweisen gibt. Genau dieser Schritt ist in W5-E ausgefallen.
 *
 * WAS DER WAECHTER ZUSICHERT:
 *   (1) Der Vergleich liest `digests`, nicht `keys`. Belegt an einem Paar, das
 *       sich AUSSCHLIESSLICH in einem Digestwert unterscheidet: das Werkzeug
 *       meldet 1, die Schluesselmengen-Rechnung daneben meldet 0. Beide
 *       Rechnungen stehen im selben Fall, damit der Unterschied in der Suite
 *       liegt und nicht in einem Kommentar.
 *   (2) Beide Richtungen der Schluesselmengen-Aenderung werden weiter gezaehlt
 *       (Zugang und Abgang) — die Wertaenderung tritt NEBEN sie, nicht an ihre
 *       Stelle.
 *   (3) Die Eigenschaftsliste des Vergleichs stammt aus dem Vergleichslauf
 *       selbst (`tests/e2e/features/computed-style-diff.spec.js`) und ist
 *       nicht von Hand nachgebaut. Zwei handgepflegte Kopien derselben Liste
 *       sind die Fehlerklasse, an der dieses Projekt schon einmal Lehrgeld
 *       gezahlt hat (ARCH-01, zwei Modullisten in `build.py` und `loader.js`).
 *   (4) Die Rekonstruktion urteilt eigenschaftsgenau: sie weist nach, WELCHE
 *       der zwoelf Eigenschaften sich bewegt hat, und meldet einen bewegten
 *       Digest als UNERKLAERT, sobald eine andere als die erwarteten dabei
 *       ist. Das ist der Beweis, der unter "0 bewegt" ausgefallen war.
 *
 * WAS ER AUSDRUECKLICH NICHT ZUSICHERT. Dies ist KEIN Tor, das bei jedem Lauf
 * ueber den echten Sollstand urteilt. Die Rekonstruktion braucht zwei Eingaben,
 * die in der CI nicht liegen: den lokalen Vollabzug (`tests/e2e/test-results/`,
 * per `.gitignore` ausgeschlossen) und die Vorfassung des Sollstands aus der
 * Git-Historie (`actions/checkout@v7` holt Tiefe 1). Das Werkzeug ist damit ein
 * HANDGEFAHRENES Berichtswerkzeug fuer die Neuerhebung — dieselbe Bauart wie
 * `--verlauf` in `tools/check-f18-kaskade.js`, und mit derselben Offenheit
 * benannt. Der Waechter hier prueft das WERKZEUG an gestellten Fassungen; ueber
 * den echten Sollstand urteilt weiterhin der Vergleichslauf in der E2E-Suite.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO = path.join(__dirname, '..', '..');
const SPEC = path.join(REPO, 'tests', 'e2e', 'features', 'computed-style-diff.spec.js');
const V = require('../../tools/vergleich-stil-sollstand.js');

// ---------------------------------------------------------------------------
// Hilfen: gestellte Sollstands-Fassungen bauen
// ---------------------------------------------------------------------------

/**
 * Baut eine Ansicht in der Form, die der Sollstand hat: `keys` plus `digests`.
 * @param {Record<string,string>} paare Signatur -> Digest
 */
function ansicht(paare) {
    const keys = Object.keys(paare).sort();
    const digests = {};
    keys.forEach(k => {
        digests[k] = paare[k];
    });
    return { elementCount: keys.length, capped: false, keys, digests };
}

function fassung(durchgaenge) {
    const out = {};
    for (const [d, ansichten] of Object.entries(durchgaenge)) {
        out[d] = {};
        for (const [a, paare] of Object.entries(ansichten)) out[d][a] = ansicht(paare);
    }
    return out;
}

/** Die Rechnung, die den Irrtum erzeugt hat — NUR hier, zum Gegenhalten. */
function nurSchluesselmengen(alt, neu) {
    let geaendert = 0;
    let zugang = 0;
    let abgang = 0;
    for (const d of Object.keys(alt)) {
        for (const a of Object.keys(alt[d])) {
            const ka = new Set(alt[d][a].keys);
            const kb = new Set(((neu[d] || {})[a] || { keys: [] }).keys);
            for (const k of ka) if (!kb.has(k)) abgang++;
            for (const k of kb) if (!ka.has(k)) zugang++;
        }
    }
    return { geaendert, zugang, abgang };
}

// ---------------------------------------------------------------------------
// (1) Der Vergleich liest Werte, nicht Schluessel
// ---------------------------------------------------------------------------

describe('Sollstands-Vergleich: Werte statt Schluesselmengen', () => {
    const alt = fassung({
        standard: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa', 'div.b#0': 'bbbbbbbbbbbbbbbb' } }
    });
    const neu = fassung({
        standard: { dashboard: { 'div.a#0': 'cccccccccccccccc', 'div.b#0': 'bbbbbbbbbbbbbbbb' } }
    });

    test('ein allein im Digestwert verschobenes Element wird gezaehlt', () => {
        const r = V.vergleiche(alt, neu);
        expect(r.summe.geaendert).toBe(1);
        expect(r.summe.zugang).toBe(0);
        expect(r.summe.abgang).toBe(0);
        expect(r.summe.vorher).toBe(2);
        expect(r.summe.nachher).toBe(2);
        expect(r.geaenderteSchluessel).toEqual(['standard/dashboard/div.a#0']);
    });

    test('die Schluesselmengen-Rechnung daneben meldet dafuer 0 — der Irrtum von W5-E', () => {
        // Die Schluesselmengen sind IDENTISCH; nur der Wert hat sich bewegt. Wer
        // `keys` vergleicht, sieht nichts. Beide Zahlen stehen absichtlich im
        // selben Fall: der Unterschied ist der Befund.
        expect(nurSchluesselmengen(alt, neu).geaendert).toBe(0);
        expect(V.vergleiche(alt, neu).summe.geaendert).toBe(1);
    });

    test('identische Fassungen ergeben 0 in jeder Spalte', () => {
        const r = V.vergleiche(alt, alt);
        expect(r.summe).toMatchObject({ geaendert: 0, zugang: 0, abgang: 0 });
    });

    test('der echte Sollstand gegen sich selbst ergibt 0 bewegte Digests', () => {
        // Keine Git-Historie, kein Vollabzug — laeuft auch in der CI.
        const pfad = path.join(REPO, 'tests', 'e2e', 'baselines', 'computed-style-baseline.json');
        const s = JSON.parse(fs.readFileSync(pfad, 'utf8'));
        const r = V.vergleiche(s, s);
        expect(r.summe.geaendert).toBe(0);
        expect(r.summe.vorher).toBe(r.summe.nachher);
        expect(r.summe.vorher).toBeGreaterThan(3000); // 3612 am 2026-10-06
    });

    test('eine einzige umgelegte Ziffer im echten Sollstand wird gefunden', () => {
        const pfad = path.join(REPO, 'tests', 'e2e', 'baselines', 'computed-style-baseline.json');
        const s = JSON.parse(fs.readFileSync(pfad, 'utf8'));
        const kopie = JSON.parse(JSON.stringify(s));
        const ansichtName = Object.keys(kopie.standard)[0];
        const ziel = kopie.standard[ansichtName].keys[0];
        kopie.standard[ansichtName].digests[ziel] = '0123456789abcdef';
        const r = V.vergleiche(s, kopie);
        expect(r.summe.geaendert).toBe(1);
        expect(r.geaenderteSchluessel).toEqual([`standard/${ansichtName}/${ziel}`]);
    });
});

// ---------------------------------------------------------------------------
// (2) Beide Richtungen der Schluesselmengen bleiben erhalten
// ---------------------------------------------------------------------------

describe('Sollstands-Vergleich: Zugang und Abgang treten neben die Wertaenderung', () => {
    test('ein neuer Schluessel wird als Zugang gezaehlt, nicht als Aenderung', () => {
        const alt = fassung({ standard: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } } });
        const neu = fassung({
            standard: {
                dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa', 'div.neu#0': 'dddddddddddddddd' }
            }
        });
        const r = V.vergleiche(alt, neu);
        expect(r.summe).toMatchObject({ geaendert: 0, zugang: 1, abgang: 0 });
    });

    test('ein verschwundener Schluessel wird als Abgang gezaehlt', () => {
        const alt = fassung({
            standard: {
                dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa', 'div.weg#0': 'eeeeeeeeeeeeeeee' }
            }
        });
        const neu = fassung({ standard: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } } });
        const r = V.vergleiche(alt, neu);
        expect(r.summe).toMatchObject({ geaendert: 0, zugang: 0, abgang: 1 });
    });

    test('alle drei Arten zugleich werden getrennt gezaehlt', () => {
        const alt = fassung({
            standard: {
                dashboard: {
                    'div.a#0': 'aaaaaaaaaaaaaaaa',
                    'div.weg#0': 'eeeeeeeeeeeeeeee'
                }
            }
        });
        const neu = fassung({
            standard: {
                dashboard: {
                    'div.a#0': 'ffffffffffffffff',
                    'div.neu#0': 'dddddddddddddddd'
                }
            }
        });
        const r = V.vergleiche(alt, neu);
        expect(r.summe).toMatchObject({ geaendert: 1, zugang: 1, abgang: 1 });
    });

    test('je Durchgang wird getrennt ausgewiesen und die Summe stimmt', () => {
        const alt = fassung({
            standard: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } },
            narrow: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } }
        });
        const neu = fassung({
            standard: { dashboard: { 'div.a#0': 'bbbbbbbbbbbbbbbb' } },
            narrow: { dashboard: { 'div.a#0': 'cccccccccccccccc' } }
        });
        const r = V.vergleiche(alt, neu);
        expect(r.durchgaenge.standard.geaendert).toBe(1);
        expect(r.durchgaenge.narrow.geaendert).toBe(1);
        expect(r.summe.geaendert).toBe(2);
    });
});

// ---------------------------------------------------------------------------
// (3) Die Eigenschaftsliste stammt aus dem Vergleichslauf
// ---------------------------------------------------------------------------

describe('Sollstands-Vergleich: eine Eigenschaftsliste, nicht zwei', () => {
    test('EIGENSCHAFTEN wird aus dem Vergleichslauf gelesen und nicht nachgebaut', () => {
        const quelle = fs.readFileSync(SPEC, 'utf8');
        const block = quelle.match(/const PROPERTIES = \[([\s\S]*?)\];/);
        expect(block).not.toBeNull();
        const ausSpec = block[1]
            .split(',')
            .map(s => s.trim().replace(/^'|'$/g, ''))
            .filter(Boolean);
        expect(ausSpec.length).toBe(12);
        // Reihenfolge ist Teil des Vertrags: digestElement() verkettet nach ihr.
        expect(V.EIGENSCHAFTEN).toEqual(ausSpec);
    });

    test('die Digestrechnung trifft die des Vergleichslaufs auf das Zeichen', () => {
        const quelle = fs.readFileSync(SPEC, 'utf8');
        const laenge = quelle.match(/const DIGEST_HEX_LENGTH = (\d+);/);
        expect(laenge).not.toBeNull();
        expect(V.DIGEST_HEX_LAENGE).toBe(Number(laenge[1]));

        // Trennzeichen und Reihenfolge nachgerechnet: dieselbe Eingabe, derselbe Hash.
        const satz = {};
        V.EIGENSCHAFTEN.forEach((p, i) => {
            satz[p] = `wert-${i}`;
        });
        const erwartet = crypto
            .createHash('sha256')
            .update(V.EIGENSCHAFTEN.map(p => satz[p]).join('␟'))
            .digest('hex')
            .slice(0, Number(laenge[1]));
        expect(V.digest(satz)).toBe(erwartet);
    });

    test('eine fehlende Eigenschaft wird wie im Vergleichslauf als Leerzeichen verkettet', () => {
        const voll = {};
        V.EIGENSCHAFTEN.forEach(p => {
            voll[p] = ' ';
        });
        expect(V.digest({})).toBe(V.digest(voll));
    });
});

// ---------------------------------------------------------------------------
// (4) Die Rekonstruktion urteilt eigenschaftsgenau
// ---------------------------------------------------------------------------

describe('Sollstands-Vergleich: die Rekonstruktion nennt die bewegte Eigenschaft', () => {
    /** Baut Vollabzug + beide Sollstaende aus einem Satz von zwoelf Werten. */
    function lage(vorher, nachher) {
        const basis = {};
        V.EIGENSCHAFTEN.forEach(p => {
            basis[p] = `fest-${p}`;
        });
        const alt = { ...basis, ...vorher };
        const neu = { ...basis, ...nachher };
        return {
            alt: fassung({ standard: { dashboard: { 'div.x#0': V.digest(alt) } } }),
            neu: fassung({ standard: { dashboard: { 'div.x#0': V.digest(neu) } } }),
            abzug: { standard: { dashboard: { elements: { 'div.x#0': neu } } } }
        };
    }

    test('eine bewegte Schriftgroesse wird erklaert und der alte Wert wiedergefunden', () => {
        const l = lage({ fontSize: '13.3333px' }, { fontSize: '12px' });
        const r = V.rekonstruiere(l.alt, l.neu, l.abzug, {
            kandidaten: { fontSize: ['13.3333px', '12px'], fontWeight: ['400'] }
        });
        expect(r.bewegt).toBe(1);
        expect(r.erklaert).toBe(1);
        expect(r.unerklaert).toEqual([]);
        expect(r.zuordnung).toEqual([
            { signatur: 'div.x', aenderung: 'Groesse 13.3333px -> 12px', anzahl: 1 }
        ]);
    });

    test('ein bewegtes Gewicht wird erklaert', () => {
        const l = lage({ fontWeight: '700' }, { fontWeight: '600' });
        const r = V.rekonstruiere(l.alt, l.neu, l.abzug, {
            kandidaten: { fontSize: ['14px'], fontWeight: ['700', '600'] }
        });
        expect(r.erklaert).toBe(1);
        expect(r.zuordnung[0].aenderung).toBe('Gewicht 700 -> 600');
    });

    test('DER EIGENTLICHE PUNKT: eine andere bewegte Eigenschaft bleibt UNERKLAERT', () => {
        // `color` steht nicht in der Kandidatenliste. Haette die Welle neben Groesse
        // und Gewicht versehentlich eine Farbe verschoben, muss genau das hier
        // auffallen — sonst ist die Rekonstruktion ein Feigenblatt.
        const l = lage({ color: 'rgb(1, 1, 1)' }, { color: 'rgb(2, 2, 2)' });
        const r = V.rekonstruiere(l.alt, l.neu, l.abzug, {
            kandidaten: { fontSize: ['14px'], fontWeight: ['400'] }
        });
        expect(r.bewegt).toBe(1);
        expect(r.erklaert).toBe(0);
        expect(r.unerklaert).toHaveLength(1);
        expect(r.unerklaert[0]).toMatch(/div\.x#0/);
        expect(r.unerklaert[0]).toMatch(/keine Kombination/i);
    });

    test('ein Vollabzug, der nicht zum neuen Digest passt, wird gemeldet und nicht stillschweigend erklaert', () => {
        // Schutz gegen die naechstliegende Fehlbedienung: Vollabzug aus einem
        // anderen Baumzustand als der neue Sollstand. Ohne diese Gegenprobe
        // wuerde die Rekonstruktion auf fremden Werten rechnen.
        const l = lage({ fontSize: '13.3333px' }, { fontSize: '12px' });
        l.abzug.standard.dashboard.elements['div.x#0'].color = 'rgb(9, 9, 9)';
        const r = V.rekonstruiere(l.alt, l.neu, l.abzug, {
            kandidaten: { fontSize: ['13.3333px', '12px'], fontWeight: ['400'] }
        });
        expect(r.erklaert).toBe(0);
        expect(r.unerklaert).toHaveLength(1);
        expect(r.unerklaert[0]).toMatch(/passt nicht zum neuen Digest/);
    });

    test('ein bewegter Digest ohne Eintrag im Vollabzug wird gemeldet', () => {
        const l = lage({ fontSize: '13.3333px' }, { fontSize: '12px' });
        delete l.abzug.standard.dashboard.elements['div.x#0'];
        const r = V.rekonstruiere(l.alt, l.neu, l.abzug, {
            kandidaten: { fontSize: ['13.3333px', '12px'], fontWeight: ['400'] }
        });
        expect(r.erklaert).toBe(0);
        expect(r.unerklaert[0]).toMatch(/nicht im Vollabzug/);
    });

    test('die Zuordnung buendelt gleiche Aenderungen je Signatur und zaehlt sie', () => {
        const basis = {};
        V.EIGENSCHAFTEN.forEach(p => {
            basis[p] = `fest-${p}`;
        });
        const altSatz = { ...basis, fontWeight: '700' };
        const neuSatz = { ...basis, fontWeight: '600' };
        const paareAlt = {};
        const paareNeu = {};
        const elements = {};
        for (let i = 0; i < 3; i++) {
            paareAlt[`div.y#${i}`] = V.digest(altSatz);
            paareNeu[`div.y#${i}`] = V.digest(neuSatz);
            elements[`div.y#${i}`] = neuSatz;
        }
        const r = V.rekonstruiere(
            fassung({ standard: { dashboard: paareAlt } }),
            fassung({ standard: { dashboard: paareNeu } }),
            { standard: { dashboard: { elements } } },
            { kandidaten: { fontSize: [basis.fontSize], fontWeight: ['700', '600'] } }
        );
        expect(r.erklaert).toBe(3);
        expect(r.zuordnung).toEqual([
            { signatur: 'div.y', aenderung: 'Gewicht 700 -> 600', anzahl: 3 }
        ]);
    });
});

// ---------------------------------------------------------------------------
// (5) Der Bericht nennt seine Bezugsmenge
// ---------------------------------------------------------------------------

describe('Sollstands-Vergleich: der Bericht', () => {
    test('die Tabelle fuehrt eine Spalte "geaendert" und die Summenzeile stimmt', () => {
        const alt = fassung({
            standard: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } },
            narrow: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } }
        });
        const neu = fassung({
            standard: { dashboard: { 'div.a#0': 'bbbbbbbbbbbbbbbb' } },
            narrow: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } }
        });
        const text = V.bericht(V.vergleiche(alt, neu));
        expect(text).toMatch(/geaendert/);
        expect(text).toMatch(/SUMME/);
        // Die Summenzeile muss die 1 tragen — ein Bericht, der sie verschweigt,
        // ist genau der Bericht, der den Befund erzeugt hat.
        const summe = text.split('\n').find(z => z.includes('SUMME'));
        expect(summe).toMatch(/\b1\b/);
    });

    test('der Bericht sagt ausdruecklich, dass er Werte vergleicht', () => {
        const alt = fassung({ standard: { dashboard: { 'div.a#0': 'aaaaaaaaaaaaaaaa' } } });
        const text = V.bericht(V.vergleiche(alt, alt));
        expect(text).toMatch(/Digest-?WERTE?/i);
    });
});
