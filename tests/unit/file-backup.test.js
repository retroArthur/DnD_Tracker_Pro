/**
 * File-Backup Tests — TECH-03 (Wave-0 RED-Phase)
 * Testet writeBackupForCampaign() und pruneOldSnapshots() mit gemockter
 * File System Access API (showDirectoryPicker / dirHandle.getFileHandle / createWritable).
 * RED-Phase: Implementierung fehlt (Plan 02-04, Welle 2). Tests werden nach
 * Implementierung gruen (jest-Framework sammelt sie jetzt bereits ein).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: File System Access API Mocks
// ============================================================

// Erstelle realistische Mock-Struktur fuer FileSystemDirectoryHandle
function createMockDirHandle() {
    const files = new Map(); // Simuliert gespeicherte Dateien

    const createMockWritable = (filename) => ({
        write: jest.fn(async () => {}),
        close: jest.fn(async () => { files.set(filename, true); })
    });

    const dirHandle = {
        kind: 'directory',
        name: 'dnd-backups',
        // WR-09: Reale File System Access API wirft NotFoundError, wenn die Datei
        // fehlt und { create: true } NICHT gesetzt ist — sonst ist der
        // Tages-Snapshot-Zweig (snapshotExists) nie erreichbar.
        getFileHandle: jest.fn(async (filename, opts) => {
            if (!opts?.create && !files.has(filename)) {
                throw Object.assign(new Error('NotFound'), { name: 'NotFoundError' });
            }
            return {
                name: filename,
                createWritable: jest.fn(async () => createMockWritable(filename))
            };
        }),
        removeEntry: jest.fn(async (filename) => { files.delete(filename); }),
        entries: jest.fn(async function* () {
            for (const [name] of files) {
                yield [name, { kind: 'file', name }];
            }
        }),
        _files: files
    };

    return dirHandle;
}

let writeBackupForCampaign;
let pruneOldSnapshots;
let mockDirHandle;

beforeEach(() => {
    mockDirHandle = createMockDirHandle();
});

beforeAll(() => {
    const context = {
        window: {
            APP_CONFIG: {
                VERSION: '2.7.0',
                STORAGE_KEY: 'dnd-tracker-data',
                DEBUG_MODE: false
            },
            _fileBackupDirHandle: null,
            showToast: jest.fn(),
            ErrorHandler: { log: jest.fn() },
            initIndexedDB: jest.fn(async () => {}),
            idb: null,
            showDirectoryPicker: jest.fn()
        },
        APP_CONFIG: {
            VERSION: '2.7.0',
            STORAGE_KEY: 'dnd-tracker-data',
            DEBUG_MODE: false
        },
        D: {
            characters: [{ id: 1, name: 'Held' }],
            npcs: [],
            settings: {}
        },
        StorageAPI: {
            getJSON: jest.fn(() => ({ characters: [], _version: '2.7.0' })),
            has: jest.fn(() => false)
        },
        sessionStorage: {
            getItem: jest.fn(() => null),
            setItem: jest.fn()
        },
        console: console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/file-backup/file-backup-manager.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    writeBackupForCampaign = context.writeBackupForCampaign;
    pruneOldSnapshots = context.pruneOldSnapshots;
});

// ============================================================
// TESTS
// ============================================================

describe('writeBackupForCampaign — Datei-Backup nach save() (TECH-03)', () => {
    test('writeBackupForCampaign schreibt aktuelle Datei nach save()', async () => {
        // RED-Phase: writeBackupForCampaign existiert noch nicht
        expect(typeof writeBackupForCampaign).toBe('function'); // Schlaegt fehl bis Plan 02-04 implementiert ist

        const campaignKey = 'dnd-tracker-data';
        const campaignName = 'Standard-Kampagne';
        const data = { characters: [{ id: 1, name: 'Held' }], _version: '2.7.0' };

        await writeBackupForCampaign(mockDirHandle, campaignKey, campaignName, data);

        // Erwartet: getFileHandle wurde aufgerufen (= Datei anlegen / oeffnen)
        expect(mockDirHandle.getFileHandle).toHaveBeenCalled();

        // WR-09: konkrete Dateinamen pruefen — -aktuell.json (laufend) UND
        // Tages-Snapshot ({safeName}-YYYY-MM-DD.json) muessen geschrieben sein
        const today = new Date().toISOString().slice(0, 10);
        expect(mockDirHandle._files.has('standard-kampagne-aktuell.json')).toBe(true);
        expect(mockDirHandle._files.has(`standard-kampagne-${today}.json`)).toBe(true);
    });

    test('writeBackupForCampaign schreibt pro Tag nur EINEN Snapshot (A2)', async () => {
        const campaignKey = 'dnd-tracker-data';
        const campaignName = 'Standard-Kampagne';
        const data = { characters: [], _version: '2.7.0' };
        const today = new Date().toISOString().slice(0, 10);

        // Snapshot fuer heute existiert bereits
        mockDirHandle._files.set(`standard-kampagne-${today}.json`, true);
        await writeBackupForCampaign(mockDirHandle, campaignKey, campaignName, data);

        // -aktuell.json wurde geschrieben, aber kein zweiter Snapshot-Schreibvorgang:
        // getFileHandle mit { create: true } darf fuer den Snapshot-Namen nicht
        // erneut aufgerufen worden sein
        const createCalls = mockDirHandle.getFileHandle.mock.calls
            .filter(c => c[1]?.create === true)
            .map(c => c[0]);
        expect(createCalls).toEqual(['standard-kampagne-aktuell.json']);
    });
});

describe('pruneOldSnapshots — Snapshot-Limit 10 pro Kampagne (D-12, TECH-03)', () => {
    test('pruneOldSnapshots behaelt max 10 Snapshots pro Kampagne', async () => {
        // RED-Phase: pruneOldSnapshots existiert noch nicht
        expect(typeof pruneOldSnapshots).toBe('function'); // Schlaegt fehl bis Plan 02-04 implementiert ist

        // Simuliere 15 vorhandene Snapshot-Dateien fuer diese Kampagne
        // (reale Namenskonvention: {safeName}-YYYY-MM-DD.json, vgl. getBackupFilenames)
        const campaignKey = 'standard';
        const mockFiles = Array.from({ length: 15 }, (_, i) => {
            const padded = String(i + 1).padStart(2, '0');
            return `${campaignKey}-2026-01-${padded}.json`;
        });

        const mockDirWithFiles = {
            ...mockDirHandle,
            entries: jest.fn(async function* () {
                for (const name of mockFiles) {
                    yield [name, { kind: 'file', name }];
                }
            }),
            removeEntry: jest.fn(async () => {})
        };

        await pruneOldSnapshots(mockDirWithFiles, campaignKey, 10);

        // Erwartet: 5 aelteste Dateien geloescht (15 - 10 = 5)
        expect(mockDirWithFiles.removeEntry).toHaveBeenCalledTimes(5);

        // WR-09: und zwar exakt die 5 AELTESTEN
        const removed = mockDirWithFiles.removeEntry.mock.calls.map(c => c[0]);
        expect(removed).toEqual([
            `${campaignKey}-2026-01-01.json`,
            `${campaignKey}-2026-01-02.json`,
            `${campaignKey}-2026-01-03.json`,
            `${campaignKey}-2026-01-04.json`,
            `${campaignKey}-2026-01-05.json`
        ]);
    });

    test('pruneOldSnapshots ignoriert Snapshots fremder Kampagnen (Praefix-Kollision, CR-05)', async () => {
        // Kampagne "kampagne" hat 11 Snapshots; Kampagne "kampagne-2" hat 2.
        // Substring-Matching wuerde die kampagne-2-Dateien mitzaehlen und
        // (wegen '-' < '0' in der Sortierung) ZUERST loeschen.
        const ownFiles = Array.from({ length: 11 }, (_, i) =>
            `kampagne-2026-01-${String(i + 1).padStart(2, '0')}.json`);
        const foreignFiles = ['kampagne-2-2026-01-01.json', 'kampagne-2-2026-01-02.json'];
        const allFiles = [...foreignFiles, ...ownFiles];

        const mockDir = {
            ...mockDirHandle,
            entries: jest.fn(async function* () {
                for (const name of allFiles) {
                    yield [name, { kind: 'file', name }];
                }
            }),
            removeEntry: jest.fn(async () => {})
        };

        await pruneOldSnapshots(mockDir, 'kampagne', 10);

        // Nur der aelteste EIGENE Snapshot wird geloescht — keine fremden Dateien
        const removed = mockDir.removeEntry.mock.calls.map(c => c[0]);
        expect(removed).toEqual(['kampagne-2026-01-01.json']);
    });
});
