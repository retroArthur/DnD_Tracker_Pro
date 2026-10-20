// @ts-check
/**
 * Ablichtung der vier UAT-Funde fuer die menschliche Nachkontrolle
 * ===============================================================
 *
 * WOFUER. Die vier Funde der Pruefrunde sind korrigiert und von Zusicherungen
 * bewacht. Zusicherungen beantworten aber nicht die Frage, an der die erste
 * Auslieferung gescheitert ist: SIEHT ES AM TISCH RICHTIG AUS. Diese Datei
 * stellt das Material her, ueber das ein Mensch urteilt — je Fund den Zustand,
 * in dem der Fund sichtbar war, in allen vier Themes.
 *
 * SIE PRUEFT NICHTS AM AUSSEHEN. Sie faellt nur durch, wenn ein Zustand sich
 * nicht herstellen laesst (dann ist das Bild wertlos) oder wenn kein Bild
 * entsteht. Ein gruener Lauf ist KEINE Abnahme der Gestaltung.
 *
 * DIE SIEBEN ZUSTAENDE, je Theme:
 *
 *   orte / nscs / truhe   Die drei Ansichten, deren letzter Eintrag
 *                         unerreichbar war. 24 Eintraege, GANZ NACH UNTEN
 *                         gescrollt — die Frage an den Menschen ist, ob der
 *                         letzte Eintrag vollstaendig und unverdeckt dasteht.
 *   begegnungen           Die vierte Schale derselben Bauart. Sie war nicht
 *                         kaputt und ist die Gegenprobe: dort darf sich nichts
 *                         verschlechtert haben.
 *   initiative-menue      Der Fund selbst: gescrollte Initiative mit
 *                         aufgeklapptem Navigationsmenue. Vorher lagen 23 von
 *                         25 Eintraegen unter der Runden- und der
 *                         Aktionsleiste. Zu beurteilen ist, ob das Menue
 *                         sauber ueber beiden Leisten liegt.
 *   ereignis-dialog       Der Dialog, der gar nicht aufging. Jetzt offen, mit
 *                         ausgefuellten Feldern — zu beurteilen sind die
 *                         Formular-Primitive, die vorher keine einzige Regel
 *                         hatten (Beschriftung ueber dem Feld, Feldbreite,
 *                         Schliessknopf).
 *   kampfprotokoll        Das neue Panel, geoeffnet nach sechs schnellen
 *                         Mob-Angriffen und nach Ablauf der fluechtigen
 *                         Anzeige. Zu beurteilen: ist die Liste lesbar, sind
 *                         die Kampf-Marken erkennbar, verdeckt das Panel
 *                         nichts, was man gleichzeitig braucht.
 *
 * WARUM HINTER EINEM SCHALTER: 28 Vollbilder kosten Zeit und Platz. Ohne
 * gesetztes UAT_SCREENS=1 ueberspringt sich die Datei (dasselbe Muster wie die
 * drei Wellen-Ablichtungen), damit `npm run test:e2e` unveraendert schnell
 * bleibt. Aufruf:
 *
 *     UAT_SCREENS=1 npx playwright test tests/e2e/features/uat-funde-screens.spec.js
 *
 * VORHER BAUEN. Der Lauf laedt das gebaute Buendel per file://, nicht den
 * Quellbaum. Drei der vier Funde sind reine Kaskadenbefunde — ohne frischen
 * Build lichtet dieser Lauf den Stand von gestern ab.
 *
 * Ablage: tests/e2e/__screens__/uat-funde/<zustand>-<theme>.png. Der Ordner ist
 * von .gitignore ausgenommen (Bilderstapel gehoert nicht in die Historie).
 *
 * KEINE MODULPFADE IN DEN KOMMENTAREN. Das Abdeckungs-Gate wertet jede
 * woertliche Nennung eines Modulpfads unter tests/ als Abdeckung — auch die in
 * einem Kommentar. Hier stehen darum nur Funktions- und Selektornamen.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AKTIV = process.env.UAT_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/uat-funde');

const THEMES = ['dark', 'light', 'sepia', 'contrast'];

// 24 Eintraege je Liste — ueber der Forderung von 20, und genug, dass die Liste
// in jedem gepruefeten Fenster scrollen MUSS.
const N = 24;

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
const NSCS = [
    'Volo Geddarm',
    'Mirt der Wucherer',
    'Laeral Silberhand',
    'Durnan der Wirt',
    'Jarlaxle Baenre',
    'Schwester Garaele',
    'Sildar Hallwinter',
    'Gundren Rockseeker',
    'Halia Thornton',
    'Toblen Stonehill',
    'Harbin Wester',
    'Daran Edermath',
    'Qelline Alderleaf',
    'Reidoth der Druide',
    'Hamun Kost',
    'Iarno Albrek',
    'Nezznar der Schwarze Speer',
    'Yeemik der Goblin',
    'Klarg der Bugbear',
    'Agatha die Banshee',
    'Venomfang der Drache',
    'Grol der Haeuptling',
    'Vyerith die Haendlerin',
    'Nundro Rockseeker'
];
const BEUTE = [
    'Flammenzunge',
    'Trank der Heilung',
    'Umhang des Schutzes',
    'Seil des Kletterns',
    'Handschuhe der Ogerkraft',
    'Stab der Schlangen',
    'Ring des Springens',
    'Stiefel der Elfenart',
    'Tasche der Haltung',
    'Bronzener Greif',
    'Zwergenplatte',
    'Schild des Widerhalls',
    'Amulett der Gesundheit',
    'Dolch des Venoms',
    'Zauberbuch des Magus',
    'Kugel des Drachentoeters',
    'Perle der Macht',
    'Bogen der Zielsicherheit',
    'Mantel der Fledermaus',
    'Laterne der Entdeckung',
    'Wurfbeil plus Eins',
    'Elfenkettenhemd',
    'Trank des Riesenwuchses',
    'Kelch der Laeuterung'
];
const BEGEGNUNGEN = [
    'Goblin-Hinterhalt',
    'Wolfsrudel am Pass',
    'Banditenlager',
    'Oger an der Bruecke',
    'Skelettwache der Gruft',
    'Riesenspinnen im Keller',
    'Gnoll-Streifschar',
    'Kultisten im Ritual',
    'Schattendrache (jung)',
    'Zombie-Horde',
    'Harpyien-Klippe',
    'Troll unter der Bruecke',
    'Mimik in der Schatzkammer',
    'Rabenschwarm im Nebel',
    'Hobgoblin-Patrouille',
    'Wasserelementar',
    'Doppelgaenger-Taeuschung',
    'Eismephiten-Nest',
    'Schreckenswolf-Meute',
    'Basilisk der Steinhalle',
    'Kobold-Fallenbau',
    'Druide der Gruenen Hand',
    'Werwolf bei Vollmond',
    'Lich-Diener'
];
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

/**
 * Saatgut fuer alle sieben Zustaende in einem Rutsch.
 * @param {string} theme
 */
function saat(theme) {
    const kaempfer = KAEMPFER.map((name, i) => {
        const c = {
            id: i + 1,
            name,
            initiative: 22 - i * 2,
            initBonus: 2,
            maxHp: 30 + i,
            currentHp: 30 + i,
            ac: 13 + (i % 4),
            type: i < 3 ? 'player' : 'monster',
            cr: '1',
            xp: 200,
            effects: []
        };
        // Der Mob traegt den Sammelangriff, aus dem der Protokoll-Fund entstand.
        if (name === 'Rabenschwarm') {
            c.mob = {
                count: 6,
                poolHp: 36,
                maxPoolHp: 36,
                individualMaxHp: 6,
                attackMode: 'nfach'
            };
            c.maxHp = 36;
            c.currentHp = 36;
        }
        return c;
    });
    return {
        _version: '99.0.0',
        settings: {
            theme,
            lastView: 'dashboard',
            markdownOnboardingSeen: true,
            levelingMode: 'xp'
        },
        campaign: { name: 'UAT-Abnahme' },
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
        npcs: NSCS.map((name, i) => ({
            id: i + 1,
            name,
            role: i % 2 ? 'Haendler' : 'Verbuendeter',
            race: 'Mensch',
            chapter: String((i % 4) + 1),
            description: 'Notizen zu ' + name + '.',
            relations: []
        })),
        locations: ORTE.map((name, i) => ({
            id: i + 1,
            name,
            type: i % 3 === 0 ? 'Stadt' : i % 3 === 1 ? 'Dungeon' : 'Wildnis',
            region: 'Schwertkueste',
            description: 'Beschreibung zu ' + name + '.',
            notes: ''
        })),
        loot: BEUTE.map((name, i) => ({
            id: i + 1,
            name,
            category:
                i % 4 === 0 ? 'weapon' : i % 4 === 1 ? 'potion' : i % 4 === 2 ? 'armor' : 'misc',
            rarity: ['normal', 'uncommon', 'rare', 'veryrare'][i % 4],
            value: (i + 1) * 25,
            quantity: 1,
            description: 'Beschreibung von ' + name + '.'
        })),
        encounters: BEGEGNUNGEN.map((name, i) => ({
            id: i + 1,
            name,
            difficulty: ['easy', 'medium', 'hard', 'deadly'][i % 4],
            monsters: [{ name: 'Goblin', count: 2 + (i % 4), cr: '1/4', xp: 50 }],
            notes: '',
            locationId: (i % N) + 1
        })),
        quests: [],
        spells: [],
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
            npcs: N + 1,
            locations: N + 1,
            quests: 1,
            encounters: N + 1,
            spells: 1,
            loot: N + 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Laedt das gebaute Buendel mit dem Saatgut und wartet, bis die Anwendung
 * wirklich bedienbar ist (die Markierung am Wurzelelement, nicht nur der Titel).
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function ladeMitSaat(page, theme) {
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
        // @ts-ignore — global aus den Hilfsfunktionen
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    }, theme);
    await page.waitForTimeout(300);
    const gesetzt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(gesetzt, `Theme ${theme} wurde nicht gesetzt`).toBe(theme);
}

/**
 * Wechselt die Ansicht ueber den echten Klickweg: Gruppenknopf, dann Eintrag.
 * @param {import('@playwright/test').Page} page
 * @param {string} gruppe
 * @param {string} view
 */
async function navigiere(page, gruppe, view) {
    await page.locator('.nav-group-btn', { hasText: gruppe }).click();
    await page.waitForTimeout(200);
    await page.locator(`.nav-group.open .nav-group-menu .nav-tab[data-view="${view}"]`).click();
    await page.waitForSelector(`#view-${view}.active`, { state: 'visible', timeout: 8000 });
    await page.waitForTimeout(400);
}

/**
 * Mausrad statt scrollTo — der Fund hing an der Scrollmechanik selbst.
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
 * Schliesst alles, was ein voriger Zustand offen gelassen haben koennte.
 * @param {import('@playwright/test').Page} page
 */
async function raeumeAuf(page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
        // @ts-ignore
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
        const p = document.getElementById('kampflog-panel');
        if (p) p.classList.remove('active');
        document.querySelectorAll('.nav-group.open').forEach(g => g.classList.remove('open'));
    });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(150);
}

/**
 * Die sieben Zustaende. Jeder stellt sich selbst her und meldet per Rueckgabe,
 * warum es nicht geklappt hat (null = alles gut).
 */
const ZUSTAENDE = [
    {
        name: 'orte',
        async aufbau(page) {
            await navigiere(page, 'Welt', 'locations');
            const k = await page.locator('.loc-master').boundingBox();
            if (!k) return 'keine .loc-master im DOM';
            await radDrehen(
                page,
                Math.round(k.x + k.width / 2),
                Math.round(k.y + k.height / 2),
                60
            );
            const n = await page.locator('#locations-list .loc-item').count();
            if (n !== N) return `${n} statt ${N} Ortseintraege gerendert`;
            return null;
        }
    },
    {
        name: 'nscs',
        async aufbau(page) {
            await navigiere(page, 'Charaktere', 'npcs');
            const k = await page.locator('.npc-master').boundingBox();
            if (!k) return 'keine .npc-master im DOM';
            await radDrehen(
                page,
                Math.round(k.x + k.width / 2),
                Math.round(k.y + k.height / 2),
                60
            );
            const n = await page.locator('#npc-list .npc-item').count();
            if (n !== N) return `${n} statt ${N} NSC-Eintraege gerendert`;
            return null;
        }
    },
    {
        name: 'truhe',
        async aufbau(page) {
            await navigiere(page, 'Inhalte', 'loot');
            const k = await page.locator('.loot-master').boundingBox();
            if (!k) return 'keine .loot-master im DOM';
            await radDrehen(
                page,
                Math.round(k.x + k.width / 2),
                Math.round(k.y + k.height / 2),
                60
            );
            const n = await page.locator('#loot-list .loot-item').count();
            if (n !== N) return `${n} statt ${N} Beuteeintraege gerendert`;
            return null;
        }
    },
    {
        // Gegenprobe: diese Schale war nicht kaputt.
        name: 'begegnungen',
        async aufbau(page) {
            await navigiere(page, 'Kampf', 'encounter');
            const k = await page.locator('.enc-master').boundingBox();
            if (!k) return 'keine .enc-master im DOM';
            await radDrehen(
                page,
                Math.round(k.x + k.width / 2),
                Math.round(k.y + k.height / 2),
                60
            );
            const n = await page.locator('#encounter-list .enc-item').count();
            if (n !== N) return `${n} statt ${N} Begegnungen gerendert`;
            return null;
        }
    },
    {
        name: 'initiative-menue',
        async aufbau(page) {
            await navigiere(page, 'Kampf', 'initiative');
            await radDrehen(page, 720, 600, 12);
            // Die Gruppe mit den sechs Eintraegen — dort war der Schaden am groessten.
            await page.locator('.nav-group-btn', { hasText: 'Inhalte' }).click();
            await page.waitForTimeout(350);
            const menu = page.locator('.nav-group.open > .nav-group-menu');
            if ((await menu.count()) === 0) return 'kein aufgeklapptes Navigationsmenue';
            if (!(await menu.first().isVisible())) return 'das Menue bleibt unsichtbar';
            const scrollY = await page.evaluate(() => Math.round(window.scrollY));
            if (scrollY < 100)
                return `die Seite ist nur ${scrollY}px gescrollt — der Zustand fehlt`;
            return null;
        }
    },
    {
        name: 'ereignis-dialog',
        async aufbau(page) {
            await navigiere(page, 'Welt', 'kalender');
            const knopf = page.locator('#tl-kalender-header [data-action="show-timeline-modal"]');
            if ((await knopf.count()) === 0) return 'kein Knopf "+ Ereignis" im Kalenderkopf';
            await knopf.click();
            await page.waitForTimeout(500);
            const karte = page.locator('#tl-event-modal .modal');
            if ((await karte.count()) === 0) return 'keine Modalkarte im DOM';
            if (!(await karte.first().isVisible())) return 'der Dialog bleibt unsichtbar';
            // Gefuellt ablichten: leere Felder zeigen die Primitive nicht.
            await page.fill('#tl-form-titel', 'Der Hafen von Luskan brennt');
            await page.fill(
                '#tl-form-beschreibung',
                'Die Seeschlange greift den Hafen an. Drei Schiffe verloren.'
            );
            await page.waitForTimeout(250);
            return null;
        }
    },
    {
        name: 'kampfprotokoll',
        async aufbau(page) {
            await navigiere(page, 'Kampf', 'initiative');
            const knopf = page.locator('.init-mob-attack-btn').first();
            if ((await knopf.count()) === 0) return 'kein Angriffsknopf in der Mob-Zeile';
            await knopf.scrollIntoViewIfNeeded();
            for (let i = 0; i < 6; i++) {
                await knopf.click({ force: true });
                await page.waitForTimeout(120);
            }
            // 3000 ms: Anzeigedauer und Ausblendung der fluechtigen Meldung sind
            // vorbei. Genau das ist der Zustand, in dem die Frage vorher
            // unbeantwortbar war.
            await page.waitForTimeout(3000);
            await page.keyboard.press('k');
            await page.waitForTimeout(500);
            const panel = page.locator('#kampflog-panel');
            if (!(await panel.first().isVisible())) return 'das Kampfprotokoll bleibt unsichtbar';
            const zeilen = await page.locator('#kampflog-panel .kplog-entry').count();
            if (zeilen < 6) return `nur ${zeilen} Protokollzeilen — die sechs Angriffe fehlen`;
            return null;
        }
    }
];

test.describe('UAT-Funde — Ablichtung fuer die Nachkontrolle', () => {
    test.skip(!AKTIV, 'UAT_SCREENS=1 setzen, um die Bilder abzulegen');
    test.describe.configure({ mode: 'serial', timeout: 240000 });

    test.beforeAll(() => {
        fs.mkdirSync(AUSGABE_DIR, { recursive: true });
    });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await ladeMitSaat(page, theme);

            const fehlgeschlagen = [];
            for (const z of ZUSTAENDE) {
                await raeumeAuf(page);
                let grund = null;
                try {
                    grund = await z.aufbau(page);
                } catch (e) {
                    grund = 'Ausnahme: ' + String(e && e.message).split('\n')[0];
                }
                if (grund) {
                    fehlgeschlagen.push(`${z.name}: ${grund}`);
                    console.log(
                        `[uat-funde-screens] ${z.name} (${theme}) NICHT hergestellt — ${grund}`
                    );
                    continue;
                }
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${z.name}-${theme}.png`),
                    fullPage: false
                });
            }

            const abgelegt = fs.readdirSync(AUSGABE_DIR).filter(f => f.endsWith(`-${theme}.png`));
            console.log(
                `[uat-funde-screens] ${theme}: ${abgelegt.length} Bilder in ${AUSGABE_DIR}`
            );
            expect(abgelegt.length, `Theme ${theme} hat keine Bilder abgelegt`).toBeGreaterThan(0);
            // Ein nicht hergestellter Zustand ist ein Befund, kein Grund, die
            // uebrigen Bilder wegzuwerfen — aber er muss den Lauf roeten.
            expect(fehlgeschlagen, `Zustaende ohne Bild in ${theme}`).toEqual([]);
        });
    }
});
