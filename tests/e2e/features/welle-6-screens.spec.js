// @ts-check
/**
 * Stufe-2-Ablichtung der Welle 6 (Design-Handoff v3, Welle 6, Schritt 8)
 * ======================================================================
 *
 * WOFUER, und warum diese Welle die Bilder dringender braucht als die fuenf
 * vorigen: Welle 6 ist die EINZIGE des Handoffs, die VERHALTEN aendert, und
 * der versionierte Stil-Sollstand sieht davon nichts. Seine zwoelf gehashten
 * Eigenschaften sind color, backgroundColor, borderColor, borderRadius,
 * padding, margin, fontSize, fontWeight, boxShadow, opacity, display und
 * textAlign — `outline` ist in keiner Schreibweise darunter, und der Abzug
 * entsteht ohnehin im unfokussierten Ruhezustand. Fuer den Fokusring gibt es
 * dort NULL Deckung. Was von dieser Welle im Sollstand ankommt, ist
 * ausschliesslich der aufgehellte Eingaberahmen aus Schritt 6 (96 bewegte
 * Digests, borderColor rgb(58,58,58) -> rgb(124,124,124)) und die eine neue
 * Signatur der umbenannten Filterrueckmeldung.
 *
 * DIE RATSCHEN MESSEN, DIESE BILDER ZEIGEN. `W6-R-01`/`W6-R-02`
 * (fokusring.spec.js) zaehlen Halte und rechnen Verhaeltnisse, `W6-R-07`
 * (eingaberahmen.spec.js) liest Rahmenfarben am Element, `W6-R-10`
 * (zaehler.spec.js) prueft Zaehlerstaende, `W6-R-03` bis `W6-R-09`
 * (design-consistency.test.js) urteilen am Quelltext. KEINE davon beantwortet
 * die Fragen der menschlichen Runde:
 *
 *   — Ist der gedeckte Light-Goldton des Rings noch als Gold zu erkennen?
 *   — Wirken Rahmen UND Ring gleichzeitig am Formularfeld als zu viel?
 *   — Lesen die Formulare mit 300 aufgehellten Feldrahmen noch ruhig?
 *   — Stoert der Ring beim Klick in ein Suchfeld?
 *
 * Darum liegt neben JEDEM der 24 Ruhebilder ein zweites mit einem WIRKLICH
 * fokussierten Feld, und daneben eine Naheinstellung: der Ring ist 2 px breit
 * mit 2 px Abstand und geht in einem Vollbild von 1440 px unter.
 *
 * DER FOKUS WIRD MIT ECHTEN TABULATORSPRUENGEN GESETZT, NIE MIT `.focus()`.
 * Das ist keine Vorsicht, sondern die Lehre der Vermessung dieser Welle: bei
 * programmatischem Fokus greift `:focus-visible` NICHT, eine erste Messung mit
 * `el.focus()` fand darum 9 Ringe statt 287. Ein Bild, das so entsteht, zeigt
 * den Zustand, den kein Benutzer je sieht.
 *
 * SIE PRUEFT NICHTS. Sie behauptet nichts ueber Bildpunkte und faellt bei
 * keinem Farbwert durch — sie legt Bilder ab, ueber die ein Mensch urteilt.
 * Ein gruener Lauf dieser Datei ist deshalb KEINE Abnahme. Dieselbe Bauart wie
 * die fuenf Vorgaenger.
 *
 * GEFUELLTE KAMPAGNE, NICHT LEER. Die Felder, um die es geht, sitzen zum
 * groesseren Teil in Kartenlisten, Filterstreifen und Formularen, die erst mit
 * Daten entstehen; und die zwei Zaehler dieser Welle zeigen ohne Bestand
 * zu Recht "0". Darum `seedPopulatedSession()` wie in den fuenf Vorgaengern.
 *
 * WARUM ALLE VIER THEMES, obwohl der Ring EIN Token ist: weil das Token je
 * Theme einen anderen Wert hat und zwei davon diese Welle NEU setzt. Dark und
 * Contrast behalten ihren Goldton (rgb(212,175,55) bzw. rgb(255,215,0)), Light
 * geht von rgb(184,134,11) auf rgb(148,108,9) herunter und Sepia von
 * rgb(139,69,19) auf rgb(181,88,25) HERAUF. Light und Sepia sind damit die
 * zwei Themes, in denen diese Welle sichtbar etwas tut, und sie tun es in
 * entgegengesetzter Richtung. Die Sichtung beginnt deshalb bei Light.
 *
 * DIE ZUSTANDSBILDER zeigen genau die Stellen der Sichtungsliste, die im
 * Ruhezustand einer Ansicht NICHT zu sehen sind:
 *
 *   formular-fokus-party     Das Charakterformular mit fokussiertem Feld. Die
 *                            dichteste Formularflaeche der App und die mit den
 *                            meisten aufgehellten Rahmen. Hier entscheidet
 *                            sich Frage 2 (Rahmen UND Ring) und Frage 3 (300
 *                            hellere Rahmen).
 *   formular-fokus-encounter Dasselbe im Begegnungsformular.
 *   formular-fokus-notes     Dasselbe im Sitzungsformular.
 *   formular-ruhe-party      Das Charakterformular OHNE Fokus. Das Gegenbild
 *                            zu Frage 3: so sieht die Flaeche aus, wenn nichts
 *                            fokussiert ist.
 *   modal-zauber-fokus       Das Zaubermodal (26 Formularfelder) mit
 *                            fokussiertem Feld — die dichteste Modalflaeche.
 *   modal-lebenspunkte-fokus Der Lebenspunkte-Rechner. Zweiter Oeffnungsweg
 *                            und das Modal, in dem 15 von 25
 *                            Tabulaturschritten nach draussen fuehren (offener
 *                            Punkt des Tastatur-Strangs, hier sichtbar).
 *   zaehler-zauber           DIE STELLE, DIE DIESE WELLE REPARIERT HAT. Die
 *                            Pille in der Werkzeugleiste stand im Normalbetrieb
 *                            dauerhaft auf 0 und zeigt jetzt den Bestand; die
 *                            Filterrueckmeldung darunter hat einen eigenen
 *                            Namen und eine eigene Klasse bekommen. Zwei
 *                            Zahlen in einem Bild — Frage 5 der Sichtung.
 *   zaehler-auftraege        Derselbe reparierte Zaehler in der Auftragsansicht.
 *   suchfeld-fokus           Frage 1 der Sichtung: der Ring an einem
 *                            Suchfeld. Er erscheint jetzt auch beim Klick,
 *                            weil Chromium bei Textfeldern auch dann
 *                            `:focus-visible` setzt — das ist der Grund, warum
 *                            das Rezept des Handoffs nicht umgesetzt wurde.
 *   editorleiste-sichtbar    Die schwebende Editorleiste im EINGEBLENDETEN
 *                            Zustand. W6-E-4 hat sie per `visibility` aus der
 *                            Tabulatorreihenfolge genommen (264 bis 396
 *                            Phantom-Halte je Theme weg); das Bild belegt, dass
 *                            sie danach weiter normal erscheint.
 *   mobil-fokus              Derselbe Ring auf 375 Bildpunkten Breite, mit
 *                            Beruehrungsgeraet.
 *   mobil-formular-rahmen    Die aufgehellten Feldrahmen auf Telefonbreite.
 *
 * JEDES ZUSTANDSBILD STELLT SEINEN ZUSTAND SELBER HER und meldet per Rueckgabe,
 * ob es geklappt hat. Ein fehlgeschlagenes Zustandsbild ist ein Befund fuer die
 * Sichtung, kein Grund, die 48 Bilder desselben Themes wegzuwerfen — dasselbe
 * Muster wie in den fuenf vorigen Ablichtungen.
 *
 * WARUM HINTER EINEM SCHALTER: 24 Ruhebilder, 24 Fokusbilder, 24
 * Naheinstellungen und die Zustandsbilder kosten je Theme Zeit und Platz. Ohne
 * gesetztes `WELLE6_SCREENS=1` ueberspringt sich die Datei (`test.skip` mit
 * Grund — dasselbe Muster wie die fuenf Vorgaenger), damit `npm run test:e2e`
 * unveraendert schnell bleibt. Aufruf:
 *
 *     WELLE6_SCREENS=1 npx playwright test tests/e2e/features/welle-6-screens.spec.js
 *
 * VORHER BAUEN. Die Suite laedt das gebaute Buendel (file://), nicht den
 * Quellbaum — ohne `python build.py` lichtet dieser Lauf den alten Stand ab.
 * Bei einer Welle, deren ganzer Gegenstand eine 2 px breite Linie und eine
 * Rahmenfarbe ist, ist das der Unterschied zwischen einer Sichtprobe und einem
 * Bild von gestern.
 *
 * Ablage: tests/e2e/__screens__/welle-6/<name>-<theme>.png. Der Ordner ist von
 * .gitignore ausgenommen (Bilderstapel gehoert nicht in die Historie); die
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

const AKTIV = process.env.WELLE6_SCREENS === '1';

const AUSGABE_DIR = path.join(process.cwd(), 'tests/e2e/__screens__/welle-6');

/** Dieselben 24 Ansichten wie der Waechter und die fuenf vorigen Ablichtungen. */
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

/**
 * LIGHT ZUERST, DARK ZULETZT. Die Reihenfolge ist die der Sichtungsliste und
 * nicht die Gewohnheit der Vorgaenger: in Light aendert diese Welle am meisten
 * (die Ringfarbe wird dunkler und holt damit 333 gemessene Unterschreitungen
 * herein), in Sepia geht sie in die andere Richtung, Dark und Contrast bleiben
 * am Ring unveraendert und zeigen nur den helleren Feldrahmen.
 */
const THEMES = ['light', 'sepia', 'contrast', 'dark'];

/** Zustandsherstellung wie im Waechter und in den Vorgaengern. */
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

/** Zauber und Auftraege fuer die zwei Zaehlerbilder. Fuenf und drei, damit die
 *  Pille eine Zahl zeigt, die niemand mit einem Vorgabewert verwechselt. */
const ZAUBER_SAAT = [
    { id: 7001, name: 'Feuerball', level: 3, school: 'evocation', spellClass: 'Zauberer, Magier' },
    { id: 7002, name: 'Licht', level: 0, school: 'evocation', spellClass: 'Kleriker' },
    { id: 7003, name: 'Heilende Hand', level: 1, school: 'evocation', spellClass: 'Kleriker' },
    { id: 7004, name: 'Schild', level: 1, school: 'abjuration', spellClass: 'Magier' },
    { id: 7005, name: 'Unsichtbarkeit', level: 2, school: 'illusion', spellClass: 'Barde' }
];
const AUFTRAG_SAAT = [
    { id: 8001, title: 'Die verlorene Krone', type: 'main', status: 'active' },
    { id: 8002, title: 'Rattenplage im Keller', type: 'side', status: 'active' },
    { id: 8003, title: 'Botengang nach Tiefwasser', type: 'side', status: 'done' }
];

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
    await page.evaluate(() => {
        // @ts-ignore — global aus den Hilfsfunktionen
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
    });
    await page.waitForTimeout(150);
}

/**
 * Nimmt den Umzugshinweis ueber seinen echten Codepfad weg. Er liegt als feste
 * Leiste ueber der Kopfzeile und waere sonst auf JEDEM Bild.
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
 * Schliesst alles, was ein Zustandsbild geoeffnet haben koennte, nimmt den
 * Fokus weg und stellt die Fenstergroesse wieder her.
 * @param {import('@playwright/test').Page} page
 */
async function raeumeAuf(page) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    await page.evaluate(() => {
        // @ts-ignore
        if (typeof window.clearEventLog === 'function') window.clearEventLog();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        // Escape schliesst Modale, NICHT die Aufklapp-Formulare (Lehre der
        // Welle-5-Ablichtung: ein offenes Formular stand in jedem spaeteren
        // Bild derselben Ansicht).
        ['char-form', 'npc-form', 'enc-form', 'session-form', 'wiki-form'].forEach(id => {
            const f = document.getElementById(id);
            if (f) {
                f.classList.remove('active', 'open');
                f.style.display = '';
            }
        });
        /* MODALE UEBER IHRE KLASSE SCHLIESSEN, NICHT UEBER EINEN INLINE-STIL.
           `showModal()` setzt die Klasse `show`; ein hier gesetztes
           `style.display = 'none'` schlaegt jede Klassenregel und haelt das
           Modal fuer den REST DES LAUFS zu. Beim ersten Lauf dieser Datei
           meldeten `modal-zauber-fokus` und `modal-lebenspunkte-fokus` in allen
           vier Themes "ging nicht auf" — genau daran. */
        ['spell-modal', 'hp-calc-modal', 'npc-modal', 'quest-modal'].forEach(id => {
            const m = document.getElementById(id);
            if (m instanceof HTMLElement) {
                m.classList.remove('show');
                m.style.display = '';
            }
        });
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(150);
}

/**
 * Oeffnet ein Aufklapp-Formular ueber den echten Codepfad.
 * @param {import('@playwright/test').Page} page
 * @param {string} formId
 * @returns {Promise<string|null>} Grund des Scheiterns oder null
 */
async function oeffneFormular(page, formId) {
    const da = await page.evaluate(id => {
        const f = document.getElementById(id);
        if (!f) return false;
        const knopf = document.querySelector(`[data-action="toggle-collapse"][data-value="${id}"]`);
        if (knopf instanceof HTMLElement) knopf.click();
        f.classList.add('active', 'open');
        f.style.display = 'block';
        return true;
    }, formId);
    if (!da) return `kein #${formId} im DOM`;
    await page.waitForTimeout(350);
    return null;
}

/**
 * SETZT DEN FOKUS MIT ECHTEN TABULATORSPRUENGEN und gibt den Kasten des
 * getroffenen Elements zurueck.
 *
 * WARUM NICHT `.focus()`, und warum das der Kern dieser Datei ist: bei
 * programmatischem Fokus setzt Chromium `:focus-visible` NICHT. Die Weltregel
 * dieser Welle haengt genau an dieser Pseudoklasse — ein mit `.focus()`
 * erzeugtes Bild zeigt also KEINEN Ring und waere die glatte Verkehrung des
 * Befunds. In der Vermessung der Welle hat dieselbe Verwechslung 9 statt 287
 * Ringe gemeldet.
 *
 * `rumpf` sagt, innerhalb welchen Teilbaums der Halt liegen muss (die aktive
 * Ansicht, das offene Formular, das offene Modal). `nurEingabe` verlangt ein
 * echtes Eingabeelement; findet der Lauf keines, wird mit dem ersten
 * sichtbaren Halt im Rumpf zurueckgefallen, denn ein Bild von irgendeinem
 * Halt ist mehr als kein Bild.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} rumpf CSS-Auswahl des Teilbaums
 * @param {{nurEingabe?: boolean, maxSchritte?: number}} [opts]
 * @returns {Promise<{kasten: {x:number,y:number,w:number,h:number}, name: string, ring: string}|string>}
 */
async function fokussierePerTabulator(page, rumpf, opts = {}) {
    const nurEingabe = opts.nurEingabe !== false;
    const maxSchritte = opts.maxSchritte || 260;
    await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        document.body.focus();
    });
    /** @type {any} */
    let rueckfall = null;
    for (let i = 0; i < maxSchritte; i++) {
        await page.keyboard.press('Tab');
        const halt = await page.evaluate(r => {
            const el = document.activeElement;
            if (!el || el === document.body || el === document.documentElement) return null;
            const wurzel = document.querySelector(r);
            if (!wurzel || !wurzel.contains(el)) return { aussen: true };
            if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
                return { unsichtbar: true };
            }
            // Durchsichtiger Vorfahr — checkVisibility sieht ihn nicht.
            let q = el;
            while (q && q !== document.documentElement) {
                if (parseFloat(getComputedStyle(q).opacity) === 0) return { blass: true };
                q = q.parentElement;
            }
            const cs = getComputedStyle(el);
            const kasten = el.getBoundingClientRect();
            if (kasten.width <= 0 || kasten.height <= 0) return { leer: true };
            return {
                eingabe: ['input', 'select', 'textarea'].includes(el.tagName.toLowerCase()),
                name:
                    el.tagName.toLowerCase() +
                    (el.id ? '#' + el.id : '') +
                    (typeof el.className === 'string' && el.className.trim()
                        ? '.' + el.className.trim().split(/\s+/)[0]
                        : ''),
                ring: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor} / Abstand ${cs.outlineOffset}`,
                kasten: { x: kasten.x, y: kasten.y, w: kasten.width, h: kasten.height }
            };
        }, rumpf);
        if (!halt || halt.aussen || halt.unsichtbar || halt.blass || halt.leer) continue;
        if (!rueckfall) rueckfall = halt;
        if (!nurEingabe || halt.eingabe) {
            // Der Halt muss im Bild liegen, sonst lichtet die Naheinstellung
            // eine leere Flaeche ab.
            await page.evaluate(() => {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.scrollIntoView({ block: 'center' });
                }
            });
            await page.waitForTimeout(200);
            const nach = await page.evaluate(() => {
                const el = document.activeElement;
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return { x: r.x, y: r.y, w: r.width, h: r.height };
            });
            return { kasten: nach || halt.kasten, name: halt.name, ring: halt.ring };
        }
    }
    if (rueckfall) {
        await page.evaluate(() => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.scrollIntoView({ block: 'center' });
            }
        });
        await page.waitForTimeout(200);
        return {
            kasten: rueckfall.kasten,
            name: rueckfall.name + ' (Rueckfall)',
            ring: rueckfall.ring
        };
    }
    return `kein sichtbarer Tabulatorhalt in ${rumpf} nach ${maxSchritte} Spruengen`;
}

/**
 * Naheinstellung um einen Kasten. Der Ring ist 2 px breit mit 2 px Abstand und
 * geht in einem Vollbild unter — der Rand ist deshalb bewusst eng.
 * @param {import('@playwright/test').Page} page
 * @param {string} datei
 * @param {{x:number,y:number,w:number,h:number}} kasten
 */
async function naheinstellung(page, datei, kasten) {
    const rand = 70;
    const fenster = page.viewportSize() || { width: 1440, height: 900 };
    const x = Math.max(0, Math.min(kasten.x - rand, fenster.width - 10));
    const y = Math.max(0, Math.min(kasten.y - rand, fenster.height - 10));
    await page.screenshot({
        path: datei,
        clip: {
            x,
            y,
            width: Math.max(20, Math.min(fenster.width - x, kasten.w + 2 * rand)),
            height: Math.max(20, Math.min(fenster.height - y, kasten.h + 2 * rand))
        }
    });
}

const ZUSTANDSBILDER = [
    {
        name: 'formular-ruhe-party',
        ansicht: 'party',
        async aufbau(page) {
            const grund = await oeffneFormular(page, 'char-form');
            if (grund) return grund;
            await page.evaluate(() => {
                const f = document.getElementById('char-form');
                if (f) f.scrollIntoView({ block: 'start' });
            });
            await page.waitForTimeout(250);
            return null;
        }
    },
    {
        name: 'formular-fokus-party',
        ansicht: 'party',
        rumpf: '#char-form',
        async aufbau(page) {
            return await oeffneFormular(page, 'char-form');
        }
    },
    {
        name: 'formular-fokus-encounter',
        ansicht: 'encounter',
        rumpf: '#enc-form',
        async aufbau(page) {
            return await oeffneFormular(page, 'enc-form');
        }
    },
    {
        name: 'formular-fokus-notes',
        ansicht: 'notes',
        rumpf: '#session-form',
        async aufbau(page) {
            return await oeffneFormular(page, 'session-form');
        }
    },
    {
        name: 'modal-zauber-fokus',
        ansicht: 'spells',
        rumpf: '#spell-modal',
        async aufbau(page) {
            const auf = await page.evaluate(() => {
                // @ts-ignore — global aus der Modalverwaltung
                if (typeof window.showModal !== 'function') return false;
                // @ts-ignore
                window.showModal('spell-modal');
                return true;
            });
            if (!auf) return 'showModal ist nicht erreichbar';
            await page.waitForTimeout(400);
            const sichtbar = await page.evaluate(() => {
                const m = document.getElementById('spell-modal');
                return !!m && getComputedStyle(m).display !== 'none';
            });
            return sichtbar ? null : 'das Zaubermodal ging nicht auf';
        }
    },
    {
        name: 'modal-lebenspunkte-fokus',
        ansicht: 'party',
        rumpf: '#hp-calc-modal',
        async aufbau(page) {
            const auf = await page.evaluate(() => {
                // @ts-ignore — global aus dem Lebenspunkte-Rechner
                if (typeof window.showHpCalculator !== 'function') return false;
                // @ts-ignore
                window.showHpCalculator('characters', 1);
                return true;
            });
            if (!auf) return 'showHpCalculator ist nicht erreichbar';
            await page.waitForTimeout(400);
            const sichtbar = await page.evaluate(() => {
                const m = document.getElementById('hp-calc-modal');
                return !!m && getComputedStyle(m).display !== 'none';
            });
            return sichtbar ? null : 'der Lebenspunkte-Rechner ging nicht auf';
        }
    },
    {
        name: 'zaehler-zauber',
        ansicht: 'spells',
        beschnitt: '.section-toolbar',
        async aufbau(page) {
            await page.evaluate(z => {
                // @ts-ignore — globaler Datenbestand
                window.D.spells = z;
                // @ts-ignore — NUR renderSpells(), nicht renderAll(): das war
                // der nachgemessene Fehler.
                window.renderSpells();
            }, ZAUBER_SAAT);
            await page.waitForTimeout(350);
            const stand = await page.evaluate(() => {
                const t = document.getElementById('spells-count');
                const f = document.getElementById('spells-filter-count');
                return {
                    toolbar: t ? t.textContent.trim() : null,
                    filter: f ? f.textContent.trim() : null
                };
            });
            if (stand.toolbar === null) return 'kein #spells-count im Markup';
            console.log(
                `[welle-6-screens] zaehler-zauber: Werkzeugleiste "${stand.toolbar}", Filterrueckmeldung "${stand.filter}"`
            );
            return null;
        }
    },
    {
        name: 'zaehler-auftraege',
        ansicht: 'quests',
        beschnitt: '.section-toolbar',
        async aufbau(page) {
            await page.evaluate(a => {
                // @ts-ignore — globaler Datenbestand
                window.D.quests = a;
                // @ts-ignore — NUR renderQuests()
                window.renderQuests();
            }, AUFTRAG_SAAT);
            await page.waitForTimeout(350);
            const stand = await page.evaluate(() => {
                const t = document.getElementById('quests-count');
                return t ? t.textContent.trim() : null;
            });
            if (stand === null) return 'kein #quests-count im Markup';
            console.log(`[welle-6-screens] zaehler-auftraege: Werkzeugleiste "${stand}"`);
            return null;
        }
    },
    {
        name: 'suchfeld-fokus',
        ansicht: 'spells',
        // Frage 1 der Sichtung: der Ring am Suchfeld. Hier ausdruecklich mit
        // der MAUS gesetzt, nicht mit dem Tabulator — genau das ist der Fall,
        // den das Rezept des Handoffs ruhig stellen wollte und der bei
        // Textfeldern in Chromium nachweislich `:focus-visible` trifft.
        async aufbau(page) {
            const feld = page.locator('#spell-search');
            if ((await feld.count()) === 0) return 'kein #spell-search in der Zauberansicht';
            await feld.first().click();
            await page.waitForTimeout(250);
            const zustand = await page.evaluate(() => {
                const el = document.getElementById('spell-search');
                if (!el) return null;
                const cs = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return {
                    fv: el.matches(':focus-visible'),
                    ring: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
                    rahmen: cs.borderTopColor,
                    kasten: { x: r.x, y: r.y, w: r.width, h: r.height }
                };
            });
            if (!zustand) return '#spell-search verschwand nach dem Klick';
            console.log(
                `[welle-6-screens] suchfeld-fokus: :focus-visible=${zustand.fv}, Ring ${zustand.ring}, Rahmen ${zustand.rahmen}`
            );
            this.kasten = zustand.kasten;
            return null;
        }
    },
    {
        name: 'editorleiste-sichtbar',
        ansicht: 'wiki',
        // W6-E-4 hat die unsichtbare Leiste per `visibility: hidden` aus der
        // Tabulatorreihenfolge genommen. Das Bild belegt die Gegenrichtung:
        // eingeblendet erscheint sie weiter.
        async aufbau(page) {
            const vorhanden = await page.evaluate(() => {
                const t = document.getElementById('floating-toolbar');
                if (!t) return false;
                t.classList.add('visible');
                t.style.left = '420px';
                t.style.top = '260px';
                return true;
            });
            if (!vorhanden) return 'kein #floating-toolbar im Markup';
            /* ERST WARTEN, DANN MESSEN. Der Uebergang dauert 0,15 s und fuehrt
               seit W6-E-4 `visibility` mit; ein Lesevorgang im selben
               Verarbeitungsschritt liefert noch den Startwert der Animation
               (opacity 0, visibility hidden) und laese sich als "die Leiste
               erscheint nicht mehr". Beim ersten Lauf dieser Datei stand genau
               das im Protokoll. */
            await page.waitForTimeout(500);
            const da = await page.evaluate(() => {
                const t = document.getElementById('floating-toolbar');
                if (!t) return null;
                const cs = getComputedStyle(t);
                const r = t.getBoundingClientRect();
                return {
                    opacity: cs.opacity,
                    visibility: cs.visibility,
                    uebergang: cs.transitionProperty + ' / ' + cs.transitionDuration,
                    kasten: { x: r.x, y: r.y, w: r.width, h: r.height }
                };
            });
            if (!da) return '#floating-toolbar verschwand nach dem Einblenden';
            console.log(
                `[welle-6-screens] editorleiste-sichtbar: opacity ${da.opacity}, visibility ${da.visibility}, Uebergang ${da.uebergang}`
            );
            this.kasten = da.kasten;
            return null;
        },
        async abbau(page) {
            await page.evaluate(() => {
                const t = document.getElementById('floating-toolbar');
                if (t) {
                    t.classList.remove('visible');
                    t.style.left = '';
                    t.style.top = '';
                }
            });
        }
    },
    {
        name: 'mobil-fokus',
        ansicht: 'party',
        rumpf: '#view-party',
        async aufbau(page) {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.waitForTimeout(800);
            return null;
        }
    },
    {
        name: 'mobil-formular-rahmen',
        ansicht: 'party',
        async aufbau(page) {
            await page.setViewportSize({ width: 375, height: 812 });
            await page.waitForTimeout(800);
            const grund = await oeffneFormular(page, 'char-form');
            if (grund) return grund;
            const felder = page.locator('#char-form input');
            if ((await felder.count()) === 0) return 'keine Eingabefelder im Charakterformular';
            // NICHT `scrollIntoViewIfNeeded`: bei 375 px liegt die feste
            // Mobil-Kopfzeile ueber dem Formularkopf (Lehre der
            // Welle-5-Ablichtung, dort 4,98 s Zeitablauf in allen Themes).
            await felder.first().evaluate(el => el.scrollIntoView({ block: 'center' }));
            await page.waitForTimeout(300);
            return null;
        }
    }
];

test.describe('Welle 6 — Ablichtung in vier Themes, mit fokussierten Elementen (Stufe 2)', () => {
    // Serienlauf: alle vier Themes teilen eine Seite und einen Seed; ein
    // paralleler Lauf wuerde vier Browser fuer dieselbe Arbeit hochfahren.
    test.describe.configure({ mode: 'serial' });

    for (const theme of THEMES) {
        test(`Theme ${theme}`, async ({ page }) => {
            test.skip(
                !AKTIV,
                'Ablichtung nur auf Anforderung: WELLE6_SCREENS=1 setzen (24 Ruhebilder, 24 Fokusbilder, 24 Naheinstellungen und die Zustandsbilder je Theme, nicht Teil der Standardlaeufe).'
            );
            test.setTimeout(900000);

            fs.mkdirSync(AUSGABE_DIR, { recursive: true });
            await seedPopulatedSession(page);
            await loadApp(page);
            await setzeTheme(page, theme);
            await schliesseUmzugshinweis(page);

            /** @type {string[]} */
            const ohneFokus = [];

            for (const viewId of VIEWS) {
                await zeigeAnsicht(page, viewId);
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${viewId}-ruhe-${theme}.png`),
                    fullPage: true
                });

                // Und dasselbe mit einem WIRKLICH fokussierten Element.
                const treffer = await fokussierePerTabulator(page, `#view-${viewId}`, {
                    nurEingabe: true
                });
                if (typeof treffer === 'string') {
                    ohneFokus.push(`${viewId}: ${treffer}`);
                    await raeumeAuf(page);
                    await zeigeAnsicht(page, viewId);
                    continue;
                }
                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${viewId}-fokus-${theme}.png`),
                    fullPage: false
                });
                await naheinstellung(
                    page,
                    path.join(AUSGABE_DIR, `${viewId}-fokus-nah-${theme}.png`),
                    treffer.kasten
                );
                console.log(
                    `[welle-6-screens] ${viewId} (${theme}): Fokus auf ${treffer.name}, Ring ${treffer.ring}`
                );
                await page.evaluate(() => {
                    if (document.activeElement instanceof HTMLElement)
                        document.activeElement.blur();
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
                    console.log(`[welle-6-screens] ${bild.name} (${theme}): ${grund}`);
                    await raeumeAuf(page);
                    continue;
                }

                /** @type {{x:number,y:number,w:number,h:number}|null} */
                let kasten = bild.kasten || null;
                if (bild.rumpf) {
                    const treffer = await fokussierePerTabulator(page, bild.rumpf, {
                        nurEingabe: true
                    });
                    if (typeof treffer === 'string') {
                        console.log(`[welle-6-screens] ${bild.name} (${theme}): ${treffer}`);
                        await raeumeAuf(page);
                        continue;
                    }
                    kasten = treffer.kasten;
                    console.log(
                        `[welle-6-screens] ${bild.name} (${theme}): Fokus auf ${treffer.name}, Ring ${treffer.ring}`
                    );
                }

                await page.screenshot({
                    path: path.join(AUSGABE_DIR, `${bild.name}-${theme}.png`),
                    fullPage: false
                });
                if (kasten) {
                    try {
                        await naheinstellung(
                            page,
                            path.join(AUSGABE_DIR, `${bild.name}-nah-${theme}.png`),
                            kasten
                        );
                    } catch (fehler) {
                        console.log(
                            `[welle-6-screens] Naheinstellung ${bild.name} (${theme}): ${fehler.message.split('\n')[0]}`
                        );
                    }
                } else if (bild.beschnitt) {
                    try {
                        const k = await page
                            .locator(`#view-${bild.ansicht} ${bild.beschnitt}`)
                            .first()
                            .evaluate(el => {
                                const r = el.getBoundingClientRect();
                                return { x: r.x, y: r.y, w: r.width, h: r.height };
                            });
                        await naheinstellung(
                            page,
                            path.join(AUSGABE_DIR, `${bild.name}-nah-${theme}.png`),
                            k
                        );
                    } catch (fehler) {
                        console.log(
                            `[welle-6-screens] Naheinstellung ${bild.name} (${theme}): ${fehler.message.split('\n')[0]}`
                        );
                    }
                }
                if (bild.abbau) await bild.abbau(page);
                await raeumeAuf(page);
            }

            if (ohneFokus.length) {
                console.log(
                    `[welle-6-screens] ${theme}: ${ohneFokus.length} Ansichten ohne fokussierbares Eingabefeld — ${ohneFokus.join(' | ')}`
                );
            }

            const abgelegt = fs.readdirSync(AUSGABE_DIR).filter(f => f.endsWith(`-${theme}.png`));
            console.log(`[welle-6-screens] ${theme}: ${abgelegt.length} Bilder in ${AUSGABE_DIR}`);
            expect(abgelegt.length, `Theme ${theme} hat keine Bilder abgelegt`).toBeGreaterThan(0);
        });
    }
});
