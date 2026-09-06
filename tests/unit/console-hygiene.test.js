/**
 * Console-Hygiene Test — MAINT-06 (13-08), erweitert um WR-02 (13-REVIEW.md)
 *
 * Prueft, dass kein in `loader.js` `MODULES` gelistetes Modul mehr ungefiltert auf
 * die Browser-Konsole schreibt. Der Dateisatz wird bei jedem Lauf frisch aus dem
 * `MODULES`-Array in `loader.js` extrahiert — dieselbe einzige Liste, die auch
 * `build.py` liest (ARCH-01, Phase 11). Es gibt bewusst keine zweite, handgepflegte
 * Liste in dieser Datei.
 *
 * ZWEI sanktionierte Ausgaenge sind erlaubt — nicht mehr nur einer (Stand nach der
 * WR-02-Nacharbeit aus 13-REVIEW.md):
 *
 * 1. PRIMAER (unveraendert seit 13-08/MAINT-06): `ErrorHandler.log()` in
 *    `render/helpers.js`, markiert mit `gsd:konsolen-senke`. Genau EINE Fundstelle.
 *    Dies ist der normale, produktive Logging-Pfad.
 *
 * 2. FALLBACK (neu seit der WR-02-Nacharbeit): ein `else console.error(...)`-Zweig,
 *    der NUR greift, wenn `ErrorHandler` selbst nicht existiert (z.B. eine gebrochene
 *    Ladereihenfolge oder ein partieller Skript-Ladefehler) — der Fall, den der
 *    Code-Review als Regression WR-02a einstufte: vor Phase 13 gab es diesen
 *    Ausweg, MAINT-06 hatte ihn ersatzlos entfernt, wodurch ein Fehler beim Fehlen
 *    von ErrorHandler spurlos verschwand. Markiert mit `gsd:konsolen-senke-fallback`.
 *    Dieser Marker ist bewusst ein eigenstaendiger, zweiter String (kein Alias fuer
 *    den primaeren) — die Tests unten pruefen ihn separat, damit die Ausnahme
 *    nachvollziehbar und nicht einfach eine stille Aufweichung des Haupttests ist.
 *
 * WICHTIG: Dies ist eine bewusste, begruendete Erweiterung der Ausnahmeliste — KEINE
 * Reduktion des Pruefumfangs. Jede unmarkierte Konsolenausgabe in einem
 * MODULES-gelisteten Modul faellt weiterhin durch. Nur die beiden oben beschriebenen,
 * jeweils markierten Faelle sind erlaubt.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
const HELPERS_PATH = path.join(REPO_ROOT, 'render', 'helpers.js');
const EVENT_DELEGATION_PATH = path.join(REPO_ROOT, 'ui', 'event-delegation.js');
const UI_ACTIONS_PATH = path.join(REPO_ROOT, 'ui', 'actions', 'ui-actions.js');

// Primaerer Ausgang (MAINT-06 / 13-08) — der normale ErrorHandler.log()-Pfad.
const SANCTIONED_MARKER = 'gsd:konsolen-senke';
// Fallback-Ausgang (WR-02a / 13-REVIEW.md) — NUR wenn ErrorHandler selbst fehlt.
// Bewusst ein eigener String, nicht nur eine Konkatenation von SANCTIONED_MARKER,
// damit beide Faelle unabhaengig voneinander geprueft werden koennen.
const FALLBACK_MARKER = 'gsd:konsolen-senke-fallback';

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

/**
 * Eine Zeile ist gedeckt, wenn sie ENTWEDER den primaeren ODER den
 * Fallback-Marker traegt — beide sind explizit benannte, dokumentierte
 * Ausnahmen, keine implizite Teilstring-Uebereinstimmung.
 */
function isSanctionedLine(line) {
    return line.includes(SANCTIONED_MARKER) || line.includes(FALLBACK_MARKER);
}

describe('Console-Hygiene (MAINT-06 + WR-02-Nacharbeit)', () => {
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
                if (UNFILTERED_OUTPUT_PATTERN.test(line) && !isSanctionedLine(line)) {
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

    test('genau ein primaerer sanktionierter Ausgang ist markiert (render/helpers.js)', () => {
        const helpersSource = fs.readFileSync(HELPERS_PATH, 'utf8');
        const markerCount = (helpersSource.match(new RegExp(SANCTIONED_MARKER, 'g')) || []).length;
        // Zaehlt auch den FALLBACK_MARKER mit, falls dieser jemals in helpers.js
        // landen sollte (er tut es aktuell nicht) — deshalb hier explizit nur
        // Vorkommen OHNE das "-fallback"-Suffix zaehlen.
        const primaryOnlyCount = (helpersSource.match(/gsd:konsolen-senke(?!-fallback)/g) || []).length;
        expect(primaryOnlyCount).toBe(1);
        expect(markerCount).toBeGreaterThanOrEqual(1);
    });

    test('jede mit dem Fallback-Marker versehene Zeile ist tatsächlich ein console.error-Aufruf', () => {
        // Verhindert, dass der Fallback-Marker versehentlich (oder absichtlich) an
        // eine Stelle geklebt wird, die gar keine Konsolenausgabe ist, und so
        // stillschweigend zu einem Freifahrtschein fuer beliebigen Code wird.
        const filesToCheck = [EVENT_DELEGATION_PATH, UI_ACTIONS_PATH];
        const offenders = [];

        for (const absPath of filesToCheck) {
            const source = fs.readFileSync(absPath, 'utf8');
            source.split('\n').forEach((line, idx) => {
                if (line.includes(FALLBACK_MARKER) && !UNFILTERED_OUTPUT_PATTERN.test(line)) {
                    offenders.push(`${path.relative(REPO_ROOT, absPath)}:${idx + 1}: ${line.trim()}`);
                }
            });
        }

        expect(offenders).toEqual([]);
    });

    test('der Fallback-Marker existiert an den erwarteten Last-Resort-Stellen (WR-02a, 13-REVIEW.md)', () => {
        // Dokumentiert die aktuelle, bewusste Anzahl der Last-Resort-Ausgaenge:
        // ui/event-delegation.js hat fuenf catch-/Whitelist-Zweige, die auf
        // console.error zurueckfallen, wenn ErrorHandler fehlt (_handleClick x1,
        // _handleChange x2 [data-action-Catch + Legacy-onChange-Catch] plus
        // 1 Whitelist-Ablehnung, _handleInput analog) — plus zwei in
        // ui/actions/ui-actions.js (SEC-03 `call`-Whitelist-Ablehnung und
        // "Ziel ist keine Funktion"). Steigt diese Zahl unbemerkt, ist das kein
        // Fehler an sich, aber ein Signal, das Ergebnis erneut gegen 13-REVIEW.md
        // zu pruefen — deshalb hier als expliziter Wert statt nur ">= 1".
        const eventDelegationSource = fs.readFileSync(EVENT_DELEGATION_PATH, 'utf8');
        const uiActionsSource = fs.readFileSync(UI_ACTIONS_PATH, 'utf8');

        const countIn = source => (source.match(new RegExp(FALLBACK_MARKER, 'g')) || []).length;

        expect(countIn(eventDelegationSource)).toBe(7);
        expect(countIn(uiActionsSource)).toBe(2);
    });
});
