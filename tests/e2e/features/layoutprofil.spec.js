// @ts-check
/**
 * E2E — Das Layoutprofil folgt dem Fenster, und der Platz wird einmal
 * reserviert (M2).
 *
 * Drei Befunde, alle am Buendel zu f58699b gemessen, alle vorbestehend.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * (a) DAS LAYOUTPROFIL WIRD NUR BEIM LADEN GEWAEHLT.
 *
 * `loadLayout()` (`ui/layout-profiles.js`) erkennt die Fensterbreite genau
 * EINMAL beim Start und nur, solange `D.settings.layout` leer ist. Einen
 * Fensterbeobachter gab es nicht. GEMESSEN, Fenster nach dem Laden von
 * 1440x800 auf 390x844 gezogen — der Griff des Spielleiters, der am Tisch das
 * Fenster verkleinert oder das Geraet dreht:
 *
 *   Messgroesse                    1440x800 (vorher)   390x844 (nachher)
 *   ----------------------------   -----------------   ------------------
 *   data-layout                    desktop             desktop  (!)
 *   Hoehe der Kopfzeile            102px               234px
 *   Oberkante der Kopfzeile        61px                157px
 *   Mobil-Kopfzeile                0px hoch            0px hoch
 *   sichtbare Reiter von 24        —                   1
 *   Seitenueberhang                74px                658px
 *
 * Die Kopfzeile nahm also 234 von 844 Bildpunkten (28% des Fensters) am OBEREN
 * Rand, waehrend 23 der 24 Reiter in zugeklappten Gruppenmenues steckten. Im
 * Mobil-Profil waeren es 64px Mobil-Kopfzeile oben und ein 56px-Streifen
 * unten, und alle 24 Reiter lagen flach im Raster (M1).
 *
 * WARUM DIE WAHL DES NUTZERS VORGEHT. `setLayout()`/`toggleLayout()` schreiben
 * nach `D.settings.layout`. Wer dort etwas gewaehlt hat, hat entschieden; ein
 * automatischer Wechsel darf das nicht ueberschreiben. Die Zusicherungen unten
 * trennen beides: zwei Faelle fuer das Folgen (beide Richtungen) und zwei
 * Waechter dafuer, dass die ausdrueckliche Wahl jeden Fensterwechsel ueberlebt
 * UND dass der automatische Wechsel selbst NICHTS in `D.settings.layout`
 * schreibt — taete er es, waere das Profil nach dem ersten Fensterwechsel fuer
 * immer festgeschrieben und die Zusicherung "folgt dem Fenster" zerstoerte sich
 * selbst.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * (b) DER PLATZ DER UNTEREN FESTEN LEISTE WURDE ZWEIMAL RESERVIERT.
 *
 * Im Mobil-Layout ist `.app-header` eine feste Leiste am unteren Fensterrand,
 * eingefahren auf `translateY(calc(100% - 56px))` — sichtbar bleibt genau die
 * 56px hohe Umschalter-Zeile. Dafuer hielten ZWEI Regeln in `variables.css`
 * Platz frei: `body { padding-bottom: 70px }` UND
 * `.main-content { margin-bottom: 70px }`.
 *
 * GEMESSEN (Mobil-Layout, 24 Eintraege je Liste, Umzugs-Band stehend):
 *
 *   Fenster   reserviert   sichtbarer Streifen   totes Feld unter der Liste
 *   -------   ----------   -------------------   --------------------------
 *   390x844   140px        56px                  94px
 *   360x740   140px        56px                  94px
 *   700x800   140px        56px                  94px
 *
 * Die Hoehenbudget-Kette zaehlt beides mit (`setzeRahmenHoehe()` liest den
 * body-Innenabstand UND die Raender von `.main-content`), das Ergebnis stimmte
 * also — nur gingen dem Inhalt 70px doppelt verloren. Schalenhoehen vorher:
 * 477px bei 390x844, 394px bei 360x740, 529px bei 700x800.
 *
 * WAS DAVON BEIM NUTZER ANKOMMT, ist die Hoehe der LISTENSPALTE — des
 * Bereichs, der in der Master-Detail-Schale wirklich scrollt
 * (`.npc-master`, `.loot-master`, `.loc-master`, `.enc-master`, je
 * `overflow-y: auto`). GEMESSEN bei 360x740 mit stehendem Band, 24 Eintraege
 * je Liste, Eintragshoehe 70-74px:
 *
 *   Ansicht      Spaltenhoehe   passende Eintraege
 *   ----------   ------------   ------------------
 *   Truhe         54px          weniger als EINER
 *   Begegnungen   88px          einer
 *   NSCs         126px          einer
 *   Orte         201px          zwei
 *
 * Eine Listenspalte, die keinen ganzen Eintrag zeigt, ist keine Liste mehr.
 * Die Zusicherung unten verlangt deshalb Platz fuer mindestens ZWEI Eintraege
 * und messt die Schwelle am ersten Eintrag selbst, statt eine Zahl zu
 * verdrahten.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * (c) DER TEUERSTE FALL: TELEFONBREITE MIT STEHENDEM UMZUGS-BAND.
 *
 * Das Band ist ein HINWEIS, kein Dialog — und es war auf Telefonbreite das
 * teuerste Element der Seite. GEMESSEN, Bandhoehe je Fensterbreite:
 *
 *   Breite   320   360   390   480   500   600   700   900   1280
 *   Hoehe    136   136   157   101    80    61    61    61     61
 *
 * 157px bei 390px Breite sind 19% des Fensters fuer einen Satz. Die Ursache ist
 * der Umbruch: `.migration-hint-text` hat `min-width: 200px` und `flex: 1`, die
 * drei Kinder der Leiste (Text, "Zum App-Umzug", Schliessen) umbrechen bei
 * `flex-wrap: wrap`. Bei 390px blieb der Schliessknopf allein in einer zweiten
 * Reihe (Text 84px hoch = vier Zeilen + 44px Knopfreihe + Zwischenraum +
 * Innenabstand = 157px); bei 360px wanderten beide Knoepfe in die zweite Reihe
 * (Text 63px = drei Zeilen + 44 + 12 + 16 = 136px).
 *
 * Verglichene Fassungen (je Fenster frisch geladen, Bandhoehe gemessen):
 *
 *   Fassung                                320   360   390   480   500
 *   -----------------------------------    ---   ---   ---   ---   ---
 *   Ist                                    136   136   157   101    80
 *   nur Text auf zwei Zeilen geklammert     115   115   117    61    61
 *   kurzer Text statt des langen             94    94   117    61    61
 *   beides                                   94    94   117    61    61
 *
 * Die Klammer bringt nichts, was der kurze Text nicht schon bringt (die beiden
 * letzten Zeilen sind gleich) — sie bleibt deshalb weg. Was uebrig bleibt, sind
 * ZWEI Tippreihen zu je 44px: die darf nichts schrumpfen, es ist dieselbe
 * Daumen-Begruendung wie bei den 56px-Reitern in M1.
 *
 * DAZU KAM EIN ZWEITER BEFUND AM BAND, den (c) nicht wegkuerzen durfte, sondern
 * mitnehmen musste: im Mobil-Layout liegt die MOBIL-KOPFZEILE AUF dem Band.
 * Beide sind `position: fixed; top: 0` auf `--z-panel` (600), und die Kopfzeile
 * gewinnt, weil sie spaeter im Dokument steht. GEMESSEN bei 390x844 mit
 * `elementsFromPoint` auf der Mitte von "Zum App-Umzug" (Kasten 237,28,137x44):
 * obenauf lag der klassenlose Flex-Behaelter der Mobil-Kopfzeile (Kasten
 * 266,10,116x43, `.mobile-header` 0,0,390x64) — der Knopf war dort nicht
 * anklickbar. Bei 320 und 360px Breite brach er in die zweite Bandreihe aus und
 * war frei: ein Zufall der Umbruchhoehe, kein Entwurf. Genau dieser Zufall
 * KIPPTE durch die Kuerzung — mit dem kurzen Text stieg die zweite Reihe auf
 * y 41..85, und bei 320/360px war dann auch der SCHLIESSKNOPF verdeckt
 * (gemessen: "verdeckt von DIV.mobile-header"). Eine Kuerzung, die das Band
 * unbedienbar macht, ist keine Verbesserung.
 *
 * Das Band weicht deshalb im Mobil-Layout unter die Kopfzeile aus
 * (`top: var(--mobile-header-height)`, migration.css) — und nicht umgekehrt: die
 * Mobil-Kopfzeile traegt Suche, Rueckgaengig, Schnellnotizen, Theme, Layout UND
 * den einzigen Mobil-Einstieg ins Kampfprotokoll (U5). Die Hoehe ist GEMESSEN
 * (`setzeMobilKopfHoehe()`), weil die Kopfzeile keine gesetzte Hoehe hat; an
 * derselben Zahl haengt die Platzhaltung `.main-content { padding-top }`, die
 * bis dahin auf verdrahteten 60px gegen eine 64px hohe Kopfzeile stand.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WARUM PER MAUSRAD. Ein gesetztes `scrollTop` und ein `scrollIntoView()`
 * bewegen auch einen Bereich, den der Nutzer nicht scrollen kann, und melden
 * Erreichbarkeit, wo keine ist. Vorbild: `hoehenbudget.spec.js`,
 * `mobil-navigation.spec.js`.
 *
 * WARUM MIT UMZUGS-BAND. Es ist der Normalfall am Spieltisch: der Spielleiter
 * faehrt die App per `file://`, und dort erscheint der Hinweis in jeder frischen
 * Browsersitzung. Es wird NICHT unterdrueckt.
 */
import { test, expect } from '@playwright/test';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

const THEMES = ['dark', 'light', 'sepia', 'contrast'];

/* Die beiden Telefonfenster des Auftrags. Das QUERFORMAT (844x390) steht hier
   ABSICHTLICH NICHT: die Zusicherung dieses Blocks lautet "Platz fuer zwei
   Eintraege", und die haelt bei 390px Fensterhoehe nicht — aus Gruenden, die
   nicht an der Reservierung des Leistenplatzes liegen. Siehe den Block (a2) und
   dort den Fall "im Querformat bleibt die Liste eng". */
const FENSTER = [
    [390, 844],
    [360, 740]
];

/* Die drei Telefonbreiten, an denen das Band gemessen wird. 320px nennt
   CLAUDE.md ausdruecklich als Mobil-Pruefbreite. */
const BAND_FENSTER = [
    [320, 800],
    [360, 740],
    [390, 844]
];

/** Mehr Eintraege als in jede Schale passen — sonst gibt es nichts zu scrollen. */
const ANZAHL = 24;

/* Zwei Tippreihen zu 44px plus Zwischenraum (12px) und Innenabstand (2x8px) —
   die Hoehe, unter der das Hinweisband auf Telefonbreite bleiben muss. Die 44px
   selbst sind unantastbar: unter 44px trifft ein Daumen nicht mehr zuverlaessig
   (dieselbe Begruendung wie bei den 56px-Reitern in M1). Mit 120 statt 116 ist
   ein Bildpunkt Rundungsluft eingerechnet — gemessen kam 117 heraus. */
const BAND_DECKEL = 120;

/* Luft, die unter der Liste bis zum sichtbaren Leistenstreifen hoechstens
   uebrig bleiben darf. Eine einzige Reservierung von 70px gegen einen 56px
   hohen Streifen laesst 14px, dazu der 10px-Innenabstand von .main-content =
   24px. Die doppelte Reservierung machte daraus 94px. */
const TOTES_FELD_DECKEL = 30;

const reihe = (wort, extra) =>
    Array.from({ length: ANZAHL }, (_, i) => ({
        id: i + 1,
        name: `${wort} ${String(i + 1).padStart(2, '0')}`,
        ...extra
    }));

/* Saat wie in den uebrigen Mobil-Proben: ein `_version` weit in der Zukunft
   ueberspringt die Datenwanderung, die gefuellte `_nextId`-Abbildung verhindert
   die Fruehstart-Rennen. `settings.layout` ist AUSDRUECKLICH NICHT gesetzt —
   genau der Zustand, in dem das Profil dem Fenster folgen darf. */
const SAAT = {
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
    characters: [],
    locations: reihe('Ort', { type: 'Stadt', region: 'Kernland', description: 'Probeeintrag' }),
    npcs: reihe('NSC', { race: 'Mensch', role: 'Haendler', description: 'Probeeintrag' }),
    loot: reihe('Beute', { type: 'Waffe', value: 10, description: 'Probeeintrag' }),
    encounters: reihe('Begegnung', { difficulty: 'medium', monsters: [], description: 'Probe' }),
    quests: [],
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

/* Reitername, Waehler der Schale, Waehler der LISTENSPALTE, Listencontainer.
   Die Listenspalte ist der Bereich, der in der Master-Detail-Schale wirklich
   scrollt (`overflow-y: auto`); die Liste darin ist `overflow: visible` und so
   hoch wie ihr Inhalt. Beides auseinanderzuhalten ist nicht kosmetisch: ein
   Radpunkt aus der sichtbaren Mitte der LISTE liegt bei einer 54px hohen Spalte
   und einer 2049px hohen Liste weit UNTER der Spalte, das Rad erreicht den
   Scrollbereich dann nie, und die Probe meldet eine Unerreichbarkeit, die vom
   Messpunkt kommt und nicht von der App (am Buendel zu f58699b nachgemessen:
   `.npc-master.scrollTop` blieb 0 von 1927 moeglichen). Dass der genannte
   Waehler wirklich der Scrollbereich ist, prueft jeder Fall selbst mit. */
const ANSICHTEN = [
    ['npcs', '.npc-view.active', '.npc-master', '#npc-list'],
    ['loot', '.loot-view.active', '.loot-master', '#loot-list'],
    ['locations', '.loc-view.active', '.loc-master', '#locations-list'],
    ['encounter', '.enc-view.active', '.enc-master', '#encounter-list']
];

/**
 * Laedt das gebaute Buendel. `waitForAppReady()` ist hier NICHT benutzbar: es
 * wartet auf eine SICHTBARE `.app-title`, und im Mobil-Layout ist die
 * Desktop-Kopfzeile ausgeblendet (`[data-layout="mobile"] .app-header-top
 * { display: none }`). Gewartet wird deshalb nur auf die
 * Bereitschaftsmarkierung — derselbe Griff wie in `sticky-stapel.spec.js` und
 * `hoehenbudget.spec.js`.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} [theme]
 */
async function appLaden(page, theme) {
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng;
            // dann greift der Leerzustand, und der traegt diese Probe genauso.
        }
    }, SAAT);
    await page.goto(APP_URL);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 25000
    });
    await page.waitForTimeout(500);
    if (theme) {
        await page.evaluate(t => {
            // @ts-ignore — global aus dem Theme-Modul
            if (typeof window.setTheme === 'function') window.setTheme(t);
        }, theme);
        await page.waitForTimeout(300);
        const ist = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
        expect(ist, `Theme ${theme} wurde nicht gesetzt`).toBe(theme);
    }
}

/**
 * Der Fensterwechsel, wie ihn der Spielleiter macht — plus die Wartezeit ueber
 * der 200ms-Entprellung des Fensterbeobachters in `core/init.js`.
 * @param {import('@playwright/test').Page} page
 */
async function fensterZiehen(page, breite, hoehe) {
    await page.setViewportSize({ width: breite, height: hoehe });
    await page.waitForTimeout(700);
}

/** Der Zustand des Profils und der beiden Kopfbloecke. Laeuft IM Browser. */
function messeProfil() {
    const de = document.documentElement;
    const kasten = sel => {
        const e = document.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return {
            oben: Math.round(b.top),
            unten: Math.round(b.bottom),
            hoehe: Math.round(b.height)
        };
    };
    const reiter = Array.from(document.querySelectorAll('.nav-tab[data-view]'));
    const sichtbar = reiter.filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    });
    return {
        layout: de.dataset.layout || '(keins)',
        gewaehlt: (window.D && window.D.settings && window.D.settings.layout) || null,
        kopf: kasten('.app-header'),
        mobilKopf: kasten('.mobile-header'),
        reiterGesamt: reiter.length,
        reiterSichtbar: sichtbar.length,
        fensterB: window.innerWidth,
        fensterH: window.innerHeight,
        ueberhang: Math.round(de.scrollHeight - de.clientHeight),
        /* Der SEITWAERTS-Ueberhang. Er ist die harte Messgroesse des
           Querformat-Falls: im Desktop-Profil passt die Kopfzeile in ein 844px
           breites, 390px flaches Fenster nicht, die Seite scrollt in X, und
           seitwaerts scrollen ist am Spieltisch keine Bedienung. */
        ueberhangX: Math.max(0, Math.round(de.scrollWidth - de.clientWidth))
    };
}

/**
 * Die Reservierung des Leistenplatzes, die Hoehe der Listenspalte und das tote
 * Feld darunter. Laeuft IM Browser.
 * @param {string[]} sel [Schale, Listenspalte, Liste]
 */
function messeLeistenplatz(sel) {
    const schaleSel = sel[0];
    const spalteSel = sel[1];
    const listenSel = sel[2];
    const de = document.documentElement;
    const zahl = (stil, name) => Math.round(parseFloat(stil[name]) || 0);
    const koerper = getComputedStyle(document.body);
    const inhalt = document.querySelector('.main-content');
    const inhaltStil = inhalt ? getComputedStyle(inhalt) : null;
    const schale = document.querySelector(schaleSel);
    const kopf = document.querySelector('.app-header');
    const kr = kopf ? kopf.getBoundingClientRect() : null;
    const sr = schale ? schale.getBoundingClientRect() : null;
    const streifen = kr
        ? Math.round(Math.min(kr.bottom, window.innerHeight) - Math.max(kr.top, 0))
        : 0;
    const liste = document.querySelector(listenSel);
    const posten = liste ? Array.from(liste.children) : [];
    const letzter = posten[posten.length - 1] || null;
    const lr = letzter ? letzter.getBoundingClientRect() : null;
    const spalte = document.querySelector(spalteSel);
    const spalteStil = spalte ? getComputedStyle(spalte) : null;
    const erster = posten[0] || null;
    const imFenster = !!(lr && lr.top < window.innerHeight && lr.bottom > 0 && lr.height > 0);
    let getroffen = null;
    if (imFenster) {
        const px = Math.round(lr.left + Math.min(lr.width, window.innerWidth - lr.left) / 2);
        const py = Math.round(Math.min(lr.bottom, window.innerHeight - 1)) - 4;
        getroffen = document.elementFromPoint(px, py);
    }
    return {
        layout: de.dataset.layout || '(keins)',
        rahmen: getComputedStyle(de).getPropertyValue('--view-frame-height').trim() || '(keins)',
        koerperUnten: zahl(koerper, 'paddingBottom'),
        inhaltRandUnten: inhaltStil ? zahl(inhaltStil, 'marginBottom') : 0,
        inhaltInnenUnten: inhaltStil ? zahl(inhaltStil, 'paddingBottom') : 0,
        streifen,
        schaleUnten: sr ? Math.round(sr.bottom) : 0,
        schaleHoehe: sr ? Math.round(sr.height) : 0,
        leisteOben: kr ? Math.round(kr.top) : 0,
        totesFeld: kr && sr ? Math.round(Math.max(kr.top, 0) - sr.bottom) : 0,
        ueberhang: Math.round(de.scrollHeight - de.clientHeight),
        // Die Listenspalte: der Bereich, der wirklich scrollt. Die drei Werte
        // zusammen belegen, dass der gemessene Waehler auch der Scrollbereich
        // IST — sonst messt die Zusicherung unten etwas anderes als gemeint.
        spalteHoehe: spalte ? spalte.clientHeight : 0,
        spalteOverflow: spalteStil ? spalteStil.overflowY : '(fehlt)',
        spalteScrollbar: spalte ? spalte.scrollHeight > spalte.clientHeight + 1 : false,
        spalteScrollStand: spalte
            ? `${Math.round(spalte.scrollTop)}/${Math.round(spalte.scrollHeight - spalte.clientHeight)}`
            : '(fehlt)',
        eintragHoehe: erster ? Math.round(erster.getBoundingClientRect().height) : 0,
        anzahl: posten.length,
        letzterImFenster: imFenster,
        letzterVerdeckerKlasse:
            getroffen && letzter && !(letzter === getroffen || letzter.contains(getroffen))
                ? getroffen.tagName + '.' + String(getroffen.className).split(' ')[0]
                : null,
        letzterKlickbar: !!(
            getroffen &&
            letzter &&
            (letzter === getroffen || letzter.contains(getroffen))
        )
    };
}

/** Hoehe des Hinweisbands und Erreichbarkeit seiner beiden Knoepfe. */
function messeBand() {
    const band = document.querySelector('.migration-hint-banner');
    if (!band) return { da: false };
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
    const text = band.querySelector('.migration-hint-text');
    const br = band.getBoundingClientRect();
    const mobilKopf = document.querySelector('.mobile-header');
    const inhalt = document.querySelector('.main-content');
    // Oberkante des INHALTS, nicht des Behaelters: `.main-content` beginnt am
    // Bandende, sein Innenabstand haelt die Mobil-Kopfzeile frei.
    let inhaltOben = null;
    if (inhalt) {
        const ir = inhalt.getBoundingClientRect();
        inhaltOben = Math.round(ir.top + (parseFloat(getComputedStyle(inhalt).paddingTop) || 0));
    }
    return {
        da: true,
        oben: Math.round(br.top),
        unten: Math.round(br.bottom),
        hoehe: Math.round(br.height),
        anteil: Math.round((br.height / window.innerHeight) * 100),
        mobilKopfUnten: mobilKopf ? Math.round(mobilKopf.getBoundingClientRect().bottom) : 0,
        inhaltOben,
        textHoehe: text ? Math.round(text.getBoundingClientRect().height) : 0,
        textInhalt: text ? text.innerText.replace(/\s+/g, ' ').trim() : '',
        umzug: treffer(band.querySelector('.migration-hint-link')),
        schliessen: treffer(band.querySelector('.migration-hint-close')),
        koerperOben: getComputedStyle(document.body).paddingTop
    };
}

/**
 * Wechselt den Reiter und fuehrt das Mausrad ueber der LISTENSPALTE. Der
 * Radpunkt kommt aus dem sichtbaren Teil der SPALTE, nicht aus dem der Liste
 * und nicht aus der halben Fensterhoehe — die Begruendung steht an `ANSICHTEN`.
 * @param {import('@playwright/test').Page} page
 */
async function reiterUndRollen(page, reiter, spalteSel) {
    await page.evaluate(n => window.switchView(n), reiter);
    await page.waitForTimeout(400);
    const punkt = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
            x: Math.round(r.left + Math.min(r.width, window.innerWidth - r.left) / 2),
            y: Math.round((Math.max(r.top, 0) + Math.min(r.bottom, window.innerHeight)) / 2)
        };
    }, spalteSel);
    if (!punkt) return;
    const breite = page.viewportSize().width;
    await page.mouse.move(Math.min(Math.max(punkt.x, 5), breite - 5), punkt.y);
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 400);
    await page.waitForTimeout(400);
}

// ============================================================
// (a) Das Layoutprofil folgt dem Fenster
// ============================================================
test.describe('Layoutprofil folgt dem Fenster (M2a)', () => {
    for (const theme of THEMES) {
        test(`ein auf Telefonbreite gezogenes Fenster wechselt ins Mobil-Profil: ${theme}`, async ({
            page
        }) => {
            await page.setViewportSize({ width: 1440, height: 800 });
            await appLaden(page, theme);

            const vorher = await page.evaluate(messeProfil);
            expect(vorher.layout, 'der Fall beginnt im Desktop-Profil').toBe('desktop');
            expect(vorher.gewaehlt, 'der Fall beginnt OHNE ausdrueckliche Wahl').toBeNull();

            await fensterZiehen(page, 390, 844);
            const nachher = await page.evaluate(messeProfil);
            console.log(
                `[M2a] ${theme} 1440x800 -> 390x844: vorher ${JSON.stringify(vorher)}, nachher ${JSON.stringify(nachher)}`
            );

            // (1) Das Profil folgt.
            expect(
                nachher.layout,
                `das Profil blieb auf "${nachher.layout}" (Kopfzeile ${nachher.kopf.hoehe}px hoch, Oberkante ${nachher.kopf.oben}px, ${nachher.reiterSichtbar} von ${nachher.reiterGesamt} Reitern sichtbar)`
            ).toBe('mobile');

            // (2) Damit sitzt die Navigationsleiste am UNTEREN Fensterrand und
            //     frisst nicht 234 von 844 Bildpunkten am oberen.
            expect(
                nachher.kopf.oben,
                `die Navigationsleiste sitzt bei ${nachher.kopf.oben}px und damit in der oberen Fensterhaelfte (Fenster ${nachher.fensterH}px)`
            ).toBeGreaterThanOrEqual(Math.round(nachher.fensterH / 2));

            // (3) Und die Mobil-Kopfzeile ist da — ohne sie fehlen Suche,
            //     Rueckgaengig und der Weg zum Kampfprotokoll (U5).
            expect(
                nachher.mobilKopf.hoehe,
                `die Mobil-Kopfzeile ist ${nachher.mobilKopf.hoehe}px hoch`
            ).toBeGreaterThan(0);
        });
    }

    test('ein wieder breit gezogenes Fenster wechselt zurueck ins Desktop-Profil', async ({
        page
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await appLaden(page);

        const vorher = await page.evaluate(messeProfil);
        expect(vorher.layout, 'loadLayout() waehlt bei 390px Mobil').toBe('mobile');

        await fensterZiehen(page, 1440, 800);
        const nachher = await page.evaluate(messeProfil);
        console.log(`[M2a] 390x844 -> 1440x800: ${JSON.stringify(nachher)}`);

        expect(
            nachher.layout,
            `das Profil blieb auf "${nachher.layout}" — das Mobil-Profil in einem 1440px-Fenster bedeutet einen 56px-Streifen ueber dem Inhalt und einspaltige Raster`
        ).toBe('desktop');
        expect(
            nachher.mobilKopf.hoehe,
            `die Mobil-Kopfzeile steht im Desktop-Profil noch mit ${nachher.mobilKopf.hoehe}px`
        ).toBe(0);
    });

    test('der Wechsel ist wiederholbar und schreibt keine Wahl fest', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page);

        const verlauf = [];
        for (const [b, h] of [
            [390, 844],
            [1440, 800],
            [360, 740],
            [1280, 800]
        ]) {
            await fensterZiehen(page, b, h);
            const m = await page.evaluate(messeProfil);
            verlauf.push({ fenster: `${b}x${h}`, layout: m.layout, gewaehlt: m.gewaehlt });
        }
        console.log(`[M2a] Verlauf: ${JSON.stringify(verlauf)}`);

        expect(
            verlauf.map(v => v.layout),
            `der Verlauf lautet ${JSON.stringify(verlauf)}`
        ).toEqual(['mobile', 'desktop', 'mobile', 'desktop']);

        // Der automatische Wechsel darf NICHTS festschreiben — sonst wuerde die
        // erste Verkleinerung das Profil fuer immer einfrieren und genau die
        // Zusicherung oben zerstoeren.
        expect(
            verlauf.map(v => v.gewaehlt),
            `der automatische Wechsel hat eine Wahl festgeschrieben: ${JSON.stringify(verlauf)}`
        ).toEqual([null, null, null, null]);
    });

    /* WAECHTER, nicht roter Nachweis: diese beiden Faelle halten schon vor der
       Korrektur, weil es vorher ueberhaupt keinen automatischen Wechsel gab.
       Sie stehen hier, weil die Korrektur sie brechen KOENNTE — und das ist der
       einzige Weg, auf dem (a) dem Nutzer etwas wegnehmen wuerde. */
    for (const [wahl, von, nach] of [
        ['mobile', [390, 844], [1440, 800]],
        ['desktop', [1440, 800], [390, 844]]
    ]) {
        test(`eine ausdrueckliche Wahl (${wahl}) ueberlebt den Fensterwechsel`, async ({
            page
        }) => {
            await page.setViewportSize({ width: von[0], height: von[1] });
            await appLaden(page);
            await page.evaluate(w => window.setLayout(w), wahl);
            await page.waitForTimeout(400);

            const vorher = await page.evaluate(messeProfil);
            expect(vorher.layout, `setLayout('${wahl}') hat nicht gegriffen`).toBe(wahl);
            expect(vorher.gewaehlt, 'die Wahl muss in D.settings.layout stehen').toBe(wahl);

            await fensterZiehen(page, nach[0], nach[1]);
            const nachher = await page.evaluate(messeProfil);
            console.log(
                `[M2a] Wahl ${wahl}, ${von.join('x')} -> ${nach.join('x')}: ${JSON.stringify(nachher)}`
            );

            expect(
                nachher.layout,
                `der Fensterwechsel hat die Wahl des Nutzers auf "${nachher.layout}" ueberschrieben`
            ).toBe(wahl);
            expect(nachher.gewaehlt, 'die gespeicherte Wahl darf nicht kippen').toBe(wahl);
        });
    }
});

// ============================================================
// (a2) Das Querformat gehoert noch zum Telefon
// ============================================================
/**
 * DER RUECKSCHLAG DER KORREKTUR (a). GEMESSEN am Buendel zu 960b32b, eigenes
 * Playwright/Chromium, je frisch geladen, 900ms nach dem Drehen:
 *
 *   Geraet      hoch -> quer        Kopf quer      Mobil-Kopf   Ueberhang X
 *   ---------   -----------------   ------------   ----------   -----------
 *   390x844     mobile -> DESKTOP   152px @ 61px   0px          184px
 *   393x852     mobile -> DESKTOP   152px @ 61px   0px          176px
 *   430x932     mobile -> DESKTOP   152px @ 61px   0px           96px
 *   360x740     mobile -> mobile    —              64px           0px
 *
 * Mit dem 61px hohen Umzugs-Band sind das 213 von 390 Bildpunkten feste
 * Kopf-Moeblierung (55% des Fensters), ein sichtbarer Reiter von 24 — und eine
 * Seite, die seitwaerts scrollt. Vor (a) war dieser Zustand nach dem Drehen
 * unerreichbar, weil das Profil nur beim Laden gewaehlt wurde; (a) hat ihn
 * geschaffen. 740x360 bleibt mobil: dieselbe Geste, zwei Ergebnisse.
 *
 * URSACHE. `layoutAusFenster()` entschied allein an `window.innerWidth <= 768`.
 * Die gaengige Telefonklasse ist im Querformat 740..956px breit und faellt
 * damit auf die Desktop-Seite.
 *
 * DIE ENTSCHEIDUNG. Die Regel bekommt eine zweite, von der ersten unabhaengige
 * Bedingung: ein Fenster, dessen KURZE Seite in die Telefonklasse faellt und
 * dessen LANGE Seite darunter bleibt, ist ein gedrehtes Telefon. Die Regel
 * bleibt ZUSTANDSLOS — `loadLayout()` und der Fensterbeobachter benutzen
 * dieselbe Funktion, und ein direkt im Querformat geladenes Telefon muss
 * dasselbe Profil bekommen wie ein gedrehtes. Eine Hysterese ("das Mobil-Profil
 * erst oberhalb von 1000px verlassen") haette genau das gebrochen.
 *
 * DIE GEGENPROBE IST DER TEIL, DER WEHTUT. Ein kurzes, breites Desktop-Fenster
 * (1440x450) hat dieselbe kurze Seite wie ein gedrehtes Telefon. Es darf NICHT
 * ins Mobil-Profil fallen — deshalb die Schranke auf der langen Seite, und
 * deshalb stehen 1440x450, 1280x400, 1024x768 und 901x700 unten als Waechter.
 */
const QUER_FENSTER = [
    [390, 844],
    [393, 852],
    [430, 932]
];

/* Fenster, die NICHT mobil werden duerfen. 1440x450 und 1280x400 nennt der
   Pruefbefund ausdruecklich als Gegenprobe (kurze Seite wie ein gedrehtes
   Telefon, lange Seite weit darueber); 1024x768 ist ein Tablet im Querformat,
   901x700 der Fall, den `hoehenbudget.spec.js` einen Bildpunkt oberhalb der
   Schmalfassung festnagelt. */
const KURZE_DESKTOP_FENSTER = [
    [1440, 450],
    [1280, 400],
    [1024, 768],
    [901, 700]
];

test.describe('Das Querformat gehoert noch zum Telefon (M2a-Nachtrag)', () => {
    for (const theme of THEMES) {
        test(`Drehen ins Querformat bleibt im Mobil-Profil: ${theme}`, async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await appLaden(page, theme);

            const hoch = await page.evaluate(messeProfil);
            expect(hoch.layout, 'der Fall beginnt im Mobil-Profil').toBe('mobile');
            expect(hoch.gewaehlt, 'der Fall beginnt OHNE ausdrueckliche Wahl').toBeNull();

            await fensterZiehen(page, 844, 390);
            const quer = await page.evaluate(messeProfil);
            console.log(
                `[M2a2] ${theme} 390x844 -> 844x390: hoch ${JSON.stringify(hoch)}, quer ${JSON.stringify(quer)}`
            );

            // (1) Das Profil bleibt. 844px Breite sind kein Schreibtisch.
            expect(
                quer.layout,
                `das Drehen hat das Mobil-Profil verlassen: "${quer.layout}", Desktop-Kopfzeile ${quer.kopf.hoehe}px an Oberkante ${quer.kopf.oben}px, ${quer.reiterSichtbar} von ${quer.reiterGesamt} Reitern sichtbar`
            ).toBe('mobile');

            // (2) Die Mobil-Kopfzeile traegt Suche, Rueckgaengig und den Weg
            //     zum Kampfprotokoll (U5) — ohne sie ist das Querformat blind.
            expect(
                quer.mobilKopf.hoehe,
                `die Mobil-Kopfzeile ist ${quer.mobilKopf.hoehe}px hoch`
            ).toBeGreaterThan(0);

            // (3) Und nichts scrollt seitwaerts.
            expect(
                quer.ueberhangX,
                `die Seite ragt ${quer.ueberhangX}px ueber die Fensterbreite (${quer.fensterB}px) hinaus`
            ).toBe(0);

            // (4) Zurueckdrehen heilt — und schreibt nichts fest.
            await fensterZiehen(page, 390, 844);
            const zurueck = await page.evaluate(messeProfil);
            expect(zurueck.layout, `Zurueckdrehen ergab "${zurueck.layout}"`).toBe('mobile');
            expect(
                zurueck.gewaehlt,
                'das Drehen hat eine Wahl in D.settings.layout festgeschrieben'
            ).toBeNull();
        });
    }

    for (const [b, h] of QUER_FENSTER) {
        test(`Drehen bleibt mobil bei ${b}x${h} -> ${h}x${b}`, async ({ page }) => {
            await page.setViewportSize({ width: b, height: h });
            await appLaden(page);
            expect((await page.evaluate(messeProfil)).layout, 'hoch beginnt mobil').toBe('mobile');

            await fensterZiehen(page, h, b);
            const quer = await page.evaluate(messeProfil);
            console.log(`[M2a2] ${b}x${h} -> ${h}x${b}: ${JSON.stringify(quer)}`);
            expect(quer.layout, `quer ergab "${quer.layout}"`).toBe('mobile');
            expect(quer.ueberhangX, `Seitenueberhang ${quer.ueberhangX}px`).toBe(0);
            expect(quer.mobilKopf.hoehe, 'Mobil-Kopfzeile fehlt').toBeGreaterThan(0);
        });

        /* DIESELBE GROESSE, ANDERER WEG. Die Regel ist zustandslos, also muss
           ein direkt im Querformat GELADENES Telefon dasselbe Profil bekommen
           wie ein gedrehtes. Ohne diesen Fall waere eine Hysterese zulaessig,
           und dann haengt das Ergebnis daran, wie der Spielleiter das Geraet
           gerade in der Hand hielt, als er die App oeffnete. */
        test(`direkt im Querformat geladen ist ebenfalls mobil: ${h}x${b}`, async ({ page }) => {
            await page.setViewportSize({ width: h, height: b });
            await appLaden(page);
            const m = await page.evaluate(messeProfil);
            console.log(`[M2a2] direkt ${h}x${b}: ${JSON.stringify(m)}`);
            expect(
                m.layout,
                `loadLayout() waehlte "${m.layout}" fuer ${h}x${b} — ein gedrehtes Telefon`
            ).toBe('mobile');
            expect(m.ueberhangX, `Seitenueberhang ${m.ueberhangX}px`).toBe(0);
        });
    }

    /* WAECHTER, nicht roter Nachweis: diese Faelle halten schon vor der
       Korrektur. Sie stehen hier, weil die Korrektur sie brechen KOENNTE —
       eine Regel, die nur auf die kurze Seite sieht, zieht jedes flache
       Desktop-Fenster mit ins Mobil-Profil. */
    for (const [b, h] of KURZE_DESKTOP_FENSTER) {
        test(`ein kurzes, breites Desktop-Fenster bleibt Desktop: ${b}x${h}`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await appLaden(page);
            expect((await page.evaluate(messeProfil)).layout, 'der Fall beginnt Desktop').toBe(
                'desktop'
            );

            await fensterZiehen(page, b, h);
            const nachher = await page.evaluate(messeProfil);
            console.log(`[M2a2] Waechter 1440x900 -> ${b}x${h}: ${JSON.stringify(nachher)}`);
            expect(
                nachher.layout,
                `${b}x${h} ist in das Mobil-Profil gefallen (Mobil-Kopfzeile ${nachher.mobilKopf.hoehe}px) — ein ${b}px breites Fenster ist kein Telefon`
            ).toBe('desktop');
            expect(
                nachher.mobilKopf.hoehe,
                `die Mobil-Kopfzeile steht mit ${nachher.mobilKopf.hoehe}px`
            ).toBe(0);
        });

        /* UND direkt geladen, damit loadLayout() dieselbe Antwort gibt. */
        test(`direkt geladen bleibt ${b}x${h} ebenfalls Desktop`, async ({ page }) => {
            await page.setViewportSize({ width: b, height: h });
            await appLaden(page);
            const m = await page.evaluate(messeProfil);
            console.log(`[M2a2] Waechter direkt ${b}x${h}: ${JSON.stringify(m)}`);
            expect(m.layout, `loadLayout() waehlte "${m.layout}" fuer ${b}x${h}`).toBe('desktop');
        });
    }

    /**
     * DIE GEGENRECHNUNG, UND SIE IST UNBEQUEM.
     *
     * Die Korrektur fuehrt das gedrehte Telefon neu ins Mobil-Profil. Also
     * gehoert hierher die Frage, ob das Mobil-Profil bei 390px FENSTERHOEHE
     * ueberhaupt traegt. Antwort: fuer die Kopf- und Fussmoeblierung ja, fuer
     * die Listenspalte NEIN — und das Zweite ist VORBESTEHEND, nicht von dieser
     * Korrektur gemacht.
     *
     * GEMESSEN, `.npc-view.active` bei 844x390 im Mobil-Profil, 24 Eintraege:
     *
     *   erreicht ueber            Rahmen   Schale   Leiste   Liste   letzter
     *   -----------------------   ------   ------   ------   -----   -------
     *   Drehen (neue Regel)       205px    185px    158px     15px   nein
     *   Layout-Schalter (alt)     205px    185px    158px     15px   nein
     *
     * Auf den Bildpunkt gleich. Der Weg ins Profil ist also unbeteiligt; es ist
     * die Rechnung selbst: 390px Fenster minus 205px gemessener Moeblierung
     * (61px Umzugs-Band + 64px Mobil-Kopfzeile + 56px Leistenstreifen +
     * Innenabstand) lassen 185px Schale, und `.section-toolbar` allein braucht
     * davon 158px (zwei Zeilen Suchfeld/Filter, `min-height: 74px`,
     * `flex: 0 1 auto`). Fuer die Liste bleiben 15px. Weil die Schale
     * `overflow: hidden` fuehrt, scrollt auch die SEITE nicht (Ueberhang 0) —
     * der letzte von 24 Eintraegen ist nicht erreichbar.
     *
     * WARUM TROTZDEM MOBIL. Im Desktop-Profil ist dieselbe Schale noch kleiner
     * (Rahmen 239px, Schale 151px) UND es kommen 184px Seitenueberhang sowie
     * eine 152px hohe Kopfzeile mit einem sichtbaren Reiter von 24 dazu. Mobil
     * ist der strikt bessere der zwei Zustaende: Suche, Rueckgaengig und der Weg
     * zum Kampfprotokoll sind erreichbar, der Daumen findet die Navigation
     * unten, und nichts scrollt seitwaerts. Es ist nur nicht gut.
     *
     * WARUM NICHT HIER MITBEHOBEN. Die Abhilfe waere, die Schale in kurzen
     * Fenstern nicht zu kappen (`height: auto`, die Seite scrollt) — und diese
     * Zeile fuehren FUENF Geschwisterschalen gemeinsam, bewacht von
     * `tests/unit/schalen-aktenlage.test.js`, das genau darauf besteht. Das ist
     * eine eigene Messung ueber fuenf Ansichten und vier Themes und gehoert
     * nicht in dieselbe Runde wie die Profilwahl. Offener Punkt.
     *
     * DIESER FALL nagelt deshalb fest, was die Korrektur WIRKLICH zusichert,
     * und nichts darueber hinaus.
     */
    test('im Querformat traegt die Moeblierung, die Liste bleibt eng', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await appLaden(page);
        await fensterZiehen(page, 844, 390);
        await page.evaluate(() => window.switchView('npcs'));
        await page.waitForTimeout(500);

        const m = await page.evaluate(() => {
            const de = document.documentElement;
            const schale = document.querySelector('.npc-view.active');
            /* AUSDRUECKLICH aus der aktiven Schale heraus: `.section-toolbar`
               kommt je Ansicht einmal vor, und die erste im Dokument gehoert
               einer ausgeblendeten — die misst 0px und machte die Schranke
               unten zahnlos. */
            const leiste = schale ? schale.querySelector('.section-toolbar') : null;
            const streifen = document.querySelector('.mobile-nav-toggle');
            const mobilKopf = document.querySelector('.mobile-header');
            const h = e => (e ? Math.round(e.getBoundingClientRect().height) : null);
            const koerper = getComputedStyle(document.body);
            return {
                layout: de.dataset.layout,
                rahmen: getComputedStyle(de).getPropertyValue('--view-frame-height').trim(),
                schale: h(schale),
                leiste: h(leiste),
                mobilKopf: h(mobilKopf),
                streifen: h(streifen),
                koerperUnten: Math.round(parseFloat(koerper.paddingBottom) || 0),
                inhaltUnten: (() => {
                    const i = document.querySelector('.main-content');
                    return i ? Math.round(parseFloat(getComputedStyle(i).marginBottom) || 0) : null;
                })(),
                ueberhangX: Math.max(0, Math.round(de.scrollWidth - de.clientWidth))
            };
        });
        console.log(`[M2a2] Querformat-Schale 844x390: ${JSON.stringify(m)}`);

        // (1) Das Profil haelt — das ist die Korrektur.
        expect(m.layout, `Profil "${m.layout}"`).toBe('mobile');

        // (2) Nichts scrollt seitwaerts. Das ist der Gewinn gegen die 184px.
        expect(m.ueberhangX, `Seitenueberhang ${m.ueberhangX}px`).toBe(0);

        // (3) Die Mobil-Kopfzeile traegt Suche und Rueckgaengig (U5), der
        //     Leistenstreifen die Navigation in Daumenreichweite (M1).
        expect(m.mobilKopf, `Mobil-Kopfzeile ${m.mobilKopf}px`).toBeGreaterThan(0);
        expect(m.streifen, `Leistenstreifen ${m.streifen}px`).toBeGreaterThan(0);

        // (4) Und der Leistenplatz bleibt EINMAL reserviert — die Zusicherung
        //     aus (b) gilt auch im Querformat.
        expect(
            [m.koerperUnten > 0, m.inhaltUnten > 0],
            `Reservierung: body ${m.koerperUnten}px, .main-content ${m.inhaltUnten}px — beide zugleich waere die doppelte`
        ).toEqual([true, false]);

        /* (5) DER OFFENE PUNKT, als Ratsche nach OBEN. Die Werkzeugleiste
               nimmt heute 158 von 185px Schale; wird es MEHR, verschwindet die
               Liste vollstaendig. Wird es weniger, soll dieser Fall auffallen
               und die Zahl hier mitwandern — bis die Schale in kurzen Fenstern
               nicht mehr gekappt wird. Kein Soll-Zustand, eine Grenze. */
        expect(
            m.leiste,
            `die Werkzeugleiste misst ${m.leiste}px — 0 hiesse, der Messgriff hat die falsche (ausgeblendete) Leiste erwischt und die Schranke waere zahnlos`
        ).toBeGreaterThan(100);
        expect(
            m.leiste,
            `die Werkzeugleiste nimmt ${m.leiste} von ${m.schale}px Schale (Rahmen ${m.rahmen})`
        ).toBeLessThanOrEqual(170);
    });

    test('eine ausdrueckliche Wahl (desktop) ueberlebt das Drehen', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await appLaden(page);
        await page.evaluate(() => window.setLayout('desktop'));
        await page.waitForTimeout(400);
        expect((await page.evaluate(messeProfil)).gewaehlt, 'die Wahl muss stehen').toBe('desktop');

        await fensterZiehen(page, 844, 390);
        const quer = await page.evaluate(messeProfil);
        console.log(`[M2a2] Wahl desktop, gedreht: ${JSON.stringify(quer)}`);
        expect(quer.layout, `das Drehen hat die Wahl auf "${quer.layout}" ueberschrieben`).toBe(
            'desktop'
        );
        expect(quer.gewaehlt, 'die gespeicherte Wahl darf nicht kippen').toBe('desktop');
    });
});

// ============================================================
// (b) Der Platz der unteren Leiste wird nur einmal reserviert
// ============================================================
test.describe('Leistenplatz nur einmal reserviert (M2b)', () => {
    for (const [breite, hoehe] of FENSTER) {
        for (const [reiter, schaleSel, spalteSel, listenSel] of ANSICHTEN) {
            test(`${reiter} bei ${breite}x${hoehe}: eine Reservierung, Platz fuer zwei Eintraege, letzter erreichbar`, async ({
                page
            }) => {
                await page.setViewportSize({ width: breite, height: hoehe });
                await appLaden(page);
                const layout = await page.evaluate(() => document.documentElement.dataset.layout);
                expect(layout, 'der Fall braucht das Mobil-Profil').toBe('mobile');

                await reiterUndRollen(page, reiter, spalteSel);
                const m = await page.evaluate(messeLeistenplatz, [schaleSel, spalteSel, listenSel]);
                console.log(`[M2b] ${reiter} ${breite}x${hoehe}: ${JSON.stringify(m)}`);

                expect(m.anzahl, 'die Liste muss gefuellt sein').toBe(ANZAHL);
                expect(m.eintragHoehe, 'ein Eintrag muss messbare Hoehe haben').toBeGreaterThan(0);
                // Vorbedingung: der genannte Waehler IST der Scrollbereich.
                expect(
                    m.spalteOverflow,
                    `${spalteSel} hat overflow-y: ${m.spalteOverflow} und ist damit nicht der Scrollbereich`
                ).toMatch(/auto|scroll/);
                expect(
                    m.spalteScrollbar,
                    `${spalteSel} hat nichts zu scrollen (${m.spalteScrollStand}) — der Fall messt dann nichts`
                ).toBe(true);

                // (1) Der Platz der Leiste wird GENAU EINMAL reserviert.
                expect(
                    m.koerperUnten + m.inhaltRandUnten,
                    `der Leistenplatz ist doppelt reserviert: body padding-bottom ${m.koerperUnten}px + .main-content margin-bottom ${m.inhaltRandUnten}px`
                ).toBeLessThanOrEqual(70);

                // (2) Damit bleibt unter der Liste kein totes Feld.
                expect(
                    m.totesFeld,
                    `zwischen Schalenunterkante (${m.schaleUnten}px) und Leistenoberkante (${m.leisteOben}px) liegen ${m.totesFeld}px ungenutzt, obwohl nur ${m.streifen}px Leiste sichtbar sind`
                ).toBeLessThanOrEqual(TOTES_FELD_DECKEL);

                // (3) Und in der Listenspalte stehen mindestens ZWEI Eintraege
                //     gleichzeitig. Die Schwelle kommt aus dem ersten Eintrag
                //     selbst, nicht aus einer verdrahteten Zahl.
                expect(
                    m.spalteHoehe,
                    `die Listenspalte ist ${m.spalteHoehe}px hoch, ein Eintrag ${m.eintragHoehe}px — es passt nicht einmal ein zweiter hinein (Schale ${m.schaleHoehe}px, Rahmen ${m.rahmen})`
                ).toBeGreaterThanOrEqual(2 * m.eintragHoehe);

                // (4) Der Seitenueberhang bleibt 0 — die Schale scrollt selbst.
                expect(m.ueberhang, `Seitenueberhang ${m.ueberhang}px (Rahmen ${m.rahmen})`).toBe(
                    0
                );

                // (5) Und der letzte Eintrag bleibt per Mausrad erreichbar UND
                //     unverdeckt — die Leiste darf nichts schlucken.
                expect(
                    m.letzterImFenster,
                    `der letzte von ${m.anzahl} Eintraegen ist nach dem Rollen nicht im Fenster (Spalte ${m.spalteScrollStand})`
                ).toBe(true);
                expect(
                    m.letzterKlickbar,
                    `der letzte Eintrag ist verdeckt von ${m.letzterVerdeckerKlasse}`
                ).toBe(true);
            });
        }
    }

    for (const theme of THEMES) {
        test(`in allen Themes gleich: ${theme}`, async ({ page }) => {
            await page.setViewportSize({ width: 360, height: 740 });
            await appLaden(page, theme);
            await reiterUndRollen(page, 'npcs', '.npc-master');
            const m = await page.evaluate(messeLeistenplatz, [
                '.npc-view.active',
                '.npc-master',
                '#npc-list'
            ]);
            console.log(`[M2b] Theme ${theme}: ${JSON.stringify(m)}`);
            expect(m.koerperUnten + m.inhaltRandUnten, 'doppelte Reservierung').toBeLessThanOrEqual(
                70
            );
            expect(m.totesFeld, `totes Feld ${m.totesFeld}px`).toBeLessThanOrEqual(
                TOTES_FELD_DECKEL
            );
            expect(
                m.spalteHoehe,
                `Listenspalte ${m.spalteHoehe}px bei ${m.eintragHoehe}px Eintragshoehe`
            ).toBeGreaterThanOrEqual(2 * m.eintragHoehe);
            expect(
                m.letzterKlickbar,
                `letzter Eintrag verdeckt von ${m.letzterVerdeckerKlasse}`
            ).toBe(true);
        });
    }
});

// ============================================================
// (c) Das Hinweisband auf Telefonbreite
// ============================================================
test.describe('Umzugs-Hinweisband auf Telefonbreite (M2c)', () => {
    for (const [breite, hoehe] of BAND_FENSTER) {
        test(`bei ${breite}x${hoehe} bleibt das Band innerhalb zweier Tippreihen`, async ({
            page
        }) => {
            await page.setViewportSize({ width: breite, height: hoehe });
            await appLaden(page);
            const m = await page.evaluate(messeBand);
            console.log(`[M2c] ${breite}x${hoehe}: ${JSON.stringify(m)}`);

            expect(m.da, 'der Fall braucht das stehende Umzugs-Band').toBe(true);
            expect(
                m.hoehe,
                `das Band ist ${m.hoehe}px hoch (${m.anteil}% des Fensters), Text allein ${m.textHoehe}px: "${m.textInhalt}"`
            ).toBeLessThanOrEqual(BAND_DECKEL);

            // Der Hinweis bleibt ein Hinweis MIT Ausweg: BEIDE Knoepfe muessen
            // erreichbar bleiben, sonst waere das Band nur kuerzer und nicht
            // besser. Das ist die Zusicherung gegen die Ueberlappung mit der
            // Mobil-Kopfzeile (siehe Kopfkommentar) — vor der Korrektur war der
            // Umzugs-Knopf bei 390px verdeckt und der Schliessknopf kippte bei
            // 320/360px mit der Kuerzung hinterher.
            expect(m.umzug, `"Zum App-Umzug" ist ${m.umzug}`).toBe('frei');
            expect(m.schliessen, `der Schliessknopf ist ${m.schliessen}`).toBe('frei');

            // Und die Gegenrechnung am Seiteninhalt traegt die neue Isthoehe —
            // sonst waere das Band kuerzer und der Inhalt trotzdem verschoben.
            expect(
                m.koerperOben,
                `der body-Innenabstand muss die Bandhoehe tragen (${m.koerperOben} bei ${m.hoehe}px Band)`
            ).toBe(`${m.hoehe}px`);

            // Die beiden festen Kopfbloecke stehen UEBEREINANDER, nicht
            // aufeinander: das Band beginnt an der Unterkante der Mobil-Kopfzeile.
            expect(
                m.oben,
                `das Band beginnt bei ${m.oben}px, die Mobil-Kopfzeile endet bei ${m.mobilKopfUnten}px`
            ).toBe(m.mobilKopfUnten);

            // Und es endet, wo der Inhalt anfaengt — kein Bildpunkt Ueberdeckung,
            // kein Bildpunkt Leerlauf.
            expect(
                m.inhaltOben,
                `das Band endet bei ${m.unten}px, der Inhalt beginnt bei ${m.inhaltOben}px`
            ).toBe(m.unten);
        });
    }

    for (const theme of THEMES) {
        test(`in allen Themes gleich: ${theme}`, async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await appLaden(page, theme);
            const m = await page.evaluate(messeBand);
            console.log(`[M2c] Theme ${theme}: ${JSON.stringify(m)}`);
            expect(m.da, 'der Fall braucht das stehende Umzugs-Band').toBe(true);
            expect(m.hoehe, `Band ${m.hoehe}px, Text "${m.textInhalt}"`).toBeLessThanOrEqual(
                BAND_DECKEL
            );
            expect(m.umzug, `"Zum App-Umzug" ist ${m.umzug}`).toBe('frei');
            expect(m.schliessen, `der Schliessknopf ist ${m.schliessen}`).toBe('frei');
        });
    }

    /* Die Gegenprobe: im BREITEN Fenster bleibt der volle Satz stehen. Ohne
       diesen Fall koennte die Korrektur den Hinweis ueberall verkuerzen, und
       niemand haette es gemerkt. */
    test('im breiten Fenster bleibt der vollstaendige Hinweis stehen', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await appLaden(page);
        const m = await page.evaluate(messeBand);
        console.log(`[M2c] 1440x800: ${JSON.stringify(m)}`);
        expect(m.da, 'der Fall braucht das stehende Umzugs-Band').toBe(true);
        expect(
            m.textInhalt,
            `der breite Hinweis lautet "${m.textInhalt}" — der erklaerende Halbsatz fehlt`
        ).toMatch(/verlustfrei/);
        expect(m.hoehe, `Band ${m.hoehe}px im breiten Fenster`).toBeLessThanOrEqual(70);
    });
});
