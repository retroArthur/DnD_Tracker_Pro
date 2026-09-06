/**
 * SystemActions['refresh-dice-stats'] — Aktualisieren-Knopf im Wuerfelstatistik-Tab
 * (User-Wunsch aus phase-13-UAT, kein PLAN.md/SUMMARY.md).
 *
 * statsIdbPut() (features/dice-stats/dice-stats-idb.js) schreibt fire-and-forget direkt in
 * die IndexedDB (D-04) — ohne ueber save()/D zu gehen — und loest daher NIE einen
 * registerPostSaveHook() aus. Ohne manuellen Refresh sieht der Nutzer neu erwuerfelte Wuerfe im
 * bereits offenen Statistiken-Tab erst nach einem Tab-Wechsel. Auto-Refresh aus dem
 * Schreibpfad selbst wurde vom Nutzer bewusst abgelehnt (Decision D-04: das Histogramm soll
 * nicht "unter der Hand" umspringen, waehrend er es liest) — deshalb ein expliziter Knopf statt
 * eines Hooks/Listeners/Timers am Schreibpfad.
 *
 * Dieser Test laedt `ui/actions/system-actions.js` per `vm` in eine Sandbox (Muster:
 * tests/unit/system-actions-insert-link.test.js), stubbt aber nur `window.renderDiceStats`
 * und `window.showToast` — die Aktion selbst braucht kein echtes DOM.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../ui/actions/system-actions.js');

/**
 * Laedt ui/actions/system-actions.js in eine isolierte vm-Sandbox.
 * @param {Object} opts
 * @param {Function} [opts.renderDiceStats] jest.fn() fuer `window.renderDiceStats`
 * @param {Function} [opts.showToast] jest.fn() fuer `window.showToast`
 */
function loadSystemActions({ renderDiceStats, showToast } = {}) {
    const windowStub = {
        renderDiceStats: renderDiceStats || jest.fn(),
        showToast: showToast || jest.fn()
    };
    const context = { window: windowStub };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
    const SystemActions = vm.runInContext('SystemActions', context);
    return { context, SystemActions, windowStub };
}

describe("SystemActions['refresh-dice-stats'] (User-Wunsch phase-13-UAT)", () => {
    test('rendert die Statistik neu (nicht-leerer Store)', () => {
        const renderDiceStats = jest.fn();
        const showToast = jest.fn();
        const { SystemActions } = loadSystemActions({ renderDiceStats, showToast });

        SystemActions['refresh-dice-stats']();

        expect(renderDiceStats).toHaveBeenCalledTimes(1);
        expect(showToast).toHaveBeenCalledWith('Statistik aktualisiert');
    });

    test('rendert die Statistik neu, auch wenn der Store leer ist', () => {
        // renderDiceStats() selbst weiss nichts vom Store-Inhalt — die Aktion ruft sie
        // bedingungslos auf. Das ist genau der Fall aus dem UAT: leer gerenderter Tab
        // bleibt offen, Nutzer wuerfelt, Knopf muss trotzdem wirken.
        const renderDiceStats = jest.fn();
        const showToast = jest.fn();
        const { SystemActions } = loadSystemActions({ renderDiceStats, showToast });

        SystemActions['refresh-dice-stats']();

        expect(renderDiceStats).toHaveBeenCalledTimes(1);
        expect(showToast).toHaveBeenCalledTimes(1);
    });

    test('ist sicher bei wiederholtem Druecken (mehrfacher Aufruf)', () => {
        const renderDiceStats = jest.fn();
        const showToast = jest.fn();
        const { SystemActions } = loadSystemActions({ renderDiceStats, showToast });

        SystemActions['refresh-dice-stats']();
        SystemActions['refresh-dice-stats']();
        SystemActions['refresh-dice-stats']();

        expect(renderDiceStats).toHaveBeenCalledTimes(3);
        expect(showToast).toHaveBeenCalledTimes(3);
    });

    test('wirft nicht, wenn renderDiceStats/showToast (noch) nicht global verfuegbar sind', () => {
        // Defensive typeof-Guards in der Aktion (Muster: 'clear-dice-stats') — Aufruf vor
        // vollstaendigem Modul-Load darf nicht crashen.
        const context = { window: {} };
        vm.createContext(context);
        vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
        const SystemActions = vm.runInContext('SystemActions', context);

        expect(() => SystemActions['refresh-dice-stats']()).not.toThrow();
    });
});
