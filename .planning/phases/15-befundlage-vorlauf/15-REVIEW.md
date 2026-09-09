---
phase: 15-befundlage-vorlauf
reviewed: 2026-09-09T00:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - CLAUDE.md
  - assets/styles/bestiary.css
  - assets/styles/command-palette.css
  - assets/styles/core.css
  - assets/styles/dashboard.css
  - assets/styles/dice.css
  - assets/styles/dmscreen.css
  - assets/styles/editors.css
  - assets/styles/encounters.css
  - assets/styles/initiative.css
  - assets/styles/loot.css
  - assets/styles/migration.css
  - assets/styles/npcs.css
  - assets/styles/party.css
  - assets/styles/pwa.css
  - assets/styles/spells.css
  - assets/styles/tools.css
  - assets/styles/variables.css
  - assets/styles/welt.css
  - assets/templates/modals-editors.html
  - core/constants.js
  - features/dice/dice-core.js
  - features/party/party-render.js
  - package.json
  - tests/e2e/features/computed-style-diff.spec.js
  - tests/e2e/features/design-fixes.spec.js
  - tests/unit/css-usage-report.test.js
  - tests/unit/design-consistency.test.js
  - tools/css-usage-report.js
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-09-09
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

This phase built `tools/css-usage-report.js`, a from-scratch dead-CSS detector, and used it (plus manual review) to delete 5,367 lines of CSS across 18 `assets/styles/*.css` files, one commit per file. It also repaired two real rendering bugs (`features/party/party-render.js` compact spell-slot pips, `features/dice/dice-core.js` crit/fumble state class), removed a dead PWA install banner, and added new test coverage (`computed-style-diff.spec.js`, `design-fixes.spec.js`, plus F-19/F-20/F-21 ratchets in `design-consistency.test.js`).

I verified the two rendering fixes end-to-end (data shape, CSS classes, and the `data-action`/`data-id`/`data-value` contract read by `ui/event-delegation.js` and `ui/actions/combat-actions.js`) and found them correct. The PWA banner removal is also clean: the whitelist entries removed from `core/constants.js` (`installPWA`, `dismissPWABanner`) belonged exclusively to the deleted `data-action="call"` banner markup, and the live install route (`header.html`'s `#pwa-install-btn` → `install-pwa` action → `systems/spellslots/pwa-install.js`) is untouched and does not depend on `CALL_ACTION_WHITELIST`.

However, per the phase brief's explicit instruction to review `tools/css-usage-report.js` "hardest" because "a false 'dead' verdict here means live CSS was deleted": I traced its three-stage liveness detection against every `.className = …` and `containerClass:`-style dynamic-class-assignment call site in the source tree and found a real, already-manifested instance of exactly this failure mode (CR-01 below). It is currently latent (the JS call sites happen to be dead code themselves) but it proves the detector's blind spot is real, not hypothetical, and that the phase's own "mandatory false-positive audit" (which correctly caught and exempted five other instances of the identical pattern) did not catch this one. Since this phase is explicitly a "Vorlauf" measuring scope for further deletion waves, this gap will keep producing incorrect deletions unless addressed before the next wave.

## Critical Issues

### CR-01: css-usage-report's live-token detector misses `.className = <ternary/variable>` and `containerClass:`/`className:` object-key assignments — already caused deletion of referenced CSS

**File:** `tools/css-usage-report.js:186-306` (three-stage liveness detection), manifested in `assets/styles/npcs.css` and `assets/styles/encounters.css` (deleted in this phase's commits)

**Issue:**

The tool recognizes exactly three "Klassen-Kontext" shapes: `class="…"` / `className="…"`, `.className = "…"` (quote must appear *immediately* after `=`/`+=`), and `classList.add/remove/toggle/contains/replace(…)`. It has no path for a `.className` assignment whose value is a ternary or bare identifier, nor for class names passed through an object-literal option key such as `containerClass:`/`className:` (used by this codebase's `SafeRender.list()` and `createElement()` helpers).

Two call sites hit this exactly:

```js
// ui/dom-builder.js:393 (renderNPCListOptimized)
container.className = options.viewMode === 'list' ? 'list-view-container' : 'npc-grid';

// ui/safe-render.js:360 (renderNPCListFast)
containerClass: options.viewMode === 'list' ? 'list-view-container' : 'npc-grid',
```

Neither `'list-view-container'` nor `'npc-grid'` is preceded by a literal string the scanner can anchor on (unlike e.g. `'attr-mod' + (mod > 0 ? ' positive' : ' negative')`, where `'attr-mod'` is captured and protects the compound rule via the Anker rule). I confirmed with `collectLiveTokens()` directly that neither token is captured from these files. As a result, both classes were classified fully dead and their **standalone** rule blocks were deleted in this phase:

```diff
- /* NPC List View */
- .npc-grid {
-     display: grid;
-     grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
-     gap: 16px;
-     align-items: start;
- }
```
(`assets/styles/npcs.css`, present at `4faca38`, gone at `HEAD`)

```diff
- /* Listenansicht Container */
- .list-view-container {
-     display: flex;
-     flex-direction: column;
-     gap: 4px;
- }
```
(`assets/styles/encounters.css`, present at `4faca38`, gone at `HEAD`)

This is the identical failure mode the phase already identified and fixed for the read-aloud color classes (`crimson`/`violet`/`sage`/`sky`/`slate`, `DEAD_EXCEPTIONS` in `tools/css-usage-report.js:84-111`, sourced from `ui/editors/rich-text.js:412`'s `wrapper.className = style === 'parchment' ? 'read-aloud' : \`read-aloud ${style}\`;`) — but that audit was not generalized or re-run against every `.className =`/`containerClass:` call site, so it missed these two.

**Current blast radius:** `renderNPCListOptimized()` (`ui/dom-builder.js`) and `renderNPCListFast()` / `renderEncounterListFast()` (`ui/safe-render.js`, which also assigns `containerClass: 'enc-grid'` — a class with no CSS rule at all, pre-existing and unrelated to this phase's deletions) are not called from anywhere in the source tree today, so there is no active user-facing regression yet. But: (a) `npc-grid` is *still* listed as a dead class in the tool's own current `--check` output (confirmed by running `node tools/css-usage-report.js --check`) — it was never resolved, only its standalone rule was silently deleted while a same-named class survives incidentally in an unrelated comma-selector list in `dashboard.css:577`; and (b) `list-view-container` has now vanished from the CSS entirely, so it no longer even appears in the tool's report — the mistake is no longer visible to the tool that made it. Any future re-enablement of these (currently orphaned but clearly production-intended, "*Fast"/"*Optimized" performance-path) functions will silently render unstyled.

**Fix:**

1. Restore the two deleted rule blocks (or explicitly decide to delete the dead JS alongside the CSS in one reviewed change, not as a side effect of the automated tool).
2. Extend `collectLiveTokens()` to also treat `containerClass:`/`className:` object-literal keys as class contexts, and to fall back to scanning *all* string/template literals inside a `.className = <expr>;` statement (not just an immediately-following quote) for candidate class tokens — mirroring the reasoning already written into the `DEAD_EXCEPTIONS` comment block, but applied mechanically instead of case-by-case.
3. Until (2) lands, add `npc-grid` and `list-view-container` to `DEAD_EXCEPTIONS` (or, better, restore them) so the report's own history doesn't keep hiding this class of miss going into the next deletion wave.

## Warnings

### WR-01: `CLASS_LIST_CALL_RE` truncates at the first `)`, silently dropping later class-name literals

**File:** `tools/css-usage-report.js:195`
**Issue:** `const CLASS_LIST_CALL_RE = /classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)/g;` uses `[^)]*`, so any `classList.*()` call whose argument list contains a nested parenthesized expression *before* a literal class name (e.g. `classList.toggle(computeName(x), 'active')`) would have its capture group truncated at the first `)`, silently losing everything after it. No current call site in the reviewed scan trips this (all found calls put the literal class name first), so this is not yet a proven false-dead case — but it is a real robustness gap in a tool whose entire purpose is to gate irreversible CSS deletion, and the next deletion wave may introduce or encounter such a call.
**Fix:** Replace the naive bracket-exclusion capture with a balanced-parenthesis scan (same style as `scanClassContextValue`'s `${…}` depth tracking), or at minimum add a regression test pinning the current blind spot so a future change to call conventions doesn't silently regress it further.

### WR-02: `renderCompactSpellSlots()` duplicates `renderSpellSlotPips()` almost verbatim

**File:** `features/party/party-render.js:308-354` (new/rewritten in this phase) vs. `systems/spellslots/spellslots-ui.js:59-92` (pre-existing, itself unused/dead — no callers found in the source tree)
**Issue:** The repaired function reproduces the cantrip-counter block, the per-level pip loop, the exact `data-action="toggle-spell-slot-stop"`/`data-id`/`data-value` wiring, and the `.spell-slots-compact`/`.slot-pip` markup of `renderSpellSlotPips()` almost line for line (the code comments even call the latter the "Zielmuster"/target pattern). Any future change to the spell-slot pip contract (markup, action name, attribute names, CSS classes) now has two call sites to keep in sync, and nothing enforces that.
**Fix:** Extract the shared pip-rendering logic into one function taking `(charId, spellSlots)` and have both `renderCompactSpellSlots()` and `renderSpellSlotPips()` call it, or have `renderCompactSpellSlots()` call `renderSpellSlotPips(ch.id)` directly (it already fetches character data by id, so the initializing side effect of `getSpellSlots()` is the only difference to reconcile — worth resolving explicitly rather than duplicating around it).

## Info

### IN-01: `npm run css-usage:check` is not currently green and is not wired into CI

**File:** `package.json:27-28`, `tools/css-usage-report.js:611-619`
**Issue:** Running `node tools/css-usage-report.js --check` today reports 204 dead classes outside `DEAD_EXCEPTIONS` (exit code 1). This is expected for a phase explicitly scoped as measurement/prep for later deletion waves, and the two new scripts are not referenced by `npm run check`, `npm test`, or CI — so this doesn't block anything today. Flagging only so it's not mistaken later for a regression: the non-zero exit is the current, intended baseline, not a broken gate.
**Fix:** None required now; when a later phase wires `css-usage:check` into CI, it should assert against the then-current baseline count rather than expecting zero immediately.

---

_Reviewed: 2026-09-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
