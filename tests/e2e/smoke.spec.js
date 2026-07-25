// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL =
    process.env.SMOKE_BASE_URL ||
    `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// D-12: bekannte Konsolen-Deprecation-Strings. Der Favicon-404 gehoert NICHT
// hierher — er wird ueber den response-Listener erkannt, nicht ueber die Konsole.
const KNOWN_DEPRECATION_STRINGS = ['apple-mobile-web-app-capable'];

test('App bootet ohne Konsolen-Fehler', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    await page.waitForSelector('.app-title', { timeout: 15000 });
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
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
            expect(errors).toHaveLength(0);
        });
    }
});

test('Keine Favicon-404 und keine Meta-Tag-Deprecation', async ({ page }) => {
    const failed404s = [];
    const consoleWarnings = [];

    // KORREKT fuer HTTP-Status: response.status() === 404. Das Netzwerkfehler-Event
    // (feuert nur bei echten Verbindungsabbruechen wie DNS-Fehlern) waere hier
    // falsch und wuerde bei einem 404 nie feuern, weil ein 404 aus Netzwerksicht
    // eine vollstaendige, erfolgreiche Antwort ist.
    page.on('response', response => {
        if (response.status() === 404) failed404s.push(response.url());
    });
    page.on('console', msg => {
        const text = msg.text();
        if (KNOWN_DEPRECATION_STRINGS.some(s => text.includes(s))) {
            consoleWarnings.push(text);
        }
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('.app-title', { timeout: 15000 });

    expect(failed404s, `404-Antworten: ${JSON.stringify(failed404s)}`).toHaveLength(0);
    expect(
        consoleWarnings,
        `Deprecation-Konsolentexte: ${JSON.stringify(consoleWarnings)}`
    ).toHaveLength(0);
});
