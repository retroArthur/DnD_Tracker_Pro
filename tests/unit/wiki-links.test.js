/**
 * Unit Tests — SEC-04: parseWikiLinks() Escaping + MAINT-02: doppeltes data-id
 * (Phase 13, Plan 13-02)
 *
 * Deckt ab:
 *  - Ein Wiki-Link-Titel mit `<`, `>`, `"` oder `'` erzeugt kein echtes Markup mehr
 *    im gerenderten `<span>` — weder als Attributwert-Ausbruch noch als sichtbarer
 *    Text im Textknoten (heute wird nur das Anführungszeichen im Attributwert
 *    escaped, der sichtbare Linktext bleibt unescaped).
 *  - Ein Titel ohne Sonderzeichen bleibt sichtbar unverändert lesbar.
 *  - Die `exists`/`missing`-Klasse funktioniert weiterhin auf dem UNescapten
 *    Rohtitel (Vergleich gegen `D.wiki[].title`).
 *  - Das `wiki-tree-item`-Element trägt genau EIN `data-id`-Attribut.
 *
 * Lädt `features/wiki/wiki.js`, `features/wiki/wiki-crud.js` UND `utils/basic.js`
 * per `vm` in denselben Kontext (Muster: tests/unit/file-backup-idb.test.js).
 * `esc()` wird NICHT gestubbt — es muss die echte Projektfunktion aus
 * utils/basic.js sein, sonst prüft der Test das Escaping nicht wirklich.
 *
 * MAINT-01 (Plan 13-09): `parseWikiLinks()` und `renderWikiTreeItem()` sind
 * unverändert, aber `parseWikiLinks()` wohnt seit der Aufteilung in
 * `wiki-crud.js`, nicht mehr in `wiki.js`. Ladereihenfolge muss der
 * `loader.js` `MODULES`-Reihenfolge entsprechen: `wiki.js` VOR `wiki-crud.js`,
 * weil `wiki-crud.js` bare Bezeichner (`WikiState`, `WIKI_CATEGORIES`) aus
 * `wiki.js` referenziert.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WIKI_MODULE_PATH = path.join(__dirname, '../../features/wiki/wiki.js');
const WIKI_CRUD_MODULE_PATH = path.join(__dirname, '../../features/wiki/wiki-crud.js');
const BASIC_UTILS_PATH = path.join(__dirname, '../../utils/basic.js');

function loadWikiModule({ wikiEntries = [] } = {}) {
    const context = {
        window: {
            D: { wiki: wikiEntries }
        },
        // esc()/$() referenzieren document nur INNERHALB von Funktionen, die
        // dieser Test nicht aufruft ($ selbst) — Stub genügt, falls die Engine
        // beim Laden dennoch draufschaut.
        document: {
            getElementById: () => null
        },
        console
    };
    vm.createContext(context);
    // Reihenfolge wichtig: esc() muss vor wiki.js im selben Kontext existieren,
    // damit wiki.js' bare esc(...)-Aufrufe die echte Projektfunktion treffen.
    // wiki-crud.js muss NACH wiki.js laufen (loader.js MODULES-Reihenfolge) —
    // es referenziert WikiState/WIKI_CATEGORIES als bare Bezeichner aus wiki.js.
    vm.runInContext(fs.readFileSync(BASIC_UTILS_PATH, 'utf8'), context);
    vm.runInContext(fs.readFileSync(WIKI_MODULE_PATH, 'utf8'), context);
    vm.runInContext(fs.readFileSync(WIKI_CRUD_MODULE_PATH, 'utf8'), context);
    return context;
}

describe('parseWikiLinks() — SEC-04 Escaping', () => {
    test('Titel mit < und > erzeugt kein echtes Markup im Textknoten', () => {
        const context = loadWikiModule();
        const content = 'Text mit [[Der <b>Hobbit</b>]] Link.';

        const result = context.parseWikiLinks(content);

        // Der rohe Tag darf nicht mehr im Ergebnis auftauchen
        expect(result).not.toMatch(/<b>Hobbit<\/b>/);
        // Escapte Form muss stattdessen sichtbar sein
        expect(result).toContain('Der &lt;b&gt;Hobbit&lt;/b&gt;');
    });

    test('Titel mit doppeltem Anführungszeichen bricht das data-value-Attribut nicht auf', () => {
        const context = loadWikiModule();
        const content = 'Siehe [[A" onmouseover="alert(1)]] dort.';

        const result = context.parseWikiLinks(content);

        expect(result).not.toContain('onmouseover="alert(1)"');
        expect(result).toContain('&quot;');
    });

    test('Titel ohne Sonderzeichen bleibt sichtbar unverändert lesbar', () => {
        const context = loadWikiModule();
        const content = 'Ein Verweis auf [[Held]] im Text.';

        const result = context.parseWikiLinks(content);

        expect(result).toContain('>Held<');
    });

    test('existierender Eintrag bekommt keine missing-Klasse', () => {
        const context = loadWikiModule({
            wikiEntries: [{ id: 1, title: 'Der Alte Wald' }]
        });
        const content = 'Reise nach [[Der Alte Wald]].';

        const result = context.parseWikiLinks(content);

        expect(result).toMatch(/class="wiki-link\s*"/);
        expect(result).not.toContain('missing');
    });

    test('nicht existierender Eintrag bekommt die missing-Klasse', () => {
        const context = loadWikiModule({ wikiEntries: [] });
        const content = 'Reise nach [[Nirgendwo]].';

        const result = context.parseWikiLinks(content);

        expect(result).toContain('missing');
    });
});

describe('renderWikiTreeItem() — MAINT-02 doppeltes data-id', () => {
    test('das wiki-tree-item trägt genau ein data-id-Attribut', () => {
        const context = loadWikiModule();
        const entry = { id: 42, title: 'Testeintrag', category: 'notes', pinned: false };

        const html = context.renderWikiTreeItem(entry, {}, 0);
        const matches = html.match(/data-id="42"/g) || [];

        expect(matches).toHaveLength(1);
    });
});
