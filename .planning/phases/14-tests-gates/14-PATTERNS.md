# Phase 14: Tests & Gates - Pattern Map

**Mapped:** 2026-09-06
**Files analyzed:** 20 (neu oder geändert)
**Analogs found:** 18 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tools/generate-eslint-globals.js` | utility (generator) | transform (source→artifact) | `build.py::check_duplicate_functions()` | role-match (Python→JS-Port desselben Verfahrens) |
| `eslint.generated-globals.js` | config (generated artifact) | transform | *(kein Analog — neuer Artefakttyp)* | keiner |
| `tests/unit/eslint-globals-freshness.test.js` | test (drift guard) | transform/static | `tests/unit/console-hygiene.test.js` | exact |
| `tests/unit/module-test-coverage.test.js` | test (drift guard) | static | `tests/unit/console-hygiene.test.js` + `tests/unit/tab-registry.test.js` (statischer Teil) | exact |
| `tests/e2e/helpers/test-utils.js` (`seedCleanSession`) | utility (test helper) | request-response (Playwright `addInitScript`) | vorhandene Exporte in derselben Datei (`loadApp`, `clearAppData`) | exact (gleiche Datei, gleiche Konvention) |
| `tests/e2e/crud/locations.spec.js` | test (E2E) | event-driven (UI-Interaktion) | `tests/e2e/crud/party.spec.js` (Seed-Block-Quelle) | exact |
| `tests/e2e/crud/encounters.spec.js` | test (E2E) | event-driven | `tests/e2e/crud/party.spec.js` | exact |
| `tests/e2e/crud/party.spec.js` / `npcs.spec.js` / `quests.spec.js` | test (E2E) | event-driven | einander (byte-identischer Seed-Block, Extraktionsquelle) | exact |
| `tests/e2e/features/session-prep.spec.js` | test (E2E) | event-driven | `tests/e2e/features/welt-story.spec.js` (Quelle, `describe`-Block WELT-01, Zeile 21ff.) | exact (Split, keine Neuentwicklung) |
| `tests/e2e/features/npc-generator.spec.js` | test (E2E) | event-driven | `welt-story.spec.js` (WELT-02, Zeile 115ff.) | exact |
| `tests/e2e/features/timeline.spec.js` | test (E2E) | event-driven | `welt-story.spec.js` (WELT-03 „Kalender-Tab", Zeile 249ff.) | exact |
| `tests/e2e/features/reise.spec.js` | test (E2E) | event-driven | `welt-story.spec.js` (WELT-04, Zeile 310ff.) | exact |
| `tests/e2e/features/fraktionen.spec.js` | test (E2E) | event-driven | `welt-story.spec.js` (WELT-05, Zeile 383ff.) | exact |
| `tests/unit/session-prep.test.js` | test (unit) | transform (vm+readFileSync) | `tests/unit/welt-story.test.js` (WELT-01, Zeile 15ff.) | exact |
| `tests/unit/npc-generator.test.js` | test (unit) | transform | `welt-story.test.js` (WELT-02, Zeile 109ff.) | exact |
| `tests/unit/timeline.test.js` | test (unit) | transform | `welt-story.test.js` (WELT-03 „Kampagnen-Timeline", Zeile 192ff.) | exact |
| `tests/unit/reise.test.js` | test (unit) | transform | `welt-story.test.js` (WELT-04, Zeile 301ff.) | exact |
| `tests/unit/fraktionen.test.js` | test (unit) | transform | `welt-story.test.js` (WELT-05, Zeile 500ff.) | exact |
| `tsconfig.strict.json` | config | static | `tsconfig.json` (Basis, per `extends`) | exact |
| `jest.config.cjs` (Änderung) | config | static | sich selbst (nur `roots`/`coverageThreshold` ändern) | exact |
| `eslint.config.js` (Änderung) | config | static | sich selbst (bestehende Block-Struktur erweitern) | exact |
| `package.json` (`scripts`) | config | static | sich selbst | exact |
| `systems/avatars.js:17` (Änderung) | utility (validation) | transform | bestehende `no-misleading-character-class`-Disable-Zeile im selben Projekt (Konvention: Disable + Begründung + Referenz) | role-match |
| `ui/actions/entity-actions.js`, `system-actions.js`, `ui-actions.js` (Änderung) | controller (action registry) | event-driven | sich selbst (bestehende Registry-Einträge in derselben Datei) | exact |
| `types/globals.d.ts` (Änderung) | config (ambient types) | static | sich selbst | exact |

## Pattern Assignments

### `tools/generate-eslint-globals.js` (utility/generator, transform)

**Analog:** `build.py:173-208` (`check_duplicate_functions`) — dasselbe Klammertiefen-Scan-Verfahren, nur Zweck vertauscht (Namen sammeln statt Duplikate melden). RESEARCH.md liefert bereits eine vollständige JS-Portierung dieses Musters (Abschnitt „D-08: Vollständiger Ablauf"); sie ist wortgetreu zu übernehmen, nicht neu zu entwerfen.

**Kernmuster** (aus `build.py`, 1:1 auf JS zu portieren):
```python
decl_pattern = re.compile(r'^\s*(function|const|let|class)\s+(\w+)')
seen = {}
for module in modules:
    path = os.path.join(source_dir, module)
    if not os.path.exists(path):
        continue
    content = read_file(path)
    depth = 0
    for line in content.split('\n'):
        match = decl_pattern.match(line) if depth == 0 else None
        for ch in line:
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
        if match:
            name = match.group(2)
            seen[name] = module
```

**Wichtige Abweichung für D-08 (bewusst, nicht ein Bug beim Portieren):** Muster enthält **kein `var`** — `var X = window.X;` sind reine Aliase, keine echten Deklarationen; sie sollen NICHT in die generierte Globals-Liste aufgenommen werden (die eigentliche Deklaration wird bereits vom `function|const|let|class`-Zweig erfasst). RESEARCH.md hält das ausdrücklich fest (Pattern 1).

**Modulliste extrahieren** — dasselbe Regex-Verfahren wie in `console-hygiene.test.js:53-64` und `tab-registry.test.js:37-43,84-86` (jeweils `const\s+MODULES\s*=\s*\[([\s\S]*?)\];` gegen `loader.js`). Alle drei Stellen (der neue Generator, `console-hygiene`, `tab-registry`) sollten dasselbe Extraktions-Idiom benutzen, damit ein künftiger `loader.js`-Formatwechsel nur an einer Baustelle behoben werden muss (idealerweise als geteilte kleine Hilfsfunktion, falls der Planer das für sinnvoll hält — nicht zwingend, aber konsistent mit ARCH-01-Denkweise).

---

### `tests/unit/eslint-globals-freshness.test.js` (test/drift-guard)

**Analog:** `tests/unit/console-hygiene.test.js` (komplett, 169 Zeilen) — exaktes strukturelles Vorbild für „aus `loader.js MODULES` ableiten, gegen ein Artefakt/einen Zustand vergleichen, bei Drift rot werden".

**Imports-Muster** (Zeilen 33-40):
```javascript
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');
```

**Extraktionsfunktion, wörtlich wiederverwendbar** (Zeilen 50-64):
```javascript
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
```

**Drift-Assertion-Muster** (RESEARCH.md liefert die konkrete Form für D-08, angelehnt an das `console-hygiene`-Prinzip „leer-grün ist schlimmer als rot"):
```javascript
test('leitet mindestens ein Modul aus loader.js MODULES ab', () => {
    if (modules.length === 0) {
        throw new Error('... 0 Module gefunden. Ein leer-gruener Test waere schlimmer als keiner.');
    }
    expect(modules.length).toBeGreaterThan(0);
});

test('eslint.generated-globals.js ist nicht veraltet gegenüber loader.js MODULES', () => {
    const { generateGlobalsFromModules } = require('../../tools/generate-eslint-globals');
    const checkedIn = require('../../eslint.generated-globals.js').default;
    const fresh = generateGlobalsFromModules();
    expect(Object.keys(checkedIn).sort()).toEqual(Object.keys(fresh).sort());
});
```

**Fehlerbericht-Muster bei Verstoß** (Zeilen 113-118, für optionale Zusatzprüfungen z. B. „Datei aus MODULES existiert nicht"):
```javascript
if (violations.length > 0) {
    throw new Error(`... (${violations.length}):\n` + violations.join('\n'));
}
```

---

### `tests/unit/module-test-coverage.test.js` (test/drift-guard)

**Analog:** `tests/unit/tab-registry.test.js` — statischer Teil (Zeilen 1-97), insbesondere das Prinzip „Bezeichner aus dem Quelltext gewinnen, gegen alle `loader.js MODULES`-Dateien per `test.each` prüfen, mit einer eingecheckten, datierten Ausnahmeliste für bekannte Lücken".

**Kernmuster — Modulliste + Existenzcheck je Bezeichner** (Zeilen 79-96, hier zu spiegeln als „je Modul: kommt sein Basisname in mindestens einer Testdatei vor"):
```javascript
test.each(registryIdentifiers)(
    '%s ist als Top-Level-Deklaration in mindestens einer geladenen Datei vorhanden',
    identifier => {
        const declarationPattern = new RegExp(`^function ${identifier}\\(`, 'm');
        const loaderSource = fs.readFileSync(LOADER_PATH, 'utf8');
        const modulesMatch = loaderSource.match(/const MODULES = \[([\s\S]*?)\n\];/);
        expect(modulesMatch).not.toBeNull();
        const moduleFiles = [...modulesMatch[1].matchAll(/'([^']+\.js)'/g)].map(m => m[1]);

        const foundIn = moduleFiles.filter(relPath => {
            const fullPath = path.join(REPO_ROOT, relPath);
            if (!fs.existsSync(fullPath)) return false;
            return declarationPattern.test(fs.readFileSync(fullPath, 'utf8'));
        });
        expect(foundIn.length).toBeGreaterThan(0);
    }
);
```

**Für D-13 abzuwandeln:** statt Bezeichner→Deklaration (tab-registry) wird hier Modul→Testerwähnung geprüft, mit einer **eingecheckten Ausnahmeliste** als Ratsche (analoges Konzept zu `console-hygiene.test.js`s `SANCTIONED_MARKER`, dort für Konsolenausgaben, hier für Module ohne Testerwähnung). Kommentar-Konvention übernehmen: Grund + Referenz auf die verursachende Entscheidung, siehe `console-hygiene.test.js:1-31` (Kopfkommentar erklärt die Ausnahme-Herkunft).

**Wichtig laut RESEARCH.md:** Das Substring-Kriterium (75/134-Basislinie) ist grob und muss vor dem Festschreiben präzisiert und neu erhoben werden — der Planer definiert das exakte Matching-Kriterium selbst; dieses PATTERNS.md liefert nur die Testgerüst-Form.

---

### `tests/e2e/helpers/test-utils.js` (`seedCleanSession`) (utility/test-helper, request-response)

**Analog:** dieselbe Datei — bestehende Exporte `loadApp` (Zeilen 7-17) und `clearAppData` (Zeilen 176-201) zeigen die etablierte Konvention: JSDoc mit `@param {import('@playwright/test').Page} page`, `export async function ...`, deutsche Kommentare.

**Extraktionsquelle — byte-identischer Seed-Block** (61 Zeilen, md5 `6364cafedc46ba23962c342745340154`, z. B. `tests/e2e/crud/party.spec.js:26-79`, siehe auch `npcs.spec.js`/`quests.spec.js`):
```javascript
// 08-RESEARCH Pitfall 4 / D-06: seed markdownOnboardingSeen BEFORE loadApp()
// ... [40-zeiliger Ursachenkommentar — MUSS laut D-01 mitwandern] ...
await page.addInitScript(() => {
    try {
        localStorage.setItem(
            'dnd-tracker-v4',
            JSON.stringify({
                _version: '99.0.0',
                settings: { theme: 'dark', lastView: 'dashboard', enableMarkdownShortcuts: true,
                    enableMarkdownImportExport: true, markdownOnboardingSeen: true, levelingMode: 'xp' },
                randomTables: [], timers: [], shops: [], campaign: {},
                _nextId: { characters: 1, npcs: 1, locations: 1, quests: 1, encounters: 1,
                    spells: 1, loot: 1, items: 1, wiki: 1, sessionNotes: 1, randomTables: 1 }
            })
        );
    } catch {
        // file:// localStorage restrictions vary by browser build ...
    }
});
```

**Zielsignatur (D-01):** `export async function seedCleanSession(page) { ... }` — Körper ist exakt der obige Block (inkl. Kommentar), Aufrufer ersetzen ihre lokale Kopie durch `await seedCleanSession(page);` vor `await loadApp(page);`. `locations.spec.js`/`encounters.spec.js` erhalten denselben Aufruf neu (heute fehlt er dort komplett — Zeilen 16-19 in `locations.spec.js` zeigen den unveränderten, seedlosen `beforeEach`).

---

### `tests/e2e/crud/locations.spec.js` / `encounters.spec.js` (Änderung)

**Analog:** `tests/e2e/crud/party.spec.js` (nach D-01 die neue Aufrufform).

**Vorher** (`locations.spec.js:16-19`, unverändert seit Erstellung):
```javascript
test.describe('Locations - CRUD Operationen', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'locations');
    });
```

**Nachher (Ziel-Pattern, aus `party.spec.js`s künftiger Form abgeleitet):**
```javascript
import { loadApp, navigateToTab, /* ... */, seedCleanSession } from '../helpers/test-utils.js';

test.describe('Locations - CRUD Operationen', () => {
    test.beforeEach(async ({ page }) => {
        await seedCleanSession(page);
        await loadApp(page);
        await navigateToTab(page, 'locations');
    });
```

Assertion-Fundstellen, die dadurch stabil werden sollen: `locations.spec.js:80` (`toContainText`), `encounters.spec.js:131-132`.

---

### `tests/e2e/features/{session-prep,npc-generator,timeline,reise,fraktionen}.spec.js` (test/E2E, mechanischer Split)

**Analog:** `tests/e2e/features/welt-story.spec.js` selbst — jede Zieldatei ist der wörtlich unveränderte Inhalt eines `test.describe`-Blocks plus dessen lokalem `beforeEach`/Imports.

**Import-Kopf, unverändert zu übernehmen** (Datei-Kopf vor Zeile 21, nicht in der gelieferten Ausgabe enthalten aber Standard-Playwright-Konvention wie in `locations.spec.js`):
```javascript
import { test, expect } from '@playwright/test';
import { loadApp, navigateToTab, /* ... je nach Block */ } from '../helpers/test-utils.js';
```

**Block-Grenzen (exakte Zeilen, für den Split):**
| Zieldatei | Quellblock | Zeilen in `welt-story.spec.js` |
|---|---|---|
| `session-prep.spec.js` | `WELT-01: Session-Prep-Tab` | 21–114 |
| `npc-generator.spec.js` | `WELT-02: NPC-Generator` | 115–248 |
| `timeline.spec.js` | `WELT-03: Kalender-Tab` | 249–309 |
| `reise.spec.js` | `WELT-04: Reise-Tab` | 310–382 |
| `fraktionen.spec.js` | `WELT-05: Fraktionen-Tab` | 383–Ende (520) |

**D-06 beachten:** `welt-story.spec.js` baut `APP_URL` selbst statt `loadApp()` zu nutzen (falls das dort der Fall ist) — beim Verschieben NICHT auf `loadApp()` umstellen, auch wenn das inkonsistent aussieht. Verhaltensneutralität hat Vorrang vor Konsistenz in diesem Schritt.

**Abnahme (D-05, binär):** Summe der Tests über alle fünf neuen Dateien = 26 (unverändert gegenüber der Quelldatei).

---

### `tests/unit/{session-prep,npc-generator,timeline,reise,fraktionen}.test.js` (test/unit, mechanischer Split)

**Analog:** `tests/unit/welt-story.test.js` selbst — analoges Verfahren zum E2E-Split, aber mit `vm`+`readFileSync`-Ladepfad (Projektkonvention für die meisten Unit-Tests, siehe RESEARCH.md „30 von 40" bzw. neu gemessen „28 von 40").

**Block-Grenzen:**
| Zieldatei | Quellblock | Zeilen in `welt-story.test.js` |
|---|---|---|
| `session-prep.test.js` | `WELT-01: Session-Prep-Assistent` | 15–108 |
| `npc-generator.test.js` | `WELT-02: NPC-Generator` | 109–191 |
| `timeline.test.js` | `WELT-03: Kampagnen-Timeline` | 192–300 |
| `reise.test.js` | `WELT-04: Reise- & Wetter-Simulator` | 301–499 |
| `fraktionen.test.js` | `WELT-05: Fraktionen & Ruf-System` | 500–Ende (593) |

**Wichtig:** Jeder Block trägt sein eigenes `makeMockD()` und eigene `global.*`-Stubs (D-05) — beim Split muss dieses lokale Setup **mit** in die jeweilige Zieldatei wandern, nicht in eine gemeinsame Setup-Datei extrahiert werden (das wäre bereits eine Verhaltens-/Strukturänderung über den Split hinaus, von D-05 ausgeschlossen).

**Namens-Inkonsistenz dokumentiert in RESEARCH.md:** E2E nennt Block 3 „Kalender-Tab", Unit nennt ihn „Kampagnen-Timeline" — Zielname ist laut D-04 einheitlich `timeline` (nach Quellverzeichnis `features/timeline/`), unabhängig von den `describe`-Beschriftungen.

**Abnahme (D-05, binär):** Summe der Tests über alle fünf neuen Dateien = 37.

---

### `tsconfig.strict.json` (config, neu)

**Analog:** `tsconfig.json` (komplett gelesen, 46 Zeilen) — Basis für `extends`.

**Bestehende Datei, relevante Felder zum Überschreiben** (`tsconfig.json:8-9`):
```jsonc
"allowJs": true,
"checkJs": false,
```
und `include` (Zeilen 33-40):
```jsonc
"include": [
    "core/**/*.js", "features/**/*.js", "ui/**/*.js", "utils/**/*.js",
    "systems/**/*.js", "render/**/*.js", "types/**/*.d.ts"
],
```

**Neue Datei (aus RESEARCH.md, exaktes Muster für D-11):**
```jsonc
{
    "extends": "./tsconfig.json",
    "compilerOptions": { "checkJs": true, "noEmit": true, "emitDeclarationOnly": false },
    "include": [ /* 17 aktuell fehlerfreie Dateien — VOR Festschreibung neu erheben, siehe Pitfall 2 in RESEARCH.md */ ]
}
```
`include` **überschreibt** (nicht mergt) die Basis-`include` bei `extends` — TypeScript-Doku-verifiziertes Verhalten, in RESEARCH.md zitiert.

---

### `jest.config.cjs` (Änderung, D-12/D-14)

**Analog:** die Datei selbst (73 Zeilen, komplett gelesen).

**Zeile 6, zu ändern:**
```javascript
roots: ['<rootDir>/tests'],   // VORHER — blockiert collectCoverageFrom
```
→
```javascript
roots: ['<rootDir>'],         // NACHHER
```

**Zeilen 65-72, `coverageThreshold` anzuheben** von 80/80/80/80 auf die frisch gemessenen Werte (Statements 92,81 % / Branches 89,28 % / Functions 100 % / Lines 94,44 %, knapp darunter runden — RESEARCH.md liefert 92/89/100/94 als Beispielwerte, vom Planer vor Festschreibung erneut zu messen).

**`collectCoverageFrom` (Zeilen 45-58) bleibt unverändert** — der Fix liegt ausschließlich in `roots`, nicht in den Pfadmustern selbst (per RESEARCH.md „Alternatives Considered" bestätigt: Pfadstil-Änderung allein löst das Problem nicht).

---

### `eslint.config.js` (Änderung, D-07/D-08/D-09/D-10)

**Analog:** die Datei selbst (Flat-Config, `tseslint.config(...)`-Aufruf mit mehreren Objekten in einem Array — bestehende Struktur bereits mehrfach modular, neue Blöcke fügen sich als weitere Array-Elemente ein).

**Bestehender globaler Regelblock, zu ändern** (Zeilen ~89-108, `files: ['**/*.js']`):
```javascript
'no-undef': 'warn',   // VORHER
```
→
```javascript
'no-undef': 'error',  // NACHHER (D-08, erst nach Generator + D-09-Fixes)
```

**Bestehender Test-Block** (`files: ['tests/**/*.js', 'tests/**/*.ts']`, ab Zeile ~112) — bereits vorhanden, um Node-Globals (`require`, `module`, `__dirname`, `process`, `global`) zu ergänzen (D-08, kleinerer Teil).

**Neuer Block für `tools/**`** — existiert heute nicht, exaktes Muster in RESEARCH.md „Code Examples" vorgegeben (gleiche Node-Globals wie der Test-Block).

**Import des generierten Artefakts, an den Dateikopf:**
```javascript
import generatedGlobals from './eslint.generated-globals.js';
```
und ein eigener Config-Block `{ languageOptions: { globals: generatedGlobals } }` — Flat-Config mergt `languageOptions.globals` additiv über mehrere Objekte im selben `tseslint.config(...)`-Array (per ESLint-Doku verifiziert, siehe RESEARCH.md Sources).

**D-07, gezielter Disable — Analog für die Kommentarkonvention** (`eslint.config.js` hat bereits eine begründete Regel-Ausnahme im Kommentar, Zeile ~108: `// Emoji-Zeichenklassen im Bestand (dice-core.js) — bewusst 'warn', kein u-Flag-Umbau in der Stabilisierungsphase`). Dieselbe Konvention (Grund + Kontext in derselben Zeile/direkt darüber) für den neuen `eslint-disable-next-line` in `systems/avatars.js:17` verwenden:
```javascript
// eslint-disable-next-line no-control-regex -- WR-01 (Phase 12, d2a521c): Steuerzeichen-Strip ist der Security-Fix selbst
```

---

### `ui/actions/system-actions.js` (D-09, `export-csv`-Bugfix)

**Analog:** dieselbe Datei — bestehende Registry-Einträge in `EntityActions`/`SystemActions`-artigen Objekten (Muster `'action-name': ctx => handlerFn(ctx.value)`).

**Fundstelle** (`system-actions.js:14`):
```javascript
'export-csv': ctx => exportDataCSV(ctx.value),
```
**Fix (D-09-Regel: `data-action` verweist darauf → echter Bedienfehler, nicht Aufräum-Item):**
```javascript
'export-csv': ctx => exportToCSV(ctx.value),
```
Die reale Implementierung liegt in `systems/spellslots/import-export.js:233` (`function exportToCSV(dataType)`). **Im selben Task** `types/globals.d.ts:437` korrigieren (`function exportDataCSV(type: string): void;` → entfernen oder auf `exportToCSV` umbenennen), sonst bleibt eine zweite, falsche Wahrheit im Typsystem.

### `ui/actions/entity-actions.js` / `ui-actions.js` (D-09, restliche 4 tote Ziele)

**Bestätigt per Grep in dieser Sitzung — kein `data-action` in `assets/templates/**` verweist auf** `scroll-to-npc`, `remove-loot-tag`, `populate-import-nodes`, `set-view-mode` (RESEARCH.md Pitfall 1 bestätigt dies bereits für die ersten drei; `set-view-mode` liegt in `ui-actions.js:22`, gleiche Prüfung anzuwenden). Nach D-09s Entscheidungsregel: Registrierungszeilen entfernen, kein Handler-Nachtrag nötig.

**Analog für „Registrierung entfernen":** die Registry-Objekt-Struktur selbst (`entity-actions.js:19-25` zeigt das Muster `'action-key': ctx => fn(...)` als einzeilige Objekteinträge) — Entfernen bedeutet, die jeweilige Zeile ersatzlos aus dem Objektliteral zu streichen.

## Shared Patterns

### SSoT + Drift-Test (loader.js MODULES als Quelle)
**Source:** `tests/unit/console-hygiene.test.js` (komplett) + `tests/unit/tab-registry.test.js:37-96` (statischer Teil)
**Apply to:** `tools/generate-eslint-globals.js`, `tests/unit/eslint-globals-freshness.test.js`, `tests/unit/module-test-coverage.test.js`
```javascript
function extractModulesFromLoader(source) {
    const match = source.match(/const\s+MODULES\s*=\s*\[([\s\S]*?)\];/);
    if (!match) return [];
    const entries = [];
    const entryPattern = /'([^']+)'|"([^"]+)"/g;
    let m;
    while ((m = entryPattern.exec(match[1])) !== null) entries.push(m[1] || m[2]);
    return entries;
}
```

### Brace-Depth-0 Deklarations-Scan
**Source:** `build.py:173-208` (`check_duplicate_functions`)
**Apply to:** `tools/generate-eslint-globals.js` (Kernlogik)
```python
depth = 0
for line in content.split('\n'):
    match = decl_pattern.match(line) if depth == 0 else None
    for ch in line:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
```

### Playwright-Testdatei-Konvention (Imports, `test.describe`, `beforeEach`)
**Source:** `tests/e2e/crud/party.spec.js:1-20`, `locations.spec.js:1-20`
**Apply to:** alle 5 neuen `tests/e2e/features/*.spec.js`
```javascript
// @ts-check
import { test, expect } from '@playwright/test';
import { loadApp, navigateToTab, /* ... */ } from '../helpers/test-utils.js';

test.describe('Feature-Name', () => {
    test.beforeEach(async ({ page }) => {
        await loadApp(page);
        await navigateToTab(page, 'tabName');
    });
    // ...
});
```

### Fehlerbericht-Sammlung bei Verstoß (statische Tests)
**Source:** `console-hygiene.test.js:96-118`
**Apply to:** `module-test-coverage.test.js`, `eslint-globals-freshness.test.js`
```javascript
const violations = [];
// ... pro Fund: violations.push(`${relPath}:${idx + 1}: ...`);
if (violations.length > 0) {
    throw new Error(`... (${violations.length}):\n` + violations.join('\n'));
}
```

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `eslint.generated-globals.js` | config (generiertes Artefakt) | transform | Erster eingecheckter Codegen-Artefakttyp im Projekt — es gibt keine vergleichbare `export default {...}`-generierte Datei; Format frei nach RESEARCH.md-Vorgabe zu wählen (ESM `export default`, alphabetisch sortiert, `'readonly'`-Werte) |
| `.github/workflows/ci.yml` (Job-Erweiterung um `typecheck:strict`) | config (CI) | static | Datei nicht in dieser Sitzung gelesen (nicht im Required-Reading-Umfang); RESEARCH.md liefert die nötige Zeile (`- run: npm run typecheck:strict` im Job `lint-and-typecheck`) — Planer sollte die Datei vor dem Schreiben kurz einsehen, um die exakte Einfügestelle relativ zu vorhandenen `needs:`-Ketten zu bestätigen |

## Metadata

**Analog search scope:** `tests/unit/`, `tests/e2e/crud/`, `tests/e2e/features/`, `tests/e2e/helpers/`, `ui/actions/`, `build.py`, `eslint.config.js`, `jest.config.cjs`, `tsconfig.json`, `package.json`
**Files scanned:** ~15 direkt gelesen (vollständig oder gezielt per Zeilenbereich), zusätzlich per Grep gegen `assets/templates/**` und `ui/actions/**` verifiziert
**Pattern extraction date:** 2026-09-06
