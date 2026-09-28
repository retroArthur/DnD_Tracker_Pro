// @ts-check
import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Bereit-Markierung des Starts (Code-Review 2026-09-21, Korrekturrunde F8)
 *
 * '.app-title' steht im STATISCHEN HTML des Bundles (die Kopfzeile wird beim Parsen sichtbar,
 * das grosse <script> beginnt erst mehrere Tausend Zeilen weiter unten). Wer nur darauf wartet,
 * weiss NICHTS darueber, ob core/init.js durch ist: init() wartet auf load() und haengt die
 * Klick-Listener der Navigation (.nav-tab) erst DANACH an. Ein Klick im Fenster dazwischen wird
 * verschluckt — die Ansicht bleibt auf Start. Genau das war der Wackler der vier Editor-Specs
 * im Vollauf (editor-insert.spec.js mit leerem Editor, editor-smoke.spec.js ohne sichtbaren
 * "+ NPC"-Knopf), der in Einzellaeufen nie auftrat.
 *
 * Diese Datei ist der Waechter der Markierung selbst: sie belegt, dass es eine
 * deterministische Wartebedingung gibt (data-app-ready am <html>), dass sie genau einmal
 * gesetzt wird, dass ein Klick davor wirklich verloren geht und danach wirklich ankommt, und
 * dass ein werfender init-Schritt die Markierung NICHT verhindert (eine eingeschraenkte App ist
 * "so bereit wie sie wird" — ein Test darf dann nicht endlos warten).
 *
 * Voraussetzung: frischer Dev-Build (python build.py).
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

// Kuenstliche Verzoegerung des Starts (ms). Muss deutlich ueber einem Frame liegen, damit das
// Fenster zwischen '.app-title' und der Bereitmeldung sicher offen ist, und deutlich unter dem
// Test-Zeitlimit (30 s) bleiben.
const IDB_VERZOEGERUNG_MS = 2000;

// Der Intervall-Abstand, den ausschliesslich initPerformanceMonitoring() benutzt
// (systems/backups.js). Die vier anderen setInterval-Aufrufe der App tragen andere Werte
// (Backup 300000, Timer/Session-Timer 1000), deshalb trifft der Haken unten genau einen
// init-Schritt — und zwar einen der letzten, also nach den Navigations-Listenern.
const PERF_INTERVALL_MS = 30000;

/**
 * Verzoegert JEDES erfolgreiche Oeffnen von IndexedDB um `ms`. Der Haken liegt auf
 * IDBFactory.prototype.open und auf der Instanz-Eigenschaft 'onsuccess' der Anfrage, weil das
 * Bundle diese Plattform-Methode nie neu deklariert. Eine Zugriffs-Eigenschaft auf `window`
 * (etwa window.loadFromIndexedDBFallback) waere der falsche Ort: die gleichnamige
 * Top-Level-Funktionsdeklaration des Bundles ersetzt sie beim Laden wieder durch eine
 * gewoehnliche Daten-Eigenschaft.
 *
 * Wirkung auf den Start: init() wartet auf load(), load() liest die Kampagne bei leerem
 * localStorage aus IndexedDB (systems/spellslots/quick-roll.js) und ruft dafuer
 * initIndexedDB(), dessen Promise erst in onsuccess aufgeloest wird.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} ms
 */
async function verzoegereStart(page, ms) {
    await page.addInitScript(verzoegerung => {
        // Zugriff bewusst ueber `window.` — IDBRequest/IDBFactory stehen nicht in den
        // eslint-Globals fuer tests/** (no-undef), und eslint.config.js ist nicht Teil
        // dieser Einheit.
        const beschreibung = Object.getOwnPropertyDescriptor(
            window.IDBRequest.prototype,
            'onsuccess'
        );
        const echtesOeffnen = window.IDBFactory.prototype.open;
        window.IDBFactory.prototype.open = function (...args) {
            const anfrage = echtesOeffnen.apply(this, args);
            let eigener = null;
            Object.defineProperty(anfrage, 'onsuccess', {
                configurable: true,
                get() {
                    return eigener;
                },
                set(fn) {
                    eigener = fn;
                    beschreibung.set.call(anfrage, ereignis => {
                        window.setTimeout(() => {
                            if (typeof eigener === 'function') eigener.call(anfrage, ereignis);
                        }, verzoegerung);
                    });
                }
            });
            return anfrage;
        };
    }, ms);
}

/** @param {import('@playwright/test').Page} page */
async function istBereit(page) {
    return page.evaluate(() => document.documentElement.dataset.appReady);
}

/** @param {import('@playwright/test').Page} page */
async function wartetBereit(page) {
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 15000
    });
}

test.describe('Bereit-Markierung des Starts (F8)', () => {
    test('data-app-ready wird nach der Initialisierung genau einmal gesetzt', async ({ page }) => {
        // Zaehler VOR jedem Seiten-Skript einhaengen. Beobachtet wird `document` mit subtree,
        // weil document.documentElement zum Zeitpunkt des Init-Skripts noch fehlen kann.
        await page.addInitScript(() => {
            // @ts-ignore — Messgroesse dieses Tests im Seitenkontext
            window.__f8Mutationen = 0;
            new MutationObserver(eintraege => {
                // @ts-ignore
                window.__f8Mutationen += eintraege.length;
            }).observe(document, {
                attributes: true,
                subtree: true,
                attributeFilter: ['data-app-ready']
            });
        });

        await page.goto(APP_URL);
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await wartetBereit(page);

        // Nach der Meldung weiterlaufen lassen: ein zweiter Setzer (doppelter init-Aufruf, ein
        // spaeterer Render, der das Attribut nochmal schreibt) erzeugt eine zweite Mutation.
        await page.waitForTimeout(1000);

        // @ts-ignore
        expect(await page.evaluate(() => window.__f8Mutationen)).toBe(1);
        expect(await istBereit(page)).toBe('true');
        // @ts-ignore
        expect(await page.evaluate(() => window.__appReady)).toBe(true);
    });

    test('ein Nav-Klick vor data-app-ready wechselt die Ansicht nicht, danach schon', async ({
        page
    }) => {
        await verzoegereStart(page, IDB_VERZOEGERUNG_MS);
        await page.goto(APP_URL);
        await page.waitForSelector('.app-title', { timeout: 10000 });

        // Vorbedingung: der Start laeuft noch. Ohne sie waere der Klick unten nicht im Fenster
        // und der Test wuerde nichts belegen.
        expect(await istBereit(page)).toBeUndefined();

        // Klick VOR der Bereitmeldung. dispatchEvent statt click(): der Ziel-Tab liegt in einer
        // eingeklappten Nav-Gruppe und ist fuer einen echten Mausklick unsichtbar. Das
        // DOM-Klickereignis ist dasselbe, das der in init() angehaengte Listener sehen wuerde —
        // und fuer .nav-tab[data-view] gibt es keinen delegierten Ersatzpfad.
        await page.locator('.nav-tab[data-view="party"]').dispatchEvent('click');
        expect(
            await page.evaluate(() =>
                document.querySelector('#view-party')?.classList.contains('active')
            )
        ).toBe(false);

        await wartetBereit(page);

        await page.locator('.nav-tab[data-view="party"]').dispatchEvent('click');
        await expect(page.locator('#view-party')).toHaveClass(/active/);
    });

    test('data-app-ready wird auch gesetzt, wenn ein init-Schritt wirft', async ({ page }) => {
        const konsolenFehler = [];
        page.on('console', nachricht => {
            if (nachricht.type() === 'error') konsolenFehler.push(nachricht.text());
        });

        await page.addInitScript(intervall => {
            const echtesSetInterval = window.setInterval;
            // @ts-ignore — absichtlicher Haken im Seitenkontext
            window.__f8IntervallGeworfen = false;
            // @ts-ignore
            window.setInterval = function (fn, ms, ...rest) {
                if (ms === intervall) {
                    // @ts-ignore
                    window.__f8IntervallGeworfen = true;
                    throw new Error('F8-Probe: init-Schritt wirft');
                }
                return echtesSetInterval.call(window, fn, ms, ...rest);
            };
        }, PERF_INTERVALL_MS);

        await page.goto(APP_URL);
        await page.waitForSelector('.app-title', { timeout: 10000 });
        await wartetBereit(page);

        // Der Haken hat wirklich gefeuert (sonst prueft dieser Test nur den Normalfall) ...
        // @ts-ignore
        expect(await page.evaluate(() => window.__f8IntervallGeworfen)).toBe(true);
        // ... und der Fehler ist wirklich aus init() heraus geflogen: der Aufrufer des Bundles
        // faengt ihn als 'Init error:' ab.
        expect(konsolenFehler.join('\n')).toContain('F8-Probe: init-Schritt wirft');
        // @ts-ignore
        expect(await page.evaluate(() => window.__appReady)).toBe(true);
    });
});
