---
phase: "03"
plan: "01"
subsystem: bestiary-foundation
tags: [bestiary, foundation, migration, tab-registry, module-wiring, wave-0-tests]
dependency_graph:
  requires: []
  provides:
    - D.bestiary[] initialized in core/data.js
    - D.bestiaryFavorites[] initialized in core/data.js
    - migration 3.0.0 in version-migration.js
    - bestiary tab registered in TAB_RENDER_REGISTRY
    - 5 module stubs registered in build.py + loader.js
    - bestiary.css registered in build.py + assets/styles.css
    - view-bestiary.html registered in build.py
    - nav tab 🐉 Bestiar in header.html
    - Wave-0 tests: srd-monsters.test.js, migration.test.js (3.0.0), bestiary.spec.js
  affects:
    - core/data.js (new fields)
    - systems/spellslots/version-migration.js (new migration)
    - systems/tab-registry.js (new entry)
    - build.py (5 JS + 1 CSS + 1 HTML added)
    - loader.js (5 JS added)
    - assets/styles.css (@import added)
    - assets/templates/header.html (nav tab added)
tech_stack:
  added: []
  patterns:
    - lazy-cache stub (srd-monsters.js, like srd-spells.js)
    - defensive container guard in renderBestiaryList
    - TAB_RENDER_REGISTRY entry with cleanup hook
    - migration 3.0.0 defensive if-guards (never overwrite existing data)
    - Wave-0 E2E fixme placeholders with contract-named test titles
key_files:
  created:
    - core/srd-monsters.js
    - features/bestiary/bestiary-render.js
    - features/bestiary/bestiary-crud.js
    - features/bestiary/bestiary-editor.js
    - features/bestiary/bestiary-actions.js
    - assets/styles/bestiary.css
    - assets/templates/view-bestiary.html
    - tests/unit/srd-monsters.test.js
    - tests/e2e/features/bestiary.spec.js
  modified:
    - core/data.js
    - systems/spellslots/version-migration.js
    - systems/tab-registry.js
    - assets/templates/header.html
    - assets/styles.css
    - build.py
    - loader.js
    - tests/unit/migration.test.js
decisions:
  - "SRD data never enters D — lazy-cache only in module closure (architecture constraint)"
  - "Migration 3.0.0 uses defensive if(!data.X) guards — never overwrites existing user data"
  - "Wave-0 E2E uses state:'attached' not 'visible' for empty section (zero-height)"
metrics:
  duration: "~45 minutes"
  completed: "2026-06-13"
  tasks_completed: 5
  tasks_total: 5
  files_created: 9
  files_modified: 8
---

# Phase 3 Plan 01: Bestiary Foundation Summary

**One-liner:** Bestiary tab scaffold — D.bestiary schema + migration 3.0.0 + 5 JS module stubs + CSS/template/nav/tab-registry wiring + Wave-0 unit and E2E tests, all passing, production build green.

---

## What Was Built

The complete structural foundation for the Bestiary tab was laid without any feature code. After this plan:

- The **🐉 Bestiar** nav tab appears in the app and is clickable
- `#view-bestiary` is rendered (empty) when the tab is active
- `D.bestiary[]` and `D.bestiaryFavorites[]` are initialized for new campaigns
- Legacy campaigns are upgraded via migration 3.0.0 (defensive, never overwrites)
- 5 JS module stubs are registered in both `build.py` and `loader.js` (module lists in sync)
- `bestiary.css` is in both `build.py` css_files and `assets/styles.css @import`
- `view-bestiary.html` is in `build.py` html_templates
- `TAB_RENDER_REGISTRY.bestiary` wires `renderBestiaryList` and `cleanupBestiaryEditor`
- Production build succeeds: Pre-Build-Checks bestanden (module sync + dedup)

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | D-schema + migration 3.0.0 | f93733a | core/data.js, version-migration.js |
| 2 | Create 5 module stubs | 1bd6ad2 | srd-monsters.js, 4 bestiary/*.js |
| 3 | Register modules/CSS/template/tab-registry/nav | ffbe62d | build.py, loader.js, styles.css, tab-registry.js, header.html, bestiary.css, view-bestiary.html |
| 4 | Wave-0 unit tests | 294e647 | srd-monsters.test.js, migration.test.js |
| 5 | Wave-0 E2E scaffold | f0f0793 | bestiary.spec.js |

---

## Verification Results

| Check | Result |
|-------|--------|
| `python build.py --production` | PASS — Pre-Build-Checks bestanden |
| `npx jest tests/unit/srd-monsters.test.js` | PASS — 5/5 tests |
| `npx jest tests/unit/migration.test.js -t "3.0.0"` | PASS — 3/3 tests |
| `npx playwright test bestiary.spec.js --list` | 11 tests listed (10 contract names + 1 live) |
| E2E tab-visibility test | PASS — #view-bestiary.active attached |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] E2E tab-visibility test used wrong wait strategy**
- **Found during:** Task 5
- **Issue:** `waitForSelector('#view-bestiary', { state: 'visible' })` timed out because an empty `<section>` has zero height and Playwright considers zero-height elements "hidden" even when `display: block`
- **Fix:** Changed wait to `waitForSelector('#view-bestiary.active', { state: 'attached' })` — waits for the `active` class (set by switchView) without requiring non-zero dimensions; assertion updated to `toHaveClass(/active/)`
- **Files modified:** `tests/e2e/features/bestiary.spec.js`
- **Commit:** f0f0793

---

## Known Stubs

The following stubs are intentional — plans 02–05 fill them:

| File | Stub | Filled by |
|------|------|-----------|
| core/srd-monsters.js | `getSRDMonsters()` returns `[]` | Plan 02 |
| features/bestiary/bestiary-render.js | `renderBestiaryList()` renders nothing | Plan 03 |
| features/bestiary/bestiary-crud.js | `saveBestiary()`, `deleteBestiaryEntry()` are no-ops | Plan 04 |
| features/bestiary/bestiary-editor.js | `openBestiaryEditor()` is a no-op | Plan 04 |
| features/bestiary/bestiary-actions.js | All 5 action stubs return false/null | Plan 05 |
| assets/styles/bestiary.css | Header comment only | Plan 03 |
| assets/templates/view-bestiary.html | Minimal section only | Plan 03 |
| tests/e2e/features/bestiary.spec.js | 10 fixme tests | Plans 02–05 |

These stubs are intentional architecture: the plan's goal is to lay the foundation so downstream plans have stubs to fill and failing tests to satisfy.

---

## Threat Flags

None — this plan only creates stubs and registration wiring. No new network endpoints, auth paths, file access patterns, or schema changes at external trust boundaries were introduced. The migration 3.0.0 applies defensive `if (!data.X)` guards (T-03-01 mitigated). SRD data never touches `D` (T-03-02 mitigated by architecture). Module-list sync verified by `python build.py` (T-03-03 mitigated).

---

## Self-Check: PASSED

- [x] core/srd-monsters.js exists
- [x] features/bestiary/bestiary-render.js exists
- [x] features/bestiary/bestiary-crud.js exists
- [x] features/bestiary/bestiary-editor.js exists
- [x] features/bestiary/bestiary-actions.js exists
- [x] assets/styles/bestiary.css exists
- [x] assets/templates/view-bestiary.html exists
- [x] tests/unit/srd-monsters.test.js exists
- [x] tests/e2e/features/bestiary.spec.js exists
- [x] Commits f93733a, 1bd6ad2, ffbe62d, 294e647, f0f0793 exist
- [x] Production build succeeds
- [x] 11 unit tests pass, 11 E2E tests listed
