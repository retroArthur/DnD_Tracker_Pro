// @ts-check
/**
 * Anzeigen folgen den Daten: kein Ruecksprung durch den Zwischenspeicher (RUECKSPRUNG, R4)
 * =========================================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **was eine Anzeige nach
 * einem Speichern, Umbenennen oder Loeschen zeigt, ist der Stand, der in
 * diesem Moment in D steht** — die Detailspalte der Truhe, der Pin des Wikis,
 * Schnellzugriff und Brotkrumen, die Loesch-Rueckfragen von Link und Zauber,
 * der Markdown-Export des Zaubers, die Heldenkarte, das NPC- und das
 * Ort-Detail. Und was eine Aktion an einem Eintrag aendert (📍), aendert den
 * Eintrag in D.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu 785cdeb, 1440x900, echte Klicks, jeder Fall direkt
 * nach dem Laden mit 0 Kaempfern (so findet ein Spielleiter die App
 * ausserhalb eines Kampfs vor). So war es VOR dem Fix:
 *
 *   (1)  Truhe: ✏️ → Name und Menge →  die Detailspalte zeigt "Langschwert",
 *        💾                             Menge 2, Wert 30 GM — die Liste
 *                                       daneben "Langschwert NEU", ×7
 *   (2)  Wiki: ✏️ → umbenennen → 💾 →   pinned bleibt false, in D und im
 *        📍                             Speicher, der Knopf bleibt 📍 — die
 *                                       Meldung sagt "📌 Eintrag gepinnt"
 *   (3)  Wiki: Eltern umbenannt         Schnellzugriff "Tiefwasser",
 *                                       Brotkrumen des Kinds
 *                                       "🏰 Orte › Tiefwasser › Hafenviertel"
 *   (4)  Wiki: Eintrag geloescht        bleibt im Schnellzugriff stehen
 *   (5)  Link umbenannt → 🗑️            'Link "Weltkarte" löschen?'
 *   (6)  Zauber umbenannt → 🗑️          'Zauber "Feuerball" löschen?'
 *   (7)  Zauber umbenannt → ✏️ →        Datei "Feuerball.md", erste Zeile
 *        📄 Export                      "# Feuerball"
 *   (8)  Zauber umbenannt → Party       Heldenkarte "✨ Feuerball"
 *   (9)  Zauber umbenannt → NPCs        NPC-Detail "✨ Feuerball"
 *   (10) Wiki umbenannt → Orte          Ort-Detail "📖 Tiefwasser"
 *
 * D und Speicher trugen jedes Mal schon den neuen Stand — falsch war nur, was
 * der Nutzer sah bzw. worauf 📍 wirkte.
 *
 * DIE URSACHE (Stand 785cdeb): `EntityLookup` (`render/helpers.js`) merkt
 * sich bei eingeschaltetem Zwischenspeicher in get() die gefundene
 * OBJEKTREFERENZ (auch `null`) und wird beim Schreiben nie ungueltig;
 * enableCache() setzt nur den Schalter und leert die Map nicht. Eingeschaltet
 * ist er nach JEDEM Laden ohne Kampf: renderAll() ruft renderInit()
 * (`features/render-dashboard.js`), das einschaltet und bei 0 Kaempfern
 * zurueckkehrt, ohne zu leeren (`features/initiative.js`). Das Speichern von
 * Wiki, Link, Zauber und Truhe ERSETZT den Eintrag in D durch ein neues
 * Objekt (`{ ...alt, ...neu }`), Loeschen nimmt ihn heraus — und jeder
 * spaetere Leser bekommt das gemerkte alte Objekt:
 *   - showLootDetail() — saveLoot() ruft es selbst, gleich nach dem
 *     Ersetzen; `loot-1` liegt schon seit dem Laden im Zwischenspeicher,
 *     weil renderLootList() beim Zeichnen den ersten Eintrag waehlt (1);
 *   - toggleWikiPin() kippt `pinned` am GEMERKTEN Objekt, nicht an dem in D
 *     — save() schreibt, aber ohne den Pin (2);
 *   - renderWikiQuickAccess() und getWikiBreadcrumb() (3), (4);
 *   - deleteLink() und deleteSpell() fuer den Text der Rueckfrage — geloescht
 *     wird richtig, per ID aus D (5), (6);
 *   - findMarkdownEntity() fuer exportEntityAsMarkdown() (7);
 *   - renderCharacterCard(), showNPCDetail(), showLocationDetail() lesen
 *     INNERHALB des Fensters eines leerenden Renderers (renderParty,
 *     renderNPCList, renderLocations) — weil enableCache() die Map nicht
 *     leert, sehen sie, was editSpell() bzw. editWikiEntry() vorher dort
 *     abgelegt hat (8)-(10).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag RUECKSPRUNG, docs/bugfixes.md), die diese Datei prueft
 *
 *   R4  Anzeigen folgen den Daten: Truhen-Detail direkt nach dem ersten 💾
 *       (1), Wiki-Pin nach dem Umbenennen, pinned in D und im Speicher (2),
 *       Wiki-Schnellzugriff und -Brotkrumen mit neuem Titel (3), Geloeschtes
 *       verschwindet aus dem Schnellzugriff (4), Loesch-Rueckfrage von Link
 *       (5) und Zauber (6) mit neuem Namen, Zauber-Markdown-Export mit
 *       Dateiname und Kopf neu (7), Heldenkarte (8), NPC-Detail (9) und
 *       Ort-Detail (10) mit dem neuen Namen des verknuepften Eintrags.
 *   R5  Mit mindestens einem Kaempfer war das Verhalten schon vor dem Fix
 *       richtig und bleibt es: (11) und (12), Kontrollen.
 * R1-R3 (frisches Lesen, Rundlauf ✏️ → 💾 → ✏️ nach jedem Einschaltweg,
 * Fehlerpfad) pruefen andere Waechter desselben Vertrags.
 *
 * DER WEG: jeder Fall geht DIREKT von der Startansicht in seine Ansicht,
 * ohne Umweg ueber NPCs oder Party — deren Darstellung leert den
 * Zwischenspeicher und haette den Fehler vor dem Fix verdeckt (gemessen).
 * laden() sichert "0 Kaempfer" als Vorbedingung zu, nicht den Zustand des
 * Zwischenspeichers: den gibt es nach dem Fix vielleicht gar nicht mehr.
 * Gezeigtes und Gelesenes stehen WEICH, damit ein roter Lauf jede
 * gebrochene Zusage nennt; dass das Speichern selbst gewirkt hat (D traegt
 * den neuen Stand, `_rev` hat sich bewegt), steht HART davor — ein Fall
 * wird also an der Anzeige rot, nicht am Speichern.
 *
 * (7) geht ueber ein zweites ✏️, weil der Export-Knopf nur im Formular
 * liegt. Dass dieses Formular vor dem Fix auch den alten Namen trug, ist R2
 * und wird hier nicht zugesichert; der Export liest den Eintrag selbst
 * (findMarkdownEntity), nicht das Formular. (4) verlangt nur, dass die
 * Anzeige den Eintrag fallen laesst — `D.wikiRecentlyViewed` behaelt die ID
 * (deleteWikiEntry() raeumt sie nicht ab), ob der Fix das mitnimmt, ist frei.
 *
 * DIE KONTROLLEN (11), (12) fahren DIESELBEN Ablaeufe (`FAELLE`) mit einem
 * Kaempfer in der Initiative, jeden in einem eigenen Kontext: dann laesst
 * renderInit() den Zwischenspeicher beim Laden aus, und alles war schon vor
 * dem Fix richtig (gemessen). Sie belegen zugleich, dass (1)-(10) am
 * Zwischenspeicher rot werden und nicht an Selektor, Saat oder Weg.
 *
 * GEGENPROBE (beim Schreiben, nicht Teil der Datei): zur Laufzeit nach dem
 * Laden nachgebildet UND als Kopie des Buendels mit der Aenderung im
 * Quelltext, gegen diese Datei gefahren, jede Variante mindestens zweimal
 * gleich:
 *   - get() liest immer aus D (Schritt 1 des Fixes):        alle 12 gruen.
 *   - renderInit()/renderDMScreen() leeren auf jedem Ausgang
 *     (finally) oder nur an den fruehen Rueckkehren:         alle 12 gruen —
 *     diese Datei trennt diesen zu kleinen Fix nicht vom gewaehlten; das tut
 *     der Fehlerpfad (R3).
 *   - enableCache() leert die Map:                           nur (8)-(10)
 *     gruen, (1)-(7) bleiben rot — sie lesen ausserhalb jedes Renderers.
 *   - save() leert beim Aufruf (Map und Schalter), ein Post-Save-Hook leert
 *     nach dem Schreiben, oder pushUndo() leert die Map:    NUR (1) rot —
 *     saveLoot() zeichnet das Detail VOR save() und legt keinen
 *     Rueckgaengig-Eintrag an; in allen anderen Faellen hat ein frueheres
 *     save() (in den Wiki-Faellen schon das Waehlen des Eintrags) bzw.
 *     pushUndo() vor dem Lesen geleert. save() leert nur die Map, der
 *     Schalter bleibt an:                                    (1), (3), (4) rot.
 *   - die Speicherwege aendern den Eintrag an Ort (Object.assign), statt ihn
 *     zu ersetzen:                                           NUR (4) rot — das
 *     geloeschte Objekt bleibt gemerkt.
 * (1) und (4) sind damit die EINZIGEN Faelle dieser Datei, die diese beiden
 * Fix-Familien als zu klein erkennen: (1) liest das Detail, das saveLoot()
 * selbst zeichnet, ohne Neuzeichnen dazwischen; (4) loescht, statt
 * umzubenennen. Wer sie umbaut, prueft diese Varianten erneut.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Die Loesch-Rueckfrage der Fraktionen (deleteWithConfirm, gemessen alt,
 * nicht in R4), die Heldenkarte mit umbenanntem oder geloeschtem Gegenstand
 * und geloeschtem Zauber (gemessen, dieselbe Mechanik wie (8)), Charakter-
 * Detail und Konzentration (nur gelesen), Notizen und Truhe beim Loeschen
 * (ihre Rueckfragen nennen keinen Namen), das Telefon, und dass saveLoot()
 * beim Bearbeiten keinen Rueckgaengig-Eintrag anlegt (eigener Befund).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

// ---------------------------------------------------------------------------
// SAAT
// ---------------------------------------------------------------------------

/** Der Gegenstand, der umbenannt wird — Menge und Wert so, dass die
 *  Detailspalte sie anders zeigt als nach dem Speichern (2 → 7). */
const LANGSCHWERT = {
    id: 1,
    name: 'Langschwert',
    category: 'weapons',
    rarity: 'uncommon',
    quantity: 2,
    weight: 3,
    value: 15,
    description: '<p>Scharf</p>',
    origin: '',
    special: '',
    property: '',
    tags: [],
    attunement: false
};
/** Der Nachbar in der Truhe; sortiert NACH dem Langschwert, damit die Truhe
 *  beim Betreten das Langschwert waehlt. */
const SEIL = {
    ...LANGSCHWERT,
    id: 2,
    name: 'Seil',
    category: 'misc',
    rarity: 'normal',
    quantity: 1,
    weight: 5,
    value: 1,
    description: ''
};

/** Wiki: ein Eltern-Eintrag und sein Kind — das Kind traegt die Brotkrumen. */
const TIEFWASSER = {
    id: 1,
    title: 'Tiefwasser',
    category: 'locations',
    content: '<p>Alte Stadt</p>',
    tags: ['Stadt'],
    pinned: false,
    parentId: null,
    createdAt: 1,
    updatedAt: 1
};
const HAFENVIERTEL = {
    id: 2,
    title: 'Hafenviertel',
    category: 'locations',
    content: '<p>Am Wasser</p>',
    tags: [],
    pinned: false,
    parentId: 1,
    createdAt: 2,
    updatedAt: 2
};

const WELTKARTE = {
    id: 1,
    title: 'Weltkarte',
    url: 'https://example.org/karte',
    category: 'maps',
    description: '<p>Die grosse Karte</p>'
};
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
    m: false,
    ritual: false,
    spellClasses: ['Magier'],
    description: '<p>Bumm</p>',
    note: ''
};
const LICHT = {
    ...FEUERBALL,
    id: 2,
    name: 'Licht',
    type: 'utility',
    level: 0,
    school: 'Hervorrufung',
    description: ''
};

/** Die Heldin, die den Feuerball kennt (Heldenkarte). */
const ARIA = {
    id: 1,
    name: 'Aria',
    class: 'Magier',
    level: 3,
    hp: 20,
    currentHp: 20,
    ac: 12,
    spells: [1],
    items: []
};
/** Der NPC, der auf den Feuerball verweist (NPC-Detail). */
const VOLO = {
    id: 1,
    name: 'Volo',
    race: 'Mensch',
    role: 'Autor',
    description: '',
    links: [{ type: 'spells', id: 1 }]
};
/** Der Ort, der auf den Wiki-Eintrag verweist (Ort-Detail). */
const HAFEN = { id: 1, name: 'Hafen', description: '', links: [{ type: 'wiki', id: 1 }] };

/** Ein Kaempfer fuer die Kontrollen (R5): mit ihm laesst `renderInit()` beim
 *  Laden den Zwischenspeicher aus. */
const EIN_KAEMPFER = {
    combatants: [
        {
            id: 1,
            name: 'Kaempfer 1',
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

/**
 * Die ganze Kampagne: leer bis auf `teil`, die Initiative leer oder mit
 * einem Kaempfer.
 * @param {Record<string, any[]>} teil
 * @param {boolean} kaempfer
 */
function seed(teil, kaempfer) {
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
        npcs: [],
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
        initiative: kaempfer ? EIN_KAEMPFER : { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        ...teil
    };
    /** @param {any[]} liste */
    const naechste = liste => Math.max(0, ...(liste || []).map(x => x.id || 0)) + 1;
    s._nextId = {
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
        sessionNotes: naechste(s.sessionNotes),
        randomTables: 1,
        filters: 1,
        factions: 1
    };
    return s;
}

// ---------------------------------------------------------------------------
// HILFEN
// ---------------------------------------------------------------------------

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
 * Laedt breit, saet EINMAL je Tab und bleibt auf der Startansicht — so steht
 * die App nach dem Laden da (warum das zaehlt: siehe Kopf, "Der Weg"). Die
 * Saat steht hinter einer sessionStorage-Sperre wie in link-anlegen.spec.js.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any[]>} teil
 * @param {boolean} kaempfer
 */
async function laden(page, teil, kaempfer) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('ruecksprung-anzeigen-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('ruecksprung-anzeigen-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(teil, kaempfer)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN (siehe link-anlegen.spec.js): repariert
    // `load()` die Saat, schreibt `saveAutomatic()` spaeter den ganzen Stand —
    // erkennbar am ueberschriebenen `_version`; kommt binnen 4 s keine, steht
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
    const ids = Object.fromEntries(Object.entries(teil).map(([k, v]) => [k, v.map(e => e.id)]));
    expect(
        await page.evaluate(
            schluessel =>
                Object.fromEntries(schluessel.map(k => [k, (window.D[k] || []).map(e => e.id)])),
            Object.keys(teil)
        ),
        'Vorbedingung: die Saat ist in D angekommen'
    ).toEqual(ids);
    expect(
        await page.evaluate(() => window.D.initiative?.combatants?.length ?? null),
        `Vorbedingung: ${kaempfer ? 'ein Kaempfer' : '0 Kaempfer'} in der Initiative`
    ).toBe(kaempfer ? 1 : 0);
}

/** Klick auf einen Reiter wie ein Nutzer.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht */
async function zuAnsicht(page, ansicht) {
    await navigateToTab(page, ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
}

/** WEICHE Zusicherungen fuer die Zusagen der Regel: ein roter Lauf soll JEDE
 *  gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen bleiben hart. */
const weich = expect.configure({ soft: true });

/** Text ohne Zeilenumbrueche und doppelte Leerzeichen.
 *  @param {string|null|undefined} t */
const glatt = t => (t || '').replace(/\s+/g, ' ').trim();

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad setzt ihn neu.
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
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .not.toBe(rev);
}

/** Ein Eintrag aus D, ohne `undefined`-Felder.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ
 *  @param {number} id */
function inD(page, typ, id) {
    return page.evaluate(
        ([typ, id]) =>
            JSON.parse(JSON.stringify((window.D[typ] || []).find(e => e.id === id) ?? null)),
        /** @type {[string, number]} */ ([typ, id])
    );
}
/** Derselbe Eintrag aus dem Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} typ
 *  @param {number} id */
function imSpeicher(page, typ, id) {
    return page.evaluate(([schluessel, typ, id]) => {
        try {
            const d = JSON.parse(localStorage.getItem(schluessel) || '{}');
            return (d[typ] || []).find(e => e.id === id) ?? null;
        } catch {
            return '(nicht lesbar)';
        }
    }, /** @type {[string, string, number]} */ ([SPEICHER, typ, id]));
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

/**
 * Klickt einen Knopf, der mit `confirm()` rueckfragt, liest die Frage und
 * lehnt ab — es wird nichts geloescht, gelesen wird nur der Text.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} knopf
 */
async function rueckfrageLesen(page, knopf) {
    /** @type {{ text: string|null }} */
    const frage = { text: null };
    page.once('dialog', async d => {
        frage.text = d.message();
        await d.dismiss();
    });
    await knopf.click();
    await expect
        .poll(() => frage.text, { message: 'Vorbedingung: der Knopf fragt zurueck' })
        .not.toBeNull();
    return frage.text;
}

// --- Wiki ---

/** Waehlt einen Wiki-Eintrag im Baum; klappt die Kategorie "Orte" auf, wenn
 *  er nicht sichtbar ist (Kategorien starten zugeklappt).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function wikiWaehlen(page, id) {
    const eintrag = page.locator(`#wiki-tree .wiki-tree-item[data-id="${id}"]`);
    if (!(await eintrag.isVisible())) {
        await page.locator('#wiki-tree .wiki-tree-cat-header[data-value="locations"]').click();
    }
    await eintrag.click();
    await expect(
        page.locator(`#wiki-detail [data-action="edit-wiki"][data-id="${id}"]`)
    ).toBeVisible();
}

/** Im Detail des Eltern-Eintrags: das Kind unter "Untereintraege" anklicken.
 *  @param {import('@playwright/test').Page} page */
async function wikiKindWaehlen(page) {
    await page
        .locator('#wiki-detail .wiki-link[data-action="select-wiki-entry"][data-id="2"]')
        .click();
    await expect(page.locator('#wiki-detail [data-action="edit-wiki"][data-id="2"]')).toBeVisible();
}

/** ✏️ am gewaehlten Eintrag 1, Titel aendern, Speichern, Schreiben abwarten.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} neu */
async function wikiUmbenennen(page, neu) {
    await page.locator('#wiki-detail [data-action="edit-wiki"][data-id="1"]').click();
    await expect(page.locator('#wiki-form-overlay')).toBeVisible();
    await eintippen(page, '#wiki-title', neu);
    const rev = await revStand(page);
    await page
        .locator('#wiki-form-overlay')
        .getByRole('button', { name: 'Speichern', exact: true })
        .click();
    await expect(page.locator('#wiki-form-overlay')).toBeHidden();
    await geschriebenSeit(page, rev, 'Wiki ✏️ → 💾');
    expect((await inD(page, 'wiki', 1))?.title, 'Vorbedingung: D traegt den neuen Titel').toBe(neu);
}

/** Der Schnellzugriff, wie er dasteht: `id:Beschriftung` je Eintrag.
 *  @param {import('@playwright/test').Page} page */
function schnellzugriff(page) {
    return page
        .locator('#wiki-quick-access .quick-access-item')
        .evaluateAll(els =>
            els.map(
                e =>
                    `${/** @type {HTMLElement} */ (e).dataset.id}:${(
                        e.querySelector('.quick-access-label')?.textContent || ''
                    ).trim()}`
            )
        );
}

// --- Zauber ---

/** Die Zauberkarte 1 aufgeklappt — ihre Knoepfe liegen im aufgeklappten Teil.
 *  @param {import('@playwright/test').Page} page */
async function zauberKarte(page) {
    const karte = page.locator('#view-spells .spell-card[data-spell-id="1"]');
    const stift = karte.getByRole('button', { name: '✏️ Bearbeiten' });
    if (!(await stift.isVisible())) {
        await karte.locator('.spell-card-header').click();
    }
    await expect(stift).toBeVisible();
    return karte;
}

/** ✏️ am Zauber 1 — das Formular steht danach offen.
 *  @param {import('@playwright/test').Page} page */
async function zauberBearbeiten(page) {
    await (await zauberKarte(page)).getByRole('button', { name: '✏️ Bearbeiten' }).click();
    await expect(page.locator('#spell-modal')).toHaveClass(/\bshow\b/);
}

/** ✏️ am Zauber 1, Namen aendern, Speichern, Schreiben abwarten.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} neu */
async function zauberUmbenennen(page, neu) {
    await zauberBearbeiten(page);
    await eintippen(page, '#spell-name', neu);
    const rev = await revStand(page);
    await page
        .locator('#spell-modal')
        .getByRole('button', { name: 'Speichern', exact: true })
        .click();
    await expect(page.locator('#spell-modal')).not.toHaveClass(/\bshow\b/);
    await geschriebenSeit(page, rev, 'Zauber ✏️ → 💾');
    expect((await inD(page, 'spells', 1))?.name, 'Vorbedingung: D traegt den neuen Namen').toBe(
        neu
    );
}

// ---------------------------------------------------------------------------
// DIE FAELLE — jeder als Ablauf, damit die Kontrollen (11) und (12) denselben
// Weg mit einem Kaempfer fahren koennen
// ---------------------------------------------------------------------------

/**
 * @typedef {object} Fall
 * @property {Record<string, any[]>} saat
 * @property {(page: import('@playwright/test').Page) => Promise<void>} ablauf
 */

/** @type {Record<string, Fall>} */
const FAELLE = {
    // (1) Truhe: die Detailspalte direkt nach dem ersten 💾
    truhe: {
        saat: { loot: [LANGSCHWERT, SEIL] },
        async ablauf(page) {
            await zuAnsicht(page, 'loot');
            const detail = page.locator('#loot-detail-panel');
            await expect(
                detail.locator('.loot-detail-name'),
                'Vorbedingung: die Truhe waehlt beim Betreten das Langschwert'
            ).toHaveText(LANGSCHWERT.name);
            await detail.locator('[data-action="edit-loot"][data-id="1"]').click();
            await expect(page.locator('#loot-modal')).toHaveClass(/\bshow\b/);
            await eintippen(page, '#loot-name', 'Langschwert NEU');
            await eintippen(page, '#loot-qty', '7');
            const rev = await revStand(page);
            await page
                .locator('#loot-modal')
                .getByRole('button', { name: '💾 Speichern', exact: true })
                .click();
            await expect(page.locator('#loot-modal')).not.toHaveClass(/\bshow\b/);
            await geschriebenSeit(page, rev, 'Truhe ✏️ → 💾');
            const d = await inD(page, 'loot', 1);
            expect(
                { name: d?.name, menge: d?.quantity },
                'Vorbedingung: D traegt Name und Menge neu'
            ).toEqual({ name: 'Langschwert NEU', menge: 7 });

            weich(
                {
                    name: glatt(await detail.locator('.loot-detail-name').textContent()),
                    werte: (await detail.locator('.loot-stat-value').allTextContents()).map(glatt)
                },
                'R4: die Detailspalte zeigt direkt nach dem 💾 den gespeicherten Stand'
            ).toEqual({ name: 'Langschwert NEU', werte: ['7', '105 GM', '3 kg'] });
        }
    },

    // (2) Wiki: 📍 nach dem Umbenennen pinnt den Eintrag in D
    pin: {
        saat: { wiki: [TIEFWASSER, HAFENVIERTEL] },
        async ablauf(page) {
            await zuAnsicht(page, 'wiki');
            await wikiWaehlen(page, 1);
            await wikiUmbenennen(page, 'Tiefwasser NEU');
            const pin = page.locator('#wiki-detail [data-action="toggle-wiki-pin"][data-id="1"]');
            await expect(pin, 'Vorbedingung: ungepinnt').toHaveText('📍');
            const rev = await revStand(page);
            await pin.click();
            await geschriebenSeit(page, rev, '📍');

            weich((await inD(page, 'wiki', 1))?.pinned, 'R4: pinned in D').toBe(true);
            weich((await imSpeicher(page, 'wiki', 1))?.pinned, 'R4: pinned im Speicher').toBe(true);
            weich(glatt(await pin.textContent()), 'R4: der Knopf zeigt den Pin').toBe('📌');
        }
    },

    // (3) Wiki: Schnellzugriff und Brotkrumen nennen den neuen Titel
    brotkrumen: {
        saat: { wiki: [TIEFWASSER, HAFENVIERTEL] },
        async ablauf(page) {
            await zuAnsicht(page, 'wiki');
            await wikiWaehlen(page, 1);
            await wikiKindWaehlen(page);
            const brotkrumen = page.locator('#wiki-detail .wiki-breadcrumb .breadcrumb-item');
            expect(
                (await brotkrumen.allTextContents()).map(glatt),
                'Vorbedingung: die Brotkrumen des Kinds vor dem Umbenennen'
            ).toEqual(['🏰 Orte', 'Tiefwasser', 'Hafenviertel']);
            await wikiWaehlen(page, 1);
            await wikiUmbenennen(page, 'Tiefwasser NEU');

            weich(
                await schnellzugriff(page),
                'R4: der Schnellzugriff nennt den neuen Titel'
            ).toEqual(['1:Tiefwasser NEU', '2:Hafenviertel']);
            await wikiKindWaehlen(page);
            weich(
                (await brotkrumen.allTextContents()).map(glatt),
                'R4: die Brotkrumen des Kinds nennen den neuen Eltern-Titel'
            ).toEqual(['🏰 Orte', 'Tiefwasser NEU', 'Hafenviertel']);
        }
    },

    // (4) Wiki: ein geloeschter Eintrag verschwindet aus dem Schnellzugriff
    geloescht: {
        saat: { wiki: [TIEFWASSER, HAFENVIERTEL] },
        async ablauf(page) {
            await zuAnsicht(page, 'wiki');
            await wikiWaehlen(page, 1);
            await wikiKindWaehlen(page);
            await wikiWaehlen(page, 1);
            expect(
                await schnellzugriff(page),
                'Vorbedingung: beide besuchten Eintraege im Schnellzugriff'
            ).toEqual(['1:Tiefwasser', '2:Hafenviertel']);
            const rev = await revStand(page);
            page.once('dialog', d => d.accept());
            await page.locator('#wiki-detail [data-action="delete-wiki"][data-id="1"]').click();
            await geschriebenSeit(page, rev, 'Wiki 🗑️');
            expect(
                await page.evaluate(() => window.D.wiki.map(e => e.id)),
                'Vorbedingung: der Eintrag ist aus D geloescht'
            ).toEqual([2]);

            weich(
                await schnellzugriff(page),
                'R4: der geloeschte Eintrag verschwindet aus dem Schnellzugriff'
            ).toEqual(['2:Hafenviertel']);
        }
    },

    // (5) Link: die Loesch-Rueckfrage nennt den neuen Titel
    linkFrage: {
        saat: { links: [WELTKARTE, SRD] },
        async ablauf(page) {
            await zuAnsicht(page, 'links');
            await page.locator('#links-list [data-action="edit-link"][data-id="1"]').click();
            await expect(page.locator('#link-form-card')).toBeVisible();
            await eintippen(page, '#link-title', 'Weltkarte NEU');
            const rev = await revStand(page);
            await page
                .locator('#link-form-card')
                .getByRole('button', { name: 'Speichern', exact: true })
                .click();
            await expect(page.locator('#link-form-card')).toBeHidden();
            await geschriebenSeit(page, rev, 'Link ✏️ → 💾');
            expect(
                (await inD(page, 'links', 1))?.title,
                'Vorbedingung: D traegt den neuen Titel'
            ).toBe('Weltkarte NEU');

            const frage = await rueckfrageLesen(
                page,
                page.locator('#links-list [data-action="delete-link"][data-id="1"]')
            );
            weich(frage, 'R4: die Rueckfrage nennt den Link, wie er jetzt heisst').toBe(
                'Link "Weltkarte NEU" löschen?'
            );
        }
    },

    // (6) Zauber: die Loesch-Rueckfrage nennt den neuen Namen
    zauberFrage: {
        saat: { spells: [FEUERBALL, LICHT] },
        async ablauf(page) {
            await zuAnsicht(page, 'spells');
            await zauberUmbenennen(page, 'Feuerball NEU');
            const karte = await zauberKarte(page);
            const frage = await rueckfrageLesen(
                page,
                karte.getByRole('button', { name: '🗑️ Löschen' })
            );
            weich(frage, 'R4: die Rueckfrage nennt den Zauber, wie er jetzt heisst').toBe(
                'Zauber "Feuerball NEU" löschen?'
            );
        }
    },

    // (7) Zauber: der Markdown-Export traegt den neuen Namen
    export: {
        saat: { spells: [FEUERBALL, LICHT] },
        async ablauf(page) {
            await zuAnsicht(page, 'spells');
            await zauberUmbenennen(page, 'Feuerball NEU');
            await zauberBearbeiten(page);
            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 3000 }),
                page.locator('#spell-modal').getByRole('button', { name: '📄 Export' }).click()
            ]);
            const inhalt = fs.readFileSync(await download.path(), 'utf8');

            weich(
                { datei: download.suggestedFilename(), kopf: inhalt.split('\n')[0] },
                'R4: Dateiname und Kopf des Exports nennen den gespeicherten Namen'
            ).toEqual({ datei: 'Feuerball_NEU.md', kopf: '# Feuerball NEU' });
        }
    },

    // (8) Heldenkarte: der umbenannte Zauber
    heldenkarte: {
        saat: { spells: [FEUERBALL, LICHT], characters: [ARIA] },
        async ablauf(page) {
            await zuAnsicht(page, 'spells');
            await zauberUmbenennen(page, 'Feuerball NEU');
            await zuAnsicht(page, 'party');
            const marken = page.locator('#char-1 .char-tag.spell');
            await expect(marken, 'Vorbedingung: die Heldenkarte fuehrt ihren Zauber').toHaveCount(
                1
            );

            weich(
                (await marken.allTextContents()).map(glatt),
                'R4: die Heldenkarte nennt den Zauber, wie er jetzt heisst'
            ).toEqual(['✨ Feuerball NEU']);
        }
    },

    // (9) NPC-Detail: der verknuepfte, umbenannte Zauber
    npcDetail: {
        saat: { spells: [FEUERBALL, LICHT], npcs: [VOLO] },
        async ablauf(page) {
            await zuAnsicht(page, 'spells');
            await zauberUmbenennen(page, 'Feuerball NEU');
            await zuAnsicht(page, 'npcs');
            const verweis = page.locator(
                '#npc-detail-panel .npc-link[data-type="spells"][data-id="1"]'
            );
            await expect(verweis, 'Vorbedingung: das NPC-Detail fuehrt den Verweis').toHaveCount(1);

            weich(
                glatt(await verweis.textContent()),
                'R4: das NPC-Detail nennt den verknuepften Zauber, wie er jetzt heisst'
            ).toBe('✨ Feuerball NEU');
        }
    },

    // (10) Ort-Detail: der verknuepfte, umbenannte Wiki-Eintrag
    ortDetail: {
        saat: { wiki: [TIEFWASSER, HAFENVIERTEL], locations: [HAFEN] },
        async ablauf(page) {
            await zuAnsicht(page, 'wiki');
            await wikiWaehlen(page, 1);
            await wikiUmbenennen(page, 'Tiefwasser NEU');
            await zuAnsicht(page, 'locations');
            const verweis = page.locator(
                '#loc-detail-panel .loc-link[data-type="wiki"][data-id="1"]'
            );
            await expect(verweis, 'Vorbedingung: das Ort-Detail fuehrt den Verweis').toHaveCount(1);

            weich(
                glatt(await verweis.textContent()),
                'R4: das Ort-Detail nennt den verknuepften Eintrag, wie er jetzt heisst'
            ).toBe('📖 Tiefwasser NEU');
        }
    }
};

/**
 * Faehrt einen Fall auf einer frischen Seite: laden, Ablauf, keine Fehler.
 * @param {import('@playwright/test').Page} page
 * @param {Fall} fall
 * @param {boolean} kaempfer
 */
async function fahren(page, fall, kaempfer) {
    const fehler = fehlerFangen(page);
    await laden(page, fall.saat, kaempfer);
    await fall.ablauf(page);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
}

/**
 * Die Kontrolle: dieselben Ablaeufe mit einem Kaempfer, jeder in einem
 * eigenen Kontext (eigener Speicher, eigene Saat).
 * @param {import('@playwright/test').Browser} browser
 * @param {string[]} namen
 */
async function kontrolle(browser, namen) {
    for (const name of namen) {
        await test.step(`${name}, mit einem Kaempfer`, async () => {
            const kontext = await browser.newContext({ viewport: BREIT });
            try {
                await fahren(await kontext.newPage(), FAELLE[name], true);
            } finally {
                await kontext.close();
            }
        });
    }
}

// ===========================================================================
// (1) TRUHE: DIE DETAILSPALTE DIREKT NACH DEM ERSTEN 💾
// ===========================================================================
test('(1) Truhe: die Detailspalte zeigt direkt nach dem ersten 💾 Name und Menge neu', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.truhe, false);
});

// ===========================================================================
// (2) WIKI: 📍 NACH DEM UMBENENNEN PINNT DEN EINTRAG
// ===========================================================================
test('(2) Wiki: 📍 nach dem Umbenennen pinnt den Eintrag in D und im Speicher', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.pin, false);
});

// ===========================================================================
// (3) WIKI: SCHNELLZUGRIFF UND BROTKRUMEN NACH DEM UMBENENNEN
// ===========================================================================
test('(3) Wiki: Schnellzugriff und Brotkrumen nennen nach dem Umbenennen den neuen Titel', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.brotkrumen, false);
});

// ===========================================================================
// (4) WIKI: EIN GELOESCHTER EINTRAG VERSCHWINDET AUS DEM SCHNELLZUGRIFF
// ===========================================================================
test('(4) Wiki: ein geloeschter Eintrag verschwindet aus dem Schnellzugriff', async ({ page }) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.geloescht, false);
});

// ===========================================================================
// (5) LINK: DIE LOESCH-RUECKFRAGE NACH DEM UMBENENNEN
// ===========================================================================
test('(5) Link: die Loesch-Rueckfrage nennt nach dem Umbenennen den neuen Titel', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.linkFrage, false);
});

// ===========================================================================
// (6) ZAUBER: DIE LOESCH-RUECKFRAGE NACH DEM UMBENENNEN
// ===========================================================================
test('(6) Zauber: die Loesch-Rueckfrage nennt nach dem Umbenennen den neuen Namen', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.zauberFrage, false);
});

// ===========================================================================
// (7) ZAUBER: DER MARKDOWN-EXPORT NACH DEM UMBENENNEN
// ===========================================================================
test('(7) Zauber: der Markdown-Export traegt im Dateinamen und im Kopf den neuen Namen', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.export, false);
});

// ===========================================================================
// (8) HELDENKARTE: DER UMBENANNTE ZAUBER
// ===========================================================================
test('(8) Heldenkarte: zeigt den umbenannten Zauber mit neuem Namen', async ({ page }) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.heldenkarte, false);
});

// ===========================================================================
// (9) NPC-DETAIL: DER VERKNUEPFTE, UMBENANNTE ZAUBER
// ===========================================================================
test('(9) NPC-Detail: zeigt den verknuepften Zauber nach dem Umbenennen mit neuem Namen', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.npcDetail, false);
});

// ===========================================================================
// (10) ORT-DETAIL: DER VERKNUEPFTE, UMBENANNTE WIKI-EINTRAG
// ===========================================================================
test('(10) Ort-Detail: zeigt den verknuepften Wiki-Eintrag nach dem Umbenennen mit neuem Titel', async ({
    page
}) => {
    test.setTimeout(60000);
    await fahren(page, FAELLE.ortDetail, false);
});

// ===========================================================================
// (11) KONTROLLE: DIE WIKI-ANZEIGEN MIT EINEM KAEMPFER
// ===========================================================================
test('(11) mit einem Kaempfer zeigen Pin, Schnellzugriff, Brotkrumen und Ort-Detail schon den neuen Stand (Kontrolle)', async ({
    browser
}) => {
    test.setTimeout(150000);
    await kontrolle(browser, ['pin', 'brotkrumen', 'geloescht', 'ortDetail']);
});

// ===========================================================================
// (12) KONTROLLE: TRUHE, RUECKFRAGEN, EXPORT, HELDENKARTE, NPC-DETAIL MIT EINEM KAEMPFER
// ===========================================================================
test('(12) mit einem Kaempfer zeigen Truhe, Rueckfragen, Export, Heldenkarte und NPC-Detail schon den neuen Stand (Kontrolle)', async ({
    browser
}) => {
    test.setTimeout(150000);
    await kontrolle(browser, [
        'truhe',
        'linkFrage',
        'zauberFrage',
        'export',
        'heldenkarte',
        'npcDetail'
    ]);
});
