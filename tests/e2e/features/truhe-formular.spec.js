// @ts-check
/**
 * Der Waechter des Truhe-Formulars (TRUHE)
 * ========================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **jeder Weg durch das
 * Formular der Truhe kommt an** — ✏️ oeffnet es mit den Werten des
 * Gegenstands, Anlegen und Mengen-Merge stehen sofort in der Liste UND im
 * Speicher, und danach ist das Formular fuer das naechste Anlegen leer.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand — EINE FUNKTION, DIE ES NICHT GIBT
 *
 * `showLootModal()` (als erste Anweisung) und `saveLoot()` (nach
 * `hideModal()`) in `features/initiative-loot.js` riefen
 * `window.clearLootForm()`; `showLootModal()` rief im Bearbeiten-Zweig
 * ausserdem `window.updateLootSelectedTags()`. Keine der beiden ist im
 * Quellbaum definiert. Beide gingen mit 3e44317 (2026-01-10, "Finalize
 * TypeScript migration — Use compiled JS as runtime") verloren: das
 * kompilierte `features/initiative.js` trug die Aufrufe, als `window.X()`
 * umgeschrieben, aber nicht mehr die vier Funktionen dahinter
 * (`clearLootForm`, `updateLootSelectedTags`, `initLootTagSystem`,
 * `removeLootTag`). cc5959c (2026-09-07) entfernte spaeter die zwei toten
 * Registrierungen (`remove-loot-tag`, der `initLootTagSystem`-Aufruf), die
 * Aufrufe hier blieben.
 *
 * GEMESSEN am Buendel zu 467af71, 1440x900 und 390x844, Truhe mit einem
 * Heiltrank (x2):
 *
 *   ✏️ im Detail          TypeError "window.clearLootForm is not a function"
 *                         — Formular bleibt ZU, nichts gefuellt
 *   "+ Item", "Seil"      D: Heiltrank x2 | Seil x1
 *                         Liste: Heiltrank x2         (Seil fehlt)
 *                         localStorage: Heiltrank x2  (Seil fehlt)
 *   "+ Item", Heiltrank+3 D: Heiltrank x5   Liste: x2   localStorage: x2
 *   ~5 s spaeter          unveraendert — erst die naechste FREMDE Speicherung
 *                         haette D geschrieben
 *   "+ Item" danach       Formular traegt noch "Seil" / "Heiltrank", Menge 3
 *
 * `saveLoot()` schreibt in `D.loot` und wirft DANN — `renderLootList()` und
 * `save()` laufen nie. `EventDelegation` faengt den Fehler, `ErrorHandler`
 * loggt ihn, der Nutzer sieht nur ein geschlossenes Formular und eine Liste,
 * die nichts weiss. Gespeichert wird der Gegenstand erst von der naechsten
 * fremden Speicherung oder vom Entlade-Flush (`persistOnUnload()`): gemessen
 * vor dem Neuladen nicht im Speicher, danach wieder in D. Bis dahin steht er
 * nur im Arbeitsspeicher des Tabs.
 *
 * AUF DEM TELEFON (390x844) brechen Anlegen und Mengen-Merge genauso. ✏️ und
 * 🗑️ sind dort gar nicht erreichbar: bis einschliesslich 900 px
 * (`max-width: 900px`) setzt `assets/styles/npcs.css` `.loot-detail` auf
 * `display: none`, und die Listenzeile hat keinen eigenen Knopf — es gibt
 * dort weder Bearbeiten noch Loeschen. Das ist ein eigener Befund (kein Fall
 * hier).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WARUM DIE FAELLE (5) UND (7) NEBEN DEN ANDEREN STEHEN
 *
 * Die "+ Item"-Knoepfe oeffneten das Formular ueber das allgemeine
 * `show-modal` — ohne Leeren. Das war schon vor 3e44317 so, als ✏️ noch
 * ging; die Falle bestand also damals. Seit 3e44317 war sie verdeckt, weil
 * ✏️ warf und `#edit-loot-id` nie gesetzt wurde. Wirkt ✏️ wieder, laesst
 * "Bearbeiten -> Abbrechen -> + Item" die ID des bearbeiteten Gegenstands im
 * Formular stehen, und das naechste "Anlegen" UEBERSCHREIBT ihn. Fall (5)
 * haelt das fuer den Knopf der Werkzeugleiste fest, Fall (7) fuer den der
 * leeren Truhe (dort geht der Gegenstand still verloren, siehe am Fall).
 * Gegenprobe mit den zwei Funktionen zurueck, aber beiden "+ Item"-Knoepfen
 * noch auf `show-modal`: (5) und (7) rot, die uebrigen gruen — das Formular
 * zeigte "Item bearbeiten" mit ID 1, und Speichern als "Fackel" machte aus
 * dem Heiltrank `1:Fackel x2`, in D und im Speicher.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit laden — `waitForAppReady()` wartet auf `.app-title`, und die ist im
 *  Mobil-Layout versteckt. Verkleinert wird erst danach. */
const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. Ohne den Fix
 *  kam der Stand gemessen auch nach fuenf Sekunden nicht an. */
const SOFORT_MS = 4000;

/** Ein Gegenstand mit JEDEM Feld des Formulars belegt — sonst koennte ✏️ ein
 *  Feld vergessen, ohne dass ein Fall es merkt. */
const HEILTRANK = {
    id: 1,
    name: 'Heiltrank',
    category: 'potions',
    rarity: 'common',
    quantity: 2,
    weight: 0.5,
    value: 50,
    description: 'Heilt <b>2W4+2</b>',
    origin: 'loot',
    special: 'Rot',
    property: 'Heilung',
    tags: ['potion', 'consumable'],
    attunement: false
};

/** @param {object[]} loot */
function seed(loot) {
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
        characters: [],
        npcs: [],
        locations: [],
        quests: [],
        loot,
        spells: [],
        wiki: [],
        links: [],
        filters: {},
        tags: [],
        sessionNotes: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 1,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 2,
            items: 1,
            wiki: 1,
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
 * Laedt breit, saet die Truhe und oeffnet die Ansicht per `switchView()`.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} loot
 * @param {{width: number, height: number}} [kleiner] Erst NACH dem Laden verkleinern
 */
async function truheLaden(page, loot, kleiner) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                localStorage.setItem(schluessel, JSON.stringify(s));
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(loot)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst der Speicher-Fall nichts.
    // `load()` repariert die Saat (`validateDataIntegrity()`) und plant dafuer
    // 1 s spaeter `saveAutomatic()` ein; gemessen schreibt sie ~1,4 s nach dem
    // Laden. Faellt ein Bedienweg in dieses Fenster, schreibt SIE den Stand
    // aus D — und der Fall wird gruen, obwohl `saveLoot()` nie gespeichert hat
    // (am heutigen Code beim Mengen-Merge einmal in drei Laeufen so gemessen).
    // Erkennbar ist sie daran, dass die App `_version` der Saat ueberschreibt.
    // Kommt binnen 4 s keine, steht auch keine aus.
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
    await page.evaluate(() => window.switchView('loot'));
    await expect(page.locator('#view-loot')).toBeVisible();
    if (kleiner) {
        await page.setViewportSize(kleiner);
        await page.waitForTimeout(450);
    }
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen (Liste, Speicher, leeres Formular,
 *  Fehlerlog), nicht nur die erste. Vorbedingungen, ohne die der naechste
 *  Schritt haengen bliebe (Formular offen/zu), bleiben hart. */
const weich = expect.configure({ soft: true });

/** Der Stand in den Daten, `Name xMenge` nach Name sortiert — dieselbe Form
 *  fuer D, Liste und Speicher.
 *  @param {import('@playwright/test').Page} page */
function daten(page) {
    return page.evaluate(() =>
        (window.D.loot || [])
            .map(i => `${i.name} x${i.quantity}`)
            .sort()
            .join(' | ')
    );
}

/** Der Stand, den die Liste ZEIGT: Name und Menge jeder Zeile.
 *  @param {import('@playwright/test').Page} page */
function liste(page) {
    return page.evaluate(() =>
        Array.from(document.querySelectorAll('#loot-list .loot-item'))
            .map(z => {
                const name = z.querySelector('.loot-item-name')?.firstChild?.textContent?.trim();
                const menge = (z.querySelector('.loot-item-meta')?.textContent || '').match(
                    /×(-?\d+)/
                );
                return `${name} x${menge ? menge[1] : '?'}`;
            })
            .sort()
            .join(' | ')
    );
}

/** Der Stand im Speicher.
 *  @param {import('@playwright/test').Page} page */
function speicher(page) {
    return page.evaluate(schluessel => {
        const roh = localStorage.getItem(schluessel);
        if (!roh) return '(leer)';
        try {
            return (JSON.parse(roh).loot || [])
                .map(i => `${i.name} x${i.quantity}`)
                .sort()
                .join(' | ');
        } catch {
            return '(nicht lesbar)';
        }
    }, SPEICHER);
}

/** Alle Felder des Formulars, wie das Template sie fuehrt.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        return {
            offen: document.getElementById('loot-modal')?.classList.contains('show'),
            titel: document.querySelector('#loot-modal .modal-title')?.textContent?.trim(),
            id: wert('edit-loot-id'),
            name: wert('loot-name'),
            kategorie: wert('loot-cat'),
            seltenheit: wert('loot-rarity'),
            menge: wert('loot-qty'),
            gewicht: wert('loot-wt'),
            wert: wert('loot-val'),
            herkunft: wert('loot-origin'),
            besonderheit: wert('loot-special'),
            eigenschaft: wert('loot-property'),
            beschreibung: document.getElementById('loot-desc')?.textContent?.trim(),
            tags: Array.from(
                document.querySelectorAll('#loot-tag-grid .loot-tag-chip input:checked')
            )
                .map(c => /** @type {HTMLInputElement} */ (c).value)
                .sort(),
            tagAnzeige: (document.getElementById('loot-selected-tags')?.textContent || '')
                .replace(/\s+/g, ' ')
                .trim()
        };
    });
}

/** Das leere Formular im Anlege-Zustand — die Vorgaben des Templates
 *  (`assets/templates/modals-entity.html`): erste Kategorie, Seltenheit
 *  normal, Menge 1, alles andere leer. */
const LEER = {
    offen: true,
    titel: 'Item hinzufügen',
    id: '',
    name: '',
    kategorie: 'weapons',
    seltenheit: 'normal',
    menge: '1',
    gewicht: '',
    wert: '',
    herkunft: '',
    besonderheit: '',
    eigenschaft: '',
    beschreibung: '',
    tags: [],
    tagAnzeige: ''
};

/** "+ Item" in der Werkzeugleiste der Truhe. */
const PLUS = '#view-loot .section-toolbar-actions .btn-primary';

/** Wartet, bis D, Liste und Speicher denselben erwarteten Stand zeigen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} erwartet
 *  @param {string} was */
async function ueberall(page, erwartet, was) {
    weich(await daten(page), `${was}: D.loot`).toBe(erwartet);
    weich(await liste(page), `${was}: die Liste muss SOFORT neu gezeichnet sein`).toBe(erwartet);
    await weich
        .poll(() => speicher(page), {
            timeout: SOFORT_MS,
            message: `${was}: localStorage muss den Stand sofort tragen (save() entprellt 300 ms)`
        })
        .toBe(erwartet);
}

// ===========================================================================
// (1) ✏️ OEFFNET DAS FORMULAR MIT DEN WERTEN DES GEGENSTANDS — und Speichern kommt an
// ===========================================================================
test('(1) ✏️ im Detail oeffnet das Formular mit allen Werten, Speichern steht sofort ueberall', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await truheLaden(page, [HEILTRANK]);

    await page.locator('#loot-list .loot-item').first().click();
    await page.locator('#loot-detail-panel [data-action="edit-loot"]').click();

    const offen = await formular(page);
    expect(
        offen,
        `✏️ muss das Formular mit dem Heiltrank fuellen — Fehler: ${JSON.stringify(await fehler.alle())}`
    ).toEqual({
        offen: true,
        titel: 'Item bearbeiten',
        id: '1',
        name: 'Heiltrank',
        kategorie: 'potions',
        seltenheit: 'common',
        menge: '2',
        gewicht: '0.5',
        wert: '50',
        herkunft: 'loot',
        besonderheit: 'Rot',
        eigenschaft: 'Heilung',
        beschreibung: 'Heilt 2W4+2',
        tags: ['consumable', 'potion'],
        tagAnzeige: '🧪 Trank 💨 Verbrauchsgut'
    });

    // Die Anzeige unter dem Tag-Raster folgt dem Ankreuzen, nicht nur dem
    // Oeffnen — sonst nennt sie nach dem ersten Klick Tags, die nicht mehr gelten.
    await page.locator('#loot-tag-grid .loot-tag-chip:has(input[value="potion"])').click();
    weich((await formular(page)).tagAnzeige, 'Tag-Anzeige nach dem Abwaehlen von "Trank"').toBe(
        '💨 Verbrauchsgut'
    );

    await page.locator('#loot-qty').fill('4');
    await page.locator('#loot-save-btn').click();
    await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);
    await ueberall(page, 'Heiltrank x4', 'Bearbeiten');
    weich(
        await page.evaluate(() => window.D.loot[0].tags),
        'Bearbeiten speichert die abgewaehlten Tags'
    ).toEqual(['consumable']);

    weich(await fehler.alle(), 'Bearbeiten darf keinen Fehler hinterlassen').toEqual([]);
});

// ===========================================================================
// (2) ANLEGEN STEHT SOFORT IN LISTE UND SPEICHER — und das Formular ist danach leer
// ===========================================================================
test('(2) Anlegen steht sofort in Liste und Speicher, das naechste "+ Item" ist leer', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await truheLaden(page, [HEILTRANK]);

    await page.locator(PLUS).click();
    // Jedes Feld belegen — ein Leeren, das eines vergisst, faellt so auf.
    await page.locator('#loot-name').fill('Seil');
    await page.locator('#loot-cat').selectOption('misc');
    await page.locator('#loot-rarity').selectOption('uncommon');
    await page.locator('#loot-qty').fill('2');
    await page.locator('#loot-wt').fill('5');
    await page.locator('#loot-val').fill('1');
    await page.locator('#loot-origin').selectOption('purchase');
    await page.locator('#loot-special').fill('Hanf');
    await page.locator('#loot-property').fill('15 m');
    await page.locator('#loot-desc').click();
    await page.keyboard.type('Ein festes Seil');
    await page.locator('#loot-tag-grid .loot-tag-chip:has(input[value="light"])').click();
    weich((await formular(page)).tagAnzeige, 'Die Tag-Anzeige folgt dem Ankreuzen').toBe(
        '🪶 Leicht'
    );
    await page.locator('#loot-save-btn').click();
    await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);

    await ueberall(page, 'Heiltrank x2 | Seil x2', 'Anlegen');
    await weich(page.locator('#loot-list .loot-item', { hasText: 'Seil' })).toBeVisible();

    await page.locator(PLUS).click();
    weich(
        await formular(page),
        'Nach dem Speichern muss "+ Item" ein leeres Formular oeffnen'
    ).toEqual(LEER);

    weich(await fehler.alle(), 'Anlegen darf keinen Fehler hinterlassen').toEqual([]);
});

// ===========================================================================
// (3) MENGEN-MERGE STEHT SOFORT IN LISTE UND SPEICHER
// ===========================================================================
test('(3) Mengen-Merge steht sofort in Liste und Speicher', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await truheLaden(page, [HEILTRANK]);

    await page.locator(PLUS).click();
    await page.locator('#loot-name').fill('heiltrank');
    await page.locator('#loot-cat').selectOption('potions');
    await page.locator('#loot-rarity').selectOption('common');
    await page.locator('#loot-qty').fill('3');
    await page.locator('#loot-save-btn').click();
    await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);

    await ueberall(page, 'Heiltrank x5', 'Mengen-Merge');

    await page.locator(PLUS).click();
    weich(await formular(page), 'Nach dem Merge muss "+ Item" ein leeres Formular oeffnen').toEqual(
        LEER
    );

    weich(await fehler.alle(), 'Der Merge darf keinen Fehler hinterlassen').toEqual([]);
});

// ===========================================================================
// (4) DIE LEERE TRUHE — ihr eigener "+ Item hinzufuegen"-Knopf
// ===========================================================================
test('(4) "+ Item hinzufuegen" der leeren Truhe legt sofort sichtbar und gespeichert an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await truheLaden(page, []);

    await page.locator('#loot-list .loot-add-btn').click();
    expect(await formular(page), 'Die leere Truhe oeffnet ein leeres Formular').toEqual(LEER);
    await page.locator('#loot-name').fill('Fackel');
    await page.locator('#loot-save-btn').click();
    await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);

    await ueberall(page, 'Fackel x1', 'Anlegen aus der leeren Truhe');

    weich(await fehler.alle(), 'Anlegen darf keinen Fehler hinterlassen').toEqual([]);
});

// ===========================================================================
// (5) BEARBEITEN -> ABBRECHEN -> "+ ITEM" LEGT AN UND UEBERSCHREIBT NICHT
// ===========================================================================
test('(5) nach abgebrochenem Bearbeiten legt "+ Item" einen NEUEN Gegenstand an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await truheLaden(page, [HEILTRANK]);

    await page.locator('#loot-list .loot-item').first().click();
    await page.locator('#loot-detail-panel [data-action="edit-loot"]').click();
    await expect(page.locator('#loot-modal')).toHaveClass(/\bshow\b/);
    await page.locator('#loot-modal .btn-group [data-action="hide-modal"]').click();
    await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);

    await page.locator(PLUS).click();
    expect(
        await formular(page),
        '"+ Item" nach abgebrochenem Bearbeiten muss leer und im Anlege-Zustand sein — ' +
            'sonst ueberschreibt das naechste Speichern den bearbeiteten Gegenstand'
    ).toEqual(LEER);
    await page.locator('#loot-name').fill('Fackel');
    await page.locator('#loot-save-btn').click();

    await ueberall(page, 'Fackel x1 | Heiltrank x2', 'Anlegen nach abgebrochenem Bearbeiten');

    weich(await fehler.alle(), 'Kein Schritt darf einen Fehler hinterlassen').toEqual([]);
});

// ===========================================================================
// (6) DASSELBE AUF DEM TELEFON, MIT DEM FINGER
// ===========================================================================
//
// DER ABSTAND ZWISCHEN ZWEI TIPPERN IST KEINE GEDULD, SONDERN NOETIG.
// `initTouchOptimizations()` (`systems/avatars.js`) ruft `preventDefault()` auf
// jedem `touchend` an einem Knopf, der weniger als 300 ms nach dem vorigen
// kommt (Doppeltipp-Zoom-Sperre) — der Browser erzeugt dann KEIN `click`.
// Gemessen in sechs Laeufen: "+ Item" und "Speichern" 65 bis 100 ms
// nacheinander getippt, `touchend` am Speichern-Knopf, kein `mousedown`, kein
// `click`, Formular bleibt offen. Ein Mensch tippt dazwischen einen Namen; der
// Test wartet stattdessen.
test.describe('(6) Telefon 390x844', () => {
    test.use({ hasTouch: true });

    /** Tippt nach mehr als 300 ms Abstand zum vorigen Tipper.
     *  @param {import('@playwright/test').Locator} ziel */
    async function tippen(ziel) {
        await ziel.page().waitForTimeout(350);
        await ziel.tap();
    }

    test('(6) Anlegen und Mengen-Merge stehen sofort in Liste und Speicher', async ({ page }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        await truheLaden(page, [HEILTRANK], TELEFON);

        await tippen(page.locator(PLUS));
        await page.locator('#loot-name').fill('Seil');
        await tippen(page.locator('#loot-save-btn'));
        await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);
        await ueberall(page, 'Heiltrank x2 | Seil x1', 'Anlegen (Telefon)');
        await weich(page.locator('#loot-list .loot-item', { hasText: 'Seil' })).toBeVisible();

        await tippen(page.locator(PLUS));
        weich(await formular(page), 'Telefon: das naechste "+ Item" ist leer').toEqual(LEER);
        await page.locator('#loot-name').fill('Heiltrank');
        await page.locator('#loot-cat').selectOption('potions');
        await page.locator('#loot-rarity').selectOption('common');
        await page.locator('#loot-qty').fill('3');
        await tippen(page.locator('#loot-save-btn'));
        await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);
        await ueberall(page, 'Heiltrank x5 | Seil x1', 'Mengen-Merge (Telefon)');

        weich(await fehler.alle(), 'Telefon: kein Fehler').toEqual([]);
    });
});

// ===========================================================================
// (7) BEARBEITEN -> ABBRECHEN -> LOESCHEN -> "+ ITEM HINZUFUEGEN" DER LEEREN TRUHE
// ===========================================================================
//
// Der zweite "+ Item"-Knopf sitzt in der LEEREN Truhe (`renderLootList()`),
// und auf ihn wird man genau dann gestossen, wenn man den letzten Gegenstand
// geloescht hat — oft nachdem man ihn sich in ✏️ angesehen hat. Fall (4)
// faehrt den Knopf nur mit frisch geladener, leerer Truhe, wo das Formular
// noch nie gefuellt war: dort ist er auch mit `show-modal` gruen. Fall (5)
// faehrt nur den Knopf der Werkzeugleiste.
//
// GEGENPROBE (gemessen, Buendel mit beiden Funktionen, nur der Knopf der
// leeren Truhe zurueck auf `show-modal`): das Formular zeigte "Item
// bearbeiten" mit ID 1 und "Heiltrank"; Speichern als "Fackel" suchte ID 1,
// fand sie nicht mehr und tat NICHTS — keine Meldung, `D.loot` leer, Liste
// und Speicher leer. Der Gegenstand ging ohne jedes Zeichen verloren. Darum
// ist die Zusage zum leeren Formular hier weich: ein roter Lauf soll den
// Verlust danach auch nennen.
test('(7) nach Bearbeiten, Abbrechen und Loeschen legt "+ Item hinzufuegen" der leeren Truhe an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await truheLaden(page, [HEILTRANK]);

    await page.locator('#loot-list .loot-item').first().click();
    await page.locator('#loot-detail-panel [data-action="edit-loot"]').click();
    await expect(page.locator('#loot-modal')).toHaveClass(/\bshow\b/);
    await page.locator('#loot-modal .btn-group [data-action="hide-modal"]').click();
    await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);

    // `removeLoot()` fragt mit dem nativen `confirm()`.
    page.once('dialog', d => d.accept());
    await page.locator('#loot-detail-panel [data-action="delete-loot"]').click();
    await expect(page.locator('#loot-list .loot-add-btn')).toBeVisible();
    expect(await daten(page), 'Vorbedingung: die Truhe ist leer').toBe('');

    await page.locator('#loot-list .loot-add-btn').click();
    await expect(page.locator('#loot-modal')).toHaveClass(/\bshow\b/);
    weich(
        await formular(page),
        '"+ Item hinzufuegen" der leeren Truhe muss nach abgebrochenem Bearbeiten leer und ' +
            'im Anlege-Zustand sein — sonst sucht Speichern die geloeschte ID'
    ).toEqual(LEER);
    await page.locator('#loot-name').fill('Fackel');
    await page.locator('#loot-save-btn').click();
    await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);

    await ueberall(page, 'Fackel x1', 'Anlegen aus der leeren Truhe nach dem Loeschen');

    weich(await fehler.alle(), 'Kein Schritt darf einen Fehler hinterlassen').toEqual([]);
});
