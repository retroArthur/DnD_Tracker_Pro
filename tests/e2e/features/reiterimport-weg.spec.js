// @ts-check
/**
 * Der Weg des Reiter-Imports: 📥 → EIN Dateidialog → Fenster (REITERIMPORT)
 * =========================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer im Reiter auf 📥
 * drueckt und eine Datei waehlt, sieht GENAU EINEN Dateidialog und danach das
 * Import-Fenster — auch wenn er laenger als fuenf Sekunden im Dialog war, auch
 * beim zweiten Mal mit derselben Datei; wer abbricht (im Dialog oder im
 * Fenster), hat nichts geaendert und keine Erfolgsmeldung gesehen; und die
 * Erfolgsmeldung kommt erst, wenn geschrieben ist, mit deutschem Typnamen.**
 *
 * Vertrag REITERIMPORT, docs/bugfixes.md — diese Datei prueft R1, R2 und
 * R10. Feldtreue, Verweise, Pruefung kaputter Dateien, Undo und Sicherheit
 * (R3–R9) pruefen eigene Dateien. Der Branch REITERIMPORT setzt auf SENKEN
 * auf (8702f84a, Ausgabe kodiert, Datengrenze an jedem Eingang); am
 * Rot-Nachweis zu a9858d23 war das Fehlerbild dieser Datei dort dasselbe wie
 * am Buendel 020e258 unten.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu 020e258, 1440x900 und 390x844, echte Klicks und
 * Dateiwahl, alle 12 Reiter mit 📥:
 *
 *   📥 → Datei waehlen        importData() liest die gewaehlte Datei NICHT,
 *                             sondern haengt ein ZWEITES, namenloses
 *                             <input type=file> an <body> und klickt es
 *   zweiten Dialog bedienen   gruen "✅ Datei validiert: 2 Einträge bereit" —
 *                             und sonst nichts: `#import-modal` gibt es im
 *                             Buendel nicht (seit der TS-Migration Jan. 2026
 *                             baut es niemand), D, Speicher und `_rev`
 *                             unveraendert
 *   im zweiten Dialog         die Datei aus Dialog 2 zaehlt, die aus Dialog 1
 *   eine andere Datei         nicht
 *   laenger als ~5 s im       der zweite Dialog wird von Chromium STILL
 *   ersten Dialog             blockiert ("File chooser dialog can only be
 *                             shown with a user activation." nur in der
 *                             Konsole) — keine Meldung, gar nichts; das
 *                             namenlose Feld bleibt im <body>
 *   dieselbe Datei nochmal    `#import-<typ>.value` wird nie geleert → kein
 *                             `change` → keine Rueckmeldung, gar nichts
 *   leere Auswahl             der zweite Dialog oeffnet trotzdem; sein Feld
 *                             bleibt als Leiche im <body>
 *   Encounter, Zauber         `accept=".json,.csv"` — der Dialog bietet CSV
 *                             an, das der Import nie lesen kann
 *
 * DIE URSACHEN stehen in `systems/spellslots/import-export.js`: importData()
 * ruft showImportModal(), das ein eigenes Datei-Feld baut und `click()` ruft
 * — ein Dateidialog braucht in Chromium transiente Nutzeraktivierung, und
 * die ist nach ~5 s abgelaufen; die gewaehlte Datei des Reiterfelds wird nie
 * gelesen und sein `value` nie zurueckgesetzt; die gruene Meldung steht VOR
 * dem (fehlenden) Fenster.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag REITERIMPORT), die diese Datei prueft
 *
 *   R1  Je Import genau EIN Dateidialog, die dort gewaehlte Datei zaehlt (1);
 *       auch wer laenger als 5 s im Dialog bleibt, kommt ins Fenster (2);
 *       danach bleibt kein namenloses Datei-Feld im Dokument (1, 2, 4);
 *       dieselbe Datei zweimal → beide Male das Fenster (3: nach ✕ UND nach
 *       "Importieren"); Abbrechen der Dateiwahl → keine Meldung, nichts
 *       geaendert (4). Das `accept` der Felder ist nur `.json` (10; CSV ist
 *       nicht Teil dieses Vertrags).
 *   R2  Erfolgsmeldung erst nach dem Schreiben, "… importiert (hinzugefügt|
 *       ersetzt)", deutscher Typname, richtiger Numerus; vor dem Fenster
 *       hoechstens neutrale Hinweise, d. h. nur `info`/`warning` (8); der
 *       deutsche Typname fuer JEDEN der 12 Typen (13). Abbrechen im Fenster →
 *       nichts geschrieben, keine Erfolgsmeldung (5 ✕, 6 "Abbrechen", 7
 *       Escape).
 *   R10 Ein Typ am Telefon, 390x844, mit dem Finger: 📥 → Datei → Fenster →
 *       Importieren (9). Escape schliesst ohne Import, der Fokus kehrt zum
 *       📥 zurueck — und stand vorher im Fenster, sonst kehrt er nicht
 *       zurueck, sondern blieb nur liegen (7).
 *   Kontrolle (11): `fileChooser.setFiles()` traegt Aktivierung mit — darum
 *       faehrt (2) den rohen CDP-Weg.
 *   Waechter (12): jeder der 12 Reiter behaelt ein sichtbares, erreichbares
 *       📥, dessen Klick genau seinen eigenen Dateidialog oeffnet; die
 *       Typliste kommt aus dem Buendel, nicht aus einem Literal.
 *
 * DER OBERFLAECHEN-VERTRAG, den die Faelle bedienen (das Fenster gibt es am
 * Stand 020e258 nicht): `#import-modal` mit Vorschau `#import-info`,
 * `input[name="import-mode"]` mit `value="merge"` ("Hinzufügen") und
 * `value="replace"` ("Ersetzen"), Knopf `[data-action="execute-import"]`
 * mit Text "Importieren", Abbrechen ueber ✕, "Abbrechen" und Escape. Das
 * 📥 wird ueber seinen sichtbaren Text in der Ansicht gesucht, nicht ueber
 * `data-action` — wie es das Feld oeffnet, entscheidet der Fix.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WIE DIE FAELLE DATEIEN WAEHLEN — UND WARUM UEBER PFADE
 *
 * Jede Datei liegt auf der Platte (`test.info().outputPath()`) und wird als
 * PFAD gewaehlt. Gemessen (Playwright 1.57, Chromium): ein Puffer an
 * `setFiles()` loest `change` IMMER aus, auch fuer dieselbe Datei — ein
 * Pfad geht ueber `DOM.setFileInputFiles` und verhaelt sich wie der echte
 * Dialog (dieselbe Datei → `cancel`, kein `change`). Mit Puffern waere (3)
 * gegen einen Fix ohne Zuruecksetzen von `value` gruen.
 * Die Vorlage jeder Datei ist der ECHTE 📤-Export desselben Reiters; geaendert
 * werden nur Namen bzw. Titel und die Zahl der Eintraege. So traegt die Datei,
 * was der Export des Fixes schreibt (Vertrag R4: Formatkennung), und kein Fall
 * wird an einer Pruefung rot, die er nicht meint.
 *
 * Bietet die App nach der Wahl einen WEITEREN Dialog an (heute: immer),
 * bedient ihn der Fall so, wie ein Nutzer es heute muesste — mit derselben
 * Datei, in (1) mit einem Koeder, in (4) wieder leer. Nur so erreicht ein
 * HALBER Fix (Fenster zurueck, sonst wie heute) ueberhaupt das Fenster, und
 * jeder Fall wird an SEINER Zusage rot statt an einem haengenden Dialog: (1)
 * am Koeder, (3) am zweiten Mal (nach ✕), (5)–(7) an der gruenen
 * "validiert"-Meldung vor dem Fenster, (8) daran und am Typnamen
 * "characters", (13) an den internen Schluesseln im Meldungstext. Nur (9)
 * laesst einen zweiten Dialog liegen: seine Zusage IST "eine Datei →
 * Fenster".
 *
 * WARUM (2) ROH UEBER CDP: Playwrights `fileChooser.setFiles()` verschafft
 * der Seite Nutzeraktivierung (Kontrolle (11): `isActive` true nach 6 s).
 * Damit oeffnete der zweite Dialog in jeder bisherigen Messung — der Defekt
 * war unsichtbar. (2) setzt die Datei nach 6 s per `DOM.setFileInputFiles`
 * auf ein per `Runtime.evaluate` (`userGesture: false`) geholtes Feld, wie es
 * ein Nutzer erlebt, der im Dialog sucht; ob `isActive` im `change` wirklich
 * false ist, prueft (2) als Vorbedingung. Gemessen am Stand 020e258: bei
 * ~4,3 s noch aktiv, bei ~5,8 s nicht mehr.
 *
 * Die Reiter oeffnet jeder Fall per `switchView()` (Vorbereitung, wie in
 * `npc-formular.spec.js`); gemessen wird der Weg ab 📥. `evaluate` dient
 * sonst nur der Saat und dem Auslesen — in (8) haengt ein lesender Haken an
 * `window.pushCombatLog` (showToast() ruft es ueber `window.`), der zu jeder
 * Meldung festhaelt, was in dem Moment in D stand.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei)
 *
 * Gegen das unveraenderte Buendel sind (1)–(10) und (13) rot, (11) und (12)
 * gruen. Gegen Kopien des Buendels mit einem statischen `#import-modal` nach
 * dem Vertrag (✕, Radios, "Abbrechen", "Importieren") und je einem halben
 * oder teilweisen Fix dahinter — rot wurden, jeder an seiner Zusage:
 *
 *   nur das Fenster, Datenpfad wie heute     (1)–(10), (13)
 *     (der HALBE Fix)
 *   dazu "validiert" nur noch als `info`     (1)–(4), (8)–(10), (13); (5)–(7)
 *                                            gruen — ihr R2-Teil ist erfuellt,
 *                                            die zwei Dialoge zaehlt (1)
 *   Dateiweg repariert (Reiterfeld gelesen,  (5)–(9), (13)
 *     `value` geleert, `.json`), Meldungen
 *     wie heute
 *   voller Fix                               keiner — alle 13 gruen
 *   … `value` nur nach "Importieren" leeren  (3) — vor der ✕-Runde war er gruen
 *   … Meldung VOR dem Schreiben              (8)
 *   … Numerus immer Mehrzahl                 (8)
 *   … deutsche Namen nur fuer vier Typen     (13) — vorher alle gruen
 *   … Fenster nur per Klasse `show`, ohne    (7) — vor der Fokus-Zeile gruen
 *     showModal()
 *   … leere Auswahl meldet sich              (4)
 *   … Abbruch der Dateiwahl meldet sich      (4)
 *   … `accept` unveraendert                  (10)
 *   … `value` nie leeren                     (3)
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Inhalt und Warnungen der Vorschau, Feldtreue (R4), Verweise (R5),
 * Ersetzen-Regeln (R6), kaputte Dateien und die Typ-Rueckfrage (R3), offene
 * Formulare (R7), Liste/Zaehler/Undo/Neuladen (R8), Nutzlasten (R9) — eigene
 * Dateien. Den Numerus nur an Charakter (Einzahl), Orte und Quests
 * (Mehrzahl); fuer alle zwoelf Typen prueft (13) nur, dass die Meldung den
 * internen Schluessel nicht nennt. Ein echter Betriebssystem-Dialog ist in
 * Playwright nicht zu haben; dass seine Wahl keine Aktivierung verschafft,
 * ist die Folgerung, auf der (2) steht. Firefox misst `isActive` dort nicht
 * aussagekraeftig.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — alle 12 📥 stehen ohne Rollen im Bild. */
const BREIT = { width: 1440, height: 900 };
/** Das Telefon — Fall (9). */
const TELEFON = { width: 390, height: 844 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Wie lange ein Fenster nach der Dateiwahl hoechstens braucht. Der Import
 *  liest eine Datei von wenigen hundert Byte per FileReader — Millisekunden;
 *  die drei Sekunden sind Luft fuer einen langsamen Rechner, kein Warten
 *  auf etwas, das kommen soll. */
const FENSTER_MS = 3000;

/** Fuer Zusicherungen auf das Fenster NACH dateiWaehlen(): das hat schon bis
 *  zu FENSTER_MS gewartet. */
const GEWARTET = { timeout: 500 };

/** Laenger als die transiente Nutzeraktivierung von Chromium (5 s;
 *  gemessen: ~4,3 s noch aktiv, ~5,8 s nicht mehr). Fall (2), (11). */
const LANGE_IM_DIALOG_MS = 6000;

/** Wie lange "nichts geschrieben" beobachtet wird: das Dreifache der
 *  Entprellung von `save()`. */
const STILLE_MS = 1000;

/** Je ein Eintrag fuer die acht Reiter, die nur (13) braucht: dort wird jeder
 *  der zwoelf Typen einmal exportiert und wieder hinzugefuegt. Die Formen
 *  sind die "B"-Eintraege aus `reiterimport-daten.spec.js`, ohne Verweise. */
const SAAT_UEBRIGE = {
    encounters: [
        {
            id: 1,
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
    spells: [
        {
            id: 1,
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
    ],
    wiki: [
        {
            id: 1,
            title: 'Goetter',
            category: 'lore',
            content: '<p>Pantheon</p>',
            tags: [],
            pinned: false,
            parentId: null,
            createdAt: 1700000000002,
            updatedAt: 1700000000003
        }
    ],
    links: [
        {
            id: 1,
            title: 'Weltkarte',
            url: 'https://example.org/karte',
            category: 'maps',
            description: ''
        }
    ],
    sessionPreps: [
        {
            id: 1,
            strongStart: '<p>Verrat im Kontor</p>',
            szenen: [],
            geheimeHinweise: '',
            wichtigeNpcs: '',
            belohnungen: '',
            sessionNr: 4,
            datum: '2026-10-08',
            inGameDatum: '',
            offeneFaeden: [],
            links: [],
            erstellt: 1700000000001
        }
    ],
    calendarEvents: [
        {
            id: 1,
            datum: { tag: 10, monat: 2, jahr: 1492 },
            titel: 'Sonnenfinsternis',
            beschreibung: '',
            typ: 'reise',
            quelleId: null
        }
    ],
    factions: [
        {
            id: 1,
            name: 'Schattenhand',
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
        }
    ]
};

/** Eine Kampagne, in der jeder Fall seinen Reiter mit zwei Eintraegen
 *  vorfindet — genug fuer "hinzufuegen" (2 → 4) und "ersetzen" (2 → 1).
 *  Vollstaendig nach `validateDataIntegrity()`, damit kein Reparatur-save()
 *  einen `_rev`-Vergleich stoert (siehe `tests/e2e/helpers/test-utils.js`).
 *  Mit `alleTypen` (nur (13), das keinen `_rev` vergleicht) zusaetzlich je
 *  ein Eintrag in den acht uebrigen Reitern.
 *  @param {boolean} [alleTypen] */
function saat(alleTypen = false) {
    const s = saatGrund();
    if (!alleTypen) return s;
    const { calendarEvents, ...rest } = SAAT_UEBRIGE;
    Object.assign(s, structuredClone(rest));
    s.calendar = { day: 1, month: 1, year: 1492, events: structuredClone(calendarEvents) };
    for (const typ of Object.keys(SAAT_UEBRIGE)) {
        /** @type {Record<string, number>} */ (s._nextId)[typ] = 2;
    }
    return s;
}

function saatGrund() {
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
        characters: [
            {
                id: 1,
                name: 'Aria',
                level: 3,
                hpMax: 24,
                hpCurrent: 24,
                armorClass: 15,
                spells: [],
                items: [],
                attributes: { str: 10, dex: 14, con: 12, int: 10, wis: 13, cha: 8 }
            },
            {
                id: 2,
                name: 'Borin',
                level: 4,
                hpMax: 38,
                hpCurrent: 30,
                armorClass: 17,
                spells: [],
                items: [],
                attributes: { str: 16, dex: 10, con: 15, int: 9, wis: 11, cha: 10 }
            }
        ],
        npcs: [
            {
                id: 1,
                name: 'Volo Geddarm',
                role: 'Schriftsteller',
                race: 'Mensch',
                description: '',
                locationId: null,
                chapter: '',
                filterId: null,
                quests: [],
                info: [],
                relationships: [],
                triggers: [],
                dialogs: [],
                relations: []
            },
            {
                id: 2,
                name: 'Manshoon',
                role: 'Händler',
                race: 'Mensch',
                description: '',
                locationId: null,
                chapter: '',
                filterId: null,
                quests: [],
                info: [],
                relationships: [],
                triggers: [],
                dialogs: [],
                relations: []
            }
        ],
        locations: [
            { id: 1, name: 'Tiefwasser', description: '', filterId: null },
            { id: 2, name: 'Niewinter', description: '', filterId: null }
        ],
        quests: [
            { id: 1, title: 'Drachenjagd', description: '', type: 'main', completed: false },
            { id: 2, title: 'Schatzsuche', description: '', type: 'side', completed: false }
        ],
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
        _nextId: {
            characters: 3,
            npcs: 3,
            locations: 3,
            quests: 3,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            links: 1,
            sessionNotes: 1,
            randomTables: 1,
            filters: 1,
            factions: 1,
            sessionPreps: 1,
            calendarEvents: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App. "Failed to load resource" ist
 * Netzrauschen (Schriften unter file://). Ein Rueckfrage-Dialog
 * (`confirm`/`alert`) wird bestaetigt, wie ein Nutzer es taete, und
 * mitgezaehlt: auf diesem Weg mit Dateien des richtigen Typs sieht der
 * Vertrag keinen vor — das Fenster IST die Rueckfrage.
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
        fehler.push(`dialog(${d.type()}): ${d.message().replace(/\n+/g, ' | ')}`);
        d.accept().catch(() => {});
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

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/**
 * Laedt breit, saet EINMAL je Tab (sessionStorage-Sperre: ein Neuladen
 * liest, was die App gespeichert hat) und oeffnet den Reiter von `typ`.
 * @param {import('@playwright/test').Page} page
 * @param {string|null} typ
 * @param {boolean} [alleTypen] siehe saat()
 */
async function laden(page, typ, alleTypen = false) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('reiterimport-weg-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('reiterimport-weg-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, saat(alleTypen)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst ein `_rev`-Vergleich sie
    // mit: repariert `load()` die Saat, schreibt `saveAutomatic()` etwa 1,4 s
    // spaeter den ganzen Stand (siehe npc-formular.spec.js). Erkennbar daran,
    // dass `_version` der Saat ueberschrieben wird; kommt binnen 4 s keine,
    // steht auch keine aus (bei der Grundsaat gemessen: binnen 8 s nach dem
    // Laden kein Schreiben, `_version` bleibt "99.0.0").
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
    return typ ? reiterOeffnen(page, typ) : null;
}

/** Die Ansicht (`data-view`), in der das Importfeld von `typ` liegt — aus
 *  dem Buendel gelesen, nicht aus einer Tabelle.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
function ansichtVon(page, typ) {
    return page.evaluate(
        t =>
            document
                .querySelector(`.io-file-input[data-on-change="importData"][data-type="${t}"]`)
                ?.closest('.view')
                ?.id?.replace(/^view-/, '') ?? null,
        typ
    );
}

/** Oeffnet den Reiter von `typ` (Vorbereitung) und gibt seine Ansicht zurueck.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ */
async function reiterOeffnen(page, typ) {
    const ansicht = await ansichtVon(page, typ);
    expect(
        ansicht,
        `Vorbedingung: das Importfeld von "${typ}" liegt in einer Ansicht`
    ).toBeTruthy();
    await page.evaluate(v => window.switchView(v), ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
    return /** @type {string} */ (ansicht);
}

/** Der sichtbare Knopf mit genau diesem Zeichen in der Ansicht.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht
 *  @param {string} zeichen */
function knopfMit(page, ansicht, zeichen) {
    return page
        .locator(`#view-${ansicht}`)
        .locator('button, label, [role="button"]')
        .filter({ hasText: new RegExp(`^\\s*${zeichen}\\s*$`, 'u') });
}

/** Das 📥 des Reiters.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht */
function einfuhrKnopf(page, ansicht) {
    return knopfMit(page, ansicht, '📥');
}

/** @param {import('@playwright/test').Page} page */
function fenster(page) {
    return page.locator('#import-modal');
}

/** Der ✕-Knopf des Fensters.
 *  @param {import('@playwright/test').Page} page */
function kreuz(page) {
    return fenster(page)
        .locator('button, [role="button"]')
        .filter({ hasText: /^\s*✕\s*$/u });
}

/** Tippt nach mehr als 300 ms Abstand zum vorigen Tipper:
 *  `initTouchOptimizations()` (`systems/avatars.js`) verschluckt den Klick
 *  eines Tippers, der schneller folgt (siehe npc-formular.spec.js (20)).
 *  @param {import('@playwright/test').Locator} ziel */
async function tippen(ziel) {
    await ziel.page().waitForTimeout(350);
    await ziel.tap();
}

/** @param {import('@playwright/test').Locator} ziel
 *  @param {boolean} finger */
function druecken(ziel, finger) {
    return finger ? tippen(ziel) : ziel.click();
}

/**
 * Sichtbar, im Fenster und nicht verdeckt: der Mittelpunkt trifft das
 * Element selbst (`elementFromPoint`).
 * @param {import('@playwright/test').Locator} ziel
 */
async function erreichbar(ziel) {
    await ziel.scrollIntoViewIfNeeded();
    return ziel.evaluate(el => {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const treffer = document.elementFromPoint(x, y);
        return (
            r.width > 0 &&
            r.height > 0 &&
            x >= 0 &&
            y >= 0 &&
            x <= window.innerWidth &&
            y <= window.innerHeight &&
            !!treffer &&
            (treffer === el || el.contains(treffer))
        );
    });
}

/** Namenlose Datei-Felder im ganzen Dokument (nach dem Laden: 0).
 *  @param {import('@playwright/test').Page} page */
function namenloseFelder(page) {
    return page.locator('input[type="file"]:not([id])').count();
}

/**
 * Der echte 📤-Export des Reiters, als Vorlage fuer die Testdateien. Beim
 * Zauber-Reiter ist 📤 ein Aufklappmenue ("📤 ▾" → "📄 JSON"); es oeffnet
 * beim Ueberfahren, wie fuer den Nutzer. Die Datei liegt danach unter
 * `exportPfad(ansicht)`.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 */
async function exportieren(page, ansicht) {
    const knopf = page
        .locator(`#view-${ansicht}`)
        .locator('button, [role="button"]')
        .filter({ hasText: /^\s*📤(\s*▾)?\s*$/u });
    await knopf.hover();
    const menuePunkt = page
        .locator(`#view-${ansicht}`)
        .locator('button, [role="button"]')
        .filter({ hasText: /^\s*📄\s*JSON\s*$/u });
    const ausloeser = (await menuePunkt.isVisible()) ? menuePunkt : knopf;
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }),
        ausloeser.click()
    ]);
    const ziel = exportPfad(ansicht);
    await download.saveAs(ziel);
    const json = JSON.parse(fs.readFileSync(ziel, 'utf8'));
    expect(
        Array.isArray(json?.data) && json.data.length > 0,
        'Vorbedingung: der 📤-Export liefert Eintraege'
    ).toBe(true);
    return json;
}

/** Wo `exportieren()` die Datei des Reiters ablegt.
 *  @param {string} ansicht */
function exportPfad(ansicht) {
    return test.info().outputPath(`export-${ansicht}.json`);
}

/**
 * Schreibt eine Testdatei aus der Export-Vorlage: so viele Eintraege wie
 * `namen`, jeder mit einem neuen Namen bzw. Titel, sonst unveraendert.
 * @param {any} vorlage
 * @param {string} feld `name` oder `title`
 * @param {string[]} namen
 * @param {string} dateiname
 */
function datei(vorlage, feld, namen, dateiname) {
    const inhalt = {
        ...vorlage,
        data: namen.map((n, i) => ({ ...vorlage.data[i % vorlage.data.length], [feld]: n }))
    };
    const ziel = test.info().outputPath(dateiname);
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    fs.writeFileSync(ziel, JSON.stringify(inhalt, null, 2), 'utf8');
    return ziel;
}

/**
 * Der Weg 📥 → Dateidialog → Datei. Bietet die App danach WEITERE Dialoge
 * an, bedient der Nutzer sie mit `weitere` (null: er laesst sie liegen).
 * Wartet, bis das Fenster steht, hoechstens FENSTER_MS, und horcht danach
 * kurz nach, ob noch ein Dialog kommt. Gibt die Zahl der Dialoge zurueck.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {string|string[]} wahl
 * @param {{ weitere?: string|string[]|null, finger?: boolean }} [wie]
 */
async function dateiWaehlen(page, ansicht, wahl, wie = {}) {
    const weitere = wie.weitere === undefined ? wahl : wie.weitere;
    /** @type {import('@playwright/test').FileChooser[]} */
    const waehler = [];
    /** @param {import('@playwright/test').FileChooser} fc */
    const fang = fc => waehler.push(fc);
    page.on('filechooser', fang);
    try {
        await druecken(einfuhrKnopf(page, ansicht), !!wie.finger);
        await expect
            .poll(() => waehler.length, {
                timeout: 3000,
                message: 'Vorbedingung: 📥 oeffnet einen Dateidialog'
            })
            .toBeGreaterThan(0);
        await waehler[0].setFiles(wahl);
        let bedient = 1;
        const ende = Date.now() + FENSTER_MS;
        while (Date.now() < ende) {
            if (waehler.length > bedient) {
                if (weitere !== null) await waehler[bedient].setFiles(weitere);
                bedient++;
                continue;
            }
            if (await fenster(page).isVisible()) break;
            await page.waitForTimeout(100);
        }
        await page.waitForTimeout(300);
        return waehler.length;
    } finally {
        page.off('filechooser', fang);
    }
}

/**
 * Waehlt den Modus im Fenster — ueber das Optionsfeld, oder, ist es (etwa
 * gestaltet) unsichtbar, ueber seine Beschriftung.
 * @param {import('@playwright/test').Page} page
 * @param {'merge'|'replace'} wert
 * @param {boolean} [finger]
 */
async function modusWaehlen(page, wert, finger = false) {
    const radio = page.locator(`#import-modal input[name="import-mode"][value="${wert}"]`);
    if (!(await radio.isChecked().catch(() => false))) {
        const id = await radio.getAttribute('id');
        const traeger = (await radio.isVisible())
            ? radio
            : page
                  .locator(
                      `#import-modal label:has(input[name="import-mode"][value="${wert}"])` +
                          (id ? `, #import-modal label[for="${id}"]` : '')
                  )
                  .first();
        await druecken(traeger, finger);
    }
    await expect(radio, `Modus "${wert}" gewaehlt`).toBeChecked();
}

/** "Importieren" im Fenster; das Fenster schliesst danach.
 *  @param {import('@playwright/test').Page} page
 *  @param {boolean} [finger] */
async function importieren(page, finger = false) {
    const knopf = fenster(page).locator('[data-action="execute-import"]');
    weich(knopf, 'der Knopf heisst "Importieren"').toHaveText(/Importieren/);
    await druecken(knopf, finger);
    await weich(fenster(page), 'nach "Importieren" ist das Fenster zu').toBeHidden();
}

/** Die Nummer der juengsten Meldung (das Kampfprotokoll fuehrt jede Meldung
 *  von showToast() nummeriert).
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
/** Erfolgsmeldungen in einer Liste von `meldungenSeit()`.
 *  @param {string[]} meldungen */
function erfolge(meldungen) {
    return meldungen.filter(m => m.startsWith('success: '));
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu. Ohne ihn waere "es wurde nicht geschrieben" nicht von "es wurde
 *  derselbe Inhalt geschrieben" zu unterscheiden.
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}
/** Wartet, bis seit `rev` geschrieben wurde (WEICH).
 *  @param {import('@playwright/test').Page} page
 *  @param {string|null} rev
 *  @param {string} was */
async function geschriebenSeit(page, rev, was) {
    await weich
        .poll(() => revStand(page), {
            timeout: SOFORT_MS,
            message: `${was}: der Import muss schreiben (save() entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Eine Sammlung aus D, ohne `undefined`-Felder.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} sammlung */
function sammlung(page, sammlung) {
    return page.evaluate(s => JSON.parse(JSON.stringify(window.D[s] ?? null)), sammlung);
}
/** Namen bzw. Titel einer Sammlung in D.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} sammlung */
function namenInD(page, sammlung) {
    return page.evaluate(s => (window.D[s] || []).map(e => e.name ?? e.title), sammlung);
}

/** Haengt den lesenden Haken an `window.pushCombatLog`: zu jeder Meldung
 *  steht danach fest, was in DEM Moment in D stand. showToast() ruft das
 *  Protokoll ueber `window.` (utils/utilities.js), der Haken sieht also jede
 *  Meldung. Er aendert nichts — er reicht den Aufruf unveraendert durch.
 *  @param {import('@playwright/test').Page} page */
function standBeiMeldungMitschreiben(page) {
    return page.evaluate(() => {
        if (window.__standBeiMeldung) return;
        /** @type {{text: string, typ: string, characters: string[], locations: string[]}[]} */
        const mitschrift = [];
        window.__standBeiMeldung = mitschrift;
        const roh = window.pushCombatLog;
        window.pushCombatLog = function (text, typ, kategorie) {
            try {
                mitschrift.push({
                    text: String(text),
                    typ: String(typ),
                    characters: (window.D.characters || []).map(e => e.name),
                    locations: (window.D.locations || []).map(e => e.name)
                });
            } catch {
                // Lesen darf den Aufruf nie verhindern.
            }
            return roh.call(this, text, typ, kategorie);
        };
    });
}
/** Was beim ersten Erfolg mit "importiert" in D stand — oder null.
 *  @param {import('@playwright/test').Page} page */
function standBeimImportErfolg(page) {
    return page.evaluate(
        () =>
            (window.__standBeiMeldung || []).find(
                e => e.typ === 'success' && /importiert/.test(e.text)
            ) ?? null
    );
}

// ===========================================================================
// (1) GENAU EIN DATEIDIALOG — DIE DORT GEWAEHLTE DATEI ZAEHLT
// ===========================================================================
//
// Ein zweiter Dialog wird mit einem KOEDER bedient (andere Namen): kommt er,
// ist sowohl die Zahl falsch als auch der Inhalt — heute zaehlte die Datei
// aus Dialog 2.
test('(1) R1: genau ein Dateidialog, die dort gewaehlte Datei wird importiert, kein namenloses Feld bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    const ansicht = await laden(page, 'npcs');
    const vorlage = await exportieren(page, ansicht);
    const gewaehlt = datei(vorlage, 'name', ['Elminster', 'Laeral'], 'npcs-gewaehlt.json');
    const koeder = datei(vorlage, 'name', ['Koeder Eins', 'Koeder Zwei'], 'npcs-koeder.json');
    const rev = await revStand(page);

    const dialoge = await dateiWaehlen(page, ansicht, gewaehlt, { weitere: koeder });

    weich(dialoge, 'Zahl der Dateidialoge fuer EINEN Import').toBe(1);
    await weich(fenster(page), 'nach der Dateiwahl steht das Fenster').toBeVisible(GEWARTET);
    if (await fenster(page).isVisible()) {
        // Oberflaechen-Vertrag: die Beschriftung "Hinzufügen" waehlt `merge`, "Ersetzen"
        // `replace` — per Klick auf die BESCHRIFTUNG, wie ein Mensch waehlt. Pruefer, Runde 2
        // (am Mutanten gemessen): mit vertauschten Beschriftungen blieben alle Faelle gruen,
        // jeder waehlte den Modus ueber `value`; wer "Hinzufügen" anklickte, haette ersetzt.
        const radio = wert => fenster(page).locator(`input[name="import-mode"][value="${wert}"]`);
        await fenster(page).getByText('Ersetzen', { exact: true }).click();
        await weich(radio('replace'), 'die Beschriftung "Ersetzen" waehlt replace').toBeChecked();
        await weich(page.locator('#import-info'), 'die Vorschau folgt: Ersetzen').toContainText(
            'Ersetzen:'
        );
        await fenster(page).getByText('Hinzufügen', { exact: true }).click();
        await weich(radio('merge'), 'die Beschriftung "Hinzufügen" waehlt merge').toBeChecked();
        await weich(page.locator('#import-info'), 'die Vorschau folgt: Hinzufügen').toContainText(
            'Hinzufügen:'
        );
        await modusWaehlen(page, 'merge');
        await importieren(page);
    }
    weich(
        await namenInD(page, 'npcs'),
        'D: die im 📥-Dialog gewaehlte Datei ist dazugekommen'
    ).toEqual(['Volo Geddarm', 'Manshoon', 'Elminster', 'Laeral']);
    await geschriebenSeit(page, rev, 'Hinzufuegen');
    weich(await namenloseFelder(page), 'namenlose Datei-Felder im Dokument danach').toBe(0);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) LAENGER ALS 5 S IM DIALOG, DATEI OHNE GESTE — DAS FENSTER KOMMT
// ===========================================================================
test('(2) R1: nach 6 s im Dateidialog, Datei per rohem CDP ohne Geste: das Fenster kommt, der Import geht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    const ansicht = await laden(page, 'npcs');
    const vorlage = await exportieren(page, ansicht);
    const gewaehlt = datei(vorlage, 'name', ['Elminster', 'Laeral'], 'npcs-spaet.json');
    // Auslesen: hatte die Seite im `change` des Dateifelds Nutzeraktivierung?
    await page.evaluate(() => {
        /** @type {boolean[]} */
        const aktiv = [];
        window.__aktivImChange = aktiv;
        document.addEventListener(
            'change',
            e => {
                if (/** @type {HTMLInputElement} */ (e.target)?.type === 'file') {
                    aktiv.push(navigator.userActivation.isActive);
                }
            },
            true
        );
    });
    const rev = await revStand(page);

    /** @type {import('@playwright/test').FileChooser[]} */
    const waehler = [];
    page.on('filechooser', fc => waehler.push(fc));
    await einfuhrKnopf(page, ansicht).click();
    await expect
        .poll(() => waehler.length, { message: 'Vorbedingung: 📥 oeffnet einen Dateidialog' })
        .toBeGreaterThan(0);
    // Der Nutzer sucht im Dialog nach der Datei.
    await page.waitForTimeout(LANGE_IM_DIALOG_MS);
    const cdp = await page.context().newCDPSession(page);
    try {
        const { result } = await cdp.send('Runtime.evaluate', {
            expression: `document.querySelector('.io-file-input[data-on-change="importData"][data-type="npcs"]')`,
            userGesture: false
        });
        await cdp.send('DOM.setFileInputFiles', {
            files: [gewaehlt],
            objectId: /** @type {string} */ (result.objectId)
        });
    } finally {
        await cdp.detach();
    }
    expect(
        await page.evaluate(() => window.__aktivImChange),
        'Messmittel: das change des Reiterfelds kommt OHNE Nutzeraktivierung'
    ).toEqual([false]);

    await weich(fenster(page), 'nach 6 s im Dialog steht trotzdem das Fenster').toBeVisible({
        timeout: FENSTER_MS
    });
    if (await fenster(page).isVisible()) {
        await modusWaehlen(page, 'merge');
        await importieren(page);
    }
    weich(await namenInD(page, 'npcs'), 'D: die Datei ist importiert').toEqual([
        'Volo Geddarm',
        'Manshoon',
        'Elminster',
        'Laeral'
    ]);
    await geschriebenSeit(page, rev, 'Hinzufuegen nach 6 s');
    weich(waehler.length, 'Zahl der Dateidialoge').toBe(1);
    weich(await namenloseFelder(page), 'namenlose Datei-Felder im Dokument danach').toBe(0);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) DIESELBE DATEI MEHRMALS HINTEREINANDER — JEDES MAL DAS FENSTER
// ===========================================================================
//
// Drei Runden mit DERSELBEN Datei: erst im Fenster ✕, dann zweimal
// "Importieren". Die Runde mit ✕ steht vorn, weil sie den naheliegenden
// halben Fix faengt, der `value` nur nach einem erfolgreichen Import leert
// (gemessen an einer Buendelkopie: mit nur zwei Import-Runden war er gruen).
// Wer im Fenster abbricht und dieselbe Datei noch einmal waehlt, bekaeme dort
// KEIN `change` und damit gar nichts — R1 sagt "beide Male das Fenster", ohne
// danach zu fragen, was im Fenster geschah.
test('(3) R1: dieselbe Datei dreimal hintereinander gewaehlt — nach ✕ und nach "Importieren" jedes Mal das Fenster', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    const ansicht = await laden(page, 'locations');
    const vorlage = await exportieren(page, ansicht);
    const gleich = datei(vorlage, 'name', ['Luskan', 'Mirabar'], 'orte-mehrmals.json');

    for (const [runde, ende, erwartet] of /** @type {[string, '✕'|'Importieren', string[]][]} */ ([
        ['erstes Mal', '✕', ['Tiefwasser', 'Niewinter']],
        ['zweites Mal (nach ✕)', 'Importieren', ['Tiefwasser', 'Niewinter', 'Luskan', 'Mirabar']],
        [
            'drittes Mal (nach "Importieren")',
            'Importieren',
            ['Tiefwasser', 'Niewinter', 'Luskan', 'Mirabar', 'Luskan', 'Mirabar']
        ]
    ])) {
        const rev = await revStand(page);
        await dateiWaehlen(page, ansicht, gleich);
        await weich(fenster(page), `${runde}: nach der Dateiwahl steht das Fenster`).toBeVisible(
            GEWARTET
        );
        if (await fenster(page).isVisible()) {
            if (ende === '✕') {
                await kreuz(page).click();
                await weich(fenster(page), `${runde}: nach ✕ ist das Fenster zu`).toBeHidden();
            } else {
                await modusWaehlen(page, 'merge');
                await importieren(page);
                await geschriebenSeit(page, rev, runde);
            }
        }
        weich(await namenInD(page, 'locations'), `${runde}: D`).toEqual(erwartet);
    }
    weich(await namenloseFelder(page), 'namenlose Datei-Felder im Dokument danach').toBe(0);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) ABBRECHEN DER DATEIWAHL — KEINE MELDUNG, NICHTS GEAENDERT, KEIN FELD
// ===========================================================================
//
// Zwei Formen. ERSTENS der echte Abbruch: ohne abgefangenen Dialog bricht
// Chromium ohne Oberflaeche selbst ab (gemessen: `cancel` am Feld, kein
// `change`) — schon heute still, und so soll es bleiben (ein Fix, der auf
// `cancel` eine Meldung gibt, waere hier rot). ZWEITENS die leere Auswahl
// (`setFiles([])`: `change` mit null Dateien, wie Chromium es zeigt, wenn
// eine Auswahl geleert wird) — heute oeffnet sie den zweiten Dialog und
// laesst dessen Feld im <body>. Den zweiten Dialog bricht der Nutzer wieder
// ab.
// Der echte Abbruch braucht den Browser OHNE Oberflaeche: mit `--headed`
// oeffnete ohne Abfangen ein echter Betriebssystem-Dialog, auf den niemand
// antwortet (nicht gemessen) — dort laeuft nur die leere Auswahl.
test('(4) R1: Abbrechen der Dateiwahl — keine Meldung, D und Speicher unveraendert, kein weiterer Dialog, kein Feld', async ({
    page,
    headless
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    const ansicht = await laden(page, 'npcs');
    const vorher = await sammlung(page, 'npcs');
    const rev = await revStand(page);
    const stand = await meldungsStand(page);

    if (headless) await echterAbbruch(page, ansicht, stand);
    else
        test.info().annotations.push({
            type: 'uebersprungen',
            description: 'echter Abbruch nur ohne Oberflaeche'
        });

    // Die leere Auswahl.
    const dialoge = await dateiWaehlen(page, ansicht, [], { weitere: [] });
    await page.waitForTimeout(STILLE_MS);
    weich(dialoge, 'leere Auswahl: Zahl der Dateidialoge').toBe(1);
    weich(await meldungenSeit(page, stand), 'leere Auswahl: Meldungen').toEqual([]);
    await weich(fenster(page), 'leere Auswahl: kein Fenster').toBeHidden();

    weich(await sammlung(page, 'npcs'), 'D.npcs unveraendert').toEqual(vorher);
    weich(await revStand(page), 'nichts geschrieben (_rev)').toBe(rev);
    weich(await namenloseFelder(page), 'namenlose Datei-Felder im Dokument danach').toBe(0);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

/**
 * Der echte Abbruch aus (4): 📥 ohne 'filechooser'-Hoerer, also ohne
 * Abfangen — Chromium ohne Oberflaeche bricht den Dialog selbst ab.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {number} stand
 */
async function echterAbbruch(page, ansicht, stand) {
    await page.evaluate(() => {
        /** @type {string[]} */
        const ereignisse = [];
        window.__dateiEreignisse = ereignisse;
        for (const art of ['change', 'cancel']) {
            document.addEventListener(
                art,
                e => {
                    if (/** @type {HTMLInputElement} */ (e.target)?.type === 'file') {
                        ereignisse.push(art);
                    }
                },
                true
            );
        }
    });
    await einfuhrKnopf(page, ansicht).click();
    await expect
        .poll(() => page.evaluate(() => window.__dateiEreignisse), {
            message: 'Vorbedingung: der Dialog wurde abgebrochen (cancel)'
        })
        .toContain('cancel');
    await page.waitForTimeout(STILLE_MS);
    weich(await meldungenSeit(page, stand), 'echter Abbruch: Meldungen').toEqual([]);
    await weich(fenster(page), 'echter Abbruch: kein Fenster').toBeHidden();
}

// ===========================================================================
// (5)–(7) ABBRECHEN IM FENSTER — NICHTS GESCHRIEBEN, KEINE ERFOLGSMELDUNG
// ===========================================================================
//
// "Keine Erfolgsmeldung" gilt fuer den GANZEN Weg ab 📥: auch eine gruene
// Meldung vor dem Fenster ("✅ Datei validiert") ist eine, die der Nutzer
// fuer den Import haelt — und nach dem Abbrechen gibt es keinen.
/** @type {{ nr: string, weg: string, schliessen: (page: import('@playwright/test').Page) => Promise<void>, fokus: boolean }[]} */
const ABBRUCH_IM_FENSTER = [
    {
        nr: '(5)',
        weg: '✕',
        schliessen: page => kreuz(page).click(),
        fokus: false
    },
    {
        nr: '(6)',
        weg: '"Abbrechen"',
        schliessen: page =>
            fenster(page)
                .locator('button, [role="button"]')
                .filter({ hasText: /^\s*Abbrechen\s*$/ })
                .click(),
        fokus: false
    },
    {
        nr: '(7)',
        weg: 'Escape',
        schliessen: page => page.keyboard.press('Escape'),
        fokus: true
    }
];
for (const fall of ABBRUCH_IM_FENSTER) {
    test(`${fall.nr} R2${fall.fokus ? '/R10' : ''}: Abbrechen im Fenster per ${fall.weg} — nichts geschrieben, keine Erfolgsmeldung${fall.fokus ? ', Fokus zurueck auf 📥' : ''}`, async ({
        page
    }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        const ansicht = await laden(page, 'npcs');
        const vorlage = await exportieren(page, ansicht);
        const gewaehlt = datei(vorlage, 'name', ['Elminster', 'Laeral'], 'npcs-abbruch.json');
        const vorher = await sammlung(page, 'npcs');
        const rev = await revStand(page);
        const stand = await meldungsStand(page);

        await dateiWaehlen(page, ansicht, gewaehlt);
        await weich(fenster(page), 'nach der Dateiwahl steht das Fenster').toBeVisible(GEWARTET);
        if (await fenster(page).isVisible()) {
            if (fall.fokus) {
                // "Kehrt zurueck" setzt voraus, dass er weg war: das Fenster
                // hat den Fokus uebernommen wie jede Schale (`showModal()` →
                // ModalFocus). Gemessen an einer Buendelkopie, die das
                // Fenster nur per Klasse `show` oeffnet: der Fokus blieb auf
                // dem 📥, Escape schloss trotzdem, und ohne diese Zeile war
                // (7) gruen.
                weich(
                    await fenster(page).evaluate(f => f.contains(document.activeElement)),
                    'vor Escape: der Fokus steht im Fenster'
                ).toBe(true);
            }
            await fall.schliessen(page);
            await weich(fenster(page), `nach ${fall.weg} ist das Fenster zu`).toBeHidden();
        }
        await page.waitForTimeout(STILLE_MS);

        weich(
            erfolge(await meldungenSeit(page, stand)),
            'Erfolgsmeldungen auf dem ganzen Weg'
        ).toEqual([]);
        weich(await sammlung(page, 'npcs'), 'D.npcs unveraendert').toEqual(vorher);
        weich(await revStand(page), 'nichts geschrieben (_rev)').toBe(rev);
        if (fall.fokus) {
            await weich(
                einfuhrKnopf(page, ansicht),
                'der Fokus steht wieder auf dem 📥'
            ).toBeFocused();
        }
        weich(await fehler.alle(), 'kein Fehler').toEqual([]);
    });
}

// ===========================================================================
// (8) DIE ERFOLGSMELDUNG KOMMT ERST NACH DEM SCHREIBEN — DEUTSCH, NUMERUS
// ===========================================================================
//
// Zwei Runden, damit Einzahl UND Mehrzahl und beide Modi vorkommen: ein
// Charakter ersetzt, zwei Orte hinzugefuegt. Die Typnamen sind die der App
// ("Charakter aktualisiert", Reiter "🏠 Orte"). "Erst nach dem Schreiben"
// heisst: vor dem Fenster keine Erfolgsmeldung, und als die Meldung kommt,
// steht der Import schon in D (der Haken haelt den Stand fest).
test('(8) R2: die Erfolgsmeldung kommt erst nach dem Schreiben, mit deutschem Typnamen und richtigem Numerus', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, null);
    await standBeiMeldungMitschreiben(page);

    for (const runde of /** @type {const} */ ([
        {
            typ: 'characters',
            feld: 'name',
            namen: ['Cyra aus der Datei'],
            modus: 'replace',
            meldung: /\b1 Charakter importiert \(ersetzt\)/,
            spalte: 'characters',
            danach: ['Cyra aus der Datei']
        },
        {
            typ: 'locations',
            feld: 'name',
            namen: ['Luskan', 'Mirabar'],
            modus: 'merge',
            meldung: /\b2 Orte importiert \(hinzugefügt\)/,
            spalte: 'locations',
            danach: ['Tiefwasser', 'Niewinter', 'Luskan', 'Mirabar']
        }
    ])) {
        const ansicht = await reiterOeffnen(page, runde.typ);
        const vorlage = await exportieren(page, ansicht);
        const gewaehlt = datei(vorlage, runde.feld, [...runde.namen], `meldung-${runde.typ}.json`);
        const stand = await meldungsStand(page);

        await dateiWaehlen(page, ansicht, gewaehlt);
        const vorFenster = await meldungenSeit(page, stand);
        weich(
            vorFenster.filter(m => !/^(info|warning): /.test(m)),
            `${runde.typ}: VOR dem Fenster hoechstens neutrale Hinweise (info, warning)`
        ).toEqual([]);
        weich(
            vorFenster.filter(m => /importiert/.test(m)),
            `${runde.typ}: "importiert" vor dem Fenster`
        ).toEqual([]);
        await weich(fenster(page), `${runde.typ}: das Fenster steht`).toBeVisible(GEWARTET);
        if (!(await fenster(page).isVisible())) continue;

        await modusWaehlen(page, runde.modus);
        const imFenster = await meldungsStand(page);
        await importieren(page);
        await weich
            .poll(
                async () =>
                    erfolge(await meldungenSeit(page, imFenster)).filter(m => /importiert/.test(m)),
                { timeout: SOFORT_MS, message: `${runde.typ}: die Erfolgsmeldung` }
            )
            .toEqual([expect.stringMatching(runde.meldung)]);
        const beiMeldung = await standBeimImportErfolg(page);
        weich(
            beiMeldung?.[runde.spalte] ?? null,
            `${runde.typ}: was in D stand, als die Erfolgsmeldung kam`
        ).toEqual([...runde.danach]);
        // Die naechste Runde liest wieder nur IHREN Erfolg.
        await page.evaluate(() => window.__standBeiMeldung?.splice(0));
    }
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) AM TELEFON MIT DEM FINGER: 📥 → DATEI → FENSTER → IMPORTIEREN
// ===========================================================================
//
// Die Testdatei kommt aus dem 📤-Export am Schreibtisch (das Telefon hat
// keinen eigenen Export-Weg zu pruefen), dann wird das Fenster schmal —
// erst NACH dem Laden: `waitForAppReady()` wartet auf `.app-title`, und die
// ist im Mobil-Layout versteckt (wie in npc-formular.spec.js).
test.describe('(9) Telefon 390x844', () => {
    test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

    test('(9) R10: 📥 → Datei → Fenster → Importieren per Finger (Quests)', async ({ page }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        const ansicht = await laden(page, 'quests');
        const vorlage = await exportieren(page, ansicht);
        const gewaehlt = datei(
            vorlage,
            'title',
            ['Der Kristallturm', 'Das Feuerwerk'],
            'quests-telefon.json'
        );
        await page.setViewportSize(TELEFON);
        await page.waitForTimeout(450);
        await expect(page.locator('html'), 'Vorbedingung: Mobil-Layout').toHaveAttribute(
            'data-layout',
            'mobile'
        );
        weich(
            await erreichbar(einfuhrKnopf(page, ansicht)),
            'das 📥 ist am Telefon erreichbar'
        ).toBe(true);
        const rev = await revStand(page);
        const stand = await meldungsStand(page);

        // EINE Dateiwahl: einen zweiten Dialog laesst der Fall liegen — "📥 →
        // Datei → Fenster" ist die Zusage, nicht "📥 → Datei → Datei → Fenster".
        const dialoge = await dateiWaehlen(page, ansicht, gewaehlt, {
            weitere: null,
            finger: true
        });
        weich(dialoge, 'Zahl der Dateidialoge').toBe(1);
        await weich(fenster(page), 'nach der Dateiwahl steht das Fenster').toBeVisible(GEWARTET);
        if (await fenster(page).isVisible()) {
            const knopf = fenster(page).locator('[data-action="execute-import"]');
            weich(await erreichbar(knopf), '"Importieren" ist am Telefon erreichbar').toBe(true);
            await modusWaehlen(page, 'merge', true);
            await importieren(page, true);
        }

        weich(await namenInD(page, 'quests'), 'D: die Quests sind dazugekommen').toEqual([
            'Drachenjagd',
            'Schatzsuche',
            'Der Kristallturm',
            'Das Feuerwerk'
        ]);
        await geschriebenSeit(page, rev, 'Hinzufuegen am Telefon');
        await weich(
            page.locator(`#view-${ansicht}`).getByText('Der Kristallturm').first(),
            'die Liste zeigt die neuen Quests'
        ).toBeVisible();
        weich(
            erfolge(await meldungenSeit(page, stand)).filter(m => /importiert/.test(m)),
            'die Erfolgsmeldung'
        ).toEqual([expect.stringMatching(/\b2 Quests importiert \(hinzugefügt\)/)]);
        weich(await namenloseFelder(page), 'namenlose Datei-Felder im Dokument danach').toBe(0);
        weich(await fehler.alle(), 'Telefon: kein Fehler').toEqual([]);
    });
});

// ===========================================================================
// (10) DER DIALOG BIETET NUR .json AN
// ===========================================================================
//
// Der Vertrag nimmt CSV ausdruecklich aus ("Nicht in diesem PR") und
// beschraenkt das `accept` der zwei Felder, die heute CSV anbieten
// (Encounter, Zauber). Gelesen an JEDEM Importfeld des Buendels — die Liste
// kommt aus dem Buendel, nicht aus einem Literal.
test('(10) R1: jedes Importfeld bietet im Dateidialog nur .json an', async ({ page }) => {
    test.setTimeout(60000);
    await laden(page, null);
    const felder = await page.evaluate(() =>
        Object.fromEntries(
            Array.from(
                document.querySelectorAll('.io-file-input[data-on-change="importData"]')
            ).map(f => [/** @type {HTMLElement} */ (f).dataset.type, f.getAttribute('accept')])
        )
    );
    expect(Object.keys(felder).length, 'Vorbedingung: Importfelder im Buendel').toBeGreaterThan(0);
    weich(felder, '`accept` je Typ').toEqual(
        Object.fromEntries(Object.keys(felder).map(typ => [typ, '.json']))
    );
});

// ===========================================================================
// (11) KONTROLLE: PLAYWRIGHTS setFiles() TRAEGT AKTIVIERUNG — DARUM (2) ROH
// ===========================================================================
//
// Nicht der Defekt, sondern das Messmittel: nach 6 s im Dialog kommt das
// `change` mit `isActive: true`, wenn Playwright die Datei setzt. Ein Fall,
// der so mass, haette den blockierten zweiten Dialog nie gesehen (eine
// fruehere Messung "oeffnet auch nach 12 s" war genau das). Gruen vor und
// nach dem Fix — wird es rot, hat Playwright das geaendert, und (2) muss
// neu begruendet werden.
test('(11) (Kontrolle) fileChooser.setFiles() nach 6 s: das change kommt MIT Nutzeraktivierung', async ({
    page
}) => {
    test.setTimeout(60000);
    const ansicht = await laden(page, 'npcs');
    const vorlage = await exportieren(page, ansicht);
    const gewaehlt = datei(vorlage, 'name', ['Elminster'], 'npcs-kontrolle.json');
    await page.evaluate(() => {
        /** @type {boolean[]} */
        const aktiv = [];
        window.__aktivImChange = aktiv;
        document.addEventListener(
            'change',
            e => {
                if (/** @type {HTMLInputElement} */ (e.target)?.type === 'file') {
                    aktiv.push(navigator.userActivation.isActive);
                }
            },
            true
        );
    });
    /** @type {import('@playwright/test').FileChooser[]} */
    const waehler = [];
    page.on('filechooser', fc => waehler.push(fc));
    await einfuhrKnopf(page, ansicht).click();
    await expect.poll(() => waehler.length).toBeGreaterThan(0);
    await page.waitForTimeout(LANGE_IM_DIALOG_MS);
    await waehler[0].setFiles(gewaehlt);
    await expect.poll(() => page.evaluate(() => window.__aktivImChange?.[0] ?? null)).toBe(true);
});

// ===========================================================================
// (12) WAECHTER: JEDER DER 12 REITER BEHAELT SEIN 📥 UND SEINEN DIALOG
// ===========================================================================
//
// Die Typliste kommt aus dem Buendel (`.io-file-input[data-on-change=
// "importData"]`, am Stand 020e258: 12 — der 13. Export-Reiter, Notizen,
// hat keinen Import, und das bleibt so). Je Reiter: genau ein sichtbares
// 📥, erreichbar (der Mittelpunkt trifft es), und sein Klick oeffnet einen
// Dateidialog, dessen Feld das Importfeld DIESES Typs ist. Den Dialog bedient
// der Waechter nicht — was danach kommt, pruefen (1)–(9).
test('(12) (Waechter) alle 12 Reiter: sichtbares 📥 oeffnet genau den Dateidialog des eigenen Typs', async ({
    page
}) => {
    test.setTimeout(90000);
    const fehler = fehlerFangen(page);
    await laden(page, null);
    const felder = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.io-file-input[data-on-change="importData"]')).map(
            f => ({
                typ: /** @type {HTMLElement} */ (f).dataset.type ?? null,
                ansicht: f.closest('.view')?.id?.replace(/^view-/, '') ?? null
            })
        )
    );
    weich(felder.length, 'Importfelder im Buendel').toBe(12);
    weich(new Set(felder.map(f => f.typ)).size, 'jeder Typ genau einmal').toBe(felder.length);

    /** @type {import('@playwright/test').FileChooser[]} */
    const waehler = [];
    page.on('filechooser', fc => waehler.push(fc));
    for (const { typ, ansicht } of felder) {
        weich(ansicht, `${typ}: das Feld liegt in einer Ansicht`).toBeTruthy();
        if (!ansicht) continue;
        await page.evaluate(v => window.switchView(v), ansicht);
        await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
        const knopf = einfuhrKnopf(page, ansicht);
        weich(await knopf.count(), `${typ}: genau ein 📥 in #view-${ansicht}`).toBe(1);
        if ((await knopf.count()) !== 1) continue;
        await weich(knopf, `${typ}: das 📥 ist sichtbar`).toBeVisible();
        weich(await erreichbar(knopf), `${typ}: das 📥 ist erreichbar`).toBe(true);
        const vorher = waehler.length;
        await knopf.click();
        await weich
            .poll(() => waehler.length, { message: `${typ}: der Klick oeffnet einen Dateidialog` })
            .toBe(vorher + 1);
        if (waehler.length === vorher + 1) {
            weich(
                await waehler[vorher].element().evaluate(el => el.getAttribute('data-type')),
                `${typ}: der Dialog gehoert zum Importfeld dieses Typs`
            ).toBe(typ);
        }
    }
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (13) JEDER DER 12 TYPEN: DIE ERFOLGSMELDUNG NENNT IHN DEUTSCH
// ===========================================================================
//
// (8) und (9) pruefen Typname und Numerus an drei Typen (Charakter, Orte,
// Quests). Ein Fix mit einer Namensliste nur fuer diese drei — oder fuer die
// vier, die ein Nachbau gerade braucht — bestand damit alles (gemessen an
// einer Buendelkopie mit Namen nur fuer characters/npcs/locations/quests:
// (1)–(12) gruen, die Meldung lautete etwa "✅ 1 calendarEvents importiert
// (hinzugefügt)"). Hier geht deshalb JEDER Typ des Buendels einmal den Weg
// 📤 → 📥 → Fenster → Hinzufuegen, mit seiner eigenen Exportdatei
// (unveraendert; ein Eintrag, bei den vier Typen der Grundsaat zwei). Die
// Meldung nennt die Zahl der Datei und darf den internen Schluessel nicht
// enthalten (Gross-/Kleinschreibung zaehlt: "NPCs", "Quests", "Links",
// "Wiki-Eintrag" sind deutsch, "npcs", "calendarEvents", "sessionPreps" nicht).
// Den Numerus prueft (13) NICHT: Einzahl und Mehrzahl sind ohne Namensliste
// nicht zu unterscheiden ("1 Zauber", "2 Zauber") — eine Namensliste in der
// Datei waere ein zweiter Vertrag. Ohne Fenster ist jeder weitere Typ gleich
// rot; der Fall bricht dann nach dem ersten ab.
test('(13) R2: alle 12 Reiter — die Erfolgsmeldung nennt den Typ deutsch, nicht seinen internen Schluessel', async ({
    page
}) => {
    test.setTimeout(120000);
    const fehler = fehlerFangen(page);
    await laden(page, null, true);
    const felder = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.io-file-input[data-on-change="importData"]')).map(
            f => ({
                typ: /** @type {HTMLElement} */ (f).dataset.type ?? '',
                ansicht: f.closest('.view')?.id?.replace(/^view-/, '') ?? ''
            })
        )
    );
    weich(felder.length, 'Importfelder im Buendel').toBe(12);

    for (const { typ, ansicht } of felder) {
        await page.evaluate(v => window.switchView(v), ansicht);
        await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
        const anzahl = (await exportieren(page, ansicht)).data.length;
        await dateiWaehlen(page, ansicht, exportPfad(ansicht));
        const offen = await fenster(page).isVisible();
        weich(offen, `${typ}: nach der Dateiwahl steht das Fenster`).toBe(true);
        if (!offen) break;
        await modusWaehlen(page, 'merge');
        const imFenster = await meldungsStand(page);
        await importieren(page);
        /** @type {string[]} */
        let meldung = [];
        await weich
            .poll(
                async () =>
                    (meldung = erfolge(await meldungenSeit(page, imFenster)).filter(m =>
                        /importiert/.test(m)
                    )),
                { timeout: SOFORT_MS, message: `${typ}: die Erfolgsmeldung` }
            )
            .toEqual([
                expect.stringMatching(
                    new RegExp(`\\b${anzahl} \\S.* importiert \\(hinzugefügt\\)`, 'u')
                )
            ]);
        weich(
            meldung.filter(m => new RegExp(`(^|[^\\p{L}])${typ}([^\\p{L}]|$)`, 'u').test(m)),
            `${typ}: die Meldung nennt den Typ deutsch, nicht als "${typ}"`
        ).toEqual([]);
    }
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
