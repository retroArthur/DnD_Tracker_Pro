/**
 * ESLint-Globals-Freshness — D-08 (Plan 14-02, Tracer)
 *
 * Drift-Waechter fuer `eslint.generated-globals.js`: das Artefakt wird aus
 * `loader.js MODULES` abgeleitet (derselbe Code erzeugt Artefakt und
 * Erwartung, siehe `tools/generate-eslint-globals.js`) und darf nicht von
 * Hand nachbearbeitet werden, ohne dass dieser Test rot wird.
 *
 * Struktur wie `tests/unit/console-hygiene.test.js` (13-08): Dateisatz aus
 * `loader.js MODULES` ableiten, ein Leer-gruen-Waechter, dann die eigentliche
 * Pruefung. Zusaetzlich ein dauerhaft eingebauter Fail-first-Nachweis, dass
 * die Vergleichslogik selbst in der Lage ist, rot zu werden — ohne dass dafuer
 * eine eingecheckte Datei angefasst werden muss.
 */

const fs = require('fs');
const path = require('path');
const {
    extractModulesFromLoader,
    generateGlobalsFromModules
} = require('../../tools/generate-eslint-globals.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
const ARTIFACT_PATH = path.join(REPO_ROOT, 'eslint.generated-globals.js');
const REGEN_COMMAND = 'npm run globals:generate';

/**
 * Vergleicht zwei Namensmengen und meldet, welche Namen fehlen (in `actualKeys`
 * nicht vorhanden) und welche ueberzaehlig sind (in `actualKeys`, aber nicht in
 * `expectedKeys`). Bewusst lokal in dieser Testdatei implementiert, nicht im
 * Generator exportiert — der Generator exportiert genau drei Namen
 * (`extractModulesFromLoader`, `generateGlobalsFromModules`,
 * `renderGlobalsArtifact`).
 */
function diffKeySets(expectedKeys, actualKeys) {
    const expectedSet = new Set(expectedKeys);
    const actualSet = new Set(actualKeys);
    return {
        missing: [...expectedSet].filter(k => !actualSet.has(k)).sort(),
        extra: [...actualSet].filter(k => !expectedSet.has(k)).sort()
    };
}

/**
 * Gewinnt die sortierten Objekt-Schluessel aus dem eingecheckten ESM-Artefakt
 * per Text-Regex. Vermeidet die ESM/CommonJS-Reibung eines dynamischen Imports
 * im vorhandenen Jest-Setup — Projektkonvention (Quelltext-als-Text-Pruefung
 * wie in `console-hygiene.test.js` und `tab-registry.test.js`).
 */
function extractArtifactKeys(source) {
    const keyPattern = /^\s*"([^"]+)":\s*'(?:readonly|writable)'/gm;
    const keys = [];
    let m;
    while ((m = keyPattern.exec(source)) !== null) {
        keys.push(m[1]);
    }
    return keys;
}

describe('ESLint-Globals-Freshness (D-08)', () => {
    test('extrahiert mindestens ein Modul aus loader.js MODULES', () => {
        const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
        const modules = extractModulesFromLoader(loaderSource);
        if (modules.length === 0) {
            throw new Error(
                'eslint-globals-freshness: Konnte das MODULES-Array in loader.js nicht extrahieren — 0 Module gefunden. ' +
                    'Ein leer-gruener Test waere schlimmer als keiner.'
            );
        }
        expect(modules.length).toBeGreaterThan(0);
    });

    test('der Drift-Vergleich erkennt sowohl einen entfernten als auch einen hinzugefuegten Namen (Fail-first-Nachweis)', () => {
        const freshGlobals = generateGlobalsFromModules();
        const freshKeys = Object.keys(freshGlobals);
        expect(freshKeys.length).toBeGreaterThan(0);

        // Kuenstlich veraltete Namensmenge: einen echten Namen entfernen, einen
        // erfundenen hinzufuegen — simuliert ein von Hand editiertes Artefakt,
        // ohne dass dafuer eine eingecheckte Datei angefasst werden muss.
        const removedName = freshKeys[0];
        const fakeName = '__eslint_globals_freshness_fake_name__';
        const driftedKeys = freshKeys.slice(1).concat(fakeName);

        const diff = diffKeySets(freshKeys, driftedKeys);

        expect(diff.missing).toContain(removedName);
        expect(diff.extra).toContain(fakeName);
    });

    test('eslint.generated-globals.js ist identisch mit generateGlobalsFromModules() (kein Drift)', () => {
        expect(fs.existsSync(ARTIFACT_PATH)).toBe(true);
        const artifactSource = fs.readFileSync(ARTIFACT_PATH, 'utf8');
        const artifactKeys = extractArtifactKeys(artifactSource).sort();

        const freshGlobals = generateGlobalsFromModules();
        const freshKeys = Object.keys(freshGlobals).sort();

        const diff = diffKeySets(freshKeys, artifactKeys);

        if (diff.missing.length > 0 || diff.extra.length > 0) {
            throw new Error(
                'eslint.generated-globals.js ist veraltet gegenueber loader.js MODULES.\n' +
                    `Fehlende Namen (im Artefakt nicht vorhanden): ${diff.missing.join(', ') || '(keine)'}\n` +
                    `Ueberzaehlige Namen (im Artefakt, aber nicht mehr im Quellbaum): ${diff.extra.join(', ') || '(keine)'}\n` +
                    `Regenerieren mit: ${REGEN_COMMAND}`
            );
        }

        expect(artifactKeys).toEqual(freshKeys);
    });
});
