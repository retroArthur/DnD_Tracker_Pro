// @ts-check
/**
 * E2E Stubs — Phase 6 Plan 06-02: Inspiration-Toggle (CHAR-02)
 * Wave-0 Nyquist-Stubs: Dateien existieren und laufen fehlerfrei.
 * Assertions sind als test.fixme markiert und werden in Wave 2 (06-02) aktiviert.
 *
 * Referenz: 06-VALIDATION.md § "Per-Requirement Verification Map"
 *   - CHAR-02: Klick auf ☆ → ⭐; Reload → weiterhin ⭐
 *   - CHAR-02 Toggle-Stop (D-01): Klick auf ⭐ öffnet KEIN Charakter-Formular
 *
 * WICHTIG: Kein addCombatant()-Helper — dieser ist kaputt (docs/e2e-failure-triage.md)
 * WICHTIG: file://-Basis (kein localhost), ESM-Import
 */

import { test, expect } from '@playwright/test';

// file://-Basis analog zu tests/e2e/crud/party.spec.js und welt-story.spec.js
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/**
 * Hilfsfunktion: App laden und auf Party-Tab navigieren
 */
async function loadAndNavToParty(page) {
    await page.goto(APP_URL);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.switchView('party'));
    await page.waitForTimeout(300);
}

/**
 * Hilfsfunktion: Einen Testcharakter in D.characters injizieren und Party neu rendern
 */
async function injectTestCharacter(page, charData = {}) {
    await page.evaluate(data => {
        // @ts-ignore
        const ch = Object.assign({
            id: 99901,
            name: 'Testcharakter (Inspiration)',
            level: 3,
            inspiration: false,
            hpCurrent: 20,
            hpMax: 20,
            armorClass: 14,
            attributes: { str: 10, dex: 14, con: 12, int: 10, wis: 10, cha: 10 }
        }, data);
        window.D.characters = [ch];
        if (typeof window.renderParty === 'function') window.renderParty();
    }, charData);
    await page.waitForTimeout(300);
}

// ============================================================
// CHAR-02 / D-01 / D-02: Inspiration-Toggle
// Wave-2-Aktivierung: Plan 06-02 — "Inspiration-Toggle implementieren"
// ============================================================

test.describe('CHAR-02: Inspiration-Toggle', () => {
    test.beforeEach(async ({ page }) => {
        await loadAndNavToParty(page);
    });

    test(
        'Klick auf ☆ schaltet zu ⭐ und .char-inspiration-toggle.active ist sichtbar',
        async ({ page }) => {
            // Wave-2-Aktivierung: 06-02 Task "Inspiration-Toggle auf Charakterkarte"
            // 06-VALIDATION.md: CHAR-02 Inspiration-Toggle
            // Assertion: expect(page.locator('.char-inspiration-toggle.active')).toBeVisible()
            await injectTestCharacter(page, { inspiration: false });
            await page.click('.char-inspiration-toggle');
            await page.waitForTimeout(200);
            await expect(page.locator('.char-inspiration-toggle.active')).toBeVisible();
        }
    );

    test(
        'Inspiration bleibt nach Reload erhalten (Persistenz-Check)',
        async ({ page }) => {
            // Wave-2-Aktivierung: 06-02 Task "Inspiration-Toggle + save()"
            // 06-VALIDATION.md: CHAR-02 Inspiration-Toggle — Reload → weiterhin ⭐
            await injectTestCharacter(page, { inspiration: false });
            await page.click('.char-inspiration-toggle');
            await page.waitForTimeout(300);
            // Neu laden und prüfen ob Zustand persistiert
            await page.reload();
            await page.waitForSelector('.app-title', { timeout: 10000 });
            await page.evaluate(() => window.switchView('party'));
            await page.waitForTimeout(300);
            await expect(page.locator('.char-inspiration-toggle.active')).toBeVisible();
        }
    );

    test(
        'Klick auf ⭐ öffnet NICHT das Charakter-Formular (-stop Handler)',
        async ({ page }) => {
            // Wave-2-Aktivierung: 06-02 Task "toggle-inspiration-stop Action-Handler"
            // 06-VALIDATION.md: CHAR-02 Toggle-Stop (D-01)
            // D-01: Eigener -stop-Handler verhindert Propagierung zu edit-char
            await injectTestCharacter(page, { inspiration: true });
            await page.click('.char-inspiration-toggle');
            await page.waitForTimeout(200);
            // #char-form.open darf NICHT sichtbar sein
            await expect(page.locator('#char-form.open')).not.toBeVisible();
        }
    );

    test(
        'Inspiration-Stern ist IMMER sichtbar (auch wenn inspiration=false)',
        async ({ page }) => {
            // Wave-2-Aktivierung: 06-02 — immer sichtbarer Stern (D-01)
            // Stern als Umriss/ausgegraut wenn inspiration=false, gefüllt wenn true
            await injectTestCharacter(page, { inspiration: false });
            // Der Toggle-Button selbst (nicht .active) muss sichtbar sein
            await expect(page.locator('.char-inspiration-toggle')).toBeVisible();
        }
    );
});

// ============================================================
// CHAR-02 / D-02: Kein Undo beim Inspiration-Toggle
// Wave-2-Aktivierung: 06-02 Unit-Test (diese E2E-Datei enthält nur den Stub)
// ============================================================

test.describe('CHAR-02 / D-02: Kein Undo-Stack-Eintrag', () => {
    test(
        'saveUndoState wird beim Inspiration-Toggle nicht aufgerufen',
        async ({ page }) => {
            // Wave-2-Aktivierung: 06-02 — dieser Test besser als Unit-Test
            // Spy-Check: saveUndoState-Aufrufe = 0 nach Toggle
            // E2E-Variante via page.evaluate möglich
            await loadAndNavToParty(page);
            await injectTestCharacter(page, { inspiration: false });
            await page.evaluate(() => {
                // @ts-ignore
                window.__undoSpyCalls = 0;
                const original = window.saveUndoState;
                window.saveUndoState = function() {
                    // @ts-ignore
                    window.__undoSpyCalls++;
                    return original?.apply(this, arguments);
                };
            });
            await page.click('.char-inspiration-toggle');
            await page.waitForTimeout(200);
            const undoCallsAfter = await page.evaluate(() => window.__undoSpyCalls || 0);
            expect(undoCallsAfter).toBe(0);
        }
    );
});
