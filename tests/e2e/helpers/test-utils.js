// @ts-check
/**
 * Test Utilities für D&D Tracker E2E Tests
 * Gemeinsame Hilfsfunktionen für alle Tests
 */

/**
 * Seedet einen sauberen App-Zustand VOR dem App-Boot (per page.addInitScript), damit kein
 * fruehzeitiger save() den geteilten #toast-Knoten mit einem eigenen Hinweis ueberschreibt,
 * bevor eine Testassertion ihn liest. Muss vor loadApp(page) aufgerufen werden.
 *
 * 08-RESEARCH Pitfall 4 / D-06: seed markdownOnboardingSeen BEFORE loadApp()
 * so the 2000ms onboarding setTimeout (ui/editors/markdown-shortcuts.js) never
 * schedules and can't overwrite a validation-error toast in the shared legacy
 * #toast node during the assertion window. Documented setup, not masking —
 * these tests verify validation-error display, not the onboarding flow.
 *
 * Also seed the collections that are NOT part of initializeData()'s default
 * schema (randomTables, timers, shops, campaign) plus a fully-populated
 * _nextId map. Root-cause investigation (traced via stack-trace instrumentation)
 * found a SECOND, independent early-boot race with the exact same shape:
 * features/random-tables.js:initRandomTables() calls save() unconditionally
 * whenever D.randomTables is missing (fires ~150ms after boot, every fresh
 * session — real users hit this too, not just tests), and
 * render/helpers.js:validateDataIntegrity() schedules a repair save() 1s after
 * load() whenever D.timers/D.shops/D.campaign or any _nextId entry is missing.
 * Either save() triggers systems/file-backup/file-backup-manager.js:onAfterSave()'s
 * once-per-session "Ungesicherte Aenderungen - Backup herunterladen?" info toast,
 * which stomps the shared #toast node exactly like the onboarding toast did.
 * Seeding a fully "already valid" shape prevents both triggers so no early
 * save()-driven toast can fire during the assertion window.
 *
 * WR-02 cross-reference (14-REVIEW.md): the payload below has no automated
 * link to the two schemas it depends on — if either changes without a
 * matching update here, this exact toast race would silently reappear. Named
 * explicitly so a future change is more likely to prompt an update:
 *   - `core/data.js`:`initializeData()` — its default keys (`characters`,
 *     `npcs`, `locations`, `quests`, `sessionNotes`, `storyArcs`, `loot`,
 *     `encounters`, `spells`, `links`, `wiki`, `filters`, `tags`, `bestiary`,
 *     `bestiaryFavorites`, `sessionPreps`, `factions`, plus the `initiative`,
 *     `calendar`, `settings`, `soundboard` objects and `_nextId: {}`) already
 *     exist before `load()`'s `Object.assign(D, p)` runs, so this seed does
 *     NOT need to repeat them — only the keys initializeData() does NOT
 *     default (`randomTables`, `timers`, `shops`, `campaign`) plus a
 *     fully-populated `_nextId` map.
 *   - `render/helpers.js`:`validateDataIntegrity()` — its `requiredArrays`
 *     (`characters`, `npcs`, `locations`, `quests`, `spells`, `loot`,
 *     `shops`, `encounters`, `sessionNotes`, `wiki`, `links`, `filters`,
 *     `timers`) and `requiredObjects` (`settings`, `campaign`) lists must
 *     each have a corresponding key present here (directly or via
 *     initializeData()'s defaults above) — a repair `save()` fires 1s after
 *     boot for any missing one, which is the second trigger this seed
 *     prevents.
 * If a future change adds a new required top-level array/object to either
 * list without updating this seed accordingly, re-check both lists against
 * the payload below.
 * @param {import('@playwright/test').Page} page
 */
export async function seedCleanSession(page) {
    await page.addInitScript(() => {
        try {
            localStorage.setItem(
                'dnd-tracker-v4',
                JSON.stringify({
                    // Far-future _version so load() skips migrateData() entirely —
                    // the seed is a minimal settings-only payload, not a full export.
                    _version: '99.0.0',
                    settings: {
                        theme: 'dark',
                        lastView: 'dashboard',
                        enableMarkdownShortcuts: true,
                        enableMarkdownImportExport: true,
                        markdownOnboardingSeen: true,
                        levelingMode: 'xp'
                    },
                    randomTables: [],
                    timers: [],
                    shops: [],
                    campaign: {},
                    _nextId: {
                        characters: 1,
                        npcs: 1,
                        locations: 1,
                        quests: 1,
                        encounters: 1,
                        spells: 1,
                        loot: 1,
                        items: 1,
                        wiki: 1,
                        sessionNotes: 1,
                        randomTables: 1
                    }
                })
            );
        } catch {
            // file:// localStorage restrictions vary by browser build; if the seed
            // silently fails, the app falls back to its own default (the pre-fix
            // race may return) — no crash either way.
        }
    });
}

/**
 * Seedet einen BEFUELLTEN App-Zustand VOR dem App-Boot (per page.addInitScript) — Geschwister
 * von `seedCleanSession()` oben, NICHT dessen Ersatz. `seedCleanSession()` bleibt zeichengleich
 * unveraendert; jeder bestehende Spec, der ihn benutzt, behaelt seine dokumentierte Absicherung
 * gegen die beiden Fruehstart-Rennen (siehe Kopfkommentar oben). Dieser Seed erbt dieselbe
 * Begruendung (weit-in-der-Zukunft-`_version` ueberspringt `migrateData()`; dieselben vier
 * Schluessel, die `initializeData()` nicht vorbelegt: `randomTables`, `timers`, `shops`,
 * `campaign`; eine vollstaendig gefuellte `_nextId`-Abbildung) und ergaenzt sie um sechs
 * Datensaetze, die je eine der vier in Plan 15-12 wiederhergestellten CSS-Regelfamilien
 * erreichbar machen (Phase 15, Plan 15-13, REG-01..REG-05):
 *
 *   - Ein Charakter mit Zauberplaetzen in der kanonischen Form aus
 *     `features/party/party-crud.js:186` (`{max, current}` je Grad) — Grad 0 vollstaendig
 *     gefuellt (2/2), Grad 1 mit gefuelltem UND leerem Punkt (2 von 4) — beide Pip-Zustaende
 *     werden gerendert.
 *   - Ein NPC — Ziel des Shop-Kopf-Chips (REG-01) und Mitgliederzaehlung der Fraktion.
 *   - Ein Ort — Ziel des zweiten Shop-Kopf-Chips.
 *   - Ein Shop mit `npcId`/`locationId` auf die beiden vorigen Datensaetze und zwei Artikeln:
 *     einer mit `available: false` (REG-02, `.si-unavailable`-Deckkraft), einer ohne diese
 *     Angabe (Standard = verfuegbar, damit beide Zustaende nebeneinander stehen).
 *   - Eine Fraktion mit einer Ruf-Historie aus einem positiven UND einem negativen Eintrag
 *     (REG-03, `.fr-hist-plus`/`.fr-hist-minus` — ohne beide Vorzeichen ist nur eine der beiden
 *     Farbklassen belegt).
 *   - Ein Mob-Kombattant in der Initiative in der Datenform aus `features/initiative-mob.js`
 *     (`cb.mob = {count, poolHp, maxPoolHp, individualMaxHp, attackMode}`), Angriffsmodus
 *     `'nfach'` (N-facher Einzelwurf) — der Zustand, in dem `.init-mob-dmg-inputs` per
 *     `.hidden`-Zusatzklasse verborgen sein MUSS (REG-04); REG-05 schaltet den Modus im Test
 *     selbst um.
 *
 * Der Shop-Kopf-Chip (REG-01) und die Ruf-Historie (REG-03) entstehen erst im aufgeklappten
 * Shop bzw. bei ausgewaehlter Fraktion — dieser Seed allein genuegt nicht, der jeweilige Test
 * muss `window.toggleShop(id)` bzw. `window.selectFraktion(id)` selbst aufrufen.
 * @param {import('@playwright/test').Page} page
 */
export async function seedPopulatedSession(page) {
    await page.addInitScript(() => {
        try {
            localStorage.setItem(
                'dnd-tracker-v4',
                JSON.stringify({
                    // Far-future _version so load() skips migrateData() entirely — wie
                    // seedCleanSession(), s.o.
                    _version: '99.0.0',
                    settings: {
                        theme: 'dark',
                        lastView: 'dashboard',
                        enableMarkdownShortcuts: true,
                        enableMarkdownImportExport: true,
                        markdownOnboardingSeen: true,
                        levelingMode: 'xp'
                    },
                    randomTables: [],
                    timers: [],
                    campaign: {},
                    characters: [
                        {
                            id: 1,
                            name: 'Testzauberin (Populated Seed, 15-13)',
                            characterClass: 'Magier',
                            level: 5,
                            attributes: { str: 8, dex: 12, con: 12, int: 16, wis: 10, cha: 10 },
                            hpCurrent: 30,
                            hpMax: 30,
                            armorClass: 12,
                            spellSlots: {
                                0: { max: 2, current: 2 },
                                1: { max: 4, current: 2 }
                            }
                        }
                    ],
                    npcs: [
                        {
                            id: 1,
                            name: 'Testhaendler (Populated Seed, 15-13)',
                            role: 'Merchant',
                            race: 'Mensch',
                            chapter: '1',
                            description: 'Seed-NPC fuer die REG-Faelle aus Plan 15-13.'
                        }
                    ],
                    locations: [
                        {
                            id: 1,
                            name: 'Testort (Populated Seed, 15-13)',
                            description: 'Seed-Ort fuer die REG-Faelle aus Plan 15-13.'
                        }
                    ],
                    shops: [
                        {
                            id: 1,
                            type: 'laden',
                            name: 'Testladen (Populated Seed, 15-13)',
                            npcId: 1,
                            locationId: 1,
                            description: '',
                            special: '',
                            note: '',
                            items: [
                                {
                                    name: 'Nicht verfuegbarer Trank',
                                    category: 'misc',
                                    cost: '10 gp',
                                    available: false,
                                    quantity: 1
                                },
                                {
                                    name: 'Verfuegbares Schwert',
                                    category: 'weapon',
                                    cost: '15 gp',
                                    quantity: 1
                                }
                            ]
                        }
                    ],
                    factions: [
                        {
                            id: 1,
                            name: 'Testfraktion (Populated Seed, 15-13)',
                            symbol: '⚔️',
                            agenda: '',
                            beschreibung: '',
                            ruf: 5,
                            rufHistorie: [
                                { delta: 10, grund: 'Testgrund positiv (15-13)', zeitstempel: Date.now() },
                                { delta: -5, grund: 'Testgrund negativ (15-13)', zeitstempel: Date.now() }
                            ],
                            mitgliederNpcIds: [],
                            sitzOrtId: null,
                            rivalen: '',
                            verbuendete: '',
                            links: []
                        }
                    ],
                    initiative: {
                        combatants: [
                            {
                                id: 1,
                                name: 'Testmob-Schwarm (Populated Seed, 15-13)',
                                initiative: 15,
                                initBonus: 2,
                                maxHp: 40,
                                currentHp: 40,
                                ac: 14,
                                type: 'monster',
                                cr: '1',
                                xp: 200,
                                effects: [],
                                statblockRef: { source: 'srd', id: 'goblin' },
                                mob: {
                                    count: 5,
                                    poolHp: 40,
                                    maxPoolHp: 40,
                                    individualMaxHp: 8,
                                    attackMode: 'nfach'
                                }
                            }
                        ],
                        currentTurn: 0,
                        round: 1
                    },
                    // Vollstaendig gefuellte Kennungszaehler-Abbildung — dieselben elf Schluessel
                    // wie seedCleanSession(), auf die neuen Hoechst-IDs (1) je befuellter
                    // Sammlung angehoben (validateAndRepairNextId() prueft ausschliesslich diese
                    // elf Schluessel; shops/factions/combatants sind darin NICHT enthalten und
                    // werden folglich nicht ueberprueft).
                    _nextId: {
                        characters: 2,
                        npcs: 2,
                        locations: 2,
                        quests: 1,
                        encounters: 1,
                        spells: 1,
                        loot: 1,
                        items: 1,
                        wiki: 1,
                        sessionNotes: 1,
                        randomTables: 1
                    }
                })
            );
        } catch {
            // file:// localStorage restrictions vary by browser build; if the seed
            // silently fails, the app falls back to its own default (empty state).
        }
    });
}

/**
 * Lädt die App und wartet auf vollständige Initialisierung
 * @param {import('@playwright/test').Page} page
 */
export async function loadApp(page) {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    // Warte auf App-Initialisierung
    await page.waitForTimeout(500);
}

/**
 * Navigiert zu einem Tab
 * @param {import('@playwright/test').Page} page
 * @param {string} tabName - z.B. 'party', 'npcs', 'locations', 'quests', 'encounter', 'dice'
 */
export async function navigateToTab(page, tabName) {
    const tab = page.locator(`.nav-tab[data-view="${tabName}"]`);
    // Gruppierte Nav: liegt der Tab in einem geschlossenen Dropdown, erst die Gruppe öffnen
    if (!(await tab.isVisible())) {
        const group = page.locator('.nav-group', {
            has: page.locator(`.nav-tab[data-view="${tabName}"]`)
        });
        if ((await group.count()) > 0) {
            await group.locator('.nav-group-btn').click();
            await page.waitForTimeout(50);
        }
    }
    await tab.click();
    await page.waitForTimeout(300);
}

/**
 * Öffnet ein Collapse-Formular
 * @param {import('@playwright/test').Page} page
 * @param {string} formName - z.B. 'char-form', 'enc-form'
 */
export async function openCollapseForm(page, formName) {
    const form = page.locator(`#${formName}`);
    const isOpen = await form.evaluate(el => el.classList.contains('open'));

    if (!isOpen) {
        await page.click(`[data-action="toggle-collapse"][data-value="${formName}"]`);
        await page.waitForTimeout(300);
    }
}

/**
 * Schließt ein Collapse-Formular
 * @param {import('@playwright/test').Page} page
 * @param {string} formName
 */
export async function closeCollapseForm(page, formName) {
    const form = page.locator(`#${formName}`);
    const isOpen = await form.evaluate(el => el.classList.contains('open'));

    if (isOpen) {
        await page.click(`[data-action="toggle-collapse"][data-value="${formName}"]`);
        await page.waitForTimeout(300);
    }
}

/**
 * Öffnet ein Modal
 * @param {import('@playwright/test').Page} page
 * @param {string} modalId - z.B. 'npc-modal', 'quest-modal'
 */
export async function openModal(page, modalId) {
    // Modal öffnen falls nicht bereits offen
    const modal = page.locator(`#${modalId}`);
    const isVisible = await modal.isVisible();

    if (!isVisible) {
        // Versuche über data-action zu öffnen
        const openButton = page
            .locator(`[data-action="open-${modalId}"], [onclick*="${modalId}"]`)
            .first();
        if (await openButton.isVisible()) {
            await openButton.click();
            await page.waitForTimeout(300);
        }
    }
}

/**
 * Schließt ein Modal per Escape
 * @param {import('@playwright/test').Page} page
 */
export async function closeModal(page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
}

/**
 * Füllt ein Textfeld aus
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS Selector oder ID
 * @param {string} value
 */
export async function fillField(page, selector, value) {
    const field = page.locator(selector.startsWith('#') ? selector : `#${selector}`);
    await field.fill(value);
}

/**
 * Wählt eine Option aus einem Dropdown (falls Option existiert)
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} value
 */
export async function selectOption(page, selector, value) {
    const select = page.locator(selector.startsWith('#') ? selector : `#${selector}`);

    // Prüfe ob die Option existiert
    const options = await select.locator('option').allTextContents();
    const optionExists = options.some(
        opt => opt.toLowerCase().includes(value.toLowerCase()) || opt === value
    );

    if (optionExists) {
        try {
            await select.selectOption(value);
        } catch {
            // Falls direkte Auswahl fehlschlägt, versuche über Label
            const matchingOption = options.find(opt =>
                opt.toLowerCase().includes(value.toLowerCase())
            );
            if (matchingOption) {
                await select.selectOption({ label: matchingOption });
            }
        }
    }
    // Wenn Option nicht existiert, einfach überspringen
}

/**
 * Klickt einen Button mit data-action
 * @param {import('@playwright/test').Page} page
 * @param {string} action - z.B. 'save-character', 'delete-npc'
 * @param {string} [value] - Optional data-value
 */
export async function clickAction(page, action, value) {
    const selector = value
        ? `[data-action="${action}"][data-value="${value}"]`
        : `[data-action="${action}"]`;
    await page.click(selector);
    await page.waitForTimeout(300);
}

/**
 * Wartet auf Toast-Nachricht
 * @param {import('@playwright/test').Page} page
 * @param {string} [text] - Optionaler Text der enthalten sein soll
 */
export async function waitForToast(page, text) {
    const toast = page.locator('#toast.show');
    await toast.waitFor({ state: 'visible', timeout: 3000 });
    if (text) {
        await page.waitForFunction(
            expectedText => document.querySelector('#toast')?.textContent?.includes(expectedText),
            text,
            { timeout: 3000 }
        );
    }
    // Warte bis Toast verschwindet
    await page.waitForTimeout(1500);
}

/**
 * Löscht alle App-Daten (localStorage)
 * @param {import('@playwright/test').Page} page
 */
export async function clearAppData(page) {
    await page.evaluate(() => {
        localStorage.clear();
        // @ts-ignore
        if (typeof D !== 'undefined') {
            // @ts-ignore
            D.characters = [];
            // @ts-ignore
            D.npcs = [];
            // @ts-ignore
            D.locations = [];
            // @ts-ignore
            D.quests = [];
            // @ts-ignore
            D.encounters = [];
            // @ts-ignore
            D.loot = [];
            // @ts-ignore
            D.spells = [];
        }
    });
}

/**
 * Holt die aktuelle Anzahl von Entities
 * @param {import('@playwright/test').Page} page
 * @param {string} type - z.B. 'characters', 'npcs', 'locations'
 */
export async function getEntityCount(page, type) {
    return await page.evaluate(entityType => {
        // @ts-ignore
        return D && D[entityType] ? D[entityType].length : 0;
    }, type);
}

/**
 * Holt Entity-Daten nach ID
 * @param {import('@playwright/test').Page} page
 * @param {string} type
 * @param {number} id
 */
export async function getEntityById(page, type, id) {
    return await page.evaluate(
        ({ entityType, entityId }) => {
            // @ts-ignore
            return D && D[entityType] ? D[entityType].find(e => e.id === entityId) : null;
        },
        { entityType: type, entityId: id }
    );
}

/**
 * Generiert einen eindeutigen Testnamen
 * @param {string} prefix
 */
export function generateTestName(prefix) {
    return `${prefix}_Test_${Date.now()}`;
}

/**
 * Prüft ob Element sichtbar ist
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function isVisible(page, selector) {
    const element = page.locator(selector);
    return await element.isVisible();
}

/**
 * Wartet auf Änderung im DOM
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function waitForElement(page, selector, options = {}) {
    await page.locator(selector).waitFor({ state: 'visible', timeout: 5000, ...options });
}

/**
 * Führt Undo aus
 * @param {import('@playwright/test').Page} page
 */
export async function performUndo(page) {
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(300);
}

/**
 * Führt Redo aus
 * @param {import('@playwright/test').Page} page
 */
export async function performRedo(page) {
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(300);
}

/**
 * Speichert manuell (Ctrl+S)
 * @param {import('@playwright/test').Page} page
 */
export async function performSave(page) {
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(500);
}

/**
 * Holt den Inhalt eines Rich-Text-Editors
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function getRichTextContent(page, selector) {
    return await page.locator(selector).innerHTML();
}

/**
 * Setzt Rich-Text-Inhalt
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {string} content
 */
export async function setRichTextContent(page, selector, content) {
    await page.locator(selector).fill('');
    await page.locator(selector).pressSequentially(content);
}

// Test-Daten Generatoren
export const testData = {
    character: () => ({
        name: generateTestName('Hero'),
        player: 'Test Player',
        class: 'Fighter',
        race: 'Human',
        level: 5,
        hp: 45,
        ac: 16,
        str: 16,
        dex: 14,
        con: 15,
        int: 10,
        wis: 12,
        cha: 8
    }),

    npc: () => ({
        name: generateTestName('NPC'),
        role: 'Merchant',
        race: 'Dwarf',
        chapter: '1',
        description: 'A friendly merchant who sells potions.'
    }),

    location: () => ({
        name: generateTestName('Location'),
        description: 'A mysterious place full of adventure.'
    }),

    quest: () => ({
        title: generateTestName('Quest'),
        description: 'Find the lost artifact.',
        type: 'main',
        rewardGold: 100
    }),

    encounter: () => ({
        name: generateTestName('Monster'),
        creatureType: 'beast',
        cr: '1',
        ac: 13,
        hp: 22,
        str: 14,
        dex: 12,
        con: 13,
        int: 2,
        wis: 10,
        cha: 5
    })
};
