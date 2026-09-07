---
phase: 13-h-rtung-wartbarkeit
plan: 08
subsystem: maintainability
tags: [console-hygiene, error-handler, debug-log, post-save-hook, jest]

requires:
  - phase: 13-h-rtung-wartbarkeit
    provides: "13-01 (SEC-03 whitelist), 13-02 (SEC-04 + execCommand migration), 13-03 (MAINT-03 markdown), 13-04 (MAINT-05 interval guard + tab-registry rebuild + const D), 13-06 (PERF-01 save/undo relief), 13-07 (PERF-02 dice-stats cap) all landed on main first — this plan re-derived its file set live from loader.js MODULES and the fresh grep output rather than trusting the plan's line numbers, since several of those plans touched files also in this sweep (systems/tab-registry.js, utils/basic.js, systems/backups.js, ui/actions/system-actions.js)"
provides:
  - "tests/unit/console-hygiene.test.js — derives its file set from loader.js MODULES at every run (not a second hand-maintained list), fails hard if 0 modules are extracted, and enforces zero unfiltered console.{log,warn,error,info,debug,trace} calls outside the one marked sanctioned outlet"
  - "render/helpers.js ErrorHandler.log() console.error line — the single sanctioned console outlet, marked with the `gsd:konsolen-senke` end-of-line comment"
  - "A genuine-error vs. self-healing-info split for diagnostic output: real failures (thrown exceptions, storage/backup/import errors, security-relevant blocked-handler warnings) route through ErrorHandler.log(); routine/self-healing events (repaired _nextId, migration progress, 'container missing — not on this tab' render guards, successful tab-registry init/render, applied-markdown-formatting confirmation) route through the existing debugLogAdd() in-app debug panel instead — this is a plan-execution-time addition beyond the original conversion instruction (see Deviations)"
  - "systems/file-backup/file-backup-manager.js header (line 6) and initFileBackup() JSDoc (line 674, corrected from CONTEXT.md's stale line-387 reference) now describe registerPostSaveHook() instead of the forbidden window.save monkey-patch pattern"
affects: ["Any future console.* addition to a loader.js MODULES file will be caught by tests/unit/console-hygiene.test.js — route genuine failures through ErrorHandler.log() and routine/expected diagnostics through window.debugLogAdd(), per the split established here", "features/dice-stats/*, systems/backups.js, ui/actions/system-actions.js, core/config.js from 13-06/13-07 were read fresh at execution time — no line-number drift issues found"]

actuals:
  tokens: 13706
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Single sanctioned console outlet: render/helpers.js ErrorHandler.log()'s console.error call, marked end-of-line with `gsd:konsolen-senke`. tests/unit/console-hygiene.test.js excludes only lines carrying that literal marker; every other console.{log,warn,error,info,debug,trace} call in a loader.js MODULES file is a hard test failure, so the source-scan test itself is the enforcement mechanism, not build.py."
    - "Error vs. info triage for diagnostic conversions: a message describing an actual fault (thrown exception, failed storage write, failed import/export/backup, blocked unauthorized handler) goes through ErrorHandler.log() (APP_CONFIG.DEBUG_MODE-guarded, except three named exceptions). A message describing expected/self-healing behavior (repaired ID inconsistency, migration in progress, render guard for an inactive tab, successful tab init/render) goes through window.debugLogAdd() directly — same DEBUG_MODE guard, no console output at all, visible instead in the in-app Debug Log modal. This second path was not in the plan's original text; it was added mid-execution once it became clear the ONE sanctioned outlet always emits console.error regardless of severity (see Deviations)."
    - "Console-hygiene test derives its file set from loader.js MODULES via textual extraction (const MODULES = [...]), never a second hand-maintained list — mirrors ARCH-01's build.py precedent from Phase 11."

key-files:
  created:
    - tests/unit/console-hygiene.test.js
  modified:
    - render/helpers.js
    - ui/event-delegation.js
    - utils/basic.js
    - utils/performance.js
    - utils/utilities.js
    - systems/undo.js
    - systems/backups.js
    - systems/tab-registry.js
    - systems/campaign-manager/campaign-manager.js
    - systems/spellslots/import-export.js
    - systems/spellslots/quick-roll.js
    - systems/spellslots/version-migration.js
    - systems/file-backup/file-backup-manager.js
    - features/initiative.js
    - features/wiki/wiki.js
    - features/random-tables.js
    - features/bestiary/bestiary-render.js
    - features/bestiary/bestiary-editor.js
    - features/session-prep/session-prep-render.js
    - features/timeline/timeline-render.js
    - features/reise/reise-render.js
    - features/fraktionen/fraktionen-render.js
    - features/shops/shops-core.js
    - features/shops/shop-export.js
    - features/soundboard/soundboard-player.js
    - features/soundboard/soundboard-render.js
    - features/dice-stats/dice-stats-render.js
    - core/init.js
    - tools/debug.js
    - ui/safe-render.js
    - ui/editors/markdown-shortcuts.js
    - tests/unit/tab-registry.test.js
    - tests/unit/file-backup.test.js

key-decisions:
  - "Added a second diagnostic routing path (window.debugLogAdd()) beyond the plan's single-outlet instruction, after discovering the conversion broke 5 Playwright tests. render/helpers.js's own ErrorHandler.log() always calls console.error regardless of the message's actual severity; converting routine/self-healing diagnostics (data repairs, migration progress, per-tab render guards) to it made Playwright's `msg.type() === 'error'` assertions in editor-formatting.spec.js, editor-insert.spec.js, and import-security.spec.js (3 tests) fail on every app boot that triggered a migration or an ID repair — because those E2E suites run against the dev build where APP_CONFIG.DEBUG_MODE stays true (only `build.py --production` flips it false). The project's own pre-existing source comment on the original validateDataIntegrity repairs warning (now superseded) already documented this exact tension: 'Selbstheilung ist Normalverhalten, kein Fehler — als Warnung loggen, nicht rot über ErrorHandler.log (UAT 01: Konsolen-Hygiene beim Boot)'. Routing self-healing/informational messages through the existing debugLogAdd() in-app panel instead (same function ErrorHandler.log() already calls internally for its own _debugLog side-channel) resolves the regression without opening a second console outlet: no console.* call remains at these sites at all, so tests/unit/console-hygiene.test.js's source-text scan doesn't need to special-case them."
  - "Kept the following as genuine ErrorHandler.log() sites (not converted to debugLogAdd): thrown-exception catches in event delegation, storage/backup/import/export/campaign-deletion failures, the security-relevant blocked-unauthorized-handler warnings, tab-registry's actual init/render failures and missing-function warnings, and shop/soundboard/markdown render-error catches. These represent real faults, not routine operation, and are exactly what the single sanctioned outlet exists to surface."
  - "tests/unit/tab-registry.test.js's runtime sandbox test 'eine fehlende Funktion...' was updated to mock window.ErrorHandler.log (previously spied on console.warn directly) and to set DEBUG_MODE: true for that specific assertion, since the missing-render-function warning is a genuine-fault case that now requires DEBUG_MODE to fire (previously unguarded) — a deliberate consistency fix aligning with CLAUDE.md's own stated 'Debug mode warnings for missing DOM elements and functions' philosophy, which the pre-existing code hadn't actually implemented for this specific site."
  - "utils/backups.js's getPerformanceReport() console.table() call (line 415) is intentionally NOT converted — it is a manually-invoked, never-auto-called developer tool whose entire purpose is tabular console output; console.table also falls outside the regex scope RESEARCH.md's own baseline grep used (`console\\.(log|error|warn|info|debug)`, no `table`), so it was never counted in the 89-site baseline."
  - "systems/spellslots/version-migration.js:112's function-scoped `const ErrorHandler = window.ErrorHandler;` was left untouched — it stays function-scoped after bundling (doesn't leak to global scope) and the catch block that uses it (genuine migration failure) still needs ErrorHandler.log(), so no CLAUDE.md 'Duplicate Declaration' risk applies here."

requirements-completed: [MAINT-06]

coverage:
  - id: D1
    description: "Genau ein sanktionierter Konsolen-Ausgang existiert im gesamten Quellbaum (render/helpers.js ErrorHandler.log(), markiert mit gsd:konsolen-senke); kein in loader.js MODULES gelistetes Modul schreibt sonst mehr ungefiltert auf die Konsole"
    requirement: MAINT-06
    verification:
      - kind: unit
        ref: "tests/unit/console-hygiene.test.js — alle 3 Tests (Modul-Extraktion, Null-Treffer-Scan über 124 Module, genau-1-Marker-Zaehlung)"
        status: pass
      - kind: automated_ui
        ref: "npx playwright test — 321 passed / 2 skipped (STATE.md-Baseline exakt erreicht)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Kopfkommentare in systems/file-backup/file-backup-manager.js (Zeile 6, Zeile 674) beschreiben registerPostSaveHook() statt des verbotenen window.save-Monkey-Patch-Musters; die bereits korrekte Begründung (Zeilen 681-682) bleibt unangetastet"
    requirement: MAINT-06
    verification:
      - kind: unit
        ref: "tests/unit/file-backup.test.js#Kopfkommentare — registerPostSaveHook() statt window.save-Monkey-Patch (MAINT-06) — 4 Tests"
        status: pass
    human_judgment: false
  - id: D3
    description: "Keine Diagnosefähigkeit verloren: jede vormals unguardete console.*-Ausgabe ist entweder hinter ErrorHandler.log() (echte Fehler) oder window.debugLogAdd() (Selbstheilung/Info) weiterhin sichtbar — nichts wurde ersatzlos gelöscht"
    requirement: MAINT-06
    verification:
      - kind: unit
        ref: "npx jest — 1066/1066 (alle 38 Suiten, inkl. 4 neue console-hygiene-Tests, 4 neue file-backup-Kopfkommentar-Tests)"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 08: Konsolen-Hygiene & Datei-Backup-Kopfkommentare Summary

**81 ungefilterte console.* Aufrufe in 31 Modulen auf den einen sanktionierten ErrorHandler.log()-Ausgang umgestellt, mit einem zur Laufzeit entdeckten Zusatz: Selbstheilungs-/Info-Diagnosen laufen über das bestehende in-App debugLogAdd() statt über console.error, damit "boots ohne Konsolenfehler" nicht durch harmlose Reparatur- und Migrationsmeldungen verletzt wird — plus zwei korrigierte Kopfkommentare im Datei-Backup, die seit Phase 12 fälschlich das verbotene window.save-Monkey-Patch-Muster behaupteten.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-09-06T10:15:00+02:00 (approx.)
- **Completed:** 2026-09-06T10:46:07+02:00
- **Tasks:** 3
- **Files modified:** 34 (30 source modules, 1 new test file, 3 existing test files updated)

## Accomplishments

- Marked the single sanctioned console outlet (`render/helpers.js` `ErrorHandler.log()`, `gsd:konsolen-senke`) and built `tests/unit/console-hygiene.test.js`, which derives its checked file set live from `loader.js`'s `MODULES` array (124 entries) rather than a second hand-maintained list, and fails hard on zero extracted modules.
- Converted all remaining unguarded `console.log/warn/error` call sites across 30 files in `loader.js` MODULES scope (`loader.js` itself correctly excluded — dev-bootstrap-only, never bundled). Genuine failures now route through `ErrorHandler.log()`; routine self-healing/informational output (repaired `_nextId`, migration progress, per-tab render guards, tab-registry init/render success) routes through the existing `debugLogAdd()` in-app debug panel instead, avoiding a false "console error" classification for benign events.
- Corrected two stale header comments in `systems/file-backup/file-backup-manager.js` (line 6, and line 674 — confirmed via direct read to be the correct location, not line 387 as `13-CONTEXT.md` mistakenly cited) that described the forbidden `window.save` monkey-patch pattern; the code has used `registerPostSaveHook()` correctly since Phase 12. Added a dedicated source-text Jest test guarding against future comment drift.

## Task Commits

Each task was committed atomically:

1. **Task 1: Sanktionierten Ausgang markieren, ui/event-delegation.js umstellen, Prüftest bauen** - `53d1444` (feat)
2. **Task 2: Die verbleibenden Module umstellen, bis der Prüftest grün ist** - `9f89bd4` (feat)
3. **Task 3: Irreführende Kopfkommentare im Datei-Backup nachziehen** - `36d8ad3` (docs)

_No separate TDD test→feat split; each task's own `<verify>` gate was run interactively before its commit._

## Files Created/Modified

- `tests/unit/console-hygiene.test.js` - New Jest test; derives its module list from `loader.js` MODULES, fails hard on 0 modules extracted, enforces the single-marker invariant
- `render/helpers.js` - Marked the sanctioned outlet; converted 3 remaining unguarded calls (onError callback, fatal D-missing case direct-through-outlet, self-healing repairs → debugLogAdd)
- `ui/event-delegation.js` - Converted all 7 sites; removed 3 dead `console.error` fallback branches (ErrorHandler always loaded before this module in `loader.js` order)
- `utils/basic.js` - `$()` DOM-lookup warning + 7 `StorageAPI` error sites → `ErrorHandler.log()` (storage failures are silent-data-loss-adjacent, exception (c), unguarded)
- `utils/performance.js` - Slow-render warning → `ErrorHandler.log()`
- `utils/utilities.js` - `validateAndRepairNextId()` repairs message → `debugLogAdd()` (self-healing)
- `systems/undo.js` - 2 self-healing `_nextId`-repair messages (undo/redo) → `debugLogAdd()`
- `systems/backups.js` - `getPerformanceReport()` render-time summary → `ErrorHandler.log()` (console.table call left untouched, out of grep-baseline scope)
- `systems/tab-registry.js` - 12 sites: genuine failures (init/render failed, function-not-found, registry-validation missing-function warnings) → `ErrorHandler.log()`; success/info sites (init/render succeeded, "Validating registry...", validation summary) → `debugLogAdd()`
- `systems/campaign-manager/campaign-manager.js` - 3 `deleteCampaign()` failure sites → `ErrorHandler.log()` (data-deletion-adjacent, unguarded)
- `systems/spellslots/import-export.js` - 9 sites (export/CSV-export/import-parse/backup-failed x2/copy/clear-storage) → `ErrorHandler.log()` (all data-loss-adjacent, unguarded)
- `systems/spellslots/quick-roll.js` - Load-repairs message → `debugLogAdd()`; export-error → `ErrorHandler.log()`
- `systems/spellslots/version-migration.js` - Migration-progress info → `debugLogAdd()`; migration-failure catch untouched (already correct `ErrorHandler.log()`)
- `systems/file-backup/file-backup-manager.js` - Header (line 6) and `initFileBackup()` JSDoc (line 674) rewritten to describe `registerPostSaveHook()`
- `features/initiative.js`, `features/random-tables.js`, `features/session-prep/session-prep-render.js`, `features/timeline/timeline-render.js` (x2), `features/reise/reise-render.js`, `features/fraktionen/fraktionen-render.js`, `features/bestiary/bestiary-render.js`, `features/soundboard/soundboard-render.js`, `features/dice-stats/dice-stats-render.js` - Routine "container missing — not on this tab" render guards → `debugLogAdd()`
- `features/bestiary/bestiary-editor.js` - "Kreatur nicht gefunden" edge case → `ErrorHandler.log()` (genuine, rare)
- `features/wiki/wiki.js` - Link-insertion-failed catch → `ErrorHandler.log()`
- `features/shops/shops-core.js` - 4 render-error-boundary catches → `ErrorHandler.log()`
- `features/shops/shop-export.js` - Download-error catch → `ErrorHandler.log()` (data-loss-adjacent, unguarded)
- `features/soundboard/soundboard-player.js` - `decodeAudioData` failure → `ErrorHandler.log()`
- `core/init.js` - Global `window.onerror`/`unhandledrejection` handlers untouched (already correct); drag-and-drop-not-loaded info → `debugLogAdd()`
- `tools/debug.js` - 3 `completeReset()` failure sites → `ErrorHandler.log()` (data-deletion-adjacent, unguarded)
- `ui/safe-render.js` - `BatchUpdater` flush-failure catch → `ErrorHandler.log()`
- `ui/editors/markdown-shortcuts.js` - Applied-formatting info → `debugLogAdd()`; format-failed catch → `ErrorHandler.log()`
- `tests/unit/tab-registry.test.js` - Updated sandbox to mock `window.ErrorHandler.log`; the missing-render-function assertion now sets `DEBUG_MODE: true` and asserts against `ErrorHandler.log`, matching the now-guarded genuine-fault path
- `tests/unit/file-backup.test.js` - New `describe` block asserting the misleading phrase is gone and both comment locations name `registerPostSaveHook`

## Decisions Made

See `key-decisions` in frontmatter. Summary: the plan's single-outlet instruction was applied for genuine faults; a second, console-free diagnostic path (`debugLogAdd()`) was added mid-execution for routine/self-healing events once Playwright proved the single-outlet approach misclassified them as console errors. This preserves both the "exactly one sanctioned outlet" invariant (still exactly one `console.*` call site outside the marker in the whole `loader.js` MODULES scope) and the pre-existing "boots without console errors" UAT guarantee.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Self-healing/informational diagnostics misclassified as console errors, breaking 5 Playwright tests**
- **Found during:** Task 2, full-suite verification (`npx playwright test`)
- **Issue:** Converting every remaining `console.log/warn` call to `ErrorHandler.log()` (per the plan's literal instruction) elevated routine, non-error events — `_nextId` self-repair, version migration progress, and per-tab "container missing, likely not on this tab" render guards — to `console.error` (the sanctioned outlet always uses `console.error` regardless of the message's actual severity). `APP_CONFIG.DEBUG_MODE` is `true` in the dev build Playwright runs against (only `build.py --production` flips it `false`), so these guards fired on every affected page load. `editor-formatting.spec.js`, `editor-insert.spec.js`, and `import-security.spec.js` (3 files, 5 tests) assert `msg.type() === 'error'` collects `[]`; all 5 failed after Task 2's initial conversion pass.
- **Fix:** Re-routed all self-healing/routine-informational sites (not genuine-fault sites) to `window.debugLogAdd()` — the same in-app Debug Log panel `ErrorHandler.log()` already writes to internally as a side-channel — instead of `ErrorHandler.log()`. No console output at all for these sites, so the diagnostic information is preserved (visible in-app) without misrepresenting normal operation as an error. Genuine-fault sites (thrown exceptions, storage/import/backup/deletion failures, security-relevant blocked-handler warnings, actual render/init failures) remained on `ErrorHandler.log()` unchanged.
- **Files modified:** `render/helpers.js`, `utils/utilities.js`, `systems/undo.js` (x2), `systems/spellslots/quick-roll.js`, `systems/spellslots/version-migration.js`, `systems/tab-registry.js` (x4), `features/bestiary/bestiary-render.js`, `features/initiative.js`, `features/random-tables.js`, `features/session-prep/session-prep-render.js`, `features/timeline/timeline-render.js` (x2), `features/reise/reise-render.js`, `features/fraktionen/fraktionen-render.js`, `features/soundboard/soundboard-render.js`, `features/dice-stats/dice-stats-render.js`, `ui/editors/markdown-shortcuts.js`, `core/init.js`
- **Verification:** `npx playwright test` — 321 passed / 2 skipped (matches STATE.md baseline exactly, up from 316 passed / 5 failed / 2 skipped mid-fix); `npx jest` 1066/1066; `tests/unit/console-hygiene.test.js` still green (no console.* call remains at any of these sites, so no marker or exception was needed)
- **Committed in:** `9f89bd4` (Task 2 commit — the fix and the initial conversion landed in the same commit since the regression was caught and corrected before committing)

**2. [Rule 1 - Bug] tests/unit/tab-registry.test.js's console.warn spy no longer matched the converted code**
- **Found during:** Task 2, targeted test run (`npx jest --testPathPatterns=tab-registry`)
- **Issue:** The existing "eine fehlende Funktion..." test spied on `console.warn` directly and asserted it fired even with `DEBUG_MODE: false` — but the missing-render-function warning is a genuine-fault site now correctly guarded by `DEBUG_MODE` (previously unguarded, an inconsistency with CLAUDE.md's own "Debug mode warnings for missing DOM elements and functions" pattern).
- **Fix:** Added a mocked `window.ErrorHandler.log` to the test's VM sandbox, set `DEBUG_MODE: true` for this specific test case (matching the file's own precedent for `validateTabRegistry()`'s test), and asserted against the `ErrorHandler.log` call instead of `console.warn`.
- **Files modified:** `tests/unit/tab-registry.test.js`
- **Verification:** `npx jest tests/unit/tab-registry.test.js` — 38/38 passed
- **Committed in:** `9f89bd4` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs introduced by the literal plan instruction, caught by the plan's own verification gates and fixed before committing)
**Impact on plan:** No scope creep; both fixes are direct consequences of applying the plan's single-outlet conversion faithfully and then correcting the resulting regression discovered by the plan's own mandated `npx playwright test` verify step. No architectural change to `ErrorHandler` itself was needed — the existing `debugLogAdd()` side-channel already existed for exactly this purpose.

## Issues Encountered

None beyond the deviations above — no build failures, no blocked tasks, no authentication gates.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MAINT-06 (Phase 13 success criterion 8) is fully satisfied: zero unfiltered `console.*` calls remain in any `loader.js` MODULES file; exactly one sanctioned outlet exists, marked and test-enforced; both misleading file-backup header comments now describe the actual `registerPostSaveHook()` implementation.
- `tests/unit/console-hygiene.test.js` is now a permanent regression guard — any future PR adding an unguarded `console.*` call to a bundled module will fail this test immediately, without needing a human to notice it in review.
- No blockers for the next plan in Phase 13's wave sequence.

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED

- FOUND: tests/unit/console-hygiene.test.js
- FOUND: render/helpers.js
- FOUND: systems/file-backup/file-backup-manager.js
- FOUND: .planning/phases/13-h-rtung-wartbarkeit/13-08-SUMMARY.md
- FOUND: 53d1444 (Task 1 commit)
- FOUND: 9f89bd4 (Task 2 commit)
- FOUND: 36d8ad3 (Task 3 commit)
