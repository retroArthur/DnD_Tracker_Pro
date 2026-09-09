'use strict';

/**
 * css-usage-report — D-20/D-21 (Plan 15-06, Task 1)
 *
 * Erzeugt die bindenden Loeschzahlen fuer den toten CSS-Bestand: je
 * `assets/styles/*.css`-Datei tote Klassen, vollstaendig tote Regelbloecke
 * und die Zeilen darin, getrennt davon Regelbloecke ohne jede Klasse (nicht
 * klassenbasiert beurteilbar — NIEMALS als tot gemeldet), sowie die vier
 * DEAD-03-Basisgroessen (rgba/rgb-Zahlentripel, `em`, `box-shadow`,
 * `transition: all`) je einmal gesamt und einmal davon in toten Regeln.
 *
 * Formvorbild: `tools/generate-eslint-globals.js` (strikter Modus, nur die
 * beiden Node-Standardmodule, benannte Konstanten fuer Pfade, alle
 * Kernfunktionen einzeln exportiert, Direktaufruf-Zweig am Ende).
 *
 * Lebend-Erkennung in drei Stufen (D-21):
 *   1. Wort-Token-Gleichheit aus Klassen-Kontexten (class="...", className=,
 *      classList.add/remove/toggle/contains/replace) — ein Teilstring-Treffer
 *      zaehlt NICHT.
 *   2. Genau fuenf eingefrorene Praefixe (LIVE_PREFIXES) fuer dynamisch
 *      zusammengesetzte Klassennamen, ausschliesslich aus Klassen-Kontexten
 *      gewonnen.
 *   3. Ankerregel fuer Verbundselektoren: ein Regelblock stirbt nur, wenn
 *      JEDE Klasse in JEDEM seiner Selektoren tot ist.
 *
 * Ein Regelblock, dessen Selektoren keine einzige Klasse enthalten, landet
 * NIE in der Totenliste — er wird getrennt als "nicht klassenbasiert
 * beurteilbar" ausgewiesen (DEAD-01-Verbot).
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CSS_DIR = path.join(REPO_ROOT, 'assets/styles');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'assets/templates');
const JS_SCAN_DIRS = ['features', 'systems', 'ui', 'core', 'render', 'utils'];

// ----------------------------------------------------------------------
// Kommentarentfernung — woertlich identischer Ausdruck wie
// tests/unit/design-consistency.test.js's withoutComments() (Z.34-36).
// Ein eigener Testfall sichert die woertliche Uebereinstimmung zu, damit es
// nachweislich nur eine Zaehlart gibt, keine zweite, leicht abweichende.
// ----------------------------------------------------------------------
const COMMENT_RE = /\/\*[\s\S]*?\*\//g;

function withoutComments(css) {
    return css.replace(COMMENT_RE, '');
}

/**
 * Wie withoutComments(), ersetzt aber jedes Kommentarzeichen (ausser
 * Zeilenumbruechen) durch ein Leerzeichen statt es zu entfernen — die
 * Zeilennummern bleiben dadurch deckungsgleich mit der Originaldatei. Nur
 * fuer die interne Strukturanalyse (Regelbloecke, Zeilen darin) verwendet;
 * fuer alle Zaehlungen ist das Ergebnis identisch zu withoutComments(), weil
 * kein Muster ueber eine Kommentargrenze hinweg zusammenlaufen kann.
 */
function blankComments(css) {
    return css.replace(COMMENT_RE, m => m.replace(/[^\n]/g, ' '));
}

// Fuenf eingefrorene Praefixe fuer dynamisch zusammengesetzte Klassennamen
// (D-21). Diese Liste wird NICHT erweitert — jede Erweiterung ist eine
// architektonische Entscheidung (Rule 4), keine Wartungsroutine. Ausschliesslich
// aus Klassen-Kontexten gewonnen, nie aus data-Attributen oder IDs.
const LIVE_PREFIXES = Object.freeze(['color-', 'condition-', 'editor-toolbar-', 'rel-btn-', 'tag-']);

// Datierte Ausnahmeliste fuer den Pruefmodus (--check). Startet leer — es
// gibt vor dem ersten Loeschcommit dieser Phase keine akzeptierten toten
// Klassen. Form je Eintrag: { class, date, reason }.
const DEAD_EXCEPTIONS = Object.freeze([]);

// Die vier DEAD-03-Basisgroessen fuer den Umfang der Folgewellen.
const RGBA_TRIPLE_RE = /\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;
const EM_UNIT_RE = /\b\d+(?:\.\d+)?em\b/g;
const BOX_SHADOW_RE = /\bbox-shadow\s*:/g;
const TRANSITION_ALL_RE = /\btransition\s*:\s*all\b/g;

function countMatches(text, re) {
    const m = text.match(re);
    return m ? m.length : 0;
}

function measureBaseSizes(text) {
    return {
        rgba: countMatches(text, RGBA_TRIPLE_RE),
        em: countMatches(text, EM_UNIT_RE),
        boxShadow: countMatches(text, BOX_SHADOW_RE),
        transitionAll: countMatches(text, TRANSITION_ALL_RE)
    };
}

function addBaseSizes(a, b) {
    return {
        rgba: a.rgba + b.rgba,
        em: a.em + b.em,
        boxShadow: a.boxShadow + b.boxShadow,
        transitionAll: a.transitionAll + b.transitionAll
    };
}

function zeroBaseSizes() {
    return { rgba: 0, em: 0, boxShadow: 0, transitionAll: 0 };
}

// ----------------------------------------------------------------------
// Dateisystem-Zugriffe — ausschliesslich lesend (T-15-13). Alle Pfade werden
// aus REPO_ROOT (dem eigenen Dateiort) zusammengesetzt, nie aus der
// Kommandozeile oder einem Dateiinhalt.
// ----------------------------------------------------------------------

function readCssFiles() {
    return fs
        .readdirSync(CSS_DIR)
        .filter(f => f.endsWith('.css'))
        .sort()
        .map(name => ({ name, content: fs.readFileSync(path.join(CSS_DIR, name), 'utf8') }));
}

function readTemplateFiles() {
    return fs
        .readdirSync(TEMPLATES_DIR)
        .filter(f => f.endsWith('.html'))
        .sort()
        .map(name => ({ name, content: fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8') }));
}

function readJsFiles() {
    const out = [];
    const walk = dir => {
        const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith('.js')) out.push({ name: full, content: fs.readFileSync(full, 'utf8') });
        }
    };
    JS_SCAN_DIRS.forEach(d => {
        const abs = path.join(REPO_ROOT, d);
        if (fs.existsSync(abs)) walk(abs);
    });
    return out;
}

// ----------------------------------------------------------------------
// Stufe 1 — Klassen-Kontexte im Quellbaum (Markup + JS). Nur diese drei
// Muster zaehlen als Klassen-Kontext: das class="..."-Attribut (auch in
// JS-Template-Zeichenketten), die Zuweisung an .className, und die Methoden
// von .classList. Ein Aktionsname, eine Element-ID oder ein data-Wert mit
// demselben Wortlaut zaehlt ausdruecklich NICHT.
// ----------------------------------------------------------------------

const CLASS_ATTR_RE = /class=(["'`])([\s\S]*?)\1/g;
const CLASS_NAME_ASSIGN_RE = /\.className\s*\+?=(?!=)\s*(["'`])([\s\S]*?)\1/g;
const CLASS_LIST_CALL_RE = /classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g;
const QUOTED_STRING_RE = /(["'`])((?:\\.|(?!\1).)*)\1/g;

function addTokensFromValue(tokens, rawValue) {
    // Interpolationsplatzhalter (`${...}`) entfernen, BEVOR in Woerter
    // gesplittet wird — sonst wuerde der Ausdruckstext selbst zu einem
    // Fantasie-Token werden (z. B. "isAvailable" aus "${isAvailable ? ...}").
    const cleaned = rawValue.replace(/\$\{[^}]*\}/g, ' ');
    cleaned
        .split(/\s+/)
        .filter(Boolean)
        .forEach(tok => tokens.add(tok));
}

/**
 * Sammelt alle Klassen-Token aus Klassen-Kontexten der uebergebenen
 * Quelldateien (Markup und/oder JS, jeweils { content }). Reine Funktion,
 * kein Dateisystemzugriff — testbar mit kleinen Zeichenketten-Vorlagen.
 *
 * @param {{content: string}[]} files
 * @returns {Set<string>}
 */
function collectLiveTokens(files) {
    const tokens = new Set();
    files.forEach(f => {
        const content = f.content;
        for (const m of content.matchAll(CLASS_ATTR_RE)) {
            addTokensFromValue(tokens, m[2]);
        }
        for (const m of content.matchAll(CLASS_NAME_ASSIGN_RE)) {
            addTokensFromValue(tokens, m[2]);
        }
        for (const m of content.matchAll(CLASS_LIST_CALL_RE)) {
            for (const arg of m[1].matchAll(QUOTED_STRING_RE)) {
                addTokensFromValue(tokens, arg[2]);
            }
        }
    });
    return tokens;
}

/**
 * Ermittelt, welche der fuenf LIVE_PREFIXES tatsaechlich in einem
 * Klassen-Kontext belegt sind (d. h. mindestens ein gesammeltes Live-Token
 * beginnt mit diesem Praefix).
 *
 * @param {Set<string>} liveTokens
 * @returns {Set<string>}
 */
function occupiedPrefixes(liveTokens) {
    const occupied = new Set();
    for (const tok of liveTokens) {
        for (const prefix of LIVE_PREFIXES) {
            if (tok.startsWith(prefix)) occupied.add(prefix);
        }
    }
    return occupied;
}

function isClassLive(cls, liveTokens, occupied) {
    if (liveTokens.has(cls)) return true;
    for (const prefix of LIVE_PREFIXES) {
        if (occupied.has(prefix) && cls.startsWith(prefix)) return true;
    }
    return false;
}

// ----------------------------------------------------------------------
// CSS-Regelbloecke extrahieren — zeichenweiser Scan mit Klammertiefe UND
// Anfuehrungszeichen-Bewusstsein (eine `content: "}"`-Deklaration darf die
// Klammertiefe nicht verwirren). @-Regel-Praeambeln (z. B. `@media (...)`)
// werden selbst nie als Regel gefuehrt; ihre Kinder werden normal geparst.
// Kinder von `@keyframes` (Prozent-/from/to-Selektoren, NIE Klassen) werden
// uebersprungen — sonst wuerde ein @keyframes-Name wie "dms-live-pulse"
// faelschlich als Klassenselektor mitgezaehlt (D-25).
// ----------------------------------------------------------------------

const KEYFRAMES_RE = /^@(-\w+-)?keyframes\b/i;

function extractRules(blankedCss) {
    const rules = [];
    const stack = [];
    let buf = '';
    let line = 1;
    let segmentStartLine = 1;
    let quote = null;

    for (let i = 0; i < blankedCss.length; i++) {
        const ch = blankedCss[i];

        if (quote) {
            buf += ch;
            if (ch === '\\' && i + 1 < blankedCss.length) {
                i++;
                buf += blankedCss[i];
                if (blankedCss[i] === '\n') line++;
            } else if (ch === quote) {
                quote = null;
            } else if (ch === '\n') {
                line++;
            }
            continue;
        }

        if (ch === '"' || ch === "'") {
            quote = ch;
            buf += ch;
            continue;
        }

        if (ch === '\n') {
            line++;
            buf += ch;
            continue;
        }

        if (ch === '{') {
            const preludeTrim = buf.trim();
            const isAtRule = preludeTrim.startsWith('@');
            const isKeyframes = KEYFRAMES_RE.test(preludeTrim);
            const parentIsKeyframes =
                stack.length > 0 && (stack[stack.length - 1].isKeyframes || stack[stack.length - 1].parentIsKeyframes);
            stack.push({
                prelude: preludeTrim,
                isAtRule,
                isKeyframes,
                parentIsKeyframes,
                startLine: segmentStartLine,
                bodyStartIndex: i + 1
            });
            buf = '';
            segmentStartLine = line;
            continue;
        }

        if (ch === '}') {
            const top = stack.pop();
            if (top) {
                const body = blankedCss.slice(top.bodyStartIndex, i);
                if (!top.isAtRule && !top.parentIsKeyframes) {
                    rules.push({
                        selectors: top.prelude,
                        body,
                        startLine: top.startLine,
                        endLine: line
                    });
                }
            }
            buf = '';
            segmentStartLine = line;
            continue;
        }

        buf += ch;
    }

    return rules;
}

const SELECTOR_CLASS_RE = /\.([A-Za-z_-][\w-]*)/g;

function classNamesOf(selectorText) {
    const names = new Set();
    for (const m of selectorText.matchAll(SELECTOR_CLASS_RE)) names.add(m[1]);
    return [...names];
}

/**
 * Sammelt alle Klassennamen, die irgendwo als Selektor im uebergebenen
 * CSS-Text vorkommen (Kommentare werden vorab entfernt). Reine Funktion,
 * kein Dateisystemzugriff.
 *
 * @param {string} cssText
 * @returns {string[]} alphabetisch sortiert, ohne Dubletten
 */
function collectCssClasses(cssText) {
    const rules = extractRules(blankComments(cssText));
    const names = new Set();
    rules.forEach(r => classNamesOf(r.selectors).forEach(n => names.add(n)));
    return [...names].sort();
}

// ----------------------------------------------------------------------
// Gesamtanalyse
// ----------------------------------------------------------------------

/**
 * @param {object} [opts]
 * @param {{name: string, content: string}[]} [opts.cssFiles] - Standard: assets/styles/*.css
 * @param {{name: string, content: string}[]} [opts.templateFiles] - Standard: assets/templates/*.html
 * @param {{name: string, content: string}[]} [opts.jsFiles] - Standard: features/, systems/, ui/, core/, render/, utils/
 * @returns {object} Analyseergebnis, siehe renderTable()/README oben.
 */
function analyze(opts = {}) {
    const cssFiles = opts.cssFiles || readCssFiles();
    const templateFiles = opts.templateFiles || readTemplateFiles();
    const jsFiles = opts.jsFiles || readJsFiles();

    const liveTokens = collectLiveTokens([...templateFiles, ...jsFiles]);
    const occupied = occupiedPrefixes(liveTokens);
    const exceptionNames = new Set(DEAD_EXCEPTIONS.map(e => e.class));

    const files = [];
    let totals = zeroBaseSizes();
    let deadTotals = zeroBaseSizes();
    let notJudgeableCount = 0;
    const deadClassNamesGlobal = new Set();

    const sortedCssFiles = [...cssFiles].sort((a, b) => a.name.localeCompare(b.name));

    for (const file of sortedCssFiles) {
        const blanked = blankComments(file.content);
        const rules = extractRules(blanked);

        const deadClassesSet = new Set();
        const liveClassesSet = new Set();
        const deadRuleBlocks = [];
        const notJudgeable = [];

        for (const rule of rules) {
            const classNames = classNamesOf(rule.selectors);
            if (classNames.length === 0) {
                notJudgeable.push({
                    selectors: rule.selectors.trim(),
                    startLine: rule.startLine,
                    endLine: rule.endLine
                });
                continue;
            }
            let allDead = true;
            for (const cls of classNames) {
                if (isClassLive(cls, liveTokens, occupied)) {
                    allDead = false;
                    liveClassesSet.add(cls);
                } else {
                    deadClassesSet.add(cls);
                }
            }
            if (allDead) {
                deadRuleBlocks.push({
                    selectors: rule.selectors.trim(),
                    startLine: rule.startLine,
                    endLine: rule.endLine,
                    lineCount: rule.endLine - rule.startLine + 1,
                    body: rule.body
                });
            }
        }

        // Eine Klasse, die in mindestens einem Regelblock lebt, ist nicht tot
        // — auch wenn sie in einem anderen Regelblock (z. B. einem
        // Verbundselektor) ausschliesslich neben toten Klassen steht.
        for (const cls of liveClassesSet) deadClassesSet.delete(cls);

        deadRuleBlocks.sort((a, b) => a.startLine - b.startLine);
        notJudgeable.sort((a, b) => a.startLine - b.startLine);
        notJudgeableCount += notJudgeable.length;

        const fileBaseSizes = measureBaseSizes(blanked);
        const deadBodyText = deadRuleBlocks.map(r => r.body).join('\n');
        const deadBaseSizes = measureBaseSizes(deadBodyText);

        totals = addBaseSizes(totals, fileBaseSizes);
        deadTotals = addBaseSizes(deadTotals, deadBaseSizes);

        const sortedDeadClasses = [...deadClassesSet].sort();
        sortedDeadClasses.forEach(c => deadClassNamesGlobal.add(c));

        files.push({
            name: file.name,
            deadClasses: sortedDeadClasses,
            deadClassCount: sortedDeadClasses.length,
            deadRuleBlocks: deadRuleBlocks.map(({ body: _body, ...rest }) => rest),
            deadRuleBlockCount: deadRuleBlocks.length,
            deadLines: deadRuleBlocks.reduce((sum, r) => sum + r.lineCount, 0),
            notJudgeable,
            notJudgeableCount: notJudgeable.length,
            totals: fileBaseSizes,
            deadTotals: deadBaseSizes
        });
    }

    const checkFailures = [...deadClassNamesGlobal].filter(c => !exceptionNames.has(c)).sort();

    return {
        files,
        totals,
        deadTotals,
        notJudgeableCount,
        deadClassCount: deadClassNamesGlobal.size,
        checkFailures
    };
}

// ----------------------------------------------------------------------
// Ausgabe
// ----------------------------------------------------------------------

function padRight(str, len) {
    return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

function renderTable(result) {
    const lines = [];
    lines.push('css-usage-report — tote CSS-Klassen je Datei (D-20)');
    lines.push('');
    const header = ['Datei', 'tote Klassen', 'tote Regelbloecke', 'Zeilen darin'];
    lines.push(`${padRight(header[0], 32)} ${padRight(header[1], 14)} ${padRight(header[2], 19)} ${header[3]}`);
    result.files.forEach(f => {
        lines.push(
            `${padRight(f.name, 32)} ${padRight(String(f.deadClassCount), 14)} ${padRight(
                String(f.deadRuleBlockCount),
                19
            )} ${f.deadLines}`
        );
    });
    lines.push('');
    lines.push('Vier Basisgroessen (DEAD-03) — gesamt / davon in toten Regeln:');
    lines.push(`  rgba/rgb-Zahlentripel: ${result.totals.rgba} / ${result.deadTotals.rgba}`);
    lines.push(`  em (relative Schriftgroessen): ${result.totals.em} / ${result.deadTotals.em}`);
    lines.push(`  box-shadow-Deklarationen: ${result.totals.boxShadow} / ${result.deadTotals.boxShadow}`);
    lines.push(`  transition: all: ${result.totals.transitionAll} / ${result.deadTotals.transitionAll}`);
    lines.push('');
    lines.push(`Nicht klassenbasiert beurteilbar (${result.notJudgeableCount}):`);
    if (result.notJudgeableCount === 0) {
        lines.push('  (keine)');
    } else {
        result.files.forEach(f => {
            f.notJudgeable.forEach(r => {
                lines.push(`  ${f.name}:${r.startLine}-${r.endLine}  ${r.selectors}`);
            });
        });
    }
    lines.push('');
    lines.push(
        `Insgesamt ${result.deadClassCount} tote Klassen (davon ${result.checkFailures.length} ausserhalb der Ausnahmeliste).`
    );
    return lines.join('\n');
}

module.exports = {
    COMMENT_RE,
    withoutComments,
    collectCssClasses,
    collectLiveTokens,
    LIVE_PREFIXES,
    DEAD_EXCEPTIONS,
    analyze,
    renderTable
};

// ----------------------------------------------------------------------
// Direktaufruf-Zweig — liest den echten Quellbaum, gibt die Konsolentabelle
// (Standard) oder ein maschinenlesbares JSON-Objekt (--json) aus. --check
// beendet den Prozess mit Exit-Code 1, solange tote Klassen ausserhalb der
// DEAD_EXCEPTIONS-Ausnahmeliste uebrig sind.
// ----------------------------------------------------------------------
if (require.main === module) {
    const args = process.argv.slice(2);
    const wantsJson = args.includes('--json');
    const wantsCheck = args.includes('--check');

    const result = analyze();

    if (wantsJson) {
        console.log(JSON.stringify(result));
    } else {
        console.log(renderTable(result));
    }

    if (wantsCheck) {
        if (result.checkFailures.length > 0) {
            console.error(
                `[css-usage-report --check] ${result.checkFailures.length} tote Klasse(n) ausserhalb der Ausnahmeliste: ${result.checkFailures.join(', ')}`
            );
            process.exit(1);
        }
        console.error('[css-usage-report --check] OK — keine toten Klassen ausserhalb der Ausnahmeliste.');
    }
}
