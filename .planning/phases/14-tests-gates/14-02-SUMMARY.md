---
phase: 14-tests-gates
plan: 02
subsystem: testing
tags: [eslint, no-undef, globals-generator, loader-modules, arch-01, tdd]

# Dependency graph
requires:
  - phase: 14-tests-gates
    provides: "14-01: npx eslint . laeuft mit Exit 0 (D-07) — Vorbedingung des Tracer-Tasks; 14-GATE-BASELINE.md als Ausgangswert (1829 no-undef-Vorkommen/539 Namen, 2196 Warnungen gesamt)"
provides:
  - "Globals-Generator (tools/generate-eslint-globals.js) leitet Cross-Modul-Globals aus loader.js MODULES ab (ARCH-01) — keine zweite, handgepflegte Namensliste"
  - "eslint.generated-globals.js: eingechecktes Artefakt mit 1398 Namen, von eslint.config.js per import eingelesen"
  - "tests/unit/eslint-globals-freshness.test.js: Drift-Waechter, nachweislich in der Lage rot zu werden"
  - "npm run globals:generate: reproduzierbarer Regenerierungsweg"
  - "no-undef auf 577 Vorkommen (Task 1) dann auf genau 7 D-09-Fundstellen (Task 2) reduziert — Vorbedingung fuer 14-06s no-undef: error"
affects: [14-06, 14-09]

# Actuals (#2632)
actuals:
  tokens: 18000
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Generator + Drift-Test teilen sich denselben Code (module.exports aus tools/*.js) — keine Parallelimplementierung, Vorbild tests/unit/console-hygiene.test.js (13-08)"
    - "Klammertiefe-0-Scan aus build.py's check_duplicate_functions() nach JavaScript portiert, um async function/var/class erweitert (Globals-Generator darf nicht konservativ sein wie ein Duplikatpruefer)"
    - "readonly/writable je nach Deklarationsart (let/var -> writable, const/function/class -> readonly) statt pauschal readonly — vermeidet no-global-assign-Fehlalarme bei Cross-Modul-Neuzuweisungen"
    - "tools/package.json mit {\"type\":\"commonjs\"} als scoped Override gegen ein Root-package.json mit \"type\":\"module\" — Standardtechnik fuer gemischte Modulformate, betrifft nur Nodes Modulaufloesung, nicht das Browser-Laden"

key-files:
  created:
    - tools/generate-eslint-globals.js
    - eslint.generated-globals.js
    - tests/unit/eslint-globals-freshness.test.js
    - tools/package.json
  modified:
    - eslint.config.js
    - package.json

key-decisions:
  - "readonly/writable-Unterscheidung im Generator ergaenzt (nicht im urspruenglichen Task-Text): ein pauschales 'readonly' fuer alle generierten Globals erzeugte 22 echte no-global-assign-Fehler bei let/var-deklarierten Cross-Modul-Globals (z. B. encounterRound), die andere Module direkt neu zuweisen — dasselbe Muster wie der bestehende Handeintrag D: 'writable'"
  - "tools/package.json mit type:commonjs ergaenzt: das Root-package.json setzt type:module, wodurch Node tools/generate-eslint-globals.js nativ als ESM interpretiert und module.exports verpuffen wuerde (Jest ist davon nicht betroffen, hat einen eigenen Resolver) — noetig fuer den echten CLI-Direktaufruf aus Task 3"
  - "Buffer als siebter Node-Name im tests/**-Block ergaenzt, ueber die sechs in PLAN.md genannten Namen hinaus — gemessener Live-Baum-Bedarf (tests/e2e/features/import-security.spec.js, soundboard.spec.js), sonst waeren es 14 statt <=10 verbleibende no-undef-Vorkommen gewesen"

patterns-established:
  - "Cross-Modul-Global-Generator aus loader.js MODULES (dritte Instanz nach console-hygiene.test.js 13-08 und tab-registry.test.js 13-04) — etabliert das Verfahren fuer kuenftige aus dem Quellbaum abgeleitete Konfigurationsartefakte"

requirements-completed: [TEST-05]

coverage:
  - id: D1
    description: "Tracer: Pfad loader.js MODULES -> Generator -> eingechecktes Artefakt -> eslint.config.js -> Lint-Lauf -> Jest-Drift-Waechter vollstaendig verdrahtet und Ende-zu-Ende bewiesen (Task 1)"
    requirement: "TEST-05"
    verification:
      - kind: unit
        ref: "tests/unit/eslint-globals-freshness.test.js — 3/3 Tests"
        status: pass
      - kind: other
        ref: "node --check tools/generate-eslint-globals.js — Exit 0"
        status: pass
      - kind: other
        ref: "eslint.generated-globals.js enthaelt 1398 Namen (>1000 gefordert)"
        status: pass
      - kind: other
        ref: "npx eslint . --format json — no-undef 577 Vorkommen (<1000 gefordert), npx eslint . Exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Verbleibende Globals-Luecken (8 Browser-, 6+1 Node-Globals, 7 tests/setup.js-Helfer, utils/testable-utils.js-Sonderfall) geschlossen — no-undef faellt auf genau die 7 D-09-Fundstellen (Task 2)"
    requirement: "TEST-05"
    verification:
      - kind: other
        ref: "npx eslint . --format json — no-undef genau 7 Vorkommen: exportDataCSV, initLootTagSystem, populateImportNodesList, removeLootTag, scrollToNPC, setViewMode, showErrorLogModal"
        status: pass
      - kind: unit
        ref: "npx jest — 44/44 Suiten, 1112/1112 Tests (>= 14-GATE-BASELINE.md-Ausgangswert 43/1109 + 3 neue)"
        status: pass
      - kind: other
        ref: "npx eslint . — Exit 0, Gesamtwarnungen 375 (< Baseline 2196)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Regenerierungsweg als npm-Skript globals:generate verankert; Reproduzierbarkeit (byte-identischer zweiter Lauf) belegt (Task 3)"
    requirement: "TEST-05"
    verification:
      - kind: other
        ref: "node -e \"require('./package.json').scripts['globals:generate']\" — vorhanden, Wert 'node tools/generate-eslint-globals.js'"
        status: pass
      - kind: other
        ref: "cp + npm run globals:generate + diff — keine Ausgabe (byte-identisch)"
        status: pass
      - kind: unit
        ref: "tests/unit/eslint-globals-freshness.test.js — 3/3 Tests nach Regenerierung weiterhin gruen"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 02: ESLint-Globals-Generator (D-08) Summary

**Generator leitet 1398 Cross-Modul-Globals aus `loader.js MODULES` ab (ARCH-01); `no-undef` fällt von 1829 auf genau die 7 in D-09 benannten toten Fundstellen, mit Drift-Wächter und `npm run globals:generate` als reproduzierbarem Regenerierungsweg.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-09-07 (ca.)
- **Completed:** 2026-09-07
- **Tasks:** 3
- **Files modified:** 6 (4 neu, 2 geändert)

## Accomplishments
- `tools/generate-eslint-globals.js` (CommonJS, 3 Exporte: `extractModulesFromLoader`,
  `generateGlobalsFromModules`, `renderGlobalsArtifact`) liest `loader.js MODULES` und sammelt
  alle Top-Level-Deklarationen (Klammertiefe 0) — erweitert gegenüber `build.py`s
  `check_duplicate_functions()`-Muster um `async function` und `var`, weil ein Globals-Generator
  (anders als ein Duplikatprüfer) nicht konservativ sein darf.
- `eslint.generated-globals.js`: eingechecktes ESM-Artefakt mit 1398 sortierten, in
  Anführungszeichen gesetzten Namen, von `eslint.config.js` per `import` additiv eingelesen.
- `tests/unit/eslint-globals-freshness.test.js`: Drift-Wächter mit drei Tests (Leer-grün-Wächter,
  Fail-first-Nachweis der Vergleichslogik, eigentliche Freshness-Prüfung) — Struktur analog
  `console-hygiene.test.js` (13-08).
- Verbleibende Globals-Lücken geschlossen: 8 Browser-Globals im Hauptblock, Node-Globals +
  7 `tests/setup.js`-Helfer im `tests/**`-Block, neuer Block für `tools/**/*.js` +
  Playwright-Configs, neuer eng gefasster Block für `utils/testable-utils.js`.
- `npm run globals:generate` als benannter, reproduzierbarer Regenerierungsweg verankert
  (Direktaufruf-Zweig über `require.main === module`).
- `no-undef`-Vorkommen: 1829 → 577 (nach Task 1) → 7 (nach Task 2), alle 7 sind die von D-09
  benannten toten Aktionsziele. `npx eslint .` bleibt durchgehend Exit 0.

## Task Commits

Each task was committed atomically (Task 1 als TDD RED/GREEN, Tasks 2+3 als `type="auto"`):

1. **Task 1 RED: Drift-Test gegen fehlendes Artefakt** - `a8ff69b` (test)
2. **Task 1 GREEN: Generator + Artefakt + eslint.config.js-Verdrahtung** - `8214c45` (feat)
3. **Task 2: Verbleibende Globals-Lücken (Browser/Node/testable-utils)** - `67bcf13` (fix)
4. **Task 3: `globals:generate`-Skript + Reproduzierbarkeitsnachweis** - `64e4246` (feat)

**Plan metadata:** wird im Anschluss committet (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified
- `tools/generate-eslint-globals.js` - Generator (3 Exporte + CLI-Direktaufruf-Zweig)
- `eslint.generated-globals.js` - eingechecktes Artefakt, 1398 Namen
- `tests/unit/eslint-globals-freshness.test.js` - Drift-Wächter (3 Tests)
- `tools/package.json` - `{"type":"commonjs"}`, scoped Override gegen Root-`"type":"module"`
- `eslint.config.js` - Import + additiver Globals-Block (Task 1); 8 Browser-Globals,
  Node-Globals + `tests/setup.js`-Helfer im `tests/**`-Block, zwei neue Blöcke für
  `tools/**`/Playwright-Configs und `utils/testable-utils.js` (Task 2)
- `package.json` - Skript `globals:generate` ergänzt; `lint`/`lint:all`/`typecheck`/`check`
  unverändert

## Decisions Made
- **readonly/writable-Unterscheidung im Generator** (nicht im ursprünglichen Task-Text): ein
  pauschales `'readonly'` für alle generierten Globals erzeugte 22 echte `no-global-assign`-Fehler
  bei `let`/`var`-deklarierten Cross-Modul-Globals (z. B. `encounterRound` in `systems/undo.js`,
  neu zugewiesen in `core/init.js`) — dasselbe Muster, das den bestehenden Handeintrag
  `D: 'writable'` begründet. Fix: `let`/`var` → `'writable'`, `const`/`function`/`class` →
  `'readonly'`; bei mehrfacher Deklaration desselben Namens gewinnt `'writable'`.
- **`tools/package.json` mit `type: commonjs`**: das Root-`package.json` setzt `"type": "module"`,
  wodurch Node `tools/generate-eslint-globals.js` nativ als ESM interpretieren würde und
  `module.exports` verpuffen würde (Jest ist davon nicht betroffen — eigener Resolver). Nötig,
  damit der CLI-Direktaufruf aus Task 3 als echtes CommonJS funktioniert. Kein Einfluss auf das
  Browser-Laden (`tools/debug.js` läuft über `<script>`, nicht über Node).
- **`Buffer` als siebter Node-Name im `tests/**`-Block**, über die sechs in PLAN.md genannten
  Namen hinaus — gemessener Live-Baum-Bedarf (`tests/e2e/features/import-security.spec.js`,
  `soundboard.spec.js` nutzen `Buffer.from`/`Buffer.alloc`). Ohne die Ergänzung blieben 14 statt
  ≤10 `no-undef`-Vorkommen — dem Akzeptanzkriterium der Task.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] readonly/writable-Unterscheidung statt pauschal readonly**
- **Found during:** Task 1, Verify-Schritt (nach dem Verdrahten von `eslint.config.js`)
- **Issue:** `npx eslint .` zeigte 22 neue `no-global-assign`-Fehler — das Akzeptanzkriterium
  "0 Fehler" war verletzt. Ursache: alle generierten Globals waren `'readonly'`, aber mehrere
  Namen (`encounterRound`, `floatingToolbarTarget`, `floatingToolbarInitialized`, u. a.) werden
  in anderen Modulen direkt neu zugewiesen (Cross-Modul-Mutation, kein Re-`let`).
- **Fix:** Deklarationsart (`let`/`var` vs. `const`/`function`/`class`) im Generator erfasst;
  `let`/`var` → `'writable'`, Rest → `'readonly'`; `renderGlobalsArtifact` gibt den tatsächlichen
  Wert je Name aus statt hartkodiert `'readonly'`.
- **Files modified:** `tools/generate-eslint-globals.js`
- **Verification:** `npx eslint .` → Exit 0, 0 Fehler (vorher 22)
- **Committed in:** `8214c45` (Teil des GREEN-Commits von Task 1)

**2. [Rule 3 - Blockierend] `tools/package.json` mit `type: commonjs`**
- **Found during:** Task 1, beim ersten Versuch, das Artefakt mit `node -e` zu generieren
- **Issue:** `require('./tools/generate-eslint-globals.js')` lieferte ein leeres Objekt statt der
  drei Exporte — Node interpretierte die Datei wegen `"type": "module"` im Root-`package.json`
  nativ als ESM, wodurch `module.exports` keine Wirkung hatte.
- **Fix:** `tools/package.json` mit `{"type": "commonjs"}` als scoped Override angelegt —
  Standardtechnik für gemischte Modulformate, betrifft nur Nodes Modulauflösung.
- **Files modified:** `tools/package.json` (neu)
- **Verification:** `node -e "require('./tools/generate-eslint-globals.js').generateGlobalsFromModules"` liefert die Funktion; Jest bleibt unbeeinflusst (eigener Resolver)
- **Committed in:** `8214c45`

**3. [Rule 1 - Gemessene Ergänzung] `Buffer` im `tests/**`-Block ergänzt**
- **Found during:** Task 2, Verify-Schritt
- **Issue:** Nach den geplanten sechs Node-Globals blieben 14 `no-undef`-Vorkommen statt der
  geforderten ≤10 — `Buffer` wird in zwei E2E-Spec-Dateien verwendet und war nicht im PLAN.md
  genannt.
- **Fix:** `Buffer: 'readonly'` im `tests/**`-Block ergänzt (kommentiert als gemessene Abweichung).
- **Files modified:** `eslint.config.js`
- **Verification:** `npx eslint .` → genau 7 verbleibende `no-undef`-Namen (die D-09-Fundstellen)
- **Committed in:** `67bcf13`

---

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3). **Impact:** Alle drei Fixes waren nötig,
um die eigenen Akzeptanzkriterien der Plan-Tasks zu erfüllen (0 Fehler, ≤10 bzw. ≤1000
no-undef-Vorkommen, funktionierender Generator). Kein Scope-Creep — keine Funktionalität über den
Plan hinaus hinzugefügt.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `no-undef` steht bei genau 7 Vorkommen (die D-09-Fundstellen) — 14-06 kann `no-undef` auf
  `error` heben, sobald diese sieben toten Aktionsziele behoben sind.
- `eslint.generated-globals.js` + Drift-Wächter sind eingecheckt und laufen bei jedem
  `npx jest` mit; künftige `loader.js`-Änderungen werden automatisch erkannt.
- Keine Blocker für die verbleibenden Pläne dieser Phase (14-03 ff.).

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- FOUND: `tools/generate-eslint-globals.js`
- FOUND: `eslint.generated-globals.js`
- FOUND: `tests/unit/eslint-globals-freshness.test.js`
- FOUND: `tools/package.json`
- FOUND: commit `a8ff69b` (Task 1 RED)
- FOUND: commit `8214c45` (Task 1 GREEN)
- FOUND: commit `67bcf13` (Task 2)
- FOUND: commit `64e4246` (Task 3)
- Re-ran `npx eslint .` → Exit 0, 0 Fehler, 375 Warnungen, 7 `no-undef`-Vorkommen (die D-09-Fundstellen)
- Re-ran `npx jest` → 44/44 Suiten, 1112/1112 Tests grün
- Re-ran `npm run globals:generate` zweimal → byte-identisch
- Re-ran `npx tsc --noEmit` → Exit 0
