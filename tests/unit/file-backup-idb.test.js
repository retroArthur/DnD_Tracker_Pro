/**
 * File-Backup im IndexedDB-Modus — DEBT-17
 *
 * Deckt die Interaktion ab, die bisher von KEINER Testdatei beruehrt wurde:
 * Was passiert mit dem Datei-Backup, wenn die Kampagne >5MB gross ist und
 * persistence.js deshalb in den IndexedDB-Modus wechselt?
 *
 * Der Bug: persistence.js:64-68 loescht nach bestaetigtem IDB-Write den
 * localStorage-Key (StorageAPI.remove(key)). _doBackup() las aber
 * ausschliesslich aus localStorage und fiel auf {} zurueck — also wurde eine
 * LEERE Kampagne nach -aktuell.json und in den Tages-Snapshot geschrieben,
 * waehrend pruneOldSnapshots() die letzten echten Snapshots wegraeumte und der
 * Status weiterhin 'active' meldete.
 *
 * tests/unit/file-backup.test.js prueft writeBackupForCampaign/pruneOldSnapshots
 * ausschliesslich MIT vorhandenen localStorage-Daten — deshalb konnte der
 * Defekt dort nicht auffallen.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../systems/file-backup/file-backup-manager.js');

// Realistische Kampagnendaten — das, was NICHT verloren gehen darf
const ECHTE_KAMPAGNE = {
    characters: [
        { id: 1, name: 'Thorin Eisenfaust', hpCurrent: 34, hpMax: 42 },
        { id: 2, name: 'Elara Mondschein', hpCurrent: 27, hpMax: 27 }
    ],
    npcs: [{ id: 1, name: 'Wirt Gundren' }],
    quests: [{ id: 1, title: 'Die verlorene Mine' }],
    _version: '2.6.1'
};

function createMockDirHandle() {
    const files = new Map();

    const dirHandle = {
        kind: 'directory',
        name: 'dnd-backups',
        getFileHandle: jest.fn(async (filename, opts) => {
            if (!opts?.create && !files.has(filename)) {
                throw Object.assign(new Error('NotFound'), { name: 'NotFoundError' });
            }
            return {
                name: filename,
                createWritable: jest.fn(async () => ({
                    write: jest.fn(async content => {
                        files.set(filename, content);
                    }),
                    close: jest.fn(async () => {})
                }))
            };
        }),
        removeEntry: jest.fn(async filename => {
            files.delete(filename);
        }),
        entries: jest.fn(async function* () {
            for (const [name] of files) {
                yield [name, { kind: 'file', name }];
            }
        }),
        _files: files
    };
    return dirHandle;
}

/**
 * Laedt file-backup-manager.js in eine frische Sandbox.
 * @param {Object} opts
 * @param {Object|null} opts.lsData      Was StorageAPI.getJSON liefert (null = LS-Key fehlt)
 * @param {Object|null} opts.idbData     Was in IndexedDB liegt (null = nichts)
 * @param {Object|null} opts.memoryD     Das laufende D-Objekt
 */
function loadModule({ lsData, idbData, memoryD }) {
    const dirHandle = createMockDirHandle();
    const showToast = jest.fn();

    const loadFromIndexedDBFallbackRaw = jest.fn(async () => {
        if (idbData === null) return null;
        return { id: 'dnd-tracker-data', data: JSON.stringify(idbData), timestamp: 1 };
    });

    const context = {
        window: {
            APP_CONFIG: {
                VERSION: '2.6.1',
                STORAGE_KEY: 'dnd-tracker-data',
                DEBUG_MODE: false
            },
            _fileBackupDirHandle: dirHandle,
            showToast,
            ErrorHandler: { log: jest.fn() },
            initIndexedDB: jest.fn(async () => {}),
            idb: null,
            loadFromIndexedDBFallbackRaw,
            D: memoryD
        },
        APP_CONFIG: {
            VERSION: '2.6.1',
            STORAGE_KEY: 'dnd-tracker-data',
            DEBUG_MODE: false
        },
        D: memoryD,
        StorageAPI: {
            // getJSON(key, default) — im IDB-Modus ist der Key weg, also default
            getJSON: jest.fn((key, def) => (lsData === null ? def : lsData)),
            has: jest.fn(() => lsData !== null)
        },
        sessionStorage: { getItem: jest.fn(() => null), setItem: jest.fn() },
        console
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);

    return { context, dirHandle, showToast, loadFromIndexedDBFallbackRaw };
}

/**
 * Liest die geschriebene `-aktuell.json` zurueck — unabhaengig davon, welchen
 * Praefix die Namensaufloesung erzeugt hat (ohne window.getCampaignIndex faellt
 * _getActiveCampaignName auf den Kampagnen-Key zurueck).
 */
function geschriebeneKampagne(dirHandle) {
    for (const [name, content] of dirHandle._files) {
        if (name.endsWith('-aktuell.json')) return JSON.parse(content);
    }
    return undefined;
}

describe('Datei-Backup im IndexedDB-Modus (DEBT-17)', () => {
    test('sichert die echten Daten aus IndexedDB, wenn der localStorage-Key fehlt', async () => {
        // IDB-Modus: persistence.js hat den LS-Key nach dem IDB-Write geloescht
        const { context, dirHandle } = loadModule({
            lsData: null,
            idbData: ECHTE_KAMPAGNE,
            memoryD: null
        });

        await context._doBackup(dirHandle);

        const geschrieben = geschriebeneKampagne(dirHandle);
        expect(geschrieben).toBeDefined();
        // Der eigentliche Punkt: NICHT {} — die Charaktere muessen drin sein
        expect(geschrieben).toEqual(ECHTE_KAMPAGNE);
        expect(geschrieben.characters).toHaveLength(2);
    });

    test('meldet nach erfolgreichem IDB-Backup weiterhin active', async () => {
        const { context, dirHandle } = loadModule({
            lsData: null,
            idbData: ECHTE_KAMPAGNE,
            memoryD: null
        });

        await context._doBackup(dirHandle);

        expect(context.getBackupStatus()).toBe('active');
    });

    test('schreibt NICHTS, wenn weder localStorage noch IndexedDB Daten liefern', async () => {
        // Schutz gegen die eigentliche Schadwirkung: eine leere Kampagne wuerde
        // -aktuell.json leeren UND pruneOldSnapshots die echten Snapshots
        // wegraeumen lassen.
        const { context, dirHandle } = loadModule({
            lsData: null,
            idbData: null,
            memoryD: null
        });

        await context._doBackup(dirHandle);

        expect(dirHandle._files.size).toBe(0);
        expect(dirHandle.removeEntry).not.toHaveBeenCalled();
    });

    test('meldet paused statt active, wenn keine Daten lesbar sind', async () => {
        const { context, dirHandle } = loadModule({
            lsData: null,
            idbData: null,
            memoryD: null
        });

        await context._doBackup(dirHandle);

        // Ein gruener Status bei nicht geschriebenem Backup ist die gefaehrlichste
        // Variante — der Nutzer verlaesst sich darauf.
        expect(context.getBackupStatus()).not.toBe('active');
    });

    test('bevorzugt localStorage, solange der Key existiert (Normalfall <5MB)', async () => {
        const { context, dirHandle, loadFromIndexedDBFallbackRaw } = loadModule({
            lsData: ECHTE_KAMPAGNE,
            idbData: { characters: [], _version: 'veraltet' },
            memoryD: null
        });

        await context._doBackup(dirHandle);

        expect(geschriebeneKampagne(dirHandle)).toEqual(
            ECHTE_KAMPAGNE
        );
        // Kein unnoetiger IDB-Zugriff im Normalfall
        expect(loadFromIndexedDBFallbackRaw).not.toHaveBeenCalled();
    });

    test('faellt auf das laufende D-Objekt zurueck, wenn beide Speicher leer sind', async () => {
        const { context, dirHandle } = loadModule({
            lsData: null,
            idbData: null,
            memoryD: ECHTE_KAMPAGNE
        });

        await context._doBackup(dirHandle);

        expect(geschriebeneKampagne(dirHandle)).toEqual(
            ECHTE_KAMPAGNE
        );
    });

    test('behandelt ein leeres Objekt aus localStorage wie fehlende Daten', async () => {
        // StorageAPI.getJSON liefert bei fehlendem Key den Default — frueher {}.
        // Ein leeres Objekt darf niemals als gueltige Kampagne durchgehen.
        const { context, dirHandle } = loadModule({
            lsData: {},
            idbData: ECHTE_KAMPAGNE,
            memoryD: null
        });

        await context._doBackup(dirHandle);

        expect(geschriebeneKampagne(dirHandle)).toEqual(
            ECHTE_KAMPAGNE
        );
    });
});
