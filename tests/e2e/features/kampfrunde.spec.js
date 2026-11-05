// @ts-check
/**
 * Der Waechter der Rundenbuchhaltung (RUNDE)
 * ==========================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **es gibt EINEN Rundenzaehler,
 * und alle drei Bedienelemente rechnen auf demselben**. "⏭️ Neue Runde" erhoeht
 * ihn immer um eins, "◀ Zurueck" ist die Umkehrung von "▶ Naechster", und die
 * Zahl auf dem Schirm, die Zahl in den Daten und die Zahl im Ereignis-Log sagen
 * dasselbe.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand — ZWEI GETRENNTE ZAEHLER
 *
 * Es gab `D.initiative.round` UND eine Modulglobale `encounterRound`
 * (`systems/undo.js`). `nextTurn()` (`features/initiative.js`) erhoehte beim
 * Rundenumschlag NUR `init.round`; `nextEncounterRound()` rechnete auf
 * `encounterRound` und SETZTE `D.initiative.round = encounterRound`. Die
 * Modulglobale wurde ausschliesslich beim App-Start (`core/init.js`) und beim
 * Undo-Zurueckspielen (`systems/undo.js`) nachgezogen. Jeder Rundenumschlag
 * ueber "▶ Naechster" liess sie also stehen.
 *
 * GEMESSEN am Buendel zu 279ad98, Kampfansicht, sechs Kaempfer, echte
 * Tastendruecke bei BODY-Fokus:
 *
 *   start                 Zug 0   D.round 1   Anzeige "1"
 *   nach 6x `n`           Zug 0   D.round 2   Anzeige "2"
 *   nach Shift+N          Zug 0   D.round 2   Anzeige "2"   Log "⚔️ Runde 2"
 *   nach 2x Shift+N       Zug 0   D.round 3   Anzeige "3"   Log "⚔️ Runde 3"
 *
 * Der erste Druck auf "⏭️ Neue Runde" tat NICHTS und meldete trotzdem einen
 * Rundenwechsel — `encounterRound` ging von 1 auf 2 und schrieb damit eine 2
 * auf eine Runde, die schon 2 war. Mit dem Finger (390x844, `hasTouch`) auf dem
 * Knopf identisch.
 *
 * DERSELBE VERALTETE ZAEHLER machte "◀ Zurueck" zur Nicht-Umkehrung von
 * "▶ Naechster". `prevTurn()` (`core/init.js`) senkte die Runde nur unter
 * `if (encounterRound > 1)`. Gemessen, 7x `n` dann 7x `p`:
 *
 *   n: 0/1 1/1 2/1 3/1 4/1 5/1 0/2 1/2
 *   p: 0/2 5/2 4/2 3/2 2/2 1/2 0/2
 *
 * Sieben vor, sieben zurueck — der Zug steht wieder auf 0, die Runde aber auf
 * 2. Der Rueckwaertsumlauf 0 -> 5 senkte sie nicht. Nach zwei Druecken auf
 * "⏭️ Neue Runde" (dort zog `encounterRound` ja mit) senkte derselbe Knopf sie
 * dagegen schon — ein Bedienelement, zwei Verhalten.
 *
 * WAS DAS AM TISCH KOSTET: jede Wirkungsdauer, die der Spielleiter in Runden
 * zaehlt (Segen, Hast, Konzentration), liegt danach um eine Runde daneben, und
 * die Zahl, die er vom Tablet abliest, ist die falsche.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WARUM DIESE DATEI DREI QUELLEN KREUZT UND NICHT EINE LIEST
 *
 * Der Befund war genau deshalb jahrelang unsichtbar, weil JEDE EINZELNE Quelle
 * fuer sich stimmig aussah: die Anzeige folgte `renderInit()` und damit
 * `D.initiative.round`, das Log folgte dem Zaehler in `nextEncounterRound()`,
 * und beide waren in sich widerspruchsfrei. Erst die Kreuzung
 * Anzeige/Daten/Log auf EINEN Stand macht den Bruch sichtbar. Darum liest jeder
 * Fall hier alle drei.
 *
 * WARUM DER BESTEHENDE WAECHTER IHN NICHT SAH:
 * `tests/e2e/features/tastatur-ausloesung.spec.js` fuhr `nextEncounterRound`
 * ausschliesslich aus dem FRISCHEN Stand (`expect(vorher.runde).toBe(1)` …
 * `toBe(2)`) — dort stimmen beide Zaehler zufaellig ueberein. Keine Probe hat
 * die zwei Wege gekreuzt. Fall (1) hier faehrt deshalb die Runde ERST per
 * "▶ Naechster" um und DANN "⏭️ Neue Runde".
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit laden — `loadApp()` wartet auf `.app-title`, und die ist im
 *  Mobil-Layout versteckt. Verkleinert wird erst danach. */
const BREIT = { width: 1440, height: 900 };

/** Gefuellte Kampagne mit sechs Kaempfern. Sechs, weil der Umschlag nach dem
 *  SECHSTEN `n` kommt — bei weniger Kaempfern faellt der Fall mit dem
 *  Umschlag zusammen und die Messung waere nicht mehr zuzuordnen. */
const KAMPF_SEED = {
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
            name: 'Alrik (Runden-Strang)',
            characterClass: 'Kaempfer',
            level: 5,
            hpCurrent: 40,
            hpMax: 40,
            armorClass: 16,
            attributes: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 }
        },
        {
            id: 2,
            name: 'Mira (Runden-Strang)',
            characterClass: 'Magier',
            level: 5,
            hpCurrent: 30,
            hpMax: 30,
            armorClass: 12,
            attributes: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 }
        }
    ],
    npcs: [{ id: 1, name: 'Haendler (Runden-Strang)', role: 'Merchant', race: 'Mensch' }],
    locations: [{ id: 1, name: 'Testort (Runden-Strang)' }],
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

/**
 * Laedt breit, saet die gefuellte Kampagne und oeffnet die Kampfansicht per
 * `switchView()` — ohne Klick, damit der Tabulator-Startpunkt am
 * Dokumentanfang steht und die Einzeltasten-Kuerzel am BODY greifen.
 * @param {import('@playwright/test').Page} page
 * @param {{width: number, height: number}} [kleiner] Erst NACH dem Laden verkleinern
 */
async function kampfLaden(page, kleiner) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
    }, KAMPF_SEED);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.switchView('initiative'));
    await page.waitForTimeout(400);
    if (kleiner) {
        await page.setViewportSize(kleiner);
        await page.waitForTimeout(450);
    }
}

/**
 * DER STAND AUS DREI QUELLEN: Anzeige, Daten, Log. Plus das Urteil, ob die
 * Anzeige ueberhaupt im Fenster liegt — eine Zahl, die niemand sehen kann,
 * ist kein Beleg (dieselbe Falle wie bei den Kopfzeilen-Knoepfen: sichtbar
 * nach `checkVisibility()` und trotzdem rechts des Fensterrands).
 * @param {import('@playwright/test').Page} page
 */
function stand(page) {
    return page.evaluate(() => {
        const el = document.getElementById('encounter-round-num');
        const r = el ? el.getBoundingClientRect() : null;
        let sichtbar = false;
        if (el && r && r.width > 0 && r.height > 0) {
            const frei =
                typeof el.checkVisibility === 'function'
                    ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
                    : true;
            const cx = Math.round(r.left + r.width / 2);
            const cy = Math.round(r.top + r.height / 2);
            const imFenster =
                cx >= 0 && cy >= 0 && cx < window.innerWidth && cy < window.innerHeight;
            sichtbar = frei && imFenster;
        }
        const log = Array.from(document.querySelectorAll('.event-log-entry'))
            .map(e => e.textContent.replace(/\s+/g, ' ').trim())
            .filter(t => t.includes('Runde'));
        return {
            zug: window.D.initiative.currentTurn,
            daten: window.D.initiative.round,
            anzeige: el ? el.textContent.trim() : '(fehlt)',
            anzeigeSichtbar: sichtbar,
            rundenLog: log
        };
    });
}

/** `Zug/Runde(Anzeige)` — die Kurzform fuer die Spur in den Meldungen. */
const kurz = s => `${s.zug}/${s.daten}(${s.anzeige})`;

/** Die letzte Rundenmeldung des Ereignis-Logs als Zahl, oder null. */
function logRunde(s) {
    for (const zeile of s.rundenLog) {
        const t = zeile.match(/Runde\s+(\d+)/);
        if (t) return Number(t[1]);
    }
    return null;
}

// ===========================================================================
// (1) "⏭️ NEUE RUNDE" ERHOEHT IMMER — auch nach einem Umschlag durch "▶ Naechster"
// ===========================================================================
test('(1) Shift+N erhoeht die Runde auch dann, wenn "n" sie schon umgeschlagen hat', async ({
    page
}) => {
    test.setTimeout(180000);
    await kampfLaden(page);

    const start = await stand(page);
    expect(start, `Ausgangsstand ${kurz(start)}`).toMatchObject({ zug: 0, daten: 1, anzeige: '1' });
    expect(start.anzeigeSichtbar, 'Die Rundenanzeige liegt nicht im Fenster').toBe(true);

    // Sechs Kaempfer, sechster Druck schlaegt die Runde um.
    for (let i = 0; i < 6; i++) {
        await page.keyboard.press('n');
        await page.waitForTimeout(140);
    }
    const nachUmschlag = await stand(page);
    expect(
        nachUmschlag,
        `Nach 6x "n" erwartet Zug 0 / Runde 2, gemessen ${kurz(nachUmschlag)}`
    ).toMatchObject({ zug: 0, daten: 2, anzeige: '2' });

    // DER BEFUND: der erste Druck auf "Neue Runde" verbrauchte den Druck,
    // meldete "⚔️ Runde 2" und aenderte nichts.
    await page.keyboard.press('Shift+N');
    await page.waitForTimeout(450);
    const nachRunde = await stand(page);
    expect(
        nachRunde.daten,
        `Shift+N nach dem Umschlag muss die Runde auf 3 setzen — gemessen ` +
            `${kurz(nachRunde)}, Log ${JSON.stringify(nachRunde.rundenLog)}`
    ).toBe(3);
    expect(
        nachRunde.anzeige,
        `Die Anzeige muss der Zahl in den Daten folgen (Daten ${nachRunde.daten})`
    ).toBe('3');
    expect(
        logRunde(nachRunde),
        `Das Ereignis-Log muss dieselbe Runde melden wie Anzeige und Daten — ` +
            `gemessen Log ${JSON.stringify(nachRunde.rundenLog)} gegen Daten ${nachRunde.daten}`
    ).toBe(nachRunde.daten);
});

// ===========================================================================
// (2) "◀ ZURUECK" IST DIE UMKEHRUNG VON "▶ NAECHSTER"
// ===========================================================================
test('(2) sieben Zuege vor und sieben zurueck fuehren auf denselben Stand', async ({ page }) => {
    test.setTimeout(180000);
    await kampfLaden(page);

    const start = await stand(page);
    const spur = ['start=' + kurz(start)];
    for (let i = 0; i < 7; i++) {
        await page.keyboard.press('n');
        await page.waitForTimeout(140);
        spur.push('n->' + kurz(await stand(page)));
    }
    for (let i = 0; i < 7; i++) {
        await page.keyboard.press('p');
        await page.waitForTimeout(140);
        spur.push('p->' + kurz(await stand(page)));
    }
    const ende = await stand(page);
    expect(
        { zug: ende.zug, daten: ende.daten },
        `7x "n" und 7x "p" muessen auf den Ausgangsstand zuruecklaufen.\n` +
            `Spur (Zug/Runde(Anzeige)): ${spur.join(' ')}`
    ).toEqual({ zug: start.zug, daten: start.daten });
    expect(ende.anzeige, 'Die Anzeige folgt den Daten nicht').toBe(String(ende.daten));
});

// ===========================================================================
// (3) DIESELBE ZAHL AUS JEDER RICHTUNG — "◀ Zurueck" hat nicht zwei Verhalten
// ===========================================================================
//
// WARUM DIESER FALL NEBEN (2) STEHT. (2) faehrt die Runde ueber "▶ Naechster"
// hoch, (3) ueber "⏭️ Neue Runde". GEMESSEN verhielt sich "◀ Zurueck" in den
// zwei Faellen UNTERSCHIEDLICH: aus einer durch `n` erreichten Runde 2 senkte
// es sie nicht, aus einer durch Shift+N erreichten Runde 3 schon. Ein Fall,
// der nur einen der zwei Wege faehrt, kann das nicht sehen — und der
// bestehende Waechter fuhr genau einen.
test('(3) "◀ Zurueck" senkt die Runde unabhaengig davon, wie sie erreicht wurde', async ({
    page
}) => {
    test.setTimeout(180000);
    await kampfLaden(page);

    // Weg A: Runde 2 ueber den Umschlag.
    for (let i = 0; i < 6; i++) {
        await page.keyboard.press('n');
        await page.waitForTimeout(140);
    }
    const aVor = await stand(page);
    expect(aVor.daten, `Weg A: Runde 2 erwartet, gemessen ${kurz(aVor)}`).toBe(2);
    await page.keyboard.press('p');
    await page.waitForTimeout(350);
    const aNach = await stand(page);

    // Weg B: frisch laden, Runde 2 ueber "Neue Runde".
    await kampfLaden(page);
    await page.keyboard.press('Shift+N');
    await page.waitForTimeout(350);
    const bVor = await stand(page);
    expect(bVor.daten, `Weg B: Runde 2 erwartet, gemessen ${kurz(bVor)}`).toBe(2);
    // Aus Zug 0 laeuft `p` auf den letzten Kaempfer um — derselbe Rueckumlauf
    // wie in Weg A, damit die zwei Messungen vergleichbar sind.
    await page.keyboard.press('p');
    await page.waitForTimeout(350);
    const bNach = await stand(page);

    expect(
        { zug: aNach.zug, daten: aNach.daten },
        `"◀ Zurueck" aus Runde 2 muss denselben Stand liefern, egal wie Runde 2 ` +
            `erreicht wurde. Weg A (ueber "n"): ${kurz(aVor)} -> ${kurz(aNach)}. ` +
            `Weg B (ueber Shift+N): ${kurz(bVor)} -> ${kurz(bNach)}.`
    ).toEqual({ zug: bNach.zug, daten: bNach.daten });
});

// ===========================================================================
// (4) MIT DEM FINGER, auf dem Telefon — dieselbe Zusage an den Knoepfen selbst
// ===========================================================================
//
// WARUM NICHT NUR MIT DER TASTATUR. Der Befund wurde am TABLET gemeldet: der
// Spielleiter tippt "▶ Naechster", bis die Anzeige umschlaegt, und dann
// "⏭️ Neue Runde". Die zwei Wege (Taste und Knopf) laufen in dieselben
// Funktionen, aber das ist eine Annahme ueber den Code — hier wird sie
// gemessen. `hasTouch` ist gesetzt, getippt wird mit `.tap()`.
test.describe('mit dem Finger', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    // Die Fallnummer steht am `test`, nicht an der Gruppe: DOC-10 in
    // `tests/unit/docs-consistency.test.js` sucht `test('(4)` und findet ein
    // `test.describe('(4)` nicht — eine Nennung in der Kuerzeltabelle von
    // CLAUDE.md waere dann lautlos unbelegt.
    test('(4) mit dem Finger: "⏭️ Neue Runde" erhoeht auch nach dem Umschlag', async ({ page }) => {
        test.setTimeout(180000);
        await kampfLaden(page, { width: 390, height: 844 });

        const knopf = async wert => {
            const l = page.locator(`[data-action="call"][data-value="${wert}"]`).first();
            await l.scrollIntoViewIfNeeded().catch(() => {});
            expect(await l.count(), `Kein Knopf fuer ${wert}`).toBeGreaterThan(0);
            return l;
        };
        const naechster = await knopf('nextTurn');
        const neueRunde = await knopf('nextEncounterRound');

        const start = await stand(page);
        expect(start.daten, `Ausgangsstand ${kurz(start)}`).toBe(1);

        // BIS ZUM UMSCHLAG TIPPEN, nicht sechsmal blind. Sechs Kaempfer heissen
        // sechs Tipper — aber der erste Tipp kann am Einrollen des Knopfes
        // verlorengehen (gemessen: nach sechs Tippern stand der Zug auf 5, also
        // war einer nicht angekommen). Eine blinde Zahl haette den Fall mit
        // einer Meldung ueber den FALSCHEN Grund rot gestellt. Es wird darum
        // getippt, bis die Runde umschlaegt, und die Zahl der Tipper steht in
        // der Meldung.
        let tipper = 0;
        while (tipper < 12 && (await stand(page)).daten === 1) {
            await naechster.tap();
            tipper++;
            await page.waitForTimeout(200);
        }
        const nachUmschlag = await stand(page);
        expect(
            nachUmschlag.daten,
            `Nach ${tipper}x Tippen auf "▶ Naechster" erwartet Runde 2, gemessen ${kurz(nachUmschlag)}`
        ).toBe(2);
        expect(
            tipper,
            `Der Umschlag kam nach ${tipper} Tippern — bei sechs Kaempfern muessen ` +
                `es sechs oder sieben sein (einer kann am Einrollen verlorengehen)`
        ).toBeLessThanOrEqual(7);
        expect(
            nachUmschlag.anzeigeSichtbar,
            'Die Rundenanzeige liegt auf dem Telefon nicht im Fenster — dann ist ' +
                'die gemessene Zahl kein Beleg fuer das, was der Spielleiter liest'
        ).toBe(true);

        await neueRunde.tap();
        await page.waitForTimeout(500);
        const nachRunde = await stand(page);
        expect(
            nachRunde.daten,
            `Ein Tipp auf "⏭️ Neue Runde" muss die Runde auf 3 setzen — gemessen ` +
                `${kurz(nachRunde)}, Log ${JSON.stringify(nachRunde.rundenLog)}`
        ).toBe(3);
        expect(nachRunde.anzeige, 'Die Anzeige folgt den Daten nicht').toBe('3');
        expect(
            logRunde(nachRunde),
            `Das Log meldet eine andere Runde als die Daten: Log ` +
                `${JSON.stringify(nachRunde.rundenLog)} gegen Daten ${nachRunde.daten}`
        ).toBe(nachRunde.daten);
    });
});

// ===========================================================================
// (5) EIN ZAEHLER, NICHT ZWEI — die Ursache, nicht nur ihre Wirkung
// ===========================================================================
//
// WARUM DIESER FALL EXTRA STEHT, obwohl (1) bis (4) die Wirkung messen: eine
// zweite Modulglobale neben `D.initiative.round` kann jederzeit wieder
// entstehen, und sie faellt erst dann auf, wenn jemand genau die Reihenfolge
// faehrt, die (1) faehrt. Dieser Fall nagelt die Quelle fest: nach JEDER der
// drei Handlungen muss `D.initiative.round` die Zahl auf dem Schirm sein, und
// `resetEncounter()` muss beide auf 1 bringen.
test('(5) die Anzeige folgt nach jeder der drei Handlungen D.initiative.round', async ({
    page
}) => {
    test.setTimeout(180000);
    await kampfLaden(page);

    /** @type {string[]} */
    const abweichungen = [];
    const pruefe = async marke => {
        const s = await stand(page);
        if (s.anzeige !== String(s.daten)) {
            abweichungen.push(`${marke}: Anzeige "${s.anzeige}" gegen Daten ${s.daten}`);
        }
        return s;
    };

    for (let i = 0; i < 8; i++) {
        await page.keyboard.press('n');
        await page.waitForTimeout(140);
        await pruefe(`n #${i + 1}`);
    }
    for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Shift+N');
        await page.waitForTimeout(300);
        await pruefe(`Shift+N #${i + 1}`);
    }
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('p');
        await page.waitForTimeout(140);
        await pruefe(`p #${i + 1}`);
    }
    expect(abweichungen, 'Anzeige und Daten liefen auseinander').toEqual([]);

    // Zuruecksetzen bringt beide auf 1 — ohne `confirm()` haengt der Lauf.
    await page.evaluate(() => {
        window.confirm = () => true;
        window.resetEncounter();
    });
    await page.waitForTimeout(400);
    const nachReset = await pruefe('resetEncounter');
    expect(
        nachReset.daten,
        `Nach dem Zuruecksetzen erwartet Runde 1, gemessen ${kurz(nachReset)}`
    ).toBe(1);
    expect(abweichungen, 'Anzeige und Daten liefen beim Zuruecksetzen auseinander').toEqual([]);

    // Und von dort aus erhoeht "Neue Runde" wieder auf 2 — der Zaehler ist
    // nicht auf einem alten Stand haengengeblieben.
    await page.keyboard.press('Shift+N');
    await page.waitForTimeout(350);
    const danach = await stand(page);
    expect(
        danach.daten,
        `Nach dem Zuruecksetzen muss Shift+N auf Runde 2 fuehren, gemessen ${kurz(danach)}`
    ).toBe(2);
    expect(logRunde(danach), 'Das Log meldet nach dem Zuruecksetzen die falsche Runde').toBe(2);
});
