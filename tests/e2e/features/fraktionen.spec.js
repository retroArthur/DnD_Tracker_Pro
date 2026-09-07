/**
 * E2E Tests — Fraktionen-Tab
 *
 * Verschoben aus tests/e2e/features/welt-story.spec.js (Phase 14, TEST-04/DEBT-28).
 * Ursprünglich Teil der Phase-5-„Wave-0"-Sammel-Spec für Welt & Story; hier als
 * dedizierte Datei für den Fraktionen-Bereich (features/fraktionen/).
 * Referenz-Tab-Name: fraktionen
 */

import { test, expect } from '@playwright/test';

// App-URL über file:// (Projekt-Konvention, analog bestiary.spec.js) — kein Dev-Server nötig
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// ============================================================
// WELT-05: Fraktionen & Ruf — Tab "fraktionen"
// aktiviert in Plan 05-07
// ============================================================
test.describe('WELT-05: Fraktionen-Tab', () => {
    test('Tab fraktionen ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('fraktionen'));
        await expect(page.locator('#view-fraktionen')).toBeVisible();
    });

    test('Fraktion anlegen erscheint in Übersichtsliste', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('fraktionen'));

        // Fraktion direkt via page.evaluate anlegen (kein DOM-Formular-Roundtrip)
        await page.evaluate(() => {
            window.D.factions = [];
            window.pushUndo('Test-Fraktion');
            window.D.factions.push({
                id: 1,
                name: 'Diebesgilde',
                symbol: '🗡️',
                agenda: '',
                beschreibung: '',
                ruf: 0,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            });
            window.renderFraktionen();
        });

        // Karte erscheint in der Liste
        await expect(page.locator('.fr-faction-card')).toBeVisible();
        const count = await page.evaluate(() => window.D.factions.length);
        expect(count).toBe(1);
    });

    test('Ruf-Anpassung schreibt Eintrag in rufHistorie', async ({ page }) => {
        await page.goto(APP_URL);

        // Fraktion anlegen und Ruf anpassen via page.evaluate
        const result = await page.evaluate(() => {
            window.D.factions = [{
                id: 1,
                name: 'Testgilde',
                symbol: '⚔️',
                agenda: '',
                beschreibung: '',
                ruf: 0,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            }];
            // anpassenRuf aufrufen
            window.anpassenRuf(1, 10, 'Drachenschatz gerettet');
            return {
                ruf: window.D.factions[0].ruf,
                historieLen: window.D.factions[0].rufHistorie.length,
                grund: window.D.factions[0].rufHistorie[0].grund
            };
        });

        expect(result.ruf).toBe(10);
        expect(result.historieLen).toBe(1);
        expect(result.grund).toBe('Drachenschatz gerettet');
    });

    test('Undo nach Ruf-Änderung stellt alten Wert wieder her', async ({ page }) => {
        await page.goto(APP_URL);

        // Fraktion auf Ruf 0 setzen, dann +10 anpassen, dann Undo
        const result = await page.evaluate(() => {
            window.D.factions = [{
                id: 1,
                name: 'Testgilde',
                symbol: '⚔️',
                agenda: '',
                beschreibung: '',
                ruf: 0,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            }];
            // anpassenRuf ruft pushUndo VOR Mutation
            window.anpassenRuf(1, 10, 'Test');
            // Undo ausführen
            if (typeof window.undo === 'function') window.undo();
            return window.D.factions[0] ? window.D.factions[0].ruf : null;
        });

        // Nach Undo sollte ruf wieder 0 sein
        expect(result).toBe(0);
    });

    test('NPC mit factionId erscheint in Fraktions-Mitgliederliste', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('fraktionen'));

        // Fraktion + NPC mit factionId anlegen
        await page.evaluate(() => {
            window.D.factions = [{
                id: 42,
                name: 'Magiergilde',
                symbol: '🔮',
                agenda: '',
                beschreibung: '',
                ruf: 15,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            }];
            // NPC mit factionId setzen
            if (!window.D.npcs) window.D.npcs = [];
            window.D.npcs.push({
                id: 99,
                name: 'Gandalf der Graue',
                role: 'Zauberer',
                factionId: 42
            });
            window.renderFraktionen();
            // Fraktion auswählen um Detail zu sehen
            window.selectFraktion(42);
        });

        // Mitglied soll im Detail-Panel erscheinen
        await expect(page.locator('.fr-mitglied-name')).toContainText('Gandalf der Graue');
    });
});
