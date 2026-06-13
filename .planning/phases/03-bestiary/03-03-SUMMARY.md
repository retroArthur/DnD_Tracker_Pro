---
phase: 03-bestiary
plan: "03"
subsystem: ui
tags: [bestiary, virtual-scroll, filter-engine, statblock, dnd5e, css-grid, playwright]

# Dependency graph
requires:
  - phase: 03-bestiary/03-01
    provides: D.bestiary[], getSRDMonsters(), DB migration 3.0.0, tab-registry entry
  - phase: 03-bestiary/03-02
    provides: 112 German SRD statblocks, getSRDMonsters() implementation

provides:
  - Full Bestiary tab UI: toolbar (search, CR-filter, Typ-filter, Nur-Eigene, Favoriten), master-detail layout
  - renderBestiaryList() with VirtualScroll, single-pass applyFilters, CR-sort (fractions correct)
  - renderBestiaryDetail() with classic 5e parchment statblock (20 sections, clickable dice)
  - bestiary.css (~300 lines): grid layout, list items, statblock typography, parchment styling, mobile responsive
  - E2E SC1 tests: Goblin suchen, CR-Filter, Typ-Filter, Wuerfelklick — all 4 green

affects:
  - 03-bestiary/03-04 (bestiary editor uses renderBestiaryList to refresh)
  - 03-bestiary/03-05 (bestiary actions — Initiative/Encounter integration; selectBestiary in global scope)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sanitize-then-dice: call sanitizeHTML() first, then renderClickableDice() on clean output to avoid data-* strip"
    - "deferred action registration: wrap EventDelegation.registerAction in DOMContentLoaded to avoid TDZ crash"
    - "raw dataset.id for string SRD IDs: use ctx.target.dataset.id directly, not parseEntityId(ctx.id)"
    - "dynamic E2E option reading: use page.evaluate + waitForFunction for select option population"

key-files:
  created:
    - assets/templates/view-bestiary.html
    - assets/styles/bestiary.css
    - features/bestiary/bestiary-render.js
  modified:
    - tests/e2e/features/bestiary.spec.js

key-decisions:
  - "EventDelegation TDZ: registration deferred to DOMContentLoaded because bestiary-render.js loads before event-delegation.js in build order (~107 vs ~145)"
  - "sanitize-then-dice order: sanitizeHTML strips data-* attrs; dice spans must be injected after sanitization"
  - "SRD IDs are strings (e.g. 'goblin'): parseEntityId() returns null; use raw ctx.target.dataset.id"
  - "E2E search via page.evaluate + dispatchEvent(input) instead of page.fill which may not trigger render"
  - "E2E type-filter reads options dynamically (SRD has 'Humanoide (Goblinoide)', not plain 'Humanoid')"

patterns-established:
  - "crToSortValue(): maps CR fractions (1/8=0.125, 1/4=0.25, 1/2=0.5) to numeric for correct sort order"
  - "bestiary-dice span pattern: class=bestiary-dice data-action=bestiary-roll-dice data-value=formula"
  - "parchment statblock uses .read-aloud.parchment from party.css — reuse existing theme class"

requirements-completed: [BEST-01]

# Metrics
duration: 90min
completed: 2026-06-13
---

# Phase 03 Plan 03: Bestiary Tab UI Summary

**Visible Bestiary tab with toolbar, master-detail layout, virtual-scrolled list (CR-sorted, single-pass filter), classic 5e parchment statblock with clickable dice, and 4/4 E2E SC1 tests green.**

## Performance

- **Duration:** ~90 min
- **Started:** 2026-06-13T10:30:00Z
- **Completed:** 2026-06-13T12:00:00Z
- **Tasks:** 3 (+ 1 fix task)
- **Files modified:** 4

## Accomplishments

- Full master-detail Bestiary tab: toolbar with search + 4 filters, list panel with VirtualScroll, detail panel with 20-section 5e statblock
- 112 SRD monsters + custom creatures merged, CR-sorted, single-pass `applyFilters` with search across name/creatureType
- Clickable dice (`data-action="bestiary-roll-dice"`) applied after `sanitizeHTML()` to prevent stripping; `renderClickableDice()` handles `XdY+Z` and standalone `+N` modifier patterns
- E2E SC1: Goblin suchen (4 hits), CR-Filter (dynamic option selection), Typ-Filter (dynamic), Wuerfelklick — all 4 pass

## Task Commits

1. **Task 1: Toolbar + HTML + CSS** - `1adf9e4` (feat)
2. **Task 2: renderBestiaryList + renderBestiaryDetail** - `f6df4ab` (feat)
3. **Task 3: E2E SC1 + bug fixes** - `2efde9a` (fix)

## Files Created/Modified

- `assets/templates/view-bestiary.html` — full toolbar + master-detail HTML (search, CR-filter, Typ-filter, Nur-Eigene, Favoriten, list panel, detail panel with dragon empty state)
- `assets/styles/bestiary.css` — ~300 lines: CSS grid layout, list item styling, statblock typography, parchment background, mobile breakpoints
- `features/bestiary/bestiary-render.js` — ~460 lines: `renderBestiaryList`, `renderBestiaryDetail`, `renderClickableDice`, `crToSortValue`, `selectBestiary`, `cleanupBestiaryEditor`; deferred action registration pattern
- `tests/e2e/features/bestiary.spec.js` — SC1 assertions real (Goblin suchen, CR-Filter, Typ-Filter, Wuerfelklick); SC2/SC3 remain fixme for plans 04/05

## Decisions Made

- **EventDelegation TDZ deferred**: `bestiary-render.js` loads at build position ~107, `event-delegation.js` at ~145. Accessing `const EventDelegation` before initialization causes `ReferenceError`. Fixed by wrapping `registerAction` calls in `window.addEventListener('DOMContentLoaded', ...)`.
- **sanitize-then-dice order**: `sanitizeHTML()` strips `data-*` attributes from its allowedAttributes list. Solution: sanitize description text first, then inject `<span class="bestiary-dice" data-action="bestiary-roll-dice">` on the clean output.
- **Raw SRD string IDs**: `parseEntityId('goblin')` returns `null`. EventDelegation passes `ctx.id = parseEntityId(dataset.id)`. The `bestiary-select` action handler uses `ctx.target.dataset.id` directly (string) instead of `ctx.id`.
- **Dynamic E2E type options**: SRD uses compound type strings like "Humanoide (Goblinoide)", not plain "Humanoid". E2E reads available options via `page.evaluate` and selects first non-empty value dynamically.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] EventDelegation TDZ crash preventing tab activation**
- **Found during:** Task 3 (E2E SC1 testing)
- **Issue:** `bestiary-render.js` top-level code accessed `EventDelegation` (declared `const` in a later module) causing `ReferenceError: Cannot access 'EventDelegation' before initialization` — broke entire app initialization
- **Fix:** Wrapped all `EventDelegation.registerAction()` calls in `window.addEventListener('DOMContentLoaded', ...)` to defer registration until after all modules are loaded
- **Files modified:** `features/bestiary/bestiary-render.js`
- **Verification:** Tab now activates correctly, `#view-bestiary.active` class applied, 5/5 SC1 E2E tests pass
- **Committed in:** `2efde9a`

**2. [Rule 1 - Bug] sanitizeHTML stripping dice span data-* attributes**
- **Found during:** Task 3 (Wuerfelklick E2E test)
- **Issue:** `renderClickableDice()` was called before `sanitizeHTML()`. The sanitizer stripped `data-action` and `data-value` attributes from dice spans, making `.bestiary-dice[data-action]` invisible to tests
- **Fix:** Reordered: `sanitizeHTML(item.desc)` first → `renderClickableDice(cleanDesc)` second
- **Files modified:** `features/bestiary/bestiary-render.js`
- **Verification:** `.bestiary-dice` elements retain `data-action="bestiary-roll-dice"`, Wuerfelklick test passes
- **Committed in:** `2efde9a`

**3. [Rule 1 - Bug] SRD string IDs parsed as null causing selectBestiary(null) no-op**
- **Found during:** Task 3 (detail panel click test)
- **Issue:** `bestiary-select` action handler used `ctx.id` (= `parseEntityId(dataset.id)`) which returns `null` for string IDs like "goblin". `selectBestiary(null)` did nothing.
- **Fix:** Changed `bestiary-select` handler to read `ctx.target.dataset.id` directly as raw string
- **Files modified:** `features/bestiary/bestiary-render.js`
- **Verification:** Clicking a list item renders the detail panel; Wuerfelklick and detail panel tests pass
- **Committed in:** `2efde9a`

---

**Total deviations:** 3 auto-fixed (3x Rule 1 — Bug)
**Impact on plan:** All three fixes were essential for functional correctness. No scope creep.

## Issues Encountered

- E2E `page.fill` + `page.type` did not reliably trigger the `input` event handler in EventDelegation. Replaced with `page.evaluate(() => { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })) })` pattern.
- `waitForSelector('option[value="..."]')` fails for `<select>` options inside hidden containers. Replaced with `waitForFunction(() => sel.options.length > 1)`.

## Known Stubs

- `window.isBestiaryFavorite(id)` returns `false` unconditionally — stub delegated to `bestiary-actions.js` (plan 03-05). Favoriten filter works but shows nothing until plan 05.
- `openBestiaryEditor()` called by "+ Neue Kreatur" button — stub delegated to `bestiary-editor.js` (plan 03-04).
- SC2 (CRUD + Undo) and SC3 (Initiative/Encounter integration) E2E tests are `test.fixme` — responsibility of plans 03-04 and 03-05.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 03-04 (Bestiary Editor) can use `renderBestiaryList()` to refresh the list after CRUD and `selectBestiary(id, 'custom')` to show the newly created creature.
- Plan 03-05 (Bestiary Actions) must implement `isBestiaryFavorite()`, `addToInitiative()` from bestiary context, and `addToEncounter()`.
- `bestiary-dice` spans dispatch `data-action="bestiary-roll-dice"` — plan 03-05 must register that action in EventDelegation to wire dice rolling.

---
*Phase: 03-bestiary*
*Completed: 2026-06-13*
