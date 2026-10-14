// @ts-check
/**
 * Die Gruppenmechanik — ein Tabulatorhalt je Gruppe, Pfeiltasten darin
 * (TASV, Nutzerentscheidung E-2)
 * ===================================================================
 *
 * WORUEBER DIESE DATEI URTEILT. Das Kampfpaket (E-1) hat rund 430 Stellen
 * der fuenf Kampfansichten fokussierbar gemacht und damit eine Schuld
 * beglichen und eine neue aufgemacht: jeder einzelne Zauberplatz-Punkt
 * einer Kampfzeile hat seitdem seinen EIGENEN Tabulatorhalt. Der Nutzer
 * hatte dafuer eine Antwort gegeben — "ein Halt je Gruppe, Pfeiltasten
 * darin" —, und sie ist nie umgesetzt worden.
 *
 * WIE SCHWER DAS WIEGT, am gebauten Buendel gemessen (gefuellte Kampagne,
 * 1440 px, VERKNUEPFTE Spielerkaempfer, echte Tastendruecke, je Lauf ein
 * frischer Seitenaufbau, Ausgangslage HEAD b8a1a5c):
 *
 *                              6 Kaempfer      20 Kaempfer
 *   Zauberplatz-Punkte              42             140
 *   davon mit tabindex="0"          42             140   <-- jeder ein Halt
 *   Anschlaege bis `.qref-fab`     142             366
 *   bei 400 ms je Anschlag        57 s           146 s
 *
 * 366 Anschlaege fuer die Schnell-Referenz, in der Ansicht, in der der
 * Spielleiter vor sechs wartenden Spielern sitzt. Die Flut ist also nicht
 * die Gefahr einer kuenftigen Nachruestung der Vorbereitungsansichten —
 * sie ist schon da, und E-2 ist eine ueberfaellige Korrektur an E-1.
 *
 * UND DIE PFEILTASTEN TUN HEUTE NICHTS. Gemessen auf dem ersten Punkt
 * (`data-value="1,0"`), nach einem echten Tabulatorlauf dorthin:
 *
 *   vor          span.init-slot-box  wert=1,0
 *   ArrowRight   span.init-slot-box  wert=1,0   (unveraendert)
 *   ArrowDown    span.init-slot-box  wert=1,0   (unveraendert)
 *   End          span.init-slot-box  wert=1,0   (unveraendert)
 *
 * WARUM DIE ACHSE WAAGERECHT IST — gemessen, nicht gefuehlt. Die sieben
 * Punkte einer Kampfzeile (vier Plaetze Grad 1, drei Grad 2) liegen auf
 * EINER Zeile: dx 101 px, dy 0 px, alle sieben auf derselben y-Linie
 * (1012/1026/1040/1054 | 1085/1099/1113 bei y=506). Das gilt ueber die
 * ganze Media-Query-Leiter: bei 1440, 900, 680 UND 375 px bleibt es eine
 * Zeile (`zeilen: 1`, `dy: 0`). Die Rang-Grenze ist also keine Zeilen-,
 * sondern eine Beschriftungsgrenze — darum laeuft die Pfeiltastenfahrt
 * ueber sie hinweg und die Gruppe ist `.init-spell-slots`, nicht
 * `.init-slot-boxes`. Dieselbe Messung bei den Todeswuerfen: je
 * `.death-saves-dots` drei Punkte, dx 40 px, dy 0 px.
 *
 * WARUM DIE TODESWUERFE ZWEI GRUPPEN SIND UND DIE ZAUBERPLAETZE EINE.
 * Geometrisch waeren auch die sechs Todespunkte eine Zeile (dx 142, dy 0).
 * Sie sind es trotzdem nicht: Erfolge und Fehlschlaege sind
 * GEGENTEILIGE Ausgaenge mit je eigener Beschriftung (✓ / ✗) in je
 * eigenem Behaelter. Vier Zauberplaetze Grad 1 und drei Grad 2 sind
 * dagegen dasselbe Ding in zwei Staerken. Die Gruppe folgt der Bedeutung,
 * wo die Geometrie beide Lesarten zulaesst.
 *
 * WELCHE ROLLE UND WARUM. `role="toolbar"` am Behaelter, `role="button"`
 * am Glied. Begruendung, und zwar als Ausschluss:
 *   — `listbox`/`option` waere eine LUEGE. Die Punkte sind unabhaengige
 *     Schalter, es gibt kein "eines von N gewaehlt". Eine `listbox` ohne
 *     `aria-selected` bzw. ohne `aria-activedescendant` behauptet
 *     gegenueber dem Vorleseprogramm eine Auswahl, die es nicht gibt.
 *     Fall (7) prueft darum ausdruecklich, dass KEINES der beiden
 *     Attribute auftaucht.
 *   — `role="group"` waere nicht falsch, aber stumm: `group` sagt nichts
 *     ueber die Tastatur. `toolbar` IST das ARIA-Muster "ein Halt,
 *     Pfeiltasten darin" — die Rolle, die das gebaute Verhalten benennt.
 *   — `aria-orientation` traegt die gemessene Achse. Eine waagerechte
 *     Leiste, die auf Oben/Unten hoert, waere derselbe Widerspruch in der
 *     anderen Richtung.
 *
 * MESSDISZIPLIN — dieselben Regeln wie in `tastatur-erreichbarkeit.spec.js`,
 * jede aus einer verdorbenen Messung gelernt:
 *   1. NUR ECHTE TASTENDRUECKE, Fokus nie per `.focus()`. Bei
 *      programmatischem Fokus greift `:focus-visible` nicht, und ein
 *      wandernder Tabindex, der nur auf `.focus()` reagiert, waere eine
 *      Mechanik, die kein Mensch bedient.
 *   2. KEIN KLICK ALS STARTPUNKT, sondern frischer Seitenaufbau plus
 *      `switchView()` — Chromiums Startpunkt der Fokusreihe ueberlebt ein
 *      `blur()`.
 *   3. VERKNUEPFTE Spielerkaempfer im Seed. Mit der Saat der
 *      Erreichbarkeitsdatei ("Held N"/"Ork N") gibt es GAR KEINE Punkte:
 *      `renderCombatantSpellSlots()` (features/initiative.js:77) braucht
 *      `type === 'player'` UND einen namensgleichen Charakter mit
 *      `spellSlots`. Gemessen 0 Punkte bei 6 und bei 20 Kaempfern. Eine
 *      leere Gruppe ist kein Beweis.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/** Die Gruppe der Zauberplaetze einer Kampfzeile. */
const ZAUBER = { behaelter: '.init-spell-slots', glied: '.init-slot-box', achse: 'horizontal' };
/** Die Gruppe der Todeswuerfe, je Vorzeichen eine. */
const TOD = { behaelter: '.death-saves-dots', glied: '.death-save-dot', achse: 'horizontal' };

/**
 * Gefuellte Kampagne mit `n` Eintraegen je Typ und VERKNUEPFTEN
 * Spielerkaempfern (Messdisziplin 3). `tote` Kaempfer stehen auf 0 TP,
 * damit die Todeswuerfe ueberhaupt gezeichnet werden.
 * @param {number} n
 * @param {number} tote
 */
function kampagne(n, tote = 0) {
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
            name: `Charakter ${i + 1} (E-2)`,
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 10, dex: 12, con: 14, int: 16, wis: 12, cha: 10 },
            // Vier Plaetze Grad 1, drei Grad 2 — die sieben Punkte, deren
            // Halte diese Datei zaehlt.
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
                // NAMENSGLEICH mit dem Charakter — sonst gibt es keine Punkte.
                name: `Charakter ${i + 1} (E-2)`,
                initiative: 30 - i,
                initBonus: 2,
                maxHp: 40,
                currentHp: i < tote ? 0 : 40,
                ac: 16,
                type: 'player',
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
 * @param {number} n
 * @param {number} tote
 */
async function ansichtOeffnen(page, ansicht, n = 6, tote = 0) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(
        seed => {
            try {
                localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
            } catch {
                // file://-localStorage ist je Browserbau unterschiedlich streng.
            }
        },
        kampagne(n, tote)
    );
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(700);
}

/**
 * Liest den Zustand ALLER Gruppen einer Art: Zahl der Glieder, Zahl der
 * Haltepunkte (`tabindex="0"`), Index des Halts, Rolle und ARIA des
 * Behaelters, Rollen der Glieder und — ausdruecklich — ob eine
 * Auswahlbehauptung im Spiel ist.
 * @param {{behaelter: string, glied: string}} g
 */
const GRUPPEN_LESEN = g => `(() => {
    return Array.from(document.querySelectorAll('${g.behaelter}'))
        .map(b => {
            const glieder = Array.from(b.querySelectorAll('${g.glied}'));
            const ti = glieder.map(x => x.getAttribute('tabindex'));
            return {
                glieder: glieder.length,
                halte: ti.filter(t => t === '0').length,
                haltIndex: ti.indexOf('0'),
                abgemeldet: ti.filter(t => t === '-1').length,
                ohneTabindex: ti.filter(t => t === null).length,
                rolleBehaelter: b.getAttribute('role'),
                ausrichtung: b.getAttribute('aria-orientation'),
                beschriftung: b.getAttribute('aria-label'),
                rollenGlieder: [...new Set(glieder.map(x => x.getAttribute('role')))],
                aktivesKind: b.getAttribute('aria-activedescendant'),
                auswahlBehauptet: glieder.filter(x => x.hasAttribute('aria-selected')).length
            };
        });
})()`;

/** Kennzeichen des fokussierten Elements — Signatur plus Datenmerkmale. */
const FOKUS = () => {
    const el = document.activeElement;
    if (!el || el === document.body) return { sig: 'BODY' };
    return {
        sig:
            el.tagName.toLowerCase() +
            (typeof el.className === 'string' && el.className.trim()
                ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
                : ''),
        aktion: el.getAttribute('data-action') || null,
        wert: el.getAttribute('data-value') || null,
        typ: el.getAttribute('data-type') || null,
        index: el.getAttribute('data-index') || null,
        ti: el.getAttribute('tabindex'),
        rolle: el.getAttribute('role'),
        imGlied: !!el.closest('[role="toolbar"]')
    };
};

/**
 * Echte Tabulatorspruenge, bis das Praedikat zutrifft.
 * @param {import('@playwright/test').Page} page
 * @param {string} pred Quelltext eines Ausdrucks, der im Browser laeuft
 * @param {number} max
 * @returns {Promise<number|null>} Zahl der Anschlaege oder null
 */
async function tabBis(page, pred, max = 320) {
    for (let i = 1; i <= max; i++) {
        await page.keyboard.press('Tab');
        if (await page.evaluate(pred)) return i;
    }
    return null;
}

/** Praedikat: der Fokus steht auf einem Glied der Art `g`. */
const AUF_GLIED = g =>
    `(() => { const el = document.activeElement;
      return !!(el && el.matches && el.matches('${g.glied}')); })()`;

/**
 * Haengt eine Mitschrift an, die je Tastendruck festhaelt, OB die Vorgabe
 * unterdrueckt wurde. Der Lauscher sitzt am `window` in der Blasenphase und
 * laeuft damit NACH jedem Lauscher am `document` — nur so sieht er ein
 * `preventDefault()`, das dort gesetzt wurde.
 */
const TASTEN_MITSCHRIFT = `(() => {
    window.__tasten = [];
    if (!window.__tastenLauscher) {
        window.__tastenLauscher = ev => {
            window.__tasten.push({ taste: ev.key, verhindert: ev.defaultPrevented });
        };
        window.addEventListener('keydown', window.__tastenLauscher, false);
    }
    return true;
})()`;

// ============================================================
// (1)-(2) EIN HALT JE GRUPPE
// ============================================================

test.describe('E-2 — ein Tabulatorhalt je Gruppe', () => {
    test('(1) jede Zauberplatz-Gruppe traegt genau EINEN Halt, alle uebrigen Glieder sind abgemeldet', async ({
        page
    }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const gruppen = await page.evaluate(GRUPPEN_LESEN(ZAUBER));
        expect(gruppen.length, 'Keine Zauberplatz-Gruppe im Dokument — Seed pruefen').toBe(6);

        const schlecht = gruppen
            .map((x, i) => ({ ...x, i }))
            .filter(x => x.halte !== 1 || x.abgemeldet !== x.glieder - 1);
        expect(
            schlecht.length,
            'Gruppen mit falscher Haltzahl:\n' +
                schlecht
                    .map(
                        x =>
                            `    Gruppe ${x.i}: ${x.glieder} Glieder, ${x.halte} Halte, ` +
                            `${x.abgemeldet} abgemeldet, ${x.ohneTabindex} ohne tabindex`
                    )
                    .join('\n')
        ).toBe(0);

        // Und die Summe: 42 Punkte, 6 Halte.
        const punkte = gruppen.reduce((s, x) => s + x.glieder, 0);
        const halte = gruppen.reduce((s, x) => s + x.halte, 0);
        expect(punkte, 'Punktzahl im Dokument').toBe(42);
        expect(halte, `${punkte} Punkte, aber ${halte} Haltepunkte`).toBe(6);
    });

    test('(2) der Tabulator verlaesst die Gruppe mit EINEM Sprung', async ({ page }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const halt = await tabBis(page, AUF_GLIED(ZAUBER));
        expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();

        const erstes = await page.evaluate(FOKUS);
        await page.keyboard.press('Tab');
        const naechstes = await page.evaluate(FOKUS);

        expect(
            naechstes.sig.startsWith('span.init-slot-box'),
            `Nach dem Punkt ${erstes.wert} folgt wieder ein Punkt (${naechstes.wert}) — ` +
                'die Gruppe verbraucht mehr als einen Halt'
        ).toBe(false);
    });
});

// ============================================================
// (3)-(5) DIE PFEILTASTEN IN DER GRUPPE
// ============================================================

test.describe('E-2 — Pfeiltasten in der Gruppe', () => {
    test('(3) Rechts/Links wandern Glied um Glied', async ({ page }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const halt = await tabBis(page, AUF_GLIED(ZAUBER));
        expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();

        const stationen = [await page.evaluate(FOKUS)];
        for (let i = 0; i < 6; i++) {
            await page.keyboard.press('ArrowRight');
            stationen.push(await page.evaluate(FOKUS));
        }
        const werte = stationen.map(s => s.wert);
        expect(
            werte,
            'Rechts muss ueber alle sieben Punkte der Zeile laufen, auch ueber ' +
                'die Rang-Grenze (gemessen: eine Zeile, dy=0). Gelaufen:\n    ' +
                werte.join('  ')
        ).toEqual(['1,0', '1,1', '1,2', '1,3', '2,0', '2,1', '2,2']);

        // Und zurueck.
        for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
        const zurueck = await page.evaluate(FOKUS);
        expect(zurueck.wert, 'Links muss vom letzten Punkt drei Schritte zurueckgehen').toBe('1,3');
    });

    test('(4) Pos1 und Ende springen auf das erste und das letzte Glied', async ({ page }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const halt = await tabBis(page, AUF_GLIED(ZAUBER));
        expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();

        await page.keyboard.press('End');
        const ende = await page.evaluate(FOKUS);
        expect(ende.wert, 'Ende muss auf das letzte Glied der Gruppe springen').toBe('2,2');

        await page.keyboard.press('Home');
        const pos1 = await page.evaluate(FOKUS);
        expect(pos1.wert, 'Pos1 muss auf das erste Glied der Gruppe springen').toBe('1,0');
    });

    test('(5) kein Umlauf am Rand — der Rand ist spuerbar', async ({ page }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const halt = await tabBis(page, AUF_GLIED(ZAUBER));
        expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();

        // Erst ans Ende (das ist der Teil, der heute nicht geht), dann
        // dreimal weiter nach rechts: der Fokus muss stehen bleiben.
        await page.keyboard.press('End');
        expect((await page.evaluate(FOKUS)).wert).toBe('2,2');
        for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
        expect(
            (await page.evaluate(FOKUS)).wert,
            'Rechts am letzten Glied darf NICHT auf das erste umlaufen — ein ' +
                'stiller Umlauf macht "bin ich am Ende?" unbeantwortbar'
        ).toBe('2,2');

        await page.keyboard.press('Home');
        for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
        expect(
            (await page.evaluate(FOKUS)).wert,
            'Links am ersten Glied darf NICHT auf das letzte umlaufen'
        ).toBe('1,0');
    });

    test('(6) das zuletzt besuchte Glied behaelt den Halt', async ({ page }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const halt = await tabBis(page, AUF_GLIED(ZAUBER));
        expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();

        // Drei Schritte nach rechts, dann die Gruppe verlassen …
        for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
        const besucht = await page.evaluate(FOKUS);
        expect(besucht.wert).toBe('1,3');

        const stand = await page.evaluate(GRUPPEN_LESEN(ZAUBER));
        expect(
            stand[0].haltIndex,
            'Der Halt muss dem Fokus folgen — sonst steigt Tab wieder am ersten Glied ein'
        ).toBe(3);

        // … und per Shift+Tab zurueckkommen: wieder beim dritten Glied.
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        const wieder = await page.evaluate(FOKUS);
        expect(
            wieder.wert,
            'Shift+Tab muss dort wieder einsteigen, wo man war (gemerkter Halt)'
        ).toBe('1,3');
    });
});

// ============================================================
// (7)-(8) ROLLE UND TASTEN PASSEN ZUSAMMEN
// ============================================================

test.describe('E-2 — Rolle und Tastenverhalten', () => {
    test('(7) toolbar mit gemessener Ausrichtung, Glieder bleiben Knoepfe, KEINE Auswahlbehauptung', async ({
        page
    }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6, 1);

        for (const [name, g] of [
            ['Zauberplaetze', ZAUBER],
            ['Todeswuerfe', TOD]
        ]) {
            const gruppen = await page.evaluate(GRUPPEN_LESEN(g));
            expect(gruppen.length, `${name}: keine Gruppe im Dokument`).toBeGreaterThan(0);

            for (const [i, x] of gruppen.entries()) {
                expect(x.rolleBehaelter, `${name} Gruppe ${i}: Rolle des Behaelters`).toBe(
                    'toolbar'
                );
                expect(
                    x.ausrichtung,
                    `${name} Gruppe ${i}: aria-orientation muss die gemessene Achse tragen ` +
                        '(dy=0 auf allen vier Breiten, also waagerecht)'
                ).toBe(g.achse);
                expect(
                    (x.beschriftung || '').length,
                    `${name} Gruppe ${i}: eine toolbar ohne Namen ist fuer das ` +
                        'Vorleseprogramm eine leere Schachtel'
                ).toBeGreaterThan(2);
                expect(x.rollenGlieder, `${name} Gruppe ${i}: Rollen der Glieder`).toEqual([
                    'button'
                ]);
                // Die beiden Luegen, die eine `listbox` hier erzaehlen wuerde.
                expect(
                    x.aktivesKind,
                    `${name} Gruppe ${i}: aria-activedescendant gehoert nicht hierher — ` +
                        'der Fokus WANDERT wirklich, er wird nicht nur behauptet'
                ).toBeNull();
                expect(
                    x.auswahlBehauptet,
                    `${name} Gruppe ${i}: aria-selected behauptet eine Auswahl; die ` +
                        'Punkte sind unabhaengige Schalter'
                ).toBe(0);
            }
        }
    });

    test('(8) bedient werden nur Links/Rechts/Pos1/Ende — Oben/Unten bleiben beim Browser', async ({
        page
    }) => {
        test.setTimeout(90_000);
        await ansichtOeffnen(page, 'initiative', 6);

        const halt = await tabBis(page, AUF_GLIED(ZAUBER));
        expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();

        await page.evaluate(TASTEN_MITSCHRIFT);
        for (const t of ['ArrowRight', 'ArrowLeft', 'Home', 'End', 'ArrowDown', 'ArrowUp']) {
            await page.keyboard.press(t);
        }
        const mitschrift = await page.evaluate(() => window.__tasten);
        const nach = t => mitschrift.filter(m => m.taste === t).map(m => m.verhindert);

        for (const t of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
            expect(nach(t), `${t} muss in der Gruppe bedient werden (preventDefault)`).toEqual([
                true
            ]);
        }
        for (const t of ['ArrowDown', 'ArrowUp']) {
            expect(
                nach(t),
                `${t} wird auf einer WAAGERECHTEN Leiste nicht bedient und darf ` +
                    'dem Browser nicht weggenommen werden (Seitenlauf)'
            ).toEqual([false]);
        }
    });
});

// ============================================================
// (9) DIE ZWEITE GRUPPENART: TODESWUERFE
// ============================================================

test('(9) Todeswuerfe — ein Halt je Vorzeichen-Reihe, Pfeiltasten darin', async ({ page }) => {
    test.setTimeout(90_000);
    await ansichtOeffnen(page, 'initiative', 6, 1);

    const gruppen = await page.evaluate(GRUPPEN_LESEN(TOD));
    expect(gruppen.length, 'Keine Todeswurf-Gruppe — Seed braucht einen Spieler auf 0 TP').toBe(2);
    expect(
        gruppen.map(x => `${x.glieder}/${x.halte}`),
        'Je Vorzeichen drei Punkte und genau ein Halt'
    ).toEqual(['3/1', '3/1']);

    const halt = await tabBis(page, AUF_GLIED(TOD));
    expect(halt, 'Kein Todespunkt ertabuliert').not.toBeNull();

    const start = await page.evaluate(FOKUS);
    await page.keyboard.press('ArrowRight');
    const zweiter = await page.evaluate(FOKUS);
    expect(
        [start.index, zweiter.index],
        `Rechts muss innerhalb der Vorzeichen-Reihe wandern (${start.typ})`
    ).toEqual(['0', '1']);
    expect(zweiter.typ, 'Rechts darf die Vorzeichen-Grenze NICHT ueberschreiten').toBe(start.typ);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const amRand = await page.evaluate(FOKUS);
    expect(
        [amRand.index, amRand.typ],
        'Am letzten Punkt der Reihe bleibt der Fokus stehen — kein Umlauf, ' +
            'kein Uebertritt in die Gegenseite'
    ).toEqual(['2', start.typ]);
});

// ============================================================
// (10) JEDES GLIED BLEIBT MIT DER TASTATUR ERREICHBAR
// ============================================================
//
// DAS IST DIE GEGENRECHNUNG ZU E-2. Ein Halt je Gruppe heisst NICHT, dass
// sechs von sieben Punkten unbedienbar werden — sie wechseln nur das
// Zugangsmittel. Diese Zusicherung ist die Bedingung, unter der die
// Haltreduktion ueberhaupt erlaubt ist.

test('(10) alle sieben Glieder einer Gruppe bekommen den Fokus — Tabulator hinein, Pfeile darin', async ({
    page
}) => {
    test.setTimeout(90_000);
    await ansichtOeffnen(page, 'initiative', 6);

    await page.evaluate(() => {
        window.__erreicht = [];
        document.addEventListener(
            'focusin',
            ev => {
                const el = /** @type {Element} */ (ev.target);
                if (el && el.matches && el.matches('.init-slot-box')) {
                    window.__erreicht.push(el.getAttribute('data-value'));
                }
            },
            true
        );
    });

    const halt = await tabBis(page, AUF_GLIED(ZAUBER));
    expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();
    await page.keyboard.press('Home');
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');

    const erreicht = new Set(await page.evaluate(() => window.__erreicht));
    const soll = ['1,0', '1,1', '1,2', '1,3', '2,0', '2,1', '2,2'];
    const fehlt = soll.filter(s => !erreicht.has(s));
    expect(
        fehlt,
        'Unerreichbare Glieder trotz Pfeiltastenfahrt:\n    ' +
            fehlt.join('  ') +
            '\n  erreicht: ' +
            [...erreicht].join('  ')
    ).toEqual([]);
});

// ============================================================
// (11) REGRESSIONSWACHE: DIE LEERTASTE BEDIENT WEITER DAS GLIED
// ============================================================
//
// Heute GRUEN und muss gruen bleiben. Der `keydown`-Zweig in
// `ui/event-delegation.js` (T-B) schickt einen synthetischen Klick auf das
// fokussierte Element. Die Gruppenmechanik baut dort nichts nach und darf
// ihm nichts wegnehmen.

test('(11) Leertaste auf einem Glied loest GENAU EINEN Klick aus und schaltet den Platz', async ({
    page
}) => {
    test.setTimeout(90_000);
    await ansichtOeffnen(page, 'initiative', 6);

    const halt = await tabBis(page, AUF_GLIED(ZAUBER));
    expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();

    const vorher = await page.evaluate(() => {
        window.__klicks = 0;
        document.addEventListener('click', () => window.__klicks++, true);
        return {
            verfuegbar: document.querySelectorAll('.init-slot-box.available').length,
            scrollY: window.scrollY
        };
    });

    await page.keyboard.press(' ');
    await page.waitForTimeout(600);

    const nachher = await page.evaluate(() => ({
        klicks: window.__klicks,
        verfuegbar: document.querySelectorAll('.init-slot-box.available').length,
        scrollY: window.scrollY
    }));

    expect(nachher.klicks, 'Genau ein Klick — nicht null, nicht zwei').toBe(1);
    expect(
        nachher.verfuegbar,
        `Verfuegbare Plaetze vorher ${vorher.verfuegbar}, nachher ${nachher.verfuegbar} — ` +
            'die Leertaste hat nichts geschaltet'
    ).not.toBe(vorher.verfuegbar);
    expect(nachher.scrollY, 'Die Leertaste darf die Seite nicht wegrollen').toBe(vorher.scrollY);
});

// ============================================================
// (12)-(13) DAS NEUZEICHNEN
// ============================================================
//
// `toggleInitSlot()` (features/initiative.js:227) ruft `renderInit()` und
// ersetzt damit die ganze Kampfliste. Gemessen am Ist-Zustand: nach der
// Leertaste ist der fokussierte Knoten NICHT mehr im Baum
// (`document.contains(...) === false`) und `activeElement` ist `BODY`.
// Ohne die beiden Faelle hier bricht die Pfeiltastenfahrt bei der ersten
// Bedienung ab — die Gruppe waere eine Mechanik fuer genau einen Anschlag.

test('(12) nach einem Neuzeichnen steht der Halt wieder am gemerkten Glied', async ({ page }) => {
    test.setTimeout(90_000);
    await ansichtOeffnen(page, 'initiative', 6);

    const halt = await tabBis(page, AUF_GLIED(ZAUBER));
    expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    expect((await page.evaluate(FOKUS)).wert).toBe('2,0');

    await page.evaluate(() => window.renderInit());
    await page.waitForTimeout(600);

    const stand = await page.evaluate(GRUPPEN_LESEN(ZAUBER));
    expect(stand.length, 'Nach renderInit() keine Gruppe mehr').toBe(6);
    const schlecht = stand.map((x, i) => ({ ...x, i })).filter(x => x.halte !== 1);
    expect(
        schlecht.length,
        'Nach renderInit() stimmt die Haltzahl nicht:\n' +
            schlecht.map(x => `    Gruppe ${x.i}: ${x.halte} Halte`).join('\n')
    ).toBe(0);
    expect(
        stand[0].haltIndex,
        'Der gemerkte Halt (Glied 4) muss das Neuzeichnen ueberleben — sonst ' +
            'faellt der Spielleiter nach jeder Bedienung an den Anfang der Reihe zurueck'
    ).toBe(4);
});

test('(13) nach der Bedienung mit der Leertaste liegt der Fokus wieder auf einem Glied', async ({
    page
}) => {
    test.setTimeout(90_000);
    await ansichtOeffnen(page, 'initiative', 6);

    const halt = await tabBis(page, AUF_GLIED(ZAUBER));
    expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();
    await page.keyboard.press('ArrowRight');
    const vorher = await page.evaluate(FOKUS);
    expect(vorher.wert).toBe('1,1');

    await page.keyboard.press(' ');
    await page.waitForTimeout(700);

    const nachher = await page.evaluate(FOKUS);
    expect(
        nachher.sig,
        `Ist-Zustand war: Fokus faellt auf BODY (Knoten geloescht). Jetzt: ${JSON.stringify(nachher)}`
    ).toContain('init-slot-box');
    expect(nachher.wert, 'Und zwar auf DEMSELBEN Glied, nicht irgendeinem').toBe('1,1');

    // Und die Fahrt geht weiter — das ist der eigentliche Punkt.
    await page.keyboard.press('ArrowRight');
    expect((await page.evaluate(FOKUS)).wert, 'Nach der Bedienung muss Rechts weiterlaufen').toBe(
        '1,2'
    );
});

// ============================================================
// (17) DAS HALTGEDAECHTNIS FUER SICH ALLEIN
// ============================================================
//
// DIESER FALL IST EINE LUECKE, DIE DIE MUTATIONSPROBE GEFUNDEN HAT, kein
// geplanter Fall. Die Mutation "das Haltgedaechtnis wird ignoriert"
// (`let ziel = this._stand.has(...) ? … : 0` -> `let ziel = 0`) liess alle
// sechzehn Faelle GRUEN. Grund: Fall (12) wird in Wahrheit von der
// Fokusrueckgabe gruen gehalten — sie setzt den Fokus auf das gemerkte
// Glied, und der `focusin`-Lauscher zieht den Halt hinterher. Das
// Gedaechtnis war damit von keiner einzigen Zusicherung gedeckt.
//
// Hier ist es allein auf dem Posten: der Fokus VERLAESST die Gruppe, bevor
// neu gezeichnet wird. Damit ist der Anspruch auf Rueckkehr verfallen
// (der `focusin`-Lauscher loescht ihn beim Verlassen), und der Halt kann
// nur noch aus dem Gedaechtnis kommen. Genau das ist die Lage, auf die
// sich die Zusage beruft, `Tab` steige wieder dort ein, wo man war.

test('(17) der Halt ueberlebt ein Neuzeichnen AUCH dann, wenn der Fokus die Gruppe verlassen hat', async ({
    page
}) => {
    test.setTimeout(90_000);
    await ansichtOeffnen(page, 'initiative', 6);

    const halt = await tabBis(page, AUF_GLIED(ZAUBER));
    expect(halt, 'Kein Zauberplatz-Punkt ertabuliert').not.toBeNull();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    expect((await page.evaluate(FOKUS)).wert).toBe('2,0');

    // Die Gruppe mit dem Tabulator verlassen — ab hier gibt es keinen
    // Anspruch auf Rueckkehr mehr.
    await page.keyboard.press('Tab');
    const draussen = await page.evaluate(FOKUS);
    expect(draussen.sig, 'Der Tabulator hat die Gruppe nicht verlassen').not.toContain(
        'init-slot-box'
    );

    await page.evaluate(() => window.renderInit());
    await page.waitForTimeout(600);

    const nachFokus = await page.evaluate(FOKUS);
    const stand = await page.evaluate(GRUPPEN_LESEN(ZAUBER));
    expect(
        stand[0].haltIndex,
        'Ohne Fokus in der Gruppe kann der Halt nur aus dem Gedaechtnis kommen. ' +
            `Fokus nach dem Neuzeichnen: ${JSON.stringify(nachFokus)}`
    ).toBe(4);
    expect(
        nachFokus.sig,
        'Und die Fokusrueckgabe darf hier gerade NICHT greifen — der ' +
            'Spielleiter war nicht mehr in der Gruppe'
    ).not.toContain('init-slot-box');
});

// ============================================================
// (14) REGRESSIONSWACHE: AUSSERHALB EINER GRUPPE AENDERT SICH NICHTS
// ============================================================

test('(14) ausserhalb einer Gruppe bleiben die Pfeiltasten unberuehrt', async ({ page }) => {
    test.setTimeout(90_000);
    await ansichtOeffnen(page, 'initiative', 6);

    // Erster Tabulatorhalt der Seite — mit Sicherheit kein Gruppenglied.
    await page.keyboard.press('Tab');
    const vorher = await page.evaluate(FOKUS);
    expect(vorher.sig, 'Startpunkt liegt unerwartet in einer Gruppe').not.toContain(
        'init-slot-box'
    );

    await page.evaluate(TASTEN_MITSCHRIFT);
    for (const t of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
        await page.keyboard.press(t);
    }
    const mitschrift = await page.evaluate(() => window.__tasten);
    const verhindert = mitschrift.filter(m => m.verhindert).map(m => m.taste);
    expect(
        verhindert,
        'Keine dieser Tasten darf ausserhalb einer Gruppe abgefangen werden — ' +
            'sie gehoeren dem Browser und den vorhandenen Kuerzeln'
    ).toEqual([]);
});

// ============================================================
// (15) DIE INVARIANTE NACH DEM WECHSEL IN JEDE KAMPFANSICHT
// ============================================================
//
// WAS HIER GEZAEHLT WIRD, und das ist ausdruecklich NICHT "die Gruppen der
// jeweiligen Ansicht": die 24 Ansichten liegen alle dauerhaft im Dokument
// und werden nur ueber `.active` ein- und ausgeblendet. Die sechs
// Zauberplatz-Gruppen der Initiative stehen also auch dann im Dokument,
// wenn das Armaturenbrett zu sehen ist (gemessen: `.init-spell-slots` 6
// Treffer in allen fuenf Ansichten, sichtbar nur in der Initiative).
//
// Der Fall urteilt darum ueber die Invariante NACH JEDEM
// Ansichtswechsel — und das ist die Zahl, die zaehlt: `switchView()` loest
// einen Renderlauf aus, der `innerHTML` ersetzt. Eine Gruppenmechanik, die
// nach einem Wechsel in eine Ansicht OHNE Gruppen ihre Halte verliert,
// faellt hier auf. Dass die Pruefung auch unsichtbare Gruppen zaehlt, ist
// dieselbe Entscheidung wie in der Kehrschleife: ein Element in einer
// ausgeblendeten Ansicht bekommt sein Attribut und ist beim Einblenden
// sofort richtig — mit Sichtbarkeitstest blieben alle ausgeblendeten
// Gruppen ungeregelt.

test('(15) nach dem Wechsel in jede der fuenf Kampfansichten traegt jede Gruppe im Dokument genau einen Halt', async ({
    page
}) => {
    test.setTimeout(180_000);
    for (const ansicht of ['dashboard', 'initiative', 'party', 'dice', 'dmscreen']) {
        await ansichtOeffnen(page, ansicht, 6, 1);
        for (const g of [ZAUBER, TOD]) {
            const gruppen = await page.evaluate(GRUPPEN_LESEN(g));
            const schlecht = gruppen.map((x, i) => ({ ...x, i })).filter(x => x.halte !== 1);
            expect(
                schlecht.length,
                `${ansicht}/${g.behaelter}: ${schlecht.length} von ${gruppen.length} Gruppen ` +
                    'mit falscher Haltzahl'
            ).toBe(0);
        }
    }
});

// ============================================================
// (16) DIE FLUT
// ============================================================

test('(16) die Anschlaege bis zur Schnell-Referenz sinken deutlich', async ({ page }) => {
    test.setTimeout(180_000);
    await ansichtOeffnen(page, 'initiative', 6);

    const vorab = await page.evaluate(() => ({
        punkte: document.querySelectorAll('.init-slot-box').length,
        halte: document.querySelectorAll('.init-slot-box[tabindex="0"]').length
    }));
    expect(vorab.punkte, 'Seed liefert keine Punkte').toBe(42);

    const anschlaege = await tabBis(
        page,
        `(() => { const el = document.activeElement;
          return !!(el && el.matches && el.matches('.qref-fab')); })()`,
        400
    );
    expect(
        anschlaege,
        'Die Schnell-Referenz wurde in 400 Anschlaegen nicht erreicht'
    ).not.toBeNull();
    expect(
        anschlaege,
        `Gemessener Ist-Zustand vor E-2: 142 Anschlaege bei 42 Punkten mit je ` +
            `eigenem Halt. Jetzt: ${anschlaege} Anschlaege bei ${vorab.punkte} Punkten ` +
            `und ${vorab.halte} Halten.`
    ).toBeLessThanOrEqual(120);
});

// ============================================================
// (18) DER ZUSTAND DER GLIEDER — WAS DAS VORLESEPROGRAMM HOERT
// ============================================================
//
// WAS DIESER FALL BEWACHT (TASV/E-2, Runde 3, Befund 5). Die Rolle allein
// sagt, dass eine Stelle bedienbar ist — nicht, in welchem Zustand sie
// steht. Gemessen am ausgelieferten Stand von Runde 2: sechs
// NSC-Filtermarken, alle `role="button"`, keine mit `aria-pressed`;
// zwanzig Listenzeilen, eine davon ausgewaehlt, keine mit `aria-current`;
// zwanzig Auftrags- und zwanzig Ladenkoepfe, auf- oder zugeklappt, keine
// mit `aria-expanded`. Die ganze Auskunft steckte in der CSS-Klasse
// (`active`, `selected`, `expanded`) und damit im Auge.
//
// Ein Spielleiter mit Vorleseprogramm betritt die Leiste "NSC-Filter,
// Werkzeugleiste" und hoert sechs Schaltflaechen "Alle", "Ort 1" … —
// welche gerade filtert, sagt ihm niemand.
//
// DASS ES ANDERS GEHT, zeigte dieselbe Umsetzung an den Party-Punkten:
// dort traegt jedes Glied ein `title` ("Grad 1 Slot (verfuegbar)"), der
// Zustand steht also im Namen. Diese Reihe ist darum unten AUSDRUECKLICH
// als Gegenbeispiel aufgefuehrt und bekommt KEIN zusaetzliches Attribut.
//
// DREI ATTRIBUTE, EINS JE BEDEUTUNG, und `aria-selected` ist keines davon:
// es ist an `role="button"` nicht erlaubt, und Fall (7) oben prueft
// ausdruecklich, dass keine Auswahl behauptet wird.

/** Liest Zustandsattribute einer Familie. */
const ZUSTAND_LESEN = sel => `(() => {
    const sichtbar = el => {
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true,
            visibilityProperty: true, contentVisibilityAuto: true })) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const g = [...document.querySelectorAll('${sel}')].filter(sichtbar);
    const mit = a => g.filter(x => x.hasAttribute(a)).length;
    return {
        glieder: g.length,
        pressed: mit('aria-pressed'),
        current: mit('aria-current'),
        expanded: mit('aria-expanded'),
        selected: mit('aria-selected'),
        title: mit('title'),
        gedruecktWahr: g.filter(x => x.getAttribute('aria-pressed') === 'true').length,
        aktuellWahr: g.filter(x => x.getAttribute('aria-current') === 'true').length,
        aufWahr: g.filter(x => x.getAttribute('aria-expanded') === 'true').length
    };
})()`;

/**
 * Je Familie: wo sie wohnt, welches Attribut den Zustand traegt, wie viele
 * Glieder gerade "an" sind — und ob das Attribut an JEDEM Glied stehen
 * muss oder nur am aktuellen.
 *
 * `nurWahr` IST KEINE ABSCHWAECHUNG, SONDERN DIE REGEL DES ATTRIBUTS, und
 * sie ist eine Korrektur an meiner ersten Fassung: die forderte
 * `aria-current` an allen zwanzig Zeilen und war damit rot, obwohl die
 * Umsetzung richtig war. `aria-pressed` und `aria-expanded` sind
 * ZWEIWERTIG — "nicht gedrueckt" ist ein Zustand und gehoert hingeschrieben
 * (`"false"`). `aria-current` ist EINWERTIG: es gibt kein
 * `aria-current="false"`, das etwas sagt, und manche Vorleseprogramme lesen
 * schon die bloße Anwesenheit der Marke als "hier bist du". Nicht gewaehlt
 * heisst darum: Attribut weg. Fall (18e) ist die Ratsche darauf.
 */
const ZUSTANDSFAMILIEN = [
    {
        ansicht: 'npcs',
        sel: '[data-action="set-npc-filter"]',
        attribut: 'pressed',
        wahr: 'gedruecktWahr',
        anzWahr: 1
    },
    {
        ansicht: 'npcs',
        sel: '[data-action="select-npc"]',
        attribut: 'current',
        nurWahr: true,
        wahr: 'aktuellWahr',
        anzWahr: 1
    },
    {
        ansicht: 'loot',
        sel: '[data-action="set-loot-filter"]',
        attribut: 'pressed',
        wahr: 'gedruecktWahr',
        anzWahr: 1
    },
    {
        ansicht: 'quests',
        sel: '[data-action="toggle-quest"]',
        attribut: 'expanded',
        wahr: 'aufWahr',
        anzWahr: 0
    },
    {
        ansicht: 'quests',
        sel: '[data-action="toggle-quest-status-stop"]',
        attribut: 'pressed',
        wahr: 'gedruecktWahr',
        anzWahr: 0
    },
    {
        ansicht: 'shops',
        sel: '[data-action="toggle-shop"]',
        attribut: 'expanded',
        wahr: 'aufWahr',
        anzWahr: 0
    }
];

test.describe('E-2 — der Zustand steht im ARIA, nicht nur in der Klasse', () => {
    for (const f of ZUSTANDSFAMILIEN) {
        const wo = f.nurWahr ? 'am aktuellen Glied' : 'an JEDEM Glied';
        test(`(18) ${f.ansicht}: ${f.sel} traegt aria-${f.attribut} ${wo}`, async ({ page }) => {
            test.setTimeout(120_000);
            await ansichtOeffnen(page, f.ansicht, 20);
            const z = await page.evaluate(ZUSTAND_LESEN(f.sel));
            expect(z.glieder, `${f.sel}: die Saat erzeugt keine Glieder`).toBeGreaterThan(1);
            const soll = f.nurWahr ? f.anzWahr : z.glieder;
            expect(
                z[f.attribut],
                `${f.sel}: ${z[f.attribut]} von ${z.glieder} Gliedern tragen ` +
                    `aria-${f.attribut}, erwartet ${soll}. Ohne das Attribut steckt der ` +
                    'Zustand allein in der CSS-Klasse und ist fuer ein Vorleseprogramm ' +
                    `nicht da. Gemessen: ${JSON.stringify(z)}`
            ).toBe(soll);
            expect(
                z[f.wahr],
                `${f.sel}: ${z[f.wahr]} Glieder stehen auf "wahr", erwartet ${f.anzWahr}`
            ).toBe(f.anzWahr);
            // Die Luege, die hier nicht stehen darf — dieselbe Schranke wie
            // in Fall (7) fuer die Kampfgruppen.
            expect(z.selected, `${f.sel}: aria-selected behauptet eine Auswahl`).toBe(0);
        });
    }

    test('(18e) die ausgewaehlte Zeile traegt aria-current="true", die uebrigen GAR NICHTS', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'npcs', 20);
        // `aria-current="false"` waere ein eigener Fehler: ein
        // Vorleseprogramm liest die bloße Anwesenheit mancher ARIA-Marken
        // als Zustand. Nicht gewaehlt heisst: Attribut weg.
        const vor = await page.evaluate(ZUSTAND_LESEN('[data-action="select-npc"]'));
        expect(vor.current, 'mehr als eine Zeile traegt aria-current').toBe(1);

        await page.click('.npc-item[data-id="5"]');
        await page.waitForTimeout(600);
        const nach = await page.evaluate(() => {
            const g = [...document.querySelectorAll('[data-action="select-npc"]')];
            return {
                mitAttribut: g.filter(x => x.hasAttribute('aria-current')).length,
                wahrBei: g
                    .filter(x => x.getAttribute('aria-current') === 'true')
                    .map(x => x.getAttribute('data-id'))
            };
        });
        expect(
            nach,
            'Nach dem Klick muss genau die angeklickte Zeile aria-current="true" tragen'
        ).toEqual({ mitAttribut: 1, wahrBei: ['5'] });
    });

    test('(18f) die Party-Punkte tragen ihren Zustand im NAMEN und brauchen kein Attribut', async ({
        page
    }) => {
        test.setTimeout(120_000);
        await ansichtOeffnen(page, 'party', 6);
        const z = await page.evaluate(ZUSTAND_LESEN('.slot-pip'));
        expect(z.glieder, 'Die Saat erzeugt keine Zauberplatz-Punkte').toBe(42);
        // Das Gegenbeispiel aus dem Haus: hier steht der Zustand schon im
        // `title`, und ein `aria-pressed` daneben wuerde dasselbe zweimal
        // sagen. Faellt das `title` eines Tages weg, soll dieser Fall rot
        // werden und nicht die Reihe stumm.
        expect(
            z.title,
            'Jeder Punkt traegt ein title mit dem Zustand ("Grad 1 Slot (verfuegbar)")'
        ).toBe(z.glieder);
    });
});

// ============================================================
// (19) DIE NAMEN EINER AUFTRAGSZEILE
// ============================================================
//
// WAS DIESER FALL BEWACHT (TASV/E-2, Runde 3, Befund 6). In der
// Auftragsliste stehen 41 Halte: EINER fuer die zwanzig Zeilen (die
// Gruppe), zwanzig native Pinnknoepfe und zwanzig Markenleisten. Gemessen
// am Zugaenglichkeitsbaum von Chromium (Accessibility.getFullAXTree,
// Teilbaum #quests-list) hiessen sie vorher:
//
//   20 x  button  :: "⋮⋮ 📌 Auftrag Quest Auftragsstatus"
//   20 x  button  :: "📌"
//   20 x  toolbar :: "Auftragsstatus"
//   20 x  button  :: "○ Done"   /   20 x  button :: "○ Loot"
//
// Zwei Fehler in einem Bild. Erstens: ab dem 27. Halt hoert der
// Spielleiter nur noch "📌" und "○ Done" — welchem Auftrag sie gehoeren,
// sagt nichts, weil der einzige Halt mit dem Auftragsnamen gerade der
// weggruppierte ist. Wer Auftrag 17 auf erledigt setzen will, muss Halte
// zaehlen. Zweitens: in den Namen der ZEILE leckt das aria-label der
// Markenleiste darin — "Auftragsstatus" ist ein Wort, das auf dem Schirm
// nirgends steht.
//
// DER FALL URTEILT UEBER DIE ANSAGE, NICHT UEBER DIE FOKUSSIERBARKEIT, und
// das ist in diesem Strang neu: alle uebrigen Faelle fragen, WO der Fokus
// landet. Dieser fragt, was dort gesagt wird — und darum liest er den
// echten Baum des Browsers und nicht die Attribute.

/**
 * Die Namen aller Knoepfe und Leisten des Zugaenglichkeitsbaums, gezaehlt.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{rolle: string, name: string, anzahl: number}[]>}
 */
async function axNamen(page) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    await cdp.detach();
    const zaehl = new Map();
    for (const n of nodes) {
        if (n.ignored) continue;
        const rolle = n.role && n.role.value;
        if (rolle !== 'button' && rolle !== 'toolbar') continue;
        const name = ((n.name && n.name.value) || '').replace(/\s+/g, ' ').trim();
        const k = rolle + '\u0000' + name;
        zaehl.set(k, (zaehl.get(k) || 0) + 1);
    }
    return [...zaehl.entries()]
        .map(([k, anzahl]) => ({
            rolle: k.split('\u0000')[0],
            name: k.split('\u0000')[1],
            anzahl
        }))
        .sort((a, b) => b.anzahl - a.anzahl);
}

test('(19) jede Stelle einer Auftragszeile nennt ihren Auftrag', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(BREIT);
    // UNTERSCHEIDBARE TITEL — die Saat oben nennt jeden Auftrag "Auftrag",
    // und dann saehe "Auftrag: Auftrag" wie ein Erfolg aus, obwohl der
    // Titel fehlte. Hier traegt jeder Auftrag seine Nummer.
    const saat = kampagne(6);
    saat.quests = saat.quests.map((q, i) => ({ ...q, title: 'Rattenplage ' + (i + 1) }));
    await page.addInitScript(seed => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(seed));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, saat);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.switchView('quests'));
    await page.waitForTimeout(700);

    const namen = await axNamen(page);
    const titel = 'Rattenplage 3';
    const mitTitel = namen.filter(x => x.name.includes(titel));
    const bericht =
        'Namen im Zugaenglichkeitsbaum (Rolle / Anzahl / Name):\n' +
        namen
            .slice(0, 12)
            .map(
                x =>
                    '    ' +
                    x.rolle.padEnd(8) +
                    String(x.anzahl).padStart(3) +
                    ' x  "' +
                    x.name +
                    '"'
            )
            .join('\n');

    // DREI STELLEN je Zeile muessen den Titel tragen: die Zeile selbst,
    // der Pinnknopf und die Markenleiste.
    expect(
        mitTitel.map(x => x.rolle).sort(),
        'Nur ' +
            mitTitel.length +
            ' Stelle(n) nennen "' +
            titel +
            '" — erwartet sind drei ' +
            '(Zeile, Pinnknopf, Markenleiste).\n' +
            bericht
    ).toEqual(['button', 'button', 'toolbar']);

    // UND DIE ZEILE DARF DIE LEISTE NICHT MITSPRECHEN. "Auftragsstatus"
    // ist die Beschriftung der Leiste IN der Zeile; stand sie im Namen der
    // Zeile, war es ein Leck aus dem Inhalt.
    const zeile = mitTitel.find(x => x.rolle === 'button' && x.name.startsWith('Auftrag:'));
    expect(zeile, 'Keine Zeile mit dem Namen "Auftrag: ' + titel + '".\n' + bericht).toBeTruthy();
    expect(
        zeile.name,
        'Der Name der Zeile enthaelt die Beschriftung der Leiste darin — ein Leck ' +
            'aus dem Inhalt.\n' +
            bericht
    ).toBe('Auftrag: ' + titel);

    // KEIN NAMENLOSES PINNSYMBOL MEHR. Der Pinnknopf traegt den Titel;
    // sein Inhalt allein waere wieder der alte Zustand.
    expect(
        namen.filter(x => x.name === '📌').length,
        'Pinnknoepfe ohne Auftragsnamen gefunden.\n' + bericht
    ).toBe(0);
});

// ============================================================
// (20)-(22) DREI KLEINE BEFUNDE DER MECHANIK
// ============================================================

test('(20) ein leer gefilterter Behaelter behaelt keine Werkzeugleiste', async ({ page }) => {
    test.setTimeout(120_000);
    // Befund 7: die Schranke `if (!glieder.length) continue` greift nur
    // VOR dem ersten Fuellen. Wer erst zwanzig NSC hat und dann nach
    // "zzzzz" sucht, behaelt Rolle und Beschriftung bei NULL Gliedern —
    // das Vorleseprogramm meldet weiter eine Werkzeugleiste
    // "Nichtspielercharaktere" ohne ein einziges Bedienelement.
    await ansichtOeffnen(page, 'npcs', 20);
    const lies = () =>
        page.evaluate(() => {
            const c = document.getElementById('npc-list');
            return {
                rolle: c.getAttribute('role'),
                achse: c.getAttribute('aria-orientation'),
                label: c.getAttribute('aria-label'),
                glieder: c.querySelectorAll('[data-action="select-npc"]').length
            };
        });
    const vor = await lies();
    expect(vor, 'Vorbedingung: die gefuellte Liste IST eine Leiste').toEqual({
        rolle: 'toolbar',
        achse: 'vertical',
        label: 'Nichtspielercharaktere',
        glieder: 20
    });

    await page.fill('#npc-search', 'zzzzz');
    await page.waitForTimeout(900);
    const leer = await lies();
    expect(leer, 'Nach einer Suche ohne Treffer darf keine Werkzeugleiste stehenbleiben').toEqual({
        rolle: null,
        achse: null,
        label: null,
        glieder: 0
    });

    // UND SIE MUSS WIEDERKOMMEN. Ein Aufraeumen, das die Leiste dauerhaft
    // abmeldet, waere der schlechtere Fehler.
    await page.fill('#npc-search', '');
    await page.waitForTimeout(900);
    expect(await lies(), 'Nach dem Zuruecksetzen der Suche fehlt die Leiste').toEqual(vor);
});

test('(21) nach einem Datentausch bleibt der Fokus in der Liste', async ({ page }) => {
    test.setTimeout(180_000);
    // Befund 8: der Gruppenschluessel hing an der `data-id` des ERSTEN
    // Glieds. Wer `D.npcs` ersetzt (Import, Kampagnenwechsel), aendert
    // damit den Schluessel — `_holeFokusZurueck()` fand keine Gruppe und
    // der Fokus lag danach auf BODY. Gemessen: Pfeiltasten taten nichts,
    // und die rund 28 Anschlaege von oben waren neu zu zahlen.
    await ansichtOeffnen(page, 'npcs', 20);
    const drin = await tabBis(page, AUF_GLIED({ glied: '[data-action="select-npc"]' }), 120);
    expect(drin, 'Kein Tabulatorhalt in der NSC-Liste gefunden').not.toBeNull();
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown');
    const vor = await page.evaluate(FOKUS);
    expect(vor.aktion, 'Die Pfeiltasten haben die Liste verlassen').toBe('select-npc');

    await page.evaluate(() => {
        window.D.npcs = Array.from({ length: 20 }, (_, i) => ({
            id: 100 + i,
            name: 'Neu ' + (i + 1),
            role: 'Merchant',
            race: 'Mensch'
        }));
        window.renderNPCList();
    });
    await page.waitForTimeout(700);

    const nach = await page.evaluate(FOKUS);
    expect(
        nach.aktion,
        'Vor dem Tausch: ' +
            JSON.stringify(vor) +
            ' — danach: ' +
            JSON.stringify(nach) +
            '. Faellt der Fokus auf BODY, haengt der Gruppenschluessel an den DATEN der ' +
            'ersten Zeile statt am Behaelter (ui/keyboard-group.js, _schluessel()).'
    ).toBe('select-npc');
});

test('(22) das Haltgedaechtnis waechst beim Rollen der virtuellen Liste nicht', async ({
    page
}) => {
    test.setTimeout(180_000);
    // Befund 9/12: `_schluessel()` nahm die `data-id` des ersten
    // GEZEICHNETEN Glieds. Im virtuellen Fenster wechselt die mit jeder
    // Rollstellung — gemessen wuchs `statistik().gemerkt` im Bestiarium
    // von 55 auf 131 Eintraege in 40 Radstufen, und der Halt fand seine
    // Gruppe nach dem Rollen nicht mehr wieder.
    await ansichtOeffnen(page, 'bestiary', 20);
    const vor = await page.evaluate(() => window.KeyboardGroup.statistik());
    expect(vor.gemerkt, 'Es ist noch keine Gruppe gemerkt').toBeGreaterThan(0);

    // GEROLLT WIRD MIT DEM RAD (Messdisziplin 2) und ueber der Mitte der
    // Liste — eine geratene Koordinate rollt daneben und beweist nichts.
    const mitte = await page.evaluate(() => {
        const c = document.getElementById('bestiary-list');
        const r = c.getBoundingClientRect();
        return {
            x: r.x + r.width / 2,
            y: r.y + r.height / 2,
            rollbar: c.scrollHeight > c.clientHeight
        };
    });
    expect(
        mitte.rollbar,
        'Die Bestiarium-Liste ist nicht rollbar — der Fall prueft dann nichts'
    ).toBe(true);
    await page.mouse.move(mitte.x, mitte.y);
    for (let i = 0; i < 40; i++) {
        await page.mouse.wheel(0, 120);
        await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);

    const nach = await page.evaluate(() => window.KeyboardGroup.statistik());
    const gerollt = await page.evaluate(() => document.getElementById('bestiary-list').scrollTop);
    expect(gerollt, 'Das Rad hat die Liste nicht gerollt').toBeGreaterThan(0);
    expect(
        nach.gemerkt,
        'gemerkt ' +
            vor.gemerkt +
            ' -> ' +
            nach.gemerkt +
            ' nach 40 Radstufen (scrollTop ' +
            gerollt +
            '). Waechst die Zahl, haengt der Schluessel am ersten gezeichneten ' +
            'Glied und das Gedaechtnis ist fensterweise statt listenweise.'
    ).toBe(vor.gemerkt);
    expect(nach.offen, nach.offen + ' Gruppen tragen nach dem Rollen nicht genau einen Halt').toBe(
        0
    );
});
