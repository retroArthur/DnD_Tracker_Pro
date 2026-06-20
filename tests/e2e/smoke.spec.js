// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL =
    process.env.SMOKE_BASE_URL ||
    `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

test('App bootet ohne Konsolen-Fehler', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-title', { timeout: 15000 });
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});

test.describe('Tab-Sweep', () => {
    const TABS = ['dashboard', 'party', 'npcs', 'locations', 'quests', 'encounter'];
    for (const tab of TABS) {
        test(`Tab ${tab} lädt ohne Crash`, async ({ page }) => {
            const errors = [];
            page.on('pageerror', err => errors.push(err.message));
            await page.goto(BASE_URL);
            await page.waitForSelector('.app-title', { timeout: 15000 });
            const tabButton = page.locator(`.nav-tab[data-view="${tab}"]`);
            await page.evaluate(v => window.switchView(v), tab);
            await page.waitForTimeout(500);
            await expect(tabButton).toHaveClass(/active/);
            expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
        });
    }
});
