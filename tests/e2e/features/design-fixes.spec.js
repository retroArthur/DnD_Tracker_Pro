/**
 * E2E Tests — Design-Fixes (Phase 15, FIX-01/FIX-02/FIX-03)
 *
 * Gemeinsamer Ort fuer die Abnahme aller sichtbaren Design-Defekte dieser Phase.
 * Plan 15-04 legt die drei FIX-01-Faelle an (DM-Screen-Referenzwidgets Gelaende,
 * Fertigkeiten, Wissensgebiete); Plan 15-05 ergaenzt Faelle fuer die
 * Zauberplatz-Pips (FIX-02) und die Wuerfelfarbe (FIX-03).
 *
 * Abnahme laeuft ueber `getComputedStyle` gegen das GEBAUTE Buendel
 * (`dist/dnd-tracker-bundled.html`, siehe playwright.config.js baseURL) — nicht
 * gegen Deklarationstext. Die drei Widgets werden per `page.evaluate` ueber ihre
 * globalen Renderfunktionen erzeugt und in einen eigens angelegten Probe-Container
 * innerhalb der DM-Screen-Ansicht gehaengt; das ist zuverlaessiger als der Umweg
 * ueber einen Profilwechsel und beruehrt keinen gespeicherten Zustand. Der
 * Container wird nach jedem Testfall wieder entfernt.
 *
 * Jeder Testfall sichert ZUERST zu, dass mindestens ein Probe-Element gefunden
 * wurde — ohne diese Wache koennte ein Lauf, in dem die Injektion fehlschlaegt,
 * still gruen werden (T-15-08).
 */

import { test, expect } from '@playwright/test';
import { loadApp, navigateToTab, waitForAppReady } from '../helpers/test-utils.js';

const PROBE_ID = 'design-fixes-probe';

/**
 * Haengt das Ergebnis einer globalen DM-Screen-Renderfunktion als Probe-Container
 * in die DM-Screen-Ansicht. Wirft im Browser-Kontext, falls die Renderfunktion
 * nicht existiert — das macht einen Namensfehler sofort sichtbar statt ihn als
 * "0 Elemente gefunden" zu maskieren.
 * @param {import('@playwright/test').Page} page
 * @param {string} renderFnName
 */
async function injectWidgetProbe(page, renderFnName) {
    await page.evaluate(
        ({ id, fnName }) => {
            const view = document.getElementById('view-dmscreen');
            if (!view) throw new Error('view-dmscreen nicht gefunden');
            const fn = window[fnName];
            if (typeof fn !== 'function') {
                throw new Error(`Renderfunktion ${fnName} ist nicht global verfuegbar`);
            }
            const probe = document.createElement('div');
            probe.id = id;
            probe.innerHTML = fn();
            view.appendChild(probe);
        },
        { id: PROBE_ID, fnName: renderFnName }
    );
}

test.describe('FIX-01: DM-Screen-Referenzwidgets rendern gestylt', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'dmscreen');
    });

    test.afterEach(async ({ page }) => {
        await page.evaluate(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        }, PROBE_ID);
    });

    test('Gelaende-Eintrag hat Innenabstand, Flaeche und Eckenradius', async ({ page }) => {
        await injectWidgetProbe(page, 'renderDMSTerrainWidget');

        const items = page.locator(`#${PROBE_ID} .dms-terrain-item`);
        const count = await items.count();
        expect(count).toBeGreaterThan(0);

        const style = await items.first().evaluate(el => {
            const cs = getComputedStyle(el);
            return {
                padding: cs.paddingTop,
                background: cs.backgroundColor,
                radius: cs.borderRadius
            };
        });
        expect(style.padding).not.toBe('0px');
        expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
        expect(style.background).not.toBe('transparent');
        expect(style.radius).not.toBe('0px');
    });

    test('Fertigkeiten-Kopfzeile (Staerke) hat Flaeche und erhoehtes Schriftgewicht', async ({ page }) => {
        await injectWidgetProbe(page, 'renderDMSSkillsWidget');

        const headers = page.locator(`#${PROBE_ID} .dms-skill-header.str`);
        const count = await headers.count();
        expect(count).toBeGreaterThan(0);

        const style = await headers.first().evaluate(el => {
            const cs = getComputedStyle(el);
            return { background: cs.backgroundColor, weight: cs.fontWeight };
        });
        expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
        expect(style.background).not.toBe('transparent');
        expect(Number(style.weight)).toBeGreaterThan(400);
    });

    test('Wissensgebiete: Fertigkeitsname und Kreaturentypen unterscheiden sich', async ({ page }) => {
        await injectWidgetProbe(page, 'renderDMSKnowledgeWidget');

        const skillEls = page.locator(`#${PROBE_ID} .dms-know-skill`);
        const typeEls = page.locator(`#${PROBE_ID} .dms-know-types`);
        const skillCount = await skillEls.count();
        const typeCount = await typeEls.count();
        expect(skillCount).toBeGreaterThan(0);
        expect(typeCount).toBeGreaterThan(0);

        const [skillStyle, typeStyle] = await Promise.all([
            skillEls.first().evaluate(el => {
                const cs = getComputedStyle(el);
                return { weight: cs.fontWeight, color: cs.color };
            }),
            typeEls.first().evaluate(el => {
                const cs = getComputedStyle(el);
                return { weight: cs.fontWeight, color: cs.color };
            })
        ]);
        const differs = skillStyle.weight !== typeStyle.weight || skillStyle.color !== typeStyle.color;
        expect(differs).toBe(true);
    });
});

test.describe('FIX-02: Zauberplatz-Pips einer Charakterkarte (kompakte Anzeige)', () => {
    const CHAR_ID = 88801;

    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'party');
    });

    test.afterEach(async ({ page }) => {
        await page.evaluate(() => {
            // @ts-ignore
            window.D.characters = [];
            // @ts-ignore
            if (typeof window.renderParty === 'function') window.renderParty();
        });
    });

    /**
     * Injiziert einen Zaubernden mit Zauberplaetzen in der KANONISCHEN Datenform
     * ({max, current} je Grad — wie die Charakterverwaltung sie schreibt und
     * die Umschaltfunktion sie liest) und zeichnet die Partyliste neu.
     * Kein save() hier — das uebernimmt der spaetere Klick auf einen Pip
     * (toggleSpellSlot() ruft save() selbst auf), analog zum etablierten Muster
     * in inspiration.spec.js.
     * @param {import('@playwright/test').Page} page
     * @param {Record<number, {max: number, current: number}>} spellSlots
     */
    async function injectSpellcaster(page, spellSlots) {
        await page.evaluate(
            ({ id, slots }) => {
                const ch = {
                    id,
                    name: 'Testzauberer (FIX-02)',
                    characterClass: 'Zauberer',
                    level: 5,
                    hpCurrent: 30,
                    hpMax: 30,
                    armorClass: 12,
                    attributes: { str: 8, dex: 12, con: 12, int: 10, wis: 10, cha: 16 },
                    spellSlots: slots
                };
                // @ts-ignore
                window.D.characters = [ch];
                // @ts-ignore
                if (typeof window.renderParty === 'function') window.renderParty();
            },
            { id: CHAR_ID, slots: spellSlots }
        );
        await page.waitForTimeout(300);
    }

    test('Zauberplatz-Pips sind sichtbar mit berechneter Breite groesser als null', async ({ page }) => {
        await injectSpellcaster(page, {
            0: { max: 2, current: 2 },
            1: { max: 3, current: 3 },
            2: { max: 1, current: 0 }
        });

        const pips = page.locator('.spell-slots-compact .slot-pip');
        const count = await pips.count();
        expect(count).toBeGreaterThan(0);

        const width = await pips.first().evaluate(el => parseFloat(getComputedStyle(el).width));
        expect(width).toBeGreaterThan(0);

        // Zaubertricks (Grad 0) sind ein reiner Zaehler ohne Klickaktion — kein
        // Zaubertrick wird "verbraucht" (FIX-02-Verhalten, spellslots-ui.js-Vorbild)
        const cantripActionCount = await page
            .locator('.spell-slots-compact [data-action="toggle-spell-slot-stop"][data-value="0"]')
            .count();
        expect(cantripActionCount).toBe(0);
    });

    test('Klick auf einen gefuellten Zauberplatz-Pip senkt den Stand im Datenobjekt', async ({ page }) => {
        await injectSpellcaster(page, {
            1: { max: 3, current: 3 }
        });

        await page.locator('.spell-slots-compact .slot-pip[data-value="1"]').first().click();
        await page.waitForTimeout(500);

        const current = await page.evaluate(id => {
            // @ts-ignore
            const ch = window.D.characters.find(c => c.id === id);
            return ch ? ch.spellSlots[1].current : null;
        }, CHAR_ID);
        expect(current).toBe(2);
    });

    test('Der gesenkte Zauberplatz-Stand ueberlebt einen Neuladen der Seite', async ({ page }) => {
        await injectSpellcaster(page, {
            1: { max: 2, current: 2 }
        });

        await page.locator('.spell-slots-compact .slot-pip[data-value="1"]').first().click();
        await page.waitForTimeout(500);

        await page.reload();
        await waitForAppReady(page);
        await page.waitForTimeout(500);

        const current = await page.evaluate(id => {
            // @ts-ignore
            const ch = (window.D.characters || []).find(c => c.id === id);
            return ch ? ch.spellSlots[1].current : null;
        }, CHAR_ID);
        expect(current).toBe(1);
    });
});

test.describe('FIX-03: Wuerfelergebnis der Hauptansicht behaelt Formatierung', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'dice');
    });

    /**
     * Ruft die im gebauten Buendel global erreichbare Anzeigefunktion direkt
     * auf, um alle drei Zustaende (normal/kritisch/Patzer) deterministisch
     * auszuloesen, ohne auf einen zufaelligen Wurf angewiesen zu sein.
     * @param {import('@playwright/test').Page} page
     * @param {{ result: number, notation: string, rolls: number[], isCrit: boolean, isFail: boolean }} params
     */
    async function displayResult(page, { result, notation, rolls, isCrit, isFail }) {
        await page.evaluate(
            ({ result, notation, rolls, isCrit, isFail }) => {
                // @ts-ignore
                if (typeof window.displayDiceResult !== 'function') {
                    throw new Error('displayDiceResult ist nicht global verfuegbar');
                }
                // @ts-ignore
                window.displayDiceResult(result, notation, rolls, isCrit, isFail);
            },
            { result, notation, rolls, isCrit, isFail }
        );
    }

    /**
     * Liest die berechneten Werte der Ergebniszahl — sichert zuerst zu, dass das
     * Element ueberhaupt gefunden wurde, damit ein Fehlgriff nicht still gruen
     * wird (T-15-08-Muster aus FIX-01).
     * @param {import('@playwright/test').Page} page
     */
    async function readHeroResultStyle(page) {
        const el = page.locator('#dice-hero-result');
        await expect(el).toHaveCount(1);
        return el.evaluate(node => {
            const cs = getComputedStyle(node);
            return { fontSize: parseFloat(cs.fontSize), color: cs.color };
        });
    }

    /**
     * Liest die Ergebniszahl erst, wenn ihr Farbuebergang ZUR RUHE gekommen ist.
     *
     * NACHGEMESSEN, nicht vermutet: `.dice-hero-result` traegt
     * `transition: var(--trans-slow)` (dice.css), und `--dur-slow` steht auf
     * 300ms. Ein Lesezugriff unmittelbar nach dem Klassenwechsel liefert
     * deshalb den ALTEN Wert. Mit einer Sonde auf beiden Zweigen gemessen,
     * Thema `dark`, Klasse jeweils korrekt gesetzt:
     *
     *   nach displayDiceResult(20, isCrit=true)   Klasse "crit", Farbe
     *                                             rgb(212,175,55) = --gold-text
     *   dieselbe Stelle 1200ms spaeter            Farbe rgb(74,222,128) = --green-text
     *   nach displayDiceResult(1, isFail=true)    Klasse "fail", Farbe noch
     *                                             rgb(74,222,128) = die VORIGE
     *
     * Die drei Faelle verglichen vorher exakte Farbzeichenketten gegen einen
     * LAUFENDEN Uebergang. Dass sie gruen waren, hing an wenigen Millisekunden
     * Fortschritt: derselbe Fall ist auf main gruen und auf dem Schriften-Zweig
     * dreimal von drei rot, ohne dass sich eine App-Zeile unterscheidet (JS der
     * beiden Buendel byte-identisch, die crit-Regel woertlich gleich; die 3KB
     * mehr CSS und die erstmals echt geladenen Schriftdateien verschieben nur
     * den Startzeitpunkt). Ein Fall, der so besteht, besteht aus Zufall.
     *
     * Gewartet wird auf RUHE, nicht auf das erwuenschte Ergebnis: der Helfer
     * pollt, bis zwei aufeinanderfolgende Messungen denselben Wert liefern, und
     * sichert NICHTS ueber die Farbe zu. Die Zusicherungen der Faelle bleiben
     * damit unverkuerzt — haette er auf "Farbe ungleich vorher" gewartet, waere
     * die darauffolgende Zusicherung tautologisch geworden.
     *
     * @param {import('@playwright/test').Page} page
     */
    async function readHeroResultStyleInRuhe(page) {
        let vorher = null;
        await expect
            .poll(
                async () => {
                    const jetzt = (await readHeroResultStyle(page)).color;
                    const ruht = jetzt !== null && jetzt === vorher;
                    vorher = jetzt;
                    return ruht;
                },
                {
                    timeout: 5000,
                    intervals: [60, 60, 60, 100, 150, 250, 400],
                    message:
                        'die Farbe der Ergebniszahl kommt nicht zur Ruhe — der Uebergang ' +
                        'laeuft laenger als 5s oder endet nie'
                }
            )
            .toBe(true);
        return readHeroResultStyle(page);
    }

    test('Nach einem gewoehnlichen Wurf behaelt die Ergebniszahl ihre Formatierungsklasse', async ({ page }) => {
        await displayResult(page, {
            result: 15,
            notation: '1d20',
            rolls: [15],
            isCrit: false,
            isFail: false
        });
        const style = await readHeroResultStyle(page);
        expect(style.fontSize).toBeGreaterThan(40); // 5em Basis-Schriftgroesse
        expect(style.color).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('Nach einem kritischen Wurf traegt die Ergebniszahl den Kritisch-Zustand mit abweichender Farbe', async ({ page }) => {
        await displayResult(page, {
            result: 20,
            notation: '1d20',
            rolls: [20],
            isCrit: false,
            isFail: false
        });
        const normalStyle = await readHeroResultStyleInRuhe(page);

        await displayResult(page, {
            result: 20,
            notation: '1d20',
            rolls: [20],
            isCrit: true,
            isFail: false
        });
        const critStyle = await readHeroResultStyleInRuhe(page);

        expect(critStyle.color).not.toBe(normalStyle.color);
        expect(critStyle.fontSize).toBeGreaterThan(40);

        // Der Container behaelt seine Animation, aber keine Zustandsklasse mehr
        const heroHasStateClass = await page.locator('#dice-hero.crit, #dice-hero.fail').count();
        expect(heroHasStateClass).toBe(0);
    });

    test('Nach einem Patzer traegt die Ergebniszahl den Patzer-Zustand mit einer dritten Farbe', async ({ page }) => {
        await displayResult(page, {
            result: 1,
            notation: '1d20',
            rolls: [1],
            isCrit: false,
            isFail: false
        });
        const normalStyle = await readHeroResultStyleInRuhe(page);

        await displayResult(page, {
            result: 20,
            notation: '1d20',
            rolls: [20],
            isCrit: true,
            isFail: false
        });
        const critStyle = await readHeroResultStyleInRuhe(page);

        await displayResult(page, {
            result: 1,
            notation: '1d20',
            rolls: [1],
            isCrit: false,
            isFail: true
        });
        const failStyle = await readHeroResultStyleInRuhe(page);

        expect(failStyle.color).not.toBe(normalStyle.color);
        expect(failStyle.color).not.toBe(critStyle.color);

        const heroHasStateClass = await page.locator('#dice-hero.crit, #dice-hero.fail').count();
        expect(heroHasStateClass).toBe(0);
    });
});
