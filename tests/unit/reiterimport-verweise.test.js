/**
 * Verweise, offene Formulare, Zaehler — Unit-Nachweis (REITERIMPORT R5, R6, R7, R8)
 *
 * Die Bedienwege stehen als E2E in tests/e2e/features/reiterimport-verweise.spec.js (R5-R7)
 * und tests/e2e/features/reiterimport-daten.spec.js (R8). Hier stehen die Zusagen dahinter
 * gegen den ECHTEN Quelltext (vm-Kontext, Loader-Reihenfolge der benoetigten Module, wie
 * tests/unit/reiterimport-pruefung.test.js):
 *   - DER VERWEISKATALOG (REITER_VERWEISE in systems/spellslots/import-export.js) gegen die
 *     Verweispfade der Datengrenze (DATENGRENZE_ZAHLENFELDER, utils/basic.js): jeder Pfad, der
 *     dort eine ID eines ANDEREN Eintrags traegt, steht im Katalog — ein neues Verweisfeld an
 *     der Grenze ohne Katalogeintrag macht diesen Test rot.
 *   - R5 an einer Saat ALLER zwoelf Typen: jeder Verweis auf einen anderen Bereich traegt eine
 *     Waechter-ID ab 9000; nach "Hinzufügen" steht keine davon mehr in den Kopien — weder als
 *     Zahl noch in einem Text —, jeder Verweis innerhalb des Typs zeigt auf die neue ID seines
 *     Ziels, ein Verweis ohne eindeutiges Ziel in der Datei ist geleert, und die Originale sind
 *     unveraendert. Das Soll je Typ steht hier als Literal, nicht aus dem Katalog berechnet.
 *   - R5/R6 Vorschau: was sie nennt, ist genau, was das Schreiben tut.
 *   - R7: Ersetzen verwirft ein Bearbeiten des Typs; Hinzufuegen nur eines, dessen ID neu
 *     vergeben wurde (sonst bleibt es stehen); ein Anlege-Entwurf ohne ID bleibt unberuehrt.
 *     Dasselbe nach Strg+Z und Strg+Y (F7-F10): der Undo-Punkt des Imports traegt eine
 *     Kennung, sein Undo-Hook verwirft danach nach derselben Regel.
 *   - R8: updateIOCounts() kennt die drei Welt-Reiter (bei aktiver Suche schreibt die Liste),
 *     renderAll() zeichnet den offenen Welt-Reiter neu (features/render-dashboard.js).
 *   - BESTIAR-UNDO R2: dasselbe fuer das OFFENE Bestiar (Z3) — und NUR fuer das offene (Z5):
 *     ein verstecktes Bestiar zeichnet renderAll() weder ueber die Registry noch direkt, sonst
 *     setzt das Rollwerk beim Start die Fensterhoehe auf den Rueckfall (400 statt 587 px, E2E
 *     tests/e2e/features/bestiar-undo.spec.js (W10)).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { setImmediate: naechsterTask } = require('timers');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const MODULE = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/utilities.js',
    'systems/spellslots/import-export.js'
];
const QUELLTEXT = Object.fromEntries(
    [...MODULE, 'features/render-dashboard.js'].map(rel => [
        rel,
        fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8')
    ])
);

async function ruhe(n = 20) {
    for (let i = 0; i < n; i++) await new Promise(resolve => naechsterTask(resolve));
}

/** Ein vm-Kontext = window, mit beobachtbaren Attrappen fuer Meldung, Fenster, Schreiben. */
function erzeugeSeite(D) {
    const seite = { toasts: [] };
    const ctx = { console, document, DOMParser, Node, setTimeout, clearTimeout };
    ctx.window = ctx;
    ctx.self = ctx;
    vm.createContext(ctx);
    for (const rel of MODULE) vm.runInContext(QUELLTEXT[rel], ctx, { filename: rel });
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.showToast = jest.fn((text, typ) => seite.toasts.push(`${typ || 'success'}: ${text}`));
    ctx.showModal = jest.fn();
    ctx.hideModal = jest.fn();
    ctx.confirm = jest.fn(() => true);
    ctx.saveUndoState = jest.fn();
    ctx.save = jest.fn();
    ctx.renderAll = jest.fn();
    ctx.setViewCount = jest.fn();
    ctx.createAutoBackup = jest.fn(() => Promise.resolve('ok'));
    ctx.reportSafetyBackup = jest.fn();
    ctx.validateAndRepairNextId = jest.fn();
    let zaehler = 100;
    ctx.nextId = jest.fn(() => ++zaehler);
    ctx.getCampaignIndex = () => ({ active: ctx.APP_CONFIG.STORAGE_KEY, campaigns: [] });
    ctx.D = D;
    ctx.FileReader = class {
        readAsText(datei) {
            Promise.resolve().then(() => this.onload({ target: { result: datei.__text } }));
        }
    };
    seite.ctx = ctx;
    return seite;
}

/** Ein Reiterfeld mit gewaehlter Datei, wie es ui/event-delegation.js an importData() gibt. */
function reiterfeld(typ, text) {
    const name = `${typ}.json`;
    return {
        id: `import-${typ}`,
        dataset: { type: typ },
        files: [{ name, size: text.length, __text: text }],
        value: `C:\\fakepath\\${name}`
    };
}

/** Eine Reiter-Datei im Format des Exports. */
function datei(typ, data) {
    return JSON.stringify({
        _format: 'dnd-tracker/reiter-export@2',
        _exportDate: '2026-11-01T10:00:00.000Z',
        _campaignName: 'Probe',
        _version: '2.6.1',
        _dataType: typ,
        data
    });
}

function vorschauZeilen() {
    return Array.from(document.getElementById('import-info').children).map(z => z.textContent);
}

/** Plain-Kopie eines Objekts aus dem vm-Kontext (andere Prototypen als die des Tests). */
function plain(x) {
    return JSON.parse(JSON.stringify(x));
}

/** Waehlt die Datei, stellt den Modus, liest die Vorschau — und importiert. */
async function importiere(typ, data, D, modus) {
    const seite = erzeugeSeite(D);
    seite.ctx.importData(reiterfeld(typ, datei(typ, data)));
    await ruhe();
    expect(seite.toasts).toEqual([]);
    expect(seite.ctx.showModal).toHaveBeenCalledWith('import-modal');
    document.querySelector(`input[name="import-mode"][value="${modus}"]`).checked = true;
    seite.ctx.renderImportVorschau();
    const vorschau = vorschauZeilen();
    seite.ctx.executeImport();
    return { seite, vorschau };
}

/** Die Sammlung eines Typs aus einem D (Kalender-Ereignisse liegen verschachtelt). */
function sammlung(D, typ) {
    return typ === 'calendarEvents' ? D.calendar.events : D[typ];
}

/** Jede Stelle, an der noch eine Waechter-ID (ab 9000) steht — als Zahl oder in einem Text. */
function waechterIn(wert, weg = '') {
    if (typeof wert === 'number') return wert >= 9000 ? [weg] : [];
    if (typeof wert === 'string') return /(?<!\d)9\d{3}(?!\d)/.test(wert) ? [weg] : [];
    if (!wert || typeof wert !== 'object') return [];
    return Object.keys(wert).flatMap(k => waechterIn(wert[k], `${weg}.${k}`));
}

beforeEach(() => {
    document.body.innerHTML =
        '<div id="import-info"></div>' +
        '<input type="radio" name="import-mode" value="merge" checked>' +
        '<input type="radio" name="import-mode" value="replace">';
});

// ===========================================================================
// DER KATALOG GEGEN DIE DATENGRENZE
// ===========================================================================

describe('REITERIMPORT — der Verweiskatalog', () => {
    /** Pfade der Grenze, die eine ID tragen, aber KEIN Verweis sind — mit Grund. */
    const KEIN_VERWEIS = {
        'sessionPreps[].szenen[].id': 'Nummer der Szene innerhalb ihrer Session-Prep',
        'initiative.combatants[].effects[].id': 'Nummer eines Effekts am Kaempfer'
    };
    /** Sammlung der Grenze -> Schluessel im Katalog. */
    const SAMMLUNG = { 'calendar.events': 'calendarEvents', 'initiative.combatants': 'initiative' };

    test('K1: jeder Verweispfad der Datengrenze unter einer Sammlung des Katalogs steht im Katalog', () => {
        const seite = erzeugeSeite({});
        const pfade = vm.runInContext('DATENGRENZE_ZAHLENFELDER', seite.ctx);
        const katalog = vm.runInContext('REITER_VERWEISE', seite.ctx);
        const geprueft = [];
        const fehlt = [];
        for (const pfad of pfade) {
            const treffer = /^(.+?)\[\]\.(.+)$/.exec(pfad);
            if (!treffer) continue;
            const schluessel = SAMMLUNG[treffer[1]] || treffer[1];
            if (!Object.prototype.hasOwnProperty.call(katalog, schluessel)) continue;
            const rest = treffer[2];
            if (rest === 'id' || KEIN_VERWEIS[pfad]) continue;
            // Ein Verweis: ein Feld "…Id"/"…Ids", die ID eines Objekts in einer Liste, oder
            // eine Liste von IDs (characters[].spells[])
            const teile = rest.replace(/\[\]/g, '').split('.');
            const letzter = teile[teile.length - 1];
            const istVerweis =
                /Ids?$/.test(letzter) ||
                (teile.length === 2 && letzter === 'id') ||
                pfad === 'characters[].spells[]';
            if (!istVerweis) continue;
            geprueft.push(pfad);
            const feld = katalog[schluessel].find(v => v.feld === teile[0]);
            const passt =
                feld &&
                (teile.length === 1 ? feld.art === 'wert' || feld.art === 'liste' : true) &&
                (teile.length === 2 ? (feld.idFeld || 'id') === teile[1] : true);
            if (!passt) fehlt.push(pfad);
        }
        expect(fehlt).toEqual([]);
        // Gegenprobe: der Test sieht die Pfade wirklich (sonst waere er billig gruen)
        expect(geprueft).toEqual(
            expect.arrayContaining([
                'characters[].spells[]',
                'characters[].items[].id',
                'npcs[].locationId',
                'npcs[].relations[].targetId',
                'quests[].rewardItems[].id',
                'factions[].mitgliederNpcIds[]',
                'wiki[].parentId',
                'sessionPreps[].offeneFaeden[].quelleId',
                'calendar.events[].quelleId',
                'shops[].npcId',
                'sessionNotes[].arcId',
                'loot[].links[].id'
            ])
        );
    });

    test('K2: jeder Reiter-Typ hat einen Katalogeintrag, jedes Wort ist deutsch und nie ein Schluessel', () => {
        const seite = erzeugeSeite({});
        const katalog = vm.runInContext('REITER_VERWEISE', seite.ctx);
        const zielName = vm.runInContext('reiterZielName', seite.ctx);
        const typen = vm.runInContext('Object.keys(REITER_NAMENSFELD)', seite.ctx);
        expect(typen).toHaveLength(12);
        for (const typ of typen) expect(Object.keys(katalog)).toContain(typ);
        const ziele = new Set();
        for (const felder of Object.values(katalog)) {
            for (const v of felder) {
                if (v.ziel) ziele.add(v.ziel);
            }
        }
        for (const ziel of [
            ...ziele,
            'shops',
            'initiative',
            'monsterFavorites',
            'quickRefCustom',
            'filters'
        ]) {
            expect(zielName(ziel)).not.toBe(ziel);
            expect(zielName(ziel)).not.toBe('unbekannter Bereich');
        }
        expect(zielName('constructor')).toBe('unbekannter Bereich');
    });
});

// ===========================================================================
// R5 — HINZUFUEGEN AN EINER SAAT ALLER ZWOELF TYPEN
// ===========================================================================

/** Eine fremde Ziel-ID (Waechter). */
const F = n => 9000 + n;

/**
 * Je Typ: die Datei (A, B …) und das Soll der Kopie von B (… C) nach "Hinzufügen" — neue IDs
 * 101, 102, 103 (nextId-Attrappe). Innerhalb des Typs zeigt alles auf 1 (A); was auf eine
 * Waechter-ID zeigt, ist ein Verweis auf einen anderen Bereich.
 */
const SAAT = {
    characters: {
        data: [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                spells: [F(1), F(2)],
                items: [{ id: F(3), quantity: 1 }, F(4)],
                relationships: [
                    { targetType: 'npc', targetId: F(5), type: 'ally' },
                    { targetType: 'character', targetId: 1, type: 'rival' },
                    'Bruder'
                ],
                links: [
                    { type: 'npcs', id: F(6) },
                    { type: 'characters', id: 1 }
                ],
                notes: '<p>[[npcs:9007:Vela]] und [[characters:1:A]]</p>'
            }
        ],
        soll: [
            {
                id: 102,
                name: 'B',
                spells: [],
                items: [],
                relationships: [
                    { targetType: 'character', targetId: 101, type: 'rival' },
                    'Bruder'
                ],
                links: [{ type: 'characters', id: 101 }],
                notes: '<p>Vela und [[characters:101:A]]</p>'
            }
        ]
    },
    npcs: {
        data: [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                locationId: F(10),
                factionId: F(11),
                filterId: F(12),
                relations: [
                    { targetId: 1, targetType: 'npcs', status: 'friendly', note: 'Schwester' },
                    { targetId: F(13), targetType: 'characters', status: 'hostile', note: '' },
                    { targetId: 0, targetType: 'party', status: 'neutral', note: '' },
                    { targetId: 7, targetType: 'npcs', status: 'neutral', note: 'tot' }
                ],
                relationships: ['Bruder von A', { targetType: 'npc', targetId: 1 }],
                links: [
                    { type: 'npcs', id: 1 },
                    { type: 'quests', id: F(14) }
                ],
                description: '<p>[[npcs:1:A]] im [[locations:9015:Ort]]</p>'
            }
        ],
        soll: [
            {
                id: 102,
                name: 'B',
                locationId: null,
                factionId: null,
                filterId: null,
                relations: [
                    { targetId: 101, targetType: 'npcs', status: 'friendly', note: 'Schwester' },
                    { targetId: 0, targetType: 'party', status: 'neutral', note: '' }
                ],
                relationships: ['Bruder von A', { targetType: 'npc', targetId: 101 }],
                links: [{ type: 'npcs', id: 101 }],
                description: '<p>[[npcs:101:A]] im Ort</p>'
            }
        ]
    },
    locations: {
        data: [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                filterId: F(20),
                links: [
                    { type: 'locations', id: 1 },
                    { type: 'npcs', id: F(21) }
                ]
            }
        ],
        soll: [{ id: 102, name: 'B', filterId: null, links: [{ type: 'locations', id: 101 }] }]
    },
    quests: {
        data: [
            { id: 1, title: 'A' },
            {
                id: 2,
                title: 'B',
                giverId: F(30),
                giverName: 'Geber',
                locationId: F(31),
                targetId: F(32),
                rewardItems: [{ id: F(33), name: 'Schwert' }],
                links: [
                    { type: 'quests', id: 1 },
                    { type: 'npcs', id: F(34) }
                ]
            }
        ],
        soll: [
            {
                id: 102,
                title: 'B',
                giverId: null,
                giverName: 'Geber',
                locationId: null,
                targetId: null,
                rewardItems: [],
                links: [{ type: 'quests', id: 101 }]
            }
        ]
    },
    encounters: {
        data: [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                monsters: [
                    { name: 'A', count: 2, encounterId: 1 },
                    { name: 'Fremd', count: 1, encounterId: F(40) }
                ],
                links: [{ type: 'encounters', id: 1 }]
            }
        ],
        soll: [
            {
                id: 102,
                name: 'B',
                monsters: [
                    { name: 'A', count: 2, encounterId: 101 },
                    { name: 'Fremd', count: 1, encounterId: null }
                ],
                links: [{ type: 'encounters', id: 101 }]
            }
        ]
    },
    loot: {
        data: [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                description: '[[item:1:A]] passt zu [[characters:9051:Held]]',
                links: [
                    { type: 'loot', id: 1 },
                    { type: 'characters', id: F(50) }
                ]
            }
        ],
        soll: [
            {
                id: 102,
                name: 'B',
                description: '[[item:101:A]] passt zu Held',
                links: [{ type: 'loot', id: 101 }]
            }
        ]
    },
    spells: {
        data: [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                links: [
                    { type: 'spells', id: 1 },
                    { type: 'wiki', id: F(60) }
                ]
            }
        ],
        soll: [{ id: 102, name: 'B', links: [{ type: 'spells', id: 101 }] }]
    },
    wiki: {
        data: [
            { id: 1, title: 'A', parentId: null },
            {
                id: 2,
                title: 'B',
                parentId: 1,
                content: '<p>[[wiki:1:A]]</p>',
                links: [
                    { type: 'wiki', id: 1 },
                    { type: 'npcs', id: F(70) }
                ]
            },
            // Eltern in der Quelle geloescht: geleert, nicht mit der alten Zahl stehen gelassen
            { id: 3, title: 'C', parentId: 7 }
        ],
        soll: [
            {
                id: 102,
                title: 'B',
                parentId: 101,
                content: '<p>[[wiki:101:A]]</p>',
                links: [{ type: 'wiki', id: 101 }]
            },
            { id: 103, title: 'C', parentId: null }
        ]
    },
    links: {
        data: [
            { id: 1, title: 'A', url: 'https://example.org/a' },
            {
                id: 2,
                title: 'B',
                url: 'https://example.org/b',
                description: '<p>[[quests:9080:Fracht]]</p>'
            }
        ],
        soll: [{ id: 102, title: 'B', url: 'https://example.org/b', description: '<p>Fracht</p>' }]
    },
    sessionPreps: {
        data: [
            { id: 1, strongStart: '<p>A</p>' },
            {
                id: 2,
                strongStart: '<p>B</p>',
                szenen: [{ id: 1, titel: 'S', beschreibung: '<p>[[npcs:9093:N]]</p>', ort: '' }],
                offeneFaeden: [
                    { text: 'Fracht', quelleId: F(90), quelleTyp: 'quest' },
                    { text: 'Arc', quelleId: F(91), quelleTyp: 'storyArc' },
                    { text: 'frei', quelleId: null, quelleTyp: 'manual' }
                ],
                links: [{ type: 'npcs', id: F(92) }]
            }
        ],
        soll: [
            {
                id: 102,
                strongStart: '<p>B</p>',
                // Die Szene behaelt ihre Nummer (kein Verweis), der Faden seinen Text
                szenen: [{ id: 1, titel: 'S', beschreibung: '<p>N</p>', ort: '' }],
                offeneFaeden: [
                    { text: 'Fracht', quelleId: null, quelleTyp: 'quest' },
                    { text: 'Arc', quelleId: null, quelleTyp: 'storyArc' },
                    { text: 'frei', quelleId: null, quelleTyp: 'manual' }
                ],
                links: []
            }
        ]
    },
    calendarEvents: {
        data: [
            { id: 1, titel: 'A', datum: { tag: 1, monat: 1, jahr: 1492 } },
            {
                id: 2,
                titel: 'B',
                datum: { tag: 2, monat: 1, jahr: 1492 },
                typ: 'session',
                quelleId: F(100)
            }
        ],
        soll: [
            {
                id: 102,
                titel: 'B',
                datum: { tag: 2, monat: 1, jahr: 1492 },
                typ: 'session',
                quelleId: null
            }
        ]
    },
    factions: {
        data: [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                sitzOrtId: F(110),
                mitgliederNpcIds: [F(111), F(112)],
                links: [{ type: 'npcs', id: F(113) }]
            }
        ],
        soll: [{ id: 102, name: 'B', sitzOrtId: null, mitgliederNpcIds: [], links: [] }]
    }
};

/** Eine Kampagne, in der die Originale der Datei schon stehen (Duplizieren). */
function kampagneMit(typ) {
    const originale = plain(SAAT[typ].data);
    return typ === 'calendarEvents' ? { calendar: { events: originale } } : { [typ]: originale };
}

describe('REITERIMPORT R5 — Hinzufuegen an einer Saat aller zwoelf Typen', () => {
    test('S0: die Saat deckt jeden Reiter-Typ ab', () => {
        const seite = erzeugeSeite({});
        expect(Object.keys(SAAT).sort()).toEqual(
            vm.runInContext('Object.keys(REITER_NAMENSFELD)', seite.ctx).sort()
        );
    });

    test.each(Object.keys(SAAT))(
        'S1 %s: kein fremder Verweis bleibt, innerhalb zeigt alles auf die Kopien, Originale unveraendert',
        async typ => {
            const { seite } = await importiere(typ, SAAT[typ].data, kampagneMit(typ), 'merge');
            const alle = sammlung(plain(seite.ctx.D), typ);
            const n = SAAT[typ].data.length;
            const kopien = alle.slice(n);
            expect(seite.toasts).toEqual([
                expect.stringMatching(/^success: ✅ \d+ .+ importiert \(hinzugefügt\)$/)
            ]);
            // Unabhaengig vom Katalog: keine Waechter-ID mehr, an keiner Stelle
            expect(waechterIn(kopien)).toEqual([]);
            // Das Soll je Typ, als Literal
            expect(kopien.slice(1)).toEqual(SAAT[typ].soll);
            expect(kopien[0].id).toBe(101);
            // Die Originale bleiben, wie sie waren (sie tragen noch ihre Waechter-IDs)
            expect(alle.slice(0, n)).toEqual(sammlung(kampagneMit(typ), typ));
        }
    );

    test('S2: dieselbe Datei in eine FREMDE Kampagne — kein Verweis zeigt auf deren Eintraege', async () => {
        // Unter jeder ID der Datei steht dort ein anderer NPC; der haengende Verweis (7) haette
        // dort ein Ziel
        const fremd = {
            npcs: [1, 2, 7].map(id => ({ id, name: `Fremd ${id}` })),
            locations: [{ id: F(10), name: 'Eiswueste' }]
        };
        const vorher = plain(fremd.npcs);
        const { seite } = await importiere('npcs', SAAT.npcs.data, fremd, 'merge');
        const npcs = plain(seite.ctx.D.npcs);
        expect(npcs.slice(0, 3)).toEqual(vorher);
        expect(npcs.slice(3)).toEqual([{ id: 101, name: 'A' }, ...SAAT.npcs.soll]);
    });

    test('S3: doppelte IDs in der Datei — ein Verweis darauf ist mehrdeutig und wird geleert', async () => {
        const data = [
            { id: 1, name: 'A' },
            { id: 1, name: 'A2' },
            {
                id: 3,
                name: 'C',
                links: [{ type: 'npcs', id: 1 }],
                relations: [{ targetId: 3, targetType: 'npcs' }]
            }
        ];
        const { seite, vorschau } = await importiere('npcs', data, { npcs: [] }, 'merge');
        expect(plain(seite.ctx.D.npcs)).toEqual([
            { id: 101, name: 'A' },
            { id: 102, name: 'A2' },
            { id: 103, name: 'C', links: [], relations: [{ targetId: 103, targetType: 'npcs' }] }
        ]);
        expect(vorschau).toContain(
            '1 Verweis innerhalb der NPCs zeigt danach auf die mitimportierten Einträge'
        );
        expect(vorschau).toContain(
            '⚠️ 1 Verweis innerhalb der NPCs zeigt auf einen Eintrag, der nicht (eindeutig) in der Datei steht — er wird geleert'
        );
    });

    test('S4: die Vorschau nennt VOR dem Import, was das Schreiben tut — je Feld und als Summe', async () => {
        const { vorschau } = await importiere('npcs', SAAT.npcs.data, { npcs: [] }, 'merge');
        expect(vorschau.slice(4)).toEqual([
            'Hinzufügen: 2 Einträge kommen mit neuer ID zu den vorhandenen (0) dazu',
            '4 Verweise innerhalb der NPCs zeigen danach auf die mitimportierten Einträge',
            '⚠️ 6 Verweise auf andere Bereiche werden geleert — die Datei weiß nicht, welche Einträge dort gemeint sind:',
            '– Ort: 1',
            '– Fraktion: 1',
            '– Filter: 1',
            '– Beziehung → Charaktere: 1',
            '– Verknüpfung → Quests: 1',
            '– Text-Verknüpfung → Orte: 1',
            '⚠️ 1 Verweis innerhalb der NPCs zeigt auf einen Eintrag, der nicht (eindeutig) in der Datei steht — er wird geleert'
        ]);
    });

    test('S5: ohne Verweise nennt die Vorschau keine', async () => {
        const { vorschau } = await importiere(
            'spells',
            [{ id: 1, name: 'A' }],
            { spells: [] },
            'merge'
        );
        expect(vorschau.slice(4)).toEqual([
            'Hinzufügen: 1 Eintrag kommt mit neuer ID zu den vorhandenen (0) dazu'
        ]);
    });

    // Befund der Pruefer (Runde 2, Sonde p1, gemessen in einer FREMDEN Kampagne): eine Beziehung
    // mit `targetType: 'npc'` oder ganz ohne Typ blieb beim Hinzufuegen stehen — der Katalog
    // hielt sie fuer "kein Verweis" —, die Anzeige aber loest jeden Typ ausser 'party' und
    // 'characters' als NPC auf (features/npcs/npc-render.js renderNPCRelations()). Das Detail
    // zeigte danach "🎭 FREMD-Hexe Morla … Typ npc" und "🎭 FREMD-Ritter Kunz … ohne Typ".
    test('S6: Beziehungen mit Einzahl-, fremdem oder ohne Typ sind NPC-Beziehungen — wie in der Anzeige', async () => {
        const fremd = { npcs: [1, 7, 8, 9].map(id => ({ id, name: `Fremd ${id}` })) };
        const data = [
            { id: 1, name: 'A' },
            {
                id: 2,
                name: 'B',
                relations: [
                    { targetType: 'npc', targetId: 1, status: 'friendly', note: 'Typ npc' },
                    { targetId: 1, status: 'hostile', note: 'ohne Typ' },
                    { targetType: 'wesen', targetId: 1, status: 'neutral', note: 'fremder Typ' },
                    { targetType: 'npc', targetId: 7, status: 'neutral', note: 'tot' },
                    { targetId: 8, status: 'neutral', note: 'tot, ohne Typ' },
                    { targetType: 'wesen', targetId: 9, status: 'neutral', note: 'tot, fremd' },
                    { targetType: 'party', targetId: 0, status: 'neutral', note: 'Gruppe' }
                ],
                // Das alte Modell: die Anzeige (systems/undo.js renderRelationshipBadges()) loest
                // jeden Typ ausser 'character' als NPC auf
                relationships: [
                    { targetType: 'npc', targetId: 1, type: 'ally' },
                    { targetType: 'wesen', targetId: 8, type: 'rival' }
                ]
            }
        ];
        const { seite, vorschau } = await importiere('npcs', data, fremd, 'merge');
        const kopie = plain(seite.ctx.D.npcs).find(n => n.id === 102);
        expect(kopie.relations).toEqual([
            { targetType: 'npc', targetId: 101, status: 'friendly', note: 'Typ npc' },
            { targetId: 101, status: 'hostile', note: 'ohne Typ' },
            { targetType: 'wesen', targetId: 101, status: 'neutral', note: 'fremder Typ' },
            { targetType: 'party', targetId: 0, status: 'neutral', note: 'Gruppe' }
        ]);
        expect(kopie.relationships).toEqual([{ targetType: 'npc', targetId: 101, type: 'ally' }]);
        expect(waechterIn(kopie)).toEqual([]);
        expect(vorschau).toContain(
            '4 Verweise innerhalb der NPCs zeigen danach auf die mitimportierten Einträge'
        );
        expect(vorschau).toContain(
            '⚠️ 4 Verweise innerhalb der NPCs zeigen auf einen Eintrag, der nicht (eindeutig) in der Datei steht — sie werden geleert'
        );
    });

    // Befund der Pruefer (Runde 2, Sonde p1, gemessen): `filterId: [1]` blieb beim Hinzufuegen
    // stehen — der Zweig fuer Feldverweise uebersprang jedes Objekt —, und parseEntityId([1])
    // ergibt 1: die Karte zeigte den Filter der Ziel-Kampagne mit dieser ID. Vor dem Fenster
    // lehnt die Pruefung eine solche Datei ab (tests/unit/reiterimport-pruefung.test.js P6); die
    // Abbildung selbst laesst trotzdem nichts still stehen, was die App als ID liest.
    test('S7: ein Feldverweis, der keine ID ist (Liste, Objekt), wird beim Hinzufuegen geleert und genannt', () => {
        const seite = erzeugeSeite({ npcs: [], locations: [] });
        const hinzufuegen = vm.runInContext('reiterHinzufuegen', seite.ctx);
        const zaehlen = vm.runInContext('reiterHinzufuegenVerweise', seite.ctx);
        const npcs = [
            { id: 1, name: 'A', filterId: [1] },
            { id: 2, name: 'B', filterId: { id: 1 }, locationId: [3] }
        ];
        expect(plain(hinzufuegen('npcs', npcs))).toEqual([
            { id: 101, name: 'A', filterId: null },
            { id: 102, name: 'B', filterId: null, locationId: null }
        ]);
        expect(plain(zaehlen('npcs', npcs)).fremd).toEqual([
            { wort: 'Filter', n: 2 },
            { wort: 'Ort', n: 1 }
        ]);
        // Innerhalb des Typs ebenso: ein Wiki-Elternteil als Liste ist kein eindeutiges Ziel
        expect(
            plain(
                hinzufuegen('wiki', [
                    { id: 1, title: 'A' },
                    { id: 2, title: 'B', parentId: [1] }
                ])
            )[1].parentId
        ).toBeNull();
    });
});

// ===========================================================================
// R4/R9 — HINZUFUEGEN: DIE HTML-FELDER SIND AUCH NACH DEM UMSCHREIBEN BEREINIGT
// ===========================================================================
//
// Befund der Pruefer (Runde 2, Sicherheit, gemessen ueber die Oberflaeche am Dev- und am
// Produktionsbuendel): bereiteReiterImportVor() bereinigt die HTML-Felder (sanitizeImportedItem()),
// DANACH schrieb reiterHinzufuegen() jede Text-Verknuepfung auf einen anderen Bereich im fertig
// serialisierten Markup zu ihrem Namen um. Aus dem erlaubten relativen Ziel
// `/[[locations:7:/kanarie-host/x.pdf]]` wurde so `//kanarie-host/x.pdf` — ein Netzwerkziel
// (unter file:// ein UNC-Pfad), das sanitizeHTML() nie durchgelassen haette; in D stand danach
// in npcs.description, characters.notes, links.description und wiki.content Markup, das nicht
// mehr bereinigt war. Die Ausgabe bereinigt erneut (gemessen: 0 Funde) — aber die zweite Schicht
// (SEC-01) war auf diesem Weg ausgehebelt. Gegenprobe Ersetzen (kein Umschreiben): bereinigt.
describe('REITERIMPORT R4/R9 — Hinzufuegen: jedes HTML-Feld ist nach dem Umschreiben bereinigt', () => {
    /** Je Typ ein Bereich, auf den eine Text-Verknuepfung FREMD zeigt (sie wird geleert). */
    const FREMDER_BEREICH = t => (t === 'locations' ? 'npcs' : 'locations');

    test('H1: kein Feld aus HTML_FIELDS_BY_TYPE traegt danach mehr, als sanitizeHTML() zulaesst', async () => {
        const seite0 = erzeugeSeite({});
        const htmlFelder = plain(vm.runInContext('HTML_FIELDS_BY_TYPE', seite0.ctx));
        const typen = vm.runInContext('Object.keys(REITER_NAMENSFELD)', seite0.ctx);
        const geprueft = [];
        for (const typ of typen) {
            const felder = htmlFelder[typ] || [];
            if (felder.length === 0) continue;
            const ziel = FREMDER_BEREICH(typ);
            const eintrag = { id: 1, name: 'A', title: 'A', titel: 'A' };
            for (const feld of felder) {
                eintrag[feld] =
                    `<p><a href="/[[${ziel}:7:/kanarie-host/${typ}-${feld}.pdf]]">Karte</a>` +
                    ` <a href="/[[${ziel}:8:%5Ckanarie-host]]">Ablage</a></p>`;
            }
            const { seite } = await importiere(typ, [eintrag], kampagneMit(typ), 'merge');
            const sanitize = seite.ctx.sanitizeHTML;
            const kopie = sammlung(plain(seite.ctx.D), typ).find(e => e.id === 101);
            expect(kopie).toBeDefined();
            for (const feld of felder) {
                geprueft.push(`${typ}.${feld}`);
                expect({ feld: `${typ}.${feld}`, wert: kopie[feld] }).toEqual({
                    feld: `${typ}.${feld}`,
                    wert: sanitize(kopie[feld])
                });
                expect(kopie[feld]).not.toMatch(/href="\/[/\\]|href="\/%5C/i);
                // Der sichtbare Text bleibt (die Verknuepfung ist nur noch ihr Name)
                expect(kopie[feld]).toContain('Karte');
            }
        }
        // Gegenprobe: der Test sieht die Felder wirklich
        expect(geprueft).toEqual(
            expect.arrayContaining([
                'characters.notes',
                'npcs.description',
                'links.description',
                'wiki.content',
                'encounters.traits',
                'factions.agenda',
                'calendarEvents.beschreibung',
                'sessionPreps.strongStart'
            ])
        );
    });
});

// ===========================================================================
// TEXT-VERKNUEPFUNGEN [[typ:id:name]] — DIESELBEN TREFFER, IN LINEARER ZEIT
// ===========================================================================
//
// Befund der Pruefer (Runde 1, gemessen): das Muster /\[\[(\w+):(\d+):([^\]]+)\]\]/g braucht auf
// "[[a:1:" ohne schliessende Klammern quadratische Zeit — jeder Ansatz sucht bis zum Textende
// nach "]". Ein NPC-Name aus 40000 Wiederholungen (240 KB) hielt die Dateiwahl 3,4 s auf, bevor
// der Nutzer etwas entschieden hatte (Vorschau beim Oeffnen, Hinzufuegen, Ersetzen ueber alle
// Sammlungen); hochgerechnet etwa 1,5 h an der erlaubten Grenze von 10 MB. Der Ersatz muss
// GENAU die Treffer von systems/entity-links.js parseEntityLinks() behalten (dasselbe Muster):
// eine Verknuepfung, die die Anzeige als Sprung zeigt, der Import aber nicht saehe, zeigte nach
// dem Hinzufuegen still auf einen fremden Eintrag (R5).
describe('REITERIMPORT — Text-Verknuepfungen: dieselben Treffer wie das Muster, in linearer Zeit', () => {
    const MUSTER = /\[\[(\w+):(\d+):([^\]]+)\]\]/g;
    const markiere = (ganz, typ, id, name) => `<${typ}|${id}|${name}>`;

    test('T1: dieselben Treffer wie text.replace(MUSTER) — Grenzfaelle und 20000 Zufallstexte', () => {
        const seite = erzeugeSeite({});
        const ersetze = vm.runInContext('reiterTextverweiseErsetzen', seite.ctx);
        const faelle = [
            '',
            'kein Verweis',
            '[[npcs:12:Vela]]',
            'a [[npcs:1:A]] b [[locations:2:Hafen & Markt]] c',
            '[[npcs:1:]]',
            '[[npcs::A]]',
            '[[:1:A]]',
            '[[npcs:1:A]',
            '[[npcs:1:A]]]',
            '[[[npcs:1:A]]',
            '[[npcs:1:A [x]]]',
            '[[npcs:1:A\n]]',
            '[[npc_2:007:Zahl]]',
            '[[npcs:1:a[[npcs:2:b]]',
            '[[npcs:1:a]] [[npcs:2:b]]x]]',
            '[[a:1:'.repeat(5) + ']]'
        ];
        const ALPHA = ['[', ']', ':', 'a', '1', '_', ' ', 'ä', '\n'];
        let zustand = 4711;
        const zufall = n => {
            zustand = (zustand * 1103515245 + 12345) & 0x7fffffff;
            return zustand % n;
        };
        for (let i = 0; i < 20000; i++) {
            let text = '';
            const laenge = zufall(32);
            for (let j = 0; j < laenge; j++) text += ALPHA[zufall(ALPHA.length)];
            faelle.push(zufall(3) === 0 ? `${text}[[npcs:3:N]]${text}` : text);
        }
        const abweichend = faelle.filter(
            text => ersetze(text, markiere) !== text.replace(MUSTER, markiere)
        );
        expect(abweichend).toEqual([]);
    });

    test('T2: "[[a:1:" vierzigtausendmal ohne Klammer — die Abbildung braucht keine 400 ms', () => {
        const seite = erzeugeSeite({});
        const text = 'Langname ' + '[[a:1:'.repeat(40000);
        const start = performance.now();
        const ergebnis = seite.ctx.reiterTextverweiseAbbilden(text, (ziel, id) => id, 0);
        const dauer = performance.now() - start;
        expect(ergebnis).toBe(text);
        expect(dauer).toBeLessThan(400);
    });

    // Pruefer, Runde 2 (Tests, am Mutanten gemessen): T2 bricht schon beim ersten Kopf ab, weil
    // es kein "]" gibt. Eine Fassung, die die naechste Klammer bei JEDEM Kopf neu sucht (gleiche
    // Treffer, quadratisch), blieb in T1-T3 gruen — mit einer Klammer am Textende brauchte sie
    // auf 240 KB 152 ms statt 29 ms, unter jeder Zeitschranke, die ein langsamer Rechner noch
    // einhaelt. Darum hier gezaehlt statt gemessen: wie oft nach "]" gesucht wird.
    test('T2b: mit EINER Klammer am Textende — nach "]" wird einmal gesucht, nicht je Kopf', () => {
        const seite = erzeugeSeite({});
        // Die Suche im vm-Kontext beobachten: dort laeuft reiterTextverweiseErsetzen()
        const zaehler = vm.runInContext(
            `(() => {
                const z = { n: 0 };
                const indexOf = String.prototype.indexOf;
                String.prototype.indexOf = function (suche, ...rest) {
                    if (suche === ']') z.n++;
                    return indexOf.call(this, suche, ...rest);
                };
                return z;
            })()`,
            seite.ctx
        );
        const text = 'Langname ' + '[[a:1:'.repeat(40000) + ']';
        expect(seite.ctx.reiterTextverweiseErsetzen(text, () => 'X')).toBe(text);
        expect(zaehler.n).toBeLessThanOrEqual(2);
        // Gegenprobe: der Zaehler sieht die Suche wirklich (ein Treffer je Verknuepfung)
        zaehler.n = 0;
        expect(seite.ctx.reiterTextverweiseErsetzen('[[a:1:x]] [[b:2:y]]', () => 'X')).toBe('X X');
        expect(zaehler.n).toBe(2);
    });

    test('T3: dieselbe Datei ueber den ganzen Weg — Dateiwahl bis Vorschau, dann Ersetzen-Vorschau', async () => {
        const name = 'Langname ' + '[[a:1:'.repeat(40000);
        const start = performance.now();
        const seite = erzeugeSeite({ npcs: [{ id: 1, name: 'Volo' }] });
        seite.ctx.importData(reiterfeld('npcs', datei('npcs', [{ id: 5, name }])));
        await ruhe();
        expect(seite.ctx.showModal).toHaveBeenCalledWith('import-modal');
        document.querySelector('input[name="import-mode"][value="replace"]').checked = true;
        seite.ctx.renderImportVorschau();
        expect(performance.now() - start).toBeLessThan(1500);
    });
});

// ===========================================================================
// R6 — ERSETZEN: VERWEISE ANDERER BEREICHE INS LEERE
// ===========================================================================

describe('REITERIMPORT R6 — die Vorschau beim Ersetzen nennt die Verweise anderer Bereiche', () => {
    test('E1: je Bereich mit den Feldern — Feldverweise, Verknuepfungen, Text-Verknuepfungen, Shops', async () => {
        const D = {
            npcs: [1, 2, 3, 4].map(id => ({ id, name: `NPC ${id}` })),
            quests: [
                { id: 1, title: 'Q1', giverId: 1 },
                { id: 2, title: 'Q2', giverId: 2 },
                { id: 3, title: 'Q3', giverId: 3 },
                { id: 4, title: 'Q4', giverId: null }
            ],
            locations: [{ id: 1, name: 'Hafen', links: [{ type: 'npcs', id: 4 }] }],
            wiki: [{ id: 1, title: 'W', content: '<p>[[npcs:4:Nils]]</p>' }],
            shops: [{ id: 1, name: 'Laden', npcId: 3 }],
            quickRefCustom: [{ id: 1, title: 'R', content: '[[npc:2:Vela]]' }]
        };
        const { seite, vorschau } = await importiere(
            'npcs',
            [
                { id: 1, name: 'Neuer Wirt' },
                { id: 9, name: 'Neue Wache' }
            ],
            D,
            'replace'
        );
        expect(vorschau.slice(4)).toEqual([
            'Ersetzen: 4 vorhandene Einträge werden durch die Datei ersetzt; vorher wird eine Sicherheitskopie angelegt',
            '⚠️ Danach zeigen 6 Verweise anderer Bereiche ins Leere (die Datei enthält ihr Ziel nicht):',
            '– Orte (Verknüpfung → NPCs): 1',
            '– Quests (Auftraggeber): 2',
            '– Wiki-Einträge (Text-Verknüpfung → NPCs): 1',
            '– Shops (Händler): 1',
            '– Schnellreferenz (Text-Verknüpfung → NPCs): 1',
            '1 Verweis anderer Bereiche zeigt danach auf den Eintrag der Datei mit derselben ID'
        ]);
        // Die Vorschau hat nichts veraendert; geschrieben hat erst "Importieren"
        expect(plain(seite.ctx.D.npcs).map(n => n.id)).toEqual([1, 9]);
        expect(plain(seite.ctx.D.quests).map(q => q.giverId)).toEqual([1, 2, 3, null]);
        expect(plain(seite.ctx.D.locations)).toEqual(D.locations);
    });

    test('E2: nichts zeigt danach ins Leere — die Vorschau sagt es', async () => {
        const { vorschau } = await importiere(
            'locations',
            [{ id: 1, name: 'Neu' }],
            { locations: [{ id: 1, name: 'Alt' }], npcs: [{ id: 1, name: 'N', locationId: 1 }] },
            'replace'
        );
        expect(vorschau.slice(5)).toEqual([
            'Kein Verweis anderer Bereiche zeigt danach ins Leere',
            '1 Verweis anderer Bereiche zeigt danach auf den Eintrag der Datei mit derselben ID'
        ]);
    });

    test('E3: Verweise innerhalb des ersetzten Typs zaehlen nicht als "anderer Bereich"', async () => {
        const { vorschau } = await importiere(
            'wiki',
            [{ id: 1, title: 'Neu' }],
            {
                wiki: [
                    { id: 1, title: 'A' },
                    { id: 2, title: 'B', parentId: 1, links: [{ type: 'wiki', id: 3 }] }
                ]
            },
            'replace'
        );
        expect(vorschau).toContain('Kein Verweis anderer Bereiche zeigt danach ins Leere');
    });

    // Befund der Pruefer (Runde 1, gemessen): "⭐ Vorlage speichern" im Encounter-Rechner legt
    // die Monster der Rechnerliste samt `encounterId` in D.monsterFavorites ab
    // (features/encounter-calculator.js saveMonsterFavorite()), "⚔️ Zur Initiative" liest ueber
    // sie RK und TP. Die Vorschau zaehlte nur den Kaempfer der Initiative — nach dem Ersetzen
    // mit id 1 = Oger kamen die Goblins der Vorlage mit den Werten des Ogers in die Initiative.
    // Die Datengrenze kennt das Feld nicht, darum faengt K1 es nicht: hier als eigener Fall.
    test('E4: die Vorlagen des Encounter-Rechners zaehlen mit (monsterFavorites[].monsters[].encounterId)', async () => {
        const kampagne = () => ({
            encounters: [{ id: 1, name: 'Goblin', cr: '1/4' }],
            initiative: { combatants: [{ id: 1, name: 'Goblin #1', encounterId: 1 }] },
            monsterFavorites: [
                {
                    id: 1700000000000,
                    name: 'Goblinbande',
                    monsters: [{ cr: '1/4', count: 3, name: 'Goblin', encounterId: 1 }]
                }
            ]
        });
        const leer = await importiere(
            'encounters',
            [{ id: 5, name: 'Oger', cr: '2' }],
            kampagne(),
            'replace'
        );
        expect(leer.vorschau.slice(5)).toEqual([
            '⚠️ Danach zeigen 2 Verweise anderer Bereiche ins Leere (die Datei enthält ihr Ziel nicht):',
            '– Initiative (Vorlage): 1',
            '– Rechner-Vorlagen (Vorlage eines Monsters): 1'
        ]);
        const gleich = await importiere(
            'encounters',
            [{ id: 1, name: 'Oger', cr: '2' }],
            kampagne(),
            'replace'
        );
        expect(gleich.vorschau.slice(5)).toEqual([
            'Kein Verweis anderer Bereiche zeigt danach ins Leere',
            '2 Verweise anderer Bereiche zeigen danach auf den Eintrag der Datei mit derselben ID'
        ]);
        // Die Vorlage selbst bleibt beim Ersetzen, wie sie war (R6 nennt, schreibt nicht um)
        expect(plain(gleich.seite.ctx.D.monsterFavorites)).toEqual(kampagne().monsterFavorites);
    });

    // Befund der Pruefer (Runde 2, Sonde p12, gemessen): in der Kampagne FREMD wurden die NPCs
    // durch die von HEIM ersetzt. Die Vorschau sagte nur "Kampagne: HEIM" und "Kein Verweis
    // anderer Bereiche zeigt danach ins Leere" — danach hatte HEIM-Alrik den Ort
    // "FREMD-Eiswueste", die Fraktion "FREMD-Diebesgilde" und eine Beziehung zu "FREMD-Held-A".
    // Ersetzen schreibt die Verweise der Datei nicht um (R6); die Vorschau nennt sie, je Feld,
    // bevor geschrieben wird — wie beim Hinzufuegen die geleerten.
    test('E5: die Verweise der DATEI auf andere Bereiche — welche hier ein Ziel mit derselben ID haben, welche ins Leere zeigen', async () => {
        const fremd = () => ({
            npcs: [1, 2, 3].map(id => ({ id, name: `FREMD-${id}` })),
            locations: [
                { id: 1, name: 'FREMD-Eiswueste' },
                { id: 2, name: 'FREMD-Vulkan' }
            ],
            factions: [{ id: 1, name: 'FREMD-Diebesgilde' }],
            characters: [{ id: 1, name: 'FREMD-Held-A' }]
        });
        const datei = [
            {
                id: 1,
                name: 'HEIM-Alrik',
                locationId: 1,
                factionId: 1,
                relations: [
                    { targetType: 'characters', targetId: 1, status: 'friendly' },
                    { targetType: 'npcs', targetId: 2, status: 'friendly' },
                    { targetType: 'party', targetId: 0, status: 'neutral' }
                ],
                links: [{ type: 'quests', id: 4 }]
            },
            { id: 2, name: 'HEIM-Vela', locationId: 2, description: '<p>[[locations:9:Turm]]</p>' }
        ];
        const { seite, vorschau } = await importiere('npcs', datei, fremd(), 'replace');
        expect(vorschau.slice(5)).toEqual([
            'Kein Verweis anderer Bereiche zeigt danach ins Leere',
            '⚠️ 4 Verweise der Datei auf andere Bereiche bleiben, wie sie sind — sie zeigen danach auf den Eintrag DIESER Kampagne mit derselben ID; stammt die Datei aus einer anderen Kampagne, ist das ein anderer Eintrag:',
            '– Ort: 2',
            '– Fraktion: 1',
            '– Beziehung → Charaktere: 1',
            '⚠️ 2 Verweise der Datei auf andere Bereiche zeigen danach ins Leere (diese Kampagne hat dort keinen Eintrag mit ihrer ID)'
        ]);
        // Die Vorschau nennt, umgeschrieben wird nichts (R6)
        expect(plain(seite.ctx.D.npcs)).toEqual(datei);
        // Ohne solche Verweise sagt die Vorschau nichts dazu
        const ohne = await importiere('npcs', [{ id: 1, name: 'Neu' }], fremd(), 'replace');
        expect(ohne.vorschau.join('\n')).not.toMatch(/Verweise? der Datei/);
    });
});

// ===========================================================================
// R7 — OFFENE UND LIEGENGEBLIEBENE FORMULARE
// ===========================================================================

describe('REITERIMPORT R7 — ein Bearbeiten, dessen ID danach einem importierten Eintrag gehoert, wird verworfen', () => {
    function formulare() {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div id="char-form" class="open"><input id="edit-char-id" value="1">' +
                '<input id="char-name" value="Thorin"></div>' +
                '<div id="quest-modal" class="modal-overlay"><input id="edit-quest-id" value="1"></div>' +
                '<div id="fraktionen-modal" class="modal-overlay show"><input id="edit-fraktion-id" value="2"></div>' +
                '<input id="edit-npc-id" value="">'
        );
    }
    function attrappen(seite) {
        seite.ctx.cancelCharEdit = jest.fn(() => {
            document.getElementById('edit-char-id').value = '';
            document.getElementById('char-name').value = '';
            document.getElementById('char-form').classList.remove('open');
        });
        seite.ctx.clearQuestForm = jest.fn(() => {
            document.getElementById('edit-quest-id').value = '';
        });
        seite.ctx.clearNPCForm = jest.fn();
    }

    test('F1: Ersetzen — das Klappformular ist zu und leer, die Quest-ID weg, das Fraktionsfenster zu', async () => {
        formulare();
        const seite = erzeugeSeite({ characters: [{ id: 1, name: 'Thorin' }] });
        attrappen(seite);
        // Die Kette laeuft mit der Seite, deren Attrappen gesetzt sind
        seite.ctx.importData(
            reiterfeld('characters', datei('characters', [{ id: 1, name: 'Mira' }]))
        );
        await ruhe();
        document.querySelector('input[name="import-mode"][value="replace"]').checked = true;
        seite.ctx.executeImport();
        expect(seite.ctx.cancelCharEdit).toHaveBeenCalledTimes(1);
        expect(document.getElementById('char-form').classList.contains('open')).toBe(false);
        expect(document.getElementById('edit-char-id').value).toBe('');
        // Nur der importierte Typ: Quest und Fraktion bleiben, wie sie sind
        expect(seite.ctx.clearQuestForm).not.toHaveBeenCalled();
        expect(document.getElementById('edit-quest-id').value).toBe('1');
        expect(plain(seite.ctx.D.characters)).toEqual([{ id: 1, name: 'Mira' }]);
    });

    test('F2: die liegengebliebene Quest-ID und das Fraktionsfenster (ohne Leeren-Funktion)', async () => {
        formulare();
        for (const [typ, data] of [
            ['quests', [{ id: 1, title: 'Botengang' }]],
            ['factions', [{ id: 2, name: 'Gilde' }]]
        ]) {
            const seite = erzeugeSeite({ quests: [], factions: [] });
            attrappen(seite);
            seite.ctx.importData(reiterfeld(typ, datei(typ, data)));
            await ruhe();
            document.querySelector('input[name="import-mode"][value="replace"]').checked = true;
            seite.ctx.executeImport();
            if (typ === 'quests') expect(seite.ctx.clearQuestForm).toHaveBeenCalledTimes(1);
            else expect(seite.ctx.hideModal).toHaveBeenCalledWith('fraktionen-modal');
        }
        expect(document.getElementById('edit-quest-id').value).toBe('');
        expect(document.getElementById('edit-fraktion-id').value).toBe('');
    });

    test('F3: fehlt die Leeren-Funktion (Einzeltest), wird die ID trotzdem geloescht', async () => {
        formulare();
        const seite = erzeugeSeite({ characters: [] });
        seite.ctx.importData(
            reiterfeld('characters', datei('characters', [{ id: 1, name: 'Mira' }]))
        );
        await ruhe();
        document.querySelector('input[name="import-mode"][value="replace"]').checked = true;
        seite.ctx.executeImport();
        expect(document.getElementById('edit-char-id').value).toBe('');
        // Ein fehlendes Modul ist kein Programmfehler des Imports
        expect(seite.ctx.ErrorHandler.log.mock.calls.filter(c => c[0] === 'Import')).toEqual([]);
    });

    test('F4: Hinzufuegen laesst ein Bearbeiten stehen — jeder vorhandene Eintrag behaelt seine ID', async () => {
        formulare();
        const seite = erzeugeSeite({ characters: [{ id: 1, name: 'Thorin' }] });
        attrappen(seite);
        seite.ctx.importData(
            reiterfeld('characters', datei('characters', [{ id: 1, name: 'Mira' }]))
        );
        await ruhe();
        seite.ctx.executeImport();
        expect(seite.ctx.cancelCharEdit).not.toHaveBeenCalled();
        expect(document.getElementById('edit-char-id').value).toBe('1');
        expect(plain(seite.ctx.D.characters)).toEqual([
            { id: 1, name: 'Thorin' },
            { id: 101, name: 'Mira' }
        ]);
    });

    test('F5: ein Anlege-Entwurf ohne ID bleibt auch beim Ersetzen stehen', async () => {
        formulare();
        const seite = erzeugeSeite({ npcs: [] });
        attrappen(seite);
        seite.ctx.importData(reiterfeld('npcs', datei('npcs', [{ id: 1, name: 'Volo' }])));
        await ruhe();
        document.querySelector('input[name="import-mode"][value="replace"]').checked = true;
        seite.ctx.executeImport();
        expect(seite.ctx.clearNPCForm).not.toHaveBeenCalled();
    });

    test('F6: Hinzufuegen — gleicht die liegengebliebene ID einer NEU vergebenen, wird das Bearbeiten verworfen', async () => {
        // Die liegengebliebene ID gehoerte einem geloeschten Eintrag; ohne Zaehler (Kampagne ohne
        // `_nextId`) vergibt nextId() sie wieder — hier die Attrappe: die erste neue ID ist 101.
        // Ohne Verwerfen schriebe "Speichern" Thorins Formular ueber die importierte Mira.
        formulare();
        document.getElementById('edit-char-id').value = '101';
        const seite = erzeugeSeite({ characters: [{ id: 1, name: 'Thorin' }] });
        attrappen(seite);
        seite.ctx.importData(
            reiterfeld('characters', datei('characters', [{ id: 1, name: 'Mira' }]))
        );
        await ruhe();
        seite.ctx.executeImport();
        expect(plain(seite.ctx.D.characters)).toEqual([
            { id: 1, name: 'Thorin' },
            { id: 101, name: 'Mira' }
        ]);
        expect(seite.ctx.cancelCharEdit).toHaveBeenCalledTimes(1);
        expect(document.getElementById('edit-char-id').value).toBe('');
        expect(document.getElementById('char-form').classList.contains('open')).toBe(false);
        // Nur der importierte Typ: die Quest-ID bleibt
        expect(document.getElementById('edit-quest-id').value).toBe('1');
    });

    // R7 ueber Strg+Z/Strg+Y (Pruefer, Runde 1, gemessen): Rueckgaengig und Wiederholen eines
    // Ersetzens tauschen, WELCHER Eintrag hinter einer ID steht. Der Import gibt seinem
    // Undo-Punkt darum eine Kennung mit, und sein Undo-Hook verwirft nach jedem Schritt, der
    // ihn zuruecknimmt oder wiederherstellt, was ein Bearbeiten des Typs sonst ueberschriebe.
    /** Das Party-Formular steht (wieder) offen mit `id`. */
    function wiederOffen(id) {
        document.getElementById('edit-char-id').value = id;
        document.getElementById('char-name').value = 'Thorin';
        document.getElementById('char-form').classList.add('open');
    }

    test('F7: Ersetzen — der Undo-Punkt traegt die Kennung; Strg+Z und Strg+Y verwerfen jedes Bearbeiten des Typs', async () => {
        formulare();
        const seite = erzeugeSeite({ characters: [{ id: 1, name: 'Thorin' }] });
        attrappen(seite);
        seite.ctx.importData(
            reiterfeld('characters', datei('characters', [{ id: 1, name: 'Mira' }]))
        );
        await ruhe();
        document.querySelector('input[name="import-mode"][value="replace"]').checked = true;
        seite.ctx.executeImport();
        expect(seite.ctx.saveUndoState).toHaveBeenCalledTimes(1);
        const [label, kennung] = seite.ctx.saveUndoState.mock.calls[0];
        expect(label).toBe('1 Charakter importiert');
        expect(plain(kennung)).toEqual({ reiterImport: { typ: 'characters', modus: 'replace' } });
        for (const direction of ['undo', 'redo']) {
            seite.ctx.cancelCharEdit.mockClear();
            wiederOffen('1');
            seite.ctx.reiterImportNachUndo({ action: label, direction, kennungen: [kennung] });
            expect(seite.ctx.cancelCharEdit).toHaveBeenCalledTimes(1);
            expect(document.getElementById('edit-char-id').value).toBe('');
            expect(document.getElementById('char-form').classList.contains('open')).toBe(false);
        }
        // Nur der importierte Typ: die Quest-ID bleibt
        expect(document.getElementById('edit-quest-id').value).toBe('1');
    });

    test('F8: Hinzufuegen — die Kennung nennt die neuen IDs; nur ein Bearbeiten mit einer davon wird verworfen', async () => {
        formulare();
        const seite = erzeugeSeite({ characters: [{ id: 1, name: 'Thorin' }] });
        attrappen(seite);
        seite.ctx.importData(
            reiterfeld('characters', datei('characters', [{ id: 1, name: 'Mira' }]))
        );
        await ruhe();
        seite.ctx.executeImport();
        const [, kennung] = seite.ctx.saveUndoState.mock.calls[0];
        expect(plain(kennung)).toEqual({
            reiterImport: { typ: 'characters', modus: 'merge', neueIds: [101] }
        });
        for (const direction of ['undo', 'redo']) {
            // Ein vorhandener Eintrag behaelt seine ID in beiden Staenden: es bleibt stehen
            seite.ctx.cancelCharEdit.mockClear();
            wiederOffen('1');
            seite.ctx.reiterImportNachUndo({ action: 'x', direction, kennungen: [kennung] });
            expect(seite.ctx.cancelCharEdit).not.toHaveBeenCalled();
            expect(document.getElementById('edit-char-id').value).toBe('1');
            // Die ID des importierten Eintrags gehoert vorher bzw. nachher niemandem
            wiederOffen('101');
            seite.ctx.reiterImportNachUndo({ action: 'x', direction, kennungen: [kennung] });
            expect(seite.ctx.cancelCharEdit).toHaveBeenCalledTimes(1);
            expect(document.getElementById('edit-char-id').value).toBe('');
        }
    });

    test('F9: ein Schritt ohne Kennung des Reiter-Imports laesst jedes Bearbeiten stehen', () => {
        formulare();
        const seite = erzeugeSeite({ characters: [{ id: 1, name: 'Thorin' }] });
        attrappen(seite);
        for (const info of [
            { action: 'Charakter bearbeitet', direction: 'undo' },
            { action: 'Charakter bearbeitet', direction: 'redo', kennungen: [] },
            { action: 'x', direction: 'undo', kennungen: [{ anderes: true }, null] },
            undefined
        ]) {
            seite.ctx.reiterImportNachUndo(info);
        }
        expect(seite.ctx.cancelCharEdit).not.toHaveBeenCalled();
        expect(document.getElementById('edit-char-id').value).toBe('1');
    });

    test('F10: das Modul meldet seinen Undo-Hook an, wenn es registerUndoHook() gibt (wie soundboard-crud.js)', () => {
        const ctx = { console, document, DOMParser, Node, setTimeout, clearTimeout };
        ctx.window = ctx;
        ctx.registerUndoHook = jest.fn();
        vm.createContext(ctx);
        for (const rel of MODULE) vm.runInContext(QUELLTEXT[rel], ctx, { filename: rel });
        expect(ctx.registerUndoHook).toHaveBeenCalledTimes(1);
        expect(ctx.registerUndoHook.mock.calls[0][0]).toBe(ctx.reiterImportNachUndo);
    });

    // Befund der Pruefer (Runde 2, Sonde p7, gemessen): Strg+Z und Strg+Y wirken auch bei
    // offenem Import-Fenster — die Vorschau blieb danach auf dem alten Stand stehen ("… zu den
    // vorhandenen (3)" mit 2 Eintraegen in D), bis man den Modus wechselte. "Importieren"
    // schrieb trotzdem auf den aktuellen Stand; falsch war nur, was das Fenster ankuendigte.
    test('F12: Strg+Z/Strg+Y bei offenem Import-Fenster — die Vorschau zeigt danach den aktuellen Stand', async () => {
        const seite = erzeugeSeite({ npcs: [1, 2, 3].map(id => ({ id, name: `N${id}` })) });
        seite.ctx.importData(reiterfeld('npcs', datei('npcs', [{ id: 9, name: 'Neu' }])));
        await ruhe();
        expect(vorschauZeilen()).toContain(
            'Hinzufügen: 1 Eintrag kommt mit neuer ID zu den vorhandenen (3) dazu'
        );
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div id="import-modal" class="modal-overlay show"></div>'
        );
        // Ein Rueckgaengig ohne Kennung des Reiter-Imports (die vorige Aenderung)
        seite.ctx.D.npcs.pop();
        seite.ctx.reiterImportNachUndo({ action: 'NPC angelegt', direction: 'undo' });
        expect(vorschauZeilen()).toContain(
            'Hinzufügen: 1 Eintrag kommt mit neuer ID zu den vorhandenen (2) dazu'
        );
        // Bei geschlossenem Fenster bleibt die Vorschau, wie sie ist (es gibt nichts zu zeigen)
        document.getElementById('import-modal').classList.remove('show');
        seite.ctx.D.npcs.pop();
        seite.ctx.reiterImportNachUndo({ action: 'NPC angelegt', direction: 'undo' });
        expect(vorschauZeilen()).toContain(
            'Hinzufügen: 1 Eintrag kommt mit neuer ID zu den vorhandenen (2) dazu'
        );
    });

    // Befund der Pruefer (Runde 2, Tests, am Mutanten gemessen): die Tabelle REITER_BEARBEITEN
    // hielt kein Fall fest. Mit vertippten Feld-IDs fuer NPC, Ort, Truhe, Zauber, Wiki und
    // Session-Prep blieben alle Unit- und E2E-Faelle gruen (F1-F10 bauen ihr Markup selbst, die
    // E2E-Faelle fahren nur Party, Quest, Encounter und Link) — und am Mutanten blieb nach
    // Ersetzen → ✏️ Ort 1 → Strg+Z das Ortsfenster offen, "Speichern" schrieb den importierten Ort
    // ueber den zurueckgeholten. Hier gegen die ECHTEN Vorlagen und Module: jedes Feld und jedes
    // Fenster existiert, das Feld liegt IM Fenster, ein Modul der App schreibt es, und jede
    // Leeren-Funktion ist eine Funktion eines geladenen Moduls.
    test('F11: die Tabelle REITER_BEARBEITEN trifft die echten Formulare — Feld, Fenster, Leeren-Funktion', () => {
        const vorlagen = fs
            .readdirSync(path.join(REPO_ROOT, 'assets', 'templates'))
            .filter(n => n.endsWith('.html'))
            .map(n => fs.readFileSync(path.join(REPO_ROOT, 'assets', 'templates', n), 'utf8'));
        const loader = fs.readFileSync(path.join(REPO_ROOT, 'loader.js'), 'utf8');
        const module = [
            ...loader.matchAll(/'((?:core|utils|systems|features|ui|render)\/[^']+\.js)'/g)
        ]
            .map(t => t[1])
            .filter(rel => fs.existsSync(path.join(REPO_ROOT, rel)))
            .map(rel => ({ rel, text: fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8') }));
        expect(module.length).toBeGreaterThan(50);
        const seite = erzeugeSeite({});
        const tabelle = vm.runInContext('REITER_BEARBEITEN', seite.ctx);
        const typen = vm.runInContext('Object.keys(REITER_NAMENSFELD)', seite.ctx);
        expect(Object.keys(tabelle).sort()).toEqual([...typen].sort());
        /** Die Stelle, die ein Element mit dieser ID baut: eine Vorlage oder ein Modul. */
        const traeger = id => [
            ...vorlagen
                .filter(t => t.includes(`id="${id}"`))
                .map(text => ({ text, vorlage: true })),
            ...module
                .filter(m => m.rel !== 'systems/spellslots/import-export.js')
                .filter(m => m.text.includes(`id="${id}"`))
                .map(m => ({ text: m.text, vorlage: false }))
        ];
        const geprueft = [];
        for (const typ of typen) {
            for (const formular of tabelle[typ]) {
                const was = `${typ}: ${formular.id}`;
                geprueft.push(typ);
                const feld = traeger(formular.id);
                expect({ was, traeger: feld.length }).toEqual({ was, traeger: 1 });
                // Ein Modul der App liest oder schreibt das Feld (das Bearbeiten selbst)
                const nutzer = module.filter(
                    m =>
                        m.rel !== 'systems/spellslots/import-export.js' &&
                        (m.text.includes(`'${formular.id}'`) || m.text.includes(`"${formular.id}"`))
                );
                expect({ was, nutzer: nutzer.length > 0 }).toEqual({ was, nutzer: true });
                if (formular.fenster) {
                    const fenster = traeger(formular.fenster);
                    expect({ was, fenster: fenster.length }).toEqual({ was, fenster: 1 });
                    if (fenster[0].vorlage) {
                        const doc = new DOMParser().parseFromString(fenster[0].text, 'text/html');
                        const imFenster = doc
                            .getElementById(formular.fenster)
                            ?.querySelector(`#${formular.id}`);
                        expect({ was, imFenster: !!imFenster }).toEqual({ was, imFenster: true });
                    } else {
                        // Zur Laufzeit gebaut (Session-Prep): Feld und Fenster im selben Modul
                        expect({
                            was,
                            imModul: fenster[0].text.includes(`id="${formular.id}"`)
                        }).toEqual({ was, imModul: true });
                    }
                }
                if (formular.leeren !== null) {
                    // Die aufgeschobene Referenz nennt ihren Bezeichner: `() => clearNPCForm`
                    const name = (/=>\s*([A-Za-z_$][\w$]*)\s*$/.exec(String(formular.leeren)) ||
                        [])[1];
                    const definiert = module.some(m =>
                        new RegExp(`^(?:async )?function ${name}\\(`, 'm').test(m.text)
                    );
                    expect({ was, leeren: name, definiert }).toEqual({
                        was,
                        leeren: name,
                        definiert: true
                    });
                }
            }
        }
        // Kalender-Ereignisse haben kein Bearbeiten; jeder andere Typ steht drin
        expect([...new Set(geprueft)].sort()).toEqual(
            typen.filter(t => t !== 'calendarEvents').sort()
        );
    });
});

// ===========================================================================
// R8 — ZAEHLER UND OFFENER WELT-REITER
// ===========================================================================

describe('REITERIMPORT R8 — Zaehler und offener Welt-Reiter', () => {
    test('Z1: updateIOCounts() schreibt die Zaehler von Session-Prep, Kalender und Fraktionen', () => {
        const seite = erzeugeSeite({
            sessionPreps: [{ id: 1 }, { id: 2 }],
            calendar: { events: [{ id: 1 }, { id: 2 }, { id: 3 }] },
            factions: [{ id: 1 }]
        });
        seite.ctx.updateIOCounts();
        const calls = seite.ctx.setViewCount.mock.calls;
        expect(calls).toEqual(
            expect.arrayContaining([
                ['sessionprep', 2],
                ['kalender', 3],
                ['fraktionen', 1]
            ])
        );
    });

    test('Z2: bei aktiver Suche gehoert der Zaehler der gefilterten Liste (F-09) — kein Ueberschreiben', () => {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<input id="fraktionen-search" value="gilde"><input id="kalender-search" value="  ">'
        );
        const seite = erzeugeSeite({
            sessionPreps: [],
            calendar: { events: [] },
            factions: [{ id: 1 }]
        });
        seite.ctx.updateIOCounts();
        const ansichten = seite.ctx.setViewCount.mock.calls.map(c => c[0]);
        expect(ansichten).not.toContain('fraktionen');
        expect(ansichten).toContain('kalender');
        expect(ansichten).toContain('sessionprep');
    });

    /** features/render-dashboard.js mit stummen Renderern; rAF laeuft auf Abruf. */
    function dashboard() {
        const frames = [];
        const ctx = { console, document };
        ctx.window = ctx;
        vm.createContext(ctx);
        ctx.requestAnimationFrame = fn => frames.push(fn);
        ctx.ErrorHandler = { log: jest.fn() };
        ctx.$ = id => document.getElementById(id);
        ctx.esc = s => String(s);
        ctx.renderTabContent = jest.fn();
        ctx.updateIOCounts = jest.fn();
        vm.runInContext(QUELLTEXT['features/render-dashboard.js'], ctx, {
            filename: 'features/render-dashboard.js'
        });
        for (const name of [
            'renderParty',
            'renderNPCList',
            'renderLocations',
            'renderQuests',
            'renderEncounters',
            'renderInit',
            'renderLoot',
            'renderShops',
            'renderSpells',
            'renderSessions',
            'renderLinks',
            'renderWiki',
            'renderFilterList',
            'initQuickRefCustom',
            'renderRandomTables',
            'renderTimers',
            // BESTIAR-UNDO Z5: ein direkter Aufruf der Liste ausserhalb der Registry wird sichtbar
            'renderBestiaryList'
        ]) {
            ctx[name] = jest.fn();
        }
        return { ctx, frame: () => frames.splice(0).forEach(fn => fn(0)) };
    }

    // 'bestiary' seit BESTIAR-UNDO R2: Liste UND Detail haengen am Registry-Eintrag, renderAll()
    // zeichnet das offene Bestiar ueber ihn — nach demselben Muster wie die Welt-Reiter.
    test.each(['sessionprep', 'kalender', 'fraktionen', 'bestiary'])(
        'Z3 %s: renderAll() zeichnet die offene Ansicht ueber ihren Registry-Eintrag neu',
        ansicht => {
            document.body.insertAdjacentHTML(
                'beforeend',
                `<div class="view active" id="view-${ansicht}"></div>`
            );
            const { ctx, frame } = dashboard();
            ctx.renderAll();
            frame();
            expect(ctx.renderTabContent.mock.calls).toEqual([[ansicht]]);
            expect(ctx.ErrorHandler.log).not.toHaveBeenCalled();
            // Die Zaehler danach — sie respektieren eine aktive Suche (Z2)
            expect(ctx.updateIOCounts).toHaveBeenCalledTimes(1);
        }
    );

    test.each(['npcs', 'dashboard', 'reise'])(
        'Z4 %s: ein anderer offener Reiter wird von renderAll() nicht ueber die Registry gezeichnet',
        ansicht => {
            document.body.insertAdjacentHTML(
                'beforeend',
                `<div class="view active" id="view-${ansicht}"></div>`
            );
            const { ctx, frame } = dashboard();
            ctx.renderAll();
            frame();
            expect(ctx.renderTabContent).not.toHaveBeenCalled();
            expect(ctx.renderNPCList).toHaveBeenCalledTimes(1);
        }
    );

    // BESTIAR-UNDO R2 (Vertrag: "NICHT ZULAESSIG — renderBestiaryList unbedingt in renderAll").
    // renderAll() laeuft beim Start (core/init.js) bei verstecktem Bestiar; zeichnete es die Liste
    // dort, setzte das Rollwerk ihre Hoehe auf den Rueckfall fest (gemessen 400 statt 587 px bei
    // 1440x900, 13 statt 17 Zeilen). Gezeichnet wird nur die OFFENE Ansicht (Z3).
    test.each(['party', 'dashboard', 'sessionprep'])(
        'Z5 verstecktes Bestiar, offen %s: renderAll() zeichnet das Bestiar weder ueber die Registry noch direkt',
        ansicht => {
            document.body.insertAdjacentHTML(
                'beforeend',
                '<div class="view" id="view-bestiary"></div>' +
                    `<div class="view active" id="view-${ansicht}"></div>`
            );
            const { ctx, frame } = dashboard();
            ctx.renderAll();
            frame();
            expect(ctx.renderTabContent.mock.calls.map(c => c[0])).not.toContain('bestiary');
            expect(ctx.renderBestiaryList).not.toHaveBeenCalled();
            // Auch kein Aufruf einer anderen, hier nicht gestellten Bestiar-Funktion (er liefe in
            // renderSafe auf einen Fehler und landete im Fehlerlog)
            expect(ctx.ErrorHandler.log).not.toHaveBeenCalled();
            expect(ctx.renderNPCList).toHaveBeenCalledTimes(1);
        }
    );
});
