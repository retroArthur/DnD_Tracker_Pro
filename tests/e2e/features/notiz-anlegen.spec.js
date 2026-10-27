// @ts-check
/**
 * Der Waechter des Notizformulars beim Anlegen (NOTIZ, Vertrag ABBRUCH)
 * =====================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **wer eine Sitzungsnotiz
 * bearbeitet, das Klappformular ueber seinen Kopf zuklappt und es ueber
 * denselben Kopf ("+ Neue Session-Notiz") wieder aufklappt, legt eine NEUE
 * Notiz an** — die bearbeitete bleibt, wie sie war, in D, im Speicher und
 * nach dem Neuladen; eine Eingabe, deren Notiz beim Speichern nicht mehr da
 * ist, wird neu angelegt statt still verworfen; und Strg+Z nimmt genau das
 * Anlegen bzw. Bearbeiten zurueck, nicht die Aktion davor.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen am Buendel zu e5bc99d, 1440x900, echte Klicks und Tasten, Saat
 * wie unten (S1 "Der Anfang" mit Arc, Zusammenfassung, Tags und einem Feld,
 * das kein Formular kennt; S2, S3 schlicht; zwei Arcs):
 *
 *   ✏️ S1 → Kopf zu → Kopf auf    das Formular traegt id 1 und jedes Feld von
 *   → neue Eingabe → 💾           S1 ausser dem Arc (das Aufklappen setzt ihn
 *                                 auf ''); 💾 UEBERSCHREIBT S1 ("Notiz
 *                                 aktualisiert"), Zusammenfassung und Tags von
 *                                 S1 bleiben stehen (Mischung), arcId 100 →
 *                                 null; kein Undo-Eintrag, Strg+Z sagt "Nichts
 *                                 zum Rueckgaengigmachen"; nach dem Neuladen
 *                                 bleibt S1 ueberschrieben
 *   ✏️ S1 → 🗑️ S1 an der Karte →  NICHTS gespeichert, keine Meldung, die
 *   💾                            Eingabe ist weg
 *   🗑️ S3 → "Frisch" anlegen →    Strg+Z holt S3 zurueck UND nimmt "Frisch"
 *   ✏️ Frisch → Strg+Z im Titel   still mit (das Anlegen hat keinen
 *   → 💾                          Undo-Eintrag); 💾 speichert nichts, keine
 *                                 Meldung
 *   ✏️ S1 → ⚙️ → Arc anlegen      die Arc-Auswahl springt 100 → '', 💾
 *                                 schreibt arcId null (ebenso beim Loeschen
 *                                 eines ANDEREN Arcs und beim Aufklappen)
 *   ✏️ S1 → Reiter Wiki → Notizen das Datum springt 2026-01-10 → heute, 💾
 *                                 schreibt es
 *
 * DIE URSACHEN (Stand e5bc99d):
 *   - `systems/spellslots/navigation.js:119` toggleCollapse() schaltet nur die
 *     Klasse `open`: Zuklappen bricht das Bearbeiten nicht ab, Aufklappen —
 *     der EINZIGE Anlege-Weg der Notiz — leert #edit-session-id nicht.
 *   - `features/sessions/sessions.js:362` `if (idx > -1) {…}` ohne else: eine
 *     verwaiste ID speichert nichts und meldet nichts; `:389`
 *     cancelSessionEdit() wirft die Eingabe danach weg.
 *   - `features/sessions/sessions.js:337` saveSession() ruft weder pushUndo
 *     noch saveUndoState — weder beim Anlegen noch beim Bearbeiten. Strg+Z
 *     (Schnappschuss-Undo) springt dann hinter die VORIGE Aktion und reisst
 *     die neue Notiz still mit.
 *   - `features/sessions/sessions.js:15` renderStoryArcSelects() baut
 *     #session-arc per innerHTML neu und haelt die Auswahl nicht; Aufrufer
 *     `navigation.js:126-132` (Aufklappen), `sessions.js:77` (addStoryArc),
 *     `sessions.js:92` (deleteStoryArc).
 *   - `systems/spellslots/navigation.js:48-50` switchView('notes') setzt
 *     #session-date bei JEDEM Wechsel auf heute, auch beim Bearbeiten.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag ABBRUCH, docs/bugfixes.md) UND IHRE FAELLE
 *
 *   R1 Anlegen legt neu an ............................ (1)
 *   R2 ein Anlege-Entwurf bleibt (Waechter) ........... (2)
 *   R4 verwaiste ID: geloescht / Strg+Z im Feld ........ (3) (4)
 *   R5 Undo erfasst Anlegen und Bearbeiten ............. (5) (6)
 *   R6 Arc-Auswahl (⚙️, Zu-/Aufklappen), Datum ......... (7) (8) (9)
 *   Kontrolle: Abbrechen bzw. 💾, dann Anlegen ......... (10)
 *
 * R3 entfaellt: die Taste n und die Befehlspalette kennen keine Notiz
 * (`keyboard-shortcuts.js:806-813`, `action-registry.js:7-50`). Dass der
 * Kopf ein Umschalter bleibt und Zuklappen ein Abbruch ist, haelt Fall (1).
 * R7 und R8 gehoeren zu anderen Formularen.
 *
 * DIE ABBRUCH-WEGE DER NOTIZ sind zwei: Zuklappen ueber den Kopf (Fall 1) und
 * der Knopf "Abbrechen" (Kontrolle 10). Escape und Reiterwechsel schliessen
 * das Klappformular NICHT (gemessen) — sie sind kein eigener Weg; wer danach
 * neu anlegen will, klappt wieder ueber den Kopf zu. Ein ✕ oder einen
 * Klick daneben gibt es beim Klappformular nicht.
 *
 * R6 UND DER KOPF. Der Vertrag verlangt, dass die Arc-Auswahl einer
 * BEARBEITETEN Notiz "beim Zu-/Aufklappen" bleibt — und zugleich (R1/R3),
 * dass Zuklappen ueber den Kopf das Bearbeiten abbricht. Nach Zu-/Aufklappen
 * gibt es also keine bearbeitete Notiz mehr im Formular. Fall (8) liest die
 * Zusage darum fuer den Anlege-Entwurf (R2: er bleibt GANZ, also auch mit
 * seiner Arc-Auswahl); fuer die bearbeitete Notiz gilt der Arc-Teil ueber
 * ⚙️, Fall (7).
 *
 * R2 UND "ABBRECHEN". Der Knopf "Abbrechen" des Klappformulars IST die
 * Leer-Funktion des Vertrags (cancelSessionEdit, Vertragstabelle) und
 * verwirft auch den Entwurf — heute wie nach der Fix-Skizze. Fall (2) prueft
 * darum Zuklappen, Escape und Reiterwechsel, nicht "Abbrechen".
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Der Titel "✏️ Notiz bearbeiten" (V6, eigener PR), das Datum eines
 * ENTWURFS beim Reiterwechsel (der Vertrag nennt nur die bearbeitete Notiz),
 * der Wortlaut der Undo-Eintraege (der Vertrag nennt ihn nur als Muster;
 * geprueft wird, WAS Strg+Z zuruecknimmt), Strg+Y, das Telefon-Layout. Die
 * Nummer einer neuen Notiz entscheidet getNextSessionNumber(), ihre ID
 * nextId() — darum vergleichen die Faelle Namen und Felder, keine IDs.
 *
 * DER KOPF wird NICHT ueber `data-action`/`data-value` gewaehlt — die Fix-
 * Skizze gibt ihm eine eigene Aktion statt `toggle-collapse` —, sondern als
 * Elternelement von #session-form-title. Offen heisst: das Titelfeld ist
 * sichtbar (nicht: eine bestimmte Klasse).
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

const ARC_1 = { id: 100, name: 'Akt 1', color: '#d4af37', order: 0 };
const ARC_2 = { id: 200, name: 'Akt 2', color: '#ff0000', order: 1 };

/** S1 traegt JEDES Feld, das das Formular zeigt, dazu eines, das es nicht
 *  kennt (`eigenesFeld`) — ein Ueberschreiben oder Mischen faellt so auf. */
const S1 = {
    id: 1,
    number: 1,
    name: 'Der Anfang',
    date: '2026-01-10',
    arcId: 100,
    summary: 'Gruppe trifft sich',
    tags: ['wichtig', 'kampf'],
    content: '<p>Die <b>Gruppe</b> traf sich.</p>',
    eigenesFeld: 'bleibt'
};
const S2 = {
    id: 2,
    number: 2,
    name: 'Ohne Arc',
    date: '2026-01-17',
    arcId: null,
    summary: '',
    tags: [],
    content: '<p>Zweite Sitzung</p>'
};
const S3 = {
    id: 3,
    number: 3,
    name: 'Wegwerf',
    date: '2026-01-24',
    arcId: null,
    summary: '',
    tags: [],
    content: '<p>Dritte</p>'
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
        sessionNotes: [S1, S2, S3],
        storyArcs: [ARC_1, ARC_2],
        sessionPreps: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        // Der Zaehler steht AUSDRUECKLICH in der Saat: das Laden ergaenzt ihn
        // nicht (gemessen in der Kritik, K4) — ohne ihn haenge die Art des
        // Verlusts (ueberschreiben statt verlieren) an der Saat.
        _nextId: {
            characters: 1,
            npcs: 1,
            locations: 1,
            quests: 1,
            encounters: 1,
            spells: 1,
            loot: 1,
            items: 1,
            wiki: 1,
            sessionNotes: 4,
            sessionPreps: 1,
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
 * Echter Klick auf einen Navigationsreiter — die Reiter liegen in Gruppen,
 * deren Klappmenue erst aufgehen muss.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 */
async function reiter(page, ansicht) {
    const tab = page.locator(`.nav-tab[data-view="${ansicht}"]`);
    if (!(await tab.isVisible())) {
        await page.locator('.nav-group', { has: tab }).locator('.nav-group-btn').click();
    }
    await tab.click();
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
}

/**
 * Laedt breit, saet EINMAL je Tab (sessionStorage-Sperre: ein Neuladen liest
 * danach, was die App gespeichert hat) und oeffnet die Notizen ueber den
 * echten Reiter.
 * @param {import('@playwright/test').Page} page
 */
async function notizenLaden(page) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('notiz-anlegen-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('notiz-anlegen-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed()]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN (wie npc-formular.spec.js): repariert
    // `load()` die Saat, schreibt `saveAutomatic()` etwa 1,4 s spaeter den
    // ganzen Stand (truhe-formular.spec.js); erkennbar am ueberschriebenen
    // `_version`. Bei DIESER Saat kommt keine (gemessen: kein Schreiben binnen
    // 4 s, zwei von zwei Ladevorgaengen) — darum 2 s statt 4 s: das faengt die
    // 1,4 s noch, und die Datei bleibt bei 1 Worker unter 90 s. Ein spaeter
    // Nachzuegler verfaelscht trotzdem nichts: `geschrieben()` verlangt nach
    // dem _rev-Wechsel zusaetzlich, dass der Speicher dem Stand in D folgt.
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
    await reiter(page, 'notes');
}

/** WEICHE Zusicherungen fuer die Ergebnisse: ein roter Lauf soll JEDE
 *  gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen, ohne die
 *  der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Alle Notizen aus D (JSON-Kopie, dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page */
function notizenInD(page) {
    return page.evaluate(() => JSON.parse(JSON.stringify(window.D.sessionNotes ?? null)));
}
/** Alle Notizen aus dem Speicher.
 *  @param {import('@playwright/test').Page} page */
function notizenImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return JSON.parse(localStorage.getItem(schluessel) || '{}').sessionNotes ?? null;
        } catch {
            return '(nicht lesbar)';
        }
    }, SPEICHER);
}

/** Der sichtbare Text eines gespeicherten Inhalts (ohne Tags).
 *  @param {string|undefined} html */
function inhaltText(html) {
    return String(html || '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Eine Notiz in der Form, die die Faelle vergleichen: was der Nutzer sieht
 *  und eingibt, ohne ID und Nummer (die vergeben nextId() bzw.
 *  getNextSessionNumber()).
 *  @param {any} n */
function sicht(n) {
    if (!n) return null;
    return {
        name: n.name,
        date: n.date,
        arcId: n.arcId ?? null,
        summary: n.summary || '',
        tags: n.tags || [],
        text: inhaltText(n.content)
    };
}

/** Die Namen aller Notizen, in Reihenfolge.
 *  @param {any[]|null} notizen */
function namen(notizen) {
    return Array.isArray(notizen) ? notizen.map(n => n.name) : notizen;
}

/** Die Namen aller Notizen, sortiert — WO eine neue Notiz in der Liste
 *  landet, ist nicht die Regel, nur DASS sie (genau einmal) da ist.
 *  @param {any[]|null} notizen */
function namenSortiert(notizen) {
    const n = namen(notizen);
    return Array.isArray(n) ? n.slice().sort() : n;
}

/** Alle Felder des Formulars, wie das Template sie fuehrt.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value ?? null;
        return {
            id: wert('edit-session-id'),
            nummer: wert('session-number'),
            name: wert('session-name'),
            datum: wert('session-date'),
            arc: wert('session-arc'),
            zusammenfassung: wert('session-summary'),
            tags: Array.from(document.querySelectorAll('#session-tags-container .session-tag')).map(
                t => (t.childNodes[0]?.textContent || '').trim()
            ),
            text: (document.getElementById('session-text')?.textContent || '')
                .replace(/\s+/g, ' ')
                .trim()
        };
    });
}

/**
 * Welche Werte der Notiz `n` das Formular `f` noch traegt — leere Felder
 * der Notiz zaehlen nicht (ein leeres Feld ist kein Rest). Das ist R1 woertlich:
 * "ohne Werte des bearbeiteten Eintrags".
 * @param {Awaited<ReturnType<typeof formular>>} f
 * @param {any} n
 */
function resteVon(f, n) {
    /** @type {string[]} */
    const reste = [];
    if (n.number != null && f.nummer === String(n.number)) reste.push('Nummer');
    if (n.name && f.name === n.name) reste.push('Titel');
    if (n.date && f.datum === n.date) reste.push('Datum');
    if (n.arcId != null && f.arc === String(n.arcId)) reste.push('Story-Arc');
    if (n.summary && f.zusammenfassung === n.summary) reste.push('Zusammenfassung');
    if ((n.tags || []).some(t => f.tags.includes(t))) reste.push('Tags');
    if (inhaltText(n.content) && f.text.includes(inhaltText(n.content))) reste.push('Text');
    return reste;
}

/** Der Kopf des Klappformulars — Anlege-Weg UND Zuklapp-Schalter. Ueber das
 *  Titelfeld gewaehlt, nicht ueber `data-action` (siehe Kopfkommentar).
 *  @param {import('@playwright/test').Page} page */
function kopf(page) {
    return page.locator('#session-form-title').locator('..');
}

/** Das Formular ist aufgeklappt, wenn sein Titelfeld sichtbar ist.
 *  @param {import('@playwright/test').Page} page */
function titelFeld(page) {
    return page.locator('#session-name');
}

/** Kopf klicken, wenn das Formular zu ist: der Anlege-Weg.
 *  @param {import('@playwright/test').Page} page */
async function aufklappen(page) {
    await expect(titelFeld(page), 'Vorbedingung: das Formular ist zu').toBeHidden();
    await kopf(page).click();
    await expect(titelFeld(page), 'der Kopf klappt das Formular auf').toBeVisible();
}

/** Kopf klicken, wenn das Formular offen ist: Zuklappen (R3: ein Abbruch).
 *  @param {import('@playwright/test').Page} page */
async function zuklappen(page) {
    await expect(titelFeld(page), 'Vorbedingung: das Formular ist offen').toBeVisible();
    await kopf(page).click();
    await expect(titelFeld(page), 'der Kopf bleibt ein Umschalter und klappt zu').toBeHidden();
}

/** ✏️ an der Karte der Notiz.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    await page.locator(`#session-list [data-action="edit-session"][data-id="${id}"]`).click();
    await expect(titelFeld(page)).toBeVisible();
    await expect(page.locator('#edit-session-id')).toHaveValue(String(id));
}

/** 🗑️ an der Karte der Notiz (die Rueckfrage nimmt `page.on('dialog')` an).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function loeschen(page, id) {
    await page.locator(`#session-list [data-action="delete-session"][data-id="${id}"]`).click();
    await expect
        .poll(async () => (await notizenInD(page)).some(n => n.id === id), {
            message: `🗑️ an Notiz ${id}`
        })
        .toBe(false);
}

/** Die Knoepfe des Formulars, ueber Rolle und Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function knopf(page, name) {
    return page.locator('#session-form').getByRole('button', { name, exact: true });
}

/** 💾 im Formular.
 *  @param {import('@playwright/test').Page} page */
async function speichern(page) {
    await knopf(page, 'Speichern').click();
}

/**
 * Tippt eine Notiz ein: Titel, Datum (Pflicht) und Text (Pflicht, per Strg+A
 * ersetzt — so ersetzt man einen stehengebliebenen Text; in einem leeren
 * Editor schadet Strg+A nicht).
 * @param {import('@playwright/test').Page} page
 * @param {{ name: string, datum: string, text: string }} n
 */
async function eintippen(page, n) {
    await page.locator('#session-name').fill(n.name);
    await page.locator('#session-date').fill(n.datum);
    await page.locator('#session-text').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(n.text);
}

/** Der `_rev`-Marker der Kampagne — jeder Schreibpfad der Persistenz setzt
 *  ihn neu. Ohne ihn waere "der Speicher traegt den alten Stand" nicht von
 *  "es wurde gar nicht geschrieben" zu unterscheiden.
 *  @param {import('@playwright/test').Page} page */
function revStand(page) {
    return page.evaluate(schluessel => localStorage.getItem(schluessel + '_rev'), SPEICHER);
}

/**
 * Weist das Speichern nach: erst MUSS seit `rev` geschrieben worden sein
 * (entprellt 300 ms), dann muss der Speicher dem Stand in D folgen. Beides
 * hart — ohne Nachweis sagt ein Vergleich mit dem Speicher nichts.
 * @param {import('@playwright/test').Page} page
 * @param {string|null} rev
 * @param {string} was
 */
async function geschrieben(page, rev, was) {
    await expect
        .poll(() => revStand(page), {
            timeout: SOFORT_MS,
            message: `${was}: save() muss schreiben (entprellt 300 ms)`
        })
        .not.toBe(rev);
    await ruhig(page, was);
}

/** Wartet, bis der Speicher dem Stand in D folgt — vor jedem `revStand()`,
 *  damit ein noch ausstehendes Schreiben (🗑️, Anlegen) nicht als das
 *  Schreiben des naechsten Schritts gezaehlt wird.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} was */
async function ruhig(page, was) {
    const d = await notizenInD(page);
    await expect
        .poll(() => notizenImSpeicher(page), {
            timeout: SOFORT_MS,
            message: `${was}: localStorage.sessionNotes muss D folgen`
        })
        .toEqual(d);
}

/** Neu laden; die Saat-Sperre laesst den gespeicherten Stand stehen.
 *  @param {import('@playwright/test').Page} page */
async function neuLaden(page) {
    await page.reload();
    await waitForAppReady(page);
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

/** Der oberste Eintrag des Rueckgaengig-Stapels (Text, nie null).
 *  @param {import('@playwright/test').Page} page */
function undoKopf(page) {
    return page.evaluate(() =>
        String(undoStack.length ? undoStack[undoStack.length - 1].action : null)
    );
}

/**
 * Strg+Z — und warten, bis die App es verarbeitet hat: jede Antwort von
 * undo() meldet sich mit "↩️" ("Rueckgaengig: …" oder "Nichts zum
 * Rueckgaengigmachen"). Wartet auf die Verarbeitung, nicht auf ein Ergebnis.
 * @param {import('@playwright/test').Page} page
 */
async function strgZ(page) {
    const stand = await meldungsStand(page);
    await page.keyboard.press('Control+z');
    await expect
        .poll(async () => (await meldungenSeit(page, stand)).some(m => m.includes('↩️')), {
            message: 'Strg+Z muss verarbeitet werden'
        })
        .toBe(true);
    return meldungenSeit(page, stand);
}

/** Meldet die Warnung "… existiert nicht mehr — als neue … gespeichert"?
 *  @param {string[]} meldungen */
function warntNeuAngelegt(meldungen) {
    return meldungen.some(m => m.startsWith('warning: ') && /\bneue[rn]?\b/.test(m));
}

// ===========================================================================
// (1) R1: ✏️ → KOPF ZU → KOPF AUF LEGT NEU AN UND UEBERSCHREIBT NICHT
// ===========================================================================
//
// Der Kopf "+ Neue Session-Notiz" ist der einzige Anlege-Weg der Notiz und
// zugleich ihr Zuklapp-Schalter. Zuklappen bei offenem Bearbeiten ist ein
// Abbruch (R3); das Aufklappen danach muss ein Formular ohne ID und ohne
// einen Wert von S1 zeigen. Vor dem Fix: id 1 und jedes Feld von S1 ausser
// dem Arc (den das Aufklappen auf '' setzt), und 💾 ueberschrieb S1.
test('(1) R1: ✏️ S1 → Kopf zu → Kopf auf → 💾 legt eine NEUE Notiz an, S1 bleibt — in D, im Speicher, nach dem Neuladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await notizenLaden(page);
    const vorher = await notizenInD(page);
    expect(
        vorher.find(n => n.id === 1),
        'die Saat muss so in D ankommen, sonst misst der Fall die Saat'
    ).toEqual(S1);

    await bearbeiten(page, 1);
    await zuklappen(page);
    await aufklappen(page);
    const f = await formular(page);
    weich(
        { id: f.id, reste: resteVon(f, S1) },
        'der Kopf nach abgebrochenem Bearbeiten: keine Bearbeiten-ID, kein Wert von S1'
    ).toEqual({ id: '', reste: [] });

    await eintippen(page, { name: 'Neue Sitzung', datum: '2026-03-01', text: 'Neuer Text' });
    await ruhig(page, 'vor 💾');
    const rev = await revStand(page);
    const stand = await meldungsStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');

    const erwartet = {
        name: 'Neue Sitzung',
        date: '2026-03-01',
        arcId: null,
        summary: '',
        tags: [],
        text: 'Neuer Text'
    };
    const d = await notizenInD(page);
    weich(namenSortiert(d), 'D: S1, S2, S3 bleiben, "Neue Sitzung" kommt dazu').toEqual([
        'Der Anfang',
        'Neue Sitzung',
        'Ohne Arc',
        'Wegwerf'
    ]);
    weich(
        d.find(n => n.id === 1),
        'D: S1 ist feldgleich — nicht ueberschrieben, nicht gemischt'
    ).toEqual(S1);
    weich(
        sicht(d.find(n => n.name === 'Neue Sitzung')),
        'D: die neue Notiz traegt nur die Eingabe, keinen Wert von S1'
    ).toEqual(erwartet);
    const s = await notizenImSpeicher(page);
    weich(namenSortiert(s), 'localStorage: vier Notizen').toEqual([
        'Der Anfang',
        'Neue Sitzung',
        'Ohne Arc',
        'Wegwerf'
    ]);
    weich(
        s?.find(n => n.id === 1),
        'localStorage: S1 feldgleich'
    ).toEqual(S1);
    weich(
        (await meldungenSeit(page, stand)).filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert" — es wurde nichts bearbeitet'
    ).toEqual([]);

    await neuLaden(page);
    const nachLaden = await notizenInD(page);
    weich(namenSortiert(nachLaden), 'nach dem Neuladen: vier Notizen').toEqual([
        'Der Anfang',
        'Neue Sitzung',
        'Ohne Arc',
        'Wegwerf'
    ]);
    weich(
        nachLaden.find(n => n.id === 1),
        'nach dem Neuladen: S1 feldgleich'
    ).toEqual(S1);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (2) WAECHTER R2: EIN ANLEGE-ENTWURF UEBERLEBT ZUKLAPPEN, ESCAPE, REITERWECHSEL
// ===========================================================================
//
// Schon vor dem Fix gruen. Er haelt fest, dass der Fix NUR einen
// Bearbeiten-Rest leert: ein nie gespeicherter Entwurf (keine ID) bleibt
// stehen, und der naechste Anlege-Weg — der Kopf — verwirft ihn nicht (wie
// NPC-Fall 18). Das Datum des Entwurfs wird nicht verglichen: der
// Reiterwechsel setzt es auf heute, und der Vertrag nennt nur das Datum einer
// BEARBEITETEN Notiz (Fall 9).
test('(2) R2 (Waechter): ein Entwurf ueberlebt Kopf zu/auf, Escape und Reiterwechsel', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await notizenLaden(page);

    await aufklappen(page);
    await page.locator('#session-name').fill('Entwurf');
    await page.locator('#session-summary').fill('Kurz gesagt');
    await page
        .locator('#session-tag-suggestions')
        .getByRole('button', { name: /wichtig/ })
        .click();
    await page.locator('#session-text').click();
    await page.keyboard.type('Entwurfstext');
    const entwurf = {
        id: '',
        name: 'Entwurf',
        zusammenfassung: 'Kurz gesagt',
        tags: ['wichtig'],
        text: 'Entwurfstext'
    };
    /** @param {Awaited<ReturnType<typeof formular>>} f */
    const ohneDatum = f => ({
        id: f.id,
        name: f.name,
        zusammenfassung: f.zusammenfassung,
        tags: f.tags,
        text: f.text
    });
    expect(ohneDatum(await formular(page)), 'Vorbedingung: der Entwurf steht').toEqual(entwurf);

    await zuklappen(page);
    await aufklappen(page);
    weich(ohneDatum(await formular(page)), 'nach Kopf zu → Kopf auf').toEqual(entwurf);

    // Escape mit dem Fokus im Text — schliesst das Klappformular nicht und
    // darf nichts verwerfen.
    await page.locator('#session-text').click();
    await page.keyboard.press('Escape');
    weich(ohneDatum(await formular(page)), 'nach Escape').toEqual(entwurf);

    await reiter(page, 'wiki');
    await reiter(page, 'notes');
    weich(ohneDatum(await formular(page)), 'nach Reiter Wiki → Notizen').toEqual(entwurf);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) R4: GELOESCHT UNTER DEM OFFENEN FORMULAR — 💾 LEGT NEU AN UND SAGT ES
// ===========================================================================
//
// Das Formular bleibt offen, 🗑️ an der Karte daneben loescht genau die
// Notiz, die es bearbeitet. Vor dem Fix: 💾 speicherte NICHTS, ohne jede
// Meldung, und warf die Eingabe weg.
test('(3) R4: ✏️ S1 → 🗑️ S1 an der Karte → 💾 speichert die Eingabe als neue Notiz, mit Warnung', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await notizenLaden(page);

    await bearbeiten(page, 1);
    await page.locator('#session-name').fill('Der Anfang, ueberarbeitet');
    await loeschen(page, 1);
    // Die Eingabe steht noch im Formular — ein Fix, der das Formular beim 🗑️
    // schliesst oder leert, verwirft sie und bricht R4 schon hier.
    await expect(titelFeld(page), 'R4: die Eingabe bleibt nach 🗑️ im Formular').toHaveValue(
        'Der Anfang, ueberarbeitet'
    );

    await ruhig(page, 'nach 🗑️');
    const rev = await revStand(page);
    const stand = await meldungsStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');

    // DIE EINGABE ist, was im Formular stand: S1 mit neuem Titel. Fest aus S1
    // abgeleitet und NICHT nach dem 🗑️ aus dem Formular gelesen — sonst
    // wanderte die Erwartung mit, wenn ein Fix beim Loeschen Teile der
    // Eingabe (etwa die Arc-Auswahl) verwirft, und der Fall bliebe gruen.
    const erwartet = {
        name: 'Der Anfang, ueberarbeitet',
        date: S1.date,
        arcId: S1.arcId,
        summary: S1.summary,
        tags: S1.tags,
        text: inhaltText(S1.content)
    };
    const d = await notizenInD(page);
    weich(namenSortiert(d), 'D: die Eingabe ist als neue Notiz da').toEqual([
        'Der Anfang, ueberarbeitet',
        'Ohne Arc',
        'Wegwerf'
    ]);
    weich(
        sicht(d.find(n => n.name === 'Der Anfang, ueberarbeitet')),
        'D: die neue Notiz traegt die Eingabe des Formulars'
    ).toEqual(erwartet);
    weich(
        [2, 3].map(id => d.find(n => n.id === id)),
        'D: S2 und S3 feldgleich — die Eingabe ueberschreibt keine andere Notiz'
    ).toEqual([S2, S3]);
    weich(
        namenSortiert(await notizenImSpeicher(page)),
        'localStorage: die Eingabe ist gespeichert'
    ).toEqual(['Der Anfang, ueberarbeitet', 'Ohne Arc', 'Wegwerf']);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        warntNeuAngelegt(meldungen),
        `die Warnung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(
        meldungen.filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert"'
    ).toEqual([]);
    weich(await undoKopf(page), 'kein leerer Undo-Eintrag "… bearbeitet"').not.toMatch(
        /bearbeitet/
    );

    await neuLaden(page);
    weich(namenSortiert(await notizenInD(page)), 'nach dem Neuladen').toEqual([
        'Der Anfang, ueberarbeitet',
        'Ohne Arc',
        'Wegwerf'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) R4: STRG+Z MIT DEM FOKUS IM FELD NIMMT DIE NOTIZ UNTER DEM FORMULAR WEG
// ===========================================================================
//
// Strg+Z wirkt "immer", auch mit dem Fokus im Titelfeld des offenen
// Formulars, und nimmt D zurueck — das Formular nicht. Das 🗑️ an S3 davor
// sorgt dafuer, dass Strg+Z HEUTE ueberhaupt etwas zuruecknimmt (das
// Anlegen hat keinen Undo-Eintrag, es geht still mit); nach dem Fix (R5)
// nimmt es genau das Anlegen zurueck. In beiden Faellen zeigt die ID danach
// ins Leere — und 💾 muss die Eingabe als neue Notiz speichern.
test('(4) R4: ✏️ einer Notiz, die Strg+Z im Titelfeld zuruecknimmt → 💾 speichert neu, mit Warnung', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await notizenLaden(page);

    await loeschen(page, 3);
    await aufklappen(page);
    await eintippen(page, { name: 'Frisch', datum: '2026-03-01', text: 'Neuer Text' });
    await speichern(page);
    await expect.poll(async () => namen(await notizenInD(page))).toContain('Frisch');
    const frisch = (await notizenInD(page)).find(n => n.name === 'Frisch').id;

    await bearbeiten(page, frisch);
    await page.locator('#session-text').click();
    await page.keyboard.press('End');
    await page.keyboard.type(' plus Nachtrag');
    await page.locator('#session-name').click();
    await strgZ(page);
    // Vorbedingungen: "Frisch" ist in D weg, das Formular haelt ID und Eingabe.
    expect(namen(await notizenInD(page)), 'Strg+Z hat "Frisch" zurueckgenommen').not.toContain(
        'Frisch'
    );
    await expect(page.locator('#edit-session-id')).toHaveValue(String(frisch));
    const eingabe = await formular(page);
    expect(eingabe.text, 'Vorbedingung: die Eingabe steht noch im Formular').toBe(
        'Neuer Text plus Nachtrag'
    );

    await ruhig(page, 'nach Strg+Z');
    const rev = await revStand(page);
    const stand = await meldungsStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');

    const erwartet = {
        name: 'Frisch',
        date: '2026-03-01',
        arcId: null,
        summary: '',
        tags: [],
        text: 'Neuer Text plus Nachtrag'
    };
    const d = await notizenInD(page);
    weich(
        sicht(d.find(n => n.name === 'Frisch')),
        'D: die Eingabe ist als neue Notiz gespeichert'
    ).toEqual(erwartet);
    // NEU heisst: genau einmal, und keine andere Notiz traegt sie. Ohne das
    // ginge ein Fix durch, der die Eingabe an falscher Stelle (ueber S1 oder
    // S2) schreibt oder doppelt ablegt — `find()` saehe nur den ersten Treffer.
    weich(
        {
            frisch: d.filter(n => n.name === 'Frisch').length,
            andere: [1, 2].map(id => d.find(n => n.id === id))
        },
        'D: "Frisch" genau einmal, S1 und S2 feldgleich'
    ).toEqual({ frisch: 1, andere: [S1, S2] });
    weich(
        sicht((await notizenImSpeicher(page))?.find(n => n.name === 'Frisch')),
        'localStorage: die Eingabe ist gespeichert'
    ).toEqual(erwartet);
    const meldungen = await meldungenSeit(page, stand);
    weich(
        warntNeuAngelegt(meldungen),
        `die Warnung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(
        meldungen.filter(m => /aktualisiert/.test(m)),
        'keine Meldung "… aktualisiert"'
    ).toEqual([]);
    weich(await undoKopf(page), 'kein leerer Undo-Eintrag "… bearbeitet"').not.toMatch(
        /bearbeitet/
    );

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) R5: STRG+Z NACH DEM ANLEGEN NIMMT NUR DAS ANLEGEN ZURUECK
// ===========================================================================
//
// Vor dem Fix hatte das Anlegen keinen Undo-Eintrag: Strg+Z sprang auf den
// Stand vor dem 🗑️ an S3 — S3 kam zurueck, "Frisch" verschwand still mit.
test('(5) R5: 🗑️ S3 → "Frisch" anlegen → Strg+Z nimmt nur "Frisch" zurueck, S3 bleibt geloescht', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await notizenLaden(page);

    await loeschen(page, 3);
    await aufklappen(page);
    await eintippen(page, { name: 'Frisch', datum: '2026-03-01', text: 'Neuer Text' });
    await ruhig(page, 'nach 🗑️');
    const rev = await revStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');
    expect(namenSortiert(await notizenInD(page)), 'Vorbedingung: "Frisch" ist angelegt').toEqual([
        'Der Anfang',
        'Frisch',
        'Ohne Arc'
    ]);

    await strgZ(page);
    weich(
        namen(await notizenInD(page)),
        'D nach Strg+Z: nur das Anlegen ist zurueckgenommen'
    ).toEqual(['Der Anfang', 'Ohne Arc']);
    // undo() schreibt per saveImmediate() (asynchron): erst folgen lassen.
    await ruhig(page, 'nach Strg+Z');
    weich(namen(await notizenImSpeicher(page)), 'localStorage nach Strg+Z').toEqual([
        'Der Anfang',
        'Ohne Arc'
    ]);

    // Der Loeschen-Schritt liegt dahinter — das zweite Strg+Z holt S3.
    await strgZ(page);
    weich(namen(await notizenInD(page)), 'D nach dem zweiten Strg+Z: S3 ist wieder da').toEqual([
        'Der Anfang',
        'Ohne Arc',
        'Wegwerf'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) R5: STRG+Z NACH DEM BEARBEITEN STELLT DIE NOTIZ WIEDER HER
// ===========================================================================
//
// Vor dem Fix: kein Undo-Eintrag beim Bearbeiten — Strg+Z meldete "Nichts
// zum Rueckgaengigmachen", die Aenderung war endgueltig.
test('(6) R5: ✏️ S1 → Titel aendern → 💾 → Strg+Z stellt S1 wieder her — in D, im Speicher, nach dem Neuladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await notizenLaden(page);

    await bearbeiten(page, 1);
    await page.locator('#session-name').fill('Der Anfang, ueberarbeitet');
    await ruhig(page, 'vor 💾');
    const rev = await revStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');
    expect(
        (await notizenInD(page)).find(n => n.id === 1)?.name,
        'Vorbedingung: die Aenderung ist gespeichert'
    ).toBe('Der Anfang, ueberarbeitet');

    await strgZ(page);
    weich(
        (await notizenInD(page)).find(n => n.id === 1),
        'D nach Strg+Z: S1 wie vorher'
    ).toEqual(S1);
    // undo() schreibt per saveImmediate() (asynchron): erst folgen lassen.
    await ruhig(page, 'nach Strg+Z');
    weich(
        (await notizenImSpeicher(page))?.find(n => n.id === 1),
        'localStorage nach Strg+Z: S1 wie vorher'
    ).toEqual(S1);
    await neuLaden(page);
    weich(
        (await notizenInD(page)).find(n => n.id === 1),
        'nach dem Neuladen: S1 wie vorher'
    ).toEqual(S1);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) R6: DIE ARC-AUSWAHL EINER BEARBEITETEN NOTIZ UEBERLEBT DIE ARC-VERWALTUNG
// ===========================================================================
//
// ⚙️ neben der Arc-Auswahl oeffnet die Arc-Verwaltung UEBER dem offenen
// Formular. Einen Arc anlegen bzw. einen ANDEREN loeschen baute die Auswahl
// neu und liess sie auf '' fallen; 💾 schrieb arcId null.
test('(7) R6: ✏️ S1 → ⚙️ → Arc anlegen und anderen Arc loeschen → S1 behaelt seinen Arc', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await notizenLaden(page);

    await bearbeiten(page, 1);
    expect((await formular(page)).arc, 'Vorbedingung: das Formular zeigt Akt 1').toBe('100');

    await page.locator('#session-form').getByTitle('Arcs verwalten').click();
    const verwaltung = page.locator('#story-arc-modal');
    await expect(verwaltung.locator('#new-arc-name')).toBeVisible();
    await verwaltung.locator('#new-arc-name').fill('Akt 3');
    await verwaltung.getByRole('button', { name: '+', exact: true }).click();
    await expect(verwaltung.locator('.story-arc-item', { hasText: 'Akt 3' })).toHaveCount(1);
    weich((await formular(page)).arc, 'Arc-Auswahl nach "Akt 3" anlegen').toBe('100');

    await verwaltung.locator('.story-arc-item', { hasText: 'Akt 2' }).getByTitle('Löschen').click();
    await expect(verwaltung.locator('.story-arc-item', { hasText: 'Akt 2' })).toHaveCount(0);
    weich((await formular(page)).arc, 'Arc-Auswahl nach "Akt 2" loeschen').toBe('100');

    await verwaltung.getByRole('button', { name: 'Schließen', exact: true }).click();
    await expect(verwaltung.locator('#new-arc-name')).toBeHidden();
    await expect(page.locator('#edit-session-id'), 'Vorbedingung: noch im Bearbeiten').toHaveValue(
        '1'
    );

    await ruhig(page, 'nach der Arc-Verwaltung');
    const rev = await revStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');
    weich(
        (await notizenInD(page)).find(n => n.id === 1),
        'D: S1 nach ✏️ → ⚙️ → 💾 feldgleich, arcId 100'
    ).toEqual(S1);
    weich(
        (await notizenImSpeicher(page))?.find(n => n.id === 1),
        'localStorage: S1 feldgleich, arcId 100'
    ).toEqual(S1);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) R6/R2: DIE ARC-AUSWAHL EINES ENTWURFS UEBERLEBT ZU-/AUFKLAPPEN
// ===========================================================================
//
// Die Lesart steht im Kopfkommentar ("R6 und der Kopf"): fuer eine
// bearbeitete Notiz ist Zuklappen ein Abbruch, die Zusage "bleibt beim
// Zu-/Aufklappen" traegt also der Entwurf. Vor dem Fix baute das Aufklappen
// die Auswahl neu und liess sie auf '' fallen — Titel und Text blieben
// stehen, der Arc nicht.
test('(8) R6: Entwurf mit Arc "Akt 2" → Kopf zu → Kopf auf → die Auswahl steht noch und wird gespeichert', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await notizenLaden(page);

    await aufklappen(page);
    await page.locator('#session-name').fill('Entwurf');
    await page.locator('#session-arc').selectOption('200');
    await page.locator('#session-text').click();
    await page.keyboard.type('Entwurfstext');
    const datum = (await formular(page)).datum;

    await zuklappen(page);
    await aufklappen(page);
    const f = await formular(page);
    weich(
        { id: f.id, name: f.name, arc: f.arc, text: f.text },
        'der Entwurf nach Kopf zu → Kopf auf, samt Arc-Auswahl'
    ).toEqual({ id: '', name: 'Entwurf', arc: '200', text: 'Entwurfstext' });

    await ruhig(page, 'vor 💾');
    const rev = await revStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');
    const erwartet = {
        name: 'Entwurf',
        date: datum,
        arcId: 200,
        summary: '',
        tags: [],
        text: 'Entwurfstext'
    };
    weich(
        sicht((await notizenInD(page)).find(n => n.name === 'Entwurf')),
        'D: der Entwurf mit Akt 2'
    ).toEqual(erwartet);
    weich(
        sicht((await notizenImSpeicher(page))?.find(n => n.name === 'Entwurf')),
        'localStorage: der Entwurf mit Akt 2'
    ).toEqual(erwartet);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) R6: DAS DATUM EINER BEARBEITETEN NOTIZ UEBERLEBT DEN REITERWECHSEL
// ===========================================================================
//
// Der Reiterwechsel schliesst das Klappformular nicht — das Bearbeiten
// laeuft weiter. Vor dem Fix setzte jeder Wechsel auf "Notizen" das Datum auf
// heute, und 💾 schrieb es.
test('(9) R6: ✏️ S1 → Reiter Wiki → Reiter Notizen → 💾 laesst das Datum von S1 stehen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await notizenLaden(page);

    await bearbeiten(page, 1);
    await reiter(page, 'wiki');
    await reiter(page, 'notes');
    // Vorbedingung, nicht die Regel: das Bearbeiten laeuft noch.
    await expect(titelFeld(page)).toBeVisible();
    await expect(page.locator('#edit-session-id')).toHaveValue('1');
    weich((await formular(page)).datum, 'das Datum im Formular nach dem Reiterwechsel').toBe(
        S1.date
    );

    await ruhig(page, 'vor 💾');
    const rev = await revStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');
    weich(
        (await notizenInD(page)).find(n => n.id === 1),
        'D: S1 nach ✏️ → Reiterwechsel → 💾 feldgleich'
    ).toEqual(S1);
    weich(
        (await notizenImSpeicher(page))?.find(n => n.id === 1),
        'localStorage: S1 feldgleich'
    ).toEqual(S1);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (10) KONTROLLE: NACH "ABBRECHEN" BZW. NACH 💾 LEGT DER KOPF NEU AN
// ===========================================================================
//
// Schon vor dem Fix gruen: "Abbrechen" (cancelSessionEdit) und 💾 leeren das
// Formular. Haelt fest, dass der Fix diese beiden Wege nicht verbiegt — und
// fuehrt den Abbruch-Weg "Abbrechen" ueberhaupt einmal.
test('(10) (Kontrolle): ✏️ → Abbrechen → Kopf und ✏️ → 💾 → Kopf legen je eine neue Notiz an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await notizenLaden(page);

    await bearbeiten(page, 1);
    await knopf(page, 'Abbrechen').click();
    await expect(titelFeld(page)).toBeHidden();
    await aufklappen(page);
    let f = await formular(page);
    weich({ id: f.id, reste: resteVon(f, S1) }, 'Kopf nach ✏️ S1 → Abbrechen').toEqual({
        id: '',
        reste: []
    });
    await eintippen(page, { name: 'Neu A', datum: '2026-03-01', text: 'Text A' });
    await speichern(page);
    await expect.poll(async () => namen(await notizenInD(page))).toContain('Neu A');

    await bearbeiten(page, 2);
    await speichern(page);
    await expect(titelFeld(page)).toBeHidden();
    await aufklappen(page);
    f = await formular(page);
    weich({ id: f.id, reste: resteVon(f, S2) }, 'Kopf nach ✏️ S2 → 💾').toEqual({
        id: '',
        reste: []
    });
    await eintippen(page, { name: 'Neu B', datum: '2026-03-02', text: 'Text B' });
    await ruhig(page, 'vor 💾');
    const rev = await revStand(page);
    await speichern(page);
    await geschrieben(page, rev, '💾');

    const d = await notizenInD(page);
    weich(namenSortiert(d), 'D: zwei neue Notizen').toEqual([
        'Der Anfang',
        'Neu A',
        'Neu B',
        'Ohne Arc',
        'Wegwerf'
    ]);
    weich(
        [1, 2, 3].map(id => d.find(n => n.id === id)),
        'D: S1, S2, S3 feldgleich'
    ).toEqual([S1, S2, S3]);
    weich(namenSortiert(await notizenImSpeicher(page)), 'localStorage: zwei neue Notizen').toEqual([
        'Der Anfang',
        'Neu A',
        'Neu B',
        'Ohne Arc',
        'Wegwerf'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});
