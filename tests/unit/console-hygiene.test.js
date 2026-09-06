/**
 * Console-Hygiene Test — MAINT-06 (13-08)
 *
 * Prueft, dass kein in `loader.js` `MODULES` gelistetes Modul mehr ungefiltert auf
 * die Browser-Konsole schreibt. Der Dateisatz wird bei jedem Lauf frisch aus dem
 * `MODULES`-Array in `loader.js` extrahiert — dieselbe einzige Liste, die auch
 * `build.py` liest (ARCH-01, Phase 11). Es gibt bewusst keine zweite, handgepflegte
 * Liste in dieser Datei.
 *
 * Genau EIN Ausgang ist sanktioniert: die Ausgabe in `ErrorHandler.log()`
 * (render/helpers.js), markiert mit dem Kennzeichen `gsd:konsolen-senke` auf
 * derselben Zeile. Jede andere Fundstelle ist ein Verstoss.
 *
 * Hinweis zur eigenen Lesbarkeit dieser Datei: die gesuchten Methodennamen des
 * Konsolenobjekts duerfen in dieser Datei nur EINMAL vorkommen — im Suchmuster
 * selbst. Kommentare in dieser Datei vermeiden die Namen deshalb bewusst.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
const SANCTIONED_MARKER = 'gsd:konsolen-senke';

/**
 * Extrahiert die Dateipfade aus dem `const MODULES = [...]`-Array in loader.js.
 * Rein textbasiert (kein Parser) — robust genug fuer ein einfaches String-Array.
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

const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
const modules = extractModulesFromLoader(loaderSource);

// Ein Suchmuster fuer nicht-gefilterte Ausgaben auf das Konsolenobjekt.
// Dies ist die einzige Stelle in dieser Datei, an der die Methodennamen stehen.
const UNFILTERED_OUTPUT_PATTERN = /console\.(log|warn|error|info|debug|trace)\s*\(/;

describe('Console-Hygiene (MAINT-06)', () => {
    test('leitet mindestens ein Modul aus loader.js MODULES ab', () => {
        if (modules.length === 0) {
            throw new Error(
                'console-hygiene: Konnte das MODULES-Array in loader.js nicht extrahieren — 0 Module gefunden. ' +
                    'Ein leer-gruener Test waere schlimmer als keiner.'
            );
        }
        expect(modules.length).toBeGreaterThan(0);
    });

    test('kein Modul aus loader.js MODULES schreibt noch ungefiltert auf die Konsole', () => {
        expect(modules.length).toBeGreaterThan(0);

        const violations = [];

        for (const relPath of modules) {
            const absPath = path.join(REPO_ROOT, relPath);
            if (!fs.existsSync(absPath)) {
                violations.push(`${relPath}: Datei aus loader.js MODULES existiert nicht auf der Platte`);
                continue;
            }
            const source = fs.readFileSync(absPath, 'utf8');
            const lines = source.split('\n');
            lines.forEach((line, idx) => {
                if (UNFILTERED_OUTPUT_PATTERN.test(line) && !line.includes(SANCTIONED_MARKER)) {
                    violations.push(`${relPath}:${idx + 1}: ${line.trim()}`);
                }
            });
        }

        if (violations.length > 0) {
            throw new Error(
                `Ungefilterte Konsolenaufrufe gefunden (${violations.length}):\n` + violations.join('\n')
            );
        }
        expect(violations.length).toBe(0);
    });

    test('genau ein sanktionierter Ausgang ist markiert', () => {
        const helpersPath = path.join(REPO_ROOT, 'render', 'helpers.js');
        const helpersSource = fs.readFileSync(helpersPath, 'utf8');
        const markerCount = (helpersSource.match(new RegExp(SANCTIONED_MARKER, 'g')) || []).length;
        expect(markerCount).toBe(1);
    });
});
