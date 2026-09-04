/**
 * Migration-Wizard Tests — SAFE-04 / D-07 (Phase 12, Plan 04)
 *
 * Testet isFreshInstall() aus systems/migration/migration-wizard.js: die Funktion
 * beantwortet "gibt es hier Daten?" jetzt aus DENSELBEN Quellen wie
 * readCampaignDataForBackup() (file-backup-manager.js) — localStorage unter dem
 * tatsaechlich aktiven Key (STORAGE_KEY_OVERRIDE hat Vorrang), dann IndexedDB, dann
 * das laufende D-Objekt — statt nur APP_CONFIG.STORAGE_KEY zu pruefen.
 *
 * Nicht Teil dieser Datei: version-migration.js (siehe tests/unit/migration.test.js —
 * andere Datei, anderer Zustaendigkeitsbereich).
 *
 * Muster: vm.createContext() analog tests/unit/audio-export.test.js und
 * tests/unit/migration.test.js (non-ESM-Module in isoliertem vm-Kontext laden).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WIZARD_PATH = path.join(__dirname, '../../systems/migration/migration-wizard.js');

let context;
let APP_CONFIG_MOCK;
let mockReadCampaignDataForBackup;
let mockGetCampaignIndex;
let mockStorageAPI;
let mockSessionStorage;
let mockSetTimeout;
let mockConfirm;
let mockShowToast;
let storageBacking;

/** Wartet, bis condition() wahr wird (fuer den async reader.onload-Zweig). */
async function waitFor(conditionFn, { timeout = 2000, interval = 10 } = {}) {
    const start = Date.now();
    while (!conditionFn()) {
        if (Date.now() - start > timeout) {
            throw new Error('waitFor: Bedingung nicht innerhalb des Timeouts erfuellt');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}

beforeAll(() => {
    APP_CONFIG_MOCK = { STORAGE_KEY: 'dnd-tracker-data', DEBUG_MODE: false, VERSION: '2.7.0' };

    storageBacking = {};
    mockStorageAPI = {
        getJSON: jest.fn((key, fallback) => (key in storageBacking ? storageBacking[key] : fallback)),
        setJSON: jest.fn((key, value) => { storageBacking[key] = value; }),
        has: jest.fn(() => false)
    };

    mockReadCampaignDataForBackup = jest.fn(async () => null);
    mockGetCampaignIndex = jest.fn(() => ({ campaigns: [] }));
    mockSessionStorage = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn()
    };
    mockSetTimeout = jest.fn();
    mockConfirm = jest.fn(() => true);
    mockShowToast = jest.fn();

    context = {
        window: {
            APP_CONFIG: APP_CONFIG_MOCK,
            STORAGE_KEY_OVERRIDE: undefined,
            readCampaignDataForBackup: mockReadCampaignDataForBackup,
            getCampaignIndex: mockGetCampaignIndex,
            showToast: mockShowToast,
            location: { protocol: 'https:' }
        },
        APP_CONFIG: APP_CONFIG_MOCK,
        StorageAPI: mockStorageAPI,
        sessionStorage: mockSessionStorage,
        // Der Produktionscode ruft setTimeout(showMigrationWizard, 500) direkt als
        // globalen Bezeichner auf — im vm-Kontext MUSS das deshalb hier liegen,
        // nicht unter window.*.
        setTimeout: mockSetTimeout,
        confirm: mockConfirm,
        esc: s => String(s),
        document: { getElementById: () => null, querySelectorAll: () => [] },
        FileReader: global.FileReader,
        console: console
    };
    vm.createContext(context);

    const code = fs.readFileSync(WIZARD_PATH, 'utf8');
    vm.runInContext(code, context);
});

beforeEach(() => {
    storageBacking = {};
    mockStorageAPI.getJSON.mockClear();
    mockStorageAPI.setJSON.mockClear();
    mockStorageAPI.has.mockReset();
    mockStorageAPI.has.mockReturnValue(false);

    mockReadCampaignDataForBackup.mockReset();
    mockReadCampaignDataForBackup.mockResolvedValue(null);

    mockGetCampaignIndex.mockReset();
    mockGetCampaignIndex.mockReturnValue({ campaigns: [] });

    mockSessionStorage.getItem.mockReset();
    mockSessionStorage.getItem.mockReturnValue(null);
    mockSessionStorage.setItem.mockClear();

    mockSetTimeout.mockReset();
    mockConfirm.mockReset();
    mockConfirm.mockReturnValue(true);
    mockShowToast.mockClear();

    context.window.STORAGE_KEY_OVERRIDE = undefined;
    context.window.readCampaignDataForBackup = mockReadCampaignDataForBackup;
    context.window.getCampaignIndex = mockGetCampaignIndex;
    context.window.location = { protocol: 'https:' };
    context.document = { getElementById: () => null, querySelectorAll: () => [] };
});

// ============================================================
// TASK 1 — isFreshInstall() konsultiert dieselbe Quellenkette wie
// readCampaignDataForBackup()
// ============================================================

describe('isFreshInstall() — Quellenkette wie readCampaignDataForBackup() (D-07, SAFE-04)', () => {
    test('leerer Speicher, kein Override, keine Quelle liefert Daten -> true', async () => {
        mockReadCampaignDataForBackup.mockResolvedValue(null);

        const result = await context.isFreshInstall();

        expect(result).toBe(true);
        expect(mockReadCampaignDataForBackup).toHaveBeenCalledWith('dnd-tracker-data');
    });

    test('STORAGE_KEY_OVERRIDE gesetzt und unter diesem Key liegen Charaktere -> false (heute faelschlich true)', async () => {
        context.window.STORAGE_KEY_OVERRIDE = 'dnd-campaign-123';
        mockReadCampaignDataForBackup.mockImplementation(async key => {
            if (key === 'dnd-campaign-123') {
                return { characters: [{ id: 1, name: 'Aria' }], npcs: [], quests: [] };
            }
            return null;
        });

        const result = await context.isFreshInstall();

        expect(mockReadCampaignDataForBackup).toHaveBeenCalledWith('dnd-campaign-123');
        expect(result).toBe(false);
    });

    test('localStorage-Key entfernt, Daten nur ueber IDB-Stufe erreichbar (simuliert im Stub) -> false', async () => {
        // readCampaignDataForBackup() kapselt intern localStorage -> IDB -> D; hier
        // genuegt ein Stub, der das IDB-Ergebnis liefert (echtes IDB-Verhalten ist
        // in file-backup.test.js/stability.test.js abgedeckt, nicht hier doppeln).
        mockReadCampaignDataForBackup.mockResolvedValue({
            characters: [{ id: 1 }],
            npcs: [{ id: 2 }],
            quests: []
        });

        const result = await context.isFreshInstall();

        expect(result).toBe(false);
    });

    test('Datensatz vorhanden, aber ohne Charaktere/NPCs/Quests -> true (leere Kampagne zaehlt nicht als Bestand)', async () => {
        mockReadCampaignDataForBackup.mockResolvedValue({
            characters: [],
            npcs: [],
            quests: [],
            settings: { theme: 'dark' }
        });

        const result = await context.isFreshInstall();

        expect(result).toBe(true);
    });

    test('window.readCampaignDataForBackup nicht verfuegbar -> synchrone StorageAPI-Rueckfallebene, echtes Boolean statt undefined', async () => {
        delete context.window.readCampaignDataForBackup;

        // Fallback: leer -> true
        mockStorageAPI.getJSON.mockReturnValueOnce(null);
        const leer = await context.isFreshInstall();
        expect(leer).toBe(true);
        expect(typeof leer).toBe('boolean');

        // Fallback: befuellt -> false
        mockStorageAPI.getJSON.mockReturnValueOnce({ characters: [{ id: 1 }], npcs: [], quests: [] });
        const befuellt = await context.isFreshInstall();
        expect(befuellt).toBe(false);
        expect(typeof befuellt).toBe('boolean');

        context.window.readCampaignDataForBackup = mockReadCampaignDataForBackup;
    });

    // ------------------------------------------------------------
    // Gap-Closure G-12-3 (Plan 12-08): der Durchstich-Test. Bis Task 1 fertig ist,
    // zaehlt isFreshInstall() nur characters/npcs/quests als Inhalt — eine reine
    // Zauberbibliothek faellt faelschlich als "frisch" durch (der Fehler, den G-12-3
    // meldet). Dieser Test MUSS rot sein, solange hasCampaignContent() noch nicht
    // existiert bzw. noch nicht verdrahtet ist.
    // ------------------------------------------------------------
    test('nur Zauber gefuellt (characters/npcs/quests leer) -> false (Durchstich G-12-3)', async () => {
        mockReadCampaignDataForBackup.mockResolvedValue({
            characters: [],
            npcs: [],
            quests: [],
            spells: [{ id: 1, name: 'Feuerball' }, { id: 2, name: 'Bannfluch' }]
        });

        const result = await context.isFreshInstall();

        expect(result).toBe(false);
    });

    test('hasCampaignContent(null)/(undefined) -> false ohne Wurf; isFreshInstall() bei fehlender Quelle weiterhin true', async () => {
        expect(context.hasCampaignContent(null)).toBe(false);
        expect(context.hasCampaignContent(undefined)).toBe(false);

        mockReadCampaignDataForBackup.mockResolvedValue(null);
        const result = await context.isFreshInstall();
        expect(result).toBe(true);
    });

    test('hasCampaignContent() liefert echte Wahrheitswerte bei fehlenden/falsch typisierten Sammlungen, wirft nie', () => {
        expect(context.hasCampaignContent({})).toBe(false);
        expect(typeof context.hasCampaignContent({})).toBe('boolean');
        expect(() => context.hasCampaignContent({ wiki: 'kaputt' })).not.toThrow();
        expect(context.hasCampaignContent({ wiki: 'kaputt' })).toBe(false);
    });
});

// ============================================================
// TASK 2 — Beide Aufrufer auf await umgestellt, kein Promise als Wahrheitswert
// ============================================================

describe('Quelltext-Beleg: jede Verwendungsstelle von isFreshInstall( traegt await (SAFE-04)', () => {
    test('keine Verwendungsstelle wertet ein Promise-Objekt als Wahrheitswert aus', () => {
        const src = fs.readFileSync(WIZARD_PATH, 'utf-8');
        const offenders = [];

        src.split('\n').forEach((line, idx) => {
            const trimmed = line.trim();
            // Kommentarzeilen (JSDoc/Inline) sind keine Verwendungsstellen
            if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
            if (!/isFreshInstall\(/.test(line)) return;
            // Funktionsdefinition und window-Export ausgenommen
            if (/(async\s+)?function\s+isFreshInstall\(/.test(line)) return;
            if (/window\.isFreshInstall\s*=/.test(line)) return;
            // Jede verbleibende Verwendungsstelle MUSS ein 'await isFreshInstall(' enthalten
            if (!/await\s+isFreshInstall\(/.test(line)) {
                offenders.push(`Zeile ${idx + 1}: ${line.trim()}`);
            }
        });

        expect(offenders).toEqual([]);
    });
});

describe('initMigrationWizardIfNeeded() — async, zeigt Wizard bei vorhandenen Daten nicht (SAFE-04)', () => {
    test('vorhandene Daten (isFreshInstall -> false) -> kein setTimeout(showMigrationWizard) geplant', async () => {
        mockReadCampaignDataForBackup.mockResolvedValue({
            characters: [{ id: 1 }], npcs: [], quests: []
        });
        mockStorageAPI.has.mockReturnValue(false); // 'migration-wizard-shown' noch nicht gesetzt

        await context.initMigrationWizardIfNeeded();

        expect(mockSetTimeout).not.toHaveBeenCalled();
    });

    test('leerer Speicher (isFreshInstall -> true), noch nicht gezeigt -> setTimeout(showMigrationWizard, 500)', async () => {
        mockReadCampaignDataForBackup.mockResolvedValue(null);
        mockStorageAPI.has.mockReturnValue(false);

        await context.initMigrationWizardIfNeeded();

        expect(mockSetTimeout).toHaveBeenCalledTimes(1);
        expect(mockSetTimeout).toHaveBeenCalledWith(context.showMigrationWizard, 500);
    });

    test('bereits gezeigt (StorageAPI.has -> true) -> kein Wizard, isFreshInstall wird nicht mal noetig ausgewertet', async () => {
        mockStorageAPI.has.mockReturnValue(true);

        await context.initMigrationWizardIfNeeded();

        expect(mockSetTimeout).not.toHaveBeenCalled();
    });
});

describe('_processWizardFile() — Bestandsschutz-Dialog bleibt erhalten, Reihenfolge unveraendert (SAFE-04, T-12-14)', () => {
    let errorEl, filenameEl, resultEl, dropzone;

    beforeEach(() => {
        errorEl = { textContent: '', style: { display: 'none' } };
        filenameEl = { textContent: '', style: { display: 'none' } };
        resultEl = { innerHTML: '' };
        dropzone = { classList: { add: jest.fn(), remove: jest.fn() } };

        context.document = {
            getElementById: id => {
                if (id === 'migration-wizard-error') return errorEl;
                if (id === 'migration-wizard-filename') return filenameEl;
                if (id === 'migration-wizard-result') return resultEl;
                return null;
            },
            querySelectorAll: () => []
        };
    });

    test('vorhandene Daten + Abbruch am confirm() -> Import blockiert, keine Aenderung', async () => {
        mockReadCampaignDataForBackup.mockResolvedValue({
            characters: [{ id: 1 }], npcs: [], quests: []
        });
        mockGetCampaignIndex.mockReturnValue({ campaigns: [] });
        mockConfirm.mockReturnValue(false); // Nutzer bricht ab

        const saveUndoStateMock = jest.fn();
        const importFullExportMock = jest.fn();
        context.window.saveUndoState = saveUndoStateMock;
        context.window.importFullExport = importFullExportMock;

        const file = new global.File(
            [JSON.stringify({ _exportType: 'full-v1', campaigns: {} })],
            'export.json',
            { type: 'application/json' }
        );

        context._processWizardFile(file, dropzone);

        await waitFor(() => errorEl.textContent !== '');

        expect(mockConfirm).toHaveBeenCalled();
        expect(saveUndoStateMock).not.toHaveBeenCalled();
        expect(importFullExportMock).not.toHaveBeenCalled();
        expect(errorEl.textContent).toMatch(/abgebrochen/);
    });

    test('vorhandene Daten + Bestaetigung -> Reihenfolge saveUndoState VOR importFullExport bleibt erhalten', async () => {
        mockReadCampaignDataForBackup.mockResolvedValue({
            characters: [{ id: 1 }], npcs: [], quests: []
        });
        mockGetCampaignIndex.mockReturnValue({ campaigns: [] });
        mockConfirm.mockReturnValue(true); // Nutzer bestaetigt

        const callOrder = [];
        context.window.saveUndoState = jest.fn(() => callOrder.push('saveUndoState'));
        context.window.importFullExport = jest.fn(() => {
            callOrder.push('importFullExport');
            return { totalBytes: 4096, campaignCount: 1 };
        });

        const file = new global.File(
            [JSON.stringify({ _exportType: 'full-v1', campaigns: { c1: {} } })],
            'export.json',
            { type: 'application/json' }
        );

        context._processWizardFile(file, dropzone);

        await waitFor(() => callOrder.length >= 2);

        expect(callOrder).toEqual(['saveUndoState', 'importFullExport']);
        expect(dropzone.classList.add).toHaveBeenCalledWith('file-ready');
    });
});
