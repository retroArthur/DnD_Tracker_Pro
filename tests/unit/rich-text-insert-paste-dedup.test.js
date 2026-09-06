/**
 * Fund 3 — Regressionsnetz für den Doppel-Paste-Bug (09-BASELINE.md, behoben
 * 2026-09-06, erneut gefunden via Phase-13-UAT)
 *
 * `initEditorPasteHandlers()` (ui/editors/rich-text-insert.js) registrierte
 * bis zu DREI unabhängige `paste`-Listener für denselben Editor: (1) einen
 * direkten Element-Listener für jede ID in der editorIds-Liste, (2) einen
 * document-weiten Capture-Listener für jedes Element mit Klasse .rich-editor
 * oder .dialog-text-area, (3) einen weiteren direkten Listener in
 * features/npcs/npc-dialogs.js für dynamisch erzeugte NPC-Dialogfelder. Ein
 * Listener auf dem Zielelement selbst feuert immer in der At-Target-Phase,
 * unabhängig von der Capture/Bubble-Konfiguration der übrigen Listener —
 * dadurch lief `handleEditorPaste()` bei jedem betroffenen Editor zwei- bis
 * dreimal pro echtem Paste-Vorgang, mit sichtbar verdoppeltem/verschachteltem
 * Ergebnis (siehe tests/e2e/features/editor-insert.spec.js für die
 * E2E-Gegenprobe gegen den gebauten Bundle).
 *
 * Der Fix sitzt IM Handler (nicht an der Registrierung, siehe Kommentar in
 * ui/editors/rich-text-insert.js über handleEditorPaste()): ein Guard direkt
 * am Event-Objekt (`e.__dndEditorPasteHandled`) lässt nur den ersten Aufruf
 * für ein bestimmtes Event tatsächlich einfügen. Dieser Test lädt das echte
 * Quellmodul per `vm` in eine Sandbox (Muster: tests/unit/event-delegation.test.js,
 * tests/unit/system-actions-insert-link.test.js) und beweist die Garantie
 * unit-seitig — unabhängig davon, wie viele Registrierungsstellen im DOM
 * tatsächlich existieren.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../ui/editors/rich-text-insert.js');

/**
 * Lädt ui/editors/rich-text-insert.js in eine Sandbox, die die echten
 * jsdom-Globals (window/document/Node) dieser Testdatei wiederverwendet, für
 * eine realistische Selection/Range-Umgebung (analog
 * tests/unit/system-actions-insert-link.test.js).
 * @param {Object} opts
 * @param {Function} [opts.sanitizeHTML] window.sanitizeHTML-Stub
 * @param {Function} [opts.showToast] showToast-Stub
 */
function loadRichTextInsert({ sanitizeHTML, showToast } = {}) {
    window.sanitizeHTML = sanitizeHTML || jest.fn(html => html);
    const context = {
        window,
        document,
        Node,
        showToast: showToast || jest.fn(),
        // Von initEditorPasteHandlers()/insertTable()/updateStickyOffsets()
        // referenzierte Globals aus anderen Modulen — für diesen Test nicht
        // gebraucht (nur handleEditorPaste()/insertTextAtSelection()/
        // insertHtmlAtSelection() werden geprüft), aber als No-Ops
        // bereitgestellt, damit ein versehentlicher Aufruf nicht mit
        // ReferenceError abbricht.
        $: jest.fn(id => document.getElementById(id)),
        floatingToolbarTarget: null,
        hideFloatingToolbar: jest.fn(),
        handleMarkdownInput: jest.fn(),
        editorHandlersInitialized: true
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(MODULE_PATH, 'utf8'), context);
    return { context };
}

function selectEndOfEditor(editorId) {
    const editor = document.getElementById(editorId);
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return range;
}

/**
 * Baut ein ClipboardEvent-ähnliches Objekt, das handleEditorPaste() direkt
 * (ohne echtes DOM-Dispatch) übergeben werden kann — spiegelt, wie zwei
 * unabhängige Listener dasselbe Event-Objekt für denselben physischen
 * Paste-Vorgang erhalten.
 */
function makeFakePasteEvent({ html = '', text = '' } = {}) {
    return {
        __preventDefaultCalls: 0,
        preventDefault() {
            this.__preventDefaultCalls++;
        },
        clipboardData: {
            getData: type => (type === 'text/html' ? html : type === 'text/plain' ? text : '')
        }
    };
}

describe('handleEditorPaste — Fund 3 Doppel-Paste-Guard (09-BASELINE.md, behoben 2026-09-06)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="wiki-content" contenteditable="true"></div>';
        window.getSelection().removeAllRanges();
    });

    test('derselbe Event zweimal an handleEditorPaste() übergeben (zwei Registrierungen desselben physischen Paste-Vorgangs) fügt reinen Text nur EINMAL ein', () => {
        const { context } = loadRichTextInsert();
        selectEndOfEditor('wiki-content');
        const evt = makeFakePasteEvent({ text: 'Reiner Text ohne Tab' });

        // Simuliert: zwei unabhängige Listener (direkter Element-Listener +
        // document-weiter Capture-Listener) feuern für denselben physischen
        // Paste-Vorgang — beide erhalten dasselbe Event-Objekt.
        context.handleEditorPaste(evt);
        context.handleEditorPaste(evt);

        const editor = document.getElementById('wiki-content');
        expect(editor.textContent).toBe('Reiner Text ohne Tab');
        expect(editor.innerHTML).toBe('Reiner Text ohne Tab');
        // preventDefault() wird beim ersten Aufruf aufgerufen; ob der Guard
        // ihn beim zweiten Aufruf erneut ausführt, ist unerheblich für die
        // Kern-Garantie (kein doppeltes Einfügen) — geprüft wird hier nur,
        // dass mindestens einmal preventDefault() lief.
        expect(evt.__preventDefaultCalls).toBeGreaterThanOrEqual(1);
    });

    test('derselbe Event zweimal an handleEditorPaste() übergeben fügt Tabellen-HTML nur EINMAL (nicht verschachtelt) ein', () => {
        const sanitizeHTML = jest.fn(html => html);
        const { context } = loadRichTextInsert({ sanitizeHTML });
        selectEndOfEditor('wiki-content');
        const tableHtml = '<table><tr><td>A</td><td>B</td></tr></table>';
        const evt = makeFakePasteEvent({ html: tableHtml, text: 'A\tB' });

        context.handleEditorPaste(evt);
        context.handleEditorPaste(evt);

        const editor = document.getElementById('wiki-content');
        // Genau EINE Tabelle, keine verschachtelte zweite Tabelle innerhalb
        // einer Zelle (das war exakt das beobachtete Fund-3-Symptom).
        expect(editor.querySelectorAll('table').length).toBe(1);
        expect(editor.querySelectorAll('td').length).toBe(2);
        expect(editor.querySelector('td table')).toBeNull();
    });

    test('zwei UNABHÄNGIGE Paste-Vorgänge (zwei verschiedene Event-Objekte) fügen jeweils eigenständig ein — der Guard blockiert nur denselben Event, nicht spätere echte Pastes', () => {
        const { context } = loadRichTextInsert();
        selectEndOfEditor('wiki-content');

        const first = makeFakePasteEvent({ text: 'Erster' });
        context.handleEditorPaste(first);
        selectEndOfEditor('wiki-content');
        const second = makeFakePasteEvent({ text: 'Zweiter' });
        context.handleEditorPaste(second);

        const editor = document.getElementById('wiki-content');
        expect(editor.textContent).toBe('ErsterZweiter');
    });

    test('Editor mit nur einer Registrierung (z. B. char-notes) bleibt unverändert — einzelner Aufruf fügt einmal ein', () => {
        document.body.innerHTML =
            '<div id="char-notes" class="cf-notes-editor" contenteditable="true"></div>';
        const { context } = loadRichTextInsert();
        selectEndOfEditor('char-notes');
        const evt = makeFakePasteEvent({ text: 'Notiz' });

        context.handleEditorPaste(evt);

        expect(document.getElementById('char-notes').textContent).toBe('Notiz');
    });
});
