// @ts-check
/**
 * Ablichtung des Mobil-Layouts fuer die menschliche Nachkontrolle
 * ==============================================================
 *
 * WOFUER. Die Mobil-Runde ist von Zusicherungen bewacht — 106 Faelle in vier
 * Proben messen Erreichbarkeit, Tippflaeche, Hoehenbudget und Layoutprofil.
 * Keine davon beantwortet die Frage, an der am Spieltisch alles haengt: SIEHT ES
 * AUF DEM TELEFON RICHTIG AUS, und findet ein Daumen im Halbdunkel, was er
 * sucht. Diese Datei stellt das Material her, ueber das ein Mensch urteilt.
 *
 * SIE PRUEFT NICHTS AM AUSSEHEN. Sie faellt nur durch, wenn ein Zustand sich
 * nicht herstellen laesst (dann ist das Bild wertlos) oder wenn kein Bild
 * entsteht. Ein gruener Lauf ist KEINE Abnahme der Gestaltung.
 *
 * DIE DREI ZUSTAENDE, je Fenster und Theme:
 *
 *   navigation   Die ausgefahrene Leiste mit allen 24 Reitern. Zu beurteilen:
 *                sind die Beschriftungen auf Daumenentfernung lesbar, ist die
 *                Gruppierung ohne die sechs Desktop-Gruppen noch zu ueberblicken,
 *                liegt nichts auf der Leiste.
 *   liste        Die Ortsansicht mit 24 Eintraegen, GANZ NACH UNTEN geradelt.
 *                Zu beurteilen: steht der letzte Eintrag vollstaendig und
 *                unverdeckt da, und bleibt von der Listenspalte genug uebrig,
 *                dass das Blaettern sich lohnt.
 *   initiative   Die laufende Initiative mit zehn Kaempfern. Zu beurteilen: ist
 *                die Reihenfolge erkennbar, sind Trefferpunkte und Zustaende
 *                lesbar, verdeckt die feste Leiste am Fussrand nichts, was man
 *                gleichzeitig braucht.
 *
 * ZWEI FENSTER (360x740 und 390x844) x VIER THEMES x DREI ZUSTAENDE = 24 Bilder.
 *
 * WARUM HINTER EINEM SCHALTER: 24 Vollbilder kosten Zeit und Platz. Ohne
 * gesetztes MOBIL_SCREENS=1 ueberspringt sich die Datei (dasselbe Muster wie die
 * drei Wellen-Ablichtungen und die der UAT-Funde), damit `npm run test:e2e`
 * unveraendert schnell bleibt. Aufruf:
 *
 *     MOBIL_SCREENS=1 npx playwright test tests/e2e/features/mobil-screens.spec.js
 *
 * VORHER BAUEN. Der Lauf laedt das gebaute Buendel per file://, nicht den
 * Quellbaum — ohne frischen Build lichtet er den Stand von gestern ab.
 *
 * MIT UMZUGS-BAND. Es ist der Normalfall am Spieltisch: die App laeuft per
 * file://, und dort erscheint der Umzugs-Hinweis in jeder frischen
 * Browsersitzung. Bei 360-390px Breite ist er 157px hoch und nimmt genau den
 * Platz, um den es im Mobil-Layout geht. Er wird deshalb NICHT unterdrueckt.
 *
 * Ablage: tests/e2e/__screens__/mobil/<zustand>-<breite>x<hoehe>-<theme>.png.
 * Der Ordner ist von .gitignore ausgenommen (Bilderstapel gehoert nicht in die
 * Historie).
 *
 * KEINE MODULPFADE IN DEN KOMMENTAREN. Das Abdeckungs-Gate wertet jede
 * woertliche Nennung eines Modulpfads unter tests/ als Abdeckung — auch die in
 * einem Kommentar. Hier stehen darum nur Funktions- und Selektornamen.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AKTIV = process.env.MOBIL_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/mobil');

const THEMES = ['dark', 'light', 'sepia', 'contrast'];

/** Die beiden Telefonfenster des Auftrags. */
const FENSTER = [
    [360, 740],
    [390, 844]
];

/** 24 Eintraege — genug, dass die Listenspalte in jedem Fenster scrollen MUSS. */
const N = 24;

const KAEMPFER = [
    'Danuel von Bruchstein',
    'Lyra Sonnenschein',
    'Thorin Eisenfaust',
    'Rabenschwarm',
    'Ork-Anfuehrer Gorruk',
    'Goblin-Scharfschuetze',
    'Skelettkrieger',
    'Magierin Vex',
    'Riesenspinne',
    'Banditenhauptmann'
];

const ORTE = [
    'Tiefwasser',
    'Baldurs Tor',
    'Neverwinter',
    'Tor des Mondes',
    'Luskan',
    'Silbrigmond',
    'Mirabar',
    'Zehn-Staedte',
    'Eichenhain',
    'Rabenstein',
    'Schattenfurt',
    'Dolchfurt',
    'Sonnenwacht',
    'Grauklamm',
    'Eisenschmiede',
    'Nebeltal',
    'Hochfels',
    'Dornwald',
    'Salzhafen',
    'Wyrmruh',
    'Aschenkreuz',
    'Stillwasser',
    'Rotbruch',
    'Letzte Laterne'
];

/**
 * Saatgut fuer alle drei Zustaende in einem Rutsch.
 * @param {string} theme
 */
function saat(theme) {
    const kaempfer = KAEMPFER.map((name, i) => ({
        id: i + 1,
        name,
        initiative: 22 - i * 2,
        initBonus: 2,
        maxHp: 30 + i,
        currentHp: i === 4 ? 9 : 30 + i,
        ac: 13 + (i % 4),
        type: i < 3 ? 'player' : 'monster',
        cr: '1',
        xp: 200,
        effects: i === 5 ? ['Liegend'] : []
    }));
    return {
        _version: '99.0.0',
        settings: {
            theme,
            layout: 'mobile',
            lastView: 'dashboard',
            markdownOnboardingSeen: true,
            levelingMode: 'xp'
        },
        campaign: { name: 'Mobil-Abnahme' },
        characters: kaempfer.slice(0, 3).map((c, i) => ({
            id: i + 1,
            name: c.name,
            characterClass: ['Kaempfer', 'Klerikerin', 'Zwergenkrieger'][i],
            level: 5,
            attributes: { str: 14, dex: 12, con: 14, int: 10, wis: 12, cha: 10 },
            hpCurrent: c.currentHp,
            hpMax: c.maxHp,
            armorClass: c.ac
        })),
        npcs: [],
        locations: ORTE.map((name, i) => ({
            id: i + 1,
            name,
            type: i % 3 === 0 ? 'Stadt' : i % 3 === 1 ? 'Dungeon' : 'Wildnis',
            region: 'Schwertkueste',
            description: 'Beschreibung zu ' + name + '.',
            notes: ''
        })),
        quests: [],
        encounters: [],
        spells: [],
        loot: [],
        wiki: [],
        sessionNotes: [],
        shops: [],
        factions: [],
        randomTables: [],
        timers: [],
        initiative: { combatants: kaempfer, currentTurn: 0, round: 3, active: true },
        calendar: { day: 14, month: 7, year: 1492, events: [] },
        _nextId: {
            characters: 4,
            npcs: 1,
            locations: N + 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Laedt das gebaute Buendel mit dem Saatgut, setzt Theme und Mobil-Profil und
 * wartet, bis die Anwendung wirklich bedienbar ist.
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function ladeMobil(page, theme) {
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file:// erlaubt localStorage nicht in jeder Variante; dann greift
            // der Leerzustand der Anwendung und das Bild zeigt genau das.
        }
    }, saat(theme));
    const datei = path.join(process.cwd(), 'dist/dnd-tracker-bundled.html').replace(/\\/g, '/');
    await page.goto('file:///' + datei);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 25000
    });
    await page.waitForTimeout(600);
    await page.evaluate(t => {
        // @ts-ignore — global aus dem Theme-Modul
        if (typeof window.setTheme === 'function') window.setTheme(t);
        // @ts-ignore — global aus dem Layoutprofil-Modul
        if (typeof window.setLayout === 'function') window.setLayout('mobile');
        // @ts-ignore — global aus den Hilfsfunktionen
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    }, theme);
    await page.waitForTimeout(400);
    const gesetzt = await page.evaluate(() => ({
        theme: document.documentElement.getAttribute('data-theme'),
        layout: document.documentElement.dataset.layout
    }));
    expect(gesetzt.theme, `Theme ${theme} wurde nicht gesetzt`).toBe(theme);
    expect(gesetzt.layout, 'das Mobil-Profil wurde nicht gesetzt').toBe('mobile');
}

/**
 * Faehrt die Leiste per ECHTEM Klick auf die gemessene Mitte der
 * Umschalter-Zeile aus. Kein Element-Klick: der wuerde ins Sichtfeld rollen und
 * damit genau die Frage ueberspringen, ob der Weg dorthin frei ist.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string|null>} Grund, falls es nicht geklappt hat
 */
async function leisteAusfahren(page) {
    // Steht sie schon offen, waere ein zweiter Klick das Einfahren — der
    // Umschalter kippt, er oeffnet nicht.
    const schon = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    if (schon) return null;
    const weg = await page.evaluate(() => {
        const u = document.querySelector('.mobile-nav-toggle');
        if (!u) return null;
        const r = u.getBoundingClientRect();
        const cx = Math.round(r.left + r.width / 2);
        const cy = Math.round(r.top + r.height / 2);
        const el = document.elementFromPoint(cx, cy);
        return {
            cx,
            cy,
            frei: !!el && (el === u || u.contains(el)),
            obenauf: el ? el.tagName.toLowerCase() : 'nichts'
        };
    });
    if (!weg) return 'keine Umschalter-Zeile im DOM';
    if (!weg.frei) return `die Umschalter-Zeile ist verdeckt von ${weg.obenauf}`;
    await page.mouse.click(weg.cx, weg.cy);
    await page.waitForTimeout(500);
    const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    return offen ? null : 'die Leiste liess sich nicht ausfahren';
}

/**
 * Faehrt die Leiste wieder ein, damit der naechste Zustand sauber beginnt.
 * @param {import('@playwright/test').Page} page
 */
async function leisteEinfahren(page) {
    const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
    if (!offen) return;
    const mitte = await page.evaluate(() => {
        const u = document.querySelector('.mobile-nav-toggle');
        if (!u) return null;
        const r = u.getBoundingClientRect();
        return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
    });
    if (!mitte) return;
    await page.mouse.click(mitte[0], mitte[1]);
    await page.waitForTimeout(450);
}

/**
 * Wechselt die Ansicht ueber den echten Weg: Leiste ausfahren, Reiter mit der
 * MAUS AUF SEINEN KOORDINATEN klicken.
 * @param {import('@playwright/test').Page} page
 * @param {string} view
 * @returns {Promise<string|null>}
 */
async function navigiereMobil(page, view) {
    const grund = await leisteAusfahren(page);
    if (grund) return grund;
    const lage = await page.evaluate(v => {
        const t = document.querySelector(`.nav-tab[data-view="${v}"]`);
        if (!t) return null;
        const r = t.getBoundingClientRect();
        const cx = Math.round(r.left + r.width / 2);
        const cy = Math.round(r.top + r.height / 2);
        const el = cy >= 0 && cy <= window.innerHeight ? document.elementFromPoint(cx, cy) : null;
        return { cx, cy, frei: !!el && (el === t || t.contains(el)) };
    }, view);
    if (!lage) return `kein Reiter fuer ${view}`;
    if (!lage.frei) return `der Reiter ${view} ist nicht anklickbar`;
    await page.mouse.click(lage.cx, lage.cy);
    await page.waitForTimeout(600);
    const aktiv = await page.evaluate(() => {
        const v = document.querySelector('section.view.active');
        return v ? v.id : null;
    });
    if (aktiv !== 'view-' + view) return `der Klick fuehrte nach ${aktiv} statt view-${view}`;
    return null;
}

/**
 * Mausrad statt scrollTo — ein gesetztes `scrollTop` bewegt auch einen Bereich,
 * den ein Daumen nicht bewegen kann.
 * @param {import('@playwright/test').Page} page
 * @param {number} x
 * @param {number} y
 * @param {number} stoesse
 */
async function radDrehen(page, x, y, stoesse) {
    await page.mouse.move(x, y);
    for (let i = 0; i < stoesse; i++) {
        await page.mouse.wheel(0, 250);
        if (i % 10 === 9) await page.waitForTimeout(60);
    }
    await page.waitForTimeout(350);
}

/**
 * Die drei Zustaende. Jeder stellt sich selbst her und meldet per Rueckgabe,
 * warum es nicht geklappt hat (null = alles gut).
 */
const ZUSTAENDE = [
    {
        name: 'navigation',
        async aufbau(page) {
            await leisteEinfahren(page);
            const grund = await leisteAusfahren(page);
            if (grund) return grund;
            const m = await page.evaluate(() => {
                const tabs = [...document.querySelectorAll('.nav-tab[data-view]')];
                return { anzahl: tabs.length };
            });
            if (m.anzahl !== N) return `${m.anzahl} statt ${N} Reiter in der Leiste`;
            return null;
        }
    },
    {
        name: 'liste',
        async aufbau(page) {
            const grund = await navigiereMobil(page, 'locations');
            if (grund) return grund;
            await leisteEinfahren(page);
            const k = await page.locator('#locations-list').first().boundingBox();
            if (!k) return 'keine Ortsliste im DOM';
            await radDrehen(
                page,
                Math.round(k.x + k.width / 2),
                Math.round(k.y + Math.min(k.height / 2, 120)),
                60
            );
            const n = await page.locator('#locations-list .loc-item').count();
            if (n !== N) return `${n} statt ${N} Ortseintraege gerendert`;
            return null;
        }
    },
    {
        name: 'initiative',
        async aufbau(page) {
            const grund = await navigiereMobil(page, 'initiative');
            if (grund) return grund;
            await leisteEinfahren(page);
            const n = await page.locator('#init-list .init-entry').count();
            if (n !== KAEMPFER.length) {
                return `${n} statt ${KAEMPFER.length} Kaempfer in der Initiative`;
            }
            return null;
        }
    }
];

test.describe('Mobil-Layout — Ablichtung fuer die Nachkontrolle', () => {
    test.skip(!AKTIV, 'MOBIL_SCREENS=1 setzen, um die Bilder abzulegen');
    test.describe.configure({ mode: 'serial', timeout: 240000 });

    test.beforeAll(() => {
        fs.mkdirSync(AUSGABE_DIR, { recursive: true });
    });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            const fehlgeschlagen = [];
            let abgelegt = 0;
            for (const [breite, hoehe] of FENSTER) {
                await page.setViewportSize({ width: breite, height: hoehe });
                await ladeMobil(page, theme);
                for (const z of ZUSTAENDE) {
                    let grund = null;
                    try {
                        grund = await z.aufbau(page);
                    } catch (e) {
                        grund = 'Ausnahme: ' + String(e && e.message).split('\n')[0];
                    }
                    const marke = `${z.name}-${breite}x${hoehe}-${theme}`;
                    if (grund) {
                        fehlgeschlagen.push(`${marke}: ${grund}`);
                        console.log(`[mobil-screens] ${marke} NICHT hergestellt — ${grund}`);
                        continue;
                    }
                    const ziel = path.join(AUSGABE_DIR, `${marke}.png`);
                    await page.screenshot({ path: ziel, fullPage: false });
                    const groesse = fs.statSync(ziel).size;
                    if (groesse === 0) {
                        fehlgeschlagen.push(`${marke}: Bild ist 0 Byte`);
                        continue;
                    }
                    abgelegt++;
                }
            }
            console.log(
                `[mobil-screens] ${theme}: ${abgelegt} von ${FENSTER.length * ZUSTAENDE.length} ` +
                    `Bildern in ${AUSGABE_DIR}`
            );
            expect(abgelegt, `Theme ${theme} hat keine Bilder abgelegt`).toBe(
                FENSTER.length * ZUSTAENDE.length
            );
            // Ein nicht hergestellter Zustand ist ein Befund, kein Grund, die
            // uebrigen Bilder wegzuwerfen — aber er muss den Lauf roeten.
            expect(fehlgeschlagen, `Zustaende ohne Bild in ${theme}`).toEqual([]);
        });
    }
});
