// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Editor-Regressionsnetz (execCommand-Ablösung, Phase 9)
 *
 * Tracer-Test: beweist die komplette Prüfkette der Phase an EINEM Pfad —
 * echter Toolbar-Klick -> exaktes Markup -> Speichern -> Reload -> exaktes Markup.
 * Dieser Test dient als Baseline-Referenz: solange execCommand('bold') das
 * Markup erzeugt, muss dieser Test grün bleiben. Sobald die Migration auf
 * Selection/Range-APIs erfolgt (Pläne 09-06..09-09), MUSS er weiterhin
 * exakt dasselbe Markup liefern (D-02 Verhaltensgleichheit).
 */

// Empirisch am gebauten Bundle erhoben (Chromium execCommand('bold') auf
// vollständig selektiertem Text "Tracertext" in #wiki-content).
const ERWARTET_BOLD_NACH_KLICK = '<b>Tracertext</b>';
// Nach sanitizeHTML() + localStorage-Roundtrip + Reload + edit-wiki: identisch,
// da <b> in der allowedTags-Whitelist von sanitizeHTML() enthalten ist.
const ERWARTET_BOLD_NACH_RELOAD = '<b>Tracertext</b>';

test.describe('Editor-Regressionsnetz — Statische Toolbar (Wiki)', () => {
    test.beforeEach(async ({ page }) => {
        const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
        await page.goto(filePath);
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.evaluate(() => window.switchView('wiki'));
        await page.waitForSelector('#view-wiki', { state: 'visible' });
    });

    test('sollte Bold ueber die statische Wiki-Toolbar anwenden und den Speichern/Reload-Zyklus ueberstehen', async ({
        page
    }) => {
        // 1. Formular oeffnen
        await page.click('[data-action="call"][data-value="showWikiForm"]');
        await page.fill('#wiki-title', 'Tracer Fett');
        await page.selectOption('#wiki-category', 'locations');

        // 2. Text eingeben
        const editor = page.locator('#wiki-content');
        await editor.click();
        await editor.pressSequentially('Tracertext');

        // 3. Volltext selektieren
        await editor.selectText();

        // 4. Echten Toolbar-Bold-Button klicken (hart auf Sichtbarkeit pruefen)
        const boldBtn = page.locator(
            '[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]'
        );
        await expect(boldBtn).toBeVisible();
        await boldBtn.click();

        // 5. Markup-Assertion direkt nach dem Klick (exakter Vergleich, kein toContain)
        await expect(editor).toHaveJSProperty('innerHTML', ERWARTET_BOLD_NACH_KLICK);

        // 6. Persistenz-Roundtrip: Speichern, Reload, wiedereroeffnen
        await page.click('[data-action="call"][data-value="saveWikiEntry"]');
        await page.reload();
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await page.evaluate(() => window.switchView('wiki'));
        await page.waitForSelector('#view-wiki', { state: 'visible' });

        // Wiki-Kategorien sind nach Reload wieder eingeklappt (WikiState ist
        // Session-only) — Kategorie "locations" muss erst geoeffnet werden.
        await page.click('[data-action="toggle-wiki-category"][data-value="locations"]');
        await page
            .locator('.wiki-tree-item[data-action="select-wiki-entry"]', {
                hasText: 'Tracer Fett'
            })
            .click();
        await page.click('[data-action="edit-wiki"]');

        // 7. Markup-Assertion nach Reload — derselbe wiedergeoeffnete Editor
        const reopenedEditor = page.locator('#wiki-content');
        await expect(reopenedEditor).toBeVisible();
        await expect(reopenedEditor).toHaveJSProperty('innerHTML', ERWARTET_BOLD_NACH_RELOAD);
    });
});
