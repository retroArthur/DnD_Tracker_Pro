// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Gruppierte Navigation (Design 2026-06-20)
 *
 * Aus 26 scrollenden Tabs werden 7 Oberpunkte (Start + 6 Gruppen-Dropdowns).
 * Geprueft: Rendering, Dropdown auf/zu, View-Wechsel, aktive Gruppe, Klick-ausserhalb,
 * 1-9-Shortcuts unveraendert.
 *
 * ESM-Import + file:// baseURL (kein require, kein http://localhost).
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

test.describe('Nav-Gruppen', function () {
    test('grouped nav: dropdown opens, switches view, highlights group, closes', async ({ page }) => {
        await page.goto(APP_URL);
        await page.waitForSelector('.app-title', { timeout: 10000 });

        // Start ist direkt sichtbar
        await expect(page.locator('.nav-tab[data-view="dashboard"]')).toBeVisible();

        // Genau 6 Gruppen-Buttons (Charaktere, Welt, Kampf, Inhalte, Werkzeuge, System)
        const groupBtns = page.locator('.nav-group-btn');
        await expect(groupBtns).toHaveCount(6);

        // Dropdown geschlossen -> Party-Eintrag nicht sichtbar
        const party = page.locator('.nav-tab[data-view="party"]');
        await expect(party).toBeHidden();

        // Charaktere oeffnen
        await groupBtns.first().click();
        await expect(party).toBeVisible();

        // Party waehlen -> View aktiv + Dropdown zu + Gruppe hervorgehoben
        await party.click();
        await page.waitForTimeout(200);
        await expect(page.locator('#view-party')).toHaveClass(/active/);
        await expect(party).toBeHidden();
        await expect(groupBtns.first()).toHaveClass(/has-active/);

        // Andere Gruppe oeffnen, dann ausserhalb klicken -> schliesst
        await groupBtns.nth(1).click();
        const orte = page.locator('.nav-tab[data-view="locations"]');
        await expect(orte).toBeVisible();
        await page.mouse.click(400, 400); // neutraler Klick ausserhalb der Nav
        await expect(orte).toBeHidden();

        // Erneut oeffnen, mit Escape schliessen
        await groupBtns.nth(1).click();
        await expect(orte).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(orte).toBeHidden();
    });

    test('1-9 keyboard shortcuts still switch views and highlight the group', async ({ page }) => {
        await page.goto(APP_URL);
        await page.waitForSelector('.app-title', { timeout: 10000 });

        // '3' -> npcs (feste Shortcut-Liste, unabhaengig von der Gruppierung)
        await page.keyboard.press('3');
        await page.waitForTimeout(150);
        await expect(page.locator('#view-npcs')).toHaveClass(/active/);

        // Genau eine Gruppe ist hervorgehoben (Charaktere)
        await expect(page.locator('.nav-group-btn.has-active')).toHaveCount(1);
    });
});
