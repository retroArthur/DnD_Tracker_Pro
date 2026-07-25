// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Import-Sicherheit (Phase 10, Plan 01)
 *
 * Beweist die vollständige Exploit-Kette aus 01-REVIEW.md (CR-01) end-to-end:
 * eine bösartige Kampagnen-Import-Datei mit einem Wiki-Eintrag, dessen Inhalt
 * ein Script-Ereignis-Attribut enthält, wird über den echten Eintrittspunkt
 * (#import-file) eingespielt, und der geöffnete Wiki-Eintrag darf den
 * eingebetteten Code NICHT ausführen.
 *
 * Der Wiki-Anzeigepfad ist laut 10-RESEARCH.md der EINZIGE heute live
 * ausnutzbare Pfad dieses Exploits (alle anderen Entity-Renderer wrappen
 * renderMarkdownInContent() bereits in sanitizeHTML() am Aufrufort).
 */

async function gotoBundleFresh(page) {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
}

/**
 * Spielt eine Kampagnen-JSON-Datei über den echten Import-Eintrittspunkt ein
 * (#import-file, data-action="import-data-global"). Der confirm()-Dialog wird
 * abgewiesen ("Abbrechen" = aktuelle Kampagne überschreiben, Object.assign(D, imp)
 * ohne location.reload() — der Zweig, der ohne Reload sofort renderbar ist).
 * @param {import('@playwright/test').Page} page
 * @param {object} payload
 */
async function importCampaignFile(page, payload) {
    page.on('dialog', dialog => dialog.dismiss());
    await page.setInputFiles('#import-file', {
        name: 'boese-kampagne.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(payload))
    });
    // importDataGlobal() liest die Datei asynchron per FileReader ein und
    // rendert danach neu — auf den Import-Toast warten statt fester Wartezeit.
    await page.waitForFunction(
        () => document.querySelector('#toast')?.textContent?.includes('Import OK'),
        { timeout: 10000 }
    );
}

/**
 * Öffnet einen Wiki-Eintrag in der Kategorie "locations" über die Baumansicht
 * (Muster analog saveAndReopenWikiEntry() in editor-insert.spec.js).
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
async function openWikiEntry(page, title) {
    await page.evaluate(() => window.switchView('wiki'));
    await page.waitForSelector('#view-wiki', { state: 'visible' });
    const catToggle = page.locator(
        '[data-action="toggle-wiki-category"][data-value="locations"]'
    );
    const isOpen = await page.evaluate(() => {
        const list = document.querySelector('[data-wiki-category="locations"]');
        return list ? getComputedStyle(list).display !== 'none' : false;
    });
    if (!isOpen) await catToggle.first().click();
    await page
        .locator('.wiki-tree-item[data-action="select-wiki-entry"]', { hasText: title })
        .click();
}

test.describe('Import-Sicherheit — Exploit-Kette Datei → Wiki-Anzeige (SEC-01)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoBundleFresh(page);
    });

    test('bösartiger Wiki-Eintrag aus Import-Datei führt beim Öffnen keinen Code aus (Review-Exploit-Vektor)', async ({
        page
    }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        const payload = {
            _campaignName: 'Böse Kampagne',
            _exportDate: new Date().toISOString(),
            wiki: [
                {
                    id: 1,
                    title: 'Boesartiger Eintrag',
                    category: 'locations',
                    content:
                        '<img src=x onerror="window.__xssImport10 = true">HarmloserText'
                }
            ]
        };

        await importCampaignFile(page, payload);
        await openWikiEntry(page, 'Boesartiger Eintrag');

        const detail = page.locator('#wiki-detail');
        await expect(detail).toBeVisible();

        const hasOnAttr = await detail.evaluate(el => {
            const nodes = el.querySelectorAll('*');
            for (const node of nodes) {
                for (const attr of node.attributes) {
                    if (attr.name.toLowerCase().startsWith('on')) return true;
                }
            }
            return false;
        });
        const scriptCount = await detail.evaluate(el => el.querySelectorAll('script').length);
        const imgCount = await detail.evaluate(el => el.querySelectorAll('img').length);
        const xssFlag = await page.evaluate(() => window.__xssImport10);
        const detailText = await detail.evaluate(el => el.textContent || '');

        expect(hasOnAttr).toBe(false);
        expect(scriptCount).toBe(0);
        expect(imgCount).toBe(0);
        expect(xssFlag).toBeUndefined();
        expect(errors).toEqual([]);
        expect(detailText).toContain('HarmloserText');
    });

    test('weiterer Vektor-Katalog (script-Tag, javascript:-Link, SVG onload) führt beim Öffnen keinen Code aus', async ({
        page
    }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        const payload = {
            _campaignName: 'Böse Kampagne 2',
            _exportDate: new Date().toISOString(),
            wiki: [
                {
                    id: 1,
                    title: 'Vektor Katalog Eintrag',
                    category: 'locations',
                    content:
                        '<script>window.__xssImport10 = true;</script>' +
                        '<a href="javascript:window.__xssImport10=true">Klick</a>' +
                        '<svg onload="window.__xssImport10 = true"></svg>' +
                        'HarmloserText'
                }
            ]
        };

        await importCampaignFile(page, payload);
        await openWikiEntry(page, 'Vektor Katalog Eintrag');

        const detail = page.locator('#wiki-detail');
        await expect(detail).toBeVisible();

        const hasOnAttr = await detail.evaluate(el => {
            const nodes = el.querySelectorAll('*');
            for (const node of nodes) {
                for (const attr of node.attributes) {
                    if (attr.name.toLowerCase().startsWith('on')) return true;
                }
            }
            return false;
        });
        const scriptCount = await detail.evaluate(el => el.querySelectorAll('script').length);
        const hasJsHref = await detail.evaluate(el => {
            const links = el.querySelectorAll('a');
            for (const a of links) {
                const href = a.getAttribute('href') || '';
                if (href.trim().toLowerCase().startsWith('javascript')) return true;
            }
            return false;
        });
        const xssFlag = await page.evaluate(() => window.__xssImport10);
        const detailText = await detail.evaluate(el => el.textContent || '');

        expect(hasOnAttr).toBe(false);
        expect(scriptCount).toBe(0);
        expect(hasJsHref).toBe(false);
        expect(xssFlag).toBeUndefined();
        expect(errors).toEqual([]);
        expect(detailText).toContain('HarmloserText');
    });
});
