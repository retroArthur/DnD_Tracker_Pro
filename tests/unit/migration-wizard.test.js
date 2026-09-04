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
const DATA_PATH = path.join(__dirname, '../../core/data.js');

// Gap-Closure G-12-3 (Plan 12-08): die drei Inhaltslisten synchron aus der echten
// Quelle laden (nicht abtippen) — test.each()/describe.each() unten brauchen die
// Liste zur Sammelzeit (Modulausfuehrung), bevor die beforeAll()-Hooks der
// eigentlichen Test-Suite laufen. Eigener, minimaler Wegwerf-Kontext (nur
// window.*-Export noetig), unabhaengig vom geteilten `context` weiter unten.
const _listExtractionContext = { window: {} };
vm.createContext(_listExtractionContext);
vm.runInContext(fs.readFileSync(WIZARD_PATH, 'utf8'), _listExtractionContext);
const REAL_CAMPAIGN_CONTENT_ARRAYS = _listExtractionContext.window.CAMPAIGN_CONTENT_ARRAYS;
const REAL_CAMPAIGN_CONTENT_TEXT_FIELDS = _listExtractionContext.window.CAMPAIGN_CONTENT_TEXT_FIELDS;
const REAL_CAMPAIGN_CONTENT_PATHS = _listExtractionContext.window.CAMPAIGN_CONTENT_PATHS;

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

// ============================================================
// GAP-CLOSURE 12-09 — CR-01: wizard-skip nach abgeschlossenem Import muss
// denselben Reload-Pfad nehmen wie wizard-close (12-VERIFICATION.md gaps[0],
// Truth 7 FAILED; 12-REVIEW.md CR-01). Vor dem Fix (Task 2) rot: Test A und
// Test C fallen um, Test B (die Gegenprobe) besteht bereits vorher.
// ============================================================
describe('_setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01)', () => {
    let errorEl, filenameEl, resultEl;

    function buildDocumentForModal(modal) {
        return {
            getElementById: id => {
                if (id === 'migration-wizard-error') return errorEl;
                if (id === 'migration-wizard-filename') return filenameEl;
                if (id === 'migration-wizard-result') return resultEl;
                if (id === 'migration-wizard-modal') return modal;
                return null;
            },
            querySelectorAll: () => []
        };
    }

    // Je Test ein FRISCHES Attrappen-Modal: modal.dataset.actionsBound ist der
    // Guard gegen Mehrfachregistrierung in _setupWizardActions() — ein
    // wiederverwendetes Modal liefe in diesen Guard und der Klick-Handler bliebe
    // leer (grueber Test ohne Gegenstand, T-12-31).
    function createModalStub() {
        const footerEl = { style: { display: '' } };
        const audioSectionEl = { style: { display: 'none' } };
        let clickHandler = null;
        const modal = {
            dataset: {},
            // style noetig, da _closeWizard() modal.style.display = 'none' setzt —
            // der Vor-Fix-Pfad ("nur Modal ausblenden") muss ohne Wurf laufen
            // koennen, sonst pruefen Test A/B einen TypeError statt des Befunds.
            style: {},
            addEventListener: jest.fn((type, fn) => {
                if (type === 'click') clickHandler = fn;
            }),
            querySelectorAll: jest.fn(() => []),
            querySelector: jest.fn(sel => {
                if (sel === '#migration-wizard-footer') return footerEl;
                if (sel === '#migration-wizard-audio-section') return audioSectionEl;
                return null;
            })
        };
        return { modal, footerEl, audioSectionEl, getClickHandler: () => clickHandler };
    }

    beforeEach(() => {
        errorEl = { textContent: '', style: { display: 'none' } };
        filenameEl = { textContent: '', style: { display: 'none' } };
        resultEl = { innerHTML: '' };
        // Schritt 2 der Task-1-Anleitung: reload() beobachtbar machen. Der aeussere
        // beforeEach() (Zeile 132) setzt window.location bereits ohne reload —
        // dieser innere Hook laeuft danach und ueberschreibt es MIT reload.
        context.window.location = { protocol: 'https:', reload: jest.fn() };
    });

    test('CR-01 Test A: Skip-Klick NACH abgeschlossenem _processWizardFile()-Import loest window.location.reload() aus', async () => {
        const { modal, getClickHandler } = createModalStub();
        context.document = buildDocumentForModal(modal);
        context._setupWizardActions(modal);

        mockReadCampaignDataForBackup.mockResolvedValue({ characters: [{ id: 1 }], npcs: [], quests: [] });
        mockGetCampaignIndex.mockReturnValue({ campaigns: [] });
        mockConfirm.mockReturnValue(true);
        context.window.saveUndoState = jest.fn();
        context.window.importFullExport = jest.fn(() => ({ totalBytes: 4096, campaignCount: 1 }));

        const file = new global.File(
            [JSON.stringify({ _exportType: 'full-v1', campaigns: { c1: {} } })],
            'export.json',
            { type: 'application/json' }
        );
        const dropzone = { classList: { add: jest.fn(), remove: jest.fn() } };

        context._processWizardFile(file, dropzone);
        // Echter, abgeschlossener Import — nicht showWizardStep(4) von Hand gesetzt.
        await waitFor(() => resultEl.innerHTML !== '');

        const clickHandler = getClickHandler();
        expect(typeof clickHandler).toBe('function');
        clickHandler({ target: { dataset: { action: 'wizard-skip' } } });

        expect(context.window.location.reload).toHaveBeenCalledTimes(1);
    });

    test('CR-01 Test B (Gegenprobe vor dem Import): Skip-Klick auf Schritt 2 loest KEINEN Reload aus und setzt weiterhin skipped: true', () => {
        const { modal, getClickHandler } = createModalStub();
        context.document = buildDocumentForModal(modal);
        context._setupWizardActions(modal);

        context.showWizardStep(2);

        const clickHandler = getClickHandler();
        expect(typeof clickHandler).toBe('function');
        clickHandler({ target: { dataset: { action: 'wizard-skip' } } });

        expect(context.window.location.reload).not.toHaveBeenCalled();
        expect(mockStorageAPI.setJSON).toHaveBeenCalledWith(
            'migration-wizard-shown',
            expect.objectContaining({ skipped: true })
        );
    });

    test('CR-01 Test C: Wizard-Footer ist auf Schritt 3 sichtbar und ab Schritt 4 ausgeblendet', () => {
        const { modal, footerEl } = createModalStub();
        context.document = buildDocumentForModal(modal);

        context.showWizardStep(3);
        expect(footerEl.style.display).toBe('');

        context.showWizardStep(4);
        expect(footerEl.style.display).toBe('none');
    });
});

// ============================================================
// GAP-CLOSURE 12-09 — WR-01: eine versehentlich in die Haupt-Dropzone gezogene
// audio-export-v1-Datei muss die AUDIO-Dropzone als file-ready markieren (dort,
// wo auch die Text-Rueckmeldung erscheint), nicht die Haupt-Dropzone
// (12-REVIEW.md WR-01).
// ============================================================
describe('_processWizardFile() — Audio-Export-Datei in der Haupt-Dropzone (WR-01, SAFE-01)', () => {
    let statusEl, errorEl;

    beforeEach(() => {
        statusEl = { textContent: '', style: { display: 'none' }, classList: { toggle: jest.fn() } };
        errorEl = { textContent: '', style: { display: 'none' } };
    });

    test('WR-01 Test D: Audio-Datei in der Haupt-Dropzone markiert die AUDIO-Dropzone als file-ready, nicht die Haupt-Dropzone', async () => {
        const hauptDropzone = { classList: { add: jest.fn(), remove: jest.fn() } };
        const audioDropzone = { classList: { add: jest.fn(), remove: jest.fn() } };

        context.document = {
            getElementById: id => {
                if (id === 'migration-wizard-audio-status') return statusEl;
                if (id === 'migration-wizard-audio-dropzone') return audioDropzone;
                if (id === 'migration-wizard-error') return errorEl;
                return null;
            },
            querySelectorAll: () => []
        };
        context.window.importAudioExport = jest.fn(async () => ({ imported: 2, skipped: [] }));

        const file = new global.File(
            [JSON.stringify({ _exportType: 'audio-export-v1', sounds: {} })],
            'audio-export.json',
            { type: 'application/json' }
        );

        context._processWizardFile(file, hauptDropzone);
        await waitFor(() => statusEl.textContent !== '');

        expect(audioDropzone.classList.add).toHaveBeenCalledWith('file-ready');
        expect(hauptDropzone.classList.add).not.toHaveBeenCalledWith('file-ready');
    });

    test('WR-01 Test E (der Rueckfall): fehlende Audio-Dropzone -> kein Wurf, Haupt-Dropzone wird wie bisher benutzt', async () => {
        const hauptDropzone = { classList: { add: jest.fn(), remove: jest.fn() } };

        context.document = {
            getElementById: id => {
                if (id === 'migration-wizard-audio-status') return statusEl;
                if (id === 'migration-wizard-audio-dropzone') return null;
                if (id === 'migration-wizard-error') return errorEl;
                return null;
            },
            querySelectorAll: () => []
        };
        context.window.importAudioExport = jest.fn(async () => ({ imported: 1, skipped: [] }));

        const file = new global.File(
            [JSON.stringify({ _exportType: 'audio-export-v1', sounds: {} })],
            'audio-export.json',
            { type: 'application/json' }
        );

        expect(() => context._processWizardFile(file, hauptDropzone)).not.toThrow();
        await waitFor(() => statusEl.textContent !== '');

        expect(hauptDropzone.classList.add).toHaveBeenCalledWith('file-ready');
    });
});

// ============================================================
// TASK 2 (Plan 12-08, Gap-Closure G-12-3) — Gegenprobe im realistischen
// Startzustand, Einzelnachweis je Sammlung/Textfeld/Pfad, Strukturpruefung
// gegen die echte initializeData() aus core/data.js.
// ============================================================
describe('hasCampaignContent() — Gegenprobe + Strukturpruefung gegen core/data.js (Gap-Closure G-12-3)', () => {
    let initializeData;

    beforeAll(() => {
        // core/data.js schreibt beim Laden window.D und deklariert `const
        // STORAGE_KEY` — im geteilten Wizard-Kontext geladen wuerde es dessen
        // Zustand ueberschreiben. Eigener, isolierter vm-Kontext.
        const dataContext = { window: { APP_CONFIG: { STORAGE_KEY: 'x' } } };
        vm.createContext(dataContext);
        vm.runInContext(fs.readFileSync(DATA_PATH, 'utf8'), dataContext);
        initializeData = dataContext.initializeData;
    });

    // Gegenfehler-Schutz (T-12-25): eine zu weite Inhaltsdefinition wuerde JEDE
    // Installation dauerhaft als nicht-frisch einstufen und den Wizard genau den
    // Nutzern entziehen, fuer die er existiert — dieser Test ist der einzige
    // Schutz dagegen.
    test('Gegenprobe: realistischer Startzustand bleibt frisch (initializeData() + Standard-Zufallstabellen + Standard-DM-Screen-Layout + befuelltes _nextId)', async () => {
        const fresh = initializeData();
        // initRandomTables() legt beim ersten Start drei Standardtabellen an
        // (features/random-tables.js:20-23).
        fresh.randomTables = [
            { id: 1, name: 'Zufällige Begegnung - Wald', icon: '🌲', entries: [] },
            { id: 2, name: 'Tavernen-Gerüchte', icon: '🍺', entries: [] },
            { id: 3, name: 'Wetter', icon: '🌦️', entries: [] }
        ];
        // initDMScreenLayout() kopiert DEFAULT_DMSCREEN_LAYOUT hinein
        // (features/dmscreen/dmscreen-render.js:170-172).
        fresh.dmScreenLayout = { widgets: [{ id: 'party-stats', type: 'party', visible: true }] };
        fresh._nextId = { characters: 3, npcs: 2, quests: 1 };

        mockReadCampaignDataForBackup.mockResolvedValue(fresh);

        expect(await context.isFreshInstall()).toBe(true);
    });

    describe.each(REAL_CAMPAIGN_CONTENT_ARRAYS)('Sammlung "%s" kippt das Urteil einzeln (CAMPAIGN_CONTENT_ARRAYS)', name => {
        test(`${name}: [{ id: 1 }] -> hasCampaignContent() true`, () => {
            expect(context.hasCampaignContent({ [name]: [{ id: 1 }] })).toBe(true);
        });
    });

    describe.each(REAL_CAMPAIGN_CONTENT_TEXT_FIELDS)('Textfeld "%s" kippt das Urteil einzeln (CAMPAIGN_CONTENT_TEXT_FIELDS)', name => {
        test(`${name}: 'irgendetwas' -> hasCampaignContent() true`, () => {
            expect(context.hasCampaignContent({ [name]: 'irgendetwas' })).toBe(true);
        });
        test(`${name}: nur Leerzeichen -> hasCampaignContent() bleibt false`, () => {
            expect(context.hasCampaignContent({ [name]: '   ' })).toBe(false);
        });
    });

    // .map(p => [p]): describe.each() spreadet jede Zeile eines Arrays von Arrays
    // als Einzelparameter — ohne diese Verpackung wuerden die zwei Segmente eines
    // Pfads (z. B. ['soundboard','scenes']) als zwei separate Testparameter
    // ankommen statt als ein Pfad-Array.
    describe.each(REAL_CAMPAIGN_CONTENT_PATHS.map(p => [p]))('Pfad "%s" kippt das Urteil einzeln (CAMPAIGN_CONTENT_PATHS)', contentPath => {
        test(`${contentPath.join('.')}: verschachtelter Eintrag -> hasCampaignContent() true`, () => {
            let nested = [{ id: 1 }];
            for (let i = contentPath.length - 1; i >= 0; i--) {
                nested = { [contentPath[i]]: nested };
            }
            expect(context.hasCampaignContent(nested)).toBe(true);
        });
    });

    test('Strukturpruefung: jeder Eintrag aus CAMPAIGN_CONTENT_ARRAYS/_TEXT_FIELDS/_PATHS ist im Rueckgabewert von initializeData() nicht vorhanden oder leer', () => {
        const fresh = initializeData();
        const verstoesse = [];

        for (const name of REAL_CAMPAIGN_CONTENT_ARRAYS) {
            const v = fresh[name];
            if (v !== undefined && !(Array.isArray(v) && v.length === 0)) {
                verstoesse.push(`CAMPAIGN_CONTENT_ARRAYS: '${name}' ist in initializeData() nicht leer: ${JSON.stringify(v)}`);
            }
        }
        for (const name of REAL_CAMPAIGN_CONTENT_TEXT_FIELDS) {
            const v = fresh[name];
            if (v !== undefined && v !== '') {
                verstoesse.push(`CAMPAIGN_CONTENT_TEXT_FIELDS: '${name}' ist in initializeData() nicht leer: ${JSON.stringify(v)}`);
            }
        }
        for (const contentPath of REAL_CAMPAIGN_CONTENT_PATHS) {
            let cursor = fresh;
            let reachable = true;
            for (const segment of contentPath) {
                if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) { reachable = false; break; }
                cursor = cursor[segment];
            }
            if (reachable && !(Array.isArray(cursor) && cursor.length === 0)) {
                verstoesse.push(`CAMPAIGN_CONTENT_PATHS: '${contentPath.join('.')}' ist in initializeData() nicht leer: ${JSON.stringify(cursor)}`);
            }
        }

        expect(verstoesse).toEqual([]);
    });

    test('Umkehrprobe: settings/randomTables/dmScreenLayout/_nextId stehen in keiner der drei Listen (T-12-25)', () => {
        const excluded = ['settings', 'randomTables', 'dmScreenLayout', '_nextId'];
        for (const name of excluded) {
            expect(REAL_CAMPAIGN_CONTENT_ARRAYS).not.toContain(name);
            expect(REAL_CAMPAIGN_CONTENT_TEXT_FIELDS).not.toContain(name);
            expect(REAL_CAMPAIGN_CONTENT_PATHS.some(p => p[0] === name)).toBe(false);
        }
    });
});
