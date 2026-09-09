---
phase: 15-befundlage-vorlauf
plan: 07
subsystem: css-testing
tags: [css, dead-code-deletion, pwa, ratchet]

# Dependency graph
requires:
  - phase: 15-06
    provides: "tools/css-usage-report.js (three-tier live detection, --check/--json), the binding deletion order (18 commits), the PWA-banner special case map, and the first computed-style-diff snapshot as the pre-deletion baseline"
provides:
  - "A source tree with zero fully-dead CSS rule blocks (per tools/css-usage-report.js's own measure) — 5148 net lines removed across 15 assets/styles/*.css files in 18 bisectable, individually-verified commits"
  - "The dead .pwa-install-banner feature removed as one D-22 unit: 52 CSS lines (7 selectors, dmscreen.css), 12 lines of markup (modals-editors.html), and the two orphaned CALL_ACTION_WHITELIST entries (installPWA, dismissPWABanner) in core/constants.js — installPWA() itself and the header install button are untouched and verified structurally intact"
  - "INLINE_MAX ratchet lowered 257 -> 256 with a D-49 double-proof (255 red, 256 green)"
  - "A documented, measured finding: node tools/css-usage-report.js --check does not reach exit code 0 after this deletion run (204 dead class names remain outside DEAD_EXCEPTIONS) — every remaining occurrence is a compound/comma-list selector where the dead class survives alongside a live sibling class, by design of the tool's own anchor rule (T-15-18 mitigation); zero dead rule blocks remain"
affects: ["16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 44900
  tasks: 3
  commits: 20

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Character-offset dead-rule deletion (scratchpad helper, not committed): mirrors tools/css-usage-report.js's own extractRules()/isClassLive() algorithm exactly, but tracks character offsets (not line numbers) for each rule's own prelude-to-close-brace span, so a contiguous block of dead rules deletes as an exact, non-overlapping character range regardless of blank lines/comments between rules — line-number-based deletion was rejected after discovering the tool's own startLine is 'the previous sibling's closing-brace line', which would have deleted a live neighbor's closing brace for the first dead rule in any run preceded by a live one"
    - "Post-deletion empty at-rule wrapper cleanup: after deleting a dead rule that was the sole child of an @media/@supports block, the now-empty wrapper is also removed (2 occurrences: dmscreen.css and dashboard.css, both @media wrappers around .spell-slots-grid)"

key-files:
  created: []
  modified:
    - assets/styles/dashboard.css
    - assets/styles/loot.css
    - assets/styles/dmscreen.css
    - assets/styles/encounters.css
    - assets/styles/npcs.css
    - assets/styles/tools.css
    - assets/styles/core.css
    - assets/styles/party.css
    - assets/styles/dice.css
    - assets/styles/welt.css
    - assets/styles/initiative.css
    - assets/styles/spells.css
    - assets/styles/bestiary.css
    - assets/styles/variables.css
    - assets/styles/editors.css
    - assets/templates/modals-editors.html
    - core/constants.js
    - tests/unit/design-consistency.test.js

key-decisions:
  - "The 'two dead media blocks' named in Task 1's action text were identified as: loot.css's @media (max-width: 900px) wrapping .loot-form-grid (line 116), and dashboard.css's @media (min-width: 601px) wrapping .spell-slots-grid (line 564 at edit time) — the only two @media blocks outside the already-deleted MAP INTEGRATION section whose sole child rule was fully dead. Each was deleted as wrapper+child only; the corresponding non-media base rules with the same class names were left for the whole-file Task 2 commits of the same files (loot.css, dmscreen.css)."
  - "Task 2's 15 remaining files were processed with a purpose-built character-offset deletion helper rather than hand-editing each of the ~600 remaining dead rule blocks by line number — the helper reuses tools/css-usage-report.js's exported collectLiveTokens()/LIVE_PREFIXES and reimplements its private blankComments()/extractRules()/isClassLive() logic verbatim, so its dead/live classification is provably identical to the audited tool's own deadRuleBlocks output (independently confirmed after the full run: 0 deadRuleBlocks remain in any file, matching exactly)."
  - "must_haves truth #1 ('--check exits 0') is NOT fully met (204 dead class names remain outside DEAD_EXCEPTIONS) and this is NOT treated as a silent pass or a reason to expand DEAD_EXCEPTIONS by ~204 auto-generated entries. Root cause: the tool's own anchor rule (documented in 15-06, T-15-18 mitigation) requires EVERY class in a selector to be individually dead before a rule is deleted — a genuinely dead class (e.g. pwa-banner, dice-btn) that appears only in compound/comma-list selectors alongside an unrelated, still-live class (e.g. .pwa-banner.visible, .dice-btn.d4, or a shared list like '.card-surface, .wp-card, .fr-card') is conservatively kept whole. This is the SAME conservatism Task 2's own action text mandates ('Ein Block, der auch nur eine lebende Klasse in einem seiner Selektoren traegt, bleibt vollstaendig stehen') — the plan's must_haves truth and its own Task 2 instruction are in tension, and this deletion run followed the explicit, safer Task 2 instruction rather than force-fitting the check to green. REQUIREMENTS.md's actual DEAD-01 wording ('die vom Werkzeug gemessene Menge toter Klassen in VOLLSTAENDIG TOTEN REGELBLOECKEN ist geloescht') is satisfied exactly: 0 dead rule blocks remain anywhere, confirmed by direct re-run of analyze()."
  - "Bulk-generating ~204 DEAD_EXCEPTIONS entries was considered and rejected: 15-06 established DEAD_EXCEPTIONS as a hand-vetted, individually-justified registry (5 entries, each verified by a dedicated grep command in a mandatory false-positive review). Auto-generating 204 entries with a shared boilerplate reason would dilute that registry's value as a curated record and was judged worse than leaving --check red with a clear, evidenced explanation in this SUMMARY and the WINDOWS.md ledger."

requirements-completed: [DEAD-01, DEAD-02, DEAD-03]

coverage:
  - id: D1
    description: "MAP INTEGRATION section (706 measured lines, incl. the id-based #map-cursor-tooltip block) deleted from dashboard.css in its own commit, first"
    requirement: "DEAD-01"
    verification:
      - kind: unit
        ref: "tests/unit/design-consistency.test.js (67/67, run after this commit)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/computed-style-diff.spec.js (3/3, zero unexpected deviations, run after this commit)"
        status: pass
      - kind: other
        ref: "grep -rc map- dashboard.css == 0; grep -rn map-container|map-marker|map-viewport assets/styles/ == no matches"
        status: pass
    human_judgment: false
  - id: D2
    description: "The two dead @media blocks (loot.css .loot-form-grid, dashboard.css .spell-slots-grid) deleted in two separate commits"
    requirement: "DEAD-01"
    verification:
      - kind: unit
        ref: "tests/unit/design-consistency.test.js (67/67, run after each commit)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/computed-style-diff.spec.js (3/3 after each commit)"
        status: pass
    human_judgment: false
  - id: D3
    description: "All remaining dead rule blocks in the 15 other assets/styles/*.css files deleted, one file per commit (15 commits), including the unused shadow ladder (dmscreen.css .shadow-sm/-md/-lg) and the dead nav-tab-icon/-text children in the token file variables.css"
    requirement: "DEAD-01"
    verification:
      - kind: unit
        ref: "tests/unit/design-consistency.test.js (67/67 after every commit); full npx jest (1243/1243) after all 15 commits"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/computed-style-diff.spec.js (3/3 after every commit); full npx playwright test (364 passed/2 skipped) run twice as checkpoints during the run"
        status: pass
      - kind: other
        ref: "node tools/css-usage-report.js analyze() re-run: 0 deadRuleBlocks in any file (matches exactly what was deleted)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The dead .pwa-install-banner feature (CSS + markup + 2 whitelist entries) deleted as one D-22 unit; installPWA() and the header install button verified structurally untouched"
    requirement: "DEAD-02"
    verification:
      - kind: unit
        ref: "tests/unit/event-delegation.test.js (9/9); full npx jest (1243/1243)"
        status: pass
      - kind: other
        ref: "grep -c pwa-install-banner assets/styles/ assets/templates/ == 0; grep -c dismissPWABanner core/constants.js == 0; grep -c 'function installPWA' systems/spellslots/pwa-install.js == 1; grep -c install-pwa assets/templates/header.html >= 1; node tools/css-usage-report.js --check (structural: PWA CSS/markup gone)"
        status: pass
      - kind: e2e
        ref: "full npx playwright test (364 passed/2 skipped) after this commit"
        status: pass
    human_judgment: true
    rationale: "Actually triggering the browser's native install dialog via the header button on a real HTTPS/localhost origin cannot be automated (no CLI/API for the browser-native beforeinstallprompt dialog) — this is the plan's own <human-check> item, deferred to the phase-level UAT.md per workflow.human_verify_mode=end-of-phase. Automated checks above (function/action wiring, code-path independence from the removed whitelist entry) all pass; only the final visual confirmation needs a human."
  - id: D5
    description: "Inline-style ratchet lowered 257 -> 256 with a D-49 double-proof (threshold 255 -> red, 256 -> green) and a comment documenting the new measured baseline"
    requirement: "DEAD-01"
    verification:
      - kind: unit
        ref: "tests/unit/design-consistency.test.js — RED at INLINE_MAX=255 (Expected: <=255, Received: 256), GREEN at INLINE_MAX=256 (67/67)"
        status: pass
    human_judgment: false
  - id: D6
    description: "DEAD-03: the four base sizes (rgba triples, em, box-shadow, transition:all) re-measured fresh after the deletion run, not carried forward, with explicit 0-in-dead-rules values (never omitted)"
    requirement: "DEAD-03"
    verification:
      - kind: other
        ref: "node tools/css-usage-report.js (no flags) re-run against final HEAD — see Base Sizes table below"
        status: pass
    human_judgment: false

# Metrics
duration: ~55min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 07: Dead CSS Deletion Run Summary

**5148 net lines of dead CSS deleted across 15 files in 18 bisectable, individually-verified commits, plus the dead PWA install banner (CSS+markup+whitelist, D-22) and the inline-style ratchet 257→256 (D-49 double-proof) — zero dead rule blocks remain anywhere (DEAD-01 satisfied exactly), though `--check` still reports 204 dead class names surviving inside compound/comma-list selectors alongside live siblings, a documented, by-design tool conservatism rather than an execution gap.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-09-09
- **Tasks:** 3
- **Commits:** 20 (18 per-file/per-unit deletion commits + 1 combined PWA-banner unit + 1 ratchet commit)
- **Files modified:** 18 (15 CSS files, 1 template, 1 JS constants file, 1 test file)

## Accomplishments

- Task 1: MAP INTEGRATION section (706 measured lines, dashboard.css) deleted first and alone, including the id-based `#map-cursor-tooltip`/`#map-cursor-tooltip.visible` block a pure class scan would have missed; then the two dead `@media` blocks (loot.css `.loot-form-grid`, dashboard.css `.spell-slots-grid`) in two further commits. Verified after each: `grep -rc "map-" dashboard.css` == 0, no `map-container`/`map-marker`/`map-viewport` anywhere.
- Task 2: the remaining 15 `assets/styles/*.css` files processed one commit per file (dmscreen.css 994, dashboard.css rest 729, encounters.css 631, npcs.css 625, tools.css 494, core.css 328, loot.css rest 179, party.css 170, dice.css 61, welt.css 55, initiative.css 43, spells.css 26, bestiary.css 19, variables.css 15, editors.css 5 — measured lines each). The unused shadow ladder (`.shadow-sm/-md/-lg`) and the dead `.nav-tab-icon`/`.nav-tab-text` children in the token file `variables.css` were deleted like any other dead block, as instructed. Known previously-fixed false positives (`.init-mob-mode-btn`, `.bestiary-fav`, `.bestiary-list-item`, `.fr-ruf-btn-minus/-plus`, the five read-aloud color variants) were all confirmed still correctly preserved.
- Task 3: the dead `.pwa-install-banner` feature (7 CSS selectors in `dmscreen.css`, 11 lines of markup with both buttons in `modals-editors.html`, and the two orphaned `CALL_ACTION_WHITELIST` entries `installPWA`/`dismissPWABanner` in `core/constants.js`) deleted as one combined commit (D-22). `installPWA()` itself and the header install button (`#pwa-install-btn`, `data-action="install-pwa"`) are structurally verified untouched — they use a dedicated registered action, never the generic `call` route whose whitelist entry was removed. `dismissPWABanner`'s whitelist entry named a function that was never defined anywhere in the source tree (doubly dead).
- `INLINE_MAX` ratchet lowered 257 → 256 with the D-49 double-proof: threshold at 255 → RED (`Expected: <=255, Received: 256`), threshold at 256 → GREEN (67/67). No collective test-net adjustment commit was needed — `design-consistency.test.js` stayed green (67/67) after every single one of the 20 commits, so no existing class assertion broke.
- After every individual commit: `npx jest tests/unit/design-consistency.test.js` (67/67) and `npx playwright test tests/e2e/features/computed-style-diff.spec.js` (3/3, zero unexpected deviations) both green. Full suites run as checkpoints roughly every 5 commits and once more at the very end: `npx jest` 1243/1243 (54 suites), `npx playwright test` 364 passed/2 skipped (run 4 times across the plan, always green), both builds (`build.py` + `build.py --production`) clean, `pytest tests/build -q` 24/24.
- Final measurement (`node tools/css-usage-report.js`): **0 dead rule blocks in any of the 20 assets/styles files** — the literal deletion target of this plan is complete, confirmed by re-running the tool's own `analyze()` against the final tree.

## Task Commits

Each task was committed atomically (one file/unit per commit, D-23):

**Task 1 (3 commits):**
1. `fb54b3e` — MAP INTEGRATION section, dashboard.css (706 lines) — fix
2. `4a7289f` — dead media block, loot.css (6 lines) — fix
3. `94969e4` — dead media block, dashboard.css (7 lines) — fix

**Task 2 (15 commits):**
4. `fa2fdfb` — dmscreen.css (994 lines) — fix
5. `a37e17e` — dashboard.css rest (729 lines) — fix
6. `4d7c8f3` — encounters.css (631 lines) — fix
7. `e743f8d` — npcs.css (625 lines) — fix
8. `a62fab5` — tools.css (494 lines) — fix
9. `50b30cf` — core.css (328 lines) — fix
10. `4ed26ad` — loot.css rest (179 lines) — fix
11. `456246f` — party.css (170 lines) — fix
12. `6681595` — dice.css (61 lines) — fix
13. `c83b8cc` — welt.css (55 lines) — fix
14. `2fc147e` — initiative.css (43 lines) — fix
15. `1b3f94a` — spells.css (26 lines) — fix
16. `93aca1f` — bestiary.css (19 lines) — fix
17. `5fe527b` — variables.css (15 lines) — fix
18. `39e6343` — editors.css (5 lines) — fix

**Task 3 (2 commits):**
19. `6eb767c` — dead PWA install banner: CSS + markup + whitelist, D-22 (66 lines across 3 files) — fix
20. `61266b1` — INLINE_MAX ratchet 257→256, D-49 double-proof (tests/unit/design-consistency.test.js) — fix

**Plan metadata:** committed after this SUMMARY (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `assets/styles/dashboard.css` — MAP INTEGRATION section + 1 media block + 122 remaining dead rule blocks removed
- `assets/styles/loot.css` — 1 dead media block + 24 remaining dead rule blocks removed
- `assets/styles/dmscreen.css` — 137 dead rule blocks + the dead PWA install banner CSS (7 selectors) removed
- `assets/styles/encounters.css` — 97 dead rule blocks removed
- `assets/styles/npcs.css` — 85 dead rule blocks removed
- `assets/styles/tools.css` — 76 dead rule blocks removed
- `assets/styles/core.css` — 53 dead rule blocks removed
- `assets/styles/party.css` — 26 dead rule blocks removed (5 read-aloud color-variant rules correctly preserved)
- `assets/styles/dice.css` — 9 dead rule blocks removed
- `assets/styles/welt.css` — 9 dead rule blocks removed
- `assets/styles/initiative.css` — 6 dead rule blocks removed
- `assets/styles/spells.css` — 2 dead rule blocks removed
- `assets/styles/bestiary.css` — 2 dead rule blocks removed
- `assets/styles/variables.css` — 3 dead rule blocks removed (incl. dead nav-tab-icon/-text children)
- `assets/styles/editors.css` — 1 dead rule block removed
- `assets/templates/modals-editors.html` — dead PWA install banner markup (11 lines, both buttons) removed
- `core/constants.js` — `installPWA` and `dismissPWABanner` `CALL_ACTION_WHITELIST` entries removed
- `tests/unit/design-consistency.test.js` — `INLINE_MAX` 257 → 256 with updated comment

## Decisions Made

See `key-decisions` in the frontmatter. Core points: which two blocks counted as "the two dead media blocks" in Task 1; the character-offset deletion helper built to safely process ~600 remaining rule blocks across 15 files without hand-editing every line range; and — most importantly — the decision NOT to force `--check` to exit 0 by either deleting anchor-rule-preserved compound selectors (risky) or bulk-generating ~204 unverified `DEAD_EXCEPTIONS` entries (would dilute the hand-vetted registry from Plan 15-06).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — completeness] Two now-empty `@media` wrappers cleaned up after their sole child rule was deleted**
- **Found during:** Task 2 (dmscreen.css and dashboard.css whole-file commits)
- **Issue:** Deleting a dead rule block that was the ONLY child of an `@media` wrapper (both cases: `.spell-slots-grid`) would otherwise leave an empty `@media (...) { }` shell behind — itself dead boilerplate, just not a "rule block" the tool's `analyze()` tracks.
- **Fix:** The deletion helper detects and removes now-empty at-rule wrappers as a natural continuation of "fully dead" cleanup, not a separate discretionary edit.
- **Files modified:** `assets/styles/dmscreen.css`, `assets/styles/dashboard.css`
- **Verification:** Brace-depth balance check (0) on both files after each commit; `npx playwright test tests/e2e/features/computed-style-diff.spec.js` green after each.
- **Committed in:** `fa2fdfb`, `a37e17e` (part of the file's own commit)

### Findings Documented, Not Silently Resolved

**2. [Finding — must_haves truth #1 not literally met] `node tools/css-usage-report.js --check` does not exit 0 after this deletion run**
- **Found during:** Task 2 acceptance-criteria check, confirmed again after Task 3
- **What the plan required:** must_haves truth #1 states "Der Pruefmodus des Werkzeugs endet nach dem Loeschlauf mit Exit-Code 0 — es sind keine toten Klassen ausserhalb der datierten Ausnahmeliste mehr uebrig."
- **What was measured:** `node tools/css-usage-report.js --check` reports **204 dead class names outside `DEAD_EXCEPTIONS`** (209 total, 5 already-documented exceptions) after all 20 commits. Full list is in the tool's own `--check` output; representative examples: `pwa-banner` (survives only via `.pwa-banner.visible` — `visible` is a live, unrelated utility class used elsewhere), `dice-btn` (survives only via `.dice-btn.d4`/`.dice-btn.coin` — `d4`/`coin` are live via `.dice-die.d4`/`.fdp-die.d4` in a completely different feature), `fr-card`/`card-surface` siblings in a shared comma-list (`.card-surface, .wp-card, .tl-event-card, .fr-card { ... }`), and many similar cases (`encounter-card`, `npc-card-body`, `location-card`, etc.).
- **Root cause:** `tools/css-usage-report.js`'s own anchor rule (documented in 15-06, T-15-18 mitigation) requires **every** class in a selector to be individually dead before the whole rule is deleted. This is the exact, explicit instruction Task 2's own action text gives ("Ein Block, der auch nur eine lebende Klasse in einem seiner Selektoren traegt, bleibt vollstaendig stehen") — a deliberate false-negative-preferring safety choice, not a bug. A class name can therefore remain individually "dead" per `--check`'s per-class accounting forever, purely because it always co-occurs (in the selector text, not necessarily on any real element) with an unrelated, live class.
- **Why not auto-fixed:** Two paths were considered and rejected. (a) Deleting these compound/list-survivor rules anyway: logically defensible for classes with zero occurrences anywhere in markup, but this would mean changing the tool's own core algorithm (the anchor rule) or manually overriding it per-case — outside Task 2's explicit boundary and a real risk given the plan's own emphasis that a wrong deletion "muss am Bildschirm nicht auffallen." (b) Bulk-generating ~204 `DEAD_EXCEPTIONS` entries to force `--check` green: would need the same individual, hand-verified rigor 15-06 used for its 5 entries (a mandatory grep-per-class review) to stay meaningful; auto-generating 204 entries with a shared boilerplate reason was judged to dilute that registry rather than honor its purpose.
- **What IS confirmed instead:** `node tools/css-usage-report.js` (no flags) re-run against the final tree shows **0 dead rule blocks in any file** — this is the literal wording of `REQUIREMENTS.md`'s DEAD-01 ("die vom Werkzeug gemessene Menge toter Klassen in **vollstaendig toten Regelbloecken** ist geloescht"), which IS satisfied exactly.
- **Files affected:** none further modified for this finding — no CSS was deleted or exceptions added on the strength of this analysis alone.
- **Recorded in:** `.planning/WINDOWS.md` (kind: `unmet-truth`, phase 15, open) for cross-phase visibility until a human decides whether to accept this as permanent documented residual or commission a follow-up hand-verification pass (15-06-style) to selectively expand `DEAD_EXCEPTIONS`.

---

**Total deviations:** 1 auto-fixed (empty at-rule wrapper cleanup, Rule 1), 1 documented finding (must_haves truth #1 partially unmet, not silently resolved).
**Impact on plan:** The deletion run itself — the plan's stated Output ("Ein Quellbaum ohne toten CSS-Bestand... rund achtzehn bisektierbare Commits") — is fully and verifiably complete. Only the stricter, all-class `--check` exit code remains red, for reasons inherent to the tool's own documented conservatism rather than incomplete work.

## Issues Encountered

None beyond the finding documented above under Deviations. No test was weakened, rewritten, or deleted to make any deletion pass (T-15-19 prohibition honored) — a full `git log` of this plan's commits shows every test-file change (`tests/unit/design-consistency.test.js`, one commit) is the deliberate, plan-required `INLINE_MAX` ratchet lowering with its own RED/GREEN double-proof, not a reaction to a failing assertion.

## Ratschen-Beweis (D-49) — Task 3, Inline-Stil-Ratsche

```
Ausgangswert vor der Loeschung: 257 (bestaetigt in 15-06)
Nach Loeschung des PWA-Banner-Markups (genau 1 style="-Vorkommen):
node -e "...match(/style=\"/g)..." -> 256

INLINE_MAX = 255 (Testlauf):
  Expected: <= 255
  Received:    256
  Test failed (RED) — Exit-Code ungleich 0

INLINE_MAX = 256 (Testlauf):
  Tests: 67 passed, 67 total (GREEN) — Exit-Code 0
```

## Base Sizes (DEAD-03) — re-measured fresh after the full deletion run

| Groesse | Gesamt (vorher, 15-06) | Gesamt (jetzt) | Davon in toten Regeln |
|---|---|---|---|
| rgba/rgb-Zahlentripel | 389 | 336 | 0 |
| `em` (relative Schriftgroessen) | 817 | 641 | 0 |
| `box-shadow`-Deklarationen | 88 | 71 | 0 |
| `transition: all` | 163 | 132 | 0 |

All four values are explicitly `0` (never omitted) per DEAD-03/empty — no dead rules remain to contain any of these, confirmed by direct re-run of `node tools/css-usage-report.js`.

## User Setup Required

None — no external service configuration needed.

## Next Phase Readiness

- The dead-CSS deletion run (D-20 through D-23) that Phases 16–19's new ratchets depend on is complete: 0 dead rule blocks remain anywhere in `assets/styles/`.
- `INLINE_MAX` is now 256, with Phase 19 expected to lower it by one more (documented in the ratchet's own comment).
- The `--check` residual (204 anchor-rule-preserved class names) is fully documented here and in `.planning/WINDOWS.md` — worth a decision before Phase 16 starts if a truly-green `--check` is required going forward, since Phases 16–19 will each add more CSS and could compound this residual if not addressed.
- The PWA-install human-check (installing via the header button on a real HTTPS/localhost origin) is deferred to the phase-level UAT per `workflow.human_verify_mode=end-of-phase` — all automatable prerequisites (function existence, action wiring, code-path independence from the removed whitelist entry) are verified.
- Full suites green at HEAD: `npx jest` 1243/1243 (54 suites), `npx playwright test` 364 passed/2 skipped, `pytest tests/build` 24/24, both builds (`build.py`, `build.py --production`) clean.

## Self-Check: PASSED

- FOUND: all 15 modified CSS files exist and contain 0 dead rule blocks per `node tools/css-usage-report.js`
- FOUND: `assets/templates/modals-editors.html` — no `pwa-install-banner` occurrences
- FOUND: `core/constants.js` — no `installPWA`/`dismissPWABanner` whitelist entries; `systems/spellslots/pwa-install.js` still defines `function installPWA`
- FOUND: `tests/unit/design-consistency.test.js` — `INLINE_MAX = 256`
- FOUND: all 20 commits (`fb54b3e` through `61266b1`) present in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green: `node tools/css-usage-report.js` (0 dead rule blocks; `--check` red for the documented, non-blocking reason above), `npx jest` 1243/1243, `npx playwright test` 364 passed/2 skipped, `python build.py` + `--production` + `pytest tests/build -q` (24/24) all clean

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
