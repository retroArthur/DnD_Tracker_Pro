import { test, expect } from '@playwright/test';

const app = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const ready = page =>
    page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
const press = (view, name) => view.getByRole('button', { name, exact: true }).press('Enter');

async function openItemChestEditor(page, includeFallback = false) {
    await page.addInitScript(includeFallback => {
        if (sessionStorage.getItem('chest-target-change-seeded')) return;
        sessionStorage.setItem('chest-target-change-seeded', '1');
        localStorage.setItem(
            'dnd-tracker-v4',
            JSON.stringify({
                _version: '99.0.0',
                settings: { markdownOnboardingSeen: true },
                randomTables: [],
                timers: [],
                shops: [],
                campaign: {},
                loot: [
                    { id: 1, name: 'Fackel', category: 'misc', quantity: 1 },
                    { id: 2, name: 'Silberring', category: 'rings', quantity: 1 }
                ],
                lootChests: [
                    {
                        id: 1,
                        name: 'Fundtruhe',
                        entries: [{ name: 'Fackel', sourceItemId: 1, weight: 1 }]
                    },
                    ...(includeFallback ? [{ id: 2, name: 'Vorratskiste', entries: [] }] : [])
                ]
            })
        );
    }, includeFallback);
    await page.goto(app);
    await ready(page);
    await page.evaluate(() => window.switchView('loot'));
    await page.locator('#loot-list .loot-item').filter({ hasText: 'Fackel' }).click();
    await press(page, 'Fackel in Truhe legen');
    const editor = page.locator('#loot-chests-modal');
    const item = editor.getByLabel('Gegenstand', { exact: true });
    const weight = editor.locator('#loot-chest-weight');
    await expect(item).toHaveValue('1');
    await item.selectOption('2');
    await weight.fill('2.5');
    return { editor, item, weight };
}

async function addAndReload(page, editor) {
    await press(editor, 'Gegenstand hinzufügen');
    await press(editor, 'Fertig');
    await expect(editor).toBeHidden();
    await page.reload();
    await ready(page);
    return page.evaluate(() =>
        window.D.lootChests.map(({ name, entries }) => ({
            name,
            entries: entries.map(({ name, sourceItemId, weight }) => ({
                name,
                sourceItemId,
                weight
            }))
        }))
    );
}

const ring = { name: 'Silberring', sourceItemId: 2, weight: 2.5 };

test('N50 · Anlegen einer Zieltruhe schützt offene Änderungen und übernimmt den Item-Entwurf', async ({
    page
}) => {
    const { editor, item, weight } = await openItemChestEditor(page);
    const name = editor.getByLabel('Truhenname', { exact: true });
    const oldWeight = editor.getByLabel('Drop-Gewicht für Fackel', { exact: true });
    const newName = editor.getByLabel('Name der neuen Truhe', { exact: true });
    const status = editor.locator('#loot-chest-finish-status');
    await newName.fill('Neue Zieltruhe');
    await name.fill('Fundtruhe Nord');

    await press(editor, 'Truhe anlegen');
    await expect(status).toContainText('Speichere geänderte Namen und Drop-Gewichte');
    await expect(newName).toHaveValue('Neue Zieltruhe');
    await expect(name).toHaveValue('Fundtruhe Nord');
    await expect(item).toHaveValue('2');
    await expect(weight).toHaveValue('2.5');

    await oldWeight.fill('3');
    await press(editor, 'Name speichern');
    await press(editor, 'Truhe anlegen');
    await expect(newName).toBeVisible();
    await expect(oldWeight).toHaveValue('3');
    await expect(item).toHaveValue('2');
    await expect(weight).toHaveValue('2.5');
    await expect
        .poll(() => page.evaluate(() => window.D.lootChests.map(chest => chest.name)))
        .toEqual(['Fundtruhe Nord']);

    await press(editor, 'Gewicht speichern für Fackel');
    await press(editor, 'Truhe anlegen');
    await expect(newName).toBeHidden();
    await expect(editor.getByLabel('Truhe auswählen', { exact: true })).toBeHidden();
    await expect(name).toHaveValue('Neue Zieltruhe');
    await expect(item).toHaveValue('2');
    await expect(weight).toHaveValue('2.5');
    expect(await addAndReload(page, editor)).toEqual([
        {
            name: 'Fundtruhe Nord',
            entries: [{ name: 'Fackel', sourceItemId: 1, weight: 3 }]
        },
        { name: 'Neue Zieltruhe', entries: [ring] }
    ]);
});

for (const includeFallback of [true, false]) {
    test(`N50 · Löschen bewahrt den Item-Entwurf ${includeFallback ? 'für die verbleibende Truhe' : 'bis zur Neuanlage'}`, async ({
        page
    }) => {
        const { editor, item, weight } = await openItemChestEditor(page, includeFallback);
        await editor.getByLabel('Truhenname', { exact: true }).fill('Alter Entwurf');
        await editor.getByLabel('Drop-Gewicht für Fackel', { exact: true }).fill('3');
        page.once('dialog', dialog => dialog.accept());
        await press(editor, 'Truhe löschen');
        await expect(editor).toBeVisible();

        const target = includeFallback ? 'Vorratskiste' : 'Neue Zieltruhe';
        if (!includeFallback) {
            await expect(item).toBeHidden();
            await editor.getByLabel('Name der neuen Truhe', { exact: true }).fill(target);
            await press(editor, 'Truhe anlegen');
        }
        await expect(editor.getByLabel('Truhenname', { exact: true })).toHaveValue(target);
        await expect(item).toHaveValue('2');
        await expect(weight).toHaveValue('2.5');
        expect(await addAndReload(page, editor)).toEqual([{ name: target, entries: [ring] }]);
    });
}

test('N52 · Undo einer anderen Truhe erhält die offenen Eingaben der Fundtruhe', async ({
    page
}) => {
    const { editor, item, weight } = await openItemChestEditor(page);
    await item.selectOption('');
    await editor.getByLabel('Name der neuen Truhe', { exact: true }).fill('Unabhängige Truhe');
    await press(editor, 'Truhe anlegen');
    await press(editor, 'Fertig');
    await expect(editor).toBeHidden();

    await press(page, 'Fackel in Truhe legen');
    const picker = editor.getByLabel('Truhe auswählen', { exact: true });
    const other = picker.getByRole('option', { name: 'Unabhängige Truhe' });
    await expect(other).toHaveCount(1);
    await picker.selectOption({ label: 'Fundtruhe' });
    const name = editor.getByLabel('Truhenname', { exact: true });
    const rowWeight = editor.getByLabel('Drop-Gewicht für Fackel', { exact: true });
    await name.fill('Fundtruhe Nord');
    await rowWeight.fill('3');
    await item.selectOption('2');
    await weight.fill('2.5');

    await editor.getByRole('button', { name: 'Fertig', exact: true }).focus();
    await page.keyboard.press('Control+z');

    await expect(other).toHaveCount(0);
    await expect(editor).toBeVisible();
    await expect(name).toHaveValue('Fundtruhe Nord');
    await expect(rowWeight).toHaveValue('3');
    await expect(item).toHaveValue('2');
    await expect(weight).toHaveValue('2.5');
    expect(await addAndReload(page, editor)).toEqual([
        {
            name: 'Fundtruhe Nord',
            entries: [{ name: 'Fackel', sourceItemId: 1, weight: 3 }, ring]
        }
    ]);
});

test('N54 · Undo und Redo einer Umbenennung erhalten unabhängige Eingaben', async ({ page }) => {
    const { editor, item, weight } = await openItemChestEditor(page);
    const name = editor.getByLabel('Truhenname', { exact: true });
    const rowWeight = editor.getByLabel('Drop-Gewicht für Fackel', { exact: true });
    await rowWeight.fill('3');
    await name.fill('Fundtruhe Nord');
    await press(editor, 'Name speichern');
    await expect(rowWeight).toHaveValue('3');
    await expect(item).toHaveValue('2');
    await expect(weight).toHaveValue('2.5');

    const finish = editor.getByRole('button', { name: 'Fertig', exact: true });
    for (const [shortcut, restoredName] of [
        ['Control+z', 'Fundtruhe'],
        ['Control+y', 'Fundtruhe Nord'],
        ['Control+z', 'Fundtruhe']
    ]) {
        await finish.focus();
        await page.keyboard.press(shortcut);
        await expect(name).toHaveValue(restoredName);
        await expect(rowWeight).toHaveValue('3');
        await expect(item).toHaveValue('2');
        await expect(weight).toHaveValue('2.5');
    }

    expect(await addAndReload(page, editor)).toEqual([
        {
            name: 'Fundtruhe',
            entries: [{ name: 'Fackel', sourceItemId: 1, weight: 3 }, ring]
        }
    ]);
});

for (const action of ['Gewicht speichern', 'Zeile löschen']) {
    test(`N57 · ${action} per Undo zurücknehmen und ein anderes Zeilengewicht erhalten`, async ({
        page
    }) => {
        const { editor } = await openItemChestEditor(page);
        await press(editor, 'Gegenstand hinzufügen');
        const torch = editor.getByLabel('Drop-Gewicht für Fackel', { exact: true });
        const ringWeight = editor.getByLabel('Drop-Gewicht für Silberring', { exact: true });
        await ringWeight.fill('7');

        const changedWeight = action === 'Gewicht speichern' ? '3' : null;
        if (changedWeight) {
            await torch.fill(changedWeight);
            await press(editor, 'Gewicht speichern für Fackel');
        } else {
            await press(editor, 'Fackel aus der Truhe entfernen');
        }
        await expect(ringWeight).toHaveValue('7');

        const finish = editor.getByRole('button', { name: 'Fertig', exact: true });
        for (const [shortcut, expectedWeight] of [
            ['Control+z', '1'],
            ['Control+y', changedWeight],
            ['Control+z', '1']
        ]) {
            await finish.focus();
            await page.keyboard.press(shortcut);
            if (expectedWeight === null) await expect(torch).toHaveCount(0);
            else await expect(torch).toHaveValue(expectedWeight);
            await expect(ringWeight).toHaveValue('7');
        }

        await press(editor, 'Fertig');
        await expect(editor).toBeHidden();
        await page.reload();
        await ready(page);
        expect(
            await page.evaluate(() =>
                window.D.lootChests[0].entries.map(({ name, weight }) => ({ name, weight }))
            )
        ).toEqual([
            { name: 'Fackel', weight: 1 },
            { name: 'Silberring', weight: 7 }
        ]);
    });
}
