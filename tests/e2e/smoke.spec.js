// @ts-check
import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers/test-utils.js';

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
    await waitForAppReady(page);
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
            await waitForAppReady(page);
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
    await waitForAppReady(page);

    expect(failed404s, `404-Antworten: ${JSON.stringify(failed404s)}`).toHaveLength(0);
    expect(
        consoleWarnings,
        `Deprecation-Konsolentexte: ${JSON.stringify(consoleWarnings)}`
    ).toHaveLength(0);
});

// R08 (Code-Review 2026-09-21, Einheit U9): der echte, von build.py gebumpte
// Service Worker raeumt bei der Aktivierung nur SEINE Caches ab. Cache Storage
// ist pro Origin geteilt (GitHub Pages: <user>.github.io, CI: localhost:8000).
// Nur unter http(s) — unter file:// gibt es keinen Service Worker; lokal daher
// uebersprungen, im CI-Smoke-Job laeuft der Test gegen dist/ (Scope '/').
test('Service Worker löscht nur eigene Caches (R08)', async ({ page }) => {
    test.skip(BASE_URL.startsWith('file:'), 'Service Worker nur unter http/https');

    const eigeneHtml = new URL('./dnd-tracker-optimized.html', BASE_URL).href;
    const betaHtml = new URL('/tracker-beta/dnd-tracker-optimized.html', BASE_URL).href;
    const EIGENER_ALTCACHE = 'dnd-tracker-v2.6.0-202601010000';
    const BETA_ALTCACHE = 'dnd-tracker-v2.5.0-202512010000';

    // Gleiche Origin, noch kein Service Worker registriert: 404-Seite des Servers.
    await page.goto(new URL('/__r08-seed__', BASE_URL).href);
    await page.evaluate(
        async ({ eigeneHtml, betaHtml, EIGENER_ALTCACHE, BETA_ALTCACHE }) => {
            const fremd = await window.caches.open('another-app-cache');
            await fremd.put('/other-app/index.html', new Response('x'));
            const eigenAlt = await window.caches.open(EIGENER_ALTCACHE);
            await eigenAlt.put(eigeneHtml, new Response('alt'));
            const betaAlt = await window.caches.open(BETA_ALTCACHE);
            await betaAlt.put(betaHtml, new Response('beta'));
        },
        { eigeneHtml, betaHtml, EIGENER_ALTCACHE, BETA_ALTCACHE }
    );

    await page.goto(BASE_URL);
    await waitForAppReady(page);
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
    });

    // ready loest schon zu Beginn der Aktivierung auf — das Aufraeumen abwarten.
    await expect
        .poll(() => page.evaluate(() => window.caches.keys()), { timeout: 10000 })
        .not.toContain(EIGENER_ALTCACHE);

    const keys = await page.evaluate(() => window.caches.keys());
    expect(keys).toEqual(expect.arrayContaining(['another-app-cache', BETA_ALTCACHE]));
    expect(keys.filter(k => k.startsWith('dnd-tracker:'))).toHaveLength(1);
});
