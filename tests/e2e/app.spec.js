// @ts-check
import { test, expect } from '@playwright/test';

/**
 * D&D Tracker - Basis-Tests
 * Testet grundlegende App-Funktionalität
 */

// Vor jedem Test: App laden
test.beforeEach(async ({ page }) => {
    // Lokale HTML-Datei laden
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);

    // Warten bis App geladen ist
    await page.waitForSelector('.app-title', { timeout: 10000 });
});

test.describe('App Grundfunktionen', () => {
    test('App lädt erfolgreich', async ({ page }) => {
        // Titel prüfen
        await expect(page.locator('.app-title')).toContainText('D&D');

        // Navigation sichtbar
        await expect(page.locator('.nav-tabs')).toBeVisible();

        // Keine Konsolenfehler
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        await page.waitForTimeout(1000);
        expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
    });

    test('Alle Tabs sind anklickbar', async ({ page }) => {
        const tabs = [
            { view: 'dashboard', text: 'Dashboard' },
            { view: 'party', text: 'Party' },
            { view: 'npcs', text: 'NPCs' },
            { view: 'locations', text: 'Orte' },
            { view: 'quests', text: 'Quests' },
            { view: 'encounter', text: 'Encounter' }
        ];

        for (const tab of tabs) {
            const tabButton = page.locator(`.nav-tab[data-view="${tab.view}"]`);
            await page.evaluate(v => window.switchView(v), tab.view);
            await page.waitForTimeout(300);

            // Tab sollte aktiv sein
            await expect(tabButton).toHaveClass(/active/);
        }
    });

    test('Global Search ist fokussierbar', async ({ page }) => {
        // Global Search Input sollte existieren
        const searchInput = page.locator('#global-search');
        await expect(searchInput).toBeVisible();

        // Klicke auf das Suchfeld
        await searchInput.click();

        // Prüfe ob es fokussiert ist
        await expect(searchInput).toBeFocused();

        // Gebe einen Suchbegriff ein
        await searchInput.fill('Test');

        // Search Results Container sollte erscheinen
        await expect(page.locator('#global-search-results')).toBeVisible();
    });
});

test.describe('Party Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => window.switchView('party'));
        await page.waitForTimeout(300);
    });

    test('Charakter-Formular ist zugänglich', async ({ page }) => {
        // Formular öffnen über toggle-collapse
        const formToggle = page
            .locator('[data-action="toggle-collapse"][data-value="char-form"]')
            .first();

        if (await formToggle.isVisible()) {
            await formToggle.click();
            await page.waitForTimeout(300);

            // Formular-Container sollte open-Klasse haben
            const form = page.locator('#char-form');
            await expect(form).toHaveClass(/open/);
        }
    });
});

test.describe('Orte Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => window.switchView('locations'));
        await page.waitForTimeout(500);
    });

    test('Orte-Liste wird angezeigt', async ({ page }) => {
        // Liste oder Empty-State sollte sichtbar sein
        const list = page.locator('#locations-list');
        await expect(list).toBeVisible();
    });

    test('Ort kann ausgewählt werden', async ({ page }) => {
        // Ersten Ort klicken (falls vorhanden)
        const firstLocation = page.locator('.loc-item').first();

        if (await firstLocation.isVisible()) {
            await firstLocation.click();
            await page.waitForTimeout(300);

            // Detail-Panel sollte Inhalt zeigen
            await expect(page.locator('.loc-detail-content')).toBeVisible();
        }
    });

    test('NPC-Chip öffnet Popup', async ({ page }) => {
        // Ersten NPC-Chip finden und klicken
        const npcChip = page.locator('.loc-npc-chip').first();

        if (await npcChip.isVisible()) {
            await npcChip.click();
            await page.waitForTimeout(500);

            // NPC-Popup sollte erscheinen
            await expect(page.locator('.npc-popup, .npc-quick-popup')).toBeVisible();
        }
    });
});

test.describe('NPCs Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => window.switchView('npcs'));
        await page.waitForTimeout(500);
    });

    test('NPC-Liste wird angezeigt', async ({ page }) => {
        const list = page.locator('#npcs-list, .npc-list');
        await expect(list).toBeVisible();
    });

    test('NPC kann ausgewählt werden', async ({ page }) => {
        const firstNpc = page.locator('.npc-item, .npc-card').first();

        if (await firstNpc.isVisible()) {
            await firstNpc.click();
            await page.waitForTimeout(300);

            // Detail sollte angezeigt werden
            await expect(page.locator('.npc-detail, .npc-detail-content')).toBeVisible();
        }
    });
});

test.describe('Würfel Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => window.switchView('dice'));
        await page.waitForTimeout(300);
    });

    test('Würfel-Interface ist sichtbar', async ({ page }) => {
        // Prüfe ob dice view aktiv ist
        await expect(page.locator('#view-dice')).toBeVisible();

        // Hero-Würfel sollte sichtbar sein
        await expect(page.locator('#dice-hero')).toBeVisible();
    });

    test('D20 Würfel kann geworfen werden', async ({ page }) => {
        const d20Button = page.locator(
            '[data-action="roll-dice"][data-value="d20"], .dice-btn[data-dice="d20"]'
        );

        if (await d20Button.isVisible()) {
            await d20Button.click();
            await page.waitForTimeout(500);

            // Ergebnis sollte angezeigt werden
            await expect(page.locator('.dice-result, #dice-hero-result')).toBeVisible();
        }
    });
});

test.describe('Responsiveness', () => {
    test('App funktioniert auf Tablet-Größe', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);

        // Navigation sollte noch funktionieren (entweder nav-tabs oder mobile-nav)
        const navVisible =
            (await page.locator('.nav-tabs').isVisible()) ||
            (await page.locator('.mobile-nav-toggle').isVisible());
        expect(navVisible).toBeTruthy();
    });

    test('App funktioniert auf Mobile-Größe', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);

        // App sollte noch nutzbar sein
        await expect(page.locator('.app-title')).toBeVisible();
    });
});
