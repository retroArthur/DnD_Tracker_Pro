/**
 * Kampagnengetrennte Backup-Liste mit stabiler ID — R05 (Leseseite)
 * (Code-Review 2026-09-21, Einheit U4)
 *
 * getBackups() in systems/backups.js mischte die GEMEINSAME localStorage-Backup-Liste
 * ungefiltert zu den (korrekt nach campaignKey gefilterten) IndexedDB-Backups und gab
 * sie bei einem IndexedDB-Fehler sogar roh zurueck. Entdoppelt wurde nach Zeitstempel
 * VOR dem Filtern (ein fremdes Backup mit gleichem Zeitstempel verdeckte ein eigenes),
 * begrenzt NACH dem Zusammenfuehren (fremde Backups verdraengten eigene).
 * restoreBackup() bekam eine LISTENPOSITION, loeste sie gegen eine frisch berechnete
 * Liste auf (die Position driftet, sobald ein neues Auto-Backup dazukommt) und pruefte
 * die Kampagne nie. Das Modal zeigte keine Kampagne.
 *
 * Neu: beide Quellen werden vor dem Zusammenfuehren formgeprueft und nach dem aktiven
 * Kampagnenschluessel gefiltert (Alt-Backups ohne campaignKey werden nicht angeboten,
 * Nutzerentscheidung D1 = A); der Zeitstempel ist die stabile ID (data-id); der Restore
 * prueft die Zugehoerigkeit erneut; das Modal nennt die Kampagne.
 *
 * Harness wie tests/unit/backup-restore-roundtrip.test.js: vm-Kontext = window mit den
 * ECHTEN Quelldateien, jsdom-Dokument fuer das Modal, IndexedDB-Double mit der echten
 * Index-Semantik (getAll(undefined) liefert ALLE Datensaetze — sonst waere der
 * Schluessel-Waechter wirkungslos pruefbar).
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

const STANDARD_KEY = 'dnd-tracker-v4';
const KEY_A = 'dnd-campaign-1000';
const KEY_B = 'dnd-campaign-2000';
const BACKUP_KEY = 'dnd-tracker-backups';
const INDEX_KEY = 'dnd-tracker-campaigns';

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

/** IndexedDB-Double: 'campaign'-Index mit echter getAll-Semantik (s. Kopfkommentar). */
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
                        rows.push({ ...rec });
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
    return { db, rows, getAllAnfragen, ablegen: rec => rows.push({ ...rec }) };
}

/** localStorage-Backup (Form aus createAutoBackup); key undefined = Alt-Backup ohne Zuordnung. */
function lsBackup(key, timestamp, marker) {
    const b = {
        timestamp,
        data: JSON.stringify({ _version: '2.6.1', characters: [{ id: 1, name: marker }] })
    };
    if (key !== undefined) b.campaignKey = key;
    return b;
}
/** IndexedDB-Backup (Form aus saveBackupToIndexedDB). */
function idbBackup(key, timestamp, marker) {
    return { ...lsBackup(key, timestamp, marker), id: `${key}-${timestamp}` };
}

function erzeugeWerkbank(opt = {}) {
    const aktiv = opt.aktiv === undefined ? KEY_A : opt.aktiv;
    const lsStore = {
        [INDEX_KEY]: JSON.stringify({
            campaigns: [
                { key: KEY_A, name: 'Kampagne A', created: '2026-09-01T00:00:00.000Z' },
                { key: KEY_B, name: 'Kampagne B', created: '2026-09-02T00:00:00.000Z' }
            ],
            active: aktiv
        })
    };
    if (opt.lsBackups) lsStore[BACKUP_KEY] = JSON.stringify(opt.lsBackups);
    const fake = erzeugeFakeIdb(
        opt.idbBackups || [],
        opt.idbFehler === 'transaction' ? 'transaction' : null
    );
    const toasts = [];
    const confirms = [];

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
    ctx.CONDITIONS = {};
    vm.createContext(ctx);
    for (const rel of FILES) vm.runInContext(quelle(rel), ctx, { filename: rel });

    ctx.ErrorHandler = { log: jest.fn(), showError: jest.fn() };
    ctx.STORAGE_KEY = STANDARD_KEY;
    if (aktiv !== STANDARD_KEY) ctx.STORAGE_KEY_OVERRIDE = aktiv;
    ctx.idb = opt.idbFehler === 'init' ? null : fake.db;
    ctx.initIndexedDB = jest.fn(async () => {
        if (opt.idbFehler === 'init') throw new Error('IndexedDB nicht verfuegbar (Test)');
        ctx.idb = fake.db;
        return fake.db;
    });
    ctx.showToast = jest.fn(m => toasts.push(String(m)));
    ctx.confirm = jest.fn(m => {
        confirms.push(String(m));
        return true;
    });
    ctx.saveUndoState = jest.fn();
    ctx.stopAllTracks = jest.fn();
    ctx.renderAll = jest.fn();
    ctx.restoreSoundBlob = jest.fn(async () => true);
    ctx.saveImmediate = jest.fn(async () => ({ success: true, backend: 'localStorage' }));
    ctx.showModal = jest.fn();
    ctx.hideModal = jest.fn();
    ctx.replaceCampaignData(ctx.D, { characters: [{ id: 1, name: 'A-live' }] });
    return { ctx, fake, toasts, confirms };
}

const zeitstempel = liste => plain(liste).map(b => b.timestamp);
const kampagnen = liste => plain(liste).map(b => b.campaignKey);
const zeilenIds = () =>
    Array.from(document.querySelectorAll('#backups-list [data-action="restore-backup"]')).map(
        k => k.dataset.id
    );

// B1-Daten: beide Quellen enthalten A- und B-Backups
const B1_LS = [lsBackup(KEY_B, 3000, 'B-ls'), lsBackup(KEY_A, 1000, 'A-ls')];
const B1_IDB = [idbBackup(KEY_A, 2000, 'A-idb'), idbBackup(KEY_B, 4000, 'B-idb')];

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('IndexedDB-Double (Selbsttest)', () => {
    test('index.getAll(undefined) liefert ALLE Datensaetze wie in echtem IndexedDB', async () => {
        const fake = erzeugeFakeIdb(B1_IDB);
        const req = fake.db
            .transaction(['backups'], 'readonly')
            .objectStore('backups')
            .index('campaign')
            .getAll(undefined);
        await new Promise(r => {
            req.onsuccess = r;
        });
        expect(req.result.map(b => b.campaignKey).sort()).toEqual([KEY_A, KEY_B]);
    });
});

describe('getBackups() — nur Backups der aktiven Kampagne (R05)', () => {
    test('B1: beide Quellen werden vor dem Zusammenfuehren nach Kampagne gefiltert', async () => {
        const w = erzeugeWerkbank({ lsBackups: B1_LS, idbBackups: B1_IDB });
        const liste = await w.ctx.getBackups();
        expect(zeitstempel(liste)).toEqual([2000, 1000]);
        expect(kampagnen(liste)).toEqual([KEY_A, KEY_A]);
    });

    test('B2: IndexedDB-Fehler -> nur die gefilterte localStorage-Liste', async () => {
        const w = erzeugeWerkbank({
            lsBackups: B1_LS,
            idbBackups: B1_IDB,
            idbFehler: 'transaction'
        });
        const liste = await w.ctx.getBackups();
        expect(zeitstempel(liste)).toEqual([1000]);
        expect(kampagnen(liste)).toEqual([KEY_A]);
    });

    test('B2b: IndexedDB laesst sich nicht oeffnen -> nur die gefilterte localStorage-Liste', async () => {
        const w = erzeugeWerkbank({ lsBackups: B1_LS, idbBackups: B1_IDB, idbFehler: 'init' });
        const liste = await w.ctx.getBackups();
        expect(zeitstempel(liste)).toEqual([1000]);
    });

    test('B3: Standard-Kampagne sieht weder fremde noch zuordnungslose Alt-Backups (D1)', async () => {
        const w = erzeugeWerkbank({
            aktiv: STANDARD_KEY,
            lsBackups: [
                lsBackup(KEY_B, 3000, 'B'),
                lsBackup(undefined, 2000, 'Alt ohne Zuordnung'),
                lsBackup(STANDARD_KEY, 1000, 'Standard')
            ],
            idbFehler: 'transaction'
        });
        const liste = await w.ctx.getBackups();
        expect(zeitstempel(liste)).toEqual([1000]);
        expect(kampagnen(liste)).toEqual([STANDARD_KEY]);
    });

    test('B4: fremde Backups verdraengen keine eigenen (Begrenzung erst nach dem Filtern)', async () => {
        const w = erzeugeWerkbank({
            lsBackups: [5000, 4000, 3000, 2500, 2000].map(t => lsBackup(KEY_B, t, 'B-' + t)),
            idbBackups: [idbBackup(KEY_A, 1000, 'A-idb')]
        });
        const liste = await w.ctx.getBackups();
        expect(zeitstempel(liste)).toEqual([1000]);
    });

    test('B5: gleicher Zeitstempel in fremder und eigener Kampagne -> das eigene Backup bleibt sichtbar', async () => {
        const w = erzeugeWerkbank({
            lsBackups: [lsBackup(KEY_B, 2000, 'B-ls')],
            idbBackups: [idbBackup(KEY_A, 2000, 'A-idb')]
        });
        const liste = plain(await w.ctx.getBackups());
        expect(liste).toHaveLength(1);
        expect(liste[0].campaignKey).toBe(KEY_A);
        expect(JSON.parse(liste[0].data).characters[0].name).toBe('A-idb');
    });

    test('B11: kein aktiver Schluessel -> [] und keine IndexedDB-Abfrage (getAll(undefined) waere ALLES)', async () => {
        const w = erzeugeWerkbank({
            lsBackups: [lsBackup(KEY_A, 1000, 'A-ls')],
            idbBackups: [idbBackup(KEY_A, 2000, 'A-idb')]
        });
        w.ctx.getActiveCampaignKey = () => null;

        expect(plain(await w.ctx.getBackups())).toEqual([]);
        expect(w.fake.getAllAnfragen).toEqual([]);

        const vorher = JSON.stringify(w.ctx.D);
        await w.ctx.restoreBackup(1000);
        expect(JSON.stringify(w.ctx.D)).toBe(vorher);
        expect(w.ctx.confirm).not.toHaveBeenCalled();
        expect(w.toasts).toEqual(['❌ Keine aktive Kampagne']);
    });
});

describe('showBackupsModal() — stabile ID und sichtbare Kampagne (R05)', () => {
    test('B6: data-id ist der Zeitstempel (nur Ziffern), die Liste nennt die Kampagne', async () => {
        const w = erzeugeWerkbank({ lsBackups: B1_LS, idbBackups: B1_IDB });

        await w.ctx.showBackupsModal();

        const ids = zeilenIds();
        expect(ids).toEqual(['2000', '1000']);
        for (const id of ids) expect(id).toMatch(/^\d+$/);
        const liste = document.getElementById('backups-list');
        expect(liste.textContent).toContain('Kampagne A');
        const kopf = liste.querySelector('.meta-text');
        expect(kopf).not.toBeNull();
        expect(kopf.textContent).toBe('Kampagne: Kampagne A');
    });

    test('B6b: Zeilen-Markup unveraendert bis auf den data-id-Wert', async () => {
        const w = erzeugeWerkbank({ lsBackups: [lsBackup(KEY_A, 1000, 'A-ls')] });

        await w.ctx.showBackupsModal();

        const zeilen = document.querySelectorAll('#backups-list .backup-item');
        expect(zeilen).toHaveLength(1);
        const zeile = zeilen[0];
        expect(zeile.getAttribute('style')).toBe(
            'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-dark); border-radius: 6px; margin-bottom: 8px;'
        );
        const [info, knopf] = zeile.children;
        expect(info.children[0].getAttribute('style')).toBe('font-weight: 500;');
        expect(info.children[0].textContent).toBe(new Date(1000).toLocaleString('de-DE'));
        expect(info.children[1].getAttribute('style')).toBe(
            'font-size: 0.85em; color: var(--text-dim);'
        );
        expect(info.children[1].textContent).toBe('Backup #1 (0.0 MB)');
        expect(knopf.className).toBe('btn btn-sm');
        expect(knopf.dataset.action).toBe('restore-backup');
        expect(knopf.textContent).toBe('Wiederherstellen');
    });

    test('B6c: auch der leere Zustand nennt die Kampagne', async () => {
        const w = erzeugeWerkbank({ lsBackups: [lsBackup(KEY_B, 3000, 'B-ls')] });

        await w.ctx.showBackupsModal();

        const liste = document.getElementById('backups-list');
        expect(zeilenIds()).toEqual([]);
        expect(liste.querySelector('.meta-text')?.textContent).toBe('Kampagne: Kampagne A');
        expect(liste.textContent).toContain('Keine Backups');
    });

    test('B7: IndexedDB-/localStorage-Datensaetze mit ungueltigem Zeitstempel oder Nicht-String-Daten erscheinen nicht', async () => {
        const w = erzeugeWerkbank({
            lsBackups: [
                { timestamp: '1500', campaignKey: KEY_A, data: '{}' },
                lsBackup(KEY_A, 1000, 'A-ls')
            ],
            idbBackups: [
                { id: 'x1', timestamp: '"><img src=x>', campaignKey: KEY_A, data: '{}' },
                { id: 'x2', timestamp: 2500, campaignKey: KEY_A, data: { characters: [] } },
                idbBackup(KEY_A, 2000, 'A-idb')
            ]
        });

        await w.ctx.showBackupsModal();

        expect(zeilenIds()).toEqual(['2000', '1000']);
        expect(document.querySelector('#backups-list img')).toBeNull();
    });
});

describe('restoreBackup() — nur eigene Backups, stabile ID (R05)', () => {
    test('B8: direkter Restore eines B-Backups (auch per Listenposition) wird abgefangen', async () => {
        const w = erzeugeWerkbank({ lsBackups: B1_LS, idbBackups: B1_IDB });
        const vorher = JSON.stringify(w.ctx.D);

        for (const id of [3000, '3000', 0, '0']) {
            await w.ctx.restoreBackup(id);
        }

        expect(JSON.stringify(w.ctx.D)).toBe(vorher);
        expect(w.ctx.confirm).not.toHaveBeenCalled();
        expect(w.toasts.length).toBeGreaterThanOrEqual(4);
        for (const t of w.toasts) expect(t.startsWith('❌')).toBe(true);
    });

    test('B9: kein Positions-Drift — ein neues Auto-Backup zwischen Anzeige und Klick aendert das Ziel nicht', async () => {
        const w = erzeugeWerkbank({
            idbBackups: [idbBackup(KEY_A, 1000, 'A-alt'), idbBackup(KEY_A, 2000, 'A-mittel')]
        });
        await w.ctx.showBackupsModal();
        const obersteId = zeilenIds()[0];

        // Zwischen Anzeige und Klick laeuft das 5-Minuten-Auto-Backup
        w.fake.ablegen(idbBackup(KEY_A, 3000, 'A-neu'));
        await w.ctx.restoreBackup(w.ctx.parseEntityId(obersteId));

        expect(w.ctx.D.characters[0].name).toBe('A-mittel');
    });

    test('B10: findBackupForRestore() ist rein und unterscheidet ok/missing/foreign', () => {
        const w = erzeugeWerkbank();
        const a = lsBackup(KEY_A, 1000, 'A');
        const b = lsBackup(KEY_B, 3000, 'B');
        expect(typeof w.ctx.findBackupForRestore).toBe('function');
        expect(w.ctx.findBackupForRestore([a, b], 3000, KEY_A).status).toBe('foreign');
        expect(w.ctx.findBackupForRestore([a, b], 1000, KEY_A)).toEqual({
            status: 'ok',
            backup: a
        });
        expect(w.ctx.findBackupForRestore([a, b], '1000', KEY_A).status).toBe('ok');
        for (const id of [0, '0', 5000, 'abc', null, undefined, 1.5]) {
            expect({ id, status: w.ctx.findBackupForRestore([a, b], id, KEY_A).status }).toEqual({
                id,
                status: 'missing'
            });
        }
    });

    test('B12 (Kontrolle): eigenes Backup per Zeitstempel wird wiederhergestellt, die Rueckfrage nennt die Kampagne', async () => {
        const w = erzeugeWerkbank({ lsBackups: [lsBackup(KEY_A, 1000, 'A-ls')] });

        await w.ctx.restoreBackup(1000);

        expect(w.ctx.D.characters[0].name).toBe('A-ls');
        expect(w.confirms).toHaveLength(1);
        expect(w.confirms[0]).toContain('Kampagne A');
        expect(w.confirms[0]).toContain('Strg+Z');
        expect(w.toasts).toContain('✅ Backup wiederhergestellt');
    });
});

describe('getCampaignDisplayName() (campaign-manager.js)', () => {
    test('Standard-Kampagne, Name aus dem Index, sonst der Schluessel selbst', () => {
        const w = erzeugeWerkbank();
        expect(typeof w.ctx.getCampaignDisplayName).toBe('function');
        expect(w.ctx.getCampaignDisplayName(STANDARD_KEY)).toBe('Standard-Kampagne');
        expect(w.ctx.getCampaignDisplayName(KEY_B)).toBe('Kampagne B');
        expect(w.ctx.getCampaignDisplayName('dnd-campaign-999')).toBe('dnd-campaign-999');
    });
});
