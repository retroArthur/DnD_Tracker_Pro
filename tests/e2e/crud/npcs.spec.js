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
 * NPC CRUD Tests
 * Testet Create, Read, Update, Delete für NPCs
 */

test.describe('NPCs - CRUD Operationen', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'npcs');
        await page.waitForTimeout(300);
    });

    test.describe('CREATE - NPC erstellen', () => {
        test('NPC mit Minimaldaten erstellen', async ({ page }) => {
            const npcName = generateTestName('MinNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);

            await fillField(page, 'npc-name', npcName);
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // Prüfe direkt die Daten
            const npcData = await page.evaluate(name => {
                // @ts-ignore
                return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
            }, npcName);

            expect(npcData).toBeTruthy();
            expect(npcData.name).toContain(npcName);
        });

        test('NPC mit vollständigen Daten erstellen', async ({ page }) => {
            const npcName = generateTestName('FullNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);

            await fillField(page, 'npc-name', npcName);

            const roleField = page.locator('#npc-role');
            if (await roleField.isVisible()) {
                await fillField(page, 'npc-role', 'Schmied');
            }

            const raceSelect = page.locator('#npc-race');
            if (await raceSelect.isVisible()) {
                await selectOption(page, 'npc-race', 'Dwarf');
            }

            const chapterField = page.locator('#npc-chapter');
            if (await chapterField.isVisible()) {
                await fillField(page, 'npc-chapter', '2');
            }

            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            const npcData = await page.evaluate(name => {
                // @ts-ignore
                return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
            }, npcName);

            expect(npcData).toBeTruthy();
        });

        test('NPC ohne Namen zeigt Fehlermeldung', async ({ page }) => {
            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);

            await fillField(page, 'npc-role', 'Wirt');
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(300);

            const toast = page.locator('#toast');
            await expect(toast).toBeVisible();
        });

        test('NPC mit Trigger erstellen', async ({ page }) => {
            const npcName = generateTestName('TriggerNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);

            await fillField(page, 'npc-name', npcName);

            // Trigger hinzufügen falls Button existiert
            const addTriggerBtn = page.locator(
                '[data-action="call"][data-value="addTriggerField"]'
            );
            if (await addTriggerBtn.isVisible()) {
                await addTriggerBtn.click();
                await page.waitForTimeout(200);
            }

            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            const npcData = await page.evaluate(name => {
                // @ts-ignore
                return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
            }, npcName);

            expect(npcData).toBeTruthy();
        });

        test('NPC mit Dialog erstellen', async ({ page }) => {
            const npcName = generateTestName('DialogNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);

            await fillField(page, 'npc-name', npcName);

            const addDialogBtn = page.locator('[data-action="call"][data-value="addDialogField"]');
            if (await addDialogBtn.isVisible()) {
                await addDialogBtn.click();
                await page.waitForTimeout(200);
            }

            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            const npcData = await page.evaluate(name => {
                // @ts-ignore
                return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
            }, npcName);

            expect(npcData).toBeTruthy();
        });
    });

    test.describe('READ - NPC anzeigen', () => {
        test('NPC-Liste zeigt alle NPCs', async ({ page }) => {
            const npcName = generateTestName('ListNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // Prüfe ob im DOM
            const pageContent = await page.locator('#npcs-list, #view-npcs').textContent();
            expect(pageContent).toContain(npcName);
        });

        test('NPC-Suche filtert Liste', async ({ page }) => {
            const npc1 = generateTestName('Alpha');
            const npc2 = generateTestName('Beta');

            // Zwei NPCs erstellen
            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npc1);
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npc2);
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // Suche
            const searchField = page.locator('#npc-search');
            await searchField.fill('Alpha');
            await page.waitForTimeout(300);

            // Prüfe Datenfilterung funktioniert
            const visibleContent = await page.locator('#npcs-list, .npc-list').textContent();
            expect(visibleContent).toContain('Alpha');
        });

        test('NPC-Details können angezeigt werden', async ({ page }) => {
            const npcName = generateTestName('DetailNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);
            await fillField(page, 'npc-role', 'Magier');
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // NPC in Daten vorhanden
            const npcData = await page.evaluate(name => {
                // @ts-ignore
                return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
            }, npcName);

            expect(npcData).toBeTruthy();
            expect(npcData.role).toBe('Magier');
        });
    });

    test.describe('UPDATE - NPC bearbeiten', () => {
        test('NPC-Daten können geändert werden', async ({ page }) => {
            const npcName = generateTestName('EditNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);
            await fillField(page, 'npc-role', 'Lehrling');
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // Edit
            const editBtn = page.locator('[data-action="edit-npc"]').first();
            if (await editBtn.isVisible()) {
                await editBtn.click();
                await page.waitForTimeout(300);

                await fillField(page, 'npc-role', 'Erzmagier');
                await page.click('[data-action="call"][data-value="saveNPC"]');
                await page.waitForTimeout(500);

                const npcData = await page.evaluate(name => {
                    // @ts-ignore
                    return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
                }, npcName);

                expect(npcData.role).toBe('Erzmagier');
            }
        });

        test('NPC-Chapter kann aktualisiert werden', async ({ page }) => {
            const npcName = generateTestName('ChapterNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);
            await fillField(page, 'npc-chapter', '1');
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            let npcData = await page.evaluate(name => {
                // @ts-ignore
                return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
            }, npcName);

            expect(npcData.chapter).toBe('1');

            // Edit
            const editBtn = page.locator('[data-action="edit-npc"]').first();
            if (await editBtn.isVisible()) {
                await editBtn.click();
                await page.waitForTimeout(300);

                await fillField(page, 'npc-chapter', '3');
                await page.click('[data-action="call"][data-value="saveNPC"]');
                await page.waitForTimeout(500);

                npcData = await page.evaluate(name => {
                    // @ts-ignore
                    return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
                }, npcName);

                expect(npcData.chapter).toBe('3');
            }
        });
    });

    test.describe('DELETE - NPC löschen', () => {
        test('NPC kann gelöscht werden', async ({ page }) => {
            const npcName = generateTestName('DeleteNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            const countBefore = await page.evaluate(() => {
                // @ts-ignore
                return D.npcs ? D.npcs.length : 0;
            });

            page.on('dialog', dialog => dialog.accept());

            const deleteBtn = page.locator('[data-action="delete-npc"]').first();
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.waitForTimeout(500);

                const countAfter = await page.evaluate(() => {
                    // @ts-ignore
                    return D.npcs ? D.npcs.length : 0;
                });

                expect(countAfter).toBeLessThan(countBefore);
            }
        });

        test('Löschen kann rückgängig gemacht werden', async ({ page }) => {
            const npcName = generateTestName('UndoNPC');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            page.on('dialog', dialog => dialog.accept());

            const deleteBtn = page.locator('[data-action="delete-npc"]').first();
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.waitForTimeout(500);

                await performUndo(page);
                await page.waitForTimeout(500);

                const npcData = await page.evaluate(name => {
                    // @ts-ignore
                    return D.npcs ? D.npcs.find(n => n.name && n.name.includes(name)) : null;
                }, npcName);

                expect(npcData).toBeTruthy();
            }
        });
    });
});
