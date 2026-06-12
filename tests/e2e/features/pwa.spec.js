// @ts-check
/**
 * PWA Tests — TECH-01 (Wave-0 RED-Phase)
 * Testet manifest.webmanifest Erreichbarkeit und Service Worker Registrierung.
 * RED-Phase: Manifest und gehostete Umgebung fehlen noch (Plan 02-02, Welle 2).
 * Tests sind als E2E-Stubs definiert und werden nach Implementierung gruen.
 *
 * HINWEIS: Diese Tests benoetigen eine gehostete Umgebung (http/https).
 * Bei file://-Ausfuehrung werden sie uebersprungen oder schlagen mit
 * aussagekraeftiger Meldung fehl.
 */

import { test, expect } from '@playwright/test';

const BASE_URL =
    process.env.SMOKE_BASE_URL ||
    process.env.PWA_BASE_URL ||
    `http://localhost:8000`;

test.describe('PWA Manifest und Service Worker (TECH-01)', () => {
    test('manifest.webmanifest ist erreichbar und hat name + icons (192 + 512)', async ({ request, page }) => {
        // Versuche Manifest-Datei zu laden
        let manifestResponse;
        try {
            manifestResponse = await request.get(`${BASE_URL}/manifest.webmanifest`);
        } catch {
            test.fail(true, 'manifest.webmanifest nicht erreichbar — Implementierung fehlt (Plan 02-02, Welle 2). Gehoste Umgebung (http/https) benoetigt.');
            return;
        }

        expect(manifestResponse.ok()).toBe(true);

        const manifest = await manifestResponse.json();

        // Pflichtfelder laut 02-PATTERNS.md
        expect(manifest.name).toBe('D&D Kampagnen-Tracker Pro');
        expect(manifest.short_name).toBeTruthy();
        expect(manifest.display).toBe('standalone');

        // Icons: 192 und 512 Pixel
        expect(Array.isArray(manifest.icons)).toBe(true);
        const sizes = manifest.icons.map(icon => icon.sizes);
        expect(sizes).toContain('192x192');
        expect(sizes).toContain('512x512');
    });

    test('Service Worker registriert sich auf https/localhost', async ({ page }) => {
        // Pruefe ob SMOKE_BASE_URL auf http/https zeigt
        const targetUrl = process.env.SMOKE_BASE_URL || process.env.PWA_BASE_URL;
        if (!targetUrl || targetUrl.startsWith('file://')) {
            test.fail(true, 'SW-Registrierung benoetigt https/localhost — kein file://-Support. Setze SMOKE_BASE_URL oder PWA_BASE_URL.');
            return;
        }

        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(targetUrl);
        await page.waitForSelector('.app-title', { timeout: 15000 });

        // Service Worker muss registriert sein
        const swRegistered = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return false;
            const regs = await navigator.serviceWorker.getRegistrations();
            return regs.length > 0;
        });

        expect(swRegistered).toBe(true);
    });
});
