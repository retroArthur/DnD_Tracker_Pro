const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');

function loadBestiary(creature) {
    document.body.innerHTML = read('assets/templates/view-bestiary.html');
    const app = {
        document,
        DOMParser,
        Node,
        D: { bestiary: [creature] },
        VirtualScroll: { create: () => {} },
        getSRDMonsters: () => [],
        setViewCount: () => {},
        showToast: () => {},
        safeJSONParse: JSON.parse,
        KeyboardGroup: {
            aktualisieren() {
                document.querySelectorAll('.bestiary-dice').forEach(dice => {
                    dice.tabIndex = 0;
                });
            }
        }
    };
    app.window = app;
    vm.createContext(app);
    for (const file of [
        'utils/basic.js',
        'utils/utilities.js',
        'utils/crud-helpers.js',
        'utils/filter-engine.js',
        'systems/undo.js',
        'features/bestiary/bestiary-render.js',
        'features/bestiary/bestiary-editor.js',
        'features/bestiary/bestiary-crud.js',
        'features/bestiary/bestiary-actions.js'
    ]) {
        vm.runInContext(read(file), app, { filename: file });
    }
    app.renderAll = app.renderBestiaryAnsicht;
    return app;
}

afterEach(() => {
    document.body.innerHTML = '';
});

test('eine Namensänderung erhält importierte Statblock-Daten ohne Editorfeld', () => {
    const app = loadBestiary({
        id: 7,
        name: 'Alter Wächter',
        skills: { wahrnehmung: '+5' },
        damageResistances: ['Feuer'],
        damageImmunities: ['Gift'],
        conditionImmunities: ['Betäubt'],
        legacyMetadata: { source: 'Heimspiel' }
    });

    app.openBestiaryEditor(7);
    app.$('bst-name').value = 'Neuer Wächter';
    app.saveBestiary();

    expect(app.D.bestiary).toHaveLength(1);
    expect(app.D.bestiary[0]).toMatchObject({
        id: 7,
        name: 'Neuer Wächter',
        skills: { wahrnehmung: '+5' },
        damageResistances: ['Feuer'],
        damageImmunities: ['Gift'],
        conditionImmunities: ['Betäubt'],
        legacyMetadata: { source: 'Heimspiel' }
    });
});

test.each([
    [0, 0],
    [undefined, 3]
])(
    'legendäre Aktionen pro Runde bleiben mit %p korrekt in Editor und Statblock',
    (stored, expected) => {
        const app = loadBestiary({
            id: 7,
            name: 'Wächter',
            legendaryActions: '<p>Brüllen</p>',
            legendaryActionsPerRound: stored
        });

        app.openBestiaryEditor(7);
        const inputValue = app.$('bst-legendary-count').value;
        app.saveBestiary();
        app.renderBestiaryDetail(7, 'custom');

        expect({
            input: inputValue,
            saved: app.D.bestiary[0].legendaryActionsPerRound,
            intro: app.$('bestiary-detail-panel').textContent
        }).toEqual({
            input: String(expected),
            saved: expected,
            intro: expect.stringContaining(`kann ${expected} legendäre Aktionen`)
        });
    }
);

test('Rückgängig und Wiederholen behalten den fokussierten Würfel im Statblock', () => {
    const app = loadBestiary({
        id: 7,
        name: 'Alter Wächter',
        actions: '<p>Biss 1d4, Hieb 2d6, Tritt 2d6</p>'
    });
    app.selectBestiary(7, 'custom');
    app.openBestiaryEditor(7);
    app.$('bst-name').value = 'Neuer Wächter';
    app.saveBestiary();
    app.KeyboardGroup.aktualisieren();
    const dice = () => [...document.querySelectorAll('#bestiary-detail-panel .bestiary-dice')];
    dice()[2].focus();
    expect(document.activeElement).toBe(dice()[2]);

    app.undo();
    const nachUndo = dice().indexOf(document.activeElement);
    expect(app.D.bestiary[0].name).toBe('Alter Wächter');

    app.redo();
    expect(app.D.bestiary[0].name).toBe('Neuer Wächter');
    expect([nachUndo, dice().indexOf(document.activeElement)]).toEqual([2, 2]);
});
