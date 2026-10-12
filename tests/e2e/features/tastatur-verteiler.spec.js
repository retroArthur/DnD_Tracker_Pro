// @ts-check
/**
 * Der keydown-Zweig im Ereignis-Verteiler (Tastatur-Strang, T-B / Schritt 3)
 * =========================================================================
 *
 * WORUEBER DIESE DATEI URTEILT. `ui/event-delegation.js` kennt heute drei
 * Zweige — `click` (Capture-Phase), `change`, `input`. Einen `keydown`-Zweig
 * gibt es nicht. Solange jedes bediente Element ein echter `<button>` ist,
 * fehlt er niemandem: der Browser erzeugt aus Enter und Leertaste selbst ein
 * `click`, und der Klick-Zweig faengt es. Fuer die 219 Quellstellen, die
 * `div`, `span` oder `label` sind, gilt das NICHT. Ein `div` mit
 * `tabindex="0"` ist fokussierbar und sieht wie ein Knopf aus — aber Enter
 * und Leertaste erzeugen darauf kein `click`, und die Leertaste rollt
 * stattdessen die Seite weg. Gemessen am gebauten Buendel, gefuellte
 * Kampagne, echte Tabulatorspruenge: `scrollY` springt von 0 auf 143 (sechs
 * Eintraege je Typ) bzw. auf 564 (zwanzig). Der Knopf tut nichts, das
 * Dokument laeuft weg.
 *
 * Darum EIN `keydown`-Zweig in derselben Datei, Capture-Phase, mit
 * `preventDefault()` UND `stopPropagation()` (Orchestrator-Entscheidung
 * O-2). Er loest sein Ziel ueber dasselbe `closest('[data-action]')` auf wie
 * der Klick-Zweig und schickt einen synthetischen Klick auf das fokussierte
 * Element — der Klick-Zweig erledigt danach alles Weitere, einschliesslich
 * der Formular-Ausnahmen, `data-stop-propagation` und der
 * Fehlerabschirmung. Kein zweiter Regelsatz, der mit dem ersten
 * synchron gehalten werden muesste.
 *
 * WARUM DER NACHWEIS AN EINEM NACHGERUESTETEN ELEMENT HAENGT. Schritt 3
 * baut den Mechanismus, Schritt 4 gibt den 219 Stellen erst den Fokus.
 * Diese Datei kann also nicht auf eine Stelle warten, die es noch nicht
 * gibt — sie setzt `tabindex="0"` (und, bei Nicht-`label`, `role="button"`,
 * O-1) per DOM-Eingriff auf GENAU EIN Element und tabuliert dann mit echten
 * Tastendruecken dorthin. Dieser Eingriff ist der Platzhalter fuer die
 * Kehrschleife aus Schritt 4 und steht ausdruecklich so da; wenn die
 * Kehrschleife kommt, faellt er weg und die Faelle bleiben gueltig.
 *
 * DIE DOPPELFEUER-PROBE IST DER KERN. Auf einem ECHTEN `<button>` ist der
 * neue Zweig gefaehrlich: der Browser wuerde aus derselben Taste ohnehin ein
 * `click` machen, also feuert ohne `preventDefault()` BEIDES — gemessen 2
 * Klicks (einer `isTrusted`, einer synthetisch) und ein Seitenlauf von 0 auf
 * 424. Deshalb zaehlt jeder Fall unten die `click`-EREIGNISSE am Ziel,
 * getrennt nach `echt` (isTrusted) und `synthetisch`, und nicht die Wirkung:
 * ein `nextTurn()`, das zweimal laeuft, ist an der Rundenzahl allein nicht
 * von einem einmaligen zu unterscheiden, wenn man nur den Zug liest.
 *
 * WAS DER ZWEIG NICHT ANFASSEN DARF — und warum das die riskanteste Haelfte
 * ist. Im Dokument sitzen Tippflaechen MIT einer Aktion oder IN einem
 * Element mit Aktion (am gebauten Buendel gezaehlt): ein
 * `div[contenteditable]` mit `data-action="wiki-content-input"` (der
 * Wiki-Editor), ein `textarea#quick-notes` INNERHALB eines
 * `div[data-action="backdrop-close"]` (die Schnellnotizen), 38
 * `input[type=checkbox]` in `label[data-action="toggle-selected"]`, dazu 15
 * Suchfelder und ~45 Auswahllisten mit eigener Aktion. Ein Zweig, der die
 * Leertaste dort abfaengt, macht den Wiki-Editor unbenutzbar und schliesst
 * die Schnellnotizen beim Tippen. Die Faelle (i) bis (n) sind vor UND nach
 * der Aenderung gruen und sind genau dafuer da.
 *
 * MESSDISZIPLIN — dieselben drei Regeln wie in
 * `tests/e2e/features/tastatur-ausloesung.spec.js`, jede aus einer
 * verdorbenen Messung gelernt:
 *
 *  1. NUR ECHTE TASTENDRUECKE. Fokus ausschliesslich per
 *     `page.keyboard.press('Tab')`, niemals `.focus()`; das Ziel wird
 *     niemals mit `element.click()` bedient.
 *
 *  2. KEIN `blur()` ALS STARTPUNKT, sondern ein frischer Seitenaufbau plus
 *     `window.switchView()` ohne Klick. Chromiums Startpunkt der
 *     Tabulatornavigation ueberlebt ein `blur()`. Formularschalen werden
 *     darum per DOM-Eingriff geoeffnet (Klasse `open`, `style.display`) und
 *     nicht per Klick.
 *
 *  3. DAS ZIEL WIRD UEBER OBJEKTIDENTITAET AUFGELOEST. `window.__ziel` haelt
 *     den Knoten, der Zaehler vergleicht mit `===`. Eine Signatur- oder
 *     Textsuche trifft nach einer Nachruestung ein anderes Element als
 *     vorher.
 *
 * WARUM DER KLICKZAEHLER AM DOKUMENT HAENGT: `_handleClick` ruft fuer jede
 * registrierte Aktion `e.stopPropagation()`, bevor es den Handler aufruft.
 * Ein Lauscher AM ZIEL wird dadurch nie erreicht und meldet konstant 0. Der
 * Zaehler sitzt deshalb am Dokument in der Capture-Phase und filtert ueber
 * Objektidentitaet.
 *
 * GEMESSENE AUSGANGSLAGE (HEAD 204651e, gefuellte Kampagne, 1440 px, echte
 * Tabulatorspruenge, je Ziel ein frischer Seitenaufbau, bei SECHS und bei
 * ZWANZIG Eintraegen je Typ — beide Groessen, weil die Tabulatorreihe mit
 * den Daten waechst):
 *
 *   nachgeruestetes div.dash-char       Leertaste  0 Klicks, Ansicht bleibt,
 *                                                  scrollY 0 -> 143 / 564
 *   nachgeruestetes div.collapsible-...  Leertaste  0 Klicks, Formular bleibt zu,
 *                                                  scrollY 0 -> 123 / 787
 *   nachgeruestetes div.char-card-hp     Enter      0 Klicks, kein Rechner
 *   nachgeruestetes label.char-resist... Leertaste  0 Klicks, .selected bleibt false
 *   echter button[roll-dice]             Leertaste  1 Klick, davon echt 1
 *   echter button[call=nextTurn]         Leertaste  1 Klick, Zug +1
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/**
 * Obergrenze der Tabulatorsuche. Die laengste hier gemessene Strecke ist 85
 * Halte (Schnellnotizen-Textfeld); 400 laesst Luft fuer eine gefuellte
 * Kampagne, ohne einen echten Fehlschlag in eine Endlosschleife zu drehen.
 */
const MAX_SPRUENGE = 400;

/**
 * Zwei Kampagnengroessen. Die Zahl der Tabulatorhalte waechst mit den Daten
 * (gemessen: 84 unerreichbare Stellen bei fast leerer Kampagne, 462 bei
 * zwanzig Eintraegen je Typ), und der Seitenlauf der Leertaste ebenso (143
 * gegen 564 Pixel). Ein Fall, der nur bei sechs Eintraegen geprueft ist,
 * sagt nichts ueber den Spieltisch.
 */
const GROESSEN = [6, 20];

/**
 * Gefuellte Kampagne mit `n` Eintraegen je Typ. Die Kaempfer tragen ANDERE
 * Namen als die Charaktere, damit `addPartyToInit()` nichts ueberspringt
 * (dieselbe Falle wie in `tastatur-ausloesung.spec.js`).
 * @param {number} n
 */
function kampagne(n) {
    const liste = (praefix, extra = {}) =>
        Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `${praefix} ${i + 1}`, ...extra }));
    return {
        _version: '99.0.0',
        settings: { theme: 'dark', lastView: 'dashboard', markdownOnboardingSeen: true },
        randomTables: [],
        timers: [],
        campaign: {},
        shops: liste('Laden'),
        factions: liste('Fraktion'),
        characters: Array.from({ length: n }, (_, i) => ({
            id: i + 1,
            name: `Charakter ${i + 1} (T-B)`,
            characterClass: 'Kaempfer',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 }
        })),
        npcs: liste('NSC', { role: 'Merchant', race: 'Mensch' }),
        locations: liste('Ort'),
        quests: liste('Auftrag', { title: 'Auftrag', status: 'active' }),
        loot: liste('Beute', { qty: 1 }),
        spells: [],
        wiki: liste('Wiki', { title: 'Wiki', category: 'Allgemein' }),
        sessionNotes: [],
        encounters: liste('Begegnung', { monsters: [] }),
        initiative: {
            combatants: Array.from({ length: n }, (_, i) => ({
                id: i + 1,
                name: (i % 2 ? 'Held ' : 'Ork ') + (i + 1),
                initiative: 30 - i,
                initBonus: 2,
                maxHp: 30,
                currentHp: 30,
                ac: 14,
                type: i % 2 ? 'player' : 'monster',
                effects: []
            })),
            currentTurn: 0,
            round: 1
        },
        mindmap: { nodes: [], connections: [] },
        calendar: {},
        partyGold: 100,
        quickRefCustom: [],
        _nextId: {
            characters: n + 1,
            npcs: n + 1,
            locations: n + 1,
            quests: n + 1,
            encounters: n + 1,
            spells: 1,
            loot: n + 1,
            items: 1,
            wiki: n + 1,
            sessionNotes: 1,
            randomTables: 1
        }
    };
}

/**
 * Frischer Seitenaufbau, gefuellte Kampagne, Ansicht per `switchView()` —
 * OHNE Klick (Messdisziplin 2).
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {number} n Eintraege je Typ
 */
async function ansichtOeffnen(page, ansicht, n) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, kampagne(n));
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(500);
}

/**
 * PLATZHALTER FUER SCHRITT 4. Setzt `tabindex="0"` und — bei Nicht-`label`,
 * siehe O-1 und die Begruendung zu `label` in (e) — `role="button"` auf
 * GENAU EIN Element und legt es unter `window.__nachgeruestet` ab. Das ist
 * ein DOM-Eingriff, kein Fokus-Eingriff: er verschiebt Chromiums Startpunkt
 * der Tabulatornavigation nicht, der Weg zum Ziel bleibt ein echter.
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor
 */
async function nachruesten(page, selektor) {
    const gefunden = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        el.setAttribute('tabindex', '0');
        if (el.tagName !== 'LABEL') el.setAttribute('role', 'button');
        window.__nachgeruestet = el;
        return true;
    }, selektor);
    expect(gefunden, `Nachruest-Ziel "${selektor}" existiert nicht`).toBe(true);
}

/**
 * Tabuliert mit ECHTEN Tastendruecken, bis das fokussierte Element passt.
 * Mit `nachgeruestet: true` wird ueber Objektidentitaet verglichen.
 * @param {import('@playwright/test').Page} page
 * @param {{ nachgeruestet?: boolean, action?: string, value?: string, tag?: string, id?: string }} merkmal
 * @returns {Promise<number>} Zahl der Spruenge, 0 wenn nicht erreicht
 */
async function tabBisZiel(page, merkmal) {
    for (let i = 1; i <= MAX_SPRUENGE; i++) {
        await page.keyboard.press('Tab');
        const treffer = await page.evaluate(m => {
            const el = document.activeElement;
            if (!el || el === document.body) return false;
            if (m.nachgeruestet) return el === window.__nachgeruestet;
            if (m.action && el.getAttribute('data-action') !== m.action) return false;
            if (m.value !== undefined && el.getAttribute('data-value') !== m.value) return false;
            if (m.tag && el.tagName !== m.tag) return false;
            if (m.id && el.id !== m.id) return false;
            return true;
        }, merkmal);
        if (treffer) return i;
    }
    return 0;
}

/**
 * Merkt das fokussierte Element unter `window.__ziel` und zaehlt ab jetzt
 * die `click`-Ereignisse, deren `target` GENAU dieses Objekt ist. Zaehler am
 * Dokument in der Capture-Phase — Begruendung im Kopfkommentar.
 * @param {import('@playwright/test').Page} page
 */
async function zielMerken(page) {
    await page.evaluate(() => {
        window.__ziel = document.activeElement;
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
 * @returns {Promise<{ echt: number, synthetisch: number, gesamt: number }>}
 */
async function klicks(page) {
    const k = await page.evaluate(() => window.__klicks);
    return { ...k, gesamt: k.echt + k.synthetisch };
}

/**
 * @param {import('@playwright/test').Page} page
 */
function zustand(page) {
    return page.evaluate(() => ({
        zug: window.D.initiative.currentTurn,
        runde: window.D.initiative.round,
        ansicht: document.querySelector('.view.active')?.id || '?',
        scrollY: Math.round(window.scrollY),
        wuerfe: (window.diceHistory || []).length,
        charFormOffen: !!document.querySelector('#char-form.open'),
        hpRechnerOffen: !!document.querySelector('#hp-calc-modal.show'),
        detailsOffen: document.querySelectorAll('details[open]').length
    }));
}

/**
 * Ansicht oeffnen, nachruesten (optional), per echter Tastatur zum Ziel,
 * Zaehler setzen, Ausgangszustand lesen.
 * @param {import('@playwright/test').Page} page
 * @param {{ ansicht: string, n: number, selektor?: string, merkmal?: object, vorbereiten?: string }} fall
 */
async function zielAnfahren(page, fall) {
    await ansichtOeffnen(page, fall.ansicht, fall.n);
    if (fall.vorbereiten) await page.evaluate(fall.vorbereiten);
    await page.waitForTimeout(fall.vorbereiten ? 400 : 0);
    if (fall.selektor) await nachruesten(page, fall.selektor);
    const merkmal = fall.selektor ? { nachgeruestet: true } : fall.merkmal;
    const spruenge = await tabBisZiel(page, merkmal);
    expect(
        spruenge,
        `Ziel ${JSON.stringify(fall.selektor || merkmal)} war in ${MAX_SPRUENGE} echten ` +
            `Tabulatorspruengen nicht erreichbar (${fall.n} Eintraege je Typ)`
    ).toBeGreaterThan(0);
    await zielMerken(page);
    return { spruenge, vorher: await zustand(page) };
}

for (const n of GROESSEN) {
    test.describe(`Enter und Leertaste laufen ueber den Verteiler (${n} Eintraege je Typ)`, () => {
        for (const taste of [' ', 'Enter']) {
            const tastenName = taste === ' ' ? 'Leertaste' : 'Enter';

            test(`(a) ${tastenName} auf einem nachgeruesteten div.dash-char wechselt die Ansicht`, async ({
                page
            }) => {
                const { spruenge, vorher } = await zielAnfahren(page, {
                    ansicht: 'dashboard',
                    n,
                    selektor: '#view-dashboard .dash-char'
                });
                expect(vorher.ansicht).toBe('view-dashboard');
                expect(vorher.scrollY).toBe(0);

                await page.keyboard.press(taste);
                await page.waitForTimeout(600);

                const k = await klicks(page);
                const nachher = await zustand(page);

                // GENAU EIN Klick — und zwar der synthetische des Zweigs.
                expect(k.gesamt, `Klicks am Ziel (Halt ${spruenge})`).toBe(1);
                expect(k.echt, 'ein div loest nativ nicht aus').toBe(0);
                expect(k.synthetisch, 'der keydown-Zweig muss genau einmal ausloesen').toBe(1);
                expect(nachher.ansicht, 'data-value="party" muss zur Party fuehren').toBe(
                    'view-party'
                );
                // Ohne preventDefault() rollt die Leertaste das Dokument weg
                // (gemessen 0 -> 143 bei sechs, 0 -> 564 bei zwanzig Eintraegen).
                expect(nachher.scrollY, 'die Taste darf die Seite nicht wegrollen').toBe(0);
            });

            test(`(b) ${tastenName} auf einem nachgeruesteten div.collapsible-header oeffnet das Formular`, async ({
                page
            }) => {
                const { spruenge, vorher } = await zielAnfahren(page, {
                    ansicht: 'party',
                    n,
                    selektor: '#view-party [data-action="toggle-collapse"][data-value="char-form"]'
                });
                expect(vorher.charFormOffen).toBe(false);
                expect(vorher.scrollY).toBe(0);

                await page.keyboard.press(taste);
                await page.waitForTimeout(600);

                const k = await klicks(page);
                const nachher = await zustand(page);

                expect(k.gesamt, `Klicks am Ziel (Halt ${spruenge})`).toBe(1);
                expect(k.echt).toBe(0);
                expect(k.synthetisch).toBe(1);
                expect(nachher.charFormOffen, 'toggleCollapse() muss das Formular oeffnen').toBe(
                    true
                );
                expect(nachher.scrollY).toBe(0);
            });

            test(`(c) ${tastenName} auf einem echten <button> loest GENAU EINMAL aus`, async ({
                page
            }) => {
                // Die Doppelfeuer-Probe am gefaehrlichsten Ort: der Browser
                // wuerde aus dieser Taste selbst ein `click` machen. Ohne
                // `preventDefault()` im Zweig sind es zwei.
                const { spruenge, vorher } = await zielAnfahren(page, {
                    ansicht: 'dice',
                    n,
                    merkmal: { action: 'roll-dice', value: '4' }
                });
                expect(vorher.wuerfe).toBe(0);

                await page.keyboard.press(taste);
                await page.waitForTimeout(600);

                const k = await klicks(page);
                const nachher = await zustand(page);

                expect(k.gesamt, `Klicks am Ziel (Halt ${spruenge}) — 2 waere Doppelfeuer`).toBe(1);
                // Der native Klick ist unterdrueckt, der Zweig uebernimmt.
                expect(k.echt, 'der native Klick ist unterdrueckt').toBe(0);
                expect(k.synthetisch, 'der Zweig loest genau einmal aus').toBe(1);
                expect(nachher.wuerfe, 'genau ein Wurf, nicht zwei').toBe(1);
                expect(nachher.scrollY).toBe(0);
            });
        }

        test('(d) Verschachtelung: Enter auf dem nachgeruesteten HP-Feld oeffnet NUR den Rechner', async ({
            page
        }) => {
            // `div.char-card-hp[data-action="show-hp-calculator-stop"]` liegt
            // IN `div.char-card-header[data-action="edit-char"]`.
            // `closest('[data-action]')` nimmt den innersten Treffer — das
            // Charakterformular darf zu bleiben.
            const { spruenge, vorher } = await zielAnfahren(page, {
                ansicht: 'party',
                n,
                selektor: '#view-party .char-card-hp'
            });
            expect(vorher.hpRechnerOffen).toBe(false);
            expect(vorher.charFormOffen).toBe(false);

            await page.keyboard.press('Enter');
            await page.waitForTimeout(700);

            const k = await klicks(page);
            const nachher = await zustand(page);

            expect(k.gesamt, `Klicks am Ziel (Halt ${spruenge})`).toBe(1);
            expect(k.synthetisch).toBe(1);
            expect(nachher.hpRechnerOffen, 'der Lebenspunkte-Rechner muss offen sein').toBe(true);
            expect(nachher.charFormOffen, 'das Charakterformular darf NICHT mitaufgehen').toBe(
                false
            );
        });

        test('(e) Leertaste auf einer nachgeruesteten Marke schaltet .selected, ohne das Kaestchen', async ({
            page
        }) => {
            // O-6: die 38 `label.char-resistance-chip` tragen die Aktion auf
            // der MARKE, und `encounters-crud.js` liest
            // `.char-resistance-chip.selected input` — also den
            // Klassenzustand, nicht `checked`. Darum bekommt ein `label`
            // KEIN `role="button"` (das wuerde den Marken-Charakter
            // ueberschreiben), und das versteckte Kaestchen bleibt wie beim
            // Mausklick unberuehrt.
            //
            // KURZFORM DES MODULNAMENS, mit Absicht — dieselbe Begruendung
            // wie im Kopf von `tastatur-ausloesung.spec.js`. Das
            // Abdeckungs-Gate in `tests/unit/module-test-coverage.test.js`
            // sucht einen Modulpfad als Teilzeichenkette in allen
            // Testdateien und zaehlt JEDEN Treffer als Abdeckung, auch einen
            // im Erklaertext. Der Encounter-CRUD steht dort auf der
            // datierten Ausnahmeliste; dieser Fall prueft ihn NICHT, er
            // nennt nur, wer den Klassenzustand liest. Mit vollem Pfad
            // haette das Gate verlangt, ihn von der Liste zu streichen — und
            // damit eine Abdeckung behauptet, die es nicht gibt.
            await ansichtOeffnen(page, 'encounter', n);
            await page.evaluate(() => document.getElementById('enc-form')?.classList.add('open'));
            await page.waitForTimeout(400);
            await nachruesten(page, 'label.char-resistance-chip');
            const spruenge = await tabBisZiel(page, { nachgeruestet: true });
            expect(spruenge, 'die nachgeruestete Marke muss ertabulierbar sein').toBeGreaterThan(0);
            await zielMerken(page);

            const marke = () =>
                page.evaluate(() => ({
                    rolle: window.__ziel.getAttribute('role'),
                    selected: window.__ziel.classList.contains('selected'),
                    checked: !!window.__ziel.querySelector('input')?.checked
                }));
            const vorher = await marke();
            expect(vorher.rolle, 'eine Marke bekommt KEIN role="button"').toBe(null);
            expect(vorher.selected).toBe(false);
            expect(vorher.checked).toBe(false);

            await page.keyboard.press(' ');
            await page.waitForTimeout(500);

            const k = await klicks(page);
            const nachher = await marke();

            expect(k.gesamt, `Klicks am Ziel (Halt ${spruenge})`).toBe(1);
            expect(k.synthetisch).toBe(1);
            expect(nachher.selected, 'die Marke muss .selected bekommen').toBe(true);
            expect(nachher.checked, 'das versteckte Kaestchen bleibt wie beim Mausklick aus').toBe(
                false
            );
        });
    });
}

test.describe('Die Doppelfeuer-Probe am Zug — gezaehlt wird das Ereignis', () => {
    // Diese zwei Faelle sind VOR und NACH der Aenderung gruen, und das ist
    // ihr Zweck: sie sichern zu, dass sich an der Zahl der Ausloesungen
    // nichts aendert, ohne eine Aussage darueber zu treffen, OB der native
    // oder der synthetische Weg sie erzeugt. Waeren sie auf `echt: 1`
    // festgenagelt, wuerden sie die Umstellung melden statt das Doppelfeuer.
    for (const taste of [' ', 'Enter']) {
        const tastenName = taste === ' ' ? 'Leertaste' : 'Enter';
        test(`(f) ${tastenName} auf "Naechster Zug": 1 Klick, Zug +1`, async ({ page }) => {
            const { spruenge, vorher } = await zielAnfahren(page, {
                ansicht: 'initiative',
                n: 20,
                merkmal: { action: 'call', value: 'nextTurn' }
            });
            expect(vorher.zug).toBe(0);

            await page.keyboard.press(taste);
            await page.waitForTimeout(600);

            const k = await klicks(page);
            const nachher = await zustand(page);

            expect(k.gesamt, `Klicks am Ziel (Halt ${spruenge}) — 2 waere Doppelfeuer`).toBe(1);
            expect(nachher.zug - vorher.zug, 'der Zug darf GENAU um eins steigen').toBe(1);
            expect(nachher.runde, 'und die Runde bleibt').toBe(1);
            expect(nachher.scrollY).toBe(0);
        });
    }
});

test.describe('Was der Zweig nicht anfassen darf (vor und nach der Aenderung gruen)', () => {
    test('(g) die Leertaste tippt weiter in ein Suchfeld', async ({ page }) => {
        await ansichtOeffnen(page, 'initiative', 6);
        const spruenge = await tabBisZiel(page, { tag: 'INPUT', id: 'global-search' });
        expect(spruenge).toBeGreaterThan(0);
        await zielMerken(page);

        await page.keyboard.press('a');
        await page.keyboard.press(' ');
        await page.keyboard.press('b');
        await page.waitForTimeout(400);

        const k = await klicks(page);
        expect(
            await page.evaluate(() => document.getElementById('global-search').value),
            `INPUT[type=text] muss die Leertaste behalten (Halt ${spruenge})`
        ).toBe('a b');
        expect(k.gesamt, 'und darf keinen Klick erzeugen').toBe(0);
    });

    test('(h) die Leertaste bleibt bei einer Auswahlliste mit eigener Aktion', async ({ page }) => {
        // `select#party-class-filter` traegt `data-action` und wird ueber
        // `change` bedient. Die Leertaste oeffnet dort die Liste — das darf
        // der Zweig nicht abfangen.
        await ansichtOeffnen(page, 'party', 6);
        const spruenge = await tabBisZiel(page, { tag: 'SELECT', id: 'party-class-filter' });
        expect(spruenge).toBeGreaterThan(0);
        await zielMerken(page);
        const vorher = await page.evaluate(() => window.__ziel.value);

        await page.keyboard.press(' ');
        await page.waitForTimeout(500);

        const k = await klicks(page);
        expect(k.gesamt, `SELECT darf keinen Klick erzeugen (Halt ${spruenge})`).toBe(0);
        expect(await page.evaluate(() => window.__ziel.value), 'und der Wert bleibt').toBe(vorher);
    });

    test('(i) die Schnellnotizen schliessen beim Tippen nicht', async ({ page }) => {
        // `textarea#quick-notes` liegt IN
        // `div#quicknotes-modal[data-action="backdrop-close"]`. Ein Zweig,
        // der die Leertaste dort abfaengt, wuerde das Modal beim Tippen
        // schliessen.
        await ansichtOeffnen(page, 'initiative', 6);
        await page.evaluate(() => {
            const m = document.getElementById('quicknotes-modal');
            if (m) m.style.display = 'flex';
        });
        await page.waitForTimeout(400);
        const spruenge = await tabBisZiel(page, { tag: 'TEXTAREA', id: 'quick-notes' });
        expect(spruenge).toBeGreaterThan(0);

        await page.keyboard.press('a');
        await page.keyboard.press(' ');
        await page.keyboard.press('b');
        await page.waitForTimeout(400);

        expect(
            await page.evaluate(() => document.getElementById('quick-notes').value),
            `TEXTAREA muss die Leertaste behalten (Halt ${spruenge})`
        ).toBe('a b');
        expect(
            await page.evaluate(
                () =>
                    getComputedStyle(document.getElementById('quicknotes-modal')).display !== 'none'
            ),
            'und das Modal bleibt offen'
        ).toBe(true);
    });

    test('(j) der Wiki-Editor nimmt weiter Leerzeichen an', async ({ page }) => {
        // `div#wiki-content[contenteditable]` traegt SELBST
        // `data-action="wiki-content-input"`. Hier haengt die Schranke nicht
        // am Vorfahren, sondern am Element — `closest()` findet sich selbst.
        await ansichtOeffnen(page, 'wiki', 6);
        await page.evaluate(() => {
            const o = document.getElementById('wiki-form-overlay');
            if (o) o.style.display = 'flex';
        });
        await page.waitForTimeout(400);
        const spruenge = await tabBisZiel(page, { action: 'wiki-content-input' });
        expect(spruenge).toBeGreaterThan(0);

        await page.keyboard.press('a');
        await page.keyboard.press(' ');
        await page.keyboard.press('b');
        await page.waitForTimeout(400);

        expect(
            await page.evaluate(
                () => document.querySelector('[data-action="wiki-content-input"]')?.textContent
            ),
            `contentEditable muss die Leertaste behalten (Halt ${spruenge})`
        ).toBe('a b');
    });

    test('(k) ein Kontrollkaestchen schaltet weiter NATIV', async ({ page }) => {
        // `input[type=checkbox][data-action]` wird ueber `change` bedient;
        // die Leertaste gehoert dem Browser. Hier muss `echt` 1 BLEIBEN —
        // der einzige Fall in dieser Datei, der das zusichert.
        await ansichtOeffnen(page, 'quests', 6);
        const spruenge = await tabBisZiel(page, { tag: 'INPUT', action: 'render-quests' });
        expect(spruenge).toBeGreaterThan(0);
        await zielMerken(page);
        const vorher = await page.evaluate(() => window.__ziel.checked);

        await page.keyboard.press(' ');
        await page.waitForTimeout(400);

        const k = await klicks(page);
        expect(k.echt, `das Kaestchen schaltet nativ (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch, 'der Zweig fasst es nicht an').toBe(0);
        expect(await page.evaluate(() => window.__ziel.checked), 'und der Haken kippt').toBe(
            !vorher
        );
    });

    test('(l) ein <summary> klappt weiter NATIV auf', async ({ page }) => {
        // Fuenf `<summary>` in der Wuerfelansicht, keines mit einem
        // `[data-action]`-Vorfahren (am gebauten Buendel nachgezaehlt) —
        // `closest()` liefert `null`, der Zweig greift gar nicht. Dieser
        // Fall ist der Waechter dafuer, dass das so bleibt.
        await ansichtOeffnen(page, 'dice', 6);
        const spruenge = await tabBisZiel(page, { tag: 'SUMMARY' });
        expect(spruenge).toBeGreaterThan(0);
        await zielMerken(page);
        const vorher = await zustand(page);

        await page.keyboard.press(' ');
        await page.waitForTimeout(400);

        const k = await klicks(page);
        const nachher = await zustand(page);
        expect(k.echt, `<summary> loest nativ aus (Halt ${spruenge})`).toBe(1);
        expect(k.synthetisch, 'der Zweig fasst es nicht an').toBe(0);
        expect(nachher.detailsOffen - vorher.detailsOffen, 'und die Klappe geht auf').toBe(1);
    });
});
