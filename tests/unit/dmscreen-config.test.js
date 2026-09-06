/**
 * Unit-Tests für die "Alle Widgets erreichbar"-Erweiterung von
 * features/dmscreen/dmscreen-config.js (Nutzeranfrage aus der
 * 13-12-Bedienprobe, außerhalb des MAINT-01-Verhaltensneutralitäts-Vertrags
 * der Phase 13).
 *
 * Vor dieser Erweiterung listete renderDMSConfigList() ausschließlich die
 * Widgets, die bereits im aktuellen `D.dmScreenLayout.widgets` stehen — die
 * übrigen registrierten Typen waren nur über einen Profilwechsel (z. B.
 * "Referenz") erreichbar. Diese Tests decken die drei neuen Funktionen ab:
 *   - addDMSWidgetType(type): fügt einen im Layout fehlenden Typ hinzu
 *     (bzw. blendet ihn wieder ein, falls bereits vorhanden)
 *   - selectAllDMSWidgets(): "Alle auswählen"
 *   - deselectAllDMSWidgets(): "Alle abwählen" (blendet aus, entfernt NICHT)
 * sowie einen Regressionsschutz für das bestehende toggleDMSWidget()
 * (Ausblenden bleibt Ausblenden, kein Entfernen aus dem Layout-Array).
 *
 * Muster: vm.runInContext() gegen die echten Quellmodule, analog zu
 * tests/unit/dmscreen-characterization.test.js (D-04, Plan 13-05) — eigene,
 * schlanke Sandbox statt eines gemeinsam genutzten Test-Helpers, wie es auch
 * die anderen vm-basierten Tests in diesem Verzeichnis handhaben.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const LOADER_PATH = path.join(PROJECT_ROOT, 'loader.js');
const CONSTANTS_PATH = path.join(PROJECT_ROOT, 'core', 'constants.js');

/** Alle 21 registrierten Widget-Typen (Reihenfolge wie getDMScreenWidgets()). */
const ALL_WIDGET_TYPES = [
    'party',
    'initiative',
    'dice',
    'conditions',
    'dc',
    'tables',
    'rules',
    'notes',
    'actions',
    'attributes',
    'saves',
    'skills',
    'economy',
    'sizes',
    'objects',
    'improvised',
    'ritual',
    'damage',
    'terrain',
    'knowledge',
    'travel'
];

/**
 * Extrahiert den Quelltext des `MODULES`-Arrays aus loader.js per
 * Klammertiefen-Tracking — identisches Vorgehen zu
 * dmscreen-characterization.test.js, damit ein neues features/dmscreen/-Modul
 * ohne Testanpassung automatisch mitgeladen wird.
 * @param {string} loaderSource
 * @returns {string|null}
 */
function extractModulesArraySource(loaderSource) {
    const marker = 'const MODULES = [';
    const startIdx = loaderSource.indexOf(marker);
    if (startIdx === -1) return null;
    let depth = 0;
    for (let i = startIdx + marker.length - 1; i < loaderSource.length; i++) {
        const ch = loaderSource[i];
        if (ch === '[') depth++;
        else if (ch === ']') {
            depth--;
            if (depth === 0) {
                return loaderSource.slice(startIdx + marker.length, i);
            }
        }
    }
    return null;
}

function getDmScreenModulePaths() {
    const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
    const arraySource = extractModulesArraySource(loaderSource);
    if (arraySource === null) {
        throw new Error('MODULES-Array in loader.js konnte nicht extrahiert werden.');
    }
    const allModules = Array.from(arraySource.matchAll(/'([^']*)'/g)).map(m => m[1]);
    const dmscreenModules = allModules.filter(p => p.startsWith('features/dmscreen/'));
    if (dmscreenModules.length === 0) {
        throw new Error('Keine Module unter "features/dmscreen/" in loader.js MODULES gefunden.');
    }
    return dmscreenModules;
}

/**
 * Laedt alle `features/dmscreen/`-Module aus loader.js MODULES in einer
 * gemeinsamen vm-Sandbox. `fixtureWidgets` bestimmt den Startzustand von
 * `D.dmScreenLayout.widgets` fuer den jeweiligen Test.
 * @param {Array<{id: string, type: string, visible: boolean}>} fixtureWidgets
 */
function loadDmScreenConfigSandbox(fixtureWidgets) {
    const sandboxDocument = document.implementation.createHTMLDocument('dmscreen-config-sandbox');
    ['dmscreen-grid', 'dms-quick-bar', 'view-dmscreen', 'dms-config-list'].forEach(id => {
        const el = sandboxDocument.createElement('div');
        el.id = id;
        sandboxDocument.body.appendChild(el);
    });
    sandboxDocument.getElementById('view-dmscreen').classList.add('active');

    const sandboxD = {
        characters: [],
        npcs: [],
        initiative: { combatants: [], currentTurn: 0, round: 1 },
        randomTables: [],
        dmScreenLayout: { widgets: JSON.parse(JSON.stringify(fixtureWidgets)) },
        dmScreenProfiles: {},
        dmScreenActiveProfile: null,
        dmScreenNotes: ''
    };

    const context = {
        document: sandboxDocument,
        D: sandboxD,
        APP_CONFIG: { DEBUG_MODE: false },
        ErrorHandler: { log: jest.fn() },
        EntityLookup: { enableCache: jest.fn(), clearCache: jest.fn() },
        $: id => sandboxDocument.getElementById(id),
        esc: s => (s === null || s === undefined ? '' : String(s)),
        showToast: jest.fn(),
        confirm: jest.fn(() => true),
        prompt: jest.fn(() => 'Sandbox-Profil'),
        pushUndo: jest.fn(),
        debounce: fn => fn,
        setTimeout: jest.fn(() => 0),
        clearTimeout: jest.fn(),
        console
    };

    context.window = context;
    context.globalThis = context;
    vm.createContext(context);

    context.window.save = jest.fn();
    context.window.saveImmediate = jest.fn();
    context.window.registerPostSaveHook = jest.fn();
    context.window.setTimeout = jest.fn(() => 0);
    context.window.addToDiceHistory = jest.fn();
    context.window.showConditionReference = jest.fn();

    vm.runInContext(fs.readFileSync(CONSTANTS_PATH, 'utf8'), context, { filename: CONSTANTS_PATH });

    getDmScreenModulePaths().forEach(relPath => {
        const absPath = path.join(PROJECT_ROOT, relPath);
        vm.runInContext(fs.readFileSync(absPath, 'utf8'), context, { filename: absPath });
    });

    return { context, document: sandboxDocument, D: sandboxD };
}

describe('DM Screen Widget-Konfiguration — "Alle Widgets erreichbar" (Nutzeranfrage 13-12-Bedienprobe)', () => {
    test('addDMSWidgetType() fügt einen im Layout fehlenden Typ neu hinzu', () => {
        const sandbox = loadDmScreenConfigSandbox([{ id: 'party-stats', type: 'party', visible: true }]);
        sandbox.context.addDMSWidgetType('dice');

        const widgets = sandbox.D.dmScreenLayout.widgets;
        expect(widgets).toHaveLength(2);
        const added = widgets.find(w => w.type === 'dice');
        expect(added).toBeDefined();
        expect(added.visible).toBe(true);
        expect(typeof added.id).toBe('string');
        expect(added.id.length).toBeGreaterThan(0);
        expect(sandbox.context.pushUndo).toHaveBeenCalled();
        expect(sandbox.context.window.save).toHaveBeenCalled();
    });

    test('addDMSWidgetType() ist idempotent — ein bereits vorhandener (aber ausgeblendeter) Typ wird nur sichtbar geschaltet, nicht dupliziert', () => {
        const sandbox = loadDmScreenConfigSandbox([
            { id: 'party-stats', type: 'party', visible: true },
            { id: 'quick-dice', type: 'dice', visible: false }
        ]);
        sandbox.context.addDMSWidgetType('dice');
        sandbox.context.addDMSWidgetType('dice');

        const widgets = sandbox.D.dmScreenLayout.widgets;
        const diceWidgets = widgets.filter(w => w.type === 'dice');
        expect(diceWidgets).toHaveLength(1);
        expect(diceWidgets[0].id).toBe('quick-dice');
        expect(diceWidgets[0].visible).toBe(true);
        expect(widgets).toHaveLength(2);
    });

    test('addDMSWidgetType() ignoriert einen unbekannten Typ ohne Fehler', () => {
        const sandbox = loadDmScreenConfigSandbox([{ id: 'party-stats', type: 'party', visible: true }]);
        expect(() => sandbox.context.addDMSWidgetType('nicht-registriert')).not.toThrow();
        expect(sandbox.D.dmScreenLayout.widgets).toHaveLength(1);
    });

    test('selectAllDMSWidgets() fügt alle fehlenden Typen hinzu und macht alle 21 sichtbar', () => {
        const sandbox = loadDmScreenConfigSandbox([
            { id: 'party-stats', type: 'party', visible: true },
            { id: 'quick-rules', type: 'rules', visible: false }
        ]);
        sandbox.context.selectAllDMSWidgets();

        const widgets = sandbox.D.dmScreenLayout.widgets;
        expect(widgets).toHaveLength(ALL_WIDGET_TYPES.length);
        const types = widgets.map(w => w.type).sort();
        expect(types).toEqual([...ALL_WIDGET_TYPES].sort());
        expect(widgets.every(w => w.visible === true)).toBe(true);
        // Bereits vorhandene Ids bleiben erhalten (kein Neuanlegen bestehender Eintraege)
        expect(widgets.find(w => w.type === 'party').id).toBe('party-stats');
        expect(widgets.find(w => w.type === 'rules').id).toBe('quick-rules');
        expect(sandbox.context.pushUndo).toHaveBeenCalled();
    });

    test('deselectAllDMSWidgets() blendet alle Widgets aus, entfernt sie aber NICHT aus dem Layout (hide statt destroy)', () => {
        const fixture = ALL_WIDGET_TYPES.map(type => ({ id: `${type}-widget`, type, visible: true }));
        const sandbox = loadDmScreenConfigSandbox(fixture);
        sandbox.context.deselectAllDMSWidgets();

        const widgets = sandbox.D.dmScreenLayout.widgets;
        expect(widgets).toHaveLength(ALL_WIDGET_TYPES.length);
        expect(widgets.every(w => w.visible === false)).toBe(true);
        // Reihenfolge und Ids unveraendert
        expect(widgets.map(w => w.id)).toEqual(fixture.map(w => w.id));
    });

    test('toggleDMSWidget() blendet ein vorhandenes Widget weiterhin nur aus, entfernt es nicht aus dem Layout (Regressionsschutz)', () => {
        const sandbox = loadDmScreenConfigSandbox([{ id: 'party-stats', type: 'party', visible: true }]);
        sandbox.context.toggleDMSWidget('party-stats');

        const widgets = sandbox.D.dmScreenLayout.widgets;
        expect(widgets).toHaveLength(1);
        expect(widgets[0].id).toBe('party-stats');
        expect(widgets[0].visible).toBe(false);
    });

    test('renderDMSConfigList() zeigt vorhandene Widgets zuerst (bestehender Toggle) und danach fehlende Typen (Hinzufügen-Checkbox)', () => {
        const sandbox = loadDmScreenConfigSandbox([{ id: 'party-stats', type: 'party', visible: true }]);
        sandbox.context.renderDMSConfigList();

        const list = sandbox.document.getElementById('dms-config-list');
        const items = Array.from(list.querySelectorAll('.dms-config-item'));
        expect(items).toHaveLength(ALL_WIDGET_TYPES.length);

        // Erstes Element: das vorhandene "party"-Widget, mit dem bestehenden Toggle-Pfad
        expect(items[0].getAttribute('data-widget-id')).toBe('party-stats');
        const firstCheckbox = items[0].querySelector('input[type="checkbox"]');
        expect(firstCheckbox.getAttribute('data-action')).toBe('dms-toggle-widget');
        expect(firstCheckbox.checked).toBe(true);

        // Ein fehlender Typ (z. B. "dice") traegt die neue Hinzufuegen-Checkbox
        const diceItem = items.find(item => item.classList.contains('dms-config-item-unadded') &&
            item.getAttribute('data-widget-type') === 'dice');
        expect(diceItem).toBeDefined();
        const diceCheckbox = diceItem.querySelector('input[type="checkbox"]');
        expect(diceCheckbox.getAttribute('data-action')).toBe('dms-add-widget-type');
        expect(diceCheckbox.checked).toBe(false);
    });
});
