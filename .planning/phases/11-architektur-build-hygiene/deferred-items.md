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
