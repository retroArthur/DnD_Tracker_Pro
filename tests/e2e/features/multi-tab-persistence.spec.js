// @ts-check
import { test, expect, httpAppUrl } from '../helpers/http-app.js';
import { loadApp, loadCleanSessionOnce, waitForAppReady } from '../helpers/test-utils.js';

/**
 * Code-Review 2026-09-21, Einheit U7 — R02: Schliessen oder Neuladen eines veralteten Tabs
 * darf die Arbeit eines anderen Tabs nicht ueberschreiben.
 *
 * Zwei Seiten im selben Browserkontext teilen dieselbe lokale HTTP-Origin. Seite B
 * speichert einen Charakter; Seite A (unveraendert, damit veraltet) wird geschlossen bzw. neu
 * geladen. Vorher schrieb der beforeunload-Handler in systems/avatars.js As alten Stand
 * unbedingt zurueck.
 *
 * Wichtig: page.close() ohne { runBeforeUnload: true } ueberspringt beforeunload — der Test
 * waere dann ohne Aussage. Ebenso muss A Bs Schreibvorgang ueberhaupt sehen (geteilter
 * Speicher), sonst ist der Test ebenfalls ohne Aussage.
 * Seit der Nachprüfung vom 26.11. laufen die Speichertests über HTTP: unter file://
 * konnte beim Reload der Browser-Speicher wechseln und die Test-Saat erneut laufen.
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
        const pageA = await context.newPage();
        await loadCleanSessionOnce(pageA, httpAppUrl(pageA));
        const pageB = await context.newPage();
        await loadApp(pageB, httpAppUrl(pageB));
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
        const pageA = await context.newPage();
        await loadCleanSessionOnce(pageA, httpAppUrl(pageA));
        const pageB = await context.newPage();
        await loadApp(pageB, httpAppUrl(pageB));
        await bSpeichertHeld(pageB);
        expect(await gespeichert(pageA)).toContain(HELD);

        await pageA.reload();
        await waitForAppReady(pageA);

        // @ts-ignore — App-Global im Seitenkontext
        const namenA = await pageA.evaluate(() => window.D.characters.map(c => c.name));
        expect(namenA).toContain(HELD);
        expect(await gespeichert(pageB)).toContain(HELD);
    });

    test('Gegenprobe (ein Tab): save() und sofort neu laden — der Wert ueberlebt (Sicherheitsnetz beim Verlassen)', async ({
        page
    }) => {
        // Vor dem App-Listener registrieren: auch am Window-Ziel ist dessen
        // Aufrufreihenfolge relevant. Die Probe darf erst beim Entladen schreiben.
        await page.addInitScript(key => {
            window.addEventListener('beforeunload', event => {
                localStorage.setItem(
                    'r02-unload-proof',
                    JSON.stringify({
                        trusted: event.isTrusted,
                        // @ts-ignore — App-Global im Seitenkontext
                        pending: window.hasExplicitPendingWork(),
                        before: JSON.parse(localStorage.getItem(key)).quickNotes
                    })
                );
            });
        }, KEY);
        await loadCleanSessionOnce(page, httpAppUrl(page));

        // Der Seed hat keinen Zeitstempel. Erst ein bestätigter LocalStorage-Save
        // macht ihn zur führenden Kopie für den synchronen Entladepfad.
        // @ts-ignore — App-Global im Seitenkontext
        expect(await page.evaluate(() => window.saveImmediate())).toMatchObject({
            success: true,
            backend: 'localStorage'
        });

        // Eine echte Nutzeraktion gehört zum Browser-Lebenszyklus. Ohne sie
        // garantiert Chromium beforeunload nicht. Kein Warten auf den Save:
        // Änderung und Reload bleiben im selben Task, vor dem 300-ms-Timer.
        // Auch bei geöffnetem Erststart-Assistenten eine echte Pointer-Aktion.
        await page.mouse.click(5, 5);
        expect(await page.evaluate(() => navigator.userActivation.hasBeenActive)).toBe(true);
        await Promise.all([
            page.waitForEvent('load'),
            page.evaluate(key => {
                window.addEventListener(
                    'beforeunload',
                    () => {
                        const proof = JSON.parse(localStorage.getItem('r02-unload-proof'));
                        proof.after = JSON.parse(localStorage.getItem(key)).quickNotes;
                        localStorage.setItem('r02-unload-proof', JSON.stringify(proof));
                    },
                    { once: true }
                );
                // @ts-ignore — App-Globals im Seitenkontext
                window.D.quickNotes = 'R02-Sicherheitsnetz';
                // @ts-ignore
                window.save();
                window.location.reload();
            }, KEY)
        ]);
        await waitForAppReady(page);

        expect(
            await page.evaluate(() => JSON.parse(localStorage.getItem('r02-unload-proof')))
        ).toEqual({
            trusted: true,
            pending: true,
            before: '',
            after: 'R02-Sicherheitsnetz'
        });
        // @ts-ignore
        expect(await page.evaluate(() => window.D.quickNotes)).toBe('R02-Sicherheitsnetz');
    });
});

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} key
 */
function readCampaignStorage(page, key) {
    return page.evaluate(
        async key => ({
            localStorage: [key, key + '_ts', key + '_rev'].some(
                name => localStorage.getItem(name) !== null
            ),
            // @ts-ignore — App-Globals im Seitenkontext
            indexedDB: Boolean(await window.loadFromIndexedDBFallbackRaw(key)),
            // @ts-ignore
            listed: window.getCampaignIndex().campaigns.some(campaign => campaign.key === key)
        }),
        key
    );
}

test('N63 · Ein alter Tab kann eine gelöschte IndexedDB-Kampagne nicht erneut speichern', async ({
    context
}) => {
    const pageA = await context.newPage();
    await loadCleanSessionOnce(pageA, httpAppUrl(pageA));
    const notesLength = 5 * 1024 * 1024 + 1;
    const created = await pageA.evaluate(length => {
        // @ts-ignore — App-Globals im Seitenkontext
        const data = { ...window.D, quickNotes: 'X'.repeat(length) };
        // @ts-ignore
        return window.addCampaignWithData('Kampagne zum Löschen', data, { activate: true });
    }, notesLength);
    expect(created).toMatchObject({ success: true, backend: 'indexedDB' });
    const key = created.key;
    await pageA.reload();
    await waitForAppReady(pageA);
    const pageB = await context.newPage();
    await loadApp(pageB, httpAppUrl(pageB));
    for (const tab of [pageA, pageB]) {
        const loaded = await tab.evaluate(() => ({
            // @ts-ignore — App-Globals im Seitenkontext
            key: window.getActiveCampaignKey(),
            // @ts-ignore
            notesLength: window.D.quickNotes.length
        }));
        expect(loaded).toEqual({ key, notesLength });
    }
    expect(await readCampaignStorage(pageB, key)).toEqual({
        localStorage: false,
        indexedDB: true,
        listed: true
    });

    const restoredNotes = 'Stand nach dem erneuten Import';
    const exportBeforeDelete = await pageA.evaluate(
        async ({ key, restoredNotes }) => {
            // @ts-ignore — App-Global im Seitenkontext
            const exported = await window.buildFullExport();
            const campaign = exported.campaigns[key];
            campaign.data.quickNotes = restoredNotes;
            return {
                _exportType: exported._exportType,
                campaigns: { [key]: campaign },
                campaignIndex: exported.campaignIndex
            };
        },
        { key, restoredNotes }
    );
    const dialogs = [];
    pageA.on('dialog', async dialog => {
        dialogs.push(dialog.message());
        await dialog.accept();
    });
    // @ts-ignore — App-Global im Seitenkontext
    await pageA.evaluate(() => window.switchView('data'));
    await Promise.all([
        pageA.waitForEvent('load'),
        pageA.getByRole('button', { name: 'Aktive löschen', exact: true }).click()
    ]);
    await waitForAppReady(pageA);
    expect(dialogs[0]).toContain('Kampagne zum Löschen');
    expect(dialogs[1]).toContain('wurde gelöscht');
    const absent = { localStorage: false, indexedDB: false, listed: false };
    expect(await readCampaignStorage(pageB, key)).toEqual(absent);

    const saved = await pageB.evaluate(() => {
        // Der bearbeitete Stand würde wieder in localStorage passen.
        // @ts-ignore — App-Globals im Seitenkontext
        window.D.quickNotes = 'Entwurf im alten Tab';
        // @ts-ignore
        return window.saveImmediate();
    });
    expect.soft(saved).toMatchObject({ success: false });
    const pageC = await context.newPage();
    await loadApp(pageC, httpAppUrl(pageC));
    expect.soft(await readCampaignStorage(pageC, key)).toEqual(absent);

    const imported = await pageA.evaluate(
        // @ts-ignore — App-Global im Seitenkontext
        data => window.importFullExport(data),
        exportBeforeDelete
    );
    expect(imported).toMatchObject({ campaignCount: 1 });
    expect(await readCampaignStorage(pageC, key)).toEqual({
        localStorage: true,
        indexedDB: false,
        listed: true
    });
    // @ts-ignore — App-Global im Seitenkontext
    const savedAfterImport = await pageB.evaluate(() => window.saveImmediate());
    expect.soft(savedAfterImport).toMatchObject({ success: false });

    await pageB.evaluate(() => {
        // @ts-ignore — App-Globals im Seitenkontext
        window.D.quickNotes += ' · Entwurf beim Schließen';
        // @ts-ignore
        window.save();
        window.addEventListener(
            'beforeunload',
            () => localStorage.setItem('n63-beforeunload-fired', '1'),
            { once: true }
        );
    });
    pageB.on('dialog', dialog => dialog.accept());
    const closed = pageB.waitForEvent('close');
    await pageB.close({ runBeforeUnload: true });
    await closed;
    expect(await pageC.evaluate(() => localStorage.getItem('n63-beforeunload-fired'))).toBe('1');

    await pageC.reload();
    await waitForAppReady(pageC);
    // @ts-ignore — App-Global im Seitenkontext
    expect.soft(await pageC.evaluate(() => window.D.quickNotes)).toBe(restoredNotes);
    const savedFromNewTab = await pageC.evaluate(() => {
        // @ts-ignore — App-Globals im Seitenkontext
        window.D.quickNotes += ' · Änderung im frischen Tab';
        // @ts-ignore
        return window.saveImmediate();
    });
    expect(savedFromNewTab).toMatchObject({ success: true, backend: 'localStorage' });
    await pageC.reload();
    await waitForAppReady(pageC);
    // @ts-ignore — App-Global im Seitenkontext
    expect(await pageC.evaluate(() => window.D.quickNotes)).toBe(
        restoredNotes + ' · Änderung im frischen Tab'
    );
});
