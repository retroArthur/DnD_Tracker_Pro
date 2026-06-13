---
phase: "03"
plan: "04"
subsystem: bestiary
tags: [crud, editor, modal, undo, e2e, custom-creatures]
dependency_graph:
  requires: [03-01, 03-02, 03-03]
  provides: [custom-creature-crud, bestiary-editor-modal, bestiary-undo]
  affects: [bestiary-render, bestiary-list, bestiary-detail]
tech_stack:
  added: []
  patterns: [deleteWithConfirm, afterCrudOperation, saveUndoState, sanitizeHTML, VirtualScroll, EventDelegation]
key_files:
  created:
    - features/bestiary/bestiary-editor.js (full impl, replaces plan-01 stub)
    - features/bestiary/bestiary-crud.js (full impl, replaces plan-01 stub)
  modified:
    - assets/templates/view-bestiary.html (added #bestiary-editor-modal with bst-* fields)
    - assets/styles/bestiary.css (added ~175 lines for editor modal)
    - features/bestiary/bestiary-render.js (renderTraitList dual-mode, bestiary-delete action, duplicate stub removed)
    - tests/e2e/features/bestiary.spec.js (SC2 tests un-fixme'd and passing)
decisions:
  - Use D-04 schema (reactions, legendaryActions, legendaryActionsPerRound, senses) for all custom creatures for plan-05 compatibility
  - Store rich-text fields (traits/actions/reactions/legendary) as sanitized HTML strings for custom creatures (SRD uses [{name,desc}] arrays)
  - renderTraitList() detects type at runtime — no data migration required
  - E2E tests check D.bestiary directly rather than DOM item count (VirtualScroll renders subset of visible rows only)
  - bestiary-delete action registered in BestiaryRenderActions in plan-04 (not plan-05) so SC2 E2E works
metrics:
  duration: "~45 min"
  completed: "2026-06-13"
  tasks: 3
  files: 6
---

# Phase 03 Plan 04: Custom-Creature CRUD + Editor Summary

Full custom-creature editor (bst-* form), saveBestiary() + deleteBestiaryEntry() with Undo, and 4 passing SC2 E2E tests for the D&D Kampagnen-Tracker Pro Bestiary module.

## What Was Built

### Task 1 — Bestiary Editor Modal + openBestiaryEditor

`#bestiary-editor-modal` added to `view-bestiary.html` with the complete D-04 statblock form. All field IDs use the `bst-` prefix to avoid collision with encounter form IDs.

Fields covered:
- Basic: `bst-name` (with `#bst-name-error` validation), `bst-size` (select), `bst-type`, `bst-alignment`, `bst-cr`, `bst-xp`
- Combat: `bst-ac`, `bst-ac-info`, `bst-hp`, `bst-hp-formula`
- Speed grid (5 columns): `bst-speed-walk/fly/swim/climb/burrow`
- 6 attribute inputs with live modifier display: `bst-str/dex/con/int/wis/cha` + `bst-*-mod` spans
- Saving throw checkboxes + value inputs: `bst-save-{attr}` + `bst-save-val-{attr}`
- Text: `bst-senses`, `bst-languages`
- Rich-text contenteditable: `bst-traits`, `bst-actions`, `bst-reactions`, `bst-legendary`
- `bst-legendary-count`

`openBestiaryEditor(id)` in `bestiary-editor.js`:
- Receives numeric id from `call` action (`ctx.id = parseEntityId(...)`)
- Edit mode: finds creature in `D.bestiary` via `parseEntityId`, pre-fills all fields
- Create mode (id falsy/null): clears all fields, sets title "Neue Kreatur"
- Both modes: calls `showModal('bestiary-editor-modal')`

`cleanupBestiaryEditor()` replaced plan-01 no-op stub — now calls `hideModal('bestiary-editor-modal')`.

CSS added to `bestiary.css`: `.bst-editor-modal` (620px), scrollable body, `.bst-speed-grid` (5-col), `.bst-attrs-grid` (6-col), `.bst-saves-grid` (3-col), `.bst-rich-editor` with `::before` placeholder, mobile breakpoints at 480px.

### Task 2 — saveBestiary() + deleteBestiaryEntry() with Undo

`saveBestiary()` in `bestiary-crud.js`:
- Name validation with frozen German error string
- Length caps on all string fields (server-side-equivalent, not trusting maxlength)
- Collects full D-04 schema including `reactions`, `legendaryActions`, `legendaryActionsPerRound`, `senses`
- `sanitizeHTML()` on all rich-text fields (T-03-06 XSS mitigation)
- `saveUndoState()` BEFORE any `D.bestiary` mutation (CLAUDE.md requirement)
- Create: assigns `nextId('bestiary')`, pushes; Update: finds by `parseEntityId`, replaces in-place
- `afterCrudOperation(renderBestiaryList, 'Kreatur gespeichert')` for render+save+toast

`deleteBestiaryEntry(id)` routes through `deleteWithConfirm` (crud-helpers.js) for consistent Undo + confirmation dialog.

`bestiary-delete` action wired in `BestiaryRenderActions` in `bestiary-render.js` (deviation — see below).

### Task 3 — SC2 E2E Tests (4 tests, all passing)

All 4 SC2 tests un-fixme'd and passing:
- **Kreatur anlegen**: click "+ Neue Kreatur", fill bst-name/bst-cr/bst-hp, save, verify in `D.bestiary` (D-04 schema), activate "Nur Eigene" filter, assert list item + "Eigen" badge
- **Kreatur bearbeiten**: create, select, Bearbeiten button, verify modal title + prefill, change name+AC, save, assert updated in `D.bestiary`
- **Kreatur loeschen**: create, select, delete (auto-accept dialog), assert removed from `D.bestiary` and list
- **Undo loeschen**: create, select, delete, Ctrl+Z, assert restored in `D.bestiary`

Key fix: E2E tests check `D.bestiary` directly (not DOM item count) because VirtualScroll only renders visible rows — adding one entry to 112-item list may not change the rendered row count.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] bestiary-delete action wired in plan-04**
- **Found during:** Task 2 (while wiring SC2 E2E tests for Task 3)
- **Issue:** Plan-05 was supposed to register the `bestiary-delete` action, but SC2 E2E tests (Task 3 of this plan) need it to test deletion now. Without it, the "Loeschen" button in the detail panel would silently do nothing.
- **Fix:** Registered `bestiary-delete` action in `BestiaryRenderActions` inside `bestiary-render.js`. Plan-05 can re-register (EventDelegation last-write-wins is idempotent).
- **Files modified:** `features/bestiary/bestiary-render.js`
- **Commit:** b1b26d0

**2. [Rule 1 - Bug] renderTraitList() cannot handle HTML strings from custom creatures**
- **Found during:** Task 1 (design review before implementation)
- **Issue:** The existing `renderTraitList()` assumed SRD format (`[{name, desc}]` arrays). Custom creatures store traits/actions/reactions/legendary as sanitized HTML strings. Calling `.length` and `.map()` on a string would misrender or throw.
- **Fix:** Added type detection at the top of `renderTraitList()`: if `typeof items === 'string'`, wrap in a `<div>` and run through `renderClickableDice`. Otherwise use the existing SRD array path. No data migration required.
- **Files modified:** `features/bestiary/bestiary-render.js`
- **Commit:** 63b085d

**3. [Rule 1 - Bug] Duplicate cleanupBestiaryEditor function across modules**
- **Found during:** Task 1 (reading plan-01 source)
- **Issue:** Plan-01 stub defined `cleanupBestiaryEditor` as a no-op in `bestiary-render.js` and exported it. Plan-04 defines the real implementation in `bestiary-editor.js`. Build deduplication would comment out one, leaving orphaned code.
- **Fix:** Removed the stub declaration from `bestiary-render.js`; `bestiary-editor.js` (loaded later) provides the canonical export.
- **Files modified:** `features/bestiary/bestiary-render.js`
- **Commit:** 63b085d

## Known Stubs

None. All fields save and reload correctly. SC3 (plan-05 Initiative/Encounter takeover) buttons exist in the detail panel but their actions are stubs (`console.warn` placeholder in plan-03 action handlers) — those are intentionally deferred to plan-05 per roadmap.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: xss-write | features/bestiary/bestiary-crud.js | Rich-text fields (traits/actions/reactions/legendary) written as innerHTML. Mitigated: sanitizeHTML() applied at save time (T-03-06). |
| threat_flag: xss-render | features/bestiary/bestiary-render.js | Custom creature traits/actions rendered as innerHTML via renderTraitList. Mitigated: sanitizeHTML() applied at save time, content is read back from D.bestiary. |

## Self-Check: PASSED

Files created/modified:
- FOUND: D:/AI_CLI/Claude/DnD_Tracker_App_Pro/dnd-tracker-modular/features/bestiary/bestiary-editor.js
- FOUND: D:/AI_CLI/Claude/DnD_Tracker_App_Pro/dnd-tracker-modular/features/bestiary/bestiary-crud.js
- FOUND: D:/AI_CLI/Claude/DnD_Tracker_App_Pro/dnd-tracker-modular/assets/templates/view-bestiary.html
- FOUND: D:/AI_CLI/Claude/DnD_Tracker_App_Pro/dnd-tracker-modular/assets/styles/bestiary.css
- FOUND: D:/AI_CLI/Claude/DnD_Tracker_App_Pro/dnd-tracker-modular/features/bestiary/bestiary-render.js
- FOUND: D:/AI_CLI/Claude/DnD_Tracker_App_Pro/dnd-tracker-modular/tests/e2e/features/bestiary.spec.js

Commits verified:
- 63b085d: feat(03-04): Task 1 — bestiary editor modal + openBestiaryEditor
- b1b26d0: feat(03-04): Task 2 — saveBestiary + deleteBestiaryEntry with Undo

Build: PASS (exit 0, 308 unit tests pass, 9 E2E tests pass / 2 fixme)
