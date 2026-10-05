/**
 * Der Waechter des Umstellungswerkzeugs der Welle 5
 * (Design-Handoff v3, Befund D-06 "Schriftgroessen")
 *
 * WARUM DIESE DATEI MIT DEM WERKZEUG ENTSTEHT UND NICHT SPAETER.
 * Das Vorbild `tools/sync-editor-toolbars.js` behauptet in seiner Zeile 18,
 * sein `--check`-Modus sei "das, was tests/unit/editor-toolbar-sync.test.js
 * faehrt". Diesen Test gibt es nicht — `grep -rn 'sync-editor-toolbars' tests/
 * package.json .github/workflows/` liefert null Treffer, und CLAUDE.md sagt
 * dasselbe (Phase 15, GATE-04: `--check` ist eine Faehigkeit, die nichts
 * ausfuehrt). Ein `--check`, das niemand fahrt, ist keine Absicherung,
 * sondern eine Behauptung. Genau diese Luecke darf die Welle 5 nicht erben,
 * deshalb entsteht der Waechter im selben Zug wie das Werkzeug (O-8).
 *
 * WAS ER ZUSICHERT — und was ausdruecklich nicht.
 * Er prueft das WERKZEUG, nicht das Ergebnis. Ueber das Ergebnis urteilen
 * W5-R-05 und W5-R-06 in `tests/unit/design-consistency.test.js`, dauerhaft.
 * Dieser Waechter sichert vier Dinge:
 *   (1) `--check` laeuft wirklich, schreibt wirklich nichts (byteweise
 *       nachgewiesen) und nennt seine Rechnung vollstaendig.
 *   (2) Die Zuordnungstabelle ist vollstaendig: kein Zahlenwert im
 *       Geltungsbereich bleibt ohne Zeile, und keine Zeile widerspricht der
 *       Skala.
 *   (3) Die Ratsche IMPORTIERT die Tabelle, sie baut sie nicht nach — der
 *       Punkt, an dem dieses Projekt schon einmal Lehrgeld gezahlt hat
 *       (ARCH-01: zwei handkopierte Modullisten in `build.py` und
 *       `loader.js`).
 *   (4) Die Zeichengrenzen, mit denen das Werkzeug SCHREIBT, treffen den
 *       Wert und nur den Wert. Das ist die gefaehrlichste Stelle eines
 *       schreibenden Werkzeugs, und sie ist beim ersten Lauf wirklich
 *       falsch gewesen (ein maskierter Kommentar vor der Deklaration
 *       verschob den Zeiger, `13px` kam als `px` an, core.css:693).
 *
 * GEMESSENER AUSGANGSWERT, am 2026-10-06 gegen den Zweig design-welle-4
 * erhoben, VOR jeder Zeile Umsetzung:
 *
 *   font-size im Geltungsbereich  853 Deklarationen in 18 Dateien
 *     davon schon auf einer Sprosse   2   (aus Welle 4 vorgezogen)
 *     davon `inherit`                 7
 *     davon namentlich geduldet       5
 *     davon ohne Tabellenzeile        0
 *     davon in geschuetzter Familie   0
 *     OFFEN                         839
 *   mit Zahlenwert                  840
 *     Sprung > 2 px                  31   <- die Urteilsstellen
 *     Sprung <= 2 px                809
 *       davon Sprung exakt 0,00 px  151
 *
 * ZWEI RECHNUNGEN, DIE NICHTS VONEINANDER WISSEN, NENNEN DIESELBE MENGE.
 * Die 31 Urteilsstellen des Werkzeugs sind gegen die unabhaengige
 * Vorab-Vermessung abgeglichen (ein zeilenweiser Regex-Zaehler gegen den
 * klammerzaehlenden Zerleger des Werkzeugs): beide nennen dieselben 31
 * `Datei:Zeile`-Paare, Abgleich schriftlich im Bericht der Einheit. Die
 * Gesamtzahl 853 ist zusaetzlich gegen die Zerlegung der Ratsche abgeglichen,
 * die ihren eigenen Zerleger mitbringt — drei Wege, eine Zahl.
 *
 * WARUM DIE SCHRANKE MIT 839 STARTET UND NICHT MIT 0.
 * Die Umstellung selbst ist Sache der Schritte 4 bis 8 derselben Welle; eine
 * Schranke von 0 liesse die Suite ueber mehrere Commits rot, und eine rote
 * Suite ist in diesem Projekt kein Arbeitszustand, sondern ein blockierendes
 * Tor. Die Form ist die der bestehenden Ratschen (F-18 !important 105, F-19
 * Inline 254, W5-R-05): eine Zahl, die nur SINKEN darf, mit dem gemessenen
 * Ausgangswert als Schranke und dem Ziel daneben. DASS SIE GREIFT, ist mit
 * der Schranke 0 belegt — der Commit "test(W5): Tabelle, Werkzeug und
 * Waechter, rot bewiesen" steht genau dafuer in der Historie, mit der
 * bezifferten Ausgabe 839 in der Nachricht. Wer sie fuer wirkungslos haelt,
 * setzt sie auf 0 und sieht dieselbe Ausgabe wieder.
 *
 * WAS DIESER WAECHTER NICHT HART FESTNAGELT, und warum das Absicht ist:
 * die Zahlen 840/31/809/151 sind Eigenschaften des HEUTIGEN Bestandes. Nach
 * der Umstellung sind sie alle 0, weil dann kein Zahlenwert mehr da ist.
 * Haertete man sie ein, muesste der Schritt, der die Welle vollendet, seinen
 * eigenen Waechter aufweichen — und ein Waechter, der beim ersten Erfolg
 * gesenkt wird, bewacht ab dann nichts. Festgenagelt ist stattdessen die
 * innere Stimmigkeit des Berichts (die Summe der Blockzeilen gleicht der
 * Kopfzahl, jede Zeile im Block "> 2 px" traegt wirklich mehr als 2 px) —
 * das gilt heute und nach der Umstellung.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.join(__dirname, '..', '..');
const WERKZEUG = path.join(REPO, 'tools', 'sync-typo-tokens.js');
const TABELLE = path.join(REPO, 'tools', 'typo-map.js');
const STYLES = path.join(REPO, 'assets', 'styles');

const M = require('../../tools/typo-map.js');
const W = require('../../tools/sync-typo-tokens.js');

/** SCHRANKE — offene Deklarationen, die `--check` meldet.
 *  Gemessener Ausgangswert 839. ZIEL 0. Diese Zahl darf nur SINKEN.
 *  Exakt ausgereizt: eine einzige neue Fremdgroesse macht sie rot. */
const OFFEN_MAX = 839;

/** Das Werkzeug als eigener Prozess fahren — so, wie ein Mensch es faehrt.
 *  Nicht `main()` im Testprozess aufrufen: dann waere weder der
 *  Rueckgabewert noch die Ausgabe das, was auf der Kommandozeile passiert,
 *  und genau darauf beruft sich der Kopfkommentar des Werkzeugs. */
function fahre(...args) {
    const r = spawnSync(process.execPath, [WERKZEUG, ...args], {
        cwd: REPO,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024
    });
    return { code: r.status, aus: r.stdout || '', fehler: r.stderr || '' };
}

/** Eine Zahl aus einer beschrifteten Zeile der Ausgabe holen. */
function zahl(aus, beschriftung) {
    const re = new RegExp(beschriftung.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^0-9]*([0-9]+)');
    const m = aus.match(re);
    if (!m) throw new Error(`Zeile "${beschriftung}" fehlt in der Ausgabe:\n${aus}`);
    return parseInt(m[1], 10);
}

/** Fingerabdruck aller Dateien im Geltungsbereich. */
function abdruck() {
    const out = {};
    for (const f of fs.readdirSync(STYLES)) {
        if (!f.endsWith('.css')) continue;
        out[f] = crypto
            .createHash('sha256')
            .update(fs.readFileSync(path.join(STYLES, f)))
            .digest('hex');
    }
    return out;
}

const check = fahre('--check');
const report = fahre('--report', '--kategorien');

describe('W5-W1 — `--check` laeuft, schreibt nichts und nennt seine Rechnung', () => {
    test('die Rechnung geht auf: Gesamt = Sprossen + inherit + geduldet + ohne Zeile + geschuetzt + offen', () => {
        const gesamt = zahl(check.aus, 'font-size-Deklarationen gesamt');
        const sprossen = zahl(check.aus, 'davon bereits auf einer Sprosse');
        const inherit = zahl(check.aus, 'davon inherit');
        const geduldet = zahl(check.aus, 'davon namentlich geduldet');
        const ohneZeile = zahl(check.aus, 'davon ohne Tabellenzeile');
        const schutz = zahl(check.aus, 'davon in geschuetzter Familie');
        const offen = zahl(check.aus, 'OFFEN');
        // Ohne diese Gleichung koennte jede Einzelzahl stimmen und die Summe
        // trotzdem eine Stelle verlieren — der lautlose Fehler, gegen den die
        // ganze Welle angelegt ist.
        expect(sprossen + inherit + geduldet + ohneZeile + schutz + offen).toBe(gesamt);
        expect(gesamt).toBeGreaterThan(500);
    });

    test('GEGENRECHNUNG: die Gesamtzahl stimmt mit einer unabhaengigen Zaehlung', () => {
        // Zweiter Weg, der vom klammerzaehlenden Zerleger des Werkzeugs
        // nichts weiss: ein Regex ueber derselben Dateimenge. Zwei Wege
        // muessen dieselbe Zahl nennen, sonst zaehlt einer etwas anderes, als
        // er behauptet.
        const dateien = fs
            .readdirSync(STYLES)
            .filter(f => f.endsWith('.css') && f !== 'variables.css' && f !== 'fonts.css');
        const perRegex = dateien.reduce((n, f) => {
            const css = fs
                .readFileSync(path.join(STYLES, f), 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, '');
            return n + [...css.matchAll(/(^|[{;}])\s*font-size\s*:/g)].length;
        }, 0);
        expect(zahl(check.aus, 'font-size-Deklarationen gesamt')).toBe(perRegex);
        expect(dateien.length).toBe(18);
    });

    test('`--check` schreibt NICHTS — byteweise nachgewiesen', () => {
        const vorher = abdruck();
        const r = fahre('--check');
        expect(r.code === 0 || r.code === 1).toBe(true);
        expect(abdruck()).toEqual(vorher);
    });

    test('der Rueckgabewert ist eine Aussage und keine Zierde', () => {
        const offen = zahl(check.aus, 'OFFEN');
        const ohneZeile = zahl(check.aus, 'davon ohne Tabellenzeile');
        const schutz = zahl(check.aus, 'davon in geschuetzter Familie');
        expect(check.code).toBe(offen + ohneZeile + schutz > 0 ? 1 : 0);
    });

    test('RATSCHE: die Zahl der offenen Deklarationen darf nur sinken', () => {
        const offen = zahl(check.aus, 'OFFEN');
        if (offen > OFFEN_MAX) {
            /* Nur im roten Fall. `toBeLessThanOrEqual` meldet "expected <= N"
               und nennt die Lage nicht; eine Gegenueberstellung druckt Zahl
               UND Ausgabe, und genau das soll ein roter Lauf leisten — der
               Nachweis einer Ratsche ist ihre bezifferte Ausgabe, nicht die
               Behauptung, sie greife. */
            expect({ offen, schranke: OFFEN_MAX, ausgabe: check.aus.trim().split('\n') }).toEqual({
                offen: OFFEN_MAX,
                schranke: OFFEN_MAX,
                ausgabe: []
            });
        }
        expect(offen).toBeLessThanOrEqual(OFFEN_MAX);
    });

    test('kein Zahlenwert bleibt ohne Tabellenzeile', () => {
        // Diese Zusicherung ist dauerhaft und nicht an den Ausgangsbestand
        // gebunden: ein neuer Wert ohne Zeile wuerde vom Werkzeug
        // STILLSCHWEIGEND uebersprungen und blieb als Fremdgroesse stehen.
        expect(zahl(check.aus, 'davon ohne Tabellenzeile')).toBe(0);
    });

    test('keine Mitgliedsregel der Chip-/Markenfamilien traegt eine eigene Schriftgroesse', () => {
        // Der Vertrag W4-R-06 verlangt die Groesse an der BASIS. Faende das
        // Werkzeug sie im Mitglied, waere eine Ersetzung ein Rueckschritt,
        // der wie Fortschritt aussieht.
        expect(zahl(check.aus, 'davon in geschuetzter Familie')).toBe(0);
    });
});

describe('W5-W2 — der Delta-Bericht ist in sich stimmig', () => {
    test('`--report` laeuft, gibt 0 zurueck und schreibt nichts', () => {
        const vorher = abdruck();
        const r = fahre('--report');
        expect(r.code).toBe(0);
        expect(abdruck()).toEqual(vorher);
    });

    test('die Kopfzahlen addieren sich und die Bloecke haben so viele Zeilen, wie der Kopf behauptet', () => {
        const mitZahl = zahl(report.aus, 'Deklarationen mit Zahlenwert');
        const gross = zahl(report.aus, 'davon Sprung > 2 px');
        const klein = zahl(report.aus, 'davon Sprung <= 2 px');
        const null0 = zahl(report.aus, 'darunter Sprung exakt 0,00 px');
        expect(gross + klein).toBe(mitZahl);
        expect(null0).toBeLessThanOrEqual(klein);

        const block = report.aus
            .split('=== STELLEN MIT SPRUNG > 2 px ===')[1]
            .split('=== STELLEN MIT SPRUNG <= 2 px')[0]
            .split('\n')
            .filter(l => /^\s+[+-]?\d/.test(l));
        expect(block.length).toBe(gross);
        // ... und jede Zeile dieses Blocks traegt wirklich mehr als 2 px
        block.forEach(l => {
            const d = parseFloat(l.trim().split(/\s+/)[0]);
            expect(Math.abs(d)).toBeGreaterThan(2);
        });
    });

    test('die Skala im Bericht ist die aus variables.css, lueckenlos und aufsteigend', () => {
        const werte = M.skalaWerte();
        expect(Object.keys(werte).sort()).toEqual([...M.SKALA_TOKENS].sort());
        const folge = M.SKALA_TOKENS.map(t => werte[t]);
        folge.forEach((v, i) => {
            expect(Number.isFinite(v)).toBe(true);
            if (i) expect(v).toBeGreaterThan(folge[i - 1]);
        });
        // ... und der Bericht nennt sie wirklich, statt sie nur zu kennen
        M.SKALA_TOKENS.forEach(t => expect(report.aus).toContain(`${t}=${werte[t]}px`));
    });
});

describe('W5-W3 — die Zuordnungstabelle', () => {
    const werte = M.skalaWerte();

    test('44 Zeilen: 28 em-Werte und 16 px-Literale', () => {
        const schluessel = Object.keys(M.ZUORDNUNG);
        expect(schluessel.length).toBe(44);
        expect(schluessel.filter(k => k.endsWith('em')).length).toBe(28);
        expect(schluessel.filter(k => k.endsWith('px')).length).toBe(16);
    });

    test('jedes Ziel ist eine Sprosse der Skala', () => {
        Object.values(M.ZUORDNUNG).forEach(z => expect(M.SKALA_TOKENS).toContain(z));
    });

    test('die Tabelle ist monoton: ein groesserer Wert landet nie auf einer kleineren Sprosse', () => {
        // Ohne diese Probe koennte ein Tippfehler zwei Werte vertauschen, und
        // das Ergebnis saehe in jeder Einzelzeile plausibel aus: `1.4em -> sm`
        // faellt niemandem auf, kehrt aber eine Groessenordnung um.
        const paare = Object.entries(M.ZUORDNUNG)
            .map(([k, z]) => ({ roh: k, alt: M.altPx(k), neu: werte[z], z }))
            .sort((a, b) => a.alt - b.alt);
        paare.forEach((p, i) => {
            expect(p.alt).not.toBeNull();
            if (i) {
                expect(p.neu).toBeGreaterThanOrEqual(paare[i - 1].neu);
            }
        });
    });

    test('`1em` und `1.0em` stehen BEIDE drin', () => {
        // Der Handoff nennt nur `1em`; im Quellbaum kommen beide
        // Schreibweisen vor, und ein wortgenauer Abgleich lief an `1.0em`
        // vorbei (O-4).
        expect(M.ZUORDNUNG['1em']).toBeDefined();
        expect(M.ZUORDNUNG['1.0em']).toBeDefined();
        expect(M.ZUORDNUNG['1em']).toBe(M.ZUORDNUNG['1.0em']);
    });

    test('die zwei Handoff-Zeilen ohne Treffer fehlen mit Absicht', () => {
        // `26px -> --text-2xl` und `34px -> --text-3xl` haben NULL
        // Quellstellen. Eine Zeile, die nichts trifft, ist keine Zuordnung.
        expect(M.ZUORDNUNG['26px']).toBeUndefined();
        expect(M.ZUORDNUNG['34px']).toBeUndefined();
        const { alle } = W.erheben();
        expect(alle.filter(d => d.wert === '26px' || d.wert === '34px')).toEqual([]);
    });

    test('`altPx()` rechnet die 16-px-Wurzel und nur sie', () => {
        expect(M.altPx('0.85em')).toBeCloseTo(13.6, 5);
        expect(M.altPx('1em')).toBe(16);
        expect(M.altPx('13px')).toBe(13);
        expect(M.altPx('inherit')).toBeNull();
        expect(M.altPx('var(--text-md)')).toBeNull();
        // `rem` ist eine ANDERE Einheit (F-03 urteilt darueber) und darf hier
        // nicht stillschweigend als em durchgehen.
        expect(M.altPx('1.2rem')).toBeNull();
    });
});

describe('W5-W4 — die Ratsche IMPORTIERT die Tabelle, sie baut sie nicht nach', () => {
    const ratsche = fs.readFileSync(
        path.join(REPO, 'tests', 'unit', 'design-consistency.test.js'),
        'utf8'
    );

    test('die Ratschendatei liest tools/typo-map.js', () => {
        expect(ratsche).toMatch(/require\([^)]*typo-map/);
    });

    test('es gibt kein zweites Verzeichnis der Skalentokens', () => {
        // DER KERN VON O-4. Zwei hand-synchrone Listen sind in diesem Projekt
        // schon einmal auseinandergelaufen (ARCH-01: build.py trug eine Kopie
        // der Modulliste aus loader.js). Dieser Test faellt, sobald in der
        // Ratschendatei eine zweite Aufzaehlung der Tokennamen entsteht —
        // egal, ob als Array, als Objekt oder in einem Regex.
        //
        // Die drei erlaubten Nennungen sind einzeln belegt und keine
        // Pauschale. Waechst eine, ist entweder eine neue Zusicherung
        // entstanden (dann gehoert sie hierher, mit Begruendung) oder eine
        // Liste (dann ist dieser Test genau dafuer da).
        const ERLAUBTE_NENNUNGEN = {
            // Welle-4-Vertrag, Chip-Basis: `font-size: var(--text-sm)`
            // (design-consistency.test.js, "Teil 3: die 17 Chip-Bauformen").
            '--text-sm': 1,
            // Welle-4-Vertrag, Marken-Basis: `font-size: var(--text-xs)`
            // ("Teil 5: die 8 Marken haengen an .badge").
            '--text-xs': 1,
            // Zwei GEGENPROBEN von W5-R-05: `ERLAUBT.test('var(--text-md)')`
            // muss wahr und `EM_WERT.test('var(--text-md)')` falsch sein.
            // Ohne sie koennte jede gruene Zusicherung auch daran liegen, dass
            // die Erhebung nichts findet.
            '--text-md': 2,
            '--text-lg': 0,
            '--text-xl': 0,
            '--text-2xl': 0,
            '--text-3xl': 0,
            '--text-hero': 0
        };
        const ohneKommentare = ratsche
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');
        const gezaehlt = {};
        M.SKALA_TOKENS.forEach(t => {
            gezaehlt[t] = [
                ...ohneKommentare.matchAll(new RegExp(t.replace(/-/g, '\\-'), 'g'))
            ].length;
        });
        const soll = {};
        M.SKALA_TOKENS.forEach(t => (soll[t] = ERLAUBTE_NENNUNGEN[t]));
        expect(gezaehlt).toEqual(soll);
    });

    test('Ausnahmeliste, SVG-Ausnahmen und Dateiausnahme kommen aus derselben Datei', () => {
        expect(ratsche).toMatch(/FONT_SIZE_GEDULDET\s*=\s*[A-Z_]*\.?AUSNAHMEN/);
        expect(ratsche).toMatch(/SVG_GEDULDET\s*=\s*[A-Z_]*\.?SVG_GEDULDET/);
        expect(ratsche).toMatch(/JS_AUSGENOMMEN\s*=\s*[A-Z_]*\.?AUSGENOMMENE_DATEIEN/);
    });

    test('jede geduldete Stelle traegt eine Begruendung, nicht nur einen Schluessel', () => {
        // Eine Ausnahme ohne Grund ist ein Feigenblatt. Die Begruendung muss
        // lang genug sein, um eine zu sein — ein "ok" erfuellt keine Zusage.
        const eintraege = Object.entries(M.AUSNAHMEN);
        expect(eintraege.length).toBeGreaterThan(0);
        eintraege.forEach(([k, grund]) => {
            expect(k.split('||').length).toBe(3);
            expect(typeof grund).toBe('string');
            expect(grund.length).toBeGreaterThan(60);
        });
    });

    test('die SVG-Ausnahmeliste ist LEER, nicht abwesend', () => {
        // Muster der EXEC_COMMAND_ALLOWLIST: eine leere Liste sagt "hier ist
        // noch nicht entschieden", eine fehlende sagt nichts.
        expect(M.SVG_GEDULDET).toEqual({});
        expect(Object.keys(M.SVG_GEDULDET)).toEqual([]);
    });

    test('die Dateiausnahme ist eine DATEI und existiert', () => {
        expect(M.AUSGENOMMENE_DATEIEN).toEqual(['features/shops/shop-export.js']);
        expect(fs.existsSync(path.join(REPO, M.AUSGENOMMENE_DATEIEN[0]))).toBe(true);
    });
});

describe('W5-W5 — die Zeichengrenzen, mit denen geschrieben wird', () => {
    /** Ersetzen, wie das Werkzeug es tut: [von, bis) durch das Token. */
    function ersetze(css) {
        const ds = W.deklarationen(css, 'font-size');
        let out = css;
        for (const d of [...ds].sort((a, b) => b.von - a.von)) {
            const ziel = M.ZUORDNUNG[d.wert];
            if (!ziel) continue;
            out = out.slice(0, d.von) + `var(${ziel})` + out.slice(d.bis);
        }
        return out;
    }

    test('der gewoehnliche Fall', () => {
        expect(ersetze('.a { font-size: 13px; }')).toBe('.a { font-size: var(--text-sm); }');
    });

    test('REGRESSION: ein Kommentar vor der Deklaration verschiebt den Zeiger nicht', () => {
        // Genau dieser Fall ist beim ersten Lauf falsch gewesen: der Wert
        // `13px` kam als `px` an (core.css:693, `.form-group label`, mit
        // einem zweizeiligen Kommentar davor). Die Ursache war ein
        // aufgesammelter Puffer, dessen Index mit dem Original auseinanderlief.
        const css = '.form-group label {\n    /* zwei\n       Zeilen */\n    font-size: 13px;\n}';
        const ds = W.deklarationen(css, 'font-size');
        expect(ds.length).toBe(1);
        expect(ds[0].wert).toBe('13px');
        expect(ds[0].zeile).toBe(4);
        expect(css.slice(ds[0].von, ds[0].bis)).toBe('13px');
        expect(ersetze(css)).toBe(
            '.form-group label {\n    /* zwei\n       Zeilen */\n    font-size: var(--text-sm);\n}'
        );
    });

    test('`!important` bleibt stehen', () => {
        const css = '.a { font-size: 0.9em !important; }';
        const ds = W.deklarationen(css, 'font-size');
        expect(ds[0].wert).toBe('0.9em');
        expect(ds[0].wichtig).toBe('!important');
        expect(ersetze(css)).toBe('.a { font-size: var(--text-md) !important; }');
    });

    test('die letzte Deklaration ohne Semikolon', () => {
        // Die Schreibweise, in der ein Rueckfall an einer rein `;`-basierten
        // Zerlegung vorbeikaeme.
        const css = '.a { color: red; font-size: 0.85em }';
        const ds = W.deklarationen(css, 'font-size');
        expect(ds.length).toBe(1);
        expect(ds[0].wert).toBe('0.85em');
        expect(ersetze(css)).toBe('.a { color: red; font-size: var(--text-sm) }');
    });

    test('ein Semikolon in einer url() beendet keine Deklaration', () => {
        const css = '.a { background: url("x;y.png"); font-size: 9px }';
        const ds = W.deklarationen(css, 'font-size');
        expect(ds.length).toBe(1);
        expect(ds[0].wert).toBe('9px');
        expect(ersetze(css)).toBe('.a { background: url("x;y.png"); font-size: var(--text-xs) }');
    });

    test('Selektor, At-Regel und Zeile werden richtig zugeordnet', () => {
        const css = '@media (max-width: 600px) {\n  .a:hover {\n    font-size: 10px;\n  }\n}';
        const ds = W.deklarationen(css, 'font-size');
        expect(ds.length).toBe(1);
        expect(ds[0].selektoren).toBe('.a:hover');
        expect(ds[0].at).toBe('@media (max-width: 600px)');
        expect(ds[0].zeile).toBe(3);
    });

    test('ein Selektor mit Doppelpunkt und ein At-Regel-Kopf sind KEINE Deklarationen', () => {
        expect(W.deklarationen('.a:hover { }', 'font-size')).toEqual([]);
        expect(
            W.deklarationen('@media (max-width: 600px) { .a { color: red } }', 'font-size')
        ).toEqual([]);
    });

    test('ein auskommentierter Wert wird nicht ersetzt', () => {
        const css = '.a {\n/* font-size: 99px; */\nfont-size: 14px;\n}';
        const ds = W.deklarationen(css, 'font-size');
        expect(ds.length).toBe(1);
        expect(ds[0].wert).toBe('14px');
        expect(ersetze(css)).toBe('.a {\n/* font-size: 99px; */\nfont-size: var(--text-md);\n}');
    });

    test('mehrere Deklarationen in einer Datei werden alle richtig getroffen', () => {
        const css = '.a { font-size: 8px }\n.b { font-size: 1.2em }\n.c { font-size: 32px }';
        expect(ersetze(css)).toBe(
            '.a { font-size: var(--text-xs) }\n' +
                '.b { font-size: var(--text-xl) }\n' +
                '.c { font-size: var(--text-3xl) }'
        );
    });

    test('GEGENPROBE: der Zerleger findet wirklich etwas', () => {
        // Ohne diese Probe koennte jede gruene Zusicherung oben auch daran
        // liegen, dass die Zerlegung nichts liefert.
        const { alle } = W.erheben();
        expect(alle.length).toBeGreaterThan(500);
        alle.forEach(d => {
            expect(typeof d.von).toBe('number');
            expect(d.bis).toBeGreaterThan(d.von);
        });
    });

    test('jede Zeichengrenze trifft im ECHTEN Bestand genau ihren Wert', () => {
        // Die Probe, die den schlimmsten Fehler eines schreibenden Werkzeugs
        // ausschliesst: ein Zeiger, der mitten in den Wert oder in die
        // Nachbarzeile zeigt. 853 Stellen, jede einzeln nachgesehen.
        const falsch = [];
        for (const f of W.dateien()) {
            const css = fs.readFileSync(f.pfad, 'utf8');
            for (const d of W.deklarationen(css, 'font-size')) {
                const text = css.slice(d.von, d.bis).replace(/\s+/g, ' ');
                if (text !== d.wert) falsch.push(`${f.name}:${d.zeile}  "${text}" != "${d.wert}"`);
            }
        }
        expect(falsch).toEqual([]);
    });
});

describe('W5-W6 — `--only` und die Verweigerungen', () => {
    test('`--only` beschraenkt auf eine Datei', () => {
        const r = fahre('--check', '--only=pwa.css');
        expect(r.aus).toContain('Geltungsbereich: 1 Dateien');
        const ganz = zahl(check.aus, 'font-size-Deklarationen gesamt');
        expect(zahl(r.aus, 'font-size-Deklarationen gesamt')).toBeLessThan(ganz);
    });

    test('`--only` auf eine Datei ausserhalb des Geltungsbereichs wird verweigert', () => {
        // Nicht stillschweigend als "0 Deklarationen" melden: variables.css
        // DEFINIERT die Skala und traegt das Mobil-Profil (E-2). Ein Lauf
        // darauf waere ein Missverstaendnis, kein Nullergebnis.
        for (const d of ['variables.css', 'fonts.css']) {
            const r = fahre('--check', `--only=${d}`);
            expect(r.code).toBe(2);
            expect(r.fehler).toContain('Geltungsbereich');
        }
    });

    test('`--only` auf eine nicht vorhandene Datei wird verweigert', () => {
        const r = fahre('--check', '--only=gibtsnicht.css');
        expect(r.code).toBe(2);
        expect(r.fehler).toContain('existiert nicht');
    });
});

describe('W5-W7 — die Kandidatenmengen sind benannt und gezaehlt, aber nicht geduldet', () => {
    test('`--kategorien` nennt E-3, E-4, die Mobil-Leser und die geschuetzten Familien', () => {
        expect(report.aus).toContain('KANDIDATENMENGE E-3');
        expect(report.aus).toContain('KANDIDATENMENGE E-4');
        expect(report.aus).toContain('LESER DER MOBILVERGROESSERUNG');
        expect(report.aus).toContain('GESCHUETZTE FAMILIEN');
        expect(report.aus).toContain('NOCH NICHT geduldet');
    });

    test('die Ikonen-Muster treffen das Ikon und nicht seine Umgebung', () => {
        // Der erste Entwurf hatte `-empty` darin und zog `.enc-empty-title`,
        // `.detail-empty-text` und `.sb-empty-hint` herein — lauter
        // Fliesstext in Leerzustands-Kaesten, also genau das, was die Welle
        // ANFASSEN soll (E-3).
        expect(M.istIkon('.npc-empty-icon')).toBe(true);
        expect(M.istIkon('.empty-state-icon')).toBe(true);
        expect(M.istIkon('.avatar-placeholder')).toBe(true);
        expect(M.istIkon('.fr-detail-symbol')).toBe(true);
        expect(M.istIkon('.enc-empty-title')).toBe(false);
        expect(M.istIkon('.detail-empty-text')).toBe(false);
        expect(M.istIkon('.sb-empty-hint')).toBe(false);
        expect(M.istIkon('.generator-empty p')).toBe(false);
    });

    test('die Kandidatenmenge E-3 ist KEINE Ausnahme — sie steht in keiner Dulde-Liste', () => {
        // Der Punkt, an dem eine Zielquote still zur Luege wird: wer die
        // Kandidaten als geduldet fuehrt, hat sie entschieden, ohne sie zu
        // beurteilen. Geduldet ist, was in AUSNAHMEN steht, und das sind
        // heute fuenf Stellen mit Begruendung.
        const { alle } = W.erheben();
        const ikon = alle.filter(d => M.istIkon(d.selektoren));
        expect(ikon.length).toBeGreaterThan(50);
        const geduldeteIkonen = ikon.filter(
            d => M.AUSNAHMEN[M.anker(d.datei, d.selektoren, 'font-size')]
        );
        expect(geduldeteIkonen).toEqual([]);
    });

    test('die Chip- und Markenfamilien sind vollstaendig und ihre Basen stehen auf der Skala', () => {
        expect(M.SCHUTZ_CHIP.length).toBe(18);
        expect(M.SCHUTZ_MARKE.length).toBe(9);
        const { alle } = W.erheben();
        const basen = alle.filter(d => M.istSchutzBasis(d.selektoren));
        expect(basen.length).toBe(2);
        expect(basen.map(b => b.wert).sort()).toEqual(['var(--text-sm)', 'var(--text-xs)']);
        // ... und die Basiswerte stimmen mit dem Vertrag der Welle 4
        const nachFamilie = {};
        basen.forEach(b => (nachFamilie[M.istSchutzBasis(b.selektoren)] = b.wert));
        expect(nachFamilie.chip).toBe(`var(${M.SCHUTZ_BASIS_WERTE.chip})`);
        expect(nachFamilie.marke).toBe(`var(${M.SCHUTZ_BASIS_WERTE.marke})`);
    });

    test('`schutzFamilie()` unterscheidet Mitglied und Fremdklasse', () => {
        expect(M.schutzFamilie('.loot-filter-chip')).toBe('chip');
        expect(M.schutzFamilie('.bestiary-badge')).toBe('marke');
        expect(M.schutzFamilie('.npc-item-tag')).toBeNull();
        expect(M.schutzFamilie('.char-card-name')).toBeNull();
        // ... und die Basisregel ist kein "Mitglied", das verweigert wird
        expect(M.istSchutzBasis('.' + M.SCHUTZ_CHIP.join(', .'))).toBe('chip');
        expect(M.istSchutzBasis('.loot-filter-chip')).toBeNull();
    });
});

describe('W5-W8 — das Werkzeug ist als einmaliges benannt, nicht als Dauerwache', () => {
    test('der Kopfkommentar nennt die Grenze des Musters', () => {
        // O-8 und `plan.atomar_wie`: wer dem Werkzeug eine Dauerrolle
        // zuschreibt, verspricht eine Pruefung, die es nicht leisten kann —
        // `--check` kann hier nicht "identisch neu erzeugbar" pruefen, weil
        // eine font-size mitten in handgeschriebenem CSS steht.
        const quelle = fs.readFileSync(WERKZEUG, 'utf8');
        expect(quelle).toMatch(/EINMALIGES Umstellungswerkzeug/);
        expect(quelle).toMatch(/W5-R-05/);
        expect(quelle).toMatch(/identisch neu erzeugbar/);
    });

    test('es behauptet keinen Waechtertest, den es nicht gibt', () => {
        // Der Fehler des Vorbilds, namentlich: `sync-editor-toolbars.js`
        // nennt in Zeile 18 einen Test, der nicht existiert. Jeder Testpfad,
        // den die beiden neuen Dateien nennen, muss wirklich da sein.
        //
        // EINE AUSNAHME, und sie ist die Pointe: der Kopfkommentar des
        // Werkzeugs nennt genau diesen fehlenden Test als GEGENBEISPIEL. Dass
        // er fehlt, ist die dort aufgeschriebene Aussage — also wird sie hier
        // geprueft statt weggefiltert. Entsteht der Test eines Tages, faellt
        // dieser Fall und der Kommentar wird berichtigt.
        const GEGENBEISPIEL = 'tests/unit/editor-toolbar-sync.test.js';
        expect(fs.existsSync(path.join(REPO, GEGENBEISPIEL))).toBe(false);

        const befunde = [];
        for (const datei of [WERKZEUG, TABELLE]) {
            const quelle = fs.readFileSync(datei, 'utf8');
            for (const m of quelle.matchAll(/tests\/[\w./-]+\.(?:test|spec)\.js/g)) {
                if (m[0] === GEGENBEISPIEL) continue;
                if (!fs.existsSync(path.join(REPO, m[0]))) {
                    befunde.push(`${path.basename(datei)} nennt ${m[0]} — gibt es nicht`);
                }
            }
        }
        expect(befunde).toEqual([]);
    });
});
