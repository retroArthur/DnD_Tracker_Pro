import { test, expect } from '@playwright/test';

const app = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

test('N48 · Der Gewichtshinweis bleibt bei langem Itemnamen im schmalen Dialog lesbar', async ({
    page
}) => {
    const itemName = 'Schattenkristall'.repeat(4) + 'X';
    await page.setViewportSize({ width: 320, height: 600 });
    await page.addInitScript(name => {
        localStorage.setItem(
            'dnd-tracker-v4',
            JSON.stringify({
                _version: '99.0.0',
                settings: { markdownOnboardingSeen: true },
                randomTables: [],
                timers: [],
                shops: [],
                campaign: {},
                lootChests: [{ id: 1, name: 'Fundtruhe', entries: [{ name, weight: 1 }] }]
            })
        );
    }, itemName);
    await page.goto(app);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
    await page.evaluate(() => window.switchView('loot'));
    await page.getByRole('button', { name: 'Truhen', exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Fundtruhe bearbeiten', exact: true }).press('Enter');

    const editor = page.locator('#loot-chests-modal');
    const status = editor.locator('#loot-chest-finish-status');
    await editor.getByLabel(`Drop-Gewicht für ${itemName}`, { exact: true }).fill('0');
    await editor.getByRole('button', { name: 'Drop', exact: true }).press('Enter');
    await expect(status).toContainText(`Speichere das Drop-Gewicht für „${itemName}“`);

    const textIsContained = await status.evaluate(element => {
        const dialog = element.closest('.modal').getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = [...range.getClientRects()];
        return (
            text.length > 0 &&
            text.every(
                line =>
                    line.left >= Math.max(0, dialog.left) &&
                    line.right <= Math.min(window.innerWidth, dialog.right)
            )
        );
    });
    expect(textIsContained, 'Alle Zeilen des Hinweises liegen im sichtbaren Dialog').toBe(true);
    await expect(status).toBeInViewport();

    await editor.getByRole('button', { name: 'Fertig', exact: true }).click();
    await expect(editor).toBeHidden();
});
