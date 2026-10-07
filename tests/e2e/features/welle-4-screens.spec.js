// @ts-check
/**
 * Stufe-2-Ablichtung der Welle 4 (Design-Handoff v3, Welle 4, Schritt 9)
 * ======================================================================
 *
 * WOFUER, und warum diese Welle sie noetiger braucht als alle drei vorigen: der
 * versionierte Stil-Sollstand (computed-style-diff.spec.js) hasht zwoelf
 * Eigenschaften — `transition` ist keine davon, und `width`/`height` sind
 * ausdruecklich ausgenommen. Die Haelfte dieser Welle (Schritt 1 bis 6: 134
 * Sammelbewegungen, 141 Dauer-Literale, drei tote Bewegungsmuster) ist dort
 * UNSICHTBAR, und die zweite Haelfte (die Icon-Knoepfe) bemisst sich genau
 * ueber die beiden ausgenommenen Eigenschaften. Von 3549 Schluesseln haben sich
 * 257 bewegt, und sie berichten AUSSCHLIESSLICH ueber borderRadius, padding,
 * fontSize und fontWeight. Dass ein Knopf von 24 auf 36 Pixel waechst, steht in
 * keinem Digest.
 *
 * `W4-R-01` bis `W4-R-06` in tests/unit/design-consistency.test.js messen die
 * Abwesenheit von Sammelbewegung, die Dauer-Leiter, die toten Muster und die
 * drei Basisregeln. Keine davon beantwortet die Frage dieser Runde: OB EIN CHIP
 * NOCH ALS CHIP UND EIN KNOPF NOCH ALS KNOPF GELESEN WIRD. Diese Datei stellt
 * das Material dafuer her.
 *
 * SIE PRUEFT NICHTS. Sie behauptet nichts ueber Groessen und faellt bei keinem
 * Pixelwert durch — sie legt Bilder ab, ueber die ein Mensch urteilt. Ein
 * gruener Lauf dieser Datei ist deshalb KEINE Abnahme.
 *
 * GEFUELLTE KAMPAGNE, NICHT LEER. Von 141 `all`-Selektoren hat in einer frischen
 * Kampagne nur bei 63 ein Element den DOM erreicht und nur bei 16 ein
 * SICHTBARES; eine Sichtprobe ohne Seed prueft also knapp ein Achtel. Darum
 * `seedPopulatedSession()` wie in den drei Vorgaengern.
 *
 * DIE ZWOELF ZUSTANDSBILDER zeigen genau die Stellen, die im Ruhezustand einer
 * Ansicht NICHT zu sehen sind und die die Sichtungsliste dieser Welle fuehrt:
 *
 *   wuerfel-schwebepanel   Der EINZIGE Verbraucher der Aufdeck-Bewegung. Fuehrte
 *                          vorher eine Sammelbewegung ueber 300 ms; traegt jetzt
 *                          die benannte Aufdeck-Bewegung mit opacity, transform
 *                          UND visibility. Ein- UND Ausblenden gehoeren
 *                          angesehen — die zwei Schwebe-Knoepfe hatten ihre
 *                          Ausblende zwischenzeitlich verloren.
 *   wuerfel-aktionschips   Fuenf Knoepfe der Wuerfelansicht (Vorteil, Nachteil,
 *                          Stats, Krit, Gruppe). Sie sind die staerkste
 *                          Groessenaenderung der Chip-Familie: 38 -> 26 Pixel
 *                          Hoehe, 14,4 -> 12 Pixel Schrift. Auf Telefonbreite
 *                          sind sie damit die kleinste Beruehrungsflaeche der
 *                          Familie.
 *   zauber-filterleiste    Die dichteste Chip-Flaeche der App. 26 Chips in einer
 *                          Leiste, alle von Radius 12 auf Pillenform.
 *   laden-kategorien       Die Kategoriemarken des Ladens: Radius 4 -> Pille,
 *                          Schrift 12,8 -> 12. Sie liegen auf farbigen
 *                          Flaechen, nicht auf neutralen.
 *   nsc-sektionsknoepfe    Die staerkste Vergroesserung: 24 -> 36 Pixel, Radius
 *                          4 -> 8. Zwei Knoepfe pro Abschnittskopf im
 *                          NSC-Detail.
 *   init-werkzeugleiste    Zwei weitere Wachstumsstellen (Statblock-Knopf und
 *                          Mob-Aufloesen) sowie die Dauer-Leiter im Kampf.
 *   zeitgeber-leiste       Die beiden Knoepfe, deren Rundung von 50 Prozent
 *                          (Kreis) auf 8 Pixel wechselt — aus Kreisen werden
 *                          abgerundete Quadrate. Die auffaelligste
 *                          Formaenderung der Icon-Familie.
 *   dms-lebendmarke        Die Marke mit der kleinsten Schrift der ganzen App:
 *                          7,70 Pixel. Sie steigt auf die Markengroesse 11.
 *                          Erwartet wird, dass sie dabei BREITER wird
 *                          (gemessen 38,84 -> 49,64 unter breiter Schrift) —
 *                          ob sie ihre Kopfzeile dabei sprengt, ist die Frage.
 *   schnellreferenz        Die Chips und Anwenden-Knoepfe der Schnellreferenz —
 *                          eine Flaeche, auf der Chips und Icon-Knoepfe
 *                          unmittelbar nebeneinander liegen.
 *   gruppen-rastplatz      Der Ruhe-Verwalter: Trefferwuerfel-Knoepfe und die
 *                          Heilungsvorschau. Hier aendert sich Tempo, nicht
 *                          Groesse — eine der 21 Stellen, deren Dauer von 300
 *                          oder 250 auf eine Sprosse der Leiter wandert.
 *   bestiarium-marken      19 Marken auf einer Flaeche: Hoehe 23,61 -> 18,
 *                          Radius 4 -> Pille. Die groesste Stueckzahl einer
 *                          Markenaenderung in einer Ansicht.
 *   mobil-filterleiste     Dieselben Chips auf 375 Pixel Breite, mit
 *                          Beruehrungsgeraet. Die Mobil-Runde hat eine
 *                          44-Pixel-Schranke gesetzt; die Chips liegen darunter
 *                          (vorher und nachher), die Icon-Knoepfe nicht mehr.
 *
 * JEDES ZUSTANDSBILD STELLT SEINEN ZUSTAND SELBER HER und meldet per Rueckgabe,
 * ob es geklappt hat. Ein fehlgeschlagenes Zustandsbild ist ein Befund fuer die
 * Sichtung, kein Grund, die 24 Vollbilder desselben Themes wegzuwerfen —
 * dasselbe Muster wie in den drei vorigen Ablichtungen.
 *
 * WARUM HINTER EINEM SCHALTER: 144 Vollbilder kosten Zeit und Platz. Ohne
 * gesetztes `WELLE4_SCREENS=1` ueberspringt sich die Datei (`test.skip` mit
 * Grund — dasselbe Muster wie die drei Vorgaenger), damit `npm run test:e2e`
 * unveraendert schnell bleibt. Aufruf:
 *
 *     WELLE4_SCREENS=1 npx playwright test tests/e2e/features/welle-4-screens.spec.js
 *
 * VORHER BAUEN. Die Suite laedt das gebaute Buendel (file://), nicht den
 * Quellbaum — ohne `python build.py` lichtet dieser Lauf den alten Stand ab.
 * Bei einer Welle, die ausschliesslich CSS verschiebt, ist das der Unterschied
 * zwischen einer Sichtprobe und einem Bild von gestern.
 *
 * Ablage: tests/e2e/__screens__/welle-4/<ansicht>-<theme>.png. Der Ordner ist
 * von .gitignore ausgenommen (Bilderstapel gehoert nicht in die Historie); die
 * Bilder entstehen oertlich neu, wann immer jemand sie braucht.
 *
 * KEINE MODULPFADE IN DEN KOMMENTAREN. Das Abdeckungs-Gate
 * (module-test-coverage.test.js) wertet jede woertliche Nennung eines
 * loader.js-Modulpfads unter tests/ als Abdeckung — auch die in einem
 * Kommentar. Hier stehen darum nur Funktionsnamen, keine Pfade.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

const AKTIV = process.env.WELLE4_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/welle-4');

// Dieselben 24 Ansichten wie der Waechter und die drei vorigen Ablichtungen
// (TAB_RENDER_REGISTRY). Welle 4 fasst 10 der 20 CSS-Dateien an; Chips, Marken
// und Icon-Knoepfe verteilen sich ueber nahezu alle Ansichten.
const VIEWS = [
    'dashboard',
    'party',
    'npcs',
    'locations',
    'quests',
    'encounter',
    'initiative',
    'loot',
    'shops',
    'spells',
    'notes',
    'wiki',
    'links',
    'dice',
    'timers',
    'data',
    'dmscreen',
    'bestiary',
    'sessionprep',
    'kalender',
    'reise',
    'fraktionen',
    'soundboard',
    'dicestats'
];

const THEMES = ['dark', 'light', 'sepia', 'contrast'];

// Zustandsherstellung wie im Waechter: zwei Markups entstehen erst im
// aufgeklappten Shop bzw. bei ausgewaehlter Fraktion.
const VIEW_STATE_SETUP = {
    shops: async page => {
        await page.evaluate(() => {
            // @ts-ignore — global aus dem Laden-Modul
            if (typeof window.toggleShop === 'function') window.toggleShop(1);
        });
    },
    fraktionen: async page => {
        await page.evaluate(() => {
            // @ts-ignore — global aus dem Fraktionen-Modul
            if (typeof window.selectFraktion === 'function') window.selectFraktion(1);
        });
    }
};

/**
 * Setzt das Theme ueber den echten Codepfad und raeumt die Quittungsmeldung
 * weg — `setTheme()` ruft `showToast()`, und ein Ereignis-Log im Bild verdeckt
 * genau die Flaechen, um die es geht.
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function setzeTheme(page, theme) {
    await page.evaluate(t => {
        // @ts-ignore — global aus dem Theme-Modul
        if (typeof window.setTheme === 'function') window.setTheme(t);
        // @ts-ignore — global aus den Hilfsfunktionen
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    }, theme);
    await page.waitForTimeout(250);
    const gesetzt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(gesetzt, `Theme ${theme} wurde nicht gesetzt`).toBe(theme);
}

/**
 * Wechselt zur Ansicht (derselbe Weg wie im Waechter: `switchView()`) und
 * stellt ggf. den Zustand her.
 * @param {import('@playwright/test').Page} page
 * @param {string} viewId
 */
async function zeigeAnsicht(page, viewId) {
    await page.evaluate(v => {
        // @ts-ignore — global aus der Ansichtsverwaltung
        window.switchView(v);
    }, viewId);
    await page.waitForSelector(`#view-${viewId}.active`, { state: 'visible', timeout: 5000 });
    if (VIEW_STATE_SETUP[viewId]) await VIEW_STATE_SETUP[viewId](page);
    await page.waitForTimeout(150);
}

/**
 * Schliesst alles, was ein Zustandsbild geoeffnet haben koennte, und stellt die
 * Fenstergroesse wieder her. Wird nach jedem Bild gerufen, damit ein offenes
 * Modal nicht das naechste verdeckt und die Telefonbreite nicht haengen bleibt.
 * @param {import('@playwright/test').Page} page
 */
async function raeumeAuf(page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
        // @ts-ignore
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(120);
}

const ZUSTANDSBILDER = [
    {
        // Der EINZIGE Verbraucher der Aufdeck-Bewegung — eingeblendet.
        name: 'wuerfel-schwebepanel-auf',
        ansicht: 'dashboard',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus dem Wuerfel-Modul
                if (typeof window.toggleFloatingDice !== 'function') return false;
                // @ts-ignore
                window.toggleFloatingDice();
                return true;
            });
            if (!da) return 'toggleFloatingDice() ist nicht global';
            await page.waitForTimeout(600);
            const panel = page.locator('.floating-dice-panel');
            if ((await panel.count()) === 0) return 'keine .floating-dice-panel im DOM';
            const sichtbar = await panel.first().evaluate(el => {
                const cs = getComputedStyle(el);
                return cs.visibility !== 'hidden' && Number(cs.opacity) > 0.5;
            });
            if (!sichtbar) return 'das Schwebepanel bleibt verborgen (visibility/opacity)';
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.toggleFloatingDice === 'function') window.toggleFloatingDice();
            });
            await page.waitForTimeout(500);
        }
    },
    {
        // Dasselbe Panel AUSGEBLENDET: die Ausblende ist der Teil, der in
        // dieser Welle zweimal verloren ging und zurueckgeholt wurde. Das Bild
        // belegt, dass nach dem Zuklappen keine Geisterflaeche stehen bleibt.
        name: 'wuerfel-schwebepanel-zu',
        ansicht: 'dashboard',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.toggleFloatingDice !== 'function') return false;
                // @ts-ignore
                window.toggleFloatingDice();
                return true;
            });
            if (!da) return 'toggleFloatingDice() ist nicht global';
            await page.waitForTimeout(500);
            await page.evaluate(() => {
                // @ts-ignore
                window.toggleFloatingDice();
            });
            await page.waitForTimeout(700);
            const panel = page.locator('.floating-dice-panel');
            if ((await panel.count()) === 0) return 'keine .floating-dice-panel im DOM';
            const zustand = await panel.first().evaluate(el => {
                const cs = getComputedStyle(el);
                return { vis: cs.visibility, op: cs.opacity };
            });
            if (zustand.vis !== 'hidden' && Number(zustand.op) > 0.05) {
                return `das Panel ist nach dem Zuklappen noch da (visibility ${zustand.vis}, opacity ${zustand.op})`;
            }
            return null;
        }
    },
    {
        // Fuenf Knoepfe, 38 -> 26 Pixel Hoehe. Beschnitt auf die Leiste, damit
        // die Groessenaenderung im Bild nicht in einem Vollbild verschwindet.
        name: 'wuerfel-aktionschips',
        ansicht: 'dice',
        beschnitt: '.dice-chip',
        async aufbau(page) {
            const chips = page.locator('#view-dice .dice-chip');
            const n = await chips.count();
            if (n === 0) return 'keine .dice-chip in der Wuerfelansicht';
            await chips.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Die dichteste Chip-Flaeche der App.
        name: 'zauber-filterleiste',
        ansicht: 'spells',
        beschnitt: '.filter-chip',
        async aufbau(page) {
            const chips = page.locator('#view-spells .filter-chip');
            if ((await chips.count()) === 0) return 'keine .filter-chip in der Zauberansicht';
            await chips.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Kategoriemarken auf farbigen Flaechen: Radius 4 -> Pille.
        name: 'laden-kategorien',
        ansicht: 'shops',
        beschnitt: '.shop-cat-badge',
        async aufbau(page) {
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.toggleShop === 'function') window.toggleShop(1);
            });
            await page.waitForTimeout(400);
            const marken = page.locator('#view-shops .shop-cat-badge');
            if ((await marken.count()) === 0) return 'keine .shop-cat-badge im aufgeklappten Laden';
            await marken.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Die staerkste Vergroesserung der Welle: 24 -> 36 Pixel.
        name: 'nsc-sektionsknoepfe',
        ansicht: 'npcs',
        beschnitt: '.npc-section-btn',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus dem NSC-Modul
                if (typeof window.selectNPC !== 'function') return false;
                // @ts-ignore
                const erster = window.D && window.D.npcs && window.D.npcs[0];
                if (!erster) return false;
                // @ts-ignore
                window.selectNPC(erster.id);
                return true;
            });
            if (!da) return 'selectNPC() ist nicht global oder der Seed hat keine NSC';
            await page.waitForTimeout(500);
            const knoepfe = page.locator('#view-npcs .npc-section-btn');
            if ((await knoepfe.count()) === 0) return 'keine .npc-section-btn im NSC-Detail';
            await knoepfe.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Zwei weitere Wachstumsstellen plus die Dauer-Leiter im Kampf.
        name: 'init-werkzeugleiste',
        ansicht: 'initiative',
        async aufbau(page) {
            const eintraege = page.locator('#view-initiative .init-entry');
            if ((await eintraege.count()) === 0) {
                return 'keine .init-entry — der Seed hat keinen laufenden Kampf';
            }
            await eintraege.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Aus Kreisen werden abgerundete Quadrate: 50 Prozent -> 8 Pixel.
        name: 'zeitgeber-leiste',
        ansicht: 'timers',
        beschnitt: '.timer-quick-add, .timer-quick-settings',
        async aufbau(page) {
            const knoepfe = page.locator(
                '#view-timers .timer-quick-add, #view-timers .timer-quick-settings'
            );
            if ((await knoepfe.count()) === 0) {
                return 'keine .timer-quick-add/.timer-quick-settings in der Zeitgeber-Ansicht';
            }
            await knoepfe.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // 7,70 Pixel Schrift steigen auf 11. Wird die Kopfzeile zu eng?
        name: 'dms-lebendmarke',
        ansicht: 'dmscreen',
        beschnitt: '.dms-live-badge',
        async aufbau(page) {
            const marke = page.locator('#view-dmscreen .dms-live-badge');
            if ((await marke.count()) === 0) return 'keine .dms-live-badge im DM-Schirm';
            const sichtbar = await marke.first().isVisible();
            if (!sichtbar) return '.dms-live-badge ist unsichtbar';
            await marke.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Chips und Icon-Knoepfe unmittelbar nebeneinander.
        name: 'schnellreferenz',
        ansicht: 'dashboard',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus der Schnellreferenz
                if (typeof window.toggleQuickRef !== 'function') return false;
                // @ts-ignore
                window.toggleQuickRef();
                return true;
            });
            if (!da) return 'toggleQuickRef() ist nicht global';
            await page.waitForTimeout(600);
            const panel = page.locator('.qref-panel');
            if ((await panel.count()) === 0) return 'kein .qref-panel im DOM';
            if (!(await panel.first().isVisible())) return 'das .qref-panel bleibt unsichtbar';
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.toggleQuickRef === 'function') window.toggleQuickRef();
            });
            await page.waitForTimeout(400);
        }
    },
    {
        // Tempo statt Groesse: eine der 21 Stellen, deren Dauer wandert.
        name: 'gruppen-rastplatz',
        ansicht: 'party',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus dem Ruhe-Verwalter
                if (typeof window.showRestModal !== 'function') return false;
                // @ts-ignore
                window.showRestModal();
                return true;
            });
            if (!da) return 'showRestModal() ist nicht global';
            await page.waitForTimeout(500);
            const modal = page.locator('.rest-modal-header, #rest-modal .modal-content');
            if ((await modal.count()) === 0) return 'kein Ruhe-Modal im DOM';
            if (!(await modal.first().isVisible())) return 'das Ruhe-Modal ist unsichtbar';
            return null;
        }
    },
    {
        // 19 Marken auf einer Flaeche: Hoehe 23,61 -> 18.
        name: 'bestiarium-marken',
        ansicht: 'bestiary',
        beschnitt: '.bestiary-badge',
        async aufbau(page) {
            const marken = page.locator('#view-bestiary .bestiary-badge');
            if ((await marken.count()) === 0)
                return 'keine .bestiary-badge in der Bestiariums-Ansicht';
            await marken.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Dieselben Chips auf Telefonbreite. KEIN eigener Browserkontext: die
        // Fenstergroesse wird gesetzt und von `raeumeAuf()` zurueckgestellt.
        // Erst NACH der Bereitschaft verengen — bei 375 Pixeln verbirgt die
        // Mobil-Kopfzeile den Titel, auf den die Bereitschaftspruefung wartet.
        name: 'mobil-filterleiste',
        ansicht: 'npcs',
        async aufbau(page) {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.waitForTimeout(700);
            const chips = page.locator('#view-npcs .npc-filter-chip');
            if ((await chips.count()) === 0) return 'keine .npc-filter-chip auf Telefonbreite';
            await chips.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(250);
            return null;
        }
    }
];

test.describe('Welle 4 — Ablichtung in vier Themes (Stufe 2)', () => {
    // Serienlauf: alle vier Themes teilen eine Seite und einen Seed; ein
    // paralleler Lauf wuerde vier Browser fuer dieselbe Arbeit hochfahren.
    test.describe.configure({ mode: 'serial' });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            test.skip(
                !AKTIV,
                'Ablichtung nur auf Anforderung: WELLE4_SCREENS=1 setzen (144 Vollbilder, nicht Teil der Standardlaeufe).'
            );
            test.setTimeout(360000);

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
                await zeigeAnsicht(page, bild.ansicht);
                let grund = null;
                try {
                    grund = await bild.aufbau(page);
                } catch (fehler) {
                    grund = fehler.message.split('\n')[0];
                }
                if (grund) {
                    console.log(`[welle-4-screens] ${bild.name} (${theme}): ${grund}`);
                    await raeumeAuf(page);
                    continue;
                }
                // Mit Beschnitt zusaetzlich eine Naheinstellung: die
                // Groessenaenderungen dieser Welle liegen bei wenigen Pixeln
                // und gehen in einem Vollbild unter.
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${bild.name}-${theme}.png`),
                    fullPage: true
                });
                if (bild.beschnitt) {
                    try {
                        const kasten = await page
                            .locator(bild.beschnitt)
                            .first()
                            .evaluate(el => {
                                const r = el.getBoundingClientRect();
                                return { x: r.x, y: r.y, w: r.width, h: r.height };
                            });
                        const rand = 60;
                        await page.screenshot({
                            path: path.join(AUSGABE_DIR, `${bild.name}-nah-${theme}.png`),
                            clip: {
                                x: Math.max(0, kasten.x - rand),
                                y: Math.max(0, kasten.y - rand),
                                width: Math.min(1400, kasten.w + 2 * rand + 320),
                                height: Math.min(700, kasten.h + 2 * rand)
                            }
                        });
                    } catch (fehler) {
                        console.log(
                            `[welle-4-screens] Naheinstellung ${bild.name} (${theme}): ${fehler.message.split('\n')[0]}`
                        );
                    }
                }
                if (bild.abbau) await bild.abbau(page);
                await raeumeAuf(page);
            }

            const abgelegt = fs.readdirSync(AUSGABE_DIR).filter(f => f.endsWith(`-${theme}.png`));
            console.log(`[welle-4-screens] ${theme}: ${abgelegt.length} Bilder in ${AUSGABE_DIR}`);
            expect(abgelegt.length, `Theme ${theme} hat keine Bilder abgelegt`).toBeGreaterThan(0);
        });
    }
});
