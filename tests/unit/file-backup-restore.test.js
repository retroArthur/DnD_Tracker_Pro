/**
 * Restore aus dem Datei-Backup-Ordner ueber den gemeinsamen Normalisierer — R01
 * (Code-Review 2026-09-21, Einheit U4)
 *
 * restoreFromFileBackup() in systems/file-backup/file-backup-ui.js hatte eigene,
 * lueckenhafte Pruefungen:
 *   - ein "__proto__"-Schluessel in der Datei tauschte per Object.assign den Prototyp
 *     von D aus;
 *   - migrateData() lief VOR dem Auffuellen der Standardwerte, legte dabei ein
 *     settings = {levelingMode:'xp'} an, und die Standard-settings (theme …) fielen weg;
 *   - ein '2.11'-Stempel uebersprang die Migrationen 2.3.0/2.4.0;
 *   - der Undo-Punkt wurde VOR dem Lesen und Pruefen gesetzt (ungueltige Datei ->
 *     verwaister Undo-Eintrag);
 *   - der Erfolg wurde vor dem (nicht abgewarteten) Speichern gemeldet.
 *
 * Neu: Datei lesen -> normalizeCampaignData(text) -> erst bei Erfolg Undo-Punkt,
 * D ersetzen, Integritaet, Audio-Blobs wiederbeleben, rendern, saveImmediate();
 * Erfolg nur bei bestaetigtem Speichern.
 *
 * Harness: vm-Kontext = window mit den ECHTEN Quelldateien (inkl. version-migration.js,
 * initializeData aus core/data.js und dem gemeinsamen Restore-Schluss aus backups.js);
 * window._fileBackupDirHandle ist ein Double (getFileHandle -> getFile -> text).
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
    'systems/file-backup/file-backup-ui.js',
    'render/helpers.js'
];
const DATEI = 'Testkampagne-2026-09-20.json';

const plain = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const quelle = rel => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

function erzeugeWerkbank(opt = {}) {
    const log = [];
    const toasts = [];
    const ctx = { setTimeout, clearTimeout, Blob, console };
    ctx.window = ctx;
    ctx.document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };
    const lsStore = {};
    ctx.localStorage = {
        getItem: k => (Object.prototype.hasOwnProperty.call(lsStore, k) ? lsStore[k] : null),
        setItem: (k, v) => {
            lsStore[k] = String(v);
        },
        removeItem: k => {
            delete lsStore[k];
        }
    };
    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.debugLogAdd = jest.fn();
    ctx.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    ctx.CONDITIONS = { poisoned: { name: 'Vergiftet' }, prone: { name: 'Liegend' } };
    vm.createContext(ctx);
    for (const rel of FILES) vm.runInContext(quelle(rel), ctx, { filename: rel });

    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.STORAGE_KEY = 'dnd-tracker-v4';
    ctx.showToast = jest.fn(m => {
        toasts.push(String(m));
        log.push('toast:' + m);
    });
    ctx.confirm = jest.fn(() => true);
    ctx.saveUndoState = jest.fn(label => log.push({ undo: label, state: JSON.stringify(ctx.D) }));
    ctx.stopAllTracks = jest.fn(() => log.push('stopAllTracks'));
    ctx.renderAll = jest.fn(() => log.push('renderAll'));
    ctx.hideModal = jest.fn(id => log.push('hideModal:' + id));
    ctx.restoreSoundBlob = jest.fn(async id => {
        log.push('revive:' + id);
        return !(opt.fehlendeBlobs || []).includes(id);
    });
    let persistiert = null;
    ctx.saveImmediate = jest.fn(async () => {
        log.push('saveImmediate');
        persistiert = JSON.stringify(ctx.D);
        return opt.saveErgebnis === undefined
            ? { success: true, backend: 'localStorage' }
            : opt.saveErgebnis;
    });
    // WR-11-Pruefung wie im echten file-backup-manager.js (nur Snapshots der aktiven Kampagne)
    ctx.getActiveBackupFilenames = () => ({ safeName: 'Testkampagne' });
    ctx.getSnapshotRegex = safe => new RegExp('^' + safe + '-\\d{4}-\\d{2}-\\d{2}\\.json$');
    ctx._fileBackupDirHandle = {
        getFileHandle: jest.fn(async name => {
            if (opt.leseFehler) throw new Error('Datei nicht lesbar (Test)');
            log.push('lesen:' + name);
            return { getFile: async () => ({ text: async () => opt.text }) };
        })
    };
    if (opt.liveStand) ctx.replaceCampaignData(ctx.D, JSON.parse(JSON.stringify(opt.liveStand)));
    return {
        ctx,
        log,
        toasts,
        persistiert: () => (persistiert === null ? null : JSON.parse(persistiert))
    };
}

/** Vollstaendige Kampagne im aktuellen Format (wie backup-restore-roundtrip.test.js). */
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
                attacks: []
            }
        ],
        npcs: [{ id: 3, name: 'Borin', relations: [] }],
        quests: [{ id: 2, title: 'Die Mine', createdAt: 1700000000000 }],
        locations: [{ id: 4, name: 'Phandalin' }],
        encounters: [],
        loot: [],
        spells: [],
        wiki: [{ id: 8, title: 'Goetter' }],
        sessionNotes: [{ id: 9, title: 'Sitzung 1' }],
        storyArcs: [],
        bestiary: [{ id: 10, name: 'Hausdrache' }],
        sessionPreps: [{ id: 11, title: 'Vorbereitung' }],
        factions: [{ id: 12, name: 'Zhentarim', ruf: 5 }],
        links: [],
        filters: [],
        tags: ['boss'],
        quickNotes: 'Schnellnotiz',
        dmScreenNotes: 'DM-Notiz',
        soundboard: {
            ...defaults.soundboard,
            scenes: [
                {
                    id: 17,
                    name: 'Taverne',
                    slot: 1,
                    tracks: [{ blobId: 'blob-taverne', volume: 0.5, loop: true }]
                }
            ]
        },
        calendar: { ...defaults.calendar, day: 3, month: 5, events: [{ id: 18, title: 'Fest' }] },
        initiative: { ...defaults.initiative, combatants: [{ id: 19, name: 'Goblin' }], round: 2 },
        settings: { ...defaults.settings, theme: 'light', levelingMode: 'milestone' },
        randomTables: [
            { id: 20, name: 'Wetter', icon: 'W', entries: [{ weight: 1, text: 'Regen' }] }
        ],
        partyGold: 125,
        _nextId: {
            characters: 2,
            npcs: 4,
            quests: 3,
            locations: 5,
            encounters: 1,
            loot: 1,
            spells: 1,
            wiki: 9,
            sessionNotes: 10,
            bestiary: 11,
            sessionPreps: 12,
            factions: 13,
            shops: 1,
            links: 1,
            filters: 1,
            quickRefCustom: 1,
            calendarEvents: 19,
            combatants: 20,
            randomTables: 21
        },
        _version: ctx.APP_CONFIG.VERSION
    };
}

describe('restoreFromFileBackup() — gemeinsamer Normalisierer (R01)', () => {
    test('(a) __proto__ in der Datei veraendert den Prototyp von D nicht', async () => {
        const w = erzeugeWerkbank({
            text: '{"_version":"2.6.1","characters":[],"__proto__":{"polluted":true}}'
        });
        const vmObjectProto = vm.runInContext('Object.prototype', w.ctx);

        await w.ctx.restoreFromFileBackup(DATEI);

        expect(Object.getPrototypeOf(w.ctx.D)).toBe(vmObjectProto);
        expect(w.ctx.D.polluted).toBeUndefined();
        expect(vm.runInContext('({}).polluted', w.ctx)).toBeUndefined();
    });

    test('(b) Datei ohne settings -> Standard-settings (theme dark) plus levelingMode xp', async () => {
        const w = erzeugeWerkbank({
            text: JSON.stringify({ characters: [{ id: 1, name: 'Aria' }] })
        });

        await w.ctx.restoreFromFileBackup(DATEI);

        expect(plain(w.ctx.D.settings)).toMatchObject({ theme: 'dark', levelingMode: 'xp' });
    });

    test('(c) Alt-Stempel 2.11 mit Zeichenketten-Zustaenden wird migriert (Objekte, spellSlotsUsed)', async () => {
        const w = erzeugeWerkbank({
            text: JSON.stringify({
                _version: '2.11',
                characters: [
                    {
                        id: 1,
                        name: 'Alt',
                        characterClass: 'Wizard',
                        level: 3,
                        conditions: ['poisoned']
                    }
                ]
            })
        });

        await w.ctx.restoreFromFileBackup(DATEI);

        const held = plain(w.ctx.D.characters[0]);
        expect(held.conditions).toEqual([{ type: 'poisoned', name: 'Vergiftet' }]);
        expect(held.spellSlotsUsed).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    test.each([
        ['falscher Container-Typ', '{"characters":"kaputt"}'],
        ['kein JSON', 'das ist kein JSON'],
        ['JSON-Array', '[1,2,3]']
    ])(
        '(d) ungueltige Datei (%s) -> kein Undo-Punkt, D unveraendert, kein Speichern',
        async (_label, text) => {
            const w = erzeugeWerkbank({
                text,
                liveStand: { characters: [{ id: 1, name: 'Live' }] }
            });
            const vorher = JSON.stringify(w.ctx.D);

            await w.ctx.restoreFromFileBackup(DATEI);

            expect(w.ctx.saveUndoState).not.toHaveBeenCalled();
            expect(JSON.stringify(w.ctx.D)).toBe(vorher);
            expect(w.ctx.saveImmediate).not.toHaveBeenCalled();
            expect(w.toasts.some(t => t.startsWith('❌ Restore fehlgeschlagen'))).toBe(true);
        }
    );

    test('(d2) Lesefehler -> kein Undo-Punkt, D unveraendert, Fehlermeldung', async () => {
        const w = erzeugeWerkbank({
            leseFehler: true,
            liveStand: { characters: [{ id: 1, name: 'Live' }] }
        });
        const vorher = JSON.stringify(w.ctx.D);

        await w.ctx.restoreFromFileBackup(DATEI);

        expect(w.ctx.saveUndoState).not.toHaveBeenCalled();
        expect(JSON.stringify(w.ctx.D)).toBe(vorher);
        expect(w.toasts).toContain('❌ Restore fehlgeschlagen: Datei nicht lesbar (Test)');
    });

    test.each([
        ['{success:false}', { success: false, error: 'QUOTA_EXCEEDED' }],
        ['undefined', null]
    ])('(e) saveImmediate() liefert %s -> keine Erfolgsmeldung', async (_label, ergebnis) => {
        const w = erzeugeWerkbank({
            text: JSON.stringify({ _version: '2.6.1', characters: [{ id: 1, name: 'Aria' }] }),
            saveErgebnis: ergebnis === null ? undefined : ergebnis
        });
        if (ergebnis === null) w.ctx.saveImmediate = jest.fn(async () => undefined);

        await w.ctx.restoreFromFileBackup(DATEI);

        expect(w.ctx.saveImmediate).toHaveBeenCalledTimes(1);
        expect(w.toasts).not.toContain('✅ Backup wiederhergestellt');
    });

    test('(e2) Reihenfolge: lesen -> Undo-Punkt (alter Stand) -> ersetzen -> speichern -> Erfolg -> Modal zu', async () => {
        const w = erzeugeWerkbank({
            text: JSON.stringify({ _version: '2.6.1', characters: [{ id: 1, name: 'Aria' }] }),
            liveStand: { characters: [{ id: 5, name: 'Vorher' }] }
        });

        await w.ctx.restoreFromFileBackup(DATEI);

        const i = e => w.log.findIndex(x => (typeof e === 'function' ? e(x) : x === e));
        const undo = w.log.find(
            x => x && typeof x === 'object' && x.undo === 'Backup wiederhergestellt'
        );
        expect(undo).toBeDefined();
        expect(JSON.parse(undo.state)).toEqual({ characters: [{ id: 5, name: 'Vorher' }] });
        expect(i('lesen:' + DATEI)).toBeLessThan(w.log.indexOf(undo));
        expect(w.log.indexOf(undo)).toBeLessThan(i('saveImmediate'));
        expect(i('saveImmediate')).toBeLessThan(i('toast:✅ Backup wiederhergestellt'));
        expect(i('toast:✅ Backup wiederhergestellt')).toBeLessThan(
            i('hideModal:file-backup-modal')
        );
    });

    test('(f) Waechter: Voll-Fixture-Rundlauf ist tief gleich (D und gespeicherter Stand)', async () => {
        const probe = erzeugeWerkbank({ text: '{}' });
        const fixture = volleKampagne(probe.ctx);
        const w = erzeugeWerkbank({ text: JSON.stringify(fixture) });

        await w.ctx.restoreFromFileBackup(DATEI);

        const D = plain(w.ctx.D);
        const gespeichert = w.persistiert() || {};
        for (const key of Object.keys(fixture)) {
            expect({ key, value: D[key] }).toEqual({ key, value: plain(fixture[key]) });
            expect({ key, value: gespeichert[key] }).toEqual({ key, value: plain(fixture[key]) });
        }
        expect(w.toasts).toContain('✅ Backup wiederhergestellt');
    });

    test('(g) referenzierte Audio-Blobs werden wiederbelebt, fehlende gemeldet', async () => {
        const probe = erzeugeWerkbank({ text: '{}' });
        const fixture = volleKampagne(probe.ctx);
        const w = erzeugeWerkbank({
            text: JSON.stringify(fixture),
            fehlendeBlobs: ['blob-taverne']
        });

        await w.ctx.restoreFromFileBackup(DATEI);

        expect(w.ctx.restoreSoundBlob).toHaveBeenCalledTimes(1);
        expect(w.ctx.restoreSoundBlob).toHaveBeenCalledWith('blob-taverne');
        expect(w.toasts.some(t => t.startsWith('⚠️') && t.includes('1 Audiodatei'))).toBe(true);
    });

    test('Waechter (WR-11): Snapshot einer fremden Kampagne wird abgelehnt, bevor gelesen wird', async () => {
        const w = erzeugeWerkbank({ text: '{}' });

        await w.ctx.restoreFromFileBackup('Andere-Kampagne-2026-09-20.json');

        expect(w.ctx._fileBackupDirHandle.getFileHandle).not.toHaveBeenCalled();
        expect(w.ctx.saveUndoState).not.toHaveBeenCalled();
        expect(w.toasts[0]).toContain('gehört nicht zur aktiven Kampagne');
    });
});
