/**
 * Charakterisierungstest für features/dmscreen/dmscreen-render.js — D-04 (Plan 13-05)
 *
 * `dmscreen-render.js` ist mit 1576 Zeilen, 58 Funktionen und 21 Widget-Typen die
 * riskanteste der vier Dateien, die Plan 13-12 aufteilen wird — und bislang die
 * einzige ohne eigene Testabdeckung. D-04 verlangt deshalb ein Regressionsnetz gegen
 * das UNGETEILTE Modul, BEVOR in 13-12 eine einzige Zeile verschoben wird.
 *
 * Zwei Konsequenzen für dieses Testdesign:
 *   1. Der Test lädt seine Modulliste aus `loader.js` `MODULES` (gefiltert auf
 *      `features/dmscreen/`) statt einen Dateipfad zu hardcoden — nach der Aufteilung
 *      in 13-12 liegen die Widget-Renderer in mehreren Dateien, und dieser Test
 *      findet sie dort unveraendert.
 *   2. Der Test spricht ausschliesslich die OEFFENTLICHE Oberflaeche an:
 *      `getDMScreenWidgets()` als Registry, der auf window exportierte
 *      Gesamt-Einstiegspunkt (siehe Original-Zeile 1573), `switchDMSProfile()`
 *      fuer die vier Standardprofile. Kein einzelner Widget-Renderer wird je
 *      ueber seinen internen Funktionsnamen aufgerufen — nur ueber die von der
 *      Registry gelieferte `.render`-Referenz.
 *
 * Muster: `vm.runInContext()` gegen das echte Quellmodul, analog zu
 * tests/unit/file-backup-idb.test.js und tests/unit/markdown-converter.test.js.
 *
 * WICHTIG (must_haves.prohibitions, 13-05-PLAN.md): Der Snapshot dieser Datei darf
 * NIE an eine neue Ausgabe angepasst werden. Er ist der Beweis gegen das
 * UNGETEILTE Modul. Eine Abweichung nach der Aufteilung in 13-12 ist ein Befund
 * ÜBER die Aufteilung — kein Anlass, den Snapshot neu zu schreiben.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const LOADER_PATH = path.join(PROJECT_ROOT, 'loader.js');
const CONSTANTS_PATH = path.join(PROJECT_ROOT, 'core', 'constants.js');

// ============================================================
// Modulliste aus loader.js MODULES ableiten (D-04 Kernanforderung)
// ============================================================

/**
 * Extrahiert den Quelltext des `MODULES`-Arrays aus loader.js per Klammertiefen-
 * Tracking (nicht per gieriger Regex) — dasselbe Prinzip wie
 * `check_duplicate_functions()` in build.py: robust gegen Kommentare/Strings
 * zwischen den Eintraegen, statt auf ein zufaellig passendes `];` zu hoffen.
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

/**
 * Liest loader.js, extrahiert alle Eintraege des `MODULES`-Arrays in
 * Array-Reihenfolge und filtert auf Pfade unter `features/dmscreen/`.
 * Schlaegt die Extraktion fehl oder liefert sie null Treffer, wird HART
 * abgebrochen (T-13-19) — eine leer-gruene Sandbox waere schlimmer als ein
 * roter Test, weil sie D-04 vortaeuscht, ohne es einzuloesen.
 * @returns {string[]}
 */
function getDmScreenModulePaths() {
    const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
    const arraySource = extractModulesArraySource(loaderSource);
    if (arraySource === null) {
        throw new Error(
            'loadDmScreenSandbox: MODULES-Array in loader.js konnte nicht extrahiert werden ' +
                '(D-04-Vorbedingung verletzt — siehe 13-05-PLAN.md).'
        );
    }
    const allModules = Array.from(arraySource.matchAll(/'([^']*)'/g)).map(m => m[1]);
    const dmscreenModules = allModules.filter(p => p.startsWith('features/dmscreen/'));
    if (dmscreenModules.length === 0) {
        throw new Error(
            'loadDmScreenSandbox: Keine Module unter "features/dmscreen/" in loader.js MODULES ' +
                'gefunden — Filterpraefix stimmt nicht mehr mit loader.js ueberein.'
        );
    }
    return dmscreenModules;
}

// ============================================================
// Deterministische D-Fixture
// ============================================================

/** Registry-Typenliste in der Reihenfolge von getDMScreenWidgets() (21 Typen). */
const DMS_WIDGET_TYPES = [
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

function buildFullDmsLayout() {
    return { widgets: DMS_WIDGET_TYPES.map(type => ({ id: `${type}-widget`, type, visible: true })) };
}

/**
 * Deterministische Kampagnen-Fixture: zwei Charaktere mit festen HP/AC, eine
 * Initiative mit zwei Kaempfern und round: 1, zwei Zufallstabellen, feste
 * Notizen. Keine Systemzeit, keine Zufallszahlen — Determinismus ist
 * Abnahmekriterium (must_haves.truths, 13-05-PLAN.md).
 */
const DMS_FIXTURE = {
    characters: [
        { id: 1, name: 'Thorin Eisenfaust', hpCurrent: 34, hpMax: 42, ac: 18, passivePerception: 14 },
        { id: 2, name: 'Elara Mondschein', hpCurrent: 27, hpMax: 27, ac: 15, passivePerception: 17 }
    ],
    npcs: [],
    initiative: {
        combatants: [
            { id: 1, name: 'Thorin Eisenfaust', initiative: 18, currentHp: 34, maxHp: 42 },
            { id: 2, name: 'Goblin-Kundschafter', initiative: 12, currentHp: 7, maxHp: 7 }
        ],
        currentTurn: 0,
        round: 1
    },
    randomTables: [
        {
            id: 1,
            icon: '🌲',
            name: 'Waldbegegnungen',
            entries: [{ weight: 1, text: 'Ein Reh springt vorbei' }]
        },
        {
            id: 2,
            icon: '🍺',
            name: 'Tavernengeruechte',
            entries: [{ weight: 1, text: 'Der Wirt fluestert von einem Schatz' }]
        }
    ],
    dmScreenLayout: buildFullDmsLayout(),
    dmScreenProfiles: {
        custom_test: {
            name: 'Eigenes Test-Profil',
            icon: '⭐',
            widgets: [{ id: 'party-widget', type: 'party', visible: true }]
        }
    },
    dmScreenActiveProfile: null,
    dmScreenNotes: 'Session-Notizen: Die Gruppe naehert sich der Mine.'
};

// ============================================================
// Sandbox-Harnisch
// ============================================================

/**
 * Laedt alle `features/dmscreen/`-Module aus loader.js MODULES in EINER
 * gemeinsamen vm-Sandbox, in fester Reihenfolge nach core/constants.js (das
 * Modul liest UI_TIMING bereits beim eigenen Laden — siehe Original-Zeile 99).
 *
 * `window` ist ein Selbstverweis auf den Kontext (`context.window = context`),
 * exakt wie im Browser (`window === globalThis`): bare Identifier UND
 * `window.`-praefigierte Zugriffe treffen dieselbe Stelle. Das Modul mischt
 * beide Formen (z.B. bare `esc()` neben `window.save()`), also muss die
 * Sandbox das ebenso tun.
 *
 * @param {object} fixture Deep-clonebare D-Fixture (z.B. DMS_FIXTURE)
 * @returns {{ context: object, document: Document, D: object }}
 */
function loadDmScreenSandbox(fixture) {
    // Isoliertes, unabhaengiges Document je Sandbox-Instanz — kein Rueckgriff auf
    // eine zusaetzliche jsdom-Installation noetig: createHTMLDocument() ist Teil
    // der Standard-DOM-API und im Jest-jsdom-testEnvironment bereits verfuegbar.
    const sandboxDocument = document.implementation.createHTMLDocument('dmscreen-sandbox');
    [
        'dmscreen-grid',
        'dms-quick-bar',
        'view-dmscreen',
        'dms-config-list',
        'dms-profile-list',
        'dms-profile-dropdown',
        'dms-config-dropdown',
        'dms-config-btn'
    ].forEach(id => {
        const el = sandboxDocument.createElement('div');
        el.id = id;
        sandboxDocument.body.appendChild(el);
    });
    sandboxDocument.getElementById('view-dmscreen').classList.add('active');

    // Eigene, deep-geklonte Kopie der Fixture je Sandbox — switchDMSProfile()
    // mutiert D.dmScreenLayout in-place; verschiedene Sandbox-Instanzen duerfen
    // sich das niemals teilen.
    const sandboxD = JSON.parse(JSON.stringify(fixture));

    const context = {
        document: sandboxDocument,
        D: sandboxD,
        APP_CONFIG: { DEBUG_MODE: false },
        ErrorHandler: { log: jest.fn() },
        EntityLookup: { enableCache: jest.fn(), clearCache: jest.fn() },
        $: id => sandboxDocument.getElementById(id),
        esc: s => {
            if (s === null || s === undefined) return '';
            if (s === 0) return '0';
            if (!s) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },
        showToast: jest.fn(),
        confirm: jest.fn(() => true),
        prompt: jest.fn(() => 'Sandbox-Profil'),
        pushUndo: jest.fn(),
        debounce: fn => fn,
        setTimeout: jest.fn(() => 0),
        clearTimeout: jest.fn(),
        console
    };

    // Deterministische Date/Math-Ersatzobjekte. NIEMALS die echten globalen
    // Objekte mutieren (context.Math = Math; context.Math.random = ...  wuerde
    // Math.random fuer den GESAMTEN Jest-Prozess ueberschreiben) — stattdessen
    // Schattenkopien per Object.create(Math), die alle anderen Methoden per
    // Prototyp-Kette erben und nur die nichtdeterministische Methode ersetzen.
    // In diesem Modul wird Date.now()/Math.random() nur in Pfaden aufgerufen,
    // die dieser Test nie ausloest (dmsRollDice, dmsRollOnTable,
    // saveDMSProfileAs) — die Ersetzung ist Absicherung, kein aktiver Bedarf.
    const FIXED_NOW = 1735689600000; // 2025-01-01T00:00:00.000Z, fest gewaehlt
    const FixedDate = function (...args) {
        return args.length ? new Date(...args) : new Date(FIXED_NOW);
    };
    FixedDate.now = () => FIXED_NOW;
    FixedDate.prototype = Date.prototype;
    context.Date = FixedDate;

    const FixedMath = Object.create(Math);
    FixedMath.random = () => 0.5;
    context.Math = FixedMath;

    context.window = context; // Browser-Semantik: window === globalThis
    context.globalThis = context;

    vm.createContext(context);

    // window.-praefigierte Stubs (siehe read_first: Modul liest diese explizit
    // ueber window., nicht bare)
    context.window.save = jest.fn();
    context.window.saveImmediate = jest.fn();
    context.window.registerPostSaveHook = jest.fn();
    context.window.setTimeout = jest.fn(() => 0);
    context.window.addToDiceHistory = jest.fn();
    context.window.showConditionReference = jest.fn();
    // window.parseDiceNotation bewusst NICHT gesetzt: dmsRollDice() faellt dann
    // auf seinen eigenen Fallback-Zweig zurueck (nicht Teil dieses Snapshots).

    // Reihenfolge ist der Punkt: core/constants.js zuerst, sonst wirft
    // dmscreen-render.js beim eigenen Laden einen ReferenceError auf UI_TIMING.
    vm.runInContext(fs.readFileSync(CONSTANTS_PATH, 'utf8'), context, {
        filename: CONSTANTS_PATH
    });

    const modulePaths = getDmScreenModulePaths();
    modulePaths.forEach(relPath => {
        const absPath = path.join(PROJECT_ROOT, relPath);
        vm.runInContext(fs.readFileSync(absPath, 'utf8'), context, { filename: absPath });
    });

    return { context, document: sandboxDocument, D: sandboxD };
}

// ============================================================
// Tests
// ============================================================

describe('DM Screen Charakterisierung (D-04, Plan 13-05)', () => {
    // Einmaliger, synchroner Sandbox-Aufbau auf Modulebene (wie
    // loadRenderMarkdownInContent() in tests/unit/markdown-converter.test.js) —
    // die Registry-Schluessel werden fuer test.each() bereits zur Sammelzeit
    // benoetigt, nicht erst in einem beforeAll-Hook.
    const sandbox = loadDmScreenSandbox(DMS_FIXTURE);
    const widgetDefs = sandbox.context.getDMScreenWidgets();
    const widgetTypes = Object.keys(widgetDefs);

    test('getDMScreenWidgets() liefert genau 21 Typen mit vollstaendigen Feldern', () => {
        expect(widgetTypes).toHaveLength(21);
        widgetTypes.forEach(type => {
            const def = widgetDefs[type];
            expect(typeof def.name).toBe('string');
            expect(typeof def.icon).toBe('string');
            expect(typeof def.render).toBe('function');
            expect(typeof def.compact).toBe('boolean');
        });
    });

    test('Widget "party" rendert deterministisches HTML gegen die volle Fixture (Tracer-Snapshot, Task 1)', () => {
        const html = widgetDefs.party.render();
        expect(typeof html).toBe('string');
        expect(html.trim().length).toBeGreaterThan(0);
        expect(html).toMatchSnapshot();
    });
});
