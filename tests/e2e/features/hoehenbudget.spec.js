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
 * `opts.saatZusatz` legt weitere Felder in die Saat — gebraucht fuer die
 * Initiative, die als EINZIGE Buehne dieser Datei wirklich scrollt.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{weitere?: Record<string,string>, mobil?: boolean, saatZusatz?: object}} [opts]
 */
async function appLaden(page, opts) {
    const o = opts || {};
    await page.addInitScript(
        arg => {
            try {
                localStorage.setItem(
                    'dnd-tracker-v4',
                    JSON.stringify(Object.assign({}, arg.saat, arg.zusatz))
                );
                for (const schluessel of Object.keys(arg.weitere)) {
                    localStorage.setItem(schluessel, arg.weitere[schluessel]);
                }
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        { saat: SAAT, weitere: o.weitere || {}, zusatz: o.saatZusatz || {} }
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
 *
 * `sel[2]` ist ein optionaler Waehler fuer die EINTRAEGE. Ohne ihn gelten die
 * direkten Kinder des Listencontainers als Eintraege — das trifft fuer die vier
 * gesaeten Listen zu, NICHT fuer das Bestiar: `#bestiary-list` fuehrt genau EIN
 * Kind (die Huelle des VirtualScroll; gemessen `children.length === 1` in allen
 * 16 Matrix-Zustaenden), und das deckt die ganze Liste ab. Ohne eigenen Waehler
 * maesse die vierte Zusicherung diese Huelle statt den letzten Eintrag und waere
 * damit immer gruen — eine Zusicherung, die nichts prueft.
 *
 * @param {string[]} sel [Suchfeld, Liste, Eintraege?]
 */
function messeBudget(sel) {
    const suchSel = sel[0];
    const listenSel = sel[1];
    const postenSel = sel[2];
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
    const posten = postenSel
        ? Array.from(document.querySelectorAll(postenSel))
        : Array.from(document.querySelector(listenSel).children);
    const letzter = posten[posten.length - 1];
    // Ohne Eintraege gab es hier einen Fehlschlag aus dem Browser heraus, dessen
    // Meldung nichts sagte. Die leere Liste ist ein BEFUND, kein Absturz: sie
    // faellt ueber `anzahl` auf, und die Geometrie meldet sich als unbekannt.
    const lr = letzter ? letzter.getBoundingClientRect() : null;
    const imFenster = !!lr && lr.top < window.innerHeight && lr.bottom > 0 && lr.height > 0;
    const px = lr ? Math.round(lr.left + Math.min(lr.width, window.innerWidth - lr.left) / 2) : 0;
    const py = lr ? Math.round(Math.min(lr.bottom, window.innerHeight - 1)) - 4 : 0;
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
        letzterOben: lr ? Math.round(lr.top) : null,
        letzterUnten: lr ? Math.round(lr.bottom) : null,
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
       DER FENSTERWECHSEL NACH dem Laden — die veraltete Gegenrechnung.
       ================================================================
       Die Hoehe der beiden festen Baender wurde bisher GENAU EINMAL gemessen,
       bei ihrer Erzeugung (`showMigrationHintBanner()` /
       `showDivergenceBanner()` in systems/migration/migration-wizard.js), und in
       `--migration-hint-height` bzw. `--divergence-banner-height` abgelegt. Die
       Hoehe haengt aber an der Fensterbreite: das Hinweisband bricht um.

       Gemessen am Buendel zu 6b275e1, Orte, Band steht, KEIN Scrollen, das
       Fenster erst NACH dem Laden verkleinert:

         1440x800 -> 390x844   Band 61 -> 157px, Token bleibt 61px,
                               body padding-top bleibt 61px,
                               Glied 1 folgt korrekt auf 157px
                               -> Kopfzeile 157..391, Werkzeugleiste 305..379
                               -> kopfDecktLeiste 74 von 74px
         1440x800 -> 500x800   Band 61 -> 80px   -> kopfDecktLeiste  9px
         1920x900 -> 700x700   Band 61 -> 61px (kein Umbruch) -> 0px

       Die Werkzeugleiste liegt bei 390px also VOLLSTAENDIG hinter der
       angehefteten Kopfzeile, und zwar UNGESCROLLT, wo weder ein Scrollweg noch
       ein Anheft-Versatz etwas daran aendern kann. Ursache nachgewiesen: setzt
       man im selben Zustand `--migration-hint-height` auf die Isthoehe und laesst
       updateStickyOffsets() erneut laufen, geht der body-Innenabstand auf 157px,
       der Rahmen von 315 auf 411px und kopfDecktLeiste von 74 auf 0.

       Weil das Hoehenbudget (Glied 0) denselben body-Innenabstand MITLIEST, war
       mit der Gegenrechnung auch das Budget falsch — deshalb gehoert dieser Fall
       hierher und nicht in sticky-stapel.spec.js.

       Die 128 Zustaende der uebrigen Faelle konnten das nicht sehen: sie setzen
       das Fenster alle VOR dem Laden, und dann ist die Einmal-Messung richtig.
       Der DM trifft es beim Andocken des Laptops oder beim Teilen des Fensters.

       Das Divergenz-Band haengt an derselben Einmal-Messung, kann aber nicht
       umbrechen (`height: 40px` + `white-space: nowrap` + Ellipse,
       migration.css) — nachgemessen 40px bei 1440, 520 und 390px Breite. Die
       Korrektur fasst es symmetrisch mit; die Faelle unten messen das Band, das
       sich wirklich bewegt.

       UMBRUCHERWARTUNG GEAENDERT MIT M2c (2026-10): der Fall 1440x800 -> 500x800
       stand hier mit `true`, weil das Band bei 500px Breite auf 80px umbrach.
       Seit der Hinweis unter 600px Breite kurz gefasst wird (migration.css), ist
       er dort ein 61px-Einzeiler — der Umbruch, den dieser Fall als VORBEDINGUNG
       verlangte, findet nicht mehr statt. Das ist eine Verhaltensaenderung, nicht
       ein Fehlschlag: die drei Zusicherungen (a)(b)(c) des Falls bleiben
       unveraendert und gelten weiter. Damit die Vorbedingung "Band bricht wirklich
       um" nicht an einem einzigen Fenster haengt, kommt 1440x800 -> 360x740 als
       vierter Fall hinzu (gemessen 61 -> 94px). */
    for (const [von, nach, umbruchErwartet] of [
        [[1440, 800], [390, 844], true],
        [[1440, 800], [360, 740], true],
        [[1440, 800], [500, 800], false],
        [[1920, 900], [700, 700], false]
    ]) {
        test(`ein Fensterwechsel nach dem Laden laesst die Gegenrechnung nicht veralten: ${von.join('x')} -> ${nach.join('x')}`, async ({
            page
        }) => {
            await page.setViewportSize({ width: von[0], height: von[1] });
            await appLaden(page);
            await page.evaluate(() => window.switchView('locations'));
            await page.waitForTimeout(400);

            const vorher = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
            expect(vorher.bandHoehe, 'der Fall beginnt mit stehendem Band').toBeGreaterThan(0);
            expect(
                vorher.kopfDecktLeiste,
                `vor dem Wechsel muss alles heil sein (${vorher.kopfDecktLeiste}px)`
            ).toBe(0);

            // Der Wechsel. core/init.js haengt updateStickyOffsets() entprellt
            // (200ms) am resize-Ereignis — die Wartezeit liegt darueber.
            await page.setViewportSize({ width: nach[0], height: nach[1] });
            await page.waitForTimeout(1200);

            const m = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
            console.log(
                `[U6] Wechsel ${von.join('x')} -> ${nach.join('x')}: vorher Band ${vorher.bandHoehe}px / ${vorher.koerperOben}, nachher ${JSON.stringify(m)}`
            );

            if (umbruchErwartet) {
                expect(
                    m.bandHoehe,
                    `das Band muss im schmaleren Fenster umbrechen (vorher ${vorher.bandHoehe}px, jetzt ${m.bandHoehe}px) — sonst misst dieser Fall nichts`
                ).toBeGreaterThan(vorher.bandHoehe);
            }

            // (a) Die Gegenrechnung am Seiteninhalt muss der Isthoehe folgen.
            expect(
                m.koerperOben,
                `der body-Innenabstand muss die neue Bandhoehe tragen (${m.koerperOben} bei ${m.bandHoehe}px Band)`
            ).toBe(`${m.bandHoehe}px`);

            // (b) Damit bleibt die Werkzeugleiste vor der Kopfzeile frei.
            expect(
                m.kopfDecktLeiste,
                `die Kopfzeile deckt die Werkzeugleiste um ${m.kopfDecktLeiste}px (Band ${m.bandHoehe}px, Innenabstand ${m.koerperOben}, Rahmen ${m.rahmen})`
            ).toBe(0);

            // (c) Und das Hoehenbudget, das denselben Innenabstand mitliest.
            expect(m.ueberhang, `Seitenueberhang ${m.ueberhang}px (Rahmen ${m.rahmen})`).toBe(0);
        });
    }

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
            // Das Bestiar bringt seine Liste selbst mit (SRD) — hier wird
            // nichts gesaet. Auf die ANZAHL der Eintraege wird bewusst nicht
            // gezielt: die Liste rendert nur ihr sichtbares Fenster, und das
            // haengt an genau der Schalenhoehe, die hier geprueft wird
            // (gemessen 13 Eintraege vor, 8 nach der Korrektur). Den Ueberhang
            // treibt ohnehin der Statblock, nicht die Liste.
            expect(vorher.posten, 'das Bestiar muss Eintraege fuehren').toBeGreaterThan(0);
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

/* ====================================================================
   DIE WERKZEUGLEISTE BEI TELEFONBREITE — das Suchfeld faellt heraus.
   ====================================================================
   Der zweite, von U6 unabhaengige Befund derselben Messreihe. `.section-toolbar`
   fuehrt eine verdrahtete `height: 74px` (editors.css), waehrend dieselbe Leiste
   ab `@media (max-width: 900px)` auf `flex-wrap: wrap` geht und das Suchfeld in
   eine zweite Zeile schickt (`flex: 1 1 100%`, `order: 3`). Die Zeile wird
   umgebrochen, die Hoehe nicht nachgezogen — das Feld ragt unter die Leiste und
   liegt dort hinter dem Inhalt, der darunter beginnt.

   GEMESSEN am Buendel zu 6b275e1 (alle fuenf Ansichten, echter Mausklick auf die
   Feldmitte und anschliessendes Tippen):

     Breite  Ansicht     Ueberlauf  elementFromPoint        echter Klick
     ------  ----------  ---------  ----------------------  ------------
     390     Orte          +55px    frei (Leerraum)         tippt
     390     NSCs          +55px    frei (Leerraum)         tippt
     390     Truhe        -199px    frei                    tippt
     390     Begegnungen   +55px    SPAN.card-title         VERSCHLUCKT
     390     Bestiar       +52px    DIV.bestiary-list-item  VERSCHLUCKT
     540/600 dasselbe Bild (+55/+52px, zwei verschluckte Klicks)
     680/768 Ueberlauf +27px, alle fuenf tippen noch

   Die Truhe ist heil, weil loot.css die fehlende Zeile schon lokal fuehrt
   (`.loot-view .section-toolbar { height: auto; min-height: 74px }`) — gegen
   ueberlaufende Filter-Chips, aus demselben Grund. Orte und NSCs tippen nur
   deshalb, weil ihr Feld zufaellig auf Leerraum faellt; der Ueberlauf ist
   derselbe, und ein etwas laengerer Listeneintrag verschiebt sie in dieselbe
   Lage wie Begegnungen.

   VORBESTEHEND, nicht von U6 verursacht: mit wieder eingeschaltetem altem
   Bestiar-CSS steht bei 390x844 derselbe Befund (verdeckt von
   DIV.bestiary-list-item, Klick verschluckt).

   DIE KORREKTUR zieht die Zeile der Truhe in die Media-Query, wo der Umbruch
   herkommt — eine Leiste, die umbrechen darf, kann keine feste Hoehe haben.
   `min-height: 74px` haelt den ungebrochenen Fall unveraendert.

   680 und 768px sind bewusst NICHT eigene Faelle: dort ist der Ueberlauf mit
   27px kleiner, aber vorhanden. Die Faelle unten messen bei 390/540/600, wo er
   die Bedienbarkeit wirklich kostet; die Zusicherung `ueberlauf <= 0` deckt die
   breiteren Umbruchlagen der Sache nach mit ab. */
test.describe('Werkzeugleiste bei Telefonbreite: das Suchfeld bleibt drin', () => {
    /** Die fuenf Ansichten MIT dem Bestiar — es traegt einen der beiden Treffer. */
    const FUENF = [
        ['locations', '#loc-search'],
        ['npcs', '#npc-search'],
        ['loot', '#loot-search'],
        ['encounter', '#enc-search'],
        ['bestiary', '#bestiary-search']
    ];

    /** Geometrie und Treffertest am Suchfeld. Laeuft IM Browser. */
    function messeLeiste(sel) {
        const such = document.querySelector(sel);
        if (!such) return { fehlt: true };
        const leiste = such.closest('.section-toolbar');
        const lr = leiste.getBoundingClientRect();
        const sr = such.getBoundingClientRect();
        const e = document.elementFromPoint(sr.left + sr.width / 2, sr.top + sr.height / 2);
        return {
            leiste: Math.round(lr.top) + '..' + Math.round(lr.bottom),
            leisteHoehe: Math.round(lr.height),
            feld: Math.round(sr.top) + '..' + Math.round(sr.bottom),
            ueberlauf: Math.round(sr.bottom - lr.bottom),
            treffer: !e
                ? 'nichts'
                : e === such || such.contains(e)
                  ? 'frei'
                  : 'verdeckt von ' + e.tagName + '.' + String(e.className).split(' ')[0],
            mitte: [Math.round(sr.left + sr.width / 2), Math.round(sr.top + sr.height / 2)]
        };
    }

    /** Raeumt das Suchfeld wieder leer und meldet, ob der Klick angekommen ist. */
    function pruefeTippen(sel) {
        const x = document.querySelector(sel);
        const ok = x === document.activeElement && x.value === 'Dra';
        if (x.value) {
            x.value = '';
            x.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return ok
            ? 'tippt'
            : 'verschluckt (aktiv=' +
                  document.activeElement.tagName +
                  '.' +
                  String(document.activeElement.className).split(' ')[0] +
                  ')';
    }

    for (const [breite, hoehe] of [
        [390, 844],
        [540, 800],
        [600, 800]
    ]) {
        test(`alle fuenf Ansichten: ${breite}x${hoehe}`, async ({ page }) => {
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page, { mobil: true });

            const befunde = [];
            for (const [reiter, suchSel] of FUENF) {
                await page.evaluate(n => window.switchView(n), reiter);
                await page.waitForTimeout(600);

                const g = await page.evaluate(messeLeiste, suchSel);
                expect(g.fehlt, `${reiter}: kein Suchfeld gefunden`).toBeFalsy();

                // Der echte Klick — eine Geometrie-Zusicherung allein wuerde nicht
                // belegen, dass der DM das Feld auch treffen kann.
                await page.mouse.click(g.mitte[0], g.mitte[1]);
                await page.keyboard.type('Dra');
                await page.waitForTimeout(200);
                const tipp = await page.evaluate(pruefeTippen, suchSel);

                console.log(
                    `[LEISTE] ${breite}x${hoehe} ${reiter}: Leiste ${g.leiste} (h${g.leisteHoehe}), Feld ${g.feld}, Ueberlauf ${g.ueberlauf}px -> ${g.treffer} | ${tipp}`
                );

                if (g.ueberlauf > 0) {
                    befunde.push(
                        `${reiter}: Feld ragt ${g.ueberlauf}px unter die Leiste (Leiste ${g.leiste}, Feld ${g.feld})`
                    );
                }
                if (g.treffer !== 'frei') befunde.push(`${reiter}: ${g.treffer}`);
                if (tipp !== 'tippt') befunde.push(`${reiter}: Klick ${tipp}`);
            }
            expect(befunde, befunde.join(' | ')).toEqual([]);
        });
    }

    test('die Gegenprobe oberhalb des Umbruchs: 1280x800 bleibt eine Zeile', async ({ page }) => {
        // Belegt, dass die Korrektur dem ungebrochenen Fall nichts nimmt: ueber
        // 900px gilt `flex-wrap: nowrap`, und `min-height: 74px` haelt die
        // gemessene Hoehe der vier Einzeiler bei genau 74px.
        await page.setViewportSize({ width: 1280, height: 800 });
        await appLaden(page);
        const hoehen = [];
        for (const [reiter, suchSel] of FUENF) {
            await page.evaluate(n => window.switchView(n), reiter);
            await page.waitForTimeout(500);
            const g = await page.evaluate(messeLeiste, suchSel);
            console.log(
                `[LEISTE] 1280x800 ${reiter}: Hoehe ${g.leisteHoehe}px, Ueberlauf ${g.ueberlauf}px`
            );
            hoehen.push(`${reiter}=${g.leisteHoehe}`);
            expect(g.ueberlauf, `${reiter}: Ueberlauf ${g.ueberlauf}px`).toBeLessThanOrEqual(0);
        }
        // Die Truhe fuehrt ihre Chips in mehreren Zeilen und ist deshalb hoeher —
        // sie hat die Zeile `height: auto` schon vor dieser Korrektur.
        expect(hoehen.join(' '), `gemessen: ${hoehen.join(' ')}`).toMatch(
            /^locations=74 npcs=74 loot=\d+ encounter=74 bestiary=74$/
        );
    });
});

/* ====================================================================
   DAS DIVERGENZ-BAND AUF EINER BUEHNE, DIE WIRKLICH SCROLLT.
   ====================================================================
   Die vier Faelle des Divergenz-Pfads oben in dieser Datei messen alle in den
   fuenf Listen-Schalen — und die koennen seit U6 nicht mehr scrollen
   (Seitenueberhang 0). Ein Anheft-Versatz ist dort folgenlos, und genau deshalb
   blieb EINE der vier Stellen, die der Kopfkommentar des Divergenz-Abschnitts
   als ungedeckt nennt, in Wahrheit weiter ungedeckt: das `max(bottom)` ueber
   BEIDE Baender in Glied 1 (`updateStickyOffsets()`,
   ui/editors/rich-text-insert.js).

   Nachgewiesen per Mutationsprobe am gebauten Buendel: nimmt man
   `document.querySelector('.divergence-banner')` aus dem Band-Feld heraus —
   also genau der Zustand vor der Korrektur —, bleiben hoehenbudget.spec.js
   (14/14) UND die volle Playwright-Suite zahlengleich gruen. Die Zeile traegt
   trotzdem; gemessen in der Initiative mit 10 Kombattanten, 1440x800, Band ueber
   seinen echten Einstieg aufgeschaltet, auf y=700 gescrollt:

     Zustand          Glied 1   bandDecktKopf  App-Titel                 globale Suche
     ---------------  --------  -------------  ------------------------  --------------------------------
     mit der Zeile      40px          0px      frei                      frei
     ohne die Zeile      0px         40px      verdeckt von STRONG.      verdeckt von SPAN.divergence-...

   In derselben Probe meldete die Orte-Ansicht in BEIDEN Zustaenden 0px — die
   Buehne entscheidet, nicht die Zusicherung. Deshalb steht dieser Abschnitt auf
   der Initiative; es ist dieselbe Buehne wie in sticky-stapel.spec.js, nur mit
   dem zweiten Band statt dem Hinweisband.

   Der zweite Fall nimmt den Rueckweg mit: der Handler
   `dismiss-divergence-banner` (systems/migration/migration-wizard.js) nimmt die
   Klasse mit dem Band zurueck. Kein Test hat diesen Pfad bisher angefasst —
   bliebe die Klasse stehen, hielte die Gegenrechnung die 40px eines nicht mehr
   vorhandenen Bands frei, und das Hoehenbudget waere um dieselben 40px zu klein.
*/
test.describe('Das Divergenz-Band auf der scrollenden Buehne (U3/U6)', () => {
    /** Zehn Kombattanten: genug Listenhoehe, damit die Seite ueberhaupt scrollt. */
    const KOMBATTANTEN = [
        'Danuel von Bruchstein',
        'Goblin Scharfschuetze',
        'Ork Anfuehrer Gorruk',
        'Lyra Sonnenschein',
        'Wolf Alpha',
        'Thorin Eisenfaust',
        'Banditenhauptmann',
        'Skelettkrieger',
        'Magierin Vex',
        'Riesenspinne'
    ].map((name, i) => ({
        id: i + 1,
        name,
        initiative: 24 - i,
        initBonus: 2,
        maxHp: 30,
        currentHp: 30,
        ac: 15,
        type: i % 3 === 0 ? 'player' : 'monster',
        effects: []
    }));

    const INITIATIVE_SAAT = {
        initiative: { combatants: KOMBATTANTEN, currentTurn: 0, round: 3, active: true }
    };
    const DIVERGENZ = {
        'migration-divergence-since': JSON.stringify({ date: '2026-08-15' })
    };

    test('gescrollt bleibt die Kopfzeile unter dem Divergenz-Band frei', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page, { weitere: DIVERGENZ, saatZusatz: INITIATIVE_SAAT });

        // Vorbedingung 1: der richtige Zweig, nicht das Hinweisband.
        const zweig = await page.evaluate(() => ({
            divergenz: !!document.querySelector('.divergence-banner'),
            hinweis: !!document.querySelector('.migration-hint-banner')
        }));
        expect(
            zweig,
            `startMigrationFileSide() muss den Divergenz-Zweig waehlen (${JSON.stringify(zweig)})`
        ).toEqual({ divergenz: true, hinweis: false });

        await page.evaluate(() => window.switchView('initiative'));
        await page.waitForTimeout(600);

        // Vorbedingung 2: diese Buehne MUSS scrollen — sonst misst der Fall nichts.
        const oben = await page.evaluate(messeBudget, ['#kein-suchfeld', '#init-list']);
        expect(
            oben.ueberhang,
            `die Initiative muss einen Scrollweg haben (Ueberhang ${oben.ueberhang}px, ${oben.anzahl} Kombattanten) — ohne ihn ist ein Anheft-Versatz folgenlos`
        ).toBeGreaterThan(100);
        expect(oben.bandKlasse, 'und das Divergenz-Band muss stehen').toBe('divergence-banner');

        await page.mouse.move(720, 500);
        for (let i = 0; i < 20; i++) await page.mouse.wheel(0, 400);
        await page.waitForTimeout(400);

        const m = await page.evaluate(messeBudget, ['#kein-suchfeld', '#init-list']);
        console.log(`[U6] Divergenz auf der Initiative, gescrollt: ${JSON.stringify(m)}`);

        // Vorbedingung 3: wirklich gescrollt.
        expect(m.scrollY, `es muss wirklich gescrollt worden sein (scrollY ${m.scrollY})`).toBe(
            oben.ueberhang
        );

        // Glied 1 traegt die Bandhoehe — das ist die ungedeckte Zeile.
        expect(
            m.bandDecktKopf,
            `das Band deckt die Kopfzeile um ${m.bandDecktKopf}px (Band ${m.bandHoehe}px)`
        ).toBe(0);
        expect(m.appTitel, `App-Titel ${m.appTitel}`).toBe('frei');
        expect(m.globaleSuche, `globale Suche ${m.globaleSuche}`).toBe('frei');
    });

    test('der Abschalt-Knopf nimmt die Gegenrechnung mit dem Band zurueck', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page, { weitere: DIVERGENZ, saatZusatz: INITIATIVE_SAAT });
        await page.evaluate(() => window.switchView('locations'));
        await page.waitForTimeout(400);

        const vor = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
        expect(vor.bandKlasse, 'der Fall beginnt mit stehendem Divergenz-Band').toBe(
            'divergence-banner'
        );
        expect(vor.klasseDivergenz, 'und gesetzter Gegenrechnung').toBe(true);
        expect(vor.koerperOben, `Innenabstand ${vor.koerperOben}`).toBe(`${vor.bandHoehe}px`);

        // Der echte Weg des Nutzers: der Knopf im Band.
        await page.locator('[data-action="dismiss-divergence-banner"]').click();
        await page.waitForTimeout(500);

        const nach = await page.evaluate(messeBudget, ['#loc-search', '#locations-list']);
        console.log(
            `[U6] Abschalt-Knopf: vorher Band ${vor.bandHoehe}px / ${vor.koerperOben} / Rahmen ${vor.rahmen}, nachher ${JSON.stringify(nach)}`
        );

        expect(nach.bandDa, 'das Band muss weg sein').toBe(false);
        expect(
            nach.klasseDivergenz,
            `body.has-divergence-banner muss MIT dem Band gehen (Innenabstand ${nach.koerperOben})`
        ).toBe(false);
        expect(nach.koerperOben, `der Innenabstand muss auf 0 zurueck (${nach.koerperOben})`).toBe(
            '0px'
        );
        // Und das Hoehenbudget gibt die Bandhoehe frei.
        expect(
            parseFloat(nach.rahmen),
            `der Rahmen muss um die Bandhoehe schrumpfen (vorher ${vor.rahmen}, jetzt ${nach.rahmen}, Band ${vor.bandHoehe}px)`
        ).toBe(parseFloat(vor.rahmen) - vor.bandHoehe);
        expect(nach.ueberhang, `Seitenueberhang ${nach.ueberhang}px`).toBe(0);
        expect(nach.suchfeld, `Suchfeld ${nach.suchfeld}`).toBe('frei');
    });
});

/* ====================================================================
   DIE MESSMATRIX IN DER SUITE (M3c).
   ====================================================================
   Bis M3c prueften die Faelle oben in dieser Datei ALLE bei 1440x800. Die
   Matrix, mit der die Korrektur ueberhaupt gefunden wurde, steckte nur in einem
   Messskript im Scratchpad: 4 Breiten (1920/1440/1280/900) x 2 Fensterhoehen
   (900/700) x mit/ohne Band x gescrollt/oben, Laufzeit rund 2 Minuten. Ein
   Nachweis, der nur im Arbeitsverzeichnis seines Autors liegt, ist kein
   Nachweis — die Luecke, die er geschlossen hat, kann morgen zurueckkommen,
   ohne dass etwas rot wird.

   Jenes Messskript fuhr VIER Ansichten und kam so auf 128 Zustaende; die erste
   Fassung dieser Matrix uebernahm die Zahl samt der Auslassung. Es sind FUENF
   Schalen — mit der fuenften sind es 160 Zustaende. Die Berichtigung steht
   unten bei der Achse "Ansichten"; bewacht wird sie seit Runde 1 von
   tests/unit/schalen-aktenlage.test.js, das den Zensus der Stilblaetter gegen
   diesen Kommentar haelt.

   WAS HIER LAEUFT: 80 der 160 Zustaende, als 8 Faelle zu je 10 Zustaenden
   (5 Ansichten x oben/gescrollt). Die Zuschnitt-Achsen einzeln:

     Breite    1280 und 900. GEMESSEN am Buendel zu fef3afb lagen 1920, 1440 und
               1280 in allen 96 ihrer Zustaende auf demselben Wert (96, weil die
               damalige Messung vier Ansichten fuhr) — Ueberhang
               14px ohne Band, 75px mit Band; 900 war der abweichende Fall
               (52px / 113px) und zugleich der schlimmste. 1280 ist die untere
               Kante dieses Plateaus, 900 der Ausreisser.
               WEGGELASSEN: 1920 und 1440. 1440 pruefen die fuenf Faelle oben in
               dieser Datei ohnehin, bei beiden Bandzustaenden. 1920 ist der
               dritte Messpunkt desselben Plateaus und haette in allen 32 seiner
               Zustaende dasselbe gemeldet wie 1280 — fuer ein Viertel der
               Laufzeit. Das Budget haengt per Konstruktion an einer MESSUNG und
               nicht an einer Breakpoint-Grenze; eine dritte Probe auf derselben
               Flaeche kann deshalb nichts Neues zeigen.

     Hoehe     900 UND 700, beide behalten. 700 ist der enge Fall: mit stehendem
               Band beginnt die Schale dort erst bei 195px, und genau dort lag
               der Radpunkt der urspruenglichen Messung auf der Werkzeugleiste
               statt auf der Liste (siehe reiterUndRollen()). 900 ist der
               geraeumige Gegenpol.

     Band      mit UND ohne, beide behalten. Das Band ist der Normalfall am
               Spieltisch und der groessere Teil des Fehlers (75-113px); "ohne"
               ist der kleinere, aeltere Teil desselben Fehlers (14-52px). Eine
               der beiden Haelften zu streichen hiesse, die halbe Korrektur
               unbewacht zu lassen.

     Scrollen  oben UND gescrollt, beide behalten. Ungescrollt belegt die
               Gegenrechnung des Bands am Seiteninhalt, gescrollt die
               Anheft-Versatzkette. Es sind zwei verschiedene Mechanismen.

     Ansichten alle fuenf, NICHTS weggelassen. Die Schalen tragen FUENF
               unabhaengige
               `height: calc(100vh - var(--view-frame-height, ..))`-Deklarationen
               in vier Stilblaettern (bestiary.css:25, core.css:2276,
               encounters.css:932, npcs.css:10, npcs.css:439); eine davon
               weglassen heisst, eine davon ungeprueft lassen.
               BERICHTIGUNG (Runde 1): hier stand "alle vier ... VIER
               Deklarationen in drei Stilblaettern" und die Bestiar-Schale lief
               nicht mit. Das war der schlimmere der beiden Fehler: nicht die
               Luecke, sondern dass der Kommentar sie als Vollstaendigkeit
               auswies — eine so ausgewiesene Luecke sucht niemand. Gezaehlt
               wird der Zensus jetzt maschinell gegen diesen Kommentar
               (tests/unit/schalen-aktenlage.test.js), damit eine sechste Schale
               nicht wieder lautlos danebensteht.

   Gemessen werden je Zustand dieselben vier Groessen wie im Messskript:
   Seitenueberhang, Treffer auf das Suchfeld der Werkzeugleiste, Freiheit der
   Kopfzeile (App-Titel und globale Suche) und Erreichbarkeit des letzten
   Eintrags. Die vierte wird nur im GESCROLLTEN Zustand verlangt, aus einem
   gemessenen Grund — Begruendung an befundeAus(). Jeder Fall sammelt ALLE seine
   Befunde und meldet sie zusammen; ein Fall, der beim ersten Befund abbricht,
   verschweigt die anderen neun Zustaende.

   DIE FUENFTE SCHALE FAEHRT ANDERS, und das ist kein Schoenheitsfehler: das
   Bestiar bringt seine Liste selbst mit (SRD) und rendert sie hinter einer
   VirtualScroll-Huelle. `#bestiary-list` fuehrt deshalb genau EIN Kind, und die
   Zahl der gerenderten Eintraege haengt an derselben Schalenhoehe, die hier
   geprueft wird (gemessen 7 bis 18 ueber die 16 Zustaende). Beides steht in
   MATRIX_ANSICHTEN: ein eigener Eintrags-Waehler und "mindestens einer" statt
   der festen 24. Die drei allgemeinen Zusicherungen gelten unverkuerzt.

   Und weil eine Probe, die nie rot war, nichts beweist: der letzte Fall dieses
   Abschnitts zwingt das Token auf die alte verdrahtete 120px zurueck und
   verlangt, dass die Matrix genau dann Befunde meldet. */
const MATRIX_BREITEN = [1280, 900];
const MATRIX_HOEHEN = [900, 700];

/**
 * Die fuenf Schalen, wie die Matrix sie faehrt: Reiter, Suchfeld, Liste,
 * Eintrags-Waehler (null = die Kinder der Liste), erwartete Zahl der Eintraege
 * (null = mindestens einer).
 *
 * Eine EIGENE Liste neben ANSICHTEN, kein Umbau von ANSICHTEN: die vier
 * gesaeten Faelle oben in dieser Datei verlangen `anzahl === ANZAHL` (24), und
 * das kann das Bestiar nicht halten — es saet nichts, sondern bringt die
 * SRD-Liste mit und rendert nur deren sichtbares Fenster. Die vier Zeilen
 * kommen deshalb per Spread aus ANSICHTEN und koennen nicht auseinanderlaufen;
 * die fuenfte ist der Zusatz.
 */
const MATRIX_ANSICHTEN = [
    ...ANSICHTEN.map(([reiter, , suchSel, listenSel]) => ({
        reiter,
        suchSel,
        listenSel,
        postenSel: null,
        erwartet: ANZAHL
    })),
    {
        reiter: 'bestiary',
        suchSel: '#bestiary-search',
        listenSel: '#bestiary-list',
        postenSel: '#bestiary-list .bestiary-list-item',
        erwartet: null
    }
];

/**
 * Faehrt eine Ansicht an und stellt den gewuenschten Scrollzustand her.
 * @param {import('@playwright/test').Page} page
 * @param {string} reiter
 * @param {string} listenSel
 * @param {boolean} gescrollt
 */
async function zustandHerstellen(page, reiter, listenSel, gescrollt) {
    if (gescrollt) {
        await reiterUndRollen(page, reiter, listenSel);
        return;
    }
    await page.evaluate(n => window.switchView(n), reiter);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
}

/**
 * Prueft eine Messung gegen die vier Zusicherungen und liefert die Befunde.
 *
 * `letzterPruefen` schaltet die VIERTE Zusicherung (Erreichbarkeit des letzten
 * Eintrags) zu — sie gilt NUR im gescrollten Zustand. Das ist beim ersten Lauf
 * dieser Matrix gemessen worden, nicht vorher gewusst: ungescrollt meldete sie
 * in allen 8 Faellen je 4 Befunde (z.B. "1280x900 MIT Band oben locations:
 * letzter Eintrag 2148..2222px AUSSERHALB NICHT-KLICKBAR", einen je Ansicht) —
 * und das ist richtig so. Am Listenanfang liegt der letzte Eintrag legitim unter
 * der Falz; ihn dort zu verlangen hiesse zu verlangen, dass die ganze Liste in
 * die Schale passt, und das verspricht das Hoehenbudget nicht. Versprochen ist,
 * dass die Liste SELBST scrollt und ihr Ende erreichbar BLEIBT — genau das misst
 * der gescrollte Zustand. Die drei anderen Zusicherungen (Ueberhang,
 * Werkzeugleiste, Kopfzeile) gelten in beiden Zustaenden und waren im selben
 * Lauf in beiden gruen. Das Bestiar verhaelt sich darin wie die vier anderen:
 * ungescrollt liegt sein letzter gerenderter Eintrag in 12 von 16 Zustaenden
 * unter der Falz, gescrollt in allen 16 im Fenster und anklickbar.
 *
 * `erwartet` ist die Zahl der Eintraege, die gerendert sein MUSS — oder null fuer
 * "mindestens einer". Null gilt fuer das Bestiar: es rendert nur das sichtbare
 * Fenster seiner SRD-Liste, und dessen Groesse haengt an genau der Schalenhoehe,
 * die hier geprueft wird (gemessen 7 bis 18). Auf eine feste Zahl zu zielen
 * hiesse, die Probe an eine Nebenwirkung des Geprueften zu binden.
 *
 * @param {string} marke
 * @param {any} m Ergebnis von messeBudget()
 * @param {boolean} [letzterPruefen] Erreichbarkeit des letzten Eintrags mitpruefen
 * @param {number|null} [erwartet] Soll-Zahl der Eintraege, null = mindestens einer
 * @returns {string[]}
 */
function befundeAus(marke, m, letzterPruefen = true, erwartet = ANZAHL) {
    const befunde = [];
    if (erwartet === null) {
        if (m.anzahl < 1) befunde.push(`${marke}: kein Eintrag gerendert`);
    } else if (m.anzahl !== erwartet) {
        befunde.push(`${marke}: ${m.anzahl} statt ${erwartet} Eintraege gerendert`);
    }
    if (m.ueberhang !== 0) {
        befunde.push(`${marke}: Seitenueberhang ${m.ueberhang}px (Rahmen ${m.rahmen})`);
    }
    if (m.suchfeld !== 'frei') {
        befunde.push(
            `${marke}: Suchfeld ${m.suchfeld} (Kopfzeile deckt die Leiste um ${m.kopfDecktLeiste}px)`
        );
    }
    if (m.appTitel !== 'frei') befunde.push(`${marke}: App-Titel ${m.appTitel}`);
    if (m.globaleSuche !== 'frei') befunde.push(`${marke}: globale Suche ${m.globaleSuche}`);
    if (letzterPruefen && (!m.letzterImFenster || !m.letzterKlickbar)) {
        befunde.push(
            `${marke}: letzter Eintrag ${m.letzterOben}..${m.letzterUnten}px` +
                `${m.letzterImFenster ? '' : ' AUSSERHALB'}` +
                `${m.letzterKlickbar ? '' : ' NICHT-KLICKBAR'}`
        );
    }
    return befunde;
}

test.describe('Die Messmatrix des Hoehenbudgets (M3c)', () => {
    for (const hoehe of MATRIX_HOEHEN) {
        for (const breite of MATRIX_BREITEN) {
            for (const mitBand of [true, false]) {
                test(`${breite}x${hoehe} ${mitBand ? 'mit' : 'ohne'} Band — fuenf Ansichten, oben und gescrollt`, async ({
                    page
                }) => {
                    // Zehn Zustaende mit je 40 Radrunden: die 30s-Grenze der
                    // Konfiguration traegt das nicht.
                    test.setTimeout(150000);
                    await page.setViewportSize({ width: breite, height: hoehe });
                    await appLaden(page);

                    // Vorbedingung: das Band muss erst stehen — auch fuer die
                    // "ohne"-Haelfte, die es gleich ueber seinen eigenen Knopf schliesst.
                    expect(
                        await page.evaluate(
                            () => !!document.querySelector('.migration-hint-banner')
                        ),
                        'das Umzugs-Band muss zu Beginn stehen'
                    ).toBe(true);
                    if (!mitBand) await bandSchliessen(page);
                    expect(
                        await page.evaluate(
                            () => !!document.querySelector('.migration-hint-banner')
                        ),
                        `Bandzustand ${mitBand ? 'MIT' : 'ohne'} Band nicht hergestellt`
                    ).toBe(mitBand);

                    const befunde = [];
                    const protokoll = [];
                    for (const a of MATRIX_ANSICHTEN) {
                        for (const gescrollt of [false, true]) {
                            await zustandHerstellen(page, a.reiter, a.listenSel, gescrollt);
                            const m = await page.evaluate(messeBudget, [
                                a.suchSel,
                                a.listenSel,
                                a.postenSel
                            ]);
                            const marke =
                                `${breite}x${hoehe} ${mitBand ? 'MIT Band ' : 'ohne Band'} ` +
                                `${gescrollt ? 'gescrollt' : 'oben'} ${a.reiter}`;
                            protokoll.push(
                                `${marke} | Ueberhang ${m.ueberhang}px | Rahmen ${m.rahmen} | ` +
                                    `Band ${m.bandHoehe}px | KopfDecktLeiste ${m.kopfDecktLeiste}px | ` +
                                    `Suchfeld ${m.suchfeld} | letzter(${m.anzahl}) ` +
                                    `${m.letzterOben}..${m.letzterUnten}`
                            );
                            befunde.push(...befundeAus(marke, m, gescrollt, a.erwartet));
                        }
                    }
                    console.log(`[M3c]\n${protokoll.join('\n')}`);
                    expect(
                        befunde,
                        `${befunde.length} Befund(e) in ${MATRIX_ANSICHTEN.length * 2} ` +
                            `Zustaenden:\n${befunde.join('\n')}`
                    ).toEqual([]);
                });
            }
        }
    }

    test('Gegenprobe: mit der alten verdrahteten 120px meldet die Matrix den Befund', async ({
        page
    }) => {
        // Der rote Nachweis fuer die Matrix selbst. Ohne ihn waere sie eine Probe,
        // die seit ihrer Geburt gruen ist und von der niemand weiss, ob sie
        // ueberhaupt etwas messen kann. Gefahren wird die schlimmste Ecke der
        // Matrix — die KLEINSTE Breite und die KLEINSTE Hoehe ihrer eigenen
        // Achsen, mit Band, gescrollt. Die Zahlen kommen aus MATRIX_BREITEN und
        // MATRIX_HOEHEN statt verdrahtet zu sein: wird der Zuschnitt enger
        // gezogen, wandert die Gegenprobe mit.
        //
        // Das Token wird per Stilblatt mit `!important` ueberschrieben, nicht per
        // Inline-Stil: `setzeRahmenHoehe()` schreibt bei jedem Lauf der Kette
        // einen neuen Inline-Wert, ein Inline-Zwang waere also beim naechsten
        // resize weg. Das `!important` eines Stilblatts schlaegt den
        // nicht-wichtigen Inline-Wert dauerhaft. Es faellt NICHT in die
        // !important-Ratsche: die zaehlt die Quelldateien unter assets/styles/.
        test.setTimeout(60000);
        const breite = Math.min(...MATRIX_BREITEN);
        const hoehe = Math.min(...MATRIX_HOEHEN);
        await page.setViewportSize({ width: breite, height: hoehe });
        await appLaden(page);

        const a = MATRIX_ANSICHTEN[0];
        const sel = [a.suchSel, a.listenSel, a.postenSel];
        await zustandHerstellen(page, a.reiter, a.listenSel, true);
        const gemessen = await page.evaluate(messeBudget, sel);
        expect(
            befundeAus('gemessenes Budget', gemessen, true, a.erwartet),
            'die Matrix muss mit dem gemessenen Budget befundfrei sein, sonst misst diese ' +
                'Gegenprobe nur einen vorbestehenden Fehler'
        ).toEqual([]);

        await page.addStyleTag({
            content: ':root { --view-frame-height: 120px !important; }'
        });
        await page.waitForTimeout(300);
        await zustandHerstellen(page, a.reiter, a.listenSel, true);
        const verdrahtet = await page.evaluate(messeBudget, sel);
        const befunde = befundeAus('verdrahtete 120px', verdrahtet, true, a.erwartet);
        console.log(
            `[M3c] Gegenprobe ${breite}x${hoehe} mit Band, gescrollt — gemessen: Rahmen ` +
                `${gemessen.rahmen}, ` +
                `Ueberhang ${gemessen.ueberhang}px, Suchfeld ${gemessen.suchfeld} | ` +
                `verdrahtet: Rahmen ${verdrahtet.rahmen}, Ueberhang ${verdrahtet.ueberhang}px, ` +
                `Suchfeld ${verdrahtet.suchfeld}, KopfDecktLeiste ${verdrahtet.kopfDecktLeiste}px, ` +
                `Befunde ${befunde.length}`
        );

        // Erst der Beweis, dass der Zwang ueberhaupt gegriffen hat.
        expect(
            verdrahtet.rahmen,
            `das Token muss auf 120px zu zwingen sein (es steht auf ${verdrahtet.rahmen})`
        ).toBe('120px');
        // Und dann: die Matrix sieht es.
        expect(
            verdrahtet.ueberhang,
            `mit der verdrahteten 120px muss ein Seitenueberhang entstehen ` +
                `(gemessen ${verdrahtet.ueberhang}px)`
        ).toBeGreaterThan(0);
        expect(
            befunde.length,
            'die Matrix-Zusicherungen muessen den verdrahteten Zustand melden — sie melden nichts'
        ).toBeGreaterThan(0);
    });
});
