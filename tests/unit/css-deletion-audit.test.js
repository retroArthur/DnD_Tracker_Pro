/**
 * css-deletion-audit — Gegenprobe des gesamten Loeschstands der Phase 15
 * (Plan 15-12, Task 1)
 *
 * Anders als css-usage-report.test.js (das die Zaehlart des Werkzeugs gegen
 * selbst geschriebene Zeichenketten-Vorlagen pinnt) ist hier der TAGESSTAND
 * des Repos der Pruefgegenstand, nach dem Formvorbild von
 * docs-consistency.test.js: Pfadkonstanten am Dateikopf, die Messung EINMAL
 * auf Modulebene, danach ein describe mit den drei durchnummerierten
 * Faellen.
 *
 * Anlass (15-REVIEW.md CR-01, 15-VERIFICATION.md Gap 1): Plan 15-09 hat nur
 * die zwei damals namentlich bekannten Faelle (.npc-grid, .list-view-
 * container) nachgeprueft. Eine Gegenprobe des GESAMTEN Loeschstands der
 * Phase wurde nie gefahren — vier weitere Regressionen standen ausgeliefert
 * im Baum, waehrend alle Suiten gruen waren. Dieser Test macht die
 * Gegenprobe zu einem dauerhaften Testfall statt einer Handarbeit.
 *
 * Der Test benutzt AUSSCHLIESSLICH collectCssClasses() und
 * collectLiveTokens() aus tools/css-usage-report.js — kein eigenes
 * Zaehlverfahren, sonst koennte die Gegenprobe etwas anderes messen als das
 * Werkzeug und beide sich widersprechen.
 */

const fs = require('fs');
const path = require('path');

const { collectCssClasses, collectLiveTokens } = require('../../tools/css-usage-report.js');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CSS_DIR = path.join(REPO_ROOT, 'assets', 'styles');
const TEMPLATES_DIR = path.join(REPO_ROOT, 'assets', 'templates');
const JS_SCAN_DIRS = ['features', 'systems', 'ui', 'core', 'render', 'utils'];
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'css-classes-before-15-07.json');

// ----------------------------------------------------------------------
// Vergleichsdatei laden (DEL-01)
// ----------------------------------------------------------------------
let fixtureRaw = null;
let fixtureError = null;
try {
    fixtureRaw = fs.readFileSync(FIXTURE_PATH, 'utf8');
} catch (err) {
    fixtureError = err;
}

let fixture = null;
if (fixtureRaw !== null) {
    try {
        fixture = JSON.parse(fixtureRaw);
    } catch (err) {
        fixtureError = err;
    }
}

const classesBefore = fixture && Array.isArray(fixture.classes) ? fixture.classes : [];

// ----------------------------------------------------------------------
// Heutigen Stand messen — EINMAL auf Modulebene, wiederverwendet von allen
// drei Faellen (dieselbe Machinerie wie tools/css-usage-report.js's
// Direktaufruf-Zweig: JS-Verzeichnisse plus Vorlagenverzeichnis).
// ----------------------------------------------------------------------

function readCssFilesToday() {
    return fs
        .readdirSync(CSS_DIR)
        .filter(f => f.endsWith('.css'))
        .map(name => ({ name, content: fs.readFileSync(path.join(CSS_DIR, name), 'utf8') }));
}

function readTemplateFilesToday() {
    return fs
        .readdirSync(TEMPLATES_DIR)
        .filter(f => f.endsWith('.html'))
        .map(name => ({ name, content: fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8') }));
}

function readJsFilesToday() {
    const out = [];
    const walk = dir => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
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

const cssClassesTodaySet = new Set();
readCssFilesToday().forEach(f => {
    collectCssClasses(f.content).forEach(c => cssClassesTodaySet.add(c));
});

const liveTokensToday = collectLiveTokens([...readTemplateFilesToday(), ...readJsFilesToday()]);

// Loeschmenge: in der Vergleichsdatei vorhanden, heute nicht mehr im CSS-Baum
// vorhanden (DEL-03).
const deletedClasses = classesBefore.filter(c => !cssClassesTodaySet.has(c));

// Fehlloeschungen: aus der Loeschmenge, aber vom Werkzeug ueber den heutigen
// Baum als lebendig erkannt (DEL-02). Vollstaendige Zeichenkettengleichheit
// je Klassenname (liveTokensToday ist ein Set exakter Token, kein
// Teilstring-Vergleich) — DEAD-01/encoding.
const wronglyDeleted = deletedClasses.filter(c => liveTokensToday.has(c)).sort();

describe('css-deletion-audit — Gegenprobe des gesamten Loeschstands der Phase 15', () => {
    test('DEL-01: die Vergleichsdatei existiert, nennt ihren Herkunftscommit, und ihre Klassenliste ist nicht leer', () => {
        expect(fixtureError).toBeNull();
        expect(fixture).not.toBeNull();
        expect(typeof fixture.base_ref).toBe('string');
        expect(fixture.base_ref.length).toBeGreaterThan(0);
        expect(Array.isArray(fixture.classes)).toBe(true);
        expect(fixture.classes.length).toBeGreaterThan(0);
    });

    test('DEL-02: keine Klasse, die vor der Loeschwelle in assets/styles/ stand, heute dort fehlt UND vom Werkzeug als lebendig erkannt wird', () => {
        if (wronglyDeleted.length > 0) {
            throw new Error(
                `${wronglyDeleted.length} faelschlich geloeschte Klasse(n) gefunden — als lebendig erkannt, aber nicht mehr in assets/styles/: ${wronglyDeleted.join(', ')}`
            );
        }
        expect(wronglyDeleted).toEqual([]);
    });

    test('DEL-03: die Loeschmenge selbst ist nicht leer', () => {
        expect(deletedClasses.length).toBeGreaterThan(0);
    });
});
