// @ts-check

/**
 * Chromium-Fixtures schreiben nur vor dem ersten Dokument. Storage-Marker
 * unter file:// sind dafür keine verlässliche Navigationssperre. Nach load()
 * wird das Startskript entfernt; Reloads können keine Saat mehr zurückschreiben.
 *
 * @template T
 * @param {import('@playwright/test').Page} page
 * @param {(data: T) => void} seed Browserfunktion ohne äußere Abhängigkeiten.
 * @param {T} data
 * @param {() => Promise<unknown>} load
 */
export async function withInitialSeed(page, seed, data, load) {
    const session = await page.context().newCDPSession(page);
    await session.send('Page.enable');
    const { identifier } = await session.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `(${seed.toString()})(${JSON.stringify(data)})`
    });
    try {
        await load();
    } finally {
        await session.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
        await session.detach();
    }
}
