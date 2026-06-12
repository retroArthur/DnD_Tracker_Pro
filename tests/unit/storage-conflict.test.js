/**
 * Storage Conflict Tests — vm-basierte Regressionstests für resolveStorageConflict (CR-01)
 *
 * KERNUNTERSCHIED zu stability.test.js (WR-06):
 * Diese Tests laden den ECHTEN Quelltext von quick-roll.js via vm.runInContext und rufen
 * die PRODUKTIONS-Funktion direkt auf — keine Inline-Simulation, kein Inline-Replikat.
 * Damit wird sichergestellt, dass Regressions gegen den echten Konfliktpfad erkannt werden.
 *
 * Schließt: CR-01 (Endlosrekursion in showStorageConflictDialog) aus 01-REVIEW.md
 * Anforderung: STAB-05 / SC2 — kein stiller Datenverlust im Stale-Shadow-Pfad
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// SETUP: resolveStorageConflict aus quick-roll.js laden (vm-Muster aus migration.test.js)
// ============================================================

let resolveStorageConflict;
let quickRollContext; // für Test D (window.showStorageConflictDialogUI setzen)
let quickRollSourceCode; // für Test E (Quelltext-Audit)

beforeAll(() => {
    // Kontext-Objekt für vm: enthält alle Globals, die quick-roll.js erwartet.
    // showStorageConflictDialogUI bewusst NICHT gesetzt (Fallback-Pfad für Tests A/B/C).
    const context = {
        window: {
            APP_CONFIG: global.APP_CONFIG,
            ErrorHandler: { log: jest.fn() },
            // showStorageConflictDialogUI NOT set here — Tests A/B/C prüfen den Fallback-Pfad
            loadFromIndexedDBFallbackRaw: jest.fn(),
            loadFromIndexedDBFallback: jest.fn(),
            D: {},
            STORAGE_KEY: 'test-key'
        },
        APP_CONFIG: global.APP_CONFIG,
        StorageAPI: { get: jest.fn(() => null), set: jest.fn(), remove: jest.fn() },
        showToast: jest.fn(),
        compareVersions: () => 0,
        migrateData: (d) => d,
        console
    };
    vm.createContext(context);

    const filePath = path.join(__dirname, '../../systems/spellslots/quick-roll.js');
    quickRollSourceCode = fs.readFileSync(filePath, 'utf8');
    vm.runInContext(quickRollSourceCode, context);

    // Funktion nach runInContext aus context extrahieren.
    // Ziel-Name nach dem Fix (Task 2): resolveStorageConflict
    // Vor dem Fix ist dieser Name undefined → Tests A–D sind rot (RED-Zustand erwartet).
    resolveStorageConflict = context.resolveStorageConflict;
    quickRollContext = context;
});

describe('CR-01 Regressionstests — resolveStorageConflict (vm-basiert, echter Quellcode)', () => {

    // Test A (Kern-Regression): Kein RangeError bei unterschiedlichen Daten
    // Ziel: Beweist CR-01-Bug (Endlosrekursion) und verifiziert den Fix.
    // RED-Zustand: context.resolveStorageConflict ist undefined (alter Name: showStorageConflictDialog)
    //             → toThrow() schlägt auf "not.toThrow" fehl, da TypeError für undefined-Aufruf
    test('Test A — ruft Konflikt-Funktion mit unterschiedlichen Daten auf, wirft keinen RangeError', () => {
        expect(resolveStorageConflict).toBeDefined();

        const onUseLS = jest.fn();
        const onUseIDB = jest.fn();

        // Diese Assertion MUSS initial fehlschlagen (RED):
        // - Ist-Code: RangeError (Endlosrekursion) da window.showStorageConflictDialog === Funktion selbst
        // - Nach Fix: läuft durch ohne Exception
        expect(() => resolveStorageConflict('ALT', 'NEU', onUseLS, onUseIDB)).not.toThrow();
    });

    // Test B (IDB-Fallback ohne UI-Hook): Bei unterschiedlichen Daten und ohne showStorageConflictDialogUI
    // wird onUseIDB genau einmal aufgerufen, onUseLS nicht.
    test('Test B — bei abweichendem Inhalt ohne UI-Hook wird onUseIDB einmal aufgerufen, onUseLS nie', () => {
        expect(resolveStorageConflict).toBeDefined();

        const onUseLS = jest.fn();
        const onUseIDB = jest.fn();

        resolveStorageConflict('ALT', 'NEU', onUseLS, onUseIDB);

        expect(onUseIDB).toHaveBeenCalledTimes(1);
        expect(onUseLS).not.toHaveBeenCalled();
    });

    // Test C (Identisch-Fall / D-07): Bei lsData === idbData wird onUseLS aufgerufen, onUseIDB nicht.
    // Kein UI-Hook wird ausgelöst.
    test('Test C — bei identischem Inhalt wird onUseLS aufgerufen, onUseIDB nie, kein UI-Hook', () => {
        expect(resolveStorageConflict).toBeDefined();

        const onUseLS = jest.fn();
        const onUseIDB = jest.fn();
        const uiHookSpy = jest.fn();
        // Sicherstellen, dass kein UI-Hook gesetzt ist
        quickRollContext.window.showStorageConflictDialogUI = undefined;

        resolveStorageConflict('GLEICH', 'GLEICH', onUseLS, onUseIDB);

        expect(onUseLS).toHaveBeenCalledTimes(1);
        expect(onUseIDB).not.toHaveBeenCalled();
        expect(uiHookSpy).not.toHaveBeenCalled();
    });

    // Test D (optionaler externer UI-Hook): Wenn window.showStorageConflictDialogUI gesetzt,
    // wird er bei unterschiedlichen Daten genau einmal mit (lsData, idbData, onUseLS, onUseIDB) aufgerufen.
    // Die internen Fallback-Callbacks werden NICHT direkt aufgerufen (der Hook übernimmt die Auswahl).
    test('Test D — mit gesetztem UI-Hook wird Hook einmal aufgerufen, keine direkten Callbacks', () => {
        expect(resolveStorageConflict).toBeDefined();

        const onUseLS = jest.fn();
        const onUseIDB = jest.fn();
        const dialogUISpy = jest.fn();

        // UI-Hook in window des vm-Kontexts setzen
        quickRollContext.window.showStorageConflictDialogUI = dialogUISpy;

        try {
            resolveStorageConflict('ALT', 'NEU', onUseLS, onUseIDB);

            expect(dialogUISpy).toHaveBeenCalledTimes(1);
            expect(dialogUISpy).toHaveBeenCalledWith('ALT', 'NEU', onUseLS, onUseIDB);
            expect(onUseIDB).not.toHaveBeenCalled();
            expect(onUseLS).not.toHaveBeenCalled();
        } finally {
            // UI-Hook zurücksetzen, damit andere Tests nicht beeinflusst werden
            quickRollContext.window.showStorageConflictDialogUI = undefined;
        }
    });

    // Test E (Selbstreferenz-Guard, Quelltext-Audit): Prüft per Regex, dass die Konflikt-Funktion
    // KEINE Selbstreferenz über window.<eigener Name> enthält.
    // Verhindert Wiedereinführung von CR-01.
    test('Test E — Quelltext-Audit: keine Selbstreferenz über window in der Konflikt-Funktion', () => {
        // Keine window.resolveStorageConflict-Referenz erlaubt (Selbstrekursion)
        expect(quickRollSourceCode).not.toMatch(/window\.resolveStorageConflict\s*\(/);

        // Keine window.showStorageConflictDialog-Referenz erlaubt (alte Selbstrekursion)
        expect(quickRollSourceCode).not.toMatch(/window\.showStorageConflictDialog\s*\(/);
    });

});
