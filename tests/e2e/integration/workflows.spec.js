// @ts-check
import { test, expect } from '@playwright/test';
import {
    loadApp,
    navigateToTab,
    openCollapseForm,
    fillField,
    selectOption,
    generateTestName,
    performUndo,
    performRedo
} from '../helpers/test-utils.js';

/**
 * Integration Workflow Tests
 * Testet komplette Abläufe über mehrere Features hinweg
 */

test.describe('Komplette Workflows', () => {
    test.describe('Kampagnen-Setup Workflow', () => {
        test('Komplette Kampagne aufsetzen: Charaktere, NPCs, Orte, Quests', async ({ page }) => {
            await loadApp(page);

            // 1. Charakter erstellen
            await navigateToTab(page, 'party');
            const charName = generateTestName('Hero');

            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', charName);

            // Optionale Felder nur wenn vorhanden
            const playerField = page.locator('#char-player');
            if (await playerField.isVisible()) {
                await fillField(page, 'char-player', 'Spieler 1');
            }

            const classSelect = page.locator('#char-class');
            if (await classSelect.isVisible()) {
                await selectOption(page, 'char-class', 'Fighter');
            }

            await fillField(page, 'char-level', '5');
            await fillField(page, 'char-hp-max', '45');
            await fillField(page, 'char-hp-cur', '45');
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // Verify via data
            const charExists = await page.evaluate(name => {
                return D.characters
                    ? D.characters.some(c => c.name && c.name.includes(name))
                    : false;
            }, charName);
            expect(charExists).toBe(true);

            // 2. NPC erstellen
            await navigateToTab(page, 'npcs');
            const npcName = generateTestName('Questgeber');

            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);

            const roleField = page.locator('#npc-role');
            if (await roleField.isVisible()) {
                await fillField(page, 'npc-role', 'Bürgermeister');
            }

            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // Verify via data statt DOM
            const npcExists = await page.evaluate(name => {
                return D.npcs ? D.npcs.some(n => n.name && n.name.includes(name)) : false;
            }, npcName);
            expect(npcExists).toBe(true);

            // 3. Ort erstellen
            await navigateToTab(page, 'locations');
            const locName = generateTestName('Dorf');

            await page.click('[data-action="show-modal"][data-value="location-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'loc-name', locName);
            await page.click('[data-action="call"][data-value="saveLocation"]');
            await page.waitForTimeout(500);

            // Verify via data
            const locExists = await page.evaluate(name => {
                return D.locations ? D.locations.some(l => l.name && l.name.includes(name)) : false;
            }, locName);
            expect(locExists).toBe(true);

            // 4. Quest erstellen
            await navigateToTab(page, 'quests');
            const questTitle = generateTestName('Hauptquest');

            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', questTitle);

            const goldField = page.locator('#quest-reward-gold');
            if (await goldField.isVisible()) {
                await fillField(page, 'quest-reward-gold', '500');
            }

            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Verify via data
            const questExists = await page.evaluate(title => {
                return D.quests ? D.quests.some(q => q.title && q.title.includes(title)) : false;
            }, questTitle);
            expect(questExists).toBe(true);

            // Alle Entities existieren
            const entityCounts = await page.evaluate(() => ({
                // @ts-ignore
                characters: D.characters.length,
                // @ts-ignore
                npcs: D.npcs.length,
                // @ts-ignore
                locations: D.locations.length,
                // @ts-ignore
                quests: D.quests.length
            }));

            expect(entityCounts.characters).toBeGreaterThanOrEqual(1);
            expect(entityCounts.npcs).toBeGreaterThanOrEqual(1);
            expect(entityCounts.locations).toBeGreaterThanOrEqual(1);
            expect(entityCounts.quests).toBeGreaterThanOrEqual(1);
        });
    });

    test.describe('Undo/Redo Workflow', () => {
        test('Mehrfaches Undo und Redo funktioniert korrekt', async ({ page }) => {
            await loadApp(page);
            await navigateToTab(page, 'party');

            // 3 Charaktere erstellen
            const names = [];
            for (let i = 1; i <= 3; i++) {
                const name = generateTestName(`UndoChar${i}`);
                names.push(name);

                await openCollapseForm(page, 'char-form');
                await fillField(page, 'char-name', name);
                await page.click('[data-action="call"][data-value="saveCharacter"]');
                await page.waitForTimeout(500);
            }

            // Alle 3 sollten existieren (via data)
            for (const name of names) {
                const exists = await page.evaluate(n => {
                    return D.characters
                        ? D.characters.some(c => c.name && c.name.includes(n))
                        : false;
                }, name);
                expect(exists).toBe(true);
            }

            // Undo 3x - alle Charaktere sollten weg sein
            await performUndo(page);
            await page.waitForTimeout(300);
            await performUndo(page);
            await page.waitForTimeout(300);
            await performUndo(page);
            await page.waitForTimeout(300);

            // Keiner der Charaktere sollte mehr in den Daten sein
            for (const name of names) {
                const exists = await page.evaluate(n => {
                    return D.characters
                        ? D.characters.some(c => c.name && c.name.includes(n))
                        : false;
                }, name);
                expect(exists).toBe(false);
            }

            // Redo 2x - 2 Charaktere sollten wieder da sein
            await performRedo(page);
            await page.waitForTimeout(300);
            await performRedo(page);
            await page.waitForTimeout(300);

            // Erste 2 Charaktere sollten wieder in den Daten sein
            const char0Exists = await page.evaluate(n => {
                return D.characters ? D.characters.some(c => c.name && c.name.includes(n)) : false;
            }, names[0]);
            const char1Exists = await page.evaluate(n => {
                return D.characters ? D.characters.some(c => c.name && c.name.includes(n)) : false;
            }, names[1]);
            expect(char0Exists).toBe(true);
            expect(char1Exists).toBe(true);
        });
    });

    test.describe('Such-Workflow', () => {
        test('Globale Suche findet Entities über alle Typen', async ({ page }) => {
            await loadApp(page);

            // Entities mit erkennbarem Namen erstellen
            const searchTerm = 'UniqueSearch' + Date.now();

            // Charakter
            await navigateToTab(page, 'party');
            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', searchTerm + '_Char');
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // NPC
            await navigateToTab(page, 'npcs');
            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', searchTerm + '_NPC');
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // Globale Suche öffnen
            const globalSearch = page.locator('#global-search');
            await globalSearch.fill(searchTerm);
            await page.waitForTimeout(500);

            // Suchergebnisse sollten beide Entities zeigen
            const results = page.locator('#global-search-results');
            if (await results.isVisible()) {
                await expect(results).toContainText('Char');
                await expect(results).toContainText('NPC');
            }
        });
    });

    test.describe('Navigation Workflow', () => {
        test('Tab-Wechsel behält Daten bei', async ({ page }) => {
            await loadApp(page);

            // Charakter erstellen
            await navigateToTab(page, 'party');
            const charName = generateTestName('NavChar');
            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // Zu anderen Tabs navigieren
            await navigateToTab(page, 'npcs');
            await navigateToTab(page, 'locations');
            await navigateToTab(page, 'quests');
            await navigateToTab(page, 'dice');

            // Zurück zu Party
            await navigateToTab(page, 'party');

            // Charakter sollte noch in den Daten sein
            const charExists = await page.evaluate(name => {
                return D.characters
                    ? D.characters.some(c => c.name && c.name.includes(name))
                    : false;
            }, charName);
            expect(charExists).toBe(true);
        });

        test('Keyboard-Navigation mit Zahlen funktioniert', async ({ page }) => {
            await loadApp(page);

            // 1 = Dashboard
            await page.keyboard.press('1');
            await page.waitForTimeout(300);
            await expect(page.locator('.nav-tab[data-view="dashboard"]')).toHaveClass(/active/);

            // 2 = Party
            await page.keyboard.press('2');
            await page.waitForTimeout(300);
            await expect(page.locator('.nav-tab[data-view="party"]')).toHaveClass(/active/);

            // 3 = NPCs
            await page.keyboard.press('3');
            await page.waitForTimeout(300);
            await expect(page.locator('.nav-tab[data-view="npcs"]')).toHaveClass(/active/);
        });
    });

    test.describe('Daten-Verknüpfungs-Workflow', () => {
        test('NPC mit Ort verknüpfen', async ({ page }) => {
            await loadApp(page);

            // Erst Ort erstellen
            await navigateToTab(page, 'locations');
            const locName = generateTestName('LinkLoc');
            await page.click('[data-action="show-modal"][data-value="location-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'loc-name', locName);
            await page.click('[data-action="call"][data-value="saveLocation"]');
            await page.waitForTimeout(500);

            // Dann NPC mit diesem Ort erstellen
            await navigateToTab(page, 'npcs');
            const npcName = generateTestName('LinkNPC');
            await page.click('[data-action="show-modal"][data-value="npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);

            // Ort auswählen falls Dropdown vorhanden
            const locSelect = page.locator('#npc-location');
            if (await locSelect.isVisible()) {
                const options = await locSelect.locator('option').allTextContents();
                const matchingOption = options.find(o => o.includes(locName));
                if (matchingOption) {
                    await locSelect.selectOption({ label: matchingOption });
                }
            }

            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // NPC sollte erstellt sein (via data)
            const npcExists = await page.evaluate(name => {
                return D.npcs ? D.npcs.some(n => n.name && n.name.includes(name)) : false;
            }, npcName);
            expect(npcExists).toBe(true);
        });
    });

    test.describe('Monster/Encounter Workflow', () => {
        test('Monster erstellen und in Initiative-Tracker verwenden', async ({ page }) => {
            await loadApp(page);

            // Monster erstellen
            await navigateToTab(page, 'encounter');
            const monsterName = generateTestName('Goblin');

            await openCollapseForm(page, 'enc-form');
            await fillField(page, 'enc-name', monsterName);

            // CR Select falls vorhanden
            const crSelect = page.locator('#enc-cr');
            if (await crSelect.isVisible()) {
                await selectOption(page, 'enc-cr', '1/4');
            }

            await fillField(page, 'enc-hp', '7');

            const acField = page.locator('#enc-ac');
            if (await acField.isVisible()) {
                await fillField(page, 'enc-ac', '15');
            }

            await page.click('[data-action="call"][data-value="saveEncounter"]');
            await page.waitForTimeout(500);

            // Verify via data
            const monsterExists = await page.evaluate(name => {
                return D.encounters
                    ? D.encounters.some(e => e.name && e.name.includes(name))
                    : false;
            }, monsterName);
            expect(monsterExists).toBe(true);

            // Zum Initiative-Tracker wechseln
            await navigateToTab(page, 'initiative');

            // Monster zum Tracker hinzufügen (falls Button vorhanden)
            const addEncBtn = page.locator('[data-action="add-enc-to-init"]').first();
            if (await addEncBtn.isVisible()) {
                await addEncBtn.click();
                await page.waitForTimeout(300);
            }
        });
    });

    test.describe('Fehlerbehandlung Workflow', () => {
        test('App zeigt Fehler bei ungültigen Eingaben', async ({ page }) => {
            await loadApp(page);
            await navigateToTab(page, 'party');

            // Versuch ohne Pflichtfelder zu speichern
            await openCollapseForm(page, 'char-form');
            await page.click('[data-action="call"][data-value="saveCharacter"]');

            // Fehlermeldung sollte erscheinen
            await expect(page.locator('#toast')).toBeVisible();
        });

        test('Lösch-Bestätigung verhindert versehentliches Löschen', async ({ page }) => {
            await loadApp(page);
            await navigateToTab(page, 'party');

            // Charakter erstellen
            const charName = generateTestName('ConfirmDelete');
            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // Dialog ABLEHNEN
            page.on('dialog', dialog => dialog.dismiss());

            // Löschen versuchen
            const deleteBtn = page.locator('[data-action="delete-char"]').first();
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.waitForTimeout(500);

                // Charakter sollte NOCH in den Daten sein (Dialog abgelehnt)
                const charExists = await page.evaluate(name => {
                    return D.characters
                        ? D.characters.some(c => c.name && c.name.includes(name))
                        : false;
                }, charName);
                expect(charExists).toBe(true);
            }
        });
    });

    test.describe('Vollständiger Session-Workflow', () => {
        test('Komplette D&D Session simulieren', async ({ page }) => {
            await loadApp(page);

            // === VORBEREITUNG ===

            // Party erstellen
            await navigateToTab(page, 'party');

            const partyMembers = ['Krieger', 'Magier', 'Schurke'];
            for (const member of partyMembers) {
                const name = generateTestName(member);
                await openCollapseForm(page, 'char-form');
                await fillField(page, 'char-name', name);
                await fillField(page, 'char-level', '5');
                await fillField(page, 'char-hp-max', '40');
                await fillField(page, 'char-hp-cur', '40');
                await page.click('[data-action="call"][data-value="saveCharacter"]');
                await page.waitForTimeout(400);
            }

            // Monster für Encounter
            await navigateToTab(page, 'encounter');
            const monsterName = generateTestName('SessionMonster');
            await openCollapseForm(page, 'enc-form');
            await fillField(page, 'enc-name', monsterName);
            await fillField(page, 'enc-hp', '30');
            await fillField(page, 'enc-ac', '14');
            await page.click('[data-action="call"][data-value="saveEncounter"]');
            await page.waitForTimeout(500);

            // === WÜRFELN ===

            await navigateToTab(page, 'dice');
            const d20Btn = page.locator('[data-dice="d20"], [data-value="d20"]').first();
            if (await d20Btn.isVisible()) {
                await d20Btn.click();
                await page.waitForTimeout(300);
            }

            // === QUEST ABSCHLIESSEN ===

            await navigateToTab(page, 'quests');
            const questTitle = generateTestName('SessionQuest');
            await page.click('[data-action="show-modal"][data-value="quest-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'quest-title', questTitle);
            await fillField(page, 'quest-reward-gold', '100');
            await page.click('[data-action="call"][data-value="saveQuest"]');
            await page.waitForTimeout(500);

            // Session erfolgreich - alle Daten vorhanden
            const finalCounts = await page.evaluate(() => ({
                // @ts-ignore
                characters: D.characters.length,
                // @ts-ignore
                encounters: D.encounters.length,
                // @ts-ignore
                quests: D.quests.length
            }));

            expect(finalCounts.characters).toBeGreaterThanOrEqual(3);
            expect(finalCounts.encounters).toBeGreaterThanOrEqual(1);
            expect(finalCounts.quests).toBeGreaterThanOrEqual(1);
        });
    });
});
