---
phase: 03-bestiary
plan: "05"
subsystem: ui
tags: [bestiary, initiative, encounter, favorites, dice, data-action, playwright, dnd5e]

# Dependency graph
requires:
  - phase: 03-bestiary/03-01
    provides: D.bestiary[], D.bestiaryFavorites[], bestiary-actions.js stub, DB migration 3.0.0
  - phase: 03-bestiary/03-03
    provides: renderBestiaryList, renderBestiaryDetail, bestiary-roll-dice data-action emitted by DOM
  - phase: 03-bestiary/03-04
    provides: saveBestiary, deleteBestiaryEntry, custom creature CRUD

provides:
  - addBestiaryToInitiative: quantity dialog (1-100), auto-rolled init, +-10% HP variation, D-16 numbering, statblockRef runtime field
  - addBestiaryToEncounter: D.encounters entry with correct hp/ac from statblock, Undo-able
  - toggleBestiaryFavorite / isBestiaryFavorite: D.bestiaryFavorites[] persist via saveImmediate
  - getBestiaryMonster: resolves by _id (SRD) or parseEntityId (custom)
  - EntityActions handlers: bestiary-select, bestiary-toggle-fav, bestiary-roll-dice, bestiary-add-init, bestiary-add-enc, bestiary-delete
  - E2E SC3: Zur Initiative + Zu Encounter — all 11 bestiary.spec.js tests green, 0 test.fixme remaining

affects:
  - 04-statblock (statblockRef on combatants enables Phase 4 to resolve monsters by _id)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "quantity-cap: Math.max(1, Math.min(parseInt(input,10)||1, 100)) guards bestiary->initiative loop (DoS T-03-10)"
    - "statblockRef runtime field: {source, id} on combatant, no migration, Phase 4 reads it to show statblock"
    - "raw dataset.id for string SRD keys: entity-actions reads ctx.target.dataset.id directly, not parseEntityId(ctx.id)"
    - "saveUndoState before D.encounters.push and D.initiative.combatants.push — both takeover paths Undo-able"
    - "dialog handler: page.on('dialog') registered before click in Playwright SC3 tests"
    - "fix data-action name mismatch: render used bestiary-add-to-initiative; normalised to bestiary-add-init"

key-files:
  created: []
  modified:
    - features/bestiary/bestiary-actions.js
    - features/bestiary/bestiary-render.js
    - ui/actions/entity-actions.js
    - tests/e2e/features/bestiary.spec.js

key-decisions:
  - "Quantity capped at 100 (BESTIARY_MAX_QUANTITY constant) — clamp, not reject, for UX; null/cancel silently aborts"
  - "statblockRef: {source, id} runtime field on combatant — id is _id string for SRD, numeric id for custom — not persisted via migration so no data-migration needed"
  - "Encounter entry speed field: mapped to {walk: speedStr} object (encounters-crud expects speed as object)"
  - "XP lookup: uses window.CR_TO_XP if present, falls back to monster.xp or 0 — avoids hard dependency on encounter-calculator const"
  - "data-action name correction: bestiary-add-to-initiative/bestiary-add-to-encounter normalised to bestiary-add-init/bestiary-add-enc to match plan handler set; render.js updated in same commit"
  - "saveUndoState called before addBestiaryToInitiative push too (not just encounter) — initiative is also Undo-able"

patterns-established:
  - "takeover-idiom: getBestiaryMonster -> saveUndoState -> loop push -> sort -> save -> switchView -> render -> toast"
  - "favorite-key: SRD monsters use String(_id), custom use 'custom:'+id — consistent across toggle/check"

requirements-completed: [BEST-03]

# Metrics
duration: 45min
completed: 2026-06-13
---

# Phase 03 Plan 05: Bestiary Actions & Takeover Summary

**Full bestiary action wiring: quantity-dialog initiative takeover with auto-roll+HP-variation+statblockRef, Undo-able encounter entry, persisted favorites, delegated dice rolling — BEST-03 SC3 E2E complete (11/11 tests green, 0 fixme).**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-06-13T16:00:00Z
- **Completed:** 2026-06-13T16:45:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `addBestiaryToInitiative`: quantity dialog (`Wie viele "X" zur Initiative hinzufuegen?`) capped at 100, adds N combatants with auto-rolled initiative (1d20+DEX mod), +-10% HP variation, D-16 space-numbering ("Goblin 1/2/3"), and `statblockRef: {source, id}` runtime field per D-17
- `addBestiaryToEncounter`: maps SRD/custom statblock to D.encounters schema (hp, ac, cr, speed, attributes, saving throws, resistances, immunities, traits, actions, skills) with `saveUndoState` before push; Undo-able
- `toggleBestiaryFavorite` / `isBestiaryFavorite`: toggle persists in `D.bestiaryFavorites` via `saveImmediate`, keyed as `String(_id)` for SRD or `'custom:'+id` for custom; Favoriten filter now live
- Six bestiary data-action handlers registered in `EntityActions`: `bestiary-select`, `bestiary-toggle-fav`, `bestiary-roll-dice` (→ `rollQrefDice`), `bestiary-add-init`, `bestiary-add-enc`, `bestiary-delete`
- E2E SC3: both `Zur Initiative` and `Zu Encounter` tests implemented and green; 0 `test.fixme` remaining in bestiary.spec.js

## Task Commits

1. **Task 1: bestiary-actions.js + render data-action fix** — `5523908` (feat)
2. **Task 2: Register delegated data-action handlers** — `3929f9d` (feat)
3. **Task 3: Real E2E for Zur Initiative and Zu Encounter** — `5fd3c76` (feat)

## Files Created/Modified

- `features/bestiary/bestiary-actions.js` — Full implementation (~200 lines): getBestiaryMonster, isBestiaryFavorite, toggleBestiaryFavorite, addBestiaryToInitiative (with DoS cap), addBestiaryToEncounter (with Undo); replaces plan-01 stubs
- `features/bestiary/bestiary-render.js` — Fixed data-action names: `bestiary-add-to-initiative` → `bestiary-add-init`, `bestiary-add-to-encounter` → `bestiary-add-enc`
- `ui/actions/entity-actions.js` — Added 6 bestiary handler cases to EntityActions dispatch map
- `tests/e2e/features/bestiary.spec.js` — Un-fixme SC3: Zur Initiative (dialog accept '3', assert 3 numbered combatants, AC, HP+-10%, statblockRef) and Zu Encounter (assert new encounter entry with correct hp/ac, Ctrl+Z Undo verified)

## Decisions Made

- **Quantity cap = 100** (BESTIARY_MAX_QUANTITY): clamp to [1,100], null/cancel aborts silently. Protects against DoS (T-03-10) while allowing reasonable mob sizes.
- **statblockRef**: `{source: 'srd'|'custom', id: string|number}` — runtime-only (no migration); Phase 4 can read `combatant.statblockRef` to fetch the full statblock by id from getSRDMonsters() or D.bestiary.
- **data-action names**: render.js had inconsistent names (`bestiary-add-to-initiative`). Normalised to `bestiary-add-init` / `bestiary-add-enc` in both render and handler, fixing in one commit.
- **saveUndoState in addBestiaryToInitiative**: not required by plan but added for consistency; initiative additions are also Undo-able.
- **XP lookup fallback**: `monster.xp || (window.CR_TO_XP && window.CR_TO_XP[monster.cr]) || 0` avoids hard dependency on encounter-calculator const at module init time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] data-action name mismatch between render and plan handler set**
- **Found during:** Task 2 (registering handlers in entity-actions.js)
- **Issue:** `bestiary-render.js` (plan 03-03) used `bestiary-add-to-initiative` and `bestiary-add-to-encounter` but plan 03-05 defines handlers as `bestiary-add-init` and `bestiary-add-enc`. Mismatched names meant button clicks would silently no-op.
- **Fix:** Updated `bestiary-render.js` button data-action attributes to match the plan's handler names; committed alongside Task 1.
- **Files modified:** `features/bestiary/bestiary-render.js`
- **Verification:** E2E SC3 `Zur Initiative` test confirms button click triggers the dialog and adds combatants.
- **Committed in:** `5523908`

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Fix was essential; without it no takeover button would work. No scope creep.

## Issues Encountered

None — the name mismatch was caught pre-E2E during cross-file inspection and fixed in the same Task 1 commit.

## Known Stubs

None — all plan-01 stubs in bestiary-actions.js are fully implemented. No remaining stubs in scope.

## Threat Flags

No new threat surface introduced beyond the plan's documented trust boundaries (quantity prompt, statblock-to-D mapping). Both mitigations implemented per T-03-10 (quantity cap) and T-03-11 (saveUndoState, parseEntityId, runtime-only statblockRef).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 4 (statblock/legendary tracking): `combatant.statblockRef` field is available on all bestiary-spawned combatants with `{source, id}`; Phase 4 can call `getBestiaryMonster(ref.id, ref.source)` to fetch the full statblock.
- Favorites filter is fully live; D.bestiaryFavorites persists across sessions.
- All 11 bestiary E2E tests green; bestiary system is complete.

## Self-Check: PASSED

Files verified present:
- FOUND: `features/bestiary/bestiary-actions.js`
- FOUND: `ui/actions/entity-actions.js`
- FOUND: `tests/e2e/features/bestiary.spec.js`
- FOUND: `.planning/phases/03-bestiary/03-05-SUMMARY.md`

Commits verified:
- `5523908` — feat(03-05): implement bestiary-actions and fix render data-action names
- `3929f9d` — feat(03-05): register bestiary data-action handlers in EntityActions
- `5fd3c76` — feat(03-05): implement SC3 E2E tests — Zur Initiative and Zu Encounter

Test results:
- Unit tests: 308/308 passed
- E2E tests: 11/11 passed (0 test.fixme in bestiary.spec.js)
- Build: python build.py --production exits 0

---
*Phase: 03-bestiary*
*Completed: 2026-06-13*
