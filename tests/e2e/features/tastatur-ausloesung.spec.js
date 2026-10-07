// @ts-check
/**
 * Die Tastatur loest aus, was unter dem Fokus steht (Tastatur-Strang, T-A)
 * ========================================================================
 *
 * WORUEBER DIESE DATEI URTEILT. Der Spielleiter tabuliert in der
 * Initiative-Ansicht auf "◀ Zurueck", drueckt die Leertaste — und der Zug
 * geht VORWAERTS. Der Kampf ist eine Runde falsch und niemand sieht warum.
 * Ursache ist der globale Einzeltasten-Lauscher in
 * `systems/spellslots/keyboard-shortcuts.js`: seine Schranke (Zeilen 11-13)
 * nimmt nur INPUT/TEXTAREA/SELECT/contentEditable von den Einzeltasten-
 * Kuerzeln aus. Ein fokussierter `<button>` zaehlt dort NICHT als "am
 * Tippen", also faengt der Leertasten-Zweig (Zeile 168) die Taste ab, ruft
 * `preventDefault()` und schickt sie an `nextTurn()`. Die native Auslosung
 * des Knopfes findet nie statt.
 *
 * Betroffen sind KNOEPFE, die schon echte `<button>` SIND — keine
 * Nachruestung von `tabindex`/`role` hilft dagegen. Darum steht dieser Fall
 * vor allen anderen Schritten des Tastatur-Strangs: er ist die Ratsche, die
 * sie absichert.
 *
 * WARUM DAS EIN BROWSERFALL SEIN MUSS. Die Behauptung lautet "die Leertaste
 * auf diesem Knopf loest den Knopf aus". Das ist eine Aussage ueber das
 * Zusammenspiel dreier Dinge, von denen keines im Quelltext steht: die
 * Tabulatorreihenfolge des gesetzten Dokuments, die NATIVE Auslosung eines
 * `<button>` durch die Leertaste (Chromium erzeugt daraus selbst ein
 * `click`), und die Reihenfolge, in der zwei Lauscher auf `document` die
 * Taste sehen. Kein Quelltextfall kann darueber urteilen.
 *
 * MESSDISZIPLIN — drei Regeln, jede aus einer verdorbenen Messung gelernt:
 *
 *  1. NUR ECHTE TASTENDRUECKE. Der Fokus wird ausschliesslich mit
 *     `page.keyboard.press('Tab')` gesetzt, niemals mit `.focus()`, und das
 *     Ziel wird niemals mit `.click()` bedient. `.focus()` setzt den
 *     "sequential focus navigation starting point" anders als ein echter
 *     Tabulatorsprung; eine Messung, die so beginnt, misst eine andere
 *     Reihenfolge als der Nutzer erlebt.
 *
 *  2. KEIN `blur()` ALS STARTPUNKT, sondern ein frischer Seitenaufbau plus
 *     `window.switchView()` ohne Klick. Chromiums Startpunkt der
 *     Tabulatornavigation UEBERLEBT ein `blur()` — die erste Vermessung
 *     dieses Strangs war daran gescheitert. Jeder Fall unten hat darum seine
 *     eigene Seite (Playwright gibt je `test()` eine frische) und klickt
 *     NICHTS, bevor er tabuliert.
 *
 *  3. DAS ZIEL WIRD UEBER OBJEKTIDENTITAET AUFGELOEST, nie ueber Signatur
 *     oder Text. Eine dokumentweite Suche nach `show-hp-calculator` trifft
 *     auch Knoepfe anderer Ansichten; eine Textsuche nach "Zustaende" trifft
 *     nach einer Nachruestung ein anderes Element als vorher. `zielMerken()`
 *     legt den Knoten unter `window.__ziel` ab, und der Zaehler vergleicht
 *     mit `===`.
 *
 * WARUM DER KLICKZAEHLER AM DOKUMENT HAENGT UND NICHT AM ZIEL — gemessen,
 * nicht vermutet. `EventDelegation.init()` haengt seinen `click`-Lauscher in
 * der CAPTURE-Phase an `document` (`ui/event-delegation.js`, Zeile 40), und
 * `_handleClick` ruft fuer jede registrierte Aktion `e.stopPropagation()`
 * (Zeile 103). Ein Lauscher AM ZIEL wird dadurch NIE erreicht: nachgemessen
 * kam der native Klick am Dokument an (`ev.target === ziel`), am Element
 * selbst 0 mal. Der Zaehler sitzt deshalb ebenfalls am Dokument in der
 * Capture-Phase — `stopPropagation()` hemmt weitere Lauscher am SELBEN
 * Knoten nicht, nur `stopImmediatePropagation()` wuerde das tun — und
 * filtert ueber Objektidentitaet. Wer den Zaehler "aufraeumt" und ans
 * Element haengt, misst ab sofort konstant 0 und haelt den Fehler fuer
 * behoben.
 *
 * GEZAEHLT WIRD DAS EREIGNIS, NICHT DIE WIRKUNG. Jeder Fall prueft beides
 * getrennt: `echt` (isTrusted, also die native Auslosung des Browsers) und
 * `synthetisch` (ein per `element.click()` erzeugtes Ereignis). So steht die
 * Antwort auf "loest etwas doppelt aus?" in der Messung und nicht in einer
 * Auslegung der Wirkung — eine Wirkung, die zweimal eintritt, ist bei
 * `nextTurn()` von einer einmaligen nicht zu unterscheiden, wenn man nur den
 * Zug liest.
 *
 * GEFUELLTE KAMPAGNE, SECHS KAEMPFER. Der eigene Seed unten ersetzt
 * `seedPopulatedSession()` aus den Helfern, aus zwei gemessenen Gruenden:
 * jener Seed hat genau EINEN Kaempfer (die Wege in der Initiative-Ansicht
 * waeren damit kuerzer als bei jedem echten Kampf), und `addPartyToInit()`
 * UEBERSPRINGT Charaktere, deren Name schon unter den Kaempfern steht. Die
 * drei Helden heissen darum anders als die sechs Kaempfer — sonst waere die
 * Pruefung (c) auch nach der Korrektur gruen, weil nichts dazukaeme.
 *
 * DIE ERWARTETEN WIRKUNGEN SIND AUS DEN FUNKTIONEN ABGELESEN, nicht geraten:
 *   - `prevTurn()` (core/init.js) zieht `currentTurn` um eins ab und springt
 *     bei Unterschreitung auf den LETZTEN Kaempfer; die Runde sinkt nur bei
 *     `encounterRound > 1`, hier also nicht. Aus Zug 0 wird Zug 5.
 *   - `nextEncounterRound()` (systems/undo.js) erhoeht die Runde und laesst
 *     den Zug stehen: Runde 1 -> 2, Zug 0 -> 0.
 *   - `addPartyToInit()` (features/initiative.js) haengt jeden Charakter an,
 *     dessen Name noch nicht vorkommt: 6 -> 9 Kaempfer.
 *   - `rollAllInitiative()` (initiative-extras.js) setzt auf JEDEM Kaempfer
 *     ein `lastRoll`. Das ist das DETERMINISTISCHE Merkmal; die gewuerfelten
 *     Werte selbst sind zufaellig und taugen nicht als Zusicherung.
 *
 * KURZFORM DREIER MODULNAMEN OBEN UND UNTEN, mit Absicht — sie sieht wie
 * eine Umgehung aus und muss darum begruendet werden. Das Abdeckungs-Gate in
 * `tests/unit/module-test-coverage.test.js` sucht einen Modulpfad als
 * Teilzeichenkette in allen Testdateien und zaehlt JEDEN Treffer als
 * Abdeckung, auch einen im Erklaertext. `initiative-extras.js`,
 * `quick-actions.js` und `dice-core.js` stehen dort auf der datierten
 * Ausnahmeliste; dieser Fall prueft sie NICHT, er nennt nur die Herkunft
 * einer Wirkung. Mit vollem Pfad haette das Gate verlangt, sie von der Liste
 * zu streichen — und damit eine Abdeckung behauptet, die es nicht gibt.
 * Dasselbe Muster steht bei `rich-text-toolbars.js` in
 * `tests/e2e/features/tastenhilfen.spec.js`. Fuer
 * `systems/spellslots/keyboard-shortcuts.js` gilt das NICHT: dieser Fall
 * prueft genau dessen Schranke und Zweige, der Pfad steht darum voll da, und
 * der Eintrag ist aus der Ausnahmeliste gestrichen.
 *
 * WAS DIESER FALL NICHT FESTSCHREIBT: die Zahl der Tabulatorspruenge bis zu
 * einem Ziel. Sie ist gemessen (21 / 22 / 23 / 24 / 27 in der Initiative, 20
 * in der Wuerfelansicht, bei sechs Kaempfern und 1440 px) und steht als
 * Befund in `TABULATORWEGE` — aber als ZUSICHERUNG waere sie eine Fessel um
 * jede kuenftige Werkzeugleiste. Zugesichert wird nur, DASS das Ziel per
 * Tabulator erreichbar ist, und was die Taste dort tut.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/**
 * Gemessene Wege (HEAD 4e0d810, gefuellte Kampagne, sechs Kaempfer, 1440 px,
 * echte Tabulatorspruenge). Befund, keine Zusicherung — s. Kopfkommentar.
 */
const TABULATORWEGE = {
    prevTurn: 21,
    nextEncounterRound: 22,
    addPartyToInit: 23,
    rollAllInitiative: 24,
    conditionReference: 27,
    nextTurn: 20,
    wuerfelD4: 20
};

/** Obergrenze der Tabulatorsuche. 87 Halte hat die Initiative bei sechs Kaempfern. */
const MAX_SPRUENGE = 200;

/**
 * Gefuellte Kampagne mit sechs Kaempfern. Die drei Helden tragen ANDERE
 * Namen als die Kaempfer — `addPartyToInit()` ueberspringt Namensgleiche.
 */
const KAMPF_SEED = {
    _version: '99.0.0',
    settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
    randomTables: [],
    timers: [],
    campaign: {},
    shops: [],
    factions: [],
    characters: [
        {
            id: 1,
            name: 'Held Eins (Tastatur-Strang)',
            characterClass: 'Kaempfer',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 }
        },
        {
            id: 2,
            name: 'Held Zwei (Tastatur-Strang)',
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 30,
            hpMax: 30,
            armorClass: 12,
            attributes: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 }
        },
        {
            id: 3,
            name: 'Held Drei (Tastatur-Strang)',
            characterClass: 'Schurke',
            level: 5,
            hpCurrent: 34,
            hpMax: 34,
            armorClass: 15,
            attributes: { str: 10, dex: 18, con: 12, int: 12, wis: 12, cha: 14 }
        }
    ],
    npcs: [{ id: 1, name: 'Haendler (Tastatur-Strang)', role: 'Merchant', race: 'Mensch' }],
    locations: [{ id: 1, name: 'Testort (Tastatur-Strang)' }],
    quests: [],
    loot: [],
    spells: [],
    wiki: [],
    sessionNotes: [],
    encounters: [],
    initiative: {
        combatants: [
            {
                id: 1,
                name: 'Alrik',
                initiative: 20,
                initBonus: 2,
                maxHp: 40,
                currentHp: 40,
                ac: 16,
                type: 'player',
                effects: []
            },
            {
                id: 2,
                name: 'Mira',
                initiative: 19,
                initBonus: 2,
                maxHp: 30,
                currentHp: 30,
                ac: 12,
                type: 'player',
                effects: []
            },
            {
                id: 3,
                name: 'Boros',
                initiative: 18,
                initBonus: 2,
                maxHp: 34,
                currentHp: 34,
                ac: 15,
                type: 'player',
                effects: []
            },
            {
                id: 4,
                name: 'Ork A',
                initiative: 17,
                initBonus: 2,
                maxHp: 25,
                currentHp: 25,
                ac: 13,
                type: 'monster',
                effects: []
            },
            {
                id: 5,
                name: 'Ork B',
                initiative: 16,
                initBonus: 2,
                maxHp: 25,
                currentHp: 25,
                ac: 13,
                type: 'monster',
                effects: []
            },
            {
                id: 6,
                name: 'Troll',
                initiative: 15,
                initBonus: 2,
                maxHp: 60,
                currentHp: 60,
                ac: 15,
                type: 'monster',
                effects: []
            }
        ],
        currentTurn: 0,
        round: 1
    },
    mindmap: { nodes: [], connections: [] },
    calendar: {},
    partyGold: 0,
    quickRefCustom: [],
    _nextId: {
        characters: 4,
        npcs: 2,
        locations: 2,
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

/**
 * Frischer Seitenaufbau, gefuellte Kampagne, Ansicht per `switchView()`
 * gesetzt — OHNE Klick, damit Chromiums Startpunkt der Tabulatornavigation
 * am Dokumentanfang steht (Messdisziplin 2).
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 */
async function ansichtOeffnen(page, ansicht) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, KAMPF_SEED);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(500);
}

/**
 * Tabuliert mit ECHTEN Tastendruecken, bis das fokussierte Element die
 * verlangten data-Attribute traegt. Gibt die Zahl der Spruenge zurueck, 0
 * wenn das Ziel in MAX_SPRUENGE Spruengen nicht erreichbar war.
 * @param {import('@playwright/test').Page} page
 * @param {{ action: string, value?: string }} merkmal
 */
async function tabBisZiel(page, merkmal) {
    for (let i = 1; i <= MAX_SPRUENGE; i++) {
        await page.keyboard.press('Tab');
        const treffer = await page.evaluate(m => {
            const el = document.activeElement;
            if (!el || el === document.body) return false;
            if (el.getAttribute('data-action') !== m.action) return false;
            if (m.value !== undefined && el.getAttribute('data-value') !== m.value) return false;
            return true;
        }, merkmal);
        if (treffer) return i;
    }
    return 0;
}

/**
 * Merkt das fokussierte Element unter `window.__ziel` und zaehlt ab jetzt
 * die click-Ereignisse, deren `target` GENAU dieses Objekt ist. Zaehler am
 * Dokument in der Capture-Phase — Begruendung im Kopfkommentar.
 * @param {import('@playwright/test').Page} page
 */
async function zielMerken(page) {
    await page.evaluate(() => {
        const el = document.activeElement;
        window.__ziel = el;
        window.__klicks = { echt: 0, synthetisch: 0 };
        document.addEventListener(
            'click',
            ev => {
                if (ev.target !== window.__ziel) return;
                if (ev.isTrusted) window.__klicks.echt++;
                else window.__klicks.synthetisch++;
            },
            true
        );
    });
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ echt: number, synthetisch: number }>}
 */
function klicks(page) {
    return page.evaluate(() => window.__klicks);
}

/**
 * @param {import('@playwright/test').Page} page
 */
function kampfZustand(page) {
    return page.evaluate(() => ({
        zug: window.D.initiative.currentTurn,
        runde: window.D.initiative.round,
        kaempfer: window.D.initiative.combatants.length,
        mitWurf: window.D.initiative.combatants.filter(c => typeof c.lastRoll === 'number').length,
        ansicht: document.querySelector('.view.active')?.id || '?',
        scrollY: Math.round(window.scrollY)
    }));
}

/**
 * Richtet einen Fall ein: Ansicht oeffnen, per echter Tastatur zum Ziel,
 * Zaehler setzen, Ausgangszustand lesen.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {{ action: string, value?: string }} merkmal
 */
async function zielAnfahren(page, ansicht, merkmal) {
    await ansichtOeffnen(page, ansicht);
    const spruenge = await tabBisZiel(page, merkmal);
    expect(
        spruenge,
        `Ziel [data-action="${merkmal.action}"${merkmal.value ? ` data-value="${merkmal.value}"` : ''}] ` +
            `war in ${MAX_SPRUENGE} echten Tabulatorspruengen nicht erreichbar`
    ).toBeGreaterThan(0);
    await zielMerken(page);
    return { spruenge, vorher: await kampfZustand(page) };
}

test.describe('Die Leertaste bedient den Knopf unter dem Fokus', () => {
    test('(a) Leertaste auf "◀ Zurueck" geht ZURUECK, nicht vorwaerts', async ({ page }) => {
        const { spruenge, vorher } = await zielAnfahren(page, 'initiative', {
            action: 'call',
            value: 'prevTurn'
        });
        expect(vorher.zug).toBe(0);
        expect(vorher.runde).toBe(1);

        await page.keyboard.press(' ');
        await page.waitForTimeout(500);

        const nachher = await kampfZustand(page);
        const k = await klicks(page);

        // Der Knopf hat GENAU EINMAL ausgeloest — und zwar nativ (echt).
        expect(k.echt, `nativer Klick am Ziel (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch, 'kein zusaetzlicher synthetischer Klick').toBe(0);
        // prevTurn() aus Zug 0: springt auf den letzten der sechs Kaempfer.
        expect(nachher.zug, 'prevTurn() muss auf den letzten Kaempfer springen').toBe(5);
        // Die Runde bleibt: prevTurn() senkt sie nur bei encounterRound > 1.
        expect(nachher.runde).toBe(1);
        // Die Leertaste darf die Seite nicht wegrollen.
        expect(nachher.scrollY).toBe(vorher.scrollY);
    });

    test('(b) Leertaste auf "⏭️ Neue Runde" erhoeht die RUNDE', async ({ page }) => {
        const { spruenge, vorher } = await zielAnfahren(page, 'initiative', {
            action: 'call',
            value: 'nextEncounterRound'
        });
        expect(vorher.runde).toBe(1);

        await page.keyboard.press(' ');
        await page.waitForTimeout(500);

        const nachher = await kampfZustand(page);
        const k = await klicks(page);

        expect(k.echt, `nativer Klick am Ziel (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch).toBe(0);
        expect(nachher.runde, 'nextEncounterRound() muss die Runde erhoehen').toBe(2);
        expect(nachher.zug, 'der Zug bleibt beim ersten Kaempfer').toBe(0);
    });

    test('(c) Leertaste auf "+ Party" fuegt die Helden hinzu', async ({ page }) => {
        const { spruenge, vorher } = await zielAnfahren(page, 'initiative', {
            action: 'call',
            value: 'addPartyToInit'
        });
        expect(vorher.kaempfer).toBe(6);

        await page.keyboard.press(' ');
        await page.waitForTimeout(600);

        const nachher = await kampfZustand(page);
        const k = await klicks(page);

        expect(k.echt, `nativer Klick am Ziel (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch).toBe(0);
        // Drei Helden mit Namen, die noch nicht unter den Kaempfern stehen.
        expect(nachher.kaempfer, 'addPartyToInit() muss die drei Helden anhaengen').toBe(9);
        expect(nachher.zug, 'der Zug darf sich dabei nicht verschieben').toBe(0);
    });

    test('(d) Leertaste auf "🎲 Alle wuerfeln" wuerfelt alle Kaempfer', async ({ page }) => {
        const { spruenge, vorher } = await zielAnfahren(page, 'initiative', {
            action: 'call',
            value: 'rollAllInitiative'
        });
        expect(vorher.mitWurf, 'vor dem Wurf traegt kein Kaempfer ein lastRoll').toBe(0);

        await page.keyboard.press(' ');
        await page.waitForTimeout(600);

        const nachher = await kampfZustand(page);
        const k = await klicks(page);

        expect(k.echt, `nativer Klick am Ziel (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch).toBe(0);
        // Deterministisches Merkmal: rollAllInitiative() setzt lastRoll auf JEDEM.
        expect(nachher.mitWurf, 'nach dem Wurf traegt jeder der sechs ein lastRoll').toBe(6);
        expect(nachher.zug, 'rollAllInitiative() setzt den Zug auf den ersten').toBe(0);
    });

    test('(e) Leertaste auf "📋 Zustaende" oeffnet den Spickzettel', async ({ page }) => {
        const { spruenge } = await zielAnfahren(page, 'initiative', {
            action: 'show-condition-reference'
        });

        await page.keyboard.press(' ');
        await page.waitForTimeout(600);

        const k = await klicks(page);
        const offen = await page.evaluate(
            () => !!document.querySelector('.modal-overlay.show, .modal-overlay.modal-transient')
        );
        const nachher = await kampfZustand(page);

        expect(k.echt, `nativer Klick am Ziel (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch).toBe(0);
        expect(offen, 'der Zustands-Spickzettel muss offen sein').toBe(true);
        expect(nachher.zug, 'der Zug darf sich nicht bewegen').toBe(0);
    });

    test('(f) Gegenprobe Wuerfelansicht: dort war die Leertaste nie gekapert', async ({ page }) => {
        // Diese Pruefung ist VOR und NACH der Korrektur gruen. Sie belegt,
        // dass die Messung etwas misst: in der Wuerfelansicht greift der
        // Leertasten-Zweig gar nicht (er verlangt #view-initiative.active),
        // also loest der Knopf schon heute aus.
        const { spruenge } = await zielAnfahren(page, 'dice', {
            action: 'roll-dice',
            value: '4'
        });

        await page.keyboard.press(' ');
        await page.waitForTimeout(600);

        const k = await klicks(page);
        // Das Wurfergebnis landet in der modulinternen Historie des
        // Wuerfelmoduls, die als `window.diceHistory` nach draussen gegeben
        // ist (Kurzform des Modulnamens: s. Kopfkommentar).
        const wuerfe = await page.evaluate(() => (window.diceHistory || []).length);

        expect(k.echt, `nativer Klick am Ziel (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch).toBe(0);
        expect(wuerfe, 'der d4 muss gewuerfelt haben').toBeGreaterThanOrEqual(1);
    });

    test('(g) Ziffer auf einem fokussierten Knopf wechselt die Ansicht NICHT', async ({ page }) => {
        // Ein Knopf hat keine native Ziffern-Handlung. Die Taste darf
        // deshalb nichts tun — und vor allem nicht die Ansicht wechseln und
        // damit den muehsam ertabulierten Fokus vernichten.
        const { spruenge, vorher } = await zielAnfahren(page, 'initiative', {
            action: 'call',
            value: 'nextTurn'
        });
        expect(vorher.ansicht).toBe('view-initiative');

        await page.keyboard.press('1');
        await page.waitForTimeout(500);

        const nachher = await kampfZustand(page);
        const k = await klicks(page);

        expect(
            nachher.ansicht,
            `Ziffer "1" am Halt ${spruenge} darf die Ansicht nicht wechseln`
        ).toBe('view-initiative');
        expect(k.echt, 'eine Ziffer loest keinen Knopf aus').toBe(0);
        expect(k.synthetisch).toBe(0);
        expect(nachher.zug, 'und sie bewegt den Zug nicht').toBe(0);
    });
});

test.describe('Was unangetastet bleibt (Gegenproben, vor und nach der Korrektur gruen)', () => {
    test('(h) Leertaste OHNE Fokus wechselt weiter den Zug', async ({ page }) => {
        // Der gewohnte Griff des Spielleiters: Seite offen, nichts fokussiert,
        // Leertaste = naechster Zug. Dieser Weg darf nicht verloren gehen.
        await ansichtOeffnen(page, 'initiative');
        const aktiv = await page.evaluate(() => document.activeElement?.tagName);
        expect(aktiv, 'kein Bedienelement fokussiert').toBe('BODY');

        const vorher = await kampfZustand(page);
        await page.keyboard.press(' ');
        await page.waitForTimeout(500);
        const nachher = await kampfZustand(page);

        expect(vorher.zug).toBe(0);
        expect(nachher.zug, 'Leertaste ohne Fokus muss weiter nextTurn() rufen').toBe(1);
        expect(nachher.runde).toBe(1);
    });

    test('(i) n / p / Shift+N wirken weiter auf einem fokussierten Knopf', async ({ page }) => {
        // O-7: die Schranke wird NUR fuer die Leertaste und die Ziffern 1-9
        // erweitert. Wer sie "konsequent" auf alle Einzeltasten ausweitet,
        // nimmt dem Nutzer Wege weg, die heute funktionieren.
        for (const fall of [
            { taste: 'n', feld: 'zug', erwartet: 1 },
            { taste: 'p', feld: 'zug', erwartet: 5 },
            { taste: 'Shift+N', feld: 'runde', erwartet: 2 }
        ]) {
            await ansichtOeffnen(page, 'initiative');
            const spruenge = await tabBisZiel(page, { action: 'call', value: 'nextTurn' });
            expect(spruenge).toBeGreaterThan(0);

            await page.keyboard.press(fall.taste);
            await page.waitForTimeout(500);
            const nachher = await kampfZustand(page);

            expect(
                nachher[fall.feld],
                `"${fall.taste}" muss auf einem fokussierten Knopf weiter wirken`
            ).toBe(fall.erwartet);
        }
    });

    test('(j) t / l / k / / wirken weiter auf einem fokussierten Knopf', async ({ page }) => {
        // Dieselbe Gegenprobe fuer die vier Kuerzel, die heute der EINZIGE
        // funktionierende Zugang zu ihrer Flaeche sind — die Schnellreferenz
        // (`/`) und das Kampfprotokoll (`k`) voran.
        const faelle = [
            {
                taste: 't',
                pruef: () =>
                    !!document.querySelector(
                        '.timer-display.running, #session-timer.running, [data-timer-running="true"]'
                    )
            },
            {
                taste: 'l',
                pruef: () =>
                    !!document.querySelector(
                        '#event-log.persistent, #event-log.show, #event-log.visible'
                    )
            },
            { taste: 'k', pruef: () => !!document.querySelector('#kampflog-panel.active') },
            {
                taste: '/',
                pruef: () =>
                    !!document.querySelector('#quick-ref-panel.active, #quick-ref-panel.open')
            }
        ];
        for (const fall of faelle) {
            await ansichtOeffnen(page, 'initiative');
            const spruenge = await tabBisZiel(page, { action: 'call', value: 'nextTurn' });
            expect(spruenge).toBeGreaterThan(0);

            const vorher = await page.evaluate(`(${fall.pruef.toString()})()`);
            await page.keyboard.press(fall.taste);
            await page.waitForTimeout(600);
            const nachher = await page.evaluate(`(${fall.pruef.toString()})()`);

            expect(vorher, `"${fall.taste}": Ausgangszustand`).toBe(false);
            expect(nachher, `"${fall.taste}" muss auf einem fokussierten Knopf weiter wirken`).toBe(
                true
            );
        }
    });

    test('(k) die gemessenen Wege sind weiter per Tabulator erreichbar', async ({ page }) => {
        // Kein Weg wird auf eine Zahl festgenagelt (s. Kopfkommentar), aber
        // die Erreichbarkeit selbst ist zugesichert — und die gemessenen
        // Zahlen stehen hier als Befund, damit eine Verschiebung sichtbar
        // wird, ohne den Fall rot zu machen.
        //
        // JE ZIEL EINE EIGENE SEITE, nicht dieselbe neu geladen. Gemessen,
        // warum das den Unterschied macht: beim ERSTEN Aufbau belegen die
        // zwei Knoepfe des Umzugs-Hinweises ("Zum App-Umzug", "Hinweis
        // schliessen") die Halte 1 und 2; nach einem Neuladen derselben
        // Seite ist der Hinweis weg und die GANZE Reihe rutscht um zwei
        // nach vorn (19/20/21/22/18 statt 21/22/23/24/20). Beides sind
        // richtige Messungen zweier verschiedener, echter Lagen — aber ein
        // Vergleich der einen gegen die Zahlen der anderen meldet eine
        // Verschiebung, die es nicht gibt. TABULATORWEGE haelt den ersten
        // Aufbau fest, also muss hier auch der erste Aufbau gemessen
        // werden.
        const wege = {};
        for (const wert of [
            'prevTurn',
            'nextEncounterRound',
            'addPartyToInit',
            'rollAllInitiative',
            'nextTurn'
        ]) {
            const seite = await page.context().newPage();
            await ansichtOeffnen(seite, 'initiative');
            wege[wert] = await tabBisZiel(seite, { action: 'call', value: wert });
            await seite.close();
            expect(wege[wert], `${wert} muss per Tabulator erreichbar sein`).toBeGreaterThan(0);
        }
        // Befundzeile fuer die Akte — die Zahlen aus TABULATORWEGE daneben.
        for (const name of Object.keys(wege)) {
            if (wege[name] !== TABULATORWEGE[name]) {
                process.stdout.write(
                    `[Tastatur-Strang] Weg zu "${name}" verschoben: ` +
                        `gemessen ${wege[name]}, Befund bei 4e0d810 ${TABULATORWEGE[name]}\n`
                );
            }
        }
    });
});
