// @ts-check
/**
 * Reiter-Import: Pruefung, Ablehnung und Nutzlasten (REITERIMPORT, R3/R6/R9)
 * ==========================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **eine Datei, die der
 * Reiter-Import (📥) nicht verarbeiten darf, wird VOR dem Fenster mit einer
 * verstaendlichen deutschen Meldung abgelehnt — D, Speicher und alle Listen
 * bleiben, wie sie waren, und das Fehlerlog bleibt leer; eine Datei, die er
 * verarbeiten darf, bringt keine Nutzlast zur Ausfuehrung — weder in der
 * Vorschau noch in Liste oder Detail.**
 *
 * Vertrag REITERIMPORT, docs/bugfixes.md. Diese Datei prueft R3 (Pruefung vor
 * dem Fenster), R6 (Ablehnung beim Ersetzen) und R9 (Sicherheit). Das
 * Fenster gibt es am Stand 020e258 nicht; die Faelle bedienen den
 * Oberflaechen-Vertrag: `#import-modal` (`.modal-overlay`) mit Vorschau
 * `#import-info`, Modus `input[name="import-mode"]` (`merge` "Hinzufügen",
 * `replace` "Ersetzen"), Knopf `[data-action="execute-import"]` mit dem
 * sichtbaren Text "Importieren", Abbrechen ueber ✕, "Abbrechen" oder Escape.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu 020e258, 1440x900, echte Klicks auf 📥, jeder
 * Dateidialog mit derselben Datei bedient (siehe "Wie gewaehlt wird"):
 *
 *   kaputtes JSON         "❌ Import-Fehler: Expected double-quoted property
 *                         name in JSON at position …" — Rohtext des Parsers,
 *                         dazu ein Eintrag im Fehlerlog ("Import, Parse error")
 *   0 Byte                "❌ Import-Fehler: Unexpected end of JSON input"
 *   ohne `data`-Array     "Ungültiges Format: "data"-Array fehlt" — deutsch,
 *                         aber mit Eintrag im Fehlerlog
 *   Kampagnen-Datei       dieselbe Meldung, kein Wort von der Kampagne und
 *                         vom Weg ueber 💾 Daten
 *   `data: [null]`        "Cannot read properties of null (reading 'id')"
 *   name null / 42 / ''   "✅ Datei validiert: 1 Einträge bereit" — die Pruefung
 *                         kennt nur `=== undefined`; mit Fenster legte `null`
 *                         bzw. 42 die ganze NPC-Liste lahm ("Anzeigefehler",
 *                         `localeCompare`)
 *   Quest `title: null`   ebenso "validiert"; ein Kalender-Ereignis OHNE
 *                         `titel` 'Pflichtfeld "titel" fehlt' — deutsch, aber
 *                         mit Eintrag im Fehlerlog
 *   speed 30 / hpMax 'viel'  "validiert" — mit Fenster wirft ✏️ am Helden
 *                         "speedVal.split is not a function"; Truhe
 *                         `quantity: 'viele'` ebenso "validiert"
 *   `__proto__` verschachtelt  bleibt als eigener Schluessel in D und im
 *                         Speicher (kein Reviver, anders als der Kampagnenweg)
 *   10 MB + 1 Byte        "❌ Datei zu groß (max 10MB)" — richtig (Waechter)
 *   falscher `_dataType`  confirm 'Import-Datentyp ist "locations", aber
 *                         erwartet wird "factions"' — englische Schluessel
 *   Ersetzen, ID doppelt  "validiert"; mit Fenster uebernahm "Ersetzen" beide
 *     bzw. "abc" / -1     Eintraege samt ID — ein 🗑️ loeschte dann beide, die
 *     / 2.5               Karte mit "abc" liess sich weder oeffnen noch loeschen
 *   Nutzlasten            mit Fenster lief `encounters.cr` schon beim Import
 *                         (renderAll) und wieder in Liste und Detail,
 *                         `loot.tags` im Detail; `links.url` "javascript:"
 *                         stand als href in der Liste. Die Gegenprobe dieser
 *                         Datei fand dazu `speed.walk` und `savingThrows.dex`
 *                         im Encounter-Detail, die des Skeptikers
 *                         `characters.speed` beim Import, in der Heldenliste
 *                         und im Helden-Detail (Schemafeld, kommt also schon
 *                         heute an) und mit vollem Felddurchlass (R4)
 *                         `characters.characterClass`/`resistances`,
 *                         `quests.type` und `spells.type`
 *
 * DIE URSACHEN (Stand 020e258), `systems/spellslots/import-export.js`:
 *   - showImportModal() parst mit `JSON.parse` ohne Reviver und reicht jede
 *     Ausnahme roh in die Meldung (`'❌ Import-Fehler: ' + err.message`) und
 *     ins Fehlerlog (`ErrorHandler.log('Import', err, 'Parse error')`).
 *   - Die Schema-Pruefung kennt nur "Pflichtfeld fehlt" (`item[key] ===
 *     undefined`) — keinen Typ, keine ID, keinen Eintrag, der kein Objekt ist.
 *   - Die Typ-Rueckfrage setzt die internen Schluessel ein.
 *   - executeImport() uebernimmt beim Ersetzen die IDs der Datei ungeprueft.
 *   - sanitizeImportedItem() bereinigt nur HTML_FIELDS_BY_TYPE; `cr`, die
 *     Loot-Tags, `links.url`, `speed` des Helden und die Auswahlfelder
 *     bleiben roh, und ihre Senken (`features/encounters/encounters-render.js`,
 *     `features/initiative-loot.js`, `features/shops/links.js`,
 *     `features/party/party-render.js` und `party-details.js`,
 *     `features/quests/quests-render.js`, `features/spells/spell-manager.js`,
 *     `populateFilterDropdown()` fuer den Klassenfilter) setzen sie ohne
 *     `esc()` bzw. ohne Schema-Pruefung ein.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag REITERIMPORT), die diese Datei prueft
 *
 *   R3  Kaputtes JSON, leere Datei, Datei ohne `data`-Array,
 *       Kampagnen-Datei, `data` mit Nicht-Objekten, fehlender/leerer Name
 *       bzw. Titel (`name`, `title`, `titel`), Text statt Zahl in bekannten
 *       Zahlfeldern (und umgekehrt, `speed`) — nicht nur beim Helden —,
 *       ueber 10 MB → verstaendliche deutsche Meldung, D unveraendert, kein
 *       Fenster. JSON wird mit Reviver gelesen, der `__proto__`,
 *       `constructor`, `prototype` verwirft. Falscher `_dataType` →
 *       Rueckfrage mit deutschen Typnamen.               (1)–(9)
 *   R6  Ungueltige (keine positive Ganzzahl: "abc", -1, 2.5) oder doppelte
 *       IDs in der Datei → Ersetzen abgelehnt mit deutscher Meldung. (10)
 *   R9  Nutzlasten in Text- und HTML-Feldern — auch im Dateikopf und in
 *       Feldern, die das Formular nur als Auswahl kennt — fuehren ueber den
 *       Reiter-Import in Vorschau, Liste und Detail zu keiner
 *       Script-Ausfuehrung; ein `javascript:`-Link wird nicht als solcher
 *       verlinkt. Gemessen an den fuenf Typen mit gefundener Senke
 *       (Charakter, Quest, Zauber, Encounter, Truhe) und den Links. (11)–(14)
 * Dazu bei jeder Ablehnung: kein englischer Parser-/Laufzeit-Rohtext, keine
 * Erfolgsmeldung (R2: vor dem Fenster hoechstens neutrale Hinweise), nichts
 * geschrieben (`_rev` unveraendert), danach rendern ALLE zwoelf Reiter ohne
 * "Anzeigefehler", und das Fehlerlog bleibt leer.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WIE GEWAEHLT WIRD — UND WARUM JEDER DATEIDIALOG DIESELBE DATEI BEKOMMT
 *
 * Echter Klick auf das 📥 des Reiters — gesucht ueber seinen sichtbaren
 * Text in `#view-<ansicht>` (`knopfMit()`), nicht ueber `.io-btn.import`:
 * der Vertrag sichert das sichtbare 📥 zu, nicht seine Klasse.
 * JEDER Dateidialog, der danach aufgeht, bekommt dieselbe Datei
 * (`filechooser.setFiles` mit einem Buffer). Damit misst diese Datei die
 * PRUEFUNG, nicht den Dialogweg: am Buendel geht ein zweiter Dialog auf,
 * dessen Datei die heutige Pruefung erreicht — die Faelle werden an ihrer
 * Meldung rot, nicht an einem toten Weg. Ein Fix mit EINEM Dialog bekommt
 * genau einen. Die Zahl der Dialoge und die Nutzeraktivierung (R1) prueft
 * ein eigener Waechter; `setFiles` allein wuerde den Aktivierungsdefekt
 * ohnehin verdecken (Kritik K1c).
 * Danach wartet der Fall, bis etwas geschieht — das Fenster, eine Meldung
 * oder eine Rueckfrage —, hoechstens FOLGE_MS, und noch einen Augenblick fuer
 * Nachzuegler.
 *
 * WAS ALS ABLEHNUNG ZAEHLT: eine Meldung im Ereignis-Log vom Typ `error` oder
 * `warning`, oder ein nativer Dialog (`alert` wie im Kampagnenweg, oder eine
 * Rueckfrage). Wie die Meldung formuliert ist, entscheidet der Fix; diese
 * Datei verlangt nur, was eine verstaendliche Meldung nicht vermeiden kann:
 * kein Rohtext aus V8 (ROHTEXT), ein deutsches Wort (DEUTSCH), und wo der
 * Fall es braucht, das Thema — die Kampagne (3), Name bzw. Titel (5), die
 * ID (10). DAS THEMA MUSS AUS DER PRUEFUNG KOMMEN, nicht aus der Datei:
 * Dateinamen sind neutral ("probe-…"), und die Kampagnen-Datei in (3)
 * traegt einen eigenen Kampagnennamen ohne "Kampagne" — eine Meldung, die
 * nur Dateiname und Kopf zitiert, erfuellte sonst Thema und DEUTSCH (in der
 * Gegenprobe gemessen, siehe unten).
 *
 * R6 HAT ZWEI ERLAUBTE WEGE: die Datei wird schon vor dem Fenster abgelehnt
 * (A), oder das Fenster geht auf (Hinzufuegen vergibt ohnehin neue IDs) und
 * erst "Ersetzen" → "Importieren" wird abgelehnt (B) — auch ein
 * ausgegrautes "Ersetzen", wenn das Fenster dann die ID nennt. Rueckfragen
 * werden in (10) BESTAETIGT, damit ein "Wirklich ersetzen?" die
 * Pruefung nicht verdeckt; als Ablehnung zaehlt dort darum nur eine Meldung
 * oder ein `alert`, keine Rueckfrage. Die ID-Zaehler (`_nextId`) bleiben bei
 * R6 aus dem Vergleich: ein Fix darf die IDs fuers Hinzufuegen schon fuer
 * die Vorschau ziehen; die Sammlungen und `_rev` muessen stehen.
 *
 * DIE RUECKFRAGE (9) darf ein nativer Dialog oder ein sichtbarer Dialog der
 * Seite sein; sie wird abgelehnt (Abbrechen bzw. Escape).
 *
 * DIE NUTZLASTEN (11)–(14) setzen ein Kennzeichen (`window.__xss`, vor dem
 * Laden angelegt) statt `alert`: jede Nutzlast traegt ihren Ort, ein roter
 * Lauf nennt also die Senke. Sie stehen NUR in Textfeldern — in einem
 * Zahlfeld (`ac`, `hp`, `weight` …) wuerde R3 die Datei zu Recht ablehnen,
 * und der Fall maesse nichts. Jeder Nutzlast-Fall verlangt als Vorbedingung,
 * dass die Datei ankommt (Fenster, Schreiben, Eintrag in D): am Buendel ist
 * er dort rot, weil der Reiter-Weg gar nichts importiert.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei)
 *
 * Gegen eine Kopie des Buendels 020e258, in die nur ein statisches
 * `#import-modal` nach dem Oberflaechen-Vertrag eingesetzt war ("halber
 * Fix": das Fenster, sonst alles wie heute), blieben alle
 * Nicht-Waechter-Faelle rot, jeder an einer Zusage jenseits des Fensters,
 * und alle Vorbedingungen hielten (die Faelle bedienen das Fenster also
 * wirklich): (1)(4) am Rohtext (der zugleich nicht deutsch ist) und am
 * Fehlerlog, (2) am Fehlerlog, (3) an
 * der Kampagne, (5)(6) an Ablehnung, Erfolgsmeldung und geoeffnetem
 * Fenster, (7) an `tags[0].__proto__` in D und im Speicher (Object.prototype
 * blieb sauber — ohne Reviver bleibt der Schluessel ein eigener), (9) an den
 * englischen Typschluesseln, (10) an Ablehnung, D und `_rev` nach
 * "Ersetzen", (12) an `encounters.cr` beim Import, in Liste und Detail und
 * im Detail zusaetzlich an `speed.walk` und `savingThrows.dex`, (13) an
 * `loot.tags` im Detail, (14) an den drei `javascript:`-hrefs. Der Waechter
 * (8) blieb gruen.
 *
 * GEGENPROBE DES SKEPTIKERS (ebenso ausserhalb der Arbeitskopie, gegen fuenf
 * Buendelkopien, 4 Worker; "frueher" heisst: die Fassung dieser Datei vor
 * der Gegenprobe, mit (11) als zweitem R6-Fall):
 *   - "halber Fix" wie oben, nachgebaut: alle Nicht-Waechter-Faelle rot,
 *     (11) an `characters.speed` beim Import, in Liste und Detail.
 *   - TEILFIX: Fenster, Reviver, deutsche Meldungen ohne Fehlerlog, Name-,
 *     Typ- und ID-Pruefung vor dem Fenster, die damals bekannten Senken
 *     (`cr`, Loot-Tags, `origin`, `speed.walk`, `savingThrows`, javascript:)
 *     geschlossen — aber: nur `name` geprueft (Titel nicht), Zahlfelder nur
 *     beim Helden, `typeof id === 'number' && id > 0`, `_campaignName` roh in
 *     der Vorschau. Die FRUEHERE Fassung war dagegen 14/14 GRUEN. Heute
 *     5 rot: (5) an Quest-Titel und Kalender-Titel, (6) an `quantity`, (10)
 *     an ID 2.5, (11) an `characters.speed`, (12) an der Vorschau.
 *   - Derselbe Teilfix mit Meldungen OHNE Thema, die nur "(Datei
 *     <Dateiname>, <_campaignName>)" anhaengen: die fruehere Fassung war
 *     13/14 gruen — (3) fand "Kampagne" in "Standard-Kampagne", (5) "name" in
 *     "name-null.json", der fruehere (11) "ID" in "id-text.json". Heute 6
 *     rot, (3), (5), (10) am Thema.
 *   - "halber Fix" plus voller Felddurchlass (R4): (11) zusaetzlich an
 *     `characterClass`, `resistances`, `immunities`, `quests.type`,
 *     `spells.type`.
 *   - BEINAHE-FIX (Kontrolle gegen falsches Rot): der Teilfix mit allen
 *     genannten Luecken geschlossen, Felddurchlass und den Senken aus (11)
 *     escaped (auch `speed` im Helden-Detail): 14/14 gruen. Die Faelle
 *     verlangen also nichts, was ein vertragstreuer Fix nicht liefern
 *     kann. Ein VOLLER Fix (Dateiweg R1, R2, R5, R7, R8) ist nicht
 *     nachgebaut — hier nicht gefordert.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Die Zahl der Dateidialoge und die Aktivierung (R1), Erfolgsmeldungen nach
 * dem Schreiben (R2), Feldtreue und alte Dateien (R4), Verweise beim
 * Hinzufuegen (R5), offene Formulare (R7), Zaehler/Undo/Neuladen (R8), das
 * Telefon und Escape mit Fokus-Rueckgabe (R10) — eigene Waechter. Ebenso
 * CSV (nicht in diesem PR), Sitzungsnotizen (Export ohne Import), was mit
 * einer bestaetigten Typ-Rueckfrage geschieht, und XSS-Senken jenseits des
 * Reiter-Wegs (Kampagnen-Import, DM-Screen, Suche, Handouts — eigener
 * Sicherheits-PR). Die Bearbeiten-Formulare der importierten Eintraege
 * oeffnet nur (14): Links haben kein Detail, ✏️ ist ihr einziges.
 * R9 fuer NPC, Ort, Wiki, Session-Prep, Kalender und Fraktion: keine Senke
 * gefunden — mit Schemafilter in der Liste und im Detail von NPC, Ort,
 * Fraktion und Session-Prep (Datenpfad-Bericht; Wiki- und Kalender-Detail
 * dort nicht geoeffnet), mit vollem Felddurchlass in der Liste (Sonde des
 * Skeptikers, jedes Textfeld vergiftet); die Details mit Felddurchlass
 * sind nicht gemessen.
 * Findet ein Fix dort eine Senke, gehoert sie in (11).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — Liste und Detail stehen nebeneinander. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Wie lange eine Dateiwahl hoechstens auf ihre Folge wartet (FileReader,
 *  ggf. ein zweiter Dialog am Buendel). */
const FOLGE_MS = 6000;

/** Die Grenze aus R3: "ueber 10 MB". */
const MAX_BYTES = 10 * 1024 * 1024;

/** Rohtexte aus V8, die kein Nutzer verstehen muss: Parser (`JSON.parse`)
 *  und Laufzeit (TypeError & Co.). Steht einer davon in einer Meldung, ist
 *  `err.message` durchgereicht worden. */
const ROHTEXT =
    /Unexpected (token|end|non-whitespace)|Expected |JSON at position|not valid JSON|Cannot (read|set) propert|is not a function|is not iterable|is not defined|\bundefined\b|\bNaN\b|\[object Object\]|TypeError|SyntaxError|\(reading '/;

/** Ein Umlaut oder ein deutsches Wort, das eine Ablehnung kaum vermeiden
 *  kann. Kein Beweis fuer Verstaendlichkeit — der eigentliche Pruefstein ist
 *  ROHTEXT; "❌ Import-Fehler: Unexpected end of JSON input" faellt hier
 *  wie dort durch. */
const DEUTSCH =
    /[äöüÄÖÜß]|\b(ist|sind|kein|keine|nicht|bitte|muss|darf|enthält|fehlt|ohne|doppelt|mehrfach|ungültig|abgelehnt|Datei|Eintrag|Kampagne)\b/i;

/** Das Thema einer R6-Ablehnung: die ID ("ID 5 kommt doppelt vor",
 *  "ungültige IDs", "ID-Nummer"). */
const ID_THEMA = /\bIDs?\b/i;

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

// ───────────────────────────────────────────────────────────────────────────
// SAAT: je Typ ein bis zwei Eintraege, wie die Speicherfunktionen sie
// schreiben — damit "D unveraendert" an jedem der zwoelf Typen etwas zu
// vergleichen hat und jede Liste etwas zu zeichnen.
// ───────────────────────────────────────────────────────────────────────────

function saat() {
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
        characters: [
            {
                id: 1,
                name: 'Thorin',
                playerName: 'Arthur',
                characterClass: 'Kaempfer',
                race: 'Zwerg',
                level: 5,
                attributes: { str: 16, dex: 12, con: 15, int: 10, wis: 11, cha: 8 },
                hpCurrent: 40,
                hpMax: 44,
                tempHp: 0,
                armorClass: 18,
                speed: '9 m',
                conditions: [],
                tags: [],
                spells: [],
                items: []
            }
        ],
        npcs: [
            {
                id: 1,
                name: 'Buergermeister Alrik',
                role: 'Buergermeister',
                race: 'Mensch',
                locationId: 1,
                description: '<p>Beschreibung Alrik</p>',
                relations: [],
                tags: []
            },
            {
                id: 2,
                name: 'Schmugglerin Vela',
                role: 'Schmugglerin',
                race: 'Elf',
                locationId: null,
                description: '',
                relations: [],
                tags: []
            }
        ],
        locations: [{ id: 1, name: 'Hafenstadt', description: '<p>Hafen</p>', filterId: null }],
        quests: [
            {
                id: 1,
                title: 'Die verlorene Fracht',
                giverId: 1,
                locationId: 1,
                type: 'main',
                description: '<p>Fracht</p>',
                completed: false,
                tags: []
            }
        ],
        loot: [
            {
                id: 1,
                name: 'Heiltrank',
                category: 'potion',
                rarity: 'common',
                quantity: 2,
                value: 50,
                description: '<p>Heilt</p>',
                tags: []
            }
        ],
        spells: [
            {
                id: 1,
                name: 'Feuerball',
                level: 3,
                school: 'Hervorrufung',
                spellClasses: ['Magier'],
                description: '<p>Bumm</p>'
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
                parentId: null
            }
        ],
        links: [
            {
                id: 1,
                title: 'SRD',
                url: 'https://example.org/srd',
                category: 'rules',
                description: ''
            }
        ],
        filters: [],
        factions: [
            {
                id: 1,
                name: 'Handelsgilde',
                symbol: '⚖',
                agenda: '',
                beschreibung: '<p>Gilde</p>',
                ruf: 0,
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
                sessionNr: 1,
                datum: '2026-10-01',
                inGameDatum: '',
                strongStart: '<p>Ein Schiff brennt</p>',
                szenen: [],
                offeneFaeden: [],
                geheimeHinweise: '',
                wichtigeNpcs: '',
                belohnungen: '',
                links: [],
                erstellt: 1700000000000
            }
        ],
        tags: [],
        sessionNotes: [],
        encounters: [
            {
                id: 1,
                name: 'Goblin',
                creatureType: 'humanoid',
                cr: '1/4',
                ac: 15,
                hp: 7,
                speed: { walk: '9', climb: '', swim: '', fly: '', burrow: '' },
                languages: ['common'],
                tags: []
            }
        ],
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
                    titel: 'Ankunft im Hafen',
                    beschreibung: '',
                    typ: 'manuell',
                    quelleId: null
                }
            ]
        },
        partyGold: 0,
        quickRefCustom: []
    };
    /** @param {{ id: number }[]} liste */
    const naechste = liste => Math.max(0, ...liste.map(x => x.id)) + 1;
    return {
        ...s,
        _nextId: {
            characters: naechste(s.characters),
            npcs: naechste(s.npcs),
            locations: naechste(s.locations),
            quests: naechste(s.quests),
            encounters: naechste(s.encounters),
            spells: naechste(s.spells),
            loot: naechste(s.loot),
            items: 1,
            wiki: naechste(s.wiki),
            links: naechste(s.links),
            sessionNotes: 1,
            randomTables: 1,
            filters: 1,
            factions: naechste(s.factions),
            sessionPreps: naechste(s.sessionPreps),
            calendarEvents: naechste(s.calendar.events)
        }
    };
}

// ───────────────────────────────────────────────────────────────────────────
// DATEIEN — im Test erzeugt (Buffer) oder per echtem Export aus der App
// ───────────────────────────────────────────────────────────────────────────

/** @param {string} name @param {string} text */
function datei(name, text) {
    return { name, mimeType: 'application/json', buffer: Buffer.from(text, 'utf8') };
}

/** Eine Reiter-Datei mit dem Kopf, den der 📤-Export heute schreibt.
 *  DATEINAMEN SIND NEUTRAL ("probe-…"): eine Meldung, die den Dateinamen
 *  zitiert, darf ein Thema (/name/, /\bID\b/, /Kampagne/) oder ein deutsches
 *  Wort ("ohne", "doppelt") nicht aus dem Namen beziehen — die Gegenprobe des
 *  Skeptikers hat genau das gegen eine Fassung mit "name-null.json",
 *  "id-text.json" gemessen (Kopf, "Gegenprobe").
 *  @param {string} typ @param {any} data @param {string} [name]
 *  @param {Record<string, any>} [kopf] ueberschreibt Felder des Kopfes */
function reiterDatei(typ, data, name, kopf = {}) {
    return datei(
        name || `probe-${typ}.json`,
        JSON.stringify(
            {
                _exportDate: '2026-10-29T10:00:00.000Z',
                _campaignName: 'Pruefung',
                _version: '2.6.1',
                _dataType: typ,
                ...kopf,
                data
            },
            null,
            2
        )
    );
}

/** Die Nutzlast fuer den Ort `ort`: bricht aus Attributen aus (`"'>`) und
 *  setzt bei Ausfuehrung ein Kennzeichen — kein `alert`, das hielte den Lauf
 *  an. `src=x` scheitert unter file:// sofort, `onerror` feuert.
 *  @param {string} ort */
function N(ort) {
    return `${ort}"'><img src=x onerror="window.__xss.push('${ort}')">`;
}

// ───────────────────────────────────────────────────────────────────────────
// LADEN, BEOBACHTEN, LESEN
// ───────────────────────────────────────────────────────────────────────────

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst — `pageerror`,
 * `console.error` und das Fehlerlog der App — und jeden nativen Dialog.
 * Dialoge werden abgelehnt, ausser `steuer.annehmen` steht.
 * @param {import('@playwright/test').Page} page
 */
function beobachten(page) {
    /** @type {string[]} */
    const fehler = [];
    /** @type {{ typ: string, text: string }[]} */
    const dialoge = [];
    const steuer = { annehmen: false };
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0]);
        }
    });
    page.on('dialog', d => {
        dialoge.push({ typ: d.type(), text: d.message() });
        (steuer.annehmen ? d.accept() : d.dismiss()).catch(() => {});
    });
    return {
        dialoge,
        steuer,
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
 * Laedt breit, saet EINMAL je Tab (sessionStorage-Sperre wie
 * link-anlegen.spec.js) und legt vor jedem Skript der Seite das Kennzeichen
 * der Nutzlasten an.
 * @param {import('@playwright/test').Page} page
 */
async function laden(page) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            // @ts-ignore — nur das Kennzeichen der Nutzlasten
            window.__xss = [];
            try {
                if (!sessionStorage.getItem('reiterimport-pruefung-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('reiterimport-pruefung-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, saat()]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN (siehe npc-formular.spec.js): repariert
    // `load()` die Saat, schreibt die App spaeter den ganzen Stand — erkennbar
    // daran, dass `_version` der Saat ueberschrieben wird. Sonst misst
    // "nichts geschrieben" diese Speicherung mit.
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
    await page.waitForTimeout(400);
    expect(
        await page.evaluate(() => window.D.npcs.map(n => n.id)),
        'Vorbedingung: die Saat ist in D angekommen'
    ).toEqual([1, 2]);
}

/** Die Import-Typen, AUS DEM BUENDEL berechnet (Vertrag: jeder Reiter mit
 *  📥 traegt ein `.io-file-input[data-on-change="importData"]`), samt der
 *  Ansicht, in der ihr Feld steht.
 *  @param {import('@playwright/test').Page} page */
function importTypen(page) {
    return page.evaluate(() =>
        [...document.querySelectorAll('.io-file-input[data-on-change="importData"]')].map(el => ({
            typ: /** @type {HTMLElement} */ (el).dataset.type || '',
            ansicht: el.closest('.view')?.id.replace(/^view-/, '') || ''
        }))
    );
}

/** Alles, was ein Reiter-Import beruehren kann: die zwoelf Sammlungen (die
 *  Typliste aus dem Buendel; `calendarEvents` liegt unter `calendar.events`)
 *  und die ID-Zaehler — in der Form, die auch der Speicher hat.
 *  @param {import('@playwright/test').Page} page */
function bestand(page) {
    return page.evaluate(() => {
        const D = window.D;
        /** @type {Record<string, any>} */
        const aus = {};
        for (const el of document.querySelectorAll('.io-file-input[data-on-change="importData"]')) {
            const t = /** @type {HTMLElement} */ (el).dataset.type || '';
            aus[t] = t === 'calendarEvents' ? D.calendar?.events : D[t];
        }
        aus._nextId = D._nextId;
        return JSON.parse(JSON.stringify(aus));
    });
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu. Ohne ihn waere "nichts geschrieben" nicht von "dasselbe
 *  geschrieben" zu unterscheiden.
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
            message: `${was}: der Import muss schreiben (save() entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Die Nummer der juengsten Meldung (das Kampfprotokoll fuehrt jede
 *  `showToast()`-Meldung nummeriert mit).
 *  @param {import('@playwright/test').Page} page */
function meldungsStand(page) {
    return page.evaluate(() =>
        (window.getCombatLog?.() || []).reduce((m, e) => Math.max(m, e.nr), 0)
    );
}
/** Alle Meldungen nach `nr`, aelteste zuerst, als `typ: Text`.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} nr */
function meldungenSeit(page, nr) {
    return page.evaluate(
        nr =>
            (window.getCombatLog?.() || [])
                .filter(e => e.nr > nr)
                .sort((a, b) => a.nr - b.nr)
                .map(e => `${e.typ}: ${e.text}`),
        nr
    );
}

/** Liest das Kennzeichen der Nutzlasten und leert es — jede Stufe meldet
 *  nur, was SIE ausgeloest hat.
 *  @param {import('@playwright/test').Page} page */
function kennzeichen(page) {
    // @ts-ignore
    return page.evaluate(() => (window.__xss || []).splice(0));
}

/** @param {import('@playwright/test').Page} page */
function fenster(page) {
    return page.locator('#import-modal');
}

/** Der sichtbare Knopf mit genau diesem Zeichen in der Ansicht — 📥 bzw. 📤
 *  ueber ihren sichtbaren Text, nicht ueber Klasse oder `data-action` (wie
 *  reiterimport-weg.spec.js): der Vertrag sichert das sichtbare 📥 zu, nicht,
 *  wie es das Feld oeffnet. Dass es in jedem der zwoelf Reiter genau eines
 *  gibt, haelt der Waechter (12) dort.
 *  @param {import('@playwright/test').Page} page @param {string} ansicht
 *  @param {'📥'|'📤'} zeichen */
function knopfMit(page, ansicht, zeichen) {
    return page
        .locator(`#view-${ansicht}`)
        .locator('button, label, [role="button"]')
        .filter({ hasText: new RegExp(`^\\s*${zeichen}\\s*$`, 'u') });
}

/** Sichtbare Dialoge der Seite (fuer eine Rueckfrage, die kein nativer
 *  Dialog ist).
 *  @param {import('@playwright/test').Page} page */
function seitenDialogText(page) {
    return page.evaluate(() =>
        [...document.querySelectorAll('[role="dialog"], .modal-overlay, .modal')]
            .filter(el => {
                const r = el.getBoundingClientRect();
                return (
                    el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
                    r.width > 0 &&
                    r.height > 0
                );
            })
            .map(el => /** @type {HTMLElement} */ (el).innerText.replace(/\s+/g, ' ').trim())
            .join(' | ')
    );
}

/**
 * Der Zustand vor einer Dateiwahl: Meldungsstand, Dialogzahl, Bestand, `_rev`.
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof beobachten>} beob
 */
async function zustand(page, beob) {
    return {
        stand: await meldungsStand(page),
        dialogeVor: beob.dialoge.length,
        bestand: await bestand(page),
        rev: await revStand(page)
    };
}

/**
 * Waehlt `dateiInhalt` ueber das 📥 des Reiters `ansicht`: echter Klick, und
 * JEDER Dateidialog, der danach aufgeht, bekommt dieselbe Datei (Kopf, "Wie
 * gewaehlt wird"). Wartet, bis das Fenster, eine Meldung oder ein Dialog
 * kommt — hoechstens FOLGE_MS —, und noch einen Augenblick fuer Nachzuegler.
 * Bleibt alles aus, schlagen die Zusicherungen danach an, nicht diese Hilfe.
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof beobachten>} beob
 * @param {string} ansicht
 * @param {{ name: string, mimeType: string, buffer: Buffer }} dateiInhalt
 */
async function waehlen(page, beob, ansicht, dateiInhalt) {
    await navigateToTab(page, ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
    const stand = await meldungsStand(page);
    const dialogeVor = beob.dialoge.length;
    /** @param {import('@playwright/test').FileChooser} fc */
    const bedienen = fc => {
        fc.setFiles(dateiInhalt).catch(() => {});
    };
    page.on('filechooser', bedienen);
    try {
        await knopfMit(page, ansicht, '📥').click();
        const ende = Date.now() + FOLGE_MS;
        while (Date.now() < ende) {
            if (await fenster(page).isVisible()) break;
            if ((await meldungenSeit(page, stand)).length > 0) break;
            if (beob.dialoge.length > dialogeVor) break;
            await page.waitForTimeout(100);
        }
        await beruhigt(page, beob, stand);
    } finally {
        page.off('filechooser', bedienen);
    }
}

/** Wartet, bis 500 ms lang keine neue Meldung und kein neuer Dialog kam
 *  (hoechstens 2 s) — ein "wird gelesen …" vor der eigentlichen Antwort
 *  soll die Zusicherungen nicht zu frueh lesen lassen.
 *  @param {import('@playwright/test').Page} page
 *  @param {ReturnType<typeof beobachten>} beob
 *  @param {number} stand */
async function beruhigt(page, beob, stand) {
    const ende = Date.now() + 2000;
    let zahl = -1;
    while (Date.now() < ende) {
        const jetzt = (await meldungenSeit(page, stand)).length + beob.dialoge.length;
        if (jetzt === zahl) return;
        zahl = jetzt;
        await page.waitForTimeout(500);
    }
}

/** Waehlt im offenen Fenster den Modus — ueber das Radio, oder, wenn das
 *  Radio selbst nicht sichtbar ist, ueber seine Beschriftung.
 *  @param {import('@playwright/test').Page} page
 *  @param {'merge'|'replace'} modus */
async function modusWaehlen(page, modus) {
    const radio = fenster(page).locator(`input[name="import-mode"][value="${modus}"]`);
    if (await radio.isVisible()) await radio.check();
    else await fenster(page).locator('label', { has: radio }).click();
}

/** @param {import('@playwright/test').Page} page */
function importierenKnopf(page) {
    return fenster(page).locator('[data-action="execute-import"]', { hasText: 'Importieren' });
}

/** Schliesst ein noch offenes Fenster wie ein Nutzer: Escape, sonst
 *  "Abbrechen" bzw. ✕.
 *  @param {import('@playwright/test').Page} page */
async function fensterSchliessen(page) {
    if (!(await fenster(page).isVisible())) return;
    await page.keyboard.press('Escape');
    for (let i = 0; i < 15 && (await fenster(page).isVisible()); i++) {
        await page.waitForTimeout(100);
    }
    if (await fenster(page).isVisible()) {
        await fenster(page)
            .getByRole('button', { name: /Abbrechen|✕/ })
            .first()
            .click();
    }
    await expect(fenster(page), 'das Fenster laesst sich schliessen').toBeHidden();
}

/** Der Bestand ohne die ID-Zaehler — fuer R6, siehe ablehnungPruefen().
 *  @param {Record<string, any>} b */
function ohneZaehler(b) {
    const k = { ...b };
    delete k._nextId;
    return k;
}

/**
 * Die Zusagen einer Ablehnung (R3, R6; Kopf, "Was als Ablehnung zaehlt").
 * Mit `r6`: das Fenster darf offen gewesen sein (Weg B); als Dialog zaehlt
 * nur ein `alert` — ein bestaetigtes "Wirklich ersetzen?" ist keine
 * Ablehnung —; und die ID-Zaehler bleiben aus dem Vergleich: ein Fix darf
 * die neuen IDs fuers Hinzufuegen schon fuer die Vorschau ziehen (nextId()
 * vergibt nie zweimal), der Bestand selbst muss stehen.
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof beobachten>} beob
 * @param {Awaited<ReturnType<typeof zustand>>} vor
 * @param {string} was
 * @param {{ thema?: RegExp, r6?: boolean }} [opt]
 */
async function ablehnungPruefen(page, beob, vor, was, opt = {}) {
    const meldungen = await meldungenSeit(page, vor.stand);
    const dialoge = beob.dialoge
        .slice(vor.dialogeVor)
        .filter(d => !opt.r6 || d.typ === 'alert')
        .map(d => `${d.typ}: ${d.text}`);
    const ablehnung = [...meldungen.filter(m => /^(error|warning): /.test(m)), ...dialoge];
    weich(
        ablehnung,
        `${was}: eine Meldung lehnt die Datei ab (Ereignis-Log error/warning oder Dialog)`
    ).not.toEqual([]);
    weich(
        [...meldungen, ...dialoge].filter(t => ROHTEXT.test(t)),
        `${was}: kein englischer Parser- oder Laufzeit-Rohtext in den Meldungen`
    ).toEqual([]);
    weich(
        ablehnung.filter(t => !DEUTSCH.test(t)),
        `${was}: die Ablehnung ist deutsch formuliert`
    ).toEqual([]);
    if (opt.thema) {
        weich(ablehnung.join(' | '), `${was}: die Ablehnung nennt, woran es liegt`).toMatch(
            opt.thema
        );
    }
    weich(
        meldungen.filter(m => m.startsWith('success: ')),
        `${was}: keine Erfolgsmeldung (R2: vorher hoechstens neutrale Hinweise)`
    ).toEqual([]);
    if (opt.r6) {
        weich(ohneZaehler(await bestand(page)), `${was}: D unveraendert`).toEqual(
            ohneZaehler(vor.bestand)
        );
    } else {
        await expect
            .soft(fenster(page), `${was}: die Pruefung lehnt VOR dem Fenster ab (R3)`)
            .toBeHidden();
        weich(await bestand(page), `${was}: D unveraendert`).toEqual(vor.bestand);
    }
    weich(await revStand(page), `${was}: nichts geschrieben (_rev)`).toBe(vor.rev);
}

/**
 * Der Schluss jedes Ablehnungsfalls: ALLE Reiter mit 📥 (Liste aus dem
 * Buendel) per Klick besuchen — keiner zeigt "Anzeigefehler" —, dann das
 * Fehlerlog: leer.
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof beobachten>} beob
 */
async function listenUndFehlerlog(page, beob) {
    const typen = await importTypen(page);
    weich(typen.length, 'der Vertrag: zwoelf Reiter mit 📥').toBe(12);
    /** @type {string[]} */
    const befunde = [];
    for (const { ansicht } of typen) {
        await navigateToTab(page, ansicht);
        const text = await page.locator(`#view-${ansicht}`).innerText();
        if (/Anzeigefehler/.test(text)) {
            befunde.push(`${ansicht}: ${text.replace(/\s+/g, ' ').slice(0, 160)}`);
        }
    }
    weich(befunde, 'danach rendert jede Liste ohne "Anzeigefehler"').toEqual([]);
    weich(await beob.alle(), 'kein Fehler, das Fehlerlog bleibt leer').toEqual([]);
}

/**
 * Eine Ablehnung aus mehreren Dateien: je Datei im Reiter `ansicht` (oder
 * dem eigenen `f.ansicht`) waehlen, pruefen, ein offenes Fenster schliessen;
 * am Ende Listen und Fehlerlog.
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof beobachten>} beob
 * @param {string} ansicht
 * @param {{ was: string, datei: ReturnType<typeof datei>, thema?: RegExp, ansicht?: string }[]} faelle
 */
async function ablehnungen(page, beob, ansicht, faelle) {
    for (const f of faelle) {
        const vor = await zustand(page, beob);
        await waehlen(page, beob, f.ansicht || ansicht, f.datei);
        await ablehnungPruefen(page, beob, vor, f.was, { thema: f.thema });
        await fensterSchliessen(page);
    }
    await listenUndFehlerlog(page, beob);
}

/**
 * Importiert eine GUELTIGE Datei per "Hinzufügen" — die Vorbedingung der
 * Nutzlast-Faelle (11)–(14) und von (7). Prueft unterwegs das Kennzeichen:
 * in der Vorschau und beim Import (renderAll).
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof beobachten>} beob
 * @param {string} ansicht
 * @param {ReturnType<typeof datei>} dateiInhalt
 * @param {string} was
 */
async function gueltigHinzufuegen(page, beob, ansicht, dateiInhalt, was) {
    beob.steuer.annehmen = true;
    await waehlen(page, beob, ansicht, dateiInhalt);
    await expect(
        fenster(page),
        `Vorbedingung (${was}): die gueltige Datei oeffnet das Fenster — ohne Import misst der Fall nichts`
    ).toBeVisible();
    await page.waitForTimeout(400);
    weich(await kennzeichen(page), `${was}: die Vorschau fuehrt kein Script aus`).toEqual([]);
    await modusWaehlen(page, 'merge');
    const rev = await revStand(page);
    await importierenKnopf(page).click();
    await geschriebenSeit(page, rev, `${was} → Importieren`);
    await fensterSchliessen(page);
    await page.waitForTimeout(500);
    weich(await kennzeichen(page), `${was}: beim Import (renderAll) laeuft kein Script`).toEqual(
        []
    );
    beob.steuer.annehmen = false;
}

// ===========================================================================
// (1) KAPUTTES JSON UND LEERE DATEI
// ===========================================================================
//
// Am Buendel (gemessen): der Rohtext des Parsers in der Meldung —
// "Expected double-quoted property name in JSON at position …" bzw.
// "Unexpected end of JSON input" — und je ein Eintrag im Fehlerlog.
test('(1) kaputtes JSON und eine leere Datei werden deutsch abgelehnt, ohne Parser-Rohtext', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    await ablehnungen(page, beob, 'npcs', [
        {
            was: 'kaputtes JSON',
            datei: datei('probe-1a.json', '{"_dataType":"npcs","data":[{"id":1,')
        },
        { was: '0 Byte', datei: datei('probe-1b.json', '') }
    ]);
});

// ===========================================================================
// (2) DATEI OHNE `data`-ARRAY
// ===========================================================================
//
// Ein nacktes Array und ein Objekt, dessen Eintraege unter einem anderen
// Schluessel stehen. Am Buendel ist die Meldung schon deutsch ("Ungültiges
// Format: "data"-Array fehlt") — rot wird der Fall dort am Fehlerlog
// ("Import, Parse error"): eine abgelehnte Datei ist kein Fehler der App.
test('(2) eine Datei ohne "data"-Array wird abgelehnt, ohne Eintrag im Fehlerlog', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    await ablehnungen(page, beob, 'npcs', [
        {
            was: 'nacktes Array',
            datei: datei('probe-2a.json', JSON.stringify([{ id: 1, name: 'Nackt' }]))
        },
        {
            was: 'Objekt ohne "data"',
            datei: datei(
                'probe-2b.json',
                JSON.stringify({ _dataType: 'npcs', eintraege: [{ id: 1, name: 'Daneben' }] })
            )
        }
    ]);
});

// ===========================================================================
// (3) EINE KAMPAGNEN-DATEI IM REITER
// ===========================================================================
//
// Die Datei kommt aus dem echten Export (💾 Daten → "📁 Als Datei
// speichern"). Am Buendel: dieselbe Meldung wie (2), kein Wort davon, dass
// es eine Kampagnen-Datei ist — dabei sagt der Kampagnenweg es umgekehrt
// ("Einzel-Export – bitte im jeweiligen Reiter importieren"). Verlangt wird,
// dass die Ablehnung die Kampagne nennt.
//
// DER KAMPAGNENNAME DER DATEI IST "Gruenwald", nicht "Standard-Kampagne":
// der Export der Standardkampagne schreibt `_campaignName:
// "Standard-Kampagne"`, und eine Meldung, die nur den Kopf der Datei zitiert
// ("… (Standard-Kampagne)") — wie die heutige Vorschau "Kampagne: …" —,
// erfuellte /Kampagne/ ohne jede Erkennung. Gemessen in der Gegenprobe des
// Skeptikers (Kopf). In einer eigenen Kampagne steht dort ihr Name; der Fall
// setzt genau das ein. Der Dateiname folgt dem Muster des Exports
// (`<Name>-<Datum>.json`).
test('(3) eine Kampagnen-Datei im NPC-Reiter wird abgelehnt, und die Meldung nennt die Kampagne', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    await navigateToTab(page, 'data');
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: SOFORT_MS }),
        page.locator('#view-data').getByRole('button', { name: '📁 Als Datei speichern' }).click()
    ]);
    const kampagne = JSON.parse(
        fs.readFileSync(/** @type {string} */ (await download.path()), 'utf8')
    );
    expect(
        kampagne.npcs?.length,
        'Vorbedingung: der echte Kampagnen-Export traegt die NPCs der Saat'
    ).toBe(2);
    expect(
        kampagne._campaignName,
        'Vorbedingung: der Export schreibt den Namen der Kampagne in den Kopf'
    ).toBe('Standard-Kampagne');
    kampagne._campaignName = 'Gruenwald';
    const inhalt = JSON.stringify(kampagne, null, 2);
    await ablehnungen(page, beob, 'npcs', [
        {
            was: 'Kampagnen-Datei',
            datei: datei('Gruenwald-2026-10-29.json', inhalt),
            thema: /Kampagne/i
        }
    ]);
});

// ===========================================================================
// (4) `data` MIT NICHT-OBJEKTEN
// ===========================================================================
//
// Am Buendel: "Cannot read properties of null (reading 'id')" — der
// TypeError roh in der Meldung. `[7]` lief als "Pflichtfeld fehlt" durch.
test('(4) "data" mit null bzw. einer Zahl wird deutsch abgelehnt, ohne TypeError-Text', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    await ablehnungen(page, beob, 'npcs', [
        { was: 'data: [null]', datei: reiterDatei('npcs', [null], 'probe-4a.json') },
        { was: 'data: [7]', datei: reiterDatei('npcs', [7], 'probe-4b.json') }
    ]);
});

// ===========================================================================
// (5) NAME BZW. TITEL: null, 42, LEER UND FEHLEND
// ===========================================================================
//
// Am Buendel "✅ Datei validiert: 1 Einträge bereit" — die Pruefung kennt
// nur `=== undefined`. Mit Fenster (Messung Datenpfad) legte `null` beim
// Ersetzen, 42 schon beim Hinzufuegen die GANZE NPC-Liste lahm
// ("Anzeigefehler", `localeCompare`).
//
// R3 sagt "Name BZW. TITEL": vier der zwoelf Typen haben keinen `name`,
// sondern `title` (Quests, Wiki, Links) bzw. `titel` (Kalender). Die
// Gegenprobe des Skeptikers (Kopf) mass einen Teilfix, der nur `name`
// prueft und die heutige Pflichtfeldpruefung ersetzt — gegen die NPC-Dateien
// allein war dieser Fall gruen. Darum je eine Quest mit `title: null` und ein
// Kalender-Ereignis OHNE `titel` (der "fehlende" Titel aus R3); beide sind
// sonst gueltig (Felder wie die Speicherfunktionen sie schreiben), damit nur
// der Titel sie ablehnen kann.
test('(5) Name bzw. Titel null, 42, leer oder fehlend wird vor dem Fenster abgelehnt (NPC, Quest, Kalender)', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    const thema = /name|titel|title|bezeichnung/i;
    await ablehnungen(page, beob, 'npcs', [
        {
            was: 'name null',
            datei: reiterDatei('npcs', [{ id: 1, name: null, race: 'Ork' }], 'probe-5a.json'),
            thema
        },
        {
            was: 'name 42',
            datei: reiterDatei('npcs', [{ id: 1, name: 42, race: 'Ork' }], 'probe-5b.json'),
            thema
        },
        {
            was: "name ''",
            datei: reiterDatei('npcs', [{ id: 1, name: '', race: 'Ork' }], 'probe-5c.json'),
            thema
        },
        {
            was: 'Quest title null',
            ansicht: 'quests',
            datei: reiterDatei(
                'quests',
                [
                    {
                        id: 1,
                        title: null,
                        giverId: null,
                        locationId: null,
                        type: 'main',
                        description: '<p>Ohne Titel</p>',
                        completed: false,
                        tags: []
                    }
                ],
                'probe-5d.json'
            ),
            thema
        },
        {
            was: 'Kalender ohne titel',
            ansicht: 'kalender',
            datei: reiterDatei(
                'calendarEvents',
                [
                    {
                        id: 1,
                        datum: { tag: 5, monat: 2, jahr: 1492 },
                        beschreibung: '',
                        typ: 'manuell',
                        quelleId: null
                    }
                ],
                'probe-5e.json'
            ),
            thema
        }
    ]);
});

// ===========================================================================
// (6) ZAHL STATT TEXT UND TEXT STATT ZAHL (CHARAKTER, TRUHE)
// ===========================================================================
//
// Die App schreibt `speed` immer als Text ("9 m"); eine Zahl laesst ✏️ am
// Helden werfen ("speedVal.split is not a function", Messung Datenpfad).
// `hpMax` schreibt sie als Zahl. Am Buendel liefen beide als "validiert".
//
// R3 sagt "bekannte Zahlfelder", nicht "Zahlfelder der Charaktere": ein
// Teilfix, der nur die Heldenfelder prueft, war gegen die zwei
// Charakter-Dateien allein gruen (Gegenprobe des Skeptikers, Kopf). Dazu
// `loot.quantity` als Text — das Truhen-Detail setzt `${item.quantity}`
// ungeschuetzt ein, ein Text dort ist also mehr als ein Schoenheitsfehler.
test('(6) speed als Zahl, hpMax bzw. Truhen-Menge als Text wird vor dem Fenster abgelehnt', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    await ablehnungen(page, beob, 'party', [
        {
            was: 'speed 30',
            datei: reiterDatei(
                'characters',
                [{ id: 1, name: 'Tempo', level: 3, hpCurrent: 20, hpMax: 20, speed: 30 }],
                'probe-6a.json'
            )
        },
        {
            was: "hpMax 'viel'",
            datei: reiterDatei(
                'characters',
                [{ id: 1, name: 'Zaeh', level: 3, hpCurrent: 20, hpMax: 'viel', speed: '9 m' }],
                'probe-6b.json'
            )
        },
        {
            was: "Truhe quantity 'viele'",
            ansicht: 'loot',
            datei: reiterDatei(
                'loot',
                [
                    {
                        id: 1,
                        name: 'Stapel',
                        category: 'potion',
                        rarity: 'common',
                        quantity: 'viele',
                        value: 5,
                        description: '',
                        tags: []
                    }
                ],
                'probe-6c.json'
            )
        }
    ]);
});

// ===========================================================================
// (7) `__proto__`, `constructor`, `prototype` — DER REVIVER
// ===========================================================================
//
// Die Datei ist gueltig und muss ankommen; die verbotenen Schluessel muessen
// auf JEDER Ebene verworfen sein (R3: Reviver wie der Kampagnenweg). Der
// JSON-Text ist von Hand geschrieben: ein Objektliteral mit `__proto__`
// setzte in JS den Prototyp, statt einen Schluessel zu schreiben.
// Am Buendel kommt die Datei nicht an (kein Fenster). Mit Fenster filterte
// das Schema die obersten Schluessel weg, `tags[0].__proto__` aber blieb als
// eigener Schluessel in D und im Speicher.
test('(7) __proto__/constructor/prototype werden verworfen und verschmutzen Object.prototype nicht', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    const text = `{
  "_exportDate": "2026-10-29T10:00:00.000Z",
  "_campaignName": "Pruefung",
  "_dataType": "npcs",
  "data": [
    {
      "id": 1,
      "name": "Proto-Probe",
      "race": "Mensch",
      "description": "<p>gueltig</p>",
      "__proto__": { "verschmutzt1": "ja" },
      "constructor": { "prototype": { "verschmutzt2": "ja" } },
      "prototype": { "verschmutzt3": "ja" },
      "tags": [ { "name": "t", "color": "#ffffff", "__proto__": { "verschmutzt4": "ja" } } ],
      "dialogs": [ { "title": "Gruss", "text": "Hallo", "used": false,
                     "constructor": { "prototype": { "verschmutzt5": "ja" } } } ]
    }
  ]
}`;
    const verschmutzt = () =>
        page.evaluate(() => {
            /** @type {any} */
            const leer = {};
            return ['verschmutzt1', 'verschmutzt2', 'verschmutzt3', 'verschmutzt4', 'verschmutzt5']
                .filter(k => k in leer || k in Object.prototype)
                .concat(
                    Object.getOwnPropertyNames(Object.prototype).filter(k => /verschmutzt/.test(k))
                );
        });

    await gueltigHinzufuegen(page, beob, 'npcs', datei('probe-7.json', text), '__proto__-Datei');
    weich(await verschmutzt(), 'Object.prototype bleibt sauber').toEqual([]);

    // Je Objekt: kein verbotener EIGENER Schluessel, und nichts geerbt, was
    // aus der Nutzlast stammt (ein `Object.assign` mit `__proto__` haengte
    // den Eintrag an die Nutzlast, ohne Object.prototype zu beruehren).
    const befund = await page.evaluate(schluessel => {
        const verboten = ['__proto__', 'constructor', 'prototype'];
        const marken = [1, 2, 3, 4, 5].map(n => `verschmutzt${n}`);
        /** @type {string[]} */
        const funde = [];
        /** @param {any} wert @param {string} pfad */
        const gehe = (wert, pfad) => {
            if (wert === null || typeof wert !== 'object') return;
            for (const m of marken) {
                if (m in wert && !Object.prototype.hasOwnProperty.call(wert, m)) {
                    funde.push(`${pfad}: erbt "${m}" aus der Nutzlast`);
                }
            }
            for (const k of Object.getOwnPropertyNames(wert)) {
                if (verboten.includes(k)) funde.push(`${pfad}.${k}`);
                gehe(wert[k], `${pfad}.${k}`);
            }
        };
        const eintrag = window.D.npcs.find(n => n.name === 'Proto-Probe');
        if (eintrag) gehe(eintrag, 'D.npcs[Proto-Probe]');
        let gespeichert = '';
        try {
            const npcs = JSON.parse(localStorage.getItem(schluessel) || '{}').npcs || [];
            gespeichert = JSON.stringify(npcs.find(n => n.name === 'Proto-Probe') || null);
        } catch {
            gespeichert = '(nicht lesbar)';
        }
        return {
            angekommen: !!eintrag,
            funde,
            imSpeicher: verboten.filter(k => gespeichert.includes(`"${k}"`))
        };
    }, SPEICHER);
    weich(befund.angekommen, 'der gueltige Eintrag kommt an').toBe(true);
    weich(befund.funde, 'kein verbotener Schluessel in D, auf keiner Ebene').toEqual([]);
    weich(befund.imSpeicher, 'kein verbotener Schluessel im Speicher').toEqual([]);
    weich(await beob.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) WAECHTER: 10 MB + 1 BYTE
// ===========================================================================
//
// Schon am Buendel richtig — "❌ Datei zu groß (max 10MB)" — aber nur fuer
// die Datei des ZWEITEN Dialogs (Bedienweg B07: Dialog 1 = 12 MB, Dialog 2
// klein → "validiert"). Ein Fix, der die Datei des ersten Dialogs liest,
// muss die Grenze dorthin mitnehmen. Die Datei ist bis auf ihre Groesse
// gueltig, damit NUR die Grenze sie ablehnen kann.
test('(8) eine Datei mit 10 MB + 1 Byte wird abgelehnt (Waechter)', async ({ page }) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    const kopf =
        '{"_dataType":"npcs","_campaignName":"Pruefung","data":[{"id":1,"name":"Riesig","description":"';
    const fuss = '"}]}';
    const fuell = MAX_BYTES + 1 - Buffer.byteLength(kopf + fuss);
    const gross = datei('probe-8.json', kopf + 'a'.repeat(fuell) + fuss);
    expect(gross.buffer.length, 'Vorbedingung: genau 10 MB + 1 Byte').toBe(MAX_BYTES + 1);
    await ablehnungen(page, beob, 'npcs', [{ was: '10 MB + 1 Byte', datei: gross }]);
});

// ===========================================================================
// (9) FALSCHER `_dataType`: DIE RUECKFRAGE NENNT DEUTSCHE TYPNAMEN
// ===========================================================================
//
// Eine Orte-Datei aus dem echten 📤 des Orte-Reiters, gewaehlt im Reiter
// Fraktionen. Am Buendel (gemessen): 'Import-Datentyp ist "locations", aber
// erwartet wird "factions"' — die internen Schluessel. Verlangt: die
// Rueckfrage nennt "Ort…" und "Fraktion…" und keinen der Schluessel. Die
// Datei bekommt einen eigenen Namen, damit ein Dateiname in der Rueckfrage
// den Schluessel nicht einschleppt. Abgelehnt: nichts geschrieben, kein
// Fenster.
test('(9) eine Orte-Datei im Fraktionen-Reiter fuehrt zu einer Rueckfrage mit deutschen Typnamen', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    await navigateToTab(page, 'locations');
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: SOFORT_MS }),
        knopfMit(page, 'locations', '📤').click()
    ]);
    const inhalt = fs.readFileSync(/** @type {string} */ (await download.path()), 'utf8');
    expect(JSON.parse(inhalt)._dataType, 'Vorbedingung: eine echte Orte-Datei').toBe('locations');

    const vor = await zustand(page, beob);
    await waehlen(page, beob, 'fraktionen', datei('aus-dem-orte-reiter.json', inhalt));
    const nativ = beob.dialoge.slice(vor.dialogeVor).map(d => d.text);
    const rueckfrage = nativ.length ? nativ.join(' | ') : await seitenDialogText(page);
    weich(rueckfrage, 'es gibt eine Rueckfrage').not.toBe('');
    weich(rueckfrage, 'die Rueckfrage nennt den Typ der Datei deutsch').toMatch(/\bOrt/);
    weich(rueckfrage, 'die Rueckfrage nennt den Typ des Reiters deutsch').toMatch(/\bFraktion/);
    weich(rueckfrage, 'die Rueckfrage nennt keinen internen Schluessel').not.toMatch(
        /\b(locations|factions)\b/
    );
    weich(rueckfrage, 'kein Rohtext in der Rueckfrage').not.toMatch(ROHTEXT);
    if (!nativ.length && (await fenster(page).isVisible())) await fensterSchliessen(page);
    else if (!nativ.length) await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const meldungen = await meldungenSeit(page, vor.stand);
    weich(
        meldungen.filter(m => m.startsWith('success: ')),
        'nach "Abbrechen" keine Erfolgsmeldung'
    ).toEqual([]);
    await expect.soft(fenster(page), 'nach "Abbrechen" kein Fenster').toBeHidden();
    weich(await bestand(page), 'nach "Abbrechen" D unveraendert').toEqual(vor.bestand);
    weich(await revStand(page), 'nach "Abbrechen" nichts geschrieben (_rev)').toBe(vor.rev);
    await listenUndFehlerlog(page, beob);
});

// ===========================================================================
// (10) ERSETZEN MIT DOPPELTER BZW. UNGUELTIGER ID
// ===========================================================================

/**
 * R6: Datei waehlen; geht das Fenster auf, "Ersetzen" → "Importieren" (Weg
 * B). Ein ausgegrautes "Ersetzen" zaehlt als Ablehnung, wenn das Fenster die
 * ID nennt. Rueckfragen werden bestaetigt (Kopf, "R6 hat zwei Wege").
 * @param {import('@playwright/test').Page} page
 * @param {ReturnType<typeof beobachten>} beob
 * @param {string} was
 * @param {ReturnType<typeof datei>} dateiInhalt
 */
async function ersetzenAbgelehnt(page, beob, was, dateiInhalt) {
    beob.steuer.annehmen = true;
    const vor = await zustand(page, beob);
    await waehlen(page, beob, 'npcs', dateiInhalt);
    let ausgegraut = false;
    if (await fenster(page).isVisible()) {
        const ersetzen = fenster(page).locator('input[name="import-mode"][value="replace"]');
        if (await ersetzen.isDisabled()) {
            ausgegraut = true;
            weich(
                await fenster(page).innerText(),
                `${was}: "Ersetzen" ist gesperrt — das Fenster nennt die ID`
            ).toMatch(ID_THEMA);
        } else {
            await modusWaehlen(page, 'replace');
            const stand = await meldungsStand(page);
            await importierenKnopf(page).click();
            const ende = Date.now() + FOLGE_MS;
            while (Date.now() < ende) {
                if ((await meldungenSeit(page, stand)).length > 0) break;
                if (!(await fenster(page).isVisible())) break;
                await page.waitForTimeout(100);
            }
            await page.waitForTimeout(800);
        }
    }
    if (ausgegraut) {
        const meldungen = await meldungenSeit(page, vor.stand);
        weich(
            meldungen.filter(m => m.startsWith('success: ')),
            `${was}: keine Erfolgsmeldung`
        ).toEqual([]);
        weich(ohneZaehler(await bestand(page)), `${was}: D unveraendert`).toEqual(
            ohneZaehler(vor.bestand)
        );
    } else {
        await ablehnungPruefen(page, beob, vor, was, { thema: ID_THEMA, r6: true });
    }
    await fensterSchliessen(page);
    weich(
        ohneZaehler(await bestand(page)),
        `${was}: auch nach dem Schliessen D unveraendert`
    ).toEqual(ohneZaehler(vor.bestand));
    weich(await revStand(page), `${was}: auch nach dem Schliessen nichts geschrieben`).toBe(
        vor.rev
    );
    beob.steuer.annehmen = false;
}

// Am Buendel "validiert", kein Fenster, keine Ablehnung — fuer alle vier
// Dateien. Mit Fenster (gemessen) uebernahm "Ersetzen" beide Eintraege mit
// id 5 (die Karte "Doppel B" zeigte im Detail "Doppel A", und 🗑️ loeschte
// beide) bzw. eine Karte mit `data-id="abc"`, die sich weder oeffnen noch
// loeschen liess. -1 ist die zweite Form von "keine positive Ganzzahl", 2.5
// die dritte: ein Teilfix mit `typeof id === 'number' && id > 0` lehnt "abc"
// und -1 ab und nimmt 2.5 — gegen die ersten drei Dateien allein war dieser
// Fall damit gruen (Gegenprobe des Skeptikers, Kopf). Doppelte und
// ungueltige IDs teilen sich EINEN Fall (frueher (10) und (11)): dieselbe
// Regel, derselbe Weg, und der Platz ging an die Nutzlasten (11).
test('(10) "Ersetzen" mit doppelter ID bzw. der ID "abc", -1 oder 2.5 wird mit deutscher Meldung abgelehnt', async ({
    page
}) => {
    test.setTimeout(120000);
    const beob = beobachten(page);
    await laden(page);
    /** @type {[string, any[]][]} */
    const dateien = [
        [
            'doppelte ID 5',
            [
                { id: 5, name: 'Doppel A', race: 'Mensch' },
                { id: 5, name: 'Doppel B', race: 'Elf' }
            ]
        ],
        [
            'ID "abc"',
            [
                { id: 'abc', name: 'Text-ID', race: 'Mensch' },
                { id: 10, name: 'Normal', race: 'Elf' }
            ]
        ],
        [
            'ID -1',
            [
                { id: -1, name: 'Minus', race: 'Mensch' },
                { id: 11, name: 'Normal', race: 'Elf' }
            ]
        ],
        [
            'ID 2.5',
            [
                { id: 2.5, name: 'Bruch', race: 'Mensch' },
                { id: 12, name: 'Normal', race: 'Elf' }
            ]
        ]
    ];
    for (const [i, [was, data]] of dateien.entries()) {
        await ersetzenAbgelehnt(
            page,
            beob,
            was,
            reiterDatei('npcs', data, `probe-10${'abcd'[i]}.json`)
        );
    }
    await listenUndFehlerlog(page, beob);
});

// ===========================================================================
// (11)–(14) NUTZLASTEN UEBER DEN REITER-WEG (R9)
// ===========================================================================

/** Zur Startansicht und zurueck — die Liste wird ueber die Reiter-Registry
 *  neu gezeichnet, nicht nur ueber renderAll().
 *  @param {import('@playwright/test').Page} page @param {string} ansicht */
async function neuZeichnen(page, ansicht) {
    await navigateToTab(page, 'dashboard');
    await navigateToTab(page, ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
    await page.waitForTimeout(400);
}

// Am Buendel kommt keine der drei Dateien an. GEFUNDEN in der Gegenprobe des
// Skeptikers (Kopf), nicht von (12)–(14) erfasst: mit dem HALBEN Fix (nur
// das Fenster) lief `characters.speed` schon beim Import (renderAll) und
// wieder in der Heldenliste — `String(ch.speed || '').split('|')[0]` ohne
// esc() (`features/party/party-render.js`). `speed` steht im heutigen
// Schema und ist ein Textfeld (R3 verlangt dort Text, (6)), kommt also schon
// heute an. Mit vollem Felddurchlass (R4) liefen dazu
// `characters.characterClass`, `characters.resistances` (`.join(', ')` ohne
// esc()), `quests.type` (`quest-type-badge ${q.type}`) und `spells.type`
// (`spell-card ${s.type}`) — wie `cr` Felder, die das Formular nur als
// Auswahl kennt. Die uebrigen Textfelder tragen je ihre eigene Nutzlast;
// Detail heisst hier: 🔍 am Helden, die aufgeklappte Quest- bzw. Zauberkarte.
test('(11) Nutzlasten in Charakter, Quest und Zauber (speed, Klasse, Resistenzen, type) laufen weder beim Import noch in Liste oder Detail', async ({
    page
}) => {
    test.setTimeout(150000);
    const beob = beobachten(page);
    await laden(page);
    const held = {
        id: 1,
        name: `Helden-Nutzlast ${N('characters.name')}`,
        playerName: N('characters.playerName'),
        characterClass: N('characters.characterClass'),
        subclass: N('characters.subclass'),
        race: N('characters.race'),
        background: N('characters.background'),
        alignment: N('characters.alignment'),
        level: 3,
        hpCurrent: 20,
        hpMax: 20,
        tempHp: 0,
        armorClass: 14,
        speed: N('characters.speed'),
        attributes: { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 10 },
        resistances: [N('characters.resistances')],
        immunities: [N('characters.immunities')],
        languages: [N('characters.languages')],
        notes: N('characters.notes'),
        conditions: [],
        tags: [{ name: N('characters.tags'), color: '#a855f7' }],
        spells: [],
        items: []
    };
    const quest = {
        id: 1,
        title: `Quest-Nutzlast ${N('quests.title')}`,
        type: N('quests.type'),
        description: N('quests.description'),
        rewardOther: N('quests.rewardOther'),
        epilog: N('quests.epilog'),
        giverId: null,
        locationId: null,
        completed: false,
        tags: [{ name: N('quests.tags'), color: '#22c55e' }]
    };
    const zauber = {
        id: 1,
        name: `Zauber-Nutzlast ${N('spells.name')}`,
        type: N('spells.type'),
        level: 3,
        school: N('spells.school'),
        time: N('spells.time'),
        range: N('spells.range'),
        duration: N('spells.duration'),
        material: N('spells.material'),
        description: N('spells.description'),
        note: N('spells.note'),
        spellClasses: [N('spells.spellClasses')],
        ritual: false,
        v: true,
        g: true,
        m: true
    };
    /** @type {{ ansicht: string, typ: string, data: any, was: string, marke: string, detail: () => Promise<void> }[]} */
    const stufen = [
        {
            ansicht: 'party',
            typ: 'characters',
            data: held,
            was: 'Held',
            marke: 'Helden-Nutzlast',
            detail: async () => {
                await page
                    .locator('#view-party .char-card', { hasText: 'Helden-Nutzlast' })
                    .locator('[data-action="show-char-details"]')
                    .click();
                await expect(page.locator('#char-detail-modal')).toContainText('Helden-Nutzlast');
            }
        },
        {
            ansicht: 'quests',
            typ: 'quests',
            data: quest,
            was: 'Quest',
            marke: 'Quest-Nutzlast',
            detail: () =>
                page.locator('#view-quests .quest-title', { hasText: 'Quest-Nutzlast' }).click()
        },
        {
            ansicht: 'spells',
            typ: 'spells',
            data: zauber,
            was: 'Zauber',
            marke: 'Zauber-Nutzlast',
            detail: () =>
                page.locator('#view-spells .spell-name', { hasText: 'Zauber-Nutzlast' }).click()
        }
    ];
    for (const [i, s] of stufen.entries()) {
        await gueltigHinzufuegen(
            page,
            beob,
            s.ansicht,
            reiterDatei(s.typ, [s.data], `probe-11${'abc'[i]}.json`),
            s.was
        );
        weich(
            await page.evaluate(
                ([t, m]) => (window.D[t] || []).some(e => String(e.name || e.title).startsWith(m)),
                [s.typ, s.marke]
            ),
            `${s.was}: der Eintrag ist in D angekommen`
        ).toBe(true);
        await neuZeichnen(page, s.ansicht);
        await expect(page.locator(`#view-${s.ansicht}`)).toContainText(s.marke);
        weich(await kennzeichen(page), `${s.was}-Liste: kein Script`).toEqual([]);
        await s.detail();
        await page.waitForTimeout(500);
        weich(await kennzeichen(page), `${s.was}-Detail: kein Script`).toEqual([]);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
    }
    weich(
        beob.dialoge.filter(d => d.typ === 'alert'),
        'kein alert'
    ).toEqual([]);
    weich(await beob.alle(), 'kein Fehler').toEqual([]);
});

// Am Buendel kommt die Datei nicht an. Mit Fenster (gemessen) lief `cr`
// schon beim Import (renderAll zeichnet die Encounterliste auch bei
// geschlossenem Reiter) und wieder in Liste und Detail
// (`CR ${enc.cr}` ohne esc()). Die uebrigen Textfelder — auch die
// verschachtelten (`speed.walk`, `savingThrows.dex` als eigener Wert) —
// tragen je ihre eigene Nutzlast. Die Gegenprobe (Kopf) fand so zwei
// weitere Senken im Detail: formatEncSpeed() setzt `speed.walk` roh ein,
// die Rettungswurf-Marke einen eigenen Wert aus `savingThrows`.
// Der KOPF der Datei traegt ebenfalls eine (`_campaignName`): die Vorschau
// zeigt ihn ("Kampagne: …"), und ohne Nutzlast dort pruefte "die Vorschau
// fuehrt kein Script aus" nichts — ein Teilfix, der den Namen roh einsetzt,
// war in der Gegenprobe des Skeptikers gruen.
test('(12) Nutzlasten in einem Encounter (cr, Name, Texte) und im Dateikopf laufen weder in Vorschau, Liste noch Detail', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    const enc = {
        id: 1,
        name: `Kobold-Nutzlast ${N('encounters.name')}`,
        creatureType: N('encounters.creatureType'),
        cr: N('encounters.cr'),
        ac: 12,
        init: 2,
        hp: 5,
        perception: 10,
        speed: { walk: N('encounters.speed.walk'), climb: '', swim: '', fly: '', burrow: '' },
        languages: [N('encounters.languages')],
        str: 8,
        dex: 14,
        con: 10,
        int: 10,
        wis: 8,
        cha: 8,
        savingThrows: { dex: N('encounters.savingThrows.dex') },
        resistances: [N('encounters.resistances')],
        immunities: [N('encounters.immunities')],
        conditionImmunities: [N('encounters.conditionImmunities')],
        traits: N('encounters.traits'),
        equipment: N('encounters.equipment'),
        actions: N('encounters.actions'),
        skills: N('encounters.skills'),
        tags: [{ name: N('encounters.tags'), color: '#f59e0b' }]
    };
    await gueltigHinzufuegen(
        page,
        beob,
        'encounter',
        reiterDatei('encounters', [enc], 'probe-12.json', {
            _campaignName: N('vorschau._campaignName')
        }),
        'Encounter'
    );
    weich(
        await page.evaluate(() =>
            window.D.encounters.some(e => String(e.name).startsWith('Kobold-Nutzlast'))
        ),
        'der Encounter ist in D angekommen'
    ).toBe(true);

    await neuZeichnen(page, 'encounter');
    await expect(page.locator('#view-encounter')).toContainText('Kobold-Nutzlast');
    weich(await kennzeichen(page), 'Encounter-Liste: kein Script').toEqual([]);

    await page.locator('#view-encounter .enc-item', { hasText: 'Kobold-Nutzlast' }).click();
    await expect(page.locator('#enc-detail-panel')).toContainText('Kobold-Nutzlast');
    await page.waitForTimeout(500);
    weich(await kennzeichen(page), 'Encounter-Detail: kein Script').toEqual([]);
    weich(
        beob.dialoge.filter(d => d.typ === 'alert'),
        'kein alert'
    ).toEqual([]);
    weich(await beob.alle(), 'kein Fehler').toEqual([]);
});

// Am Buendel kommt die Datei nicht an. Mit Fenster (gemessen) lief die
// Nutzlast in den Tags beim Oeffnen des Details
// (`${LOOT_TAG_LABELS[t] || t}` ohne esc()). `origin` setzt das Detail
// ebenso roh ein (`ORIGIN_LABELS[…] || item.origin`) — heute filtert der
// Export es weg, mit vollem Durchlass (R4) kaeme es an.
test('(13) Nutzlasten in einem Gegenstand der Truhe (Tags, Name, Texte) laufen weder in Liste noch Detail', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    const ding = {
        id: 1,
        name: `Truhen-Nutzlast ${N('loot.name')}`,
        category: 'weapon',
        rarity: 'rare',
        quantity: 1,
        weight: 2,
        value: 10,
        description: N('loot.description'),
        origin: N('loot.origin'),
        special: N('loot.special'),
        property: N('loot.property'),
        tags: [N('loot.tags'), 'attunement'],
        attunement: true,
        assignedTo: N('loot.assignedTo')
    };
    await gueltigHinzufuegen(
        page,
        beob,
        'loot',
        reiterDatei('loot', [ding], 'probe-13.json'),
        'Truhe'
    );
    weich(
        await page.evaluate(() =>
            window.D.loot.some(e => String(e.name).startsWith('Truhen-Nutzlast'))
        ),
        'der Gegenstand ist in D angekommen'
    ).toBe(true);

    await neuZeichnen(page, 'loot');
    await expect(page.locator('#view-loot')).toContainText('Truhen-Nutzlast');
    weich(
        await kennzeichen(page),
        'Truhen-Liste (samt vorausgewaehltem Detail): kein Script'
    ).toEqual([]);

    await page.locator('#view-loot .loot-item', { hasText: 'Truhen-Nutzlast' }).click();
    await expect(page.locator('#loot-detail-panel')).toContainText('Truhen-Nutzlast');
    await page.waitForTimeout(500);
    weich(await kennzeichen(page), 'Truhen-Detail: kein Script').toEqual([]);
    weich(
        beob.dialoge.filter(d => d.typ === 'alert'),
        'kein alert'
    ).toEqual([]);
    weich(await beob.alle(), 'kein Fehler').toEqual([]);
});

// Am Buendel kommt die Datei nicht an. Mit Fenster (gemessen) stand
// "javascript:…" als href in der Liste (`esc()` schuetzt nur die
// Anfuehrungszeichen). Geprueft wird das AUFGELOESTE Protokoll jedes Links
// (`a.protocol`) — so faellt auch eine Schreibweise mit Grossbuchstaben,
// Leerzeichen oder Tabulator auf, die der Browser ebenso als javascript:
// liest. Die https-Adresse daneben muss verlinkt bleiben: ein Fix, der jeden
// href streicht, ist keiner.
test('(14) ein javascript:-Link wird nicht verlinkt, Nutzlasten in Titel und Beschreibung laufen nicht', async ({
    page
}) => {
    test.setTimeout(90000);
    const beob = beobachten(page);
    await laden(page);
    const links = [
        {
            id: 1,
            title: `Link-Nutzlast ${N('links.title')}`,
            url: "javascript:window.__xss.push('links.url')",
            category: 'rules',
            description: N('links.description')
        },
        {
            id: 2,
            title: 'Link-Gross',
            url: " JaVaScRiPt:window.__xss.push('links.url.gross')",
            category: 'rules',
            description: ''
        },
        {
            id: 3,
            title: 'Link-Tab',
            url: "java\tscript:window.__xss.push('links.url.tab')",
            category: 'rules',
            description: ''
        },
        {
            id: 4,
            title: 'Link-Gut',
            url: 'https://example.org/gut',
            category: 'rules',
            description: ''
        }
    ];
    await gueltigHinzufuegen(
        page,
        beob,
        'links',
        reiterDatei('links', links, 'probe-14.json'),
        'Links'
    );
    weich(
        await page.evaluate(() => window.D.links.map(l => String(l.title).split(' ')[0])),
        'die vier Links sind in D angekommen'
    ).toEqual(['SRD', 'Link-Nutzlast', 'Link-Gross', 'Link-Tab', 'Link-Gut']);

    await neuZeichnen(page, 'links');
    await expect(page.locator('#links-list')).toContainText('Link-Gut');
    weich(await kennzeichen(page), 'Link-Liste: kein Script').toEqual([]);
    const verweise = await page.evaluate(() =>
        [...document.querySelectorAll('#links-list a[href]')].map(a => ({
            text: (a.textContent || '').trim().split(' ')[0],
            protokoll: /** @type {HTMLAnchorElement} */ (a).protocol,
            href: /** @type {HTMLAnchorElement} */ (a).href
        }))
    );
    weich(
        verweise.filter(v => v.protokoll === 'javascript:').map(v => v.text),
        'kein Link der Liste fuehrt auf javascript:'
    ).toEqual([]);
    weich(
        verweise.find(v => v.text === 'Link-Gut')?.href ?? null,
        'die https-Adresse bleibt verlinkt'
    ).toBe('https://example.org/gut');

    // Links haben kein Detail; ✏️ ist ihr einziges — es fuellt die Karte.
    const karte = page.locator('#links-list .link-card', { hasText: 'Link-Nutzlast' });
    await karte.locator('[data-action="edit-link"]').click();
    await expect(page.locator('#link-form-card')).toBeVisible();
    await page.waitForTimeout(500);
    weich(await kennzeichen(page), 'Link bearbeiten: kein Script').toEqual([]);
    weich(
        beob.dialoge.filter(d => d.typ === 'alert'),
        'kein alert'
    ).toEqual([]);
    weich(await beob.alle(), 'kein Fehler').toEqual([]);
});
