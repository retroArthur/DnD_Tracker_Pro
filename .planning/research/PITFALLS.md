# Pitfalls Research

**Domain:** Offline-first vanilla-JS D&D 5e campaign manager (single bundled HTML, file:// primary, Windows/Chromium, non-ESM global scope, Python build pipeline)
**Researched:** 2026-06-11
**Confidence:** HIGH (Part A — direct code evidence from CONCERNS.md + codebase inspection; Part B — verified against official MDN/Chrome docs + SRD licensing sources)

---

## Part A — Stabilization Pitfalls

### Pitfall A1: Feature Removal Leaves a Web of Hidden Residue Across Orthogonal Files

**What goes wrong:**
A feature is deleted from its main module(s) but references survive in files that are conceptually unrelated: a debug tool, a seed-data template, type declarations, generated CSS artifacts, test fixtures, and documentation. When the app initializes, the first surviving reference causes a `ReferenceError` that aborts the entire script-load chain. Every subsequent error in the console is a red herring — the root cause is at line 1 of the broken file, not the end.

This is the *exact* current failure: `tools/debug.js:99` assigns `const clearAllNodes = clearMindmap` — a reference to the removed Mindmap feature — and the script load abort prevents the app from booting at all. The residue map is wider than the crash site:

- `tools/debug.js:99` — **active crash site** (global ReferenceError)
- `systems/campaign-manager/campaign-manager.js:35,111` — seeds `mindmap: { nodes: [], connections: [] }` into every new campaign forever
- `types/globals.d.ts:128-406`, `types/entities.d.ts:510` — declare dead types (misled typecheck passes silently because `checkJs: false`)
- `assets/styles-purged.css` — 300+ lines of `.mindmap-*` CSS tracked as a generated artifact
- `tests/setup.js:49,395`, `tests/unit/stability.test.js:25` — fixture data includes `mindmap` key; tests may pass while exercising dead paths
- `CLAUDE.md:81,129,152,336-344` — documents the removed feature as present and current

**Why it happens:**
Non-ESM global-scope architectures have no import graph. Static analysis tools can detect unused variables in module systems but cannot follow the web of string references, `window.X` assignments, type files, and documentation files. Removal is manual and grep-driven; files outside the feature directory are easy to forget.

**How to avoid:**
1. Before removing any feature, run a repo-wide grep for the feature's primary symbols AND its data-key names in all file types: `*.js`, `*.d.ts`, `*.css`, `*.html`, `*.json`, `*.md`, `*.py`.
2. Create a removal checklist before touching any code: (a) main feature files, (b) data seed/schema, (c) CSS, (d) type declarations, (e) test fixtures and mocks, (f) debug/dev tools, (g) documentation.
3. Run the bundle (`python build.py`) and open it in a browser immediately after each deletion step — runtime ReferenceErrors surface only at load time, not via lint or typecheck in this architecture.
4. After removal, add a CI grep that asserts the removed symbol name never appears in the source tree.

**Warning signs:**
- Console error on startup with `is not defined` for a symbol that used to exist
- Lint passes cleanly but app does not boot (`no-undef` is currently a warning, not an error, and has a 50-warning budget)
- `npm run check` shows green but `npm run build` + browser open shows crash
- Type declarations for a module whose file no longer exists

**Phase to address:** Stabilization (Phase 1) — this is the immediate blocker. The feature-removal checklist should be applied to Mindmap residue first, then codified as a permanent procedure.

---

### Pitfall A2: Dual-Maintained Module Lists Silently Diverge Between Dev and Prod

**What goes wrong:**
The 92-module load order lives in two places: `loader.js` (dev mode) and `build.py` (production bundling). When a module is added to only one list, dev mode works and tests pass, but production builds silently omit that module. `build.py:409` logs a warning for a missing file and continues — a typo'd path produces a build that is missing a module with no failure.

The converse is also dangerous: a module added only to `build.py` works in production but causes `X is not a function` in dev mode, making local debugging impossible for that feature.

**Why it happens:**
The lists are close but not identical — they use different path conventions and are maintained by hand. There is no automated assertion that they match.

**How to avoid:**
Make `build.py` parse the `MODULES` array out of `loader.js` at build time (single source of truth). Until that refactor, add a CI step that diffs the two lists and fails if they diverge. Also convert the `NICHT GEFUNDEN` warning in `build.py:409` to a hard error — a missing module is always a build failure, never a warning.

**Warning signs:**
- Feature works in dev but not in the production bundle (or vice versa)
- `NICHT GEFUNDEN` in build output treated as acceptable noise
- PR adds a new module file but `loader.js` and `build.py` are not both modified

**Phase to address:** Stabilization (Phase 1) — add the diff check before any new modules are introduced in tech-foundation.

---

### Pitfall A3: Regex-Based Debug Flag Flip Silently Ships DEBUG_MODE: true in Production

**What goes wrong:**
`build.py:421` flips debug flags with `js_combined.replace("DEBUG_MODE: true,", "DEBUG_MODE: false,", 1)`. This is an exact string match including spacing and trailing comma. If Prettier or a manual edit changes the spacing in `core/config.js:10` (e.g., removes trailing comma, adds a space, or reformats the object), the replacement silently finds zero occurrences and the production bundle ships with `DEBUG_MODE: true` and `DEBUG_VALIDATE_ON_SAVE: true`. The consequences are: validation overhead on every save, console warnings in prod, and stack-trace generation on every missed `$()` lookup.

Currently `core/config.js:10` reads `DEBUG_MODE: true,` with that exact formatting — safe. But format constraints are invisible to contributors.

**How to avoid:**
After the `replace()` call, add an assertion: `assert "DEBUG_MODE: true" not in js_combined` and abort the build if it fires. This is a one-line guard with zero ongoing maintenance cost. Document the exact string dependency in both `build.py` and `core/config.js` with a comment.

**Warning signs:**
- `DEBUG_MODE: true` appears in the `dist/` output file
- Production build is noticeably slower than expected (validation overhead)
- Browser console shows debug warnings on the production bundle
- Prettier config or `.editorconfig` changes trailing-comma rules

**Phase to address:** Stabilization (Phase 1) — add the post-replace assertion before the first production build is cut.

---

### Pitfall A4: build.py Pass 3 Leaves Orphaned Function Bodies That Pass Static Validation

**What goes wrong:**
`remove_duplicate_functions()` (`build.py:176-228`) comments out only the duplicate `function X(` declaration line but emits the function body as top-level orphaned statements. The brace-counting logic correctly computes the body range but never uses it to skip those lines. The result is a `SyntaxError: Illegal return statement` that only surfaces at runtime — the post-build validation passes because it checks for duplicate declarations, not orphaned code.

The known incident (2026-01-10, `toggleNPCCard`) matched this exact pattern. Currently safe because the one active duplicate set (`testable-utils.js`) is excluded from the bundle, but this is a latent failure mode for any future duplicate function name introduced across two source modules.

**How to avoid:**
Either fix Pass 3 to skip body lines using the computed brace range (the range is already computed — it just needs to drive a skip), OR replace Pass 3 entirely with a pre-build check that fails the build when duplicate top-level function names are found in source files. The pre-build check is simpler and catches the problem before it enters the bundle. Add a test for the orphaned-body case in `tests/build/`.

**Warning signs:**
- `SyntaxError: Illegal return statement` in the browser console on a fresh build
- `[DEDUP] Removed duplicate function: X` in build output followed by lines that look like a function body
- Two source files contain a top-level function with the same name

**Phase to address:** Stabilization (Phase 1) — fix before any new modules that might introduce duplicate names.

---

### Pitfall A5: Stale Documentation Actively Misleads AI-Assisted and Human Development

**What goes wrong:**
`CLAUDE.md` (the primary AI guidance file, loaded into every Claude session) contains multiple verified contradictions with the actual codebase:

- Claims "~146 inline event handlers remain" — actual count is 0 (migration completed May 2026)
- States "No execCommand" as a convention — 21 `document.execCommand` calls exist in production
- References `features/shops/spell-editor.js` and `features/network/mindmap.js` — neither file exists
- States campaign index key is `dnd-campaign-index` — actual key is `dnd-tracker-campaigns`
- Documents Mindmap/Network as a current, working feature

When an AI agent reads stale guidance and then reads the code, it faces conflicting signals. The common failure mode is: agent follows the documentation (because it is labeled authoritative), generates code that references dead files or uses wrong key names, and the error only surfaces at runtime.

**How to avoid:**
Treat CLAUDE.md as production code: update it in the same commit as the code changes it describes. Add a stabilization pass that audits every claim in CLAUDE.md against the actual code. Mark completed roadmap items as done. Delete references to removed files. Correct wrong constants. Add a CI check that verifies key string constants mentioned in documentation (e.g., `APP_CONFIG.CAMPAIGNS_KEY`) actually match their source definitions.

**Warning signs:**
- CLAUDE.md mentions files that do not exist (`find . -name "X.js"` returns nothing)
- Constants in documentation differ from `core/config.js`
- Roadmap items marked as "Partial" for work that was actually completed
- AI-generated code references removed symbols or dead paths

**Phase to address:** Stabilization (Phase 1) — documentation audit is a required deliverable of the stabilization phase, not a nice-to-have.

---

### Pitfall A6: "npm run check" Green Does Not Mean "App Works"

**What goes wrong:**
The CI chain (lint, typecheck, jest, build) passes while the app fails to boot in a browser. This happens because:

1. `no-undef` is a warning (not error) with a 50-warning budget — real undefined globals hide in the budget
2. `tsconfig.json` has `checkJs: false` — TypeScript never inspects actual JS source bodies
3. Unit tests exercise `testable-utils.js` (copies of production functions) not production code — a regression in `esc()` passes the security test suite
4. Playwright E2E is not in CI — UI regressions are invisible
5. The build validation is static regex — runtime SyntaxErrors only surface in a browser

The current failure (`clearMindmap is not defined`) is invisible to all automated checks.

**How to avoid:**
Add a minimal smoke test to CI: build the bundle, open it with Playwright/headless Chromium, assert no console errors during init, assert at least one tab renders. This single test would have caught the current crash. Separately: harden lint (`no-undef: error`, remove the 50-warning budget for undefined globals specifically), and add `checkJs: true` incrementally per directory.

**Warning signs:**
- All CI checks pass but the app fails to load in a browser
- Console shows errors that are not in any test's assertion surface
- A function referenced in `systems/tab-registry.js` was renamed but tests still pass (registry uses string names resolved on `window`)

**Phase to address:** Stabilization (Phase 1) — a browser smoke test against the dist bundle should be the final stabilization gate.

---

### Pitfall A7: The Autosave Gate Silently Disables All Persistence

**What goes wrong:**
Both `save()` and `saveImmediate()` begin with `if (autosaveToggle && !autosaveToggle.checked) return` (`persistence.js:10-14,110-113`). If any DOM element with `id="autosave-toggle"` is present and unchecked, **all saves silently no-op** — including the "immediate" saves that should always fire after destructive operations (delete, undo). The element is currently absent from the UI, so the gate is dormant. But if a future feature accidentally introduces an element with that ID (or the DM Screen widget system injects one), all campaign data becomes impersistent without any error message.

**How to avoid:**
Separate the autosave-toggle gate from `saveImmediate()` entirely. `saveImmediate()` should always persist critical operations; only `save()` (the debounced background save) should respect the toggle. Add an E2E test that verifies data persists when no `autosave-toggle` element exists AND when one exists but is unchecked.

**Warning signs:**
- User reports "my data disappeared after closing the tab" without any error
- A new widget or template introduces `id="autosave-toggle"` without realizing the consequence
- `saveImmediate()` calls in delete functions return without executing any storage write

**Phase to address:** Stabilization (Phase 1) — fix the gate logic before adding features that might introduce new DOM elements.

---

## Part B — Feature Pitfalls

### Pitfall B1: Service Workers Cannot Register on file:// — PWA Requires a Served Origin

**What goes wrong:**
The primary usage mode is `file://` — opening the bundled HTML by double-click. Service Workers are blocked on `file://` by the browser security model (same-origin policy; file URLs have no viable origin mapping). `navigator.serviceWorker.register()` throws or silently fails on `file://` in all major browsers. This means:

- The current `sw.js` registration call fails silently on every double-click open
- PWA installation (the planned tech-foundation feature) requires the app to be served from `https://` or `http://localhost`
- After installing as a PWA, the app runs from a synthetic origin — all existing `localStorage` data under the `file://` origin is in a **different storage partition** and is invisible to the installed PWA

The data-migration problem is the most dangerous: a user who has months of campaign data in `file://`-origin localStorage will see an empty app after installing the PWA, with no error message.

**How to avoid:**
1. PWA installation is the *correct structural solution* — not a nice-to-have. Plan it as the foundation that unlocks all other features requiring a real origin.
2. Write a one-time data migration routine: on first PWA launch, detect empty storage, offer to import from a JSON export file (since direct cross-origin localStorage access is impossible), guide the user through the migration.
3. Keep the `file://` double-click path working as a fallback (app functions without SW caching) — just do not show a broken install prompt in that mode. Guard SW registration: `if ('serviceWorker' in navigator && location.protocol !== 'file:') { ... }`.
4. Document clearly in the UI that "Install App" requires opening via a local server or the installed shortcut.

**Warning signs:**
- Console shows `SecurityError: Failed to register a ServiceWorker` on `file://` open (currently swallowed silently)
- User installs PWA and sees no data (orphaned in file-origin localStorage)
- `sw.js:4` `CACHE_NAME = 'dnd-tracker-v2'` diverges from `APP_CONFIG.SW_CACHE_NAME` — the SW cannot read APP_CONFIG so cache version drift is manual

**Phase to address:** Tech-Foundation / PWA phase. Must include the cross-origin data migration flow before publishing install guidance.

---

### Pitfall B2: Installed PWA Serves Stale Cached Version — User Sees Old App After Update

**What goes wrong:**
When a Service Worker update is available, the new SW waits in `waiting` state until all open tabs are closed. If `skipWaiting()` is called without user consent, the new SW activates while open windows are still running assets from the old SW — causing asset version mismatches, broken references, and "the site went weird" reports. If `skipWaiting()` is *not* called, the user sees the old version indefinitely because they never close all tabs.

For a single-file app where everything is one HTML file, the mismatch risk is lower than multi-asset apps — but the "sees old app forever" problem is real, especially since the current SW pre-caches `assets/body.html` (a stale placeholder) and runtime-caches templates only on first fetch.

**How to avoid:**
1. Show a visible "App-Update verfügbar — Neu laden?" toast when a new SW is in `waiting` state. Call `skipWaiting()` only after the user clicks the reload button, then reload the page.
2. Fix `sw.js` to cache `assets/templates/*.html` (the real templates) in the install event, not `assets/body.html`.
3. Every time the bundle changes, bump `CACHE_NAME` — wire this to the app version number to make it impossible to forget.
4. Add the SW cache-name to the stabilization checklist: `APP_CONFIG.SW_CACHE_NAME` and `sw.js:4` must match.

**Warning signs:**
- User reports feature is "still broken" after you deployed a fix
- `sw.js CACHE_NAME` and `APP_CONFIG.SW_CACHE_NAME` have diverged
- `assets/body.html` is still in the `STATIC_ASSETS` pre-cache list
- No "update available" notification exists in the UI

**Phase to address:** Tech-Foundation / PWA phase. Cache strategy and update flow must be implemented together, not as afterthoughts.

---

### Pitfall B3: File System Access API Permissions Expire on Session End — Write Access Requires User Gesture on Every Reload

**What goes wrong:**
The File System Access API (planned for automatic file-based backup) is Chromium-only. A directory `FileSystemDirectoryHandle` can be stored in IndexedDB and survives page reload, but write permission does **not** persist automatically across sessions. On the next page load, calling `handle.createWritableStream()` throws `NotAllowedError` without first calling `handle.requestPermission({ mode: 'readwrite' })` from a user gesture. An app that calls `requestPermission()` in `init()` (outside a user gesture) will always be denied.

The sequence must be: user clicks a button → inside that click handler → call `requestPermission()` → if granted, proceed with write.

**How to avoid:**
1. Store the directory handle in IndexedDB after first user selection.
2. On app init, call `handle.queryPermission({ mode: 'readwrite' })` to check status — do NOT call `requestPermission()` here (no user gesture).
3. In the auto-backup tick: if permission is `'granted'`, write silently. If `'prompt'`, show a toast "Backup-Ordner benötigt erneute Freigabe — klicken zum Freigeben" with a button that calls `requestPermission()`.
4. If `'denied'`, disable the auto-backup and inform the user.
5. Always wrap File System writes in try/catch for `NotAllowedError`.

**Warning signs:**
- Auto-backup silently stops working after the user reopens the browser
- `requestPermission()` called in `init()` or `setInterval()` callback — always fails (no user gesture)
- No fallback when permission is revoked
- Code assumes persistent permission after first grant

**Phase to address:** Tech-Foundation / Datei-Backup-Sync phase.

---

### Pitfall B4: Embedding Full SRD Monster JSON Bloats the Single HTML File by ~630KB

**What goes wrong:**
The SRD 5.1/5.2 monster data (BTMorton/dnd-5e-srd canonical JSON) is ~631KB for ~334 monsters. The current bundled app is ~1.28MB. Embedding the full monster dataset inline in the HTML bundle produces a ~1.9MB file. In a `file://` context with no HTTP compression, the browser parses this as one synchronous payload. Larger concerns:

- Unminified SRD JSON adds ~630KB (minified saves ~20-30%)
- Adding custom-monster user data on top of this pushes toward the 5MB localStorage limit faster
- JSON.stringify(D) on every save becomes measurably slower when D contains 334+ statblocks
- Future SRD 5.2 data (more monsters, more fields) is larger

The temptation during implementation is to embed the data in a JS file that gets concatenated by `build.py` — this is the path of least resistance but the wrong choice.

**How to avoid:**
Store SRD monster data separately from campaign data:
1. Embed a minified, read-only monster lookup object in the bundle (names + CR + type only, for search/filter) — ~50KB instead of ~630KB.
2. Load full statblocks lazily from a companion JSON file using `fetch()` (or File System Access API once available) on first access, caching in IndexedDB — not in `D`, not in localStorage.
3. Never include SRD reference data in the `JSON.stringify(D)` snapshot used for saves, undo history, or exports.

**Warning signs:**
- `D.monsters = [...]` contains hundreds of entries (SRD data mixed into campaign state)
- Build output exceeds 1.5MB
- Undo history memory spikes after viewing the monster compendium
- Save times increase after adding the bestiary tab

**Phase to address:** Monster-Kompendium / Bestiary phase (Part C). The architecture decision (separate data vs. embedded) must be made before writing a single line of bestiary code.

---

### Pitfall B5: SRD Licensing — The German Translation Trap

**What goes wrong:**
There are two distinct German D&D SRD sources with different licensing:

**Source 1: Official WotC German SRD (CC-BY 4.0)** — Released by Wizards of the Coast, covers SRD 5.1 content in German. Available at openrpg.de (via dnddeutsch.de community conversion project). License: Creative Commons BY 4.0. Use is unrestricted for apps, including commercial use, with attribution. SRD 5.2 German localization was announced but not yet released as of mid-2025.

**Source 2: dnddeutsch.de community SRD (OGL 1.0a)** — The website at `dnddeutsch.de/srd/` includes content translated under OGL 1.0a with a copyright notice crediting Ulisses Spiele GmbH (the former German D&D licensee). Derivative works of Ulisses Spiele's translations carry their copyright and are NOT freely usable without Ulisses Spiele's specific permission. The OGL requires including a copy of the license and identifying Open Game Content.

**The trap:** The app already contains "deutsche SRD-Zauber" (German SRD spells). If those were copied from a community translation under OGL rather than from the official WotC CC-BY German SRD, the licensing is ambiguous. Non-SRD content (unique setting monsters, trademarked names, etc.) cannot be distributed under any open license.

**How to avoid:**
1. Use ONLY the official WotC German SRD (CC-BY 4.0) — not community translations whose provenance is unclear.
2. Verify the provenance of existing German spell data in the app. If it came from an unofficial source, replace with official CC-BY content before any public distribution.
3. For new monster data (Bestiary phase): use the SRD 5.2 English data (CC-BY 4.0, confirmed released April 22, 2025) with your own German translations, OR wait for the official WotC German SRD 5.2 localization.
4. Never copy stat text from the published D&D core rulebooks — only SRD content is licensed.
5. Attribution is required: include a CC-BY 4.0 attribution notice in the app.

**Warning signs:**
- Existing German spell/monster text cannot be traced to the official WotC CC-BY PDF
- App distributes monster names or lore that exist only in non-SRD WotC products
- No attribution text for SRD content anywhere in the app

**Phase to address:** Stabilization (audit existing spell data) + Monster-Kompendium phase (data sourcing decision before implementation).

---

### Pitfall B6: LocalStorage 5MB Limit + Stale-Shadowing Bug = Silent Data Loss at Scale

**What goes wrong:**
The app uses a single JSON key in localStorage for the entire campaign. The known data-loss path is:

1. Campaign grows past 5MB serialized
2. `save()` switches to IndexedDB-only (the `LS_LIMIT_MB` threshold in `persistence.js:33-40`)
3. The **old** sub-5MB localStorage snapshot is never removed/overwritten
4. On reload, `load()` reads localStorage FIRST, finds the old snapshot, and never falls back to the newer IndexedDB state — because `if (!s)` only triggers when localStorage returns null
5. User silently loses all changes made after the 5MB threshold

This is a critical data-loss bug that exists TODAY. It is not a theoretical future problem.

Additionally: roll history for dice statistics (planned feature) generates high-frequency appends. Each roll appended to an in-memory array and included in every `JSON.stringify(D)` snapshot adds to the serialization cost quadratically (snapshot-on-every-undo includes the full roll history).

**How to avoid:**
Fix the stale-shadowing bug before roll history or other append-heavy features are added:
1. When switching to IDB-only saves, write a sentinel value to localStorage: `localStorage.setItem(key, '__IDB_ONLY__')` (or delete the key entirely).
2. At load: if localStorage contains the sentinel (or nothing), load from IndexedDB.
3. Store roll history separately from campaign state — use a dedicated IndexedDB object store, never include it in `D` or in undo snapshots.
4. Add a persistence unit test: mock >5MB serialized size, save, reload, assert the loaded data matches the saved data.

**Warning signs:**
- Campaign data reverts to an earlier state after reload when campaign is large
- localStorage contains campaign data older than the IndexedDB entry
- Roll history is stored in `D.rolls[]` or similar (included in saves and undo)

**Phase to address:** Stabilization (fix the stale-shadowing bug) + Würfel-Statistiken phase (roll history must use separate storage).

---

### Pitfall B7: Global State Schema Migrations Break Old Exports Without a Version Guard

**What goes wrong:**
The app's export/import version check has a known bug: `quick-roll.js:133` stamps exports with `_version: '2.11'` instead of `APP_CONFIG.VERSION` (`'2.6.0'`). Since `compareVersions('2.11', '2.6.0')` treats 11 > 6, re-imported exports skip `migrateData()` entirely. Any migration added for a future version (e.g., `2.7.0` that adds `D.characters[].skills`) will not run on exports that were stamped with `'2.11'`.

When new features add fields to existing entity shapes (e.g., `D.characters` gaining a `skills` object, `D.initiative.combatants` gaining a `legendaryActions` tracker), old exports and old IndexedDB snapshots will load without those fields. Any code that reads `character.skills.perception` without a null-guard crashes.

**How to avoid:**
1. Fix the export version stamp immediately: `exp._version = APP_CONFIG.VERSION`.
2. Every time a new field is added to an entity shape, add a migration step in `version-migration.js` that sets the default value for the new field when it is absent.
3. Add a migration test: create a fixture with the old shape, run `migrateData()`, assert the new field is present with the correct default.
4. Add null guards defensively: `const perception = character.skills?.perception ?? 0` everywhere new fields are read.
5. Never assume that an entity loaded from storage has all fields — always provide fallback defaults at point of use.

**Warning signs:**
- Export files contain `"_version": "2.11"` instead of the app version
- A new feature adds `D.X` but has no migration step in `version-migration.js`
- `D.characters[0].newField` read without optional chaining causes crash on old data

**Phase to address:** Stabilization (fix version stamp) — then each feature phase that extends the data schema must include a migration step.

---

### Pitfall B8: Command Palette Keyboard Shortcut Collisions — The App Is Already Dense

**What goes wrong:**
The app already binds: `1-9` (tab switch), `Ctrl+Z/Y/S/K/F` (undo/redo/save/search), `R`, `T`, `L`, `N`, `P`, `/`, `Space`, `?`, `Shift+N`, `Escape`. The planned Command Palette (Ctrl+K) already conflicts with:

- **App's existing global search** (`Ctrl+K` is currently the search shortcut in the app)
- **Browser address bar focus** (Ctrl+K in Chrome/Firefox focuses the URL bar by default)

Additionally, single-letter shortcuts (`R`, `T`, `L`, `N`, `P`) fire from any focused text input if the keydown handler doesn't check `e.target.tagName`. The documented pattern in CLAUDE.md confirms this — the app uses `data-action` delegation, but initiative's `Space` shortcut (next turn) could fire while a user is typing in a notes field.

**How to avoid:**
1. Map the Command Palette to `Ctrl+Shift+K` (GitHub's solution to the same collision) or `Ctrl+P` (VS Code convention). Avoid bare `Ctrl+K` since it already means search in this app.
2. Audit every new shortcut against the existing table before implementation.
3. Add a context guard to all single-key shortcuts: `if (e.target.matches('input, textarea, [contenteditable]')) return;` — verify this guard exists in the current keyboard handler.
4. Show the command palette shortcut prominently in the `?` help screen and update the keyboard shortcut table.

**Warning signs:**
- The `?` help screen does not list all active shortcuts
- A new shortcut silently overrides an existing one because the table was not consulted
- `R` (roll d20) fires when the user presses R while typing an NPC name

**Phase to address:** Tech-Foundation / Command Palette phase.

---

### Pitfall B9: Web Audio Autoplay Policy Requires User Gesture — Soundboard Can't Auto-Play on Load

**What goes wrong:**
Chromium's autoplay policy blocks `AudioContext.resume()` and any audio playback until after a user gesture. An `AudioContext` created at app init (or in a DOMContentLoaded handler) starts in `suspended` state. Calling `source.start()` before the context is resumed either throws or produces silence with no error message.

For a soundboard (local audio files as ambient tracks), a secondary concern is memory: decoded `AudioBuffer` objects are kept alive by JavaScript references. A soundboard with 20 ambient tracks fully decoded into buffers holds significant memory. Each `AudioBufferSourceNode` is single-use — calling `start()` twice on the same source node fails silently; a new source node must be created for each playback while reusing the underlying buffer.

**How to avoid:**
1. Do not create `AudioContext` at app init. Create it on first user click of any audio control.
2. Check `audioContext.state` before every playback attempt; if `'suspended'`, call `audioContext.resume()` inside the click handler first.
3. Decode audio files lazily (on first play), cache decoded `AudioBuffer` objects, discard source nodes after they complete.
4. Do not decode all soundboard tracks at startup — only decode on first play.
5. For long ambient tracks, use `<audio>` element routing through Web Audio (not `decodeAudioData` + buffer) to avoid holding the entire file decoded in memory.

**Warning signs:**
- `AudioContext` created in `core/init.js` or at module load time
- `source.start()` called without checking `audioContext.state`
- Soundboard init decodes all available audio files at once
- Memory usage climbs steadily as user plays different tracks

**Phase to address:** Soundboard phase (Part C).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Embedding SRD data in `build.py` modules list | Zero additional files, no fetch logic | +630KB bundle, data in undo history, 5MB limit hit faster | Never for full statblocks; OK for a ~50KB name/CR index |
| Extending `D` with new entity arrays for reference data (monsters, etc.) | Consistent with existing patterns | Reference data in every undo snapshot; save() serializes it; imports include it | Never for large immutable datasets |
| Copying community German SRD translations for speed | German text immediately available | Licensing unclear; possible Ulisses Spiele copyright | Never — use only official WotC CC-BY source |
| Skipping migration steps when adding new fields | Faster feature development | Crashes on old exports/saves without optional chaining at every read site | Never — always add migration |
| Accepting 50-warning lint budget as permanent | CI stays green | Real undefined-global errors hide in budget | Never — ratchet down warning count |
| String name references in TAB_RENDER_REGISTRY | Flexible, easy to read | Silent breakage on rename; no rename-refactoring safety | Acceptable until a rename causes an incident; add a registry-name validator |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Service Worker + file:// | Registering SW unconditionally, assuming it works silently | Guard registration: `location.protocol !== 'file:'`; test on served origin only |
| File System Access API + auto-backup | Calling `requestPermission()` in a timer or init | Only call from inside a user click handler; use `queryPermission()` at init to check state |
| File System Access API + sessions | Assuming handle persists across browser restarts without re-permission | Persist handle to IndexedDB; always query permission on load; degrade gracefully |
| SRD data + localStorage | Storing monster statblocks in `D` alongside campaign data | Separate storage: IndexedDB for reference data, localStorage (or IDB) for campaign data only |
| Web Audio + app init | Creating `AudioContext` at load time | Create on first user gesture; check `.state` before each play call |
| IndexedDB + data migration | Loading data without running migrations | Always run `migrateData()` before handing data to the app; never skip on version >= apparent |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| SRD data in `D` state tree | Undo snapshots grow to 2-3MB each; 30 snapshots = 60-90MB in memory | Keep reference data outside `D`; use lazy IndexedDB loads | First time developer adds `D.monsters = srdData` |
| Roll history in `D.rolls[]` | Each roll appended to undo snapshot; frequent saves serialize entire history | Separate IndexedDB store for roll history; never in `D` | After ~500 rolls at typical play frequency |
| Full-state JSON stringify on every undo-able op | Input lag after destructive operations in large campaigns | Per-entity snapshots for CRUD; full snapshots only for bulk ops | At ~3MB campaign size (observable); ~5MB (noticeable) |
| Web Audio decoding all tracks at init | Long startup delay; high baseline memory | Lazy decode on first play; reuse `AudioBuffer`; use `<audio>` for long tracks | First time soundboard loads 10+ files |
| Single-file HTML >2MB over file:// | No HTTP compression; full parse cost on every open | Lazy-load SRD data; keep bundle under ~1.5MB | At ~1.9MB (with SRD data inline), parse time is measurable |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `innerHTML` with unsanitized user content | XSS — attacker-controlled DOM; campaign data exfiltration via localStorage | Always use `esc()` or `sanitizeHTML()` in template literals; add CI grep for bare `innerHTML = \`` assignments |
| Unit tests covering `testable-utils.js` copies, not production `esc()` | Security regression in production ships with tests green | Load `utils/basic.js` into jsdom test setup; or generate test utils from source at test time |
| SRD content from unknown-provenance community translations | Copyright infringement if Ulisses Spiele text is re-distributed | Source all German text from official WotC CC-BY 4.0 German SRD only |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| PWA install silently loses all file://-origin campaign data | User installs app, finds it empty, panics about lost data | Show migration wizard on first PWA launch; guide through export/import from file:// origin |
| Auto-backup fails silently after browser restart (File System API) | User believes backup is running; it isn't | Show persistent status indicator; toast on permission expiry; never auto-fail silently |
| Command palette opens with Ctrl+K and redirects browser address bar | User expects search but gets URL bar focus instead | Use Ctrl+Shift+K; test in Chromium specifically |
| Stale installed PWA shows old broken version | User is stuck on a broken version; no indication an update exists | Show update toast in `waiting` SW state; never force-skip-waiting silently |
| Data export version `2.11` causes migrations to skip | User imports old backup; new fields are missing; app crashes on null access | Fix version stamp immediately; add null guards everywhere new fields are read |

---

## "Looks Done But Isn't" Checklist

- [ ] **Mindmap cleanup:** Grep confirms no remaining references in `debug.js`, `campaign-manager.js`, `types/`, `tests/`, `styles-purged.css`, and `CLAUDE.md` — do NOT rely on app booting as the sole signal
- [ ] **PWA feature:** Verify `start_url` and `scope` in manifest work from the served origin; test the cross-origin data migration flow; confirm `sw.js` does not attempt SW registration on `file://`
- [ ] **File-based backup:** Verify `requestPermission()` is never called outside a user gesture handler; test permission state across browser restarts
- [ ] **Monster compendium:** Confirm SRD data is NOT stored in `D` (verify by checking undo snapshot size before and after loading the bestiary tab)
- [ ] **SRD licensing:** Verify attribution text for CC-BY 4.0 is visible in the app; verify provenance of existing German spell text
- [ ] **Schema migrations:** Every new field added to `D.characters`, `D.npcs`, `D.encounters`, etc. has a corresponding entry in `version-migration.js` with a default value
- [ ] **Export version:** `_version` in exports matches `APP_CONFIG.VERSION`, not a hardcoded string
- [ ] **Debug flag:** Production build output contains `DEBUG_MODE: false` — add an assertion to `build.py` that aborts if not
- [ ] **Module list sync:** `loader.js` and `build.py` module lists are identical — add a CI diff check

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| App won't boot (hidden residue crash) | LOW | Find first console error, grep for symbol, remove all occurrences, rebuild, browser-test |
| PWA install loses file://-origin data | MEDIUM | User exports JSON from file:// origin, imports in PWA via migration wizard |
| File backup writes lost (permission expired) | LOW | User grants permission again; no data lost since IDB is primary store |
| Production build ships DEBUG_MODE: true | LOW | Add assertion, rebuild, redeploy bundle |
| SRD text from wrong source | HIGH | Audit and replace all text from official CC-BY source; risky if volume is large |
| Old exports skip migrations (version bug) | MEDIUM | Fix stamp, add null guards everywhere, release migration patch |
| 5MB localStorage stale-shadow data loss | HIGH | Fix load-precedence in persistence.js; no recovery for data already lost in the field |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| A1: Mindmap residue crash | Phase 1: Stabilization | App boots in browser with no console errors; grep finds zero occurrences of removed symbols |
| A2: Dual module list drift | Phase 1: Stabilization | CI diff check on loader.js vs build.py module lists passes |
| A3: Silent DEBUG_MODE flip failure | Phase 1: Stabilization | build.py asserts `DEBUG_MODE: true` not in production output |
| A4: Orphaned function bodies | Phase 1: Stabilization | Build test for orphaned-body case added and passing |
| A5: Stale CLAUDE.md misleads development | Phase 1: Stabilization | Every claim in CLAUDE.md verified against code; no references to non-existent files |
| A6: CI green but app broken | Phase 1: Stabilization | Browser smoke test (Playwright) runs against dist bundle in CI |
| A7: Autosave gate disables persistence | Phase 1: Stabilization | Unit test: saveImmediate() persists regardless of toggle state |
| B1: SW blocked on file:// | Phase 2: Tech-Foundation / PWA | SW registration guarded by protocol check; data migration wizard works |
| B2: Stale PWA cached version | Phase 2: Tech-Foundation / PWA | Update toast appears; skipWaiting() only on user click; template files pre-cached |
| B3: FSAA permission expires | Phase 2: Tech-Foundation / Datei-Backup | Permission re-prompt shown on next backup attempt; writes never fail silently |
| B4: SRD data bloats bundle | Phase C: Monster-Kompendium | Undo snapshot size unchanged after loading bestiary; bundle stays under 1.5MB |
| B5: Wrong-license German SRD | Phase 1: Stabilization (audit) + Phase C: Monster-Kompendium (sourcing) | Attribution present; provenance documented for all SRD text |
| B6: 5MB stale-shadow data loss | Phase 1: Stabilization | Persistence unit test: >5MB save + reload returns latest data from IDB |
| B7: Schema migration version bug | Phase 1: Stabilization (fix stamp) + every schema-extending phase | Export round-trip test; migrateData() test for new fields |
| B8: Command palette shortcut collisions | Phase 2: Tech-Foundation / Command Palette | Shortcut audit table updated; Ctrl+Shift+K tested in Chromium |
| B9: Web Audio autoplay block | Phase C: Soundboard | AudioContext created only on user click; playback tested from cold start |

---

## Sources

- `D:\AI_CLI\Claude\DnD_Tracker_App_Pro\dnd-tracker-modular\.planning\codebase\CONCERNS.md` — primary source for Part A (direct code evidence, HIGH confidence)
- `D:\AI_CLI\Claude\DnD_Tracker_App_Pro\dnd-tracker-modular\.planning\PROJECT.md` — project constraints and requirements
- [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) — SW security context requirements (HIGH confidence)
- [Chromium dev group: file:// and service workers](https://groups.google.com/a/chromium.org/g/chromium-dev/c/Ylfh8kjOdec) — file:// restriction confirmed
- [Chrome Developers: Persistent permissions for FSAA](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api) — permission lifecycle (HIGH confidence)
- [xjavascript.com: FSAA FileHandle storage in IndexedDB](https://www.xjavascript.com/blog/file-system-access-api-is-it-possible-to-store-the-filehandle-of-a-saved-or-loaded-file-for-later-use/) — permission rehydration pattern
- [web.dev: PWA update handling](https://web.dev/learn/pwa/update/) — skipWaiting pitfall (HIGH confidence)
- [Chrome Developers: Web Audio and autoplay policy](https://developer.chrome.com/blog/web-audio-autoplay) — autoplay restriction (HIGH confidence)
- [MDN: Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — buffer memory management
- [dnddeutsch.de: Official German SRD announcement](https://www.dnddeutsch.de/das-srd-auf-deutsch/) — WotC CC-BY 4.0 German SRD confirmed
- [dnddeutsch.de: License page](https://www.dnddeutsch.de/srd/license/) — OGL 1.0a with Ulisses Spiele copyright on community translation
- [Tribality: SRD 5.1 CC license](https://www.tribality.com/2023/01/28/wotc-maintains-ogl-1-0a-and-releases-srd-5-1-under-cc-license/) — SRD 5.1 CC-BY 4.0 status
- [Blizzard Watch: SRD 5.2 release](https://blizzardwatch.com/2025/04/28/wizards-coast-releases-srd-version-5-2-dungeons-dragons/) — SRD 5.2 released April 22, 2025 under CC-BY 4.0
- [BTMorton/dnd-5e-srd monsters JSON](https://github.com/BTMorton/dnd-5e-srd/blob/master/json/11%20monsters.json) — ~631KB confirmed via raw file size check
- [GitHub community: Ctrl+K command palette collision](https://github.com/orgs/community/discussions/15255) — browser shortcut conflict confirmed (MEDIUM confidence)
- [web.dev: web app manifest](https://web.dev/learn/pwa/web-app-manifest) — start_url and scope requirements

---
*Pitfalls research for: offline-first D&D 5e campaign manager (vanilla JS, single HTML, file://, Windows/Chromium)*
*Researched: 2026-06-11*
