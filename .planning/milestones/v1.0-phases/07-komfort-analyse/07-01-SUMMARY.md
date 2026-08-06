---
phase: 07-komfort-analyse
plan: "01"
subsystem: foundation
tags: [idb, dice-stats, soundboard, tab-registry, wave-0]
dependency_graph:
  requires: []
  provides:
    - IDB v4 with audioBlobs + diceStats stores
    - window.statsIdbPut / window.getAllStats / window.getStatsForSession
    - window._currentSessionId (boot-time session ID for D-05 filter)
    - addToDiceHistory() stats tee (D-04)
    - Soundboard tab + view section + skeleton modules (4 files)
    - Dice-Statistiken tab + view section + render skeleton
    - TAB_RENDER_REGISTRY entries: soundboard + dicestats
    - Wave-0 test stubs (4 files, 8 todos)
  affects:
    - features/dice/dice-core.js (addToDiceHistory augmented)
    - core/init.js (IDB_VERSION bumped, 2 new stores)
    - systems/tab-registry.js (2 new entries)
    - loader.js + build.py (6 new modules, lists in sync)
tech_stack:
  added:
    - IndexedDB v4 (audioBlobs, diceStats stores)
    - Web Audio API skeleton (soundboard-player.js reserves module scope)
  patterns:
    - IDB onupgradeneeded guard pattern (reused from systems/backups.js)
    - typeof window.statsIdbPut guard (fire-and-forget tee, D-04)
    - TAB_RENDER_REGISTRY registration (systems/tab-registry.js pattern)
    - Wave-0 test.todo / test.skip stub pattern
key_files:
  created:
    - features/dice-stats/dice-stats-idb.js
    - features/dice-stats/dice-stats-render.js
    - features/soundboard/soundboard-idb.js
    - features/soundboard/soundboard-player.js
    - features/soundboard/soundboard-crud.js
    - features/soundboard/soundboard-render.js
    - tests/unit/dice-stats.test.js
    - tests/unit/soundboard.test.js
    - tests/e2e/features/soundboard.spec.js
    - tests/e2e/features/dice-stats.spec.js
  modified:
    - core/init.js
    - features/dice/dice-core.js
    - loader.js
    - build.py
    - assets/templates/header.html
    - assets/templates/view-tools.html
    - assets/styles/tools.css
    - systems/tab-registry.js
    - systems/spellslots/navigation.js
decisions:
  - "Boot-time sessionId (Date.now().toString()) as window._currentSessionId — not in D (RESEARCH A6, Open Question 2)"
  - "No const audioContext at module level in soundboard-player.js skeleton — reserves RESEARCH Pitfall 5 avoidance for 07-02"
  - "statsIdbPut uses store.add() (autoIncrement) not store.put() — avoids accidental ID conflicts"
  - "Both soundboard and dicestats nav buttons placed after Fraktionen button (logical grouping)"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-20"
  tasks_completed: 3
  files_modified: 9
  files_created: 10
---

# Phase 7 Plan 01: IDB v4 Foundation + Tab Scaffolding Summary

One-liner: IDB bumped to v4 with audioBlobs + diceStats stores; roll-capture tee via typeof guard; six skeleton modules and two new tabs registered; four Wave-0 test stubs created.

## What Was Built

### Task 1: IDB v4 upgrade + addToDiceHistory stats tee (commit 691080a)

- `core/init.js`: `IDB_VERSION` bumped 3 → 4; `audioBlobs` store (`keyPath: 'id'`) and `diceStats` store (`keyPath: 'id', autoIncrement: true`) added inside existing `onupgradeneeded` guard blocks. Both protected by `if (!db.objectStoreNames.contains(...))` so re-open is idempotent (RESEARCH Pitfall 3 / T-07-IDB-VERSION).
- `features/dice-stats/dice-stats-idb.js`: Real IDB helper module (not a stub — the hook depends on it). Exports `statsIdbPut` (fire-and-forget add), `getAllStats`, `getStatsForSession` (Promise, resolve `[]` on error). Sets `window._currentSessionId = Date.now().toString()` at module eval time.
- `features/dice/dice-core.js`: `addToDiceHistory()` augmented with D-04 tee — calls `window.statsIdbPut(...)` behind `typeof window.statsIdbPut === 'function'` guard after `renderDiceHistory()`. In-memory `diceHistory.unshift(...)` unchanged (D-04a). No `var X = window.X` alias (dedup compliance).

### Task 2: Module skeletons + registration (commit 259d62b)

Five skeleton modules created (real impl in 07-02/03/04):
- `features/soundboard/soundboard-idb.js` — placeholder saveSoundBlob/getSoundBlob/deleteSoundBlob/listSoundBlobs
- `features/soundboard/soundboard-player.js` — placeholder initSoundboardPlayer/activateSoundScene/toggleSoundboardMute; no `const audioContext` (RESEARCH Pitfall 5)
- `features/soundboard/soundboard-crud.js` — placeholder createSoundScene/deleteSoundScene/saveSoundScene
- `features/soundboard/soundboard-render.js` — `renderSoundboard()` with defensive `$('soundboard-container')` check
- `features/dice-stats/dice-stats-render.js` — `renderDiceStats()` with defensive `$('dicestats-container')` check

All six modules (including `dice-stats-idb.js` from Task 1) registered in `build.py` and `loader.js` in matching order after Dice block. Build exits 0 with module-sync OK, no [DEDUP] SyntaxError.

nav buttons added to `header.html`: `data-view="soundboard"` (🔊 Soundboard) and `data-view="dicestats"` (📊 Statistiken).

View sections added to `view-tools.html`: `#view-soundboard` with `#soundboard-container`, `#view-dicestats` with `#dicestats-container`.

CSS stub sections added to `tools.css` (comment headers SOUNDBOARD / DICE STATS — real rules in 07-02/07-04).

`TAB_RENDER_REGISTRY` in `systems/tab-registry.js` extended with `soundboard` → `renderSoundboard` and `dicestats` → `renderDiceStats`.

Mobile `viewNames` map in `systems/spellslots/navigation.js` extended with `soundboard: '🔊 Soundboard'` and `dicestats: '📊 Statistiken'`.

### Task 3: Wave-0 test stubs (commit d5ab338)

Four files created with exact VALIDATION `-t`/`-g` strings:
- `tests/unit/dice-stats.test.js`: `test.todo` for histogram 20 bars (UX-02c), expected overlay (UX-02d), crit rate (UX-02e), fumble rate (UX-02f), session filter (UX-02g), character breakdown (UX-02h), size warning (UX-01f duplicate in dice-stats for convenience)
- `tests/unit/soundboard.test.js`: `test.todo` for size warning (UX-01f)
- `tests/e2e/features/soundboard.spec.js`: ESM `import { test, expect }`, `test.skip` for soundboard tab renders (UX-01a), import audio file (UX-01b), audio blob persists after reload (UX-01c), scene quickslot keyboard (UX-01e)
- `tests/e2e/features/dice-stats.spec.js`: ESM `import { test, expect }`, `test.skip` for dice stats tab renders (UX-02a), rolls captured in IDB (UX-02b)

All run neutrally: `npx jest` shows 8 todos, 0 errors. No `require(`, no `http://localhost`.

## Verification Results

- `PYTHONIOENCODING=utf-8 python build.py` exits 0; 123 modules; module-sync OK; no [DEDUP] SyntaxError
- `npm run test`: 421 passed, 8 todo, 21 suites — all green
- `grep "const IDB_VERSION = 4" core/init.js` matches
- `grep -c "audioBlobs\|diceStats" core/init.js` = 5 occurrences
- `grep -n "window.statsIdbPut" features/dice/dice-core.js` = lines 440–441 (typeof guard + call)
- `grep -c "features/soundboard/\|features/dice-stats/" loader.js` = 6
- `grep -c "features/soundboard/\|features/dice-stats/" build.py` = 6
- `grep -c "data-view=\"soundboard\"\|data-view=\"dicestats\"" header.html` = 2
- E2E specs: no `require(` (confirmed via grep -L)

## Deviations from Plan

None — plan executed exactly as written.

The `dice-stats-idb.js` registration in Task 2 is noted as "Task 1 created, Task 2 registers" — this matches the plan's explicit instruction ("Register it too, so SIX soundboard/dice-stats module entries total").

## Known Stubs

The following render functions are intentional stubs (placeholder HTML only):
- `features/soundboard/soundboard-render.js` `renderSoundboard()` — fills `#soundboard-container` with placeholder text; 07-02 will replace with full Soundboard UI
- `features/dice-stats/dice-stats-render.js` `renderDiceStats()` — fills `#dicestats-container` with placeholder text; 07-04 will replace with SVG histogram + stats UI
- `features/soundboard/soundboard-idb.js` — all functions return Promise.resolve(); 07-02 fills in IDB operations
- `features/soundboard/soundboard-player.js` — all functions are no-ops; 07-02 fills in Web Audio API engine
- `features/soundboard/soundboard-crud.js` — all functions are no-ops; 07-02 fills in scene CRUD

These stubs are intentional and documented — the plan's goal is scaffolding for 07-02/03/04. The tabs are reachable and render defensive placeholders as required.

## Threat Flags

None beyond what was documented in the plan's threat model. T-07-NOTATION-XSS (notation strings rendered as HTML) is deferred to 07-04's `renderDiceStats` implementation — recorded in dice-stats.spec.js Wave-0 stub comment.

## Self-Check: PASSED

All 10 created files confirmed present. All 3 task commits verified in git log:
- 691080a: feat(07-01) IDB v4 upgrade + addToDiceHistory stats tee
- 259d62b: feat(07-01) module skeletons + build/loader/header/CSS/registry wiring
- d5ab338: test(07-01) Wave-0 test stubs — 4 Dateien
