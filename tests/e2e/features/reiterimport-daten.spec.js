// @ts-check
/**
 * Reiter-Import: was ankommt, was man sieht, was Strg+Z tut (REITERIMPORT, R4 und R8)
 * ====================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer in einem der zwoelf
 * Reiter mit 📤 exportiert und die Datei mit 📥 wieder einliest, bekommt jeden
 * Eintrag GANZ zurueck** — "Hinzufuegen" legt Kopien mit neuen IDs an,
 * "Ersetzen" stellt den exportierten Stand tief gleich wieder her —, und das
 * sieht er sofort in Liste und Zaehler, im Speicher, nach dem Neuladen und
 * nach Strg+Z/Strg+Y.
 *
 * Vertrag REITERIMPORT, docs/bugfixes.md. Diese Datei prueft R4 (Feldtreue)
 * und R8 (Ansicht, Zaehler, Undo); R1-R3, R5-R7, R9 und R10 haben eigene
 * Dateien. Der Branch REITERIMPORT setzt auf SENKEN auf (8702f84a, Ausgabe
 * kodiert, Datengrenze an jedem Eingang); am Rot-Nachweis zu ef782074 war
 * das Fehlerbild dieser Datei dort dasselbe wie am Buendel 020e258 unten.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu 020e258, 1440x900, Chromium. Ueber die Oberflaeche
 * kommt heute gar kein Reiter-Import an: nach der Dateiwahl gibt es kein
 * Fenster `#import-modal` (seit der TS-Migration baut es niemand). Mit einem
 * zur Laufzeit nachgebauten Fenster und dem unveraenderten Code der App
 * (executeImport) zeigte die Messung, was dahinter liegt:
 *
 *   Export (📤)                 filtert jeden Eintrag auf ein festes Schema:
 *                               Charakter 22 von 35 Feldern weg (Klasse,
 *                               RK, Attribute, Waehrung, Avatar …), NPC 9-11,
 *                               Quest 12 (aus "abgeschlossen" wird "offen"),
 *                               Loot 6, Zauber 8, Session-Prep 4, Fraktion 2;
 *                               dafuer erfundene Felder `class`, `ac`,
 *                               `hpTemp`, `str`…`cha`, `avatarUrl` mit
 *                               Vorgabewerten (`ac: 10`, `str: 10`)
 *   Import Ersetzen             uebernimmt diese verstuemmelten Eintraege —
 *                               ein Rundlauf ersetzt volle Eintraege durch
 *                               halbe
 *   Session-Prep, Kalender,     Zaehler und Liste bleiben nach dem Import
 *   Fraktionen                  veraltet, bis man den Reiter wechselt
 *                               (renderAll() kennt keine Welt-Ansicht,
 *                               updateIOCounts() keinen ihrer Zaehler)
 *   Strg+Z / Strg+Y             nehmen den Import in einem Schritt zurueck
 *                               bzw. stellen ihn her (D); Ersetzen legt eine
 *                               Sicherheitskopie an — beides funktionierte
 *                               am nachgebauten Fenster
 *
 * DIE URSACHEN stehen in `systems/spellslots/import-export.js`: exportData()
 * baut jeden Eintrag nur aus den Schluesseln von `IO_SCHEMA` neu, dessen
 * Charakter-Teil Namen benutzt, die das Datenmodell nie hatte (`avatarUrl`
 * kommt im ganzen Quellbaum nur dort vor); showImportModal() tut beim Lesen
 * dasselbe; executeImport() ruft renderAll() und updateIOCounts(), die die
 * drei Welt-Reiter nicht kennen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag REITERIMPORT), die diese Datei prueft
 *
 *   R4  Der Reiter-Export schreibt den GANZEN Eintrag und eine Formatkennung.
 *       Export → Import (Ersetzen) ergibt den Eintrag tief gleich — fuer alle
 *       12 Typen (2-4) und fuer einen ueber das echte Formular angelegten
 *       Charakter (5) und NPC (6). Eine alte Datei ohne Formatkennung: die
 *       Vorschau warnt, und `class`, `ac`, `hpTemp`, `str`…`cha`,
 *       `avatarUrl` landen NICHT in `characterClass`, `armorClass`,
 *       `tempHp`, `attributes`, `avatar` (7). Auch ein alter Wiki-Export,
 *       dem NUR die Kennung fehlt, warnt (7). Eine frische Exportdatei warnt
 *       NICHT (2-6) — sonst waere die Warnung kein Merkmal. "HTML-Felder
 *       werden wie heute an der Grenze bereinigt": eine Nutzlast in den
 *       HTML-Feldern kommt als `sanitizeHTML()`-Ergebnis an (9), und NUR
 *       dort — Klartext mit `<`, `&`, `Bonus=2` in Nicht-HTML-Feldern
 *       ueberlebt den Rundlauf unveraendert (KLARTEXT_FELDER, 2-4 und 9).
 *   R8  Liste, Detail und Zaehler des Reiters sind sofort aktuell, auch
 *       Session-Prep, Kalender und Fraktionen (2-6); Strg+Z nimmt den Import
 *       in EINEM Schritt zurueck, Strg+Y stellt ihn her, und der offene
 *       Reiter zeigt jeweils den Stand, den D hat; Ersetzen legt eine
 *       Sicherheitskopie an (8). Nach dem Neuladen ist der Import da (2-6, 8).
 *   Kontrolle (1): die Typliste kommt aus dem Buendel und deckt sich mit der
 *       Saat dieser Datei; die HTML-Werte der Saat bestehen die Bereinigung
 *       unveraendert, ihr Klartext mit Sonderzeichen wuerde von ihr
 *       veraendert und steht unveraendert in D.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WIE DIE FAELLE BEDIENEN
 *
 * Nur echte Klicks, Tasten und Dateiwahl; `evaluate` saet und liest. Der
 * Oberflaechen-Vertrag ist der des Vertrags: das 📥 neben jedem
 * `.io-file-input[data-on-change="importData"]` oeffnet EINEN Dateidialog, nach
 * der Wahl oeffnet sich `#import-modal` mit der Vorschau `#import-info`, den
 * Radios `input[name="import-mode"]` (`merge` = "Hinzufügen", `replace` =
 * "Ersetzen") und `[data-action="execute-import"]` ("Importieren"). Die Datei
 * kommt als Puffer an `filechooser.setFiles()` — sie ist der echte Export
 * der App (📤, beim Zauber-Reiter das Aufklappmenue "📄 JSON"), abgefangen
 * als Download, (9) derselbe Export mit einer Nutzlast in den HTML-Feldern
 * (Kopf unberuehrt, damit die Formatkennung bleibt, wie immer sie heisst),
 * oder (7) alte Dateien, wie der Export vor dem Fix sie schrieb. Hinzufuegen und Ersetzen bekommen je einen eigenen Dateinamen:
 * dass dieselbe Datei zweimal hintereinander waehlbar ist (R1), prueft eine
 * andere Datei, und ihr Fehlen soll hier nicht als R4/R8 erscheinen.
 *
 * Oeffnet sich das Fenster nicht, gehen die Faelle WEITER: jede Zusage wird
 * weich geprueft, damit ein roter Lauf nennt, was alles fehlt — heute also
 * nicht nur "kein Fenster", sondern auch "D unveraendert", "nichts
 * geschrieben", "keine Kopie", "nicht neu geladen".
 *
 * "SOFORT AKTUELL" heisst: direkt nach dem Import — ohne Reiterwechsel —
 * steht im Zaehler `#<ansicht>-count` die Zahl aus D, und der Anzeigename
 * des ersten Saat-Eintrags kommt in `#view-<ansicht>` genau so oft vor wie
 * nachdem die Ansicht ueber die Navigation neu gezeichnet wurde. Beim
 * Hinzufuegen muss er dazu OEFTER vorkommen als vorher. Das ist bewusst ein
 * Vergleich mit der App selbst und keine feste Zahl: wie oft ein Name
 * erscheint (Karte, Detail, Uebersicht), entscheidet die Ansicht.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE SAAT: JE TYP EIN EINTRAG A UND EIN EINTRAG B
 *
 * A traegt jedes Feld, das die Speicherfunktion des Typs schreibt, dazu ein
 * Feld, das kein Formular kennt (`eigenesFeld`), aber KEINEN Verweis: alle
 * Verweisfelder sind leer (null, '' oder []). B traegt die Verweise
 * (NPC→Ort, Quest→NPC, Fraktion→Mitglieder, Wiki→Eltern …). Freitext, der
 * einen Namen nennt (`npcs.quests`, `relationships`, `szenen[].ort`,
 * `wichtigeNpcs`), ist kein Verweis — das Formular nimmt ihn als Text — und
 * steht darum auch in A.
 * Warum getrennt: beim Hinzufuegen schreibt R5 Verweise um bzw. leert sie
 * (eigene Datei). Darum vergleicht diese Datei beim Hinzufuegen nur die
 * Kopie von A mit A — bis auf die ID und bis auf Felder, die leer sind (ob
 * ein Fix einen geleerten Verweis als null, '' oder [] schreibt oder den
 * Schluessel weglaesst, ist hier gleichgueltig). Von B verlangt sie nur,
 * dass eine Kopie mit neuer ID da ist. Beim Ersetzen dagegen bleibt jeder
 * Verweis, wie er ist: dort sind A UND B tief gleich, Verweise eingeschlossen.
 * Welche Typen es gibt, liest jeder Fall aus dem Buendel; ein Typ ohne
 * Saateintrag hier haelt den Fall hart an (die Liste ist gewachsen — dann
 * braucht er eine Saat, Kontrolle (1) nennt ihn).
 *
 * WIE DIE ALTE-DATEI-WARNUNG ERKANNT WIRD (R4): der Vertrag sagt "Vorschau
 * warnt", nicht mit welchen Worten. Erkannt wird sie in `#import-info` an
 * - "alte/ältere/frühere/veraltete …" VOR einem Wort fuer die Datei
 *   ("alte Datei", "ältere Exportdatei", "älteren Version", "früheren
 *   App-Version", "älteres Dateiformat"), oder am Praedikat "veraltet";
 * - der FEHLENDEN Kennung: "ohne/keine/fehlende (Format)kennung",
 *   "(Format)kennung fehlt", "Formatkennung: keine";
 * - "verlustbehaftet", "unvollständig".
 * Bewusst NICHT an "alten Einträgen" (eine Ersetzen-Vorschau einer frischen
 * Datei darf sagen "die 2 alten Einträge werden ersetzt", R6) und nicht an
 * einer bloss genannten Kennung ("Formatkennung: reiter-export-2") — beides
 * hat die erste Fassung dieser Datei als Warnung gelesen und haette einen
 * richtigen Fix rot gemacht. Nicht an "⚠️": die Vorschau darf auch fuer
 * frische Dateien warnen, z. B. vor geleerten Verweisen (R5) oder vor
 * Verweisen auf jetzt fehlende IDs (R6). Keine Saat und keine Datei hier
 * enthaelt eine dieser Wendungen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei)
 *
 * Am unveraenderten Buendel sind (2)-(9) rot, jeder an seiner Regel — nicht
 * nur am fehlenden Fenster: "D unveraendert", "kein _rev", Kopie fehlt,
 * nichts nach dem Neuladen. (1) ist gruen.
 * Gegen eine Buendelkopie mit einem HALBEN Fix — statisches Fenster, das 📥
 * liest die gewaehlte Datei, sonst alles wie heute (Export- und
 * Importfilter, renderAll() ohne Welt-Ansichten) — blieben (2)-(8) rot, und
 * zwar an R4/R8: Export und Kopie verlieren Felder, Ersetzen ist nicht tief
 * gleich, die Welt-Reiter zeigen den alten Stand (auch nach Strg+Z), die
 * alte Datei warnt nicht. Mit einer Fix-Skizze — Export des ganzen Eintrags
 * mit Formatkennung, Durchlass beim Import, Warnung ohne Kennung, nach dem
 * Import und nach Strg+Z/Strg+Y der aktive Reiter neu gezeichnet — liefen
 * alle acht gruen. Dieselbe Skizze OHNE das Neuzeichnen nach Strg+Z liess
 * (8) rot (Zaehler und Liste nach Strg+Z): ein Fix, der nur nach dem Import
 * neu zeichnet, reicht nicht — undo()/redo() zeichnen ueber renderAll(), und
 * das kennt keine Welt-Ansicht.
 * ZWEITE GEGENPROBE (Pruefung der ersten Fassung, ebenfalls Buendelkopien):
 * drei Teil-Fixes liefen gegen (1)-(8) VOLLSTAENDIG gruen, obwohl R4 sie
 * verletzt sieht — (a) Import ohne jede Bereinigung (Datei roh nach D),
 * (b) Bereinigung JEDES Textfelds mit sanitizeHTML(), (c) Alte-Datei-Warnung
 * nur bei verraeterischen Feldern (`class`, `avatarUrl`, `hpTemp`) statt an
 * der fehlenden Kennung. Seitdem: (a) ist in (9) rot, (b) in (2)-(4), (8)
 * und (9) am Klartext mit Sonderzeichen, (c) in (7) am alten Wiki-Export.
 * (9) verglich zuerst gegen die exportierte Datei und war damit gegen den
 * halben Fix (heutiger Export- UND Importfilter) gruen — er vergleicht
 * jetzt gegen D vor dem Export. Weiter rot wie verlangt: Fenster allein
 * (heutiger zweiter Dialog) (2)-(9); Fenster + heutiger Datenpfad
 * (showImportModal/executeImport unveraendert) (2)-(9); Skizze ohne
 * Welt-Neuzeichnen (2)-(4), (8); Import in zwei Undo-Schritten (8);
 * ohne Sicherheitskopie (8); Abbildung `class`→`characterClass` … (7).
 * Die Fix-Skizze lief mit allen neun gruen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Zahl der Dateidialoge, gleiche Datei zweimal, Abbrechen (R1);
 * Meldungstexte (R2); kaputte Dateien (R3); wohin Verweise beim Hinzufuegen
 * zeigen (R5); ungueltige oder doppelte IDs beim Ersetzen (R6); offene
 * Formulare (R7); ob Nutzlasten in Liste oder Detail laufen (R9 — (9)
 * prueft nur, dass HTML-Felder an der Grenze bereinigt in D ankommen, R4);
 * Telefon und Escape (R10). Ob der Import
 * fuer Sitzungsnotizen kommt (nicht in diesem PR): Kontrolle (1) haelt nur
 * fest, dass sie den einzigen Export ohne Import haben.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Wie lange das Fenster nach der Dateiwahl brauchen darf (FileReader). */
const FENSTER_MS = 3000;

/** Ein Bild, das ohne Netz laedt. */
const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

/** Woran die Warnung vor einer alten Datei erkannt wird — siehe Kopf. */
const ALTE_DATEI_WARNUNG =
    /(?<!\p{L})(?:alte[nrs]?|ältere[nrs]?|frühere[nrs]?|veraltete[nrs]?)\s+(?:\p{L}+\s+)?[\p{L}-]*?(?:datei|export|format|version|fassung)|(?<!\p{L})veraltet(?!\p{L})|(?:ohne|keine|fehlende[nr]?)\s+(?:format)?kennung|(?:format)?kennung(?::\s*|\s+)(?:fehlt|keine)|verlustbehaftet|unvollständig/iu;

/** Die Kopfschluessel, die der Export vor dem Fix schrieb — genau diese. */
const ALTER_KOPF = ['_exportDate', '_campaignName', '_version', '_dataType', 'data'];

// ===========================================================================
// SAAT
// ===========================================================================
//
// Je Typ: `feld` (das Namensfeld, an dem die Kopie von A erkannt wird),
// `anzeige` (wie A in der Liste heisst), A und B. Feldsaetze so, wie die
// Speicherfunktionen sie schreiben (`party-crud.js` saveCharacter,
// `npc-crud.js` saveNPC, `locations-crud.js`, `quests-crud.js`,
// `encounters-crud.js`, `initiative-loot.js`, `spell-manager.js`,
// `wiki-crud.js`, `links.js`, `session-prep-crud.js`, `timeline-crud.js`,
// `fraktionen-crud.js`), dazu die Querschnittsfelder avatar, tags, links,
// relations. Kein Text enthaelt ein Wort der Alte-Datei-Warnung.

/** @type {Record<string, { feld: string, anzeige: string, a: any, b: any }>} */
const SAAT = {
    characters: {
        feld: 'name',
        anzeige: 'Thorin Eisenfaust',
        a: {
            id: 1,
            name: 'Thorin Eisenfaust',
            playerName: 'Arthur',
            characterClass: 'Kämpfer',
            subclass: 'Champion',
            race: 'Zwerg',
            level: 5,
            background: 'Soldat (Sold < 15 GM & Bonus=2)',
            alignment: 'LG',
            weight: 80,
            height: 140,
            attributes: { str: 16, dex: 12, con: 15, int: 10, wis: 11, cha: 8 },
            saveProficiencies: {
                str: true,
                dex: false,
                con: true,
                int: false,
                wis: false,
                cha: false
            },
            hpCurrent: 40,
            hpMax: 44,
            tempHp: 5,
            armorClass: 18,
            initiative: 1,
            speed: '9m|30ft.',
            proficiencyBonus: 3,
            hitDice: '5d10',
            passivePerception: 12,
            inspiration: true,
            skillProficiencies: { athletics: true, perception: true },
            skillExpertise: { athletics: false },
            attacks: [{ name: 'Axt', attackBonus: 6, damage: '1d8+3', damageType: 'Hieb' }],
            resistances: ['poison'],
            immunities: [],
            languages: ['common', 'dwarvish'],
            spellSlots: { 0: { max: 0, current: 0 }, 1: { max: 2, current: 1 } },
            currency: { pm: 0, gm: 120, em: 3, sm: 7, km: 9 },
            notes: '<p>Notizen zu Thorin</p>',
            avatar: GIF,
            spells: [],
            items: [],
            conditions: [],
            tags: [{ name: 'tank', color: '#a855f7' }],
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            name: 'Kira Sturmwind',
            characterClass: 'Magier',
            race: 'Elf',
            level: 3,
            attributes: { str: 8, dex: 14, con: 12, int: 17, wis: 12, cha: 10 },
            hpCurrent: 16,
            hpMax: 16,
            armorClass: 12,
            speed: '9m|30ft.',
            spells: [1],
            items: [{ id: 1, quantity: 1 }],
            conditions: [],
            tags: [],
            links: [{ type: 'npcs', id: 1 }]
        }
    },
    npcs: {
        feld: 'name',
        anzeige: 'Buergermeister Alrik',
        a: {
            id: 1,
            name: 'Buergermeister Alrik',
            role: 'Buergermeister & Richter (Bonus=2, Rang < Graf)',
            race: 'Mensch',
            locationId: null,
            chapter: 'Kapitel 1',
            filterId: null,
            factionId: null,
            quests: ['Die verlorene Fracht'],
            info: ['reich', 'misstrauisch'],
            relationships: ['Bruder von Vela'],
            description: '<p>Beschreibung Alrik</p>',
            triggers: [
                { condition: 'Spieler bieten Gold', reveal: 'Wird gierig', triggered: true }
            ],
            dialogs: [
                { title: 'Begruessung', triggerCondition: '', text: 'Willkommen!', used: true }
            ],
            relations: [],
            avatar: GIF,
            tags: [{ name: 'adel', color: '#ef4444' }],
            links: [],
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            name: 'Schmugglerin Vela',
            role: 'Schmugglerin',
            race: 'Elf',
            locationId: 1,
            chapter: '',
            filterId: null,
            factionId: 1,
            quests: [],
            info: [],
            relationships: [],
            description: '',
            triggers: [],
            dialogs: [],
            relations: [
                { targetId: 1, targetType: 'npcs', status: 'friendly', note: 'Bruder' },
                { targetId: 1, targetType: 'characters', status: 'hostile', note: '' }
            ],
            tags: [],
            links: [{ type: 'quests', id: 1 }]
        }
    },
    locations: {
        feld: 'name',
        anzeige: 'Hafenstadt Brandung',
        a: {
            id: 1,
            name: 'Hafenstadt Brandung',
            description: '<p>Ort am Meer</p>',
            filterId: null,
            avatar: GIF,
            tags: [{ name: 'kueste', color: '#3b82f6' }],
            links: [],
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            name: 'Turmruine',
            description: '',
            filterId: null,
            tags: [],
            links: [{ type: 'npcs', id: 2 }]
        }
    },
    quests: {
        feld: 'title',
        anzeige: 'Die verlorene Fracht',
        a: {
            id: 1,
            title: 'Die verlorene Fracht',
            giverId: null,
            giverName: '',
            locationId: null,
            locationName: '',
            targetId: null,
            targetName: '',
            type: 'main',
            description: '<p>Quest-Beschreibung</p>',
            rewardGold: 250,
            rewardItems: [],
            rewardOther: 'Gunst des Rates & 1W6 < 4: Bonus=2',
            epilog: '<p>Epilog der Fracht</p>',
            completed: false,
            rewardReceived: false,
            tags: [{ name: 'haupt', color: '#22c55e' }],
            links: [],
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            title: 'Turmgeheimnis',
            giverId: 1,
            giverName: 'Buergermeister Alrik',
            locationId: 2,
            locationName: 'Turmruine',
            targetId: 2,
            targetName: 'Schmugglerin Vela',
            type: 'side',
            description: '',
            rewardGold: 0,
            rewardItems: [{ id: 1, name: 'Flammenschwert' }],
            rewardOther: '',
            epilog: '',
            completed: true,
            rewardReceived: true,
            tags: [],
            links: []
        }
    },
    encounters: {
        feld: 'name',
        anzeige: 'Goblin-Hauptmann',
        a: {
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
            equipment: '<p>Kettenhemd, Schild</p>',
            actions: '<p>Krummsaebel</p>',
            skills: '<p>Heimlichkeit +6</p>',
            tags: [{ name: 'boss', color: '#f59e0b' }],
            eigenesFeld: 'bleibt'
        },
        b: {
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
    },
    loot: {
        feld: 'name',
        anzeige: 'Flammenschwert',
        a: {
            id: 1,
            name: 'Flammenschwert',
            category: 'weapon',
            rarity: 'rare',
            quantity: 1,
            weight: 3,
            value: 500,
            description: 'Brennt bei Beruehrung',
            origin: 'Drachenhort',
            special: '+1W6 Feuer, wenn RK < 15 & Bonus=2',
            property: 'Vielseitig',
            tags: ['attunement'],
            attunement: true,
            assignedTo: '',
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            name: 'Heiltrank',
            category: 'potion',
            rarity: 'common',
            quantity: 3,
            value: 50,
            description: '',
            tags: [],
            assignedTo: 'Thorin Eisenfaust'
        }
    },
    spells: {
        feld: 'name',
        anzeige: 'Feuerball',
        a: {
            id: 1,
            name: 'Feuerball',
            type: 'spell',
            level: 3,
            spellClasses: ['Magier', 'Hexenmeister'],
            school: 'Hervorrufung',
            time: '1 Aktion',
            range: '45 m',
            duration: 'Sofort',
            ritual: false,
            v: true,
            g: true,
            m: true,
            material: 'Fledermausguano & Schwefel (Wert < 1 GM, Bonus=2)',
            description: '<p>Explosion</p>',
            note: '<p>Notiz zum Zauber</p>',
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            name: 'Magisches Geschoss',
            type: 'spell',
            level: 1,
            spellClasses: ['Magier'],
            school: 'Hervorrufung',
            time: '1 Aktion',
            range: '36 m',
            duration: 'Sofort',
            ritual: false,
            v: true,
            g: true,
            m: false,
            material: '',
            description: '',
            note: ''
        }
    },
    wiki: {
        feld: 'title',
        anzeige: 'Weltwissen',
        a: {
            id: 1,
            title: 'Weltwissen',
            category: 'lore',
            content: '<p>Wurzel der Chronik</p>',
            tags: ['welt'],
            pinned: true,
            parentId: null,
            createdAt: 1700000000000,
            updatedAt: 1700000000001,
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            title: 'Goetter',
            category: 'lore',
            content: '<p>Kind</p>',
            tags: [],
            pinned: false,
            parentId: 1,
            createdAt: 1700000000002,
            updatedAt: 1700000000003
        }
    },
    links: {
        feld: 'title',
        anzeige: 'Regelwerk SRD',
        a: {
            id: 1,
            title: 'Regelwerk SRD',
            url: 'https://example.org/srd',
            category: 'rules',
            description: '<p>Regeln</p>',
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            title: 'Weltkarte',
            url: 'https://example.org/karte',
            category: 'maps',
            description: ''
        }
    },
    sessionPreps: {
        feld: 'strongStart',
        anzeige: 'Ein Schiff brennt',
        a: {
            id: 1,
            strongStart: '<p>Ein Schiff brennt</p>',
            szenen: [
                {
                    id: 1,
                    titel: 'Hafen',
                    beschreibung: '<p>Szene eins</p>',
                    ort: 'Hafenstadt Brandung'
                }
            ],
            geheimeHinweise: '<p>Geheimnis</p>',
            wichtigeNpcs: '<p>Alrik</p>',
            belohnungen: '100 GM & Trank (Wert < 50, Bonus=2)',
            sessionNr: 3,
            datum: '2026-10-01',
            inGameDatum: '1. Hammer',
            offeneFaeden: [],
            links: [],
            erstellt: 1700000000000,
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            strongStart: '<p>Verrat im Kontor</p>',
            szenen: [],
            geheimeHinweise: '',
            wichtigeNpcs: '',
            belohnungen: '',
            sessionNr: 4,
            datum: '2026-10-08',
            inGameDatum: '',
            offeneFaeden: [{ text: 'Die verlorene Fracht', quelleId: 1, quelleTyp: 'quest' }],
            links: [],
            erstellt: 1700000000001
        }
    },
    calendarEvents: {
        feld: 'titel',
        anzeige: 'Ankunft im Hafen',
        a: {
            id: 1,
            datum: { tag: 3, monat: 2, jahr: 1492 },
            titel: 'Ankunft im Hafen',
            beschreibung: 'Die Gruppe kommt an',
            typ: 'manuell',
            quelleId: null,
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            datum: { tag: 10, monat: 2, jahr: 1492 },
            titel: 'Sonnenfinsternis',
            beschreibung: '',
            typ: 'reise',
            quelleId: null
        }
    },
    factions: {
        feld: 'name',
        anzeige: 'Handelsgilde',
        a: {
            id: 1,
            name: 'Handelsgilde',
            symbol: '⚖',
            agenda: '<p>Agenda der Gilde</p>',
            beschreibung: '<p>Beschreibung der Gilde</p>',
            ruf: 12,
            rufHistorie: [{ datum: 1700000000000, delta: 12, grund: 'Fracht' }],
            mitgliederNpcIds: [],
            sitzOrtId: null,
            rivalen: 'Diebe & Schmuggler (Ruf < 0, Bonus=2)',
            verbuendete: 'Stadtwache',
            links: [],
            eigenesFeld: 'bleibt'
        },
        b: {
            id: 2,
            name: 'Schattenhand',
            symbol: '🗡',
            agenda: '',
            beschreibung: '',
            ruf: -3,
            rufHistorie: [],
            mitgliederNpcIds: [2],
            sitzOrtId: 2,
            rivalen: '',
            verbuendete: '',
            links: [{ type: 'npcs', id: 2 }]
        }
    }
};

/**
 * Die ganze Kampagne um die Sammlungen herum (Muster: link-anlegen.spec.js).
 * @param {boolean} mitSaat alle zwoelf Typen mit A und B — sonst leer
 */
function kampagne(mitSaat) {
    /** @param {string} typ */
    const teil = typ => (mitSaat ? [SAAT[typ].a, SAAT[typ].b] : []);
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
        characters: teil('characters'),
        npcs: teil('npcs'),
        locations: teil('locations'),
        quests: teil('quests'),
        loot: teil('loot'),
        spells: teil('spells'),
        wiki: teil('wiki'),
        links: teil('links'),
        filters: [],
        factions: teil('factions'),
        sessionPreps: teil('sessionPreps'),
        tags: [],
        sessionNotes: [],
        encounters: teil('encounters'),
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: { day: 1, month: 1, year: 1492, events: teil('calendarEvents') },
        partyGold: 0,
        quickRefCustom: []
    };
    const naechste = mitSaat ? 3 : 1;
    k._nextId = {
        characters: naechste,
        npcs: naechste,
        locations: naechste,
        quests: naechste,
        encounters: naechste,
        spells: naechste,
        loot: naechste,
        items: 1,
        wiki: naechste,
        links: naechste,
        sessionNotes: 1,
        randomTables: 1,
        filters: 1,
        factions: naechste,
        sessionPreps: naechste,
        calendarEvents: naechste
    };
    return k;
}

/**
 * Eine Datei, wie der Reiter-Export VOR dem Fix sie schrieb: genau die fuenf
 * alten Kopfschluessel, keine Formatkennung, der Charakter nur mit den
 * Schluesseln des alten Schemas (`IO_SCHEMA.characters` zu 020e258) — also
 * `class`, `hpTemp`, `ac`, `str`…`cha`, `avatarUrl` statt der Felder des
 * Datenmodells. Die Werte sind bewusst KEINE Vorgaben (`ac: 10`, `str: 10`,
 * `class: ''`), sondern unterscheidbar: so faellt jede Abbildung auf
 * `armorClass`/`attributes`/… auf, auch eine, die nur Nicht-Vorgaben
 * uebernimmt. `speed` ist Text wie in jeder Datei, die die App geschrieben
 * hat (eine Zahl lehnt R3 ab — das ist nicht diese Datei).
 */
const ALTE_DATEI = {
    _exportDate: '2026-01-15T18:00:00.000Z',
    _campaignName: 'Standard-Kampagne',
    _version: '2.6.1',
    _dataType: 'characters',
    data: [
        {
            id: 1,
            name: 'Brom Hammerschlag',
            race: 'Zwerg',
            class: 'Paladin',
            level: 4,
            playerName: 'Lena',
            background: 'Akolyth',
            hpCurrent: 30,
            hpMax: 36,
            hpTemp: 4,
            ac: 17,
            initiative: 0,
            speed: '9m|30ft.',
            passivePerception: 11,
            str: 18,
            dex: 9,
            con: 16,
            int: 8,
            wis: 12,
            cha: 15,
            spells: [],
            conditions: [],
            tags: [],
            notes: '<p>Notizen zu Brom</p>',
            avatarUrl: 'https://example.org/brom.png'
        }
    ]
};

/**
 * Ein Wiki-Export von VOR dem Fix. Er trug genau die Felder des Datenmodells
 * (`IO_SCHEMA.wiki` zu 020e258 = die Felder, die `wiki-crud.js` schreibt —
 * gemessen: 0 Felder verloren, 0 erfunden). Diese Datei unterscheidet sich von
 * einer frischen also NUR durch die fehlende Formatkennung. Eine Warnung, die
 * sich an verraeterischen Feldern (`class`, `avatarUrl` …) statt an der
 * Kennung festmacht, schweigt hier — R4 verlangt sie trotzdem. Kein Text
 * enthaelt ein Wort der Alte-Datei-Warnung.
 */
const ALTE_WIKI_DATEI = {
    _exportDate: '2026-01-15T18:05:00.000Z',
    _campaignName: 'Standard-Kampagne',
    _version: '2.6.1',
    _dataType: 'wiki',
    data: [
        {
            id: 1,
            title: 'Chronik der Kueste',
            category: 'lore',
            content: '<p>Aus dem Archiv der Gilde</p>',
            tags: [],
            pinned: false,
            parentId: null,
            createdAt: 1700000000000,
            updatedAt: 1700000000000
        }
    ]
};

/** Die Schluessel eines Wiki-Eintrags im alten Export — genau diese. */
const ALTE_WIKI_FELDER = [
    'id',
    'title',
    'category',
    'content',
    'tags',
    'pinned',
    'parentId',
    'createdAt',
    'updatedAt'
];

/**
 * KLARTEXT MIT SONDERZEICHEN in Eintrag A: je Typ ein Textfeld, das KEIN
 * HTML-Feld ist und das `sanitizeHTML()` veraendern wuerde (`<` und `&` werden
 * zu Entitaeten, `Bonus=2` verliert "onus=2" an das on…=-Muster). R4 sagt
 * "HTML-Felder werden wie heute an der Grenze bereinigt" — nur die. Ein Fix,
 * der aus Vorsicht JEDES Textfeld bereinigt, zerstoert Wuerfelformeln und
 * Vergleiche; ohne diese Werte bestuende er den Rundlauf (gemessen an einer
 * Buendelkopie mit Bereinigung aller Textfelder: (1)-(8) gruen).
 * Kontrolle (1) prueft, dass `sanitizeHTML()` jeden dieser Werte tatsaechlich
 * veraendert und D ihn unveraendert traegt.
 */
const KLARTEXT_FELDER = [
    ['characters', 'background'],
    ['npcs', 'role'],
    ['quests', 'rewardOther'],
    ['loot', 'special'],
    ['spells', 'material'],
    ['sessionPreps', 'belohnungen'],
    ['factions', 'rivalen']
];

/**
 * Die HTML-Felder je Typ, die der Import HEUTE an der Grenze bereinigt
 * (`HTML_FIELDS_BY_TYPE` in systems/spellslots/import-export.js zu 020e258;
 * Loot hat keines). Abgeschrieben, nicht aus dem Buendel gelesen: die
 * Konstante ist ein Internum, das ein Fix umbenennen darf. Ein Fix darf
 * MEHR Felder bereinigen (Epilog, Ausruestung …), solange die Saat stabil
 * bleibt — (9) verlangt nur diese. `szenen[].beschreibung` ist heute bewusst
 * nicht dabei (verschachtelt) und wird hier nicht verlangt.
 * @type {Record<string, string[]>}
 */
const HTML_FELDER = {
    characters: ['notes'],
    npcs: ['description'],
    locations: ['description'],
    quests: ['description'],
    encounters: ['traits', 'actions', 'skills'],
    loot: [],
    spells: ['description'],
    wiki: ['content'],
    links: ['description'],
    sessionPreps: ['strongStart'],
    calendarEvents: ['beschreibung'],
    factions: ['agenda', 'beschreibung']
};

/** Eine Nutzlast fuer die HTML-Felder in (9) — HARMLOSE Kanarien
 *  (Projektregel, Muster senken-kanarie.spec.js): ein `data-*`-Attribut und
 *  ein Bild, das es nicht gibt; kein Script, kein Ereignis-Handler.
 *  `sanitizeHTML()` macht daraus `<p>Nutzlast</p><b>fett</b>` und laesst das
 *  Ergebnis beim zweiten Mal stehen (beides prueft (9) als Vorbedingung).
 *  Bis 2026-11-02 stand hier `onmouseover` und ein `<script>`; die Bereinigung
 *  ergibt fuer beide Fassungen dasselbe (gemessen), (9) prueft also
 *  unveraendert. */
const NUTZLAST =
    '<p data-kanarie="daten.9.p">Nutzlast</p><img src="kanarie-daten.9.png" data-kanarie="daten.9"><b>fett</b>';

// ===========================================================================
// HELFER
// ===========================================================================

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error`, das Fehlerlog der App und jeden Browser-Dialog (der
 * Reiter-Import hat keine Rueckfrage — R3s Typ-Rueckfrage kommt hier nicht
 * vor; ein Dialog wird abgelehnt und als Fehler gezaehlt). "Failed to load
 * resource" ist Netzrauschen (Schriften unter file://).
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
        fehler.push(`dialog (${d.type()}): ${d.message().replace(/\n/g, ' | ')}`);
        d.dismiss().catch(() => {});
    });
    return {
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            const log = await page.evaluate(() =>
                (window.ErrorHandler?.getRecentErrors(50) || []).map(
                    e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...fehler, ...log];
        }
    };
}

/**
 * Laedt breit und saet EINMAL je Tab (sessionStorage-Sperre: ein
 * `page.reload()` liest danach, was die App gespeichert hat).
 * @param {import('@playwright/test').Page} page
 * @param {object} saat
 */
async function laden(page, saat) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('reiterimport-daten-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('reiterimport-daten-gesaet', '1');
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
    // landete das erst NACH einem `revStand()`, erfuellte es dessen Warten.
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

/**
 * Die Typliste AUS DEM BUENDEL: jedes `.io-file-input[data-on-change=
 * "importData"]` mit seinem `data-type` und der Ansicht, in der es liegt.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ typ: string, ansicht: string }[]>}
 */
function typenAusDemBuendel(page) {
    return page.evaluate(() =>
        [...document.querySelectorAll('.io-file-input[data-on-change="importData"]')].map(el => ({
            typ: /** @type {HTMLElement} */ (el).dataset.type || '',
            ansicht: (el.closest('.view')?.id || '').replace(/^view-/, '')
        }))
    );
}

/** Die Leiste mit 📤 und 📥 eines Typs: das Elternelement seines Datei-Felds.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
function ioLeiste(page, typ) {
    return page.locator(`.io-file-input[data-type="${typ}"]`).locator('xpath=..');
}

/** Ist die Ansicht offen? Sonst ueber die Navigation hin.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht */
async function zurAnsicht(page, ansicht) {
    const offen = await page
        .locator(`#view-${ansicht}`)
        .evaluate(el => el.classList.contains('active'))
        .catch(() => false);
    if (!offen) await navigateToTab(page, ansicht);
    await expect(
        page.locator(`#view-${ansicht}`),
        `Vorbedingung: Ansicht ${ansicht}`
    ).toBeVisible();
}

/** Eine Sammlung aus D oder aus dem Speicher — ohne `undefined`-Felder (die
 *  Form, die auch im Speicher steht). Die Kalender-Ereignisse liegen unter
 *  `calendar.events`, alle anderen Typen direkt unter ihrem Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ
 *  @param {'D'|'Speicher'} wo */
function sammlung(page, typ, wo = 'D') {
    return page.evaluate(
        ([typ, wo, schluessel]) => {
            let quelle;
            if (wo === 'D') quelle = window.D;
            else {
                try {
                    quelle = JSON.parse(localStorage.getItem(schluessel) || 'null');
                } catch {
                    return '(nicht lesbar)';
                }
            }
            if (!quelle) return null;
            const arr = typ === 'calendarEvents' ? quelle.calendar?.events : quelle[typ];
            return JSON.parse(JSON.stringify(arr ?? null));
        },
        [typ, wo, SPEICHER]
    );
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad setzt ihn neu.
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}

/** Wartet, bis seit `rev` geschrieben wurde; sagt, ob es dazu kam.
 *  @param {import('@playwright/test').Page} page
 *  @param {string|null} rev */
async function geschriebenSeit(page, rev) {
    const ende = Date.now() + SOFORT_MS;
    while (Date.now() < ende) {
        if ((await revStand(page)) !== rev) return true;
        await page.waitForTimeout(100);
    }
    return false;
}

/** Zaehler und Vorkommen des Anzeigenamens in der Ansicht.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht
 *  @param {string} anzeige */
function ansichtStand(page, ansicht, anzeige) {
    return page.evaluate(
        ([v, name]) => {
            const view = document.getElementById('view-' + v);
            const zaehler = document.getElementById(v + '-count');
            return {
                zaehler: zaehler ? (zaehler.textContent || '').trim() : null,
                vorkommen: view ? (view.textContent || '').split(name).length - 1 : -1
            };
        },
        [ansicht, anzeige]
    );
}

/** Dieselbe Messung, nachdem die Ansicht ueber die Navigation neu gezeichnet
 *  wurde (Startansicht und zurueck) — der Vergleich fuer "sofort aktuell".
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht
 *  @param {string} anzeige */
async function neuGezeichnet(page, ansicht, anzeige) {
    await navigateToTab(page, 'dashboard');
    await navigateToTab(page, ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
    return ansichtStand(page, ansicht, anzeige);
}

/**
 * Export ueber den echten Knopf des Reiters; der Download wird abgefangen.
 * Beim Zauber-Reiter ist 📤 ein Aufklappmenue ("📄 JSON").
 * @param {import('@playwright/test').Page} page
 * @param {string} typ
 * @param {string} ansicht
 */
async function exportieren(page, typ, ansicht) {
    await zurAnsicht(page, ansicht);
    const leiste = ioLeiste(page, typ);
    const menue = leiste.locator('.export-dropdown');
    let knopf;
    if ((await menue.count()) > 0) {
        await menue.locator('.io-btn.export').hover();
        knopf = menue.getByRole('button', { name: /JSON/ });
    } else {
        knopf = leiste.locator('.io-btn.export');
    }
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }),
        knopf.click()
    ]);
    const puffer = fs.readFileSync(/** @type {string} */ (await download.path()));
    return {
        name: download.suggestedFilename(),
        puffer,
        json: JSON.parse(puffer.toString('utf8'))
    };
}

/**
 * Der Import ueber die Oberflaeche: 📥 des Reiters → Dateidialog → Datei →
 * Fenster → Modus → "Importieren". Oeffnet sich das Fenster nicht, wird das
 * WEICH vermerkt und nichts weiter bedient (siehe Kopf).
 * @param {import('@playwright/test').Page} page
 * @param {{ typ: string, ansicht: string, name: string, puffer: Buffer, modus: 'merge'|'replace', wo: string }} a
 */
async function importieren(page, { typ, ansicht, name, puffer, modus, wo }) {
    await zurAnsicht(page, ansicht);
    const rev = await revStand(page);
    const [waehler] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        ioLeiste(page, typ).locator('.io-btn.import').click()
    ]);
    await waehler.setFiles({ name, mimeType: 'application/json', buffer: puffer });

    const fenster = page.locator('#import-modal');
    const offen = await fenster
        .waitFor({ state: 'visible', timeout: FENSTER_MS })
        .then(() => true)
        .catch(() => false);
    weich(offen, `${wo}: nach der Dateiwahl oeffnet sich das Fenster #import-modal`).toBe(true);
    if (!offen) return { offen, vorschau: '', geschrieben: false };

    const vorschau = (
        await page
            .locator('#import-info')
            .innerText()
            .catch(() => '')
    ).trim();
    // Hart, aber begrenzt: ohne bedienbares Radio und ohne Knopf geht es
    // nicht weiter — und ohne Frist hinge der Fall bis zum Testende.
    await fenster
        .locator(`input[name="import-mode"][value="${modus}"]`)
        .check({ timeout: SOFORT_MS });
    const los = fenster.locator('[data-action="execute-import"]');
    weich(
        await los.innerText({ timeout: SOFORT_MS }),
        `${wo}: der Knopf heisst "Importieren"`
    ).toContain('Importieren');
    await los.click({ timeout: SOFORT_MS });
    await weich(fenster, `${wo}: nach "Importieren" schliesst das Fenster`).toBeHidden({
        timeout: SOFORT_MS
    });
    const geschrieben = await geschriebenSeit(page, rev);
    return { offen, vorschau, geschrieben };
}

/** Ein Eintrag ohne ID und ohne leere Felder (null, '', []) — der Vergleich
 *  fuer die Kopie von A beim Hinzufuegen (siehe Kopf, "Die Saat").
 *  @param {any} e */
function ohneIdUndLeeres(e) {
    if (!e || typeof e !== 'object') return e;
    /** @type {Record<string, any>} */
    const o = {};
    for (const [k, v] of Object.entries(e)) {
        if (k === 'id') continue;
        if (v === null || v === undefined || v === '') continue;
        if (Array.isArray(v) && v.length === 0) continue;
        o[k] = v;
    }
    return o;
}

/** Die Pruefungen von R8 an der offenen Ansicht direkt nach einem Schritt.
 *  @param {import('@playwright/test').Page} page
 *  @param {{ ansicht: string, anzeige: string, zahl: number, wo: string, mehrAls?: number, genau?: number }} a */
async function ansichtPruefen(page, { ansicht, anzeige, zahl, wo, mehrAls, genau }) {
    const direkt = await ansichtStand(page, ansicht, anzeige);
    const neu = await neuGezeichnet(page, ansicht, anzeige);
    weich(direkt.zaehler, `R8 ${wo}: der Zaehler ist sofort aktuell`).toBe(String(zahl));
    weich(
        direkt.vorkommen,
        `R8 ${wo}: die Liste ist sofort aktuell ("${anzeige}" so oft wie nach dem Neuzeichnen)`
    ).toBe(neu.vorkommen);
    if (mehrAls !== undefined) {
        weich(
            direkt.vorkommen,
            `R8 ${wo}: die Kopie steht sofort in der Liste ("${anzeige}" oefter als vorher)`
        ).toBeGreaterThan(mehrAls);
    }
    if (genau !== undefined) {
        weich(direkt.vorkommen, `R8 ${wo}: die Liste zeigt sofort den Stand von D`).toBe(genau);
    }
    return direkt;
}

// ===========================================================================
// (1) KONTROLLE: TYPLISTE AUS DEM BUENDEL, SAAT
// ===========================================================================
//
// Gruen schon heute. Sie haelt fest, worauf (2)-(4) sich verlassen: die
// Typliste, die sie aus dem Buendel lesen, hat zwoelf Eintraege, jeder mit
// Saat; Sitzungsnotizen sind der einzige Export ohne Import (nicht in diesem
// PR); jeder Typ hat seinen Zaehler `#<ansicht>-count`; die Saat steht in D;
// und jeder HTML-Wert der Saat besteht `sanitizeHTML()` unveraendert — sonst
// koennte ein Fix, der wie heute an der Grenze bereinigt, den Rundlauf nicht
// tief gleich schaffen, und (2)-(4) waeren unerfuellbar.
test('(1) (Kontrolle): die Typliste kommt aus dem Buendel, die Saat steht und besteht die Bereinigung', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, kampagne(true));
    const typen = await typenAusDemBuendel(page);

    weich(typen.length, 'zwoelf Reiter mit 📥').toBe(12);
    weich(
        typen.map(t => t.typ).sort(),
        'jeder Typ des Buendels hat eine Saat in dieser Datei (und umgekehrt)'
    ).toEqual(Object.keys(SAAT).sort());
    const exporte = await page.evaluate(() =>
        [
            ...document.querySelectorAll(
                '[data-action="export-data"][data-value], [data-action="export-json"][data-value]'
            )
        ].map(el => /** @type {HTMLElement} */ (el).dataset.value)
    );
    weich(
        [...new Set(exporte)].filter(t => !typen.some(x => x.typ === t)),
        'der einzige Export ohne Import sind die Sitzungsnotizen'
    ).toEqual(['sessionNotes']);

    for (const { typ, ansicht } of typen) {
        weich(ansicht, `${typ}: liegt in einer Ansicht`).not.toBe('');
        weich(
            await page.locator(`#${ansicht}-count`).count(),
            `${typ}: die Ansicht ${ansicht} hat ihren Zaehler`
        ).toBe(1);
        const d = /** @type {any[]} */ (await sammlung(page, typ));
        weich(
            (d || []).map(e => e.id),
            `${typ}: die Saat ist in D angekommen`
        ).toEqual([1, 2]);
    }

    const html = Object.values(SAAT).flatMap(s =>
        [s.a, s.b].flatMap(
            e =>
                JSON.stringify(e)
                    .match(/"(<[^"]*>)"/g)
                    ?.map(m => JSON.parse(m)) || []
        )
    );
    const bereinigt = await page.evaluate(werte => werte.map(w => window.sanitizeHTML(w)), html);
    weich(bereinigt, 'jeder HTML-Wert der Saat besteht sanitizeHTML() unveraendert').toEqual(html);

    // Die Gegenrichtung: der Klartext mit Sonderzeichen WUERDE veraendert —
    // sonst pruefte die Saat keine Ueber-Bereinigung — und steht in D so,
    // wie er gesaet wurde.
    for (const [typ, feld] of KLARTEXT_FELDER) {
        const wert = SAAT[typ].a[feld];
        weich(
            await page.evaluate(w => window.sanitizeHTML(w) !== w, wert),
            `${typ}.${feld}: sanitizeHTML() veraendert den Klartext "${wert}"`
        ).toBe(true);
        const d = /** @type {any[]} */ (await sammlung(page, typ)) || [];
        weich(
            d.find(e => e.id === SAAT[typ].a.id)?.[feld],
            `${typ}.${feld}: D traegt den Klartext unveraendert`
        ).toBe(wert);
    }
    weich(
        typen.map(t => t.typ).filter(t => !(t in HTML_FELDER)),
        'jeder Typ des Buendels steht in HTML_FELDER (Liste der heute bereinigten Felder)'
    ).toEqual([]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2)-(4) R4/R8: JEDER TYP — EXPORT → HINZUFUEGEN → ERSETZEN
// ===========================================================================
//
// Die zwoelf Typen aus dem Buendel, auf drei Faelle verteilt (Typ i geht in
// Fall i mod 3), damit sie parallel laufen. Je Typ, in dieser Reihenfolge:
//
//   a) 📤 → die Datei traegt jeden Eintrag GANZ (tief gleich D) (R4)
//   b) 📥 Hinzufuegen: die Vorschau warnt nicht vor einem alten Format (R4);
//      geschrieben (_rev), D hat die Originale UNVERAENDERT plus je eine Kopie
//      mit neuer, eindeutiger ID; die Kopie von A gleicht A (R4); der Speicher
//      traegt D; Liste und Zaehler sofort aktuell (R8)
//   — Neuladen: die Kopien sind noch da (R8) —
//   c) 📥 Ersetzen mit derselben Exportdatei: geschrieben, D ist tief gleich
//      dem exportierten Stand, A UND B samt Verweisen (R4); Speicher; Liste
//      und Zaehler sofort aktuell (R8)
//   — Neuladen: der ersetzte Stand ist da (R8) —
//
// Ersetzen nach Hinzufuegen ist Absicht: so aendert Ersetzen etwas (die
// Kopien verschwinden), und ein Import, der nichts tut, kann den tiefen
// Vergleich nicht zufaellig bestehen.
for (const gruppe of [0, 1, 2]) {
    test(`(${gruppe + 2}) R4/R8: Export → Hinzufügen → Ersetzen über die Oberfläche, Typgruppe ${gruppe + 1} von 3`, async ({
        page
    }) => {
        test.setTimeout(180000);
        const fehler = fehlerFangen(page);
        await laden(page, kampagne(true));
        const meine = (await typenAusDemBuendel(page)).filter((_, i) => i % 3 === gruppe);
        expect(meine.length, 'Vorbedingung: die Gruppe hat Typen').toBeGreaterThan(0);

        /** @type {Record<string, any>} */
        const stand = {};
        for (const { typ, ansicht } of meine) {
            const saat = SAAT[typ];
            expect(
                saat,
                `Vorbedingung: Saat fuer ${typ} (die Typliste ist gewachsen)`
            ).toBeTruthy();
            const orig = /** @type {any[]} */ (await sammlung(page, typ));
            expect(orig?.length, `Vorbedingung: ${typ} hat die Saat in D`).toBe(2);
            await zurAnsicht(page, ansicht);
            const vorher = await ansichtStand(page, ansicht, saat.anzeige);
            // Ohne das waere jeder Listenvergleich unten leer (0 == 0) — z. B.
            // bei einer abgeschlossenen Quest, die die Liste nicht zeigt.
            expect(
                vorher.vorkommen,
                `Vorbedingung: "${saat.anzeige}" steht in der Ansicht ${ansicht}`
            ).toBeGreaterThan(0);

            // a) Export
            const datei = await exportieren(page, typ, ansicht);
            expect(datei.json._dataType, `Vorbedingung: ${typ} exportiert seinen Typ`).toBe(typ);
            weich(datei.json.data, `R4 ${typ}: der Export traegt jeden Eintrag ganz`).toEqual(orig);

            // b) Hinzufuegen
            const h = await importieren(page, {
                typ,
                ansicht,
                name: `${typ}-hinzufuegen.json`,
                puffer: datei.puffer,
                modus: 'merge',
                wo: `${typ} Hinzufügen`
            });
            weich(
                ALTE_DATEI_WARNUNG.test(h.vorschau),
                `R4 ${typ}: die Vorschau einer frischen Exportdatei warnt nicht vor einem alten Format — "${h.vorschau}"`
            ).toBe(false);
            weich(h.geschrieben, `R8 ${typ} Hinzufügen: geschrieben (_rev neu)`).toBe(true);
            const nachH = /** @type {any[]} */ (await sammlung(page, typ)) || [];
            const alteIds = orig.map(e => e.id);
            const kopien = nachH.filter(e => !alteIds.includes(e.id));
            weich(nachH.length, `R8 ${typ} Hinzufügen: je eine Kopie kommt dazu`).toBe(4);
            weich(
                nachH.filter(e => alteIds.includes(e.id)),
                `R8 ${typ} Hinzufügen: die Originale bleiben unveraendert`
            ).toEqual(orig);
            const ids = nachH.map(e => e.id);
            weich(
                ids.every(id => Number.isInteger(id) && id > 0) && new Set(ids).size === ids.length,
                `R8 ${typ} Hinzufügen: alle IDs eindeutige positive Ganzzahlen — ${JSON.stringify(ids)}`
            ).toBe(true);
            const kopieA = kopien.find(e => e[saat.feld] === saat.a[saat.feld]);
            weich(
                ohneIdUndLeeres(kopieA),
                `R4 ${typ} Hinzufügen: die Kopie von A ist A — bis auf ID und leere Felder`
            ).toEqual(ohneIdUndLeeres(orig[0]));
            weich(
                kopien.some(e => e[saat.feld] === saat.b[saat.feld]),
                `R8 ${typ} Hinzufügen: auch B hat eine Kopie mit neuer ID`
            ).toBe(true);
            weich(
                await sammlung(page, typ, 'Speicher'),
                `R8 ${typ} Hinzufügen: der Speicher traegt D`
            ).toEqual(nachH);
            await ansichtPruefen(page, {
                ansicht,
                anzeige: saat.anzeige,
                zahl: 4,
                wo: `${typ} Hinzufügen`,
                mehrAls: vorher.vorkommen
            });
            stand[typ] = { orig, nachH, datei, vorher };
        }

        await page.reload();
        await waitForAppReady(page);
        for (const { typ } of meine) {
            // Gegen die Zahl UND gegen den beobachteten Stand: kam der Import
            // gar nicht an, glichen sich beobachteter und neu geladener Stand.
            const neuGeladen = /** @type {any[]} */ (await sammlung(page, typ)) || [];
            weich(
                neuGeladen.length,
                `R8 ${typ} Hinzufügen: nach dem Neuladen sind die Kopien da`
            ).toBe(4);
            weich(
                neuGeladen,
                `R8 ${typ} Hinzufügen: nach dem Neuladen steht der Import, wie er geschrieben wurde`
            ).toEqual(stand[typ].nachH);
        }

        // c) Ersetzen
        for (const { typ, ansicht } of meine) {
            const saat = SAAT[typ];
            const { orig, datei, vorher } = stand[typ];
            const e = await importieren(page, {
                typ,
                ansicht,
                name: `${typ}-ersetzen.json`,
                puffer: datei.puffer,
                modus: 'replace',
                wo: `${typ} Ersetzen`
            });
            weich(
                ALTE_DATEI_WARNUNG.test(e.vorschau),
                `R4 ${typ}: die Vorschau warnt beim Ersetzen nicht vor einem alten Format — "${e.vorschau}"`
            ).toBe(false);
            weich(e.geschrieben, `R8 ${typ} Ersetzen: geschrieben (_rev neu)`).toBe(true);
            weich(
                await sammlung(page, typ),
                `R4 ${typ} Ersetzen: D ist tief gleich dem exportierten Stand (A und B, Verweise eingeschlossen)`
            ).toEqual(orig);
            weich(
                await sammlung(page, typ, 'Speicher'),
                `R8 ${typ} Ersetzen: der Speicher traegt den exportierten Stand`
            ).toEqual(orig);
            await ansichtPruefen(page, {
                ansicht,
                anzeige: saat.anzeige,
                zahl: 2,
                wo: `${typ} Ersetzen`,
                genau: vorher.vorkommen
            });
        }

        await page.reload();
        await waitForAppReady(page);
        for (const { typ } of meine) {
            weich(
                await sammlung(page, typ),
                `R4/R8 ${typ} Ersetzen: nach dem Neuladen steht der exportierte Stand`
            ).toEqual(stand[typ].orig);
        }

        weich(await fehler.alle(), 'kein Fehler').toEqual([]);
    });
}

// ===========================================================================
// (5) R4: CHARAKTER UEBER DAS ECHTE FORMULAR → EXPORT → ERSETZEN
// ===========================================================================
//
// Kein Saateintrag, sondern das, was das Party-Formular schreibt (gemessen:
// 35 Felder, davon gingen 22 im Export verloren). Nach dem Export kommt ein
// zweiter Charakter ueber dasselbe Formular dazu; Ersetzen holt den
// gesicherten Stand zurueck: genau der eine Charakter, tief gleich — in D,
// im Speicher, nach dem Neuladen —, und der zweite ist sofort aus der Liste.
test('(5) R4: ein über das Formular angelegter Charakter kommt per Export → Ersetzen tief gleich zurück', async ({
    page
}) => {
    test.setTimeout(90000);
    const fehler = fehlerFangen(page);
    await laden(page, kampagne(false));
    const typen = await typenAusDemBuendel(page);
    const ansicht = typen.find(t => t.typ === 'characters')?.ansicht || '';
    expect(ansicht, 'Vorbedingung: der Charakter-Reiter traegt ein 📥').not.toBe('');
    await zurAnsicht(page, ansicht);

    /** Das Party-Formular oeffnen (falls zu), ausfuellen, speichern.
     *  @param {() => Promise<void>} ausfuellen */
    const anlegen = async ausfuellen => {
        const form = page.locator('#char-form');
        if (!(await form.evaluate(el => el.classList.contains('open')))) {
            await page
                .locator(`#view-${ansicht} .collapsible-header[data-value="char-form"]`)
                .click();
        }
        await expect(form, 'Vorbedingung: das Party-Formular ist offen').toBeVisible();
        await ausfuellen();
        const rev = await revStand(page);
        await form.getByRole('button', { name: 'Speichern', exact: true }).click();
        expect(await geschriebenSeit(page, rev), 'Vorbedingung: Speichern schreibt').toBe(true);
    };

    await anlegen(async () => {
        await page.locator('#char-name').fill('Cendra Morgenrot');
        await page.locator('#char-player').fill('Lena');
        await page.locator('#char-class').selectOption('Paladin');
        await page.locator('#char-level').fill('6');
        await page.locator('#char-subclass').fill('Schwur der Hingabe');
        await page.locator('#char-race').selectOption('Mensch');
        await page.locator('#char-background').fill('Akolythin');
        await page.locator('#char-alignment').selectOption('LG');
        await page.locator('#char-hp-cur').fill('47');
        await page.locator('#char-hp-max').fill('52');
        await page.locator('#char-hp-temp').fill('5');
        await page.locator('#char-ac').fill('18');
        await page.locator('#char-init').fill('1');
        await page.locator('#char-str').fill('17');
        await page.locator('#char-cha').fill('16');
        await page.locator('#char-save-str').check();
        await page.locator('#char-skill-athletics').check();
        await page.locator('#char-gm').fill('150');
    });
    const gesichert = /** @type {any[]} */ (await sammlung(page, 'characters'));
    expect(
        gesichert?.map(c => c.name),
        'Vorbedingung: Cendra steht in D'
    ).toEqual(['Cendra Morgenrot']);

    const datei = await exportieren(page, 'characters', ansicht);
    weich(datei.json.data, 'R4: der Export traegt den Charakter ganz').toEqual(gesichert);

    await anlegen(async () => {
        await page.locator('#char-name').fill('Ruben Zweitheld');
    });
    expect(
        ((await sammlung(page, 'characters')) || []).length,
        'Vorbedingung: der zweite Charakter steht in D'
    ).toBe(2);
    expect(
        (await ansichtStand(page, ansicht, 'Ruben Zweitheld')).vorkommen,
        'Vorbedingung: der zweite Charakter steht in der Ansicht'
    ).toBeGreaterThan(0);

    const e = await importieren(page, {
        typ: 'characters',
        ansicht,
        name: 'characters-ersetzen.json',
        puffer: datei.puffer,
        modus: 'replace',
        wo: 'Charakter Ersetzen'
    });
    weich(
        ALTE_DATEI_WARNUNG.test(e.vorschau),
        `R4: die Vorschau der frischen Exportdatei warnt nicht vor einem alten Format — "${e.vorschau}"`
    ).toBe(false);
    weich(e.geschrieben, 'R8: geschrieben (_rev neu)').toBe(true);
    weich(
        await sammlung(page, 'characters'),
        'R4: D traegt Cendra tief gleich, und nur sie'
    ).toEqual(gesichert);
    weich(
        await sammlung(page, 'characters', 'Speicher'),
        'R4: der Speicher traegt Cendra tief gleich'
    ).toEqual(gesichert);
    const zweiter = await ansichtStand(page, ansicht, 'Ruben Zweitheld');
    weich(zweiter.vorkommen, 'R8: der zweite Charakter ist sofort aus der Ansicht').toBe(0);
    await ansichtPruefen(page, {
        ansicht,
        anzeige: 'Cendra Morgenrot',
        zahl: 1,
        wo: 'Charakter Ersetzen'
    });

    await page.reload();
    await waitForAppReady(page);
    weich(
        await sammlung(page, 'characters'),
        'R4: nach dem Neuladen steht Cendra tief gleich'
    ).toEqual(gesichert);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) R4: NPC UEBER "+ NPC" → EXPORT → ERSETZEN
// ===========================================================================
//
// Wie (5) mit dem NPC-Fenster (gemessen: 14 Felder, davon gingen 9 im Export
// verloren). Der zweite NPC ist nach dem Speichern der ausgewaehlte — nach
// dem Ersetzen darf er weder in der Liste noch im Detail stehen (R8:
// "Liste, Detail und Zaehler").
test('(6) R4: ein über "+ NPC" angelegter NPC kommt per Export → Ersetzen tief gleich zurück', async ({
    page
}) => {
    test.setTimeout(90000);
    const fehler = fehlerFangen(page);
    await laden(page, kampagne(false));
    const typen = await typenAusDemBuendel(page);
    const ansicht = typen.find(t => t.typ === 'npcs')?.ansicht || '';
    expect(ansicht, 'Vorbedingung: der NPC-Reiter traegt ein 📥').not.toBe('');
    await zurAnsicht(page, ansicht);

    /** "+ NPC", ausfuellen, "💾 Speichern".
     *  @param {() => Promise<void>} ausfuellen */
    const anlegen = async ausfuellen => {
        await page
            .locator(`#view-${ansicht}`)
            .getByRole('button', { name: '+ NPC', exact: true })
            .click();
        await expect(
            page.locator('#npc-modal'),
            'Vorbedingung: das NPC-Fenster ist offen'
        ).toBeVisible();
        await ausfuellen();
        const rev = await revStand(page);
        await page.locator('#npc-modal').getByRole('button', { name: '💾 Speichern' }).click();
        expect(await geschriebenSeit(page, rev), 'Vorbedingung: Speichern schreibt').toBe(true);
        await expect(page.locator('#npc-modal')).toBeHidden();
    };

    await anlegen(async () => {
        await page.locator('#npc-name').fill('Dorn Fährmann');
        await page.locator('#npc-role').fill('Fährmann');
        await page.locator('#npc-race').selectOption('Zwerg');
        await page.locator('#npc-chapter').fill('Kapitel 3');
        await page.locator('#npc-quests').fill('Fähre retten, Nebel lichten');
        await page.locator('#npc-info').fill('kennt die Furt, zahlt bar');
        await page.locator('#npc-relations').fill('Onkel von Mira');
        await page.locator('#npc-desc').click();
        await page.keyboard.type('Wortkarg und verlässlich.');
    });
    const gesichert = /** @type {any[]} */ (await sammlung(page, 'npcs'));
    expect(
        gesichert?.map(n => n.name),
        'Vorbedingung: Dorn steht in D'
    ).toEqual(['Dorn Fährmann']);

    const datei = await exportieren(page, 'npcs', ansicht);
    weich(datei.json.data, 'R4: der Export traegt den NPC ganz').toEqual(gesichert);

    await anlegen(async () => {
        await page.locator('#npc-name').fill('Zweiter Lotse');
    });
    expect(
        ((await sammlung(page, 'npcs')) || []).length,
        'Vorbedingung: der zweite NPC steht in D'
    ).toBe(2);
    expect(
        (await ansichtStand(page, ansicht, 'Zweiter Lotse')).vorkommen,
        'Vorbedingung: der zweite NPC steht in der Ansicht'
    ).toBeGreaterThan(0);

    const e = await importieren(page, {
        typ: 'npcs',
        ansicht,
        name: 'npcs-ersetzen.json',
        puffer: datei.puffer,
        modus: 'replace',
        wo: 'NPC Ersetzen'
    });
    weich(
        ALTE_DATEI_WARNUNG.test(e.vorschau),
        `R4: die Vorschau der frischen Exportdatei warnt nicht vor einem alten Format — "${e.vorschau}"`
    ).toBe(false);
    weich(e.geschrieben, 'R8: geschrieben (_rev neu)').toBe(true);
    weich(await sammlung(page, 'npcs'), 'R4: D traegt Dorn tief gleich, und nur ihn').toEqual(
        gesichert
    );
    weich(
        await sammlung(page, 'npcs', 'Speicher'),
        'R4: der Speicher traegt Dorn tief gleich'
    ).toEqual(gesichert);
    const zweiter = await ansichtStand(page, ansicht, 'Zweiter Lotse');
    weich(zweiter.vorkommen, 'R8: der zweite NPC ist sofort aus Liste und Detail').toBe(0);
    await ansichtPruefen(page, { ansicht, anzeige: 'Dorn Fährmann', zahl: 1, wo: 'NPC Ersetzen' });

    await page.reload();
    await waitForAppReady(page);
    weich(await sammlung(page, 'npcs'), 'R4: nach dem Neuladen steht Dorn tief gleich').toEqual(
        gesichert
    );

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) R4: ALTE DATEIEN — DIE VORSCHAU WARNT, NICHTS WIRD ABGEBILDET
// ===========================================================================
//
// Die alte Datei (siehe ALTE_DATEI) kommt ueber 📥 Hinzufuegen in eine leere
// Party. Die Vorschau muss warnen (keine Formatkennung), der Charakter kommt
// an — aber seine erfundenen Schemafelder landen NICHT in den Feldern des
// Datenmodells: die Werte alter Dateien sind Vorgaben, keine echten (gemessen:
// RK 18 wurde als `ac: 10` exportiert). Ob ein Fix die alten Schluessel
// stehen laesst oder verwirft, ist hier gleichgueltig.
// Danach ein alter Wiki-Export (siehe ALTE_WIKI_DATEI), der sich von einem
// frischen NUR durch die fehlende Formatkennung unterscheidet: auch er warnt.
// So haengt die Warnung an der Kennung und nicht an verraeterischen Feldern.
test('(7) R4: alte Dateien ohne Formatkennung — die Vorschau warnt (auch ohne verräterische Felder), class/ac/hpTemp/str…cha/avatarUrl werden nicht abgebildet', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, kampagne(false));
    const typen = await typenAusDemBuendel(page);
    const ansicht = typen.find(t => t.typ === 'characters')?.ansicht || '';
    expect(ansicht, 'Vorbedingung: der Charakter-Reiter traegt ein 📥').not.toBe('');
    expect(Object.keys(ALTE_DATEI), 'Vorbedingung: die alte Datei hat nur den alten Kopf').toEqual(
        ALTER_KOPF
    );

    const i = await importieren(page, {
        typ: 'characters',
        ansicht,
        name: 'characters-Standard-Kampagne-2026-01-15.json',
        puffer: Buffer.from(JSON.stringify(ALTE_DATEI, null, 2), 'utf8'),
        modus: 'merge',
        wo: 'alte Datei'
    });
    weich(
        ALTE_DATEI_WARNUNG.test(i.vorschau),
        `R4: die Vorschau warnt vor der alten Datei ohne Formatkennung — "${i.vorschau}"`
    ).toBe(true);
    weich(i.geschrieben, 'R8: geschrieben (_rev neu)').toBe(true);

    const d = /** @type {any[]} */ (await sammlung(page, 'characters')) || [];
    const brom = d.find(c => c.name === 'Brom Hammerschlag');
    weich(brom ? 'da' : 'fehlt', 'R4: der Charakter der alten Datei kommt an').toBe('da');
    const alt = ALTE_DATEI.data[0];
    const abgebildet = {
        'class → characterClass': brom?.characterClass === alt.class,
        'ac → armorClass': brom?.armorClass === alt.ac,
        'hpTemp → tempHp': brom?.tempHp === alt.hpTemp,
        'avatarUrl → avatar': brom?.avatar === alt.avatarUrl,
        ...Object.fromEntries(
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(k => [
                `${k} → attributes.${k}`,
                brom?.attributes?.[k] === alt[/** @type {'str'} */ (k)]
            ])
        )
    };
    weich(
        Object.entries(abgebildet)
            .filter(([, ja]) => ja)
            .map(([was]) => was),
        'R4: kein erfundenes Schemafeld wird auf ein Feld des Datenmodells abgebildet'
    ).toEqual([]);

    // Der alte Wiki-Export: nichts an ihm verraet sein Alter ausser der
    // fehlenden Formatkennung (siehe ALTE_WIKI_DATEI). Gemessen: ein Fix, der
    // nur bei `class`/`avatarUrl`/`hpTemp` warnt, bestand (7) ohne diesen Teil.
    const wikiAnsicht = typen.find(t => t.typ === 'wiki')?.ansicht || '';
    expect(wikiAnsicht, 'Vorbedingung: der Wiki-Reiter traegt ein 📥').not.toBe('');
    expect(
        [Object.keys(ALTE_WIKI_DATEI), Object.keys(ALTE_WIKI_DATEI.data[0])],
        'Vorbedingung: alter Kopf, und der Eintrag traegt genau die Felder des alten Wiki-Exports'
    ).toEqual([ALTER_KOPF, ALTE_WIKI_FELDER]);
    const w = await importieren(page, {
        typ: 'wiki',
        ansicht: wikiAnsicht,
        name: 'wiki-Standard-Kampagne-2026-01-15.json',
        puffer: Buffer.from(JSON.stringify(ALTE_WIKI_DATEI, null, 2), 'utf8'),
        modus: 'merge',
        wo: 'alte Wiki-Datei'
    });
    weich(
        ALTE_DATEI_WARNUNG.test(w.vorschau),
        `R4: die Vorschau warnt auch vor dem alten Wiki-Export, der nur die Formatkennung vermissen laesst — "${w.vorschau}"`
    ).toBe(true);
    weich(
        ((await sammlung(page, 'wiki')) || []).map(e => e.title),
        'R4: der Eintrag des alten Wiki-Exports kommt an'
    ).toEqual([ALTE_WIKI_DATEI.data[0].title]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) R8: STRG+Z / STRG+Y UND DIE SICHERHEITSKOPIE (FRAKTIONEN)
// ===========================================================================
//
// Ein Welt-Reiter mit Absicht: dort blieb die Ansicht heute schon nach dem
// Import stehen, und Strg+Z zeichnet ueber renderAll() — das keine
// Welt-Ansicht kennt. Ablauf mit echten Tasten im offenen Reiter:
//
//   Hinzufuegen  → Strg+Z (genau der Stand davor) → Strg+Y (genau der Import)
//   Ersetzen     → Sicherheitskopie mit dem Stand davor
//                → Strg+Z → Strg+Y → Neuladen
//
// Nach jeder Taste: D, Speicher, Zaehler und Liste. "In EINEM Schritt" heisst:
// EIN Strg+Z bringt genau den Stand vor dem Import, nicht einen Zwischenstand.
test('(8) R8: Strg+Z nimmt den Import in einem Schritt zurück, Strg+Y stellt ihn her, Ersetzen legt eine Sicherheitskopie an', async ({
    page
}) => {
    test.setTimeout(120000);
    const fehler = fehlerFangen(page);
    await laden(page, kampagne(true));
    const typ = 'factions';
    const saat = SAAT[typ];
    const ansicht = (await typenAusDemBuendel(page)).find(t => t.typ === typ)?.ansicht || '';
    expect(ansicht, 'Vorbedingung: der Fraktionen-Reiter traegt ein 📥').not.toBe('');
    await zurAnsicht(page, ansicht);
    const s0 = /** @type {any[]} */ (await sammlung(page, typ));
    const v0 = await ansichtStand(page, ansicht, saat.anzeige);
    expect(v0.vorkommen, `Vorbedingung: "${saat.anzeige}" steht in der Ansicht`).toBeGreaterThan(0);
    const datei = await exportieren(page, typ, ansicht);

    /** Eine Taste, dann: geschrieben, D, Speicher, Ansicht wie `soll`.
     *  @param {string} taste
     *  @param {any} soll
     *  @param {string} wo */
    const tasteUndPruefen = async (taste, soll, wo) => {
        const rev = await revStand(page);
        await page.keyboard.press(taste);
        weich(await geschriebenSeit(page, rev), `R8 ${wo}: geschrieben (_rev neu)`).toBe(true);
        weich(await sammlung(page, typ), `R8 ${wo}: D`).toEqual(soll);
        weich(await sammlung(page, typ, 'Speicher'), `R8 ${wo}: Speicher`).toEqual(soll);
        const zahl = Array.isArray(soll) ? soll.length : -1;
        const ist = await ansichtStand(page, ansicht, saat.anzeige);
        weich(ist.zaehler, `R8 ${wo}: der Zaehler zeigt sofort den Stand von D`).toBe(String(zahl));
        return ist;
    };

    // Hinzufuegen
    const h = await importieren(page, {
        typ,
        ansicht,
        name: 'factions-hinzufuegen.json',
        puffer: datei.puffer,
        modus: 'merge',
        wo: 'Hinzufügen'
    });
    weich(h.geschrieben, 'R8 Hinzufügen: geschrieben (_rev neu)').toBe(true);
    const s1 = /** @type {any[]} */ (await sammlung(page, typ)) || [];
    weich(s1.length, 'R8 Hinzufügen: je eine Kopie kommt dazu').toBe(4);
    const v1 = await ansichtStand(page, ansicht, saat.anzeige);
    weich(v1.zaehler, 'R8 Hinzufügen: der Zaehler ist sofort aktuell').toBe('4');
    weich(v1.vorkommen, 'R8 Hinzufügen: die Kopie steht sofort in der Liste').toBeGreaterThan(
        v0.vorkommen
    );

    const z1 = await tasteUndPruefen('Control+z', s0, 'Strg+Z nach Hinzufügen');
    weich(z1.vorkommen, 'R8 Strg+Z nach Hinzufügen: die Liste zeigt sofort den Stand davor').toBe(
        v0.vorkommen
    );
    const y1 = await tasteUndPruefen('Control+y', s1, 'Strg+Y nach Hinzufügen');
    weich(y1.vorkommen, 'R8 Strg+Y nach Hinzufügen: die Liste zeigt sofort den Import').toBe(
        v1.vorkommen
    );

    // Ersetzen
    const e = await importieren(page, {
        typ,
        ansicht,
        name: 'factions-ersetzen.json',
        puffer: datei.puffer,
        modus: 'replace',
        wo: 'Ersetzen'
    });
    weich(e.geschrieben, 'R8 Ersetzen: geschrieben (_rev neu)').toBe(true);
    weich(
        await sammlung(page, typ),
        'R4 Ersetzen: D ist tief gleich dem exportierten Stand'
    ).toEqual(s0);
    const v2 = await ansichtStand(page, ansicht, saat.anzeige);
    weich(v2.zaehler, 'R8 Ersetzen: der Zaehler ist sofort aktuell').toBe('2');
    weich(v2.vorkommen, 'R8 Ersetzen: die Liste zeigt sofort den ersetzten Stand').toBe(
        v0.vorkommen
    );

    // Die Sicherheitskopie traegt den Stand VOR dem Ersetzen. getBackups()
    // liest IndexedDB und localStorage; die Kopie wird ohne await angelegt.
    /** @returns {Promise<any[]>} */
    const sicherheitskopien = () =>
        page.evaluate(async t => {
            const liste = await window.getBackups();
            return liste
                .filter(b => b.kind === 'safety')
                .map(b => {
                    try {
                        const d = JSON.parse(b.data);
                        return JSON.parse(
                            JSON.stringify(
                                (t === 'calendarEvents' ? d.calendar?.events : d[t]) ?? null
                            )
                        );
                    } catch {
                        return '(nicht lesbar)';
                    }
                });
        }, typ);
    let kopien = [];
    const ende = Date.now() + SOFORT_MS;
    while (Date.now() < ende) {
        kopien = await sicherheitskopien();
        if (kopien.some(k => JSON.stringify(k) === JSON.stringify(s1))) break;
        await page.waitForTimeout(150);
    }
    weich(
        kopien.some(k => JSON.stringify(k) === JSON.stringify(s1)),
        'R8 Ersetzen: eine Sicherheitskopie traegt den Stand vor dem Ersetzen'
    ).toBe(true);

    const s2 = await sammlung(page, typ);
    const z2 = await tasteUndPruefen('Control+z', s1, 'Strg+Z nach Ersetzen');
    weich(z2.vorkommen, 'R8 Strg+Z nach Ersetzen: die Liste zeigt sofort den Stand davor').toBe(
        v1.vorkommen
    );
    const y2 = await tasteUndPruefen('Control+y', s2, 'Strg+Y nach Ersetzen');
    weich(y2.vorkommen, 'R8 Strg+Y nach Ersetzen: die Liste zeigt sofort den Import').toBe(
        v2.vorkommen
    );

    await page.reload();
    await waitForAppReady(page);
    weich(
        await sammlung(page, typ),
        'R8: nach dem Neuladen steht der wiederhergestellte Import'
    ).toEqual(s0);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) R4: HTML-FELDER WERDEN AN DER GRENZE BEREINIGT — WIE HEUTE
// ===========================================================================
//
// R4 endet mit "HTML-Felder werden wie heute an der Grenze bereinigt". Der
// Rundlauf (2)-(6) kann das nicht sehen: seine Saat ist bereinigungsfest
// (Kontrolle (1)) — gemessen bestand eine Buendelkopie, die die Datei
// ungeprueft durchreicht, (1)-(8) gruen. Darum hier je Typ: der ECHTE Export
// des Reiters (er traegt die Formatkennung, deren Namen der Vertrag offen
// laesst), darin jedes HTML-Feld von A (HTML_FELDER) durch NUTZLAST ersetzt,
// Kopf und alles andere wie exportiert; dann 📥 Ersetzen. D muss danach den
// Stand VOR dem Export tragen, nur die HTML-Felder von A als
// `sanitizeHTML(NUTZLAST)` — nicht roh, nicht leer — und alles andere tief
// gleich (auch der Klartext mit Sonderzeichen). Gegen D und nicht gegen die
// Datei, damit ein Export, der Felder verliert, hier nicht durchrutscht.
// Loot hat heute kein HTML-Feld und faellt hier heraus.
test('(9) R4: die HTML-Felder einer Datei werden beim Import bereinigt wie heute, alles andere kommt tief gleich an', async ({
    page
}) => {
    test.setTimeout(150000);
    const fehler = fehlerFangen(page);
    await laden(page, kampagne(true));
    const typen = await typenAusDemBuendel(page);
    const [bereinigt, zweimal] = await page.evaluate(w => {
        const einmal = window.sanitizeHTML(w);
        return [einmal, window.sanitizeHTML(einmal)];
    }, NUTZLAST);
    expect(bereinigt, 'Vorbedingung: sanitizeHTML() veraendert die Nutzlast').not.toBe(NUTZLAST);
    expect(bereinigt, 'Vorbedingung: die Nutzlast bleibt nicht leer').toContain('Nutzlast');
    expect(zweimal, 'Vorbedingung: zweimal bereinigt ist einmal bereinigt').toBe(bereinigt);

    let geprueft = 0;
    for (const { typ, ansicht } of typen) {
        const felder = HTML_FELDER[typ];
        expect(felder, `Vorbedingung: HTML_FELDER kennt ${typ}`).toBeDefined();
        if (felder.length === 0) continue;
        const a = SAAT[typ].a;
        // Der Vergleich geht gegen D VOR dem Export, nicht gegen die Datei:
        // mit dem heutigen Export (Schemafilter) und dem heutigen Import
        // dahinter glich D gemessen genau der verstuemmelten Datei — der Fall
        // war gegen den halben Fix gruen, obwohl R4 den ganzen Eintrag will.
        const orig = /** @type {any[]} */ (await sammlung(page, typ));
        const soll = structuredClone(orig);
        const sollA = soll.find(e => e.id === a.id);
        expect(sollA, `Vorbedingung: ${typ} hat A in D`).toBeTruthy();
        const datei = await exportieren(page, typ, ansicht);
        const json = structuredClone(datei.json);
        const eintragA = (json.data || []).find(e => e.id === a.id);
        expect(eintragA, `Vorbedingung: der Export von ${typ} traegt A`).toBeTruthy();
        for (const f of felder) {
            eintragA[f] = NUTZLAST;
            sollA[f] = bereinigt;
        }
        await importieren(page, {
            typ,
            ansicht,
            name: `${typ}-nutzlast.json`,
            puffer: Buffer.from(JSON.stringify(json, null, 2), 'utf8'),
            modus: 'replace',
            wo: `${typ} Nutzlast`
        });
        weich(
            await sammlung(page, typ),
            `R4 ${typ}: ${felder.join(', ')} bereinigt wie heute, alles andere tief gleich dem Stand vor dem Export`
        ).toEqual(soll);
        geprueft++;
    }
    expect(geprueft, 'Vorbedingung: elf Typen mit HTML-Feldern geprueft').toBe(11);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
