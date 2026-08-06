---
phase: 11-architektur-build-hygiene
plan: 06
subsystem: docs-planning
tags: [concerns-triage, requirements, tech-debt, arch-04]

# Dependency graph
requires:
  - phase: 11-architektur-build-hygiene (plans 01-05)
    provides: "The concrete build/CI/console fixes (SSoT parsers, dedup rework, CI gate, favicon/meta-tag) this triage cites as live-code evidence for 'erledigt' dispositions"
provides:
  - "11-CONCERNS-TRIAGE.md — a disposition (erledigt/obsolet/akzeptiert/uebernommen) for every one of the 46 discrete CONCERNS.md entries, each backed by a live-code citation (file:line, phase/plan reference, or commit hash), never by the CONCERNS.md description alone"
  - "15 named DEBT-01..DEBT-15 requirements in REQUIREMENTS.md §v2, carrying forward every 'uebernommen' item with a back-reference to its CONCERNS.md/STATE.md origin and the triage document"
  - "A frozen historical record of the Phase-11 triage decisions, preserved before Plan 11-07's /gsd-map-codebase regenerates CONCERNS.md wholesale"
affects: [11-07-architektur-build-hygiene, gsd-ship (REQUIREMENTS.md ARCH-04 traceability)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Live-code-evidence-only disposition: every triage row cites file:line/phase-plan/commit against today's code, never 'per CONCERNS.md description' — mechanically enforced via a `grep -c \"laut CONCERNS\"` == 0 check"
    - "Cross-referencing IDs: a triage row disposed 'uebernommen' names its DEBT-NN ID; the REQUIREMENTS.md entry for that ID names its CONCERNS.md/STATE.md origin back — verified via set-equality of the two ID collections"

key-files:
  created:
    - .planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md
  modified:
    - .planning/REQUIREMENTS.md

key-decisions:
  - "22 of 46 CONCERNS.md entries were already resolved by earlier phases (Phase 1 stabilization, Phase 8 E2E hardening, Phase 10 security audit, Plans 11-01..11-05) without CONCERNS.md ever being updated — each verified independently against live code before disposing 'erledigt', not trusted from CONCERNS.md's own claims"
  - "4 supplementary items from STATE.md's 'Open TODOs' (Phase 10 residuals IN-01/WR-02/IN-02, plus the toast-race test gap) were added with their own DEBT-12..15 IDs even though they never appeared as discrete CONCERNS.md entries — kept explicitly outside the 46-count in a labelled appendix section so the count invariant stays verifiable"
  - "ARCH-04 was deliberately NOT marked complete in REQUIREMENTS.md's traceability table — this plan's own frontmatter/objective text scopes it as 'Erste Haelfte von ARCH-04' (triage only); the codebase-map refresh half is Plan 11-07's responsibility, which also declares ARCH-04 in its own frontmatter"
  - "DEBT-02 (stale CLAUDE.md/docs/bugfixes.md build-system documentation) is tracked as a named requirement even though Plan 11-07 of this same phase will resolve it — chosen over silently omitting it, since the triage's own completeness invariant (every uebernommen item gets an ID) should not have an unstated exception for 'will be fixed later this phase'"
  - "Tasks 1 and 2 were authored together in a single Write pass (both build the identical 11-CONCERNS-TRIAGE.md file) and committed together — the plan's own two-task split exists for content-scoping, not for producing two independently committable artifacts"

patterns-established:
  - "Pattern: any future CONCERNS.md-style audit-and-carry-forward exercise should structure supplementary non-audit-document items (like the STATE.md-sourced DEBT-12..15 here) as a separately labelled section using non-pipe-table markup, so automated row-counting scripts scoped to the primary audit table are not polluted by summary/appendix tables"

requirements-completed: []
# ARCH-04 intentionally NOT listed here — see key-decisions above. This plan
# completes the triage half only; Plan 11-07 completes the map-refresh half
# and is the correct point to mark ARCH-04 complete in REQUIREMENTS.md.

coverage:
  - id: D1
    description: "Every one of the 46 discrete CONCERNS.md entries has exactly one of four dispositions (erledigt/obsolet/akzeptiert/uebernommen), each backed by a live-code citation rather than the CONCERNS.md description (D-13/D-15)"
    requirement: "ARCH-04"
    verification:
      - kind: unit
        ref: "python -c \"...row/bad count check...\" against 11-CONCERNS-TRIAGE.md -> rows=50 (46 main + 4 STATE.md supplement), bad=0"
        status: pass
      - kind: other
        ref: "grep -c \"laut CONCERNS\" 11-CONCERNS-TRIAGE.md -> 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every CONCERNS.md entry disposed 'uebernommen' (15 total, 11 from CONCERNS.md + 4 from STATE.md) is carried into REQUIREMENTS.md §v2 as a named DEBT-01..DEBT-15 requirement with a back-reference to its origin and the triage document (D-16)"
    requirement: "ARCH-04"
    verification:
      - kind: unit
        ref: "python -c \"...DEBT-ID set equality between REQUIREMENTS.md and 11-CONCERNS-TRIAGE.md...\" -> both sets identical, 15 IDs"
        status: pass
      - kind: unit
        ref: "git diff --stat .planning/REQUIREMENTS.md -> 22 insertions(+), 0 deletions"
        status: pass
    human_judgment: false
  - id: D3
    description: "No production code was changed by this plan — only .planning/ documentation artifacts; full Jest suite remains green"
    requirement: "ARCH-04"
    verification:
      - kind: unit
        ref: "git status --porcelain scoped to this plan's changes shows only .planning/ files; npm test -> 621/621 passed"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-07-26
status: complete
---

# Phase 11 Plan 6: CONCERNS.md Triage with Live-Code Evidence Summary

**Every one of the 46 discrete CONCERNS.md entries gets a disposition backed by an independently-verified live-code citation — 22 already resolved by earlier phases without CONCERNS.md knowing, 8 accepted risks tracing to Phase 10 D-08, 1 obsolete, and 15 carried into REQUIREMENTS.md as named DEBT-01..DEBT-15 requirements, none of them fixed in this phase.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-26
- **Tasks:** 3 (Task 1+2 authored together into one output file, Task 3 separate)
- **Files modified:** 2 (`11-CONCERNS-TRIAGE.md` created, `REQUIREMENTS.md` modified)

## Accomplishments

- `11-CONCERNS-TRIAGE.md` created: a disposition table for all 46 discrete CONCERNS.md entries (machine-counted per bold-header pattern, matches the plan's research expectation exactly — Tech Debt 13, Known Bugs 5, Security Considerations 4, Performance Bottlenecks 4, Fragile Areas 6, Scaling Limits 3, Dependencies at Risk 3, Missing Critical Features 3, Test Coverage Gaps 5), each row citing file:line, a phase/plan reference, or a commit hash against today's code — never the CONCERNS.md description itself
- Every CONCERNS.md-reported number was independently re-verified against the live codebase before use: the 92-module claim is now ~123 (per 11-01-SUMMARY.md's own build-time count), the "26 pre-existing E2E failures / 140 total" is now 621/621 Jest + 319 passed/2 skipped Playwright, "no automated dist smoke test" is false (the `smoke-test` CI job has run the production bundle in-browser since Phase 2), and several individually-checked claims (license, `python3` invocations, dead TS-migration files, Mindmap seed residue, hardcoded export version stamp, Service-Worker cache duplication) turned out to already be fixed by Phase 1/8/10/11-01..05 without CONCERNS.md ever being updated
- 4 supplementary items sourced from `.planning/STATE.md`'s "Open TODOs" (Phase 10 residuals: the never-wired `hasHtmlTags` guard in `markdown-converter.js`, the duplicate `data-id` attribute in `wiki.js`, the un-escaped regex capture in `parseWikiLinks()`, and the toast-race test gap in `locations.spec.js`/`encounters.spec.js`) were added with their own DEBT-12..15 IDs, kept explicitly outside the 46-count in a labelled appendix
- `REQUIREMENTS.md` §v2 gained a new `### Technische Schulden (aus Phase-11-Triage)` subsection with all 15 DEBT- entries, each naming its CONCERNS.md/STATE.md origin section and pointing back to `11-CONCERNS-TRIAGE.md`; the triage document's own disposition column names the matching DEBT- ID, so the two documents point at each other in both directions
- No CONCERNS.md restposten was fixed in this plan (D-16 held) — the one apparent exception, DEBT-02 (stale `CLAUDE.md`/`docs/bugfixes.md` build-system documentation), is tracked as a requirement even though Plan 11-07 of this same phase resolves it, per this plan's own completeness invariant

## Task Commits

Tasks 1 and 2 both write the identical output file (`11-CONCERNS-TRIAGE.md`) and were authored together in a single pass rather than as two independently staged diffs — documented as a deviation below, not a rule violation (the task_commit_protocol commits "after each task completes"; since both tasks' sole artifact is the same file with no intermediate committable state, a single commit accurately represents the work).

1. **Task 1+2: Triage all 46 CONCERNS.md entries across all nine sections** - `7173551` (docs)
2. **Task 3: Move triaged restposten into REQUIREMENTS.md as DEBT-01..15** - `a0412df` (docs)

## Files Created/Modified

- `.planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md` - New file: header with the 46-entry count and disposition legend, nine per-section disposition tables (50 total rows: 46 CONCERNS.md-derived + 4 STATE.md-derived appendix rows), and a closing "Zusammenfassung" section with disposition counts and the full DEBT-ID-to-origin mapping
- `.planning/REQUIREMENTS.md` - Edit-only addition of a new `### Technische Schulden (aus Phase-11-Triage)` subsection under §v2 Requirements, immediately after the existing `SOUND-PT-01` entry and before `## Out of Scope`; 22 lines added, 0 removed anywhere else in the file

## Decisions Made

- 22 of 46 CONCERNS.md entries verified as already resolved by earlier phases — each independently checked against live code (not trusted from CONCERNS.md's own text), since D-15 explicitly required this given CONCERNS.md's demonstrated staleness (e.g., its own claim of "92 modules" vs. today's ~123)
- 4 STATE.md-sourced supplementary items (DEBT-12..15) added even though they were never discrete CONCERNS.md entries, per this plan's Task 3 instruction to cross-check STATE.md's known open residuals — presented in a separate, clearly-labelled appendix to avoid inflating the 46-count
- ARCH-04 deliberately left unmarked in REQUIREMENTS.md's traceability table (still "Pending") — this plan's own objective text scopes it as "Erste Haelfte von ARCH-04"; marking it complete now would misrepresent the still-pending codebase-map-refresh half that Plan 11-07 owns
- DEBT-02 (CLAUDE.md/docs staleness) is tracked as a named requirement despite being resolved within this same phase (Plan 11-07) — chosen for completeness-invariant consistency over a silent, undocumented exception
- Tasks 1 and 2 committed together as a single commit — both produce the same file with no independently-meaningful intermediate state

## Deviations from Plan

### Auto-fixed Issues

None — no bugs, missing critical functionality, or blocking issues were found; this is a pure documentation/triage plan with no production code touched.

### Process deviation (not a Rule 1-4 issue)

**1. [Process] Tasks 1 and 2 committed together instead of as two separate commits**
- **Found during:** Initial execution planning
- **Issue:** The plan structures Task 1 (Tech Debt/Known Bugs/Security/Performance sections) and Task 2 (Fragile Areas/Scaling/Dependencies/Missing Features/Test Coverage sections + Zusammenfassung) as separate `<task>` blocks, but both write to the identical single file (`11-CONCERNS-TRIAGE.md`) with the plan's own acceptance criteria for Task 1 checking a subset of the same file Task 2 completes.
- **Resolution:** Authored the complete file in one pass (more efficient given the cross-referencing needed between sections — e.g., DEBT-ID numbering runs continuously across both tasks' sections) and committed once. Both tasks' individual acceptance criteria (verified via the plan's own `<verify>` python scripts) pass against the final file.
- **Not classified as a Rule 1-4 deviation:** no code was affected; this is a commit-granularity choice, not a scope or correctness issue.

---

**Total deviations:** 0 auto-fixed; 1 documented process deviation (commit granularity, no impact on deliverable correctness)
**Impact on plan:** None on the delivered outcome — all three tasks' acceptance criteria (row counts, disposition/Beleg validity, `grep -c "laut CONCERNS"` = 0, DEBT-ID set equality, `git diff --stat` additions-only, `npm test` green) are met exactly as specified.

## Issues Encountered

The automated verify script's `bad`-row detector initially flagged 21 false positives when the "Zusammenfassung" section's summary tables (disposition counts, DEBT-ID-to-origin mapping) used the same pipe-table markup as the main triage rows — the script scans the whole file for any `|`-prefixed line, not just the primary table. Fixed by converting both summary tables to bullet-list markup (documented as a new pattern above for future similar audits). Re-ran the verify script after the fix: `rows=50, bad=0`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `11-CONCERNS-TRIAGE.md` is a frozen, committed historical record of every CONCERNS.md disposition decision as of this plan — ready for Plan 11-07 to cross-check its regenerated `CONCERNS.md` against it (must_have: "kein bereits dispositionierter Posten taucht unbemerkt wieder als offen auf")
- 15 named DEBT- requirements now exist in `REQUIREMENTS.md` §v2 for the next milestone's backlog triage, each traceable back to its CONCERNS.md/STATE.md origin and this triage document
- ARCH-04 remains "Pending" in the traceability table by design — Plan 11-07 (which declares `requirements: [ARCH-02, ARCH-04]` in its own frontmatter) is the correct point to mark it complete, once the `.planning/codebase/` map refresh (D-14) lands alongside the CLAUDE.md/docs catch-up (D-08)
- No blockers for Plan 11-07; this plan's git history is clean (`git status --porcelain` shows no residual changes from this plan's work; the pre-existing, not-mine `.claude/launch.json` modification and untracked `Ablage/` directory were left untouched throughout)

---
*Phase: 11-architektur-build-hygiene*
*Completed: 2026-07-26*

## Self-Check: PASSED

All created/modified files verified present on disk (`11-CONCERNS-TRIAGE.md`, `REQUIREMENTS.md`); both commits (`7173551`, `a0412df`) verified present in `git log`.
