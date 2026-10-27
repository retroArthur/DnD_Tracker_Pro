// @ts-check
/**
 * Anlegen nach abgebrochenem Bearbeiten — das Quest-Formular (ABBRUCH, QUEST)
 * ===========================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer eine Quest mit ✏️
 * oeffnet, ✕ oder Escape drueckt und danach eine Quest ANLEGT, legt eine
 * NEUE an** — jeder Anlege-Weg zeigt ein leeres Formular, und die zuletzt
 * angesehene Quest bleibt feldgleich, in D, im Speicher und nach dem
 * Neuladen.
 *
 * Vertrag ABBRUCH in `docs/bugfixes.md` (R1–R4, R6 fuer QUEST). Vorbild ist
 * die NPC-Behebung, `tests/e2e/features/npc-formular.spec.js`.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d (Branch abbrechen-neu), 1440x900, echte
 * Klicks und Tasten, Saat wie unten (Drachenjagd mit jedem Feld, das das
 * Formular kennt, dazu ein Feld, das es nicht kennt; Botengang mit leerer
 * Auswahl):
 *
 *   ✏️ → ✕/Escape → "+ Quest"    das Formular traegt Drachenjagd samt
 *   (ebenso Taste n, Befehls-    #edit-quest-id "1"; 💾 als "Neue Quest"
 *   palette "Neue Quest", und    UEBERSCHREIBT sie (Geber, Ort, Ziel, Gold,
 *   ✏️ ueber die Suche)          Item bleiben stehen, nur der Titel wechselt)
 *                                — in D, im Speicher, nach dem Neuladen. Keine
 *                                Meldung, Undo-Kopf "Quest bearbeitet".
 *   ✏️ → ✕ → 🗑️ → "Aktive" ab    das Formular traegt die GELOESCHTE Quest;
 *   → "➕ Quest erstellen"       💾 speichert NICHTS (D und Speicher leer),
 *                                Undo-Kopf "Quest bearbeitet" (leer), keine
 *                                Meldung — das Schliessen sieht aus wie Erfolg
 *   "+ Quest" Neu A → 💾 → ✏️    Strg+Z mit dem Fokus im Feld nimmt Neu A in
 *   → "Ehre" → Strg+Z → 💾       D zurueck; 💾 schreibt nichts, Neu A samt
 *                                Eingabe ist weg
 *   ✏️ Drachenjagd → ✕ → ✏️      Botengang zeigt Geber 1, Ort 1, Ziel 2 von
 *   Botengang → 💾               Drachenjagd und speichert sie; ebenso nach
 *                                einem Anlege-ENTWURF mit Auswahl
 *
 * DIE URSACHEN:
 *   - Alle vier Anlege-Wege oeffnen per `showModal('quest-modal')`, ohne zu
 *     leeren: `assets/templates/view-content.html:127` ("+ Quest"),
 *     `features/quests/quests-render.js:41-42` (Knopf der leeren Liste),
 *     `systems/spellslots/keyboard-shortcuts.js:811` (Taste n),
 *     `features/command-palette/action-registry.js:34` (Befehlspalette).
 *   - ✕ und Escape nehmen nur `show` ab (`systems/spellslots/navigation.js:
 *     114-118`); `clearQuestForm()` (`features/quests/quests-crud.js:124-150`)
 *     ruft nur `saveQuest()` nach dem Speichern (Z. 59).
 *   - `saveQuest()` nimmt jede ID im versteckten Feld als Bearbeiten,
 *     `pushUndo('Quest bearbeitet')` VOR der Suche (`quests-crud.js:50`);
 *     findet es die ID nicht (Z. 52-53), schreibt es nichts und schliesst,
 *     leert und speichert trotzdem (Z. 58-61).
 *   - Strg+Z ist "immer aktiv", auch mit dem Fokus in einem Formularfeld
 *     (`keyboard-shortcuts.js:514-519`, die isTyping-Schranke kommt spaeter).
 *   - `populateQuestSelects()` behaelt die Auswahl beim Neubefuellen
 *     (`quests-crud.js:156/165, 170/174, 179/183`), und `editQuest()` setzt
 *     im `setTimeout` nur WAHRE Werte (`quests-crud.js:95-97`) — eine leere
 *     Auswahl von B laesst die von A stehen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN, die hier gelten (aus dem Vertrag)
 *
 *   R1  Jeder Anlege-Weg zeigt nach Bearbeiten → Abbrechen ein Formular ohne
 *       Bearbeiten-ID und ohne Werte des bearbeiteten Eintrags; 💾 legt NEU
 *       an, der bearbeitete bleibt feldgleich. Je Anlege-Weg ein Fall, die
 *       zwei Abbruch-Wege (✕, Escape) darauf verteilt — einen
 *       Abbrechen-Knopf hat das Quest-Formular nicht, ein Klick daneben
 *       schliesst nicht (gemessen).
 *   R2  Ein nie gespeicherter Entwurf ueberlebt Abbrechen, und der naechste
 *       Anlege-Weg verwirft ihn NICHT (Waechter (8) fuer "+ Quest", Taste n
 *       und Befehlspalette; der Knopf der leeren Liste im Waechter-Teil von
 *       Fall (4), weil die Liste in (8) nie leer ist).
 *   R3  Bei offenem Formular tun Taste n und Befehlspalette nichts (Waechter
 *       — heute harmlos, weil nichts leert; ein Fix, der beim Anlegen leert,
 *       muss das offene Formular ausnehmen).
 *   R4  Zeigt die ID beim Speichern ins Leere (geloescht, per Strg+Z
 *       zurueckgenommen), wird die Eingabe als NEUE Quest gespeichert, mit
 *       Warnung, ohne "… aktualisiert", ohne leeren Undo-Eintrag
 *       "Quest bearbeitet".
 *   R6  ✏️ B nach abgebrochenem ✏️ A (oder nach einem Anlege-Entwurf)
 *       uebernimmt keine Auswahl (Geber, Ort, Ziel); leere Felder bleiben
 *       leer.
 *
 * DER KNOPF DER LEEREN LISTE erscheint nur ungefiltert (`isFiltered = search
 * || activeOnly`, `quests-render.js:43`), und "Aktive" ist ab Werk angehakt
 * (`view-content.html:121`). Die Liste ist ungefiltert nur leer, wenn die
 * zuletzt bearbeitete Quest geloescht ist — dieser Weg fuehrt also nur zu
 * R4 (Fall 4), und der Fall waehlt "Aktive" per Klick ab.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Der Fenstertitel "Quest bearbeiten" (V6, eigener PR), die Platzhalter als
 * gespeicherte Namen ("-- NPC wählen --", Nebenbefund 1), die fehlende
 * Erfolgsmeldung von `saveQuest()` beim normalen Anlegen und Bearbeiten,
 * Strg+Z bei offenem Formular auf eine NOCH VORHANDENE Quest (V4c: das
 * naechste 💾 schreibt das Formular darueber — dieselbe Grenze wie beim NPC).
 * Telefon: der Anlege-Weg ist dort derselbe Knopf (Kritik K3a), die
 * Desktop-Faelle tragen die Regel.
 *
 * ANLEGE-KNOEPFE werden ueber Rolle und sichtbaren Text gewaehlt, nicht ueber
 * `data-action`/`data-value`: mit dem Fix wird aus "show-modal" +
 * "quest-modal" eine eigene Aktion, der Knopf bleibt fuer den Nutzer derselbe.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung der Gruppe. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Die sessionStorage-Sperre der Saat (je Tab einmal). */
const SPERRE = 'quest-anlegen-gesaet';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

const NPCS = [
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
];

/** Quest 1: JEDES Feld, das das Formular fuehrt, gefuellt — sonst koennte ein
 *  Rest im Formular stehen, den kein Fall bemerkt. Dazu ein Feld, das kein
 *  Formular kennt (`eigenesFeld`, `createdAt`): "feldgleich" heisst auch, dass
 *  es stehen bleibt. */
const DRACHENJAGD = {
    id: 1,
    title: 'Drachenjagd',
    giverId: 1,
    giverName: 'Volo Geddarm (Schriftsteller)',
    locationId: 1,
    locationName: 'Tiefwasser',
    targetId: 2,
    targetName: 'Niewinter',
    type: 'plot',
    description: '<p>Den <b>roten Drachen</b> stellen.</p>',
    rewardGold: 500,
    rewardItems: [{ id: 1, name: 'Heiltrank' }],
    rewardOther: 'Ruhm',
    epilog: '<p>Die Stadt feiert.</p>',
    completed: false,
    rewardReceived: false,
    createdAt: 1700000000000,
    eigenesFeld: { x: 1 }
};

/** Quest 2: alle Auswahl- und Optionalfelder LEER — das Ziel von R6. */
const BOTENGANG = {
    id: 2,
    title: 'Botengang',
    giverId: null,
    giverName: '',
    locationId: null,
    locationName: '',
    targetId: null,
    targetName: '',
    type: 'quest',
    description: '<p>Brief zustellen.</p>',
    rewardGold: 0,
    rewardItems: [],
    rewardOther: '',
    epilog: '',
    completed: false,
    rewardReceived: false,
    createdAt: 1700000000001
};

/** @param {object[]} quests */
function seed(quests) {
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
        npcs: NPCS,
        locations: [
            { id: 1, name: 'Tiefwasser', description: '', filterId: null },
            { id: 2, name: 'Niewinter', description: '', filterId: null },
            { id: 3, name: 'Baldurs Tor', description: '', filterId: null }
        ],
        quests,
        loot: [{ id: 1, name: 'Heiltrank', quantity: 2 }],
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
            characters: 1,
            npcs: 3,
            locations: 4,
            quests: Math.max(0, ...quests.map(q => q.id)) + 1,
            encounters: 1,
            spells: 1,
            loot: 2,
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
 * Netzrauschen (Schriften unter file://). Wie in `npc-formular.spec.js`.
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
 * Laedt breit, saet EINMAL je Tab und oeffnet die Quest-Ansicht ueber die
 * Navigation (echte Klicks). Die Saat steht hinter einer
 * sessionStorage-Sperre: ein `page.reload()` liest dann, was die App
 * gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} quests
 */
async function questsLaden(page, quests) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, sperre, s]) => {
            try {
                if (!sessionStorage.getItem(sperre)) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem(sperre, '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, SPERRE, seed(quests)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN (wie npc-formular.spec.js): repariert
    // `load()` die Saat, schreibt `saveAutomatic()` spaeter den ganzen Stand
    // aus D. Erkennbar daran, dass `_version` der Saat ueberschrieben wird.
    // 2 s statt der 4 s des Vorbilds: die Reparatur-Speicherung stellt
    // `_finishAppliedCampaign()` per `setTimeout(…, 1000)` ein
    // (`systems/spellslots/quick-roll.js:115`), und das laeuft VOR `appReady`.
    // Diese Saat braucht keine Reparatur — gemessen: binnen 4 s KEIN fremdes
    // Schreiben —, also wartete jeder Fall die volle Zeit, bei zehn Faellen
    // 20 s fuer nichts. 2 s lassen der eingestellten Sekunde eine Sekunde Luft.
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
            { timeout: 2000 }
        )
        .catch(() => {});
    await navigateToTab(page, 'quests');
    await expect(page.locator('#view-quests')).toBeVisible();
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Eine Quest aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function questInD(page, id) {
    return page.evaluate(
        id => JSON.parse(JSON.stringify(window.D.quests.find(q => q.id === id) ?? null)),
        id
    );
}

/** Eine Quest aus dem Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function questImSpeicher(page, id) {
    return page.evaluate(
        ([schluessel, id]) => {
            try {
                return (
                    (JSON.parse(localStorage.getItem(schluessel) || '{}').quests || []).find(
                        q => q.id === id
                    ) ?? null
                );
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, id]
    );
}

/** Alle Quest-Titel in D. Ohne ID: welche ID eine neue Quest bekommt,
 *  entscheidet nextId(), nicht dieser Waechter.
 *  @param {import('@playwright/test').Page} page */
function titelInD(page) {
    return page.evaluate(() => window.D.quests.map(q => q.title));
}
/** @param {import('@playwright/test').Page} page */
function titelImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return (JSON.parse(localStorage.getItem(schluessel) || '{}').quests || []).map(
                q => q.title
            );
        } catch {
            return ['(nicht lesbar)'];
        }
    }, SPEICHER);
}

/** Die Quest mit diesem Titel aus D bzw. dem Speicher, gekuerzt auf das, was
 *  ein Fall prueft.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} titel
 *  @param {boolean} [ausSpeicher] */
function questNachTitel(page, titel, ausSpeicher = false) {
    return page.evaluate(
        ([schluessel, titel, ausSpeicher]) => {
            let liste;
            try {
                liste = ausSpeicher
                    ? JSON.parse(localStorage.getItem(schluessel) || '{}').quests || []
                    : window.D.quests;
            } catch {
                return '(nicht lesbar)';
            }
            const q = liste.find(x => x.title === titel);
            return q
                ? {
                      title: q.title,
                      giverId: q.giverId ?? null,
                      locationId: q.locationId ?? null,
                      targetId: q.targetId ?? null,
                      rewardGold: q.rewardGold ?? null,
                      rewardOther: q.rewardOther ?? null
                  }
                : null;
        },
        [SPEICHER, titel, ausSpeicher]
    );
}

/** Alle Felder des Formulars, wie das Template sie fuehrt.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        const haken = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.checked;
        const md = document.getElementById('quest-markdown-actions');
        return {
            offen: document.getElementById('quest-modal')?.classList.contains('show'),
            fenstertitel: document.querySelector('#quest-modal .modal-title')?.textContent?.trim(),
            id: wert('edit-quest-id'),
            titel: wert('quest-title'),
            geber: wert('quest-giver'),
            ort: wert('quest-location'),
            ziel: wert('quest-target'),
            typ: wert('quest-type'),
            beschreibung: document.getElementById('quest-desc')?.textContent?.trim(),
            epilog: document.getElementById('quest-epilog')?.textContent?.trim(),
            gold: wert('quest-reward-gold'),
            sonstiges: wert('quest-reward-other'),
            abgeschlossen: haken('quest-completed'),
            belohnt: haken('quest-rewarded'),
            items: Array.from(
                document.querySelectorAll('#quest-reward-items-list .quest-reward-item-tag')
            ).map(t => /** @type {HTMLElement} */ (t).dataset.itemName),
            markdownKnoepfe: md ? getComputedStyle(md).display : '(fehlt)'
        };
    });
}

/**
 * Das leere Formular im Anlege-Zustand — so, wie ein frisches "+ Quest" es
 * zeigt (Fall 10 haelt das fest). DIE MARKDOWN-KNOEPFE GEHOEREN DAZU:
 * sichtbar zielen sie auf den bearbeiteten Eintrag — gemessen laedt 📄 dann
 * "Drachenjagd.md" herunter, und 📥 schreibt in dessen Beschreibung (M1 im
 * Gruppenbericht). Ein Anlege-Formular mit ihnen traegt also noch den alten
 * Eintrag, auch wenn jedes Feld leer ist.
 */
const LEER = {
    offen: true,
    fenstertitel: 'Quest hinzufügen',
    id: '',
    titel: '',
    geber: '',
    ort: '',
    ziel: '',
    typ: 'quest',
    beschreibung: '',
    epilog: '',
    gold: '',
    sonstiges: '',
    abgeschlossen: false,
    belohnt: false,
    items: [],
    markdownKnoepfe: 'none'
};

/** "+ Quest" in der Werkzeugleiste — ueber Rolle und Namen, nicht ueber
 *  `data-action`: der Knopf ist derselbe vor und nach dem Fix.
 *  @param {import('@playwright/test').Page} page */
function plusQuest(page) {
    return page.locator('#view-quests').getByRole('button', { name: '+ Quest', exact: true });
}

/** Der Knopf der leeren Liste ("➕ Quest erstellen"), ueber seinen Text.
 *  @param {import('@playwright/test').Page} page */
function leereListeKnopf(page) {
    return page.locator('#quests-list').getByRole('button', { name: /Quest erstellen/ });
}

/**
 * Laesst die Zeitgeber der Seite laufen, die ein Bedienweg angestossen hat:
 * `editQuest()` setzt Geber, Ort und Ziel erst per `setTimeout(…, 10)`. Ein
 * Zeitgeber mit 100 ms, NACH dem Klick gestellt, laeuft sicher danach — ein
 * fester Wert waere sonst die Frage, ob 150 ms reichen. Ein Warten auf den
 * ERWARTETEN Wert ginge bei R6 nicht: heute erscheint er nie, und der Fall
 * waere an einer Zeitgrenze rot statt an seiner Zusage.
 * @param {import('@playwright/test').Page} page
 */
function zeitgeberAbwarten(page) {
    return page.evaluate(() => new Promise(r => setTimeout(r, 100)));
}

/**
 * Wartet, bis editQuest() die GESETZTEN Auswahlfelder der Quest zeigt, und
 * laesst danach die Zeitgeber laufen (siehe oben). Ein 💾 davor speicherte
 * `giverId: null`, und ein Fall waere aus FREMDEM Grund rot.
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 */
async function auswahlGesetzt(page, id) {
    await page.waitForFunction(id => {
        const q = window.D.quests.find(x => x.id === id);
        const passt = (feld, sel) =>
            !q ||
            !q[feld] ||
            /** @type {HTMLSelectElement} */ (document.getElementById(sel))?.value ===
                String(q[feld]);
        return (
            passt('giverId', 'quest-giver') &&
            passt('locationId', 'quest-location') &&
            passt('targetId', 'quest-target')
        );
    }, id);
    await zeitgeberAbwarten(page);
}

/** Karte aufklappen (falls zu) und ✏️.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    const karte = page.locator(`#quest-${id}`);
    if (!/\bexpanded\b/.test((await karte.getAttribute('class')) || '')) {
        await karte.locator('.quest-title').click();
    }
    await karte.locator('[data-action="edit-quest"]').click();
    await expect(page.locator('#quest-modal')).toHaveClass(/\bshow\b/);
    await auswahlGesetzt(page, id);
}

/** Der zweite Bearbeiten-Weg: globale Suche → Treffer
 *  (`systems/search/global-search.js:254-256`, editQuest() nach 100 ms).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} begriff
 *  @param {number} id */
async function bearbeitenUeberSuche(page, begriff, id) {
    await page.locator('#global-search').click();
    await page.keyboard.type(begriff);
    const treffer = page.locator(
        `#global-search-results .search-result-item[data-type="quest"][data-id="${id}"]`
    );
    await expect(treffer).toBeVisible();
    await treffer.click();
    await expect(page.locator('#quest-modal')).toHaveClass(/\bshow\b/);
    await auswahlGesetzt(page, id);
}

/** Abbrechen ueber das ✕ im Kopf.
 *  @param {import('@playwright/test').Page} page */
async function kreuz(page) {
    await page.locator('#quest-modal .modal-header [data-action="hide-modal"]').click();
    await expect(page.locator('#quest-modal')).not.toHaveClass(/\bshow\b/);
}

/** Abbrechen ueber Escape.
 *  @param {import('@playwright/test').Page} page */
async function escape(page) {
    await page.keyboard.press('Escape');
    await expect(page.locator('#quest-modal')).not.toHaveClass(/\bshow\b/);
}

/** Befehlspalette → "Neue Quest" → Enter.
 *  @param {import('@playwright/test').Page} page */
async function paletteNeueQuest(page) {
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    // Erst tippen, wenn das Suchfeld den Fokus hat (npc-formular.spec.js (5)).
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type('Neue Quest');
    // Enter fuehrt den OBERSTEN Treffer aus, die Suche ist um 80 ms entprellt.
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText('Neue Quest');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
}

/** Wartet nach einem Anlege-Weg, bis das Formular offen ist und alle
 *  angestossenen Zeitgeber gelaufen sind.
 *  @param {import('@playwright/test').Page} page */
async function angelegtOffen(page) {
    await expect(page.locator('#quest-modal')).toHaveClass(/\bshow\b/);
    await zeitgeberAbwarten(page);
}

/** 💾 im Formular — ueber den sichtbaren Namen.
 *  @param {import('@playwright/test').Page} page */
async function speichern(page) {
    await page
        .locator('#quest-modal')
        .getByRole('button', { name: 'Speichern', exact: true })
        .click();
    await expect(page.locator('#quest-modal')).not.toHaveClass(/\bshow\b/);
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
 *  ihn neu. Ohne ihn waere "der Speicher traegt den alten Stand" nicht von
 *  "es wurde gar nicht geschrieben" zu unterscheiden.
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

/** Der oberste Eintrag des Rueckgaengig-Stapels.
 *  @param {import('@playwright/test').Page} page */
function undoKopf(page) {
    return page.evaluate(() => (undoStack.length ? undoStack[undoStack.length - 1].action : null));
}

/** Neu laden und auf die App warten — liest, was gespeichert ist.
 *  @param {import('@playwright/test').Page} page */
async function neuLaden(page) {
    await page.reload();
    await waitForAppReady(page);
}

/**
 * Die Zusage von R1 NACH dem 💾: die Titelliste in D und im Speicher, und
 * Drachenjagd feldgleich — in den Kernfaellen auch nach dem Neuladen.
 * @param {import('@playwright/test').Page} page
 * @param {string|null} rev Stand vor dem 💾
 * @param {object} drachenjagd Drachenjagd in D vor dem Bearbeiten
 * @param {string} weg
 * @param {boolean} mitNeuladen
 */
async function neuAngelegtUndFeldgleich(page, rev, drachenjagd, weg, mitNeuladen) {
    const titel = ['Drachenjagd', 'Botengang', 'Neue Quest'];
    weich(await titelInD(page), `${weg}: D — Drachenjagd bleibt, "Neue Quest" kommt dazu`).toEqual(
        titel
    );
    weich(await questInD(page, 1), `${weg}: Drachenjagd in D feldgleich`).toEqual(drachenjagd);
    await geschriebenSeit(page, rev, weg);
    weich(await titelImSpeicher(page), `${weg}: localStorage`).toEqual(titel);
    weich(await questImSpeicher(page, 1), `${weg}: Drachenjagd im Speicher feldgleich`).toEqual(
        drachenjagd
    );
    if (mitNeuladen) {
        await neuLaden(page);
        weich(await titelInD(page), `${weg}: D nach dem Neuladen`).toEqual(titel);
        weich(await questInD(page, 1), `${weg}: Drachenjagd nach dem Neuladen`).toEqual(
            drachenjagd
        );
    }
}

// ===========================================================================
// (1) R1: ✏️ → ✕ → "+ QUEST" LEGT NEU AN
// ===========================================================================
test('(1) R1: nach ✏️ und ✕ legt "+ Quest" eine NEUE Quest an — D, Speicher, Neuladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);
    const drachenjagd = await questInD(page, 1);
    expect(drachenjagd?.title, 'Vorbedingung: die Saat ist in D').toBe('Drachenjagd');

    await bearbeiten(page, 1);
    expect((await formular(page)).id, 'Vorbedingung: ✏️ hat Drachenjagd geoeffnet').toBe('1');
    await kreuz(page);

    await plusQuest(page).click();
    await angelegtOffen(page);
    // WEICH: ein roter Lauf soll danach auch das Ueberschreiben nennen.
    weich(
        await formular(page),
        '"+ Quest" nach ✏️ → ✕ muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#quest-title').fill('Neue Quest');
    const rev = await revStand(page);
    await speichern(page);

    await neuAngelegtUndFeldgleich(page, rev, drachenjagd, '"+ Quest"', true);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) R1: ✏️ → ESCAPE → TASTE n LEGT NEU AN
// ===========================================================================
//
// Kein Wegnehmen des Fokus vor der Taste: nach Escape liegt er auf ✏️
// (ModalFocus gibt ihn dem Oeffner zurueck), und genau dort drueckt ein
// Nutzer n — gemessen wirkt die Taste dort (isTyping sperrt nur Eingabefelder).
test('(2) R1: nach ✏️ und Escape legt die Taste n eine NEUE Quest an', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);
    const drachenjagd = await questInD(page, 1);

    await bearbeiten(page, 1);
    await escape(page);

    await page.keyboard.press('n');
    await angelegtOffen(page);
    weich(await formular(page), 'Taste n nach ✏️ → Escape').toEqual(LEER);
    await page.locator('#quest-title').fill('Neue Quest');
    const rev = await revStand(page);
    await speichern(page);

    await neuAngelegtUndFeldgleich(page, rev, drachenjagd, 'Taste n', false);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) R1: ✏️ UEBER DIE SUCHE → ✕ → BEFEHLSPALETTE "NEUE QUEST" LEGT NEU AN
// ===========================================================================
//
// Mit dem zweiten Bearbeiten-Weg: die globale Suche oeffnet dasselbe Formular
// ueber editQuest() und hinterlaesst denselben Rest.
test('(3) R1: nach ✏️ aus der Suche und ✕ legt die Befehlspalette "Neue Quest" eine NEUE Quest an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);
    const drachenjagd = await questInD(page, 1);

    await bearbeitenUeberSuche(page, 'Drachen', 1);
    expect((await formular(page)).id, 'Vorbedingung: die Suche hat Drachenjagd geoeffnet').toBe(
        '1'
    );
    await kreuz(page);

    await paletteNeueQuest(page);
    await angelegtOffen(page);
    weich(await formular(page), 'Befehlspalette nach Suche-✏️ → ✕').toEqual(LEER);
    await page.locator('#quest-title').fill('Neue Quest');
    const rev = await revStand(page);
    await speichern(page);

    await neuAngelegtUndFeldgleich(page, rev, drachenjagd, 'Befehlspalette', false);
    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) R1/R4: ✏️ → ESCAPE → 🗑️ → "➕ QUEST ERSTELLEN" DER LEEREN LISTE SPEICHERT
// ===========================================================================
//
// Der Knopf der LEEREN Liste ist der Weg, auf den man nach dem Loeschen der
// letzten Quest gestossen wird — oft, nachdem man sie sich in ✏️ angesehen
// hat. Er erscheint nur ungefiltert: "Aktive" ist ab Werk angehakt, und dann
// steht "Keine Einträge gefunden" OHNE Knopf da (gemessen). Vor dem Fix trug
// das Formular die ID der geloeschten Quest; 💾 speicherte NICHTS, ohne
// Meldung, mit einem leeren Undo-Eintrag "Quest bearbeitet".
test('(4) R1/R4: nach ✏️, Escape und 🗑️ legt "➕ Quest erstellen" der leeren Liste an, ein Entwurf dort bleibt (R2)', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await questsLaden(page, [DRACHENJAGD]);

    await bearbeiten(page, 1);
    await escape(page);
    const revLoeschen = await revStand(page);
    await page.locator('#quest-1 [data-action="delete-quest"]').click();
    await expect(page.locator('#quest-1')).toHaveCount(0);
    // Das Schreiben des Loeschens abwarten, damit es nicht als das des 💾 gilt.
    await geschriebenSeit(page, revLoeschen, '🗑️');
    // Ungefiltert anzeigen — der Knopf der leeren Liste erscheint nur dann.
    await page.locator('#quest-filter-active').click();
    await expect(page.locator('#quest-filter-active')).not.toBeChecked();

    await leereListeKnopf(page).click();
    await angelegtOffen(page);
    weich(await formular(page), '"➕ Quest erstellen" nach dem Loeschen').toEqual(LEER);
    await page.locator('#quest-title').fill('Neue Quest');

    // R2 AUF DIESEM WEG (Waechter-Teil, heute gruen): der eben begonnene
    // Entwurf hat keinen Bearbeiten-Rest — Escape und derselbe Knopf duerfen
    // ihn nicht verwerfen. Der Waechter (8) erreicht diesen Knopf nicht, dort
    // ist die Liste nie leer. Gegengeprueft mit einem nachgestellten Fix, der
    // den Knopf der leeren Liste IMMER leeren laesst und die drei anderen
    // Wege richtig macht: ohne diesen Schritt blieben alle zehn Faelle gruen.
    const entwurf = await formular(page);
    await escape(page);
    await expect(leereListeKnopf(page), 'Vorbedingung: die Liste ist noch leer').toBeVisible();
    await leereListeKnopf(page).click();
    await angelegtOffen(page);
    weich(await formular(page), 'R2: der Entwurf ueberlebt Escape → "➕ Quest erstellen"').toEqual(
        entwurf
    );

    const rev = await revStand(page);
    const stand = await meldungsStand(page);
    await speichern(page);

    weich(await titelInD(page), 'D: die neue Quest ist gespeichert').toEqual(['Neue Quest']);
    await geschriebenSeit(page, rev, '💾');
    weich(await titelImSpeicher(page), 'localStorage').toEqual(['Neue Quest']);
    weich(
        (await meldungenSeit(page, stand)).filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert" fuer ein Bearbeiten, das es nicht gab'
    ).toEqual([]);
    weich(await undoKopf(page), 'kein leerer Rueckgaengig-Eintrag "Quest bearbeitet"').toBe(
        'Quest erstellt'
    );
    await neuLaden(page);
    weich(await titelInD(page), 'D nach dem Neuladen').toEqual(['Neue Quest']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) R4: VERSCHWINDET DIE QUEST UNTER DEM OFFENEN FORMULAR (Strg+Z IM FELD),
//     GEHT DIE EINGABE NICHT VERLOREN
// ===========================================================================
//
// Strg+Z wirkt auch mit dem Fokus im Formularfeld und nimmt hier das Anlegen
// von "Neu A" zurueck, waehrend ✏️ sie offen hat. Das Formular haelt die
// Eingabe, die ID zeigt ins Leere. Vor dem Fix: nichts gespeichert, keine
// Meldung, leerer Undo-Eintrag "Quest bearbeitet" — und weil der Eintrag den
// Wiederholen-Stapel leert, holt auch Strg+Y "Neu A" nicht mehr zurueck.
test('(5) R4: ✏️ einer Quest, die Strg+Z im Feld zuruecknimmt — 💾 speichert sie neu und warnt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);

    await plusQuest(page).click();
    await angelegtOffen(page);
    await page.locator('#quest-title').fill('Neu A');
    const revA = await revStand(page);
    await speichern(page);
    // Erst das entprellte Schreiben abwarten — sonst koennte es NACH dem
    // Strg+Z unten landen und dessen Messung verfaelschen.
    await geschriebenSeit(page, revA, '"Neu A" anlegen');
    const neuA = await page.evaluate(
        () => window.D.quests.find(q => q.title === 'Neu A')?.id ?? null
    );
    expect(neuA, 'Vorbedingung: "Neu A" ist angelegt').not.toBeNull();

    await bearbeiten(page, /** @type {number} */ (neuA));
    await page.locator('#quest-reward-other').click();
    await page.keyboard.type('Ehre');
    const revUndo = await revStand(page);
    await page.keyboard.press('Control+z');
    await expect
        .poll(() => titelInD(page), { message: 'Vorbedingung: Strg+Z nimmt "Neu A" in D zurueck' })
        .toEqual(['Drachenjagd', 'Botengang']);
    await expect(page.locator('#quest-modal')).toHaveClass(/\bshow\b/);
    // Auch das Rueckgaengig schreibt — abwarten, damit es nicht als das
    // Schreiben des 💾 gilt.
    await geschriebenSeit(page, revUndo, 'Strg+Z');

    const rev = await revStand(page);
    const stand = await meldungsStand(page);
    await speichern(page);

    const erwartet = {
        title: 'Neu A',
        giverId: null,
        locationId: null,
        targetId: null,
        rewardGold: 0,
        rewardOther: 'Ehre'
    };
    weich(await titelInD(page), 'D: die Eingabe ist als neue Quest gespeichert').toEqual([
        'Drachenjagd',
        'Botengang',
        'Neu A'
    ]);
    weich(await questNachTitel(page, 'Neu A'), 'D: "Neu A" traegt die Eingabe').toEqual(erwartet);
    await geschriebenSeit(page, rev, '💾');
    weich(await questNachTitel(page, 'Neu A', true), 'localStorage: "Neu A"').toEqual(erwartet);

    const meldungen = await meldungenSeit(page, stand);
    weich(
        meldungen.filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert" fuer ein Speichern, das nicht stattfand'
    ).toEqual([]);
    weich(
        meldungen.some(
            m => m.startsWith('warning: ') && /existiert nicht mehr/.test(m) && /neue Quest/.test(m)
        ),
        `die Warnung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(await undoKopf(page), 'kein leerer Eintrag "Quest bearbeitet"').toBe('Quest erstellt');

    await neuLaden(page);
    weich(await questNachTitel(page, 'Neu A'), 'D nach dem Neuladen').toEqual(erwartet);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) R6: ✏️ B NACH ABGEBROCHENEM ✏️ A ERBT KEINE AUSWAHL
// ===========================================================================
test('(6) R6: ✏️ Botengang nach ✏️ Drachenjagd und ✕ — Geber, Ort, Ziel bleiben leer', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);

    await bearbeiten(page, 1);
    await kreuz(page);
    await bearbeiten(page, 2);
    const f = await formular(page);
    weich(
        { id: f.id, titel: f.titel, geber: f.geber, ort: f.ort, ziel: f.ziel },
        'Formular von Botengang: keine Auswahl von Drachenjagd'
    ).toEqual({ id: '2', titel: 'Botengang', geber: '', ort: '', ziel: '' });

    const rev = await revStand(page);
    await speichern(page);
    const leer = {
        title: 'Botengang',
        giverId: null,
        locationId: null,
        targetId: null,
        rewardGold: 0,
        rewardOther: ''
    };
    weich(await questNachTitel(page, 'Botengang'), 'D: Botengang ohne fremde Auswahl').toEqual(
        leer
    );
    await geschriebenSeit(page, rev, '💾');
    weich(await questNachTitel(page, 'Botengang', true), 'localStorage: Botengang').toEqual(leer);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) R6: ✏️ B NACH EINEM ANLEGE-ENTWURF MIT AUSWAHL ERBT SIE NICHT
// ===========================================================================
//
// Auch ein Anlege-ENTWURF vererbt heute seine Auswahl (gemessen: Geber 2,
// Ort 3 landeten in Botengang). Der Entwurf selbst darf bleiben (R2) — er
// darf nur nicht in eine andere Quest wandern.
test('(7) R6: ✏️ Botengang nach einem Entwurf mit Geber, Ort und Ziel — B bleibt leer', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);

    await plusQuest(page).click();
    await angelegtOffen(page);
    await page.locator('#quest-title').fill('Entwurf');
    await page.locator('#quest-giver').selectOption('2');
    await page.locator('#quest-location').selectOption('3');
    await page.locator('#quest-target').selectOption('1');
    await escape(page);

    await bearbeiten(page, 2);
    const f = await formular(page);
    weich(
        { id: f.id, titel: f.titel, geber: f.geber, ort: f.ort, ziel: f.ziel },
        'Formular von Botengang: keine Auswahl aus dem Entwurf'
    ).toEqual({ id: '2', titel: 'Botengang', geber: '', ort: '', ziel: '' });

    const rev = await revStand(page);
    await speichern(page);
    const leer = {
        title: 'Botengang',
        giverId: null,
        locationId: null,
        targetId: null,
        rewardGold: 0,
        rewardOther: ''
    };
    weich(
        await questNachTitel(page, 'Botengang'),
        'D: Botengang ohne Auswahl des Entwurfs'
    ).toEqual(leer);
    await geschriebenSeit(page, rev, '💾');
    weich(await questNachTitel(page, 'Botengang', true), 'localStorage: Botengang').toEqual(leer);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) WAECHTER R2: EIN ANLEGE-ENTWURF UEBERLEBT ABBRECHEN UND JEDEN ANLEGE-WEG
// ===========================================================================
//
// Der neue Anlege-Weg darf nur leeren, wenn ein Bearbeiten Reste hinterliess.
// Ein echter Entwurf bleibt stehen, wie heute — gemessen in allen drei
// Kombinationen (Escape → "+ Quest", ✕ → Taste n, Escape → Befehlspalette),
// samt Auswahl und Beschreibung, und 💾 legt ihn an.
test('(8) R2 (Waechter): ein Anlege-Entwurf ueberlebt Escape/✕ und "+ Quest", Taste n, Befehlspalette', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);
    const drachenjagd = await questInD(page, 1);

    await plusQuest(page).click();
    await angelegtOffen(page);
    await page.locator('#quest-title').fill('Entwurf');
    await page.locator('#quest-giver').selectOption('2');
    await page.locator('#quest-location').selectOption('3');
    await page.locator('#quest-reward-gold').fill('50');
    await page.locator('#quest-desc').click();
    await page.keyboard.type('Notiz zum Entwurf');
    const entwurf = await formular(page);
    expect(
        { id: entwurf.id, titel: entwurf.titel, geber: entwurf.geber, ort: entwurf.ort },
        'Vorbedingung: der Entwurf steht im Formular'
    ).toEqual({ id: '', titel: 'Entwurf', geber: '2', ort: '3' });

    await escape(page);
    await plusQuest(page).click();
    await angelegtOffen(page);
    weich(await formular(page), 'Entwurf nach Escape → "+ Quest"').toEqual(entwurf);

    await kreuz(page);
    await page.keyboard.press('n');
    await angelegtOffen(page);
    weich(await formular(page), 'Entwurf nach ✕ → Taste n').toEqual(entwurf);

    await escape(page);
    await paletteNeueQuest(page);
    await angelegtOffen(page);
    weich(await formular(page), 'Entwurf nach Escape → Befehlspalette').toEqual(entwurf);

    const rev = await revStand(page);
    await speichern(page);
    const erwartet = {
        title: 'Entwurf',
        giverId: 2,
        locationId: 3,
        targetId: null,
        rewardGold: 50,
        rewardOther: ''
    };
    weich(await titelInD(page), 'D: der Entwurf ist neu angelegt').toEqual([
        'Drachenjagd',
        'Botengang',
        'Entwurf'
    ]);
    weich(await questNachTitel(page, 'Entwurf'), 'D: der Entwurf samt Auswahl').toEqual(erwartet);
    weich(await questInD(page, 1), 'Drachenjagd unberuehrt').toEqual(drachenjagd);
    await geschriebenSeit(page, rev, '💾');
    weich(await questNachTitel(page, 'Entwurf', true), 'localStorage: der Entwurf').toEqual(
        erwartet
    );

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) WAECHTER R3: TASTE n UND BEFEHLSPALETTE BEI OFFENEM ✏️ VERWERFEN NICHTS
// ===========================================================================
//
// Heute harmlos, weil kein Anlege-Weg leert (V7 im Gruppenbericht). Ein Fix,
// der beim Anlegen leert, sobald #edit-quest-id gesetzt ist, wuerde genau
// diese laufende Bearbeitung ohne Rueckfrage wegwerfen (NPC-Fall 19). Der Fokus
// liegt nach einem Klick auf eine Feldbeschriftung auf BODY — dort erreicht
// die Taste n den Anlege-Zweig.
test('(9) R3 (Waechter): Taste n und Befehlspalette bei offenem ✏️ — das Formular bleibt, wie es ist', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);

    await bearbeiten(page, 1);
    await page.locator('#quest-title').fill('Drachenjagd geaendert');
    await page.locator('#quest-location').selectOption('3');
    const vorher = await formular(page);
    expect(
        { id: vorher.id, geber: vorher.geber, ort: vorher.ort, ziel: vorher.ziel },
        'Vorbedingung: das Bearbeiten-Formular mit Auswahl'
    ).toEqual({ id: '1', geber: '1', ort: '3', ziel: '2' });

    await page.locator('#quest-modal').getByText('Titel', { exact: true }).click();
    expect(
        await page.evaluate(() => document.activeElement?.tagName),
        'Vorbedingung: nach dem Klick auf die Beschriftung liegt der Fokus auf BODY'
    ).toBe('BODY');
    await page.keyboard.press('n');
    await zeitgeberAbwarten(page);
    weich(await formular(page), 'Taste n bei offenem ✏️').toEqual(vorher);

    await paletteNeueQuest(page);
    await zeitgeberAbwarten(page);
    weich(await formular(page), 'Befehlspalette "Neue Quest" bei offenem ✏️').toEqual(vorher);

    // Ohne die ID gaebe es nichts mehr zu speichern — dann ist der Rest
    // bedeutungslos, und die weichen Zusagen oben nennen den Grund.
    expect((await formular(page)).id, 'die Bearbeitung muss noch offen sein').toBe('1');
    const rev = await revStand(page);
    await speichern(page);
    const erwartet = {
        title: 'Drachenjagd geaendert',
        giverId: 1,
        locationId: 3,
        targetId: 2,
        rewardGold: 500,
        rewardOther: 'Ruhm'
    };
    weich(await titelInD(page), 'D: keine neue Quest').toEqual([
        'Drachenjagd geaendert',
        'Botengang'
    ]);
    weich(
        await questNachTitel(page, 'Drachenjagd geaendert'),
        'D: die Eingaben sind gespeichert'
    ).toEqual(erwartet);
    await geschriebenSeit(page, rev, '💾');
    weich(
        await questNachTitel(page, 'Drachenjagd geaendert', true),
        'localStorage: die Eingaben'
    ).toEqual(erwartet);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (10) KONTROLLE: ✏️ → 💾 → "+ QUEST" IST SCHON HEUTE LEER
// ===========================================================================
//
// Der Speicherweg leert (`saveQuest()` ruft `clearQuestForm()`), nur
// Abbrechen nicht. Dieser Fall haelt fest, dass LEER dem Formular entspricht,
// das ein Anlegen nach einem GESPEICHERTEN Bearbeiten zeigt — die
// Zusage der Faelle (1)–(4) verlangt also nichts, was es nicht schon gibt.
test('(10) R1 (Kontrolle): nach ✏️ und 💾 legt "+ Quest" eine neue Quest an', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await questsLaden(page, [DRACHENJAGD, BOTENGANG]);

    await bearbeiten(page, 1);
    const revErst = await revStand(page);
    await speichern(page);
    // Erst das entprellte Schreiben dieses 💾 abwarten — sonst gilt es unten
    // als das Schreiben des ZWEITEN 💾, und der Speicher wird zu frueh gelesen
    // (im ersten Lauf so geschehen: "Neue Quest" fehlte im Speicher).
    await geschriebenSeit(page, revErst, '✏️ → 💾');

    await plusQuest(page).click();
    await angelegtOffen(page);
    weich(await formular(page), '"+ Quest" nach ✏️ → 💾').toEqual(LEER);
    await page.locator('#quest-title').fill('Neue Quest');
    const rev = await revStand(page);
    await speichern(page);

    weich(await titelInD(page), 'D').toEqual(['Drachenjagd', 'Botengang', 'Neue Quest']);
    await geschriebenSeit(page, rev, '💾');
    weich(await titelImSpeicher(page), 'localStorage').toEqual([
        'Drachenjagd',
        'Botengang',
        'Neue Quest'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
