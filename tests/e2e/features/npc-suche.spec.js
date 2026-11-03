// @ts-check
/**
 * Die Suche der NPC- und der Ortsansicht findet ueber ODER (NPC-SUCHE)
 * ===================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT: **ein NPC verschwindet nicht aus der Suche
 * seiner Ansicht, weil er Dialoge hat** — wer "Anna" tippt, findet Anna, auch
 * wenn sie einen Dialog fuehrt; ein Wort, das nur in einem ihrer Dialoge steht,
 * findet sie ebenso; und die Ortsansicht findet einen Ort ueber den Namen
 * eines NPC, der dort steht.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen von Messung und Gegenpruefung (Sonden, nicht eingecheckt) an main
 * 71dd26b6 und am Stand b1fc7da6 (PR #22 NPC-NAME), Chromium, dev- und
 * Produktionsbuendel, 1440x900 und 390x844, echte Klicks und Tasten im
 * Suchfeld; mit dieser Datei nachgemessen (DER ROTE LAUF, unten). Vor dem Fix:
 *
 *   - "Anna", "Zora", "Händlerin" ergeben "Keine Treffer"; "Wirt", "Mensch",
 *     "Taverne" zeigen Olaf, nicht Anna. Ein NPC mit Dialogen erscheint nur,
 *     wenn der Begriff in einem Feld UND in einem Dialog steht ("Kira",
 *     "Jägerin" sind darum richtig, ebenso jeder NPC ohne Dialog).
 *   - Ein Wort, das nur im Dialog steht ("Goldenen", "Süden"), findet nie etwas.
 *   - Ein NPC mit textlosem Dialog (`text: ''` oder ohne `text`) ist fuer JEDEN
 *     Begriff unsichtbar, auch fuer seinen Namen.
 *   - "Anna " mit Leerzeichen am Rand findet nichts; "   " zeigt nur die NPCs
 *     ohne Dialog, und in einer leeren Ansicht "Keine Treffer" statt "Keine
 *     NPCs".
 *   - Wer einem NPC ueber das Formular oder ueber den Schnell-Dialog "+" im
 *     Detail einen Dialog gibt, laesst ihn damit aus der Suche fallen.
 *   - Die Ortssuche findet keinen Ort ueber den Namen eines NPC, der dort steht.
 *   - An Altdaten-Dialogen (`dialogs` als Text oder Objekt, `[null, …]`, `text`
 *     als Zahl) wirft der Filter je Taste, und die Liste bleibt veraltet stehen.
 *
 * Kopf- und Telefonsuche sind NICHT betroffen: sie suchen ueber
 * fuzzySearchFields() mit eigenem ODER, nicht ueber applyFilters().
 *
 * DIE URSACHE (Zeilen am Stand b1fc7da6): applyFilters()
 * (utils/filter-engine.js) verknuepft alles mit UND; `if (!matchesSearch)
 * return false;` (Z. 41) wirft jeden Eintrag ohne Feldtreffer hinaus, BEVOR
 * `customFilter` laeuft (Z. 62) — customFilter kann den Treffersatz nur
 * verkleinern. renderNPCList() (features/npcs/npc-render.js, Z. 116–122)
 * benutzt ihn als Erweiterung ("Also search in dialog texts") und gibt fuer
 * einen NPC mit Dialogen NUR das Ergebnis der Dialogsuche zurueck — Feld UND
 * Dialog. Den Begriff liest es ungetrimmt (Z. 108), applyFilters trimmt.
 * renderLocations() (features/locations/locations-render.js, Z. 120–124) hat
 * `if (npcLocs && npcLocs.has(l.id)) return true; return true;` — das tut
 * nichts. Beides eingefuehrt in 73d3193b (13.01.2026, "Comprehensive code
 * reorganization"). Davor war die NPC-Suche ein einziges ODER ueber name,
 * role, race, description und den Dialogtext, die Ortssuche ein ODER mit dem
 * Namen eines NPC am Ort.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag NPC-SUCHE), und welcher Fall welche prueft
 *
 *   R1  NPC-Ansicht: ein NPC erscheint, wenn der getrimmte, kleingeschriebene
 *       Begriff in name ODER role ODER race ODER description steht (roh
 *       verglichen, wie bisher) ODER im Text eines seiner Dialoge. Ortschip
 *       bleibt UND. Ein leerer Begriff oder einer nur aus Leerzeichen zeigt
 *       alle.                       W1, W1t, W3, W4, W5, W6f, W6q; W8 Kontrollen
 *   R2  applyFilters() bekommt `searchAlso(item, search)`: ODER zum
 *       Feldvergleich, mit dem getrimmten Begriff, nur bei nicht leerem
 *       Begriff; filters und customFilter bleiben UND.
 *                                  tests/unit/filter-engine.test.js; hier W5
 *   R3  Totalitaet: die Dialogsuche wirft nie — `dialogs` kein Array, Elemente
 *       `null` oder kein Objekt, `text` kein Text.                        W9a
 *   R4  Sichtbarer Text: der Dialog wird vor dem Vergleich Text — Tags fallen
 *       weg, &amp; &nbsp; &lt; &gt; dekodiert, <br>, div, p und li werden ein
 *       Leerzeichen, Leerraum wird zusammengefasst; ueber einen EIGENEN
 *       Such-Normalisierer, stripHtml() bleibt unveraendert. Dazu die Zellen
 *       td und th (Nachbesserung, siehe unten): die App schreibt Tabellen
 *       selbst in einen Dialog, und ihre Zellen stehen sichtbar getrennt.
 *                                     W2, W2t, W9 (kein Markup-Treffer), W10f,
 *                                     W10s, W10t; W10w (Tags fallen weg, auch
 *                                     mitten im Wort); W10e (oeffnendes und
 *                                     schliessendes Tag je allein)
 *   R5  Ortsansicht: Ortsname ODER Beschreibung ODER ein NPC an diesem Ort,
 *       dessen Name den GETRIMMTEN Begriff enthaelt — derselbe Mechanismus,
 *       der Name total gelesen (datenText()).                         W7, W4o
 *   R6  Der Begriff wird in beiden Renderern einmal beim Lesen getrimmt:
 *       Leerzustand, Suchzweig und NPC-Orte sehen denselben Begriff.
 *                                                              W4, W4o, W4l
 *
 * Die Saat (acht NPCs, zwei Orte) traegt Dialoge in genau der Form, die
 * saveNPC() und saveQuickDialog() schreiben ({title, triggerCondition, text,
 * used}, `text` als HTML aus dem contenteditable); W6f, W6q, W10f, W10t und
 * W10w legen ihre NPCs ueber die Oberflaeche an. Die Saat geht wie in
 * npc-altdaten.spec.js ueber den Speicher und die Datengrenze; W9a prueft als
 * harte Vorbedingung, dass die Altdaten-Formen dort ankommen.
 *
 * WIE GEURTEILT WIRD: am DOM — die IDs der NPC- bzw. Ortsliste nach jedem
 * Begriff, der mit echten Tasten getippt ist (Klick, Strg+A, Ruecktaste,
 * Zeichen fuer Zeichen; die Ansicht zeichnet je Taste synchron neu), und der
 * Titel des Leerzustands. Weich je Begriff, damit ein roter Lauf JEDEN
 * falschen Begriff nennt. Dazu kein `pageerror`, kein `console.error` und keine
 * Zeile im Fehlerlog der App vom Laden an, ausser den ausdruecklich
 * erlaubten (ERLAUBT_SCHNELLDIALOG, ERLAUBT_DETAIL). Hart sind nur die
 * Vorbedingungen: getippter Wert steht im Feld, Telefon-Layout greift, Chip ist
 * aktiv, die ueber die Oberflaeche angelegten Dialoge stehen in D.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER ROTE LAUF — diese Datei am Stand b1fc7da6 (vor dem Fix), Chromium, drei
 * Worker: dev-Buendel viermal, Produktionsbuendel einmal, dazu das dev-Buendel
 * von main 71dd26b6 einmal. Jedes Mal dasselbe Bild: 15 rot, 2 gruen, 70
 * falsche Zusagen.
 *
 *   W1   rot  7  "Anna", "ANNA", "Zora", "Händlerin" -> []; "Wirt",
 *                "Mensch", "Taverne" -> nur Olaf: Feld UND Dialog
 *   W1t  rot  7  dasselbe auf dem Telefon (390x844, Layout "mobile")
 *   W2   rot  6  jedes Wort, das nur im Dialog steht -> []
 *   W2t  rot  6  dasselbe auf dem Telefon
 *   W3   rot  4  "Wilma", "Bäuerin", "Max", "Grimmig" -> []: der textlose
 *                Dialog verdeckt den NPC fuer jeden Begriff
 *   W4   rot  4  " Anna", "Anna ", " Goldenen " -> []; "   " -> nur Bert und
 *                Olaf (der Dialogzweig vergleicht ungetrimmt)
 *   W4o  rot  2  "Anna ", " Olaf" -> []; "Hafen " und "   " richtig
 *   W4l  rot  3  "   " in leerer Ansicht: "Keine Treffer" statt "Keine NPCs"
 *                bzw. "Keine Orte", kein "+ NPC erstellen"
 *   W5   rot  3  Hafen + "Anna"/"Goldenen" -> [], + "Wirt" -> nur Olaf;
 *                leer, "Zora", "Süden" richtig
 *   W6f  rot  5  Greta ueber Name, Rolle, Volk und beide Dialogwoerter -> []
 *   W6q  rot  4  Hugo vor dem Dialog gefunden (Kontrolle gruen), danach Name,
 *                Rolle, Volk und Dialogwort -> []
 *   W7   rot  4  "Anna", "Olaf", "Bert", "Zora" -> []; Kontrollen richtig
 *   W8   gruen   Kontrollen
 *   W9   gruen   kein Markup-Treffer (NPCs mit Dialog fallen dort ohnehin
 *                heraus) — der Fall waechst gegen einen falschen Fix
 *   W9a  rot  9  acht Listen falsch (veraltet stehen geblieben oder leer),
 *                dazu 52 Fehlerzeilen: "(n.dialogs || []).some is not a
 *                function", "Cannot read properties of null (reading
 *                'text')", "(d.text || "").toLowerCase is not a function"
 *                (Produktionsbuendel: dieselben 52)
 *   W10f rot  1  "Eintopf mit" -> []; "Eintopfmit" richtig []
 *   W10s rot  5  die fuenf Begriffe ueber eine Grenze -> []; die vier
 *                zusammengeklebten richtig []
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE GEGENPROBE — Fix-Skizzen AUSSERHALB des Repos: der Quellbaum von
 * b1fc7da6 (git archive), je Variante gepatcht, mit build.py gebaut; diese
 * Datei und tests/unit/filter-engine.test.js dagegen gefahren (die Unit-Datei
 * mit der gepatchten filter-engine).
 *
 *   richtig: R1–R6 (searchAlso, eigener          17/17 gruen (dev zweimal,
 *     Normalisierer, Array/Objekt/Text-Schutz,    prod einmal); Unit 12/12
 *     Trimmen beim Lesen, Ortszweig ueber npcLocs)
 *   "fix" der Messung (ODER, roh, ungeschuetzt)    rot W2, W2t, W4o, W4l, W9,
 *                                                  W9a, W10f, W10s; Unit 1
 *   "fix2" der Messung (+ Array.isArray, null-     rot W4o, W4l, W10f, W10s;
 *     Schutz, stripHtml)                           Unit 1
 *   "fix3" der Kritik (+ Ortszweig mit dem         rot W4l, W10f, W10s; Unit 1
 *     getrimmten Begriff)
 *   ohne Ortszweig                                 rot W4o, W7
 *   searchAlso schliesst Filter kurz               rot W5 ("Süden" am Hafen);
 *                                                  Unit 2
 *   Normalisierer ohne Zusammenfassen              rot W10s (auch die Block-
 *                                                  grenzen: zwei Leerzeichen)
 *   Normalisierer nur mit <br>                     rot W10s
 *   kein Trimmen beim Lesen (R6)                   rot W4o, W4l
 *   Normalisierer ohne Array/Objekt/Text-Schutz    rot W9a (112 Fehlerzeilen)
 *   Normalisierer ohne Entitaeten                  rot W2, W2t, W9, W10s
 *   searchAlso bekommt den ungetrimmten Begriff,   hier gruen (der Renderer
 *     wird bei leerem Begriff gefragt, oder          trimmt schon); Unit je 1
 *     leeres searchFields schaltet ihn ab
 *
 * "Unit 1" bei fix/fix2/fix3: der Fall "leeres searchFields mit searchAlso"
 * (dort bleibt die Bedingung `searchFields.length > 0`). Kein Fall dieser
 * Datei ist an der richtigen Skizze rot. Dass jede zurueckgenommene Regel
 * mindestens einen Fall rot macht — hier oder in
 * tests/unit/filter-engine.test.js —, stand hier schon am Kopf 3aaf8ad1 und
 * galt dort fuer vier Teile von R4 NICHT: die Pruefung fand vier Mutanten des
 * Normalisierers, die alle 17 Faelle ueberlebten (siehe DIE NACHBESSERUNG).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE NACHBESSERUNG — nach der Pruefung des Kopfes 3aaf8ad1 (Verhalten und
 * Tests, Chromium, echte Bedienung, Mutanten des Normalisierers). Jeder neue
 * Fall ist vor seinem Fix am Kopf rot gezeigt, oder — wo kein Fehler im Code
 * lag — an dem Mutanten, den er fangen soll (drei Worker, Chromium, dev).
 *
 *   W10t  Tabelle ueber Strg+Umschalt+T im Schnell-Dialog, zwei Zellen
 *         beschrieben, 💾. Am Kopf 3aaf8ad1 rot 4: "Gold Silber" und
 *         "Spalte 1 Spalte 2" -> [], "GoldSilber" und "1Spalte" -> [Tilo]
 *         (Scheintreffer) — der Normalisierer kannte td und th nicht. Am
 *         Stand b1fc7da6 rot 2: die zwei Begriffe ueber eine Zellgrenze (ein
 *         reiner Dialogtreffer fand dort ohnehin nichts).
 *   W10w  "Der Goldenen Krug" im Schnell-Dialog getippt, "Gold" per Umschalt+
 *         Pfeil markiert und ueber "B" der Blase fett gesetzt, 💾: das Tag
 *         sitzt mitten im Wort. Am Kopf gruen. Rot (2) am Mutanten "jedes
 *         uebrige Tag wird ein Leerzeichen statt zu verschwinden" ("Goldenen"
 *         -> [], "Gold enen" -> [Wanda]); W2 "Goldenen Krug" fing ihn nicht,
 *         weil dort die Tags auf Wortgrenzen sitzen und das Zusammenfassen
 *         ' ' und '' gleich macht. Am Stand b1fc7da6 rot 1 ("Goldenen").
 *   W10e  Gesaet: zwischen zwei Woertern steht nur das oeffnende ("Zeile<div>
 *         zweite", "Intro<ul><li>Punkt") oder nur das schliessende Tag
 *         ("</div>unten", "Punkt</li></ul>Schluss"). Am Kopf gruen. Rot (4)
 *         am Mutanten "nur schliessende Tags trennen" (die zwei oeffnenden
 *         Grenzen: getrennt [], zusammengeklebt Scheintreffer) und rot (4) am
 *         Mutanten "nur oeffnende Tags trennen" (die zwei schliessenden). Am
 *         Stand b1fc7da6 rot 4 (die getrennten Begriffe).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD (Vertrag, "NICHT IM PR")
 *
 * Dialogtitel, Trigger, Tags und `chapter` werden in der Ansicht nicht
 * durchsucht und wurden es nie — W8 haelt das als Kontrolle fest; sie zu
 * durchsuchen waere eine Erweiterung (Nutzerentscheidung (c)), ebenso Kopf-
 * und Telefonsuche um Dialoge oder Volk zu erweitern. Die Beschreibung wird
 * weiter als Markup verglichen ("Grimmig und" findet Max nicht); das ist
 * vorbestehend und Offen-Punkt im Katalog, darum steht dazu hier kein Fall.
 * Detail, Popup und Formular fuer Altdaten-Dialoge (NPC-NAME Offen (1)) —
 * ihre Wuerfe sind in W9a ausgenommen. Die Dialog-Vorschau im Detail, die
 * Zeilen zusammenklebt. Die Auswahl "Mehr…" (mehr als fuenf Orte) setzt
 * denselben Ortsfilter wie ein Chip und ist nicht eigens gefahren.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };
/** Telefon — breit laden, dann verkleinern (wie npc-altdaten.spec.js W15):
 *  direkt schmal geladen ist `.app-title` verborgen, und waitForAppReady()
 *  wartet auf ihn. Das Layoutprofil folgt der Fenstergroesse. */
const TELEFON = { width: 390, height: 844 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** WEICHE Zusicherungen: ein roter Lauf nennt JEDEN Begriff, der falsch
 *  liefert, nicht nur den ersten. Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

// ===========================================================================
// SAAT
// ===========================================================================

const ORTE = [
    { id: 1, name: 'Hafen', type: 'Viertel', description: '', tags: [] },
    { id: 2, name: 'Markt', type: 'Platz', description: '', tags: [] }
];

/**
 * Ein Dialog in genau der Form, die saveNPC() und saveQuickDialog() schreiben.
 * @param {string} title
 * @param {string} triggerCondition
 * @param {string} text - HTML, wie es aus dem contenteditable kommt
 */
const dlg = (title, triggerCondition, text) => ({ title, triggerCondition, text, used: false });

/**
 * Die NPCs der Saat, je Aufruf frisch. Texte als HTML wie aus dem Editor.
 * @returns {Record<string, any>[]}
 */
function npcs() {
    return [
        {
            id: 1,
            name: 'Anna',
            role: 'Wirtin',
            race: 'Mensch',
            description: 'Führt die Taverne am Hafen',
            chapter: 'Kapitel Eins',
            locationId: 1,
            tags: [{ name: 'Verbündet', color: 'green' }],
            triggers: [],
            dialogs: [
                dlg('Begrüßung', 'Beim Betreten', 'Willkommen im <strong>Goldenen</strong> Krug!')
            ]
        },
        {
            id: 2,
            name: 'Bert',
            role: 'Schmied',
            race: 'Zwerg',
            description: 'Hammer und Amboss',
            chapter: '',
            locationId: 2,
            tags: [],
            triggers: [],
            dialogs: []
        },
        {
            id: 3,
            name: 'Zora',
            role: 'Händlerin',
            race: 'Elf',
            description: 'Verkauft Tränke',
            chapter: '',
            locationId: 2,
            tags: [],
            triggers: [],
            dialogs: [
                dlg('Angebot', '', 'Seltene Ware aus dem Süden'),
                dlg('', '', 'Preise &amp; Rabatte<br>nur heute'),
                // zwei Leerzeichen im Editor werden "&nbsp; " (R4: Leerraum zusammengefasst)
                dlg('', '', 'Tausche&nbsp;Kupfer&nbsp; gegen &lt;Silber&gt;')
            ]
        },
        {
            id: 4,
            name: 'Kira',
            role: 'Jägerin',
            race: 'Halbling',
            description: '',
            chapter: '',
            locationId: null,
            tags: [],
            triggers: [],
            dialogs: [dlg('', '', 'Ich bin Kira, die Jägerin')]
        },
        {
            // kein dialogs-Feld (Altdaten, Import ohne Feld)
            id: 5,
            name: 'Olaf',
            role: 'Wirt',
            race: 'Mensch',
            description: 'Zweite Taverne',
            chapter: '',
            locationId: 1,
            tags: [],
            triggers: []
        },
        {
            // ein Dialog mit LEEREM Text
            id: 6,
            name: 'Wilma',
            role: 'Bäuerin',
            race: 'Mensch',
            description: '',
            chapter: '',
            locationId: null,
            tags: [],
            triggers: [],
            dialogs: [dlg('leer', '', '')]
        },
        {
            // ein Dialog OHNE text-Feld; die Beschreibung ist HTML
            id: 7,
            name: 'Max',
            role: 'Wache',
            race: 'Ork',
            description: '<b>Grimmig</b> und laut',
            chapter: '',
            locationId: null,
            tags: [],
            triggers: [],
            dialogs: [{ title: 'nur Titel', triggerCondition: '', used: false }]
        },
        {
            // Block- und Listengrenzen im Dialog (R4)
            id: 8,
            name: 'Ute',
            role: 'Barde',
            race: 'Gnom',
            description: '',
            chapter: '',
            locationId: null,
            tags: [],
            triggers: [],
            dialogs: [
                dlg(
                    'Lied',
                    '',
                    '<div>Erste Strophe</div><div>zweite Strophe</div><ul><li>Refrain</li><li>Ende</li></ul><p>Zugabe</p><p>Applaus</p>'
                )
            ]
        }
    ];
}

/** Alle IDs der Saat — was ein leerer Begriff zeigt. */
const ALLE = [1, 2, 3, 4, 5, 6, 7, 8];

/** @param {Record<string, any>} teile */
function seed(teile = {}) {
    /** @type {Record<string, any>} */
    const s = {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            markdownOnboardingSeen: true,
            enableMarkdownShortcuts: true
        },
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        characters: [],
        npcs: npcs(),
        locations: ORTE,
        quests: [],
        loot: [],
        spells: [],
        wiki: [],
        wikiRecentlyViewed: [],
        links: [],
        filters: [],
        factions: [],
        tags: [],
        sessionNotes: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        ...teile
    };
    /** @param {any[]} liste */
    const naechste = liste =>
        Math.max(0, ...(liste || []).map(x => (x && typeof x.id === 'number' ? x.id : 0))) + 1;
    s._nextId = {
        characters: 1,
        npcs: naechste(s.npcs),
        locations: naechste(s.locations),
        quests: 1,
        encounters: 1,
        spells: 1,
        loot: 1,
        items: 1,
        wiki: 1,
        links: 1,
        sessionNotes: 1,
        randomTables: 1,
        filters: 1,
        factions: 1
    };
    return s;
}

/**
 * Laedt, saet EINMAL je Tab (sessionStorage-Sperre wie npc-altdaten.spec.js)
 * und bleibt auf der Startansicht.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} [teile]
 */
async function laden(page, teile = {}) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('npc-suche-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('npc-suche-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(teile)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page
        .waitForFunction(
            schluessel => {
                try {
                    return (
                        JSON.parse(localStorage.getItem(schluessel) || '{}')._version !== '99.0.0'
                    );
                } catch {
                    return false;
                }
            },
            SPEICHER,
            { timeout: SOFORT_MS }
        )
        .catch(() => {});
}

// ===========================================================================
// FEHLER EINSAMMELN (wie npc-altdaten.spec.js)
// ===========================================================================

/**
 * Faengt jeden Fehler des ganzen Falls, vom Laden an: `pageerror`,
 * `console.error` (aus den Argumenten gelesen, damit die Zeile in jeder Engine
 * gleich lautet) und das Fehlerlog der App. "Failed to load resource" ist
 * Netzrauschen (Schriften unter file://).
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    /** @type {Promise<void>[]} */
    const offen = [];
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() !== 'error' || m.text().startsWith('Failed to load resource')) return;
        offen.push(
            Promise.all(
                m
                    .args()
                    .map(a =>
                        a.evaluate(v =>
                            v instanceof Error ? String(v) : typeof v === 'string' ? v : null
                        )
                    )
            )
                .then(teile => (teile.every(t => t !== null) ? teile.join(' ') : m.text()))
                .catch(() => m.text())
                .then(text => {
                    fehler.push('console.error: ' + text.split('\n')[0]);
                })
        );
    });
    return {
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            await Promise.all(offen);
            const appLog = await page.evaluate(() =>
                (window.ErrorHandler?.getRecentErrors(50) || []).map(
                    e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...fehler, ...appLog];
        }
    };
}

/** `$()` meldet im DEBUG_MODE das Fenster des Schnell-Dialogs, das erst beim
 *  ersten Oeffnen angelegt wird — als `console.error` und im Fehlerlog der App
 *  (vorbestehend, dasselbe Muster wie #mobile-search-modal in
 *  npc-altdaten.spec.js). Erlaubt, nicht verlangt: das Produktionsbuendel
 *  meldet es nicht. */
const ERLAUBT_SCHNELLDIALOG = [/Element not found: #quick-dialog-modal$/];

/** Die Wuerfe des NPC-Details bei Altdaten-Dialogen (NPC-NAME Offen (1), eigener
 *  Vorgang NPC-LISTENFELDER): die Liste waehlt den ersten Treffer automatisch
 *  aus, und showNPCDetail() wirft an `dialogs` als Text oder Objekt und an einem
 *  `null`-Element. Ausdruecklich ausgenommen (Vertrag W9) — eng gefasst: der
 *  Wurf eines Suchzweigs lautete `n.dialogs.filter …` oder `(n.dialogs || [])
 *  .some …` und faellt nicht darunter. */
const ERLAUBT_DETAIL = [
    /(^|[^.\w])dialogs\.filter is not a function$/,
    /Cannot read properties of null \(reading 'used'\)$/
];

/**
 * Am Ende jedes Falls: kein Fehler ausser den ausdruecklich erlaubten.
 * @param {ReturnType<typeof fehlerFangen>} fehler
 * @param {RegExp[]} [erlaubt]
 */
async function keinFehlerAusser(fehler, erlaubt = []) {
    const alle = await fehler.alle();
    weich(
        alle.filter(z => !erlaubt.some(r => r.test(z))),
        'kein Fehler ausser den erlaubten'
    ).toEqual([]);
}

// ===========================================================================
// HILFEN
// ===========================================================================

/** Ein Reiter per Klick, wie ein Nutzer (Gruppe erst oeffnen).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht */
async function zuAnsicht(page, ansicht) {
    await navigateToTab(page, ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
}

/** Auf das Telefon verkleinern; das Layoutprofil muss greifen und das
 *  Suchfeld der Ansicht sichtbar bleiben (harte Vorbedingung).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} feld */
async function aufsTelefon(page, feld) {
    await page.setViewportSize(TELEFON);
    await expect(page.locator('html')).toHaveAttribute('data-layout', 'mobile');
    await expect(page.locator(feld)).toBeVisible();
}

/**
 * Tippt den Begriff mit echten Tasten in ein Suchfeld: Klick, Strg+A,
 * Ruecktaste, dann Zeichen fuer Zeichen. Die Ansicht zeichnet je Taste neu
 * (`search-input`, synchron).
 * @param {import('@playwright/test').Page} page
 * @param {string} feld
 * @param {string} begriff
 */
async function tippen(page, feld, begriff) {
    const eingabe = page.locator(feld);
    await eingabe.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    if (begriff) await page.keyboard.type(begriff);
    await expect(eingabe).toHaveValue(begriff);
}

/** Die IDs der NPC-Liste, sortiert. @param {import('@playwright/test').Page} page */
function npcIds(page) {
    return page
        .locator('#npc-list .npc-item')
        .evaluateAll(els =>
            els.map(e => Number(/** @type {HTMLElement} */ (e).dataset.id)).sort((a, b) => a - b)
        );
}

/** Die IDs der Ortsliste, sortiert. @param {import('@playwright/test').Page} page */
function ortIds(page) {
    return page
        .locator('#locations-list .loc-item')
        .evaluateAll(els =>
            els.map(e => Number(/** @type {HTMLElement} */ (e).dataset.id)).sort((a, b) => a - b)
        );
}

/**
 * Eine Zeile der Begriffstabelle in der NPC-Ansicht.
 * @param {import('@playwright/test').Page} page
 * @param {[string, number[], string]} zeile - [Begriff, erwartete IDs, wozu]
 */
async function npcSuche(page, [begriff, soll, wozu]) {
    await tippen(page, '#npc-search', begriff);
    weich(await npcIds(page), `NPC-Suche ${JSON.stringify(begriff)} — ${wozu}`).toEqual(soll);
}

/**
 * Eine Zeile der Begriffstabelle in der Ortsansicht.
 * @param {import('@playwright/test').Page} page
 * @param {[string, number[], string]} zeile - [Begriff, erwartete IDs, wozu]
 */
async function ortSuche(page, [begriff, soll, wozu]) {
    await tippen(page, '#loc-search', begriff);
    weich(await ortIds(page), `Ortssuche ${JSON.stringify(begriff)} — ${wozu}`).toEqual(soll);
}

/**
 * Legt einen NPC ueber das Formular "+ NPC" an — Name, Rolle, Volk und
 * wahlweise einen Dialog ueber "+ Dialog hinzufuegen", dessen Zeilen mit Enter
 * getrennt getippt werden. Gibt die ID aus D zurueck (Ablesen).
 * @param {import('@playwright/test').Page} page
 * @param {{name: string, rolle: string, volk: string, dialogZeilen?: string[]}} npc
 */
async function npcAnlegen(page, { name, rolle, volk, dialogZeilen }) {
    await page.locator('#view-npcs [data-action="show-new-npc-modal"]').first().click();
    await expect(page.locator('#npc-name')).toBeVisible();
    await page.locator('#npc-name').click();
    await page.keyboard.type(name);
    await page.locator('#npc-role').click();
    await page.keyboard.type(rolle);
    await page.locator('#npc-race').selectOption(volk);
    if (dialogZeilen) {
        await page.locator('#npc-modal [data-action="call"][data-value="addDialogField"]').click();
        const editor = page.locator('#npc-dialogs-container .dialog-text').last();
        await editor.click();
        for (let i = 0; i < dialogZeilen.length; i++) {
            if (i > 0) await page.keyboard.press('Enter');
            await page.keyboard.type(dialogZeilen[i]);
        }
    }
    await page.locator('#npc-modal [data-action="call"][data-value="saveNPC"]').click();
    await expect(page.locator('#npc-name')).toBeHidden();
    const id = await page.evaluate(n => window.D.npcs.find(x => x.name === n)?.id, name);
    expect(typeof id, `${name} steht nach 💾 in D`).toBe('number');
    return /** @type {number} */ (id);
}

/**
 * Oeffnet den Schnell-Dialog eines NPC wie ein Nutzer: Begriff leeren, den NPC
 * in der Liste anklicken, "+" unter Dialoge im Detail, Klick ins Textfeld.
 * Gibt das Textfeld zurueck.
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 * @param {string} name
 */
async function schnellDialogOeffnen(page, id, name) {
    await tippen(page, '#npc-search', '');
    await page.locator(`#npc-list .npc-item[data-id="${id}"]`).click();
    await expect(page.locator('#npc-detail-panel .npc-detail-name')).toContainText(name);
    await page
        .locator(`#npc-detail-panel [data-action="show-add-dialog-modal-stop"][data-id="${id}"]`)
        .click();
    const editor = page.locator('#quick-dialog-text');
    await expect(editor).toBeVisible();
    await editor.click();
    return editor;
}

/**
 * Speichert den Schnell-Dialog: erst ein Klick ins Titelfeld, dann 💾. Solange
 * die Schreibmarke in einer Tabelle steht, liegt deren Kontextleiste ueber 💾
 * und faengt den Klick (vorbestehend, gemessen; nicht dieser Vorgang) — der
 * Klick daneben schliesst sie, wie ein Nutzer es auch taete.
 * @param {import('@playwright/test').Page} page
 */
async function schnellDialogSpeichern(page) {
    await page.locator('#quick-dialog-title').click();
    await expect(page.locator('#table-context-toolbar')).not.toHaveClass(/visible/);
    await page.locator('#quick-dialog-modal [data-action="save-quick-dialog"]').click();
    await expect(page.locator('#quick-dialog-text')).toBeHidden();
}

/** Die Dialogtexte eines NPC aus D (Ablesen).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function dialogTexte(page, id) {
    return page.evaluate(
        i => (window.D.npcs.find(x => x.id === i)?.dialogs || []).map(d => d && d.text),
        id
    );
}

// ===========================================================================
// DIE FAELLE
// ===========================================================================

/** @type {[string, number[], string][]} */
const W1 = [
    ['Anna', [1], 'Name, NPC mit Dialog'],
    ['ANNA', [1], 'Name gross getippt'],
    ['Zora', [3], 'Name, NPC mit drei Dialogen'],
    ['Händlerin', [3], 'Rolle mit Umlaut'],
    ['Wirt', [1, 5], 'Rolle: Wirtin (mit Dialog) und Wirt (ohne Feld)'],
    ['Mensch', [1, 5, 6], 'Volk'],
    ['Taverne', [1, 5], 'Beschreibung']
];

/** @type {[string, number[], string][]} */
const W2 = [
    ['Goldenen', [1], 'nur im Dialogtext (in <strong>)'],
    ['Süden', [3], 'nur im Dialogtext, erster von drei Dialogen'],
    ['Goldenen Krug', [1], 'ueber die Grenze von </strong>'],
    ['Preise & Rabatte', [3], '&amp; dekodiert'],
    ['Tausche Kupfer', [3], '&nbsp; dekodiert'],
    ['gegen <Silber>', [3], '&lt; und &gt; dekodiert']
];

for (const [groesse, kennung] of /** @type {const} */ ([
    [BREIT, ''],
    [TELEFON, 't']
])) {
    const wo = groesse === TELEFON ? ', Telefon 390x844' : '';

    test(`W1${kennung} Feldtreffer bei einem NPC mit Dialog findet ihn${wo}`, async ({ page }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        await zuAnsicht(page, 'npcs');
        if (groesse === TELEFON) await aufsTelefon(page, '#npc-search');
        for (const zeile of W1) await npcSuche(page, zeile);
        await keinFehlerAusser(fehler);
    });

    test(`W2${kennung} ein Wort nur im Dialog findet den NPC, als sichtbarer Text${wo}`, async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        await zuAnsicht(page, 'npcs');
        if (groesse === TELEFON) await aufsTelefon(page, '#npc-search');
        for (const zeile of W2) await npcSuche(page, zeile);
        await keinFehlerAusser(fehler);
    });
}

test('W3 ein NPC mit textlosem Dialog bleibt ueber seine Felder auffindbar', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Wilma', [6], 'Name; Dialog mit leerem Text'],
        ['Bäuerin', [6], 'Rolle; Dialog mit leerem Text'],
        ['Max', [7], 'Name; Dialog ohne text-Feld'],
        ['Grimmig', [7], 'Beschreibung; Dialog ohne text-Feld']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W4 der Begriff wird getrimmt: Leerzeichen am Rand aendern nichts (NPC-Ansicht)', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        [' Anna', [1], 'Leerzeichen vorn'],
        ['Anna ', [1], 'Leerzeichen hinten'],
        [' Goldenen ', [1], 'Dialogzweig mit Leerzeichen am Rand'],
        ['   ', ALLE, 'nur Leerzeichen zeigt alle (R1)']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W4o der Begriff wird getrimmt: Leerzeichen am Rand aendern nichts (Ortsansicht)', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'locations');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Hafen ', [1], 'Ortsname mit Leerzeichen hinten (Kontrolle)'],
        ['Anna ', [1], 'NPC-Name mit Leerzeichen hinten'],
        [' Olaf', [1], 'NPC-Name mit Leerzeichen vorn'],
        ['   ', [1, 2], 'nur Leerzeichen zeigt alle (Kontrolle)']
    ]))
        await ortSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W4l nur Leerzeichen gilt auch im Leerzustand als leerer Begriff (R6)', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [], locations: [] });
    await zuAnsicht(page, 'npcs');
    const npcTitel = page.locator('#npc-list .npc-empty-title');
    await tippen(page, '#npc-search', '');
    await expect(npcTitel, 'Vorbedingung: leerer Begriff, keine NPCs').toHaveText('Keine NPCs');
    await tippen(page, '#npc-search', '   ');
    await weich(npcTitel, 'NPC-Ansicht, "   ": wie ein leerer Begriff').toHaveText('Keine NPCs');
    await weich(
        page.locator('#npc-list .npc-add-btn'),
        'NPC-Ansicht, "   ": "+ NPC erstellen" wie bei leerem Begriff'
    ).toBeVisible();

    await zuAnsicht(page, 'locations');
    const ortTitel = page.locator('#locations-list .loc-empty-title');
    await tippen(page, '#loc-search', '');
    await expect(ortTitel, 'Vorbedingung: leerer Begriff, keine Orte').toHaveText('Keine Orte');
    await tippen(page, '#loc-search', '   ');
    await weich(ortTitel, 'Ortsansicht, "   ": wie ein leerer Begriff').toHaveText('Keine Orte');
    await keinFehlerAusser(fehler);
});

test('W5 der Ortschip bleibt UND-verknuepft, auch fuer einen Dialogtreffer', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    await tippen(page, '#npc-search', '');
    const chip = page.locator('#npc-filters .npc-filter-chip', { hasText: 'Hafen' });
    await chip.click();
    await expect(chip, 'Vorbedingung: Chip "Hafen" aktiv').toHaveClass(/active/);
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['', [1, 5], 'leer: Anna und Olaf (Kontrolle)'],
        ['Anna', [1], 'Feldtreffer am Hafen'],
        ['Wirt', [1, 5], 'Feldtreffer, beide am Hafen'],
        ['Goldenen', [1], 'Dialogtreffer am Hafen'],
        ['Zora', [], 'Feldtreffer am Markt (Kontrolle)'],
        ['Süden', [], 'Dialogtreffer am Markt — der Chip schraenkt auch den Dialogzweig ein']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W6f Bedienweg: ein NPC, ueber das Formular mit Dialog angelegt, ist auffindbar', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [] });
    await zuAnsicht(page, 'npcs');
    const greta = await npcAnlegen(page, {
        name: 'Greta',
        rolle: 'Köchin',
        volk: 'Mensch',
        dialogZeilen: ['Heute gibt es Eintopf', 'mit Speck']
    });
    const texte = await dialogTexte(page, greta);
    expect(texte, 'Vorbedingung: Greta hat genau einen Dialog').toHaveLength(1);
    expect(String(texte[0]), 'Vorbedingung: der Dialog traegt beide Zeilen').toMatch(
        /Eintopf[\s\S]*Speck/
    );
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Greta', [greta], 'Name'],
        ['Köchin', [greta], 'Rolle'],
        ['Mensch', [greta], 'Volk aus der Auswahl'],
        ['Eintopf', [greta], 'Wort der ersten Dialogzeile'],
        ['Speck', [greta], 'Wort der zweiten Dialogzeile']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W6q Bedienweg: ein Schnell-Dialog "+" im Detail laesst den NPC nicht aus der Suche fallen', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [] });
    await zuAnsicht(page, 'npcs');
    const hugo = await npcAnlegen(page, { name: 'Hugo', rolle: 'Brückenwärter', volk: 'Zwerg' });
    await npcSuche(page, ['Hugo', [hugo], 'vor dem Dialog (Kontrolle)']);
    await tippen(page, '#npc-search', '');
    await page.locator(`#npc-list .npc-item[data-id="${hugo}"]`).click();
    await expect(page.locator('#npc-detail-panel .npc-detail-name')).toContainText('Hugo');
    await page
        .locator(`#npc-detail-panel [data-action="show-add-dialog-modal-stop"][data-id="${hugo}"]`)
        .click();
    await expect(page.locator('#quick-dialog-text')).toBeVisible();
    await page.locator('#quick-dialog-text').click();
    await page.keyboard.type('Zahlt die Maut, Fremder');
    await page.locator('#quick-dialog-modal [data-action="save-quick-dialog"]').click();
    await expect(page.locator('#quick-dialog-text')).toBeHidden();
    const texte = await dialogTexte(page, hugo);
    expect(texte, 'Vorbedingung: der Schnell-Dialog steht in D').toEqual([
        'Zahlt die Maut, Fremder'
    ]);
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Hugo', [hugo], 'Name'],
        ['Brückenwärter', [hugo], 'Rolle'],
        ['Zwerg', [hugo], 'Volk'],
        ['Maut', [hugo], 'Wort des neuen Dialogs']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler, ERLAUBT_SCHNELLDIALOG);
});

test('W7 die Ortssuche findet einen Ort ueber den Namen eines NPC, der dort steht', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'locations');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['', [1, 2], 'leer: alle (Kontrolle)'],
        ['Anna', [1], 'NPC am Hafen, mit Dialog'],
        ['Olaf', [1], 'NPC am Hafen, ohne dialogs-Feld'],
        ['Bert', [2], 'NPC am Markt, dialogs: []'],
        ['Zora', [2], 'NPC am Markt, mit Dialogen'],
        ['Hafen', [1], 'Ortsname (Kontrolle)'],
        ['mar', [2], 'nur Markt — wie npc-altdaten W7/W8/W19 (Kontrolle)'],
        ['Kira', [], 'NPC ohne Ort (Kontrolle)'],
        ['Xyz', [], 'nichts (Kontrolle)']
    ]))
        await ortSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W8 Kontrollen: was schon richtig war, und was die Ansicht nie durchsucht hat', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['', ALLE, 'leer: alle'],
        ['Bert', [2], 'Name, dialogs: []'],
        ['Olaf', [5], 'Name, ohne dialogs-Feld'],
        ['Kira', [4], 'Name UND Dialogtext'],
        ['Jägerin', [4], 'Rolle UND Dialogtext'],
        ['Begrüßung', [], 'Dialogtitel — nie durchsucht (Entscheidung (c))'],
        ['Angebot', [], 'Dialogtitel — nie durchsucht'],
        ['Beim Betreten', [], 'Dialog-Trigger — nie durchsucht'],
        ['Verbündet', [], 'Tag — nie durchsucht'],
        ['Kapitel', [], 'chapter — in der Ansicht nie durchsucht']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W9 Markup und Entitaeten des Dialogs treffen nicht', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['strong', [], 'Tag-Name aus Annas Dialog'],
        ['div', [], 'Tag-Name aus Utes Dialog'],
        ['br', [], 'Tag-Name aus Zoras Dialog'],
        ['amp', [], 'Entitaet aus Zoras Dialog'],
        ['nbsp', [], 'Entitaet aus Zoras Dialog'],
        ['&amp;', [], 'die Entitaet woertlich — sichtbar steht "&"']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W9a Altdaten-Dialoge: die Suche wirft nie und liefert je Begriff die richtige Liste', async ({
    page
}) => {
    const alt = npcs();
    alt[2].dialogs = 'Hallo als Text'; // Zora: dialogs als Text
    alt[3].dialogs = [null, dlg('', '', 'Ich bin Kira')]; // Kira: null-Element
    alt[4].dialogs = ['Nur ein Text']; // Olaf: Element ist Text
    alt[5].dialogs = {}; // Wilma: dialogs als Objekt
    alt[6].dialogs = [{ title: '', triggerCondition: '', text: 5, used: false }]; // Max: text als Zahl
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: alt });
    const formen = await page.evaluate(() =>
        window.D.npcs.map(n => [
            n.id,
            Array.isArray(n.dialogs)
                ? 'liste'
                : n.dialogs === undefined
                  ? 'fehlt'
                  : typeof n.dialogs
        ])
    );
    expect(formen, 'Vorbedingung: die Altdaten-Formen kommen ueber die Datengrenze').toEqual([
        [1, 'liste'],
        [2, 'liste'],
        [3, 'string'],
        [4, 'liste'],
        [5, 'liste'],
        [6, 'object'],
        [7, 'liste'],
        [8, 'liste']
    ]);
    await zuAnsicht(page, 'npcs');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Bert', [2], 'Name, gueltige Daten'],
        ['Anna', [1], 'Name, gueltige Daten'],
        ['Zora', [3], 'Name; dialogs als Text'],
        ['Kira', [4], 'Name; null-Element'],
        ['Ich bin', [4], 'Dialog neben einem null-Element'],
        ['Olaf', [5], 'Name; Element ist Text'],
        ['Wilma', [6], 'Name; dialogs als Objekt'],
        ['Max', [7], 'Name; text als Zahl'],
        ['Ute', [8], 'Name, gueltige Daten'],
        ['Hallo', [], 'dialogs als Text ist kein Dialog'],
        ['Nur ein', [], 'ein Text-Element ist kein Dialog'],
        ['Wirt', [1, 5], 'Rolle'],
        ['', ALLE, 'leer: alle']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler, ERLAUBT_DETAIL);
});

test('W10f Zeilenumbruch aus dem Formular: Woerter beiderseits stehen getrennt', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [] });
    await zuAnsicht(page, 'npcs');
    const greta = await npcAnlegen(page, {
        name: 'Greta',
        rolle: 'Köchin',
        volk: 'Mensch',
        dialogZeilen: ['Heute gibt es Eintopf', 'mit Speck']
    });
    const texte = await dialogTexte(page, greta);
    expect(
        String(texte[0]),
        'Vorbedingung: zwischen "Eintopf" und "mit" steht eine Zeilengrenze, kein Leerzeichen'
    ).toMatch(/Eintopf\s*(<br\s*\/?>|<\/?(div|p)\b[^>]*>)\s*mit/);
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Eintopf mit', [greta], 'ueber die Zeilengrenze, mit Leerzeichen'],
        ['Eintopfmit', [], 'zusammengeklebt — kein Scheintreffer']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W10s Zeilen- und Blockgrenzen und Leerraum im gespeicherten Dialog', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Rabatte nur', [3], '<br>'],
        ['Rabattenur', [], '<br> zusammengeklebt — kein Scheintreffer'],
        ['Strophe zweite', [8], '</div><div>'],
        ['Strophezweite', [], '</div><div> zusammengeklebt'],
        ['Refrain Ende', [8], '</li><li>'],
        ['RefrainEnde', [], '</li><li> zusammengeklebt'],
        ['Zugabe Applaus', [8], '</p><p>'],
        ['ZugabeApplaus', [], '</p><p> zusammengeklebt'],
        ['Kupfer gegen', [3], '"&nbsp; " ist EIN Leerzeichen (zusammengefasst)']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});

test('W10t Tabelle aus dem Editor: Woerter in zwei Zellen stehen getrennt', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [] });
    await zuAnsicht(page, 'npcs');
    const tilo = await npcAnlegen(page, { name: 'Tilo', rolle: 'Wechsler', volk: 'Zwerg' });
    const editor = await schnellDialogOeffnen(page, tilo, 'Tilo');
    // Strg+Umschalt+T fuegt eine 3x3-Tabelle ein (insertTable(), ui/editors/
    // rich-text-insert.js): Kopfzeile <th> "Spalte 1".."Spalte 3", darunter
    // zwei Zeilen leerer <td>. Das Einfuegen einer Tabelle (Strg+V) laesst
    // <table>, <tr>, <td> und <th> ebenso stehen.
    await page.keyboard.press('Control+Shift+T');
    const zellen = editor.locator('td');
    await expect(zellen, 'Vorbedingung: die Tabelle steht im Schnell-Dialog').toHaveCount(6);
    await zellen.nth(0).click();
    await page.keyboard.type('Gold');
    await zellen.nth(1).click();
    await page.keyboard.type('Silber');
    await schnellDialogSpeichern(page);
    const texte = await dialogTexte(page, tilo);
    expect(texte, 'Vorbedingung: Tilo hat genau einen Dialog').toHaveLength(1);
    expect(String(texte[0]), 'Vorbedingung: zwei Kopfzellen nebeneinander').toMatch(
        /<th\b[^>]*>Spalte 1<\/th>\s*<th\b[^>]*>Spalte 2<\/th>/
    );
    expect(String(texte[0]), 'Vorbedingung: "Gold" und "Silber" in zwei Zellen').toMatch(
        /<td\b[^>]*>Gold<\/td>\s*<td\b[^>]*>Silber<\/td>/
    );
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Gold Silber', [tilo], '</td><td>'],
        ['GoldSilber', [], '</td><td> zusammengeklebt — kein Scheintreffer'],
        ['Spalte 1 Spalte 2', [tilo], '</th><th>'],
        ['1Spalte', [], '</th><th> zusammengeklebt — kein Scheintreffer']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler, ERLAUBT_SCHNELLDIALOG);
});

test('W10w ein Tag mitten im Wort faellt weg, ohne das Wort zu trennen', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [] });
    await zuAnsicht(page, 'npcs');
    const wanda = await npcAnlegen(page, { name: 'Wanda', rolle: 'Wirtin', volk: 'Mensch' });
    await schnellDialogOeffnen(page, wanda, 'Wanda');
    await page.keyboard.type('Der Goldenen Krug');
    // "Gold" markieren — Pos1, vier Zeichen nach rechts, vier mit Umschalt —
    // und ueber "B" der Blase setzen, die zur Markierung erscheint (sie legt
    // sich ueber die feste Leiste): nur ein Teil des Worts ist danach fett.
    await page.keyboard.press('Home');
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight');
    const blase = page.locator('#floating-toolbar');
    await expect(blase, 'Vorbedingung: die Blase erscheint zur Markierung').toHaveClass(/visible/);
    await blase.locator('[data-floating-action="bold"]').click();
    await schnellDialogSpeichern(page);
    const texte = await dialogTexte(page, wanda);
    expect(texte, 'Vorbedingung: Wanda hat genau einen Dialog').toHaveLength(1);
    expect(String(texte[0]), 'Vorbedingung: das Tag sitzt mitten im Wort').toMatch(
        /Der <(b|strong)\b[^>]*>Gold<\/(b|strong)>enen Krug/
    );
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Goldenen', [wanda], 'Wort, dessen erster Teil fett ist'],
        ['Gold enen', [], 'das Tag ist keine Wortgrenze — kein Scheintreffer']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler, ERLAUBT_SCHNELLDIALOG);
});

test('W10e einseitige Blockgrenzen: ein oeffnendes oder schliessendes Tag allein trennt', async ({
    page
}) => {
    // Gesaet: Grenzen, an denen zwischen zwei Woertern NUR das oeffnende oder
    // NUR das schliessende Tag eines Blocks steht. W10s fuehrt Blockgrenzen nur
    // als Paare (`</div><div>`), und dort reicht jede Seite allein fuer das
    // Leerzeichen.
    /** @type {(id: number, name: string, text: string) => Record<string, any>} */
    const mit = (id, name, text) => ({
        id,
        name,
        role: '',
        race: '',
        description: '',
        chapter: '',
        locationId: null,
        tags: [],
        triggers: [],
        dialogs: [dlg('', '', text)]
    });
    const fehler = fehlerFangen(page);
    await laden(page, {
        npcs: [
            mit(1, 'Berta', 'Erste Zeile<div>zweite Zeile</div>'),
            mit(2, 'Cara', '<div>Oben</div>unten'),
            mit(3, 'Emil', 'Intro<ul><li>Punkt</li></ul>Schluss')
        ]
    });
    await zuAnsicht(page, 'npcs');
    for (const zeile of /** @type {[string, number[], string][]} */ ([
        ['Zeile zweite', [1], 'nur <div> zwischen den Woertern'],
        ['Zeilezweite', [], 'nur <div> — kein Scheintreffer'],
        ['Oben unten', [2], 'nur </div> zwischen den Woertern'],
        ['Obenunten', [], 'nur </div> — kein Scheintreffer'],
        ['Intro Punkt', [3], 'nur <ul><li> zwischen den Woertern'],
        ['IntroPunkt', [], 'nur <ul><li> — kein Scheintreffer'],
        ['Punkt Schluss', [3], 'nur </li></ul> zwischen den Woertern'],
        ['PunktSchluss', [], 'nur </li></ul> — kein Scheintreffer']
    ]))
        await npcSuche(page, zeile);
    await keinFehlerAusser(fehler);
});
