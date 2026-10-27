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
        npcs: [GRIMBOLD, MARA],
        locations: [
            { id: 1, name: 'Bergdorf', description: '', filterId: 1 },
            { id: 2, name: 'Hafen', description: '' }
        ],
        factions: [{ id: 1, name: 'Gilde', symbol: '' }],
        quests: [DIE_MINE],
        loot: [],
        spells: [FEUERBALL],
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
            npcs: 3,
            locations: 3,
            quests: 2,
            encounters: 1,
            spells: 2,
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
        await importieren(page, typ, datei.inhalt, datei.name);
        const editor = await page.locator(t.editor).innerHTML();
        weich(editor, `${typ}: kein Export-Kopf im Editor`).not.toContain('<h1>');
        weich(editor, `${typ}: kein Export-Kopf im Editor`).not.toContain('Typ:');
        weich(editor, `${typ}: kein Export-Kopf im Editor`).not.toContain('Status:');
        await page.locator(t.speichern).click();
        await expect(page.locator(t.modal)).not.toHaveClass(/\bshow\b/);
        weich(await ausD(page, t.liste, 1, 'description'), `${typ}: Rundreise`).toBe(t.alt);
    }
    // Zauber: "## Notizen" des eigenen Exports geht ins Notizfeld zurueck,
    // nicht in die Beschreibung.
    weich(await ausD(page, 'spells', 1, 'note'), 'spells: Notiz bleibt Notiz').toBe(FEUERBALL.note);

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
