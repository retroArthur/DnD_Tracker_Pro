// @ts-check
/**
 * Stufe-2-Ablichtung der Welle 3 (Design-Handoff v3, Schritt 10)
 * ==============================================================
 *
 * WOFUER, und warum diese Welle sie noetiger braucht als die zwei vorigen: der
 * versionierte Stil-Sollstand (computed-style-diff.spec.js) kann Welle 3 nicht
 * abnehmen. Von 3626 Digests tragen genau SECHS einen `box-shadow` ungleich
 * `none`, und alle sechs kommen von zwei Elementen der Laden-Ansicht. Von 71
 * Schattendeklarationen erreichen nur 2 einen Ruhezustands-Schluessel, 8 haengen
 * an `:hover`/`:focus`, 61 liegen ausserhalb der View-Container. Wer aus
 * „6 von 3626 gruen" auf „die Welle ist belegt" schliesst, hat 61 von 71
 * Deklarationen nie gesehen.
 *
 * `R-19` bis `R-23` in tests/unit/design-consistency.test.js messen Geometrie,
 * Ort-zu-Stufe-Zuordnung und Kontrastabstand. Keine davon beantwortet die Frage
 * dieser Runde: OB EINE HOEHENLAGE NOCH ALS HOEHE UND EINE LEUCHTMARKE NOCH ALS
 * MARKE GELESEN WIRD. Diese Datei stellt das Material dafuer her.
 *
 * SIE PRUEFT NICHTS. Sie behauptet nichts ueber Kontraste und faellt bei keinem
 * Farbwert durch — sie legt Bilder ab, ueber die ein Mensch urteilt. Ein gruener
 * Lauf dieser Datei ist deshalb KEINE Abnahme.
 *
 * DIE NEUN ZUSTANDSBILDER sind nicht die der Wellen 1 und 2. Sie zeigen genau
 * die Stellen, die im Ruhezustand einer Ansicht NICHT zu sehen sind und die die
 * Sichtprobenliste (.planning/HANDOFF-V3-OFFENE-PUNKTE.md, W3-F-01) fuehrt:
 *
 *   rechner              Teil A Punkt 1 — der groesste Sprung der ganzen Welle.
 *                        `0 20px 60px` -> Stufe 3 `0 8px 32px`, Faktor 0,53.
 *                        Die Weichzeichnung halbiert sich. Das ist die Stelle,
 *                        an der zu widersprechen waere; W3-D-02 nennt den Preis
 *                        ausdruecklich und schickt sie NICHT in eine Ausnahme.
 *   befehlspalette       Teil A Punkt 2 — dasselbe eine Stufe schwaecher,
 *                        Faktor 0,67.
 *   offline-hinweis      Teil A Punkt 3 — die EINZIGE Stelle des ganzen
 *                        Stilbaums, die je `var(--shadow)` gelesen hat. In
 *                        Contrast war dieses Token `rgba(255,255,255,0.1)`, also
 *                        ein WEISSER Hauch; dort steht jetzt ein harter grauer
 *                        Umriss. Zusaetzlich Stufe 2 statt Stufe 1, obwohl der
 *                        Radius naeher an 6 als an 16 liegt — die eine bewusste
 *                        Abweichung von der Radiusregel.
 *   statblock-schublade  Teil A Punkt 11 — eigenes Token `--shadow-drawer`. In
 *                        Light/Sepia faellt die Deckung 0,50 -> 0,14/0,16, in
 *                        Contrast wird aus 24 px Weichzeichnung ein harter
 *                        2-px-Umriss links. Staerkste Abschwaechung des
 *                        Schritts 7.
 *   sprungmarke-nsc      Teil D — eine der vier goldenen Sprungmarken aus dem
 *   sprungmarke-ort      JavaScript. Aufgabe: „zeig mir in zwei Sekunden, wohin
 *                        ich gesprungen bin." Sie tragen jetzt zwei Lagen
 *                        `--glow-gold` (zusammen 75 % Deckung) statt
 *                        volldeckendem Gold. Beide sind ZEITLICH BEGRENZT — die
 *                        Marke loescht sich nach 2000 ms selbst, das Bild
 *                        entsteht innerhalb dieses Fensters.
 *   kartenschweben       Teil B — der schlechteste Doppellinienfall der Welle
 *                        (1,05): beim Schweben faerbt die Karte ihren Rahmen auf
 *                        `--gold-dim` um, daneben steht in Contrast ein 2-px-
 *                        Umriss `#aaa`. Kein Helligkeitsunterschied.
 *   qref-fab-hover       Teil A Punkt 8 — Ruhe und Hover liegen jetzt auf
 *                        DERSELBEN Stufe 2. Die Rueckmeldung beim Ueberfahren
 *                        traegt allein noch `transform: scale(1.1)`.
 *   vorlesetext          Teil A Punkt 12 — die sieben Aussenlagen des
 *                        Vorlesetextes. In Contrast bekommen sie einen
 *                        sichtbaren Umriss, wo vorher ein Hauch war; in Dark
 *                        wird der Hof staerker (0,15 -> 0,35). Der Kasten traegt
 *                        schon einen 4-px-`border-left` in seiner Papierfarbe —
 *                        rahmt der neue Umriss ihn, oder konkurriert er?
 *
 * JEDES ZUSTANDSBILD STELLT SEINEN ZUSTAND SELBER HER und meldet per Rueckgabe,
 * ob es geklappt hat. Ein fehlgeschlagenes Zustandsbild ist ein Befund fuer die
 * Sichtung, kein Grund, die 24 Vollbilder desselben Themes wegzuwerfen — dasselbe
 * Muster wie in welle-2-screens.spec.js.
 *
 * WARUM HINTER EINEM SCHALTER: 132 Vollbilder kosten Zeit und Platz. Ohne
 * gesetztes `WELLE3_SCREENS=1` ueberspringt sich die Datei (`test.skip` mit
 * Grund — dasselbe Muster wie welle-1-screens.spec.js und welle-2-screens.spec.js),
 * damit `npm run test:e2e` unveraendert schnell bleibt. Aufruf:
 *
 *     WELLE3_SCREENS=1 npx playwright test tests/e2e/features/welle-3-screens.spec.js
 *
 * VORHER BAUEN. Die Suite laedt das gebaute Buendel (file://), nicht den
 * Quellbaum — ohne `python build.py` lichtet dieser Lauf den alten Stand ab.
 * Bei einer Welle, die ausschliesslich CSS-Tokens verschiebt, ist das der
 * Unterschied zwischen einer Sichtprobe und einem Bild von gestern.
 *
 * Ablage: tests/e2e/__screens__/welle-3/<ansicht>-<theme>.png. Der Ordner ist
 * von .gitignore ausgenommen (Bilderstapel gehoert nicht in die Historie); die
 * Bilder entstehen oertlich neu, wann immer jemand sie braucht.
 *
 * KEINE MODULPFADE IN DEN KOMMENTAREN. Das Abdeckungs-Gate
 * (module-test-coverage.test.js) wertet jede woertliche Nennung eines
 * loader.js-Modulpfads unter tests/ als Abdeckung — auch die in einem
 * Kommentar. Beim ersten Lauf von welle-2-screens.spec.js ist genau das
 * passiert. Hier stehen darum nur Funktionsnamen, keine Pfade.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

const AKTIV = process.env.WELLE3_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/welle-3');

// Dieselben 24 Ansichten wie der Waechter und die zwei vorigen Ablichtungen
// (TAB_RENDER_REGISTRY). Welle 3 fasst 12 der 20 CSS-Dateien an; die
// Hoehenlagen verteilen sich ueber nahezu alle Ansichten.
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
 * Schliesst alles, was ein Zustandsbild geoeffnet haben koennte. Wird nach
 * jedem Bild gerufen, damit ein offenes Modal nicht das naechste verdeckt.
 * @param {import('@playwright/test').Page} page
 */
async function raeumeAuf(page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
        // @ts-ignore
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(100);
}

const ZUSTANDSBILDER = [
    {
        // Teil A Punkt 1 — Faktor 0,53, der groesste Sprung der Welle.
        name: 'rechner',
        ansicht: 'encounter',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus dem Begegnungsrechner
                if (typeof window.showCalculatorModal !== 'function') return false;
                // @ts-ignore
                window.showCalculatorModal();
                return true;
            });
            if (!da) return 'showCalculatorModal() ist nicht global';
            await page.waitForTimeout(400);
            const inhalt = page.locator('#calculator-modal .modal-content');
            if ((await inhalt.count()) === 0) return 'kein #calculator-modal .modal-content im DOM';
            if (!(await inhalt.first().isVisible())) return '#calculator-modal ist unsichtbar';
            return null;
        }
    },
    {
        // Teil A Punkt 2 — Faktor 0,67.
        name: 'befehlspalette',
        ansicht: 'dashboard',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus der Befehlspalette
                if (typeof window.toggleCommandPalette !== 'function') return false;
                // @ts-ignore
                window.toggleCommandPalette();
                return true;
            });
            if (!da) return 'toggleCommandPalette() ist nicht global';
            await page.waitForTimeout(400);
            const box = page.locator('.cp-box');
            if ((await box.count()) === 0) return 'keine .cp-box im DOM';
            if (!(await box.first().isVisible())) return '.cp-box ist unsichtbar';
            return null;
        }
    },
    {
        // Teil A Punkt 3 — die einzige Stelle mit dem alten `var(--shadow)`,
        // in Contrast vorher WEISS. Der Zustand entsteht ueber den echten Weg:
        // `navigator.onLine` wird auf false gelegt und das `offline`-Ereignis
        // ausgeloest, das der Offline-Beobachter der Anwendung abhoert. Die
        // Klasse wird NICHT von Hand gesetzt.
        name: 'offline-hinweis',
        ansicht: 'dashboard',
        async aufbau(page) {
            await page.evaluate(() => {
                Object.defineProperty(window.navigator, 'onLine', {
                    configurable: true,
                    get: () => false
                });
                window.dispatchEvent(new Event('offline'));
            });
            await page.waitForTimeout(400);
            const hinweis = page.locator('#offline-indicator');
            if ((await hinweis.count()) === 0) return 'kein #offline-indicator im DOM';
            if (!(await hinweis.first().isVisible())) {
                return '#offline-indicator bleibt unsichtbar — der Beobachter hat nicht gegriffen';
            }
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                Object.defineProperty(window.navigator, 'onLine', {
                    configurable: true,
                    get: () => true
                });
                window.dispatchEvent(new Event('online'));
            });
            await page.waitForTimeout(200);
        }
    },
    {
        // Teil A Punkt 11 — `--shadow-drawer`, in Contrast ein harter Umriss
        // links statt 24 px Weichzeichnung.
        name: 'statblock-schublade',
        ansicht: 'initiative',
        async aufbau(page) {
            const grund = await page.evaluate(() => {
                // @ts-ignore — global aus dem Statblock-Panel
                if (typeof window.showInitStatblockPanel !== 'function') {
                    return 'showInitStatblockPanel() ist nicht global';
                }
                // @ts-ignore
                const kampf = window.D && window.D.initiative;
                const erste = kampf && kampf.combatants && kampf.combatants[0];
                if (!erste) return 'keine Kaempfer in der Initiative des Seeds';
                // @ts-ignore
                window.showInitStatblockPanel(erste.id);
                return null;
            });
            if (grund) return grund;
            await page.waitForTimeout(500);
            const inhalt = page.locator('.init-statblock-content');
            if ((await inhalt.count()) === 0) return 'keine .init-statblock-content im DOM';
            if (!(await inhalt.first().isVisible())) return 'die Schublade ist unsichtbar';
            return null;
        }
    },
    {
        // Teil D — goldene Sprungmarke, NSC. Zeitfenster 2000 ms ab dem Setzen,
        // und das Setzen selbst haengt 100 ms hinter dem Aufruf.
        name: 'sprungmarke-nsc',
        ansicht: 'npcs',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus dem NSC-Modul
                if (typeof window.toggleNPC !== 'function') return false;
                // @ts-ignore
                window.toggleNPC(1);
                return true;
            });
            if (!da) return 'toggleNPC() ist nicht global';
            await page.waitForTimeout(600);
            const marke = page.locator('.npc-item[data-id="1"]');
            if ((await marke.count()) === 0) return 'kein .npc-item[data-id="1"] im DOM';
            const lage = await marke.first().evaluate(el => el.style.boxShadow);
            if (!lage) return 'die Sprungmarke traegt keinen Inline-Schatten (Fenster verpasst?)';
            return null;
        }
    },
    {
        // Teil D — goldene Sprungmarke, Ort. Dieselbe Marke an einem anderen
        // Ablageziel; beide gehoeren auf die Sichtprobe, weil die Flaeche
        // darunter verschieden hell ist.
        name: 'sprungmarke-ort',
        ansicht: 'locations',
        async aufbau(page) {
            const da = await page.evaluate(() => {
                // @ts-ignore — global aus dem Orte-Modul
                if (typeof window.toggleLocation !== 'function') return false;
                // @ts-ignore
                window.toggleLocation(1);
                return true;
            });
            if (!da) return 'toggleLocation() ist nicht global';
            await page.waitForTimeout(600);
            // `.loc-item`, nicht `.location-item`: so heisst die Klasse, die die
            // Sprungmarke im Orte-Modul selbst adressiert.
            const marke = page.locator('.loc-item[data-id="1"]');
            if ((await marke.count()) === 0) return 'kein .loc-item[data-id="1"] im DOM';
            const lage = await marke.first().evaluate(el => el.style.boxShadow);
            if (!lage) return 'die Sprungmarke traegt keinen Inline-Schatten (Fenster verpasst?)';
            return null;
        }
    },
    {
        // Teil B — der schlechteste Doppellinienfall der Welle (1,05).
        // ANSICHT PARTY, nicht DM-Schirm: die Regel steht in dmscreen.css, ist
        // aber NICHT auf den DM-Schirm beschraenkt (`.char-card:hover` ohne
        // Elternselektor). Die Karten sind dort, wo der Nutzer sie sieht — im
        // DM-Schirm liegen sie hinter zugeklappten Widgets und sind unsichtbar.
        name: 'kartenschweben',
        ansicht: 'party',
        async aufbau(page) {
            const karte = page.locator('#view-party .char-card').first();
            if ((await karte.count()) === 0) return 'keine .char-card in der Gruppen-Ansicht';
            if (!(await karte.isVisible())) return 'die erste .char-card ist unsichtbar';
            await karte.scrollIntoViewIfNeeded({ timeout: 5000 });
            await karte.hover({ force: true, timeout: 5000 });
            await page.waitForTimeout(300);
            return null;
        }
    },
    {
        // Teil A Punkt 8 — Ruhe und Hover auf derselben Stufe.
        name: 'qref-fab-hover',
        ansicht: 'dashboard',
        async aufbau(page) {
            const fab = page.locator('.qref-fab').first();
            if ((await fab.count()) === 0) return 'kein .qref-fab im DOM';
            if (!(await fab.isVisible())) return '.qref-fab ist unsichtbar';
            await fab.hover({ force: true, timeout: 5000 });
            await page.waitForTimeout(300);
            return null;
        }
    },
    {
        // Teil A Punkt 12 — die sieben Aussenlagen des Vorlesetextes. Der Seed
        // bringt keinen Vorlesekasten mit; hier wird EIN Wiki-Eintrag mit allen
        // sieben Papiertoenen angelegt und ueber den normalen Anzeigeweg
        // gerendert. Das Markup ist genau das, das der Editor schreibt.
        name: 'vorlesetext',
        ansicht: 'wiki',
        async aufbau(page) {
            const grund = await page.evaluate(() => {
                // @ts-ignore
                if (!window.D) return 'kein D im Fenster';
                const toene = ['', 'parchment', 'crimson', 'violet', 'sage', 'sky', 'slate'];
                const inhalt = toene
                    .map(
                        t =>
                            `<div class="read-aloud${t ? ' ' + t : ''}">Vorlesetext-Probe ` +
                            `${t || 'Grundton'} — Welle 3, Teil A Punkt 12.</div>`
                    )
                    .join('');
                // @ts-ignore
                window.D.wiki = window.D.wiki || [];
                // @ts-ignore
                if (!window.D.wiki.some(w => w.id === 990301)) {
                    // @ts-ignore
                    window.D.wiki.push({
                        id: 990301,
                        title: 'Vorlesetext-Probe (Welle 3)',
                        category: 'Sonstiges',
                        content: inhalt
                    });
                }
                // Der Inhalt eines Wiki-Eintrags steht NICHT in der Baumansicht,
                // sondern nur im Detailbereich — und der rendert ausschliesslich
                // den AUSGEWAEHLTEN Eintrag. Ohne diese Zeile zeigt das Wiki nur
                // Titel, und kein .read-aloud erreicht je den DOM.
                // `WikiState` ist ein Top-Level-`const` des Buendels und liegt
                // damit im globalen lexikalischen Bereich — erreichbar ueber den
                // blossen Namen, nicht als Fenster-Eigenschaft.
                try {
                    // @ts-ignore — Top-Level-const aus dem Wiki-Modul
                    WikiState.selectedEntryId = 990301;
                } catch {
                    return 'WikiState ist nicht erreichbar';
                }
                // @ts-ignore
                if (typeof window.renderWiki !== 'function') return 'renderWiki() ist nicht global';
                // @ts-ignore
                window.renderWiki();
                return null;
            });
            if (grund) return grund;
            await page.waitForTimeout(400);
            const kasten = page.locator('#view-wiki .read-aloud');
            if ((await kasten.count()) === 0) {
                return 'kein .read-aloud im Wiki — der Anzeigeweg hat die Klasse entfernt';
            }
            try {
                await kasten.first().scrollIntoViewIfNeeded({ timeout: 3000 });
            } catch {
                /* ausserhalb des Blickfelds ist kein Grund abzubrechen, fullPage faengt es */
            }
            await page.waitForTimeout(200);
            return null;
        }
    }
];

test.describe('Welle 3 — Ablichtung in vier Themes (Stufe 2)', () => {
    // Serienlauf: alle vier Themes teilen eine Seite und einen Seed; ein
    // paralleler Lauf wuerde vier Browser fuer dieselbe Arbeit hochfahren.
    test.describe.configure({ mode: 'serial' });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            test.skip(
                !AKTIV,
                'Ablichtung nur auf Anforderung: WELLE3_SCREENS=1 setzen (132 Vollbilder, nicht Teil der Standardlaeufe).'
            );
            test.setTimeout(300000);

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
                    console.log(`[welle-3-screens] ${bild.name} (${theme}): ${grund}`);
                    await raeumeAuf(page);
                    continue;
                }
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${bild.name}-${theme}.png`),
                    fullPage: true
                });
                if (bild.abbau) await bild.abbau(page);
                await raeumeAuf(page);
            }

            const abgelegt = fs.readdirSync(AUSGABE_DIR).filter(f => f.endsWith(`-${theme}.png`));
            console.log(`[welle-3-screens] ${theme}: ${abgelegt.length} Bilder in ${AUSGABE_DIR}`);
            expect(abgelegt.length, `Theme ${theme} hat keine Bilder abgelegt`).toBeGreaterThan(0);
        });
    }
});
