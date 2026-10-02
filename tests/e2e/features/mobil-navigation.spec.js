// @ts-check
/**
 * E2E — Alle 24 Ansichten auf dem Telefon erreichbar (M1).
 *
 * WARUM ES DIESE PROBE BRAUCHT. Im Mobil-Layout ist die Kopfzeile eine feste
 * Leiste am UNTEREN Fensterrand, die per `.mobile-nav-toggle` ausfaehrt
 * (`.app-header.nav-open`, `transform: translateY(0)`). Darin liegen die 24
 * Reiter flach in einem Raster aus vier Spalten — die sechs Desktop-Gruppen
 * werden dort aufgeloest (`.nav-group { display: contents }`). Der Umschalter
 * selbst war immer erreichbar; die Reiter dahinter waren es nicht.
 *
 * GEMESSEN am Buendel zu cecfefe (`setLayout('mobile')`, Umschalter auf seinen
 * gemessenen Koordinaten geklickt, `elementFromPoint` auf der Reitermitte).
 *
 * EINE EINZIGE ZAHLENREIHE GAB ES NIE, und das ist selbst ein Befund: wie viele
 * Reiter erreichbar waren, hing daran, wie viele Meldungen gerade im
 * Ereignis-Log standen. Jeder Eintrag machte es rund 70px hoeher (153px bei
 * zwei Eintraegen, 223px bei drei) und verdeckte damit eine weitere Reiterreihe.
 * `setLayout('mobile')` schreibt selbst eine Meldung ("Layout: Mobil"), die
 * Sicherungserinnerung eine zweite — die Messung stoerte also ihren eigenen
 * Gegenstand. Deshalb stehen hier alle drei Zustaende mit ihrer Bedingung statt
 * einer Reihe ohne:
 *
 *   Zustand                                  390x844  360x740  700x800
 *   --------------------------------------   -------  -------  -------
 *   schlicht, zwei fluechtige Meldungen           11       13       16
 *   schlicht, drei (ein `setTheme()` mehr)         7       10       14
 *   voll (Dauermodus mit 5 Meldungen UND              6        0*       8
 *         offenem Kampfprotokoll)
 *
 *   * bei 360x740 lag das Kampfprotokoll auf der Umschalter-Zeile: die Leiste
 *     liess sich gar nicht erst ausfahren, also waren ALLE 24 unerreichbar.
 *
 * In jedem dieser Zustaende lagen 20 der 24 Reitermitten im sichtbaren Feld der
 * Leiste (ausser im Fall mit dem Stern, wo es 0 waren), die Leiste war 357px
 * hoch, das Raster 300px sichtbar bei 444px Inhalt.
 *
 * ZWEI UNABHAENGIGE URSACHEN, beide beziffert:
 *
 *   A — DECKEL. `.nav-tabs` trug im Mobil-Zweig `max-height: 300px` bei einem
 *       Rasterinhalt von 444px. Die 300 sind eine Zahl ohne Bezug zum Fenster:
 *       bei 390x844 liegen unter dem Umzugs-Band 623px frei, die Leiste nahm
 *       300. Die unterste Reihe (Soundboard, Statistiken, Session-Prep, Daten)
 *       lag dauerhaft hinter dem `overflow`.
 *
 *   B — UEBERDECKUNG durch bodenverankerte Schwebeelemente. Je Reiter der
 *       Verdecker, den `elementFromPoint` zurueckgab (390x844):
 *         Orte, Kalender, Reise, Quests, Initiative, Begegnung, Bestiar
 *             -> `#event-log` (`--z-toast` = 4000, `bottom: 80px`; die
 *                Eintraege trugen `pointer-events: auto`, obwohl an einem
 *                fluechtigen Eintrag nichts zu klicken ist)
 *         Notizen  -> `#floating-dice-trigger` (`--z-floating` = 2000)
 *         DM Screen, Daten -> `.qref-fab` (`--z-panel` = 600, gleiche Ebene wie
 *                die Leiste, aber spaeter im Dokument)
 *       Wie viele es sind, haengt daran, wie viele Meldungen gerade im
 *       Ereignis-Log stehen — die Erreichbarkeit war also nicht einmal stabil.
 *       Das Kampfprotokoll (`.kplog-panel`) reichte im Mobil-Layout bis 20px
 *       ueber den unteren Fensterrand und kam als vierter Verdecker hinzu,
 *       sobald es offen stand.
 *
 * WARUM PER MAUSRAD. Ein gesetztes `scrollTop` und ein `scrollIntoView()`
 * bewegen auch einen Bereich, den der Nutzer nicht scrollen kann, und melden
 * Erreichbarkeit, wo keine ist. Vorbild: `ansichts-schalen.spec.js`,
 * `hoehenbudget.spec.js`.
 *
 * WARUM MIT UMZUGS-BAND. Es ist der Normalfall am Spieltisch: der Spielleiter
 * faehrt die App per `file://`, und dort erscheint der Umzugs-Hinweis in jeder
 * frischen Browsersitzung. Das Band ist bei 360-390px Breite 157px hoch und
 * nimmt der Leiste genau den Platz, um den es hier geht. Es wird deshalb NICHT
 * unterdrueckt.
 *
 * WAS DIE FUENF ZUSICHERUNGEN TRENNEN:
 *
 *   1  Alle 24 Reiter werden im Lauf eines echten Rad-Durchlaufs erreichbar.
 *   2  Kein SICHTBARES Schwebeelement ueberlappt die ausgefahrene Leiste.
 *      Geprueft wird die Flaeche, nicht der Klick: ein Element mit
 *      `pointer-events: none` laesst den Klick durch, verdeckt die
 *      Reiterbeschriftung aber genauso.
 *   3  Bei 360x740 und 390x844 passt der Rasterinhalt OHNE Scrollen in die
 *      Leiste. Das ist die Zusicherung gegen Ursache A: das Fenster gibt den
 *      Platz her, also darf die Leiste ihn nehmen.
 *   4  Die Tippflaeche bleibt bei mindestens 44px — darunter trifft ein Daumen
 *      nicht mehr zuverlaessig. Die 24 Ansichten duerfen NICHT dadurch
 *      hineinpassen, dass die Reiter unter die Fingergroesse schrumpfen.
 *   5  Im kurzen Fenster (740x360, Telefon im Querformat) MUSS die Leiste
 *      scrollen — und das Mausrad erreicht dort trotzdem alle 24. Ohne diesen
 *      Fall waere der `overflow`-Rueckfall eine unbelegte Behauptung.
 *
 * Betroffene Quellen: `assets/styles/variables.css` (Mobil-Zweig der Leiste),
 * `ui/editors/rich-text-insert.js` (die gemessenen Tokens),
 * `assets/styles/party.css` (Ereignis-Log).
 */
import { test, expect } from '@playwright/test';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

const THEMES = ['dark', 'light', 'sepia', 'contrast'];

/** Die beiden Telefonfenster des Auftrags. */
const FENSTER = [
    [390, 844],
    [360, 740]
];

/** Telefon im Querformat — hier MUSS die Leiste scrollen. */
const KURZES_FENSTER = [740, 360];

/* Das ENGSTE gebraeuchliche Telefon. CLAUDE.md nennt 320px ausdruecklich als
   Mobil-Pruefbreite („Mobile First: Test widgets at 320px width"); die erste
   Runde dieser Probe hat genau diese Breite ausgelassen und konnte den
   waagerechten Ueberhang deshalb nicht sehen. 320x568 ist das iPhone SE der
   ersten Bauart, 320x740 ein schmales Android-Geraet. */
const ENGE_FENSTER = [
    [320, 568],
    [320, 740]
];

/** Vollzahl der Ansichten (dieselbe Liste wie in der Reiter-Registrierung). */
const ANZAHL_ANSICHTEN = 24;

/** Kleinste Tippflaeche, die ein Daumen zuverlaessig trifft. */
const MIN_TIPPFLAECHE = 44;

/* Saat wie in den uebrigen Mobil-Proben: ein `_version` weit in der Zukunft
   ueberspringt die Datenwanderung, die gefuellte `_nextId`-Abbildung verhindert
   die Fruehstart-Rennen. Daten braucht diese Probe nicht — nur einen Zustand,
   in dem die App ohne Zwischenfragen bedienbar ist. */
const SAAT = {
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
    characters: [],
    npcs: [],
    locations: [],
    quests: [],
    encounters: [],
    loot: [],
    spells: [],
    wiki: [],
    sessionNotes: [],
    randomTables: [],
    timers: [],
    shops: [],
    campaign: {},
    _nextId: {
        characters: 99,
        npcs: 99,
        locations: 99,
        quests: 99,
        encounters: 99,
        spells: 99,
        loot: 99,
        items: 99,
        wiki: 99,
        sessionNotes: 99,
        randomTables: 99
    }
};

/**
 * Laedt das gebaute Buendel, stellt das Mobil-Layout und das Theme her.
 *
 * Die Saat ist ein Parameter mit Standardwert, damit die Zusicherung 11 weiter
 * unten mit einer GEFUELLTEN Kampagne laden kann, ohne dass sich fuer die acht
 * Zusicherungen darueber irgendetwas aendert.
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 * @param {object} [saat] Ausgangsdaten im localStorage; Standard ist der Leerzustand.
 */
async function mobilLaden(page, theme, saat = SAAT) {
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng;
            // dann greift der Leerzustand, und der ist fuer diese Probe genauso
            // brauchbar.
        }
    }, saat);
    await page.goto(APP_URL);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 25000
    });
    await page.waitForTimeout(500);
    await page.evaluate(t => {
        // @ts-ignore — global aus dem Theme-Modul
        if (typeof window.setTheme === 'function') window.setTheme(t);
        // @ts-ignore — global aus den Layout-Profilen
        if (typeof window.setLayout === 'function') window.setLayout('mobile');
    }, theme);
    await page.waitForTimeout(400);
    const stand = await page.evaluate(() => ({
        theme: document.documentElement.getAttribute('data-theme'),
        layout: document.documentElement.dataset.layout
    }));
    expect(stand.theme, `Theme ${theme} wurde nicht gesetzt`).toBe(theme);
    expect(stand.layout, 'das Mobil-Layout wurde nicht gesetzt').toBe('mobile');
}

/**
 * Stellt den vollen Zustand her: Ereignis-Log im Dauermodus mit fuenf
 * Meldungen, Kampfprotokoll offen. Das ist der Zustand, in dem die
 * Ueberdeckung am schwersten war.
 * @param {import('@playwright/test').Page} page
 */
async function vollerZustand(page) {
    await page.evaluate(() => {
        // @ts-ignore — global aus den Hilfsfunktionen
        if (typeof window.toggleEventLog === 'function') window.toggleEventLog();
        for (let i = 1; i <= 5; i++) {
            // @ts-ignore — global aus den Hilfsfunktionen
            if (typeof window.showToast === 'function')
                window.showToast('Probemeldung ' + i, 'info');
        }
        // @ts-ignore — global aus dem Kampfprotokoll
        if (typeof window.toggleCombatLog === 'function') window.toggleCombatLog();
    });
    await page.waitForTimeout(400);
    const offen = await page.evaluate(() => ({
        log: !!document.querySelector('#event-log.persistent'),
        eintraege: document.querySelectorAll('#event-log .event-log-entry').length,
        protokoll: !!document.querySelector('.kplog-panel.active')
    }));
    expect(offen.log, 'der Dauermodus des Ereignis-Logs liess sich nicht herstellen').toBe(true);
    expect(offen.eintraege, 'das Ereignis-Log muss Meldungen tragen').toBeGreaterThan(0);
    expect(offen.protokoll, 'das Kampfprotokoll liess sich nicht oeffnen').toBe(true);
}

/**
 * Faehrt die Leiste ueber den echten Umschalter aus — und prueft VORHER, dass
 * der Weg dorthin frei ist.
 *
 * Die eingeklappte Leiste zeigt nur die Umschalter-Zeile am unteren Fensterrand.
 * Liegt darauf ein Schwebeelement, sind alle 24 Ansichten unerreichbar, ohne dass
 * eine Messung an der ausgefahrenen Leiste das jemals bemerkt: man kommt gar
 * nicht dazu, sie auszufahren. Gemessen am Buendel zu cecfefe mit offenem
 * Kampfprotokoll antwortete `elementFromPoint` auf der Mitte der
 * Umschalter-Zeile mit `div#kampflog-panel.kplog-panel.active` — bei 390x844,
 * 360x740 UND 740x360.
 *
 * Geklickt wird auf den gemessenen Koordinaten, nicht per Element-Klick: ein
 * Element-Klick rollt ins Sichtfeld und erzwingt die Zustellung und
 * uebersprignt damit genau die Frage.
 * @param {import('@playwright/test').Page} page
 */
async function leisteOeffnen(page) {
    const schon = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    if (!schon) {
        const weg = await page.evaluate(() => {
            const u = document.querySelector('.mobile-nav-toggle');
            if (!u) return null;
            const r = u.getBoundingClientRect();
            const cx = Math.round(r.left + r.width / 2);
            const cy = Math.round(r.top + r.height / 2);
            const el = document.elementFromPoint(cx, cy);
            const bez = e => {
                if (!e) return 'nichts';
                const id = e.id ? '#' + e.id : '';
                const kl =
                    typeof e.className === 'string' && e.className.trim()
                        ? '.' + e.className.trim().split(/\s+/).join('.')
                        : '';
                return e.tagName.toLowerCase() + id + kl;
            };
            return { cx, cy, frei: !!el && (el === u || u.contains(el)), obenauf: bez(el) };
        });
        expect(weg, 'die Umschalter-Zeile fehlt').not.toBeNull();
        expect(
            weg.frei ? 'frei' : weg.obenauf,
            `der Weg in die Leiste muss frei sein (Mitte ${weg.cx},${weg.cy})`
        ).toBe('frei');
        await page.mouse.click(weg.cx, weg.cy);
        await page.waitForTimeout(450); // 0.3s Uebergang plus Luft
    }
    const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    expect(offen, 'die Leiste liess sich nicht ausfahren').toBe(true);
}

/**
 * Faehrt die Leiste wieder ein, damit der naechste Zustand den echten
 * Oeffnungsweg erneut gehen muss.
 * @param {import('@playwright/test').Page} page
 */
async function leisteSchliessen(page) {
    const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    if (!offen) return;
    const mitte = await page.evaluate(() => {
        const u = document.querySelector('.mobile-nav-toggle');
        if (!u) return null;
        const r = u.getBoundingClientRect();
        return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
    });
    if (!mitte) return;
    await page.mouse.click(mitte[0], mitte[1]);
    await page.waitForTimeout(450);
    const zu = await page.evaluate(() => !document.querySelector('.app-header.nav-open'));
    expect(zu, 'die Leiste liess sich nicht einfahren').toBe(true);
}

/**
 * Laeuft im Browser. Misst die ausgefahrene Leiste, jeden Reiter und jedes
 * sichtbare Schwebeelement, das die Leistenflaeche schneidet.
 *
 * Reine Funktion ihrer Umgebung, kein Zugriff auf Modul-Scope — sie wird
 * serialisiert.
 */
function messeLeiste() {
    const bez = e => {
        if (!e) return 'nichts';
        const id = e.id ? '#' + e.id : '';
        const kl =
            typeof e.className === 'string' && e.className.trim()
                ? '.' + e.className.trim().split(/\s+/).join('.')
                : '';
        return e.tagName.toLowerCase() + id + kl;
    };
    const kopf = document.querySelector('.app-header');
    const nav = document.querySelector('.nav-tabs');
    if (!kopf || !nav) return { fehlt: true };
    const kr = kopf.getBoundingClientRect();
    const nr = nav.getBoundingClientRect();

    const reiter = Array.from(document.querySelectorAll('.nav-tab[data-view]')).map(t => {
        const r = t.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const el = document.elementFromPoint(cx, cy);
        const obenauf = el ? getComputedStyle(el) : null;
        return {
            view: t.dataset.view,
            breite: Math.round(r.width),
            hoehe: Math.round(r.height),
            mitte: [Math.round(cx), Math.round(cy)],
            // Liegt die Mitte im SICHTBAREN Feld der Leiste (also nicht hinter
            // deren eigenem overflow) und im Fenster?
            imFeld: cy >= nr.top && cy <= nr.bottom && cy >= 0 && cy <= window.innerHeight,
            // Liegt die Mitte waagerecht ueberhaupt im Fenster? Steht hier
            // `false`, antwortet `elementFromPoint` mit `null` — nicht weil etwas
            // darueberliegt, sondern weil der Punkt die Scheibe verlassen hat.
            imFensterWaagerecht: cx >= 0 && cx <= window.innerWidth,
            erreichbar: !!el && (el === t || t.contains(el)),
            // Laeuft die Beschriftung aus ihrem EIGENEN Knopf heraus? Das ist der
            // Preis der naheliegenden, falschen Korrektur (Zusicherung 7).
            textUeberlauf: t.scrollWidth - t.clientWidth,
            obenauf: bez(el),
            obenaufPos: obenauf ? obenauf.position : null,
            obenaufZ: obenauf ? obenauf.zIndex : null
        };
    });

    // Schwebeelemente, die die Leistenflaeche SICHTBAR schneiden. Die Leiste
    // selbst und alles darin ist ausgenommen.
    const ueberlapper = Array.from(document.body.querySelectorAll('*'))
        .filter(e => {
            if (e === kopf || kopf.contains(e)) return false;
            const cs = getComputedStyle(e);
            if (cs.position !== 'fixed') return false;
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            if (parseFloat(cs.opacity) === 0) return false;
            const r = e.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) return false;
            return r.bottom > kr.top && r.top < kr.bottom && r.right > kr.left && r.left < kr.right;
        })
        .map(e => {
            const r = e.getBoundingClientRect();
            const cs = getComputedStyle(e);
            return {
                was: bez(e),
                oben: Math.round(r.top),
                unten: Math.round(r.bottom),
                links: Math.round(r.left),
                rechts: Math.round(r.right),
                z: cs.zIndex,
                // Flaeche der Ueberlappung mit der Leiste, in Bildpunkten
                deckung: Math.round(
                    Math.max(0, Math.min(r.bottom, kr.bottom) - Math.max(r.top, kr.top)) *
                        Math.max(0, Math.min(r.right, kr.right) - Math.max(r.left, kr.left))
                )
            };
        })
        // Nur echte Ueberlappungen melden, keine Beruehrung auf Kante.
        .filter(u => u.deckung > 0);

    return {
        fehlt: false,
        fensterHoehe: window.innerHeight,
        leisteOben: Math.round(kr.top),
        leisteHoehe: Math.round(kr.height),
        navOben: Math.round(nr.top),
        navUnten: Math.round(nr.bottom),
        navSichtHoehe: nav.clientHeight,
        navInhaltHoehe: nav.scrollHeight,
        // Die WAAGERECHTE Achse, dieselbe Groesse eine Vierteldrehung weiter.
        navSichtBreite: nav.clientWidth,
        navInhaltBreite: nav.scrollWidth,
        navRollstand: Math.round(nav.scrollTop),
        navRollstandWaagerecht: Math.round(nav.scrollLeft),
        reiter,
        ueberlapper
    };
}

/**
 * Dreht das Mausrad MIT DER MAUS UEBER DER LEISTE. Kein `scrollTop`, kein
 * `scrollIntoView()` — nur so misst der Lauf, was ein Finger/Rad auch erreicht.
 * @param {import('@playwright/test').Page} page
 * @param {number} dy
 */
async function radeln(page, dy) {
    const mitte = await page.evaluate(() => {
        const nav = document.querySelector('.nav-tabs');
        if (!nav) return null;
        const r = nav.getBoundingClientRect();
        return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
    });
    if (!mitte) return;
    await page.mouse.move(mitte[0], mitte[1]);
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(140);
}

/**
 * Faehrt die Leiste per Mausrad von oben nach unten durch und sammelt, welcher
 * Reiter dabei MINDESTENS EINMAL per `elementFromPoint` erreichbar war.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{erreicht: Set<string>, offen: Array<string>, letzte: object, runden: number}>}
 */
async function radDurchlauf(page) {
    await radeln(page, -3000); // erst an den Anfang
    const erreicht = new Set();
    const verdecker = new Map();
    let letzterStand = null;
    let letzte = null;
    let runden = 0;
    for (let i = 0; i < 30; i++) {
        runden = i + 1;
        const m = await page.evaluate(messeLeiste);
        letzte = m;
        for (const r of m.reiter) {
            if (r.erreichbar) erreicht.add(r.view);
            else
                verdecker.set(
                    r.view,
                    `${r.obenauf} (pos=${r.obenaufPos} z=${r.obenaufZ}, imFeld=${r.imFeld})`
                );
        }
        if (erreicht.size === m.reiter.length) break;
        if (letzterStand !== null && m.navRollstand === letzterStand) break; // bewegt sich nicht mehr
        letzterStand = m.navRollstand;
        await radeln(page, 140);
    }
    const offen = letzte.reiter
        .map(r => r.view)
        .filter(v => !erreicht.has(v))
        .map(v => `${v}: ${verdecker.get(v) || '(kein Befund)'}`);
    return { erreicht, offen, letzte, runden };
}

/**
 * ZUSICHERUNG 6 und 7 — die WAAGERECHTE Achse.
 *
 * Die erste Runde dieser Probe hat die Leiste nur senkrecht vermessen. Das
 * Raster laeuft aber auch zur Seite aus dem Fenster: `repeat(4, 1fr)` kann
 * seine Spalten nicht unter die Min-Inhalt-Breite eines Reiters druecken,
 * solange dessen Beschriftung `white-space: nowrap` traegt. Gemessen am
 * Buendel zu 4df04c1 betrug `scrollWidth` deshalb bei JEDER Telefonbreite
 * 408px — bei 320px Fensterbreite liegt die vierte Spalte (x 308..400) damit
 * ganz ausserhalb der Scheibe, ihre Mitte bei x=354. Dort antwortet
 * `elementFromPoint` mit `null`, und zwar nicht, weil etwas darueberliegt,
 * sondern weil der Punkt das Fenster verlassen hat: sechs Ansichten
 * (Fraktionen, Quests, Wiki, Shops, DM Screen, Daten) waren unerreichbar. Bei
 * 360px und 390px war dieselbe Ursache milder sichtbar — Ueberhang 48px bzw.
 * 18px, die rechte Spalte angeschnitten.
 *
 * ZUSICHERUNG 6 prueft deshalb `scrollWidth <= clientWidth`: die Leiste darf
 * nicht breiter sein als das Fenster. Ein waagerechtes Mausrad erreicht die
 * letzte Spalte zwar, aber dann verlaesst die erste das Fenster — es sind nie
 * alle 24 gleichzeitig da, und nichts in der Leiste deutet auf diese Geste hin.
 *
 * ZUSICHERUNG 7 prueft, dass keine Beschriftung aus ihrem EIGENEN Knopf
 * laeuft. Sie ist die Schranke gegen die naheliegende, falsche Korrektur:
 * `min-width: 0` allein laesst die Spalten zwar schrumpfen (gemessen:
 * scrollWidth 408 -> 320, 24/24 erreichbar), aber die Beschriftung behaelt
 * `nowrap` und quillt dann ueber den Knopfrand auf den Nachbarn — bei 320px
 * gemessen fuer `dmscreen` (+1px), `soundboard` (+4px) und `sessionprep`
 * (+6px). Diese Zusicherung ist am Stand VOR der Korrektur gruen; sie ist kein
 * Nachweis, sondern ein Riegel, der genau diese halbe Loesung ausschliesst.
 *
 * @param {object} m Ergebnis von messeLeiste()
 * @param {number} breite Fensterbreite
 * @param {string} kennung Zustandsname fuer die Fehlermeldung
 */
function pruefeWaagerechteAchse(m, breite, kennung) {
    // Zusicherung 6 — die Leiste bleibt im Fenster.
    expect(
        m.navInhaltBreite - m.navSichtBreite,
        `${kennung}: bei ${breite}px Fensterbreite muss das Reiterraster waagerecht ` +
            `hineinpassen (Inhalt ${m.navInhaltBreite}px, Sichtfeld ${m.navSichtBreite}px). ` +
            `Ausserhalb liegende Reitermitten: ` +
            JSON.stringify(
                m.reiter.filter(r => !r.imFensterWaagerecht).map(r => `${r.view} x=${r.mitte[0]}`)
            )
    ).toBeLessThanOrEqual(0);

    // Zusicherung 7 — keine Beschriftung quillt aus ihrem Knopf.
    expect(
        m.reiter.filter(r => r.textUeberlauf > 0).map(r => `${r.view} +${r.textUeberlauf}px`),
        `${kennung}: Beschriftungen laufen aus ihrem eigenen Knopf heraus`
    ).toEqual([]);
}

/* ====================================================================
   ZUSICHERUNG 1-4 — die beiden Telefonfenster, alle vier Themes.
   ==================================================================== */
test.describe('M1 — alle 24 Ansichten auf dem Telefon', () => {
    for (const theme of THEMES) {
        for (const [breite, hoehe] of FENSTER) {
            test(`${breite}x${hoehe}, Theme ${theme}: alle 24 Reiter erreichbar`, async ({
                page
            }) => {
                await page.setViewportSize({ width: breite, height: hoehe });
                await mobilLaden(page, theme);

                for (const zustand of ['schlicht', 'voll']) {
                    // Jeder Zustand geht den Oeffnungsweg selbst — sonst bliebe
                    // ungeprueft, ob die Umschalter-Zeile im vollen Zustand noch
                    // frei liegt.
                    await leisteSchliessen(page);
                    if (zustand === 'voll') await vollerZustand(page);
                    await leisteOeffnen(page);

                    const erste = await page.evaluate(messeLeiste);
                    console.log(
                        `[M1] ${breite}x${hoehe} ${theme} ${zustand}: Leiste ${erste.leisteHoehe}px ` +
                            `(oben ${erste.leisteOben}), Raster Sicht ${erste.navSichtHoehe}px / ` +
                            `Inhalt ${erste.navInhaltHoehe}px, waagerecht ` +
                            `${erste.navSichtBreite}px / ${erste.navInhaltBreite}px, erreichbar ` +
                            `${erste.reiter.filter(r => r.erreichbar).length}/${erste.reiter.length}, ` +
                            `Ueberlapper ${JSON.stringify(erste.ueberlapper)}`
                    );

                    expect(
                        erste.reiter.length,
                        `${zustand}: die Leiste muss alle Ansichten fuehren`
                    ).toBe(ANZAHL_ANSICHTEN);

                    pruefeWaagerechteAchse(erste, breite, `${zustand}`);

                    // Zusicherung 3 — der Platz ist da, also darf die Leiste ihn nehmen.
                    expect(
                        erste.leisteHoehe,
                        `${zustand}: die Leiste darf nicht hoeher als das Fenster sein ` +
                            `(${erste.leisteHoehe}px bei ${hoehe}px)`
                    ).toBeLessThanOrEqual(hoehe);
                    expect(
                        erste.navInhaltHoehe - erste.navSichtHoehe,
                        `${zustand}: bei ${breite}x${hoehe} muss der Rasterinhalt ohne Scrollen ` +
                            `hineinpassen (Inhalt ${erste.navInhaltHoehe}px, Sichtfeld ` +
                            `${erste.navSichtHoehe}px)`
                    ).toBeLessThanOrEqual(0);

                    // Zusicherung 4 — die Tippflaeche bleibt fingergross.
                    const zuKlein = erste.reiter
                        .filter(r => r.hoehe < MIN_TIPPFLAECHE || r.breite < MIN_TIPPFLAECHE)
                        .map(r => `${r.view} ${r.breite}x${r.hoehe}px`);
                    expect(zuKlein, `${zustand}: Tippflaechen unter ${MIN_TIPPFLAECHE}px`).toEqual(
                        []
                    );

                    // Zusicherung 2 — nichts liegt sichtbar auf der Leiste.
                    expect(
                        erste.ueberlapper.map(u => `${u.was} deckt ${u.deckung}px² (z=${u.z})`),
                        `${zustand}: Schwebeelemente ueber der ausgefahrenen Leiste`
                    ).toEqual([]);

                    // Zusicherung 1 — jeder Reiter wird im Rad-Durchlauf erreichbar.
                    const lauf = await radDurchlauf(page);
                    console.log(
                        `[M1] ${breite}x${hoehe} ${theme} ${zustand}: Rad-Durchlauf ` +
                            `${lauf.runden} Runden, erreicht ${lauf.erreicht.size}/${ANZAHL_ANSICHTEN}`
                    );
                    expect(
                        lauf.offen,
                        `${zustand}: nicht erreichbare Reiter (${lauf.erreicht.size}/${ANZAHL_ANSICHTEN})`
                    ).toEqual([]);
                }
            });
        }
    }
});

/* ====================================================================
   ZUSICHERUNG 1b — der echte Klick fuehrt wirklich in die Ansicht.
   ====================================================================
   Erreichbarkeit per `elementFromPoint` ist die halbe Antwort. Die andere ist,
   dass der Klick an genau dieser Stelle auch die Ansicht wechselt. Geklickt
   wird mit der MAUS AUF DEN KOORDINATEN, nicht per Element-Klick (der wuerde
   ins Sichtfeld rollen und damit genau die Frage ueberspringen). */
test.describe('M1 — jeder Reiter fuehrt in seine Ansicht', () => {
    for (const theme of THEMES) {
        test(`390x844, Theme ${theme}: 24 echte Klicks`, async ({ page }) => {
            test.setTimeout(180000);
            await page.setViewportSize({ width: 390, height: 844 });
            await mobilLaden(page, theme);

            const ansichten = await page.evaluate(() =>
                Array.from(document.querySelectorAll('.nav-tab[data-view]')).map(
                    t => t.dataset.view
                )
            );
            expect(ansichten.length, 'alle Ansichten muessen gefuehrt werden').toBe(
                ANZAHL_ANSICHTEN
            );

            const gescheitert = [];
            for (const view of ansichten) {
                await leisteOeffnen(page);
                // Per Mausrad so weit fahren, bis genau dieser Reiter erreichbar ist.
                await radeln(page, -3000);
                let treffer = null;
                let letzterStand = null;
                for (let i = 0; i < 30; i++) {
                    const m = await page.evaluate(messeLeiste);
                    const r = m.reiter.find(x => x.view === view);
                    if (r && r.erreichbar) {
                        treffer = r;
                        break;
                    }
                    if (letzterStand !== null && m.navRollstand === letzterStand) break;
                    letzterStand = m.navRollstand;
                    await radeln(page, 140);
                }
                if (!treffer) {
                    gescheitert.push(`${view}: nicht erreichbar`);
                    continue;
                }
                await page.mouse.click(treffer.mitte[0], treffer.mitte[1]);
                await page.waitForTimeout(300);
                const aktiv = await page.evaluate(
                    v => !!document.querySelector(`#view-${v}.active`),
                    view
                );
                if (!aktiv) gescheitert.push(`${view}: Klick wechselte die Ansicht nicht`);
            }
            expect(gescheitert, `Reiter ohne Wirkung (Theme ${theme})`).toEqual([]);
        });
    }
});

/* ====================================================================
   ZUSICHERUNG 5 — das kurze Fenster, in dem die Leiste scrollen MUSS.
   ====================================================================
   Ohne diesen Fall waere der `overflow`-Rueckfall eine Behauptung: er greift
   bei 360x740 und 390x844 gar nicht, weil dort alles hineinpasst. Im Querformat
   (740x360) passt es nicht, und nur das Mausrad darf die Antwort geben. */
test.describe('M1 — kurzes Fenster: das Mausrad reicht', () => {
    test(`${KURZES_FENSTER[0]}x${KURZES_FENSTER[1]}: Leiste scrollt, alle 24 bleiben erreichbar`, async ({
        page
    }) => {
        const [breite, hoehe] = KURZES_FENSTER;
        await page.setViewportSize({ width: breite, height: hoehe });
        await mobilLaden(page, 'dark');
        await vollerZustand(page);
        await leisteOeffnen(page);

        const m = await page.evaluate(messeLeiste);
        console.log(
            `[M1] ${breite}x${hoehe} dark voll: Leiste ${m.leisteHoehe}px, Raster Sicht ` +
                `${m.navSichtHoehe}px / Inhalt ${m.navInhaltHoehe}px, Ueberlapper ` +
                `${JSON.stringify(m.ueberlapper)}`
        );

        expect(
            m.leisteHoehe,
            `die Leiste darf das Fenster nicht ueberschreiten (${m.leisteHoehe}px bei ${hoehe}px)`
        ).toBeLessThanOrEqual(hoehe);
        expect(
            m.navInhaltHoehe,
            `in diesem Fenster MUSS gescrollt werden (Inhalt ${m.navInhaltHoehe}px, Sichtfeld ${m.navSichtHoehe}px)`
        ).toBeGreaterThan(m.navSichtHoehe);
        expect(
            m.ueberlapper.map(u => `${u.was} deckt ${u.deckung}px² (z=${u.z})`),
            'Schwebeelemente ueber der ausgefahrenen Leiste'
        ).toEqual([]);

        const lauf = await radDurchlauf(page);
        console.log(
            `[M1] ${breite}x${hoehe}: Rad-Durchlauf ${lauf.runden} Runden, erreicht ` +
                `${lauf.erreicht.size}/${ANZAHL_ANSICHTEN}`
        );
        expect(
            lauf.offen,
            `nicht erreichbare Reiter (${lauf.erreicht.size}/${ANZAHL_ANSICHTEN})`
        ).toEqual([]);
    });
});

/* ====================================================================
   ZUSICHERUNG 6/7 — das ENGE Telefon, auf dem die waagerechte Achse bricht.
   ====================================================================
   Die erste Runde dieser Probe hat 360px und 390px gemessen und daraus „alle
   24 Ansichten auf dem Telefon" geschlossen. Bei 320px — der Breite, die
   CLAUDE.md als Mobil-Pruefbreite nennt — stimmte der Satz nicht: die vierte
   Rasterspalte lag vollstaendig ausserhalb des Fensters, erreichbar waren 18
   von 24. Ein Fall, der dieselbe Zusicherung bei derselben Fenstermenge
   wiederholt, haette das nie gemeldet; deshalb steht hier eine eigene
   Fenstermenge und nicht nur eine weitere Zeile in der alten.

   Was hier NICHT gefordert wird: dass der Rasterinhalt senkrecht ohne Scrollen
   hineinpasst. Bei 320x568 ist das Fenster dafuer zu kurz (gemessen 452px
   Inhalt gegen 368px Sichtfeld), und genau dafuer gibt es den
   `overflow`-Rueckfall, den der Rad-Durchlauf unten mitprueft. Gefordert wird,
   dass das Raster WAAGERECHT hineinpasst — dort gibt es keinen Rueckfall, der
   den Nutzer je erreicht. */
test.describe('M1 — enges Telefon: die Leiste bleibt im Fenster', () => {
    for (const theme of THEMES) {
        for (const [breite, hoehe] of ENGE_FENSTER) {
            test(`${breite}x${hoehe}, Theme ${theme}: alle 24 Reiter erreichbar`, async ({
                page
            }) => {
                await page.setViewportSize({ width: breite, height: hoehe });
                await mobilLaden(page, theme);

                for (const zustand of ['schlicht', 'voll']) {
                    await leisteSchliessen(page);
                    if (zustand === 'voll') await vollerZustand(page);
                    await leisteOeffnen(page);

                    const m = await page.evaluate(messeLeiste);
                    console.log(
                        `[M1] ${breite}x${hoehe} ${theme} ${zustand}: waagerecht Sichtfeld ` +
                            `${m.navSichtBreite}px / Inhalt ${m.navInhaltBreite}px, senkrecht ` +
                            `${m.navSichtHoehe}px / ${m.navInhaltHoehe}px, erreichbar ` +
                            `${m.reiter.filter(r => r.erreichbar).length}/${m.reiter.length}`
                    );

                    expect(
                        m.reiter.length,
                        `${zustand}: die Leiste muss alle Ansichten fuehren`
                    ).toBe(ANZAHL_ANSICHTEN);

                    pruefeWaagerechteAchse(m, breite, zustand);

                    // Die Tippflaeche bleibt fingergross — auch hier. Enger heisst
                    // nicht kleiner als ein Daumen.
                    const zuKlein = m.reiter
                        .filter(r => r.hoehe < MIN_TIPPFLAECHE || r.breite < MIN_TIPPFLAECHE)
                        .map(r => `${r.view} ${r.breite}x${r.hoehe}px`);
                    expect(zuKlein, `${zustand}: Tippflaechen unter ${MIN_TIPPFLAECHE}px`).toEqual(
                        []
                    );

                    expect(
                        m.ueberlapper.map(u => `${u.was} deckt ${u.deckung}px² (z=${u.z})`),
                        `${zustand}: Schwebeelemente ueber der ausgefahrenen Leiste`
                    ).toEqual([]);

                    const lauf = await radDurchlauf(page);
                    console.log(
                        `[M1] ${breite}x${hoehe} ${theme} ${zustand}: Rad-Durchlauf ` +
                            `${lauf.runden} Runden, erreicht ${lauf.erreicht.size}/${ANZAHL_ANSICHTEN}`
                    );
                    expect(
                        lauf.offen,
                        `${zustand}: nicht erreichbare Reiter (${lauf.erreicht.size}/${ANZAHL_ANSICHTEN})`
                    ).toEqual([]);
                }
            });
        }
    }
});

/* ====================================================================
   GEGENPROBE ZU URSACHE A — der Deckel von vor M1, wirklich hergestellt.
   ====================================================================
   WARUM SIE FEHLTE. Die acht Zusicherungen oben sind seit ihrer Geburt gruen.
   Dass sie den Deckel UEBERHAUPT messen koennen, stand nirgends belegt: eine
   Probe, die den Zustand vor der Korrektur nie herstellt, kann eine Ruecknahme
   der Korrektur nur dann melden, wenn jemand sie zufaellig genau so
   zurueckdreht, wie sie es erwartet. Die Hoehenbudget-Probe fuehrt fuer ihren
   eigenen Befund genau so eine Gegenprobe (`--view-frame-height` auf die alte
   verdrahtete Zahl gezwungen); hier fehlte das Gegenstueck.

   WIE DER ALTE ZUSTAND HERGESTELLT WIRD. Nicht durch Ueberschreiben von
   `max-height` an `.nav-tabs`, sondern durch Zwang auf das Token, das die Regel
   dort liest (`max-height: var(--mobile-nav-max-height, 300px)`): ein
   Stilblatt mit `!important` auf `:root` schlaegt den nicht-wichtigen
   Inline-Wert, den setzeMobilLeistenDeckel() bei jedem Lauf der Kette neu
   schreibt. Ein Inline-Zwang waere beim naechsten `resize` weg. Das
   `!important` faellt NICHT in die Ratsche: die zaehlt die Quelldateien unter
   assets/styles/, nicht die Stilblaetter eines Testlaufs.

   GEMESSEN am Buendel zu 89f4b72, kleinstes Fenster aus FENSTER (360x740),
   schlichter Zustand, Leiste ausgefahren:

     Zustand                       Sichtfeld  Rasterinhalt  erreichbar
     ---------------------------   ---------  ------------  ----------
     gemessenes Token (M1)            444px         444px       24/24
     erzwungene 300px (vor M1)        300px         444px       20/24

   Die vier, die dabei herausfallen, sind die unterste Reihe — genau die vier,
   die der Kopfkommentar als dauerhaft hinter dem `overflow` liegend nennt.

   WAS SIE NICHT IST: eine zweite Fassung der Zusicherung 3. Die prueft, dass
   das Raster hineinpasst. Diese hier prueft, dass die Messung es MERKT, wenn es
   nicht hineinpasst. Ohne den ersten Teil (die Vorbedingung) wuerde sie einen
   vorbestehenden Fehler als Erfolg verbuchen — deshalb steht er davor.
   ==================================================================== */
test.describe('M1 — Gegenprobe: der Deckel von vor M1 meldet den Befund', () => {
    test('360x740: erzwungene 300px schneiden die unterste Reihe ab', async ({ page }) => {
        test.setTimeout(90000);
        // Kleinstes Fenster der eigenen Achse — wird FENSTER enger gezogen,
        // wandert die Gegenprobe mit, statt eine verdrahtete Zahl zu fuehren.
        const [breite, hoehe] = FENSTER.reduce((a, b) => (b[1] < a[1] ? b : a));
        await page.setViewportSize({ width: breite, height: hoehe });
        await mobilLaden(page, THEMES[0]);
        await leisteOeffnen(page);

        // VORBEDINGUNG — ohne sie misst die Gegenprobe nur einen vorbestehenden
        // Fehler. Das gemessene Token MUSS das Raster ohne Scrollen fassen und
        // alle 24 Reiter erreichbar halten.
        const gemessen = await page.evaluate(messeLeiste);
        const gemessenErreichbar = gemessen.reiter.filter(r => r.erreichbar).length;
        expect(
            gemessen.navInhaltHoehe - gemessen.navSichtHoehe,
            `Vorbedingung: mit dem gemessenen Token muss das Raster hineinpassen ` +
                `(Inhalt ${gemessen.navInhaltHoehe}px, Sichtfeld ${gemessen.navSichtHoehe}px)`
        ).toBeLessThanOrEqual(0);
        expect(
            gemessenErreichbar,
            `Vorbedingung: mit dem gemessenen Token muessen alle ${ANZAHL_ANSICHTEN} ` +
                `erreichbar sein (${gemessenErreichbar})`
        ).toBe(ANZAHL_ANSICHTEN);

        // Und jetzt der Zustand von vor M1. Gezwungen wird das TOKEN, nicht
        // `max-height` an der Leiste: setzeMobilLeistenDeckel() schreibt den
        // Inline-Wert bei jedem Lauf der Kette neu, ein Inline-Zwang waere beim
        // naechsten `resize` weg. Ein Stilblatt mit `!important` auf `:root`
        // schlaegt den nicht-wichtigen Inline-Wert dauerhaft.
        await page.addStyleTag({
            content: ':root { --mobile-nav-max-height: 300px !important; }'
        });
        await page.waitForTimeout(300);
        const verdrahtet = await page.evaluate(messeLeiste);
        const verdrahtetErreichbar = verdrahtet.reiter.filter(r => r.erreichbar).length;
        console.log(
            `[M1-Gegenprobe] ${breite}x${hoehe}: gemessen Sichtfeld ` +
                `${gemessen.navSichtHoehe}px / Inhalt ${gemessen.navInhaltHoehe}px, ` +
                `erreichbar ${gemessenErreichbar}/${ANZAHL_ANSICHTEN} | verdrahtet Sichtfeld ` +
                `${verdrahtet.navSichtHoehe}px / Inhalt ${verdrahtet.navInhaltHoehe}px, ` +
                `erreichbar ${verdrahtetErreichbar}/${ANZAHL_ANSICHTEN}`
        );

        // Erst der Beweis, dass der Zwang ueberhaupt gegriffen hat.
        expect(
            verdrahtet.navSichtHoehe,
            `der Deckel muss auf 300px zu zwingen sein (Sichtfeld ${verdrahtet.navSichtHoehe}px)`
        ).toBe(300);
        // Und dann: die Messung sieht den Befund.
        expect(
            verdrahtet.navInhaltHoehe - verdrahtet.navSichtHoehe,
            `mit 300px muss ein Ueberhang entstehen (Inhalt ${verdrahtet.navInhaltHoehe}px)`
        ).toBeGreaterThan(0);
        expect(
            verdrahtetErreichbar,
            `mit 300px duerfen NICHT mehr alle ${ANZAHL_ANSICHTEN} erreichbar sein ` +
                `(${verdrahtetErreichbar})`
        ).toBeLessThan(ANZAHL_ANSICHTEN);
    });
});

/* ====================================================================
   ZUSICHERUNG 9/10 — DER UMSCHALTER-STREIFEN GEHOERT DEM UMSCHALTER.
   ====================================================================
   WAS DIE ACHT ZUSICHERUNGEN DARUEBER NICHT PRUEFEN. Sie messen die
   AUSGEFAHRENE Leiste. Der Zustand, in dem der Spielleiter die App die meiste
   Zeit sieht, ist der EINGEKLAPPTE: die Leiste steht auf
   `transform: translateY(calc(100% - 56px))`, sichtbar bleibt genau die
   Umschalter-Zeile am unteren Fensterrand. Wer dort etwas hinlegt, verschiebt
   nicht die Navigation, sondern ERSETZT sie — ein Daumen, der den Streifen
   trifft, loest eine andere Handlung aus.

   `leisteOeffnen()` prueft diesen Streifen schon, aber nur auf SEINER MITTE.
   Genau dort war er frei: `elementFromPoint` antwortete auf der Mitte mit
   `div.mobile-nav-toggle`, und deshalb galt der Weg in die Leiste als in
   Ordnung. Die Schnellreferenz-Kugel sitzt aber RECHTS UNTEN. Eine Probe, die
   nur die Mitte kennt, ist gegen sie ab Geburt gruen — darum tastet diese hier
   ein RASTER ueber die ganze Streifenbreite ab (Schritt 16px, also enger als
   jedes Element, das groesser als 16px ist, plus die beiden Randpunkte), in drei
   Zeilen auf 20/50/80 % der Streifenhoehe.

   GEMESSEN am Buendel zu 93a765e, Mobil-Layout, Leiste EINGEKLAPPT, je Fenster
   in allen vier Themes und in beiden Zustaenden (schlicht und voll, also
   Ereignis-Log im Dauermodus mit fuenf Meldungen, Kampfprotokoll,
   Schnellreferenz und Wuerfel-Panel offen) — die Zahlen waren in allen vier
   Themes und beiden Zustaenden identisch, weil es um Geometrie geht und nicht
   um Farbe:

     Fenster    Streifen  Decker       Deckung   fremde Tastpunkte
     --------   --------  -----------  --------  -----------------
     390x844      55px    .qref-fab    2250px²   7 von 78
     360x740      55px    .qref-fab    2250px²   7 von 72
     320x568      55px    .qref-fab    2250px²   7 von 66
     320x740      55px    .qref-fab    2250px²   7 von 66
     320x700      55px    .qref-fab    2250px²   7 von 66
     740x360      55px    .qref-fab    1750px²   6 von 144

   Die 320x700 steht hier nur als Nachweis, dass die Zwischenhoehe nichts
   Eigenes beitraegt; die Fenstermenge der Probe kommt aus den Konstanten dieser
   Datei, damit sie mitwandert, wenn jemand sie enger zieht.

   NUR EIN TAETER, und das ist selbst ein Befund. Der breite Filter unten nimmt
   JEDES sichtbare `position: fixed`-Element ausserhalb der Leiste, nicht eine
   Namensliste. Er fand in allen sechs Fenstern genau `.qref-fab`. Die fuenf
   uebrigen bodenverankerten Schweber halten den Streifen bereits frei, jeder auf
   eigene Weise, gemessener Abstand zum unteren Fensterrand:

     .floating-dice-trigger   70px   dice.css, @media (max-width: 900px)
     #event-log               80px   party.css, @media (max-width: 900px)
     .qref-panel              70px   dashboard.css, @media (max-width: 600px)
     .floating-dice-panel    130px   dice.css, @media (max-width: 900px)
     .kplog-panel             76px   oben verankert, Hoehe minus --mobile-nav-rest
                                     (variables.css, aus der Vorrunde)

   Die Kugel ist die einzige, die unter 56px blieb (10px bei <=600px Breite,
   20px darueber) — sie hat die Mobil-Behandlung, die ihr Gegenstueck unten links
   laengst hat, nie bekommen.

   ZWEI UNABHAENGIGE ZUSICHERUNGEN, weil zwei verschiedene Dinge schiefgehen:
     A  FLAECHE — kein sichtbares Schwebeelement schneidet den Streifen.
        Greift auch bei `pointer-events: none`: so ein Element laesst den Tipp
        durch, verdeckt die Umschalter-Zeile aber genauso.
     B  TASTPUNKTE — jeder Punkt des Rasters antwortet mit der Leiste. Das ist
        die Frage, die der Daumen stellt.
   ==================================================================== */

/* Die Fenstermenge: alle Telefonfenster dieser Datei. Abgeleitet und nicht neu
   getippt — wer FENSTER/ENGE_FENSTER aendert, aendert diese Probe mit. */
const STREIFEN_FENSTER = [...FENSTER, KURZES_FENSTER, ...ENGE_FENSTER];

/** Rasterschritt des Abtastens, waagerecht. Enger als jedes Element > 16px. */
const STREIFEN_SCHRITT = 16;

/**
 * Oeffnet ZUSAETZLICH zum vollen Zustand die beiden Panels, die an einem
 * bodenverankerten Schweber haengen. `vollerZustand()` laesst sie zu — fuer die
 * ausgefahrene Leiste ist das richtig, weil die Regel dort alles verbirgt. Am
 * EINGEKLAPPTEN Streifen sind sie der schwerere Fall und muessen offen stehen.
 * @param {import('@playwright/test').Page} page
 */
async function alleSchweberOffen(page) {
    await vollerZustand(page);
    await page.evaluate(() => {
        // @ts-ignore — global aus der Schnellreferenz
        if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
        // @ts-ignore — global aus dem Wuerfel-Kern
        if (typeof window.toggleFloatingDice === 'function') window.toggleFloatingDice();
    });
    await page.waitForTimeout(400);
    const offen = await page.evaluate(() => ({
        qref: !!document.querySelector('.qref-panel.active'),
        wuerfel: !!document.querySelector('.floating-dice-panel.show')
    }));
    expect(offen.qref, 'die Schnellreferenz liess sich nicht oeffnen').toBe(true);
    expect(offen.wuerfel, 'das Wuerfel-Panel liess sich nicht oeffnen').toBe(true);
}

/**
 * Laeuft im Browser. Misst den Streifen der EINGEKLAPPTEN Leiste, jedes
 * sichtbare Schwebeelement, das ihn schneidet, und ein Raster von Tastpunkten
 * ueber seine ganze Breite.
 *
 * Reine Funktion ihrer Umgebung, kein Zugriff auf Modul-Scope — sie wird
 * serialisiert. Der Rasterschritt kommt deshalb als Argument.
 * @param {number} schritt
 */
function messeStreifen(schritt) {
    const bez = e => {
        if (!e) return 'nichts';
        const id = e.id ? '#' + e.id : '';
        const kl =
            typeof e.className === 'string' && e.className.trim()
                ? '.' + e.className.trim().split(/\s+/).join('.')
                : '';
        return e.tagName.toLowerCase() + id + kl;
    };
    const kopf = document.querySelector('.app-header');
    const umschalter = document.querySelector('.mobile-nav-toggle');
    if (!kopf || !umschalter) return { fehlt: true };
    const kr = kopf.getBoundingClientRect();
    const ur = umschalter.getBoundingClientRect();

    /* Der Streifen ist der SICHTBARE Rest der eingeklappten Leiste: waagerecht
       ihre volle Breite, senkrecht von der Oberkante der Umschalter-Zeile bis
       zum unteren Fensterrand. Gemessen und nicht aus den 56px der
       `translateY`-Formel gerechnet — die Zeile traegt keine gesetzte Hoehe. */
    const streifen = {
        links: Math.round(kr.left),
        rechts: Math.round(kr.right),
        oben: Math.round(ur.top),
        unten: Math.round(Math.min(kr.bottom, window.innerHeight))
    };
    streifen.hoehe = streifen.unten - streifen.oben;

    /* A — FLAECHE. Breiter Filter: jedes sichtbare `position: fixed`-Element
       ausserhalb der Leiste, keine Namensliste. Ein neuer Schweber faellt damit
       von selbst auf, statt stillschweigend durchzulaufen. */
    const ueberlapper = Array.from(document.body.querySelectorAll('*'))
        .filter(e => {
            if (e === kopf || kopf.contains(e)) return false;
            const cs = getComputedStyle(e);
            if (cs.position !== 'fixed') return false;
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            if (parseFloat(cs.opacity) === 0) return false;
            const r = e.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) return false;
            return (
                r.bottom > streifen.oben &&
                r.top < streifen.unten &&
                r.right > streifen.links &&
                r.left < streifen.rechts
            );
        })
        .map(e => {
            const r = e.getBoundingClientRect();
            const cs = getComputedStyle(e);
            return {
                was: bez(e),
                z: cs.zIndex,
                zeiger: cs.pointerEvents,
                abstandUnten: Math.round(window.innerHeight - r.bottom),
                deckung: Math.round(
                    Math.max(
                        0,
                        Math.min(r.bottom, streifen.unten) - Math.max(r.top, streifen.oben)
                    ) *
                        Math.max(
                            0,
                            Math.min(r.right, streifen.rechts) - Math.max(r.left, streifen.links)
                        )
                )
            };
        })
        // Nur echte Ueberlappungen melden, keine Beruehrung auf Kante.
        .filter(u => u.deckung > 0);

    /* B — TASTPUNKTE. Raster ueber die GANZE Breite plus die beiden Randpunkte;
       drei Zeilen, damit auch ein flaches Element in der oberen oder unteren
       Haelfte des Streifens auffaellt. */
    const xs = new Set([streifen.links + 4, streifen.rechts - 4]);
    for (let x = streifen.links + schritt / 2; x < streifen.rechts; x += schritt) {
        xs.add(Math.round(x));
    }
    const punkte = [];
    for (const x of [...xs].sort((a, b) => a - b)) {
        for (const anteil of [0.2, 0.5, 0.8]) {
            const y = Math.round(streifen.oben + anteil * streifen.hoehe);
            const el = document.elementFromPoint(x, y);
            punkte.push({
                x,
                y,
                leiste: !!el && (el === kopf || kopf.contains(el)),
                umschalter: !!el && (el === umschalter || umschalter.contains(el)),
                obenauf: bez(el)
            });
        }
    }

    return {
        fehlt: false,
        navOffen: !!document.querySelector('.app-header.nav-open'),
        token: getComputedStyle(document.documentElement)
            .getPropertyValue('--mobile-nav-rest')
            .trim(),
        streifen,
        ueberlapper,
        anzahlPunkte: punkte.length,
        aufUmschalter: punkte.filter(p => p.umschalter).length,
        fremd: punkte.filter(p => !p.leiste)
    };
}

test.describe('M1 — der Streifen der eingeklappten Leiste gehoert dem Umschalter', () => {
    for (const theme of THEMES) {
        for (const [breite, hoehe] of STREIFEN_FENSTER) {
            test(`${breite}x${hoehe}, Theme ${theme}: kein Schweber auf dem Streifen`, async ({
                page
            }) => {
                await page.setViewportSize({ width: breite, height: hoehe });
                await mobilLaden(page, theme);

                for (const zustand of ['schlicht', 'voll']) {
                    if (zustand === 'voll') await alleSchweberOffen(page);

                    const m = await page.evaluate(messeStreifen, STREIFEN_SCHRITT);
                    expect(m.fehlt, `${zustand}: Leiste oder Umschalter fehlt`).toBe(false);

                    console.log(
                        `[M1-Streifen] ${breite}x${hoehe} ${theme} ${zustand}: Streifen ` +
                            `h=${m.streifen.hoehe}px [${m.streifen.links}..${m.streifen.rechts}] ` +
                            `y ${m.streifen.oben}..${m.streifen.unten}, Token ` +
                            `${m.token || '(leer)'}, Ueberlapper ${m.ueberlapper.length}, ` +
                            `auf dem Umschalter ${m.aufUmschalter}/${m.anzahlPunkte}, ` +
                            `fremd ${m.fremd.length}`
                    );

                    /* VORBEDINGUNG. Ohne sie koennte die Probe einen Streifen
                       der Hoehe 0 messen und zufrieden sein. Die Leiste MUSS
                       eingeklappt stehen — das ist der Zustand, um den es
                       geht — und der Streifen muss die Daumengroesse haben,
                       auf die ihn `translateY(calc(100% - 56px))` festlegt. */
                    expect(
                        m.navOffen,
                        `${zustand}: die Leiste muss fuer diese Probe eingeklappt stehen`
                    ).toBe(false);
                    expect(
                        m.streifen.hoehe,
                        `${zustand}: der Streifen muss die Daumengroesse haben ` +
                            `(${m.streifen.hoehe}px)`
                    ).toBeGreaterThanOrEqual(MIN_TIPPFLAECHE);

                    // A — FLAECHE.
                    expect(
                        m.ueberlapper.map(
                            u =>
                                `${u.was} deckt ${u.deckung}px² (z=${u.z}, ` +
                                `${u.abstandUnten}px ueber dem Fensterrand)`
                        ),
                        `${zustand}: Schwebeelemente auf dem Streifen der eingeklappten Leiste`
                    ).toEqual([]);

                    // B — TASTPUNKTE, ueber die ganze Breite.
                    expect(
                        m.fremd.map(f => `(${f.x},${f.y}) -> ${f.obenauf}`),
                        `${zustand}: Tastpunkte auf dem Streifen, die NICHT mit der Leiste ` +
                            `antworten (${m.fremd.length} von ${m.anzahlPunkte})`
                    ).toEqual([]);
                }
            });
        }
    }
});

/* ====================================================================
   GEGENPROBE ZUM STREIFEN — der alte Sitz der Kugel meldet den Befund.
   ====================================================================
   Dieselbe Begruendung wie bei der Gegenprobe zum Deckel darueber: eine Probe,
   die den Zustand VOR der Korrektur nie herstellt, belegt nicht, dass sie ihn
   sehen koennte. Hier ist der alte Zustand eine einzige Zahl — die Kugel sass
   im Mobil-Layout 10px ueber dem unteren Fensterrand statt ueber dem Streifen.

   Erzwungen wird er mit `!important` auf `.qref-fab`, weil die Korrektur selbst
   eine Regel mit Attributselektor ist (`[data-layout="mobile"] .qref-fab`,
   Spezifitaet 0-2-0) und von einem gewoehnlichen Stilblatt nicht geschlagen
   wird. Das `!important` faellt NICHT in die Ratsche: die zaehlt die
   Quelldateien unter assets/styles/, nicht die Stilblaetter eines Testlaufs.

   GEMESSEN am Buendel zu 93a765e, 360x740, Theme dark, schlichter Zustand:

     Zustand                        Decker      Deckung   fremde Tastpunkte
     ----------------------------   ---------   -------   -----------------
     ueber dem Streifen (Q2)        -                 0   0 von 72
     10px ueber dem Rand (vorher)   .qref-fab   2250px²   7 von 72
   ==================================================================== */
test.describe('M1 — Gegenprobe: der alte Sitz der Kugel meldet den Befund', () => {
    test('360x740: 10px ueber dem Fensterrand decken den Streifen wieder', async ({ page }) => {
        // Kleinstes Fenster der eigenen Achse — wandert mit, statt eine
        // verdrahtete Zahl zu fuehren.
        const [breite, hoehe] = FENSTER.reduce((a, b) => (b[1] < a[1] ? b : a));
        await page.setViewportSize({ width: breite, height: hoehe });
        await mobilLaden(page, THEMES[0]);

        // VORBEDINGUNG — der Streifen ist frei. Ohne sie wuerde die Gegenprobe
        // einen vorbestehenden Fehler als Erfolg verbuchen.
        const frei = await page.evaluate(messeStreifen, STREIFEN_SCHRITT);
        expect(
            frei.ueberlapper.map(u => `${u.was} ${u.deckung}px²`),
            'Vorbedingung: der Streifen muss frei sein'
        ).toEqual([]);
        expect(
            frei.fremd.length,
            `Vorbedingung: alle Tastpunkte muessen mit der Leiste antworten ` +
                `(${frei.fremd.length} fremde)`
        ).toBe(0);

        // Und jetzt der Sitz von vorher.
        await page.addStyleTag({ content: '.qref-fab { bottom: 10px !important; }' });
        await page.waitForTimeout(300);
        const alt = await page.evaluate(messeStreifen, STREIFEN_SCHRITT);
        console.log(
            `[M1-Streifen-Gegenprobe] ${breite}x${hoehe}: frei Ueberlapper ` +
                `${frei.ueberlapper.length}/fremd ${frei.fremd.length} | alt Ueberlapper ` +
                `${alt.ueberlapper.map(u => u.was + ' ' + u.deckung + 'px²').join(',')}/fremd ` +
                `${alt.fremd.length} von ${alt.anzahlPunkte}`
        );

        // Erst der Beweis, dass der Zwang gegriffen hat.
        const kugel = alt.ueberlapper.find(u => u.was.includes('qref-fab'));
        expect(
            kugel ? kugel.abstandUnten : null,
            'der alte Sitz muss zu erzwingen sein (10px ueber dem Fensterrand)'
        ).toBe(10);
        // Und dann: BEIDE Zusicherungen sehen den Befund.
        expect(
            kugel.deckung,
            `die Flaechen-Zusicherung muss den Decker melden (${kugel.deckung}px²)`
        ).toBeGreaterThan(0);
        expect(
            alt.fremd.length,
            `die Tastpunkt-Zusicherung muss fremde Punkte melden (${alt.fremd.length})`
        ).toBeGreaterThan(0);
    });
});

/* ====================================================================
   ZUSICHERUNG 11 — DER BODENVERANKERTE STAPEL. DAS EREIGNIS-LOG LIEGT
   NICHT AUF DEN RUNDEN KNOEPFEN.
   ====================================================================
   WAS DIE ZUSICHERUNG 9/10 DARUEBER NICHT SIEHT. Sie prueft einen STREIFEN —
   die 56px der eingeklappten Leiste am unteren Fensterrand. Alles, was ueber
   diesem Streifen liegt, ist fuer sie in Ordnung. Genau dorthin hat die
   Korrektur zum Streifen die Schnellreferenz-Kugel gehoben, und dort stand
   schon etwas: das Ereignis-Log, `bottom: 80px` bei <=900px Breite, mit
   `--z-toast` (4000) ueber allem und `pointer-events: auto` an jedem Eintrag.

   DIE KUGEL IST DEM STREIFEN AUSGEWICHEN UND IM BAND DES LOGS GELANDET.
   Eigene Messung, gefuellte Kampagne, Mobil-Layout, Leiste eingeklappt;
   senkrechtes Abtasten der Kugelmitte Punkt fuer Punkt, dazu ein ECHTER
   `mouse.click` auf dieselbe Stelle:

     Fenster    Kugel vorher          Kugel nach der Streifen-Korrektur
     --------   -------------------   ---------------------------------
     320x700    frei 50/50, Klick ja  frei 14/50, Klick NEIN
     360x740    frei 50/50, Klick ja  frei 14/50, Klick NEIN
     390x844    frei 50/50, Klick ja  frei 50/50 — aber nur, weil die
                                      Kugelmitte x=355 genau auf der rechten
                                      Logkante liegt (35+320). Null Reserve.
     740x360    frei 50/50, Klick ja  frei 50/50 (Log 320px breit, mittig —
                                      es reicht hier nicht an die Kugel)

   14px sind weniger als ein Drittel der MIN_TIPPFLAECHE, die Zusicherung 4
   derselben Datei fuer die Reiter verlangt. Und 14px sind noch die freundliche
   Lesart: die MITTE der Kugel antwortete mit `div.event-log-entry`, der echte
   Klick oeffnete die Schnellreferenz nicht.

   DIE GANZE FAMILIE, NICHT NUR DIE KUGEL. Dieselbe Messung am Wuerfel-Knopf
   unten links: frei 10/48, Klick tot — VOR und NACH der Streifen-Korrektur
   gleich. Das Log lag dort schon immer drauf (`bottom: 80px` gegen einen Knopf,
   der von 70 bis 118 reicht). Die Zusicherung 9/10 konnte es nicht sehen, weil
   beides ueber dem Streifen liegt. Deshalb nimmt diese Zusicherung nicht die
   Kugel, sondern JEDEN bodenverankerten runden Knopf — der naechste, den jemand
   dort ablegt, faellt von selbst auf.

   DER FILTER, und warum seine Zahlen aus MIN_TIPPFLAECHE kommen: ein sichtbares
   `position: fixed`-Element mit `data-action`, dessen Kasten in BEIDEN Achsen
   hoechstens zwei Daumenbreiten misst (ein Knopf, kein Panel — `.qref-panel`
   und `.floating-dice-panel` sind breiter als 88px und fallen damit heraus) und
   dessen Unterkante hoechstens vier Daumenbreiten ueber dem Fensterrand liegt
   (bodenverankert). Nachkontrolliert: er findet in allen sechs Fenstern genau
   zwei, `.floating-dice-trigger` und `.qref-fab`. Elemente INNERHALB der Leiste
   bleiben aussen vor — der Streifen ist Gegenstand der Zusicherung 9/10, und
   zwei Proben sollen nicht dieselbe Stelle messen.

   ZWEI LOGZUSTAENDE, beide mit echtem Klick pruefbar:
     fluechtig    EINE Meldung, kein Dauermodus. Das ist der Zustand nach
                  praktisch jeder Handlung. `showToast` nimmt die Standzeit als
                  dritten Parameter — gesetzt auf zehn Minuten, damit die
                  Meldung nicht mitten in der Messung verblasst und die Probe
                  dadurch inhaltsleer gruen wird.
     dauermodus   Sechs Meldungen, `toggleEventLog()`. Hier traegt der BEHAELTER
                  selbst `pointer-events: auto` (party.css, `.event-log
                  .persistent`), nicht nur die Eintraege.
   Gemessen war die freie Hoehe in beiden Zustaenden dieselbe (14/50): der
   Ueberschnitt entsteht an der UNTERKANTE des Logs, und die ist in beiden
   Zustaenden dieselbe Zahl. Der Dauermodus ist trotzdem beide Male dabei, weil
   nur dort der Behaelter mitfaengt.

   UND DIE MOBIL-KOPFZEILE. Die naheliegende Korrektur — das Log einfach um die
   Streifenhoehe hochschieben — hat genau hier einen Preis, der gemessen werden
   muss: bei 320x568 reichte das Log danach bis 32px unter den Fensterrand und
   deckte SECHS der sieben Knoepfe der Mobil-Kopfzeile. Das ist kein
   Nebenschaden, sondern ein benannter Beschluss der Vorrunden
   (`ui/editors/rich-text-insert.js`, setzeMobilKopfHoehe: die Mobil-Kopfzeile
   traegt Suche, Rueckgaengig, Schnellnotizen, Theme, Layout UND den einzigen
   Mobil-Weg zum Kampfprotokoll; ein Band darueber zu legen macht sie alle
   unerreichbar). Die Probe prueft das deshalb mit — sonst tauscht die naechste
   Korrektur zwei Knoepfe unten gegen sieben oben.

   GEFUELLTE KAMPAGNE. Die acht Zusicherungen darueber laden den Leerzustand;
   fuer die Geometrie fester Elemente reicht das. Hier nicht: bei gefuellter
   Kampagne steht das Log schon ohne jede Nutzerhandlung voll (gemessen 223px
   Hoehe direkt nach dem Start, Meldungen aus dem Ladeweg). Der Fall tritt also
   ohne Zutun ein, und die Probe stellt ihn deshalb auch so her.
   ==================================================================== */

/** Gefuellte Kampagne — aus SAAT abgeleitet, damit es eine Saat-Quelle bleibt. */
const SAAT_GEFUELLT = {
    ...SAAT,
    characters: Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        name: 'Spielerfigur mit langem Namen ' + (i + 1),
        class: 'Magier',
        level: 5,
        hp: 30,
        maxHp: 30,
        ac: 14
    })),
    npcs: Array.from({ length: 14 }, (_, i) => ({
        id: i + 1,
        name: 'Nichtspielerfigur ' + (i + 1),
        description: 'Beschreibung'
    })),
    locations: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: 'Ort ' + (i + 1) })),
    quests: Array.from({ length: 11 }, (_, i) => ({
        id: i + 1,
        title: 'Ein Auftrag mit einem ziemlich langen Titel ' + (i + 1),
        status: 'active'
    })),
    encounters: Array.from({ length: 7 }, (_, i) => ({ id: i + 1, name: 'Begegnung ' + (i + 1) })),
    loot: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, name: 'Beute ' + (i + 1) })),
    wiki: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, title: 'Eintrag ' + (i + 1) })),
    sessionNotes: Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        title: 'Sitzung ' + (i + 1),
        date: '2026-01-01',
        content: 'Text'
    }))
};

/** Standzeit der fluechtigen Meldung: lang genug, dass sie die Messung ueberlebt. */
const LANGE_STANDZEIT = 600000;

/**
 * Stellt einen der beiden Logzustaende her und belegt, dass er steht.
 * @param {import('@playwright/test').Page} page
 * @param {'fluechtig'|'dauermodus'} zustand
 */
async function logZustand(page, zustand) {
    await page.evaluate(
        ([z, standzeit]) => {
            if (z === 'dauermodus') {
                // @ts-ignore — global aus den Hilfsfunktionen
                if (typeof window.toggleEventLog === 'function') window.toggleEventLog();
                for (let i = 1; i <= 6; i++) {
                    // @ts-ignore — global aus den Hilfsfunktionen
                    if (typeof window.showToast === 'function')
                        window.showToast('Probemeldung ' + i, 'info', standzeit);
                }
            } else {
                // @ts-ignore — global aus den Hilfsfunktionen
                if (typeof window.showToast === 'function')
                    window.showToast('Charakter gespeichert', 'success', standzeit);
            }
        },
        [zustand, LANGE_STANDZEIT]
    );
    await page.waitForTimeout(400);
    const stand = await page.evaluate(() => ({
        eintraege: document.querySelectorAll('#event-log .event-log-entry').length,
        dauermodus: !!document.querySelector('#event-log.persistent')
    }));
    expect(stand.eintraege, `${zustand}: das Ereignis-Log muss Meldungen tragen`).toBeGreaterThan(
        0
    );
    expect(stand.dauermodus, `${zustand}: Dauermodus`).toBe(zustand === 'dauermodus');
}

/**
 * Laeuft im Browser. Findet die bodenverankerten runden Knoepfe, tastet jeden
 * auf seiner Mittelsenkrechten ab und misst, was das Ereignis-Log von der
 * Mobil-Kopfzeile deckt.
 *
 * Reine Funktion ihrer Umgebung, kein Zugriff auf Modul-Scope — sie wird
 * serialisiert. MIN_TIPPFLAECHE kommt deshalb als Argument.
 * @param {number} min
 */
function messeStapel(min) {
    const bez = e => {
        if (!e) return 'nichts';
        const id = e.id ? '#' + e.id : '';
        const kl =
            typeof e.className === 'string' && e.className.trim()
                ? '.' + e.className.trim().split(/\s+/).join('.')
                : '';
        return e.tagName.toLowerCase() + id + kl;
    };
    const sichtbar = e => {
        if (!e) return false;
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        if (parseFloat(cs.opacity) === 0) return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const kopf = document.querySelector('.app-header');
    const mobilKopf = document.querySelector('.mobile-header');
    const log = document.querySelector('#event-log');

    const knoepfe = Array.from(document.querySelectorAll('[data-action]'))
        .filter(e => {
            if (!sichtbar(e)) return false;
            if (kopf && (e === kopf || kopf.contains(e))) return false;
            if (getComputedStyle(e).position !== 'fixed') return false;
            const r = e.getBoundingClientRect();
            if (r.width > 2 * min || r.height > 2 * min) return false;
            return window.innerHeight - r.bottom <= 4 * min;
        })
        .map(e => {
            const r = e.getBoundingClientRect();
            const cx = Math.round(r.left + r.width / 2);
            /* Senkrechtes Abtasten in 1px-Schritten: gesucht ist die laengste
               ZUSAMMENHAENGENDE Strecke, auf der der Knopf selbst antwortet.
               Nicht die Summe — ein Daumen braucht eine zusammenhaengende
               Flaeche, nicht zwei Streifen mit einem Loch dazwischen. */
            let best = 0;
            let lauf = 0;
            for (let y = Math.ceil(r.top); y <= Math.floor(r.bottom); y++) {
                const t = document.elementFromPoint(cx, y);
                if (t && (t === e || e.contains(t))) {
                    lauf++;
                    if (lauf > best) best = lauf;
                } else {
                    lauf = 0;
                }
            }
            const my = Math.round(r.top + r.height / 2);
            const obenauf = document.elementFromPoint(cx, my);
            return {
                was: bez(e),
                wahl: e.id ? '#' + e.id : '.' + Array.from(e.classList).join('.'),
                hoehe: Math.round(r.height),
                frei: best,
                mitte: [cx, my],
                mitteObenauf: bez(obenauf),
                mitteFrei: !!obenauf && (obenauf === e || e.contains(obenauf))
            };
        });

    /* Die Mobil-Kopfzeile: jeder sichtbare Knopf darin muss sich selbst melden.
       Sie ist der Gegenpreis jeder Korrektur, die das Log hochschiebt. */
    const kopfKnoepfe = mobilKopf
        ? Array.from(mobilKopf.querySelectorAll('button,[data-action]'))
              .filter(sichtbar)
              .map(e => {
                  const r = e.getBoundingClientRect();
                  const cx = Math.round(r.left + r.width / 2);
                  const cy = Math.round(r.top + r.height / 2);
                  const t = document.elementFromPoint(cx, cy);
                  return { was: bez(e), frei: !!t && (t === e || e.contains(t)), obenauf: bez(t) };
              })
        : [];

    const lr = log && sichtbar(log) ? log.getBoundingClientRect() : null;
    return {
        navOffen: !!document.querySelector('.app-header.nav-open'),
        knoepfe,
        kopfAnzahl: kopfKnoepfe.length,
        kopfBlockiert: kopfKnoepfe.filter(k => !k.frei).map(k => `${k.was} -> ${k.obenauf}`),
        log: lr
            ? {
                  kasten: [
                      Math.round(lr.left),
                      Math.round(lr.top),
                      Math.round(lr.width),
                      Math.round(lr.height)
                  ],
                  abstandUnten: Math.round(window.innerHeight - lr.bottom),
                  /* Was oben aus dem Fenster haengt, ist nicht erreichbar —
                     weder durch Scrollen im Log noch sonst. */
                  abgeschnitten: Math.round(Math.max(0, -lr.top))
              }
            : null
    };
}

/**
 * Klickt WIRKLICH auf einen Punkt und meldet, welches Element das Ereignis
 * bekommen hat. Kein Element-Klick: der wuerde die Zustellung erzwingen und
 * damit genau die Frage ueberspringen.
 * @param {import('@playwright/test').Page} page
 * @param {number[]} punkt
 * @param {string} wahl CSS-Wahl des Knopfes, der getroffen werden soll
 */
async function klickTrifft(page, punkt, wahl) {
    await page.evaluate(() => {
        // @ts-ignore — Messfeld der Probe
        window.__mobZiel = null;
        // @ts-ignore — Messfeld der Probe
        window.__mobLauscher = e => {
            // @ts-ignore — Messfeld der Probe
            window.__mobZiel = e.target;
        };
        // @ts-ignore — Messfeld der Probe
        document.addEventListener('click', window.__mobLauscher, true);
    });
    await page.mouse.click(punkt[0], punkt[1]);
    await page.waitForTimeout(350);
    const treffer = await page.evaluate(w => {
        // @ts-ignore — Messfeld der Probe
        document.removeEventListener('click', window.__mobLauscher, true);
        const knopf = document.querySelector(w);
        // @ts-ignore — Messfeld der Probe
        const ziel = window.__mobZiel;
        const bez = e => {
            if (!e) return 'nichts';
            const id = e.id ? '#' + e.id : '';
            const kl =
                typeof e.className === 'string' && e.className.trim()
                    ? '.' + e.className.trim().split(/\s+/).join('.')
                    : '';
            return e.tagName.toLowerCase() + id + kl;
        };
        return {
            drin: !!(knopf && ziel && (ziel === knopf || knopf.contains(ziel))),
            ziel: bez(ziel)
        };
    }, wahl);
    // Zustand zuruecksetzen: ein Treffer hat ein Panel aufgeklappt.
    await page.evaluate(() => {
        if (document.querySelector('.qref-panel.active')) {
            // @ts-ignore — global aus der Schnellreferenz
            if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
        }
        if (document.querySelector('.floating-dice-panel.show')) {
            // @ts-ignore — global aus dem Wuerfel-Kern
            if (typeof window.toggleFloatingDice === 'function') window.toggleFloatingDice();
        }
    });
    await page.waitForTimeout(300);
    return treffer;
}

test.describe('M1 — das Ereignis-Log liegt nicht auf den bodenverankerten Knoepfen', () => {
    for (const theme of THEMES) {
        for (const [breite, hoehe] of STREIFEN_FENSTER) {
            test(`${breite}x${hoehe}, Theme ${theme}: runde Knoepfe bleiben unter dem Log erreichbar`, async ({
                page
            }) => {
                await page.setViewportSize({ width: breite, height: hoehe });
                await mobilLaden(page, theme, SAAT_GEFUELLT);

                for (const zustand of ['fluechtig', 'dauermodus']) {
                    await logZustand(page, zustand);
                    const m = await page.evaluate(messeStapel, MIN_TIPPFLAECHE);

                    console.log(
                        `[M1-Stapel] ${breite}x${hoehe} ${theme} ${zustand}: Log ` +
                            `${m.log ? JSON.stringify(m.log.kasten) : '(fehlt)'} ` +
                            `${m.log ? m.log.abstandUnten + 'px ueber dem Rand, ' + m.log.abgeschnitten + 'px abgeschnitten' : ''}, ` +
                            `Knoepfe ${m.knoepfe.map(k => `${k.was} frei ${k.frei}/${k.hoehe}`).join(', ')}, ` +
                            `Kopfzeile ${m.kopfAnzahl - m.kopfBlockiert.length}/${m.kopfAnzahl}`
                    );

                    /* VORBEDINGUNGEN. Ohne sie koennte die Probe einen Zustand
                       messen, in dem es nichts zu messen gibt, und zufrieden
                       sein: kein Log, keine Knoepfe, eine ausgefahrene Leiste
                       (dann verbirgt die Regel aus der Vorrunde ohnehin alles). */
                    expect(m.navOffen, `${zustand}: die Leiste muss eingeklappt stehen`).toBe(
                        false
                    );
                    expect(m.log, `${zustand}: das Ereignis-Log muss sichtbar sein`).not.toBeNull();
                    expect(
                        m.knoepfe.map(k => k.was),
                        `${zustand}: der Filter muss die bodenverankerten runden Knoepfe finden`
                    ).toHaveLength(2);
                    expect(
                        m.kopfAnzahl,
                        `${zustand}: die Mobil-Kopfzeile muss Knoepfe tragen`
                    ).toBeGreaterThan(0);

                    // A — FREIE TIPPFLAECHE auf der Mittelsenkrechten.
                    expect(
                        m.knoepfe
                            .filter(k => k.frei < MIN_TIPPFLAECHE)
                            .map(
                                k =>
                                    `${k.was}: nur ${k.frei} von ${k.hoehe}px frei, ` +
                                    `Mitte (${k.mitte[0]},${k.mitte[1]}) -> ${k.mitteObenauf}`
                            ),
                        `${zustand}: bodenverankerte Knoepfe unter ${MIN_TIPPFLAECHE}px freier Hoehe`
                    ).toEqual([]);

                    // B — DAS LOG DECKT KEINEN KNOPF DER MOBIL-KOPFZEILE.
                    expect(
                        m.kopfBlockiert,
                        `${zustand}: verdeckte Knoepfe der Mobil-Kopfzeile ` +
                            `(${m.kopfBlockiert.length} von ${m.kopfAnzahl})`
                    ).toEqual([]);

                    // C — UND DER ECHTE KLICK KOMMT AN.
                    const tot = [];
                    for (const k of m.knoepfe) {
                        const t = await klickTrifft(page, k.mitte, k.wahl);
                        if (!t.drin) tot.push(`${k.was}: Klick landete auf ${t.ziel}`);
                    }
                    expect(tot, `${zustand}: echte Klicks, die den Knopf nicht erreichen`).toEqual(
                        []
                    );
                }
            });
        }
    }
});

/* ====================================================================
   GEGENPROBE ZUM STAPEL — der alte Sitz des Logs meldet den Befund.
   ====================================================================
   Dieselbe Begruendung wie bei den beiden Gegenproben darueber: eine Probe, die
   den Zustand VOR der Korrektur nie herstellt, belegt nicht, dass sie ihn sehen
   koennte. Der alte Zustand ist hier eine einzige Zahl — das Log sass 80px
   ueber dem unteren Fensterrand statt 80px ueber dem Streifen.

   Erzwungen mit `!important`, weil die Korrektur selbst eine Regel mit
   Attributselektor ist (`[data-layout="mobile"] .event-log`, Spezifitaet 0-2-0)
   und von einem gewoehnlichen Stilblatt nicht geschlagen wird. Das `!important`
   faellt NICHT in die Ratsche: die zaehlt die Quelldateien unter assets/styles/,
   nicht die Stilblaetter eines Testlaufs.

   GEMESSEN, 360x740, Theme dark, Dauermodus:

     Zustand                       Kugel        Wuerfel-Knopf   Klicks
     ---------------------------   ----------   -------------   ---------------
     80px ueber dem Streifen (Q2)  frei 50/50   frei 48/48      beide kommen an
     80px ueber dem Rand (vorher)  frei 14/50   frei 10/48      beide tot
   ==================================================================== */
test.describe('M1 — Gegenprobe: der alte Sitz des Ereignis-Logs meldet den Befund', () => {
    test('360x740: 80px ueber dem Fensterrand decken die runden Knoepfe wieder', async ({
        page
    }) => {
        // Kleinstes Fenster der eigenen Achse — wandert mit, statt eine
        // verdrahtete Zahl zu fuehren.
        const [breite, hoehe] = FENSTER.reduce((a, b) => (b[1] < a[1] ? b : a));
        await page.setViewportSize({ width: breite, height: hoehe });
        await mobilLaden(page, THEMES[0], SAAT_GEFUELLT);
        await logZustand(page, 'dauermodus');

        // VORBEDINGUNG — beide Knoepfe sind frei. Ohne sie wuerde die Gegenprobe
        // einen vorbestehenden Fehler als Erfolg verbuchen.
        const frei = await page.evaluate(messeStapel, MIN_TIPPFLAECHE);
        expect(
            frei.knoepfe.filter(k => k.frei < MIN_TIPPFLAECHE).map(k => `${k.was} ${k.frei}px`),
            'Vorbedingung: beide runden Knoepfe muessen frei sein'
        ).toEqual([]);

        // Und jetzt der Sitz von vorher.
        await page.addStyleTag({ content: '.event-log { bottom: 80px !important; }' });
        await page.waitForTimeout(300);
        const alt = await page.evaluate(messeStapel, MIN_TIPPFLAECHE);
        console.log(
            `[M1-Stapel-Gegenprobe] ${breite}x${hoehe}: frei ` +
                `${frei.knoepfe.map(k => k.was + ' ' + k.frei).join(',')} | alt ` +
                `${alt.knoepfe.map(k => k.was + ' ' + k.frei).join(',')}`
        );

        // Erst der Beweis, dass der Zwang gegriffen hat.
        expect(
            alt.log ? alt.log.abstandUnten : null,
            'der alte Sitz muss zu erzwingen sein (80px ueber dem Fensterrand)'
        ).toBe(80);
        // Und dann: die Zusicherung sieht den Befund — beide Knoepfe UND der Klick.
        expect(
            alt.knoepfe.filter(k => k.frei < MIN_TIPPFLAECHE).map(k => k.was),
            `die Flaechen-Zusicherung muss beide Knoepfe melden ` +
                `(${alt.knoepfe.map(k => k.was + ' ' + k.frei + 'px').join(', ')})`
        ).toHaveLength(2);
        for (const k of alt.knoepfe) {
            const t = await klickTrifft(page, k.mitte, k.wahl);
            expect(t.drin, `${k.was}: der Klick muss am alten Sitz des Logs scheitern`).toBe(false);
        }
    });
});

/* ====================================================================
   ZUSICHERUNG 12 UND 13 — DIESELBEN FRAGEN, ABER MIT GEFUELLTER KAMPAGNE.
   ====================================================================
   WARUM DAS EINE EIGENE ZUSICHERUNG BRAUCHT UND KEINE WIEDERHOLUNG IST.
   Die Zusicherungen 1 bis 10 laden mit `mobilLaden(page, theme)` — also mit
   dem Leerzustand `SAAT`, deren Kommentar das ausdruecklich festhaelt ("Daten
   braucht diese Probe nicht"). Fuer die Leiste selbst ist das richtig: ihr
   Raster haengt an der Zahl der Reiter, nicht an der Zahl der Datensaetze.
   Fuer die beiden Fragen hier gilt das NICHT:

     ERREICHBARKEIT  Auf dem Leerzustand ist jede Ansicht kurz, die Seite
                     scrollt nicht, und der Umschalter sitzt immer an derselben
                     Stelle. Mit Daten scrollt die Seite, und die
                     bodenverankerten Schweber stehen in einem anderen
                     Verhaeltnis zur eingeklappten Leiste.
     STREIFEN        Die beiden Panels, die den Streifen ueberhaupt bedecken
                     koennen, werden von DATEN hoch: das Wuerfel-Panel traegt
                     die Wurfgeschichte (`diceHistory`), die Schnellreferenz
                     die eigenen Eintraege (`quickRefCustom`). Auf leerer Saat
                     sind beide auf ihrer Mindesthoehe — die Flaechenmessung
                     ist damit am schwaechsten Fall geprueft, nicht am
                     schwersten. `SAAT_GEFUELLT` weiter oben hilft hier nicht:
                     sie fuehrt weder `diceHistory` noch `quickRefCustom`.

   Das ist genau die Falle, die in diesem Projekt schon einmal einen Fehler
   drei Wochen getragen hat (die Listen-Schalen: der Verlust begann ab dem
   10. Eintrag, die Testseeds waren kuerzer). Darum steht in beiden
   Zusicherungen eine VORBEDINGUNG, die belegt, dass die Saat angekommen ist.

   WARUM 320x700. Das engste gebraeuchliche Geraet und damit der Fall, in dem
   die Leiste am wenigsten Platz hat; die Zusicherung mit den 24 echten Klicks
   weiter oben laeuft bei 390x844. Der Streifen bekommt zusaetzlich 740x360,
   weil dort die Leiste scrollen MUSS und der Streifen am breitesten ist (144
   Tastpunkte statt 66).

   ROT OHNE DIE KORREKTUR — auf DIESER Saat gemessen, nicht uebernommen:

     Zusicherung          Zwang                             Befund
     ------------------   -------------------------------   -------------------
     12 Erreichbarkeit    Deckel 300px UND                  20 von 24; offen:
                          `.nav-tabs { overflow: hidden }`  soundboard,
                                                            dicestats,
                                                            sessionprep, data
     13 Streifen 320x700  `.qref-fab { bottom: 10px }`      2250px2, 7 von 66
     13 Streifen 740x360  `.qref-fab { bottom: 10px }`      2250px2, 7 von 144

   ZWEI MESSERGEBNISSE, DIE DER ERWARTUNG WIDERSPRACHEN, und beide gehoeren
   hierher, weil sie erklaeren, warum die Zwaenge so und nicht einfacher sind:

     (a) DER DECKEL ALLEIN GENUEGT NICHT. Die Gegenprobe zu Zusicherung 8
         erzwingt nur das Token `--mobile-nav-max-height: 300px` und sieht damit
         ihren Befund — sie misst `erreichbar` in EINEM Augenblick, ohne zu
         rollen. Zusicherung 12 rollt je Reiter nach (`radeln()`), und mit dem
         `overflow`-Rueckfall, den M1 eingebaut hat, bleibt dann JEDER Reiter
         erreichbar: gemessen 24 von 24 TROTZ Deckel. Erst OHNE den Rueckfall
         entsteht der Verlust — und das ist genau der Zustand von vor M1, also
         der richtige Zwang. Der erste, schwaechere Zwang machte diese
         Zusicherung nicht rot und belegte deshalb nichts; er wurde verworfen.
     (b) DIE KUGEL AM ALTEN SITZ BLOCKIERT DEN UMSCHALTER NICHT. `.qref-fab`
         mit `bottom: 10px` deckt 2250px2 des Streifens (Zusicherung 13 sieht
         das), aber nicht die MITTE der Umschalter-Zeile — Zusicherung 12 bleibt
         unter diesem Zwang gruen (24 von 24). Die beiden Zusicherungen messen
         also wirklich Verschiedenes, und keine ersetzt die andere. */

/** Saat fuer die beiden Zusicherungen unten: gefuellt UND mit den zwei
 *  Sammlungen, die die bodenverankerten Panels in die Hoehe treiben.
 *  Getrennt von `SAAT_GEFUELLT` gehalten, damit Zusicherung 11 ihre eigenen
 *  Bedingungen behaelt. */
const SAAT_SCHWER = {
    ...SAAT_GEFUELLT,
    /* 12 Wuerfe — das Wuerfel-Panel zeigt die letzten fuenf, und erst mit
       Geschichte erreicht es seine volle Hoehe. */
    diceHistory: Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        formula: '1d20+7',
        result: (i % 20) + 1,
        total: (i % 20) + 8,
        rolls: [(i % 20) + 1],
        label: 'Wurf mit laengerem Etikett ' + (i + 1),
        timestamp: 1760000000000 - i * 60000
    })),
    /* Drei eigene Eintraege in der Schnellreferenz, aufgeklappt — dasselbe
       Argument. */
    quickRefCustom: Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        title: 'Eigener Eintrag mit langem Titel ' + (i + 1),
        content: '<p>Inhalt mit genug Text, dass er in einem schmalen Fenster umbricht.</p>',
        expanded: true
    })),
    /* Ein laufender Kampf — die Initiative ist die Ansicht mit den meisten
       bodenverankerten Elementen gleichzeitig. */
    initiative: {
        combatants: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: 'Kaempfer mit langem Namen ' + (i + 1),
            initiative: 20 - i,
            currentHp: 20,
            maxHp: 30,
            ac: 15,
            type: i % 2 ? 'player' : 'enemy'
        })),
        currentTurn: 0,
        round: 3
    }
};

/** Belegt im Browser, dass die schwere Saat angekommen ist. */
function messeSchwereFuellung() {
    // @ts-ignore — globaler Datenkern
    const D = window.D || {};
    return {
        figuren: (D.characters || []).length,
        nscs: (D.npcs || []).length,
        auftraege: (D.quests || []).length,
        wuerfe: (D.diceHistory || []).length,
        qrefEigene: (D.quickRefCustom || []).length,
        kaempfer: ((D.initiative || {}).combatants || []).length
    };
}

test.describe('M1 — mit gefuellter Kampagne: alle 24 per echtem Klick', () => {
    test('320x700: 24 echte Klicks auf einer gefuellten Kampagne', async ({ page }) => {
        test.setTimeout(180000);
        await page.setViewportSize({ width: 320, height: 700 });
        await mobilLaden(page, THEMES[0], SAAT_SCHWER);

        /* VORBEDINGUNG — ohne sie misst diese Zusicherung den Leerzustand
           und ist eine Dublette der Zusicherung weiter oben. */
        const f = await page.evaluate(messeSchwereFuellung);
        expect(
            { figuren: f.figuren >= 6, nscs: f.nscs >= 14, kaempfer: f.kaempfer >= 10 },
            `Vorbedingung: Fuellstand ${JSON.stringify(f)}`
        ).toEqual({ figuren: true, nscs: true, kaempfer: true });

        const ansichten = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.nav-tab[data-view]')).map(t => t.dataset.view)
        );
        expect(ansichten.length, 'alle Ansichten muessen gefuehrt werden').toBe(ANZAHL_ANSICHTEN);

        const gescheitert = [];
        for (const view of ansichten) {
            /* Die Leiste JEDES Mal neu ueber den echten Umschalter oeffnen —
               `leisteOeffnen()` prueft dabei selbst, dass der Weg dorthin
               nicht von einem Schweber verdeckt ist. Auf einer gefuellten
               Kampagne ist genau das die Frage. */
            await leisteOeffnen(page);
            await radeln(page, -3000);
            let treffer = null;
            let letzterStand = null;
            for (let i = 0; i < 30; i++) {
                const m = await page.evaluate(messeLeiste);
                const r = m.reiter.find(x => x.view === view);
                if (r && r.erreichbar) {
                    treffer = r;
                    break;
                }
                if (letzterStand !== null && m.navRollstand === letzterStand) break;
                letzterStand = m.navRollstand;
                await radeln(page, 140);
            }
            if (!treffer) {
                gescheitert.push(`${view}: nicht erreichbar`);
                continue;
            }
            await page.mouse.click(treffer.mitte[0], treffer.mitte[1]);
            await page.waitForTimeout(300);
            const aktiv = await page.evaluate(
                v => !!document.querySelector(`#view-${v}.active`),
                view
            );
            if (!aktiv) gescheitert.push(`${view}: Klick wechselte die Ansicht nicht`);
        }
        console.log(
            `[M1-gefuellt] 320x700: ${ansichten.length - gescheitert.length}/` +
                `${ANZAHL_ANSICHTEN} per echtem Klick erreicht`
        );
        expect(gescheitert, 'Reiter ohne Wirkung auf einer gefuellten Kampagne').toEqual([]);
    });
});

test.describe('M1 — mit gefuellter Kampagne: der Streifen bleibt frei', () => {
    for (const [breite, hoehe] of [
        [320, 700],
        [740, 360]
    ]) {
        test(`${breite}x${hoehe}: kein Schweber auf dem Streifen, gefuellte Kampagne`, async ({
            page
        }) => {
            test.setTimeout(90000);
            await page.setViewportSize({ width: breite, height: hoehe });
            await mobilLaden(page, THEMES[0], SAAT_SCHWER);

            // VORBEDINGUNG — die Daten, die die Panels hoch machen, sind da.
            const f = await page.evaluate(messeSchwereFuellung);
            expect(
                { wuerfe: f.wuerfe >= 12, qrefEigene: f.qrefEigene >= 3 },
                `Vorbedingung: ohne Wurfgeschichte und eigene Eintraege stehen die ` +
                    `beiden Panels auf ihrer Mindesthoehe — Fuellstand ${JSON.stringify(f)}`
            ).toEqual({ wuerfe: true, qrefEigene: true });

            for (const zustand of ['schlicht', 'voll']) {
                if (zustand === 'voll') await alleSchweberOffen(page);

                const m = await page.evaluate(messeStreifen, STREIFEN_SCHRITT);
                expect(m.fehlt, `${zustand}: Leiste oder Umschalter fehlt`).toBe(false);
                console.log(
                    `[M1-Streifen-gefuellt] ${breite}x${hoehe} ${zustand}: Streifen ` +
                        `h=${m.streifen.hoehe}px, Ueberlapper ${m.ueberlapper.length}, ` +
                        `fremd ${m.fremd.length} von ${m.anzahlPunkte}`
                );

                // Dieselben Vorbedingungen wie bei Zusicherung 9/10.
                expect(m.navOffen, `${zustand}: die Leiste muss eingeklappt stehen`).toBe(false);
                expect(
                    m.streifen.hoehe,
                    `${zustand}: der Streifen muss die Daumengroesse haben (${m.streifen.hoehe}px)`
                ).toBeGreaterThanOrEqual(MIN_TIPPFLAECHE);

                // A — FLAECHE.
                expect(
                    m.ueberlapper.map(u => `${u.was} deckt ${u.deckung}px2 (z=${u.z})`),
                    `${zustand}: Schwebeelemente auf dem Streifen, gefuellte Kampagne`
                ).toEqual([]);

                // B — TASTPUNKTE ueber die ganze Breite.
                expect(
                    m.fremd.map(x => `(${x.x},${x.y}) -> ${x.obenauf}`),
                    `${zustand}: Tastpunkte, die NICHT mit der Leiste antworten ` +
                        `(${m.fremd.length} von ${m.anzahlPunkte})`
                ).toEqual([]);
            }
        });
    }
});
