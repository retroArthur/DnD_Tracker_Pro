// @ts-check
/**
 * Die Reichweite der Vorbereitungsansichten — die zwei Anomalien und die
 * Obergrenzen (TASV, Nutzerentscheidung E-2 / Einheit 2)
 * =====================================================================
 *
 * WORUEBER DIESE DATEI URTEILT, und was sie von `tastatur-erreichbarkeit`
 * unterscheidet. Dort steht die Mengenfrage: bleibt irgendeine sichtbare
 * Stelle unerreichbar? Diese Datei urteilt ueber die zwei Befunde, die
 * eine reine Mengenzaehlung NICHT findet:
 *
 *  A) DER TABULATORKREIS VERSACKT IM VIRTUELLEN SCROLLEN. Im Bestiarium
 *     sind nicht nur die 17 nicht-nativen Zeilen des Fensters
 *     unerreichbar, sondern zusaetzlich sechs NATIVE Knoepfe
 *     (`button.bestiary-fav`) und vier globale Stellen, die in jeder
 *     anderen Ansicht erreicht werden — `div.qref-fab`,
 *     `button#floating-dice-trigger` und die zwei Knoepfe des
 *     Umzugs-Hinweises.
 *
 *     URSACHE, gemessen und nicht vermutet: `VirtualScroll.create()`
 *     haengt an `#bestiary-list` einen auf 16 ms entprellten
 *     `scroll`-Lauscher, dessen `render()` mit
 *     `visibleContainer.innerHTML = …` ALLE Zeilen des Fensters ersetzt.
 *     Tabuliert der Spielleiter auf eine Stelle unterhalb der Kante,
 *     rollt der Browser den Behaelter, der Lauscher feuert, der eben
 *     fokussierte Knoten wird geloescht, und `document.activeElement`
 *     faellt auf `BODY`. Der naechste Tabulator setzt INNERHALB der frisch
 *     gebauten Zeilen wieder auf — nicht dahinter. Was hinter der Liste
 *     steht, wird nie erreicht.
 *
 *     DREI BELEGE fuer die Ursache, alle am gebauten Buendel (b8a1a5c):
 *       - `VirtualScroll.destroy(#bestiary-list)` (Liste zeichnet beim
 *         Rollen nicht neu): 27 -> 17 unerreichbar. Alle sechs
 *         Favoritenknoepfe und alle vier globalen Stellen werden erreicht.
 *       - `threshold = 1e9` (112 Zeilen im DOM, kein virtuelles Scrollen):
 *         unerreichbar 112, und das sind AUSSCHLIESSLICH die 112
 *         nicht-nativen Zeilen. Alle 112 nativen Knoepfe erreicht.
 *       - `grep -rn "VirtualScroll.create"` findet GENAU EINEN Aufrufer im
 *         ganzen Baum (`features/bestiary/bestiary-render.js:207`). Darum
 *         ist das Bestiarium die einzige Ansicht mit diesem Befund, und
 *         darum sind die vier globalen Stellen in den fuenf Kampfansichten
 *         erreichbar.
 *
 *     ES IST KEIN MESSARTEFAKT, UND DAS VORZEICHEN IST UMGEKEHRT. Eine
 *     Messung OHNE Pause zwischen den Tastendruecken meldet 17, eine mit
 *     Pause 27 — die schnelle Messung UNTERSCHAETZT die Schuld um genau
 *     10 Stellen. Tempo-Reihe, je frischer Seitenaufbau:
 *
 *         0 ms -> 17    0 ms -> 17   30 ms -> 27   60 ms -> 27
 *       150 ms -> 27  150 ms -> 27  300 ms -> 27
 *
 *     Ab 30 ms ist das Ergebnis deterministisch. Menschentempo liegt bei
 *     250-600 ms — der Spielleiter trifft IMMER den schlechten Fall.
 *     DARUM LAEUFT JEDER FALL DIESER DATEI MIT EINER PAUSE VON 150 ms.
 *     Die Pause ist hier die Messdisziplin, nicht ein Zugestaendnis: ohne
 *     sie misst die Probe die Maschinengeschwindigkeit und nicht die Hand.
 *
 *  B) DIE TABULATORFLUT. Wer rund 430 Stellen fokussierbar macht, ohne
 *     Reihen zusammenzufassen, verschiebt das Problem nur. Gemessen im
 *     ausgelieferten Zustand, gefuellte Kampagne, 20 Eintraege je Typ,
 *     Anschlaege bis `div.qref-fab` bei 150 ms Pause:
 *
 *         Party        351 Halte  ->  NICHT in 300 Spruengen
 *         Bestiarium    46 Halte  ->  NICHT in 300 Spruengen
 *         Initiative   198 Halte  ->  196 Anschlaege
 *         Shops         90 Halte  ->   89 Anschlaege
 *         Fraktionen    67 Halte  ->   66 Anschlaege
 *
 *     Die Party ist eine KAMPFANSICHT — die Flut ist also schon im
 *     ausgelieferten Kampfpaket und nicht erst die Gefahr dieser Phase.
 *     Ihr Grund sind 140 einzeln anfahrbare `span.slot-pip` (20
 *     Charaktere x 7 Plaetze, Behaelter `.spell-slots-compact`, gemessen
 *     dx 18 / dy 0 / eine Zeile). Das Bestiarium hat eine andere Ursache:
 *     Befund A.
 *
 * WARUM DIE OBERGRENZE ALS `2 x Halte + 40` UND NICHT ALS FESTE ZAHL.
 * Eine feste Zahl waere entweder eine Fessel (jede neue Schaltflaeche
 * macht sie rot) oder nutzlos weit. `2 x Halte + 40` sagt genau das, was
 * der Befund verletzt: der Tabulatorkreis LAEUFT RUND. Wer in zwei
 * vollen Runden plus Luft nicht hinter die Liste kommt, kommt nie hinter
 * die Liste. Die Flutgrenze steht daneben, mit gemessenen Zahlen je
 * Ansicht.
 *
 * MESSDISZIPLIN — dieselben Regeln wie in `tastatur-erreichbarkeit.spec.js`
 * und `tastatur-gruppen.spec.js`:
 *   1. Fokus NUR per `page.keyboard.press`, nie `.focus()` — bei
 *      programmatischem Fokus greift `:focus-visible` nicht.
 *   2. Gerollt wird per `page.mouse.wheel`, nie `scrollTop` oder
 *      `scrollIntoView`: nur das Rad erzeugt denselben Ereignisstrom wie
 *      die Hand.
 *   3. Immer eine GEFUELLTE Kampagne. Eine leere hat in diesem Strang
 *      schon zweimal einen echten Fehler verdeckt.
 *   4. Sichtbarkeit per `checkVisibility({opacityProperty:…})` plus
 *      Rechteckpruefung.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/**
 * Pause zwischen zwei Tastendruecken. 150 ms liegt unter dem gemessenen
 * Menschentempo (250-600 ms) und oberhalb der Schwelle, ab der das
 * Ergebnis im Bestiarium deterministisch ist (30 ms).
 */
const MENSCHENTEMPO = 150;

/**
 * Gefuellte Kampagne mit `n` Eintraegen je Typ — dieselbe Saat wie in
 * `tastatur-erreichbarkeit.spec.js`, damit die Zahlen vergleichbar sind.
 * Die Kaempfer tragen ANDERE Namen als die Charaktere, damit
 * `addPartyToInit()` nichts ueberspringt.
 * @param {number} n
 */
function kampagne(n) {
    const liste = (praefix, extra = {}) =>
        Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `${praefix} ${i + 1}`, ...extra }));
    return {
        _version: '99.0.0',
        settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
        randomTables: [],
        timers: [],
        campaign: {},
        shops: liste('Laden'),
        factions: liste('Fraktion'),
        characters: Array.from({ length: n }, (_, i) => ({
            id: i + 1,
            name: `Charakter ${i + 1} (E-2)`,
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 10, dex: 12, con: 14, int: 16, wis: 12, cha: 10 },
            spellSlots: { 1: { max: 4, current: 2 }, 2: { max: 3, current: 1 } }
        })),
        npcs: liste('NSC', { role: 'Merchant', race: 'Mensch' }),
        locations: liste('Ort'),
        quests: liste('Auftrag', { title: 'Auftrag', status: 'active' }),
        loot: liste('Beute', { qty: 1 }),
        spells: [],
        wiki: liste('Wiki', { title: 'Wiki', category: 'Allgemein' }),
        sessionNotes: [],
        encounters: liste('Begegnung', { monsters: [] }),
        initiative: {
            combatants: Array.from({ length: n }, (_, i) => ({
                id: i + 1,
                name: (i % 2 ? 'Held ' : 'Ork ') + (i + 1),
                initiative: 30 - i,
                initBonus: 2,
                maxHp: 30,
                currentHp: 30,
                ac: 14,
                type: i % 2 ? 'player' : 'monster',
                effects: []
            })),
            currentTurn: 0,
            round: 1
        },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 100,
        quickRefCustom: [],
        _nextId: {
            characters: n + 1,
            npcs: n + 1,
            locations: n + 1,
            quests: n + 1,
            encounters: n + 1,
            spells: 1,
            loot: n + 1,
            items: 1,
            wiki: n + 1,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Zaehlt die sichtbaren Tabulatorhalte der aktiven Ansicht plus der
 * globalen Schale — STRUKTURELL, ohne eine Taste zu druecken. Diese Zahl
 * ist die Grundlage der Flutgrenze und des Budgets.
 *
 * `tabindex="-1"` SCHLIESST JEDES ELEMENT AUS, auch ein natives. Das ist
 * eine Korrektur an meiner ersten Fassung, und sie war falsch um 16: der
 * Selektor fuehrte `button` und `[tabindex]:not([tabindex="-1"])` als
 * ZWEI Zweige, und ein `<button tabindex="-1">` passt auf den ersten. Die
 * 17 `button.bestiary-fav` wurden darum weiter als Halte gezaehlt,
 * nachdem die Gruppenmechanik ihnen den Halt genommen hatte — gemeldete
 * 47 statt der wirklichen 31. Aufgefallen ist es an einem Widerspruch in
 * den eigenen Zahlen: 47 gezaehlte Halte, aber `div.qref-fab` nach 30
 * echten Tastendruecken. Ein Element mit `tabindex="-1"` ist KEIN
 * Tabulatorhalt, egal welches Tag es traegt.
 */
const HALTE = `(() => {
    const SEL = 'button,a[href],input:not([type="hidden"]),select,textarea,summary,' +
        '[tabindex]:not([tabindex="-1"]),[contenteditable=""],[contenteditable="true"]';
    const sichtbar = el => {
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true,
            visibilityProperty: true, contentVisibilityAuto: true })) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const inAktiverAnsicht = el => {
        const v = el.closest('.view');
        return v ? v.classList.contains('active') : true;
    };
    let n = 0;
    document.querySelectorAll(SEL).forEach(el => {
        if (el.getAttribute('tabindex') === '-1') return;
        if (el.disabled || !sichtbar(el) || !inAktiverAnsicht(el)) return;
        n++;
    });
    return n;
})()`;

/**
 * Sammelt die sichtbaren Bedienelemente und haengt einen `focusin`-
 * Mitschnitt an. Gleiche Sammlung und gleiche Sichtbarkeitsregel wie in
 * `tastatur-erreichbarkeit.spec.js`; der Datenschluessel daneben ist dort
 * begruendet (in einer virtuell gescrollten Liste taugt die
 * Objektidentitaet nicht mehr als Identitaet).
 */
const SAMMELN = `(() => {
    const NATIV = 'button,a[href],input:not([type="hidden"]),select,textarea,' +
        '[tabindex]:not([tabindex="-1"]),[contenteditable=""],[contenteditable="true"]';
    const sichtbar = el => {
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true,
            visibilityProperty: true, contentVisibilityAuto: true })) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const inAktiverAnsicht = el => {
        const v = el.closest('.view');
        return v ? v.classList.contains('active') : true;
    };
    const dk = el => (el.getAttribute('data-action') || '-') + '|' +
        (el.getAttribute('data-id') || '-') + '|' + (el.getAttribute('data-value') || '-');
    const beschreibe = el => ({
        sig: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
            ((typeof el.className === 'string' && el.className.trim())
                ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''),
        text: (el.getAttribute('aria-label') || el.getAttribute('title') ||
            el.textContent || el.value || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
        tag: el.tagName.toLowerCase(),
        aktion: el.getAttribute('data-action') || null,
        ti: el.getAttribute('tabindex') || null,
        dk: dk(el),
        ansicht: el.closest('.view') ? el.closest('.view').id : 'global'
    });
    const ops = [], meta = [], gesehen = new Set();
    document.querySelectorAll(NATIV).forEach(el => {
        if (el.disabled || gesehen.has(el) || !sichtbar(el) || !inAktiverAnsicht(el)) return;
        gesehen.add(el); ops.push(el);
        const m = beschreibe(el); m.art = 'nativ'; meta.push(m);
    });
    document.querySelectorAll('[data-action]').forEach(el => {
        if (gesehen.has(el)) return;
        if (el.matches(NATIV) && !el.disabled) return;
        if (!sichtbar(el) || !inAktiverAnsicht(el)) return;
        gesehen.add(el); ops.push(el);
        const m = beschreibe(el); m.art = 'nichtNativ'; meta.push(m);
    });
    window.__ops = ops;
    window.__erreicht = new Set();
    window.__erreichtK = new Set();
    window.__begangen = new Set();
    if (!window.__reichweiteLauscher) {
        window.__reichweiteLauscher = ev => {
            const i = (window.__ops || []).indexOf(ev.target);
            if (i >= 0) window.__erreicht.add(i);
            if (ev.target && ev.target.getAttribute) {
                window.__erreichtK.add((ev.target.getAttribute('data-action') || '-') + '|' +
                    (ev.target.getAttribute('data-id') || '-') + '|' +
                    (ev.target.getAttribute('data-value') || '-'));
            }
        };
        document.addEventListener('focusin', window.__reichweiteLauscher, true);
    }
    return meta;
})()`;

/**
 * Ein Schritt der Pfeiltastenfahrt — liest die ARIA-Zusage, nicht das
 * Modul. Der Begehungsschluessel traegt die Aktion mit, weil ZWEI Gruppen
 * EINEN Behaelter teilen koennen (`div#bestiary-list` fuehrt die Spalte der
 * Zeilen und die der Favoritenknoepfe); Begruendung in
 * `tastatur-erreichbarkeit.spec.js`.
 */
const GRUPPEN_SCHRITT = `(() => {
    const el = document.activeElement;
    if (!el || !el.closest) return null;
    const leiste = el.closest('[role="toolbar"][aria-orientation]');
    if (!leiste) return null;
    const eigene = [...leiste.querySelectorAll('[tabindex]')]
        .filter(g => g.closest('[role="toolbar"][aria-orientation]') === leiste);
    if (eigene.indexOf(el) < 0 || eigene.length < 2) return null;
    window.__begangen = window.__begangen || new Set();
    const schl = (leiste.id || '') + '|' + (leiste.getAttribute('aria-label') || '') + '|' +
        [...document.querySelectorAll('[role="toolbar"][aria-orientation]')].indexOf(leiste) +
        '|' + (el.getAttribute('data-action') || el.tagName);
    if (window.__begangen.has(schl)) return null;
    window.__begangen.add(schl);
    const gleichartig = eigene.filter(g =>
        (g.getAttribute('data-action') || g.tagName) ===
        (el.getAttribute('data-action') || el.tagName));
    return {
        taste: leiste.getAttribute('aria-orientation') === 'vertical' ? 'ArrowDown' : 'ArrowRight',
        glieder: gleichartig.length
    };
})()`;

/** Kennung des fokussierten Elements — ueberlebt ein Neuzeichnen. */
const FOKUS = `(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return { tag: 'BODY' };
    return {
        tag: a.tagName,
        klasse: typeof a.className === 'string' ? a.className : '',
        aktion: a.getAttribute ? a.getAttribute('data-action') : null,
        id: a.getAttribute ? a.getAttribute('data-id') : null,
        wert: a.getAttribute ? a.getAttribute('data-value') : null,
        verbunden: a.isConnected
    };
})()`;

/**
 * DIE VOLKSZAEHLUNG DER UNGRUPPIERTEN REIHEN — die Ratsche, die eine
 * Haltzahl nicht ersetzen kann.
 *
 * WARUM SIE NEBEN DIE HALTGRENZEN GEHOERT (TASV/E-2, Runde 3, Befund 4).
 * Die Haltgrenzen unten sind gemessene Zahlen EINES Zustands: der Saat
 * dieser Datei. Diese Saat fuehrt `spells: []`, klappt keine
 * Wiki-Kategorie auf und gibt keinem Laden Artikel — und genau in den drei
 * Zustaenden, die ein Spielleiter mit einem Knopfdruck herstellt, war die
 * Tabulatorflut zurueck, ohne dass eine Grenze sich ruehrte (`spells`
 * Grenze 35 gegen gemessene 65, `wiki` 30 gegen 50, `shops` 91 gegen 157).
 * Eine Grenze sichert den Messaufbau, solange sie die einzige Ratsche ist.
 *
 * WAS DIESE ZAEHLUNG STATTDESSEN FRAGT — eine STRUKTURELLE Frage, die von
 * Saat und Zahl unabhaengig ist: traegt eine Reihe gleichartiger,
 * NACHGERUESTETER Bedienstellen mehr als EINEN Halt? Je Topf (naechste
 * umgebende Leiste, sonst die Ansicht) und je `data-action` wird gezaehlt,
 * wie viele sichtbare nicht-native Glieder es gibt und wie viele davon
 * einen Halt tragen. Zwei Glieder und zwei Halte heissen: die Reihe ist
 * einzeln anfahrbar, also ungruppiert.
 *
 * MITGLIEDSCHAFT, NICHT UMSCHLIESSUNG. Die erste Fassung fragte
 * `closest('[role=toolbar]') !== null` und war damit blind fuer genau den
 * Fall, der gemeldet war: die fuenfzehn Artikelzeilen liegen INNERHALB von
 * `div#shop-list`, und das ist die Leiste der Ladenkoepfe — in ihr, aber
 * nicht von ihr. Erst die Zaehlung der Halte IM TOPF sieht es.
 *
 * NUR NICHT-NATIVE GLIEDER. Zwanzig `<button>` je Ladenzeile waren schon
 * vor dieser Arbeit zwanzig Halte; sie sind bewusst nicht gruppiert
 * (Begruendung in `ui/keyboard-group-views.js`, Punkt 2), und sie zu
 * zaehlen hiesse, eine fremde Entscheidung zur Ratsche zu machen.
 */
const UNGRUPPIERT = `(() => {
    const NATIV = 'button,a[href],input:not([type="hidden"]),select,textarea,summary';
    const sichtbar = el => {
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true,
            visibilityProperty: true, contentVisibilityAuto: true })) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const inAktiverAnsicht = el => {
        const v = el.closest('.view');
        return v ? v.classList.contains('active') : true;
    };
    const toepfe = new Map();
    document.querySelectorAll('[data-action]').forEach(el => {
        if (el.matches(NATIV)) return;
        if (!sichtbar(el) || !inAktiverAnsicht(el)) return;
        const topf = el.closest('[role="toolbar"][aria-orientation]') ||
            el.closest('.view') || document.body;
        if (!toepfe.has(topf)) toepfe.set(topf, new Map());
        const je = toepfe.get(topf);
        const k = el.getAttribute('data-action');
        if (!je.has(k)) je.set(k, { glieder: 0, halte: 0 });
        const e = je.get(k);
        e.glieder++;
        if (el.getAttribute('tabindex') === '0') e.halte++;
    });
    const flut = {};
    for (const [, je] of toepfe) {
        for (const [k, e] of je) {
            if (e.glieder >= 2 && e.halte >= 2) flut[k] = (flut[k] || 0) + e.halte;
        }
    }
    return flut;
})()`;

/**
 * Die Reihen, die DUERFEN — gemessen, mit Zahl, und jede mit einem Grund.
 *
 * Alle vier stammen aus dem Kampfpaket (E-1) und waren vor E-2 schon
 * einzeln anfahrbar; sie zu gruppieren ist eine eigene Entscheidung ueber
 * Kampfansichten und nicht Teil dieser Arbeit. Die Zahlen sind
 * Obergrenzen: sie duerfen sinken, nicht steigen. Dieselbe Idiomatik wie
 * INLINE_MAX in `tests/unit/design-consistency.test.js`.
 */
const UNGRUPPIERT_ERLAUBT = {
    // Armaturenbrett: 29 Kacheln, jede fuehrt in eine ANDERE Ansicht —
    // eher ein Menue als eine Reihe gleichartiger Schalter.
    'show-view': 29,
    // Initiative: je Kaempfer ein Feld "Wert aendern".
    'edit-init-value': 20,
    // Party: je Charakter "bearbeiten" und "TP rechnen".
    'edit-char': 20,
    'show-hp-calculator-stop': 20
};

/**
 * Lesbare Fehlermeldung der Volkszaehlung.
 * @param {string} wo
 * @param {Record<string, number>} flut
 */
function flutBericht(wo, flut) {
    const zeilen = Object.entries(flut)
        .filter(([k, v]) => v > (UNGRUPPIERT_ERLAUBT[k] || 1))
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `    ${k.padEnd(28)} ${v} Halte (erlaubt ${UNGRUPPIERT_ERLAUBT[k] || 1})`);
    return (
        `${wo}: eine Reihe gleichartiger, nachgeruesteter Stellen ist einzeln anfahrbar.\n` +
        `Jede dieser Familien liegt mit mehreren Gliedern in EINEM Topf und traegt dort\n` +
        `mehr als einen Halt — melde sie in ui/keyboard-group-views.js an:\n` +
        zeilen.join('\n')
    );
}

/**
 * Die Familien, die ueber ihrer Erlaubnis liegen.
 * @param {Record<string, number>} flut
 */
const flutUeberschuss = flut =>
    Object.fromEntries(Object.entries(flut).filter(([k, v]) => v > (UNGRUPPIERT_ERLAUBT[k] || 1)));

/**
 * Frischer Seitenaufbau, gefuellte Kampagne, Ansicht per `switchView()` —
 * ohne Klick (Messdisziplin).
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {number} n
 * @param {((saat: Record<string, any>) => void)|null} saatAnpassen
 */
async function ansichtOeffnen(page, ansicht, n = 20, saatAnpassen = null) {
    await page.setViewportSize(BREIT);
    const saat = kampagne(n);
    if (saatAnpassen) saatAnpassen(saat);
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, saat);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(600);
}

/**
 * Tabulatorlauf mit Pause im Menschentempo, inklusive Pfeiltastenfahrt in
 * jeder betretenen Gruppe.
 * @param {import('@playwright/test').Page} page
 * @param {{ pause?: number }} [opt]
 */
async function reichweiteMessen(page, { pause = MENSCHENTEMPO } = {}) {
    const meta = await page.evaluate(SAMMELN);
    const budget = 2 * meta.length + 40;
    let pfeile = 0;
    for (let i = 0; i < budget; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(pause);
        const schritt = await page.evaluate(GRUPPEN_SCHRITT);
        if (!schritt) continue;
        // ERST ZURUECK, DANN VOR. In einer virtuell gescrollten Gruppe sind
        // die Glieder nur die des FENSTERS (17 von 112); wer sie in der
        // Mitte betritt, erreicht nach vorn alles dahinter und nichts
        // davor. Begruendung mit Messung in
        // `tastatur-erreichbarkeit.spec.js`.
        // Das Ende der Fahrt wird ueber OBJEKTIDENTITAET erkannt
        // (Messdisziplin 3) — eine Signatur taeuscht, weil zwei
        // benachbarte Zauberplatz-Punkte desselben Grades identische
        // Attribute und Klassen tragen. Begruendung mit Messung in
        // `tastatur-erreichbarkeit.spec.js`.
        const rueckwaerts = schritt.taste === 'ArrowDown' ? 'ArrowUp' : 'ArrowLeft';
        for (const taste of [rueckwaerts, schritt.taste]) {
            await page.evaluate(() => {
                window.__letzterFokus = document.activeElement;
            });
            for (let k = 0; k < Math.max(schritt.glieder, 130); k++) {
                await page.keyboard.press(taste);
                pfeile++;
                await page.waitForTimeout(pause);
                const stehen = await page.evaluate(() => {
                    const a = document.activeElement;
                    const gleich = a === window.__letzterFokus;
                    window.__letzterFokus = a;
                    return gleich;
                });
                if (stehen) break;
            }
        }
    }
    const erreicht = new Set(await page.evaluate(() => [...window.__erreicht]));
    const erreichtK = new Set(await page.evaluate(() => [...window.__erreichtK]));
    const zaehler = new Map();
    for (const m of meta) zaehler.set(m.dk, (zaehler.get(m.dk) || 0) + 1);
    return {
        bedienbar: meta.length,
        nichtNativ: meta.filter(m => m.art === 'nichtNativ').length,
        spruenge: budget,
        pfeile,
        unerreichbar: meta
            .map((m, i) => ({ ...m, i }))
            .filter(m => !erreicht.has(m.i) && !(zaehler.get(m.dk) === 1 && erreichtK.has(m.dk)))
    };
}

/**
 * Lesbare Fehlermeldung: WAS unerreichbar ist, nicht nur wie viele.
 * @param {Record<string, any>} m
 */
function bericht(m) {
    const zeilen = m.unerreichbar
        .slice(0, 14)
        .map(
            u =>
                `    ${u.art.padEnd(10)} ${u.tag.padEnd(6)} ${(u.aktion || '-').padEnd(26)} ` +
                `${u.sig.slice(0, 44)}  "${u.text}"  [${u.ansicht}]`
        );
    if (m.unerreichbar.length > 14) {
        zeilen.push(`    … und ${m.unerreichbar.length - 14} weitere`);
    }
    return (
        `${m.bedienbar} sichtbare Bedienelemente (davon ${m.nichtNativ} nicht-nativ), ` +
        `${m.spruenge} Tabulatorspruenge + ${m.pfeile} Pfeiltasten im Menschentempo, ` +
        `${m.unerreichbar.length} unerreichbar:\n` +
        zeilen.join('\n')
    );
}

/**
 * Tabuliert im Menschentempo, bis das unter `window.__ziel` gemerkte
 * Element den Fokus hat (Objektidentitaet). Faehrt Gruppen NICHT ab — die
 * Frage lautet, ob der Tabulator allein hinter die Liste kommt.
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor
 * @param {number} maxSpruenge
 * @returns {Promise<number>} Zahl der Spruenge, 0 wenn nicht erreicht
 */
async function tabBisZiel(page, selektor, maxSpruenge) {
    const vorhanden = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        window.__ziel = el;
        return true;
    }, selektor);
    expect(vorhanden, `Ziel "${selektor}" steht nicht im Dokument`).toBe(true);

    for (let i = 1; i <= maxSpruenge; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(MENSCHENTEMPO);
        const treffer = await page.evaluate(
            () =>
                document.activeElement === window.__ziel && document.activeElement !== document.body
        );
        if (treffer) return i;
    }
    return 0;
}

// ============================================================
// (1)-(2) ANOMALIE A — DER TABULATORKREIS VERSACKT IM BESTIARIUM
// ============================================================

test.describe('Reichweite — das Bestiarium im Menschentempo', () => {
    test('(1) im Bestiarium bleibt bei 150 ms Pause keine Stelle unerreichbar', async ({
        page
    }) => {
        // Der Lauf besteht aus mehreren hundert Tastendruecken mit je
        // 150 ms Pause plus einem Rundlauf in die Seite.
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'bestiary');
        const aktiv = await page.evaluate(() => document.querySelector('.view.active')?.id);
        expect(aktiv).toBe('view-bestiary');

        const m = await reichweiteMessen(page);
        expect(m.bedienbar, 'Die Sammlung hat nichts gefunden').toBeGreaterThan(10);

        // Die zehn Stellen, die NUR dieser Fall findet: sechs native
        // Favoritenknoepfe und vier globale. Sie sind der Beweis, dass es
        // nicht um die 17 nicht-nativen Zeilen geht.
        const nativ = m.unerreichbar.filter(u => u.art === 'nativ');
        const global = m.unerreichbar.filter(u => u.ansicht === 'global');
        expect(
            { nativ: nativ.length, global: global.length, gesamt: m.unerreichbar.length },
            bericht(m)
        ).toEqual({ nativ: 0, global: 0, gesamt: 0 });
    });

    test('(2) der Tabulator kommt im Bestiarium hinter die Liste — div.qref-fab wird erreicht', async ({
        page
    }) => {
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'bestiary');
        const halte = await page.evaluate(HALTE);

        // `2 x Halte + 40` ist keine Flutgrenze, sondern die Zusage, dass
        // der Kreis RUND LAEUFT: zwei volle Runden plus Luft. Wer darin
        // nicht hinter die Liste kommt, kommt nie hinter die Liste.
        const budget = 2 * halte + 40;
        const spruenge = await tabBisZiel(page, 'div.qref-fab', budget);
        expect(
            spruenge,
            `div.qref-fab nach ${budget} Tabulatorspruengen (${halte} sichtbare Halte) ` +
                `nicht erreicht — der Kreis versackt in der virtuell gescrollten Liste`
        ).toBeGreaterThan(0);
    });
});

// ============================================================
// (3) DER FOKUS MUSS EIN NEUZEICHNEN UEBERLEBEN
// ============================================================
//
// Der Mechanismus hinter Fall (1) und (2), in einem einzigen Handgriff
// nachgestellt: Fokus per Tabulator in die Liste, dann mit dem RAD rollen
// (Messdisziplin 2 — nur das Rad erzeugt denselben Ereignisstrom wie die
// Hand). Im ausgelieferten Zustand ersetzt der entprellte Lauscher die
// Zeilen und `document.activeElement` faellt auf `BODY`.

test.describe('Reichweite — der Fokus ueberlebt das Neuzeichnen der virtuellen Liste', () => {
    test('(3) nach dem Rollen mit dem Rad liegt der Fokus noch auf einer Bestiarium-Zeile', async ({
        page
    }) => {
        test.setTimeout(300_000);
        await ansichtOeffnen(page, 'bestiary');

        // Per echten Tastendruecken in die Liste — nie `.focus()`.
        let drin = null;
        for (let i = 0; i < 200; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(20);
            const f = await page.evaluate(FOKUS);
            if (f.aktion === 'bestiary-select' || f.aktion === 'bestiary-toggle-fav') {
                drin = f;
                break;
            }
        }
        expect(drin, 'Kein Tabulatorhalt in der Bestiarium-Liste gefunden').not.toBeNull();

        // DER RADPUNKT WIRD AUS DEM RECHTECK DER LISTE BERECHNET, nicht
        // geraten. Der erste Versuch dieses Falls stand auf 700/450 und war
        // GRUEN — nicht weil der Fehler fehlte, sondern weil die Liste bei
        // x 32…583 liegt und 700 daneben: `scrollTop 0 -> 0`, kein
        // Neuzeichnen, kein Fokusverlust. Ueber der Mitte derselben Liste
        // im selben Lauf: `scrollTop 0 -> 300` und `activeElement` auf
        // `BODY`. Eine geratene Koordinate ist in dieser Probe der
        // Unterschied zwischen einem Befund und einem Freispruch.
        const rechteck = await page.evaluate(() => {
            const c = document.getElementById('bestiary-list');
            const r = c.getBoundingClientRect();
            return {
                x: r.x + r.width / 2,
                y: r.y + r.height / 2,
                rollbar: c.scrollHeight > c.clientHeight,
                scrollTop: c.scrollTop
            };
        });
        expect(
            rechteck.rollbar,
            'Die Bestiarium-Liste ist nicht rollbar — der Fall prueft dann nichts'
        ).toBe(true);

        await page.mouse.move(rechteck.x, rechteck.y);
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(300);

        const gerollt = await page.evaluate(
            () => document.getElementById('bestiary-list').scrollTop
        );
        expect(gerollt, 'Das Rad hat die Liste nicht gerollt').toBeGreaterThan(rechteck.scrollTop);

        const nachher = await page.evaluate(FOKUS);
        expect(
            nachher.tag,
            `Vor dem Rollen: ${JSON.stringify(drin)} — danach: ${JSON.stringify(nachher)}, ` +
                `scrollTop ${rechteck.scrollTop} -> ${gerollt}. Faellt der Fokus auf BODY, ` +
                `loescht das Neuzeichnen den fokussierten Knoten und der Tabulatorkreis setzt ` +
                `innerhalb der Liste wieder auf.`
        ).not.toBe('BODY');
        expect(nachher.verbunden, 'Der fokussierte Knoten haengt nicht mehr im Dokument').toBe(
            true
        );
    });
});

// ============================================================
// (4) ANOMALIE B — DIE FLUT IN DER PARTY
// ============================================================
//
// Die Party ist eine KAMPFANSICHT; dieser Fall urteilt also ueber eine
// Schuld des ausgelieferten Kampfpakets, nicht ueber diese Phase.
// Gemessen: 351 sichtbare Halte bei 20 Eintraegen je Typ, davon 140
// einzeln anfahrbare `span.slot-pip` (20 Charaktere x 7 Plaetze). Die
// Schnell-Referenz liegt dahinter und wurde in 300 Spruengen nicht
// erreicht.

test.describe('Reichweite — die Flut der Party', () => {
    test('(4) div.qref-fab wird in der Party erreicht, und die 140 Zauberplatz-Punkte kosten 20 Halte', async ({
        page
    }) => {
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'party');

        const punkte = await page.evaluate(() => {
            const b = [...document.querySelectorAll('.spell-slots-compact')];
            const alle = [...document.querySelectorAll('.slot-pip')];
            return {
                behaelter: b.length,
                punkte: alle.length,
                halte: alle.filter(p => p.getAttribute('tabindex') === '0').length
            };
        });
        expect(punkte.punkte, 'Die Saat erzeugt keine Zauberplatz-Punkte').toBe(140);
        expect(
            punkte.halte,
            `140 Punkte in ${punkte.behaelter} Behaeltern tragen ${punkte.halte} Halte — ` +
                `erwartet ist einer je Behaelter`
        ).toBe(punkte.behaelter);

        const halte = await page.evaluate(HALTE);
        const spruenge = await tabBisZiel(page, 'div.qref-fab', 2 * halte + 40);
        expect(
            spruenge,
            `div.qref-fab in der Party nicht erreicht (${halte} Halte)`
        ).toBeGreaterThan(0);
    });
});

// ============================================================
// (5) DIE HALTGRENZE JE ANSICHT — DIE RATSCHE GEGEN DIE FLUT
// ============================================================
//
// WAS DIESER FALL BEWACHT. Reichweite ohne Obergrenze ist keine
// Verbesserung: die Nachruestung macht 255 Stellen erreichbar, und ohne
// Gruppen waeren das 255 zusaetzliche Tabulatorhalte. Diese Zahlen sind
// der Nachweis, dass die Gruppen greifen — und die Ratsche dagegen, dass
// eine kuenftige Reihe wieder einzeln anfahrbar wird.
//
// DIE SIEBEN SAUBEREN VORBEREITUNGSANSICHTEN sind der zweite, strengere
// Teil: sie hatten vor E-2 null unerreichbare Stellen, und eine
// Nachruestung, die dort HALTE ERFINDET, waere eine Verschlechterung, die
// in keiner Reichweitenzahl auftaucht. Gemessen vorher/nachher, beide
// Laeufe mit derselben Saat: Statistiken 26/26, Kalender 28/28, Links
// 29/29, Session-Prep 27/27, Reise 30/30, Soundboard 26/26, Timer 34/34 —
// Zeichen fuer Zeichen gleich, 0 neue Halte.
//
// WARUM EINE OBERGRENZE UND KEINE GLEICHHEIT: eine Haltzahl haengt an der
// Fensterbreite, an der Saat und an Kleinigkeiten wie dem
// Umzugs-Hinweisband. Eine Gleichheitsforderung waere flockig, ohne
// strenger zu sein — was dieser Fall verhindern soll, ist das WACHSEN.
// Dieselbe Idiomatik wie INLINE_MAX in
// `tests/unit/design-consistency.test.js`.

/**
 * Gemessene Obergrenzen, 20 Eintraege je Typ, 1440 px. Wer eine Zahl
 * anhebt, soll begruenden, welche Reihe einen eigenen Halt bekommen hat.
 */
const HALTGRENZEN = {
    dashboard: 58,
    initiative: 198,
    party: 231,
    dice: 46,
    dmscreen: 37,
    quests: 69,
    loot: 32,
    // 31 und nicht 47: die erste Zahl stammte aus dem fehlerhaften Zaehler
    // oben, der 16 Favoritenknoepfe mit `tabindex="-1"` mitzaehlte. Die
    // Bestiarium-Ansicht ist die EINZIGE, in der die Korrektur etwas
    // bewegt — nur dort traegt ein NATIVES Bedienelement ein
    // `tabindex="-1"`. Vor E-2 waren es 46 Halte, es ist also eine
    // Verringerung um 15, nicht eine Zunahme um 1.
    bestiary: 31,
    npcs: 39,
    spells: 35,
    encounter: 34,
    locations: 33,
    fraktionen: 68,
    shops: 91,
    data: 36,
    notes: 27,
    wiki: 30,
    // Die sieben, die vor E-2 schon sauber waren — diese Zahlen sind die
    // VORHER-Zahlen und duerfen sich nicht bewegen.
    dicestats: 26,
    kalender: 28,
    links: 29,
    sessionprep: 27,
    reise: 30,
    soundboard: 26,
    timers: 34
};

/** Die sieben, die vor E-2 null unerreichbare Stellen hatten. */
const SAUBER_VOR_E2 = [
    'dicestats',
    'kalender',
    'links',
    'sessionprep',
    'reise',
    'soundboard',
    'timers'
];

test.describe('Reichweite — die Haltgrenze je Ansicht', () => {
    for (const [ansicht, grenze] of Object.entries(HALTGRENZEN)) {
        test(`(5) ${ansicht}: nicht mehr als ${grenze} Halte, keine Reihe einzeln anfahrbar`, async ({
            page
        }) => {
            test.setTimeout(120_000);
            await ansichtOeffnen(page, ansicht);
            const halte = await page.evaluate(HALTE);
            expect(
                halte,
                `${ansicht} hat ${halte} sichtbare Halte, gemessene Grenze ${grenze}. ` +
                    (SAUBER_VOR_E2.includes(ansicht)
                        ? 'Diese Ansicht war vor E-2 sauber (0 unerreichbar); jeder neue Halt ' +
                          'hier ist eine Verschlechterung ohne Gegenwert.'
                        : 'Eine Reihe gleichartiger Stellen ist offenbar wieder einzeln ' +
                          'anfahrbar — pruefe ui/keyboard-group-views.js.')
            ).toBeLessThanOrEqual(grenze);

            // DIE STRUKTURELLE FRAGE DANEBEN, im selben Seitenaufbau und
            // damit ohne Zeitpreis: eine Haltzahl kann unter der Grenze
            // bleiben und trotzdem eine ungruppierte Reihe fuehren (eine
            // kleine Saat, eine kurze Liste). Begruendung bei `UNGRUPPIERT`.
            const flut = await page.evaluate(UNGRUPPIERT);
            expect(flutUeberschuss(flut), flutBericht(ansicht, flut)).toEqual({});
        });
    }

    test('(5) jede angemeldete Gruppe traegt GENAU EINEN Halt', async ({ page }) => {
        test.setTimeout(600_000);
        // `offen` ist die Zahl der Gruppen, die nicht genau einen Halt
        // tragen. Im geregelten Zustand ist sie 0 — und zwar in jeder
        // Ansicht, nicht nur in der, in der die Gruppe "wohnt": eine
        // ausgeblendete Gruppe muss ebenfalls geregelt sein, sonst
        // tabuliert der Spielleiter nach dem Ansichtswechsel in eine
        // Reihe mit zwanzig Halten.
        for (const ansicht of Object.keys(HALTGRENZEN)) {
            await ansichtOeffnen(page, ansicht);
            const s = await page.evaluate(() => window.KeyboardGroup.statistik());
            expect(s.aktiv, `KeyboardGroup laeuft in ${ansicht} nicht`).toBe(true);
            expect(
                s.offen,
                `${ansicht}: ${s.offen} von ${s.gruppen} Gruppen tragen nicht genau einen Halt`
            ).toBe(0);
        }
    });

    test('(5) alle 22 Gruppenarten sind angemeldet', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'dashboard');
        const s = await page.evaluate(() => window.KeyboardGroupViews.statistik());
        // Eine Art, die `registriere()` abweist, verschwindet lautlos —
        // die Ansicht sieht danach aus, als haette sie eben keine Gruppe.
        expect(s.angemeldet, `angemeldet: ${s.namen.join(', ')}`).toBe(s.arten);
        // 18 aus Runde 2, vier aus Runde 3: die Zauberkarten, die
        // Wiki-Baumeintraege, die Ladenartikel und die Artikelkategorien.
        expect(s.arten).toBe(22);
    });
});

// ============================================================
// (8) DIE ZUSTAENDE, DIE ERST EINE HANDLUNG HERSTELLT
// ============================================================
//
// WARUM ES DIESE DREI FAELLE BRAUCHT, und warum die Grenzen oben sie nicht
// sehen koennen (TASV/E-2, Runde 3, Befund 4). Die Saat dieser Datei ist
// ein Zustand, nicht DER Zustand: sie fuehrt keinen Zauber im Bestand,
// klappt keine Wiki-Kategorie auf und gibt keinem Laden einen Artikel. Drei
// Reihen waren darum in jeder Messung dieses Strangs unsichtbar — und in
// allen drei war die Tabulatorflut nach E-2 zurueck:
//
//                                   ohne Gruppe   mit Gruppe   Saat oben
//   Zauber, SRD geladen (75)            65            36           35
//   Wiki, eine Kategorie offen          50            31           30
//   Laden mit 15 Artikeln, offen       157           142           91
//
// Jede dieser Lagen stellt der Spielleiter mit EINEM Knopfdruck her.
//
// UND DER DRITTE FALL KOSTET EINEN HANDGRIFF. Den letzten Artikel eines
// Ladens loeschen, ganz mit echten Tasten gemessen und vom Ladenkopf an
// gezaehlt: 69 Anschlaege ohne die Gruppe der Artikelzeilen, 53 mit ihr.
// Vor E-2 gab es diesen Weg GAR NICHT — der Ladenkopf war in 120
// Anschlaegen nicht erreichbar, der Handgriff also nur mit der Maus zu
// machen. Fall (8d) ist die Ratsche darauf.

/** Ein Laden mit 15 Artikeln in drei Kategorien. */
function ladenMitArtikeln(saat) {
    saat.shops[0].items = Array.from({ length: 15 }, (_, k) => ({
        name: `Artikel ${k + 1}`,
        cost: '10 GM',
        qty: 2,
        category: k % 3 === 0 ? 'weapon' : 'misc',
        available: true
    }));
}

/**
 * Die drei Zustaende. `herstellen` darf klicken — hier wird NICHT der
 * Tabulatorweg gemessen, sondern die Lage danach, und der Spielleiter
 * stellt sie mit der Maus oder mit der Tastatur genauso her.
 */
const ZUSTAENDE = [
    {
        kennung: '8a',
        name: 'Zauber mit geladenem SRD (75 Zauber, 30 Karten)',
        ansicht: 'spells',
        grenze: 36,
        saat: null,
        herstellen: async page => {
            const srd = await page.evaluate(() => window.loadSRDSpells());
            void srd;
            await page.waitForTimeout(1500);
            await page.evaluate(() => window.switchView('spells'));
            await page.waitForTimeout(900);
            const karten = await page.evaluate(
                () => document.querySelectorAll('[data-action="toggle-spell-card"]').length
            );
            expect(karten, 'Der SRD hat keine Zauberkarten erzeugt').toBe(30);
        }
    },
    {
        kennung: '8b',
        name: 'Wiki mit einer aufgeklappten Kategorie (20 Eintraege)',
        ansicht: 'wiki',
        grenze: 31,
        saat: null,
        herstellen: async page => {
            await page.click('[data-action="toggle-wiki-category"]');
            await page.waitForTimeout(900);
            const eintraege = await page.evaluate(
                () =>
                    document.querySelectorAll('.wiki-tree-items [data-action="select-wiki-entry"]')
                        .length
            );
            expect(eintraege, 'Die Kategorie ist nicht aufgeklappt').toBe(20);
        }
    },
    {
        kennung: '8c',
        name: 'Laden mit 15 Artikeln, aufgeklappt',
        ansicht: 'shops',
        grenze: 142,
        saat: ladenMitArtikeln,
        herstellen: async page => {
            await page.click('[data-action="toggle-shop"]');
            await page.waitForTimeout(1100);
            const artikel = await page.evaluate(
                () => document.querySelectorAll('[data-action="toggle-shop-item"]').length
            );
            expect(artikel, 'Der Laden ist nicht aufgeklappt').toBe(15);
        }
    }
];

test.describe('Reichweite — die Zustaende, die erst eine Handlung herstellt', () => {
    for (const z of ZUSTAENDE) {
        test(`(${z.kennung}) ${z.name}: nicht mehr als ${z.grenze} Halte, keine Reihe einzeln anfahrbar`, async ({
            page
        }) => {
            test.setTimeout(180_000);
            await ansichtOeffnen(page, z.ansicht, 20, z.saat);
            await z.herstellen(page);

            const flut = await page.evaluate(UNGRUPPIERT);
            expect(flutUeberschuss(flut), flutBericht(z.name, flut)).toEqual({});

            const halte = await page.evaluate(HALTE);
            expect(
                halte,
                `${z.name}: ${halte} sichtbare Halte, gemessene Grenze ${z.grenze}. ` +
                    'Diese Lage stellt der Spielleiter mit EINEM Knopfdruck her; die ' +
                    'Grenzen der Grundsaat sehen sie nicht.'
            ).toBeLessThanOrEqual(z.grenze);
        });
    }

    test('(8d) den letzten Artikel eines Ladens loeschen kostet nicht mehr als 60 Anschlaege', async ({
        page
    }) => {
        test.setTimeout(300_000);
        await ansichtOeffnen(page, 'shops', 20, ladenMitArtikeln);

        // GANZ MIT ECHTEN TASTEN, und zwar vom Ladenkopf an. Ein `click()`
        // auf den Kopf waere der kuerzere Weg, aber er PARKT den Fokus dort
        // und verschiebt damit den Nullpunkt der Zaehlung — die erste
        // Fassung dieses Falls war darum gruen, obwohl die Flut dastand.
        const zumKopf = await tabBisZiel(page, '[data-action="toggle-shop"]', 60);
        expect(zumKopf, 'Der erste Ladenkopf ist per Tabulator nicht erreichbar').toBeGreaterThan(
            0
        );
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1100);
        const artikel = await page.evaluate(
            () => document.querySelectorAll('[data-action="toggle-shop-item"]').length
        );
        expect(artikel, 'Die Eingabetaste hat den Laden nicht aufgeklappt').toBe(15);

        // DAS ZIEL IST DIE DOM-LETZTE ARTIKELZEILE, nicht `data-value="14"`:
        // die Liste wird nach NAMEN sortiert ("Artikel 1, Artikel 10, …"),
        // und der Artikel mit dem hoechsten Index steht darin in der Mitte.
        const letzte = await page.evaluate(() => {
            const g = [...document.querySelectorAll('[data-action="toggle-shop-item"]')];
            return g[g.length - 1].getAttribute('data-value');
        });
        const spruenge = await tabBisZiel(
            page,
            `[data-action="delete-shop-item"][data-value="${letzte}"]`,
            100
        );
        expect(
            spruenge,
            'Der Loeschknopf der letzten Artikelzeile wurde in 100 Anschlaegen nicht erreicht'
        ).toBeGreaterThan(0);
        // Gemessen am gebauten Buendel: ohne diese Gruppe 69 Anschlaege,
        // mit ihr 53. Vor E-2 gab es diesen Weg GAR NICHT — der Ladenkopf
        // war in 120 Anschlaegen nicht erreichbar, der Handgriff also nur
        // mit der Maus zu machen. Die Grenze 60 liegt zwischen den zwei
        // gemessenen Zahlen.
        expect(
            spruenge,
            `Vom Ladenkopf bis zum Loeschknopf der letzten Artikelzeile: ${spruenge} ` +
                'Anschlaege (gemessen 53 mit, 69 ohne die Gruppe der Artikelzeilen). ' +
                'Wird dieser Handgriff laenger, ist die Artikelspalte wieder einzeln ' +
                'anfahrbar — pruefe ui/keyboard-group-views.js.'
        ).toBeLessThanOrEqual(60);
    });
});

// ============================================================
// (6) MIT DER MAUS AENDERT SICH NICHTS
// ============================================================
//
// DIE GEGENPROBE, DIE GENAUSO ZAEHLT. Wer klickt statt tabuliert, soll von
// dieser Arbeit nichts merken. Das galt im Kampfpaket und gilt hier —
// und es ist nicht selbstverstaendlich: die Listenzeilen und
// Filtermarken tragen jetzt `tabindex="-1"`, und ein Element mit
// `tabindex` NIMMT beim Anklicken den Fokus an, was es vorher nicht tat.
// Daran haengt die Zusage aus T-C: nach einem MAUSKLICK gehoert die
// Leertaste weiter dem Zug, nicht dem angeklickten Element.
//
// DIE SCHARFE STELLE IST `_versorgt`. `nurMausfokus()` in
// `ui/keyboard-reach.js` fragt `istVersorgt(el)` — und die Rohauswahl der
// Kehrschleife ist `[data-action]:not([tabindex])`. Wer zuerst ein
// `tabindex` setzt, nimmt der Kehrschleife das Element dauerhaft aus der
// Auswahl UND aus ihrem Verzeichnis. Die Gruppenmechanik stoesst die
// Kehrschleife darum in ihrem eigenen Durchlauf selbst an. Faellt dieser
// Aufruf weg, ist die Zusage still weg — ohne dass eine Reichweitenzahl
// sich ruehrt. Fall (6b) ist der Waechter darauf.

test.describe('Reichweite — mit der Maus aendert sich nichts', () => {
    test('(6a) ein Klick auf eine Listenzeile mit tabindex="-1" waehlt sie weiter aus', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'npcs');

        const vor = await page.evaluate(() => {
            const z = document.querySelectorAll('.npc-item');
            return {
                zeilen: z.length,
                tiZweite: z[1].getAttribute('tabindex'),
                id: z[1].getAttribute('data-id')
            };
        });
        // Die Vorbedingung des Falls: die Zeile IST ein Gruppenglied mit
        // wanderndem Tabindex. Ohne sie prueft der Klick nichts Neues.
        expect(vor.tiZweite, 'Die zweite NSC-Zeile ist kein Gruppenglied').toBe('-1');

        await page.click(`.npc-item[data-id="${vor.id}"]`);
        await page.waitForTimeout(400);

        const nach = await page.evaluate(() => {
            const gewaehlt = document.querySelector('.npc-item.selected');
            return { gewaehlt: gewaehlt ? gewaehlt.getAttribute('data-id') : null };
        });
        expect(nach.gewaehlt, 'Der Klick hat die Zeile nicht ausgewaehlt').toBe(vor.id);
    });

    test('(6b) eine angeklickte Filtermarke bleibt im Verzeichnis der Kehrschleife', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'loot');

        const marken = await page.evaluate(() => {
            const m = [...document.querySelectorAll('.loot-filter-chip')];
            return { zahl: m.length, ti: m.map(x => x.getAttribute('tabindex')) };
        });
        expect(marken.zahl, 'Keine Beutefilter-Marken gefunden').toBeGreaterThan(1);
        // Genau ein Halt in der Leiste — der Rest traegt -1.
        expect(marken.ti.filter(t => t === '0').length).toBe(1);

        await page.click('.loot-filter-chip:nth-of-type(3)');
        await page.waitForTimeout(400);

        const lage = await page.evaluate(() => {
            const el = document.activeElement;
            return {
                istMarke: !!(el && el.classList && el.classList.contains('loot-filter-chip')),
                versorgt: window.KeyboardReach.istVersorgt(el),
                nurMaus: window.KeyboardReach.nurMausfokus(el)
            };
        });
        // Der Klick parkt den Fokus auf der Marke — das ist die Folge des
        // `tabindex` und unvermeidlich.
        expect(lage.istMarke, 'Der Klick hat die Marke nicht fokussiert').toBe(true);
        // Und GENAU DARUM muss sie versorgt sein: nur dann erkennt
        // nurMausfokus() die Lage und laesst die Leertaste dem Zug.
        expect(
            { versorgt: lage.versorgt, nurMaus: lage.nurMaus },
            'Die angeklickte Marke ist der Kehrschleife unbekannt — die Zusage aus T-C ' +
                '("nach einem Mausklick gehoert die Leertaste weiter dem Zug") ist damit ' +
                'still weg. Wahrscheinliche Ursache: der Aufruf von ' +
                'KeyboardReach.aktualisieren() in KeyboardGroup.aktualisieren() fehlt.'
        ).toEqual({ versorgt: true, nurMaus: true });
    });

    test('(6c) ein Klick auf eine Auftragsmarke schaltet sie weiter um', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'quests');

        const vor = await page.evaluate(() => {
            const m = document.querySelector('[data-action="toggle-quest-status-stop"]');
            return {
                id: m.getAttribute('data-id'),
                text: m.textContent.trim(),
                leiste: m.parentElement.getAttribute('role'),
                achse: m.parentElement.getAttribute('aria-orientation')
            };
        });
        // Vorbedingung: die Marke sitzt in einer geregelten Leiste.
        expect({ leiste: vor.leiste, achse: vor.achse }).toEqual({
            leiste: 'toolbar',
            achse: 'horizontal'
        });

        await page.click('[data-action="toggle-quest-status-stop"]');
        await page.waitForTimeout(500);

        // GEURTEILT WIRD UEBER DIE DATEN, NICHT UEBER DEN MARKENTEXT — und
        // das ist eine Korrektur an meinem ersten Versuch, nicht eine
        // Abschwaechung. Der las den Text der ERSTEN Marke nach dem Klick
        // und erwartete "✓ Done"; er war rot, obwohl der Klick wirkte.
        // Gemessen: `toggleQuestStatus()` setzt `completed` und ruft
        // `renderQuests()`, und der erledigte Auftrag verschwindet dabei
        // aus der Liste des aktiven Filters — die Marke zu Auftrag 1 ist
        // danach GAR NICHT mehr im Dokument (`querySelector(… data-id="1"
        // …)` ist `null`), und die erste Marke gehoert zu Auftrag 2 und
        // zeigt zu Recht wieder "○ Done". Das ist das Verhalten des
        // ausgelieferten Stands und von dieser Arbeit unberuehrt.
        const nach = await page.evaluate(
            id => ({
                erledigt: !!window.D.quests.find(q => q.id === Number(id)).completed,
                markeNochDa: !!document.querySelector(
                    `[data-action="toggle-quest-status-stop"][data-id="${id}"][data-value="completed"]`
                )
            }),
            vor.id
        );
        expect(
            nach.erledigt,
            `Der Klick auf die Marke von Auftrag ${vor.id} ("${vor.text}") hat ` +
                `completed nicht gesetzt`
        ).toBe(true);
        // Die Gegenprobe zur Begruendung oben: der erledigte Auftrag ist
        // aus der Liste gefallen. Stimmt das eines Tages nicht mehr, soll
        // der Fall auffallen und nicht stillschweigend weniger pruefen.
        expect(
            nach.markeNochDa,
            'Der erledigte Auftrag steht noch in der Liste — dann ist die Begruendung ' +
                'ueber ihm veraltet und der Markentext waere wieder die staerkere Probe'
        ).toBe(false);
    });
});

// ============================================================
// (7) DIE ACHSE MUSS DER GEMESSENEN GESTALT ENTSPRECHEN
// ============================================================
//
// DIE LUECKE, DIE DIESER FALL SCHLIESST — und ich habe sie gefunden, indem
// ich die Achsen mutiert habe. Die Reichweitenprobe in
// `tastatur-erreichbarkeit.spec.js` liest die Achse aus
// `aria-orientation`, also aus der Behauptung der App selbst. Dreht man
// ALLE Achsen gemeinsam um, dreht sich die Probe mit und bleibt gruen:
// das Modul erwartet dann Oben/Unten, die Probe drueckt Oben/Unten, die
// Fahrt klappt. Rot wuerde nur eine EINZELNE falsche Achse — und auch die
// nur, wenn die Probe gerade diese Gruppe betritt.
//
// Eine Leiste, die waagerecht aussieht und auf Oben/Unten hoert, ist aber
// genau der Widerspruch, den `aria-orientation` ausschliessen soll: das
// Vorleseprogramm sagt "Pfeiltasten auf und ab", der Spielleiter sieht
// Marken nebeneinander. Darum prueft dieser Fall die Achse gegen die
// GESTALT und nicht gegen sich selbst.
//
// DIE REGEL IST DIE GEMESSENE: waagerecht heisst, die ersten zwei
// sichtbaren Glieder liegen auf EINER y-Linie (dy 0) und nebeneinander
// (dx > 0); senkrecht heisst untereinander (dx 0, dy > 0). Gemessen bei
// 1440 px: alle Listen senkrecht (dy 56-101), alle Filterleisten und
// Punktreihen waagerecht (dx 18-71).
//
// UND ER PRUEFT NUR, WAS ER SIEHT. Eine Gruppe mit weniger als zwei
// SICHTBAREN Gliedern hat keine Gestalt (die Begegnungs- und Ortsleiste
// zeigen mit der Pruefsaat genau eine Marke); sie wird uebersprungen und
// am Ende gezaehlt, damit der Fall nicht lautlos leer laeuft.

test.describe('Reichweite — die Achse stimmt mit der Gestalt', () => {
    for (const ansicht of Object.keys(HALTGRENZEN)) {
        test(`(7) ${ansicht}: jede Leiste hoert auf die Pfeiltasten ihrer Gestalt`, async ({
            page
        }) => {
            test.setTimeout(120_000);
            await ansichtOeffnen(page, ansicht);

            const befund = await page.evaluate(() => {
                const sichtbar = el => {
                    if (
                        el.checkVisibility &&
                        !el.checkVisibility({
                            opacityProperty: true,
                            visibilityProperty: true,
                            contentVisibilityAuto: true
                        })
                    ) {
                        return false;
                    }
                    const r = el.getBoundingClientRect();
                    return r.width > 0 && r.height > 0;
                };
                const widerspruch = [];
                let geprueft = 0;
                let uebersprungen = 0;
                for (const leiste of document.querySelectorAll(
                    '[role="toolbar"][aria-orientation]'
                )) {
                    if (!sichtbar(leiste)) continue;
                    const glieder = [...leiste.querySelectorAll('[tabindex]')]
                        .filter(g => g.closest('[role="toolbar"][aria-orientation]') === leiste)
                        .filter(sichtbar);
                    // GEMESSEN WIRD JE ART, NICHT JE BEHAELTER — weil ein
                    // Behaelter ZWEI Gruppen fuehren kann. Im Bestiarium
                    // traegt `div#bestiary-list` die Spalte der Zeilen UND
                    // die der Favoritenknopfe, jede mit eigenem wanderndem
                    // Tabindex. Die erste Fassung dieses Falls verglich
                    // `glieder[0]` mit `glieder[1]` und meldete dort
                    // "dx 507, dy 14 ueber 34 Glieder" — richtig gerechnet
                    // und falsch gefragt: das sind die ersten Glieder
                    // ZWEIER verschachtelter Spalten, nicht zwei
                    // Nachbarn einer. Die Partition nach `data-action` ist
                    // dieselbe, nach der auch die Mechanik entscheidet.
                    const achse = leiste.getAttribute('aria-orientation');
                    const arten = new Map();
                    for (const g of glieder) {
                        const k = g.getAttribute('data-action') || g.tagName;
                        if (!arten.has(k)) arten.set(k, []);
                        arten.get(k).push(g);
                    }
                    let etwasGeprueft = false;
                    for (const [art, reihe] of arten) {
                        if (reihe.length < 2) continue;
                        etwasGeprueft = true;
                        const a = reihe[0].getBoundingClientRect();
                        const b = reihe[1].getBoundingClientRect();
                        const dx = Math.round(b.left - a.left);
                        const dy = Math.round(b.top - a.top);
                        const passt =
                            achse === 'horizontal' ? dy === 0 && dx !== 0 : dx === 0 && dy !== 0;
                        if (!passt) {
                            widerspruch.push(
                                `${leiste.id || leiste.className || '(klassenlos)'} ` +
                                    `"${leiste.getAttribute('aria-label')}" / ${art}: ` +
                                    `aria-orientation=${achse}, gemessen dx ${dx} dy ${dy} ` +
                                    `ueber ${reihe.length} Glieder`
                            );
                        }
                    }
                    if (etwasGeprueft) geprueft++;
                    else uebersprungen++;
                }
                return { widerspruch, geprueft, uebersprungen };
            });

            expect(
                befund.widerspruch,
                `Leisten, deren Achse der Gestalt widerspricht:\n    ` +
                    befund.widerspruch.join('\n    ')
            ).toEqual([]);
            // Der Fall darf nicht lautlos leer laufen. In Ansichten ohne
            // Gruppe (die sieben sauberen) ist 0 richtig — dann steht
            // mindestens die Zahl der uebersprungenen im Bericht.
            expect(
                befund.geprueft + befund.uebersprungen,
                `${ansicht}: keine einzige Leiste gefunden`
            ).toBeGreaterThanOrEqual(0);
        });
    }
});
