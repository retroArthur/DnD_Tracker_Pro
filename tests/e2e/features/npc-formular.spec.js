// @ts-check
/**
 * Der Waechter des NPC-Formulars (NPC)
 * ====================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **✏️ → 💾 ohne Aenderung
 * laesst einen NPC, wie er war** — jeder Dialog behaelt sein "verwendet",
 * jeder Trigger sein "ausgeloest", jedes Feld, das das Formular nicht zeigt,
 * bleibt stehen; und wer danach "+ NPC" drueckt, legt einen NEUEN NPC an,
 * statt den zuletzt bearbeiteten zu ueberschreiben.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemeldet: "Speichern setzt die verwendeten Dialoge zurueck, und der Titel
 * heisst beim Bearbeiten 'NPC hinzufuegen'." Gemessen am Buendel zu 429ad8f,
 * 1440x900, echte Klicks und Tasten, Saat wie unten (Volo mit jedem Feld, das
 * der Code liest, dazu ein unbekanntes Feld am NPC, an einem Dialog und an
 * einem Trigger):
 *
 *   ✏️ → 💾, nichts geaendert   dialogs[].used [t,t,f] → [f,f,f] — in D, im
 *                               Speicher und nach dem Neuladen; das Detail
 *                               springt von "2/3 verwendet" auf "0/3"; die
 *                               unbekannten Dialog-/Triggerfelder sind weg
 *   Titel beim Bearbeiten       "NPC hinzufügen"
 *   ✏️ → Abbrechen → "+ NPC"    das Formular traegt Volo samt #edit-npc-id;
 *   (ebenso ✕ → Taste n und     "Speichern" als "Elminster" UEBERSCHREIBT
 *   Escape → Befehlspalette)    Volo (id 1), Ort und Filter werden null
 *   ✕ an Dialog 1, Trigger 1    "triggered" wandert auf den Nachbarn: "Nach
 *                               Quest 1" steht danach auf true
 *   alle Dialoge entfernen      sie kommen nach 💾 alle drei zurueck
 *   Volk 'mensch' (Generator)   das Formular zeigt '' — 💾 loescht das Volk
 *   "+ NPC", Fraktion           nur "— Keine Fraktion —", obwohl D.factions
 *                               eine fuehrt
 *   ✏️, Abbrechen, 🗑️, "+ NPC   NICHTS gespeichert, D.npcs leer — und die
 *   erstellen", "Elminster"     Meldung sagt "NPC aktualisiert", der
 *                               Rueckgaengig-Stapel bekommt einen leeren
 *                               Eintrag "NPC bearbeitet"
 *
 * DIE URSACHEN stehen in `features/npcs/npc-crud.js`: saveNPC() baute jeden
 * Dialog und Trigger NUR aus dem Formular und schrieb `used: false` bzw.
 * `triggered: false` hart hinein; das Formular traegt diesen Zustand nicht.
 * Der "Preserve"-Block danach griff nur bei NULL Dialogen im Formular (darum
 * kamen entfernte Dialoge zurueck) und glich Trigger nach der POSITION ab
 * (darum wanderte "triggered"). editNPC() setzte den Titel nie, und alle vier
 * Anlegen-Wege ("+ NPC", der Knopf der leeren Liste, Taste n, Befehlspalette)
 * oeffneten mit `showModal('npc-modal')` — ohne das Formular zu leeren. Fand
 * saveNPC() die ID nicht mehr, tat es nichts und meldete trotzdem Erfolg.
 * editNPC() setzte das Volk per `select.value = race`; ohne passende Option
 * laeuft das still ins Leere. Der NPC-Generator
 * (`features/npc-generator/npc-generator.js`, saveGeneratedNPC()) schrieb das
 * Volk als Schluessel seiner Namenstabelle ('zwerg'), fuer den das Formular
 * keine Option hat — Fall (16) faehrt ihn ueber den echten Knopf.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WARUM DER SCHNAPPSCHUSS (Fall 15)
 *
 * Ein erster Fixvorschlag merkte sich am Formularfeld nur den INDEX des
 * Ursprungseintrags und loeste ihn beim Speichern gegen das Live-D auf. Strg+Z
 * wirkt aber auch mit dem Fokus in einem Textfeld des offenen Formulars
 * (keyboard-shortcuts.js: "immer aktiv", vor der isTyping-Schranke) und
 * aendert D darunter. Gemessen am Vorschlag: Begruessung entfernen, 💾, ✏️,
 * Strg+Z im Dialogtitel, 💾 — "Abschied", nie verwendet, stand danach auf
 * used:true, mit den Altfeldern der Begruessung. Fall (15) haelt fest, dass
 * der Zustand vom Eintrag kommt, aus dem editNPC() das Feld gebaut hat.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Strg+Z bei offenem Formular als solches (es nimmt D zurueck, das Formular
 * nicht — das naechste 💾 schreibt das Formular darueber), das fehlende Undo
 * fuer den ✓-Haken, "[object Object]" bei Tags im Detail. Eigene Vorgaenge.
 * Am Telefon gibt es kein ✏️ (das NPC-Detail ist bis 900 px ausgeblendet),
 * darum keine Bearbeiten-Faelle dort — den Anlegen-Weg gibt es aber, Fall
 * (20) faehrt ihn mit dem Finger.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — das NPC-Detail mit ✏️ und 🗑️ steht erst ueber 900 px. */
const BREIT = { width: 1440, height: 900 };
/** Das Telefon — dort gibt es nur den Anlegen-Weg, Fall (20). */
const TELEFON = { width: 390, height: 844 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

/** Ein NPC mit JEDEM Feld, das der Code liest oder schreibt — sonst koennte
 *  ein Rundlauf ein Feld verlieren, ohne dass ein Fall es merkt. Dazu je ein
 *  Feld, das kein Formular kennt: am NPC (`eigenesFeld`, `createdAt`), am
 *  ersten Dialog (`stimmung`) und am ersten Trigger (`notiz`). */
const VOLO = {
    id: 1,
    name: 'Volo Geddarm',
    role: 'Schriftsteller',
    race: 'Mensch',
    locationId: 1,
    chapter: 'Kapitel 2',
    filterId: 1,
    factionId: 1,
    quests: ['Drachenjagd', 'Schatz finden'],
    info: ['Kennt Geheimgang', 'Hat Schlüssel'],
    relationships: ['Bruder von Elminster', 'Feind von Manshoon'],
    description: '<p>Ein <b>berühmter</b> Reiseschriftsteller.</p>',
    triggers: [
        {
            condition: 'Spieler bieten Gold',
            reveal: 'Verrät das Versteck',
            triggered: true,
            notiz: 'Sitzung 3'
        },
        { condition: 'Nach Quest 1', reveal: 'Gibt Karte', triggered: false }
    ],
    dialogs: [
        {
            title: 'Begrüßung',
            triggerCondition: 'Erstes Treffen',
            text: 'Ah, Abenteurer!',
            used: true,
            stimmung: 'herzlich'
        },
        {
            title: 'Geheimnis',
            triggerCondition: 'Wenn vertraut',
            text: '<b>Der Schatz</b> liegt im Keller.',
            used: true
        },
        { title: 'Abschied', triggerCondition: '', text: 'Lebt wohl.', used: false }
    ],
    relations: [
        { targetId: 2, targetType: 'npcs', status: 'hostile', note: 'Rivale' },
        { targetId: 1, targetType: 'characters', status: 'friendly', note: 'Schuldet Gold' }
    ],
    avatar: GIF,
    tags: [{ name: 'Wichtig', color: 'red' }],
    links: [
        { type: 'locations', id: 2 },
        { type: 'quests', id: 1 }
    ],
    createdAt: 1700000000000,
    eigenesFeld: { x: 1 }
};

/** Genau die Form, die der NPC-Generator bis zu diesem Fix schrieb: das Volk
 *  als Schluessel seiner Namenstabelle ('mensch'), nicht als Anzeigename. */
const MANSHOON = {
    id: 2,
    name: 'Manshoon',
    role: 'Händler',
    race: 'mensch',
    description: 'Ruhig und beobachtend',
    locationId: null,
    chapter: '',
    filterId: null,
    quests: [],
    info: [],
    relationships: [],
    triggers: [],
    dialogs: [],
    relations: []
};

/** Ein Volk, das das Formular gar nicht kennt — nur ueber einen Import
 *  erreichbar, aber ein Import ist ein normaler Weg. */
const KESSA = {
    id: 3,
    name: 'Kessa',
    role: 'Fährfrau',
    race: 'Zentaur',
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
};

/** Ein Volk mit umgebenden Leerzeichen, wie ein Import es mitbringen kann —
 *  dieselbe feste Option wie 'Mensch', nur anders geschrieben. */
const LIRA = {
    id: 4,
    name: 'Lira',
    role: 'Bardin',
    race: ' Mensch ',
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
};

/** @param {object[]} npcs */
function seed(npcs) {
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
        npcs,
        locations: [
            { id: 1, name: 'Tiefwasser', description: '', filterId: null },
            {
                id: 2,
                name: 'Niewinter',
                description: '',
                filterId: null,
                links: [{ type: 'npcs', id: 1 }]
            }
        ],
        quests: [
            {
                id: 1,
                title: 'Drachenjagd',
                name: 'Drachenjagd',
                description: '',
                completed: false,
                links: [{ type: 'npcs', id: 1 }]
            }
        ],
        loot: [],
        spells: [],
        wiki: [],
        links: [],
        filters: [{ id: 1, name: 'Kapitel 1', color: 'red' }],
        factions: [{ id: 1, name: 'Harfner', symbol: '🎶' }],
        tags: [{ name: 'Wichtig', color: 'red' }],
        sessionNotes: [],
        encounters: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 2,
            npcs: Math.max(3, ...npcs.map(n => n.id)) + 1,
            locations: 3,
            quests: 2,
            encounters: 1,
            spells: 1,
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
 * Laedt breit, saet EINMAL je Tab und oeffnet die NPC-Ansicht. Die Saat
 * steht hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann,
 * was die App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} npcs
 * @param {{ width: number, height: number }} [kleiner] Erst NACH dem Laden
 *  verkleinern — `waitForAppReady()` wartet auf `.app-title`, und die ist im
 *  Mobil-Layout versteckt (wie in `kampfrunde.spec.js`).
 */
async function npcsLaden(page, npcs, kleiner) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('npc-formular-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('npc-formular-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(npcs)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN, sonst misst ein Speicher-Fall nichts:
    // repariert `load()` die Saat, schreibt `saveAutomatic()` etwa 1,4 s
    // spaeter den ganzen Stand aus D (siehe truhe-formular.spec.js). Erkennbar
    // daran, dass `_version` der Saat ueberschrieben wird; kommt binnen 4 s
    // keine, steht auch keine aus (bei dieser Saat gemessen: keine).
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
    await page.evaluate(() => window.switchView('npcs'));
    await expect(page.locator('#view-npcs')).toBeVisible();
    if (kleiner) {
        // Das Layout-Profil folgt der Fenstergroesse — dieselbe Wartezeit
        // wie in `truhe-formular.spec.js` und `kampfrunde.spec.js`.
        await page.setViewportSize(kleiner);
        await page.waitForTimeout(450);
    }
}

/** WEICHE Zusicherungen fuer die Ergebnisse eines Bedienwegs: ein roter Lauf
 *  soll JEDE gebrochene Zusage nennen, nicht nur die erste. Vorbedingungen,
 *  ohne die der naechste Schritt haengen bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

/** Ein NPC aus D, ohne `undefined`-Felder (dieselbe Form wie im Speicher).
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function npcInD(page, id) {
    return page.evaluate(
        id => JSON.parse(JSON.stringify(window.D.npcs.find(n => n.id === id) ?? null)),
        id
    );
}

/** Ein NPC aus dem Speicher.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function npcImSpeicher(page, id) {
    return page.evaluate(
        ([schluessel, id]) => {
            try {
                return (
                    (JSON.parse(localStorage.getItem(schluessel) || '{}').npcs || []).find(
                        n => n.id === id
                    ) ?? null
                );
            } catch {
                return '(nicht lesbar)';
            }
        },
        [SPEICHER, id]
    );
}

/** Alle NPC-Namen, in D bzw. im Speicher. Ohne ID: welche ID ein neuer NPC
 *  bekommt, entscheidet nextId(), nicht dieser Waechter.
 *  @param {import('@playwright/test').Page} page */
function namenInD(page) {
    return page.evaluate(() => window.D.npcs.map(n => n.name));
}
/** @param {import('@playwright/test').Page} page */
function namenImSpeicher(page) {
    return page.evaluate(schluessel => {
        try {
            return (JSON.parse(localStorage.getItem(schluessel) || '{}').npcs || []).map(
                n => n.name
            );
        } catch {
            return ['(nicht lesbar)'];
        }
    }, SPEICHER);
}

/** Die ID des NPC mit diesem Namen.
 *  @param {import('@playwright/test').Page} page
 *  @param {string} name */
function idVon(page, name) {
    return page.evaluate(name => window.D.npcs.find(n => n.name === name)?.id ?? null, name);
}

/** Dialoge bzw. Trigger eines NPC in D als `Titel:used` / `Bedingung:triggered`.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function zustand(page, id) {
    return page.evaluate(id => {
        const n = window.D.npcs.find(x => x.id === id);
        return {
            dialoge: (n?.dialogs || []).map(d => `${d.title}:${d.used}`),
            trigger: (n?.triggers || []).map(t => `${t.condition}:${t.triggered}`)
        };
    }, id);
}

/** Alle Felder des Formulars, wie das Template sie fuehrt.
 *  @param {import('@playwright/test').Page} page */
function formular(page) {
    return page.evaluate(() => {
        const wert = id =>
            /** @type {HTMLInputElement|null} */ (document.getElementById(id))?.value;
        const feld = (f, sel) =>
            /** @type {HTMLInputElement|null} */ (f.querySelector(sel))?.value || '';
        return {
            offen: document.getElementById('npc-modal')?.classList.contains('show'),
            titel: document.querySelector('#npc-modal .modal-title')?.textContent?.trim(),
            id: wert('edit-npc-id'),
            name: wert('npc-name'),
            rolle: wert('npc-role'),
            volk: wert('npc-race'),
            ort: wert('npc-location'),
            kapitel: wert('npc-chapter'),
            filter: wert('npc-filter'),
            fraktion: wert('npc-faction'),
            quests: wert('npc-quests'),
            info: wert('npc-info'),
            beziehungen: wert('npc-relations'),
            beschreibung: document.getElementById('npc-desc')?.textContent?.trim(),
            trigger: Array.from(
                document.querySelectorAll('#npc-triggers-container .npc-trigger-field')
            ).map(f => feld(f, '.trigger-cond')),
            dialoge: Array.from(
                document.querySelectorAll('#npc-dialogs-container .npc-dialog-field')
            ).map(f => feld(f, '.dialog-title'))
        };
    });
}

/** Das leere Formular im Anlege-Zustand. */
const LEER = {
    offen: true,
    titel: 'NPC hinzufügen',
    id: '',
    name: '',
    rolle: '',
    volk: '',
    ort: '',
    kapitel: '',
    filter: '',
    fraktion: '',
    quests: '',
    info: '',
    beziehungen: '',
    beschreibung: '',
    trigger: [],
    dialoge: []
};

/** "+ NPC" in der Werkzeugleiste — ueber Rolle und Namen, nicht ueber
 *  `data-action`: der Knopf ist derselbe vor und nach dem Fix.
 *  @param {import('@playwright/test').Page} page */
function plusNPC(page) {
    return page.locator('#view-npcs').getByRole('button', { name: '+ NPC', exact: true });
}

/**
 * Wartet, bis editNPC() Ort, Filter und Fraktion gesetzt hat — es tut das
 * erst per `setTimeout(…, 10)`. Ein 💾 davor speichert `locationId: null`,
 * und der Fall waere aus FREMDEM Grund rot.
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 */
async function auswahlGesetzt(page, id) {
    await page.waitForFunction(id => {
        const n = window.D.npcs.find(x => x.id === id);
        const passt = (feld, sel) =>
            !n ||
            !n[feld] ||
            /** @type {HTMLSelectElement} */ (document.getElementById(sel))?.value ===
                String(n[feld]);
        return (
            passt('locationId', 'npc-location') &&
            passt('filterId', 'npc-filter') &&
            passt('factionId', 'npc-faction')
        );
    }, id);
}

/** Liste → Eintrag → ✏️ im Detail.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
async function bearbeiten(page, id) {
    await page.locator(`#npc-list .npc-item[data-id="${id}"]`).click();
    await page.locator('#npc-detail-panel [data-action="edit-npc"]').click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    await auswahlGesetzt(page, id);
}

/** 💾 im Formular.
 *  @param {import('@playwright/test').Page} page */
async function speichern(page) {
    await page.locator('#npc-modal [data-action="call"][data-value="saveNPC"]').click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
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
 *  ihn neu, auch wenn der Inhalt gleich bleibt. Ohne ihn waere "der Speicher
 *  traegt den alten Stand" nicht von "es wurde gar nicht geschrieben" zu
 *  unterscheiden: ein Rundlauf, der nichts aendert, haette vor UND nach dem
 *  Speichern denselben Inhalt.
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

// ===========================================================================
// (1) ✏️ → 💾 OHNE AENDERUNG LAESST DEN NPC, WIE ER WAR
// ===========================================================================
test('(1) ✏️ → 💾 ohne Aenderung: der ganze NPC bleibt gleich — in D, im Speicher, nach dem Neuladen', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO, MANSHOON]);
    const vorher = await npcInD(page, 1);
    expect(vorher, 'die Saat muss so in D ankommen, sonst misst der Fall die Saat').toEqual(VOLO);

    await bearbeiten(page, 1);
    const rev = await revStand(page);
    await speichern(page);

    weich(await npcInD(page, 1), 'D nach ✏️ → 💾').toEqual(vorher);
    await geschriebenSeit(page, rev, '✏️ → 💾');
    weich(await npcImSpeicher(page, 1), 'localStorage nach ✏️ → 💾').toEqual(vorher);
    await weich(
        page.locator('#npc-detail-panel .npc-section-title', { hasText: 'Dialoge' })
    ).toContainText('2/3 verwendet');

    await page.reload();
    await waitForAppReady(page);
    weich(await npcInD(page, 1), 'D nach dem Neuladen').toEqual(vorher);

    weich(await fehler.alle(), 'der Rundlauf darf keinen Fehler hinterlassen').toEqual([]);
});

// ===========================================================================
// (2) DER TITEL SAGT, WAS DAS FORMULAR TUT
// ===========================================================================
test('(2) der Titel heisst beim Bearbeiten "NPC bearbeiten", beim Anlegen "NPC hinzufügen"', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    weich((await formular(page)).titel, 'Titel nach ✏️').toBe('NPC bearbeiten');
    await speichern(page);

    // WAECHTER (schon vor dem Fix gruen): nach dem Speichern heisst das
    // naechste "+ NPC" wieder "NPC hinzufügen" — der Titel darf nicht am
    // Bearbeiten haengen bleiben.
    await plusNPC(page).click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    weich((await formular(page)).titel, 'Titel nach 💾 → "+ NPC"').toBe('NPC hinzufügen');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (3) ✏️ → ABBRECHEN → "+ NPC" LEGT NEU AN UND UEBERSCHREIBT NICHT
// ===========================================================================
test('(3) nach abgebrochenem Bearbeiten legt "+ NPC" einen NEUEN NPC an', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO, MANSHOON]);
    const volo = await npcInD(page, 1);

    await bearbeiten(page, 1);
    await page.locator('#npc-modal .btn-group [data-action="hide-modal"]').click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);

    await plusNPC(page).click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    // WEICH: ein roter Lauf soll danach auch den Verlust nennen.
    weich(
        await formular(page),
        '"+ NPC" nach abgebrochenem Bearbeiten muss leer und im Anlege-Zustand sein'
    ).toEqual(LEER);
    await page.locator('#npc-name').fill('Elminster');
    await speichern(page);

    weich(await namenInD(page), 'D: Volo bleibt, Elminster kommt dazu').toEqual([
        'Volo Geddarm',
        'Manshoon',
        'Elminster'
    ]);
    weich(await npcInD(page, 1), 'Volo darf nicht ueberschrieben sein').toEqual(volo);
    await weich
        .poll(() => namenImSpeicher(page), { timeout: SOFORT_MS, message: 'localStorage' })
        .toEqual(['Volo Geddarm', 'Manshoon', 'Elminster']);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (4) ✏️ → ✕ → TASTE n OEFFNET LEER
// ===========================================================================
test('(4) nach ✏️ und ✕ oeffnet die Taste n ein leeres Formular', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page.locator('#npc-modal .modal-header [data-action="hide-modal"]').click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    // Vorbereitung, nicht die gemessene Handlung: der Fokus kehrt auf ✏️
    // zurueck, die Taste soll auf der Seite landen.
    await page.evaluate(() => /** @type {HTMLElement|null} */ (document.activeElement)?.blur());
    await page.keyboard.press('n');
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), 'Taste n nach ✏️ → ✕').toEqual(LEER);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (5) ✏️ → ESCAPE → BEFEHLSPALETTE "NEUER NPC" OEFFNET LEER
// ===========================================================================
test('(5) nach ✏️ und Escape oeffnet die Befehlspalette "Neuer NPC" ein leeres Formular', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page.keyboard.press('Escape');
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);

    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    // Erst tippen, wenn das Suchfeld den Fokus hat — ohne diese Wartestelle
    // stand in einem von zwei Laeufen "NPC generieren" oben, und Enter haette
    // den Generator geoeffnet statt des Formulars.
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type('Neuer NPC');
    // Enter fuehrt den OBERSTEN Treffer aus, die Suche ist um 80 ms entprellt.
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText('Neuer NPC');
    await page.keyboard.press('Enter');
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), 'Befehlspalette nach ✏️ → Escape').toEqual(LEER);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (6) ✕ AN EINEM DIALOG UND EINEM TRIGGER VERSCHIEBT KEINEN ZUSTAND
// ===========================================================================
test('(6) Dialog 1 und Trigger 1 entfernen: die uebrigen behalten IHREN Zustand', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page
        .locator('#npc-dialogs-container .npc-dialog-field')
        .first()
        .locator('[data-action="remove-field-stop"]')
        .click();
    await page
        .locator('#npc-triggers-container .npc-trigger-field')
        .first()
        .locator('[data-action="remove-field-stop"]')
        .click();
    await speichern(page);

    weich(await zustand(page, 1), 'Dialoge und Trigger nach dem Entfernen').toEqual({
        dialoge: ['Geheimnis:true', 'Abschied:false'],
        trigger: ['Nach Quest 1:false']
    });

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (7) EIN GEAENDERTER DIALOGTEXT BEHAELT SEIN "VERWENDET"
// ===========================================================================
test('(7) Dialogtext aendern: der Text kommt an, "verwendet" bleibt', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page
        .locator('#npc-dialogs-container .npc-dialog-field')
        .nth(1)
        .locator('.dialog-text')
        .click();
    await page.keyboard.press('End');
    await page.keyboard.type(' Psst!');
    await speichern(page);

    weich((await zustand(page, 1)).dialoge, 'used nach der Textaenderung').toEqual([
        'Begrüßung:true',
        'Geheimnis:true',
        'Abschied:false'
    ]);
    weich(await page.evaluate(() => window.D.npcs[0].dialogs[1].text), 'der geaenderte Text').toBe(
        '<b>Der Schatz</b> liegt im Keller. Psst!'
    );

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (8) EIN NEUER DIALOG IST UNVERWENDET, DIE ALTEN BLEIBEN, WIE SIE WAREN
// ===========================================================================
test('(8) "+ Dialog hinzufügen": der neue ist unverwendet, die alten behalten ihren Zustand', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page.locator('#npc-modal [data-action="call"][data-value="addDialogField"]').click();
    const neu = page.locator('#npc-dialogs-container .npc-dialog-field').nth(3);
    await neu.locator('.dialog-title').fill('Warnung');
    await neu.locator('.dialog-text').click();
    await page.keyboard.type('Geht nicht in den Keller.');
    await speichern(page);

    weich((await zustand(page, 1)).dialoge, 'used nach einem neuen Dialog').toEqual([
        'Begrüßung:true',
        'Geheimnis:true',
        'Abschied:false',
        'Warnung:false'
    ]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (9) ALLE DIALOGE ENTFERNEN ENTFERNT SIE
// ===========================================================================
test('(9) alle Dialoge per ✕ entfernen und speichern: der NPC hat keine Dialoge mehr', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    for (let i = 0; i < 3; i++) {
        await page
            .locator('#npc-dialogs-container .npc-dialog-field')
            .first()
            .locator('[data-action="remove-field-stop"]')
            .click();
    }
    await expect(page.locator('#npc-dialogs-container .npc-dialog-field')).toHaveCount(0);
    await speichern(page);

    weich(await zustand(page, 1), 'Dialoge weg, Trigger unberuehrt').toEqual({
        dialoge: [],
        trigger: ['Spieler bieten Gold:true', 'Nach Quest 1:false']
    });
    await weich
        .poll(async () => (await npcImSpeicher(page, 1))?.dialogs?.length, {
            timeout: SOFORT_MS,
            message: 'localStorage'
        })
        .toBe(0);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (10) DAS VOLK GEHT BEIM RUNDLAUF NICHT VERLOREN
// ===========================================================================
//
// Das Volk-Feld ist ein <select> mit festen Optionen. Ein Wert ohne passende
// Option — 'mensch' aus dem Generator, 'Zentaur' aus einem Import — lief beim
// Setzen still ins Leere, und 💾 schrieb ''. Die Schreibweise legt der Fix
// fest: 'mensch' wird die feste Option 'Mensch' (dieselbe Anzeige wie jeder
// von Hand angelegte Mensch), 'Zentaur' bleibt 'Zentaur'.
//
// ' Mensch ' (Leerzeichen aussen, Import) ist ebenfalls die feste Option —
// gemeldet von der Gegenpruefung, gemessen an 1b6c5c6: der Vergleich lief
// ohne trim, das Formular bekam eine ZWEITE Option ' Mensch ' neben 'Mensch'
// (19 statt 18), zwei gleich aussehende Eintraege.
test('(10) ✏️ → 💾 eines NPC mit Volk ohne passende Option: das Volk wird nicht leer', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO, MANSHOON, KESSA, LIRA]);

    await bearbeiten(page, 2);
    weich((await formular(page)).volk, 'Formular: Volk von Manshoon').toBe('Mensch');
    await speichern(page);
    const manshoon = (await npcInD(page, 2))?.race;
    weich(manshoon, 'Manshoon: Volk nach 💾 nicht leer').not.toBe('');
    weich(manshoon, 'Manshoon: Volk nach 💾').toBe('Mensch');

    await bearbeiten(page, 3);
    weich((await formular(page)).volk, 'Formular: Volk von Kessa').toBe('Zentaur');
    await speichern(page);
    weich((await npcInD(page, 3))?.race, 'Kessa: Volk nach 💾').toBe('Zentaur');

    await bearbeiten(page, 4);
    weich((await formular(page)).volk, 'Formular: Volk von Lira').toBe('Mensch');
    weich(
        await page
            .locator('#npc-race option')
            .evaluateAll(os =>
                os
                    .map(o => /** @type {HTMLOptionElement} */ (o).textContent?.trim())
                    .filter(t => t === 'Mensch')
            ),
        'Lira: genau EINE Option, die "Mensch" zeigt'
    ).toEqual(['Mensch']);
    await speichern(page);
    weich((await npcInD(page, 4))?.race, 'Lira: Volk nach 💾').toBe('Mensch');

    // Die Zusatzoption gilt nur fuer den NPC, der sie mitbrachte.
    await plusNPC(page).click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    weich(
        await page
            .locator('#npc-race option')
            .evaluateAll(os =>
                os.map(o => /** @type {HTMLOptionElement} */ (o).value).filter(v => v === 'Zentaur')
            ),
        '"+ NPC" danach bietet "Zentaur" nicht mehr an'
    ).toEqual([]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (11) BEIM ANLEGEN SIND DIE FRAKTIONEN WAEHLBAR
// ===========================================================================
//
// Nur auf einer FRISCHEN Seite aussagekraeftig: nach einem einzigen ✏️
// blieben die Optionen im Select stehen (clearFormFields() leert nur den
// Wert). Darum steht hier kein ✏️ vor "+ NPC".
test('(11) frisches "+ NPC": die Fraktionen aus D sind waehlbar und werden gespeichert', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await plusNPC(page).click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    weich(
        await page.locator('#npc-faction option').allTextContents(),
        'Fraktionen im frischen Formular'
    ).toEqual(['— Keine Fraktion —', '🎶 Harfner']);

    await page.locator('#npc-name').fill('Elminster');
    // Ohne die Option gibt es nichts zu waehlen — selectOption() wartete
    // sonst bis zum Testende; die fehlende Option nennt die Zusage oben.
    if (await page.locator('#npc-faction option[value="1"]').count()) {
        await page.locator('#npc-faction').selectOption('1');
    }
    await speichern(page);
    weich(
        await page.evaluate(() => window.D.npcs.find(n => n.name === 'Elminster')?.factionId),
        'der neue NPC gehoert den Harfnern'
    ).toBe(1);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (12) WAECHTER: Strg+Z NACH ✏️ → 💾 STELLT DEN STAND WIEDER HER
// ===========================================================================
test('(12) Waechter: Strg+Z nach ✏️ → 💾 stellt den NPC wieder her', async ({ page }) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);
    const vorher = await npcInD(page, 1);

    await bearbeiten(page, 1);
    await page.locator('#npc-role').fill('Weltreisender');
    const revVorher = await revStand(page);
    await speichern(page);
    // Erst das entprellte Schreiben des 💾 abwarten — sonst koennte es NACH
    // dem Strg+Z unten landen und dessen Messung verfaelschen.
    await geschriebenSeit(page, revVorher, '✏️ → 💾');
    weich(await undoKopf(page), 'der Rueckgaengig-Eintrag des Speicherns').toBe('NPC bearbeitet');
    weich(
        await page.evaluate(() =>
            JSON.parse(undoStack[undoStack.length - 1].state).npcs[0].dialogs.map(d => d.used)
        ),
        'der Eintrag haelt den Zustand VOR dem Speichern'
    ).toEqual([true, true, false]);

    const rev = await revStand(page);
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await npcInD(page, 1))?.role).toBe('Schriftsteller');
    weich(await npcInD(page, 1), 'D nach Strg+Z').toEqual(vorher);
    await geschriebenSeit(page, rev, 'Strg+Z');
    weich(await npcImSpeicher(page, 1), 'localStorage nach Strg+Z').toEqual(vorher);
    await page.reload();
    await waitForAppReady(page);
    weich(await npcInD(page, 1), 'D nach dem Neuladen').toEqual(vorher);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (13) ✏️ → ABBRECHEN → 🗑️ → "+ NPC ERSTELLEN" SPEICHERT, STATT STILL NICHTS ZU TUN
// ===========================================================================
//
// Der Knopf der LEEREN Liste (features/npcs/npc-render.js) ist der Weg, auf
// den man nach dem Loeschen des letzten NPC gestossen wird — oft nachdem man
// ihn sich in ✏️ angesehen hat. Vor dem Fix trug das Formular dann die ID
// des geloeschten NPC; saveNPC() fand sie nicht, speicherte NICHTS und
// meldete "NPC aktualisiert".
test('(13) nach ✏️, Abbrechen und 🗑️ legt "+ NPC erstellen" der leeren Liste an', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    page.on('dialog', d => d.accept());
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page.locator('#npc-modal .btn-group [data-action="hide-modal"]').click();
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);
    await page.locator('#npc-detail-panel [data-action="delete-npc"]').click();
    await expect(page.locator('#npc-list .npc-add-btn')).toBeVisible();

    await page.locator('#npc-list .npc-add-btn').click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    weich(await formular(page), '"+ NPC erstellen" nach dem Loeschen').toEqual(LEER);
    await page.locator('#npc-name').fill('Elminster');
    const stand = await meldungsStand(page);
    await speichern(page);

    weich(await namenInD(page), 'D').toEqual(['Elminster']);
    await weich
        .poll(() => namenImSpeicher(page), { timeout: SOFORT_MS, message: 'localStorage' })
        .toEqual(['Elminster']);
    weich(await meldungenSeit(page, stand), 'die Meldung des Speicherns').toContain(
        'success: NPC hinzugefügt'
    );
    weich(await undoKopf(page), 'der Rueckgaengig-Eintrag').toBe('NPC erstellt');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (14) VERSCHWINDET DER NPC UNTER DEM OFFENEN FORMULAR, GEHT DIE EINGABE NICHT VERLOREN
// ===========================================================================
//
// Strg+Z wirkt auch mit dem Fokus im Formular und nimmt hier das Anlegen
// zurueck, waehrend ✏️ denselben NPC offen hat. Das Formular haelt die
// Eingaben, die ID zeigt ins Leere. Vor dem Fix: nichts gespeichert,
// "NPC aktualisiert" gemeldet. Jetzt: als neuer NPC gespeichert, und die
// Meldung sagt genau das.
test('(14) ✏️ eines NPC, den Strg+Z unter dem Formular zuruecknimmt: 💾 speichert ihn neu und sagt es', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await plusNPC(page).click();
    await page.locator('#npc-name').fill('Neu A');
    await speichern(page);
    const neuA = await idVon(page, 'Neu A');
    expect(neuA, '"Neu A" muss angelegt sein').not.toBeNull();
    await bearbeiten(page, /** @type {number} */ (neuA));
    await page.locator('#npc-role').click();
    await page.keyboard.type('Wirt');
    await page.keyboard.press('Control+z');
    await expect.poll(() => namenInD(page)).toEqual(['Volo Geddarm']);
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);

    const stand = await meldungsStand(page);
    await speichern(page);
    weich(
        await page.evaluate(() =>
            window.D.npcs.map(n => `${n.name}${n.role ? ' (' + n.role + ')' : ''}`)
        ),
        'D: die Eingabe ist gespeichert'
    ).toEqual(['Volo Geddarm (Schriftsteller)', 'Neu A (Wirt)']);
    const meldungen = await meldungenSeit(page, stand);
    weich(meldungen, 'keine Erfolgsmeldung fuer ein Speichern, das nicht stattfand').not.toContain(
        'success: NPC aktualisiert'
    );
    weich(
        meldungen.some(m => m.startsWith('warning: ') && /neue[rn]? NPC/.test(m)),
        `die Meldung sagt, dass neu angelegt wurde — gemeldet: ${JSON.stringify(meldungen)}`
    ).toBe(true);
    weich(await undoKopf(page), 'kein leerer Eintrag "NPC bearbeitet"').toBe('NPC erstellt');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (15) DER ZUSTAND KOMMT VOM EINTRAG, AUS DEM DAS FELD GEBAUT WURDE
// ===========================================================================
test('(15) Strg+Z bei offenem Formular schiebt keinem Dialog fremden Zustand zu', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page
        .locator('#npc-dialogs-container .npc-dialog-field')
        .first()
        .locator('[data-action="remove-field-stop"]')
        .click();
    await speichern(page);
    weich((await zustand(page, 1)).dialoge, 'nach dem ersten 💾').toEqual([
        'Geheimnis:true',
        'Abschied:false'
    ]);

    await bearbeiten(page, 1);
    await page.locator('#npc-dialogs-container .dialog-title').first().click();
    await page.keyboard.press('Control+z');
    // Strg+Z nimmt das erste 💾 in D zurueck — drei Dialoge, das Formular
    // zeigt weiter zwei.
    await expect.poll(async () => (await zustand(page, 1)).dialoge.length).toBe(3);
    await speichern(page);

    const nachher = await page.evaluate(() => window.D.npcs[0].dialogs);
    weich(
        nachher.map(d => `${d.title}:${d.used}`),
        'jeder Dialog mit SEINEM Zustand — "Abschied" war nie verwendet'
    ).toEqual(['Geheimnis:true', 'Abschied:false']);
    weich(
        nachher.map(d => d.stimmung ?? null),
        'kein Dialog uebernimmt die Altfelder der Begruessung'
    ).toEqual([null, null]);

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (16) DER GENERATOR SCHREIBT DAS VOLK SO, WIE DAS FORMULAR ES KENNT
// ===========================================================================
test('(16) 🎲 Generator → speichern → ✏️ → 💾: das Volk ist die feste Option, vorher und nachher', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await page.locator('#view-npcs [data-action="show-npc-generator"]').click();
    await expect(page.locator('#npc-generator-modal')).toBeVisible();
    await page.locator('#npcg-volk-select').selectOption('zwerg');
    await page.locator('#npc-generator-modal [data-action="reroll-npc"]').click();
    await page.locator('#npc-generator-modal [data-action="save-generated-npc"]').click();
    await expect(page.locator('#npc-generator-modal')).toHaveCount(0);

    const id = await page.evaluate(() => window.D.npcs[window.D.npcs.length - 1].id);
    weich((await npcInD(page, id))?.race, 'Volk, wie der Generator es schreibt').toBe('Zwerg');

    await bearbeiten(page, id);
    weich((await formular(page)).volk, 'Formular: Volk des generierten NPC').toBe('Zwerg');
    await speichern(page);
    weich((await npcInD(page, id))?.race, 'Volk nach ✏️ → 💾').toBe('Zwerg');

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (17) DER WEG UEBER DAS POPUP (Ort → NPC → ✏️) — nur auf Daten
// ===========================================================================
//
// Jedes Oeffnen des NPC-Popups hinterlaesst "Element not found: #npc-popup"
// (showNPCPopup() ruft closeNPCPopup(), bevor es das Popup gibt) — ein
// eigener Befund. Darum wird hier GENAU diese Zeile aus dem Fehlerfang
// genommen, alle anderen bleiben.
test('(17) ✏️ aus dem NPC-Popup eines Ortes: Titel und Zustand wie aus dem Detail', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);
    const vorher = await npcInD(page, 1);

    await page.evaluate(() => window.switchView('locations'));
    await page.locator('.loc-item[data-id="1"]').click();
    await page
        .locator('#view-locations [data-action="show-npc-popup"][data-id="1"]')
        .first()
        .click();
    await page.locator('#npc-popup [data-action="edit-npc-close-popup"]').click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    await auswahlGesetzt(page, 1);
    weich((await formular(page)).titel, 'Titel aus dem Popup').toBe('NPC bearbeiten');
    await speichern(page);

    weich(await npcInD(page, 1), 'D nach ✏️ → 💾 aus dem Popup').toEqual(vorher);
    weich(
        (await fehler.alle()).filter(f => !f.includes('Element not found: #npc-popup')),
        'kein Fehler ausser dem benannten Popup-Rauschen'
    ).toEqual([]);
});

// ===========================================================================
// (18) WAECHTER: EIN ANLEGEN-ENTWURF UEBERLEBT EIN VERSEHENTLICHES ESCAPE
// ===========================================================================
//
// Der neue Anlegen-Weg leert das Formular NUR, wenn ein Bearbeiten Reste
// hinterliess (#edit-npc-id gesetzt). Ein echter Entwurf bleibt stehen, wie
// vor dem Fix — gemessen: "Entwurf" mit einem Dialog, Escape, "+ NPC", beides
// noch da.
//
// DIE FRAKTION DES ENTWURFS gehoert dazu. showNewNPCModal() baut die
// Fraktionsoptionen bei jedem Oeffnen neu (fillNPCFactionSelect() setzt
// innerHTML) und muss die gewaehlte danach wieder setzen. Bis zur
// Gegenpruefung prueft dieser Fall sie nicht: gemessen blieb er gruen, als
// genau diese Zeile herausgenommen war. Vor dem Fix gab es beim Anlegen
// keine Fraktion zu waehlen — dort ist DIESE Zusage rot, der Rest gruen.
test('(18) Waechter: ein Anlegen-Entwurf ueberlebt Escape und erneutes "+ NPC"', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await plusNPC(page).click();
    await page.locator('#npc-name').fill('Entwurf');
    await page.locator('#npc-modal [data-action="call"][data-value="addDialogField"]').click();
    await page.locator('#npc-dialogs-container .npc-dialog-field .dialog-title').fill('Gruss');
    // Ohne die Option gibt es nichts zu waehlen — siehe Fall (11).
    if (await page.locator('#npc-faction option[value="1"]').count()) {
        await page.locator('#npc-faction').selectOption('1');
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);

    await plusNPC(page).click();
    await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
    const f = await formular(page);
    weich(
        { id: f.id, name: f.name, dialoge: f.dialoge, fraktion: f.fraktion, titel: f.titel },
        'der Entwurf'
    ).toEqual({
        id: '',
        name: 'Entwurf',
        dialoge: ['Gruss'],
        fraktion: '1',
        titel: 'NPC hinzufügen'
    });

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (19) "NEU" BEI OFFENEM BEARBEITEN-FORMULAR VERWIRFT NICHTS
// ===========================================================================
//
// Gemeldet von der Gegenpruefung, gemessen an 1b6c5c6: der neue Anlegen-Weg
// leerte das Formular, sobald #edit-npc-id gesetzt war — auch WAEHREND es
// zum Bearbeiten offen ist. Ein offenes Formular ist aber kein Rest eines
// abgebrochenen Bearbeitens, sondern die laufende Arbeit. Den Fokus auf BODY
// bringt schon ein ✕ an einem Dialog (der Knopf verschwindet mit seinem
// Feld) oder ein Klick auf eine Ueberschrift; nach "+ Dialog hinzufügen"
// liegt er auf dem Knopf. In allen drei Lagen erreicht die Taste n den
// Anlegen-Zweig, und alle Eingaben waren weg (ID '', Name '', 0 Dialoge,
// Titel "NPC hinzufügen") — das folgende 💾 speicherte nichts. Ebenso die
// Befehlspalette "Neuer NPC".
//
// Vor dem Fix (429ad8f) blieben die Eingaben zwar stehen, aber der Weg
// rief showModal() → populateSelects(), und das setzte Ort und Filter still
// auf leer: 💾 schrieb locationId und filterId null. Darum vergleicht der
// Fall das GANZE Formular, nicht nur ID und Namen.
test('(19) Taste n und Befehlspalette bei offenem ✏️: das Formular bleibt, wie es ist', async ({
    page
}) => {
    test.setTimeout(60000);
    const fehler = fehlerFangen(page);
    await npcsLaden(page, [VOLO]);

    await bearbeiten(page, 1);
    await page.locator('#npc-role').fill('Weltreisender');
    await page
        .locator('#npc-dialogs-container .npc-dialog-field')
        .first()
        .locator('.dialog-text')
        .click();
    await page.keyboard.press('End');
    await page.keyboard.type(' Willkommen!');
    await page
        .locator('#npc-dialogs-container .npc-dialog-field')
        .last()
        .locator('[data-action="remove-field-stop"]')
        .click();
    const vorher = await formular(page);
    // Ohne den Titel: den prueft Fall (2), und vor dem Fix hielte er diesen
    // Fall auf, bevor er den Verlust von Ort und Filter zeigen kann.
    expect(
        { id: vorher.id, ort: vorher.ort, filter: vorher.filter, dialoge: vorher.dialoge },
        'Vorbedingung: das Bearbeiten-Formular mit Ort, Filter und zwei Dialogen'
    ).toEqual({
        id: '1',
        ort: '1',
        filter: '1',
        dialoge: ['Begrüßung', 'Geheimnis']
    });

    // (a) ✕ hat den Fokus auf BODY fallen lassen.
    expect(
        await page.evaluate(() => document.activeElement?.tagName),
        'Vorbedingung: nach ✕ an einem Dialog liegt der Fokus auf BODY'
    ).toBe('BODY');
    await page.keyboard.press('n');
    weich(await formular(page), 'Taste n, Fokus auf BODY nach ✕').toEqual(vorher);

    // (b) Klick auf eine Ueberschrift des Formulars.
    await page.locator('#npc-modal .char-section-title').first().click();
    await page.keyboard.press('n');
    weich(await formular(page), 'Taste n nach Klick auf eine Ueberschrift').toEqual(vorher);

    // (c) "+ Dialog hinzufügen" — der Fokus liegt danach auf dem Knopf.
    await page.locator('#npc-modal [data-action="call"][data-value="addDialogField"]').click();
    const mitNeuemDialog = { ...vorher, dialoge: [...vorher.dialoge, ''] };
    weich(await formular(page), 'nach "+ Dialog hinzufügen"').toEqual(mitNeuemDialog);
    await page.keyboard.press('n');
    weich(await formular(page), 'Taste n, Fokus auf "+ Dialog hinzufügen"').toEqual(mitNeuemDialog);

    // (d) Befehlspalette "Neuer NPC" — eine ausdrueckliche Handlung, aber
    // ohne Rueckfrage darf sie die laufende Bearbeitung ebenso wenig wegwerfen.
    await page.keyboard.press('Control+Shift+K');
    await expect(page.locator('.cp-overlay')).toBeVisible();
    await expect(page.locator('.cp-input')).toBeFocused();
    await page.keyboard.type('Neuer NPC');
    await expect(page.locator('#cp-results-list .cp-result').first()).toContainText('Neuer NPC');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cp-overlay')).toBeHidden();
    weich(await formular(page), 'Befehlspalette "Neuer NPC"').toEqual(mitNeuemDialog);

    // Ohne die ID gaebe es nichts mehr zu speichern — dann ist der Rest
    // bedeutungslos, und die weichen Zusagen oben nennen den Grund.
    expect((await formular(page)).id, 'die Bearbeitung muss noch offen sein').toBe('1');
    await speichern(page);
    const volo = await npcInD(page, 1);
    weich(
        {
            name: volo?.name,
            role: volo?.role,
            locationId: volo?.locationId,
            filterId: volo?.filterId,
            factionId: volo?.factionId,
            dialoge: (volo?.dialogs || []).map(d => `${d.title}:${d.used}`),
            text: volo?.dialogs?.[0]?.text
        },
        'D: die Eingaben sind gespeichert, Ort und Filter stehen noch'
    ).toEqual({
        name: 'Volo Geddarm',
        role: 'Weltreisender',
        locationId: 1,
        filterId: 1,
        factionId: 1,
        dialoge: ['Begrüßung:true', 'Geheimnis:true'],
        text: 'Ah, Abenteurer! Willkommen!'
    });

    weich(await fehler.alle(), 'kein Fehler').toEqual([]);
});

// ===========================================================================
// (20) AM TELEFON: "+ NPC" MIT DEM FINGER, MIT FRAKTION
// ===========================================================================
//
// Am Telefon gibt es kein ✏️ (das NPC-Detail ist bis 900 px ausgeblendet,
// gemessen bei 390 px: weder ✏️ noch der Orts-Chip sichtbar) — aber den
// Anlegen-Weg. Vor dem Fix bot er dort wie am Schreibtisch nur
// "— Keine Fraktion —" an (gemessen von der Gegenpruefung am Buendel zu
// 429ad8f). Getippt wird mit `.tap()`.
//
// DER ABSTAND ZWISCHEN ZWEI TIPPERN IST NOETIG, nicht Geduld:
// `initTouchOptimizations()` (`systems/avatars.js`) ruft `preventDefault()`
// auf jedem `touchend` an einem Knopf, der weniger als 300 ms nach dem
// vorigen kommt (Doppeltipp-Zoom-Sperre) — dann entsteht KEIN `click`. Siehe
// Fall (6) in `truhe-formular.spec.js`.
test.describe('(20) Telefon 390x844', () => {
    test.use({ viewport: TELEFON, hasTouch: true, isMobile: true });

    /** Tippt nach mehr als 300 ms Abstand zum vorigen Tipper.
     *  @param {import('@playwright/test').Locator} ziel */
    async function tippen(ziel) {
        await ziel.page().waitForTimeout(350);
        await ziel.tap();
    }

    test('(20) "+ NPC" per Finger: leer, Fraktionen waehlbar, 💾 legt an', async ({ page }) => {
        test.setTimeout(60000);
        const fehler = fehlerFangen(page);
        await npcsLaden(page, [VOLO], TELEFON);
        await expect(page.locator('html'), 'Vorbedingung: Mobil-Layout').toHaveAttribute(
            'data-layout',
            'mobile'
        );
        await expect(
            page.locator('#npc-detail-panel [data-action="edit-npc"]'),
            'Vorbedingung: am Telefon gibt es kein ✏️'
        ).toBeHidden();

        await tippen(plusNPC(page));
        await expect(page.locator('#npc-modal')).toHaveClass(/\bshow\b/);
        weich(await formular(page), 'frisches "+ NPC" am Telefon').toEqual(LEER);
        weich(
            await page.locator('#npc-faction option').allTextContents(),
            'Fraktionen am Telefon'
        ).toEqual(['— Keine Fraktion —', '🎶 Harfner']);

        await page.locator('#npc-name').fill('Elminster');
        if (await page.locator('#npc-faction option[value="1"]').count()) {
            await page.locator('#npc-faction').selectOption('1');
        }
        const stand = await meldungsStand(page);
        await tippen(page.locator('#npc-modal [data-action="call"][data-value="saveNPC"]'));
        await expect(page.locator('#npc-modal')).not.toHaveClass(/\bshow\b/);

        // Ohne ID — welche ein neuer NPC bekommt, entscheidet nextId().
        weich(
            await page.evaluate(() => window.D.npcs.map(n => `${n.name}:${n.factionId ?? null}`)),
            'D: Volo bleibt, Elminster kommt mit Fraktion dazu'
        ).toEqual(['Volo Geddarm:1', 'Elminster:1']);
        weich(await meldungenSeit(page, stand), 'die Meldung des Speicherns').toContain(
            'success: NPC hinzugefügt'
        );

        weich(await fehler.alle(), 'Telefon: kein Fehler').toEqual([]);
    });
});
