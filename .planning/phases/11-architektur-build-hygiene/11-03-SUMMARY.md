---
phase: 11-architektur-build-hygiene
plan: 03
subsystem: build-tooling
tags: [build.py, pytest, dedup, ssot, python]

# Dependency graph
requires:
  - phase: 11-architektur-build-hygiene (plans 01-02)
    provides: "SSoT parser chain (load_module_list/load_template_list/load_css_import_order + require_files_exist) and the check_duplicate_functions() pre-build check position ahead of the JS-loading loop"
provides:
  - "Dead-code removal: the third dedup pass (remove_duplicate_functions) that commented out a duplicate function head while leaving its body orphaned in the bundle no longer exists — the 2026-01-10 incident class is structurally impossible, not just better cleaned up"
  - "check_duplicate_functions() extended from function-only to function/const/let/class via brace-depth tracking, matching real existing code (4 top-level class declarations, 231 const/let lines) and correctly ignoring function-local declarations"
  - "D-07 behavioral proof pair: no [DEDUP] function marker survives in either generated bundle, and a source-level duplicate const aborts build() with SystemExit before any output write"
affects: [11-04-architektur-build-hygiene, later-11-xx-plans-touching-build.py, docs-catchup-11-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brace-depth-0 declaration scan reused across two call sites in the same file (post-build validator, now also the source-level pre-check) instead of a second, divergent detection scheme"
    - "German [FEHLER]-prefixed abort register extended (message text: 'Doppelte Top-Level-Deklaration' replacing 'Doppelte Top-Level-Funktion') — same sys.exit(1) shape as before"
    - "Absolute tmp_path module-list entries as a monkeypatch technique for build()-level behavioral tests — os.path.join(SOURCE_DIR, module) discards SOURCE_DIR when module is already absolute (Windows drive-letter semantics), letting check_duplicate_functions()/require_files_exist() find fixture collision files regardless of the real project root"

key-files:
  created: []
  modified:
    - build.py
    - tests/build/test_build_deduplication.py
    - .planning/phases/11-architektur-build-hygiene/deferred-items.md

key-decisions:
  - "check_duplicate_functions() kept its name (referenced by build() and existing tests per RESEARCH's caller analysis) while its docstring and detection scope were extended to four declaration kinds — no rename, only capability extension"
  - "Depth-tracking (RESEARCH option 2) chosen over the naive indentation regex (option 1) — reuses the exact technique already proven in the post-build validator, more robust against formatting drift, per 11-RESEARCH.md's own preference"
  - "Post-build validation backstop (build.py, the depth-0 duplicate-declaration check inside build()) left byte-for-byte untouched, per D-06's explicit instruction that it stays as an independent second layer"
  - "Module-level docstrings ('Three-pass' -> 'Two-pass') updated in build.py itself as part of Task 1 — distinct from D-08's docs/build-system.md + CLAUDE.md catch-up (explicitly out of scope here, owned by 11-07); leaving a now-false claim in the file being actively edited would be inconsistent with the change made in the same commit"

requirements-completed: [ARCH-02]

coverage:
  - id: D1
    description: "The dedup pass that commented out a duplicate function head while leaving its body's closing braces/return orphaned in the bundle (remove_duplicate_functions, the Pass 2->3 handoff) no longer exists in build.py; deduplicate_window_assignments() returns Pass 2's result directly"
    requirement: "ARCH-02"
    verification:
      - kind: unit
        ref: "grep -v '^\\s*#' build.py | grep -c remove_duplicate_functions -> 0; grep -c 'duplicate functions removed' build.py -> 0"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py && python build.py --production; grep -c 'Removed duplicate function' on both dist/*.html -> 0/0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Two same-named top-level declarations (function, const, let, or class) across two source modules abort the build before bundling, and the message names both source files"
    requirement: "ARCH-02"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_duplicate_function_check_detects_duplicate (unchanged, still green)"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_duplicate_const_check_detects_duplicate"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_duplicate_class_check_detects_duplicate"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_duplicate_let_check_detects_duplicate"
        status: pass
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_nested_declaration_is_not_a_duplicate (negative control: function-local declarations at depth > 0 do not trigger)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A build aborted because of a source-level duplicate exits non-zero and leaves an existing dist file unchanged (writes nothing new)"
    requirement: "ARCH-02"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_source_duplicate_aborts_build_without_writing_output"
        status: pass
    human_judgment: false
  - id: D4
    description: "No [DEDUP] marker for removed function declarations appears in either generated bundle anymore"
    requirement: "ARCH-02"
    verification:
      - kind: unit
        ref: "tests/build/test_build_deduplication.py#test_no_dedup_function_marker_in_bundle"
        status: pass
      - kind: other
        ref: "grep -c 'Removed duplicate function' dist/dnd-tracker-bundled.html dist/dnd-tracker-optimized.html -> 0, 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The post-build validation backstop in build() (depth-0 duplicate-declaration check inside the final HTML assembly step) remains unchanged as an independent second detection layer"
    requirement: "ARCH-02"
    verification:
      - kind: unit
        ref: "git diff 698ca82 HEAD -- build.py shows zero lines touched in the post-build validation block (build() lines ~532-579)"
        status: pass
      - kind: unit
        ref: "grep -c 'Doppelte Deklaration' build.py -> 1; grep -c 'Build NICHT geschrieben' build.py -> 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "Dev and production builds remain behavior-neutral; the dedup savings log line is byte-identical before and after Pass 3's removal, confirming Pass 3 contributed nothing (as predicted by 11-01's research)"
    requirement: "ARCH-02"
    verification:
      - kind: other
        ref: "Deduplizierung log line: '-9,671 Zeichen gespart' identical before (git stash) and after Task 1's changes"
        status: pass
      - kind: unit
        ref: "npm test (Jest) — 621/621 passed"
        status: pass
      - kind: e2e
        ref: "npx playwright test — 318 passed / 2 skipped (full suite, matches known baseline)"
        status: pass
    human_judgment: false

duration: ~11min
completed: 2026-07-25
status: complete
---

# Phase 11 Plan 3: Remove Dead Dedup Pass 3, Extend Pre-Check to const/let/class Summary

**The dedup pass that could silently produce a bundle with an orphaned function body (`remove_duplicate_functions`) is deleted outright rather than repaired — collisions are now caught before bundling by an extended source-level pre-check that covers `function`/`const`/`let`/`class` via brace-depth tracking, closing ARCH-02.**

## Performance

- **Duration:** ~6 min (commit span: 22:57:07 to 23:02:28 CEST) plus a full Playwright run (~2 min) for final verification
- **Started:** 2026-07-25T22:57:07+02:00
- **Completed:** 2026-07-25T23:02:28+02:00
- **Tasks:** 3
- **Files modified:** 3 (`build.py`, `tests/build/test_build_deduplication.py`, `.planning/phases/11-architektur-build-hygiene/deferred-items.md`)

## Accomplishments

- **Task 1 (D-05):** `remove_duplicate_functions()` and its Pass-2→3 handoff deleted from `build.py` in full — including the orphan-bug brace-counting loop that must never survive as a copy-paste template. `deduplicate_window_assignments()` now returns Pass 2's result directly. Both module-level docstrings updated ("Three-pass" → "Two-pass"). The obsolete `test_no_orphaned_return_statements` was replaced by `test_no_dedup_function_marker_in_bundle`, a regression test that asserts the Pass-3 marker string (`[DEDUP] Removed duplicate function`, now a module constant `DEDUP_FUNCTION_MARKER`) never appears in the built bundle.
- **Task 2 (D-06, TDD):** `check_duplicate_functions()` extended from `function`-only detection to `function|const|let|class`, using brace-depth tracking (the same technique already proven in the post-build validator) instead of a text-indentation heuristic — more robust against formatting drift, and correctly distinguishes function-local declarations (depth > 0) from real top-level collisions. RED confirmed first (3 new tests failing with `DID NOT RAISE`), then GREEN after implementation. Ran against the full real codebase with zero false positives — the four known top-level `class` declarations (`VirtualList`, `DOMVirtualList`, `SafeRender`, `BatchUpdater`) and 231 `const`/`let` lines from 11-RESEARCH.md's audit do not collide.
- **Task 3 (D-07, TDD):** `test_source_duplicate_aborts_build_without_writing_output` added — proves the second half of the D-07 behavioral guarantee (build with a source duplicate exits non-zero and leaves any prior `dist/` output byte-identical). Passed immediately (the capability was already fully implemented by Task 2); this is pure coverage, matching the same "no new production code needed" pattern seen in 11-01/11-02's negative-path tests.
- Full verification after every task: `PYTHONIOENCODING=utf-8 python build.py` and `--production` both exit 0, `python -m pytest tests/build/` green except the one pre-existing unrelated failure (see below), `npm test` 621/621, and — required specifically by Task 3's verify block as the Phase-8 D-03 blocking gate — the **full** `npx playwright test` suite: 318 passed / 2 skipped.

## Task Commits

1. **Task 1: Pass 3 ersatzlos entfernen und den Marker-Regressionstest verankern**
   - `b1e5e1e` (refactor) — Pass 3 deleted, docstrings updated, `test_no_orphaned_return_statements` replaced by `test_no_dedup_function_marker_in_bundle`
2. **Task 2: Quell-Pre-Check auf const/let/class erweitern**
   - `87940cb` (test) — 3 new failing tests added (RED): `test_duplicate_const_check_detects_duplicate`, `test_duplicate_class_check_detects_duplicate`, `test_duplicate_let_check_detects_duplicate`, plus the negative control `test_nested_declaration_is_not_a_duplicate` (trivially green)
   - `16269a2` (feat) — `check_duplicate_functions()` extended with brace-depth tracking over the four declaration kinds (GREEN)
3. **Task 3: Verhaltensgarantie beweisen — Quell-Duplikat bricht ab und schreibt nichts**
   - `ae3e140` (test) — `test_source_duplicate_aborts_build_without_writing_output` added; green on first run (behavior already covered by Task 2's implementation)

_Note: Tasks 2 and 3 are both `tdd="true"`. Task 2 followed the full RED→GREEN cycle (RED confirmed via `DID NOT RAISE SystemExit` on all three new fixtures before implementation). Task 3's single new behavior test passed immediately, matching the 11-01 Plan 2 precedent of "pure coverage, no new production code needed" when the underlying capability was already implemented by a prior task in the same plan._

## Files Created/Modified

- `build.py` — `remove_duplicate_functions()` (53 lines, including the orphan-bug brace-counting loop) deleted in full; `deduplicate_window_assignments()` returns Pass 2's result directly; `check_duplicate_functions()` extended to `function|const|let|class` via brace-depth tracking with an updated `[FEHLER] Doppelte Top-Level-Deklaration ...` message; module-level and function-level docstrings updated from "Three-pass"/"three passes" to reflect the current two-pass + pre-build-check architecture. Post-build validation backstop left byte-for-byte unchanged.
- `tests/build/test_build_deduplication.py` — `test_no_orphaned_return_statements` removed; `test_no_dedup_function_marker_in_bundle`, `test_duplicate_const_check_detects_duplicate`, `test_duplicate_class_check_detects_duplicate`, `test_duplicate_let_check_detects_duplicate`, `test_nested_declaration_is_not_a_duplicate`, `test_source_duplicate_aborts_build_without_writing_output` added; new module constant `DEDUP_FUNCTION_MARKER`.
- `.planning/phases/11-architektur-build-hygiene/deferred-items.md` — new `## 11-03 — Confirmed still out of scope` section explicitly re-affirming that the pre-existing `test_build_generates_valid_javascript` false positive (WINDOWS.md entry id 2) is a distinct, unrelated test bug not addressed by this plan's D-05/D-06/D-07 scope, and that no later Phase-11 plan (11-04 through 11-07, checked) claims it either.

## Decisions Made

- `check_duplicate_functions()` kept its existing name — no rename — since `build()` and prior tests reference it directly; only its docstring, detection pattern, and message text were extended (per RESEARCH's caller-graph verification that this is the sole entry point).
- Brace-depth tracking (RESEARCH option 2) chosen over the naive column-0 indentation regex (option 1), reusing the exact technique already running in the post-build validator — same idiom, two call sites, no new pattern introduced to the codebase.
- The post-build validator itself was deliberately left untouched (D-06's explicit "stays as backstop" instruction) — verified via `git diff` showing zero lines changed in that block.
- Module-level docstring text in `build.py` ("Three-pass" → "Two-pass") was updated as part of Task 1, distinct from the docs/build-system.md + CLAUDE.md catch-up explicitly deferred to plan 11-07 (D-08) — this is a one-line consistency fix inside the exact file being edited in the same commit, not a doc-catch-up sweep.

## Deviations from Plan

### Auto-fixed Issues

None — all three tasks executed exactly as specified in the plan's `<action>`/`<behavior>` blocks (function names, positions, message formats, brace-depth technique, and test behavior all match).

### Pre-existing, out-of-scope finding (unchanged from Plans 11-01/11-02, explicitly re-confirmed here)

**`tests/build/test_build_deduplication.py::test_build_generates_valid_javascript`** still fails with the same pre-existing false positive on `features/bestiary/bestiary-editor.js`'s two independently-scoped `var el` declarations (`Duplicate var declaration found: el at lines 48750 (var) and 48784 (var)`), reconfirmed identical before and after every task in this plan.

This warrants explicit documentation because the executor prompt's prior-wave context flagged this as an item this plan might be expected to resolve. On inspection, **11-RESEARCH.md's own test-disposition table (§"Pattern 2") explicitly marks `test_build_generates_valid_javascript` as "Bleibt unverändert"** — it is a different test from the ones this plan's D-05/D-06/D-07 work actually reworks (`test_no_orphaned_return_statements`/`test_duplicate_function_check_detects_duplicate`). `check_duplicate_functions()` (extended in Task 2) operates on source files checked against the module list at build time; `test_build_generates_valid_javascript` independently re-implements its own, un-depth-aware duplicate scan directly against the bundled `dist/` HTML text — the two are structurally unrelated code paths, and fixing the source-level pre-check does nothing to this test's own heuristic bug.

**Not fixed here, and no later Phase-11 plan claims it either** (checked 11-04 through 11-07 via grep — no reference to this test or `bestiary-editor.js`). The recommended fix (switch this test's duplicate check to the same brace-depth-at-column-0 technique this plan just applied to `check_duplicate_functions()`) is now written up in `deferred-items.md` as an unclaimed item for whichever future change next touches this test file. `.planning/WINDOWS.md` entry id 2 (phase 11, kind `deviation`, status `open`) is **left open**, not closed — closing it here would misrepresent this plan's actual scope.

---

**Total deviations:** 0 auto-fixed; 0 new out-of-scope findings (the one pre-existing finding from Plans 11-01/11-02 remains unchanged, re-verified, and explicitly documented as still out of this plan's scope rather than silently carried forward)
**Impact on plan:** None — all three tasks' acceptance criteria are met on their own merits. `python -m pytest tests/build/ -v` shows `1 failed, 22 passed` rather than a literal "0 failed" for the same documented, pre-existing, independently-verified reason as Plans 11-01 and 11-02.

## Issues Encountered

`python -m pytest tests/build/ -v` shows `1 failed, 22 passed` (final state, all three tasks applied) rather than a literal "0 failed" per the plan's acceptance-criteria wording, due to the pre-existing `test_build_generates_valid_javascript` issue documented above and in Plans 11-01/11-02. All 6 tests this plan adds/replaces (`test_no_dedup_function_marker_in_bundle`, `test_duplicate_const_check_detects_duplicate`, `test_duplicate_class_check_detects_duplicate`, `test_duplicate_let_check_detects_duplicate`, `test_nested_declaration_is_not_a_duplicate`, `test_source_duplicate_aborts_build_without_writing_output`) pass cleanly, individually and filtered (`-k "duplicate or nested"`, `-k source_duplicate`).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ARCH-02 is fully closed: there is no code path left in `build.py` that can silently produce a syntactically broken bundle. A source-level duplicate declaration of any of the four kinds (`function`/`const`/`let`/`class`) now aborts before any file is written, at three independent layers (source pre-check, post-build validator, CI E2E smoke against the executed bundle).
- The `[DEDUP] Removed duplicate function` marker and its underlying orphan-body bug class no longer exist anywhere in the codebase — verified absent from both generated bundles.
- `docs/build-system.md` and `CLAUDE.md` still describe the now-removed three-pass system in detail (seven references in `docs/build-system.md` per 11-RESEARCH.md's grep count, plus the "Build System & Deduplication Pattern" and "Duplicate Declaration Debugging Pattern" sections in `CLAUDE.md`) — this is explicitly deferred to plan 11-07 (D-08), not touched here per this plan's own scope boundary and the executor prompt's explicit instruction not to rewrite `CLAUDE.md` in this plan.
- The pre-existing `test_build_generates_valid_javascript` false positive (WINDOWS.md entry id 2) remains open and unclaimed within Phase 11's remaining plans (11-04 through 11-07) — flagged here as a gap for a future opportunistic fix or dedicated gap-closure plan, rather than silently left implicit.

---
*Phase: 11-architektur-build-hygiene*
*Completed: 2026-07-25*

## Self-Check: PASSED

All created/modified files verified present on disk; all 4 task commits (b1e5e1e, 87940cb, 16269a2, ae3e140) verified present in git log.
