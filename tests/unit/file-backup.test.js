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
    const files = new Map(); // Simuliert gespeicherte Dateien: Dateiname -> geschriebener Inhalt (String)

    // CR-02 (Plan 12-10): write() faengt den geschriebenen Inhalt jetzt ab,
    // statt ihn zu verwerfen — noetig, damit Tests G/I (Kennmarken-Pruefung)
    // den tatsaechlich geschriebenen Inhalt einsehen koennen. Bestehende Tests
    // pruefen nur .has()/.size/Schluessel ueber entries() — bleiben unveraendert
    // gruen, weil kein Test bisher den Map-WERT abgefragt hat.
    const createMockWritable = (filename) => {
        let inhalt = '';
        return {
            write: jest.fn(async (data) => { inhalt = data; }),
            close: jest.fn(async () => { files.set(filename, inhalt); })
        };
    };

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
    // CR-02 (Plan 12-10): zwei neue optionale, benannte Parameter.
    // dImSpeicher setzt ctx.window.D (Stufe 3 von readCampaignDataForBackup() war
    // in ALLEN bisherigen Tests toter Code, weil kein Test je ein ctx.D setzte).
    // aktiverKey setzt ctx.window.STORAGE_KEY_OVERRIDE (der aktive Key, den der
    // Fix in Stufe 3 gegen campaignKey prueft). Bleiben beide weg, verhaelt sich
    // der Helfer exakt wie bisher — Bedingung, nicht Wunsch (Task 1, Schritt 1).
    function createDoBackupContext({
        campaigns = [],
        storageKey = 'dnd-tracker-data',
        dataByKey = {},
        dImSpeicher,
        aktiverKey
    } = {}) {
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
        if (dImSpeicher !== undefined) {
            ctx.window.D = dImSpeicher;
        }
        if (aktiverKey !== undefined) {
            ctx.window.STORAGE_KEY_OVERRIDE = aktiverKey;
        }
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

    // ========================================================
    // CR-02 (Plan 12-10): roter Durchstich — Stufe 3 von
    // readCampaignDataForBackup() ignoriert campaignKey und liefert immer
    // window.D. Die "Standard-Kampagne" ist hier bewusst die AKTIVE Kampagne
    // (kein aktiverKey gesetzt -> aktiver Key = APP_CONFIG.STORAGE_KEY =
    // 'dnd-tracker-data'); ihre einzige Datenquelle ist window.D. Kampagne A
    // ist im Index eingetragen, aber nie gespeichert (weder localStorage noch
    // IndexedDB) und NICHT aktiv — sie darf die Daten der aktiven Kampagne
    // nicht bekommen.
    // ========================================================

    test('CR-02: eine im Index eingetragene, nie gespeicherte Kampagne bekommt kein Backup, obwohl eine andere Kampagne befuellt im Speicher aktiv ist', async () => {
        const dirHandle = createMockDirHandle();
        const ctx = createDoBackupContext({
            campaigns: [{ key: 'dnd-campaign-1', name: 'Kampagne A' }],
            storageKey: 'dnd-tracker-data',
            dataByKey: {}, // weder Standard-Kampagne noch Kampagne A haben eigene Daten in LS/IDB
            dImSpeicher: { characters: [{ id: 'marke-aktive-kampagne' }] }
            // aktiverKey bewusst NICHT gesetzt -> aktiver Key bleibt APP_CONFIG.STORAGE_KEY
            // ('dnd-tracker-data'), die Standard-Kampagne ist also die aktive Kampagne.
        });

        await ctx._doBackup(dirHandle);

        // Standard-Kampagne (aktiv) darf legitim ihr Backup ueber Stufe 3 bekommen.
        expect(dirHandle._files.has('standard-kampagne-aktuell.json')).toBe(true);
        // Kampagne A (im Index, aber nicht aktiv und nie gespeichert) darf KEIN
        // Backup bekommen — vor dem Fix entsteht die Datei mit den Daten der
        // aktiven Kampagne (Fremdzuordnung).
        expect(dirHandle._files.has('kampagne-a-aktuell.json')).toBe(false);
    });

    test('CR-02: entstuende die Backup-Datei einer nie gespeicherten Kampagne doch, truege sie nicht die Kennmarke der aktiven Kampagne', async () => {
        const dirHandle = createMockDirHandle();
        const ctx = createDoBackupContext({
            campaigns: [{ key: 'dnd-campaign-1', name: 'Kampagne A' }],
            storageKey: 'dnd-tracker-data',
            dataByKey: {},
            dImSpeicher: { characters: [{ id: 'marke-aktive-kampagne' }] }
        });

        await ctx._doBackup(dirHandle);

        // Egal ob die Datei entstanden ist oder nicht: ihr Inhalt darf niemals
        // die Kennmarke der (fremden) aktiven Kampagne tragen.
        const inhalt = dirHandle._files.get('kampagne-a-aktuell.json') || '';
        expect(inhalt).not.toContain('marke-aktive-kampagne');
    });

    // ========================================================
    // CR-02 (Plan 12-10), Task 2 — Gegenprobe: der Fix darf Stufe 3 nicht
    // abschalten, sondern nur eingrenzen. Kampagne A ist hier per aktiverKey
    // ausdruecklich die AKTIVE Kampagne; weder localStorage noch IndexedDB
    // haben Daten fuer sie — ihre einzige Quelle ist window.D.
    // ========================================================
    test('CR-02: die aktive Kampagne bekommt ihr Backup auch dann, wenn sie nur im laufenden Speicher steht', async () => {
        const dirHandle = createMockDirHandle();
        const ctx = createDoBackupContext({
            campaigns: [{ key: 'dnd-campaign-1', name: 'Kampagne A' }],
            storageKey: 'dnd-tracker-data',
            dataByKey: {}, // weder localStorage noch IndexedDB haben Daten fuer irgendeine Kampagne
            dImSpeicher: { characters: [{ id: 'marke-nur-im-speicher' }] },
            aktiverKey: 'dnd-campaign-1' // Kampagne A ist die aktive Kampagne
        });

        await ctx._doBackup(dirHandle);

        // resolveBackupTargets() schliesst den aktiven Key immer als
        // "Standard-Kampagne" ein (D-03/D-04, ausserhalb des Scopes dieses
        // Plans) — deshalb landet Kampagne As Backup unter diesem Dateinamen.
        // Entscheidend ist NICHT das Label, sondern dass die Datei ueberhaupt
        // entsteht: der Fix hat Stufe 3 eingegrenzt, nicht abgeschaltet.
        expect(dirHandle._files.has('standard-kampagne-aktuell.json')).toBe(true);
        const inhalt = dirHandle._files.get('standard-kampagne-aktuell.json');
        expect(inhalt).toContain('marke-nur-im-speicher');
    });

    // ========================================================
    // CR-02 (Plan 12-10), Task 3 — Invariante ueber ALLE Ziele eines
    // _doBackup()-Laufs: jede geschriebene Datei traegt die Kennmarke des
    // eigenen Keys, nie die eines anderen. Haelt die promote-Entscheidung aus
    // <assumption_delta_decision> als Regressionstest fest, nicht nur als
    // Einzelfall. Die Zuordnung Dateiname -> Key kommt aus dem echten
    // ctx.resolveBackupTargets(), nicht aus einer abgetippten Liste.
    // ========================================================
    test('CR-02 Invariante: jede geschriebene Backup-Datei traegt die Kennmarke des eigenen Ziel-Keys — ueber alle Ziele eines Laufs', async () => {
        const dirHandle = createMockDirHandle();
        const campaigns = [
            { key: 'dnd-campaign-1', name: 'Kampagne A' }, // aktiv, eigene Daten
            { key: 'dnd-campaign-2', name: 'Kampagne B' }, // nicht aktiv, eigene Daten
            { key: 'dnd-campaign-3', name: 'Kampagne C' }  // nicht aktiv, NIE gespeichert
        ];
        const dataByKey = {
            'dnd-campaign-1': { characters: [{ id: 'marke-a-100' }] },
            'dnd-campaign-2': { characters: [{ id: 'marke-b-200' }] }
            // dnd-campaign-3 absichtlich ohne Daten
        };
        const ctx = createDoBackupContext({
            campaigns,
            storageKey: 'dnd-tracker-data',
            dataByKey,
            dImSpeicher: { characters: [{ id: 'marke-a-100' }] }, // window.D = Kampagne As Daten
            aktiverKey: 'dnd-campaign-1' // Kampagne A ist aktiv
        });

        await ctx._doBackup(dirHandle);

        // Zuordnung Dateiname -> Key aus dem ECHTEN resolveBackupTargets() beziehen,
        // nicht abtippen (dasselbe Prinzip wie 12-08s Strukturpruefung gegen
        // das echte initializeData()).
        const aktiverStorageKey = ctx.window.STORAGE_KEY_OVERRIDE || ctx.window.APP_CONFIG.STORAGE_KEY;
        const targets = ctx.resolveBackupTargets({ campaigns, active: aktiverStorageKey }, aktiverStorageKey);

        // Erwartete Kennmarke je Key — nur Kampagnen mit eigenen Daten haben eine.
        const kennmarkeByKey = {
            'dnd-campaign-1': 'marke-a-100',
            'dnd-campaign-2': 'marke-b-200'
            // dnd-campaign-3 bewusst ohne Eintrag: darf keine Datei erzeugen
        };

        const verstoesse = [];
        for (const target of targets) {
            const filename = target.filenames.current;
            const geschrieben = dirHandle._files.get(filename);
            const erwarteteKennmarke = kennmarkeByKey[target.key];

            if (erwarteteKennmarke === undefined) {
                if (geschrieben !== undefined) {
                    verstoesse.push(`${filename} (Key ${target.key}) wurde geschrieben, obwohl keine eigenen Daten existieren`);
                }
                continue;
            }

            if (geschrieben === undefined) {
                verstoesse.push(`${filename} (Key ${target.key}) fehlt, obwohl eigene Daten existieren`);
            } else if (!geschrieben.includes(erwarteteKennmarke)) {
                verstoesse.push(`${filename} (Key ${target.key}) traegt nicht die eigene Kennmarke ${erwarteteKennmarke}`);
            }
        }

        expect(verstoesse).toEqual([]);
    });
});

// ============================================================
// Nyquist-Nachhaerten Phase 12 (R04/R05/R06):
// Die bestehenden Bloecke oben pinnen jeweils die "positive" Haelfte ihrer
// Anforderung. Die folgenden Tests schliessen die Luecken, in denen
// plausible Ein-Zeilen-Regressionen bisher gruen blieben:
//   R04 — Fehler-Isolation je Kampagne (throw e im catch ueberlebte)
//   R04 — IndexedDB als Quelle fuer eine NICHT aktive Kampagne
//   R05 — Suffix nur bei ECHTER Kollision (gemischter Index als Unterscheider)
//   R06 — Kollisions-Suffix bis in die Writes und ins Pruning durchgereicht
// ============================================================

describe('Nyquist-Nachhaerten — Fehler-Isolation, Datenquelle und Kollisions-Suffix (R04/R05/R06)', () => {
    // Eigener vm-Kontext je Test (gleiche Begruendung wie im _doBackup()-Block
    // oben: _fileBackupStatus/_fileBackupPausedNotified sind Modul-Zustand).
    function ladeKontext({ campaigns = [], storageKey = 'dnd-tracker-data', dataByKey = {} } = {}) {
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
        vm.runInContext(fs.readFileSync(filePath, 'utf8'), ctx);
        return ctx;
    }

    // --- R04: Fehler-Isolation je Kampagne --------------------------------
    test('R04: ein Schreibfehler bei EINER Kampagne stoppt den Lauf nicht — spaetere Kampagnen werden trotzdem gesichert', async () => {
        const dirHandle = createMockDirHandle();
        const echtesGetFileHandle = dirHandle.getFileHandle;
        // Nur Kampagne A schlaegt beim Schreiben fehl (gesperrte Datei, entzogene
        // Berechtigung, Quota) — nicht der Ordner-Handle als Ganzes.
        dirHandle.getFileHandle = jest.fn(async (filename, opts) => {
            if (filename.indexOf('kampagne-a-') === 0 && opts && opts.create) {
                throw Object.assign(new Error('write denied'), { name: 'NotAllowedError' });
            }
            return echtesGetFileHandle(filename, opts);
        });

        const ctx = ladeKontext({
            campaigns: [
                { key: 'dnd-campaign-1', name: 'Kampagne A' },
                { key: 'dnd-campaign-2', name: 'Kampagne B' }
            ],
            dataByKey: {
                'dnd-campaign-1': { characters: [{ id: 'marke-a' }] },
                'dnd-campaign-2': { characters: [{ id: 'marke-b' }] }
            }
        });

        // Der Lauf selbst darf NICHT rejecten — er laeuft aus onAfterSave()s
        // setTimeout-Callback, eine Rejection dort ist unbeobachtbar.
        await expect(ctx._doBackup(dirHandle)).resolves.toBeUndefined();

        // Kampagne A (Fehler) hat keine Datei ...
        expect(dirHandle._files.has('kampagne-a-aktuell.json')).toBe(false);
        // ... die NACH ihr verarbeitete Kampagne B aber sehr wohl.
        expect(dirHandle._files.has('kampagne-b-aktuell.json')).toBe(true);
        expect(dirHandle._files.get('kampagne-b-aktuell.json')).toContain('marke-b');
        // Mindestens eine Kampagne war erfolgreich -> Status bleibt aktiv,
        // kein "pausiert"-Toast.
        expect(ctx.getBackupStatus()).toBe('active');
        expect(ctx.window.showToast).not.toHaveBeenCalled();
    });

    // --- R04: IndexedDB-Quelle fuer eine NICHT aktive Kampagne ------------
    test('R04: eine nicht aktive Kampagne, die nur in IndexedDB liegt, wird gesichert (IDB-Modus >5MB)', async () => {
        const dirHandle = createMockDirHandle();
        const ctx = ladeKontext({
            campaigns: [{ key: 'dnd-campaign-1', name: 'Kampagne A' }],
            storageKey: 'dnd-tracker-data',
            dataByKey: { 'dnd-tracker-data': { characters: [{ id: 'marke-standard' }] } }
            // Kampagne A hat KEINEN localStorage-Eintrag — im IDB-Modus loescht
            // saveImmediate() den LS-Key nach dem IDB-Write.
        });
        ctx.window.loadFromIndexedDBFallbackRaw = jest.fn(async key =>
            (key === 'dnd-campaign-1'
                ? { data: JSON.stringify({ characters: [{ id: 'marke-a-idb' }] }) }
                : null)
        );

        await ctx._doBackup(dirHandle);

        expect(dirHandle._files.has('kampagne-a-aktuell.json')).toBe(true);
        expect(dirHandle._files.get('kampagne-a-aktuell.json')).toContain('marke-a-idb');
    });

    // --- R05: Suffix nur bei ECHTER Kollision (gemischter Index) ----------
    test('R05: im gemischten Index behaelt die NICHT kollidierende Kampagne ihren unsuffixierten Dateinamen exakt', () => {
        const index = {
            campaigns: [
                { key: 'dnd-campaign-100', name: 'Kampagne #1' },  // kollidiert mit ...
                { key: 'dnd-campaign-200', name: 'Kampagne/1' },   // ... dieser (beide -> "kampagne-1")
                { key: 'dnd-campaign-300', name: 'Unschuldig' }    // kollidiert mit niemandem
            ],
            active: 'dnd-tracker-data'
        };
        const targets = resolveBackupTargets(index, 'dnd-tracker-data');

        const unschuldig = targets.find(x => x.key === 'dnd-campaign-300');
        const standard = targets.find(x => x.key === 'dnd-tracker-data');
        const a = targets.find(x => x.key === 'dnd-campaign-100');
        const b = targets.find(x => x.key === 'dnd-campaign-200');

        // Kern der Anforderung: eine Kollision ZWEIER ANDERER Kampagnen darf den
        // Dateinamen dieser Kampagne nicht veraendern — sonst verwaist ihre
        // bisherige -aktuell.json und ihre Snapshot-Historie reisst ab (D-04).
        expect(unschuldig.filenames.current).toBe('unschuldig-aktuell.json');
        expect(unschuldig.filenames.safeName).toBe('unschuldig');
        expect(standard.filenames.current).toBe('standard-kampagne-aktuell.json');

        // Gegenprobe im selben Aufruf: das kollidierende Paar bekommt sehr wohl Suffixe.
        expect(a.filenames.current).toBe('kampagne-1-100-aktuell.json');
        expect(b.filenames.current).toBe('kampagne-1-200-aktuell.json');
    });

    // --- R06: Suffix bis in Writes und Pruning durchgereicht --------------
    test('R06: kollidierende Kampagnen fuehren getrennte Snapshot-Serien — das 10er-Limit gilt je Kampagne, nicht je safeName', async () => {
        const dirHandle = createMockDirHandle();
        // 11 bestehende Snapshots der SUFFIXIERTEN Serie von Kampagne #1
        for (let i = 1; i <= 11; i++) {
            dirHandle._files.set('kampagne-1-100-2026-01-' + String(i).padStart(2, '0') + '.json', 'alt');
        }

        const ctx = ladeKontext({
            campaigns: [
                { key: 'dnd-campaign-100', name: 'Kampagne #1' },
                { key: 'dnd-campaign-200', name: 'Kampagne/1' }
            ],
            dataByKey: {
                'dnd-campaign-100': { characters: [{ id: 'marke-100' }] },
                'dnd-campaign-200': { characters: [{ id: 'marke-200' }] }
                // Standard-Kampagne bewusst ohne Daten -> uebersprungen
            }
        });

        await ctx._doBackup(dirHandle);

        const heute = new Date().toISOString().slice(0, 10);

        // 1. Die Writes verwenden die suffixierten Namen aus resolveBackupTargets(),
        //    nicht intern neu berechnete unsuffixierte.
        expect(dirHandle._files.get('kampagne-1-100-aktuell.json')).toContain('marke-100');
        expect(dirHandle._files.get('kampagne-1-200-aktuell.json')).toContain('marke-200');
        // Keine gemeinsame, unsuffixierte Datei — sonst haetten sich beide
        // Kampagnen gegenseitig ueberschrieben.
        expect(dirHandle._files.has('kampagne-1-aktuell.json')).toBe(false);
        expect(dirHandle._files.has('kampagne-1-' + heute + '.json')).toBe(false);

        // 2. Das Pruning laeuft auf der eigenen, suffixierten Serie:
        //    11 alte + 1 neuer Tages-Snapshot -> auf 10 gekappt.
        const serie100 = [...dirHandle._files.keys()]
            .filter(f => /^kampagne-1-100-\d{4}-\d{2}-\d{2}\.json$/.test(f));
        expect(serie100.length).toBe(10);
        expect(serie100).toContain('kampagne-1-100-' + heute + '.json');
        // Die aeltesten wurden zuerst entfernt.
        expect(dirHandle._files.has('kampagne-1-100-2026-01-01.json')).toBe(false);
        expect(dirHandle._files.has('kampagne-1-100-2026-01-02.json')).toBe(false);

        // 3. Die Nachbarkampagne hat ihr eigenes, unberuehrtes Budget.
        const serie200 = [...dirHandle._files.keys()]
            .filter(f => /^kampagne-1-200-\d{4}-\d{2}-\d{2}\.json$/.test(f));
        expect(serie200).toEqual(['kampagne-1-200-' + heute + '.json']);
    });
});
