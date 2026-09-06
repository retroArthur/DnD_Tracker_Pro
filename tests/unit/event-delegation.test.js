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
const CONSTANTS_PATH = path.join(__dirname, '../../core/constants.js');
const REPO_ROOT = path.join(__dirname, '../..');
const SOURCE_DIRS = ['core', 'features', 'systems', 'ui', 'utils', 'render', 'assets'];

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

/**
 * Lädt die echte CALL_ACTION_WHITELIST aus core/constants.js (kein Nachbau der Liste
 * im Test — Abgleich gegen den echten Produktionsstand).
 */
function loadRealWhitelist() {
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(CONSTANTS_PATH, 'utf8'), context);
    return context.window.CALL_ACTION_WHITELIST;
}

/**
 * Extrahiert alle `data-value`-Werte, die auf derselben Zeile wie ein
 * `data-action`-Attribut mit dem Wert 'call' in *.js/*.html unter den produktiven
 * Quellordnern stehen. Frisch zur Testlaufzeit abgeleitet statt fest verdrahtet
 * (13-RESEARCH.md, Pattern 2) — dieser Testfall ist der Wächter gegen ein
 * vergessenes Ziel.
 */
function findCallTargetsInSourceTree() {
    const targets = new Set();
    const reverseOrderHits = [];
    const missingDataValueHits = [];
    const dynamicValueHits = [];

    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (e) {
            return;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.isFile() && /\.(js|html)$/.test(entry.name)) {
                const content = fs.readFileSync(full, 'utf8');
                content.split('\n').forEach((line, idx) => {
                    const hasCallAction = /data-action="call"/.test(line);
                    const reverseOrder = /data-value="[^"]+"\s+data-action="call"/.test(line);
                    if (!hasCallAction && !reverseOrder) return;

                    const valueMatch = line.match(/data-value="([^"]*)"/);
                    if (!valueMatch) {
                        missingDataValueHits.push(`${full}:${idx + 1}`);
                        return;
                    }
                    if (/\$\{/.test(valueMatch[1])) {
                        dynamicValueHits.push(`${full}:${idx + 1}`);
                        return;
                    }
                    targets.add(valueMatch[1]);
                    if (reverseOrder && !hasCallAction) {
                        reverseOrderHits.push(`${full}:${idx + 1}`);
                    }
                });
            }
        }
    }

    SOURCE_DIRS.forEach(d => walk(path.join(REPO_ROOT, d)));

    return { targets, reverseOrderHits, missingDataValueHits, dynamicValueHits };
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

    test('CALL_ACTION_WHITELIST deckt jedes im Quellbaum gefundene call-Ziel ab', () => {
        const whitelist = loadRealWhitelist();
        const { targets, reverseOrderHits, missingDataValueHits, dynamicValueHits } =
            findCallTargetsInSourceTree();

        // Die drei Nullaussagen aus 13-RESEARCH.md (Pattern 2) müssen weiterhin gelten,
        // sonst wäre die Ableitung nicht mehr geschlossen.
        expect(reverseOrderHits).toEqual([]);
        expect(missingDataValueHits).toEqual([]);
        expect(dynamicValueHits).toEqual([]);

        const missingFromWhitelist = [...targets].filter(name => !whitelist.has(name));
        expect(missingFromWhitelist).toEqual([]);
    });

    test('protokolliert ein nicht gelistetes Ziel bei aktivem DEBUG_MODE genau einmal über ErrorHandler', () => {
        const errorHandlerLog = jest.fn();
        const { handlers } = loadUIActions({
            whitelist: new Set(['flipCoin']),
            debugMode: true,
            errorHandlerLog
        });

        handlers.get('call')({ value: 'nichtGelistet', id: 1 });

        expect(errorHandlerLog).toHaveBeenCalledTimes(1);
        expect(errorHandlerLog.mock.calls[0][0]).toBe('EventDelegation');
        expect(errorHandlerLog.mock.calls[0][2]).toBe('nichtGelistet');
        const notInWhitelistMessage = errorHandlerLog.mock.calls[0][1].message;

        errorHandlerLog.mockClear();
        const { handlers: handlers2, windowStub } = loadUIActions({
            whitelist: new Set(['nichtAufrufbar']),
            debugMode: true,
            errorHandlerLog
        });
        windowStub.nichtAufrufbar = 'kein-callable';
        handlers2.get('call')({ value: 'nichtAufrufbar', id: 1 });
        const notAFunctionMessage = errorHandlerLog.mock.calls[0][1].message;

        // Zwei unterscheidbare Meldungstexte fuer die zwei blockierten Faelle (Task 3)
        expect(notInWhitelistMessage).not.toBe(notAFunctionMessage);
    });

    test('protokolliert auch bei DEBUG_MODE aus (nicht gelistetes Ziel) — WR-02b, 13-REVIEW.md', () => {
        // Ein geblockter Call ist sicherheitsrelevant (SEC-03) und muss auch im
        // Produktions-Build (DEBUG_MODE=false) sichtbar bleiben.
        const errorHandlerLog = jest.fn();
        const { handlers } = loadUIActions({
            whitelist: new Set(['flipCoin']),
            debugMode: false,
            errorHandlerLog
        });

        handlers.get('call')({ value: 'nichtGelistet', id: 1 });

        expect(errorHandlerLog).toHaveBeenCalledTimes(1);
        expect(errorHandlerLog.mock.calls[0][0]).toBe('EventDelegation');
        expect(errorHandlerLog.mock.calls[0][2]).toBe('nichtGelistet');
    });

    test('protokolliert ein gelistetes, aber nicht aufrufbares Ziel bei aktivem DEBUG_MODE genau einmal über ErrorHandler', () => {
        const errorHandlerLog = jest.fn();
        const { handlers, windowStub } = loadUIActions({
            whitelist: new Set(['nichtAufrufbar']),
            debugMode: true,
            errorHandlerLog
        });
        windowStub.nichtAufrufbar = 'kein-callable';

        handlers.get('call')({ value: 'nichtAufrufbar', id: 1 });

        expect(errorHandlerLog).toHaveBeenCalledTimes(1);
        expect(errorHandlerLog.mock.calls[0][0]).toBe('EventDelegation');
        expect(errorHandlerLog.mock.calls[0][2]).toBe('nichtAufrufbar');
    });

    test('protokolliert auch bei DEBUG_MODE aus (gelistetes, nicht aufrufbares Ziel) — WR-02b, 13-REVIEW.md', () => {
        const errorHandlerLog = jest.fn();
        const { handlers, windowStub } = loadUIActions({
            whitelist: new Set(['nichtAufrufbar']),
            debugMode: false,
            errorHandlerLog
        });
        windowStub.nichtAufrufbar = 'kein-callable';

        handlers.get('call')({ value: 'nichtAufrufbar', id: 1 });

        expect(errorHandlerLog).toHaveBeenCalledTimes(1);
        expect(errorHandlerLog.mock.calls[0][0]).toBe('EventDelegation');
        expect(errorHandlerLog.mock.calls[0][2]).toBe('nichtAufrufbar');
    });

    test('nutzt console.error als letzten Ausweg, wenn window.ErrorHandler selbst fehlt (WR-02a-Prinzip)', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { handlers, windowStub } = loadUIActions({ whitelist: new Set(['flipCoin']) });
        delete windowStub.ErrorHandler;

        handlers.get('call')({ value: 'nichtGelistet', id: 1 });

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/Call-Ziel nicht in Whitelist/);
        consoleErrorSpy.mockRestore();
    });
});
