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

    test('Migration-Hinweis-Banner ueberdeckt #global-search nicht (Phase 8, D-02, Pitfall 3)', async ({
        page
    }) => {
        // Der Umzugs-Hinweis wird bei jeder frischen Sitzung angezeigt (sessionStorage-Guard)
        const banner = page.locator('#migration-hint-banner');
        await expect(banner).toBeVisible();

        // Layout-Offset-Regressionsschutz: der Header (inkl. #global-search) darf nicht
        // unter der fixierten Banner-Leiste liegen — geometrischer Beweis statt reinem Klick-Erfolg
        const bannerBox = await banner.boundingBox();
        const searchInput = page.locator('#global-search');
        await expect(searchInput).toBeVisible();
        const searchBox = await searchInput.boundingBox();

        expect(bannerBox).not.toBeNull();
        expect(searchBox).not.toBeNull();
        expect(searchBox.y).toBeGreaterThanOrEqual(bannerBox.y + bannerBox.height);

        // Natuerlicher Klick (kein {force:true}) muss trotz sichtbarer Banner funktionieren
        await searchInput.click();
        await expect(searchInput).toBeFocused();
    });
});

test.describe('Party Tab', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => window.switchView('party'));
        await page.waitForTimeout(300);
    });

    test('Charakter-Formular ist zugänglich', async ({ page }) => {
        // Formular öffnen über toggle-collapse
        // formToggle ist statisches UI-Markup (assets/templates/view-party.html), unabhaengig
        // von D.characters — kein isVisible()-Guard noetig (Phase 8 / D-05/D-06, 08-03 Task 2b:
        // vorheriger Guard umschloss die einzige Assertion des Tests und maskierte ein fehlendes
        // Element als stillen Pass).
        const formToggle = page
            .locator('[data-action="toggle-collapse"][data-value="char-form"]')
            .first();
        await expect(formToggle).toBeVisible();
        await formToggle.click();
        await page.waitForTimeout(300);

        // Formular-Container sollte open-Klasse haben
        const form = page.locator('#char-form');
        await expect(form).toHaveClass(/open/);
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
        // Seed: mind. 1 Ort noetig, da .loc-item bei leerem D.locations gar nicht existiert
        // (dokumentiertes Setup, D-06 — der Klick selbst bleibt eine echte Playwright-Interaktion).
        // Phase 8 / D-05/D-06, 08-03 Task 2b: vorheriger isVisible()-Guard umschloss die einzige
        // Assertion und maskierte den (bei frischer App immer leeren) Zustand als stillen Pass.
        await page.evaluate(() => {
            window.D.locations.push({ id: 90101, name: 'Testort', description: '', filterId: null });
            window.renderLocations();
        });

        const firstLocation = page.locator('.loc-item').first();
        await expect(firstLocation).toBeVisible();
        await firstLocation.click();
        await page.waitForTimeout(300);

        // Detail-Panel sollte Inhalt zeigen
        await expect(page.locator('.loc-detail-content')).toBeVisible();
    });

    test('NPC-Chip öffnet Popup', async ({ page }) => {
        // Seed: Ort + zugeordneter NPC noetig, da .loc-npc-chip nur bei D.npcs mit passender
        // locationId gerendert wird (dokumentiertes Setup, D-06 — der Klick bleibt real).
        // Phase 8 / D-05/D-06, 08-03 Task 2b: vorheriger isVisible()-Guard umschloss die einzige
        // Assertion und maskierte den (bei frischer App immer leeren) Zustand als stillen Pass.
        await page.evaluate(() => {
            window.D.locations.push({ id: 90102, name: 'Testort NPC', description: '', filterId: null });
            window.D.npcs.push({ id: 90102, name: 'Test-NPC', role: 'Händler', locationId: 90102 });
            window.renderLocations();
        });

        const npcChip = page.locator('.loc-npc-chip').first();
        await expect(npcChip).toBeVisible();
        await npcChip.click();
        await page.waitForTimeout(500);

        // NPC-Popup sollte erscheinen
        await expect(page.locator('.npc-popup, .npc-quick-popup')).toBeVisible();
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
        // Seed: mind. 1 NPC noetig, da .npc-item bei leerem D.npcs gar nicht existiert
        // (dokumentiertes Setup, D-06 — der Klick selbst bleibt eine echte Playwright-Interaktion).
        // Phase 8 / D-05/D-06, 08-03 Task 2b: vorheriger isVisible()-Guard umschloss die einzige
        // Assertion und maskierte den (bei frischer App immer leeren) Zustand als stillen Pass.
        await page.evaluate(() => {
            window.D.npcs.push({ id: 90103, name: 'Test-NPC-Auswahl', role: 'Wache' });
            window.renderNPCList();
        });

        const firstNpc = page.locator('.npc-item, .npc-card').first();
        await expect(firstNpc).toBeVisible();
        await firstNpc.click();
        await page.waitForTimeout(300);

        // Detail sollte angezeigt werden (.npc-detail ist der Panel-Wrapper, .npc-detail-content
        // das innere Content-Div — beide matchen, daher .first() gegen strict-mode violation)
        await expect(page.locator('.npc-detail, .npc-detail-content').first()).toBeVisible();
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
        // Stale Selektor korrigiert: die reale Produktions-Markup ist
        // `.dice-die.d20[data-action="roll-dice"][data-value="20"]` (assets/templates/view-tools.html) —
        // weder `[data-value="d20"]` noch `.dice-btn[data-dice="d20"]` haben je gematcht, wodurch
        // isVisible() immer false war und der Guard die einzige Assertion permanent maskierte.
        // Phase 8 / D-05/D-06, 08-03 Task 2b.
        const d20Button = page.locator('.dice-die.d20[data-action="roll-dice"][data-value="20"]');
        await expect(d20Button).toBeVisible();
        await d20Button.click();
        await page.waitForTimeout(500);

        // Ergebnis sollte angezeigt werden
        await expect(page.locator('.dice-result, #dice-hero-result')).toBeVisible();
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
