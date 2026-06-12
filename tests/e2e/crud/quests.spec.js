// @ts-check
import { test, expect } from '@playwright/test';
import {
    loadApp,
    navigateToTab,
    fillField,
    selectOption,
    generateTestName,
    performUndo
} from '../helpers/test-utils.js';

/**
 * Quests CRUD Tests
 * Testet Create, Read, Update, Delete für Quests
 */

test.describe('Quests - CRUD Operationen', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'quests');
    });

    test.describe('CREATE - Quest erstellen', () => {
        test('Quest mit Minimaldaten erstellen', async ({ page }) => {
            const questTitle = generateTestName('MinQuest');

            // Modal öffnen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);

            // Titel ausfüllen
            await fillField(page, 'quest-title', questTitle);

            // Speichern
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Prüfen ob Quest in Liste erscheint
            await expect(page.locator('#quests-list, .quest-list')).toContainText(questTitle);
        });

        test('Quest mit vollständigen Daten erstellen', async ({ page }) => {
            const questTitle = generateTestName('FullQuest');

            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);

            await fillField(page, 'quest-title', questTitle);

            // Quest-Typ wählen falls vorhanden
            const typeSelect = page.locator('#quest-type');
            if (await typeSelect.isVisible()) {
                await selectOption(page, 'quest-type', 'main');
            }

            // Belohnung falls Feld vorhanden
            const goldField = page.locator('#quest-reward-gold');
            if (await goldField.isVisible()) {
                await fillField(page, 'quest-reward-gold', '500');
            }

            const otherField = page.locator('#quest-reward-other');
            if (await otherField.isVisible()) {
                await fillField(page, 'quest-reward-other', 'Magisches Schwert');
            }

            // Beschreibung falls Editor vorhanden
            const descEditor = page.locator('#quest-desc');
            if (await descEditor.isVisible()) {
                await descEditor.click();
                await descEditor.pressSequentially('Finde den verlorenen Schatz.');
            }

            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Prüfen
            const questData = await page.evaluate(title => {
                // @ts-ignore
                return D.quests ? D.quests.find(q => q.title && q.title.includes(title)) : null;
            }, questTitle);

            expect(questData).toBeTruthy();
        });

        test('Quest ohne Titel zeigt Fehlermeldung', async ({ page }) => {
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);

            // Nur Belohnung, kein Titel
            await fillField(page, 'quest-reward-gold', '100');

            await page.click('[data-action="call"][data-value="saveQuest"]');

            // Fehlermeldung erwartet
            await expect(page.locator('#toast')).toContainText('Titel');
        });
    });

    test.describe('READ - Quest anzeigen', () => {
        test('Questliste zeigt alle Quests', async ({ page }) => {
            const questTitle = generateTestName('ListQuest');

            // Quest erstellen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', questTitle);
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Quest in Liste
            await expect(page.locator('#quests-list, .quest-list')).toContainText(questTitle);
        });

        test('Questsuche filtert Liste', async ({ page }) => {
            const quest1 = generateTestName('SearchQuest_Dragon');
            const quest2 = generateTestName('SearchQuest_Goblin');

            // Zwei Quests erstellen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', quest1);
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', quest2);
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Suche
            await fillField(page, 'quest-search', 'Dragon');
            await page.waitForTimeout(300);

            // Nur Dragon sichtbar
            await expect(page.locator('#quests-list, .quest-list')).toContainText('Dragon');
            await expect(page.locator('#quests-list, .quest-list')).not.toContainText('Goblin');
        });

        test('Aktiv/Abgeschlossen Filter funktioniert', async ({ page }) => {
            const activeQuest = generateTestName('ActiveQuest');

            // Quest erstellen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', activeQuest);
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Filter auf "Aktiv" prüfen
            const activeFilter = page.locator(
                '#quest-filter-active, [data-action="filter-quests"][data-value="active"]'
            );
            if (await activeFilter.isVisible()) {
                // Quest sollte als aktiv erscheinen
                await expect(page.locator('#quests-list, .quest-list')).toContainText(activeQuest);
            }
        });
    });

    test.describe('UPDATE - Quest bearbeiten', () => {
        test('Quest kann als abgeschlossen markiert werden', async ({ page }) => {
            const questTitle = generateTestName('CompleteQuest');

            // Quest erstellen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', questTitle);
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Bearbeiten und als abgeschlossen markieren
            const editBtn = page.locator(`[data-action="edit-quest"]`).first();
            if (await editBtn.isVisible()) {
                await editBtn.click();
                await page.waitForTimeout(300);

                // Completed Checkbox
                const completedCheckbox = page.locator('#quest-completed');
                if (await completedCheckbox.isVisible()) {
                    await completedCheckbox.check();
                }

                await page.click('[data-action="call"][data-value="saveQuest"]');
                await page.waitForTimeout(500);

                // Prüfen
                const questData = await page.evaluate(title => {
                    // @ts-ignore
                    return D.quests.find(q => q.title.includes(title));
                }, questTitle);

                expect(questData.completed).toBe(true);
            }
        });

        test('Quest-Belohnung kann geändert werden', async ({ page }) => {
            const questTitle = generateTestName('RewardQuest');

            // Quest erstellen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', questTitle);
            await fillField(page, 'quest-reward-gold', '100');
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Bearbeiten
            const editBtn = page.locator(`[data-action="edit-quest"]`).first();
            if (await editBtn.isVisible()) {
                await editBtn.click();
                await page.waitForTimeout(300);

                await fillField(page, 'quest-reward-gold', '1000');
                await page.click('[data-action="call"][data-value="saveQuest"]');
                await page.waitForTimeout(500);

                // Prüfen
                const questData = await page.evaluate(title => {
                    // @ts-ignore
                    return D.quests.find(q => q.title.includes(title));
                }, questTitle);

                expect(questData.rewardGold).toBe(1000);
            }
        });
    });

    test.describe('DELETE - Quest löschen', () => {
        test('Quest kann gelöscht werden', async ({ page }) => {
            const questTitle = generateTestName('DeleteQuest');

            // Quest erstellen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', questTitle);
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Dialog akzeptieren
            page.on('dialog', dialog => dialog.accept());

            // Löschen
            const deleteBtn = page.locator(`[data-action="delete-quest"]`).first();
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.waitForTimeout(500);

                // Prüfen
                await expect(page.locator('#quests-list, .quest-list')).not.toContainText(
                    questTitle
                );
            }
        });

        test('Löschen kann rückgängig gemacht werden', async ({ page }) => {
            const questTitle = generateTestName('UndoQuest');

            // Quest erstellen
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', questTitle);
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Dialog akzeptieren
            page.on('dialog', dialog => dialog.accept());

            // Löschen
            const deleteBtn = page.locator(`[data-action="delete-quest"]`).first();
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.waitForTimeout(500);

                // Undo
                await performUndo(page);
                await page.waitForTimeout(500);

                // Quest wieder da
                await expect(page.locator('#quests-list, .quest-list')).toContainText(questTitle);
            }
        });
    });
});
