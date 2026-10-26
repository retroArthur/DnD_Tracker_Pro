// @ts-check
/**
 * Der Waechter der Rechner-Uebernahme (RECHNER)
 * =============================================
 *
 * DIE AUSSAGE, AUF DIE ES ANKOMMT, in einem Satz: **was der Encounter-Rechner
 * aus einem gespeicherten Encounter in die Initiative bringt, traegt die Werte
 * GENAU DIESES Encounters** — RK, TP (mit der dokumentierten Streuung von
 * +-10 %), Initiative als d20 + Init-Bonus, den Kaempfertyp, den die
 * Initiative fuer Gegner kennt, und damit den Namenslink zurueck zum Eintrag.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * DER BEFUND, aus dem diese Datei entstand — VIER FEHLER AUF EINEM WEG
 *
 * Weg: Encounter-Ansicht → ⚖️ → "📥 Aus Encounters" → "+" → "⚔️ Zur Initiative"
 * (`features/encounter-calculator.js`: importEncounterMonsters(), dann
 * addCalculatorToInitiative()).
 *
 * GEMESSEN am Buendel zu 467af71, 1440x900 UND 390x844 identisch, Seed wie
 * unten (Goblin vor Skelett, beide CR 1/4), Skelett mit Anzahl 2, r = 0,5:
 *
 *   Kaempfer     gespeichert                     angekommen
 *   Skelett #1   RK 13, TP 13, Init +2           RK 15, TP 7, Bonus 16, Init 27, 'monster'
 *   Skelett #2   RK 13, TP 13, Init +2           RK 15, TP 7, Bonus 16, Init 27, 'monster'
 *   Goblin       RK 15, TP 7, Init leer, GES 16  RK 15, TP 7, Bonus 16, Init 27, 'monster'
 *
 * Mit echtem Zufall und GES 14 beim Goblin (Vormessung) kamen die Skelette
 * mit Initiative 29 und 33 an, der Goblin mit 19 — gedacht war d20 + 2.
 *
 * (1) Die "Vorlage" war `D.encounters.find(e => e.cr === monster.cr)` — der
 *     ERSTE Encounter mit gleichem CR, nicht der gewaehlte. Das Skelett kam
 *     mit RK und TP des Goblins an.
 * (2) Der Init-Bonus war `template.initBonus || template.dex` — ein Feld, das
 *     kein Encounter fuehrt, sonst der GES-WERT. Beim Goblin d20 + 16 statt
 *     d20 + 3.
 * (3) `type: 'monster'`. Der Namenslink der Initiative
 *     (getEntityForCombat() in `render/helpers.js`) sucht nur fuer 'enemy' in
 *     den Encountern — kein Kaempfer bekam einen Link, auch "Goblin" nicht,
 *     dessen Name exakt passt. Und "Skelett #1" haette auch als 'enemy' nichts
 *     gefunden: die Suche geht ueber den exakten Namen.
 * (4) Ein Encounter ohne CR ("-- CR --" ist im Formular eine erlaubte Wahl)
 *     brach den Import ab ("Kreatur hat kein CR") — waehrend derselbe Dialog
 *     ihn eine Zeile darueber als "CR 0 - 10 XP" anbot. Dasselbe traf jede
 *     Gruppe, die der Rechner selbst mit "💾 Speichern" ablegt: sie hat
 *     monsters[] und keinen eigenen CR.
 *
 * WAS DAS AM TISCH KOSTET: der Spielleiter waehlt im Rechner ein Skelett und
 * bekommt einen Goblin mit Skelettnamen, der praktisch immer zuerst handelt.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WIE DER ZUFALL HIER BEHERRSCHT WIRD
 *
 * Die Initiative wird gewuerfelt und die TP gestreut — das ist dokumentierte
 * Absicht (CLAUDE.md, "Encounter Calculator": "auto-rolled initiative and HP
 * variation") und bleibt. Ein Init-Skript umhuellt Math.random; NUR waehrend
 * des Klicks auf "⚔️ Zur Initiative" liefert es einen festen Wert, sonst den
 * echten Zufall. Die Formeln stehen in addCalculatorToInitiative():
 *
 *   Initiative = floor(r * 20) + 1 + Bonus         r = 0,5      -> 11 + Bonus
 *   TP         = max(1, round(Basis * (0,9 + 0,2r))) r = 0       -> round(0,9 Basis)
 *                                                    r = 0,999999 -> round(1,1 Basis)
 *
 * Die Faelle (1), (3), (4) und (5) legen r = 0,5 und rechnen exakt; Fall (2)
 * faehrt beide Raender und haelt damit fest, dass die Streuung nicht
 * stillschweigend wegfaellt.
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breit laden — waitForAppReady() wartet auf `.app-title`, und die ist im
 *  Mobil-Layout versteckt. Verkleinert wird erst danach. */
const BREIT = { width: 1440, height: 900 };
const TELEFON = { width: 390, height: 844 };

/** Der Knopf ⚖️ in der Encounter-Ansicht. */
const RECHNER_KNOPF = '[data-action="call"][data-value="showCalculatorModal"]';

/**
 * Drei Encounter. Der Goblin steht VOR dem Skelett und hat denselben CR —
 * genau diese Reihenfolge machte ihn zur "Vorlage" des Skeletts.
 *
 * Die Init-Felder pruefen beide Zweige der Bonusregel:
 *   - Skelett: Init +2 gespeichert, GES 10 (Modifikator +0). Kommt +2 an, hat
 *     das gespeicherte Feld gezaehlt — nicht der Modifikator, nicht der Wert.
 *   - Goblin: Init-Feld leer (gespeichert als 0, die Ansicht zeigt "—"),
 *     GES 16. Kommt +3 an, gilt floor((16 - 10) / 2).
 */
const ENC = {
    goblin: {
        id: 1,
        name: 'Goblin (Rechner-Strang)',
        cr: '1/4',
        ac: 15,
        hp: 7,
        init: 0,
        dex: 16,
        bonus: 3
    },
    skelett: {
        id: 2,
        name: 'Skelett (Rechner-Strang)',
        cr: '1/4',
        ac: 13,
        hp: 13,
        init: 2,
        dex: 10,
        bonus: 2
    },
    ohneCr: {
        id: 3,
        name: 'Bandit ohne CR (Rechner-Strang)',
        cr: '',
        ac: 12,
        hp: 11,
        init: 1,
        dex: 12,
        bonus: 1
    }
};

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
    encounters: [ENC.goblin, ENC.skelett, ENC.ohneCr].map(e => ({
        id: e.id,
        name: e.name,
        cr: e.cr,
        ac: e.ac,
        hp: e.hp,
        init: e.init,
        dex: e.dex
    })),
    initiative: { combatants: [], currentTurn: 0, round: 1 },
    mindmap: { nodes: [], connections: [] },
    calendar: {},
    partyGold: 0,
    quickRefCustom: [],
    _nextId: {
        characters: 1,
        npcs: 1,
        locations: 1,
        quests: 1,
        encounters: 4,
        spells: 1,
        loot: 1,
        items: 1,
        wiki: 1,
        sessionNotes: 1,
        randomTables: 1
    }
};

/**
 * Laedt breit, saet die Kampagne, umhuellt Math.random und oeffnet den
 * Rechner ueber seinen Knopf in der Encounter-Ansicht.
 * @param {import('@playwright/test').Page} page
 * @param {{width: number, height: number}} [kleiner] Erst NACH dem Laden verkleinern
 */
async function rechnerOeffnen(page, kleiner) {
    await page.setViewportSize(BREIT);
    await page.addInitScript(s => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify(s));
        } catch {
            // file://-localStorage ist je Browserbau unterschiedlich streng.
        }
        const echt = Math.random.bind(Math);
        Math.random = () =>
            typeof window.__rechnerZufall === 'number' ? window.__rechnerZufall : echt();
    }, SEED);
    await page.goto(APP_URL);
    await waitForAppReady(page);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.switchView('encounter'));
    await page.waitForTimeout(300);
    if (kleiner) {
        await page.setViewportSize(kleiner);
        await page.waitForTimeout(450);
    }
    await page.locator(RECHNER_KNOPF).first().click();
    await expect(page.locator('#calculator-modal')).toHaveClass(/show/);
}

/**
 * "📥 Aus Encounters" → Anzahl → "+". Wartet, bis der Dialog wieder den
 * Rechner zeigt (das tut er nur nach einem erfolgreichen Import).
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 * @param {number} anzahl
 */
async function importieren(page, id, anzahl) {
    await page.locator('[data-action="calc-show-encounter-import"]').click();
    await expect(page.locator('.calc-import-grid')).toBeVisible();
    await page.fill(`#import-count-${id}`, String(anzahl));
    await page.locator(`[data-action="calc-import-encounter"][data-value="${id}"]`).click();
    await expect(
        page.locator('.calc-import-grid'),
        `Import von Encounter ${id} abgelehnt — der Auswahldialog blieb stehen`
    ).toHaveCount(0);
    await expect(page.locator('#calc-monster-list')).toBeVisible();
}

/**
 * "⚔️ Zur Initiative" mit festem Zufallswert r, danach wieder echter Zufall.
 * Liefert die Kaempfer aus den DATEN und die Zeilen aus der ANZEIGE.
 * @param {import('@playwright/test').Page} page
 * @param {number} r
 * @param {number} erwartet Anzahl der Kaempfer danach
 */
async function zurInitiative(page, r, erwartet) {
    await page.evaluate(wert => {
        window.__rechnerZufall = wert;
    }, r);
    await page.locator('[data-action="calc-add-to-initiative"]').click();
    await page.waitForFunction(
        n =>
            window.D.initiative.combatants.length === n &&
            !!document.querySelector('#init-list .init-row'),
        erwartet
    );
    await page.evaluate(() => {
        delete window.__rechnerZufall;
    });
    return page.evaluate(() => {
        const daten = window.D.initiative.combatants.map(c => ({
            name: c.name,
            type: c.type,
            ac: c.ac,
            maxHp: c.maxHp,
            currentHp: c.currentHp,
            initiative: c.initiative,
            initBonus: c.initBonus,
            cr: c.cr
        }));
        const zeilen = Array.from(document.querySelectorAll('#init-list .init-row')).map(r => {
            const name = r.querySelector('.init-name');
            return {
                name: name ? name.textContent.trim() : '',
                link: name ? name.getAttribute('data-action') : null,
                linkTyp: name ? name.getAttribute('data-type') : null,
                linkId: name ? name.getAttribute('data-id') : null,
                typ: (r.querySelector('.init-type')?.textContent || '').trim(),
                rk: (r.querySelector('.init-ac')?.textContent || '').replace(/\D/g, ''),
                tp: (r.querySelector('.init-hp-value')?.textContent || '').trim(),
                init: (r.querySelector('.init-value')?.textContent || '').trim()
            };
        });
        return { daten, zeilen };
    });
}

/**
 * Das Urteil fuer EINEN Kaempfer aus einem gespeicherten Encounter: Daten und
 * Zeile tragen dessen Werte, den Gegnertyp und den Link auf GENAU diesen
 * Eintrag.
 * @param {{daten: any[], zeilen: any[]}} stand
 * @param {string} name
 * @param {typeof ENC.goblin} enc
 * @param {{init: number, tp: number}} soll
 */
function pruefeKaempfer(stand, name, enc, soll) {
    const d = stand.daten.find(c => c.name === name);
    const z = stand.zeilen.find(c => c.name === name);
    expect(d, `Kaempfer "${name}" fehlt in D.initiative.combatants`).toBeTruthy();
    expect(z, `Zeile "${name}" fehlt in #init-list`).toBeTruthy();
    // Weich, damit ein roter Lauf ALLE Kaempfer zeigt, nicht nur den ersten.
    const datenIst = {
        name,
        ac: d.ac,
        maxHp: d.maxHp,
        currentHp: d.currentHp,
        initiative: d.initiative,
        initBonus: d.initBonus,
        type: d.type
    };
    const datenSoll = {
        name,
        ac: enc.ac,
        maxHp: soll.tp,
        currentHp: soll.tp,
        initiative: soll.init,
        initBonus: enc.bonus,
        type: 'enemy'
    };
    expect.soft(datenIst).toEqual(datenSoll);
    const zeileIst = {
        name,
        rk: z.rk,
        tp: z.tp,
        init: z.init,
        typ: z.typ.split(' ')[0],
        link: z.link,
        linkTyp: z.linkTyp,
        linkId: z.linkId
    };
    const zeileSoll = {
        name,
        rk: String(enc.ac),
        tp: `${soll.tp}/${soll.tp}`,
        init: String(soll.init),
        typ: 'Gegner',
        link: 'navigate-entity-stop',
        linkTyp: 'encounters',
        linkId: String(enc.id)
    };
    expect.soft(zeileIst).toEqual(zeileSoll);
}

test.describe('Encounter-Rechner → Initiative: die Werte des gewaehlten Encounters (RECHNER)', () => {
    for (const [titel, fenster] of [
        ['Desktop 1440x900', undefined],
        ['Telefon 390x844', TELEFON]
    ]) {
        test(`(1) zwei Encounter gleichen CRs tragen je ihre eigenen Werte — ${titel}`, async ({
            page
        }) => {
            await rechnerOeffnen(page, fenster);
            await importieren(page, ENC.skelett.id, 2);
            await importieren(page, ENC.goblin.id, 1);
            const stand = await zurInitiative(page, 0.5, 3);

            // r = 0,5: Initiative 11 + Bonus, TP genau die gespeicherten.
            pruefeKaempfer(stand, `${ENC.skelett.name} #1`, ENC.skelett, {
                init: 11 + ENC.skelett.bonus,
                tp: ENC.skelett.hp
            });
            pruefeKaempfer(stand, `${ENC.skelett.name} #2`, ENC.skelett, {
                init: 11 + ENC.skelett.bonus,
                tp: ENC.skelett.hp
            });
            pruefeKaempfer(stand, ENC.goblin.name, ENC.goblin, {
                init: 11 + ENC.goblin.bonus,
                tp: ENC.goblin.hp
            });
        });
    }

    test('(2) die Streuung bleibt: Initiative 1+Bonus bis 20+Bonus, TP 90 % bis 110 %', async ({
        page
    }) => {
        await rechnerOeffnen(page);
        await importieren(page, ENC.skelett.id, 1);
        await importieren(page, ENC.goblin.id, 1);

        const unten = await zurInitiative(page, 0, 2);
        pruefeKaempfer(unten, ENC.skelett.name, ENC.skelett, {
            init: 1 + ENC.skelett.bonus,
            tp: Math.max(1, Math.round(ENC.skelett.hp * 0.9))
        });
        pruefeKaempfer(unten, ENC.goblin.name, ENC.goblin, {
            init: 1 + ENC.goblin.bonus,
            tp: Math.max(1, Math.round(ENC.goblin.hp * 0.9))
        });

        // Zweiter Durchlauf im selben Rechner: Initiative leeren, erneut uebernehmen.
        await page.evaluate(() => {
            window.D.initiative.combatants = [];
            window.switchView('encounter');
        });
        await page.locator(RECHNER_KNOPF).first().click();
        await expect(page.locator('#calculator-modal')).toHaveClass(/show/);
        const oben = await zurInitiative(page, 0.999999, 2);
        pruefeKaempfer(oben, ENC.skelett.name, ENC.skelett, {
            init: 20 + ENC.skelett.bonus,
            tp: Math.max(1, Math.round(ENC.skelett.hp * 1.1))
        });
        pruefeKaempfer(oben, ENC.goblin.name, ENC.goblin, {
            init: 20 + ENC.goblin.bonus,
            tp: Math.max(1, Math.round(ENC.goblin.hp * 1.1))
        });
    });

    test('(3) ein Encounter ohne CR ist importierbar — zaehlt als Monster, mit 0 XP', async ({
        page
    }) => {
        await rechnerOeffnen(page);
        // Party, damit der Rechner ueberhaupt rechnet: 4x Stufe 1.
        await page.fill('#calc-party-level', '1');
        await page.fill('#calc-party-count', '4');
        await page.locator('[data-action="calc-add-party-level"]').click();

        // Der Dialog verspricht, was der Rechner danach zaehlt.
        await page.locator('[data-action="calc-show-encounter-import"]').click();
        const karte = page.locator('.calc-import-card', { hasText: ENC.ohneCr.name });
        const meta = (await karte.locator('.calc-import-meta').textContent()) || '';
        expect.soft(meta, 'Dialog-Angabe fuer den Encounter ohne CR').toMatch(/(^|\D)0 XP\b/);
        expect.soft(meta, 'kein ausgedachter CR 0').not.toMatch(/CR 0\b/);
        await page.locator('[data-action="calc-back-to-calculator"]').first().click();

        await importieren(page, ENC.goblin.id, 1);
        await importieren(page, ENC.ohneCr.id, 1);

        const liste = (await page.locator('#calc-monster-list').textContent()) || '';
        expect(liste).toContain(ENC.ohneCr.name);
        expect(liste).not.toMatch(/undefined|NaN/);
        // 50 XP Goblin + 0 XP ohne CR; zwei Monster bei vier Spielern -> x1,5.
        const ergebnis = (await page.locator('#calc-results').textContent()) || '';
        expect(ergebnis).not.toMatch(/NaN/);
        expect(ergebnis.replace(/\s+/g, ' ')).toContain('50 Base × 1.5 (2 Monster)');

        const stand = await zurInitiative(page, 0.5, 2);
        pruefeKaempfer(stand, ENC.ohneCr.name, ENC.ohneCr, {
            init: 11 + ENC.ohneCr.bonus,
            tp: ENC.ohneCr.hp
        });
        const zeile = stand.zeilen.find(z => z.name === ENC.ohneCr.name);
        expect(zeile.typ, 'ohne CR steht kein CR in der Zeile').not.toMatch(/CR/);
    });

    test('(4) manuell nach CR gewaehlt: Typ und Vorlage wie bisher, Initiative mit Modifikator', async ({
        page
    }) => {
        // Kein gespeicherter Encounter gewaehlt — nur CR und Name im Rechner.
        // Bisheriges Verhalten, das BLEIBT: Vorlage ist der erste gespeicherte
        // Encounter mit diesem CR (hier der Goblin), Typ 'monster', kein Link.
        // Was NICHT bleibt: d20 + GES-Wert. Derselbe Fehler wie (2) im Befund.
        await rechnerOeffnen(page);
        await page.fill('#calc-monster-cr', '1/4');
        await page.fill('#calc-monster-count', '1');
        await page.fill('#calc-monster-name', 'Ork von Hand');
        await page.locator('[data-action="calc-add-monster"]').click();

        const stand = await zurInitiative(page, 0.5, 1);
        const d = stand.daten[0];
        const z = stand.zeilen[0];
        expect({
            type: d.type,
            ac: d.ac,
            maxHp: d.maxHp,
            initBonus: d.initBonus,
            initiative: d.initiative,
            link: z.link,
            typ: z.typ.split(' ')[0]
        }).toEqual({
            type: 'monster',
            ac: ENC.goblin.ac,
            maxHp: ENC.goblin.hp,
            initBonus: ENC.goblin.bonus,
            initiative: 11 + ENC.goblin.bonus,
            link: null,
            typ: 'Monster'
        });
    });

    test('(5) eine mit "💾 Speichern" abgelegte Gruppe kommt als ihre Monster zurueck', async ({
        page
    }) => {
        // "💾 Speichern" legt KEINE Kreatur ab, sondern eine Gruppe: monsters[],
        // ohne eigenen CR, RK und TP. Sie ist der zweite Encounter ohne CR, den
        // die App selbst erzeugt — und der einzige, den sie in Serie erzeugt.
        // Als Kreatur mit 0 XP uebernommen waere sie so falsch wie abgelehnt.
        page.on('dialog', d => d.dismiss()); // "Zu Encounters wechseln?" — nein
        await rechnerOeffnen(page);
        await importieren(page, ENC.skelett.id, 2);
        await page.locator('[data-action="calc-save-encounter"]').click();
        const gruppe = await page.evaluate(() => {
            const g = window.D.encounters[window.D.encounters.length - 1];
            return { id: g.id, cr: g.cr || '', typen: (g.monsters || []).length };
        });
        expect(gruppe, 'die gespeicherte Gruppe').toMatchObject({ cr: '', typen: 1 });
        await page.locator('[data-action="calc-clear-monsters"]').click();

        await page.locator('[data-action="calc-show-encounter-import"]').click();
        const meta = await page
            .locator(`#import-count-${gruppe.id}`)
            .locator('xpath=ancestor::div[contains(@class,"calc-import-card")]')
            .locator('.calc-import-meta')
            .textContent();
        // Zwei Skelette zu je 50 XP — nicht "CR 0 - 10 XP", nicht "0 XP".
        expect.soft(meta, 'Dialog-Angabe fuer die Gruppe').toMatch(/(^|\D)100 XP\b/);
        await page.locator('[data-action="calc-back-to-calculator"]').first().click();
        await importieren(page, gruppe.id, 1);

        const liste = ((await page.locator('#calc-monster-list').textContent()) || '').replace(
            /\s+/g,
            ' '
        );
        expect(liste).toContain(`2× ${ENC.skelett.name}`);
        expect(liste).toContain('CR 1/4 (50 XP)');

        const stand = await zurInitiative(page, 0.5, 2);
        for (const nr of [1, 2]) {
            pruefeKaempfer(stand, `${ENC.skelett.name} #${nr}`, ENC.skelett, {
                init: 11 + ENC.skelett.bonus,
                tp: ENC.skelett.hp
            });
        }
    });
});
