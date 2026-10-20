// @ts-check
/**
 * Stufe-2-Ablichtung der Welle 5 (Design-Handoff v3, Welle 5, Schritt 9)
 * ======================================================================
 *
 * WOFUER, und warum diese Welle sie anders braucht als die vier vorigen: der
 * versionierte Stil-Sollstand hasht zwoelf Eigenschaften zu EINEM Digest je
 * Element; `fontSize` und `fontWeight` sind zwei davon, die Deckung ist hier
 * also gut. Was er trotzdem nicht sagt, ist WIE VIEL und MIT WELCHER FOLGE:
 * ein Digest meldet "bewegt", nicht "zwei Zehntel schmaler" und erst recht
 * nicht "die Pille ist jetzt zu eng fuer ihren Text". Von 3549 Schluesseln
 * haben sich in dieser Welle 1318 bewegt, 63 sind neu hinzugekommen. Der
 * Bildpunkt-Vergleich (das Grundlinienwerkzeug) nennt die Zahlen; ob die
 * Flaeche danach noch stimmt, kann nur ein Mensch sagen.
 *
 * `W5-R-05` bis `W5-R-10` in tests/unit/design-consistency.test.js messen die
 * Skalentreue der Deklarationen, die drei Gewichte, die Inline-Typografie und
 * die Zielquote; `W5-R-09` (tests/e2e/features/schriftuntergrenze.spec.js)
 * misst die Untergrenze und die Formularschrift am Element. KEINE davon
 * beantwortet die Frage dieser Runde: SITZT DER TEXT NOCH IN SEINEM KASTEN,
 * UND LIEST SICH DIE FLAECHE NOCH ALS HIERARCHIE. Diese Datei stellt das
 * Material dafuer her.
 *
 * SIE PRUEFT NICHTS. Sie behauptet nichts ueber Bildpunkte und faellt bei
 * keinem Wert durch — sie legt Bilder ab, ueber die ein Mensch urteilt. Ein
 * gruener Lauf dieser Datei ist deshalb KEINE Abnahme.
 *
 * GEFUELLTE KAMPAGNE, NICHT LEER. Von 113 nachweislich erreichbaren Elementen
 * unter 11 Bildpunkten ist in einer frischen Kampagne nur ein Bruchteil
 * ueberhaupt im Baum — Kartenlisten, Attributpillen, Ladenzeilen und
 * Beschwoerungslisten entstehen erst mit Daten. Eine Sichtprobe ohne Saat
 * verbirgt gemessen 88 Prozent der Stellen. Darum `seedPopulatedSession()`
 * wie in den vier Vorgaengern.
 *
 * WARUM DIE VIER THEMES TROTZDEM LAUFEN, OBWOHL SIE FUER GROESSEN BEWEISBAR
 * LEER SIND. Nachgemessen in allen fuenf Grundlinien-Laeufen: 3672 Elemente,
 * 0 Abweichung in Groesse, Gewicht und Zeilenhoehe ueber dark/light/sepia/
 * contrast. Ein Themenwechsel KANN an einer Schriftgroesse nichts aendern. Die
 * Runde richtet sich hier also NICHT auf Groessen, sondern auf das, was die
 * Groessenaenderung an Farbe, Zeilenumbruch und Ueberlauf nach sich zieht —
 * ein Text, der eine Zeile mehr braucht, verschiebt eine Flaeche in jedem
 * Theme anders, weil Rahmen und Fuellungen verschieden stark tragen.
 *
 * DIE ZUSTANDSBILDER zeigen genau die Stellen, die die Sichtungsliste dieser
 * Welle fuehrt und die im Ruhezustand einer Ansicht NICHT zu sehen sind:
 *
 *   wuerfel-hero            Die groesste Zahl der App: 80 -> 72 Bildpunkte.
 *                           Die einzige Stelle, die die Sprosse `hero`
 *                           ueberhaupt benutzt.
 *   wuerfel-schwebepanel    Die Wurfzahl des schwebenden Paneels: 48 -> 34,
 *                           die staerkste Senkung der Welle (-14). Sie bleibt
 *                           absichtlich unter dem Wuerfel-Hero.
 *   zeitgeber-uhr           Dieselbe Senkung 48 -> 34 in einem 250-Bildpunkt-
 *                           Ring. Die Skala hat zwischen 34 und 72 keine
 *                           Sprosse; ob der Ring jetzt leer wirkt, ist die
 *                           Frage.
 *   dms-wuerfelwidget       22,40 -> 20. Die Wurfzahl des Wuerfel-Widgets im
 *                           DM-Schirm.
 *   begegnung-attributfelder  Sechs Eingabefelder 22,40 -> 20. Sie liegen
 *                           ueber der 16-Bildpunkt-Schwelle, loesen also
 *                           keinen Auto-Zoom aus.
 *   charakterkarte-pillen   DER WICHTIGSTE PUNKT DER SICHTUNG. Die
 *                           Attributpillen der Charakterkarte standen auf
 *                           10,08 (Name) und 10,64 (Modifikator) und steigen
 *                           auf 11 bzw. 12. Sechs Pillen in einer Reihe —
 *                           grossere Schrift in gleicher Breite heisst
 *                           engerer Satz.
 *   charakterformular       Die Attributfelder und Fertigkeitsmarken des
 *                           Charakterformulars: die dichteste Formularflaeche
 *                           der App, und die mit den meisten gehobenen
 *                           Kleinstwerten (9,18 -> 11 bei den 18
 *                           Fertigkeits-Expertisemarken).
 *   armaturenbrett-kennzahlen  Die Gewichtsumstellung 700 -> 600 an den
 *                           Kennzahlen des Armaturenbretts. Sieben Werte
 *                           nebeneinander; ob sie noch als Kennzahl und nicht
 *                           als Flaechentext lesen, entscheidet hier.
 *   wuerfelstatistik        Die Achsen- und Seitenbeschriftung des
 *                           Histogramms bleibt BEWUSST bei 7 bzw. 8 — es sind
 *                           Benutzereinheiten in einem skalierten
 *                           Koordinatensystem, keine Bildpunkte. Auf dem
 *                           Schreibtisch wirken sie 9,93 und 11,34.
 *   schnellreferenz         Die zwoelf Anwenden-Knoepfe standen auf 10,24 und
 *                           steigen auf die Markengroesse. Chips und
 *                           Icon-Knoepfe liegen hier unmittelbar nebeneinander.
 *   editor-tastenhilfen     Die fuenf Tastenhilfen bleiben bei 8 und die vier
 *                           Aufklapp-Pfeile bei 9 — beide namentlich
 *                           ausgenommen. Das Bild belegt, WARUM: bei 11 laufen
 *                           die Hilfen ineinander.
 *   truhe-formularfelder    Die Formularschrift. 254 Bedienelemente standen
 *                           auf Chromiums Vorgabe von 13,3333 und stehen jetzt
 *                           auf 12. Keine Deklaration hat sich geaendert —
 *                           eine ist DAZUGEKOMMEN.
 *   mobil-charakterkarte    Dieselben Attributpillen auf 375 Bildpunkten
 *                           Breite, mit Beruehrungsgeraet. Die
 *                           Mobilvergroesserung BLEIBT (E-2); die Frage ist, ob
 *                           die Flaeche damit noch stimmig wirkt.
 *   mobil-charakterformular Die Formularfelder auf Telefonbreite. Sie muessen
 *                           bei oder ueber 16 liegen, sonst zoomt das Telefon
 *                           beim Antippen — das ist der ganze Grund, warum die
 *                           Mobilvergroesserung nicht entfernt wurde.
 *   mobil-wuerfelstatistik  Die Histogramm-Beschriftung auf Telefonbreite.
 *                           Gemessen wirken die 8 Einheiten dort 5,44 und die
 *                           7 nur 4,76 Bildpunkte. Das ist der staerkste
 *                           offene Befund der Welle und gehoert gesehen.
 *
 * JEDES ZUSTANDSBILD STELLT SEINEN ZUSTAND SELBER HER und meldet per Rueckgabe,
 * ob es geklappt hat. Ein fehlgeschlagenes Zustandsbild ist ein Befund fuer die
 * Sichtung, kein Grund, die 24 Vollbilder desselben Themes wegzuwerfen —
 * dasselbe Muster wie in den vier vorigen Ablichtungen.
 *
 * WARUM HINTER EINEM SCHALTER: 24 Vollbilder je Theme kosten Zeit und Platz.
 * Ohne gesetztes `WELLE5_SCREENS=1` ueberspringt sich die Datei (`test.skip`
 * mit Grund — dasselbe Muster wie die vier Vorgaenger), damit
 * `npm run test:e2e` unveraendert schnell bleibt. Aufruf:
 *
 *     WELLE5_SCREENS=1 npx playwright test tests/e2e/features/welle-5-screens.spec.js
 *
 * VORHER BAUEN. Die Suite laedt das gebaute Buendel (file://), nicht den
 * Quellbaum — ohne `python build.py` lichtet dieser Lauf den alten Stand ab.
 * Bei einer Welle, die ausschliesslich Schriftgroessen und -gewichte
 * verschiebt, ist das der Unterschied zwischen einer Sichtprobe und einem Bild
 * von gestern.
 *
 * Ablage: tests/e2e/__screens__/welle-5/<ansicht>-<theme>.png. Der Ordner ist
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

const AKTIV = process.env.WELLE5_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/welle-5');

// Dieselben 24 Ansichten wie der Waechter und die vier vorigen Ablichtungen
// (TAB_RENDER_REGISTRY). Welle 5 fasst 18 der 20 CSS-Dateien an; Schriftgroesse
// und -gewicht verteilen sich ueber JEDE Ansicht.
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
    // Das Ereignis-Log liegt mittig ueber der Flaeche und verdeckt genau die
    // Stellen, um die es geht — ein Ansichtswechsel quittiert sich selbst.
    await page.evaluate(() => {
        // @ts-ignore — global aus den Hilfsfunktionen
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    });
    await page.waitForTimeout(150);
}

/**
 * Nimmt den Umzugshinweis ueber seinen echten Codepfad weg. Er liegt als
 * feste Leiste ueber der Kopfzeile und waere sonst auf JEDEM der 204 Bilder —
 * er gehoert nicht zu dem, was diese Welle geaendert hat.
 * @param {import('@playwright/test').Page} page
 */
async function schliesseUmzugshinweis(page) {
    const knopf = page.locator('[data-action="close-migration-hint"]').first();
    if ((await knopf.count()) > 0) {
        await knopf.dispatchEvent('click').catch(() => {});
        await page.waitForTimeout(250);
    }
}

/**
 * Schliesst alles, was ein Zustandsbild geoeffnet haben koennte, und stellt die
 * Fenstergroesse wieder her. Wird nach jedem Bild gerufen, damit ein offenes
 * Formular nicht das naechste verdeckt und die Telefonbreite nicht haengen
 * bleibt.
 * @param {import('@playwright/test').Page} page
 */
async function raeumeAuf(page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
        // @ts-ignore
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
        // Escape schliesst Modale, NICHT die Aufklapp-Formulare. Ohne diese
        // Zeile stand das Charakterformular in jedem spaeteren Bild derselben
        // Ansicht offen und verdeckte die Karte, um die es ging (gemessen am
        // ersten Lauf: `mobil-charakterkarte` zeigte das offene Formular).
        ['char-form', 'npc-form', 'enc-form', 'session-form', 'wiki-form'].forEach(id => {
            const f = document.getElementById(id);
            if (f) {
                f.classList.remove('active');
                f.style.display = '';
            }
        });
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(150);
}

/**
 * Oeffnet ein Aufklapp-Formular ueber den echten Codepfad. Die Formulare der
 * Welle-5-Sichtung tragen die Haelfte ihrer gehobenen Kleinstwerte, und sie
 * sind in der Ruhelage ALLE zugeklappt.
 * @param {import('@playwright/test').Page} page
 * @param {string} formId
 * @returns {Promise<string|null>} Grund des Scheiterns oder null
 */
async function oeffneFormular(page, formId) {
    const da = await page.evaluate(id => {
        const f = document.getElementById(id);
        if (!f) return false;
        f.classList.add('active');
        f.style.display = 'block';
        return true;
    }, formId);
    if (!da) return `kein #${formId} im DOM`;
    await page.waitForTimeout(300);
    return null;
}

const ZUSTANDSBILDER = [
    {
        // Die groesste Zahl der App: 80 -> 72. Der einzige Verbraucher von `hero`.
        name: 'wuerfel-hero',
        ansicht: 'dice',
        beschnitt: '.dice-hero-result',
        async aufbau(page) {
            const el = page.locator('#view-dice .dice-hero-result');
            if ((await el.count()) === 0) return 'kein .dice-hero-result in der Wuerfelansicht';
            await el.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Die staerkste Senkung der Welle: -14 Bildpunkte.
        name: 'wuerfel-schwebepanel',
        ansicht: 'dashboard',
        beschnitt: '.fdp-number',
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
            // Ein Wurf, damit die Zahl ueberhaupt etwas zeigt.
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.fdpRoll === 'function') window.fdpRoll(20);
            });
            await page.waitForTimeout(400);
            const zahl = page.locator('.fdp-number');
            if ((await zahl.count()) === 0) return 'keine .fdp-number im Schwebepaneel';
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.toggleFloatingDice === 'function') window.toggleFloatingDice();
            });
            await page.waitForTimeout(400);
        }
    },
    {
        // Dieselbe Senkung in einem 250-Bildpunkt-Ring.
        name: 'zeitgeber-uhr',
        ansicht: 'timers',
        beschnitt: '.timer-hero-time',
        async aufbau(page) {
            const el = page.locator('#view-timers .timer-hero-time');
            if ((await el.count()) === 0) return 'keine .timer-hero-time in der Zeitgeber-Ansicht';
            if (!(await el.first().isVisible())) return '.timer-hero-time ist unsichtbar';
            await el.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // 22,40 -> 20 im DM-Schirm.
        name: 'dms-wuerfelwidget',
        ansicht: 'dmscreen',
        beschnitt: '.dms-dice-result',
        async aufbau(page) {
            const el = page.locator('#view-dmscreen .dms-dice-result');
            if ((await el.count()) === 0) return 'kein .dms-dice-result im DM-Schirm';
            await el.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Sechs Eingabefelder 22,40 -> 20, alle ueber der 16er Schwelle.
        name: 'begegnung-attributfelder',
        ansicht: 'encounter',
        beschnitt: '.attr-input',
        async aufbau(page) {
            const grund = await oeffneFormular(page, 'enc-form');
            if (grund) return grund;
            const felder = page.locator('#enc-form .attr-input');
            if ((await felder.count()) === 0) return 'keine .attr-input im Begegnungsformular';
            await felder.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // DER WICHTIGSTE PUNKT: 10,08/10,64 -> 11/12 bei sechs Pillen in Reihe.
        name: 'charakterkarte-pillen',
        ansicht: 'party',
        beschnitt: '.char-attr-pill',
        async aufbau(page) {
            const pillen = page.locator('#view-party .char-attr-pill');
            if ((await pillen.count()) === 0) {
                return 'keine .char-attr-pill — der Seed hat keine Charaktere';
            }
            await pillen.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Die dichteste Formularflaeche der App: 18 Expertisemarken 9,18 -> 11.
        name: 'charakterformular',
        ansicht: 'party',
        beschnitt: '.cf-skill-exp-label, .cf-attr-name',
        async aufbau(page) {
            const grund = await oeffneFormular(page, 'char-form');
            if (grund) return grund;
            const marken = page.locator('#char-form .cf-skill-exp-label, #char-form .cf-attr-name');
            if ((await marken.count()) === 0)
                return 'keine Fertigkeits-/Attributmarken im Formular';
            await marken.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Die Gewichtsumstellung 700 -> 600 an sieben Kennzahlen in Reihe.
        name: 'armaturenbrett-kennzahlen',
        ansicht: 'dashboard',
        beschnitt: '.dash-stat-value',
        async aufbau(page) {
            const werte = page.locator('#view-dashboard .dash-stat-value');
            if ((await werte.count()) === 0) return 'keine .dash-stat-value im Armaturenbrett';
            await werte.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Benutzereinheiten in einem skalierten Koordinatensystem, bewusst klein.
        name: 'wuerfelstatistik',
        ansicht: 'dicestats',
        beschnitt: '.ds-histogram-svg',
        async aufbau(page) {
            const svg = page.locator('#view-dicestats .ds-histogram-svg');
            if ((await svg.count()) === 0) return 'kein .ds-histogram-svg in der Wuerfelstatistik';
            await svg.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(250);
            return null;
        }
    },
    {
        // Zwoelf Anwenden-Knoepfe 10,24 -> Markengroesse.
        name: 'schnellreferenz',
        ansicht: 'dashboard',
        beschnitt: '.qref-apply-btn',
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
            const knoepfe = page.locator('.qref-apply-btn');
            if ((await knoepfe.count()) === 0)
                return 'keine .qref-apply-btn in der Schnellreferenz';
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
        // Die beiden namentlichen Ausnahmen der Untergrenze, im Bild begruendet.
        name: 'editor-tastenhilfen',
        ansicht: 'notes',
        beschnitt: '.kbd-hint, .tb-caret',
        async aufbau(page) {
            const grund = await oeffneFormular(page, 'session-form');
            if (grund) return grund;
            const leiste = page.locator('#session-form .editor-toolbar').first();
            if ((await leiste.count()) === 0) return 'keine .editor-toolbar im Sitzungsformular';
            await leiste.scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            // Die Tastenhilfen erscheinen erst beim Beruehren der Leiste.
            await leiste.hover({ timeout: 4000 });
            await page.waitForTimeout(400);
            const hilfen = page.locator('.kbd-hint, .tb-caret');
            if ((await hilfen.count()) === 0) return 'keine .kbd-hint/.tb-caret in der Leiste';
            return null;
        }
    },
    {
        // Die Formularschrift: 254 Bedienelemente verlassen 13,3333 fuer 12.
        name: 'truhe-formularfelder',
        ansicht: 'loot',
        beschnitt: '#view-loot input, #view-loot select',
        async aufbau(page) {
            const felder = page.locator('#view-loot input, #view-loot select');
            if ((await felder.count()) === 0) return 'keine Eingabefelder in der Truhen-Ansicht';
            await felder.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(200);
            return null;
        }
    },
    {
        // Dieselben Pillen auf Telefonbreite. E-2: die Vergroesserung BLEIBT.
        // Erst NACH der Bereitschaft verengen — bei 375 Bildpunkten verbirgt die
        // Mobil-Kopfzeile den Titel, auf den die Bereitschaftspruefung wartet.
        name: 'mobil-charakterkarte',
        ansicht: 'party',
        async aufbau(page) {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.waitForTimeout(800);
            const pillen = page.locator('#view-party .char-attr-pill');
            if ((await pillen.count()) === 0) return 'keine .char-attr-pill auf Telefonbreite';
            await pillen.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(250);
            return null;
        }
    },
    {
        // Der ganze Grund, warum die Mobilvergroesserung nicht entfernt wurde:
        // unter 16 zoomt das Telefon beim Antippen (E-2).
        name: 'mobil-charakterformular',
        ansicht: 'party',
        async aufbau(page) {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.waitForTimeout(800);
            const grund = await oeffneFormular(page, 'char-form');
            if (grund) return grund;
            const felder = page.locator('#char-form input');
            if ((await felder.count()) === 0) return 'keine Eingabefelder im Charakterformular';
            // NICHT `scrollIntoViewIfNeeded`: bei 375 px liegt die feste
            // Mobil-Kopfzeile ueber dem Formularkopf, das erste Feld wird
            // dadurch nie "stabil sichtbar" und der Aufruf laeuft in den
            // Zeitablauf (gemessen 4,98 s in allen vier Themes). Das reine
            // DOM-Rollen hat diese Stabilitaetsbedingung nicht.
            await felder.first().evaluate(el => el.scrollIntoView({ block: 'center' }));
            await page.waitForTimeout(300);
            return null;
        }
    },
    {
        // Der staerkste offene Befund der Welle: 4,76 bis 5,44 wirksame
        // Bildpunkte, obwohl die Deklaration 7 bzw. 8 sagt.
        name: 'mobil-wuerfelstatistik',
        ansicht: 'dicestats',
        async aufbau(page) {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.waitForTimeout(800);
            const svg = page.locator('#view-dicestats .ds-histogram-svg');
            if ((await svg.count()) === 0) return 'kein .ds-histogram-svg auf Telefonbreite';
            await svg.first().scrollIntoViewIfNeeded({ timeout: 5000 });
            await page.waitForTimeout(300);
            return null;
        }
    }
];

test.describe('Welle 5 — Ablichtung in vier Themes (Stufe 2)', () => {
    // Serienlauf: alle vier Themes teilen eine Seite und einen Seed; ein
    // paralleler Lauf wuerde vier Browser fuer dieselbe Arbeit hochfahren.
    test.describe.configure({ mode: 'serial' });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            test.skip(
                !AKTIV,
                'Ablichtung nur auf Anforderung: WELLE5_SCREENS=1 setzen (24 Vollbilder je Theme plus Zustandsbilder, nicht Teil der Standardlaeufe).'
            );
            test.setTimeout(420000);

            fs.mkdirSync(AUSGABE_DIR, { recursive: true });
            await seedPopulatedSession(page);
            await loadApp(page);
            await setzeTheme(page, theme);
            await schliesseUmzugshinweis(page);

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
                    console.log(`[welle-5-screens] ${bild.name} (${theme}): ${grund}`);
                    await raeumeAuf(page);
                    continue;
                }
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${bild.name}-${theme}.png`),
                    fullPage: true
                });
                // Mit Beschnitt zusaetzlich eine Naheinstellung: die
                // Groessenaenderungen dieser Welle liegen bei einem bis zwei
                // Bildpunkten und gehen in einem Vollbild unter.
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
                        const fenster = page.viewportSize() || { width: 1440, height: 900 };
                        await page.screenshot({
                            path: path.join(AUSGABE_DIR, `${bild.name}-nah-${theme}.png`),
                            clip: {
                                x: Math.max(0, kasten.x - rand),
                                y: Math.max(0, kasten.y - rand),
                                width: Math.min(
                                    fenster.width - Math.max(0, kasten.x - rand),
                                    kasten.w + 2 * rand + 320
                                ),
                                height: Math.min(
                                    fenster.height - Math.max(0, kasten.y - rand),
                                    kasten.h + 2 * rand
                                )
                            }
                        });
                    } catch (fehler) {
                        console.log(
                            `[welle-5-screens] Naheinstellung ${bild.name} (${theme}): ${fehler.message.split('\n')[0]}`
                        );
                    }
                }
                if (bild.abbau) await bild.abbau(page);
                await raeumeAuf(page);
            }

            const abgelegt = fs.readdirSync(AUSGABE_DIR).filter(f => f.endsWith(`-${theme}.png`));
            console.log(`[welle-5-screens] ${theme}: ${abgelegt.length} Bilder in ${AUSGABE_DIR}`);
            expect(abgelegt.length, `Theme ${theme} hat keine Bilder abgelegt`).toBeGreaterThan(0);
        });
    }
});
