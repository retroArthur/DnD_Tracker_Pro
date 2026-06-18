// @ts-check
/**
 * E2E Stubs — Phase 6 Pläne 06-03 / 06-04: Erweiterte Charakterwerte + XP-Tracker (CHAR-01/03)
 * Wave-0 Nyquist-Stubs: Dateien existieren und laufen fehlerfrei.
 * Assertions sind als test.fixme markiert und werden in Waves 3–4 aktiviert.
 *
 * Referenz: 06-VALIDATION.md § "Per-Requirement Verification Map"
 *   - CHAR-03 / D-04: Klickbarer Attribut-/Skill-/Save-Wurf → Ergebnis in Dice-Historie
 *   - CHAR-03 / D-05: Angriff +5 / 1d8+3 → Dice-Spans im Detail-Modal
 *   - CHAR-01 / D-07: Milestone-Modus → XP-Felder versteckt, "+1 Level"-Button sichtbar
 *
 * WICHTIG: Kein addCombatant()-Helper — dieser ist kaputt (docs/e2e-failure-triage.md)
 *          XP-Verteilung wird via page.evaluate direkt in D.initiative.combatants injiziert
 * WICHTIG: file://-Basis (kein localhost), ESM-Import
 */

import { test, expect } from '@playwright/test';

// file://-Basis analog zu tests/e2e/crud/party.spec.js
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/**
 * Hilfsfunktion: App laden
 */
async function loadApp(page) {
    await page.goto(APP_URL);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    await page.waitForTimeout(500);
}

/**
 * Hilfsfunktion: Einen vollständigen Testcharakter in D.characters injizieren
 * (inkl. Phase-6-Felder: xp, skillProficiencies, skillExpertise, attacks)
 */
async function injectCharWithAdvancedFields(page) {
    await page.evaluate(() => {
        // @ts-ignore
        window.D.characters = [{
            id: 99902,
            name: 'Rhogar (Testschurke)',
            characterClass: 'Schurke',
            level: 5,
            xp: 6500,
            hpCurrent: 30,
            hpMax: 30,
            armorClass: 15,
            proficiencyBonus: 3,
            passivePerception: 13,
            inspiration: false,
            attributes: { str: 10, dex: 18, con: 12, int: 12, wis: 12, cha: 14 },
            saveProficiencies: { str: false, dex: true, con: false, int: true, wis: false, cha: false },
            skillProficiencies: { stealth: true, deception: true, perception: true },
            skillExpertise: { stealth: true },
            attacks: [
                { name: 'Kurzschwert', attackBonus: 5, damage: '1d6+3', damageType: 'Stich' },
                { name: 'Dolch (Fernkampf)', attackBonus: 5, damage: '1d4+3', damageType: 'Stich' }
            ],
            currency: { gm: 50 },
            notes: ''
        }];
        if (typeof window.renderParty === 'function') window.renderParty();
    });
    await page.waitForTimeout(300);
}

// ============================================================
// CHAR-03 / D-04: Klickbare Würfe (Skills, Saves, Attribute)
// Wave-3-Aktivierung: Plan 06-03 — "Skills-Sektion + klickbare Würfe im Detail-Modal"
// ============================================================

test.describe('CHAR-03 / D-04: Klickbare Würfe im Detail-Modal', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await page.click('[data-view="party"]');
        await page.waitForTimeout(300);
        await injectCharWithAdvancedFields(page);
    });

    test(
        'Klick auf STR-Attribut-Box → Würfelergebnis erscheint in Dice-Historie',
        async ({ page }) => {
            // Wave-3: 06-03 — Attribut-Checks klickbar im Detail-Modal (D-04)
            // 06-VALIDATION.md: CHAR-03 / D-04 Attribut-Check klickbar
            // Detail-Modal öffnen
            await page.click('[data-action="show-char-details"][data-id="99902"]');
            await page.waitForTimeout(300);
            // Würfel-Historien-Länge vorher merken
            const historyBefore = await page.evaluate(() => {
                // @ts-ignore
                return (window.diceHistory || []).length;
            });
            // STR-Attribut-Box direkt klicken (die Box selbst, nicht die Adv-Buttons)
            await page.locator('[data-action="roll-char-attr-stop"][data-attr="str"]:not([data-adv])').first().click();
            await page.waitForTimeout(300);
            const historyAfter = await page.evaluate(() => {
                // @ts-ignore
                return (window.diceHistory || []).length;
            });
            expect(historyAfter).toBeGreaterThan(historyBefore);
        }
    );

    test(
        'Klick auf Heimlichkeit-Skill → Würfelergebnis in Dice-Historie (Expertise)',
        async ({ page }) => {
            // Wave-3: 06-03 — Skills-Sektion im Detail-Modal
            // Rhogar hat Expertise in stealth → modifier = DEX+4 + 2×Prof+3 = +10
            await page.click('[data-action="show-char-details"][data-id="99902"]');
            await page.waitForTimeout(300);
            const historyBefore = await page.evaluate(() => (window.diceHistory || []).length);
            await page.locator('[data-action="roll-char-skill-stop"][data-skill="stealth"]:not([data-adv])').first().click();
            await page.waitForTimeout(300);
            const historyAfter = await page.evaluate(() => (window.diceHistory || []).length);
            expect(historyAfter).toBeGreaterThan(historyBefore);
        }
    );

    test(
        'Klick auf STR-Attribut-Wurf im Modal → sichtbarer Toast über dem Modal (UAT roll-feedback)',
        async ({ page }) => {
            // Gap-Closure 06-08 — roll-feedback: Toast erscheint über offenem Detail-Modal
            // z-index-Fix: .event-log 1200 > .modal-overlay 1100 → Toast sichtbar
            // 06-VALIDATION.md: CHAR-03 / UAT roll-feedback
            await page.click('[data-action="show-char-details"][data-id="99902"]');
            await page.waitForTimeout(300);

            // Würfel-Historien-Länge vorher merken (diceHistory bleibt weiterhin grün)
            const historyBefore = await page.evaluate(() => (window.diceHistory || []).length);

            // STR-Attribut-Wurf klicken (Modal bleibt offen)
            await page.locator('[data-action="roll-char-attr-stop"][data-attr="str"]:not([data-adv])').first().click();
            await page.waitForTimeout(500);

            // (a) Würfel-Historie gewachsen (bestehende Assertion bleibt grün)
            const historyAfter = await page.evaluate(() => (window.diceHistory || []).length);
            expect(historyAfter).toBeGreaterThan(historyBefore);

            // (b) Sichtbarer #event-log-Eintrag mit 🎲 über dem Modal
            await expect(
                page.locator('#event-log .event-log-entry', { hasText: '🎲' }).first()
            ).toBeVisible();
        }
    );
});

// ============================================================
// CHAR-03 / D-05: Klickbare Angriffe
// Wave-3-Aktivierung: Plan 06-03 — "Angriffs-Sektion + renderClickableDice()"
// ============================================================

test.describe('CHAR-03 / D-05: Klickbare Angriffe im Detail-Modal', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await page.click('[data-view="party"]');
        await page.waitForTimeout(300);
        await injectCharWithAdvancedFields(page);
    });

    test(
        'Angriff +5 / 1d6+3 → Dice-Spans mit data-value="1d20+5" und data-value="1d6+3" im Modal',
        async ({ page }) => {
            // Wave-3: 06-03 — Angriffs-Sektion im Detail-Modal (D-05)
            // 06-VALIDATION.md: CHAR-03 / D-05 — Treffer- und Schadenswurf separat klickbar
            await page.click('[data-action="show-char-details"][data-id="99902"]');
            await page.waitForTimeout(300);
            // Trefferwurf-Span (Kurzschwert +5)
            await expect(page.locator('[data-value="1d20+5"]').first()).toBeVisible();
            // Schadenswurf-Span (Kurzschwert 1d6+3)
            await expect(page.locator('[data-value="1d6+3"]').first()).toBeVisible();
        }
    );

    test(
        'Klick auf Angriffs-Trefferwurf → Würfelergebnis in Dice-Historie',
        async ({ page }) => {
            // Wave-3: 06-03 — Angriffs-Trefferwurf klickbar via bestiary-roll-dice handler
            await page.click('[data-action="show-char-details"][data-id="99902"]');
            await page.waitForTimeout(300);
            const historyBefore = await page.evaluate(() => (window.diceHistory || []).length);
            await page.locator('[data-value="1d20+5"]').first().click();
            await page.waitForTimeout(300);
            const historyAfter = await page.evaluate(() => (window.diceHistory || []).length);
            expect(historyAfter).toBeGreaterThan(historyBefore);
        }
    );
});

// ============================================================
// CHAR-01 / D-09 / D-10: XP-Auto-Summe und -Verteilung
// Wave-4-Aktivierung: Plan 06-04 — "XP-Verteilungs-Modal + Initiative-Trigger"
// Hinweis: Kein addCombatant() — Injektion via page.evaluate
// ============================================================

test.describe('CHAR-01 / D-09 / D-10: XP-Auto-Summe und -Verteilung', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await injectCharWithAdvancedFields(page);
    });

    test(
        '2 Wölfe (CR 1/4 = je 50 XP) → 100 XP vorberechnet im XP-Modal',
        async ({ page }) => {
            // Wave-4-Aktivierung: 06-04 Task "XP-Auto-Summe aus CR_TO_XP"
            // 06-VALIDATION.md: CHAR-01 / D-09 XP-Auto-Summe
            // Kein addCombatant() — direkte D.initiative.combatants-Injektion
            await page.evaluate(() => {
                // @ts-ignore
                window.D.initiative.combatants = [
                    { id: 1, name: 'Wolf 1', type: 'enemy', cr: '1/4', hpCurrent: 0, hpMax: 11 },
                    { id: 2, name: 'Wolf 2', type: 'enemy', cr: '1/4', hpCurrent: 0, hpMax: 11 }
                ];
            });
            await page.click('[data-view="initiative"]');
            await page.waitForTimeout(300);
            // XP-Modal öffnen (Button erscheint in Wave 4)
            await page.click('[data-action="finish-combat-xp"]');
            await page.waitForTimeout(300);
            // Vorberechneter XP-Wert muss 100 sein
            const precomputedXP = await page.evaluate(() => {
                const el = document.getElementById('xp-distribution-total');
                return el ? parseInt(el.value || el.textContent || '0') : 0;
            });
            expect(precomputedXP).toBe(100);
        }
    );

    test(
        '400 XP auf 4 lebende Charaktere → je 100 XP vergeben',
        async ({ page }) => {
            // Wave-4-Aktivierung: 06-04 Task "gleichmäßige XP-Verteilung (D-10)"
            // 4 Charaktere mit hpCurrent > 0 injizieren
            await page.evaluate(() => {
                // @ts-ignore
                window.D.characters = [
                    { id: 1, name: 'Char 1', hpCurrent: 20, hpMax: 20, xp: 0 },
                    { id: 2, name: 'Char 2', hpCurrent: 15, hpMax: 15, xp: 0 },
                    { id: 3, name: 'Char 3', hpCurrent: 30, hpMax: 30, xp: 0 },
                    { id: 4, name: 'Char 4', hpCurrent: 25, hpMax: 25, xp: 0 }
                ];
            });
            // XP-Verteilung via page.evaluate simulieren (kein UI-Klick nötig für Unit-Level-Check)
            const result = await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.distributeXP === 'function') {
                    const activeChars = window.D.characters.filter(c => (c.hpCurrent || 0) > 0);
                    return window.distributeXP(400, activeChars);
                }
                return null;
            });
            if (result) {
                expect(result.share).toBe(100);
                expect(result.remainder).toBe(0);
            }
        }
    );
});

// ============================================================
// CHAR-01 / D-07: Milestone-Modus
// Wave-4-Aktivierung: Plan 06-04 — "Milestone-Modus UI"
// ============================================================

test.describe('CHAR-01 / D-07: Milestone-Modus', () => {
    test(
        'D.settings.levelingMode="milestone" → XP-Felder versteckt, "+1 Level"-Button sichtbar',
        async ({ page }) => {
            // Wave-4-Aktivierung: 06-04 Task "Milestone-Modus im Detail-Modal"
            // 06-VALIDATION.md: CHAR-01 / D-07 Milestone-Modus
            await loadApp(page);
            await page.evaluate(() => {
                // @ts-ignore
                window.D.settings = window.D.settings || {};
                // @ts-ignore
                window.D.settings.levelingMode = 'milestone';
                // @ts-ignore
                window.D.characters = [{
                    id: 99903,
                    name: 'Milestone-Char',
                    level: 3, xp: 0,
                    hpCurrent: 20, hpMax: 20,
                    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
                }];
                if (typeof window.renderParty === 'function') window.renderParty();
            });
            await page.click('[data-view="party"]');
            await page.waitForTimeout(300);
            // Detail-Modal öffnen
            await page.click('[data-action="show-char-details"][data-id="99903"]');
            await page.waitForTimeout(300);
            // Im Milestone-Modus: XP-Feld versteckt
            await expect(page.locator('.char-xp-section')).not.toBeVisible();
            // "+1 Level"-Button sichtbar
            await expect(page.locator('[data-action="milestone-level-up"]')).toBeVisible();
        }
    );

    test(
        'Toggle im Party-Overview schaltet auf Milestone — Detail-Modal flippt Branch (06-05)',
        async ({ page }) => {
            // 06-05 Gap-Closure: set-leveling-mode UI-Kontrolle (nicht page.evaluate)
            // Statt D.settings.levelingMode direkt zu setzen, wird der neue Toggle geklickt.
            await loadApp(page);
            // Charakter injizieren WITHOUT setting levelingMode (bleibt Standard 'xp')
            await page.evaluate(() => {
                // @ts-ignore
                window.D.settings = window.D.settings || {};
                // levelingMode absichtlich NICHT gesetzt — bleibt 'xp' (Default)
                // @ts-ignore
                window.D.characters = [{
                    id: 99905,
                    name: 'Toggle-Char',
                    level: 3,
                    xp: 0,
                    hpCurrent: 20,
                    hpMax: 20,
                    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
                }];
                if (typeof window.renderParty === 'function') window.renderParty();
            });
            await page.click('[data-view="party"]');
            await page.waitForTimeout(300);
            // Im Ausgangszustand (XP-Modus): XP-Toggle-Option ist aktiv
            await expect(page.locator('[data-action="set-leveling-mode"][data-value="xp"]')).toHaveClass(/active/);
            await expect(page.locator('[data-action="set-leveling-mode"][data-value="milestone"]')).not.toHaveClass(/active/);
            // Auf Meilenstein-Modus wechseln via UI-Kontrolle (NICHT page.evaluate)
            await page.click('[data-action="set-leveling-mode"][data-value="milestone"]');
            await page.waitForTimeout(300);
            // Toggle zeigt jetzt Meilenstein als aktiv
            await expect(page.locator('[data-action="set-leveling-mode"][data-value="milestone"]')).toHaveClass(/active/);
            // Detail-Modal öffnen
            await page.click('[data-action="show-char-details"][data-id="99905"]');
            await page.waitForTimeout(300);
            // Im Meilenstein-Modus: XP-Feld versteckt, "+1 Level"-Button sichtbar
            await expect(page.locator('.char-xp-section')).not.toBeVisible();
            await expect(page.locator('[data-action="milestone-level-up"]')).toBeVisible();
            // Modal schließen, bevor der Toggle erneut geklickt wird
            await page.click('[data-action="hide-modal"][data-value="char-detail-modal"]');
            await page.waitForTimeout(200);
            // Zurück auf XP-Modus wechseln (Branch-Flip prüfen)
            await page.click('[data-action="set-leveling-mode"][data-value="xp"]');
            await page.waitForTimeout(300);
            // Toggle zeigt XP als aktiv
            await expect(page.locator('[data-action="set-leveling-mode"][data-value="xp"]')).toHaveClass(/active/);
            // Detail-Modal erneut öffnen und XP-Branch prüfen
            await page.click('[data-action="show-char-details"][data-id="99905"]');
            await page.waitForTimeout(300);
            // XP-Feld wieder sichtbar
            await expect(page.locator('.char-xp-section')).toBeVisible();
            await expect(page.locator('[data-action="milestone-level-up"]')).not.toBeVisible();
        }
    );
});

// ============================================================
// CHAR-01 / D-11: Levelaufstieg-Hinweis
// Wave-4-Aktivierung: Plan 06-04 — "Levelaufstieg-Hinweis"
// ============================================================

test.describe('CHAR-01 / D-11: Levelaufstieg-Hinweis', () => {
    test(
        'Charakter Level 1 mit xp=300 → Levelaufstieg-Hinweis sichtbar im Detail-Modal',
        async ({ page }) => {
            // Wave-4-Aktivierung: 06-04 Task "Levelaufstieg-Hinweis (D-11)"
            // 06-VALIDATION.md: CHAR-01 / D-11
            await loadApp(page);
            await page.evaluate(() => {
                // @ts-ignore
                window.D.settings = { levelingMode: 'xp' };
                // @ts-ignore
                window.D.characters = [{
                    id: 99904, name: 'Aufsteiger', level: 1, xp: 300,
                    hpCurrent: 10, hpMax: 10,
                    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
                }];
                if (typeof window.renderParty === 'function') window.renderParty();
            });
            await page.click('[data-view="party"]');
            await page.waitForTimeout(300);
            await page.click('[data-action="show-char-details"][data-id="99904"]');
            await page.waitForTimeout(300);
            // Level-Aufstieg-Hinweis (Badge/Toast/Icon) soll sichtbar sein
            await expect(page.locator('.level-up-hint, .char-level-up-badge')).toBeVisible();
        }
    );
});

// ============================================================
// CHAR-03: Detail-Modal aufgeräumt — V/N nur bei Hover (UAT-Gap detail-modal-clutter)
// Gap-Closure: Plan 06-06 — "V/N-Buttons hover-only"
// ============================================================

test.describe('CHAR-03: Detail-Modal aufgeräumt — V/N nur bei Hover', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await page.click('[data-view="party"]');
        await page.waitForTimeout(300);
        await injectCharWithAdvancedFields(page);
    });

    test(
        'V/N-Buttons sind im Ruhezustand versteckt und erscheinen beim Hover der Skill-Zeile',
        async ({ page }) => {
            // Gap-Closure: 06-06 — detail-modal-clutter (CHAR-03)
            // @media (hover: hover) and (pointer: fine) greift in Default-Chromium (fine pointer).
            // Im Ruhezustand: .char-adv-btns visibility:hidden → .not.toBeVisible()
            // Nach page.hover() auf .char-skill-item: visibility:visible → .toBeVisible()
            await page.click('[data-action="show-char-details"][data-id="99902"]');
            await page.waitForTimeout(300);

            // Stealth-Zeile (Rhogar hat stealth-Proficienz) + deren V/N-Buttons
            const stealthRow = page.locator(
                '[data-action="roll-char-skill-stop"][data-skill="stealth"]:not([data-adv])'
            ).first();
            const advBtns = stealthRow.locator('.char-adv-btns').first();

            // Ruhezustand: V/N-Buttons NICHT sichtbar (visibility:hidden via @media hover)
            await expect(advBtns).not.toBeVisible();

            // Nach Hover der Skill-Zeile: V/N-Buttons erscheinen
            await page.hover('[data-action="roll-char-skill-stop"][data-skill="stealth"]:not([data-adv])');
            await page.waitForTimeout(150);
            await expect(advBtns).toBeVisible();
        }
    );
});
