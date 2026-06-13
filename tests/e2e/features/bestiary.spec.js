// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Bestiary System (Wave-0 Scaffold)
 *
 * Diese Datei enthaelt alle Wave-0-Szenario-Platzhalter fuer Phase 3.
 * Die Test-Titel sind CONTRACT-Namen — sie DUERFEN NICHT umbenannt werden,
 * da spaetere Plaene (02–05) gegen exakt diese grep-Titel verifizieren.
 *
 * SC1 (BEST-01): Suche, Filter, Wuerfelklick
 * SC2 (BEST-02): CRUD + Undo
 * SC3 (BEST-03): Zur Initiative / Zu Encounter
 *
 * Plan 01 liefert: Tab erscheint (leer), #view-bestiary ist sichtbar.
 * Plaene 02–05 fuellen die Assertionen in den fixme-Tests.
 */

// Hilfsfunktion: App laden und Bestiary-Tab oeffnen
async function openBestiaryTab(page) {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    await page.click('.nav-tab[data-view="bestiary"]');
    // Warten bis die Section im DOM ist und die active-Klasse traegt
    // (state: 'attached' weil die leere Section 0 Hoehe haben kann)
    await page.waitForSelector('#view-bestiary.active', { state: 'attached', timeout: 5000 });
}

test.describe('Bestiary — SC1: Suche und Filter', () => {
    test.beforeEach(async ({ page }) => {
        await openBestiaryTab(page);
    });

    // Tab-Sichtbarkeit — nicht fixme, laeuft in Plan 01
    test('Bestiary-Tab ist sichtbar und #view-bestiary wird angezeigt', async ({ page }) => {
        // Section hat active-Klasse und ist im DOM (openBestiaryTab hat darauf gewartet)
        await expect(page.locator('#view-bestiary')).toHaveClass(/active/);
    });

    // Contract-Test: Goblin suchen (Plan 02 fuellung)
    test.fixme('Goblin suchen', async ({ page }) => {
        // Plan 02: SRD-Daten eingebaut → Suche nach "Goblin" liefert Ergebnis
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 02: await page.fill('#bestiary-search', 'Goblin');
        // TODO Plan 02: await expect(page.locator('.bestiary-list-item')).toContainText('Goblin');
    });

    // Contract-Test: CR-Filter (Plan 03 fuellung)
    test.fixme('CR-Filter', async ({ page }) => {
        // Plan 03: Filter-UI implementiert → CR 1/4 zeigt nur passende Monster
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 03: await page.selectOption('#bestiary-filter-cr', '1/4');
        // TODO Plan 03: Alle sichtbaren Items haben HG 1/4
    });

    // Contract-Test: Typ-Filter (Plan 03 fuellung)
    test.fixme('Typ-Filter', async ({ page }) => {
        // Plan 03: Filter-UI implementiert → Typ "Humanoid" zeigt nur Humanoide
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 03: await page.selectOption('#bestiary-filter-type', 'Humanoid');
        // TODO Plan 03: Alle sichtbaren Items haben Typ Humanoid
    });

    // Contract-Test: Wuerfelklick (Plan 03 fuellung)
    test.fixme('Wuerfelklick', async ({ page }) => {
        // Plan 03: Statblock mit klickbaren Wuerfelformeln → Klick erzeugt Wuerfelresultat
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 03: Goblin auswaehlen → Statblock anzeigen → Schadensformel klicken
        // TODO Plan 03: await expect(page.locator('.event-log, .dice-result')).toBeVisible();
    });
});

test.describe('Bestiary — SC2: Eigene Kreaturen CRUD + Undo', () => {
    test.beforeEach(async ({ page }) => {
        await openBestiaryTab(page);
    });

    // Contract-Test: Kreatur anlegen (Plan 04 fuellung)
    test.fixme('Kreatur anlegen', async ({ page }) => {
        // Plan 04: Editor-Modal → Neue Kreatur anlegen → erscheint in Liste
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 04: await page.click('[data-action="call"][data-value="openBestiaryEditor"]');
        // TODO Plan 04: Formular ausf uellen + Speichern
        // TODO Plan 04: await expect(page.locator('.bestiary-list-item')).toContainText('Testdrache');
    });

    // Contract-Test: Kreatur bearbeiten (Plan 04 fuellung)
    test.fixme('Kreatur bearbeiten', async ({ page }) => {
        // Plan 04: Vorhandene eigene Kreatur bearbeiten → Aenderung wird gespeichert
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 04: Kreatur anlegen → bearbeiten → Name pruefen
    });

    // Contract-Test: Kreatur loeschen (Plan 04 fuellung)
    test.fixme('Kreatur loeschen', async ({ page }) => {
        // Plan 04: Kreatur loeschen → aus Liste entfernt
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 04: Kreatur anlegen → loeschen → nicht mehr in Liste
    });

    // Contract-Test: Undo loeschen (Plan 04 fuellung)
    test.fixme('Undo loeschen', async ({ page }) => {
        // Plan 04: Ctrl+Z nach Loeschen → Kreatur wiederhergestellt
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 04: Kreatur anlegen → loeschen → Strg+Z → wieder in Liste
    });
});

test.describe('Bestiary — SC3: Uebernahme zu Initiative und Encounter', () => {
    test.beforeEach(async ({ page }) => {
        await openBestiaryTab(page);
    });

    // Contract-Test: Zur Initiative (Plan 05 fuellung)
    test.fixme('Zur Initiative', async ({ page }) => {
        // Plan 05: Monster auswaehlen → "Zur Initiative" → Kombattant mit korrekter HP/AC
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 05: Goblin auswaehlen → Zur Initiative → Anzahl 1 → pruefen
        // TODO Plan 05: await page.click('.nav-tab[data-view="initiative"]');
        // TODO Plan 05: await expect(page.locator('.init-list')).toContainText('Goblin');
    });

    // Contract-Test: Zu Encounter (Plan 05 fuellung)
    test.fixme('Zu Encounter', async ({ page }) => {
        // Plan 05: Monster auswaehlen → "Zu Encounter" → Encounter-Eintrag mit korrekter HP/AC
        await expect(page.locator('#view-bestiary')).toBeVisible();
        // TODO Plan 05: Goblin auswaehlen → Zu Encounter → Encounter-Tab pruefen
    });
});
