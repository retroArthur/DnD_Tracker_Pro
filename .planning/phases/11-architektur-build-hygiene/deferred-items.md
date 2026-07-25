# Deferred Items — Phase 11 (Architektur- & Build-Hygiene)

Items found during execution that are out of scope for the current plan (Scope Boundary rule:
only auto-fix issues directly caused by the current task's changes).

## 11-01 — Pre-existing failing test, unrelated to SSoT parser change

- **Test:** `tests/build/test_build_deduplication.py::TestBuildDeduplication::test_build_generates_valid_javascript`
- **Failure:** `Failed: Duplicate var declaration found: el at lines 48750 (var) and 48784 (var)`
- **Root cause:** The test's duplicate-declaration heuristic tracks brace depth naively and
  does not account for nested function scopes. `features/bestiary/bestiary-editor.js` declares
  `var el` in two different function bodies (an anonymous `forEach` callback and the named
  `setBstInput` helper) that both happen to sit at brace-depth 0 by the test's counting method
  and are fewer than 50 lines apart in the bundled output — a false positive, not a real
  duplicate top-level declaration.
- **Verified pre-existing:** Confirmed by temporarily running the unmodified pre-11-01 `build.py`
  (commit `91df5ba`) and re-running the same duplicate-detection logic against the resulting
  `dist/dnd-tracker-bundled.html` — the identical failure occurs. The 11-01 SSoT parser change
  does not touch `bestiary-editor.js` or the bundle content in any way; module order and content
  are byte-identical to before this plan (verified via Jest 621/621 green and the 123-banner
  count check).
- **Not fixed here:** Per `11-RESEARCH.md` (line 198 table), `test_build_generates_valid_javascript`
  is explicitly marked "Bleibt unverändert" (stays unchanged) across the entire phase — reworking
  this test's duplicate-detection heuristic belongs to the D-05/D-06/D-07 work in a later plan
  (`check_duplicate_functions()` extension / depth-tracking rewrite), not 11-01's SSoT scope.
- **Why previously undetected:** `.github/workflows/ci.yml` does not currently run
  `pytest tests/build/` at all (that step is added under D-03 in a later plan of this phase) —
  this Python test suite has no CI enforcement today, so the false positive went unnoticed.
- **Recommended fix (for the D-06 plan):** switch `test_build_generates_valid_javascript`'s
  duplicate check to the same brace-depth-at-column-0 technique already used by the post-build
  validator in `build()` (see `11-PATTERNS.md` "Depth-tracking alternative"), which correctly
  distinguishes nested-function-scoped `var` from true top-level duplicates.

## 11-03 — Confirmed still out of scope (not the D-06/D-07 plan referenced above)

`11-RESEARCH.md`'s own test-disposition table (§"Pattern 2: Dedup Pass 3 entfernen + Pre-Check
erweitern (D-05/D-06)") explicitly marks `test_build_generates_valid_javascript` as "Bleibt
unverändert" — it is a *different* test from the ones 11-03 reworks (`test_no_orphaned_return_statements`,
replaced by `test_no_dedup_function_marker_in_bundle` + `test_source_duplicate_aborts_build_without_writing_output`,
and `test_duplicate_function_check_detects_duplicate`, extended for `const`/`let`/`class`).
`check_duplicate_functions()` (extended in 11-03 Task 2 with brace-depth tracking) operates on
*source files against the module list*, not on the bundled `dist/` HTML text that
`test_build_generates_valid_javascript` scans with its own, unrelated, un-depth-aware heuristic.
11-03 does not touch `bestiary-editor.js` or `test_build_generates_valid_javascript` — reconfirmed
failing identically before and after all three of 11-03's tasks (`Duplicate var declaration found:
el at lines 48750 (var) and 48784 (var)`), 22 passed / 1 failed both times. No later plan of Phase
11 (11-04 through 11-07, checked by grep) references this test or `bestiary-editor.js` either — the
fix (rewriting this specific test's own heuristic to reuse the depth-tracking technique, per the
"Recommended fix" above) remains unclaimed within Phase 11 and should be picked up opportunistically
by whichever future change next touches `tests/build/test_build_deduplication.py`, or via a
dedicated gap-closure plan. `.planning/WINDOWS.md` entry id 2 stays `open`.
