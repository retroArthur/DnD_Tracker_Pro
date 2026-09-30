// @ts-check
/**
 * E2E — Die drei angehefteten Ebenen auf Kampf -> Initiative (U3).
 *
 * Auf dieser Ansicht liegen drei `position: sticky`/`fixed`-Ebenen uebereinander:
 * das Umzugs-Hinweisband (fest am Fensterrand), die Kopfzeile, die Runden-Leiste
 * (`.encounter-controls`) und die Aktionsleiste (`#quick-actions-bar`). Zwei
 * unabhaengige Fehler trafen hier zusammen:
 *
 *   1. Die STAPELORDNUNG. Kopfzeile / Runden-Leiste / Aktionsleiste standen seit
 *      dem Initialcommit auf 100 / 99 / 98; F-19 (Commit 297a910) hat alle drei
 *      auf die eine Sprosse `--z-sticky` gezogen. Bei Gleichstand entscheidet die
 *      Dokumentreihenfolge — und die ist die exakte Umkehrung der Absicht.
 *      Gemessen am Buendel zu 1dffc9e: gescrollt waren 21 von 25 Eintraegen des
 *      Nav-Menues unerreichbar (bei 1000px 18 von 25), ungescrollt 7 von 25.
 *
 *   2. Die VERSATZKETTE. `updateStickyOffsets()` hatte nur EIN berechnetes Glied
 *      (die Runden-Leiste); die Aktionsleiste behielt ihren 2026 fest
 *      verdrahteten `top: 145px`. Gemessen: die Aktionsleiste schnitt die
 *      Runden-Leiste um 35px (>=1280), 94px (1100), 87px (1000).
 *
 *   3. Das HINWEISBAND war das fehlende ERSTE Glied derselben Kette: `position:
 *      fixed` auf `--z-panel` (600), die Kopfzeile heftet auf `top: 0` an und
 *      verschwand gescrollt um 61px darunter — App-Titel UND globale Suche
 *      antworteten auf `elementFromPoint` mit `SPAN.migration-hint-text`.
 *
 * Eine Korrektur, die nur die z-Werte zurueckdreht, verschiebt das Opfer (dann
 * wird das Label der Aktionsleiste unsichtbar); eine, die nur `top` richtig
 * rechnet, macht das Menue nicht heil. Dieser Spec misst BEIDES.
 *
 * ESM-Import + file:// baseURL (kein require, kein http://localhost) — wie die
 * uebrigen Specs dieses Verzeichnisses.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/**
 * Zwoelf Kombattanten: genug Listenhoehe, damit die Seite ueberhaupt scrollt —
 * ohne Scrollweg ist keiner der drei Fehler sichtbar. Datenform wie
 * `features/initiative.js` sie liest.
 */
const KOMBATTANTEN = [
    'Danuel von Bruchstein', 'Goblin Scharfschuetze', 'Ork Anfuehrer',
    'Lyra Sonnenschein', 'Wolf Alpha', 'Thorin Eisenfaust',
    'Banditenhauptmann', 'Skelettkrieger', 'Magierin Vex',
    'Riesenspinne', 'Gnoll Rudelfuehrer', 'Zombie'
].map((name, i) => ({
    id: i + 1,
    name,
    initiative: 24 - i,
    initBonus: 2,
    maxHp: 30,
    currentHp: 30,
    ac: 15,
    type: i % 3 === 0 ? 'player' : 'monster',
    effects: []
}));

const SEED = {
    // Weit-in-der-Zukunft-Version, damit load() migrateData() ueberspringt — wie
    // seedCleanSession() in tests/e2e/helpers/test-utils.js.
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true, levelingMode: 'xp' },
    randomTables: [],
    timers: [],
    shops: [],
    campaign: {},
    initiative: { combatants: KOMBATTANTEN, currentTurn: 0, round: 1 },
    _nextId: {
        characters: 1, npcs: 1, locations: 1, quests: 1, encounters: 1,
        spells: 1, loot: 1, items: 1, wiki: 1, sessionNotes: 1, randomTables: 1
    }
};

/**
 * Oeffnet die Initiative mit gefuellter Liste. Das Hinweisband wird bewusst
 * NICHT unterdrueckt: der Nutzer faehrt die App per file://, und genau dort
 * zeigt `startMigrationFileSide()` es bei jeder frischen Sitzung.
 * @param {import('@playwright/test').Page} page
 */
async function oeffneInitiative(page) {
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng; faellt
            // der Seed aus, laeuft die App in ihren Standard — kein Absturz.
        }
    }, SEED);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.evaluate(() => window.switchView('initiative'));
    await page.waitForTimeout(400);
}

/** Liest die Geometrie der drei Ebenen im aktuellen Scrollzustand. */
function messeKette() {
    const ctrl = document.querySelector('#view-initiative .encounter-controls');
    const bar = document.getElementById('quick-actions-bar');
    if (!ctrl || !bar) return { fehlt: true };
    const cr = ctrl.getBoundingClientRect();
    const br = bar.getBoundingClientRect();
    const knoepfe = Array.from(ctrl.querySelectorAll('.btn')).map(b => {
        const r = b.getBoundingClientRect();
        const mitte = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return {
            text: b.textContent.trim().slice(0, 16),
            unterAktionsleiste: Math.round(Math.max(0, r.bottom - br.top)),
            mitteFrei: mitte ? b === mitte || b.contains(mitte) : false
        };
    });
    const label = bar.querySelector('.qa-label');
    let labelFrei = null;
    let labelObenauf = null;
    if (label) {
        const lr = label.getBoundingClientRect();
        const el = document.elementFromPoint(lr.left + 8, lr.top + lr.height / 2);
        labelFrei = el ? label === el || label.contains(el) : false;
        labelObenauf = el ? el.tagName + '.' + String(el.className).slice(0, 40) : null;
    }
    return {
        fehlt: false,
        barDisplay: getComputedStyle(bar).display,
        ueberlappung: Math.round(Math.max(0, Math.min(cr.bottom, br.bottom) - Math.max(cr.top, br.top))),
        knoepfeUnten: knoepfe.filter(k => k.unterAktionsleiste > 0).map(k => k.unterAktionsleiste),
        knoepfeMitteFrei: knoepfe.filter(k => k.mitteFrei).length,
        knoepfeGesamt: knoepfe.length,
        labelFrei,
        labelObenauf
    };
}

/** Liest die Ueberdeckung der Kopfzeile durch das oberste feste Band. */
function messeBand() {
    const band = document.querySelector('.migration-hint-banner') || document.querySelector('.divergence-banner');
    const header = document.querySelector('.app-header');
    if (!band || !header) return { fehlt: true, bandDa: !!band, headerDa: !!header };
    const br = band.getBoundingClientRect();
    const hr = header.getBoundingClientRect();
    const treffer = el => {
        if (!el) return { vorhanden: false };
        const r = el.getBoundingClientRect();
        const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return {
            vorhanden: true,
            frei: e ? el === e || el.contains(e) : false,
            obenauf: e ? e.tagName + '.' + String(e.className).slice(0, 40) : null
        };
    };
    return {
        fehlt: false,
        bandHoehe: Math.round(br.height),
        decktHeader: Math.round(Math.max(0, Math.min(br.bottom, hr.bottom) - Math.max(br.top, hr.top))),
        titel: treffer(document.querySelector('.app-title')),
        suche: treffer(document.getElementById('global-search'))
    };
}

test.describe('Angeheftete Ebenen auf der Initiative', function () {
    test('die Versatzkette haelt: die Aktionsleiste schneidet die Runden-Leiste nicht', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 800 });
        await oeffneInitiative(page);

        // Vier Breiten, weil die Runden-Leiste umbricht (`flex-wrap: wrap`) und
        // damit hoeher wird — genau daran scheiterte der fest verdrahtete Wert.
        for (const breite of [1920, 1280, 1100, 1000]) {
            await page.setViewportSize({ width: breite, height: 800 });
            // updateStickyOffsets() haengt am resize-Ereignis mit 200ms Entprellung.
            await page.waitForTimeout(400);
            await page.evaluate(() => window.scrollTo(0, 700));
            await page.waitForTimeout(300);

            const kette = await page.evaluate(messeKette);
            expect(kette.fehlt, `Breite ${breite}: Leisten nicht gefunden`).toBe(false);
            expect(kette.barDisplay, `Breite ${breite}: Aktionsleiste muss sichtbar sein`).not.toBe('none');

            expect(
                kette.ueberlappung,
                `Breite ${breite}: Aktionsleiste ueberlappt Runden-Leiste um ${kette.ueberlappung}px`
            ).toBe(0);

            // Praezise formuliert: die Knopf-MITTEN waren auch vorher meist frei —
            // die Knoepfe ragten aber unter die Aktionsleiste.
            expect(
                kette.knoepfeUnten,
                `Breite ${breite}: Knoepfe ragen unter die Aktionsleiste: ${JSON.stringify(kette.knoepfeUnten)}`
            ).toEqual([]);
            expect(
                kette.knoepfeMitteFrei,
                `Breite ${breite}: nur ${kette.knoepfeMitteFrei}/${kette.knoepfeGesamt} Knopfmitten frei`
            ).toBe(kette.knoepfeGesamt);

            // Gegenprobe zur Fehlkorrektur: wer nur die z-Werte zurueckdreht,
            // macht stattdessen das Label der Aktionsleiste unsichtbar.
            expect(
                kette.labelFrei,
                `Breite ${breite}: Label der Aktionsleiste verdeckt von ${kette.labelObenauf}`
            ).toBe(true);
        }
    });

    test('das Umzugs-Hinweisband laesst die Kopfzeile frei', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await oeffneInitiative(page);

        // Ungescrollt hielt `body.has-migration-hint { padding-top }` die
        // Kopfzeile schon vorher frei — der Fehler zeigt sich erst gescrollt,
        // wenn die Kopfzeile auf ihren sticky-Versatz faehrt.
        for (const scroll of [0, 700]) {
            await page.evaluate(y => window.scrollTo(0, y), scroll);
            await page.waitForTimeout(300);
            const band = await page.evaluate(messeBand);
            expect(band.fehlt, `Scroll ${scroll}: Band oder Kopfzeile fehlt (${JSON.stringify(band)})`).toBe(false);
            expect(band.bandHoehe, `Scroll ${scroll}: Band ohne Hoehe`).toBeGreaterThan(0);
            expect(
                band.decktHeader,
                `Scroll ${scroll}: Band deckt die Kopfzeile um ${band.decktHeader}px`
            ).toBe(0);
            expect(
                band.titel.frei,
                `Scroll ${scroll}: App-Titel verdeckt von ${band.titel.obenauf}`
            ).toBe(true);
            expect(
                band.suche.frei,
                `Scroll ${scroll}: globale Suche verdeckt von ${band.suche.obenauf}`
            ).toBe(true);
        }
    });

    test('die drei Ebenen sind abgestuft: Kopfzeile ueber Runden-Leiste ueber Aktionsleiste', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await oeffneInitiative(page);

        const z = await page.evaluate(() => {
            const wert = sel => {
                const el = sel.startsWith('#') ? document.querySelector(sel) : document.querySelector(sel);
                return el ? parseInt(getComputedStyle(el).zIndex, 10) : NaN;
            };
            return {
                header: wert('.app-header'),
                runden: wert('#view-initiative .encounter-controls'),
                aktionen: wert('#quick-actions-bar')
            };
        });

        expect(
            [z.header, z.runden, z.aktionen],
            `Stapelordnung ${z.header}/${z.runden}/${z.aktionen} — erwartet streng fallend`
        ).toEqual([z.header, z.runden, z.aktionen].slice().sort((a, b) => b - a));
        expect(z.header, `Kopfzeile ${z.header} muss ueber Runden-Leiste ${z.runden} liegen`).toBeGreaterThan(z.runden);
        expect(z.runden, `Runden-Leiste ${z.runden} muss ueber Aktionsleiste ${z.aktionen} liegen`).toBeGreaterThan(z.aktionen);
    });
});
