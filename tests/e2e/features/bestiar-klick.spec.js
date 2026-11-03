// @ts-check
/**
 * Der Waechter des ersten Klicks und der Listenlage (BESTIAR-KLICK)
 * ================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in zwei Saetzen: **nach dem Tippen in ein
 * Suchfeld waehlt der ERSTE Klick oder Tap auf einen Treffer diesen Treffer** —
 * im Bestiar wie in jeder anderen Liste, die beim Verlassen des Feldes neu
 * gezeichnet wurde. Und **die ungefilterte Bestiar-Liste bleibt stehen, wenn
 * man in ihr waehlt**: der gewaehlte Eintrag bleibt gezeichnet, sichtbar,
 * markiert und fokussiert; nach oben geht sie nur, wenn sich der FILTER
 * geaendert hat.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND — GEMESSEN am Buendel zu 71dd26b6, Chromium, echte Klicks, Taps
 * und Tasten
 *
 * A) DER ERSTE KLICK WIRD VERSCHLUCKT. Bestiar, "gob" tippen (3 Treffer), den
 *    Goblin anklicken: nach Klick 1 ist `selectedBestiaryId` null und das
 *    Detail leer, erst Klick 2 waehlt. Gleich in dev und prod, mit Maus, mit
 *    `page.mouse` auf festen Koordinaten, nach 2 s Wartezeit (keine
 *    Zeitfrage) und mit dem Finger bei 390x844 und 320x568. Der ★ des Goblin
 *    ebenso (Favoriten nach Klick 1 noch []). Die Ereignisfolge bei Klick 1:
 *
 *      pointerdown/mousedown auf SPAN.bestiary-name
 *      change auf #bestiary-search        <- das Feld verliert den Fokus
 *      Liste neu gezeichnet               <- der mousedown-Knoten ist weg
 *      focusout
 *      pointerup/mouseup auf dem FRISCHEN SPAN, mousedown-Ziel isConnected false
 *      — kein click, auch nicht am gemeinsamen Vorfahren
 *
 *    DIESELBE KLASSE IN ANDEREN LISTEN, je mit derselben Spur gemessen: NSC
 *    ("r", Cora), Orte, Auftraege, Encounter, Gruppe, Truhe — und Felder mit
 *    ANDEREN Aktionen als `search-input`: das Wiki-Suchfeld (der Aufklapp
 *    wird per innerHTML neu geschrieben), "Zauber zuweisen" ("feu",
 *    Feuerball braucht 2 Klicks bis zum Haken), "Items zuweisen" ("rub",
 *    "+" laesst die Menge auf 0) und die Notizen-Suche (System -> Debug ->
 *    Notizen-Suche, `search-notes`; "dra", der Treffer angeklickt: die
 *    Suche bleibt offen, die Notizen-Ansicht oeffnet nicht — nachgetragen in
 *    der Endpruefung). Die Zaubersuche ist die Gegenprobe: sie
 *    zeichnet ENTPRELLT (150 ms), der Klick ist durch, bevor die Liste
 *    wechselt.
 *
 * B) DIE LISTE SPRINGT NACH OBEN. Ungefiltert (112 SRD-Monster) zeichnet die
 *    virtuelle Liste nur ihr Fenster; dass der Goblin (Index 18) bei
 *    scrollTop 0 fehlt, ist RICHTIG. Falsch ist: per Rad bis zum Goblin
 *    rollen (scrollTop 480), ihn anklicken — danach scrollTop 0 (in ~11 ms),
 *    der Goblin nicht mehr gezeichnet, nicht sichtbar, nicht markiert, und
 *    der Fokus auf "stammeskrieger" (dieselbe Kindposition im neuen
 *    Fenster). Telefon 900 -> 0. Mit der Tastatur schlimmer: Tab in die
 *    Liste, Pfeil bis zum Goblin, Enter — scrollTop 683 -> 0, Fokus auf
 *    "giftschlange", und das ZWEITE Enter waehlt die Giftschlange. Ein Klick
 *    ins Suchfeld OHNE Tippen springt ebenfalls (480 -> 0). Die Scrollhoehe
 *    luegt: 952 statt 112 x 52 = 5824.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE URSACHE
 *
 * A) Das Textfeld traegt `data-action="search-input"`, und
 *    `ui/event-delegation.js` stellt dieselbe Aktion fuer `input` UND
 *    `change` zu. Die Suche ist beim Tippen laengst gezeichnet; das `change`,
 *    das Chromium beim Verlassen des Feldes SYNCHRON waehrend der
 *    Standardbehandlung des mousedown feuert, zeichnet die unveraenderte
 *    Liste ein zweites Mal — per innerHTML. Ohne mousedown-Knoten im Dokument
 *    entsteht aus mousedown und mouseup kein click.
 * B) Die Huelle des Rollwerks (VirtualScroll) bekommt
 *    `height = Treffer x 52`, ist aber ein Flex-Element von `#bestiary-list`
 *    (display:flex, column). Mit `flex-shrink: 1` und einer automatischen
 *    Mindesthoehe von 0 (ihr einziges Kind ist absolut positioniert)
 *    schrumpft sie auf 539 px. Jedes Neuzeichnen geht ueber
 *    `VirtualScroll.create`, das den Behaelter leert — bei
 *    scrollHeight = clientHeight klemmt der Browser scrollTop auf 0.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (Kritik zu BESTIAR-KLICK, R1–R6)
 *
 * R1  Zentral in `ui/event-delegation.js`, NUR im data-action-Zweig: ein
 *     `change` auf einem textartigen INPUT (text, search, url, email, tel,
 *     password, number) wird nicht zugestellt, wenn derselbe Handler fuer
 *     dieses Element den IDENTISCHEN Wert schon per `input` bekam. Unberuehrt:
 *     der Legacy-Zweig `data-on-change` (validateAssignItemQty haengt NUR an
 *     change), SELECT, checkbox, radio, file, range/date. Ein Fix nur in
 *     'search-input' erfuellt den Vertrag NICHT — (W5) ist dafuer da. Die
 *     Entscheidungstabelle von R1 haelt
 *     `tests/unit/event-delegation-change.test.js` fest. Die TYPSCHRANKE
 *     sieht man am Bildschirm nur am Datei-Input: der Markdown-Import und
 *     das Soundboard lesen ihre Datei NUR beim change, und ohne die Schranke
 *     sind `markdown-austausch.spec.js` und `soundboard.spec.js` rot (21 von
 *     31, am Mutanten gemessen). Bei SELECT und checkbox hat das `input` die
 *     Arbeit schon getan — ein geschlucktes change aendert dort nichts
 *     Sichtbares, darum behaupten die (W6)-Faelle dazu nichts.
 * R2  Die Huelle schrumpft nicht: VirtualScroll.create setzt inline
 *     `flex-shrink: 0` (oder `flex: none`). Keine Klasse an der Huelle, keine
 *     neue Regel in bestiary.css, keine neue innerHTML-Senke.
 * R3  `renderBestiaryList` merkt sich eine Filtersignatur (Suchwert, HG, Typ,
 *     Nur Eigene, Favoriten). UNVERAENDERT (Auswahl, ★, Klick ins Suchfeld):
 *     die Lage bleibt. GEAENDERT: scrollTop ausdruecklich 0, die erste
 *     sichtbare Zeile ist der erste Treffer. NICHT zulaessig ist "nach oben
 *     bei jeder search-input-Aktion": der Klick ins Feld ruft diese Aktion
 *     schon (W9).
 * R4  Zeilenhoehe 52, Puffer und Fensterhoehe bleiben; kein neuer
 *     Stil-Sollstand; das Ueberhang-Dach von hoehenbudget bleibt 4.
 * R5  Tests nennen die Pfade des Rollwerks und der Wiki-Aktionen nicht
 *     woertlich — beide stehen auf der Ausnahmeliste der Modulabdeckung, und
 *     eine Nennung macht deren Ratsche rot. Diese Datei spricht darum vom
 *     "Rollwerk" und vom "Wiki-Suchfeld".
 * R6  Doku (Katalog, WUERFEL Offen (4)) — kein Fall hier.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE FAELLE und ihr Stand am unveraenderten Buendel (71dd26b6)
 *
 *   (W1)  Bestiar "gob", EIN Klick, dev und prod           rot (null, Detail leer)
 *   (W2)  dasselbe per Tap, 390x844 und 320x568            rot
 *   (W3)  ★ des Goblin nach "gob", EIN Klick               rot (Favoriten ohne goblin)
 *   (W4)  Querschnitt NSC/Orte/Auftraege/Encounter/
 *         Gruppe/Truhe, ERSTER Klick                       rot je Ansicht
 *         Gegenprobe Zauber (entprellt)                    gruen
 *   (W5)  andere Aktionen: Wiki, Zauber zuweisen,
 *         Items zuweisen, Notizen-Suche                    rot je Feld
 *   (W6)  Gegenproben: HG per Tastatur, Favoriten-
 *         Kaestchen, Kopfsuche, Item-Menge (reiner
 *         change-Pfad), Enter vor dem Klick                gruen
 *   (W7)  gerollt, Goblin per Klick/Tap waehlen,
 *         1440x900, 900x800, 390x844; dazu der ★           rot (Lage 480 -> 0)
 *   (W8)  Tastatur: Tab, Pfeil bis Goblin, Enter, Enter    rot (Giftschlange)
 *   (W9)  gerollt, Klick ins Suchfeld ohne Tippen          rot (480 -> 0)
 *   (W10) gerollt, je ein Teil der Filtersignatur
 *         geaendert — "e" tippen, HG per Tastatur, Typ
 *         per Tastatur, "Nur Eigene", Favoriten
 *         -> oben, erste Zeile = erster Treffer            gruen — RUECKSCHRITT-
 *         WAECHTER: mit R2 allein (Lage gehalten) rot,
 *         und je Teil rot, wenn er in der Signatur fehlt
 *   (W11) Scrollhoehe >= n x 52; Form der Huelle (R2)      rot (952; kein flex-shrink)
 *   (W12) Listenende: letzte Zeile voll sichtbar,
 *         Ueberhang <= Dach, keine Luecke                  gruen
 *
 * WAS DIESE DATEI NICHT VERLANGT (Vertrag "NICHT IM PR"): Zeilenhoehe 56 oder
 * eine gemessene Zeile; die Fensterhoehe des Rollwerks nach einem
 * Groessenwechsel; das ✕ fuer bestiary-, sessionprep-, kalender- und
 * fraktionen-search; eine Aenderung an der Zustellung von data-action beim
 * Klick auf Text-INPUTs (nur ueber (W9) abgesichert).
 *
 * BEDIENWEG: nur echte Navigation, Klicks, Taps, Tasten und das Mausrad ueber
 * der Listenmitte. `evaluate` saet nur VOR dem Laden (addInitScript) und liest
 * ab — auch die erwarteten Trefferlisten werden aus dem Buendel GELESEN
 * (getSRDMonsters, applyFilters, crToSortValue), nicht hier abgetippt.
 */
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = process.cwd().replace(/\\/g, '/');
const DEV = `file:///${WURZEL}/dist/dnd-tracker-bundled.html`;
const PROD = `file:///${WURZEL}/dist/dnd-tracker-optimized.html`;
/** Der CI-Job `e2e` baut nur dev (`python build.py`); den prod-Fall gibt es
 *  nur mit einem frischen `python build.py --production`. */
const PROD_DA = existsSync(join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));

const SPEICHER = 'dnd-tracker-v4';

const BREIT = { width: 1440, height: 900 };
const GRENZE = { width: 900, height: 800 };
const TELEFON = { width: 390, height: 844 };
const KLEIN = { width: 320, height: 568 };

/** Die Zeilenhoehe, die die Liste dem Rollwerk meldet (R4: bleibt 52). */
const ZEILE = 52;
/** Das Ueberhang-Dach aus hoehenbudget.spec.js (UEBERHANG_DACH_BESTIAR, R4). */
const UEBERHANG_DACH = 4;
/** Ab so vielen Treffern zeichnet das Rollwerk virtuell. */
const VIRTUELL_AB = 50;
/** Zeit fuer Zeichnen, Fokusrueckgabe (rAF) und gedrosseltes Rollen. */
const SETZEN_MS = 400;

const GOBLIN = '#bestiary-list .bestiary-list-item[data-id="goblin"][data-source="srd"]';

/** WEICHE Zusicherungen fuer die Ergebnisse: ein roter Lauf nennt JEDE
 *  gebrochene Zusage (Auswahl, Lage, Sicht, Markierung, Fokus), nicht nur die
 *  erste. Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

/**
 * Die Saat: sauberer Zustand, dazu je Ansicht ein Ziel, das NICHT die
 * automatische Vorauswahl ist (sonst misst der erste Klick nichts — gemessen:
 * Orte und Truhe waehlen nach der Suche den ersten Treffer selbst aus, darum
 * gibt es je zwei Treffer und das Ziel ist der zweite).
 * @param {{eigene?: number, eigeneFavoriten?: boolean}} [opt] eigene Kreaturen
 *   (HG 30, Typ Konstrukt, ans Listenende); `eigeneFavoriten` macht sie alle
 *   zusaetzlich zu Favoriten (Schluessel 'custom:<id>', wie
 *   toggleBestiaryFavorite ihn bildet)
 */
function saat(opt = {}) {
    const eigene = opt.eigene || 0;
    const bestiary = [];
    for (let i = 1; i <= eigene; i++) {
        bestiary.push({
            id: i,
            name: 'Eigenwesen ' + String(i).padStart(2, '0'),
            cr: '30',
            creatureType: 'Konstrukt',
            size: 'Mittel',
            ac: 12,
            hp: 10,
            str: 10,
            dex: 10,
            con: 10,
            int: 10,
            wis: 10,
            cha: 10
        });
    }
    return {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            enableMarkdownShortcuts: true,
            markdownOnboardingSeen: true,
            levelingMode: 'xp'
        },
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        characters: [
            {
                id: 1,
                name: 'Anna',
                characterClass: 'Magier',
                level: 5,
                hp: 20,
                maxHp: 20,
                ac: 12,
                spells: []
            },
            {
                id: 2,
                name: 'Rurik',
                characterClass: 'Kaempfer',
                level: 5,
                hp: 40,
                maxHp: 40,
                ac: 17
            }
        ],
        spells: [
            {
                id: 1,
                name: 'Feuerball',
                level: 3,
                school: 'Hervorrufung',
                spellClass: 'Magier',
                description: ''
            },
            {
                id: 2,
                name: 'Feuerpfeil',
                level: 0,
                school: 'Hervorrufung',
                spellClass: 'Magier',
                description: ''
            },
            {
                id: 3,
                name: 'Magisches Geschoss',
                level: 1,
                school: 'Hervorrufung',
                spellClass: 'Magier',
                description: ''
            },
            {
                id: 4,
                name: 'Schild',
                level: 1,
                school: 'Bannmagie',
                spellClass: 'Magier',
                description: ''
            },
            {
                id: 5,
                name: 'Feuerschild',
                level: 4,
                school: 'Hervorrufung',
                spellClass: 'Magier',
                description: ''
            }
        ],
        npcs: [
            {
                id: 1,
                name: 'Alrik',
                race: 'Mensch',
                occupation: 'Wirt',
                description: '',
                tags: [],
                relations: []
            },
            {
                id: 2,
                name: 'Bertram',
                race: 'Zwerg',
                occupation: 'Schmied',
                description: '',
                tags: [],
                relations: []
            },
            {
                id: 3,
                name: 'Cora',
                race: 'Elf',
                occupation: 'Jaegerin',
                description: '',
                tags: [],
                relations: []
            }
        ],
        locations: [
            { id: 1, name: 'Eichtal', type: 'Dorf', description: '' },
            { id: 2, name: 'Rabenau', type: 'Dorf', description: '' },
            { id: 3, name: 'Rabenfels', type: 'Stadt', description: '' }
        ],
        quests: [
            { id: 1, title: 'Erbstueck', description: '', completed: false },
            { id: 2, title: 'Rattenplage', description: '', completed: false }
        ],
        encounters: [
            { id: 1, name: 'Wolfsrudel', cr: '1', creatureType: 'Tier', ac: 13, hp: 11 },
            { id: 2, name: 'Raeuberbande', cr: '1', creatureType: 'Humanoid', ac: 12, hp: 10 },
            { id: 3, name: 'Rattenschwarm', cr: '1', creatureType: 'Tier', ac: 10, hp: 8 }
        ],
        loot: [
            {
                id: 1,
                name: 'Heiltrank',
                category: 'potions',
                value: 50,
                quantity: 2,
                description: ''
            },
            {
                id: 2,
                name: 'Rubinkrone',
                category: 'misc',
                value: 50,
                quantity: 1,
                description: ''
            },
            { id: 3, name: 'Rubinring', category: 'misc', value: 50, quantity: 3, description: '' }
        ],
        wiki: [
            { id: 1, title: 'Eichtal', content: '<p>Dorf</p>', category: 'locations', tags: [] },
            {
                id: 2,
                title: 'Rabenfels',
                content: '<p>Stadt im Norden</p>',
                category: 'locations',
                tags: []
            }
        ],
        // Zwei Sitzungsnotizen, beide Treffer fuer "dra" (W5 Notizen-Suche);
        // das Ziel ist die zweite, wie bei den Listen oben.
        sessionNotes: [
            {
                id: 1,
                number: 1,
                date: '2026-10-01',
                name: 'Am Berg',
                summary: '',
                tags: [],
                content: '<p>Der Drache schlaeft</p>'
            },
            {
                id: 2,
                number: 2,
                date: '2026-10-08',
                name: 'Im Hort',
                summary: '',
                tags: [],
                content: '<p>Drachenhort entdeckt</p>'
            }
        ],
        bestiary,
        // Zwei Favoriten fuer die Gegenprobe (W6): der Haken muss genau sie
        // zeigen. Der Goblin ist bewusst KEINER — (W3) braucht ihn frei. Mit
        // `eigeneFavoriten` kommen die eigenen Kreaturen dazu, damit der Haken
        // die Liste virtuell laesst (W10).
        bestiaryFavorites: ['adler', 'kraken'].concat(
            opt.eigeneFavoriten ? bestiary.map(m => 'custom:' + m.id) : []
        ),
        _nextId: {
            characters: 3,
            npcs: 4,
            locations: 4,
            quests: 3,
            encounters: 4,
            spells: 6,
            loot: 4,
            items: 1,
            wiki: 3,
            sessionNotes: 3,
            randomTables: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` (ohne Netzrauschen der Schriften unter file://) und Dialoge.
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0]);
        }
    });
    page.on('dialog', d => {
        fehler.push('dialog: ' + d.message());
        d.dismiss().catch(() => {});
    });
    return fehler;
}

/**
 * Saet (einmal je Tab, VOR dem Laden), laedt und wartet die fremde
 * Speicherung ab: `load()` repariert die Saat und plant ~1 s spaeter eine
 * Speicherung, die `_version` neu schreibt. Kommt binnen 4 s keine, steht
 * auch keine aus. Gewartet wird auf `appReady`, nicht auf `.app-title` — die
 * ist im Mobil-Layout versteckt.
 * @param {import('@playwright/test').Page} page
 * @param {{url?: string, eigene?: number, eigeneFavoriten?: boolean}} [opt]
 */
async function laden(page, opt = {}) {
    const fehler = fehlerFangen(page);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (sessionStorage.getItem('bestiar-klick-gesaet')) return;
                sessionStorage.setItem('bestiar-klick-gesaet', '1');
                localStorage.setItem(schluessel, JSON.stringify(s));
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, saat({ eigene: opt.eigene, eigeneFavoriten: opt.eigeneFavoriten })]
    );
    await page.goto(opt.url || DEV);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 15000
    });
    await page
        .waitForFunction(
            schluessel => {
                try {
                    return (
                        JSON.parse(localStorage.getItem(schluessel) || '{}')._version !== '99.0.0'
                    );
                } catch {
                    return false;
                }
            },
            SPEICHER,
            { timeout: 4000 }
        )
        .catch(() => {});
    return fehler;
}

/**
 * Mitte eines Elements und ob dort wirklich es selbst (oder ein Kind)
 * obenauf liegt. Fuer Taps auf freie Koordinaten.
 * @param {import('@playwright/test').Page} page @param {string} sel
 */
function mitteFrei(page, sel) {
    return page.evaluate(s => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = Math.round(r.left + r.width / 2);
        const y = Math.round(r.top + r.height / 2);
        const oben = document.elementFromPoint(x, y);
        return { x, y, frei: !!oben && (oben === el || el.contains(oben)) };
    }, sel);
}

/**
 * Zur Ansicht ueber die ECHTE Navigation. Desktop: Gruppe aufklappen, Reiter
 * klicken. Telefon: Leiste per Tap ausfahren, Reiter auf freien Koordinaten
 * antippen, Leiste wieder einfahren.
 * @param {import('@playwright/test').Page} page @param {string} ansicht
 */
async function zurAnsicht(page, ansicht) {
    const reiterSel = `.nav-tab[data-view="${ansicht}"]`;
    const mobil = await page.evaluate(() => document.documentElement.dataset.layout === 'mobile');
    if (mobil) {
        const u = await mitteFrei(page, '.mobile-nav-toggle');
        expect(u && u.frei, 'Vorbedingung: der Umschalter der Leiste ist frei').toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (u).x, /** @type {any} */ (u).y);
        await page.waitForTimeout(450);
        await page.locator(reiterSel).scrollIntoViewIfNeeded();
        let m = null;
        for (let i = 0; i < 40; i++) {
            m = await mitteFrei(page, reiterSel);
            if (m && m.frei) break;
            await page.waitForTimeout(150);
        }
        expect(m && m.frei, `Vorbedingung: der Reiter ${ansicht} ist frei`).toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (m).x, /** @type {any} */ (m).y);
        await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
        await page.waitForTimeout(450);
        const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
        if (offen) {
            const u2 = await mitteFrei(page, '.mobile-nav-toggle');
            await page.touchscreen.tap(/** @type {any} */ (u2).x, /** @type {any} */ (u2).y);
            await page.waitForTimeout(450);
        }
        return;
    }
    const reiter = page.locator(reiterSel);
    if (!(await reiter.isVisible())) {
        await page.locator('.nav-group', { has: reiter }).locator('.nav-group-btn').click();
        await page.waitForTimeout(150);
    }
    await reiter.click();
    await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(300);
}

/**
 * Der Zustand der Bestiar-Liste, wie der Spielleiter ihn sieht. Nur Ablesen.
 * Sichtbar heisst: VOLL im Klippbereich von #bestiary-list.
 * @param {import('@playwright/test').Page} page
 */
function listenZustand(page) {
    return page.evaluate(sel => {
        const w = /** @type {any} */ (window);
        const c = /** @type {HTMLElement} */ (document.getElementById('bestiary-list'));
        const cr = c.getBoundingClientRect();
        const oben = cr.top + c.clientTop;
        const unten = oben + c.clientHeight;
        const zeilen = Array.from(c.querySelectorAll('.bestiary-list-item')).sort(
            (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
        );
        const erste = zeilen.find(z => z.getBoundingClientRect().bottom > oben + 1);
        const g = document.querySelector(sel);
        let sichtbar = false;
        if (g) {
            const r = g.getBoundingClientRect();
            sichtbar = r.top >= oben - 0.5 && r.bottom <= unten + 0.5;
        }
        const a = /** @type {HTMLElement|null} */ (document.activeElement);
        let aktiv = 'nichts';
        if (a && a.classList && a.classList.contains('bestiary-list-item')) {
            aktiv = a.dataset.id || '?';
        } else if (a) {
            aktiv = a.tagName + (a.id ? '#' + a.id : '');
        }
        const panel = document.querySelector('#bestiary-detail-panel .bestiary-detail-name');
        return {
            gewaehlt: typeof selectedBestiaryId === 'undefined' ? 'fehlt' : selectedBestiaryId,
            detail: panel ? (panel.textContent || '').trim() : '',
            scrollTop: c.scrollTop,
            scrollHeight: c.scrollHeight,
            clientHeight: c.clientHeight,
            gezeichnet: zeilen.length,
            ersteSichtbare: erste
                ? /** @type {HTMLElement} */ (erste).dataset.id +
                  ':' +
                  /** @type {HTMLElement} */ (erste).dataset.source
                : null,
            goblinDa: !!g,
            goblinSichtbar: sichtbar,
            goblinMarkiert: !!(g && g.classList.contains('selected')),
            aktiv,
            favoriten: w.D && w.D.bestiaryFavorites ? w.D.bestiaryFavorites.slice() : null
        };
    }, GOBLIN);
}

/**
 * Die Trefferliste, wie renderBestiaryList sie bildet — aus dem Buendel
 * GELESEN (SRD plus eigene, applyFilters, isBestiaryFavorite, Sortierung nach
 * HG und Name).
 * @param {import('@playwright/test').Page} page
 * @param {{suche?: string, hg?: string, typ?: string, nurEigene?: boolean, nurFavoriten?: boolean}} f
 * @returns {Promise<{n: number, erste: string, letzte: string}>}
 */
function treffer(page, f) {
    return page.evaluate(filter => {
        const w = /** @type {any} */ (window);
        const alle = getSRDMonsters()
            .map(m => Object.assign({}, m, { source: 'srd' }))
            .concat((w.D.bestiary || []).map(m => Object.assign({}, m, { source: 'custom' })));
        const liste = applyFilters(alle, {
            searchText: filter.suche || '',
            searchFields: ['name', 'creatureType'],
            filters: { cr: filter.hg || '', creatureType: filter.typ || '' },
            customFilter: m =>
                (!filter.nurEigene || m.source === 'custom') &&
                (!filter.nurFavoriten || w.isBestiaryFavorite(m))
        });
        liste.sort(
            (a, b) =>
                crToSortValue(a.cr) - crToSortValue(b.cr) ||
                (a.name || '').localeCompare(b.name || '')
        );
        const key = m => (m.source === 'custom' ? m.id : m._id) + ':' + m.source;
        return { n: liste.length, erste: key(liste[0]), letzte: key(liste[liste.length - 1]) };
    }, f);
}

/**
 * Mausrad ueber der Listenmitte, 60 px je Schritt, bis der Goblin VOLL im
 * Sichtfeld liegt. Hart: kommt er nicht, misst der Fall nichts.
 * @param {import('@playwright/test').Page} page
 */
async function radBisGoblin(page) {
    const m = await page.evaluate(() => {
        const r = /** @type {HTMLElement} */ (
            document.getElementById('bestiary-list')
        ).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.move(m.x, m.y);
    let z = await listenZustand(page);
    for (let i = 0; i < 80 && !z.goblinSichtbar; i++) {
        await page.mouse.wheel(0, 60);
        await page.waitForTimeout(80);
        z = await listenZustand(page);
    }
    await page.waitForTimeout(200);
    z = await listenZustand(page);
    expect(z.goblinSichtbar, 'Vorbedingung: per Rad ist der Goblin voll sichtbar').toBe(true);
    expect(z.scrollTop, 'Vorbedingung: die Liste ist dafuer wirklich gerollt').toBeGreaterThan(0);
    expect(z.gewaehlt, 'Vorbedingung: noch nichts gewaehlt').toBeNull();
    return z;
}

/**
 * Alles, was (W7) bis (W9) nach der Handlung verlangen.
 * @param {Awaited<ReturnType<typeof listenZustand>>} vor
 * @param {Awaited<ReturnType<typeof listenZustand>>} nach
 * @param {boolean} [mitAuswahl] Goblin muss gewaehlt, markiert und fokussiert sein
 */
function lageGehalten(vor, nach, mitAuswahl = true) {
    weich(nach.scrollTop, 'Lage: scrollTop bleibt stehen').toBe(vor.scrollTop);
    weich(nach.goblinDa, 'die Goblin-Zeile ist weiter gezeichnet').toBe(true);
    weich(nach.goblinSichtbar, 'die Goblin-Zeile liegt voll im Sichtfeld').toBe(true);
    if (!mitAuswahl) return;
    weich(nach.gewaehlt, 'gewaehlt ist der Goblin').toBe('goblin');
    weich(nach.detail, 'das Detail zeigt den Goblin').toBe('Goblin');
    weich(nach.goblinMarkiert, 'die Goblin-Zeile traegt .selected').toBe(true);
    weich(nach.aktiv, 'der Fokus liegt auf der Goblin-Zeile, nicht auf einem fremden Monster').toBe(
        'goblin'
    );
}

/**
 * Bestiar oeffnen, ins Suchfeld klicken bzw. tippen, Begriff tippen.
 * @param {import('@playwright/test').Page} page
 * @param {string} begriff
 * @param {boolean} [tap]
 */
async function bestiarSuchen(page, begriff, tap = false) {
    await zurAnsicht(page, 'bestiary');
    const feld = page.locator('#bestiary-search');
    if (tap) await feld.tap();
    else await feld.click();
    await page.keyboard.type(begriff, { delay: 40 });
    await expect(page.locator(GOBLIN), 'Vorbedingung: der Goblin ist ein Treffer').toBeVisible();
    await page.waitForTimeout(250);
    const z = await listenZustand(page);
    expect(z.gewaehlt, 'Vorbedingung: noch nichts gewaehlt').toBeNull();
}

// ───────────────────────────────────────────────────────────────────────────
// A — DER ERSTE KLICK
// ───────────────────────────────────────────────────────────────────────────

test.describe('A: der erste Klick nach dem Tippen waehlt (Bestiar)', () => {
    test.use({ viewport: BREIT });

    for (const [buendel, url] of [
        ['dev', DEV],
        ['prod', PROD]
    ]) {
        test(`(W1) "gob" tippen, EIN Klick auf den Goblin waehlt ihn — ${buendel}`, async ({
            page
        }) => {
            test.skip(
                buendel === 'prod' && !PROD_DA,
                'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)'
            );
            const fehler = await laden(page, { url });
            await bestiarSuchen(page, 'gob');
            await page.locator(GOBLIN).click();
            await page.waitForTimeout(SETZEN_MS);
            const z = await listenZustand(page);
            weich(z.gewaehlt, 'nach EINEM Klick ist der Goblin gewaehlt').toBe('goblin');
            weich(z.detail, 'und das Detail zeigt ihn').toBe('Goblin');
            weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
        });
    }

    test('(W3) ★ des Goblin nach "gob": EIN Klick macht ihn zum Favoriten', async ({ page }) => {
        const fehler = await laden(page);
        await bestiarSuchen(page, 'gob');
        const vor = await listenZustand(page);
        expect(vor.favoriten, 'Vorbedingung: der Goblin ist noch kein Favorit').not.toContain(
            'goblin'
        );
        await page.locator(GOBLIN + ' .bestiary-fav').click();
        await page.waitForTimeout(SETZEN_MS);
        const nach = await listenZustand(page);
        weich(nach.favoriten, 'nach EINEM Klick auf ★ ist der Goblin Favorit').toContain('goblin');
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });
});

for (const [name, groesse] of [
    ['390x844', TELEFON],
    ['320x568', KLEIN]
]) {
    test.describe(`A: Telefon ${name}`, () => {
        test.use({ viewport: groesse, isMobile: true, hasTouch: true });

        test(`(W2) "gob" tippen, EIN Tap auf den Goblin waehlt ihn — ${name}`, async ({ page }) => {
            const fehler = await laden(page);
            expect(
                await page.evaluate(() => document.documentElement.dataset.layout),
                'Vorbedingung: Mobil-Layout'
            ).toBe('mobile');
            await bestiarSuchen(page, 'gob', true);
            await page.locator(GOBLIN + ' .bestiary-name').tap();
            await page.waitForTimeout(SETZEN_MS);
            const z = await listenZustand(page);
            weich(z.gewaehlt, 'nach EINEM Tap ist der Goblin gewaehlt').toBe('goblin');
            weich(z.detail, 'und das Detail zeigt ihn').toBe('Goblin');
            weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
        });
    });
}

/**
 * (W4) Der Querschnitt: dieselbe Klasse in jeder Liste, die beim Verlassen des
 * Feldes per innerHTML neu gezeichnet wird. `ziel` ist, was angeklickt wird,
 * `wirkung` muss danach genau einmal im Dokument stehen — und vorher NICHT
 * (hart geprueft, sonst misst der Fall nichts). Die Zauberliste ist die
 * Gegenprobe: sie zeichnet entprellt und ist schon heute gruen.
 */
const QUERSCHNITT = [
    {
        ansicht: 'npcs',
        feld: '#npc-search',
        begriff: 'r',
        ziel: '#npc-list .npc-item[data-id="3"] .npc-item-name',
        wirkung: '#npc-list .npc-item.selected[data-id="3"]',
        was: 'Cora ist gewaehlt'
    },
    {
        ansicht: 'locations',
        feld: '#loc-search',
        begriff: 'rab',
        ziel: '#locations-list .loc-item[data-id="3"]',
        wirkung: '#locations-list .loc-item.selected[data-id="3"]',
        was: 'Rabenfels ist gewaehlt'
    },
    {
        ansicht: 'quests',
        feld: '#quest-search',
        begriff: 'rat',
        ziel: '#quests-list .quest-header[data-id="2"] .quest-title',
        wirkung: '#quest-2.expanded',
        was: 'Rattenplage ist aufgeklappt'
    },
    {
        ansicht: 'encounter',
        feld: '#enc-search',
        begriff: 'ra',
        ziel: '#encounter-list .enc-item[data-id="3"]',
        wirkung: '#encounter-list .enc-item.selected[data-id="3"]',
        was: 'Rattenschwarm ist gewaehlt'
    },
    {
        ansicht: 'party',
        feld: '#party-search',
        begriff: 'rur',
        ziel: '#party-list .char-card-header[data-id="2"]',
        wirkung: '#char-form.open',
        feldWert: ['#edit-char-id', '2'],
        was: 'Rurik ist im Bearbeiten-Formular'
    },
    {
        ansicht: 'loot',
        feld: '#loot-search',
        begriff: 'rub',
        ziel: '#loot-list .loot-item[data-id="3"]',
        wirkung: '#loot-list .loot-item.selected[data-id="3"]',
        was: 'Rubinring ist gewaehlt'
    },
    {
        ansicht: 'spells',
        feld: '#spell-search',
        begriff: 'feu',
        ziel: '#spell-list .spell-card-header[data-id="1"] .spell-name',
        wirkung: '#spell-list .spell-card.expanded[data-spell-id="1"]',
        was: 'Feuerball ist aufgeklappt (Gegenprobe, entprellt)'
    }
];

test.describe('A: Querschnitt — jede Liste mit search-input', () => {
    test.use({ viewport: BREIT });

    for (const f of QUERSCHNITT) {
        test(`(W4) ${f.ansicht}: "${f.begriff}" tippen, der ERSTE Klick wirkt — ${f.was}`, async ({
            page
        }) => {
            const fehler = await laden(page);
            await zurAnsicht(page, f.ansicht);
            await page.locator(f.feld).click();
            await page.keyboard.type(f.begriff, { delay: 40 });
            await expect(
                page.locator(f.ziel),
                'Vorbedingung: das Ziel ist ein Treffer'
            ).toBeVisible();
            await page.waitForTimeout(300);
            await expect(
                page.locator(f.wirkung),
                'Vorbedingung: die Wirkung steht noch NICHT (keine Vorauswahl)'
            ).toHaveCount(0);
            await page.locator(f.ziel).click();
            await expect(page.locator(f.wirkung), `nach EINEM Klick: ${f.was}`).toHaveCount(1);
            if (f.feldWert) {
                await expect(page.locator(f.feldWert[0])).toHaveValue(f.feldWert[1]);
            }
            weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
        });
    }
});

test.describe('A: andere Aktionen als search-input — ein Fix nur dort reicht nicht', () => {
    test.use({ viewport: BREIT });

    test('(W5) Wiki-Suchfeld "rab": EIN Klick oeffnet den Eintrag und schliesst den Aufklapp', async ({
        page
    }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'wiki');
        await page.locator('#wiki-search').click();
        await page.keyboard.type('rab', { delay: 40 });
        const eintrag = page.locator(
            '#wiki-search-dropdown [data-action="select-wiki-entry"][data-id="2"]'
        );
        await expect(eintrag, 'Vorbedingung: Rabenfels steht im Aufklapp').toBeVisible();
        await page.waitForTimeout(300);
        expect(
            await page.evaluate(() => WikiState.selectedEntryId),
            'Vorbedingung: kein Eintrag gewaehlt'
        ).toBeNull();
        await eintrag.locator('.search-result-title').click();
        await page.waitForTimeout(SETZEN_MS);
        weich(
            await page.evaluate(() => WikiState.selectedEntryId),
            'nach EINEM Klick ist Rabenfels gewaehlt'
        ).toBe(2);
        await weich(page.locator('.wiki-detail-title'), 'und wird angezeigt').toHaveText(
            'Rabenfels'
        );
        await weich(page.locator('#wiki-search-dropdown'), 'der Aufklapp ist zu').toBeHidden();
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W5) Zauber zuweisen "feu": EIN Klick auf Feuerball hakt ihn ab', async ({ page }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'party');
        await page.locator('#party-list [data-action="show-assign-spells"][data-id="1"]').click();
        await expect(page.locator('#assign-spell-modal')).toHaveClass(/\bshow\b/);
        await page.locator('#assign-spell-search').click();
        await page.keyboard.type('feu', { delay: 40 });
        const zeile = page.locator('#assign-spell-list label.assign-spell-item', {
            hasText: 'Feuerball'
        });
        await expect(zeile, 'Vorbedingung: Feuerball ist ein Treffer').toBeVisible();
        await page.waitForTimeout(300);
        await expect(
            zeile.locator('input[type=checkbox]'),
            'Vorbedingung: noch nicht abgehakt'
        ).not.toBeChecked();
        await zeile.locator('.assign-spell-name').click();
        await expect(
            zeile.locator('input[type=checkbox]'),
            'nach EINEM Klick ist Feuerball abgehakt'
        ).toBeChecked();
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W5) Items zuweisen "rub": EIN Klick auf "+" setzt die Menge auf 1', async ({ page }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'party');
        await page.locator('#party-list [data-action="show-assign-items"][data-id="1"]').click();
        await expect(page.locator('#assign-item-modal')).toHaveClass(/\bshow\b/);
        await page.locator('#assign-item-search').click();
        await page.keyboard.type('rub', { delay: 40 });
        const zeile = page.locator('#assign-item-list .assign-item-row[data-item-id="3"]');
        await expect(zeile, 'Vorbedingung: Rubinring ist ein Treffer').toBeVisible();
        await page.waitForTimeout(300);
        const menge = zeile.locator('.assign-item-qty');
        await expect(menge, 'Vorbedingung: Menge 0').toHaveValue('0');
        await zeile.locator('[data-action="change-assign-qty"][data-value="1"]').click();
        await expect(menge, 'nach EINEM Klick auf "+" ist die Menge 1').toHaveValue('1');
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    // Das Feld traegt `search-notes`; die Treffer werden per innerHTML neu
    // geschrieben, an der Basis auch beim change, das das Verlassen des Feldes
    // feuert. Nachgetragen in der Endpruefung: R1 deckte das Feld, kein Fall
    // hielt es fest.
    test('(W5) Notizen-Suche "dra": EIN Klick auf den Treffer schliesst die Suche und oeffnet die Notizen', async ({
        page
    }) => {
        const fehler = await laden(page);
        const debug = page.locator('.nav-tab[data-action="call"][data-value="showDebugModal"]');
        await page.locator('.nav-group', { has: debug }).locator('.nav-group-btn').click();
        await debug.click();
        await expect(page.locator('#debug-modal')).toHaveClass(/\bshow\b/);
        await page
            .locator('#debug-modal [data-action="call"][data-value="showNotesSearch"]')
            .click();
        const suche = page.locator('#notes-search-modal');
        await expect(suche, 'Vorbedingung: die Notizen-Suche ist offen').toHaveClass(/\bshow\b/);
        await page.locator('#notes-search-input').click();
        await page.keyboard.type('dra', { delay: 40 });
        const eintraege = page.locator('#notes-search-results .notes-search-result');
        await expect(eintraege, 'Vorbedingung: beide Notizen sind Treffer').toHaveCount(2);
        const ziel = page.locator(
            '#notes-search-results [data-action="go-to-note"][data-value="2026-10-08"]'
        );
        await expect(ziel, 'Vorbedingung: "Im Hort" ist ein Treffer').toBeVisible();
        await page.waitForTimeout(300);
        await expect(
            page.locator('#view-notes'),
            'Vorbedingung: die Notizen-Ansicht ist noch nicht offen'
        ).not.toHaveClass(/\bactive\b/);
        await ziel.locator('.notes-search-date').click();
        await page.waitForTimeout(SETZEN_MS);
        await weich(suche, 'nach EINEM Klick ist die Notizen-Suche zu').not.toHaveClass(/\bshow\b/);
        await weich(page.locator('#view-notes'), 'und die Notizen-Ansicht ist offen').toHaveClass(
            /\bactive\b/
        );
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });
});

test.describe('A: Gegenproben — vorher und nachher gruen', () => {
    test.use({ viewport: BREIT });

    // (W6) HG und Favoriten: die Bedienung filtert weiter. Ob R1 eine SELECT
    // oder eine checkbox AUSNIMMT, koennen diese zwei Faelle nicht feststellen:
    // `input` zeichnet vor dem `change`, ein geschlucktes `change` sieht hier
    // niemand. Das halten die Entscheidungstabelle (Unit) und, am Bildschirm,
    // die Datei-Inputs von Markdown-Import und Soundboard (Kopf dieser Datei, R1).
    test('(W6) HG per Tastatur filtert', async ({ page }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        await page.locator('#bestiary-filter-cr').click();
        await page.keyboard.press('Escape');
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(SETZEN_MS);
        const wert = await page.locator('#bestiary-filter-cr').inputValue();
        expect(wert, 'Vorbedingung: der Pfeil waehlte die erste HG-Stufe').not.toBe('');
        const erwartet = await page.evaluate(
            cr => getSRDMonsters().filter(m => String(m.cr) === cr).length,
            wert
        );
        const zeilen = page.locator('#bestiary-list .bestiary-list-item');
        await expect(
            zeilen,
            `die Liste zeigt genau die ${erwartet} Monster mit HG ${wert}`
        ).toHaveCount(erwartet);
        const hg = await zeilen.locator('.bestiary-cr').allTextContents();
        weich(new Set(hg), 'und nur diese').toEqual(new Set(['HG ' + wert]));
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W6) das Favoriten-Kaestchen filtert', async ({ page }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        await page.locator('#bestiary-filter-favs').click();
        await expect(page.locator('#bestiary-filter-favs')).toBeChecked();
        const zeilen = page.locator('#bestiary-list .bestiary-list-item');
        await expect(zeilen, 'genau die zwei gesaeten Favoriten').toHaveCount(2);
        weich(
            (
                await zeilen.evaluateAll(z => z.map(e => /** @type {HTMLElement} */ (e).dataset.id))
            ).sort()
        ).toEqual(['adler', 'kraken']);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W6) Kopfsuche "Cor", EIN Klick auf den Treffer waehlt Cora', async ({ page }) => {
        const fehler = await laden(page);
        await expect(
            page.locator('#npc-list .npc-item.selected[data-id="3"]'),
            'Vorbedingung: Cora ist nicht vorausgewaehlt'
        ).toHaveCount(0);
        await page.locator('#global-search').click();
        await page.keyboard.type('Cor', { delay: 40 });
        const t = page.locator(
            '#global-search-results .search-result-item[data-type="npc"][data-id="3"]'
        );
        await expect(t, 'Vorbedingung: Cora ist ein Treffer').toBeVisible();
        await page.waitForTimeout(300);
        await t.click();
        await expect(page.locator('#view-npcs'), 'die NSC-Ansicht ist offen').toHaveClass(
            /\bactive\b/
        );
        await expect(
            page.locator('#npc-list .npc-item.selected[data-id="3"]'),
            'Cora ist gewaehlt'
        ).toHaveCount(1);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W6) Item-Menge ueber dem Bestand eintippen und Feld verlassen: sie wird geklemmt (reiner change-Pfad)', async ({
        page
    }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'party');
        await page.locator('#party-list [data-action="show-assign-items"][data-id="1"]').click();
        await expect(page.locator('#assign-item-modal')).toHaveClass(/\bshow\b/);
        const menge = page.locator('#assign-item-list .assign-item-qty[data-item-id="3"]');
        await menge.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('9');
        await expect(menge, 'Vorbedingung: eingetippt steht 9').toHaveValue('9');
        await page.keyboard.press('Tab');
        await expect(menge, 'validateAssignItemQty klemmt auf den Bestand 3').toHaveValue('3');
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W6) Enter im Suchfeld, dann EIN Klick waehlt den Goblin', async ({ page }) => {
        const fehler = await laden(page);
        await bestiarSuchen(page, 'gob');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(250);
        await page.locator(GOBLIN).click();
        await page.waitForTimeout(SETZEN_MS);
        const z = await listenZustand(page);
        weich(z.gewaehlt, 'nach EINEM Klick ist der Goblin gewaehlt').toBe('goblin');
        weich(z.detail).toBe('Goblin');
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });
});

// ───────────────────────────────────────────────────────────────────────────
// B — DIE LAGE DER UNGEFILTERTEN LISTE
// ───────────────────────────────────────────────────────────────────────────

for (const [name, groesse, mobil] of [
    ['1440x900', BREIT, false],
    ['900x800', GRENZE, false],
    ['390x844', TELEFON, true]
]) {
    test.describe(`B: Lage bei der Auswahl — ${name}`, () => {
        test.use(
            mobil ? { viewport: groesse, isMobile: true, hasTouch: true } : { viewport: groesse }
        );

        test(`(W7) gerollt bis zum Goblin, EIN ${mobil ? 'Tap' : 'Klick'}: Lage, Zeile, Markierung und Fokus bleiben — ${name}`, async ({
            page
        }) => {
            const fehler = await laden(page);
            await zurAnsicht(page, 'bestiary');
            const vor = await radBisGoblin(page);
            const name_ = page.locator(GOBLIN + ' .bestiary-name');
            if (mobil) await name_.tap();
            else await name_.click();
            await page.waitForTimeout(SETZEN_MS);
            lageGehalten(vor, await listenZustand(page));
            weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
        });
    });
}

test.describe('B: Lage bei ★, Tastatur und Feldklick — 1440x900', () => {
    test.use({ viewport: BREIT });

    test('(W7) gerollt bis zum Goblin, ★ anklicken: Lage und Zeile bleiben, der Goblin wird Favorit', async ({
        page
    }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        const vor = await radBisGoblin(page);
        await page.locator(GOBLIN + ' .bestiary-fav').click();
        await page.waitForTimeout(SETZEN_MS);
        const nach = await listenZustand(page);
        weich(nach.favoriten, 'der Goblin ist Favorit').toContain('goblin');
        lageGehalten(vor, nach, false);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W8) Tastatur: Tab in die Liste, Pfeil bis zum Goblin, Enter, Enter — beide Male der Goblin', async ({
        page
    }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        /** @returns {Promise<{aktion: string|undefined, id: string|undefined}>} */
        const fokus = () =>
            page.evaluate(() => {
                const a = /** @type {HTMLElement|null} */ (document.activeElement);
                return { aktion: a?.dataset?.action, id: a?.dataset?.id };
            });
        let f = await fokus();
        for (let i = 0; i < 40 && f.aktion !== 'bestiary-select'; i++) {
            await page.keyboard.press('Tab');
            f = await fokus();
        }
        expect(f.aktion, 'Vorbedingung: per Tab in der Liste angekommen').toBe('bestiary-select');
        for (let i = 0; i < 40 && f.id !== 'goblin'; i++) {
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(60);
            f = await fokus();
        }
        expect(f.id, 'Vorbedingung: per Pfeil auf dem Goblin').toBe('goblin');
        await page.waitForTimeout(200);
        const vor = await listenZustand(page);
        expect(vor.scrollTop, 'Vorbedingung: die Liste ist dafuer gerollt').toBeGreaterThan(0);

        await page.keyboard.press('Enter');
        await page.waitForTimeout(SETZEN_MS);
        lageGehalten(vor, await listenZustand(page));

        await page.keyboard.press('Enter');
        await page.waitForTimeout(SETZEN_MS);
        const nach2 = await listenZustand(page);
        weich(
            nach2.gewaehlt,
            'das ZWEITE Enter waehlt weiter den Goblin, kein fremdes Monster'
        ).toBe('goblin');
        lageGehalten(vor, nach2);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W9) gerollt, Klick ins Suchfeld OHNE Tippen: die Lage bleibt', async ({ page }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        const vor = await radBisGoblin(page);
        await page.locator('#bestiary-search').click();
        await page.waitForTimeout(SETZEN_MS);
        lageGehalten(vor, await listenZustand(page), false);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });
});

test.describe('B: geaenderter Filter -> nach oben (Rueckschritt-Waechter zu R2 allein)', () => {
    test.use({ viewport: BREIT });

    test('(W10) gerollt, "e" tippen: oben, die erste sichtbare Zeile ist der erste Treffer', async ({
        page
    }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        await radBisGoblin(page);
        await page.locator('#bestiary-search').click();
        await page.keyboard.type('e', { delay: 40 });
        await page.waitForTimeout(SETZEN_MS);
        const t = await treffer(page, { suche: 'e' });
        expect(t.n, 'Vorbedingung: "e" laesst die Liste virtuell').toBeGreaterThanOrEqual(
            VIRTUELL_AB
        );
        const z = await listenZustand(page);
        weich(z.scrollTop, 'der neue Suchwert setzt die Liste nach oben').toBe(0);
        weich(z.ersteSichtbare, 'die erste sichtbare Zeile ist der erste Treffer').toBe(t.erste);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W10) gerollt, "Nur Eigene" anhaken (60 eigene): oben, die erste sichtbare Zeile ist der erste Treffer', async ({
        page
    }) => {
        const fehler = await laden(page, { eigene: 60 });
        await zurAnsicht(page, 'bestiary');
        await radBisGoblin(page);
        await page.locator('#bestiary-filter-custom').click();
        await expect(page.locator('#bestiary-filter-custom')).toBeChecked();
        await page.waitForTimeout(SETZEN_MS);
        const t = await treffer(page, { nurEigene: true });
        expect(t.n, 'Vorbedingung: der Filter laesst die Liste virtuell').toBeGreaterThanOrEqual(
            VIRTUELL_AB
        );
        const z = await listenZustand(page);
        weich(z.scrollTop, 'der geaenderte Filter setzt die Liste nach oben').toBe(0);
        weich(z.ersteSichtbare, 'die erste sichtbare Zeile ist der erste Treffer').toBe(t.erste);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    // Die drei uebrigen Teile der Filtersignatur (R3: Suchwert, HG, Typ, Nur
    // Eigene, Favoriten). Gemessen in der Nachpruefung: ein Mutant, dessen
    // Signatur nur Suchwert und "Nur Eigene" kennt, bestand die beiden Faelle
    // oben — und liess die Liste nach einem HG-, Typ- oder Favoritenwechsel in
    // der Mitte der neuen Trefferliste stehen (Typ "Tier" bei scrollTop 480:
    // erste sichtbare Zeile "giftschlange" statt "adler"). Je Teil darum ein
    // Fall, jeder mit >= 50 Treffern, damit die Liste virtuell bleibt und die
    // alte Lage ueberhaupt halten KOENNTE.

    test('(W10) gerollt, HG per Tastatur auf die hoechste Stufe (60 eigene, HG 30): oben, die erste sichtbare Zeile ist der erste Treffer', async ({
        page
    }) => {
        const fehler = await laden(page, { eigene: 60 });
        await zurAnsicht(page, 'bestiary');
        await radBisGoblin(page);
        const hg = page.locator('#bestiary-filter-cr');
        await hg.click();
        await page.keyboard.press('Escape');
        await page.keyboard.press('End');
        await page.waitForTimeout(SETZEN_MS);
        const wert = await hg.inputValue();
        expect(wert, 'Vorbedingung: Ende waehlt die hoechste Stufe, die der eigenen').toBe('30');
        const t = await treffer(page, { hg: wert });
        expect(t.n, 'Vorbedingung: HG 30 laesst die Liste virtuell').toBeGreaterThanOrEqual(
            VIRTUELL_AB
        );
        const z = await listenZustand(page);
        weich(z.scrollTop, 'der geaenderte HG-Filter setzt die Liste nach oben').toBe(0);
        weich(z.ersteSichtbare, 'die erste sichtbare Zeile ist der erste Treffer').toBe(t.erste);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W10) gerollt, Typ per Tastatur auf "Konstrukt" (60 eigene): oben, die erste sichtbare Zeile ist der erste Treffer', async ({
        page
    }) => {
        const fehler = await laden(page, { eigene: 60 });
        await zurAnsicht(page, 'bestiary');
        await radBisGoblin(page);
        const typ = page.locator('#bestiary-filter-type');
        await typ.click();
        await page.keyboard.press('Escape');
        await page.keyboard.type('Konstrukt', { delay: 40 });
        await page.waitForTimeout(SETZEN_MS);
        expect(await typ.inputValue(), 'Vorbedingung: getippt ist der Typ gewaehlt').toBe(
            'Konstrukt'
        );
        const t = await treffer(page, { typ: 'Konstrukt' });
        expect(t.n, 'Vorbedingung: der Typ laesst die Liste virtuell').toBeGreaterThanOrEqual(
            VIRTUELL_AB
        );
        const z = await listenZustand(page);
        weich(z.scrollTop, 'der geaenderte Typ-Filter setzt die Liste nach oben').toBe(0);
        weich(z.ersteSichtbare, 'die erste sichtbare Zeile ist der erste Treffer').toBe(t.erste);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W10) gerollt, Favoriten anhaken (60 eigene als Favoriten): oben, die erste sichtbare Zeile ist der erste Treffer', async ({
        page
    }) => {
        const fehler = await laden(page, { eigene: 60, eigeneFavoriten: true });
        await zurAnsicht(page, 'bestiary');
        await radBisGoblin(page);
        await page.locator('#bestiary-filter-favs').click();
        await expect(page.locator('#bestiary-filter-favs')).toBeChecked();
        await page.waitForTimeout(SETZEN_MS);
        const t = await treffer(page, { nurFavoriten: true });
        expect(t.n, 'Vorbedingung: die Favoriten lassen die Liste virtuell').toBeGreaterThanOrEqual(
            VIRTUELL_AB
        );
        const z = await listenZustand(page);
        weich(z.scrollTop, 'der geaenderte Favoritenfilter setzt die Liste nach oben').toBe(0);
        weich(z.ersteSichtbare, 'die erste sichtbare Zeile ist der erste Treffer').toBe(t.erste);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });
});

test.describe('B: Geometrie der ungefilterten Liste', () => {
    test.use({ viewport: BREIT });

    test('(W11) bei scrollTop 0 reicht die Scrollhoehe ueber die ganze Liste; die Huelle traegt inline flex-shrink 0 und keine Klasse', async ({
        page
    }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        const t = await treffer(page, {});
        expect(t.n, 'Vorbedingung: ungefiltert ist die Liste virtuell').toBeGreaterThanOrEqual(
            VIRTUELL_AB
        );
        const z = await listenZustand(page);
        expect(z.scrollTop, 'Vorbedingung: frisch geladen, oben').toBe(0);
        weich(z.scrollHeight, `Scrollhoehe >= ${t.n} x ${ZEILE}`).toBeGreaterThanOrEqual(
            t.n * ZEILE
        );
        const huelle = await page.evaluate(() => {
            const w = /** @type {HTMLElement|null} */ (
                /** @type {HTMLElement} */ (document.getElementById('bestiary-list'))
                    .firstElementChild
            );
            return w
                ? {
                      klasse: w.getAttribute('class'),
                      hoehe: w.style.height,
                      flexShrink: w.style.flexShrink,
                      ist: Math.round(w.getBoundingClientRect().height)
                  }
                : null;
        });
        expect(huelle, 'Vorbedingung: die Huelle des Rollwerks steht').not.toBeNull();
        const h = /** @type {NonNullable<typeof huelle>} */ (huelle);
        weich(h.hoehe, 'R4: der Platzhalter rechnet weiter mit 52 je Zeile').toBe(
            t.n * ZEILE + 'px'
        );
        weich(h.ist, 'R2: die Huelle schrumpft nicht').toBe(t.n * ZEILE);
        weich(h.flexShrink, 'R2: inline flex-shrink 0 (oder flex: none) an der Huelle').toBe('0');
        weich(h.klasse, 'R2: keine Klasse an der Huelle (Stil-Sollstand)').toBeNull();
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });

    test('(W12) per Rad bis zum Ende: die letzte Zeile ist voll sichtbar, Ueberhang <= Dach, keine Luecke', async ({
        page
    }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, 'bestiary');
        const t = await treffer(page, {});
        const m = await page.evaluate(() => {
            const r = /** @type {HTMLElement} */ (
                document.getElementById('bestiary-list')
            ).getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        });
        await page.mouse.move(m.x, m.y);
        let alt = -1;
        for (let i = 0; i < 200; i++) {
            await page.mouse.wheel(0, 240);
            await page.waitForTimeout(60);
            const st = await page.evaluate(
                () =>
                    /** @type {HTMLElement} */ (document.getElementById('bestiary-list')).scrollTop
            );
            if (st === alt) break;
            alt = st;
        }
        await page.waitForTimeout(SETZEN_MS);
        const ende = await page.evaluate(() => {
            const c = /** @type {HTMLElement} */ (document.getElementById('bestiary-list'));
            const cr = c.getBoundingClientRect();
            const oben = cr.top + c.clientTop;
            const unten = oben + c.clientHeight;
            const zeilen = Array.from(c.querySelectorAll('.bestiary-list-item'))
                .map(z => ({
                    id:
                        /** @type {HTMLElement} */ (z).dataset.id +
                        ':' +
                        /** @type {HTMLElement} */ (z).dataset.source,
                    r: z.getBoundingClientRect()
                }))
                .sort((a, b) => a.r.top - b.r.top);
            const letzte = zeilen[zeilen.length - 1];
            // Luecke: ein Stueck des Klippbereichs bis zur letzten Zeile, das
            // keine gezeichnete Zeile deckt. Geometrisch, nicht per
            // elementFromPoint — der schwebende Wuerfelknopf liegt unten
            // links ueber der Liste.
            let deckung = oben;
            let luecke = 0;
            const bis = Math.min(unten, letzte.r.bottom);
            for (const z of zeilen) {
                if (z.r.bottom <= deckung) continue;
                if (z.r.top > deckung + 0.5)
                    luecke = Math.max(luecke, Math.min(z.r.top, bis) - deckung);
                deckung = Math.max(deckung, z.r.bottom);
                if (deckung >= bis) break;
            }
            return {
                amEnde: c.scrollTop >= c.scrollHeight - c.clientHeight - 1,
                letzte: letzte.id,
                oberkante: Math.round((letzte.r.top - oben) * 10) / 10,
                ueberhang: Math.round((letzte.r.bottom - unten) * 10) / 10,
                luecke: Math.round(luecke * 10) / 10
            };
        });
        expect(ende.amEnde, 'Vorbedingung: das Rad hat das Listenende erreicht').toBe(true);
        weich(ende.letzte, 'die letzte gezeichnete Zeile ist der letzte Treffer').toBe(t.letzte);
        weich(ende.oberkante, 'sie beginnt im Sichtfeld').toBeGreaterThanOrEqual(0);
        weich(
            ende.ueberhang,
            `ihr Ueberhang bleibt im Dach (${UEBERHANG_DACH} px)`
        ).toBeLessThanOrEqual(UEBERHANG_DACH);
        weich(ende.luecke, 'keine Luecke zwischen den Zeilen').toBe(0);
        weich(fehler, 'kein Fehler, kein Dialog').toEqual([]);
    });
});
