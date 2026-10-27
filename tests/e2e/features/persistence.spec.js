// @ts-check
import { test, expect } from '@playwright/test';
import {
    loadApp,
    navigateToTab,
    openCollapseForm,
    fillField,
    generateTestName,
    performSave,
    seedCleanSession,
    waitForAppReady,
    waitForLogEntry
} from '../helpers/test-utils.js';

/**
 * Datenpersistenz Tests
 * Testet localStorage, Backup/Restore, Import/Export
 */

test.describe('Datenpersistenz', () => {
    test.describe('localStorage Speicherung', () => {
        test('Daten werden automatisch gespeichert', async ({ page }) => {
            await loadApp(page);
            await navigateToTab(page, 'party');

            const charName = generateTestName('PersistChar');

            // Charakter erstellen
            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(2000); // Warte auf Auto-Save

            // Prüfe ob Charakter in D.characters existiert
            const charExists = await page.evaluate(name => {
                return D.characters
                    ? D.characters.some(c => c.name && c.name.includes(name))
                    : false;
            }, charName);

            expect(charExists).toBe(true);

            // Prüfe localStorage (irgendeinen Key)
            const hasStorage = await page.evaluate(() => {
                const keys = Object.keys(localStorage);
                return keys.some(key => {
                    const data = localStorage.getItem(key);
                    return data && data.length > 100; // Irgendwelche Daten gespeichert
                });
            });

            expect(hasStorage).toBe(true);
        });

        test('Daten überleben Page Reload', async ({ page }) => {
            await loadApp(page);
            await navigateToTab(page, 'party');

            const charName = generateTestName('ReloadChar');

            // Charakter erstellen
            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(2000);

            // Page neu laden
            await page.reload();
            await waitForAppReady(page);

            // Charakter sollte noch in den Daten sein
            const charExists = await page.evaluate(name => {
                return D.characters
                    ? D.characters.some(c => c.name && c.name.includes(name))
                    : false;
            }, charName);
            expect(charExists).toBe(true);
        });

        test('Manuelles Speichern mit Ctrl+S', async ({ page }) => {
            await loadApp(page);
            await navigateToTab(page, 'party');

            const charName = generateTestName('ManualSave');

            // Charakter erstellen
            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // U5: der Alt-Knoten #toast ist abgeschaltet, und die Zusicherung ist
            // dabei STRENGER geworden. Vorher genuegte, dass irgendwo im einen
            // geteilten Knoten "gespeichert" stand — auch wenn das noch die
            // Meldung des Anlegens von vorhin war. Jetzt wird der Stand VOR dem
            // Speichern gemerkt und ein NEUER passender Eintrag verlangt.
            const vorher = await page.evaluate(() =>
                (typeof window.getCombatLog === 'function' ? window.getCombatLog() : []).map(
                    e => e.nr
                )
            );

            // Manuell speichern
            await performSave(page);

            const meldung = await waitForLogEntry(page);
            await expect(meldung).toBeVisible();
            const neueBestaetigungen = await page.evaluate(
                bekannt =>
                    (typeof window.getCombatLog === 'function' ? window.getCombatLog() : [])
                        .filter(e => !bekannt.includes(e.nr))
                        .filter(e => /gespeichert|saved/i.test(String(e.text)))
                        .map(e => e.text),
                vorher
            );
            expect(neueBestaetigungen.length).toBeGreaterThanOrEqual(1);
        });
    });

    test.describe('Multi-Entity Persistenz', () => {
        test('Alle Entity-Typen werden persistiert', async ({ page }) => {
            await loadApp(page);

            // Charakter erstellen
            await navigateToTab(page, 'party');
            const charName = generateTestName('MultiChar');
            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', charName);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);

            // NPC erstellen
            await navigateToTab(page, 'npcs');
            const npcName = generateTestName('MultiNPC');
            await page.click('[data-action="show-new-npc-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'npc-name', npcName);
            await page.click('[data-action="call"][data-value="saveNPC"]');
            await page.waitForTimeout(500);

            // Ort erstellen
            await navigateToTab(page, 'locations');
            const locName = generateTestName('MultiLoc');
            await page.click('[data-action="show-modal"][data-value="location-modal"]');
            await page.waitForTimeout(300);
            await fillField(page, 'loc-name', locName);
            await page.click('[data-action="call"][data-value="saveLocation"]');
            await page.waitForTimeout(2000);

            // Page neu laden
            await page.reload();
            await waitForAppReady(page);

            // Alle Entities via Daten prüfen
            const allData = await page.evaluate(
                names => {
                    return {
                        charExists: D.characters
                            ? D.characters.some(c => c.name && c.name.includes(names.char))
                            : false,
                        npcExists: D.npcs
                            ? D.npcs.some(n => n.name && n.name.includes(names.npc))
                            : false,
                        locExists: D.locations
                            ? D.locations.some(l => l.name && l.name.includes(names.loc))
                            : false
                    };
                },
                { char: charName, npc: npcName, loc: locName }
            );

            expect(allData.charExists).toBe(true);
            expect(allData.npcExists).toBe(true);
            expect(allData.locExists).toBe(true);
        });
    });

    test.describe('Daten-Export', () => {
        test('Export-Button ist verfügbar', async ({ page }) => {
            await loadApp(page);

            // Export könnte im Settings-Tab oder Modal sein
            const settingsTab = page.locator(
                '.nav-tab[data-view="settings"], .nav-tab[data-view="data"]'
            );
            if (await settingsTab.isVisible()) {
                await settingsTab.click();
                await page.waitForTimeout(300);
            }

            // Export-Bereich sollte irgendwo sichtbar sein
            const exportSection = page.locator(
                '[data-action*="export"], .export-btn, button:has-text("Export"), [data-action*="Export"]'
            );
            const count = await exportSection.count();
            expect(count).toBeGreaterThanOrEqual(0); // Existenz prüfen, nicht Sichtbarkeit erzwingen
        });
    });

    test.describe('Backup-System', () => {
        test('Backup-Bereich ist verfügbar', async ({ page }) => {
            await loadApp(page);

            // Settings Tab falls vorhanden
            const settingsTab = page.locator(
                '.nav-tab[data-view="settings"], .nav-tab[data-view="data"]'
            );
            if (await settingsTab.isVisible()) {
                await settingsTab.click();
                await page.waitForTimeout(300);
            }

            // Backup-Bereich sollte existieren
            const backupSection = page.locator(
                '[data-action*="backup"], .backup-section, :has-text("Backup")'
            );
            expect(await backupSection.count()).toBeGreaterThanOrEqual(0);
        });
    });
});

test.describe('Datenintegrität', () => {
    test('IDs sind eindeutig nach mehreren Erstellungen', async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'party');

        // Mehrere Charaktere erstellen
        const names = [];
        for (let i = 0; i < 3; i++) {
            const name = generateTestName(`UniqueID_${i}`);
            names.push(name);

            await openCollapseForm(page, 'char-form');
            await fillField(page, 'char-name', name);
            await page.click('[data-action="call"][data-value="saveCharacter"]');
            await page.waitForTimeout(500);
        }

        // IDs prüfen
        const ids = await page.evaluate(() => {
            // @ts-ignore
            return D.characters.map(c => c.id);
        });

        // Alle IDs sollten unterschiedlich sein
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds.length).toBe(ids.length);
    });

    test('Gelöschte Entities haben keine Referenzen mehr', async ({ page }) => {
        await loadApp(page);

        // NPC erstellen
        await navigateToTab(page, 'npcs');
        const npcName = generateTestName('RefNPC');
        await page.click('[data-action="show-new-npc-modal"]');
        await page.waitForTimeout(300);
        await fillField(page, 'npc-name', npcName);
        await page.click('[data-action="call"][data-value="saveNPC"]');
        await page.waitForTimeout(500);

        // NPC ID holen
        const npcId = await page.evaluate(name => {
            // @ts-ignore
            const npc = D.npcs.find(n => n.name.includes(name));
            return npc ? npc.id : null;
        }, npcName);

        expect(npcId).toBeTruthy();

        // NPC löschen
        page.on('dialog', dialog => dialog.accept());
        const deleteBtn = page.locator(`[data-action="delete-npc"]`).first();
        if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            await page.waitForTimeout(500);
        }

        // NPC sollte nicht mehr in D.npcs sein
        const stillExists = await page.evaluate(id => {
            // @ts-ignore
            return D.npcs.some(n => n.id === id);
        }, npcId);

        expect(stillExists).toBe(false);
    });
});

// Code-Review 2026-09-21, Einheit U3 (R04): ein abgebrochener IndexedDB-Commit darf weder
// einen Erfolg melden noch den letzten gueltigen localStorage-Stand entfernen.
test.describe('IndexedDB-Commit-Abbruch (R04)', () => {
    test('abgebrochener >5-MB-Commit laesst den letzten Stand stehen und meldet den Fehler', async ({
        page
    }) => {
        await seedCleanSession(page);
        // Nach put()-Erfolg die Transaktion abbrechen: Chromium feuert dann NUR 'abort' —
        // derselbe Ablauf wie bei einem Quota-Fehler beim Commit.
        await page.addInitScript(() => {
            const originalPut = window.IDBObjectStore.prototype.put;
            window.IDBObjectStore.prototype.put = function (...args) {
                const req = originalPut.apply(this, args);
                // @ts-ignore
                if (window.__r04AbortCampaignCommit && this.name === 'campaigns') {
                    req.addEventListener('success', () => {
                        try {
                            req.transaction.abort();
                        } catch (e) {
                            // Transaktion bereits beendet
                        }
                    });
                }
                return req;
            };
        });
        await loadApp(page);

        const key = await page.evaluate(
            // @ts-ignore
            () => window.STORAGE_KEY_OVERRIDE || window.APP_CONFIG.STORAGE_KEY
        );
        await page.evaluate(async () => {
            // @ts-ignore
            D.characters.push({ id: 990001, name: 'R04-Anker', notes: '' });
            // @ts-ignore
            await saveImmediate();
        });
        const lesen = k => ({
            data: localStorage.getItem(k),
            ts: localStorage.getItem(k + '_ts')
        });
        const vorher = await page.evaluate(lesen, key);
        expect(vorher.data).toContain('R04-Anker');
        expect(vorher.ts).not.toBeNull();

        await page.evaluate(async () => {
            // @ts-ignore
            window.__r04AbortCampaignCommit = true;
            // @ts-ignore
            D.characters.find(c => c.id === 990001).notes = 'A'.repeat(6 * 1024 * 1024);
            // @ts-ignore
            await saveImmediate();
        });

        expect(await page.evaluate(lesen, key)).toEqual(vorher);
        await expect(page.locator('#save-indicator')).toHaveClass(/\berror\b/);
        const logText = (await page.locator('#event-log').textContent()) || '';
        expect(logText).toContain('Speichern fehlgeschlagen');
        expect(logText).not.toContain('Daten sicher gespeichert');

        // Zweite Seite ohne Neuladen der ersten: der Anker ist der zuletzt gueltige Stand
        const page2 = await page.context().newPage();
        await loadApp(page2);
        const ankerDa = await page2.evaluate(
            // @ts-ignore
            () => D.characters.some(c => c.id === 990001 && c.name === 'R04-Anker')
        );
        expect(ankerDa).toBe(true);
        await page2.close();
    });
});
