/**
 * `insert-link`-Aktion — WR-01 Nacharbeit (13-REVIEW.md)
 *
 * `document.execCommand('createLink')` (vor Phase 9) inserierte bei kollabierter
 * Selektion einen sichtbaren Anker mit der URL als Text. Die Ablösung ruft
 * `wrapRangeWithElement()` (ui/editors/rich-text.js), dessen `surroundContents()`
 * bei einer kollabierten Range NICHT wirft — sie "gelingt" trivial und fügt einen
 * unsichtbaren, leeren `<a href="…">` ein. Zusätzlich prüfte der Code nie, ob die
 * aktuelle Selektion tatsächlich im Ziel-Editor liegt.
 *
 * Dieser Test lädt `ui/actions/system-actions.js` per `vm` in eine Sandbox (Muster:
 * tests/unit/event-delegation.test.js), nutzt aber die echten jsdom-Globals
 * (`window`, `document`, `Node`) für eine realistische Selection/Range-Umgebung.
 * `window.wrapRangeWithElement` wird gestubbt, um ausschließlich das Verhalten der
 * `insert-link`-Aktion selbst zu prüfen (nicht die DOM-Wrap-Mechanik aus rich-text.js).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../ui/actions/system-actions.js');

/**
 * Lädt ui/actions/system-actions.js in eine Sandbox, die die echten jsdom-Globals
 * (window/document/Node) dieser Testdatei wiederverwendet.
 * @param {Object} opts
 * @param {string|null} [opts.promptReturn] Rückgabewert von `prompt(...)`
 * @param {Function} [opts.wrapRangeWithElement] jest.fn() für `window.wrapRangeWithElement`
 * @param {Function} [opts.showToast] jest.fn() für `showToast`
 */
function loadSystemActions({ promptReturn = 'https://example.com', wrapRangeWithElement, showToast } = {}) {
    window.wrapRangeWithElement = wrapRangeWithElement || jest.fn();
    const context = {
        window,
        document,
        Node,
        $: id => document.getElementById(id),
        prompt: jest.fn(() => promptReturn),
        showToast: showToast || jest.fn()
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
    const SystemActions = vm.runInContext('SystemActions', context);
    return { context, SystemActions };
}

function selectTextInEditor(editorId, start, end) {
    const editor = document.getElementById(editorId);
    const textNode = editor.firstChild;
    const range = document.createRange();
    range.setStart(textNode, start);
    range.setEnd(textNode, end);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return range;
}

describe('SystemActions.insert-link (WR-01, 13-REVIEW.md)', () => {
    let focusSpy;

    beforeEach(() => {
        document.body.innerHTML =
            '<div id="editor" contenteditable="true">Hello world</div>' +
            '<div id="other-editor" contenteditable="true">Unrelated text</div>';
        window.getSelection().removeAllRanges();
        // jsdom's contenteditable support ist unvollständig (dokumentierte Einschränkung:
        // "not implemented: the actual editing behavior") — .focus() setzt die zuvor
        // gesetzte Selection auf dieses Element zurück, statt sie (wie in echten Browsern)
        // unverändert zu lassen. Für den Test wird focus() als No-Op gestubbt; der Aufruf
        // selbst wird production-seitig weiterhin ausgeführt (siehe system-actions.js).
        focusSpy = jest.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {});
    });

    afterEach(() => {
        focusSpy.mockRestore();
    });

    test('fügt bei markiertem Text im Ziel-Editor einen Link ein', () => {
        selectTextInEditor('editor', 0, 5); // "Hello"
        const wrapRangeWithElement = jest.fn();
        const showToast = jest.fn();
        const { SystemActions } = loadSystemActions({
            promptReturn: 'https://example.com',
            wrapRangeWithElement,
            showToast
        });

        SystemActions['insert-link']({ target: { dataset: { editor: 'editor' } } });

        expect(wrapRangeWithElement).toHaveBeenCalledTimes(1);
        const [range, anchor] = wrapRangeWithElement.mock.calls[0];
        expect(range.toString()).toBe('Hello');
        expect(anchor.tagName).toBe('A');
        expect(anchor.href).toBe('https://example.com/');
        expect(showToast).toHaveBeenCalledWith('🔗 Link eingefügt');
    });

    test('refuses eine leere Selektion mit Nutzer-Feedback statt einen unsichtbaren leeren <a> einzufügen', () => {
        // Bewusst KEINE Selektion gesetzt (kollabiert / leer) — vor dem Fix hätte
        // wrapRangeWithElement() hier trivial "erfolgreich" einen leeren <a> eingefügt.
        const wrapRangeWithElement = jest.fn();
        const showToast = jest.fn();
        const { SystemActions } = loadSystemActions({
            promptReturn: 'https://example.com',
            wrapRangeWithElement,
            showToast
        });

        SystemActions['insert-link']({ target: { dataset: { editor: 'editor' } } });

        expect(wrapRangeWithElement).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith('⚠️ Bitte erst Text markieren', 'warning');
        expect(document.getElementById('editor').querySelectorAll('a').length).toBe(0);
    });

    test('refuses eine Selektion außerhalb des Ziel-Editors (stale Selection)', () => {
        // Selektion liegt im "other-editor", die Aktion zielt aber auf "editor" —
        // ohne den Containment-Check würde der fremde Text in einen Anchor gewrappt.
        selectTextInEditor('other-editor', 0, 8); // "Unrelate"
        const wrapRangeWithElement = jest.fn();
        const showToast = jest.fn();
        const { SystemActions } = loadSystemActions({
            promptReturn: 'https://example.com',
            wrapRangeWithElement,
            showToast
        });

        SystemActions['insert-link']({ target: { dataset: { editor: 'editor' } } });

        expect(wrapRangeWithElement).not.toHaveBeenCalled();
        expect(document.getElementById('other-editor').querySelectorAll('a').length).toBe(0);
    });

    test('bricht ohne Aufruf ab, wenn der Nutzer die URL-Eingabe abbricht', () => {
        selectTextInEditor('editor', 0, 5);
        const wrapRangeWithElement = jest.fn();
        const { SystemActions } = loadSystemActions({
            promptReturn: null,
            wrapRangeWithElement
        });

        SystemActions['insert-link']({ target: { dataset: { editor: 'editor' } } });

        expect(wrapRangeWithElement).not.toHaveBeenCalled();
    });

    test('bricht ab, wenn das Ziel-Editor-Element nicht existiert', () => {
        const wrapRangeWithElement = jest.fn();
        const { SystemActions } = loadSystemActions({ wrapRangeWithElement });

        expect(() =>
            SystemActions['insert-link']({ target: { dataset: { editor: 'does-not-exist' } } })
        ).not.toThrow();
        expect(wrapRangeWithElement).not.toHaveBeenCalled();
    });
});
