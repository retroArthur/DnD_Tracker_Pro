// @ts-check
/**
 * Anlegen nach abgebrochenem Bearbeiten: das Orte-Formular (ABBRUCH, ORT)
 * =======================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer einen Ort mit ✏️
 * oeffnet, ohne zu speichern schliesst und dann einen Ort anlegt, legt einen
 * NEUEN Ort an** — ueber jeden Anlege-Weg ("+ Neuer Ort", den Knopf der leeren
 * Liste, die Befehlspalette "Neuer Ort"), und der zuvor bearbeitete Ort bleibt
 * feldgleich, in D, im Speicher und nach dem Neuladen. Und: eine Eingabe, deren
 * Ort unter dem offenen Formular verschwunden ist, geht beim Speichern nicht
 * still verloren.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d (Branch abbrechen-neu), 1440x900, echte
 * Klicks und Tasten; Saat wie unten (Tiefwasser mit Filter, Beschreibung,
 * Tags, Links und einem Feld, das kein Formular kennt, dazu Niewinter). So
 * war es VOR dem Fix:
 *
 *   ✏️ Tiefwasser → ✕ bzw.        das Formular trug Tiefwasser samt
 *   Escape → "+ Neuer Ort" bzw.    #edit-loc-id 1; "Baldurs Tor" → 💾
 *   Palette "Neuer Ort"            UEBERSCHRIEB Tiefwasser (Filter,
 *                                  Beschreibung, Tags blieben haengen), kein
 *                                  neuer Ort — in D, im Speicher, nach dem
 *                                  Neuladen; keine Meldung, Undo-Kopf
 *                                  "Ort bearbeitet"
 *   ✏️ → ✕/Escape → 🗑️ →           das Formular trug die ID des geloeschten
 *   "+ Ort erstellen" (leere       Orts; 💾 speicherte NICHTS, D blieb leer —
 *   Liste), ebenso "+ Neuer Ort"   ohne jede Meldung, der Rueckgaengig-Stapel
 *   und Palette                    bekam einen leeren "Ort bearbeitet"
 *   "+ Neuer Ort" → "Neu A" → 💾   Strg+Z nahm "Ort erstellt" zurueck, das
 *   → ✏️ → Eingaben → Strg+Z mit   Formular blieb offen mit ID 5; 💾 →
 *   dem Fokus im Namen → 💾        Eingabe STILL VERLOREN, leerer Undo-Eintrag
 *
 * DIE URSACHEN (Stand e5bc99d; Fundstellen nach dem Fix nennt der Katalog,
 * `docs/bugfixes.md`, Eintrag ABBRUCH):
 * - Kein Anlege-Weg leerte das Formular. "+ Neuer Ort"
 *   (`assets/templates/view-content.html`), "+ Ort erstellen" der leeren Liste
 *   (`features/locations/locations-render.js`) und "Neuer Ort" der Palette
 *   (`features/command-palette/action-registry.js`) riefen alle
 *   `showModal('location-modal')` (`systems/spellslots/navigation.js`), das
 *   nur `show` setzt und die Auswahllisten baut.
 * - Kein Schliessweg leert. ✕ (`ui/actions/ui-actions.js`) und Escape
 *   (`systems/spellslots/keyboard-shortcuts.js`) gehen durch `hideModal()`;
 *   `clearLocationForm()` (`features/locations/locations-crud.js`) lief nur
 *   nach erfolgreichem Speichern.
 * - `editLocation()` schreibt die ID in das versteckte `#edit-loc-id`;
 *   `saveLocation()` liest sie als Weiche zwischen Bearbeiten und Anlegen.
 * - `saveLocation()` rief `pushUndo('Ort bearbeitet')` VOR der Suche; fand es
 *   die ID nicht, tat es nichts, es gab keinen Else-Zweig — und danach liefen
 *   Schliessen, Leeren und `save()` trotzdem.
 * - Strg+Z wirkt auch mit dem Fokus in einem Feld (`keyboard-shortcuts.js`,
 *   "immer aktiv", vor der isTyping-Schranke) und nimmt den Ort unter dem
 *   offenen Formular weg.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag ABBRUCH, docs/bugfixes.md), die diese Datei haelt
 *
 *   R1  Nach ✏️ → Abbrechen zeigt JEDER Anlege-Weg ein Formular ohne
 *       Bearbeiten-ID und ohne Werte des bearbeiteten Orts; 💾 legt einen
 *       NEUEN Ort an, der bearbeitete bleibt feldgleich.         Faelle (1)-(3)
 *   R4  Zeigt die ID beim Speichern ins Leere, wird die Eingabe als NEUER Ort
 *       gespeichert und eine Warnung gezeigt; keine Meldung "… aktualisiert",
 *       kein leerer Undo-Eintrag "Ort bearbeitet".               Faelle (3), (4)
 *   R2  Ein nie gespeicherter Anlege-Entwurf ueberlebt Escape/✕ und den
 *       naechsten Anlege-Weg.                                    Fall (5), Waechter
 *   R3  Die Befehlspalette bei offenem Formular verwirft nichts. Fall (6), Waechter
 *   Kontrolle: ✏️ → 💾 → "+ Neuer Ort" legte schon vor dem Fix neu an. Fall (7)
 *
 * R5-R8 betreffen andere Formulare (Encounter, Notiz, Quest, Timer).
 *
 * BESONDERHEITEN DES ORTE-FORMULARS, gemessen:
 * - Es gibt keinen Abbrechen-Knopf, nur ✕ und Speichern; ein Klick neben die
 *   Schale schliesst nicht. Die Abbruch-Wege sind also ✕ und Escape — (1) und
 *   (3) fahren ✕ bzw. Escape, (2) Escape, (5) beide.
 * - Die Taste n hat in der Orte-Ansicht keinen Zweig (sie wird verschluckt,
 *   oeffnet aber nichts). R3 gibt es darum nur ueber die Palette.
 * - Der Knopf der leeren Liste erscheint nur, wenn es KEINEN Ort gibt — nach
 *   ✏️ heisst das: der bearbeitete Ort wurde geloescht. Fall (3) ist darum
 *   R1 und R4 zugleich.
 *
 * DIE ANLEGE-KNOEPFE werden ueber Rolle und sichtbaren Text gegriffen, nicht
 * ueber `data-action`/`data-value`: der Fix ersetzt `show-modal` +
 * `data-value="location-modal"` durch eine eigene Aktion, der Knopf bleibt
 * derselbe.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Der Titel "Ort hinzufügen" beim Bearbeiten (V6, eigener PR). Die Taste n in
 * der Orte-Ansicht (eine sechste n-Ansicht waere eine eigene Entscheidung,
 * `tastenhilfe.spec.js` (18)). Am Telefon gibt es kein ✏️ und kein 🗑️ (das
 * Detail ist ausgeblendet), also keinen dieser Faelle. Eine filterId, deren
 * Filter geloescht ist, wird bei ✏️ → 💾 still null — eigener kleiner Befund.
 * Kampagnen-Import "Ersetzen" bei stehendem Formular (eigener PR).
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — das Orte-Detail mit ✏️ und 🗑️ steht nur im Schreibtisch-Layout. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** Der Ort, der bearbeitet wird — mit jedem Feld, das das Formular zeigt
 *  (Name, Filter, Beschreibung), und mit Feldern, die es NICHT zeigt: ein
 *  ueberschriebener Ort behielte sie, ein neuer darf sie nicht erben. */
const TIEFWASSER = {
    id: 1,
    name: 'Tiefwasser',
    description: '<p>Große <b>Hafenstadt</b> am Schwertmeer.</p>',
    filterId: 1,
    tags: [{ name: 'Wichtig', color: 'red' }],
    links: [{ type: 'npcs', id: 1 }],
    createdAt: 1700000000000,
    eigenesFeld: { x: 1 }
};
const NIEWINTER = { id: 2, name: 'Niewinter', description: '', filterId: null };

/** @param {object[]} locations */
function seed(locations) {
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
        npcs: [
            {
                id: 1,
                name: 'Volo',
                role: '',
                race: '',
                locationId: 1,
                description: '',
                triggers: [],
                dialogs: [],
                relations: [],
                quests: [],
                info: [],
                relationships: []
            }
        ],
        locations,
        quests: [],
        loot: [],
        spells: [],
        wiki: [],
        links: [],
        filters: [
            { id: 1, name: 'Kapitel 1', color: 'red' },
            { id: 2, name: 'Kapitel 2', color: 'blue' }
        ],
        factions: [],
        tags: [{ name: 'Wichtig', color: 'red' }],
        sessionNotes: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 1,
            npcs: 2,
            locations: Math.max(4, ...locations.map(l => l.id)) + 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 1,
            randomTables: 1,
            filters: 3,
            factions: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App (`EventDelegation` meldet einen
 * geworfenen Handler NUR dort und als `console.error`). "Failed to load
 * resource" ist Netzrauschen (Schriften unter file://).
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
 * Laedt breit, saet EINMAL je Tab und oeffnet die Orte-Ansicht. Die Saat
 * steht hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann,
 * was die App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} locations
 */
async function orteLaden(page, locations) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('ort-anlegen-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('ort-anlegen-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(locations)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst ein Speicher-Fall nichts:
    // repariert `load()` die Saat, schreibt `saveAutomatic()` etwa 1,4 s
    // spaeter den ganzen Stand aus D (siehe npc-formular.spec.js). Erkennbar
    // daran, dass `_version` der Saat ueberschrieben wird; kommt binnen 4 s
    // keine, steht auch keine aus.
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
    // Vorbereitung, nicht die gemessene Handlung: Ansicht wechseln wie im
    // NPC-Waechter.
    await page.evaluate(() => window.switchView('locations'));
    await expect(page.locator('#view-locations')).toBeVisible();
}

/** Neu laden; die Saat-Sperre haelt, gelesen wird der gespeicherte Stand.
 *  @param {import('@playwright/test').Page} page */
async function neuLaden(page) {
    await page.reload();
    await waitForAppReady(page);
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Ein Ort aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function ortInD(page, id) {
    return page.evaluate(
        id => JSON.parse(JSON.stringify(window.D.locations.find(l => l.id === id) ?? null)),
        id
    );
}

/** Ein Ort aus dem Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function ortImSpeicher(page, id) {
    return page.evaluate(
        ([schluessel, id]) => {
            try {
                return (
                    (JSON.parse(localStorage.getItem(schluessel) || '{}').locations || []).find(
                        l => l.id === id
                    ) ?? null
                );
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, id]
    );
}

/** Alle Ortsnamen, in D bzw. im Speicher. Ohne ID: welche ID ein neuer Ort
 *  bekommt, entscheidet nextId(), nicht dieser Waechter.
 *  @param {import('@playwright/test').Page} page */
function namenInD(page) {
    return page.evaluate(() => window.D.locations.map(l => l.name));
}
/** @param {import('@playwright/test').Page} page */
function namenImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return (JSON.parse(localStorage.getItem(schluessel) || '{}').locations || []).map(
                l => l.name
            );
        } catch {
            return ['(nicht lesbar)'];
        }
    }, SPEICHER);
}

/** Die sichtbaren Felder eines Orts aus D, nach Namen gesucht — fuer den
 *  NEUEN Ort, dessen ID nextId() vergibt. `geerbt` nennt die unsichtbaren
 *  Felder, deren WERT von Tiefwasser stammt: die Regel verbietet Werte des
 *  bearbeiteten Orts, nicht die Schluessel. Ein Fix, der neuen Orten ein
 *  eigenes `createdAt` oder leere `tags`/`links` gibt, bleibt gruen
 *  (Skeptiker-Gegenprobe: mit der Schluessel-Pruefung wurden (1), (2), (3)
 *  und der Waechter (5) dabei grundlos rot).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function neuerOrt(page, name) {
    const alt = {
        tags: TIEFWASSER.tags,
        links: TIEFWASSER.links,
        createdAt: TIEFWASSER.createdAt,
        eigenesFeld: TIEFWASSER.eigenesFeld
    };
    return page.evaluate(([name, alt]) => {
        const l = window.D.locations.find(x => x.name === name);
        return l
            ? {
                  name: l.name,
                  filterId: l.filterId ?? null,
                  beschreibung: (l.description || '').replace(/<[^>]*>/g, '').trim(),
                  geerbt: Object.keys(alt).filter(
                      k => k in l && JSON.stringify(l[k]) === JSON.stringify(alt[k])
                  )
              }
            : null;
    }, /** @type {[string, Record<string, unknown>]} */ ([name, alt]));
}

/** Die ID des Orts mit diesem Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function idVon(page, name) {
    return page.evaluate(name => window.D.locations.find(l => l.name === name)?.id ?? null, name);
}

/** Die Felder des Formulars. Die Beschreibung als Text: welches leere Markup
 *  ein Leeren hinterlaesst ('' oder '<br>'), ist nicht die Aussage.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        return {
            offen: document.getElementById('location-modal')?.classList.contains('show'),
            id: wert('edit-loc-id'),
            name: wert('loc-name'),
            filter: wert('loc-filter'),
            beschreibung: document.getElementById('loc-desc')?.textContent?.trim()
        };
    });
}

/** Das leere Formular im Anlege-Zustand. */
const LEER = { offen: true, id: '', name: '', filter: '', beschreibung: '' };

/** "+ Neuer Ort" in der Werkzeugleiste — ueber Rolle und Namen.
 *  @param {import('@playwright/test').Page} page */
function plusOrt(page) {
    return page
        .locator('#view-locations')
        .getByRole('button', { name: '+ Neuer Ort', exact: true });
}

/** "+ Ort erstellen" der leeren Liste — ueber Rolle und Namen.
 *  @param {import('@playwright/test').Page} page */
function leerKnopf(page) {
    return page.locator('#locations-list').getByRole('button', { name: '+ Ort erstellen' });
}

/** Befehlspalette → "Neuer Ort" → Enter.
 *  @param {import('@playwright/test').Page} page */
async function paletteNeuerOrt(page) {
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    // Erst tippen, wenn das Suchfeld den Fokus hat (npc-formular.spec.js (5)).
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type('Neuer Ort');
    // Enter fuehrt den OBERSTEN Treffer aus, die Suche ist um 80 ms entprellt.
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText('Neuer Ort');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
}

/** Liste → Eintrag → ✏️ im Detail.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    await page.locator(`#locations-list .loc-item[data-id="${id}"]`).click();
    await page.locator('#loc-detail-panel [data-action="edit-location"]').click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
}

/** Schliessen ohne Speichern — die beiden Abbruch-Wege des Formulars.
 *  @param {import('@playwright/test').Page} page
 *  @param {'kreuz'|'escape'} weg */
async function abbrechen(page, weg) {
    if (weg === 'kreuz') {
        await page.locator('#location-modal .modal-header [data-action="hide-modal"]').click();
    } else {
        await page.keyboard.press('Escape');
    }
    await expect(page.locator('#location-modal')).not.toHaveClass(/\bshow\b/);
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu, auch wenn der Inhalt gleich bleibt. Ohne ihn waere "der Speicher
 *  traegt den alten Stand" nicht von "es wurde gar nicht geschrieben" zu
 *  unterscheiden.
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

/** 💾 im Formular; wartet, bis die Schale zu ist UND das entprellte
 *  `save()` geschrieben hat — erst dann sagt der Speicher etwas.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} was */
async function speichern(page, was) {
    const rev = await revStand(page);
    await page
        .locator('#location-modal')
        .getByRole('button', { name: 'Speichern', exact: true })
        .click();
    await expect(page.locator('#location-modal')).not.toHaveClass(/\bshow\b/);
    await geschriebenSeit(page, rev, was);
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

/** Der oberste Eintrag des Rueckgaengig-Stapels.
 *  @param {import('@playwright/test').Page} page */
function undoKopf(page) {
    return page.evaluate(() => (undoStack.length ? undoStack[undoStack.length - 1].action : null));
}

/**
 * Die gemeinsame Pruefung von R1 nach dem 💾: Tiefwasser feldgleich, ein
 * NEUER Ort "Baldurs Tor" ohne geerbte Werte — in D, im Speicher, nach dem
 * Neuladen.
 * @param {import('@playwright/test').Page} page
 * @param {object} tiefwasser der Stand vor dem ✏️
 * @param {string} weg fuer die Meldung
 */
async function neuAngelegtUndTiefwasserGleich(page, tiefwasser, weg) {
    weich(await namenInD(page), `${weg}: D — Tiefwasser bleibt, Baldurs Tor kommt dazu`).toEqual([
        'Tiefwasser',
        'Niewinter',
        'Baldurs Tor'
    ]);
    weich(await ortInD(page, 1), `${weg}: Tiefwasser in D darf nicht ueberschrieben sein`).toEqual(
        tiefwasser
    );
    weich(
        await neuerOrt(page, 'Baldurs Tor'),
        `${weg}: der neue Ort erbt keinen Wert von Tiefwasser`
    ).toEqual({ name: 'Baldurs Tor', filterId: null, beschreibung: '', geerbt: [] });
    weich(await namenImSpeicher(page), `${weg}: localStorage`).toEqual([
        'Tiefwasser',
        'Niewinter',
        'Baldurs Tor'
    ]);
    weich(await ortImSpeicher(page, 1), `${weg}: Tiefwasser im localStorage`).toEqual(tiefwasser);

    await neuLaden(page);
    weich(await namenInD(page), `${weg}: D nach dem Neuladen`).toEqual([
        'Tiefwasser',
        'Niewinter',
        'Baldurs Tor'
    ]);
    weich(await ortInD(page, 1), `${weg}: Tiefwasser nach dem Neuladen`).toEqual(tiefwasser);
}

// ===========================================================================
// (1) R1: ✏️ → ✕ → "+ NEUER ORT" LEGT NEU AN
// ===========================================================================
test('(1) R1: nach ✏️ und ✕ legt "+ Neuer Ort" einen NEUEN Ort an, Tiefwasser bleibt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await orteLaden(page, [TIEFWASSER, NIEWINTER]);
    const tiefwasser = await ortInD(page, 1);
    expect(tiefwasser, 'die Saat muss so in D ankommen, sonst misst der Fall die Saat').toEqual(
        TIEFWASSER
    );

    await bearbeiten(page, 1);
    await abbrechen(page, 'kreuz');

    await plusOrt(page).click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    // WEICH: ein roter Lauf soll danach auch das Ueberschreiben nennen.
    weich(
        await formular(page),
        '"+ Neuer Ort" nach ✏️ → ✕ muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#loc-name').fill('Baldurs Tor');
    await speichern(page, '"+ Neuer Ort" → 💾');

    await neuAngelegtUndTiefwasserGleich(page, tiefwasser, '"+ Neuer Ort"');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) R1: ✏️ → ESCAPE → BEFEHLSPALETTE "NEUER ORT" LEGT NEU AN
// ===========================================================================
test('(2) R1: nach ✏️ und Escape legt die Befehlspalette "Neuer Ort" einen NEUEN Ort an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await orteLaden(page, [TIEFWASSER, NIEWINTER]);
    const tiefwasser = await ortInD(page, 1);
    expect(tiefwasser, 'Saat').toEqual(TIEFWASSER);

    await bearbeiten(page, 1);
    await abbrechen(page, 'escape');

    await paletteNeuerOrt(page);
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    weich(
        await formular(page),
        'Befehlspalette "Neuer Ort" nach ✏️ → Escape muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#loc-name').fill('Baldurs Tor');
    await speichern(page, 'Palette → 💾');

    await neuAngelegtUndTiefwasserGleich(page, tiefwasser, 'Befehlspalette');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) R1 + R4: ✏️ → ESCAPE → 🗑️ → "+ ORT ERSTELLEN" DER LEEREN LISTE
// ===========================================================================
//
// Der Knopf der leeren Liste ist der Weg, auf den man nach dem Loeschen des
// letzten Orts gestossen wird — oft nachdem man ihn sich in ✏️ angesehen
// hat. Vor dem Fix trug das Formular die ID des geloeschten Orts,
// saveLocation() fand sie nicht und speicherte NICHTS, ohne Meldung, mit
// einem leeren Rueckgaengig-Eintrag "Ort bearbeitet". Der Fall prueft das
// Formular (R1) UND das Speichern (R4): auch ein Fix, der nur die verwaiste
// ID beim Speichern abfaengt, muss die Eingabe als neuen Ort ablegen.
test('(3) R1/R4: nach ✏️, Escape und 🗑️ legt "+ Ort erstellen" der leeren Liste einen Ort an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await orteLaden(page, [TIEFWASSER]);

    await bearbeiten(page, 1);
    await abbrechen(page, 'escape');
    const revVorLoeschen = await revStand(page);
    await page.locator('#loc-detail-panel [data-action="delete-location"]').click();
    await expect.poll(() => namenInD(page)).toEqual([]);
    await geschriebenSeit(page, revVorLoeschen, '🗑️');
    await expect(leerKnopf(page)).toBeVisible();

    await leerKnopf(page).click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    weich(
        await formular(page),
        '"+ Ort erstellen" nach ✏️ → Escape → 🗑️ muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#loc-name').fill('Baldurs Tor');
    const stand = await meldungsStand(page);
    await speichern(page, '"+ Ort erstellen" → 💾');

    weich(await namenInD(page), 'D: die Eingabe ist als neuer Ort gespeichert').toEqual([
        'Baldurs Tor'
    ]);
    weich(
        await neuerOrt(page, 'Baldurs Tor'),
        'der neue Ort erbt keinen Wert des geloeschten Tiefwasser'
    ).toEqual({ name: 'Baldurs Tor', filterId: null, beschreibung: '', geerbt: [] });
    weich(await namenImSpeicher(page), 'localStorage').toEqual(['Baldurs Tor']);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        meldungen.filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert" fuer ein Speichern, das nichts aktualisierte'
    ).toEqual([]);
    weich(await undoKopf(page), 'kein leerer Rueckgaengig-Eintrag "Ort bearbeitet"').toBe(
        'Ort erstellt'
    );

    await neuLaden(page);
    weich(await namenInD(page), 'D nach dem Neuladen').toEqual(['Baldurs Tor']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) R4: VERSCHWINDET DER ORT UNTER DEM OFFENEN FORMULAR, GEHT DIE EINGABE NICHT VERLOREN
// ===========================================================================
//
// Strg+Z wirkt auch mit dem Fokus im Namensfeld und nimmt hier das Anlegen
// zurueck, waehrend ✏️ denselben Ort offen hat. Das Formular haelt die
// Eingaben, die ID zeigt ins Leere. Vor dem Fix: nichts gespeichert, keine
// Meldung, leerer Undo-Eintrag. Die Regel: als NEUER Ort gespeichert, und
// eine Warnung sagt genau das.
test('(4) R4: ✏️ eines Orts, den Strg+Z im Namensfeld zuruecknimmt: 💾 speichert ihn neu und warnt', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await orteLaden(page, [TIEFWASSER, NIEWINTER]);
    const tiefwasser = await ortInD(page, 1);

    await plusOrt(page).click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    await page.locator('#loc-name').fill('Neu A');
    await speichern(page, 'Neu A anlegen');
    const neuA = await idVon(page, 'Neu A');
    expect(neuA, 'Vorbedingung: "Neu A" muss angelegt sein').not.toBeNull();

    await bearbeiten(page, /** @type {number} */ (neuA));
    await page.locator('#loc-name').click();
    await page.keyboard.press('End');
    await page.keyboard.type(' Nord');
    await page.locator('#loc-desc').click();
    await page.keyboard.type('Wichtige Notiz');
    await page.locator('#loc-name').click();
    const revVorUndo = await revStand(page);
    await page.keyboard.press('Control+z');
    await expect.poll(() => namenInD(page)).toEqual(['Tiefwasser', 'Niewinter']);
    await geschriebenSeit(page, revVorUndo, 'Strg+Z');
    const f = await formular(page);
    expect(
        { offen: f.offen, name: f.name, beschreibung: f.beschreibung },
        'Vorbedingung: das Formular ist nach Strg+Z noch offen und haelt die Eingaben'
    ).toEqual({ offen: true, name: 'Neu A Nord', beschreibung: 'Wichtige Notiz' });

    const stand = await meldungsStand(page);
    await speichern(page, 'verwaiste ID → 💾');

    weich(await namenInD(page), 'D: die Eingabe ist als neuer Ort gespeichert').toEqual([
        'Tiefwasser',
        'Niewinter',
        'Neu A Nord'
    ]);
    weich(
        (await neuerOrt(page, 'Neu A Nord'))?.beschreibung,
        'D: die Beschreibung der Eingabe ist mitgespeichert'
    ).toBe('Wichtige Notiz');
    weich(await ortInD(page, 1), 'Tiefwasser bleibt unberuehrt').toEqual(tiefwasser);
    weich(await namenImSpeicher(page), 'localStorage').toEqual([
        'Tiefwasser',
        'Niewinter',
        'Neu A Nord'
    ]);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        meldungen.filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert" fuer ein Speichern, das nichts aktualisierte'
    ).toEqual([]);
    weich(
        meldungen.some(m => m.startsWith('warning: ') && /neue[rn]? Ort/.test(m)),
        `eine Warnung sagt, dass als neuer Ort gespeichert wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(await undoKopf(page), 'kein leerer Rueckgaengig-Eintrag "Ort bearbeitet"').toBe(
        'Ort erstellt'
    );

    await neuLaden(page);
    weich(await namenInD(page), 'D nach dem Neuladen').toEqual([
        'Tiefwasser',
        'Niewinter',
        'Neu A Nord'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) WAECHTER R2: EIN ANLEGE-ENTWURF UEBERLEBT ABBRECHEN UND JEDEN ANLEGE-WEG
// ===========================================================================
//
// Der Fix darf das Formular NUR leeren, wenn ein Bearbeiten Reste
// hinterliess (#edit-loc-id gesetzt). Ein Entwurf, der nie gespeichert
// wurde, bleibt stehen — wie vor dem Fix und wie bei NPCs (npc-formular.spec.js
// (18)). Leere Saat, damit auch der Knopf der leeren Liste dabei ist: alle
// drei Anlege-Wege, beide Abbruch-Wege. Schon vor dem Fix gruen.
test('(5) R2 (Waechter): ein Anlege-Entwurf ueberlebt Escape/✕ und jeden Anlege-Weg', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await orteLaden(page, []);
    const ENTWURF = {
        offen: true,
        id: '',
        name: 'Entwurf',
        filter: '2',
        beschreibung: 'Halb fertig'
    };

    await leerKnopf(page).click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    await page.locator('#loc-name').fill('Entwurf');
    await page.locator('#loc-filter').selectOption('2');
    await page.locator('#loc-desc').click();
    await page.keyboard.type('Halb fertig');

    await abbrechen(page, 'escape');
    await leerKnopf(page).click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), 'Escape → "+ Ort erstellen": der Entwurf').toEqual(ENTWURF);

    await abbrechen(page, 'kreuz');
    await paletteNeuerOrt(page);
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), '✕ → Befehlspalette: der Entwurf').toEqual(ENTWURF);

    await abbrechen(page, 'escape');
    await plusOrt(page).click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), 'Escape → "+ Neuer Ort": der Entwurf').toEqual(ENTWURF);

    await speichern(page, 'Entwurf → 💾');
    weich(await neuerOrt(page, 'Entwurf'), 'D: der Entwurf ist ein neuer Ort').toEqual({
        name: 'Entwurf',
        filterId: 2,
        beschreibung: 'Halb fertig',
        geerbt: []
    });
    weich(await namenImSpeicher(page), 'localStorage').toEqual(['Entwurf']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) WAECHTER R3: DIE BEFEHLSPALETTE BEI OFFENEM ✏️ VERWIRFT NICHTS
// ===========================================================================
//
// Ein offenes Formular ist kein Rest eines abgebrochenen Bearbeitens,
// sondern die laufende Arbeit. Ein Fix, der beim Anlegen leert, sobald
// #edit-loc-id gesetzt ist, wuerde sie hier wegwischen — gemessen bei NPCs
// (npc-formular.spec.js (19)). Die Palette oeffnet auch mit dem Fokus im
// Namensfeld. Schon vor dem Fix gruen: showModal() leert nichts.
test('(6) R3 (Waechter): Befehlspalette "Neuer Ort" bei offenem ✏️ — das Formular bleibt, wie es ist', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await orteLaden(page, [TIEFWASSER, NIEWINTER]);
    const tiefwasser = await ortInD(page, 1);

    await bearbeiten(page, 1);
    await page.locator('#loc-name').fill('Tiefwasser geaendert');
    await page.locator('#loc-name').click();
    const vorher = await formular(page);
    expect(vorher, 'Vorbedingung: das Bearbeiten-Formular').toEqual({
        offen: true,
        id: '1',
        name: 'Tiefwasser geaendert',
        filter: '1',
        beschreibung: 'Große Hafenstadt am Schwertmeer.'
    });

    await paletteNeuerOrt(page);
    weich(await formular(page), 'Befehlspalette "Neuer Ort" bei offenem ✏️').toEqual(vorher);
    // Hart nachgezogen: klappt die Palette das Formular zu, ist die Aussage
    // oben schon rot — ohne diese Schranke liefe 💾 danach gegen einen
    // unsichtbaren Knopf in den Test-Timeout (Skeptiker-Gegenprobe: 60 s).
    await expect(
        page.locator('#location-modal'),
        'die Palette darf das offene Formular nicht zuklappen'
    ).toHaveClass(/\bshow\b/);

    await speichern(page, '✏️ → Palette → 💾');
    weich(await namenInD(page), 'D: kein neuer Ort, Tiefwasser umbenannt').toEqual([
        'Tiefwasser geaendert',
        'Niewinter'
    ]);
    weich(await ortInD(page, 1), 'D: nur der Name hat sich geaendert').toEqual({
        ...tiefwasser,
        name: 'Tiefwasser geaendert'
    });
    weich(await ortImSpeicher(page, 1), 'localStorage').toEqual({
        ...tiefwasser,
        name: 'Tiefwasser geaendert'
    });

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) KONTROLLE: ✏️ → 💾 → "+ NEUER ORT" LEGTE SCHON VOR DEM FIX NEU AN
// ===========================================================================
//
// Nach einem GESPEICHERTEN Bearbeiten leert saveLocation() das Formular
// (clearLocationForm()). Dieser Weg war nie kaputt und darf es nicht werden.
test('(7) (Kontrolle): nach ✏️ → 💾 legt "+ Neuer Ort" einen neuen Ort an', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await orteLaden(page, [TIEFWASSER, NIEWINTER]);
    const tiefwasser = await ortInD(page, 1);

    await bearbeiten(page, 1);
    await page.locator('#loc-name').fill('Tiefwasser-Neu');
    await speichern(page, '✏️ → 💾');
    const umbenannt = { ...tiefwasser, name: 'Tiefwasser-Neu' };
    weich(await ortInD(page, 1), 'D nach ✏️ → 💾').toEqual(umbenannt);

    await plusOrt(page).click();
    await expect(page.locator('#location-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), '"+ Neuer Ort" nach ✏️ → 💾').toEqual(LEER);
    await page.locator('#loc-name').fill('Baldurs Tor');
    await speichern(page, '"+ Neuer Ort" → 💾');

    weich(await namenInD(page), 'D').toEqual(['Tiefwasser-Neu', 'Niewinter', 'Baldurs Tor']);
    weich(await ortInD(page, 1), 'Tiefwasser-Neu bleibt').toEqual(umbenannt);
    weich(await namenImSpeicher(page), 'localStorage').toEqual([
        'Tiefwasser-Neu',
        'Niewinter',
        'Baldurs Tor'
    ]);
    weich(await ortImSpeicher(page, 1), 'Tiefwasser-Neu im localStorage').toEqual(umbenannt);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
