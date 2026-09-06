---
phase: 13-h-rtung-wartbarkeit
plan: 09
subsystem: maintainability
tags: [module-split, loader, wiki, non-esm, build-system]

# Dependency graph
requires:
  - phase: 13-02
    provides: "parseWikiLinks() SEC-04 escaping, duplicate data-id fix in features/wiki/wiki.js"
  - phase: 13-08
    provides: "console hygiene sweep across ~30 files including features/wiki/wiki.js"
provides:
  - "features/wiki/wiki.js split along its existing section banners into wiki.js (STATE/CONSTANTS/RENDER) and wiki-crud.js (WIKI CRUD + WIKI UX IMPROVEMENTS)"
  - "Both resulting files registered in loader.js MODULES, in dependency order, nothing added to build.py"
  - "Blueprint (banner-cut, single Task-1 tracer slice, immediate build-after-move, full-suite hard gate) for the remaining three MAINT-01 splits (13-10, 13-11, 13-12)"
affects: [13-10, 13-11, 13-12, maint-01, loader.js]

actuals:
  tokens: 14400
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "MAINT-01 file-split convention: [SECTION:X] header + own EXPORTS FOR GLOBAL ACCESS block per file, cut along // ==== banners, registered only in loader.js MODULES"

key-files:
  created:
    - features/wiki/wiki-crud.js
  modified:
    - features/wiki/wiki.js
    - loader.js
    - tests/unit/wiki-links.test.js
    - tests/build/test_build_deduplication.py

key-decisions:
  - "Task 1 moved only the WIKI UX IMPROVEMENTS section as the tracer slice (per plan); Task 2 moved WIKI CRUD above it, restoring the original physical section order inside the new file."
  - "Export union is 28, not the 30 stated in the plan's acceptance criteria — the plan's count predates 13-02/13-08 touching wiki.js; verified against the actual grep -c \"^window\\.\" wiki.js before the split (28) and confirmed unchanged after (2 + 26 = 28)."
  - "Fixed the stale '// Zeilen: 1,316' header comment in wiki.js to reflect the post-split reality and point to wiki-crud.js for CRUD/UX."

patterns-established:
  - "tests/unit/wiki-links.test.js now loads both features/wiki/wiki.js and features/wiki/wiki-crud.js via vm, in loader.js MODULES order — the template for any future direct-vm test touching a split module."

requirements-completed: [MAINT-01]

coverage:
  - id: D1
    description: "features/wiki/wiki.js split along its existing section banners into wiki.js (554 lines, STATE/CONSTANTS/RENDER) and wiki-crud.js (673 lines, WIKI CRUD + WIKI UX IMPROVEMENTS), both under the 800-line D-01 cap"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "wc -l features/wiki/wiki.js && wc -l features/wiki/wiki-crud.js (554, 673)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/wiki.spec.js (13/13 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "features/wiki/wiki-crud.js registered in loader.js MODULES directly behind features/wiki/wiki.js; nothing added to build.py"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -c \"features/wiki/wiki-crud.js\" loader.js == 1; grep -c \"features/wiki\" build.py == 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "No symbol declared in two source files; python build.py assembles the bundle after each move without [FEHLER]/[ABORTED]"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py (exit 0, both after Task 1 and Task 2 moves)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full suite hard gate green before final commit: Jest, tsc, both dist bundles, python build tests, full Playwright suite"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "npx jest (38 suites, 1066/1066 passed)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit (exit 0, no error TS)"
        status: pass
      - kind: other
        ref: "python -m pytest tests/build -q (24/24 passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test (321 passed / 2 skipped)"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 09: Wiki-Modul-Aufteilung (MAINT-01, 1/4) Summary

**`features/wiki/wiki.js` (1223 Zeilen) entlang seiner Sektionsbanner in `wiki.js` (554, STATE/CONSTANTS/RENDER) und `features/wiki/wiki-crud.js` (673, WIKI CRUD + WIKI UX IMPROVEMENTS) aufgeteilt, beide unter der 800-Zeilen-Grenze, in `loader.js` registriert, Verhalten unverändert bestätigt durch den vollen Suiten-Lauf.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-09-06T08:15:00Z (approx.)
- **Completed:** 2026-09-06T09:02:37Z
- **Tasks:** 3
- **Files modified:** 5 (features/wiki/wiki.js, features/wiki/wiki-crud.js [new], loader.js, tests/unit/wiki-links.test.js, tests/build/test_build_deduplication.py)

## Accomplishments
- `features/wiki/wiki-crud.js` created with its own `[SECTION:WIKI_CRUD]` header and `EXPORTS FOR GLOBAL ACCESS` block (npc-render.js/npc-crud.js convention), carrying the `WIKI CRUD` and `WIKI UX IMPROVEMENTS` sections and all 26 of their exports
- `features/wiki/wiki.js` reduced to `STATE`, `CONSTANTS`, `RENDER` (554 lines) with only `renderWiki`/`renderWikiTree` exported
- `loader.js` `MODULES` updated: `'features/wiki/wiki-crud.js'` inserted directly behind `'features/wiki/wiki.js'`; nothing touched in `build.py` (ARCH-01)
- Full hard-gate suite run with evidence captured (see coverage D4) before the final commit, per the Roadmap interpretation note governing all four MAINT-01 splits

## Task Commits

Each task was committed atomically:

1. **Task 1: `wiki-crud.js` anlegen, EINE Sektion verschieben, registrieren, bauen** - `4964646` (feat)
2. **Task 2: Zweite Sektion verschieben und beide Dateien unter die Grenze bringen** - `909dd64` (feat)
3. **Task 3: Hard-Gate — volle Suiten, beide Bündel, Typprüfung vor dem Commit** - `7e0b435` (test — the hard-gate run surfaced two test breakages that this commit fixes; see Deviations)

**Plan metadata:** committed alongside this SUMMARY (see final commit below)

## Files Created/Modified
- `features/wiki/wiki-crud.js` - New module: WIKI CRUD (selectWikiEntry…insertWikiLink) + WIKI UX IMPROVEMENTS (addToWikiRecentlyViewed…handleWikiContentInput), 673 lines, 26 exports
- `features/wiki/wiki.js` - Reduced to STATE/CONSTANTS/RENDER, 554 lines, 2 exports (renderWiki, renderWikiTree); stale header comment corrected
- `loader.js` - `'features/wiki/wiki-crud.js'` added to `MODULES`, directly after `'features/wiki/wiki.js'`
- `tests/unit/wiki-links.test.js` - Now loads `wiki.js` AND `wiki-crud.js` via `vm` in loader order (the moved functions live in the new file)
- `tests/build/test_build_deduplication.py` - `test_ssot_module_list_parses_from_loader` module-count assertion updated 124 → 125

## Decisions Made
- Task 1 moved only the `WIKI UX IMPROVEMENTS` section as the tracer slice, exactly as the plan specified, to prove the loader/build/test cycle on a small, reversible change first.
- Task 2 placed the `WIKI CRUD` section ABOVE the already-moved `WIKI UX IMPROVEMENTS` section in `wiki-crud.js`, preserving the original relative order of the two sections as they appeared in `wiki.js`.
- The plan's acceptance criteria stated the export union should equal 30; the actual measured union both before and after the split is 28 (`grep -c "^window\."` on the original file returned 28). The plan's own read_first note for Task 1 already warns that line numbers (and, it turns out, this count) predate 13-02/13-08 touching `wiki.js`. Treated 28 as the correct invariant since it was verified directly against the file at every step (see coverage D2's sibling check and the export-sum arithmetic 2 + 26 = 28).
- Corrected the stale `// Zeilen: 1,316` header comment in `wiki.js` (already wrong before this plan — the file was 1223 lines) to state the accurate post-split line count and point to `wiki-crud.js`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `tests/unit/wiki-links.test.js` broke because it loaded only `wiki.js` via `vm`**
- **Found during:** Task 3 (hard-gate `npx jest` run)
- **Issue:** The test loads `features/wiki/wiki.js` directly with Node's `vm` module (not through `loader.js`) and calls `context.parseWikiLinks(...)`. After Task 2 moved `parseWikiLinks()` (and the rest of `WIKI CRUD`) into `wiki-crud.js`, the function was undefined in that test's isolated context — 5 of 6 tests in the suite failed with `TypeError: context.parseWikiLinks is not a function`.
- **Fix:** Added a second `vm.runInContext(...)` call loading `features/wiki/wiki-crud.js` immediately after `wiki.js`, matching `loader.js` `MODULES` order (required because `wiki-crud.js` references `WikiState`/`WIKI_CATEGORIES` as bare identifiers from `wiki.js`).
- **Files modified:** tests/unit/wiki-links.test.js
- **Verification:** `npx jest tests/unit/wiki-links.test.js` — 6/6 passed
- **Committed in:** 7e0b435 (Task 3 commit)

**2. [Rule 1 - Bug] `tests/build/test_build_deduplication.py` hardcoded the `MODULES` count**
- **Found during:** Task 3 (hard-gate `python -m pytest tests/build -q` run)
- **Issue:** `test_ssot_module_list_parses_from_loader` asserted `len(modules) == 124`, a number that predates this plan's new registration; adding `features/wiki/wiki-crud.js` made it 125.
- **Fix:** Updated the assertion to `125` with a comment tracing back to this plan (mirrors the existing SAFE-01 comment style).
- **Files modified:** tests/build/test_build_deduplication.py
- **Verification:** `python -m pytest tests/build -q` — 24/24 passed
- **Committed in:** 7e0b435 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — direct, in-scope consequences of this plan's file split)
**Impact on plan:** Both fixes were required to make the hard gate genuinely green; no scope creep, no behavior change to production code.

## Issues Encountered
- The plan's acceptance criteria expected an export-sum invariant of 30; the measured value throughout was 28. Documented above under Decisions Made rather than treated as a fix, since 28 was verified directly against the file both before and after the split — it is the plan's stated number that was stale, not the code.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The MAINT-01 blueprint (banner-cut per D-02, `loader.js`-only registration per ARCH-01, `python build.py` after every single move, full-suite hard gate with evidence before commit) is proven end-to-end and ready to reuse for 13-10 (`initiative.js`), 13-11 (`rich-text.js`), and 13-12 (`dmscreen-render.js`).
- No blockers. Baselines carried forward unchanged in count (Jest 1066/1066 across 38 suites, Playwright 321/2 skipped, `pytest tests/build` 24/24) — this plan added net-new assertions inside existing suites (wiki-links.test.js still counts as 1 of 38) rather than a new suite file.

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*
