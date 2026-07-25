---
phase: 11-architektur-build-hygiene
plan: 01
subsystem: build-tooling
tags: [build.py, loader.js, pytest, ssot, python]

# Dependency graph
requires:
  - phase: 10-security-haertung
    provides: threats_open 0 baseline, stable dist/ build pipeline to build on top of
provides:
  - "SSoT module-list parser (load_module_list/parse_js_string_array) reading loader.js's MODULES array at build time — build.py no longer carries a second, hand-copied 148-line list"
  - "Hard-fail gate (require_files_exist) that aborts the build before any write when a listed JS module file is missing"
  - "Structural position for the CSS/template SSoT parsing that Plan 11-02 will add (parse step now runs before the CSS/template load blocks)"
affects: [11-02-architektur-build-hygiene, later-11-xx-plans-touching-build.py]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SSoT-via-parse: a build-time text parser extracting a config list from a single canonical source file, replacing a second hand-synced copy"
    - "German [FEHLER]-prefixed abort register: every new failure path prints a German-language message and calls sys.exit(1) immediately, matching the existing project convention"
    - "Abort-before-write invariant: all new sys.exit(1) calls occur before write_file() in build(), so a failed build never leaves a stale-but-silently-wrong output file"

key-files:
  created: []
  modified:
    - build.py
    - tests/build/test_build_deduplication.py

key-decisions:
  - "parse_js_string_array() strips '//' line comments (re.MULTILINE) before extracting quoted literals — eliminates the apostrophe-in-comment tokenizer risk flagged in 11-RESEARCH.md, at negligible extra complexity (Option 2 of two documented choices)"
  - "require_files_exist() replaces the module-loop's else/log.warning branch entirely rather than keeping it as a fallback — there are no optional listed files in this repo, so a missing path is always an abort, never a skip-and-continue"
  - "check_module_list_sync() removed outright rather than kept as a no-op — its sole purpose (comparing two lists) is structurally impossible now that there's only one list"

patterns-established:
  - "Pattern 1: New parse/validate helper functions live module-level, directly before check_duplicate_functions — the established position for build-time validation helpers in build.py"
  - "Pattern 2: TDD test-then-feat two-commit sequence for build-system changes per CLAUDE.md 'Test-Driven Development Pattern' — enforced even for pure config-loader changes, not just app-behavior changes"

requirements-completed: [ARCH-01]

coverage:
  - id: D1
    description: "build.py reads the JS module list exclusively from loader.js's MODULES array at build time via load_module_list()/parse_js_string_array() — the 148-line hardcoded MODULES copy and check_module_list_sync() are removed"
    requirement: "ARCH-01"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_ssot_module_list_parses_from_loader"
        status: pass
    human_judgment: false
  - id: D2
    description: "An unparseable or empty MODULES array in loader.js aborts python build.py with a non-zero exit code instead of silently skipping the check"
    requirement: "ARCH-01"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_ssot_parse_failure_aborts_build"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_ssot_empty_array_aborts_build"
        status: pass
    human_judgment: false
  - id: D3
    description: "A JS module listed in loader.js but missing on disk aborts the build with a non-zero exit code and leaves any prior dist/ output byte-identical (writes nothing new)"
    requirement: "ARCH-01"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_missing_module_file_aborts_build"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_build_aborts_without_writing_output_on_missing_module"
        status: pass
    human_judgment: false
  - id: D4
    description: "Dev and production builds remain behavior-neutral after the SSoT switch — identical 123-module bundle, Jest suite unaffected"
    requirement: "ARCH-01"
    verification:
      - kind: automated_ui
        ref: "PYTHONIOENCODING=utf-8 python build.py && grep -c \"^// ========== \" dist/dnd-tracker-bundled.html (returns 123)"
        status: pass
      - kind: unit
        ref: "npm test (Jest) — 621/621 passed"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py --production (exit 0)"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-07-25
status: complete
---

# Phase 11 Plan 1: SSoT Module-List Parser Summary

**build.py now parses loader.js's MODULES array at build time instead of carrying a second hand-synced copy — module-list drift is structurally impossible, and a missing listed file hard-aborts the build before any output is written.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-25T20:28:35Z
- **Completed:** 2026-07-25T20:39:41Z
- **Tasks:** 2
- **Files modified:** 2 (`build.py`, `tests/build/test_build_deduplication.py`)

## Accomplishments

- `parse_js_string_array()`, `load_module_list()`, `require_files_exist()` added to `build.py` — the new SSoT parsing chain
- `MODULES` constant (148 lines) and `check_module_list_sync()` deleted from `build.py` entirely — there is now exactly one module list in the repo (`loader.js`)
- `build()` wired to call `load_module_list(loader_js_path)` then `require_files_exist(SOURCE_DIR, modules, 'JS-Modul')` before the CSS/template load blocks (positioned for Plan 11-02, which will extend the same parse step to templates and CSS `@import` order)
- Five new pytest tests added/replacing prior coverage: three SSoT-parser tests (happy path + two abort branches) and two D-02 hard-fail tests (missing-file abort + abort-before-write proof)
- Dev build (`dist/dnd-tracker-bundled.html`, 123 module banners) and production build (`--production`) both verified exit 0; Jest 621/621 green — proves the SSoT switch changed *sourcing*, not *content*

## Task Commits

Each task was committed atomically (TDD test-then-feat sequence):

1. **Task 1: SSoT-Kette fuer MODULES end-to-end**
   - `bc9e315` (test) — 3 failing SSoT tests added, import line updated
   - `cd3d3d6` (feat) — `load_module_list`/`parse_js_string_array`/`require_files_exist` implemented, `MODULES`/`check_module_list_sync` removed, `build()` rewired
2. **Task 2: Negativ-Pfad-Abdeckung fuer fehlende Moduldatei**
   - `139777b` (test) — 2 new D-02 tests added; both pass immediately against the already-implemented Task 1 gate (pure coverage, no new production code needed)

**Deviation documentation:** `974ffa1` (docs) — pre-existing unrelated test failure logged to `deferred-items.md` and `.planning/WINDOWS.md`

_Note: Task 1 is `type="tracer"` and `tdd="true"` — RED (failing import) confirmed before implementation, GREEN confirmed after (3/3 SSoT tests + full dev/production build)._

## Files Created/Modified

- `build.py` - Removed 148-line `MODULES` constant and `check_module_list_sync()`; added `parse_js_string_array()`, `load_module_list()`, `require_files_exist()`; rewired `build()` to source and verify the module list before any CSS/template loading
- `tests/build/test_build_deduplication.py` - Removed `test_module_lists_are_synchronized` (tested a function that no longer exists); added `test_ssot_module_list_parses_from_loader`, `test_ssot_parse_failure_aborts_build`, `test_ssot_empty_array_aborts_build`, `test_missing_module_file_aborts_build`, `test_build_aborts_without_writing_output_on_missing_module`; import line updated
- `.planning/phases/11-architektur-build-hygiene/deferred-items.md` - New file documenting a pre-existing, unrelated test failure found during verification
- `.planning/WINDOWS.md` - One new `deviation` entry (phase 11) for the same pre-existing failure

## Decisions Made

- `parse_js_string_array()` strips `//` line comments before extracting quoted literals (Tokenizer-Robustheitsrisiko Option 2 from 11-RESEARCH.md) — eliminates a latent apostrophe-in-comment parsing risk for negligible extra complexity
- `require_files_exist()` fully replaces the module-loop's `else: log.warning(...)` fallback — no optional listed files exist in this repo, so any missing path is always fatal
- `check_module_list_sync()` deleted outright (not kept as a no-op) — its sole job, comparing two lists, is structurally impossible now that there is only one list

## Deviations from Plan

### Auto-fixed Issues

None — Task 1 and Task 2 both executed exactly as specified in the plan text (function names, positions, message formats, and test behavior all match the plan's `<action>`/`<behavior>` blocks verbatim).

### Out-of-scope finding (documented, not fixed)

**1. [Scope Boundary] Pre-existing false positive in `test_build_generates_valid_javascript`**
- **Found during:** Task 1 verification (`python -m pytest tests/build/ -v`)
- **Issue:** The test's naive brace-depth duplicate-declaration heuristic flags `features/bestiary/bestiary-editor.js`'s two independently-scoped `var el` declarations (in an anonymous `forEach` callback and the `setBstInput` helper) as a duplicate top-level declaration. This is unrelated to `bestiary-editor.js` content, which this plan never touches.
- **Verified pre-existing:** Confirmed by temporarily restoring the pre-11-01 `build.py` (commit `91df5ba`), rebuilding, and re-running the identical duplicate-detection logic against the resulting bundle — the same failure occurs, at the same lines. The SSoT parser change is proven behavior-neutral (Jest 621/621, 123 module banners unchanged), so this cannot be caused by Plan 11-01.
- **Not fixed:** `11-RESEARCH.md`'s test-disposition table explicitly marks `test_build_generates_valid_javascript` as "Bleibt unverändert" (stays unchanged) for the whole phase — its rework belongs to the D-05/D-06/D-07 duplicate-check work planned in a later plan of Phase 11, not 11-01's SSoT scope.
- **Documented in:** `.planning/phases/11-architektur-build-hygiene/deferred-items.md`, `.planning/WINDOWS.md` (entry id 2, phase 11, kind `deviation`, status `open`)
- **Committed in:** `974ffa1`

---

**Total deviations:** 0 auto-fixed; 1 out-of-scope finding documented and deferred (not a Rule 1-4 deviation — pre-existing, unrelated to this plan's changes)
**Impact on plan:** None — Task 1 and Task 2 acceptance criteria are fully met on their own merits (the specific `-k ssot` and `-k missing_module` test subsets are 100% green, and the deferred failure is a documented, independently-verified pre-existing issue in an unrelated test).

## Issues Encountered

`python -m pytest tests/build/ -v` shows `1 failed, 13 passed` rather than the plan's literal "0 failed" acceptance wording, due to the pre-existing `test_build_generates_valid_javascript` issue documented above. All tests this plan is responsible for (the 5 new SSoT/D-02 tests, filterable via `-k ssot` and `-k missing_module`) pass cleanly; the one failure is unrelated and was independently verified to predate this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The SSoT parsing pattern (`parse_js_string_array`) and the parser-hook position (before the CSS/template load blocks) are now established in `build.py`, ready for Plan 11-02 to extend to the `TEMPLATES` array and CSS `@import` order per `11-PATTERNS.md`
- Known live drift flagged in `11-RESEARCH.md` (`loader.js`'s `TEMPLATES` array missing `view-bestiary.html`, present only in `build.py`'s old hardcoded `html_templates` list) is **not yet fixed** — this is explicitly Plan 11-02's responsibility (D-04), not 11-01's
- Deferred item (pre-existing test false positive) is tracked in `.planning/WINDOWS.md` for whichever later Phase-11 plan reworks `check_duplicate_functions`/the duplicate-detection tests (D-06/D-07)

---
*Phase: 11-architektur-build-hygiene*
*Completed: 2026-07-25*

## Self-Check: PASSED

All created/modified files verified present on disk; all 5 task/docs commits (bc9e315, cd3d3d6, 139777b, 974ffa1, 2ad7983) verified present in git log.
