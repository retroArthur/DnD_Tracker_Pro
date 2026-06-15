---
phase: 06-spieler-verwaltung
plan: 02
subsystem: character-management
tags: [inspiration, toggle, stop-propagation, e2e, playwright, css, party]

# Dependency graph
requires:
  - phase: 06-01
    provides: inspiration boolean field on character objects, E2E stub spec
provides:
  - Always-visible clickable inspiration star toggle on every character card
  - toggle-inspiration-stop action handler (stopPropagation + plain save)
  - .char-inspiration-toggle CSS (active/inactive states)
  - Green inspiration.spec.js E2E suite (5/5 tests passing)
affects: [06-03-charakterwerte, 06-04-xp-tracker]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "-stop handler pattern: data-action='toggle-inspiration-stop' prevents edit-char bubble"
    - "Always-visible state button: button element unconditionally rendered, class/glyph vary by state"
    - "No-undo toggle: plain window.save() without saveUndoState per D-02"

key-files:
  created: []
  modified:
    - features/party/party-render.js — renderCharacterCard: conditional ⭐ prefix replaced with always-rendered toggle button
    - assets/styles/party.css — .char-inspiration-toggle + .active + :hover CSS section added
    - ui/actions/entity-actions.js — toggle-inspiration-stop handler in EntityActions character section
    - tests/e2e/features/inspiration.spec.js — all 5 test.fixme converted to test; undo spy counter fixed

key-decisions:
  - "Button is always rendered — only class/glyph varies with ch.inspiration state (D-01: always tappable to grant)"
  - "Handler placed in character section of EntityActions before NPC actions — follows existing grouping convention"
  - "Undo spy counter fix: window.__undoSpyCalls incremented inside spy closure (original Wave-0 stub captured 0 immediately)"

# Metrics
duration: 15min
completed: 2026-06-15
---

# Phase 6 Plan 02: Inspiration-Toggle Summary

**Clickable always-visible star toggle (⭐/☆) on every character card with stop-propagation handler and no-undo plain save, proven by 5 green E2E tests**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-15T22:00:00Z
- **Completed:** 2026-06-15T22:15:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `renderCharacterCard` in `party-render.js` now renders an always-visible `<button class="char-inspiration-toggle">` that shows ⭐ (active) or ☆ (inactive) unconditionally, replacing the conditional `${ch.inspiration ? '⭐ ' : ''}` text prefix — the DM can now tap to grant inspiration even when it is off (D-01)
- `toggle-inspiration-stop` handler added to `EntityActions` in `entity-actions.js`: calls `ctx.event.stopPropagation()` first (prevents `edit-char` bubble from card header), toggles `ch.inspiration`, calls `window.save()` and `window.renderParty()`, shows German toast — no `saveUndoState()` per D-02
- CSS section "INSPIRATION TOGGLE" appended to `party.css`: inline-flex button with no chrome, `var(--text-dim)/opacity:0.6` for inactive state, `var(--gold)/opacity:1` for active state, hover brings both to gold/full opacity
- All 5 E2E tests in `inspiration.spec.js` converted from `test.fixme` to `test` and pass: toggle activation, persistence across reload, stop-propagation (no form open), always-visible, no-undo spy

## Task Commits

1. **Task 1: Always-visible inspiration star + CSS** - `4e5be0b` (feat)
2. **Task 2: toggle-inspiration-stop handler + green E2E** - `b289349` (feat)

## Files Created/Modified

- `features/party/party-render.js` — renderCharacterCard line 175: button element with data-action="toggle-inspiration-stop"
- `assets/styles/party.css` — 27-line INSPIRATION TOGGLE section appended (lines 2466-2496)
- `ui/actions/entity-actions.js` — toggle-inspiration-stop handler added (lines 29-38)
- `tests/e2e/features/inspiration.spec.js` — 5 test.fixme → test; undo spy counter corrected

## Decisions Made

- **Button always rendered, class varies**: The `<button>` element is unconditional; only `class="char-inspiration-toggle${ch.inspiration ? ' active' : ''}"` and the glyph `${ch.inspiration ? '⭐' : '☆'}` vary. Satisfies D-01 "always visible so DM can grant it".
- **Undo spy fix (Rule 1 - Bug)**: Original Wave-0 stub captured `calls=0` into `window.__undoSpyCalls` immediately — the spy closure incremented a local variable that was never reflected in `window.__undoSpyCalls`. Fixed to initialize `window.__undoSpyCalls = 0` and increment it inside the spy function body.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wave-0 undo spy counter not correctly tracking calls**
- **Found during:** Task 2 (reviewing inspiration.spec.js before un-fixme)
- **Issue:** The spy closure set `window.__undoSpyCalls = calls` (=0) before calls could increment, so `undoCallsAfter` would always be 0 regardless of actual saveUndoState calls
- **Fix:** Restructured spy to initialize `window.__undoSpyCalls = 0` then increment it inside the spy function (`window.__undoSpyCalls++`)
- **Files modified:** tests/e2e/features/inspiration.spec.js
- **Commit:** b289349

## Known Stubs

None — all implemented features are wired end-to-end: button renders, handler toggles, CSS styles, tests validate.

## Threat Flags

No new security-relevant surfaces. Button title strings are static German literals (not user data). `esc(ch.name)` continues unchanged for character names (T-06-04 mitigated). Stop-propagation handler verified by E2E test (T-06-05 mitigated).

## Self-Check: PASSED

**Files verified:**
- `features/party/party-render.js` (contains toggle-inspiration-stop) — FOUND
- `assets/styles/party.css` (contains .char-inspiration-toggle.active) — FOUND
- `ui/actions/entity-actions.js` (contains toggle-inspiration-stop handler) — FOUND
- `tests/e2e/features/inspiration.spec.js` (5 tests passing) — FOUND

**Commits verified:**
- 4e5be0b (feat: always-visible inspiration star + CSS) — EXISTS
- b289349 (feat: toggle-inspiration-stop handler + green E2E) — EXISTS
