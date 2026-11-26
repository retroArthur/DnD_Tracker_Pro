// @ts-check
import { test, expect } from '@playwright/test';
import { withInitialSeed } from '../helpers/initial-seed.js';

test('Testdaten-Seed läuft nur beim Erststart, auch nach einem fehlgeschlagenen Ladehelfer', async ({
    page
}) => {
    const url = 'data:text/html,<title>Einmalige Testdaten</title>';
    await withInitialSeed(
        page,
        value => {
            // @ts-ignore — absichtliche Testmarkierung im Browser
            window.initialSeedValue = value;
        },
        'Anfangsdaten',
        () => page.goto(url)
    );
    // @ts-ignore — absichtliche Testmarkierung im Browser
    expect(await page.evaluate(() => window.initialSeedValue)).toBe('Anfangsdaten');

    await page.reload();
    // @ts-ignore — im neuen Dokument darf kein Seed mehr laufen
    expect(await page.evaluate(() => window.initialSeedValue)).toBeUndefined();

    await expect(
        withInitialSeed(
            page,
            value => {
                // @ts-ignore — absichtliche Testmarkierung im Browser
                window.initialSeedValue = value;
            },
            'Fehlerpfad',
            async () => {
                throw new Error('Ladehelfer abgebrochen');
            }
        )
    ).rejects.toThrow('Ladehelfer abgebrochen');
    await page.reload();
    // @ts-ignore — auch im Fehlerpfad muss das Startskript entfernt werden
    expect(await page.evaluate(() => window.initialSeedValue)).toBeUndefined();
});
