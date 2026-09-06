/**
 * Konsolen-Sichtbarkeit von EventDelegation — WR-01/WR-02 Nacharbeit (13-REVIEW.md)
 *
 * Deckt zwei Regressionen aus MAINT-06 (13-08) ab, die der Code-Review als Warnings
 * (WR-02) einstufte:
 *
 * 1. (WR-02a) In `_handleClick`, `_handleChange` und `_handleInput` gab es vor Phase 13
 *    einen `else console.error(...)`-Zweig als letzten Ausweg, falls `ErrorHandler`
 *    selbst nicht existiert (z.B. gebrochene Ladereihenfolge). Dieser Test beweist,
 *    dass der Zweig wiederhergestellt ist — ohne ihn verschwindet ein Fehler spurlos.
 *
 * 2. (WR-02b) Die Whitelist-Ablehnung fuer `data-on-change`/`data-on-input`-Handler
 *    wurde in Phase 13 hinter `APP_CONFIG.DEBUG_MODE` versteckt. Das ist sicherheits-
 *    relevant (der Guard existiert genau fuer den Fall eines unautorisierten Aufrufs)
 *    und muss auch im Produktions-Build (DEBUG_MODE=false) sichtbar bleiben. Dieser
 *    Test laedt das echte Modul per `vm`, OHNE ueberhaupt ein `APP_CONFIG` zu stubben —
 *    die Protokollierung darf von dessen Existenz nicht abhaengen.
 *
 * Lade-Muster identisch zu tests/unit/event-delegation.test.js (vm-Sandbox um
 * ui/actions/ui-actions.js) — hier fuer ui/event-delegation.js selbst.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../ui/event-delegation.js');

/**
 * Laedt ui/event-delegation.js in eine frische Sandbox.
 * @param {Object} opts
 * @param {Function} [opts.errorHandlerLog] jest.fn() fuer das bare `ErrorHandler.log`
 * @param {boolean} [opts.withErrorHandler] ob ein bare `ErrorHandler`-Global existiert
 */
function loadEventDelegation({ errorHandlerLog, withErrorHandler = true } = {}) {
    const windowStub = {};
    const context = {
        window: windowStub,
        console,
        parseEntityId: id => (id != null ? parseInt(id, 10) : null)
    };
    if (withErrorHandler) {
        context.ErrorHandler = { log: errorHandlerLog || jest.fn() };
    }
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
    // `const EventDelegation = {...}` im Modul landet als globale Lexical-Binding im
    // vm-Kontext, nicht als eigene Property des `context`-Objekts (Node-vm-Eigenheit) —
    // ein zweiter runInContext-Aufruf im selben Kontext liest die Bindung aus.
    const EventDelegation = vm.runInContext('EventDelegation', context);
    return { context, windowStub, EventDelegation };
}

function fakeTarget(overrides = {}) {
    return {
        tagName: 'DIV',
        dataset: {},
        closest: () => null,
        ...overrides
    };
}

describe('EventDelegation — console-Fallback & unconditional Security-Logging (WR-02, 13-REVIEW.md)', () => {
    test('_handleClick: faellt auf console.error zurueck, wenn ErrorHandler fehlt (WR-02a)', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { EventDelegation } = loadEventDelegation({ withErrorHandler: false });
        EventDelegation.registerAction('boom', () => {
            throw new Error('kaputt');
        });
        const target = fakeTarget({ dataset: { action: 'boom' }, closest: sel => (sel === '[data-action]' ? target : null) });

        expect(() =>
            EventDelegation._handleClick({
                target,
                preventDefault: () => {},
                stopPropagation: () => {}
            })
        ).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/Fehler in Action "boom"/);
        consoleErrorSpy.mockRestore();
    });

    test('_handleClick: nutzt ErrorHandler.log statt console.error, wenn ErrorHandler vorhanden ist', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const errorHandlerLog = jest.fn();
        const { EventDelegation } = loadEventDelegation({ errorHandlerLog });
        EventDelegation.registerAction('boom', () => {
            throw new Error('kaputt');
        });
        const target = fakeTarget({ dataset: { action: 'boom' }, closest: sel => (sel === '[data-action]' ? target : null) });

        EventDelegation._handleClick({
            target,
            preventDefault: () => {},
            stopPropagation: () => {}
        });

        expect(errorHandlerLog).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });

    test('_handleChange (data-action-Zweig): faellt auf console.error zurueck, wenn ErrorHandler fehlt (WR-02a)', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { EventDelegation } = loadEventDelegation({ withErrorHandler: false });
        EventDelegation.registerAction('boom', () => {
            throw new Error('kaputt');
        });
        const target = fakeTarget({ dataset: { action: 'boom' } });

        expect(() => EventDelegation._handleChange({ target })).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/Fehler in Action "boom"/);
        consoleErrorSpy.mockRestore();
    });

    test('_handleInput (data-action-Zweig): faellt auf console.error zurueck, wenn ErrorHandler fehlt (WR-02a)', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { EventDelegation } = loadEventDelegation({ withErrorHandler: false });
        EventDelegation.registerAction('boom', () => {
            throw new Error('kaputt');
        });
        const target = fakeTarget({ dataset: { action: 'boom' } });

        expect(() => EventDelegation._handleInput({ target })).not.toThrow();

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/Fehler in Action "boom"/);
        consoleErrorSpy.mockRestore();
    });

    test('_handleChange: protokolliert einen nicht gelisteten onChange-Handler unconditional, OHNE dass APP_CONFIG ueberhaupt existiert (WR-02b)', () => {
        const errorHandlerLog = jest.fn();
        const { EventDelegation } = loadEventDelegation({ errorHandlerLog });
        // Bewusst KEIN window.APP_CONFIG gesetzt — die Protokollierung darf davon nicht abhaengen.
        const target = fakeTarget({ dataset: { onChange: 'nichtGelisteterHandler' } });

        EventDelegation._handleChange({ target });

        expect(errorHandlerLog).toHaveBeenCalledTimes(1);
        expect(errorHandlerLog.mock.calls[0][0]).toBe('EventDelegation');
        expect(errorHandlerLog.mock.calls[0][1].message).toMatch(/nichtGelisteterHandler/);
    });

    test('_handleInput: protokolliert einen nicht gelisteten onInput-Handler unconditional, OHNE dass APP_CONFIG ueberhaupt existiert (WR-02b)', () => {
        const errorHandlerLog = jest.fn();
        const { EventDelegation } = loadEventDelegation({ errorHandlerLog });
        const target = fakeTarget({ dataset: { onInput: 'nichtGelisteterHandler' } });

        EventDelegation._handleInput({ target });

        expect(errorHandlerLog).toHaveBeenCalledTimes(1);
        expect(errorHandlerLog.mock.calls[0][0]).toBe('EventDelegation');
        expect(errorHandlerLog.mock.calls[0][1].message).toMatch(/nichtGelisteterHandler/);
    });

    test('_handleChange: Whitelist-Ablehnung faellt auf console.error zurueck, wenn ErrorHandler fehlt (WR-02a)', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const { EventDelegation } = loadEventDelegation({ withErrorHandler: false });
        const target = fakeTarget({ dataset: { onChange: 'nichtGelisteterHandler' } });

        EventDelegation._handleChange({ target });

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/Blocked unauthorized onChange handler/);
        consoleErrorSpy.mockRestore();
    });

    test('_handleChange: ein gelisteter Handler wird weiterhin normal aufgerufen (keine Regression)', () => {
        const errorHandlerLog = jest.fn();
        const { EventDelegation, windowStub } = loadEventDelegation({ errorHandlerLog });
        const setNpcFilter = jest.fn();
        windowStub.setNpcFilter = setNpcFilter;
        const target = fakeTarget({ dataset: { onChange: 'setNpcFilter' } });

        EventDelegation._handleChange({ target });

        expect(setNpcFilter).toHaveBeenCalledWith(target);
        expect(errorHandlerLog).not.toHaveBeenCalled();
    });
});
