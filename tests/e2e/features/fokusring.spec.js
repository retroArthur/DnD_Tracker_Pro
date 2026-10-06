// @ts-check
/**
 * W6-R-01 und W6-R-02 — der Fokusring, am echten Tabulatorlauf gemessen
 * (Design-Handoff v3, Welle 6, Schritt 1)
 * ============================================================================
 *
 * WARUM DIESE DATEI UEBERHAUPT EXISTIERT, und warum sie VOR der Umsetzung
 * entsteht: der versionierte Stil-Sollstand hasht zwoelf Eigenschaften zu
 * einem Digest je Element — color, backgroundColor, borderColor,
 * borderRadius, padding, margin, fontSize, fontWeight, boxShadow, opacity,
 * display, textAlign. `outline` ist KEINE davon, und `outline-width`,
 * `-style`, `-color`, `-offset` auch nicht. Nachgelesen, nicht vermutet: die
 * Liste steht als `const PROPERTIES` in computed-style-diff.spec.js. Zweite,
 * unabhaengige Luecke: der Abzug entsteht im UNFOKUSSIERTEN Ruhezustand jeder
 * Ansicht — selbst das gehashte `boxShadow` saehe einen Fokusschatten nicht,
 * weil kein Element fokussiert ist.
 *
 * FOLGE: die einzige Verhaltensaenderung der ganzen Welle 6 hat im
 * Stil-Sollstand null Deckung. Diese zwei Ratschen sind die einzige
 * Absicherung, und sie sind bei ihrer Geburt ROT — beziffert, siehe
 * AUSGANGSWERTE unten.
 *
 * ECHTE TABULATORSPRUENGE, NIE `.focus()`. Das ist der Kern des Messverfahrens
 * und keine Formsache: `:focus-visible` greift bei programmatischem
 * `el.focus()` NICHT. Eine Vormessung mit `.focus()` fand 9 beringte Halte, ein
 * Lauf mit echten `keyboard.press('Tab')` fand an derselben Stelle 287. Wer
 * diese Datei spaeter aendert und auf `.focus()` umstellt, baut sich eine
 * gruene Ratsche ueber einer kaputten App.
 *
 * SICHTBARKEIT WIRD DREIFACH GEPRUEFT, und der dritte Teil ist der, auf den es
 * ankommt. `checkVisibility({ checkOpacity: true })` sieht einen Vorfahren mit
 * `opacity: 0` NICHT — gemessen: 334 der 1054 Halte im Theme dark haengen unter
 * genau so einem Vorfahren (die schwebende Editorleiste, `position: fixed;
 * opacity: 0` ohne `visibility: hidden`, bleibt in der Tabulatorreihenfolge).
 * Ein Ring auf einem durchsichtigen Vorfahren ist selbst durchsichtig. Ohne
 * den Ahnenlauf waere jede Zahl dieser Datei um rund ein Drittel verfaelscht.
 * Dazu die Flaechenprobe: ein Halt ohne Ausdehnung kann keinen sichtbaren Ring
 * tragen.
 *
 * DIE TRAEGERFLAECHE WIRD GESCHICHTET AUSGERECHNET, nicht beim ersten
 * deckenden Vorfahren abgebrochen. Grund: `.modal` traegt
 * `background: rgba(26, 26, 26, 0.95)` — ein Literal, das kein Theme-Block
 * ueberschreibt (gefuehrte Ausnahme W2-C-01). Wer dort nur "erste nicht
 * durchsichtige Fuellung" nimmt, rechnet gegen eine Farbe, die es auf dem
 * Schirm nicht gibt. Der Ring liegt wegen `outline-offset: 2px` genau auf
 * dieser Flaeche, und in Sepia liest er dort 2,18. Deshalb laeuft diese Datei
 * neben dem Ruhezustand auch durch aufgeklappte Formulare und durch sechs
 * Modale: im Ruhezustand allein waeren von rund 347 betroffenen Eingaben nur
 * 31 ueberhaupt im Baum.
 *
 * GERECHNET WIRD MIT DEM PROJEKT-KONTRASTRECHNER, nicht mit einer zweiten
 * Formel. tests/unit/helpers/wcag-contrast.js faehrt bei jedem Laden seinen
 * Selbsttest gegen die kanonischen Referenzwerte #777777/#fff = 4,48 und
 * #767676/#fff = 4,54. Er ist CommonJS in einem "type":"module"-Paket; der
 * Weg hinein ist `createRequire(import.meta.url)` (nachgewiesen lauffaehig,
 * bevor diese Datei geschrieben wurde). Eine zweite, nachgebaute
 * Kontrastfunktion waere genau die unbelegte Zahl, gegen die der Helfer
 * ueberhaupt angetreten ist.
 *
 * AUSGANGSWERTE (gemessen am 2026-10-06, HEAD e4ac3a7, gefuellte Kampagne,
 * 1600x1000, nur Ruhezustand der 24 Ansichten — die Formular- und Modalphasen
 * kamen beim Schreiben dieser Datei dazu und heben beide Zahlen):
 *
 *   W6-R-01  dark 1054 Halte, 720 sichtbar, 334 unter durchsichtigem
 *            Vorfahren, davon OHNE RING 54 Befunde an 31 verschiedenen
 *            Elementen. Namentlich: #global-search, #party-search,
 *            #party-class-filter, #npc-search, #loc-search, #quest-search,
 *            #enc-search, #init-name, #init-value, #init-hp, #init-ac,
 *            #init-type, #loot-search, #shop-search, #shop-type-filter,
 *            #shop-location-filter, #spell-search, #spell-class-filter,
 *            #notes-search, #wiki-search, #link-search, #link-filter,
 *            #dice-notation, #new-campaign-name, #dms-notes-input,
 *            #bestiary-search, #bestiary-filter-cr, #bestiary-filter-type,
 *            #sessionprep-search, #kalender-search, #fraktionen-search.
 *            (Light 53, Sepia 53, Contrast 53 — der Unterschied ist Inhalt,
 *            nicht Theme: die Ringsetzung kennt keinen Theme-Zweig.)
 *   W6-R-02  dark 0, light 173, sepia 0, contrast 0. Alle 173 tragen
 *            rgb(184, 134, 11) = #b8860b = --gold in Light; 163 davon auf
 *            rgb(245, 245, 245) = --bg-dark, 10 auf rgb(232, 232, 232) =
 *            --bg-elevated. Es gibt in Light nur EINE Ringfarbe: alle 640
 *            sichtbaren Ringe lesen denselben Wert.
 *
 * WAS DIE ZWEI RATSCHEN NICHT SIND: ein Urteil ueber Schoenheit. Sie messen
 * zwei Tatsachen — ist ein Ring da, und hebt er sich ab. Ob er an der
 * richtigen Stelle sitzt, entscheidet die Sichtprobe der Welle.
 *
 * LAUFZEIT UND SCHALTER. Ein Tabulatorlauf ueber 24 Ansichten plus drei
 * Formulare plus sechs Modale kostet knapp zwei Minuten; W6-R-02 braucht ihn
 * vier Mal. Beide Vollaeufe liegen deshalb hinter `FOKUSRING=1`, wie die
 * Ablichtungen der Vorwellen hinter ihren Schaltern:
 *
 *     FOKUSRING=1 npx playwright test tests/e2e/features/fokusring.spec.js
 *
 * OHNE SCHALTER LAUFEN ZWEI BILLIGE FAELLE MIT, und die sind nicht Zierde: der
 * Selbsttest des Kontrastrechners (er wirft beim Laden, wenn die Formel nicht
 * stimmt) und eine Gegenprobe, die in einer Ansicht beweist, dass der
 * Tabulatorlauf Ringe ueberhaupt sieht und dass beide Ausnahmelisten leer sind.
 * Eine Ratsche, die nichts findet, weil sie nichts misst, ist von einer gruenen
 * nicht zu unterscheiden.
 *
 * DER ZWEITE GRUND FUER DEN SCHALTER an W6-R-01: dieser Fall ist bis zum
 * Schritt 4 der Welle ABSICHTLICH ROT (193 Befunde — die 31
 * `outline: none`-Regeln). Liefe er in der vollen Suite mit, waere der
 * E2E-Gate vom Tag der Ratsche bis zum Tag ihrer Erfuellung rot, und ein roter
 * Gate verdeckt echte Regressionen. Wer Schritt 4 abschliesst, prueft mit
 * `FOKUSRING=1` nach und kann den Schalter an W6-R-01 dann wegnehmen.
 *
 * IN DER CI traegt die Schwesterratsche W6-R-04 (design-consistency.test.js)
 * die Aussage von W6-R-02: sie rechnet dasselbe Verhaeltnis gegen fuenf
 * Flaechen mal vier Themes am TOKEN, laeuft in jedem Lauf mit und braucht
 * keinen Browser. Diese Datei ist der Beleg am echten Element.
 *
 * VORHER BAUEN. Die Suite laedt das gebaute Buendel (file://), nicht den
 * Quellbaum — ohne `python build.py` misst dieser Lauf den Stand von gestern.
 *
 * KEINE MODULPFADE IN DEN KOMMENTAREN. Das Abdeckungs-Gate wertet jede
 * woertliche Nennung eines loader.js-Modulpfads unter tests/ als Abdeckung —
 * auch die in einem Kommentar. Hier stehen darum nur Stil- und Testdateien.
 */

import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

const require = createRequire(import.meta.url);
const WCAG = require('../../unit/helpers/wcag-contrast.js');

/**
 * Schalter fuer die beiden teuren Vollaeufe (siehe Kopf, Abschnitt LAUFZEIT).
 * Ohne ihn laufen nur die zwei billigen Faelle: der Selbsttest des
 * Kontrastrechners und die Gegenprobe, die beweist, dass der Tabulatorlauf
 * Ringe ueberhaupt sieht.
 */
const VOLLER_LAUF = process.env.FOKUSRING === '1';

/** Die 24 Ansichten der Registry — dieselbe Liste wie in den Ablichtungen. */
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
 * Aufklapp-Formulare: die drei, die ueber `toggle-collapse` auf- und zugehen.
 * Sie bringen die Felder mit, die im Ruhezustand nicht im Baum sind.
 */
const FORMULARE = { party: 'char-form', encounter: 'enc-form', notes: 'session-form' };

/**
 * Sechs Modale, ueber ihren echten Codeweg geoeffnet. Ausgewaehlt nach
 * gemessener Feldzahl (sichtbare fokussierbare Knoten / `.form-group`-Felder):
 * bestiary-editor 59/22, spell 36/26, npc 20/23 (hier 11), quest 23/10,
 * shop-item 16/18, hp-calc 14/1. Das hp-calc-Modal ist dabei, weil es ueber
 * eine eigene Funktion aufgeht und damit den zweiten Oeffnungsweg abdeckt.
 */
const MODALE = [
    { id: 'bestiary-editor-modal', oeffnen: 'showModal' },
    { id: 'spell-modal', oeffnen: 'showModal' },
    { id: 'npc-modal', oeffnen: 'showModal' },
    { id: 'quest-modal', oeffnen: 'showModal' },
    { id: 'shop-item-modal', oeffnen: 'showModal' },
    { id: 'hp-calc-modal', oeffnen: 'hpRechner' }
];

/**
 * BEWUSST LEER, NICHT ABWESEND. Wer hier einen Halt eintraegt, nimmt ihm die
 * Ratsche — und muss daneben schreiben, warum ein erreichbarer, sichtbarer
 * Tastaturhalt ohne Fokuskennzeichen richtig ist. Form wie
 * EXEC_COMMAND_ALLOWLIST und SAMMELBEWEGUNG_GEDULDET.
 * @type {Record<string, string>}
 */
const RING_GEDULDET = {};

/**
 * BEWUSST LEER, NICHT ABWESEND. Gegenstueck fuer W6-R-02.
 * @type {Record<string, string>}
 */
const KONTRAST_GEDULDET = {};

// ---------------------------------------------------------------------------
// Farbe: rgb()/rgba() aus dem Browser in die Hex-Welt des Projektrechners
// ---------------------------------------------------------------------------

/**
 * `rgb(1, 2, 3)` / `rgba(1, 2, 3, 0.5)` / `color(srgb 0 0 0 / 0.6)`
 * -> { rgb: [r,g,b] in 0..255, alpha }.
 *
 * DIE ZWEITE FORM IST DER GRUND, WARUM DIESE FUNKTION MEHR ALS EINE ZEILE IST,
 * und sie ist am lebenden Buendel gefunden, nicht erdacht: `.modal-overlay`
 * traegt `background: var(--scrim-60)`, und `--scrim-60` ist
 * `color-mix(in srgb, #000 60%, transparent)`. Chromium gibt den berechneten
 * Wert als `color(srgb 0 0 0 / 0.6)` zurueck — mit Kanaelen in 0..1, nicht in
 * 0..255. Eine Zerlegung, die nur `rgba?()` kennt, laesst diese Lage
 * STILLSCHWEIGEND FALLEN. Gemessen, was das kostet: die Modalflaeche in Light
 * kommt dann als #252525 heraus statt als #1e1e1e, und die Ringfarbe wird
 * gegen eine Flaeche gerechnet, die es auf dem Schirm nicht gibt (3,36 statt
 * 3,50 als erreichbare Decke). Genau dieser Fehler steckte in der Vormessung
 * der Welle, aus der die vorgeschlagenen Tokenwerte stammten.
 *
 * @param {string} wert
 * @returns {{ rgb: number[], alpha: number } | null}
 */
function zerlegeFarbe(wert) {
    const roh = String(wert || '').trim();

    const srgb = roh.match(/^color\(\s*srgb\s+([^)]+)\)$/i);
    if (srgb) {
        const teile = srgb[1]
            .split(/[\s/]+/)
            .filter(Boolean)
            .map(parseFloat);
        if (teile.length < 3 || teile.slice(0, 3).some(n => Number.isNaN(n))) return null;
        const alpha = teile.length > 3 && !Number.isNaN(teile[3]) ? teile[3] : 1;
        return { rgb: teile.slice(0, 3).map(n => n * 255), alpha };
    }

    const m = roh.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const teile = m[1].split(/[,/]/).map(s => parseFloat(s.trim()));
    if (teile.length < 3 || teile.slice(0, 3).some(n => Number.isNaN(n))) return null;
    const alpha = teile.length > 3 && !Number.isNaN(teile[3]) ? teile[3] : 1;
    return { rgb: teile.slice(0, 3), alpha };
}

/**
 * Schichtet die Fuellungen von aussen nach innen uebereinander und gibt die
 * Farbe zurueck, die der Ring tatsaechlich beruehrt.
 *
 * `lagen` kommt aus dem Browser als Liste VOM ELEMENT NACH AUSSEN. Gemalt wird
 * umgekehrt: der aeusserste zuerst, jede innere Lage mit ihrem Alpha darueber.
 * Startflaeche ist Weiss — die Leinwand des Browsers, falls bis zur Wurzel
 * nichts Deckendes kommt.
 *
 * @param {Array<{ bg: string }>} lagen
 * @returns {string|null} Hex
 */
function flaecheAusLagen(lagen) {
    let unten = [255, 255, 255];
    for (let i = lagen.length - 1; i >= 0; i--) {
        const f = zerlegeFarbe(lagen[i].bg);
        if (!f || f.alpha === 0) continue;
        unten = [0, 1, 2].map(k => f.alpha * f.rgb[k] + (1 - f.alpha) * unten[k]);
    }
    return WCAG.rgbToHex(unten);
}

// ---------------------------------------------------------------------------
// Der Tabulatorlauf
// ---------------------------------------------------------------------------

/**
 * Liest den gerade fokussierten Knoten aus. Laeuft IM BROWSER.
 * Rueckgabe `{ ende: true }`, wenn der Fokus den Dokumentrumpf erreicht hat.
 */
const LESE_HALT = `(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return { ende: true };
    const cs = getComputedStyle(el);

    // (1) Durchsichtiger Vorfahr — checkVisibility sieht ihn nicht.
    let blass = null;
    let q = el;
    while (q && q !== document.documentElement) {
        if (parseFloat(getComputedStyle(q).opacity) === 0) {
            const c = (typeof q.className === 'string' ? q.className : '').trim().split(/\\s+/)[0];
            blass = q.tagName.toLowerCase() + (q.id ? '#' + q.id : '') + (c ? '.' + c : '');
            break;
        }
        q = q.parentElement;
    }

    // (2) Alle Fuellungen vom Elter bis zur Wurzel, von innen nach aussen.
    const lagen = [];
    let p = el.parentElement;
    while (p) {
        const bg = getComputedStyle(p).backgroundColor;
        if (bg && bg !== 'transparent') lagen.push({ bg: bg });
        p = p.parentElement;
    }

    const r = el.getBoundingClientRect();
    return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        cls: (typeof el.className === 'string' ? el.className : '')
            .trim().split(/\\s+/).filter(Boolean).slice(0, 3).join(' '),
        oW: cs.outlineWidth,
        oS: cs.outlineStyle,
        oC: cs.outlineColor,
        oO: cs.outlineOffset,
        blass: blass,
        css: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }),
        lagen: lagen,
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
    };
})()`;

/**
 * Tabulatorlauf durch den aktuellen Zustand. Jeder Halt genau einmal.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {string} phase
 * @param {Array<any>} haltepunkte
 */
async function tabulatorlauf(page, ansicht, phase, haltepunkte) {
    await page.evaluate(() => {
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        document.body.focus();
    });
    const gesehen = new Set();
    let wiederholt = 0;
    for (let i = 0; i < 400; i++) {
        await page.keyboard.press('Tab');
        const halt = await page.evaluate(LESE_HALT);
        if (halt.ende) break;
        const schluessel = `${halt.tag}|${halt.id}|${halt.cls}|${halt.rect.join(',')}`;
        if (gesehen.has(schluessel)) {
            // Der Lauf ist einmal herum, sobald sich die Halte wiederholen.
            wiederholt++;
            if (wiederholt > 3) break;
            continue;
        }
        gesehen.add(schluessel);
        haltepunkte.push({ ansicht, phase, schluessel, ...halt });
    }
}

/**
 * Ist dieser Halt auf dem Schirm zu sehen? Dreifach, siehe Dateikopf.
 * @param {any} h
 */
const istSichtbar = h => h.css && !h.blass && h.rect[2] > 0 && h.rect[3] > 0;

/**
 * Traegt dieser Halt einen Fokusring?
 * @param {any} h
 */
const hatRing = h => parseFloat(h.oW) > 0 && h.oS !== 'none';

/**
 * Lesbarer Name eines Halts fuer die Befundliste.
 * @param {any} h
 */
const nenne = h =>
    `${h.ansicht}/${h.phase} ${h.tag}${h.id ? '#' + h.id : ''}${h.cls ? '.' + h.cls.split(' ').join('.') : ''}`;

/**
 * Setzt das Theme ueber seinen echten Codeweg und prueft nach.
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
    expect(
        await page.evaluate(() => document.documentElement.getAttribute('data-theme')),
        `Theme ${theme} wurde nicht gesetzt`
    ).toBe(theme);
}

/**
 * Nimmt den Umzugshinweis weg — er liegt sonst als feste Leiste ueber jeder
 * Ansicht und schiebt sich in jeden Tabulatorlauf.
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
 * Faehrt alle drei Phasen ab und gibt die Haltepunkte zurueck.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<any>>}
 */
async function alleHaltepunkte(page) {
    /** @type {Array<any>} */
    const haltepunkte = [];

    for (const ansicht of VIEWS) {
        await page.evaluate(v => {
            // @ts-ignore — global aus der Ansichtsverwaltung
            window.switchView(v);
            // @ts-ignore
            if (typeof window.clearEventLog === 'function') window.clearEventLog();
        }, ansicht);
        await page.waitForSelector(`#view-${ansicht}.active`, { state: 'visible', timeout: 5000 });
        await page.waitForTimeout(220);
        await tabulatorlauf(page, ansicht, 'ruhe', haltepunkte);

        if (FORMULARE[ansicht]) {
            await page.evaluate(f => {
                const el = document.getElementById(f);
                if (el && !el.classList.contains('open')) {
                    const knopf = document.querySelector(
                        `[data-action="toggle-collapse"][data-value="${f}"]`
                    );
                    if (knopf instanceof HTMLElement) knopf.click();
                }
            }, FORMULARE[ansicht]);
            await page.waitForTimeout(420);
            await tabulatorlauf(page, ansicht, 'formular', haltepunkte);
            await page.evaluate(f => {
                const el = document.getElementById(f);
                if (el) el.classList.remove('open', 'active');
            }, FORMULARE[ansicht]);
            await page.waitForTimeout(180);
        }
    }

    for (const modal of MODALE) {
        const offen = await page.evaluate(m => {
            try {
                if (m.oeffnen === 'hpRechner') {
                    // @ts-ignore — global aus dem HP-Rechner
                    if (typeof window.showHpCalculator !== 'function') return false;
                    // @ts-ignore
                    window.showHpCalculator('characters', 1);
                } else {
                    // @ts-ignore — global aus der Modalverwaltung
                    if (typeof window.showModal !== 'function') return false;
                    // @ts-ignore
                    window.showModal(m.id);
                }
            } catch (e) {
                return false;
            }
            return true;
        }, modal);
        if (!offen) continue;
        await page.waitForTimeout(400);
        const sichtbar = await page.evaluate(id => {
            const o = document.getElementById(id);
            return !!o && getComputedStyle(o).display !== 'none';
        }, modal.id);
        expect(sichtbar, `Modal ${modal.id} ging nicht auf — die Messung waere lueckenhaft`).toBe(
            true
        );
        await tabulatorlauf(page, modal.id, 'modal', haltepunkte);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
        await page.evaluate(id => {
            const o = document.getElementById(id);
            if (o instanceof HTMLElement) o.style.display = 'none';
        }, modal.id);
        await page.waitForTimeout(150);
    }

    return haltepunkte;
}

// ---------------------------------------------------------------------------
// W6-R-01
// ---------------------------------------------------------------------------

test.describe('W6-R-01 — jeder sichtbare Tastaturhalt traegt einen Fokusring (Ratsche)', () => {
    // KEIN `mode: 'serial'`. Jeder Fall saet seine eigene Kampagne und laedt
    // seine eigene Seite — sie teilen nichts. Und ein Serienlauf wuerde den
    // zweiten Fall ueberspringen, sobald der erste faellt: aus einer Ratsche,
    // die zwei Zahlen melden soll, wuerde eine, die eine meldet. Im Rotlauf
    // vom 2026-10-06 ist genau das passiert (drei von fuenf Faellen
    // "did not run"), und die Themes Sepia und Contrast blieben unbeziffert.

    test('kein sichtbarer Halt in 24 Ansichten, drei Formularen und sechs Modalen bleibt ohne Ring', async ({
        page
    }) => {
        test.skip(
            !VOLLER_LAUF,
            'Voller Tabulatorlauf nur auf Anforderung: FOKUSRING=1 setzen (rund zwei Minuten je Theme). Dieser Fall ist bis zum Schritt 4 der Welle ABSICHTLICH ROT — 193 Befunde, das sind die 31 outline-none-Regeln. Ohne Schalter waere die volle Suite dadurch rot, und ein roter Gate verdeckt echte Regressionen.'
        );
        test.setTimeout(300000);
        await seedPopulatedSession(page);
        await loadApp(page);
        await schliesseUmzugshinweis(page);
        // Ein Theme genuegt: die Ringsetzung kennt keinen Theme-Zweig, und die
        // Vormessung bestaetigt das (54/53/53/53 Befunde ueber vier Themes —
        // der Unterschied ist Inhalt, nicht Farbe). W6-R-02 faehrt die anderen
        // drei, dort sind sie der Gegenstand.
        await setzeTheme(page, 'dark');

        const haltepunkte = await alleHaltepunkte(page);

        // Die Messung muss ueberhaupt etwas gesehen haben. Ein Lauf, der an
        // einer kaputten Saat scheitert, waere sonst GRUEN.
        expect(haltepunkte.length).toBeGreaterThan(900);
        const sichtbare = haltepunkte.filter(istSichtbar);
        expect(sichtbare.length).toBeGreaterThan(600);

        const befunde = sichtbare
            .filter(h => !hatRing(h))
            .filter(h => !RING_GEDULDET[nenne(h)])
            .map(h => `${nenne(h)} — outline ${h.oW} ${h.oS}`);

        expect([...new Set(befunde)].sort()).toEqual([]);
    });

    test('GEGENPROBE: die Liste der Geduldeten ist leer, und der Lauf misst wirklich Ringe', async ({
        page
    }) => {
        // Zweck: eine Ratsche, die nichts findet, weil sie nichts misst, ist
        // von einer gruenen nicht zu unterscheiden. Dieser Fall kostet eine
        // Ansicht und beweist, dass der Tabulatorlauf Ringe UEBERHAUPT sieht.
        test.setTimeout(120000);
        expect(Object.keys(RING_GEDULDET)).toEqual([]);

        await seedPopulatedSession(page);
        await loadApp(page);
        await schliesseUmzugshinweis(page);
        await setzeTheme(page, 'dark');

        /** @type {Array<any>} */
        const haltepunkte = [];
        await page.evaluate(() => {
            // @ts-ignore
            window.switchView('dice');
        });
        await page.waitForSelector('#view-dice.active', { state: 'visible', timeout: 5000 });
        await page.waitForTimeout(250);
        await tabulatorlauf(page, 'dice', 'ruhe', haltepunkte);

        const sichtbare = haltepunkte.filter(istSichtbar);
        expect(sichtbare.length).toBeGreaterThan(10);
        expect(sichtbare.filter(hatRing).length).toBeGreaterThan(5);
    });
});

// ---------------------------------------------------------------------------
// W6-R-02
// ---------------------------------------------------------------------------

test.describe('W6-R-02 — jeder sichtbare Ring haelt 3:1 auf seiner Traegerflaeche (Ratsche)', () => {
    // KEIN `mode: 'serial'` — Begruendung bei W6-R-01. Hier waere der Schaden
    // groesser: faellt Light, blieben Sepia und Contrast ungemessen, und genau
    // Sepia traegt den Befund auf der Modalflaeche (2,37).

    test('der Kontrastrechner ist der des Projekts und hat seinen Selbsttest bestanden', () => {
        // Er wirft beim Laden, wenn die Formel nicht stimmt. Dieser Fall macht
        // sichtbar, DASS er geladen wurde — sonst stuende die ganze Rechnung
        // dieser Datei auf einem stillen Import.
        expect(Number(WCAG.ratio('#777777', '#ffffff').toFixed(2))).toBe(4.48);
        expect(Number(WCAG.ratio('#767676', '#ffffff').toFixed(2))).toBe(4.54);
        // Und die Schichtung tut, was sie soll. Erster Fall: die Modalflaeche
        // allein ueber der Leinwand — 0,95 x 26 + 0,05 x 255 = 37,45 -> #252525.
        expect(flaecheAusLagen([{ bg: 'rgba(26, 26, 26, 0.95)' }])).toBe('#252525');
        // Zweiter Fall: eine deckende Lage bleibt, was sie ist.
        expect(flaecheAusLagen([{ bg: 'rgb(13, 13, 13)' }])).toBe('#0d0d0d');
        // Dritter Fall, und der traegt die Aussage: dieselbe Modalflaeche UEBER
        // dem Dunkelschleier UEBER der Seitenflaeche von Light — die drei
        // Lagen, die der Browser unter einem Modalfeld wirklich meldet
        // (nachgemessen in allen vier Themes). Der Schleier kommt als
        // `color(srgb ...)`; wer die Form nicht zerlegt, laesst ihn fallen und
        // bekommt #252525 statt #1e1e1e.
        expect(
            flaecheAusLagen([
                { bg: 'rgba(26, 26, 26, 0.95)' },
                { bg: 'color(srgb 0 0 0 / 0.6)' },
                { bg: 'rgb(245, 245, 245)' }
            ])
        ).toBe('#1e1e1e');
        // Und derselbe Stapel in Sepia.
        expect(
            flaecheAusLagen([
                { bg: 'rgba(26, 26, 26, 0.95)' },
                { bg: 'color(srgb 0 0 0 / 0.6)' },
                { bg: 'rgb(244, 228, 193)' }
            ])
        ).toBe('#1e1d1d');
        // Die srgb-Form ohne Alpha, mit Kanaelen in 0..1.
        expect(flaecheAusLagen([{ bg: 'color(srgb 1 1 1)' }])).toBe('#ffffff');
        // Eine voellig durchsichtige Lage aendert nichts.
        expect(flaecheAusLagen([{ bg: 'rgba(0, 0, 0, 0)' }, { bg: 'rgb(26, 26, 26)' }])).toBe(
            '#1a1a1a'
        );
        expect(Object.keys(KONTRAST_GEDULDET)).toEqual([]);
    });

    for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
        test(`Theme ${theme}: kein sichtbarer Ring unter 3:1`, async ({ page }) => {
            test.skip(
                !VOLLER_LAUF,
                'Vier-Themes-Lauf nur auf Anforderung: FOKUSRING=1 setzen. In der CI traegt W6-R-04 (design-consistency.test.js) dieselbe Aussage am Token.'
            );
            test.setTimeout(300000);
            await seedPopulatedSession(page);
            await loadApp(page);
            await schliesseUmzugshinweis(page);
            await setzeTheme(page, theme);

            const haltepunkte = await alleHaltepunkte(page);
            expect(haltepunkte.length).toBeGreaterThan(900);

            const beringt = haltepunkte.filter(h => istSichtbar(h) && hatRing(h));
            expect(beringt.length).toBeGreaterThan(400);

            /** @type {string[]} */
            const unmessbar = [];
            const befunde = [];
            for (const h of beringt) {
                const ring = zerlegeFarbe(h.oC);
                const flaeche = flaecheAusLagen(h.lagen);
                if (!ring || ring.alpha < 1 || !flaeche) {
                    unmessbar.push(`${nenne(h)} — Ringfarbe ${h.oC}`);
                    continue;
                }
                const v = WCAG.ratio(WCAG.rgbToHex(ring.rgb), flaeche);
                if (v < 3 && !KONTRAST_GEDULDET[nenne(h)]) {
                    befunde.push(
                        `${nenne(h)} — ${WCAG.rgbToHex(ring.rgb)} auf ${flaeche} = ${v.toFixed(2)}`
                    );
                }
            }

            // Ein Ring, dessen Farbe oder Flaeche sich nicht ausrechnen laesst,
            // ist ein Befund und kein Freibrief.
            expect([...new Set(unmessbar)].sort()).toEqual([]);
            expect([...new Set(befunde)].sort()).toEqual([]);
        });
    }
});

// ---------------------------------------------------------------------------
// W6-R-01 Teil 2 — die vier blinden Selektoren
// ---------------------------------------------------------------------------

/**
 * DIE ACHT FELDER DES SCHRITTS 5, einzeln adressiert statt im Rundlauf
 * gesammelt.
 *
 * WARUM EIN EIGENER FALL: der Rundlauf von W6-R-01 liegt hinter einem
 * Schalter, weil er zwei Minuten je Theme kostet, und er faehrt nur EIN Theme.
 * Die vier blinden Selektoren brauchen aber beides — alle vier Themes (weil
 * die Ringfarbe wechselt) und einen Lauf in JEDEM Durchgang (weil sie der
 * Gegenstand des Schritts sind). Dieser Fall holt sie gezielt: ein
 * Aufklapp-Formular, ein zweites, eine Tastenkombination. Das kostet den
 * Bruchteil eines Rundlaufs.
 *
 * ACHT, NICHT SIEBEN. Der Schrittplan nennt "3 Regeln, 7 Elemente". Am Baum
 * gezaehlt sind es acht: `.cf-combat-value` traegt SECHS Felder
 * (view-party.html — char-ac, char-init, char-speed, char-perception,
 * char-hitdice, char-proficiency), nicht fuenf. `char-proficiency` ist
 * `readonly` und damit leicht zu uebersehen — tabulierbar ist es trotzdem,
 * gemessen. Dazu `#session-tags-input` und `.cp-input`.
 *
 * ZWEI WEGE FUER `.cp-input`, UND BEIDE SIND ECHTE TASTATUR. Die Befehlsleiste
 * geht ueber `Strg+Shift+K` auf und setzt den Fokus dann SELBST
 * (command-palette.js). Das ist kein `.focus()` im Testcode, sondern der
 * echte Weg des Nutzers — und es ist der Weg, auf dem der Ring erscheinen
 * MUSS, denn tabuliert wird dort niemand hin. Gemessen: `:focus-visible`
 * greift trotz programmatischem Fokus, weil Chromium es bei Textfeldern
 * immer setzt. Der zweite Weg (Shift+Tab, dann Tab) prueft denselben Knoten
 * nach einem echten Sprung und belegt, dass beide Wege dasselbe Ergebnis
 * liefern.
 *
 * DER ABSCHNITT WIRD MITGEPRUEFT, und das ist der Teil, den W6-R-01 nicht
 * kann: `outline-offset: 2px` legt den Ring AUSSERHALB des Elements. Ein
 * Vorfahr mit `overflow: hidden`, dessen Kasten den Ring nicht mehr enthaelt,
 * schneidet ihn ab — die berechnete `outline-width` steht dann trotzdem auf
 * 2px, und jede Pruefung, die nur sie liest, nennt den Ring vorhanden.
 * `.cp-input` und `#session-tags-input` sitzen beide als `flex: 1` in einer
 * Zeile; genau dort war das zu befuerchten. Gemessen: kein Abschnitt, an
 * keinem der acht Felder, in keinem Theme.
 *
 * AUSGANGSWERTE (gemessen am 2026-10-06, HEAD dcb8ec0, gefuellte Kampagne,
 * 1600x1000): ALLE 32 Zellen (8 Felder x 4 Themes) ohne jeden Ring —
 * `outline: 0px none`, dazu `border-width: 0px`, also auch kein
 * Rahmenwechsel. `:focus-visible` war an allen 32 Zellen WAHR; die Weltregel
 * haette den Ring also gesetzt, wenn die drei `outline: none`-Regeln ihn nicht
 * genommen haetten. Das ist der ganze Befund des Schritts 5, und er steht
 * damit nicht als Behauptung, sondern als Messung.
 */
const BLINDE_FELDER = [
    { id: 'char-ac', regel: 'party.css {.cf-combat-value input:focus}' },
    { id: 'char-init', regel: 'party.css {.cf-combat-value input:focus}' },
    { id: 'char-speed', regel: 'party.css {.cf-combat-value select:focus}' },
    { id: 'char-perception', regel: 'party.css {.cf-combat-value input:focus}' },
    { id: 'char-hitdice', regel: 'party.css {.cf-combat-value input:focus}' },
    { id: 'char-proficiency', regel: 'party.css {.cf-combat-value input:focus}' },
    { id: 'session-tags-input', regel: 'dmscreen.css {#session-tags-input}' }
];

/**
 * Liest den fokussierten Knoten wie LESE_HALT und zusaetzlich den
 * Abschneidevorfahren. Laeuft IM BROWSER.
 */
const LESE_BLIND = `(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return null;
    const cs = getComputedStyle(el);
    const lagen = [];
    let p = el.parentElement;
    while (p) {
        const bg = getComputedStyle(p).backgroundColor;
        if (bg && bg !== 'transparent') lagen.push({ bg: bg });
        p = p.parentElement;
    }
    const r = el.getBoundingClientRect();
    // Der Ring braucht 4px Luft: 2px Versatz plus 2px Breite.
    const LUFT = 4;
    let abschnitt = null;
    let q = el.parentElement;
    while (q && q !== document.documentElement) {
        const qc = getComputedStyle(q);
        if (qc.overflow !== 'visible' || qc.overflowX !== 'visible' || qc.overflowY !== 'visible') {
            const qr = q.getBoundingClientRect();
            if (r.left - LUFT < qr.left - 0.5 || r.top - LUFT < qr.top - 0.5 ||
                r.right + LUFT > qr.right + 0.5 || r.bottom + LUFT > qr.bottom + 0.5) {
                const c = (typeof q.className === 'string' ? q.className : '').trim().split(/\\s+/)[0];
                abschnitt = q.tagName.toLowerCase() + (q.id ? '#' + q.id : '') + (c ? '.' + c : '')
                    + ' overflow:' + qc.overflow;
                break;
            }
        }
        q = q.parentElement;
    }
    let blass = null;
    let z = el;
    while (z && z !== document.documentElement) {
        if (parseFloat(getComputedStyle(z).opacity) === 0) {
            blass = z.tagName.toLowerCase() + (z.id ? '#' + z.id : '');
            break;
        }
        z = z.parentElement;
    }
    let fv = null;
    try { fv = el.matches(':focus-visible'); } catch (e) { fv = null; }
    return {
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        cls: (typeof el.className === 'string' ? el.className : '').trim().split(/\\s+/).filter(Boolean).slice(0, 3).join(' '),
        oW: cs.outlineWidth, oS: cs.outlineStyle, oC: cs.outlineColor, oO: cs.outlineOffset,
        bw: cs.borderTopWidth, bc: cs.borderTopColor,
        fv: fv, blass: blass, abschnitt: abschnitt, lagen: lagen,
        css: el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
    };
})()`;

/**
 * Tabuliert bis zum Element mit dieser ID und liest es. ECHTE Spruenge, kein
 * `.focus()`. Gibt null zurueck, wenn es in `grenze` Spruengen nicht erreicht
 * wird — das ist dann ein Befund und keine stille Luecke.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 * @param {number} grenze
 */
async function tabulierBis(page, id, grenze = 320) {
    await page.evaluate(() => {
        if (document.activeElement && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        document.body.focus();
    });
    for (let i = 0; i < grenze; i++) {
        await page.keyboard.press('Tab');
        const da = await page.evaluate(
            z => !!document.activeElement && document.activeElement.id === z,
            id
        );
        if (da) return await page.evaluate(LESE_BLIND);
    }
    return null;
}

/**
 * Klappt ein Aufklapp-Formular ueber seinen echten Knopf auf.
 * @param {import('@playwright/test').Page} page
 * @param {string} formId
 */
async function klappeAuf(page, formId) {
    await page.evaluate(f => {
        const el = document.getElementById(f);
        if (el && !el.classList.contains('open')) {
            const knopf = document.querySelector(
                `[data-action="toggle-collapse"][data-value="${f}"]`
            );
            if (knopf instanceof HTMLElement) knopf.click();
        }
    }, formId);
    await page.waitForTimeout(500);
    expect(
        await page.evaluate(f => {
            const el = document.getElementById(f);
            return !!el && el.classList.contains('open');
        }, formId),
        `Formular ${formId} ging nicht auf — die Messung waere lueckenhaft`
    ).toBe(true);
}

test.describe('W6-R-01 Teil 2 — die vier blinden Selektoren, einzeln und in vier Themes (Ratsche)', () => {
    for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
        test(`Theme ${theme}: alle acht Felder tragen einen ungeschnittenen Ring ueber 3:1`, async ({
            page
        }) => {
            test.setTimeout(180000);
            await seedPopulatedSession(page);
            await loadApp(page);
            await schliesseUmzugshinweis(page);
            await setzeTheme(page, theme);

            /** @type {Array<{ name: string, h: any }>} */
            const messungen = [];

            // (1) Die sechs .cf-combat-value-Felder im Charakterformular.
            await page.evaluate(() => {
                // @ts-ignore — global aus der Ansichtsverwaltung
                window.switchView('party');
                // @ts-ignore
                if (typeof window.clearEventLog === 'function') window.clearEventLog();
            });
            await page.waitForSelector('#view-party.active', { state: 'visible', timeout: 5000 });
            await page.waitForTimeout(250);
            await klappeAuf(page, 'char-form');
            for (const feld of BLINDE_FELDER.slice(0, 6)) {
                messungen.push({
                    name: `${feld.id} (${feld.regel})`,
                    h: await tabulierBis(page, feld.id)
                });
            }

            // (2) #session-tags-input im Sitzungsformular.
            await page.evaluate(() => {
                // @ts-ignore
                window.switchView('notes');
                // @ts-ignore
                if (typeof window.clearEventLog === 'function') window.clearEventLog();
            });
            await page.waitForSelector('#view-notes.active', { state: 'visible', timeout: 5000 });
            await page.waitForTimeout(250);
            await klappeAuf(page, 'session-form');
            messungen.push({
                name: `session-tags-input (dmscreen.css {#session-tags-input})`,
                h: await tabulierBis(page, 'session-tags-input')
            });

            // (3) .cp-input ueber den echten Tastenweg. Die Leiste setzt den
            //     Fokus selbst — tabuliert wird dort niemand hin, also ist das
            //     DER Weg, auf dem der Ring erscheinen muss.
            await page.evaluate(() => {
                // @ts-ignore
                if (typeof window.clearEventLog === 'function') window.clearEventLog();
            });
            await page.keyboard.press('Control+Shift+K');
            await page.waitForTimeout(500);
            const cp = await page.evaluate(LESE_BLIND);
            expect(
                cp && cp.cls.split(' ').includes('cp-input'),
                'Strg+Shift+K hat die Befehlsleiste nicht geoeffnet oder ihren Leser nicht fokussiert'
            ).toBe(true);
            messungen.push({
                name: '.cp-input (command-palette.css {.cp-input}, Strg+Shift+K)',
                h: cp
            });
            // Derselbe Knoten nach einem echten Sprung.
            await page.keyboard.press('Shift+Tab');
            await page.waitForTimeout(160);
            await page.keyboard.press('Tab');
            await page.waitForTimeout(160);
            messungen.push({
                name: '.cp-input (command-palette.css {.cp-input}, echter Tabulatorsprung)',
                h: await page.evaluate(LESE_BLIND)
            });
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);

            // Die Messung muss acht Felder plus den zweiten Weg gesehen haben.
            expect(messungen).toHaveLength(9);
            expect(messungen.filter(m => !m.h).map(m => `${m.name} — nicht erreicht`)).toEqual([]);

            /** @type {string[]} */
            const befunde = [];
            for (const { name, h } of messungen) {
                if (!istSichtbar(h)) {
                    befunde.push(
                        `${name} — nicht sichtbar (blass ${h.blass}, Kasten ${h.rect.join(',')})`
                    );
                    continue;
                }
                if (!hatRing(h)) {
                    befunde.push(`${name} — KEIN RING (outline ${h.oW} ${h.oS}, border ${h.bw})`);
                    continue;
                }
                if (h.abschnitt) {
                    befunde.push(`${name} — Ring abgeschnitten von ${h.abschnitt}`);
                    continue;
                }
                const ring = zerlegeFarbe(h.oC);
                const flaeche = flaecheAusLagen(h.lagen);
                if (!ring || ring.alpha < 1 || !flaeche) {
                    befunde.push(`${name} — Ringfarbe oder Flaeche nicht messbar (${h.oC})`);
                    continue;
                }
                const v = WCAG.ratio(WCAG.rgbToHex(ring.rgb), flaeche);
                if (v < 3) {
                    befunde.push(
                        `${name} — ${WCAG.rgbToHex(ring.rgb)} auf ${flaeche} = ${v.toFixed(2)} unter 3`
                    );
                }
            }
            expect(befunde.sort()).toEqual([]);
        });
    }
});
