// @ts-check
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

/**
 * E2E Tests — Gruppierte Navigation (Design 2026-06-20)
 *
 * Aus 26 scrollenden Tabs werden 7 Oberpunkte (Start + 6 Gruppen-Dropdowns).
 * Geprueft: Rendering, Dropdown auf/zu, View-Wechsel, aktive Gruppe, Klick-ausserhalb,
 * 1-9-Shortcuts unveraendert.
 *
 * Die beiden ersten Faelle oeffnen das Menue nur UNGESCROLLT auf der
 * Standardansicht — dort liegt nichts darunter, was es verdecken koennte. Der
 * dritte Fall schliesst genau diese Luecke (U3): gescrollt auf der Initiative
 * liegen drei angeheftete Ebenen unter dem Menue, und ihre Stapelordnung
 * entschied ueber jeden einzelnen Eintrag.
 *
 * ESM-Import + file:// baseURL (kein require, kein http://localhost).
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/**
 * Seed fuer den dritten Fall: zwoelf Kombattanten, damit die Initiative
 * ueberhaupt Scrollweg hat. Ohne Scrollweg heftet keine der drei Leisten an und
 * der Stapelfehler bleibt unsichtbar. Weit-in-der-Zukunft-`_version` wie
 * seedCleanSession() in ../helpers/test-utils.js, damit migrateData() entfaellt.
 */
const INIT_SEED = {
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true, levelingMode: 'xp' },
    randomTables: [],
    timers: [],
    shops: [],
    campaign: {},
    initiative: {
        combatants: [
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
        })),
        currentTurn: 0,
        round: 1
    },
    _nextId: {
        characters: 1, npcs: 1, locations: 1, quests: 1, encounters: 1,
        spells: 1, loot: 1, items: 1, wiki: 1, sessionNotes: 1, randomTables: 1
    }
};

test.describe('Nav-Gruppen', function () {
    test('grouped nav: dropdown opens, switches view, highlights group, closes', async ({ page }) => {
        await page.goto(APP_URL);
        await waitForAppReady(page);

        // Start ist direkt sichtbar
        await expect(page.locator('.nav-tab[data-view="dashboard"]')).toBeVisible();

        // Genau 6 Gruppen-Buttons (Charaktere, Welt, Kampf, Inhalte, Werkzeuge, System)
        const groupBtns = page.locator('.nav-group-btn');
        await expect(groupBtns).toHaveCount(6);

        // Dropdown geschlossen -> Party-Eintrag nicht sichtbar
        const party = page.locator('.nav-tab[data-view="party"]');
        await expect(party).toBeHidden();

        // Charaktere oeffnen
        await groupBtns.first().click();
        await expect(party).toBeVisible();

        // Party waehlen -> View aktiv + Dropdown zu + Gruppe hervorgehoben
        await party.click();
        await page.waitForTimeout(200);
        await expect(page.locator('#view-party')).toHaveClass(/active/);
        await expect(party).toBeHidden();
        await expect(groupBtns.first()).toHaveClass(/has-active/);

        // Andere Gruppe oeffnen, dann ausserhalb klicken -> schliesst
        await groupBtns.nth(1).click();
        const orte = page.locator('.nav-tab[data-view="locations"]');
        await expect(orte).toBeVisible();
        await page.mouse.click(400, 400); // neutraler Klick ausserhalb der Nav
        await expect(orte).toBeHidden();

        // Erneut oeffnen, mit Escape schliessen
        await groupBtns.nth(1).click();
        await expect(orte).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(orte).toBeHidden();
    });

    test('1-9 keyboard shortcuts still switch views and highlight the group', async ({ page }) => {
        await page.goto(APP_URL);
        await waitForAppReady(page);

        // '3' -> npcs (feste Shortcut-Liste, unabhaengig von der Gruppierung)
        await page.keyboard.press('3');
        await page.waitForTimeout(150);
        await expect(page.locator('#view-npcs')).toHaveClass(/active/);

        // Genau eine Gruppe ist hervorgehoben (Charaktere)
        await expect(page.locator('.nav-group-btn.has-active')).toHaveCount(1);
    });

    test('gescrollt auf der Initiative bleibt JEDER der 25 Menueeintraege erreichbar', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 800 });
        await page.addInitScript(seed => {
            try {
                localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        }, INIT_SEED);
        await page.goto(APP_URL);
        await waitForAppReady(page);

        await page.evaluate(() => window.switchView('initiative'));
        await page.waitForTimeout(400);
        await page.evaluate(() => window.scrollTo(0, 700));
        await page.waitForTimeout(300);
        expect(await page.evaluate(() => window.scrollY), 'Seite hat keinen Scrollweg — Seed zu klein').toBeGreaterThan(0);

        const gruppen = page.locator('.nav-group-btn');
        await expect(gruppen).toHaveCount(6);

        const verdeckt = [];
        let gesamt = 0;
        for (let i = 0; i < 6; i++) {
            await gruppen.nth(i).click();
            await page.waitForTimeout(120);
            // Der Treffertest laeuft im Seitenkontext: elementFromPoint auf die
            // Mitte jedes Eintrags muss den Eintrag selbst (oder ein Kind)
            // liefern. Ein fremdes Element dort heisst: nicht anklickbar.
            const befund = await page.evaluate(() => {
                const menu = document.querySelector('.nav-group.open > .nav-group-menu');
                if (!menu) return { gruppe: '(kein offenes Menue)', eintraege: [] };
                const btn = menu.parentElement.querySelector('.nav-group-btn');
                return {
                    gruppe: btn ? btn.textContent.trim() : '?',
                    eintraege: Array.from(menu.querySelectorAll('.nav-tab')).map(t => {
                        const r = t.getBoundingClientRect();
                        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                        return {
                            text: t.textContent.trim(),
                            frei: el ? t === el || t.contains(el) : false,
                            obenauf: el ? el.tagName + '.' + String(el.className).slice(0, 34) : null
                        };
                    })
                };
            });
            expect(befund.eintraege.length, `Gruppe ${befund.gruppe} ohne Eintraege`).toBeGreaterThan(0);
            gesamt += befund.eintraege.length;
            befund.eintraege
                .filter(e => !e.frei)
                .forEach(e => verdeckt.push(`${befund.gruppe} > ${e.text} verdeckt von ${e.obenauf}`));
            await page.keyboard.press('Escape');
            await page.waitForTimeout(80);
        }

        expect(gesamt, 'erwartet 25 Menueeintraege in 6 Gruppen').toBe(25);
        expect(verdeckt, `${verdeckt.length} von ${gesamt} Eintraegen unerreichbar:\n${verdeckt.join('\n')}`).toEqual([]);
    });
});
