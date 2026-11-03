// @ts-check
/**
 * Verweise beim Reiter-Import: Hinzufuegen, Ersetzen, offene Formulare
 * (REITERIMPORT R5, R6, R7)
 * ====================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **was der 📥 eines Reiters
 * hereinholt, zeigt nie still auf einen fremden Eintrag** — beim Hinzufuegen
 * zeigen Verweise innerhalb des Typs auf die mitimportierten Kopien, Verweise
 * auf andere Bereiche sind geleert und die Vorschau hat sie vorher gezaehlt;
 * beim Ersetzen nennt die Vorschau, wie viele Eintraege ersetzt werden und wie
 * viele Verweise anderer Bereiche danach ins Leere zeigen; und ein offenes
 * oder liegengebliebenes Bearbeiten-Formular des Typs ueberschreibt danach
 * keinen importierten Eintrag.
 *
 * Der Branch REITERIMPORT setzt auf SENKEN auf (8702f84a, Ausgabe kodiert,
 * Datengrenze an jedem Eingang); am Rot-Nachweis zu a9858d23 war das
 * Fehlerbild dieser Datei dort dasselbe wie am Buendel 020e258 unten.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu 020e258, 1440x900. Ueber die Oberflaeche importiert
 * der 📥 heute GAR NICHTS: `importData()` ignoriert die gewaehlte Datei und
 * oeffnet einen zweiten Dateidialog, und `#import-modal` gibt es im Buendel
 * nicht (seit der TS-Migration baut es niemand mehr). Jeder Import-Fall hier
 * ist darum heute am Fenster rot. Die Messung hat das Fenster zur Laufzeit
 * nachgebaut und nur den Code der App laufen lassen; was dann geschieht —
 * also das, was ein Fix bekaeme, der NUR das Fenster wiederherstellt:
 *
 *   Hinzufuegen in eine FREMDE     executeImport() setzt nur `id` neu. Alle
 *   Kampagne (andere Eintraege     Verweisfelder behalten die Zahlen der
 *   unter denselben IDs)           Quelle: Quest.giverId 1 → "Fremder
 *                                  Haendler" (die Questkarte zeigt ihn),
 *                                  locationId 2 → "Sumpf", NPC.locationId 1 →
 *                                  "Eiswueste" (die NPC-Karte zeigt ihn),
 *                                  NPC-Beziehung npc:2 → "Hexe Morla",
 *                                  Charakter.spells [1] → "Heilen", Wiki
 *                                  "Goetter" haengt unter "Fremde Chronik"
 *   Hinzufuegen in DIESELBE        die Kopien zeigen auf die ORIGINALE: die
 *   Kampagne                       Kopie von Alrik → Beziehung auf die
 *                                  Original-Vela, die Kopie von "Goetter" →
 *                                  Eltern die Original-"Weltwissen"
 *   Vorschau                       nur Kampagne, Datum, "Einträge: N", Typ —
 *                                  kein Wort ueber Verweise, beim Ersetzen
 *                                  nicht, wie viele ersetzt werden
 *   ✏️ Charakter 1 offen →         das Klappformular bleibt offen mit
 *   Ersetzen (id 1 ist jetzt       `edit-char-id=1`; "Speichern" schreibt
 *   "Mira (aus Datei)")            Thorin ueber Mira, Meldung "Charakter
 *                                  aktualisiert" (`party-crud.js`, Spread auf
 *                                  denselben Index; der Schutz fuer verwaiste
 *                                  IDs greift nicht, die ID gehoert jetzt
 *                                  einem ANDEREN Eintrag). Encounter: dasselbe
 *                                  Muster (`encounters-crud.js`)
 *
 * Quellen der Messung: Sonden "datenpfad" c-querverweise und d-ersetzen-undo,
 * "kritik" K3. Der Katalog nennt die Fundstellen, `docs/bugfixes.md`,
 * REITERIMPORT.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag REITERIMPORT, docs/bugfixes.md), die diese Datei prueft
 *
 *   R5  Hinzufuegen: jeder Eintrag bekommt eine neue ID; Verweise INNERHALB
 *       des Typs (NPC-Beziehungen NPC→NPC, Verknuepfungen desselben Typs —
 *       NPC→NPC und Quest→Quest —, Wiki-Eltern) zeigen auf die neuen IDs;
 *       Verweise auf ANDERE Bereiche sind geleert, und die Vorschau nennt vor
 *       dem Import, welche und wie viele. Kein Verweis zeigt still auf einen
 *       fremden Eintrag — weder in derselben (1-4) noch in einer fremden
 *       Kampagne (5, 6). Dazu gehoert der interne Verweis, dessen Ziel NICHT
 *       in der Datei liegt (Brom → NPC 7, in der Quelle geloescht): er ist zu
 *       leeren, nicht mit seiner alten ID stehenzulassen — die zeigt in der
 *       Zielkampagne auf wen auch immer dort 7 ist (oder spaeter wird).
 *   R6  Ersetzen: die Vorschau nennt, wie viele Eintraege ersetzt werden und
 *       wie viele Verweise anderer Bereiche danach auf fehlende IDs zeigen —
 *       Feldverweise UND Verknuepfungen (`links[]`) anderer Eintraege (7 NPCs,
 *       8 Orte). Abgelehnte IDs und die Sicherheitskopie gehoeren anderen
 *       Dateien.
 *   R7  Ein offenes oder liegengebliebenes Bearbeiten-Formular des Typs wird
 *       beim Import geleert oder geschlossen; ein spaeteres Speichern
 *       ueberschreibt keinen importierten Eintrag (9 Party, 10 Quest,
 *       11 Encounter, 12 die Link-Karte — sie ist weder Modal noch
 *       Klappformular, steht unter dem 📥 und ueberschrieb gemessen genauso).
 *       Auch nicht nach Strg+Z oder Strg+Y: beide tauschen beim Ersetzen aus,
 *       welcher Eintrag hinter einer ID steht (15-18, Party ueber die Tasten,
 *       Encounter ueber ↩️/↪️ — Befund der Pruefer, Runde 1, Stand a3822abf).
 *   Kontrollen: (13) Export und Dateiwahl tragen, was die Faelle brauchen;
 *   (14) die Speicher-Wege der Formulare schreiben wirklich — sonst waere
 *   "der importierte Eintrag bleibt unveraendert" in 9-12 billig.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER VERWEISKATALOG DIESER DATEI — aus dem Code gelesen, nicht erfunden
 *
 *   NPC      locationId → Orte, factionId → Fraktionen, filterId → Filter
 *            (`D.filters`, im NPC-Formular "Filter" — nicht das Freitextfeld
 *            "Kapitel"; `npc-popup.js` zeigt ihn, ✏️ waehlt ihn vor),
 *            relations[] (targetType 'characters') → Charaktere,
 *            links[] eines anderen Typs (`systems/entity-links.js`);
 *            INTERN: relations[] 'npcs', links[] 'npcs'
 *            (`npc-render.js` addRelation(): targetType ist 'npcs' bzw.
 *            'characters', NICHT 'npc'/'character' wie in der Datenpfad-Saat;
 *            'party' traegt keine ID und kommt hier nicht vor)
 *   Quest    giverId → NPCs, locationId → Orte, targetId → Orte (das "Ziel"
 *            ist ein ZIELORT: `quests-crud.js` populateQuestSelects(),
 *            `quests-render.js` renderEntityLink('locations', q.targetId) —
 *            die Datenpfad-Saat fuehrte es als NPC), rewardItems[].id → Loot,
 *            links[] eines anderen Typs; INTERN: links[] 'quests'
 *   Charakter spells[] → Zauber, items[].id → Loot (`party-render.js`)
 *   Fraktion sitzOrtId → Orte, mitgliederNpcIds[] → NPCs
 *   Wiki     INTERN: parentId (`wiki-crud.js`)
 *   Jeder Typ: links[] desselben Typs ist INTERN, jedes andere links[] fremd.
 *   Verknuepfungen sind beidseitig (`addEntityLink()` schreibt Quelle UND
 *   Ziel), die Saaten halten das ein.
 *   Orte haben KEINEN Eltern-Verweis (kein parentId im Quellbaum); ihr
 *   filterId wird nicht geprueft (es gibt keinen Orts-Fall beim Hinzufuegen).
 *   HAENGENDE interne Verweise sind normal: `deleteNPC()` (ueber
 *   `deleteWithConfirm()`) raeumt Beziehungen und Verknuepfungen ANDERER NPCs
 *   nicht auf. Die Quelle traegt darum einen (Brom → NPC 7).
 *   "Geleert" heisst: das Feld ist leer (null, '', 0, fehlt) bzw. die Liste
 *   traegt keinen Eintrag mit ID mehr — ob der Fix den Eintrag entfernt oder
 *   seine ID auf null setzt, entscheidet er.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WIE DIE VORSCHAU GELESEN WIRD
 *
 * Die Vorschau ist `#import-info` (Oberflaechen-Vertrag), gelesen NACH der
 * Wahl des Modus und VOR "Importieren". Ihre Woerter legt der Fix fest; die
 * Faelle verlangen nur das Wesentliche, zeilenweise (`innerText`):
 *   - Fremdverweise (R5, R6): eine Zeile mit "Verweis", "Verknüpf" oder
 *     "Bezug" nennt die GESAMTZAHL als eigene Zahl — oder, ab der ersten
 *     solchen Zeile, steht jedes Feld bzw. jeder Bereich mit seiner Zahl da.
 *     "Welche" (R5): ab dieser Zeile kommt jedes betroffene Feld mit seinem
 *     Wort vor (Ort, Fraktion, Filter, Zauber …, siehe FREMDVERWEISE).
 *     Zaehlt der Fix die geleerten HAENGENDEN internen Verweise in die
 *     Gesamtzahl mit, ist auch diese Summe recht (NPCs: 5 fremd, 6 mit dem
 *     haengenden) — der Vertrag sagt dazu nichts, und beide Zahlen sind von
 *     den Eintraegen (3) und den internen Verweisen (7 bzw. 8) verschieden.
 *   - Ersetzte Eintraege (R6): eine Zeile mit "ersetz" (oder "überschreib",
 *     "verlor", "entfern", "lösch") nennt die Zahl der VORHANDENEN Eintraege,
 *     die ersetzt werden — das ist es, was der Nutzer verliert. "Einträge: 2"
 *     (die Datei) zeigt die Vorschau schon heute.
 * Die Saaten sind so gebaut, dass die gesuchten Zahlen sich von allen anderen
 * der Vorschau unterscheiden (Eintraege, interne Verweise), damit kein
 * Zufallstreffer gruen macht.
 *
 * WOHER DIE DATEIEN KOMMEN: R5 nimmt den ECHTEN Export der Quelle (📤, der
 * Download wird abgefangen) — so, wie ein Nutzer dupliziert oder eine Kampagne
 * in die andere traegt. Die erwartete Zahl der Fremdverweise wird aus DIESER
 * Datei berechnet, nicht aus der Saat: ob der Export alle Felder schreibt, ist
 * R4 und Sache einer anderen Datei; R5 soll an R4 nicht mitrot werden. R6 und
 * R7 bauen ihre Datei im Test (eine Datei "aus einer anderen Runde").
 *
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei), je gegen eine Kopie des
 * Buendels mit eingespieltem Skript:
 *   HALBER FIX — das Fenster steht statisch im Dokument, `importData()` liest
 *   die gewaehlte Datei (ein Dialog), alles andere wie heute: alle zwoelf
 *   Faelle rot, jeder an seiner Regel, KEINER mehr am Fenster. (1)-(6): Vorschau ohne
 *   Verweis-Zeile; die Kopien zeigen auf "… (vorher da)" — in (1)/(2) das
 *   Original, in (5)/(6) der fremde Eintrag —, `locationId: 1` und die
 *   Charakter-Beziehung tragen weiter ihre ID; die Alrik-Karte nennt
 *   "Eiswueste", ihr Detail "Hexe Morla", die Questkarte "Fremder Haendler"
 *   und "Sumpf". (7)/(8): die Vorschau nennt nur "Einträge: N". (9)/(11): das
 *   Formular steht offen mit ID 1, "Speichern" schreibt Thorin ueber Mira
 *   ("success: Charakter aktualisiert") bzw. den Goblin ueber den Oger.
 *   (10): `#edit-quest-id` bleibt "1". (12): die Link-Karte steht mit ID 1,
 *   "Speichern" schreibt "Regelwerk" ueber das Bestiarium.
 *   FIX-SKIZZE — ganzer Export, Umschreiben und Leeren beim Hinzufuegen,
 *   Zahlen in der Vorschau, die Formulare des Typs beim Import leeren: alle
 *   gruen. Die Kontrollen sind in allen Staenden gruen.
 *   NACHSCHAERFUNG (Skeptiker): eine erste Fassung war gegen FUENF halbe Fixes
 *   gruen, die den Vertrag brechen — jede Variante ist die Fix-Skizze mit
 *   EINER Luecke, und jede ist jetzt rot an genau ihrer Stelle:
 *     - interner Verweis ohne Ziel in der Datei behaelt seine alte ID
 *       (`map.get(id) ?? id`) → (1), (5) an Brom → NPC 7
 *     - Verknuepfungen desselben Typs nur bei NPCs umgeschrieben → (3), (6)
 *       an Quest ↔ Quest
 *     - die Link-Karte beim Import nicht geleert → (12): "Speichern" schrieb
 *       den bearbeiteten Link ueber den importierten ("Link aktualisiert")
 *     - beim Ersetzen nur Feldverweise gezaehlt, nicht `links[]` → (7)
 *     - Filter (`filterId`) geleert, aber in der Vorschau nicht genannt →
 *       (1), (5)
 *   Und ein GUELTIGER Fix-Weg war rot: verwirft ✕ die Quest-Bearbeitung
 *   gleich beim Schliessen, liegt nichts mehr, was der Import leeren muesste —
 *   (10) und die Kontrolle verlangten aber, dass ✕ die ID liegen laesst. Das
 *   ist jetzt eine Notiz, keine Zusicherung.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Ein Dialog, Meldungen, Pruefung kaputter Dateien, Feldtreue, Ansicht/Undo,
 * Sicherheit, Telefon (R1-R4, R8-R10) — eigene Dateien. Verweise von
 * Session-Prep (`offeneFaeden[].quelleId`) und Kalender (`quelleId`), die
 * Verweise der Typen ohne eigenen Fall hier (Orte, Loot, Zauber, Encounter:
 * nur `filterId` bzw. `links[]`), Beziehungen auf "Die Gruppe", Dubletten
 * beim Hinzufuegen (nicht in diesem PR). OFFEN IM VERTRAG: Text-Verknuepfungen
 * `[[typ:id:name]]` in Beschreibungen (`parseEntityLinks()`, eingefuegt ueber
 * "🔗 Entity-Link") sind ebenfalls ID-Verweise; R5 sagt nicht, ob sie
 * umgeschrieben, entfernt oder gezaehlt werden — darum hier kein Fall. (Der
 * Fix wendet auf sie dieselbe Regel an wie auf jeden anderen Verweis:
 * innerhalb des Typs umgeschrieben, sonst bleibt nur der Name als Text, und
 * die Vorschau zaehlt sie mit. Den Katalog des Fixes — weiter als der dieser
 * Datei: auch Session-Prep, Kalender, Encounter-Gruppen, Shops und Initiative
 * als Quellen fuer R6 — haelt tests/unit/reiterimport-verweise.test.js an
 * einer Saat aller zwoelf Typen fest.) Das
 * Quest-Formular ist ein Modal: bei offenem Modal ist der 📥 dahinter nicht
 * bedienbar, darum prueft (10) die LIEGENGEBLIEBENE Bearbeiten-ID (✏️ → ✕).
 * Deren sichtbarer Folgeweg "+ Quest" leert schon heute (showNewQuestModal(),
 * ABBRUCH); rot gegen den halben Fix ist (10) an der Zusage "beim Import
 * geleert". Ein zugeklapptes Klappformular (Party, Encounter) mit
 * liegengebliebener ID ist schon heute harmlos: `toggleCollapse()` verwirft
 * den Rest beim Aufklappen (`KLAPPFORMULAR_BEARBEITEN`), darum genuegt dort
 * "geschlossen".
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung; das NPC-Detail steht erst ueber 900 px. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Wie lange Dateidialog und Fenster brauchen duerfen. */
const FENSTER_MS = 5000;

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Typ → Ansicht (data-view der Navigation). */
const ANSICHT = {
    characters: 'party',
    npcs: 'npcs',
    locations: 'locations',
    quests: 'quests',
    encounters: 'encounter',
    wiki: 'wiki',
    factions: 'fraktionen',
    links: 'links'
};

// ===========================================================================
// SAATEN
// ===========================================================================

/**
 * Vollstaendige Kampagne um die Sammlungen herum (Muster:
 * link-anlegen.spec.js seed()), `_nextId` aus den Saaten berechnet.
 * @param {Record<string, any>} teile
 */
function kampagne(teile) {
    /** @type {Record<string, any>} */
    const k = {
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
        npcs: [],
        locations: [],
        quests: [],
        loot: [],
        spells: [],
        wiki: [],
        links: [],
        filters: [],
        factions: [],
        sessionPreps: [],
        tags: [],
        sessionNotes: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        ...structuredClone(teile)
    };
    /** @param {any[]} arr */
    const naechste = arr => Math.max(0, ...(arr || []).map(x => x.id)) + 1;
    k._nextId = {
        characters: naechste(k.characters),
        npcs: naechste(k.npcs),
        locations: naechste(k.locations),
        quests: naechste(k.quests),
        encounters: naechste(k.encounters),
        spells: naechste(k.spells),
        loot: naechste(k.loot),
        items: 1,
        wiki: naechste(k.wiki),
        links: naechste(k.links),
        sessionNotes: 1,
        randomTables: 1,
        filters: naechste(k.filters),
        factions: naechste(k.factions),
        sessionPreps: 1,
        calendarEvents: 1
    };
    return k;
}

/** Ein Charakter mit den Feldern, die saveCharacter() schreibt und
 *  editChar() liest (`speed` als Text — sonst wirft ✏️). */
const THORIN = {
    id: 1,
    name: 'Thorin',
    playerName: 'Arthur',
    characterClass: 'Kaempfer',
    subclass: 'Champion',
    race: 'Zwerg',
    level: 5,
    background: 'Soldat',
    alignment: 'RG',
    attributes: { str: 16, dex: 12, con: 15, int: 10, wis: 11, cha: 8 },
    saveProficiencies: { str: true, dex: false, con: true, int: false, wis: false, cha: false },
    hpCurrent: 40,
    hpMax: 44,
    tempHp: 0,
    armorClass: 18,
    initiative: 1,
    speed: '7,5 m',
    proficiencyBonus: 3,
    passivePerception: 12,
    languages: ['common', 'dwarvish'],
    spellSlots: { 0: { max: 0, current: 0 }, 1: { max: 2, current: 1 } },
    notes: '<p>Notizen Thorin</p>',
    spells: [1, 2],
    items: [{ id: 1, quantity: 1 }],
    conditions: [],
    tags: []
};
const KIRA = {
    ...THORIN,
    id: 2,
    name: 'Kira',
    playerName: 'Bea',
    characterClass: 'Schurkin',
    subclass: '',
    race: 'Halbling',
    level: 4,
    notes: '',
    spells: [],
    items: []
};

/** Ein Encounter mit den Feldern, die saveEncounter() schreibt. */
const GOBLIN = {
    id: 1,
    name: 'Goblin-Hauptmann',
    creatureType: 'humanoid',
    cr: '1',
    ac: 17,
    init: 2,
    hp: 21,
    speed: { walk: '9', climb: '', swim: '', fly: '', burrow: '' },
    perception: 9,
    languages: ['common', 'goblin'],
    str: 10,
    dex: 14,
    con: 10,
    int: 10,
    wis: 8,
    cha: 10,
    savingThrows: { dex: true },
    resistances: [],
    immunities: [],
    conditionImmunities: [],
    traits: '<p>Flink</p>',
    equipment: '<p>Kettenhemd</p>',
    actions: '<p>Krummsaebel</p>',
    skills: '',
    tags: []
};

/**
 * DIE QUELLE (R5): in jedem Typ Verweise innerhalb des Typs UND auf andere
 * Bereiche. Die Zahlen sind so gewaehlt, dass Fremdverweise, interne Verweise
 * und Eintraege je Typ verschieden sind (siehe Kopf, "Wie die Vorschau
 * gelesen wird") — bei vollem Export:
 *   NPCs     3 Eintraege, 7 intern mit Ziel in der Datei (3 Beziehungen,
 *            4 Verknuepfungen), 1 haengend (Brom → NPC 7, geloescht),
 *            5 fremd (Ort, Fraktion, Filter, Beziehung → Charakter,
 *            Verknuepfung → Quest)
 *   Quests   3 Eintraege, 2 intern (Verknuepfung Fracht ↔ Botengang),
 *            5 fremd (Geber, Ort, Zielort, Belohnungs-Item, Verknuepfung → NPC)
 *   Charaktere 2 Eintraege, 3 fremd (2 Zauber, 1 Gegenstand)
 *   Fraktionen 2 Eintraege, 3 fremd (Sitz, 2 Mitglieder)
 *   Wiki     3 Eintraege, Kette Weltwissen ← Goetter ← Pantheon
 */
const QUELLE = {
    filters: [{ id: 1, name: 'Kapitel Hafen', color: '#4a90d9' }],
    locations: [
        { id: 1, name: 'Hafenstadt', description: '<p>Hafen</p>', filterId: null, tags: [] },
        { id: 2, name: 'Turmruine', description: '', filterId: null, tags: [] }
    ],
    factions: [
        {
            id: 1,
            name: 'Handelsgilde',
            symbol: '⚖',
            agenda: '<p>Handel</p>',
            beschreibung: '',
            ruf: 12,
            rufHistorie: [],
            mitgliederNpcIds: [1, 2],
            sitzOrtId: 1,
            rivalen: 'Diebe',
            verbuendete: '',
            links: []
        },
        {
            id: 2,
            name: 'Stadtwache',
            symbol: '🛡',
            agenda: '',
            beschreibung: '',
            ruf: 0,
            rufHistorie: [],
            mitgliederNpcIds: [],
            sitzOrtId: null,
            rivalen: '',
            verbuendete: '',
            links: []
        }
    ],
    characters: [THORIN, KIRA],
    spells: [
        { id: 1, name: 'Feuerball', level: 3, school: 'Hervorrufung', description: '' },
        { id: 2, name: 'Schild', level: 1, school: 'Bannmagie', description: '' }
    ],
    loot: [
        {
            id: 1,
            name: 'Flammenschwert',
            category: 'weapon',
            rarity: 'rare',
            quantity: 1,
            value: 500,
            description: '',
            tags: []
        }
    ],
    npcs: [
        {
            id: 1,
            name: 'Buergermeister Alrik',
            role: 'Buergermeister',
            race: 'Mensch',
            locationId: 1,
            factionId: 1,
            filterId: 1,
            description: '<p>Alrik</p>',
            relations: [{ targetId: 2, targetType: 'npcs', status: 'friendly', note: 'Schwester' }],
            links: [
                { type: 'npcs', id: 2 },
                { type: 'npcs', id: 3 }
            ],
            tags: []
        },
        {
            id: 2,
            name: 'Schmugglerin Vela',
            role: 'Schmugglerin',
            race: 'Elfin',
            locationId: null,
            factionId: null,
            filterId: null,
            description: '',
            relations: [
                { targetId: 1, targetType: 'npcs', status: 'neutral', note: '' },
                { targetId: 1, targetType: 'characters', status: 'hostile', note: 'Rivale' }
            ],
            links: [
                { type: 'npcs', id: 1 },
                { type: 'quests', id: 1 }
            ],
            tags: []
        },
        {
            id: 3,
            name: 'Fischer Brom',
            role: 'Fischer',
            race: 'Mensch',
            locationId: null,
            factionId: null,
            filterId: null,
            description: '',
            // Die zweite Beziehung HAENGT: NPC 7 wurde in der Quelle geloescht,
            // und deleteNPC() raeumt sie nicht ab (siehe Kopf, Katalog).
            relations: [
                { targetId: 1, targetType: 'npcs', status: 'neutral', note: 'Kunde' },
                { targetId: 7, targetType: 'npcs', status: 'hostile', note: 'Verstorbener Rivale' }
            ],
            links: [{ type: 'npcs', id: 1 }],
            tags: []
        }
    ],
    quests: [
        {
            id: 1,
            title: 'Die verlorene Fracht',
            giverId: 1,
            giverName: 'Buergermeister Alrik',
            locationId: 2,
            locationName: 'Turmruine',
            targetId: 1,
            targetName: 'Hafenstadt',
            type: 'main',
            description: '<p>Fracht</p>',
            rewardGold: 250,
            rewardItems: [{ id: 1, name: 'Flammenschwert' }],
            rewardOther: '',
            epilog: '',
            completed: false,
            rewardReceived: false,
            tags: [],
            links: [
                { type: 'npcs', id: 2 },
                { type: 'quests', id: 2 }
            ]
        },
        {
            id: 2,
            title: 'Botengang',
            giverId: null,
            giverName: '',
            locationId: null,
            locationName: '',
            targetId: null,
            targetName: '',
            type: 'side',
            description: '',
            rewardGold: 0,
            rewardItems: [],
            rewardOther: '',
            epilog: '',
            completed: false,
            rewardReceived: false,
            tags: [],
            links: [{ type: 'quests', id: 1 }]
        },
        {
            id: 3,
            title: 'Nachtwache',
            giverId: null,
            giverName: '',
            locationId: null,
            locationName: '',
            targetId: null,
            targetName: '',
            type: 'side',
            description: '',
            rewardGold: 10,
            rewardItems: [],
            rewardOther: '',
            epilog: '',
            completed: true,
            rewardReceived: false,
            tags: [],
            links: []
        }
    ],
    wiki: [
        {
            id: 1,
            title: 'Weltwissen',
            category: 'lore',
            content: '<p>Wurzel</p>',
            tags: [],
            pinned: false,
            parentId: null,
            createdAt: 1700000000000,
            updatedAt: 1700000000001
        },
        {
            id: 2,
            title: 'Goetter',
            category: 'lore',
            content: '<p>Kind</p>',
            tags: [],
            pinned: false,
            parentId: 1,
            createdAt: 1700000000002,
            updatedAt: 1700000000003
        },
        {
            id: 3,
            title: 'Pantheon',
            category: 'lore',
            content: '<p>Enkel</p>',
            tags: [],
            pinned: false,
            parentId: 2,
            createdAt: 1700000000004,
            updatedAt: 1700000000005
        }
    ]
};

/** Die FREMDE Kampagne (R5): ANDERE Eintraege unter genau den IDs der Quelle. */
const ZIEL = {
    filters: [{ id: 1, name: 'Kapitel Eis', color: '#888888' }],
    locations: [
        { id: 1, name: 'Eiswueste', description: '', filterId: null, tags: [] },
        { id: 2, name: 'Sumpf', description: '', filterId: null, tags: [] }
    ],
    factions: [
        {
            id: 1,
            name: 'Diebesbande',
            symbol: '',
            agenda: '',
            beschreibung: '',
            ruf: 0,
            rufHistorie: [],
            mitgliederNpcIds: [],
            sitzOrtId: null,
            rivalen: '',
            verbuendete: '',
            links: []
        }
    ],
    characters: [{ ...KIRA, id: 1, name: 'Fremde Heldin' }],
    spells: [
        { id: 1, name: 'Heilen', level: 1, description: '' },
        { id: 2, name: 'Licht', level: 0, description: '' }
    ],
    loot: [
        {
            id: 1,
            name: 'Rostiger Dolch',
            category: 'weapon',
            rarity: 'common',
            quantity: 1,
            description: '',
            tags: []
        }
    ],
    npcs: [
        {
            id: 1,
            name: 'Fremder Haendler',
            race: '',
            locationId: null,
            factionId: null,
            relations: [],
            links: [],
            description: '',
            tags: []
        },
        {
            id: 2,
            name: 'Hexe Morla',
            race: '',
            locationId: null,
            factionId: null,
            relations: [],
            links: [],
            description: '',
            tags: []
        },
        {
            id: 3,
            name: 'Wirt Bodo',
            race: '',
            locationId: null,
            factionId: null,
            relations: [],
            links: [],
            description: '',
            tags: []
        }
    ],
    quests: [
        {
            id: 1,
            title: 'Fremder Auftrag',
            giverId: null,
            locationId: null,
            targetId: null,
            type: 'side',
            description: '',
            rewardItems: [],
            completed: false,
            tags: [],
            links: []
        }
    ],
    wiki: [
        {
            id: 1,
            title: 'Fremde Chronik',
            category: 'lore',
            content: '',
            tags: [],
            pinned: false,
            parentId: null
        },
        {
            id: 2,
            title: 'Fremdes Kapitel',
            category: 'lore',
            content: '',
            tags: [],
            pinned: false,
            parentId: 1
        },
        {
            id: 3,
            title: 'Fremde Fussnote',
            category: 'lore',
            content: '',
            tags: [],
            pinned: false,
            parentId: 2
        }
    ]
};

/** Jeder Name der fremden Kampagne — keiner darf an einem Import haengen. */
const FREMDE_NAMEN = [
    'Kapitel Eis',
    'Eiswueste',
    'Sumpf',
    'Diebesbande',
    'Fremde Heldin',
    'Heilen',
    'Rostiger Dolch',
    'Fremder Haendler',
    'Hexe Morla',
    'Wirt Bodo',
    'Fremder Auftrag',
    'Fremde Chronik',
    'Fremdes Kapitel',
    'Fremde Fussnote'
];

// ===========================================================================
// DER VERWEISKATALOG (siehe Kopf) — einmal fuer die Datei (Soll), einmal fuer
// D (Ist, in lage()). `wort` ist, woran die Vorschau das Feld erkennbar nennt.
// ===========================================================================

/** @param {any} x */
const idVon = x => (typeof x === 'number' ? x : x && x.id) || null;

/** @type {Record<string, {feld: string, wort: RegExp, zahl: (e: any) => number}[]>} */
const FREMDVERWEISE = {
    npcs: [
        { feld: 'Ort', wort: /Ort/, zahl: e => (e.locationId ? 1 : 0) },
        { feld: 'Fraktion', wort: /Fraktion/i, zahl: e => (e.factionId ? 1 : 0) },
        { feld: 'Filter', wort: /Filter|Kapitel/i, zahl: e => (e.filterId ? 1 : 0) },
        {
            feld: 'Beziehung → Charakter',
            wort: /Charakter|Held|Spieler|Party|Gruppe|Beziehung/i,
            zahl: e =>
                (e.relations || []).filter(r => r.targetType === 'characters' && r.targetId).length
        },
        {
            feld: 'Verknüpfung → anderer Typ',
            wort: /Verknüpf|Quest|Link/i,
            zahl: e => (e.links || []).filter(l => l.type !== 'npcs' && l.id).length
        }
    ],
    quests: [
        { feld: 'Auftraggeber', wort: /NPC|Auftraggeber|Geber/i, zahl: e => (e.giverId ? 1 : 0) },
        { feld: 'Ort', wort: /Ort/, zahl: e => (e.locationId ? 1 : 0) },
        { feld: 'Zielort', wort: /Ziel|Ort/, zahl: e => (e.targetId ? 1 : 0) },
        {
            feld: 'Belohnungs-Item',
            wort: /Loot|Gegenst|Item|Beute|Belohn|Schatz|Schätz/i,
            zahl: e => (e.rewardItems || []).filter(idVon).length
        },
        {
            feld: 'Verknüpfung → anderer Typ',
            wort: /Verknüpf|NPC|Link/i,
            zahl: e => (e.links || []).filter(l => l.type !== 'quests' && l.id).length
        }
    ],
    characters: [
        { feld: 'Zauber', wort: /Zauber/i, zahl: e => (e.spells || []).filter(idVon).length },
        {
            feld: 'Gegenstand',
            wort: /Loot|Gegenst|Item|Inventar|Ausrüst|Besitz|Beute/i,
            zahl: e => (e.items || []).filter(idVon).length
        }
    ],
    factions: [
        { feld: 'Sitz', wort: /Ort|Sitz/, zahl: e => (e.sitzOrtId ? 1 : 0) },
        {
            feld: 'Mitglieder',
            wort: /NPC|Mitglied/i,
            zahl: e => (e.mitgliederNpcIds || []).filter(idVon).length
        }
    ],
    wiki: []
};

/**
 * Die internen Verweise eines Eintrags der Datei (Beziehungen NPC→NPC,
 * Verknuepfungen desselben Typs, Wiki-Eltern) als [Art, Ziel-ID].
 * @param {string} typ
 * @param {any} e
 * @returns {[string, number][]}
 */
function internVerweise(typ, e) {
    /** @type {[string, number][]} */
    const v = [];
    if (typ === 'npcs') {
        (e.relations || [])
            .filter(/** @param {any} r */ r => r.targetType === 'npcs' && r.targetId)
            .forEach(/** @param {any} r */ r => v.push(['Beziehung', r.targetId]));
    }
    (e.links || [])
        .filter(/** @param {any} l */ l => l.type === typ && l.id)
        .forEach(/** @param {any} l */ l => v.push(['Verknüpfung', l.id]));
    if (typ === 'wiki' && e.parentId) v.push(['Eltern', e.parentId]);
    return v;
}

/**
 * Die Fremdverweise einer Datei, je Feld und gesamt. `auch`: die Summe mit
 * den haengenden internen Verweisen (Ziel nicht in der Datei), die der Fix
 * ebenfalls leert und mitzaehlen darf (siehe Kopf, "Wie die Vorschau gelesen
 * wird").
 * @param {string} typ
 * @param {any[]} daten
 */
function fremdZaehlen(typ, daten) {
    const felder = FREMDVERWEISE[typ]
        .map(f => ({ feld: f.feld, wort: f.wort, n: daten.reduce((s, e) => s + f.zahl(e), 0) }))
        .filter(f => f.n > 0);
    const gesamt = felder.reduce((s, f) => s + f.n, 0);
    const ids = new Set(daten.map(e => e.id));
    const haengend = daten.reduce(
        (s, e) => s + internVerweise(typ, e).filter(([, id]) => !ids.has(id)).length,
        0
    );
    return { gesamt, felder, auch: haengend ? [gesamt + haengend] : [] };
}

/**
 * Was nach dem Hinzufuegen gelten muss, aus der DATEI berechnet: je Eintrag
 * die internen Verweise auf die mitimportierte Kopie desselben Namens, kein
 * Fremdverweis — und kein haengender interner Verweis (sein Ziel liegt nicht
 * in der Datei, er ist zu leeren). Gleiche Form wie lage().
 * @param {string} typ
 * @param {{ json: any }} datei
 */
function soll(typ, datei) {
    /** @type {any[]} */
    const daten = datei.json.data;
    /** @param {any} e */
    const titel = e => e.name ?? e.title;
    return daten.map(e => ({
        name: titel(e),
        intern: internVerweise(typ, e).flatMap(([art, id]) => {
            const z = daten.find(x => x.id === id);
            return z ? [`${art} → ${titel(z)} (mitimportiert)`] : [];
        }),
        fremd: []
    }));
}

/**
 * Die mitimportierten Eintraege eines Typs in D (alle, deren ID vor dem
 * Import nicht vergeben war), je Eintrag: wohin die internen Verweise zeigen
 * ("… (mitimportiert)" ist richtig; "(vorher da)" ist das Original bzw. der
 * fremde Eintrag; "(fehlt)" ins Leere) und welche Fremdverweise noch eine ID
 * tragen.
 * @param {import('@playwright/test').Page} page
 * @param {string} typ
 * @param {number[]} alteIds
 */
function lage(page, typ, alteIds) {
    return page.evaluate(([typ, alte]) => {
        const D = /** @type {any} */ (window).D;
        const alt = new Set(alte);
        /** @param {any} e */
        const titel = e => e.name ?? e.title;
        /** @param {any} x */
        const idVon = x => (typeof x === 'number' ? x : x && x.id) || null;
        /** @param {any[]} liste @param {number} id */
        const ziel = (liste, id) => {
            const z = liste.find(x => x.id === id);
            if (!z) return `#${id} (fehlt)`;
            return `${titel(z)} (${alt.has(id) ? 'vorher da' : 'mitimportiert'})`;
        };
        return (D[typ] || [])
            .filter(/** @param {any} e */ e => !alt.has(e.id))
            .map(
                /** @param {any} e */ e => {
                    /** @type {string[]} */
                    const intern = [];
                    /** @type {string[]} */
                    const fremd = [];
                    /** @param {string} feld @param {any} wert */
                    const f = (feld, wert) => {
                        if (Array.isArray(wert) ? wert.some(idVon) : wert)
                            fremd.push(`${feld}: ${JSON.stringify(wert)}`);
                    };
                    // Ein interner Verweis OHNE ID ist geleert — recht fuer den
                    // haengenden (soll() erwartet ihn nicht), falsch fuer einen
                    // mit Ziel in der Datei (soll() erwartet ihn auf der Kopie).
                    if (typ === 'npcs') {
                        (e.relations || []).forEach(
                            /** @param {any} r */ r => {
                                if (r.targetType === 'npcs') {
                                    if (r.targetId)
                                        intern.push('Beziehung → ' + ziel(D.npcs, r.targetId));
                                } else if (r.targetType === 'characters')
                                    f('Beziehung → Charakter', r.targetId);
                            }
                        );
                    }
                    (e.links || []).forEach(
                        /** @param {any} l */ l => {
                            if (l.type !== typ) f('Verknüpfung → ' + l.type, l.id);
                            else if (l.id) intern.push('Verknüpfung → ' + ziel(D[typ], l.id));
                        }
                    );
                    if (typ === 'npcs') {
                        f('locationId', e.locationId);
                        f('factionId', e.factionId);
                        f('filterId', e.filterId);
                    }
                    if (typ === 'wiki' && e.parentId)
                        intern.push('Eltern → ' + ziel(D.wiki, e.parentId));
                    if (typ === 'quests') {
                        f('giverId', e.giverId);
                        f('locationId', e.locationId);
                        f('targetId', e.targetId);
                        f('rewardItems', e.rewardItems || []);
                    }
                    if (typ === 'characters') {
                        f('spells', e.spells || []);
                        f('items', e.items || []);
                    }
                    if (typ === 'factions') {
                        f('sitzOrtId', e.sitzOrtId);
                        f('mitgliederNpcIds', e.mitgliederNpcIds || []);
                    }
                    return { name: titel(e), intern, fremd };
                }
            );
    }, /** @type {[string, number[]]} */ ([typ, alteIds]));
}

// ===========================================================================
// DIE VORSCHAU LESEN (siehe Kopf)
// ===========================================================================

/** Woran eine Zeile als Verweis-Hinweis erkennbar ist. */
const VERWEIS_WORT = /verweis|verknüpf|bezug|bezüg/i;

/** Woran eine Zeile als Hinweis auf die ersetzten Eintraege erkennbar ist. */
const ERSETZ_WORT = /ersetz|überschreib|verlor|entfern|lösch/i;

/** @param {string} zeile */
const zahlenIn = zeile => (zeile.match(/\d+/g) || []).map(Number);

/** @param {string} text */
const zeilenVon = text =>
    text
        .split(/\n+/)
        .map(z => z.trim())
        .filter(Boolean);

/**
 * Nennt die Vorschau die Fremdverweise — gesamt, oder je Feld mit Zahl?
 * Und (R5) jedes Feld mit seinem Wort? Gibt die Befunde als Text zurueck,
 * damit ein roter Lauf zeigt, was fehlte.
 * @param {string} info
 * @param {{ gesamt: number, auch?: number[], felder: {feld: string, wort: RegExp, n: number}[] }} erwartet
 * @param {{ welche: boolean }} opt
 */
function verweisHinweis(info, erwartet, opt) {
    const zeilen = zeilenVon(info);
    const start = zeilen.findIndex(z => VERWEIS_WORT.test(z));
    if (start < 0) return [`keine Zeile mit "Verweis"/"Verknüpf"/"Bezug"`];
    const abschnitt = zeilen.slice(start);
    const summen = [erwartet.gesamt, ...(erwartet.auch || [])];
    const gesamt = zeilen
        .filter(z => VERWEIS_WORT.test(z))
        .some(z => zahlenIn(z).some(n => summen.includes(n)));
    const jeFeld =
        erwartet.felder.length > 1 &&
        erwartet.felder.every(f =>
            abschnitt.some(z => f.wort.test(z) && zahlenIn(z).includes(f.n))
        );
    /** @type {string[]} */
    const fehlt = [];
    if (!gesamt && !jeFeld) {
        fehlt.push(
            `keine Zahl ${summen.join(' oder ')} in einer Verweis-Zeile und keine Zahl je Feld (${erwartet.felder.map(f => `${f.feld} ${f.n}`).join(', ')})`
        );
    }
    if (opt.welche) {
        erwartet.felder
            .filter(f => !abschnitt.some(z => f.wort.test(z)))
            .forEach(f => fehlt.push(`nennt nicht, welche: "${f.feld}" (${f.wort})`));
    }
    return fehlt;
}

/**
 * Nennt die Vorschau (R6) die Zahl der ersetzten, vorhandenen Eintraege?
 * @param {string} info
 * @param {number} n
 */
function nenntErsetzt(info, n) {
    return zeilenVon(info).some(z => ERSETZ_WORT.test(z) && zahlenIn(z).includes(n));
}

// ===========================================================================
// BEDIENWEGE
// ===========================================================================

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App. "Failed to load resource" ist
 * Netzrauschen (Schriften unter file://). Rueckfragen werden abgelehnt und
 * mitgeschrieben — dieser Weg stellt keine.
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
        fehler.push(`dialog(${d.type()}): ${d.message().replace(/\n/g, ' | ')}`);
        d.dismiss().catch(() => {});
    });
    return {
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            const log = await page.evaluate(() =>
                /** @type {any} */ (window.ErrorHandler?.getRecentErrors(50) || []).map(
                    /** @param {any} e */ e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...fehler, ...log];
        }
    };
}

/**
 * Laedt breit und saet EINMAL je Tab — hinter einer sessionStorage-Sperre,
 * damit ein `page.reload()` liest, was die App gespeichert hat.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} saat
 */
async function appLaden(page, saat) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('reiterimport-verweise-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('reiterimport-verweise-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, saat]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN (siehe link-anlegen.spec.js): repariert
    // `load()` die Saat, schreibt `saveAutomatic()` spaeter den ganzen Stand —
    // erkennbar daran, dass `_version` der Saat ueberschrieben wird.
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
}

/** Geht in die Ansicht eines Typs — nur, wenn sie nicht schon offen ist (ein
 *  offenes Klappformular soll stehen bleiben, R7).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
async function zuAnsicht(page, typ) {
    const view = ANSICHT[typ];
    if (await page.locator(`#view-${view}.active`).count()) return;
    await navigateToTab(page, view);
    await expect(page.locator(`#view-${view}`)).toBeVisible();
}

/** Die Ein-/Ausgabe-Leiste eines Typs: die Leiste, die sein Datei-Feld
 *  `.io-file-input[data-type]` traegt (Oberflaechen-Vertrag).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
function ioLeiste(page, typ) {
    return page
        .locator('.section-toolbar-io')
        .filter({ has: page.locator(`input.io-file-input[data-type="${typ}"]`) });
}

/**
 * Der ECHTE Export eines Reiters (📤), Download abgefangen.
 * @param {import('@playwright/test').Page} page
 * @param {string} typ
 */
async function exportieren(page, typ) {
    await zuAnsicht(page, typ);
    const knopf = ioLeiste(page, typ).locator('button', { hasText: '📤' });
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }),
        knopf.click()
    ]);
    const pfad = await download.path();
    const buffer = fs.readFileSync(pfad);
    return {
        name: download.suggestedFilename(),
        buffer,
        json: JSON.parse(buffer.toString('utf8'))
    };
}

/**
 * Eine Datei "aus einer anderen Runde", im Test gebaut (R6, R7).
 * @param {string} typ
 * @param {any[]} data
 */
function dateiBauen(typ, data) {
    const json = {
        _exportDate: '2026-10-01T12:00:00.000Z',
        _campaignName: 'Andere Runde',
        _version: '2.6.1',
        _dataType: typ,
        data
    };
    return {
        name: `${typ}-Andere-Runde.json`,
        buffer: Buffer.from(JSON.stringify(json, null, 2), 'utf8'),
        json
    };
}

/**
 * 📥 → Dateiwahl → das Fenster. HART: ohne Fenster gibt es nichts zu pruefen
 * (heute endet hier jeder Import-Fall, siehe Kopf).
 * @param {import('@playwright/test').Page} page
 * @param {string} typ
 * @param {{ name: string, buffer: Buffer }} datei
 */
async function fensterOeffnen(page, typ, datei) {
    await zuAnsicht(page, typ);
    const knopf = ioLeiste(page, typ).locator(':is(button, label)', { hasText: '📥' });
    await expect(knopf, `Vorbedingung: der Reiter zeigt sein 📥 (${typ})`).toBeVisible();
    const [waehler] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: FENSTER_MS }),
        knopf.click()
    ]);
    await waehler.setFiles({
        name: datei.name,
        mimeType: 'application/json',
        buffer: datei.buffer
    });
    await expect(
        page.locator('#import-modal'),
        `REITERIMPORT: nach der Dateiwahl (${typ}) oeffnet sich das Fenster #import-modal`
    ).toBeVisible({ timeout: FENSTER_MS });
}

/**
 * Waehlt den Modus im Fenster per Klick (das Radio, oder seine Beschriftung,
 * falls das Radio selbst unsichtbar gestaltet ist).
 * @param {import('@playwright/test').Page} page
 * @param {'merge'|'replace'} modus
 */
async function modusWaehlen(page, modus) {
    const radio = page.locator(`#import-modal input[name="import-mode"][value="${modus}"]`);
    const beschriftung = modus === 'merge' ? 'Hinzufügen' : 'Ersetzen';
    if (await radio.isVisible()) await radio.check();
    else await page.locator('#import-modal label', { hasText: beschriftung }).click();
    await expect(radio, `der Modus "${beschriftung}" ist gewaehlt`).toBeChecked();
}

/** Die Vorschau `#import-info`, zeilenweise wie der Nutzer sie sieht.
 *  @param {import('@playwright/test').Page} page */
function vorschau(page) {
    return page.locator('#import-info').innerText();
}

/**
 * "Importieren" und das entprellte Schreiben abwarten.
 * @param {import('@playwright/test').Page} page
 * @param {string} was
 */
async function importieren(page, was) {
    const knopf = page.locator('#import-modal [data-action="execute-import"]');
    await expect(knopf, 'REITERIMPORT: der Knopf heisst "Importieren"').toHaveText(/Importieren/);
    const rev = await revStand(page);
    await knopf.click();
    await expect(page.locator('#import-modal'), `${was}: das Fenster schliesst`).toBeHidden();
    await geschriebenSeit(page, rev, was);
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu (siehe link-anlegen.spec.js).
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}
/** Wartet, bis seit `rev` geschrieben wurde.
 *  @param {import('@playwright/test').Page} page
 *  @param {string|null} rev
 *  @param {string} was */
async function geschriebenSeit(page, rev, was) {
    await expect
        .poll(() => revStand(page), {
            timeout: SOFORT_MS,
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Die Nummer der juengsten Meldung (Ereignis-Log und Kampfprotokoll werden
 *  aus `showToast()` beschickt; das Protokoll fuehrt sie nummeriert).
 *  @param {import('@playwright/test').Page} page */
function meldungsStand(page) {
    return page.evaluate(() =>
        /** @type {any} */ (window.getCombatLog?.() || []).reduce(
            /** @param {number} m @param {any} e */ (m, e) => Math.max(m, e.nr),
            0
        )
    );
}
/** Alle Meldungen nach `nr`, aelteste zuerst, als `typ: Text`.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} nr */
function meldungenSeit(page, nr) {
    return page.evaluate(
        nr =>
            /** @type {any} */ (window.getCombatLog?.() || [])
                .filter(/** @param {any} e */ e => e.nr > nr)
                .sort(/** @param {any} a @param {any} b */ (a, b) => a.nr - b.nr)
                .map(/** @param {any} e */ e => `${e.typ}: ${e.text}`),
        nr
    );
}

/** Ein Typ aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
function ausD(page, typ) {
    return page.evaluate(
        t => JSON.parse(JSON.stringify(/** @type {any} */ (window).D[t] ?? null)),
        typ
    );
}

/** Klick in ein Feld, alles markieren, neu tippen (echte Tasten).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} feld
 *  @param {string} text */
async function eintippen(page, feld, text) {
    await page.locator(feld).click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(text);
}

/** Neu laden und warten, bis die App steht.
 *  @param {import('@playwright/test').Page} page */
async function neuLaden(page) {
    await page.reload();
    await waitForAppReady(page);
}

/**
 * Der gemeinsame Ablauf der R5-Faelle: Export der Quelle (bzw. eine schon
 * exportierte Datei) → 📥 → "Hinzufügen" → Vorschau pruefen → Importieren →
 * jeder interne Verweis zeigt auf die Kopie, kein Fremdverweis traegt eine ID,
 * die vorher vorhandenen Eintraege sind unveraendert.
 * @param {import('@playwright/test').Page} page
 * @param {string} typ
 * @param {{ name: string, buffer: Buffer, json: any }} datei
 * @param {string} wo
 */
async function hinzufuegenUndPruefen(page, typ, datei, wo) {
    const vorher = await ausD(page, typ);
    const alteIds = vorher.map(/** @param {any} e */ e => e.id);
    await fensterOeffnen(page, typ, datei);
    await modusWaehlen(page, 'merge');
    const erwartet = fremdZaehlen(typ, datei.json.data);
    if (erwartet.gesamt > 0) {
        const info = await vorschau(page);
        weich(
            verweisHinweis(info, erwartet, { welche: true }),
            `R5 (${wo}, ${typ}): die Vorschau nennt VOR dem Import, welche und wie viele ` +
                `Verweise auf andere Bereiche geleert werden — Vorschau war:\n${info}`
        ).toEqual([]);
    }
    await importieren(page, `${wo}: Hinzufügen ${typ}`);

    weich(
        await lage(page, typ, alteIds),
        `R5 (${wo}, ${typ}): Verweise innerhalb zeigen auf die mitimportierten Kopien, ` +
            'Verweise auf andere Bereiche sind geleert'
    ).toEqual(soll(typ, datei));
    const nachher = await ausD(page, typ);
    weich(
        nachher.filter(/** @param {any} e */ e => alteIds.includes(e.id)),
        `R5 (${wo}, ${typ}): die vorher vorhandenen Eintraege bleiben unveraendert`
    ).toEqual(vorher);
    return alteIds;
}

// ===========================================================================
// (1)-(4) HINZUFUEGEN IN DIESELBE KAMPAGNE
// ===========================================================================
//
// Der Nutzer exportiert einen Reiter und holt die Datei in DERSELBEN Kampagne
// wieder herein (Duplizieren). Gemessen mit nachgebautem Fenster zeigten die
// Kopien auf die ORIGINALE (Alrik-Kopie → Original-Vela) — kein fremder
// Eintrag, aber still der falsche: wer die Kopie bearbeitet, haengt am
// Original. Und die Kopie desselben Ortes waere in einer anderen Kampagne ein
// fremder Ort; die Datei weiss nicht, wohin sie geht.

test('(1) Hinzufügen NPCs, dieselbe Kampagne: Beziehungen und Verknüpfungen zeigen auf die Kopien, Ort/Fraktion/Filter/Charakter/Quest und die hängende Beziehung geleert, Vorschau zählt sie', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(QUELLE));
    const datei = await exportieren(page, 'npcs');
    const alteIds = await hinzufuegenUndPruefen(page, 'npcs', datei, 'dieselbe Kampagne');

    await neuLaden(page);
    weich(
        await lage(page, 'npcs', alteIds),
        'R5: nach dem Neuladen zeigen die Kopien weiter auf die Kopien'
    ).toEqual(soll('npcs', datei));
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(2) Hinzufügen Wiki, dieselbe Kampagne: die Eltern der Kopien sind die Kopien', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(QUELLE));
    const datei = await exportieren(page, 'wiki');
    const alteIds = await hinzufuegenUndPruefen(page, 'wiki', datei, 'dieselbe Kampagne');

    await neuLaden(page);
    weich(
        await lage(page, 'wiki', alteIds),
        'R5: nach dem Neuladen haengt die Kopie von "Goetter" weiter unter der Kopie von "Weltwissen"'
    ).toEqual(soll('wiki', datei));
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(3) Hinzufügen Quests, dieselbe Kampagne: Quest↔Quest zeigt auf die Kopien, Geber, Ort, Zielort, Belohnung und NPC-Verknüpfung geleert, Vorschau zählt sie', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(QUELLE));
    const datei = await exportieren(page, 'quests');
    await hinzufuegenUndPruefen(page, 'quests', datei, 'dieselbe Kampagne');
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(4) Hinzufügen Charaktere und Fraktionen, dieselbe Kampagne: Zauber, Gegenstände, Sitz und Mitglieder geleert, Vorschau zählt sie', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(QUELLE));
    const charaktere = await exportieren(page, 'characters');
    const fraktionen = await exportieren(page, 'factions');
    await hinzufuegenUndPruefen(page, 'characters', charaktere, 'dieselbe Kampagne');
    await hinzufuegenUndPruefen(page, 'factions', fraktionen, 'dieselbe Kampagne');
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

// ===========================================================================
// (5)-(6) HINZUFUEGEN IN EINE FREMDE KAMPAGNE
// ===========================================================================
//
// Quelle und Ziel sind zwei Browser-Kontexte mit eigener Saat: die Datei
// entsteht im einen per 📤 und wird im anderen per 📥 geholt — so, wie ein
// Nutzer NPCs aus der alten Runde in die neue traegt. Im Ziel liegen unter
// genau den IDs der Quelle ANDERE Eintraege (ZIEL). Gemessen mit nachgebautem
// Fenster zeigte die importierte Alrik-Karte "Eiswueste", ihre Beziehung
// "Hexe Morla", die Questkarte "Fremder Haendler" und "Sumpf".

/**
 * Exportiert Typen aus einer eigenen Quell-Kampagne in einem zweiten Kontext.
 * @param {import('@playwright/test').Browser} browser
 * @param {string[]} typen
 */
async function ausDerQuelle(browser, typen) {
    const kontext = await browser.newContext();
    try {
        const quelle = await kontext.newPage();
        await appLaden(quelle, kampagne(QUELLE));
        /** @type {Record<string, any>} */
        const dateien = {};
        for (const typ of typen) dateien[typ] = await exportieren(quelle, typ);
        return dateien;
    } finally {
        await kontext.close();
    }
}

/** Welche fremden Namen ein Text traegt.
 *  @param {string} text */
const fremdeNamenIn = text => FREMDE_NAMEN.filter(n => text.includes(n));

test('(5) Hinzufügen NPCs in eine FREMDE Kampagne: nichts zeigt auf deren Einträge — in D, auf der Karte, im Detail', async ({
    page,
    browser
}) => {
    test.setTimeout(90000);
    const { npcs: datei } = await ausDerQuelle(browser, ['npcs']);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(ZIEL));
    const alteIds = await hinzufuegenUndPruefen(page, 'npcs', datei, 'fremde Kampagne');

    // WAS DER NUTZER SIEHT: Karte und Detail der importierten Alrik-Kopie.
    const alrik = await page.evaluate(
        alte =>
            /** @type {any} */ (window).D.npcs.find(
                /** @param {any} n */ n => n.name === 'Buergermeister Alrik' && !alte.includes(n.id)
            )?.id ?? null,
        alteIds
    );
    expect(alrik, 'Vorbedingung: die Alrik-Kopie ist in D').not.toBeNull();
    const karte = page.locator(`#npc-list .npc-item[data-id="${alrik}"]`);
    weich(
        fremdeNamenIn((await karte.textContent()) || ''),
        'R5: die NPC-Karte der Kopie nennt keinen Eintrag der fremden Kampagne (gemessen: "Eiswueste")'
    ).toEqual([]);
    await karte.click();
    const detail = page.locator('#npc-detail-panel');
    await expect(detail, 'Vorbedingung: das Detail zeigt die Kopie').toContainText(
        'Buergermeister Alrik'
    );
    const detailText = (await detail.textContent()) || '';
    weich(
        fremdeNamenIn(detailText),
        'R5: das Detail der Kopie nennt keinen Eintrag der fremden Kampagne (gemessen: "Hexe Morla", "Eiswueste")'
    ).toEqual([]);
    weich(
        detailText.includes('Schmugglerin Vela'),
        'R5: die Beziehung der Kopie zeigt auf die mitimportierte Vela'
    ).toBe(true);

    await neuLaden(page);
    weich(
        await lage(page, 'npcs', alteIds),
        'R5: nach dem Neuladen zeigt nichts auf die fremden Eintraege'
    ).toEqual(soll('npcs', datei));
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(6) Hinzufügen Wiki und Quests in eine FREMDE Kampagne: Eltern und Quest↔Quest sind die Kopien, die Questkarte nennt keinen fremden Geber oder Ort', async ({
    page,
    browser
}) => {
    test.setTimeout(90000);
    const dateien = await ausDerQuelle(browser, ['wiki', 'quests']);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(ZIEL));
    await hinzufuegenUndPruefen(page, 'wiki', dateien.wiki, 'fremde Kampagne');
    const alteQuests = await hinzufuegenUndPruefen(
        page,
        'quests',
        dateien.quests,
        'fremde Kampagne'
    );

    // WAS DER NUTZER SIEHT: die Karte der importierten Fracht.
    const fracht = await page.evaluate(
        alte =>
            /** @type {any} */ (window).D.quests.find(
                /** @param {any} q */ q =>
                    q.title === 'Die verlorene Fracht' && !alte.includes(q.id)
            )?.id ?? null,
        alteQuests
    );
    expect(fracht, 'Vorbedingung: die Fracht-Kopie ist in D').not.toBeNull();
    await zuAnsicht(page, 'quests');
    const karte = page.locator(`#quests-list #quest-${fracht}`);
    await expect(karte, 'Vorbedingung: die Questkarte der Kopie steht in der Liste').toHaveCount(1);
    weich(
        fremdeNamenIn((await karte.textContent()) || ''),
        'R5: die Questkarte der Kopie nennt keinen Eintrag der fremden Kampagne (gemessen: "Fremder Haendler", "Sumpf")'
    ).toEqual([]);
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

// ===========================================================================
// (7)-(8) ERSETZEN: DIE VORSCHAU NENNT, WAS VERLOREN GEHT
// ===========================================================================
//
// Ersetzen tauscht ALLE Eintraege des Typs gegen die Datei. Was der Nutzer
// vorher wissen muss: wie viele seiner Eintraege gehen, und wie viele
// Verweise anderer Bereiche danach ins Leere zeigen (gemessen: Quest.giverId
// zeigte nach dem Ersetzen auf "—", ohne jeden Hinweis vorher). Die Zahlen
// sind verschieden gewaehlt: Datei-Eintraege, ersetzte, Verweise ins Leere.
// Zu den Verweisen gehoeren die Verknuepfungen (`links[]`) anderer Eintraege:
// `addEntityLink()` schreibt sie beidseitig, und wer nur die Feldverweise
// zaehlt, verschweigt sie (Skeptiker-Gegenprobe, siehe Kopf).

/** @param {number} id @param {string} title @param {Record<string, any>} [mehr] */
const quest = (id, title, mehr = {}) => ({
    id,
    title,
    giverId: null,
    locationId: null,
    targetId: null,
    type: 'side',
    description: '',
    rewardItems: [],
    completed: false,
    rewardReceived: false,
    tags: [],
    links: [],
    ...mehr
});
/** @param {number} id @param {string} name @param {Record<string, any>} [mehr] */
const npc = (id, name, mehr = {}) => ({
    id,
    name,
    role: '',
    race: 'Mensch',
    locationId: null,
    factionId: null,
    filterId: null,
    description: '',
    relations: [],
    links: [],
    tags: [],
    ...mehr
});
/** @param {number} id @param {string} name */
const ort = (id, name) => ({ id, name, description: '', filterId: null, tags: [] });

test('(7) Ersetzen NPCs: die Vorschau nennt 4 ersetzte Einträge und 3 Verweise aus Quests und Orten ins Leere', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    // 4 NPCs; die Datei bringt 2 (ids 1 und 9). Danach fehlen 2, 3, 4 — auf
    // 2 und 3 zeigen 2 Quests als Geber, auf 4 der Ort Hafenstadt mit seiner
    // Verknuepfung (beidseitig, wie addEntityLink() sie schreibt): 3 Verweise
    // aus 2 Bereichen. Die Quest auf id 1 zeigt auf eine vorhandene ID.
    await appLaden(
        page,
        kampagne({
            npcs: [
                npc(1, 'Alrik'),
                npc(2, 'Vela'),
                npc(3, 'Brom'),
                npc(4, 'Nils', { links: [{ type: 'locations', id: 1 }] })
            ],
            locations: [{ ...ort(1, 'Hafenstadt'), links: [{ type: 'npcs', id: 4 }] }],
            quests: [
                quest(1, 'Auftrag von Alrik', { giverId: 1 }),
                quest(2, 'Auftrag von Vela', { giverId: 2 }),
                quest(3, 'Auftrag von Brom', { giverId: 3 }),
                quest(4, 'Ohne Geber')
            ]
        })
    );
    const datei = dateiBauen('npcs', [npc(1, 'Neuer Wirt'), npc(9, 'Neue Wache')]);
    await fensterOeffnen(page, 'npcs', datei);
    await modusWaehlen(page, 'replace');
    const info = await vorschau(page);
    weich(
        nenntErsetzt(info, 4),
        `R6: eine Zeile mit "ersetz" nennt die 4 vorhandenen NPCs, die ersetzt werden — Vorschau war:\n${info}`
    ).toBe(true);
    weich(
        verweisHinweis(
            info,
            {
                gesamt: 3,
                felder: [
                    { feld: 'Quests', wort: /Quest|Auftr/i, n: 2 },
                    { feld: 'Orte', wort: /Ort/, n: 1 }
                ]
            },
            { welche: false }
        ),
        `R6: die Vorschau nennt die 3 Verweise anderer Bereiche, die danach ins Leere zeigen — Vorschau war:\n${info}`
    ).toEqual([]);
    await importieren(page, 'Ersetzen NPCs');

    // Die Aussage der Vorschau stimmt: genau diese Verweise zeigen jetzt ins Leere.
    weich(
        await page.evaluate(() => {
            const D = /** @type {any} */ (window).D;
            return {
                npcs: D.npcs.map(/** @param {any} n */ n => n.id),
                insLeere: [
                    ...D.quests
                        .filter(
                            /** @param {any} q */ q =>
                                q.giverId &&
                                !D.npcs.some(/** @param {any} n */ n => n.id === q.giverId)
                        )
                        .map(/** @param {any} q */ q => 'Quest ' + q.title),
                    ...D.locations
                        .filter(
                            /** @param {any} o */ o =>
                                (o.links || []).some(
                                    /** @param {any} l */ l =>
                                        l.type === 'npcs' &&
                                        !D.npcs.some(/** @param {any} n */ n => n.id === l.id)
                                )
                        )
                        .map(/** @param {any} o */ o => 'Ort ' + o.name)
                ]
            };
        }),
        'Kontrolle der Saat: ersetzt wurde, und 3 Verweise zeigen danach ins Leere'
    ).toEqual({
        npcs: [1, 9],
        insLeere: ['Quest Auftrag von Vela', 'Quest Auftrag von Brom', 'Ort Hafenstadt']
    });
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(8) Ersetzen Orte: die Vorschau nennt 3 ersetzte Einträge und 4 Verweise aus NPCs, Quests und Fraktionen ins Leere', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    // 3 Orte; die Datei bringt nur id 1. Danach fehlen 2 und 3. Ins Leere
    // zeigen: NPC Vela (Ort 2), Quest A (Ort 3), Quest B (Zielort 2),
    // Fraktion Gilde (Sitz 3) — 4 Verweise aus 3 Bereichen. Alrik und Quest C
    // zeigen auf id 1, die bleibt.
    await appLaden(
        page,
        kampagne({
            locations: [ort(1, 'Hafenstadt'), ort(2, 'Turmruine'), ort(3, 'Sumpfhuette')],
            npcs: [npc(1, 'Alrik', { locationId: 1 }), npc(2, 'Vela', { locationId: 2 })],
            quests: [
                quest(1, 'Quest A', { locationId: 3 }),
                quest(2, 'Quest B', { targetId: 2 }),
                quest(3, 'Quest C', { locationId: 1 })
            ],
            factions: [
                {
                    id: 1,
                    name: 'Gilde',
                    symbol: '',
                    agenda: '',
                    beschreibung: '',
                    ruf: 0,
                    rufHistorie: [],
                    mitgliederNpcIds: [],
                    sitzOrtId: 3,
                    rivalen: '',
                    verbuendete: '',
                    links: []
                }
            ]
        })
    );
    const datei = dateiBauen('locations', [ort(1, 'Neue Mitte')]);
    await fensterOeffnen(page, 'locations', datei);
    await modusWaehlen(page, 'replace');
    const info = await vorschau(page);
    weich(
        nenntErsetzt(info, 3),
        `R6: eine Zeile mit "ersetz" nennt die 3 vorhandenen Orte, die ersetzt werden — Vorschau war:\n${info}`
    ).toBe(true);
    weich(
        verweisHinweis(
            info,
            {
                gesamt: 4,
                felder: [
                    { feld: 'NPCs', wort: /NPC/i, n: 1 },
                    { feld: 'Quests', wort: /Quest|Auftr/i, n: 2 },
                    { feld: 'Fraktionen', wort: /Fraktion/i, n: 1 }
                ]
            },
            { welche: false }
        ),
        `R6: die Vorschau nennt die 4 Verweise anderer Bereiche, die danach ins Leere zeigen — Vorschau war:\n${info}`
    ).toEqual([]);
    await importieren(page, 'Ersetzen Orte');
    weich(
        (await ausD(page, 'locations')).map(/** @param {any} o */ o => o.id),
        'Kontrolle: ersetzt wurde'
    ).toEqual([1]);
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

// ===========================================================================
// (9)-(12) OFFENE UND LIEGENGEBLIEBENE FORMULARE (R7)
// ===========================================================================
//
// Die Datei bringt unter id 1 einen ANDEREN Eintrag als den, der gerade
// bearbeitet wird. Gemessen (K3): das Party-Klappformular bleibt mit
// `edit-char-id=1` offen, "Speichern" schreibt Thorin ueber Mira. Die Faelle
// pruefen erst den Zustand des Formulars direkt nach dem Import (offen MIT
// der alten ID ist verboten — geleert oder geschlossen ist beides recht),
// dann, was ein Speichern danach anrichtet: der importierte Eintrag muss
// feldgleich bleiben, in D, im Speicher und nach dem Neuladen.

/**
 * Der Zustand eines Klappformulars: offen? welche Bearbeiten-ID, welcher Name?
 * @param {import('@playwright/test').Page} page
 * @param {string} formular
 * @param {string} idFeld
 * @param {string} nameFeld
 */
function formularStand(page, formular, idFeld, nameFeld) {
    return page.evaluate(
        ([f, i, n]) => ({
            offen: !!document.getElementById(f)?.classList.contains('open'),
            id: /** @type {HTMLInputElement|null} */ (document.getElementById(i))?.value ?? null,
            name: /** @type {HTMLInputElement|null} */ (document.getElementById(n))?.value ?? null
        }),
        [formular, idFeld, nameFeld]
    );
}

/** ✏️ an einer Quest: der Knopf steht im aufgeklappten Teil der Karte, also
 *  erst die Kopfzeile klicken (toggleQuest()), dann ✏️.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function questBearbeiten(page, id) {
    const karte = page.locator(`#quests-list #quest-${id}`);
    const knopf = karte.locator(`[data-action="edit-quest"][data-id="${id}"]`);
    if (!(await knopf.isVisible())) await karte.locator('.quest-header').click();
    await knopf.click();
}

/** Der Eintrag mit id 1 aus dem Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
function einsImSpeicher(page, typ) {
    return page.evaluate(
        ([schluessel, t]) => {
            try {
                return (
                    (JSON.parse(localStorage.getItem(schluessel) || '{}')[t] || []).find(
                        /** @param {any} e */ e => e.id === 1
                    ) ?? null
                );
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, typ]
    );
}
/** Der Eintrag mit id 1 aus D.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
async function einsInD(page, typ) {
    return (await ausD(page, typ)).find(/** @param {any} e */ e => e.id === 1) ?? null;
}

/**
 * Klickt "Speichern" eines Formulars, WENN es sichtbar ist, und wartet kurz
 * auf das entprellte Schreiben (es darf auch ausbleiben: ein geleertes
 * Formular ohne Namen speichert nichts).
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} knopf
 */
async function speichernFallsDa(page, knopf) {
    if (!(await knopf.isVisible())) return false;
    await knopf.click();
    await page.waitForTimeout(700);
    return true;
}

/**
 * Die Zusage von R7 fuer den Eintrag mit id 1: nach dem Speichern-Versuch
 * feldgleich mit dem Stand direkt nach dem Import — in D, im Speicher, nach
 * dem Neuladen.
 * @param {import('@playwright/test').Page} page
 * @param {string} typ
 * @param {any} importiert
 * @param {string} was
 */
async function bleibtImportiert(page, typ, importiert, was) {
    weich(await einsInD(page, typ), `R7: ${was} — D`).toEqual(importiert);
    weich(await einsImSpeicher(page, typ), `R7: ${was} — localStorage`).toEqual(importiert);
    await neuLaden(page);
    weich(await einsInD(page, typ), `R7: ${was} — nach dem Neuladen`).toEqual(importiert);
}

const MIRA = {
    id: 1,
    name: 'Mira (aus Datei)',
    playerName: 'Clara',
    characterClass: 'Magierin',
    subclass: '',
    race: 'Elfin',
    level: 7,
    background: 'Weise',
    alignment: 'NG',
    attributes: { str: 8, dex: 14, con: 12, int: 18, wis: 12, cha: 10 },
    hpCurrent: 30,
    hpMax: 30,
    tempHp: 0,
    armorClass: 12,
    initiative: 2,
    speed: '9 m',
    passivePerception: 11,
    notes: '',
    spells: [],
    items: [],
    conditions: [],
    tags: []
};

test('(9) offenes Party-Formular (✏️ Charakter 1) und Ersetzen: Speichern überschreibt die importierte Mira nicht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne({ characters: [{ ...THORIN, spells: [], items: [] }, KIRA] }));
    await zuAnsicht(page, 'characters');
    await page.locator('[data-action="edit-char"][data-id="1"]').first().click();
    expect(
        await formularStand(page, 'char-form', 'edit-char-id', 'char-name'),
        'Vorbedingung: ✏️ oeffnet das Klappformular mit Thorin'
    ).toEqual({ offen: true, id: '1', name: 'Thorin' });

    const datei = dateiBauen('characters', [MIRA, { ...MIRA, id: 2, name: 'Bob (aus Datei)' }]);
    await fensterOeffnen(page, 'characters', datei);
    await modusWaehlen(page, 'replace');
    await importieren(page, 'Ersetzen Charaktere bei offenem Formular');
    const importiert = await einsInD(page, 'characters');
    expect(importiert?.name, 'Vorbedingung: id 1 ist jetzt Mira').toBe('Mira (aus Datei)');

    const stand = await formularStand(page, 'char-form', 'edit-char-id', 'char-name');
    weich(
        stand.offen && (stand.id !== '' || stand.name !== ''),
        `R7: das Party-Formular ist nach dem Import geleert oder geschlossen — war ${JSON.stringify(stand)}`
    ).toBe(false);

    const stand0 = await meldungsStand(page);
    await speichernFallsDa(
        page,
        page.locator('#char-form').getByRole('button', { name: 'Speichern', exact: true })
    );
    weich(
        (await meldungenSeit(page, stand0)).filter(m => /Charakter aktualisiert/.test(m)),
        'R7: kein "Charakter aktualisiert" nach dem Import (gemessen: Thorin ueber Mira)'
    ).toEqual([]);
    await bleibtImportiert(
        page,
        'characters',
        importiert,
        'die importierte Mira bleibt feldgleich'
    );
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(10) liegengebliebene Quest-Bearbeitung (✏️ → ✕) und Ersetzen: das Formular ist geleert, "+ Quest" → Speichern legt neu an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(
        page,
        kampagne({ quests: [quest(1, 'Die verlorene Fracht', { rewardGold: 250 })] })
    );
    await zuAnsicht(page, 'quests');
    await questBearbeiten(page, 1);
    const modal = page.locator('#quest-modal');
    await expect(modal, 'Vorbedingung: ✏️ oeffnet das Quest-Formular').toBeVisible();
    await expect(page.locator('#quest-title')).toHaveValue('Die verlorene Fracht');
    await modal.locator('[data-action="hide-modal"][data-value="quest-modal"]').first().click();
    await expect(modal).toBeHidden();
    // Heute laesst ✕ die ID liegen (gemessen, Kontrolle 14) — das ist die Lage,
    // die der Import leeren muss. KEINE Vorbedingung: verwirft ein Fix die
    // Bearbeitung schon beim Schliessen, liegt nichts mehr, und die Zusage
    // unten haelt trotzdem (ein gueltiger Weg, er darf hier nicht rot werden).
    test.info().annotations.push({
        type: 'nach ✕',
        description: `#edit-quest-id = "${await page.locator('#edit-quest-id').inputValue()}"`
    });

    const datei = dateiBauen('quests', [
        quest(1, 'Botengang (aus Datei)', { description: '<p>Neu</p>', rewardGold: 5 })
    ]);
    await fensterOeffnen(page, 'quests', datei);
    await modusWaehlen(page, 'replace');
    await importieren(page, 'Ersetzen Quests bei liegengebliebener Bearbeitung');
    const importiert = await einsInD(page, 'quests');
    expect(importiert?.title, 'Vorbedingung: id 1 ist jetzt der Botengang').toBe(
        'Botengang (aus Datei)'
    );
    weich(
        {
            id: await page.locator('#edit-quest-id').inputValue(),
            titel: await page.locator('#quest-title').inputValue()
        },
        'R7: die liegengebliebene Bearbeitung ist beim Import geleert'
    ).toEqual({ id: '', titel: '' });

    await page
        .locator('#view-quests')
        .getByRole('button', { name: '+ Quest', exact: true })
        .click();
    await expect(modal).toBeVisible();
    await eintippen(page, '#quest-title', 'Neue Quest');
    const rev = await revStand(page);
    await modal.getByRole('button', { name: 'Speichern', exact: true }).click();
    await geschriebenSeit(page, rev, '"+ Quest" → Speichern');
    weich(
        (await ausD(page, 'quests')).map(/** @param {any} q */ q => q.title),
        'R7: "+ Quest" legt eine NEUE Quest an'
    ).toEqual(['Botengang (aus Datei)', 'Neue Quest']);
    await bleibtImportiert(
        page,
        'quests',
        importiert,
        'der importierte Botengang bleibt feldgleich'
    );
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(11) offenes Encounter-Formular (✏️ Encounter 1) und Ersetzen: Speichern überschreibt den importierten Oger nicht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne({ encounters: [GOBLIN] }));
    await zuAnsicht(page, 'encounters');
    await page.locator('.enc-item[data-id="1"]').click();
    await page.locator('[data-action="edit-encounter"][data-id="1"]').click();
    expect(
        await formularStand(page, 'enc-form', 'edit-enc-id', 'enc-name'),
        'Vorbedingung: ✏️ oeffnet das Klappformular mit dem Goblin'
    ).toEqual({ offen: true, id: '1', name: 'Goblin-Hauptmann' });

    const datei = dateiBauen('encounters', [
        {
            ...GOBLIN,
            name: 'Oger (aus Datei)',
            creatureType: 'giant',
            cr: '2',
            ac: 11,
            hp: 59,
            traits: '<p>Stark</p>',
            equipment: '',
            actions: '<p>Keule</p>'
        }
    ]);
    await fensterOeffnen(page, 'encounters', datei);
    await modusWaehlen(page, 'replace');
    await importieren(page, 'Ersetzen Encounter bei offenem Formular');
    const importiert = await einsInD(page, 'encounters');
    expect(importiert?.name, 'Vorbedingung: id 1 ist jetzt der Oger').toBe('Oger (aus Datei)');

    const stand = await formularStand(page, 'enc-form', 'edit-enc-id', 'enc-name');
    weich(
        stand.offen && (stand.id !== '' || stand.name !== ''),
        `R7: das Encounter-Formular ist nach dem Import geleert oder geschlossen — war ${JSON.stringify(stand)}`
    ).toBe(false);
    await speichernFallsDa(
        page,
        page.locator('#enc-form').getByRole('button', { name: 'Speichern', exact: true })
    );
    await bleibtImportiert(
        page,
        'encounters',
        importiert,
        'der importierte Oger bleibt feldgleich'
    );
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

// Die Link-Karte ist weder Modal noch Klappformular: eine Karte unter der
// Leiste, mit dem 📥 darueber erreichbar. ✏️ setzt `#edit-link-id` und blendet
// sie ein; saveLink() schreibt per Spread auf denselben Index — dasselbe
// Muster wie K3, nur ohne Kopfzeile. Gemessen an der Fix-Skizze, die nur
// Party, Encounter und Quest leerte: "Speichern" schrieb den bearbeiteten
// Link ueber den importierten ("Link aktualisiert"), in D, im Speicher und
// nach dem Neuladen.

const REGELWERK = {
    id: 1,
    title: 'Regelwerk',
    url: 'https://example.org/regeln',
    category: 'rules',
    description: ''
};

test('(12) offene Link-Karte (✏️ Link 1) und Ersetzen: Speichern überschreibt den importierten Link nicht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(
        page,
        kampagne({
            links: [
                REGELWERK,
                {
                    id: 2,
                    title: 'Kartenwerkzeug',
                    url: 'https://example.org/karten',
                    category: 'maps',
                    description: ''
                }
            ]
        })
    );
    await zuAnsicht(page, 'links');
    await page.locator('#links-list [data-action="edit-link"][data-id="1"]').click();
    const karte = page.locator('#link-form-card');
    await expect(karte, 'Vorbedingung: ✏️ blendet die Link-Karte ein').toBeVisible();
    await expect(page.locator('#edit-link-id')).toHaveValue('1');
    await expect(page.locator('#link-title')).toHaveValue('Regelwerk');

    const datei = dateiBauen('links', [
        {
            id: 1,
            title: 'Bestiarium (aus Datei)',
            url: 'https://example.org/bestiarium',
            category: 'tools',
            description: ''
        }
    ]);
    await fensterOeffnen(page, 'links', datei);
    await modusWaehlen(page, 'replace');
    await importieren(page, 'Ersetzen Links bei offener Karte');
    const importiert = await einsInD(page, 'links');
    expect(importiert?.title, 'Vorbedingung: id 1 ist jetzt das Bestiarium').toBe(
        'Bestiarium (aus Datei)'
    );

    const stand = {
        sichtbar: await karte.isVisible(),
        id: await page.locator('#edit-link-id').inputValue(),
        titel: await page.locator('#link-title').inputValue()
    };
    weich(
        stand.sichtbar && (stand.id !== '' || stand.titel !== ''),
        `R7: die Link-Karte ist nach dem Import geleert oder ausgeblendet — war ${JSON.stringify(stand)}`
    ).toBe(false);

    const stand0 = await meldungsStand(page);
    await speichernFallsDa(page, karte.getByRole('button', { name: 'Speichern', exact: true }));
    weich(
        (await meldungenSeit(page, stand0)).filter(m => /Link aktualisiert/.test(m)),
        'R7: kein "Link aktualisiert" nach dem Import (gemessen: Regelwerk ueber Bestiarium)'
    ).toEqual([]);
    await bleibtImportiert(page, 'links', importiert, 'der importierte Link bleibt feldgleich');
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

// ===========================================================================
// (13)-(14) KONTROLLEN — heute gruen; sie halten die Werkzeuge der Faelle fest
// ===========================================================================

test('(13) Export und Dateiwahl tragen, was die Fälle brauchen (Kontrolle)', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(QUELLE));
    // Die internen Verweise stehen in der Datei — sonst waere "zeigt auf die
    // Kopie" in (1), (2), (5), (6) nichts wert. Die Fremdverweise, die schon
    // der heutige Export schreibt, auch (er filtert auf IO_SCHEMA; was er
    // verliert, ist R4 und zaehlt hier nicht).
    const npcs = await exportieren(page, 'npcs');
    weich(
        npcs.json.data.map(
            /** @param {any} n */ n => [
                n.name,
                (n.relations || [])
                    .filter(/** @param {any} r */ r => r.targetType === 'npcs')
                    .map(/** @param {any} r */ r => r.targetId),
                n.locationId
            ]
        ),
        'der NPC-Export traegt die Beziehungen NPC→NPC und den Ort'
    ).toEqual([
        ['Buergermeister Alrik', [2], 1],
        ['Schmugglerin Vela', [1], null],
        ['Fischer Brom', [1, 7], null]
    ]);
    const wiki = await exportieren(page, 'wiki');
    weich(
        wiki.json.data.map(/** @param {any} w */ w => [w.title, w.parentId]),
        'der Wiki-Export traegt die Eltern'
    ).toEqual([
        ['Weltwissen', null],
        ['Goetter', 1],
        ['Pantheon', 2]
    ]);
    const quests = await exportieren(page, 'quests');
    weich(
        quests.json.data.map(/** @param {any} q */ q => [q.title, q.giverId, q.locationId]),
        'der Quest-Export traegt Geber und Ort'
    ).toEqual([
        ['Die verlorene Fracht', 1, 2],
        ['Botengang', null, null],
        ['Nachtwache', null, null]
    ]);
    // Der 📥 der Faelle oeffnet einen Dateidialog — rot werden die Faelle
    // heute erst danach, am Fenster.
    await zuAnsicht(page, 'npcs');
    const [waehler] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: FENSTER_MS }),
        ioLeiste(page, 'npcs').locator(':is(button, label)', { hasText: '📥' }).click()
    ]);
    weich(waehler.isMultiple(), 'der 📥 der NPCs oeffnet einen Dateidialog fuer EINE Datei').toBe(
        false
    );
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

test('(14) die Speicher-Wege der Formulare schreiben, ✏️ setzt die Quest-ID (Kontrolle)', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(
        page,
        kampagne({
            characters: [{ ...THORIN, spells: [], items: [] }],
            encounters: [GOBLIN],
            quests: [quest(1, 'Die verlorene Fracht')],
            links: [REGELWERK]
        })
    );
    // Party: ✏️ → Name aendern → Speichern schreibt in id 1.
    await zuAnsicht(page, 'characters');
    await page.locator('[data-action="edit-char"][data-id="1"]').first().click();
    await eintippen(page, '#char-name', 'Thorin Eichenschild');
    let rev = await revStand(page);
    await page
        .locator('#char-form')
        .getByRole('button', { name: 'Speichern', exact: true })
        .click();
    await geschriebenSeit(page, rev, 'Party → Speichern');
    weich((await einsInD(page, 'characters'))?.name, 'Party: Speichern schreibt in id 1').toBe(
        'Thorin Eichenschild'
    );
    // Encounter: ✏️ → Name aendern → Speichern schreibt in id 1.
    await zuAnsicht(page, 'encounters');
    await page.locator('.enc-item[data-id="1"]').click();
    await page.locator('[data-action="edit-encounter"][data-id="1"]').click();
    await eintippen(page, '#enc-name', 'Goblin-Boss');
    rev = await revStand(page);
    await page.locator('#enc-form').getByRole('button', { name: 'Speichern', exact: true }).click();
    await geschriebenSeit(page, rev, 'Encounter → Speichern');
    weich((await einsInD(page, 'encounters'))?.name, 'Encounter: Speichern schreibt in id 1').toBe(
        'Goblin-Boss'
    );
    // Link: ✏️ → Titel aendern → Speichern schreibt in id 1.
    await zuAnsicht(page, 'links');
    await page.locator('#links-list [data-action="edit-link"][data-id="1"]').click();
    await eintippen(page, '#link-title', 'Regelwerk 2024');
    rev = await revStand(page);
    await page
        .locator('#link-form-card')
        .getByRole('button', { name: 'Speichern', exact: true })
        .click();
    await geschriebenSeit(page, rev, 'Link → Speichern');
    weich((await einsInD(page, 'links'))?.title, 'Link: Speichern schreibt in id 1').toBe(
        'Regelwerk 2024'
    );
    // Quest: ✏️ setzt #edit-quest-id — die Lage, von der (10) ausgeht. Was ✕
    // danach damit tut, ist nur eine Notiz: heute bleibt die ID liegen; ein Fix,
    // der sie beim Schliessen verwirft, ist ein gueltiger Weg zu R7.
    await zuAnsicht(page, 'quests');
    await questBearbeiten(page, 1);
    const modal = page.locator('#quest-modal');
    await expect(modal).toBeVisible();
    weich(await page.locator('#edit-quest-id').inputValue(), 'Quest: ✏️ setzt die ID').toBe('1');
    await modal.locator('[data-action="hide-modal"][data-value="quest-modal"]').first().click();
    await expect(modal).toBeHidden();
    test.info().annotations.push({
        type: 'Quest nach ✕',
        description: `#edit-quest-id = "${await page.locator('#edit-quest-id').inputValue()}"`
    });
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});

// ===========================================================================
// (15)-(18) R7 UEBER STRG+Z / STRG+Y
// ===========================================================================
//
// R7 sagt "ein spaeteres Speichern ueberschreibt keinen importierten Eintrag",
// R8 verspricht, dass Strg+Z den Import zuruecknimmt und Strg+Y ihn
// wiederherstellt. Beides zusammen oeffnet K3 ein zweites Mal: Rueckgaengig
// und Wiederholen tauschen beim Ersetzen aus, WELCHER Eintrag hinter einer ID
// steht — genau wie der Import selbst. Gemessen am Stand a3822abf (Pruefer,
// Runde 1, Sonden p6/p7): Ersetzen (id 1 ist jetzt Mira) → Strg+Z (Thorin
// wieder id 1) → ✏️ Thorin → Strg+Y (id 1 ist wieder Mira) → "Speichern"
// schrieb Thorin ueber Mira, "Charakter aktualisiert"; ueber die Kopf-Knoepfe
// ↩️/↪️ identisch, beim Encounter ueberschrieb der Goblin den Oger. Und
// spiegelbildlich: Ersetzen → ✏️ Mira → Strg+Z → "Speichern" schrieb Mira
// ueber den urspruenglichen Thorin. Der Verwaist-Schutz greift nicht — die
// ID gehoert danach einem ANDEREN Eintrag. Je Richtung ein Fall, die Party
// ueber die Tasten, der Encounter ueber die Kopf-Knoepfe.

/**
 * Der gemeinsame Ablauf von (15)-(18).
 * @param {import('@playwright/test').Page} page
 * @param {{
 *   typ: 'characters'|'encounters',
 *   saat: Record<string, any>,
 *   datei: { name: string, buffer: Buffer },
 *   bearbeiten: () => Promise<void>,
 *   formular: string, idFeld: string, nameFeld: string,
 *   richtung: 'undo'|'redo',
 *   weg: 'tasten'|'knoepfe',
 *   meldung: RegExp
 * }} f
 */
async function nachUndoSpeichern(page, f) {
    const fehler = fehlerFangen(page);
    await appLaden(page, kampagne(f.saat));
    await zuAnsicht(page, f.typ);
    const original = await einsInD(page, f.typ);
    expect(original, 'Vorbedingung: id 1 steht in der Saat').not.toBeNull();
    await fensterOeffnen(page, f.typ, f.datei);
    await modusWaehlen(page, 'replace');
    await importieren(page, `Ersetzen ${f.typ}`);
    const importiert = await einsInD(page, f.typ);
    expect(importiert?.name, 'Vorbedingung: id 1 ist jetzt der Eintrag der Datei').toMatch(
        /aus Datei/
    );

    /** @param {'undo'|'redo'} was @param {any} soll */
    const schritt = async (was, soll) => {
        const rev = await revStand(page);
        if (f.weg === 'tasten') {
            await page.keyboard.press(was === 'undo' ? 'Control+z' : 'Control+y');
        } else {
            await page.locator(`.header-action-btn[data-action="${was}"]`).click();
        }
        await geschriebenSeit(page, rev, was === 'undo' ? 'Strg+Z' : 'Strg+Y');
        expect(
            (await einsInD(page, f.typ))?.name,
            `Vorbedingung: nach ${was === 'undo' ? 'Strg+Z' : 'Strg+Y'} steht "${soll.name}" unter id 1`
        ).toBe(soll.name);
    };

    // undo: ✏️ am IMPORTIERTEN Eintrag, dann Strg+Z — danach gehoert id 1
    // wieder dem Original. redo: erst Strg+Z, ✏️ am ORIGINAL, dann Strg+Y —
    // danach gehoert id 1 wieder dem importierten Eintrag.
    if (f.richtung === 'redo') await schritt('undo', original);
    await f.bearbeiten();
    expect(
        await formularStand(page, f.formular, f.idFeld, f.nameFeld),
        'Vorbedingung: ✏️ oeffnet das Formular mit id 1'
    ).toEqual({
        offen: true,
        id: '1',
        name: (f.richtung === 'redo' ? original : importiert).name
    });
    const soll = f.richtung === 'redo' ? importiert : original;
    await schritt(f.richtung, soll);

    const stand = await formularStand(page, f.formular, f.idFeld, f.nameFeld);
    weich(
        stand.offen && (stand.id !== '' || stand.name !== ''),
        `R7: das Formular ist nach ${f.richtung === 'redo' ? 'Strg+Y' : 'Strg+Z'} geleert oder geschlossen — war ${JSON.stringify(stand)}`
    ).toBe(false);
    const stand0 = await meldungsStand(page);
    await speichernFallsDa(
        page,
        page.locator(`#${f.formular}`).getByRole('button', { name: 'Speichern', exact: true })
    );
    weich(
        (await meldungenSeit(page, stand0)).filter(m => f.meldung.test(m)),
        'R7: kein "… aktualisiert" — das Formular schreibt nicht ueber den Eintrag unter id 1'
    ).toEqual([]);
    await bleibtImportiert(
        page,
        f.typ,
        soll,
        f.richtung === 'redo'
            ? 'der wiederhergestellte importierte Eintrag bleibt feldgleich'
            : 'das Original bleibt feldgleich'
    );
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
}

/** ✏️ an Charakter 1 (Klappformular der Party).
 *  @param {import('@playwright/test').Page} page */
const charBearbeiten = page => async () => {
    await page.locator('[data-action="edit-char"][data-id="1"]').first().click();
};

/** ✏️ an Encounter 1: erst die Karte waehlen, dann ✏️ im Detail.
 *  @param {import('@playwright/test').Page} page */
const encBearbeiten = page => async () => {
    await page.locator('.enc-item[data-id="1"]').click();
    await page.locator('[data-action="edit-encounter"][data-id="1"]').click();
};

const PARTY_UNDO = {
    typ: /** @type {'characters'} */ ('characters'),
    saat: { characters: [{ ...THORIN, spells: [], items: [] }, KIRA] },
    datei: dateiBauen('characters', [MIRA, { ...MIRA, id: 2, name: 'Bob (aus Datei)' }]),
    formular: 'char-form',
    idFeld: 'edit-char-id',
    nameFeld: 'char-name',
    weg: /** @type {'tasten'} */ ('tasten'),
    meldung: /Charakter aktualisiert/
};

const ENCOUNTER_UNDO = {
    typ: /** @type {'encounters'} */ ('encounters'),
    saat: { encounters: [GOBLIN] },
    datei: dateiBauen('encounters', [
        {
            ...GOBLIN,
            name: 'Oger (aus Datei)',
            creatureType: 'giant',
            cr: '2',
            ac: 11,
            hp: 59,
            traits: '<p>Stark</p>',
            equipment: '',
            actions: '<p>Keule</p>'
        }
    ]),
    formular: 'enc-form',
    idFeld: 'edit-enc-id',
    nameFeld: 'enc-name',
    weg: /** @type {'knoepfe'} */ ('knoepfe'),
    // saveEncounter() meldet beim Ueberschreiben nichts — entscheidend ist D
    meldung: /aktualisiert/
};

test('(15) Ersetzen → ✏️ am importierten Charakter → Strg+Z → Speichern: der ursprüngliche Thorin bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    await nachUndoSpeichern(page, {
        ...PARTY_UNDO,
        bearbeiten: charBearbeiten(page),
        richtung: 'undo'
    });
});

test('(16) Ersetzen → Strg+Z → ✏️ Thorin → Strg+Y → Speichern: die wiederhergestellte Mira bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    await nachUndoSpeichern(page, {
        ...PARTY_UNDO,
        bearbeiten: charBearbeiten(page),
        richtung: 'redo'
    });
});

test('(17) Ersetzen → ✏️ am importierten Encounter → ↩️ → Speichern: der ursprüngliche Goblin bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    await nachUndoSpeichern(page, {
        ...ENCOUNTER_UNDO,
        bearbeiten: encBearbeiten(page),
        richtung: 'undo'
    });
});

test('(18) Ersetzen → ↩️ → ✏️ Goblin → ↪️ → Speichern: der wiederhergestellte Oger bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    await nachUndoSpeichern(page, {
        ...ENCOUNTER_UNDO,
        bearbeiten: encBearbeiten(page),
        richtung: 'redo'
    });
});

// ===========================================================================
// (19) R7 UEBER STRG+Z BEI EINEM FORMULAR IM FENSTER (ORT)
// ===========================================================================
//
// Befund der Pruefer (Runde 2, Tests, am Mutanten gemessen): (15)-(18) und
// (9)-(12) fahren nur Klappformulare und die Link-Karte. Mit vertippten
// Feld-IDs in REITER_BEARBEITEN fuer die sechs Typen mit Fenster (NPC, Ort,
// Truhe, Zauber, Wiki, Session-Prep) blieben alle vier Waechter gruen — und
// am Mutanten blieb nach Ersetzen (id 1 = "Neu (aus Datei)") → ✏️ Ort 1 →
// Strg+Z das Ortsfenster offen mit `edit-loc-id` 1; "Speichern" schrieb den
// importierten Namen ueber die zurueckgeholte "Hafenstadt". Strg+Z wirkt
// auch beim Tippen (systems/spellslots/keyboard-shortcuts.js prueft es vor
// der Tipp-Schranke), darum steht der Fokus hier im Namensfeld des Fensters.
// Die Tabelle selbst haelt tests/unit/reiterimport-verweise.test.js (F11).
test('(19) Ersetzen → ✏️ am importierten Ort (Fenster) → Strg+Z im Namensfeld → Speichern: die ursprüngliche Hafenstadt bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await appLaden(
        page,
        kampagne({
            locations: [
                { id: 1, name: 'Hafenstadt', description: '<p>alt</p>', filterId: null, tags: [] },
                { id: 2, name: 'Eiswueste', description: '', filterId: null, tags: [] }
            ]
        })
    );
    await zuAnsicht(page, 'locations');
    const original = await einsInD(page, 'locations');
    expect(original?.name, 'Vorbedingung: id 1 steht in der Saat').toBe('Hafenstadt');
    await fensterOeffnen(
        page,
        'locations',
        dateiBauen('locations', [
            {
                id: 1,
                name: 'Neu (aus Datei)',
                description: '<p>neu</p>',
                filterId: null,
                tags: []
            }
        ])
    );
    await modusWaehlen(page, 'replace');
    await importieren(page, 'Ersetzen Orte');
    expect(
        (await einsInD(page, 'locations'))?.name,
        'Vorbedingung: id 1 ist jetzt der Ort der Datei'
    ).toBe('Neu (aus Datei)');

    const fenster = page.locator('#location-modal');
    await page.locator('.loc-item[data-id="1"]').click();
    await page.locator('[data-action="edit-location"][data-id="1"]').click();
    await expect(fenster, 'Vorbedingung: ✏️ oeffnet das Ortsfenster').toBeVisible();
    expect(
        await page.locator('#edit-loc-id').inputValue(),
        'Vorbedingung: das Fenster bearbeitet id 1'
    ).toBe('1');
    await page.locator('#loc-name').click();
    const rev = await revStand(page);
    await page.keyboard.press('Control+z');
    await geschriebenSeit(page, rev, 'Strg+Z');
    expect(
        (await einsInD(page, 'locations'))?.name,
        'Vorbedingung: nach Strg+Z steht wieder "Hafenstadt" unter id 1'
    ).toBe('Hafenstadt');

    const stand = await page.evaluate(() => ({
        offen: !!document.getElementById('location-modal')?.classList.contains('show'),
        id: /** @type {HTMLInputElement|null} */ (document.getElementById('edit-loc-id'))?.value
    }));
    weich(
        stand.offen && stand.id !== '',
        `R7: nach Strg+Z bearbeitet das Fenster nicht mehr id 1 (geschlossen oder ohne ID) — war ${JSON.stringify(stand)}`
    ).toBe(false);
    await speichernFallsDa(page, fenster.getByRole('button', { name: 'Speichern', exact: true }));
    await bleibtImportiert(
        page,
        'locations',
        original,
        'die zurueckgeholte Hafenstadt bleibt feldgleich'
    );
    weich(await fehler.alle(), 'keine Fehler auf dem Weg').toEqual([]);
});
