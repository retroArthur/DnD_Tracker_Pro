/**
 * Kampagnen-Normalisierer normalizeCampaignData() — R01/R03/R07
 * (Code-Review 2026-09-21, Einheit U2)
 *
 * Restore (R01), ueberschreibender Import (R03), Import als neue Kampagne (R07)
 * und die Backup-Pfade (R05/R10) brauchen EINEN reinen Weg von Rohdaten zu einem
 * vollstaendigen Kampagnenobjekt: parsen -> Typen pruefen -> migrieren ->
 * Standardwerte ergaenzen -> IDs und Zaehler reparieren. Diese Datei pinnt
 * diesen Weg, bevor ihn die Aufrufer (U3/U4/U6) benutzen.
 *
 * Zusaetzlich: MIGRATIONS['2.3.0'] wandelte die AKTUELLEN Zustands-Objekte
 * {type,name,addedAt} in Zeichenketten um (eigene Zustandsnamen gingen verloren,
 * die Chips waren nicht mehr darstellbar) — und das bei jedem versionslosen
 * Stand, also bei jeder Erstsitzung. Jetzt: Objekte bleiben, Zeichenketten
 * werden zu Objekten repariert.
 *
 * Harness: vm-Kontext, der zugleich `window` ist, mit den ECHTEN Quelldateien
 * core/config.js, core/data.js, utils/basic.js, utils/utilities.js und
 * systems/spellslots/version-migration.js. Die SEC-06-Inventarlisten kommen aus
 * der echten Quelle (Muster aus tests/unit/migration-wizard.test.js).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FILES = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/utilities.js',
    'systems/spellslots/version-migration.js'
];

// SEC-06-Inventar synchron aus der echten Quelle (nicht abtippen)
const _inventoryCtx = { window: {} };
vm.createContext(_inventoryCtx);
vm.runInContext(
    fs.readFileSync(path.join(REPO_ROOT, 'systems/migration/migration-wizard.js'), 'utf8'),
    _inventoryCtx
);
const INV_ARRAYS = _inventoryCtx.window.CAMPAIGN_CONTENT_ARRAYS;
const INV_TEXT_FIELDS = _inventoryCtx.window.CAMPAIGN_CONTENT_TEXT_FIELDS;
const INV_PATHS = _inventoryCtx.window.CAMPAIGN_CONTENT_PATHS;
const INV_EXCLUDED = _inventoryCtx.window.CAMPAIGN_CONTENT_EXCLUDED;
// Phantome: im Inventar gefuehrt, aber von keinem aktuellen Schreibpfad erzeugt
const INV_PHANTOMS = ['timers', 'campaign', 'notes', 'items'];

/** JSON-Rundlauf: vm-Objekte (fremder Realm) vergleichbar machen. */
const plain = v => JSON.parse(JSON.stringify(v));

function makeContext() {
    const ctx = { setTimeout, clearTimeout };
    ctx.window = ctx;
    ctx.document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };
    ctx.ErrorHandler = { log: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    ctx.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    ctx.CONDITIONS = { poisoned: { name: 'Vergiftet' }, prone: { name: 'Liegend' } };
    vm.createContext(ctx);
    for (const rel of FILES) {
        vm.runInContext(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'), ctx, { filename: rel });
    }
    return ctx;
}

/** Ruft den Normalisierer auf — mit expliziter Existenzpruefung als RED-Begruendung. */
function normalize(ctx, raw) {
    expect(typeof ctx.normalizeCampaignData).toBe('function');
    return ctx.normalizeCampaignData(raw);
}

/**
 * Vollstaendig befuellte Kampagne im aktuellen Format (deckt das SEC-06-Inventar ab).
 * settings/calendar/initiative/soundboard tragen alle Standard-Schluessel, damit der
 * einstufige Default-Merge sie unveraendert laesst.
 */
function buildFullFixture(ctx) {
    const defaults = ctx.initializeData();
    return {
        _version: ctx.APP_CONFIG.VERSION,
        characters: [
            {
                id: 1,
                name: 'Aria',
                characterClass: 'Wizard',
                level: 5,
                conditions: [
                    { type: 'poisoned', name: 'Vergiftet', addedAt: 1 },
                    { type: 'custom', name: 'Verflucht', addedAt: 2 }
                ],
                spellSlotsMax: [4, 3, 2, 0, 0, 0, 0, 0, 0],
                spellSlotsUsed: [1, 0, 0, 0, 0, 0, 0, 0, 0],
                xp: 6500,
                skillProficiencies: { arcana: true },
                skillExpertise: {},
                attacks: [{ name: 'Dolch', attackBonus: 4, damage: '1d4+2' }]
            }
        ],
        npcs: [
            {
                id: 3,
                name: 'Borin',
                relations: [{ targetId: 1, targetType: 'character', status: 'friendly', note: '' }]
            }
        ],
        quests: [{ id: 2, title: 'Die Mine', giverId: 3, createdAt: 1700000000000 }],
        locations: [{ id: 4, name: 'Phandalin' }],
        encounters: [{ id: 5, name: 'Goblins', monsters: [] }],
        loot: [{ id: 6, name: 'Heiltrank', assignedTo: 1 }],
        spells: [{ id: 7, name: 'Feuerball', level: 3 }],
        wiki: [{ id: 8, title: 'Goetter', content: '<p>Pantheon</p>' }],
        sessionNotes: [{ id: 9, title: 'Sitzung 1', content: 'Start' }],
        storyArcs: [{ id: 'arc-1', name: 'Der Bogen' }],
        bestiary: [{ id: 10, name: 'Hausdrache', cr: '5' }],
        sessionPreps: [{ id: 11, title: 'Vorbereitung' }],
        factions: [{ id: 12, name: 'Zhentarim', ruf: 5, historie: [] }],
        shops: [{ id: 13, name: 'Laden', items: [{ name: 'Seil', price: 1 }] }],
        links: [{ id: 14, from: 1, to: 3 }],
        filters: [{ id: 15, name: 'Nur Feinde' }],
        tags: ['wichtig', 'boss'],
        quickRefCustom: [{ id: 16, title: 'Eigene Regel', content: 'Text', expanded: false }],
        quickNotes: 'Schnellnotiz',
        dmScreenNotes: 'DM-Notiz',
        soundboard: {
            ...defaults.soundboard,
            scenes: [{ id: 17, name: 'Taverne', slot: 1, tracks: [{ blobId: 'b1', volume: 0.5 }] }]
        },
        calendar: { ...defaults.calendar, day: 3, month: 5, events: [{ id: 18, title: 'Fest' }] },
        initiative: {
            ...defaults.initiative,
            combatants: [{ id: 19, name: 'Goblin', initiative: 12 }],
            round: 2
        },
        settings: { ...defaults.settings, theme: 'light', levelingMode: 'milestone' },
        randomTables: [
            { id: 20, name: 'Wetter', icon: 'W', entries: [{ weight: 1, text: 'Regen' }] }
        ],
        dmScreenLayout: [{ id: 'party-1', type: 'party', visible: true }],
        dmScreenProfiles: { eigen: { name: 'Eigen', layout: [] } },
        dmScreenActiveProfile: 'eigen',
        bestiaryFavorites: ['goblin', 'custom:10'],
        monsterFavorites: ['goblin'],
        wikiRecentlyViewed: [8],
        diceHistory: [{ formula: '1d20', result: 12 }],
        sessionHistory: [{ start: 1, duration: 3600 }],
        partyGold: 125,
        lastSessionDuration: 3600,
        mindmap: { nodes: [{ id: 1, label: 'Held' }], connections: [] },
        _nextId: {
            characters: 2,
            npcs: 4,
            quests: 3,
            locations: 5,
            encounters: 6,
            loot: 7,
            spells: 8,
            wiki: 9,
            sessionNotes: 10,
            bestiary: 11,
            sessionPreps: 12,
            factions: 13,
            shops: 14,
            links: 15,
            filters: 16,
            quickRefCustom: 17,
            calendarEvents: 19,
            combatants: 20,
            randomTables: 21,
            items: 3
        }
    };
}

describe('Fixture-Waechter (SEC-06-Inventar)', () => {
    test('die Voll-Fixture deckt jeden Inventarschluessel ab (ohne Phantome)', () => {
        const ctx = makeContext();
        const fixture = buildFullFixture(ctx);
        const required = new Set([
            ...INV_ARRAYS,
            ...INV_TEXT_FIELDS,
            ...INV_PATHS.map(p => p[0]),
            ...INV_EXCLUDED
        ]);
        for (const phantom of INV_PHANTOMS) required.delete(phantom);
        const missing = [...required].filter(
            k => !Object.prototype.hasOwnProperty.call(fixture, k)
        );
        expect(missing).toEqual([]);
    });
});

describe('normalizeCampaignData() — Rundlauf (R01/R03)', () => {
    test('S1: Voll-Fixture als Objekt und als JSON-Text bleibt feldgleich erhalten', () => {
        const ctx = makeContext();
        const fixture = buildFullFixture(ctx);
        for (const raw of [fixture, JSON.stringify(fixture)]) {
            const res = normalize(ctx, raw);
            expect(res.ok).toBe(true);
            const data = plain(res.data);
            for (const key of Object.keys(fixture)) {
                if (key === '_nextId' || key === '_version') continue;
                expect({ key, value: data[key] }).toEqual({ key, value: plain(fixture[key]) });
            }
            expect(data._version).toBe(ctx.APP_CONFIG.VERSION);
            for (const [type, counter] of Object.entries(fixture._nextId)) {
                expect({ type, ok: data._nextId[type] >= counter }).toEqual({ type, ok: true });
            }
            expect(plain(res.renumbered)).toEqual([]);
        }
    });

    test('S11: raw wird nicht veraendert (auch bei Migration und Umnummerierung)', () => {
        const ctx = makeContext();
        const raw = {
            characters: [{ id: 1, conditions: ['poisoned'] }],
            npcs: [{ id: 2 }, { id: 2 }],
            calendar: { day: 1, month: 0, year: 1492, events: [] },
            settings: { theme: 'light' }
        };
        const before = JSON.stringify(raw);
        const res = normalize(ctx, raw);
        expect(res.ok).toBe(true);
        expect(JSON.stringify(raw)).toBe(before);
    });

    test('S12: Export-Metaschluessel werden entfernt, unbekannte Schluessel reisen mit', () => {
        const ctx = makeContext();
        const res = normalize(ctx, {
            _version: ctx.APP_CONFIG.VERSION,
            npcs: [],
            _campaignName: 'Alt',
            _exportDate: '2026-01-01',
            _dataType: 'campaign',
            _exportType: 'x',
            _appVersion: '2.6.1',
            zukunftsFeld: { a: 1 }
        });
        expect(res.ok).toBe(true);
        for (const meta of [
            '_campaignName',
            '_exportDate',
            '_dataType',
            '_exportType',
            '_appVersion'
        ]) {
            expect(Object.prototype.hasOwnProperty.call(res.data, meta)).toBe(false);
        }
        expect(plain(res.data.zukunftsFeld)).toEqual({ a: 1 });
    });

    test('S13: randomTables, shops, dmScreenLayout bleiben abwesend, wenn sie fehlen (Seed-Logik)', () => {
        const ctx = makeContext();
        const res = normalize(ctx, { _version: ctx.APP_CONFIG.VERSION, npcs: [{ id: 1 }] });
        expect(res.ok).toBe(true);
        for (const key of ['randomTables', 'shops', 'dmScreenLayout', 'dmScreenProfiles']) {
            expect({ key, present: Object.prototype.hasOwnProperty.call(res.data, key) }).toEqual({
                key,
                present: false
            });
        }
        // Standardwerte aus initializeData() sind ergaenzt
        expect(plain(res.data.initiative)).toEqual({ combatants: [], currentTurn: 0, round: 1 });
        expect(Array.isArray(res.data.factions)).toBe(true);
    });

    test('der Normalisierer liest und schreibt window.D nicht', () => {
        const ctx = makeContext();
        const before = JSON.stringify(ctx.D);
        const res = normalize(ctx, { npcs: [{ id: 1 }], _nextId: { npcs: 5 } });
        expect(res.ok).toBe(true);
        expect(JSON.stringify(ctx.D)).toBe(before);
        expect(res.data).not.toBe(ctx.D);
    });
});

describe('MIGRATIONS 2.3.0 — nicht zerstoerend (R01-Skeptiker)', () => {
    test('S2: versionslose aktuelle Zustands-Objekte bleiben unveraendert', () => {
        const ctx = makeContext();
        const conditions = [
            { type: 'poisoned', name: 'Vergiftet', addedAt: 1 },
            { type: 'custom', name: 'Verflucht', addedAt: 2 }
        ];
        const migrated = ctx.migrateData({
            characters: [{ id: 1, conditions: plain(conditions) }]
        });
        expect(plain(migrated.characters[0].conditions)).toEqual(conditions);
    });

    test('S3: Alt-Zeichenketten werden zu darstellbaren Objekten repariert', () => {
        const ctx = makeContext();
        const migrated = ctx.migrateData({
            _version: '2.2.0',
            characters: [{ id: 1, conditions: ['poisoned', 'x', 42, null] }]
        });
        expect(plain(migrated.characters[0].conditions)).toEqual([
            { type: 'poisoned', name: 'Vergiftet' },
            { type: 'x', name: 'x' }
        ]);
    });
});

describe('normalizeCampaignData() — Versionsbehandlung', () => {
    test('S4: ein 2.11-Stempel wird wie in load() normalisiert und migriert', () => {
        const ctx = makeContext();
        const res = normalize(ctx, {
            _version: '2.11',
            characters: [
                { id: 1, name: 'Alt', characterClass: 'Wizard', level: 3, conditions: ['prone'] },
                {
                    id: 2,
                    name: 'Neu',
                    conditions: [{ type: 'poisoned', name: 'Vergiftet', addedAt: 5 }]
                }
            ],
            calendar: { day: 1, month: 0, year: 1492, events: [] }
        });
        expect(res.ok).toBe(true);
        const [alt, neu] = res.data.characters;
        expect(Array.isArray(alt.spellSlotsUsed)).toBe(true);
        expect(res.data.calendar.month).toBeGreaterThanOrEqual(1);
        expect(plain(alt.conditions)).toEqual([{ type: 'prone', name: 'Liegend' }]);
        expect(plain(neu.conditions)).toEqual([
            { type: 'poisoned', name: 'Vergiftet', addedAt: 5 }
        ]);
        expect(res.data._version).toBe(ctx.APP_CONFIG.VERSION);
    });

    test('S4b: normalizeLegacyVersionStamp folgt der load()-Regel', () => {
        const ctx = makeContext();
        expect(typeof ctx.normalizeLegacyVersionStamp).toBe('function');
        expect(ctx.normalizeLegacyVersionStamp({ _version: '2.11' })._version).toBe('2.0.0');
        expect('_version' in ctx.normalizeLegacyVersionStamp({ _version: 2.6 })).toBe(false);
        expect(ctx.normalizeLegacyVersionStamp({ _version: '2.6.1' })._version).toBe('2.6.1');
    });

    test('S5: numerisches _version wirft nicht und gilt als fehlend', () => {
        const ctx = makeContext();
        expect(() => ctx.compareVersions(2.6, '2.6.1')).not.toThrow();
        const res = normalize(ctx, { _version: 2.6, characters: [{ id: 1, name: 'A', level: 1 }] });
        expect(res.ok).toBe(true);
        expect(res.data._version).toBe(ctx.APP_CONFIG.VERSION);
        // Migration lief (2.4.0 legt spellSlotsUsed an)
        expect(Array.isArray(res.data.characters[0].spellSlotsUsed)).toBe(true);
    });

    test('ein aktuell gestempelter Stand wird nicht erneut migriert (load()-Paritaet)', () => {
        const ctx = makeContext();
        const res = normalize(ctx, {
            _version: ctx.APP_CONFIG.VERSION,
            characters: [{ id: 1, name: 'A' }],
            calendar: { day: 1, month: 0, year: 1492, events: [] }
        });
        expect(res.ok).toBe(true);
        expect(res.data.calendar.month).toBe(0);
        expect(res.data.characters[0].spellSlotsUsed).toBeUndefined();
    });
});

describe('normalizeCampaignData() — Eingangsgrenze', () => {
    test('S6: __proto__-Schluessel (JSON-Text und Objekt) veraendern keinen Prototyp', () => {
        const ctx = makeContext();
        const vmObjectProto = vm.runInContext('Object.prototype', ctx);
        const text =
            '{"characters":[],"__proto__":{"polluted":true},"settings":{"__proto__":{"polluted":true}}}';
        for (const raw of [text, JSON.parse(text)]) {
            const res = normalize(ctx, raw);
            expect(res.ok).toBe(true);
            expect(Object.getPrototypeOf(res.data)).toBe(vmObjectProto);
            expect(Object.getPrototypeOf(res.data.settings)).toBe(vmObjectProto);
            expect(res.data.polluted).toBeUndefined();
            expect(res.data.settings.polluted).toBeUndefined();
            expect(res.data.settings.theme).toBe('dark');
        }
        expect(vm.runInContext('({}).polluted', ctx)).toBeUndefined();
    });

    test.each([
        [{ characters: 'x' }, 'characters'],
        [{ npcs: [], calendar: { events: 'x' } }, 'calendar.events'],
        [{ npcs: [], randomTables: {} }, 'randomTables'],
        [{ npcs: [], quickNotes: 5 }, 'quickNotes'],
        [{ npcs: [], soundboard: { scenes: {} } }, 'soundboard.scenes'],
        [{ npcs: [], calendar: 'x' }, 'calendar'],
        [{ npcs: [], initiative: { combatants: 'x' } }, 'initiative.combatants']
    ])('S7: falscher Containertyp %j wird abgelehnt (Schluessel %s genannt)', (raw, key) => {
        const ctx = makeContext();
        const before = JSON.stringify(raw);
        const res = normalize(ctx, raw);
        expect(res.ok).toBe(false);
        expect(res.error).toContain(`"${key}"`);
        expect(JSON.stringify(raw)).toBe(before);
    });

    test.each([['{kaputt'], ['[1,2,3]'], ['null'], ['"text"']])(
        'ungueltiger Text %s wird abgelehnt',
        raw => {
            const ctx = makeContext();
            const res = normalize(ctx, raw);
            expect(res.ok).toBe(false);
            expect(typeof res.error).toBe('string');
        }
    );

    test('S8: reparable Felder werden ersetzt bzw. verworfen, mit Reparaturhinweis', () => {
        const ctx = makeContext();
        const res = normalize(ctx, {
            npcs: [],
            initiative: null,
            settings: [],
            diceHistory: 'x',
            partyGold: 'viel',
            dmScreenActiveProfile: 7
        });
        expect(res.ok).toBe(true);
        expect(plain(res.data.initiative)).toEqual({ combatants: [], currentTurn: 0, round: 1 });
        expect(plain(res.data.settings)).toEqual(plain(ctx.initializeData().settings));
        expect(res.data.diceHistory).toBeUndefined();
        expect(res.data.partyGold).toBeUndefined();
        expect(res.data.dmScreenActiveProfile).toBeUndefined();
        expect(res.repairs.length).toBeGreaterThan(0);
    });

    test('S9: settings werden einstufig mit den Standardwerten zusammengefuehrt', () => {
        const ctx = makeContext();
        const res = normalize(ctx, {
            _version: ctx.APP_CONFIG.VERSION,
            settings: { levelingMode: 'milestone' }
        });
        expect(res.ok).toBe(true);
        expect(res.data.settings.theme).toBe('dark');
        expect(res.data.settings.levelingMode).toBe('milestone');
    });

    test('S14: null-Unterlisten werden zu leeren Listen (Schritt 7)', () => {
        // Pin fuer ensureCampaignContainerLists(): checkCampaignShape LAESST null fuer
        // calendar.events und initiative.combatants durch, der Default-Merge in Schritt 6
        // kopiert dieses null ueber den Standardwert, und validateDataIntegrity repariert
        // verschachtelte Listen nicht. Verbraucher greifen ungeschuetzt zu
        // (features/initiative.js: D.initiative.combatants.length) — ohne Schritt 7 legte
        // ein Restore oder Import eine null-Liste in D.
        const ctx = makeContext();
        const res = normalize(ctx, {
            npcs: [],
            calendar: { day: 1, month: 1, year: 1492, events: null },
            initiative: { combatants: null, currentTurn: 0, round: 1 },
            soundboard: { scenes: null }
        });
        expect(res.ok).toBe(true);
        expect(plain(res.data.calendar.events)).toEqual([]);
        expect(plain(res.data.initiative.combatants)).toEqual([]);
        expect(plain(res.data.soundboard.scenes)).toEqual([]);
        expect(res.repairs).toEqual(
            expect.arrayContaining([
                'calendar.events: fehlte, leere Liste angelegt',
                'initiative.combatants: fehlte, leere Liste angelegt',
                'soundboard.scenes: fehlte, leere Liste angelegt'
            ])
        );
    });
});

describe('normalizeCampaignData() — IDs und Zaehler (R03)', () => {
    test('S10a: doppelte, fehlende und Zeichenketten-IDs werden eindeutig numerisch', () => {
        const ctx = makeContext();
        const res = normalize(ctx, {
            npcs: [{ id: 4 }, { id: 4 }, { name: 'ohne' }, { id: '9' }],
            calendar: { day: 1, month: 1, year: 1492, events: [{ id: 2 }, { id: 2 }] },
            initiative: { combatants: [{ id: 3 }, { id: 3 }], currentTurn: 0, round: 1 }
        });
        expect(res.ok).toBe(true);
        const ids = res.data.npcs.map(n => n.id);
        expect(ids.every(id => typeof id === 'number')).toBe(true);
        expect(new Set(ids).size).toBe(4);
        expect(ids[0]).toBe(4);
        expect(ids[3]).toBe(9);
        expect(res.data._nextId.npcs).toBeGreaterThan(Math.max(...ids));
        const evIds = res.data.calendar.events.map(e => e.id);
        expect(new Set(evIds).size).toBe(2);
        const cbIds = res.data.initiative.combatants.map(c => c.id);
        expect(new Set(cbIds).size).toBe(2);
        const renumbered = plain(res.renumbered);
        expect(renumbered).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'npcs', from: '9', to: 9 }),
                expect.objectContaining({ type: 'calendarEvents' }),
                expect.objectContaining({ type: 'combatants' })
            ])
        );
        expect(renumbered.filter(r => r.type === 'npcs')).toHaveLength(3);
        expect(res.repairs.length).toBeGreaterThan(0);
    });

    test('S10b: Datei-Zaehler oberhalb der Untergrenze wird respektiert, 1e300 ignoriert, Alt-Schluessel bleibt', () => {
        const ctx = makeContext();
        const honoured = normalize(ctx, { npcs: [{ id: 9 }], _nextId: { npcs: 20, items: 3 } });
        expect(honoured.ok).toBe(true);
        expect(honoured.data._nextId.npcs).toBe(20);
        expect(honoured.data._nextId.items).toBe(3);

        const ignored = normalize(ctx, { npcs: [{ id: 9 }], _nextId: { npcs: 1e300 } });
        expect(ignored.ok).toBe(true);
        expect(ignored.data._nextId.npcs).toBe(10);

        // Jeder Registertyp bekommt einen gueltigen Zaehler
        for (const type of Object.keys(ctx.ID_COUNTER_PATHS)) {
            expect({ type, valid: ctx.isValidEntityId(ignored.data._nextId[type]) }).toEqual({
                type,
                valid: true
            });
        }
    });
});

describe('Kampagnen-Grundbausteine aus core/data.js (U2)', () => {
    test('replaceCampaignData ersetzt in place: keine Alt-Schluessel, kein __proto__', () => {
        const ctx = makeContext();
        const target = ctx.D;
        target.factions = [{ id: 1, name: 'Alt' }];
        target.altFeld = 'weg';
        const next = JSON.parse(
            '{"npcs":[{"id":2}],"__proto__":{"polluted":true},"settings":{"theme":"light"}}'
        );
        const result = ctx.replaceCampaignData(target, next);
        expect(result).toBe(target);
        expect(ctx.D).toBe(target);
        expect(Object.keys(target).sort()).toEqual(['npcs', 'settings']);
        expect(target.polluted).toBeUndefined();
        expect(Object.getPrototypeOf(target)).toBe(vm.runInContext('Object.prototype', ctx));
    });

    test('getActiveCampaignKey: Override vor Standard; kein nicht-leerer String -> null', () => {
        const ctx = makeContext();
        expect(ctx.getActiveCampaignKey()).toBe(ctx.APP_CONFIG.STORAGE_KEY);
        ctx.STORAGE_KEY_OVERRIDE = 'dnd-campaign-x';
        expect(ctx.getActiveCampaignKey()).toBe('dnd-campaign-x');
        ctx.STORAGE_KEY_OVERRIDE = '';
        expect(ctx.getActiveCampaignKey()).toBe(ctx.APP_CONFIG.STORAGE_KEY);
        ctx.STORAGE_KEY_OVERRIDE = 5;
        expect(ctx.getActiveCampaignKey()).toBeNull();
    });
});
