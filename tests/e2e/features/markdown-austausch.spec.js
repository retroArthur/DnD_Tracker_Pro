// @ts-check
/**
 * Der Waechter des Markdown-Austauschs (MARKDOWN)
 * ===============================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **"📄 Export" und
 * "📥 Import" im Fuss der Formulare von NPC, Quest und Zauber tun, was sie
 * versprechen** — Export liefert eine .md-Datei mit dem gespeicherten Stand,
 * Import legt den Inhalt in das OFFENE Formular, und erst "Speichern" sichert
 * ihn: mit Undo, sanitisiert, im Speicher, ueber das Neuladen hinaus. ✕
 * verwirft ihn wie jede andere Aenderung im Formular.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand — SECHS BRUECHE HINTEREINANDER
 *
 * Seit der Einfuehrung (ed01efb, 2026-01-19; Knoepfe 5b281f1, 2026-01-20)
 * hat keiner der sechs Knoepfe je etwas getan. Gemessen am Buendel zu
 * 429ad8f, 1440x900, echte Klicks:
 *
 *   (1) Die Knoepfe trugen data-action="call" data-value="exportNPCAsMarkdown"
 *       usw. `call` ruft window[name] — die sechs Namen waren aber SCHLUESSEL
 *       des Aktionsobjekts in ui/actions/system-actions.js, keine Funktionen
 *       an window. Jeder Klick: console.error "Call-Ziel ist keine Funktion",
 *       kein Toast. fbb1864 (SEC-03) hatte die sechs Namen sogar in die
 *       CALL_ACTION_WHITELIST uebernommen — 6 von 128 Eintraegen zeigten ins
 *       Leere, und nichts merkte es (Fall 12).
 *   (2) Export rief window.downloadFile — im ganzen Verlauf nie definiert.
 *       Der Guard davor schwieg: kein Download, kein Toast, kein Fehler.
 *   (3) Die Import-Schale war `<div class="modal" style="display: none;">`.
 *       showModal() setzt nur die Klasse 'show', das Inline-display gewann.
 *       Auch freigelegt war sie kein Overlay: statisch HINTER dem Formular,
 *       per Maus und Tab nicht erreichbar, Escape schloss das Formular
 *       darunter. Bei jedem Oeffnen kam ein change-Listener dazu, und der
 *       alte Zustand (Vorschau, aktiver Knopf) blieb stehen.
 *   (4) Der Import schrieb an D vorbei am offenen Formular und rief save().
 *       Das Editorfeld blieb alt — das naechste "Speichern" im noch offenen
 *       Formular schrieb die alte Beschreibung zurueck (gemessen fuer alle
 *       drei Typen: der Import ging still verloren). ✕ verwarf ihn NICHT.
 *   (5) Kein pushUndo — Strg+Z griff nicht.
 *   (6) renderNPCs gab es nicht (richtig: renderNPCList), die NPC-Ansicht
 *       blieb alt.
 *
 * DAZU, VON DER GEGENPRUEFUNG GEFUNDEN — DIE SIEBTE SCHICHT (Fall 14):
 * showModal() ruft fuer JEDES Modal populateSelects(), und das baute
 * #npc-location, #npc-filter und #loc-filter neu, ohne die Auswahl zu
 * halten. Geht die Import-Schale UEBER dem offenen NPC-Formular auf, standen
 * Ort und Filter danach auf '' — und "Speichern" schrieb null in D und in
 * den Speicher. Dieselbe Falle traf ✏️ an einem Ort mit Filter: editLocation()
 * setzt den Filter, showModal() wischt ihn weg, Speichern macht null daraus
 * (Fall 15, gemessen: filterId 1 -> null). Fall 16 haelt fest, dass die
 * Reparatur keine Auswahl von einem Eintrag zum naechsten mitschleppt.
 *
 * DER EXPORT-KOPF las Felder, die es nicht gibt: Quest-Status aus `status`
 * (gespeichert ist `completed` — "Offen" auch bei abgeschlossenen Quests),
 * Auftraggeber/Ort aus `giver`/`location` (gespeichert sind giverName und
 * locationName), Zauber "**Typ:** spell". Am Ende hingen bis zu sechs leere
 * Zeilen. Und ein exportierter Text kam beim Re-Import mit seinem Kopf als
 * "<h1>Grimbold</h1>" und "<b>Typ:</b> NPC" in die Beschreibung (Fall 13).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS DIE FAELLE MESSEN, UND WARUM JEDER AM ALTEN CODE ROT WAR
 *
 *   (1)-(3)  Export je Typ: Download binnen 3 s, Dateiname, Inhalt Zeichen
 *            fuer Zeichen. ROT: kein Download (Bruch 1, dahinter Bruch 2).
 *   (4)-(6)  Import je Typ bis in den Speicher und ueber das Neuladen. ROT:
 *            die Schale ist nicht im DOM (Bruch 1, dahinter 3).
 *   (7)      ✕ verwirft den Import. ROT wie (4). Bliebe auch rot, wenn nur
 *            Bruch 1-3 repariert waeren und der Import weiter nach D schriebe.
 *   (8)      Strg+Z nimmt den gespeicherten Import zurueck. ROT wie (4).
 *   (9)      Eine praeparierte .md bleibt harmlos — Vorschau, Formular,
 *            Speicher, Detailansicht. ROT wie (4), danach Regressionsschutz.
 *   (10)     Zweiter Import in derselben Sitzung: zurueckgesetzte Schale,
 *            GENAU ein Lesevorgang je Dateiwahl. ROT wie (4).
 *   (11)     Tab bleibt in der Schale, Escape schliesst nur sie und gibt den
 *            Fokus an "📥 Import" zurueck. ROT wie (4).
 *   (12)     Ratsche am Buendel: jeder Name der CALL_ACTION_WHITELIST ist
 *            eine Funktion an window. ROT mit genau den sechs Markdown-Namen.
 *   (13)     Rundreise Export -> Import -> Speichern ergibt denselben Text;
 *            fremde Dateien mit "# " oben bleiben unangetastet. ROT: kein
 *            Download.
 *   (14)     Ort, Filter und Fraktion des NPC ueberstehen das Oeffnen der
 *            Schale, Speichern und Neuladen. ROT wie (4) — und rot geblieben,
 *            solange populateSelects() die Auswahl verwarf.
 *   (15)     ✏️ an einem Ort zeigt und behaelt seinen Filter. ROT: '' im
 *            Formular, null nach Speichern.
 *   (16)     Keine Auswahl wandert von einem bearbeiteten Eintrag zum
 *            naechsten. Am alten Code GRUEN (populateSelects setzte alles auf
 *            ''); wird ROT, sobald populateSelects die Auswahl haelt, ohne
 *            dass editNPC()/editLocation() leere Werte selbst setzen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * NACHBESSERUNG NACH DER PRUEFUNG — vier Fehler im ersten Fix, rot am Stand
 * 2771a09, und vier Schutzstellen, die kein Fall hielt
 *
 *   (17)     Rundreise mit typischem Editorinhalt. Enter im Editor schreibt
 *            `<br>` (gemessen, Fall tippt es mit echten Tasten); der Export
 *            machte daraus ein weiches "\n", und der Import liess es als
 *            Leerraum stehen — "Zeile eins Zeile zwei" in EINER Zeile.
 *            Schlimmer: Fett, Kursiv, Durchgestrichen lasen `textContent`,
 *            und das verschluckt `<br>` ganz — `<b>eins<br>zwei</b>` kam als
 *            "einszwei" zurueck. `<u>` (Werkzeug jeder Leiste) fiel weg.
 *   (18)     Zauber mit einer Ueberschrift "Notizen" in der Beschreibung und
 *            leerer Notiz: der Import hielt sie fuer den eigenen
 *            Notiz-Abschnitt, leerte die Beschreibung und schob ihren Rest
 *            ins Notizfeld.
 *   (19)     Eine fremde Datei mit "# <Name>" und einer Label-Zeile, die der
 *            Export auch schreibt ("**Rolle:** Spion"), verlor beides still.
 *   (20)     Wird das Dateifeld nach einer Wahl wieder leer, blieben Vorschau
 *            und "Importieren" stehen — und uebernahmen die vorige Datei.
 *   (21)-(24) WAECHTER, am Stand 2771a09 gruen: Windows-Zeilenenden und BOM
 *            (21), der Platzhalter "-- NPC wählen --" im Quest-Kopf (22), die
 *            Wache "Formular offen und derselbe Eintrag" (23) und der
 *            Lesezaehler gegen einen ueberholten FileReader (24). Jeder ist
 *            gegen einen Rueckbau seiner Stelle gemessen ROT (Commit-Text).
 *            (13) aendert dazu die Notiz in der Datei vor dem Re-Import —
 *            vorher kam die unveraenderte Notiz auch ohne den Notizpfad an.
 *
 * NICHT HIER: ✏️ -> ✕ -> "+ NPC/Quest/Zauber/Ort" laesst die ID des zuvor
 * bearbeiteten Eintrags im Formular stehen (eigener Befund, eigener PR).
 * Telefonbreite ist nicht gemessen.
 *
 * Gemessene Module, deren Verhalten diese Faelle erklaeren:
 * systems/markdown-import-export.js (Export, Schale, Import),
 * systems/spellslots/navigation.js (showModal/populateSelects),
 * features/npcs/npc-crud.js, features/quests/quests-crud.js,
 * features/spells/spell-manager.js (Bearbeiten und Speichern) und
 * features/locations/locations-crud.js (Fall 15/16).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** sessionStorage-Marke: gesaet wird nur beim ERSTEN Laden je Tab, damit ein
 *  Neuladen den gespeicherten Stand zeigt und nicht wieder die Saat. */
const SAAT_MARKE = 'markdown-austausch-saat';

const GRIMBOLD = {
    id: 1,
    name: 'Grimbold',
    race: 'Zwerg',
    role: 'Schmied',
    description: 'Ein <b>Zwerg</b> mit Bart',
    locationId: 1,
    filterId: 1,
    factionId: 1,
    chapter: '',
    quests: [],
    info: [],
    relationships: [],
    triggers: [],
    dialogs: []
};

const MARA = {
    id: 2,
    name: 'Mara',
    race: 'Elf',
    role: 'Wirtin',
    description: 'Fuehrt den <i>Krug</i>',
    chapter: '',
    quests: [],
    info: [],
    relationships: [],
    triggers: [],
    dialogs: []
};

/** Typischer Editorinhalt fuer (17): Zeilenumbrueche, Unterstreichung, Fett
 *  ueber zwei Zeilen, Kursiv in Fett. */
const HILDA = {
    id: 3,
    name: 'Hilda',
    race: 'Mensch',
    role: 'Spaeherin',
    description:
        'Zeile eins<br>Zeile <u>zwei</u><br><b>fett eins<br>fett zwei</b><br><b>fett <i>und kursiv</i></b>',
    chapter: '',
    quests: [],
    info: [],
    relationships: [],
    triggers: [],
    dialogs: []
};

/** giverName/locationName so, wie saveQuest() sie schreibt: der Text der
 *  gewaehlten Option ("Name (Rolle)" beim NPC). */
const DIE_MINE = {
    id: 1,
    title: 'Die Mine',
    type: 'quest',
    description: 'Finde die <i>Mine</i>',
    epilog: '',
    completed: true,
    rewardReceived: false,
    giverId: 1,
    giverName: 'Grimbold (Schmied)',
    locationId: 1,
    locationName: 'Bergdorf',
    targetId: null,
    targetName: '',
    rewardGold: 0,
    rewardItems: [],
    rewardOther: ''
};

const FEUERBALL = {
    id: 1,
    name: 'Feuerball',
    type: 'spell',
    level: 3,
    school: 'Hervorrufung',
    spellClasses: ['Magier'],
    description: 'Eine <b>Explosion</b>',
    note: 'Vorsicht',
    time: '1 Aktion',
    range: '45 m',
    duration: 'Unmittelbar',
    ritual: false,
    v: true,
    g: true,
    m: true,
    material: 'Fledermausdung'
};

/** (18): eine Ueberschrift "Notizen" IN der Beschreibung, keine Notiz. */
const SCHILD = {
    id: 2,
    name: 'Schild',
    type: 'spell',
    level: 1,
    school: 'Bannmagie',
    spellClasses: ['Magier'],
    description: '<h2>Notizen</h2>Gehoert zur Beschreibung',
    note: '',
    time: '1 Reaktion',
    range: 'Selbst',
    duration: '1 Runde',
    ritual: false,
    v: true,
    g: true,
    m: false,
    material: ''
};

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
        characters: [],
        npcs: [GRIMBOLD, MARA, HILDA],
        locations: [
            { id: 1, name: 'Bergdorf', description: '', filterId: 1 },
            { id: 2, name: 'Hafen', description: '' }
        ],
        factions: [{ id: 1, name: 'Gilde', symbol: '' }],
        quests: [DIE_MINE],
        loot: [],
        spells: [FEUERBALL, SCHILD],
        wiki: [],
        links: [],
        filters: [{ id: 1, name: 'Kapitel 1' }],
        tags: [],
        sessionNotes: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 1,
            npcs: 4,
            locations: 3,
            quests: 2,
            encounters: 1,
            spells: 3,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1,
            filters: 2,
            factions: 2
        }
    };
}

/**
 * Die drei Formulare. `stift` ist ✏️, `eintrag` der Listeneintrag, der ✏️
 * sichtbar macht (Detail bzw. aufgeklappte Karte). Speichern wird ueber
 * data-value gefunden, nicht ueber den Text: nur das NPC-Formular schreibt
 * "💾 Speichern", Quest und Zauber nur "Speichern".
 */
const TYPEN = {
    npcs: {
        ansicht: 'npcs',
        modal: '#npc-modal',
        leiste: '#npc-markdown-actions',
        editor: '#npc-desc',
        stift: id => `#view-npcs [data-action="edit-npc"][data-id="${id}"]`,
        eintrag: id => `#view-npcs .npc-item[data-id="${id}"]`,
        speichern: '#npc-modal [data-action="call"][data-value="saveNPC"]',
        liste: 'npcs',
        datei: 'Grimbold.md',
        alt: GRIMBOLD.description
    },
    quests: {
        ansicht: 'quests',
        modal: '#quest-modal',
        leiste: '#quest-markdown-actions',
        editor: '#quest-desc',
        stift: id => `#view-quests [data-action="edit-quest"][data-id="${id}"]`,
        eintrag: id => `#view-quests .quest-header[data-id="${id}"]`,
        speichern: '#quest-modal [data-action="call"][data-value="saveQuest"]',
        liste: 'quests',
        datei: 'Die_Mine.md',
        alt: DIE_MINE.description
    },
    spells: {
        ansicht: 'spells',
        modal: '#spell-modal',
        leiste: '#spell-markdown-actions',
        editor: '#spell-desc',
        stift: id => `#view-spells [data-action="edit-spell-stop"][data-id="${id}"]`,
        eintrag: id => `#view-spells .spell-card-header[data-id="${id}"]`,
        speichern: '#spell-modal [data-action="call"][data-value="saveSpell"]',
        liste: 'spells',
        datei: 'Feuerball.md',
        alt: FEUERBALL.description
    }
};

/** Was der Export je Typ liefern muss — Zeichen fuer Zeichen, mit genau einem
 *  Zeilenumbruch am Ende. */
const EXPORT = {
    npcs: '# Grimbold\n\n**Typ:** NPC\n**Rasse:** Zwerg\n**Rolle:** Schmied\n\nEin **Zwerg** mit Bart\n',
    quests: '# Die Mine\n\n**Status:** Abgeschlossen\n**Auftraggeber:** Grimbold (Schmied)\n**Ort:** Bergdorf\n\nFinde die *Mine*\n',
    spells: '# Feuerball\n\n**Typ:** Zauber\n**Stufe:** 3\n**Schule:** Hervorrufung\n**Klassen:** Magier\n\nEine **Explosion**\n\n## Notizen\n\nVorsicht\n'
};

/** Eine fremde Datei: Ueberschrift und Fettdruck, kein Export-Kopf. */
const NEU_MD = '# Neu\n\nDas ist **fett**.';

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App (EventDelegation meldet einen
 * gefangenen Handler NUR dort und als console.error). "Failed to load
 * resource" ist Netzrauschen unter file://.
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
 * Laedt breit, saet EINMAL je Tab und wartet die fremde Speicherung ab.
 * @param {import('@playwright/test').Page} page
 */
async function laden(page) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, marke, s]) => {
            try {
                if (sessionStorage.getItem(marke)) return;
                localStorage.setItem(schluessel, JSON.stringify(s));
                sessionStorage.setItem(marke, '1');
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, SAAT_MARKE, seed()]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await fremdeSpeicherungAbwarten(page);
}

/**
 * Eine Reparatur-Speicherung nach dem Laden (`validateDataIntegrity()`) faellt
 * sonst in die Messung und schreibt D — ein Speicher-Fall wuerde gruen, ohne
 * dass Speichern gespeichert hat. Erkennbar an der ueberschriebenen
 * `_version`; kommt binnen 4 s keine, steht auch keine aus.
 * @param {import('@playwright/test').Page} page
 */
async function fremdeSpeicherungAbwarten(page) {
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
 * Oeffnet das Formular eines Eintrags mit echten Klicks: Ansicht, Eintrag
 * (falls ✏️ noch nicht sichtbar), ✏️.
 * @param {import('@playwright/test').Page} page
 * @param {'npcs'|'quests'|'spells'} typ
 * @param {number} [id]
 */
async function oeffne(page, typ, id = 1) {
    const t = TYPEN[typ];
    await page.evaluate(v => window.switchView(v), t.ansicht);
    await expect(page.locator(`#view-${t.ansicht}`)).toBeVisible();
    if (typ === 'quests') {
        // "Die Mine" ist abgeschlossen — der Filter "Aktive" blendet sie aus.
        const nurAktive = page.locator('#quest-filter-active');
        if (await nurAktive.isChecked()) await nurAktive.uncheck();
    }
    const stift = page.locator(t.stift(id)).filter({ visible: true }).first();
    if (!(await stift.isVisible())) {
        await page.locator(t.eintrag(id)).first().click();
    }
    await stift.click();
    await expect(page.locator(t.modal)).toHaveClass(/\bshow\b/);
}

/** @param {import('@playwright/test').Page} page @param {'npcs'|'quests'|'spells'} typ */
function exportKnopf(page, typ) {
    return page.locator(TYPEN[typ].leiste).getByRole('button', { name: 'Export' });
}

/** @param {import('@playwright/test').Page} page @param {'npcs'|'quests'|'spells'} typ */
function importKnopf(page, typ) {
    return page.locator(TYPEN[typ].leiste).getByRole('button', { name: 'Import' });
}

/**
 * Exportiert mit einem echten Klick und liefert Dateiname und Inhalt.
 * @param {import('@playwright/test').Page} page
 * @param {'npcs'|'quests'|'spells'} typ
 */
async function exportieren(page, typ) {
    const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 3000 }),
        exportKnopf(page, typ).click()
    ]);
    const pfad = await download.path();
    return { name: download.suggestedFilename(), inhalt: fs.readFileSync(pfad, 'utf8') };
}

/**
 * "📥 Import" -> Datei waehlen -> "Importieren", alles echt. Prueft unterwegs,
 * dass die Schale wirklich obenauf liegt und bedienbar ist.
 * @param {import('@playwright/test').Page} page
 * @param {'npcs'|'quests'|'spells'} typ
 * @param {string} markdown
 * @param {string} [name]
 */
async function importieren(page, typ, markdown, name = 'neu.md') {
    await schaleOeffnen(page, typ);
    await page.locator('#markdown-import-file').setInputFiles({
        name,
        mimeType: 'text/markdown',
        buffer: Buffer.from(markdown, 'utf8')
    });
    await expect(page.locator('#markdown-import-preview')).toBeVisible();
    await expect(page.locator('#markdown-import-confirm')).toBeEnabled();
    // OHNE force: der Knopf muss obenauf liegen und treffbar sein.
    await page.locator('#markdown-import-confirm').click();
    await expect(page.locator('#markdown-import-modal')).toBeHidden();
    await expect(page.locator(TYPEN[typ].modal)).toHaveClass(/\bshow\b/);
}

/**
 * "📥 Import" mit echtem Klick; die Schale muss sichtbar, obenauf und im
 * Fokus sein.
 * @param {import('@playwright/test').Page} page
 * @param {'npcs'|'quests'|'spells'} typ
 */
async function schaleOeffnen(page, typ) {
    await importKnopf(page, typ).click();
    await expect(page.locator('#markdown-import-modal')).toBeVisible();
    const lage = await page.evaluate(() => {
        const feld = document.getElementById('markdown-import-file');
        const r = feld?.getBoundingClientRect();
        const treffer = r ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
        return {
            getroffen: treffer === feld,
            fokusInSchale: !!document.activeElement?.closest('#markdown-import-modal')
        };
    });
    expect(lage, 'die Schale liegt obenauf, und der Fokus steht in ihr').toEqual({
        getroffen: true,
        fokusInSchale: true
    });
}

/** Ein Feld eines Eintrags in D.
 *  @param {import('@playwright/test').Page} page */
function ausD(page, liste, id, feld) {
    return page.evaluate(([l, i, f]) => window.D[l].find(e => e.id === i)?.[f], [liste, id, feld]);
}

/** Ein Feld eines Eintrags im Speicher.
 *  @param {import('@playwright/test').Page} page */
function ausSpeicher(page, liste, id, feld) {
    return page.evaluate(
        ([s, l, i, f]) => {
            try {
                return JSON.parse(localStorage.getItem(s) || '{}')[l]?.find(e => e.id === i)?.[f];
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, liste, id, feld]
    );
}

/** Laenge eines der zwei Undo-Stapel. Beide sind globale `const` und stehen
 *  NICHT an window — im Seitenkontext gilt der nackte Bezeichner.
 *  @param {import('@playwright/test').Page} page @param {'undo'|'redo'} welcher */
function stapel(page, welcher) {
    return page.evaluate(w => {
        if (w === 'undo') return typeof undoStack !== 'undefined' ? undoStack.length : -1;
        return typeof redoStack !== 'undefined' ? redoStack.length : -1;
    }, welcher);
}

/** WEICHE Zusicherungen fuer Ergebnisse: ein roter Lauf nennt JEDE gebrochene
 *  Zusage. Vorbedingungen fuer den naechsten Schritt bleiben hart. */
const weich = expect.configure({ soft: true });

// ===========================================================================
// (1)-(3) EXPORT LIEFERT EINE DATEI — mit richtigem Kopf und ohne Leerzeilen-Schwanz
// ===========================================================================
for (const [nr, typ] of /** @type {const} */ ([
    [1, 'npcs'],
    [2, 'quests'],
    [3, 'spells']
])) {
    test(`(${nr}) ${typ}: "📄 Export" liefert ${TYPEN[typ].datei} mit dem gespeicherten Stand`, async ({
        page
    }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        await laden(page);
        await oeffne(page, typ);
        // Ungespeichertes im Editor: der Export liest bewusst den GESPEICHERTEN
        // Stand (D), nicht das Formular — dokumentiert in docs/bugfixes.md.
        await page.locator(TYPEN[typ].editor).evaluate(el => {
            el.innerHTML = 'UNGESPEICHERT';
        });

        const datei = await exportieren(page, typ);
        weich(datei.name, 'Dateiname').toBe(TYPEN[typ].datei);
        weich(datei.inhalt, 'Inhalt der Datei').toBe(EXPORT[typ]);
        weich(await fehler.alle(), 'Export darf keinen Fehler hinterlassen').toEqual([]);
    });
}

// ===========================================================================
// (4)-(6) IMPORT LANDET IM FORMULAR — und erst Speichern sichert ihn, dauerhaft
// ===========================================================================
for (const [nr, typ] of /** @type {const} */ ([
    [4, 'npcs'],
    [5, 'quests'],
    [6, 'spells']
])) {
    test(`(${nr}) ${typ}: Import landet im Formular, Speichern bringt ihn in D, Speicher und ueber das Neuladen`, async ({
        page
    }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        const t = TYPEN[typ];
        await laden(page);
        await oeffne(page, typ);

        await schaleOeffnen(page, typ);
        await page.locator('#markdown-import-file').setInputFiles({
            name: 'neu.md',
            mimeType: 'text/markdown',
            buffer: Buffer.from(NEU_MD, 'utf8')
        });
        await expect(page.locator('#markdown-import-preview-content')).toContainText('fett');
        weich(
            await page.locator('#markdown-import-preview-content').innerHTML(),
            'Vorschau zeigt den Fettdruck'
        ).toContain('<b>fett</b>');
        await page.locator('#markdown-import-confirm').click();
        await expect(page.locator('#markdown-import-modal')).toBeHidden();
        await expect(page.locator(t.modal)).toHaveClass(/\bshow\b/);

        const imEditor = await page.locator(t.editor).innerHTML();
        expect(imEditor, 'der Import steht im Editorfeld des offenen Formulars').toContain(
            '<b>fett</b>'
        );
        // Noch NICHT gespeichert — das Formular ist offen, "Speichern" sichert.
        weich(await ausD(page, t.liste, 1, 'description'), 'D vor Speichern').toBe(t.alt);

        await page.locator(t.speichern).click();
        await expect(page.locator(t.modal)).not.toHaveClass(/\bshow\b/);
        weich(await ausD(page, t.liste, 1, 'description'), 'D nach Speichern').toContain(
            '<b>fett</b>'
        );
        await weich
            .poll(() => ausSpeicher(page, t.liste, 1, 'description'), {
                timeout: SOFORT_MS,
                message: 'localStorage traegt den Import'
            })
            .toContain('<b>fett</b>');

        await page.reload();
        await waitForAppReady(page);
        weich(
            await ausD(page, t.liste, 1, 'description'),
            'nach dem Neuladen steht der Import noch in D'
        ).toContain('<b>fett</b>');
        weich(await fehler.alle(), 'Import darf keinen Fehler hinterlassen').toEqual([]);
    });
}

// ===========================================================================
// (7) ✕ VERWIRFT DEN IMPORT — wie jede andere Aenderung im Formular
// ===========================================================================
test('(7) ✕ am Formular verwirft einen uebernommenen Import', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'npcs');
    await importieren(page, 'npcs', NEU_MD);
    expect(await page.locator('#npc-desc').innerHTML()).toContain('<b>fett</b>');

    await page.locator('#npc-modal .modal-header [data-action="hide-modal"]').click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    // Laenger als die Entprellung von save() warten — kaeme noch etwas, kaeme es jetzt.
    await page.waitForTimeout(1000);
    weich(await ausD(page, 'npcs', 1, 'description'), 'D bleibt alt').toBe(GRIMBOLD.description);
    weich(await ausSpeicher(page, 'npcs', 1, 'description'), 'Speicher bleibt alt').toBe(
        GRIMBOLD.description
    );
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) STRG+Z NIMMT DEN GESPEICHERTEN IMPORT ZURUECK
// ===========================================================================
test('(8) Strg+Z nimmt einen gespeicherten Import zurueck', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'npcs');
    const undoVorher = await stapel(page, 'undo');
    await importieren(page, 'npcs', NEU_MD);
    weich(await stapel(page, 'undo'), 'der Import allein legt noch keinen Undo-Schritt an').toBe(
        undoVorher
    );
    await page.locator(TYPEN.npcs.speichern).click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    expect(await ausD(page, 'npcs', 1, 'description')).toContain('<b>fett</b>');
    // NACH Speichern, VOR Strg+Z gemessen — danach schrumpft der Stapel wieder.
    weich(await stapel(page, 'undo'), 'Speichern legt genau einen Undo-Schritt an').toBe(
        undoVorher + 1
    );
    const redoVorher = await stapel(page, 'redo');

    await page.keyboard.press('Control+z');
    await expect
        .poll(() => ausD(page, 'npcs', 1, 'description'), { message: 'Strg+Z stellt her' })
        .toBe(GRIMBOLD.description);
    weich(await stapel(page, 'redo'), 'der Schritt liegt auf dem Redo-Stapel').toBe(redoVorher + 1);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) EINE PRAEPARIERTE .md BLEIBT HARMLOS
// ===========================================================================
test('(9) eine praeparierte .md loest nichts aus — Vorschau, Formular, Speicher, Detail', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    const boese = [
        '# T',
        '<img src=x onerror="window.__s1=1">',
        '<script>window.__s2=1</script>',
        '[a](javascript:window.__s3=1)',
        '[b](x" onmouseover="window.__s4=1)',
        '<svg onload="window.__s5=1"></svg>',
        '<iframe src="javascript:parent.__s6=1"></iframe>',
        '[c](JaVaScRiPt:window.__s7=1)',
        '[d](&#106;avascript:window.__s8=1)',
        '[e]( javascript:window.__s9=1)',
        '[f](java\tscript:window.__s10=1)',
        '<details open ontoggle="window.__s11=1">x</details>',
        '<a href="https://ok.example" onclick="window.__s12=1">ok</a>',
        '**<b style="background:url(javascript:window.__s13=1)">x</b>**',
        '<form action="javascript:window.__s14=1"><button>go</button></form>',
        '[g](data:text/html;base64,PHNjcmlwdD5wYXJlbnQuX19zMTU9MTwvc2NyaXB0Pg==)'
    ].join('\n\n');
    const flaggen = () =>
        page.evaluate(() => {
            /** @type {Record<string, number>} */
            const f = {};
            for (let i = 1; i <= 15; i++)
                f['__s' + i] = /** @type {any} */ (window)['__s' + i] || 0;
            return Object.entries(f)
                .filter(([, v]) => v)
                .map(([k]) => k);
        });

    await oeffne(page, 'npcs');
    await importieren(page, 'npcs', boese, 'boese.md');
    weich(await flaggen(), 'Vorschau und Formular loesen nichts aus').toEqual([]);

    await page.locator(TYPEN.npcs.speichern).click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    const d = String(await ausD(page, 'npcs', 1, 'description'));
    weich(d, 'D traegt den Import').toContain('ok');
    weich(/\son\w+\s*=/i.test(d), `D ohne on*-Attribut: ${d}`).toBe(false);
    weich(/javascript:/i.test(d), `D ohne javascript: ${d}`).toBe(false);
    weich(
        /<(script|iframe|svg|img|style|form|details)/i.test(d),
        `D ohne verbotene Tags: ${d}`
    ).toBe(false);

    await page.locator(TYPEN.npcs.eintrag(1)).first().click();
    const links = page.locator('#view-npcs a').filter({ visible: true });
    for (let i = 0; i < (await links.count()); i++) {
        await links
            .nth(i)
            .hover({ timeout: 1000 })
            .catch(() => {});
    }
    weich(await flaggen(), 'auch die Detailansicht loest nichts aus').toEqual([]);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (10) ZWEITER IMPORT IN DERSELBEN SITZUNG — frische Schale, EIN Lesevorgang
// ===========================================================================
test('(10) ein zweiter Import findet die Schale zurueckgesetzt und liest jede Datei genau einmal', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    // Der Spion zaehlt Lesevorgaenge — er misst, er handelt nicht.
    await page.evaluate(() => {
        const w = /** @type {any} */ (window);
        w.__lesungen = 0;
        const echt = FileReader.prototype.readAsText;
        FileReader.prototype.readAsText = function (...args) {
            w.__lesungen++;
            return echt.apply(this, args);
        };
    });
    const lesungen = () => page.evaluate(() => /** @type {any} */ (window).__lesungen);

    await oeffne(page, 'npcs');
    await importieren(page, 'npcs', '**eins**', 'eins.md');
    weich(await lesungen(), 'eine Dateiwahl, ein Lesevorgang').toBe(1);

    await schaleOeffnen(page, 'npcs');
    weich(
        await page.evaluate(() => ({
            vorschauSichtbar: !!document
                .getElementById('markdown-import-preview')
                ?.checkVisibility(),
            vorschauInhalt: document.getElementById('markdown-import-preview-content')?.innerHTML,
            bestaetigenAus: /** @type {HTMLButtonElement} */ (
                document.getElementById('markdown-import-confirm')
            )?.disabled,
            feld: /** @type {HTMLInputElement} */ (document.getElementById('markdown-import-file'))
                ?.value
        })),
        'beim zweiten Oeffnen ist die Schale wie neu'
    ).toEqual({ vorschauSichtbar: false, vorschauInhalt: '', bestaetigenAus: true, feld: '' });

    await page.locator('#markdown-import-file').setInputFiles({
        name: 'zwei.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('**zwei**', 'utf8')
    });
    await expect(page.locator('#markdown-import-preview-content')).toContainText('zwei');
    weich(await lesungen(), 'die zweite Dateiwahl liest genau einmal').toBe(2);
    await page.locator('#markdown-import-confirm').click();
    await expect(page.locator('#markdown-import-modal')).toBeHidden();
    weich(await page.locator('#npc-desc').innerHTML(), 'der zweite Import gilt').toBe(
        '<b>zwei</b>'
    );
    weich(
        await page.locator('#markdown-import-modal').count(),
        'es gibt genau EINE Schale im Dokument'
    ).toBe(1);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (11) TAB UND ESCAPE GEHOEREN DER IMPORT-SCHALE
// ===========================================================================
test('(11) Tab bleibt in der Schale, Escape schliesst nur sie und kehrt zu "📥 Import" zurueck', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'quests');
    await schaleOeffnen(page, 'quests');

    let raus = 0;
    for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const drin = await page.evaluate(
            () => !!document.activeElement?.closest('#markdown-import-modal')
        );
        if (!drin) raus++;
    }
    weich(raus, '12x Tab verlaesst die Schale nie').toBe(0);

    await page.keyboard.press('Escape');
    await expect(page.locator('#markdown-import-modal')).toBeHidden();
    weich(
        await page.evaluate(() => ({
            formularOffen: document.getElementById('quest-modal')?.classList.contains('show'),
            fokus: document.activeElement?.textContent?.trim()
        })),
        'Escape schliesst nur die Schale, der Fokus geht an "📥 Import" zurueck'
    ).toEqual({ formularOffen: true, fokus: '📥 Import' });
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (12) RATSCHE: JEDER NAME DER CALL-WHITELIST IST AUFRUFBAR
// ===========================================================================
test('(12) jeder Name der CALL_ACTION_WHITELIST ist im Buendel eine Funktion an window', async ({
    page
}) => {
    await laden(page);
    const erg = await page.evaluate(() => {
        const liste =
            typeof CALL_ACTION_WHITELIST !== 'undefined'
                ? CALL_ACTION_WHITELIST
                : /** @type {any} */ (window).CALL_ACTION_WHITELIST;
        const namen = [...(liste || [])];
        return {
            anzahl: namen.length,
            tot: namen.filter(n => typeof (/** @type {any} */ (window)[n]) !== 'function').sort()
        };
    });
    // Ein leerer Satz waere ein leer-gruener Waechter.
    expect(erg.anzahl, 'die Whitelist ist im Buendel erreichbar').toBeGreaterThan(100);
    expect(
        erg.tot,
        'ein `call`-Ziel, das keine Funktion ist, tut beim Klick nichts — still bis auf ein Log'
    ).toEqual([]);
});

// ===========================================================================
// (13) RUNDREISE: Export -> Import -> Speichern ergibt denselben Text
// ===========================================================================
test('(13) Export, wieder importiert und gespeichert, ergibt dieselbe Beschreibung; fremde Dateien bleiben unangetastet', async ({
    page
}) => {
    test.setTimeout(90000);
    const fehler = fehlerFangen(page);
    await laden(page);

    for (const typ of /** @type {const} */ (['npcs', 'quests', 'spells'])) {
        const t = TYPEN[typ];
        await oeffne(page, typ);
        const datei = await exportieren(page, typ);
        // Zauber: die Notiz wird in der Datei GEAENDERT — kaeme die alte an,
        // haette der Notizpfad nichts getan (das Feld traegt sie ohnehin).
        const inhalt =
            typ === 'spells'
                ? datei.inhalt.replace('\n\nVorsicht\n', '\n\nGANZ **NEU**\n')
                : datei.inhalt;
        if (typ === 'spells')
            expect(inhalt, 'die Notiz ist in der Datei ersetzt').not.toBe(datei.inhalt);
        await importieren(page, typ, inhalt, datei.name);
        const editor = await page.locator(t.editor).innerHTML();
        weich(editor, `${typ}: kein Export-Kopf im Editor`).not.toContain('<h1>');
        weich(editor, `${typ}: kein Export-Kopf im Editor`).not.toContain('Typ:');
        weich(editor, `${typ}: kein Export-Kopf im Editor`).not.toContain('Status:');
        await page.locator(t.speichern).click();
        await expect(page.locator(t.modal)).not.toHaveClass(/\bshow\b/);
        weich(await ausD(page, t.liste, 1, 'description'), `${typ}: Rundreise`).toBe(t.alt);
    }
    // Zauber: "## Notizen" des eigenen Exports geht ins Notizfeld zurueck,
    // nicht in die Beschreibung — und zwar die Notiz AUS DER DATEI.
    weich(
        await ausD(page, 'spells', 1, 'note'),
        'spells: die Notiz der Datei landet in der Notiz'
    ).toBe('GANZ <b>NEU</b>');

    // Fremde Dateien: ein "# " oben ist dort Inhalt, kein Kopf.
    await oeffne(page, 'npcs');
    await importieren(page, 'npcs', '# Kapitel\n\n**Ort:** Wald\n\nText', 'kapitel.md');
    const fremd1 = await page.locator('#npc-desc').innerHTML();
    weich(fremd1, 'fremder Titel bleibt stehen').toContain('<h1>Kapitel</h1>');
    weich(fremd1, 'fremde Label-Zeile bleibt stehen').toContain('<b>Ort:</b> Wald');
    await importieren(page, 'npcs', '# Grimbold\n\nNur Text', 'grimbold-fremd.md');
    weich(
        await page.locator('#npc-desc').innerHTML(),
        'gleicher Titel ohne Label-Zeilen ist kein Export-Kopf'
    ).toContain('<h1>Grimbold</h1>');
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (14) ORT, FILTER UND FRAKTION DES NPC UEBERSTEHEN DIE IMPORT-SCHALE
// ===========================================================================
test('(14) Ort, Filter und Fraktion des NPC ueberstehen Import-Schale, Speichern und Neuladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'npcs');
    const auswahl = () =>
        page.evaluate(() => ({
            ort: /** @type {HTMLSelectElement} */ (document.getElementById('npc-location')).value,
            filter: /** @type {HTMLSelectElement} */ (document.getElementById('npc-filter')).value,
            fraktion: /** @type {HTMLSelectElement} */ (document.getElementById('npc-faction'))
                .value
        }));
    await expect.poll(auswahl, { message: '✏️ zeigt die Auswahl des NPC' }).toEqual({
        ort: '1',
        filter: '1',
        fraktion: '1'
    });

    await schaleOeffnen(page, 'npcs');
    weich(await auswahl(), 'die Schale ueber dem Formular laesst die Auswahl stehen').toEqual({
        ort: '1',
        filter: '1',
        fraktion: '1'
    });
    await page.locator('#markdown-import-file').setInputFiles({
        name: 'neu.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from(NEU_MD, 'utf8')
    });
    await expect(page.locator('#markdown-import-confirm')).toBeEnabled();
    await page.locator('#markdown-import-confirm').click();
    await expect(page.locator('#markdown-import-modal')).toBeHidden();
    await page.locator(TYPEN.npcs.speichern).click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);

    const felder = ['locationId', 'filterId', 'factionId'];
    const ausDAlle = () =>
        Promise.all(felder.map(f => ausD(page, 'npcs', 1, f))).then(w => w.join('/'));
    weich(await ausDAlle(), 'D nach Speichern').toBe('1/1/1');
    weich(await ausD(page, 'npcs', 1, 'description'), 'der Import ist gespeichert').toContain(
        '<b>fett</b>'
    );
    await weich
        .poll(
            () =>
                Promise.all(felder.map(f => ausSpeicher(page, 'npcs', 1, f))).then(w =>
                    w.join('/')
                ),
            { timeout: SOFORT_MS, message: 'localStorage nach Speichern' }
        )
        .toBe('1/1/1');
    await page.reload();
    await waitForAppReady(page);
    weich(await ausDAlle(), 'D nach dem Neuladen').toBe('1/1/1');
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (15) ✏️ AN EINEM ORT ZEIGT UND BEHAELT SEINEN FILTER
// ===========================================================================
test('(15) ✏️ an einem Ort mit Filter zeigt ihn, und Speichern behaelt ihn', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await page.evaluate(() => window.switchView('locations'));
    await page.locator('#view-locations [data-action="select-location"][data-id="1"]').click();
    await page.locator('#view-locations [data-action="edit-location"][data-id="1"]').click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    weich(await page.locator('#loc-filter').inputValue(), 'das Formular zeigt den Filter').toBe(
        '1'
    );
    await page.locator('#location-modal [data-action="call"][data-value="saveLocation"]').click();
    await expect(page.locator('#location-modal')).not.toHaveClass(/\bshow\b/);
    weich(await page.evaluate(() => window.D.locations[0].filterId), 'D behaelt den Filter').toBe(
        1
    );
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (16) KEINE AUSWAHL WANDERT VON EINEM EINTRAG ZUM NAECHSTEN
// ===========================================================================
test('(16) ✏️ -> ✕ -> ✏️ an einem anderen Eintrag zeigt dessen leere Auswahl, nicht die des vorigen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);

    // NPC: Grimbold (Ort/Filter/Fraktion 1) -> ✕ -> Mara (nichts gewaehlt)
    await oeffne(page, 'npcs', 1);
    await expect(page.locator('#npc-location')).toHaveValue('1');
    await page.locator('#npc-modal .modal-header [data-action="hide-modal"]').click();
    await oeffne(page, 'npcs', 2);
    await expect(page.locator('#npc-name')).toHaveValue('Mara');
    // Die Fraktion setzt editNPC() 10 ms verzoegert; poll wartet das ab.
    await weich
        .poll(
            () =>
                page.evaluate(() =>
                    ['npc-location', 'npc-filter', 'npc-faction']
                        .map(
                            id =>
                                /** @type {HTMLSelectElement} */ (document.getElementById(id)).value
                        )
                        .join('/')
                ),
            { timeout: 1000, message: 'Mara traegt keine Auswahl von Grimbold' }
        )
        .toBe('//');
    await page.waitForTimeout(100);
    await page.locator(TYPEN.npcs.speichern).click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    weich(
        await Promise.all(
            ['locationId', 'filterId', 'factionId'].map(f => ausD(page, 'npcs', 2, f))
        ),
        'Speichern schreibt Mara keine fremde Auswahl zu'
    ).toEqual([null, null, null]);

    // Ort: Bergdorf (Filter 1) -> ✕ -> Hafen (kein Filter)
    await page.evaluate(() => window.switchView('locations'));
    await page.locator('#view-locations [data-action="select-location"][data-id="1"]').click();
    await page.locator('#view-locations [data-action="edit-location"][data-id="1"]').click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    await page.locator('#location-modal .modal-header [data-action="hide-modal"]').click();
    await page.locator('#view-locations [data-action="select-location"][data-id="2"]').click();
    await page.locator('#view-locations [data-action="edit-location"][data-id="2"]').click();
    await expect(page.locator('#loc-name')).toHaveValue('Hafen');
    weich(
        await page.locator('#loc-filter').inputValue(),
        'Hafen traegt keinen Filter von Bergdorf'
    ).toBe('');
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (17) RUNDREISE MIT TYPISCHEM EDITORINHALT — Zeilenumbruch, Unterstreichung,
//      Fett ueber zwei Zeilen
// ===========================================================================
test('(17) Enter, Unterstreichung und Fett ueber zwei Zeilen ueberstehen Export -> Import -> Speichern', async ({
    page
}) => {
    test.setTimeout(90000);
    const fehler = fehlerFangen(page);
    await laden(page);

    // a) Mit echten Tasten getippt: Enter schreibt im Editor <br>.
    await oeffne(page, 'npcs', 1);
    await page.locator('#npc-desc').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('Zeile eins');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Zeile zwei');
    expect(await page.locator('#npc-desc').innerHTML(), 'Enter schreibt <br>').toBe(
        'Zeile eins<br>Zeile zwei'
    );
    await page.locator(TYPEN.npcs.speichern).click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    expect(await ausD(page, 'npcs', 1, 'description')).toBe('Zeile eins<br>Zeile zwei');

    await oeffne(page, 'npcs', 1);
    const getippt = await exportieren(page, 'npcs');
    weich(getippt.inhalt, 'der Zeilenumbruch steht in der Datei').toContain(
        '\n\nZeile eins\nZeile zwei\n'
    );
    await importieren(page, 'npcs', getippt.inhalt, getippt.name);
    await page.locator(TYPEN.npcs.speichern).click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    weich(
        await ausD(page, 'npcs', 1, 'description'),
        'getippt: die Rundreise behaelt den Zeilenumbruch'
    ).toBe('Zeile eins<br>Zeile zwei');

    // b) Formatierung ueber Zeilen: Markdown kennt keine Betonung, die eine
    //    Zeile ueberspannt — der Export setzt sie JE ZEILE (dokumentierte
    //    Normalisierung), und kein Wort klebt an ein anderes.
    await oeffne(page, 'npcs', 3);
    const datei = await exportieren(page, 'npcs');
    weich(datei.inhalt, 'Hilda: Inhalt der Datei').toBe(
        '# Hilda\n\n**Typ:** NPC\n**Rasse:** Mensch\n**Rolle:** Spaeherin\n\n' +
            'Zeile eins\nZeile <u>zwei</u>\n**fett eins**\n**fett zwei**\n**fett *und kursiv***\n'
    );
    await importieren(page, 'npcs', datei.inhalt, datei.name);
    await page.locator(TYPEN.npcs.speichern).click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    weich(await ausD(page, 'npcs', 3, 'description'), 'Hilda: Rundreise').toBe(
        'Zeile eins<br>Zeile <u>zwei</u><br><b>fett eins</b><br><b>fett zwei</b><br><b>fett <i>und kursiv</i></b>'
    );

    // c) Eine zweite Rundreise aendert nichts mehr.
    await oeffne(page, 'npcs', 3);
    const zweite = await exportieren(page, 'npcs');
    weich(zweite.inhalt, 'Hilda: die zweite Rundreise schreibt dieselbe Datei').toBe(datei.inhalt);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (18) EINE UEBERSCHRIFT "NOTIZEN" IN DER BESCHREIBUNG IST KEINE NOTIZ
// ===========================================================================
test('(18) Zauber: eine Ueberschrift "Notizen" in der Beschreibung bleibt Beschreibung', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'spells', 2);
    const datei = await exportieren(page, 'spells');
    // Der Export schreibt den Notiz-Abschnitt IMMER, auch leer — sein letzter
    // "## Notizen" ist eindeutig der eigene.
    weich(datei.inhalt, 'Schild: Inhalt der Datei').toBe(
        '# Schild\n\n**Typ:** Zauber\n**Stufe:** 1\n**Schule:** Bannmagie\n**Klassen:** Magier\n\n' +
            '## Notizen\n\nGehoert zur Beschreibung\n\n## Notizen\n'
    );
    await importieren(page, 'spells', datei.inhalt, datei.name);
    weich(await page.locator('#spell-note').innerHTML(), 'das Notizfeld bleibt leer').toBe('');
    weich(
        await page.locator('#spell-desc').innerHTML(),
        'die Beschreibung behaelt ihren Text'
    ).toContain('Gehoert zur Beschreibung');
    await page.locator(TYPEN.spells.speichern).click();
    await expect(page.locator('#spell-modal')).not.toHaveClass(/\bshow\b/);
    weich(await ausD(page, 'spells', 2, 'note'), 'D: Notiz').toBe('');
    weich(
        await ausD(page, 'spells', 2, 'description'),
        'D: Beschreibung, Zeichen fuer Zeichen'
    ).toBe(SCHILD.description);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (19) FREMDE DATEI MIT DEM NAMEN DES EINTRAGS UND EINER LABEL-ZEILE
// ===========================================================================
test('(19) eine fremde Datei mit "# <Name>" und "**Rolle:** ..." behaelt beides', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'npcs', 1);
    await importieren(page, 'npcs', '# Grimbold\n\n**Rolle:** Spion\n\nGeheimer Text', 'fremd.md');
    const editor = await page.locator('#npc-desc').innerHTML();
    // Der eigene Kopf beginnt IMMER mit "**Typ:** NPC" — diese Datei nicht.
    weich(editor, 'der Titel bleibt Inhalt').toContain('<h1>Grimbold</h1>');
    weich(editor, 'die Label-Zeile bleibt Inhalt').toContain('<b>Rolle:</b> Spion');
    weich(editor, 'der Text bleibt Inhalt').toContain('Geheimer Text');
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (20) EIN WIEDER GELEERTES DATEIFELD SETZT DIE SCHALE ZURUECK
// ===========================================================================
test('(20) wird das Dateifeld nach einer Wahl wieder leer, gibt es nichts zu importieren', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'npcs', 1);
    await schaleOeffnen(page, 'npcs');
    await page.locator('#markdown-import-file').setInputFiles({
        name: 'a.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('**AAA**', 'utf8')
    });
    await expect(page.locator('#markdown-import-preview-content')).toContainText('AAA');
    // So verwerfen Browser die Auswahl, wenn der Dateidialog abgebrochen wird.
    await page.locator('#markdown-import-file').setInputFiles([]);
    await expect(page.locator('#markdown-import-file')).toHaveValue('');
    await weich(page.locator('#markdown-import-preview'), 'keine Vorschau ohne Datei').toBeHidden();
    await weich(
        page.locator('#markdown-import-confirm'),
        '"Importieren" ist ohne Datei aus'
    ).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(page.locator('#markdown-import-modal')).toBeHidden();
    weich(await page.locator('#npc-desc').innerHTML(), 'das Formular bleibt unberuehrt').toBe(
        GRIMBOLD.description
    );
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (21) WAECHTER: WINDOWS-ZEILENENDEN UND BOM
// ===========================================================================
test('(21) der eigene Export mit Windows-Zeilenenden und BOM verliert seinen Kopf trotzdem', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'npcs', 1);
    const datei = await exportieren(page, 'npcs');
    // So kommt die Datei zurueck, wenn ein Windows-Editor sie gespeichert hat.
    const windows = '﻿' + datei.inhalt.replace(/\n/g, '\r\n');
    await importieren(page, 'npcs', windows, datei.name);
    weich(await page.locator('#npc-desc').innerHTML(), 'nur die Beschreibung, ohne Kopf').toBe(
        GRIMBOLD.description
    );
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (22) WAECHTER: DER PLATZHALTER DER AUSWAHL IST KEIN AUFTRAGGEBER
// ===========================================================================
test('(22) eine Quest ohne Auftraggeber und Ort exportiert keinen Platzhaltertext', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'quests', 1);
    // editQuest() setzt die Auswahl 10 ms verzoegert.
    await expect(page.locator('#quest-giver')).toHaveValue('1');
    await page.locator('#quest-giver').selectOption('');
    await page.locator('#quest-location').selectOption('');
    await page.locator(TYPEN.quests.speichern).click();
    await expect(page.locator('#quest-modal')).not.toHaveClass(/\bshow\b/);
    // So speichert saveQuest() "nichts gewaehlt": den Text der Platzhalter-Option.
    expect(await ausD(page, 'quests', 1, 'giverName')).toBe('-- NPC wählen --');
    expect(await ausD(page, 'quests', 1, 'giverId')).toBe(null);

    await oeffne(page, 'quests', 1);
    const datei = await exportieren(page, 'quests');
    weich(datei.inhalt, 'kein Auftraggeber, kein Ort, kein Platzhalter').toBe(
        '# Die Mine\n\n**Status:** Abgeschlossen\n\nFinde die *Mine*\n'
    );
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (23) WAECHTER: "IMPORTIEREN" SCHREIBT NUR IN DAS FORMULAR, AUS DEM ES KAM
// ===========================================================================
test('(23) traegt das Formular einen anderen Eintrag oder ist es zu, ueberschreibt "Importieren" nichts', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await oeffne(page, 'npcs', 1);
    const meldungen = () => page.locator('.event-log-message').allTextContents();

    // Ueber die Oberflaeche ist keiner der zwei Zustaende heute erreichbar
    // (die Schale liegt obenauf, Escape schliesst nur sie — Fall 11). Sie
    // werden darum HERGESTELLT; gemessen wird der echte Klick auf "Importieren".
    /** @type {Array<[string, () => void]>} */
    const zustaende = [
        [
            'anderer Eintrag',
            () => {
                /** @type {HTMLInputElement} */ (document.getElementById('edit-npc-id')).value =
                    '2';
            }
        ],
        ['Formular zu', () => /** @type {any} */ (window).hideModal('npc-modal')]
    ];
    for (const [was, herstellen] of zustaende) {
        await schaleOeffnen(page, 'npcs');
        await page.locator('#markdown-import-file').setInputFiles({
            name: 'neu.md',
            mimeType: 'text/markdown',
            buffer: Buffer.from(NEU_MD, 'utf8')
        });
        await expect(page.locator('#markdown-import-confirm')).toBeEnabled();
        await page.evaluate(herstellen);
        await page.locator('#markdown-import-confirm').click();
        await expect(page.locator('#markdown-import-modal')).toBeHidden();
        weich(
            await page.locator('#npc-desc').innerHTML(),
            `${was}: das Editorfeld bleibt alt`
        ).toBe(GRIMBOLD.description);
        weich(
            (await meldungen()).some(m => m.includes('Import verworfen')),
            `${was}: die App sagt, dass verworfen wurde`
        ).toBe(true);
        // Zurueck in den Ausgangszustand fuer den naechsten Durchgang.
        if (was === 'anderer Eintrag') {
            await page.evaluate(() => {
                /** @type {HTMLInputElement} */ (document.getElementById('edit-npc-id')).value =
                    '1';
            });
        }
    }
    weich(await ausD(page, 'npcs', 1, 'description'), 'D bleibt alt').toBe(GRIMBOLD.description);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (24) WAECHTER: EIN UEBERHOLTER FILEREADER VERFAELLT
// ===========================================================================
test('(24) ein Lesevorgang, der erst nach einer neueren Wahl fertig wird, aendert nichts', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    // Der Spion haelt das Ende des Lesens fuer "langsam.md" zurueck, bis der
    // Fall es freigibt — so wird die Reihenfolge zweier Lesevorgaenge, die im
    // Browser vom Zufall abhaengt, festgelegt. Er aendert keine Logik.
    await page.evaluate(() => {
        const w = /** @type {any} */ (window);
        w.__zurueckgehalten = [];
        const echt = FileReader.prototype.readAsText;
        FileReader.prototype.readAsText = function (datei, ...rest) {
            if (datei && /** @type {File} */ (datei).name === 'langsam.md') {
                const leser = this;
                const fertig = leser.onload;
                leser.onload = ereignis => {
                    w.__zurueckgehalten.push(() => fertig?.call(leser, ereignis));
                };
            }
            return echt.call(this, datei, ...rest);
        };
    });
    const freigeben = () =>
        page.evaluate(() => {
            /** @type {any} */ (window).__zurueckgehalten.splice(0).forEach(f => f());
        });
    const zurueckgehalten = () =>
        page.evaluate(() => /** @type {any} */ (window).__zurueckgehalten.length);
    const langsam = {
        name: 'langsam.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('**alt**', 'utf8')
    };

    await oeffne(page, 'npcs', 1);

    // a) langsam gewaehlt, dann schnell — das langsame Ende kommt zuletzt.
    await schaleOeffnen(page, 'npcs');
    await page.locator('#markdown-import-file').setInputFiles(langsam);
    await expect.poll(zurueckgehalten).toBe(1);
    await page.locator('#markdown-import-file').setInputFiles({
        name: 'schnell.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('**neu**', 'utf8')
    });
    await expect(page.locator('#markdown-import-preview-content')).toContainText('neu');
    await freigeben();
    weich(
        await page.locator('#markdown-import-preview-content').innerHTML(),
        'a) die Vorschau zeigt die neuere Wahl'
    ).toBe('<b>neu</b>');
    await page.locator('#markdown-import-confirm').click();
    await expect(page.locator('#markdown-import-modal')).toBeHidden();
    weich(await page.locator('#npc-desc').innerHTML(), 'a) uebernommen ist die neuere Wahl').toBe(
        '<b>neu</b>'
    );

    // b) langsam gewaehlt, Schale abgebrochen und neu geoeffnet — das langsame
    //    Ende fuellt die frische Schale nicht.
    await schaleOeffnen(page, 'npcs');
    await page.locator('#markdown-import-file').setInputFiles(langsam);
    await expect.poll(zurueckgehalten).toBe(1);
    await page.locator('#markdown-import-modal .modal-footer [data-action="hide-modal"]').click();
    await expect(page.locator('#markdown-import-modal')).toBeHidden();
    await schaleOeffnen(page, 'npcs');
    await freigeben();
    await weich(
        page.locator('#markdown-import-preview'),
        'b) die frische Schale zeigt keine alte Vorschau'
    ).toBeHidden();
    await weich(
        page.locator('#markdown-import-confirm'),
        'b) "Importieren" bleibt aus'
    ).toBeDisabled();
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
