/**
 * Generator der Editor-Werkzeugleisten — ui/editors/editor-toolbar-build.js
 *
 * Warum diese Tests: der Generator ist seit Variante 2a die EINZIGE Quelle
 * fuer das Markup aller 24 Leisten. Bricht sein Attributvertrag, bricht die
 * data-action-Delegation in jedem Editor der App gleichzeitig — und zwar
 * lautlos, weil ein Button mit falschem Attribut einfach nichts tut.
 *
 * Der Vertrag hat eine Eigenheit, die leicht "aufgeraeumt" und damit zerstoert
 * wird: bei format-text traegt data-cmd die Editor-ID und data-editor das
 * Format, bei allen anderen Aktionen ist data-editor die Editor-ID. Diese
 * Inversion ist gewachsen, aber von der gesamten Delegation und vom
 * eingefrorenen Phase-9-Testnetz vorausgesetzt.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = 'ui/editors/editor-toolbar-build.js';

function loadGenerator() {
    const source = fs.readFileSync(path.join(__dirname, '..', '..', MODULE_PATH), 'utf8');
    const windowStub = {};
    const context = vm.createContext({ window: windowStub, console });
    vm.runInContext(source, context);
    return windowStub;
}

describe('buildEditorToolbar — Attributvertrag', () => {
    let api;
    beforeAll(() => {
        api = loadGenerator();
    });

    test('exportiert buildEditorToolbar nach window', () => {
        expect(typeof api.buildEditorToolbar).toBe('function');
    });

    test('format-text behaelt die Inversion: data-cmd = Editor-ID, data-editor = Format', () => {
        const html = api.buildEditorToolbar('wiki-content', 'full');
        for (const fmt of ['bold', 'italic', 'underline', 'strikethrough']) {
            expect(html).toContain(
                `data-action="format-text" data-cmd="wiki-content" data-editor="${fmt}"`
            );
        }
    });

    test('alle uebrigen Aktionen tragen die Editor-ID in data-editor', () => {
        const html = api.buildEditorToolbar('wiki-content', 'full');
        for (const action of [
            'insert-link',
            'insert-table',
            'set-editor-font',
            'set-editor-font-size',
            'set-border-format'
        ]) {
            expect(html).toContain(`data-action="${action}" data-editor="wiki-content"`);
        }
    });

    test('clear-formatting traegt die Editor-ID abweichend in data-value', () => {
        const html = api.buildEditorToolbar('npc-desc', 'minimal');
        expect(html).toContain('data-action="clear-formatting" data-value="npc-desc"');
    });

    test('Markerwerte #fbbf24 und transparent bleiben erhalten (Testselektoren des Phase-9-Netzes)', () => {
        const html = api.buildEditorToolbar('wiki-content', 'full');
        expect(html).toContain('data-value="#fbbf24"');
        expect(html).toContain('data-value="transparent"');
    });

    test('call-Ziel und sein data-value stehen auf DERSELBEN Zeile', () => {
        // tests/unit/event-delegation.test.js scannt den Quellbaum zeilenweise
        // und belegt damit, dass die CALL_ACTION_WHITELIST-Ableitung
        // geschlossen ist. Ein Zeilenumbruch zwischen data-action="call" und
        // data-value liesse den Waechter das Ziel uebersehen.
        const source = fs.readFileSync(path.join(__dirname, '..', '..', MODULE_PATH), 'utf8');
        const offending = source
            .split('\n')
            .filter(line => /data-action="call"/.test(line) && !/data-value="/.test(line));
        expect(offending).toEqual([]);
    });
});

describe('buildEditorToolbar — Stufen', () => {
    let api;
    beforeAll(() => {
        api = loadGenerator();
    });

    test('minimal: kein Durchgestrichen, kein Link, kein Marker', () => {
        const html = api.buildEditorToolbar('npc-desc', 'minimal');
        expect(html).not.toContain('strikethrough');
        expect(html).not.toContain('insert-link');
        expect(html).not.toContain('set-highlight-color');
        expect(html).toContain('data-action="clear-formatting"');
    });

    test('mid: Durchgestrichen und Liste ja, Tabelle und Marker nein', () => {
        const html = api.buildEditorToolbar('enc-traits', 'mid');
        expect(html).toContain('data-editor="strikethrough"');
        expect(html).toContain('data-editor="list"');
        expect(html).not.toContain('insert-table');
        expect(html).not.toContain('set-highlight-color');
    });

    test('full: Marker, Bausteine, Tabelle, Rahmen und Groessen-Select', () => {
        const html = api.buildEditorToolbar('wiki-content', 'full');
        expect(html).toContain('set-highlight-color');
        expect(html).toContain('set-read-aloud-style');
        expect(html).toContain('insert-table');
        expect(html).toContain('set-border-format');
        expect(html).toContain('set-editor-font-size');
    });

    test('unbekannte Stufe faellt auf minimal zurueck statt zu werfen', () => {
        const html = api.buildEditorToolbar('x', 'gibtsnicht');
        expect(html).toContain('editor-toolbar-minimal');
    });

    test('opts.wikiLink haengt den [[]]-Button nur dort an, wo er angefordert ist', () => {
        expect(api.buildEditorToolbar('wiki-content', 'full', { wikiLink: true })).toContain(
            'data-value="insertWikiLink"'
        );
        expect(api.buildEditorToolbar('session-text', 'full')).not.toContain('insertWikiLink');
    });

    test('opts.clear:false unterdrueckt Loeschen-Knopf UND harten Reset', () => {
        const html = api.buildEditorToolbar('fraktion-agenda', 'minimal', { clear: false });
        expect(html).not.toContain('data-action="clear-formatting"');
        expect(html).not.toContain('data-action="clear-formatting-hard"');
    });

    test('der harte Reset liegt im ⋯-Menue, nicht auf dem Papierkorb-Knopf (W-17)', () => {
        const html = api.buildEditorToolbar('npc-desc', 'minimal');
        expect(html).toContain('data-action="clear-formatting" data-value="npc-desc"');
        expect(html).toContain(
            'class="tb-menu-item tb-menu-item-danger" data-action="clear-formatting-hard"'
        );
        // Reihenfolge: der Menueeintrag steht HINTER dem Knopf, sonst haette der
        // Knopf-Test oben auch dann bestanden, wenn beide vertauscht waeren.
        expect(html.indexOf('data-action="clear-formatting" data-value=')).toBeLessThan(
            html.indexOf('data-action="clear-formatting-hard"')
        );
    });
});

describe('buildEditorToolbar — Struktur der Variante 2a', () => {
    let api;
    beforeAll(() => {
        api = loadGenerator();
    });

    test('emittiert keine .toolbar-row mehr (drei Zeilen wurden zu einer)', () => {
        for (const tier of ['minimal', 'mid', 'full']) {
            expect(api.buildEditorToolbar('x', tier)).not.toContain('toolbar-row');
        }
    });

    test('Gruppen tragen data-tb fuer die Media-Query-Leiter', () => {
        const html = api.buildEditorToolbar('wiki-content', 'full');
        for (const g of ['chars', 'mid', 'label', 'fonts', 'right', 'more']) {
            expect(html).toContain(`data-tb="${g}"`);
        }
    });

    test('Menue-Trigger tragen data-tb-menu, damit die Selektion gesichert wird', () => {
        // Ohne dieses Attribut nimmt der Klick den Fokus aus dem Editor, ohne
        // dass rich-text-toolbars.js die Range vorher klont — die Formatierung
        // greift dann ins Leere.
        const html = api.buildEditorToolbar('wiki-content', 'full');
        expect(html).toContain('data-tb-menu="marker"');
        expect(html).toContain('data-tb-menu="block"');
        expect(html).toContain('data-tb-menu="more"');
    });

    test('Menues starten geschlossen', () => {
        const html = api.buildEditorToolbar('wiki-content', 'full');
        const menus = html.match(/class="tb-menu[^"]*"[^>]*hidden/g) || [];
        expect(menus.length).toBeGreaterThanOrEqual(3);
    });

    test('jeder Button ist type="button" (verhindert Formular-Absenden)', () => {
        // Historisch trugen nur die Bestiar- und Werkzeug-Leisten type="button";
        // die uebrigen defaulteten auf submit. Der Generator vereinheitlicht das.
        const html = api.buildEditorToolbar('wiki-content', 'full');
        const buttons = html.match(/<button[^>]*>/g) || [];
        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons.filter(b => !b.includes('type="button"'))).toEqual([]);
    });

    test('Editor-ID landet in data-toolbar-for, damit die Leiste zuordenbar bleibt', () => {
        expect(api.buildEditorToolbar('char-notes', 'mid')).toContain(
            'data-toolbar-for="char-notes"'
        );
    });

    test('Zusatzklasse wird durchgereicht (char-notes braucht .cf-notes-toolbar)', () => {
        const html = api.buildEditorToolbar('char-notes', 'mid', { extraClass: 'cf-notes-toolbar' });
        expect(html).toContain('editor-toolbar editor-toolbar-mid cf-notes-toolbar');
    });
});
