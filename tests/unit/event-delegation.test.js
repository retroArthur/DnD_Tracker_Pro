/**
 * Whitelist-Wächter der generischen `call`-Aktion — SEC-03
 *
 * `ui/actions/ui-actions.js` ruft heute jeden Funktionsnamen auf, der als
 * `data-value` an einem `data-action="call"`-Element steht. Dieser Test lädt
 * das echte Quellmodul per `vm` in eine Sandbox (Muster:
 * tests/unit/file-backup-idb.test.js) und beweist, dass `UIActions.call`
 * ausschließlich Ziele aus `CALL_ACTION_WHITELIST` aufruft.
 *
 * `EventDelegation` wird gestubbt: `registerAction(name, handler)` sammelt
 * die Handler in einer Map, damit der Test den `call`-Handler direkt
 * aufrufen kann, ohne echtes DOM/Event-System.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../ui/actions/ui-actions.js');

/**
 * Lädt ui/actions/ui-actions.js in eine frische Sandbox.
 * @param {Object} opts
 * @param {Set<string>} [opts.whitelist] window.CALL_ACTION_WHITELIST in der Sandbox
 * @param {boolean} [opts.debugMode] window.APP_CONFIG.DEBUG_MODE in der Sandbox
 * @param {Function} [opts.errorHandlerLog] jest.fn() für window.ErrorHandler.log
 */
function loadUIActions({ whitelist, debugMode = false, errorHandlerLog } = {}) {
    const handlers = new Map();
    const windowStub = {
        APP_CONFIG: { DEBUG_MODE: debugMode },
        ErrorHandler: { log: errorHandlerLog || jest.fn() },
        CALL_ACTION_WHITELIST: whitelist
    };
    const context = {
        window: windowStub,
        EventDelegation: {
            registerAction: (name, handler) => handlers.set(name, handler)
        },
        console
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
    return { context, handlers, windowStub };
}

describe('UIActions.call Whitelist-Wächter (SEC-03)', () => {
    test('ruft ein gelistetes Ziel mit ctx.id auf', () => {
        const flipCoin = jest.fn();
        const { handlers, windowStub } = loadUIActions({ whitelist: new Set(['flipCoin']) });
        windowStub.flipCoin = flipCoin;

        handlers.get('call')({ value: 'flipCoin', id: 42 });

        expect(flipCoin).toHaveBeenCalledWith(42);
    });

    test('ruft ein nicht gelistetes Ziel nicht auf', () => {
        const nichtGelistet = jest.fn();
        const { handlers, windowStub } = loadUIActions({ whitelist: new Set(['flipCoin']) });
        windowStub.nichtGelistet = nichtGelistet;

        handlers.get('call')({ value: 'nichtGelistet', id: 1 });

        expect(nichtGelistet).not.toHaveBeenCalled();
    });

    test('bricht ohne Wurf ab, wenn ein gelistetes Ziel keine Funktion ist', () => {
        const { handlers, windowStub } = loadUIActions({ whitelist: new Set(['nichtAufrufbar']) });
        windowStub.nichtAufrufbar = 'kein-callable';

        expect(() => handlers.get('call')({ value: 'nichtAufrufbar', id: 1 })).not.toThrow();
    });
});
