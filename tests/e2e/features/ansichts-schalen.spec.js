/* Ansichts-Schalen: berechnetes `display`, Erreichbarkeit langer Listen, ein
   sichtbarer Reiter je Reiter (UAT-Einheit U1)
   ===========================================================================
   WARUM ES DIESE PROBE BRAUCHT. Vier der fuenf Master-Detail-Schalen
   (`.loc-view`, `.npc-view`, `.loot-view`, `.enc-view`) erklaeren sich in ihrer
   eigenen Datei als `display: flex` — aber `.view.active { display: block }` in
   `assets/styles/dmscreen.css` hat dieselbe Spezifitaet (0,2,0) und steht im
   12. `@import`, also SPAETER als core.css (3.), npcs.css (5.) und
   encounters.css (6.). Die vier verlieren die Kaskade und stehen aktiv auf
   `block`. Damit greift `flex: 1; min-height: 0` am inneren `*-layout` nicht
   mehr, die innere Spalte `.loc-master`/`.npc-master`/`.loot-master` bekommt
   keine begrenzte Hoehe, ihr `overflow-y: auto` erzeugt keinen Scrollbereich —
   und die Liste waechst unter die feste Schalenhoehe `calc(100vh - 120px)` mit
   `overflow: hidden`. Ab dem 10. Eintrag ist alles Weitere per Mausrad,
   Scrollbalken und Beruehrung UNERREICHBAR. Nur `.bestiary-view` (19. `@import`)
   ist heil — der Beleg, dass die Reihenfolge entscheidet.

   Dasselbe `display: block` trifft den DM-Screen selbst: `#view-dmscreen` traegt
   `.dmscreen-view { display: flex }` (0,1,0) und verliert gegen `.view.active`
   (0,2,0), sein `gap: 16px` wirkt nicht. Umgekehrt gewinnt `.dmscreen-view`
   gegen `.view { display: none }` (0,1,0, frueher in DERSELBEN Datei) — der
   DM-Screen-Abschnitt steht deshalb auf JEDEM anderen Reiter als 32px hoher
   Streifen mit im Dokument.

   WARUM PER MAUSRAD UND NICHT PER `scrollTop`. Ein Setzen von `scrollTop`
   bewegt auch einen Bereich, den der Nutzer gar nicht scrollen kann, und
   `scrollIntoView()` ebenso. Eine Messung, die so prueft, meldet Erreichbarkeit,
   wo keine ist. Diese Probe fuehrt das Mausrad ueber der Liste und prueft am
   Ende per `elementFromPoint`, dass der letzte Eintrag wirklich anklickbar
   obenauf liegt — nicht nur geometrisch im Fenster steht.

   ROT OHNE DIE KORREKTUR (an a90bdd6 gemessen, 24 Eintraege je Liste):
     Schalen  loc/npc/loot/enc = "block" statt "flex" (nur bestiary = "flex")
     Orte/NSCs/Truhe: letzter Eintrag nach 60x Mausrad nicht erreichbar
     Reiter:  23 der 24 Reiter zeigen ZWEI `.view` (die eigene + `#view-dmscreen`) */
import { test, expect } from '@playwright/test';

const BUNDLE = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Deutlich mehr als die neun, die heute durchkommen — der Verlust beginnt ab dem 10. */
const ANZAHL = 24;

const reihe = (wort, extra) =>
    Array.from({ length: ANZAHL }, (_, i) => ({
        id: i + 1,
        name: `${wort} ${String(i + 1).padStart(2, '0')}`,
        ...extra
    }));

/* Wie `seedCleanSession()` in tests/e2e/helpers/test-utils.js: weit-in-der-Zukunft-
   `_version` ueberspringt `migrateData()`, die vier von `initializeData()` NICHT
   vorbelegten Schluessel und eine gefuellte `_nextId`-Abbildung verhindern die
   beiden Fruehstart-Rennen. Zusaetzlich 24 Datensaetze je Liste. */
const SAAT = {
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
    locations: reihe('Ort', { type: 'Stadt', region: 'Kernland', description: 'Probeeintrag' }),
    npcs: reihe('NSC', { race: 'Mensch', role: 'Haendler', description: 'Probeeintrag' }),
    loot: reihe('Beute', { type: 'Waffe', value: 10, description: 'Probeeintrag' }),
    encounters: reihe('Begegnung', { difficulty: 'medium', monsters: [], description: 'Probe' }),
    bestiary: reihe('Kreatur', { cr: '1', type: 'Bestie', size: 'M', ac: 12, hp: 20 }),
    randomTables: [],
    timers: [],
    shops: [],
    campaign: {},
    _nextId: {
        characters: 99,
        npcs: 99,
        locations: 99,
        quests: 99,
        encounters: 99,
        spells: 99,
        loot: 99,
        items: 99,
        wiki: 99,
        sessionNotes: 99,
        randomTables: 99,
        bestiary: 99
    }
};

/** Die fuenf Master-Detail-Schalen: Reitername, Schalen-Element, Klasse. */
const SCHALEN = [
    ['locations', 'view-locations', 'loc-view'],
    ['npcs', 'view-npcs', 'npc-view'],
    ['loot', 'view-loot', 'loot-view'],
    ['encounter', 'view-encounter', 'enc-view'],
    ['bestiary', 'view-bestiary', 'bestiary-view']
];

/** Die vier Listen, deren Erreichbarkeit der Befund betrifft. */
const LISTEN = [
    ['locations', '#locations-list'],
    ['npcs', '#npc-list'],
    ['loot', '#loot-list'],
    ['encounter', '#encounter-list']
];

async function appLaden(page) {
    await page.addInitScript(saat => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(saat));
        } catch {
            // file:// erlaubt localStorage nicht in jedem Build — dann greift der App-Standard.
        }
    }, SAAT);
    await page.goto(BUNDLE);
    await page.waitForSelector('.app-title', { timeout: 20000 });
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 20000
    });
    await page.waitForTimeout(500);
}

async function reiterWechseln(page, name) {
    await page.evaluate(n => window.switchView(n), name);
    await page.waitForTimeout(350);
}

test.describe('Ansichts-Schalen (U1)', () => {
    test('die fuenf Master-Detail-Schalen stehen aktiv auf display:flex', async ({ page }) => {
        await appLaden(page);
        const gemessen = {};
        for (const [reiter, elementId, klasse] of SCHALEN) {
            await reiterWechseln(page, reiter);
            gemessen[klasse] = await page.evaluate(id => {
                const el = document.getElementById(id);
                if (!el) return 'FEHLT';
                if (!el.classList.contains('active')) return 'NICHT-AKTIV';
                return getComputedStyle(el).display;
            }, elementId);
        }
        console.log('[U1] berechnetes display der Schalen:', JSON.stringify(gemessen));
        expect(gemessen).toEqual({
            'loc-view': 'flex',
            'npc-view': 'flex',
            'loot-view': 'flex',
            'enc-view': 'flex',
            'bestiary-view': 'flex'
        });
    });

    test('der DM-Screen steht aktiv auf display:flex', async ({ page }) => {
        await appLaden(page);
        await reiterWechseln(page, 'dmscreen');
        const gemessen = await page.evaluate(() => {
            const el = document.getElementById('view-dmscreen');
            return {
                display: getComputedStyle(el).display,
                hoehe: Math.round(el.getBoundingClientRect().height)
            };
        });
        console.log('[U1] DM-Screen:', JSON.stringify(gemessen));
        expect(gemessen.display).toBe('flex');
    });

    for (const [reiter, listenSel] of LISTEN) {
        test(`der letzte von ${ANZAHL} Eintraegen ist per Mausrad erreichbar: ${reiter}`, async ({
            page
        }) => {
            await appLaden(page);
            await reiterWechseln(page, reiter);

            const anzahl = await page.evaluate(sel => {
                const liste = document.querySelector(sel);
                return liste ? liste.children.length : 0;
            }, listenSel);
            expect(anzahl, `${listenSel} muss ${ANZAHL} Eintraege rendern`).toBe(ANZAHL);

            // Mausrad ueber der Liste — NICHT scrollTop, das taeuscht Erreichbarkeit vor.
            const kasten = await page.locator(listenSel).boundingBox();
            const mx = Math.min(
                Math.max(kasten.x + kasten.width / 2, 5),
                page.viewportSize().width - 5
            );
            await page.mouse.move(mx, Math.round(page.viewportSize().height / 2));
            for (let i = 0; i < 60; i++) await page.mouse.wheel(0, 400);
            await page.waitForTimeout(400);

            const befund = await page.evaluate(sel => {
                const liste = document.querySelector(sel);
                const posten = Array.from(liste.children);
                const letzter = posten[posten.length - 1];
                const r = letzter.getBoundingClientRect();
                const imFenster = r.top < window.innerHeight && r.bottom > 0 && r.height > 0;
                // Treffertest in der Mitte des sichtbaren Teils: liegt der Eintrag obenauf?
                const px = Math.round(r.left + Math.min(r.width, window.innerWidth - r.left) / 2);
                const py =
                    Math.round(
                        Math.max(r.top, 0) +
                            Math.min(r.bottom, window.innerHeight - 1) -
                            Math.max(r.top, 0)
                    ) - 4;
                const getroffen = imFenster ? document.elementFromPoint(px, py) : null;
                const sichtbarAnzahl = posten.filter(n => {
                    const b = n.getBoundingClientRect();
                    return b.bottom > 0 && b.top < window.innerHeight;
                }).length;
                return {
                    n: posten.length,
                    sichtbarAnzahl,
                    letzterOben: Math.round(r.top),
                    letzterUnten: Math.round(r.bottom),
                    fensterhoehe: window.innerHeight,
                    imFenster,
                    anklickbar: !!(
                        getroffen &&
                        (letzter === getroffen || letzter.contains(getroffen))
                    )
                };
            }, listenSel);
            console.log(`[U1] ${reiter}: ${JSON.stringify(befund)}`);
            expect(
                befund.imFenster,
                `letzter Eintrag von ${reiter} liegt nach 60x Mausrad bei top=${befund.letzterOben}px (Fensterhoehe ${befund.fensterhoehe}px)`
            ).toBe(true);
            expect(befund.anklickbar, `letzter Eintrag von ${reiter} liegt nicht obenauf`).toBe(
                true
            );
        });
    }

    test('auf jedem der 24 Reiter ist genau eine .view sichtbar', async ({ page }) => {
        await appLaden(page);
        const reiter = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.nav-tab[data-view]')).map(t => t.dataset.view)
        );
        expect(reiter.length, 'Anzahl der Reiter mit data-view').toBe(24);
        expect(await page.evaluate(() => document.querySelectorAll('.view').length)).toBe(24);

        const abweichungen = [];
        for (const name of reiter) {
            await reiterWechseln(page, name);
            const sichtbar = await page.evaluate(() =>
                Array.from(document.querySelectorAll('.view'))
                    .filter(v => getComputedStyle(v).display !== 'none')
                    .map(v => v.id)
            );
            if (sichtbar.length !== 1 || sichtbar[0] !== `view-${name}`) {
                abweichungen.push(`${name} -> [${sichtbar.join(', ')}]`);
            }
        }
        console.log(
            `[U1] Reiter mit nicht genau einer sichtbaren .view: ${abweichungen.length}/24`
        );
        expect(abweichungen, abweichungen.join(' | ')).toEqual([]);
    });
});
