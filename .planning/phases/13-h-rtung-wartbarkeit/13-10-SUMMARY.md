---
phase: 13-h-rtung-wartbarkeit
plan: 10
subsystem: maintainability
tags: [module-split, loader, initiative, non-esm, build-system]

# Dependency graph
requires:
  - phase: 13-09
    provides: "Proven MAINT-01 split blueprint (banner-cut, single Task-1 tracer slice, immediate build-after-move, full-suite hard gate), applied here to features/initiative.js"
provides:
  - "features/initiative.js split along its existing section banners into initiative.js (UTILITY/RENDER HELPERS/XP-VERTEILUNG/unnamed HP-AC-Init block/BATTLEFIELD CONDITIONS/GLOBAL EXPORTS), initiative-loot.js (LOOT SYSTEM), and initiative-combat-widgets.js (EFFECTS/DEATH SAVES/LEGENDARY/CONCENTRATION/AOE)"
  - "All three resulting files registered in loader.js MODULES, in dependency order, nothing added to build.py"
  - "Blueprint confirmed a second time for the remaining two MAINT-01 splits (13-11 rich-text.js, 13-12 dmscreen-render.js)"
affects: [13-11, 13-12, maint-01, loader.js]

actuals:
  tokens: 21837
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "MAINT-01 file-split convention (confirmed 2/4): [SECTION:X] header + own GLOBAL EXPORTS block per file, cut along // ==== banners, registered only in loader.js MODULES, single build.py run after each individual section move (not batched)"

key-files:
  created:
    - features/initiative-loot.js
    - features/initiative-combat-widgets.js
  modified:
    - features/initiative.js
    - loader.js
    - tests/build/test_build_deduplication.py

key-decisions:
  - "Task 1 moved only the LOOT SYSTEM section (373 lines) as the tracer slice, exactly as planned — the largest single section, and the one with the sole loot-side pushUndo() call, so getting it right first validated the highest-risk move early."
  - "Task 2 moved the five combat-widget sections (EFFECTS, DEATH SAVES TRACKER, LEGENDAERE AKTIONEN + WIDERSTAENDE, CONCENTRATION TRACKER, AOE DAMAGE CALCULATOR) as one contiguous block (lines 559-1204 pre-move) into a single new file, preserving their original relative order — the plan's read_first flagged the debounced `updateAoETargetDisplay` line as needing to travel with its function; verified both live in initiative-combat-widgets.js and the file is registered directly behind features/initiative-loot.js so `debounce`/`UI_TIMING` are already defined when it loads."
  - "The plan's acceptance criteria stated the export union should equal 34; the actual measured union both before and after the split is 38 (grep -c \"^window\\.\" on the pre-split file). Same stale-count pattern as 13-09 (28 vs. stated 30) — the plan's number predates later touches to initiative.js (XP distribution exports finishCombatXp/showXpDistributionModal/applyXpDistribution/xpDistSelectAll/xpDistSelectNone were added after the plan's research pass). Treated 38 as the correct invariant since it was verified directly against the file at every step: 18 (initiative.js) + 8 (initiative-loot.js) + 12 (initiative-combat-widgets.js) = 38, unchanged from the pre-split count."
  - "Confirmed the two pushUndo()/window.pushUndo() call sites survive the split with the sum unchanged at 2: one in initiative.js's XP-VERTEILUNG section (`pushUndo('XP verteilt')`, line 374 pre-split — RESEARCH.md's finding, not CONTEXT.md's D-07 claim, was correct — this section never moved), one in initiative-loot.js's removeLoot() (`window.pushUndo('Beute entfernt')`, moved intact in Task 1)."

patterns-established:
  - "No direct-vm unit test loads features/initiative.js by itself (unlike wiki.js in 13-09) — tests/unit/initiative-mob.test.js and tests/unit/entities.test.js only exercise initiative-mob.js and plain D.initiative data structures respectively, so no test file needed the wiki-links.test.js-style two-file vm load fix this time."

requirements-completed: [MAINT-01]

coverage:
  - id: D1
    description: "features/initiative.js (1655 lines) split along its existing section banners into initiative.js (616 lines: UTILITY FUNCTIONS, RENDER HELPER FUNCTIONS, XP-VERTEILUNG, the unnamed HP/AC/Init block, BATTLEFIELD CONDITIONS, GLOBAL EXPORTS), initiative-loot.js (392 lines: LOOT SYSTEM), and initiative-combat-widgets.js (670 lines: EFFECTS, DEATH SAVES TRACKER, LEGENDAERE AKTIONEN + WIDERSTAENDE, CONCENTRATION TRACKER, AOE DAMAGE CALCULATOR) — all three under the 800-line D-01 cap"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "wc -l features/initiative.js && wc -l features/initiative-loot.js && wc -l features/initiative-combat-widgets.js (616, 392, 670)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/initiative.spec.js (31/31 passed, then re-verified 42/42 after Task 2), tests/e2e/features/bestiary.spec.js + tests/e2e/tab-navigation.spec.js (combined 55/55 after Task 2)"
        status: pass
    human_judgment: false
  - id: D2
    description: "features/initiative-loot.js and features/initiative-combat-widgets.js registered in loader.js MODULES directly behind features/initiative.js, in that order; nothing added to build.py"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -c \"features/initiative-loot.js\" loader.js == 1; grep -c \"features/initiative-combat-widgets.js\" loader.js == 1; grep -c \"features/initiative\" build.py == 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "No symbol declared in two source files; python build.py assembles the bundle after each of the two moves without [FEHLER]/[ABORTED]"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py (exit 0, after Task 1 move and again after Task 2 move)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Export union (38) and undo-call sum (2) unchanged across the split — verified against the pre-split file, not against the plan's stated 34/2 (34 was stale, 2 was correct)"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -c \"^window\\.\" summed over all three files == 38; grep -cE 'saveUndoState\\(|pushUndo\\(' summed over all three files == 2"
        status: pass
    human_judgment: false
  - id: D5
    description: "Full suite hard gate green before final commit: Jest, tsc, both dist bundles, python build tests, full Playwright suite"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "npx jest (38 suites, 1066/1066 passed — unchanged from 13-09 baseline)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit (exit 0, no error TS)"
        status: pass
      - kind: other
        ref: "python build.py && python build.py --production && python -m pytest tests/build -q (24/24 passed)"
        status: pass
      - kind: e2e
        ref: "python build.py && npx playwright test (321 passed / 2 skipped)"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 10: Initiative-Modul-Aufteilung (MAINT-01, 2/4) Summary

**`features/initiative.js` (1655 Zeilen) entlang seiner Sektionsbanner in `initiative.js` (616, Kern), `initiative-loot.js` (392, LOOT SYSTEM) und `initiative-combat-widgets.js` (670, EFFECTS/DEATH SAVES/LEGENDARY/CONCENTRATION/AOE) aufgeteilt, alle drei unter der 800-Zeilen-Grenze, in `loader.js` registriert, Verhalten unverändert bestätigt durch den vollen Suiten-Lauf.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-09-06 (approx.)
- **Completed:** 2026-09-06
- **Tasks:** 3
- **Files modified:** 5 (features/initiative.js, features/initiative-loot.js [new], features/initiative-combat-widgets.js [new], loader.js, tests/build/test_build_deduplication.py)

## Accomplishments
- `features/initiative-loot.js` created with its own `[SECTION:INITIATIVE_LOOT]` header and `GLOBAL EXPORTS` block (initiative-mob.js convention), carrying the full Master-Detail LOOT SYSTEM block (`selectedLootId`/`currentLootFilter` state + 11 functions incl. `removeLoot()`'s `pushUndo()` call) — 392 lines
- `features/initiative-combat-widgets.js` created with its own `[SECTION:INITIATIVE_COMBAT_WIDGETS]` header and `GLOBAL EXPORTS` block, carrying five combat-widget sections (EFFECTS, DEATH SAVES TRACKER, LEGENDAERE AKTIONEN + WIDERSTAENDE, CONCENTRATION TRACKER, AOE DAMAGE CALCULATOR) as one contiguous, order-preserved block, including the debounced `updateAoETargetDisplay` line kept alongside the function it wraps — 670 lines
- `features/initiative.js` reduced to UTILITY FUNCTIONS, RENDER HELPER FUNCTIONS, XP-VERTEILUNG, the unnamed HP/AC/Init block, BATTLEFIELD CONDITIONS, and GLOBAL EXPORTS — 616 lines
- `loader.js` `MODULES` updated: `'features/initiative-loot.js'` and `'features/initiative-combat-widgets.js'` inserted directly behind `'features/initiative.js'`, in that order; nothing touched in `build.py` (ARCH-01)
- Full hard-gate suite run with evidence captured (see coverage D5) before the final commit, per the Roadmap interpretation note governing all four MAINT-01 splits

## Task Commits

Each task was committed atomically:

1. **Task 1: LOOT SYSTEM in `initiative-loot.js` auslagern, registrieren, bauen** - `80ca4bd` (feat)
2. **Task 2: Kampf-Widgets in `initiative-combat-widgets.js` auslagern** - `c3b50c3` (feat)
3. **Task 3: Hard-Gate — volle Suiten, beide Bündel, Typprüfung vor dem Commit** - `28bc6c2` (test — the hard-gate run required only the loader-module-count fix; see Deviations)

**Plan metadata:** committed alongside this SUMMARY (see final commit below)

## Files Created/Modified
- `features/initiative-loot.js` - New module: LOOT SYSTEM (renderLoot…removeLoot), 392 lines, 8 exports, 1 pushUndo() call
- `features/initiative-combat-widgets.js` - New module: EFFECTS + DEATH SAVES TRACKER + LEGENDAERE AKTIONEN/WIDERSTAENDE + CONCENTRATION TRACKER + AOE DAMAGE CALCULATOR, 670 lines, 12 exports, 0 pushUndo() calls
- `features/initiative.js` - Reduced to UTILITY/RENDER HELPERS/XP-VERTEILUNG/unnamed HP-AC-Init block/BATTLEFIELD CONDITIONS/GLOBAL EXPORTS, 616 lines, 18 exports, 1 pushUndo() call (XP-VERTEILUNG)
- `loader.js` - `'features/initiative-loot.js'` and `'features/initiative-combat-widgets.js'` added to `MODULES`, directly after `'features/initiative.js'`, in that order
- `tests/build/test_build_deduplication.py` - `test_ssot_module_list_parses_from_loader` module-count assertion updated 125 → 127

## Decisions Made
- Task 1 moved only the `LOOT SYSTEM` section (373 lines, the largest single section and the plan's designated tracer slice) first, exactly as the plan specified, to prove the loader/build/test cycle on the highest-risk single move before touching the remaining five sections.
- Task 2 moved all five combat-widget sections in one commit, as a single contiguous block preserving their original relative order (EFFECTS → DEATH SAVES → LEGENDARY → CONCENTRATION → AOE), since the plan grouped them as one responsibility ("Kampf-Widgets") rather than five separate tracer slices.
- The plan's acceptance criteria stated the export union should equal 34; the actual measured union both before and after the split is 38 (`grep -c "^window\."` on the original file returned 38, matching the plan's own read_first warning that counts predate 13-08's console-hygiene touch). Treated 38 as the correct invariant since it was verified directly against the file at every step (18 + 8 + 12 = 38).
- Confirmed RESEARCH.md's finding over CONTEXT.md's D-07 claim: `features/initiative.js` DOES call `pushUndo()` (in `finishCombatXp`'s XP-VERTEILUNG section) — this call site was never touched by either move, and the plan's own `<this_is_a_file_split>` framing flagged RESEARCH.md as authoritative here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `tests/build/test_build_deduplication.py` hardcoded the `MODULES` count**
- **Found during:** Task 3 (hard-gate `python -m pytest tests/build -q` run)
- **Issue:** `test_ssot_module_list_parses_from_loader` asserted `len(modules) == 125`, a number that predates this plan's two new registrations; adding `features/initiative-loot.js` and `features/initiative-combat-widgets.js` made it 127.
- **Fix:** Updated the assertion to `127` with a comment tracing back to this plan (mirrors the existing 13-09 comment style).
- **Files modified:** tests/build/test_build_deduplication.py
- **Verification:** `python -m pytest tests/build -q` — 24/24 passed
- **Committed in:** 28bc6c2 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — direct, in-scope consequence of this plan's file split, same pattern as 13-09)
**Impact on plan:** Fix was required to make the hard gate genuinely green; no scope creep, no behavior change to production code.

## Issues Encountered
- The plan's acceptance criteria expected an export-sum invariant of 34; the measured value throughout was 38. Documented above under Decisions Made rather than treated as a fix, since 38 was verified directly against the file both before and after the split — it is the plan's stated number that was stale (predates the XP-distribution exports added by an earlier plan in this phase), not the code.
- No unit test directly `vm`-loads `features/initiative.js` (unlike `wiki.js` in 13-09, where `wiki-links.test.js` needed a second `vm.runInContext` call). `tests/unit/initiative-mob.test.js` only loads `initiative-mob.js`; `tests/unit/entities.test.js` only exercises plain `D.initiative` data structures. Neither needed changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The MAINT-01 blueprint is confirmed a second time (banner-cut per D-02, `loader.js`-only registration per ARCH-01, `python build.py` after every section move, full-suite hard gate with evidence before commit) and ready to reuse for 13-11 (`rich-text.js`, the best-covered of the four but D-03's "two modules in one file" case) and 13-12 (`dmscreen-render.js`, D-04's characterization-snapshot-first case).
- No blockers. Baselines carried forward unchanged in count (Jest 1066/1066 across 38 suites, Playwright 321/2 skipped, `pytest tests/build` 24/24 with the module-count assertion now at 127) — this plan added net-new assertions inside an existing suite file (`test_build_deduplication.py` still counts as 1 of the build test files) rather than a new suite file.

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED
All created/modified files verified present on disk; all three task commit hashes (80ca4bd, c3b50c3, 28bc6c2) verified present in git log.
