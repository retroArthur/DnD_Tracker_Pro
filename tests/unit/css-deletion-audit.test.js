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
const wronglyDeletedRaw = deletedClasses.filter(c => liveTokensToday.has(c)).sort();

// Bekannte Fehlalarme der Gegenprobe (DEAD_EXCEPTIONS-Analogon, Plan 15-12
// Task 1/2): der erste volle Lauf dieser Gegenprobe nannte 22 Klassen statt
// der sechs aus 15-REVIEW.md CR-01 erwarteten Familien. Fuer die restlichen
// 15 wurde per Nachverfolgung (Zurueckbau von collectConcatVarLiterals()
// Schritt fuer Schritt gegen die reale Fundstelle, siehe 15-12-SUMMARY.md
// "Detektor-Fehlalarm") belegt: jede stammt aus derselben Ursache — ein
// kurzer, mehrfach verwendeter Bezeichner (z.B. "c", "select", "searchEl",
// "viewMap") wird per `const NAME = $('irgendeine-id')` oder einer
// unabhaengigen Objekt-/Array-Literalen deklariert, die zufaellig einen
// String enthaelt, der wortgleich mit einer echt geloeschten CSS-Klasse ist;
// `collectConcatVarLiterals()`s anweisungsweiter Vorwaertsscan ab einem
// `class="..."`-Vorkommen erstreckt sich (bis zu 2000 Zeichen oder das
// naechste ";") weit genug, um diesen voellig unabhaengigen Bezeichner
// spaeter im selben, nur klammertiefen-gebundenen "Anweisungsfenster"
// aufzugreifen — ohne zu pruefen, ob tatsaechlich eine Verkettung in den
// Klassenwert stattfindet. Das ist ein echter, reproduzierbarer Fehlalarm
// der Erkennungserweiterung aus Plan 15-11 (CR-03b), NICHT eine echte
// Fehlloeschung: keine dieser 15 Klassen wird tatsaechlich per
// class="..."/.className=/classList.*()/-Objektschluessel einem Element
// zugewiesen. `tools/css-usage-report.js` selbst darf in diesem Plan nicht
// geaendert werden (Planvorgabe) — die Korrektur des Detektors (die
// Konkatenation statt blosser Woertlich-Ko-Vorkommen im Anweisungsfenster
// verlangen muesste) ist daher als eigener Befund vertagt
// (deferred-items.md Eintrag 4, .planning/WINDOWS.md).
//
// Diese Liste schraenkt NICHT den Geltungsbereich der Gegenprobe auf
// "bereits bekannte Faelle" ein (DEAD-02-Verbot) — jede der 15 Klassen ist
// einzeln, mit Beleg (Bezeichner + Datei), nachvollzogen; eine kuenftige,
// ECHTE Fehlloeschung mit einem ANDEREN Klassennamen bleibt weiterhin rot.
const KNOWN_FALSE_POSITIVES = Object.freeze([
    {
        class: 'description',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "score" (performance-extras.js (im utils/-Verzeichnis)) wird aus fuzzySearchFields(..., ["name", ..., "description"]) deklariert; "description" ist dort ein Suchfeldname, keine CSS-Klasse.'
    },
    {
        class: 'dice-char-select',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "select"/"selectEl" (dice-core.js (im features/dice/-Verzeichnis)) sind $("dice-char-select")-Element-ID-Referenzen, keine Klassenverkettung.'
    },
    {
        class: 'dice-formula-history',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "c" (dice-core.js (im features/dice/-Verzeichnis)) ist eine $("dice-formula-history")-Element-ID-Referenz, keine Klassenverkettung.'
    },
    {
        class: 'dice-history',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "c" (dice-core.js (im features/dice/-Verzeichnis), andere Fundstelle) ist eine $("dice-history")-Element-ID-Referenz, keine Klassenverkettung.'
    },
    {
        class: 'divider',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "structureItems" (ui/editors/editor-toolbar-build.js) ist eine Werkzeugleisten-Struktur-Liste, keine Klassenverkettung.'
    },
    {
        class: 'enc-search',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "searchEl" (features/encounters/encounters-render.js) ist eine $("enc-search")-Element-ID-Referenz, keine Klassenverkettung.'
    },
    {
        class: 'encounter',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "viewMap"/"allowedTypes"/"lookupMap" (entity-links.js (im systems/-Verzeichnis), systems/search/global-search.js, locations-render.js (im features/locations/-Verzeichnis)) sind Typ-Name-Zuordnungstabellen, keine Klassenverkettung.'
    },
    {
        class: 'loc-search',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "searchEl" (locations-render.js (im features/locations/-Verzeichnis)) ist eine $("loc-search")-Element-ID-Referenz, keine Klassenverkettung.'
    },
    {
        class: 'loot',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "viewMap"/"allowedTypes"/"searchIn" (entity-links.js (im systems/-Verzeichnis), systems/search/global-search.js, tags.js (im systems/-Verzeichnis)) sind Typ-Name-/Suchfeld-Listen, keine Klassenverkettung.'
    },
    {
        class: 'loot-search',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "searchInput" (initiative-loot.js (im features/-Verzeichnis)) ist eine $("loot-search")-Element-ID-Referenz, keine Klassenverkettung.'
    },
    {
        class: 'npc-search',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "searchEl" (features/npcs/npc-render.js) ist eine $("npc-search")-Element-ID-Referenz, keine Klassenverkettung.'
    },
    {
        class: 'party',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "viewMap" (entity-links.js (im systems/-Verzeichnis))/"existingRelations" (features/npcs/npc-render.js) sind Typ-Name-Zuordnung bzw. NPC-Beziehungsliste, keine Klassenverkettung.'
    },
    {
        class: 'timer-list',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "c" (timers.js (im features/timers/-Verzeichnis)) ist eine $("timer-list")-Element-ID-Referenz, keine Klassenverkettung.'
    },
    {
        class: 'timer-name',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "nameInput" (timers.js (im features/timers/-Verzeichnis)) ist eine Element-Referenz auf ein Eingabefeld, keine Klassenverkettung.'
    },
    {
        class: 'timer-presets',
        date: '2026-09-11',
        reason:
            'concat-var-Fehlalarm: "container" (timers.js (im features/timers/-Verzeichnis)) ist eine allgemeine Containerreferenz, keine Klassenverkettung.'
    }
]);

const falsePositiveNames = new Set(KNOWN_FALSE_POSITIVES.map(e => e.class));
const wronglyDeleted = wronglyDeletedRaw.filter(c => !falsePositiveNames.has(c));

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
