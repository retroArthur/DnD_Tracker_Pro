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
        // 08-RESEARCH Pitfall 4 / D-06: seed markdownOnboardingSeen BEFORE loadApp()
        // so the 2000ms onboarding setTimeout (ui/editors/markdown-shortcuts.js) never
        // schedules and can't overwrite a validation-error toast in the shared legacy
        // #toast node during the assertion window. Documented setup, not masking —
        // these tests verify validation-error display, not the onboarding flow.
        //
        // Also seed the collections that are NOT part of initializeData()'s default
        // schema (randomTables, timers, shops, campaign) plus a fully-populated
        // _nextId map. Root-cause investigation (traced via stack-trace instrumentation)
        // found a SECOND, independent early-boot race with the exact same shape:
        // features/random-tables.js:initRandomTables() calls save() unconditionally
        // whenever D.randomTables is missing (fires ~150ms after boot, every fresh
        // session — real users hit this too, not just tests), and
        // render/helpers.js:validateDataIntegrity() schedules a repair save() 1s after
        // load() whenever D.timers/D.shops/D.campaign or any _nextId entry is missing.
        // Either save() triggers systems/file-backup/file-backup-manager.js:onAfterSave()'s
        // once-per-session "Ungesicherte Aenderungen - Backup herunterladen?" info toast,
        // which stomps the shared #toast node exactly like the onboarding toast did.
        // Seeding a fully "already valid" shape prevents both triggers so no early
        // save()-driven toast can fire during the assertion window.
        await page.addInitScript(() => {
            try {
                localStorage.setItem(
                    'dnd-tracker-v4',
                    JSON.stringify({
                        // Far-future _version so load() skips migrateData() entirely —
                        // the seed is a minimal settings-only payload, not a full export.
                        _version: '99.0.0',
                        settings: {
                            theme: 'dark',
                            lastView: 'dashboard',
                            enableMarkdownShortcuts: true,
                            enableMarkdownImportExport: true,
                            markdownOnboardingSeen: true,
                            levelingMode: 'xp'
                        },
                        randomTables: [],
                        timers: [],
                        shops: [],
                        campaign: {},
                        _nextId: {
                            characters: 1,
                            npcs: 1,
                            locations: 1,
                            quests: 1,
                            encounters: 1,
                            spells: 1,
                            loot: 1,
                            items: 1,
                            wiki: 1,
                            sessionNotes: 1,
                            randomTables: 1
                        }
                    })
                );
            } catch {
                // file:// localStorage restrictions vary by browser build; if the seed
                // silently fails, the app falls back to its own default (the pre-fix
                // race may return) — no crash either way.
            }
        });
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

            // Fehlermeldung erwartet — utils/validation.js baut die Meldung aus dem
            // Schema-Feldnamen (`${field}: Pflichtfeld fehlt`); VALIDATION_SCHEMAS.quest.title
            // ist der englische Schluessel "title" (utils/validation.js:62), nicht das
            // deutsche Wort "Titel" — die Meldung lautet also "title: Pflichtfeld fehlt".
            await expect(page.locator('#toast')).toContainText('title');
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
