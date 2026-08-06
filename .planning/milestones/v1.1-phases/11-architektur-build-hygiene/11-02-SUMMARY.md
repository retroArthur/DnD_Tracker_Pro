---
phase: 11-architektur-build-hygiene
plan: 02
subsystem: build-tooling
tags: [build.py, loader.js, pytest, ssot, python, css]

# Dependency graph
requires:
  - phase: 11-architektur-build-hygiene (plan 01)
    provides: "SSoT parser pattern (parse_js_string_array/load_module_list/require_files_exist) and the parser-hook position in build() to extend"
provides:
  - "SSoT template-list parser (load_template_list) reading loader.js's TEMPLATES array at build time — build.py no longer carries a second, hand-copied 12-entry template list"
  - "SSoT CSS-order parser (load_css_import_order) reading assets/styles.css's @import hub at build time — build.py no longer carries a second, hand-copied 20-entry CSS list"
  - "Hard-fail gates (require_files_exist) for both templates and CSS, aborting the build before any write when a listed file is missing"
  - "Live-drift fix: loader.js's TEMPLATES array now includes view-bestiary.html — dev mode and the bundle load an identical template set"
affects: [11-03-architektur-build-hygiene, later-11-xx-plans-touching-build.py]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SSoT-via-parse: a build-time text parser extracting a config list from a single canonical source file, replacing a second hand-synced copy (now applied to all three build-time lists: modules, templates, CSS order)"
    - "German [FEHLER]-prefixed abort register: every new failure path prints a German-language message and calls sys.exit(1) immediately"
    - "Abort-before-write invariant: all new sys.exit(1) calls occur before write_file() in build()"

key-files:
  created: []
  modified:
    - loader.js
    - build.py
    - tests/build/test_build_deduplication.py

key-decisions:
  - "load_template_list() reuses parse_js_string_array() unchanged — TEMPLATES is function-local inside loadModules() in loader.js, but the parser is text-based (regex), not JS-scope-aware, so it finds the array anyway; documented as a docstring caveat for a future stricter tokenizer"
  - "TEMPLATES in loader.js carries full paths (assets/templates/xxx.html) while the old hardcoded html_templates list carried bare filenames — load_template_list() returns the full-path form and the loading loop was adjusted to build paths via os.path.join(SOURCE_DIR, template) without re-prepending assets/templates/"
  - "load_css_import_order() does NOT reuse parse_js_string_array() — assets/styles.css has no comments between @import lines, so a dedicated regex (@import url\\('styles/([^']+)'\\);) is used instead, avoiding an unnecessary CSS-comment-stripping pass"
  - "require_files_exist() for CSS files is called with css_styles_dir (assets/styles/) as the base directory rather than remapping filenames to assets/styles/<name> first — matches the plan's second offered option, keeps css_files as bare filenames identical to what load_css_import_order() returns"

patterns-established:
  - "Pattern 3: the three SSoT loader functions (load_module_list, load_template_list, load_css_import_order) all sit together module-level before check_duplicate_functions, and are all called from the same beschaffungsblock at the top of build() before any file content is read"

requirements-completed: [ARCH-01]

coverage:
  - id: D1
    description: "loader.js's TEMPLATES array is fixed to include assets/templates/view-bestiary.html — dev mode now loads the same 12 templates as the bundle, closing the Phase-3 live drift"
    requirement: "ARCH-01"
    verification:
      - kind: unit
        ref: "python -c \"...TEMPLATES parse check...\" (12 entries, index 4 == view-bestiary.html)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/bestiary.spec.js (11/11 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "build.py reads the HTML template list exclusively from loader.js's TEMPLATES array via load_template_list() — the hardcoded html_templates list is removed"
    requirement: "ARCH-01"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_ssot_template_list_parses_from_loader"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_missing_template_file_aborts_build"
        status: pass
    human_judgment: false
  - id: D3
    description: "build.py reads the CSS cascade order exclusively from assets/styles.css's @import hub via load_css_import_order() — the hardcoded css_files list is removed; behavior-neutral (identical CSS character count in the dev bundle before/after)"
    requirement: "ARCH-01"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_ssot_css_order_matches_styles_hub"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_missing_css_file_aborts_build"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py -> CSS geladen: 628,420 Zeichen (identical before/after Task 3)"
        status: pass
  - id: D4
    description: "Dev and production builds remain behavior-neutral after both SSoT switches; full Jest suite and the bestiary E2E spec unaffected"
    requirement: "ARCH-01"
    verification:
      - kind: unit
        ref: "npm test (Jest) — 621/621 passed"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py --production (exit 0)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/bestiary.spec.js (11/11 passed)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-07-25
status: complete
---

# Phase 11 Plan 2: SSoT Template-List and CSS-Import-Order Parsers Summary

**build.py now parses both the HTML template list and the CSS cascade order from their single canonical source files (loader.js's TEMPLATES array and assets/styles.css's @import hub) instead of carrying hand-synced copies — and the Phase-3 live drift (loader.js missing view-bestiary.html) is actively fixed, not just prevented going forward.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-25T20:45:05Z
- **Completed:** 2026-07-25T20:49:13Z
- **Tasks:** 3
- **Files modified:** 3 (`loader.js`, `build.py`, `tests/build/test_build_deduplication.py`)

## Accomplishments

- `loader.js`'s `TEMPLATES` array fixed: `assets/templates/view-bestiary.html` added at the exact position `build.py` already used — dev mode now fetches the Bestiary container, closing a Phase-3 live drift that was invisible because `bestiary.spec.js` only ran against the bundled build
- `load_template_list()` added to `build.py`, reusing `parse_js_string_array()` — templates now have exactly one source (`loader.js`'s `TEMPLATES` array), hard-verified via `require_files_exist()` before any read
- `load_css_import_order()` added to `build.py` with a dedicated regex (no comment-stripping needed, unlike the JS parser) — CSS cascade order now has exactly one source (`assets/styles.css`'s `@import` hub), hard-verified the same way
- Both hardcoded lists (`html_templates`, 12 entries; `css_files`, 20 entries) removed from `build.py` entirely
- Six new pytest tests added (2 SSoT happy-path + 2 D-02 missing-file-abort per new parser, mirroring Plan 11-01's pattern exactly)
- Behavior-neutrality proven quantitatively: identical dev-bundle HTML Body size (336,052 chars) and CSS size (628,420 chars) before and after each respective task's switch; production build exit 0; Jest 621/621 green; `bestiary.spec.js` 11/11 green

## Task Commits

Each task was committed atomically (TDD test-then-feat sequence for Tasks 2 and 3):

1. **Task 1: Live-Drift beheben — view-bestiary.html in loader.js ergaenzen** - `2d2f29e` (fix)
2. **Task 2: Template-Liste auf SSoT umstellen und Hard-Fail verdrahten**
   - `fb5ac7d` (test) — 2 failing SSoT tests added, import line updated
   - `010c11f` (feat) — `load_template_list()` implemented, `html_templates` removed, `build()` rewired
3. **Task 3: CSS-@import-Reihenfolge auf SSoT umstellen und Hard-Fail verdrahten**
   - `abd911f` (test) — 2 failing SSoT tests added, import line updated
   - `558afeb` (feat) — `load_css_import_order()` implemented, `css_files` removed, `build()` rewired

_Note: Tasks 2 and 3 are both `tdd="true"` — RED (import failure) confirmed before implementation, GREEN confirmed after (all new tests + full dev/production build + npm test + bestiary E2E)._

## Files Created/Modified

- `loader.js` - `TEMPLATES` array in `loadModules()` extended from 11 to 12 entries (added `assets/templates/view-bestiary.html` at the position matching `build.py`'s prior ordering)
- `build.py` - Added `load_template_list()` and `load_css_import_order()`; removed the hardcoded `html_templates` (12 entries) and `css_files` (20 entries) lists; rewired `build()`'s beschaffungsblock to call both new loaders plus `require_files_exist()` before any CSS/template content is read; the CSS loading loop's `else`/`log.warning`-and-continue fallback removed (existence is now proven before the loop runs)
- `tests/build/test_build_deduplication.py` - Import line extended with `load_template_list`, `load_css_import_order`; added `test_ssot_template_list_parses_from_loader`, `test_missing_template_file_aborts_build`, `test_ssot_css_order_matches_styles_hub`, `test_missing_css_file_aborts_build`

## Decisions Made

- `load_template_list()` reuses `parse_js_string_array()` as-is despite `TEMPLATES` being function-local in `loader.js` — the parser is text-based, not scope-aware, so this works without modification; documented as a docstring caveat
- `load_css_import_order()` deliberately does NOT reuse `parse_js_string_array()` — `assets/styles.css` has no comments between `@import` lines, so a dedicated, simpler regex was used instead of an unneeded comment-stripping pass
- CSS `require_files_exist()` call uses `assets/styles/` as the base directory (second of two documented plan options) rather than remapping filenames to `assets/styles/<name>` — keeps `css_files` as bare filenames identical to what `load_css_import_order()` returns and to what the loading loop already expected

## Deviations from Plan

None — all three tasks executed exactly as specified in the plan text (function names, positions, message formats, wiring order, and test behavior all match the plan's `<action>`/`<behavior>` blocks).

### Pre-existing, out-of-scope finding (unchanged from Plan 11-01)

`tests/build/test_build_deduplication.py::test_build_generates_valid_javascript` still fails with the same naive brace-depth false positive on `features/bestiary/bestiary-editor.js`'s two independently-scoped `var el` declarations, documented in `.planning/phases/11-architektur-build-hygiene/deferred-items.md` and `.planning/WINDOWS.md` (entry id 2, phase 11, kind `deviation`, status `open`). This plan's changes do not touch `bestiary-editor.js` or the duplicate-detection logic; the failure is reconfirmed present both before and after all three tasks in this plan. Its rework is explicitly scoped to a later Phase-11 plan per `11-RESEARCH.md`'s test-disposition table.

---

**Total deviations:** 0 auto-fixed; 0 new out-of-scope findings (the one pre-existing finding from Plan 11-01 remains unchanged and outside this plan's scope)
**Impact on plan:** None — all three tasks' acceptance criteria are fully met on their own merits.

## Issues Encountered

`python -m pytest tests/build/ -v` shows `1 failed, 17 passed` (after Task 2) and `1 failed, 19 passed` (after Task 3) rather than a literal "0 failed", due to the pre-existing `test_build_generates_valid_javascript` issue documented above and in Plan 11-01. All tests this plan is responsible for (4 new SSoT/D-02 tests) pass cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three build-time lists (JS modules, HTML templates, CSS cascade order) now have exactly one source each; `build.py` no longer carries any hand-synced copy of a list that also exists in `loader.js` or `assets/styles.css`
- D-02 (hard-fail-before-write on a missing listed file) is now uniformly enforced for JS modules, HTML templates, and CSS files
- The Phase-3 live drift (Bestiary template missing from dev-mode `loader.js`) is actively fixed, not just structurally prevented going forward
- The known pre-existing `test_build_generates_valid_javascript` false positive remains open, tracked in `.planning/WINDOWS.md`, and is explicitly deferred to a later Phase-11 plan (D-05/D-06/D-07 duplicate-detection rework) — not this plan's or Plan 11-01's scope

---
*Phase: 11-architektur-build-hygiene*
*Completed: 2026-07-25*

## Self-Check: PASSED

All created/modified files verified present on disk; all 5 task commits (2d2f29e, fb5ac7d, 010c11f, abd911f, 558afeb) verified present in git log.
