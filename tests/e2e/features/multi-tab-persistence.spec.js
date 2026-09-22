// @ts-check
import { test, expect } from '@playwright/test';
import { loadApp, seedCleanSessionOnce } from '../helpers/test-utils.js';

/**
 * Code-Review 2026-09-21, Einheit U7 — R02: Schliessen oder Neuladen eines veralteten Tabs
 * darf die Arbeit eines anderen Tabs nicht ueberschreiben.
 *
 * Zwei Seiten im selben Browserkontext teilen unter file:// dasselbe localStorage. Seite B
 * speichert einen Charakter; Seite A (unveraendert, damit veraltet) wird geschlossen bzw. neu
 * geladen. Vorher schrieb der beforeunload-Handler in systems/avatars.js As alten Stand
 * unbedingt zurueck.
 *
 * Wichtig: page.close() ohne { runBeforeUnload: true } ueberspringt beforeunload — der Test
 * waere dann ohne Aussage. Ebenso muss A Bs Schreibvorgang ueberhaupt sehen (geteilter
 * Speicher), sonst ist der Test ebenfalls ohne Aussage.
 */

const KEY = 'dnd-tracker-v4';
const HELD = 'R02-Borin';

async function bSpeichertHeld(pageB) {
    await pageB.evaluate(async name => {
        // @ts-ignore — App-Globals im Seitenkontext
        window.D.characters.push({ id: 9001, name });
        // @ts-ignore
        await window.saveImmediate();
    }, HELD);
}

const gespeichert = page => page.evaluate(k => localStorage.getItem(k) || '', KEY);

test.describe('Mehrere Tabs: Verlassen ueberschreibt keine neueren Daten (R02)', () => {
    test('Schliessen des veralteten Tabs A laesst Bs gespeicherten Charakter stehen', async ({
        context
    }) => {
        await seedCleanSessionOnce(context);
        const pageA = await context.newPage();
        await loadApp(pageA);
        const pageB = await context.newPage();
        await loadApp(pageB);
        await bSpeichertHeld(pageB);

        // Nicht-Vakuitaet: A sieht Bs Schreibvorgang im geteilten Speicher
        expect(await gespeichert(pageA)).toContain(HELD);

        const geschlossen = pageA.waitForEvent('close');
        await pageA.close({ runBeforeUnload: true });
        await geschlossen;

        expect(await gespeichert(pageB)).toContain(HELD);
    });

    test('Neuladen des veralteten Tabs A: A laedt Bs Stand, der Schluessel behaelt ihn', async ({
        context
    }) => {
        await seedCleanSessionOnce(context);
        const pageA = await context.newPage();
        await loadApp(pageA);
        const pageB = await context.newPage();
        await loadApp(pageB);
        await bSpeichertHeld(pageB);
        expect(await gespeichert(pageA)).toContain(HELD);

        await pageA.reload();
        await pageA.waitForSelector('.app-title', { timeout: 10000 });

        // @ts-ignore — App-Global im Seitenkontext
        const namenA = await pageA.evaluate(() => window.D.characters.map(c => c.name));
        expect(namenA).toContain(HELD);
        expect(await gespeichert(pageB)).toContain(HELD);
    });

    test('Gegenprobe (ein Tab): save() und sofort neu laden — der Wert ueberlebt (Sicherheitsnetz beim Verlassen)', async ({
        page
    }) => {
        await seedCleanSessionOnce(page.context());
        await loadApp(page);

        await page.evaluate(() => {
            // @ts-ignore — App-Globals im Seitenkontext
            window.D.quickNotes = 'R02-Sicherheitsnetz';
            // @ts-ignore
            window.save();
        });
        await page.reload();
        await page.waitForSelector('.app-title', { timeout: 10000 });

        // @ts-ignore
        expect(await page.evaluate(() => window.D.quickNotes)).toBe('R02-Sicherheitsnetz');
    });
});
