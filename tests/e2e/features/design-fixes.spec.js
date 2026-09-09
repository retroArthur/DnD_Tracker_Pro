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
import { loadApp, navigateToTab } from '../helpers/test-utils.js';

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
