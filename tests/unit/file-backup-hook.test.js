/**
 * Regression — Datei-Backup-Hook (TECH-03, UAT Phase 2 Test 5).
 *
 * Bug: initFileBackup() patchte window.save — aber bare save()-Aufrufe (Entity-CRUD)
 * binden an die globale const-Deklaration und umgehen jeden window.save-Wrapper.
 * Folge: Nach "Charakter anlegen" wurde NIE eine Backup-Datei geschrieben.
 *
 * Fix: persistence.js ruft an jedem Persist-Erfolgspunkt explizit
 * window.onFileBackupAfterSave() auf (_notifyFileBackup) — im Funktions-Body,
 * nicht per Wrapper. Diese Tests laden die ECHTE persistence.js und pruefen,
 * dass der Hook aus save()/saveImmediate() heraus feuert.
 */

const fs = require('fs');
const path = require('path');

// Stubs fuer die Modul-Umgebung (jsdom liefert window/document/Blob)
window.STORAGE_KEY = 'test-backup-key';
window.D = { characters: [{ id: 1, name: 'Testheld' }] };
window.updateSaveIndicator = jest.fn();
window.broadcastSave = jest.fn();
global.StorageAPI = {
    set: jest.fn(() => ({ success: true })),
    remove: jest.fn(),
    get: jest.fn(() => null),
    getJSON: jest.fn(() => ({}))
};
global.showToast = jest.fn();
window.APP_CONFIG = { DEBUG_MODE: false };
global.ErrorHandler = { log: jest.fn(), showError: jest.fn() };

// Echte persistence.js laden (window.save/saveImmediate werden exportiert)
eval(fs.readFileSync( // eslint-disable-line no-eval
    path.resolve(__dirname, '../../systems/spellslots/persistence.js'), 'utf8'
));

describe('Datei-Backup-Hook feuert bei jedem Save (TECH-03)', function () {
    beforeEach(function () {
        window.onFileBackupAfterSave = jest.fn();
    });

    test('saveImmediate() ruft onFileBackupAfterSave nach dem Write', async function () {
        await window.saveImmediate();
        expect(global.StorageAPI.set).toHaveBeenCalled();
        expect(window.onFileBackupAfterSave).toHaveBeenCalledTimes(1);
    });

    test('save() (debounced) ruft onFileBackupAfterSave nach dem Write', async function () {
        window.save();
        // Hook darf NICHT vor dem eigentlichen Write feuern (liest sonst stale Daten)
        expect(window.onFileBackupAfterSave).not.toHaveBeenCalled();
        await new Promise(r => setTimeout(r, 400)); // Debounce 300ms abwarten
        expect(window.onFileBackupAfterSave).toHaveBeenCalledTimes(1);
    });

    test('fehlender Hook (kein Backup-Modul geladen) wirft nicht', async function () {
        delete window.onFileBackupAfterSave;
        await expect(window.saveImmediate()).resolves.toBeUndefined();
    });
});
