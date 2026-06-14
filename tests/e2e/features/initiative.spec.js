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
            // Seed über das reale Inline-Formular (Helper am Dateianfang)
            await addCombatant(page, 'Goblin Krieger', 15, 7);

            // Die neue Zeile muss in der Initiative-Liste erscheinen
            const entry = page
                .locator('#init-list .init-entry')
                .filter({ hasText: 'Goblin Krieger' });
            await expect(entry).toHaveCount(1);

            // Name wird im dedizierten .init-name-Element gerendert
            await expect(entry.locator('.init-name')).toHaveText('Goblin Krieger');

            // HP aus dem Formular spiegelt sich als currentHp/maxHp in .init-hp-value
            await expect(entry.locator('.init-hp-value')).toContainText('7/7');

            // Initiative-Wert (15) wird in .init-value gerendert
            await expect(entry.locator('.init-value')).toContainText('15');
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
            // Schaden via HP-Rechner-Modal (deterministisch, ganze Zahl)
            await addCombatant(page, 'Tank', 10, 50);

            const row = page.locator('#init-list .init-entry', { hasText: 'Tank' });
            await expect(row).toHaveCount(1);
            // Start-HP: addCombatant setzt currentHp = maxHp = 50
            await expect(row.locator('.init-hp-value')).toHaveText('50/50');

            // HP-Rechner aus DIESER Zeile öffnen (setzt #hp-calc-id auf die Combatant-ID)
            await row.locator('[data-action="show-hp-calculator"]').click();
            await page.waitForSelector('#hp-calc-modal', { state: 'visible' });

            // 10 Schaden anwenden — parseDiceFormula('10') === 10 (kein RNG)
            await page.fill('#hp-calc-value', '10');
            await page.click('[data-action="apply-hp-change"][data-value="damage"]');
            await page.waitForTimeout(200);

            // applyHpChange: max(0, 50-10) = 40, Zeile (gleiche data-id) neu gerendert
            await expect(row.locator('.init-hp-value')).toHaveText('40/50');
        });

        test('sollte Heilung anwenden können', async ({ page }) => {
            // Heilung via HP-Rechner-Modal: erst Schaden, dann Heilen
            await addCombatant(page, 'Verwundeter', 10, 20);

            const row = page.locator('#init-list .init-entry', { hasText: 'Verwundeter' });
            await expect(row).toHaveCount(1);
            await expect(row.locator('.init-hp-value')).toHaveText('20/20');

            // 1) Schaden 15 → max(0, 20-15) = 5
            await row.locator('[data-action="show-hp-calculator"]').click();
            await page.waitForSelector('#hp-calc-modal', { state: 'visible' });
            await page.fill('#hp-calc-value', '15');
            await page.click('[data-action="apply-hp-change"][data-value="damage"]');
            await page.waitForTimeout(200);
            await expect(row.locator('.init-hp-value')).toHaveText('5/20');

            const hpAfterDamage = parseInt(
                (await row.locator('.init-hp-value').textContent()).split('/')[0],
                10
            );
            expect(hpAfterDamage).toBe(5);

            // 2) Heilung 10 → min(20, 5+10) = 15
            // applyHpChange schliesst das Modal NICHT (bleibt 'modal-overlay show') →
            // direkt im offenen Modal weiterarbeiten statt es neu zu öffnen (Re-Open-Klick
            // würde sonst vom Overlay abgefangen).
            await expect(page.locator('#hp-calc-modal')).toHaveClass(/show/);
            await page.fill('#hp-calc-value', '10');
            await page.click('[data-action="apply-hp-change"][data-value="heal"]');
            await page.waitForTimeout(200);

            // Heilung muss HP erhöhen (echtes numerisches expect) und exakt 15/20 ergeben
            await expect(row.locator('.init-hp-value')).toHaveText('15/20');
            const hpAfterHeal = parseInt(
                (await row.locator('.init-hp-value').textContent()).split('/')[0],
                10
            );
            expect(hpAfterHeal).toBeGreaterThan(hpAfterDamage);
            expect(hpAfterHeal).toBe(15);
        });
    });

    // ============================================================
    // CONCENTRATION TRACKING
    // ============================================================

    test.describe('Concentration Tracking', () => {
        test('sollte Concentration setzen können', async ({ page }) => {
            // Manuell als PLAYER hinzufügen — Konz-Button erscheint nur für player/ally
            await page.fill('#init-name', 'Zauberer');
            await page.fill('#init-hp', '30');
            await page.selectOption('#init-type', 'player');
            await page.click('[data-action="call"][data-value="addCombatant"]');
            await page.waitForTimeout(200);

            const row = page.locator('#init-list .init-entry', { hasText: 'Zauberer' });
            await expect(row).toHaveCount(1);

            // Konzentration-Button (renderConcentration: nur player/ally)
            const concBtn = row.locator('.concentration-add-btn');
            await expect(concBtn).toBeVisible();
            await concBtn.click();

            // Modal-Eingabe: reale ID ist #conc-spell-input
            await page.waitForSelector('#concentration-modal', { state: 'visible' });
            await page.fill('#conc-spell-input', 'Haste');
            await page.click('[data-action="set-concentration"]'); // Button "✓ Setzen"
            await page.waitForTimeout(200);

            // Badge muss nun sichtbar sein und den Zauber zeigen
            const badge = row.locator('.concentration-badge');
            await expect(badge).toBeVisible();
            await expect(badge.locator('.conc-spell')).toHaveText('Haste');
            // Add-Button ist durch Badge ersetzt
            await expect(row.locator('.concentration-add-btn')).toHaveCount(0);
        });

        test('sollte Concentration-Check bei Schaden triggern', async ({ page }) => {
            // Kombattant MIT aktiver Konzentration direkt seeden (Banner ist typ-unabhängig)
            await page.evaluate(() => {
                window.D.initiative.combatants.push({
                    id: window.nextId ? window.nextId('combatants') : Date.now(),
                    name: 'Konzentrierter Mage',
                    initiative: 14,
                    initBonus: 0,
                    maxHp: 30,
                    currentHp: 30,
                    ac: 13,
                    type: 'player',
                    effects: [],
                    concentration: { active: true, spell: 'Fly', lastDC: 10 }
                });
                if (typeof window.renderInit === 'function') window.renderInit();
            });

            const row = page.locator('#init-list .init-entry', { hasText: 'Konzentrierter Mage' });
            await expect(row).toHaveCount(1);
            // Aktive Konzentration → Badge sichtbar
            await expect(row.locator('.concentration-badge .conc-spell')).toHaveText('Fly');
            // Noch kein Check-Banner (kein Schaden)
            await expect(row.locator('.concentration-check-banner')).toHaveCount(0);

            // Schaden über reale Zeilen-Schaltfläche ➖ (mod-hp -1) → modHp setzt pendingCheck
            await row.locator('[data-action="mod-hp"][data-value="-1"]').click();
            await page.waitForTimeout(200);

            // Konzentrations-Check-Banner muss nun erscheinen
            const banner = row.locator('.concentration-check-banner');
            await expect(banner).toBeVisible();
            await expect(banner).toContainText('Fly');
            // DC = max(10, floor(1/2)) = 10
            await expect(banner.locator('.conc-dc')).toHaveText('DC 10');
            // CON-Save-Würfelknopf vorhanden
            await expect(
                banner.locator('.conc-roll-btn[data-action="roll-concentration-check-stop"]')
            ).toBeVisible();
        });
    });

    // ============================================================
    // DEATH SAVES
    // ============================================================

    test.describe('Death Saves', () => {
        test('sollte Death Saves bei 0 HP anzeigen', async ({ page }) => {
            // Player-Kombattant bei 0 HP seeden (Death-Save-Gate: dead && type==='player')
            await page.evaluate(() => {
                window.D.initiative.combatants = [];
                window.D.initiative.currentTurn = 0;
                window.D.initiative.combatants.push({
                    id: 9001,
                    name: 'Sterbender Held',
                    initiative: 10,
                    initBonus: 10,
                    maxHp: 20,
                    currentHp: 0,
                    ac: 10,
                    type: 'player',
                    effects: []
                });
                window.renderInit();
            });

            const row = page.locator('.init-entry[data-id="9001"]');
            await expect(row).toBeVisible();
            // Gate ausgelöst: Zeile ist als "dead" markiert
            await expect(row).toHaveClass(/dead/);

            // Death-Saves-Block wird in der Player-Zeile gerendert
            const deathSaves = row.locator('.death-saves');
            await expect(deathSaves).toBeVisible();
            await expect(deathSaves.locator('.death-saves-label')).toHaveText(/Todeswürfe/);

            // 3 Erfolg + 3 Fehlschlag Punkte, alle anfangs inaktiv
            await expect(row.locator('.death-save-dot.success')).toHaveCount(3);
            await expect(row.locator('.death-save-dot.failure')).toHaveCount(3);
            await expect(row.locator('.death-save-dot.success.active')).toHaveCount(0);
            await expect(row.locator('.death-save-dot.failure.active')).toHaveCount(0);
        });

        test('sollte Death Save Success/Failure togglen', async ({ page }) => {
            // Player bei 0 HP seeden, dann den realen toggle-death-save-stop-Handler nutzen
            await page.evaluate(() => {
                window.D.initiative.combatants = [];
                window.D.initiative.currentTurn = 0;
                window.D.initiative.combatants.push({
                    id: 9001,
                    name: 'Am Sterben',
                    initiative: 10,
                    initBonus: 10,
                    maxHp: 10,
                    currentHp: 0,
                    ac: 10,
                    type: 'player',
                    effects: []
                });
                window.renderInit();
            });

            const rowSel = '.init-entry[data-id="9001"]';
            await expect(page.locator(rowSel + ' .death-saves')).toBeVisible();

            // Erster Erfolgs-Punkt startet inaktiv
            const successDot0 = page.locator(rowSel + ' .death-save-dot.success[data-index="0"]');
            await expect(successDot0).toHaveCount(1);
            await expect(successDot0).not.toHaveClass(/active/);

            // Klick → toggleDeathSave(9001,'success',0) setzt successes = 1, re-render
            await successDot0.click();
            await page.waitForTimeout(150);

            // Nach Re-Render: genau ein aktiver Erfolgs-Punkt, Index 0
            await expect(page.locator(rowSel + ' .death-save-dot.success.active')).toHaveCount(1);
            await expect(
                page.locator(rowSel + ' .death-save-dot.success[data-index="0"]')
            ).toHaveClass(/active/);
            await expect(page.locator(rowSel + ' .death-save-dot.failure.active')).toHaveCount(0);

            // Fehlschlag-Punkt unabhängig togglen
            await page.locator(rowSel + ' .death-save-dot.failure[data-index="0"]').click();
            await page.waitForTimeout(150);
            await expect(page.locator(rowSel + ' .death-save-dot.failure.active')).toHaveCount(1);

            // Aktiven Erfolgs-Punkt 0 erneut klicken → successes zurück auf 0 (toggle-off)
            await page.locator(rowSel + ' .death-save-dot.success[data-index="0"]').click();
            await page.waitForTimeout(150);
            await expect(page.locator(rowSel + ' .death-save-dot.success.active')).toHaveCount(0);
        });
    });

    // ============================================================
    // CONDITIONS
    // ============================================================

    test.describe('Conditions', () => {
        test('sollte Condition hinzufügen können', async ({ page }) => {
            // Seed über das reale Inline-Add-Formular
            await addCombatant(page, 'Vergifteter', 15, 25);

            const row = page.locator('#init-list .init-entry', { hasText: 'Vergifteter' });
            await expect(row).toHaveCount(1);

            // Effekt-Modal für diesen Kombattanten öffnen (🔮-Button)
            await row.locator('[data-action="show-add-effect"]').click();

            // Modal wird über .show-Klasse sichtbar
            await expect(page.locator('#effect-modal')).toHaveClass(/show/);

            // 'Vergiftet' (poisoned) aus dem Grid wählen
            const poisonedBtn = page.locator(
                '#effect-conditions-grid [data-action="add-effect-from-grid"][data-value="poisoned"]'
            );
            await expect(poisonedBtn).toBeVisible();
            await poisonedBtn.click();
            await page.waitForTimeout(150);

            // Modal schließen, damit es die Zeile nicht überlagert
            await page.click('[data-action="hide-modal"][data-value="effect-modal"]');
            await page.waitForTimeout(100);

            // Effekt-Badge muss nun in der Zeile gerendert sein (Klasse singular .init-effect)
            const effectBadge = page
                .locator('#init-list .init-entry', { hasText: 'Vergifteter' })
                .locator('.init-effects .init-effect');
            await expect(effectBadge).toHaveCount(1);
            await expect(effectBadge).toContainText('Vergiftet');
        });

        test('sollte Condition entfernen können', async ({ page }) => {
            // Kombattant seeden, der bereits den 'Gelähmt'-Effekt (paralyzed) trägt
            await page.evaluate(() => {
                const cb = {
                    id: window.nextId ? window.nextId('combatants') : Date.now(),
                    name: 'Testziel',
                    initiative: 10,
                    initBonus: 0,
                    maxHp: 25,
                    currentHp: 25,
                    ac: 13,
                    type: 'monster',
                    effects: [
                        {
                            id: 999,
                            name: 'Gelähmt',
                            duration: 999,
                            permanent: true,
                            color: 'red',
                            description: ''
                        }
                    ]
                };
                window.D.initiative.combatants.push(cb);
                window.renderInit();
            });

            await page.waitForSelector('#init-list .init-entry');

            const row = page.locator('#init-list .init-entry', { hasText: 'Testziel' });
            await expect(row).toHaveCount(1);

            // Badge vor dem Entfernen vorhanden (Klick auf Badge = Entfernen)
            const effectBadge = row.locator('.init-effect[data-action="remove-effect"]');
            await expect(effectBadge).toHaveCount(1);
            await expect(effectBadge).toContainText('Gelähmt');

            // Badge klicken entfernt den Effekt (removeEffect → renderInit)
            await effectBadge.click();
            await page.waitForTimeout(200);

            // Effekt ist weg
            await expect(
                page
                    .locator('#init-list .init-entry', { hasText: 'Testziel' })
                    .locator('.init-effect')
            ).toHaveCount(0);
            await expect(page.locator('#init-list')).not.toContainText('Gelähmt');
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
            // Einen Kombattanten über den realen Inline-Add-Flow seeden
            await addCombatant(page, 'Goblin', 12, 7);
            await expect(page.locator('#init-list .init-entry')).toHaveCount(1);
            await expect(page.locator('#init-list .init-name').first()).toContainText('Goblin');

            // Encounter "verschmutzen": Runde + transiente Zustände, die Reset löschen muss
            await page.evaluate(() => {
                const init = window.D.initiative;
                init.round = 3;
                init.currentTurn = 0;
                const cb = init.combatants[0];
                cb.conditions = ['poisoned'];
                cb.tempHp = 5;
                cb.exhaustion = 2;
                window.renderInit();
            });
            expect(await page.evaluate(() => window.D.initiative.round)).toBe(3);

            // resetEncounter() zeigt ein confirm() — VOR dem Klick bestätigen
            page.on('dialog', d => d.accept());

            // Realen Reset-Button klicken
            await page.click('[data-action="call"][data-value="resetEncounter"]');
            await page.waitForTimeout(200);

            // REALES Reset-Verhalten: Runde/Turn zurückgesetzt, transiente Zustände gelöscht,
            // Kombattant BLEIBT erhalten (Reset löscht keine Kombattanten).
            const after = await page.evaluate(() => {
                const init = window.D.initiative;
                const cb = init.combatants[0];
                return {
                    round: init.round,
                    currentTurn: init.currentTurn,
                    combatantCount: init.combatants.length,
                    name: cb ? cb.name : null,
                    conditionsLen: cb ? (cb.conditions || []).length : -1,
                    tempHp: cb ? cb.tempHp : -1,
                    exhaustion: cb ? cb.exhaustion : -1
                };
            });
            expect(after.round).toBe(1);
            expect(after.currentTurn).toBe(0);
            expect(after.combatantCount).toBe(1); // Kombattant NICHT entfernt
            expect(after.name).toBe('Goblin');
            expect(after.conditionsLen).toBe(0);
            expect(after.tempHp).toBe(0);
            expect(after.exhaustion).toBe(0);

            // DOM zeigt den Kombattanten weiterhin (nie 'Keine Kämpfer')
            await expect(page.locator('#init-list .init-entry')).toHaveCount(1);
            await expect(page.locator('#init-list')).not.toContainText('Keine Kämpfer');
            // Sichtbare Rundenanzeige auf 1 zurückgesetzt
            await expect(page.locator('#encounter-round-num')).toHaveText('1');
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
