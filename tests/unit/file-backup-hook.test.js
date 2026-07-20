/**
 * Regression — Generische Post-Save-Hooks (TECH-03 Datei-Backup + DM-Screen-Live-Sync).
 *
 * Bug (UAT Phase 2): window.save-Monkey-Patches (Datei-Backup, DM-Screen) feuerten NIE
 * bei bare save()-Aufrufen — `const save` in persistence.js erzeugt eine globale
 * lexikalische Bindung, die die window.save-Property dauerhaft überdeckt. Fast alle
 * Entity-CRUDs rufen bare save() auf → keine Backup-Dateien, kein Live-Sync.
 *
 * Fix: registerPostSaveHook(fn) + _notifyPostSaveHooks() IM Funktions-Body von
 * save()/saveImmediate() an allen Persist-Erfolgspunkten. Diese Tests laden die
 * ECHTE persistence.js und prüfen den Hook-Vertrag.
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

// Echte persistence.js laden (window.save/saveImmediate/registerPostSaveHook exportiert)
eval(fs.readFileSync( // eslint-disable-line no-eval
    path.resolve(__dirname, '../../systems/spellslots/persistence.js'), 'utf8'
));

describe('Post-Save-Hooks feuern bei jedem Save (TECH-03 / Live-Sync)', function () {
    let hook;
    beforeEach(function () {
        window._postSaveHooks = [];
        hook = jest.fn();
        window.registerPostSaveHook(hook);
    });

    test('saveImmediate() ruft registrierte Hooks nach dem Write', async function () {
        await window.saveImmediate();
        expect(global.StorageAPI.set).toHaveBeenCalled();
        expect(hook).toHaveBeenCalledTimes(1);
    });

    test('save() (debounced) ruft Hooks erst NACH dem Write', async function () {
        window.save();
        // Hook darf NICHT vor dem eigentlichen Write feuern (liest sonst stale Daten)
        expect(hook).not.toHaveBeenCalled();
        await new Promise(r => setTimeout(r, 400)); // Debounce 300ms abwarten
        expect(hook).toHaveBeenCalledTimes(1);
    });

    test('werfender Hook bricht weder das Speichern noch andere Hooks', async function () {
        const bad = jest.fn(() => { throw new Error('kaputt'); });
        const after = jest.fn();
        window._postSaveHooks = [];
        window.registerPostSaveHook(bad);
        window.registerPostSaveHook(after);
        await expect(window.saveImmediate()).resolves.toBeUndefined();
        expect(bad).toHaveBeenCalled();
        expect(after).toHaveBeenCalledTimes(1); // trotz Fehler im ersten Hook
    });

    test('registerPostSaveHook dedupliziert und ignoriert Nicht-Funktionen', async function () {
        window.registerPostSaveHook(hook); // Doppel-Registrierung
        window.registerPostSaveHook(null);
        window.registerPostSaveHook('kein-fn');
        await window.saveImmediate();
        expect(hook).toHaveBeenCalledTimes(1); // nicht doppelt
    });

    test('keine registrierten Hooks → Speichern wirft nicht', async function () {
        delete window._postSaveHooks;
        await expect(window.saveImmediate()).resolves.toBeUndefined();
    });
});
