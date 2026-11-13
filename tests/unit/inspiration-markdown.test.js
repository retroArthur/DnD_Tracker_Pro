const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadReader() {
    const context = { document, DOMParser, Node };
    context.window = context;
    vm.createContext(context);
    for (const file of [
        'utils/basic.js',
        'ui/editors/markdown-converter.js',
        'features/inspiration/inspiration-markdown.js'
    ]) {
        const source = fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8');
        vm.runInContext(source, context, { filename: file });
    }
    return context.renderInspirationMarkdown;
}

test('Artikel behalten Tabellen, Aufhänger und Sprungziele für den Spieltisch', () => {
    const render = loadReader();
    const markdown = [
        '# Bier und Wein',
        '',
        '**Kurzantwort:** Der Ausschank hängt vom Ort ab.',
        '',
        '| Ort | Funktion |',
        '| --- | --- |',
        '| **Trinkstube** | Versammlung |',
        '',
        '| Q35 | Eine nachgetragene Quellenzeile ohne Tabellenkopf |',
        '',
        '## Für den Spieltisch',
        '',
        '**Aufhänger** *(erfunden)*',
        '1. **Das undichte Fass:** Die Fuhrleute warten.',
        '2. Gäste wollen in die Trinkstube.'
    ].join('\r\n');
    const article = render(markdown, []);

    expect(article.querySelector('h1')).toBeNull();
    expect(article.querySelector('#inspiration-kurzantwort').textContent).toBe(
        'Kurzantwort: Der Ausschank hängt vom Ort ab.'
    );
    expect(article.querySelector('table thead th').textContent).toBe('Ort');
    expect(article.querySelector('table tbody td b').textContent).toBe('Trinkstube');
    expect(
        [...article.querySelectorAll('table tbody tr')].map(row => row.cells[0].textContent)
    ).toEqual(['Trinkstube', 'Q35']);
    expect(article.querySelector('#inspiration-spieltisch').textContent).toBe('Für den Spieltisch');
    expect(article.querySelector('ol > li').textContent).toBe(
        'Das undichte Fass: Die Fuhrleute warten.'
    );
    expect(article.querySelectorAll('ol > li')).toHaveLength(2);
});

test('Nur enthaltene Artikel und Webquellen werden zu anklickbaren Links', () => {
    const render = loadReader();
    const markdown = [
        '# Beispiel',
        '[Essen](21-essen.md) · [Quellen](https://example.org/?section=4&b=2)',
        '[Vorlage](04-vorlage.md) · [Datei](file:///C:/Privat.txt) · [Fremd](//server/share)',
        '[Skript](javascript:alert%281%29)',
        '<a data-action="delete-npc" data-id="1">Rohes HTML</a>'
    ].join('\n');
    const article = render(markdown, [{ id: 21, file: '21-essen.md' }]);
    const links = [...article.querySelectorAll('a')];

    expect(links.map(link => link.textContent)).toEqual(['Essen', 'Quellen']);
    expect(links[0].dataset).toMatchObject({ action: 'open-inspiration-article', id: '21' });
    expect(links[0].hasAttribute('target')).toBe(false);
    expect(links[1].getAttribute('href')).toBe('https://example.org/?section=4&b=2');
    expect(links[1].getAttribute('rel')).toBe('noopener noreferrer');
    expect(article.textContent).toContain('Vorlage');
    expect(article.querySelector('[data-action="delete-npc"]')).toBeNull();
});
