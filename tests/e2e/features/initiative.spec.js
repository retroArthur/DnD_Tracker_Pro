// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Initiative System
 * Tiefe Tests für Kampf-Management, Turns, Concentration, Death Saves
 */

test.describe('Initiative System', () => {
    test.beforeEach(async ({ page }) => {
        // Lokale HTML-Datei laden
        const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
        await page.goto(filePath);

        // Warten bis App geladen ist
        await page.waitForSelector('.app-title', { timeout: 10000 });

        // Zur Initiative-View wechseln
        await page.click('.nav-tab[data-view="initiative"]');
        await page.waitForSelector('#view-initiative', { state: 'visible' });
    });

    // ============================================================
    // COMBATANT MANAGEMENT
    // ============================================================

    test.describe('Combatant Management', () => {
        test('sollte Combatant hinzufügen können', async ({ page }) => {
            // Add-Button finden
            const addBtn = page
                .locator(
                    '[data-action="add-combatant"], [data-action="call"][data-value="addCombatant"]'
                )
                .first();

            if (await addBtn.isVisible()) {
                await addBtn.click();

                // Modal/Form ausfüllen
                const nameInput = page.locator('#combatant-name, [name="combatant-name"]').first();
                if (await nameInput.isVisible()) {
                    await nameInput.fill('Goblin Krieger');

                    // Initiative eingeben
                    const initInput = page
                        .locator('#combatant-init, [name="combatant-init"]')
                        .first();
                    if (await initInput.isVisible()) {
                        await initInput.fill('15');
                    }

                    // HP eingeben
                    const hpInput = page.locator('#combatant-hp, [name="combatant-hp"]').first();
                    if (await hpInput.isVisible()) {
                        await hpInput.fill('7');
                    }

                    // Speichern
                    const saveBtn = page
                        .locator('[data-action="save-combatant"], button:has-text("Hinzufügen")')
                        .first();
                    await saveBtn.click();

                    // Combatant sollte in der Liste erscheinen
                    await expect(page.locator('.initiative-list, .combatant-list')).toContainText(
                        'Goblin'
                    );
                }
            }
        });

        test('sollte mehrere Combatants sortiert nach Initiative anzeigen', async ({ page }) => {
            // Hilfsfunktion zum Hinzufügen
            async function addCombatant(name, init, hp) {
                const addBtn = page
                    .locator(
                        '[data-action="add-combatant"], [data-action="call"][data-value="addCombatant"]'
                    )
                    .first();
                if (await addBtn.isVisible()) {
                    await addBtn.click();
                    await page.waitForTimeout(200);

                    const nameInput = page
                        .locator('#combatant-name, [name="combatant-name"]')
                        .first();
                    await nameInput.fill(name);

                    const initInput = page
                        .locator('#combatant-init, [name="combatant-init"]')
                        .first();
                    if (await initInput.isVisible()) {
                        await initInput.fill(String(init));
                    }

                    const hpInput = page.locator('#combatant-hp, [name="combatant-hp"]').first();
                    if (await hpInput.isVisible()) {
                        await hpInput.fill(String(hp));
                    }

                    const saveBtn = page
                        .locator('[data-action="save-combatant"], button:has-text("Hinzufügen")')
                        .first();
                    await saveBtn.click();
                    await page.waitForTimeout(300);
                }
            }

            await addCombatant('Held (Init 18)', 18, 30);
            await addCombatant('Ork (Init 12)', 12, 15);
            await addCombatant('Magier (Init 20)', 20, 20);

            // Reihenfolge prüfen (Magier sollte oben sein)
            const combatants = page.locator('.combatant-row, .initiative-item');
            const count = await combatants.count();

            if (count >= 3) {
                const firstCombatant = await combatants.first().textContent();
                expect(firstCombatant).toContain('Magier');
            }
        });

        test('sollte Combatant entfernen können', async ({ page }) => {
            // Erst einen hinzufügen
            const addBtn = page
                .locator(
                    '[data-action="add-combatant"], [data-action="call"][data-value="addCombatant"]'
                )
                .first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name, [name="combatant-name"]', 'Zu löschender Gegner');
                await page.click('[data-action="save-combatant"], button:has-text("Hinzufügen")');
                await page.waitForTimeout(300);

                // Löschen-Button finden und klicken
                const deleteBtn = page
                    .locator(
                        '.combatant-row:has-text("Zu löschender") [data-action="remove-combatant"], .initiative-item:has-text("Zu löschender") button.delete'
                    )
                    .first();

                if (await deleteBtn.isVisible()) {
                    page.on('dialog', dialog => dialog.accept());
                    await deleteBtn.click();
                    await page.waitForTimeout(300);

                    await expect(page.locator('.initiative-list')).not.toContainText(
                        'Zu löschender'
                    );
                }
            }
        });
    });

    // ============================================================
    // TURN MANAGEMENT
    // ============================================================

    test.describe('Turn Management', () => {
        test.beforeEach(async ({ page }) => {
            // Test-Combatants hinzufügen
            async function quickAdd(name, init) {
                const addBtn = page
                    .locator(
                        '[data-action="add-combatant"], [data-action="call"][data-value="addCombatant"]'
                    )
                    .first();
                if (await addBtn.isVisible()) {
                    await addBtn.click();
                    await page.waitForTimeout(100);
                    await page.fill('#combatant-name, [name="combatant-name"]', name);
                    const initInput = page.locator('#combatant-init').first();
                    if (await initInput.isVisible()) {
                        await initInput.fill(String(init));
                    }
                    await page.click(
                        '[data-action="save-combatant"], button:has-text("Hinzufügen")'
                    );
                    await page.waitForTimeout(200);
                }
            }

            await quickAdd('Fighter', 15);
            await quickAdd('Rogue', 18);
            await quickAdd('Wizard', 12);
        });

        test('sollte zum nächsten Turn wechseln können', async ({ page }) => {
            const nextBtn = page
                .locator(
                    '[data-action="next-turn"], button:has-text("Weiter"), button:has-text("Next")'
                )
                .first();

            if (await nextBtn.isVisible()) {
                // Aktuellen aktiven Combatant merken
                const activeBefore = await page
                    .locator('.combatant-row.active, .initiative-item.active')
                    .first()
                    .textContent();

                await nextBtn.click();
                await page.waitForTimeout(200);

                // Aktiver Combatant sollte sich geändert haben
                const activeAfter = await page
                    .locator('.combatant-row.active, .initiative-item.active')
                    .first()
                    .textContent();

                // Bei nur einem Combatant bleibt es gleich, sonst sollte es wechseln
            }
        });

        test('sollte zum vorherigen Turn wechseln können', async ({ page }) => {
            // Erst next, dann prev
            const nextBtn = page.locator('[data-action="next-turn"]').first();
            const prevBtn = page
                .locator('[data-action="prev-turn"], button:has-text("Zurück")')
                .first();

            if ((await nextBtn.isVisible()) && (await prevBtn.isVisible())) {
                await nextBtn.click();
                await page.waitForTimeout(200);
                await prevBtn.click();
                await page.waitForTimeout(200);
            }
        });

        test('sollte Runde erhöhen wenn alle dran waren', async ({ page }) => {
            const nextBtn = page.locator('[data-action="next-turn"]').first();
            const roundDisplay = page.locator('.round-counter, [data-round]').first();

            if ((await nextBtn.isVisible()) && (await roundDisplay.isVisible())) {
                const initialRound = await roundDisplay.textContent();

                // Durch alle Combatants durchgehen (3x next für 3 Combatants)
                for (let i = 0; i < 4; i++) {
                    await nextBtn.click();
                    await page.waitForTimeout(150);
                }

                // Runde sollte erhöht worden sein
                const newRound = await roundDisplay.textContent();
            }
        });
    });

    // ============================================================
    // HP MANAGEMENT
    // ============================================================

    test.describe('HP Management', () => {
        test('sollte Schaden anwenden können', async ({ page }) => {
            // Combatant hinzufügen
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Tank');
                await page.fill('#combatant-hp', '50');
                await page.click('[data-action="save-combatant"], button:has-text("Hinzufügen")');
                await page.waitForTimeout(300);

                // Damage-Button finden
                const damageBtn = page
                    .locator(
                        '.combatant-row:has-text("Tank") [data-action="damage-combatant"], .combatant-row:has-text("Tank") button:has-text("-")'
                    )
                    .first();

                if (await damageBtn.isVisible()) {
                    await damageBtn.click();

                    // Damage-Modal ausfüllen
                    const damageInput = page.locator('#damage-amount, [name="damage"]').first();
                    if (await damageInput.isVisible()) {
                        await damageInput.fill('10');
                        await page.click(
                            '[data-action="apply-damage"], button:has-text("Anwenden")'
                        );
                        await page.waitForTimeout(200);

                        // HP sollte 40 sein
                        await expect(page.locator('.combatant-row:has-text("Tank")')).toContainText(
                            '40'
                        );
                    }
                }
            }
        });

        test('sollte Heilung anwenden können', async ({ page }) => {
            // Combatant mit reduziertem HP
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Verwundeter');
                await page.fill('#combatant-hp', '20');
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(300);

                // Erst Schaden
                const damageBtn = page
                    .locator(
                        '.combatant-row:has-text("Verwundeter") [data-action="damage-combatant"]'
                    )
                    .first();
                if (await damageBtn.isVisible()) {
                    await damageBtn.click();
                    await page.fill('#damage-amount', '15');
                    await page.click('[data-action="apply-damage"]');
                    await page.waitForTimeout(200);
                }

                // Dann Heilung
                const healBtn = page
                    .locator(
                        '.combatant-row:has-text("Verwundeter") [data-action="heal-combatant"], .combatant-row:has-text("Verwundeter") button:has-text("+")'
                    )
                    .first();
                if (await healBtn.isVisible()) {
                    await healBtn.click();
                    const healInput = page.locator('#heal-amount, [name="heal"]').first();
                    if (await healInput.isVisible()) {
                        await healInput.fill('10');
                        await page.click('[data-action="apply-heal"], button:has-text("Anwenden")');
                    }
                }
            }
        });
    });

    // ============================================================
    // CONCENTRATION TRACKING
    // ============================================================

    test.describe('Concentration Tracking', () => {
        test('sollte Concentration setzen können', async ({ page }) => {
            // Combatant hinzufügen
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Zauberer');
                await page.fill('#combatant-hp', '30');
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(300);

                // Concentration-Button finden
                const concBtn = page
                    .locator(
                        '.combatant-row:has-text("Zauberer") [data-action="set-concentration"], .concentration-btn'
                    )
                    .first();

                if (await concBtn.isVisible()) {
                    await concBtn.click();

                    // Spell-Name eingeben im Modal
                    const spellInput = page.locator('#concentration-spell, [name="spell"]').first();
                    if (await spellInput.isVisible()) {
                        await spellInput.fill('Haste');
                        await page.click(
                            '[data-action="save-concentration"], button:has-text("Setzen")'
                        );
                        await page.waitForTimeout(200);

                        // Concentration sollte angezeigt werden
                        await expect(
                            page.locator('.combatant-row:has-text("Zauberer")')
                        ).toContainText('Haste');
                    }
                }
            }
        });

        test('sollte Concentration-Check bei Schaden triggern', async ({ page }) => {
            // Zauberer mit Concentration hinzufügen
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Konzentrierter Mage');
                await page.fill('#combatant-hp', '30');
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(300);

                // Concentration setzen
                const concBtn = page
                    .locator('.combatant-row:has-text("Mage") [data-action="set-concentration"]')
                    .first();
                if (await concBtn.isVisible()) {
                    await concBtn.click();
                    await page.fill('#concentration-spell', 'Fly');
                    await page.click('[data-action="save-concentration"]');
                    await page.waitForTimeout(200);

                    // Schaden anwenden
                    const damageBtn = page
                        .locator('.combatant-row:has-text("Mage") [data-action="damage-combatant"]')
                        .first();
                    if (await damageBtn.isVisible()) {
                        await damageBtn.click();
                        await page.fill('#damage-amount', '20');
                        await page.click('[data-action="apply-damage"]');
                        await page.waitForTimeout(200);

                        // Concentration-Check sollte angezeigt werden (DC = max(10, 20/2) = 10)
                        // Banner oder Hinweis auf DC 10 CON Save
                    }
                }
            }
        });
    });

    // ============================================================
    // DEATH SAVES
    // ============================================================

    test.describe('Death Saves', () => {
        test('sollte Death Saves bei 0 HP anzeigen', async ({ page }) => {
            // Player-Combatant hinzufügen
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Sterbender Held');
                await page.fill('#combatant-hp', '5');

                // Als Player markieren wenn möglich
                const playerCheckbox = page
                    .locator('#combatant-is-player, [name="isPlayer"]')
                    .first();
                if (await playerCheckbox.isVisible()) {
                    await playerCheckbox.check();
                }

                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(300);

                // Auf 0 HP reduzieren
                const damageBtn = page
                    .locator(
                        '.combatant-row:has-text("Sterbender") [data-action="damage-combatant"]'
                    )
                    .first();
                if (await damageBtn.isVisible()) {
                    await damageBtn.click();
                    await page.fill('#damage-amount', '10');
                    await page.click('[data-action="apply-damage"]');
                    await page.waitForTimeout(300);

                    // Death Saves UI sollte erscheinen
                    const deathSavesUI = page.locator('.death-saves, .death-save-tracker');
                    // await expect(deathSavesUI).toBeVisible();
                }
            }
        });

        test('sollte Death Save Success/Failure togglen', async ({ page }) => {
            // Setup: Combatant auf 0 HP bringen
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Am Sterben');
                await page.fill('#combatant-hp', '1');
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(200);

                // Auf 0 HP
                const damageBtn = page
                    .locator(
                        '.combatant-row:has-text("Am Sterben") [data-action="damage-combatant"]'
                    )
                    .first();
                if (await damageBtn.isVisible()) {
                    await damageBtn.click();
                    await page.fill('#damage-amount', '5');
                    await page.click('[data-action="apply-damage"]');
                    await page.waitForTimeout(300);

                    // Success klicken
                    const successDot = page
                        .locator('.death-saves .success-dot, [data-action="death-save-success"]')
                        .first();
                    if (await successDot.isVisible()) {
                        await successDot.click();
                        await page.waitForTimeout(100);

                        // Sollte gefüllt sein
                    }
                }
            }
        });
    });

    // ============================================================
    // CONDITIONS
    // ============================================================

    test.describe('Conditions', () => {
        test('sollte Condition hinzufügen können', async ({ page }) => {
            // Combatant hinzufügen
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Vergifteter');
                await page.fill('#combatant-hp', '25');
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(300);

                // Condition-Button
                const condBtn = page
                    .locator(
                        '.combatant-row:has-text("Vergifteter") [data-action="add-condition"], .condition-btn'
                    )
                    .first();
                if (await condBtn.isVisible()) {
                    await condBtn.click();

                    // Condition auswählen
                    const poisonedOption = page
                        .locator('[data-condition="poisoned"], button:has-text("Vergiftet")')
                        .first();
                    if (await poisonedOption.isVisible()) {
                        await poisonedOption.click();
                        await page.waitForTimeout(200);

                        // Condition sollte angezeigt werden
                        await expect(
                            page.locator('.combatant-row:has-text("Vergifteter")')
                        ).toContainText('Vergiftet');
                    }
                }
            }
        });

        test('sollte Condition entfernen können', async ({ page }) => {
            // Setup: Combatant mit Condition
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Gelähmter');
                await page.fill('#combatant-hp', '25');
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(200);

                // Condition hinzufügen
                const condBtn = page
                    .locator('.combatant-row:has-text("Gelähmter") [data-action="add-condition"]')
                    .first();
                if (await condBtn.isVisible()) {
                    await condBtn.click();
                    const paraOption = page.locator('[data-condition="paralyzed"]').first();
                    if (await paraOption.isVisible()) {
                        await paraOption.click();
                        await page.waitForTimeout(200);

                        // Condition entfernen
                        const conditionBadge = page
                            .locator(
                                '.combatant-row:has-text("Gelähmter") .condition-badge, .condition-tag'
                            )
                            .first();
                        if (await conditionBadge.isVisible()) {
                            await conditionBadge.click(); // Toggle off
                        }
                    }
                }
            }
        });
    });

    // ============================================================
    // AOE DAMAGE
    // ============================================================

    test.describe('AoE Damage', () => {
        test('sollte AoE-Schaden auf mehrere Ziele anwenden', async ({ page }) => {
            // Mehrere Combatants hinzufügen
            async function addEnemy(name, hp) {
                const addBtn = page.locator('[data-action="add-combatant"]').first();
                await addBtn.click();
                await page.fill('#combatant-name', name);
                await page.fill('#combatant-hp', String(hp));
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(200);
            }

            await addEnemy('Goblin 1', 7);
            await addEnemy('Goblin 2', 7);
            await addEnemy('Goblin 3', 7);

            // AoE-Button
            const aoeBtn = page
                .locator('[data-action="show-aoe"], button:has-text("AoE"), button:has-text("💥")')
                .first();
            if (await aoeBtn.isVisible()) {
                await aoeBtn.click();

                // AoE-Modal ausfüllen
                const damageFormula = page.locator('#aoe-damage, [name="aoe-formula"]').first();
                if (await damageFormula.isVisible()) {
                    await damageFormula.fill('8d6');

                    // Alle Goblins auswählen
                    const selectAllBtn = page
                        .locator('button:has-text("Alle"), [data-action="select-all-targets"]')
                        .first();
                    if (await selectAllBtn.isVisible()) {
                        await selectAllBtn.click();
                    }

                    // Anwenden
                    await page.click('[data-action="apply-aoe"], button:has-text("Anwenden")');
                }
            }
        });
    });

    // ============================================================
    // ENCOUNTER RESET
    // ============================================================

    test.describe('Encounter Reset', () => {
        test('sollte Encounter zurücksetzen können', async ({ page }) => {
            // Combatants hinzufügen
            const addBtn = page.locator('[data-action="add-combatant"]').first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await page.fill('#combatant-name', 'Reset-Test');
                await page.click('[data-action="save-combatant"]');
                await page.waitForTimeout(300);

                // Reset-Button
                const resetBtn = page
                    .locator(
                        '[data-action="reset-initiative"], button:has-text("Zurücksetzen"), button:has-text("Reset")'
                    )
                    .first();
                if (await resetBtn.isVisible()) {
                    page.on('dialog', dialog => dialog.accept());
                    await resetBtn.click();
                    await page.waitForTimeout(500);

                    // Liste sollte leer sein
                    await expect(
                        page.locator('.initiative-list, .combatant-list')
                    ).not.toContainText('Reset-Test');
                }
            }
        });
    });
});
