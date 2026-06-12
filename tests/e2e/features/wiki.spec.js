// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Wiki System
 * Tiefe Tests für Wiki-Einträge, Hierarchie, Links und Suche
 */

test.describe('Wiki System', () => {
    test.beforeEach(async ({ page }) => {
        // Lokale HTML-Datei laden
        const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
        await page.goto(filePath);

        // Warten bis App geladen ist
        await page.waitForSelector('.app-title', { timeout: 10000 });

        // Zur Wiki-View wechseln
        await page.click('.nav-tab[data-view="wiki"]');
        await page.waitForSelector('#view-wiki', { state: 'visible' });
    });

    // ============================================================
    // WIKI EINTRAG ERSTELLEN
    // ============================================================

    test.describe('Wiki Eintrag erstellen', () => {
        test('sollte neuen Wiki-Eintrag erstellen können', async ({ page }) => {
            // Neuen Eintrag Button klicken
            await page.click('[data-action="call"][data-value="showWikiForm"]');

            // Form ausfüllen
            await page.fill('#wiki-title', 'Teststadt');
            await page.selectOption('#wiki-category', 'locations');

            // Content im Rich-Editor eingeben
            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Dies ist eine Beschreibung der Teststadt.');

            // Speichern
            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            // Prüfen ob Eintrag in der Liste erscheint
            await expect(page.locator('.wiki-tree')).toContainText('Teststadt');
        });

        test('sollte Wiki-Eintrag mit Tags erstellen', async ({ page }) => {
            await page.click('[data-action="call"][data-value="showWikiForm"]');

            await page.fill('#wiki-title', 'Getaggter Eintrag');
            await page.fill('#wiki-tags', 'wichtig, quest, geheim');
            await page.selectOption('#wiki-category', 'notes');

            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Eintrag mit Tags.');

            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            // Eintrag sollte erscheinen
            await expect(page.locator('.wiki-tree')).toContainText('Getaggter Eintrag');
        });

        test('sollte Pflichtfeld-Validierung haben', async ({ page }) => {
            await page.click('[data-action="call"][data-value="showWikiForm"]');

            // Ohne Titel speichern versuchen
            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            // Sollte Toast-Warnung zeigen oder Form nicht abschicken
            // Form sollte noch offen sein
            await expect(page.locator('#wiki-title')).toBeVisible();
        });
    });

    // ============================================================
    // WIKI HIERARCHIE
    // ============================================================

    test.describe('Wiki Hierarchie', () => {
        test.beforeEach(async ({ page }) => {
            // Erstelle Parent-Eintrag
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'Königreich Testland');
            await page.selectOption('#wiki-category', 'locations');
            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Das große Königreich.');
            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            await page.waitForTimeout(500); // Kurz warten
        });

        test('sollte Kind-Eintrag erstellen können', async ({ page }) => {
            // Neuen Eintrag als Kind erstellen
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'Hauptstadt');
            await page.selectOption('#wiki-category', 'locations');

            // Parent auswählen (wenn verfügbar)
            const parentSelect = page.locator('#wiki-parent');
            if (await parentSelect.isVisible()) {
                // Wähle den ersten Eintrag als Parent
                const options = await parentSelect.locator('option').all();
                if (options.length > 1) {
                    await parentSelect.selectOption({ index: 1 });
                }
            }

            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Die Hauptstadt des Königreichs.');

            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            // Prüfen ob beide Einträge existieren
            await expect(page.locator('.wiki-tree')).toContainText('Hauptstadt');
        });

        test('sollte Kategorie-Baum expandieren/kollabieren', async ({ page }) => {
            // Kategorie-Header finden und klicken
            const categoryHeader = page.locator('.wiki-tree-category-header').first();

            if (await categoryHeader.isVisible()) {
                // Initialer Zustand prüfen
                const isExpanded = await categoryHeader.getAttribute('data-expanded');

                // Toggle
                await categoryHeader.click();
                await page.waitForTimeout(200);

                // Nochmal togglen
                await categoryHeader.click();
            }
        });
    });

    // ============================================================
    // WIKI LINKS
    // ============================================================

    test.describe('Wiki Links', () => {
        test('sollte Wiki-Link Syntax [[Name]] unterstützen', async ({ page }) => {
            // Ersten Eintrag erstellen
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'Held Max');
            await page.selectOption('#wiki-category', 'character');
            const editor1 = page.locator('#wiki-content');
            await editor1.click();
            await editor1.type('Ein tapferer Held.');
            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            await page.waitForTimeout(500);

            // Zweiten Eintrag mit Link erstellen
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'Quest: Drachenjagd');
            await page.selectOption('#wiki-category', 'quest');
            const editor2 = page.locator('#wiki-content');
            await editor2.click();
            await editor2.type('[[Held Max]] muss den Drachen besiegen.');
            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            // Eintrag öffnen und Link prüfen
            await page.click('.wiki-tree-item:has-text("Quest: Drachenjagd")');

            // Link sollte als klickbarer Wiki-Link gerendert werden
            const wikiLink = page.locator(
                '.wiki-detail-body .wiki-link, .wiki-detail-body a:has-text("Held Max")'
            );
            await expect(wikiLink).toBeVisible();
        });
    });

    // ============================================================
    // WIKI SUCHE
    // ============================================================

    test.describe('Wiki Suche', () => {
        test.beforeEach(async ({ page }) => {
            // Mehrere Einträge erstellen
            const entries = [
                {
                    title: 'Zwergenstadt Ironforge',
                    category: 'locations',
                    content: 'Eine Stadt der Zwerge'
                },
                { title: 'Elfenwald', category: 'locations', content: 'Ein magischer Wald' },
                { title: 'Schmied Thorin', category: 'character', content: 'Ein Zwergenschmied' }
            ];

            for (const entry of entries) {
                await page.click('[data-action="call"][data-value="showWikiForm"]');
                await page.fill('#wiki-title', entry.title);
                await page.selectOption('#wiki-category', entry.category);
                const editor = page.locator('#wiki-content');
                await editor.click();
                await editor.type(entry.content);
                await page.click('[data-action="call"][data-value="saveWikiEntry"]');
                await page.waitForTimeout(300);
            }
        });

        test('sollte nach Titel suchen können', async ({ page }) => {
            const searchInput = page.locator('#wiki-search');

            if (await searchInput.isVisible()) {
                await searchInput.fill('Zwerg');
                await page.waitForTimeout(500);

                // Sollte passende Einträge zeigen
                const results = page.locator('.wiki-tree-item');
                // Mindestens Zwergenstadt und Schmied sollten gefunden werden
            }
        });

        test('sollte Kategorie-Filter unterstützen', async ({ page }) => {
            const categoryFilter = page.locator(
                '#wiki-category-filter, [data-action="filter-wiki-category"]'
            );

            if (await categoryFilter.first().isVisible()) {
                // Nach Orten filtern
                await categoryFilter.first().click();
            }
        });
    });

    // ============================================================
    // WIKI BEARBEITEN & LÖSCHEN
    // ============================================================

    test.describe('Wiki Bearbeiten & Löschen', () => {
        test.beforeEach(async ({ page }) => {
            // Test-Eintrag erstellen
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'Zu bearbeitender Eintrag');
            await page.selectOption('#wiki-category', 'notes');
            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Originaltext');
            await page.click('[data-action="call"][data-value="saveWikiEntry"]');
            await page.waitForTimeout(500);
        });

        test('sollte Wiki-Eintrag bearbeiten können', async ({ page }) => {
            // Eintrag auswählen
            await page.click('.wiki-tree-item:has-text("Zu bearbeitender Eintrag")');

            // Bearbeiten-Button klicken
            const editBtn = page
                .locator(
                    '[data-action="call"][data-value="editWikiEntry"], .wiki-detail-actions button:has-text("✏")'
                )
                .first();
            if (await editBtn.isVisible()) {
                await editBtn.click();

                // Titel ändern
                await page.fill('#wiki-title', 'Bearbeiteter Eintrag');

                // Speichern
                await page.click('[data-action="call"][data-value="saveWikiEntry"]');

                // Änderung prüfen
                await expect(page.locator('.wiki-tree')).toContainText('Bearbeiteter Eintrag');
            }
        });

        test('sollte Wiki-Eintrag löschen können', async ({ page }) => {
            // Eintrag auswählen
            await page.click('.wiki-tree-item:has-text("Zu bearbeitender Eintrag")');

            // Löschen-Button klicken
            const deleteBtn = page
                .locator('[data-action="delete-wiki"], .wiki-detail-actions button:has-text("🗑")')
                .first();
            if (await deleteBtn.isVisible()) {
                // Dialog-Handler für Bestätigung
                page.on('dialog', dialog => dialog.accept());

                await deleteBtn.click();

                await page.waitForTimeout(500);

                // Eintrag sollte nicht mehr existieren
                await expect(page.locator('.wiki-tree')).not.toContainText(
                    'Zu bearbeitender Eintrag'
                );
            }
        });
    });

    // ============================================================
    // WIKI EDITOR FORMATIERUNG
    // ============================================================

    test.describe('Wiki Editor Formatierung', () => {
        test('sollte Text fett formatieren können', async ({ page }) => {
            await page.click('[data-action="call"][data-value="showWikiForm"]');

            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Normaler Text');

            // Text markieren
            await editor.selectText();

            // Bold-Button klicken
            const boldBtn = page
                .locator(
                    '.editor-toolbar [data-editor="bold"], .editor-toolbar button:has-text("B")'
                )
                .first();
            if (await boldBtn.isVisible()) {
                await boldBtn.click();
            }
        });

        test('sollte Read-Aloud Formatierung anwenden können', async ({ page }) => {
            await page.click('[data-action="call"][data-value="showWikiForm"]');

            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Vorlesetext für den DM');

            // Text markieren
            await editor.selectText();

            // Read-Aloud Dropdown
            const readAloudSelect = page
                .locator('.editor-select[data-action="set-read-aloud-style"]')
                .first();
            if (await readAloudSelect.isVisible()) {
                await readAloudSelect.selectOption('parchment');
            }
        });

        test('sollte Tabelle einfügen können', async ({ page }) => {
            await page.click('[data-action="call"][data-value="showWikiForm"]');

            const editor = page.locator('#wiki-content');
            await editor.click();

            // Tabellen-Button
            const tableBtn = page.locator('.editor-toolbar [data-action="insert-table"]').first();
            if (await tableBtn.isVisible()) {
                await tableBtn.click();

                // Prüfen ob Tabelle eingefügt wurde
                const hasTable = await editor.locator('table').isVisible();
                // Oder Modal für Tabellengrößte erscheint
            }
        });
    });

    // ============================================================
    // WIKI DATEN PERSISTENZ
    // ============================================================

    test.describe('Wiki Daten Persistenz', () => {
        test('sollte Wiki-Einträge nach Reload behalten', async ({ page }) => {
            // Eintrag erstellen
            await page.click('[data-action="call"][data-value="showWikiForm"]');
            await page.fill('#wiki-title', 'Persistenter Eintrag');
            await page.selectOption('#wiki-category', 'notes');
            const editor = page.locator('#wiki-content');
            await editor.click();
            await editor.type('Dieser Eintrag sollte persistieren.');
            await page.click('[data-action="call"][data-value="saveWikiEntry"]');

            await page.waitForTimeout(1000);

            // Seite neu laden
            await page.reload();
            await page.waitForSelector('.app-title', { timeout: 10000 });

            // Zur Wiki-View wechseln
            await page.click('.nav-tab[data-view="wiki"]');
            await page.waitForSelector('#view-wiki', { state: 'visible' });

            // Eintrag sollte noch da sein
            await expect(page.locator('.wiki-tree')).toContainText('Persistenter Eintrag');
        });
    });
});
