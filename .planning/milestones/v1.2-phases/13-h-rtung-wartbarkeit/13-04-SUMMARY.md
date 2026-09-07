---
phase: 13-h-rtung-wartbarkeit
plan: 04
subsystem: maintainability
tags: [tab-registry, backups, soundboard, vm-sandbox, jest, dead-code]

# Dependency graph
requires:
  - phase: 13-h-rtung-wartbarkeit
    provides: "13-02 removed the last three document.execCommand call sites and hardened parseWikiLinks() escaping; left MAINT-02's const-D-shadowing and dead-mindmap-seed sub-items open (marked 'Teil 1/2')"
provides:
  - "initPerformanceMonitoring() guarded against multi-start (module variable + clearInterval-before-setInterval, mirrors startAutoBackup())"
  - "Tab registry entries are deferred function references (() => renderX) instead of strings, resolved via resolveTabFn() — no more window[name] lookups"
  - "const D shadowing in soundboard-player.js resolved (renamed to trackDuration)"
  - "Two dead mindmap write-seeds removed (systems/backups.js, tools/debug.js)"
  - "tests/unit/backups.test.js and tests/unit/tab-registry.test.js — new regression coverage"
affects: [13-08, 14]

# Actuals (#2632)
actuals:
  tokens: 10900
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deferred function reference pattern for registries that must be evaluated before all modules load: () => identifierName, resolved via a resolveTabFn()-style try/catch helper instead of window[name]."
    - "vm-sandbox unit tests for non-ESM systems/*.js modules (load real source via vm.runInContext with jest.fn() doubles for setInterval/clearInterval/StorageAPI/etc.) — same pattern as tests/unit/file-backup-idb.test.js, now also used for systems/backups.js and systems/tab-registry.js."

key-files:
  created:
    - tests/unit/backups.test.js
    - tests/unit/tab-registry.test.js
  modified:
    - systems/backups.js
    - systems/tab-registry.js
    - systems/tab-registry.md
    - CLAUDE.md
    - tools/debug.js
    - features/soundboard/soundboard-player.js

key-decisions:
  - "Fixed the dead `init: 'initDiceTab'` tab-registry entry to `null` instead of leaving it as a lazy reference that always resolves to null. No commit in this repo's history ever defined `initDiceTab` — it was a permanent no-op since the registry's creation (Jan 2026). Runtime behavior is byte-identical (init never ran, still never runs); the registry just no longer claims an init hook exists. Documented as Rule 1 auto-fix below, since our own new static-declaration test (required by this task) would otherwise correctly flag it as a real, pre-existing dead reference."
  - "Mirrored startAutoBackup()'s guard form exactly for initPerformanceMonitoring(): bare `clearInterval(handle)` before `window.setInterval(...)`, module-level `let perfMonitoringInterval = null`. Chosen over other interval-clearing idioms specifically because the plan's must_haves and acceptance_criteria require behavioral and textual parity with the existing template in the same file."
  - "extractFnName/tabFnName in tab-registry.js parses the identifier out of the arrow expression's own toString() for diagnostics, rather than carrying a parallel string field. Keeps the single-source-of-truth property the whole task is about — there is exactly one place (the arrow body) where the identifier is spelled, not two that could drift apart again."

requirements-completed: [MAINT-05, MAINT-02]

coverage:
  - id: D1
    description: "initPerformanceMonitoring() no longer stacks a second 30s interval on repeat calls"
    requirement: "MAINT-05"
    verification:
      - kind: unit
        ref: "tests/unit/backups.test.js#initPerformanceMonitoring() — Mehrfachstart-Guard (T-13-12)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tab registry resolves renders/init/cleanup via deferred function references (() => name) instead of window[name] string lookups; a renamed/removed function now fails a Jest test instead of only warning at runtime"
    requirement: "MAINT-05"
    verification:
      - kind: unit
        ref: "tests/unit/tab-registry.test.js — static declaration guard (test.each over all registry identifiers) + runtime resolution tests"
        status: pass
      - kind: e2e
        ref: "tests/e2e/tab-navigation.spec.js (all 13 tests, run against a fresh python build.py)"
        status: pass
    human_judgment: false
  - id: D3
    description: "const D shadowing in soundboard-player.js:145 resolved (renamed to trackDuration); soundboard loop/crossfade behavior unchanged"
    requirement: "MAINT-02"
    verification:
      - kind: unit
        ref: "tests/unit/soundboard.test.js, tests/unit/soundboard-loop.test.js (unmodified, still pass)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/soundboard.spec.js (all 9 tests, incl. 'track loop toggle and progress bar')"
        status: pass
    human_judgment: false
  - id: D4
    description: "Two dead mindmap write-seeds removed (systems/backups.js:232, tools/debug.js:917); restoreBackup() still restores a pre-existing backup that carries the old key cleanly"
    requirement: "MAINT-02"
    verification:
      - kind: unit
        ref: "tests/unit/backups.test.js#restoreBackup() / sanitizeBackupData() — toter mindmap-Seed entfernt (Task 3)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 04: Guard-Parität, verzögerte Tab-Registry-Referenzen, tote Stellen entfernt Summary

**`initPerformanceMonitoring()` bekam dieselbe Mehrfachstart-Guard wie `startAutoBackup()`, die Tab-Registry löst Render-/Init-/Cleanup-Funktionen jetzt über verzögerte Funktionsreferenzen statt `window[name]`-Strings auf, und zwei tote `mindmap`-Seeds plus die `const D`-Überschattung im Soundboard-Player sind entfernt.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-06T08:30:00+02:00 (approx.)
- **Completed:** 2026-09-06T08:50:00+02:00
- **Tasks:** 3
- **Files modified:** 8 (2 created, 6 modified)

## Accomplishments

- `initPerformanceMonitoring()` in `systems/backups.js` now tracks its interval handle in a module variable (`perfMonitoringInterval`) and clears it before restarting — mirrors `startAutoBackup()`'s exact form (bare `clearInterval` before `window.setInterval`). A second call (e.g. after a campaign switch) no longer stacks a permanent second 30-second timer (T-13-12).
- `TAB_RENDER_REGISTRY` in `systems/tab-registry.js` no longer stores function names as strings. Every `renders`/`init`/`cleanup` entry is a parameterless arrow expression (`() => renderDashboard`) that names the target function without calling it — kept lazy because `systems/tab-registry.js` loads before all feature modules in loader mode, so a direct reference would throw at load time. `resolveTabFn()` resolves each reference in a `try`/`catch`; `tabFnName()` extracts the identifier for diagnostics. Neither `renderTabContent()` nor `validateTabRegistry()` uses `window[name]` anywhere anymore.
- The dead `init: 'initDiceTab'` entry — which never resolved to a real function in this codebase's history — is corrected to `null`, removing a misleading claim without changing runtime behavior.
- `features/soundboard/soundboard-player.js:145`'s local `const D` (a track's duration) no longer shadows the global data object within `scheduleIteration()`; renamed to `trackDuration` across all 8 read sites in that function (fade envelope math, loop-period scheduling).
- Two dead `mindmap` write-seeds are gone: `systems/backups.js:232` (used `edges` instead of `connections` — a form no consumer, past or present, ever read) and `tools/debug.js:917`. The restore path stays backward compatible via `version-migration.js`'s existing smart-strip; `restoreBackup()` was exercised end-to-end in a test with a pre-existing backup that still carries the old key, proving it restores cleanly and the key is gone afterward.
- Two new Jest suites (`tests/unit/backups.test.js`, `tests/unit/tab-registry.test.js`) load the real, unmodified production source via `vm.runInContext` — same pattern as `tests/unit/file-backup-idb.test.js` — so they exercise actual behavior, not a reimplementation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Guard-Parität für `initPerformanceMonitoring()` end-to-end** - `0712fa5` (feat)
2. **Task 2: Tab-Registry auf verzögerte Funktionsreferenzen umstellen** - `8a82d5b` (feat)
3. **Task 3: `const D`-Überschattung auflösen, zwei tote `mindmap`-Seeds entfernen** - `cee070a` (fix)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `tests/unit/backups.test.js` - New: vm-sandbox tests for `initPerformanceMonitoring()`'s guard and `restoreBackup()`/`sanitizeBackupData()`'s mindmap-key handling
- `tests/unit/tab-registry.test.js` - New: static declaration guard (every registry identifier must exist as a top-level `function` in a `loader.js` MODULES file) + runtime resolution tests
- `systems/backups.js` - Added `perfMonitoringInterval` guard; removed the `mindmap` key from the `defaultD` schema literal
- `systems/tab-registry.js` - Rewrote `TAB_RENDER_REGISTRY` to use deferred function references; added `resolveTabFn()`/`tabFnName()`; `renderTabContent()`/`validateTabRegistry()` use them instead of `window[name]`; fixed the dead `initDiceTab` entry to `null`
- `systems/tab-registry.md` - Updated all code examples and the type signature to the deferred-reference form; added a `resolveTabFn()` API entry and a version-history note
- `CLAUDE.md` - Updated the "Tab Navigation Architecture" pattern section to show the deferred-reference form
- `tools/debug.js` - Removed the dead `mindmap` seed from `completeReset()`
- `features/soundboard/soundboard-player.js` - Renamed the function-scoped `const D` (track duration) to `trackDuration` in `scheduleIteration()`

## Decisions Made

- Mirrored `startAutoBackup()`'s guard form exactly (bare `clearInterval` before `window.setInterval`, module-level `let` handle) rather than any other interval-clearing idiom, per the plan's explicit parity requirement.
- Fixed the dead `init: 'initDiceTab'` registry entry to `null` (see Deviations below) instead of leaving a lazy reference that permanently resolves to `null` — same runtime behavior, no more misleading claim in the registry.
- `resolveTabFn()`/`tabFnName()` derive the diagnostic identifier from the arrow expression's own source text (`entry.toString()`) rather than a parallel string field, keeping exactly one place where each identifier is spelled.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dead `init: 'initDiceTab'` tab-registry entry corrected to `null`**
- **Found during:** Task 2 (writing the static declaration-guard test required by the task's own `<action>`)
- **Issue:** `TAB_RENDER_REGISTRY.dice.init` referenced `'initDiceTab'`, but no commit in this repository's history (verified via `git log --all -p`) ever defined a function by that name. It has been a permanent, silent no-op since the registry was introduced (commit `01c7b12`, Jan 2026) — `renderTabContent()` only warns on missing *render* functions, never on a missing `init`, so this was invisible at runtime even in `DEBUG_MODE`. The task's own required static test ("jeden [Bezeichner] ... prüfen, dass er als Top-Level-Deklaration ... vorkommt") would correctly flag this as a genuine, pre-existing dead reference, and the new deferred-reference form would make that failure loud where the old string form made it silent.
- **Fix:** Changed `init: 'initDiceTab'` to `init: null` in the `dice` tab entry. Runtime behavior is byte-identical (the init hook never ran before, still never runs) — this only removes a misleading claim that an init function exists.
- **Files modified:** `systems/tab-registry.js`, `systems/tab-registry.md` (removed the now-inaccurate documentation example that referenced this entry)
- **Verification:** `tests/unit/tab-registry.test.js`'s static-declaration test suite passes for all remaining registry identifiers; `npx playwright test tests/e2e/tab-navigation.spec.js` (dice-tab tests included) passes unchanged.
- **Committed in:** `8a82d5b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix was required to make the task's own specified verification pass without weakening the static test's scope (e.g. by excluding `init`/`cleanup` fields from the check, which would have defeated the point of the guard). No scope creep — the fix is confined to the one dead registry entry the new test surfaced.

## Issues Encountered

- **jsdom test environment lacks a global `structuredClone`** in the installed `jest-environment-jsdom` version, unlike the Node runtime used elsewhere in the project. `tests/unit/backups.test.js` adds a local fallback (`typeof structuredClone === 'function' ? structuredClone : (obj) => JSON.parse(JSON.stringify(obj))`), matching the project's own documented polyfill pattern in `utils/utilities.js`. This is test-infrastructure-only; it does not touch production code.
- The plan's Task 3 anticipated the restore-path test might be "zu schwer isolierbar" and allowed falling back to testing `sanitizeBackupData()` directly. In practice the full `restoreBackup()` path (including its `getBackups()` → IndexedDB-then-localStorage fallback chain) was straightforward to exercise in the same `vm` sandbox pattern already used for `initPerformanceMonitoring()`, so both the direct `sanitizeBackupData()` case and the full `restoreBackup()` end-to-end case are covered — no fallback needed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MAINT-02 is now fully complete across both its `13-02` (execCommand/XSS/data-id) and `13-04` (const-D-shadowing/dead-mindmap-seeds) halves — `.planning/REQUIREMENTS.md`'s "Teil 1/2" marker for MAINT-02 should be updated to reflect full completion (handled via `requirements mark-complete` in this plan's state-update step).
- MAINT-05 is complete: both fragile spots named in Phase 13's success criterion 7 (tab-registry string lookups, `initPerformanceMonitoring()` multi-start) are hardened and covered by tests that fail loudly instead of degrading silently.
- The registry's diagnostic console messages (`[TabRegistry] Function ${tabFnName(...)} not found ...`) are unchanged in wording per the plan's explicit instruction — Plan 13-08 (MAINT-06) is the designated place to migrate them to `ErrorHandler.log()`. No action needed here, but worth flagging so 13-08 doesn't have to rediscover this boundary.
- No blockers for subsequent Phase 13 plans.

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED

All 8 created/modified files confirmed present on disk; all 3 task commit hashes (`0712fa5`, `8a82d5b`, `cee070a`) confirmed in `git log --all`.
