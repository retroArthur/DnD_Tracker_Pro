/**
 * Backups-System — MAINT-05 (Plan 13-04)
 *
 * Deckt zwei bisher ungetestete Defekte in systems/backups.js ab:
 *
 * 1. initPerformanceMonitoring() hatte keine Mehrfachstart-Guard (anders als
 *    startAutoBackup(), das backupInterval + clearInterval bereits kennt).
 *    Ein zweiter Aufruf (z.B. nach Kampagnenwechsel) liess ein zweites,
 *    dauerhaft laufendes 30-Sekunden-Interval entstehen, das nie wieder
 *    gestoppt wurde — ein klassischer Denial-of-Service-Kandidat (T-13-12).
 *
 * 2. Der defaultD-Seed in restoreBackup()/sanitizeBackupData() enthielt einen
 *    toten mindmap-Schluessel (mindmap: { nodes: [], edges: [] }) — mit
 *    `edges` statt des ueberall sonst verwendeten `connections`. Der Seed
 *    wird entfernt (Task 3); ein Backup, das den Schluessel NOCH enthaelt,
 *    muss weiterhin fehlerfrei durch sanitizeBackupData() laufen und danach
 *    den Schluessel nicht mehr tragen.
 *
 * Lädt systems/backups.js per `vm` in eine frische Sandbox (Muster aus
 * tests/unit/file-backup-idb.test.js) und ersetzt setInterval/clearInterval/
 * setTimeout durch Doubles, die Handles vergeben und mitzaehlen.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../systems/backups.js');

// jsdom stellt structuredClone nicht in jeder Version global bereit — Fallback
// wie im Projekt-Polyfill (utils/utilities.js) ueber JSON-Roundtrip.
const structuredCloneImpl =
    typeof structuredClone === 'function'
        ? structuredClone
        : obj => JSON.parse(JSON.stringify(obj));

/**
 * Laedt systems/backups.js in eine frische Sandbox.
 * @param {Object} opts
 * @param {Object} [opts.D] - Das laufende window.D-Objekt (Default: leeres Objekt)
 */
function loadBackupsModule({ D = {} } = {}) {
    let nextHandle = 1;
    const activeHandles = new Set();
    const setIntervalCalls = [];
    const clearIntervalCalls = [];

    const setIntervalMock = jest.fn((fn, ms) => {
        const handle = nextHandle++;
        activeHandles.add(handle);
        setIntervalCalls.push({ handle, fn, ms });
        return handle;
    });
    const clearIntervalMock = jest.fn(handle => {
        clearIntervalCalls.push(handle);
        activeHandles.delete(handle);
    });
    const setTimeoutMock = jest.fn(() => 0);

    const showToast = jest.fn();
    const ErrorHandler = { log: jest.fn() };
    const APP_CONFIG = { DEBUG_MODE: false };
    const StorageAPI = {
        getJSON: jest.fn((key, def) => def),
        setJSON: jest.fn(() => ({ success: true })),
        remove: jest.fn(),
        has: jest.fn(() => false)
    };

    const windowObj = {
        APP_CONFIG,
        D,
        ErrorHandler,
        setInterval: setIntervalMock,
        clearInterval: clearIntervalMock,
        setTimeout: setTimeoutMock,
        renderAll: jest.fn(),
        saveImmediate: jest.fn(),
        renderEmptyState: jest.fn(),
        showModal: jest.fn(),
        stopAllTracks: jest.fn(),
        initIndexedDB: jest.fn(async () => {}),
        idb: null,
        performanceWarningShown: false
    };

    const context = {
        window: windowObj,
        APP_CONFIG,
        D,
        StorageAPI,
        showToast,
        ErrorHandler,
        confirm: jest.fn(() => true),
        structuredClone: structuredCloneImpl,
        STORAGE_KEY: 'dnd-tracker-test',
        setInterval: setIntervalMock,
        clearInterval: clearIntervalMock,
        setTimeout: setTimeoutMock,
        console
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);

    return {
        context,
        activeHandles,
        setIntervalMock,
        clearIntervalMock,
        setTimeoutMock,
        showToast
    };
}

describe('initPerformanceMonitoring() — Mehrfachstart-Guard (T-13-12)', () => {
    test('zweimaliger Aufruf hinterlaesst genau ein laufendes Interval', () => {
        const { context, activeHandles } = loadBackupsModule({ D: { characters: [] } });

        context.initPerformanceMonitoring();
        context.initPerformanceMonitoring();

        expect(activeHandles.size).toBe(1);
    });

    test('beim zweiten Aufruf wird clearInterval mit der Handle des ersten aufgerufen', () => {
        const { context, setIntervalMock, clearIntervalMock } = loadBackupsModule({
            D: { characters: [] }
        });

        context.initPerformanceMonitoring();
        const firstHandle = setIntervalMock.mock.results[0].value;
        context.initPerformanceMonitoring();

        expect(clearIntervalMock).toHaveBeenCalledWith(firstHandle);
    });

    test('startAutoBackup() verhaelt sich unveraendert (Kontrollfall)', () => {
        const { context, activeHandles } = loadBackupsModule({ D: { characters: [] } });

        context.startAutoBackup();
        context.startAutoBackup();

        // Kontrollfall: die bestehende Vorlage darf durch den Guard-Umbau in
        // initPerformanceMonitoring() nicht mitveraendert werden.
        expect(activeHandles.size).toBe(1);
    });

    test('wirft nicht, wenn window.D ein leeres Objekt ist (Randfall empty)', () => {
        const { context } = loadBackupsModule({ D: {} });

        expect(() => context.initPerformanceMonitoring()).not.toThrow();
    });
});

describe('sanitizeBackupData() — toter mindmap-Seed (Vorbereitung Task 3)', () => {
    test('ein Backup mit dem alten mindmap-Schluessel laeuft fehlerfrei durch und traegt ihn danach nicht mehr, wenn das Schema ihn nicht mehr kennt', () => {
        const { context } = loadBackupsModule();

        // Simuliert das defaultSchema NACH Entfernen des mindmap-Seeds (Task 3):
        // kein mindmap-Eintrag mehr im Schema.
        const defaultSchemaOhneMindmap = {
            characters: [],
            npcs: [],
            quests: [],
            locations: [],
            loot: []
        };
        // Ein Backup, das den alten (toten) Schluessel noch enthaelt.
        const backupMitAltemMindmap = {
            characters: [{ id: 1, name: 'Thorin' }],
            npcs: [],
            quests: [],
            locations: [],
            loot: [],
            mindmap: { nodes: [], edges: [] }
        };

        let sanitized;
        expect(() => {
            sanitized = context.sanitizeBackupData(backupMitAltemMindmap, defaultSchemaOhneMindmap);
        }).not.toThrow();

        expect(sanitized).not.toHaveProperty('mindmap');
        expect(sanitized.characters).toEqual([{ id: 1, name: 'Thorin' }]);
    });
});
