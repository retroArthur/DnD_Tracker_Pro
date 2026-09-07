/**
 * Aktionsziel-Integritaets-Gate — TEST-05/D-09 (Nyquist-Gap-Fix, 2026-09-07)
 *
 * Verifiziert, dass jeder Eintrag in `ALLOWED_CHANGE_HANDLERS`
 * (ui/event-delegation.js) einen Bezeichner benennt, der irgendwo im
 * Quellbaum tatsaechlich deklariert ist. Ohne dieses Gate kann ein toter
 * Name (Tippfehler, geloeschte Funktion, verwaiste Migration) unbemerkt in
 * der Whitelist stehen bleiben — ESLints `no-undef` sieht ihn nicht, weil er
 * nur als String-Literal auftaucht (siehe D-09, 14-CONTEXT.md).
 *
 * Wiederverwendet `generateGlobalsFromModules()` aus
 * `tools/generate-eslint-globals.js` (D-08) als Quelle deklarierter
 * Top-Level-Bezeichner — kein drittes Extraktions-Idiom (Konvention dieser
 * Phase, siehe tests/unit/module-test-coverage.test.js Kopfkommentar).
 *
 * AUSNAHMELISTE: leer erhoben am 2026-09-07. Ein Eintrag hier muss datiert
 * und begruendet sein (Name ist zwar in ALLOWED_CHANGE_HANDLERS erlaubt,
 * aber legitim ausserhalb des per Generator erfassten Bereichs deklariert,
 * z.B. eine globale Browser-API). Analog zu MODULE_TEST_EXCEPTIONS in
 * tests/unit/module-test-coverage.test.js.
 */

const fs = require('fs');
const path = require('path');
const { generateGlobalsFromModules } = require('../../tools/generate-eslint-globals.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const EVENT_DELEGATION_PATH = path.join(REPO_ROOT, 'ui', 'event-delegation.js');

// Datierte Ausnahmeliste (siehe Kopfkommentar). Aktuell leer.
const ACTION_TARGET_EXCEPTIONS = [];

/**
 * Extrahiert die Eintraege des `ALLOWED_CHANGE_HANDLERS`-Sets rein
 * textbasiert (kein Parser), analog zum Idiom in
 * tests/unit/module-test-coverage.test.js.
 */
function extractAllowedChangeHandlers(source) {
    const match = source.match(/const\s+ALLOWED_CHANGE_HANDLERS\s*=\s*new Set\(\[([\s\S]*?)\]\)/);
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

describe('Aktionsziel-Integritaets-Gate (TEST-05/D-09)', () => {
    test('extrahiert mindestens einen Eintrag aus ALLOWED_CHANGE_HANDLERS', () => {
        const source = fs.readFileSync(EVENT_DELEGATION_PATH, 'utf8');
        const handlers = extractAllowedChangeHandlers(source);
        expect(handlers.length).toBeGreaterThan(0);
    });

    test('jeder ALLOWED_CHANGE_HANDLERS-Eintrag ist irgendwo im Quellbaum deklariert oder auf der Ausnahmeliste', () => {
        const source = fs.readFileSync(EVENT_DELEGATION_PATH, 'utf8');
        const handlers = extractAllowedChangeHandlers(source);
        const declaredGlobals = generateGlobalsFromModules();
        const exceptionSet = new Set(ACTION_TARGET_EXCEPTIONS);

        const deadEntries = handlers.filter(
            name => !(name in declaredGlobals) && !exceptionSet.has(name)
        );

        if (deadEntries.length > 0) {
            throw new Error(
                `Tote Eintraege in ALLOWED_CHANGE_HANDLERS (${deadEntries.length}), kein ` +
                    `deklarierter Bezeichner im Quellbaum:\n${deadEntries.join('\n')}\n\n` +
                    'Gemaess D-09: wenn kein Treffer in assets/templates/ vorliegt, Registrierung ' +
                    'entfernen; sonst echten Bedienfehler beheben, nicht loeschen.'
            );
        }
        expect(deadEntries.length).toBe(0);
    });
});
