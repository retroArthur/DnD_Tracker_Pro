// @ts-check
/**
 * Die Attributfelder des Kreaturen-Editors rechnen ihren Modifikator (KREATUR-ATTRIBUTE)
 * ======================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT: **wer im Kreaturen-Editor eine 18 in STR
 * tippt, sieht daneben "+4"** — sofort, bei jeder Taste, ueber jeden Weg, auf
 * dem ein Wert in das Feld kommt; und weder der Klick ins Feld noch das Tippen
 * schreibt einen Fehler.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND (Katalog BESTIAR-KLICK, Offen (8))
 *
 * Gemessen von Messung und Kritik (Sonden, nicht eingecheckt) am Kopf
 * 543706c6 und an main 4037338d, Chromium, dev- und Produktionsbuendel,
 * 1440x900 und 390x844 mit Taps, nur echte Klicks, Tasten, Taps und Mausrad:
 *
 *   - Neue Kreatur: 18/14/7/3/20/1 in STR/GE/KO/IN/WE/CH getippt — alle sechs
 *     Modifikatoren bleiben "+0", nach dem Tippen wie nach Tab. Pfeil hoch und
 *     runter, Strg+V, der Spinner und das Mausrad aendern den Wert, der
 *     Modifikator bleibt "+0".
 *   - Kreatur bearbeiten: beim Oeffnen stimmt die Anzeige (+4/+2/+1/-1/+0/-2),
 *     danach bleibt der Modifikator des GELADENEN Werts stehen: GE 14 -> 8
 *     zeigt "+2", STR 18 -> 20 zeigt "+4".
 *   - Jeder Klick oder Tap ins Feld schreibt console.error "TypeError: Cannot
 *     read properties of null (reading 'target')", jede Eingabe mit Wert
 *     "Call-Ziel nicht in Whitelist", ein leeres oder ungueltiges Feld ("",
 *     "-", "e") wieder den TypeError — alles auch in ErrorHandler._errorLog.
 *     Im Weg der Messung 24 Eintraege (an main 35), im Weg der Kritik 13.
 *   - Gespeichert wird richtig (geklemmt auf 1–30), der Statblock und der
 *     initBonus bei "Zur Initiative" stimmen. Das Encounter- und das
 *     Party-Formular rechnen mit denselben Tasten richtig und fehlerfrei.
 *
 * DIE URSACHE: die sechs Felder (assets/templates/view-bestiary.html) tragen
 * die generische Knopf-Aktion `data-action="call" data-value="updateBstAttrMod"
 * data-attr="<attr>"`. Bei input/change baut ui/event-delegation.js
 * `ctx.value = target.value || target.dataset.value` — also den GETIPPTEN
 * Wert ("18"), den der call-Handler (ui/actions/ui-actions.js) gegen
 * CALL_ACTION_WHITELIST prueft und ablehnt; ist das Feld leer oder ungueltig,
 * faellt ctx.value auf 'updateBstAttrMod' zurueck, und der Handler ruft
 * `updateBstAttrMod(ctx.id)` = `updateBstAttrMod(null)`, das `.target` von
 * null liest (features/bestiary/bestiary-editor.js). Ein Klick nimmt denselben
 * Weg mit ctx.value = 'updateBstAttrMod' und endet ebenso im TypeError. Kein
 * Ziel des call-Wegs kann ein Eingabefeld bedienen: `call` uebergibt nur
 * ctx.id. Eingefuehrt mit dem Editor in 63b085d9 (2026-06-13); fbb18643 hat
 * den Namen nur mechanisch in die Whitelist uebernommen. Encounter und Party
 * haben je eine eigene Aktion ('update-enc-attr-mod', 'update-attr-mod' in
 * ui/actions/entity-actions.js), die den Attributschluessel aus
 * `ctx.target.dataset.value` liest.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER VERTRAG (Kritik KREATUR-ATTRIBUTE), und welcher Fall welche Regel prueft
 *
 *   R1  Markup: alle sechs Felder tragen `data-action="update-bst-attr-mod"
 *       data-value="<str|dex|con|int|wis|cha>"`; data-attr faellt weg. Kein
 *       Formularfeld traegt mehr `data-action="call"`.
 *                        W9; tests/unit/event-delegation.test.js (U2)
 *   R2  `updateBstAttrMod(attr)` nimmt den Schluessel als Text, kehrt bei einem
 *       fremden Schluessel zurueck, rechnet `parseInt(wert) || 10` und
 *       floor((v-10)/2) mit Vorzeichen ('' / '0' / badInput -> "+0"), schreibt
 *       nur #bst-<attr>-mod (kein D, kein save(), kein saveUndoState());
 *       updateAllBstAttrMods ruft sie mit dem Schluessel; der window-Export
 *       entfaellt.      W1–W4, W7, W8; tests/unit/kreatur-attribute.test.js (U4)
 *   R3  Handler 'update-bst-attr-mod' in ui/actions/entity-actions.js direkt
 *       hinter 'update-enc-attr-mod' (hinter dem JS_MARKEN-Anker :376 von
 *       tests/unit/design-consistency.test.js), liest NUR
 *       ctx.target.dataset.value, nie ctx.value; idempotent fuer input,
 *       change und click.
 *                        W1 (nur input), W2 (Klick), W3 (leer/ungueltig);
 *                        tests/unit/action-registry-collisions.test.js (U1),
 *                        tests/unit/kreatur-attribute.test.js (U1b)
 *   R4  'updateBstAttrMod' verlaesst CALL_ACTION_WHITELIST, kein neuer Eintrag.
 *                        tests/unit/event-delegation.test.js (U3)
 *   R5  Nicht angefasst: ui/event-delegation.js, der call-Handler,
 *       ui/modal-focus.js, systems/avatars.js, die Klemmung 1–30 in
 *       saveBestiary() (features/bestiary/bestiary-crud.js),
 *       renderBestiaryDetail, die Encounter- und Party-Aktionen.  W6, W10
 *   R7  Werte ausserhalb 1–30 (Nutzerentscheidung: Variante a) werden wie im
 *       Encounter- und Party-Formular UNGEKLEMMT angezeigt (35 -> "+12",
 *       -5 -> "-8"); gespeichert wird wie heute geklemmt (35 -> 30, -5 -> 1).
 *                        W3r (Anzeige), W6 (Speichern)
 *
 * DIE FAELLE
 *
 *   W1   nur Tastatur, neue Kreatur: Klick in "Graben", dann je Attribut Tab,
 *        Strg+A, Ziffern — KEIN Klick in ein Attributfeld; Urteil nach dem
 *        Tippen und nach dem Tab. Belegt den input-Pfad allein.
 *   W2   Klickpfad: Klick in jedes Feld, Strg+A, dieselben Werte; der Klick
 *        selbst schreibt keinen Fehler.
 *   W3   Wertwege: Pfeil hoch, zweimal Pfeil runter, Spinner-Klick, Mausrad,
 *        Strg+V, Strg+A+Entf (leer), "-" (badInput), "e" (badInput). Jeder Weg
 *        startet auf einem Wert, dessen Modifikator sich durch den Weg
 *        AENDERT — sonst hielte ein veralteter Wert den Fall gruen. Darum
 *        Pfeil hoch von 19 auf 20 ("+4" -> "+5") statt 18 -> 19 wie in der
 *        Vertragstabelle (beide "+4"), das Mausrad von 11 auf 12 ("+0" ->
 *        "+1"), und vor leer/"-"/"e" steht jeweils 18 ("+4").
 *   W3r  R7: 35 -> "+12", -5 -> "-8", 0 -> "+0".
 *   W4   Bearbeiten "Altwesen": Anzeige beim Oeffnen (Gegenprobe), GE 14 -> 8
 *        per Tab/Strg+A, STR 18 -> 20 per zweimal Pfeil hoch, Abbrechen und
 *        erneut oeffnen: die Anzeige kommt wieder aus D, D ist unveraendert.
 *   W5   Fehlerwaechter: in W1–W4, W7 und W8 je Schritt, dazu ein eigener Fall
 *        vom Laden bis "Kreatur speichern" und "Zur Initiative" (der W6-Weg):
 *        kein console.error, kein pageerror, kein Zuwachs in
 *        ErrorHandler._errorLog, keine Fehlermeldung im Ereignisprotokoll.
 *        Geurteilt wird auf NULL, nicht auf eine Zahl — die Zahl haengt am Weg.
 *   W6   Speichern (Schutz): die geklemmten Werte in D (saveBestiary() in
 *        features/bestiary/bestiary-crud.js: 35 -> 30, -5 -> 1), die
 *        Statblock-Zellen nach erneuter Auswahl, initBonus = GE-Modifikator bei
 *        "Zur Initiative" (addBestiaryToInitiative() in
 *        features/bestiary/bestiary-actions.js); Tippen veraendert D nicht.
 *        Neu und bearbeitet. Damit sind beide Module abgedeckt und aus
 *        MODULE_TEST_EXCEPTIONS gestrichen (Vertrag R8).
 *   W7   Telefon 390x844 (isMobile, hasTouch): Ansicht ueber ☰, Taps, W1-Werte,
 *        Speichern per Tap (mindestens 300 ms nach dem letzten Tap, sonst
 *        schluckt die Doppeltipp-Sperre in systems/avatars.js den Tap —
 *        Nebenbefund (b), nicht Teil dieses Falls).
 *   W8   Produktionsbuendel: W1 + W5.
 *   W9   Klasse am Buendel: kein input/select/textarea mit data-action="call".
 *   W10  Gegenproben: Encounter- und Party-Formular rechnen mit denselben
 *        Tasten +4/+2/-2/-4/+5/-5 fehlerfrei; Enter im Attributfeld laesst den
 *        Editor offen und schreibt keinen Fehler.
 *
 * NICHT IN DIESER DATEI (je ein eigener Katalogeintrag, Vertrag R6): (a) die
 * Detailtafel bleibt nach "Kreatur speichern" im Bearbeiten-Modus veraltet —
 * darum liest W6 den Statblock erst nach ERNEUTER Auswahl; (b) die
 * Doppeltipp-Sperre in systems/avatars.js; (c) Tab im Modal markiert den
 * Feldinhalt nicht (ui/modal-focus.js ruft nur focus()): "10", Tab, "18"
 * ergibt "1810". Darum druecken alle Faelle nach jedem Tab Strg+A, und keiner
 * schreibt das Anhaengen fest.
 *
 * WIE GEURTEILT WIRD: am DOM — #bst-<attr>-mod direkt nach der Taste (der
 * Handler laeuft synchron im input-Ereignis), weich je Feld und je Weg, damit
 * ein roter Lauf JEDE falsche Anzeige nennt. Hart sind nur die
 * Vorbedingungen: Fokus nach Tab, Wert im Feld nach der Taste, Layout,
 * Editor offen. `evaluate` saet nur VOR dem Laden (addInitScript: Speicher
 * und ein Beobachter, der Meldungen des Ereignisprotokolls mitschreibt) und
 * liest ab. Die Saat geht wie in npc-suche.spec.js ueber den Speicher:
 * "Altwesen" (eigene Kreatur, 18/14/12/8/10/6).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER ROTE LAUF — diese Datei am Stand 543706c6 (vor dem Fix), Chromium, drei
 * Worker, dev- und Produktionsbuendel, dreimal gefahren. Jedes Mal dasselbe
 * Bild: 10 rot, 5 gruen, 90 gebrochene Zusagen.
 *
 *   W1   rot 18  alle sechs "+0" nach dem Tippen UND nach dem Tab (12); je
 *                Feld "Call-Ziel nicht in Whitelist", eine Zeile je Taste mit
 *                Wert ("18": (1) und (18)) (6)
 *   W2   rot 18  je Klick "TypeError … reading 'target'" (6), alle sechs "+0"
 *                (6), je Eingabe Whitelist-Fehler (6)
 *   W3   rot 13  Pfeil hoch, Pfeil runter, Spinner, Mausrad, Strg+V: "+0" (5)
 *                und Fehler (5); leer, "-", "e" zeigen "+0" (richtig), aber
 *                jedes schreibt "(Action (input): call): TypeError" (3)
 *   W3r  rot  3  35 und -5 zeigen "+0" (2), Fehler (1); "0" -> "+0" stimmt
 *                zufaellig
 *   W4   rot  3  GE 8 zeigt "+2", STR 20 zeigt "+4", Fehler; die Anzeige beim
 *                Oeffnen, Abbrechen (D unveraendert) und erneutes Oeffnen sind
 *                gruen
 *   W5   rot  1  11 console.error und 11 Eintraege im Fehlerlog auf dem Weg;
 *                Laden, Speichern und "Zur Initiative" selbst fehlerfrei, keine
 *                Fehlermeldung im Protokoll
 *   W6   gruen   (zwei Faelle) Schutz: geklemmt gespeichert, Statblock,
 *                initBonus 2 bzw. -1
 *   W7   rot 19  wie W2, mit Taps (18); der ganze Telefonweg: 15 console.error
 *                und 15 Fehlerlog-Eintraege (1); Speichern per Tap richtig
 *   W8   rot 13  wie W1 im Produktionsbuendel (12), Fehler (1)
 *   W9   rot  1  je Buendel: input#bst-str … input#bst-cha -> updateBstAttrMod
 *   W10  gruen   (drei Faelle) Encounter, Party, Enter
 *
 * Unit am selben Stand: 17 rot — U1 (der Schluessel fehlt), U2 (sechs
 * Treffer, assets/templates/view-bestiary.html:183 … :213), U4 elf Faelle (die
 * heutige Signatur liest `.target` von einem Text und schreibt nichts; der
 * window-Export steht noch), U1b vier Faelle (kein Handler). Gruen: U3
 * (122 Eintraege, 122 Ziele, 0 ueberzaehlig), U4 fremder Schluessel (4), kein
 * D/save (1), updateAllBstAttrMods (1). Die volle Jest-Suite: 17 rot, 4691
 * gruen — genau diese 17.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE GEGENPROBE — Fix-Skizzen AUSSERHALB des Repos: der Quellbaum von
 * 543706c6 (git archive) mit dieser Datei und den Unit-Faellen, je Variante
 * gepatcht, mit build.py gebaut; diese Datei (drei Worker) und die
 * Unit-Dateien kreatur-attribute, event-delegation,
 * action-registry-collisions, design-consistency und module-test-coverage
 * dagegen gefahren.
 *
 *   richtig: R1–R4 wie im Vertrag (Markup,      15/15 gruen (dev und prod,
 *     Funktion mit Schluessel als Text, Handler   zweimal); Unit 363/363; volle
 *     hinter 'update-enc-attr-mod', Streichung    Jest-Suite 4708/4708
 *     in der Whitelist)
 *   VERWORFEN: call bleibt, die Funktion nimmt   rot W1 W2 W3 W3r W4 W5 W7 W9;
 *     den Schluessel als Text                     Unit 7 (U1, U1b, U2, Export)
 *   VERWORFEN: call-Handler liest                rot W1 W2 W3 W3r W4 W5 W7 W9;
 *     ctx.target.dataset.value                    Unit 17
 *   VERWORFEN: INPUT type=number im Klick-       rot W1 W2 W3 W3r W4 W5 W7 W9;
 *     Zweig ausgenommen                           Unit 17
 *   Handler nur bei click (Kritik)               rot W1 W2 W3 W3r W4 W7 —
 *                                                 W1 allein haelt ihn; Unit 3
 *   Handler liest ctx.value (Kritik)             rot W1 W2 W3 W3r W4 W7; Unit 2
 *   Whitelist-Eintrag bleibt (R4 vergessen)      E2E gruen; Unit 1 (U3)
 *   Anzeige geklemmt (Variante b statt a)        rot W3r (35, -5); Unit 2
 *   updateAllBstAttrMods ruft noch ({attr})      rot W4 (beim Oeffnen, erneut
 *                                                 geoeffnet); Unit 1
 *   window-Export bleibt                         Unit 1 (Export-Audit)
 *   Handler vor dem JS_MARKEN-Anker :376         Unit 1 (design-consistency,
 *                                                 R-22 "der Bestand ist der
 *                                                 gemessene")
 *   kein Rueckfall 10 (NaN -> nichts schreiben)  rot W3 (leer, "-", "e"),
 *                                                 W3r ("0"); Unit 2
 *
 * Kein Fall ist an der richtigen Skizze rot, und jede Halbloesung macht
 * mindestens einen Fall rot — hier oder in den Unit-Dateien.
 */
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = process.cwd().replace(/\\/g, '/');
const DEV = `file:///${WURZEL}/dist/dnd-tracker-bundled.html`;
const PROD = `file:///${WURZEL}/dist/dnd-tracker-optimized.html`;
/** Der CI-Job `e2e` baut nur dev (`python build.py`); den prod-Fall gibt es
 *  nur mit einem frischen `python build.py --production`. */
const PROD_DA = existsSync(join(process.cwd(), 'dist', 'dnd-tracker-optimized.html'));

const SPEICHER = 'dnd-tracker-v4';

const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };

/** Die Doppeltipp-Sperre (systems/avatars.js) schluckt einen Tap auf einen
 *  Knopf binnen 300 ms nach dem vorigen Tap — Nebenbefund (b). */
const NACH_TAP_MS = 400;

const ATTR = /** @type {const} */ (['str', 'dex', 'con', 'int', 'wis', 'cha']);
/** Die Beschriftung im Editor, fuer die Meldungen. */
const NAME = { str: 'STR', dex: 'GE', con: 'KO', int: 'IN', wis: 'WE', cha: 'CH' };

/** W1/W2/W7/W8/W10: die getippten Werte und ihr Modifikator (wie im Befund). */
const WERTE = { str: '18', dex: '14', con: '7', int: '3', wis: '20', cha: '1' };
const SOLL = { str: '+4', dex: '+2', con: '-2', int: '-4', wis: '+5', cha: '-5' };

/** Die gesaete Kreatur "Altwesen" und ihr Modifikator beim Oeffnen. */
const ALT = { str: 18, dex: 14, con: 12, int: 8, wis: 10, cha: 6 };
const ALT_SOLL = { str: '+4', dex: '+2', con: '+1', int: '-1', wis: '+0', cha: '-2' };

/** WEICHE Zusicherungen fuer die Ergebnisse: ein roter Lauf nennt JEDE
 *  gebrochene Zusage. Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

function saat() {
    return {
        _version: '99.0.0',
        settings: {
            theme: 'dark',
            lastView: 'dashboard',
            enableMarkdownShortcuts: true,
            markdownOnboardingSeen: true,
            levelingMode: 'xp'
        },
        randomTables: [],
        timers: [],
        shops: [],
        campaign: {},
        characters: [],
        npcs: [],
        locations: [],
        quests: [],
        encounters: [],
        bestiary: [
            {
                id: 1,
                name: 'Altwesen',
                source: 'custom',
                cr: '2',
                creatureType: 'Konstrukt',
                size: 'Mittelgroß',
                ac: 13,
                hp: 30,
                ...ALT,
                savingThrows: {},
                senses: [],
                languages: []
            }
        ],
        bestiaryFavorites: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        _nextId: {
            characters: 1,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            bestiary: 2,
            combatants: 1
        }
    };
}

/**
 * Faengt jeden Fehler ab dem Laden: `pageerror` und `console.error` (ohne das
 * Netzrauschen der Schriften unter file://). Der Mengen-Dialog von "Zur
 * Initiative" wird mit 1 bestaetigt und mitgeschrieben, jeder andere Dialog
 * ist ein Fehler.
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    /** @type {string[]} */
    const fragen = [];
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0]);
        }
    });
    page.on('dialog', d => {
        if (d.type() === 'prompt' && /zur Initiative/.test(d.message())) {
            fragen.push(d.message());
            d.accept('1').catch(() => {});
            return;
        }
        fehler.push('dialog: ' + d.type() + ' ' + d.message());
        d.dismiss().catch(() => {});
    });
    return { fehler, fragen };
}

/**
 * Saet (einmal je Tab, VOR dem Laden), laedt und wartet die fremde
 * Speicherung ab (Muster npc-suche.spec.js). Der Beobachter schreibt jede
 * Meldung des Ereignisprotokolls mit Typ mit — eine Fehlermeldung, die nach
 * wenigen Sekunden wieder verschwindet, entgeht ihm nicht.
 * @param {import('@playwright/test').Page} page
 * @param {string} [url]
 */
async function laden(page, url = DEV) {
    const f = fehlerFangen(page);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('kreatur-attribute-gesaet')) {
                    sessionStorage.setItem('kreatur-attribute-gesaet', '1');
                    localStorage.setItem(schluessel, JSON.stringify(s));
                }
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
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
                            w.__meldungen.push({ typ, text });
                        }
                    }
                }
            }).observe(document, { childList: true, subtree: true });
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
    return f;
}

/**
 * Der Fehlerstand der Seite: Laenge des Fehlerfangs, des Fehlerlogs der App
 * und der mitgeschriebenen Fehlermeldungen. Nur Ablesen.
 * @param {import('@playwright/test').Page} page @param {string[]} fehler
 */
async function stand(page, fehler) {
    const s = await page.evaluate(() => {
        /** @type {any} */
        const w = window;
        return {
            log: (w.ErrorHandler && w.ErrorHandler._errorLog ? w.ErrorHandler._errorLog : [])
                .length,
            meldungen: (w.__meldungen || []).length
        };
    });
    return { fehler: fehler.length, ...s };
}

/**
 * Was seit `vorher` an Fehlern dazugekommen ist, in einer Liste: Fehlerfang,
 * neue Eintraege des Fehlerlogs (unshift: die neuen stehen vorn) und neue
 * Fehlermeldungen des Ereignisprotokolls.
 * @param {import('@playwright/test').Page} page @param {string[]} fehler
 * @param {{fehler: number, log: number, meldungen: number}} vorher
 */
async function neueFehler(page, fehler, vorher) {
    const s = await page.evaluate(
        ([log0, meld0]) => {
            /** @type {any} */
            const w = window;
            const log = w.ErrorHandler && w.ErrorHandler._errorLog ? w.ErrorHandler._errorLog : [];
            const neu = Math.max(0, log.length - log0);
            return {
                log: log
                    .slice(0, neu)
                    .map(
                        (/** @type {any} */ e) =>
                            '_errorLog: ' + e.fn + ' | ' + e.context + ' | ' + e.message
                    ),
                meldungen: (w.__meldungen || [])
                    .slice(meld0)
                    .filter((/** @type {any} */ m) => m.typ === 'error')
                    .map((/** @type {any} */ m) => 'Meldung: ' + m.text)
            };
        },
        [vorher.log, vorher.meldungen]
    );
    return [...fehler.slice(vorher.fehler), ...s.log, ...s.meldungen];
}

/**
 * Mitte eines Elements und ob dort wirklich es selbst (oder ein Kind)
 * obenauf liegt. Fuer Taps auf freie Koordinaten.
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
 * Zur Ansicht ueber die ECHTE Navigation (Muster bestiar-klick.spec.js).
 * Desktop: Gruppe aufklappen, Reiter klicken. Telefon: Leiste per Tap auf ☰
 * ausfahren, Reiter auf freien Koordinaten antippen, Leiste wieder einfahren.
 * @param {import('@playwright/test').Page} page @param {string} ansicht
 */
async function zurAnsicht(page, ansicht) {
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
        await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
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
    await expect(page.locator(`#view-${ansicht}`)).toHaveClass(/\bactive\b/);
    await page.waitForTimeout(300);
}

/** @param {import('@playwright/test').Page} page */
function editorOffen(page) {
    return page.evaluate(() =>
        (
            document.getElementById('bestiary-editor-modal') || {
                classList: { contains: () => false }
            }
        ).classList.contains('show')
    );
}

/**
 * "+ Neue Kreatur" anklicken bzw. antippen; der Editor muss offen sein.
 * @param {import('@playwright/test').Page} page @param {boolean} [mobil]
 */
async function neueKreatur(page, mobil = false) {
    await zurAnsicht(page, 'bestiary');
    const knopf = page.locator('#view-bestiary button', { hasText: '+ Neue Kreatur' });
    if (mobil) await knopf.tap();
    else await knopf.click();
    await expect(page.locator('#bst-str'), 'Vorbedingung: der Editor ist offen').toBeVisible();
    expect(await editorOffen(page), 'Vorbedingung: der Editor ist offen').toBe(true);
}

/**
 * "Nur Eigene" anhaken (falls noch nicht), die Zeile der Kreatur anklicken
 * bzw. antippen. Die Liste ist virtuell; der Filter holt die eigenen Kreaturen
 * nach oben.
 * @param {import('@playwright/test').Page} page @param {string} name
 * @param {boolean} [mobil]
 */
async function kreaturWaehlen(page, name, mobil = false) {
    const nurEigene = page.locator('#bestiary-filter-custom');
    if (!(await nurEigene.isChecked())) {
        if (mobil) await nurEigene.tap();
        else await nurEigene.click();
        await page.waitForTimeout(300);
    }
    const zeile = page
        .locator('#bestiary-list .bestiary-list-item', { hasText: name })
        .locator('.bestiary-name');
    await zeile.scrollIntoViewIfNeeded();
    if (mobil) await zeile.tap();
    else await zeile.click();
    await page.waitForTimeout(300);
}

/** "Bearbeiten" im Detail; der Editor muss offen sein.
 *  @param {import('@playwright/test').Page} page */
async function bearbeitenOeffnen(page) {
    await page.locator('#bestiary-detail-panel button', { hasText: 'Bearbeiten' }).click();
    await expect(page.locator('#bst-str'), 'Vorbedingung: der Editor ist offen').toBeVisible();
    await expect(page.locator('#bestiary-editor-title')).toHaveText('Kreatur bearbeiten');
}

/**
 * Wert und angezeigter Modifikator eines Feldes, dazu badInput und das
 * fokussierte Element. Nur Ablesen.
 * @param {import('@playwright/test').Page} page @param {string} feld z. B. 'bst-str'
 */
function lies(page, feld) {
    return page.evaluate(id => {
        const el = /** @type {HTMLInputElement|null} */ (document.getElementById(id));
        const mod = document.getElementById(id + '-mod');
        return {
            wert: el ? el.value : null,
            badInput: el ? el.validity.badInput : null,
            mod: mod ? mod.textContent : null,
            fokus: document.activeElement ? document.activeElement.id : null
        };
    }, feld);
}

/** Alle sechs Modifikatoren eines Formulars. Nur Ablesen.
 *  @param {import('@playwright/test').Page} page @param {string} praefix */
function alleMods(page, praefix) {
    return page.evaluate(
        ([p, attrs]) => {
            /** @type {Record<string, string|null>} */
            const o = {};
            attrs.forEach(a => {
                const m = document.getElementById(p + a + '-mod');
                o[a] = m ? m.textContent : null;
            });
            return o;
        },
        [praefix, [...ATTR]]
    );
}

/** Die Werte einer gespeicherten Kreatur aus D. Nur Ablesen.
 *  @param {import('@playwright/test').Page} page @param {string} name */
function gespeichert(page, name) {
    return page.evaluate(
        n =>
            /** @type {any} */ (window.D.bestiary || [])
                .filter((/** @type {any} */ m) => m.name === n)
                .map((/** @type {any} */ m) => ({
                    str: m.str,
                    dex: m.dex,
                    con: m.con,
                    int: m.int,
                    wis: m.wis,
                    cha: m.cha
                })),
        name
    );
}

/** @param {import('@playwright/test').Page} page */
function bestiarInD(page) {
    return page.evaluate(() => JSON.stringify(/** @type {any} */ (window).D.bestiary || []));
}

/**
 * W1: nur Tastatur. Klick in "Graben", dann je Attribut Tab, Strg+A (wegen
 * Nebenbefund (c)), Ziffern. KEIN Klick in ein Attributfeld. Liefert je Feld
 * den Modifikator nach dem Tippen und nach dem Tab und die Fehler je Schritt.
 * @param {import('@playwright/test').Page} page @param {string[]} fehler
 * @param {Record<string, string>} werte
 */
async function tastaturWeg(page, fehler, werte) {
    await page.locator('#bst-speed-burrow').click();
    /** @type {Record<string, {nachTippen: string|null, nachTab: string|null, fehler: string[]}>} */
    const z = {};
    /** @type {string|null} */
    let vorige = null;
    for (const a of ATTR) {
        let s0 = await stand(page, fehler);
        await page.keyboard.press('Tab');
        if (vorige) {
            z[vorige].nachTab = (await lies(page, 'bst-' + vorige)).mod;
            z[vorige].fehler.push(...(await neueFehler(page, fehler, s0)));
        }
        await expect(
            page.locator('#bst-' + a),
            `Vorbedingung: Tab fuehrt in ${NAME[a]}`
        ).toBeFocused();
        s0 = await stand(page, fehler);
        await page.keyboard.press('Control+A');
        await page.keyboard.type(werte[a]);
        const l = await lies(page, 'bst-' + a);
        expect(l.wert, `Vorbedingung: in ${NAME[a]} steht ${werte[a]}`).toBe(werte[a]);
        z[a] = { nachTippen: l.mod, nachTab: null, fehler: await neueFehler(page, fehler, s0) };
        vorige = a;
    }
    const s0 = await stand(page, fehler);
    await page.keyboard.press('Tab');
    z.cha.nachTab = (await lies(page, 'bst-cha')).mod;
    z.cha.fehler.push(...(await neueFehler(page, fehler, s0)));
    return z;
}

// ═══════════════════════════════════════════════════════════════════════════
// A: die Anzeige im Editor (dev, 1440x900)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('A: der Modifikator folgt dem Wert — Kreaturen-Editor, 1440x900', () => {
    test.use({ viewport: BREIT });

    test('(W1) nur Tastatur, neue Kreatur: Tab, Strg+A, Ziffern — der Modifikator stimmt nach dem Tippen und nach dem Tab', async ({
        page
    }) => {
        const { fehler } = await laden(page);
        await neueKreatur(page);
        const z = await tastaturWeg(page, fehler, WERTE);
        for (const a of ATTR) {
            weich(z[a].nachTippen, `(W1) ${NAME[a]} ${WERTE[a]} getippt`).toBe(SOLL[a]);
            weich(z[a].nachTab, `(W1) ${NAME[a]} ${WERTE[a]} nach Tab`).toBe(SOLL[a]);
            weich(z[a].fehler, `(W5) ${NAME[a]}: Tab, Strg+A, "${WERTE[a]}" ohne Fehler`).toEqual(
                []
            );
        }
    });

    test('(W2) Klickpfad: Klick in jedes Feld, Strg+A, Ziffern — der Klick schreibt keinen Fehler', async ({
        page
    }) => {
        const { fehler } = await laden(page);
        await neueKreatur(page);
        for (const a of ATTR) {
            let s0 = await stand(page, fehler);
            await page.locator('#bst-' + a).click();
            await expect(page.locator('#bst-' + a), 'Vorbedingung: Fokus im Feld').toBeFocused();
            weich(
                await neueFehler(page, fehler, s0),
                `(W2) Klick in ${NAME[a]} ohne Fehler`
            ).toEqual([]);
            s0 = await stand(page, fehler);
            await page.keyboard.press('Control+A');
            await page.keyboard.type(WERTE[a]);
            const l = await lies(page, 'bst-' + a);
            expect(l.wert, `Vorbedingung: in ${NAME[a]} steht ${WERTE[a]}`).toBe(WERTE[a]);
            weich(l.mod, `(W2) ${NAME[a]} ${WERTE[a]} nach Klick getippt`).toBe(SOLL[a]);
            weich(
                await neueFehler(page, fehler, s0),
                `(W5) ${NAME[a]}: Strg+A, "${WERTE[a]}" ohne Fehler`
            ).toEqual([]);
        }
    });

    test('(W3) Wertwege: Pfeile, Spinner, Mausrad, Strg+V, leer, "-", "e" — jeder Weg zeigt den richtigen Modifikator, ohne Fehler', async ({
        page
    }) => {
        test.setTimeout(60000);
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
        const { fehler } = await laden(page);
        await neueKreatur(page);

        /**
         * Ein Weg: Feld anklicken, Startwert per Strg+A tippen (sein
         * Modifikator unterscheidet sich vom Soll), dann `weg`. Hart: der Wert
         * danach. Weich: der Modifikator und die Fehler des ganzen Schritts.
         * @param {string} titel @param {string} a @param {string} start
         * @param {() => Promise<void>} weg @param {string} wertDanach
         * @param {string} soll @param {boolean} [badInput]
         */
        const pruefeWeg = async (titel, a, start, weg, wertDanach, soll, badInput = false) => {
            const s0 = await stand(page, fehler);
            await page.locator('#bst-' + a).click();
            await page.keyboard.press('Control+A');
            await page.keyboard.type(start);
            expect((await lies(page, 'bst-' + a)).wert, `Vorbedingung ${titel}: Startwert`).toBe(
                start
            );
            await weg();
            const l = await lies(page, 'bst-' + a);
            expect(l.wert, `Vorbedingung ${titel}: der Wert danach`).toBe(wertDanach);
            if (badInput) expect(l.badInput, `Vorbedingung ${titel}: badInput`).toBe(true);
            weich(l.mod, `(W3) ${titel}`).toBe(soll);
            weich(await neueFehler(page, fehler, s0), `(W5) ${titel}: ohne Fehler`).toEqual([]);
        };

        await pruefeWeg(
            'STR 19, Pfeil hoch -> 20',
            'str',
            '19',
            () => page.keyboard.press('ArrowUp'),
            '20',
            '+5'
        );
        await pruefeWeg(
            'GE 14, zweimal Pfeil runter -> 12',
            'dex',
            '14',
            async () => {
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowDown');
            },
            '12',
            '+1'
        );
        await pruefeWeg(
            'CH 1, Spinner oben rechts angeklickt -> 2',
            'cha',
            '1',
            async () => {
                const box = /** @type {{x: number, y: number, width: number, height: number}} */ (
                    await page.locator('#bst-cha').boundingBox()
                );
                const x = box.x + box.width - 6;
                const y = box.y + box.height * 0.25;
                await page.mouse.move(x, y);
                await page.waitForTimeout(100);
                await page.mouse.click(x, y);
            },
            '2',
            '-4'
        );
        await pruefeWeg(
            'KO 11, Mausrad hoch ueber dem fokussierten Feld -> 12',
            'con',
            '11',
            async () => {
                const box = /** @type {{x: number, y: number, width: number, height: number}} */ (
                    await page.locator('#bst-con').boundingBox()
                );
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.wheel(0, -100);
                await page.waitForTimeout(100);
            },
            '12',
            '+1'
        );

        // Strg+V: "16" ueber die echte Zwischenablage aus einem Textfeld des
        // Editors, das danach wieder leer ist.
        await page.locator('#bst-hp-formula').click();
        await page.keyboard.type('16');
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Control+C');
        await page.keyboard.press('Delete');
        await pruefeWeg(
            'IN 3, Strg+A, Strg+V "16"',
            'int',
            '3',
            async () => {
                await page.keyboard.press('Control+A');
                await page.keyboard.press('Control+V');
            },
            '16',
            '+3'
        );

        await pruefeWeg(
            'STR 18, Strg+A, Entf (leer) -> "+0"',
            'str',
            '18',
            async () => {
                await page.keyboard.press('Control+A');
                await page.keyboard.press('Delete');
            },
            '',
            '+0'
        );
        await pruefeWeg(
            'STR 18, Strg+A, "-" (leer, badInput) -> "+0"',
            'str',
            '18',
            async () => {
                await page.keyboard.press('Control+A');
                await page.keyboard.type('-');
            },
            '',
            '+0',
            true
        );
        await pruefeWeg(
            'STR 18, Strg+A, "e" (leer, badInput) -> "+0"',
            'str',
            '18',
            async () => {
                await page.keyboard.press('Control+A');
                await page.keyboard.type('e');
            },
            '',
            '+0',
            true
        );
    });

    test('(W3r) Werte ausserhalb 1–30 werden ungeklemmt angezeigt (Entscheidung a): 35 "+12", -5 "-8", 0 "+0"', async ({
        page
    }) => {
        const { fehler } = await laden(page);
        await neueKreatur(page);
        const s0 = await stand(page, fehler);
        await page.locator('#bst-str').click();
        for (const [wert, soll] of [
            ['35', '+12'],
            ['-5', '-8'],
            ['0', '+0']
        ]) {
            await page.keyboard.press('Control+A');
            await page.keyboard.type(wert);
            const l = await lies(page, 'bst-str');
            expect(l.wert, `Vorbedingung: in STR steht ${wert}`).toBe(wert);
            weich(l.mod, `(W3r) STR ${wert}`).toBe(soll);
        }
        weich(await neueFehler(page, fehler, s0), '(W5) ohne Fehler').toEqual([]);
    });

    test('(W4) Bearbeiten "Altwesen": beim Oeffnen richtig, GE 14 -> 8 "-1", STR 18 -> 20 "+5", Abbrechen und erneut oeffnen aus D', async ({
        page
    }) => {
        test.setTimeout(60000);
        const { fehler } = await laden(page);
        await zurAnsicht(page, 'bestiary');
        await kreaturWaehlen(page, 'Altwesen');
        const s0 = await stand(page, fehler);
        await bearbeitenOeffnen(page);
        for (const a of ATTR) {
            expect((await lies(page, 'bst-' + a)).wert, `Vorbedingung: ${NAME[a]} geladen`).toBe(
                String(ALT[a])
            );
        }
        weich(await alleMods(page, 'bst-'), '(W4) beim Oeffnen (Gegenprobe)').toEqual(ALT_SOLL);

        // GE per Tastatur: Klick in "Graben", Tab (STR), Tab (GE), Strg+A, "8".
        await page.locator('#bst-speed-burrow').click();
        await page.keyboard.press('Tab');
        await expect(page.locator('#bst-str'), 'Vorbedingung: Tab fuehrt in STR').toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.locator('#bst-dex'), 'Vorbedingung: Tab fuehrt in GE').toBeFocused();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('8');
        let l = await lies(page, 'bst-dex');
        expect(l.wert, 'Vorbedingung: in GE steht 8').toBe('8');
        weich(l.mod, '(W4) GE 14 -> 8').toBe('-1');

        // STR: Umschalt+Tab zurueck, zweimal Pfeil hoch.
        await page.keyboard.press('Shift+Tab');
        await expect(
            page.locator('#bst-str'),
            'Vorbedingung: Umschalt+Tab fuehrt in STR'
        ).toBeFocused();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowUp');
        l = await lies(page, 'bst-str');
        expect(l.wert, 'Vorbedingung: in STR steht 20').toBe('20');
        weich(l.mod, '(W4) STR 18 -> 20 (zweimal Pfeil hoch)').toBe('+5');
        weich(await neueFehler(page, fehler, s0), '(W5) Bearbeiten ohne Fehler').toEqual([]);

        // Abbrechen: D bleibt, erneutes Oeffnen zeigt wieder die Werte aus D.
        await page.locator('#bestiary-editor-modal button', { hasText: 'Abbrechen' }).click();
        await page.waitForTimeout(300);
        expect(await editorOffen(page), 'Vorbedingung: Abbrechen schliesst den Editor').toBe(false);
        weich(await gespeichert(page, 'Altwesen'), '(W4) Abbrechen laesst D unveraendert').toEqual([
            ALT
        ]);
        await bearbeitenOeffnen(page);
        /** @type {Record<string, string|null>} */
        const werte = {};
        for (const a of ATTR) werte[a] = (await lies(page, 'bst-' + a)).wert;
        weich(werte, '(W4) erneut geoeffnet: die Werte aus D').toEqual(
            Object.fromEntries(ATTR.map(a => [a, String(ALT[a])]))
        );
        weich(
            await alleMods(page, 'bst-'),
            '(W4) erneut geoeffnet: die Modifikatoren aus D'
        ).toEqual(ALT_SOLL);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// B: Fehler, Speichern, Telefon, Produktion, Klasse
// ═══════════════════════════════════════════════════════════════════════════

test.describe('B: Fehlerwaechter und Speichern — 1440x900', () => {
    test.use({ viewport: BREIT });

    test('(W5) vom Laden bis "Kreatur speichern" und "Zur Initiative": kein console.error, kein pageerror, kein Fehlerlog, keine Fehlermeldung', async ({
        page
    }) => {
        test.setTimeout(60000);
        const { fehler, fragen } = await laden(page);
        const s0 = await stand(page, fehler);
        await neueKreatur(page);
        await tastaturWeg(page, fehler, WERTE);
        // dazu der Klickpfad in einem Feld
        await page.locator('#bst-cha').click();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('2');
        await page.locator('#bst-name').click();
        await page.keyboard.type('Fehlerwesen');
        await page
            .locator('#bestiary-editor-modal button', { hasText: 'Kreatur speichern' })
            .click();
        await page.waitForTimeout(400);
        expect(await gespeichert(page, 'Fehlerwesen'), 'Vorbedingung: gespeichert').toHaveLength(1);
        await kreaturWaehlen(page, 'Fehlerwesen');
        await page
            .locator('#bestiary-detail-panel button', { hasText: 'Zur Initiative' })
            .first()
            .click();
        await page.waitForTimeout(400);
        expect(fragen, 'Vorbedingung: der Mengen-Dialog kam').toHaveLength(1);
        weich(await neueFehler(page, fehler, s0), '(W5) der ganze Weg ohne Fehler').toEqual([]);
        weich(s0.fehler, '(W5) auch das Laden ohne Fehler').toBe(0);
    });

    test('(W6) neue Kreatur speichern: geklemmte Werte in D, Statblock nach erneuter Auswahl, initBonus = GE-Modifikator; Tippen veraendert D nicht', async ({
        page
    }) => {
        test.setTimeout(60000);
        const { fehler, fragen } = await laden(page);
        await neueKreatur(page);
        const dVorher = await bestiarInD(page);
        await tastaturWeg(page, fehler, {
            str: '35',
            dex: '14',
            con: '7',
            int: '3',
            wis: '20',
            cha: '-5'
        });
        weich(await bestiarInD(page), '(W6) Tippen veraendert D nicht').toBe(dVorher);
        await page.locator('#bst-name').click();
        await page.keyboard.type('Neuwesen');
        await page
            .locator('#bestiary-editor-modal button', { hasText: 'Kreatur speichern' })
            .click();
        await page.waitForTimeout(400);
        expect(await editorOffen(page), 'Vorbedingung: Speichern schliesst den Editor').toBe(false);
        weich(await gespeichert(page, 'Neuwesen'), '(W6) gespeichert, geklemmt auf 1–30').toEqual([
            { str: 30, dex: 14, con: 7, int: 3, wis: 20, cha: 1 }
        ]);
        await kreaturWaehlen(page, 'Neuwesen');
        const zellen = await page.evaluate(() =>
            Array.from(document.querySelectorAll('#bestiary-detail-panel .bestiary-attr-cell')).map(
                c => (c.textContent || '').trim()
            )
        );
        weich(zellen, '(W6) Statblock').toEqual([
            'STR30 (+10)',
            'GE14 (+2)',
            'KO7 (-2)',
            'INT3 (-4)',
            'WE20 (+5)',
            'CH1 (-5)'
        ]);
        await page
            .locator('#bestiary-detail-panel button', { hasText: 'Zur Initiative' })
            .first()
            .click();
        await page.waitForTimeout(400);
        expect(fragen, 'Vorbedingung: der Mengen-Dialog kam').toHaveLength(1);
        const kaempfer = await page.evaluate(() =>
            /** @type {any} */ (window.D.initiative.combatants || [])
                .filter((/** @type {any} */ c) => c.name === 'Neuwesen')
                .map((/** @type {any} */ c) => c.initBonus)
        );
        weich(kaempfer, '(W6) initBonus = GE-Modifikator').toEqual([2]);
    });

    test('(W6) "Altwesen" bearbeitet speichern: GE 8 und STR 20 in D, Statblock nach erneuter Auswahl, initBonus -1', async ({
        page
    }) => {
        test.setTimeout(60000);
        const { fragen } = await laden(page);
        await zurAnsicht(page, 'bestiary');
        await kreaturWaehlen(page, 'Altwesen');
        await bearbeitenOeffnen(page);
        const dVorher = await bestiarInD(page);
        await page.locator('#bst-speed-burrow').click();
        await page.keyboard.press('Tab');
        await expect(page.locator('#bst-str'), 'Vorbedingung: Tab fuehrt in STR').toBeFocused();
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Tab');
        await expect(page.locator('#bst-dex'), 'Vorbedingung: Tab fuehrt in GE').toBeFocused();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('8');
        weich(await bestiarInD(page), '(W6) Tippen veraendert D nicht').toBe(dVorher);
        await page
            .locator('#bestiary-editor-modal button', { hasText: 'Kreatur speichern' })
            .click();
        await page.waitForTimeout(400);
        expect(await editorOffen(page), 'Vorbedingung: Speichern schliesst den Editor').toBe(false);
        weich(await gespeichert(page, 'Altwesen'), '(W6) gespeichert').toEqual([
            { ...ALT, str: 20, dex: 8 }
        ]);
        // Nebenbefund (a): die Detailtafel bleibt bis zur erneuten Auswahl alt.
        await kreaturWaehlen(page, 'Altwesen');
        const zellen = await page.evaluate(() =>
            Array.from(document.querySelectorAll('#bestiary-detail-panel .bestiary-attr-cell')).map(
                c => (c.textContent || '').trim()
            )
        );
        weich(zellen, '(W6) Statblock').toEqual([
            'STR20 (+5)',
            'GE8 (-1)',
            'KO12 (+1)',
            'INT8 (-1)',
            'WE10 (+0)',
            'CH6 (-2)'
        ]);
        await page
            .locator('#bestiary-detail-panel button', { hasText: 'Zur Initiative' })
            .first()
            .click();
        await page.waitForTimeout(400);
        expect(fragen, 'Vorbedingung: der Mengen-Dialog kam').toHaveLength(1);
        const kaempfer = await page.evaluate(() =>
            /** @type {any} */ (window.D.initiative.combatants || [])
                .filter((/** @type {any} */ c) => c.name === 'Altwesen')
                .map((/** @type {any} */ c) => c.initBonus)
        );
        weich(kaempfer, '(W6) initBonus = GE-Modifikator').toEqual([-1]);
    });
});

test.describe('B: Telefon 390x844', () => {
    test.use({ viewport: TELEFON, isMobile: true, hasTouch: true });

    test('(W7) Taps: Ansicht ueber ☰, "+ Neue Kreatur", Tap in jedes Feld, Strg+A, Ziffern — Modifikatoren, keine Fehler, Speichern per Tap', async ({
        page
    }) => {
        test.setTimeout(90000);
        const { fehler } = await laden(page);
        expect(
            await page.evaluate(() => document.documentElement.dataset.layout),
            'Vorbedingung: Mobil-Layout'
        ).toBe('mobile');
        const s0 = await stand(page, fehler);
        await neueKreatur(page, true);
        for (const a of ATTR) {
            const feld = page.locator('#bst-' + a);
            await feld.scrollIntoViewIfNeeded();
            let s1 = await stand(page, fehler);
            await feld.tap();
            await expect(feld, 'Vorbedingung: Fokus im Feld').toBeFocused();
            weich(await neueFehler(page, fehler, s1), `(W7) Tap in ${NAME[a]} ohne Fehler`).toEqual(
                []
            );
            s1 = await stand(page, fehler);
            await page.keyboard.press('Control+A');
            await page.keyboard.type(WERTE[a]);
            const l = await lies(page, 'bst-' + a);
            expect(l.wert, `Vorbedingung: in ${NAME[a]} steht ${WERTE[a]}`).toBe(WERTE[a]);
            weich(l.mod, `(W7) ${NAME[a]} ${WERTE[a]} nach Tap getippt`).toBe(SOLL[a]);
            weich(
                await neueFehler(page, fehler, s1),
                `(W5) ${NAME[a]}: Strg+A, "${WERTE[a]}" ohne Fehler`
            ).toEqual([]);
        }
        const name = page.locator('#bst-name');
        await name.scrollIntoViewIfNeeded();
        await name.tap();
        await page.keyboard.type('Telefonwesen');
        const knopf = page.locator('#bestiary-editor-modal button', {
            hasText: 'Kreatur speichern'
        });
        await knopf.scrollIntoViewIfNeeded();
        await page.waitForTimeout(NACH_TAP_MS);
        await knopf.tap();
        await page.waitForTimeout(500);
        expect(
            await editorOffen(page),
            'Vorbedingung: der Tap auf Speichern schliesst den Editor'
        ).toBe(false);
        weich(await gespeichert(page, 'Telefonwesen'), '(W7) gespeichert').toEqual([
            { str: 18, dex: 14, con: 7, int: 3, wis: 20, cha: 1 }
        ]);
        weich(await neueFehler(page, fehler, s0), '(W5) der ganze Telefonweg ohne Fehler').toEqual(
            []
        );
    });
});

test.describe('B: Produktionsbuendel und Klasse — 1440x900', () => {
    test.use({ viewport: BREIT });

    test('(W8) Produktionsbuendel: W1 nur Tastatur — Modifikatoren und keine Fehler', async ({
        page
    }) => {
        test.skip(
            !PROD_DA,
            'kein prod-Buendel — vorher `python build.py --production` (der CI-Job e2e baut nur dev)'
        );
        const { fehler } = await laden(page, PROD);
        const s0 = await stand(page, fehler);
        await neueKreatur(page);
        const z = await tastaturWeg(page, fehler, WERTE);
        for (const a of ATTR) {
            weich(z[a].nachTippen, `(W8) ${NAME[a]} ${WERTE[a]} getippt`).toBe(SOLL[a]);
            weich(z[a].nachTab, `(W8) ${NAME[a]} ${WERTE[a]} nach Tab`).toBe(SOLL[a]);
        }
        weich(await neueFehler(page, fehler, s0), '(W5) prod: ohne Fehler').toEqual([]);
    });

    for (const [buendel, url] of [
        ['dev', DEV],
        ['prod', PROD]
    ]) {
        test(`(W9) kein Formularfeld traegt die Knopf-Aktion call — ${buendel}`, async ({
            page
        }) => {
            test.skip(
                buendel === 'prod' && !PROD_DA,
                'kein prod-Buendel — vorher `python build.py --production`'
            );
            await laden(page, url);
            await neueKreatur(page);
            const treffer = await page.evaluate(() =>
                Array.from(
                    document.querySelectorAll(
                        'input[data-action="call"], select[data-action="call"], textarea[data-action="call"]'
                    )
                ).map(
                    e =>
                        e.tagName.toLowerCase() +
                        '#' +
                        e.id +
                        ' -> ' +
                        /** @type {HTMLElement} */ (e).dataset.value
                )
            );
            weich(treffer, '(W9) Formularfelder mit data-action="call"').toEqual([]);
        });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// C: Gegenproben — vorher und nachher gruen
// ═══════════════════════════════════════════════════════════════════════════

test.describe('C: Gegenproben — 1440x900', () => {
    test.use({ viewport: BREIT });

    for (const [ansicht, formular, praefix, aktion] of [
        ['encounter', 'enc-form', 'enc-', 'update-enc-attr-mod'],
        ['party', 'char-form', 'char-', 'update-attr-mod']
    ]) {
        test(`(W10) ${ansicht}-Formular (${aktion}): dieselben Tasten ergeben +4/+2/-2/-4/+5/-5, ohne Fehler`, async ({
            page
        }) => {
            const { fehler } = await laden(page);
            await zurAnsicht(page, ansicht);
            await page.locator(`.collapsible-header[data-value="${formular}"]`).click();
            await expect(
                page.locator('#' + praefix + 'str'),
                'Vorbedingung: das Formular ist offen'
            ).toBeVisible();
            const s0 = await stand(page, fehler);
            for (const a of ATTR) {
                await page.locator('#' + praefix + a).click();
                await page.keyboard.press('Control+A');
                await page.keyboard.type(WERTE[a]);
                const l = await lies(page, praefix + a);
                expect(l.wert, `Vorbedingung: in ${NAME[a]} steht ${WERTE[a]}`).toBe(WERTE[a]);
                weich(l.mod, `(W10) ${ansicht}: ${NAME[a]} ${WERTE[a]}`).toBe(SOLL[a]);
            }
            weich(await neueFehler(page, fehler, s0), `(W10) ${ansicht}: ohne Fehler`).toEqual([]);
        });
    }

    test('(W10) Enter im Attributfeld laesst den Editor offen und schreibt keinen Fehler', async ({
        page
    }) => {
        const { fehler } = await laden(page);
        await neueKreatur(page);
        await page.locator('#bst-speed-burrow').click();
        await page.keyboard.press('Tab');
        await expect(page.locator('#bst-str'), 'Vorbedingung: Tab fuehrt in STR').toBeFocused();
        await page.keyboard.press('Control+A');
        await page.keyboard.type('18');
        const s0 = await stand(page, fehler);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
        weich(await editorOffen(page), '(W10) der Editor bleibt offen').toBe(true);
        weich((await lies(page, 'bst-str')).wert, '(W10) der Wert bleibt').toBe('18');
        weich(await neueFehler(page, fehler, s0), '(W10) Enter ohne Fehler').toEqual([]);
    });
});
