// @ts-check
import fs from 'node:fs';
import path from 'path';
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

/**
 * Sprachen ausserhalb der festen Liste gehen beim ✏️ + 💾 nicht mehr verloren (SPRACHEN-FREI)
 * ===========================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT: **nach ✏️ zeigt das Sprachmenue jede Sprache des Helden —
 * eine, die nicht in der festen Liste steht, als zusaetzliches, gesetztes Haekchen OBEN —, und
 * 💾 speichert genau, was angehakt ist, in der Reihenfolge des Menues.** Eine Schreibvariante
 * einer festen Sprache ('zwergisch', ' Elfisch ', NFD) ist die feste Sprache; kein Laden wirft.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER BEFUND (Mess- und Kritik-Agent am Stand c5bb6a1a, Chromium, dev und prod, 1440x900 mit
 * Klicks und 390x844 per Tap; Saat ueber localStorage vor dem Laden, also durch die
 * Datengrenze; Ursprung: AVATAR-VORSCHAU Offen (a), docs/bugfixes.md)
 *
 *   - ✏️ + 💾 OHNE Aenderung verliert jede Sprache ausserhalb der 19 Werte der Vorlage: Bram
 *     ['Zwergisch','Kauderwelsch'] → ['Zwergisch'], Rex ['Kauderwelsch'] → [], Gus
 *     ['Common','Dwarvish'] → []. Ebenso jede Schreibvariante einer festen Sprache: Cora
 *     ['zwergisch','ELFISCH'] → [], Dorn [' Elfisch ', 'Gemein'+NBSP] → [] (Listenelemente
 *     werden nicht getrimmt), Kai NFD-'Gebärden' → []; Dubletten fallen mit, ein Text wird
 *     gesplittet und getrimmt (Fenn), eine Liste nicht. Vor dem 💾 zeigt das Formular
 *     "Sprachen wählen...", das 🔍-Detail die vollen Daten — die Nutzerin sieht den Verlust
 *     nicht kommen. Strg+Z holt ihn zurueck, wenn man ihn bemerkt.
 *   - `languages` als 7, true oder Objekt wirft in setCharLanguages() (`languages.split is not
 *     a function`); seit CHAR-HALBLADEN faengt editChar() das: Formular leer und zu, rote
 *     Meldung. 0 und false gehen still als [] durch.
 *   - Woher freie Sprachen kommen: die App selbst schrieb nie eine (alle Fassungen der Vorlage
 *     tragen dieselben 19 Werte), aber der Reiter-Import R7 ("Hinzufuegen") uebernimmt sie
 *     woertlich (gemessen: ['Gemein','Kauderwelsch',' zwergisch ','Gemein']), ebenso load(),
 *     Kampagnen-Import, Backup und Migration (dieselbe Datengrenze, byte-gleich), dazu von Hand
 *     bearbeitete Dateien und das alte Kommatext-Format.
 *   - Das Menue: 19 `label.cf-lang-item > input[type=checkbox] + span`; das offene Dropdown ist
 *     198 px hoch, nur 4 Eintraege sind ohne Scrollen sichtbar — ans Ende gehaengte Haekchen
 *     saehe man erst nach etwa 650 px.
 *   - Offen (c), beim ✏️-Wechsel blieb das Menue offen: seit CHAR-HALBLADEN R4 (editChar() ruft
 *     vorab cancelCharEdit(), dessen clearCharLanguages() schliesst) am Basisstand dieser Datei
 *     schon erledigt; W11 haelt es trotzdem fest, weil R9 es zusaetzlich verlangt.
 *
 * DIE URSACHE (allein im Rundlauf des Formulars, features/party/party-crud.js):
 * setCharLanguages() setzt nur `checkbox.checked = langArray.includes(checkbox.value)` ueber die
 * 19 festen Haekchen — exakt verglichen, nichts anderes wird angezeigt oder gemerkt —, und fuer
 * alles Wahre ausser Liste ruft es `.split`. updateCharLanguages() baut das versteckte
 * select#char-languages ALLEIN aus den Haekchen, saveCharacter() liest es und schreibt per
 * `{...alt, ...ch}` ueber die alte Liste. Das Formularmodell ("19 feste Werte") ist kleiner als
 * das Datenmodell ("beliebige Liste oder Text"). Datengrenze und Reiter-Import liefern treu.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (VERTRAG SPRACHEN-FREI der Kritik; Nutzerentscheidung 03.11. "Anzeigen und
 * abwaehlbar", Unterentscheidungen nach Empfehlung: freie Haekchen OBEN; Schreibvarianten
 * gelten als die feste Sprache, Synonyme bleiben frei; Zahl und Wahrheitswert werden Text nach
 * datenText(), auch 0 und false; Speicherreihenfolge = Menuereihenfolge)
 *
 *   R1  Totaler Leser: Liste → Elemente; Text → split(','); null/undefined → []; JEDER andere
 *       Wert (auch 0, false, true, Zahl, Objekt) → [wert], kein Kurzschluss ueber
 *       Wahrheitswerte. Jedes Element durch datenText() (Objekt, Liste, null → '' → weg).
 *       Listenelemente werden NICHT zerlegt (Komma, Semikolon, Zeilenumbruch). Kein Laden wirft.
 *   R2  Normalform je Element: NFC, jede Leerraumfolge (auch NBSP, \n) ein Leerzeichen, trim;
 *       leer → weg. Freie Sprachen werden in dieser Normalform gespeichert.
 *   R3  Abgleich ohne Gross-/Kleinschreibung (toLocaleLowerCase('de')) gegen die value der
 *       Vorlagen-Haekchen ohne Frei-Markierung, zur Aufrufzeit aus dem DOM; ein Treffer setzt
 *       das FESTE Haekchen, gespeichert in der Schreibweise der Vorlage. Keine Synonyme (Common,
 *       Dwarvish, Gebaerdensprache, Riesisch bleiben frei).
 *   R4  Dubletten: gleicher Schluessel einmal, das erste Vorkommen gewinnt (samt Schreibweise).
 *   R5  Je freie Sprache ein label.cf-lang-item (data-frei) mit input[type=checkbox] (checked,
 *       data-action="update-char-languages") und span, OBEN vor den 19 festen, in der
 *       Reihenfolge des ersten Vorkommens; nur DOM-API (value =, textContent =), kein innerHTML,
 *       kein Selektor aus Daten. Die Ausloeser-Anzeige zaehlt freie mit.
 *   R6  saveCharacter() unveraendert; gespeichert wird genau, was angehakt ist, in
 *       Menue-Reihenfolge (freie zuerst, dann die Vorlage). Das erste ✏️ + 💾 sortiert also um
 *       (Bram → ['Kauderwelsch','Zwergisch'], Zed: 'Gemein' wandert ans Ende, Jon wie heute);
 *       jedes weitere aendert nichts (Idempotenz). Darum hier EXAKTE Arrays (MUSS-Einwand).
 *   R7  Abwaehlen: nicht gespeichert; bleibt sichtbar bis zum Leeren/Neuladen, wieder anhakbar.
 *   R8  Lebensdauer: setCharLanguages() entfernt ZUERST alle [data-frei] und setzt die festen
 *       zurueck; clearCharLanguages() entfernt sie auch. Nach jedem Laden 19 plus die freien
 *       des Helden, nach jedem Leeren genau 19.
 *   R9  Laden schliesst das Menue (setCharLanguages() nimmt `open` von #cf-languages-wrapper).
 *   R10 Umbruch: eine Regel in assets/styles/party.css (overflow-wrap: anywhere) — eine freie
 *       Sprache ohne Umbruchstelle erzeugt sonst seitlichen Seiten-Scroll (gemessen 203 px bei
 *       1440, 311 px bei 390).
 *   R11 Kein neuer globaler Name, kein Export; party-crud.d.ts: Parameter `unknown`.
 *   R12 Unberuehrt: Vorlage view-party.html, utils/basic.js (Datengrenze, datenText),
 *       utils/testable-utils.js, der Reiter-Import, features/encounters/*, party-details.js,
 *       ui/event-delegation.js.
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * DIE FAELLE (gemessen mit dieser Datei am Basisstand 5d28d85f — CHAR-HALBLADEN ist darunter
 * gelandet —, dev und prod gebaut, Chromium, --workers=3: 35 Faelle, 26 rot, 9 gruen; rot genau
 * die Fehlerfaelle, jeder an einer Zusage des Vertrags und keiner an einer Vorbedingung; gruen
 * die Kontrollen W3 Jon und Aria, W4, W5, W7 Mo, Nils und Ida, W11, W14)
 *
 *   W1   Bram, Kartenkopf, Menue auf: erster Eintrag ist das freie, angehakte "Kauderwelsch",
 *        sichtbar ohne Scrollen (im Rechteck des Dropdowns, obenauf); Ausloeser "Kauderwelsch,
 *        Zwergisch"; 💾 → D und Speicher === ['Kauderwelsch','Zwergisch']; zweites ✏️ + 💾
 *        unveraendert                                                              rot
 *   W2   Abwaehlen per Klick auf die Beschriftung: leer, weiter sichtbar, Ausloeser
 *        "Zwergisch"; an, ab; 💾 → ['Zwergisch']; ✏️ Bram → 19, kein [data-frei]     rot
 *   W3   Tabelle ✏️ (Kartenkopf) + 💾 + zweites ✏️ + 💾, exakte Arrays: Cora, Dorn, Kai, Eik,
 *        Fenn, Gus, Tex, Yan, Zed rot; Jon und Aria (nur feste Werte) gruen (Kontrollen)
 *   W4   ✏️ Zed → ✏️ Aria: genau 19, kein [data-frei], Gemein und Elfisch; 💾 →
 *        ['Gemein','Elfisch']                                                      gruen
 *        (Waechter gegen m1 "nur in clear entfernen" — am Bildschirm aber nur zusammen mit
 *        CHAR-HALBLADEN m6: editChar() leert seit R4 vorab ueber clearCharLanguages(); m1
 *        faengt U2 der Unit-Datei)
 *   W5   Leerwege nach ✏️ Bram: Abbrechen; Kopfzeile zu/auf; 💾 + Taste n; Palette "Neuer
 *        Charakter" aus den Quests; Import R7 "Ersetzen" ueber 📥 und den Dateidialog — je 19,
 *        keins gesetzt; ein neuer Held mit Gemein → ['Gemein']                     gruen
 *   W6   Lia ['<b>Fett</b>','Kauder"welsch',"O'Brien"]: drei freie Eintraege, value und Text
 *        woertlich, kein <b> im Dropdown, kein Fehler; 💾 byte-gleich               rot
 *   W7   Werte, die kein Text sind: Pia 7 → "7"; Vic true → "true"; Uwe {0:…,1:…} → offen,
 *        kein Eintrag; Hal ['Gemein',42,null,'',{x:1},['Elfisch'],true] → "42", "true" frei,
 *        Gemein fest; Ole false → "false"; Sam 0 → "0" (Unterentscheidung (3)) — je offen,
 *        kein Fehler, exakter Speicherwert                                          rot
 *        Kontrollen Mo (fehlt), Nils (null), Ida ('') → []                          gruen
 *   W8   Telefon 390x844 per Tap: W1 und W2                                         rot
 *   W9   prod-Buendel: W1 und W6 (ohne prod-Buendel uebersprungen)                 rot
 *   W10  Import R7 "Hinzufuegen" ueber 📥 und den Dateidialog mit ['Gemein','Kauderwelsch',
 *        ' zwergisch ','Gemein'], dann ✏️ + 💾 → ['Kauderwelsch','Gemein','Zwergisch']  rot
 *   W11  Offen (c) beim Laden: Menue auf → ✏️ Bram (Kartenkopf) → zu; Menue auf → 🔍 Rex →
 *        "✏️ Bearbeiten" → zu. "+ Angriff" und Escape bekommen KEINE Zusicherung (der
 *        Klassenbefund ist ein eigener Vorgang)                                    gruen
 *        (am Kopf c5bb6a1a rot; seit CHAR-HALBLADEN R4 erledigt, R9 sichert es doppelt)
 *   W12  Umbruch, 1440 mit Maus und 390 per Tap: Wim ['Gemein', 'Kauderwelsch' x 8]; die
 *        Anzeige nennt die lange Sprache, und mit Menue zu und auf hat das Dokument keinen
 *        seitlichen Ueberlauf, der Ausloeser liegt im Fenster                       rot
 *        (am Basisstand, weil nichts angezeigt wird; am Fix ohne R10 am Ueberlauf)
 *   W13  Tastatur: ✏️ Rex, Klick auf den Ausloeser, Tab → Fokus auf dem freien "Kauderwelsch";
 *        Leertaste → abgewaehlt, "Sprachen wählen..."; 💾 → []                       rot
 *   W14  (CHAR-HALBLADEN ist gelandet) ✏️ Zed → ✏️ Gil (`speed: 30`) → 💾 → Gil traegt genau
 *        seine Sprache ['Gemein'], keine von Zed. Der Vertrag nennt ihn Gus; hier Gil, weil W3
 *        den Namen Gus fuer ['Common','Dwarvish'] traegt                           gruen
 *
 * Die Einzelheiten ohne Bildschirmweg (die Normalisierungstabelle an der Funktion, A dann B
 * direkt, clearCharLanguages(), Markup, kein Wurf, R9 an der Funktion) stehen in
 * tests/unit/sprachen-frei.test.js (U1–U6).
 *
 * DIE GEGENPROBEN (Kopien ausserhalb des Repos, nicht eingecheckt: `git archive 5d28d85f`, darin
 * party-crud.js und party.css nach R1–R10 woertlich, dev und prod frisch gebaut; die Mutanten
 * als Abwandlung NUR von setCharLanguages() im dev-Buendel bzw. in party-crud.js, m10 nur die
 * CSS-Regel; gefahren mit dieser Datei, held-altdaten.spec.js und den Unit-Dateien):
 *
 *   fix  R1–R10 woertlich        diese Datei 35 von 35, held-altdaten 74 von 74 gruen (dev und
 *                                prod); sprachen-frei.test.js 44, held-laden.test.js 201,
 *                                avatar-vorschau.test.js und avatars.test.js gruen
 *   m1   freie nur in clear       am Bildschirm ALLES gruen (101, prod uebersprungen) — editChar()
 *        entfernt                 leert seit CHAR-HALBLADEN R4 vorab; rot nur U2 "A, dann B"
 *   m2   ohne NFC                 W3 Kai; U1 Kai
 *   m3   Bau per innerHTML        W6 (kein Element aus dem Markup, Werte, 💾); U1 Lia, U4
 *   m4   mit Gross-/Kleinschr.    W3 Cora und Eik; U1 Cora, GEBÄRDEN, Eik, "erstes Vorkommen"
 *   m5   freie unten              W1, W8 (W1) und (W2) an "oben/sichtbar"; U1 19 Zeilen, U2
 *   m6   Listenelemente an        W3 Tex und Zed; U1 Tex und Zed
 *        Kommas zerlegt
 *   m7   `languages ? … : []`     W7 Ole und Sam; U1 Ole und Sam
 *   m8   String(w) statt          W7 Hal und Uwe, held-altdaten HA1+HA2 und HA3 bei languages als
 *        datenText()              Objekt; U1 Uwe, Hal, ['x',[1],null], held-laden HL1 Objekt
 *   m9   ohne R9                  W11 gruen (CHAR-HALBLADEN R4 schliesst schon); rot nur U6
 *   m10  ohne R10 (CSS)           W12 1440 und 390, je Menue zu und auf (seitlicher Ueberlauf)
 *
 * WIE GEURTEILT WIRD: am Menue (jedes Haekchen mit Wert, Text, Haken, Frei-Markierung und
 * `.selected`, die Ausloeser-Anzeige, das versteckte select, offen/zu), an D und am Speicher.
 * Bedient wird nur mit Klicks, Tasten und Taps (am Telefon mit 450 ms Abstand: die 300-ms-Sperre
 * in initTouchOptimizations()); `evaluate` nur zum Ablesen, gesaet wird vor dem Laden (einmal
 * je Tab). Fehler: pageerror, console.error (ohne "Failed to load resource") und das Fehlerlog
 * der App. Weich sind die Zusagen des Vertrags (ein roter Lauf nennt jede gebrochene), hart nur
 * die Vorbedingungen (die Saat ueberlebt das Laden, das Formular laedt den Helden).
 *
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD: "+ Angriff" und Escape bei offenem Menue, das offene
 * Menue im Entwurf nach Kopfzeile zu und die uebrigen Aussenklick-Lauscher (Klassenbefund (c),
 * eigener Vorgang); das Encounter-Formular (ENC-SPRACHEN); die 🔍-Detailanzeige der Rohdaten
 * (party-details.js); 320 px (das Identitaets-Panel laeuft schon am Kopf 37 px ueber); Zeichen
 * ohne Breite (U+200B) werden nicht normalisiert; Firefox.
 */

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const APP_URL_PROD = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-optimized.html`;
/** Der CI-Job `e2e` baut nur dev; den prod-Fall gibt es nur mit `python build.py --production`
 *  (Muster aus bild-lokal.spec.js (W8)). */
const PROD_DA = fs.existsSync(path.join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));
const PROD_GRUND =
    'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)';

const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };
const SPEICHER = 'dnd-tracker-v4';
/** Zeit nach einer Bedienung fuer Zeichnen und verzoegerte Aufrufe. */
const SETZEN = 250;
/** Abstand vor jedem Tipper (> 300 ms Sperre in initTouchOptimizations()). */
const TIPP_ABSTAND = 450;
/** `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;
/** Die Anzeige ohne Auswahl (updateCharLanguages(), unveraendert nach R5). */
const LEER_ANZEIGE = 'Sprachen wählen...';
/** Die 19 Werte der Vorlage, in ihrer Reihenfolge (assets/templates/view-party.html). */
const FEST = [
    'Gemein',
    'Zwergisch',
    'Elfisch',
    'Riese',
    'Gnomisch',
    'Goblin',
    'Halbling',
    'Orkisch',
    'Druidisch',
    'Diebessprache',
    'Drakonisch',
    'Tiefensprache',
    'Infernal',
    'Sylvan',
    'Unterreich',
    'Abyssisch',
    'Celestisch',
    'Gebärden',
    'Primordial'
];

/** Weiche Zusicherungen fuer die Zusagen des Vertrags. */
const weich = expect.configure({ soft: true });

// ===========================================================================
// SAAT
// ===========================================================================

/** Geschuetztes Leerzeichen (U+00A0) — als Code, damit es im Quelltext sichtbar bleibt. */
const NBSP = String.fromCharCode(0xa0);
/** Kombinierendes Trema (U+0308): 'a' + TREMA ist NFD-ä. */
const TREMA = String.fromCharCode(0x308);
/** 'Gebärden' in NFC, ä als EIN Zeichen (U+00E4). */
const GEBAERDEN_NFC = 'Geb' + String.fromCharCode(0xe4) + 'rden';
/** Eine Sprache mit Kommas als EIN Listenelement (R1: nicht zerlegen). */
const LANG_MIT_KOMMAS =
    'Telepathie auf 36 m, nur mit Kreaturen, die mindestens eine Sprache verstehen und sehen';
/** 96 Zeichen ohne Umbruchstelle (W12, R10). */
const LANG_OHNE_UMBRUCH = 'Kauderwelsch'.repeat(8);
/** Markiert ein Feld, das FEHLEN soll. */
const FEHLT = '__fehlt__';

/**
 * Ein Held — `speed` als Text, wie die App ihn schreibt; `languages` wie gegeben (FEHLT: ohne
 * das Feld).
 * @param {number} id @param {string} name @param {any} languages @param {object} [extra]
 */
function held(id, name, languages, extra = {}) {
    /** @type {Record<string, any>} */
    const h = {
        id,
        name,
        playerName: '',
        characterClass: 'Kämpfer',
        subclass: '',
        race: 'Mensch',
        level: 1,
        background: '',
        alignment: '',
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        saveProficiencies: {},
        hpCurrent: 10,
        hpMax: 10,
        tempHp: 0,
        armorClass: 12,
        initiative: 0,
        speed: '9m|30ft.',
        hitDice: '1d10',
        passivePerception: 10,
        inspiration: false,
        resistances: [],
        immunities: [],
        spellSlots: {},
        currency: { pm: 0, gm: 0, em: 0, sm: 0, km: 0 },
        notes: '',
        avatar: '',
        conditions: [],
        spells: [],
        items: [],
        ...extra
    };
    if (languages !== FEHLT) h.languages = languages;
    return h;
}

const ARIA = held(1, 'Aria', ['Gemein', 'Elfisch']);
const BRAM = held(2, 'Bram', ['Zwergisch', 'Kauderwelsch']);
const CORA = held(3, 'Cora', ['zwergisch', 'ELFISCH']);
const DORN = held(4, 'Dorn', [' Elfisch ', 'Gemein' + NBSP]);
const EIK = held(5, 'Eik', ['Gemein', 'Gemein', 'Kauderwelsch', 'kauderwelsch']);
const FENN = held(6, 'Fenn', 'Gemein, Kauderwelsch, , Elfisch');
const GUS = held(7, 'Gus', ['Common', 'Dwarvish']);
const HAL = held(8, 'Hal', ['Gemein', 42, null, '', { x: 1 }, ['Elfisch'], true]);
const JON = held(9, 'Jon', ['Elfisch', 'Gemein', 'Zwergisch', 'Riese']);
const KAI = held(10, 'Kai', ['Geba' + TREMA + 'rden']);
const LIA = held(11, 'Lia', ['<b>Fett</b>', 'Kauder"welsch', "O'Brien"]);
const PIA = held(12, 'Pia', 7);
const REX = held(13, 'Rex', ['Kauderwelsch']);
const SAM = held(14, 'Sam', 0);
const TEX = held(15, 'Tex', ['Gemein, Elfisch']);
const UWE = held(16, 'Uwe', { 0: 'Gemein', 1: 'Elfisch' });
const VIC = held(17, 'Vic', true);
const OLE = held(18, 'Ole', false);
const YAN = held(19, 'Yan', 'Gemein\nElfisch');
const ZED = held(20, 'Zed', [
    'Gemein',
    LANG_MIT_KOMMAS,
    'Kauderwelsch',
    'Sumpfsprache',
    'Altelfisch'
]);
const MO = held(21, 'Mo', FEHLT);
const NILS = held(22, 'Nils', null);
const IDA = held(23, 'Ida', '');
/** W14: `speed` als Zahl (App-Altform), seit CHAR-HALBLADEN E3 ohne Wurf. */
const GIL = held(24, 'Gil', ['Gemein'], { speed: 30 });
const WIM = held(25, 'Wim', ['Gemein', LANG_OHNE_UMBRUCH]);

/** @param {object[]} characters */
function saat(characters) {
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
        shops: [],
        campaign: {},
        characters,
        npcs: [],
        locations: [],
        quests: [],
        loot: [],
        spells: [],
        wiki: [],
        links: [],
        filters: [],
        factions: [],
        tags: [],
        sessionNotes: [],
        encounters: [],
        bestiary: [],
        bestiaryFavorites: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: Math.max(0, ...characters.map(c => /** @type {any} */ (c).id)) + 1,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1,
            filters: 1,
            factions: 1,
            bestiary: 1
        }
    };
}

// ===========================================================================
// LADEN, FEHLER
// ===========================================================================

/**
 * Laedt, saet EINMAL je Tab und faengt jeden Fehler vom Laden an (pageerror, console.error,
 * das Fehlerlog der App). Vorbedingung: die Sprachen der Saat kommen byte-gleich in D an (die
 * Datengrenze bleibt unberuehrt, R12 — sonst waere es keine Probe).
 * @param {import('@playwright/test').Page} page
 * @param {object[]} characters
 * @param {{ url?: string, telefon?: boolean }} [opt]
 */
async function laden(page, characters, opt = {}) {
    /** @type {string[]} */
    const fehler = [];
    await page.route(/^https?:/i, r => r.abort());
    page.on('pageerror', e => fehler.push('pageerror: ' + String(e.message).split('\n')[0]));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0].slice(0, 200));
        }
    });
    if (!opt.telefon) await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (sessionStorage.getItem('sprachen-frei-gesaet')) return;
                localStorage.setItem(schluessel, JSON.stringify(s));
                sessionStorage.setItem('sprachen-frei-gesaet', '1');
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng
            }
        },
        /** @type {[string, any]} */ ([SPEICHER, saat(characters)])
    );
    await page.goto(opt.url || APP_URL);
    if (opt.telefon) {
        await page.waitForFunction(
            () => document.documentElement.dataset.appReady === 'true',
            null,
            { timeout: 20000 }
        );
    } else {
        await waitForAppReady(page);
    }
    await page.waitForTimeout(300);
    const inD = await page.evaluate(
        fehlt =>
            // @ts-ignore
            (window.D?.characters || []).map(c => ({
                id: c.id,
                languages: c.languages === undefined ? fehlt : c.languages
            })),
        FEHLT_D
    );
    expect(
        inD,
        'Vorbedingung: die Sprachen der Saat kommen byte-gleich in D an (Datengrenze, R12)'
    ).toEqual(
        characters.map(c => {
            const h = /** @type {Record<string, any>} */ (c);
            return { id: h.id, languages: h.languages === undefined ? FEHLT_D : h.languages };
        })
    );
    return {
        /** @returns {Promise<string[]>} */
        async alle() {
            const log = await page.evaluate(() =>
                // @ts-ignore
                (window.ErrorHandler?.getRecentErrors?.(50) || []).map(
                    /** @param {any} e */ e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
                )
            );
            return [...fehler, ...log];
        }
    };
}
/** Platzhalter fuer ein fehlendes Feld beim Vergleich (in evaluate als Text eingesetzt). */
const FEHLT_D = '(fehlt)';

/** @typedef {Awaited<ReturnType<typeof laden>>} Beobachtung */

// ===========================================================================
// BEDIENUNG
// ===========================================================================

/** @typedef {(ziel: import('@playwright/test').Locator) => Promise<void>} Bedien */

/**
 * Klick, am Telefon Tipper mit Abstand.
 * @param {import('@playwright/test').Page} page @param {boolean} tap
 * @returns {Bedien}
 */
function bedienung(page, tap) {
    return async ziel => {
        if (tap) {
            await page.waitForTimeout(TIPP_ABSTAND);
            await ziel.tap();
        } else {
            await ziel.click();
        }
        await page.waitForTimeout(SETZEN);
    };
}

/**
 * Mitte eines Elements und ob dort wirklich es selbst obenauf liegt (bild-lokal.spec.js).
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
 * Reiter ueber die ECHTE Navigation (zuReiter() in bild-lokal.spec.js). Telefon: vorher den
 * Umzugshinweis per Tap wegnehmen, Leiste per Tap aus- und wieder einfahren.
 * @param {import('@playwright/test').Page} page @param {string} ansicht
 */
async function zuReiter(page, ansicht) {
    const reiterSel = `.nav-tab[data-view="${ansicht}"]`;
    const mobil = await page.evaluate(() => document.documentElement.dataset.layout === 'mobile');
    if (mobil) {
        const hinweis = page.locator('#migration-hint-banner');
        if (await hinweis.isVisible()) {
            await page.waitForTimeout(TIPP_ABSTAND);
            await hinweis.locator('[data-action="close-migration-hint"]').tap();
            await expect(hinweis).toBeHidden();
        }
        await page.waitForTimeout(TIPP_ABSTAND);
        const u = await mitteFrei(page, '.mobile-nav-toggle');
        expect(u && u.frei, 'Vorbedingung: der Umschalter der Leiste ist frei').toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (u).x, /** @type {any} */ (u).y);
        await page.waitForTimeout(TIPP_ABSTAND);
        await page.locator(reiterSel).scrollIntoViewIfNeeded();
        let m = null;
        for (let i = 0; i < 40; i++) {
            m = await mitteFrei(page, reiterSel);
            if (m && m.frei) break;
            await page.waitForTimeout(150);
        }
        expect(m && m.frei, `Vorbedingung: der Reiter ${ansicht} ist frei`).toBe(true);
        await page.touchscreen.tap(/** @type {any} */ (m).x, /** @type {any} */ (m).y);
        await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
        await page.waitForTimeout(TIPP_ABSTAND);
        const offen = await page.evaluate(() => !!document.querySelector('.app-header.nav-open'));
        if (offen) {
            const u2 = await mitteFrei(page, '.mobile-nav-toggle');
            await page.touchscreen.tap(/** @type {any} */ (u2).x, /** @type {any} */ (u2).y);
            await page.waitForTimeout(TIPP_ABSTAND);
        }
        return;
    }
    const tab = page.locator(reiterSel).first();
    if (!(await tab.isVisible())) {
        await page.locator('.nav-group', { has: tab }).locator('.nav-group-btn').click();
    }
    await tab.click();
    await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(SETZEN);
}

/** @param {import('@playwright/test').Page} page @param {number} id */
const kartenkopf = (page, id) =>
    page.locator(`#party-list .char-card-header[data-id="${id}"] .char-card-meta`);
/** Die Kopfzeile "+ Charakter hinzufuegen" ueber ihren PLATZ (bild-lokal.spec.js).
 *  @param {import('@playwright/test').Page} page */
const kopfzeile = page => page.locator('#view-party .card:has(> #char-form) > .collapsible-header');
/** @param {import('@playwright/test').Page} page */
const formular = page => page.locator('#char-form');
/** @param {import('@playwright/test').Page} page */
const speichernKnopf = page =>
    formular(page).getByRole('button', { name: 'Speichern', exact: true });
/** @param {import('@playwright/test').Page} page */
const abbrechenKnopf = page =>
    formular(page).getByRole('button', { name: 'Abbrechen', exact: true });
/** Der Ausloeser des Sprachmenues. @param {import('@playwright/test').Page} page */
const ausloeser = page => page.locator('#cf-languages-wrapper .cf-lang-trigger');
/**
 * Ein Eintrag des Sprachmenues ueber seinen sichtbaren Text (die Beschriftung, die man
 * anklickt).
 * @param {import('@playwright/test').Page} page @param {string} text
 */
const eintrag = (page, text) =>
    page.locator('#cf-lang-dropdown .cf-lang-item').filter({ hasText: new RegExp(`^${text}$`) });

/** @param {import('@playwright/test').Page} page */
function bearbeitenId(page) {
    return page.evaluate(
        () => /** @type {HTMLInputElement|null} */ (document.getElementById('edit-char-id'))?.value
    );
}

/**
 * ✏️ ueber den Kartenkopf. Gibt zurueck, ob das Formular danach offen mit diesem Helden steht —
 * OHNE das zu erzwingen: bei einem Laden, das wirft (am Basisstand languages 7, true, Objekt),
 * soll der Fall an der Zusage rot werden, nicht an einer Vorbedingung.
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {number} id
 */
async function bearbeiten(page, bedien, id) {
    await bedien(kartenkopf(page, id));
    return page.evaluate(
        i =>
            !!document.getElementById('char-form')?.classList.contains('open') &&
            /** @type {HTMLInputElement} */ (document.getElementById('edit-char-id')).value ===
                String(i),
        id
    );
}

/**
 * ✏️ ueber den Kartenkopf, mit dem Laden als Vorbedingung (fuer Helden, die am Basisstand
 * laden).
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {number} id
 */
async function bearbeitenGeladen(page, bedien, id) {
    await bedien(kartenkopf(page, id));
    await expect(formular(page), `Vorbedingung: ✏️ ${id} oeffnet das Formular`).toHaveClass(
        /\bopen\b/
    );
    await expect
        .poll(() => bearbeitenId(page), { message: `Vorbedingung: ✏️ ${id}` })
        .toBe(String(id));
}

/** Menue auf per Klick bzw. Tipper auf den Ausloeser (Vorbedingung: danach offen).
 *  @param {import('@playwright/test').Page} page @param {Bedien} bedien */
async function menueAuf(page, bedien) {
    await bedien(ausloeser(page));
    await expect(
        page.locator('#cf-languages-wrapper'),
        'Vorbedingung: das Sprachmenue ist auf'
    ).toHaveClass(/\bopen\b/);
}

/**
 * Befehlspalette → Befehl (bild-lokal.spec.js). Enter fuehrt den obersten Treffer aus.
 * @param {import('@playwright/test').Page} page @param {string} text
 */
async function palette(page, text) {
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type(text);
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText(text);
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
    await page.waitForTimeout(SETZEN);
}

// --- Import R7: 📤 als Vorlage, 📥 mit dem Dateidialog (bild-lokal.spec.js (W10)) ----------
/**
 * Der echte 📤-Export der Party als Vorlage einer Importdatei.
 * @param {import('@playwright/test').Page} page
 */
async function partyExportieren(page) {
    const knopf = page.locator('#view-party .io-btn.export[data-value="characters"]');
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        knopf.click()
    ]);
    const json = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(
        Array.isArray(json?.data) && json.data.length > 0,
        'Vorbedingung: der 📤-Export liefert Eintraege'
    ).toBe(true);
    return json;
}

/**
 * 📥 → Dateidialog → Datei → Fenster → Modus → "Importieren".
 * @param {import('@playwright/test').Page} page
 * @param {object} inhalt die Datei, wie der 📤-Export sie schreibt
 * @param {'merge'|'replace'} modus
 */
async function partyImportieren(page, inhalt, modus) {
    const knopf = page.locator('#view-party .io-btn.import[data-value="import-characters"]');
    const [waehler] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        knopf.click()
    ]);
    await waehler.setFiles({
        name: 'characters-Andere-Runde.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(inhalt, null, 2), 'utf8')
    });
    await expect(page.locator('#import-modal'), 'Vorbedingung: das Import-Fenster').toBeVisible();
    const radio = page.locator(`#import-modal input[name="import-mode"][value="${modus}"]`);
    const beschriftung = modus === 'merge' ? 'Hinzufügen' : 'Ersetzen';
    if (await radio.isVisible()) await radio.check();
    else await page.locator('#import-modal label', { hasText: beschriftung }).click();
    await expect(radio, `Vorbedingung: Modus "${beschriftung}" gewaehlt`).toBeChecked();
    await page.locator('#import-modal [data-action="execute-import"]').click();
    await expect(page.locator('#import-modal'), 'Vorbedingung: das Fenster ist zu').toBeHidden();
    await page.waitForTimeout(SETZEN);
}

/** Die IDs der Karten nach Namen — nur Ablesen. @param {import('@playwright/test').Page} page */
function kartenIds(page) {
    return page.evaluate(() =>
        Object.fromEntries(
            [...document.querySelectorAll('#party-list .char-card')].map(k => [
                (k.querySelector('.char-card-name')?.textContent || '')
                    .replace(/[⭐☆⋮]/g, '')
                    .trim(),
                Number(/** @type {HTMLElement} */ (k).dataset.id)
            ])
        )
    );
}

// ===========================================================================
// ABLESEN
// ===========================================================================

/**
 * Das Sprachmenue, wie es steht — jedes Haekchen (Wert, Text der Beschriftung, Haken,
 * Frei-Markierung, `.selected`), die Ausloeser-Anzeige, das versteckte select (was 💾 liest),
 * offen/zu, und ob ein Element aus Markup im Dropdown steht.
 * @param {import('@playwright/test').Page} page
 */
function menue(page) {
    return page.evaluate(() => {
        const dd = /** @type {HTMLElement} */ (document.getElementById('cf-lang-dropdown'));
        const eintraege = [...dd.querySelectorAll('input[type="checkbox"]')].map(el => {
            const cb = /** @type {HTMLInputElement} */ (el);
            const label = cb.closest('.cf-lang-item');
            return {
                wert: cb.value,
                text: label ? label.textContent : null,
                an: cb.checked,
                frei: !!cb.closest('#cf-lang-dropdown [data-frei]'),
                markiert: !!label && label.classList.contains('selected')
            };
        });
        const select = /** @type {HTMLSelectElement} */ (document.getElementById('char-languages'));
        return {
            menueOffen: !!document
                .getElementById('cf-languages-wrapper')
                ?.classList.contains('open'),
            eintraege,
            beschriftungen: dd.querySelectorAll('.cf-lang-item').length,
            freiMarken: dd.querySelectorAll('[data-frei]').length,
            anzeige: (document.getElementById('cf-lang-display')?.textContent || '').trim(),
            auswahl: [...select.options].filter(o => o.selected).map(o => o.value),
            markup: dd.querySelectorAll('b, i, script, img, a').length
        };
    });
}

/** @typedef {Awaited<ReturnType<typeof menue>>} Menue */

/** Gesetzte Haekchen in Menue-Reihenfolge. @param {Menue} m */
const gesetzt = m => m.eintraege.filter(e => e.an).map(e => e.wert);
/** Freie Eintraege, "[x] Wert" bzw. "[ ] Wert". @param {Menue} m */
const freie = m => m.eintraege.filter(e => e.frei).map(e => `${e.an ? '[x]' : '[ ]'} ${e.wert}`);
/** Gesetzte feste Haekchen. @param {Menue} m */
const festGesetzt = m => m.eintraege.filter(e => !e.frei && e.an).map(e => e.wert);

/**
 * Was der Ausloeser zu einer Auswahl zeigt — die Logik von updateCharLanguages(), die R5
 * unveraendert laesst.
 * @param {string[]} auswahl
 */
function anzeigeZu(auswahl) {
    if (auswahl.length === 0) return LEER_ANZEIGE;
    if (auswahl.length <= 3) return auswahl.join(', ');
    return `${auswahl.slice(0, 2).join(', ')} +${auswahl.length - 2}`;
}

/**
 * Die Zusagen an ein geladenes Menue: freie Eintraege OBEN in der erwarteten Reihenfolge und
 * gesetzt, danach genau die 19 festen in Vorlagenreihenfolge mit den erwarteten Haken, `.selected`
 * wie der Haken, der Wert = die Beschriftung, Ausloeser und verstecktes select = die Auswahl.
 * @param {Menue} m @param {string[]} frei @param {string[]} fest @param {string} wo
 */
function menueUrteil(m, frei, fest, wo) {
    weich(
        m.eintraege.map(e => e.wert),
        `${wo}: die Eintraege — ${frei.length} freie OBEN, dann die 19 der Vorlage (R5, R8)`
    ).toEqual([...frei, ...FEST]);
    weich(freie(m), `${wo}: die freien Eintraege, gesetzt (R5)`).toEqual(frei.map(s => `[x] ${s}`));
    weich(festGesetzt(m), `${wo}: die gesetzten festen Haekchen (R3)`).toEqual(fest);
    weich(
        m.eintraege.filter(e => e.markiert !== e.an || e.text !== e.wert).map(e => e.wert),
        `${wo}: jeder Eintrag zeigt seinen Wert, .selected folgt dem Haken (R5)`
    ).toEqual([]);
    const auswahl = [...frei, ...fest];
    weich(
        { anzeige: m.anzeige, auswahl: m.auswahl },
        `${wo}: Ausloeser und verstecktes select = die Auswahl, freie zuerst (R5, R6)`
    ).toEqual({ anzeige: anzeigeZu(auswahl), auswahl });
}

/**
 * Das leere Menue nach einem Leerweg: genau 19 Eintraege, keiner frei, keiner gesetzt (R8).
 * @param {import('@playwright/test').Page} page @param {string} wo
 */
async function leerUrteil(page, wo) {
    const m = await menue(page);
    weich(
        {
            eintraege: m.eintraege.map(e => e.wert),
            freiMarken: m.freiMarken,
            gesetzt: gesetzt(m),
            anzeige: m.anzeige,
            auswahl: m.auswahl
        },
        `${wo}: genau die 19 der Vorlage, keiner gesetzt (R8)`
    ).toEqual({ eintraege: FEST, freiMarken: 0, gesetzt: [], anzeige: LEER_ANZEIGE, auswahl: [] });
}

/**
 * Wo das freie Haekchen steht: im Rechteck des Dropdowns, ohne dessen Scrollen, im Fenster und
 * obenauf an seiner Mitte (W1, R5 OBEN).
 * @param {import('@playwright/test').Page} page @param {string} wert
 */
function freiSichtbar(page, wert) {
    return page.evaluate(w => {
        const dd = /** @type {HTMLElement} */ (document.getElementById('cf-lang-dropdown'));
        const cb = [...dd.querySelectorAll('[data-frei] input, input[data-frei]')].find(
            e => /** @type {HTMLInputElement} */ (e).value === w
        );
        const label = cb?.closest('.cf-lang-item');
        if (!label) return { gefunden: false };
        const r = label.getBoundingClientRect();
        const d = dd.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const oben = document.elementFromPoint(x, y);
        return {
            gefunden: true,
            dropdownSichtbar: dd.checkVisibility(),
            ungescrollt: dd.scrollTop === 0,
            imDropdown:
                r.top >= d.top - 1 &&
                r.bottom <= d.bottom + 1 &&
                r.left >= d.left - 1 &&
                r.right <= d.right + 1,
            imFenster: r.top >= 0 && r.bottom <= window.innerHeight,
            obenauf: !!oben && label.contains(oben)
        };
    }, wert);
}
const SICHTBAR = {
    gefunden: true,
    dropdownSichtbar: true,
    ungescrollt: true,
    imDropdown: true,
    imFenster: true,
    obenauf: true
};

/**
 * Die Sprachen eines Helden in D und im Speicher (JSON-Abzug; `(fehlt)` ohne Feld).
 * @param {import('@playwright/test').Page} page @param {number} id
 */
function sprachen(page, id) {
    return page.evaluate(([k, i]) => {
        // @ts-ignore
        const c = (window.D?.characters || []).find(x => x && x.id === i);
        let s;
        try {
            const d = JSON.parse(localStorage.getItem(String(k)) || '{}');
            s = (d.characters || []).find(/** @param {any} x */ x => x && x.id === i);
        } catch {
            s = undefined;
        }
        /** @param {any} h */
        const l = h => (h ? (h.languages === undefined ? '(fehlt)' : h.languages) : '(kein Held)');
        return { d: JSON.parse(JSON.stringify(l(c))), speicher: l(s) };
    }, /** @type {[string, number]} */ ([SPEICHER, id]));
}

/**
 * 💾 klicken bzw. tippen, warten, bis das Formular zu ist und der Speicher D gleicht; gibt die
 * Sprachen in D und im Speicher zurueck.
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {number} id
 */
async function speichern(page, bedien, id) {
    await bedien(speichernKnopf(page));
    await expect(formular(page), 'Vorbedingung: 💾 schliesst das Formular').not.toHaveClass(
        /\bopen\b/
    );
    await expect
        .poll(
            async () => {
                const s = await sprachen(page, id);
                return JSON.stringify(s.d) === JSON.stringify(s.speicher);
            },
            { timeout: SOFORT_MS, message: '💾 landet im Speicher' }
        )
        .toBe(true);
    return sprachen(page, id);
}

/**
 * ✏️ + 💾 ohne Aenderung, ZWEIMAL: das erste muss `soll` ergeben, das zweite darf nichts aendern
 * (R6 Idempotenz). Gibt das Menue nach dem ersten ✏️ zurueck.
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {number} id
 * @param {string[]} soll @param {string} wo
 */
async function rundlauf(page, bedien, id, soll, wo) {
    const offen = await bearbeiten(page, bedien, id);
    weich(offen, `${wo}: ✏️ oeffnet das Formular mit dem Helden (R1: kein Laden wirft)`).toBe(true);
    const m = await menue(page);
    if (!offen) return m;
    const erst = await speichern(page, bedien, id);
    weich(erst, `${wo}: 💾 → D und Speicher, exakt (R6)`).toEqual({ d: soll, speicher: soll });
    const zweitOffen = await bearbeiten(page, bedien, id);
    if (!zweitOffen) return m;
    const zweit = await speichern(page, bedien, id);
    weich(zweit, `${wo}: zweites ✏️ + 💾 aendert nichts (R6 Idempotenz)`).toEqual(erst);
    return m;
}

/** Kein Fehler vom Laden an (pageerror, console.error, Fehlerlog der App).
 *  @param {Beobachtung} beob @param {string} wo */
async function ohneFehler(beob, wo) {
    weich(await beob.alle(), `${wo}: kein Fehler — pageerror, console.error, Fehlerlog`).toEqual(
        []
    );
}

/**
 * Seitlicher Ueberlauf und Lage des Ausloesers (W12, R10).
 * @param {import('@playwright/test').Page} page
 */
function geometrie(page) {
    return page.evaluate(() => {
        const se = /** @type {Element} */ (document.scrollingElement);
        const t = /** @type {HTMLElement} */ (
            document.querySelector('#cf-languages-wrapper .cf-lang-trigger')
        ).getBoundingClientRect();
        return {
            seitlicherUeberlauf: se.scrollWidth - se.clientWidth,
            ausloeserImFenster: t.left >= 0 && t.right <= window.innerWidth
        };
    });
}

// ===========================================================================
// ABLAEUFE, je fuer Maus und Tap
// ===========================================================================

/**
 * (W1) Bram: das freie Haekchen steht oben, sichtbar, und bleibt beim 💾 erhalten.
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {string} wo
 */
async function ablaufW1(page, bedien, wo) {
    await zuReiter(page, 'party');
    await bearbeitenGeladen(page, bedien, BRAM.id);
    await menueAuf(page, bedien);
    const m = await menue(page);
    weich(
        m.eintraege[0],
        `${wo}: der ERSTE Eintrag ist das freie, angehakte "Kauderwelsch"`
    ).toEqual({ wert: 'Kauderwelsch', text: 'Kauderwelsch', an: true, frei: true, markiert: true });
    weich(
        await freiSichtbar(page, 'Kauderwelsch'),
        `${wo}: "Kauderwelsch" ist ohne Scrollen sichtbar (R5 OBEN)`
    ).toEqual(SICHTBAR);
    menueUrteil(m, ['Kauderwelsch'], ['Zwergisch'], `${wo}, Menue`);
    weich(m.anzeige, `${wo}: der Ausloeser nennt beide`).toBe('Kauderwelsch, Zwergisch');
    const erst = await speichern(page, bedien, BRAM.id);
    const soll = ['Kauderwelsch', 'Zwergisch'];
    weich(erst, `${wo}: 💾 → D und Speicher, exakt (R6)`).toEqual({ d: soll, speicher: soll });
    await bearbeitenGeladen(page, bedien, BRAM.id);
    const zweit = await speichern(page, bedien, BRAM.id);
    weich(zweit, `${wo}: zweites ✏️ + 💾 aendert nichts (R6 Idempotenz)`).toEqual(erst);
}

/**
 * (W2) Bram: "Kauderwelsch" ab, an, ab — bleibt sichtbar; 💾 → ['Zwergisch']; beim naechsten ✏️
 * kein freies Haekchen.
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {string} wo
 */
async function ablaufW2(page, bedien, wo) {
    await zuReiter(page, 'party');
    await bearbeitenGeladen(page, bedien, BRAM.id);
    await menueAuf(page, bedien);
    const ziel = eintrag(page, 'Kauderwelsch');
    const anzahl = await ziel.count();
    weich(anzahl, `${wo}: es gibt einen Eintrag "Kauderwelsch" zum Abwaehlen (R5)`).toBe(1);
    if (anzahl !== 1) return;
    /** @param {boolean} an @param {string} schritt */
    const stand = async (an, schritt) => {
        const m = await menue(page);
        weich(
            {
                kauderwelsch: freie(m),
                sichtbar: await freiSichtbar(page, 'Kauderwelsch'),
                anzeige: m.anzeige,
                auswahl: m.auswahl
            },
            `${wo}, ${schritt} (R7)`
        ).toEqual({
            kauderwelsch: [`${an ? '[x]' : '[ ]'} Kauderwelsch`],
            sichtbar: SICHTBAR,
            anzeige: an ? 'Kauderwelsch, Zwergisch' : 'Zwergisch',
            auswahl: an ? ['Kauderwelsch', 'Zwergisch'] : ['Zwergisch']
        });
    };
    await bedien(ziel);
    await stand(false, 'abgewaehlt: leer, weiter sichtbar');
    await bedien(ziel);
    await stand(true, 'wieder angehakt');
    await bedien(ziel);
    await stand(false, 'wieder abgewaehlt');
    const d = await speichern(page, bedien, BRAM.id);
    weich(d, `${wo}: 💾 → ['Zwergisch'] (R7)`).toEqual({
        d: ['Zwergisch'],
        speicher: ['Zwergisch']
    });
    await bearbeitenGeladen(page, bedien, BRAM.id);
    menueUrteil(await menue(page), [], ['Zwergisch'], `${wo}, ✏️ Bram danach`);
}

/**
 * (W6) Lia: Markup und Anfuehrungszeichen woertlich, kein Element daraus; 💾 byte-gleich.
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {string} wo
 */
async function ablaufW6(page, bedien, wo) {
    await zuReiter(page, 'party');
    const offen = await bearbeiten(page, bedien, LIA.id);
    weich(offen, `${wo}: ✏️ Lia oeffnet das Formular`).toBe(true);
    const m = await menue(page);
    menueUrteil(m, LIA.languages, [], wo);
    weich(m.markup, `${wo}: kein Element aus dem Markup im Dropdown (R5)`).toBe(0);
    if (!offen) return;
    const d = await speichern(page, bedien, LIA.id);
    weich(d, `${wo}: 💾 → byte-gleich`).toEqual({ d: LIA.languages, speicher: LIA.languages });
}

// ===========================================================================
// FAELLE
// ===========================================================================

test.describe('SPRACHEN-FREI — Sprachen ausserhalb der festen Liste bleiben beim ✏️ + 💾', () => {
    test.describe.configure({ timeout: 120000 });

    test.describe('1440x900, Maus und Tastatur, dev', () => {
        test.use({ viewport: BREIT });

        test('(W1) Bram: das freie "Kauderwelsch" steht oben, angehakt und sichtbar; 💾 → [Kauderwelsch, Zwergisch], zweimal gleich', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, BRAM]);
            await ablaufW1(page, bedienung(page, false), '(W1)');
            await ohneFehler(beob, '(W1)');
        });

        test('(W2) Bram: "Kauderwelsch" abwaehlen bleibt sichtbar und ist rueckholbar; 💾 → [Zwergisch]; danach kein freies Haekchen', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, BRAM]);
            await ablaufW2(page, bedienung(page, false), '(W2)');
            await ohneFehler(beob, '(W2)');
        });

        /**
         * (W3) Held, freie Eintraege (oben, in dieser Reihenfolge), gesetzte feste, und was
         * ✏️ + 💾 speichert — exakt (R6).
         * @type {Array<[string, Record<string, any>, string[], string[]]>}
         */
        const TABELLE = [
            ['Cora: Gross-/Kleinschreibung (R3)', CORA, [], ['Zwergisch', 'Elfisch']],
            ['Dorn: Leerraum und NBSP (R2)', DORN, [], ['Gemein', 'Elfisch']],
            ['Kai: NFD (R2), gespeichert in NFC', KAI, [], ['Gebärden']],
            ['Eik: Dubletten (R4)', EIK, ['Kauderwelsch'], ['Gemein']],
            ['Fenn: Text mit leerem Eintrag (R1)', FENN, ['Kauderwelsch'], ['Gemein', 'Elfisch']],
            ['Gus: keine Uebersetzung (R3)', GUS, ['Common', 'Dwarvish'], []],
            ['Tex: Listenelement mit Komma nicht zerlegt (R1)', TEX, ['Gemein, Elfisch'], []],
            ['Yan: Zeilenumbruch wird Leerzeichen (R2)', YAN, ['Gemein Elfisch'], []],
            [
                'Zed: vier freie, "Gemein" wandert ans Ende (R6)',
                ZED,
                [LANG_MIT_KOMMAS, 'Kauderwelsch', 'Sumpfsprache', 'Altelfisch'],
                ['Gemein']
            ],
            [
                'Jon: nur feste Werte, umsortiert wie heute (Kontrolle)',
                JON,
                [],
                ['Gemein', 'Zwergisch', 'Elfisch', 'Riese']
            ],
            ['Aria: schon normal (Kontrolle)', ARIA, [], ['Gemein', 'Elfisch']]
        ];
        for (const [titel, h, frei, fest] of TABELLE) {
            test(`(W3) ${titel}`, async ({ page }) => {
                const beob = await laden(page, [ARIA, h.id === ARIA.id ? BRAM : h]);
                const bedien = bedienung(page, false);
                await zuReiter(page, 'party');
                const wo = `(W3) ${h.name}`;
                const soll = [...frei, ...fest];
                const m = await rundlauf(page, bedien, h.id, soll, wo);
                menueUrteil(m, frei, fest, `${wo}, nach ✏️`);
                if (h === KAI) {
                    weich(
                        m.auswahl.map(s => [...s].map(z => z.codePointAt(0)?.toString(16))),
                        `${wo}: "Gebärden" in NFC (ä als ein Zeichen U+00E4)`
                    ).toEqual([[...GEBAERDEN_NFC].map(z => z.codePointAt(0)?.toString(16))]);
                }
                await ohneFehler(beob, wo);
            });
        }

        test('(W4) ✏️ Zed → ✏️ Aria direkt: genau 19 Eintraege, kein freier, Gemein und Elfisch; 💾 → [Gemein, Elfisch]', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, ZED]);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            await bearbeitenGeladen(page, bedien, ZED.id);
            await bearbeitenGeladen(page, bedien, ARIA.id);
            const m = await menue(page);
            weich(
                { beschriftungen: m.beschriftungen, freiMarken: m.freiMarken },
                '(W4) nach ✏️ Aria: genau 19 Eintraege, keiner frei (R8)'
            ).toEqual({ beschriftungen: 19, freiMarken: 0 });
            menueUrteil(m, [], ['Gemein', 'Elfisch'], '(W4) nach ✏️ Aria');
            const d = await speichern(page, bedien, ARIA.id);
            weich(d, '(W4) 💾 Aria').toEqual({
                d: ['Gemein', 'Elfisch'],
                speicher: ['Gemein', 'Elfisch']
            });
            await ohneFehler(beob, '(W4)');
        });

        test('(W5) Leerwege nach ✏️ Bram — Abbrechen, Kopfzeile zu/auf, 💾 + Taste n, Palette, Import "Ersetzen" — hinterlassen 19 leere Haekchen; ein neuer Held mit Gemein → [Gemein]', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, BRAM]);
            const bedien = bedienung(page, false);
            const offen = /\bopen\b/;
            await zuReiter(page, 'party');

            // Abbrechen
            await bearbeitenGeladen(page, bedien, BRAM.id);
            await bedien(abbrechenKnopf(page));
            await expect(formular(page)).not.toHaveClass(offen);
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(offen);
            await leerUrteil(page, '(W5) ✏️ Bram → Abbrechen → Kopfzeile auf');
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(offen);

            // Kopfzeile zu und auf (verwirft den Bearbeiten-Rest, ABBRUCH R1)
            await bearbeitenGeladen(page, bedien, BRAM.id);
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(offen);
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(offen);
            await leerUrteil(page, '(W5) ✏️ Bram → Kopfzeile zu und auf');
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(offen);

            // 💾, dann Taste n
            await bearbeitenGeladen(page, bedien, BRAM.id);
            await speichern(page, bedien, BRAM.id);
            await page.keyboard.press('n');
            await page.waitForTimeout(SETZEN);
            await expect(formular(page)).toHaveClass(offen);
            await leerUrteil(page, '(W5) ✏️ Bram → 💾 → Taste n');
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(offen);

            // Reiter Quests, Palette "Neuer Charakter"
            await bearbeitenGeladen(page, bedien, BRAM.id);
            await zuReiter(page, 'quests');
            await palette(page, 'Neuer Charakter');
            await expect(page.locator('#view-party')).toHaveClass(/\bactive\b/);
            await expect(formular(page)).toHaveClass(offen);
            await leerUrteil(page, '(W5) ✏️ Bram → Reiter Quests → Palette "Neuer Charakter"');
            await bedien(kopfzeile(page));
            await expect(formular(page)).not.toHaveClass(offen);

            // Import R7 "Ersetzen" bei offenem ✏️ Bram
            const vorlage = await partyExportieren(page);
            const aria = vorlage.data.find(/** @param {any} c */ c => Number(c?.id) === ARIA.id);
            const datei = { ...vorlage, data: [{ ...aria, name: 'Quirin' }] };
            await bearbeitenGeladen(page, bedien, BRAM.id);
            await partyImportieren(page, datei, 'replace');
            await expect(formular(page), 'Vorbedingung: "Ersetzen" klappt zu').not.toHaveClass(
                offen
            );
            await bedien(kopfzeile(page));
            await expect(formular(page)).toHaveClass(offen);
            await leerUrteil(page, '(W5) ✏️ Bram → Import "Ersetzen" → Kopfzeile auf');

            // Ein neuer Held mit Gemein
            await bedien(page.locator('#char-name'));
            await page.keyboard.type('Neu');
            await menueAuf(page, bedien);
            await bedien(eintrag(page, 'Gemein'));
            const vorher = Object.values(await kartenIds(page));
            await bedien(speichernKnopf(page));
            await expect(formular(page)).not.toHaveClass(offen);
            const ids = await kartenIds(page);
            expect(Object.keys(ids).sort(), 'Vorbedingung: der neue Held ist angelegt').toEqual([
                'Neu',
                'Quirin'
            ]);
            expect(vorher.includes(ids.Neu), 'Vorbedingung: Neu hat eine neue ID').toBe(false);
            await expect
                .poll(async () => (await sprachen(page, ids.Neu)).speicher)
                .toEqual(['Gemein']);
            weich(await sprachen(page, ids.Neu), '(W5) der neue Held mit Gemein').toEqual({
                d: ['Gemein'],
                speicher: ['Gemein']
            });
            await ohneFehler(beob, '(W5)');
        });

        test('(W6) Lia: Markup und Anfuehrungszeichen stehen woertlich als freie Eintraege, kein Element daraus; 💾 byte-gleich', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, LIA]);
            await ablaufW6(page, bedienung(page, false), '(W6)');
            await ohneFehler(beob, '(W6)');
        });

        /**
         * (W7) Held, freie Eintraege, gesetzte feste — Werte, die kein Text sind (R1,
         * Unterentscheidung (3): Zahl und Wahrheitswert werden Text, auch 0 und false).
         * @type {Array<[string, Record<string, any>, string[], string[]]>}
         */
        const KEIN_TEXT = [
            ['Pia: 7 → "7"', PIA, ['7'], []],
            ['Vic: true → "true"', VIC, ['true'], []],
            ['Uwe: Objekt → kein Eintrag', UWE, [], []],
            [
                'Hal: gemischte Liste → "42", "true" frei, Gemein fest',
                HAL,
                ['42', 'true'],
                ['Gemein']
            ],
            ['Ole: false → "false" (kein Kurzschluss)', OLE, ['false'], []],
            ['Sam: 0 → "0" (kein Kurzschluss)', SAM, ['0'], []],
            ['Mo: fehlt → [] (Kontrolle)', MO, [], []],
            ['Nils: null → [] (Kontrolle)', NILS, [], []],
            ["Ida: '' → [] (Kontrolle)", IDA, [], []]
        ];
        for (const [titel, h, frei, fest] of KEIN_TEXT) {
            test(`(W7) ${titel}`, async ({ page }) => {
                const beob = await laden(page, [ARIA, h]);
                const bedien = bedienung(page, false);
                await zuReiter(page, 'party');
                const wo = `(W7) ${h.name}`;
                const m = await rundlauf(page, bedien, h.id, [...frei, ...fest], wo);
                menueUrteil(m, frei, fest, `${wo}, nach ✏️`);
                await ohneFehler(beob, wo);
            });
        }

        test('(W10) Import R7 "Hinzufuegen" ueber 📥 mit [Gemein, Kauderwelsch, " zwergisch ", Gemein]: ✏️ + 💾 → [Kauderwelsch, Gemein, Zwergisch]', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, BRAM]);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            const vorlage = await partyExportieren(page);
            const aria = vorlage.data.find(/** @param {any} c */ c => Number(c?.id) === ARIA.id);
            const roh = ['Gemein', 'Kauderwelsch', ' zwergisch ', 'Gemein'];
            const datei = { ...vorlage, data: [{ ...aria, name: 'Quinn', languages: roh }] };
            await partyImportieren(page, datei, 'merge');
            const ids = await kartenIds(page);
            expect(ids.Quinn, 'Vorbedingung: Quinn ist importiert').toBeGreaterThan(0);
            expect(
                (await sprachen(page, ids.Quinn)).d,
                'Vorbedingung: der Import uebernimmt die Sprachen woertlich (R12)'
            ).toEqual(roh);
            const wo = '(W10) Quinn';
            const m = await rundlauf(
                page,
                bedien,
                ids.Quinn,
                ['Kauderwelsch', 'Gemein', 'Zwergisch'],
                wo
            );
            menueUrteil(m, ['Kauderwelsch'], ['Gemein', 'Zwergisch'], `${wo}, nach ✏️`);
            await ohneFehler(beob, wo);
        });

        test('(W11) Offen (c) beim Laden: Menue auf → ✏️ Bram (Kartenkopf) bzw. 🔍 Rex → "✏️ Bearbeiten" — das Menue ist zu', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, BRAM, REX]);
            const bedien = bedienung(page, false);
            const huelle = page.locator('#cf-languages-wrapper');
            await zuReiter(page, 'party');
            await bearbeitenGeladen(page, bedien, ARIA.id);
            await menueAuf(page, bedien);
            await bearbeitenGeladen(page, bedien, BRAM.id);
            await weich(
                huelle,
                '(W11) nach ✏️ Bram (Kartenkopf) ist das Menue zu (R9)'
            ).not.toHaveClass(/\bopen\b/);
            await menueAuf(page, bedien);
            await bedien(page.locator(`#char-${REX.id} [data-action="show-char-details"]`));
            await expect(page.locator('#char-detail-modal')).toHaveClass(/\bshow\b/);
            await bedien(page.locator('#char-detail-modal [data-action="edit-char-from-modal"]'));
            await expect(page.locator('#char-detail-modal')).not.toHaveClass(/\bshow\b/);
            await expect
                .poll(() => bearbeitenId(page), { message: 'Vorbedingung: ✏️ Rex' })
                .toBe(String(REX.id));
            await weich(
                huelle,
                '(W11) nach 🔍 Rex → "✏️ Bearbeiten" ist das Menue zu (R9)'
            ).not.toHaveClass(/\bopen\b/);
            await ohneFehler(beob, '(W11)');
        });

        test('(W12) Umbruch, 1440: eine freie Sprache ohne Umbruchstelle wird angezeigt und schiebt die Seite nicht seitlich, Menue zu und auf', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, WIM]);
            await ablaufW12(page, bedienung(page, false), '(W12) 1440');
            await ohneFehler(beob, '(W12) 1440');
        });

        test('(W13) Tastatur: ✏️ Rex, Klick auf den Ausloeser, Tab → das freie "Kauderwelsch"; Leertaste → abgewaehlt; 💾 → []', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, REX]);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            await bearbeitenGeladen(page, bedien, REX.id);
            await menueAuf(page, bedien);
            await page.keyboard.press('Tab');
            const fokus = await page.evaluate(() => {
                const a = /** @type {HTMLInputElement|null} */ (document.activeElement);
                return {
                    art: a ? `${a.tagName} ${a.getAttribute('type') || ''}` : '-',
                    wert: a?.value ?? null,
                    frei: !!a?.closest('#cf-lang-dropdown [data-frei]')
                };
            });
            weich(
                fokus,
                '(W13) Tab nach dem Ausloeser: Fokus auf dem freien "Kauderwelsch"'
            ).toEqual({
                art: 'INPUT checkbox',
                wert: 'Kauderwelsch',
                frei: true
            });
            await page.keyboard.press('Space');
            await page.waitForTimeout(SETZEN);
            const m = await menue(page);
            weich(
                { freie: freie(m), gesetzt: gesetzt(m), anzeige: m.anzeige },
                '(W13) Leertaste: "Kauderwelsch" abgewaehlt, nichts anderes gesetzt (R7)'
            ).toEqual({ freie: ['[ ] Kauderwelsch'], gesetzt: [], anzeige: LEER_ANZEIGE });
            const d = await speichern(page, bedien, REX.id);
            weich(d, '(W13) 💾 → []').toEqual({ d: [], speicher: [] });
            await ohneFehler(beob, '(W13)');
        });

        test('(W14) CHAR-HALBLADEN gelandet: ✏️ Zed → ✏️ Gil (speed 30) → 💾 — Gil traegt nur seine Sprache', async ({
            page
        }) => {
            const beob = await laden(page, [ARIA, ZED, GIL]);
            const bedien = bedienung(page, false);
            await zuReiter(page, 'party');
            await bearbeitenGeladen(page, bedien, ZED.id);
            await bearbeitenGeladen(page, bedien, GIL.id);
            menueUrteil(await menue(page), [], ['Gemein'], '(W14) nach ✏️ Gil');
            const d = await speichern(page, bedien, GIL.id);
            weich(d, '(W14) 💾 Gil: genau ["Gemein"], keine Sprache von Zed').toEqual({
                d: ['Gemein'],
                speicher: ['Gemein']
            });
            await ohneFehler(beob, '(W14)');
        });
    });

    // =======================================================================
    // (W8) und (W12) Telefon 390x844, per Tap
    // =======================================================================
    test.describe('Telefon 390x844, per Tap', () => {
        test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

        test('(W8) = (W1) per Tap', async ({ page }) => {
            const beob = await laden(page, [ARIA, BRAM], { telefon: true });
            await ablaufW1(page, bedienung(page, true), '(W8) Telefon (W1)');
            await ohneFehler(beob, '(W8) Telefon (W1)');
        });

        test('(W8) = (W2) per Tap', async ({ page }) => {
            const beob = await laden(page, [ARIA, BRAM], { telefon: true });
            await ablaufW2(page, bedienung(page, true), '(W8) Telefon (W2)');
            await ohneFehler(beob, '(W8) Telefon (W2)');
        });

        test('(W12) Umbruch, 390 per Tap', async ({ page }) => {
            const beob = await laden(page, [ARIA, WIM], { telefon: true });
            await ablaufW12(page, bedienung(page, true), '(W12) 390');
            await ohneFehler(beob, '(W12) 390');
        });
    });

    // =======================================================================
    // (W9) prod-Buendel
    // =======================================================================
    test.describe('(W9) prod-Buendel, 1440x900', () => {
        test.use({ viewport: BREIT });

        test('(W9) = (W1) am prod-Buendel', async ({ page }) => {
            test.skip(!PROD_DA, PROD_GRUND);
            const beob = await laden(page, [ARIA, BRAM], { url: APP_URL_PROD });
            await ablaufW1(page, bedienung(page, false), '(W9) prod (W1)');
            await ohneFehler(beob, '(W9) prod (W1)');
        });

        test('(W9) = (W6) am prod-Buendel', async ({ page }) => {
            test.skip(!PROD_DA, PROD_GRUND);
            const beob = await laden(page, [ARIA, LIA], { url: APP_URL_PROD });
            await ablaufW6(page, bedienung(page, false), '(W9) prod (W6)');
            await ohneFehler(beob, '(W9) prod (W6)');
        });
    });
});

/**
 * (W12) Wim: die lange freie Sprache steht in der Anzeige, und weder mit Menue zu noch auf
 * laeuft das Dokument seitlich ueber; der Ausloeser bleibt im Fenster (R10).
 * @param {import('@playwright/test').Page} page @param {Bedien} bedien @param {string} wo
 */
async function ablaufW12(page, bedien, wo) {
    await zuReiter(page, 'party');
    await bearbeitenGeladen(page, bedien, WIM.id);
    const m = await menue(page);
    weich(m.anzeige, `${wo}: die Anzeige nennt die lange freie Sprache (R5)`).toBe(
        `${LANG_OHNE_UMBRUCH}, Gemein`
    );
    weich(await geometrie(page), `${wo}, Menue zu: kein seitlicher Ueberlauf (R10)`).toEqual({
        seitlicherUeberlauf: 0,
        ausloeserImFenster: true
    });
    await menueAuf(page, bedien);
    weich(await geometrie(page), `${wo}, Menue auf: kein seitlicher Ueberlauf (R10)`).toEqual({
        seitlicherUeberlauf: 0,
        ausloeserImFenster: true
    });
}
