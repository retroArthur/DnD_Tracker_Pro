// @ts-check
/**
 * T-D — Einstieg, Fokusfalle und Rueckkehr zum Oeffner (TAST, Schritte 7+8)
 * ============================================================================
 *
 * WAS HIER GEPRUEFT WIRD, IN EINEM SATZ: dass ein offener Dialog die Tastatur
 * festhaelt — der Fokus landet beim Oeffnen innen, bleibt drin, und kehrt beim
 * Schliessen auf die Schaltflaeche zurueck, die den Dialog geoeffnet hat.
 *
 * WARUM ES DAS BRAUCHT. Gemessen am gebauten Buendel, gefuellte Kampagne,
 * 1440 px, echte Tabulatorspruenge, je Modal ein frischer Seitenaufbau
 * (Ausgangslage HEAD 392d1d3, Stand 2026-10-13):
 *
 *                                        6 Eintraege/Typ   20 Eintraege/Typ
 *   Modale geprueft / geoeffnet              36 / 36            36 / 36
 *   Fokus landet beim Oeffnen INNEN           2 / 36             2 / 36
 *   Fokusfalle haelt (0 Austritte / 45)       0 / 36             0 / 36
 *   Summe Austritte (45 Spruenge je Modal)     1396               1610
 *   davon verdeckt UND bedienbar               1333               1606
 *   Escape schliesst                         35 / 36            35 / 36
 *   Rueckkehr zum Oeffner                     0 / 36             0 / 36
 *   role="dialog" im DOM                      0 / 36             0 / 36
 *   aria-modal im DOM                         0 / 36             0 / 36
 *
 * Die Zeile, auf die es am Spieltisch ankommt, ist die vierte von unten: 1333
 * bzw. 1606 Halte liegen UNTER der Dialogflaeche — sichtbar nicht, auslösbar
 * ja. Der Spielleiter tabuliert aus einem offenen Dialog in einen Hintergrund,
 * den er nicht sieht, und bedient dort mit der Leertaste etwas, das er nicht
 * gewollt hat. Und die Zahl WAECHST mit der Kampagne: 1333 -> 1606 bei
 * zwanzig statt sechs Eintraegen je Typ. Darum laeuft jeder Fall hier bei
 * ZWEI Groessen.
 *
 * DIE TABELLE OBEN IST MIT FRISCHEM SEITENAUFBAU JE MODAL GEMESSEN
 * (modalsweep.mjs im Scratchpad). DIESE DATEI laedt die Seite EINMAL je Fall
 * und geht die 36 Schalen danach in einem Lauf durch — das ist schneller und
 * fuer die Zusicherungen gleichwertig, liefert aber andere Summen, weil der
 * Hintergrund zwischen den Schalen nicht zurueckgesetzt wird. Ihre eigenen
 * Ausgangswerte, zweimal reproduziert (1540/1541 Austritte im zweiten Lauf —
 * ein Schritt Flattern, die verdeckte Zahl identisch):
 *
 *                                        6 Eintraege/Typ   20 Eintraege/Typ
 *   (a) Einstieg: Fokus NICHT innen         34 / 36            34 / 36
 *   (b) keine Rueckkehr zum Oeffner         36 / 36            36 / 36
 *   (d) Summe Austritte                      1540                1421
 *   (d) davon verdeckt UND bedienbar          1499                1343
 *   (e) Beschriftung fehlt                  36 / 36                 —
 *   (f) blanker showModal(): Fokus auf     <body>                  —
 *
 * Dass (d) bei 20 Eintraegen NIEDRIGER liegt als bei 6, ist kein Widerspruch
 * zur Skalierung oben: ohne Seitenaufbau je Modal haengt die Zahl davon ab,
 * wie viele Hintergrundhalte der Tabulator in 45 Spruengen ueberhaupt
 * erreicht, und bei zwanzig Eintraegen bleibt er laenger in derselben langen
 * Liste. Die Skalierungsaussage stammt aus der Tabelle oben, nicht hier.
 *
 * ZWEI MESSFALLEN, in die die Vermessung im ersten Durchgang gelaufen ist und
 * die diese Datei ausdruecklich vermeidet:
 *
 *   (1) DER RUECKWEG BRAUCHT ZWISCHENZEITLICHE TABULATORSPRUENGE. Prueft man
 *       "Fokus nach Escape == Oeffner" ohne sie, hat der Fokus den Oeffner nie
 *       verlassen — die Zusicherung ist dann gruen, ohne dass eine Zeile
 *       Rueckweg existiert. Darum wird hier VOR dem Escape vier Mal im Dialog
 *       tabuliert UND gegengeprueft, dass der Fokus den Oeffner dabei
 *       tatsaechlich verlassen hat (`nochAufOeffner` muss falsch sein, sonst
 *       scheitert der Fall mit eigener Meldung).
 *
 *   (2) DER OEFFNER WIRD UEBER OBJEKTIDENTITAET FESTGEHALTEN
 *       (`window.__oeffner`, Vergleich mit `===`), nie ueber Signatur oder
 *       Text. Eine Suche nach Klasse oder Beschriftung trifft nach dem Oeffnen
 *       ein anderes Element als vorher.
 *
 * ALLES MIT ECHTEN TASTENDRUECKEN. Kein `.focus()`, kein `element.click()` auf
 * ein Ziel. Ein programmatisches `.focus()` wuerde den Einstieg messen, den
 * der Test selbst erzeugt hat.
 *
 * #quicknotes-modal IST DER 36. FALL UND GEHOERT DAZU. Es traegt
 * `.modal-backdrop` statt `.modal-overlay` (assets/templates/modals-tools.html:194)
 * und faellt damit aus dem Selektor des Escape-Zweigs — gemessen: es
 * schliesst auf Escape NICHT. Die Vermessung hat es uebersehen, weil sie die
 * Schalenliste aus `.modal-overlay` gebildet hat. Darum steht es hier
 * ausdruecklich in der Liste und nicht im Selektor.
 *
 * DER OEFFNER VON #conditions-modal IST showConditionsModal, NICHT
 * showConditionReference. Letzteres baut den Spickzettel als fluechtige Schale
 * und laesst #conditions-modal zu; die OPENERS-Tabelle der Vermessung hatte
 * hier die falsche Funktion, und ihr Befund "conditions-modal oeffnet nicht"
 * war ein Messfehler, kein Mangel der App.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../helpers/test-utils.js';

const APP_URL = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;

/** Breite der Vermessung. Unter 901 px greifen andere Media-Queries. */
const BREIT = { width: 1440, height: 900 };

/** Zwei Kampagnengroessen — die Schuld skaliert mit den Daten. */
const GROESSEN = [6, 20];

/** Tabulatorspruenge im offenen Dialog (Abnahmewert aus dem Plan). */
const SCHRITTE = 45;

/** Spruenge im Dialog VOR dem Escape — der Fokus muss den Oeffner verlassen. */
const INNEN_VOR_ESC = 4;

/** Echte Spruenge VOR dem Oeffnen — so entsteht ein echter Oeffner. */
const VORLAUF = 6;

/**
 * Modale mit eigenem Oeffner. Alle uebrigen gehen generisch ueber
 * `showModal(id)` — das ist der Weg, den 61 Aufrufstellen im Quellbaum
 * nehmen.
 */
const OEFFNER = {
    'hp-calc-modal': "window.showHpCalculator('characters', 1)",
    'npc-modal': 'window.editNPC(1)',
    'assign-spell-modal': 'window.showAssignSpells(1)',
    'char-detail-modal': 'window.showCharacterDetails(1)',
    'conditions-modal': "window.showConditionsModal('characters', 1)",
    'avatar-modal':
        "window.showAvatarModal ? window.showAvatarModal('characters', 1) : window.showModal('avatar-modal')",
    'notes-search-modal':
        "window.showNotesSearch ? window.showNotesSearch() : window.showModal('notes-search-modal')",
    'quicknotes-modal': 'window.showQuickNotesModal()'
};

/**
 * Gefuellte Kampagne mit `n` Eintraegen je Typ. Dieselbe Form wie in
 * `tastatur-erreichbarkeit.spec.js` — die Kaempfer tragen ANDERE Namen als
 * die Charaktere, damit `addPartyToInit()` nichts ueberspringt.
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
            name: `Charakter ${i + 1} (T-D)`,
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
        spells: liste('Zauber', { level: 1, school: 'Hervorrufung', spellClass: 'Magier' }),
        wiki: liste('Wiki', { title: 'Wiki', category: 'Allgemein' }),
        sessionNotes: liste('Sitzung', { title: 'Sitzung', date: '2026-01-01' }),
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
        quickRefCustom: []
    };
}

/**
 * Frischer Seitenaufbau mit gefuellter Kampagne.
 * @param {import('@playwright/test').Page} page
 * @param {number} n
 */
async function appLaden(page, n) {
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
}

/**
 * Die Liste der zu pruefenden Schalen: alle `.modal-overlay` aus den
 * Vorlagen plus `#quicknotes-modal`, das `.modal-backdrop` traegt und
 * darum aus jedem `.modal-overlay`-Selektor faellt.
 * @param {import('@playwright/test').Page} page
 */
async function schalenListe(page) {
    const ids = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.modal-overlay'))
            .map(n => n.id)
            .filter(Boolean)
    );
    return ids.concat(['quicknotes-modal']);
}

/** Ausdruck, der die Schale `id` oeffnet. */
function oeffnerAusdruck(id) {
    return OEFFNER[id] || `window.showModal('${id}')`;
}

/**
 * Oeffnet `id` und meldet den Zustand. Setzt vorher per ECHTEN
 * Tabulatorspruengen einen Oeffner und haelt ihn als `window.__oeffner`
 * ueber Objektidentitaet fest.
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
async function oeffnen(page, id) {
    for (let i = 0; i < VORLAUF; i++) await page.keyboard.press('Tab');
    await page.evaluate(() => {
        window.__oeffner = document.activeElement;
    });
    try {
        await page.evaluate(new Function('return ' + `(() => { ${oeffnerAusdruck(id)}; })`)());
    } catch {
        // Oeffnerfehler werden unten ueber `offen` sichtbar.
    }
    await page.waitForTimeout(400);
    return page.evaluate(mid => {
        const m = document.getElementById(mid);
        if (!m) return { da: false };
        const s = getComputedStyle(m);
        const el = document.activeElement;
        const titel = m.querySelector('.modal-title');
        return {
            da: true,
            offen: m.classList.contains('show') && s.display !== 'none',
            innen: !!(el && m.contains(el)),
            istBody: el === document.body || el === document.documentElement,
            fokusTag: el ? el.tagName : null,
            fokusId: el && el.id ? el.id : null,
            role: m.getAttribute('role'),
            ariaModal: m.getAttribute('aria-modal'),
            ariaLabelledby: m.getAttribute('aria-labelledby'),
            ariaLabel: m.getAttribute('aria-label'),
            titelId: titel ? titel.id || null : null,
            hatTitel: !!titel
        };
    }, id);
}

/**
 * Laeuft `SCHRITTE` echte Tabulatorspruenge im offenen Dialog und zaehlt,
 * wie oft der Fokus die Dialogflaeche verlaesst — und wie viele der
 * erreichten Hintergrundziele VERDECKT und trotzdem bedienbar sind.
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
async function tabulierenImDialog(page, id) {
    await page.evaluate(mid => {
        window.__m = document.getElementById(mid);
        window.__aussen = 0;
        window.__body = 0;
        window.__innen = 0;
        window.__verdecktBedienbar = 0;
        window.__probe = [];
    }, id);
    for (let i = 0; i < SCHRITTE; i++) {
        await page.keyboard.press('Tab');
        await page.evaluate(() => {
            const m = window.__m;
            const el = document.activeElement;
            const istBody = el === document.body || el === document.documentElement;
            if (m && el && m.contains(el)) {
                window.__innen++;
                return;
            }
            if (istBody) {
                window.__body++;
                return;
            }
            window.__aussen++;
            const t = el.tagName;
            const bedienbar =
                !!el.getAttribute('data-action') ||
                t === 'BUTTON' ||
                t === 'A' ||
                t === 'INPUT' ||
                t === 'SELECT' ||
                t === 'TEXTAREA' ||
                el.isContentEditable;
            if (!bedienbar) return;
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            const sichtbar =
                r.width > 0 &&
                r.height > 0 &&
                s.visibility !== 'hidden' &&
                s.display !== 'none' &&
                r.bottom > 0 &&
                r.top < innerHeight &&
                r.right > 0 &&
                r.left < innerWidth;
            if (!sichtbar) return;
            const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
            const cy = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
            const oben = document.elementFromPoint(cx, cy);
            const verdeckt = !(oben === el || el.contains(oben) || (oben && oben.contains(el)));
            if (verdeckt) {
                window.__verdecktBedienbar++;
                if (window.__probe.length < 4) {
                    window.__probe.push(
                        el.tagName +
                            (el.id ? '#' + el.id : '') +
                            (el.getAttribute('data-action')
                                ? '[' + el.getAttribute('data-action') + ']'
                                : '')
                    );
                }
            }
        });
    }
    return page.evaluate(() => ({
        innen: window.__innen,
        aussen: window.__aussen,
        body: window.__body,
        verdecktBedienbar: window.__verdecktBedienbar,
        probe: window.__probe
    }));
}

// ============================================================================
// (a) DER EINSTIEG — der Fokus landet beim Oeffnen IM Dialog
// ============================================================================
test.describe('Modalfokus — der Einstieg', () => {
    for (const n of GROESSEN) {
        test(`(a) jede Schale nimmt den Fokus beim Oeffnen auf — ${n} Eintraege je Typ`, async ({
            page
        }) => {
            test.setTimeout(180000);
            await appLaden(page, n);
            const ids = await schalenListe(page);
            const draussen = [];
            for (const id of ids) {
                const z = await oeffnen(page, id);
                if (!z.da || !z.offen) {
                    draussen.push(`${id}: oeffnet NICHT (da=${z.da}, offen=${z.offen})`);
                } else if (!z.innen) {
                    draussen.push(
                        `${id}: Fokus ${z.istBody ? 'bleibt auf <body>' : 'liegt AUSSERHALB'}` +
                            ` (${z.fokusTag}${z.fokusId ? '#' + z.fokusId : ''})`
                    );
                }
                await page.keyboard.press('Escape');
                await page.waitForTimeout(120);
                await page.evaluate(mid => {
                    // Rest sicher abraeumen, damit die naechste Schale frei liegt.
                    const m = document.getElementById(mid);
                    if (m) {
                        m.classList.remove('show');
                        if (mid === 'quicknotes-modal') m.style.display = 'none';
                    }
                }, id);
            }
            expect(
                draussen,
                `Der Fokus muss beim Oeffnen IM Dialog landen. ${draussen.length} von ` +
                    `${ids.length} Schalen tun das nicht:\n  ` +
                    draussen.join('\n  ')
            ).toEqual([]);
        });
    }
});

// ============================================================================
// (b) DER RUECKWEG — nach Escape liegt der Fokus auf dem Oeffner
// ============================================================================
test.describe('Modalfokus — die Rueckkehr zum Oeffner', () => {
    for (const n of GROESSEN) {
        test(`(b) nach Escape kehrt der Fokus auf den Oeffner zurueck — ${n} Eintraege je Typ`, async ({
            page
        }) => {
            test.setTimeout(180000);
            await appLaden(page, n);
            const ids = await schalenListe(page);
            const verloren = [];
            const nieVerlassen = [];
            for (const id of ids) {
                const z = await oeffnen(page, id);
                if (!z.da || !z.offen) {
                    verloren.push(`${id}: oeffnet NICHT`);
                    continue;
                }
                // Messfalle (1): der Fokus MUSS den Oeffner verlassen haben,
                // sonst ist die Zusicherung unten ohne Aussage.
                for (let i = 0; i < INNEN_VOR_ESC; i++) await page.keyboard.press('Tab');
                const vorEsc = await page.evaluate(
                    () => document.activeElement === window.__oeffner
                );
                if (vorEsc) nieVerlassen.push(id);
                await page.keyboard.press('Escape');
                await page.waitForTimeout(250);
                const nach = await page.evaluate(mid => {
                    const m = document.getElementById(mid);
                    const el = document.activeElement;
                    const s = m ? getComputedStyle(m) : null;
                    return {
                        nochOffen: !!(m && m.classList.contains('show') && s.display !== 'none'),
                        aufOeffner: el === window.__oeffner,
                        istBody: el === document.body,
                        tag: el ? el.tagName : null,
                        id: el && el.id ? el.id : null
                    };
                }, id);
                if (nach.nochOffen) {
                    verloren.push(`${id}: Escape schliesst den Dialog NICHT`);
                } else if (!nach.aufOeffner) {
                    verloren.push(
                        `${id}: Fokus nach Escape ${nach.istBody ? 'auf <body>' : 'woanders'}` +
                            ` (${nach.tag}${nach.id ? '#' + nach.id : ''}), nicht auf dem Oeffner`
                    );
                }
                await page.evaluate(mid => {
                    const m = document.getElementById(mid);
                    if (m) {
                        m.classList.remove('show');
                        if (mid === 'quicknotes-modal') m.style.display = 'none';
                    }
                }, id);
            }
            expect(
                nieVerlassen,
                'KONTROLLE DER MESSUNG: bei diesen Schalen hat der Fokus den Oeffner nie ' +
                    'verlassen — die Zusicherung unten waere dort ohne Aussage (genau dieser ' +
                    'Trugschluss ist der Vermessung im ersten Durchgang passiert):\n  ' +
                    nieVerlassen.join('\n  ')
            ).toEqual([]);
            expect(
                verloren,
                `Nach Escape muss der Fokus auf dem Oeffner liegen. ${verloren.length} von ` +
                    `${ids.length} Schalen tun das nicht:\n  ` +
                    verloren.join('\n  ')
            ).toEqual([]);
        });
    }
});

// ============================================================================
// (c) DAS SELEKTORLOCH — #quicknotes-modal schliesst auf Escape
// ============================================================================
test.describe('Modalfokus — das Selektorloch von #quicknotes-modal', () => {
    test('(c) #quicknotes-modal schliesst auf Escape wie jede andere Schale', async ({ page }) => {
        await appLaden(page, 6);
        await page.evaluate(() => window.showQuickNotesModal());
        await page.waitForTimeout(350);
        const offen = await page.evaluate(() => {
            const m = document.getElementById('quicknotes-modal');
            return !!(m && m.classList.contains('show') && getComputedStyle(m).display !== 'none');
        });
        expect(offen, 'Vorbedingung: die Schale muss offen sein').toBe(true);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const nochOffen = await page.evaluate(() => {
            const m = document.getElementById('quicknotes-modal');
            return !!(m && m.classList.contains('show') && getComputedStyle(m).display !== 'none');
        });
        expect(
            nochOffen,
            '#quicknotes-modal traegt `.modal-backdrop` statt `.modal-overlay` ' +
                '(assets/templates/modals-tools.html:194) und faellt damit aus dem Selektor ' +
                'des Escape-Zweigs in systems/spellslots/keyboard-shortcuts.js. Gemessen ' +
                'bleibt es auf Escape offen — als einzige von 36 Schalen.'
        ).toBe(false);
    });
});

// ============================================================================
// (d) DIE FOKUSFALLE — der Tabulator verlaesst den offenen Dialog nicht
// ============================================================================
test.describe('Modalfokus — die Fokusfalle', () => {
    for (const n of GROESSEN) {
        test(`(d) ${SCHRITTE} echte Spruenge bleiben im Dialog — ${n} Eintraege je Typ`, async ({
            page
        }) => {
            test.setTimeout(600000);
            await appLaden(page, n);
            const ids = await schalenListe(page);
            const ausbrueche = [];
            let summeAussen = 0;
            let summeVerdeckt = 0;
            for (const id of ids) {
                const z = await oeffnen(page, id);
                if (!z.da || !z.offen) {
                    ausbrueche.push(`${id}: oeffnet NICHT`);
                    continue;
                }
                const lauf = await tabulierenImDialog(page, id);
                summeAussen += lauf.aussen + lauf.body;
                summeVerdeckt += lauf.verdecktBedienbar;
                if (lauf.aussen + lauf.body > 0) {
                    ausbrueche.push(
                        `${id}: ${lauf.innen}/${SCHRITTE} innen, ` +
                            `${lauf.aussen} aussen + ${lauf.body} auf <body>, ` +
                            `davon ${lauf.verdecktBedienbar} VERDECKT und trotzdem bedienbar` +
                            (lauf.probe.length ? ` [z.B. ${lauf.probe.join(', ')}]` : '')
                    );
                }
                await page.keyboard.press('Escape');
                await page.waitForTimeout(120);
                await page.evaluate(mid => {
                    const m = document.getElementById(mid);
                    if (m) {
                        m.classList.remove('show');
                        if (mid === 'quicknotes-modal') m.style.display = 'none';
                    }
                }, id);
            }
            expect(
                ausbrueche,
                `Der Tabulator muss im offenen Dialog im Kreis laufen. Summe der Austritte ` +
                    `ueber alle ${ids.length} Schalen: ${summeAussen}, davon ` +
                    `${summeVerdeckt} auf Ziele, die UNTER der Dialogflaeche liegen und ` +
                    `trotzdem auslösbar sind. Betroffene Schalen:\n  ` +
                    ausbrueche.join('\n  ')
            ).toEqual([]);
        });
    }
});

// ============================================================================
// (e) DIE BESCHRIFTUNG — role="dialog" und aria-modal (O-8)
// ============================================================================
test.describe('Modalfokus — die Beschriftung fuer Vorlesesoftware', () => {
    test('(e) jede offene Schale traegt role="dialog" und aria-modal="true"', async ({ page }) => {
        test.setTimeout(180000);
        await appLaden(page, 6);
        const ids = await schalenListe(page);
        const ohne = [];
        for (const id of ids) {
            const z = await oeffnen(page, id);
            if (!z.da || !z.offen) {
                ohne.push(`${id}: oeffnet NICHT`);
            } else {
                const fehlt = [];
                if (z.role !== 'dialog') fehlt.push(`role="${z.role || '-'}"`);
                if (z.ariaModal !== 'true') fehlt.push(`aria-modal="${z.ariaModal || '-'}"`);
                // Ein Dialog braucht einen Namen. Entweder aria-labelledby auf
                // den Titel oder — wo es keinen `.modal-title` gibt — aria-label.
                if (!z.ariaLabelledby && !z.ariaLabel)
                    fehlt.push('weder aria-labelledby noch aria-label');
                if (fehlt.length) ohne.push(`${id}: ${fehlt.join(', ')}`);
            }
            await page.keyboard.press('Escape');
            await page.waitForTimeout(120);
            await page.evaluate(mid => {
                const m = document.getElementById(mid);
                if (m) {
                    m.classList.remove('show');
                    if (mid === 'quicknotes-modal') m.style.display = 'none';
                }
            }, id);
        }
        expect(
            ohne,
            `Vorbild im Haus: features/command-palette/command-palette.js:20-22 steht zur ` +
                `Laufzeit mit role+aria-modal+aria-label im DOM. ${ohne.length} von ` +
                `${ids.length} Schalen fehlt etwas davon:\n  ` +
                ohne.join('\n  ')
        ).toEqual([]);
    });
});

// ============================================================================
// (f) O-4 — der Haken sitzt IN showModal, nicht in einem window-Mantel
// ============================================================================
test.describe('Modalfokus — kein window.showModal-Mantel (O-4)', () => {
    test('(f) ein blanker showModal()-Aufruf aus ui/actions fuehrt den Fokus genauso', async ({
        page
    }) => {
        await appLaden(page, 6);
        // `ui/actions/ui-actions.js:8` ruft `showModal(ctx.value)` BLANK — der
        // Aufruf bindet lexikalisch an die Funktionsdeklaration in
        // systems/spellslots/navigation.js und geht an jedem `window.showModal`-
        // Mantel vorbei. Genau die Falle, die CLAUDE.md fuer `save()`
        // dokumentiert. Dieser Fall faehrt den Verteilerweg und prueft, dass
        // der Fokus trotzdem im Dialog landet.
        const ergebnis = await page.evaluate(() => {
            // Genau die Funktion, die der Verteiler bei einem Klick ausfuehrt.
            // `EventDelegation` ist ein globales `const` und steht NICHT an
            // `window` — der Zugriff laeuft ueber den blanken Namen, so wie ihn
            // auch ui/actions/ui-actions.js:237 nimmt.
            const reg = typeof EventDelegation !== 'undefined' ? EventDelegation : null;
            const handler = reg && reg._handlers && reg._handlers.get('show-modal');
            if (typeof handler !== 'function') return { weg: 'kein Handler' };
            handler({ value: 'about-modal' });
            const m = document.getElementById('about-modal');
            const el = document.activeElement;
            return {
                weg: 'Verteiler',
                offen: !!(m && m.classList.contains('show')),
                innen: !!(m && el && m.contains(el)),
                fokus: el ? el.tagName + (el.id ? '#' + el.id : '') : null
            };
        });
        expect(
            ergebnis.weg,
            'Vorbedingung: der Verteiler muss einen `show-modal`-Handler fuehren — ' +
                'ohne ihn ist der blanke Aufrufweg nicht messbar.'
        ).toBe('Verteiler');
        expect(ergebnis.offen, 'Vorbedingung: der Verteiler oeffnet die Schale').toBe(true);
        expect(
            ergebnis.innen,
            'Der blanke `showModal()`-Aufruf aus dem Verteiler muss den Fokus ebenso in ' +
                'den Dialog fuehren wie `window.showModal()`. Tut er es nicht, sitzt der ' +
                `Haken in einem window-Mantel statt in der Deklaration (O-4). Fokus liegt ` +
                `auf: ${ergebnis.fokus}`
        ).toBe(true);
    });
});

// ============================================================================
// (g) DER VORDERE DIALOG IST DER ZULETZT GEOEFFNETE, nicht der letzte in
//     der Vorlage
// ============================================================================
test.describe('Modalfokus — verschachtelte Dialoge', () => {
    test('(g) Escape schliesst den zuletzt geoeffneten Dialog, nicht den darunter', async ({
        page
    }) => {
        // BEFUND DER EIGENEN MESSUNG, nicht eine Vorsichtsmassnahme. Die erste
        // Fassung von `oberstesModal()` nahm "die letzte Schale in
        // Dokumentreihenfolge". Fuer die zur Laufzeit angehaengten Schalen
        // stimmt das, fuer die 35 aus den Vorlagen NICHT: ihre Reihenfolge
        // steht in `assets/templates/`. Gemessen: #about-modal auf, dann
        // #theme-modal auf, Escape — geschlossen wurde #about-modal, weil es
        // in der Vorlage HINTER #theme-modal steht. Der Spielleiter schliesst
        // den Dialog, den er sieht, und es verschwindet der darunter.
        await appLaden(page, 6);
        for (let i = 0; i < VORLAUF; i++) await page.keyboard.press('Tab');
        await page.evaluate(() => {
            window.__oeffner = document.activeElement;
            window.__oeffnerFokus = 0;
            window.__oeffner.addEventListener('focus', () => window.__oeffnerFokus++);
        });
        await page.evaluate(() => window.showModal('about-modal'));
        await page.waitForTimeout(300);
        await page.evaluate(() => window.showModal('theme-modal'));
        await page.waitForTimeout(300);
        for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const erstes = await page.evaluate(() => ({
            themeOffen: document.getElementById('theme-modal').classList.contains('show'),
            aboutOffen: document.getElementById('about-modal').classList.contains('show'),
            fokusImAbout: document.getElementById('about-modal').contains(document.activeElement),
            oeffnerFokus: window.__oeffnerFokus
        }));
        expect(
            erstes.themeOffen,
            'Escape muss den ZULETZT geoeffneten Dialog (#theme-modal) schliessen.'
        ).toBe(false);
        expect(
            erstes.aboutOffen,
            'Der Dialog darunter (#about-modal) muss offen bleiben — er steht in der ' +
                'Vorlage HINTER #theme-modal, und genau daran ist die erste Fassung ' +
                'gescheitert.'
        ).toBe(true);
        expect(
            erstes.fokusImAbout,
            'Nach dem Schliessen des oberen Dialogs gehoert der Fokus in den darunter ' +
                'liegenden zurueck, nicht in den Hintergrund.'
        ).toBe(true);
        expect(
            erstes.oeffnerFokus,
            'Der Oeffner des UNTEREN Dialogs darf noch keinen Fokus bekommen haben.'
        ).toBe(0);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const zweites = await page.evaluate(() => ({
            aboutOffen: document.getElementById('about-modal').classList.contains('show'),
            aufOeffner: document.activeElement === window.__oeffner,
            oeffnerFokus: window.__oeffnerFokus
        }));
        expect(zweites.aboutOffen, 'Das zweite Escape schliesst den unteren Dialog.').toBe(false);
        expect(
            zweites.aufOeffner,
            'Erst jetzt kehrt der Fokus auf den urspruenglichen Oeffner zurueck.'
        ).toBe(true);
        expect(
            zweites.oeffnerFokus,
            'Und zwar GENAU EINMAL — mehr waere eine Doppelausloesung des Rueckwegs.'
        ).toBe(1);
    });
});

// ============================================================================
// (h) KEINE DOPPELAUSLOESUNG — gezaehlt am Ereignis, nicht an der Wirkung
// ============================================================================
test.describe('Modalfokus — ein Anschlag, eine Wirkung', () => {
    for (const taste of ['Enter', 'Space']) {
        test(`(h) ${taste} auf einem Knopf im Dialog: genau 1 Klick, kein Seitenlauf`, async ({
            page
        }) => {
            await appLaden(page, 6);
            await page.evaluate(() => window.showModal('about-modal'));
            await page.waitForTimeout(350);
            const vor = await page.evaluate(() => {
                const m = document.getElementById('about-modal');
                const ziel = document.activeElement;
                window.__ziel = ziel;
                window.__echt = 0;
                window.__synth = 0;
                window.__scrollVor = window.scrollY;
                // GEZAEHLT WIRD AM DOKUMENT IN DER CAPTURE-PHASE, gefiltert
                // auf `ev.target === ziel` — NICHT mit einem Lauscher am Knopf
                // selbst. Grund, gemessen: `_handleClick` in
                // ui/event-delegation.js ruft `stopPropagation()`, BEVOR es den
                // Handler aufruft. Ein Lauscher AM Element wird dadurch nie
                // erreicht und meldet konstant 0, obwohl genau ein Klick
                // gefeuert hat (nachgewiesen: am Knopf 0, am Dokument 1). Wer
                // hier am Element zaehlt, misst die Ereignisbremse des
                // Verteilers und nicht die Ausloesung.
                document.addEventListener(
                    'click',
                    ev => {
                        if (ev.target !== window.__ziel) return;
                        if (ev.isTrusted) window.__echt++;
                        else window.__synth++;
                    },
                    true
                );
                return {
                    imDialog: !!(m && m.contains(ziel)),
                    tag: ziel.tagName,
                    aktion: ziel.getAttribute('data-action')
                };
            });
            expect(
                vor.imDialog,
                'Vorbedingung: der Einstieg muss den Fokus in den Dialog gelegt haben.'
            ).toBe(true);
            expect(vor.tag, 'Vorbedingung: der erste Haltepunkt ist ein Knopf.').toBe('BUTTON');

            await page.keyboard.press(taste);
            await page.waitForTimeout(300);
            const nach = await page.evaluate(() => ({
                echt: window.__echt,
                synth: window.__synth,
                summe: window.__echt + window.__synth,
                scrollLauf: window.scrollY - window.__scrollVor
            }));
            expect(
                nach.summe,
                `${taste} auf einem echten <button> darf GENAU einen Klick erzeugen. Der ` +
                    `Browser macht aus der Taste selbst schon einen, der keydown-Zweig aus ` +
                    `T-B einen zweiten, wenn preventDefault fehlt — und die Fokusfalle sitzt ` +
                    `in derselben Capture-Phase. Gemessen: echt ${nach.echt}, ` +
                    `synthetisch ${nach.synth}.`
            ).toBe(1);
            expect(
                nach.scrollLauf,
                'Die Leertaste darf die Seite nicht wegrollen — ein Dokument, das bei jedem ' +
                    'Schalten springt, ist am Spieltisch schlimmer als ein unerreichbarer Knopf.'
            ).toBe(0);
        });
    }

    test('(h) ein Tabulatordruck bewegt den Fokus um GENAU einen Haltepunkt', async ({ page }) => {
        await appLaden(page, 6);
        await page.evaluate(() => window.showModal('npc-modal'));
        await page.waitForTimeout(450);
        const anzahl = await page.evaluate(() => {
            const m = document.getElementById('npc-modal');
            window.__h = window.ModalFocus.haltepunkte(m);
            window.__focusin = 0;
            window.__spur = [];
            document.addEventListener(
                'focusin',
                () => {
                    window.__focusin++;
                    window.__spur.push(window.__h.indexOf(document.activeElement));
                },
                true
            );
            return window.__h.length;
        });
        expect(anzahl, 'Vorbedingung: der Dialog braucht genug Haltepunkte.').toBeGreaterThan(6);
        for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
        const r = await page.evaluate(() => ({
            focusin: window.__focusin,
            spur: window.__spur
        }));
        expect(
            r.focusin,
            'Die Falle uebernimmt den Tabulator vollstaendig (preventDefault an jedem ' +
                'Zweig). Fehlte es, bewegte der Browser den Fokus zusaetzlich — zwei Halte ' +
                'je Anschlag.'
        ).toBe(5);
        expect(
            r.spur,
            'Und zwar um genau einen Halt weiter, nicht um zwei: die Indexspur muss ' +
                'lueckenlos aufsteigen.'
        ).toEqual([1, 2, 3, 4, 5]);
    });

    test('(h) OHNE offenen Dialog bleibt der Tabulator unberuehrt', async ({ page }) => {
        // Die Gegenprobe, die zeigt, dass die Falle nicht die ganze App
        // kapert: ohne Dialog muss sie inert sein.
        await appLaden(page, 6);
        await page.evaluate(() => {
            window.__focusin = 0;
            document.addEventListener('focusin', () => window.__focusin++, true);
        });
        for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
        const r = await page.evaluate(() => ({
            focusin: window.__focusin,
            offen: window.ModalFocus.statistik().offen,
            aktiv: window.ModalFocus.statistik().aktiv
        }));
        expect(r.aktiv, 'Die Falle muss eingehaengt sein.').toBe(true);
        expect(r.offen, 'Ohne Dialog darf sie keine Schale sehen.').toBeNull();
        expect(
            r.focusin,
            'Acht Tabulatordruecke, acht Fokuswechsel — die Falle greift nicht in den ' +
                'normalen Lauf der App ein.'
        ).toBe(8);
    });
});
