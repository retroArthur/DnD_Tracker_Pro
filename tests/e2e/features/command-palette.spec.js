// @ts-check
/**
 * Command-Palette Tests — TECH-04 (Wave-0 RED-Phase)
 * Testet Strg+Shift+K Oeffnen und NPC-Suche in der Command Palette.
 * RED-Phase: Implementierung fehlt (Plan 02-05, Welle 2). Tests werden nach
 * Implementierung gruen (jest-Framework sammelt sie jetzt bereits ein).
 */

import { test, expect } from '@playwright/test';

const BASE_URL =
    process.env.SMOKE_BASE_URL ||
    `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

test.describe('Command Palette (TECH-04)', () => {
    test('Strg+Shift+K oeffnet die Command Palette (.cp-overlay sichtbar)', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(BASE_URL);
        await page.waitForSelector('.app-title', { timeout: 15000 });

        // Klick auf den Body um Fokus zu sichern (Tastatur-Events benoetigen Browser-Fokus)
        await page.click('body');
        await page.waitForTimeout(100);

        // Shortcut Strg+Shift+K ausfuehren
        await page.keyboard.press('Control+Shift+K');
        await page.waitForTimeout(500);

        // Erwartet: .cp-overlay erscheint (sichtbar, nicht display:none)
        const overlay = page.locator('.cp-overlay');
        await expect(overlay).toBeVisible({ timeout: 3000 });
    });

    test('Tippen von "NPC" zeigt mindestens ein Ergebnis', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(BASE_URL);
        await page.waitForSelector('.app-title', { timeout: 15000 });

        // Klick auf den Body um Fokus zu sichern (Tastatur-Events benoetigen Browser-Fokus)
        await page.click('body');
        await page.waitForTimeout(100);

        // Command Palette oeffnen
        await page.keyboard.press('Control+Shift+K');
        await page.waitForTimeout(500);

        // Erwartet: Eingabefeld vorhanden und fokussiert
        const input = page.locator('.cp-input, .cp-overlay input, [class*="command-palette"] input');
        await expect(input.first()).toBeVisible({ timeout: 3000 });

        // NPC eintippen
        await input.first().fill('NPC');
        await page.waitForTimeout(300);

        // Erwartet: mindestens ein Ergebnis-Element erscheint
        const results = page.locator('.cp-result, .cp-overlay [class*="result"], [class*="command-palette"] [class*="result"]');
        await expect(results.first()).toBeVisible({ timeout: 3000 });
    });
});
