// @ts-check
/**
 * Stufe-2-Ablichtung der Welle 1 (Design-Handoff v3, Schritt 14)
 * ==============================================================
 *
 * WOFUER: der Computed-Style-Waechter (computed-style-diff.spec.js) laeuft
 * ausschliesslich im DARK-Theme — test-utils.js seedet beide Sitzungen mit
 * `theme: 'dark'`. Welle 1 aendert ihre meisten Werte aber in LIGHT und SEPIA.
 * Fuer diese drei Themes gibt es keinen maschinellen Vergleich; die Sichtung
 * haftet allein. Diese Datei stellt dafuer das Material her: je Ansicht und
 * Theme ein Vollbild, plus drei Zustandsbilder je Theme (Hover und Fokus),
 * die der Waechter grundsaetzlich nicht erfasst (er misst nur den Ruhezustand
 * sichtbarer Elemente).
 *
 * SIE PRUEFT NICHTS. Sie behauptet nichts ueber Kontraste und faellt bei
 * keinem Farbwert durch — sie legt Bilder ab, ueber die ein Mensch urteilt.
 * Ein gruener Lauf dieser Datei ist deshalb KEINE Abnahme.
 *
 * WARUM HINTER EINEM SCHALTER: 108 Vollbilder kosten Zeit und Platz. Ohne
 * gesetztes `WELLE1_SCREENS=1` ueberspringt sich die Datei (`test.skip` mit
 * Grund — dasselbe Muster wie pwa.spec.js:53), damit `npm run test:e2e`
 * unveraendert schnell bleibt. Aufruf:
 *
 *     WELLE1_SCREENS=1 npx playwright test tests/e2e/features/welle-1-screens.spec.js
 *
 * VORHER BAUEN. Die Suite laedt das gebaute Buendel (file://), nicht den
 * Quellbaum — ohne `python build.py` lichtet dieser Lauf den alten Stand ab.
 *
 * Ablage: tests/e2e/__screens__/welle-1/<ansicht>-<theme>.png. Der Ordner ist
 * von .gitignore ausgenommen (Bilderstapel gehoert nicht in die Historie); die
 * Bilder entstehen oertlich neu, wann immer jemand sie braucht.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

const AKTIV = process.env.WELLE1_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/welle-1');

// Dieselben 24 Ansichten wie der Waechter (systems/tab-registry.js
// TAB_RENDER_REGISTRY) — die Stellenliste der Welle verteilt sich ueber
// 21 davon; die drei restlichen werden mitgenommen, damit die Runde in
// Stufe 3 ohne Luecke durchgegangen werden kann.
const VIEWS = [
    'dashboard', 'party', 'npcs', 'locations', 'quests', 'encounter',
    'initiative', 'loot', 'shops', 'spells', 'notes', 'wiki', 'links',
    'dice', 'timers', 'data', 'dmscreen', 'bestiary', 'sessionprep',
    'kalender', 'reise', 'fraktionen', 'soundboard', 'dicestats'
];

const THEMES = ['dark', 'light', 'sepia', 'contrast'];

// Zustandsherstellung wie im Waechter: zwei Markups entstehen erst im
// aufgeklappten Shop bzw. bei ausgewaehlter Fraktion.
const VIEW_STATE_SETUP = {
    shops: async page => {
        await page.evaluate(() => {
            // @ts-ignore — global aus features/shops/shops-core.js
            if (typeof window.toggleShop === 'function') window.toggleShop(1);
        });
    },
    fraktionen: async page => {
        await page.evaluate(() => {
            // @ts-ignore — global aus features/fraktionen/fraktionen-render.js
            if (typeof window.selectFraktion === 'function') window.selectFraktion(1);
        });
    }
};

/**
 * Zustandsbilder: genau die Stellen, die der Waechter strukturell nicht sieht.
 * `.dice-attr` und `.fr-ruf-btn-plus` sind zwei der drei Elementfamilien mit
 * den groessten gemessenen Aenderungen (schwarz -> weiss durch color-scheme
 * bzw. weiss -> --on-green); `.form-input` zeigt den Fokusring auf der
 * geaenderten --border-input-Kante.
 */
const ZUSTANDSBILDER = [
    { name: 'dice-hover', view: 'dice', selector: '#view-dice .dice-attr', mode: 'hover' },
    { name: 'fraktionen-hover', view: 'fraktionen', selector: '#view-fraktionen .fr-ruf-btn-plus', mode: 'hover' },
    { name: 'reise-fokus', view: 'reise', selector: '#view-reise .form-input', mode: 'focus' }
];

/**
 * Setzt das Theme ueber den echten Codepfad (core/themes.js) und raeumt die
 * Quittungsmeldung weg — `setTheme()` ruft `showToast()`, und ein Ereignis-Log
 * im Bild verdeckt genau die Werkzeugleiste, um die es geht.
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function setzeTheme(page, theme) {
    await page.evaluate(t => {
        // @ts-ignore — global aus core/themes.js
        if (typeof window.setTheme === 'function') window.setTheme(t);
        // @ts-ignore — global aus utils/utilities.js
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    }, theme);
    await page.waitForTimeout(250);
    const gesetzt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(gesetzt, `Theme ${theme} wurde nicht gesetzt`).toBe(theme);
}

/**
 * Wechselt zur Ansicht (derselbe Weg wie im Waechter: `switchView()`, nicht
 * der Klickpfad durch die Kopfzeilen-Dropdowns) und stellt ggf. den Zustand her.
 * @param {import('@playwright/test').Page} page
 * @param {string} viewId
 */
async function zeigeAnsicht(page, viewId) {
    await page.evaluate(v => {
        // @ts-ignore — global aus systems/tab-registry.js / core/init.js
        window.switchView(v);
    }, viewId);
    await page.waitForSelector(`#view-${viewId}.active`, { state: 'visible', timeout: 5000 });
    if (VIEW_STATE_SETUP[viewId]) await VIEW_STATE_SETUP[viewId](page);
    await page.waitForTimeout(150);
}

test.describe('Welle 1 — Ablichtung in vier Themes (Stufe 2)', () => {
    // Serienlauf: alle vier Themes teilen eine Seite und einen Seed; ein
    // paralleler Lauf wuerde vier Browser fuer dieselbe Arbeit hochfahren.
    test.describe.configure({ mode: 'serial' });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            test.skip(
                !AKTIV,
                'Ablichtung nur auf Anforderung: WELLE1_SCREENS=1 setzen (108 Vollbilder, nicht Teil der Standardlaeufe).'
            );
            test.setTimeout(180000);

            fs.mkdirSync(AUSGABE_DIR, { recursive: true });
            await seedPopulatedSession(page);
            await loadApp(page);
            await setzeTheme(page, theme);

            for (const viewId of VIEWS) {
                await zeigeAnsicht(page, viewId);
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${viewId}-${theme}.png`),
                    fullPage: true
                });
            }

            for (const bild of ZUSTANDSBILDER) {
                await zeigeAnsicht(page, bild.view);
                const ziel = page.locator(bild.selector).first();
                if ((await ziel.count()) === 0) {
                    // Kein Abbruch: ein fehlendes Zustandselement ist ein Befund
                    // fuer die Sichtung, kein Grund, die uebrigen 26 Bilder dieses
                    // Themes wegzuwerfen.
                    console.log(`[welle-1-screens] ${bild.name}: Selektor ${bild.selector} nicht gefunden`);
                    continue;
                }
                // `force: true` ist hier Absicht, nicht Bequemlichkeit: Playwrights
                // Stabilitaetspruefung wartet auf zwei ruhige Bilder, und die
                // Wuerfelansicht bewegt sich dauernd (laufende Animation am
                // Wuerfelfeld). Fuer eine Ablichtung des Hover-Zustands ist das
                // egal — es wird nichts geklickt, nur der Mauszeiger gesetzt.
                try {
                    await ziel.scrollIntoViewIfNeeded({ timeout: 5000 });
                    if (bild.mode === 'hover') await ziel.hover({ force: true, timeout: 5000 });
                    else await ziel.focus({ timeout: 5000 });
                } catch (fehler) {
                    console.log(`[welle-1-screens] ${bild.name}: Zustand nicht herstellbar (${fehler.message.split('\n')[0]})`);
                    continue;
                }
                await page.waitForTimeout(200);
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${bild.name}-${theme}.png`),
                    fullPage: true
                });
            }

            const abgelegt = fs
                .readdirSync(AUSGABE_DIR)
                .filter(f => f.endsWith(`-${theme}.png`));
            console.log(`[welle-1-screens] ${theme}: ${abgelegt.length} Bilder in ${AUSGABE_DIR}`);
            expect(abgelegt.length, `Theme ${theme} hat keine Bilder abgelegt`).toBeGreaterThan(0);
        });
    }
});
