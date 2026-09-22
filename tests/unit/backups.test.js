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
 *    muss weiterhin fehlerfrei wiederhergestellt werden und danach den
 *    Schluessel nicht mehr tragen. Seit Code-Review 2026-09-21 (U4, R01)
 *    gibt es weder defaultD noch sanitizeBackupData(): der Restore laeuft
 *    ueber normalizeCampaignData() (loadRestorePath() unten).
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
 * @param {Array}  [opts.storedBackups] - Was StorageAPI.getJSON(BACKUP_KEY, []) liefert
 * @param {boolean} [opts.confirmResult] - Rueckgabewert von confirm(...)
 */
function loadBackupsModule({ D = {}, storedBackups = [], confirmResult = true } = {}) {
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
        getJSON: jest.fn((key, def) => (storedBackups.length ? storedBackups : def)),
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
        // idb bleibt null — getBackups() faengt den daraus resultierenden
        // Zugriffsfehler ab und faellt auf die localStorage-Liste zurueck,
        // genau wie im echten "kein IndexedDB verfuegbar"-Fall.
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
        confirm: jest.fn(() => confirmResult),
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
        showToast,
        windowObj
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

/**
 * Restore-Pfad mit den ECHTEN Modulen (Code-Review 2026-09-21, U4): der vm-Kontext ist
 * zugleich `window`, damit version-migration.js (normalizeCampaignData) und core/data.js
 * (initializeData, replaceCampaignData) wie im Browser zusammenspielen. window.idb bleibt
 * null und initIndexedDB() ein No-op — getBackups() faellt wie im echten
 * "kein IndexedDB verfuegbar"-Fall auf die (gefilterte) localStorage-Liste zurueck.
 */
const REPO_ROOT = path.join(__dirname, '../..');
const RESTORE_FILES = [
    'core/config.js',
    'core/data.js',
    'utils/basic.js',
    'utils/idb-tx.js',
    'utils/utilities.js',
    'systems/spellslots/version-migration.js',
    'systems/backups.js'
];
function loadRestorePath({ storedBackups = [] } = {}) {
    const lsStore = { 'dnd-tracker-backups': JSON.stringify(storedBackups) };
    const context = { setTimeout, clearTimeout, Blob, console };
    context.window = context;
    context.document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] };
    context.localStorage = {
        getItem: k => (Object.prototype.hasOwnProperty.call(lsStore, k) ? lsStore[k] : null),
        setItem: (k, v) => {
            lsStore[k] = String(v);
        },
        removeItem: k => {
            delete lsStore[k];
        }
    };
    context.ErrorHandler = { log: jest.fn() };
    context.getSpellSlotsForClass = jest.fn(() => [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    vm.createContext(context);
    for (const rel of RESTORE_FILES) {
        vm.runInContext(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8'), context, { filename: rel });
    }
    // Stubs nach dem Laden (utilities.js deklariert showToast selbst)
    const showToast = jest.fn();
    context.showToast = showToast;
    context.ErrorHandler = { log: jest.fn() };
    context.getActiveCampaignKey = jest.fn(() => 'dnd-tracker-test');
    context.confirm = jest.fn(() => true);
    context.saveUndoState = jest.fn();
    context.stopAllTracks = jest.fn();
    context.renderAll = jest.fn();
    context.saveImmediate = jest.fn(async () => ({ success: true, backend: 'localStorage' }));
    context.idb = null;
    context.initIndexedDB = jest.fn(async () => {});
    return { context, showToast };
}

describe('Restore-Pfad — toter mindmap-Seed bleibt weg (Task 3, seit U4 ueber normalizeCampaignData)', () => {
    // sanitizeBackupData() und sein defaultD-Literal sind entfernt (Code-Review 2026-09-21,
    // R01): der Restore laeuft ueber den gemeinsamen Normalisierer. Ein vor Task 3 erstelltes
    // Backup mit dem toten Schluessel `mindmap: { nodes: [], edges: [] }` (`edges` statt des
    // ueberall sonst verwendeten `connections`) ist versionslos — die 2.6.1-Migration
    // (Smart-Strip) entfernt den leeren Seed.
    const backupMitAltemMindmap = {
        characters: [{ id: 1, name: 'Thorin' }],
        npcs: [],
        quests: [],
        locations: [],
        loot: [],
        mindmap: { nodes: [], edges: [] }
    };

    test('normalizeCampaignData(): versionsloses Backup mit leerem mindmap-Seed ist ok und traegt ihn danach nicht mehr', () => {
        const { context } = loadRestorePath();

        const result = context.normalizeCampaignData(JSON.stringify(backupMitAltemMindmap));

        expect(result.ok).toBe(true);
        expect(result.data).not.toHaveProperty('mindmap');
        expect(JSON.parse(JSON.stringify(result.data.characters))).toMatchObject([
            { id: 1, name: 'Thorin' }
        ]);
    });

    test('restoreBackup() (voller Pfad): ein Backup mit dem alten mindmap-Schluessel wird fehlerfrei wiederhergestellt und traegt ihn danach nicht mehr', async () => {
        // Ein reales, vor Task 3 erstelltes Backup der AKTIVEN Kampagne ('dnd-tracker-test') —
        // der abgeschaffte Schluessel ist noch drin.
        const altesBackupPayload = {
            characters: [{ id: 1, name: 'Thorin Eisenfaust' }],
            npcs: [],
            quests: [],
            locations: [],
            loot: [],
            mindmap: { nodes: [], edges: [] }
        };
        const storedBackups = [
            {
                timestamp: 1700000000000,
                campaignKey: 'dnd-tracker-test',
                data: JSON.stringify(altesBackupPayload)
            }
        ];
        const { context, showToast } = loadRestorePath({ storedBackups });
        const laufendesD = context.D;

        // Stabile Backup-ID: der Zeitstempel (nicht mehr die Listenposition)
        await expect(context.restoreBackup(1700000000000)).resolves.not.toThrow();

        // restoreBackup() faengt eigene Fehler intern ab (zeigt einen Toast statt zu
        // werfen) — der eigentliche Nachweis ist der Erfolgs-Toast nach bestaetigtem Speichern.
        expect(showToast).toHaveBeenCalledWith('✅ Backup wiederhergestellt');
        expect(showToast).not.toHaveBeenCalledWith(expect.stringContaining('fehlerhaft'));

        // Der Restore ersetzt window.D in place (replaceCampaignData) — dieselbe Referenz.
        expect(context.D).toBe(laufendesD);
        expect(context.D).not.toHaveProperty('mindmap');
        expect(JSON.parse(JSON.stringify(context.D.characters))).toMatchObject([
            { id: 1, name: 'Thorin Eisenfaust' }
        ]);
    });
});
