// @ts-check
import { test, expect } from '@playwright/test';
import { loadApp, navigateToTab, seedCleanSession } from '../helpers/test-utils.js';

/**
 * Code-Review 2026-09-21, Einheit U8 — R06: "🔄 Neu laden" im Konflikt-Banner zeigt den
 * neuen Stand erst, wenn das Laden fertig ist — auch im IndexedDB-Modus.
 *
 * Vorher rief reloadData() das asynchrone load() ohne await auf: renderAll() malte im
 * naechsten Frame noch den alten Stand, das Banner verschwand, und nach dem (langsameren)
 * IndexedDB-Lesen renderte nichts mehr.
 *
 * Alles Vorbereitende und der Klick laufen in EINEM page.evaluate — ein dazwischen feuernder
 * Save-Timer koennte sonst den localStorage-Schluessel wieder anlegen und load() auf den
 * synchronen Pfad schicken (Test ohne Aussage). Das IndexedDB-Lesen wird um 400 ms verzoegert,
 * laenger als ein Frame.
 * Voraussetzung: frischer Dev-Build (python build.py).
 */

const NEUER_HELD = 'Aus-Tab-B';
const NEUE_NOTIZ = 'Notiz aus Tab B';

test.describe('Konflikt-Neuladen (R06)', () => {
    test('IndexedDB-Modus mit langsamem Lesen: der neue Stand erscheint, Notizen folgen, Banner verschwindet', async ({
        page
    }) => {
        await seedCleanSession(page);
        await loadApp(page);
        await navigateToTab(page, 'party');

        await page.evaluate(
            async ({ name, notiz }) => {
                // @ts-ignore — App-Globals im Seitenkontext
                const key = window.getActiveCampaignKey();
                // @ts-ignore
                const neuer = structuredClone(window.D);
                neuer.characters = [
                    {
                        id: 901,
                        name,
                        characterClass: 'Kämpfer',
                        level: 3,
                        xp: 900,
                        hpCurrent: 20,
                        hpMax: 28,
                        ac: 16,
                        conditions: [],
                        skillProficiencies: {},
                        skillExpertise: {},
                        attacks: [],
                        spellSlotsMax: [0, 0, 0, 0, 0, 0, 0, 0, 0],
                        spellSlotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0]
                    }
                ];
                neuer.quickNotes = notiz;
                // Anderer Tab im IndexedDB-Modus: nur IndexedDB haelt die Kampagne
                // @ts-ignore
                await window.saveToIndexedDBFallback(key, JSON.stringify(neuer));
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_ts');
                // @ts-ignore
                const echt = window.loadFromIndexedDBFallback;
                // @ts-ignore
                window.loadFromIndexedDBFallback = async k => {
                    await new Promise(r => setTimeout(r, 400));
                    return echt(k);
                };
                // @ts-ignore
                window.showConflictBanner();
                const knopf = document.querySelector('#conflict-banner [data-value="reloadData"]');
                // @ts-ignore
                knopf.click();
            },
            { name: NEUER_HELD, notiz: NEUE_NOTIZ }
        );

        await expect(page.locator('#party-list')).toContainText(NEUER_HELD, { timeout: 3000 });
        await expect(page.locator('#party-list')).not.toContainText('Anzeigefehler');
        await expect(page.locator('#quick-notes')).toHaveValue(NEUE_NOTIZ);
        await expect(page.locator('#conflict-banner')).not.toHaveClass(/show/);
    });
});
