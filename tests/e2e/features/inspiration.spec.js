// Gebündelter Nutzungsweg für features/inspiration/inspiration-data.js,
// features/inspiration/inspiration-markdown.js und features/inspiration/inspiration.js.
import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const app = pathToFileURL(resolve('dist/dnd-tracker-bundled.html')).href;
const articleTitle = 'Bier, Wein und Schankstätten';

test('Inhalte öffnet das Offline-Nachschlagewerk mit Tabellen und Artikelverweisen', async ({
    page
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.context().setOffline(true);
    await page.goto(app);
    await page.getByRole('button', { name: /Inhalte/ }).click();
    await page.getByRole('menuitem', { name: /Inspiration/ }).click({ timeout: 3000 });

    const view = page.locator('#view-inspiration');
    await expect(view).toBeVisible();
    await expect(view.getByText('Mittelalter-Wissen', { exact: true }).first()).toBeVisible();
    await view.locator('#inspiration-search').fill('Schankstätten');
    await view.locator('#inspiration-list').getByText(articleTitle, { exact: true }).click();

    const article = view.locator('#inspiration-article');
    await expect(article.getByRole('heading', { name: articleTitle })).toBeVisible();
    await expect(article.getByRole('table').getByText('Trinkstube', { exact: true })).toBeVisible();
    await expect(article.locator('ol li').first()).toContainText('Das undichte Fass');
    await expect(article.getByRole('link', { name: 'Q115' }).first()).toHaveAttribute(
        'href',
        /^https:\/\/hls-dhs-dss\.ch\//
    );
    await article.getByRole('button', { name: 'Für den Spieltisch' }).click();
    await expect(article.getByRole('heading', { name: 'Für den Spieltisch' })).toBeFocused();
    await article.getByText('Essen und Vorräte', { exact: true }).click();
    await expect(
        article.getByRole('heading', { name: 'Essen und Vorräte im Jahreslauf' })
    ).toBeVisible();
    await expect(page).toHaveURL(app);
});

test('die globale Suche öffnet einen Artikel aus einem Treffer im Fließtext', async ({ page }) => {
    await page.goto(app);
    await page.locator('#global-search').fill('Felsenkeller');
    const result = page
        .locator('#global-search-results [data-type="inspiration"]')
        .filter({ hasText: articleTitle });
    await expect(result).toBeVisible({ timeout: 3000 });
    await result.click();

    const article = page.locator('#inspiration-article');
    await expect(article.getByRole('heading', { name: articleTitle })).toBeVisible();
    await expect(article).toContainText('Felsenkeller');
    await expect(page.locator('.modal-overlay.show')).toHaveCount(0);
});

test('die globale Suche sortiert den Artikeltitel vor Erwähnungen im Fließtext', async ({
    page
}) => {
    await page.goto(app);
    await page.locator('#global-search').fill('Bachried');
    const results = page.locator('#global-search-results [data-type="inspiration"]');
    await expect(results.first()).toContainText('Bachried: ein Dorf für den Spieltisch');
    await expect(results.nth(1)).toBeVisible();
});

test('die mobile Suche öffnet die Leseseite und bietet einen Rückweg zur Themenliste', async ({
    page
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(app);
    await page.locator('.mobile-search-btn[data-value="showMobileSearch"]').click();
    await page.locator('#mobile-search-input').fill('Schankstätten');
    const result = page
        .locator('#mobile-search-results [data-type="inspiration"]')
        .filter({ hasText: articleTitle });
    await expect(result).toBeVisible({ timeout: 3000 });
    await result.click();

    const article = page.locator('#inspiration-article');
    const heading = article.getByRole('heading', { name: articleTitle });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    const list = page.locator('#inspiration-list');
    await expect(list).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390
    );
    await page.getByRole('button', { name: 'Zur Themenliste' }).click();
    await expect(list).toBeVisible();
    await expect(list.getByRole('button', { name: articleTitle })).toBeFocused();
});
