// @ts-check
/**
 * Regressionsspec fuer die vier in Plan 15-12 wiederhergestellten CSS-Regelfamilien —
 * Phase 15, Plan 15-13 (15-VERIFICATION.md Gap 2, D-17).
 *
 * Plan 15-12 hat acht woertlich wiederhergestellte Regelbloecke (sechs Klassenfamilien) belegt
 * — aber nur am CSS-QUELLTEXT und ueber das Werkzeug (`tools/css-usage-report.js`). Das ist kein
 * Beleg, dass die Regeln im GEBAUTEN Buendel tatsaechlich greifen. Dieser Spec ergaenzt fuenf
 * Zusicherungen ueber berechnete Endwerte (`getComputedStyle`), dieselbe Nachweisart, die
 * `15-CONTEXT.md` D-17 fuer die drei Fixes dieser Phase vorschreibt, gegen `dist/dnd-tracker-
 * bundled.html` (siehe `playwright.config.js` baseURL).
 *
 * Nutzt `seedPopulatedSession()` (tests/e2e/helpers/test-utils.js) statt des leeren Seeds — ohne
 * befuellte Daten wuerden die betroffenen Markups (Shop-Kopf-Chip, Shop-Artikel, Ruf-Historie,
 * Mob-Zeile) nie gerendert. Fuer die Shop- und Fraktions-Faelle wird der jeweilige Zustand
 * (aufgeklappter Shop, ausgewaehlte Fraktion) VOR der Messung ueber die dafuer exportierten
 * Funktionen hergestellt — beide Markups entstehen sonst gar nicht im Dokument.
 *
 * Testnamen tragen die Marker REG-01 bis REG-05 (eine Zusicherung je wiederhergestellter
 * Regelfamilie; REG-04/REG-05 pruefen die Mob-Ausblendregel in BEIDE Richtungen).
 */

import { test, expect } from '@playwright/test';
import { loadApp, seedPopulatedSession } from '../helpers/test-utils.js';

test.describe('CSS-Restore-Regression (Plan 15-12, D-17)', () => {
    test('REG-01: Shop-NPC-Chip im Shop-Kopf hat Innenabstand und Eckenradius ungleich null', async ({
        page
    }) => {
        await seedPopulatedSession(page);
        await loadApp(page);
        await page.evaluate(() => {
            // @ts-ignore — global aus systems/tab-registry.js
            window.switchView('shops');
        });
        await page.waitForSelector('#view-shops.active', { state: 'visible' });
        await page.evaluate(() => {
            // @ts-ignore — global aus features/shops/shops-core.js
            window.toggleShop(1);
        });
        await page.waitForTimeout(200);

        const chips = page.locator('.shop-meta-tag.npc');
        const count = await chips.count();
        expect(count).toBeGreaterThan(0);

        const style = await chips.first().evaluate(el => {
            const cs = getComputedStyle(el);
            return { padding: cs.paddingTop, radius: cs.borderRadius };
        });
        expect(style.padding).not.toBe('0px');
        expect(style.radius).not.toBe('0px');
    });

    test('REG-02: Nicht verfuegbarer Shop-Artikel hat eine Deckkraft von 0,5', async ({ page }) => {
        await seedPopulatedSession(page);
        await loadApp(page);
        await page.evaluate(() => {
            // @ts-ignore
            window.switchView('shops');
        });
        await page.waitForSelector('#view-shops.active', { state: 'visible' });
        await page.evaluate(() => {
            // @ts-ignore
            window.toggleShop(1);
        });
        await page.waitForTimeout(200);

        const items = page.locator('.si-item.si-unavailable');
        const count = await items.count();
        expect(count).toBeGreaterThan(0);

        const opacity = await items.first().evaluate(el => getComputedStyle(el).opacity);
        expect(opacity).toBe('0.5');
    });

    test('REG-03: Zunahme- und Abnahme-Eintrag der Ruf-Historie unterscheiden sich farblich', async ({
        page
    }) => {
        await seedPopulatedSession(page);
        await loadApp(page);
        await page.evaluate(() => {
            // @ts-ignore
            window.switchView('fraktionen');
        });
        await page.waitForSelector('#view-fraktionen.active', { state: 'visible' });
        await page.evaluate(() => {
            // @ts-ignore — global aus features/fraktionen/fraktionen-render.js
            window.selectFraktion(1);
        });
        await page.waitForTimeout(200);

        const plusEls = page.locator('.fr-hist-delta.fr-hist-plus');
        const minusEls = page.locator('.fr-hist-delta.fr-hist-minus');
        const plusCount = await plusEls.count();
        const minusCount = await minusEls.count();
        expect(plusCount).toBeGreaterThan(0);
        expect(minusCount).toBeGreaterThan(0);

        // Gegen den jeweils anderen Wert verglichen, nicht gegen einen festen Wert: der Wert
        // haengt am Theme, die Ununterscheidbarkeit ist der Befund (REG-03/Verhaltensblock).
        const [plusColor, minusColor] = await Promise.all([
            plusEls.first().evaluate(el => getComputedStyle(el).color),
            minusEls.first().evaluate(el => getComputedStyle(el).color)
        ]);
        expect(plusColor).not.toBe(minusColor);
    });

    test('REG-04: Mob-Sammelangriff-Eingabefelder sind im Nicht-Sammelregel-Modus verborgen', async ({
        page
    }) => {
        await seedPopulatedSession(page);
        await loadApp(page);
        await page.evaluate(() => {
            // @ts-ignore
            window.switchView('initiative');
        });
        await page.waitForSelector('#view-initiative.active', { state: 'visible' });

        const inputs = page.locator('.init-mob-dmg-inputs');
        const count = await inputs.count();
        expect(count).toBeGreaterThan(0);

        const display = await inputs.first().evaluate(el => getComputedStyle(el).display);
        expect(display).toBe('none');
    });

    test('REG-05: Nach Umschalten auf den Sammelregel-Modus sind dieselben Eingabefelder sichtbar', async ({
        page
    }) => {
        await seedPopulatedSession(page);
        await loadApp(page);
        await page.evaluate(() => {
            // @ts-ignore
            window.switchView('initiative');
        });
        await page.waitForSelector('#view-initiative.active', { state: 'visible' });

        await page
            .locator('[data-action="init-mob-set-mode-stop"][data-mode="dmg-regel"]')
            .first()
            .click();
        await page.waitForTimeout(200);

        const inputs = page.locator('.init-mob-dmg-inputs');
        const count = await inputs.count();
        expect(count).toBeGreaterThan(0);

        const display = await inputs.first().evaluate(el => getComputedStyle(el).display);
        expect(display).toBe('flex');
    });
});
