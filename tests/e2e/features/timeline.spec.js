/**
 * E2E Tests — Kalender-/Timeline-Tab
 *
 * Aufgeteilt aus der frueheren Welt-&-Story-Sammel-Spec (Phase 14, TEST-04/DEBT-28).
 * Ursprünglich Teil der Phase-5-„Wave-0"-Sammel-Spec für Welt & Story; hier als
 * dedizierte Datei für den Timeline-Bereich (features/timeline/). Die Blockbeschriftung
 * "Kalender-Tab" ist Testtext und bleibt unverändert — Verhaltensneutralität (D-05).
 * Referenz-Tab-Name: kalender
 */

import { test, expect } from '@playwright/test';

// App-URL über file:// (Projekt-Konvention, analog bestiary.spec.js) — kein Dev-Server nötig
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// ============================================================
// WELT-03: Timeline & Kalender — Tab "kalender" (aktiviert Plan 05-05)
// ============================================================
test.describe('WELT-03: Kalender-Tab', () => {
    test('Tab kalender ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('kalender'));
        await expect(page.locator('#view-kalender')).toBeVisible();
    });

    test('Kalender zeigt Harptos-Monatsnamen', async ({ page }) => {
        await page.goto(APP_URL);
        // Kalender auf Hammer setzen
        await page.evaluate(() => {
            if (window.D && window.D.calendar) {
                window.D.calendar.day = 1;
                window.D.calendar.month = 1;
                window.D.calendar.year = 1492;
            }
        });
        await page.evaluate(() => window.switchView('kalender'));
        await page.waitForTimeout(200);
        // #kalender-monat-anzeige muss Monatsnamen enthalten
        const anzeigeText = await page.locator('#kalender-monat-anzeige').innerText();
        expect(anzeigeText).toContain('Hammer');
        expect(anzeigeText).toContain('1492 DR');
    });

    test('Timeline-Eintrag kann via addCalendarEvent angelegt werden', async ({ page }) => {
        await page.goto(APP_URL);
        const evtCount = await page.evaluate(() => {
            if (!window.D || !window.D.calendar) return -1;
            // addCalendarEvent direkt aufrufen
            if (typeof window.addCalendarEvent === 'function') {
                window.addCalendarEvent(
                    { tag: 5, monat: 3, jahr: 1492 },
                    'Testevent',
                    'manuell',
                    null
                );
            }
            return window.D.calendar.events.length;
        });
        expect(evtCount).toBeGreaterThanOrEqual(1);
    });

    test('Einträge erscheinen chronologisch sortiert (sortiereTimelineEvents)', async ({ page }) => {
        await page.goto(APP_URL);
        const sorted = await page.evaluate(() => {
            if (!window.sortiereTimelineEvents) return null;
            var events = [
                { datum: { tag: 15, monat: 3, jahr: 1492 }, titel: 'C' },
                { datum: { tag: 1,  monat: 1, jahr: 1492 }, titel: 'A' },
                { datum: { tag: 5,  monat: 2, jahr: 1492 }, titel: 'B' }
            ];
            return window.sortiereTimelineEvents(events).map(function(e) { return e.titel; });
        });
        expect(sorted).toEqual(['A', 'B', 'C']);
    });
});
