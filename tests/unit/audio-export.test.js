/**
 * Audio-Export Tests — SAFE-01 (Wave-0 RED-Phase)
 * Testet buildAudioExport()/importAudioExport()/blobToBase64()/base64ToBlob() aus
 * systems/migration/audio-export.js sowie (Task 3) checkAudioExportFeasible() und die
 * Härtung des Import-Pfads.
 *
 * RED-Phase: systems/migration/audio-export.js existiert noch nicht (Plan 12-01, Task 1).
 * Der Block "buildAudioExport / importAudioExport / Base64-Rundlauf" beschreibt den
 * Kontrakt aus Task 2 und wird nach dessen Implementierung grün. Der Block
 * "checkAudioExportFeasible / Härtung" (weiter unten) beschreibt den Kontrakt aus Task 3
 * und wird erst nach dessen Implementierung grün — bis dahin bleibt er bewusst rot
 * (Präzedenz: full-export.test.js, TECH-02 Wave-0-Muster).
 *
 * Plan 12-02, Task 1: "downloadAudioExport — Zwei-Datei-Download (SAFE-01)" und der
 * Quelltext-Beleg für den Aufruf in startMigrationFlow() (migration-wizard.js) sind
 * ab hier ergänzt. Plan 12-02, Task 2: "findMissingSceneAudio" folgt weiter unten.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: audio-export.js in vm-Kontext laden (non-ESM-Muster)
// ============================================================

let buildAudioExport;
let importAudioExport;
let blobToBase64;
let base64ToBlob;
let checkAudioExportFeasible; // erst ab Task 3 vorhanden
let downloadAudioExport; // Plan 12-02, Task 1
let findMissingSceneAudio; // Plan 12-02, Task 2
let schaetzeAudioRohbytes; // Plan 12-15, Task 1 (SEC-07) — vm-Kontext-Direktzugriff, kein window.*-Export

let mockListSoundBlobs;
let mockGetSoundBlob;
let mockSaveSoundBlob;
let mockGetAllStats;
let mockShowToast;
let mockErrorLog;
let mockCreateElement;
let mockCreateObjectURL;
let mockRevokeObjectURL;
let mockBodyAppendChild;
let mockBodyRemoveChild;
let createdAnchors;
let getAudioExportSummary; // Checkpoint-Fix (Weg B)

beforeAll(() => {
    mockListSoundBlobs = jest.fn();
    mockGetSoundBlob = jest.fn();
    mockSaveSoundBlob = jest.fn();
    mockGetAllStats = jest.fn();
    mockShowToast = jest.fn();
    mockErrorLog = jest.fn();

    createdAnchors = [];
    mockCreateElement = jest.fn(tag => {
        const el = { tagName: tag, href: '', download: '', click: jest.fn() };
        if (tag === 'a') createdAnchors.push(el);
        return el;
    });
    mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    mockRevokeObjectURL = jest.fn();
    // Checkpoint-Fix: downloadAudioExport() haengt den Anchor jetzt VOR dem
    // Klick an document.body an und entfernt ihn danach wieder.
    mockBodyAppendChild = jest.fn();
    mockBodyRemoveChild = jest.fn();

    const APP_CONFIG_MOCK = { VERSION: '2.7.0', DEBUG_MODE: false };

    const context = {
        window: {
            APP_CONFIG: APP_CONFIG_MOCK,
            listSoundBlobs: mockListSoundBlobs,
            getSoundBlob: mockGetSoundBlob,
            saveSoundBlob: mockSaveSoundBlob,
            getAllStats: mockGetAllStats,
            showToast: mockShowToast,
            ErrorHandler: { log: mockErrorLog }
        },
        APP_CONFIG: APP_CONFIG_MOCK,
        console: console,
        // Plan 12-02, Task 1: downloadAudioExport() referenziert document/URL als
        // Globals (Browser-Muster: window === globalThis) — im vm-Kontext MUESSEN
        // sie deshalb direkt auf dem Context-Objekt liegen, nicht unter window.*.
        document: {
            createElement: mockCreateElement,
            body: { appendChild: mockBodyAppendChild, removeChild: mockBodyRemoveChild }
        },
        URL: { createObjectURL: mockCreateObjectURL, revokeObjectURL: mockRevokeObjectURL },
        // jsdom (testEnvironment: 'jsdom') stellt diese bereits im Node-Global-Scope
        // bereit — hier in den vm-Kontext durchreichen, analog full-export.test.js.
        Blob: global.Blob,
        File: global.File,
        FileReader: global.FileReader,
        atob: global.atob,
        btoa: global.btoa
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/migration/audio-export.js');
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(code, context);

    buildAudioExport = context.buildAudioExport;
    importAudioExport = context.importAudioExport;
    blobToBase64 = context.blobToBase64;
    base64ToBlob = context.base64ToBlob;
    checkAudioExportFeasible = context.checkAudioExportFeasible;
    downloadAudioExport = context.downloadAudioExport;
    findMissingSceneAudio = context.findMissingSceneAudio;
    getAudioExportSummary = context.getAudioExportSummary;
    schaetzeAudioRohbytes = context.schaetzeAudioRohbytes;
});

beforeEach(() => {
    mockListSoundBlobs.mockReset();
    mockGetSoundBlob.mockReset();
    mockSaveSoundBlob.mockReset();
    mockGetAllStats.mockReset();
    mockShowToast.mockReset();
    mockErrorLog.mockReset();
    mockCreateElement.mockClear();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
    mockBodyAppendChild.mockClear();
    mockBodyRemoveChild.mockClear();
    createdAnchors = [];
});

// Deterministische Byte-Fixtures (klein, exakt vergleichbar nach dem Base64-Rundlauf)
function bytesA() {
    return new Uint8Array([1, 2, 3, 4, 5]);
}
function bytesB() {
    return new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2, 1]);
}

function blobBytes(blob) {
    // jsdoms Blob-Implementierung im Jest-Testlauf kennt kein Blob.prototype.arrayBuffer()
    // (verifiziert in dieser Sitzung) — FileReader.readAsArrayBuffer() ist der portable Weg.
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(Array.from(new Uint8Array(reader.result)));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

// ============================================================
// TASK 2 — buildAudioExport / importAudioExport / Base64-Rundlauf
// ============================================================

describe('buildAudioExport — Struktur und Metadaten (SAFE-01)', () => {
    test('liefert _exportType, _appVersion, _exportDate und ein audioFiles-Element je IDB-Eintrag', async () => {
        expect(typeof buildAudioExport).toBe('function'); // rot bis Task 2 implementiert

        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 },
            { id: 'audio_2_2', name: 'b.ogg', size: 9, type: 'audio/ogg', savedAt: 222 }
        ]);
        mockGetSoundBlob.mockImplementation(id => {
            if (id === 'audio_1_1') return Promise.resolve(new Blob([bytesA()], { type: 'audio/mpeg' }));
            if (id === 'audio_2_2') return Promise.resolve(new Blob([bytesB()], { type: 'audio/ogg' }));
            return Promise.resolve(null);
        });
        mockGetAllStats.mockResolvedValue([]);

        const result = await buildAudioExport();

        expect(result._exportType).toBe('audio-export-v1');
        expect(result._appVersion).toBe('2.7.0');
        expect(typeof result._exportDate).toBe('string');
        expect(new Date(result._exportDate).toString()).not.toBe('Invalid Date');

        expect(Array.isArray(result.audioFiles)).toBe(true);
        expect(result.audioFiles).toHaveLength(2);

        const first = result.audioFiles.find(f => f.id === 'audio_1_1');
        expect(first).toBeDefined();
        expect(first.name).toBe('a.mp3');
        expect(first.type).toBe('audio/mpeg');
        expect(first.size).toBe(5);
        expect(typeof first.data).toBe('string');
    });

    test('Metadaten-Eintrag ohne Blob (getSoundBlob liefert null) wird übersprungen, übrige werden trotzdem exportiert', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'fehlt.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 },
            { id: 'audio_2_2', name: 'da.ogg', size: 9, type: 'audio/ogg', savedAt: 222 }
        ]);
        mockGetSoundBlob.mockImplementation(id => {
            if (id === 'audio_1_1') return Promise.resolve(null); // Blob fehlt (defensiv)
            return Promise.resolve(new Blob([bytesB()], { type: 'audio/ogg' }));
        });
        mockGetAllStats.mockResolvedValue([]);

        const result = await buildAudioExport();

        expect(result.audioFiles).toHaveLength(1);
        expect(result.audioFiles[0].id).toBe('audio_2_2');
    });

    test('diceStats enthält alle Datensätze aus getAllStats() vollständig und unverändert (kein Cap)', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        const stats = [
            { notation: '1d20', result: 15, rolls: [15], timestamp: 1, sessionId: 's1', charId: 1 },
            { notation: '2d6', result: 7, rolls: [3, 4], timestamp: 2, sessionId: 's1', charId: 1 }
        ];
        mockGetAllStats.mockResolvedValue(stats);

        const result = await buildAudioExport();

        expect(result.diceStats).toEqual(stats);
    });
});

describe('Base64-Rundlauf (SAFE-01)', () => {
    test('base64ToBlob(blobToBase64(b), type) liefert dieselben Bytes zurück', async () => {
        const original = bytesA();
        const blob = new Blob([original], { type: 'audio/mpeg' });

        const base64 = await blobToBase64(blob);
        expect(typeof base64).toBe('string');
        // Data-URL-Praefix ('data:...;base64,') darf NICHT im Ergebnis stehen
        expect(base64.startsWith('data:')).toBe(false);

        const roundtripBlob = base64ToBlob(base64, 'audio/mpeg');
        const roundtripBytes = await blobBytes(roundtripBlob);

        expect(roundtripBytes).toEqual(Array.from(original));
        expect(roundtripBlob.type).toBe('audio/mpeg');
    });
});

describe('importAudioExport — Rundlauf (SAFE-01)', () => {
    test('ruft saveSoundBlob() genau einmal pro Datei mit derselben id und demselben Namen auf', async () => {
        const exportObj = {
            _exportType: 'audio-export-v1',
            _appVersion: '2.7.0',
            _exportDate: new Date().toISOString(),
            audioFiles: [
                { id: 'audio_1_1', name: 'a.mp3', type: 'audio/mpeg', size: 5, data: await blobToBase64(new Blob([bytesA()])) },
                { id: 'audio_2_2', name: 'b.ogg', type: 'audio/ogg', size: 9, data: await blobToBase64(new Blob([bytesB()])) }
            ],
            diceStats: []
        };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(mockSaveSoundBlob).toHaveBeenCalledTimes(2);
        const calledIds = mockSaveSoundBlob.mock.calls.map(call => call[0]);
        expect(calledIds).toEqual(['audio_1_1', 'audio_2_2']);
        const calledNames = mockSaveSoundBlob.mock.calls.map(call => call[1].name);
        expect(calledNames).toEqual(['a.mp3', 'b.ogg']);

        expect(result.imported).toBe(2);
        expect(result.skipped).toEqual([]);
    });

    test('importAudioExport({ _exportType: "full-v1" }) wirft — keine stillschweigende Halbverarbeitung', async () => {
        await expect(importAudioExport({ _exportType: 'full-v1' })).rejects.toThrow();
        expect(mockSaveSoundBlob).not.toHaveBeenCalled();
    });
});

// ============================================================
// PLAN 12-02, TASK 1 — downloadAudioExport() / Zwei-Datei-Download
// Bleibt rot, bis Task 1 die leere-Bibliothek-Sonderfall-Pruefung ergaenzt und
// den startMigrationFlow()-Aufruf in migration-wizard.js verdrahtet.
// ============================================================

describe('downloadAudioExport — Zwei-Datei-Download (SAFE-01)', () => {
    test('gefuellte Bibliothek loest genau einen Anchor-Download aus', async () => {
        expect(typeof downloadAudioExport).toBe('function'); // rot bis Task 1 implementiert

        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 }
        ]);
        mockGetSoundBlob.mockResolvedValue(new Blob([bytesA()], { type: 'audio/mpeg' }));
        mockGetAllStats.mockResolvedValue([]);

        await downloadAudioExport();

        expect(createdAnchors).toHaveLength(1);
        expect(createdAnchors[0].click).toHaveBeenCalledTimes(1);
        expect(createdAnchors[0].download).toMatch(/^dnd-tracker-audio-.*\.json$/);
        expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
        expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    test('Checkpoint-Fix: der Anchor wird VOR dem Klick an document.body angehaengt und danach entfernt', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 }
        ]);
        mockGetSoundBlob.mockResolvedValue(new Blob([bytesA()], { type: 'audio/mpeg' }));
        mockGetAllStats.mockResolvedValue([]);

        await downloadAudioExport();

        expect(mockBodyAppendChild).toHaveBeenCalledTimes(1);
        expect(mockBodyRemoveChild).toHaveBeenCalledTimes(1);
        const appendOrder = mockBodyAppendChild.mock.invocationCallOrder[0];
        const clickOrder = createdAnchors[0].click.mock.invocationCallOrder[0];
        const removeOrder = mockBodyRemoveChild.mock.invocationCallOrder[0];
        expect(appendOrder).toBeLessThan(clickOrder);
        expect(clickOrder).toBeLessThan(removeOrder);
    });

    test('Checkpoint-Fix (ehrliche Rueckmeldung): Erfolgs-Toast behauptet "angeboten", nicht "heruntergeladen" — a.click() wirft nicht, wenn der Browser den Download verwirft', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 }
        ]);
        mockGetSoundBlob.mockResolvedValue(new Blob([bytesA()], { type: 'audio/mpeg' }));
        mockGetAllStats.mockResolvedValue([]);

        await downloadAudioExport();

        const successToastCalls = mockShowToast.mock.calls.filter(call =>
            typeof call[0] === 'string' && call[0].includes('angeboten'));
        expect(successToastCalls.length).toBeGreaterThan(0);
        const heruntergeladenCalls = mockShowToast.mock.calls.filter(call =>
            typeof call[0] === 'string' && call[0] === 'Audio-Export heruntergeladen');
        expect(heruntergeladenCalls).toHaveLength(0);
    });

    test('leere Bibliothek (weder audioFiles noch diceStats) loest KEINEN Download aus', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        mockGetAllStats.mockResolvedValue([]);

        await downloadAudioExport();

        expect(createdAnchors).toHaveLength(0);
        expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    test('feasible:false loest KEINEN Download aus, Toast nennt Groesse/Dateizahl/Namen', async () => {
        const overLimitByte = 300 * 1024 * 1024 + 1;
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'riesig.wav', size: overLimitByte, type: 'audio/wav', savedAt: 1 }
        ]);

        await downloadAudioExport();

        expect(createdAnchors).toHaveLength(0);
        expect(mockGetSoundBlob).not.toHaveBeenCalled();
        const errorToastCalls = mockShowToast.mock.calls.filter(call =>
            typeof call[0] === 'string' && call[0].includes('riesig.wav'));
        expect(errorToastCalls.length).toBeGreaterThan(0);
        expect(errorToastCalls[0][0]).toMatch(/MB/);
        expect(errorToastCalls[0][0]).toMatch(/1 Datei/);
    });

    // ------------------------------------------------------------
    // Plan 12-07, Checkpoint Task 4 — der Wartehinweis darf keine Arbeit
    // versprechen, die nie beginnt.
    //
    // Bei der menschlichen Sichtung fielen beide Toasts in derselben Sekunde:
    // "Audio-Export wird erstellt ..." lief VOR der Machbarkeitspruefung, die
    // unmittelbar danach in buildAudioExport() abbrach. Der Nutzer sah erst ein
    // Versprechen, dann einen Fehler.
    //
    // Bewusst VERHALTENSTESTS mit showToast-Spy, kein Quelltext-Grep: die
    // Toast-Zeile existiert weiterhin, nur ihre Position und Bedingung aendern
    // sich — ein Grep auf ihren Text wuerde vor UND nach dem Fix bestehen und
    // damit nichts beweisen (T-12-22).
    // ------------------------------------------------------------
    const WARTE_HINWEIS = 'Audio-Export wird erstellt';

    function toastIndex(teilText) {
        return mockShowToast.mock.calls.findIndex(
            call => typeof call[0] === 'string' && call[0].includes(teilText)
        );
    }

    test('zu grosse Bibliothek: der Wartehinweis erscheint NICHT — nur die Fehlermeldung', async () => {
        const overLimitByte = 300 * 1024 * 1024 + 1;
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'riesig.wav', size: overLimitByte, type: 'audio/wav', savedAt: 1 }
        ]);
        mockGetAllStats.mockResolvedValue([]);

        await downloadAudioExport();

        // Kein Versprechen auf Arbeit, die nie beginnt
        expect(toastIndex(WARTE_HINWEIS)).toBe(-1);
        // Die benannte Absage kommt weiterhin — und bleibt die einzige Meldung
        expect(toastIndex('riesig.wav')).toBeGreaterThan(-1);
        expect(createdAnchors).toHaveLength(0);
    });

    test('machbare Bibliothek: der Wartehinweis erscheint und steht VOR der Erfolgsmeldung', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 }
        ]);
        mockGetSoundBlob.mockResolvedValue(new Blob([bytesA()], { type: 'audio/mpeg' }));
        mockGetAllStats.mockResolvedValue([]);

        await downloadAudioExport();

        const hinweisIdx = toastIndex(WARTE_HINWEIS);
        const erfolgIdx = toastIndex('angeboten');
        expect(hinweisIdx).toBeGreaterThan(-1);
        expect(erfolgIdx).toBeGreaterThan(-1);
        // Reihenfolge: der Hinweis muss VOR der Erfolgsmeldung stehen, sonst
        // kuendigt er nichts an
        expect(hinweisIdx).toBeLessThan(erfolgIdx);
        expect(createdAnchors).toHaveLength(1);
    });

    test('Checkpoint-Fix (Weg B): startMigrationFlow() ruft downloadAudioExport() NICHT mehr automatisch auf', () => {
        // Manuell verifiziert (Chrome, file://, Instrumentierung von
        // HTMLAnchorElement.prototype.click): der ZWEITE automatische Download
        // aus derselben Nutzergeste wird von Chromes "Automatische Downloads"-
        // Berechtigung stillschweigend verworfen — a.click() wirft dabei nicht,
        // buildAudioExport()/der Anchor-Klick selbst sind unauffaellig. Ein
        // Einzel-Download ohne vorausgehenden Download kommt zuverlaessig an.
        // startMigrationFlow() darf downloadAudioExport() deshalb nicht mehr
        // selbst aufrufen — das geschieht jetzt ausschliesslich ueber einen
        // separaten Button-Klick (download-audio-export-Action).
        const wizardSrc = fs.readFileSync(
            path.join(__dirname, '../../systems/migration/migration-wizard.js'), 'utf-8'
        );
        const fnMatch = wizardSrc.match(/function startMigrationFlow\(\)\s*\{[\s\S]*?\n\}/);
        expect(fnMatch).not.toBeNull();
        const fnBody = fnMatch[0];

        const downloadFullIdx = fnBody.indexOf('downloadFn(');
        expect(downloadFullIdx).toBeGreaterThan(-1);
        expect(fnBody).not.toMatch(/downloadAudioExport\s*\(/);
    });

    test('Checkpoint-Fix (Weg B): die download-audio-export-Action ruft downloadAudioExport() aus einem echten Klick auf', () => {
        const wizardSrc = fs.readFileSync(
            path.join(__dirname, '../../systems/migration/migration-wizard.js'), 'utf-8'
        );
        const actionMatch = wizardSrc.match(
            /registerAction\('download-audio-export',\s*function\s*\([\s\S]*?\n\s{4}\}\);/
        );
        expect(actionMatch).not.toBeNull();
        expect(actionMatch[0]).toMatch(/window\.downloadAudioExport\s*\(\s*\)/);
    });

    test('Checkpoint-Fix (Weg B): showDivergenceBanner() laedt eine Audio-Vorschau nach, die den Button nur bei hasContent zeigt', () => {
        const wizardSrc = fs.readFileSync(
            path.join(__dirname, '../../systems/migration/migration-wizard.js'), 'utf-8'
        );
        expect(wizardSrc).toMatch(/_renderAudioDownloadButton/);
        expect(wizardSrc).toMatch(/getAudioExportSummary/);
        expect(wizardSrc).toMatch(/if \(!summary\.hasContent\) return;/);
    });
});

describe('getAudioExportSummary — Vorschau fuer den expliziten Download-Button (SAFE-01, Weg B)', () => {
    test('leere Bibliothek (weder Audio noch Wuerfelstatistik) liefert hasContent:false', async () => {
        expect(typeof getAudioExportSummary).toBe('function');

        mockListSoundBlobs.mockResolvedValue([]);
        mockGetAllStats.mockResolvedValue([]);

        const result = await getAudioExportSummary();

        expect(result.hasContent).toBe(false);
        expect(result.fileCount).toBe(0);
        expect(result.diceStatsCount).toBe(0);
    });

    test('gefuellte Bibliothek liefert hasContent:true mit fileCount/totalBytes/diceStatsCount, ohne einen Blob zu laden', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 2048, type: 'audio/mpeg', savedAt: 1 }
        ]);
        mockGetAllStats.mockResolvedValue([
            { notation: '1d20', result: 15, rolls: [15], timestamp: 1, sessionId: 's1', charId: 1 }
        ]);

        const result = await getAudioExportSummary();

        expect(result.hasContent).toBe(true);
        expect(result.fileCount).toBe(1);
        expect(result.totalBytes).toBe(2048);
        expect(result.diceStatsCount).toBe(1);
        expect(mockGetSoundBlob).not.toHaveBeenCalled();
    });

    test('nur Wuerfelstatistik ohne Audiodateien liefert ebenfalls hasContent:true', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        mockGetAllStats.mockResolvedValue([
            { notation: '2d6', result: 7, rolls: [3, 4], timestamp: 2, sessionId: 's1', charId: 1 }
        ]);

        const result = await getAudioExportSummary();

        expect(result.hasContent).toBe(true);
        expect(result.fileCount).toBe(0);
        expect(result.diceStatsCount).toBe(1);
    });
});

// ============================================================
// TASK 3 — checkAudioExportFeasible / Härtung des Import-Pfads
// Bleibt rot, bis Task 3 checkAudioExportFeasible/AUDIO_EXPORT_SAFE_RAW_BYTES/
// MAX_IMPORT_AUDIO_FILES/ALLOWED_BLOB_ID_RE implementiert.
// ============================================================

describe('checkAudioExportFeasible — Größenprüfung vor dem Kodieren (SAFE-01/T-12-04)', () => {
    test('summiert nur Metadaten und lädt keinen einzigen Blob', async () => {
        expect(typeof checkAudioExportFeasible).toBe('function'); // rot bis Task 3 implementiert

        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 1024, type: 'audio/mpeg', savedAt: 1 }
        ]);

        const result = await checkAudioExportFeasible();

        expect(mockGetSoundBlob).not.toHaveBeenCalled();
        expect(result.feasible).toBe(true);
        expect(result.totalBytes).toBe(1024);
        expect(result.fileCount).toBe(1);
    });

    test('Summe über 300 MiB → feasible:false mit totalBytes/fileCount/names', async () => {
        const overLimitByte = 300 * 1024 * 1024 + 1;
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'riesig.wav', size: overLimitByte, type: 'audio/wav', savedAt: 1 }
        ]);

        const result = await checkAudioExportFeasible();

        expect(result.feasible).toBe(false);
        expect(result.totalBytes).toBe(overLimitByte);
        expect(result.fileCount).toBe(1);
        expect(result.names).toContain('riesig.wav');
    });

    test('buildAudioExport() bricht bei Überschreitung ab, OHNE JSON.stringify/Kodieren zu versuchen', async () => {
        const overLimitByte = 300 * 1024 * 1024 + 1;
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'riesig.wav', size: overLimitByte, type: 'audio/wav', savedAt: 1 }
        ]);

        await expect(buildAudioExport()).rejects.toThrow();
        // Kein Blob wurde geladen — der Abbruch geschah rein anhand der Metadaten
        expect(mockGetSoundBlob).not.toHaveBeenCalled();
    });
});

describe('importAudioExport — Härtung (SAFE-01/T-12-01/T-12-02/T-12-03)', () => {
    test('Import-Datei mit mehr als 500 audioFiles wird abgelehnt, bevor irgendetwas geschrieben wird', async () => {
        const audioFiles = [];
        for (let i = 0; i < 501; i++) {
            audioFiles.push({ id: `audio_${i}_1`, name: `f${i}.mp3`, type: 'audio/mpeg', size: 1, data: 'AQ==' });
        }
        const exportObj = { _exportType: 'audio-export-v1', audioFiles, diceStats: [] };

        await expect(importAudioExport(exportObj)).rejects.toThrow();
        expect(mockSaveSoundBlob).not.toHaveBeenCalled();
    });

    test('audioFiles-Eintrag mit fremdformatiger id wird übersprungen und in skipped benannt, nicht geschrieben', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const exportObj = {
            _exportType: 'audio-export-v1',
            audioFiles: [
                { id: '../../evil', name: 'boese.mp3', type: 'audio/mpeg', size: 5, data: validB64 },
                { id: 'dnd-tracker-v4', name: 'auchboese.mp3', type: 'audio/mpeg', size: 5, data: validB64 },
                { id: 'audio_1_1', name: 'gut.mp3', type: 'audio/mpeg', size: 5, data: validB64 }
            ],
            diceStats: []
        };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(mockSaveSoundBlob).toHaveBeenCalledTimes(1);
        expect(mockSaveSoundBlob.mock.calls[0][0]).toBe('audio_1_1');
        expect(result.imported).toBe(1);
        expect(result.skipped).toHaveLength(2);
        const skippedIds = result.skipped.map(s => s.id);
        expect(skippedIds).toContain('../../evil');
        expect(skippedIds).toContain('dnd-tracker-v4');
    });

    test('kaputtes Base64 kostet nur den einen Eintrag — übrige Dateien werden importiert', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const exportObj = {
            _exportType: 'audio-export-v1',
            audioFiles: [
                { id: 'audio_1_1', name: 'kaputt.mp3', type: 'audio/mpeg', size: 5, data: '!!!nicht-base64!!!' },
                { id: 'audio_2_2', name: 'gut.mp3', type: 'audio/mpeg', size: 5, data: validB64 }
            ],
            diceStats: []
        };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(mockSaveSoundBlob).toHaveBeenCalledTimes(1);
        expect(mockSaveSoundBlob.mock.calls[0][0]).toBe('audio_2_2');
        expect(result.imported).toBe(1);
        expect(result.skipped).toHaveLength(1);
        expect(result.skipped[0].id).toBe('audio_1_1');
    });

    // ============================================================
    // Plan 12-15, Task 1 (SEC-07) — Einzelgrenze: kein Dekodieren vor der
    // Groessenpruefung. Test A + Test B (D-02-Konformitaet).
    // ============================================================
    test('SEC-07: Eintrag mit angegebener Groesse ueber der Einzelgrenze wird uebersprungen und benannt, base64ToBlob()/saveSoundBlob() laufen fuer ihn nicht', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const exportObj = {
            _exportType: 'audio-export-v1',
            audioFiles: [
                { id: 'audio_1_1', name: 'riesig.mp3', type: 'audio/mpeg', size: 150 * 1024 * 1024, data: validB64 }
            ],
            diceStats: []
        };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(result.imported).toBe(0);
        expect(mockSaveSoundBlob).not.toHaveBeenCalled();
        expect(result.skipped).toHaveLength(1);
        expect(result.skipped[0].id).toBe('audio_1_1');
        expect(result.skipped[0].name).toBe('riesig.mp3');
        expect(result.skipped[0].grund).toMatch(/[Gg]r[oö0]ß|[Gg]r[oö0]ss|MB|100/);
    });

    test('SEC-07/D-02: ein einzelner uebergrosser Eintrag kostet nur sich selbst — die uebrigen werden importiert, kein Wurf', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const exportObj = {
            _exportType: 'audio-export-v1',
            audioFiles: [
                { id: 'audio_1_1', name: 'gut1.mp3', type: 'audio/mpeg', size: 5, data: validB64 },
                { id: 'audio_2_2', name: 'riesig.mp3', type: 'audio/mpeg', size: 150 * 1024 * 1024, data: validB64 },
                { id: 'audio_3_3', name: 'gut2.mp3', type: 'audio/mpeg', size: 9, data: validB64 }
            ],
            diceStats: []
        };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        // Kein Wurf ist hier der eigentliche Nachweis (D-02): ein rejectetes Promise
        // liesse `await` unten scheitern, statt still zu bleiben.
        const result = await importAudioExport(exportObj);

        expect(result.imported).toBe(2);
        expect(mockSaveSoundBlob).toHaveBeenCalledTimes(2);
        const calledIds = mockSaveSoundBlob.mock.calls.map(call => call[0]);
        expect(calledIds).toContain('audio_1_1');
        expect(calledIds).toContain('audio_3_3');
        expect(calledIds).not.toContain('audio_2_2');
        expect(result.skipped).toHaveLength(1);
        expect(result.skipped[0].id).toBe('audio_2_2');
    });

    // ============================================================
    // Plan 12-15, Task 1 (SEC-07) — Test C: die Schaetzregel
    // ============================================================
    test('SEC-07: schaetzeAudioRohbytes() liefert das Maximum aus Groessenangabe und Base64-Schaetzung, wirft nie', () => {
        expect(typeof schaetzeAudioRohbytes).toBe('function');

        // Base64-Zeichenkette der Laenge 4000 => Schaetzung 4000 * 3 / 4 = 3000.
        const base64Len4000 = 'A'.repeat(4000);

        // Unterschlagene/zu kleine Groessenangabe hilft nicht — die Schaetzung aus der
        // Base64-Laenge gilt zusaetzlich, es zaehlt der groessere Wert.
        expect(schaetzeAudioRohbytes({ size: 1, data: base64Len4000 })).toBe(3000);

        // Groessenangabe ueber der Schaetzung gewinnt.
        expect(schaetzeAudioRohbytes({ size: 5000, data: base64Len4000 })).toBe(5000);

        // Fehlt `data` oder ist es keine Zeichenkette: Groessenangabe bzw. 0, kein Wurf.
        expect(schaetzeAudioRohbytes({ size: 5 })).toBe(5);
        expect(schaetzeAudioRohbytes({ size: 5, data: null })).toBe(5);
        expect(schaetzeAudioRohbytes({ size: 5, data: 12345 })).toBe(5);
        expect(schaetzeAudioRohbytes({})).toBe(0);
        expect(schaetzeAudioRohbytes(null)).toBe(0);
        expect(schaetzeAudioRohbytes(undefined)).toBe(0);
    });

    // ============================================================
    // Plan 12-15, Task 2 (SEC-07) — Gesamtbudget: auch die Summe vieler
    // mittelgrosser Eintraege unterhalb der Einzelgrenze ist begrenzt.
    // ============================================================
    test('SEC-07: Gesamtbudget — der vierte von vier 90-MiB-Eintraegen wird uebersprungen, obwohl jeder einzeln unter der Einzelgrenze liegt (Test D)', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const audioFiles = [];
        for (let i = 1; i <= 4; i++) {
            audioFiles.push({ id: `audio_${i}_${i}`, name: `f${i}.mp3`, type: 'audio/mpeg', size: 90 * 1024 * 1024, data: validB64 });
        }
        const exportObj = { _exportType: 'audio-export-v1', audioFiles, diceStats: [] };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(result.imported).toBe(3);
        expect(mockSaveSoundBlob).toHaveBeenCalledTimes(3);
        expect(result.skipped).toHaveLength(1);
        expect(result.skipped[0].id).toBe('audio_4_4');
        expect(result.skipped[0].grund).toMatch(/[Bb]udget/);
    });

    test('SEC-07: Gesamtbudget — bei fuenf 90-MiB-Eintraegen werden die letzten zwei einzeln benannt, kein stiller Abbruch (Test E)', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const audioFiles = [];
        for (let i = 1; i <= 5; i++) {
            audioFiles.push({ id: `audio_${i}_${i}`, name: `f${i}.mp3`, type: 'audio/mpeg', size: 90 * 1024 * 1024, data: validB64 });
        }
        const exportObj = { _exportType: 'audio-export-v1', audioFiles, diceStats: [] };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(result.imported).toBe(3);
        expect(mockSaveSoundBlob).toHaveBeenCalledTimes(3);
        expect(result.skipped).toHaveLength(2);
        const skippedIds = result.skipped.map(s => s.id);
        expect(skippedIds).toContain('audio_4_4');
        expect(skippedIds).toContain('audio_5_5');
    });

    test('SEC-07: ein Lauf innerhalb des Gesamtbudgets bleibt unveraendert (Test F)', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const exportObj = {
            _exportType: 'audio-export-v1',
            audioFiles: [
                { id: 'audio_1_1', name: 'a.mp3', type: 'audio/mpeg', size: 5, data: validB64 },
                { id: 'audio_2_2', name: 'b.mp3', type: 'audio/mpeg', size: 9, data: validB64 },
                { id: 'audio_3_3', name: 'c.mp3', type: 'audio/mpeg', size: 7, data: validB64 }
            ],
            diceStats: []
        };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(result.imported).toBe(3);
        expect(result.skipped).toHaveLength(0);
    });
});

// ============================================================
// Plan 12-15, Task 3 (SEC-07) — Abgleich gegen Drift + Reihenfolge-Invariante
// ============================================================
describe('importAudioExport — Abgleich und Reihenfolge-Invariante (SEC-07)', () => {
    test('SEC-07 Abgleich: Einzelgrenze stimmt mit MAX_AUDIO_BYTES_HARD aus soundboard-idb.js überein', () => {
        // Enge Auswertung an beiden Quellen: nur Ziffern, '*' und Leerzeichen
        // zulassen — kein ungeprueftes Auswerten fremden Textes, auch nicht im
        // Test. `const`-Deklarationen sind im vm-Kontext NICHT als Eigenschaften
        // des Kontextobjekts erreichbar (nur function-Deklarationen sind es) —
        // deshalb wird auch die Einzelgrenze per Regex aus dem Quelltext gezogen,
        // exakt wie bei MAX_AUDIO_BYTES_HARD.
        const auswerten = (dateiPfad, konstantenName) => {
            const src = fs.readFileSync(path.join(__dirname, dateiPfad), 'utf-8');
            const re = new RegExp(konstantenName + '\\s*=\\s*([0-9*\\s]+?);');
            const match = src.match(re);
            expect(match).not.toBeNull();
            const expr = match[1];
            expect(/^[0-9*\s]+$/.test(expr)).toBe(true);
            return expr.split('*').map(s => Number(s.trim())).reduce((a, b) => a * b, 1);
        };

        const einzelgrenze = auswerten('../../systems/migration/audio-export.js', 'AUDIO_IMPORT_MAX_ENTRY_BYTES');
        const quellwert = auswerten('../../features/soundboard/soundboard-idb.js', 'MAX_AUDIO_BYTES_HARD');

        if (quellwert !== einzelgrenze) {
            throw new Error(
                'Einzelgrenze driftet: AUDIO_IMPORT_MAX_ENTRY_BYTES (audio-export.js) = ' +
                einzelgrenze + ', MAX_AUDIO_BYTES_HARD (soundboard-idb.js) = ' +
                quellwert + ' — die gespiegelte Zahl in audio-export.js nachziehen, NICHT diesen Test lockern.'
            );
        }
        expect(quellwert).toBe(einzelgrenze);
    });

    test.each([
        ['fremdes ID-Format', () => Promise.resolve({
            audioFiles: [{ id: '../../evil', name: 'boese.mp3', type: 'audio/mpeg', size: 5, data: 'AQ==' }],
            rejectedId: '../../evil',
            rejectedName: 'boese.mp3'
        })],
        ['Einzelgrenze überschritten', async () => ({
            audioFiles: [{ id: 'audio_1_1', name: 'riesig.mp3', type: 'audio/mpeg', size: 150 * 1024 * 1024, data: await blobToBase64(new Blob([bytesA()])) }],
            rejectedId: 'audio_1_1',
            rejectedName: 'riesig.mp3'
        })],
        ['Gesamtbudget erschöpft', async () => {
            const validB64 = await blobToBase64(new Blob([bytesA()]));
            const audioFiles = [];
            for (let i = 1; i <= 4; i++) {
                audioFiles.push({ id: `audio_${i}_${i}`, name: `f${i}.mp3`, type: 'audio/mpeg', size: 90 * 1024 * 1024, data: validB64 });
            }
            return { audioFiles, rejectedId: 'audio_4_4', rejectedName: 'f4.mp3' };
        }]
    ])('SEC-07 Invariante: Ablehnungsgrund "%s" — benannt, nicht geschrieben, kein Wurf', async (_label, buildCase) => {
        const { audioFiles, rejectedId, rejectedName } = await buildCase();
        const exportObj = { _exportType: 'audio-export-v1', audioFiles, diceStats: [] };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        const rejected = result.skipped.find(s => s.id === rejectedId);
        expect(rejected).toBeDefined();
        expect(rejected.name).toBe(rejectedName);
        const calledIds = mockSaveSoundBlob.mock.calls.map(call => call[0]);
        expect(calledIds).not.toContain(rejectedId);
    });

    test('SEC-07 Invariante: ein Eintrag mit fremdem ID-Format UND Übergröße wird mit dem ID-Grund abgelehnt (billigste Prüfung zuerst)', async () => {
        const validB64 = await blobToBase64(new Blob([bytesA()]));
        const exportObj = {
            _exportType: 'audio-export-v1',
            audioFiles: [
                { id: '../../evil-und-riesig', name: 'boese-riesig.mp3', type: 'audio/mpeg', size: 150 * 1024 * 1024, data: validB64 }
            ],
            diceStats: []
        };
        mockSaveSoundBlob.mockResolvedValue(undefined);

        const result = await importAudioExport(exportObj);

        expect(result.skipped).toHaveLength(1);
        expect(result.skipped[0].id).toBe('../../evil-und-riesig');
        expect(result.skipped[0].grund).toBe('Unerwartetes ID-Format');
        expect(mockSaveSoundBlob).not.toHaveBeenCalled();
    });
});

// ============================================================
// PLAN 12-02, TASK 2 — findMissingSceneAudio() + Wizard-Quelltext-Belege
// Bleibt rot, bis Task 2 findMissingSceneAudio() in audio-export.js sowie den
// zweiten Dropzone-Bereich und die _exportType-Weiche in migration-wizard.js ergaenzt.
// ============================================================

describe('findMissingSceneAudio — benennt Szenen mit unaufloesbaren blobIds (SAFE-01)', () => {
    test('liefert je Szene mit Luecken { sceneName, blobIds }; vollstaendig aufloesbare Szenen fehlen', () => {
        expect(typeof findMissingSceneAudio).toBe('function'); // rot bis Task 2 implementiert

        const D = {
            soundboard: {
                scenes: [
                    { id: 's1', name: 'Taverne', tracks: [{ blobId: 'audio_1_1' }, { blobId: 'audio_2_2' }] },
                    { id: 's2', name: 'Kampf', tracks: [{ blobId: 'audio_9_9' }] },
                    { id: 's3', name: 'Stille', tracks: [] }
                ]
            }
        };
        const vorhandeneIds = ['audio_1_1', 'audio_2_2'];

        const result = findMissingSceneAudio(D, vorhandeneIds);

        expect(result).toEqual([{ sceneName: 'Kampf', blobIds: ['audio_9_9'] }]);
    });

    test('sind alle blobIds aufloesbar, ist das Ergebnis ein leeres Array', () => {
        const D = {
            soundboard: {
                scenes: [
                    { id: 's1', name: 'Taverne', tracks: [{ blobId: 'audio_1_1' }] }
                ]
            }
        };

        const result = findMissingSceneAudio(D, ['audio_1_1']);

        expect(result).toEqual([]);
    });

    test('fehlendes D.soundboard oder leere scenes liefert leeres Array, kein Crash', () => {
        expect(findMissingSceneAudio({}, [])).toEqual([]);
        expect(findMissingSceneAudio(null, [])).toEqual([]);
        expect(findMissingSceneAudio({ soundboard: { scenes: [] } }, ['x'])).toEqual([]);
    });
});

describe('migration-wizard.js — Quelltext-Belege fuer den zweiten Dropzone-Bereich (SAFE-01)', () => {
    let wizardSrc;
    beforeAll(() => {
        wizardSrc = fs.readFileSync(
            path.join(__dirname, '../../systems/migration/migration-wizard.js'), 'utf-8'
        );
    });

    test('Schritt 3 enthaelt die drei Audio-Dropzone-Element-ids', () => {
        expect(wizardSrc).toMatch(/migration-wizard-audio-dropzone/);
        expect(wizardSrc).toMatch(/migration-wizard-audio-input/);
        expect(wizardSrc).toMatch(/migration-wizard-audio-status/);
    });

    test('_processWizardFile() verzweigt auf audio-export-v1 VOR der full-v1-Pruefung', () => {
        const fnMatch = wizardSrc.match(/function _processWizardFile\([\s\S]*?\n\}/);
        expect(fnMatch).not.toBeNull();
        const audioBranchIdx = fnMatch[0].indexOf('audio-export-v1');
        const fullV1CheckIdx = fnMatch[0].indexOf("!== 'full-v1'");
        expect(audioBranchIdx).toBeGreaterThan(-1);
        expect(fullV1CheckIdx).toBeGreaterThan(-1);
        expect(audioBranchIdx).toBeLessThan(fullV1CheckIdx);
    });
});

// ============================================================
// NYQUIST R01 — Nachgezogene Pins fuer SAFE-01
// Diese Tests schliessen drei Luecken, die zuvor mutationsfest UEBERLEBTEN:
//  (1) MUT-1: pro Eintrag wurde nie geprueft, dass die Base64-Daten AUCH ZU
//      DIESEM Eintrag gehoeren (id/name/type/size stammen alle aus der Meta).
//  (2) MUT-2: der diceStats-"kein Cap"-Test nutzte nur 2 Datensaetze — jeder
//      Cap >= 2 blieb unsichtbar.
//  (3) Der INHALT der heruntergeladenen zweiten Datei wurde nie gelesen:
//      URL.createObjectURL ist gemockt, mock.calls[0][0] wurde nie inspiziert.
// ============================================================

function blobText(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

describe('buildAudioExport — Byte-Zuordnung je Eintrag (SAFE-01, R01)', () => {
    test('jeder audioFiles-Eintrag traegt die Bytes SEINES eigenen Blobs, nicht die der ersten Datei', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 },
            { id: 'audio_2_2', name: 'b.ogg', size: 9, type: 'audio/ogg', savedAt: 222 }
        ]);
        mockGetSoundBlob.mockImplementation(id => {
            if (id === 'audio_1_1') return Promise.resolve(new Blob([bytesA()], { type: 'audio/mpeg' }));
            if (id === 'audio_2_2') return Promise.resolve(new Blob([bytesB()], { type: 'audio/ogg' }));
            return Promise.resolve(null);
        });
        mockGetAllStats.mockResolvedValue([]);

        const result = await buildAudioExport();
        expect(result.audioFiles).toHaveLength(2);

        const erster = result.audioFiles.find(f => f.id === 'audio_1_1');
        const zweiter = result.audioFiles.find(f => f.id === 'audio_2_2');

        const bytesErster = await blobBytes(base64ToBlob(erster.data, erster.type));
        const bytesZweiter = await blobBytes(base64ToBlob(zweiter.data, zweiter.type));

        expect(bytesErster).toEqual(Array.from(bytesA()));
        expect(bytesZweiter).toEqual(Array.from(bytesB()));
        expect(zweiter.data).not.toBe(erster.data);
    });

    test('getSoundBlob wird genau einmal je Meta-id aufgerufen — in der Reihenfolge der Metadaten', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 },
            { id: 'audio_2_2', name: 'b.ogg', size: 9, type: 'audio/ogg', savedAt: 222 }
        ]);
        mockGetSoundBlob.mockImplementation(id =>
            Promise.resolve(new Blob([id === 'audio_1_1' ? bytesA() : bytesB()], { type: 'audio/mpeg' }))
        );
        mockGetAllStats.mockResolvedValue([]);

        await buildAudioExport();

        expect(mockGetSoundBlob.mock.calls.map(c => c[0])).toEqual(['audio_1_1', 'audio_2_2']);
    });
});

describe('buildAudioExport — diceStats ohne jeden Cap (SAFE-01, R01)', () => {
    test('1500 Wuerfel-Datensaetze werden VOLLSTAENDIG exportiert (kein 1000er-Cap)', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        const stats = [];
        for (let i = 0; i < 1500; i++) {
            stats.push({ notation: '1d20', result: (i % 20) + 1, rolls: [i], timestamp: i, sessionId: 's1', charId: 1 });
        }
        mockGetAllStats.mockResolvedValue(stats);

        const result = await buildAudioExport();

        expect(result.diceStats).toHaveLength(1500);
        expect(result.diceStats[0]).toEqual(stats[0]);
        expect(result.diceStats[999]).toEqual(stats[999]);
        expect(result.diceStats[1499]).toEqual(stats[1499]);
    });
});

describe('downloadAudioExport — INHALT der zweiten Datei (SAFE-01, R01)', () => {
    async function ladeHeruntergeladenesObjekt() {
        expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
        const blob = mockCreateObjectURL.mock.calls[0][0];
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('application/json');
        return JSON.parse(await blobText(blob));
    }

    test('die an URL.createObjectURL uebergebene Datei enthaelt beide Audiodateien mit ihren eigenen Bytes', async () => {
        mockListSoundBlobs.mockResolvedValue([
            { id: 'audio_1_1', name: 'a.mp3', size: 5, type: 'audio/mpeg', savedAt: 111 },
            { id: 'audio_2_2', name: 'b.ogg', size: 9, type: 'audio/ogg', savedAt: 222 }
        ]);
        mockGetSoundBlob.mockImplementation(id => {
            if (id === 'audio_1_1') return Promise.resolve(new Blob([bytesA()], { type: 'audio/mpeg' }));
            return Promise.resolve(new Blob([bytesB()], { type: 'audio/ogg' }));
        });
        mockGetAllStats.mockResolvedValue([]);

        await downloadAudioExport();
        const datei = await ladeHeruntergeladenesObjekt();

        expect(datei._exportType).toBe('audio-export-v1');
        expect(datei.audioFiles).toHaveLength(2);

        const a = datei.audioFiles.find(f => f.id === 'audio_1_1');
        const b = datei.audioFiles.find(f => f.id === 'audio_2_2');
        expect(a.name).toBe('a.mp3');
        expect(b.name).toBe('b.ogg');
        expect(await blobBytes(base64ToBlob(a.data, a.type))).toEqual(Array.from(bytesA()));
        expect(await blobBytes(base64ToBlob(b.data, b.type))).toEqual(Array.from(bytesB()));
    });

    test('die heruntergeladene Datei enthaelt die Wuerfelstatistik vollstaendig (Serialisierung verliert diceStats nicht)', async () => {
        mockListSoundBlobs.mockResolvedValue([]);
        const stats = [];
        for (let i = 0; i < 1200; i++) {
            stats.push({ notation: '2d6', result: 7, rolls: [3, 4], timestamp: i, sessionId: 's1', charId: 1 });
        }
        mockGetAllStats.mockResolvedValue(stats);

        await downloadAudioExport();
        const datei = await ladeHeruntergeladenesObjekt();

        expect(datei.diceStats).toHaveLength(1200);
        expect(datei.diceStats[1199]).toEqual(stats[1199]);
    });
});
