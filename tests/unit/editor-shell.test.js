/**
 * Editor-Schale — ui/editors/editor-shell.js
 *
 * Warum diese Tests: die Statuszeile behauptet etwas ueber den Speicherstand.
 * Eine Anzeige, die "Gespeichert" sagt, obwohl nichts gespeichert wurde, ist
 * schlimmer als gar keine — am Spieltisch glaubt man ihr genau einmal.
 * Der Prototyp meldet 1200 ms nach der letzten Eingabe "Gespeichert"; hier ist
 * festgehalten, dass die Schale das NICHT tut und auch keinen globalen
 * Post-Save-Hook dafuer registriert (beides am gebauten Bundle widerlegt,
 * siehe Modulkopf).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = 'ui/editors/editor-shell.js';

function loadShell(dom) {
    const source = fs.readFileSync(path.join(__dirname, '..', '..', MODULE_PATH), 'utf8');
    const windowStub = { registerPostSaveHook: jest.fn() };
    const context = vm.createContext({
        window: windowStub,
        document: dom,
        console,
        setTimeout,
        clearTimeout,
        Date,
        $: id => dom.getElementById(id)
    });
    vm.runInContext(source, context);
    return windowStub;
}

/** Minimaler DOM-Ersatz: nur, was das Modul wirklich anfasst. */
function makeDom() {
    const nodes = {};
    const make = () => ({ textContent: '', dataset: {}, addEventListener: jest.fn() });
    nodes['wiki-content'] = {
        innerText: '',
        textContent: '',
        dataset: {},
        addEventListener: jest.fn()
    };
    nodes['state'] = make();
    nodes['words'] = make();
    nodes['chars'] = make();
    const shell = { dataset: { editorShell: 'wiki-content' } };
    return {
        _nodes: nodes,
        getElementById: id => nodes[id] || null,
        querySelector: sel => {
            if (sel.includes('data-editor-state-for')) return nodes['state'];
            if (sel.includes('data-editor-words-for')) return nodes['words'];
            if (sel.includes('data-editor-chars-for')) return nodes['chars'];
            return null;
        },
        querySelectorAll: sel => (sel === '[data-editor-shell]' ? [shell] : [])
    };
}

describe('countEditorWords', () => {
    let api;
    beforeAll(() => {
        api = loadShell(makeDom());
    });

    test('zaehlt Woerter durch beliebigen Leerraum getrennt', () => {
        expect(api.countEditorWords('Das Kontor am Aschepfad')).toBe(4);
        expect(api.countEditorWords('Zeile\neins\tzwei   drei')).toBe(4);
    });

    test('leerer und nur-Leerraum-Text ergeben 0', () => {
        expect(api.countEditorWords('')).toBe(0);
        expect(api.countEditorWords('    ')).toBe(0);
        expect(api.countEditorWords(null)).toBe(0);
        expect(api.countEditorWords(undefined)).toBe(0);
    });

    test('liefert dasselbe wie die frueher in wiki.js kopierte Zeile', () => {
        const legacy = t => t.split(/\s+/).filter(w => w.length > 0).length;
        ['Ein Wort', ' fuehrender Leerraum', 'x', 'a  b  c '].forEach(t => {
            expect(api.countEditorWords(t)).toBe(legacy(t));
        });
    });
});

describe('Statuszeile', () => {
    let api, dom;
    beforeEach(() => {
        jest.useFakeTimers();
        dom = makeDom();
        api = loadShell(dom);
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    test('zaehlt Woerter und Zeichen der Schreibflaeche', () => {
        dom._nodes['wiki-content'].innerText = 'Wache Passiv 13';
        api.updateEditorShellCounts('wiki-content');
        expect(dom._nodes['words'].textContent).toBe('3 Wörter');
        expect(dom._nodes['chars'].textContent).toBe('15 Zeichen');
    });

    // Am gebauten Bundle nachgemessen: save() ist selbst entprellt, der
    // Post-Save-Hook feuert 1,5-3 s spaeter und ohne Zuordnung dazu, WER
    // gespeichert hat. Ein daran gehaengter Speicherstand haette mitten im
    // Tippen "Gespeichert" gemeldet. Die Schale registriert deshalb bewusst
    // KEINEN globalen Hook.
    test('registriert bewusst KEINEN globalen Post-Save-Hook', () => {
        api.initEditorShells();
        expect(api.registerPostSaveHook).not.toHaveBeenCalled();
    });

    test('KERNBELEG: die Ruhe-Meldung behauptet NICHT, gespeichert zu haben', () => {
        api.initEditorShells();
        const handler = dom._nodes['wiki-content'].addEventListener.mock.calls[0][1];
        handler();
        expect(dom._nodes['state'].textContent).toBe('Wird bearbeitet …');
        jest.advanceTimersByTime(1200);
        expect(dom._nodes['state'].textContent).toBe('Ungespeicherte Änderungen');
        expect(dom._nodes['state'].textContent).not.toContain('Gespeichert ·');
    });

    test('resetEditorShell raeumt Stand und Zaehler auf', () => {
        dom._nodes['wiki-content'].innerText = 'Text';
        dom._nodes['state'].textContent = 'Ungespeicherte Änderungen';
        api.resetEditorShell('wiki-content');
        expect(dom._nodes['state'].textContent).toBe('');
        expect(dom._nodes['words'].textContent).toBe('1 Wörter');
    });
});
