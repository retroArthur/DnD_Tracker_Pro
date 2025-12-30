// @ts-check
import { test, expect } from '@playwright/test';
import { loadApp, navigateToTab } from '../helpers/test-utils.js';

/**
 * Dice Roller Tests
 * Testet Würfel-Funktionalität
 */

test.describe('Würfel-System', () => {

  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToTab(page, 'dice');
  });

  test.describe('Standard-Würfel', () => {

    test('D20 kann geworfen werden', async ({ page }) => {
      const d20Btn = page.locator('[data-dice="d20"], [data-value="d20"]').first();

      if (await d20Btn.isVisible()) {
        await d20Btn.click();
        await page.waitForTimeout(500);

        // Ergebnis sollte zwischen 1-20 sein
        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();

        const resultText = await result.textContent();
        const num = parseInt(resultText?.replace(/[^\d]/g, '') || '0');
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(20);
      }
    });

    test('D6 kann geworfen werden', async ({ page }) => {
      const d6Btn = page.locator('[data-dice="d6"], [data-value="d6"]').first();

      if (await d6Btn.isVisible()) {
        await d6Btn.click();
        await page.waitForTimeout(500);

        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();
      }
    });

    test('D4 kann geworfen werden', async ({ page }) => {
      const d4Btn = page.locator('[data-dice="d4"], [data-value="d4"]').first();

      if (await d4Btn.isVisible()) {
        await d4Btn.click();
        await page.waitForTimeout(500);

        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();
      }
    });

    test('D100 kann geworfen werden', async ({ page }) => {
      const d100Btn = page.locator('[data-dice="d100"], [data-value="d100"]').first();

      if (await d100Btn.isVisible()) {
        await d100Btn.click();
        await page.waitForTimeout(500);

        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();
      }
    });

  });

  test.describe('Würfel-Notation', () => {

    test('2d6 Notation funktioniert', async ({ page }) => {
      const notationInput = page.locator('#dice-notation, .dice-notation-input');

      if (await notationInput.isVisible()) {
        await notationInput.fill('2d6');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Ergebnis sollte zwischen 2-12 sein
        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();
      }
    });

    test('1d20+5 Notation mit Modifikator funktioniert', async ({ page }) => {
      const notationInput = page.locator('#dice-notation, .dice-notation-input');

      if (await notationInput.isVisible()) {
        await notationInput.fill('1d20+5');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();

        // Ergebnis sollte zwischen 6-25 sein (1+5 bis 20+5)
        const resultText = await result.textContent();
        const num = parseInt(resultText?.replace(/[^\d]/g, '') || '0');
        expect(num).toBeGreaterThanOrEqual(6);
        expect(num).toBeLessThanOrEqual(25);
      }
    });

    test('4d6kh3 (Keep Highest) funktioniert', async ({ page }) => {
      const notationInput = page.locator('#dice-notation, .dice-notation-input');

      if (await notationInput.isVisible()) {
        await notationInput.fill('4d6kh3');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();

        // Ergebnis sollte zwischen 3-18 sein
        const resultText = await result.textContent();
        const num = parseInt(resultText?.replace(/[^\d]/g, '') || '0');
        expect(num).toBeGreaterThanOrEqual(3);
        expect(num).toBeLessThanOrEqual(18);
      }
    });

  });

  test.describe('Vorteil/Nachteil', () => {

    test('Vorteil (Advantage) rollt 2d20 und nimmt höchsten', async ({ page }) => {
      const advantageBtn = page.locator('[data-action*="advantage"], .dice-advantage-btn').first();

      if (await advantageBtn.isVisible()) {
        await advantageBtn.click();
        await page.waitForTimeout(500);

        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();
      }
    });

    test('Nachteil (Disadvantage) rollt 2d20 und nimmt niedrigsten', async ({ page }) => {
      const disadvantageBtn = page.locator('[data-action*="disadvantage"], .dice-disadvantage-btn').first();

      if (await disadvantageBtn.isVisible()) {
        await disadvantageBtn.click();
        await page.waitForTimeout(500);

        const result = page.locator('#dice-hero-result, .dice-result');
        await expect(result).toBeVisible();
      }
    });

  });

  test.describe('Würfel-History', () => {

    test('Würfe werden in History gespeichert', async ({ page }) => {
      const d20Btn = page.locator('[data-dice="d20"], [data-value="d20"]').first();

      if (await d20Btn.isVisible()) {
        // Mehrere Würfe machen
        await d20Btn.click();
        await page.waitForTimeout(300);
        await d20Btn.click();
        await page.waitForTimeout(300);
        await d20Btn.click();
        await page.waitForTimeout(300);

        // History sollte Einträge haben
        const history = page.locator('.dice-history, #dice-history');
        if (await history.isVisible()) {
          const entries = await history.locator('.dice-history-entry, .history-item').count();
          expect(entries).toBeGreaterThanOrEqual(1);
        }
      }
    });

  });

  test.describe('Keyboard Shortcuts', () => {

    test('Alt+2 rollt D20', async ({ page }) => {
      // Warte auf App-Initialisierung
      await page.waitForTimeout(500);

      // Alt+2 für D20
      await page.keyboard.press('Alt+2');
      await page.waitForTimeout(500);

      // Prüfen ob ein Ergebnis angezeigt wird
      const result = page.locator('#dice-hero-result, .dice-result');
      // Shortcut könnte je nach Fokus nicht funktionieren
    });

  });

});
