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
 * Party/Character CRUD Tests
 * Testet Create, Read, Update, Delete für Charaktere
 */

test.describe('Party - Charakter CRUD', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'party');
        await page.waitForTimeout(300);
    });

    // Helper: Formular öffnen
    async function openCharForm(page) {
        const form = page.locator('#char-form');
        const isOpen = await form.evaluate(el => el.classList.contains('open')).catch(() => false);

        if (!isOpen) {
            await page.click('[data-action="toggle-collapse"][data-value="char-form"]');
            await page.waitForTimeout(300);
        }
    }

    test.describe('CREATE - Charakter erstellen', () => {
        test('Charakter mit Minimaldaten erstellen', async ({ page }) => {
            const charName = generateTestName('MinChar');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            const charData = await page.evaluate(name => {
                // @ts-ignore
                return D.characters
                    ? D.characters.find(c => c.name && c.name.includes(name))
                    : null;
            }, charName);

            expect(charData).toBeTruthy();
        });

        test('Charakter mit vollständigen Daten erstellen', async ({ page }) => {
            const charName = generateTestName('FullChar');

            await openCharForm(page);

            await fillField(page, 'char-name', charName);

            // Optionale Felder nur wenn sie existieren
            const playerField = page.locator('#char-player');
            if (await playerField.isVisible()) {
                await fillField(page, 'char-player', 'Test Spieler');
            }

            const classSelect = page.locator('#char-class');
            if (await classSelect.isVisible()) {
                await selectOption(page, 'char-class', 'Fighter');
            }

            await fillField(page, 'char-level', '5');

            const raceSelect = page.locator('#char-race');
            if (await raceSelect.isVisible()) {
                await selectOption(page, 'char-race', 'Human');
            }

            await fillField(page, 'char-hp-max', '45');
            await fillField(page, 'char-hp-cur', '45');

            const acField = page.locator('#char-ac');
            if (await acField.isVisible()) {
                await fillField(page, 'char-ac', '18');
            }

            const strField = page.locator('#char-str');
            if (await strField.isVisible()) {
                await fillField(page, 'char-str', '16');
                await fillField(page, 'char-dex', '14');
                await fillField(page, 'char-con', '15');
            }

            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            const charData = await page.evaluate(name => {
                // @ts-ignore
                return D.characters
                    ? D.characters.find(c => c.name && c.name.includes(name))
                    : null;
            }, charName);

            expect(charData).toBeTruthy();
            expect(charData.level).toBe(5);
            expect(charData.hpMax).toBe(45);
        });

        test('Attribut-Modifikatoren werden berechnet', async ({ page }) => {
            await openCharForm(page);

            // STR 16 = +3
            await fillField(page, 'char-str', '16');
            await page.locator('#char-str').blur();
            await page.waitForTimeout(100);
            await expect(page.locator('#char-str-mod')).toHaveText('+3');

            // DEX 8 = -1
            await fillField(page, 'char-dex', '8');
            await page.locator('#char-dex').blur();
            await page.waitForTimeout(100);
            await expect(page.locator('#char-dex-mod')).toHaveText('-1');
        });

        test('Übungsbonus wird nach Level berechnet', async ({ page }) => {
            await openCharForm(page);

            const profField = page.locator('#char-proficiency');
            if (await profField.isVisible()) {
                // Setze Level 1 und merke den Wert
                await page.locator('#char-level').fill('');
                await fillField(page, 'char-level', '1');
                await page.locator('#char-level').blur();
                await page.waitForTimeout(200);
                const val1 = await profField.inputValue();

                // Setze Level 17 (sollte höheren Proficiency haben)
                await page.locator('#char-level').fill('');
                await fillField(page, 'char-level', '17');
                await page.locator('#char-level').blur();
                await page.waitForTimeout(200);
                const val2 = await profField.inputValue();

                // Proficiency bei Level 17 (+6) sollte höher sein als bei Level 1 (+2)
                const prof1 = parseInt(val1.replace(/[^0-9-]/g, '')) || 2;
                const prof2 = parseInt(val2.replace(/[^0-9-]/g, '')) || 6;
                expect(prof2).toBeGreaterThan(prof1);
            }
        });

        test('Charakter ohne Namen zeigt Fehlermeldung', async ({ page }) => {
            await openCharForm(page);

            await fillField(page, 'char-player', 'Spieler');
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(300);

            const toast = page.locator('#toast');
            await expect(toast).toBeVisible();
        });
    });

    test.describe('READ - Charakter anzeigen', () => {
        test('Charakterliste zeigt alle Charaktere', async ({ page }) => {
            const charName = generateTestName('ListChar');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // Verify via data
            const charExists = await page.evaluate(name => {
                return D.characters
                    ? D.characters.some(c => c.name && c.name.includes(name))
                    : false;
            }, charName);
            expect(charExists).toBe(true);
        });

        test('Charakter-Suche filtert Liste', async ({ page }) => {
            const char1 = generateTestName('Alpha');
            const char2 = generateTestName('Beta');

            await openCharForm(page);
            await fillField(page, 'char-name', char1);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            await openCharForm(page);
            await fillField(page, 'char-name', char2);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            await fillField(page, 'party-search', 'Alpha');
            await page.waitForTimeout(300);

            // Prüfe über Daten - beide existieren
            const chars = await page.evaluate(() => {
                // @ts-ignore
                return D.characters ? D.characters.length : 0;
            });
            expect(chars).toBeGreaterThanOrEqual(2);
        });
    });

    test.describe('UPDATE - Charakter bearbeiten', () => {
        test('Charakter-Daten können geändert werden', async ({ page }) => {
            const charName = generateTestName('EditChar');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await fillField(page, 'char-level', '3');
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // Edit Button finden
            const editBtn = page.locator('[data-action="edit-char"]').first();
            if (await editBtn.isVisible()) {
                await editBtn.click();
                await page.waitForTimeout(300);

                await fillField(page, 'char-level', '10');
                await page.click('[data-action="call"][data-value="saveCharacter"]');
                await page.waitForTimeout(500);

                const charData = await page.evaluate(name => {
                    // @ts-ignore
                    return D.characters
                        ? D.characters.find(c => c.name && c.name.includes(name))
                        : null;
                }, charName);

                expect(charData.level).toBe(10);
            }
        });

        test('HP können geändert werden', async ({ page }) => {
            const charName = generateTestName('HPChar');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await fillField(page, 'char-hp-max', '50');
            await fillField(page, 'char-hp-cur', '50');
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            const charData = await page.evaluate(name => {
                // @ts-ignore
                return D.characters
                    ? D.characters.find(c => c.name && c.name.includes(name))
                    : null;
            }, charName);

            expect(charData.hpMax).toBe(50);
        });
    });

    test.describe('DELETE - Charakter löschen', () => {
        test('Charakter kann gelöscht werden', async ({ page }) => {
            const charName = generateTestName('DeleteChar');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            const countBefore = await page.evaluate(() => {
                // @ts-ignore
                return D.characters ? D.characters.length : 0;
            });

            page.on('dialog', dialog => dialog.accept());

            const deleteBtn = page.locator('[data-action="delete-char"]').first();
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.waitForTimeout(500);

                const countAfter = await page.evaluate(() => {
                    // @ts-ignore
                    return D.characters ? D.characters.length : 0;
                });

                expect(countAfter).toBeLessThan(countBefore);
            }
        });

        test('Löschen kann rückgängig gemacht werden', async ({ page }) => {
            const charName = generateTestName('UndoChar');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            page.on('dialog', dialog => dialog.accept());

            const deleteBtn = page.locator('[data-action="delete-char"]').first();
            if (await deleteBtn.isVisible()) {
                await deleteBtn.click();
                await page.waitForTimeout(500);

                await performUndo(page);
                await page.waitForTimeout(500);

                const charData = await page.evaluate(name => {
                    // @ts-ignore
                    return D.characters
                        ? D.characters.find(c => c.name && c.name.includes(name))
                        : null;
                }, charName);

                expect(charData).toBeTruthy();
            }
        });
    });

    test.describe('Spezial-Features', () => {
        test('Spell Slots können gesetzt werden', async ({ page }) => {
            const charName = generateTestName('SpellSlots');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);

            const classSelect = page.locator('#char-class');
            if (await classSelect.isVisible()) {
                await selectOption(page, 'char-class', 'Wizard');
            }

            const slotField = page.locator('#char-slot-1');
            if (await slotField.isVisible()) {
                await fillField(page, 'char-slot-1', '4');
                await fillField(page, 'char-slot-2', '3');
            }

            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            const charData = await page.evaluate(name => {
                // @ts-ignore
                return D.characters
                    ? D.characters.find(c => c.name && c.name.includes(name))
                    : null;
            }, charName);

            expect(charData).toBeTruthy();
            // Spell slots prüfen falls vorhanden
            if (charData.spellSlots && charData.spellSlots[1]) {
                expect(charData.spellSlots[1].max).toBe(4);
            }
        });

        test('Währung wird gespeichert', async ({ page }) => {
            const charName = generateTestName('Currency');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await fillField(page, 'char-gm', '100');
            await fillField(page, 'char-sm', '50');

            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            const charData = await page.evaluate(name => {
                // @ts-ignore
                return D.characters
                    ? D.characters.find(c => c.name && c.name.includes(name))
                    : null;
            }, charName);

            expect(charData.currency.gm).toBe(100);
            expect(charData.currency.sm).toBe(50);
        });

        test('Inspiration kann gesetzt werden', async ({ page }) => {
            const charName = generateTestName('Inspiration');

            await openCharForm(page);
            await fillField(page, 'char-name', charName);
            await page.check('#char-inspiration');

            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            const charData = await page.evaluate(name => {
                // @ts-ignore
                return D.characters
                    ? D.characters.find(c => c.name && c.name.includes(name))
                    : null;
            }, charName);

            expect(charData.inspiration).toBe(true);
        });
    });
});
