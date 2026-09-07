/**
 * E2E Tests — NPC-Generator
 *
 * Verschoben aus tests/e2e/features/welt-story.spec.js (Phase 14, TEST-04/DEBT-28).
 * Ursprünglich Teil der Phase-5-„Wave-0"-Sammel-Spec für Welt & Story; hier als
 * dedizierte Datei für den NPC-Generator-Bereich (features/npc-generator/).
 * Referenz-Tab-Name: npcs (Generator-Button im NPC-Tab)
 */

import { test, expect } from '@playwright/test';

// App-URL über file:// (Projekt-Konvention, analog bestiary.spec.js) — kein Dev-Server nötig
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// ============================================================
// WELT-02: NPC-Generator — Button im NPC-Tab (aktiviert Plan 05-04)
// ============================================================
test.describe('WELT-02: NPC-Generator', () => {
    test('Generator-Button ist im NPC-Tab sichtbar', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await expect(page.locator('[data-action="show-npc-generator"]')).toBeVisible();
    });

    test('Klick öffnet Modal mit Vorschau-Karte in <1s', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));

        const t0 = Date.now();
        await page.click('[data-action="show-npc-generator"]');
        await expect(page.locator('#npc-generator-modal')).toBeVisible();
        const elapsed = Date.now() - t0;
        expect(elapsed).toBeLessThan(1000);

        // Vorschau-Karte mit Name, Zug, Marotte vorhanden
        await expect(page.locator('.npcg-preview-name')).toBeVisible();
        await expect(page.locator('.npcg-zug')).toBeVisible();
        await expect(page.locator('.npcg-marotte')).toBeVisible();
    });

    test('Volk-Select ändert Namens-Pool (Filter wirkt)', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await page.click('[data-action="show-npc-generator"]');
        // Filter auf Zwerg / Männlich setzen
        await page.selectOption('#npcg-volk-select', 'zwerg');
        await page.selectOption('#npcg-geschlecht-select', 'maennlich');
        // Re-Roll ausführen
        await page.click('[data-action="reroll-npc"]');
        // Name muss aus dem Zwerg-Pool stammen — check via evaluate
        const name = await page.locator('.npcg-preview-name').innerText();
        const pool = await page.evaluate(() => {
            return window.NPC_DEFAULT_TABLES &&
                   window.NPC_DEFAULT_TABLES.namen &&
                   window.NPC_DEFAULT_TABLES.namen.zwerg &&
                   window.NPC_DEFAULT_TABLES.namen.zwerg.maennlich || [];
        });
        expect(pool).toContain(name);
    });

    test('3× Re-Roll erzeugt keinen Eintrag in D.npcs', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await page.click('[data-action="show-npc-generator"]');

        // 3× Re-Roll
        for (let i = 0; i < 3; i++) {
            await page.click('[data-action="reroll-npc"]');
        }

        const npcsCount = await page.evaluate(() => (window.D && window.D.npcs && window.D.npcs.length) || 0);
        expect(npcsCount).toBe(0);
    });

    test('"Als NPC speichern" legt genau 1 D.npcs-Eintrag an', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await page.click('[data-action="show-npc-generator"]');

        // Einen NPC speichern
        await page.click('[data-action="save-generated-npc"]');
        await page.waitForTimeout(200);

        const npcsCount = await page.evaluate(() => (window.D && window.D.npcs && window.D.npcs.length) || 0);
        expect(npcsCount).toBe(1);
    });

    test('Gespeicherter NPC erscheint im NPC-Tab', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await page.click('[data-action="show-npc-generator"]');

        // Name merken
        const npcName = await page.locator('.npcg-preview-name').innerText();
        // Speichern
        await page.click('[data-action="save-generated-npc"]');
        await page.waitForTimeout(300);

        // Modal sollte verschwunden sein
        await expect(page.locator('#npc-generator-modal')).not.toBeVisible();
        // NPC-Liste muss den Namen enthalten
        const npcListText = await page.locator('#npc-list').innerText();
        expect(npcListText).toContain(npcName);
    });

    test('Generator öffnet als zentriertes, fixiertes Modal-Overlay (UAT-Gap npc-generator-modal-overlay)', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await page.click('[data-action="show-npc-generator"]');

        // Modal ist sichtbar
        await expect(page.locator('#npc-generator-modal')).toBeVisible();

        // Äußeres Element hat Klasse modal-overlay
        const cls = await page.locator('#npc-generator-modal').getAttribute('class');
        expect(cls).toContain('modal-overlay');

        // Computed position ist fixed (kein normaler Dokumentfluss)
        const pos = await page.evaluate(() => {
            const el = document.getElementById('npc-generator-modal');
            return el ? getComputedStyle(el).position : '';
        });
        expect(pos).toBe('fixed');
    });

    test('Generator verschwindet beim Tab-Wechsel (View-Switch-Cleanup)', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('npcs'));
        await page.click('[data-action="show-npc-generator"]');

        // Modal ist offen
        await expect(page.locator('#npc-generator-modal')).toBeVisible();

        // Tab wechseln via switchView (Modal ist Fullscreen-Overlay und blockiert Pointer-Events
        // auf darunter liegende Elemente — switchView direkt aufrufen testet den Cleanup-Hook exakt).
        // D-06-Bestandsausnahme (Phase 8 / 08-03 Task 2a, geprueft und BEIBEHALTEN): dieses evaluate()
        // ersetzt NICHT die Interaktion, die der Test eigentlich prueft — das Test-Subjekt ist der
        // View-Switch-Cleanup-Hook (entfernt das NPC-Generator-Modal aus dem DOM), nicht der
        // Tab-Klick-Mechanismus selbst (ein echter Klick auf den Nav-Tab wuerde intern denselben
        // switchView() aufrufen, waere aber durch das Fullscreen-Modal-Overlay pointer-intercepted).
        // Dokumentiertes Navigations-Vehikel, kein Maskieren.
        await page.evaluate(() => { if (typeof window.switchView === 'function') window.switchView('party'); });

        // Modal muss vollständig aus dem DOM entfernt sein (count === 0 beweist Entfernung)
        expect(await page.locator('#npc-generator-modal').count()).toBe(0);
    });
});
