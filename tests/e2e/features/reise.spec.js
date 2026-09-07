/**
 * E2E Tests — Reise-Tab
 *
 * Aufgeteilt aus der frueheren Welt-&-Story-Sammel-Spec (Phase 14, TEST-04/DEBT-28).
 * Ursprünglich Teil der Phase-5-„Wave-0"-Sammel-Spec für Welt & Story; hier als
 * dedizierte Datei für den Reise-Bereich (features/reise/).
 * Referenz-Tab-Name: reise
 */

import { test, expect } from '@playwright/test';

// App-URL über file:// (Projekt-Konvention, analog bestiary.spec.js) — kein Dev-Server nötig
const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// ============================================================
// WELT-04: Reise & Wetter — Tab "reise" (aktiviert Plan 05-06)
// ============================================================
test.describe('WELT-04: Reise-Tab', () => {
    test('Tab reise ist sichtbar und anklickbar', async ({ page }) => {
        await page.goto(APP_URL);
        await page.evaluate(() => window.switchView('reise'));
        await expect(page.locator('#view-reise')).toBeVisible();
    });

    test('Reise-Abschluss rückt D.calendar um korrekte Tage vor', async ({ page }) => {
        await page.goto(APP_URL);
        // Kalender auf Tag 1 setzen
        await page.evaluate(() => {
            if (window.D && window.D.calendar) {
                window.D.calendar.day = 1;
                window.D.calendar.month = 1;
                window.D.calendar.year = 1492;
            }
        });
        // abschliessenReise(3) direkt aufrufen — pushUndo + advanceCalendarDate
        await page.evaluate(() => {
            if (typeof window.abschliessenReise === 'function') {
                // Dialog nicht warten — close modal if it appears
                window.abschliessenReise(3);
            }
        });
        // Dialog (falls vorhanden) schließen
        await page.evaluate(() => {
            var modal = document.getElementById('rs-timeline-modal');
            if (modal) modal.remove();
        });
        const day = await page.evaluate(() => window.D && window.D.calendar && window.D.calendar.day);
        expect(day).toBe(4);
    });

    test('Wetter-Roll gibt Ergebnis basierend auf Jahreszeit', async ({ page }) => {
        await page.goto(APP_URL);
        const result = await page.evaluate(() => {
            if (typeof window.rollWetter !== 'function') return null;
            return window.rollWetter('gemässigt', 'winter');
        });
        expect(result).not.toBeNull();
        expect(result.entry).toBeDefined();
        expect(typeof result.entry.text).toBe('string');
        // rollWetter waehlt zufaellig einen Eintrag aus einer Wetter-Text-Tabelle mit variabler
        // Textlaenge — kein exakter Wert erwartbar, nur "ist nicht leer".
        // Phase 8 / D-04 (08-03): bleibt loose (zufaelliger Tabelleneintrag).
        expect(result.entry.text.length).toBeGreaterThan(0);
    });

    test('berechneTagesmarsch und jahreszeitAusDatum sind global verfügbar', async ({ page }) => {
        await page.goto(APP_URL);
        const checks = await page.evaluate(() => ({
            berechneTagesmarsch: typeof window.berechneTagesmarsch === 'function',
            rollWetter: typeof window.rollWetter === 'function',
            rollBegegnung: typeof window.rollBegegnung === 'function',
            abschliessenReise: typeof window.abschliessenReise === 'function',
            jahreszeitAusDatum: typeof window.jahreszeitAusDatum === 'function',
            tagesmarsch24: window.berechneTagesmarsch && window.berechneTagesmarsch('normal', 'normal') === 24,
            tagesmarsch9: window.berechneTagesmarsch && window.berechneTagesmarsch('langsam', 'schwierig') === 9
        }));
        expect(checks.berechneTagesmarsch).toBe(true);
        expect(checks.rollWetter).toBe(true);
        expect(checks.rollBegegnung).toBe(true);
        expect(checks.abschliessenReise).toBe(true);
        expect(checks.jahreszeitAusDatum).toBe(true);
        expect(checks.tagesmarsch24).toBe(true);
        expect(checks.tagesmarsch9).toBe(true);
    });
});
