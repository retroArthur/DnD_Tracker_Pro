// @ts-check
/**
 * Der Waechter der Grossschreibung (CAPS)
 * =======================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **jedes Buchstaben-Kuerzel
 * der eingebauten Hilfe wirkt auch bei eingeschalteter Grossschreibtaste** —
 * und die Liste der zu pruefenden Kuerzel wird NICHT abgetippt, sie kommt aus
 * der Hilfe im gebauten Buendel.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand
 *
 * Mit eingeschalteter Grossschreibtaste liefert der Browser in `e.key` den
 * GROSSBUCHSTABEN (`'Z'` statt `'z'`), und bei Shift DAZU wieder den kleinen.
 * Jeder Zweig in `systems/spellslots/keyboard-shortcuts.js` verglich `e.key`
 * gegen den Kleinbuchstaben. GEMESSEN am Buendel zu 279ad98 mit rohen
 * Tastenereignissen auf Browserebene (CDP `Input.dispatchKeyEvent`, weil
 * Playwright kein Tastaturbild und keine Grossschreibtaste emuliert),
 * `defaultPrevented` am `window` in der Blasenphase gelesen:
 *
 *   Strg+Z  key='Z' mods=2    -> defaultPrevented false, kein Rueckgaengig
 *   Strg+Y  key='Y' mods=2    -> false
 *   Strg+Shift+Z key='z' m=10 -> false
 *   Strg+S  key='S' mods=2    -> false, nicht gespeichert
 *   Strg+K / Strg+F           -> false, keine Suche
 *   R T L K N P H  (gross)    -> false, alle sieben
 *   Shift+N key='n' mods=8    -> false
 *   Strg+Shift+K key='k' m=10 -> TRUE   <- der einzige Ueberlebende
 *
 * Vierzehn von fuenfzehn Zeilen der eingebauten Hilfe sagten damit etwas
 * Falsches, und die Taste wurde nicht einmal verbraucht.
 *
 * WARUM DER BESTEHENDE WAECHTER DAS NICHT SAH. `tastenhilfe.spec.js` drueckt
 * die Kleinbuchstaben-Form — in der Lage, die ein Geraet OHNE
 * Grossschreibtaste schickt. Seine Kreuzung ueber 80 Modifikatorlagen traegt
 * `Shift+N` und `Shift+P` in der geschifteten Gestalt, aber keine
 * Grossschreibtasten-Lage: dort ist der Buchstabe gross OHNE dass `shiftKey`
 * gesetzt waere, und genau diese Kombination kommt in keiner seiner Listen vor.
 *
 * WARUM ES EIN EINZELFALL-FLICK WAR UND KEIN STRUKTURFEHLER-FLICK. Der
 * Redo-Zweig (`e.key === 'y' || (e.key === 'Z' && e.shiftKey)`) traegt die
 * Lehre "mit Shift wird 'Z' geliefert" als EINEN Sonderzweig. Sie gilt aber
 * fuer jeden Buchstaben und fuer jede Ursache einer Grossschreibung — nicht
 * nur fuer Shift, und nicht nur fuer `z`. Darum normalisiert der Verteiler den
 * Schluessel jetzt EINMAL (`TASTE(e)`), statt die Gestalt je Zweig zu raten.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WARUM PER CDP UND NICHT PER `page.keyboard.press`
 *
 * `page.keyboard.press('Z')` schickt `key='Z'` MIT `shiftKey: true` — das ist
 * die Shift-Lage, nicht die Grossschreibtasten-Lage. Playwright kennt keine
 * Grossschreibtaste. Die hier gemessene Lage (grosser Buchstabe, `shiftKey`
 * NICHT gesetzt) ist auf dem Weg ueber Playwrights Tastatur nicht erreichbar;
 * sie entsteht nur aus einem rohen `Input.dispatchKeyEvent`. Vorbild fuer das
 * Verfahren: der `?`-Block in `systems/spellslots/keyboard-shortcuts.js`, der
 * aus demselben Grund per CDP vermessen wurde.
 *
 * WARUM `defaultPrevented` UND EINE WIRKUNG. `defaultPrevented` allein sagt
 * nur, dass der Druck verbraucht wurde — ein `preventDefault()` ohne Handlung
 * saehe genauso aus. Fall (2) misst darum bei acht der Kuerzel zusaetzlich die
 * Wirkung selbst, jedes mit einer eigenen, lesbaren Spur.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
const BREIT = { width: 1440, height: 900 };

/** Die Modifikator-Bitmaske von `Input.dispatchKeyEvent`. */
const MOD = { Alt: 1, Strg: 2, Meta: 4, Shift: 8 };

const SEED = {
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
            name: 'Alrik (Caps-Strang)',
            characterClass: 'Kaempfer',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 }
        }
    ],
    npcs: [{ id: 1, name: 'Haendler (Caps-Strang)', role: 'Merchant', race: 'Mensch' }],
    locations: [{ id: 1, name: 'Testort (Caps-Strang)' }],
    quests: [],
    loot: [],
    spells: [],
    wiki: [],
    links: [],
    filters: {},
    tags: [],
    sessionNotes: [],
    encounters: [],
    initiative: {
        combatants: [1, 2, 3, 4, 5, 6].map(i => ({
            id: i,
            name: 'Kaempfer ' + i,
            initiative: 21 - i,
            initBonus: 2,
            maxHp: 30,
            currentHp: 30,
            ac: 13,
            type: i < 4 ? 'player' : 'monster',
            effects: []
        })),
        currentTurn: 0,
        round: 1
    },
    mindmap: { nodes: [], connections: [] },
    calendar: {},
    partyGold: 0,
    quickRefCustom: [],
    _nextId: {
        characters: 2,
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
 * Breit laden, gefuellte Kampagne, Ansicht per `switchView()`.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 */
async function laden(page, ansicht) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, SEED);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(v => window.switchView(v), ansicht);
    await page.waitForTimeout(400);
    await page.evaluate(() => {
        window.__capsDp = [];
        window.addEventListener(
            'keydown',
            e => window.__capsDp.push({ key: e.key, shift: e.shiftKey, dp: e.defaultPrevented }),
            false
        );
    });
    return page.context().newCDPSession(page);
}

/**
 * DIE KUERZEL AUS DER HILFE IM BUENDEL — gerechnet, nicht getippt.
 *
 * Die Modifikatormarken (`Strg`, `Alt`, `Shift`) binden sich an die naechste
 * Nicht-Modifikatormarke, genau wie in `tastenhilfe.spec.js`. Es bleiben nur
 * Reihen uebrig, deren Zieltaste EIN lateinischer Buchstabe ist — Ziffern und
 * Zeichen kennen keine Grossschreibung.
 * @param {import('@playwright/test').Page} page
 */
async function buchstabenKuerzel(page) {
    return page.evaluate(() => {
        const o = document.getElementById('shortcuts-overlay');
        if (!o) return [];
        const MODIFIKATOREN = { STRG: 1, ALT: 1, SHIFT: 1 };
        /** @type {{text: string, vorsatz: string[], buchstabe: string}[]} */
        const raus = [];
        for (const r of Array.from(o.querySelectorAll('.shortcut-row'))) {
            const text = (r.querySelector('span')?.textContent || '').replace(/\s+/g, ' ').trim();
            const marken = Array.from(r.querySelectorAll('.shortcut-key')).map(k =>
                (k.textContent || '').trim()
            );
            const vorsatz = [];
            for (const m of marken) {
                const gross = m.toUpperCase();
                if (MODIFIKATOREN[gross] && vorsatz.length === marken.indexOf(m)) {
                    vorsatz.push(gross === 'STRG' ? 'Strg' : gross === 'ALT' ? 'Alt' : 'Shift');
                    continue;
                }
                if (/^[A-Za-z]$/.test(m)) {
                    raus.push({ text, vorsatz: vorsatz.slice(), buchstabe: m.toUpperCase() });
                }
            }
        }
        return raus;
    });
}

/**
 * Schickt EIN rohes Tastenereignis in der Lage, die eine eingeschaltete
 * Grossschreibtaste erzeugt: der Buchstabe kommt GROSS, wenn Shift NICHT
 * gehalten wird, und KLEIN, wenn es gehalten wird — also genau umgekehrt zur
 * gewohnten Lage. `shiftKey` selbst bleibt dabei, was die Zeile sagt.
 * @param {import('@playwright/test').CDPSession} cdp
 * @param {import('@playwright/test').Page} page
 * @param {{vorsatz: string[], buchstabe: string}} k
 */
async function capsDruck(cdp, page, k) {
    const mitShift = k.vorsatz.includes('Shift');
    const key = mitShift ? k.buchstabe.toLowerCase() : k.buchstabe;
    const mods = k.vorsatz.reduce((m, v) => m | (MOD[v] || 0), 0);
    await page.evaluate(() => {
        window.__capsDp = [];
    });
    const ev = {
        key,
        code: 'Key' + k.buchstabe,
        modifiers: mods,
        windowsVirtualKeyCode: k.buchstabe.charCodeAt(0)
    };
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...ev });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...ev });
    await page.waitForTimeout(140);
    const spur = await page.evaluate(() => window.__capsDp.slice());
    return { key, mods, verbraucht: spur.some(s => s.dp), spur };
}

/** Marke fuer Meldungen: `Strg+Shift+Z`. */
const marke = k => [...k.vorsatz, k.buchstabe].join('+');

/**
 * Raeumt alles, was ein vorhergehender Druck geoeffnet haben kann — sonst
 * frisst eine offene Schale den naechsten Druck und die Messung meldet einen
 * Befund, den es nicht gibt.
 * @param {import('@playwright/test').Page} page
 * @param {string} ansicht
 */
async function raeumen(page, ansicht) {
    await page.evaluate(v => {
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
        const h = document.getElementById('shortcuts-overlay');
        if (h) h.classList.remove('show');
        const q = document.getElementById('quick-ref-panel');
        if (q) q.classList.remove('active');
        const p = document.getElementById('kampflog-panel');
        if (p) p.classList.remove('open', 'show', 'active');
        const cp = document.getElementById('command-palette');
        if (cp) cp.classList.remove('show', 'active', 'open');
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        if (document.querySelector('.view.active')?.id !== 'view-' + v) window.switchView(v);
    }, ansicht);
    await page.waitForTimeout(120);
}

// ===========================================================================
// (1) JEDES BUCHSTABEN-KUERZEL DER HILFE WIRD AUCH GROSS VERBRAUCHT
// ===========================================================================
test('(1) kein Buchstaben-Kuerzel der Hilfe faellt bei eingeschalteter Grossschreibung aus', async ({
    page
}) => {
    test.setTimeout(240000);
    const cdp = await laden(page, 'initiative');

    const kuerzel = await buchstabenKuerzel(page);
    // ZUERST DIE LISTE SELBST: ein blinder Leser der Hilfe wuerde diesen Fall
    // sonst mit einer leeren Menge gruen machen — genau die Fehlerart, die in
    // dieser Akte schon mehrfach vorkam. 16 ist der gemessene Stand: 16
    // Hilfe-Reihen mit Buchstaben-Zieltaste, die 15 verschiedene Kuerzel
    // nennen (`N` steht zweimal, als "Naechster Zug" und als "Neues Element").
    // Die Schranke faengt den Einbruch, nicht die Zunahme.
    expect(
        kuerzel.length,
        `Die Hilfe im Buendel fuehrt ${kuerzel.length} Reihen mit Buchstaben-Zieltaste — ` +
            `gemessen sind 16 (15 verschiedene Kuerzel, N steht zweimal). Faellt die ` +
            `Zahl, liest dieser Fall die Hilfe nicht mehr richtig und misst nichts.\n` +
            JSON.stringify(kuerzel)
    ).toBeGreaterThanOrEqual(16);

    /** @type {string[]} */
    const tot = [];
    /** @type {string[]} */
    const spur = [];
    for (const k of kuerzel) {
        await raeumen(page, 'initiative');
        const erg = await capsDruck(cdp, page, k);
        spur.push(
            `${marke(k).padEnd(14)} key='${erg.key}' mods=${String(erg.mods).padEnd(2)} ` +
                `verbraucht=${erg.verbraucht ? 'JA' : 'NEIN'}  (${k.text})`
        );
        if (!erg.verbraucht) tot.push(`${marke(k)} [${k.text}] key='${erg.key}' mods=${erg.mods}`);
    }

    expect(
        tot,
        `${tot.length} von ${kuerzel.length} Buchstaben-Kuerzeln der Hilfe tun bei ` +
            `eingeschalteter Grossschreibtaste NICHTS — der Druck wird nicht einmal ` +
            `verbraucht, die Hilfe behauptet sie aber.\n` +
            spur.join('\n')
    ).toEqual([]);
});

// ===========================================================================
// (2) UND ES PASSIERT DAS RICHTIGE — acht Kuerzel mit eigener Wirkungsspur
// ===========================================================================
//
// `defaultPrevented` allein waere zu schwach: ein `preventDefault()` ohne
// Handlung saehe genauso aus wie ein wirkendes Kuerzel. Diese acht sind
// gewaehlt, weil ihre Wirkung ohne Umwege ablesbar ist — und sie decken alle
// drei Gestalten ab, in denen die Grossschreibung zuschlaegt: Strg+Buchstabe
// (gross), Strg+Shift+Buchstabe (klein), blanker Buchstabe (gross).
test('(2) acht der Kuerzel wirken bei Grossschreibung nachweislich', async ({ page }) => {
    test.setTimeout(240000);
    const cdp = await laden(page, 'initiative');

    const druck = async (buchstabe, ...vorsatz) => capsDruck(cdp, page, { vorsatz, buchstabe });

    /** @type {string[]} */
    const fehler = [];
    const pruefe = (name, erwartet, gemessen) => {
        if (JSON.stringify(erwartet) !== JSON.stringify(gemessen)) {
            fehler.push(
                `${name}: erwartet ${JSON.stringify(erwartet)}, gemessen ${JSON.stringify(gemessen)}`
            );
        }
    };

    // --- blanker Buchstabe, GROSS: N schaltet den Zug weiter
    await raeumen(page, 'initiative');
    const zugVor = await page.evaluate(() => window.D.initiative.currentTurn);
    await druck('N');
    pruefe(
        'N (Naechster Zug)',
        zugVor + 1,
        await page.evaluate(() => window.D.initiative.currentTurn)
    );

    // --- P geht zurueck
    await druck('P');
    pruefe(
        'P (Vorheriger Zug)',
        zugVor,
        await page.evaluate(() => window.D.initiative.currentTurn)
    );

    // --- Shift+N, Buchstabe KLEIN: neue Runde
    await raeumen(page, 'initiative');
    const rundeVor = await page.evaluate(() => window.D.initiative.round);
    await druck('N', 'Shift');
    pruefe(
        'Shift+N (Neue Runde)',
        rundeVor + 1,
        await page.evaluate(() => window.D.initiative.round)
    );

    // --- H oeffnet den Lebenspunkte-Rechner des Kaempfers am Zug
    await raeumen(page, 'initiative');
    await druck('H');
    await page.waitForTimeout(250);
    pruefe(
        'H (HP-Rechner)',
        true,
        await page.evaluate(() => {
            const m = document.querySelector('.modal-overlay.show, #hp-calc-modal.show');
            return !!m;
        })
    );

    // --- K schaltet das Kampfprotokoll
    await raeumen(page, 'initiative');
    const logVor = await page.evaluate(
        () => !!document.getElementById('kampflog-panel')?.className.match(/open|show|active/)
    );
    await druck('K');
    await page.waitForTimeout(250);
    pruefe(
        'K (Kampfprotokoll)',
        !logVor,
        await page.evaluate(
            () => !!document.getElementById('kampflog-panel')?.className.match(/open|show|active/)
        )
    );

    // --- Strg+K, Buchstabe GROSS: Fokus in die globale Suche
    await raeumen(page, 'initiative');
    await druck('K', 'Strg');
    await page.waitForTimeout(250);
    pruefe(
        'Strg+K (Suche)',
        'global-search',
        await page.evaluate(() => document.activeElement?.id || '(nichts)')
    );

    // --- Strg+Z / Strg+Y, GROSS: Rueckgaengig und Wiederholen an einer
    //     eigens gesetzten Marke. `saveUndoState()` schnappt den Stand VOR
    //     der Aenderung — danach muss Strg+Z den Probennamen wieder entfernen.
    await raeumen(page, 'initiative');
    await page.evaluate(() => {
        window.saveUndoState('Caps-Probe');
        window.D.characters.push({
            id: 99,
            name: 'ProbeHeld',
            characterClass: 'Barde',
            level: 1,
            hpCurrent: 8,
            hpMax: 8,
            armorClass: 10
        });
        window.save();
    });
    await page.waitForTimeout(250);
    const namenVor = await page.evaluate(() => window.D.characters.map(c => c.name));
    await druck('Z', 'Strg');
    await page.waitForTimeout(350);
    const namenNachUndo = await page.evaluate(() => window.D.characters.map(c => c.name));
    pruefe(
        'Strg+Z (Rueckgaengig)',
        { enthaeltProbe: false },
        { enthaeltProbe: namenNachUndo.includes('ProbeHeld') }
    );
    await druck('Y', 'Strg');
    await page.waitForTimeout(350);
    const namenNachRedo = await page.evaluate(() => window.D.characters.map(c => c.name));
    pruefe(
        'Strg+Y (Wiederholen)',
        { enthaeltProbe: true },
        { enthaeltProbe: namenNachRedo.includes('ProbeHeld') }
    );

    expect(
        fehler,
        `${fehler.length} von 8 Kuerzeln wirken bei eingeschalteter Grossschreibtaste nicht.\n` +
            `Namen vor dem Rueckgaengig: ${JSON.stringify(namenVor)}, danach ` +
            `${JSON.stringify(namenNachUndo)}, nach dem Wiederholen ${JSON.stringify(namenNachRedo)}\n` +
            fehler.join('\n')
    ).toEqual([]);
});

// ===========================================================================
// (3) "NEUES ELEMENT" IST DIE AUSNAHME — sie wirkt nur AUSSERHALB des Kampfes
// ===========================================================================
//
// Die Hilfe fuehrt `N` zweimal: "Naechster Zug (im Kampf)" und "Neues Element
// (…)". Fall (1) misst beide in der Kampfansicht, wo der erste Zweig greift —
// die zweite Zeile braucht darum eine eigene Messung in einer Ansicht, in der
// sie ueberhaupt gelten kann.
test('(3) GROSSES N legt in der Party-Ansicht ein neues Element an', async ({ page }) => {
    test.setTimeout(180000);
    const cdp = await laden(page, 'party');
    await raeumen(page, 'party');

    const vorher = await page.evaluate(
        () => !!document.getElementById('char-form')?.classList.contains('open')
    );
    expect(vorher, 'Das Charakter-Formular stand schon offen').toBe(false);

    const erg = await capsDruck(cdp, page, { vorsatz: [], buchstabe: 'N' });
    await page.waitForTimeout(300);
    const nachher = await page.evaluate(
        () => !!document.getElementById('char-form')?.classList.contains('open')
    );
    expect(
        { verbraucht: erg.verbraucht, formularOffen: nachher },
        `GROSSES N in der Party-Ansicht: key='${erg.key}', Spur ${JSON.stringify(erg.spur)}`
    ).toEqual({ verbraucht: true, formularOffen: true });
});
