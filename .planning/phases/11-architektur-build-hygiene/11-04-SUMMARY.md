---
phase: 11-architektur-build-hygiene
plan: 04
subsystem: ci-cd
tags: [ci.yml, pytest, github-actions, requirements-dev.txt, node-version]

# Dependency graph
requires:
  - phase: 11-architektur-build-hygiene (plans 01-03)
    provides: "The build-gate test suite (tests/build/, 23 tests after this plan's fix) that this plan wires into CI as a real gate"
provides:
  - "CI test-job runs the Phase-11 build-gate tests (pytest tests/build/) against a freshly built bundle — ARCH-01/ARCH-02 are now enforced in CI, not only locally"
  - "requirements-dev.txt as the pinned-Python-dependency pattern for future tests/build/ additions"
  - "All eight GitHub Actions in ci.yml on their execution-time-verified current major; node-version '22' at all six actions/setup-node steps"
  - "test_build_generates_valid_javascript rewritten to brace-depth-aware duplicate detection — closes WINDOWS.md entry 2, the last open Phase-11 pytest false positive"
affects: [later-11-xx-plans-touching-ci.yml, gsd-ship (WINDOWS.md gate)]

# Tech tracking
tech-stack:
  added:
    - "requirements-dev.txt (pytest==9.0.3, pinned Python test dependency, mirrors package.json's pinning style for the JS side)"
  patterns:
    - "Same brace-depth-tracking technique now used in three independent places in this codebase: build.py's check_duplicate_functions() (source pre-check), build()'s post-build validator (bundle backstop), and tests/build/test_build_deduplication.py's test_build_generates_valid_javascript (independent CI-facing regression test) — three layers, one shared, proven detection idiom"
    - "Major-tag-only Action pinning (@vN, no SHA), verified against gh api repos/actions/<name>/releases/latest at execution time rather than trusting a research document's snapshot"

key-files:
  created:
    - requirements-dev.txt
  modified:
    - .github/workflows/ci.yml
    - tests/build/test_build_deduplication.py
    - .planning/phases/11-architektur-build-hygiene/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "requirements-dev.txt chosen over inline `pip install pytest` in the workflow step (11-RESEARCH.md Open Question 1) — reproducible, consistent with the project's package.json pinning style, natural home for future Python test deps"
  - "pytest version pinned to the locally-verified 9.0.3 (re-checked via `python -m pytest --version` at execution time), not blindly copied from 11-RESEARCH.md's snapshot — matches, but was independently re-verified per the plan's explicit instruction"
  - "Blocking precondition (WINDOWS.md entry 2, test_build_generates_valid_javascript false positive) fixed as a prerequisite commit before the CI-gate wiring, not worked around — a CI gate that starts red on green code teaches the team to ignore it; the fix reuses build.py's own proven brace-depth technique rather than inventing a new detection scheme"
  - "Action version bumps use major-tag-only pinning (@v7, not @v7.0.1) per the plan's explicit 'ausschliesslich Major-Tags in der Form @vN, kein SHA-Pinning' instruction — an initial draft accidentally used full semver tags and was corrected before verification/commit"
  - "Two of D-09's negative acceptance-criteria checks (persist-credentials on checkout, non-additive artifact handling on upload/download-artifact) evaluated as not applicable to this workflow — no job pushes back to the repo (deploy uses actions/deploy-pages + id-token, not the checkout token), and build/smoke-test each handle exactly one named artifact, never appending to an existing one"

requirements-completed: [ARCH-01, ARCH-02, ARCH-03]

coverage:
  - id: D1
    description: "The CI test-job runs `python -m pytest tests/build/` against a freshly built bundle (python build.py runs first) — a red build-gate test now fails the CI test job (D-03)"
    requirement: "ARCH-03"
    verification:
      - kind: unit
        ref: "grep -c 'pytest tests/build/' .github/workflows/ci.yml -> 1"
        status: pass
      - kind: other
        ref: "Local counter-probe: pip install -r requirements-dev.txt && PYTHONIOENCODING=utf-8 python build.py && python -m pytest tests/build/ -v -> exit 0, 23 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "pytest version is pinned in a versioned file (requirements-dev.txt), not installed unpinned inline in the workflow step"
    requirement: "ARCH-03"
    verification:
      - kind: unit
        ref: "grep -c '^pytest==' requirements-dev.txt -> 1; grep -c 'requirements-dev.txt' .github/workflows/ci.yml -> 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "node-version is '22' at all six actions/setup-node steps in ci.yml; no '20' remains"
    requirement: "ARCH-03"
    verification:
      - kind: unit
        ref: "python -c \"...node22== 6, node20==0...\" -> exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "No actions/* reference in ci.yml remains on its pre-plan major; all eight are on the execution-time-verified current major (checkout v7, setup-node v7, setup-python v7, upload-artifact v7, download-artifact v8, configure-pages v6, upload-pages-artifact v5, deploy-pages v5)"
    requirement: "ARCH-03"
    verification:
      - kind: unit
        ref: "grep -cE 'uses: actions/(checkout|setup-node|upload-artifact|download-artifact|deploy-pages|upload-pages-artifact)@v4' ci.yml -> 0; grep -cE 'uses: actions/(setup-python|configure-pages)@v5' ci.yml -> 0"
        status: pass
      - kind: other
        ref: "gh api repos/actions/<name>/releases/latest --jq .tag_name for all eight repos, cross-checked against ci.yml's uses: lines (see Action Version Table below)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The blocking e2e job (Phase 8 D-03) and the needs-chains of all six jobs are unchanged; the deploy job's if-condition (WR-07) is unchanged"
    requirement: "ARCH-03"
    verification:
      - kind: unit
        ref: "grep -c 'needs: \\[lint-and-typecheck, test\\]' ci.yml -> 1; grep -c 'needs: \\[lint-and-typecheck, test, e2e\\]' ci.yml -> 1; grep -c 'npx playwright test$' ci.yml -> 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "YAML is parsable after both tasks' edits"
    requirement: "ARCH-03"
    verification:
      - kind: unit
        ref: "python -c \"import yaml; yaml.safe_load(open('.github/workflows/ci.yml', encoding='utf-8'))\" -> exit 0"
        status: pass
    human_judgment: false
  - id: D7
    description: "Blocking precondition: the pre-existing test_build_generates_valid_javascript false positive (WINDOWS.md entry 2) is fixed, not worked around, before the CI-gate wiring is committed — the full tests/build/ suite exits 0"
    requirement: "ARCH-01, ARCH-02"
    verification:
      - kind: unit
        ref: "python -m pytest tests/build/ -v -> 23 passed (was 22 passed, 1 failed before this plan)"
        status: pass
      - kind: other
        ref: "Regression check: synthetic top-level `var X` redeclaration is still caught by the rewritten heuristic; synthetic function-scoped `var el` in two separate closures is correctly not flagged"
        status: pass
    human_judgment: false
  - id: D8
    description: "Dev and production builds remain behavior-neutral; full Jest suite unaffected by this plan's changes"
    requirement: "ARCH-01, ARCH-02, ARCH-03"
    verification:
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py (dev) and --production both exit 0"
        status: pass
      - kind: unit
        ref: "npm test (Jest) — 621/621 passed"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-07-25
status: complete
---

# Phase 11 Plan 4: CI Build-Gate Wiring and Action/Node-Version Hygiene Summary

**`tests/build/` is now a real CI gate (D-03) — the CI `test`-job builds the bundle and runs `pytest tests/build/` against it via a newly pinned `requirements-dev.txt`; separately, `node-version` moves to `'22'` and all eight referenced GitHub Actions move to their execution-time-verified current major (D-09), closing the last open Phase-11 pytest false positive along the way.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-25T20:50:00Z (approx.)
- **Completed:** 2026-07-25T21:15:00Z (approx.)
- **Tasks:** 2 (plus one blocking-precondition fix ahead of Task 1)
- **Files modified:** 5 (`requirements-dev.txt` created; `.github/workflows/ci.yml`, `tests/build/test_build_deduplication.py`, `deferred-items.md`, `WINDOWS.md` modified)

## Accomplishments

- **Blocking precondition resolved:** `test_build_generates_valid_javascript`'s duplicate-declaration scan was rewritten to use the same brace-depth-tracking technique already proven in `build.py`'s `check_duplicate_functions()` and the post-build validator inside `build()` — declarations are now matched only at depth 0 *within the `<script>` block*, so `features/bestiary/bestiary-editor.js`'s two independently-scoped `var el` declarations are no longer flagged as top-level duplicates. `python -m pytest tests/build/` moved from `22 passed, 1 failed` to `23 passed`. `.planning/WINDOWS.md` entry id 2 is now `fixed`.
- **Task 1 (D-03):** `requirements-dev.txt` created (`pytest==9.0.3`, pinned). CI `test`-job extended with `actions/setup-python`, `pip install -r requirements-dev.txt`, `python build.py`, `python -m pytest tests/build/ -v` — the Phase-11 build-gate tests now run in CI against a freshly built bundle, not just locally.
- **Task 2 (D-09):** All six `node-version` occurrences bumped `'20'` → `'22'`, with a two-part YAML comment above the first occurrence explicitly separating the Node-EOL reason from the (unrelated) Actions-deprecation reason. All eight `actions/*` references bumped to their execution-time-verified current major via `gh api repos/actions/<name>/releases/latest`, confirming 11-RESEARCH.md's snapshot was still accurate on the day of execution (see table below). Breaking-change relevance was checked and found not applicable for both flagged candidates (`checkout`'s `persist-credentials` default, `upload-artifact`/`download-artifact`'s non-additive handling change).
- Full local verification suite green after every change: `python -m pytest tests/build/ -v` (23/23), dev + production `python build.py` (both exit 0), `npm test` (Jest 621/621), YAML parse check (exit 0).

## Task Commits

1. **Blocking-precondition fix (ahead of Task 1):** `cff60bc` (fix) — brace-depth-aware duplicate scan in `test_build_generates_valid_javascript`; `deferred-items.md` and `WINDOWS.md` updated to reflect closure
2. **Task 1: `tests/build/` wird echtes CI-Gate (D-03)** — `0f4f4af` (feat) — `requirements-dev.txt` created, `test`-job in `ci.yml` extended with `setup-python`/`pip install`/`build.py`/`pytest`
3. **Task 2: Node-Version und Action-Majors anheben (D-09)** — `2dc5cc1` (feat) — six `node-version` bumps to `'22'`, eight `actions/*` major bumps, two-part reasoning comment

_Note: Task 1 and Task 2 are both `type="auto"`, not TDD — pure config/CI-wiring changes with `<automated>` verify blocks, consistent with their plan spec._

## Files Created/Modified

- `requirements-dev.txt` — New file; pins `pytest==9.0.3` for `tests/build/`, referenced by both the CI `test`-job and local `pip install -r requirements-dev.txt` runs.
- `.github/workflows/ci.yml` — `test`-job gains `actions/setup-python@v7`, `pip install -r requirements-dev.txt`, `python build.py`, `python -m pytest tests/build/ -v`. All six `node-version` values `'20'` → `'22'`, with a two-part explanatory comment above the first occurrence. All eight `actions/*` references bumped to their current major (`checkout`/`setup-node`/`setup-python`/`upload-artifact` → `v7`; `download-artifact` → `v8`; `configure-pages` → `v6`; `upload-pages-artifact`/`deploy-pages` → `v5`). `needs`-chains, the blocking `e2e` job, `smoke-test`'s `SMOKE_BASE_URL`, and `deploy`'s `if`-condition (WR-07) untouched.
- `tests/build/test_build_deduplication.py` — `test_build_generates_valid_javascript`'s duplicate-declaration scan rewritten: now extracts the `<script>` block first (matching the post-build validator's approach) and tracks brace depth, matching `var|const|let` declarations only at depth 0. Fixes the pre-existing false positive on `bestiary-editor.js`'s two independently-scoped `var el` declarations.
- `.planning/phases/11-architektur-build-hygiene/deferred-items.md` — New `## 11-04 — Fixed` section documenting the closure of the false positive, with the regression checks performed.
- `.planning/WINDOWS.md` — Entry id 2 marked `fixed` (`open_count: 0`, `fixed_count: 2`).

## Decisions Made

- `requirements-dev.txt` over inline `pip install pytest` (11-RESEARCH.md Open Question 1) — reproducible, matches the project's `package.json`-pinning convention, a natural home for future Python test deps.
- pytest version re-verified locally (`python -m pytest --version` → `9.0.3`) at execution time rather than trusting 11-RESEARCH.md's snapshot value blindly — the plan explicitly required this, and both values happened to match.
- The blocking precondition (pre-existing `test_build_generates_valid_javascript` false positive) was fixed as a prerequisite commit rather than worked around (`xfail`, skip) — a CI gate that is red on day one on unrelated, already-green code teaches the team to ignore it, and the plan's own instruction ranked "fix the test's heuristic, reusing `check_duplicate_functions()`'s brace-depth technique" as the first-preference option.
- Action version bumps use major-tag-only pinning (`@v7`, not full semver `@v7.0.1`) — the plan's `<action>` text is explicit ("ausschliesslich Major-Tags in der Form `@vN`, kein SHA-Pinning"); an initial edit accidentally used full semver tags for two of the six jobs and was corrected in the same editing pass before running any verification or committing.
- `actions/checkout`'s `persist-credentials` default-behavior change and `actions/upload-artifact`/`download-artifact`'s non-additive artifact-handling change were both evaluated per-job and found not applicable to this workflow (no job pushes back to the repo; `build`/`smoke-test` each handle exactly one named artifact) — documented inline in the Task 2 commit message rather than silently assumed safe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Blocking precondition, orchestrator-mandated] Fixed pre-existing `test_build_generates_valid_javascript` false positive before committing the CI-gate wiring**
- **Found during:** Pre-execution review of the blocking precondition supplied by the orchestrator (verified independently: `python -m pytest tests/build/ -q` showed `22 passed, 1 failed` before any change in this plan)
- **Issue:** The test's naive text-based duplicate-declaration scan (no brace-depth awareness) flagged `features/bestiary/bestiary-editor.js`'s two independently-scoped `var el` declarations as a top-level duplicate — a false positive pre-dating Phase 11 (confirmed by Plans 11-01/11-02/11-03, each of which reconfirmed and deferred it).
- **Fix:** Rewrote the test to extract the `<script>` block and track brace depth, matching declarations only at depth 0 — identical technique to `build.py`'s `check_duplicate_functions()` and the post-build validator inside `build()`.
- **Files modified:** `tests/build/test_build_deduplication.py`, `.planning/phases/11-architektur-build-hygiene/deferred-items.md`, `.planning/WINDOWS.md`
- **Commit:** `cff60bc`
- **Why this is in scope for 11-04 (not a Scope Boundary violation):** the orchestrator prompt made this an explicit hard precondition for this plan's own deliverable — wiring a red gate into CI is not a working gate. The fix reuses existing, already-reviewed logic; it does not introduce new detection logic.

### Plan acceptance-criteria correction (not a code deviation)

**2. [Plan-text factual inaccuracy, not a code issue] `actions/setup-python` occurrence count**
- **Found during:** Task 1 acceptance-criteria verification
- **Issue:** The plan's acceptance criteria states `grep -c "actions/setup-python" .github/workflows/ci.yml` should return `4` ("bisher drei Vorkommen in `e2e`, `build`, `deploy`, plus das neue im `test`-Job"). The actual pre-plan `ci.yml` had **four** pre-existing `actions/setup-python@v5` occurrences (`e2e`, `build`, `smoke-test`, `deploy`) — the plan's count omitted the `smoke-test` job, which already used `actions/setup-python@v5` before this plan touched anything (visible in the `<files_to_read>` `ci.yml` at lines 94-96 of the pre-plan file). After Task 1 adds the new occurrence to the `test`-job, the correct count is `5`, not `4`.
- **Resolution:** No code change needed — the `<action>` instruction itself ("neu, exakt die Form, die der `e2e`-Job … bereits verwendet") was followed correctly and produces the intended behavior. This is purely a miscounted expectation in the plan's acceptance-criteria text, verified by re-reading the pre-plan `ci.yml` (`smoke-test` job, lines 94-96 in the version read at execution start).
- **Not classified as a Rule 1-4 deviation:** no production code or config needed fixing — the implementation matches the plan's `<action>` prose exactly; only the plan's own literal grep-count expectation was off by one.

---

**Total deviations:** 1 orchestrator-mandated blocking-precondition fix (auto-fixed, in scope per explicit instruction); 1 documented plan-text acceptance-criteria discrepancy (no code change required)
**Impact on plan:** None on the delivered outcome — both tasks' substantive acceptance criteria (pytest wiring, six `node-version` values, eight Action majors, needs-chains/e2e-job/deploy-if unchanged, YAML parsability) are fully met. The one criterion with an incorrect literal expected value (`setup-python` count `4` vs. actual-correct `5`) does not indicate a wiring defect.

## Issues Encountered

None beyond the two items documented above (the mandated blocking-precondition fix, and the plan-text count correction). All local verification commands from both tasks' `<verify>`/`<acceptance_criteria>` blocks ran clean.

## User Setup Required

None — no external service configuration required. `gh auth status` was already authenticated in this environment (used read-only for `gh api repos/actions/*/releases/latest`, no repo mutation).

## Action Version Table (D-09, Task 2)

| Repo | Vor Plan (Ist) | Ermittelter Ziel-Major | Neueste Release (verifiziert via `gh api`) | Abfragedatum |
|------|-----------------|--------------------------|-----------------------------------------------|----------------|
| `actions/checkout` | `@v4` | `@v7` | `v7.0.1` (2026-07-20) | 2026-07-25 |
| `actions/setup-node` | `@v4` | `@v7` | `v7.0.0` (2026-07-14) | 2026-07-25 |
| `actions/setup-python` | `@v5` | `@v7` | `v7.0.0` (2026-07-20) | 2026-07-25 |
| `actions/upload-artifact` | `@v4` | `@v7` | `v7.0.1` (2026-04-10) | 2026-07-25 |
| `actions/download-artifact` | `@v4` | `@v8` | `v8.0.1` (2026-03-11) | 2026-07-25 |
| `actions/configure-pages` | `@v5` | `@v6` | `v6.0.0` (2026-03-25) | 2026-07-25 |
| `actions/upload-pages-artifact` | `@v4` | `@v5` | `v5.0.0` (2026-04-10) | 2026-07-25 |
| `actions/deploy-pages` | `@v4` | `@v5` | `v5.0.0` (2026-03-25) | 2026-07-25 |

These values match 11-RESEARCH.md's snapshot table exactly (re-verified independently via `gh api`, not copied without checking) — the research's own caveat that the ecosystem could have moved by execution time did not materialize in this case.

## Next Phase Readiness

- ARCH-03's CI half is complete: `tests/build/` (23 tests, including 11-01/11-02/11-03's SSoT/dedup coverage) now runs in the CI `test`-job against a freshly built bundle, and all eight referenced Actions plus Node itself are on current, non-deprecated versions.
- **Phase-level verification remains outstanding** (per the plan's own `<verification>` section, "nicht lokal simulierbar"): after this plan's commits are pushed, the Actions tab must be checked for the actual disappearance of the "Node.js 20 actions are deprecated" job annotation. This is explicitly a phase-gate check, not a task-level one — no local mechanism can observe GitHub's own runner-side job annotations.
- `.planning/WINDOWS.md` is now fully clear (`open_count: 0`) — the only entry from Phase 11 (the `test_build_generates_valid_javascript` false positive) is closed. `/gsd-ship`'s ledger gate is unblocked with respect to Phase 11's own findings.
- Remaining Phase 11 scope (ARCH-03's favicon/meta-tag/smoke-test-assertion half — D-10/D-11/D-12 — and ARCH-04's codebase-map/CONCERNS-triage — D-13 through D-16) is unaffected by this plan and lives in later Phase-11 plans per the roadmap.

---
*Phase: 11-architektur-build-hygiene*
*Completed: 2026-07-25*

## Self-Check: PASSED

All created/modified files verified present on disk (`requirements-dev.txt`, `.github/workflows/ci.yml`, `tests/build/test_build_deduplication.py`, `deferred-items.md`, `WINDOWS.md`); all 3 commits (`cff60bc`, `0f4f4af`, `2dc5cc1`) verified present in `git log`.
