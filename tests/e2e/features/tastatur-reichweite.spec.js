// @ts-check
/**
 * Die Reichweite der Vorbereitungsansichten — die zwei Anomalien und die
 * Obergrenzen (TASV, Nutzerentscheidung E-2 / Einheit 2)
 * =====================================================================
 *
 * WORUEBER DIESE DATEI URTEILT, und was sie von `tastatur-erreichbarkeit`
 * unterscheidet. Dort steht die Mengenfrage: bleibt irgendeine sichtbare
 * Stelle unerreichbar? Diese Datei urteilt ueber die zwei Befunde, die
 * eine reine Mengenzaehlung NICHT findet:
 *
 *  A) DER TABULATORKREIS VERSACKT IM VIRTUELLEN SCROLLEN. Im Bestiarium
 *     sind nicht nur die 17 nicht-nativen Zeilen des Fensters
 *     unerreichbar, sondern zusaetzlich sechs NATIVE Knoepfe
 *     (`button.bestiary-fav`) und vier globale Stellen, die in jeder
 *     anderen Ansicht erreicht werden — `div.qref-fab`,
 *     `button#floating-dice-trigger` und die zwei Knoepfe des
 *     Umzugs-Hinweises.
 *
 *     URSACHE, gemessen und nicht vermutet: `VirtualScroll.create()`
 *     haengt an `#bestiary-list` einen auf 16 ms entprellten
 *     `scroll`-Lauscher, dessen `render()` mit
 *     `visibleContainer.innerHTML = …` ALLE Zeilen des Fensters ersetzt.
 *     Tabuliert der Spielleiter auf eine Stelle unterhalb der Kante,
 *     rollt der Browser den Behaelter, der Lauscher feuert, der eben
 *     fokussierte Knoten wird geloescht, und `document.activeElement`
 *     faellt auf `BODY`. Der naechste Tabulator setzt INNERHALB der frisch
 *     gebauten Zeilen wieder auf — nicht dahinter. Was hinter der Liste
 *     steht, wird nie erreicht.
 *
 *     DREI BELEGE fuer die Ursache, alle am gebauten Buendel (b8a1a5c):
 *       - `VirtualScroll.destroy(#bestiary-list)` (Liste zeichnet beim
 *         Rollen nicht neu): 27 -> 17 unerreichbar. Alle sechs
 *         Favoritenknoepfe und alle vier globalen Stellen werden erreicht.
 *       - `threshold = 1e9` (112 Zeilen im DOM, kein virtuelles Scrollen):
 *         unerreichbar 112, und das sind AUSSCHLIESSLICH die 112
 *         nicht-nativen Zeilen. Alle 112 nativen Knoepfe erreicht.
 *       - `grep -rn "VirtualScroll.create"` findet GENAU EINEN Aufrufer im
 *         ganzen Baum (`features/bestiary/bestiary-render.js:207`). Darum
 *         ist das Bestiarium die einzige Ansicht mit diesem Befund, und
 *         darum sind die vier globalen Stellen in den fuenf Kampfansichten
 *         erreichbar.
 *
 *     ES IST KEIN MESSARTEFAKT, UND DAS VORZEICHEN IST UMGEKEHRT. Eine
 *     Messung OHNE Pause zwischen den Tastendruecken meldet 17, eine mit
 *     Pause 27 — die schnelle Messung UNTERSCHAETZT die Schuld um genau
 *     10 Stellen. Tempo-Reihe, je frischer Seitenaufbau:
 *
 *         0 ms -> 17    0 ms -> 17   30 ms -> 27   60 ms -> 27
 *       150 ms -> 27  150 ms -> 27  300 ms -> 27
 *
 *     Ab 30 ms ist das Ergebnis deterministisch. Menschentempo liegt bei
 *     250-600 ms — der Spielleiter trifft IMMER den schlechten Fall.
 *     DARUM LAEUFT JEDER FALL DIESER DATEI MIT EINER PAUSE VON 150 ms.
 *     Die Pause ist hier die Messdisziplin, nicht ein Zugestaendnis: ohne
 *     sie misst die Probe die Maschinengeschwindigkeit und nicht die Hand.
 *
 *  B) DIE TABULATORFLUT. Wer rund 430 Stellen fokussierbar macht, ohne
 *     Reihen zusammenzufassen, verschiebt das Problem nur. Gemessen im
 *     ausgelieferten Zustand, gefuellte Kampagne, 20 Eintraege je Typ,
 *     Anschlaege bis `div.qref-fab` bei 150 ms Pause:
 *
 *         Party        351 Halte  ->  NICHT in 300 Spruengen
 *         Bestiarium    46 Halte  ->  NICHT in 300 Spruengen
 *         Initiative   198 Halte  ->  196 Anschlaege
 *         Shops         90 Halte  ->   89 Anschlaege
 *         Fraktionen    67 Halte  ->   66 Anschlaege
 *
 *     Die Party ist eine KAMPFANSICHT — die Flut ist also schon im
 *     ausgelieferten Kampfpaket und nicht erst die Gefahr dieser Phase.
 *     Ihr Grund sind 140 einzeln anfahrbare `span.slot-pip` (20
 *     Charaktere x 7 Plaetze, Behaelter `.spell-slots-compact`, gemessen
 *     dx 18 / dy 0 / eine Zeile). Das Bestiarium hat eine andere Ursache:
 *     Befund A.
 *
 * WARUM DIE OBERGRENZE ALS `2 x Halte + 40` UND NICHT ALS FESTE ZAHL.
 * Eine feste Zahl waere entweder eine Fessel (jede neue Schaltflaeche
 * macht sie rot) oder nutzlos weit. `2 x Halte + 40` sagt genau das, was
 * der Befund verletzt: der Tabulatorkreis LAEUFT RUND. Wer in zwei
 * vollen Runden plus Luft nicht hinter die Liste kommt, kommt nie hinter
 * die Liste. Die Flutgrenze steht daneben, mit gemessenen Zahlen je
 * Ansicht.
 *
 * MESSDISZIPLIN — dieselben Regeln wie in `tastatur-erreichbarkeit.spec.js`
 * und `tastatur-gruppen.spec.js`:
 *   1. Fokus NUR per `page.keyboard.press`, nie `.focus()` — bei
 *      programmatischem Fokus greift `:focus-visible` nicht.
 *   2. Gerollt wird per `page.mouse.wheel`, nie `scrollTop` oder
 *      `scrollIntoView`: nur das Rad erzeugt denselben Ereignisstrom wie
 *      die Hand.
 *   3. Immer eine GEFUELLTE Kampagne. Eine leere hat in diesem Strang
 *      schon zweimal einen echten Fehler verdeckt.
 *   4. Sichtbarkeit per `checkVisibility({opacityProperty:…})` plus
 *      Rechteckpruefung.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/**
 * Pause zwischen zwei Tastendruecken. 150 ms liegt unter dem gemessenen
 * Menschentempo (250-600 ms) und oberhalb der Schwelle, ab der das
 * Ergebnis im Bestiarium deterministisch ist (30 ms).
 */
const MENSCHENTEMPO = 150;

/**
 * Gefuellte Kampagne mit `n` Eintraegen je Typ — dieselbe Saat wie in
 * `tastatur-erreichbarkeit.spec.js`, damit die Zahlen vergleichbar sind.
 * Die Kaempfer tragen ANDERE Namen als die Charaktere, damit
 * `addPartyToInit()` nichts ueberspringt.
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
            name: `Charakter ${i + 1} (E-2)`,
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 10, dex: 12, con: 14, int: 16, wis: 12, cha: 10 },
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
 * Zaehlt die sichtbaren Tabulatorhalte der aktiven Ansicht plus der
 * globalen Schale — STRUKTURELL, ohne eine Taste zu druecken. Diese Zahl
 * ist die Grundlage der Flutgrenze und des Budgets.
 */
const HALTE = `(() => {
    const SEL = 'button,a[href],input:not([type="hidden"]),select,textarea,summary,' +
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
    let n = 0;
    document.querySelectorAll(SEL).forEach(el => {
        if (el.disabled || !sichtbar(el) || !inAktiverAnsicht(el)) return;
        n++;
    });
    return n;
})()`;

/**
 * Sammelt die sichtbaren Bedienelemente und haengt einen `focusin`-
 * Mitschnitt an. Gleiche Sammlung und gleiche Sichtbarkeitsregel wie in
 * `tastatur-erreichbarkeit.spec.js`; der Datenschluessel daneben ist dort
 * begruendet (in einer virtuell gescrollten Liste taugt die
 * Objektidentitaet nicht mehr als Identitaet).
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
    const dk = el => (el.getAttribute('data-action') || '-') + '|' +
        (el.getAttribute('data-id') || '-') + '|' + (el.getAttribute('data-value') || '-');
    const beschreibe = el => ({
        sig: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
            ((typeof el.className === 'string' && el.className.trim())
                ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : ''),
        text: (el.getAttribute('aria-label') || el.getAttribute('title') ||
            el.textContent || el.value || '').replace(/\\s+/g, ' ').trim().slice(0, 40),
        tag: el.tagName.toLowerCase(),
        aktion: el.getAttribute('data-action') || null,
        ti: el.getAttribute('tabindex') || null,
        dk: dk(el),
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
    window.__erreichtK = new Set();
    window.__begangen = new Set();
    if (!window.__reichweiteLauscher) {
        window.__reichweiteLauscher = ev => {
            const i = (window.__ops || []).indexOf(ev.target);
            if (i >= 0) window.__erreicht.add(i);
            if (ev.target && ev.target.getAttribute) {
                window.__erreichtK.add((ev.target.getAttribute('data-action') || '-') + '|' +
                    (ev.target.getAttribute('data-id') || '-') + '|' +
                    (ev.target.getAttribute('data-value') || '-'));
            }
        };
        document.addEventListener('focusin', window.__reichweiteLauscher, true);
    }
    return meta;
})()`;

/** Ein Schritt der Pfeiltastenfahrt — liest die ARIA-Zusage, nicht das Modul. */
const GRUPPEN_SCHRITT = `(() => {
    const el = document.activeElement;
    if (!el || !el.closest) return null;
    const leiste = el.closest('[role="toolbar"][aria-orientation]');
    if (!leiste) return null;
    const eigene = [...leiste.querySelectorAll('[tabindex]')]
        .filter(g => g.closest('[role="toolbar"][aria-orientation]') === leiste);
    if (eigene.indexOf(el) < 0 || eigene.length < 2) return null;
    window.__begangen = window.__begangen || new Set();
    const schl = (leiste.id || '') + '|' + (leiste.getAttribute('aria-label') || '') + '|' +
        [...document.querySelectorAll('[role="toolbar"][aria-orientation]')].indexOf(leiste);
    if (window.__begangen.has(schl)) return null;
    window.__begangen.add(schl);
    return {
        taste: leiste.getAttribute('aria-orientation') === 'vertical' ? 'ArrowDown' : 'ArrowRight',
        glieder: eigene.length
    };
})()`;

/** Kennung des fokussierten Elements — ueberlebt ein Neuzeichnen. */
const FOKUS = `(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return { tag: 'BODY' };
    return {
        tag: a.tagName,
        klasse: typeof a.className === 'string' ? a.className : '',
        aktion: a.getAttribute ? a.getAttribute('data-action') : null,
        id: a.getAttribute ? a.getAttribute('data-id') : null,
        wert: a.getAttribute ? a.getAttribute('data-value') : null,
        verbunden: a.isConnected
    };
})()`;

/**
 * Frischer Seitenaufbau, gefuellte Kampagne, Ansicht per `switchView()` —
 * ohne Klick (Messdisziplin).
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 * @param {number} n
 */
async function ansichtOeffnen(page, ansicht, n = 20) {
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
 * Tabulatorlauf mit Pause im Menschentempo, inklusive Pfeiltastenfahrt in
 * jeder betretenen Gruppe.
 * @param {import('@playwright/test').Page} page
 * @param {{ pause?: number }} [opt]
 */
async function reichweiteMessen(page, { pause = MENSCHENTEMPO } = {}) {
    const meta = await page.evaluate(SAMMELN);
    const budget = 2 * meta.length + 40;
    let pfeile = 0;
    for (let i = 0; i < budget; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(pause);
        const schritt = await page.evaluate(GRUPPEN_SCHRITT);
        if (!schritt) continue;
        let vorher = null;
        for (let k = 0; k < Math.max(schritt.glieder, 130); k++) {
            await page.keyboard.press(schritt.taste);
            pfeile++;
            await page.waitForTimeout(pause);
            const jetzt = await page.evaluate(FOKUS);
            const marke = JSON.stringify(jetzt);
            if (marke === vorher) break;
            vorher = marke;
        }
    }
    const erreicht = new Set(await page.evaluate(() => [...window.__erreicht]));
    const erreichtK = new Set(await page.evaluate(() => [...window.__erreichtK]));
    const zaehler = new Map();
    for (const m of meta) zaehler.set(m.dk, (zaehler.get(m.dk) || 0) + 1);
    return {
        bedienbar: meta.length,
        nichtNativ: meta.filter(m => m.art === 'nichtNativ').length,
        spruenge: budget,
        pfeile,
        unerreichbar: meta
            .map((m, i) => ({ ...m, i }))
            .filter(m => !erreicht.has(m.i) && !(zaehler.get(m.dk) === 1 && erreichtK.has(m.dk)))
    };
}

/**
 * Lesbare Fehlermeldung: WAS unerreichbar ist, nicht nur wie viele.
 * @param {Record<string, any>} m
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
        `${m.spruenge} Tabulatorspruenge + ${m.pfeile} Pfeiltasten im Menschentempo, ` +
        `${m.unerreichbar.length} unerreichbar:\n` +
        zeilen.join('\n')
    );
}

/**
 * Tabuliert im Menschentempo, bis das unter `window.__ziel` gemerkte
 * Element den Fokus hat (Objektidentitaet). Faehrt Gruppen NICHT ab — die
 * Frage lautet, ob der Tabulator allein hinter die Liste kommt.
 * @param {import('@playwright/test').Page} page
 * @param {string} selektor
 * @param {number} maxSpruenge
 * @returns {Promise<number>} Zahl der Spruenge, 0 wenn nicht erreicht
 */
async function tabBisZiel(page, selektor, maxSpruenge) {
    const vorhanden = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        window.__ziel = el;
        return true;
    }, selektor);
    expect(vorhanden, `Ziel "${selektor}" steht nicht im Dokument`).toBe(true);

    for (let i = 1; i <= maxSpruenge; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(MENSCHENTEMPO);
        const treffer = await page.evaluate(
            () =>
                document.activeElement === window.__ziel && document.activeElement !== document.body
        );
        if (treffer) return i;
    }
    return 0;
}

// ============================================================
// (1)-(2) ANOMALIE A — DER TABULATORKREIS VERSACKT IM BESTIARIUM
// ============================================================

test.describe('Reichweite — das Bestiarium im Menschentempo', () => {
    test('(1) im Bestiarium bleibt bei 150 ms Pause keine Stelle unerreichbar', async ({
        page
    }) => {
        // Der Lauf besteht aus mehreren hundert Tastendruecken mit je
        // 150 ms Pause plus einem Rundlauf in die Seite.
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'bestiary');
        const aktiv = await page.evaluate(() => document.querySelector('.view.active')?.id);
        expect(aktiv).toBe('view-bestiary');

        const m = await reichweiteMessen(page);
        expect(m.bedienbar, 'Die Sammlung hat nichts gefunden').toBeGreaterThan(10);

        // Die zehn Stellen, die NUR dieser Fall findet: sechs native
        // Favoritenknoepfe und vier globale. Sie sind der Beweis, dass es
        // nicht um die 17 nicht-nativen Zeilen geht.
        const nativ = m.unerreichbar.filter(u => u.art === 'nativ');
        const global = m.unerreichbar.filter(u => u.ansicht === 'global');
        expect(
            { nativ: nativ.length, global: global.length, gesamt: m.unerreichbar.length },
            bericht(m)
        ).toEqual({ nativ: 0, global: 0, gesamt: 0 });
    });

    test('(2) der Tabulator kommt im Bestiarium hinter die Liste — div.qref-fab wird erreicht', async ({
        page
    }) => {
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'bestiary');
        const halte = await page.evaluate(HALTE);

        // `2 x Halte + 40` ist keine Flutgrenze, sondern die Zusage, dass
        // der Kreis RUND LAEUFT: zwei volle Runden plus Luft. Wer darin
        // nicht hinter die Liste kommt, kommt nie hinter die Liste.
        const budget = 2 * halte + 40;
        const spruenge = await tabBisZiel(page, 'div.qref-fab', budget);
        expect(
            spruenge,
            `div.qref-fab nach ${budget} Tabulatorspruengen (${halte} sichtbare Halte) ` +
                `nicht erreicht — der Kreis versackt in der virtuell gescrollten Liste`
        ).toBeGreaterThan(0);
    });
});

// ============================================================
// (3) DER FOKUS MUSS EIN NEUZEICHNEN UEBERLEBEN
// ============================================================
//
// Der Mechanismus hinter Fall (1) und (2), in einem einzigen Handgriff
// nachgestellt: Fokus per Tabulator in die Liste, dann mit dem RAD rollen
// (Messdisziplin 2 — nur das Rad erzeugt denselben Ereignisstrom wie die
// Hand). Im ausgelieferten Zustand ersetzt der entprellte Lauscher die
// Zeilen und `document.activeElement` faellt auf `BODY`.

test.describe('Reichweite — der Fokus ueberlebt das Neuzeichnen der virtuellen Liste', () => {
    test('(3) nach dem Rollen mit dem Rad liegt der Fokus noch auf einer Bestiarium-Zeile', async ({
        page
    }) => {
        test.setTimeout(300_000);
        await ansichtOeffnen(page, 'bestiary');

        // Per echten Tastendruecken in die Liste — nie `.focus()`.
        let drin = null;
        for (let i = 0; i < 200; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(20);
            const f = await page.evaluate(FOKUS);
            if (f.aktion === 'bestiary-select' || f.aktion === 'bestiary-toggle-fav') {
                drin = f;
                break;
            }
        }
        expect(drin, 'Kein Tabulatorhalt in der Bestiarium-Liste gefunden').not.toBeNull();

        // DER RADPUNKT WIRD AUS DEM RECHTECK DER LISTE BERECHNET, nicht
        // geraten. Der erste Versuch dieses Falls stand auf 700/450 und war
        // GRUEN — nicht weil der Fehler fehlte, sondern weil die Liste bei
        // x 32…583 liegt und 700 daneben: `scrollTop 0 -> 0`, kein
        // Neuzeichnen, kein Fokusverlust. Ueber der Mitte derselben Liste
        // im selben Lauf: `scrollTop 0 -> 300` und `activeElement` auf
        // `BODY`. Eine geratene Koordinate ist in dieser Probe der
        // Unterschied zwischen einem Befund und einem Freispruch.
        const rechteck = await page.evaluate(() => {
            const c = document.getElementById('bestiary-list');
            const r = c.getBoundingClientRect();
            return {
                x: r.x + r.width / 2,
                y: r.y + r.height / 2,
                rollbar: c.scrollHeight > c.clientHeight,
                scrollTop: c.scrollTop
            };
        });
        expect(
            rechteck.rollbar,
            'Die Bestiarium-Liste ist nicht rollbar — der Fall prueft dann nichts'
        ).toBe(true);

        await page.mouse.move(rechteck.x, rechteck.y);
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(300);

        const gerollt = await page.evaluate(
            () => document.getElementById('bestiary-list').scrollTop
        );
        expect(gerollt, 'Das Rad hat die Liste nicht gerollt').toBeGreaterThan(rechteck.scrollTop);

        const nachher = await page.evaluate(FOKUS);
        expect(
            nachher.tag,
            `Vor dem Rollen: ${JSON.stringify(drin)} — danach: ${JSON.stringify(nachher)}, ` +
                `scrollTop ${rechteck.scrollTop} -> ${gerollt}. Faellt der Fokus auf BODY, ` +
                `loescht das Neuzeichnen den fokussierten Knoten und der Tabulatorkreis setzt ` +
                `innerhalb der Liste wieder auf.`
        ).not.toBe('BODY');
        expect(nachher.verbunden, 'Der fokussierte Knoten haengt nicht mehr im Dokument').toBe(
            true
        );
    });
});

// ============================================================
// (4) ANOMALIE B — DIE FLUT IN DER PARTY
// ============================================================
//
// Die Party ist eine KAMPFANSICHT; dieser Fall urteilt also ueber eine
// Schuld des ausgelieferten Kampfpakets, nicht ueber diese Phase.
// Gemessen: 351 sichtbare Halte bei 20 Eintraegen je Typ, davon 140
// einzeln anfahrbare `span.slot-pip` (20 Charaktere x 7 Plaetze). Die
// Schnell-Referenz liegt dahinter und wurde in 300 Spruengen nicht
// erreicht.

test.describe('Reichweite — die Flut der Party', () => {
    test('(4) div.qref-fab wird in der Party erreicht, und die 140 Zauberplatz-Punkte kosten 20 Halte', async ({
        page
    }) => {
        test.setTimeout(600_000);
        await ansichtOeffnen(page, 'party');

        const punkte = await page.evaluate(() => {
            const b = [...document.querySelectorAll('.spell-slots-compact')];
            const alle = [...document.querySelectorAll('.slot-pip')];
            return {
                behaelter: b.length,
                punkte: alle.length,
                halte: alle.filter(p => p.getAttribute('tabindex') === '0').length
            };
        });
        expect(punkte.punkte, 'Die Saat erzeugt keine Zauberplatz-Punkte').toBe(140);
        expect(
            punkte.halte,
            `140 Punkte in ${punkte.behaelter} Behaeltern tragen ${punkte.halte} Halte — ` +
                `erwartet ist einer je Behaelter`
        ).toBe(punkte.behaelter);

        const halte = await page.evaluate(HALTE);
        const spruenge = await tabBisZiel(page, 'div.qref-fab', 2 * halte + 40);
        expect(
            spruenge,
            `div.qref-fab in der Party nicht erreicht (${halte} Halte)`
        ).toBeGreaterThan(0);
    });
});
