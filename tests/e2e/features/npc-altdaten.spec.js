// @ts-check
/**
 * NPC-Name und Volk aus Altdaten brechen keine Darstellung (NPC-NAME)
 * ===================================================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT: **ein NPC, dessen Name fehlt, `null`,
 * eine Zahl oder ein Wahrheitswert ist, oder dessen Volk kein Text ist,
 * nimmt dem Nutzer nichts weg** — die NPC-Liste zeigt alle Eintraege, ein
 * NPC ohne Namen steht als "Unbenannt" da, Orts-, Kopf- und Telefonsuche
 * finden, die Initiative zeichnet; und ein Tag, das die App selbst ueber 🏷️
 * schreibt, steht im NPC-Detail als Text, nicht als "[object Object]".
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Gemessen mit dieser Datei am Stand 8702f84a (PR #21 SENKEN), Chromium,
 * dev-Buendel, 1440x900 bzw. 390x844, echte Klicks und Tasten, Saat Anna,
 * Cora, Zora (Zora traegt das Altdatum) und die Orte Taverne und Markt, Start
 * aus dem Speicher. So war es VOR dem Fix:
 *
 *   K0   drei gueltige NPCs              richtig (Kontrolle)
 *   W1   Name fehlt, letzte Lage         0 Eintraege, "⚠️ Anzeigefehler" —
 *   W1m  Name fehlt, mittlere Lage       `Cannot read properties of undefined
 *                                        (reading 'localeCompare')`
 *   W1v  Name fehlt, erste Lage          3 Eintraege, kein Fehler — aber Zora
 *                                        steht in Liste und Detail ohne Namen
 *                                        da, nicht als "Unbenannt" (E1)
 *   W2   Name 42, letzte Lage            0 Eintraege, Anzeigefehler,
 *   W4   Name true, letzte Lage          `a.name.localeCompare is not a function`
 *   W2v  Name 42, erste Lage             richtig: "42" in Liste und Detail
 *   W3   Name null, letzte Lage          0 Eintraege, Anzeigefehler
 *   W5   Volk 5, erste Lage              0 Eintraege, Anzeigefehler,
 *   W6   Volk {x:1}, letzte Lage         `(npc.race || "").toLowerCase is not
 *                                        a function` — in jeder Lage
 *   W7   Ortssuche "mar", ohne Namen     2 statt 1 Ort, je Taste ein TypeError
 *   W8   Ortssuche "mar", Name 42        (`search-input`)
 *   W9   Kopfsuche "Wirt", Name 42       Trefferliste zu, 0 Treffer, `pageerror:
 *                                        text.toLowerCase is not a function`
 *   W10  Initiative, Gegner ohne         0 Zeilen, "Anzeigefehler
 *        Encounter, Name 42              itemName.toLowerCase is not a function"
 *   W11  Tag {name, color} (die Form,    Detail zeigt "[object Object]" statt
 *        die 🏷️ selbst schreibt)          "Wichtig"
 *   W11t Tag als Text                    richtig (Gegenfall)
 *   W13  🎲 Generator, Namenstabelle     in D steht `name: 7` (Zahl); die Liste
 *        mit `{text: 7}`, "Als NPC       bleibt beim alten Stand (3), das 💾
 *        speichern"                      wirft `a.name.localeCompare`; nach dem
 *                                        Neuladen 0 Eintraege, Anzeigefehler
 *   W14  Kampagnen-Import "Ersetzen",    "Import OK", danach 0 Eintraege,
 *        NPC ohne Namen, letzte Lage     Anzeigefehler — auch nach dem Neuladen
 *   W15  Telefon, 🔍 "Wirt", Name 42      0 Treffer, je Taste ab der zweiten ein
 *                                        TypeError (`performMobileSearch`)
 *
 * Bei allen Faellen mit kaputter Liste kommen die Fehlerzeilen schon beim
 * Laden dazu: das Startzeichnen ruft renderNPCList() und wirft dort zuerst.
 *
 * DIE URSACHE (Stand 8702f84a): die Darstellung liest Name und Volk, als
 * waeren sie immer Text — die Sortierung `a.name.localeCompare(b.name)`
 * (features/npcs/npc-render.js:112), `(npc.race || '').toLowerCase()` in
 * getNPCIcon() (:43; `||` rettet nur Falsches, keine Zahl), die Ortssuche
 * `n.name.toLowerCase()` (features/locations/locations-render.js:105), die
 * Unscharfsuche hinter Kopf- und Telefonsuche und `findByName` der
 * Initiative. Das Tag-Detail schreibt `esc(t)` und macht aus dem Objekt, das
 * 🏷️ seit jeher speichert, "[object Object]" (seit 254ff3b2). Herein kommen
 * die Werte ueber Kampagnen-Import und Start: die Datengrenze setzte `name`
 * nur bei Objekt/Liste auf '' und liess `race` unberuehrt — und zur Laufzeit
 * ueber den Generator, der mit `e.text || e` (npc-generator.js:51) eine Zahl
 * oder den ganzen Tabelleneintrag als Namen uebernimmt.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DIE REGELN (Vertrag NPC-NAME), die diese Datei prueft
 *
 *   N1  Grenze: `npcs[].name` und `npcs[].race` werden Text (Zahl/Wahrheits-
 *       wert verlustfrei, E2/E3; Objekt/Liste und ein fehlender Name ''). Im
 *       Einzelnen in tests/unit/datengrenze.test.js; hier W13 (Neuladen),
 *       W14 und mittelbar alle Start-Faelle.
 *   N2  Darstellung total: Sortierung, getNPCIcon(), Ortssuche lesen jeden
 *       Wert, ein NPC ohne Namen steht in Liste und Detail als "Unbenannt"
 *       (E1), ein Tag wird in beiden Formen gelesen (E4). W1–W11.
 *   N3  Generator: ein Tabelleneintrag wird nur mit Text Name. W13 sofort.
 *
 * WARUM ERSTE UND LETZTE LAGE (E8, Kritik K1): ob die Sortierung an einem
 * kaputten Namen wirft, haengt nicht nur an seiner Lage, sondern an der
 * Engine — daran, welches Paar ihr Sortierverfahren in welcher Reihenfolge
 * vergleicht. Gemessen (Kritik K1, 60 Reihen n = 2…500): Chromium wirft bei
 * Lage 0 in 0 von 60, bei Lage 1 und der letzten in 60 von 60; Firefox genau
 * umgekehrt — Lage 0 in 60 von 60, Lage 1 in 39, die letzte in 0. Darum
 * steht hier am Stand die Liste in W1v/W2v (erste Lage; W1v ist nur an E1
 * rot) und bricht in W1/W2 (letzte Lage). Die Entwuerfe dieser Faelle in
 * Firefox gefahren (Kritik, W-firefox): W1–W4 gruen, W1v und W2v rot; die
 * mittlere Lage (W1m, die fruehere Saat von ruecksprung-rundlauf (12)) ist
 * in beiden Engines rot. Die CI faehrt nur Chromium (E8: kein zweites
 * Engine-Projekt). Mit beiden Lagen urteilt dieselbe Datei trotzdem in jeder
 * Engine: in Chromium faengt die letzte Lage den Fehler, in Firefox die
 * erste. Gruen in beiden Lagen und beiden Engines wird sie nur mit einer
 * Sortierung, die JEDEN Wert vergleichen kann — nicht mit einer, die den
 * kaputten Eintrag zufaellig dorthin legt, wo die eine Engine nicht
 * hinsieht. Das Volk (W5/W6) wirft schon heute in jeder Lage.
 *
 * WIE GEURTEILT WIRD: am DOM — Eintraege, "Anzeigefehler", Name in Liste und
 * Detail, "Unbenannt", "[object Object]", Treffer, Zeilen. Im
 * Produktionsbuendel (DEBUG_MODE aus) hinterlassen die Listenfehler KEINE
 * Logzeile (Kritik, W-prod); der Nutzer sieht nur das DOM. Zusaetzlich darf
 * kein `pageerror`, kein `console.error` und keine Zeile im Fehlerlog der App
 * stehen, ausser der einen gemessenen "Element not found"-Meldung der
 * Kontrolle (siehe ERWARTET_TELEFON). Gezaehlt wird vom Laden an.
 *
 * WIE DIE FAELLE ROT SIND: an den weichen Zusagen (Eintraege, Anzeigefehler,
 * Name, Treffer, Fehlerliste) — ein roter Lauf nennt jede gebrochene. Hart
 * sind die Vorbedingungen, ohne die der Weg nichts sagt: beide Orte stehen vor
 * der Suche, das Detail zeigt Anna, das Telefon-Layout greift und die Suche
 * ist offen, die Vorschau des Generators zeigt "7" und sein 💾 legt einen NPC
 * in D und im Speicher an, der Import meldet "Import OK" und D traegt die drei
 * NPCs der Datei. Alle sind am Stand erfuellt (gemessen).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WAS HIER BEWUSST NICHT GEPRUEFT WIRD
 *
 * Listenfelder als Text oder mit `null` (`dialogs`, `triggers`, `tags`,
 * `relations`, `links` — sperren Detail, Popup und 🗑️; PR NPC-LISTENFELDER),
 * dieselbe Klasse in den uebrigen Listen (PR LISTEN-QUER), der Reiter-Import
 * 📥 (heute kein Eingang, `#import-modal` fehlt), Backup, Migration und
 * Kampagnenwechsel (laufen ueber dieselbe Grenze; die Verdrahtung prueft
 * tests/unit/datengrenze.test.js), Firefox als eigenes Projekt (E8).
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady, navigateToTab } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit — wie die Messung. */
const BREIT = { width: 1440, height: 900 };
/** Telefon — wie globale-suche-ziel.spec.js (9): breit laden, dann
 *  verkleinern; das Layoutprofil folgt der Fenstergroesse. (Direkt schmal
 *  geladen ist `.app-title` verborgen, und waitForAppReady() wartet auf ihn.) */
const TELEFON = { width: 390, height: 844 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Wie lange "sofort" dauern darf: `save()` entprellt 300 ms. */
const SOFORT_MS = 4000;

/** WEICHE Zusicherungen fuer die Zusagen des Vertrags: ein roter Lauf soll
 *  JEDE gebrochene Zusage nennen (Eintraege, Anzeigefehler, Name, Fehler),
 *  nicht nur die erste. Vorbedingungen, ohne die der naechste Schritt haengen
 *  bliebe, bleiben hart. */
const weich = expect.configure({ soft: true });

// ===========================================================================
// SAAT
// ===========================================================================

/** Markiert ein Feld, das in der Saat FEHLEN soll (nicht `undefined` — das
 *  verschwaende erst in JSON.stringify, und die Absicht stuende nicht da). */
const FEHLT = Symbol('fehlt');

const ORTE = [
    { id: 1, name: 'Taverne', type: 'Gebaeude', description: '', tags: [] },
    { id: 2, name: 'Markt', type: 'Platz', description: '', tags: [] }
];

/**
 * Ein gewoehnlicher NPC. Alle drei sind Wirte: die Such-Faelle tippen "Wirt"
 * und erwarten alle drei Treffer, auch den mit dem kaputten Namen.
 * @param {number} id
 * @param {string} name
 * @param {number} ortId
 * @param {Record<string, any>} [extra]
 */
function npc(id, name, ortId, extra = {}) {
    return { id, name, role: 'Wirt', race: 'Mensch', description: '', locationId: ortId, ...extra };
}
/** @param {Record<string, any>} [extra] */
const ANNA = extra => npc(1, 'Anna', 1, extra);
/** @param {Record<string, any>} [extra] */
const CORA = extra => npc(2, 'Cora', 2, extra);
/**
 * Zora — der Eintrag mit dem Altdatum (immer ID 3), sonst wie die anderen.
 * @param {string} [feld]
 * @param {any} [wert] - FEHLT entfernt das Feld
 */
function zora(feld, wert) {
    /** @type {Record<string, any>} */
    const o = npc(3, 'Zora', 1);
    if (feld) {
        if (wert === FEHLT) delete o[feld];
        else o[feld] = wert;
    }
    return o;
}

/** Ein Gegner ohne Encounter: die Initiative sucht seinen Namen ueber
 *  `findByName` in ALLEN Sammlungen, auch in den NPCs. */
const GEGNER = {
    combatants: [
        {
            id: 1,
            name: 'Goblin',
            type: 'enemy',
            initiative: 12,
            initBonus: 0,
            currentHp: 7,
            maxHp: 7,
            ac: 12,
            effects: []
        }
    ],
    currentTurn: 0,
    round: 1
};

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
        characters: [],
        npcs: [],
        locations: ORTE,
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
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        ...teile
    };
    /** @param {any[]} liste */
    const naechste = liste =>
        Math.max(0, ...(liste || []).map(x => (typeof x.id === 'number' ? x.id : 0))) + 1;
    s._nextId = {
        characters: 1,
        npcs: naechste(s.npcs),
        locations: naechste(s.locations),
        quests: 1,
        encounters: 1,
        spells: 1,
        loot: 1,
        items: 1,
        wiki: 1,
        links: 1,
        sessionNotes: 1,
        randomTables: naechste(s.randomTables),
        filters: 1,
        factions: 1
    };
    return s;
}

/**
 * Laedt, saet EINMAL je Tab und bleibt auf der Startansicht. Die Saat steht
 * hinter einer sessionStorage-Sperre: ein `page.reload()` liest dann, was die
 * App gespeichert hat, statt die Saat neu zu schreiben.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} teile
 */
async function laden(page, teile) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('npc-altdaten-gesaet')) {
                    localStorage.setItem(schluessel, JSON.stringify(s));
                    sessionStorage.setItem('npc-altdaten-gesaet', '1');
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
        },
        [SPEICHER, seed(teile)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // Die fremde Speicherung nach load() abwarten (wie ruecksprung-rundlauf):
    // sonst schreibt sie spaeter den ganzen Stand aus D und ein Neuladen-Fall
    // liest, was sie hinterliess, statt was der Weg schrieb.
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
            { timeout: SOFORT_MS }
        )
        .catch(() => {});
}

// ===========================================================================
// FEHLER EINSAMMELN
// ===========================================================================

/**
 * Faengt jeden Fehler des ganzen Falls, vom Laden an: `pageerror`,
 * `console.error` und das Fehlerlog der App (die Reiter-Verwaltung meldet
 * einen geworfenen Renderer dort und als `console.error`). "Failed to load
 * resource" ist Netzrauschen (Schriften unter file://). Das Fehlerlog lebt im
 * Speicher der Seite — `sichern()` liest es VOR jedem Neuladen.
 *
 * Eine `console.error`-Zeile wird aus ihren ARGUMENTEN gebaut, nicht aus
 * `m.text()`: die App meldet `console.error('[$]:', error)`
 * (render/helpers.js), und `m.text()` gibt den Error-Parameter je Engine
 * anders aus — Chromium "[$]: Error: Element not found: #…", Firefox nur
 * "[$]: Error" (gemessen). Ein Error wird darum ueber `String(error)` gelesen
 * ("Error: <Meldung>", in beiden Engines gleich), ein Text bleibt Text; steht
 * ein anderes Argument dabei, oder geht das Auslesen schief (Neuladen), gilt
 * `m.text()`. Gezaehlt wird jede Zeile so oder so — nur ihr Wortlaut haengt
 * davon ab, und an ihm haengt ERWARTET_TELEFON.
 * @param {import('@playwright/test').Page} page
 */
function fehlerFangen(page) {
    /** @type {string[]} */
    const fehler = [];
    /** @type {string[]} */
    const gesichert = [];
    /** @type {Promise<void>[]} */
    const offen = [];
    page.on('pageerror', e => fehler.push('pageerror: ' + e.message));
    page.on('console', m => {
        if (m.type() !== 'error' || m.text().startsWith('Failed to load resource')) return;
        offen.push(
            Promise.all(
                m
                    .args()
                    .map(a =>
                        a.evaluate(v =>
                            v instanceof Error ? String(v) : typeof v === 'string' ? v : null
                        )
                    )
            )
                .then(teile => (teile.every(t => t !== null) ? teile.join(' ') : m.text()))
                .catch(() => m.text())
                .then(text => {
                    fehler.push('console.error: ' + text.split('\n')[0]);
                })
        );
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
            await Promise.all(offen);
            gesichert.push(...(await appLog()));
        },
        /** Alles bisher Gefangene plus das Fehlerlog der App. */
        async alle() {
            await Promise.all(offen);
            return [...fehler, ...gesichert, ...(await appLog())];
        }
    };
}

/** Die einzige Meldung, die die Wege dieser Datei schon mit gueltigen NPCs
 *  hinterlassen: `$()` meldet im DEBUG_MODE das Dialogfenster der mobilen
 *  Suche, das erst beim ersten Oeffnen angelegt wird — als `console.error`
 *  und im Fehlerlog der App (vorbestehend, globale-suche-ziel.spec.js (9)).
 *  Gemessen beim Schreiben, in Chromium: alle Wege dieser Datei einmal mit
 *  drei gueltigen NPCs gefahren (fuer W7–W10, W13–W15 eine Kopie mit
 *  gueltiger Saat, nicht Teil der Datei) — nur W15 meldet etwas, genau diese
 *  zwei Zeilen; K0, W2v und W11t melden nichts. Ein anderer Weg hat keine
 *  Ausnahme. Dass dasselbe Muster auch in Firefox passt, macht erst
 *  fehlerFangen(), das die `console.error`-Zeile aus ihren Argumenten liest:
 *  mit `m.text()` stand dort nur "[$]: Error", und W15 war in Firefox bei
 *  heiler App rot (gemessen). */
const ERWARTET_TELEFON = [/Element not found: #mobile-search-modal$/];

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
// HILFEN
// ===========================================================================

/** Ein Reiter per Klick, wie ein Nutzer (Gruppe erst oeffnen).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} ansicht */
async function zuAnsicht(page, ansicht) {
    await navigateToTab(page, ansicht);
    await expect(page.locator(`#view-${ansicht}`)).toBeVisible();
}

/** Die Liste steht: `anzahl` Eintraege, kein "Anzeigefehler".
 *  @param {import('@playwright/test').Page} page
 *  @param {number} anzahl
 *  @param {string} wann */
async function listeSteht(page, anzahl, wann) {
    const liste = page.locator('#npc-list');
    await weich(
        liste.locator('.npc-item'),
        `${wann}: ${anzahl} Eintraege in der NPC-Liste`
    ).toHaveCount(anzahl);
    await weich(liste, `${wann}: kein "Anzeigefehler" in der NPC-Liste`).not.toContainText(
        'Anzeigefehler'
    );
}

/** Nirgends in der Ansicht steht "[object Object]" (sichtbarer Text).
 *  @param {import('@playwright/test').Page} page
 *  @param {string} [ansicht] */
async function keinObjektText(page, ansicht = 'npcs') {
    await weich(
        page.locator(`#view-${ansicht}`),
        `nirgends in der Ansicht ${ansicht} "[object Object]"`
    ).not.toContainText('[object Object]', { useInnerText: true });
}

/** Was ein NPC ohne Namen zeigt (E1). */
const UNBENANNT = 'Unbenannt';

/**
 * E1 verlangt ein GEDIMMTES "Unbenannt": die vorhandene Dimm-Tinte, kein neuer
 * Farbwert. Geprueft an der berechneten Farbe, nicht nur am Text — der Text
 * allein war auch mit einem nackten 'Unbenannt' ohne Dimmung gruen (Pruefer-
 * Mutante, gemessen). `traeger` ist der Namensplatz (Listeneintrag oder
 * Detail), `gleichWie` das Element derselben Flaeche, das die Dimm-Tinte
 * traegt (.npc-item-meta bzw. .npc-detail-subtitle).
 * @param {import('@playwright/test').Locator} traeger
 * @param {string} gleichWie - Selektor, relativ zur Wurzel des Bereichs
 * @param {import('@playwright/test').Locator} bereich
 * @param {string} wo
 */
async function unbenanntGedimmt(traeger, gleichWie, bereich, wo) {
    const marke = traeger.locator('.npc-unbenannt');
    await weich(marke, `${wo}: "Unbenannt" traegt .npc-unbenannt`).toHaveText(UNBENANNT);
    if ((await marke.count()) !== 1) return;
    const farben = await bereich.evaluate(
        (wurzel, [sel, rolle]) => {
            const farbe = /** @param {Element|null} e */ e =>
                e ? getComputedStyle(e).color : null;
            return {
                marke: farbe(wurzel.querySelector('.npc-unbenannt')),
                dimm: farbe(wurzel.querySelector(sel)),
                name: farbe(wurzel.querySelector(rolle))
            };
        },
        [gleichWie, '.npc-item-name, .npc-detail-name']
    );
    weich(farben.marke, `${wo}: "Unbenannt" in der Dimm-Tinte von ${gleichWie}`).toBe(farben.dimm);
    weich(farben.marke, `${wo}: "Unbenannt" hat nicht die Tinte eines Namens`).not.toBe(
        farben.name
    );
}

/**
 * Zoras Eintrag (ID 3) traegt `text` — in der Liste UND, nach einem Klick auf
 * ihn, als Name im Detail. Bei "Unbenannt" zusaetzlich gedimmt (E1).
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
async function zoraZeigt(page, text) {
    const eintrag = page.locator('#npc-list .npc-item[data-id="3"]');
    await weich(
        eintrag.getByText(text).first(),
        `Liste: Zora steht als "${text}" da`
    ).toBeVisible();
    if ((await eintrag.count()) !== 1) return; // schon oben rot: Eintrag fehlt
    if (text === UNBENANNT) {
        await unbenanntGedimmt(
            eintrag.locator('.npc-item-name'),
            '.npc-item-meta',
            eintrag,
            'Liste'
        );
    }
    await eintrag.click();
    const detail = page.locator('#npc-detail-panel');
    await weich(
        detail.locator('.npc-detail-name'),
        `Detail: Zora steht als "${text}" da`
    ).toContainText(text);
    if (text === UNBENANNT) {
        await unbenanntGedimmt(
            detail.locator('.npc-detail-name'),
            '.npc-detail-subtitle',
            detail,
            'Detail'
        );
    }
}

// ===========================================================================
// DIE FAELLE
// ===========================================================================

/**
 * Die NPC-Liste. [ID, Titel, NPCs (in dieser Lage gesaet), was Zora zeigt]
 * @type {[string, string, Record<string, any>[], string|null][]}
 */
const LISTE = [
    ['K0', 'drei gueltige NPCs (Kontrolle)', [ANNA(), CORA(), zora()], 'Zora'],
    ['W1', 'Name fehlt, letzte Lage', [ANNA(), CORA(), zora('name', FEHLT)], 'Unbenannt'],
    ['W1v', 'Name fehlt, erste Lage', [zora('name', FEHLT), ANNA(), CORA()], 'Unbenannt'],
    ['W1m', 'Name fehlt, mittlere Lage', [ANNA(), zora('name', FEHLT), CORA()], 'Unbenannt'],
    ['W2', 'Name 42, letzte Lage', [ANNA(), CORA(), zora('name', 42)], '42'],
    ['W2v', 'Name 42, erste Lage', [zora('name', 42), ANNA(), CORA()], '42'],
    ['W3', 'Name null, letzte Lage', [ANNA(), CORA(), zora('name', null)], null],
    ['W3v', 'Name null, erste Lage', [zora('name', null), ANNA(), CORA()], null],
    ['W4', 'Name true, letzte Lage', [ANNA(), CORA(), zora('name', true)], null],
    ['W4v', 'Name true, erste Lage', [zora('name', true), ANNA(), CORA()], null],
    ['W5', 'Volk 5, erste Lage', [zora('race', 5), ANNA(), CORA()], null],
    ['W6', 'Volk {x:1}, letzte Lage', [ANNA(), CORA(), zora('race', { x: 1 })], null]
];

for (const [id, titel, npcs, zeigt] of LISTE) {
    test(`${id} NPC-Liste, ${titel}: drei Eintraege, kein Fehler`, async ({ page }) => {
        const fehler = fehlerFangen(page);
        await laden(page, { npcs });
        await zuAnsicht(page, 'npcs');
        await listeSteht(page, 3, 'NPC-Reiter');
        if (zeigt) await zoraZeigt(page, zeigt);
        await keinObjektText(page);
        await keinFehlerAusser(fehler);
    });
}

/**
 * Legt `wert` NACH dem Laden in Zoras `feld` (FEHLT entfernt es) — an der
 * Datengrenze vorbei, wie es der 🎲 Generator vor N3 tat (`name: 7` in D bis
 * zum Neuladen). Gezeichnet wird erst danach, per Klick auf den Reiter.
 * @param {import('@playwright/test').Page} page
 * @param {string} feld
 * @param {any} wert
 */
async function zurLaufzeit(page, feld, wert) {
    await page.evaluate(
        ([f, w, entfernen]) => {
            const z = window.D.npcs.find(n => n.id === 3);
            if (entfernen) delete z[f];
            else z[f] = w;
        },
        [feld, wert === FEHLT ? null : wert, wert === FEHLT]
    );
}

/**
 * Die NPC-Liste AN DER GRENZE VORBEI. [ID, Titel, NPCs (gueltig, in dieser
 * Lage gesaet), Feld, Wert zur Laufzeit, was Zora zeigt]
 *
 * Hier zeichnet das Startzeichnen noch die gueltige Saat. Wirft danach das
 * Zeichnen des Reiters, bleibt die ALTE Liste stehen — drei Eintraege, kein
 * "Anzeigefehler" (die Reiter-Verwaltung faengt den Wurf), Zora unter ihrem
 * alten Namen. Darum verlangt jeder Fall den NEUEN Wert sichtbar: den Namen
 * in Liste und Detail, das Volk in der Liste. Ohne DEBUG_MODE (Produktion)
 * ist er das einzige Zeichen; die Fehlerliste allein saehe dort nichts.
 * @type {[string, string, Record<string, any>[], string, any, string][]}
 */
const LAUFZEIT = [
    ['W16', 'Name fehlt, letzte Lage', [ANNA(), CORA(), zora()], 'name', FEHLT, UNBENANNT],
    ['W16v', 'Name fehlt, erste Lage', [zora(), ANNA(), CORA()], 'name', FEHLT, UNBENANNT],
    ['W17', 'Name 42, letzte Lage', [ANNA(), CORA(), zora()], 'name', 42, '42'],
    ['W17v', 'Name 42, erste Lage', [zora(), ANNA(), CORA()], 'name', 42, '42'],
    ['W18', 'Volk 5, letzte Lage', [ANNA(), CORA(), zora()], 'race', 5, '5']
];

for (const [id, titel, npcs, feld, wert, zeigt] of LAUFZEIT) {
    test(`${id} NPC-Liste an der Grenze vorbei, ${titel}: drei Eintraege, kein Fehler`, async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        await laden(page, { npcs });
        await zurLaufzeit(page, feld, wert);
        await zuAnsicht(page, 'npcs');
        await listeSteht(page, 3, 'NPC-Reiter');
        if (feld === 'name') {
            await zoraZeigt(page, zeigt);
        } else {
            await weich(
                page.locator('#npc-list .npc-item[data-id="3"] .npc-item-race'),
                `Liste: Zoras Volk steht als "${zeigt}" da (frisch gezeichnet)`
            ).toHaveText(zeigt);
        }
        await keinObjektText(page);
        await keinFehlerAusser(fehler);
    });
}

for (const [id, titel, wert, laufzeit] of /** @type {[string, string, any, boolean][]} */ ([
    ['W7', 'NPC ohne Namen', FEHLT, false],
    ['W8', 'NPC-Name 42', 42, false],
    ['W19', 'NPC-Name 42 an der Grenze vorbei', 42, true]
])) {
    test(`${id} Ortssuche, ${titel}: "mar" laesst nur den Markt stehen, kein Fehler`, async ({
        page
    }) => {
        const fehler = fehlerFangen(page);
        if (laufzeit) {
            await laden(page, { npcs: [ANNA(), CORA(), zora()] });
            await zurLaufzeit(page, 'name', wert);
        } else {
            await laden(page, { npcs: [ANNA(), CORA(), zora('name', wert)] });
        }
        await zuAnsicht(page, 'locations');
        const orte = page.locator('#locations-list .loc-item');
        await expect(orte, 'Vorbedingung: beide Orte stehen vor der Suche').toHaveCount(2);
        await page.locator('#loc-search').click();
        await page.keyboard.type('mar', { delay: 40 });
        await weich(orte, 'die Suche "mar" laesst genau einen Ort stehen').toHaveCount(1);
        await weich(orte.first(), 'der verbliebene Ort ist der Markt').toContainText('Markt');
        await keinFehlerAusser(fehler);
    });
}

test('W9 Kopfsuche, NPC-Name 42: "Wirt" oeffnet die Trefferliste mit drei NPCs', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [ANNA(), CORA(), zora('name', 42)] });
    await page.locator('#global-search').click();
    await page.keyboard.type('Wirt', { delay: 40 });
    const liste = page.locator('#global-search-results');
    await weich(liste, 'die Trefferliste ist offen').toBeVisible();
    await weich(
        liste.locator('[data-action="navigate-result"][data-type="npc"]'),
        'drei NPC-Treffer (alle drei sind Wirte)'
    ).toHaveCount(3);
    await keinFehlerAusser(fehler);
});

test('W10 Initiative, NPC-Name 42: der Gegner ohne Encounter steht in einer Zeile', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [ANNA(), CORA(), zora('name', 42)], initiative: GEGNER });
    await zuAnsicht(page, 'initiative');
    const liste = page.locator('#init-list');
    await weich(liste.locator('.init-entry'), 'eine Zeile in der Initiative').toHaveCount(1);
    await weich(liste, 'die Zeile ist der Goblin').toContainText('Goblin');
    await weich(liste, 'kein "Anzeigefehler" in der Initiative').not.toContainText('Anzeigefehler');
    await keinFehlerAusser(fehler);
});

for (const [id, titel, tags] of /** @type {[string, string, any[]][]} */ ([
    ['W11', 'Tag in der Form der App {name, color}', [{ name: 'Wichtig', color: 'red' }]],
    ['W11t', 'Tag als Text (Gegenfall)', ['Wichtig']]
])) {
    test(`${id} NPC-Detail, ${titel}: Anna zeigt "Wichtig"`, async ({ page }) => {
        const fehler = fehlerFangen(page);
        await laden(page, { npcs: [ANNA({ tags }), CORA(), zora()] });
        await zuAnsicht(page, 'npcs');
        await page.locator('#npc-list .npc-item[data-id="1"]').click();
        const detail = page.locator('#npc-detail-panel');
        await expect(
            detail.locator('.npc-detail-name'),
            'Vorbedingung: das Detail zeigt Anna'
        ).toHaveText('Anna');
        await weich(detail, 'das Detail zeigt das Tag "Wichtig"').toContainText('Wichtig');
        await keinObjektText(page);
        await keinFehlerAusser(fehler);
    });
}

/** Das globale Tag in der Form, die 🏷️ selbst schreibt. */
const GLOBAL_WICHTIG = [{ name: 'Wichtig', color: 'red' }];

/**
 * Oeffnet das 🏷️-Fenster aus Annas Detail — der Weg eines Nutzers.
 * @param {import('@playwright/test').Page} page
 */
async function tagFensterVonAnna(page) {
    await zuAnsicht(page, 'npcs');
    await page.locator('#npc-list .npc-item[data-id="1"]').click();
    await expect(
        page.locator('#npc-detail-panel .npc-detail-name'),
        'Vorbedingung: das Detail zeigt Anna'
    ).toHaveText('Anna');
    await page.locator('#npc-detail-panel [data-action="show-tags-modal"]').click();
    const fenster = page.locator('#tags-modal');
    await expect(fenster, 'Vorbedingung: das 🏷️-Fenster ist offen').toBeVisible();
    return fenster;
}

/** Die Tags eines NPC in D, als JSON.
 *  @param {import('@playwright/test').Page} page
 *  @param {number} id */
function tagsIn(page, id) {
    return page.evaluate(i => JSON.stringify(window.D.npcs.find(n => n.id === i).tags), id);
}

test('W11f 🏷️-Fenster, Tag als Text: das Fenster zeigt "Wichtig", die Doppelpruefung erkennt es', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, {
        npcs: [ANNA({ tags: ['Wichtig'] }), CORA(), zora()],
        tags: GLOBAL_WICHTIG
    });
    const fenster = await tagFensterVonAnna(page);
    const eigene = fenster.locator('#entity-tags-list .tag');
    await weich(eigene, 'Fenster: Anna traegt genau ein Tag').toHaveCount(1);
    await weich(eigene, 'Fenster: Annas Tag steht als "Wichtig" da').toContainText(['Wichtig']);
    const verfuegbar = fenster.locator('#all-tags-list .tag', { hasText: 'Wichtig' });
    await weich(
        verfuegbar,
        '"Wichtig" unter "Verfuegbare Tags" ist als vorhanden gedimmt'
    ).toHaveCSS('opacity', '0.5');

    // Doppelpruefung 1: denselben Namen eintippen und "+".
    await fenster.locator('#new-tag-name').click();
    await page.keyboard.type('Wichtig');
    await fenster.locator('button[data-value="addTagToEntity"]').click();
    weich(await tagsIn(page, 1), '"+" mit "Wichtig" legt keine Dublette an').toBe('["Wichtig"]');
    // Doppelpruefung 2: das globale Tag anklicken.
    await verfuegbar.click();
    weich(await tagsIn(page, 1), 'der Klick auf das globale "Wichtig" legt keine Dublette an').toBe(
        '["Wichtig"]'
    );

    await fenster.locator('button[data-value="tags-modal"]').click();
    await weich(
        page.locator('#npc-detail-panel .npc-tag'),
        'das Detail zeigt "Wichtig" genau einmal'
    ).toHaveText(['Wichtig']);
    await keinObjektText(page);
    await keinFehlerAusser(fehler);
});

test('W11g 🏷️-Fenster, Tag als Text: das globale "Wichtig" loeschen nimmt es ueberall mit', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, {
        npcs: [ANNA({ tags: ['Wichtig'] }), CORA({ tags: [...GLOBAL_WICHTIG] }), zora()],
        tags: GLOBAL_WICHTIG
    });
    const fenster = await tagFensterVonAnna(page);
    let rueckfrage = '';
    page.once('dialog', d => {
        rueckfrage = d.message();
        return d.accept();
    });
    await fenster.locator('#global-tags-list [data-action="delete-global-tag"]').click();
    expect(rueckfrage, 'Vorbedingung: die Rueckfrage nennt "Wichtig"').toContain(
        'Tag "Wichtig" wirklich löschen?'
    );
    weich(await tagsIn(page, 2), 'Coras Tag in der Form der App ist weg (Kontrolle)').toBe('[]');
    weich(await tagsIn(page, 1), 'Annas Text-Tag "Wichtig" ist weg').toBe('[]');
    await fenster.locator('button[data-value="tags-modal"]').click();
    await weich(
        page.locator('#npc-detail-panel .npc-tag'),
        'das Detail zeigt kein Tag mehr'
    ).toHaveCount(0);
    await keinFehlerAusser(fehler);
});

test('W11o Ort-Detail, Tags in beiden Formen: "Wichtig" und "Alt" stehen da, nirgends "[object Object]"', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, {
        npcs: [ANNA(), CORA(), zora()],
        locations: [
            { ...ORTE[0], tags: [{ name: 'Wichtig', color: 'red' }, 'Alt', { color: 'blue' }] },
            ORTE[1]
        ]
    });
    await zuAnsicht(page, 'locations');
    await page.locator('#locations-list .loc-item[data-id="1"]').click();
    const detail = page.locator('#loc-detail-panel');
    await expect(
        detail.locator('.loc-detail-name'),
        'Vorbedingung: das Detail zeigt die Taverne'
    ).toContainText('Taverne');
    await weich(
        detail.locator('.loc-tag'),
        'drei Tags: "Wichtig", "Alt" und das ohne Namen leer'
    ).toHaveText(['Wichtig', 'Alt', '']);
    await keinObjektText(page, 'locations');
    await keinFehlerAusser(fehler);
});

test('W13 Generator mit Namenstabelle {text: 7}: der Name in D ist Text, die Liste zeigt den NPC sofort und nach dem Neuladen', async ({
    page
}) => {
    test.setTimeout(90000);
    const fehler = fehlerFangen(page);
    // 400 Eintraege neben den 40 eingebauten Namen: die Vorschau zeigt den
    // Tabelleneintrag fast immer schon beim Oeffnen.
    const tabelle = {
        id: 1,
        name: 'npc-namen-mensch-maennlich',
        icon: '🎲',
        entries: Array.from({ length: 400 }, () => ({ weight: 1, text: 7 }))
    };
    await laden(page, { npcs: [ANNA(), CORA(), zora()], randomTables: [tabelle] });
    await zuAnsicht(page, 'npcs');
    await expect(page.locator('#npc-list .npc-item'), 'Vorbedingung: drei NPCs').toHaveCount(3);

    await page.locator('#view-npcs [data-action="show-npc-generator"]').click();
    const fenster = page.locator('#npc-generator-modal');
    await expect(fenster).toBeVisible();
    const vorschau = fenster.locator('.npcg-preview-name');
    for (let i = 0; i < 30 && (await vorschau.innerText()).trim() !== '7'; i++) {
        await fenster.locator('[data-action="reroll-npc"]').click();
    }
    await expect(vorschau, 'Vorbedingung: die Vorschau zeigt den Tabelleneintrag').toHaveText('7');
    await fenster.locator('[data-action="save-generated-npc"]').click();

    // Vorbedingung: das 💾 des Generators hat einen NPC in D angelegt.
    await expect
        .poll(() => page.evaluate(() => window.D.npcs.length), { timeout: SOFORT_MS })
        .toBe(4);
    const neu = await page.evaluate(() => {
        const n = window.D.npcs.find(x => ![1, 2, 3].includes(x.id));
        return n ? { id: n.id, typ: typeof n.name, name: n.name } : null;
    });
    expect(neu, 'Vorbedingung: der neue NPC hat eine eigene ID').not.toBeNull();
    const neuId = neu?.id;
    weich(neu && { typ: neu.typ, name: neu.name }, 'der Name in D ist der Text "7"').toEqual({
        typ: 'string',
        name: '7'
    });
    await listeSteht(page, 4, 'sofort nach dem 💾');
    await weich(
        page.locator(`#npc-list .npc-item[data-id="${neuId}"]`),
        'sofort nach dem 💾: der neue NPC steht als "7" in der Liste'
    ).toContainText('7');

    await expect
        .poll(
            () =>
                page.evaluate(
                    k => (JSON.parse(localStorage.getItem(k) || '{}').npcs || []).length,
                    SPEICHER
                ),
            { timeout: SOFORT_MS, message: 'Vorbedingung: der neue NPC ist im Speicher' }
        )
        .toBe(4);
    await fehler.sichern();
    await page.reload();
    await waitForAppReady(page);
    await zuAnsicht(page, 'npcs');
    await listeSteht(page, 4, 'nach dem Neuladen');
    await weich(
        page.locator(`#npc-list .npc-item[data-id="${neuId}"]`),
        'nach dem Neuladen: der neue NPC steht als "7" in der Liste'
    ).toContainText('7');
    await keinFehlerAusser(fehler);
});

test('W14 Kampagnen-Import "Ersetzen", NPC ohne Namen in der letzten Lage: die Liste steht, auch nach dem Neuladen', async ({
    page
}) => {
    test.setTimeout(90000);
    const fehler = fehlerFangen(page);
    await laden(page, {
        npcs: [{ id: 9, name: 'Vorher', role: 'Wirt', race: 'Mensch', description: '' }]
    });
    const version = await page.evaluate(() => window.APP_CONFIG.VERSION);
    const datei = {
        ...seed({ npcs: [ANNA(), CORA(), zora('name', FEHLT)] }),
        _version: version,
        _campaignName: 'Altdaten',
        _exportDate: '2026-11-01T00:00:00.000Z'
    };
    // Rueckfrage 1 "Als NEUE Kampagne?" -> Abbrechen (weitere Optionen),
    // Rueckfrage 2 "ERSETZEN?" -> OK (wie campaign-import.spec.js).
    let dialoge = 0;
    page.on('dialog', d => {
        dialoge++;
        return dialoge === 1 ? d.dismiss() : d.accept();
    });
    await zuAnsicht(page, 'data');
    const wahl = page.waitForEvent('filechooser');
    await page.locator('#view-data').getByRole('button', { name: '📁 Datei auswählen' }).click();
    await (
        await wahl
    ).setFiles({
        name: 'altdaten.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(datei))
    });
    await expect
        .poll(
            () =>
                page.evaluate(() =>
                    (window.getCombatLog?.() || []).some(e => String(e.text).includes('Import OK'))
                ),
            { timeout: 15000, message: 'Vorbedingung: der Import meldet "Import OK"' }
        )
        .toBe(true);
    await expect
        .poll(() => page.evaluate(() => window.D.npcs.map(n => n.id).join(',')), {
            message: 'Vorbedingung: D traegt die drei NPCs der Datei'
        })
        .toBe('1,2,3');

    await zuAnsicht(page, 'npcs');
    await listeSteht(page, 3, 'nach dem Import');
    await expect
        .poll(
            () =>
                page.evaluate(
                    k =>
                        (JSON.parse(localStorage.getItem(k) || '{}').npcs || [])
                            .map(n => n.id)
                            .join(','),
                    SPEICHER
                ),
            { timeout: SOFORT_MS, message: 'Vorbedingung: der Import ist im Speicher' }
        )
        .toBe('1,2,3');
    await fehler.sichern();
    await page.reload();
    await waitForAppReady(page);
    await zuAnsicht(page, 'npcs');
    await listeSteht(page, 3, 'nach dem Neuladen');
    await keinFehlerAusser(fehler);
});

test('W15 Telefon 390x844, NPC-Name 42: die Suche hinter 🔍 findet die drei Wirte', async ({
    page
}) => {
    const fehler = fehlerFangen(page);
    await laden(page, { npcs: [ANNA(), CORA(), zora('name', 42)] });
    await page.setViewportSize(TELEFON);
    await expect(page.locator('html'), 'Vorbedingung: das Telefon-Layout greift').toHaveAttribute(
        'data-layout',
        'mobile'
    );
    await page.locator('.mobile-header button[data-value="showMobileSearch"]').click();
    const feld = page.locator('#mobile-search-input');
    await expect(feld, 'Vorbedingung: die mobile Suche ist offen').toBeVisible();
    await feld.click();
    await page.keyboard.type('Wirt', { delay: 40 });
    await weich(
        page.locator(
            '#mobile-search-results [data-action="mobile-search-navigate"][data-type="npc"]'
        ),
        'drei NPC-Treffer (alle drei sind Wirte)'
    ).toHaveCount(3);
    await keinFehlerAusser(fehler, ERWARTET_TELEFON);
});
