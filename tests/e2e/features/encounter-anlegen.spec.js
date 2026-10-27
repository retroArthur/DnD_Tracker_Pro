// @ts-check
/**
 * Anlegen nach abgebrochenem Bearbeiten — das Encounter-Klappformular (ENC)
 * ========================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer einen Encounter
 * bearbeitet, das Formular verlaesst und danach "neu" waehlt, legt einen NEUEN
 * Encounter an** — der bearbeitete bleibt, wie er war, in D, im Speicher und
 * nach dem Neuladen; und jedes Anlegen und Bearbeiten laesst sich mit Strg+Z
 * einzeln zuruecknehmen, ohne etwas Fremdes mitzureissen.
 *
 * (Nicht zu verwechseln mit `encounter-formular.spec.js`: das misst, ob das
 * aufgeklappte Formular mit Maus und Finger bis "Speichern" scrollbar ist.)
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d (Branch abbrechen-neu), 1440x900, echte
 * Klicks und Tasten, Saat wie unten (Goblinboss mit jedem Feld, das das
 * Formular kennt, dazu Schattenwolf).
 *
 *   ✏️ → Kopfzeile zu → Kopfzeile   das Formular traegt id 1 und ALLE Werte des
 *   auf (ebenso Taste n, Befehls-   Goblinboss; "Neu" → 💾 UEBERSCHREIBT ihn —
 *   palette, in jeder Mischung)     D, Speicher und nach dem Neuladen
 *                                   ["1:Neu","2:Schattenwolf"]. Keine Meldung,
 *                                   kein Undo-Eintrag: Strg+Z sagt "Nichts zum
 *                                   Rückgängigmachen", der Goblinboss ist weg
 *   ✏️ → Escape                     Escape tut am Klappformular nichts; die
 *                                   Falle entsteht ueber den naechsten Weg
 *   ✏️ (offen) → "🗡️ Goblin" → 💾   die Vorlage laesst #edit-enc-id stehen:
 *                                   der Goblinboss WIRD zum Goblin, und der
 *                                   erbt Res. Feuer, Imm. Gift, Zustandsimm.
 *                                   Blind, RW Ges/Wei, Sprachen, Fertigkeiten
 *   ✏️ → Kopfzeile zu → 🗑️ →        "Neu" ist VERLOREN, still: keine Meldung,
 *   Kopfzeile/n/Palette → 💾        D und Speicher ["2:Schattenwolf"]
 *   🗑️ Schattenwolf → "Neu A"       Strg+Z nimmt NICHT das Anlegen zurueck,
 *   anlegen → Strg+Z                sondern das Loeschen — und "Neu A"
 *                                   verschwindet still mit
 *   … → ✏️ Neu A → RK 5 tippen →    Strg+Z (Fokus im Feld) nimmt "Neu A" unter
 *   Strg+Z → 💾                     dem offenen Formular weg; 💾 findet die ID
 *                                   nicht, speichert NICHTS und sagt nichts
 *   ✏️ → n bzw. Palette (offen)     klappt das Bearbeiten zu, statt nichts zu tun
 *
 * DIE URSACHEN:
 *   - `systems/spellslots/navigation.js:119-134` toggleCollapse() schaltet nur
 *     die Klasse `open` um und leert nie. Darauf laufen die Kopfzeile
 *     (`assets/templates/view-encounters.html:32`), die Taste n
 *     (`systems/spellslots/keyboard-shortcuts.js:812`) und die Befehlspalette
 *     (`features/command-palette/action-registry.js:47`). Nur "+ Neuer
 *     Encounter" und der Knopf der leeren Liste leeren
 *     (`features/encounters/encounters-render.js:607-614`, showEncForm()).
 *   - `features/encounters/encounters-crud.js:90-92` saveEncounter(): findet
 *     findIndex die ID nicht, passiert nichts — und `save()` (Z. 104) schreibt
 *     den unveraenderten Stand. Die ganze Funktion (Z. 27-105) ruft weder
 *     pushUndo noch saveUndoState und meldet nichts.
 *   - `features/encounters/monster-templates.js:41-91` loadMonsterTemplate()
 *     laesst #edit-enc-id stehen und setzt Resistenzen, Immunitaeten,
 *     Zustandsimmunitaeten, Rettungswuerfe, Fertigkeiten und Sprachen nicht
 *     zurueck.
 *   - `systems/spellslots/keyboard-shortcuts.js:515-519` Strg+Z wirkt "immer",
 *     auch mit dem Fokus in einem Feld des offenen Formulars.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag ABBRUCH, docs/bugfixes.md), je Fall vermerkt
 *
 *   R1  Nach Bearbeiten → Abbruch zeigt JEDER Anlege-Weg ein Formular ohne
 *       Bearbeiten-ID und ohne Werte des bearbeiteten Eintrags; 💾 legt NEU an,
 *       der bearbeitete bleibt feldgleich (D, Speicher, Neuladen). Anlege-Wege
 *       hier: Kopfzeile (1), Taste n (2), Befehlspalette (3), Schnell-Vorlage
 *       (4). Abbruch-Wege: Kopfzeile zuklappen (1)(3)(4)(6)(13), Escape (2),
 *       Knopf "Abbrechen" (5). "+ Neuer Encounter" (5) und der Knopf der
 *       leeren Liste (13) leeren schon heute und bleiben so.
 *   R2  Ein nie gespeicherter Entwurf ueberlebt Escape und Zuklappen; der
 *       naechste Anlege-Weg verwirft ihn nicht (10).
 *   R3  Bei OFFENEM Formular tun Taste n und Befehlspalette nichts — kein
 *       Zuklappen, kein Leeren —, an einem offenen ✏️ wie an einem offenen
 *       Entwurf (11). Die Kopfzeile bleibt ein Umschalter (1).
 *   R4  Zeigt die Bearbeiten-ID beim 💾 ins Leere (geloescht, per Strg+Z oder
 *       Rueckgaengig-Knopf zurueckgenommen), wird die Eingabe NEU gespeichert,
 *       mit Warnung "… existiert nicht mehr …"; keine Meldung "…
 *       aktualisiert", kein leerer Undo-Eintrag "… bearbeitet" (6)(7)(8).
 *   R5  Anlegen und Bearbeiten bekommen je einen Undo-Eintrag (9) — auch das
 *       Anlegen ueber die verwaiste ID (7)(8).
 *   R7  Eine Schnell-Vorlage fuellt immer einen NEUEN Encounter und erbt nichts
 *       vom zuvor bearbeiteten (12).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WIE GEMESSEN WIRD
 *
 * Jede Nutzerhandlung ist ein echter Klick, eine echte Taste oder echtes
 * Tippen; `page.evaluate` saet, liest aus und waehlt EINMAL die Ansicht
 * (Vorbereitung, wie im NPC-Waechter). Die Anlege-Wege werden ueber
 * sichtbaren Text, Rolle oder ihren Behaelter gewaehlt, NICHT ueber
 * `data-action`/`data-value` — ein Fix darf aus `toggle-collapse` eine eigene
 * Aktion machen, ohne dass diese Datei es merkt. Die Kopfzeile ist "der Kopf
 * der Karte, die #enc-form traegt", nicht ihr Text: ein Titel "✏️ Encounter
 * bearbeiten" (V6, eigener Vorgang) darf sie nicht unauffindbar machen.
 *
 * DIE SPEICHERUNG wird nachgewiesen, nicht angenommen: `save()` ist um 300 ms
 * entprellt, und der `_rev`-Marker der Kampagne wechselt bei JEDEM Schreiben,
 * auch wenn der Inhalt gleich bleibt. Erst danach wird der Speicher gelesen —
 * sonst waere "der Goblinboss steht unveraendert im Speicher" nicht von "es
 * wurde gar nicht geschrieben" zu unterscheiden. Auf eine fremde Speicherung
 * nach dem Laden (wie im NPC-Waechter) wird NICHT gewartet: bei dieser Saat
 * kommt keine, gemessen ueber 6 s (`_rev` blieb null, `_version` blieb
 * '99.0.0') — das Warten kostete je Fall 4 s fuer nichts.
 *
 * Der `_rev`-Wechsel allein beweist aber nicht, dass DIESES 💾 geschrieben
 * hat: geht ein Loeschen (🗑️, Strg+Z) knapp voraus, kann dessen entprelltes
 * Schreiben zwischen dem Ablesen des Markers und dem Klick fallen. Gemessen
 * (Skeptiker-Lauf, (13)): `_rev` wechselte, der Speicher hielt noch den Stand
 * VOR dem 💾 (`[]` statt `["Neu"]`), das Schreiben des 💾 kam 300 ms spaeter.
 * Darum wartet `speichern()` vor dem Ablesen, bis nichts mehr aussteht, und
 * danach auf "Marker gewechselt UND nichts mehr ausstehend" — gelesen ueber
 * `hasExplicitPendingWork()`, die oeffentliche Abfrage der Persistenz
 * (`systems/spellslots/persistence.js`, fuer den Kampagnenwechsel gebaut).
 *
 * DIE TASTE n kommt nach einem Klick auf den Titel der Werkzeugleiste. Das
 * ist Vorbereitung, nicht die gemessene Handlung: nach der Befehlspalette
 * steht der Fokus noch im versteckten `.cp-input`
 * (`features/command-palette/command-palette.js:84-91`, gemessen in 16 von 20
 * Laeufen sofort danach), und die isTyping-Schranke schluckt das n. Ein
 * Mensch klickt dann irgendwohin; genau das tut `tasteN()`.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 *   - Der Titel "… bearbeiten" (V6) — eigener Vorgang, darum liest
 *     `formular()` ihn gar nicht.
 *   - Ob Escape das Klappformular schliesst. Der Vertrag verlangt es nicht;
 *     (2) und (10) gehen darum nach Escape ueber die Kopfzeile weiter, wenn
 *     das Formular noch offen ist, und messen so beide moeglichen Fixes.
 *   - Der Knopf "Abbrechen" an einem ENTWURF: er IST das Leeren
 *     (cancelEncEdit, Vertragstabelle "Leeren") und verwirft ihn ausdruecklich.
 *   - Loeschen bei offenem Formular: am Schreibtisch hat die Liste dann die
 *     Hoehe 0 und das Detail faengt keinen Klick (gemessen, 23 (1)). R4 wird
 *     darum ueber Strg+Z und den Rueckgaengig-Knopf gefahren, "geloescht" ueber
 *     Zuklappen → 🗑️.
 *   - Telefon, Bestiarium → Encounter und Encounter-Rechner (legen ohne
 *     Formular an), Kampagnen-Import "Ersetzen" (eigener Vorgang).
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — Liste und Detail mit ✏️ und 🗑️ stehen erst ueber 900 px. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Ein Encounter mit JEDEM Feld, das das Formular liest oder schreibt — nur
 *  so zeigt sich, welche Werte in ein "neues" Formular wandern. Die
 *  Fertigkeiten sind absichtlich NICHT die der Goblin-Vorlage
 *  ("Heimlichkeit +6"), sonst saehe ein geerbter Wert aus wie ein gesetzter. */
const GOBLINBOSS = {
    id: 1,
    name: 'Goblinboss',
    creatureType: 'Humanoid',
    cr: '1',
    ac: 17,
    init: 2,
    hp: 21,
    speed: { walk: '9m', climb: '3m', swim: '', fly: '', burrow: '' },
    perception: 9,
    languages: ['Gemein', 'Goblin'],
    str: 10,
    dex: 14,
    con: 10,
    int: 10,
    wis: 8,
    cha: 10,
    savingThrows: { dex: '+4', wis: true },
    resistances: ['Feuer'],
    immunities: ['Gift'],
    conditionImmunities: ['Blind'],
    traits: '<p>Flink</p>',
    equipment: '<p>Kettenhemd</p>',
    actions: '<p>Krummsäbel</p>',
    skills: '<p>Einschüchtern +4</p>'
};

/** Ein zweiter, schlichter Encounter — der, den niemand bearbeitet. */
const SCHATTENWOLF = {
    id: 2,
    name: 'Schattenwolf',
    creatureType: '',
    cr: '',
    ac: 13,
    init: 0,
    hp: 11,
    speed: { walk: '', climb: '', swim: '', fly: '', burrow: '' },
    perception: 0,
    languages: [],
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    savingThrows: {},
    resistances: [],
    immunities: [],
    conditionImmunities: [],
    traits: '',
    equipment: '',
    actions: '',
    skills: ''
};

/** @param {object[]} encounters */
function seed(encounters) {
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
        tags: [],
        sessionNotes: [],
        encounters,
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 1,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 10,
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
 * Laedt breit, saet EINMAL je Tab und oeffnet die Encounter-Ansicht. Die Saat
 * steht hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann,
 * was die App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} encounters
 */
async function encounterLaden(page, encounters) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('encounter-anlegen-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('encounter-anlegen-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(encounters)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.evaluate(() => window.switchView('encounter'));
    await expect(page.locator('#view-encounter')).toBeVisible();
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Ein Encounter aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function encInD(page, id) {
    return page.evaluate(
        id => JSON.parse(JSON.stringify(window.D.encounters.find(e => e.id === id) ?? null)),
        id
    );
}
/** Ein Encounter aus dem Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function encImSpeicher(page, id) {
    return page.evaluate(
        ([schluessel, id]) => {
            try {
                return (
                    (JSON.parse(localStorage.getItem(schluessel) || '{}').encounters || []).find(
                        e => e.id === id
                    ) ?? null
                );
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, id]
    );
}

/** Alle Encounter-Namen in D bzw. im Speicher. Ohne ID: welche ID ein neuer
 *  Encounter bekommt, entscheidet nextId(), nicht dieser Waechter.
 *  @param {import('@playwright/test').Page} page */
function namenInD(page) {
    return page.evaluate(() => window.D.encounters.map(e => e.name));
}
/** @param {import('@playwright/test').Page} page */
function namenImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return (JSON.parse(localStorage.getItem(schluessel) || '{}').encounters || []).map(
                e => e.name
            );
        } catch {
            return ['(nicht lesbar)'];
        }
    }, SPEICHER);
}

/** Die ID des (ersten) Encounters mit diesem Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function idVon(page, name) {
    return page.evaluate(name => window.D.encounters.find(e => e.name === name)?.id ?? null, name);
}

/** Alle Felder des Formulars, wie das Template sie fuehrt — OHNE den Titel
 *  der Kopfzeile (V6, eigener Vorgang).
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        const chips = sel =>
            Array.from(
                document.querySelectorAll(`${sel} .char-resistance-chip.selected input`)
            ).map(i => /** @type {HTMLInputElement} */ (i).value);
        const html = id => document.getElementById(id)?.innerHTML;
        return {
            offen: document.getElementById('enc-form')?.classList.contains('open'),
            id: wert('edit-enc-id'),
            name: wert('enc-name'),
            typ: wert('enc-creature-type'),
            cr: wert('enc-cr'),
            rk: wert('enc-ac'),
            ini: wert('enc-init'),
            tp: wert('enc-hp'),
            wahrnehmung: wert('enc-perception'),
            tempo: ['walk', 'climb', 'swim', 'fly', 'burrow'].map(a => wert(`enc-speed-${a}`)),
            attribute: ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(a => wert(`enc-${a}`)),
            rettungswuerfe: ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(
                a =>
                    `${a}:${/** @type {HTMLInputElement|null} */ (document.getElementById(`enc-save-${a}`))?.checked}:${wert(`enc-save-val-${a}`)}`
            ),
            resistenzen: chips('#enc-resistances'),
            immunitaeten: chips('#enc-immunities'),
            zustandsimmunitaeten: chips('#enc-condition-immunities'),
            sprachen: Array.from(document.querySelectorAll('#enc-lang-dropdown input:checked')).map(
                i => /** @type {HTMLInputElement} */ (i).value
            ),
            eigenschaften: html('enc-traits'),
            ausruestung: html('enc-equipment'),
            aktionen: html('enc-actions'),
            fertigkeiten: html('enc-skills')
        };
    });
}

/** Das leere, aufgeklappte Formular im Anlege-Zustand — gemessen nach dem
 *  Laden, nach "Abbrechen" und nach "+ Neuer Encounter", dreimal gleich. */
const LEER = {
    offen: true,
    id: '',
    name: '',
    typ: '',
    cr: '',
    rk: '',
    ini: '',
    tp: '',
    wahrnehmung: '',
    tempo: ['', '', '', '', ''],
    attribute: ['10', '10', '10', '10', '10', '10'],
    rettungswuerfe: [
        'str:false:',
        'dex:false:',
        'con:false:',
        'int:false:',
        'wis:false:',
        'cha:false:'
    ],
    resistenzen: [],
    immunitaeten: [],
    zustandsimmunitaeten: [],
    sprachen: [],
    eigenschaften: '',
    ausruestung: '',
    aktionen: '',
    fertigkeiten: ''
};

/** Ist das Klappformular aufgeklappt?
 *  @param {import('@playwright/test').Page} page */
function offen(page) {
    return page.evaluate(() => !!document.getElementById('enc-form')?.classList.contains('open'));
}

/** Die Kopfzeile "+ Encounter erstellen" — gewaehlt als Kopf der Karte, die
 *  #enc-form traegt, nicht ueber `data-action` und nicht ueber ihren Text.
 *  @param {import('@playwright/test').Page} page */
function kopfzeile(page) {
    return page
        .locator('#view-encounter .card')
        .filter({ has: page.locator('#enc-form') })
        .locator('.collapsible-header');
}

/** "+ Neuer Encounter" in der Werkzeugleiste.
 *  @param {import('@playwright/test').Page} page */
function neuerEncounter(page) {
    return page.locator('#view-encounter').getByRole('button', {
        name: '+ Neuer Encounter',
        exact: true
    });
}

/** Ein Knopf der Schnell-Vorlagen IM Formular, ueber seinen Text.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function vorlage(page, name) {
    return page.locator('#enc-form .monster-templates').getByRole('button', { name });
}

/** Klickt den Titel der Werkzeugleiste (der Fokus faellt auf BODY) und
 *  drueckt n — siehe Kopfkommentar, "DIE TASTE n".
 *  @param {import('@playwright/test').Page} page */
async function tasteN(page) {
    await page.locator('#view-encounter .section-toolbar-title').click();
    await page.keyboard.press('n');
}

/** Befehlspalette → "Neuer Encounter" → Enter.
 *  @param {import('@playwright/test').Page} page */
async function palette(page) {
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    // Erst tippen, wenn das Suchfeld den Fokus hat (siehe npc-formular.spec.js (5)).
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type('Neuer Encounter');
    // Enter fuehrt den OBERSTEN Treffer aus, die Suche ist um 80 ms entprellt.
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText(
        'Neuer Encounter'
    );
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
}

/** Liste → Eintrag → ✏️ im Detail. Bearbeiten-Knoepfe duerfen ueber ihre
 *  bestehenden Selektoren gehen — sie aendern sich mit dem Fix nicht.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    await page.locator(`#encounter-list .enc-item[data-id="${id}"]`).click();
    await page.locator(`#enc-detail-panel [data-action="edit-encounter"][data-id="${id}"]`).click();
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    await expect(page.locator('#edit-enc-id')).toHaveValue(String(id));
}

/** Liste → Eintrag → 🗑️ im Detail (die Rueckfrage nimmt der Fall an).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function loeschen(page, id) {
    await page.locator(`#encounter-list .enc-item[data-id="${id}"]`).click();
    await page
        .locator(`#enc-detail-panel [data-action="delete-encounter"][data-id="${id}"]`)
        .click();
}

/** 💾 im Formular — und der Nachweis, dass danach geschrieben wurde.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} was */
async function speichern(page, was) {
    await nichtsAusstehend(page, `${was}: ein vorausgehendes Schreiben muss erst landen`);
    const rev = await revStand(page);
    await page.locator('#enc-form').getByRole('button', { name: 'Speichern', exact: true }).click();
    await geschriebenSeit(page, rev, was);
}

/** Steht ein entprelltes Schreiben aus? `null`, wenn die Persistenz die
 *  Abfrage nicht (mehr) anbietet — dann gilt die Entprellzeit als Ersatz.
 *  @param {import('@playwright/test').Page} page */
function ausstehend(page) {
    return page.evaluate(() =>
        typeof window.hasExplicitPendingWork === 'function'
            ? !!window.hasExplicitPendingWork()
            : null
    );
}
/** Wartet, bis kein entprelltes Schreiben mehr aussteht.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} was */
async function nichtsAusstehend(page, was) {
    if ((await ausstehend(page)) === null) {
        // Ohne Abfrage: laenger als die Entprellung (300 ms) warten.
        await page.waitForTimeout(450);
        return;
    }
    await expect.poll(() => ausstehend(page), { timeout: SOFORT_MS, message: was }).toBe(false);
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

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu, auch wenn der Inhalt gleich bleibt.
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}
/** Wartet, bis seit `rev` geschrieben wurde UND kein Schreiben mehr aussteht
 *  (siehe Kopfkommentar: ein fremder `_rev`-Wechsel ist kein Nachweis).
 *  @param {import('@playwright/test').Page} page
 *  @param {string|null} rev
 *  @param {string} was */
async function geschriebenSeit(page, rev, was) {
    await expect
        .poll(async () => (await revStand(page)) !== rev && (await ausstehend(page)) !== true, {
            timeout: SOFORT_MS,
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .toBe(true);
}

/** Der oberste Eintrag des Rueckgaengig-Stapels, als Text.
 *  @param {import('@playwright/test').Page} page */
function undoKopf(page) {
    return page.evaluate(() =>
        String(undoStack.length ? undoStack[undoStack.length - 1].action : '(leer)')
    );
}

/**
 * Prueft den Bestand nach einem 💾 (der Nachweis des Schreibens liegt davor):
 * die Namen in D und im Speicher, und der Encounter, der unberuehrt bleiben
 * muss, feldgleich in beiden.
 * @param {import('@playwright/test').Page} page
 * @param {string} wo
 * @param {string[]} namen
 * @param {object} unberuehrt
 */
async function bestand(page, wo, namen, unberuehrt) {
    const id = /** @type {{id: number}} */ (unberuehrt).id;
    weich(await namenInD(page), `${wo}: Namen in D`).toEqual(namen);
    weich(await encInD(page, id), `${wo}: der unberuehrte Encounter in D`).toEqual(unberuehrt);
    weich(await namenImSpeicher(page), `${wo}: Namen im Speicher`).toEqual(namen);
    weich(await encImSpeicher(page, id), `${wo}: der unberuehrte Encounter im Speicher`).toEqual(
        unberuehrt
    );
}

/** Neu laden (die Saat-Sperre haelt) und den Bestand in D pruefen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string[]} namen
 *  @param {object} unberuehrt */
async function nachNeuladen(page, namen, unberuehrt) {
    await page.reload();
    await waitForAppReady(page);
    const id = /** @type {{id: number}} */ (unberuehrt).id;
    weich(await namenInD(page), 'nach dem Neuladen: Namen in D').toEqual(namen);
    weich(await encInD(page, id), 'nach dem Neuladen: der unberuehrte Encounter').toEqual(
        unberuehrt
    );
}

// ===========================================================================
// (1) R1 — KOPFZEILE ZU, KOPFZEILE AUF: LEER, UND 💾 LEGT NEU AN
// ===========================================================================
//
// Der haeufigste Weg: man sieht sich einen Encounter in ✏️ an, klappt die
// Karte wieder zu und will spaeter "+ Encounter erstellen". Vor dem Fix trug
// das Formular den Goblinboss samt ID, und "Neu" → 💾 ueberschrieb ihn —
// still, ohne Undo, auch nach dem Neuladen.
test('(1) R1: ✏️ → Kopfzeile zu → Kopfzeile auf zeigt ein leeres Formular, 💾 legt einen NEUEN Encounter an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);
    const goblinboss = await encInD(page, 1);
    expect(goblinboss, 'die Saat muss so in D ankommen, sonst misst der Fall die Saat').toEqual(
        GOBLINBOSS
    );

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(
        page.locator('#enc-form'),
        'R3: die Kopfzeile bleibt ein Umschalter — sie klappt das offene ✏️ zu'
    ).not.toHaveClass(/\bopen\b/);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form'), 'Vorbedingung: die Kopfzeile klappt auf').toHaveClass(
        /\bopen\b/
    );
    weich(await formular(page), 'Kopfzeile nach ✏️ → Kopfzeile zu: leer, ohne ID').toEqual(LEER);

    await page.locator('#enc-name').fill('Neu');
    await speichern(page, 'Kopfzeile → 💾');
    await bestand(page, 'nach 💾', ['Goblinboss', 'Schattenwolf', 'Neu'], goblinboss);
    await nachNeuladen(page, ['Goblinboss', 'Schattenwolf', 'Neu'], goblinboss);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) R1 — ESCAPE, DANN TASTE n
// ===========================================================================
//
// Escape tut am Klappformular heute nichts (gemessen: Formular, ID und Felder
// bleiben). Ob ein Fix das aendert, laesst dieser Fall offen: ist das
// Formular nach Escape noch offen, klappt der Nutzer es per Kopfzeile zu —
// das ist dann der Abbruch. Danach oeffnet die Taste n.
test('(2) R1: ✏️ → Escape (→ Kopfzeile zu) → Taste n zeigt ein leeres Formular, 💾 legt NEU an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);
    const goblinboss = await encInD(page, 1);

    await bearbeiten(page, 1);
    await page.locator('#enc-name').click();
    await page.keyboard.press('Escape');
    if (await offen(page)) await kopfzeile(page).click();
    await expect(page.locator('#enc-form'), 'Vorbedingung: das Formular ist zu').not.toHaveClass(
        /\bopen\b/
    );

    await tasteN(page);
    await expect(page.locator('#enc-form'), 'Vorbedingung: Taste n klappt auf').toHaveClass(
        /\bopen\b/
    );
    weich(await formular(page), 'Taste n nach ✏️ → Escape: leer, ohne ID').toEqual(LEER);

    await page.locator('#enc-name').fill('Neu');
    await speichern(page, 'Taste n → 💾');
    await bestand(page, 'nach 💾', ['Goblinboss', 'Schattenwolf', 'Neu'], goblinboss);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) R1 — KOPFZEILE ZU, DANN BEFEHLSPALETTE "NEUER ENCOUNTER"
// ===========================================================================
test('(3) R1: ✏️ → Kopfzeile zu → Befehlspalette "Neuer Encounter" zeigt ein leeres Formular, 💾 legt NEU an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);
    const goblinboss = await encInD(page, 1);

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form'), 'Vorbedingung: zu').not.toHaveClass(/\bopen\b/);

    await palette(page);
    await expect(page.locator('#enc-form'), 'Vorbedingung: die Palette klappt auf').toHaveClass(
        /\bopen\b/
    );
    weich(await formular(page), 'Befehlspalette nach ✏️ → Kopfzeile zu: leer, ohne ID').toEqual(
        LEER
    );

    await page.locator('#enc-name').fill('Neu');
    await speichern(page, 'Palette → 💾');
    await bestand(page, 'nach 💾', ['Goblinboss', 'Schattenwolf', 'Neu'], goblinboss);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) R1 — DIE SCHNELL-VORLAGE NACH DEM ZUKLAPPEN
// ===========================================================================
//
// Die Vorlagen liegen IM Formular; wer sie nach einem abgebrochenen
// Bearbeiten benutzt, will einen neuen Goblin. Vor dem Fix wurde der
// Goblinboss zum Goblin. Ob die Vorlage dabei Felder erbt, misst (12).
test('(4) R1: ✏️ → Kopfzeile zu → auf → Schnell-Vorlage "Goblin": ohne ID, 💾 legt einen NEUEN Goblin an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);
    const goblinboss = await encInD(page, 1);

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form'), 'Vorbedingung: zu').not.toHaveClass(/\bopen\b/);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form'), 'Vorbedingung: auf').toHaveClass(/\bopen\b/);

    await vorlage(page, 'Goblin').click();
    await expect(page.locator('#enc-name'), 'Vorbedingung: die Vorlage ist geladen').toHaveValue(
        'Goblin'
    );
    weich((await formular(page)).id, 'nach der Vorlage: keine Bearbeiten-ID').toBe('');

    await speichern(page, 'Vorlage → 💾');
    await bestand(page, 'nach 💾', ['Goblinboss', 'Schattenwolf', 'Goblin'], goblinboss);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) KONTROLLE — WAS SCHON VOR DEM FIX STIMMTE, BLEIBT SO
// ===========================================================================
//
// Drei Wege, die das Formular schon heute leeren und so bleiben sollen:
// 💾 (saveEncounter() ruft cancelEncEdit()), der Knopf "Abbrechen" (der
// einzige Abbruch-Weg, der heute leert) und "+ Neuer Encounter" (leert immer,
// Vertrag R1: "bleibt, wie es ist"). Danach je ein Anlege-Weg — jeder zeigt
// ein leeres Formular, und das letzte 💾 legt neu an.
test('(5) R1 (Kontrolle): nach ✏️ → 💾, ✏️ → "Abbrechen" und ✏️ → "+ Neuer Encounter" ist das Formular leer und legt NEU an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);
    const schattenwolf = await encInD(page, 2);

    // ✏️ → 💾 → Taste n
    await bearbeiten(page, 1);
    await page.locator('#enc-hp').fill('30');
    await speichern(page, '✏️ → 💾');
    weich((await encInD(page, 1))?.hp, 'der Goblinboss traegt die Aenderung').toBe(30);
    await tasteN(page);
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Taste n nach ✏️ → 💾').toEqual(LEER);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);

    // ✏️ → "Abbrechen" → Befehlspalette
    await bearbeiten(page, 1);
    await page.locator('#enc-form').getByRole('button', { name: 'Abbrechen', exact: true }).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
    await palette(page);
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Befehlspalette nach ✏️ → "Abbrechen"').toEqual(LEER);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);

    // ✏️ → Kopfzeile zu → "+ Neuer Encounter"
    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
    await neuerEncounter(page).click();
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    weich(await formular(page), '"+ Neuer Encounter" nach ✏️ → Kopfzeile zu').toEqual(LEER);

    await page.locator('#enc-name').fill('Neu');
    await speichern(page, '"+ Neuer Encounter" → 💾');
    await bestand(page, 'nach 💾', ['Goblinboss', 'Schattenwolf', 'Neu'], schattenwolf);
    weich((await encInD(page, 1))?.hp, 'der Goblinboss behaelt seine Aenderung').toBe(30);
    weich((await encImSpeicher(page, 1))?.hp, 'Speicher: ebenso').toBe(30);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) R4 — GELOESCHT: ✏️ → ZUKLAPPEN → 🗑️ → TASTE n → 💾
// ===========================================================================
//
// Vor dem Fix trug das Formular nach dem Loeschen noch die ID des Goblinboss;
// saveEncounter() fand sie nicht und schrieb NICHTS — ohne ein Wort. Die
// Eingabe muss als neuer Encounter ankommen. Ob die Taste n das Formular
// vorher leert (R1) oder 💾 die verwaiste ID erkennt (R4), ist Sache des
// Fixes; zeigt das Formular beim 💾 noch eine verwaiste ID, verlangt R4 die
// Warnung.
test('(6) R4: ✏️ → Kopfzeile zu → 🗑️ → Taste n → 💾 speichert die Eingabe als NEUEN Encounter', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);
    const schattenwolf = await encInD(page, 2);

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
    await loeschen(page, 1);
    await expect
        .poll(() => namenInD(page), { message: 'Vorbedingung: der Goblinboss ist geloescht' })
        .toEqual(['Schattenwolf']);

    await tasteN(page);
    await expect(page.locator('#enc-form'), 'Vorbedingung: Taste n klappt auf').toHaveClass(
        /\bopen\b/
    );
    weich(await formular(page), 'Taste n nach dem Loeschen: leer, ohne ID').toEqual(LEER);

    await page.locator('#enc-name').fill('Neu');
    const idBeimSpeichern = (await formular(page)).id;
    const stand = await meldungsStand(page);
    await speichern(page, '💾 nach dem Loeschen');

    await bestand(page, 'nach 💾', ['Schattenwolf', 'Neu'], schattenwolf);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        meldungen.filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert" fuer ein Speichern, das neu anlegt'
    ).toEqual([]);
    if (idBeimSpeichern) {
        weich(
            meldungen.some(m => m.startsWith('warning: ') && /existiert nicht mehr/.test(m)),
            `die Bearbeiten-ID ${idBeimSpeichern} zeigte ins Leere — R4 verlangt die Warnung; gemeldet: ${JSON.stringify(meldungen)}`
        ).toBe(true);
    }
    weich(await undoKopf(page), 'kein leerer Undo-Eintrag "… bearbeitet"').not.toMatch(
        /bearbeitet/
    );
    await nachNeuladen(page, ['Schattenwolf', 'Neu'], schattenwolf);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

/**
 * Gemeinsamer Anfang von (7) und (8): Schattenwolf loeschen (damit vor dem Fix
 * ein Undo-Eintrag darunter liegt), "Neu A" ueber "+ Neuer Encounter"
 * anlegen, ✏️ "Neu A", RK 5 tippen — der Fokus bleibt im Feld.
 * @param {import('@playwright/test').Page} page
 */
async function neuABearbeitenMitRk5(page) {
    await loeschen(page, 2);
    await expect.poll(() => namenInD(page)).toEqual(['Goblinboss']);
    await neuerEncounter(page).click();
    await page.locator('#enc-name').fill('Neu A');
    await speichern(page, '"Neu A" anlegen');
    await expect
        .poll(() => namenInD(page), { message: 'Vorbedingung: "Neu A" ist angelegt' })
        .toEqual(['Goblinboss', 'Neu A']);
    const neuA = await idVon(page, 'Neu A');
    await bearbeiten(page, /** @type {number} */ (neuA));
    await page.locator('#enc-ac').click();
    await page.keyboard.type('5');
}

/** Das Ergebnis von (7) und (8) nach dem 💾 auf die verwaiste ID.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} stand */
async function verwaistGespeichert(page, stand) {
    const rkVonNeuA = () =>
        page.evaluate(() => window.D.encounters.filter(e => e.name === 'Neu A').map(e => e.ac));
    weich(await rkVonNeuA(), 'D: "Neu A" mit RK 5 ist gespeichert, genau einmal').toEqual([5]);
    weich(
        await page.evaluate(schluessel => {
            try {
                return (JSON.parse(localStorage.getItem(schluessel) || '{}').encounters || [])
                    .filter(e => e.name === 'Neu A')
                    .map(e => e.ac);
            } catch {
                return ['(nicht lesbar)'];
            }
        }, SPEICHER),
        'Speicher: "Neu A" mit RK 5'
    ).toEqual([5]);
    weich(await encInD(page, 1), 'der Goblinboss bleibt unberuehrt').toEqual(GOBLINBOSS);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        meldungen.filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert" fuer ein Speichern, das nicht stattfand'
    ).toEqual([]);
    weich(
        meldungen.some(m => m.startsWith('warning: ') && /existiert nicht mehr/.test(m)),
        `die Meldung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(await undoKopf(page), 'kein leerer Undo-Eintrag "… bearbeitet"').not.toMatch(
        /bearbeitet/
    );
    // R5 gilt auch hier: das 💾 auf die verwaiste ID IST ein Anlegen und braucht
    // seinen eigenen Undo-Eintrag. Fehlt er (etwa weil der Verwaist-Zweig am
    // pushUndo vorbeilaeuft), nimmt das naechste Strg+Z das Loeschen von
    // Schattenwolf zurueck — aus einem Schnappschuss ohne "Neu A": die eben
    // gerettete Eingabe verschwaende still. Das Label prueft der Fall nicht,
    // nur, WAS Strg+Z zuruecknimmt.
    await page.locator('#view-encounter .section-toolbar-title').click();
    await page.keyboard.press('Control+z');
    await weich
        .poll(() => namenInD(page), {
            timeout: SOFORT_MS,
            message:
                'R5: Strg+Z nach dem 💾 nimmt genau dieses Anlegen zurueck — Schattenwolf bleibt geloescht'
        })
        .toEqual(['Goblinboss']);
}

// ===========================================================================
// (7) R4 — STRG+Z MIT DEM FOKUS IM FELD NIMMT DEN ENCOUNTER UNTER DEM FORMULAR WEG
// ===========================================================================
//
// Strg+Z wirkt auch mit dem Fokus im Formular. Vor dem Fix nahm es das
// Loeschen von Schattenwolf zurueck (das Anlegen hatte keinen Eintrag) — und
// "Neu A" mit; nach dem Fix nimmt es das Anlegen zurueck. In beiden Faellen
// zeigt die ID ins Leere. Vor dem Fix: 💾 speicherte nichts, sagte nichts.
test('(7) R4: ✏️ "Neu A", RK 5, Strg+Z im Feld nimmt "Neu A" weg — 💾 speichert die Eingabe NEU und warnt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);

    await neuABearbeitenMitRk5(page);
    await page.keyboard.press('Control+z');
    await expect
        .poll(() => namenInD(page), { message: 'Vorbedingung: Strg+Z nimmt "Neu A" weg' })
        .not.toContain('Neu A');
    await expect(page.locator('#enc-form'), 'Vorbedingung: das Formular bleibt offen').toHaveClass(
        /\bopen\b/
    );

    const stand = await meldungsStand(page);
    await speichern(page, '💾 auf die verwaiste ID');
    await verwaistGespeichert(page, stand);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) R4 — DERSELBE WEG UEBER DEN RUECKGAENGIG-KNOPF IM KOPF
// ===========================================================================
//
// Eine Abwehr, die nur Strg+Z in Feldern sperrt, laesst diesen Weg offen
// (gemessen am Telefon-Knopf) — nur die Pruefung im Speichern hilft.
test('(8) R4: ✏️ "Neu A", RK 5, ↩️ im Kopf nimmt "Neu A" weg — 💾 speichert die Eingabe NEU und warnt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);

    await neuABearbeitenMitRk5(page);
    await page
        .locator('.header-actions')
        .getByRole('button', { name: 'Letzte Aktion rückgängig machen' })
        .click();
    await expect
        .poll(() => namenInD(page), { message: 'Vorbedingung: ↩️ nimmt "Neu A" weg' })
        .not.toContain('Neu A');
    await expect(page.locator('#enc-form'), 'Vorbedingung: das Formular bleibt offen').toHaveClass(
        /\bopen\b/
    );

    const stand = await meldungsStand(page);
    await speichern(page, '💾 auf die verwaiste ID');
    await verwaistGespeichert(page, stand);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) R5 — STRG+Z NIMMT GENAU DAS LETZTE ANLEGEN BZW. BEARBEITEN ZURUECK
// ===========================================================================
//
// Vor dem Fix legten weder Anlegen noch Bearbeiten einen Undo-Eintrag an.
// Strg+Z nahm darum das LETZTE EINGETRAGENE zurueck — hier das Loeschen von
// Schattenwolf, aus einem Schnappschuss davor: die Aenderung am Goblinboss
// UND "Neu A" verschwanden still mit, Schattenwolf kam zurueck. Richtig ist
// die Reihenfolge rueckwaerts, eine Aktion je Druck.
test('(9) R5: 🗑️ Schattenwolf, "Neu A" anlegen, ✏️ Goblinboss TP 30 — dreimal Strg+Z nimmt genau eins nach dem anderen zurueck', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);

    await loeschen(page, 2);
    await expect.poll(() => namenInD(page)).toEqual(['Goblinboss']);
    await neuerEncounter(page).click();
    await page.locator('#enc-name').fill('Neu A');
    await speichern(page, '"Neu A" anlegen');
    await expect.poll(() => namenInD(page)).toEqual(['Goblinboss', 'Neu A']);
    await bearbeiten(page, 1);
    await page.locator('#enc-hp').fill('30');
    await speichern(page, '✏️ Goblinboss → 💾');
    await expect.poll(async () => (await encInD(page, 1))?.hp).toBe(30);

    /** Ein Strg+Z mit dem Fokus auf der Seite; wartet auf seine Meldung. */
    const strgZ = async () => {
        await page.locator('#view-encounter .section-toolbar-title').click();
        const stand = await meldungsStand(page);
        await page.keyboard.press('Control+z');
        await expect
            .poll(() => meldungenSeit(page, stand), { message: 'Strg+Z meldet sich' })
            .not.toEqual([]);
    };

    await strgZ();
    weich(
        await namenInD(page),
        '1. Strg+Z: nur das Bearbeiten ist zurueck — Bestand gleich'
    ).toEqual(['Goblinboss', 'Neu A']);
    weich(await encInD(page, 1), '1. Strg+Z: der Goblinboss wie in der Saat').toEqual(GOBLINBOSS);

    await strgZ();
    weich(
        await namenInD(page),
        '2. Strg+Z: nur "Neu A" ist weg, Schattenwolf bleibt geloescht'
    ).toEqual(['Goblinboss']);
    await weich
        .poll(() => namenImSpeicher(page), {
            timeout: SOFORT_MS,
            message: '2. Strg+Z: der Speicher folgt'
        })
        .toEqual(['Goblinboss']);

    await strgZ();
    weich(await namenInD(page), '3. Strg+Z: jetzt erst kommt Schattenwolf zurueck').toEqual([
        'Goblinboss',
        'Schattenwolf'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (10) R2 WAECHTER — EIN ENTWURF UEBERLEBT ESCAPE, ZUKLAPPEN UND JEDEN ANLEGE-WEG
// ===========================================================================
//
// Der Fix darf nur leeren, wenn ein Bearbeiten Reste hinterliess (Bearbeiten-
// ID gesetzt). Ein nie gespeicherter Entwurf bleibt — wie im NPC-Waechter
// (18). Schon vor dem Fix gruen (toggleCollapse() leert nie).
test('(10) R2 (Waechter): ein Entwurf ueberlebt Escape und Zuklappen, Taste n, Palette und Kopfzeile verwerfen ihn nicht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS]);

    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    await page.locator('#enc-name').fill('Entwurf');
    await page.locator('#enc-resistances .char-resistance-chip', { hasText: 'Feuer' }).click();
    await page.locator('#enc-hp').fill('42');
    const entwurf = { ...LEER, name: 'Entwurf', tp: '42', resistenzen: ['Feuer'] };
    expect(await formular(page), 'Vorbedingung: der Entwurf steht').toEqual(entwurf);

    await page.keyboard.press('Escape');
    if (await offen(page)) await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
    await tasteN(page);
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Escape/Zuklappen → Taste n').toEqual(entwurf);

    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
    await palette(page);
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Zuklappen → Befehlspalette').toEqual(entwurf);

    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).toHaveClass(/\bopen\b/);
    weich(await formular(page), 'Zuklappen → Kopfzeile').toEqual(entwurf);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (11) R3 — TASTE n UND BEFEHLSPALETTE BEI OFFENEM ✏️ TUN NICHTS
// ===========================================================================
//
// Ein offenes Formular ist die laufende Arbeit, kein Rest. Vor dem Fix
// klappten n und Palette es ZU (die Eingabe blieb stehen, das Formular war
// aber weg) — der naechste "neu"-Weg klappte es im Bearbeiten-Zustand wieder
// auf. Der Vertrag: kein Zuklappen, kein Leeren. Ist es nach einer Taste
// doch zu, klappt der Fall es per Kopfzeile wieder auf, damit auch der
// zweite Weg gemessen wird (vor dem Fix behaelt es dabei seinen Inhalt).
//
// R3 gilt fuer JEDES aufgeklappte Formular, nicht nur fuer ein Bearbeiten:
// darum dasselbe danach an einem offenen ENTWURF. Ein Fix, der nur bei
// gesetzter ID "nichts tut" und sonst weiter umschaltet, klappte den Entwurf
// mitten in der Eingabe zu — (10) saehe das nicht, denn dort ist das
// Formular vor jedem n und jeder Palette schon zu.
test('(11) R3: Taste n und Befehlspalette bei offenem ✏️ und bei offenem Entwurf: das Formular bleibt offen und unveraendert', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);

    await bearbeiten(page, 1);
    await page.locator('#enc-hp').fill('30');
    await page.locator('#enc-form .char-section-title').first().click();
    expect(
        await page.evaluate(() => document.activeElement?.tagName),
        'Vorbedingung: nach dem Klick auf eine Ueberschrift liegt der Fokus auf BODY'
    ).toBe('BODY');
    const vorher = await formular(page);
    expect({ id: vorher.id, tp: vorher.tp }, 'Vorbedingung: das Bearbeiten-Formular').toEqual({
        id: '1',
        tp: '30'
    });

    await page.keyboard.press('n');
    weich(await formular(page), 'Taste n bei offenem ✏️').toEqual(vorher);
    if (!(await offen(page))) await kopfzeile(page).click();

    await palette(page);
    weich(await formular(page), 'Befehlspalette "Neuer Encounter" bei offenem ✏️').toEqual(vorher);
    if (!(await offen(page))) await kopfzeile(page).click();

    expect((await formular(page)).id, 'die Bearbeitung muss noch da sein').toBe('1');
    await speichern(page, '💾 nach n und Palette');
    weich(await namenInD(page), 'kein neuer Encounter').toEqual(['Goblinboss', 'Schattenwolf']);
    weich(await encInD(page, 1), 'der Goblinboss traegt die Aenderung, sonst nichts').toEqual({
        ...GOBLINBOSS,
        hp: 30
    });
    weich(await namenImSpeicher(page), 'Speicher: kein neuer Encounter').toEqual([
        'Goblinboss',
        'Schattenwolf'
    ]);
    weich(await encImSpeicher(page, 1), 'Speicher: der Goblinboss mit TP 30').toEqual({
        ...GOBLINBOSS,
        hp: 30
    });

    // Derselbe Doppelweg an einem offenen Entwurf (keine ID).
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form'), 'Vorbedingung: die Kopfzeile klappt auf').toHaveClass(
        /\bopen\b/
    );
    await page.locator('#enc-name').fill('Entwurf');
    await page.locator('#enc-hp').fill('42');
    await page.locator('#enc-form .char-section-title').first().click();
    expect(
        await page.evaluate(() => document.activeElement?.tagName),
        'Vorbedingung: der Fokus liegt auf BODY'
    ).toBe('BODY');
    const entwurf = await formular(page);
    expect(
        { offen: entwurf.offen, id: entwurf.id, name: entwurf.name, tp: entwurf.tp },
        'Vorbedingung: der offene Entwurf'
    ).toEqual({ offen: true, id: '', name: 'Entwurf', tp: '42' });

    await page.keyboard.press('n');
    weich(await formular(page), 'Taste n bei offenem Entwurf').toEqual(entwurf);
    if (!(await offen(page))) await kopfzeile(page).click();

    await palette(page);
    weich(await formular(page), 'Befehlspalette "Neuer Encounter" bei offenem Entwurf').toEqual(
        entwurf
    );

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (12) R7 — DIE SCHNELL-VORLAGE BEI OFFENEM ✏️ FUELLT EINEN NEUEN ENCOUNTER
// ===========================================================================
//
// Massstab ist derselbe Goblin aus einem FRISCHEN Formular ("+ Neuer
// Encounter" → Vorlage → 💾): der Goblin nach ✏️ Goblinboss → Vorlage muss
// ihm in jedem Feld gleichen — im Formular und in D. So misst der Fall "erbt
// nichts" fuer jedes Feld, auch eines, das die Vorlage heute nicht setzt,
// und haengt nicht an den SRD-Daten der Vorlage. Vor dem Fix: der Goblinboss
// wurde zum Goblin und behielt Res. Feuer, Imm. Gift, Zustandsimm. Blind,
// Rettungswuerfe, Sprachen und Fertigkeiten.
test('(12) R7: Schnell-Vorlage "Goblin" bei offenem ✏️ Goblinboss: ohne ID, erbt nichts, 💾 legt NEU an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await encounterLaden(page, [GOBLINBOSS, SCHATTENWOLF]);

    // Der Massstab: Goblin aus dem frischen Formular.
    await neuerEncounter(page).click();
    await vorlage(page, 'Goblin').click();
    await expect(page.locator('#enc-name')).toHaveValue('Goblin');
    const massFormular = await formular(page);
    await speichern(page, 'Massstab-Goblin → 💾');
    const massId = await idVon(page, 'Goblin');
    expect(massId, 'Vorbedingung: der Massstab-Goblin ist angelegt').not.toBeNull();
    /** @param {any} e */
    const ohneId = e => {
        const { id, ...rest } = e || {};
        return rest;
    };
    const massstab = ohneId(await encInD(page, /** @type {number} */ (massId)));

    await bearbeiten(page, 1);
    await vorlage(page, 'Goblin').click();
    await expect(page.locator('#enc-name')).toHaveValue('Goblin');
    weich(await formular(page), 'Formular nach der Vorlage bei offenem ✏️').toEqual(massFormular);

    await speichern(page, 'Vorlage bei offenem ✏️ → 💾');
    await bestand(page, 'nach 💾', ['Goblinboss', 'Schattenwolf', 'Goblin', 'Goblin'], GOBLINBOSS);
    // Jeder Goblin ausser dem Massstab, ohne ID — in D und im Speicher.
    const neueGoblins = await page.evaluate(
        ([schluessel, massId]) => {
            const ohne = liste =>
                (liste || [])
                    .filter(e => e.name === 'Goblin' && e.id !== massId)
                    .map(e => {
                        const { id, ...rest } = JSON.parse(JSON.stringify(e));
                        return rest;
                    });
            let speicher;
            try {
                speicher = ohne(JSON.parse(localStorage.getItem(schluessel) || '{}').encounters);
            } catch {
                speicher = ['(nicht lesbar)'];
            }
            return { d: ohne(window.D.encounters), speicher };
        },
        [SPEICHER, massId]
    );
    weich(
        neueGoblins.d,
        'D: der neue Goblin gleicht dem aus dem frischen Formular in jedem Feld'
    ).toEqual([massstab]);
    weich(neueGoblins.speicher, 'Speicher: ebenso').toEqual([massstab]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (13) KONTROLLE — DER KNOPF DER LEEREN LISTE LEERT SCHON HEUTE UND BLEIBT SO
// ===========================================================================
//
// Der letzte Anlege-Weg aus dem Vertrag: "+ Encounter erstellen" in der
// LEEREN Liste (`features/encounters/encounters-render.js:143`, showEncForm()).
// Man trifft ihn erst, wenn der letzte Encounter geloescht ist — typisch nach
// ✏️ → Zuklappen → 🗑️, also genau mit einem Bearbeiten-Rest im Formular. Er
// leert schon heute (gemessen, V3 "leerende Wege"); der Fall haelt fest, dass
// er es nach dem Fix weiter tut (Vertrag R1: "bleibt, wie er ist"). Gewaehlt
// ueber Rolle und Text IN der Liste — die Kopfzeile traegt denselben Text,
// ist aber kein Knopf und liegt nicht in #encounter-list.
test('(13) R1 (Kontrolle): ✏️ → Kopfzeile zu → 🗑️ des letzten → "+ Encounter erstellen" der leeren Liste ist leer und legt NEU an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await encounterLaden(page, [GOBLINBOSS]);

    await bearbeiten(page, 1);
    await kopfzeile(page).click();
    await expect(page.locator('#enc-form')).not.toHaveClass(/\bopen\b/);
    await loeschen(page, 1);
    await expect
        .poll(() => namenInD(page), { message: 'Vorbedingung: die Liste ist leer' })
        .toEqual([]);

    await page
        .locator('#encounter-list')
        .getByRole('button', { name: '+ Encounter erstellen', exact: true })
        .click();
    await expect(page.locator('#enc-form'), 'Vorbedingung: der Knopf klappt auf').toHaveClass(
        /\bopen\b/
    );
    weich(await formular(page), 'Knopf der leeren Liste nach ✏️ → Zuklappen → 🗑️').toEqual(LEER);

    await page.locator('#enc-name').fill('Neu');
    await speichern(page, 'leere Liste → 💾');
    weich(await namenInD(page), 'nach 💾: Namen in D').toEqual(['Neu']);
    weich(await namenImSpeicher(page), 'nach 💾: Namen im Speicher').toEqual(['Neu']);
    await page.reload();
    await waitForAppReady(page);
    weich(await namenInD(page), 'nach dem Neuladen: Namen in D').toEqual(['Neu']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
