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
 * GEMESSEN am Buendel zu cecfefe (`setLayout('mobile')`, Umschalter geklickt,
 * `elementFromPoint` auf der Reitermitte, Ereignis-Log im Dauermodus mit fuenf
 * Meldungen und offenem Kampfprotokoll):
 *
 *   Fenster    Reiter  im Feld  erreichbar   Leiste  Rasterinhalt
 *   --------   ------  -------  ----------   ------  ------------
 *   390x844        24       16          11    300px         444px
 *   360x740        24       16          13    300px         444px
 *   700x800        24       16          16    300px         444px
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
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function mobilLaden(page, theme) {
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng;
            // dann greift der Leerzustand, und der ist fuer diese Probe genauso
            // brauchbar.
        }
    }, SAAT);
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
 * Faehrt die Leiste ueber den echten Umschalter aus.
 * @param {import('@playwright/test').Page} page
 */
async function leisteOeffnen(page) {
    const schon = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    if (!schon) {
        await page.locator('.mobile-nav-toggle').click();
        await page.waitForTimeout(450); // 0.3s Uebergang plus Luft
    }
    const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    expect(offen, 'die Leiste liess sich nicht ausfahren').toBe(true);
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
            erreichbar: !!el && (el === t || t.contains(el)),
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
        navRollstand: Math.round(nav.scrollTop),
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
                    if (zustand === 'voll') await vollerZustand(page);
                    await leisteOeffnen(page);

                    const erste = await page.evaluate(messeLeiste);
                    console.log(
                        `[M1] ${breite}x${hoehe} ${theme} ${zustand}: Leiste ${erste.leisteHoehe}px ` +
                            `(oben ${erste.leisteOben}), Raster Sicht ${erste.navSichtHoehe}px / ` +
                            `Inhalt ${erste.navInhaltHoehe}px, erreichbar ` +
                            `${erste.reiter.filter(r => r.erreichbar).length}/${erste.reiter.length}, ` +
                            `Ueberlapper ${JSON.stringify(erste.ueberlapper)}`
                    );

                    expect(
                        erste.reiter.length,
                        `${zustand}: die Leiste muss alle Ansichten fuehren`
                    ).toBe(ANZAHL_ANSICHTEN);

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
