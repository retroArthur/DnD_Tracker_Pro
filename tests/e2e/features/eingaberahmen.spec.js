/**
 * W6-R-07 — der Eingaberahmen am echten Element (Design-Handoff v3, Welle 6,
 * Schritt 6)
 *
 * WARUM DIESE DATEI EXISTIERT. Punkt 3 der Welle wendet `--border-input` auf
 * die Eingabefelder an. Das Token steht seit Welle 1 in allen vier
 * Theme-Bloecken und wird von R-02 Teilformel 4 auf seinen WERT geprueft — die
 * Prueffung ist seit Welle 1 gruen, obwohl im ganzen Baum kein einziges Feld
 * das Token liest. Eine Ratsche, die eine Farbe bewacht, die niemand benutzt,
 * bewacht nichts. Der Nachweis der ANWENDUNG kann nur am Element fallen, und
 * zwar aus zwei Gruenden, die beide gemessen sind:
 *
 *   (1) DER STIL-SOLLSTAND SIEHT NUR 32 FELDER. Er hasht `borderColor`, aber
 *       er bemustert die Ansichten im RUHEZUSTAND — `.form-group input` (184
 *       Felder) und `.form-group select` liegen in zugeklappten Formularen und
 *       geschlossenen Modalen und kommen in keinem seiner Schluessel vor. Der
 *       groesste Hebel des Schrittes (184 von 297 Vertragsfeldern haengen an
 *       EINER Regel) ist dort ungedeckt.
 *   (2) EINE QUELLTEXTPRUEFUNG KANN FELD UND BEHAELTER NICHT TRENNEN.
 *       Gemessen: 36 Regeln mit `border: 1px solid var(--border)` tragen einen
 *       eingabenah klingenden Selektor (`.editor-toolbar`, `.editor-shell`,
 *       `.dice-input-group`, `.cp-input-row`, `.session-tags-input-wrapper`,
 *       `.qref-search`, die th/td-Gruppen …) und treffen KEIN Eingabefeld. Ein
 *       Namensfilter haette ihnen den Feldrahmen gegeben. Nur der Baum weiss,
 *       welcher Selektor ein Feld erreicht.
 *
 * WAS "VERTRAGSFELD" HEISST, und warum die Liste so und nicht anders laeuft:
 * `input` ohne die Typen, die kein Textfeld sind (checkbox, radio, hidden,
 * file, range, submit, button, reset, image), dazu `select`, `textarea` und
 * jedes `contenteditable`. Gemessen sind das 297 Felder in 24 Ansichten, drei
 * Aufklapp-Formularen und sechs Modalen — 118 text, 81 number, 68 select, 22
 * contenteditable, 5 textarea, je 1 date/url/color. Die 228 Kaestchen haben
 * einen eigenen Vertrag (natives Aussehen) und sind NICHT dabei; ein `border`
 * auf einem Kaestchen mit `appearance: auto` ist in Chromium ohnehin
 * wirkungslos (nachgemessen, siehe DIE ELEMENTREGEL unten).
 *
 * AUSGANGSWERTE BEI DER GEBURT (gemessen am 2026-10-06 am Buendel von
 * a2b6784, vier Themes, gefuellte Kampagne):
 *
 *   Fall 1  ROT. 194 sichtbare Vertragsfelder je Theme; 164 davon tragen
 *           `var(--border)` statt `var(--border-input)`. Der Ruherahmen liest
 *           dort gegen seine eigene Fuellung min 1,35 (dark) · 1,31 (light) ·
 *           1,53 (sepia) · 2,13 (contrast) — in JEDEM Theme unter der
 *           3:1-Schwelle von WCAG 1.4.11. Mit dem Token: 3,67 · 3,71 · 3,33 ·
 *           4,73.
 *   Fall 2  ROT. 17 Felder stehen auf der Browser-Vorgabe, nicht auf einer
 *           Regel der App. Die Aufschluesselung ist wichtiger als die Zahl:
 *           14 tragen `2px inset rgb(133, 133, 133)` — DREI tragen
 *           `1px solid rgb(133, 133, 133)` (#char-languages, #effect-color,
 *           #filter-session-arc, alle drei `select`). Eine Pruefung, die nur
 *           `borderTopStyle === 'inset'` sucht, uebersieht genau diese drei.
 *   Fall 3  GRUEN BEI DER GEBURT, Erkenner rot bewiesen. Die 15 Behaelter
 *           tragen `var(--border)` und sollen es behalten; der Fall faellt,
 *           wenn eine kuenftige Sammeländerung sie mitnimmt.
 *   Fall 4  ROT in light und sepia, GRUEN in dark und contrast. Der
 *           Fokusrahmen liest `var(--gold)`/`var(--cyan)`, der Ring daneben
 *           `var(--focus-ring)`. In dark und contrast ist `--focus-ring` ein
 *           Alias auf `--gold`, dort stimmen beide ueberein; in light und
 *           sepia nicht: gemessen 219 von 219 fokussierten Feldern zeigen ZWEI
 *           VERSCHIEDENE GOLDTOENE, 2 px voneinander entfernt (light 142x
 *           Ring #946c09 gegen Rahmen #b8860b, sepia 142x #b55819 gegen
 *           #8b4513). Das ist keine Altlast, sondern in Welle 6 Schritt 3
 *           entstanden, als der Ring sein eigenes Token bekam und der Rahmen
 *           auf `--gold` blieb.
 *
 * DIE AUSGANGSWERTE SIND NACH ZWEI MESSKORREKTUREN ERNEUT ERHOBEN und unveraendert
 * geblieben (220 / 206 / 220 / 220 und 14). Die beiden Korrekturen stehen an ihrer
 * Stelle im Code: der Durchgang laesst den Fokus LOS, bevor er den Ruherahmen liest
 * (der HP-Rechner fokussiert sein Feld selbst und lieferte sonst einen falschen
 * Befund je Theme), und die Gegenprobe dreht den Schritt an einer Regel ZURUECK
 * statt ihn vorwegzunehmen — in der ersten Fassung wurde sie nach der Umsetzung
 * selbst rot, war also keine Bewachung des Schrittes.
 *
 * WAS DIESE DATEI NICHT IST. Sie ist nicht der Nachweis, dass der Fokus
 * ueberhaupt sichtbar ist — das ist W6-R-01 (fokusring.spec.js), und sie ist
 * nicht der Nachweis, dass der RING seine Schwelle haelt — das ist W6-R-02 am
 * Element und W6-R-04 am Token. Hier geht es um den RAHMEN: im Ruhezustand um
 * seine Farbe, im Fokus um seine Gleichheit mit dem Ring.
 *
 * LAUFZEIT. Kein Tabulatorlauf ueber 1000 Halte, sondern ein Sammelgriff je
 * Ort (`querySelectorAll` + `getComputedStyle`) — gemessen rund 20 s je Theme.
 * Die vier Themes laufen deshalb OHNE Schalter: der Ruherahmen ist das
 * Ergebnis dieses Schrittes, und ein Ergebnis, das nur auf Anforderung
 * geprueft wird, ist in der CI ungedeckt. Fall 4 braucht echten Fokus und
 * nimmt dafuer ACHT benannte Felder statt aller 297 — ECHTE Tabulatorspruenge,
 * nie `.focus()`: `:focus-visible` verhaelt sich bei programmatischem Fokus
 * anders, und genau daran haengt die Ringpruefung daneben.
 *
 * GEGEN DAS GEBAUTE BUENDEL, nicht gegen den Quellbaum.
 *
 * KEINE MODULPFADE IN DEN KOMMENTAREN. Das Abdeckungs-Gate wertet jede
 * woertliche Nennung eines loader.js-Modulpfads unter tests/ als Abdeckung —
 * auch die in einem Kommentar.
 */

import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { seedPopulatedSession, loadApp } from '../helpers/test-utils.js';

const require = createRequire(import.meta.url);
const WCAG = require('../../unit/helpers/wcag-contrast.js');

/** Die 24 Ansichten der Registry. */
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

/** Die drei Aufklapp-Formulare — ohne sie bleiben 184 Felder unbesichtigt. */
const FORMULARE = { party: 'char-form', encounter: 'enc-form', notes: 'session-form' };

/** Sechs Modale, ueber ihren echten Codeweg geoeffnet (wie in W6-R-01). */
const MODALE = [
    { id: 'bestiary-editor-modal', oeffnen: 'showModal' },
    { id: 'spell-modal', oeffnen: 'showModal' },
    { id: 'npc-modal', oeffnen: 'showModal' },
    { id: 'quest-modal', oeffnen: 'showModal' },
    { id: 'shop-item-modal', oeffnen: 'showModal' },
    { id: 'hp-calc-modal', oeffnen: 'hpRechner' }
];

/**
 * Felder, die den Eingaberahmen NICHT tragen duerfen — jede Gruppe mit
 * Begruendung UND mit der gemessenen Zahl, die sie deckt. Form wie
 * ATTR_HOVER_AUSNAHME in der Stil-Ratsche: nicht weggefiltert, sondern
 * namentlich geduldet.
 *
 * NICHT HIER EINTRAGEN, WER NUR UNBEQUEM IST. Jeder Eintrag kostet ein Feld,
 * das im Ruhezustand unter 3:1 bleiben darf.
 *
 * @type {Array<{ sel: string, grund: string }>}
 */
const RAHMEN_AUSNAHME = [
    {
        sel: '.cf-combat-value input, .cf-combat-value select',
        grund:
            'Absichtlich rahmenlos (6 Felder: AC, Initiative, Tempo, Wahrnehmung, ' +
            'Trefferwuerfel, Uebungsbonus). Welle 6 Schritt 5 hat ihnen den Ring der ' +
            'Weltregel gegeben und ihre dadurch leere Fokusregel entfernt; ein Rahmen ' +
            'waere eine Ruecknahme dieser Entscheidung.'
    },
    {
        sel: '.char-attr-box .attr-input',
        grund:
            'Absichtlich rahmenlos (6 Attributfelder der Begegnung). Den Rahmen traegt ' +
            'der Kasten .char-attr-box, und der zeigt den Fokus per :focus-within.'
    },
    {
        sel: '#session-tags-input',
        grund:
            'Absichtlich rahmenlos (1 Feld). Den Rahmen traegt die Huelle ' +
            '.session-tags-input-wrapper, die den Fokus per :focus-within zeigt.'
    },
    {
        sel: '.editor-shell .rich-editor',
        grund:
            'Absichtlich rahmenlos (2 Langform-Editoren). Den Rahmen traegt die Schale ' +
            '.editor-shell.'
    },
    {
        sel: '.cf-hp-current input, .cf-hp-max input',
        grund:
            'Bedeutungstragend rot: 2px solid var(--red) fuer aktuelle und maximale ' +
            'Trefferpunkte. Gegen die eigene Fuellung var(--bg-card) gerechnet haelt ' +
            'das 4,62 / 4,83 / 4,29 / 4,72 — die Schwelle ist erfuellt, der ' +
            'Eingaberahmen wuerde die Bedeutung loeschen.'
    },
    {
        sel: '.cf-hp-temp input',
        grund:
            'Bedeutungstragend cyan: 2px solid var(--cyan) fuer temporaere ' +
            'Trefferpunkte. Gegen var(--bg-card): 8,85 / 3,68 / 2,93 / 15,06 — SEPIA ' +
            'LIEST 2,93 UND HAELT DAMIT NICHT. Benannte Restschuld, keine stille ' +
            'Duldung: entweder ein eigener Cyanton fuer Sepia oder die Aufgabe der ' +
            'Farbbedeutung an dieser einen Stelle.'
    },
    {
        sel: '.ld-gold-input input',
        grund:
            'Bedeutungstragend gold: 1px solid var(--gold) am Goldfeld der ' +
            'Beuteverteilung, zusammen mit color: var(--gold-text). Gegen die eigene ' +
            'Fuellung var(--bg-dark): 9,24 / 2,98 / 5,65 / 14,97 — LIGHT LIEST 2,98. ' +
            'Benannte Restschuld wie oben.'
    }
];

/**
 * Behaelter, die `var(--border)` behalten MUESSEN. Gegenprobe zu Fall 1: eine
 * Sammeländerung, die nach Namen statt nach Baumtreffer arbeitet, nimmt sie
 * mit, und das faellt sonst niemandem auf.
 *
 * Alle 12 sind am Baum nachgewiesen: ihr Selektor trifft Elemente, aber KEIN
 * Vertragsfeld.
 */
const BEHAELTER_MIT_BORDER = [
    '.editor-toolbar',
    '.editor-shell',
    '.editor-shell-head',
    '.editor-shell-foot',
    '.editor-block-handle',
    '.editor-toolbar .tb-swatch',
    '.dice-input-group',
    '.global-search-results',
    '.session-tags-input-wrapper',
    '.wiki-search-dropdown',
    '.qref-search',
    '.bst-editor-footer'
];

/**
 * Die acht Felder fuer Fall 4, einer je Fokusregel-Familie. Jedes mit dem Weg,
 * auf dem es im Baum erscheint, und mit der Regel, die seinen Fokusrahmen
 * setzt — damit ein Befund sagt, WELCHE Familie gefallen ist.
 */
const FOKUSFELDER = [
    { id: 'npc-name', ort: { modal: 'npc-modal' }, regel: '.form-group input:focus (184 Felder)' },
    { id: 'npc-desc', ort: { modal: 'npc-modal' }, regel: '.rich-editor:focus (21)' },
    { id: 'party-search', ort: { view: 'party' }, regel: '.toolbar-search:focus (15)' },
    {
        id: 'party-class-filter',
        ort: { view: 'party' },
        regel: '.toolbar-select:focus (5) — gewinnt hier .section-toolbar-filters select:focus (0,2,1)'
    },
    {
        /* NICHT #char-str: das sitzt in .cf-attr-card input[type="number"] und
           hat gar keine Fokusregel — sein Rahmen bleibt im Fokus der
           Ruherahmen. Im Rotlauf 2026-10-06 hat es deshalb einen Befund
           erzeugt, der keiner war. #char-name liegt in einem .cf-field. */
        id: 'char-name',
        ort: { view: 'party', formular: 'char-form' },
        regel: '.cf-panel .cf-field input:focus (11)'
    },
    {
        id: 'char-notes',
        ort: { view: 'party', formular: 'char-form' },
        regel: '.cf-notes-panel .cf-notes-editor:focus (1, contenteditable)'
    },
    { id: 'global-search', ort: { view: 'dashboard' }, regel: '.global-search-input:focus (1)' },
    {
        id: 'enc-speed-walk',
        ort: { view: 'encounter', formular: 'enc-form' },
        regel: '.enc-speed-item input:focus — var(--cyan) (5)'
    }
];

// ---------------------------------------------------------------------------
// Farbe und Flaeche — gleiche Rechnung wie in W6-R-02
// ---------------------------------------------------------------------------

/**
 * `rgb()`, `rgba()` und `color(srgb r g b / a)` -> { rgb: 0..255, alpha }.
 * Die dritte Form ist am lebenden Buendel gefunden: Chromium gibt
 * `color-mix(in srgb, #000 60%, transparent)` so zurueck, mit Kanaelen in
 * 0..1. Eine Zerlegung, die nur `rgba?()` kennt, laesst die Lage still fallen.
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
 * Schichtet Fuellungen von aussen nach innen und gibt die sichtbare Farbe.
 * @param {string[]} lagen  von innen nach aussen
 * @returns {string} Hex
 */
function flaecheAusLagen(lagen) {
    let unten = [255, 255, 255];
    for (let i = lagen.length - 1; i >= 0; i--) {
        const f = zerlegeFarbe(lagen[i]);
        if (!f || f.alpha === 0) continue;
        unten = [0, 1, 2].map(k => f.alpha * f.rgb[k] + (1 - f.alpha) * unten[k]);
    }
    return WCAG.rgbToHex(unten);
}

/**
 * Deckt `vorne` seine Lagen ab, kommt es unveraendert heraus; sonst wird es
 * darueber gemischt.
 * @param {string} vorne
 * @param {string[]} lagen
 * @returns {string|null} Hex
 */
function ueberLagen(vorne, lagen) {
    const f = zerlegeFarbe(vorne);
    if (!f) return null;
    if (f.alpha >= 1) return WCAG.rgbToHex(f.rgb);
    const unten = WCAG.hexToRgb(flaecheAusLagen(lagen));
    return WCAG.rgbToHex([0, 1, 2].map(k => f.alpha * f.rgb[k] + (1 - f.alpha) * unten[k]));
}

// ---------------------------------------------------------------------------
// Sammeln im Browser
// ---------------------------------------------------------------------------

/**
 * Liest alle Vertragsfelder des aktuellen Ortes. Laeuft IM BROWSER.
 * `ausnahmen` ist die Selektorliste aus RAHMEN_AUSNAHME; das Feld merkt sich
 * selbst, ob es getroffen wird — so steht die Begruendung an einer Stelle und
 * die Zuordnung faellt nicht auf einen zweiten Namensvergleich zurueck.
 */
/* KEINE ZEICHENKETTE, SONDERN EINE ECHTE FUNKTION. Wird eine Funktion als
   Zeichenkette an page.evaluate uebergeben, wertet Playwright sie als AUSDRUCK
   aus und laesst das Argument fallen: der Rueckgabewert ist dann die Funktion
   selbst, nicht ihr Ergebnis. Im Rotlauf vom 2026-10-06 liefen die Faelle 1
   und 2 daran in einen TypeError ("undefined.forEach") statt in einen Befund —
   eine Ratsche, die abbricht, statt zu zaehlen, meldet keine Zahl. LESE_FOKUS
   unten darf eine Zeichenkette bleiben: sie ist ein selbstaufrufender
   Ausdruck ohne Argument. */
const SAMMLE_FELDER = ausnahmen => {
    const AUS = new Set([
        'checkbox',
        'radio',
        'hidden',
        'file',
        'submit',
        'button',
        'reset',
        'image',
        'range'
    ]);
    const istVertrag = el => {
        if (el.isContentEditable) return true;
        if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return true;
        if (el.tagName !== 'INPUT') return false;
        return !AUS.has((el.getAttribute('type') || 'text').toLowerCase());
    };
    const out = [];
    const alle = document.querySelectorAll(
        'input, select, textarea, [contenteditable="true"], [contenteditable=""]'
    );
    for (const el of alle) {
        if (!istVertrag(el)) continue;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        let blass = null;
        let q = el;
        while (q && q !== document.documentElement) {
            if (parseFloat(getComputedStyle(q).opacity) === 0) {
                blass = q.tagName.toLowerCase() + (q.id ? '#' + q.id : '');
                break;
            }
            q = q.parentElement;
        }
        const lagen = [];
        let p = el.parentElement;
        while (p) {
            const b = getComputedStyle(p).backgroundColor;
            if (b && b !== 'transparent') lagen.push(b);
            p = p.parentElement;
        }
        let ausnahme = null;
        for (const a of ausnahmen) {
            try {
                if (el.matches(a)) {
                    ausnahme = a;
                    break;
                }
            } catch (e) {
                /* ein unbrauchbarer Selektor darf die Messung nicht abbrechen */
            }
        }
        out.push({
            tag: el.tagName.toLowerCase(),
            typ:
                el.tagName === 'INPUT'
                    ? (el.getAttribute('type') || 'text').toLowerCase()
                    : el.isContentEditable
                      ? 'contenteditable'
                      : el.tagName.toLowerCase(),
            id: el.id || '',
            cls: (typeof el.className === 'string' ? el.className : '')
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 3)
                .join(' '),
            bw: cs.borderTopWidth,
            bs: cs.borderTopStyle,
            bc: cs.borderTopColor,
            fuellung: cs.backgroundColor,
            lagen,
            ausnahme,
            blass,
            sichtbar:
                el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
                r.width > 0 &&
                r.height > 0
        });
    }
    return out;
};

/** Liest den gerade fokussierten Knoten. Laeuft IM BROWSER. */
const LESE_FOKUS = `(() => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return { ende: true };
    const cs = getComputedStyle(el);
    const lagen = []; let p = el.parentElement;
    while (p) { const b = getComputedStyle(p).backgroundColor; if (b && b !== 'transparent') lagen.push(b); p = p.parentElement; }
    return {
        tag: el.tagName.toLowerCase(), id: el.id || '',
        oW: cs.outlineWidth, oS: cs.outlineStyle, oC: cs.outlineColor,
        bw: cs.borderTopWidth, bs: cs.borderTopStyle, bc: cs.borderTopColor,
        fuellung: cs.backgroundColor, lagen
    };
})()`;

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
 * Laedt das gebaute Buendel auf gefuellter Kampagne und raeumt den
 * Umzugshinweis weg.
 * @param {import('@playwright/test').Page} page
 */
async function starte(page) {
    await seedPopulatedSession(page);
    await loadApp(page);
    await page.waitForTimeout(700);
    const knopf = page.locator('[data-action="close-migration-hint"]').first();
    if ((await knopf.count()) > 0) {
        await knopf.dispatchEvent('click').catch(() => {});
        await page.waitForTimeout(220);
    }
}

/**
 * Faehrt 24 Ansichten, drei Formulare und sechs Modale ab und sammelt je Ort
 * alle Vertragsfelder.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<Array<any>>}
 */
async function alleFelder(page) {
    /** @type {Array<any>} */
    const felder = [];
    const ausnahmen = RAHMEN_AUSNAHME.map(a => a.sel);
    const nimm = async ort => {
        /* ERST DEN FOKUS WEGNEHMEN. Dieser Durchgang misst den RUHE-Rahmen,
           und mindestens ein Ort setzt den Fokus selbst: der HP-Rechner
           fokussiert #hp-calc-value beim Oeffnen. Ohne das Loslassen liest der
           Durchgang dort die FOKUSfarbe und meldet sie als falschen
           Ruherahmen — ein Befund, der keiner ist (gemessen am 2026-10-07,
           genau ein Feld in jedem der vier Themes). */
        await page.evaluate(() => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            document.body.focus();
        });
        await page.waitForTimeout(260);
        const liste = await page.evaluate(SAMMLE_FELDER, ausnahmen);
        liste.forEach(f => felder.push({ ort, ...f }));
    };

    for (const ansicht of VIEWS) {
        await page.evaluate(v => {
            // @ts-ignore — global aus der Ansichtsverwaltung
            window.switchView(v);
            // @ts-ignore
            if (typeof window.clearEventLog === 'function') window.clearEventLog();
        }, ansicht);
        await page.waitForSelector(`#view-${ansicht}.active`, { state: 'visible', timeout: 5000 });
        await page.waitForTimeout(200);
        await nimm(`${ansicht}/ruhe`);

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
            await page.waitForTimeout(400);
            await nimm(`${ansicht}/formular`);
            await page.evaluate(f => {
                const el = document.getElementById(f);
                if (el) el.classList.remove('open', 'active');
            }, FORMULARE[ansicht]);
            await page.waitForTimeout(160);
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
        expect(offen, `Modal ${modal.id} ging nicht auf — die Messung waere lueckenhaft`).toBe(
            true
        );
        await page.waitForTimeout(380);
        await nimm(`${modal.id}/modal`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(180);
        await page.evaluate(id => {
            const o = document.getElementById(id);
            if (o instanceof HTMLElement) o.style.display = 'none';
        }, modal.id);
        await page.waitForTimeout(140);
    }

    return felder;
}

/** Lesbarer Name eines Feldes fuer die Befundliste. */
const nenne = f =>
    `${f.ort} ${f.typ}${f.id ? '#' + f.id : ''}${f.cls ? '.' + f.cls.split(' ').join('.') : ''}`;

/** Ist dieses Feld auf dem Schirm? */
const istSichtbar = f => f.sichtbar && !f.blass;

/** Traegt dieses Feld ueberhaupt einen Rahmen? */
const hatRahmen = f => parseFloat(f.bw) > 0 && f.bs !== 'none';

// ---------------------------------------------------------------------------
// W6-R-07
// ---------------------------------------------------------------------------

test.describe('W6-R-07 — jedes Vertragsfeld traegt den Eingaberahmen (Ratsche)', () => {
    // KEIN `mode: 'serial'`: jeder Fall saet seine eigene Kampagne und laedt
    // seine eigene Seite. Ein Serienlauf wuerde ausserdem die spaeteren
    // Themes ueberspringen, sobald das erste faellt — aus einer Ratsche, die
    // vier Zahlen melden soll, wuerde eine, die eine meldet.

    for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
        test(`Fall 1 — ${theme}: jedes sichtbare Vertragsfeld liest var(--border-input)`, async ({
            page
        }) => {
            await starte(page);
            await setzeTheme(page, theme);

            const soll = await page.evaluate(() =>
                getComputedStyle(document.documentElement).getPropertyValue('--border-input').trim()
            );
            expect(soll, '--border-input ist in diesem Theme nicht aufloesbar').toMatch(
                /^#[0-9a-fA-F]{3,8}$/
            );
            const sollHex = WCAG.rgbToHex(WCAG.hexToRgb(soll));

            const felder = (await alleFelder(page)).filter(istSichtbar);
            expect(
                felder.length,
                'zu wenige Vertragsfeldes gesehen — der Lauf hat nicht alle Orte erreicht'
            ).toBeGreaterThan(150);

            /** @type {string[]} */
            const befunde = [];
            for (const f of felder) {
                if (f.ausnahme) continue;
                if (!hatRahmen(f)) {
                    befunde.push(
                        `${nenne(f)}: rahmenlos (${f.bw} ${f.bs}) und nicht in RAHMEN_AUSNAHME`
                    );
                    continue;
                }
                const ist = ueberLagen(f.bc, [f.fuellung, ...f.lagen]);
                if (!ist) {
                    befunde.push(`${nenne(f)}: Rahmenfarbe ${f.bc} nicht zerlegbar`);
                    continue;
                }
                if (ist.toLowerCase() !== sollHex.toLowerCase()) {
                    const fuell = ueberLagen(f.fuellung, f.lagen) || flaecheAusLagen(f.lagen);
                    befunde.push(
                        `${nenne(f)}: ${ist} statt ${sollHex} ` +
                            `(liest auf ${fuell} ${WCAG.ratio(ist, fuell).toFixed(2)}, ` +
                            `mit dem Token ${WCAG.ratio(sollHex, fuell).toFixed(2)})`
                    );
                }
            }

            expect(
                befunde.slice(0, 30),
                `${befunde.length} von ${felder.length} sichtbaren Vertragsfeldern in ${theme} ` +
                    `lesen nicht var(--border-input) = ${sollHex}`
            ).toEqual([]);
        });
    }

    test('Fall 2 — kein Vertragsfeld steht auf der Browser-Vorgabe', async ({ page }) => {
        /* ZWEI SCHREIBWEISEN, NICHT EINE. Chromium gibt rahmenlosen Feldern
           je nach Typ `2px inset rgb(133, 133, 133)` (input, textarea) ODER
           `1px solid rgb(133, 133, 133)` (select) — und `color-scheme`
           entscheidet nur den Grauwert, nicht die Schreibweise. Eine Pruefung
           auf `inset` allein uebersieht die drei `select` (#char-languages,
           #effect-color, #filter-session-arc). Gemessen am 2026-10-06: 14
           inset + 3 solid = 17.

           ERKANNT WIRD AN DER FARBE, nicht am Stil: #858585 ist Chromiums
           Vorgabe im dunklen Schema und steht in keinem Theme-Block der App
           (nachgezaehlt: 0 Treffer in allen vier Bloecken). Dazu bleibt der
           Stilvergleich fuer `inset`, weil die App NIRGENDS `inset` setzt. */
        await starte(page);
        await setzeTheme(page, 'dark');
        const felder = (await alleFelder(page)).filter(istSichtbar);

        const vorgabe = felder.filter(
            f => f.bs === 'inset' || /^rgb\(133,\s*133,\s*133\)$/.test(f.bc.trim())
        );
        expect(
            vorgabe.map(nenne).sort(),
            `${vorgabe.length} Vertragsfelder stehen auf der Browser-Vorgabe statt auf einer ` +
                `Regel der App`
        ).toEqual([]);
    });

    test('Fall 3 — die Behaelter behalten var(--border) (Gegenprobe)', async ({ page }) => {
        /* DIE GEGENPROBE IST DER PUNKT. 36 Regeln im Baum tragen
           `border: 1px solid var(--border)` UND einen eingabenah klingenden
           Selektor, ohne ein Feld zu treffen. Wer Punkt 3 mit einem
           Namensfilter umsetzt, gibt ihnen den Feldrahmen; sichtbar falsch,
           und von Fall 1 nicht zu fangen, weil der Felder zaehlt. */
        await starte(page);
        await setzeTheme(page, 'dark');

        /* ALLE VIER SEITEN, NICHT NUR DIE OBERE. Zwei der zwoelf Behaelter
           tragen ihren Rahmen nur unten (`.editor-shell-head`, `.qref-search`
           — gemessen borderTopWidth 0px). Eine Pruefung auf borderTopColor
           allein haette sie als "Feldrahmen bekommen" gemeldet, obwohl sie
           oben gar keinen Rahmen haben: ein Fehlalarm, der die Gegenprobe
           unbrauchbar macht. Geprueft wird deshalb jede Seite MIT Breite. */
        const werte = await page.evaluate(sels => {
            const cs = getComputedStyle(document.documentElement);
            const out = {
                border: cs.getPropertyValue('--border').trim(),
                borderInput: cs.getPropertyValue('--border-input').trim(),
                treffer: {}
            };
            for (const s of sels) {
                const el = document.querySelector(s);
                if (!el) continue;
                const c = getComputedStyle(el);
                out.treffer[s] = ['Top', 'Right', 'Bottom', 'Left']
                    .map(seite => ({
                        seite,
                        breite: c['border' + seite + 'Width'],
                        farbe: c['border' + seite + 'Color']
                    }))
                    .filter(x => parseFloat(x.breite) > 0);
            }
            return out;
        }, BEHAELTER_MIT_BORDER);

        const sollHex = WCAG.rgbToHex(WCAG.hexToRgb(werte.border));
        const feldHex = WCAG.rgbToHex(WCAG.hexToRgb(werte.borderInput));
        const gesehen = Object.keys(werte.treffer);
        expect(
            gesehen.length,
            'keiner der benannten Behaelter war im Baum — die Gegenprobe prueft dann nichts'
        ).toBeGreaterThanOrEqual(6);

        /** @type {string[]} */
        const befunde = [];
        for (const [sel, seiten] of Object.entries(werte.treffer)) {
            if (!seiten.length) {
                befunde.push(`${sel}: keine Seite mit Breite > 0 — der Rahmen ist weg`);
                continue;
            }
            let eineMitBorder = false;
            for (const x of seiten) {
                const farbe = ueberLagen(x.farbe, []);
                if (!farbe) continue;
                if (farbe.toLowerCase() === feldHex.toLowerCase()) {
                    befunde.push(
                        `${sel} ${x.seite}: ${farbe} — hat den FELDRAHMEN ` +
                            `var(--border-input) bekommen`
                    );
                }
                if (farbe.toLowerCase() === sollHex.toLowerCase()) eineMitBorder = true;
            }
            if (!eineMitBorder) {
                befunde.push(
                    `${sel}: keine Seite liest var(--border) = ${sollHex} ` +
                        `(gesehen: ${seiten.map(x => x.seite + ' ' + x.farbe).join(', ')})`
                );
            }
        }
        expect(
            befunde,
            `Behaelter mit Feldrahmen oder ohne var(--border): ${befunde.length} ` +
                `(geprueft ${gesehen.length} von ${BEHAELTER_MIT_BORDER.length})`
        ).toEqual([]);
    });

    for (const theme of ['dark', 'light', 'sepia', 'contrast']) {
        test(`Fall 4 — ${theme}: der Fokusrahmen ist die Ringfarbe, an echten Tabulatorspruengen`, async ({
            page
        }) => {
            /* ECHTE TABULATORSPRUENGE, NIE .focus(). Der Fall prueft zwei
               Dinge am selben Halt: dass der RAHMEN die Ringfarbe liest, und
               dass er auf seiner eigenen Fuellung 3:1 haelt. Das zweite ist
               der Grund, warum `--focus-ring` und nicht `--gold` die richtige
               Tinte ist: `--gold` liest in light 2,66 und das Cyan in sepia
               2,51 — beide unter der Schwelle, beide seit Jahren. */
            await starte(page);
            await setzeTheme(page, theme);

            const tokens = await page.evaluate(() => {
                const cs = getComputedStyle(document.documentElement);
                return {
                    ring: cs.getPropertyValue('--focus-ring').trim(),
                    gold: cs.getPropertyValue('--gold').trim()
                };
            });
            const ringHex = WCAG.rgbToHex(WCAG.hexToRgb(tokens.ring));

            /** @type {string[]} */
            const befunde = [];
            let geprueft = 0;

            for (const feld of FOKUSFELDER) {
                if (feld.ort.view) {
                    await page.evaluate(v => {
                        // @ts-ignore — global aus der Ansichtsverwaltung
                        window.switchView(v);
                    }, feld.ort.view);
                    await page.waitForTimeout(260);
                }
                if (feld.ort.formular) {
                    await page.evaluate(f => {
                        const el = document.getElementById(f);
                        if (el && !el.classList.contains('open')) {
                            const knopf = document.querySelector(
                                `[data-action="toggle-collapse"][data-value="${f}"]`
                            );
                            if (knopf instanceof HTMLElement) knopf.click();
                        }
                    }, feld.ort.formular);
                    await page.waitForTimeout(400);
                }
                if (feld.ort.modal) {
                    /* ERST DEN INLINE-STIL WEGNEHMEN. Das Zumachen weiter
                       unten setzt `style.display = none` direkt am Element;
                       ein spaeteres showModal() setzt eine Klasse und kommt
                       dagegen nicht an. Im Rotlauf vom 2026-10-06 war #npc-desc
                       deshalb in allen vier Themes "nicht im Baum" — ein
                       Messfehler, kein Befund. */
                    await page.evaluate(id => {
                        const o = document.getElementById(id);
                        if (o instanceof HTMLElement) o.style.display = '';
                        // @ts-ignore — global aus der Modalverwaltung
                        if (typeof window.showModal === 'function') window.showModal(id);
                    }, feld.ort.modal);
                    await page.waitForTimeout(380);
                }

                const da = await page.evaluate(id => {
                    const el = document.getElementById(id);
                    if (!el) return false;
                    const r = el.getBoundingClientRect();
                    return r.width > 0 && r.height > 0;
                }, feld.id);
                expect(da, `#${feld.id} war nicht im Baum — ${feld.regel} bliebe ungeprueft`).toBe(
                    true
                );

                /* DER SPRUNG. Ein `.focus()` allein genuegt nicht: Chromium
                   setzt `:focus-visible` bei Textfeldern zwar auch dann, bei
                   `select` aber nicht — und drei der acht Felder sind select.
                   Darum: Feld anfassen, mit Shift+Tab einen Schritt ZURUECK
                   (das findet den echten Vorgaenger, ohne ihn zu kennen), dann
                   mit Tab wieder vor. Die Ankunft ist damit ein echter
                   Tastendruck.

                   WARUM NICHT DIE VORGAENGERSUCHE IM DOKUMENT. Zwei Versuche
                   sind daran gescheitert und beide Fehlschlaege stehen hier,
                   damit sie nicht wiederholt werden: #global-search hat im
                   Dokument keinen tabulierbaren Vorgaenger (Index 0), und die
                   Dokumentreihenfolge ist NICHT die Tabulatorreihenfolge —
                   der Sprung landete auf #floating-dice-trigger. */
                const angefasst = await page.evaluate(id => {
                    const ziel = document.getElementById(id);
                    if (!(ziel instanceof HTMLElement)) return false;
                    ziel.focus();
                    return document.activeElement === ziel;
                }, feld.id);
                expect(
                    angefasst,
                    `#${feld.id} liess sich nicht anfassen — ohne das gibt es keinen Ausgangspunkt`
                ).toBe(true);
                await page.keyboard.press('Shift+Tab');
                await page.waitForTimeout(90);
                await page.keyboard.press('Tab');
                /* LAENGER ALS --dur = 200ms. Sechs der Feldregeln tragen
                   `transition: border-color var(--dur)`; eine Messung nach
                   90 ms liest die Farbe MITTEN im Uebergang. Im Rotlauf
                   2026-10-06 kam #party-class-filter dadurch als #ceaa37
                   heraus statt als #d4af37 — ein Befund, der nur ein zu
                   frueher Blick war. Welle 4 hat `outline-width`/`-offset`
                   ausdruecklich aus den Uebergaengen herausgenommen, die
                   RAHMENfarbe laeuft weiter mit. */
                await page.waitForTimeout(320);
                const halt = await page.evaluate(LESE_FOKUS);
                expect(
                    halt.id,
                    `der Tabulatorsprung landete auf #${halt.id} statt auf #${feld.id}`
                ).toBe(feld.id);
                geprueft++;

                const rahmen = ueberLagen(halt.bc, [halt.fuellung, ...halt.lagen]);
                const fuell = ueberLagen(halt.fuellung, halt.lagen) || flaecheAusLagen(halt.lagen);
                if (!rahmen || !fuell) {
                    befunde.push(`#${feld.id} (${feld.regel}): Farben nicht zerlegbar`);
                } else {
                    if (rahmen.toLowerCase() !== ringHex.toLowerCase()) {
                        befunde.push(
                            `#${feld.id} (${feld.regel}): Rahmen ${rahmen}, Ring ${ringHex} — ` +
                                `zwei Tinten an einem Kennzeichen` +
                                (tokens.gold &&
                                rahmen.toLowerCase() ===
                                    WCAG.rgbToHex(WCAG.hexToRgb(tokens.gold)).toLowerCase()
                                    ? ' (der Rahmen liest noch var(--gold))'
                                    : '')
                        );
                    }
                    const v = WCAG.ratio(rahmen, fuell);
                    if (v < 3) {
                        befunde.push(
                            `#${feld.id} (${feld.regel}): Fokusrahmen ${rahmen} liest auf ` +
                                `${fuell} nur ${v.toFixed(2)} < 3`
                        );
                    }
                }

                if (feld.ort.modal) {
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(180);
                    await page.evaluate(id => {
                        const o = document.getElementById(id);
                        if (o instanceof HTMLElement) o.style.display = 'none';
                    }, feld.ort.modal);
                    await page.waitForTimeout(140);
                }
            }

            expect(geprueft, 'nicht alle acht Familien wurden erreicht').toBe(FOKUSFELDER.length);
            expect(
                befunde,
                `${befunde.length} von ${geprueft} Fokusrahmen in ${theme} sind nicht die ` +
                    `Ringfarbe oder halten 3:1 nicht`
            ).toEqual([]);
        });
    }

    test('Gegenprobe: der Erkenner sieht einen gesetzten Eingaberahmen ueberhaupt', async ({
        page
    }) => {
        /* OHNE DIESEN FALL KOENNTE FALL 1 GRUEN WERDEN, WEIL ER NICHTS FINDET.
           Er dreht den Schritt an EINER Regel zurueck und verlangt, dass die
           Messung den Rueckschritt sieht.

           ERST WAR ES UMGEKEHRT HERUM GEBAUT (var(--border-input) einhaengen
           und die Aenderung sehen) — das konnte nur VOR der Umsetzung
           funktionieren und wurde danach selbst rot ("der Ausgangswert ist
           nicht var(--border)"). Eine Gegenprobe, die nach dem Schritt
           umgeschrieben werden muss, hat den Schritt nicht bewacht. Diese
           Fassung gilt in beide Richtungen. */
        await starte(page);
        await setzeTheme(page, 'dark');
        await page.evaluate(() => {
            // @ts-ignore — global aus der Ansichtsverwaltung
            window.switchView('party');
        });
        await page.waitForTimeout(280);

        const lies = () =>
            page.evaluate(
                () => getComputedStyle(document.querySelector('.toolbar-search')).borderTopColor
            );
        const tokens = await page.evaluate(() => {
            const cs = getComputedStyle(document.documentElement);
            return {
                border: cs.getPropertyValue('--border').trim(),
                borderInput: cs.getPropertyValue('--border-input').trim()
            };
        });
        const alsRgb = hex => 'rgb(' + WCAG.hexToRgb(hex).map(Math.round).join(', ') + ')';

        // Vorher: der Eingaberahmen, wie Schritt 6 ihn gesetzt hat.
        expect(await lies()).toBe(alsRgb(tokens.borderInput));

        // Rueckdrehung an einer Regel — die Messung muss sie sehen.
        await page.addStyleTag({
            content: '.toolbar-search { border-color: var(--border) !important; }'
        });
        await page.waitForTimeout(150);
        expect(await lies()).toBe(alsRgb(tokens.border));

        // Und die beiden Tokens sind wirklich verschieden, sonst prueft der
        // Vergleich oben nichts.
        expect(tokens.border.toLowerCase()).not.toBe(tokens.borderInput.toLowerCase());

        // Der Grund fuer den ganzen Schritt, noch einmal als Zahl: der
        // Eingaberahmen haelt auf der Kartenfuellung 3:1, der alte nicht.
        const auf = '#1a1a1a';
        expect(
            WCAG.ratio(WCAG.rgbToHex(WCAG.hexToRgb(tokens.borderInput)), auf)
        ).toBeGreaterThanOrEqual(3);
        expect(WCAG.ratio(WCAG.rgbToHex(WCAG.hexToRgb(tokens.border)), auf)).toBeLessThan(3);
    });
});
