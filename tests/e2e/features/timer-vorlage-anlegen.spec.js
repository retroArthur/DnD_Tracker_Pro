// @ts-check
/**
 * Der Waechter der Timer-Vorlagen: Anlegen nach abgebrochenem Bearbeiten (ABBRUCH, TIMER)
 * =====================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer eine Vorlage zum
 * Bearbeiten oeffnet, es abbricht und danach eine neue anlegt, bekommt eine
 * NEUE Vorlage** — keine fremde wird ueberschrieben, auch dann nicht, wenn im
 * selben Dialog inzwischen eine Vorlage geloescht wurde.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d (Branch abbrechen-neu), 1440x900, echte Klicks
 * und Tasten, Saat `[Fackel 🔥 1h, Segen ✨ 1m, Licht 30s]`:
 *
 *   ✏️ Fackel → ✕ → ⚙️ → "Schild"   das Formular traegt nach ⚙️ noch Index 0,
 *   (ebenso mit Escape)             "Fackel", Knopf "Vorlage speichern"; 💾
 *                                   UEBERSCHREIBT Fackel: [Schild 🔥 1h, Segen,
 *                                   Licht], "Vorlage aktualisiert", nach dem
 *                                   Neuladen ebenso
 *   ✏️ Fackel → "Abbrechen"         neu angelegt, aber "Schild" traegt 1 h —
 *                                   die Zeit von Fackel; das Formular zeigt
 *                                   nach "Abbrechen" 1/0/0 statt 0/10/0
 *   ✏️ Fackel → 🗑️ Fackel → 💾       SEGEN, nie bearbeitet, ist weg:
 *                                   [Schild 🔥 1h, Licht]
 *   ✏️ Licht (letzte) → 🗑️ Licht     neu angelegt, aber die Meldung sagt
 *   → 💾                             "Vorlage aktualisiert"
 *   Entwurf → Escape → ⚙️           der Entwurf bleibt stehen (so soll es sein)
 *
 * DIE URSACHEN:
 *   - `assets/templates/view-tools.html:271` → `systems/spellslots/navigation.js:101`:
 *     ⚙️ oeffnet den Dialog per `showModal()`, das fuer diese Schale nur die
 *     Liste neu zeichnet — das Formular oben wird nie geleert. ⚙️ ist der
 *     EINZIGE Anlege-Weg (keine Taste n, keine Befehlspalette, keine Suche).
 *   - `features/timers/timers.js:107`: `presets[parseInt(editIndex)] = presetData`
 *     — der Bearbeiten-Zustand ist ein Array-INDEX in `#edit-preset-index`,
 *     keine ID. `timers.js:108` meldet "Vorlage aktualisiert" auch dann, wenn
 *     der Index hinter dem Array-Ende liegt.
 *   - `timers.js:152-161` `deleteTimerPreset()`: `splice` verschiebt alle
 *     folgenden Vorlagen um eins, `#edit-preset-index` bleibt stehen und zeigt
 *     danach auf den Nachfolger. ✏️ und 🗑️ liegen im SELBEN Dialog, das geht
 *     also auch ganz ohne Schliessen.
 *   - `timers.js:136-150` `clearPresetForm()`: die drei Zeitfelder stehen nur
 *     in `defaults`, nicht in `textFields`; `clearFormFields()`
 *     (`utils/form-helpers.js:39-44`) wendet `defaults` nur auf `textFields`
 *     an — die Zeiten werden nie zurueckgesetzt.
 *
 * DIE REGELN (Vertrag ABBRUCH, docs/bugfixes.md):
 *   R1  Nach Bearbeiten → Abbrechen (✕, Escape, "Abbrechen") zeigt der
 *       Anlege-Weg ein Formular ohne Bearbeiten-Index und ohne Werte des
 *       bearbeiteten Eintrags; 💾 legt NEU an, die bearbeitete bleibt
 *       feldgleich — im Speicher und nach dem Neuladen. Faelle (1)-(3).
 *   R2  Ein nie gespeicherter Entwurf (kein Index) ueberlebt ✕/Escape und
 *       erneutes ⚙️. Fall (4), Waechter.
 *   R4  Zeigt der Index beim Speichern hinter das Array-Ende (die Vorlage ist
 *       weg, waehrend das Formular offen war), wird als NEU angelegt, mit einer
 *       Warnung und ohne "aktualisiert". Fall (5) — zweimal: Index GLEICH der
 *       Laenge (heute haengt `presets[i] = …` dort zufaellig richtig an, nur
 *       die Meldung luegt; das faengt ein `>` statt `>=` im Fix) und Index
 *       GROESSER als die Laenge (heute ein Loch: `[Fackel, null, neu]`; das
 *       faengt einen Fix, der nur warnt und weiter `presets[i] = …` schreibt).
 *   R8  Loeschen im Dialog fuehrt den Index nach: die gerade bearbeitete
 *       geloescht → Formular leer; eine davor geloescht → der Index rueckt
 *       nach; 💾 ueberschreibt nie eine Vorlage, die niemand bearbeitet hat.
 *       Faelle (6)-(8); (8) lehnt zuerst die Rueckfrage ab — wer VOR der
 *       Rueckfrage leert oder den Index verschiebt, wird dort rot.
 *   Kontrolle: ✏️ → 💾 → ⚙️ → 💾 legt schon heute richtig an. Fall (9).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER SPEICHER IST NICHT D
 *
 * Timer-Vorlagen liegen in `localStorage['dnd-timer-presets']`, geschrieben
 * SOFORT und unentprellt von `saveTimerPresets()` (`timers.js:17-19`, der
 * einzige Schreiber dieses Schluessels im Quellbaum). Es gibt also keinen
 * `_rev`-Marker abzuwarten und keine Kopie in D: das, was der Nutzer sieht
 * (Liste im Dialog, Schnellleiste), wird bei jedem Zeichnen frisch aus diesem
 * Schluessel gelesen. Dass 💾 ueberhaupt gelaufen ist, belegt die Meldung, die
 * jeder Speicherweg abgibt (`speichern()` unten wartet darauf) — erst danach
 * wird der Speicher gelesen. Eine fremde, entprellte Speicherung der Kampagne
 * (`dnd-tracker-v4`) kann diesen Schluessel nicht beruehren; darum wartet
 * `laden()` sie nicht ab (das sparte je Fall bis zu 4 s).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * R3 (Taste n, Befehlspalette): beides gibt es fuer Timer-Vorlagen nicht.
 * R4 per Strg+Z: Vorlagen haben kein Undo, Strg+Z erreicht sie nicht
 * (gemessen: Stapel leer, Speicher unveraendert) — der einzige Weg zu einem
 * Index hinter dem Ende ist darum ein zweiter Tab, Fall (5). R5-R7 betreffen
 * andere Formulare. "Klick daneben" schliesst diesen Dialog gar nicht
 * (gemessen) und ist darum kein Abbruch-Weg. Der Dialogtitel (V6) ist ein
 * eigener Vorgang.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Dieselbe Groesse wie die Messung. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne (nur fuer die Saat). */
const SPEICHER = 'dnd-tracker-v4';
/** Der Speicher der Timer-Vorlagen — NICHT in D. */
const VORLAGEN = 'dnd-timer-presets';

const MODAL = '#timer-preset-modal';

/** Die Saat der Vorlagen. Licht ohne Emoji: die Schnellleiste zeigt dann ⏱️. */
const FACKEL = { name: 'Fackel', emoji: '🔥', hours: 1, minutes: 0, seconds: 0 };
const SEGEN = { name: 'Segen', emoji: '✨', hours: 0, minutes: 1, seconds: 0 };
const LICHT = { name: 'Licht', emoji: '', hours: 0, minutes: 0, seconds: 30 };

/** Eine ruhige, gueltige Kampagne — die Vorlagen brauchen nichts aus D, aber
 *  eine unvollstaendige Saat loest Reparatur-Speicherungen und Meldungen aus
 *  (siehe `tests/e2e/helpers/test-utils.js`). Form wie in npc-formular.spec.js. */
function seed() {
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
                ac: 15,
                spells: [],
                items: [],
                attributes: { str: 10, dex: 14, con: 12, int: 10, wis: 13, cha: 8 }
            }
        ],
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
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 2,
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
            factions: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App. "Failed to load resource" ist
 * Netzrauschen (Schriften unter file://).
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
 * Laedt breit, saet EINMAL je Tab (Kampagne UND Vorlagen) und oeffnet die
 * Timer-Ansicht. Die Saat steht hinter einer sessionStorage-Sperre: ein
 * `page.reload()` liest dann, was die App gespeichert hat. Die Sperre gilt je
 * Tab — ein zweiter Tab (Fall 5) saet NICHT, er hat kein Init-Skript.
 * @param {import('@playwright/test').Page} page
 */
async function laden(page) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s, vorlagenSchluessel, vorlagen]) => {
            try {
                if (!sessionStorage.getItem('timer-vorlage-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    localStorage.setItem(vorlagenSchluessel, JSON.stringify(vorlagen));
                    sessionStorage.setItem('timer-vorlage-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(), VORLAGEN, [FACKEL, SEGEN, LICHT]]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await timerAnsicht(page);
}

/** Ansicht wechseln — Vorbereitung, nicht die gemessene Handlung.
 *  @param {import('@playwright/test').Page} page */
async function timerAnsicht(page) {
    await page.evaluate(() => window.switchView('timers'));
    await expect(page.locator('#view-timers')).toBeVisible();
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Die Vorlagen im Speicher, genau so, wie sie dort stehen.
 *  @param {import('@playwright/test').Page} page */
function imSpeicher(page) {
    return page.evaluate(k => {
        try {
            return JSON.parse(localStorage.getItem(k) || 'null');
        } catch {
            return '(nicht lesbar)';
        }
    }, VORLAGEN);
}

/** Die Schnellleiste der Timer-Ansicht, wie der Nutzer sie sieht
 *  (Emoji + Name; ohne Emoji zeigt sie ⏱️).
 *  @param {import('@playwright/test').Page} page */
function leiste(page) {
    return page
        .locator('#timer-presets .timer-preset-btn')
        .evaluateAll(knoepfe =>
            knoepfe.map(k => (k.textContent || '').replace(/\s+/g, ' ').trim())
        );
}

/** Alle Felder des Formulars oben im Dialog.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        const abbrechen = document.getElementById('preset-cancel-btn');
        return {
            offen: !!document.getElementById('timer-preset-modal')?.classList.contains('show'),
            index: wert('edit-preset-index'),
            name: wert('preset-name'),
            emoji: wert('preset-emoji'),
            h: wert('preset-hours'),
            m: wert('preset-minutes'),
            s: wert('preset-seconds'),
            knopf: document.getElementById('preset-save-btn')?.textContent?.trim(),
            abbrechenSichtbar: !!abbrechen && getComputedStyle(abbrechen).display !== 'none'
        };
    });
}

/** Das Formular, wie ⚙️ es nach dem Laden zeigt — der Anlege-Zustand. Jeder
 *  Fall prueft es beim ersten Oeffnen hart, bevor er es als Massstab nimmt. */
const LEER = {
    offen: true,
    index: '',
    name: '',
    emoji: '',
    h: '0',
    m: '10',
    s: '0',
    knopf: 'Vorlage hinzufügen',
    abbrechenSichtbar: false
};

/** ⚙️ in der Schnellleiste — ueber den sichtbaren Titel, nicht ueber
 *  `data-action`: der Anlege-Weg darf mit dem Fix eine eigene Aktion bekommen.
 *  @param {import('@playwright/test').Page} page */
async function zahnrad(page) {
    await page.locator('#view-timers').getByTitle('Vorlagen', { exact: true }).click();
    await expect(page.locator(MODAL)).toHaveClass(/\bshow\b/);
}

/** Die Zeile einer Vorlage in der Liste des Dialogs, ueber ihren Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function zeile(page, name) {
    return page.locator(`${MODAL} #preset-list > div`).filter({
        has: page.locator('span', { hasText: new RegExp(`^${name}$`) })
    });
}

/** ✏️ an der Vorlage `name`.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
async function bearbeiten(page, name) {
    await zeile(page, name).locator('[data-action="edit-timer-preset"]').click();
    await expect(page.locator('#preset-name'), `Vorbedingung: ✏️ ${name}`).toHaveValue(name);
}

/** 🗑️ an der Vorlage `name` (die Rueckfrage bestaetigt der `dialog`-Haendler).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
async function loeschen(page, name) {
    await zeile(page, name).locator('[data-action="delete-timer-preset"]').click();
    await expect(zeile(page, name), `Vorbedingung: 🗑️ ${name}`).toHaveCount(0);
}

/** ✕ im Kopf des Dialogs.
 *  @param {import('@playwright/test').Page} page */
async function kreuz(page) {
    await page.locator(`${MODAL} .modal-header button`).click();
    await expect(page.locator(MODAL)).not.toHaveClass(/\bshow\b/);
}

/** Die Nummer der juengsten Meldung (Ereignis-Log und Kampfprotokoll werden
 *  aus `showToast()` beschickt; das Protokoll fuehrt sie nummeriert).
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

/**
 * 💾 im Formular. Wartet, bis das Speichern eine Meldung abgegeben hat —
 * jeder Ausgang tut das ("hinzugefügt", "aktualisiert", eine Warnung oder
 * ein Fehler) — und gibt die Meldungen dieses Klicks zurueck. Erst danach ist
 * der Speicher der Stand NACH dem Speichern.
 * @param {import('@playwright/test').Page} page
 */
async function speichern(page) {
    const stand = await meldungsStand(page);
    await page.locator('#preset-save-btn').click();
    await expect
        .poll(() => meldungenSeit(page, stand), { message: '💾 muss eine Meldung abgeben' })
        .not.toEqual([]);
    return meldungenSeit(page, stand);
}

/** Die Meldungen, die von "aktualisiert" sprechen — gleich welcher Typ und
 *  Wortlaut davor: eine Neuanlage darf keine davon abgeben.
 *  @param {string[]} meldungen */
function aktualisiert(meldungen) {
    return meldungen.filter(m => /aktualisiert/i.test(m));
}

/** Neu laden; die Saat-Sperre haelt, der Speicher ist der der App.
 *  @param {import('@playwright/test').Page} page */
async function neuLaden(page) {
    await page.reload();
    await waitForAppReady(page);
    await timerAnsicht(page);
}

// ===========================================================================
// (1) ✏️ → ✕ → ⚙️ LEGT NEU AN UND UEBERSCHREIBT NICHT
// ===========================================================================
test('(1) R1: nach ✏️ und ✕ oeffnet ⚙️ ein leeres Formular, 💾 legt eine NEUE Vorlage an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);

    await zahnrad(page);
    expect(await formular(page), 'Vorbedingung: das frische Formular nach ⚙️').toEqual(LEER);
    await bearbeiten(page, 'Fackel');
    await kreuz(page);

    await zahnrad(page);
    // WEICH: ein roter Lauf soll danach auch den Verlust nennen.
    weich(
        await formular(page),
        '⚙️ nach ✏️ Fackel → ✕ muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#preset-name').fill('Schild');
    const meldungen = await speichern(page);

    const erwartet = [
        FACKEL,
        SEGEN,
        LICHT,
        { name: 'Schild', emoji: '', hours: 0, minutes: 10, seconds: 0 }
    ];
    weich(await imSpeicher(page), 'Speicher: Fackel bleibt feldgleich, Schild kommt dazu').toEqual(
        erwartet
    );
    weich(aktualisiert(meldungen), 'eine Neuanlage heisst nicht "aktualisiert"').toEqual([]);

    await neuLaden(page);
    weich(await imSpeicher(page), 'Speicher nach dem Neuladen').toEqual(erwartet);
    weich(await leiste(page), 'die Schnellleiste nach dem Neuladen').toEqual([
        '🔥 Fackel',
        '✨ Segen',
        '⏱️ Licht',
        '⏱️ Schild'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) ✏️ → ESCAPE → ⚙️ LEGT NEU AN UND UEBERSCHREIBT NICHT
// ===========================================================================
//
// Die mittlere Vorlage: ein Index, der weder 0 noch das Ende ist.
test('(2) R1: nach ✏️ und Escape oeffnet ⚙️ ein leeres Formular, 💾 legt eine NEUE Vorlage an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);

    await zahnrad(page);
    expect(await formular(page), 'Vorbedingung: das frische Formular nach ⚙️').toEqual(LEER);
    await bearbeiten(page, 'Segen');
    await page.keyboard.press('Escape');
    await expect(page.locator(MODAL)).not.toHaveClass(/\bshow\b/);

    await zahnrad(page);
    weich(
        await formular(page),
        '⚙️ nach ✏️ Segen → Escape muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#preset-name').fill('Schild');
    await page.locator(`${MODAL} .emoji-picker-mini`).getByRole('button', { name: '🛡️' }).click();
    await page.locator('#preset-minutes').fill('0');
    await page.locator('#preset-seconds').fill('45');
    const meldungen = await speichern(page);

    weich(await imSpeicher(page), 'Speicher: Segen bleibt feldgleich, Schild kommt dazu').toEqual([
        FACKEL,
        SEGEN,
        LICHT,
        { name: 'Schild', emoji: '🛡️', hours: 0, minutes: 0, seconds: 45 }
    ]);
    weich(aktualisiert(meldungen), 'eine Neuanlage heisst nicht "aktualisiert"').toEqual([]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) ✏️ → "ABBRECHEN" HINTERLAESST KEINE WERTE DER BEARBEITETEN VORLAGE
// ===========================================================================
//
// Der Inline-Knopf "Abbrechen" laesst den Dialog offen — das Formular darueber
// IST danach das Anlege-Formular (Knopf "Vorlage hinzufügen"). Heute leert er
// Index, Name und Emoji, nicht aber die Zeiten: die neue Vorlage erbt die 1 h
// von Fackel, ohne dass der Nutzer sie je eingegeben hat.
test('(3) R1: nach ✏️ und "Abbrechen" traegt das Formular keine Zeit der bearbeiteten Vorlage', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);

    await zahnrad(page);
    expect(await formular(page), 'Vorbedingung: das frische Formular nach ⚙️').toEqual(LEER);
    await bearbeiten(page, 'Fackel');
    await page.locator('#preset-cancel-btn').click();
    await expect(
        page.locator(MODAL),
        'Vorbedingung: "Abbrechen" laesst den Dialog offen'
    ).toHaveClass(/\bshow\b/);

    weich(
        await formular(page),
        'nach ✏️ Fackel → "Abbrechen" muss das Formular leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#preset-name').fill('Schild');
    await speichern(page);

    weich(
        await imSpeicher(page),
        'Speicher: Fackel bleibt, Schild kommt OHNE die Zeit von Fackel dazu'
    ).toEqual([
        FACKEL,
        SEGEN,
        LICHT,
        { name: 'Schild', emoji: '', hours: 0, minutes: 10, seconds: 0 }
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) WAECHTER: EIN ANLEGE-ENTWURF UEBERLEBT ✕, ESCAPE UND ⚙️
// ===========================================================================
//
// Schon heute gruen (gemessen: "Entwurf" → Escape → ⚙️, der Entwurf steht).
// Der Fix darf nur leeren, wenn ein Bearbeiten-Rest da ist — ein Fix, der bei
// JEDEM ⚙️ leert, macht diesen Fall rot. Darum mit Emoji und eigener Zeit:
// auch die Zeitfelder gehoeren zum Entwurf.
test('(4) R2 (Waechter): ein Anlege-Entwurf ueberlebt ✕, Escape und erneutes ⚙️', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);

    await zahnrad(page);
    expect(await formular(page), 'Vorbedingung: das frische Formular nach ⚙️').toEqual(LEER);
    await page.locator('#preset-name').fill('Entwurf');
    await page.locator(`${MODAL} .emoji-picker-mini`).getByRole('button', { name: '🌙' }).click();
    await page.locator('#preset-minutes').fill('5');
    const entwurf = { ...LEER, name: 'Entwurf', emoji: '🌙', m: '5' };
    expect(await formular(page), 'Vorbedingung: der Entwurf steht im Formular').toEqual(entwurf);

    await kreuz(page);
    await zahnrad(page);
    weich(await formular(page), 'der Entwurf nach ✕ → ⚙️').toEqual(entwurf);

    await page.keyboard.press('Escape');
    await expect(page.locator(MODAL)).not.toHaveClass(/\bshow\b/);
    await zahnrad(page);
    weich(await formular(page), 'der Entwurf nach Escape → ⚙️').toEqual(entwurf);

    const meldungen = await speichern(page);
    weich(await imSpeicher(page), 'Speicher: der Entwurf ist eine NEUE Vorlage').toEqual([
        FACKEL,
        SEGEN,
        LICHT,
        { name: 'Entwurf', emoji: '🌙', hours: 0, minutes: 5, seconds: 0 }
    ]);
    weich(meldungen, 'die Meldung des Speicherns').toContain('success: Vorlage hinzugefügt');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) DIE BEARBEITETE VORLAGE VERSCHWINDET UNTER DEM OFFENEN FORMULAR
// ===========================================================================
//
// Vorlagen haben kein Undo; der einzige Weg, auf dem der Index nach dem Fix
// noch hinter das Array-Ende zeigen kann, ist ein ZWEITER TAB derselben App:
// er loescht, waehrend hier ✏️ offen ist (beide lesen denselben Schluessel,
// `getTimerPresets()` liest bei jedem Aufruf frisch). Die Regel verlangt "als
// neu angelegt" UND dass der Nutzer es erfaehrt. Zwei Schritte, weil zwei
// falsche Fixe verschieden aussehen:
//   A  Index GLEICH der Laenge (✏️ Licht, Index 2; drueben 🗑️ Licht → Laenge 2).
//      Heute landet die Eingabe zwar richtig am Ende — `presets[2] = …` auf ein
//      Array der Laenge 2 —, aber die Meldung sagt "Vorlage aktualisiert"
//      (gemessen, V3b). Ein Fix mit `>` statt `>=` bliebe hier rot.
//   B  Index GROESSER als die Laenge (✏️ "Licht hell", Index 2; drueben
//      🗑️ Segen und 🗑️ "Licht hell" → Laenge 1). Heute reisst `presets[2] = …`
//      ein Loch: im Speicher steht `[Fackel, null, …]`. Ein Fix, der nur warnt
//      und weiter per Index schreibt, bliebe hier rot.
test('(5) R4: ✏️ einer Vorlage, die ein zweiter Tab loescht: 💾 legt sie neu an und sagt es', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    /** Die Warnung "… als neue Vorlage gespeichert" unter den Meldungen.
     *  @param {string[]} meldungen */
    const warntNeu = meldungen =>
        meldungen.some(m => m.startsWith('warning: ') && /neue[rn]?\s+(Timer-)?Vorlage/i.test(m));

    await zahnrad(page);
    expect(await formular(page), 'Vorbedingung: das frische Formular nach ⚙️').toEqual(LEER);
    await bearbeiten(page, 'Licht');
    await page.locator('#preset-name').fill('Licht hell');

    // Der zweite Tab: dieselbe App, derselbe Speicher, KEINE Saat.
    const zweiter = await page.context().newPage();
    const fehlerZwei = fehlerFangen(zweiter);
    zweiter.on('dialog', d => d.accept());
    await zweiter.goto(APP_URL);
    await waitForAppReady(zweiter);
    await timerAnsicht(zweiter);
    await zahnrad(zweiter);
    await loeschen(zweiter, 'Licht');
    expect(await imSpeicher(page), 'Vorbedingung A: der zweite Tab hat Licht geloescht').toEqual([
        FACKEL,
        SEGEN
    ]);

    await expect(page.locator(MODAL), 'Vorbedingung A: hier ist ✏️ Licht noch offen').toHaveClass(
        /\bshow\b/
    );
    const meldungenA = await speichern(page);

    const hell = { name: 'Licht hell', emoji: '', hours: 0, minutes: 0, seconds: 30 };
    weich(
        await imSpeicher(page),
        'A (Index = Laenge): die Eingabe ist als neue Vorlage gespeichert'
    ).toEqual([FACKEL, SEGEN, hell]);
    weich(
        aktualisiert(meldungenA),
        'A: keine Meldung "aktualisiert" fuer eine Vorlage, die es nicht mehr gibt'
    ).toEqual([]);
    weich(
        warntNeu(meldungenA),
        `A: die Warnung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungenA)}`
    ).toBe(true);

    // B: hier ✏️ "Licht hell" (frisch geoeffnet, damit die Liste den Speicher
    // zeigt), drueben verschwinden ZWEI Vorlagen. Hat A die Eingabe verworfen,
    // gibt es "Licht hell" nicht — dann endet der Fall HIER nach 5 s mit einem
    // Satz statt nach 60 s an einem Klick, der nichts findet.
    await kreuz(page);
    await zahnrad(page);
    await expect(
        zeile(page, 'Licht hell'),
        'Vorbedingung B: A hat "Licht hell" gespeichert'
    ).toHaveCount(1);
    await bearbeiten(page, 'Licht hell');
    await page.locator('#preset-name').fill('Licht dunkel');
    await kreuz(zweiter);
    await zahnrad(zweiter);
    await loeschen(zweiter, 'Segen');
    await loeschen(zweiter, 'Licht hell');
    expect(
        await imSpeicher(page),
        'Vorbedingung B: der zweite Tab hat Segen und "Licht hell" geloescht'
    ).toEqual([FACKEL]);

    const meldungenB = await speichern(page);
    weich(
        await imSpeicher(page),
        'B (Index > Laenge): die Eingabe ist als neue Vorlage gespeichert, ohne Loch'
    ).toEqual([FACKEL, { ...hell, name: 'Licht dunkel' }]);
    weich(
        aktualisiert(meldungenB),
        'B: keine Meldung "aktualisiert" fuer eine Vorlage, die es nicht mehr gibt'
    ).toEqual([]);
    weich(
        warntNeu(meldungenB),
        `B: die Warnung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungenB)}`
    ).toBe(true);

    weich(await fehlerZwei.alle(), 'zweiter Tab: kein Fehler').toEqual([]);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) ✏️ A → 🗑️ A IM SELBEN DIALOG: DAS FORMULAR WIRD LEER
// ===========================================================================
//
// Gemessen (V3): nach 🗑️ Fackel zeigt der Index 0 auf Segen, 💾 ueberschreibt
// SEGEN — eine Vorlage, die niemand angefasst hat.
test('(6) R8: ✏️ Fackel → 🗑️ Fackel: das Formular wird leer, 💾 ueberschreibt Segen nicht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await laden(page);

    await zahnrad(page);
    expect(await formular(page), 'Vorbedingung: das frische Formular nach ⚙️').toEqual(LEER);
    await bearbeiten(page, 'Fackel');
    await loeschen(page, 'Fackel');
    expect(await imSpeicher(page), 'Vorbedingung: Fackel ist geloescht').toEqual([SEGEN, LICHT]);

    weich(
        await formular(page),
        'nach 🗑️ der gerade bearbeiteten Vorlage muss das Formular leer sein'
    ).toEqual(LEER);
    await page.locator('#preset-name').fill('Schild');
    const meldungen = await speichern(page);

    const erwartet = [
        SEGEN,
        LICHT,
        { name: 'Schild', emoji: '', hours: 0, minutes: 10, seconds: 0 }
    ];
    weich(await imSpeicher(page), 'Speicher: Segen bleibt feldgleich, Schild kommt dazu').toEqual(
        erwartet
    );
    weich(aktualisiert(meldungen), 'eine Neuanlage heisst nicht "aktualisiert"').toEqual([]);

    await neuLaden(page);
    weich(await imSpeicher(page), 'Speicher nach dem Neuladen').toEqual(erwartet);
    weich(await leiste(page), 'die Schnellleiste nach dem Neuladen').toEqual([
        '✨ Segen',
        '⏱️ Licht',
        '⏱️ Schild'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) ✏️ B → 🗑️ A (DAVOR): DER BEARBEITEN-INDEX RUECKT NACH
// ===========================================================================
//
// Heute zeigt der Index 1 nach dem Loeschen von Fackel auf LICHT; 💾 schreibt
// die geaenderte Segen-Vorlage ueber Licht, und Segen bleibt alt stehen. Die
// Regel: die Bearbeitung gilt weiter Segen, Licht bleibt feldgleich.
test('(7) R8: ✏️ Segen → 🗑️ Fackel: 💾 aendert Segen, Licht bleibt feldgleich', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await laden(page);

    await zahnrad(page);
    await bearbeiten(page, 'Segen');
    await loeschen(page, 'Fackel');
    expect(await imSpeicher(page), 'Vorbedingung: Fackel ist geloescht').toEqual([SEGEN, LICHT]);

    // Was der Nutzer sieht: die Bearbeitung von Segen laeuft weiter.
    const f = await formular(page);
    weich(
        { name: f.name, emoji: f.emoji, h: f.h, m: f.m, s: f.s, knopf: f.knopf },
        'das Formular bearbeitet nach 🗑️ Fackel weiter Segen'
    ).toEqual({ name: 'Segen', emoji: '✨', h: '0', m: '1', s: '0', knopf: 'Vorlage speichern' });
    await page.locator('#preset-minutes').fill('2');
    const meldungen = await speichern(page);

    const erwartet = [{ ...SEGEN, minutes: 2 }, LICHT];
    weich(await imSpeicher(page), 'Speicher: Segen geaendert, Licht feldgleich').toEqual(erwartet);
    weich(meldungen, 'die Meldung des Speicherns').toContain('success: Vorlage aktualisiert');

    await neuLaden(page);
    weich(await imSpeicher(page), 'Speicher nach dem Neuladen').toEqual(erwartet);
    weich(await leiste(page), 'die Schnellleiste nach dem Neuladen').toEqual([
        '✨ Segen',
        '⏱️ Licht'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) WAECHTER: ✏️ A → 🗑️ A ABGELEHNT, 🗑️ C (DAHINTER): DER INDEX BLEIBT
// ===========================================================================
//
// Schon heute gruen. Haelt den Fix von drei falschen Wegen ab:
//   - das Formular bei JEDEM Loeschen leeren oder den Index bei JEDEM Loeschen
//     senken (🗑️ Licht liegt HINTER der bearbeiteten Fackel);
//   - VOR der Rueckfrage leeren bzw. nachfuehren (etwa im Aktions-Haendler):
//     wer 🗑️ Fackel ablehnt, hat nichts geloescht — die Bearbeitung laeuft
//     weiter, mit allem, was schon eingetippt ist.
test('(8) R8 (Waechter): ✏️ Fackel → 🗑️ Fackel abgelehnt → 🗑️ Licht: 💾 aendert Fackel, Segen bleibt feldgleich', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    let annehmen = true;
    page.on('dialog', d => (annehmen ? d.accept() : d.dismiss()));
    await laden(page);

    await zahnrad(page);
    await bearbeiten(page, 'Fackel');
    await page.locator('#preset-hours').fill('2');

    annehmen = false;
    await zeile(page, 'Fackel').locator('[data-action="delete-timer-preset"]').click();
    expect(await imSpeicher(page), 'Vorbedingung: 🗑️ Fackel abgelehnt, nichts geloescht').toEqual([
        FACKEL,
        SEGEN,
        LICHT
    ]);
    const f = await formular(page);
    weich(
        { name: f.name, emoji: f.emoji, h: f.h, knopf: f.knopf },
        'nach abgelehntem 🗑️ Fackel bearbeitet das Formular weiter Fackel, mit der Eingabe'
    ).toEqual({ name: 'Fackel', emoji: '🔥', h: '2', knopf: 'Vorlage speichern' });

    annehmen = true;
    await loeschen(page, 'Licht');
    expect(await imSpeicher(page), 'Vorbedingung: Licht ist geloescht').toEqual([FACKEL, SEGEN]);

    const meldungen = await speichern(page);

    weich(await imSpeicher(page), 'Speicher: Fackel geaendert, Segen feldgleich').toEqual([
        { ...FACKEL, hours: 2 },
        SEGEN
    ]);
    weich(meldungen, 'die Meldung des Speicherns').toContain('success: Vorlage aktualisiert');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) KONTROLLE: ✏️ → 💾 → ⚙️ → 💾 LEGT SCHON HEUTE RICHTIG AN
// ===========================================================================
//
// Nach einem ECHTEN Speichern leert saveTimerPreset() das Formular selbst —
// Index, Name, Emoji. Die Zeitfelder bleiben heute stehen (Ursache wie in
// Fall 3); diese Kontrolle gibt darum ALLE Zeiten selbst ein und prueft sie im
// Formular nicht — sie soll vor UND nach dem Fix gruen sein.
test('(9) (Kontrolle): ✏️ → 💾 → ✕ → ⚙️ → 💾 legt eine neue Vorlage an', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);

    await zahnrad(page);
    await bearbeiten(page, 'Fackel');
    await page.locator('#preset-name').fill('Fackel lang');
    await page.locator('#preset-hours').fill('2');
    const ersteMeldungen = await speichern(page);
    weich(await imSpeicher(page), 'Speicher nach ✏️ → 💾').toEqual([
        { ...FACKEL, name: 'Fackel lang', hours: 2 },
        SEGEN,
        LICHT
    ]);
    weich(ersteMeldungen, 'die Meldung des Bearbeitens').toContain('success: Vorlage aktualisiert');

    await kreuz(page);
    await zahnrad(page);
    const f = await formular(page);
    weich(
        {
            index: f.index,
            name: f.name,
            emoji: f.emoji,
            knopf: f.knopf,
            abbrechenSichtbar: f.abbrechenSichtbar
        },
        '⚙️ nach ✏️ → 💾: Anlege-Zustand'
    ).toEqual({
        index: '',
        name: '',
        emoji: '',
        knopf: 'Vorlage hinzufügen',
        abbrechenSichtbar: false
    });

    await page.locator('#preset-name').fill('Schild');
    await page.locator(`${MODAL} .emoji-picker-mini`).getByRole('button', { name: '🛡️' }).click();
    await page.locator('#preset-hours').fill('0');
    await page.locator('#preset-minutes').fill('5');
    await page.locator('#preset-seconds').fill('0');
    const meldungen = await speichern(page);

    const erwartet = [
        { ...FACKEL, name: 'Fackel lang', hours: 2 },
        SEGEN,
        LICHT,
        { name: 'Schild', emoji: '🛡️', hours: 0, minutes: 5, seconds: 0 }
    ];
    weich(await imSpeicher(page), 'Speicher: Fackel lang bleibt, Schild kommt dazu').toEqual(
        erwartet
    );
    weich(meldungen, 'die Meldung des Anlegens').toContain('success: Vorlage hinzugefügt');

    await neuLaden(page);
    weich(await imSpeicher(page), 'Speicher nach dem Neuladen').toEqual(erwartet);
    weich(await leiste(page), 'die Schnellleiste nach dem Neuladen').toEqual([
        '🔥 Fackel lang',
        '✨ Segen',
        '⏱️ Licht',
        '🛡️ Schild'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
