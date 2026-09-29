// @ts-check
/**
 * Stufe-2-Ablichtung der Welle 2 (Design-Handoff v3, Schritt 11)
 * ==============================================================
 *
 * WOFUER, und worin sie sich von der Welle-1-Ablichtung unterscheidet: der
 * Computed-Style-Waechter (computed-style-diff.spec.js) laeuft ausschliesslich
 * im DARK-Theme — test-utils.js seedet beide Sitzungen mit `theme: 'dark'`.
 * Welle 2 aendert ihren EINZIGEN sichtbaren Wert aber in LIGHT und SEPIA: der
 * Toenungsdeckel aus Entscheidung E2 senkt dort die Flaechenstaerke von 20 %
 * auf 7 %. Fuer diese beiden Themes gibt es keinen maschinellen Vergleich; die
 * Sichtung haftet allein. Diese Datei stellt dafuer das Material her.
 *
 * SIE PRUEFT NICHTS. Sie behauptet nichts ueber Kontraste und faellt bei
 * keinem Farbwert durch — sie legt Bilder ab, ueber die ein Mensch urteilt.
 * Ein gruener Lauf dieser Datei ist deshalb KEINE Abnahme.
 *
 * DIE DREI ZUSTANDSBILDER sind nicht dieselben wie in Welle 1, weil Welle 2
 * andere Stellen anfasst. Sie zeigen genau die drei Aenderungen, die der
 * Waechter strukturell nicht sieht:
 *   - qref-hover      Entscheidung E3: .qref-row:hover meldet sich seit
 *                     Schritt 9 ueber einen Umriss statt ueber eine Fuellung.
 *                     Ein Hover-Zustand steht in keinem Sollstand.
 *   - wuerfelblase    Entscheidung E1: .fdp-die.d20 in der schwebenden
 *                     Wuerfelblase traegt jetzt die Rotrolle statt eines
 *                     fremden Literals (in Dark sichtbar heller). Die Blase
 *                     ist zugeklappt, solange niemand sie oeffnet.
 *   - ereignis-log    Entscheidung E6: das Log behaelt seine dunkle Blende und
 *                     bekommt themenblinde Tinte. Es erscheint nur nach einer
 *                     Meldung und verschwindet wieder.
 *
 * WARUM HINTER EINEM SCHALTER: 108 Vollbilder kosten Zeit und Platz. Ohne
 * gesetztes `WELLE2_SCREENS=1` ueberspringt sich die Datei (`test.skip` mit
 * Grund — dasselbe Muster wie welle-1-screens.spec.js und pwa.spec.js:53),
 * damit `npm run test:e2e` unveraendert schnell bleibt. Aufruf:
 *
 *     WELLE2_SCREENS=1 npx playwright test tests/e2e/features/welle-2-screens.spec.js
 *
 * VORHER BAUEN. Die Suite laedt das gebaute Buendel (file://), nicht den
 * Quellbaum — ohne `python build.py` lichtet dieser Lauf den alten Stand ab.
 *
 * Ablage: tests/e2e/__screens__/welle-2/<ansicht>-<theme>.png. Der Ordner ist
 * von .gitignore ausgenommen (Bilderstapel gehoert nicht in die Historie); die
 * Bilder entstehen oertlich neu, wann immer jemand sie braucht.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

const AKTIV = process.env.WELLE2_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/welle-2');

// Dieselben 24 Ansichten wie der Waechter (systems/tab-registry.js
// TAB_RENDER_REGISTRY). Welle 2 fasst 14 der 20 CSS-Dateien an; die Toenungen
// verteilen sich ueber nahezu alle Ansichten, deshalb wieder die volle Liste.
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
 * Setzt das Theme ueber den echten Codepfad (das Theme-Modul unter core/) und
 * raeumt die Quittungsmeldung weg — `setTheme()` ruft `showToast()`, und ein
 * Ereignis-Log im Bild verdeckt genau die Flaechen, um die es geht.
 *
 * Der Modulpfad steht hier BEWUSST nicht ausgeschrieben; die Begruendung steht
 * ausfuehrlich in welle-1-screens.spec.js (das Abdeckungs-Gate wertet jede
 * woertliche Nennung eines loader.js-Modulpfads unter tests/ als Abdeckung,
 * auch die in einem Kommentar).
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function setzeTheme(page, theme) {
    await page.evaluate(t => {
        // @ts-ignore — global aus dem Theme-Modul (Pfad bewusst nicht ausgeschrieben, s.o.)
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

/**
 * Die drei Zustandsbilder. Jedes stellt seinen Zustand SELBER her und meldet
 * per Rueckgabe, ob es geklappt hat — ein fehlgeschlagenes Zustandsbild ist
 * ein Befund fuer die Sichtung, kein Grund, die 24 Vollbilder desselben
 * Themes wegzuwerfen.
 */
const ZUSTANDSBILDER = [
    {
        name: 'qref-hover',
        async aufbau(page) {
            await page.evaluate(() => {
                // @ts-ignore — global aus systems/spellslots/quick-reference.js
                if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
            });
            await page.waitForTimeout(300);
            // ZWEI HUERDEN vor dem Hover, beide beim ersten Lauf zugeschnappt:
            //   1. Das Panel hat vier Reiter (Kampf, Regeln, Welt, Eigene) und
            //      oeffnet auf "Kampf". Die sieben .qref-row liegen im Reiter
            //      REGELN; sein .qref-tab-content ist bis zum Umschalten
            //      0 Pixel hoch, jeder Klick darin laeuft in die Zeitgrenze.
            //   2. Im Reiter stehen alle Abschnitte zugeklappt (Markup:
            //      `qref-section collapsed`); die Zeilen liegen im Abschnitt
            //      "Typische Proben".
            // Beides ueber den echten data-action-Weg, nicht per classList am
            // DOM vorbei — sonst lichtet das Bild einen Zustand ab, den die
            // Anwendung so nie herstellt.
            const reiter = page.locator('#quick-ref-panel .qref-tab[data-value="rules"]');
            if ((await reiter.count()) === 0) return 'Reiter "Regeln" nicht im Panel';
            await reiter.click({ timeout: 5000 });
            await page.waitForTimeout(200);
            const kopf = page.locator(
                '#quick-ref-panel [data-qref-section="checks"] .qref-section-header'
            );
            if ((await kopf.count()) === 0) return 'Abschnitt "checks" nicht im Panel';
            await kopf.click({ timeout: 5000 });
            await page.waitForTimeout(300);
            const ziel = page.locator('#quick-ref-panel .qref-row').first();
            if ((await ziel.count()) === 0) return 'keine .qref-row im Panel';
            if (!(await ziel.isVisible())) return '.qref-row ist nach dem Aufklappen unsichtbar';
            await ziel.scrollIntoViewIfNeeded({ timeout: 5000 });
            await ziel.hover({ force: true, timeout: 5000 });
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
            });
        }
    },
    {
        name: 'wuerfelblase',
        async aufbau(page) {
            await page.evaluate(() => {
                // @ts-ignore — global aus features/dice/dice-core.js
                if (typeof window.toggleFloatingDice === 'function') window.toggleFloatingDice();
            });
            await page.waitForTimeout(300);
            const d20 = page.locator('#floating-dice-panel .fdp-die.d20');
            if ((await d20.count()) === 0) return 'kein .fdp-die.d20 in der Blase';
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.toggleFloatingDice === 'function') window.toggleFloatingDice();
            });
        }
    },
    {
        name: 'ereignis-log',
        async aufbau(page) {
            await page.evaluate(() => {
                // @ts-ignore — global aus utils/utilities.js
                if (typeof window.showToast !== 'function') return;
                // @ts-ignore
                window.showToast('Kampagne gespeichert', 'success');
                // @ts-ignore
                window.showToast('Zauberplatz verbraucht', 'info');
                // @ts-ignore
                window.showToast('Wenig Trefferpunkte', 'warning');
                // @ts-ignore
                window.showToast('Import fehlgeschlagen', 'error');
            });
            await page.waitForTimeout(400);
            const eintraege = page.locator('.event-log-entry, .toast-entry');
            if ((await eintraege.count()) === 0) return 'kein Eintrag im Ereignis-Log sichtbar';
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.clearEventLog === 'function') window.clearEventLog();
            });
        }
    }
];

test.describe('Welle 2 — Ablichtung in vier Themes (Stufe 2)', () => {
    // Serienlauf: alle vier Themes teilen eine Seite und einen Seed; ein
    // paralleler Lauf wuerde vier Browser fuer dieselbe Arbeit hochfahren.
    test.describe.configure({ mode: 'serial' });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            test.skip(
                !AKTIV,
                'Ablichtung nur auf Anforderung: WELLE2_SCREENS=1 setzen (108 Vollbilder, nicht Teil der Standardlaeufe).'
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

            // Zustandsbilder auf dem Dashboard: es traegt die Schnellreferenz
            // und ist in jedem Theme die Ansicht mit den meisten Toenungen.
            for (const bild of ZUSTANDSBILDER) {
                await zeigeAnsicht(page, 'dashboard');
                let grund = null;
                try {
                    grund = await bild.aufbau(page);
                } catch (fehler) {
                    grund = fehler.message.split('\n')[0];
                }
                if (grund) {
                    console.log(`[welle-2-screens] ${bild.name} (${theme}): ${grund}`);
                    continue;
                }
                await page.waitForTimeout(200);
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${bild.name}-${theme}.png`),
                    fullPage: true
                });
                await bild.abbau(page);
                await page.waitForTimeout(150);
            }

            const abgelegt = fs.readdirSync(AUSGABE_DIR).filter(f => f.endsWith(`-${theme}.png`));
            console.log(`[welle-2-screens] ${theme}: ${abgelegt.length} Bilder in ${AUSGABE_DIR}`);
            expect(abgelegt.length, `Theme ${theme} hat keine Bilder abgelegt`).toBeGreaterThan(0);
        });
    }
});
