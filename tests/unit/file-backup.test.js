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
let getBackupFilenames;
let resolveBackupTargets;
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
    getBackupFilenames = context.getBackupFilenames;
    resolveBackupTargets = context.resolveBackupTargets;
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

// ============================================================
// Plan 12-03, Task 1: getBackupFilenames()-Suffix + resolveBackupTargets() (D-04)
// ============================================================

describe('getBackupFilenames — optionales Kollisions-Suffix (D-04, Plan 12-03)', () => {
    test('ohne dritten Parameter unveraendert wie bisher', () => {
        expect(typeof getBackupFilenames).toBe('function');
        const result = getBackupFilenames('dnd-tracker-v4', 'Test');
        expect(result.current).toBe('test-aktuell.json');
        expect(result.safeName).toBe('test');
        expect(result.snapshot).toMatch(/^test-\d{4}-\d{2}-\d{2}\.json$/);
    });

    test('mit gesetztem Suffix wird er nach der Bereinigung an den Namen angehaengt', () => {
        const result = getBackupFilenames('dnd-campaign-1', 'Test', 'standard');
        expect(result.current).toBe('test-standard-aktuell.json');
        expect(result.safeName).toBe('test-standard');
    });

    test('leerer Suffix aendert nichts', () => {
        const result = getBackupFilenames('dnd-tracker-v4', 'Test', '');
        expect(result.current).toBe('test-aktuell.json');
    });
});

describe('resolveBackupTargets — Kollisions-Suffix nur bei echter Namenskollision (D-04)', () => {
    test('resolveBackupTargets ist eine Funktion', () => {
        expect(typeof resolveBackupTargets).toBe('function');
    });

    test('eine einzelne Kampagne ohne Kollision behaelt ihren bisherigen Dateinamen exakt', () => {
        const index = {
            campaigns: [{ key: 'dnd-campaign-1', name: 'Testkampagne' }],
            active: 'dnd-campaign-1'
        };
        const targets = resolveBackupTargets(index, 'dnd-tracker-data');
        const t = targets.find(x => x.key === 'dnd-campaign-1');
        expect(t.filenames.current).toBe('testkampagne-aktuell.json');
    });

    test('zwei Kampagnen, deren Namen auf denselben safeName normalisieren, bekommen unterscheidbare Dateien', () => {
        const index = {
            campaigns: [
                { key: 'dnd-campaign-100', name: 'Kampagne #1' },
                { key: 'dnd-campaign-200', name: 'Kampagne/1' }
            ],
            active: 'dnd-campaign-100'
        };
        const targets = resolveBackupTargets(index, 'dnd-tracker-data');
        const a = targets.find(x => x.key === 'dnd-campaign-100');
        const b = targets.find(x => x.key === 'dnd-campaign-200');
        expect(a.filenames.current).not.toBe(b.filenames.current);
        expect(a.filenames.current).toContain('100');
        expect(b.filenames.current).toContain('200');
    });

    test('zwei rein nicht-lateinisch benannte Kampagnen bekommen beide ein Suffix', () => {
        const index = {
            campaigns: [
                { key: 'dnd-campaign-300', name: '龍族戰役' },
                { key: 'dnd-campaign-400', name: '魔法師' }
            ],
            active: 'dnd-campaign-300'
        };
        const targets = resolveBackupTargets(index, 'dnd-tracker-data');
        const a = targets.find(x => x.key === 'dnd-campaign-300');
        const b = targets.find(x => x.key === 'dnd-campaign-400');
        expect(a.filenames.safeName).not.toBe('');
        expect(b.filenames.safeName).not.toBe('');
        expect(a.filenames.current).not.toBe(b.filenames.current);
    });

    test('eine einzelne rein nicht-lateinisch benannte Kampagne bekommt ebenfalls ein Suffix', () => {
        const index = {
            campaigns: [{ key: 'dnd-campaign-500', name: '龍族戰役' }],
            active: 'dnd-campaign-500'
        };
        const targets = resolveBackupTargets(index, 'dnd-tracker-data');
        const t = targets.find(x => x.key === 'dnd-campaign-500');
        expect(t.filenames.safeName).not.toBe('');
        expect(t.filenames.current).not.toBe('-aktuell.json');
    });

    test('die Standard-Kampagne erscheint genau einmal, auch wenn sie zusaetzlich im Index steht', () => {
        const index = {
            campaigns: [{ key: 'dnd-tracker-data', name: 'Standard-Kampagne' }],
            active: 'dnd-tracker-data'
        };
        const targets = resolveBackupTargets(index, 'dnd-tracker-data');
        const matches = targets.filter(x => x.key === 'dnd-tracker-data');
        expect(matches.length).toBe(1);
    });
});

// ============================================================
// Plan 12-03, Task 2: _doBackup() sichert alle Kampagnen (D-03)
// ============================================================

describe('_doBackup() — alle Kampagnen des Index, fehlerisoliert je Kampagne (D-03)', () => {
    // Eigener, frisch geladener vm-Kontext je Test: _doBackup() haelt Modul-Zustand
    // (_fileBackupPausedNotified, _fileBackupStatus) auf Modulebene — geteilte
    // Kontexte wuerden Tests ueber den Toast-Once-Guard hinweg gegenseitig stoeren.
    function createDoBackupContext({ campaigns = [], storageKey = 'dnd-tracker-data', dataByKey = {} } = {}) {
        const ctx = {
            window: {
                APP_CONFIG: { VERSION: '2.7.0', STORAGE_KEY: storageKey, DEBUG_MODE: false },
                getCampaignIndex: () => ({ campaigns, active: storageKey }),
                showToast: jest.fn(),
                ErrorHandler: { log: jest.fn() }
            },
            APP_CONFIG: { VERSION: '2.7.0', STORAGE_KEY: storageKey, DEBUG_MODE: false },
            StorageAPI: {
                getJSON: jest.fn(key => (Object.prototype.hasOwnProperty.call(dataByKey, key) ? dataByKey[key] : null))
            },
            console
        };
        vm.createContext(ctx);
        const filePath = path.join(__dirname, '../../systems/file-backup/file-backup-manager.js');
        const code = fs.readFileSync(filePath, 'utf8');
        vm.runInContext(code, ctx);
        return ctx;
    }

    test('drei Kampagnen im Index -> ein Lauf schreibt drei -aktuell.json-Dateien', async () => {
        const dirHandle = createMockDirHandle();
        const ctx = createDoBackupContext({
            campaigns: [
                { key: 'dnd-campaign-1', name: 'Kampagne A' },
                { key: 'dnd-campaign-2', name: 'Kampagne B' }
            ],
            dataByKey: {
                'dnd-tracker-data': { characters: [{ id: 1 }] },
                'dnd-campaign-1': { characters: [{ id: 2 }] },
                'dnd-campaign-2': { characters: [{ id: 3 }] }
            }
        });

        await ctx._doBackup(dirHandle);

        expect(dirHandle._files.has('standard-kampagne-aktuell.json')).toBe(true);
        expect(dirHandle._files.has('kampagne-a-aktuell.json')).toBe(true);
        expect(dirHandle._files.has('kampagne-b-aktuell.json')).toBe(true);
        expect(ctx.getBackupStatus()).toBe('active');
    });

    test('eine nicht lesbare Kampagne wird uebersprungen, die uebrigen werden trotzdem gesichert', async () => {
        const dirHandle = createMockDirHandle();
        const ctx = createDoBackupContext({
            campaigns: [
                { key: 'dnd-campaign-1', name: 'Kampagne A' },
                { key: 'dnd-campaign-2', name: 'Kampagne B' }
            ],
            dataByKey: {
                'dnd-tracker-data': { characters: [{ id: 1 }] },
                'dnd-campaign-1': { characters: [{ id: 2 }] }
                // dnd-campaign-2 absichtlich fehlend -> readCampaignDataForBackup liefert null
            }
        });

        await ctx._doBackup(dirHandle);

        expect(dirHandle._files.has('standard-kampagne-aktuell.json')).toBe(true);
        expect(dirHandle._files.has('kampagne-a-aktuell.json')).toBe(true);
        expect(dirHandle._files.has('kampagne-b-aktuell.json')).toBe(false);
        expect(ctx.getBackupStatus()).toBe('active');
    });

    test('keine einzige Kampagne lesbar -> Status paused, Toast genau einmal pro Sitzung', async () => {
        const dirHandle = createMockDirHandle();
        const ctx = createDoBackupContext({
            campaigns: [{ key: 'dnd-campaign-1', name: 'Kampagne A' }],
            dataByKey: {} // nichts lesbar, auch die Standard-Kampagne nicht
        });

        await ctx._doBackup(dirHandle);
        await ctx._doBackup(dirHandle); // zweiter Lauf im selben Kontext

        expect(ctx.getBackupStatus()).toBe('paused');
        expect(ctx.window.showToast).toHaveBeenCalledTimes(1);
        expect(dirHandle._files.size).toBe(0);
    });

    test('Snapshot-Limit (10) gilt je Kampagne — eine Kampagne verdraengt nicht die Snapshots der anderen', async () => {
        const dirHandle = createMockDirHandle();
        // 11 bestehende Tages-Snapshots fuer Kampagne A (vor dem Lauf)
        for (let i = 1; i <= 11; i++) {
            const day = String(i).padStart(2, '0');
            dirHandle._files.set(`kampagne-a-2026-01-${day}.json`, true);
        }
        // 2 bestehende Snapshots fuer Kampagne B, die unangetastet bleiben muessen
        dirHandle._files.set('kampagne-b-2026-01-01.json', true);
        dirHandle._files.set('kampagne-b-2026-01-02.json', true);

        const ctx = createDoBackupContext({
            campaigns: [
                { key: 'dnd-campaign-1', name: 'Kampagne A' },
                { key: 'dnd-campaign-2', name: 'Kampagne B' }
            ],
            dataByKey: {
                'dnd-campaign-1': { characters: [{ id: 1 }] },
                'dnd-campaign-2': { characters: [{ id: 2 }] }
                // Standard-Kampagne absichtlich ohne Daten -> wird uebersprungen
            }
        });

        await ctx._doBackup(dirHandle);

        const remainingA = [...dirHandle._files.keys()]
            .filter(f => /^kampagne-a-\d{4}-\d{2}-\d{2}\.json$/.test(f));
        expect(remainingA.length).toBe(10);

        // Kampagne B: die beiden alten Snapshots muessen noch da sein
        expect(dirHandle._files.has('kampagne-b-2026-01-01.json')).toBe(true);
        expect(dirHandle._files.has('kampagne-b-2026-01-02.json')).toBe(true);
    });
});
