/**
 * Lint-Gate — R09 (Code-Review 2026-09-21, Einheit U1)
 *
 * Ausfuehrbarer Waechter fuer `npm run lint` (package.json scripts.lint,
 * `eslint . --max-warnings N`). Vorher existierte die Ratsche nur als Prosa-
 * Regel (D-10) und lief ausschliesslich in CI (.github/workflows/ci.yml) —
 * kein lokaler Test fuehrte ESLint aus. So blieb unbemerkt, dass ein
 * generiertes Design-Handoff-Bundle unter Anpassungen/ (support.js,
 * "GENERATED ... do not edit") in den Lint-Umfang geriet: 5 no-undef-Fehler
 * und 5 no-empty-Warnungen ueber der exakt gepinnten Grenze.
 *
 * Geprueft wird:
 *   1. Design-Handoffs unter Anpassungen/ sind global ausgenommen (auch
 *      kuenftige — synthetischer Pfad).
 *   2. Lokale Werkzeug-/Report-/Worktree-Ordner sind ausgenommen (ESLint 9
 *      Flat Config liest .gitignore NICHT und lintet Punkt-Ordner).
 *   3. Waechter gegen einen zu breiten Ignore: jedes loader.js-MODULES-Modul
 *      und eine Stichprobe produktiver Pfade bleiben im Lint-Umfang.
 *   4. 0 Fehler.
 *   5. Warnungszahl == --max-warnings-Pin (exakt). Faellt die Zahl, muss der
 *      Pin im selben Commit mitfallen (D-10 verschaerft: "nur fallen darf" ->
 *      der Pin folgt jeder Senkung sofort).
 *   6. Der Service Worker (sw.js) ist gelintet und befundfrei (R08, Einheit
 *      U9). Er stand seit dem Initial-Commit ohne Begruendung in den globalen
 *      Ausschluessen; ein eigener Konfigurationsblock schaltet dort die
 *      Fenster- und App-Globals ab (der SW laeuft im
 *      ServiceWorkerGlobalScope, nicht im Fenster).
 *
 * ESLint laeuft in einem Kind-Prozess: eslint.config.js ist ESM und wird von
 * ESLint per dynamischem import() geladen, was im Jest-VM-Kontext nicht
 * verlaesslich funktioniert (vgl. eslint-globals-freshness.test.js). Ein
 * einziger Lauf in beforeAll (~3 s) versorgt alle Testfaelle.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { extractModulesFromLoader } = require('../../tools/generate-eslint-globals.js');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');

// Echte, versionierte Handoff-Datei (Quelle der 5 no-undef-Fehler) und ein
// synthetischer Pfad fuer kuenftige Handoffs — isPathIgnored() arbeitet
// musterbasiert und braucht keine existierende Datei.
const HANDOFF_FILE =
    'Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/support.js';
const HANDOFF_SYNTHETIC = 'Anpassungen/kuenftiger-handoff/bundle.js';

// Lokale Artefakt-Ordner. Gemessen: ein fehlgeschlagener lokaler Playwright-
// Lauf kopiert den Trace-Viewer nach tests/e2e/reports/trace/ (+220 Fehler);
// ein Claude-Worktree unter .claude/worktrees/ wuerde jede Zahl verdoppeln.
const LOCAL_ARTIFACT_PROBES = [
    'tests/e2e/reports/trace/sw.bundle.js',
    'tests/e2e/test-results/x/y.js',
    'tests/e2e/test-results-smoke/x/y.js',
    'playwright-report/trace/index.js',
    '.claude/worktrees/wt/core/data.js'
];

// Stichprobe produktiver Pfade, die NIE ignoriert werden duerfen. Bewusst
// keine Pfade aus MODULE_TEST_EXCEPTIONS (module-test-coverage.test.js):
// eine woertliche Erwaehnung hier wuerde dort die Ratsche ausloesen.
const PRODUCTIVE_PROBES = [
    'core/data.js',
    'utils/utilities.js',
    'systems/backups.js',
    'features/random-tables.js',
    'render/helpers.js',
    'ui/event-delegation.js',
    'loader.js',
    'eslint.config.js',
    'tools/generate-eslint-globals.js',
    'tests/unit/backups.test.js'
];

// Service Worker im Projektwurzelverzeichnis (R08). Nicht in loader.js
// MODULES, laeuft nicht im Fenster — eigener Konfigurationsblock.
const SERVICE_WORKER = 'sw.js';

const PROBE_PATHS = [
    HANDOFF_FILE,
    HANDOFF_SYNTHETIC,
    ...LOCAL_ARTIFACT_PROBES,
    ...PRODUCTIVE_PROBES,
    SERVICE_WORKER
];

// Kind-Prozess-Skript: lintet genau wie `npm run lint` (`eslint .` mit der
// Projektkonfiguration) und gibt EIN JSON-Objekt auf stdout aus.
const PROBE = `
const path = await import('node:path');
const { ESLint } = await import('eslint');
const probePaths = JSON.parse(process.argv[1]);
const cwd = process.cwd();
const eslint = new ESLint({ cwd });
const results = await eslint.lintFiles(['.']);
const toRel = abs => path.relative(cwd, abs).split(path.sep).join('/');
const errorMessages = [];
const warningsByRule = {};
const perFile = {};
let errors = 0;
let warnings = 0;
for (const r of results) {
    errors += r.errorCount + r.fatalErrorCount;
    warnings += r.warningCount;
    const rel = toRel(r.filePath);
    if (probePaths.includes(rel)) {
        perFile[rel] = {
            errors: r.errorCount + r.fatalErrorCount,
            warnings: r.warningCount,
            messages: r.messages
                .slice(0, 20)
                .map(m => m.line + ' ' + (m.ruleId || '(parse)') + ' ' + m.message)
        };
    }
    for (const m of r.messages) {
        const rule = m.ruleId || '(unused-disable-directive/parse)';
        if (m.severity === 2 || m.fatal) {
            if (errorMessages.length < 20) {
                errorMessages.push(toRel(r.filePath) + ':' + m.line + ' ' + rule + ' ' + m.message);
            }
        } else if (m.severity === 1) {
            warningsByRule[rule] = (warningsByRule[rule] || 0) + 1;
        }
    }
}
const ignored = {};
for (const p of probePaths) ignored[p] = await eslint.isPathIgnored(p);
process.stdout.write(JSON.stringify({
    files: results.map(r => toRel(r.filePath)),
    errors,
    warnings,
    errorMessages,
    warningsByRule,
    perFile,
    ignored
}));
`;

/**
 * Reine Hilfsfunktion: welche erwarteten Pfade fehlen in der gelinteten Menge?
 * Lokal in dieser Datei, damit der Fail-first-Selbsttest sie direkt pruefen kann.
 */
function findUnlinted(expected, lintedSet) {
    return expected.filter(f => !lintedSet.has(f));
}

let run;
let linted;

beforeAll(() => {
    let out;
    try {
        out = execFileSync(
            process.execPath,
            ['--input-type=module', '-e', PROBE, JSON.stringify(PROBE_PATHS)],
            {
                cwd: REPO_ROOT,
                encoding: 'utf8',
                maxBuffer: 64 * 1024 * 1024,
                stdio: ['ignore', 'pipe', 'pipe'],
                timeout: 110000
            }
        );
    } catch (err) {
        throw new Error(
            'lint-gate: ESLint-Kindprozess fehlgeschlagen: ' +
                err.message +
                '\n--- stderr ---\n' +
                (err.stderr || '(leer)')
        );
    }
    run = JSON.parse(out);
    linted = new Set(run.files);
}, 120000);

describe('Lint-Gate (R09)', () => {
    test('Design-Handoffs unter Anpassungen/ sind vom Lint ausgenommen', () => {
        expect(run.ignored[HANDOFF_FILE]).toBe(true);
        expect(run.ignored[HANDOFF_SYNTHETIC]).toBe(true);
        expect([...linted].filter(f => f.startsWith('Anpassungen/'))).toEqual([]);
    });

    test('Lokale Artefakt-Ordner sind ausgenommen', () => {
        const notIgnored = LOCAL_ARTIFACT_PROBES.filter(p => run.ignored[p] !== true);
        expect(notIgnored).toEqual([]);
    });

    test('Produktiver Quellbaum bleibt erfasst', () => {
        // Fail-first-Selbsttest: die Vergleichslogik kann rot werden.
        expect(findUnlinted(['core/a.js', 'core/b.js'], new Set(['core/a.js']))).toEqual([
            'core/b.js'
        ]);

        const modules = extractModulesFromLoader(fs.readFileSync(LOADER_PATH, 'utf8'));
        // Leer-gruen-Waechter: ein kaputter Parser darf nicht still bestehen.
        expect(modules.length).toBeGreaterThan(100);
        expect(findUnlinted(modules, linted)).toEqual([]);

        const wronglyIgnored = PRODUCTIVE_PROBES.filter(p => run.ignored[p] !== false);
        expect(wronglyIgnored).toEqual([]);
    });

    test('Service Worker (sw.js) wird gelintet und ist befundfrei (R08)', () => {
        expect(run.ignored[SERVICE_WORKER]).toBe(false);
        expect(linted.has(SERVICE_WORKER)).toBe(true);
        expect(run.perFile[SERVICE_WORKER]).toEqual({ errors: 0, warnings: 0, messages: [] });
    });

    test('0 Fehler', () => {
        if (run.errors !== 0) {
            throw new Error(
                `ESLint meldet ${run.errors} Fehler (erste ${run.errorMessages.length}):\n` +
                    run.errorMessages.join('\n')
            );
        }
        expect(run.errors).toBe(0);
    });

    test('Warnungszahl == Ratsche (exakt)', () => {
        const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
        const m = /--max-warnings\s+(\d+)/.exec((pkg.scripts && pkg.scripts.lint) || '');
        expect(m).not.toBeNull();
        const pin = Number(m[1]);
        if (run.warnings !== pin) {
            throw new Error(
                `ESLint-Warnungen gemessen: ${run.warnings}, Pin (--max-warnings): ${pin}.\n` +
                    `Warnungen je Regel: ${JSON.stringify(run.warningsByRule, null, 2)}\n` +
                    `package.json scripts.lint auf --max-warnings ${run.warnings} setzen ` +
                    '(im selben Commit). Nur eine legitime Senkung rechtfertigt einen neuen ' +
                    'Pin — eingefuehrte Warnungen beheben statt den Pin anzuheben.'
            );
        }
        expect(run.warnings).toBe(pin);
    });
});
