// @ts-check
import { test, expect } from '@playwright/test';
import { loadApp, navigateToTab } from '../helpers/test-utils.js';

/**
 * E2E Tests — Wuerfel-Statistiken (Phase 7 — UX-02)
 *
 * Aktiviert in 07-04 (ersetzt test.skip durch echte Assertions).
 *
 * Kontrakt-Testtitel sind unveraenderlich (grep-Kontrakt: -g "dice stats tab renders" etc.).
 * Kein CommonJS require; kein http://localhost (file:// baseURL aus playwright.config.js).
 */

test.describe('Wuerfel-Statistiken', function () {

    test('dice stats tab renders', async function ({ page }) {
        // UX-02a: Statistiken-Tab rendert nach Wuerfelwuerfen.
        // 1. App laden
        await loadApp(page);

        // 2. Einige d20-Wuerfe absetzen (quickRoll via page.evaluate)
        await page.evaluate(function() {
            // addToDiceHistory ist global; tee schreibt in IDB
            if (typeof addToDiceHistory === 'function') {
                addToDiceHistory('1d20', 15, [15]);
                addToDiceHistory('1d20', 7, [7]);
                addToDiceHistory('1d20', 20, [20]);
            }
        });
        await page.waitForTimeout(300);

        // 3. Zum dicestats-Tab navigieren
        await navigateToTab(page, 'dicestats');
        await page.waitForTimeout(600); // Warte auf async IDB-Abfrage

        // 4. Container vorhanden
        const container = page.locator('#dicestats-container');
        await expect(container).toBeVisible();

        // 5. SVG-Histogramm vorhanden
        const svg = page.locator('#dicestats-container svg');
        await expect(svg).toBeVisible();

        // 6. 20 rect-Balken im SVG
        const rects = page.locator('#dicestats-container svg rect');
        await expect(rects).toHaveCount(20);

        // 7. Crit/Fumble-Rate-Zeile vorhanden
        const critChip = page.locator('#dicestats-container .ds-crit');
        await expect(critChip).toBeVisible();
        const fumbleChip = page.locator('#dicestats-container .ds-fumble');
        await expect(fumbleChip).toBeVisible();

        // 8. Toggle-Leiste vorhanden
        const toggle = page.locator('#dicestats-container .ds-toggle-bar');
        await expect(toggle).toBeVisible();
    });

    test('rolls captured in IDB', async function ({ page }) {
        // UX-02b: d20-Wuerfe werden in IDB diceStats-Store gespeichert.
        await loadApp(page);

        // Warten bis IDB initialisiert ist
        await page.waitForFunction(function() {
            return typeof window.idb !== 'undefined' && window.idb !== null;
        }, { timeout: 8000 }).catch(function() {
            // Falls IDB-Initialisierung laenger dauert — Tab-Wechsel triggert init
        });

        // Wuerfel via addToDiceHistory tee in IDB schreiben
        await page.evaluate(function() {
            if (typeof addToDiceHistory === 'function') {
                addToDiceHistory('1d20', 12, [12]);
                addToDiceHistory('1d20', 5, [5]);
            }
        });

        // Kurz warten damit der fire-and-forget IDB-Write committet
        await page.waitForTimeout(500);

        // Pruefen ob Records im diceStats-Store vorhanden
        const count = await page.evaluate(function() {
            if (!window.idb) return -1;
            return new Promise(function(resolve) {
                try {
                    var tx = window.idb.transaction(['diceStats'], 'readonly');
                    var req = tx.objectStore('diceStats').count();
                    req.onsuccess = function(e) { resolve(e.target.result); };
                    req.onerror = function() { resolve(-1); };
                } catch (err) {
                    resolve(-1);
                }
            });
        });

        // Mindestens die 2 soeben abgesetzten Wuerfe
        expect(count).toBeGreaterThan(0);

        // Via window.getAllStats() pruefen (07-01 API)
        const records = await page.evaluate(function() {
            if (typeof window.getAllStats !== 'function') return [];
            return window.getAllStats();
        });
        expect(Array.isArray(records)).toBe(true);
        expect(records.length).toBeGreaterThan(0);

        // Erster Record hat notation + rolls
        var rec = records[0];
        expect(rec).toHaveProperty('notation');
        expect(rec).toHaveProperty('rolls');
    });

});
