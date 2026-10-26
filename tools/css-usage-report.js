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
 * Lebend-Erkennung in drei Stufen (D-21; um zwei Klassen-Kontexte erweitert
 * in Plan 15-09, CR-01/WR-01; um Interpolations-Literal-Ernte, eine harte
 * Zeichen-Obergrenze statt Umbruchschranke, und einen vierten Klassen-
 * Kontext erweitert in Plan 15-11, CR-03a/CR-02/CR-03b):
 *   1. Wort-Token-Gleichheit aus Klassen-Kontexten (class="...", className=,
 *      eine anweisungsweite Zuweisung an .className/.className+= (auch per
 *      Ternary oder Konkatenation), die Objektschluessel className:/
 *      containerClass:, classList.add/remove/toggle/contains/replace mit
 *      ausgeglichener Klammertiefe im Argumentteil, und die Zwischen-
 *      variablen-Form (ein Bezeichner, per var/let/const aus Zeichenketten-
 *      Literalen deklariert und INNERHALB DERSELBEN ANWEISUNG wie ein
 *      class="..."-Vorkommen konkateniert, Plan 15-11 CR-03b) — ein
 *      Teilstring-Treffer zaehlt NICHT. Der Inhalt einer `${...}`-
 *      Interpolation innerhalb eines Klassen-Kontexts wird nicht mehr
 *      pauschal verworfen: seine Zeichenketten-Literale werden als Token
 *      gefuehrt, der uebrige Ausdruckstext (z. B. der Name der
 *      Bedingungsvariablen) weiterhin nicht (Plan 15-11, CR-03a). Ein
 *      anweisungsweiter Scan endet spaetestens nach MAX_SEGMENT_SCAN_CHARS
 *      gelesenen Zeichen statt bei jedem Zeilenumbruch — eine ueber mehrere
 *      Zeilen umbrochene Zuweisung (Prettier-Normalform) liefert dadurch
 *      weiterhin alle ihre Literale (Plan 15-11, CR-02).
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

// Datierte Ausnahmeliste fuer den Pruefmodus (--check). Form je Eintrag:
// { class, date, reason }. Die fuenf Eintraege unten sind das Ergebnis der
// Pflicht-Fehlalarm-Pruefung aus Plan 15-06 Task 3, nicht Ausgangszustand:
// keine der fuenf Klassen ist tatsaechlich tot. `setReadAloudFormat()`
// (ui/editors/rich-text.js:412) baut die Modifikator-Klasse ueber eine
// Ternary auf einer LAUFZEIT-Variable (`style`), deren moegliche Werte nur
// als `value: '<farbe>'` in einer Dropdown-Optionsliste
// (ui/editors/editor-toolbar-build.js:47ff) stehen — nie als eigenstaendiges
// Literal in einem Klassen-Kontext. Eine Text-Pruefung ohne echten Parser
// kann diese Kette nicht schliessen (Projektkonvention, siehe
// tools/generate-eslint-globals.js-Vorbild); die Klassen sind ueber die
// CLAUDE.md § "Read-Aloud Text Styles" dokumentierte Funktion nachweislich
// lebendig. Rueckweg zur Erweiterung der Erkennung: keiner mit vertretbarem
// Aufwand ohne echten JS-Parser (siehe Commit-Nachricht).
const DEAD_EXCEPTIONS = Object.freeze([
    {
        class: 'crimson',
        date: '2026-09-09',
        reason:
            'Read-Aloud-Farbvariante, nur ueber setReadAloudFormat()-Ternary auf einer Laufzeit-Variable erreichbar (rich-text.js:412) — kein Klassen-Kontext-Literal, kein echter Fehlalarm des Werkzeugs, sondern eine erkannte Grenze der Text-Pruefung.'
    },
    {
        class: 'violet',
        date: '2026-09-09',
        reason: 'Wie crimson — Read-Aloud-Farbvariante (rich-text.js:412).'
    },
    {
        class: 'sage',
        date: '2026-09-09',
        reason: 'Wie crimson — Read-Aloud-Farbvariante (rich-text.js:412).'
    },
    {
        class: 'sky',
        date: '2026-09-09',
        reason: 'Wie crimson — Read-Aloud-Farbvariante (rich-text.js:412).'
    },
    {
        class: 'slate',
        date: '2026-09-09',
        reason: 'Wie crimson — Read-Aloud-Farbvariante (rich-text.js:412).'
    }
]);

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

const CLASS_ATTR_OPEN_RE = /class=(["'`])/g;
const CLASS_NAME_ASSIGN_OPEN_RE = /\.className\s*\+?=(?!=)\s*(["'`])/g;

// CR-01a (Plan 15-09): dieselbe Zuweisung wie CLASS_NAME_ASSIGN_OPEN_RE oben,
// aber OHNE die Vorbedingung eines sofortigen Anfuehrungszeichens — faengt
// eine Ternary oder Konkatenation rechts vom Gleichheitszeichen
// (`.className = bedingung ? 'a' : 'b';`, reale Form ui/dom-builder.js:393).
// Der Schnellpfad oben bleibt fuer den haeufigen Fall des sofortigen Literals
// bestehen; beide Pfade duerfen dasselbe Token doppelt einsammeln (Set).
const CLASS_NAME_ASSIGN_STMT_RE = /\.className\s*\+?=(?!=)/g;

// CR-01b/CR-01c (Plan 15-09): Objektschluessel className/containerClass, mit
// Wortgrenze davor — ohne sie wuerde ein Schluessel wie `classNames` oder
// `containerClasses` mitgelesen (Muster aus ui/safe-render.js, das am
// 2026-10-26 als toter Code geloescht wurde — seither ohne realen Fund im Baum:
// `containerClass: bedingung ? 'a' : 'b',`).
const CLASS_KEY_ASSIGN_RE = /\b(?:className|containerClass)\s*:/g;

// WR-01 (Plan 15-09): nur noch die Aufruf-Oeffnung; der Argumentteil wird
// per scanBalancedCallArgs() ueber ausgeglichene Klammertiefe gelesen statt
// per Regex-Ausschlussklasse begrenzt — sonst verschluckt ein geklammerter
// Ausdruck VOR dem Klassenliteral (`classList.toggle(berechneName(x), 'a')`)
// alles danach.
const CLASS_LIST_CALL_RE = /classList\.(?:add|remove|toggle|contains|replace)\(/g;

const QUOTED_STRING_RE = /(["'`])((?:\\.|(?!\1).)*)\1/g;

// Harte Zeichen-Obergrenze fuer scanBalancedSegment() (Plan 15-11, CR-02).
// Ersetzt die fruehere Zeilenumbruch-Abbruchbedingung: ein Zeilenumbruch
// beendet den Scan nicht mehr (Prettier bricht lange Zuweisungen nach dem
// Gleichheitszeichen um), aber ohne Ersatzschranke waere der Wegfall eine
// unbegrenzte Leseweite bei einem unbeendeten Konstrukt (T-15-20). 2000 ist
// grosszuegig gegenueber jeder realen Anweisung im Baum und klein genug, um
// Fremdtext fernzuhalten.
const MAX_SEGMENT_SCAN_CHARS = 2000;

/**
 * Liest den Klassen-Kontext-Wert ab `startIndex` (direkt nach der
 * oeffnenden Anfuehrung), bis entweder die oeffnende Anfuehrung selbst
 * wiederkehrt (regulaerer Abschluss) ODER eine der beiden ANDEREN
 * Anfuehrungsarten auftaucht. Letzteres faengt den in diesem Quellbaum
 * verbreiteten String-Konkatenations-Stil ab
 * (`'<button class="foo' + (bar ? ' baz' : '') + '"'` — die HTML-Anfuehrung
 * "\"" wird erst viel spaeter, ausserhalb des eigentlichen Klassennamens,
 * wieder geschlossen; ohne diese Regel wuerde ein naiver Scan bis dorthin
 * fressen und Muell einsammeln statt "foo"). `${...}`-Interpolationen
 * werden als Ganzes uebersprungen (Klammertiefe mitgefuehrt) und durch ein
 * Leerzeichen ersetzt — Anfuehrungszeichen INNERHALB einer Interpolation
 * (z. B. `${x ? 'a' : 'b'}`) brechen den Scan NICHT ab.
 *
 * @param {string} text
 * @param {number} startIndex
 * @param {string} quoteChar - die oeffnende Anfuehrung (fuer den Regelfall)
 * @param {Set<string>} [tokens] - wird uebergeben, wenn Interpolationsinhalte
 *   geerntet werden sollen (Plan 15-11, CR-03a); ohne Parameter bleibt das
 *   Verhalten wie zuvor (Interpolation wird verworfen, kein Ernten).
 * @returns {string}
 */
function scanClassContextValue(text, startIndex, quoteChar, tokens) {
    let out = '';
    let i = startIndex;
    while (i < text.length) {
        const ch = text[i];
        if (ch === '$' && text[i + 1] === '{') {
            let depth = 1;
            let j = i + 2;
            while (j < text.length && depth > 0) {
                if (text[j] === '{') depth++;
                else if (text[j] === '}') depth--;
                j++;
            }
            if (tokens) {
                addTokensFromInterpolation(tokens, text.slice(i + 2, j - 1));
            }
            out += ' ';
            i = j;
            continue;
        }
        if (ch === quoteChar || ch === '"' || ch === "'" || ch === '`') break;
        out += ch;
        i++;
    }
    return out;
}

/**
 * Liest ab `startIndex`, bis (bei Klammertiefe 0) eines der Zeichen in
 * `terminators` auftaucht, die Datei endet, oder MAX_SEGMENT_SCAN_CHARS
 * gelesene Zeichen erreicht sind — dieselbe Klammertiefe-Technik wie
 * `scanClassContextValue()`s `${...}`-Ueberspringen, hier fuer ganze
 * Anweisungen/Werte statt fuer eine einzelne Interpolation (Plan 15-09,
 * CR-01a/CR-01b/CR-01c/WR-01). Ein Zeilenumbruch beendet den Scan NICHT
 * mehr (Plan 15-11, CR-02) — Prettier bricht eine lange Zuweisung nach dem
 * Gleichheitszeichen um, und die vorherige Umbruchschranke lieferte dann
 * ein leeres Segment. An ihrer Stelle steht MAX_SEGMENT_SCAN_CHARS als
 * feste Obergrenze gegen Weglaufen bei einem unbeendeten Konstrukt
 * (T-15-20). Anfuehrungszeichen und ihr Inhalt werden komplett
 * uebersprungen, damit ein Komma oder eine Klammer INNERHALB eines
 * Zeichenketten-Literals den Abbruch nicht vorzeitig ausloest. Eine
 * schliessende Klammer/Kommata/geschweifte Klammer, die bei Tiefe 0
 * auftritt (kein passendes Gegenstueck INNERHALB dieses Aufrufs), beendet
 * den Scan ebenfalls — sie gehoert der umschliessenden Struktur, nicht dem
 * gelesenen Segment.
 *
 * @param {string} text
 * @param {number} startIndex
 * @param {string} terminators - Zeichen, die bei Klammertiefe 0 beenden
 * @returns {string}
 */
function scanBalancedSegment(text, startIndex, terminators) {
    let depth = 0;
    let quote = null;
    let i = startIndex;
    const limit = Math.min(text.length, startIndex + MAX_SEGMENT_SCAN_CHARS);
    while (i < limit) {
        const ch = text[i];
        if (quote) {
            if (ch === '\\' && i + 1 < text.length) {
                i += 2;
                continue;
            }
            if (ch === quote) quote = null;
            i++;
            continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
            quote = ch;
            i++;
            continue;
        }
        if (depth === 0 && terminators.includes(ch)) break;
        if (ch === '(' || ch === '[' || ch === '{') {
            depth++;
        } else if (ch === ')' || ch === ']' || ch === '}') {
            if (depth === 0) break;
            depth--;
        }
        i++;
    }
    return text.slice(startIndex, i);
}

/**
 * Liest den Argumenttext eines classList.*(...)-Aufrufs ab der Stelle direkt
 * nach der oeffnenden Klammer, bis zur zugehoerigen schliessenden Klammer —
 * ueber mitgefuehrte Klammertiefe statt einer Regex-Ausschlussklasse (WR-01,
 * Plan 15-09). Ein geklammerter Ausdruck VOR dem Klassenliteral
 * (`classList.toggle(berechneName(x), 'a')`) geht dadurch nicht mehr
 * verloren.
 *
 * @param {string} text
 * @param {number} startIndex - Position direkt nach der oeffnenden Klammer
 * @returns {string}
 */
function scanBalancedCallArgs(text, startIndex) {
    return scanBalancedSegment(text, startIndex, ')');
}

// Named statt anonym (Plan 15-11, CR-03a) — dieselbe Regex wird jetzt an
// zwei Stellen gebraucht: zum Ernten der Literale VOR dem Verwerfen (hier)
// und weiterhin zum Entfernen des restlichen Ausdruckstexts.
const INTERPOLATION_PLACEHOLDER_RE = /\$\{([^}]*)\}/g;

function addTokensFromValue(tokens, rawValue) {
    // Verbleibende Interpolationsplatzhalter (falls scanClassContextValue
    // nicht verwendet wurde, z. B. aus classList.*-Argumenten) VOR dem
    // Verwerfen nach Zeichenketten-Literalen durchsuchen (Plan 15-11,
    // CR-03a) — der uebrige Ausdruckstext wird weiterhin verworfen, sonst
    // wuerde er selbst zu einem Fantasie-Token werden (z. B. "isAvailable"
    // aus "${isAvailable ? ...}").
    for (const m of rawValue.matchAll(INTERPOLATION_PLACEHOLDER_RE)) {
        addTokensFromInterpolation(tokens, m[1]);
    }
    const cleaned = rawValue.replace(INTERPOLATION_PLACEHOLDER_RE, ' ');
    cleaned
        .split(/\s+/)
        .filter(Boolean)
        .forEach(tok => tokens.add(tok));
}

/**
 * Sammelt aus einem Interpolationsinhalt (dem Text zwischen `${` und `}`)
 * ausschliesslich die Zeichenketten-Literale ueber die vorhandene
 * QUOTED_STRING_RE-Maschinerie und fuehrt sie als Token — der uebrige
 * Ausdruckstext (Bezeichner, Operatoren) wird NICHT zum Token (Plan 15-11,
 * CR-03a).
 *
 * @param {Set<string>} tokens
 * @param {string} interpolationText
 */
function addTokensFromInterpolation(tokens, interpolationText) {
    for (const lit of interpolationText.matchAll(QUOTED_STRING_RE)) {
        addTokensFromValue(tokens, lit[2]);
    }
}

// CR-03b (Plan 15-11, Task 3): Bezeichnernamen aus Buchstaben, Ziffern,
// Unterstrich und Dollarzeichen — die Kandidaten fuer die Zwischenvariablen-
// Form, NACH Entfernung der Zeichenketten-Literale aus einem Textbereich.
const CONCAT_IDENT_RE = /[A-Za-z_$][\w$]*/g;

// Eine var/let/const-Deklaration mit dem Bezeichnernamen in Gruppe 1.
const VAR_DECL_RE = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=/g;

/**
 * Sammelt je Bezeichnername (aus var/let/const-Deklarationen) die
 * Zeichenketten-Literale seines Zuweisungswerts — EINMAL je Dateiinhalt,
 * damit die Kandidatensuche in collectConcatVarLiterals() nachschlaegt statt
 * je Kandidat neu zu suchen (sonst waere sie quadratisch). Reine Funktion,
 * kein Dateisystemzugriff.
 *
 * @param {string} content
 * @returns {Map<string, string[]>}
 */
function collectVarDeclarationLiterals(content) {
    const map = new Map();
    for (const m of content.matchAll(VAR_DECL_RE)) {
        const name = m[1];
        const valueText = scanBalancedSegment(content, m.index + m[0].length, ';');
        const literals = [];
        for (const lit of valueText.matchAll(QUOTED_STRING_RE)) {
            literals.push(lit[2]);
        }
        if (literals.length === 0) continue;
        const existing = map.get(name);
        map.set(name, existing ? existing.concat(literals) : literals);
    }
    return map;
}

/**
 * Vierte Kontextregel (CR-03b, Plan 15-11 Task 3): ein Bezeichner, der per
 * var/let/const aus Zeichenketten-Literalen deklariert und danach INNERHALB
 * DERSELBEN ANWEISUNG wie ein class="..."-Vorkommen konkateniert wird, haelt
 * seine Literale lebendig (reale Form: features/fraktionen/fraktionen-
 * render.js, features/initiative-mob.js).
 *
 * Fuer jedes class=-Vorkommen wird zunaechst die Attributwert-Grenze
 * uebersprungen — dieselbe "eine der drei Anfuehrungsarten schliesst"-Regel
 * wie scanClassContextValue() — damit der anschliessende Anweisungs-Scan an
 * einer ECHTEN Anfuehrungsgrenze beginnt, nicht mitten in einem
 * JS-Zeichenkettenliteral. Wuerde stattdessen direkt nach der class=-
 * Anfuehrung selbst gescannt, verschoebe sich die Anfuehrungs-Paritaet und
 * QUOTED_STRING_RE wuerde spaeter ueber die Grenze zwischen zwei getrennten
 * JS-Literalen hinweg falsch paaren — genau der konkatenierte Bezeichner
 * ginge dabei verloren (empirisch geprueft gegen die beiden realen
 * Fundstellen).
 *
 * @param {string} content
 * @param {Set<string>} tokens
 */
function collectConcatVarLiterals(content, tokens) {
    const declLiterals = collectVarDeclarationLiterals(content);
    if (declLiterals.size === 0) return;
    for (const m of content.matchAll(CLASS_ATTR_OPEN_RE)) {
        const quoteChar = m[1];
        let i = m.index + m[0].length;
        while (i < content.length) {
            const ch = content[i];
            if (ch === '$' && content[i + 1] === '{') {
                let depth = 1;
                let j = i + 2;
                while (j < content.length && depth > 0) {
                    if (content[j] === '{') depth++;
                    else if (content[j] === '}') depth--;
                    j++;
                }
                i = j;
                continue;
            }
            if (ch === quoteChar || ch === '"' || ch === "'" || ch === '`') break;
            i++;
        }
        const rest = scanBalancedSegment(content, i + 1, ';');
        const withoutLiterals = rest.replace(QUOTED_STRING_RE, ' ');
        for (const identMatch of withoutLiterals.matchAll(CONCAT_IDENT_RE)) {
            const literals = declLiterals.get(identMatch[0]);
            if (literals) {
                literals.forEach(lit => addTokensFromValue(tokens, lit));
            }
        }
    }
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
        for (const m of content.matchAll(CLASS_ATTR_OPEN_RE)) {
            const value = scanClassContextValue(content, m.index + m[0].length, m[1], tokens);
            addTokensFromValue(tokens, value);
        }
        for (const m of content.matchAll(CLASS_NAME_ASSIGN_OPEN_RE)) {
            const value = scanClassContextValue(content, m.index + m[0].length, m[1], tokens);
            addTokensFromValue(tokens, value);
        }
        for (const m of content.matchAll(CLASS_NAME_ASSIGN_STMT_RE)) {
            const rest = scanBalancedSegment(content, m.index + m[0].length, ';');
            for (const lit of rest.matchAll(QUOTED_STRING_RE)) {
                addTokensFromValue(tokens, lit[2]);
            }
        }
        for (const m of content.matchAll(CLASS_KEY_ASSIGN_RE)) {
            const rest = scanBalancedSegment(content, m.index + m[0].length, ',}');
            for (const lit of rest.matchAll(QUOTED_STRING_RE)) {
                addTokensFromValue(tokens, lit[2]);
            }
        }
        for (const m of content.matchAll(CLASS_LIST_CALL_RE)) {
            const argsText = scanBalancedCallArgs(content, m.index + m[0].length);
            for (const arg of argsText.matchAll(QUOTED_STRING_RE)) {
                addTokensFromValue(tokens, arg[2]);
            }
        }
        collectConcatVarLiterals(content, tokens);
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
    renderTable,
    CLASS_NAME_ASSIGN_STMT_RE,
    CLASS_KEY_ASSIGN_RE,
    scanBalancedCallArgs,
    addTokensFromInterpolation,
    MAX_SEGMENT_SCAN_CHARS,
    collectConcatVarLiterals,
    CONCAT_IDENT_RE
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
