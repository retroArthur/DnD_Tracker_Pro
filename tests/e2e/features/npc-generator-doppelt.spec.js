// @ts-check
/**
 * Ein Klick, ein NPC: der 🎲 Generator speichert eine Vorschau nur einmal (GENERATOR-DOPPELT)
 * ==========================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **ein Klick, ein Enter,
 * eine Leertaste oder ein Tipp auf "Als NPC speichern" legt genau EINEN NPC
 * an — auch wenn das Neuzeichnen der NPC-Liste danach wirft.** Dann ist das
 * Fenster zu und die Vorschau verbraucht, der Nutzer sieht "<Name> als NPC
 * gespeichert" UND eine Fehlermeldung, und die zweite Haelfte eines
 * Doppelklicks legt nichts mehr an.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen von Mess- und Kritik-Sonde (nicht Teil des Repos), Chromium,
 * echte Maus, Tasten und Taps, Saat ueber localStorage mit zwei benannten
 * NPCs, am main 71dd26b6 und am Kopf von #22 (NPC-NAME, b1fc7da6):
 *
 *   ohne Wurf (heil)                  Doppelklick, zwei Klicks, zweimal
 *                                     Enter: 2 → 3, eine Meldung "<Name> als
 *                                     NPC gespeichert", Fenster zu. Der erste
 *                                     Klick laeuft synchron ganz durch, der
 *                                     zweite trifft den Hintergrund.
 *   mit Wurf beim Zeichnen der        JEDE weitere Bedienung legt einen
 *   NPC-Liste                         weiteren NPC an: Doppelklick 2 → 4,
 *                                     Klick–800 ms–Klick erst 3, dann 4,
 *                                     zweimal Enter / Leertaste 2 → 4,
 *                                     390x844 2 → 4, prod 2 → 4, ueber die
 *                                     Befehlspalette aus Start 2 → 4. Nach
 *                                     dem Neuladen bleiben 4, der Name steht
 *                                     doppelt da. Das Fenster bleibt offen
 *                                     und zeigt dieselbe Vorschau, 0
 *                                     Erfolgsmeldungen, KEINE Fehlermeldung —
 *                                     nur das Fehlerlog kennt den Wurf.
 *
 * Am main werfen schon Altdaten (ein NPC ohne Namen) und eine Zahl aus einer
 * Nutzertabelle; beide natuerlichen Ausloeser behebt NPC-NAME (#22). Der
 * Fehler bleibt: mit jedem anderen Wurf (am Kopf von #22 nachgemessen: 2 → 4,
 * auch nach dem Neuladen).
 *
 * DIE URSACHE: saveGeneratedNPC() (features/npc-generator/npc-generator.js)
 * speichert zuerst (pushUndo, push, save), zeichnet DANN die Liste und
 * schliesst ERST DANACH das Fenster und verbraucht die Vorschau
 * (`_npcgAktuell = null`). Wirft das Zeichnen, bricht die Funktion zwischen
 * Speichern und Schliessen ab — der NPC steht in D und im Speicher, Fenster
 * und Vorschau aber sind unveraendert, und die Wache `if (!_npcgAktuell)`
 * laesst den naechsten Klick auf dieselbe Vorschau durch. Den Wurf faengt
 * EventDelegation und schreibt ihn nur ins Fehlerlog (ErrorHandler.log ohne
 * showError) — darum sieht der Nutzer nichts. Die anderen Speicherwege mit
 * Dialog (saveNPC, saveQuest, saveTimelineEvent) schliessen VOR dem Zeichnen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (GENERATOR-DOPPELT, docs/bugfixes.md), den diese Datei prueft
 *
 *   R1  Hat saveGeneratedNPC() den NPC angelegt, endet JEDER Ausgang mit
 *       verbrauchter Vorschau und ohne #npc-generator-modal im DOM. Die
 *       Sperre ist das Verbrauchen der Vorschau (Vorbild createCampaign:
 *       Eingabe leeren vor dem Zeichnen), kein Zeitflag.
 *   R2  Wirft das Zeichnen, bleibt der NPC gespeichert (kein Zurueckrollen);
 *       der Nutzer sieht die Erfolgsmeldung UND eine sichtbare Fehlermeldung
 *       (Meldung vom Typ error), der Wurf steht im Fehlerlog.
 *   R5  Der heile Fall bleibt: 1 NPC, 1 Undo, 1 Meldung, Fenster weg.
 * W1–W3 und W5–W7 pruefen R1 und R2 an dem, was der Nutzer sieht und
 * behaelt (DOM, D, Speicher, Meldungen), R1 dazu an der Vorschau selbst
 * (DIE VORSCHAU, unten); W4 prueft D und Speicher nach dem Neuladen. K1/K2
 * pruefen R5, und R1 auch heil. Was diese Datei nicht erreicht, prueft
 * tests/unit/npc-generator-speichern.test.js am echten Modul: R1 fuer einen
 * Wurf in save() oder showToast(), die Reihenfolge von R1 (Erfolgsmeldung
 * VOR dem Zeichnen), R2 nach einer anderen Fehlermeldung binnen 2 s
 * (Entprellung von ErrorHandler.showError), R3 im prod-Buendel (der Wurf
 * erreicht den Aufrufer nicht) und R4 (pushUndo, push, save VOR dem
 * Zeichnen). Hier sind die mittleren drei unsichtbar — die Meldungen zaehlt
 * diese Datei ohne Reihenfolge, ein weitergeworfener Wurf traegt den
 * Pruefwurf-Text und ist erlaubt, und vor dem Doppelklick laeuft keine
 * andere Fehlermeldung (Nachpruefung: je eine Mutante, alle elf Faelle
 * gruen). Der ORT des Abfangens (IN saveGeneratedNPC, nicht in renderNPCList,
 * weil ruecksprung-rundlauf.spec.js (12) den Wurf beim Reiterwechsel braucht)
 * bleibt eine Regel der Durchsicht: ein catch in renderNPCList, der
 * protokolliert und meldet, ist am Verhalten nicht zu unterscheiden — auch
 * (12) bleibt dann gruen; rot wird (12) erst, wenn er schweigt (GEGENPROBE).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER AUSLOESER ist ein Pruefwurf, kein Altdatum. Die natuerlichen Wuerfe
 * sind mit NPC-NAME weg; ein Fall darauf wuerde an der Vorbedingung rot statt
 * am Fehler. Darum setzt jeder Fehlerpfad-Fall `window.getNPCIcon` auf eine
 * Funktion, die wirft — NACH dem Wechsel auf den NPC-Reiter (der Reiter
 * zeichnet also noch heil) bzw. in W7 nach dem Oeffnen ueber die Palette.
 * renderNPCList() ruft getNPCIcon() fuer jeden Eintrag; die Saat hat zwei
 * NPCs, die Liste also immer etwas zu zeichnen. Dieselbe Injektion wie
 * ruecksprung-rundlauf.spec.js (12).
 *
 * DIE VORBEDINGUNG jedes Fehlerpfad-Falls ist hart: nach der ERSTEN
 * Bedienung steht mindestens ein Eintrag mit dem Pruefwurf-TEXT im Fehlerlog
 * der App (`ErrorHandler.getRecentErrors()`). Bewusst NICHT an Funktion oder
 * Kontext gebunden: heute meldet ihn EventDelegation ("Action:
 * save-generated-npc"); nach einem Fix, der ihn in saveGeneratedNPC faengt,
 * meldet ihn je nach Weg safeRender ("renderNPCList (Render failure)") oder
 * ein eigener catch — im dev-Buendel (DEBUG_MODE: true, safeRender wirft
 * erneut) dazu EventDelegation, im prod-Buendel nicht. Eine Bindung an den
 * Kontext machte den Waechter nach einem richtigen Fix rot oder vom Buendel
 * abhaengig. Ohne Wurf (getNPCIcon umbenannt, keine globale Funktion mehr,
 * Liste nicht gezeichnet) scheitert der Fall dort, statt still gruen zu
 * werden.
 *
 * DIE VORSCHAU (`_npcgAktuell`) zu verbrauchen IST die Sperre des Fixes —
 * und von aussen nicht zu sehen, sobald das Fenster weg ist: der zweite
 * Klick faellt dann auf den Hintergrund, keine Bedienung erreicht die alte
 * Vorschau noch. Ohne Ablesung blieb sie fuer diese Datei unsichtbar
 * (gemessen in der Nachpruefung an einer Mutante, die das Fenster entfernt,
 * `_npcgAktuell = null` aber streicht: alle elf Faelle gruen, nur der
 * Unit-Test sah es). Darum liest ablesen() sie ab — `var` auf oberster Ebene,
 * also `window._npcgAktuell`, in beiden Buendeln unter diesem Namen —, hart
 * vorbedingt in generatorBereit(): nach dem Oeffnen ist sie ablesbar und
 * traegt den angezeigten Namen, sonst urteilte die Zusage ueber nichts.
 * Geurteilt wird weich: nach dem Speichern ist sie null (vorschauVerbraucht(),
 * in W2 und W3 schon nach der ersten Bedienung, in K1/K2 auch heil).
 *
 * WIE DIE FAELLE URTEILEN: weich (jede gebrochene Zusage wird genannt) an D,
 * am Speicher (`npcs` in localStorage, abgelesen, sobald er D eingeholt hat —
 * save() entprellt), am Undo-Stapel, am DOM (Fenster im DOM ja/nein), an der
 * Vorschau (`_npcgAktuell`, siehe oben) und an den Meldungen des
 * Ereignis-Logs; alles gegen den Stand VOR der Bedienung
 * gezaehlt. Die Meldungen zaehlt ein MutationObserver aus dem Init-Skript
 * beim Einhaengen (`.event-log-entry <typ>`), samt `checkVisibility()` im
 * selben Augenblick — ein Eintrag verblasst nach gut 2 s, gezaehlt wird er
 * trotzdem. Die fremde Info "Ungesicherte Aenderungen — Backup
 * herunterladen?" (einmal je Sitzung nach dem ersten Speichern, file://)
 * zaehlt nirgends mit. Am Ende jedes Falls: kein Fehler ausser dem
 * Pruefwurf (in den Kontrollen: gar keiner; W7 siehe ERWARTET_START).
 *
 * VOR DER ERSTEN BEDIENUNG liegt unter der Mitte von "Als NPC speichern" der
 * Knopf selbst (harte Vorbedingung, knopfFrei()). Am Telefon liegt jede
 * Meldung des Ereignis-Logs genau dort — gemessen beim Schreiben: Klick und
 * Tipp trafen die fremde Info, nichts wurde gespeichert, und ohne diese
 * Pruefung urteilte ein Fall ueber einen Klick, der den Knopf nie erreichte.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE FAELLE, gemessen mit dieser Datei am Basisstand b1fc7da6 (Kopf von #22),
 * Chromium, dev- und prod-Buendel, drei Worker — rot jeweils an den Zusagen,
 * keiner an einer Vorbedingung; ausser W4 jeder Fehlerpfad-Fall auch an der
 * Vorschau (`_npcgAktuell` bleibt gesetzt; nachgemessen, als die Ablesung
 * dazukam — K1/K2 auch damit gruen):
 *
 *   W1  1440, dev, mouse.dblclick            rot: 2 → 4, Undo 2, Speicher
 *                                            4, Fenster offen, 0 Erfolgs-,
 *                                            0 Fehlermeldungen
 *   W2  1440, Klick – 800 ms – Klick         rot: nach dem ersten 3 und das
 *                                            Fenster offen, dann 4
 *   W3e Tab bis zum Knopf, zweimal Enter     rot: nach dem ersten Druck
 *   W3l Tab bis zum Knopf, zweimal Leertaste Fenster offen, dann 2 → 4
 *   W4  W1, dann page.reload()               rot: 4 bleiben, der Name zweimal
 *   W5m 390x844, mouse.dblclick              rot: 2 → 4
 *   W5t 390x844, Touch: Tipp – 300 ms – Tipp rot: 3 → 5 (nach dem Vorlauf)
 *   W6  prod-Buendel wie W1                  rot: 2 → 4
 *   W7  Palette aus Start, dblclick          rot: 2 → 4
 *   K1  heil, dev, dblclick (Kontrolle)      gruen
 *   K2  heil, prod, dblclick (Kontrolle)     gruen
 *
 * W5t: KEIN schneller Doppeltipp — bei 50–120 ms erzeugt der zweite Tipp
 * kein click, das ergab schon vor dem Fix +1; der Fall prueft den Abstand
 * der Tipps in der Seite. Und die fremde Info darf nicht ZWISCHEN den Tipps
 * kommen: sie kommt nach dem ersten Speichern der Sitzung, und kaeme sie mit
 * dem ersten Tipp des Falls, laege sie beim zweiten ueber dem Knopf (gemessen
 * T500: +1, vor dem Fix still gruen). Darum speichert ein VORLAUF heil einen
 * NPC per Tipp, die Info kommt dort (harte Vorbedingung), und knopfFrei()
 * wartet, bis sie verblasst ist.
 *
 * W6 und K2 brauchen dist/dnd-tracker-optimized.html (`python build.py
 * --production`). Der e2e-Job der CI baut nur das dev-Buendel; dort werden
 * beide uebersprungen (sichtbar als "skipped", mit Grund). Den Unterschied,
 * auf den es ankommt (DEBUG_MODE: safeRender wirft im dev-Buendel erneut,
 * im prod-Buendel nicht), prueft der Unit-Test in BEIDEN Stellungen auch in
 * der CI. Dass wirklich das jeweilige Buendel geladen ist, ist eine harte
 * Vorbedingung (`APP_CONFIG.DEBUG_MODE`).
 *
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei): saveGeneratedNPC() in
 * Kopien beider Buendel ersetzt, alle elf Faelle gefahren, dazu der
 * Unit-Test an derselben Fassung des Moduls:
 *   eigener catch, Verbrauchen und Schliessen   alle 11 gruen, Unit 6/6;
 *   im finally um save(), Erfolg, Zeichnen      npc-generator.spec.js 8/8,
 *   zuletzt (der Vertrag)                       ruecksprung-rundlauf (12) und
 *                                               npc-formular (16) gruen
 *   ebenso mit safeRender als LETZTER           alle 11 gruen, Unit 6/6
 *   Anweisung
 *   ebenso mit Fokus-Rueckgabe an "🎲 Generator" alle 11 gruen (W3!)
 *   R1-Reihenfolge woertlich, ohne finally      alle 11 gruen — nur der Unit-
 *   um save()                                   Fall "save() wirft" rot
 *   Fenster entfernt, `_npcgAktuell = null`     ohne Ablesung der Vorschau
 *   gestrichen (Nachpruefung, Mutante m13)      alle 11 gruen, nur der Unit-
 *                                               Test sah es; mit ihr 10 rot,
 *                                               jeder NUR an der Vorschau
 *                                               (W4 liest sie nicht: gruen)
 *   Zeitflag wie createCampaign, im finally     W1–W7 rot wie vorher
 *   zurueckgesetzt
 *   nur die Vorschau sofort verbrauchen,        rot an Fenster und Meldungen
 *   Reihenfolge sonst wie vorher                (D +1); W4 gruen
 *   safeRender mit Standard-rethrowInDebug,     dev rot, W6 (prod) GRUEN — der
 *   Schliessen und Erfolg danach                Unterschied, den W6 allein
 *                                               nicht saehe
 *   saveNPC-Reihenfolge (schliessen,            rot am Speicher und an den
 *   zeichnen, DANN save())                      Meldungen; W4 gruen
 *   (B) zurueckrollen / (C) Knopf sperren       rot
 *   renderNPCList faengt SELBST, mit Log und    alle gruen, auch (12) — am
 *   Meldung (gegen R3)                          Verhalten nicht unterscheidbar;
 *                                               R3 bleibt eine Regel der
 *                                               Durchsicht. Schweigt der catch,
 *                                               sind W1–W7 und (12) rot an der
 *                                               Vorbedingung
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD (Vertrag, "Nicht im PR")
 *
 * - Wohin der zweite Klick im heilen Fall faellt. Er trifft den Hintergrund
 *   und loest dort aus, was dort liegt (gemessen: Kampfzeile, Generator-Knopf
 *   der Startseite, ein anderer NPC). Das gilt fuer die ganze App
 *   (close-modal-overlay und hideModal schliessen synchron) — eigener
 *   Katalogpunkt. Die Kontrollen behaupten darum NICHT, der zweite Klick
 *   treffe ein Element ohne data-action; nach dem Fix gilt dasselbe fuer die
 *   Fehlerpfad-Faelle (W7: ERWARTET_START).
 * - Die Fokus-Rueckgabe an "🎲 Generator" nach dem Speichern. Eigener PR fuer
 *   alle Schliesswege. W3 prueft das Fenster deshalb nur nach dem ERSTEN
 *   Druck; nach dem zweiten D, Speicher, Undo und Meldungen — kaeme die
 *   Rueckgabe, oeffnete der zweite Druck den Generator neu, und das ist dann
 *   richtig (an der Fix-Skizze mit Rueckgabe gemessen: W3 gruen).
 * - Die Ursachen der Wuerfe selbst (NPC-NAME), renderNPCList total machen,
 *   save() nach dem Zeichnen in saveNPC, die Info-Meldung ueber dem Knopf am
 *   Telefon, Escape blendet den Generator nur aus.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const DIST = `${process.cwd().replace(/\\/g, '/')}/dist`;
const DEV_URL = `file:///${DIST}/dnd-tracker-bundled.html`;
const PROD_PFAD = `${DIST}/dnd-tracker-optimized.html`;
const PROD_URL = `file:///${PROD_PFAD}`;
const PROD_FEHLT = !fs.existsSync(PROD_PFAD);
const PROD_GRUND =
    'prod-Buendel fehlt (dist/dnd-tracker-optimized.html) — vorher python build.py --production';

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };
/** Telefon — wie die Messung (M1/M3, U7, T300). */
const TELEFON = { width: 390, height: 844 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Der Ausloeser: getNPCIcon() wirft mit diesem Text (siehe Kopf). */
const PRUEFWURF = 'Pruefwurf GENERATOR-DOPPELT';

/** Die Pause zwischen den beiden Tipps von W5t: wie die Messung (T300).
 *  Kuerzer (50–120 ms) erzeugt der zweite Tipp kein click. */
const TIPP_PAUSE_MS = 300;

/** Pause nach dem Tipp, der den Generator oeffnet (siehe generatorOeffnen()). */
const TIPP_NACH_OEFFNEN_MS = 600;

/** WEICHE Zusicherungen fuer die Zusagen: ein roter Lauf soll JEDE
 *  gebrochene nennen. Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

// ===========================================================================
// SAAT UND LADEN
// ===========================================================================

/** Zwei benannte NPCs. Keiner der beiden Namen steht in den Namenstabellen
 *  des Generators (NPC_DEFAULT_TABLES); gezaehlt wird der Name ohnehin gegen
 *  den Stand vorher (genauEinNpc()). Den Pfad der Tabellen-Datei nennt diese
 *  Datei bewusst nicht: module-test-coverage.test.js zaehlte die Nennung als
 *  Abdeckung, und die Datei steht dort zu Recht auf der Ausnahmeliste. */
const NPCS = [
    { id: 1, name: 'Zed', role: 'Wirt', description: '' },
    { id: 2, name: 'Mara', role: 'Bettler', race: 'Mensch', description: '' }
];

function seed() {
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
        npcs: NPCS,
        locations: [],
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
        quickRefCustom: []
    };
    s._nextId = {
        characters: 1,
        npcs: 3,
        locations: 1,
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
 * Wie waitForAppReady() (tests/e2e/helpers/test-utils.js), nur `.app-title`
 * lediglich im DOM statt sichtbar: am Telefon direkt schmal geladen ist er
 * verborgen (npc-altdaten.spec.js, TELEFON). Die Messung lud das Telefon
 * direkt schmal, ebenso W5m/W5t — `isMobile` laesst sich nicht nachtraeglich
 * schalten.
 * @param {import('@playwright/test').Page} page
 */
async function bereit(page) {
    await page.waitForSelector('.app-title', { state: 'attached', timeout: 15000 });
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true', null, {
        timeout: 15000
    });
}

/**
 * Laedt, saet EINMAL je Tab (sessionStorage-Sperre: ein `page.reload()` liest
 * dann, was die App gespeichert hat) und haengt die Ableser ein:
 * - `__meldungen`: jede Meldung des Ereignis-Logs beim Einhaengen, mit Typ,
 *   Text und `checkVisibility()` im selben Augenblick;
 * - `__tipps`: der Zeitpunkt jedes `touchstart` (nur W5t liest ihn).
 * Beides nur Ablesen — es greift in keinen Ablauf der App ein.
 * @param {import('@playwright/test').Page} page
 * @param {{ url?: string, viewport?: { width: number, height: number } }} [optionen]
 */
async function laden(page, { url = DEV_URL, viewport = BREIT } = {}) {
    await page.setViewportSize(viewport);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('generator-doppelt-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('generator-doppelt-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
            /** @type {any} */
            const w = window;
            w.__meldungen = [];
            new MutationObserver(aenderungen => {
                for (const a of aenderungen) {
                    for (const n of a.addedNodes) {
                        if (n instanceof HTMLElement && n.classList.contains('event-log-entry')) {
                            const typ = [...n.classList].find(k => k !== 'event-log-entry') || '';
                            const text = n.querySelector('.event-log-message')?.textContent || '';
                            w.__meldungen.push({ typ, text, sichtbar: n.checkVisibility() });
                        }
                    }
                }
            }).observe(document, { childList: true, subtree: true });
            w.__tipps = [];
            window.addEventListener('touchstart', () => w.__tipps.push(performance.now()), true);
        },
        [SPEICHER, seed()]
    );
    await page.goto(url);
    await bereit(page);
    // Die fremde Speicherung nach load() abwarten (wie ruecksprung-rundlauf):
    // sonst schreibt sie spaeter den ganzen Stand aus D, und ein Speicher-Fall
    // liest, was sie hinterliess, statt was der Weg schrieb.
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
    expect(
        await page.evaluate(() => window.D.npcs.length),
        'Vorbedingung: die Saat ist angekommen'
    ).toBe(NPCS.length);
}

// ===========================================================================
// FEHLER EINSAMMELN (wie npc-altdaten.spec.js)
// ===========================================================================

/**
 * Faengt jeden Fehler des Falls: `pageerror`, `console.error` und das
 * Fehlerlog der App. "Failed to load resource" ist Netzrauschen (Schriften
 * unter file://). Eine `console.error`-Zeile wird aus ihren ARGUMENTEN
 * gebaut (ein Error ueber `String(error)`), nicht aus `m.text()` — der gibt
 * den Error-Parameter je Engine anders aus (npc-altdaten.spec.js, 00ecfee3).
 * Das Fehlerlog lebt im Speicher der Seite — `sichern()` liest es VOR dem
 * Neuladen.
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    /** @type {string[]} */
    const gesichert = [];
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
    const appLog = () =>
        page.evaluate(() =>
            (window.ErrorHandler?.getRecentErrors(50) || []).map(
                e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`
            )
        );
    return {
        /** Das Fehlerlog der App festhalten, bevor ein Neuladen es leert. */
        async sichern() {
            await Promise.all(offen);
            gesichert.push(...(await appLog()));
        },
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            await Promise.all(offen);
            return [...fehler, ...gesichert, ...(await appLog())];
        }
    };
}

/**
 * Am Ende jedes Falls: kein Fehler ausser denen, die den Pruefwurf-Text
 * tragen (in den Kontrollen: gar keiner), und den ausdruecklich erwarteten.
 * @param {ReturnType<typeof fehlerFangen>} fehler
 * @param {boolean} pruefwurfErlaubt
 * @param {RegExp[]} [erwartet]
 */
async function keinFehlerAusser(fehler, pruefwurfErlaubt, erwartet = []) {
    const alle = await fehler.alle();
    weich(
        alle.filter(
            z => !(pruefwurfErlaubt && z.includes(PRUEFWURF)) && !erwartet.some(r => r.test(z))
        ),
        pruefwurfErlaubt ? 'kein Fehler ausser dem Pruefwurf' : 'kein Fehler'
    ).toEqual([]);
}

/** W7, erlaubt, nicht verlangt: nach dem Fix schliesst der erste Klick des
 *  Doppelklicks das Fenster, und der zweite faellt auf der Startseite auf
 *  den Schnellknopf "🎲 Generator" darunter (`show-generator-modal`, der
 *  Zufallsgenerator, nicht der NPC-Generator) — das Durchklicken, das der
 *  Vertrag ausdruecklich aus dem PR nimmt (gemessen als U2). Dessen erstes
 *  Oeffnen meldet `$()` im DEBUG_MODE "Element not found: #generator-modal"
 *  (dasselbe Muster wie `#rest-modal` in ruecksprung-rundlauf.spec.js).
 *  Gemessen an der Fix-Skizze; vor dem Fix trifft der zweite Klick den noch
 *  offenen Knopf, und die Meldung fehlt. */
const ERWARTET_START = [/Element not found: #generator-modal$/];

// ===========================================================================
// BEDIENEN UND ABLESEN
// ===========================================================================

/** @typedef {import('@playwright/test').Page} Page */

/**
 * Zum NPC-Reiter, wie ein Nutzer: breit ueber den Reiter (Gruppe erst
 * oeffnen), am Telefon ueber die NPC-Kachel der Startseite (die
 * Kopfnavigation ist dort ein Klappmenue; derselbe Weg wie die Messung).
 * @param {Page} page
 */
async function zuNpcs(page) {
    if (await page.locator('.mobile-nav-toggle').isVisible()) {
        await page.getByRole('button', { name: /^\d+ NPCs$/ }).click();
    } else {
        await navigateToTab(page, 'npcs');
    }
    await expect(page.locator('#view-npcs')).toBeVisible();
}

/**
 * Vorbedingung der Telefon-Faelle: das Layoutprofil folgt der Fenstergroesse.
 * @param {Page} page
 */
async function telefonLayout(page) {
    await expect(page.locator('html'), 'Vorbedingung: das Telefon-Layout greift').toHaveAttribute(
        'data-layout',
        'mobile'
    );
}

/**
 * Der Ausloeser (siehe Kopf): getNPCIcon() wirft ab jetzt bis zum Neuladen.
 * @param {Page} page
 */
async function injizieren(page) {
    await page.evaluate(wurf => {
        /** @type {any} */ (window).getNPCIcon = () => {
            throw new Error(wurf);
        };
    }, PRUEFWURF);
}

/** @param {Page} page */
function speichernKnopf(page) {
    return page.locator('#npc-generator-modal [data-action="save-generated-npc"]');
}

/**
 * "🎲 Generator" im NPC-Reiter; gibt den Namen der Vorschau und die Mitte
 * von "Als NPC speichern" zurueck.
 * @param {Page} page
 * @param {{ tippen?: boolean }} [optionen]
 */
async function generatorOeffnen(page, { tippen = false } = {}) {
    const ausloeser = page.locator('#view-npcs [data-action="show-npc-generator"]');
    if (tippen) {
        await ausloeser.tap();
        // Ein Finger tippt nicht binnen Millisekunden nach dem Oeffnen auf
        // den naechsten Knopf. Gemessen mit isMobile: ein Tipp auf "Als NPC
        // speichern" kurz nach dem oeffnenden Tipp erzeugte kein click, erst
        // der naechste (Doppeltipp-Erkennung von Chromium) — der Vorlauf von
        // W5t speicherte dann nicht.
        await page.waitForTimeout(TIPP_NACH_OEFFNEN_MS);
    } else {
        await ausloeser.click();
    }
    return generatorBereit(page);
}

/**
 * Wartet auf den offenen Generator; Name der Vorschau und Mitte des Knopfs.
 * @param {Page} page
 */
async function generatorBereit(page) {
    await expect(page.locator('#npc-generator-modal')).toBeVisible();
    const knopf = speichernKnopf(page);
    await expect(knopf).toBeVisible();
    const name = ((await page.locator('.npcg-preview-name').textContent()) || '').trim();
    expect(name, 'Vorbedingung: die Vorschau zeigt einen Namen').not.toBe('');
    expect(
        (await ablesen(page)).vorschau,
        'Vorbedingung: die Vorschau ist ablesbar (_npcgAktuell, globale Variable des Buendels) und ist die angezeigte — sonst urteilte vorschauVerbraucht() ueber nichts'
    ).toBe(name);
    const box = await knopf.boundingBox();
    if (!box) throw new Error('Vorbedingung: "Als NPC speichern" hat keine Lage');
    const mitte = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await knopfFrei(page, mitte);
    return { name, mitte };
}

/**
 * Vor der ersten Bedienung liegt unter der Mitte von "Als NPC speichern" der
 * Knopf selbst. Am Telefon liegt jede Meldung des Ereignis-Logs (unten
 * mittig, `pointer-events: auto`) GENAU dort — gemessen mit Maus und Touch:
 * Klick und Tipp trafen `div.event-log-entry.info` bzw. `.event-log-time`,
 * und nichts wurde gespeichert. Die Meldung, die dort liegt, ist die fremde
 * Info nach dem ersten Speichern der Sitzung (file://,
 * systems/file-backup/file-backup-manager.js onAfterSave, einmal je
 * Sitzung), die das Laden ausloest. Darum warten, bis keine Meldung mehr im
 * Log steht (eine lebt gut 2,4 s), dann hart pruefen — sonst urteilte ein
 * Fall ueber einen Klick, der den Knopf nie erreichte.
 * @param {Page} page
 * @param {{ x: number, y: number }} mitte
 */
async function knopfFrei(page, mitte) {
    await expect(
        page.locator('#event-log .event-log-entry'),
        'Vorbedingung: keine Meldung mehr ueber dem Fenster'
    ).toHaveCount(0, { timeout: 8000 });
    expect(
        await page.evaluate(
            m =>
                !!document
                    .elementFromPoint(m.x, m.y)
                    ?.closest('#npc-generator-modal [data-action="save-generated-npc"]'),
            mitte
        ),
        'Vorbedingung: unter der Mitte liegt "Als NPC speichern"'
    ).toBe(true);
}

/**
 * Was der Nutzer sieht und behaelt — nur Ablesen.
 * @param {Page} page
 */
function ablesen(page) {
    return page.evaluate(
        ({ schluessel, wurf }) => {
            /** @type {any} */
            const w = window;
            let gespeichert = null;
            try {
                const g = JSON.parse(localStorage.getItem(schluessel) || '{}');
                gespeichert = Array.isArray(g.npcs) ? g.npcs.length : null;
            } catch {
                gespeichert = null;
            }
            return {
                npcs: w.D.npcs.length,
                /** @type {unknown[]} */
                namen: w.D.npcs.map((/** @type {any} */ n) => n.name),
                gespeichert,
                undo: typeof undoStack !== 'undefined' ? undoStack.length : null,
                fensterImDom: !!document.getElementById('npc-generator-modal'),
                // Die Vorschau selbst (R1, siehe DIE VORSCHAU im Kopf): `var`
                // auf oberster Ebene des Buendels, also eine Eigenschaft von
                // window. 'fehlt' = nicht ablesbar (umbenannt, gekapselt) —
                // daran scheitert die Vorbedingung in generatorBereit().
                /** @type {string | null} */
                vorschau: !('_npcgAktuell' in w)
                    ? 'fehlt'
                    : w._npcgAktuell === null
                      ? null
                      : String(w._npcgAktuell?.name ?? ''),
                /** @type {{ typ: string, text: string, sichtbar: boolean }[]} */
                meldungen: (w.__meldungen || []).slice(),
                pruefwuerfe: (w.ErrorHandler?.getRecentErrors(50) || []).filter(
                    (/** @type {any} */ e) => String(e.message || '').includes(wurf)
                ).length
            };
        },
        { schluessel: SPEICHER, wurf: PRUEFWURF }
    );
}

/**
 * Wartet, bis der Speicher D eingeholt hat (save() entprellt 300 ms), und
 * liest dann ab. Holt er nicht auf (nichts gespeichert), wird nach SOFORT_MS
 * trotzdem abgelesen — die Zusage "im Speicher" nennt den Unterschied.
 * @param {Page} page
 */
async function ablesenGespeichert(page) {
    await page
        .waitForFunction(
            schluessel => {
                try {
                    const g = JSON.parse(localStorage.getItem(schluessel) || '{}');
                    return Array.isArray(g.npcs) && g.npcs.length === window.D.npcs.length;
                } catch {
                    return false;
                }
            },
            SPEICHER,
            { timeout: SOFORT_MS }
        )
        .catch(() => {});
    return ablesen(page);
}

/** @typedef {Awaited<ReturnType<typeof ablesen>>} Stand */

/**
 * DIE VORBEDINGUNG jedes Fehlerpfad-Falls (siehe Kopf): der Pruefwurf steht
 * im Fehlerlog — nur sein TEXT zaehlt, nicht Funktion oder Kontext.
 * @param {Stand} stand
 * @param {string} wann
 */
function vorbedingungWurf(stand, wann) {
    expect(
        stand.pruefwuerfe,
        `Vorbedingung: ${wann} steht der Pruefwurf im Fehlerlog — sonst prueft dieser Fall den Fehlerpfad nicht (getNPCIcon() umbenannt, keine globale Funktion mehr, oder die Liste wird nicht gezeichnet?)`
    ).toBeGreaterThanOrEqual(1);
}

/**
 * Genau EIN NPC mehr — in D, unter seinem Namen, im Speicher, im Undo. Alles
 * gegen `vorher` gezaehlt: der Generator kann einen Namen ziehen, den ein
 * frueher gespeicherter NPC schon traegt (W5t speichert im Vorlauf einen).
 * @param {Stand} nachher
 * @param {Stand} vorher
 * @param {string} name
 * @param {string} wann
 */
function genauEinNpc(nachher, vorher, name, wann) {
    /** @param {Stand} stand */
    const mitNamen = stand => stand.namen.filter(n => n === name).length;
    weich(nachher.npcs, `${wann}: genau ein NPC mehr in D`).toBe(vorher.npcs + 1);
    weich(mitNamen(nachher), `${wann}: genau ein "${name}" mehr in D`).toBe(mitNamen(vorher) + 1);
    weich(nachher.gespeichert, `${wann}: genau ein NPC mehr im Speicher`).toBe(vorher.npcs + 1);
    weich(nachher.undo, `${wann}: genau ein Undo-Eintrag mehr`).toBe((vorher.undo ?? 0) + 1);
}

/**
 * Die NEUEN Meldungen (seit `vorher`) sind die des Vertrags: genau eine
 * Erfolgsmeldung "<Name> als NPC gespeichert" (R2/R5); im Fehlerpfad
 * mindestens eine sichtbare Fehlermeldung (R2), in den Kontrollen keine.
 * @param {Stand} nachher
 * @param {Stand} vorher
 * @param {string} name
 * @param {string} wann
 * @param {boolean} fehlerpfad
 */
function gemeldet(nachher, vorher, name, wann, fehlerpfad) {
    const neu = nachher.meldungen.slice(vorher.meldungen.length);
    weich(
        neu.filter(m => m.typ === 'success' && m.text === `${name} als NPC gespeichert`).length,
        `${wann}: genau eine Meldung "${name} als NPC gespeichert"`
    ).toBe(1);
    const fehlermeldungen = neu.filter(m => m.typ === 'error');
    if (fehlerpfad) {
        weich(
            fehlermeldungen.filter(m => m.sichtbar).length,
            `${wann}: mindestens eine sichtbare Fehlermeldung (Meldung vom Typ error) — die Liste konnte nicht gezeichnet werden`
        ).toBeGreaterThanOrEqual(1);
    } else {
        weich(fehlermeldungen, `${wann}: keine Fehlermeldung`).toEqual([]);
    }
}

/**
 * R1, die Sperre selbst: die gespeicherte Vorschau ist verbraucht
 * (`_npcgAktuell === null`). Von aussen nicht zu sehen, sobald das Fenster
 * weg ist — darum abgelesen (siehe DIE VORSCHAU im Kopf).
 * @param {Stand} nachher
 * @param {string} wann
 */
function vorschauVerbraucht(nachher, wann) {
    weich(
        nachher.vorschau,
        `${wann}: die gespeicherte Vorschau ist verbraucht (_npcgAktuell === null, R1)`
    ).toBe(null);
}

/**
 * Das Fenster ist zu und die Vorschau verbraucht (R1), und die Meldungen
 * sind die des Vertrags.
 * @param {Stand} nachher
 * @param {Stand} vorher
 * @param {string} name
 * @param {string} wann
 * @param {boolean} fehlerpfad
 */
function fensterZuUndGemeldet(nachher, vorher, name, wann, fehlerpfad) {
    weich(nachher.fensterImDom, `${wann}: #npc-generator-modal nicht mehr im DOM`).toBe(false);
    vorschauVerbraucht(nachher, wann);
    gemeldet(nachher, vorher, name, wann, fehlerpfad);
}

/**
 * Tab, bis "Als NPC speichern" den Fokus hat.
 * @param {Page} page
 */
async function fokusAufSpeichern(page) {
    const knopf = speichernKnopf(page);
    for (let i = 0; i < 15; i++) {
        if (await knopf.evaluate(el => el === document.activeElement)) break;
        await page.keyboard.press('Tab');
    }
    await expect(knopf, 'Vorbedingung: Tab erreicht "Als NPC speichern"').toBeFocused();
}

/**
 * Der Kern von W1, W4, W5m, W6: NPC-Reiter, Pruefwurf, Generator,
 * Doppelklick auf die Mitte von "Als NPC speichern".
 * @param {Page} page
 */
async function doppelklickMitWurf(page) {
    await zuNpcs(page);
    await injizieren(page);
    const { name, mitte } = await generatorOeffnen(page);
    const vorher = await ablesen(page);
    await page.mouse.dblclick(mitte.x, mitte.y);
    const nachher = await ablesenGespeichert(page);
    vorbedingungWurf(nachher, 'nach dem Doppelklick');
    return { name, vorher, nachher };
}

// ===========================================================================
// DER FEHLERPFAD — rot vor dem Fix
// ===========================================================================

test('W1 1440, dev: Doppelklick auf "Als NPC speichern" bei werfender Liste legt genau einen NPC an', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    const { name, vorher, nachher } = await doppelklickMitWurf(page);
    genauEinNpc(nachher, vorher, name, 'nach dem Doppelklick');
    fensterZuUndGemeldet(nachher, vorher, name, 'nach dem Doppelklick', true);
    await keinFehlerAusser(fehler, true);
});

test('W2 1440, dev: Klick – 800 ms – Klick — schon der erste Klick schliesst, der zweite legt nichts an', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuNpcs(page);
    await injizieren(page);
    const { name, mitte } = await generatorOeffnen(page);
    const vorher = await ablesen(page);
    await page.mouse.click(mitte.x, mitte.y);
    await page.waitForTimeout(800);
    const nachErstem = await ablesenGespeichert(page);
    vorbedingungWurf(nachErstem, 'nach dem ersten Klick');
    genauEinNpc(nachErstem, vorher, name, 'nach dem ersten Klick');
    weich(
        nachErstem.fensterImDom,
        'nach dem ersten Klick: #npc-generator-modal nicht mehr im DOM'
    ).toBe(false);
    vorschauVerbraucht(nachErstem, 'nach dem ersten Klick');
    // Der Nutzer sieht das offene Fenster und klickt noch einmal.
    await page.mouse.click(mitte.x, mitte.y);
    const nachher = await ablesenGespeichert(page);
    genauEinNpc(nachher, vorher, name, 'nach dem zweiten Klick');
    fensterZuUndGemeldet(nachher, vorher, name, 'nach dem zweiten Klick', true);
    await keinFehlerAusser(fehler, true);
});

for (const [kuerzel, taste, wie] of /** @type {const} */ ([
    ['W3e', 'Enter', 'zweimal Enter'],
    ['W3l', ' ', 'zweimal Leertaste']
])) {
    test(`${kuerzel} 1440, dev: Tab bis zum Knopf, ${wie} — genau ein NPC`, async ({ page }) => {
        const fehler = fehlerFangen(page);
        await laden(page);
        await zuNpcs(page);
        await injizieren(page);
        const { name } = await generatorOeffnen(page);
        await fokusAufSpeichern(page);
        const vorher = await ablesen(page);
        await page.keyboard.press(taste);
        const nachErstem = await ablesen(page);
        vorbedingungWurf(nachErstem, 'nach dem ersten Druck');
        // Fenster und Vorschau nur nach dem ERSTEN Druck: kaeme die
        // Fokus-Rueckgabe an "🎲 Generator" (eigener PR), oeffnete der zweite
        // ihn richtig neu — mit einer neuen Vorschau.
        weich(
            nachErstem.fensterImDom,
            'nach dem ersten Druck: #npc-generator-modal nicht mehr im DOM'
        ).toBe(false);
        vorschauVerbraucht(nachErstem, 'nach dem ersten Druck');
        weich(nachErstem.npcs, 'nach dem ersten Druck: genau ein NPC mehr in D').toBe(
            vorher.npcs + 1
        );
        await page.keyboard.press(taste);
        const nachher = await ablesenGespeichert(page);
        genauEinNpc(nachher, vorher, name, 'nach dem zweiten Druck');
        gemeldet(nachher, vorher, name, 'nach dem zweiten Druck', true);
        await keinFehlerAusser(fehler, true);
    });
}

test('W4 1440, dev: nach dem Doppelklick und dem Neuladen bleibt genau ein NPC mehr', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    const { name, vorher } = await doppelklickMitWurf(page);
    await fehler.sichern();
    await page.reload();
    await waitForAppReady(page);
    const neu = await page.evaluate(schluessel => {
        const g = JSON.parse(localStorage.getItem(schluessel) || '{}');
        return {
            npcs: window.D.npcs.length,
            /** @type {unknown[]} */
            namen: window.D.npcs.map((/** @type {any} */ n) => n.name),
            gespeichert: Array.isArray(g.npcs) ? g.npcs.length : null
        };
    }, SPEICHER);
    weich(neu.npcs, 'nach dem Neuladen: genau ein NPC mehr in D').toBe(vorher.npcs + 1);
    weich(
        neu.namen.filter(n => n === name).length,
        `nach dem Neuladen: genau ein "${name}" mehr in D`
    ).toBe(vorher.namen.filter(n => n === name).length + 1);
    weich(neu.gespeichert, 'nach dem Neuladen: genau ein NPC mehr im Speicher').toBe(
        vorher.npcs + 1
    );
    await keinFehlerAusser(fehler, true);
});

test('W5m 390x844, dev: Doppelklick mit der Maus — genau ein NPC', async ({ page }) => {
    const fehler = fehlerFangen(page);
    await laden(page, { viewport: TELEFON });
    await telefonLayout(page);
    const { name, vorher, nachher } = await doppelklickMitWurf(page);
    genauEinNpc(nachher, vorher, name, 'nach dem Doppelklick');
    fensterZuUndGemeldet(nachher, vorher, name, 'nach dem Doppelklick', true);
    await keinFehlerAusser(fehler, true);
});

test.describe('Telefon mit Touch', () => {
    test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

    test('W5t 390x844, dev, Touch: Tipp – 300 ms – Tipp — genau ein NPC', async ({ page }) => {
        const fehler = fehlerFangen(page);
        await laden(page, { viewport: TELEFON });
        await telefonLayout(page);
        await zuNpcs(page);
        // VORLAUF, heil: ein NPC wird per Tipp gespeichert. Das ist die erste
        // Speicherung der Sitzung, und nach ihr kommt EINMAL je Sitzung die
        // fremde Info (file://, onAfterSave), die am Telefon ueber dem Knopf
        // liegt. Kaeme sie erst mit dem ersten Tipp des Falls (save()
        // entprellt 300 ms), laege sie beim zweiten ueber dem Knopf, und der
        // Fall waere vor dem Fix still gruen (gemessen T500: +1). So ist sie
        // vorher da — und knopfFrei() wartet, bis sie verblasst ist.
        const vorlauf = await generatorOeffnen(page, { tippen: true });
        await speichernKnopf(page).tap();
        await expect(
            page.locator('#npc-generator-modal'),
            'Vorbedingung: der Vorlauf hat heil gespeichert und das Fenster geschlossen'
        ).toHaveCount(0);
        await expect
            .poll(
                async () =>
                    (await ablesen(page)).meldungen.some(
                        m => m.typ === 'info' && m.text.includes('Backup herunterladen')
                    ),
                {
                    message: `Vorbedingung: nach dem Vorlauf ("${vorlauf.name}") kam die einmalige Info der Sitzung`,
                    timeout: SOFORT_MS
                }
            )
            .toBe(true);
        await injizieren(page);
        const { name, mitte } = await generatorOeffnen(page, { tippen: true });
        const vorher = await ablesenGespeichert(page);
        const tippsVorher = await page.evaluate(() => /** @type {any} */ (window).__tipps.length);
        await page.touchscreen.tap(mitte.x, mitte.y);
        await page.waitForTimeout(TIPP_PAUSE_MS);
        await page.touchscreen.tap(mitte.x, mitte.y);
        /** @type {number[]} */
        const tipps = await page.evaluate(
            n => /** @type {any} */ (window).__tipps.slice(n),
            tippsVorher
        );
        expect(tipps.length, 'Vorbedingung: beide Tipps kamen in der Seite an').toBe(2);
        expect(
            tipps[1] - tipps[0],
            `Vorbedingung: mindestens ${TIPP_PAUSE_MS - 50} ms zwischen den Tipps — ein schneller Doppeltipp erzeugt beim zweiten kein click (gemessen 50–120 ms: +1 schon vor dem Fix)`
        ).toBeGreaterThanOrEqual(TIPP_PAUSE_MS - 50);
        const nachher = await ablesenGespeichert(page);
        vorbedingungWurf(nachher, 'nach den Tipps');
        genauEinNpc(nachher, vorher, name, 'nach den Tipps');
        fensterZuUndGemeldet(nachher, vorher, name, 'nach den Tipps', true);
        await keinFehlerAusser(fehler, true);
    });
});

test('W6 1440, prod: Doppelklick bei werfender Liste legt genau einen NPC an', async ({ page }) => {
    test.skip(PROD_FEHLT, PROD_GRUND);
    const fehler = fehlerFangen(page);
    await laden(page, { url: PROD_URL });
    expect(
        await page.evaluate(() => window.APP_CONFIG?.DEBUG_MODE),
        'Vorbedingung: das prod-Buendel ist geladen (DEBUG_MODE aus)'
    ).toBe(false);
    const { name, vorher, nachher } = await doppelklickMitWurf(page);
    genauEinNpc(nachher, vorher, name, 'nach dem Doppelklick');
    fensterZuUndGemeldet(nachher, vorher, name, 'nach dem Doppelklick', true);
    await keinFehlerAusser(fehler, true);
});

test('W7 1440, dev: Befehlspalette aus Start, "NPC generieren", Doppelklick — genau ein NPC', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page);
    await expect(
        page.locator('#view-dashboard'),
        'Vorbedingung: Start ist die Ansicht'
    ).toBeVisible();
    await page.keyboard.press('Control+Shift+K');
    // Der Fokus kommt verzoegert (setTimeout 50 ms): vorher getippte Zeichen
    // gingen an die Einzeltasten (in der Sonde loesten zwei "r" d20-Wuerfe aus).
    await expect(page.locator('#cp-overlay .cp-input')).toBeFocused();
    await page.keyboard.type('NPC generieren');
    await expect(page.locator('#cp-results-list .cp-result-label').first()).toHaveText(
        'NPC generieren'
    );
    await page.keyboard.press('Enter');
    const { name, mitte } = await generatorBereit(page);
    await injizieren(page);
    const vorher = await ablesen(page);
    await page.mouse.dblclick(mitte.x, mitte.y);
    const nachher = await ablesenGespeichert(page);
    vorbedingungWurf(nachher, 'nach dem Doppelklick');
    genauEinNpc(nachher, vorher, name, 'nach dem Doppelklick');
    fensterZuUndGemeldet(nachher, vorher, name, 'nach dem Doppelklick', true);
    await keinFehlerAusser(fehler, true, ERWARTET_START);
});

// ===========================================================================
// KONTROLLEN (R5) — gruen vor und nach dem Fix
// ===========================================================================
//
// Ohne Wurf: der erste Klick laeuft ganz durch, das Fenster ist weg, bevor
// der zweite kommt. Wohin der zweite faellt, behaupten die Kontrollen nicht
// (siehe Kopf, "Nicht geprueft").
for (const [kuerzel, url, buendel] of /** @type {const} */ ([
    ['K1', DEV_URL, 'dev'],
    ['K2', PROD_URL, 'prod']
])) {
    test(`${kuerzel} 1440, ${buendel}, heil: Doppelklick — ein NPC, Fenster weg, eine Meldung, kein Fehler (Kontrolle)`, async ({
        page
    }) => {
        test.skip(buendel === 'prod' && PROD_FEHLT, PROD_GRUND);
        const fehler = fehlerFangen(page);
        await laden(page, { url });
        expect(
            await page.evaluate(() => window.APP_CONFIG?.DEBUG_MODE),
            `Vorbedingung: das ${buendel}-Buendel ist geladen`
        ).toBe(buendel === 'dev');
        await zuNpcs(page);
        const { name, mitte } = await generatorOeffnen(page);
        const vorher = await ablesen(page);
        await page.mouse.dblclick(mitte.x, mitte.y);
        const nachher = await ablesenGespeichert(page);
        genauEinNpc(nachher, vorher, name, 'nach dem Doppelklick');
        fensterZuUndGemeldet(nachher, vorher, name, 'nach dem Doppelklick', false);
        await keinFehlerAusser(fehler, false);
    });
}
