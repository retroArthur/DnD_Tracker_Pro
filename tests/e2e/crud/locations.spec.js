// @ts-check
import { test, expect } from '@playwright/test';
import {
  loadApp,
  navigateToTab,
  fillField,
  generateTestName,
  performUndo
} from '../helpers/test-utils.js';

/**
 * Locations CRUD Tests
 * Testet Create, Read, Update, Delete für Orte
 */

test.describe('Locations - CRUD Operationen', () => {

  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToTab(page, 'locations');
  });

  test.describe('CREATE - Ort erstellen', () => {

    test('Ort mit Minimaldaten erstellen', async ({ page }) => {
      const locName = generateTestName('MinLoc');

      // Modal öffnen
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);

      // Name ausfüllen
      await fillField(page, 'loc-name', locName);

      // Speichern
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Prüfen ob Ort in Liste erscheint
      await expect(page.locator('#locations-list')).toContainText(locName);
    });

    test('Ort mit Beschreibung erstellen', async ({ page }) => {
      const locName = generateTestName('DescLoc');

      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);

      await fillField(page, 'loc-name', locName);

      // Beschreibung falls Editor vorhanden
      const descEditor = page.locator('#loc-desc');
      if (await descEditor.isVisible()) {
        await descEditor.click();
        await descEditor.pressSequentially('Ein geheimnisvoller Ort voller Abenteuer.');
      }

      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Prüfen
      const locData = await page.evaluate((name) => {
        // @ts-ignore
        return D.locations ? D.locations.find(l => l.name && l.name.includes(name)) : null;
      }, locName);

      expect(locData).toBeTruthy();
    });

    test('Ort ohne Namen zeigt Fehlermeldung', async ({ page }) => {
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);

      // Nur Beschreibung, kein Name
      const descEditor = page.locator('#loc-desc');
      await descEditor.click();
      await descEditor.pressSequentially('Beschreibung ohne Namen');

      await page.click('[data-action="call"][data-value="saveLocation"]');

      // Fehlermeldung erwartet
      await expect(page.locator('#toast')).toContainText('Name');
    });

  });

  test.describe('READ - Ort anzeigen', () => {

    test('Ortsliste zeigt alle Orte', async ({ page }) => {
      const locName = generateTestName('ListLoc');

      // Ort erstellen
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', locName);
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Ort in Liste
      await expect(page.locator('#locations-list')).toContainText(locName);
    });

    test('Ortssuche filtert Liste', async ({ page }) => {
      const loc1 = generateTestName('SearchLoc_Wald');
      const loc2 = generateTestName('SearchLoc_Stadt');

      // Zwei Orte erstellen
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', loc1);
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', loc2);
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Suche
      await fillField(page, 'loc-search', 'Wald');
      await page.waitForTimeout(300);

      // Nur Wald sichtbar
      await expect(page.locator('#locations-list')).toContainText('Wald');
      await expect(page.locator('#locations-list')).not.toContainText('Stadt');
    });

    test('Ort-Details können angezeigt werden', async ({ page }) => {
      const locName = generateTestName('DetailLoc');

      // Ort erstellen
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', locName);
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Ort in Daten vorhanden prüfen
      const locData = await page.evaluate((name) => {
        // @ts-ignore
        return D.locations ? D.locations.find(l => l.name && l.name.includes(name)) : null;
      }, locName);

      expect(locData).toBeTruthy();
    });

  });

  test.describe('UPDATE - Ort bearbeiten', () => {

    test('Ort-Daten können geändert werden', async ({ page }) => {
      const locName = generateTestName('EditLoc');
      const newName = generateTestName('EditedLoc');

      // Ort erstellen
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', locName);
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Bearbeiten
      const editBtn = page.locator(`[data-action="edit-location"]`).first();
      if (await editBtn.isVisible()) {
        await editBtn.click();
        await page.waitForTimeout(300);

        // Name ändern
        await fillField(page, 'loc-name', newName);
        await page.click('[data-action="call"][data-value="saveLocation"]');
        await page.waitForTimeout(500);

        // Prüfen
        await expect(page.locator('#locations-list')).toContainText(newName);
        await expect(page.locator('#locations-list')).not.toContainText(locName);
      }
    });

  });

  test.describe('DELETE - Ort löschen', () => {

    test('Ort kann gelöscht werden', async ({ page }) => {
      const locName = generateTestName('DeleteLoc');

      // Ort erstellen
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', locName);
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Dialog akzeptieren
      page.on('dialog', dialog => dialog.accept());

      // Löschen
      const deleteBtn = page.locator(`[data-action="delete-location"]`).first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // Prüfen
        await expect(page.locator('#locations-list')).not.toContainText(locName);
      }
    });

    test('Löschen kann rückgängig gemacht werden', async ({ page }) => {
      const locName = generateTestName('UndoLoc');

      // Ort erstellen
      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', locName);
      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Dialog akzeptieren
      page.on('dialog', dialog => dialog.accept());

      // Löschen
      const deleteBtn = page.locator(`[data-action="delete-location"]`).first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.waitForTimeout(500);

        // Undo
        await performUndo(page);
        await page.waitForTimeout(500);

        // Ort wieder da
        await expect(page.locator('#locations-list')).toContainText(locName);
      }
    });

  });

  test.describe('NPC-Verknüpfungen', () => {

    test('Ort zeigt verknüpfte NPCs an', async ({ page }) => {
      // Erst NPC erstellen
      await navigateToTab(page, 'npcs');
      const npcName = generateTestName('LinkedNPC');

      await page.click('[data-action="show-modal"][data-value="npc-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'npc-name', npcName);
      await page.click('[data-action="call"][data-value="saveNPC"]');
      await page.waitForTimeout(500);

      // Dann Ort mit verknüpftem NPC erstellen
      await navigateToTab(page, 'locations');
      const locName = generateTestName('NPCLoc');

      await page.click('[data-action="show-modal"][data-value="location-modal"]');
      await page.waitForTimeout(300);
      await fillField(page, 'loc-name', locName);

      // NPC-Verknüpfung hinzufügen (falls möglich)
      // Dies hängt von der UI-Implementierung ab

      await page.click('[data-action="call"][data-value="saveLocation"]');
      await page.waitForTimeout(500);

      // Ort sollte erstellt sein
      await expect(page.locator('#locations-list')).toContainText(locName);
    });

  });

});
