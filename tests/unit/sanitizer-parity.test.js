/**
 * Sanitizer-Paritätstest (Phase 10, Plan 03, Task 2)
 *
 * ZWECK: Der Sanitizer existiert doppelt im Repository (utils/basic.js — Produktion —
 * und utils/testable-utils.js — Test-Zwilling, siehe .planning/codebase/CONCERNS.md
 * §Test Coverage Gaps, High Priority). Dieser Test lädt BEIDE Dateien getrennt per
 * vm.runInContext (Präzedenzmuster: tests/unit/storage-conflict.test.js) und vergleicht
 * ihre Ausgaben für ein gemeinsames Vektor-Set exakt. Er ist der strukturelle Zaun:
 * ab jetzt kann eine Whitelist-Änderung (z. B. der <strike>-Fix aus Task 3) nicht mehr
 * in nur einer der beiden Dateien landen, ohne diesen Test rot zu machen.
 *
 * WICHTIG: Dieser Test MUSS gegen den unveränderten Ist-Zustand (vor Task 3) grün sein —
 * das ist der Beweis der Drift-Freiheit von sanitizeHTML() zum jetzigen Zeitpunkt
 * (10-RESEARCH.md Pitfall 5: sanitizeHTML() ist heute NICHT gedriftet, nur esc() ist es).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let realSanitizeHTML; // utils/basic.js (Produktion)
let testableSanitizeHTML; // utils/testable-utils.js (Test-Zwilling)
let realEsc;
let testableEsc;

function loadSanitizerModule(relativePath) {
    const context = {
        window: { APP_CONFIG: global.APP_CONFIG },
        document: global.document,
        DOMParser: global.DOMParser,
        Node: global.Node,
        console,
        // utils/testable-utils.js endet mit `module.exports = {...}` (CommonJS-Export für
        // Jest) — utils/basic.js hat das nicht, ein neutraler Stub schadet dort aber nicht.
        module: { exports: {} }
    };
    vm.createContext(context);
    const sourceCode = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
    vm.runInContext(sourceCode, context);
    return context;
}

beforeAll(() => {
    const basicContext = loadSanitizerModule('../../utils/basic.js');
    realSanitizeHTML = basicContext.sanitizeHTML;
    realEsc = basicContext.esc;

    const testableContext = loadSanitizerModule('../../utils/testable-utils.js');
    testableSanitizeHTML = testableContext.sanitizeHTML;
    testableEsc = testableContext.esc;
});

test('Vorab-Test: beide sanitizeHTML()-Kopien wurden geladen und sind definiert', () => {
    expect(realSanitizeHTML).toBeDefined();
    expect(typeof realSanitizeHTML).toBe('function');
    expect(testableSanitizeHTML).toBeDefined();
    expect(typeof testableSanitizeHTML).toBe('function');
});

// ============================================================
// GEMEINSAMES VEKTOR-SET (eine einzige benannte Konstante am Dateikopf,
// damit spätere Erweiterungen an genau einer Stelle passieren)
// ============================================================
const VECTOR_SET = [
    // --- Die sechs Pflicht-Angriffsvektoren aus D-15 (identisch zu Task 1) ---
    { name: 'Review-Exploit: Bild mit Fehler-Ereignis', html: '<img src="x" onerror="alert(1)">' },
    { name: 'Ereignis-Attribut ohne Anführungszeichen', html: '<div onclick=alert(1)>Klick</div>' },
    { name: 'Skript-Element mit Inhalt', html: '<script>alert("XSS");document.cookie;</script>' },
    { name: 'Skript-Element gemischte Groß-/Kleinschreibung', html: '<ScRiPt>alert(1)</ScRiPt>' },
    { name: 'Adresse mit Skript-Protokoll im Verweis-Element', html: '<a href="javascript:alert(1)">Link</a>' },
    { name: 'SVG-Element mit Lade-Ereignis-Attribut', html: '<svg onload="alert(1)"><circle r="10"></circle></svg>' },

    // --- Die neun Auszeichnungs-Vektoren, die für die Whitelist relevant sind ---
    { name: 'Fett', html: '<b>Probetext</b>' },
    { name: 'Kursiv', html: '<i>Probetext</i>' },
    { name: 'Unterstrichen', html: '<u>Probetext</u>' },
    { name: 'Durchgestrichen (kurze Schreibweise <s>)', html: '<s>Probetext</s>' },
    { name: 'Durchgestrichen (lange Schreibweise <strike>)', html: '<strike>Probetext</strike>' },
    { name: 'Liste', html: '<ul><li>Probetext</li></ul>' },
    { name: 'Tabelle', html: '<table><tbody><tr><td>Probetext</td></tr></tbody></table>' },
    { name: 'Hervorhebung', html: '<mark>Probetext</mark>' },
    { name: 'Verweis', html: '<a href="https://example.com">Probetext</a>' },
    { name: 'Schriftart-Element', html: '<font face="Arial">Probetext</font>' }
];

// ============================================================
// AUSGABEVERGLEICH — strikte Zeichenketten-Gleichheit, keine Vorverarbeitung
// ============================================================
describe('Paritätstest: gemeinsames Vektor-Set liefert bytegleiche Ausgaben (strikte Gleichheit)', () => {
    test.each(VECTOR_SET)('$name — utils/basic.js und utils/testable-utils.js liefern exakt dieselbe Ausgabe', ({ html }) => {
        const outputReal = realSanitizeHTML(html);
        const outputTestable = testableSanitizeHTML(html);
        // Strikte Gleichheit: kein Trimmen, keine Normalisierung von Groß-/Kleinschreibung,
        // kein Umsortieren von Attributen — abweichender Leerraum ist Drift und muss rot machen.
        expect(outputReal).toBe(outputTestable);
    });
});

// ============================================================
// STRUKTURPRÜFUNG (a): Tag-Behandlung beider Kopien ist identisch
// ============================================================
// allowedTags ist als Konstante INNERHALB von sanitizeHTML() deklariert (Funktionsscope),
// daher über vm.runInContext('allowedTags', context) nicht erreichbar (vm-Eigenheit:
// nur Top-Level-Deklarationen landen am Kontextobjekt bzw. sind per Ausdrucks-Aufruf
// aus der lexikalischen Umgebung des Kontexts lesbar — Funktions-lokale const-Bindungen
// sind das nicht). Direkter Zugriff ist daher NICHT möglich — Fallback aus der Task-Vorgabe:
// für jeden Tag-Namen aus einer im Test gepflegten Liste prüfen, dass beide Kopien ihn
// identisch behandeln (erhalten oder entfernen).
const TAG_CHECK_LIST = [
    // Erlaubte Tags (utils/basic.js allowedTags, Stand vor Task 3)
    'b', 'i', 'u', 's', 'strong', 'em', 'ul', 'ol', 'li', 'p', 'br', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'mark', 'a', 'font',
    // Nicht erlaubte Tags (zur Gegenprobe — beide Kopien müssen sie gleich behandeln)
    'img', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'style', 'link',
    'meta', 'base', 'svg', 'math', 'strike'
];

describe('Strukturprüfung (a): beide Kopien behandeln jeden geprüften Tag-Namen identisch (erhalten oder entfernen)', () => {
    test.each(TAG_CHECK_LIST)('Tag "%s" wird von beiden Kopien gleich behandelt', tag => {
        const dirty = `<${tag}>Inhalt</${tag}>`;
        const outputReal = realSanitizeHTML(dirty);
        const outputTestable = testableSanitizeHTML(dirty);
        const keptInReal = outputReal.toLowerCase().includes(`<${tag}`);
        const keptInTestable = outputTestable.toLowerCase().includes(`<${tag}`);
        expect(keptInReal).toBe(keptInTestable);
    });
});

// ============================================================
// STRUKTURPRÜFUNG (b): bekannte esc()-Abweichung bei der Zahl Null
// ============================================================
// 10-RESEARCH.md Pitfall 5 / CONCERNS.md §Test Coverage Gaps: esc() IST gedriftet
// (im Gegensatz zu sanitizeHTML()). utils/basic.js:esc() nutzt einen truthy-Kurzschluss
// (`s ? ... : ''`) — 0 ist falsy, daher liefert es ''. utils/testable-utils.js:esc()
// hat einen expliziten `if (s === 0) return '0';`-Sonderfall. Dieser Testfall dokumentiert
// den Ist-Unterschied explizit, statt ihn stillschweigend zu übergehen — er darf die
// Suite NICHT rot machen, sondern hält die bekannte Abweichung fest und verhindert,
// dass sie unbemerkt wächst (z. B. auf weitere Eingabewerte).
describe('Strukturprüfung (b): bekannte, dokumentierte esc()-Abweichung bei der Zahl Null', () => {
    test('esc(0): utils/basic.js liefert "" (falsy-Kurzschluss), utils/testable-utils.js liefert "0" (expliziter Sonderfall) — bekannte Drift, kein Regressionsfehler', () => {
        expect(realEsc(0)).toBe('');
        expect(testableEsc(0)).toBe('0');
        // Explizite Dokumentation der Drift, kein Aufruf zur Behebung in diesem Plan
        // (Scope dieses Plans ist ausschließlich der <strike>-Whitelist-Fix, Task 3).
        expect(realEsc(0)).not.toBe(testableEsc(0));
    });

    test('esc() abseits der Null-Sonderrolle bleibt für beide Kopien identisch', () => {
        const samples = ['', null, undefined, '<script>', 'Test äöü', '"quoted"'];
        samples.forEach(sample => {
            expect(realEsc(sample)).toBe(testableEsc(sample));
        });
    });
});
