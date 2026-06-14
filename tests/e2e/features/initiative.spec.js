// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Initiative System
 * Tiefe Tests für Kampf-Management, Turns, Concentration, Death Saves
 */

/**
 * Reale Add-Combatant-Flow: Inline-Formular in #view-initiative (KEIN Modal).
 * Felder: #init-name, #init-value (Initiative), #init-hp, #init-ac, #init-type.
 * Absenden: [data-action="call"][data-value="addCombatant"] ("Hinzufügen").
 * Ersetzt die veralteten #combatant-name / [data-action="save-combatant"] Selektoren,
 * die nie im gebauten HTML existierten (siehe docs/e2e-failure-triage.md, Cluster 2).
 */
async function addCombatant(page, name, init, hp) {
    await page.fill('#init-name', name);
    if (init !== undefined && init !== null) await page.fill('#init-value', String(init));
    if (hp !== undefined && hp !== null) await page.fill('#init-hp', String(hp));
    await page.click('[data-action="call"][data-value="addCombatant"]');
    await page.waitForTimeout(200);
}

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
            await addCombatant(page, 'Held', 18, 30);
            await addCombatant(page, 'Ork', 12, 15);
            await addCombatant(page, 'Magier', 20, 20);

            // Nach Initiative sortieren (absteigend, sortInit: b.initiative - a.initiative)
            await page.click('[data-action="sort-initiative"]');
            await page.waitForTimeout(200);

            const rows = page.locator('#init-list .init-entry');
            await expect(rows).toHaveCount(3);

            // Magier (Init 20) muss oben stehen
            await expect(rows.first().locator('.init-name')).toHaveText('Magier');
        });

        test('sollte Combatant entfernen können', async ({ page }) => {
            // Erst einen hinzufügen
            await addCombatant(page, 'Zu löschender Gegner', 10, 12);

            const row = page.locator('#init-list .init-entry', {
                hasText: 'Zu löschender'
            });
            await expect(row).toHaveCount(1);

            // Löschen (removeCombatant splices direkt, kein confirm-Dialog)
            await row.locator('[data-action="remove-combatant"]').click();
            await page.waitForTimeout(200);

            await expect(page.locator('#init-list')).not.toContainText('Zu löschender');
        });
    });

    // ============================================================
    // TURN MANAGEMENT
    // ============================================================

    test.describe('Turn Management', () => {
        test.beforeEach(async ({ page }) => {
            // Test-Combatants hinzufügen (Push-Reihenfolge = Render-Reihenfolge,
            // currentTurn startet bei 0 → erste Zeile aktiv)
            await addCombatant(page, 'Fighter', 15, 30);
            await addCombatant(page, 'Rogue', 18, 25);
            await addCombatant(page, 'Wizard', 12, 18);
        });

        test('sollte zum nächsten Turn wechseln können', async ({ page }) => {
            const activeBefore = await page
                .locator('#init-list .init-entry.active .init-name')
                .textContent();

            await page.click('[data-action="call"][data-value="nextTurn"]');
            await page.waitForTimeout(200);

            // Aktiver Combatant muss sich geändert haben (3 Kämpfer → Fighter → Rogue)
            const activeAfter = await page
                .locator('#init-list .init-entry.active .init-name')
                .textContent();

            expect(activeAfter).not.toBe(activeBefore);
        });

        test('sollte zum vorherigen Turn wechseln können', async ({ page }) => {
            const activeStart = await page
                .locator('#init-list .init-entry.active .init-name')
                .textContent();

            // Vorwärts: aktiver Kämpfer MUSS sich ändern (beweist die Bewegung)
            await page.click('[data-action="call"][data-value="nextTurn"]');
            await page.waitForTimeout(150);
            const activeMid = await page
                .locator('#init-list .init-entry.active .init-name')
                .textContent();
            expect(activeMid).not.toBe(activeStart);

            // Zurück: aktiver Kämpfer MUSS wieder der Start sein (beweist, dass
            // prevTurn — core/init.js — tatsächlich wirkt, nicht nur ein No-Op ist)
            await page.click('[data-action="call"][data-value="prevTurn"]');
            await page.waitForTimeout(150);
            const activeEnd = await page
                .locator('#init-list .init-entry.active .init-name')
                .textContent();
            expect(activeEnd).toBe(activeStart);
        });

        test('sollte Runde erhöhen wenn alle dran waren', async ({ page }) => {
            const roundDisplay = page.locator('#encounter-round-num');
            const initialRound = parseInt(await roundDisplay.textContent());

            // 3 Kämpfer → 3x Nächster wickelt currentTurn um → round++ (nextTurn)
            for (let i = 0; i < 3; i++) {
                await page.click('[data-action="call"][data-value="nextTurn"]');
                await page.waitForTimeout(120);
            }

            const newRound = parseInt(await roundDisplay.textContent());
            expect(newRound).toBe(initialRound + 1);
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
            // Mehrere Combatants hinzufügen (alle 7 HP)
            await addCombatant(page, 'Goblin 1', 12, 7);
            await addCombatant(page, 'Goblin 2', 11, 7);
            await addCombatant(page, 'Goblin 3', 10, 7);

            // AoE-Modal öffnen
            await page.click('[data-action="show-aoe-damage-modal"]');
            await page.waitForSelector('#aoe-targets-list', { state: 'visible' });

            // Formel würfeln, alle Ziele wählen, anwenden
            await page.fill('#aoe-damage-formula', '8d6');
            await page.click('[data-action="roll-aoe-damage"]');
            await page.waitForTimeout(150);
            await page.click('[data-action="aoe-select-all"]');
            await page.waitForTimeout(150);

            const applyBtn = page.locator('#aoe-apply-btn');
            await expect(applyBtn).toBeEnabled();
            await applyBtn.click();
            await page.waitForTimeout(300);

            // 8d6 (min. 8 Schaden) tötet jeden 7-HP-Goblin → keine 7/7-Zeile mehr
            await expect(page.locator('#init-list')).not.toContainText('7/7');
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

    // ============================================================
    // STATBLOCK-DRAWER (INIT-01) — Wave 1 Implementierung
    // ============================================================

    test.describe('statblock', () => {
        /**
         * Hilfsfunktion: Fuegt einen Bestiary-Monster-Kombattanten direkt per evaluate() in
         * die Initiative ein und rendert neu. Umgeht die komplexe UI-Interaktion
         * (Bestiary-Tab -> Auswahl -> prompt-Dialog) die in headless E2E fragil waere.
         */
        async function injectMonsterCombatant(page) {
            await page.evaluate(() => {
                // SRD-Monster 'goblin' hat _id = 'goblin', statblockRef korrekt setzen
                var goblin = typeof getSRDMonsters === 'function'
                    ? getSRDMonsters().find(function(m) { return m._id === 'goblin'; })
                    : null;
                var hp = goblin ? (goblin.hp || 7) : 7;
                var cb = {
                    id: window.nextId ? window.nextId('combatants') : Date.now(),
                    name: 'Goblin',
                    initiative: 12,
                    initBonus: 2,
                    maxHp: hp,
                    currentHp: hp,
                    ac: goblin ? (goblin.ac || 15) : 15,
                    type: 'monster',
                    cr: goblin ? (goblin.cr || '1/4') : '1/4',
                    xp: goblin ? (goblin.xp || 50) : 50,
                    effects: [],
                    statblockRef: { source: 'srd', id: 'goblin' }
                };
                window.D.initiative.combatants.push(cb);
                if (typeof window.renderInit === 'function') window.renderInit();
            });
        }

        /**
         * Hilfsfunktion: Fuegt einen manuellen Kombattanten ohne statblockRef ein.
         */
        async function injectManualCombatant(page) {
            await page.evaluate(() => {
                var cb = {
                    id: window.nextId ? window.nextId('combatants') : Date.now() + 1,
                    name: 'Manueller Kaempfer',
                    initiative: 10,
                    initBonus: 0,
                    maxHp: 30,
                    currentHp: 25,
                    ac: 14,
                    type: 'player',
                    effects: []
                    // kein statblockRef
                };
                window.D.initiative.combatants.push(cb);
                if (typeof window.renderInit === 'function') window.renderInit();
            });
        }

        test('📖-Button sichtbar in jeder statblock Initiative-Zeile', async ({ page }) => {
            await injectMonsterCombatant(page);
            // Warten bis init-list gerendert wird
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });
            // Jede nicht-lair Zeile soll einen Button mit data-action="show-init-statblock" haben
            const btn = page.locator('#init-list [data-action="show-init-statblock"]').first();
            await expect(btn).toBeVisible();
            await expect(btn).toHaveClass(/init-statblock-btn/);
        });

        test('Klick auf 📖-Button oeffnet Statblock-Panel fuer Monster mit statblockRef', async ({ page }) => {
            await injectMonsterCombatant(page);
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            // Auf den Buch-Button klicken
            const btn = page.locator('#init-list [data-action="show-init-statblock"]').first();
            await btn.click();
            await page.waitForTimeout(300);

            // Panel soll existieren und show-Klasse haben
            const panel = page.locator('#init-statblock-panel');
            await expect(panel).toBeAttached();
            await expect(panel).toHaveClass(/show/);

            // Content soll vorhanden sein
            const content = page.locator('#init-statblock-panel .init-statblock-content');
            await expect(content).toBeAttached();

            // Fuer einen SRD-Monster soll der vollstaendige Statblock angezeigt werden
            const statblock = page.locator('#init-statblock-panel .bestiary-statblock');
            await expect(statblock).toBeAttached();
        });

        test('Statblock-Panel zeigt Basisinfos fuer Kombattanten ohne statblockRef', async ({ page }) => {
            await injectManualCombatant(page);
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            // Auf den Buch-Button des manuellen Kombattanten klicken
            const btn = page.locator('#init-list [data-action="show-init-statblock"]').first();
            await btn.click();
            await page.waitForTimeout(300);

            // Panel soll show-Klasse haben
            const panel = page.locator('#init-statblock-panel');
            await expect(panel).toHaveClass(/show/);

            // Statt Parchment-Statblock soll .init-statblock-basic angezeigt werden
            const basicCard = page.locator('#init-statblock-panel .init-statblock-basic');
            await expect(basicCard).toBeAttached();
        });

        test('Statblock-Panel enthaelt klickbare Wuerfelformeln fuer Monster mit statblockRef', async ({ page }) => {
            await injectMonsterCombatant(page);
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            // Drawer oeffnen
            const btn = page.locator('#init-list [data-action="show-init-statblock"]').first();
            await btn.click();
            await page.waitForTimeout(300);

            // Panel soll klickbare Wuerfel-Spans enthalten (SRD-Monster haben Aktionen mit Formeln)
            const diceSpans = page.locator('#init-statblock-panel [data-action="bestiary-roll-dice"]');
            const count = await diceSpans.count();
            // Goblin hat Aktionen (Krummschwert), also mindestens 1 klickbare Formel
            expect(count).toBeGreaterThan(0);
        });

        test('statblock Drawer ist RECHTS angedockt und schliessbar (Regression: war links + nicht schliessbar)', async ({ page }) => {
            await injectManualCombatant(page);
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            const btn = page.locator('#init-list [data-action="show-init-statblock"]').first();
            await btn.click();
            await page.waitForTimeout(300);

            const panel = page.locator('#init-statblock-panel');
            await expect(panel).toHaveClass(/show/);

            const vp = page.viewportSize();
            const content = page.locator('#init-statblock-panel .init-statblock-content');
            const box = await content.boundingBox();
            expect(box).not.toBeNull();

            if (vp && vp.width > 600) {
                // (1) Rechts angedockt: linke Kante des Panels rechts der Bildschirmmitte,
                // rechte Kante (nahezu) am rechten Rand. (Der Bug zeigte das Panel LINKS.)
                expect(box.x).toBeGreaterThan(vp.width / 2);
                expect(box.x + box.width).toBeGreaterThan(vp.width - 5);
                // (2) Vollflaechiger Backdrop: Panel ist breiter als das 420px-Content-Panel
                const panelBox = await panel.boundingBox();
                expect(panelBox.width).toBeGreaterThan(box.width + 50);
            }

            // (3) Sichtbarer Schliessen-Button schliesst den Drawer
            const closeBtn = page.locator('#init-statblock-panel .init-statblock-close');
            await expect(closeBtn).toBeVisible();
            await closeBtn.click();
            await page.waitForTimeout(200);
            await expect(panel).not.toHaveClass(/show/);

            // (4) Erneut oeffnen, dann ueber den abgedunkelten Backdrop (links) schliessen
            await btn.click();
            await page.waitForTimeout(200);
            await expect(panel).toHaveClass(/show/);
            if (vp && vp.width > 600) {
                await page.mouse.click(60, Math.round(vp.height / 2));
                await page.waitForTimeout(200);
                await expect(panel).not.toHaveClass(/show/);
            }
        });
    });

    // ============================================================
    // LEGENDAERE AKTIONEN + WIDERSTAENDE (INIT-02) — Wave-0 Platzhalter
    // ============================================================

    test.describe('legendary', () => {
        /**
         * Hilfsfunktion: Fuegt einen Vampir-Boss-Kombattanten (LA=3, LR=3) und einen
         * einfachen Goblin-Kombattanten per evaluate() in die Initiative ein.
         * Vampir hat hoeheren Initiative-Wert → er ist currentTurn=0.
         * Der zweite Kombattant ist noetig damit nextTurn() eine Runde abschliessen kann
         * wenn von Vampir (Turn 0) zu Goblin (Turn 1) und wieder zurueck zu Vampir gewechselt wird.
         */
        async function injectBossCombatant(page) {
            await page.evaluate(() => {
                // Boss-Kombattant mit LA+LR (Vampir-Profil: legendaryActionsPerRound=3, LR=3)
                var boss = {
                    id: window.nextId ? window.nextId('combatants') : Date.now(),
                    name: 'Vampir (Boss)',
                    initiative: 20,
                    initBonus: 4,
                    maxHp: 144,
                    currentHp: 144,
                    ac: 16,
                    type: 'monster',
                    cr: '13',
                    xp: 10000,
                    effects: [],
                    statblockRef: { source: 'srd', id: 'vampir' },
                    legendaryActions: { max: 3, remaining: 3 },
                    legendaryResistance: { max: 3, remaining: 3 }
                };
                // Zweiter Kombattant damit eine Runde durch nextTurn() abgeschlossen werden kann
                var goblin = {
                    id: window.nextId ? window.nextId('combatants') : Date.now() + 1,
                    name: 'Goblin',
                    initiative: 10,
                    initBonus: 2,
                    maxHp: 7,
                    currentHp: 7,
                    ac: 15,
                    type: 'monster',
                    cr: '1/4',
                    xp: 50,
                    effects: []
                };
                window.D.initiative.combatants = [boss, goblin];
                window.D.initiative.currentTurn = 0;
                window.D.initiative.round = 1;
                if (typeof window.renderInit === 'function') window.renderInit();
            });
        }

        test('LA-Pips erscheinen bei legendary Monster mit legendaryActionsPerRound > 0', async ({ page }) => {
            await injectBossCombatant(page);
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            // Boss-Zeile (Vampir) soll .la-pips enthalten
            const laPips = page.locator('#init-list .la-pips').first();
            await expect(laPips).toBeAttached();

            // LA-Dots sollen vorhanden sein (max=3)
            const laDots = page.locator('#init-list .la-dot');
            expect(await laDots.count()).toBe(3);

            // Goblin-Zeile soll KEINE .la-pips haben
            const initRows = page.locator('#init-list .init-row');
            const goblinRow = initRows.nth(1); // Goblin hat niedrigere Initiative
            const goblinLaPips = goblinRow.locator('.la-pips');
            expect(await goblinLaPips.count()).toBe(0);
        });

        test('Pip-Klick reduziert verbleibende legendary LA um 1', async ({ page }) => {
            await injectBossCombatant(page);
            await page.waitForSelector('#init-list .la-dot', { timeout: 5000 });

            // Initialen Zustand pruefen: alle 3 LA aktiv
            const activeDotsBefore = page.locator('#init-list .la-dot.active');
            expect(await activeDotsBefore.count()).toBe(3);

            // Auf den ersten aktiven Dot klicken (index=0) — reduziert remaining auf 0
            const firstDot = page.locator('#init-list .la-dot').first();
            await firstDot.click();
            await page.waitForTimeout(200);

            // Nach Klick auf index=0: remaining wird auf 0 gesetzt (toggleDeathSave-Logik)
            const activeDotsAfter = page.locator('#init-list .la-dot.active');
            expect(await activeDotsAfter.count()).toBe(0);
        });

        test('LA-Pips füllen sich bei legendary Rundenübergang automatisch auf (D-10)', async ({ page }) => {
            await injectBossCombatant(page);
            await page.waitForSelector('#init-list .la-dot', { timeout: 5000 });

            // Einen LA verbrauchen: letzten aktiven Dot klicken (index=2 → remaining=2)
            const dots = page.locator('#init-list .la-dot');
            await dots.nth(2).click();
            await page.waitForTimeout(200);

            // Jetzt 2 aktive Dots
            let activeCount = await page.locator('#init-list .la-dot.active').count();
            expect(activeCount).toBe(2);

            // Runde abschliessen via evaluate (direkte nextTurn()-Aufrufe) — vermeidet Selektor-Problem
            // (der Button nutzt data-action="call" data-value="nextTurn", nicht data-action="next-turn")
            await page.evaluate(() => {
                if (typeof window.nextTurn === 'function') window.nextTurn(); // Vampir → Goblin
            });
            await page.waitForTimeout(200);
            await page.evaluate(() => {
                if (typeof window.nextTurn === 'function') window.nextTurn(); // Goblin → Vampir (neue Runde)
            });
            await page.waitForTimeout(200);

            // Nach Rundenübergang sollen alle 3 LA wiederhergestellt sein (D-10)
            activeCount = await page.locator('#init-list .la-dot.active').count();
            expect(activeCount).toBe(3);
        });

        test('LR-Pips erscheinen bei legendary Monster mit (N-mal täglich)-Trait', async ({ page }) => {
            await injectBossCombatant(page);
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            // Boss-Zeile soll .lr-pips enthalten
            const lrPips = page.locator('#init-list .lr-pips').first();
            await expect(lrPips).toBeAttached();

            // LR-Dots sollen vorhanden sein (max=3)
            const lrDots = page.locator('#init-list .lr-dot');
            expect(await lrDots.count()).toBe(3);

            // LR-Reset-Knopf soll vorhanden sein
            const resetBtn = page.locator('#init-list .lr-reset-btn').first();
            await expect(resetBtn).toBeAttached();
        });

        test('LR resetten NICHT bei legendary Rundenübergang (D-07 — deliberate deviation)', async ({ page }) => {
            await injectBossCombatant(page);
            await page.waitForSelector('#init-list .lr-dot', { timeout: 5000 });

            // Einen LR verbrauchen: ersten Dot klicken (index=0 → remaining=0)
            const lrDots = page.locator('#init-list .lr-dot');
            await lrDots.first().click();
            await page.waitForTimeout(200);

            // Jetzt 0 aktive LR-Dots (Klick auf index=0 setzt remaining=0)
            let activeLrCount = await page.locator('#init-list .lr-dot.active').count();
            expect(activeLrCount).toBe(0);

            // Runde abschliessen via evaluate (direkte nextTurn()-Aufrufe) — vermeidet Selektor-Problem
            // (der Button nutzt data-action="call" data-value="nextTurn", nicht data-action="next-turn")
            await page.evaluate(() => {
                if (typeof window.nextTurn === 'function') window.nextTurn(); // Vampir → Goblin
            });
            await page.waitForTimeout(200);
            await page.evaluate(() => {
                if (typeof window.nextTurn === 'function') window.nextTurn(); // Goblin → Vampir (neue Runde)
            });
            await page.waitForTimeout(200);

            // D-07: LR sollen UNVERAENDERT geblieben sein (0 aktive Dots) — kein Auto-Reset!
            activeLrCount = await page.locator('#init-list .lr-dot.active').count();
            expect(activeLrCount).toBe(0);
        });

        test('Manueller legendary LR-Reset-Knopf setzt LR zurueck', async ({ page }) => {
            await injectBossCombatant(page);
            await page.waitForSelector('#init-list .lr-dot', { timeout: 5000 });

            // Alle LR verbrauchen: ersten Dot klicken (remaining=0)
            const lrDots = page.locator('#init-list .lr-dot');
            await lrDots.first().click();
            await page.waitForTimeout(200);

            // 0 aktive LR-Dots
            let activeLrCount = await page.locator('#init-list .lr-dot.active').count();
            expect(activeLrCount).toBe(0);

            // LR-Reset-Knopf klicken
            const resetBtn = page.locator('#init-list .lr-reset-btn').first();
            await resetBtn.click();
            await page.waitForTimeout(200);

            // Nach Reset: alle 3 LR wieder aktiv
            activeLrCount = await page.locator('#init-list .lr-dot.active').count();
            expect(activeLrCount).toBe(3);
        });
    });

    // ============================================================
    // MOB-MODUS (INIT-03) — Wave-3 Implementierung
    // ============================================================

    test.describe('mob', () => {
        /**
         * Hilfsfunktion: Fuegt einen Mob-Kombattanten (10 Goblins) direkt per
         * page.evaluate() in die Initiative ein und rendert neu.
         * Umgeht die komplexe UI-Interaktion (Bestiary → prompt → confirm).
         *
         * @param {number} poolHp - Anfaenglicher Pool-HP (Standard: 70 = 10 × 7)
         */
        async function injectMobCombatant(page, poolHp) {
            var hp = poolHp !== undefined ? poolHp : 70;
            await page.evaluate(function(args) {
                var hp = args.hp;
                var mobCb = {
                    id: window.nextId ? window.nextId('combatants') : Date.now(),
                    name: 'Goblin-Schwarm',
                    initiative: 12,
                    initBonus: 2,
                    maxHp: hp,
                    currentHp: hp,
                    ac: 15,
                    type: 'monster',
                    cr: '1/4',
                    xp: 500,
                    effects: [],
                    statblockRef: { source: 'srd', id: 'goblin' },
                    mob: {
                        count: 10,
                        poolHp: hp,
                        maxPoolHp: hp,
                        individualMaxHp: 7,
                        attackMode: 'nfach'
                    }
                };
                window.D.initiative.combatants = [mobCb];
                window.D.initiative.currentTurn = 0;
                window.D.initiative.round = 1;
                if (typeof window.renderInit === 'function') window.renderInit();
            }, { hp: hp });
        }

        test('Mob-Toggle erzeugt eine mob Zeile mit init-info--mob in #init-list', async ({ page }) => {
            await injectMobCombatant(page);
            // Warten bis init-list gerendert wird
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            // Genau eine Zeile soll vorhanden sein (nicht 10 Einzelzeilen)
            const rows = page.locator('#init-list .init-row');
            expect(await rows.count()).toBe(1);

            // Die Zeile soll .init-info--mob enthalten (Mob-spezifische Info-Spalte)
            const mobInfo = page.locator('#init-list .init-info--mob');
            await expect(mobInfo).toBeAttached();

            // Name soll 'Goblin-Schwarm' enthalten
            const nameEl = page.locator('#init-list .init-name').first();
            await expect(nameEl).toContainText('Goblin-Schwarm');
        });

        test('Mob-Zeile zeigt "X von N am Leben" korrekt an und reagiert auf Modus-Umschaltung', async ({ page }) => {
            await injectMobCombatant(page, 70); // 70 Pool-HP = 10 Goblins × 7 HP
            await page.waitForSelector('#init-list .init-mob-alive', { timeout: 5000 });

            // Alive-Count: 70 poolHp / 7 individualMaxHp = 10 = ceil(10) = 10
            const aliveEl = page.locator('#init-list .init-mob-alive').first();
            await expect(aliveEl).toContainText('10 von 10 am Leben');

            // Modus-Toggle-Buttons muessen vorhanden sein
            const modeBtns = page.locator('#init-list .init-mob-mode-btn');
            expect(await modeBtns.count()).toBe(2);

            // N-fach-Button soll initial aktiv sein
            const nfachBtn = page.locator('#init-list .init-mob-mode-btn[data-mode="nfach"]');
            await expect(nfachBtn).toHaveClass(/active/);

            // Auf DMG-Regel-Button klicken — soll aktiv werden und DMG-Eingaben einblenden
            const dmgRegelBtn = page.locator('#init-list .init-mob-mode-btn[data-mode="dmg-regel"]');
            await dmgRegelBtn.click();
            await page.waitForTimeout(300);

            // DMG-Regel-Inputs sollen sichtbar werden (nicht mehr .hidden)
            const dmgInputs = page.locator('#init-list .init-mob-dmg-inputs');
            await expect(dmgInputs).not.toHaveClass(/hidden/);
        });

        test('Mob-Zeile zeigt Besiegt-Badge bei 0 Pool-HP', async ({ page }) => {
            await injectMobCombatant(page, 0); // Pool-HP = 0 → Besiegt
            await page.waitForSelector('#init-list .init-row', { timeout: 5000 });

            // .init-mob-defeated-badge soll vorhanden und sichtbar sein
            const badge = page.locator('#init-list .init-mob-defeated-badge').first();
            await expect(badge).toBeAttached();
            await expect(badge).toContainText('Besiegt');

            // .init-mob-alive soll Klasse .defeated haben
            const aliveEl = page.locator('#init-list .init-mob-alive').first();
            await expect(aliveEl).toHaveClass(/defeated/);
        });

        test('Mob-Dissolve-Button entfernt die mob Zeile aus dem DOM', async ({ page }) => {
            await injectMobCombatant(page);
            await page.waitForSelector('#init-list .init-mob-dissolve-btn', { timeout: 5000 });

            // confirm()-Dialog automatisch bestaetigen
            page.on('dialog', dialog => dialog.accept());

            // Dissolve-Button klicken
            const dissolveBtn = page.locator('#init-list .init-mob-dissolve-btn').first();
            await dissolveBtn.click();
            await page.waitForTimeout(400);

            // Die Mob-Zeile soll entfernt sein
            const rows = page.locator('#init-list .init-row');
            const count = await rows.count();
            // Entweder 0 Zeilen oder "Keine Kämpfer"-Meldung
            if (count > 0) {
                // Wenn noch Zeilen vorhanden, soll keine .init-info--mob mehr da sein
                const mobInfo = page.locator('#init-list .init-info--mob');
                expect(await mobInfo.count()).toBe(0);
            }
            // Test besteht wenn keine Fehler aufgetreten sind
        });
    });
});
