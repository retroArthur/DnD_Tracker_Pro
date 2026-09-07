/**
 * Modul-zu-Test-Abdeckungs-Gate — TEST-05/D-13 (Plan 14-09)
 *
 * Ersetzt eine globale Statement-Coverage-Schwelle, die fuer dieses Projekt
 * strukturell die falsche Messgroesse waere: der weit ueberwiegende Teil der
 * Unit-Tests laedt Produktionscode ueber einen selbstgebauten
 * `vm.createContext`/`readFileSync`-Ausfuehrungskontext, an den Istanbuls
 * Instrumentierung nicht herankommt, und ein weiterer Teil prueft Quelltext
 * als reinen Text (Konventions-/Musterpruefungen) und kann per Konstruktion
 * keine Statement-Coverage erzeugen (siehe `14-GATE-BASELINE.md`
 * Messblock 3/4). Ein Gate, das dagegen funktioniert: jedes Modul, das die
 * App laedt (`loader.js MODULES`, ARCH-01, Single Source of Truth), muss von
 * mindestens einem Test angefasst werden.
 *
 * Die Modulliste wird — wie in `tests/unit/console-hygiene.test.js` (13-08)
 * und `tests/unit/tab-registry.test.js` (13-04) — bei jedem Lauf frisch aus
 * `loader.js MODULES` extrahiert. Kein drittes Extraktions-Idiom: die
 * Extraktionsfunktion selbst wird aus `tools/generate-eslint-globals.js`
 * (D-08, Plan 14-02) wiederverwendet, nicht erneut geschrieben.
 *
 * KRITERIUM (hier festgelegt, nicht offen gelassen): ein Modul gilt als von
 * einem Test angefasst, wenn sein `loader.js`-relativer Pfad woertlich in
 * mindestens einer Datei unter `tests/` vorkommt (Pfadtrenner auf
 * Schraegstriche normalisiert). Das entspricht genau dem, was die Tests
 * dieses Projekts tatsaechlich tun — sie setzen den Modulpfad zusammen und
 * lesen die Datei ein. Die naheliegende Alternative (Basisname ohne Endung
 * als Teilzeichenkette) wurde geprueft und verworfen: sie erzeugt
 * falsch-positive Treffer, weil ein Feature-Modulname in E2E-Specs auch als
 * Bestandteil eines DOM-Bezeichners auftaucht, ohne dass ein Test das Modul
 * je liest (siehe `14-GATE-BASELINE.md` Messblock 4, Beispiel
 * `npc-generator.js`/`data-action="show-npc-generator"`). Eine falsche
 * Abdeckungs-Zusicherung nimmt ein Modul dauerhaft und unsichtbar aus dem
 * Gate heraus; eine laengere, datierte Ausnahmeliste ist sichtbar und
 * schrumpfbar. Im Zweifel die ehrlichere Zahl — deshalb das Pfad-Kriterium,
 * obwohl es die laengere Liste ergibt (78 statt 62 Module, siehe
 * `14-GATE-BASELINE.md` Messblock 4 fuer beide Zahlen nebeneinander).
 *
 * AUSNAHMELISTE — erhoben am 2026-09-07, NACH der Aufteilung aus den
 * Plaenen 14-04 (E2E) und 14-05 (Unit), gegen die zu diesem Zeitpunkt
 * tatsaechlich vorhandene Testdateimenge (48 Suiten / 1112 Tests). Die Liste
 * darf NUR SCHRUMPFEN: ein neues, unabgedecktes Modul in `loader.js MODULES`
 * aufzunehmen UND es hier einzutragen statt einen Test dafuer zu schreiben,
 * ist ausgeschlossen (Prohibition dieses Plans). Ein Eintrag, der nicht mehr
 * in `loader.js MODULES` steht (verwaist) oder inzwischen abgedeckt ist,
 * laesst diesen Test fehlschlagen — siehe die beiden entsprechenden
 * Testfaelle unten.
 */

const fs = require('fs');
const path = require('path');
const { extractModulesFromLoader } = require('../../tools/generate-eslint-globals.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
const TESTS_DIR = path.join(REPO_ROOT, 'tests');

/**
 * Sammelt rekursiv alle Dateipfade unter `dir`.
 */
function walk(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(walk(full));
        } else {
            results.push(full);
        }
    }
    return results;
}

/**
 * Normalisiert Pfadtrenner auf Schraegstriche, damit der Vergleich unter
 * Windows (Backslash) und POSIX (Slash) identisch funktioniert.
 */
function toPosix(p) {
    return p.split(path.sep).join('/');
}

const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
const modules = extractModulesFromLoader(loaderSource);

// Diese Datei selbst wird von der Abdeckungspruefung ausgenommen: sie zitiert
// jeden Ausnahmeliste-Eintrag woertlich als String-Literal (MODULE_TEST_EXCEPTIONS
// unten), was sonst jeden dieser Pfade faelschlich als "abgedeckt" markieren
// wuerde — eine Erwaehnung zur Gate-Beruhigung, kein tatsaechlicher Test (siehe
// Kopfkommentar/Prohibitions dieses Plans). Ohne diesen Ausschluss koennte der
// Ratschen-Testfall unten niemals rot werden.
const SELF_PATH = path.resolve(__filename);
const testFilePaths = walk(TESTS_DIR).filter(f => path.resolve(f) !== SELF_PATH);
const testFileContents = testFilePaths.map(f => fs.readFileSync(f, 'utf8'));

/**
 * Ein Modul gilt als abgedeckt, wenn sein `loader.js`-relativer Pfad
 * woertlich (nach Normalisierung der Pfadtrenner) in mindestens einer Datei
 * unter `tests/` vorkommt.
 */
function isCovered(relModulePath) {
    const needle = toPosix(relModulePath);
    return testFileContents.some(content => content.includes(needle));
}

// Alphabetisch sortierte Ausnahmeliste, ein Pfad pro Zeile. Erhebungsdatum:
// 2026-09-07 (Plan 14-09), nach den Aufteilungen aus 14-04/14-05.
const MODULE_TEST_EXCEPTIONS = [
    'core/themes.js',
    'features/bestiary/bestiary-actions.js',
    'features/bestiary/bestiary-crud.js',
    'features/bestiary/bestiary-render.js',
    'features/command-palette/command-palette.js',
    'features/dice-stats/dice-stats-render.js',
    'features/dice/dice-core.js',
    'features/dice/dice-favorites.js',
    'features/encounter-calculator.js',
    'features/encounters/encounters-crud.js',
    'features/encounters/monster-templates.js',
    'features/fraktionen/fraktionen-crud.js',
    'features/fraktionen/fraktionen-render.js',
    'features/initiative-extras.js',
    'features/initiative-statblock.js',
    'features/locations/locations-crud.js',
    'features/locations/locations-render.js',
    'features/loot-distribution.js',
    'features/npc-generator/npc-default-tables.js',
    'features/npc-generator/npc-generator.js',
    'features/npcs/npc-crud.js',
    'features/npcs/npc-interactions.js',
    'features/npcs/npc-popup.js',
    'features/party/party-crud.js',
    'features/party/party-details.js',
    'features/quests/quests-crud.js',
    'features/quests/quests-render.js',
    'features/quick-actions.js',
    'features/reise/reise-crud.js',
    'features/reise/reise-default-tables.js',
    'features/reise/reise-render.js',
    'features/render-dashboard.js',
    'features/render-loot.js',
    'features/render-spells.js',
    'features/rest-manager.js',
    'features/session-prep/session-prep-crud.js',
    'features/session-prep/session-prep-render.js',
    'features/sessions/sessions.js',
    'features/shops/links.js',
    'features/shops/shop-export.js',
    'features/shops/shops-core.js',
    'features/soundboard/soundboard-render.js',
    'features/timeline/timeline-crud.js',
    'features/timeline/timeline-render.js',
    'features/timers/timers.js',
    'systems/conditions.js',
    'systems/entity-links.js',
    'systems/file-backup/file-backup-permissions.js',
    'systems/file-backup/file-backup-ui.js',
    'systems/hp-calculator.js',
    'systems/markdown-import-export.js',
    'systems/session-timer.js',
    'systems/spellslots/keyboard-shortcuts.js',
    'systems/spellslots/navigation.js',
    'systems/spellslots/notes-templates.js',
    'systems/spellslots/pwa-install.js',
    'systems/spellslots/spell-slots-core.js',
    'systems/spellslots/spellslots-ui.js',
    'systems/spellslots/virtual-list.js',
    'systems/tags.js',
    'systems/wiki-links.js',
    'tools/debug.js',
    'ui/actions/combat-actions.js',
    'ui/actions/dice-actions.js',
    'ui/actions/entity-actions.js',
    'ui/actions/shop-actions.js',
    'ui/actions/wiki-actions.js',
    'ui/dom-builder.js',
    'ui/layout-profiles.js',
    'ui/lazy-loading.js',
    'ui/safe-render.js',
    'ui/virtual-scroll.js',
    'utils/crud-helpers.js',
    'utils/filter-engine.js',
    'utils/form-helpers.js',
    'utils/game-rules.js',
    'utils/performance-extras.js',
    'utils/performance.js'
];

describe('Modul-zu-Test-Abdeckungs-Gate (TEST-05/D-13)', () => {
    test('leitet mindestens ein Modul aus loader.js MODULES ab', () => {
        if (modules.length === 0) {
            throw new Error(
                'module-test-coverage: Konnte das MODULES-Array in loader.js nicht extrahieren ' +
                    '— 0 Module gefunden. Ein leer-gruener Waechter waere schlimmer als keiner.'
            );
        }
        expect(modules.length).toBeGreaterThan(0);
    });

    test('jedes Modul ist entweder von einem Test angefasst oder auf der datierten Ausnahmeliste', () => {
        expect(modules.length).toBeGreaterThan(0);

        const exceptionSet = new Set(MODULE_TEST_EXCEPTIONS);
        const violations = [];

        for (const relPath of modules) {
            if (exceptionSet.has(relPath)) continue;
            if (!isCovered(relPath)) {
                violations.push(relPath);
            }
        }

        if (violations.length > 0) {
            throw new Error(
                `Module ohne Testerwaehnung und ohne Ausnahmeliste-Eintrag (${violations.length}):\n` +
                    violations.join('\n') +
                    '\n\nDer richtige Weg ist ein Test, der dieses Modul liest — nicht ein neuer ' +
                    'Eintrag in MODULE_TEST_EXCEPTIONS (siehe Kopfkommentar dieser Datei).'
            );
        }
        expect(violations.length).toBe(0);
    });

    test('kein Eintrag der Ausnahmeliste ist verwaist (steht noch in loader.js MODULES)', () => {
        const moduleSet = new Set(modules);
        const orphaned = MODULE_TEST_EXCEPTIONS.filter(entry => !moduleSet.has(entry));

        if (orphaned.length > 0) {
            throw new Error(
                `Verwaiste Ausnahmeliste-Eintraege, nicht mehr in loader.js MODULES (${orphaned.length}):\n` +
                    orphaned.join('\n') +
                    '\n\nDiese Eintraege muessen aus MODULE_TEST_EXCEPTIONS entfernt werden.'
            );
        }
        expect(orphaned.length).toBe(0);
    });

    test('kein Eintrag der Ausnahmeliste ist inzwischen abgedeckt (Ratsche)', () => {
        const nowCovered = MODULE_TEST_EXCEPTIONS.filter(entry => isCovered(entry));

        if (nowCovered.length > 0) {
            throw new Error(
                `Ausnahmeliste-Eintraege, die inzwischen von einem Test abgedeckt sind (${nowCovered.length}):\n` +
                    nowCovered.join('\n') +
                    '\n\nDiese Eintraege muessen aus MODULE_TEST_EXCEPTIONS gestrichen werden — ' +
                    'die Liste darf nur schrumpfen.'
            );
        }
        expect(nowCovered.length).toBe(0);
    });
});
