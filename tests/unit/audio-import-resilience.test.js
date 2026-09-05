/**
 * Audio-Import-Resilienz — SAFE-01 / Decision D-02 (Phase 12, Gap-Closure R03)
 *
 * Gepinnte Verhaltensaussage: "Eine fehlende Audio-Datei blockiert den
 * Hauptimport NICHT und benennt die betroffenen Szenen."
 *
 * Bisher war nur die reine Hilfsfunktion findMissingSceneAudio() getestet —
 * losgeloest von jedem Importlauf. Hier wird stattdessen der ECHTE Pfad
 * _processWizardFile() (systems/migration/migration-wizard.js) mit einer
 * full-v1-Datei gefahren, deren aktive Kampagne auf blobIds zeigt, die
 * listSoundBlobs() NICHT kennt. Geprueft wird danach:
 *   - importFullExport() wurde aufgerufen (Hauptimport lief durch),
 *   - der Wizard hat Schritt 4 (Erfolgsbestaetigung) erreicht,
 *   - die Ergebnisflaeche traegt die Erfolgszeilen UND die Szenennamen.
 *
 * Muster: vm.createContext() wie tests/unit/migration-wizard.test.js. Diese
 * Datei benutzt einen EIGENEN Kontext und laedt zusaetzlich die echte
 * findMissingSceneAudio() aus systems/migration/audio-export.js — keine
 * nachgebaute Testlogik.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WIZARD_PATH = path.join(__dirname, '../../systems/migration/migration-wizard.js');
const AUDIO_EXPORT_PATH = path.join(__dirname, '../../systems/migration/audio-export.js');

let context;
let mockListSoundBlobs;
let mockImportFullExport;
let mockReadCampaignDataForBackup;
let mockGetCampaignIndex;
let mockConfirm;
let modal, resultEl, errorEl, filenameEl, dropzone;
let stepEls, footerEl;
let realFindMissingSceneAudio;
let audioStatusEl;

/** Wartet, bis condition() wahr wird (fuer den async reader.onload-Zweig). */
async function waitFor(conditionFn, { timeout = 3000, interval = 5 } = {}) {
    const start = Date.now();
    while (!conditionFn()) {
        if (Date.now() - start > timeout) {
            throw new Error('waitFor: Bedingung nicht innerhalb des Timeouts erfuellt');
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}

/** Minimale, aber echte esc()-Semantik (XSS-sichere Entity-Kodierung). */
function escLike(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Attrappen-Modal fuer showWizardStep(): echte .migration-step-Elemente mit
 * dataset.step, damit "Schritt 4 erreicht" am sichtbaren Element abgelesen
 * wird und nicht an einer internen Variablen.
 */
function createModalStub() {
    stepEls = [1, 2, 3, 4].map(n => ({
        dataset: { step: String(n) },
        style: { display: 'none' }
    }));
    footerEl = { style: { display: '' } };
    const audioSectionEl = { style: { display: 'none' } };
    return {
        dataset: {},
        style: {},
        addEventListener: jest.fn(),
        querySelectorAll: sel => (sel === '.migration-step' ? stepEls : []),
        querySelector: sel => {
            if (sel === '#migration-wizard-audio-section') return audioSectionEl;
            if (sel === '#migration-wizard-footer') return footerEl;
            return null;
        }
    };
}

/** Sichtbarer Schritt laut DOM-Attrappe. */
function sichtbarerSchritt() {
    const el = stepEls.find(s => s.style.display === '');
    return el ? Number(el.dataset.step) : null;
}

/** full-v1-Export mit aktiver Kampagne, deren Szenen auf blobIds zeigen. */
function buildFullExport(activeKey, scenes, weitereKampagnen = {}) {
    return {
        _exportType: 'full-v1',
        _activeCampaignKey: activeKey,
        campaigns: Object.assign({
            [activeKey]: { data: { soundboard: { scenes } } }
        }, weitereKampagnen)
    };
}

function makeFile(obj) {
    return new global.File([JSON.stringify(obj)], 'export.json', { type: 'application/json' });
}

beforeAll(() => {
    const APP_CONFIG_MOCK = { STORAGE_KEY: 'dnd-tracker-data', DEBUG_MODE: false, VERSION: '2.7.0' };

    mockListSoundBlobs = jest.fn(async () => []);
    mockImportFullExport = jest.fn(() => ({ totalBytes: 4096, campaignCount: 2 }));
    mockReadCampaignDataForBackup = jest.fn(async () => null);
    mockGetCampaignIndex = jest.fn(() => ({ campaigns: [] }));
    mockConfirm = jest.fn(() => true);

    context = {
        window: {
            APP_CONFIG: APP_CONFIG_MOCK,
            location: { protocol: 'https:' },
            showToast: jest.fn()
        },
        APP_CONFIG: APP_CONFIG_MOCK,
        StorageAPI: {
            getJSON: jest.fn((key, fallback) => fallback),
            setJSON: jest.fn(),
            has: jest.fn(() => false)
        },
        sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        setTimeout: jest.fn(),
        confirm: mockConfirm,
        esc: escLike,
        document: { getElementById: () => null, querySelectorAll: () => [] },
        FileReader: global.FileReader,
        console: console
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(WIZARD_PATH, 'utf8'), context);

    // Echte findMissingSceneAudio() aus audio-export.js — in eigenem Kontext
    // geladen (die Datei deklariert eigene Top-Level-Konstanten), dann in den
    // Wizard-Kontext gehaengt. Keine Testnachbildung der Logik.
    const audioCtx = { window: {}, APP_CONFIG: APP_CONFIG_MOCK, console: console, document: { createElement: () => ({}) } };
    vm.createContext(audioCtx);
    vm.runInContext(fs.readFileSync(AUDIO_EXPORT_PATH, 'utf8'), audioCtx);
    context.window.findMissingSceneAudio = audioCtx.window.findMissingSceneAudio;
    expect(typeof context.window.findMissingSceneAudio).toBe('function');
    realFindMissingSceneAudio = context.window.findMissingSceneAudio;
});

beforeEach(() => {
    resultEl = { innerHTML: '' };
    errorEl = { textContent: '', style: { display: 'none' } };
    filenameEl = { textContent: '', style: { display: 'none' } };
    dropzone = { classList: { add: jest.fn(), remove: jest.fn() } };
    modal = createModalStub();
    // Task 2 (SEC-01, Audio-Pfad): Attrappe fuer die Audio-Statuszeile, die
    // _processWizardAudioFile() befuellt.
    audioStatusEl = { textContent: '', style: { display: 'none' }, classList: { toggle: jest.fn() } };

    context.document = {
        getElementById: id => {
            if (id === 'migration-wizard-result') return resultEl;
            if (id === 'migration-wizard-error') return errorEl;
            if (id === 'migration-wizard-filename') return filenameEl;
            if (id === 'migration-wizard-modal') return modal;
            if (id === 'migration-wizard-audio-status') return audioStatusEl;
            return null;
        },
        querySelectorAll: () => []
    };

    mockListSoundBlobs.mockReset();
    mockListSoundBlobs.mockResolvedValue([]);
    mockImportFullExport.mockReset();
    mockImportFullExport.mockReturnValue({ totalBytes: 4096, campaignCount: 2 });
    mockConfirm.mockReset();
    mockConfirm.mockReturnValue(true);
    mockReadCampaignDataForBackup.mockReset();
    mockReadCampaignDataForBackup.mockResolvedValue(null);
    mockGetCampaignIndex.mockReset();
    mockGetCampaignIndex.mockReturnValue({ campaigns: [] });

    context.window.listSoundBlobs = mockListSoundBlobs;
    context.window.importFullExport = mockImportFullExport;
    context.window.saveUndoState = jest.fn();
    context.window.readCampaignDataForBackup = mockReadCampaignDataForBackup;
    context.window.getCampaignIndex = mockGetCampaignIndex;
    context.window.D = { soundboard: { scenes: [] } };
    // Reset auf die ECHTE findMissingSceneAudio() vor jedem Test — einzelne
    // SEC-01-Tests ersetzen sie gezielt durch eine werfende Attrappe.
    context.window.findMissingSceneAudio = realFindMissingSceneAudio;
    // Task 2: Standard-Erfolgsantwort; einzelne Tests ueberschreiben gezielt.
    context.window.importAudioExport = jest.fn(async () => ({ imported: 0, skipped: [] }));
});

// ============================================================
// D-02 — fehlende Audio-Datei blockiert den Hauptimport nicht
// ============================================================
describe('_processWizardFile() — unaufloesbares Szenen-Audio (SAFE-01, D-02)', () => {
    test('Hauptimport laeuft trotz fehlender Audio-Dateien durch: importFullExport aufgerufen, Schritt 4 erreicht, keine Fehlermeldung', async () => {
        mockListSoundBlobs.mockResolvedValue([]); // KEIN einziger Blob vorhanden
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '');

        expect(mockImportFullExport).toHaveBeenCalledTimes(1);
        expect(sichtbarerSchritt()).toBe(4);
        expect(errorEl.textContent).toBe('');
        expect(resultEl.innerHTML).toContain('Kampagnen importiert:');
        expect(dropzone.classList.add).toHaveBeenCalledWith('file-ready');
    });

    test('die betroffenen Szenen werden im Ergebnis NAMENTLICH genannt — Namen, nicht blobIds', async () => {
        mockListSoundBlobs.mockResolvedValue([{ id: 'audio_1_1' }]);
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] },
            { id: 's2', name: 'Taverne', tracks: [{ blobId: 'audio_1_1' }] },
            { id: 's3', name: 'Hoehle', tracks: [{ blobId: 'audio_8_8' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '');

        const html = resultEl.innerHTML;
        expect(html).toContain('migration-audio-missing');
        expect(html).toContain('Kampf, Hoehle');
        // Vollstaendig aufloesbare Szene darf NICHT genannt werden
        expect(html).not.toContain('Taverne');
        // Rohe blobIds gehoeren nicht in den Nutzertext
        expect(html).not.toContain('audio_9_9');
        expect(html).not.toContain('[object Object]');
    });

    test('geprueft wird die AKTIVE Kampagne aus der Datei — nicht window.D und nicht die uebrigen Kampagnen (CR-04)', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        // Stale Vor-Import-Instanz: haette eine ganz andere Luecke
        context.window.D = {
            soundboard: { scenes: [{ id: 'x', name: 'StaleSzene', tracks: [{ blobId: 'audio_5_5' }] }] }
        };
        const file = makeFile(buildFullExport(
            'camp-a',
            [{ id: 's1', name: 'AktiveSzene', tracks: [{ blobId: 'audio_9_9' }] }],
            { 'camp-b': { data: { soundboard: { scenes: [{ id: 's9', name: 'FremdeSzene', tracks: [{ blobId: 'audio_7_7' }] }] } } } }
        ));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '');

        expect(resultEl.innerHTML).toContain('AktiveSzene');
        expect(resultEl.innerHTML).not.toContain('StaleSzene');
        expect(resultEl.innerHTML).not.toContain('FremdeSzene');
    });

    test('sind alle blobIds aufloesbar, erscheint KEIN Audio-Hinweis — Schritt 4 trotzdem erreicht', async () => {
        mockListSoundBlobs.mockResolvedValue([{ id: 'audio_1_1' }, { id: 'audio_2_2' }]);
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_1_1' }, { blobId: 'audio_2_2' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '');

        expect(resultEl.innerHTML).not.toContain('migration-audio-missing');
        expect(sichtbarerSchritt()).toBe(4);
        expect(mockImportFullExport).toHaveBeenCalledTimes(1);
    });

    test('Szenennamen werden esc()-kodiert in die Ergebnisflaeche geschrieben (kein rohes Markup)', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: '<img src=x onerror=alert(1)>', tracks: [{ blobId: 'audio_9_9' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '');

        expect(resultEl.innerHTML).not.toContain('<img');
        expect(resultEl.innerHTML).toContain('&lt;img');
    });

    test('scheiternde listSoundBlobs()-Abfrage: der Hauptimport selbst ist zu diesem Zeitpunkt bereits ausgefuehrt', async () => {
        mockListSoundBlobs.mockRejectedValue(new Error('IndexedDB nicht verfuegbar'));
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '' || errorEl.textContent !== '');

        // importFullExport() laeuft VOR der Audio-Abfrage (migration-wizard.js:485
        // vor :511) — die Daten sind also geschrieben, egal wie die Abfrage ausgeht.
        expect(mockImportFullExport).toHaveBeenCalledTimes(1);
    });

    // BEHOBENER BEFUND (SEC-01, Plan 12-14): der D-02-Block stand vormals INNERHALB
    // des try des Hauptimports (migration-wizard.js, nach
    // `const result = importFn(parsedObj)` und VOR `showWizardStep(4)`). Eine
    // ablehnende listSoundBlobs()-Zusage leitete einen BEREITS ERFOLGREICHEN Import
    // in showError('Import fehlgeschlagen: ...') um; Schritt 4 wurde nie erreicht
    // und der Nutzer sah seinen gelungenen Umzug als Fehlschlag — genau der Fall,
    // den D-02 verbietet. Der Import-try endet jetzt unmittelbar nach dem Ruecksprung
    // aus importFn(); der Nachlauf (Dropzone, Ergebnisflaeche, D-02-Benennung) liegt
    // ausserhalb und hat fuer die Benennung ein eigenes try/catch. Dieser Test war
    // als test.failing verankert (heute ROT, deshalb gruen gemeldet) und ist mit dem
    // Fix auf test() umgestellt — er faellt jetzt genau dann, wenn die Grenze wieder
    // in den Import-try zurückwandert (siehe Mutationsnachweis in 12-14-SUMMARY.md).
    test('D-02-Kern: eine scheiternde listSoundBlobs()-Abfrage darf den bereits erfolgreichen Hauptimport NICHT in einen Fehler kippen', async () => {
        mockListSoundBlobs.mockRejectedValue(new Error('IndexedDB nicht verfuegbar'));
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '' || errorEl.textContent !== '');

        expect(errorEl.textContent).not.toMatch(/Import fehlgeschlagen/);
        expect(sichtbarerSchritt()).toBe(4);
    });

    test('SEC-01: wirft listSoundBlobs(), bleiben die Erfolgszeilen inhaltlich erhalten (nicht nur "kein Fehler")', async () => {
        mockListSoundBlobs.mockRejectedValue(new Error('IndexedDB nicht verfuegbar'));
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '' || errorEl.textContent !== '');

        expect(errorEl.textContent).toBe('');
        expect(sichtbarerSchritt()).toBe(4);
        expect(mockImportFullExport).toHaveBeenCalledTimes(1);
        expect(resultEl.innerHTML).toContain('Kampagnen importiert:');
        expect(resultEl.innerHTML).toContain('<strong>2</strong>');
        expect(resultEl.innerHTML).toContain('Gesamtgr');
        expect(dropzone.classList.add).toHaveBeenCalledWith('file-ready');
    });

    test('SEC-01: wirft findMissingSceneAudio(), bleiben die Erfolgszeilen inhaltlich erhalten', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        context.window.findMissingSceneAudio = jest.fn(() => { throw new Error('kaputt'); });
        const file = makeFile(buildFullExport('camp-a', [
            { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] }
        ]));

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '' || errorEl.textContent !== '');

        expect(errorEl.textContent).toBe('');
        expect(sichtbarerSchritt()).toBe(4);
        expect(mockImportFullExport).toHaveBeenCalledTimes(1);
        expect(resultEl.innerHTML).toContain('Kampagnen importiert:');
        expect(resultEl.innerHTML).toContain('<strong>2</strong>');
    });
});

// ============================================================
// SEC-01 (Plan 12-14) — Audio-Pfad: Uebersprungen-Liste ueberlebt eine
// scheiternde Lueckenpruefung
// ============================================================
describe('_processWizardAudioFile() — scheiternde Lueckenpruefung darf Zahl/Gruende nicht unterdruecken (SAFE-01, SEC-01)', () => {
    test('SEC-01: eine scheiternde Lueckenpruefung nach dem Audio-Import unterdrueckt weder Zahl noch Gruende bereits importierter/uebersprungener Dateien', async () => {
        context.window.importAudioExport = jest.fn(async () => ({
            imported: 3,
            skipped: [{ id: 'a1', name: 'clip.mp3', grund: 'zu gross' }]
        }));
        mockListSoundBlobs.mockRejectedValue(new Error('IndexedDB nicht verfuegbar'));
        const file = makeFile({ _exportType: 'audio-export-v1' });

        context._processWizardAudioFile(file, dropzone);
        await waitFor(() => audioStatusEl.textContent !== '');

        expect(audioStatusEl.textContent).toContain('Audio importiert: 3 Datei(en).');
        expect(audioStatusEl.textContent).toContain('clip.mp3: zu gross');
        expect(audioStatusEl.classList.toggle).toHaveBeenCalledWith('migration-step-error', false);
        expect(dropzone.classList.add).toHaveBeenCalledWith('file-ready');
    });

    test('SEC-01 Gegenprobe: wirft importAudioExport() selbst, bleibt es bei der Fehlermeldung mit Fehlermarkierung', async () => {
        context.window.importAudioExport = jest.fn(async () => { throw new Error('Datei kaputt'); });
        const file = makeFile({ _exportType: 'audio-export-v1' });

        context._processWizardAudioFile(file, dropzone);
        await waitFor(() => audioStatusEl.textContent !== '');

        expect(audioStatusEl.textContent).toContain('Audio-Import fehlgeschlagen');
        expect(audioStatusEl.classList.toggle).toHaveBeenCalledWith('migration-step-error', true);
        expect(dropzone.classList.add).not.toHaveBeenCalledWith('file-ready');
    });

    test('Erfolgsfall unveraendert: ohne jeden Wurf zeigt die Statuszeile weiterhin fehlende Szenen namentlich', async () => {
        context.window.importAudioExport = jest.fn(async () => ({ imported: 2, skipped: [] }));
        mockListSoundBlobs.mockResolvedValue([]); // kein Blob vorhanden -> Szene bleibt offen
        context.window.D = {
            soundboard: { scenes: [{ id: 's1', name: 'Kerker', tracks: [{ blobId: 'audio_3_3' }] }] }
        };
        const file = makeFile({ _exportType: 'audio-export-v1' });

        context._processWizardAudioFile(file, dropzone);
        await waitFor(() => audioStatusEl.textContent !== '');

        expect(audioStatusEl.textContent).toContain('Audio importiert: 2 Datei(en).');
        expect(audioStatusEl.textContent).toContain('fehlt weiterhin Audio: Kerker');
        expect(audioStatusEl.classList.toggle).toHaveBeenCalledWith('migration-step-error', false);
    });
});

// ============================================================
// SEC-01 (Plan 12-14, Task 3) — Invariante ueber mehrere Wurfstellen: nach dem
// Ruecksprung aus importFn() fuehrt kein Weg mehr in den Fehlschlag
// ============================================================
describe('_processWizardFile() — SEC-01 Invariante: nach dem Ruecksprung aus importFn() fuehrt kein Weg mehr in den Fehlschlag', () => {
    const buildInvarianceExport = () => buildFullExport('camp-a', [
        { id: 's1', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] }
    ]);

    const faelle = [
        {
            name: 'SEC-01 Invariante: listSoundBlobs() lehnt ab (Promise-Rejection)',
            praeparieren: () => { mockListSoundBlobs.mockRejectedValue(new Error('IndexedDB nicht verfuegbar')); },
            erwarteterSchritt: 4,
            erwarteteFehlermeldung: false
        },
        {
            name: 'SEC-01 Invariante: listSoundBlobs() wirft synchron',
            praeparieren: () => { mockListSoundBlobs.mockImplementation(() => { throw new Error('Sync-Fehler'); }); },
            erwarteterSchritt: 4,
            erwarteteFehlermeldung: false
        },
        {
            name: 'SEC-01 Invariante: findMissingSceneAudio() wirft',
            praeparieren: () => {
                mockListSoundBlobs.mockResolvedValue([]);
                context.window.findMissingSceneAudio = jest.fn(() => { throw new Error('kaputt'); });
            },
            erwarteterSchritt: 4,
            erwarteteFehlermeldung: false
        },
        {
            name: 'SEC-01 Invariante Gegen-Eintrag: wirft importFullExport() SELBST, bleibt es beim Fehlschlag',
            praeparieren: () => { mockImportFullExport.mockImplementation(() => { throw new Error('Import kaputt'); }); },
            erwarteterSchritt: null,
            erwarteteFehlermeldung: true
        }
    ];

    test.each(faelle)('$name', async ({ praeparieren, erwarteterSchritt, erwarteteFehlermeldung }) => {
        praeparieren();
        const file = makeFile(buildInvarianceExport());

        context._processWizardFile(file, dropzone);
        await waitFor(() => resultEl.innerHTML !== '' || errorEl.textContent !== '');

        if (erwarteteFehlermeldung) {
            expect(errorEl.textContent).toMatch(/Import fehlgeschlagen/);
            expect(sichtbarerSchritt()).not.toBe(4);
        } else {
            expect(mockImportFullExport).toHaveBeenCalledTimes(1);
            expect(errorEl.textContent).toBe('');
            expect(sichtbarerSchritt()).toBe(erwarteterSchritt);
            expect(resultEl.innerHTML).toContain('Kampagnen importiert:');
        }
    });
});
