---
phase: 08-test-fundament-gr-n
plan: 01
subsystem: testing
tags: [event-delegation, playwright, jest, css-layout, undo-redo]

# Dependency graph
requires: []
provides:
  - "Attribute-modifier badges (STR/DEX/CON/INT/WIS/CHA) live-update on character and encounter/monster forms"
  - "tests/unit/action-registry-collisions.test.js — permanent static-analysis guard against silent data-action key collisions"
  - "body.has-migration-hint layout-offset so the fixed migration-hint-banner never covers the sticky header/#global-search"
  - "renderAll() dispatches renderRandomTables + renderTimers (parity with TAB_RENDER_REGISTRY, used by undo/redo/import)"
affects: [08-02, 08-03, 08-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static-analysis Jest test (fs+path, no vm/DOM) scanning ui/actions/*.js for duplicate data-action keys with an explicit allowlist"
    - "CSS custom property (--migration-hint-height) set from measured offsetHeight instead of a hardcoded min-height, to survive viewport-dependent text wrapping"

key-files:
  created:
    - tests/unit/action-registry-collisions.test.js
    - .planning/phases/08-test-fundament-gr-n/deferred-items.md
  modified:
    - ui/actions/combat-actions.js
    - systems/migration/migration-wizard.js
    - assets/styles/migration.css
    - tests/e2e/app.spec.js
    - features/render-dashboard.js

key-decisions:
  - "Migration-hint-banner offset uses a JS-measured CSS custom property (--migration-hint-height) rather than a hardcoded 48px, because the banner's flex-wrap content grows taller than its min-height on narrower viewports (measured 61px at 1280px width vs. the CSS min-height of 48px) — a fixed 48px offset left a ~1.5px overlap that broke the natural click"
  - "Divergence-banner's pre-existing `.migration-hint-banner ~ .divergence-banner { top: 48px }` sibling-combinator offset was left untouched — out of this task's scope (only #global-search/header overlap was required), not touched to avoid scope creep"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "Duplicate update-attr-mod/update-enc-attr-mod registration in combat-actions.js removed; entity-actions.js's correct single-arg handlers now win"
    requirement: TEST-01
    verification:
      - kind: e2e
        ref: "tests/e2e/crud/party.spec.js#Attribut-Modifikatoren werden berechnet"
        status: pass
      - kind: e2e
        ref: "tests/e2e/crud/encounters.spec.js#Attribut-Modifikatoren werden berechnet"
        status: pass
      - kind: unit
        ref: "tests/unit/action-registry-collisions.test.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "Permanent Jest regression test guards against future silent data-action key collisions across ui/actions/*.js"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "tests/unit/action-registry-collisions.test.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "body.has-migration-hint layout offset keeps the sticky header (incl. #global-search) below the fixed migration-hint-banner"
    requirement: TEST-01
    verification:
      - kind: e2e
        ref: "tests/e2e/app.spec.js#Migration-Hinweis-Banner ueberdeckt #global-search nicht (Phase 8, D-02, Pitfall 3)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/app.spec.js#Global Search ist fokussierbar"
        status: pass
    human_judgment: false
  - id: D4
    description: "renderAll() dispatches renderRandomTables and renderTimers alongside its existing 14 render calls"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "node -e static grep check for renderSafe(renderRandomTables/renderTimers) in features/render-dashboard.js"
        status: pass
    human_judgment: true
    rationale: "Behavioral proof (undo while dice tab active drops .rt-card count) requires tests/e2e/tab-navigation.spec.js:552, which is co-dependent on the .dice-details selector fix landing in 08-02 (per plan's explicit cross-wave note); only the static dispatch-list wiring is verified in this plan."

# Metrics
duration: 9min
completed: 2026-07-22
status: complete
---

# Phase 8 Plan 1: App-Bug-Fixes (Attribut-Modifikator, Migration-Banner, renderAll-Lücke) Summary

**Drei präzise Source-Fixes für die von 08-RESEARCH.md identifizierten App-Bugs: Event-Delegation-Kollision entfernt (`update-attr-mod`/`update-enc-attr-mod`), Layout-Offset für den Migration-Hinweis-Banner via gemessener CSS-Custom-Property ergänzt, und `renderAll()`'s Dispatch-Liste um `renderRandomTables`/`renderTimers` erweitert — je mit dediziertem Regressionstest.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-07-22T21:40:52Z (Phase-Start laut STATE.md)
- **Completed:** 2026-07-22T21:49:28Z
- **Tasks:** 3
- **Files modified:** 5 (+ 2 neue Dateien: 1 Test, 1 deferred-items.md)

## Accomplishments
- Die STR/DEX/CON/INT/WIS/CHA-Modifikator-Badges aktualisieren jetzt live beim Tippen — sowohl im Charakter- als auch im Encounter/Monster-Formular — weil die falsche 2-Parameter-Duplikat-Registrierung in `combat-actions.js` entfernt wurde, die `entity-actions.js`'s korrekte Handler per Last-Write-Wins überschrieben hatte.
- Ein permanenter, reiner statischer Jest-Test (`tests/unit/action-registry-collisions.test.js`) verhindert strukturell, dass zukünftig ein `data-action`-Schlüssel unbemerkt in zwei `ui/actions/*.js`-Dateien registriert wird.
- Der einmalige Migrations-Hinweis-Banner überdeckt den sticky Header (inkl. `#global-search`) nicht mehr — `showMigrationHintBanner()` misst die tatsächliche gerenderte Bannerhöhe (kann durch Zeilenumbruch größer als das CSS-`min-height:48px` sein) und setzt sie als CSS-Custom-Property, die `body.has-migration-hint` als `padding-top` anwendet.
- `renderAll()` (genutzt von `undo()`/`redo()`/Import) dispatcht jetzt auch `renderRandomTables` und `renderTimers`, analog zu `TAB_RENDER_REGISTRY`'s Dice-/Timer-Einträgen — schließt eine Lücke, durch die diese Panels nach einem Undo veraltet blieben, während ihr Tab aktiv war.

## Task Commits

Each task was committed atomically:

1. **Task 1: Attribut-Modifikator-Kollision entfernen + Kollisions-Regressionstest** - `9cf67ac` (fix)
2. **Task 2: Migration-Hint-Banner Layout-Offset + Global-Search-Regressionstest** - `3bc7332` (fix)
3. **Task 3: renderAll()-Dispatch-Lücke schließen** - `d38eea3` (fix)

_Kein separater Plan-Metadaten-Commit — dieser folgt nach dem Self-Check via den Final-Commit-Schritt._

## Files Created/Modified
- `ui/actions/combat-actions.js` - Zwei falsche 2-Parameter-`update-attr-mod`/`update-enc-attr-mod`-Registrierungen entfernt
- `tests/unit/action-registry-collisions.test.js` (neu) - Statischer fs/path-Scan über `ui/actions/*.js`, schlägt bei jedem nicht-allowlisteten Duplikat fehl
- `systems/migration/migration-wizard.js` - `showMigrationHintBanner()` misst `offsetHeight` und setzt `--migration-hint-height`; toggelt `body.has-migration-hint`; `close-migration-hint`-Handler entfernt die Klasse wieder
- `assets/styles/migration.css` - Neue Regel `body.has-migration-hint { padding-top: var(--migration-hint-height, 48px); }`
- `tests/e2e/app.spec.js` - Neuer Test „Migration-Hinweis-Banner ueberdeckt #global-search nicht" mit geometrischem `getBoundingClientRect()`-Vergleich + natürlichem Klick ohne `{force:true}`
- `features/render-dashboard.js` - `renderAll()` bindet und dispatcht `renderRandomTables`/`renderTimers` zusätzlich zu den bestehenden 14 `renderSafe()`-Aufrufen
- `.planning/phases/08-test-fundament-gr-n/deferred-items.md` (neu) - Dokumentiert einen unrelated, out-of-scope flaky Jest-Test

## Decisions Made
- Migration-Banner-Offset nutzt eine JS-gemessene CSS-Custom-Property statt eines festen `48px`-Werts, weil die Bannerhöhe bei schmaleren Viewports durch `flex-wrap` über das CSS-`min-height` hinauswächst (gemessen: 61px bei 1280px Breite) — ein fester 48px-Offset hätte eine ~1.5px-Überdeckung übriggelassen, die den natürlichen Klick weiterhin brechen würde.
- Der Divergenz-Banner-Offset (`.migration-hint-banner ~ .divergence-banner { top: 48px }`) wurde bewusst nicht angefasst — außerhalb des Task-Scopes (nur `#global-search`/Header-Überdeckung war gefordert).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Hardcoded 48px-Offset durch gemessene CSS-Custom-Property ersetzt**
- **Found during:** Task 2 (Verifikation des neuen Banner-Overlap-Regressionstests)
- **Issue:** Ein initial hardcodierter `padding-top: 48px` in `body.has-migration-hint` reichte nicht aus — die tatsächliche Bannerhöhe lag bei 1280px Testviewport-Breite bei 61px (Textumbruch durch `flex-wrap`), was eine ~1.5px-Überdeckung des Suchfelds verursachte und den geometrischen Regressionstest fehlschlagen ließ.
- **Fix:** `showMigrationHintBanner()` misst jetzt `banner.offsetHeight` nach dem Einfügen ins DOM und setzt es als `--migration-hint-height`-CSS-Custom-Property auf `document.documentElement`; die CSS-Regel nutzt `var(--migration-hint-height, 48px)` mit `48px` als Fallback für Nicht-JS-Kontexte.
- **Files modified:** systems/migration/migration-wizard.js, assets/styles/migration.css
- **Verification:** `tests/e2e/app.spec.js` (14/14 grün, zwei aufeinanderfolgende Läufe)
- **Committed in:** 3bc7332 (Teil von Task 2)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug, innerhalb Task 2 vor dem Commit behoben)
**Impact on plan:** Kein Scope-Creep — der Fix bleibt exakt im geplanten Dateibereich (migration-wizard.js, migration.css) und macht die geplante Lösung (Layout-Offset via Klasse) robuster gegen variable Viewport-Breiten, statt sie zu ersetzen.

## Issues Encountered
- `npx jest` (voller Lauf) zeigte einmalig einen Fehlschlag in `tests/unit/welt-story.test.js:476`, der bei isoliertem Lauf (`npx jest tests/unit/welt-story.test.js`, 37/37 grün) und zwei weiteren vollen Suite-Läufen (457/457 grün) nicht reproduzierbar war — ein vorbestehender, testreihenfolge-abhängiger Flake, unabhängig von den Dateien dieses Plans. Dokumentiert in `deferred-items.md`, nicht gefixt (SCOPE BOUNDARY).

## User Setup Required
None - keine externe Service-Konfiguration nötig.

## Next Phase Readiness
- Alle 3 in diesem Plan geplanten App-Bugs sind an der Wurzel behoben und mit dedizierten Regressionstests abgesichert (D-02 erfüllt für diese 3 Fälle).
- `npx jest`: 457/457 grün (453 Baseline + 4 neue Kollisionstest-Fälle).
- `npx playwright test tests/e2e/app.spec.js`: 14/14 grün, zweimal in Folge.
- `npx playwright test tests/e2e/crud/party.spec.js tests/e2e/crud/encounters.spec.js`: 23/23 grün.
- `python build.py` (Dev-Build): erfolgreich, keine Dedup-/Syntax-Brüche.
- Die verbleibenden 7 Test-Bug-Fails (Pitfalls 4–6, 8) und das CI-Gate (D-03) sind Scope der Folgepläne 08-02 bis 08-04 — insbesondere hängt die vollständige Behavioral-Verifikation der `renderAll()`-Lücke (`tab-navigation.spec.js:552`) am `.dice-details`-Selektor-Fix aus 08-02.

---
*Phase: 08-test-fundament-gr-n*
*Completed: 2026-07-22*

## Self-Check: PASSED

All 8 created/modified files verified present on disk; all 3 task commit hashes (9cf67ac, 3bc7332, d38eea3) verified present in `git log --oneline --all`.
