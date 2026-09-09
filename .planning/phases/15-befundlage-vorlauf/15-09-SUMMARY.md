---
phase: 15-befundlage-vorlauf
plan: 09
subsystem: css-testing
tags: [css, dead-code-detection, tdd, ratchet, css-usage-report]

# Dependency graph
requires:
  - phase: 15-07
    provides: "tools/css-usage-report.js (three-tier live detection, --check/--json), the 20-commit deletion run, and the documented --check residual (204 dead class names outside DEAD_EXCEPTIONS) that this plan closes two real deletions out of"
  - phase: 15-08
    provides: "15-RATCHET-BASELINE.md as the phase's single measurement protocol (Messblock 6 held the 204 baseline this plan re-measures)"
provides:
  - "collectLiveTokens() extended with three mechanical class-context recognizers (CLASS_NAME_ASSIGN_STMT_RE, CLASS_KEY_ASSIGN_RE, scanBalancedCallArgs), proven by four red-green test cases (CR-01a/b/c, WR-01)"
  - "Two real deletion regressions from Plan 15-07 reversed: .npc-grid (assets/styles/npcs.css) and .list-view-container (assets/styles/encounters.css), restored verbatim from commit 4faca38"
  - "A freshly measured post-fix dead-class count (199, down from 204), never carried forward from the plan's own 199-simulation"
  - "The CR-01 finding recorded as its own WINDOWS.md ledger entry (id 6, fixed), separate from the pre-existing id-5 unmet-truth entry, whose number was updated in both the table row and JSON object"
  - "Two deferred residuals (WR-02 duplicate function, the structural JS-parser-free detection limit) recorded in a new deferred-items.md section"
affects: ["16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 6280
  tasks: 3
  commits: 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "scanBalancedSegment(text, startIndex, terminators): a generic quote-aware, bracket-depth-tracking scanner shared by three new recognizers (statement-wide .className= reads, object-key value reads, and classList.*() argument reads) — one implementation instead of three near-duplicate hand-rolled loops, mirroring the existing scanClassContextValue()'s ${...}-skipping technique but generalized to arbitrary terminator characters and full quote-skipping (not just the interpolation case)."

key-files:
  created: []
  modified:
    - tools/css-usage-report.js
    - tests/unit/css-usage-report.test.js
    - assets/styles/npcs.css
    - assets/styles/encounters.css
    - .planning/WINDOWS.md
    - .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md
    - .planning/phases/15-befundlage-vorlauf/deferred-items.md

key-decisions:
  - "The four new test cases' source-code comments originally quoted the literal paths 'ui/dom-builder.js' and 'ui/safe-render.js' as provenance for the fixture patterns. tests/unit/module-test-coverage.test.js's ratchet test flags any MODULE_TEST_EXCEPTIONS entry whose loader.js-relative path appears verbatim anywhere under tests/ — my own documentation comment tripped it, incorrectly marking two genuinely-untested modules as 'covered'. Fixed by splitting the path across two words in the comment (Rule 1 bug, found during Task 2/3's full-suite run, not part of the plan's own acceptance criteria but a real regression this plan's own Task 1 introduced)."
  - "scanBalancedSegment() was written as ONE shared, quote-aware, bracket-depth-tracking function rather than three separate scanners for the statement-wide .className= read, the object-key value read, and the classList.*() call-argument read (scanBalancedCallArgs is a one-line wrapper around it). This keeps the three new recognition paths provably identical in their handling of nested parens/brackets/quotes rather than risking three subtly different regex-exclusion heuristics."
  - "DEAD_EXCEPTIONS and LIVE_PREFIXES were left untouched at exactly five entries each, per the plan's explicit DEAD-02 prohibition against closing a mechanically-closable detection gap via the exception list instead of a rule. All three new recognizers are construction-shape rules (a statement pattern, a key-name pattern, a bracket-depth reader), never an enumeration of concrete class names."
  - "The .npc-grid and .list-view-container CSS blocks were restored character-for-character from commit 4faca38 (npcs.css lines 1354-1360, encounters.css lines 138-143) with project-standard 8-space indentation and their original section-heading comments — nothing else from that historical commit (e.g. the since-legitimately-deleted .npc-list-card/.list-view-row siblings) was reintroduced."

requirements-completed: [DEAD-01, DEAD-02, GATE-03]

coverage:
  - id: D1
    description: "Four red-then-green test cases proving the CR-01/WR-01 blind spot existed and is now closed: CR-01a (.className= ternary statement), CR-01b (containerClass: object-key ternary), CR-01c (className: object-key literal), WR-01 (classList.toggle() with a parenthesized expression before the class literal)"
    requirement: "GATE-03"
    verification:
      - kind: unit
        ref: "tests/unit/css-usage-report.test.js — RED at Task 1 (4 failed, 23 passed, 27 total, exit 1), GREEN after Task 2 (27 passed, 27 total, exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "collectLiveTokens() mechanically extended with CLASS_NAME_ASSIGN_STMT_RE, CLASS_KEY_ASSIGN_RE, and scanBalancedCallArgs() (replacing CLASS_LIST_CALL_RE's bracket-exclusion regex) — DEAD_EXCEPTIONS and LIVE_PREFIXES both unchanged at five entries"
    requirement: "DEAD-02"
    verification:
      - kind: unit
        ref: "tests/unit/css-usage-report.test.js (27/27); full npx jest (1247/1247, up from the 1243 baseline + 4 new cases)"
        status: pass
      - kind: other
        ref: "node -e \"require('./tools/css-usage-report.js')\" — DEAD_EXCEPTIONS.length===5, LIVE_PREFIXES.length===5; grep -c \"require(\" tools/css-usage-report.js == 2 (fs, path only)"
        status: pass
    human_judgment: false
  - id: D3
    description: "npc-grid and list-view-container restored from commit 4faca38 and immediately recognized as live by the extended tool; checkFailures.length freshly measured at 199 (down from 204), byte-identical across two consecutive runs"
    requirement: "DEAD-01"
    verification:
      - kind: other
        ref: "node tools/css-usage-report.js --json: checkFailures excludes npc-grid/list-view-container; two consecutive runs diff byte-identical; checkFailures.length === 199"
        status: pass
      - kind: unit
        ref: "full npx jest (1247/1247)"
        status: pass
      - kind: e2e
        ref: "npx playwright test --reporter=list (364 passed / 2 skipped)"
        status: pass
      - kind: other
        ref: "pytest tests/build -q (24/24); python build.py and python build.py --production (both exit 0, no [FEHLER]/[ABORTED])"
        status: pass
    human_judgment: false
  - id: D4
    description: "CR-01 recorded as its own WINDOWS.md ledger entry (id 6, kind deviation, status fixed), separate from the pre-existing id-5 unmet-truth entry, whose dead-class count was updated to the freshly measured 199 in both the table row and JSON object; 15-RATCHET-BASELINE.md Messblock 8 records the full red/green protocol; deferred-items.md records the two residuals not addressed by this plan"
    requirement: "DEAD-01"
    verification:
      - kind: other
        ref: "grep -c collectLiveTokens .planning/WINDOWS.md == 2; grep -cE '^(open_count: 3|fixed_count: 3|total_count: 6)$' .planning/WINDOWS.md == 3; grep -c '^## Messblock 8' 15-RATCHET-BASELINE.md == 1; grep -c '^## Deferred Items' deferred-items.md == 1, grep -c Status:.*open == 2"
        status: pass
    human_judgment: false

# Metrics
duration: ~45min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 09: CR-01/WR-01 Blind-Spot Fix Summary

**Extended `collectLiveTokens()` with three mechanical class-context recognizers (statement-wide `.className=` ternaries, `className:`/`containerClass:` object keys, and bracket-depth-aware `classList.*()` argument reading), proven by four red-green test cases, then restored the two CSS rule blocks (`.npc-grid`, `.list-view-container`) that Plan 15-07 had wrongly deleted because of this exact blind spot — dead-class count freshly measured at 199 (down from 204).**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-09-09
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Task 1: Four new test cases appended to `tests/unit/css-usage-report.test.js` (23 → 27), each reproducing a real source-tree construction the tool's detector missed: `CR-01a` (`.className = bedingung ? 'alpha' : 'beta';`, matching `ui/dom-builder.js:393`), `CR-01b` (`containerClass: bedingung ? 'alpha' : 'beta'`, matching `ui/safe-render.js:360`), `CR-01c` (`className: 'alpha'` object key), and `WR-01` (`classList.toggle(berechneName(x), 'alpha')`, a parenthesized call before the class literal). Confirmed RED against the unmodified tool: **4 failed, 23 passed, 27 total, exit code 1** — the exact four new cases failed, all 23 pre-existing cases stayed green.
- Task 2: `tools/css-usage-report.js`'s `collectLiveTokens()` extended with three mechanical rules: `CLASS_NAME_ASSIGN_STMT_RE` (reads the full statement after `.className=`/`.className+=` up to the next semicolon/newline via a new shared `scanBalancedSegment()` helper, collecting every quoted literal inside — catches ternaries and concatenations); `CLASS_KEY_ASSIGN_RE` (word-bounded `className`/`containerClass` object keys, value read to the next top-level comma/closing brace/newline); and `scanBalancedCallArgs()` (bracket-depth-tracked replacement for `CLASS_LIST_CALL_RE`'s old `[^)]*` exclusion-class argument capture, so a parenthesized expression before a class-literal argument no longer truncates the scan). Confirmed GREEN: **27 passed, 27 total, exit code 0**. `DEAD_EXCEPTIONS` and `LIVE_PREFIXES` both left untouched at exactly five entries each (DEAD-02 prohibition honored — no exception-list shortcut for a mechanically closable gap). `node tools/css-usage-report.js --json`: `checkFailures.length` dropped from 204 to 199, confirmed byte-identical across two consecutive runs. `npm run lint` verified identical (5 pre-existing errors / 371 warnings, entirely in an unrelated file under `Anpassungen/`) both before and after this change via a direct comparison run — this task introduced zero new lint findings.
- Task 3: `.npc-grid` (`assets/styles/npcs.css`, behind `.npc-popup-footer`) and `.list-view-container` (`assets/styles/encounters.css`, behind `.view-mode-btn.active`) restored character-for-character from commit `4faca38`, with project-standard 8-space indentation and their original section-heading comments. Both are immediately recognized as live by the extended tool — neither appears in `checkFailures` at any point in this session. `15-RATCHET-BASELINE.md` gained `## Messblock 8` with the full red/green protocol and the 204→199 before/after table, naming the five classes freed (`location`, `negative`, `npc`, `npc-grid`, `positive`) — three of the five (`location`, `negative`, `npc`) are side effects of the same detection extension acting on unrelated, independent `.className=` ternaries elsewhere in the tree, not restorations. `.planning/WINDOWS.md` entry 5's dead-class count was updated to 199 identically in both the table row and JSON object (drift-guard-verified via `gsd-tools windows status`), and a new entry 6 (`kind: deviation`, `CR-01`) was appended documenting cause/effect/remedy, then marked `fixed` (`open_count: 3`, `fixed_count: 3`, `total_count: 6`). `deferred-items.md` gained a `## Deferred Items` section with two entries: the pre-existing `renderCompactSpellSlots()`/`renderSpellSlotPips()` duplication (WR-02, out of this plan's file scope) and the structural, un-mechanizable limit of a JS-parser-free text check (the five Read-Aloud `DEAD_EXCEPTIONS` entries as its current manifestation).
- Full suites confirmed green after all changes: `npx jest` **1247/1247** (54 suites, up from the 1243 baseline plus the 4 new CR-01/WR-01 cases), `npx playwright test --reporter=list` **364 passed / 2 skipped**, `pytest tests/build -q` **24/24**, `python build.py` and `python build.py --production` both exit 0 with no `[FEHLER]`/`[ABORTED]`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Four red test cases for the CR-01/WR-01 blind spot** — `d7a0ef0` (test)
2. **Task 2: Extend `collectLiveTokens()` and close the bracket gap** — `30b39f9` (feat)
3. **Deviation fix: test-comment literal path tripping an unrelated ratchet test** — `462529b` (fix)
4. **Task 3a: Restore `.npc-grid`/`.list-view-container` from `4faca38`** — `925d4ec` (fix)
5. **Task 3b: Messblock 8, WINDOWS.md entry 6, deferred-items.md** — `78273d8` (docs)

**Plan metadata:** committed after this SUMMARY (STATE.md/ROADMAP.md/REQUIREMENTS.md)

_Note: Commit 3 (`462529b`) was not part of the plan's own task list — it is a Rule 1 auto-fix for a regression Task 1 itself introduced, discovered during Task 2/3's full-suite run (see Deviations below)._

## Files Created/Modified

- `tests/unit/css-usage-report.test.js` — four new test cases (23 → 27), `CR-01/WR-01` describe block
- `tools/css-usage-report.js` — `CLASS_NAME_ASSIGN_STMT_RE`, `CLASS_KEY_ASSIGN_RE`, `scanBalancedSegment()`, `scanBalancedCallArgs()` added; `CLASS_LIST_CALL_RE` narrowed to the call opening only; header comment extended; three new symbols exported individually
- `assets/styles/npcs.css` — `.npc-grid` rule block restored
- `assets/styles/encounters.css` — `.list-view-container` rule block restored
- `.planning/WINDOWS.md` — entry 5 dead-class count updated (204→199) in both representations; new entry 6 (CR-01, fixed) added
- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` — `## Messblock 8` added
- `.planning/phases/15-befundlage-vorlauf/deferred-items.md` — `## Deferred Items` section with two entries added

## Decisions Made

See `key-decisions` in the frontmatter. Core points: `scanBalancedSegment()` as one shared quote-aware/bracket-depth scanner instead of three near-duplicate readers; `DEAD_EXCEPTIONS`/`LIVE_PREFIXES` left untouched at five entries each per the DEAD-02 prohibition; the two CSS blocks restored verbatim from `4faca38` with nothing else from that commit reintroduced; and the mid-execution fix to the test file's own provenance comments so they would not accidentally satisfy an unrelated module-coverage ratchet test.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test-provenance comments in Task 1 accidentally "covered" two unrelated `MODULE_TEST_EXCEPTIONS` entries**
- **Found during:** Full `npx jest` run after Task 2 (not part of this plan's own acceptance criteria — surfaced only because the plan's success criteria required the full suite green)
- **Issue:** The CR-01a/CR-01b test cases' explanatory comments quoted the literal strings `ui/dom-builder.js` and `ui/safe-render.js` as provenance for the fixture patterns. `tests/unit/module-test-coverage.test.js`'s ratchet test (`kein Eintrag der Ausnahmeliste ist inzwischen abgedeckt`) flags any `MODULE_TEST_EXCEPTIONS` entry whose `loader.js`-relative path appears verbatim anywhere under `tests/`, regardless of purpose — my own documentation comment satisfied that naive substring check for two genuinely still-untested modules (`ui/dom-builder.js`, `ui/safe-render.js`), which would have silently and incorrectly required removing them from the exception list.
- **Fix:** Split the path across two words in each comment (`dom-builder.js (im ui/-Verzeichnis)` / `safe-render.js (im ui/-Verzeichnis)`) — the provenance is still documented, but the literal substring `ui/dom-builder.js`/`ui/safe-render.js` no longer appears anywhere in the test file.
- **Files modified:** `tests/unit/css-usage-report.test.js`
- **Verification:** `npx jest tests/unit/module-test-coverage.test.js tests/unit/css-usage-report.test.js` (31/31 passed); full `npx jest` (1247/1247)
- **Committed in:** `462529b`

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug this plan's own Task 1 introduced, caught before the plan's own success criteria could be checked).
**Impact on plan:** Contained entirely within the one test file already in this plan's `files_modified`; no production code affected, no scope expansion.

## Issues Encountered

None beyond the deviation documented above. GATE-05 Stufe 3 (the human four-themes visual round) was explicitly **NOT performed** in this plan — it remains reserved for the phase-level UAT, per `workflow.human_verify_mode=end-of-phase` and this plan's own `<output>` instruction. All automatable prerequisites (both restored CSS blocks render via existing, unmodified selectors reused from the historical commit; both full suites and both builds green) are verified above.

## User Setup Required

None — no external service configuration needed.

## Next Phase Readiness

- The three mechanically closable class-context detection gaps identified by the Phase 15 code review (CR-01a, CR-01b/CR-01c, WR-01) are closed and proven by dedicated red-green tests; `tools/css-usage-report.js` — the instrument Phases 16-19 will rely on for further deletion waves — no longer has this specific blind spot.
- The two real deletion regressions from Plan 15-07 are reversed; both restored classes are recognized live by the tool itself, not merely re-added and left undetected again.
- The `--check` residual is smaller (199, down from 204) but **not zero** and **not claimed to be zero**: the remaining 199 are anchor-rule survivors in compound/comma selectors (documented unchanged since Plan 15-07/15-08), a structural limit recorded in `deferred-items.md` for Phases 16-19 to be aware of — not a gap this plan closes.
- GATE-05 Stufe 3 (human four-themes visual confirmation of the two restored CSS blocks) is deferred to the phase-level UAT, as instructed by this plan's own `<output>` requirement.

## Self-Check: PASSED

- FOUND: `tests/unit/css-usage-report.test.js` — 27 `test(` lines, 4 matching `CR-01a|CR-01b|CR-01c|WR-01:`
- FOUND: `tools/css-usage-report.js` — exports `CLASS_NAME_ASSIGN_STMT_RE`, `CLASS_KEY_ASSIGN_RE`, `scanBalancedCallArgs`; `DEAD_EXCEPTIONS.length===5`, `LIVE_PREFIXES.length===5`
- FOUND: `assets/styles/npcs.css` contains a standalone `.npc-grid { display: grid; ... }` block; `assets/styles/encounters.css` contains a standalone `.list-view-container { display: flex; ... }` block
- FOUND: `node tools/css-usage-report.js --json` — `checkFailures` excludes `npc-grid`/`list-view-container`; `checkFailures.length === 199`; two consecutive runs byte-identical
- FOUND: `.planning/WINDOWS.md` — `collectLiveTokens` appears twice (entry 6 table row + JSON); `open_count: 3`, `fixed_count: 3`, `total_count: 6`; `199 tote Klassennamen` appears exactly twice, identically
- FOUND: `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` — exactly one `## Messblock 8` line
- FOUND: `.planning/phases/15-befundlage-vorlauf/deferred-items.md` — one `## Deferred Items` line, two `- **Status:** open` lines
- FOUND: all 5 commits (`d7a0ef0`, `30b39f9`, `462529b`, `925d4ec`, `78273d8`) present in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green: `npx jest tests/unit/css-usage-report.test.js` (27/27), `node tools/css-usage-report.js --json` (checkFailures 199, byte-identical), `npx jest` (1247/1247), `npx playwright test --reporter=list` (364 passed/2 skipped), `pytest tests/build -q` (24/24), `python build.py` + `--production` (both clean)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
