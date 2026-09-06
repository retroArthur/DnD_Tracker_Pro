/**
 * Tab-Registry — MAINT-02 (Plan 13-04)
 *
 * Vorher referenzierte TAB_RENDER_REGISTRY jede Renderfunktion als
 * Zeichenkette (`'renderDashboard'`), aufgelöst über `window[name]`. Eine
 * Umbenennung der Funktion brach dadurch nur eine `DEBUG_MODE`-Warnung zur
 * Laufzeit — die Ansicht blieb leer, ohne dass irgendein Test rot wurde.
 *
 * Diese Datei deckt zwei Klassen von Fällen ab:
 *
 * 1. Laufzeit: systems/tab-registry.js per `vm` in eine Sandbox laden, in der
 *    alle referenzierten Funktionen als jest.fn() definiert sind. Für jeden
 *    Tab wird geprüft, dass renderTabContent(tab) genau die zugehörigen
 *    Doubles aufruft — plus ein Fall, in dem eine Funktion FEHLT und der
 *    Aufruf weder wirft noch die übrigen Renderer überspringt.
 *
 * 2. Statisch: die im Registry-Literal genannten Bezeichner aus dem
 *    Quelltext extrahieren und für jeden prüfen, dass er als
 *    Top-Level-Deklaration (`function <name>(`) in mindestens einer der in
 *    loader.js MODULES gelisteten Dateien vorkommt. Dieser Fall ist der
 *    eigentliche Wächter gegen Umbenennung: er wird rot, sobald jemand eine
 *    Renderfunktion umbenennt, ohne die Registry nachzuziehen.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.join(__dirname, '../../systems/tab-registry.js');
const LOADER_PATH = path.join(__dirname, '../../loader.js');
const REPO_ROOT = path.join(__dirname, '../..');

const SOURCE = fs.readFileSync(MODULE_PATH, 'utf8');

// Alle Bezeichner, die TAB_RENDER_REGISTRY (im Quelltext, nicht in
// Kommentaren) als verzögerte Referenz `() => name` nennt.
function extractRegistryIdentifiers() {
    const start = SOURCE.indexOf('const TAB_RENDER_REGISTRY = {');
    const end = SOURCE.indexOf('\n/**', start); // Ende: JSDoc vor resolveTabFn()
    const registryBlock = SOURCE.slice(start, end);
    const matches = [...registryBlock.matchAll(/\(\)\s*=>\s*([A-Za-z_$][\w$]*)/g)];
    return [...new Set(matches.map(m => m[1]))];
}

// Alle Tab-Konfigurationen (renders/init/cleanup-Namen) direkt aus dem
// Quelltext geparst, unabhängig von der Laufzeit-Registry-Struktur.
function extractTabEntries() {
    const start = SOURCE.indexOf('const TAB_RENDER_REGISTRY = {');
    const end = SOURCE.indexOf('\n/**', start);
    const registryBlock = SOURCE.slice(start, end);
    const entryRegex = /(\w+):\s*\{\s*renders:\s*\[([^\]]*)\][^}]*?init:\s*([^,]+),[^}]*?cleanup:\s*([^\n]+?)\s*\n/g;
    const entries = {};
    let match;
    while ((match = entryRegex.exec(registryBlock)) !== null) {
        const [, tabName, rendersRaw, initRaw, cleanupRaw] = match;
        const renders = [...rendersRaw.matchAll(/\(\)\s*=>\s*([A-Za-z_$][\w$]*)/g)].map(m => m[1]);
        const initMatch = initRaw.match(/\(\)\s*=>\s*([A-Za-z_$][\w$]*)/);
        const cleanupMatch = cleanupRaw.match(/\(\)\s*=>\s*([A-Za-z_$][\w$]*)/);
        entries[tabName] = {
            renders,
            init: initMatch ? initMatch[1] : null,
            cleanup: cleanupMatch ? cleanupMatch[1] : null
        };
    }
    return entries;
}

const registryIdentifiers = extractRegistryIdentifiers();
const tabEntries = extractTabEntries();

describe('Tab-Registry — statische Deklarations-Prüfung (Wächter gegen Umbenennung)', () => {
    test('das Registry-Literal referenziert mindestens die bekannten Kern-Tabs', () => {
        // Schutz gegen einen leeren/kaputten Parser-Lauf oben — wenn dieser
        // Fall rot wird, ist der Test-Parser selbst kaputt, nicht die Registry.
        expect(Object.keys(tabEntries)).toEqual(expect.arrayContaining(['dashboard', 'party', 'dice']));
        expect(registryIdentifiers.length).toBeGreaterThan(20);
    });

    test.each(registryIdentifiers)(
        '%s ist als Top-Level-Deklaration in mindestens einer geladenen Datei vorhanden',
        identifier => {
            const declarationPattern = new RegExp(`^function ${identifier}\\(`, 'm');
            const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
            const modulesMatch = loaderSource.match(/const MODULES = \[([\s\S]*?)\n\];/);
            expect(modulesMatch).not.toBeNull();
            const moduleFiles = [...modulesMatch[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);

            const foundIn = moduleFiles.filter(relPath => {
                const fullPath = path.join(REPO_ROOT, relPath);
                if (!fs.existsSync(fullPath)) return false;
                return declarationPattern.test(fs.readFileSync(fullPath, 'utf8'));
            });

            expect(foundIn.length).toBeGreaterThan(0);
        }
    );
});

describe('Tab-Registry — Laufzeit (renderTabContent löst verzögerte Referenzen auf)', () => {
    function loadSandbox(definedFns) {
        const consoleWarn = jest.fn();
        const consoleError = jest.fn();
        const consoleLog = jest.fn();
        const errorHandlerLog = jest.fn();

        const context = {
            window: {
                APP_CONFIG: { DEBUG_MODE: false },
                ErrorHandler: { log: errorHandlerLog }
            },
            console: { warn: consoleWarn, error: consoleError, log: consoleLog }
        };
        // Jede referenzierte Funktion als jest.fn() ins globale Scope der
        // Sandbox legen — bare Identifier, wie es die Arrow-Refs erwarten.
        registryIdentifiers.forEach(name => {
            if (definedFns.has(name)) {
                context[name] = jest.fn();
            }
            // Absichtlich NICHT definiert, wenn nicht in definedFns — das
            // simuliert eine umbenannte/entfernte Funktion (ReferenceError
            // beim Auflösen, von resolveTabFn() gefangen).
        });

        vm.createContext(context);
        vm.runInContext(SOURCE, context);
        return { context, consoleWarn, consoleError, consoleLog, errorHandlerLog };
    }

    test('renderTabContent("dashboard") ruft genau renderDashboard auf', () => {
        const allFns = new Set(registryIdentifiers);
        const { context } = loadSandbox(allFns);

        context.renderTabContent('dashboard');

        expect(context.renderDashboard).toHaveBeenCalledTimes(1);
    });

    test('renderTabContent("initiative") ruft alle drei zugehörigen Renderer auf', () => {
        const allFns = new Set(registryIdentifiers);
        const { context } = loadSandbox(allFns);

        context.renderTabContent('initiative');

        expect(context.renderInit).toHaveBeenCalledTimes(1);
        expect(context.renderBattlefieldBanner).toHaveBeenCalledTimes(1);
        expect(context.renderQuickActionsBar).toHaveBeenCalledTimes(1);
    });

    test('renderTabContent("dice") ruft alle drei Dice-Renderer auf und lässt init aus (kein initDiceTab mehr)', () => {
        const allFns = new Set(registryIdentifiers);
        const { context } = loadSandbox(allFns);

        expect(() => context.renderTabContent('dice')).not.toThrow();

        expect(context.renderRandomTables).toHaveBeenCalledTimes(1);
        expect(context.renderDiceHistory).toHaveBeenCalledTimes(1);
        expect(context.renderDiceFavorites).toHaveBeenCalledTimes(1);
    });

    test('eine fehlende Funktion wirft nicht und überspringt die übrigen Renderer im selben Tab nicht', () => {
        // renderBattlefieldBanner bewusst NICHT definieren — simuliert eine
        // umbenannte/entfernte Funktion.
        const withoutOne = new Set(registryIdentifiers);
        withoutOne.delete('renderBattlefieldBanner');
        const { context, errorHandlerLog } = loadSandbox(withoutOne);
        // Diagnose läuft seit MAINT-06 (13-08) über ErrorHandler.log() hinter DEBUG_MODE,
        // nicht mehr über ein ungeguardetes console.warn.
        context.window.APP_CONFIG.DEBUG_MODE = true;

        expect(() => context.renderTabContent('initiative')).not.toThrow();

        expect(context.renderInit).toHaveBeenCalledTimes(1);
        expect(context.renderQuickActionsBar).toHaveBeenCalledTimes(1);
        expect(errorHandlerLog).toHaveBeenCalledWith(
            'TabRegistry',
            expect.objectContaining({ message: expect.stringContaining('renderBattlefieldBanner') })
        );
    });

    test('validateTabRegistry() wirft nicht, wenn Funktionen fehlen (DEBUG_MODE)', () => {
        const withoutOne = new Set(registryIdentifiers);
        withoutOne.delete('renderTimers');
        const { context } = loadSandbox(withoutOne);
        context.window.APP_CONFIG.DEBUG_MODE = true;

        expect(() => context.validateTabRegistry()).not.toThrow();
    });
});
