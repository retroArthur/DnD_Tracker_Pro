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
        getFileHandle: jest.fn(async (filename, opts) => ({
            name: filename,
            createWritable: jest.fn(async () => createMockWritable(filename))
        })),
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

        // Erwartet: Dateiname enthaelt Kampagnennamen oder Datum
        const calledFilename = mockDirHandle.getFileHandle.mock.calls[0][0];
        expect(typeof calledFilename).toBe('string');
        expect(calledFilename.length).toBeGreaterThan(0);
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
    });
});
