// @ts-check
/**
 * Das ✕ in einem Suchfeld wirkt wie das leer getippte Feld (SUCHE-LEEREN)
 * =====================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT: **ein Klick, Tap, Enter oder Leertaste auf
 * das ✕ eines Suchfeldes hinterlaesst die Ansicht genau so, als haette man den
 * Begriff von Hand weggeloescht — und der Fokus steht danach im Feld**, so
 * dass das naechste getippte Zeichen dort landet und keine Kurztaste ausloest.
 * Fuer JEDES Feld mit ✕, das im Buendel steht, ohne eine zweite Liste, in die
 * man ein neues Feld eintragen muesste.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND — gemessen von Messung und Kritik am Stand 543706c6 (Kopf der
 * Stapelkette mit #27 BESTIAR-KLICK) und am dev-Buendel von main 4037338d,
 * Chromium, dev und prod, echte Klicks, Taps und Tasten (Maus 1440x900,
 * Finger 390x844 und 320x568, Tab+Enter, Tab+Leertaste). Im Buendel stehen
 * 15 Suchfelder mit ✕; kein JS-Template erzeugt weitere.
 *
 * A) VIER ✕ TUN NICHTS: Bestiar, Session-Vorbereitung, Kalender, Fraktionen.
 *    Der Wert bleibt "gob", die Liste bleibt gefiltert (0 Mutationen), die
 *    Zaehler der drei Welt-Reiter bleiben auf 1 statt 2 stehen, das ✕ behaelt
 *    `.visible`. Auf allen Wegen, in dev, prod und am main-Buendel.
 * B) WIKI: Feld und Baum werden geleert, aber der Such-Aufklapp
 *    (#wiki-search-dropdown) bleibt offen und zeigt weiter "Goblinstaemme" —
 *    auch nach weiterem Tippen.
 * C) FOKUS, alle 15 Felder, alle Wege: nach ✕ liegt der Fokus auf dem
 *    ✕-Knopf. In den 11 sonst richtigen Feldern verliert der Knopf beim Leeren
 *    `.visible` und ist danach unsichtbar (opacity 0) — mit der Tastatur
 *    sofort, mit der Maus, sobald sie den Suchbereich verlaesst. Wer danach
 *    weitertippt, trifft nicht das Feld, sondern die globalen Kurztasten (die
 *    Schranke `isTyping` kennt nur INPUT, TEXTAREA, SELECT und
 *    contentEditable): "n" oeffnet in NSC, Auftraegen, Encounter und Gruppe
 *    den Dialog bzw. das Klappformular, "l" das Ereignislog, "r" wuerfelt
 *    einen d20, "t" startet den Sitzungstimer.
 * D) WIKI, ENTER IM AUFKLAPP: "gob", Pfeil runter, Enter — der Eintrag
 *    oeffnet, das Feld ist danach leer, der Baum aber bleibt auf "gob"
 *    gefiltert und das ✕ behaelt `.visible`.
 *
 * DIE URSACHE. Der Zweig 'clear-search' (ui/actions/ui-actions.js) fuehrte
 * eine LITERAL gepflegte zweite Liste `searchRenderMap` (Feld -> Render-
 * funktion, 11 Eintraege) und schwieg bei jeder ID, die darin fehlt. Die vier
 * ✕ kamen spaeter ins Markup (Bestiar 1adf9e4a, Welt efd8d263), die Liste
 * nicht — die dritte Drift derselben Liste (a34b5f10 reparierte die zweite).
 * Der Wiki-Eintrag rief `renderWiki` statt der Aktion des Feldes, die den
 * Aufklapp schliesst; `clearSearch()` (utils/basic.js) setzt den Wert, zieht
 * `.visible` ab und setzt keinen Fokus. Der Enter-Weg im Wiki-Aufklapp setzt
 * den Wert nach dem Neuzeichnen auf '' — an der Aktion des Feldes vorbei,
 * dieselbe Klasse.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (Kritik zu SUCHE-LEEREN), und welcher Fall welche Regel prueft
 *
 *   R1  Eine Quelle: ✕ setzt den Wert des Feldes auf '' und feuert am Feld
 *       EIN `input` mit bubbles:true — die eigene Aktion des Feldes
 *       ('search-input' mit data-render bzw. die Aktion des Wiki-Suchfeldes)
 *       laeuft ueber den Verteiler. `searchRenderMap` entfaellt ersatzlos.
 *                        W1–W3 (die vier Felder, die die Liste nicht kannte);
 *                        "keine zweite Liste" und "genau ein input":
 *                        tests/unit/suche-leeren.test.js
 *   R2  Wirkung je Feld, fuer Maus, Enter, Leertaste und Tap, dev und prod:
 *       Feld leer; Ansichtstext, Zaehler und Aufklapp gleich dem Zustand
 *       "von Hand per Ruecktaste geleert"; ✕ ohne `.visible`.
 *                                                     W1, W1p, W2, W2b, W3, W5
 *   R3  Fokus: nach ✕ ist das Feld activeElement und sichtbar; ein danach
 *       getipptes Wort mit Kurztasten-Anfang steht im Feld und loest nichts
 *       aus. Auch auf dem Telefon (Nutzerentscheidung: immer fokussieren).
 *                                                                    W4, W4p
 *   R4  Nichts wird still verschluckt: nennt ein data-value kein textartiges
 *       INPUT mit registrierter Aktion, meldet der Zweig das ueber
 *       ErrorHandler.log.         statisch W6; zur Laufzeit die Unit-Datei
 *   R5  BESTIAR-KLICK R1 bleibt stimmig: ein change beim Verlassen des Feldes
 *       zeichnet nicht ein zweites Mal.                                    W1
 *   R6  Sonst aendert sich nichts; kein synthetisches Ereignis ausser dem
 *       einen input.                                    Unit-Datei (Zaehlung)
 *   R7  Tore (Lint-Pin, Globals, d.ts) — kein Fall hier.
 *   R8  Enter im Wiki-Aufklapp leert ueber denselben Weg (Nutzerentscheidung:
 *       leeren, nicht stehen lassen): Feld, Baum und ✕ stimmen ueberein.  W7
 *
 * DIE FAELLE und ihr Stand am unveraenderten Buendel (543706c6)
 *
 *   (W1)  Maus 1440x900, je Feld: ✕ wie Ruecktaste,     rot: Bestiar, Session-
 *         danach Klick daneben ohne Neuzeichnen (R5)     Vorbereitung, Kalender,
 *                                                        Fraktionen, Wiki
 *   (W1p) dasselbe im prod-Buendel, alle Felder in       rot (dieselben fuenf)
 *         einem Fall
 *   (W2)  Tab vom Feld auf ✕, Enter, je Feld             rot wie W1
 *   (W2b) Tab vom Feld auf ✕, Leertaste, je Feld         rot wie W1
 *   (W3)  Telefon 390x844 (Touch), Tap auf ✕, je Feld    rot wie W1
 *   (W4)  Fokus nach ✕ (Maus, Enter, Tap), je Feld,      rot: alle 15 je Weg
 *         danach "nils" bzw. "rat" tippen
 *   (W4p) dasselbe mit der Maus im prod-Buendel          rot (alle 15)
 *   (W5)  Wiki: ✕ schliesst den Aufklapp                 rot (offen, Treffer)
 *   (W6)  Struktur: jedes ✕ nennt ein Textfeld mit       gruen — Ratsche
 *         registrierter Aktion, Liste == Dokument
 *   (W7)  Wiki: Enter im Aufklapp (R8)                   rot (Baum gefiltert,
 *                                                        ✕ .visible)
 *
 * DER VERGLEICH "WIE VON HAND GELEERT". Nicht der Zustand vor der Suche: in
 * NSC und Encounter waehlt die Master-Detail-Ansicht beim Filtern den ersten
 * Treffer aus und behaelt ihn — nach dreimal Ruecktaste zeigt das Detail
 * Gobbo bzw. den Goblin-Hauptmann, nicht Alrik bzw. den Ork-Spaeher (Kritik,
 * gemessen). Das ist kein Fehler des ✕. Jeder R2-Fall tippt darum zuerst
 * "gob", loescht es mit der Ruecktaste (die Referenz), tippt "gob" erneut und
 * bedient dann das ✕. Verglichen werden der ganze Ansichtstext, die Zaehler
 * der Werkzeugleiste und der Aufklapp neben dem Feld — so faellt der Wiki-
 * Befund ohne Sonderfall auf. Die Zaehler reagieren nur in Notizen und den
 * drei Welt-Reitern (2 -> 1 -> 2); sonst zeigen sie die Gesamtzahl.
 *
 * DIE FELDLISTE kommt aus dem gebauten dev-Buendel: alle `<button>` mit
 * `data-action="clear-search"` beim Einsammeln der Faelle aus der Datei
 * gelesen, nicht hier abgetippt. (W6) prueft, dass das geladene Dokument
 * genau diese Liste traegt und dass jedes ✕ sich aufloesen laesst. Ohne
 * Buendel ist die Liste leer und (W6) rot — vorher `python build.py`.
 *
 * DIE WOERTER in (W4): in den Ansichten, in denen "n" ein neues Element
 * anlegt (NSC, Auftraege, Encounter, Gruppe — tastenhilfe.spec.js (18) misst
 * diese Menge plus die Initiative, die kein Suchfeld hat), "nils"; sonst
 * "rat" ("r" wuerfelt, "t" startet den Timer). Die Sonde des ersten Berichts
 * tippte "zwe" — drei freie Tasten — und sah darum den Schaden nicht.
 *
 * WAS DIESE DATEI NICHT VERLANGT (Vertrag "NICHT IM PR", Offen): dass das ✕
 * bei leerem Feld kein unsichtbarer Tab-Stopp ist; die Sichtbarkeit des ✕ bei
 * leerem, fokussiertem Feld (core.css); dass `searchWikiTag()` das ✕
 * nachzieht; die Neuzeichnung beim Klick ins Feld (BESTIAR-KLICK Offen (3)).
 * Der Mausklick auf einen Treffer im Wiki-Aufklapp laesst "gob" stehen — das
 * ist stimmig (Feld, Baum und ✕ zeigen "gob") und hier kein Fall.
 *
 * BEDIENWEG: nur echte Navigation, Klicks, Taps und Tasten. `evaluate` saet
 * nur VOR dem Laden (addInitScript) und liest ab; die zwei passiven
 * MutationObserver (Neuzeichnen beim Verlassen des Feldes, neue Eintraege im
 * Ereignislog) beobachten nur. Jeder Fall verlangt: kein `pageerror`, kein
 * `console.error`, kein Dialog.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER ROTE LAUF — diese Datei am Stand 543706c6 (vor dem Fix), Chromium,
 * dev- und prod-Buendel frisch gebaut, drei Worker: 110 Faelle, 69 rot,
 * 41 gruen. tests/unit/suche-leeren.test.js dazu: 9 von 9 rot.
 *
 *   (W1)  rot   5  bestiary, sessionprep, kalender, fraktionen: Wert "gob",
 *                  ✕ .visible, Ansicht gefiltert, Welt-Zaehler 1 statt 2;
 *                  wiki: Aufklapp offen mit "Goblinstaemme"
 *         gruen 10 die uebrigen Felder, R5 eingeschlossen
 *   (W1p) rot      dieselben fuenf Felder im prod-Buendel
 *   (W2)  rot   5 / gruen 10   wie W1
 *   (W2b) rot   5 / gruen 10   wie W1
 *   (W3)  rot   5 / gruen 10   wie W1 (Layout "mobile", Tap)
 *   (W4)  rot  45  alle 15 Felder je Weg: Fokus auf dem ✕; mit Maus und
 *                  Enter ist es in den elf leerenden Feldern unsichtbar;
 *                  "nils" klappt das Formular auf (Gruppe, Encounter) bzw.
 *                  oeffnet den Dialog (NSC, Auftraege) und schaltet das
 *                  Ereignislog um; "rat" wuerfelt und startet den Timer; das
 *                  Wort steht nicht im Feld
 *   (W4p) rot      alle 15 Felder im prod-Buendel
 *   (W5)  rot      #wiki-search-dropdown display:block, "Goblinstaemme"
 *   (W6)  gruen    15 ✕, alle aufloesbar, Liste == Dokument
 *   (W7)  rot      Baum bleibt der "gob"-Baum, ✕ behaelt .visible; Feld
 *                  leer und Eintrag geoeffnet (Kontrolle) gruen
 *
 * DIE GEGENPROBE — Fix-Skizzen AUSSERHALB des Repos (git archive 543706c6,
 * je Variante gepatcht, mit build.py gebaut), diese Datei und
 * tests/unit/suche-leeren.test.js dagegen gefahren. Ganz gefahren nur die
 * richtige Skizze; bei den Halbfixen die Faelle in Klammern.
 *
 *   richtig: Hilfe clearSearch(inputId) leert,      110/110 gruen (dev und
 *     feuert input, fokussiert, meldet Unaufloes-     prod); Unit 9/9 gruen
 *     bares; Zweig und Wiki-Enter rufen sie
 *   Liste um die vier Felder verlaengert, Fokus      rot nur W7 (W1, W4 Maus,
 *     gesetzt, Wiki-Eintrag schliesst den Aufklapp   W5, W6, W7); Unit 9 rot —
 *     (die "vierte Drift-Reparatur")                 nur die Unit-Datei sieht
 *                                                    die zweite Liste
 *   Neuzeichnen ueber window[data-render], Wiki      rot W1 wiki, W4 Maus (15),
 *     ueber renderWiki (im Vertrag als schwaecher    W5, W7; Unit 9 rot
 *     genannt)
 *   Skizze der Messung woertlich (ohne Meldung,      rot nur W7 (W1, W3,
 *     ohne Wiki-Enter)                               W4 Maus, W5, W6, W7);
 *                                                    Unit 6 rot (R4)
 *   richtig, aber ohne Fokus                         rot W4 Maus (15); W1, W7
 *                                                    gruen; Unit 2 rot
 *   richtig, aber kein Fokus beim Tap (die           rot W4 Tap (15), W4 Maus
 *     verworfene Seite von Nutzerentscheidung 1)     gruen; Unit gruen (jsdom
 *                                                    kennt kein pointerType)
 *   richtig, aber change statt input                 gruen (W1, W4 Maus, W5,
 *                                                    W7): Chromium feuert nach
 *                                                    dem Leeren beim Verlassen
 *                                                    kein change, darum faengt
 *                                                    R5 hier nichts; Unit 2 rot
 *                                                    (R1 eigene Aktion, R6)
 *
 * Kein Fall ist an der richtigen Skizze rot. Die R5-Pruefung in (W1) war in
 * keinem gemessenen Stand rot — sie ist eine Ratsche fuer BESTIAR-KLICK R1.
 *
 * LAUFZEIT: ~9 s je Fall bei drei Workern; die ganze Datei ~8 min.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = process.cwd().replace(/\\/g, '/');
const DEV = `file:///${WURZEL}/dist/dnd-tracker-bundled.html`;
const PROD = `file:///${WURZEL}/dist/dnd-tracker-optimized.html`;
const DEV_DATEI = join(process.cwd(), 'dist', 'dnd-tracker-bundled.html');
/** Der CI-Job `e2e` baut nur dev (`python build.py`); die prod-Faelle gibt
 *  es nur mit einem frischen `python build.py --production`. */
const PROD_DA = existsSync(join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));

const SPEICHER = 'dnd-tracker-v4';

const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };

/** Zeit fuer Zeichnen nach Taste oder ✕ — die Zaubersuche ist um 200 ms
 *  entprellt (R2). */
const SETZEN_MS = 450;

/** Ansichten, in denen die blanke Taste "n" ein neues Element anlegt. */
const N_ANSICHTEN = new Set(['view-npcs', 'view-quests', 'view-encounter', 'view-party']);

/** Das Wiki-Suchfeld — nur fuer (W5) und (W7), die den Aufklapp bedienen. */
const WIKI_FELD = 'wiki-search';

/** WEICHE Zusicherungen: ein roter Lauf nennt JEDE gebrochene Zusage.
 *  Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

/**
 * Die Feldliste aus dem gebauten dev-Buendel: das data-value jedes
 * `<button>` mit data-action="clear-search", in Dokumentreihenfolge. Leer,
 * wenn das Buendel fehlt — dann ist (W6) rot.
 * @returns {string[]}
 */
function felderAusDemBuendel() {
    if (!existsSync(DEV_DATEI)) return [];
    const html = readFileSync(DEV_DATEI, 'utf8');
    /** @type {string[]} */
    const felder = [];
    for (const treffer of html.matchAll(/<button\b[^>]*>/g)) {
        const tag = treffer[0];
        if (!/\bdata-action\s*=\s*"clear-search"/.test(tag)) continue;
        const wert = /\bdata-value\s*=\s*"([^"]*)"/.exec(tag);
        felder.push(wert ? wert[1] : '');
    }
    return felder;
}

const FELDER = felderAusDemBuendel();

/**
 * Die Saat: je Ansicht mit ✕ zwei Eintraege, von denen genau einer "gob"
 * enthaelt — so filtert "gob" jede Ansicht sichtbar (harte Vorbedingung in
 * jedem R2-Fall). Formen wie die Sonden der Messung, die alle 15 Felder damit
 * gefahren hat.
 */
function saat() {
    return {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            markdownOnboardingSeen: true,
            enableMarkdownShortcuts: true
        },
        randomTables: [],
        timers: [],
        campaign: {},
        characters: [
            {
                id: 1,
                name: 'Goblinjaeger Ark',
                characterClass: 'Waldlaeufer',
                race: 'Mensch',
                level: 3,
                attributes: { str: 10, dex: 16, con: 12, int: 10, wis: 14, cha: 8 },
                hpCurrent: 20,
                hpMax: 24,
                armorClass: 14,
                speed: '9m|30ft.',
                spells: [],
                items: [],
                conditions: [],
                tags: []
            },
            {
                id: 2,
                name: 'Zwergin Bria',
                characterClass: 'Kaempfer',
                race: 'Zwerg',
                level: 3,
                attributes: { str: 16, dex: 10, con: 15, int: 10, wis: 11, cha: 8 },
                hpCurrent: 30,
                hpMax: 30,
                armorClass: 18,
                speed: '7,5m|25ft.',
                spells: [],
                items: [],
                conditions: [],
                tags: []
            }
        ],
        npcs: [
            {
                id: 1,
                name: 'Gobbo der Haendler',
                role: 'Haendler',
                race: 'Goblin',
                description: '',
                tags: [],
                triggers: [],
                dialogs: [],
                relations: []
            },
            {
                id: 2,
                name: 'Alrik',
                role: 'Wirt',
                race: 'Mensch',
                description: '',
                tags: [],
                triggers: [],
                dialogs: [],
                relations: []
            }
        ],
        locations: [
            { id: 1, name: 'Goblinhoehle', type: 'Hoehle', description: '', tags: [] },
            { id: 2, name: 'Hafen', type: 'Viertel', description: '', tags: [] }
        ],
        quests: [
            {
                id: 1,
                title: 'Goblinplage',
                giverName: '',
                locationName: '',
                description: '',
                type: 'main',
                completed: false,
                tags: []
            },
            {
                id: 2,
                title: 'Die verlorene Fracht',
                giverName: '',
                locationName: '',
                description: '',
                type: 'side',
                completed: false,
                tags: []
            }
        ],
        encounters: [
            {
                id: 1,
                name: 'Goblin-Hauptmann',
                creatureType: 'humanoid',
                cr: '1',
                ac: 17,
                init: 2,
                hp: 21,
                speed: { walk: '9', climb: '', swim: '', fly: '', burrow: '' },
                languages: [],
                traits: '',
                actions: '',
                skills: '',
                tags: []
            },
            {
                id: 2,
                name: 'Ork-Spaeher',
                creatureType: 'humanoid',
                cr: '1/2',
                ac: 13,
                init: 1,
                hp: 15,
                speed: { walk: '9', climb: '', swim: '', fly: '', burrow: '' },
                languages: [],
                traits: '',
                actions: '',
                skills: '',
                tags: []
            }
        ],
        loot: [
            {
                id: 1,
                name: 'Goblinmesser',
                category: 'weapon',
                rarity: 'common',
                quantity: 1,
                value: 2,
                description: '',
                tags: [],
                assignedTo: ''
            },
            {
                id: 2,
                name: 'Heiltrank',
                category: 'potion',
                rarity: 'common',
                quantity: 3,
                value: 50,
                description: '',
                tags: [],
                assignedTo: ''
            }
        ],
        shops: [
            {
                id: 1,
                name: 'Goblinbasar',
                type: 'general',
                npcId: null,
                locationId: null,
                description: '',
                items: []
            },
            {
                id: 2,
                name: 'Zwergenschmiede',
                type: 'blacksmith',
                npcId: null,
                locationId: null,
                description: '',
                items: []
            }
        ],
        spells: [
            {
                id: 1,
                name: 'Goblinfluch',
                type: 'spell',
                level: 1,
                spellClasses: ['Hexenmeister'],
                school: 'Nekromantie',
                time: '1 Aktion',
                range: '18 m',
                duration: '1 Minute',
                ritual: false,
                v: true,
                g: true,
                m: false,
                material: '',
                description: '',
                note: ''
            },
            {
                id: 2,
                name: 'Feuerball',
                type: 'spell',
                level: 3,
                spellClasses: ['Magier'],
                school: 'Hervorrufung',
                time: '1 Aktion',
                range: '45 m',
                duration: 'Sofort',
                ritual: false,
                v: true,
                g: true,
                m: true,
                material: '',
                description: '',
                note: ''
            }
        ],
        sessionNotes: [
            {
                id: 1,
                name: 'Sitzung Goblins',
                date: '2026-10-01',
                content: '<p>Ueberfall im Wald</p>',
                summary: '',
                tags: []
            },
            {
                id: 2,
                name: 'Sitzung Hafen',
                date: '2026-10-08',
                content: '<p>Verrat im Kontor</p>',
                summary: '',
                tags: []
            }
        ],
        wiki: [
            {
                id: 1,
                title: 'Goblinstaemme',
                category: 'lore',
                content: '<p>Clans</p>',
                tags: [],
                pinned: false,
                parentId: null,
                createdAt: 1700000000000,
                updatedAt: 1700000000000
            },
            {
                id: 2,
                title: 'Goetter',
                category: 'lore',
                content: '<p>Pantheon</p>',
                tags: [],
                pinned: false,
                parentId: null,
                createdAt: 1700000000001,
                updatedAt: 1700000000001
            }
        ],
        wikiRecentlyViewed: [],
        links: [
            {
                id: 1,
                title: 'Goblin-Wiki',
                url: 'https://example.org/goblin',
                category: 'rules',
                description: ''
            },
            {
                id: 2,
                title: 'Regelwerk SRD',
                url: 'https://example.org/srd',
                category: 'rules',
                description: ''
            }
        ],
        filters: [],
        factions: [
            {
                id: 1,
                name: 'Goblinclan',
                symbol: '🗡',
                agenda: '',
                beschreibung: '',
                ruf: -3,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            },
            {
                id: 2,
                name: 'Handelsgilde',
                symbol: '⚖',
                agenda: '',
                beschreibung: '',
                ruf: 5,
                rufHistorie: [],
                mitgliederNpcIds: [],
                sitzOrtId: null,
                rivalen: '',
                verbuendete: '',
                links: []
            }
        ],
        sessionPreps: [
            {
                id: 1,
                strongStart: '<p>Goblins greifen an</p>',
                szenen: [],
                geheimeHinweise: '',
                wichtigeNpcs: '',
                belohnungen: '',
                sessionNr: 1,
                datum: '2026-10-01',
                inGameDatum: '',
                offeneFaeden: [],
                links: [],
                erstellt: 1700000000000
            },
            {
                id: 2,
                strongStart: '<p>Verrat im Kontor</p>',
                szenen: [],
                geheimeHinweise: '',
                wichtigeNpcs: '',
                belohnungen: '',
                sessionNr: 2,
                datum: '2026-10-08',
                inGameDatum: '',
                offeneFaeden: [],
                links: [],
                erstellt: 1700000000001
            }
        ],
        tags: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {
            day: 1,
            month: 1,
            year: 1492,
            events: [
                {
                    id: 1,
                    datum: { tag: 3, monat: 2, jahr: 1492 },
                    titel: 'Goblinueberfall',
                    beschreibung: '',
                    typ: 'manuell',
                    quelleId: null
                },
                {
                    id: 2,
                    datum: { tag: 10, monat: 2, jahr: 1492 },
                    titel: 'Sonnenfinsternis',
                    beschreibung: '',
                    typ: 'manuell',
                    quelleId: null
                }
            ]
        },
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 3,
            npcs: 3,
            locations: 3,
            quests: 3,
            encounters: 3,
            spells: 3,
            loot: 3,
            items: 1,
            wiki: 3,
            links: 3,
            sessionNotes: 3,
            randomTables: 1,
            filters: 1,
            factions: 3,
            sessionPreps: 3,
            calendarEvents: 3
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` (ohne Netzrauschen der Schriften unter file://) und Dialoge.
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0]);
        }
    });
    page.on('dialog', d => {
        fehler.push('dialog: ' + d.message());
        d.dismiss().catch(() => {});
    });
    return fehler;
}

/**
 * Saet (einmal je Tab, VOR dem Laden), laedt und wartet die fremde
 * Speicherung ab: `load()` repariert die Saat und plant ~1 s spaeter eine
 * Speicherung — sie soll nicht in die Beobachtung des Ereignislogs fallen.
 * Gewartet wird auf `appReady`, nicht auf `.app-title` (im Mobil-Layout
 * versteckt).
 * @param {import('@playwright/test').Page} page
 * @param {string} [url]
 */
async function laden(page, url = DEV) {
    const fehler = fehlerFangen(page);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (sessionStorage.getItem('suche-leeren-gesaet')) return;
                sessionStorage.setItem('suche-leeren-gesaet', '1');
                localStorage.setItem(schluessel, JSON.stringify(s));
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, saat()]
    );
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 15000
    });
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
            { timeout: 4000 }
        )
        .catch(() => {});
    return fehler;
}

/**
 * Mitte eines Elements und ob dort wirklich es selbst (oder ein Kind)
 * obenauf liegt. Fuer Klicks und Taps auf freie Koordinaten.
 * @param {import('@playwright/test').Page} page @param {string} sel
 */
function mitteFrei(page, sel) {
    return page.evaluate(s => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const x = Math.round(r.left + r.width / 2);
        const y = Math.round(r.top + r.height / 2);
        const oben = document.elementFromPoint(x, y);
        return { x, y, frei: !!oben && (oben === el || el.contains(oben)) };
    }, sel);
}

/**
 * Die Ansicht, in der ein Feld steht — aus dem geladenen Dokument gelesen
 * (`closest('.view')`), nicht abgetippt.
 * @param {import('@playwright/test').Page} page @param {string} feld
 * @returns {Promise<string>} z. B. "view-bestiary"
 */
async function ansichtVon(page, feld) {
    const id = await page.evaluate(f => {
        const el = document.getElementById(f);
        const v = el ? el.closest('.view') : null;
        return v ? v.id : '';
    }, feld);
    expect(id, `Vorbedingung: das Feld ${feld} steht in einer Ansicht (.view)`).toMatch(/^view-/);
    return id;
}

/**
 * Zur Ansicht ueber die ECHTE Navigation. Desktop: Gruppe aufklappen, Reiter
 * klicken. Telefon: Leiste per Tap ausfahren, Reiter auf freien Koordinaten
 * antippen, Leiste wieder einfahren.
 * @param {import('@playwright/test').Page} page @param {string} ansichtId
 */
async function zurAnsicht(page, ansichtId) {
    const ansicht = ansichtId.replace(/^view-/, '');
    const reiterSel = `.nav-tab[data-view="${ansicht}"]`;
    const mobil = await page.evaluate(() => document.documentElement.dataset.layout === 'mobile');
    if (mobil) {
        const u = await mitteFrei(page, '.mobile-nav-toggle');
        expect(u && u.frei, 'Vorbedingung: der Umschalter der Leiste ist frei').toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (u).x, /** @type {any} */ (u).y);
        await page.waitForTimeout(450);
        await page.locator(reiterSel).scrollIntoViewIfNeeded();
        let m = null;
        for (let i = 0; i < 40; i++) {
            m = await mitteFrei(page, reiterSel);
            if (m && m.frei) break;
            await page.waitForTimeout(150);
        }
        expect(m && m.frei, `Vorbedingung: der Reiter ${ansicht} ist frei`).toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (m).x, /** @type {any} */ (m).y);
        await expect(page.locator(`#${ansichtId}`)).toHaveClass(/\bactive\b/);
        await page.waitForTimeout(450);
        const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
        if (offen) {
            const u2 = await mitteFrei(page, '.mobile-nav-toggle');
            await page.touchscreen.tap(/** @type {any} */ (u2).x, /** @type {any} */ (u2).y);
            await page.waitForTimeout(450);
        }
        return;
    }
    const reiter = page.locator(reiterSel);
    if (!(await reiter.isVisible())) {
        await page.locator('.nav-group', { has: reiter }).locator('.nav-group-btn').click();
        await page.waitForTimeout(150);
    }
    await reiter.click();
    await expect(page.locator(`#${ansichtId}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(300);
}

/**
 * Was der Spielleiter an Feld und Ansicht sieht. Nur Ablesen.
 *  - ansichtText: der sichtbare Text der ganzen Ansicht (ein offener
 *    Aufklapp neben dem Feld gehoert dazu)
 *  - zaehler: die Zaehler der Werkzeugleiste
 *  - aufklapp: jedes weitere Kind des Feld-Behaelters ausser ✕ (heute nur
 *    der Wiki-Aufklapp), offen mit Text oder zu
 * @param {import('@playwright/test').Page} page @param {string} feld
 */
function ablesen(page, feld) {
    return page.evaluate(id => {
        const norm = (/** @type {string|null|undefined} */ t) =>
            (t || '').replace(/\s+/g, ' ').trim();
        const sichtbar = (/** @type {Element|null} */ el) =>
            !!el && el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
        const beschreibe = (/** @type {Element|null} */ el) => {
            if (!el) return 'nichts';
            const h = /** @type {HTMLElement} */ (el);
            let s = el.tagName + (el.id ? '#' + el.id : '');
            if (el.classList.length) s += '.' + Array.from(el.classList).join('.');
            if (h.dataset && h.dataset.value) s += '[' + h.dataset.value + ']';
            return s;
        };
        const input = /** @type {HTMLInputElement|null} */ (document.getElementById(id));
        const ansicht = input ? /** @type {HTMLElement|null} */ (input.closest('.view')) : null;
        const behaelter = input ? input.parentElement : null;
        const kreuz = behaelter ? behaelter.querySelector('.search-clear-btn') : null;
        const aufklapp = behaelter
            ? Array.from(behaelter.children)
                  .filter(k => k !== input && k !== kreuz)
                  .map(
                      k =>
                          (k.id || k.className) +
                          ':' +
                          (sichtbar(k)
                              ? 'offen ' + norm(/** @type {HTMLElement} */ (k).innerText)
                              : 'zu')
                  )
            : [];
        return {
            wert: input ? input.value : null,
            ansichtText: ansicht ? norm(ansicht.innerText) : '',
            zaehler: ansicht
                ? Array.from(ansicht.querySelectorAll('.section-toolbar-count'))
                      .map(z => z.id + '=' + norm(z.textContent))
                      .join(' ')
                : '',
            aufklapp: aufklapp.join(' | '),
            kreuzVisible: !!kreuz && kreuz.classList.contains('visible'),
            fokusImFeld: !!input && document.activeElement === input,
            // Sichtbar ist, worauf der Fokus sitzt — heute ein ✕ mit opacity 0.
            fokusSichtbar: sichtbar(document.activeElement),
            fokus: beschreibe(document.activeElement)
        };
    }, feld);
}

/**
 * Klick bzw. Tap mitten ins Feld (harte Vorbedingung: es liegt frei).
 * @param {import('@playwright/test').Page} page @param {string} feld @param {boolean} tap
 */
async function insFeld(page, feld, tap) {
    const m = await mitteFrei(page, '#' + feld);
    expect(m && m.frei, `Vorbedingung: das Feld ${feld} liegt frei`).toBe(true);
    const p = /** @type {{x: number, y: number}} */ (m);
    if (tap) await page.touchscreen.tap(p.x, p.y);
    else await page.mouse.click(p.x, p.y);
}

/** @param {import('@playwright/test').Page} page @param {string} text */
async function tippen(page, text) {
    await page.keyboard.type(text, { delay: 40 });
    await page.waitForTimeout(SETZEN_MS);
}

/**
 * Eine Stelle am Rand, an der die Maus nichts im Suchbereich beruehrt.
 * @param {import('@playwright/test').Page} page
 */
async function mausWeg(page) {
    const g = page.viewportSize() || BREIT;
    await page.mouse.move(g.width - 5, g.height - 5);
    await page.waitForTimeout(300);
}

/**
 * Bedient das ✕ des Feldes auf einem der vier Wege. Der Fokus steht vorher
 * im Feld (es wurde gerade getippt).
 *  - maus: hinfahren, klicken
 *  - tap: antippen
 *  - enter / leertaste: Maus weg, Tab (harte Vorbedingung: Tab fuehrt vom
 *    Feld auf genau dieses ✕), dann die Taste
 * @param {import('@playwright/test').Page} page @param {string} feld
 * @param {'maus'|'tap'|'enter'|'leertaste'} weg
 */
async function kreuzBedienen(page, feld, weg) {
    const sel = `[data-action="clear-search"][data-value="${feld}"]`;
    if (weg === 'maus' || weg === 'tap') {
        const m = await mitteFrei(page, sel);
        expect(m && m.frei, `Vorbedingung: das ✕ von ${feld} liegt frei`).toBe(true);
        const p = /** @type {{x: number, y: number}} */ (m);
        if (weg === 'tap') {
            await page.touchscreen.tap(p.x, p.y);
        } else {
            await page.mouse.move(p.x, p.y);
            await page.waitForTimeout(150);
            await page.mouse.click(p.x, p.y);
        }
    } else {
        await mausWeg(page);
        await page.keyboard.press('Tab');
        const aufKreuz = await page.evaluate(
            s => document.activeElement === document.querySelector(s),
            sel
        );
        expect(aufKreuz, `Vorbedingung: Tab fuehrt vom Feld ${feld} auf sein ✕`).toBe(true);
        await page.keyboard.press(weg === 'enter' ? 'Enter' : 'Space');
    }
    await page.waitForTimeout(SETZEN_MS);
}

/**
 * R2 fuer ein Feld auf einem Weg: Referenz "von Hand geleert", dann ✕.
 * Laesst die Seite mit dem Zustand nach ✕ zurueck.
 * @param {import('@playwright/test').Page} page @param {string} feld
 * @param {'maus'|'tap'|'enter'|'leertaste'} weg
 */
async function wieVonHandGeleert(page, feld, weg) {
    const ansicht = await ansichtVon(page, feld);
    await zurAnsicht(page, ansicht);
    const vorher = await ablesen(page, feld);
    await insFeld(page, feld, weg === 'tap');
    await tippen(page, 'gob');
    const gob = await ablesen(page, feld);
    expect(gob.wert, `Vorbedingung: "gob" steht im Feld ${feld}`).toBe('gob');
    expect(gob.ansichtText, `Vorbedingung: "gob" filtert ${ansicht} sichtbar`).not.toBe(
        vorher.ansichtText
    );
    for (let i = 0; i < 3; i++) await page.keyboard.press('Backspace');
    await page.waitForTimeout(SETZEN_MS);
    const vonHand = await ablesen(page, feld);
    expect(vonHand.wert, `Vorbedingung: ${feld} ist von Hand leer getippt`).toBe('');
    await tippen(page, 'gob');
    const gob2 = await ablesen(page, feld);
    expect(gob2.ansichtText, `Vorbedingung: "gob" filtert ${ansicht} erneut`).not.toBe(
        vonHand.ansichtText
    );

    await kreuzBedienen(page, feld, weg);
    const nach = await ablesen(page, feld);
    const wo = `R2 [${weg}] ${feld}:`;
    weich(nach.wert, `${wo} das Feld ist nach ✕ leer`).toBe('');
    weich(nach.zaehler, `${wo} die Zaehler zeigen, was sie leer getippt zeigen`).toBe(
        vonHand.zaehler
    );
    weich(nach.aufklapp, `${wo} der Aufklapp neben dem Feld ist wie leer getippt`).toBe(
        vonHand.aufklapp
    );
    weich(nach.kreuzVisible, `${wo} das ✕ verliert .visible`).toBe(false);
    weich(nach.ansichtText, `${wo} die Ansicht ist textgleich mit "leer getippt"`).toBe(
        vonHand.ansichtText
    );
    return { ansicht, nach };
}

/**
 * Was ein verirrter Tastendruck sichtbar ausloest: offene Dialoge, offene
 * Klappformulare, die Klasse des Ereignislogs (persistent?) und die seit
 * `logBeobachten` neu eingehaengten Eintraege. Nur Ablesen.
 * @param {import('@playwright/test').Page} page
 */
function lage(page) {
    return page.evaluate(() => {
        const sichtbar = (/** @type {Element} */ el) =>
            el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
        const name = (/** @type {Element} */ el) => el.id || String(el.className);
        const log = document.getElementById('event-log');
        const w = /** @type {any} */ (window);
        return {
            dialoge: Array.from(
                document.querySelectorAll(
                    '.modal, .modal-overlay, [role="dialog"], [role="alertdialog"]'
                )
            )
                .filter(sichtbar)
                .map(name),
            klappen: Array.from(document.querySelectorAll('.collapsible-content.open')).map(name),
            logKlasse: log ? log.className : '(kein Ereignislog)',
            logNeu: Array.isArray(w.__sucheLeerenLog)
                ? w.__sucheLeerenLog.slice()
                : ['(nicht beobachtet)']
        };
    });
}

/**
 * Passiver Beobachter: sammelt den Text jedes neu eingehaengten Eintrags im
 * Ereignislog (Wuerfelwurf, "Timer gestartet", …).
 * @param {import('@playwright/test').Page} page
 */
function logBeobachten(page) {
    return page.evaluate(() => {
        const w = /** @type {any} */ (window);
        w.__sucheLeerenLog = [];
        const log = document.getElementById('event-log');
        if (!log) return;
        new MutationObserver(ms => {
            for (const m of ms) {
                for (const n of Array.from(m.addedNodes)) {
                    const el = /** @type {HTMLElement} */ (n);
                    if (el.classList && el.classList.contains('event-log-entry')) {
                        w.__sucheLeerenLog.push((el.textContent || '').replace(/\s+/g, ' ').trim());
                    }
                }
            }
        }).observe(log, { childList: true, subtree: true });
    });
}

/**
 * R3 fuer ein Feld auf einem Weg: "gob", ✕, (Maus weg), Fokus pruefen, dann
 * ein Wort mit Kurztasten-Anfang tippen.
 * @param {import('@playwright/test').Page} page @param {string} feld
 * @param {'maus'|'tap'|'enter'} weg
 */
async function fokusNachKreuz(page, feld, weg) {
    const ansicht = await ansichtVon(page, feld);
    await zurAnsicht(page, ansicht);
    await insFeld(page, feld, weg === 'tap');
    await tippen(page, 'gob');
    const gob = await ablesen(page, feld);
    expect(gob.wert, `Vorbedingung: "gob" steht im Feld ${feld}`).toBe('gob');
    await kreuzBedienen(page, feld, weg);
    if (weg === 'maus') await mausWeg(page);

    const z = await ablesen(page, feld);
    const wo = `R3 [${weg}] ${feld}:`;
    weich(z.fokusImFeld, `${wo} nach ✕ steht der Fokus im Feld — er liegt auf ${z.fokus}`).toBe(
        true
    );
    weich(z.fokusSichtbar, `${wo} das fokussierte Element (${z.fokus}) ist sichtbar`).toBe(true);

    const wort = N_ANSICHTEN.has(ansicht) ? 'nils' : 'rat';
    await logBeobachten(page);
    const vor = await lage(page);
    await page.keyboard.type(wort, { delay: 60 });
    await page.waitForTimeout(600);
    const nach = await lage(page);
    const zWort = await ablesen(page, feld);
    weich(zWort.wert, `${wo} das getippte "${wort}" steht im Feld`).toBe(wort);
    weich(nach.dialoge, `${wo} "${wort}" oeffnet keinen Dialog`).toEqual(vor.dialoge);
    weich(nach.klappen, `${wo} "${wort}" klappt kein Formular auf`).toEqual(vor.klappen);
    weich(nach.logNeu, `${wo} "${wort}" schreibt nichts ins Ereignislog (d20, Timer)`).toEqual([]);
    weich(nach.logKlasse, `${wo} "${wort}" schaltet das Ereignislog nicht um`).toBe(vor.logKlasse);
}

/**
 * Der Zustand des Wiki-Suchfeldes, seines Aufklapps und des Baums.
 * @param {import('@playwright/test').Page} page
 */
function wikiLage(page) {
    return page.evaluate(feld => {
        const norm = (/** @type {string|null|undefined} */ t) =>
            (t || '').replace(/\s+/g, ' ').trim();
        const input = /** @type {HTMLInputElement|null} */ (document.getElementById(feld));
        const auf = /** @type {HTMLElement|null} */ (
            document.getElementById('wiki-search-dropdown')
        );
        const baum = /** @type {HTMLElement|null} */ (document.getElementById('wiki-tree'));
        const detail = /** @type {HTMLElement|null} */ (document.getElementById('wiki-detail'));
        const kreuz =
            input && input.parentElement
                ? input.parentElement.querySelector('.search-clear-btn')
                : null;
        const offen =
            !!auf && auf.checkVisibility({ opacityProperty: true, visibilityProperty: true });
        return {
            wert: input ? input.value : null,
            aufklappDisplay: auf ? getComputedStyle(auf).display : '(fehlt)',
            aufklappOffen: offen,
            // textContent, nicht innerText: die Markierung <mark> des Treffers
            // bricht im innerText das Wort ("Gob linstaemme").
            aufklappText: offen && auf ? norm(auf.textContent) : '',
            aufklappEintraege: auf ? auf.querySelectorAll('.search-result-item').length : 0,
            aufklappGewaehlt: auf ? auf.querySelectorAll('.search-result-item.selected').length : 0,
            baum: baum ? norm(baum.innerText) : '(fehlt)',
            detail: detail ? norm(detail.innerText) : '(fehlt)',
            kreuzVisible: !!kreuz && kreuz.classList.contains('visible')
        };
    }, WIKI_FELD);
}

// ───────────────────────────────────────────────────────────────────────────
// R2 — das ✕ wirkt wie das leer getippte Feld
// ───────────────────────────────────────────────────────────────────────────

test.describe('(W1) Maus, 1440x900: ✕ wirkt wie leer getippt', () => {
    test.use({ viewport: BREIT });
    for (const feld of FELDER) {
        test(`(W1) ${feld}`, async ({ page }) => {
            const fehler = await laden(page);
            const { ansicht } = await wieVonHandGeleert(page, feld, 'maus');

            // R5: das Verlassen des Feldes (Klick auf den App-Titel, eine
            // Flaeche ohne Aktion) zeichnet die Ansicht nicht noch einmal —
            // ein nachlaufendes change muss BESTIAR-KLICK R1 abfangen.
            await page.evaluate(id => {
                const w = /** @type {any} */ (window);
                w.__sucheLeerenMut = 0;
                const v = document.getElementById(id);
                if (!v) return;
                new MutationObserver(() => {
                    w.__sucheLeerenMut++;
                }).observe(v, { childList: true, subtree: true, characterData: true });
            }, ansicht);
            const titel = await mitteFrei(page, '.app-title');
            expect(titel && titel.frei, 'Vorbedingung: der App-Titel liegt frei').toBe(true);
            const t = /** @type {{x: number, y: number}} */ (titel);
            await page.mouse.click(t.x, t.y);
            await page.waitForTimeout(SETZEN_MS);
            const mut = await page.evaluate(() => /** @type {any} */ (window).__sucheLeerenMut);
            weich(mut, `R5 ${feld}: das Verlassen des Feldes nach ✕ zeichnet nicht erneut`).toBe(0);

            weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
        });
    }
});

test.describe('(W1p) prod-Buendel, Maus, 1440x900: ✕ wirkt wie leer getippt', () => {
    test('(W1p) alle Felder im prod-Buendel', async ({ browser }) => {
        test.skip(
            !PROD_DA,
            'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)'
        );
        test.setTimeout(30000 + FELDER.length * 20000);
        for (const feld of FELDER) {
            const kontext = await browser.newContext({ viewport: BREIT });
            const page = await kontext.newPage();
            try {
                const fehler = await laden(page, PROD);
                await wieVonHandGeleert(page, feld, 'maus');
                weich(fehler, `${feld}: kein pageerror, kein console.error, kein Dialog`).toEqual(
                    []
                );
            } finally {
                await kontext.close();
            }
        }
    });
});

test.describe('(W2) Tastatur, 1440x900: Tab auf ✕, Enter', () => {
    test.use({ viewport: BREIT });
    for (const feld of FELDER) {
        test(`(W2) ${feld}`, async ({ page }) => {
            const fehler = await laden(page);
            await wieVonHandGeleert(page, feld, 'enter');
            weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
        });
    }
});

test.describe('(W2b) Tastatur, 1440x900: Tab auf ✕, Leertaste', () => {
    test.use({ viewport: BREIT });
    for (const feld of FELDER) {
        test(`(W2b) ${feld}`, async ({ page }) => {
            const fehler = await laden(page);
            await wieVonHandGeleert(page, feld, 'leertaste');
            weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
        });
    }
});

test.describe('(W3) Telefon 390x844, Tap auf ✕', () => {
    test.use({ viewport: TELEFON, isMobile: true, hasTouch: true });
    for (const feld of FELDER) {
        test(`(W3) ${feld}`, async ({ page }) => {
            const fehler = await laden(page);
            const layout = await page.evaluate(() => document.documentElement.dataset.layout);
            expect(layout, 'Vorbedingung: das Telefon-Layout greift').toBe('mobile');
            await wieVonHandGeleert(page, feld, 'tap');
            weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
        });
    }
});

// ───────────────────────────────────────────────────────────────────────────
// R3 — der Fokus steht nach ✕ im Feld, und Weitertippen loest nichts aus
// ───────────────────────────────────────────────────────────────────────────

for (const [weg, groesse] of /** @type {const} */ ([
    ['maus', BREIT],
    ['enter', BREIT],
    ['tap', TELEFON]
])) {
    test.describe(`(W4) Fokus nach ✕ — ${weg}`, () => {
        test.use(
            weg === 'tap'
                ? { viewport: groesse, isMobile: true, hasTouch: true }
                : { viewport: groesse }
        );
        for (const feld of FELDER) {
            test(`(W4) ${weg} ${feld}`, async ({ page }) => {
                const fehler = await laden(page);
                await fokusNachKreuz(page, feld, weg);
                weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
            });
        }
    });
}

test.describe('(W4p) prod-Buendel, Maus, 1440x900: Fokus nach ✕', () => {
    test('(W4p) alle Felder im prod-Buendel', async ({ browser }) => {
        test.skip(
            !PROD_DA,
            'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)'
        );
        test.setTimeout(30000 + FELDER.length * 20000);
        for (const feld of FELDER) {
            const kontext = await browser.newContext({ viewport: BREIT });
            const page = await kontext.newPage();
            try {
                const fehler = await laden(page, PROD);
                await fokusNachKreuz(page, feld, 'maus');
                weich(fehler, `${feld}: kein pageerror, kein console.error, kein Dialog`).toEqual(
                    []
                );
            } finally {
                await kontext.close();
            }
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────
// Wiki — der Aufklapp (W5) und der Enter-Weg im Aufklapp (W7, R8)
// ───────────────────────────────────────────────────────────────────────────

test.describe('Wiki-Suchfeld', () => {
    test.use({ viewport: BREIT });

    test('(W5) ✕ schliesst den Aufklapp und zeichnet den Baum wie leer getippt', async ({
        page
    }) => {
        expect(FELDER, 'Vorbedingung: das Wiki-Suchfeld hat ein ✕ im Buendel').toContain(WIKI_FELD);
        const fehler = await laden(page);
        await zurAnsicht(page, await ansichtVon(page, WIKI_FELD));
        await insFeld(page, WIKI_FELD, false);
        await tippen(page, 'gob');
        const gob = await wikiLage(page);
        expect(gob.aufklappOffen, 'Vorbedingung: "gob" oeffnet den Aufklapp').toBe(true);
        expect(gob.aufklappText, 'Vorbedingung: der Aufklapp zeigt den Treffer').toContain(
            'Goblinstaemme'
        );
        for (let i = 0; i < 3; i++) await page.keyboard.press('Backspace');
        await page.waitForTimeout(SETZEN_MS);
        const vonHand = await wikiLage(page);
        expect(vonHand.aufklappOffen, 'Vorbedingung: leer getippt schliesst den Aufklapp').toBe(
            false
        );
        await tippen(page, 'gob');

        await kreuzBedienen(page, WIKI_FELD, 'maus');
        const nach = await wikiLage(page);
        weich(nach.wert, 'das Feld ist leer').toBe('');
        weich(nach.aufklappDisplay, 'R2: #wiki-search-dropdown ist nach ✕ display:none').toBe(
            'none'
        );
        weich(nach.aufklappText, 'R2: kein alter Treffer bleibt sichtbar').toBe('');
        weich(nach.baum, 'R2: der Baum ist wie leer getippt').toBe(vonHand.baum);
        weich(nach.kreuzVisible, 'das ✕ verliert .visible').toBe(false);
        weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
    });

    test('(W7) Enter im Aufklapp: Feld, Baum und ✕ stimmen ueberein (R8)', async ({ page }) => {
        const fehler = await laden(page);
        await zurAnsicht(page, await ansichtVon(page, WIKI_FELD));
        await insFeld(page, WIKI_FELD, false);
        await tippen(page, 'gob');
        const gob = await wikiLage(page);
        expect(
            gob.aufklappEintraege,
            'Vorbedingung: "gob" zeigt Treffer im Aufklapp'
        ).toBeGreaterThan(0);
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(150);
        const gewaehlt = await wikiLage(page);
        expect(gewaehlt.aufklappGewaehlt, 'Vorbedingung: Pfeil runter markiert einen Treffer').toBe(
            1
        );
        await page.keyboard.press('Enter');
        await page.waitForTimeout(SETZEN_MS);
        const nachEnter = await wikiLage(page);
        // Kontrolle (heute gruen): der Treffer ist geoeffnet.
        weich(nachEnter.detail, 'Kontrolle: Enter oeffnet den markierten Eintrag').toContain(
            'Goblinstaemme'
        );

        // Referenz: was die Aktion des Feldes bei leerem Begriff zeichnet —
        // ins Feld, "x" tippen, Ruecktaste.
        await insFeld(page, WIKI_FELD, false);
        await tippen(page, 'x');
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(SETZEN_MS);
        const vonHand = await wikiLage(page);
        expect(vonHand.wert, 'Vorbedingung: die Referenz ist leer getippt').toBe('');

        weich(nachEnter.wert, 'R8: Enter leert das Feld (Entscheidung: leeren wie ✕)').toBe('');
        weich(
            nachEnter.baum,
            'R8: der Baum ist danach der leer getippte, nicht der "gob"-Baum'
        ).toBe(vonHand.baum);
        weich(nachEnter.kreuzVisible, 'R8: das ✕ verliert bei leerem Feld .visible').toBe(false);
        weich(nachEnter.aufklappOffen, 'R8: der Aufklapp ist zu').toBe(false);
        weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
    });
});

// ───────────────────────────────────────────────────────────────────────────
// R4 statisch — jedes ✕ im Buendel laesst sich aufloesen (Ratsche)
// ───────────────────────────────────────────────────────────────────────────

test.describe('(W6) Struktur', () => {
    test.use({ viewport: BREIT });

    test('(W6) jedes ✕ nennt ein Textfeld mit registrierter Aktion; die Liste ist die des Dokuments', async ({
        page
    }) => {
        expect(
            FELDER.length,
            `Die Feldliste aus ${DEV_DATEI} ist leer — fehlt das Buendel (python build.py)? ` +
                'Ohne Liste misst diese Datei nichts.'
        ).toBeGreaterThan(0);
        const fehler = await laden(page);
        const befund = await page.evaluate(() => {
            const textartig =
                typeof TEXTARTIGE_INPUT_TYPEN !== 'undefined'
                    ? Array.from(TEXTARTIGE_INPUT_TYPEN)
                    : null;
            const w = /** @type {any} */ (window);
            const knoepfe = Array.from(
                document.querySelectorAll('[data-action="clear-search"]')
            ).map(k => {
                const wert = /** @type {HTMLElement} */ (k).dataset.value || '';
                const el = wert ? document.getElementById(wert) : null;
                /** @type {string[]} */
                const maengel = [];
                if (!wert) {
                    maengel.push('ohne data-value');
                } else if (!el) {
                    maengel.push('kein Element mit dieser ID');
                } else {
                    const input = /** @type {HTMLInputElement} */ (el);
                    if (el.tagName !== 'INPUT') {
                        maengel.push('kein INPUT, sondern ' + el.tagName);
                    } else if (
                        !textartig ||
                        !textartig.includes((input.type || '').toLowerCase())
                    ) {
                        maengel.push('INPUT nicht textartig: type=' + input.type);
                    }
                    if (
                        !el.parentElement ||
                        el.parentElement.querySelector('.search-clear-btn') !== k
                    ) {
                        maengel.push(
                            'das ✕ ist nicht der .search-clear-btn im Behaelter des Feldes — ' +
                                'updateSearchClear schaltet es nie'
                        );
                    }
                    const aktion = input.dataset.action || '';
                    if (!aktion) maengel.push('Feld ohne data-action');
                    else if (!EventDelegation.hasAction(aktion)) {
                        maengel.push('data-action nicht registriert: ' + aktion);
                    }
                    if (
                        aktion === 'search-input' &&
                        typeof w[input.dataset.render || ''] !== 'function'
                    ) {
                        maengel.push('data-render ist keine Funktion: ' + input.dataset.render);
                    }
                }
                return { wert, maengel };
            });
            return {
                textartig,
                kreuzRegistriert: EventDelegation.hasAction('clear-search'),
                knoepfe
            };
        });
        expect(
            befund.textartig,
            'Vorbedingung: TEXTARTIGE_INPUT_TYPEN ist im Buendel lesbar'
        ).not.toBeNull();
        weich(befund.kreuzRegistriert, 'die Aktion clear-search ist registriert').toBe(true);
        weich(
            befund.knoepfe.map(k => k.wert),
            'die aus der Buendeldatei gelesene Liste ist die des geladenen Dokuments ' +
                '(kein ✕ wird zur Laufzeit hinzugefuegt, keines fehlt)'
        ).toEqual(FELDER);
        weich(
            befund.knoepfe.filter(k => k.maengel.length > 0),
            'jedes ✕ nennt ein textartiges INPUT mit registrierter Aktion (R4)'
        ).toEqual([]);
        weich(fehler, 'kein pageerror, kein console.error, kein Dialog').toEqual([]);
    });
});
