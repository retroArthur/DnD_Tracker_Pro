// @ts-check
/**
 * E2E — Das Hoehenbudget der fuenf Listen-Schalen (U6).
 *
 * WARUM ES DIESE PROBE BRAUCHT. Die fuenf Master-Detail-Schalen (`.loc-view`,
 * `.npc-view`, `.loot-view`, `.enc-view`, `.bestiary-view`) rechnen ihre Hoehe
 * gegen den Fensterrand: `height: calc(100vh - X)` mit `overflow: hidden`. Das
 * X war fest verdrahtet (120px) und falsch — die tatsaechliche Umrahmung ist
 * `Hoehe des festen Umzugs-Bands + Hoehe der Kopfzeile + Innenabstand von
 * .main-content`. Gemessen am Buendel zu fef3afb (dark, 24 Eintraege je Liste,
 * 128 Zustaende aus 4 Ansichten x 4 Breiten x 2 Fensterhoehen x mit/ohne Band
 * x gescrollt/oben):
 *
 *   Breite  ohne Band        mit Band
 *   ------  ---------------  ---------------
 *   1920    Ueberhang  14px  Ueberhang  75px
 *   1440    Ueberhang  14px  Ueberhang  75px
 *   1280    Ueberhang  14px  Ueberhang  75px
 *    900    Ueberhang  52px  Ueberhang 113px
 *
 *   Ueberhang > 0 in 128 von 128 Zustaenden.
 *
 * Dieser Ueberhang ist der Weg, auf dem die Seite UEBERHAUPT scrollt — und
 * damit der Weg, auf dem die Werkzeugleiste der Ansicht unter die angeheftete
 * Kopfzeile rutschen kann. In allen 32 Zustaenden "mit Band + gescrollt"
 * antwortete `elementFromPoint` auf der Mitte des Suchfelds mit
 * `BUTTON.nav-group-btn` statt mit dem Suchfeld: die Kopfzeile deckte die
 * Werkzeugleiste um 59px (ab 1280 Breite) bzw. 74-103px (900).
 *
 * Bei Ueberhang 0 scrollt die Seite nicht, und keine Leiste kann irgendwohin
 * rutschen. Die Korrektur leitet das Budget deshalb aus derselben GEMESSENEN
 * Kette ab, die schon die drei Anheft-Versaetze liefert (`updateStickyOffsets()`
 * in `ui/editors/rich-text-insert.js`), und veroeffentlicht es als viertes
 * Token `--view-frame-height` auf `<html>`.
 *
 * WARUM MIT BAND. Das Band ist der Normalfall am Spieltisch: der DM faehrt die
 * App per `file://`, und dort zeigt `startMigrationFileSide()` den Umzugs-
 * Hinweis in JEDER frischen Browsersitzung (Waechter `migration-hint-shown` im
 * sessionStorage, pro Kontext leer). Es wird hier also NICHT unterdrueckt.
 *
 * WARUM PER MAUSRAD. Ein gesetztes `scrollTop` bewegt auch einen Bereich, den
 * der Nutzer nicht scrollen kann — eine Messung, die so prueft, meldet
 * Erreichbarkeit, wo keine ist. Vorbild: ansichts-schalen.spec.js.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Mehr Eintraege als in jede Schale passen — sonst gibt es nichts zu scrollen. */
const ANZAHL = 24;

const reihe = (wort, extra) =>
    Array.from({ length: ANZAHL }, (_, i) => ({
        id: i + 1,
        name: `${wort} ${String(i + 1).padStart(2, '0')}`,
        ...extra
    }));

/* Wie `seedCleanSession()` in tests/e2e/helpers/test-utils.js: weit-in-der-
   Zukunft-`_version` ueberspringt `migrateData()`, die nicht vorbelegten
   Schluessel und eine gefuellte `_nextId`-Abbildung verhindern die Fruehstart-
   Rennen. Dazu 24 Datensaetze je Liste. */
const SAAT = {
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
    locations: reihe('Ort', { type: 'Stadt', region: 'Kernland', description: 'Probeeintrag' }),
    npcs: reihe('NSC', { race: 'Mensch', role: 'Haendler', description: 'Probeeintrag' }),
    loot: reihe('Beute', { type: 'Waffe', value: 10, description: 'Probeeintrag' }),
    encounters: reihe('Begegnung', { difficulty: 'medium', monsters: [], description: 'Probe' }),
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

/** Reitername, View-Id, Suchfeld der Werkzeugleiste, Listencontainer. */
const ANSICHTEN = [
    ['locations', 'view-locations', '#loc-search', '#locations-list'],
    ['npcs', 'view-npcs', '#npc-search', '#npc-list'],
    ['loot', 'view-loot', '#loot-search', '#loot-list'],
    ['encounter', 'view-encounter', '#enc-search', '#encounter-list']
];

/**
 * Oeffnet die App mit gefuellten Listen. Das Umzugs-Band wird bewusst NICHT
 * unterdrueckt (siehe Kopfkommentar).
 *
 * `opts.weitere` legt VOR dem Laden weitere localStorage-Schluessel ab — der
 * Weg, auf dem der Divergenz-Zweig von `startMigrationFileSide()` betreten
 * wird (`migration-divergence-since`). Nur so faellt die Verzweigung dort, wo
 * sie im Betrieb faellt; ein nachtraeglicher Aufruf von
 * `showDivergenceBanner()` wuerde den Einstieg ueberspringen.
 *
 * `opts.mobil` laesst den Wartepunkt von `waitForAppReady()` weg und wartet nur
 * auf die Bereitschaftsmarkierung. Im Mobil-Layout ist die Desktop-Kopfzeile
 * ausgeblendet (`[data-layout="mobile"] .header-actions { display: none }`), und
 * `waitForAppReady()` wartet auf eine SICHTBARE `.app-title` — es lief dort in
 * die Zeitgrenze. Derselbe Griff wie in sticky-stapel.spec.js.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{weitere?: Record<string,string>, mobil?: boolean}} [opts]
 */
async function appLaden(page, opts) {
    const o = opts || {};
    await page.addInitScript(
        arg => {
            try {
                localStorage.setItem('dnd-tracker-v4', JSON.stringify(arg.saat));
                for (const schluessel of Object.keys(arg.weitere)) {
                    localStorage.setItem(schluessel, arg.weitere[schluessel]);
                }
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        { saat: SAAT, weitere: o.weitere || {} }
    );
    await page.goto(APP_URL);
    if (o.mobil) {
        await page.waitForFunction(
            () => document.documentElement.dataset.appReady === 'true',
            null,
            { timeout: 15000 }
        );
    } else {
        await waitForAppReady(page);
    }
    await page.waitForTimeout(500);
}

/** Schliesst das Umzugs-Band ueber seinen eigenen Knopf — den Weg des Nutzers. */
async function bandSchliessen(page) {
    const zu = page.locator('[data-action="close-migration-hint"]');
    if (await zu.count()) {
        await zu.click();
        await page.waitForTimeout(400);
    }
}

/**
 * Wechselt den Reiter und fuehrt das Mausrad ueber der Liste.
 *
 * Der Radpunkt wird aus dem SICHTBAREN Teil der Liste gerechnet, nicht aus der
 * halben Fensterhoehe. Mit der halben Fensterhoehe lag der Punkt bei 700px
 * Fenster und stehendem Band auf der Werkzeugleiste (die Schale beginnt dort
 * erst bei 195px) — das Rad erreichte die Liste nicht, und die Probe haette
 * eine Unerreichbarkeit gemeldet, die es nicht gibt. Nachgemessen am Buendel,
 * nicht vermutet.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} reiter
 * @param {string} listenSel
 */
async function reiterUndRollen(page, reiter, listenSel) {
    await page.evaluate(n => window.switchView(n), reiter);
    await page.waitForTimeout(400);
    const kasten = await page.locator(listenSel).boundingBox();
    const breite = page.viewportSize().width;
    const mx = kasten ? Math.min(Math.max(kasten.x + kasten.width / 2, 5), breite - 5) : breite / 2;
    const my = await page.evaluate(sel => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return Math.round((Math.max(r.top, 0) + Math.min(r.bottom, window.innerHeight)) / 2);
    }, listenSel);
    await page.mouse.move(Math.round(mx), my);
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 400);
    await page.waitForTimeout(400);
}

/**
 * Die vier Messgroessen im aktuellen Zustand. Laeuft IM Browser.
 * @param {string[]} sel [Suchfeld, Liste]
 */
function messeBudget(sel) {
    const suchSel = sel[0];
    const listenSel = sel[1];
    const de = document.documentElement;
    const treffer = el => {
        if (!el) return 'fehlt';
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return 'unsichtbar';
        const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!e) return 'nichts';
        return el === e || el.contains(e)
            ? 'frei'
            : 'verdeckt von ' + e.tagName + '.' + String(e.className).split(' ')[0];
    };
    const such = document.querySelector(suchSel);
    const leiste = such ? such.closest('.section-toolbar') : null;
    const kopf = document.querySelector('.app-header');
    const band =
        document.querySelector('.migration-hint-banner') ||
        document.querySelector('.divergence-banner');
    const posten = Array.from(document.querySelector(listenSel).children);
    const letzter = posten[posten.length - 1];
    const lr = letzter.getBoundingClientRect();
    const imFenster = lr.top < window.innerHeight && lr.bottom > 0 && lr.height > 0;
    const px = Math.round(lr.left + Math.min(lr.width, window.innerWidth - lr.left) / 2);
    const py = Math.round(Math.min(lr.bottom, window.innerHeight - 1)) - 4;
    const getroffen = imFenster ? document.elementFromPoint(px, py) : null;
    const ue = (a, b) =>
        a && b ? Math.max(0, Math.round(Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))) : 0;
    return {
        ueberhang: Math.round(de.scrollHeight - de.clientHeight),
        scrollY: Math.round(window.scrollY),
        bandDa: !!band,
        bandKlasse: band ? String(band.className).split(' ')[0] : '(keins)',
        bandHoehe: band ? Math.round(band.getBoundingClientRect().height) : 0,
        rahmen: getComputedStyle(de).getPropertyValue('--view-frame-height').trim() || '(keins)',
        layout: de.dataset.layout || '(keins)',
        klasseHinweis: document.body.classList.contains('has-migration-hint'),
        klasseDivergenz: document.body.classList.contains('has-divergence-banner'),
        koerperOben: getComputedStyle(document.body).paddingTop,
        kopfDecktLeiste: ue(
            kopf ? kopf.getBoundingClientRect() : null,
            leiste ? leiste.getBoundingClientRect() : null
        ),
        bandDecktKopf: ue(
            band ? band.getBoundingClientRect() : null,
            kopf ? kopf.getBoundingClientRect() : null
        ),
        suchfeld: treffer(such),
        appTitel: treffer(document.querySelector('.app-title')),
        globaleSuche: treffer(document.getElementById('global-search')),
        anzahl: posten.length,
        letzterOben: Math.round(lr.top),
        letzterUnten: Math.round(lr.bottom),
        letzterImFenster: imFenster,
        letzterKlickbar: !!(getroffen && (letzter === getroffen || letzter.contains(getroffen)))
    };
}

test.describe('Hoehenbudget der Listen-Schalen (U6)', () => {
    for (const [reiter, , suchSel, listenSel] of ANSICHTEN) {
        test(`mit Umzugs-Band und gescrollt bleibt die Seite ohne Ueberhang: ${reiter}`, async ({
            page
        }) => {
            await page.setViewportSize({ width: 1440, height: 800 });
            await appLaden(page);

            // Vorbedingung: ohne Band misst dieser Fall nicht, was er messen soll.
            expect(
                await page.evaluate(() => !!document.querySelector('.migration-hint-banner')),
                'das Umzugs-Band muss stehen — sonst prueft dieser Fall den halben Befund'
            ).toBe(true);

            await reiterUndRollen(page, reiter, listenSel);
            const m = await page.evaluate(messeBudget, [suchSel, listenSel]);
            console.log(`[U6] ${reiter} mit Band, gescrollt: ${JSON.stringify(m)}`);

            expect(m.anzahl, `${listenSel} muss ${ANZAHL} Eintraege rendern`).toBe(ANZAHL);
            expect(m.bandHoehe, 'das Band muss eine Hoehe haben').toBeGreaterThan(0);

            // (a) Der Seitenueberhang. Bei 0 scrollt die Seite nicht.
            expect(
                m.ueberhang,
                `${reiter}: Seitenueberhang ${m.ueberhang}px (Rahmen-Token ${m.rahmen}, Band ${m.bandHoehe}px)`
            ).toBe(0);

            // (b) Das Suchfeld der Werkzeugleiste antwortet mit sich selbst.
            expect(
                m.suchfeld,
                `${reiter}: Suchfeld ${m.suchfeld}, Kopfzeile deckt die Werkzeugleiste um ${m.kopfDecktLeiste}px`
            ).toBe('frei');
            expect(
                m.kopfDecktLeiste,
                `${reiter}: Kopfzeile deckt die Werkzeugleiste um ${m.kopfDecktLeiste}px`
            ).toBe(0);

            // Die Kopfzeile bleibt frei (Gegenprobe zur Fehlkorrektur, die den
            // Anheft-Versatz der Kopfzeile wieder auf 0 setzt).
            expect(m.appTitel, `${reiter}: App-Titel ${m.appTitel}`).toBe('frei');
            expect(m.globaleSuche, `${reiter}: globale Suche ${m.globaleSuche}`).toBe('frei');

            // Und die Liste bleibt bis zum letzten Eintrag bedienbar.
            expect(
                m.letzterImFenster,
                `${reiter}: letzter Eintrag bei ${m.letzterOben}..${m.letzterUnten}px`
            ).toBe(true);
            expect(m.letzterKlickbar, `${reiter}: letzter Eintrag liegt nicht obenauf`).toBe(true);
        });
    }

    test('ohne Band bleibt die Seite ebenfalls ohne Ueberhang', async ({ page }) => {
        // Der kleinere, aeltere Teil desselben Fehlers: 14px Ueberhang auch ohne
        // Band, weil 120px gegen eine 134px hohe Umrahmung gerechnet wurden.
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page);
        await bandSchliessen(page);
        expect(
            await page.evaluate(() => !!document.querySelector('.migration-hint-banner')),
            'das Band muss zu sein'
        ).toBe(false);

        const befunde = [];
        for (const [reiter, , suchSel, listenSel] of ANSICHTEN) {
            await reiterUndRollen(page, reiter, listenSel);
            const m = await page.evaluate(messeBudget, [suchSel, listenSel]);
            console.log(`[U6] ${reiter} ohne Band, gescrollt: ${JSON.stringify(m)}`);
            if (m.ueberhang !== 0) befunde.push(`${reiter}: Ueberhang ${m.ueberhang}px`);
            if (m.suchfeld !== 'frei') befunde.push(`${reiter}: Suchfeld ${m.suchfeld}`);
        }
        expect(befunde, befunde.join(' | ')).toEqual([]);
    });

    test('das Budget folgt einem hoeheren Band statt es zu verdrahten', async ({ page }) => {
        // Die Gegenprobe zur Verdrahtung: wird das Band hoeher, muss die Schale
        // kleiner werden. Eine feste Zahl kann das nicht. Gemessen wird nach
        // einem erneuten Lauf der Kette — genau so, wie die App ihn am
        // resize-Ereignis und an jedem Erscheinen/Verschwinden eines Bands fuehrt.
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page);

        const vorher = await page.evaluate(() =>
            getComputedStyle(document.documentElement)
                .getPropertyValue('--view-frame-height')
                .trim()
        );

        await page.addStyleTag({ content: '.migration-hint-banner { min-height: 120px; }' });
        await page.evaluate(() => {
            const band = document.querySelector('.migration-hint-banner');
            // Dieselbe Messung, die showMigrationHintBanner() selbst fuehrt.
            document.documentElement.style.setProperty(
                '--migration-hint-height',
                band.offsetHeight + 'px'
            );
            window.updateStickyOffsets();
        });
        await page.waitForTimeout(300);

        await reiterUndRollen(page, 'locations', '#locations-list');
        const m = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
        console.log(`[U6] doppelt hohes Band: vorher ${vorher}, ${JSON.stringify(m)}`);

        expect(m.bandHoehe, 'das Band muss wirklich hoeher geworden sein').toBeGreaterThanOrEqual(
            120
        );
        expect(
            m.rahmen,
            `das Rahmen-Token muss mitwachsen (vorher ${vorher}, jetzt ${m.rahmen})`
        ).not.toBe(vorher);
        expect(m.ueberhang, `Seitenueberhang ${m.ueberhang}px bei ${m.bandHoehe}px Band`).toBe(0);
        expect(m.suchfeld, `Suchfeld ${m.suchfeld}`).toBe('frei');
    });

    /* ================================================================
       DAS ZWEITE FESTE BAND — der Divergenz-Pfad.
       ================================================================
       Die drei Faelle oben fahren alle das Umzugs-Hinweisband. Das zweite
       feste Band am Fensterkopf, `.divergence-banner`, kam bis zu dieser
       Runde in KEINEM Test je auf den Schirm: `grep -rn "divergence" tests/`
       traf nur Quelltext-Belege und die Rueckfall-Zweige der Waehler
       (`.migration-hint-banner || .divergence-banner`) in dieser Datei und in
       sticky-stapel.spec.js — und in beiden stand der Hinweis, der Zweig lief
       also nie.

       Damit waren vier Stellen ungedeckt, die zusammen einen Fall tragen:
         - `body.has-divergence-banner { padding-top }` (migration.css)
         - die gemessene `--divergence-banner-height`
         - das `max(bottom)` ueber BEIDE Baender in Glied 1
         - `classList.remove('has-migration-hint')` in startMigrationFlow()
       Gemessen am Buendel mit zurueckgedrehter Korrektur (1440x800, Orte,
       ungescrollt wie gescrollt): Band deckt die Kopfzeile 40px, App-Titel
       antwortet mit STRONG, globale Suche mit SPAN.divergence-banner-text,
       Rahmen 134px statt 174px. Die volle Playwright-Suite blieb dabei gruen.

       BETRETEN WIRD DER ZWEIG UEBER SEINEN ECHTEN EINSTIEG: ein vorbelegtes
       `migration-divergence-since` laesst startMigrationFileSide() den
       Divergenz-Zweig waehlen UND den Hinweis unterdruecken (`if
       (!divergenceSince) showMigrationHintBanner()`). Ein direkter Aufruf von
       showDivergenceBanner() wuerde genau diese Verzweigung ueberspringen. */
    test('der Divergenz-Pfad: das zweite feste Band haelt Kopfzeile und Seite frei', async ({
        page
    }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page, {
            weitere: { 'migration-divergence-since': JSON.stringify({ date: '2026-08-15' }) }
        });

        // Vorbedingung: der richtige Zweig, nicht der Hinweis.
        const zweig = await page.evaluate(() => ({
            divergenz: !!document.querySelector('.divergence-banner'),
            hinweis: !!document.querySelector('.migration-hint-banner')
        }));
        expect(
            zweig,
            `startMigrationFileSide() muss den Divergenz-Zweig waehlen (${JSON.stringify(zweig)})`
        ).toEqual({ divergenz: true, hinweis: false });

        // Ungescrollt UND gescrollt: ohne die Gegenrechnung am Seiteninhalt
        // verdeckt das `position: fixed`-Band die Kopfzeile in BEIDEN Lagen.
        for (const lage of ['oben', 'gescrollt']) {
            if (lage === 'oben') {
                await page.evaluate(() => window.switchView('locations'));
                await page.waitForTimeout(400);
            } else {
                await reiterUndRollen(page, 'locations', '#locations-list');
            }
            const m = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
            console.log(`[U6] Divergenz-Band, ${lage}: ${JSON.stringify(m)}`);

            expect(m.bandKlasse, `${lage}: es muss das Divergenz-Band sein`).toBe(
                'divergence-banner'
            );
            expect(m.bandHoehe, `${lage}: das Band muss eine Hoehe haben`).toBeGreaterThan(0);
            expect(
                m.klasseDivergenz,
                `${lage}: body.has-divergence-banner fehlt (padding-top ${m.koerperOben})`
            ).toBe(true);
            expect(
                m.koerperOben,
                `${lage}: die Gegenrechnung am Seiteninhalt muss die Bandhoehe tragen (${m.koerperOben} bei ${m.bandHoehe}px Band)`
            ).toBe(`${m.bandHoehe}px`);
            expect(
                m.ueberhang,
                `${lage}: Seitenueberhang ${m.ueberhang}px (Rahmen ${m.rahmen})`
            ).toBe(0);
            expect(
                m.bandDecktKopf,
                `${lage}: das Band deckt die Kopfzeile um ${m.bandDecktKopf}px`
            ).toBe(0);
            expect(m.appTitel, `${lage}: App-Titel ${m.appTitel}`).toBe('frei');
            expect(m.globaleSuche, `${lage}: globale Suche ${m.globaleSuche}`).toBe('frei');
            expect(m.suchfeld, `${lage}: Suchfeld der Werkzeugleiste ${m.suchfeld}`).toBe('frei');
        }
    });

    test('der Uebergang Hinweis -> Divergenz laesst keine Klasse stehen', async ({ page }) => {
        // Der 21px-Nachlauf: startMigrationFlow() entfernte das Hinweisband,
        // liess aber `body.has-migration-hint` stehen. Die Regel hielt dann
        // weiter die 61px des verschwundenen Hinweises frei, waehrend das
        // Divergenz-Banner nur 40px hoch ist — 21px Luft ueber der Kopfzeile
        // und, seit das Hoehenbudget daran haengt, 21px Seitenueberhang.
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page);

        const vor = await page.evaluate(() => ({
            hinweis: !!document.querySelector('.migration-hint-banner'),
            klasseHinweis: document.body.classList.contains('has-migration-hint'),
            koerperOben: getComputedStyle(document.body).paddingTop
        }));
        expect(vor.hinweis, 'der Fall beginnt mit stehendem Hinweisband').toBe(true);
        expect(vor.klasseHinweis, 'und mit gesetzter Gegenrechnung').toBe(true);

        await page.evaluate(() => window.switchView('locations'));
        await page.waitForTimeout(300);
        // Der echte Weg: der Knopf im Hinweisband ruft startMigrationFlow().
        await page.evaluate(() => window.startMigrationFlow());
        await page.waitForTimeout(600);
        await reiterUndRollen(page, 'locations', '#locations-list');

        const m = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
        console.log(`[U6] Uebergang (vorher ${JSON.stringify(vor)}): ${JSON.stringify(m)}`);

        expect(m.bandKlasse, 'nach dem Uebergang steht das Divergenz-Band').toBe(
            'divergence-banner'
        );
        expect(
            m.klasseHinweis,
            `body.has-migration-hint muss MIT dem Band gehen (padding-top ${m.koerperOben} bei ${m.bandHoehe}px Band)`
        ).toBe(false);
        expect(m.klasseDivergenz, 'und die des Divergenz-Bands an seine Stelle treten').toBe(true);
        expect(
            m.koerperOben,
            `die Gegenrechnung muss die neue Bandhoehe tragen (${m.koerperOben} bei ${m.bandHoehe}px)`
        ).toBe(`${m.bandHoehe}px`);
        expect(m.ueberhang, `Seitenueberhang ${m.ueberhang}px (Rahmen ${m.rahmen})`).toBe(0);
        expect(m.bandDecktKopf, `Band deckt Kopfzeile ${m.bandDecktKopf}px`).toBe(0);
        expect(m.suchfeld, `Suchfeld ${m.suchfeld}`).toBe('frei');
    });

    /* ================================================================
       DER MOBIL-ZWEIG — Glied 0 wird BESETZT, nicht abgeraeumt.
       ================================================================
       updateStickyOffsets() raeumt im Mobil-Zweig die drei Anheft-Glieder ab
       (sticky-stapel.spec.js sichert das ausdruecklich zu: drei leere Werte)
       und besetzt Glied 0 trotzdem — fuer die Schalenhoehe gibt es dort keine
       spezifischere Mobil-Regel, die an seine Stelle treten koennte. Genau
       diese Asymmetrie war ungedeckt: alle harten Zusicherungen am Token lagen
       bei 1440x800, also im Desktop-Zweig.

       Gemessen am Buendel mit entferntem `setzeRahmenHoehe(root, 0)` (Orte, 24
       Eintraege, Band steht, per Mausrad gescrollt): bei 700x800 Rahmen
       "(keins)" -> Rueckfall 134px und 137px Seitenueberhang, bei 390x844
       233px Ueberhang und das Suchfeld antwortete mit
       DIV.migration-hint-banner. Die volle Playwright-Suite blieb dabei gruen. */
    for (const [breite, hoehe] of [
        [390, 844],
        [700, 800]
    ]) {
        test(`im Mobil-Layout ist Glied 0 besetzt: ${breite}x${hoehe}`, async ({ page }) => {
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page, { mobil: true });

            // Die Navigationsgruppen sind im Mobil-Kopf nicht sichtbar — der
            // Reiterwechsel laeuft deshalb ueber switchView(), wie in der App
            // selbst aus dem Mobil-Menue heraus.
            await page.evaluate(() => window.switchView('locations'));
            await page.waitForTimeout(400);
            await reiterUndRollen(page, 'locations', '#locations-list');

            const m = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
            console.log(`[U6] Mobil ${breite}x${hoehe}: ${JSON.stringify(m)}`);

            expect(m.layout, `${breite}px muessen das Mobil-Layout waehlen`).toBe('mobile');
            expect(m.bandHoehe, 'das Band muss stehen').toBeGreaterThan(0);
            // Die Zusicherung, die sticky-stapel.spec.js nicht leisten kann:
            // drei Glieder abgeraeumt, Glied 0 besetzt.
            expect(
                m.rahmen,
                `--view-frame-height darf im Mobil-Layout nicht leer sein (Ueberhang ${m.ueberhang}px)`
            ).not.toBe('(keins)');
            expect(
                m.ueberhang,
                `Seitenueberhang ${m.ueberhang}px (Rahmen ${m.rahmen}, Band ${m.bandHoehe}px)`
            ).toBe(0);
            expect(m.suchfeld, `Suchfeld ${m.suchfeld}`).toBe('frei');
            expect(m.anzahl, 'die Liste muss gefuellt sein').toBe(ANZAHL);
        });
    }
});

/* ====================================================================
   DIE FUENFTE SCHALE IN IHREN BEIDEN SCHMALFASSUNGEN.
   ====================================================================
   Das Bestiar ist die einzige der fuenf Schalen, die ihr Hoehenbudget unter
   900px und im Mobil-Layout wieder aufgab: `height: auto; overflow: visible`
   in zwei Fassungen (bestiary.css, `@media (max-width: 900px)` und
   `[data-layout="mobile"]`). Die Zeilen sind aelter als das Budget — sie
   stehen wortgleich schon zu fef3afb —, aber sie reproduzieren genau das
   Symptom, gegen das das Budget angetreten ist, und zwar in der schlimmsten
   Form: NICHT eine teilweise verdeckte Werkzeugleiste, sondern eine, die
   vollstaendig aus dem Fenster scrollt.

   GEMESSEN am Buendel zu c14a968 (Bestiar, erstes Monster gewaehlt, per
   Mausrad bis zum Anschlag; 901px als Gegenprobe EINEN Bildpunkt oberhalb der
   Schmalfassung):

     Fenster    Ueberhang  Werkzeugleiste   elementFromPoint aufs Suchfeld
     --------   ---------  --------------   ------------------------------
     901x700          0    229..303         INPUT.toolbar-search
     900x700        697    -474..-400       nichts
     900x900        497    -274..-200       nichts
     768x800        650    -529..-455       nichts
     390x844        766    -549..-475       nichts

   Ohne gewaehltes Monster ist derselbe Zustand milder, aber nicht heil:
   900x700 Ueberhang 206px (mit Band) / 145px (ohne), Kopfzeile deckt die
   Werkzeugleiste 30px / 74px, Suchfeld antwortet mit DIV.app-header-top.

   DIE KORREKTUR nimmt der Schmalfassung nicht das gewollte Verhalten (das
   Detail steht dort UNTER der Liste, siehe den Kommentar an der
   Detail-Panel-Regel in core.css — das bleibt), sondern nur den Ort der
   Scrollkante: sie wandert von der Seite in das Raster. Die Schale behaelt
   das gemessene Budget, `.bestiary-layout` scrollt selbst, und seine Zeilen
   gehen von `minmax(0, 1fr)` auf `auto` — sonst bekaeme der Master nur den
   Rest, den der 646px hohe Statblock uebriglaesst (gemessen 32px).

   NICHT Gegenstand dieses Falls: bei 600px und darunter ueberlaeuft das
   Suchfeld die verdrahtete `height: 74px` der `.section-toolbar`
   (editors.css:528) um 52-55px, weil die Leiste ab 900px umbricht. Das trifft
   vier der fuenf Ansichten gleichermassen, steht mit und ohne diese Korrektur
   gleich da und ist ein eigener Befund. Deshalb messen die Faelle unten bei
   900 und 768px, wo der Treffer nicht davon ueberlagert wird. */
test.describe('Hoehenbudget der fuenften Schale: Bestiar schmal (U6)', () => {
    for (const [breite, hoehe] of [
        [900, 700],
        [900, 900],
        [768, 800]
    ]) {
        const mobil = breite <= 768;
        test(`die Werkzeugleiste bleibt im Fenster: ${breite}x${hoehe}`, async ({ page }) => {
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page, { mobil });

            await page.evaluate(() => window.switchView('bestiary'));
            await page.waitForTimeout(700);
            // Mit gewaehltem Monster: erst der Statblock macht den Inhalt so
            // hoch, dass die Leiste ganz aus dem Fenster faehrt.
            await page.evaluate(() => {
                const erster = document.querySelector('#bestiary-list .bestiary-list-item');
                if (erster) erster.click();
            });
            await page.waitForTimeout(500);

            const vorher = await page.evaluate(() => ({
                posten: document.querySelectorAll('#bestiary-list .bestiary-list-item').length,
                detail: Math.round(
                    document.querySelector('.bestiary-detail').getBoundingClientRect().height
                )
            }));
            // Das Bestiar bringt seine Liste selbst mit (SRD, gemessen 13
            // Eintraege bei leeren Filtern) — hier wird nichts gesaet. Den
            // Ueberhang treibt ohnehin der Statblock, nicht die Liste.
            expect(vorher.posten, 'das Bestiar muss Eintraege fuehren').toBeGreaterThan(10);
            expect(vorher.detail, 'der Statblock muss Hoehe haben').toBeGreaterThan(200);

            await reiterUndRollen(page, 'bestiary', '#bestiary-list');
            const m = await page.evaluate(messeBudget, ['#bestiary-search', '#bestiary-list']);
            const leiste = await page.evaluate(() => {
                const l = document.querySelector('.bestiary-view.active .section-toolbar');
                const r = l.getBoundingClientRect();
                return { oben: Math.round(r.top), unten: Math.round(r.bottom) };
            });
            console.log(
                `[U6] Bestiar ${breite}x${hoehe}: Leiste ${leiste.oben}..${leiste.unten}, ${JSON.stringify(m)}`
            );

            expect(
                m.ueberhang,
                `Seitenueberhang ${m.ueberhang}px (Rahmen ${m.rahmen}, Leiste ${leiste.oben}..${leiste.unten})`
            ).toBe(0);
            expect(
                leiste.oben,
                `die Werkzeugleiste darf nicht ueber den Fensterrand fahren (${leiste.oben}..${leiste.unten})`
            ).toBeGreaterThanOrEqual(0);
            expect(
                m.suchfeld,
                `Suchfeld ${m.suchfeld} (Leiste ${leiste.oben}..${leiste.unten})`
            ).toBe('frei');
            expect(
                m.kopfDecktLeiste,
                `Kopfzeile deckt die Werkzeugleiste um ${m.kopfDecktLeiste}px`
            ).toBe(0);
        });
    }

    test('die Gegenprobe einen Bildpunkt oberhalb der Schmalfassung: 901x700', async ({ page }) => {
        // Beweist, dass die Faelle oben die Schmalfassung treffen und nicht
        // irgendeinen allgemeinen Zustand: bei 901px gilt die Regel nicht, und
        // dort war schon vor der Korrektur alles heil.
        await page.setViewportSize({ width: 901, height: 700 });
        await appLaden(page);
        await page.evaluate(() => window.switchView('bestiary'));
        await page.waitForTimeout(700);
        await page.evaluate(() => {
            const erster = document.querySelector('#bestiary-list .bestiary-list-item');
            if (erster) erster.click();
        });
        await page.waitForTimeout(500);
        await reiterUndRollen(page, 'bestiary', '#bestiary-list');
        const m = await page.evaluate(messeBudget, ['#bestiary-search', '#bestiary-list']);
        console.log(`[U6] Bestiar 901x700 (Gegenprobe): ${JSON.stringify(m)}`);
        expect(m.ueberhang, `Seitenueberhang ${m.ueberhang}px`).toBe(0);
        expect(m.suchfeld, `Suchfeld ${m.suchfeld}`).toBe('frei');
    });
});
