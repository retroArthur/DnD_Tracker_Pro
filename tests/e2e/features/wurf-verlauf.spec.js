// @ts-check
/**
 * Der Waechter des Wurfverlaufs (WUERFEL)
 * =======================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **jeder Wurf, den die App
 * fuer den Spielleiter wuerfelt, steht danach im Verlauf des Wuerfel-Tabs und
 * in der Statistik** — mit der Summe, die die Meldung nennt, und in einer
 * Schreibweise, die der Verlauf selbst wieder wuerfeln kann.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand — EIN TOTER AUFRUF, EIN ZWEITER
 * PARSER, EIN FELD OHNE LESER
 *
 * Gemeldet: Wuerfe aus der Schnellreferenz (Fallschaden) und aus dem Bestiar
 * fehlen im Verlauf und in der Statistik. Dahinter stehen drei Fehler:
 *
 * (A) `rollQrefDice()` — der gemeinsame Weg der Schnellreferenz, der
 *     Bestiar-Detailansicht UND des Statblock-Panels der Initiative — trug
 *     ueber `window.addToHistory({formula, result, rolls, timestamp})` ein.
 *     Diese Funktion gab es nie: schon im Einfuehrungscommit 2210380
 *     (2026-01-02) hiess das Ziel `addToDiceHistory(notation, result, rolls)`.
 *     Der typeof-Waechter machte den Fehlschlag still — kein Fehler, nirgends.
 * (B) Derselbe Weg hatte einen eigenen Mini-Parser `/(\d+)d(\d+)/i`. Er warf
 *     den Modifikator weg ("+4" beim Goblin ergab 11 statt 15) und kannte das
 *     deutsche W nicht: alle 394 Formeln der SRD-Statbloecke stehen in
 *     W-Schreibweise ("1W6+2"), jeder Klick auf eine Schadensformel endete
 *     seit 2026-06-13 in "Ungültige Würfelformel".
 * (C) `quickRoll()` (Taste R, Alt+1/2/4/6/8, Befehlspalette "Wuerfle
 *     d20/d6/d8") schrieb nur `D.diceHistory` — ein Feld, das keine Ansicht
 *     liest. Die Planung verlangt das Gegenteil (07-CONTEXT D-04: "Erfasst
 *     werden ALLE Würfe ... Quick-Rolls (R)").
 *
 * GEMESSEN am Buendel zu 429ad8f, 1440x900, r = 0,5 nur waehrend der Handlung
 * (d20 = 11, d6 = 4). Delta von Verlauf / Statistik / d20-Zaehler:
 *
 *   Schnellreferenz 3m (1d6)        0 / 0 / 0   "🎲 1d6 = 4 (4)"
 *   Bestiar Goblin "+4"             0 / 0 / 0   "🎲 1d20+4 = 11 (11)", richtig 15
 *   Bestiar Goblin "1W6+2"          0 / 0 / 0   "Ungültige Würfelformel"
 *   Initiative-Statblock "+4"       0 / 0 / 0   wie im Bestiar
 *   Taste R, Alt+2, Palette d20     0 / 0 / 0   nur D.diceHistory +1
 *   Gegenprobe Wuerfel-Tab d20      1 / 1 / 1
 *
 * Kein Dialog, kein pageerror — der Fehler war unsichtbar.
 *
 * Dazu zwei Nachbarn derselben Klasse, aus der Gegenpruefung:
 * (D) Die Freiformel des DM-Screens (`dmsRollDice()`) mit "abc" oeffnete
 *     ein alert() UND schrieb {abc, 0, []} in Verlauf und Statistik — einen
 *     Wurf mit Summe 0, den es nicht gab.
 * (E) Sobald (A) behoben ist, haengt `addToDiceHistory()` den im Wuerfel-Tab
 *     gewaehlten Schadensart-Chip an JEDEN Eintrag — Fallschaden hiesse
 *     dann "1d6 (Feuer)". Der Chip gehoert zu den Wuerfen des Wuerfel-Tabs.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WARUM JEDER FALL ROT WAR (am unveraenderten Code, Grund jeweils gelesen)
 *
 *   (0)  gruen — die Gegenprobe zeigt, dass die Messung selbst traegt.
 *   (1)(2) Verlauf und Statistik +0: (A).
 *   (3)  Meldung "= 11" statt "= 15": (B); Verlauf +0: (A) — getrennt
 *        zugesichert, damit ein halber Fix sagt, WELCHE Haelfte fehlt.
 *   (4)  Meldung "Ungültige Würfelformel": (B).
 *   (5)  wie (3), ueber das Statblock-Panel der Initiative.
 *   (6)  Statistik-Ansicht "Gesamt d20-Wuerfe: 0", auch nach dem Neuladen.
 *   (7)(8) Verlauf und Statistik +0: (C).
 *   (9)  Schnellreferenz-Wurf fehlt (A); nach einem halben Fix stuende er
 *        als "1d6 (Feuer)" da (E).
 *   (10) alert() und {abc, 0, []} im Verlauf: (D).
 *   (11) nachgetragen in der Nachpruefung, rot am ERSTEN Fix-Stand 0917cdf:
 *        "0W6" stand als "0d6" mit 4 im Verlauf, "1W0" als 1 — die
 *        Vorpruefung liess Anzahl 0 und Seiten 0 durch, und
 *        parseDiceNotation() macht daraus `parseInt(...) || 1`. Am Ausgangs-
 *        stand 429ad8f ist (11) ebenfalls rot, dort weil kein W-Wurf durchging.
 *        Obergrenze und Aufschluesselung waren in (11) und (3) schon gruen;
 *        sie stehen hier, damit nicht allein der Unit-Test sie haelt.
 *
 * Nur im Unit-Test (tests/unit/wurf-eintrag.test.js W4) steht die strenge
 * Vorpruefung gegen Anhaengsel wie "1d6+2abc": am Bildschirm erreicht sie
 * kein Weg. `renderClickableDice()` schneidet nur `\d+[dWw]\d+([+-]\d+)?`
 * und isolierte `+N` heraus, die Schnellreferenz traegt feste `data-dice`.
 *
 * Bewusst NICHT zugesichert: die Mini-Historie des schwebenden Wuerfel-Panels.
 * Sie zeigt nur die Wuerfe aus dem Panel selbst (auch aus dem Wuerfel-Tab
 * nicht); ob sie alle Wuerfe zeigen soll, ist eine offene Produktfrage und
 * kein Teil dieses Befunds.
 *
 * Gemessen wird der Verlauf zweifach — in den Daten (`window.diceHistory`)
 * UND in der Anzeige (`#dice-history .dice-history-item`): nach "🗑️ Leeren"
 * zeigt `window.diceHistory` auf ein totes Array (eigener Befund). Kein Fall
 * hier leert; die Anzeige ist trotzdem die Zusage, die der Nutzer sieht.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit laden — `waitForAppReady()` wartet auf `.app-title`, und die ist im
 *  Mobil-Layout versteckt. */
const BREIT = { width: 1440, height: 900 };

/** Der Speicherschluessel der Standardkampagne. */
const SPEICHER = 'dnd-tracker-v4';

/** Fester Zufall WAEHREND der Handlung: floor(0,5 * Seiten) + 1 — d20 = 11,
 *  d6 = 4. Davor und danach wuerfelt die App echt. */
const R = 0.5;

/**
 * Wo die Fehler der Wege liegen, die diese Datei misst. Die Pfade stehen in
 * den Meldungen der Zusicherungen, damit ein roter Lauf auf die Stelle zeigt.
 */
const QUELLE = {
    eintrag: 'features/dice/dice-core.js addToDiceHistory()',
    dmScreen: 'features/dmscreen/dmscreen-widgets-base.js dmsRollDice()',
    schnellreferenz: 'systems/spellslots/quick-reference.js rollQrefDice()',
    schnellwurf: 'systems/spellslots/quick-roll.js quickRoll()'
};

/**
 * Bekanntes Rauschen, KEIN Gegenstand dieser Datei — und genau benannt, damit
 * kein anderer Fehler mit durchrutscht: jeder Wurf IM Wuerfel-Tab ruft
 * `addToFormulaHistory()`, und die sucht einen Container, den die Vorlage seit
 * 2bb0d02 (2025-12-29) nicht mehr hat. Das Fehlerlog meldet ihn bei jedem
 * Wurf. Eigener Fehler, hier nicht behoben.
 */
const BEKANNTES_RAUSCHEN = ['Element not found: #dice-formula-history'];

/**
 * Ein Goblin aus dem SRD in der Initiative — so, wie "Zur Initiative" im
 * Bestiar ihn anlegt: Typ 'monster' und `statblockRef`, ueber den das 📖 der
 * Zeile den vollen Statblock zeigt.
 */
const GOBLIN_KAEMPFER = {
    id: 1,
    name: 'Goblin',
    initiative: 12,
    initBonus: 2,
    maxHp: 7,
    currentHp: 7,
    ac: 15,
    type: 'monster',
    cr: '1/4',
    xp: 50,
    effects: [],
    statblockRef: { source: 'srd', id: 'goblin' }
};

/**
 * Eine EIGENE Bestiar-Kreatur mit Grenzformeln im Aktionstext. Eigene Texte
 * schreibt der Spielleiter selbst, und `renderClickableDice()` macht jede
 * Ziffernfolge vor W/d klickbar (`\d+[dWw]\d+`) — auch "0W6" und "1W0", die
 * keinen Wurf beschreiben, und "101W6" ueber der Obergrenze.
 */
const GRENZLING = {
    id: 1,
    name: 'Grenzling',
    source: 'custom',
    size: 'Mittelgroß',
    creatureType: 'Humanoid',
    alignment: '',
    cr: '1/4',
    xp: 50,
    ac: 12,
    acInfo: '',
    hp: 9,
    hpFormula: '2W8',
    speed: { walk: '9 m', fly: '', swim: '', climb: '', burrow: '' },
    str: 10,
    dex: 14,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    savingThrows: {},
    skills: {},
    damageResistances: [],
    damageImmunities: [],
    conditionImmunities: [],
    senses: [],
    languages: [],
    traits: '',
    actions: '<p>Null: 0W6. Leer: 1W0. Viel: 101W6. Grenze: 100W6+1. Minus: 2W6-1.</p>',
    reactions: '',
    legendaryActions: '',
    legendaryActionsPerRound: 0,
    avatar: ''
};

/**
 * @param {object[]} combatants
 * @param {object[]} [bestiary] eigene Kreaturen
 */
function seed(combatants, bestiary = []) {
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
        filters: {},
        tags: [],
        sessionNotes: [],
        encounters: [],
        bestiary,
        initiative: { combatants, currentTurn: 0, round: 1 },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
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
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Faengt jeden Fehler, den ein Bedienweg hinterlaesst: `pageerror`,
 * `console.error` und das Fehlerlog der App (`EventDelegation` meldet einen
 * geworfenen Handler NUR dort und als `console.error`). Gezaehlt wird ab einer
 * Marke — was die Vorbereitung eines Falls loggt, gehoert nicht zur Handlung.
 * "Failed to load resource" ist Netzrauschen (Schriften unter file://).
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
        marke() {
            return fehler.length;
        },
        /**
         * @param {number} marke
         * @param {number} ab Seitenzeit (Date.now()) vor der Handlung
         */
        async seit(marke, ab) {
            const log = await page.evaluate(
                zeit =>
                    (window.ErrorHandler?.getRecentErrors(50) || [])
                        .filter(e => e.time instanceof Date && e.time.getTime() >= zeit)
                        .map(e => `ErrorHandler: ${e.fn} (${e.context}): ${e.message}`),
                ab
            );
            return [...fehler.slice(marke), ...log].filter(
                f => !BEKANNTES_RAUSCHEN.some(b => f.includes(b))
            );
        }
    };
}

/**
 * Laedt breit, saet die Kampagne EINMAL je Tab (Fall (6) laedt neu und soll
 * dann den Stand sehen, den die App selbst gespeichert hat) und umhuellt
 * Math.random. Liefert die Dialog- und die Fehlerfalle.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} [combatants]
 * @param {object[]} [bestiary] eigene Kreaturen
 */
async function laden(page, combatants = [], bestiary = []) {
    /** @type {string[]} */
    const dialoge = [];
    // Jeder Dialog ist ein Befund: parseDiceNotation() meldet Ungueltiges per
    // alert(), und das blockiert am Tisch die ganze Seite.
    page.on('dialog', async d => {
        dialoge.push(`${d.type()}: ${d.message()}`);
        await d.dismiss().catch(() => {});
    });
    const fehler = fehlerFangen(page);
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        ([schluessel, s]) => {
            try {
                if (!sessionStorage.getItem('wurf-verlauf-saat')) {
                    sessionStorage.setItem('wurf-verlauf-saat', '1');
                    localStorage.setItem(schluessel, JSON.stringify(s));
                }
            } catch {
                // file://-Speicher ist je Browserbau unterschiedlich streng.
            }
            const echt = Math.random.bind(Math);
            Math.random = () =>
                typeof window.__wurfZufall === 'number' ? window.__wurfZufall : echt();
        },
        [SPEICHER, seed(combatants, bestiary)]
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    // DIE FREMDE SPEICHERUNG ABWARTEN: `load()` plant nach einer Reparatur
    // 1 s spaeter `saveAutomatic()` ein. Sie soll nicht mitten in eine
    // Messung fallen. Erkennbar daran, dass die App `_version` der Saat
    // ueberschreibt; kommt binnen 4 s keine, steht auch keine aus.
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
    return { dialoge, fehler };
}

/**
 * Der Stand von Verlauf, Statistik und Meldungen. Die Statistik wird ohne
 * Warten gelesen: `statsIdbPut()` legt seine Schreib-Transaktion synchron im
 * Wurf an, und eine spaeter angelegte Lese-Transaktion auf demselben Store
 * sieht sie (IndexedDB ordnet ueberlappende Transaktionen).
 * @param {import('@playwright/test').Page} page
 */
function stand(page) {
    return page.evaluate(async () => {
        const w = /** @type {any} */ (window);
        const zeilen = [...document.querySelectorAll('#dice-history .dice-history-item')];
        const agg = await w.getStatsAggregate(w._currentSessionId || 'default');
        const oben = w.diceHistory[0];
        return {
            verlauf: w.diceHistory.length,
            zeilen: zeilen.length,
            oben: oben ? { notation: oben.notation, result: oben.result, rolls: oben.rolls } : null,
            zeileOben: zeilen[0]
                ? {
                      notation: zeilen[0]
                          .querySelector('.dice-history-notation')
                          ?.textContent?.trim(),
                      ergebnis: zeilen[0].querySelector('.dice-history-result')?.textContent?.trim()
                  }
                : null,
            statistik: await w.getStatsCount(),
            d20: agg.counts.reduce((/** @type {number} */ a, /** @type {number} */ b) => a + b, 0),
            dVerlauf: (w.D.diceHistory || []).length,
            meldungen: w
                .getCombatLog()
                .map((/** @type {any} */ e) => ({ nr: e.nr, text: e.text, typ: e.typ }))
        };
    });
}

/**
 * Misst EINE Handlung: Stand davor, fester Zufall nur waehrend der Handlung,
 * Stand danach. Liefert die Deltas, den obersten Eintrag, die neuen Meldungen
 * (`typ: text`), die neuen Fehler und alle Dialoge des Tabs bis hierher.
 * @param {import('@playwright/test').Page} page
 * @param {{dialoge: string[], fehler: ReturnType<typeof fehlerFangen>}} sitzung
 * @param {() => Promise<unknown>} handlung
 */
async function gemessen(page, sitzung, handlung) {
    const vor = await stand(page);
    const marke = sitzung.fehler.marke();
    const ab = await page.evaluate(r => {
        window.__wurfZufall = r;
        return Date.now();
    }, R);
    try {
        await handlung();
    } finally {
        await page.evaluate(() => {
            delete window.__wurfZufall;
        });
    }
    const nach = await stand(page);
    const letzte = vor.meldungen.length ? vor.meldungen[0].nr : 0;
    return {
        verlauf: nach.verlauf - vor.verlauf,
        zeilen: nach.zeilen - vor.zeilen,
        statistik: nach.statistik - vor.statistik,
        d20: nach.d20 - vor.d20,
        dVerlauf: nach.dVerlauf - vor.dVerlauf,
        oben: nach.oben,
        zeileOben: nach.zeileOben,
        meldungen: nach.meldungen.filter(m => m.nr > letzte).map(m => `${m.typ}: ${m.text}`),
        fehler: await sitzung.fehler.seit(marke, ab),
        dialoge: [...sitzung.dialoge]
    };
}

/** WEICHE Zusicherungen: ein roter Lauf soll JEDE gebrochene Zusage nennen
 *  (Daten, Anzeige, Statistik, Dialog, Fehler), nicht nur die erste. */
const weich = expect.configure({ soft: true });

/**
 * Das Urteil fuer EINEN Wurf: er steht im Verlauf — in den Daten UND in der
 * Anzeige — mit Notation, Summe und Einzelwuerfen, die Statistik hat ihn, und
 * der d20-Zaehler zaehlt ihn genau dann, wenn es ein d20 ist. Kein Dialog,
 * kein Fehler.
 * @param {Awaited<ReturnType<typeof gemessen>>} m
 * @param {{notation: string, summe: number, wuerfe: number[], d20: boolean}} soll
 * @param {string} was
 * @param {string} quelle
 */
function pruefeWurf(m, soll, was, quelle) {
    weich(m.verlauf, `${was}: window.diceHistory muss um genau 1 wachsen (${quelle})`).toBe(1);
    weich(m.zeilen, `${was}: #dice-history muss genau eine Zeile mehr zeigen`).toBe(1);
    weich(m.oben, `${was}: oberster Verlaufseintrag (Daten)`).toEqual({
        notation: soll.notation,
        result: soll.summe,
        rolls: soll.wuerfe
    });
    weich(m.zeileOben, `${was}: oberste Zeile im Wuerfel-Tab (Anzeige)`).toEqual({
        notation: soll.notation,
        ergebnis: String(soll.summe)
    });
    weich(m.statistik, `${was}: die Statistik (IndexedDB) muss den Wurf haben`).toBe(1);
    weich(m.d20, `${was}: der d20-Zaehler der Statistik`).toBe(soll.d20 ? 1 : 0);
    weich(m.dialoge, `${was}: kein Dialog (alert)`).toEqual([]);
    weich(m.fehler, `${was}: kein Fehler`).toEqual([]);
}

/**
 * Das Urteil fuer eine Formel, die KEIN Wurf ist: genau die genannte
 * Fehlermeldung und keine Wurfmeldung, nichts in Verlauf und Statistik, kein
 * Dialog, kein Fehler.
 * @param {Awaited<ReturnType<typeof gemessen>>} m
 * @param {string} fehlermeldung
 * @param {string} was
 * @param {string} quelle
 */
function pruefeKeinWurf(m, fehlermeldung, was, quelle) {
    weich(m.meldungen, `${was}: genau diese Fehlermeldung, kein Wurf (${quelle})`).toEqual([
        `error: ${fehlermeldung}`
    ]);
    weich(m.verlauf, `${was}: kein Verlaufseintrag`).toBe(0);
    weich(m.zeilen, `${was}: keine Zeile im Wuerfel-Tab`).toBe(0);
    weich(m.statistik, `${was}: kein Datensatz in der Statistik`).toBe(0);
    weich(m.dialoge, `${was}: kein Dialog (alert)`).toEqual([]);
    weich(m.fehler, `${was}: kein Fehler`).toEqual([]);
}

/**
 * Schnellreferenz ueber den 📖-Knopf oeffnen, Reiter "Regeln", Abschnitt
 * "Fallschaden" aufklappen — alles mit echten Klicks.
 * @param {import('@playwright/test').Page} page
 */
async function fallschadenOeffnen(page) {
    await page.locator('.qref-fab').click();
    await page.locator('#quick-ref-panel .qref-tab[data-value="rules"]').click();
    const abschnitt = page.locator('#quick-ref-panel [data-qref-section="fall-damage"]');
    await abschnitt.locator('.qref-section-header').click();
    await expect(abschnitt).not.toHaveClass(/collapsed/);
    await expect(abschnitt.locator('.qref-dice-btn[data-dice="1d6"]')).toBeVisible();
}

/**
 * Bestiar oeffnen und den SRD-Goblin waehlen — ueber den HG-Filter, OHNE das
 * Suchfeld. Ungefiltert ist er nicht im DOM: die Liste laeuft ueber
 * `VirtualScroll` und zeichnet nur die sichtbaren Zeilen, und vor dem Goblin
 * (HG 1/4) stehen alle Kreaturen mit HG 0 und 1/8. Die Suche waere der
 * falsche Umweg: nach einer Eingabe dort wird der ERSTE Klick auf die Liste
 * verschluckt (das Verlassen des Feldes feuert `change`, die Liste wird
 * zwischen mousedown und mouseup neu gezeichnet, es entsteht kein click).
 * Eigener Fehler, hier nicht behoben. Die Auswahlliste feuert `change` schon
 * beim Waehlen, nicht erst beim Verlassen — sie steht dem Klick nicht im Weg.
 * @param {import('@playwright/test').Page} page
 */
async function goblinImBestiar(page) {
    await page.evaluate(() => window.switchView('bestiary'));
    await page.locator('#bestiary-filter-cr').selectOption('1/4');
    const goblin = page.locator(
        '#bestiary-list .bestiary-list-item[data-id="goblin"][data-source="srd"]'
    );
    await expect(goblin).toBeVisible();
    await goblin.click();
    await expect(
        page.locator('#bestiary-detail-panel .bestiary-dice[data-value="1W6+2"]').first()
    ).toBeVisible();
}

/**
 * Bestiar oeffnen, "Nur Eigene" anhaken und den GRENZLING waehlen — der
 * Haken filtert die SRD-Liste weg, die virtuelle Liste zeichnet ihn sicher.
 * @param {import('@playwright/test').Page} page
 */
async function grenzlingImBestiar(page) {
    await page.evaluate(() => window.switchView('bestiary'));
    await page.locator('#bestiary-filter-custom').check();
    const kreatur = page.locator(
        '#bestiary-list .bestiary-list-item[data-id="1"][data-source="custom"]'
    );
    await expect(kreatur).toBeVisible();
    await kreatur.click();
    await expect(
        page.locator('#bestiary-detail-panel .bestiary-dice[data-value="2W6-1"]').first()
    ).toBeVisible();
}

/**
 * Der Fokus geht auf den Koerper der Seite zurueck — die Tastenkuerzel gelten
 * dort, nicht in einem Feld.
 * @param {import('@playwright/test').Page} page
 */
async function fokusFrei(page) {
    await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
}

test.describe('Wurfverlauf: jeder Wurf der App steht im Verlauf und in der Statistik (WUERFEL)', () => {
    // =======================================================================
    // (0) GEGENPROBE — die Messung selbst traegt
    // =======================================================================
    test('(0) Gegenprobe: ein d20 im Wuerfel-Tab steht in Verlauf und Statistik', async ({
        page
    }) => {
        const s = await laden(page);
        await page.evaluate(() => window.switchView('dice'));
        const m = await gemessen(page, s, () => page.locator('#view-dice .dice-die.d20').click());
        pruefeWurf(
            m,
            { notation: '1d20', summe: 11, wuerfe: [11], d20: true },
            'Wuerfel-Tab d20',
            QUELLE.eintrag
        );
    });

    // =======================================================================
    // (1) (2) SCHNELLREFERENZ — Fallschaden
    // =======================================================================
    test('(1) Schnellreferenz, Fallschaden "3m": der Wurf steht in Verlauf und Statistik', async ({
        page
    }) => {
        const s = await laden(page);
        await fallschadenOeffnen(page);
        const m = await gemessen(page, s, () =>
            page.locator('#quick-ref-panel .qref-dice-btn[data-dice="1d6"]').click()
        );
        weich(m.meldungen, 'die Meldung nennt den Wurf').toContain('info: 🎲 1d6 = 4 (4)');
        pruefeWurf(
            m,
            { notation: '1d6', summe: 4, wuerfe: [4], d20: false },
            'Schnellreferenz 3m',
            QUELLE.schnellreferenz
        );
    });

    test('(2) Schnellreferenz, die Formel "1d6" selbst: der Wurf steht in Verlauf und Statistik', async ({
        page
    }) => {
        const s = await laden(page);
        await fallschadenOeffnen(page);
        const m = await gemessen(page, s, () =>
            page.locator('#quick-ref-panel .qref-dice-formula[data-dice="1d6"]').click()
        );
        pruefeWurf(
            m,
            { notation: '1d6', summe: 4, wuerfe: [4], d20: false },
            'Schnellreferenz-Formel 1d6',
            QUELLE.schnellreferenz
        );
    });

    // =======================================================================
    // (3) (4) BESTIAR — Trefferbonus und Schadensformel des Goblins
    // =======================================================================
    test('(3) Bestiar, Goblin "+4": die Meldung rechnet den Bonus ein, der Wurf steht im Verlauf', async ({
        page
    }) => {
        const s = await laden(page);
        await goblinImBestiar(page);
        const m = await gemessen(page, s, () =>
            page
                .locator('#bestiary-detail-panel .bestiary-dice[data-value="1d20+4"]')
                .first()
                .click()
        );
        // URSACHE (B), eigene Zusage: der alte Parser warf "+4" weg — "= 11".
        // Mit der Aufschluesselung "(11+4)": die Summe allein haelt nicht fest,
        // dass die Klammer den Bonus nennt (Gegenstueck mit Minus in (11)).
        weich(
            m.meldungen,
            `Die Meldung muss den Trefferbonus einrechnen: 11 + 4 = 15 (${QUELLE.schnellreferenz})`
        ).toContainEqual(expect.stringContaining('1d20+4 = 15 (11+4)'));
        // URSACHE (A), eigene Zusage: Verlauf und Statistik.
        pruefeWurf(
            m,
            { notation: '1d20+4', summe: 15, wuerfe: [11], d20: true },
            'Bestiar Goblin +4',
            QUELLE.schnellreferenz
        );
    });

    test('(4) Bestiar, Goblin "1W6+2": die deutsche Schadensformel wird gewuerfelt', async ({
        page
    }) => {
        const s = await laden(page);
        await goblinImBestiar(page);
        const m = await gemessen(page, s, () =>
            page
                .locator('#bestiary-detail-panel .bestiary-dice[data-value="1W6+2"]')
                .first()
                .click()
        );
        weich(
            m.meldungen.filter(t => t.startsWith('error:')),
            `Ein Klick auf "1W6+2" darf keine Fehlermeldung bringen (${QUELLE.schnellreferenz})`
        ).toEqual([]);
        weich(m.meldungen, 'Die Meldung nennt 4 + 2 = 6').toContainEqual(
            expect.stringContaining('1W6+2 = 6')
        );
        // Im Verlauf in d-Schreibweise: ein Klick auf die Zeile setzt die
        // Notation ins Formelfeld, und parseDiceNotation() kennt nur d.
        pruefeWurf(
            m,
            { notation: '1d6+2', summe: 6, wuerfe: [4], d20: false },
            'Bestiar Goblin 1W6+2',
            QUELLE.schnellreferenz
        );
    });

    // =======================================================================
    // (5) INITIATIVE — das Statblock-Panel eines Goblins
    // =======================================================================
    test('(5) Initiative, Statblock-Panel des Goblins: "+4" steht mit Bonus im Verlauf', async ({
        page
    }) => {
        const s = await laden(page, [GOBLIN_KAEMPFER]);
        await page.evaluate(() => window.switchView('initiative'));
        await page.locator('#init-list [data-action="show-init-statblock"][data-id="1"]').click();
        await expect(page.locator('#init-statblock-panel')).toHaveClass(/show/);
        const m = await gemessen(page, s, () =>
            page
                .locator('#init-statblock-panel .bestiary-dice[data-value="1d20+4"]')
                .first()
                .click()
        );
        weich(m.meldungen, 'Die Meldung muss den Trefferbonus einrechnen').toContainEqual(
            expect.stringContaining('1d20+4 = 15')
        );
        pruefeWurf(
            m,
            { notation: '1d20+4', summe: 15, wuerfe: [11], d20: true },
            'Initiative-Statblock Goblin +4',
            QUELLE.schnellreferenz
        );
    });

    // =======================================================================
    // (6) STATISTIK-ANSICHT — der Wurf zaehlt, auch nach dem Neuladen
    // =======================================================================
    test('(6) Statistik-Ansicht: der Bestiar-Wurf zaehlt als d20 — auch nach dem Neuladen', async ({
        page
    }) => {
        const s = await laden(page);
        await goblinImBestiar(page);
        await gemessen(page, s, () =>
            page
                .locator('#bestiary-detail-panel .bestiary-dice[data-value="1d20+4"]')
                .first()
                .click()
        );

        await page.evaluate(() => window.switchView('dicestats'));
        const summe = page.locator('#dicestats-container .ds-rate-total');
        await weich(summe, 'Diese Session: ein d20-Wurf').toHaveText('Gesamt d20-Wuerfe: 1');
        // Gefuellt ist genau die Saeule der 11 — nicht nur irgendein Zaehler.
        const saeulen = await page
            .locator('#dicestats-container svg rect')
            .evaluateAll(rs => rs.map(r => Number(r.getAttribute('height'))));
        weich(
            saeulen.map((h, i) => (h > 0 ? i + 1 : 0)).filter(Boolean),
            'gefuellte Saeulen des Histogramms'
        ).toEqual([11]);

        // Der Verlauf lebt nur im Speicher (D-04a), die Statistik in der
        // IndexedDB: nach dem Neuladen zaehlt sie unter "Gesamt" weiter.
        await page.reload();
        await waitForAppReady(page);
        await page.evaluate(() => window.switchView('dicestats'));
        await page
            .locator('#dicestats-container [data-action="set-stats-scope"][data-value="total"]')
            .click();
        await weich(summe, 'Gesamt nach dem Neuladen: ein d20-Wurf').toHaveText(
            'Gesamt d20-Wuerfe: 1'
        );
        weich(s.dialoge, 'kein Dialog').toEqual([]);
    });

    // =======================================================================
    // (7) (8) SCHNELLWUERFE — Taste R, Alt+Ziffer, Befehlspalette
    // =======================================================================
    test('(7) Taste R: der d20 steht in Verlauf und Statistik', async ({ page }) => {
        const s = await laden(page);
        await fokusFrei(page);
        const m = await gemessen(page, s, () => page.keyboard.press('r'));
        // Der Schreibzugriff auf D.diceHistory BLEIBT: Migration, Backup-
        // Heuristik und die Multi-Tab-Werkbank der Unit-Tests kennen das Feld.
        weich(m.dVerlauf, 'D.diceHistory waechst weiter um 1').toBe(1);
        pruefeWurf(
            m,
            { notation: '1d20', summe: 11, wuerfe: [11], d20: true },
            'Taste R',
            QUELLE.schnellwurf
        );
    });

    test('(8) Alt+2, Alt+6 und die Befehlspalette: jeder Schnellwurf steht in Verlauf und Statistik', async ({
        page
    }) => {
        const s = await laden(page);
        await fokusFrei(page);

        const alt2 = await gemessen(page, s, () => page.keyboard.press('Alt+2'));
        pruefeWurf(
            alt2,
            { notation: '1d20', summe: 11, wuerfe: [11], d20: true },
            'Alt+2',
            QUELLE.schnellwurf
        );

        // Ein Schnellwurf OHNE d20: die Statistik hat ihn, der d20-Zaehler nicht.
        const alt6 = await gemessen(page, s, () => page.keyboard.press('Alt+6'));
        pruefeWurf(
            alt6,
            { notation: '1d6', summe: 4, wuerfe: [4], d20: false },
            'Alt+6',
            QUELLE.schnellwurf
        );

        await page.keyboard.press('Control+Shift+K');
        const eingabe = page.locator('.cp-overlay .cp-input');
        await expect(eingabe).toBeVisible();
        await eingabe.fill('Wuerfle d20');
        await expect(page.locator('.cp-overlay .cp-result-label').first()).toHaveText(
            'Wuerfle d20'
        );
        const palette = await gemessen(page, s, () => eingabe.press('Enter'));
        pruefeWurf(
            palette,
            { notation: '1d20', summe: 11, wuerfe: [11], d20: true },
            'Befehlspalette "Wuerfle d20"',
            QUELLE.schnellwurf
        );
    });

    // =======================================================================
    // (9) DER SCHADENSART-CHIP gehoert zum Wuerfel-Tab
    // =======================================================================
    test('(9) Schadensart-Chip "Feuer": er beschriftet die Wuerfe des Wuerfel-Tabs, nicht Fallschaden oder R', async ({
        page
    }) => {
        const s = await laden(page);
        await page.evaluate(() => window.switchView('dice'));
        // Die Chips liegen im zugeklappten "🎯 Schadenstyp" des Wuerfel-Tabs.
        await page
            .locator('#view-dice details.dice-details > summary', { hasText: 'Schadenstyp' })
            .click();
        const feuer = page.locator('#view-dice .dmg-chip[data-type="Feuer"]');
        await feuer.click();
        await expect(feuer).toHaveClass(/selected/);

        // Gegenprobe: im Wuerfel-Tab gilt der Chip weiter.
        const eigen = await gemessen(page, s, () =>
            page.locator('#view-dice .dice-die.d6').click()
        );
        weich(eigen.oben, 'Wuerfel-Tab d6 mit gewaehltem Chip').toEqual({
            notation: '1d6 (Feuer)',
            result: 4,
            rolls: [4]
        });

        await fokusFrei(page);
        const taste = await gemessen(page, s, () => page.keyboard.press('r'));
        weich(taste.verlauf, `Taste R: ein Eintrag (${QUELLE.schnellwurf})`).toBe(1);
        weich(taste.oben, `Taste R: ohne Schadensart (${QUELLE.eintrag})`).toEqual({
            notation: '1d20',
            result: 11,
            rolls: [11]
        });

        await fallschadenOeffnen(page);
        const fall = await gemessen(page, s, () =>
            page.locator('#quick-ref-panel .qref-dice-btn[data-dice="1d6"]').click()
        );
        weich(fall.verlauf, `Fallschaden: ein Eintrag (${QUELLE.schnellreferenz})`).toBe(1);
        weich(fall.oben, `Fallschaden ist kein "Feuer" (${QUELLE.eintrag})`).toEqual({
            notation: '1d6',
            result: 4,
            rolls: [4]
        });
        weich(s.dialoge, 'kein Dialog').toEqual([]);
    });

    // =======================================================================
    // (10) DM-SCREEN — eine ungueltige Freiformel ist kein Wurf
    // =======================================================================
    test('(10) DM-Screen, Freiformel "abc": kein Eintrag, kein alert(), eine Fehlermeldung', async ({
        page
    }) => {
        const s = await laden(page);
        await page.evaluate(() => window.switchView('dmscreen'));
        const feld = page.locator('#dms-dice-formula');
        const knopf = page.locator('#view-dmscreen [data-action="dms-roll-custom"]');

        // Gegenprobe ZUERST (ein alert aus "abc" stuende sonst auch hier):
        // eine gueltige Formel wird weiter gewuerfelt und eingetragen.
        await feld.fill('2d6+3');
        const gueltig = await gemessen(page, s, () => knopf.click());
        pruefeWurf(
            gueltig,
            { notation: '2d6+3', summe: 11, wuerfe: [4, 4], d20: false },
            'DM-Screen 2d6+3',
            QUELLE.dmScreen
        );

        await feld.fill('abc');
        const m = await gemessen(page, s, () => knopf.click());
        weich(m.dialoge, `"abc" darf keinen Dialog oeffnen (${QUELLE.dmScreen})`).toEqual([]);
        weich(m.verlauf, `"abc" ist kein Wurf: kein Verlaufseintrag (${QUELLE.dmScreen})`).toBe(0);
        weich(m.zeilen, '"abc": keine Zeile im Wuerfel-Tab').toBe(0);
        weich(m.statistik, '"abc": kein Datensatz in der Statistik').toBe(0);
        weich(
            m.meldungen.filter(t => t.startsWith('error:')),
            '"abc": genau eine Fehlermeldung'
        ).toHaveLength(1);
        weich(
            await page.locator('#dms-dice-result').textContent(),
            '"abc": keine Scheinsumme in der Ergebnisanzeige'
        ).not.toContain('abc');
        weich(m.fehler, '"abc": kein Fehler').toEqual([]);
    });

    // =======================================================================
    // (11) EIGENE KREATUR — Grenzformeln aus dem Text des Spielleiters
    // =======================================================================
    test('(11) Eigene Kreatur: "0W6" und "1W0" sind keine Wuerfe, "101W6" liegt ueber der Grenze, "100W6+1" und "2W6-1" werden gewuerfelt', async ({
        page
    }) => {
        const s = await laden(page, [], [GRENZLING]);
        await grenzlingImBestiar(page);
        /** @param {string} wert */
        const formel = wert =>
            page.locator(`#bestiary-detail-panel .bestiary-dice[data-value="${wert}"]`).first();

        // parseDiceNotation() macht aus der Anzahl 0 EINEN Wuerfel und aus 0
        // Seiten immer eine 1 (`parseInt(...) || 1`). Ohne eigene Pruefung in
        // rollQrefDice() stand "0W6" als "0d6" mit 4 im Verlauf, "1W0" als 1.
        for (const f of ['0W6', '1W0']) {
            pruefeKeinWurf(
                await gemessen(page, s, () => formel(f).click()),
                'Ungültige Würfelformel',
                `"${f}"`,
                QUELLE.schnellreferenz
            );
        }

        // Die Obergrenze (CLAUDE.md Regel 7) am Bildschirm, nicht nur im vm.
        pruefeKeinWurf(
            await gemessen(page, s, () => formel('101W6').click()),
            'Zu viele Würfel (höchstens 100)',
            '"101W6"',
            QUELLE.schnellreferenz
        );

        // Genau an der Grenze wird gewuerfelt. Ueber zehn Wuerfeln nennt die
        // Meldung keine Einzelwuerfe mehr.
        const grenze = await gemessen(page, s, () => formel('100W6+1').click());
        weich(grenze.meldungen, '"100W6+1": die Meldung nennt nur die Summe').toEqual([
            'info: 🎲 100W6+1 = 401'
        ]);
        pruefeWurf(
            grenze,
            { notation: '100d6+1', summe: 401, wuerfe: Array(100).fill(4), d20: false },
            '"100W6+1"',
            QUELLE.schnellreferenz
        );

        // Ein negativer Modifikator steht in der Aufschluesselung mit Vorzeichen.
        const minus = await gemessen(page, s, () => formel('2W6-1').click());
        weich(minus.meldungen, '"2W6-1": Summe und Aufschluesselung mit Abzug').toEqual([
            'info: 🎲 2W6-1 = 7 (4+4-1)'
        ]);
        pruefeWurf(
            minus,
            { notation: '2d6-1', summe: 7, wuerfe: [4, 4], d20: false },
            '"2W6-1"',
            QUELLE.schnellreferenz
        );
    });
});
