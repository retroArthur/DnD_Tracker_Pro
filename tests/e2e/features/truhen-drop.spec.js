import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { waitForAppReady } from '../helpers/test-utils.js';

const app = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const storageKey = 'dnd-tracker-v4';

async function loadChestFixture(page, data = {}) {
    await page.addInitScript(
        ({ key, data }) => {
            if (sessionStorage.getItem('chest-regression-seeded')) return;
            sessionStorage.setItem('chest-regression-seeded', '1');
            localStorage.setItem(
                key,
                JSON.stringify({
                    _version: '99.0.0',
                    settings: { markdownOnboardingSeen: true },
                    randomTables: [],
                    timers: [],
                    shops: [],
                    campaign: {},
                    characters: [{ id: 1, name: 'Alva' }],
                    loot: [],
                    lootChests: [
                        { id: 1, name: 'Fundtruhe', entries: [{ name: 'Fackel', weight: 1 }] }
                    ],
                    ...data
                })
            );
        },
        { key: storageKey, data }
    );
    await page.goto(app);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: 'Truhen', exact: true }).press('Enter');
}

async function pauseChestSave(page, { forceQuota = true } = {}) {
    await page.evaluate(
        ({ key, forceQuota }) => {
            const setItem = window.Storage.prototype.setItem;
            const writeTx = window.idbWriteTx;
            window.Storage.prototype.setItem = function (storageKey, value) {
                if (forceQuota && storageKey === key)
                    throw new window.DOMException('Testquota', 'QuotaExceededError');
                return setItem.call(this, storageKey, value);
            };
            window.idbWriteTx = (stores, ...args) => {
                if (!stores.includes('campaigns')) return writeTx(stores, ...args);
                return new Promise((resolve, reject) => {
                    const restore = () => {
                        window.Storage.prototype.setItem = setItem;
                        window.idbWriteTx = writeTx;
                    };
                    window.resumeChestLocalWrites = () => {
                        window.Storage.prototype.setItem = setItem;
                    };
                    window.rejectChestSave = () => {
                        restore();
                        reject(new window.DOMException('Testabbruch', 'AbortError'));
                    };
                    window.commitChestSave = () => {
                        restore();
                        writeTx(stores, ...args).then(resolve, reject);
                    };
                });
            };
        },
        { key: storageKey, forceQuota }
    );
}

async function assignChestDrop(dialog) {
    await dialog.getByLabel('Charakter', { exact: true }).selectOption('1');
    await dialog.getByRole('button', { name: 'Zuweisen', exact: true }).press('Enter');
}

const campaignIndexKey = 'dnd-tracker-campaigns';
const targetCampaignKey = 'dnd-tracker-v4-truhentest';

async function seedTargetCampaign(page) {
    await page.evaluate(
        ({ storageKey, campaignIndexKey, targetCampaignKey }) => {
            const original = JSON.parse(localStorage.getItem(storageKey));
            localStorage.setItem(
                targetCampaignKey,
                JSON.stringify({
                    ...original,
                    characters: [{ id: 1, name: 'Borin' }],
                    lootChests: []
                })
            );
            localStorage.setItem(
                campaignIndexKey,
                JSON.stringify({
                    active: storageKey,
                    campaigns: [
                        { key: targetCampaignKey, name: 'Zielkampagne', created: Date.now() }
                    ]
                })
            );
            window.renderCampaignList();
        },
        { storageKey, campaignIndexKey, targetCampaignKey }
    );
}

async function prepareCampaignSwitchDuringDrop(page) {
    await loadChestFixture(page);
    await seedTargetCampaign(page);
    await page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true }).click();
    const drop = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
    await pauseChestSave(page);
    await assignChestDrop(drop);
    await page.waitForFunction(() => typeof window.rejectChestSave === 'function');
    await page.keyboard.press('Escape');
    await expect(drop).toBeHidden();
    await page.evaluate(() => window.switchView('data'));
    return page.locator('#campaign-list [data-action="switch-campaign"]').filter({
        hasText: 'Zielkampagne'
    });
}

for (const mode of ['blockiert', 'fehlgeschlagen']) {
    test(`N51 · Die alte Kampagne bleibt aktiv, wenn der Drop-Save ${mode} ist`, async ({
        page,
        context
    }) => {
        const target = await prepareCampaignSwitchDuringDrop(page);
        const dismissed = page.waitForEvent('dialog', { timeout: 10000 }).then(async dialog => {
            await dialog.dismiss();
            expect(dialog.type()).toBe('beforeunload');
        });
        const aborted = page.getByText(/Kampagnenwechsel abgebrochen/).waitFor({
            state: 'visible',
            timeout: 10000
        });
        // Auf dem alten Stand wird hier „Bleiben“ gewählt. Der Fix bricht schon vorher ab.
        const finished = Promise.race([dismissed, aborted]);
        await target.click();
        if (mode === 'fehlgeschlagen') await page.evaluate(() => window.rejectChestSave());
        await finished;

        const state = currentPage =>
            currentPage.evaluate(
                indexKey => ({
                    active: JSON.parse(localStorage.getItem(indexKey)).active,
                    loaded: window.getActiveCampaignKey(),
                    character: window.D.characters[0]?.name,
                    loot: window.D.loot.map(item => item.name),
                    inventory: window.D.characters[0]?.items?.length ?? 0
                }),
                campaignIndexKey
            );
        const original = {
            active: storageKey,
            loaded: storageKey,
            character: 'Alva',
            loot: [],
            inventory: 0
        };
        expect(await state(page)).toEqual(original);
        const fresh = await context.newPage();
        await fresh.goto(app);
        await waitForAppReady(fresh);
        expect(await state(fresh)).toEqual(original);
        await fresh.close();

        if (mode === 'blockiert') {
            await page.evaluate(() => window.commitChestSave());
            await expect
                .poll(() => state(page))
                .toEqual({
                    ...original,
                    loot: ['Fackel'],
                    inventory: 1
                });
        }
    });
}

test('N51 · Ein rechtzeitig bestätigter Drop-Save erlaubt den Kampagnenwechsel', async ({
    page
}) => {
    const target = await prepareCampaignSwitchDuringDrop(page);
    await target.click();
    expect(await page.evaluate(() => window.getCampaignIndex().active)).toBe(storageKey);
    await Promise.all([page.waitForEvent('load'), page.evaluate(() => window.commitChestSave())]);
    await waitForAppReady(page);
    expect(
        await page.evaluate(() => ({
            key: window.getActiveCampaignKey(),
            characters: window.D.characters.map(character => character.name),
            loot: window.D.loot.map(item => item.name)
        }))
    ).toEqual({ key: targetCampaignKey, characters: ['Borin'], loot: [] });

    await page.evaluate(() => window.switchView('data'));
    await Promise.all([
        page.waitForEvent('load'),
        page
            .locator('#campaign-list [data-action="switch-campaign"]')
            .filter({
                hasText: 'Standard-Kampagne'
            })
            .click()
    ]);
    await waitForAppReady(page);
    expect(
        await page.evaluate(() => ({
            key: window.getActiveCampaignKey(),
            loot: window.D.loot.map(item => item.name),
            inventory: window.D.characters[0].items.map(
                ({ id }) => window.D.loot.find(item => item.id === id)?.name
            ),
            weights: window.D.lootChests[0].entries.map(entry => entry.weight)
        }))
    ).toEqual({ key: storageKey, loot: ['Fackel'], inventory: ['Fackel'], weights: [1] });
});

async function prepareQueuedChestUndo(page) {
    await loadChestFixture(page);
    await seedTargetCampaign(page);
    const notesLength = 5 * 1024 * 1024 + 1;
    expect(
        await page.evaluate(length => {
            window.D.quickNotes = 'X'.repeat(length);
            return window.saveImmediate();
        }, notesLength)
    ).toMatchObject({ success: true, backend: 'indexedDB' });

    await page.getByRole('button', { name: '+ Truhe', exact: true }).click();
    const editor = page.locator('#loot-chests-modal');
    await editor.getByLabel('Name der neuen Truhe', { exact: true }).fill('Neue Truhe');
    await editor.getByRole('button', { name: 'Truhe anlegen', exact: true }).click();
    await editor.getByRole('button', { name: 'Fertig', exact: true }).click();
    await expect(editor).toBeHidden();
    expect(await page.evaluate(() => window.D.lootChests.map(chest => chest.name))).toEqual([
        'Fundtruhe',
        'Neue Truhe'
    ]);

    await pauseChestSave(page, { forceQuota: false });
    await page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true }).click();
    const drop = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
    await assignChestDrop(drop);
    await page.waitForFunction(() => typeof window.commitChestSave === 'function');
    await page.keyboard.press('Escape');
    await expect(drop).toBeHidden();
    await page.keyboard.press('Control+z');
    expect(await page.evaluate(() => window.D.lootChests.map(chest => chest.name))).toEqual([
        'Fundtruhe'
    ]);
    return notesLength;
}

test('N53 · Der Kampagnenwechsel wartet bei mehr als 5 MiB auf den Undo-Save', async ({ page }) => {
    const notesLength = await prepareQueuedChestUndo(page);
    await page.evaluate(() => {
        const read = window.loadFromIndexedDBFallbackRaw;
        window.loadFromIndexedDBFallbackRaw = async (...args) => {
            const record = await read(...args);
            // Erst der vorbereitete Drop-Save enthält die Fackel. Dessen Commit muss vor
            // diesem Abgleich liegen, der wartende Undo-Save hat noch keinen Write begonnen.
            if (record && JSON.parse(record.data).loot.length > 0) {
                window.loadFromIndexedDBFallbackRaw = read;
                sessionStorage.setItem('n53-undo-read-started', 'true');
                await new Promise(resolve => setTimeout(resolve, 750));
            }
            return record;
        };
        window.switchView('data');
    });

    await page
        .locator('#campaign-list [data-action="switch-campaign"]')
        .filter({
            hasText: 'Zielkampagne'
        })
        .click();
    expect(await page.evaluate(() => window.getCampaignIndex().active)).toBe(storageKey);
    await Promise.all([page.waitForEvent('load'), page.evaluate(() => window.commitChestSave())]);
    await waitForAppReady(page);
    expect(await page.evaluate(() => window.getActiveCampaignKey())).toBe(targetCampaignKey);
    expect(await page.evaluate(() => sessionStorage.getItem('n53-undo-read-started'))).toBe('true');
    expect(await page.evaluate(() => window.D.characters[0]?.name)).toBe('Borin');

    await page.evaluate(() => window.switchView('data'));
    await Promise.all([
        page.waitForEvent('load'),
        page
            .locator('#campaign-list [data-action="switch-campaign"]')
            .filter({
                hasText: 'Standard-Kampagne'
            })
            .click()
    ]);
    await waitForAppReady(page);
    expect(
        await page.evaluate(() => ({
            key: window.getActiveCampaignKey(),
            notesLength: window.D.quickNotes.length,
            chests: window.D.lootChests.map(chest => chest.name),
            loot: window.D.loot.map(item => item.name),
            inventory: window.D.characters[0].items ?? []
        }))
    ).toEqual({ key: storageKey, notesLength, chests: ['Fundtruhe'], loot: [], inventory: [] });
});

for (const [id, mode] of [
    ['N56', 'Leseabbruch'],
    ['N56', 'Save aus Tab B'],
    ['N59', 'Save aus Tab B ohne Fremdsignal']
]) {
    test(`${id} · ${mode} während des Undo-Saves einer Kampagne über 5 MiB`, async ({
        page,
        context
    }) => {
        const notesLength = await prepareQueuedChestUndo(page);
        await page.evaluate(mode => {
            const read = window.loadFromIndexedDBFallbackRaw;
            window.loadFromIndexedDBFallbackRaw = async (...args) => {
                const record = await read(...args);
                if (record && JSON.parse(record.data).loot.length > 0) {
                    window.loadFromIndexedDBFallbackRaw = read;
                    sessionStorage.setItem('n56-undo-read-started', 'true');
                    await new Promise(resolve => {
                        window.releaseUndoRead = resolve;
                    });
                    if (mode === 'Leseabbruch') {
                        throw new window.DOMException('Testabbruch beim Lesen', 'AbortError');
                    }
                    if (mode === 'Save aus Tab B ohne Fremdsignal') return read(...args);
                }
                return record;
            };
            window.switchView('data');
        }, mode);

        const target = page
            .locator('#campaign-list [data-action="switch-campaign"]')
            .filter({ hasText: 'Zielkampagne' });
        const outcome = Promise.race([
            page.waitForEvent('load', { timeout: 12000 }).then(() => 'gewechselt'),
            page
                .locator('#event-log')
                .getByText(/Kampagnenwechsel abgebrochen/)
                .waitFor({ state: 'visible', timeout: 12000 })
                .then(() => 'abgebrochen')
        ]);
        await target.click();
        await page.evaluate(() => window.commitChestSave());
        await page.waitForFunction(() => typeof window.releaseUndoRead === 'function');

        let tabB;
        if (mode !== 'Leseabbruch') {
            tabB = await context.newPage();
            await tabB.goto(app);
            await waitForAppReady(tabB);
            expect(await tabB.evaluate(() => window.getActiveCampaignKey())).toBe(storageKey);
            if (id === 'N59') {
                await tabB.evaluate(key => {
                    const setItem = window.Storage.prototype.setItem;
                    window.Storage.prototype.setItem = function (name, value) {
                        if (name === key + '_rev') {
                            throw new window.DOMException('Testquota', 'QuotaExceededError');
                        }
                        return setItem.call(this, name, value);
                    };
                    window.broadcastSave = () => {};
                }, storageKey);
            }
            expect(
                await tabB.evaluate(() => {
                    window.D.characters[0].name = 'Alva aus Tab B';
                    return window.saveImmediate();
                })
            ).toMatchObject({ success: true, backend: 'indexedDB' });
            if (id === 'N59') {
                expect(
                    await page.evaluate(key => window.isCampaignStorageStale(key), storageKey)
                ).toBe(false);
            } else {
                await page.waitForFunction(key => window.isCampaignStorageStale(key), storageKey);
            }
        }
        await page.evaluate(() => window.releaseUndoRead());
        expect(await outcome).toBe('abgebrochen');
        expect(
            await page.evaluate(() => ({
                key: window.getActiveCampaignKey(),
                active: window.getCampaignIndex().active,
                checked: sessionStorage.getItem('n56-undo-read-started'),
                pending: window.hasExplicitPendingWork(),
                notesLength: window.D.quickNotes.length,
                chests: window.D.lootChests.map(chest => chest.name),
                loot: window.D.loot.map(item => item.name)
            }))
        ).toEqual({
            key: storageKey,
            active: storageKey,
            checked: 'true',
            pending: true,
            notesLength,
            chests: ['Fundtruhe'],
            loot: []
        });

        if (id === 'N59') {
            await page.bringToFront();
            const messages = page.locator('#event-log');
            const saveFinished = Promise.race([
                messages
                    .getByText(/Speichern abgebrochen.*anderer Tab/)
                    .waitFor({ state: 'visible' }),
                messages.getByText('Gespeichert', { exact: true }).waitFor({ state: 'visible' })
            ]);
            await page.keyboard.press('Control+s');
            await saveFinished;

            const fresh = await context.newPage();
            await fresh.goto(app);
            await waitForAppReady(fresh);
            expect(
                await fresh.evaluate(() => ({
                    key: window.getActiveCampaignKey(),
                    name: window.D.characters[0]?.name,
                    notesLength: window.D.quickNotes.length
                }))
            ).toEqual({ key: storageKey, name: 'Alva aus Tab B', notesLength });
            await fresh.close();
            await expect(messages.getByText(/Speichern abgebrochen.*anderer Tab/)).toBeVisible();
        }

        const dialogs = [];
        page.on('dialog', async dialog => {
            dialogs.push(dialog.message());
            await dialog.accept();
        });
        if (!tabB) {
            expect(await page.evaluate(() => window.saveImmediate())).toMatchObject({
                success: true,
                backend: 'indexedDB'
            });
        }
        await Promise.all([page.waitForEvent('load'), target.click()]);
        await waitForAppReady(page);
        expect(await page.evaluate(() => window.getActiveCampaignKey())).toBe(targetCampaignKey);
        if (tabB) {
            expect(dialogs).toHaveLength(1);
            expect(dialogs[0]).toContain('Sicherungskopie');
            const saved = await tabB.evaluate(async key => {
                const current = JSON.parse((await window.loadFromIndexedDBFallbackRaw(key)).data);
                const backup = (await window.getBackups()).find(entry => entry.kind === 'safety');
                const undo = JSON.parse(backup.data);
                return {
                    name: current.characters[0].name,
                    chests: undo.lootChests.map(chest => chest.name),
                    loot: undo.loot,
                    notesLength: undo.quickNotes.length
                };
            }, storageKey);
            expect(saved).toEqual({
                name: 'Alva aus Tab B',
                chests: ['Fundtruhe'],
                loot: [],
                notesLength
            });
        } else {
            expect(dialogs).toEqual([]);
            expect(
                await page.evaluate(async key => {
                    const { data } = await window.loadFromIndexedDBFallbackRaw(key);
                    return JSON.parse(data).lootChests.map(chest => chest.name);
                }, storageKey)
            ).toEqual(['Fundtruhe']);
        }
    });
}

test('N38: eine Zuweisung wird erst nach erfolgreichem Speichern bestätigt', async ({ page }) => {
    await loadChestFixture(page);
    await page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true }).press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
    const confirmation = dialog.getByText('Fackel wurde Alva zugewiesen.', { exact: true });
    const reroll = dialog.getByRole('button', { name: 'Noch einmal würfeln', exact: true });
    await pauseChestSave(page);
    await assignChestDrop(dialog);
    await page.waitForFunction(() => typeof window.rejectChestSave === 'function');
    await expect(confirmation).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Zuweisen', exact: true })).toBeDisabled();
    await expect(reroll).toBeDisabled();
    await page.evaluate(() => window.rejectChestSave());
    await expect(dialog.getByText('Speichern fehlgeschlagen.', { exact: false })).toBeVisible();
    await expect(confirmation).toHaveCount(0);
    await expect(reroll).toBeDisabled();

    await dialog.getByRole('button', { name: 'Erneut speichern', exact: true }).press('Enter');
    await expect(confirmation).toBeVisible();
    await expect(reroll).toBeEnabled();
    await page.reload();
    await waitForAppReady(page);
    const persisted = await page.evaluate(() => ({
        copies: window.D.loot.map(({ name }) => name),
        inventory: window.D.characters[0].items.map(
            ({ id }) => window.D.loot.find(item => item.id === id)?.name
        ),
        weights: window.D.lootChests[0].entries.map(({ weight }) => weight)
    }));
    expect(persisted).toEqual({ copies: ['Fackel'], inventory: ['Fackel'], weights: [1] });
});

test('N46 · Nach Speicherfehler und erneutem Öffnen entsteht nur eine Kopie', async ({ page }) => {
    await loadChestFixture(page);
    const open = page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true });
    await open.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
    await pauseChestSave(page);
    await assignChestDrop(dialog);
    await page.waitForFunction(() => typeof window.rejectChestSave === 'function');
    await page.evaluate(() => window.rejectChestSave());
    await expect(dialog.getByText('Speichern fehlgeschlagen.', { exact: false })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await open.press('Enter');
    await assignChestDrop(dialog);
    await expect(dialog.getByText('Fackel wurde Alva zugewiesen.', { exact: true })).toBeVisible();
    await page.reload();
    await waitForAppReady(page);
    const persisted = await page.evaluate(() => ({
        loot: window.D.loot.map(item => item.name),
        items: window.D.characters[0].items.map(
            ({ id }) => window.D.loot.find(item => item.id === id)?.name
        )
    }));
    expect(persisted).toEqual({ loot: ['Fackel'], items: ['Fackel'] });
});

test('N46 · Ein Gewichtssave übernimmt keinen fehlgeschlagenen Drop', async ({ page }) => {
    await loadChestFixture(page);
    const editor = await openChests(page, 'Fundtruhe');
    await editor.getByRole('button', { name: 'Drop', exact: true }).press('Enter');
    await pauseChestSave(page);
    await assignChestDrop(editor);
    await page.waitForFunction(() => typeof window.rejectChestSave === 'function');
    await page.evaluate(() => window.rejectChestSave());
    await expect(editor.getByText('Speichern fehlgeschlagen.', { exact: false })).toBeVisible();
    await editor.getByLabel('Drop-Gewicht für Fackel', { exact: true }).fill('2');
    await editor.getByRole('button', { name: 'Gewicht speichern für Fackel' }).press('Enter');
    const stored = () =>
        page.evaluate(key => {
            const data = JSON.parse(localStorage.getItem(key));
            return {
                loot: data.loot.length,
                items: data.characters[0].items?.length ?? 0,
                weight: data.lootChests[0].entries[0].weight
            };
        }, storageKey);
    await expect.poll(stored).toEqual({ loot: 0, items: 0, weight: 2 });
});

for (const commits of [false, true]) {
    test(`N46 · Strg+S während eines ${commits ? 'bestätigten' : 'abgebrochenen'} Drop-Saves`, async ({
        page
    }) => {
        await loadChestFixture(page);
        await page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true }).press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
        await pauseChestSave(page);
        await assignChestDrop(dialog);
        await page.waitForFunction(() => typeof window.rejectChestSave === 'function');
        await page.evaluate(() => {
            window.resumeChestLocalWrites();
            window.D.campaign.name = 'Parallel gespeichert';
        });
        await page.keyboard.press('Control+s');
        await page.evaluate(commits => {
            if (commits) window.commitChestSave();
            else window.rejectChestSave();
        }, commits);
        const expected = commits
            ? 'Fackel wurde Alva zugewiesen.'
            : 'Speichern fehlgeschlagen. Versuche es erneut.';
        await expect(dialog.getByText(expected, { exact: true })).toBeVisible();
        await expect
            .poll(() =>
                page.evaluate(key => {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    return {
                        campaign: data.campaign?.name,
                        loot: data.loot?.length,
                        items: data.characters?.[0].items?.length ?? 0
                    };
                }, storageKey)
            )
            .toEqual({
                campaign: 'Parallel gespeichert',
                loot: Number(commits),
                items: Number(commits)
            });
    });
}

test('N39: ein Drop erhält Eigenschaften und Absätze ohne das ursprüngliche Item', async ({
    page
}) => {
    const item = {
        id: 1,
        name: 'Silberring',
        category: 'rings',
        rarity: 'rare',
        quantity: 4,
        weight: 2,
        value: 40,
        description: '<p>Erste Zeile</p><p>Zweite Zeile</p>',
        origin: 'campaign',
        special: 'Leuchtet im Dunkeln',
        property: '+1 Angriff',
        tags: ['attunement'],
        attunement: true
    };
    await loadChestFixture(page, {
        loot: [item],
        lootChests: [{ id: 1, name: 'Fundtruhe', entries: [] }]
    });
    await page.getByRole('button', { name: 'Fundtruhe bearbeiten', exact: true }).press('Enter');
    const editor = page.locator('#loot-chests-modal');
    await editor.getByLabel('Gegenstand', { exact: true }).selectOption('1');
    await editor.locator('#loot-chest-weight').fill('3');
    await editor.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).press('Enter');
    await editor.getByRole('button', { name: 'Fertig', exact: true }).press('Enter');
    await expect(editor).toBeHidden();

    await page.getByRole('button', { name: 'Items', exact: true }).press('Enter');
    await page.locator('#loot-list .loot-item').filter({ hasText: 'Silberring' }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#loot-detail-panel [data-action="delete-loot"]').press('Enter');
    await page.evaluate(() => window.saveImmediate());
    await page.reload();
    await waitForAppReady(page);
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: 'Truhen', exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true }).press('Enter');

    const drop = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
    const result = drop.locator('#loot-chest-quick-drop-result');
    await expect(result.getByText('Erste Zeile', { exact: true })).toBeVisible();
    await expect(result.getByText('Zweite Zeile', { exact: true })).toBeVisible();
    await drop.getByLabel('Charakter', { exact: true }).selectOption('1');
    await drop.getByRole('button', { name: 'Zuweisen', exact: true }).press('Enter');
    await expect(result).toContainText('Silberring wurde Alva zugewiesen.');
    await page.reload();
    await waitForAppReady(page);
    const saved = await page.evaluate(() => {
        const [reference] = window.D.characters[0].items;
        return {
            loot: window.D.loot,
            reference,
            dropWeight: window.D.lootChests[0].entries[0].weight
        };
    });
    const { id: sourceId, ...properties } = item;
    expect(saved.loot).toHaveLength(1);
    expect(saved.loot[0]).toMatchObject({ ...properties, quantity: 1 });
    expect(saved.loot[0].id).not.toBe(sourceId);
    expect(saved.reference).toEqual({ id: saved.loot[0].id, quantity: 1 });
    expect(saved.dropWeight).toBe(3);
});

test('N40: eine importierte Vorlage bleibt ohne Quellitem unverlinkt und würfelbar', async ({
    page
}) => {
    await loadChestFixture(page, {
        loot: [
            {
                id: 2,
                name: 'Silberring',
                category: 'rings',
                rarity: 'rare',
                description: 'Kleine Gravur',
                quantity: 1
            }
        ]
    });
    const data = {
        _dataType: 'loot',
        _version: '2.6.1',
        data: [],
        lootChests: [
            {
                id: 17,
                name: 'Importtruhe',
                entries: [
                    {
                        name: 'Silberring',
                        category: 'rings',
                        rarity: 'rare',
                        description: 'Kleine Gravur',
                        weight: 1,
                        sourceItemId: 91
                    }
                ]
            }
        ]
    };
    await page.locator('#import-loot').setInputFiles({
        name: 'importtruhe.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(data))
    });
    const importDialog = page.locator('#import-modal');
    await importDialog.getByRole('button', { name: 'Importieren', exact: true }).press('Enter');
    await expect(importDialog).toBeHidden();
    await page.reload();
    await waitForAppReady(page);
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: 'Truhen', exact: true }).press('Enter');

    const templates = page.getByRole('region', { name: 'Drop-Vorlagen' });
    await templates.getByRole('button', { name: 'Importtruhe', exact: true }).press('Enter');
    await expect(templates.getByText('Silberring', { exact: true })).toBeVisible();
    await expect(templates.getByRole('button', { name: 'Silberring', exact: true })).toHaveCount(0);
    await templates
        .getByRole('button', { name: 'Drop aus Importtruhe', exact: true })
        .press('Enter');
    await expect(page.locator('#loot-chest-quick-drop-result strong')).toHaveText('Silberring');
});

test('N41: Undo im offenen Drop-Dialog entfernt die Bestätigung und erlaubt einen Neuwurf', async ({
    page
}) => {
    await loadChestFixture(page);
    await page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true }).press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
    const confirmation = dialog.getByText('Fackel wurde Alva zugewiesen.', { exact: true });
    const reroll = dialog.getByRole('button', { name: 'Noch einmal würfeln', exact: true });
    await dialog.getByLabel('Charakter', { exact: true }).selectOption('1');
    await dialog.getByRole('button', { name: 'Zuweisen', exact: true }).press('Enter');
    await expect(confirmation).toBeVisible();
    await expect(reroll).toBeFocused();

    await page.keyboard.press('Control+z');
    await expect(confirmation).toHaveCount(0);
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => window.D.loot)).toEqual([]);
    await reroll.press('Enter');
    await expect(dialog.locator('#loot-chest-quick-drop-result strong')).toHaveText('Fackel');
    await dialog.getByLabel('Charakter', { exact: true }).selectOption('1');
    await dialog.getByRole('button', { name: 'Zuweisen', exact: true }).press('Enter');
    await expect(confirmation).toBeVisible();
    expect(await page.evaluate(() => window.D.loot.map(item => item.name))).toEqual(['Fackel']);
});

test('N42 · Ein abgebrochener Truhenname bleibt beim erneuten Öffnen verworfen', async ({
    page
}) => {
    await loadChestFixture(page, { loot: [{ id: 1, name: 'Fackel', category: 'misc' }] });
    await page.getByRole('button', { name: 'Items', exact: true }).press('Enter');
    await page.locator('#loot-list .loot-item').filter({ hasText: 'Fackel' }).click();
    const place = page.getByRole('button', { name: 'Fackel in Truhe legen', exact: true });
    const editor = page.locator('#loot-chests-modal');
    const name = editor.getByLabel('Name der neuen Truhe', { exact: true });
    await place.press('Enter');
    await name.fill('Verworfener Entwurf');
    await page.keyboard.press('Escape');
    await expect(editor).toBeHidden();

    await place.press('Enter');
    await expect(name).toHaveValue('');
    const item = editor.getByLabel('Gegenstand', { exact: true });
    await expect(item).toHaveValue('1');
    await item.selectOption('');
    await editor.getByRole('button', { name: 'Fertig', exact: true }).press('Enter');
    await expect(editor).toBeHidden();
    expect(await page.evaluate(() => window.D.lootChests.map(chest => chest.name))).toEqual([
        'Fundtruhe'
    ]);
});

test('N43 · Fertig lässt einen ausgewählten Gegenstand zum Hinzufügen stehen', async ({ page }) => {
    await loadChestFixture(page, { loot: [{ id: 2, name: 'Silberring', category: 'rings' }] });
    const editor = await openChests(page, 'Fundtruhe');
    const item = editor.getByLabel('Gegenstand', { exact: true });
    const finish = editor.getByRole('button', { name: 'Fertig', exact: true });
    const weight = editor.locator('#loot-chest-weight');
    await item.selectOption('2');
    await weight.fill('2.5');
    await finish.press('Enter');

    await expect(editor).toBeVisible();
    const status = editor.locator('#loot-chest-finish-status');
    await expect(status).toContainText('Gegenstand hinzufügen');
    await expect(item).toHaveValue('2');
    await expect(weight).toHaveValue('2.5');
    expect(await page.evaluate(() => window.D.lootChests[0].entries.length)).toBe(1);
    await editor.getByRole('button', { name: 'Drop', exact: true }).press('Enter');
    await expect(status).toContainText('Gegenstand hinzufügen');
    await expect(editor.locator('#loot-chest-drop-result')).toBeEmpty();
    await editor.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).press('Enter');
    await finish.press('Enter');
    await expect(editor).toBeHidden();
    const entries = await page.evaluate(() =>
        window.D.lootChests[0].entries.map(({ name, weight }) => ({ name, weight }))
    );
    expect(entries).toEqual([
        { name: 'Fackel', weight: 1 },
        { name: 'Silberring', weight: 2.5 }
    ]);
});

test('N43 · Drop wartet auf das geänderte Gewicht einer Truhenzeile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await loadChestFixture(page, {
        lootChests: [
            {
                id: 1,
                name: 'Fundtruhe',
                entries: [
                    { name: 'Fackel', weight: 1 },
                    { name: 'Silberring', weight: 1 }
                ]
            }
        ]
    });
    await page.getByRole('button', { name: 'Fundtruhe bearbeiten', exact: true }).press('Enter');
    const editor = page.locator('#loot-chests-modal');
    await page.evaluate(() => {
        Math.random = () => 0;
    });
    const weight = editor.getByLabel('Drop-Gewicht für Fackel', { exact: true });
    const drop = editor.getByRole('button', { name: 'Drop', exact: true });
    const result = editor.locator('#loot-chest-drop-result');
    await weight.fill('0');
    await drop.press('Enter');
    const status = editor.locator('#loot-chest-finish-status');
    await expect(status).toContainText('Speichere das Drop-Gewicht für „Fackel“');
    await expect(status).toBeInViewport();
    await expect(result).toBeEmpty();
    await expect(weight).toHaveValue('0');
    expect(await page.evaluate(() => window.D.lootChests[0].entries[0].weight)).toBe(1);

    await editor.getByRole('button', { name: 'Gewicht speichern für Fackel' }).press('Enter');
    await drop.press('Enter');
    await expect(result.locator('strong')).toHaveText('Silberring');
    await expect(status).toBeEmpty();
});

test('N47 · Zielwechsel behält die Item-Auswahl und schützt offene Truhenänderungen', async ({
    page
}) => {
    await loadChestFixture(page, {
        loot: [
            { id: 1, name: 'Fackel', category: 'misc', quantity: 1 },
            { id: 2, name: 'Silberring', category: 'rings', quantity: 1 }
        ],
        lootChests: [
            { id: 1, name: 'Fundtruhe', entries: [{ name: 'Fackel', weight: 1 }] },
            { id: 2, name: 'Vorratskiste', entries: [] }
        ]
    });
    await page.getByRole('button', { name: 'Items', exact: true }).press('Enter');
    await page.locator('#loot-list .loot-item').filter({ hasText: 'Fackel' }).click();
    await page.getByRole('button', { name: 'Fackel in Truhe legen', exact: true }).press('Enter');
    const editor = page.locator('#loot-chests-modal');
    const target = editor.getByLabel('Truhe auswählen', { exact: true });
    const item = editor.getByLabel('Gegenstand', { exact: true });
    const newWeight = editor.locator('#loot-chest-weight');
    const oldWeight = editor.getByLabel('Drop-Gewicht für Fackel', { exact: true });
    const name = editor.getByLabel('Truhenname', { exact: true });
    await expect(target).toHaveValue('1');
    await item.selectOption('2');
    await newWeight.fill('2.5');
    await oldWeight.fill('3');
    await name.fill('Fundtruhe Nord');
    await target.selectOption('2');
    await expect(target).toHaveValue('1');
    await expect(editor.locator('#loot-chest-finish-status')).toContainText('Truhe wechselst');
    await expect(oldWeight).toHaveValue('3');
    await expect(name).toHaveValue('Fundtruhe Nord');
    await expect(item).toHaveValue('2');
    await expect(newWeight).toHaveValue('2.5');

    await editor.getByRole('button', { name: 'Name speichern', exact: true }).press('Enter');
    await editor.getByRole('button', { name: 'Gewicht speichern für Fackel' }).press('Enter');
    await target.selectOption('2');
    await expect(target).toHaveValue('2');
    await expect(item).toHaveValue('2');
    await expect(newWeight).toHaveValue('2.5');
    await editor.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).press('Enter');
    expect(
        await page.evaluate(() =>
            window.D.lootChests.map(chest => ({
                name: chest.name,
                entries: chest.entries.map(({ name, weight }) => ({ name, weight }))
            }))
        )
    ).toEqual([
        { name: 'Fundtruhe Nord', entries: [{ name: 'Fackel', weight: 3 }] },
        { name: 'Vorratskiste', entries: [{ name: 'Silberring', weight: 2.5 }] }
    ]);
});

test('N45 · Nach dem Löschen bleibt der Tastaturfokus bei den Drop-Vorlagen', async ({ page }) => {
    await loadChestFixture(page, {
        lootChests: [
            { id: 1, name: 'Lager', entries: [] },
            { id: 2, name: 'Fundtruhe', entries: [] },
            { id: 3, name: 'Vorratskiste', entries: [] }
        ]
    });
    const editor = page.locator('#loot-chests-modal');
    await page.getByRole('button', { name: 'Fundtruhe bearbeiten', exact: true }).press('Enter');
    for (const next of ['Vorratskiste bearbeiten', 'Lager bearbeiten', '+ Truhe']) {
        await expect(editor).toBeVisible();
        page.once('dialog', dialog => dialog.accept());
        await editor.getByRole('button', { name: 'Truhe löschen', exact: true }).press('Enter');
        await expect(editor).toBeHidden();
        await expect(page.getByRole('button', { name: next, exact: true })).toBeFocused();
        await page.keyboard.press('Enter');
    }
    await expect(editor.getByLabel('Name der neuen Truhe', { exact: true })).toBeFocused();
});

async function openChests(page, templateName) {
    await page.evaluate(() => window.switchView('loot'));
    const switchToTemplates = page.getByRole('button', { name: 'Truhen', exact: true });
    if (await switchToTemplates.isVisible()) await switchToTemplates.click({ timeout: 4000 });
    const name = templateName ? `${templateName} bearbeiten` : '+ Truhe';
    await page.getByRole('button', { name, exact: true }).click({ timeout: 4000 });
    const modal = page.locator('#loot-chests-modal');
    await expect(modal).toBeVisible();
    return modal;
}

test('Bearbeiten zeigt nur die gewählte Truhe und kehrt nach dem Löschen zur Liste zurück', async ({
    page
}) => {
    await page.addInitScript(key => {
        localStorage.setItem(
            key,
            JSON.stringify({
                loot: [],
                lootChests: [
                    { id: 1, name: 'Kupfermine', entries: [{ name: 'Heiltrank', weight: 1 }] },
                    { id: 2, name: 'Waldversteck', entries: [{ name: 'Fackel', weight: 1 }] }
                ],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await waitForAppReady(page);

    const modal = await openChests(page);
    const newName = modal.getByLabel('Name der neuen Truhe', { exact: true });
    await newName.fill('Verworfener Entwurf');
    await page.keyboard.press('Escape');
    await openChests(page, 'Waldversteck');

    const picker = modal.getByLabel('Truhe auswählen', { exact: true });
    const chestName = modal.getByLabel('Truhenname', { exact: true });
    const entries = modal.locator('#loot-chest-entries');
    await expect(newName).toBeHidden({ timeout: 3000 });
    await expect(picker).toBeHidden();
    await expect(chestName).toHaveValue('Waldversteck');
    await expect(entries.locator('.loot-chest-entry strong')).toHaveText(['Fackel']);
    await page.evaluate(() => window.renderLootChests());
    await expect(newName).toBeHidden();
    await expect(picker).toBeHidden();

    await chestName.fill('Waldversteck Nord');
    await modal.locator('#loot-chest-entry-weight-0').fill('2.5');
    await modal.getByRole('button', { name: 'Fertig', exact: true }).click();
    await expect(modal).toBeHidden();
    expect(
        await page.evaluate(() =>
            window.D.lootChests.map(chest => [chest.name, chest.entries[0].weight])
        )
    ).toEqual([
        ['Kupfermine', 1],
        ['Waldversteck Nord', 2.5]
    ]);

    await openChests(page, 'Waldversteck Nord');
    page.once('dialog', dialog => dialog.accept());
    await modal.getByRole('button', { name: 'Truhe löschen', exact: true }).click();
    await expect(modal).toBeHidden();
    await expect(
        page.getByRole('button', { name: 'Kupfermine bearbeiten', exact: true })
    ).toBeVisible();
});

test('+ Truhe beginnt leer und zeigt nach dem Anlegen nur die neue Truhe', async ({ page }) => {
    await page.addInitScript(key => {
        localStorage.setItem(
            key,
            JSON.stringify({
                loot: [{ id: 1, name: 'Fackel', category: 'misc', quantity: 1 }],
                lootChests: [
                    { id: 1, name: 'Kupfermine', entries: [{ name: 'Heiltrank', weight: 1 }] }
                ],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await waitForAppReady(page);

    const modal = await openChests(page, 'Kupfermine');
    const chest = modal.getByLabel('Truhe auswählen', { exact: true });
    const name = modal.getByLabel('Name der neuen Truhe', { exact: true });
    const entries = modal.locator('#loot-chest-entries');
    const close = modal.getByRole('button', { name: 'Truhen schließen' });
    await expect(modal.getByLabel('Truhenname', { exact: true })).toHaveValue('Kupfermine');
    await expect(entries).toContainText('Heiltrank');
    await close.click();

    await openChests(page);
    await expect(chest).toBeHidden();
    await expect(entries).toBeHidden();
    await expect(name).toHaveValue('');
    await expect(name).toBeFocused();
    await page.evaluate(() => window.renderLootChests());
    await expect(entries).toBeHidden();
    await name.fill('Verworfener Entwurf');
    await close.click();

    await openChests(page);
    await expect(name).toHaveValue('');
    await expect(chest).toBeHidden();
    await name.fill('Waldversteck');
    await modal.getByRole('button', { name: 'Truhe anlegen', exact: true }).click();
    await expect(name).toBeHidden({ timeout: 3000 });
    await expect(chest).toBeHidden();
    await expect(modal.getByLabel('Truhenname', { exact: true })).toHaveValue('Waldversteck');
    await expect(entries).toBeVisible();
    await expect(entries).toContainText('Die Truhe ist leer.');
    const item = modal.getByLabel('Gegenstand', { exact: true });
    await expect(item).toBeFocused();
    await item.selectOption('1');
    await modal.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).click();
    await expect(entries.locator('.loot-chest-entry strong')).toHaveText(['Fackel']);
    await close.click();
    await openChests(page, 'Kupfermine');
    await expect(entries.locator('.loot-chest-entry strong')).toHaveText(['Heiltrank']);
});

test('ein Vorlagen-Drop lässt sich im kompakten Ergebnisdialog neu würfeln und zuweisen', async ({
    page
}) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.addInitScript(key => {
        localStorage.setItem(
            key,
            JSON.stringify({
                characters: [
                    { id: 1, name: 'Alva' },
                    { id: 2, name: 'Borin' }
                ],
                loot: [],
                lootChests: [
                    { id: 1, name: 'Lager', entries: [{ name: 'Fackel', weight: 1 }] },
                    {
                        id: 2,
                        name: 'Fundtruhe',
                        entries: [
                            { name: 'Heiltrank', weight: 1 },
                            { name: 'Silberring', weight: 3 }
                        ]
                    }
                ],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.evaluate(() => {
        window.switchView('loot');
        Math.random = () => 0.2;
    });
    await page.getByRole('button', { name: 'Truhen', exact: true }).click();
    const drop = page.getByRole('button', { name: 'Drop aus Fundtruhe', exact: true });
    await drop.click();

    const dialog = page.getByRole('dialog', { name: 'Drop aus Fundtruhe', exact: true });
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#loot-chests-modal')).toBeHidden();
    const result = dialog.locator('#loot-chest-quick-drop-result');
    const reroll = dialog.getByRole('button', { name: 'Noch einmal würfeln', exact: true });
    const character = dialog.getByLabel('Charakter', { exact: true });
    const assign = dialog.getByRole('button', { name: 'Zuweisen', exact: true });
    await expect(result.locator('strong')).toHaveText('Heiltrank');
    await expect(character).toBeInViewport();
    await expect(reroll).toBeInViewport();
    await character.selectOption('2');

    await page.evaluate(() => {
        Math.random = () => 0.25;
    });
    await reroll.click();
    await expect(result.locator('strong')).toHaveText('Silberring');
    await character.selectOption('1');
    await assign.click();
    await expect(result).toContainText('Silberring wurde Alva zugewiesen.');
    await expect(assign).toBeHidden();

    await reroll.click();
    await expect(result.locator('strong')).toHaveText('Silberring');
    await expect(assign).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(key => {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                return {
                    inventory: data.characters?.map(ch =>
                        (ch.items || []).map(
                            item => data.loot.find(loot => loot.id === item.id)?.name
                        )
                    ),
                    weights: data.lootChests
                        ?.find(chest => chest.id === 2)
                        ?.entries.map(entry => entry.weight)
                };
            }, storageKey)
        )
        .toEqual({ inventory: [['Silberring'], []], weights: [1, 3] });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(drop).toBeFocused();
});

test('Fertig speichert die kompakten Truheneinträge und die Vorschau öffnet das richtige Item', async ({
    page
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(key => {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(
            key,
            JSON.stringify({
                loot: [
                    {
                        id: 1,
                        name: 'Heiltrank',
                        category: 'potions',
                        rarity: 'normal',
                        quantity: 1
                    },
                    {
                        id: 2,
                        name: 'Heiltrank',
                        category: 'potions',
                        rarity: 'normal',
                        quantity: 1,
                        value: 40
                    },
                    { id: 3, name: 'Fackel', category: 'misc', quantity: 1 }
                ],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await waitForAppReady(page);
    await page.evaluate(() => window.switchView('loot'));
    await page.locator('#loot-search').fill('Fackel');
    const modal = await openChests(page);
    const hint = page.locator('#loot-chest-templates-empty');
    await expect(hint).toBeVisible();
    expect((await hint.boundingBox()).height).toBeLessThan(64);

    await modal.getByLabel('Name der neuen Truhe').fill('Kupfermine');
    await modal.getByRole('button', { name: 'Truhe anlegen', exact: true }).click();
    await expect(hint).toBeHidden();
    const firstWeight = modal.locator('#loot-chest-entry-weight-0');
    for (const id of ['2', '3']) {
        await modal.getByLabel('Gegenstand', { exact: true }).selectOption(id);
        await modal.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).click();
        if (id === '2') await firstWeight.fill('0.5');
    }
    await expect(firstWeight).toHaveValue('0.5');
    const firstRow = modal.locator('#loot-chest-entries > li').first();
    expect((await firstRow.boundingBox()).height).toBeLessThan(60);
    await modal.getByLabel('Truhenname', { exact: true }).fill('Phandalin - Kupfermine');
    const finish = modal.getByRole('button', { name: 'Fertig', exact: true });
    await firstWeight.fill('1000001');
    await finish.click();
    await expect(modal).toBeVisible();
    await expect(firstWeight).toBeFocused();
    await expect(modal.locator('#loot-chest-select option:checked')).toHaveText('Kupfermine');
    await firstWeight.fill('0.5');
    await modal.locator('#loot-chest-entry-weight-1').fill('1.5');
    await finish.click();
    await expect(modal).toBeHidden();
    const templates = page.getByRole('region', { name: 'Drop-Vorlagen' });
    await templates.getByRole('button', { name: 'Phandalin - Kupfermine', exact: true }).click();
    const previewRows = templates.locator('.loot-chest-preview-entry');
    const potion = previewRows.filter({ hasText: 'Heiltrank' });
    await expect(potion).toContainText('25 %');
    await expect(previewRows.filter({ hasText: 'Fackel' })).toContainText('75 %');
    await templates.getByRole('button', { name: 'Heiltrank', exact: true }).click();
    await expect(page.locator('#loot-list .loot-item.selected')).toHaveAttribute('data-id', '2');
    await expect(page.locator('#loot-detail-panel')).toContainText('40 GM');

    await page.reload();
    await waitForAppReady(page);
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: 'Truhen', exact: true }).click();
    await templates.getByRole('button', { name: 'Phandalin - Kupfermine', exact: true }).click();
    await expect(potion).toContainText('25 %');
    await templates.getByRole('button', { name: 'Heiltrank', exact: true }).click();
    await expect(page.locator('#loot-list .loot-item.selected')).toHaveAttribute('data-id', '2');
});

test('eine benannte Truhe erscheint als Drop-Vorlage und lässt sich aus der Liste würfeln', async ({
    page
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(key => {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(
            key,
            JSON.stringify({
                loot: [
                    { id: 1, name: 'Fackel', category: 'misc', quantity: 1 },
                    { id: 2, name: 'Silberring', category: 'rings', quantity: 1 }
                ],
                lootChests: [
                    {
                        id: 1,
                        name: 'Lager',
                        entries: [{ name: 'Fackel', weight: 1 }]
                    }
                ],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.evaluate(() => window.switchView('loot'));

    const items = page.locator('#loot-list');
    const templates = page.getByRole('region', { name: 'Drop-Vorlagen' });
    const modal = page.locator('#loot-chests-modal');
    const close = modal.getByRole('button', { name: 'Truhen schließen' });
    const roll = templates.getByRole('button', { name: 'Drop aus Miene - Phandalin' });
    const resultDialog = page.getByRole('dialog', { name: 'Drop aus Miene - Phandalin' });
    const dropResult = resultDialog.locator('#loot-chest-quick-drop-result strong');
    await expect(items).toBeVisible();
    await page.getByRole('button', { name: 'Truhen', exact: true }).click();
    await expect(templates).toBeVisible({ timeout: 3000 });
    await expect(items).toBeHidden();
    await expect(templates.getByRole('heading', { name: 'Lager', exact: true })).toBeVisible();

    await templates.getByRole('button', { name: 'Lager', exact: true }).click();
    await templates.getByRole('button', { name: 'Fackel', exact: true }).click();
    await expect(items.locator('.loot-item.selected')).toHaveAttribute('data-id', '1');
    await page.getByRole('button', { name: 'Truhen', exact: true }).click();

    await templates.getByRole('button', { name: 'Lager bearbeiten', exact: true }).click();
    const chestName = modal.getByLabel('Truhenname', { exact: true });
    await expect(chestName).toHaveValue('Lager');
    await chestName.fill('Vorratslager');
    await modal.getByRole('button', { name: 'Name speichern', exact: true }).click();
    await close.click();
    await expect(
        templates.getByRole('heading', { name: 'Vorratslager', exact: true })
    ).toBeVisible();

    await page.getByRole('button', { name: '+ Truhe', exact: true }).click();
    await modal.getByLabel('Name der neuen Truhe').fill('Miene - Phandalin');
    await modal.getByRole('button', { name: 'Truhe anlegen', exact: true }).click();
    await modal.getByLabel('Gegenstand', { exact: true }).selectOption('2');
    await modal.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).click();
    await close.click();
    await expect(
        templates.getByRole('heading', { name: 'Miene - Phandalin', exact: true })
    ).toBeVisible();

    await roll.click();
    await expect(dropResult).toHaveText('Silberring');
    await resultDialog.getByRole('button', { name: 'Drop schließen' }).click();
    await expect(roll).toBeFocused();

    await page.getByRole('button', { name: 'Items', exact: true }).click();
    await expect(items).toBeVisible();
    await expect(templates).toBeHidden();
    await expect(page.getByRole('button', { name: '+ Item', exact: true })).toBeVisible();

    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: 'Truhen', exact: true }).click();
    await roll.click();
    await expect(dropResult).toHaveText('Silberring');
});

test('ein ausgewähltes Item lässt sich aus seiner Detailansicht in eine andere Truhe legen', async ({
    page
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(key => {
        if (sessionStorage.getItem('loot-assignment-seeded')) return;
        sessionStorage.setItem('loot-assignment-seeded', '1');
        localStorage.setItem(
            key,
            JSON.stringify({
                loot: [
                    { id: 1, name: 'Fackel', category: 'misc', quantity: 1 },
                    { id: 2, name: 'Silberring', category: 'rings', quantity: 2 }
                ],
                lootChests: [
                    { id: 1, name: 'Lager', entries: [] },
                    { id: 2, name: 'Schmugglertruhe', entries: [] }
                ],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.evaluate(() => window.switchView('loot'));
    await page.locator('#loot-list .loot-item').filter({ hasText: 'Silberring' }).click();
    const detailActions = page.locator('#loot-detail-panel .loot-detail-actions');
    const action = { name: 'Silberring in Truhe legen', exact: true };
    await expect(
        page.locator('#view-loot .section-toolbar').getByRole('button', action)
    ).toHaveCount(0);
    await detailActions.getByRole('button', action).click({ timeout: 3000 });

    const modal = page.locator('#loot-chests-modal');
    const chest = modal.getByLabel('Truhe auswählen', { exact: true });
    const item = modal.getByLabel('Gegenstand', { exact: true });
    await expect(item).toHaveValue('2');
    await chest.selectOption({ label: 'Schmugglertruhe' });
    await expect(item).toHaveValue('2');
    await modal.locator('#loot-chest-weight').fill('2.5');
    await modal.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).click();
    await expect(modal.locator('#loot-chest-entries')).toContainText('Silberring');
    await expect
        .poll(() =>
            page.evaluate(key => {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                return {
                    quantity: data.loot?.find(entry => entry.id === 2)?.quantity,
                    chests: data.lootChests?.map(target =>
                        target.entries.map(({ name, weight }) => ({ name, weight }))
                    )
                };
            }, storageKey)
        )
        .toEqual({ quantity: 2, chests: [[], [{ name: 'Silberring', weight: 2.5 }]] });

    await page.reload();
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await openChests(page, 'Schmugglertruhe');
    await expect(modal.locator('#loot-chest-entries')).toContainText('Silberring');
    await expect(modal.locator('#loot-chest-entry-weight-0')).toHaveValue('2.5');
});

test('beim Anlegen kann das gespeicherte Item direkt in die erste Truhe gelegt werden', async ({
    page
}) => {
    await page.addInitScript(key => {
        localStorage.setItem(key, JSON.stringify({ loot: [], lootChests: [], _version: '99.0.0' }));
    }, storageKey);
    await page.goto(app);
    await waitForAppReady(page);
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: '+ Item', exact: true }).click();
    const editor = page.locator('#loot-modal');
    await editor.locator('#loot-name').fill('Sternenstaub');
    await editor.getByRole('button', { name: 'Speichern & Truhe wählen' }).click({ timeout: 3000 });
    await expect(editor).toBeHidden();

    const modal = page.locator('#loot-chests-modal');
    await modal.getByLabel('Name der neuen Truhe', { exact: true }).fill('Astralkiste');
    await modal.getByRole('button', { name: 'Truhe anlegen' }).click();
    await expect(modal.getByLabel('Name der neuen Truhe', { exact: true })).toBeHidden();
    await expect(modal.getByLabel('Truhe auswählen', { exact: true })).toBeHidden();
    await expect(modal.locator('#loot-chest-item option:checked')).toHaveText('Sternenstaub');
    await modal.getByRole('button', { name: 'Gegenstand hinzufügen', exact: true }).click();
    await expect(modal.locator('#loot-chest-entries')).toContainText('Sternenstaub');
    await expect(modal.locator('#loot-chest-entry-weight-0')).toHaveValue('1');
    await modal.getByRole('button', { name: 'Drop', exact: true }).click();
    await expect(modal.locator('#loot-chest-drop-result strong')).toHaveText('Sternenstaub');

    await modal.getByRole('button', { name: 'Truhen schließen' }).click();
    await page.getByRole('button', { name: '+ Item', exact: true }).click();
    await editor.locator('#loot-name').fill('sternenstaub');
    await editor.getByRole('button', { name: 'Speichern & Truhe wählen' }).click();
    await expect(modal.locator('#loot-chest-item option:checked')).toHaveText('Sternenstaub');
    await modal.getByRole('button', { name: 'Truhen schließen' }).click();
    const items = page.locator('#loot-list .loot-item');
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText('×2');
});

test('die Hilfe zum Drop-Gewicht ist bei 320 Pixeln per Tastatur bedienbar', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.addInitScript(key => {
        localStorage.setItem(
            key,
            JSON.stringify({
                loot: [{ id: 1, name: 'Heiltrank', category: 'consumables', quantity: 1 }],
                lootChests: [{ id: 1, name: 'Testtruhe', entries: [] }],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: 'Truhen', exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Testtruhe bearbeiten', exact: true }).press('Enter');
    const modal = page.locator('#loot-chests-modal');
    const info = modal.getByRole('button', { name: 'Info zum Drop-Gewicht' });
    const help = modal.locator('#loot-chest-weight-help');

    await expect(info).toBeVisible({ timeout: 3000 });
    await expect(info).toHaveAttribute('aria-expanded', 'false');
    await expect(help).toBeHidden();
    await modal.locator('#loot-chest-item').focus();
    await page.keyboard.press('Tab');
    await expect(info).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(info).toHaveAttribute('aria-expanded', 'true');
    await expect(help).toBeInViewport();
    await expect(help).toContainText('0 bis 1.000.000');
    await expect(help).toContainText('0,5');
    await expect(help).toContainText('25 % und 75 %');
    await expect(help).toContainText('keinen Drop');

    await page.keyboard.press('Space');
    await expect(info).toHaveAttribute('aria-expanded', 'false');
    await expect(help).toBeHidden();
    await expect(modal.getByText('Die Truhe ist leer.')).toBeVisible();
});

test('jeder Drop lässt sich einmal zuweisen und bleibt in der Truhe ziehbar', async ({ page }) => {
    await page.addInitScript(key => {
        if (sessionStorage.getItem('chest-assignment-seeded')) return;
        sessionStorage.setItem('chest-assignment-seeded', '1');
        localStorage.setItem(
            key,
            JSON.stringify({
                characters: [
                    { id: 1, name: 'Alva', items: [1] },
                    { id: 2, name: 'Borin' }
                ],
                loot: [{ id: 1, name: 'Seil', category: 'misc', quantity: 1 }],
                lootChests: [
                    {
                        id: 1,
                        name: 'Schmugglertruhe',
                        entries: [
                            {
                                name: 'Silberring',
                                description: 'Gravur <Nordwind>',
                                category: 'misc',
                                rarity: 'rare',
                                weight: 3
                            }
                        ]
                    }
                ],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await waitForAppReady(page);
    const modal = await openChests(page, 'Schmugglertruhe');
    const drop = modal.getByRole('button', { name: 'Drop', exact: true });
    const result = modal.locator('#loot-chest-drop-result');
    const character = modal.getByLabel('Charakter', { exact: true });
    const assign = modal.getByRole('button', { name: 'Zuweisen', exact: true });

    await expect(character).toBeHidden();
    for (const [id, name] of [
        ['1', 'Alva'],
        ['2', 'Borin']
    ]) {
        await drop.click();
        await expect(result.locator('strong')).toHaveText('Silberring');
        await expect(character).toBeVisible({ timeout: 3000 });
        await character.selectOption(id);
        await assign.click();
        await expect(result).toContainText(`Silberring wurde ${name} zugewiesen.`);
        await expect(assign).toBeHidden();
    }

    await expect
        .poll(() =>
            page.evaluate(key => {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                const awards = data.loot?.filter(item => item.name === 'Silberring') || [];
                const inventories = data.characters?.map(ch =>
                    ch.items?.map(item => ({
                        name: data.loot.find(loot => loot.id === (item.id ?? item))?.name,
                        quantity: item.quantity ?? 1
                    }))
                );
                return {
                    awards: awards.map(({ description, category, rarity, quantity }) => ({
                        description,
                        category,
                        rarity,
                        quantity
                    })),
                    inventories,
                    weights: data.lootChests?.[0]?.entries.map(item => item.weight)
                };
            }, storageKey)
        )
        .toEqual({
            awards: Array.from({ length: 2 }, () => ({
                description: 'Gravur &lt;Nordwind&gt;',
                category: 'misc',
                rarity: 'rare',
                quantity: 1
            })),
            inventories: [
                [
                    { name: 'Seil', quantity: 1 },
                    { name: 'Silberring', quantity: 1 }
                ],
                [{ name: 'Silberring', quantity: 1 }]
            ],
            weights: [3]
        });

    await page.reload();
    await waitForAppReady(page);
    await page.evaluate(() => {
        window.switchView('party');
        window.showCharacterDetails(1);
    });
    const inventory = page.locator('#char-detail-modal .char-tag.item');
    await expect(inventory).toHaveCount(2);
    await expect(inventory.filter({ hasText: 'Seil' })).toBeVisible();
    await expect(inventory.filter({ hasText: 'Silberring' })).toBeVisible();
    await page.keyboard.press('Escape');
    await openChests(page, 'Schmugglertruhe');
    await drop.click();
    await expect(result.locator('strong')).toHaveText('Silberring');
    await expect(character).toBeVisible();
});

test('eine Datei mit einer leeren benannten Truhe lässt sich exportieren und hinzufügen', async ({
    page
}) => {
    await page.goto(app);
    await waitForAppReady(page);
    const modal = await openChests(page);
    await modal.locator('#loot-chest-name').fill('Reservetruhe');
    await modal.getByRole('button', { name: 'Truhe anlegen' }).click();
    await expect(modal.getByLabel('Truhenname', { exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#view-loot [data-action="export-data"][data-value="loot"]').click()
    ]);
    const buffer = await readFile(await download.path());
    const json = JSON.parse(buffer.toString('utf8'));
    expect(json.data).toEqual([]);
    expect(json.lootChests).toMatchObject([{ name: 'Reservetruhe', entries: [] }]);

    await page.locator('#import-loot').setInputFiles({
        name: 'truhe.json',
        mimeType: 'application/json',
        buffer
    });
    const preview = page.locator('#import-modal');
    await expect(preview).toBeVisible();
    await expect(preview.locator('#import-info')).toContainText('Truhe');
    await preview.getByRole('button', { name: 'Importieren' }).click();
    await expect(preview).toBeHidden();
    const chests = await page.evaluate(() => window.D.lootChests);
    expect(chests.map(chest => chest.name)).toEqual(['Reservetruhe', 'Reservetruhe']);
    expect(new Set(chests.map(chest => chest.id)).size).toBe(2);
});

test('der Drop bleibt bei 320 Pixeln sichtbar und lässt sich zuweisen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.addInitScript(key => {
        localStorage.setItem(
            key,
            JSON.stringify({
                characters: [{ id: 1, name: 'Alva' }],
                loot: [{ id: 1, name: 'Silberring', category: 'misc', quantity: 1 }],
                _version: '99.0.0'
            })
        );
    }, storageKey);
    await page.goto(app);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    const modal = await openChests(page);
    await modal.locator('#loot-chest-name').fill('Schmugglertruhe');
    await modal.getByRole('button', { name: 'Truhe anlegen' }).click();
    await modal.locator('#loot-chest-item').selectOption('1');
    await modal.getByRole('button', { name: 'Gegenstand hinzufügen' }).click();

    const drop = modal.getByRole('button', { name: 'Drop', exact: true });
    await drop.click();
    const name = modal.locator('#loot-chest-drop-result strong');
    await expect(name).toHaveText('Silberring');
    await expect(name).toBeInViewport();
    await expect(drop).toBeInViewport();
    await expect(drop).toBeFocused();

    await modal.getByLabel('Charakter', { exact: true }).selectOption('1');
    await modal.getByRole('button', { name: 'Zuweisen', exact: true }).click();
    const confirmation = modal.getByText('Silberring wurde Alva zugewiesen.', { exact: true });
    await expect(confirmation).toBeInViewport();
    await expect(drop).toBeFocused();
});

for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 }
]) {
    test(`Truhen füllen, gewichtet droppen und neu laden (${viewport.width} px)`, async ({
        page
    }) => {
        await page.setViewportSize(viewport);
        await page.addInitScript(key => {
            if (sessionStorage.getItem('loot-chest-seeded')) return;
            sessionStorage.setItem('loot-chest-seeded', '1');
            localStorage.setItem(
                key,
                JSON.stringify({
                    loot: [
                        { id: 1, name: 'Heiltrank', category: 'consumables', quantity: 1 },
                        { id: 2, name: 'Silberring', category: 'misc', quantity: 1 }
                    ],
                    _version: '99.0.0'
                })
            );
        }, storageKey);
        await page.goto(app);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        let modal = await openChests(page);

        await modal.locator('#loot-chest-name').fill('Schmugglertruhe');
        await modal.getByRole('button', { name: 'Truhe anlegen' }).click();
        for (const [id, weight] of [
            ['1', '1'],
            ['2', '3']
        ]) {
            await modal.locator('#loot-chest-item').selectOption(id);
            await modal.locator('#loot-chest-weight').fill(weight);
            await modal.getByRole('button', { name: 'Gegenstand hinzufügen' }).click();
        }
        await expect(modal.getByText('25 %', { exact: true })).toBeVisible();
        await expect(modal.getByText('75 %', { exact: true })).toBeVisible();

        const drop = modal.getByRole('button', { name: 'Drop', exact: true });
        const result = modal.locator('#loot-chest-drop-result');
        await page.evaluate(() => {
            Math.random = () => 0.24;
        });
        await drop.click();
        await expect(result).toContainText('Heiltrank');
        await expect(result).toContainText('Lege zuerst einen Charakter an');
        await page.evaluate(() => {
            Math.random = () => 0.25;
        });
        await drop.click();
        await expect(result).toContainText('Silberring');

        await modal.locator('#loot-chest-entry-weight-0').fill('0');
        await modal.getByRole('button', { name: 'Gewicht speichern für Heiltrank' }).click();
        await expect(modal.getByText('0 %', { exact: true })).toBeVisible();
        await expect(modal.getByText('100 %', { exact: true })).toBeVisible();
        await page.evaluate(() => {
            Math.random = () => 0;
        });
        await drop.click();
        await expect(result).toContainText('Silberring');

        await expect
            .poll(() =>
                page.evaluate(key => {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    return data.lootChests?.map(chest => ({
                        name: chest.name,
                        weights: chest.entries.map(entry => entry.weight)
                    }));
                }, storageKey)
            )
            .toEqual([{ name: 'Schmugglertruhe', weights: [0, 3] }]);

        await page.reload();
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        modal = await openChests(page, 'Schmugglertruhe');
        await expect(modal.getByLabel('Truhenname', { exact: true })).toHaveValue(
            'Schmugglertruhe'
        );
        await expect(modal.getByText('0 %', { exact: true })).toBeVisible();
        await expect(modal.getByText('100 %', { exact: true })).toBeVisible();
        await expect(page.locator('#loot-list .loot-item')).toHaveCount(2);
    });
}
