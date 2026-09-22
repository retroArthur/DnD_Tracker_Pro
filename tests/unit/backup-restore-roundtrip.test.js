/**
 * Backup-Restore ueber den gemeinsamen Kampagnen-Normalisierer — R01
 * (Code-Review 2026-09-21, Einheit U4)
 *
 * restoreBackup() in systems/backups.js filterte jedes Backup gegen ein veraltetes,
 * lokal gepflegtes defaultD (15 Schluessel) und leerte D vorher komplett. Ergebnis:
 * sessionNotes, quickNotes, settings, calendar, bestiary, factions, sessionPreps,
 * soundboard, _nextId, tags, randomTables … verschwanden beim Wiederherstellen, die
 * Initiative kam als {entries, round} zurueck, es gab keine Migration, keinen
 * Undo-Punkt, und der Erfolg wurde gemeldet, ohne auf das Speichern zu warten.
 *
 * Neu: restoreBackup() normalisiert das Backup mit normalizeCampaignData(), bevor D,
 * der Undo-Stapel oder der Speicher angefasst werden; erst dann Undo-Punkt ->
 * replaceCampaignData() -> validateDataIntegrity() -> referenzierte Audio-Blobs
 * wiederbeleben -> rendern (Fehler nur loggen) -> saveImmediate(); Erfolg nur bei
 * bestaetigtem Speichern.
 *
 * Harness: vm-Kontext, der zugleich `window` ist, mit den ECHTEN Quelldateien
 * core/config.js, core/data.js, utils/basic.js, utils/idb-tx.js, utils/utilities.js,
 * systems/spellslots/version-migration.js, systems/backups.js,
 * systems/campaign-manager/campaign-manager.js und render/helpers.js. Das Modal wird
 * im jsdom-Dokument gerendert; restoreBackup() wird wie vom Klick-Handler
 * ('restore-backup': restoreBackup(parseEntityId(data-id))) aufgerufen. Das
 * IndexedDB-Double bildet die echte Index-Semantik nach: index('campaign').getAll(key)
 * filtert, getAll(undefined) liefert ALLE indizierten Datensaetze.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FILES = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/idb-tx.js',
    'utils/utilities.js',
    'systems/spellslots/version-migration.js',
    'systems/backups.js',
    'systems/campaign-manager/campaign-manager.js',
    'render/helpers.js'
];
const LOAD_FILES = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/utilities.js',
    'systems/spellslots/version-migration.js',
    'render/helpers.js',
    'systems/spellslots/quick-roll.js'
];

const STANDARD_KEY = 'dnd-tracker-v4';
const KEY_A = 'dnd-campaign-1000';
const BACKUP_KEY = 'dnd-tracker-backups';
const INDEX_KEY = 'dnd-tracker-campaigns';
const TS = 1700000000000;

// SEC-06-Inventar synchron aus der echten Quelle (Muster aus campaign-schema.test.js)
const _inventoryCtx = { window: {} };
vm.createContext(_inventoryCtx);
vm.runInContext(
    fs.readFileSync(path.join(REPO_ROOT, 'systems/migration/migration-wizard.js'), 'utf8'),
    _inventoryCtx
);
const INVENTAR = new Set([
    ..._inventoryCtx.window.CAMPAIGN_CONTENT_ARRAYS,
    ..._inventoryCtx.window.CAMPAIGN_CONTENT_TEXT_FIELDS,
    ..._inventoryCtx.window.CAMPAIGN_CONTENT_PATHS.map(p => p[0]),
    ..._inventoryCtx.window.CAMPAIGN_CONTENT_EXCLUDED
]);
// Phantome: im Inventar gefuehrt, aber von keinem aktuellen Schreibpfad erzeugt
for (const phantom of ['timers', 'campaign', 'notes', 'items']) INVENTAR.delete(phantom);

/** JSON-Rundlauf: vm-Objekte (fremder Realm) vergleichbar machen. */
const plain = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

const quelle = rel => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

function erzeugeLocalStorage(store) {
    return {
        getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
        setItem: (k, v) => {
            store[k] = String(v);
        },
        removeItem: k => {
            delete store[k];
        },
        clear: () => {
            for (const k of Object.keys(store)) delete store[k];
        }
    };
}

/**
 * IndexedDB-Double fuer den 'backups'-Store mit der echten Semantik des
 * 'campaign'-Index: getAll(key) filtert exakt, getAll(undefined|null) liefert alle
 * Datensaetze, deren campaignKey ein gueltiger Schluessel ist.
 */
function erzeugeFakeIdb(datensaetze = [], fehler = null) {
    const rows = datensaetze.map(r => ({ ...r }));
    const getAllAnfragen = [];
    const istSchluessel = k => typeof k === 'string' || (typeof k === 'number' && !Number.isNaN(k));
    const db = {
        transaction(_names, mode) {
            if (fehler === 'transaction') throw new Error('IndexedDB nicht verfuegbar (Test)');
            const tx = { oncomplete: null, onabort: null, onerror: null, error: null, mode };
            let offen = 0;
            let fertig = false;
            const pruefeEnde = () => {
                if (offen === 0 && !fertig) {
                    fertig = true;
                    setTimeout(() => tx.oncomplete && tx.oncomplete({ target: tx }), 0);
                }
            };
            const anfrage = ausfuehren => {
                const req = { result: undefined, error: null, onsuccess: null, onerror: null };
                offen++;
                setTimeout(() => {
                    req.result = ausfuehren();
                    if (req.onsuccess) req.onsuccess({ target: req });
                    offen--;
                    pruefeEnde();
                }, 0);
                return req;
            };
            tx.objectStore = () => ({
                index: () => ({
                    getAll(query) {
                        getAllAnfragen.push(query);
                        return anfrage(() =>
                            rows
                                .filter(
                                    r =>
                                        istSchluessel(r.campaignKey) &&
                                        (query === undefined ||
                                            query === null ||
                                            r.campaignKey === query)
                                )
                                .map(r => JSON.parse(JSON.stringify(r)))
                        );
                    }
                }),
                put: rec =>
                    anfrage(() => {
                        const i = rows.findIndex(r => r.id === rec.id);
                        if (i >= 0) rows[i] = { ...rec };
                        else rows.push({ ...rec });
                        return rec.id;
                    }),
                delete: id =>
                    anfrage(() => {
                        const i = rows.findIndex(r => r.id === id);
                        if (i >= 0) rows.splice(i, 1);
                    })
            });
            setTimeout(pruefeEnde, 0);
            return tx;
        }
    };
    return {
        db,
        rows,
        getAllAnfragen,
        ablegen: rec => rows.push({ ...rec })
    };
}

/** Backup-Datensatz in der Form, die saveBackupToIndexedDB() schreibt. */
function idbDatensatz(campaignKey, timestamp, kampagne) {
    return {
        id: `${campaignKey}-${timestamp}`,
        timestamp,
        campaignKey,
        data: typeof kampagne === 'string' ? kampagne : JSON.stringify(kampagne)
    };
}

/**
 * Restore-Werkbank. Stubs werden NACH dem Laden gesetzt, weil die Funktions-
 * deklarationen der Module (showToast in utilities.js) sonst die Stubs ueberschreiben.
 */
function erzeugeWerkbank(opt = {}) {
    const aktiv = opt.aktiv === undefined ? KEY_A : opt.aktiv;
    const lsStore = {
        [INDEX_KEY]: JSON.stringify({
            campaigns: [{ key: KEY_A, name: 'Kampagne A', created: '2026-09-01T00:00:00.000Z' }],
            active: aktiv
        })
    };
    if (opt.lsBackups) lsStore[BACKUP_KEY] = JSON.stringify(opt.lsBackups);
    const fake = erzeugeFakeIdb(opt.idbBackups || [], opt.idbFehler || null);
    const log = [];
    const toasts = [];
    let persistiert = null;

    const ctx = { setTimeout, clearTimeout, Blob, console };
    ctx.window = ctx;
    ctx.document = document;
    ctx.localStorage = erzeugeLocalStorage(lsStore);
    ctx.structuredClone =
        typeof structuredClone === 'function'
            ? structuredClone
            : o => JSON.parse(JSON.stringify(o));
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    ctx.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    ctx.CONDITIONS = { poisoned: { name: 'Vergiftet' }, prone: { name: 'Liegend' } };
    vm.createContext(ctx);
    for (const rel of FILES) vm.runInContext(quelle(rel), ctx, { filename: rel });

    // render/helpers.js exportiert ein echtes ErrorHandler-Objekt (mit Konsolen-Senke)
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.STORAGE_KEY = STANDARD_KEY;
    if (aktiv !== STANDARD_KEY) ctx.STORAGE_KEY_OVERRIDE = aktiv;
    ctx.idb = fake.db;
    ctx.initIndexedDB = jest.fn(async () => {
        ctx.idb = fake.db;
        return fake.db;
    });
    ctx.showToast = jest.fn(m => {
        toasts.push(String(m));
        log.push('toast:' + m);
    });
    ctx.confirm = jest.fn(() => true);
    ctx.saveUndoState = jest.fn(label => log.push({ undo: label, state: JSON.stringify(ctx.D) }));
    ctx.stopAllTracks = jest.fn(() => log.push('stopAllTracks'));
    ctx.renderAll = jest.fn(() => {
        log.push('renderAll');
        if (opt.renderWirft) throw new Error('Render kaputt (Test)');
    });
    ctx.restoreSoundBlob = jest.fn(async id => {
        log.push('revive:' + id);
        return !(opt.fehlendeBlobs || []).includes(id);
    });
    ctx.saveImmediate = jest.fn(async () => {
        log.push('saveImmediate');
        persistiert = JSON.stringify(ctx.D);
        return opt.saveErgebnis === undefined
            ? { success: true, backend: 'localStorage' }
            : opt.saveErgebnis;
    });
    ctx.showModal = jest.fn();
    ctx.hideModal = jest.fn();
    if (opt.liveStand) ctx.replaceCampaignData(ctx.D, JSON.parse(JSON.stringify(opt.liveStand)));

    return {
        ctx,
        fake,
        log,
        toasts,
        persistiert: () => (persistiert === null ? null : JSON.parse(persistiert))
    };
}

/**
 * Nutzerweg: Backup-Modal oeffnen, "Wiederherstellen" in der (einzigen) Zeile klicken.
 * Spiegelt den Klick-Handler: ctx.id = parseEntityId(data-id); restoreBackup(ctx.id).
 */
async function wiederherstellenUeberModal(w) {
    await w.ctx.showBackupsModal();
    const knoepfe = document.querySelectorAll('#backups-list [data-action="restore-backup"]');
    expect(knoepfe).toHaveLength(1);
    const id = knoepfe[0].dataset.id ? w.ctx.parseEntityId(knoepfe[0].dataset.id) : null;
    await w.ctx.restoreBackup(id);
}

/**
 * Vollstaendig befuellte Kampagne im aktuellen Format (deckt das SEC-06-Inventar ab).
 * settings/calendar/initiative/soundboard tragen alle Standard-Schluessel und _nextId
 * alle 19 Registertypen (plus Alt-Schluessel items) oberhalb der Untergrenze, damit
 * Normalisierer und validateDataIntegrity() nichts veraendern muessen.
 * _version steht bewusst am Ende.
 */
function volleKampagne(ctx) {
    const defaults = ctx.initializeData();
    return {
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
            scenes: [
                {
                    id: 17,
                    name: 'Taverne',
                    slot: 1,
                    tracks: [
                        { blobId: 'blob-taverne', volume: 0.5, loop: true },
                        { blobId: 'blob-regen', volume: 0.3, loop: true }
                    ]
                },
                {
                    id: 22,
                    name: 'Sturm',
                    slot: 2,
                    tracks: [{ blobId: 'blob-regen', volume: 0.8, loop: false }]
                }
            ]
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
        },
        _version: ctx.APP_CONFIG.VERSION
    };
}

/** Ein abweichender Live-Stand (der Nutzer hat nach dem Backup weitergearbeitet). */
function abweichenderLiveStand(ctx) {
    const live = volleKampagne(ctx);
    live.characters.push({ id: 2, name: 'Nach dem Backup' });
    live.sessionNotes = [];
    live.quickNotes = 'Neuer Text';
    live.settings.theme = 'dark';
    return live;
}

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('R1 — Rundlauf: jedes Kampagnenfeld bleibt erhalten', () => {
    test('Fixture-Waechter: die Voll-Fixture deckt das SEC-06-Inventar ab (ohne Phantome)', () => {
        const w = erzeugeWerkbank();
        const fixture = volleKampagne(w.ctx);
        const fehlend = [...INVENTAR].filter(
            k => !Object.prototype.hasOwnProperty.call(fixture, k)
        );
        expect(fehlend).toEqual([]);
    });

    test('Backup (IndexedDB, aktive Kampagne) -> Wiederherstellen: jedes Feld tief gleich in D und im gespeicherten Stand', async () => {
        const probe = erzeugeWerkbank();
        const fixture = volleKampagne(probe.ctx);
        const w = erzeugeWerkbank({
            idbBackups: [idbDatensatz(KEY_A, TS, fixture)],
            liveStand: abweichenderLiveStand(probe.ctx)
        });

        await wiederherstellenUeberModal(w);

        const D = plain(w.ctx.D);
        for (const key of Object.keys(fixture)) {
            expect({ key, value: D[key] }).toEqual({ key, value: plain(fixture[key]) });
        }
        const gespeichert = w.persistiert();
        expect(gespeichert).not.toBeNull();
        for (const key of Object.keys(fixture)) {
            expect({ key, value: gespeichert[key] }).toEqual({ key, value: plain(fixture[key]) });
        }
        expect(w.toasts).toContain('✅ Backup wiederhergestellt');
    });
});

describe('R2 — versionsloses Backup im aktuellen Format uebersteht den naechsten Start', () => {
    test('Restore -> neuer Kontext -> echte load(): Charaktere tief gleich, Zustaende bleiben Objekte', async () => {
        const probe = erzeugeWerkbank();
        const backup = volleKampagne(probe.ctx);
        delete backup._version; // Erstsitzung: initializeData() setzt kein _version
        const w = erzeugeWerkbank({ idbBackups: [idbDatensatz(KEY_A, TS, backup)] });

        await wiederherstellenUeberModal(w);

        const gespeichert = w.persistiert();
        expect(gespeichert).not.toBeNull();
        // Der Stempel verhindert, dass der naechste load() den Stand erneut migriert
        expect(gespeichert._version).toBe(w.ctx.APP_CONFIG.VERSION);
        expect(plain(w.ctx.D.characters)).toEqual(plain(backup.characters));

        // Neustart: frischer Kontext, gespeicherter Stand im localStorage, echte load()
        const lsStore = {
            [KEY_A]: JSON.stringify(gespeichert),
            [KEY_A + '_ts']: String(Date.now())
        };
        const neu = { clearTimeout, Blob, console };
        neu.window = neu;
        neu.document = {
            getElementById: () => null,
            querySelector: () => null,
            querySelectorAll: () => []
        };
        neu.localStorage = erzeugeLocalStorage(lsStore);
        neu.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
        neu.debugLogAdd = jest.fn();
        neu.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
        neu.CONDITIONS = { poisoned: { name: 'Vergiftet' }, prone: { name: 'Liegend' } };
        vm.createContext(neu);
        for (const rel of LOAD_FILES) vm.runInContext(quelle(rel), neu, { filename: rel });
        neu.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
        neu.STORAGE_KEY = STANDARD_KEY;
        neu.STORAGE_KEY_OVERRIDE = KEY_A;
        neu.showToast = jest.fn();
        neu.save = jest.fn();
        neu.setTimeout = jest.fn(); // verzoegertes save() nach Reparaturen nicht einplanen

        await neu.load();

        const geladen = plain(neu.D.characters);
        expect(geladen).toEqual(plain(backup.characters));
        for (const cond of geladen[0].conditions) {
            expect(typeof cond).toBe('object');
            expect(typeof cond.type).toBe('string');
        }
        expect(geladen[0].conditions.map(c => c.name)).toEqual(['Vergiftet', 'Verflucht']);
    });
});

describe('R3 — ID-Zaehler nach dem Restore', () => {
    test('Backup mit vollstaendigem _nextId: jeder Zaehler mindestens so hoch wie im Backup', async () => {
        const probe = erzeugeWerkbank();
        const fixture = volleKampagne(probe.ctx);
        const w = erzeugeWerkbank({ idbBackups: [idbDatensatz(KEY_A, TS, fixture)] });

        await wiederherstellenUeberModal(w);

        const zaehler = plain(w.ctx.D._nextId) || {};
        for (const [type, wert] of Object.entries(fixture._nextId)) {
            expect({ type, ok: zaehler[type] >= wert }).toEqual({ type, ok: true });
        }
    });

    test('Backup ohne _nextId: combatants/calendarEvents kollidieren nicht mit vorhandenen IDs', async () => {
        const w = erzeugeWerkbank({
            idbBackups: [
                idbDatensatz(KEY_A, TS, {
                    _version: '2.6.1',
                    characters: [{ id: 1, name: 'Aria' }],
                    initiative: {
                        combatants: [{ id: 1, name: 'Goblin' }],
                        currentTurn: 0,
                        round: 1
                    },
                    calendar: { day: 1, month: 1, year: 1492, events: [{ id: 1, title: 'Fest' }] }
                })
            ]
        });

        await wiederherstellenUeberModal(w);

        expect(w.ctx.D._nextId?.combatants ?? 0).toBeGreaterThan(1);
        expect(w.ctx.D._nextId?.calendarEvents ?? 0).toBeGreaterThan(1);
        expect(w.ctx.nextId('combatants')).not.toBe(1);
        expect(w.ctx.nextId('calendarEvents')).not.toBe(1);
    });
});

describe('R4 — Initiative im kanonischen Schema', () => {
    test.each([
        ['ohne initiative', {}],
        ['mit initiative: null', { initiative: null }]
    ])('Backup %s -> {combatants: [], currentTurn: 0, round: 1}', async (_label, extra) => {
        const w = erzeugeWerkbank({
            idbBackups: [
                idbDatensatz(KEY_A, TS, {
                    _version: '2.6.1',
                    characters: [{ id: 1, name: 'Aria' }],
                    ...extra
                })
            ]
        });

        await wiederherstellenUeberModal(w);

        expect(plain(w.ctx.D.initiative)).toEqual({ combatants: [], currentTurn: 0, round: 1 });
        expect(w.toasts).toContain('✅ Backup wiederhergestellt');
    });
});

describe('R5 — Undo-Punkt, Reihenfolge und bestaetigtes Speichern', () => {
    test('genau ein Undo-Punkt "Backup wiederhergestellt" mit dem Stand VOR dem Restore, vor saveImmediate()', async () => {
        const vorher = { characters: [{ id: 9, name: 'Vorher' }], quickNotes: 'alt' };
        const probe = erzeugeWerkbank();
        const w = erzeugeWerkbank({
            idbBackups: [idbDatensatz(KEY_A, TS, volleKampagne(probe.ctx))],
            liveStand: vorher
        });

        await wiederherstellenUeberModal(w);

        expect(w.ctx.saveUndoState).toHaveBeenCalledTimes(1);
        expect(w.ctx.saveUndoState).toHaveBeenCalledWith('Backup wiederhergestellt');
        const undo = w.log.find(e => e && typeof e === 'object' && e.undo);
        expect(JSON.parse(undo.state)).toEqual(vorher);
        expect(w.log.indexOf(undo)).toBeLessThan(w.log.indexOf('saveImmediate'));
    });

    test('saveImmediate() meldet {success:false} -> keine Erfolgsmeldung', async () => {
        const probe = erzeugeWerkbank();
        const w = erzeugeWerkbank({
            idbBackups: [idbDatensatz(KEY_A, TS, volleKampagne(probe.ctx))],
            saveErgebnis: { success: false, error: 'QUOTA_EXCEEDED' }
        });

        await wiederherstellenUeberModal(w);

        expect(w.ctx.saveImmediate).toHaveBeenCalled();
        expect(w.toasts).not.toContain('✅ Backup wiederhergestellt');
    });

    test('Waechter: ungueltiges Backup -> D unveraendert, kein Speichern, kein Undo-Punkt, Meldung "fehlerhaft"', async () => {
        const probe = erzeugeWerkbank();
        const live = volleKampagne(probe.ctx);
        const w = erzeugeWerkbank({
            idbBackups: [idbDatensatz(KEY_A, TS, { characters: 'kaputt' })],
            liveStand: live
        });
        const vorher = JSON.stringify(w.ctx.D);

        await wiederherstellenUeberModal(w);

        expect(JSON.stringify(w.ctx.D)).toBe(vorher);
        expect(w.ctx.saveImmediate).not.toHaveBeenCalled();
        expect(w.ctx.saveUndoState).not.toHaveBeenCalled();
        expect(w.toasts.some(t => t.includes('fehlerhaft'))).toBe(true);
    });
});

describe('R6 — Soundboard: Metadaten zurueck, Audio-Blobs wiederbelebt', () => {
    test('Szenen tief gleich, restoreSoundBlob() je referenzierter blobId genau einmal, fehlende Datei gemeldet', async () => {
        const probe = erzeugeWerkbank();
        const fixture = volleKampagne(probe.ctx);
        const w = erzeugeWerkbank({
            idbBackups: [idbDatensatz(KEY_A, TS, fixture)],
            fehlendeBlobs: ['blob-regen']
        });

        await wiederherstellenUeberModal(w);

        expect(plain(w.ctx.D.soundboard)).toEqual(plain(fixture.soundboard));
        const ids = w.ctx.restoreSoundBlob.mock.calls.map(c => c[0]).sort();
        expect(ids).toEqual(['blob-regen', 'blob-taverne']);
        const warnung = w.toasts.find(t => t.startsWith('⚠️'));
        expect(warnung).toBeDefined();
        expect(warnung).toContain('1 Audiodatei');
        // Wiederbeleben vor dem Speichern (der naechste Start raeumt sonst Grabsteine ab)
        expect(w.log.indexOf('revive:blob-taverne')).toBeLessThan(w.log.indexOf('saveImmediate'));
    });

    test('Backup-Nutzlast und gespeicherter Stand tragen nur Metadaten, keine Audiodaten', async () => {
        const probe = erzeugeWerkbank();
        const fixture = volleKampagne(probe.ctx);
        const datensatz = idbDatensatz(KEY_A, TS, fixture);
        const w = erzeugeWerkbank({ idbBackups: [datensatz] });

        await wiederherstellenUeberModal(w);

        const nutzlast = JSON.parse(datensatz.data);
        const gespeichert = w.persistiert() || {};
        for (const stand of [nutzlast, gespeichert]) {
            const spuren = (stand.soundboard?.scenes || []).flatMap(s => s.tracks);
            expect(spuren).toHaveLength(3);
            for (const spur of spuren) {
                expect(Object.keys(spur).sort()).toEqual(['blobId', 'loop', 'volume']);
            }
        }
    });
});

describe('R7 — Prototyp-Schutz (Waechter)', () => {
    test('__proto__ auf oberster Ebene und in settings veraendert weder D noch Object.prototype', async () => {
        const text =
            '{"_version":"2.6.1","characters":[],"__proto__":{"polluted":true},' +
            '"settings":{"theme":"light","__proto__":{"polluted":true}}}';
        const w = erzeugeWerkbank({ idbBackups: [idbDatensatz(KEY_A, TS, text)] });
        const vmObjectProto = vm.runInContext('Object.prototype', w.ctx);

        await wiederherstellenUeberModal(w);

        expect(Object.getPrototypeOf(w.ctx.D)).toBe(vmObjectProto);
        expect(w.ctx.D.polluted).toBeUndefined();
        expect(w.ctx.D.settings?.polluted).toBeUndefined();
        expect(vm.runInContext('({}).polluted', w.ctx)).toBeUndefined();
    });
});

describe('R8 — Renderfehler nach dem Ersetzen ist kein "Backup fehlerhaft"', () => {
    test('renderAll() wirft -> keine Fehlermeldung, saveImmediate() laeuft, Erfolg wird gemeldet', async () => {
        const probe = erzeugeWerkbank();
        const w = erzeugeWerkbank({
            idbBackups: [idbDatensatz(KEY_A, TS, volleKampagne(probe.ctx))],
            renderWirft: true
        });

        await wiederherstellenUeberModal(w);

        expect(w.toasts.some(t => t.includes('fehlerhaft'))).toBe(false);
        expect(w.ctx.saveImmediate).toHaveBeenCalledTimes(1);
        expect(w.toasts).toContain('✅ Backup wiederhergestellt');
    });
});

describe('R9 — Alt-Stempel 2.11 wird wie in load() migriert', () => {
    test('Zeichenketten-Zustaende werden zu Objekten, spellSlotsUsed wird gesetzt', async () => {
        const w = erzeugeWerkbank({
            idbBackups: [
                idbDatensatz(KEY_A, TS, {
                    _version: '2.11',
                    characters: [
                        {
                            id: 1,
                            name: 'Alt',
                            characterClass: 'Wizard',
                            level: 3,
                            conditions: ['poisoned', 'prone']
                        }
                    ]
                })
            ]
        });

        await wiederherstellenUeberModal(w);

        const held = plain(w.ctx.D.characters[0]);
        expect(held.conditions).toEqual([
            { type: 'poisoned', name: 'Vergiftet' },
            { type: 'prone', name: 'Liegend' }
        ]);
        expect(held.spellSlotsUsed).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
        expect(w.ctx.D._version).toBe(w.ctx.APP_CONFIG.VERSION);
    });
});
