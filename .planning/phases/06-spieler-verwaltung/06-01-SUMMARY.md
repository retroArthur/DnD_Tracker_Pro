---
phase: 06-spieler-verwaltung
plan: 01
subsystem: character-management
tags: [d&d-5e, xp-tracking, character-advancement, migration, unit-testing, e2e-testing, playwright, jest]

# Dependency graph
requires:
  - phase: 05-welt-story
    provides: MIGRATIONS pattern (4.0.0), version-migration.js structure, testable-utils.js CommonJS pattern
provides:
  - XP_LEVEL_THRESHOLDS constant (20-value PHB advancement table) in DND_RULES namespace
  - calcSkillModifier, canLevelUp, getXPForCR, distributeXP pure helpers (window + CommonJS)
  - Migration 5.0.0 backfilling xp/skillProficiencies/skillExpertise/attacks + levelingMode
  - Wave-0 unit suite (49 tests green) + shared fixture
  - Two runnable E2E stub specs (13 skipped tests, 0 failures) for Waves 2-4
affects: [06-02-inspiration, 06-03-charakterwerte, 06-04-xp-tracker]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vm-context migration testing: MIGRATIONS exported via window.MIGRATIONS for Jest vm access"
    - "TDD RED/GREEN: test commit before implementation commit (21cf563 → d268369)"
    - "E2E stub with test.fixme: Wave-0 stubs runnable but assertions deferred to feature waves"
    - "testable-utils CommonJS mirror: inlined SKILL_INFO_TEST + CR_TO_XP_TEST + XP_LEVEL_THRESHOLDS_TEST"

key-files:
  created:
    - tests/unit/character-advancement.test.js — 49-test Wave-0 unit suite (all green)
    - tests/e2e/features/inspiration.spec.js — Wave-0 E2E stubs for CHAR-02 (5 fixme tests)
    - tests/e2e/features/character-advancement.spec.js — Wave-0 E2E stubs for CHAR-01/03 (8 fixme tests)
  modified:
    - core/constants.js — XP_LEVEL_THRESHOLDS constant + DND_RULES namespace entry + window export
    - utils/game-rules.js — calcSkillModifier, canLevelUp, getXPForCR, distributeXP + window exports
    - utils/testable-utils.js — CommonJS mirror of four helpers with inlined test data
    - systems/spellslots/version-migration.js — MIGRATIONS['5.0.0'] + window.MIGRATIONS export
    - core/data.js — levelingMode:'xp' in D.settings; schema documentation for new char fields

key-decisions:
  - "MIGRATIONS exported via window.MIGRATIONS at end of version-migration.js — const is not accessible from vm context; window export makes it extractable via context.window.MIGRATIONS"
  - "XP_LEVEL_THRESHOLDS uses 0-based indexing: index[0]=0 (Level 1), index[1]=300 (Level 2), index[19]=355000 (Level 20)"
  - "distributeXP is pure/side-effect-free on globals — caller provides activeChars array; T-06-02: returns {share:0,remainder:totalXP} for empty array"
  - "testable-utils inlines SKILL_INFO_TEST/CR_TO_XP_TEST as local copies — avoids browser globals in Jest; sync comment added"
  - "E2E stubs use test.fixme (not test.skip) — gives clearer Wave-2/3/4 activation intent"

patterns-established:
  - "Pure helper pattern: calcSkillModifier reads SKILL_INFO from global lexical scope (NOT window.X), no const-in-function trap"
  - "getXPForCR dual-lookup: CR_TO_XP[cr] ?? CR_TO_XP[String(cr)] ?? 0 handles mixed Number/String keys"
  - "Migration safety: optional chaining (data.characters?.forEach) guards against non-array characters"
  - "Wave-0 E2E stub structure: APP_URL = file:///…, ESM import, test.fixme + wave-activation comment"

requirements-completed: [CHAR-01, CHAR-02, CHAR-03]

# Metrics
duration: 45min
completed: 2026-06-15
---

# Phase 6 Plan 01: Spieler-Verwaltung Fundament Summary

**PHB advancement table + four 5e pure helpers (calcSkillModifier/canLevelUp/getXPForCR/distributeXP), migration 5.0.0 backfilling character schema fields, and Wave-0 test scaffolding (49 unit tests green, 2 E2E stub specs runnable)**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-06-15T21:00:00Z
- **Completed:** 2026-06-15T21:45:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- XP_LEVEL_THRESHOLDS (20-value PHB S.15 table) added to core/constants.js with DND_RULES namespace and legacy window export; JSDoc warning clearly distinguishes it from XP_THRESHOLDS (encounter difficulty)
- Four pure D&D 5e rules helpers added to utils/game-rules.js (window exports) and mirrored as CommonJS in utils/testable-utils.js: calcSkillModifier handles ungeübt/geübt/Expertise factor; canLevelUp uses 0-based XP_LEVEL_THRESHOLDS; getXPForCR handles mixed Number/String CR keys; distributeXP is division-safe (T-06-02)
- Migration 5.0.0 in version-migration.js backfills xp=0, skillProficiencies={}, skillExpertise={}, attacks=[] per character; sets levelingMode='xp' in settings; uses optional chaining for safety (T-06-01); MIGRATIONS exported via window for test access
- Wave-0 test suite: 49 unit tests all green (TDD RED gate at 21cf563, GREEN at d268369); 2 E2E stub specs (13 test.fixme) load with exit 0 under file:// ESM harness

## Task Commits

1. **Task 1: XP_LEVEL_THRESHOLDS constant + four pure rules helpers** - `b79a1f4` (feat)
2. **Task 2 [RED]: Failing Wave-0 unit suite** - `21cf563` (test — TDD RED gate)
3. **Task 2 [GREEN]: Schema fields + migration 5.0.0 + levelingMode** - `d268369` (feat — TDD GREEN gate)
4. **Task 3: Wave-0 E2E stub specs** - `9fc7dd3` (feat)

_TDD task 2 has two commits: test (RED gate) then feat (GREEN gate)_

## Files Created/Modified

- `core/constants.js` — XP_LEVEL_THRESHOLDS 20-element array + DND_RULES.XP_LEVEL_THRESHOLDS + window.XP_LEVEL_THRESHOLDS
- `utils/game-rules.js` — calcSkillModifier, canLevelUp, getXPForCR, distributeXP + window exports
- `utils/testable-utils.js` — CommonJS mirror of four helpers with inlined SKILL_INFO_TEST, CR_TO_XP_TEST, XP_LEVEL_THRESHOLDS_TEST
- `systems/spellslots/version-migration.js` — MIGRATIONS['5.0.0'] backfill body + window.MIGRATIONS export
- `core/data.js` — levelingMode:'xp' default in D.settings; schema documentation comment block
- `tests/unit/character-advancement.test.js` — 49-test suite (calcSkillModifier/canLevelUp/getXPForCR/distributeXP/XP_LEVEL_THRESHOLDS/migration)
- `tests/e2e/features/inspiration.spec.js` — 5 fixme tests for CHAR-02 Wave-2
- `tests/e2e/features/character-advancement.spec.js` — 8 fixme tests for CHAR-01/03 Waves 3-4

## Decisions Made

- **MIGRATIONS exported via window**: `const MIGRATIONS` is not accessible from vm context used in migration tests; added `window.MIGRATIONS = MIGRATIONS` at bottom of version-migration.js. Tests extract via `context.window.MIGRATIONS`. Follows existing pattern of window exports in this non-ESM architecture.
- **XP_LEVEL_THRESHOLDS is 0-based**: index 0 = Level 1 = 0 XP (start), index 1 = Level 2 = 300 XP. `canLevelUp` uses `XP_LEVEL_THRESHOLDS[nextLevel - 1]` (0-based access for 1-based level).
- **distributeXP is caller-pure**: The helper only mutates the passed `activeChars` array; the caller (Wave 4) is responsible for filtering living party members, calling pushUndo(), and save().
- **testable-utils inlines copies**: SKILL_INFO_TEST, CR_TO_XP_TEST, XP_LEVEL_THRESHOLDS_TEST are minimal copies with sync comments — avoids complex browser global mocking in Jest.
- **E2E stubs use test.fixme**: Chosen over test.skip because fixme gives clearer semantics ("this should eventually work") and shows up differently in Playwright reports.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MIGRATIONS not accessible from vm context in tests**
- **Found during:** Task 2 (unit test run - RED phase)
- **Issue:** `MIGRATIONS` is declared with `const` in version-migration.js and is therefore in the module's lexical scope, NOT on the `context` object passed to `vm.createContext`. Tests received `MIGRATIONS_VM = context.MIGRATIONS` → undefined.
- **Fix:** Added `window.MIGRATIONS = MIGRATIONS;` export at end of version-migration.js. Tests now extract via `context.window.MIGRATIONS`. Also updated test to read from `context.window.MIGRATIONS`.
- **Files modified:** systems/spellslots/version-migration.js, tests/unit/character-advancement.test.js
- **Verification:** `npx jest tests/unit/character-advancement.test.js` → 49 passed
- **Committed in:** d268369 (Task 2 GREEN gate commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — const lexical scope vs vm context)
**Impact on plan:** Fix was necessary for testability. window.MIGRATIONS follows the existing window-export convention and does not introduce any duplication risk.

## Issues Encountered

- The acceptance criteria mentioned `node -e "const t=require('./utils/testable-utils.js')…"` to test exports, but this fails because `package.json` has `"type": "module"` (ESM), making `require()` unavailable in node -e. Verified instead via Jest which applies babel-jest CommonJS transform — all 4 exports confirmed as `function function function function` via `typeof` assertions in the unit suite.

## Known Stubs

None — this plan creates only pure helpers, constants, migration, and test scaffolding. No UI templates or data displays were introduced in Wave 1.

## Threat Flags

No new security-relevant surfaces introduced. All new code is pure math helpers and a data migration. The migration itself mitigates T-06-01 (T-06-02 guard in distributeXP verified by unit test).

## Next Phase Readiness

Wave 2 (06-02) can now build on:
- `calcSkillModifier(ch, skillKey)` — ready for use in Inspiration actions (though not needed for toggle itself)
- `canLevelUp(ch)` — ready for level-up hint rendering (Wave 4)
- `getXPForCR(cr)` and `distributeXP(totalXP, activeChars)` — ready for XP distribution modal (Wave 4)
- Migration 5.0.0 — existing campaigns will be backfilled automatically on next load
- E2E stubs — Wave 2 fills in inspiration.spec.js tests; Waves 3-4 fill character-advancement.spec.js

Note for Waves 2-4:
- `SKILL_INFO` lives in `core/constants.js:217` (NOT `SKILLS` in `dice-core.js:11`)
- Migration key chosen: `'5.0.0'` (not '6.0.0')
- `calcSkillModifier` and `getXPForCR` are in global lexical scope (window-exported) — access directly, no `const X = window.X` inside functions

---
*Phase: 06-spieler-verwaltung*
*Completed: 2026-06-15*

## Self-Check: PASSED

**Files verified:**
- `tests/unit/character-advancement.test.js` — FOUND
- `tests/e2e/features/inspiration.spec.js` — FOUND
- `tests/e2e/features/character-advancement.spec.js` — FOUND
- `systems/spellslots/version-migration.js` (contains '5.0.0') — FOUND
- `core/constants.js` (contains XP_LEVEL_THRESHOLDS) — FOUND

**Commits verified:**
- b79a1f4 (feat: XP_LEVEL_THRESHOLDS + four helpers) — EXISTS
- 21cf563 (test: RED gate unit suite) — EXISTS
- d268369 (feat: migration 5.0.0 GREEN gate) — EXISTS
- 9fc7dd3 (feat: E2E stub specs) — EXISTS
