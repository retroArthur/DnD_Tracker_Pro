'use strict';

/**
 * typo-baseline — das Grundlinienwerkzeug der Welle 5 (Design-Handoff v3,
 * Befunde D-06 "Schriftgroessen", D-09 "Gewichte", D-12 "Inline-Typografie")
 *
 * WARUM ES DIESES WERKZEUG GIBT UND NICHT DEN STIL-SOLLSTAND.
 * `tests/e2e/features/computed-style-diff.spec.js` hasht zwoelf Eigenschaften
 * zu EINEM Digest je Element. Er beantwortet "hat sich hier etwas bewegt?",
 * aber nicht "um wie viele Bildpunkte?" — und das Abnahmekriterium dieser
 * Welle lautet woertlich "keine Aenderung ueber 2 px ausser beabsichtigt".
 * Eine Zusicherung in Bildpunkten braucht die BILDPUNKTE, nicht ihren
 * Hashwert. Umgekehrt ersetzt dieses Werkzeug den Sollstand nicht: es sieht
 * nur drei Eigenschaften (Groesse, Gewicht, Zeilenhoehe) und urteilt nicht,
 * es BERICHTET. Beides nebeneinander ist Absicht.
 *
 * WARUM DIE MESSUNG AUF GEFUELLTER KAMPAGNE LAEUFT (seedPopulatedSession).
 * Gemessen am 2026-10-03: von 113 nachweislich erreichbaren Elementen unter
 * 11 px sind in einer leeren Kampagne nur ein Bruchteil ueberhaupt im Baum —
 * Kartenlisten, Attributpillen, Ladenzeilen und Beschwoerungslisten entstehen
 * erst mit Daten. Eine leere Kampagne verbirgt 88 Prozent der Stellen.
 *
 * WARUM DREI ZUSTAENDE UND NICHT NUR DIE RUHELAGE.
 * Von 153 Elementen unter 11 px im Baum sind 53 in der Ruhelage sichtbar. Die
 * uebrigen erscheinen erst, wenn die Aufklapp-Formulare, die Schnellreferenz
 * oder das schwebende Wuerfelpaneel offen sind (Zustand "offen"), bzw. nach
 * dem Oeffnen der Editor-Aufklappmenues und dem Entbergen der Mob-Eingaben
 * der Initiative (Zustand "mob"). Der Spielleiter am Tisch arbeitet die
 * meiste Zeit in genau diesen aufgeklappten Zustaenden; eine Abnahme, die nur
 * die Ruhelage ansieht, prueft weniger als die Haelfte.
 *
 * WARUM ZWEI BREITEN UND VIER THEMES NUR IN DER RUHELAGE.
 * 13 font-size-Deklarationen stehen in Medienabfragen; bei 1440 px greift
 * KEINE davon, bei 375 px gewinnen drei — darunter `spells.css:645` mit 10 px,
 * die unter 900 px auftritt. Eine Grundlinie, die nur breit misst, sieht diese
 * Stelle nie und wuerde nach dem Umbau "null Elemente unter 11 px" melden,
 * waehrend sie unveraendert klein ist. Die vier Themes dagegen sind fuer
 * Groessen nachgemessen folgenlos: 3700 Elemente, 0 Abweichung ueber
 * dark/light/sepia/contrast. Sie laufen trotzdem mit — aber nur in der
 * Ruhelage, weil ein Themenwechsel an einer Schriftgroesse nichts aendern
 * KANN und die aufgeklappten Zustaende sonst die Laufzeit vervierfachen.
 * Faellt diese Annahme je, meldet der Vergleich der vier Ruhelage-Laeufe es
 * sofort (`--diff` zwischen zwei Laeufen derselben Datei).
 *
 * WARUM 400 MILLISEKUNDEN WARTEZEIT.
 * `getComputedStyle` liefert waehrend eines Uebergangs den INTERPOLIERTEN
 * Zwischenwert. Die langsamste Sprosse der Dauer-Leiter ist `--dur-slow`
 * (300 ms, assets/styles/variables.css); 400 ms sind der naechste runde Wert
 * darueber. Ohne diese Wartezeit ist die Ausgabe nicht wiederholbar — und
 * eine Grundlinie, die bei zwei Laeufen zwei Ergebnisse liefert, ist kein
 * Vergleichsmass. Dass es reicht, prueft der Aufrufer, indem er zweimal
 * laeuft und die Dateien byteweise vergleicht.
 *
 * WARUM DIE AUSGABE KEINEN ZEITSTEMPEL TRAEGT.
 * Genau wegen dieser Probe. Ein `new Date().toISOString()` im Kopf der Datei
 * macht jeden zweiten Lauf verschieden und die Probe unmoeglich. Die Herkunft
 * steht trotzdem drin, nur in deterministischer Form: HEAD-Kennung, Groesse
 * und SHA-256 des vermessenen Buendels. Zwei Laeufe gegen denselben Baum und
 * dasselbe Buendel liefern dieselben Bytes; ein Lauf gegen ein anderes
 * Buendel ist an seinem SHA zu erkennen.
 *
 * ZWEI BETRIEBSARTEN:
 *
 *   node tools/typo-baseline.js --out <datei.json> [--nur <lauf-label>]
 *       Erhebt und schreibt. `--nur` beschraenkt auf einen Lauf (Label aus
 *       LAEUFE, etwa `dark-375`) — fuer die Wiederholbarkeitsprobe, die nicht
 *       alle fuenf Laeufe braucht.
 *
 *   node tools/typo-baseline.js --diff <alt.json> <neu.json> [--schwelle 2]
 *       Stellt zwei Erhebungen Schluessel fuer Schluessel gegenueber und
 *       berichtet je Lauf: Spanne der Groessenaenderung, jede Ueberschreitung
 *       der Schwelle EINZELN, Gewichts- und Zeilenhoehenwechsel, sowie die
 *       Schluessel, die nur in einer der beiden Dateien stehen. Liest auch
 *       die Grundlinie der Vermessung (gleiche Schluesselform
 *       "<ansicht>|<tag.klassen#index>" -> [px, gewicht, zeilenhoehe]).
 *       Rueckgabewert 0, wenn keine Ueberschreitung bleibt, sonst 1.
 *
 * Umgebungsvariable TYPO_BASELINE_CHROMIUM: Pfad auf eine Chromium-Binaerdatei,
 * falls die von playwright-core erwartete Revision oertlich nicht liegt. Siehe
 * den Kommentar an der Fundstelle — die Browser-Fassung steht im Kopf der
 * Ausgabe, weil sie die Schriftmetrik mitbestimmt.
 *
 * Das Werkzeug SCHREIBT NICHTS im Quellbaum. Es liest `dist/` und schreibt
 * genau die mit `--out` genannte Datei.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const BUENDEL = path.join(REPO, 'dist', 'dnd-tracker-bundled.html');

/** Die Schrift-Skala der Welle 5. Nur zur BERICHTERSTATTUNG (Anteil auf der
 *  Skala) — geurteilt wird in tests/unit/design-consistency.test.js. */
const SKALA = [11, 12, 14, 16, 20, 26, 34, 72];

/** Untergrenze fuer Fliesstext (Handoff Paragraph 3.7). Ebenfalls nur Bericht. */
const UNTERGRENZE = 11;

/** Wartezeit nach jedem Zustandswechsel. Siehe Kopfkommentar. */
const RUHE_MS = 400;

/** Die 24 Ansichten, in der Reihenfolge der Navigationsleiste. */
const ANSICHTEN = [
    'dashboard',
    'party',
    'npcs',
    'locations',
    'quests',
    'encounter',
    'initiative',
    'loot',
    'shops',
    'spells',
    'notes',
    'wiki',
    'links',
    'dice',
    'timers',
    'data',
    'dmscreen',
    'bestiary',
    'sessionprep',
    'kalender',
    'reise',
    'fraktionen',
    'soundboard',
    'dicestats'
];

/** Die Rahmenbereiche ausserhalb der Ansichts-Schalen. Kopfzeile und
 *  Schnellreferenz liegen NICHT in einem `#view-*`-Container und fehlen damit
 *  jeder Erhebung, die nur die Ansichten abtastet — die Schnellreferenz
 *  allein traegt 336 Elemente. */
const RAHMEN = ['.app-header', '#quick-ref-panel', '#event-log', '#floating-dice-panel'];

/** Ansicht -> Aufklapp-Formular, Zustand "offen". Die Schluessel sind die
 *  Ansichten, in denen der Umschalter steht; die Werte die Formular-IDs. */
const FORMULARE = {
    party: 'char-form',
    npcs: 'npc-form',
    locations: 'loc-form',
    quests: 'quest-form',
    encounter: 'enc-form',
    loot: 'loot-form',
    notes: 'session-form',
    wiki: 'wiki-form',
    links: 'link-form',
    spells: 'spell-form',
    shops: 'shop-form',
    initiative: 'init-form'
};

/**
 * Die Laeufe. `zustaende` steuert, welche Zustaende der Lauf erhebt — die
 * vier Themes nur die Ruhelage, siehe Kopfkommentar.
 *
 * Der 375px-Lauf LAEDT bei 1440 und verkleinert danach. Grund: `loadApp()`
 * wartet auf eine sichtbare `.app-title`, die im Mobil-Profil verborgen ist —
 * ein direkter Start bei 375 px laeuft in den Zeitablauf. Danach bekommt der
 * entprellte resize-Beobachter aus `core/init.js` (200 ms) reichlich Zeit.
 */
const LAEUFE = [
    { label: 'dark-1440', theme: 'dark', breite: 1440, hoehe: 900, zustaende: ['ruhe', 'offen', 'mob'] },
    { label: 'light-1440', theme: 'light', breite: 1440, hoehe: 900, zustaende: ['ruhe'] },
    { label: 'sepia-1440', theme: 'sepia', breite: 1440, hoehe: 900, zustaende: ['ruhe'] },
    { label: 'contrast-1440', theme: 'contrast', breite: 1440, hoehe: 900, zustaende: ['ruhe'] },
    {
        label: 'dark-375',
        theme: 'dark',
        breite: 375,
        hoehe: 812,
        ladeBreite: 1440,
        ladeHoehe: 900,
        zustaende: ['ruhe', 'offen', 'mob']
    }
];

// ---------------------------------------------------------------------------
// Im Browser ausgefuehrt
// ---------------------------------------------------------------------------

/**
 * Erhebt einen Teilbaum. Laeuft IM BROWSER (per page.evaluate), darf also
 * nichts aus dem Node-Gueltigkeitsbereich benutzen.
 *
 * Der Schluessel ist `tag.klassen#index` mit SORTIERTEN Klassennamen: die
 * Reihenfolge in `classList` haengt daran, in welcher Folge das JS sie
 * gesetzt hat, und ist zwischen zwei Laeufen nicht zugesichert. Ohne
 * Sortierung waere die Ausgabe nicht wiederholbar. Der laufende Index
 * unterscheidet Geschwister mit gleicher Signatur.
 */
function erhebeImBrowser({ wurzel, ansicht }) {
    const w = document.querySelector(wurzel);
    if (!w) return { gefunden: false, elemente: [] };
    const alle = [w, ...Array.from(w.querySelectorAll('*'))].filter(
        el => !['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK', 'META', 'TITLE'].includes(el.tagName)
    );
    const zaehler = new Map();
    const out = [];
    for (const el of alle) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const sichtbar =
            cs.display !== 'none' &&
            cs.visibility !== 'hidden' &&
            parseFloat(cs.opacity) > 0.01 &&
            (r.width > 0 || r.height > 0);
        const klassen = el.classList ? Array.from(el.classList).sort().join('.') : '';
        const sig =
            el.tagName.toLowerCase() +
            (klassen ? '.' + klassen : '') +
            (el.id ? '#' + el.id : '');
        const i = zaehler.get(sig) || 0;
        zaehler.set(sig, i + 1);
        out.push({
            k: ansicht + '|' + sig + '#' + i,
            // Auf zwei Stellen gerundet: em-Produkte liefern Werte wie
            // 9.179999999999999, und eine Grundlinie, die sich in der
            // fuenfzehnten Stelle unterscheidet, ist unbrauchbar.
            px: Math.round(parseFloat(cs.fontSize) * 100) / 100,
            fw: cs.fontWeight,
            lh: cs.lineHeight,
            sb: sichtbar ? 1 : 0,
            // Eigener Textknoten: unterscheidet Schrift von Zeichen-Deko
            // (`.slot-pip` ist ein 18px-Kreis mit font-size 8px und ohne
            // Textinhalt). Fuer den Bericht "unter der Untergrenze" ist das
            // der Unterschied zwischen einem Befund und einem Fehlalarm.
            txt:
                el.childNodes &&
                Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())
                    ? 1
                    : 0
        });
    }
    return { gefunden: true, elemente: out };
}

/** Kopfzahlen der Seite. Belegt im Bericht, dass der Lauf das Profil und das
 *  Theme wirklich erreicht hat — ein 375px-Lauf, der auf `desktop` haengen
 *  bleibt, sieht sonst aus wie ein unauffaelliges Ergebnis. */
function kopfzahlenImBrowser() {
    const w = getComputedStyle(document.documentElement);
    return {
        theme: document.documentElement.getAttribute('data-theme'),
        layout: document.documentElement.getAttribute('data-layout'),
        wurzelPx: w.fontSize,
        bodyPx: getComputedStyle(document.body).fontSize,
        fontUi: w.getPropertyValue('--font-ui').trim(),
        textXs: w.getPropertyValue('--text-xs').trim(),
        textSm: w.getPropertyValue('--text-sm').trim(),
        innenbreite: window.innerWidth
    };
}

// ---------------------------------------------------------------------------
// Erhebung
// ---------------------------------------------------------------------------

async function erhebeZustandRuhe(page, sammeln) {
    for (const v of ANSICHTEN) {
        await page.evaluate(x => window.switchView(x), v);
        await page
            .waitForSelector('#view-' + v + '.active', { state: 'attached', timeout: 5000 })
            .catch(() => {
                /* Ansicht fehlt oder heisst anders — der Zaehler unten meldet 0 */
            });
        // Zwei Ansichten zeigen ihren Inhalt erst nach einer Auswahl. Ohne
        // diese beiden Zeilen sind 113 Laden- und 62 Fraktionselemente nicht
        // im Baum, und zwar ohne dass irgendetwas fehlschlaegt.
        if (v === 'shops') {
            await page.evaluate(() => {
                if (typeof window.toggleShop === 'function') window.toggleShop(1);
            });
        }
        if (v === 'fraktionen') {
            await page.evaluate(() => {
                if (typeof window.selectFraktion === 'function') window.selectFraktion(1);
            });
        }
        await page.waitForTimeout(RUHE_MS);
        await sammeln('#view-' + v, v);
    }
    for (const sel of RAHMEN) {
        await sammeln(sel, 'rahmen' + sel);
    }
}

async function erhebeZustandOffen(page, sammeln, protokoll) {
    for (const [view, form] of Object.entries(FORMULARE)) {
        await page.evaluate(x => window.switchView(x), view);
        await page.waitForTimeout(RUHE_MS);
        const schalter = page
            .locator('[data-action="toggle-collapse"][data-value="' + form + '"]')
            .first();
        if ((await schalter.count()) === 0) {
            protokoll.push('offen/' + form + ': kein Umschalter gefunden');
            continue;
        }
        /* dispatchEvent statt click(): bei 375 px liegt die feste
           Mobil-Kopfzeile ueber dem Umschalter und faengt die Zeigerereignisse
           ab ("<div class='mobile-header'> intercepts pointer events"), ein
           echter Klick laeuft dort in den Zeitablauf. Die Ereignisweitergabe
           haengt an `data-action` am document (ui/actions/ui-actions.js:20),
           ein aufsteigendes Klickereignis erreicht sie also genauso — und,
           anders als click({force:true}), in BEIDEN Breiten auf demselben Weg.
           Das ist hier richtig, weil gemessen werden soll, wie das offene
           Formular AUSSIEHT, nicht ob der Umschalter erreichbar ist. */
        await schalter.dispatchEvent('click');
        await page.waitForTimeout(RUHE_MS);
        const offen = await page.evaluate(x => {
            const e = document.getElementById(x);
            return e ? e.classList.contains('open') : null;
        }, form);
        protokoll.push('offen/' + form + ': offen=' + offen);
        await sammeln('#' + form, 'offen/' + form);
    }

    // Schnellreferenz und schwebendes Wuerfelpaneel. Beide liegen aussen und
    // sind in der Ruhelage geschlossen; die Schnellreferenz traegt 336
    // Elemente, darunter die kleinsten Schriftgroessen der ganzen App.
    protokoll.push(
        'offen/quick-ref: ' +
            (await page.evaluate(() => {
                if (typeof window.toggleQuickRef === 'function') {
                    window.toggleQuickRef();
                    return 'toggleQuickRef()';
                }
                const p = document.getElementById('quick-ref-panel');
                if (p) {
                    p.classList.add('open');
                    return 'Klasse open gesetzt';
                }
                return 'nicht gefunden';
            }))
    );
    await page.waitForTimeout(RUHE_MS);
    await sammeln('#quick-ref-panel', 'offen/quick-ref');

    protokoll.push(
        'offen/floating-dice: ' +
            (await page.evaluate(() => {
                const t = document.getElementById('floating-dice-trigger');
                if (!t) return 'nicht gefunden';
                t.click();
                return 'Umschalter geklickt';
            }))
    );
    await page.waitForTimeout(RUHE_MS);
    await sammeln('#floating-dice-panel', 'offen/floating-dice');
}

async function erhebeZustandMob(page, sammeln, protokoll) {
    // Die Editor-Aufklappmenues (.tb-menu) sind `hidden` und werden per
    // Attribut entborgen statt geklickt: der Klickpfad haengt an der
    // Fensterbreite (die Media-Query-Leiter 900/680 px reicht Werkzeuge ins
    // Ueberlaufmenue nach), die Erhebung soll aber in beiden Breiten
    // dieselben Knoten sehen.
    await page.evaluate(() => window.switchView('notes'));
    await page.waitForTimeout(RUHE_MS);
    const schalter = page
        .locator('[data-action="toggle-collapse"][data-value="session-form"]')
        .first();
    if ((await schalter.count()) > 0) {
        await schalter.dispatchEvent('click'); // Begruendung siehe erhebeZustandOffen()
        await page.waitForTimeout(RUHE_MS);
    }
    const menues = await page.evaluate(() => {
        const ids = [];
        document.querySelectorAll('#session-form .tb-menu').forEach(m => {
            m.hidden = false;
            m.classList.add('open');
            ids.push(m.id || '(ohne id)');
        });
        return ids;
    });
    protokoll.push('mob/tb-menu: ' + (menues.length ? menues.join(', ') : 'keine gefunden'));
    await page.waitForTimeout(RUHE_MS);
    await sammeln('#session-form', 'mob/session-form');

    await page.evaluate(() => window.switchView('initiative'));
    await page.waitForTimeout(RUHE_MS);
    const mob = await page.evaluate(() => {
        const el = document.querySelectorAll('.init-mob-dmg-inputs');
        el.forEach(e => e.classList.remove('hidden'));
        return el.length;
    });
    protokoll.push('mob/init-mob-dmg-inputs: ' + mob + ' entborgen');
    await page.waitForTimeout(RUHE_MS);
    await sammeln('#view-initiative', 'mob/initiative');
}

async function einLauf(browser, cfg, hilfen) {
    const lb = cfg.ladeBreite || cfg.breite;
    const lh = cfg.ladeHoehe || cfg.hoehe;
    const page = await browser.newPage({ viewportSize: { width: lb, height: lh } });
    await hilfen.seedPopulatedSession(page);
    await hilfen.loadApp(page);
    if (lb !== cfg.breite || lh !== cfg.hoehe) {
        await page.setViewportSize({ width: cfg.breite, height: cfg.hoehe });
        await page.waitForTimeout(700);
    }
    await page.evaluate(t => {
        document.documentElement.setAttribute('data-theme', t);
        if (window.D) {
            window.D.settings = window.D.settings || {};
            window.D.settings.theme = t;
        }
    }, cfg.theme);
    await page.waitForTimeout(RUHE_MS);

    const kopf = await page.evaluate(kopfzahlenImBrowser);
    const elemente = {};
    const bereiche = {};
    const protokoll = [];
    const roh = [];

    const sammeln = async (wurzel, ansicht) => {
        const r = await page.evaluate(erhebeImBrowser, { wurzel, ansicht });
        bereiche[ansicht] = { gefunden: r.gefunden, n: r.elemente.length };
        for (const e of r.elemente) {
            elemente[e.k] = [e.px, e.fw, e.lh];
            roh.push(e);
        }
    };

    // Erst die Ruhelage VOLLSTAENDIG, dann aufklappen: ein geoeffnetes
    // Formular veraendert seine Ansicht, und eine Ruhelage, die nach dem
    // Aufklappen erhoben wird, ist keine Ruhelage mehr.
    if (cfg.zustaende.includes('ruhe')) await erhebeZustandRuhe(page, sammeln);
    if (cfg.zustaende.includes('offen')) await erhebeZustandOffen(page, sammeln, protokoll);
    if (cfg.zustaende.includes('mob')) await erhebeZustandMob(page, sammeln, protokoll);

    await page.close();

    const sichtbar = roh.filter(e => e.sb);
    const aufSkala = sichtbar.filter(e => SKALA.includes(e.px)).length;
    const unterGrenze = roh.filter(e => e.px < UNTERGRENZE);
    return {
        kopf,
        zustaende: cfg.zustaende,
        anzahl: { dom: roh.length, sichtbar: sichtbar.length },
        skalaAnteilSichtbar: sichtbar.length
            ? Math.round((aufSkala / sichtbar.length) * 10000) / 100
            : 0,
        unterGrenzeDom: unterGrenze.length,
        unterGrenzeSichtbar: unterGrenze.filter(e => e.sb).length,
        unterGrenzeMitText: unterGrenze.filter(e => e.txt).length,
        minimum: roh.length ? Math.min(...roh.map(e => e.px)) : null,
        protokoll,
        bereiche: sortiereObjekt(bereiche),
        elemente: sortiereObjekt(elemente)
    };
}

/** Schluessel lexikografisch ordnen. Die Einfuegereihenfolge ist die
 *  Baumreihenfolge und damit zwar stabil, aber nicht NACHPRUEFBAR stabil —
 *  sortiert ist die Datei byteweise reproduzierbar, auch wenn sich einmal
 *  die Erhebungsreihenfolge aendert. */
function sortiereObjekt(o) {
    const out = {};
    for (const k of Object.keys(o).sort()) out[k] = o[k];
    return out;
}

function kurzKennung() {
    try {
        return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
            cwd: REPO,
            encoding: 'utf8'
        }).trim();
    } catch {
        /* Ohne Git-Historie (etwa in einem Abzug) bleibt die Herkunftsangabe
           leer. Kein Abbruch: die Erhebung selbst braucht Git nicht, und eine
           Grundlinie ohne Kennung ist noch immer ein Vergleichsmass. Die
           leere Bindung statt `catch (e)` haelt die Lint-Ratsche bei 363 —
           `caughtErrors` steht auf "all". */
        return '(keine Git-Kennung)';
    }
}

async function erhebe(nurLabel) {
    if (!fs.existsSync(BUENDEL)) {
        throw new Error(
            'Buendel fehlt: ' + BUENDEL + ' — zuerst `PYTHONIOENCODING=utf-8 python build.py`'
        );
    }
    // loadApp() baut seinen file://-Pfad aus process.cwd(). Ein Aufruf aus
    // einem Unterverzeichnis wuerde sonst still auf ein nicht vorhandenes
    // dist/ zeigen und mit einem Zeitablauf enden, der wie ein App-Fehler
    // aussieht.
    process.chdir(REPO);

    const bytes = fs.readFileSync(BUENDEL);
    const { createRequire } = require('module');
    const req = createRequire(path.join(REPO, 'package.json'));
    const { chromium } = req('playwright');
    const hilfen = await import(
        'file:///' + path.join(REPO, 'tests/e2e/helpers/test-utils.js').replace(/\\/g, '/')
    );

    /* TYPO_BASELINE_CHROMIUM — Notausgang fuer den Fall, dass die von
       playwright-core erwartete Browser-Revision oertlich nicht liegt.
       Playwright bindet die Revision fest (node_modules/playwright-core/
       browsers.json); steht im Browser-Zwischenspeicher nur eine andere, ist
       `chromium.launch()` ohne Pfadangabe nicht startbar, und zwar unabhaengig
       von diesem Werkzeug. Der Pfad wird in den Kopf der Ausgabe geschrieben:
       die SCHRIFTMETRIK haengt an der Browser-Fassung, zwei Erhebungen mit
       verschiedenen Fassungen sind also NICHT ohne Weiteres vergleichbar, und
       der Vergleich muss sagen koennen, welche gelaufen ist. Fuer die
       Abnahme-Gegenueberstellung gilt deshalb: beide Seiten mit DERSELBEN
       Fassung erheben. */
    const exe = process.env.TYPO_BASELINE_CHROMIUM || null;

    const ergebnis = {
        werkzeug: 'tools/typo-baseline.js',
        head: kurzKennung(),
        buendel: {
            pfad: 'dist/dnd-tracker-bundled.html',
            bytes: bytes.length,
            sha256: crypto.createHash('sha256').update(bytes).digest('hex')
        },
        saat: 'seedPopulatedSession (tests/e2e/helpers/test-utils.js)',
        skala: SKALA,
        untergrenze: UNTERGRENZE,
        ruheMs: RUHE_MS,
        browser: exe ? path.basename(path.dirname(path.dirname(exe))) : 'playwright-Vorgabe',
        laeufe: {}
    };

    const browser = await chromium.launch(exe ? { executablePath: exe } : {});
    try {
        for (const cfg of LAEUFE) {
            if (nurLabel && cfg.label !== nurLabel) continue;
            process.stdout.write('Lauf ' + cfg.label + ' ... ');
            const r = await einLauf(browser, cfg, hilfen);
            ergebnis.laeufe[cfg.label] = r;
            console.log(
                r.anzahl.dom +
                    ' Elemente (' +
                    r.anzahl.sichtbar +
                    ' sichtbar), auf Skala ' +
                    r.skalaAnteilSichtbar +
                    ' %, unter ' +
                    UNTERGRENZE +
                    'px ' +
                    r.unterGrenzeDom +
                    ', Minimum ' +
                    r.minimum +
                    'px, layout=' +
                    r.kopf.layout
            );
        }
    } finally {
        await browser.close();
    }
    return ergebnis;
}

// ---------------------------------------------------------------------------
// Vergleich
// ---------------------------------------------------------------------------

/**
 * Stellt zwei Erhebungen gegenueber. Die Schwelle ist das Abnahmekriterium
 * des Handoffs ("keine Aenderung ueber 2 px ausser beabsichtigt"); JEDE
 * Ueberschreitung wird EINZELN genannt, weil eine Summe die Frage nicht
 * beantwortet, die das Kriterium stellt.
 */
function vergleiche(alt, neu, schwelle) {
    const zeilen = [];
    let ueberschreitungen = 0;
    const labels = [...new Set([...Object.keys(alt.laeufe || {}), ...Object.keys(neu.laeufe || {})])].sort();
    for (const label of labels) {
        const a = (alt.laeufe || {})[label];
        const b = (neu.laeufe || {})[label];
        zeilen.push('');
        zeilen.push('=== Lauf ' + label + ' ===');
        if (!a || !b) {
            zeilen.push('  nur in ' + (a ? 'alt' : 'neu') + ' vorhanden — kein Vergleich');
            continue;
        }
        const ea = a.elemente || {};
        const eb = b.elemente || {};
        const gemeinsam = Object.keys(ea).filter(k => k in eb);
        const nurAlt = Object.keys(ea).filter(k => !(k in eb));
        const nurNeu = Object.keys(eb).filter(k => !(k in ea));

        const deltas = [];
        const gewicht = [];
        const zeilenhoehe = [];
        for (const k of gemeinsam) {
            const d = Math.round((eb[k][0] - ea[k][0]) * 100) / 100;
            if (d !== 0) deltas.push({ k, alt: ea[k][0], neu: eb[k][0], d });
            if (String(ea[k][1]) !== String(eb[k][1]))
                gewicht.push({ k, alt: ea[k][1], neu: eb[k][1] });
            if (String(ea[k][2]) !== String(eb[k][2]))
                zeilenhoehe.push({ k, alt: ea[k][2], neu: eb[k][2] });
        }
        deltas.sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || x.k.localeCompare(y.k));
        const spanne = deltas.length
            ? Math.min(...deltas.map(x => x.d)) + ' .. ' + Math.max(...deltas.map(x => x.d)) + ' px'
            : '0 px (keine Groessenaenderung)';
        zeilen.push(
            '  verglichene Schluessel: ' +
                gemeinsam.length +
                '   nur alt: ' +
                nurAlt.length +
                '   nur neu: ' +
                nurNeu.length
        );
        zeilen.push('  Groesse geaendert: ' + deltas.length + '   Spanne: ' + spanne);
        zeilen.push('  Gewicht geaendert: ' + gewicht.length);
        zeilen.push('  Zeilenhoehe geaendert: ' + zeilenhoehe.length);
        const ueber = deltas.filter(x => Math.abs(x.d) > schwelle);
        ueberschreitungen += ueber.length;
        if (ueber.length) {
            zeilen.push('  UEBER ' + schwelle + ' px (' + ueber.length + ', jede einzeln):');
            ueber.forEach(x =>
                zeilen.push(
                    '    ' +
                        (x.d > 0 ? '+' : '') +
                        x.d +
                        ' px   ' +
                        x.alt +
                        ' -> ' +
                        x.neu +
                        '   ' +
                        x.k
                )
            );
        }
        if (nurAlt.length) {
            zeilen.push('  nur in alt (bis 20):');
            nurAlt.slice(0, 20).forEach(k => zeilen.push('    ' + k));
        }
        if (nurNeu.length) {
            zeilen.push('  nur in neu (bis 20):');
            nurNeu.slice(0, 20).forEach(k => zeilen.push('    ' + k));
        }
    }
    return { zeilen, ueberschreitungen };
}

// ---------------------------------------------------------------------------
// Aufruf
// ---------------------------------------------------------------------------

function argWert(argv, name) {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
}

async function main(argv) {
    if (argv.includes('--diff')) {
        const i = argv.indexOf('--diff');
        const altPfad = argv[i + 1];
        const neuPfad = argv[i + 2];
        if (!altPfad || !neuPfad) {
            console.error('Aufruf: --diff <alt.json> <neu.json> [--schwelle 2]');
            return 2;
        }
        const schwelle = parseFloat(argWert(argv, '--schwelle') || '2');
        const alt = JSON.parse(fs.readFileSync(altPfad, 'utf8'));
        const neu = JSON.parse(fs.readFileSync(neuPfad, 'utf8'));
        console.log('alt: ' + altPfad + '   (HEAD ' + (alt.head || '?') + ')');
        console.log('neu: ' + neuPfad + '   (HEAD ' + (neu.head || '?') + ')');
        console.log('Schwelle: ' + schwelle + ' px');
        const { zeilen, ueberschreitungen } = vergleiche(alt, neu, schwelle);
        console.log(zeilen.join('\n'));
        console.log('');
        console.log(
            ueberschreitungen === 0
                ? '[typo-baseline --diff] OK — keine Aenderung ueber ' + schwelle + ' px.'
                : '[typo-baseline --diff] ' +
                      ueberschreitungen +
                      ' Aenderung(en) ueber ' +
                      schwelle +
                      ' px — jede oben einzeln genannt.'
        );
        return ueberschreitungen === 0 ? 0 : 1;
    }

    const out = argWert(argv, '--out');
    if (!out) {
        console.error(
            'Aufruf:\n' +
                '  node tools/typo-baseline.js --out <datei.json> [--nur <lauf-label>]\n' +
                '  node tools/typo-baseline.js --diff <alt.json> <neu.json> [--schwelle 2]\n' +
                'Laeufe: ' +
                LAEUFE.map(l => l.label).join(', ')
        );
        return 2;
    }
    const ergebnis = await erhebe(argWert(argv, '--nur'));
    // Ohne Zeilenumbrueche und ohne Zeitstempel: die Datei ist ein
    // Vergleichsmass, kein Lesestoff — und nur so ist sie byteweise
    // reproduzierbar.
    fs.writeFileSync(out, JSON.stringify(ergebnis));
    console.log(
        '\ngeschrieben: ' +
            out +
            '  (' +
            (fs.statSync(out).size / 1048576).toFixed(2) +
            ' MB, SHA-256 ' +
            crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex').slice(0, 16) +
            ')'
    );
    return 0;
}

if (require.main === module) {
    main(process.argv.slice(2))
        .then(code => {
            process.exitCode = code;
        })
        .catch(err => {
            console.error('[typo-baseline] FEHLER: ' + (err && err.message ? err.message : err));
            process.exitCode = 1;
        });
}

module.exports = {
    ANSICHTEN,
    RAHMEN,
    FORMULARE,
    LAEUFE,
    SKALA,
    UNTERGRENZE,
    RUHE_MS,
    sortiereObjekt,
    vergleiche,
    erhebe,
    main
};
