// @ts-check
/**
 * Der Waechter der Sprungziele der Kopfsuche (SUCHE)
 * ==================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **jeder Treffer der
 * Kopfsuche bringt den Nutzer zu genau diesem Eintrag** — mit der Maus und mit
 * der Tastatur, er wechselt die Ansicht, schliesst die Suche und waehlt bzw.
 * oeffnet das Ziel, und zwar so, dass man es sieht.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand — DREI FEHLER AUF EINEM WEG
 *
 * Gemeldet: ein Klick auf einen Encounter-Treffer der globalen Suche tut
 * nichts. GEMESSEN am Buendel zu 429ad8f, 1440x900, 24 Fueller-Encounter
 * (CR 1, Humanoid) und das Ziel "Goblinhinterhalt Qorx" (id 9001, CR 5, Riese,
 * sortiert ans Listenende):
 *
 *   Weg                          Ansicht          Auswahl   sonst
 *   Klick auf den Treffer        view-dashboard   101       Liste zu, Feld leer
 *   Strg+K, tippen, Tab, Enter   view-dashboard   101       Fokus auf BODY
 *   dasselbe fuer einen Quest    view-dashboard   —         Fokus auf BODY
 *   NSC ohne Ort, Klick          view-locations   Ort 101   Dialog des NSC
 *
 * Kein `pageerror`, kein `console.error`, kein Eintrag im Fehlerlog.
 *
 * (1) `navigateToResult()` in `systems/search/global-search.js` leert das
 *     Feld, schliesst die Liste und verzweigt dann nach character, npc,
 *     location, quest und spell — ein Zweig fuer 'encounter' stand nie darin
 *     (seit 2b0c3ae, 2025-12-28), obwohl dieselbe Datei Encounter-Treffer
 *     erzeugt. Das Sprungziel gab es seit 254ff3b (2025-12-29):
 *     `toggleEncounter()` in `features/encounters/encounters-render.js`,
 *     Kommentar "For search navigation" — nie aufgerufen.
 * (2) Ein WETTLAUF, der JEDEN Treffertyp trifft: Tab aus dem Feld fokussiert
 *     den ersten Treffer; beim Verlassen feuert das Feld `change`, der
 *     Verteiler (`ui/event-delegation.js`) ruft die Aktion `search-input`
 *     (`assets/templates/header.html`), und `debouncedGlobalSearch` schreibt
 *     150 ms spaeter die Liste per `innerHTML` neu — fuer denselben Begriff.
 *     Der fokussierte Treffer ist weg, der Fokus faellt auf BODY, Enter tut
 *     nichts. Gemessen: `change` bei 1 ms, Treffer verliert den Fokus bei
 *     155 ms.
 * (3) `data-loc="null"` ist Text. Der NSC-Zweig fragt `if (locId)`, und
 *     "null" ist wahr: ein NSC ohne Ort landete in der Orte-Ansicht bei einem
 *     beliebigen Ort (dem automatisch gewaehlten), der `else`-Zweig in die
 *     NSC-Ansicht war tot. Der Weiterleiter in `ui/actions/ui-actions.js`
 *     uebersetzte nur '' in null.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WARUM JEDER FALL AM ALTEN CODE ROT WAR
 *
 *   (1), (3)       Ansicht bleibt Dashboard, das Ziel wird nicht gewaehlt.
 *   (2a)           Der Fokus liegt 400 ms nach Tab auf BODY (Wettlauf), und
 *                  selbst mit Fokus fehlte der Zweig.
 *   (2b)           Nur der Wettlauf: Quest hat einen Zweig, Enter erreicht
 *                  ihn nicht.
 *   (4a), (4b)     Ansicht bleibt Dashboard. Mit einem Zweig, der nur
 *                  `openEncounterDetail()` ruft, bleiben sie rot: der
 *                  Typfilter blendet das Ziel aus, das Detail zeigte einen
 *                  Encounter ohne Listeneintrag, und nach der Rundreise sprang
 *                  die Auswahl zurueck (bei 900 px schloss das Vollbild still).
 *   (5)            Orte-Ansicht statt NSC-Ansicht.
 *   (6a)           Rot genau fuer encounter und den NSC ohne Ort.
 *   (6b)           Rot fuer jeden Typ (Wettlauf).
 * (0) und (7) sind Waechter, am alten Code gruen: (0) haelt die Vorbedingung
 * fest, ohne die (1) bis (4) nichts messen; (7), dass Tippen weiter sucht.
 * Gemessen am Elterncommit des Fixes: 9 von 11 rot, jeder aus dem genannten
 * Grund ("view-dashboard", "Fokus: BODY", "view-locations").
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE VORBEDINGUNG, OHNE DIE DIESE DATEI NICHTS MISST
 *
 * Das Ziel darf NICHT die automatische Vorauswahl sein und nicht ohne
 * Scrollen im Bild stehen. Im ersten Messlauf der Befundaufnahme war es beides
 * (CR 1/2, erster Eintrag), und die Auswahlpruefung waere falsch gruen
 * geworden. Darum steht es mit CR 5 hinter 24 Fuellern (gemessen ohne Suche
 * bei y = 2136 in einer 519 px hohen Liste), und `laden()` prueft hart, dass
 * die Vorauswahl ein anderer Eintrag ist.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit laden — `waitForAppReady()` wartet auf `.app-title`, und die ist im
 *  Mobil-Layout versteckt. Verkleinert wird erst danach. */
const BREIT = { width: 1440, height: 900 };
/** Die Grenze des Vollbild-Details (`ENC_DETAIL_VOLLBILD`), Desktop-Layout —
 *  die Kopfsuche ist hier noch bedienbar. */
const GRENZE = { width: 900, height: 800 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Das Kunstwort steckt in genau einem Eintrag jedes Typs — eine Suche danach
 *  liefert die Typliste aus dem Buendel, nicht aus einem Literal hier. */
const KUNSTWORT = 'Qorx';

/** Das Ziel: ans Listenende sortiert, nicht vorausgewaehlt, ein Riese. */
const ZIEL = { id: 9001, name: 'Goblinhinterhalt Qorx', begriff: 'Goblinhinterhalt' };

/** Laenger als die Entprellung der Suche (150 ms) samt Zeichnen — so lange
 *  muss der Fokus nach Tab halten, sonst ist der Wettlauf (2) zurueck. */
const WETTLAUF_MS = 400;

/** WEICHE Zusicherungen fuer die Ergebnisse: ein roter Lauf soll JEDE
 *  gebrochene Zusage nennen (Ansicht, Auswahl, Sicht, Fokus, Fehlerlog),
 *  nicht nur die erste. Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

function saat() {
    const encounters = [];
    for (let i = 0; i < 24; i++) {
        encounters.push({
            id: 101 + i,
            name: 'Fueller ' + String(i).padStart(2, '0'),
            cr: '1',
            creatureType: 'Humanoid',
            ac: 12,
            hp: 10
        });
    }
    encounters.push({
        id: ZIEL.id,
        name: ZIEL.name,
        cr: '5',
        creatureType: 'Riese',
        ac: 15,
        hp: 60
    });
    const locations = [];
    for (let i = 0; i < 10; i++) {
        locations.push({ id: 101 + i, name: 'Ort ' + i, type: 'Dorf', description: '' });
    }
    locations.push({ id: 5001, name: 'Qorxburg', type: 'Stadt', description: '' });
    return {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            markdownOnboardingSeen: true,
            enableMarkdownShortcuts: true
        },
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        characters: [
            { id: 1, name: 'Anna', characterClass: 'Magier', level: 3, hp: 10, maxHp: 10, ac: 12 },
            {
                id: 3001,
                name: 'Qorx Klingenhand',
                characterClass: 'Kaempfer',
                level: 5,
                hp: 40,
                maxHp: 40,
                ac: 17
            }
        ],
        npcs: [
            { id: 1, name: 'Bert', role: 'Schmied', locationId: 101 },
            { id: 7001, name: 'Qorx der Wirt', role: 'Wirt', locationId: 5001 },
            // Ohne Ort — der Fall (5).
            { id: 7002, name: 'Qorxine', role: 'Spaeherin' }
        ],
        locations,
        quests: [
            { id: 1, title: 'Erster Auftrag', description: '', completed: false },
            { id: 6001, title: 'Qorx-Auftrag', description: '', completed: false }
        ],
        // Truhe und Wiki durchsucht die Kopfsuche heute nicht. Liefert sie sie
        // eines Tages, tauchen sie in der Typliste der Ratsche (6) auf — und
        // ohne Pruefer dort wird der Fall rot.
        loot: [
            {
                id: 1,
                name: 'Qorxklinge',
                category: 'weapons',
                rarity: 'rare',
                quantity: 1,
                tags: []
            }
        ],
        spells: [
            { id: 1, name: 'Feuerball', level: 3, school: 'Hervorrufung', description: '' },
            { id: 8001, name: 'Qorxblitz', level: 1, school: 'Hervorrufung', description: '' }
        ],
        wiki: [
            {
                id: 1,
                title: 'Qorx-Chronik',
                category: 'locations',
                content: '',
                tags: [],
                pinned: false,
                parentId: null
            }
        ],
        links: [],
        filters: {},
        tags: [],
        sessionNotes: [],
        encounters,
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 4000,
            npcs: 8000,
            locations: 6000,
            quests: 7000,
            encounters: 9500,
            spells: 9000,
            loot: 2,
            items: 1,
            wiki: 2,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App. Das Log ist der wichtigste der
 * drei — `EventDelegation` faengt einen geworfenen Handler und meldet ihn NUR
 * dort (und als `console.error`); ein `pageerror` entsteht nicht.
 * "Failed to load resource" ist Netzrauschen (Schriften unter file://) und
 * keine Aussage ueber den Code.
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
    return {
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            const log = await page.evaluate(() =>
                (window.ErrorHandler?.getRecentErrors(50) || []).map(
                    e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...fehler, ...log];
        }
    };
}

/**
 * Laedt breit, saet die Kampagne (einmal je Tab) und wartet die fremde
 * Speicherung ab. Prueft hart die Vorbedingung: die automatische Vorauswahl
 * der Encounter-Liste ist ein anderer Eintrag als das Ziel.
 * @param {import('@playwright/test').Page} page
 * @param {{width: number, height: number}} [kleiner] Erst NACH dem Laden verkleinern
 */
async function laden(page, kleiner) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                // Einmal je Tab: ein Neuladen saet nicht erneut.
                if (sessionStorage.getItem('suche-ziel-gesaet')) return;
                sessionStorage.setItem('suche-ziel-gesaet', '1');
                localStorage.setItem(schluessel, JSON.stringify(s));
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, saat()]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN: `load()` repariert die Saat und plant
    // ~1 s spaeter `saveAutomatic()`; sie schreibt `_version` neu. Kommt
    // binnen 4 s keine, steht auch keine aus.
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
    const vorauswahl = page.locator('#encounter-list .enc-item.selected');
    await expect(
        vorauswahl,
        'Vorbedingung: die Liste hat eine automatische Vorauswahl'
    ).toHaveCount(1);
    await expect(
        vorauswahl,
        'Vorbedingung: die Vorauswahl ist NICHT das Ziel — sonst misst die Auswahlpruefung nichts'
    ).not.toHaveAttribute('data-id', String(ZIEL.id));
    if (kleiner) {
        await page.setViewportSize(kleiner);
        await page.waitForTimeout(450);
    }
}

/** @param {import('@playwright/test').Page} page @param {string} typ @param {number|string} id */
function treffer(page, typ, id) {
    return page.locator(
        `#global-search-results .search-result-item[data-type="${typ}"][data-id="${id}"]`
    );
}

/**
 * Wartet, bis die Liste den GANZEN Begriff zeigt: die Markierung im Treffer
 * traegt ihn erst nach dem letzten entprellten Zeichnen. Ohne das koennte
 * ein Tab noch in ein Zeichnen fuer einen Teilbegriff fallen — ein Wettlauf
 * des Tests, nicht der App.
 * @param {import('@playwright/test').Page} page
 * @param {string} typ @param {number|string} id @param {string} begriff
 */
async function trefferAbwarten(page, typ, id, begriff) {
    const t = treffer(page, typ, id);
    await expect(t, `Treffer ${typ}:${id} fuer "${begriff}"`).toBeVisible();
    await expect(t.locator('mark')).toHaveText(begriff);
    return t;
}

/** Klick ins Feld, Begriff tippen.
 *  @param {import('@playwright/test').Page} page @param {string} begriff */
async function tippen(page, begriff) {
    await page.locator('#global-search').click();
    await page.locator('#global-search').pressSequentially(begriff, { delay: 20 });
}

/**
 * Der Tastaturweg: Strg+K, tippen, dann Tab fuer Tab bis zum Treffer — nach
 * JEDEM Tab WETTLAUF_MS Pause, wie ein Mensch tippt, und der Fokus muss auf
 * einem Treffer stehen. Erst auf dem Ziel Enter.
 *
 * Warum die Pause nach jedem Tab: ohne sie erreichte die Schleife spaetere
 * Treffer am alten Code TROTZ des Wettlaufs (2) — der Neuaufbau warf den
 * Fokus vom ersten Treffer, und der naechste Tab setzte hinter dem
 * entfernten Knoten wieder an, nun auf einer stehenden Liste. Gemessen:
 * location, quest und spell waren so gruen, character und npc rot.
 * Liefert `erreicht` und den Fokus nach jedem Tab.
 * @param {import('@playwright/test').Page} page
 * @param {string} begriff @param {string} typ @param {number|string} id
 */
async function perTastatur(page, begriff, typ, id) {
    await page.keyboard.press('Control+k');
    await expect(page.locator('#global-search'), 'Strg+K fokussiert die Kopfsuche').toBeFocused();
    await page.keyboard.type(begriff, { delay: 20 });
    await trefferAbwarten(page, typ, id, begriff);
    /** @type {string[]} */
    const weg = [];
    for (let i = 0; i < 13; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(WETTLAUF_MS);
        const wo = await fokus(page);
        weg.push(wo);
        if (wo.endsWith(`[${typ}:${id}]`)) {
            await page.keyboard.press('Enter');
            return { erreicht: true, weg: weg.join(' → ') };
        }
        // Kein Treffer mehr im Fokus: der Weg ist abgerissen. Kein Enter —
        // es koennte ein beliebiges anderes Bedienelement ausloesen.
        if (!wo.includes('.search-result-item')) break;
    }
    return { erreicht: false, weg: weg.join(' → ') };
}

/** Wo der Fokus steht, lesbar. @param {import('@playwright/test').Page} page */
function fokus(page) {
    return page.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return 'BODY';
        const art = a.dataset?.type ? `[${a.dataset.type}:${a.dataset.id}]` : '';
        return `${a.tagName}${a.id ? '#' + a.id : ''}.${String(a.className).split(' ')[0]}${art}`;
    });
}

/**
 * Der Zustand der Encounter-Ansicht, wie der Nutzer ihn sieht.
 * @param {import('@playwright/test').Page} page
 */
function encLage(page) {
    return page.evaluate(begriff => {
        const panel = document.getElementById('enc-detail-panel');
        return {
            ansicht: document.querySelector('.view.active')?.id || '(keine)',
            gewaehlt: Array.from(
                document.querySelectorAll('#encounter-list .enc-item.selected')
            ).map(e => /** @type {HTMLElement} */ (e).dataset.id),
            detailZeigtZiel: !!panel && (panel.textContent || '').includes(begriff),
            filter:
                /** @type {HTMLElement|null} */ (document.querySelector('.enc-filter-chip.active'))
                    ?.dataset.value || '(keiner)',
            sucheOffen: !!document
                .getElementById('global-search-results')
                ?.classList.contains('visible'),
            feld: /** @type {HTMLInputElement|null} */ (document.getElementById('global-search'))
                ?.value
        };
    }, ZIEL.begriff);
}

/**
 * Steht der Eintrag WIRKLICH im Bild? `getBoundingClientRect()` allein
 * reicht nicht: in einer verborgenen Ansicht meldet es y = 0, also "im
 * Fenster". Darum `checkVisibility()`, der Mittelpunkt im Fenster UND
 * `elementFromPoint()` auf diesem Mittelpunkt trifft den Eintrag.
 * @param {import('@playwright/test').Page} page @param {string} selektor
 */
function imBild(page, selektor) {
    return page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return 'fehlt';
        if (!el.checkVisibility()) return 'unsichtbar';
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) {
            return `ausserhalb (y=${Math.round(y)}, Fenster ${window.innerHeight})`;
        }
        const oben = document.elementFromPoint(x, y);
        if (!oben || !el.contains(oben)) {
            return `verdeckt von ${oben ? oben.tagName + '.' + String(oben.className).split(' ')[0] : 'nichts'}`;
        }
        return 'ja';
    }, selektor);
}

/**
 * Wechselt die Ansicht ueber den echten Klickweg: liegt der Reiter in einer
 * Gruppe, erst der Gruppenknopf, dann der Reiter.
 * @param {import('@playwright/test').Page} page @param {string} view
 */
async function zurAnsicht(page, view) {
    const reiter = page.locator(`.nav-tab[data-view="${view}"]`);
    const gruppe = page.locator('.nav-group', { has: reiter });
    if ((await gruppe.count()) > 0) await gruppe.locator('.nav-group-btn').click();
    await reiter.click();
    await expect(page.locator(`#view-${view}`)).toHaveClass(/\bactive\b/);
}

/**
 * Der Zustand nach einem Sprung, fuer jeden Treffertyp dieselbe Form — die
 * Ratsche (6) vergleicht daraus nur die Felder, die ihr Typ zusagt.
 * @param {import('@playwright/test').Page} page @param {string} name
 */
function lage(page, name) {
    return page.evaluate(zielName => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value ?? '(fehlt)';
        const offen = id => !!document.getElementById(id)?.classList.contains('show');
        const ids = sel =>
            Array.from(document.querySelectorAll(sel)).map(
                e => /** @type {HTMLElement} */ (e).dataset.id
            );
        return {
            ansicht: document.querySelector('.view.active')?.id || '(keine)',
            sucheOffen: !!document
                .getElementById('global-search-results')
                ?.classList.contains('visible'),
            feld: wert('global-search'),
            charFormular: !!document.getElementById('char-form')?.classList.contains('open'),
            charId: wert('edit-char-id'),
            npcDialog: offen('npc-modal'),
            npcId: wert('edit-npc-id'),
            questDialog: offen('quest-modal'),
            questId: wert('edit-quest-id'),
            spellDialog: offen('spell-modal'),
            spellId: wert('edit-spell-id'),
            ortGewaehlt: ids(
                '#location-list .loc-item.selected, #view-locations .loc-item.selected'
            ),
            npcGewaehlt: ids('#view-npcs .npc-item.selected'),
            encGewaehlt: ids('#encounter-list .enc-item.selected'),
            encDetailZeigtZiel: (
                document.getElementById('enc-detail-panel')?.textContent || ''
            ).includes(zielName)
        };
    }, name);
}

/**
 * Was jeder Treffertyp nach dem Sprung zusagt. Ein Typ, den die Suche liefert
 * und der hier fehlt, macht die Ratsche rot: er braucht einen Zweig in
 * `navigateToResult()` UND eine Zusage hier.
 * @type {Record<string, (t: {typ: string, id: string, loc: string, name: string}) => object>}
 */
const ZUSAGE = {
    character: t => ({ ansicht: 'view-party', charFormular: true, charId: t.id }),
    npc: t =>
        !t.loc || t.loc === 'null'
            ? { ansicht: 'view-npcs', npcGewaehlt: [t.id], npcDialog: true, npcId: t.id }
            : { ansicht: 'view-locations', ortGewaehlt: [t.loc], npcDialog: true, npcId: t.id },
    location: t => ({ ansicht: 'view-locations', ortGewaehlt: [t.id] }),
    quest: t => ({ ansicht: 'view-quests', questDialog: true, questId: t.id }),
    spell: t => ({ ansicht: 'view-spells', spellDialog: true, spellId: t.id }),
    encounter: t => ({ ansicht: 'view-encounter', encGewaehlt: [t.id], encDetailZeigtZiel: true })
};

/** Nur die Felder von `ist`, die `soll` nennt. */
function auswahl(ist, soll) {
    return Object.fromEntries(Object.keys(soll).map(k => [k, ist[k]]));
}

/**
 * Wartet, bis der Zustand der Zusage entspricht (die Zweige springen 100 ms
 * verzoegert), hoechstens `ms`. Liefert den letzten Stand — die Zusicherung
 * danach nennt bei Rot jedes abweichende Feld.
 * @param {import('@playwright/test').Page} page @param {string} name @param {object} soll
 */
async function abwarten(page, name, soll, ms = 3000) {
    const ende = Date.now() + ms;
    let ist = auswahl(await lage(page, name), soll);
    while (JSON.stringify(ist) !== JSON.stringify(soll) && Date.now() < ende) {
        await page.waitForTimeout(100);
        ist = auswahl(await lage(page, name), soll);
    }
    return ist;
}

/**
 * Die Typliste AUS DEM BUENDEL: alle Treffer einer Suche nach dem Kunstwort,
 * mit Typ, ID und Ort, wie die Suche sie rendert.
 * @param {import('@playwright/test').Browser} browser
 */
async function typListe(browser) {
    const kontext = await browser.newContext({ viewport: BREIT });
    const page = await kontext.newPage();
    await laden(page);
    await tippen(page, KUNSTWORT);
    await expect(
        page.locator('#global-search-results .search-result-item mark').first()
    ).toHaveText(KUNSTWORT);
    const liste = await page.$$eval('#global-search-results .search-result-item[data-type]', els =>
        els.map(e => {
            const d = /** @type {HTMLElement} */ (e).dataset;
            return {
                typ: d.type || '',
                id: d.id || '',
                loc: d.loc || '',
                name: (e.querySelector('.search-result-name')?.textContent || '').trim()
            };
        })
    );
    await kontext.close();
    return liste;
}

test.describe('Kopfsuche: jeder Treffer fuehrt zu genau seinem Eintrag (SUCHE)', () => {
    test('(0) Vorbedingung: ohne Suche ist das Ziel weder gewaehlt noch im Bild', async ({
        page
    }) => {
        await laden(page);
        await zurAnsicht(page, 'encounter');
        const z = await encLage(page);
        expect(z.gewaehlt, 'automatische Vorauswahl').toHaveLength(1);
        expect(z.gewaehlt).not.toContain(String(ZIEL.id));
        expect(z.detailZeigtZiel, 'das Detail zeigt nicht schon das Ziel').toBe(false);
        expect(
            await imBild(page, `.enc-item[data-id="${ZIEL.id}"]`),
            'das Ziel steht ohne Scrollen NICHT im Bild — sonst misst die Sichtpruefung nichts'
        ).toMatch(/^ausserhalb/);
    });

    test('(1) Maus, 1440: der Treffer wechselt die Ansicht, waehlt das Ziel und holt es ins Bild', async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        await tippen(page, ZIEL.begriff);
        await (await trefferAbwarten(page, 'encounter', ZIEL.id, ZIEL.begriff)).click();

        await expect
            .poll(async () => (await encLage(page)).ansicht, { timeout: 3000 })
            .toBe('view-encounter');
        const z = await encLage(page);
        weich(z.gewaehlt, 'genau das Ziel ist gewaehlt').toEqual([String(ZIEL.id)]);
        weich(z.detailZeigtZiel, 'das Detail zeigt das Ziel').toBe(true);
        weich(z.sucheOffen, 'die Trefferliste ist zu').toBe(false);
        weich(z.feld, 'das Suchfeld ist leer').toBe('');
        // Der Goldschein zeigt zwei Sekunden lang, wohin gesprungen wurde.
        await weich
            .poll(
                () =>
                    page.evaluate(
                        id =>
                            document.querySelector(`.enc-item[data-id="${id}"]`)?.style.boxShadow ||
                            '',
                        ZIEL.id
                    ),
                { timeout: 2000, intervals: [50] }
            )
            .not.toBe('');
        await weich
            .poll(() => imBild(page, `.enc-item[data-id="${ZIEL.id}"]`), { timeout: 3000 })
            .toBe('ja');
        weich(await fehler.alle()).toEqual([]);
    });

    test('(2a) Tastatur, 1440: Strg+K, tippen, Tab, warten, Enter — der Encounter-Treffer', async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        const t = await perTastatur(page, ZIEL.begriff, 'encounter', ZIEL.id);
        weich(
            t.erreicht,
            `Tab erreicht den Treffer, und der Fokus haelt ${WETTLAUF_MS} ms (Fokus: ${t.weg})`
        ).toBe(true);

        await weich
            .poll(async () => (await encLage(page)).ansicht, { timeout: 3000 })
            .toBe('view-encounter');
        const z = await encLage(page);
        weich(z.gewaehlt, 'genau das Ziel ist gewaehlt').toEqual([String(ZIEL.id)]);
        weich(z.detailZeigtZiel, 'das Detail zeigt das Ziel').toBe(true);
        weich(z.sucheOffen, 'die Trefferliste ist zu').toBe(false);
        weich(z.feld, 'das Suchfeld ist leer').toBe('');
        await weich
            .poll(() => imBild(page, `.enc-item[data-id="${ZIEL.id}"]`), { timeout: 3000 })
            .toBe('ja');
        weich(await fehler.alle()).toEqual([]);
    });

    test('(2b) Tastatur, Gegenprobe Quest: der Fokus haelt nach Tab, Enter oeffnet den Quest', async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        const t = await perTastatur(page, 'Qorx-Auftrag', 'quest', 6001);
        weich(
            t.erreicht,
            `Tab erreicht den Treffer, und der Fokus haelt ${WETTLAUF_MS} ms (Fokus: ${t.weg})`
        ).toBe(true);
        const soll = {
            ...ZUSAGE.quest({ typ: 'quest', id: '6001', loc: '', name: '' }),
            sucheOffen: false,
            feld: ''
        };
        weich(await abwarten(page, '', soll)).toEqual(soll);
        weich(await fehler.alle()).toEqual([]);
    });

    test('(3) 900x800: der Treffer oeffnet das Vollbild-Detail, der Fokus steht auf "← Liste"', async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page, GRENZE);
        await tippen(page, ZIEL.begriff);
        await (await trefferAbwarten(page, 'encounter', ZIEL.id, ZIEL.begriff)).click();

        await expect
            .poll(async () => (await encLage(page)).ansicht, { timeout: 3000 })
            .toBe('view-encounter');
        weich(page.locator('#view-encounter'), 'das Vollbild ist offen').toHaveClass(
            /\bdetail-open\b/
        );
        weich(
            await page.locator('#enc-detail-panel').evaluate(el => el.checkVisibility()),
            'das Detail ist sichtbar'
        ).toBe(true);
        const z = await encLage(page);
        weich(z.gewaehlt, 'genau das Ziel ist gewaehlt').toEqual([String(ZIEL.id)]);
        weich(z.detailZeigtZiel, 'das Detail zeigt das Ziel').toBe(true);
        weich(await fokus(page), 'der Fokus steht auf "← Liste"').toMatch(/\.enc-detail-back/);
        weich(await fehler.alle()).toEqual([]);
    });

    /**
     * Der Typfilter "Humanoid" blendet das Ziel (ein Riese) aus. Danach steht
     * der Filter auf "Alle", das Ziel in der Liste und gewaehlt, und nach einer
     * Rundreise ueber die Reiter ist es immer noch gewaehlt.
     * @param {import('@playwright/test').Page} page
     * @param {boolean} vollbild
     */
    async function typfilterFall(page, vollbild) {
        await zurAnsicht(page, 'encounter');
        await page.locator('#encounter-filters .enc-filter-chip[data-value="Humanoid"]').click();
        await expect(page.locator('#encounter-filters .enc-filter-chip.active')).toHaveAttribute(
            'data-value',
            'Humanoid'
        );
        await expect(
            page.locator(`#encounter-list .enc-item[data-id="${ZIEL.id}"]`),
            'Vorbedingung: der Filter blendet das Ziel aus'
        ).toHaveCount(0);
        await zurAnsicht(page, 'dashboard');

        await tippen(page, ZIEL.begriff);
        await (await trefferAbwarten(page, 'encounter', ZIEL.id, ZIEL.begriff)).click();
        await expect
            .poll(async () => (await encLage(page)).ansicht, { timeout: 3000 })
            .toBe('view-encounter');
        await page.waitForTimeout(300);
        let z = await encLage(page);
        weich(z.filter, 'der Typfilter steht auf "Alle"').toBe('all');
        weich(z.gewaehlt, 'das Ziel steht in der Liste und ist gewaehlt').toEqual([
            String(ZIEL.id)
        ]);
        weich(z.detailZeigtZiel, 'das Detail zeigt das Ziel').toBe(true);
        if (vollbild) {
            weich(page.locator('#view-encounter'), 'das Vollbild ist offen').toHaveClass(
                /\bdetail-open\b/
            );
        }

        // Rundreise ueber die Reiter, mit echten Klicks.
        await zurAnsicht(page, 'dashboard');
        await zurAnsicht(page, 'encounter');
        z = await encLage(page);
        weich(z.gewaehlt, 'nach der Rundreise ist das Ziel weiter gewaehlt').toEqual([
            String(ZIEL.id)
        ]);
        weich(z.detailZeigtZiel, 'nach der Rundreise zeigt das Detail weiter das Ziel').toBe(true);
        if (vollbild) {
            weich(
                page.locator('#view-encounter'),
                'nach der Rundreise ist das Vollbild weiter offen'
            ).toHaveClass(/\bdetail-open\b/);
        }
    }

    test('(4a) Typfilter "Humanoid" aktiv, Ziel ist ein Riese — 1440', async ({ page }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        await typfilterFall(page, false);
        weich(await fehler.alle()).toEqual([]);
    });

    test('(4b) Typfilter "Humanoid" aktiv, Ziel ist ein Riese — 900x800, das Vollbild uebersteht die Rundreise', async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page, GRENZE);
        await typfilterFall(page, true);
        weich(await fehler.alle()).toEqual([]);
    });

    test('(5) NSC ohne Ort: NSC-Ansicht, der NSC gewaehlt, sein Bearbeiten-Dialog offen', async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        await tippen(page, 'Qorxine');
        const t = await trefferAbwarten(page, 'npc', 7002, 'Qorxine');
        // Vorbedingung: der Treffer traegt "keinen Ort" — heute als Text "null".
        expect(['', 'null']).toContain((await t.getAttribute('data-loc')) || '');
        await t.click();
        const soll = {
            ...ZUSAGE.npc({ typ: 'npc', id: '7002', loc: 'null', name: '' }),
            sucheOffen: false,
            feld: ''
        };
        weich(await abwarten(page, '', soll)).toEqual(soll);
        weich(await fehler.alle()).toEqual([]);
    });

    test('(6a) Ratsche, Maus: jeder Treffertyp aus dem Buendel springt zu genau seinem Ziel', async ({
        browser
    }) => {
        test.setTimeout(150_000);
        const liste = await typListe(browser);
        const typen = [...new Set(liste.map(t => t.typ))];
        // Sechs Typen sind gesaet und heute durchsucht; weniger hiesse, die
        // Saat erreicht die Suche nicht mehr.
        expect(typen.length, `Typen aus dem Buendel: ${typen.join(', ')}`).toBeGreaterThanOrEqual(
            6
        );
        for (const t of liste) {
            await test.step(`${t.typ}:${t.id} (Ort ${t.loc})`, async () => {
                const zusage = ZUSAGE[t.typ];
                weich(
                    zusage,
                    `Treffertyp "${t.typ}" hat keine Zusage in dieser Datei`
                ).toBeTruthy();
                if (!zusage) return;
                const kontext = await browser.newContext({ viewport: BREIT });
                const page = await kontext.newPage();
                const fehler = fehlerFangen(page);
                await laden(page);
                await tippen(page, KUNSTWORT);
                await (await trefferAbwarten(page, t.typ, t.id, KUNSTWORT)).click();
                const soll = { ...zusage(t), sucheOffen: false, feld: '' };
                weich(await abwarten(page, t.name, soll), `${t.typ}:${t.id} "${t.name}"`).toEqual(
                    soll
                );
                weich(await fehler.alle(), `${t.typ}:${t.id} Fehler`).toEqual([]);
                await kontext.close();
            });
        }
    });

    test('(6b) Ratsche, Tastatur: jeder Treffertyp aus dem Buendel per Tab und Enter', async ({
        browser
    }) => {
        test.setTimeout(150_000);
        const liste = await typListe(browser);
        expect(liste.length).toBeGreaterThanOrEqual(6);
        for (const t of liste) {
            await test.step(`${t.typ}:${t.id} (Ort ${t.loc})`, async () => {
                const zusage = ZUSAGE[t.typ];
                weich(
                    zusage,
                    `Treffertyp "${t.typ}" hat keine Zusage in dieser Datei`
                ).toBeTruthy();
                if (!zusage) return;
                const kontext = await browser.newContext({ viewport: BREIT });
                const page = await kontext.newPage();
                const fehler = fehlerFangen(page);
                await laden(page);
                const weg = await perTastatur(page, KUNSTWORT, t.typ, t.id);
                weich(
                    weg.erreicht,
                    `${t.typ}:${t.id} Tab fuer Tab erreicht den Treffer (Fokus: ${weg.weg})`
                ).toBe(true);
                const soll = { ...zusage(t), sucheOffen: false, feld: '' };
                weich(await abwarten(page, t.name, soll), `${t.typ}:${t.id} "${t.name}"`).toEqual(
                    soll
                );
                weich(await fehler.alle(), `${t.typ}:${t.id} Fehler`).toEqual([]);
                await kontext.close();
            });
        }
    });

    test('(7) Tippen sucht weiter: ein neuer Begriff zeichnet neu, eine geschlossene Liste auch', async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        await tippen(page, 'Goblin');
        await trefferAbwarten(page, 'encounter', ZIEL.id, 'Goblin');

        // Weiterschreiben: ein anderer Begriff ersetzt die Liste.
        const feld = page.locator('#global-search');
        for (let i = 0; i < 'Goblin'.length; i++) await feld.press('Backspace');
        await feld.pressSequentially('Qorxblitz', { delay: 20 });
        await trefferAbwarten(page, 'spell', 8001, 'Qorxblitz');
        await expect(treffer(page, 'encounter', ZIEL.id), 'der alte Treffer ist weg').toHaveCount(
            0
        );

        // Kuerzen: wieder ein anderer Begriff, wieder neu gezeichnet.
        for (let i = 0; i < 'blitz'.length; i++) await feld.press('Backspace');
        await trefferAbwarten(page, 'encounter', ZIEL.id, KUNSTWORT);

        // Geschlossen (Klick daneben) und wieder ins Feld: die Liste kommt
        // fuer denselben Begriff zurueck.
        await page.locator('.app-title').click();
        await expect(page.locator('#global-search-results')).not.toHaveClass(/\bvisible\b/);
        await feld.click();
        await expect(page.locator('#global-search-results')).toHaveClass(/\bvisible\b/);
        await trefferAbwarten(page, 'quest', 6001, KUNSTWORT);
        weich(await fehler.alle()).toEqual([]);
    });
});
