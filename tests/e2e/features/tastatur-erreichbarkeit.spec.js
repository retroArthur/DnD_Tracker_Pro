// @ts-check
/**
 * Die Kehrschleife — Tastaturerreichbarkeit der Kampfansichten (TAST, T-C / Schritt 4)
 * ====================================================================================
 *
 * WORUEBER DIESE DATEI URTEILT. T-A hat repariert, was die ERREICHBAREN
 * Knoepfe beim Tastendruck tun; T-B hat den Mechanismus gebaut, mit dem
 * Enter und die Leertaste ein nicht-natives Bedienelement ueberhaupt
 * bedienen koennen. Beide haben KEINE einzige Stelle neu erreichbar
 * gemacht — das war Absicht und steht so in ihren Akten. Diese Datei
 * urteilt ueber den fehlenden dritten Teil: die 219 Quellstellen in 43
 * Dateien (100 `div`, 81 `span`, 38 `label`), die `data-action` tragen,
 * aber kein `tabindex` — und die darum in KEINEM Tabulatorlauf vorkommen.
 *
 * Gemessen am gebauten Buendel, gefuellte Kampagne, echte Tabulatorspruenge,
 * je Ansicht ein frischer Seitenaufbau (Ausgangslage HEAD 4830173):
 *
 *   Armaturenbrett   40 bedienbar, 12 unerreichbar — alle 12 nicht-nativ
 *   Party            44 bedienbar,  8 unerreichbar
 *   Initiative       69 bedienbar,  9 unerreichbar
 *   Wuerfel          42 bedienbar,  1 unerreichbar
 *   DM-Schirm        37 bedienbar,  1 unerreichbar
 *
 * Diese Zahlen sind bei EINEM Eintrag je Typ gemessen und die Schuld
 * skaliert mit den Daten (vermessen: 84 Stellen bei fast leerer Kampagne,
 * 462 bei zwanzig Eintraegen je Typ). Deshalb laeuft jeder Reichweitenfall
 * unten bei ZWEI Kampagnengroessen.
 *
 * WAS DEM SPIELLEITER FEHLT, in Klartext. Unerreichbar sind unter anderem:
 * die acht Sprungfelder des Armaturenbretts (`show-view`), der
 * Lebenspunkte-Rechner je Heldenkarte (`show-hp-calculator-stop`), die
 * Initiative-Wertbearbeitung (`edit-init-value`), der Charakterbogen
 * (`edit-char`), die Namensverweise der Kampfzeile
 * (`navigate-entity-stop`), die Zauberplatz- und Initiative-Punkte
 * (`toggle-spell-slot-stop`, `toggle-init-slot-stop`) — und `div.qref-fab`,
 * die Schnell-Referenz, die in ALLEN 24 Ansichten unerreichbar ist und
 * deren einziger Zugang heute das Kuerzel `/` ist.
 *
 * DER GEWAEHLTE WEG IST `tabindex="0"` + `role="button"`, NICHT `div` ->
 * `button` (Orchestrator-Entscheidung O-1, entschieden, nicht zur Wahl
 * gestellt). Der Tagwechsel aendert bei 32 von 32 Signaturen mindestens eine
 * berechnete Eigenschaft und bei 20 von 32 die Abmessungen; er haette den
 * Stil-Sollstand (`computed-style-diff.spec.js`) zweifach rot gemacht, weil
 * dessen Schluessel `tag.sortierteKlassen#index` ist. Zwei Attribute aendern
 * dagegen weder Schluessel noch Box noch eine der zwoelf gehashten
 * Eigenschaften — es gibt im ganzen CSS-Baum keine einzige Regel auf
 * `[role=…]` oder `[tabindex…]` (nachgezaehlt: 0 Treffer in
 * `assets/styles/`).
 *
 * UND SIE ENTSTEHEN ZUR LAUFZEIT, nicht im Quelltext (O-3). Eine
 * Kehrschleife mit `MutationObserver` ist EINE Stelle und deckt auch
 * kuenftigen Code; 219 Quelltext-Aenderungen in 43 Dateien waeren 149
 * globale `render*`-Funktionen, von denen sich jede an zwei Attribute
 * erinnern muesste. Preis: ein `grep tabindex` im Quellbaum zeigt sie
 * nicht. Die Faelle (f) bis (h) sind die Kehrseite dieser Entscheidung:
 * jede Renderfunktion, die `innerHTML` ersetzt, LOESCHT die Attribute
 * wieder. Eine Kehrschleife, die nach `renderAll()`, nach einem
 * Rueckgaengig und nach einem vollen Datentausch nicht erneut greift,
 * sieht aus wie "war schon immer so" und niemand findet sie wieder.
 *
 * UMFANG: FUENF ANSICHTEN (Nutzerentscheidung E-1, "Kampf zuerst").
 * Armaturenbrett, Initiative, Party, Wuerfel, DM-Schirm — plus die
 * globale Schale ausserhalb aller `.view`-Abschnitte, denn `div.qref-fab`
 * liegt dort und waere sonst in den fuenf Ansichten weiter unerreichbar.
 * Die uebrigen 19 Ansichten sind ausdruecklich NICHT Teil dieses Pakets
 * und werden als benannte Restschuld gefuehrt. Diese Datei sichert darum
 * KEINE Obergrenze fuer die anderen Ansichten zu — eine solche Zusicherung
 * waere eine Fessel um die Folgearbeit.
 *
 * MESSDISZIPLIN — dieselben Regeln wie in `tastatur-ausloesung.spec.js` und
 * `tastatur-verteiler.spec.js`, jede aus einer verdorbenen Messung gelernt:
 *
 *  1. NUR ECHTE TASTENDRUECKE. Fokus ausschliesslich per
 *     `page.keyboard.press('Tab')`, niemals `.focus()`. Kein
 *     `element.click()` auf ein Ziel.
 *
 *  2. KEIN KLICK UND KEIN `blur()` ALS STARTPUNKT, sondern ein frischer
 *     Seitenaufbau plus `window.switchView()`. Chromiums "sequential focus
 *     navigation starting point" ueberlebt ein `blur()`; ein Klick auf einen
 *     Navigationsknopf setzt ihn mitten ins Dokument.
 *
 *  3. DAS ZIEL WIRD UEBER OBJEKTIDENTITAET AUFGELOEST — `window.__ops` haelt
 *     die Knotenliste, der Abgleich laeuft ueber `indexOf`. NIEMALS ueber
 *     Signatur plus Text: textgleiche Zeilenknoepfe (sechsmal "➕", zwei
 *     `div.init-value` mit demselben Titel) verschmelzen sonst zu einem
 *     Eintrag und die Schuld wird zu NIEDRIG gezaehlt.
 *
 * WARUM DIE MITSCHRIFT AM `focusin` HAENGT und nicht an einer Ablesung je
 * Sprung: beides liefert dasselbe Ergebnis — gegengeprueft gegen
 * `sweep2.mjs` der Vermessung, 12/8/9/1/1 unerreichbar in den fuenf
 * Ansichten, Zahl fuer Zahl gleich —, aber die Mitschrift braucht 0,2 s
 * statt rund 10 s je Ansicht, weil zwischen zwei Tastendruecken kein
 * Rundlauf in die Seite liegt. Bei zwanzig Eintraegen je Typ ist das der
 * Unterschied zwischen einem laufenden und einem abbrechenden Fall.
 *
 * WARUM DER KLICKZAEHLER IN (i) AM DOKUMENT HAENGT: `_handleClick` ruft fuer
 * jede registrierte Aktion `e.stopPropagation()`, BEVOR es den Handler
 * aufruft. Ein Lauscher am Ziel selbst wird dadurch nie erreicht und
 * meldet konstant 0.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/**
 * Die fuenf Kampfansichten aus E-1, als Argument fuer `switchView()`.
 * Die `.view`-Kennungen daneben sind das, was die Kehrschleife prueft.
 */
const KAMPF_ANSICHTEN = [
    { name: 'dashboard', id: 'view-dashboard', titel: 'Armaturenbrett' },
    { name: 'initiative', id: 'view-initiative', titel: 'Initiative' },
    { name: 'party', id: 'view-party', titel: 'Party' },
    { name: 'dice', id: 'view-dice', titel: 'Wuerfel' },
    { name: 'dmscreen', id: 'view-dmscreen', titel: 'DM-Schirm' }
];

/**
 * Zwei Kampagnengroessen. Die Schuld skaliert mit den Daten (vermessen: 84
 * unerreichbare Stellen bei fast leerer Kampagne, 462 bei zwanzig
 * Eintraegen je Typ). Ein Fall, der nur bei sechs Eintraegen geprueft ist,
 * sagt nichts ueber den Spieltisch.
 */
const GROESSEN = [6, 20];

/**
 * Gefuellte Kampagne mit `n` Eintraegen je Typ. Die Kaempfer tragen ANDERE
 * Namen als die Charaktere, damit `addPartyToInit()` nichts ueberspringt
 * (dieselbe Falle wie in `tastatur-verteiler.spec.js`).
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
            name: `Charakter ${i + 1} (T-C)`,
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 10, dex: 12, con: 14, int: 16, wis: 12, cha: 10 },
            // Zauberplaetze, damit die Punkte (`toggle-spell-slot-stop`) im
            // Dokument stehen — sie sind vier der acht unerreichbaren
            // Party-Stellen.
            spellSlots: { 1: { max: 4, current: 2 }, 2: { max: 3, current: 1 } }
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
 * Sammelt die sichtbaren Bedienelemente der AKTIVEN Ansicht (plus die
 * globale Schale ausserhalb aller `.view`) in `window.__ops` und haengt
 * EINMAL einen `focusin`-Mitschnitt an, der jeden erreichten Index in
 * `window.__erreicht` legt. Mehrfach aufrufbar: die Knotenliste und die
 * Trefferliste werden neu gesetzt, der Lauscher liest beide dynamisch —
 * genau das brauchen die Faelle (f) bis (h), die nach einem Neuzeichnen ein
 * zweites Mal sammeln.
 *
 * Herkunft: Sammlung und Sichtbarkeitsregel sind aus `sweep2.mjs` der
 * Vermessung uebernommen, damit die Zahlen hier mit den dort gemessenen
 * vergleichbar sind.
 */
const SAMMELN = `(() => {
    const NATIV = 'button,a[href],input:not([type="hidden"]),select,textarea,' +
        '[tabindex]:not([tabindex="-1"]),[contenteditable=""],[contenteditable="true"]';
    const sichtbar = el => {
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true,
            visibilityProperty: true, contentVisibilityAuto: true })) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const inAktiverAnsicht = el => {
        const v = el.closest('.view');
        return v ? v.classList.contains('active') : true;
    };
    const beschreibe = el => ({
        sig: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
            ((typeof el.className === 'string' && el.className.trim())
                ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''),
        text: (el.getAttribute('aria-label') || el.getAttribute('title') ||
            el.textContent || el.value || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
        tag: el.tagName.toLowerCase(),
        aktion: el.getAttribute('data-action') || null,
        rolle: el.getAttribute('role') || null,
        ti: el.getAttribute('tabindex') || null,
        ansicht: el.closest('.view') ? el.closest('.view').id : 'global'
    });
    const ops = [], meta = [], gesehen = new Set();
    document.querySelectorAll(NATIV).forEach(el => {
        if (el.disabled || gesehen.has(el) || !sichtbar(el) || !inAktiverAnsicht(el)) return;
        gesehen.add(el); ops.push(el);
        const m = beschreibe(el); m.art = 'nativ'; meta.push(m);
    });
    document.querySelectorAll('[data-action]').forEach(el => {
        if (gesehen.has(el)) return;
        if (el.matches(NATIV) && !el.disabled) return;
        if (!sichtbar(el) || !inAktiverAnsicht(el)) return;
        gesehen.add(el); ops.push(el);
        const m = beschreibe(el); m.art = 'nichtNativ'; meta.push(m);
    });
    window.__ops = ops;
    window.__erreicht = new Set();
    if (!window.__reichweiteLauscher) {
        window.__reichweiteLauscher = ev => {
            const i = (window.__ops || []).indexOf(ev.target);
            if (i >= 0) window.__erreicht.add(i);
        };
        document.addEventListener('focusin', window.__reichweiteLauscher, true);
    }
    return meta;
})()`;

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
    await page.waitForTimeout(600);
}

/**
 * Sammelt, tabuliert mit ECHTEN Tastendruecken ueber zwei vollstaendige
 * Runden und meldet, welche gesammelten Bedienelemente kein einziges Mal
 * den Fokus bekamen.
 *
 * Das Budget ist `2 × bedienbar + 120`: zwei Runden, damit ein Start
 * mitten in der Reihe niemanden verschluckt, plus Luft fuer Halte, die die
 * Sammlung nicht zaehlt (Phantomhalte, Elemente anderer Ansichten).
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ bedienbar: number, nichtNativ: number, spruenge: number,
 *   unerreichbar: Array<Record<string, any>> }>}
 */
async function reichweiteMessen(page) {
    const meta = await page.evaluate(SAMMELN);
    const budget = 2 * meta.length + 120;
    for (let i = 0; i < budget; i++) {
        await page.keyboard.press('Tab');
    }
    const erreicht = new Set(await page.evaluate(() => [...window.__erreicht]));
    return {
        bedienbar: meta.length,
        nichtNativ: meta.filter(m => m.art === 'nichtNativ').length,
        spruenge: budget,
        unerreichbar: meta.map((m, i) => ({ ...m, i })).filter(m => !erreicht.has(m.i))
    };
}

/**
 * Lesbare Fehlermeldung: WAS unerreichbar ist, nicht nur wie viele.
 * @param {{ bedienbar: number, nichtNativ: number, spruenge: number,
 *   unerreichbar: Array<Record<string, any>> }} m
 */
function bericht(m) {
    const zeilen = m.unerreichbar
        .slice(0, 14)
        .map(
            u =>
                `    ${u.art.padEnd(10)} ${u.tag.padEnd(6)} ${(u.aktion || '-').padEnd(26)} ` +
                `${u.sig.slice(0, 44)}  "${u.text}"  [${u.ansicht}]`
        );
    if (m.unerreichbar.length > 14) {
        zeilen.push(`    … und ${m.unerreichbar.length - 14} weitere`);
    }
    return (
        `${m.bedienbar} sichtbare Bedienelemente (davon ${m.nichtNativ} nicht-nativ), ` +
        `${m.spruenge} echte Tabulatorspruenge, ${m.unerreichbar.length} unerreichbar:\n` +
        zeilen.join('\n')
    );
}

/**
 * Tabuliert mit ECHTEN Tastendruecken, bis das fokussierte Element das
 * unter `window.__ziel` abgelegte IST (Objektidentitaet, Messdisziplin 3).
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor Wird EINMAL aufgeloest und als Objekt gemerkt.
 * @param {number} maxSpruenge
 * @returns {Promise<number>} Zahl der Spruenge, 0 wenn nicht erreicht
 */
async function tabBisZiel(page, selektor, maxSpruenge = 400) {
    const vorhanden = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        window.__ziel = el;
        return true;
    }, selektor);
    expect(vorhanden, `Ziel "${selektor}" steht nicht im Dokument`).toBe(true);

    for (let i = 1; i <= maxSpruenge; i++) {
        await page.keyboard.press('Tab');
        const treffer = await page.evaluate(
            () =>
                document.activeElement === window.__ziel && document.activeElement !== document.body
        );
        if (treffer) return i;
    }
    return 0;
}

// ============================================================
// (a)-(e) REICHWEITE JE KAMPFANSICHT, BEI ZWEI KAMPAGNENGROESSEN
// ============================================================

test.describe('Kehrschleife — Reichweite der Kampfansichten', () => {
    for (const ansicht of KAMPF_ANSICHTEN) {
        for (const n of GROESSEN) {
            test(`${ansicht.titel} (${ansicht.name}): kein sichtbares Bedienelement bleibt unerreichbar — ${n} Eintraege je Typ`, async ({
                page
            }) => {
                // Bei zwanzig Eintraegen je Typ sind es mehrere hundert echte
                // Tastendruecke; die Vorgabe von 30 s ist dafuer zu knapp,
                // sobald die Maschine belastet ist.
                test.setTimeout(n >= 20 ? 180_000 : 90_000);

                await ansichtOeffnen(page, ansicht.name, n);
                const aktiv = await page.evaluate(
                    () => document.querySelector('.view.active')?.id || '?'
                );
                expect(aktiv, 'Erwartete Ansicht ist nicht aktiv').toBe(ansicht.id);

                const m = await reichweiteMessen(page);
                expect(m.bedienbar, 'Die Sammlung hat nichts gefunden').toBeGreaterThan(10);
                expect(m.unerreichbar.length, bericht(m)).toBe(0);
            });
        }
    }
});

// ============================================================
// (f)-(h) DIE KEHRSCHLEIFE MUSS ERNEUT GREIFEN
// ============================================================
//
// Jede Renderfunktion, die `innerHTML` ersetzt, loescht `tabindex` und
// `role` wieder. Es gibt 149 globale `render*`-Funktionen; ein verpasster
// Pfad sieht aus wie "war schon immer so". Diese drei Faelle sind die
// Ratsche dafuer.

test.describe('Kehrschleife — greift nach einem Neuzeichnen erneut', () => {
    test('(f) nach renderAll() ist weiter nichts unerreichbar', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const vorher = await reichweiteMessen(page);
        expect(vorher.unerreichbar.length, 'Vorlauf: ' + bericht(vorher)).toBe(0);

        await page.evaluate(() => window.renderAll());
        await page.waitForTimeout(600);

        const nachher = await reichweiteMessen(page);
        expect(nachher.bedienbar, 'Nach renderAll() ist die Ansicht leer').toBeGreaterThan(10);
        expect(nachher.unerreichbar.length, 'Nach renderAll(): ' + bericht(nachher)).toBe(0);
    });

    test('(g) nach Rueckgaengig ist weiter nichts unerreichbar', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'party', 6);

        // Eine echte, rueckgaengig machbare Aenderung: ein Held weniger.
        const zahlen = await page.evaluate(() => {
            window.saveUndoState('T-C Probe');
            window.D.characters.pop();
            window.renderAll();
            return { nachLoeschen: window.D.characters.length };
        });
        expect(zahlen.nachLoeschen).toBe(5);
        await page.waitForTimeout(400);

        await page.evaluate(() => window.undo());
        await page.waitForTimeout(700);
        const wiederhergestellt = await page.evaluate(() => window.D.characters.length);
        expect(wiederhergestellt, 'Rueckgaengig hat den Helden nicht zurueckgebracht').toBe(6);

        const m = await reichweiteMessen(page);
        expect(m.bedienbar, 'Nach dem Rueckgaengig ist die Ansicht leer').toBeGreaterThan(10);
        expect(m.unerreichbar.length, 'Nach undo(): ' + bericht(m)).toBe(0);
    });

    test('(h) nach einem vollen Datentausch ist weiter nichts unerreichbar', async ({ page }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        // `applyRestoredCampaign()` ersetzt D vollstaendig und zeichnet alles
        // neu — derselbe Pfad, den eine Wiederherstellung und ein
        // Kampagnen-Import nehmen.
        await page.evaluate(async daten => {
            await window.applyRestoredCampaign(daten, 'T-C Probe');
        }, kampagne(12));
        await page.waitForTimeout(900);

        const kaempfer = await page.evaluate(() => window.D.initiative.combatants.length);
        expect(kaempfer, 'Der Datentausch hat nicht gegriffen').toBe(12);

        const m = await reichweiteMessen(page);
        expect(m.bedienbar, 'Nach dem Datentausch ist die Ansicht leer').toBeGreaterThan(10);
        expect(m.unerreichbar.length, 'Nach applyRestoredCampaign(): ' + bericht(m)).toBe(0);
    });
});

// ============================================================
// (i) NICHTS LOEST DOPPELT AUS
// ============================================================

//
// JE TASTE EIN EIGENER SEITENAUFBAU, und das ist kein Luxus:
// `toggleQuickRef()` setzt den Fokus 100 ms nach dem Oeffnen auf
// `#qref-search-input`. Ein zweiter Tastendruck im selben Lauf traefe also
// das Suchfeld und nicht mehr die Schaltflaeche — die Messung wuerde
// schweigen, statt zu urteilen.

for (const taste of [
    { key: ' ', name: 'Leertaste' },
    { key: 'Enter', name: 'Enter' }
]) {
    test.describe(`Kehrschleife — ein Tastendruck, ein Klick (${taste.name})`, () => {
        test(`(i) ${taste.name} auf dem nachgeruesteten div.qref-fab: genau 1 Klick, 0 davon echt`, async ({
            page
        }) => {
            test.setTimeout(120_000);
            await ansichtOeffnen(page, 'initiative', 6);

            const spruenge = await tabBisZiel(page, 'div.qref-fab');
            expect(
                spruenge,
                'div.qref-fab ist in 400 echten Tabulatorspruengen nicht erreichbar — ' +
                    'die Kehrschleife hat die globale Schale nicht erfasst'
            ).toBeGreaterThan(0);

            // Attribute am ERREICHTEN Objekt lesen, nicht an einem zweiten Treffer.
            const attr = await page.evaluate(() => ({
                ti: document.activeElement.getAttribute('tabindex'),
                rolle: document.activeElement.getAttribute('role'),
                tag: document.activeElement.tagName
            }));
            expect(attr.tag).toBe('DIV');
            expect(attr.ti, 'tabindex fehlt am erreichten Element').toBe('0');
            expect(attr.rolle, 'role="button" fehlt am erreichten Nicht-label').toBe('button');

            // Zaehler am Dokument in der Capture-Phase — Begruendung im Kopf.
            await page.evaluate(() => {
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
                window.scrollTo(0, 0);
            });

            await page.keyboard.press(taste.key);
            await page.waitForTimeout(400);

            const mess = await page.evaluate(() => ({
                ...window.__klicks,
                scrollY: Math.round(window.scrollY),
                offen: !!document.querySelector('#quick-ref-panel.active, .qref-panel.active')
            }));
            expect(
                mess.echt + mess.synthetisch,
                `${taste.name}: ${mess.echt} echte + ${mess.synthetisch} synthetische Klicks — ` +
                    'erwartet genau 1 (role="button" darf den Browser NICHT zu einem eigenen ' +
                    'Klick bringen)'
            ).toBe(1);
            expect(mess.echt, 'Der Browser hat selbst einen Klick erzeugt — Doppelfeuer').toBe(0);
            expect(mess.scrollY, `${taste.name} hat die Seite weggerollt`).toBe(0);
            expect(mess.offen, 'Die Schnell-Referenz hat sich nicht geoeffnet').toBe(true);
        });
    });
}

// ============================================================
// (j) FOKUSRING OHNE EINE ZEILE NEUES CSS
// ============================================================

test.describe('Kehrschleife — der Ring kommt aus der Weltregel', () => {
    test('(j) das nachgeruestete div.init-value traegt den Fokusring aus assets/styles/core.css', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const spruenge = await tabBisZiel(page, 'div.init-value');
        expect(spruenge, 'div.init-value ist nicht per Tabulator erreichbar').toBeGreaterThan(0);

        const ring = await page.evaluate(() => {
            const el = document.activeElement;
            const cs = getComputedStyle(el);
            const token = getComputedStyle(document.documentElement)
                .getPropertyValue('--focus-ring')
                .trim();
            // Token in denselben rgb()-Text bringen, in dem der Browser
            // `outlineColor` meldet — ein Vergleich von "#d4af37" mit
            // "rgb(212, 175, 55)" waere immer falsch.
            const probe = document.createElement('span');
            probe.style.color = token;
            document.body.appendChild(probe);
            const tokenRgb = getComputedStyle(probe).color;
            probe.remove();
            return {
                breite: cs.outlineWidth,
                stil: cs.outlineStyle,
                farbe: cs.outlineColor,
                versatz: cs.outlineOffset,
                tokenRgb,
                trifftFocusVisible: el.matches(':focus-visible')
            };
        });

        expect(
            ring.trifftFocusVisible,
            ':focus-visible greift am nachgeruesteten Element nicht'
        ).toBe(true);
        expect(ring.stil, `outline-style war "${ring.stil}"`).toBe('solid');
        expect(ring.breite, `outline-width war "${ring.breite}"`).toBe('2px');
        expect(ring.versatz, `outline-offset war "${ring.versatz}"`).toBe('2px');
        expect(
            ring.farbe,
            `outline-color "${ring.farbe}" ist nicht das Token --focus-ring (${ring.tokenRgb})`
        ).toBe(ring.tokenRgb);
    });
});

// ============================================================
// (k) WAS DIE KEHRSCHLEIFE SETZT — UND WAS SIE STEHEN LAESST
// ============================================================

test.describe('Kehrschleife — die zwei Attribute, und die Ausnahme fuer <label>', () => {
    test('(k) ein nachtraeglich eingehaengtes Element wird erfasst: div bekommt role, label bekommt keine', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'initiative', 6);

        // Der MutationObserver-Pfad, direkt geprueft: zwei Knoten nach dem
        // Seitenaufbau in die Kampfansicht haengen. `role="button"` auf einer
        // Marke waere falsch — es ueberschreibt den Marken-Charakter, und
        // gemessen traegt die Marke OHNE role genauso (O-6).
        await page.evaluate(() => {
            const ziel = document.getElementById('view-initiative');
            const d = document.createElement('div');
            d.id = 't-c-probe-div';
            d.setAttribute('data-action', 'toggle-quick-ref');
            d.textContent = 'Probe div';
            const l = document.createElement('label');
            l.id = 't-c-probe-label';
            l.setAttribute('data-action', 'toggle-selected');
            l.textContent = 'Probe label';
            const b = document.createElement('button');
            b.id = 't-c-probe-button';
            b.setAttribute('data-action', 'toggle-quick-ref');
            b.textContent = 'Probe button';
            ziel.appendChild(d);
            ziel.appendChild(l);
            ziel.appendChild(b);
        });
        await page.waitForTimeout(500);

        const attr = await page.evaluate(() => {
            const lies = id => {
                const el = document.getElementById(id);
                return el
                    ? { ti: el.getAttribute('tabindex'), rolle: el.getAttribute('role') }
                    : null;
            };
            return {
                div: lies('t-c-probe-div'),
                label: lies('t-c-probe-label'),
                knopf: lies('t-c-probe-button')
            };
        });

        expect(attr.div, 'Die Probe-Knoten fehlen').not.toBeNull();
        expect(attr.div.ti, 'Der nachtraeglich eingehaengte div bekam kein tabindex').toBe('0');
        expect(attr.div.rolle, 'Der nachtraeglich eingehaengte div bekam keine role').toBe(
            'button'
        );

        expect(attr.label.ti, 'Die nachtraeglich eingehaengte Marke bekam kein tabindex').toBe('0');
        expect(
            attr.label.rolle,
            'Die Marke hat eine role bekommen — role="button" ueberschreibt den Marken-Charakter'
        ).toBeNull();

        expect(
            attr.knopf.ti,
            'Ein echter <button> hat ein tabindex bekommen — die Kehrschleife greift in die ' +
                'natuerliche Tabulatorreihe ein, wo sie nichts zu tun hat'
        ).toBeNull();
        expect(attr.knopf.rolle, 'Ein echter <button> hat eine role bekommen').toBeNull();
    });
});
