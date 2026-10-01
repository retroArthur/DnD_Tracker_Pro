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
 * @param {import('@playwright/test').Page} page
 */
async function appLaden(page) {
    await page.addInitScript(saat => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(saat));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, SAAT);
    await page.goto(APP_URL);
    await waitForAppReady(page);
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
        bandHoehe: band ? Math.round(band.getBoundingClientRect().height) : 0,
        rahmen: getComputedStyle(de).getPropertyValue('--view-frame-height').trim() || '(keins)',
        kopfDecktLeiste: ue(
            kopf ? kopf.getBoundingClientRect() : null,
            leiste ? leiste.getBoundingClientRect() : null
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
});
