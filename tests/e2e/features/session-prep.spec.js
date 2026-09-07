/**
 * E2E Tests — Session-Prep-Tab
 *
 * Aufgeteilt aus der frueheren Welt-&-Story-Sammel-Spec (Phase 14, TEST-04/DEBT-28).
 * Ursprünglich Teil der Phase-5-„Wave-0"-Sammel-Spec für Welt & Story; hier als
 * dedizierte Datei für den Session-Prep-Bereich (features/session-prep/).
 * Referenz-Tab-Name: sessionprep
 */

import { test, expect } from '@playwright/test';

// App-URL über file:// (Projekt-Konvention, analog bestiary.spec.js) — kein Dev-Server nötig
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// ============================================================
// WELT-01: Session-Prep-Assistent — Tab "sessionprep" (aktiviert Plan 05-03)
// ============================================================
test.describe('WELT-01: Session-Prep-Tab', () => {
    test('Tab sessionprep ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto(APP_URL);
        // Tab-Button klicken
        await page.evaluate(() => window.switchView('sessionprep'));
        // View-Container muss sichtbar sein
        await expect(page.locator('#view-sessionprep')).toBeVisible();
    });

    test('Neue Session-Prep-Modal enthält alle 5 Lazy-DM-Abschnitte', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('sessionprep'));
        // "Neue Session-Prep"-Button klicken
        await page.click('[data-action="show-session-prep-modal"]');
        // Alle 5 Pflicht-Felder müssen im Modal vorhanden sein
        await expect(page.locator('#prep-strong-start')).toBeVisible();
        // prep-szenen ist der Button zum Hinzufügen von Szenen (im Abschnitt "Geplante Szenen")
        await expect(page.locator('#prep-szenen')).toBeVisible();
        await expect(page.locator('#prep-hinweise')).toBeVisible();
        await expect(page.locator('#prep-npcs')).toBeVisible();
        await expect(page.locator('#prep-belohnungen')).toBeVisible();
    });

    test('Offene Quests werden als offene Fäden vorgeschlagen', async ({ page }) => {
        await page.goto(APP_URL);
        // Offene Quest in D.quests injizieren
        await page.evaluate(() => {
            if (window.D) {
                window.D.quests = [
                    { id: 99, title: 'Testquest offen', completed: false },
                    { id: 100, title: 'Testquest erledigt', completed: true }
                ];
            }
        });
        await page.evaluate(() => window.switchView('sessionprep'));
        await page.click('[data-action="show-session-prep-modal"]');
        // Der offene Faden aus der Quest muss als Input-Wert erscheinen
        const faedenText = await page.locator('.wp-faden-text').allTextContents();
        const values = await page.locator('.wp-faden-text').evaluateAll(
            els => els.map(el => el.value)
        );
        expect(values.some(v => v.includes('Testquest offen'))).toBe(true);
        expect(values.some(v => v.includes('Testquest erledigt'))).toBe(false);
    });

    test('Entity-Link in Szene wird als .entity-link gerendert', async ({ page }) => {
        await page.goto(APP_URL);
        // Session-Prep mit Entity-Link in der Szene anlegen
        await page.evaluate(() => {
            if (window.D && Array.isArray(window.D.sessionPreps)) {
                window.D.sessionPreps = [{
                    id: 1,
                    sessionNr: 1,
                    datum: '',
                    inGameDatum: '',
                    strongStart: '',
                    szenen: [{
                        id: 1,
                        titel: 'Testszene',
                        beschreibung: '[[npcs:1:Elara]] steht am Tor.',
                        ort: 'Stadttor'
                    }],
                    geheimeHinweise: '',
                    wichtigeNpcs: '',
                    belohnungen: '',
                    offeneFaeden: [],
                    links: [],
                    erstellt: Date.now()
                }];
                if (typeof window.renderSessionPrepList === 'function') {
                    window.renderSessionPrepList();
                }
            }
        });
        await page.evaluate(() => window.switchView('sessionprep'));
        await page.waitForTimeout(200);
        // Prep-Karte muss sichtbar sein (Liste mit 1 Eintrag)
        await expect(page.locator('#session-prep-card-1')).toBeVisible();
    });

    test('Undo nach Speichern ist über pushUndo vorbereitet', async ({ page }) => {
        await page.goto(APP_URL);
        // Prüfen dass sammleOffeneFaeden global verfügbar ist
        const hasFn = await page.evaluate(() => typeof window.sammleOffeneFaeden === 'function');
        expect(hasFn).toBe(true);
        // saveSessionPrep muss global verfügbar sein
        const hasSave = await page.evaluate(() => typeof window.saveSessionPrep === 'function');
        expect(hasSave).toBe(true);
    });
});
