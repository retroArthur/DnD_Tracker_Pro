// @ts-check
/**
 * Kein Ruecksprung durch den Zwischenspeicher: der Rundlauf (RUECKSPRUNG)
 * =======================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **✏️ → aendern → 💾 → ✏️
 * zeigt den neuen Stand, und 💾 ohne Aenderung laesst ihn stehen** — in D,
 * im Speicher und nach dem Neuladen; fuer Wiki, Links, Zauber,
 * Sitzungsnotizen und Truhe, gleich, was der Nutzer vorher getan hat.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu 785cdeb, 1440x900, echte Klicks und Tasten (Saat:
 * je ein Eintrag der fuenf Arten, ein Held, ein zweiter Link; keine
 * Initiative, wo nicht anders gesagt). So war es VOR dem Fix:
 *
 *   Wiki, Links, Zauber, Notizen,   ✏️ → "… NEU" → 💾 → das zweite ✏️ zeigt
 *   Truhe — direkt nach dem Laden   den ALTEN Stand; 💾 ohne Aenderung
 *   (1)–(5)                         schreibt ihn zurueck — in D, im
 *                                   Speicher und nach dem Neuladen
 *   Links nach dem Initiative-      ebenso
 *   Reiter mit 0 Kaempfern, einer
 *   Langen Rast, dem HP-Rechner,
 *   einem Zustand, Strg+Z (6)–(9),
 *   (11)
 *   Links nach dem DM-Screen, dessen ebenso — MIT einem Kaempfer
 *   letztes Grid-Widget per ✕
 *   verschwindet (10)
 *   Links nach dem NPC-Reiter, der   ebenso — MIT einem Kaempfer
 *   an einem NPC ohne Namen wirft
 *   (12)
 *   mit einem Kaempfer, ohne         richtig, alle fuenf (13)
 *   diese Wege
 *
 * DIE URSACHE (Stand 785cdeb): `EntityLookup` (`render/helpers.js`) merkt
 * sich bei eingeschaltetem Zwischenspeicher, was `get()` gefunden hat — den
 * Objektverweis, auch `null` —, und kein Schreiben macht das ungueltig. Die
 * Speicherfunktionen der fuenf Arten ERSETZEN den Eintrag in D durch ein
 * neues Objekt (`{ ...alt, ...neu }`), und ihre Darstellung danach fasst den
 * Zwischenspeicher nicht an: das zweite ✏️ liest den gemerkten, verwaisten
 * Verweis, das zweite 💾 schreibt ihn als den aktuellen Stand zurueck.
 * Eingeschaltet wird er von acht Darstellungsfunktionen, die ihn erst am
 * Ende wieder ausschalten — und eingeschaltet BLEIBT er, wo eine davon vorher
 * aufhoert:
 *   - renderInit() kehrt bei 0 Kaempfern frueh zurueck. Es laeuft in
 *     renderAll() beim Laden (darum (1)–(5)) und nach Strg+Z (11), auf dem
 *     Initiative-Reiter (6) und nach den Party-Aktionen applyRest(),
 *     applyHpChange() und toggleCondition() (7)–(9), die erst die Party
 *     zeichnen (schaltet aus) und DANN die Initiative.
 *   - renderDMScreen() kehrt frueh zurueck, wenn kein Grid-Widget sichtbar
 *     ist — unabhaengig von der Initiative (10).
 *   - Jede der acht laesst ihn an, wenn sie dazwischen wirft: renderNPCList()
 *     an der Sortierung eines NPC ohne Namen (12).
 * Die Darstellungen von Party, NPCs, Orten, Quests, Encountern und Bestiar
 * schalten ihn auf allen anderen Wegen wieder aus — darum war der Umweg ueber
 * den NPC-Reiter bis zum Fix ein unwissentlicher Schutz (link-anlegen.spec.js
 * fuhr ihn bis RUECKSPRUNG bewusst; seither geht es dort direkt).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag RUECKSPRUNG, docs/bugfixes.md), die diese Datei prueft
 *
 *   R2  Rundlauf: ✏️ → aendern → 💾 → ✏️ zeigt den neuen Stand; 💾 ohne
 *       Aenderung laesst ihn stehen — in D, im Speicher, nach dem Neuladen.
 *       Fuer alle fuenf Arten direkt nach dem Laden mit 0 Kaempfern (1–5),
 *       fuer Links nach jedem Einschaltweg (6–11).
 *   R3  Fehlerpfad: ein Fehler beim Darstellen einer Liste laesst spaetere
 *       Lesestellen nicht veralten. (12)
 *   R5  Mit mindestens einem Kaempfer war es schon vor dem Fix richtig und
 *       bleibt es. (13, Kontrolle)
 * R1 (jede Lesestelle ueber `EntityLookup` liest frisch) und R4 (Anzeigen
 * folgen den Daten) prueft diese Datei nicht.
 *
 * WARUM NACH DEN EINSCHALTWEGEN NUR LINKS: Weg und Rundlauf sind
 * unabhaengig — der Weg hinterlaesst einen Zustand, den jede der fuenf Arten
 * gleich liest. (1)–(5) zeigen, dass alle fuenf daran fallen, (6)–(12), dass
 * jeder Weg ihn herstellt; das Kreuzprodukt waeren 35 Faelle ohne neue
 * Auskunft.
 *
 * WIE DIE WEGE GEFAHREN WERDEN: so, dass vor dem Weg nichts anderes den
 * Zwischenspeicher anlaesst — sonst waere der Weg nicht der Grund. (6) und
 * (11) gehen vorher ueber den NPC-Reiter, (7)–(9) ueber den Party-Reiter
 * (beide schalten aus); (10) und (12) laden MIT einem Kaempfer, dann laesst
 * schon das Laden ihn aus. (10) saet das Standard-Layout des DM-Screens mit
 * sechs der sieben Grid-Widgets ausgeblendet und blendet das letzte per ✕
 * aus — das Ende desselben Wegs, nur kuerzer; das kompakte Widget der
 * Schnellleiste bleibt, wie beim Nutzer. (11) bearbeitet den NACHBAR-Link
 * und nimmt das per Strg+Z zurueck; Strg+Z zeichnet ueber renderAll() alles
 * neu. Die Mechanik ist die am Stand 785cdeb; seit dem Fix gibt es den
 * Zwischenspeicher nicht mehr. Die Wege bleiben: kehrt einer zurueck, stellen
 * sie den Zustand wieder her, an dem der Rundlauf damals fiel.
 *
 * WIE DIE FAELLE ROT SIND: an den vier weichen Zusagen des Rundlaufs —
 * Formular, D, Speicher, Neuladen —, keiner an einer Vorbedingung, einem
 * Knopf oder der Fehlerliste (gemessen, dreimal gleich). Die Vorbedingungen
 * sind hart: das erste ✏️ zeigt den gesaeten Stand, das erste 💾 schreibt
 * den neuen in D, jedes ✏️ traegt die ID 1, der Weg hat getan, was er soll
 * (Held geheilt, geblendet, Widget weg, Strg+Z genommen, NPC-Reiter
 * geworfen). Den Zustand des Zwischenspeichers liest die Datei NIE: mit dem
 * Fix ist er verschwunden, und zugesagt ist, was der Nutzer sieht und behaelt.
 *
 * ERWARTETE FEHLERMELDUNGEN, ausdruecklich und eng: (7) das erste Oeffnen
 * der Rast meldet `Element not found: #rest-modal` (eigener Fehler, Vertrag
 * "Nicht in diesem PR"); (12) der Wurf der NPC-Sortierung (der Ausloeser,
 * bleibt mit dem Fix). Jede andere Meldung ist ein Fehler.
 *
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei): mit protokolliertem
 * Zwischenspeicher war er vor jedem Weg aus und danach an. Dann die Fixe,
 * jeder in einer Kopie des Buendels nachgebildet, alle 13 Faelle gefahren:
 *   `get()` liest immer aus D (der Fix     alle 13 gruen, samt Fehlerliste
 *   des Vertrags)
 *   "A": nur die fruehen Rueckkehren von   nur (12) rot — der Fehlerpfad
 *   renderInit() und renderDMScreen()      trennt A vom Fix
 *   leeren
 *   enableCache() leert die Map beim       (1)–(12) rot
 *   Einschalten
 *   pushUndo() leert die Map               (5) rot — die Truhe ruft kein
 *                                          pushUndo()
 *   Leeren erst NACH dem Schreiben         (2)–(6), (11), (12) rot — aber
 *   (Post-Save-Hook)                       nur, weil das zweite ✏️ nicht auf
 *                                          das Schreiben wartet (gemessen
 *                                          75–165 ms nach dem 💾, die
 *                                          Entprellung betraegt 300 ms); als
 *                                          es noch wartete, alle 13 gruen.
 *                                          Gruen bleiben (7)–(10), dort
 *                                          schreibt der Weg selbst, und (1):
 *                                          das Schreiben, das das Waehlen des
 *                                          Wiki-Eintrags ausloest, kommt vor
 *                                          dem ersten 💾 (siehe revInRuhe())
 *   save() leert sofort beim Aufruf        alle 13 gruen — siehe unten
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Die Anzeigen (R4: Truhen-Detail nach dem ersten 💾, Wiki-Pin, Brotkrumen,
 * Schnellzugriff, Loesch-Rueckfragen, Markdown-Export, Heldenkarte), der
 * Import (der Reiter-Import erreicht `#import-modal` nicht, eigener PR), der
 * Kampagnenwechsel, das Telefon — eigene Waechter bzw. eigene Vorgaenge.
 *
 * Und ein Fix, der den Zwischenspeicher in save() SOFORT leert: er besteht
 * jeden Rundlauf, denn jedes 💾 ruft save(), bevor das naechste ✏️ lesen
 * kann. Er faellt erst an einer Lesestelle ZWISCHEN dem Ersetzen in D und
 * save() — gemessen am Truhen-Detail direkt nach dem ersten 💾, das der
 * Waechter der Anzeigen (R4) prueft; dort ist er rot.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** WEICHE Zusicherungen fuer die Regel-Zusagen: ein roter Lauf soll JEDE
 *  gebrochene Zusage nennen (Formular, D, Speicher, Neuladen), nicht nur die
 *  erste. Vorbedingungen, ohne die der naechste Schritt haengen bliebe,
 *  bleiben hart. */
const weich = expect.configure({ soft: true });

// ===========================================================================
// SAAT
// ===========================================================================

/** Der Held der Party — fuer Rast, HP-Rechner und Zustand. Halb verwundet,
 *  damit Heilen und Lange Rast etwas aendern, das man nachpruefen kann. */
const HELD = {
    id: 1,
    name: 'Thorin',
    class: 'Kaempfer',
    level: 5,
    ac: 16,
    hpMax: 40,
    hpCurrent: 20,
    spellSlots: {},
    concentrationSpells: [],
    conditions: []
};

/** Je ein Eintrag der fuenf betroffenen Arten. */
const TIEFWASSER = {
    id: 1,
    title: 'Tiefwasser',
    category: 'locations',
    content: '<p>Alte Stadt</p>',
    tags: ['Stadt'],
    pinned: false,
    parentId: null
};
const WELTKARTE = {
    id: 1,
    title: 'Weltkarte',
    url: 'https://example.org/karte',
    category: 'maps',
    description: '<p>Die grosse Karte</p>'
};
/** Der Nachbar-Link — nur der Weg ueber Strg+Z bearbeitet ihn. */
const SRD = {
    id: 2,
    title: 'SRD',
    url: 'https://example.org/srd',
    category: 'rules',
    description: ''
};
const FEUERBALL = {
    id: 1,
    name: 'Feuerball',
    type: 'damage',
    level: 3,
    school: 'Hervorrufung',
    time: '1 Aktion',
    range: '45 m',
    duration: 'Unmittelbar',
    v: true,
    g: true,
    m: true,
    material: 'Fledermausdung',
    ritual: false,
    spellClasses: ['Magier'],
    description: '<p>Bumm</p>',
    note: ''
};
const ANKUNFT = {
    id: 1,
    number: 1,
    name: 'Ankunft',
    date: '2026-10-01',
    arcId: null,
    summary: 'Erste Sitzung',
    tags: [],
    content: '<p>Es begann.</p>'
};
const SCHWERT = {
    id: 1,
    name: 'Langschwert',
    category: 'weapons',
    rarity: 'uncommon',
    quantity: 2,
    weight: 3,
    value: 15,
    description: '<p>Scharf</p>',
    tags: []
};

/** Ein Kaempfer in der Initiative — der Unterschied zwischen "schon vor dem
 *  Fix richtig" (Kontrolle) und "vor dem Fix kaputt". */
const EIN_KAEMPFER = {
    combatants: [
        {
            id: 1,
            name: 'Ork',
            initiative: 15,
            initBonus: 2,
            maxHp: 30,
            currentHp: 30,
            ac: 13,
            type: 'monster',
            effects: []
        }
    ],
    currentTurn: 0,
    round: 1
};
const KEIN_KAEMPFER = { combatants: [], currentTurn: 0, round: 1 };

/** Das Standard-Layout des DM-Screens, in dem der Nutzer sechs der sieben
 *  Grid-Widgets schon ausgeblendet hat: sichtbar bleiben das letzte
 *  Grid-Widget und das kompakte "Zustände" der Schnellleiste. */
const DM_SCREEN_EIN_GRID_WIDGET = {
    widgets: [
        { id: 'party-stats', type: 'party', visible: false },
        { id: 'mini-initiative', type: 'initiative', visible: false },
        { id: 'quick-dice', type: 'dice', visible: false },
        { id: 'conditions-ref', type: 'conditions', visible: true },
        { id: 'dc-reference', type: 'dc', visible: true },
        { id: 'random-tables', type: 'tables', visible: false },
        { id: 'quick-rules', type: 'rules', visible: false },
        { id: 'session-notes', type: 'notes', visible: false }
    ]
};

/** Altdaten: der zweite NPC hat keinen Namen — die Sortierung der
 *  NPC-Liste wirft daran (ueber die Oberflaeche nicht anlegbar, die
 *  Pruefung verlangt einen Namen; er kommt aus Saat, Import, altem Stand). */
const NPCS_EINER_OHNE_NAMEN = [
    { id: 1, name: 'Zed', role: 'Wirt', description: '' },
    { id: 2, role: 'Bettler', description: '' },
    { id: 3, name: 'Abe', role: 'Wache', description: '' }
];

/** @param {Record<string, any>} teile */
function seed(teile = {}) {
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
        characters: [HELD],
        npcs: [],
        locations: [],
        quests: [],
        loot: [SCHWERT],
        spells: [FEUERBALL],
        wiki: [TIEFWASSER],
        wikiRecentlyViewed: [],
        links: [WELTKARTE, SRD],
        filters: [],
        factions: [],
        tags: [],
        sessionNotes: [ANKUNFT],
        encounters: [],
        initiative: KEIN_KAEMPFER,
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        ...teile
    };
    /** @param {any[]} liste */
    const naechste = liste => Math.max(0, ...(liste || []).map(x => x.id || 0)) + 1;
    s._nextId = {
        characters: naechste(s.characters),
        npcs: naechste(s.npcs),
        locations: 1,
        quests: 1,
        encounters: 1,
        spells: naechste(s.spells),
        loot: naechste(s.loot),
        items: 1,
        wiki: naechste(s.wiki),
        links: naechste(s.links),
        sessionNotes: naechste(s.sessionNotes),
        randomTables: 1,
        filters: 1,
        factions: 1
    };
    return s;
}

/**
 * Laedt breit, saet EINMAL je Tab und bleibt auf der Startansicht. Die Saat
 * steht hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann,
 * was die App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} [teile]
 */
async function laden(page, teile) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('ruecksprung-rundlauf-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('ruecksprung-rundlauf-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(teile)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst ein Speicher-Fall nichts:
    // repariert `load()` die Saat, schreibt `saveAutomatic()` spaeter den
    // ganzen Stand aus D (siehe npc-formular.spec.js). Erkennbar daran, dass
    // `_version` der Saat ueberschrieben wird; kommt binnen 4 s keine, steht
    // auch keine aus.
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

// ===========================================================================
// FEHLER EINSAMMELN
// ===========================================================================

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App (`EventDelegation` meldet einen
 * geworfenen Handler NUR dort und als `console.error`). "Failed to load
 * resource" ist Netzrauschen (Schriften unter file://). Das Fehlerlog lebt
 * im Speicher der Seite — `sichern()` liest es VOR jedem Neuladen, sonst
 * ginge, was vorher geschah, mit der Seite verloren.
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    /** @type {string[]} */
    const gesichert = [];
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) {
            fehler.push('console.error: ' + m.text().split('\n')[0]);
        }
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
            gesichert.push(...(await appLog()));
        },
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            return [...fehler, ...gesichert, ...(await appLog())];
        }
    };
}

/** Die erste Rast meldet `Element not found: #rest-modal`: showRestModal()
 *  sucht den Dialog, bevor es ihn anlegt. Ein eigener Fehler, nicht dieser
 *  (Vertrag RUECKSPRUNG, "Nicht in diesem PR") — erlaubt, nicht verlangt. */
const ERWARTET_RAST = [/Element not found: #rest-modal$/];

/** Der Wurf der NPC-Sortierung an einem NPC ohne Namen — der Ausloeser des
 *  Fehlerpfads (12). Er bleibt nach dem Fix bestehen (anderer Fehler); jede
 *  andere Meldung bleibt ein Fehler. */
const ERWARTET_NPC = [
    /renderNPCList.*Cannot read properties of undefined \(reading 'localeCompare'\)/
];

/**
 * Am Ende jedes Falls: kein Fehler ausser den ausdruecklich erwarteten.
 * @param {ReturnType<typeof fehlerFangen>} fehler
 * @param {RegExp[]} [erwartet]
 */
async function keinFehlerAusser(fehler, erwartet = []) {
    const alle = await fehler.alle();
    weich(
        alle.filter(z => !erwartet.some(r => r.test(z))),
        'kein Fehler ausser den erwarteten'
    ).toEqual([]);
}

// ===========================================================================
// DIE FUENF ARTEN
// ===========================================================================

/** @typedef {import('@playwright/test').Page} Page */
/**
 * @typedef {object} Art
 * @property {string} name        fuer die Meldungen
 * @property {string} ansicht     data-view des Reiters
 * @property {string} sammlung    Sammlung in D
 * @property {string} feld        das geaenderte Feld
 * @property {string} alt         gesaeter Wert
 * @property {string} neu         eingetippter Wert
 * @property {string} eingabe     Eingabefeld des Formulars
 * @property {string} idFeld      verstecktes Feld mit der Bearbeiten-ID
 * @property {(page: Page) => Promise<void>} oeffnen  ✏️, wie ein Nutzer
 * @property {(page: Page) => Promise<void>} offen    wartet, bis das Formular offen ist
 * @property {(page: Page) => Promise<void>} zu       wartet, bis es wieder zu ist
 * @property {(page: Page) => import('@playwright/test').Locator} speichern  der 💾-Knopf
 */

/** @type {Record<'wiki'|'links'|'spells'|'sessionNotes'|'loot', Art>} */
const ARTEN = {
    wiki: {
        name: 'Wiki',
        ansicht: 'wiki',
        sammlung: 'wiki',
        feld: 'title',
        alt: TIEFWASSER.title,
        neu: TIEFWASSER.title + ' NEU',
        eingabe: '#wiki-title',
        idFeld: '#edit-wiki-id',
        // ✏️ steht im Detail des gewaehlten Eintrags. Nach dem Laden ist keiner
        // gewaehlt und die Kategorie zugeklappt: aufklappen, waehlen, ✏️.
        async oeffnen(page) {
            const stift = page.locator('#wiki-detail [data-action="edit-wiki"][data-id="1"]');
            if (!(await stift.isVisible())) {
                const eintrag = page.locator('#wiki-tree .wiki-tree-item[data-id="1"]');
                if (!(await eintrag.isVisible())) {
                    await page
                        .locator(
                            '#wiki-tree [data-action="toggle-wiki-category"][data-value="locations"]'
                        )
                        .click();
                }
                await eintrag.click();
            }
            await stift.click();
        },
        offen: page => expect(page.locator('#wiki-form-overlay')).toBeVisible(),
        zu: page => expect(page.locator('#wiki-form-overlay')).toBeHidden(),
        speichern: page =>
            page
                .locator('#wiki-form-overlay')
                .getByRole('button', { name: 'Speichern', exact: true })
    },
    links: {
        name: 'Links',
        ansicht: 'links',
        sammlung: 'links',
        feld: 'title',
        alt: WELTKARTE.title,
        neu: WELTKARTE.title + ' NEU',
        eingabe: '#link-title',
        idFeld: '#edit-link-id',
        async oeffnen(page) {
            await page.locator('#links-list [data-action="edit-link"][data-id="1"]').click();
        },
        offen: page => expect(page.locator('#link-form-card')).toBeVisible(),
        zu: page => expect(page.locator('#link-form-card')).toBeHidden(),
        speichern: page =>
            page.locator('#link-form-card').getByRole('button', { name: 'Speichern', exact: true })
    },
    spells: {
        name: 'Zauber',
        ansicht: 'spells',
        sammlung: 'spells',
        feld: 'name',
        alt: FEUERBALL.name,
        neu: FEUERBALL.name + ' NEU',
        eingabe: '#spell-name',
        idFeld: '#edit-spell-id',
        // "✏️ Bearbeiten" steht in der aufgeklappten Karte.
        async oeffnen(page) {
            const karte = page.locator('#spell-list .spell-card[data-spell-id="1"]');
            const stift = karte.getByRole('button', { name: '✏️ Bearbeiten' });
            if (!(await stift.isVisible())) await karte.locator('.spell-card-header').click();
            await stift.click();
        },
        offen: page => expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/),
        zu: page => expect(page.locator('#spell-modal')).not.toHaveClass(/\bshow\b/),
        speichern: page =>
            page.locator('#spell-modal').getByRole('button', { name: 'Speichern', exact: true })
    },
    sessionNotes: {
        name: 'Sitzungsnotizen',
        ansicht: 'notes',
        sammlung: 'sessionNotes',
        feld: 'name',
        alt: ANKUNFT.name,
        neu: ANKUNFT.name + ' NEU',
        eingabe: '#session-name',
        idFeld: '#edit-session-id',
        async oeffnen(page) {
            await page.locator('#session-list [data-action="edit-session"][data-id="1"]').click();
        },
        offen: page => expect(page.locator('#session-form')).toHaveClass(/\bopen\b/),
        zu: page => expect(page.locator('#session-form')).not.toHaveClass(/\bopen\b/),
        speichern: page =>
            page.locator('#session-form').getByRole('button', { name: 'Speichern', exact: true })
    },
    loot: {
        name: 'Truhe',
        ansicht: 'loot',
        sammlung: 'loot',
        feld: 'name',
        alt: SCHWERT.name,
        neu: SCHWERT.name + ' NEU',
        eingabe: '#loot-name',
        idFeld: '#edit-loot-id',
        // ✏️ steht in der Detailspalte; die Liste waehlt den ersten Eintrag
        // beim Zeichnen selbst.
        async oeffnen(page) {
            const stift = page.locator('#loot-detail-panel [data-action="edit-loot"][data-id="1"]');
            if (!(await stift.isVisible())) {
                await page.locator('#loot-list .loot-item[data-id="1"]').click();
            }
            await stift.click();
        },
        offen: page => expect(page.locator('#loot-modal')).toHaveClass(/\bshow\b/),
        zu: page => expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/),
        speichern: page =>
            page.locator('#loot-modal').getByRole('button', { name: '💾 Speichern', exact: true })
    }
};

// ===========================================================================
// HILFEN
// ===========================================================================

/** Ein Reiter per Klick, wie ein Nutzer (Gruppe erst oeffnen).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht */
async function zuAnsicht(page, ansicht) {
    await navigateToTab(page, ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
}

/** Klick in ein Feld, alles markieren, neu tippen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} feld
 *  @param {string} text */
async function eintippen(page, feld, text) {
    await page.locator(feld).click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(text);
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu, auch wenn der Inhalt gleich bleibt. Ohne ihn waere "der Speicher
 *  traegt den alten Stand" nicht von "es wurde gar nicht geschrieben" zu
 *  unterscheiden.
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}
/** Der `_rev`-Stand, sobald keine Speicherung mehr aussteht.
 *
 *  ERST EINE NOCH AUSSTEHENDE FREMDE SPEICHERUNG ABWARTEN, sonst kann der
 *  naechste `_rev` von IHR kommen und der Fall liest den Speicher, bevor
 *  dieses 💾 geschrieben hat (dasselbe Muster wie charakter-anlegen.spec.js).
 *  Gemessen beim Wiki: das Waehlen des Eintrags vor dem ersten ✏️ ruft
 *  save(), und beim ersten 💾 zeigte die Anzeige in 6 von 6 Laeufen noch
 *  "Speichert..." (`#save-indicator.saving`). Ohne diese Wartezeit fehlte in
 *  einem von zwei Laeufen die Speicher-Zusage von (1): feuerte der Zeitgeber
 *  zwischen dem Lesen des `_rev` und dem Klick, galt das erste 💾 als
 *  geschrieben, waehrend es noch ausstand — und der Speicher nach dem zweiten
 *  💾 wurde gelesen, bevor dieses schrieb. save() setzt die Anzeige sofort
 *  auf "Speichert..." und nimmt sie erst nach dem Schreiben zurueck.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} was */
async function revInRuhe(page, was) {
    await expect(
        page.locator('#save-indicator'),
        `${was}: vorher darf keine fremde Speicherung mehr ausstehen`
    ).not.toHaveClass(/\bsaving\b/, { timeout: SOFORT_MS });
    return revStand(page);
}
/** Wartet, bis seit `rev` geschrieben wurde.
 *  @param {import('@playwright/test').Page} page
 *  @param {string|null} rev
 *  @param {string} was */
async function geschriebenSeit(page, rev, was) {
    await expect
        .poll(() => revStand(page), {
            timeout: SOFORT_MS,
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Das geaenderte Feld des Eintrags 1 in D (null: Eintrag fehlt).
 *  @param {import('@playwright/test').Page} page
 *  @param {Art} art */
function feldInD(page, art) {
    return page.evaluate(
        ([sammlung, feld]) => (window.D[sammlung] || []).find(x => x.id === 1)?.[feld] ?? null,
        [art.sammlung, art.feld]
    );
}
/** Das geaenderte Feld des Eintrags 1 im Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {Art} art */
function feldImSpeicher(page, art) {
    return page.evaluate(
        ([schluessel, sammlung, feld]) => {
            try {
                const s = JSON.parse(localStorage.getItem(schluessel) || '{}');
                return (s[sammlung] || []).find(x => x.id === 1)?.[feld] ?? null;
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, art.sammlung, art.feld]
    );
}

/** 💾 klicken, OHNE das entprellte Schreiben abzuwarten. Liefert den
 *  `_rev`-Stand von davor, damit `geschriebenSeit()` das Schreiben spaeter
 *  nachpruefen kann.
 *  @param {import('@playwright/test').Page} page
 *  @param {Art} art
 *  @param {string} was */
async function speichernKlicken(page, art, was) {
    const rev = await revInRuhe(page, was);
    await art.speichern(page).click();
    await art.zu(page);
    return rev;
}

/** 💾 und das entprellte Schreiben abwarten.
 *  @param {import('@playwright/test').Page} page
 *  @param {Art} art
 *  @param {string} was */
async function speichern(page, art, was) {
    const rev = await speichernKlicken(page, art, was);
    await geschriebenSeit(page, rev, was);
}

/** Der Wert, den das Formular nach ✏️ zeigt. Die Bearbeiten-ID ist die
 *  Vorbedingung: ohne sie bearbeitete das Formular gar nicht den Eintrag 1.
 *  @param {import('@playwright/test').Page} page
 *  @param {Art} art
 *  @param {string} was */
async function bearbeiten(page, art, was) {
    await art.oeffnen(page);
    await art.offen(page);
    await expect(
        page.locator(art.idFeld),
        `Vorbedingung: ${was} bearbeitet den Eintrag 1`
    ).toHaveValue('1');
    return page.locator(art.eingabe).inputValue();
}

/**
 * DER RUNDLAUF (R2): Reiter → ✏️ → neuer Wert → 💾 → ✏️ → 💾 ohne Aenderung
 * → D, Speicher, Neuladen. Echte Klicks und Tasten; gelesen wird nur.
 *
 * Das zweite ✏️ kommt SOFORT nach dem ersten 💾, ohne das entprellte
 * Schreiben (300 ms) abzuwarten — so bedient ein Nutzer, und so faellt auch
 * ein Fix, der den Zwischenspeicher erst NACH dem Schreiben leert
 * (Post-Save-Hook, Vertrag: "zu spaet"): das ✏️ kommt ihm zuvor. Gewartet
 * wird erst vor dem zweiten 💾, damit die beiden Schreibvorgaenge getrennt
 * bleiben und der Speicher nach dem zweiten 💾 wirklich dessen Stand traegt.
 * @param {import('@playwright/test').Page} page
 * @param {Art} art
 * @param {ReturnType<typeof fehlerFangen>} fehler
 */
async function rundlauf(page, art, fehler) {
    await zuAnsicht(page, art.ansicht);

    const erst = await bearbeiten(page, art, `${art.name}: das erste ✏️`);
    expect(erst, `Vorbedingung: ${art.name}: das erste ✏️ zeigt den gesaeten Stand`).toBe(art.alt);
    await eintippen(page, art.eingabe, art.neu);
    const revErst = await speichernKlicken(page, art, `${art.name}: das erste 💾`);
    expect(
        await feldInD(page, art),
        `Vorbedingung: ${art.name}: das erste 💾 schreibt den neuen Stand in D`
    ).toBe(art.neu);

    const zweit = await bearbeiten(page, art, `${art.name}: das zweite ✏️`);
    weich(zweit, `${art.name}: das zweite ✏️ zeigt den neuen Stand`).toBe(art.neu);
    await geschriebenSeit(page, revErst, `${art.name}: das erste 💾`);
    await speichern(page, art, `${art.name}: das zweite 💾 ohne Aenderung`);
    weich(
        await feldInD(page, art),
        `${art.name}: nach dem zweiten 💾 steht in D der neue Stand`
    ).toBe(art.neu);
    weich(
        await feldImSpeicher(page, art),
        `${art.name}: nach dem zweiten 💾 steht im Speicher der neue Stand`
    ).toBe(art.neu);

    await fehler.sichern();
    await page.reload();
    await waitForAppReady(page);
    weich(await feldInD(page, art), `${art.name}: nach dem Neuladen steht der neue Stand`).toBe(
        art.neu
    );
}

/** Ein Knopf der Heldenkarte. Die Aktionsleiste steht in der Karte; ist sie
 *  nicht sichtbar, erst die Karte anklicken.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
async function heldenKnopf(page, name) {
    const karte = page.locator('#party-list .char-card', { hasText: HELD.name });
    const knopf = karte.getByRole('button', { name, exact: true });
    if (!(await knopf.isVisible())) await karte.click();
    await knopf.click();
}

/** Ein Feld des Helden in D.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} feld */
function heldInD(page, feld) {
    return page.evaluate(
        f => JSON.parse(JSON.stringify(window.D.characters.find(c => c.id === 1)?.[f] ?? null)),
        feld
    );
}

// ===========================================================================
// (1)–(5) DIREKT NACH DEM LADEN, 0 KAEMPFER
// ===========================================================================
//
// So steht die App da, wenn kein Kampf laeuft: Startansicht, dann gleich der
// Reiter der Art — ohne den Umweg ueber NPCs oder Party, der den
// Zwischenspeicher vor dem Fix nebenbei ausschaltete.
for (const [nr, schluessel] of /** @type {const} */ ([
    [1, 'wiki'],
    [2, 'links'],
    [3, 'spells'],
    [4, 'sessionNotes'],
    [5, 'loot']
])) {
    const art = ARTEN[schluessel];
    test(`(${nr}) ${art.name} direkt nach dem Laden, 0 Kaempfer: das zweite ✏️ zeigt den neuen Stand, 💾 laesst ihn stehen`, async ({
        page
    }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        await laden(page);
        await rundlauf(page, art, fehler);
        await keinFehlerAusser(fehler);
    });
}

// ===========================================================================
// (6)–(11) DER LINK-RUNDLAUF NACH JEDEM EINSCHALTWEG
// ===========================================================================

// (6) Der Initiative-Reiter mit 0 Kaempfern. Vorher der NPC-Reiter: danach
// war der Zwischenspeicher am Stand 785cdeb sicher aus, und nur der
// Initiative-Reiter konnte ihn wieder einschalten.
test('(6) Links nach dem Initiative-Reiter mit 0 Kaempfern: der Rundlauf bleibt beim neuen Stand', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    await zuAnsicht(page, 'initiative');
    expect(
        await page.evaluate(() => window.D.initiative.combatants.length),
        'Vorbedingung: kein Kaempfer in der Initiative'
    ).toBe(0);
    await rundlauf(page, ARTEN.links, fehler);
    await keinFehlerAusser(fehler);
});

// (7) Lange Rast auf dem Party-Reiter. Der Party-Reiter schaltet aus; die
// Rast zeichnet die Party UND danach die Initiative neu.
test('(7) Links nach einer Langen Rast: der Rundlauf bleibt beim neuen Stand', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'party');
    await page.locator('#view-party').getByRole('button', { name: '🛏️ Rasten' }).click();
    const dialog = page.locator('#rest-modal');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Lange Rast/ }).click();
    const rev = await revInRuhe(page, 'Lange Rast');
    await dialog.getByRole('button', { name: '✓ Rast durchführen' }).click();
    await expect(dialog).toBeHidden();
    await geschriebenSeit(page, rev, 'Lange Rast');
    expect(await heldInD(page, 'hpCurrent'), 'Vorbedingung: die Lange Rast heilt voll').toBe(
        HELD.hpMax
    );
    await rundlauf(page, ARTEN.links, fehler);
    await keinFehlerAusser(fehler, ERWARTET_RAST);
});

// (8) Der HP-Rechner an der Heldenkarte: "❤️ HP", 5 eintippen, "💚 Heilen".
test('(8) Links nach dem HP-Rechner an der Heldenkarte: der Rundlauf bleibt beim neuen Stand', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'party');
    await heldenKnopf(page, '❤️ HP');
    const dialog = page.locator('#hp-calc-modal');
    await expect(dialog).toBeVisible();
    await eintippen(page, '#hp-calc-value', '5');
    const rev = await revInRuhe(page, 'Heilen');
    await dialog.getByRole('button', { name: '💚 Heilen' }).click();
    await geschriebenSeit(page, rev, 'Heilen');
    expect(await heldInD(page, 'hpCurrent'), 'Vorbedingung: der Held ist um 5 geheilt').toBe(
        HELD.hpCurrent + 5
    );
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: '✕' }).click();
    await expect(dialog).toBeHidden();
    await rundlauf(page, ARTEN.links, fehler);
    await keinFehlerAusser(fehler);
});

// (9) Einen Zustand an der Heldenkarte setzen: "⚡", dann "Geblendet".
test('(9) Links nach dem Setzen eines Zustands an der Heldenkarte: der Rundlauf bleibt beim neuen Stand', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'party');
    await heldenKnopf(page, '⚡');
    const dialog = page.locator('#conditions-modal');
    await expect(dialog).toBeVisible();
    const rev = await revInRuhe(page, 'Zustand setzen');
    await dialog.locator('[data-action="toggle-condition"][data-value="blinded"]').click();
    await geschriebenSeit(page, rev, 'Zustand setzen');
    expect(
        (await heldInD(page, 'conditions')).map(c => c.type),
        'Vorbedingung: der Held ist geblendet'
    ).toEqual(['blinded']);
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: '✕' }).click();
    await expect(dialog).toBeHidden();
    await rundlauf(page, ARTEN.links, fehler);
    await keinFehlerAusser(fehler);
});

// (10) Der DM-Screen, dessen letztes Grid-Widget per ✕ ausgeblendet wird —
// MIT einem Kaempfer: nach dem Laden war der Zwischenspeicher am Stand
// 785cdeb dann aus, der DM-Screen mit einem Grid-Widget schaltete ihn ein UND
// aus, erst das ✕ liess ihn an. Der Weg haengt also nicht an der Initiative.
test('(10) Links nach dem DM-Screen, letztes Grid-Widget per ✕ ausgeblendet (1 Kaempfer): der Rundlauf bleibt beim neuen Stand', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, { initiative: EIN_KAEMPFER, dmScreenLayout: DM_SCREEN_EIN_GRID_WIDGET });
    await zuAnsicht(page, 'dmscreen');
    const widgets = page.locator('#dmscreen-grid .dmscreen-widget');
    await expect(widgets, 'Vorbedingung: genau ein Grid-Widget').toHaveCount(1);
    await widgets.getByRole('button', { name: '✕' }).click();
    await expect(widgets, 'Vorbedingung: das letzte Grid-Widget ist ausgeblendet').toHaveCount(0);
    await rundlauf(page, ARTEN.links, fehler);
    await keinFehlerAusser(fehler);
});

// (11) Strg+Z. Vorher der NPC-Reiter (aus); dann wird der NACHBAR-Link
// bearbeitet und per Strg+Z zurueckgenommen — das zeichnet alles neu.
test('(11) Links nach Strg+Z: der Rundlauf bleibt beim neuen Stand', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page);
    await zuAnsicht(page, 'npcs');
    await zuAnsicht(page, 'links');
    await page.locator('#links-list [data-action="edit-link"][data-id="2"]').click();
    await ARTEN.links.offen(page);
    await eintippen(page, '#link-title', 'SRD NEU');
    await speichern(page, ARTEN.links, 'Nachbar-Link');
    await expect(page.locator('#links-list')).toContainText('SRD NEU');
    await page.keyboard.press('Control+z');
    await expect(
        page.locator('#links-list'),
        'Vorbedingung: Strg+Z nimmt das Bearbeiten des Nachbarn zurueck'
    ).not.toContainText('SRD NEU');
    await rundlauf(page, ARTEN.links, fehler);
    await keinFehlerAusser(fehler);
});

// ===========================================================================
// (12) DER FEHLERPFAD (R3)
// ===========================================================================
//
// Ein NPC ohne Namen aus Altdaten, EIN Kaempfer (der Zwischenspeicher war
// am Stand 785cdeb nach dem Laden also aus). Der NPC-Reiter wirft beim
// Sortieren der Liste — damals zwischen Ein- und Ausschalten, heute weiter,
// nur ohne Schalter. Danach der Link-Rundlauf.
test('(12) Fehlerpfad: nach dem werfenden NPC-Reiter (1 Kaempfer) bleibt der Link-Rundlauf beim neuen Stand', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await laden(page, { initiative: EIN_KAEMPFER, npcs: NPCS_EINER_OHNE_NAMEN });
    // Die NPC-Liste wirft schon beim Laden (renderAll()) — gezaehlt wird,
    // was der REITER dazulegt.
    const npcWuerfe = async () =>
        (await fehler.alle()).filter(z => ERWARTET_NPC.some(r => r.test(z))).length;
    const vorher = await npcWuerfe();
    await zuAnsicht(page, 'npcs');
    expect(
        await npcWuerfe(),
        'Vorbedingung: der NPC-Reiter wirft am NPC ohne Namen — sonst prueft dieser Fall den Fehlerpfad nicht'
    ).toBeGreaterThan(vorher);
    await rundlauf(page, ARTEN.links, fehler);
    await keinFehlerAusser(fehler, ERWARTET_NPC);
});

// ===========================================================================
// (13) KONTROLLE (R5): MIT EINEM KAEMPFER, ALLE FUENF
// ===========================================================================
//
// Schon vor dem Fix gruen. Zugleich der Beleg, dass die Bedienwege der fuenf
// Arten tragen: rot werden (1)–(12) an der Regel, nicht an einem Knopf.
test('(13) mit einem Kaempfer: alle fuenf Rundlaeufe bleiben beim neuen Stand (Kontrolle)', async ({
    page
}) => {
    test.setTimeout(120000);
    const fehler = fehlerFangen(page);
    await laden(page, { initiative: EIN_KAEMPFER });
    for (const art of Object.values(ARTEN)) {
        await rundlauf(page, art, fehler);
    }
    await keinFehlerAusser(fehler);
});
