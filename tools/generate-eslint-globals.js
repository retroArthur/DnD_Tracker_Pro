'use strict';

/**
 * ESLint-Globals-Generator — D-08 (Plan 14-02, Tracer)
 *
 * Leitet die Liste der projekteigenen Cross-Modul-Globals aus
 * `loader.js MODULES` ab (ARCH-01, Single Source of Truth) und schreibt sie
 * als eingechecktes Artefakt (`eslint.generated-globals.js`), das
 * `eslint.config.js` per `import` einliest. `tests/unit/eslint-globals-freshness.test.js`
 * benutzt genau diesen Code, um Drift zu erkennen — keine Parallelimplementierung.
 *
 * CommonJS mit `module.exports`, damit Regenerierungs-Skript und Jest-Test
 * denselben Code ausfuehren.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
const OUTPUT_PATH = path.join(REPO_ROOT, 'eslint.generated-globals.js');
const REGEN_COMMAND = 'npm run globals:generate';

/**
 * Extrahiert die Dateipfade aus dem `const MODULES = [...]`-Array in loader.js.
 * Rein textbasiert (kein Parser) — identisches Idiom wie
 * `tests/unit/console-hygiene.test.js`: MODULES-Array per regulaerem Ausdruck
 * greifen, dann einfache und doppelte Anfuehrungszeichen einsammeln. Damit
 * muss ein kuenftiger loader.js-Formatwechsel nur an einer Stelle repariert
 * werden.
 *
 * @param {string} source - Inhalt von loader.js (oder eines Textes ohne
 *   MODULES-Array, in welchem Fall eine leere Liste zurueckgegeben wird).
 * @returns {string[]} relative Pfade der gelisteten Module.
 */
function extractModulesFromLoader(source) {
    const match = source.match(/const\s+MODULES\s*=\s*\[([\s\S]*?)\];/);
    if (!match) return [];
    const body = match[1];
    const entries = [];
    const entryPattern = /'([^']+)'|"([^"]+)"/g;
    let m;
    while ((m = entryPattern.exec(body)) !== null) {
        entries.push(m[1] || m[2]);
    }
    return entries;
}

// Deklarationsmuster: bewusste, begruendete Abweichung gegenueber build.py's
// check_duplicate_functions() (dort: function|const|let|class, kein async,
// kein var). Ein Duplikatpruefer darf konservativ sein — ein Globals-Generator
// darf das nicht, sonst bleiben Namen undeklariert und no-undef: error ist in
// 14-06 nicht erreichbar. Gegen den Live-Baum gemessen gibt es 57 Top-Level-
// `async function`- und 22 Top-Level-`var`-Deklarationen mit echtem
// Initialisierer (siehe PLAN.md Task 1 <action> fuer Fundstellen). Aliase der
// Form `var X = window.X` werden absichtlich mit aufgenommen — unschaedlich,
// da der Name ohnehin anderswo deklariert ist. Die Deklarationsart (Gruppe 1)
// wird erfasst, um zwischen 'readonly' und 'writable' zu unterscheiden (siehe
// unten) — nicht Teil der urspruenglichen Task-Beschreibung, aber notwendig:
// ein pauschales 'readonly' erzeugt echte no-global-assign-Fehler fuer
// `let`/`var`-deklarierte Cross-Modul-Globals, die andere Module neu zuweisen
// (z. B. `encounterRound` in systems/undo.js, neu zugewiesen in
// core/init.js) — dasselbe Muster, das den bestehenden Handeintrag
// `D: 'writable'` begruendet.
const DECLARATION_PATTERN = /^\s*(?:async\s+)?(function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/;

// Deklarationsarten, deren Bindung von anderen Modulen neu zugewiesen wird
// (kein re-`let`/`var`, sondern direkte Zuweisung wie `encounterRound = 1`
// oder `encounterRound++`). `const`, `function` und `class` bleiben
// 'readonly' — eine Neuzuweisung dieser Bindungen waere ein echter Fehler,
// den `no-global-assign` zu Recht faengt.
const MUTABLE_DECLARATION_KEYWORDS = new Set(['let', 'var']);

/**
 * Liest jede in `loader.js MODULES` gelistete Datei und sammelt alle
 * Bezeichner, die auf Klammertiefe 0 deklariert werden. Portiert build.py's
 * `check_duplicate_functions()`-Verfahren (Klammertiefe zeilenweise
 * mitfuehren, Tiefe VOR der Aktualisierung der Zeile auswerten, damit die
 * Deklarationszeile selbst noch auf Tiefe 0 zaehlt) nach JavaScript.
 * Nicht vorhandene Dateien werden uebersprungen, nicht als Fehler behandelt.
 *
 * @returns {Object<string,string>} Objekt mit Bezeichner -> 'readonly' | 'writable'.
 */
function generateGlobalsFromModules() {
    const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
    const modules = extractModulesFromLoader(loaderSource);
    const globals = {};

    for (const relPath of modules) {
        const absPath = path.join(REPO_ROOT, relPath);
        if (!fs.existsSync(absPath)) continue;
        const content = fs.readFileSync(absPath, 'utf8');
        let depth = 0;
        for (const line of content.split('\n')) {
            const match = depth === 0 ? line.match(DECLARATION_PATTERN) : null;
            for (const ch of line) {
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
            }
            if (match) {
                const [, keyword, name] = match;
                const access = MUTABLE_DECLARATION_KEYWORDS.has(keyword) ? 'writable' : 'readonly';
                // 'writable' gewinnt gegen 'readonly', falls derselbe Name an
                // mehreren Stellen deklariert wird (z. B. eine `const`-Fassade
                // in einem Modul und ein `let` in einem anderen) — die
                // schwaechste Bindung im Quellbaum ist massgeblich, sonst
                // faengt no-global-assign eine echte Zuweisung faelschlich ab.
                if (globals[name] !== 'writable') {
                    globals[name] = access;
                }
            }
        }
    }

    return globals;
}

/**
 * Erzeugt den Dateitext fuer `eslint.generated-globals.js`: Kopfkommentar mit
 * Regenerierungsbefehl, danach `export default` mit alphabetisch sortierten,
 * in Anfuehrungszeichen gesetzten Schluesseln. Schluessel werden als
 * JSON-String-Literale ausgegeben, nicht als nackte Bezeichner — der
 * Generator liest fremden Quelltext und darf keinen daraus stammenden Text
 * unquotiert in eine ausfuehrbare Datei schreiben (Bedrohungsmodell T-14-05).
 * Der Wert je Name ('readonly' oder 'writable') kommt unveraendert aus
 * `globalsObject` — beides sind feste, generatorseitig festgelegte Texte,
 * kein aus dem Quelltext uebernommener String.
 *
 * @param {Object<string,string>} globalsObject
 * @returns {string}
 */
function renderGlobalsArtifact(globalsObject) {
    const sortedKeys = Object.keys(globalsObject).sort();
    const lines = sortedKeys.map(key => {
        const access = globalsObject[key] === 'writable' ? 'writable' : 'readonly';
        return `    ${JSON.stringify(key)}: '${access}'`;
    });
    return (
        '// AUTOMATISCH ERZEUGT — NICHT VON HAND BEARBEITEN.\n' +
        `// Regenerieren mit: ${REGEN_COMMAND}\n` +
        '// Quelle: tools/generate-eslint-globals.js liest loader.js MODULES (ARCH-01).\n' +
        '// Drift-Waechter: tests/unit/eslint-globals-freshness.test.js\n' +
        'export default {\n' +
        lines.join(',\n') +
        '\n};\n'
    );
}

module.exports = {
    extractModulesFromLoader,
    generateGlobalsFromModules,
    renderGlobalsArtifact
};

// Direktaufruf-Zweig (Plan 14-02, Task 3): schreibt eslint.generated-globals.js
// im Projekt-Wurzelverzeichnis und meldet die Anzahl der geschriebenen Namen
// auf stdout. Kein Schreiben des Dateiinhalts auf stdout, keine
// Shell-Umleitung noetig — die Datei schreibt sich selbst, damit der Befehl
// unter PowerShell, cmd und Git Bash gleich funktioniert.
if (require.main === module) {
    const globals = generateGlobalsFromModules();
    const content = renderGlobalsArtifact(globals);
    fs.writeFileSync(OUTPUT_PATH, content, 'utf8');
    console.log(`${Object.keys(globals).length} Namen nach eslint.generated-globals.js geschrieben.`);
}
