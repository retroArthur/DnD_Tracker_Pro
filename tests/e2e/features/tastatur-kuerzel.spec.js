// @ts-check
/**
 * Ein Kuerzel fuer den Lebenspunkte-Rechner (Tastatur-Strang, E-4)
 * ================================================================
 *
 * WORUEBER DIESE DATEI URTEILT. Der Spielleiter will dem Kaempfer, der
 * gerade am Zug ist, Schaden eintragen. Gemessen am gebauten Buendel,
 * gefuellte Kampagne, sechs Kaempfer, 1440 px, echte Tabulatorspruenge
 * (Vermessung des Strangs, HEAD 4e0d810): der Lebenspunkte-Rechner des
 * vierten Kaempfers liegt **62 Tabulatorspruenge** vom Seitenanfang
 * entfernt; die ganze Handlung kostet rund **64 Tastendruecke** (62 Tab +
 * Enter + Zahl + 1 Tab + Enter). Sieben Halte je Kampfzeile, und die Zahl
 * waechst mit jedem Kaempfer.
 *
 * Alle anderen Kampfwerkzeuge haben ein Kuerzel — Zugwechsel (`n`, `p`,
 * Leertaste, Shift+N), Wuerfel (`r`, Alt+Ziffer), Kampfprotokoll (`k`),
 * Schnellreferenz (`/`), Sitzungsuhr (`t`), Ereignislog (`l`). Die
 * Trefferpunkte sind das EINZIGE, das keines hat. Das ist der Gegenstand
 * von Nutzerentscheidung E-4.
 *
 * WARUM `h`, UND NICHT EINE ANDERE TASTE. Nachgezaehlt, nicht der Liste des
 * Auftrags geglaubt: ein eigenes Messskript hat in drei Ansichten
 * (Initiative, Armaturenbrett, DM-Schirm) je 68 Kandidaten (a-z, 0-9,
 * 32 Zeichen) mit einem echten Tastendruck bei Fokus auf BODY gedrueckt und
 * zwei Dinge gelesen: `defaultPrevented` in einem Lauscher am `window` in
 * der BUBBLE-Phase (er liegt hinter allen App-Lauschern, die an `document`
 * haengen — jeder Einzeltasten-Zweig der App ruft `preventDefault()`) und
 * eine Wirkungsspur aus zwoelf Groessen (Runde, Zug, Ansicht, offene
 * Schale, Schnellreferenz, Tastenhilfe, Ereignislog, Kampfprotokoll,
 * Wuerfelverlauf, Sitzungsuhr, Trefferpunkte aller Kaempfer, `scrollY`).
 * Ergebnis in der Initiative-Ansicht: **17 belegt** (`k l n p r t 1 2 3 4 5
 * 6 7 8 9 / ?`), **51 frei**. `h` ist in allen drei Ansichten frei — kein
 * `preventDefault()`, keine Wirkung.
 *
 * Unter den 51 freien Tasten ist `h` die mnemonische: die App nennt die
 * Sache selbst ueberall "HP" — der Knopf in der Kampfzeile heisst
 * `title="HP ändern"`, der Knopf auf der Heldenkarte "❤️ HP", die
 * Dialogueberschrift "HP: <Name>". Und sie passt in das bestehende Schema,
 * in dem jedes Einzeltasten-Kuerzel der Anfangsbuchstabe seines Ziels ist
 * (t=Timer, l=Log, k=Kampfprotokoll, n=Naechster, p=Vorheriger, r=Rollen).
 * `l` fuer "Lebenspunkte" ist vergeben (Ereignislog), `t` fuer
 * "Trefferpunkte" ebenfalls (Sitzungsuhr) — beide gemessen belegt.
 *
 * WAS DAS KUERZEL TUN SOLL, IN EINEM SATZ: GENAU DAS, was ein Klick auf den
 * ➗-Knopf der aktiven Kampfzeile tut — `showHpCalculator('combatant', id)`
 * mit der Kennung des Kaempfers am Zug. Fall (l) sichert diese Gleichheit
 * ab, statt sie zu behaupten: er fahrt den ➗-Knopf der aktiven Zeile mit
 * echten Tabulatorspruengen an, loest ihn mit Enter aus, liest den
 * Dialogzustand, und vergleicht ihn mit dem, den das Kuerzel herstellt.
 *
 * UND WANN ES NICHTS TUN SOLL — vier Schranken, jede mit eigenem Fall:
 *   (d) nicht ausserhalb der Initiative-Ansicht,
 *   (e) nicht in einem Eingabefeld (dieselbe Schranke, die T-A repariert hat),
 *   (f) nicht ohne Kaempfer am Zug,
 *   (g) nicht auf einem Legendaren-Aktions-Eintrag (`type: 'lair'`) — dessen
 *       Zeile hat gar keine Trefferpunkte und bietet auch der Maus keinen
 *       ➗-Knopf an,
 *   (h) nicht ueber einem bereits offenen Dialog.
 * Es tut dann nichts und SAGT das nicht: kein Hinweis, kein Toast.
 *
 * MESSDISZIPLIN — unveraendert aus `tastatur-ausloesung.spec.js` uebernommen,
 * denn die drei Regeln stammen aus verdorbenen Messungen dieses Strangs:
 *
 *  1. NUR ECHTE TASTENDRUECKE. `page.keyboard.press` / `.type`, niemals
 *     `.focus()` und niemals `.click()` auf ein Ziel.
 *  2. KEIN `blur()` ALS STARTPUNKT, sondern ein frischer Seitenaufbau plus
 *     `window.switchView()` OHNE Klick. Chromiums "sequential focus
 *     navigation starting point" UEBERLEBT ein `blur()`.
 *  3. ZIELE UEBER OBJEKTIDENTITAET bzw. ueber data-Attribute samt `data-id`,
 *     nie ueber Text — sechs Kampfzeilen tragen denselben Knopftext.
 *
 * WARUM DAS EIN BROWSERFALL SEIN MUSS UND KEIN JSDOM-FALL. Die Behauptung
 * lautet "ein Tastendruck oeffnet den Rechner auf dem richtigen Kaempfer und
 * der Fokus landet im Wertfeld". Daran haengen die Tabulatorreihenfolge des
 * gesetzten Dokuments, die Fokusfalle aus T-D (`ui/modal-focus.js` nimmt den
 * Tabulator im offenen Dialog vollstaendig an sich) und die Reihenfolge
 * dreier `keydown`-Lauscher am `document`. Kein Quelltextfall urteilt
 * darueber.
 *
 * ROTER NACHWEIS (gemessen an HEAD 3316310, vor der Umsetzung, zweimal
 * gefahren, gleiches Ergebnis): **7 Fehlschlaege / 5 bestanden**.
 *   rot   (a) `h` oeffnet den Rechner                    — Dialog bleibt zu
 *   rot   (b) er trifft den Kaempfer am Zug              — kein Dialog
 *   rot   (c) Schaden mit vier Tastendruecken            — 34 bleibt 34
 *   rot   (h) kein zweiter Dialog ueber dem offenen      — kein erster Dialog
 *   rot   (i) die Tastenhilfe fuehrt das Kuerzel         — Zeile fehlt
 *   rot   (k) die Kosten fallen von ~64 auf 4            — Kuerzelweg fehlt
 *   rot   (l) Kuerzel und ➗-Knopf stellen dasselbe her   — kein Dialog
 *   gruen (d) nicht ausserhalb der Initiative            — Schranke, vorher wie nachher
 *   gruen (e) nicht im Eingabefeld                       — Schranke
 *   gruen (f) nicht ohne Kaempfer am Zug                 — Schranke
 *   gruen (g) nicht auf einer Lair-Zeile                 — Schranke
 *   gruen (j) nach Escape gehoert die Leertaste dem Zug  — Schranke
 * Die fuenf gruenen sind Schranken: sie waren vorher gruen, weil es das
 * Kuerzel nicht gab, und muessen nachher gruen BLEIBEN. Eine Umsetzung, die
 * den Zweig vor die `isTyping`-Schranke legt, macht (e) rot; eine, die den
 * Kaempfer nicht prueft, macht (f) oder (g) rot; eine, die einen Oeffner
 * vortaeuscht, macht (j) rot.
 *
 * WARUM (j) UEBERHAUPT DRINSTEHT. Nach T-A gehoert die Leertaste dem
 * fokussierten Bedienelement. Wuerde das Kuerzel dem Dialog einen Oeffner
 * unterschieben (etwa den ➗-Knopf der aktiven Zeile), kehrte der Fokus nach
 * Escape dorthin zurueck — und die Leertaste wechselte danach NICHT mehr den
 * Zug, sondern oeffnete den Rechner wieder. Genau der Fehler, den T-A
 * beseitigt hat, zurueck durch die Hintertuer. Ein per Kuerzel geoeffneter
 * Dialog darf den Fokus deshalb FREI zuruecklassen.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/** Das Kuerzel aus E-4. Begruendung der Wahl im Kopfkommentar. */
const KUERZEL = 'h';

/** Obergrenze der Tabulatorsuche. Rund 100 Halte hat die Initiative bei sechs Kaempfern. */
const MAX_SPRUENGE = 220;

/**
 * Gemessene Kosten OHNE Kuerzel (Vermessung des Strangs, HEAD 4e0d810,
 * sechs Kaempfer): 42/49/56/62/68/74 Spruenge bis zum ➗-Knopf des n-ten
 * Kaempfers. Befund, keine Zusicherung — Fall (k) misst selbst und
 * vergleicht nur die GROESSENORDNUNG.
 */
const VERMESSUNG_SPRUENGE_VIERTER = 62;

/**
 * Gefuellte Kampagne mit sechs Kaempfern. Die Helden tragen ANDERE Namen als
 * die Kaempfer — `addPartyToInit()` ueberspringt Namensgleiche.
 */
function kampfSeed(extra = {}) {
    return {
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
                name: 'Held Eins (E-4)',
                characterClass: 'Kaempfer',
                level: 5,
                hpCurrent: 40,
                hpMax: 40,
                armorClass: 16,
                attributes: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 }
            },
            {
                id: 2,
                name: 'Held Zwei (E-4)',
                characterClass: 'Magier',
                level: 5,
                hpCurrent: 30,
                hpMax: 30,
                armorClass: 12,
                attributes: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 }
            }
        ],
        npcs: [{ id: 1, name: 'Haendler (E-4)', role: 'Merchant', race: 'Mensch' }],
        locations: [{ id: 1, name: 'Testort (E-4)' }],
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
            round: 1,
            ...(extra.initiative || {})
        },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 0,
        quickRefCustom: [],
        _nextId: {
            characters: 3,
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
}

/**
 * Frischer Seitenaufbau, gefuellte Kampagne, Ansicht per `switchView()`
 * gesetzt — OHNE Klick (Messdisziplin 2).
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {Record<string, unknown>} [extra] Abweichungen am Seed
 */
async function ansichtOeffnen(page, ansicht, extra = {}) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, kampfSeed(extra));
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(500);
}

/**
 * Der Zustand des Lebenspunkte-Rechners, so wie ihn der Nutzer sieht:
 * offen oder zu, auf wen gerichtet, welche Ueberschrift, wo der Fokus liegt.
 * @param {import('@playwright/test').Page} page
 */
function rechnerZustand(page) {
    return page.evaluate(() => {
        const m = document.getElementById('hp-calc-modal');
        const offen = !!m && m.classList.contains('show');
        const aktiv = document.activeElement;
        return {
            offen,
            typ:
                /** @type {HTMLInputElement|null} */ (document.getElementById('hp-calc-type'))
                    ?.value ?? null,
            id:
                /** @type {HTMLInputElement|null} */ (document.getElementById('hp-calc-id'))
                    ?.value ?? null,
            titel: document.getElementById('hp-calc-title')?.textContent ?? null,
            stand: document.getElementById('hp-calc-current')?.textContent ?? null,
            fokusId: aktiv && aktiv !== document.body ? aktiv.id || '' : 'BODY',
            fokusTag: aktiv ? aktiv.tagName : 'NULL',
            offeneSchalen: Array.from(
                document.querySelectorAll('.modal-overlay.show, .modal-backdrop.show')
            )
                .map(s => s.id || '(ohne id)')
                .join(',')
        };
    });
}

/**
 * @param {import('@playwright/test').Page} page
 */
function kampfZustand(page) {
    return page.evaluate(() => ({
        zug: window.D.initiative.currentTurn,
        runde: window.D.initiative.round,
        amZug: window.D.initiative.combatants[window.D.initiative.currentTurn]?.name ?? null,
        hp: window.D.initiative.combatants.map(c => `${c.name}:${c.currentHp}`).join(' '),
        ansicht: document.querySelector('.view.active')?.id || '?',
        scrollY: Math.round(window.scrollY)
    }));
}

/**
 * Tabuliert mit ECHTEN Tastendruecken, bis das fokussierte Element die
 * verlangten data-Attribute traegt. Gibt die Zahl der Spruenge zurueck, 0
 * wenn das Ziel in MAX_SPRUENGE Spruengen nicht erreichbar war.
 * @param {import('@playwright/test').Page} page
 * @param {{ action: string, id?: string, type?: string }} merkmal
 */
async function tabBisZiel(page, merkmal) {
    for (let i = 1; i <= MAX_SPRUENGE; i++) {
        await page.keyboard.press('Tab');
        const treffer = await page.evaluate(m => {
            const el = document.activeElement;
            if (!el || el === document.body) return false;
            if (el.getAttribute('data-action') !== m.action) return false;
            if (m.id !== undefined && el.getAttribute('data-id') !== m.id) return false;
            if (m.type !== undefined && el.getAttribute('data-type') !== m.type) return false;
            return true;
        }, merkmal);
        if (treffer) return i;
    }
    return 0;
}

test.describe('E-4 · Ein Kuerzel fuer den Lebenspunkte-Rechner', () => {
    test('(a) das Kuerzel oeffnet den Lebenspunkte-Rechner in der Initiative-Ansicht', async ({
        page
    }) => {
        await ansichtOeffnen(page, 'initiative');
        const vor = await rechnerZustand(page);
        expect(vor.offen, 'Vorbedingung: der Rechner ist zu').toBe(false);
        expect(vor.fokusTag, 'Vorbedingung: der Fokus liegt auf BODY').toBe('BODY');

        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(400);

        const nach = await rechnerZustand(page);
        expect(
            nach.offen,
            `Taste "${KUERZEL}" in der Initiative-Ansicht (Fokus BODY) hat den ` +
                `Lebenspunkte-Rechner NICHT geoeffnet. Offene Schalen: "${nach.offeneSchalen}". ` +
                'Das ist die Luecke aus E-4: fuer die Trefferpunkte gibt es als einziges ' +
                'Kampfwerkzeug kein Kuerzel.'
        ).toBe(true);
        expect(nach.offeneSchalen, 'genau diese eine Schale ist offen').toBe('hp-calc-modal');
    });

    test('(b) es trifft den Kaempfer, der am Zug ist — nicht den ersten', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative');
        // Zweimal echt weiterschalten: "Boros" (id 3) ist am Zug.
        await page.keyboard.press('n');
        await page.waitForTimeout(250);
        await page.keyboard.press('n');
        await page.waitForTimeout(350);
        const kampf = await kampfZustand(page);
        expect(kampf.zug, 'Vorbedingung: der dritte Kaempfer ist am Zug').toBe(2);
        expect(kampf.amZug).toBe('Boros');

        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(400);

        const z = await rechnerZustand(page);
        expect(
            z.offen,
            `Taste "${KUERZEL}" hat den Rechner nicht geoeffnet (Kaempfer am Zug: ${kampf.amZug})`
        ).toBe(true);
        expect(z.typ, 'der Rechner arbeitet auf einem Kampf-Eintrag').toBe('combatant');
        expect(z.id, `der Rechner zeigt auf "${kampf.amZug}" (Kennung 3)`).toBe('3');
        expect(z.titel, 'die Ueberschrift nennt den Kaempfer am Zug').toContain('Boros');
        expect(z.stand, 'der Stand ist der des Kaempfers am Zug').toBe('34 / 34');
    });

    test('(c) Schaden auf den Kaempfer am Zug kostet vier Tastendruecke', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press('n');
        await page.waitForTimeout(250);
        await page.keyboard.press('n');
        await page.waitForTimeout(350);
        const vor = await kampfZustand(page);
        expect(vor.amZug).toBe('Boros');

        // Vier echte Anschlaege: Kuerzel, Zahl, Tabulator, Enter.
        let anschlaege = 0;
        await page.keyboard.press(KUERZEL);
        anschlaege++;
        await page.waitForTimeout(400);
        const imDialog = await rechnerZustand(page);
        expect(
            imDialog.offen,
            `Taste "${KUERZEL}" hat den Rechner nicht geoeffnet — der Weg endet hier`
        ).toBe(true);
        expect(
            imDialog.fokusId,
            'der Fokus muss im Wertfeld liegen, sonst kostet die Zahl weitere Anschlaege'
        ).toBe('hp-calc-value');

        await page.keyboard.type('7');
        anschlaege++;
        await page.keyboard.press('Tab');
        anschlaege++;
        const aufKnopf = await page.evaluate(
            () => document.activeElement?.getAttribute('data-value') || ''
        );
        expect(aufKnopf, 'ein Tabulatorsprung liegt auf "💔 Schaden"').toBe('damage');
        await page.keyboard.press('Enter');
        anschlaege++;
        await page.waitForTimeout(500);

        const nach = await kampfZustand(page);
        expect(
            nach.hp,
            `Nach ${anschlaege} echten Anschlaegen muessen Boros' Trefferpunkte von 34 auf 27 ` +
                `stehen. Gemessen: ${nach.hp}`
        ).toContain('Boros:27');
        expect(anschlaege, 'der ganze Weg kostet vier Anschlaege (ohne die Zahl drei)').toBe(4);
        expect(nach.scrollY, 'die Seite rollt dabei nicht weg').toBe(0);
    });

    test('(d) ausserhalb der Initiative-Ansicht tut die Taste nichts', async ({ page }) => {
        for (const ansicht of ['dashboard', 'party', 'dice']) {
            await ansichtOeffnen(page, ansicht);
            const vor = await kampfZustand(page);
            await page.keyboard.press(KUERZEL);
            await page.waitForTimeout(350);
            const z = await rechnerZustand(page);
            const nach = await kampfZustand(page);
            expect(
                z.offen,
                `In der Ansicht "${ansicht}" darf "${KUERZEL}" den Rechner NICHT oeffnen ` +
                    '(E-4: nur im Kampf)'
            ).toBe(false);
            expect(z.offeneSchalen, `in "${ansicht}" bleibt jede Schale zu`).toBe('');
            expect(nach.ansicht, `"${KUERZEL}" wechselt keine Ansicht`).toBe(vor.ansicht);
        }
    });

    test('(e) in einem Eingabefeld tippt die Taste ihren Buchstaben', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative');
        // Strg+K ist das dokumentierte Kuerzel fuer die globale Suche — ein
        // echter Tastendruck, kein `.focus()`.
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(300);
        const fokus = await page.evaluate(() => document.activeElement?.id || '');
        expect(fokus, 'Vorbedingung: der Fokus liegt im Suchfeld').toBe('global-search');

        await page.keyboard.type(KUERZEL);
        await page.waitForTimeout(350);

        const wert = await page.evaluate(
            () =>
                /** @type {HTMLInputElement|null} */ (document.getElementById('global-search'))
                    ?.value ?? ''
        );
        const z = await rechnerZustand(page);
        expect(wert, `"${KUERZEL}" muss im Suchfeld als Zeichen landen`).toBe(KUERZEL);
        expect(
            z.offen,
            `"${KUERZEL}" darf im Eingabefeld den Rechner NICHT oeffnen — dieselbe Schranke, ` +
                'die T-A fuer die Leertaste wiederhergestellt hat'
        ).toBe(false);
    });

    test('(f) ohne Kaempfer am Zug tut die Taste nichts', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative', {
            initiative: { combatants: [], currentTurn: 0, round: 1 }
        });
        const vor = await page.evaluate(() => window.D.initiative.combatants.length);
        expect(vor, 'Vorbedingung: die Initiative ist leer').toBe(0);

        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(350);

        const z = await rechnerZustand(page);
        expect(
            z.offen,
            `Ohne Kaempfer am Zug darf "${KUERZEL}" nichts oeffnen (E-4: nur wenn einer am Zug ist)`
        ).toBe(false);
        expect(z.offeneSchalen).toBe('');
    });

    test('(g) auf einem Lair-Eintrag am Zug tut die Taste nichts', async ({ page }) => {
        // Ein Lair-Eintrag hat keine Trefferpunkte und bietet auch der Maus
        // keinen ➗-Knopf an (features/initiative.js, Sonderzweig fuer
        // `type: 'lair'`). Das Kuerzel darf dort keinen Rechner auf "0 / 0"
        // oeffnen.
        await ansichtOeffnen(page, 'initiative', {
            initiative: {
                combatants: [
                    { id: 9, name: 'Hoehlenaktion (E-4)', initiative: 20, type: 'lair' },
                    {
                        id: 1,
                        name: 'Alrik',
                        initiative: 18,
                        initBonus: 2,
                        maxHp: 40,
                        currentHp: 40,
                        ac: 16,
                        type: 'player',
                        effects: []
                    }
                ],
                currentTurn: 0,
                round: 1
            }
        });
        const amZug = await page.evaluate(
            () => window.D.initiative.combatants[window.D.initiative.currentTurn]?.type
        );
        expect(amZug, 'Vorbedingung: der Lair-Eintrag ist am Zug').toBe('lair');

        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(350);

        const z = await rechnerZustand(page);
        expect(
            z.offen,
            `Auf einem Lair-Eintrag darf "${KUERZEL}" keinen Rechner oeffnen — die Zeile hat ` +
                'keine Trefferpunkte, und der Maus bietet sie auch keinen ➗-Knopf an'
        ).toBe(false);
    });

    test('(h) ueber einem offenen Dialog stapelt die Taste keinen zweiten', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(400);
        const erst = await rechnerZustand(page);
        expect(erst.offen, `Vorbedingung: "${KUERZEL}" hat den Rechner geoeffnet`).toBe(true);

        // Raus aus dem Wertfeld, damit die `isTyping`-Schranke NICHT die
        // Arbeit macht — ein Tabulatorsprung bleibt dank der Fokusfalle aus
        // T-D im Dialog.
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        const aufKnopf = await page.evaluate(() => document.activeElement?.tagName || '');
        expect(aufKnopf, 'der Fokus liegt auf einem Knopf im Dialog, nicht in einem Feld').toBe(
            'BUTTON'
        );

        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(400);

        const zweit = await rechnerZustand(page);
        expect(
            zweit.offeneSchalen,
            `"${KUERZEL}" darf ueber einem offenen Dialog keinen zweiten aufmachen. ` +
                `Offene Schalen: "${zweit.offeneSchalen}"`
        ).toBe('hp-calc-modal');
        expect(zweit.id, 'und den offenen Dialog nicht umhaengen').toBe(erst.id);
    });

    test('(i) die Tastenhilfe fuehrt das Kuerzel mit', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press('Shift+/');
        await page.waitForTimeout(400);
        const offen = await page.evaluate(
            () => !!document.querySelector('#shortcuts-overlay.show')
        );
        expect(offen, 'Vorbedingung: "?" oeffnet die Tastenhilfe').toBe(true);

        const zeile = await page.evaluate(k => {
            const reihen = Array.from(
                document.querySelectorAll('#shortcuts-overlay .shortcut-row')
            );
            const treffer = reihen.filter(r => {
                const tasten = Array.from(r.querySelectorAll('.shortcut-key')).map(t =>
                    (t.textContent || '').trim().toUpperCase()
                );
                return tasten.length === 1 && tasten[0] === k.toUpperCase();
            });
            return {
                anzahl: treffer.length,
                text: treffer.map(r => (r.textContent || '').replace(/\s+/g, ' ').trim()),
                alleTasten: reihen
                    .map(r =>
                        Array.from(r.querySelectorAll('.shortcut-key'))
                            .map(t => (t.textContent || '').trim())
                            .join('+')
                    )
                    .join(' ')
            };
        }, KUERZEL);

        expect(
            zeile.anzahl,
            `Die Tastenhilfe (?) muss GENAU EINE Zeile fuer "${KUERZEL.toUpperCase()}" fuehren. ` +
                `Gefuehrt werden heute: ${zeile.alleTasten}`
        ).toBe(1);
        expect(zeile.text[0], 'die Zeile nennt die Sache, nicht nur die Taste').toMatch(
            /HP|Lebenspunkte|Trefferpunkte/i
        );
    });

    test('(j) nach Escape gehoert die Leertaste wieder dem Zug', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative');
        const vor = await kampfZustand(page);
        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(400);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);

        const z = await rechnerZustand(page);
        expect(z.offen, 'Escape schliesst den Rechner').toBe(false);
        expect(
            z.fokusTag,
            'Ein per Kuerzel geoeffneter Dialog laesst den Fokus FREI zurueck — sonst ' +
                'beansprucht der Oeffner danach die Leertaste und der Zugwechsel ist weg (T-A)'
        ).toBe('BODY');

        await page.keyboard.press(' ');
        await page.waitForTimeout(400);
        const nach = await kampfZustand(page);
        expect(
            nach.zug,
            `Die Leertaste muss nach dem Schliessen weiter den Zug wechseln. Vorher Zug ` +
                `${vor.zug}, nachher ${nach.zug}`
        ).toBe(vor.zug + 1);
    });

    test('(k) die Kosten fallen von rund 64 Anschlaegen auf vier', async ({ page }) => {
        // Weg OHNE Kuerzel: mit echten Tabulatorspruengen zum ➗-Knopf des
        // vierten Kaempfers, so wie die Vermessung es gemessen hat.
        await ansichtOeffnen(page, 'initiative');
        const ohne = await tabBisZiel(page, {
            action: 'show-hp-calculator',
            type: 'combatant',
            id: '4'
        });
        expect(
            ohne,
            `Der ➗-Knopf des vierten Kaempfers war in ${MAX_SPRUENGE} echten ` +
                'Tabulatorspruengen nicht erreichbar'
        ).toBeGreaterThan(0);
        // Enter + Zahl + Tab + Enter kommen dazu.
        const kostenOhne = ohne + 4;

        // Weg MIT Kuerzel: viermal druecken, auf den Kaempfer am Zug.
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(400);
        const z = await rechnerZustand(page);
        expect(
            z.offen,
            `Taste "${KUERZEL}" hat den Rechner nicht geoeffnet — der Vergleich hat keinen ` +
                'zweiten Weg'
        ).toBe(true);
        const kostenMit = 4;

        expect(
            kostenOhne,
            `Der gemessene Tabulatorweg (${ohne} Spruenge) muss in der Groessenordnung der ` +
                `Vermessung liegen (${VERMESSUNG_SPRUENGE_VIERTER} Spruenge beim vierten Kaempfer)`
        ).toBeGreaterThan(30);
        expect(
            kostenMit * 8,
            `Das Kuerzel muss die Kosten um mehr als das Achtfache senken: ohne ` +
                `${kostenOhne} Anschlaege, mit ${kostenMit}`
        ).toBeLessThan(kostenOhne);
    });

    test('(l) Kuerzel und ➗-Knopf der aktiven Zeile stellen dasselbe her', async ({ page }) => {
        // Weg 1: der ➗-Knopf der AKTIVEN Zeile, mit echten Tabulatorspruengen
        // angefahren und mit Enter ausgeloest.
        await ansichtOeffnen(page, 'initiative');
        const spruenge = await tabBisZiel(page, {
            action: 'show-hp-calculator',
            type: 'combatant',
            id: '1'
        });
        expect(spruenge, 'der ➗-Knopf der ersten Zeile war nicht erreichbar').toBeGreaterThan(0);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(450);
        const perKnopf = await rechnerZustand(page);
        expect(perKnopf.offen, 'Vorbedingung: der Knopf oeffnet den Rechner').toBe(true);

        // Weg 2: das Kuerzel, frische Seite, derselbe Kaempfer am Zug.
        await ansichtOeffnen(page, 'initiative');
        await page.keyboard.press(KUERZEL);
        await page.waitForTimeout(450);
        const perKuerzel = await rechnerZustand(page);

        expect(
            {
                offen: perKuerzel.offen,
                typ: perKuerzel.typ,
                id: perKuerzel.id,
                titel: perKuerzel.titel,
                stand: perKuerzel.stand,
                fokusId: perKuerzel.fokusId
            },
            'Das Kuerzel muss GENAU dasselbe herstellen wie ein Klick auf den ➗-Knopf der ' +
                'aktiven Zeile — gleicher Typ, gleiche Kennung, gleiche Ueberschrift, ' +
                'gleicher Stand, gleicher Fokus'
        ).toEqual({
            offen: perKnopf.offen,
            typ: perKnopf.typ,
            id: perKnopf.id,
            titel: perKnopf.titel,
            stand: perKnopf.stand,
            fokusId: perKnopf.fokusId
        });
    });
});
