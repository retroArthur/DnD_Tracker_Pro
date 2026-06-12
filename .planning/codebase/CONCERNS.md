# Codebase Concerns

**Analysis Date:** 2026-06-11

## Tech Debt

**Dual-maintained module load order (loader.js + build.py):**

- Issue: The 92-module load order exists twice — `loader.js:10-124` (`MODULES` array, dev mode) and `build.py:249-355` (`modules` list, bundled builds). `loader.js:9` explicitly warns "Diese Liste muss mit build.py synchron bleiben!"
- Files: `loader.js`, `build.py`
- Impact: Currently in sync (verified 92/92, identical order), but any module added to only one list silently diverges dev from prod. `build.py:409` only logs a warning (`NICHT GEFUNDEN`) for missing files and continues — a typo'd path produces a build missing a module with no failure.
- Fix approach: Make `build.py` parse the `MODULES` array out of `loader.js` (single source of truth), and turn missing-module warnings into hard build errors.

**build.py Pass-3 duplicate-function removal leaves orphaned bodies:**

- Issue: `remove_duplicate_functions()` (`build.py:176-228`) comments out only the duplicate `function X(` declaration line. The inner loop (`build.py:205-217`) computes where the function body ends via brace counting but never skips those lines — the body is emitted as orphaned top-level statements, producing `SyntaxError: Illegal return statement` at runtime. This exact failure is documented in `CLAUDE.md` ("Duplicate Declaration Debugging Pattern", 2026-01-10 incident).
- Files: `build.py:176-228`
- Impact: Any future duplicate top-level function name across two bundled modules breaks the production build at runtime. The post-build validation (`build.py:508-525`) catches duplicate declarations but NOT orphaned bodies, because the duplicate declaration line is already commented out by then.
- Fix approach: Either fix Pass 3 to actually skip body lines using the computed brace range, or replace it with a pre-build check that fails the build when duplicate top-level function names are detected in source.

**Production debug-flag flip relies on exact string match:**

- Issue: `build.py:421-422` flips debug flags via `js_combined.replace("DEBUG_MODE: true,", "DEBUG_MODE: false,", 1)`. This depends on the exact formatting in `core/config.js:10-11` (spacing, trailing comma).
- Files: `build.py:421-422`, `core/config.js:10-12`
- Impact: Reformatting `core/config.js` (e.g., Prettier changing spacing) would silently ship production builds with `DEBUG_MODE: true` and `DEBUG_VALIDATE_ON_SAVE: true` — validation overhead and console warnings in prod.
- Fix approach: Add a post-replace assertion in `build.py` that `DEBUG_MODE: true` no longer appears in the production bundle; abort otherwise.

**Abandoned TypeScript migration leftovers:**

- Issue: The Jan 2026 TS migration was compiled back to plain JS and abandoned, leaving artifacts:
    - `main.js` — dead entry-point placeholder (dynamically loads `loader.js`); not referenced by `index.html` or any live file
    - `tsconfig.json.backup` — committed backup file
    - `MIGRATION_REPORT.md` — one-time migration report at repo root
    - `tsconfig.json` has `"strict": false` and `"checkJs": false` — `npm run typecheck` validates only the `.d.ts` files in `types/`, not the actual JS source
    - ~504 function-scoped `const X = window.X;` imports remain throughout `core/`, `utils/`, `systems/`, `features/`, `ui/` (e.g., `systems/spellslots/quick-roll.js:24-29`) — the exact pattern `CLAUDE.md`'s prevention checklist says should "return empty"
- Files: `main.js`, `tsconfig.json.backup`, `MIGRATION_REPORT.md`, `tsconfig.json:21`
- Impact: Dead files confuse navigation; weak typecheck gives false confidence in CI; the pervasive function-scoped window-import pattern is technically legal (shadowing) but is the documented precursor of the 2026-01-10 build incident when names collide with module-level declarations.
- Fix approach: Delete `main.js`, `tsconfig.json.backup`; move `MIGRATION_REPORT.md` to `docs/` or delete. Decide whether the `CLAUDE.md` prohibition is real — if yes, add the documented pre-build grep to CI; if no, update `CLAUDE.md`.

**Removed Mindmap/Network feature residue:**

- Issue: Mindmap was removed entirely (commit `7ef9bf5`, 2026-05-24) but references remain:
    - `systems/campaign-manager/campaign-manager.js:35` — empty-campaign template still seeds `mindmap: { nodes: [], connections: [] }`
    - `systems/backups.js`, `systems/spellslots/import-export.js` — backward-compat reads of `D.mindmap` (intentional for old exports, but undocumented as such)
    - `types/globals.d.ts`, `types/entities.d.ts` — still declare mindmap types
    - `assets/styles-purged.css` — git-tracked generated file (output of `tools/purge-css.py:231`) containing 300+ lines of orphaned `.mindmap-*` CSS
    - `tests/setup.js`, `tests/unit/stability.test.js`, `tools/debug.js`, `tools/split-shops.py` — stale references
    - `CLAUDE.md:81,129,152,336-344` — documents the feature as current
- Files: see above
- Impact: New campaigns carry a dead `mindmap` key forever; type declarations lie; stale CSS artifact bloats the repo; documentation misleads future work.
- Fix approach: Remove the seed key from `campaign-manager.js:35` (keep import-side compat in `import-export.js`), regenerate or delete `assets/styles-purged.css`, prune type declarations and test references, update `CLAUDE.md`.

**CLAUDE.md significantly stale (multiple claims contradict code):**

- Issue: Beyond Mindmap, verified divergences:
    - Roadmap says "~146 inline event handlers remain in templates" — actual count is **0** (migration completed May 2026; templates now use 641 `data-action` attributes)
    - "No execCommand: Use manual DOM manipulation" convention — `ui/editors/rich-text.js` contains **21** `document.execCommand` calls, plus `systems/entity-links.js:108`, `features/wiki/wiki.js:819`, `ui/actions/system-actions.js:79`
    - References `features/shops/spell-editor.js` and `features/network/mindmap.js` — neither file exists
    - Says campaign index key is `dnd-campaign-index` — actual key is `dnd-tracker-campaigns` (`core/config.js:17`)
- Files: `CLAUDE.md`, `docs/bugfixes.md` ("Known Technical Debt" section also references the deleted `spell-editor.js` and ~10 inline handlers that no longer exist)
- Impact: AI-assisted and human development follows wrong guidance; effort gets wasted re-verifying or re-doing completed migrations.
- Fix approach: Audit pass over `CLAUDE.md` and `docs/bugfixes.md` tech-debt section against current code; mark completed roadmap items.

**Deprecated `document.execCommand` powers the rich-text editor:**

- Issue: Core formatting (bold, italic, underline, strikethrough, lists, fonts, insertHTML, createLink) uses the deprecated `execCommand` API — 21 call sites in `ui/editors/rich-text.js` (lines 297-861), plus `systems/entity-links.js:108`, `features/wiki/wiki.js:819`, `ui/actions/system-actions.js:79`.
- Files: `ui/editors/rich-text.js`, `systems/entity-links.js`, `features/wiki/wiki.js`, `ui/actions/system-actions.js`
- Impact: API works in all current browsers but is formally deprecated; behavior already varies cross-browser (`<font>` tag output is sanitized specially in `utils/basic.js:67-68`). A browser removal would break all rich-text editing.
- Fix approach: Acknowledged in `docs/bugfixes.md` as low-risk/high-effort. Migrate incrementally to Selection/Range API, starting with simple inline formats; keep `sanitizeHTML` allowances in sync.

**Stale/broken developer tooling:**

- Issue:
    - `validate.py:11` hardcodes `SOURCE_DIR = '/mnt/user-data/outputs/dnd-tracker-modular'` (a Linux path from a previous environment) — `npm run validate` is broken on this Windows machine
    - `tools/analyze-render.py:11` hardcodes the same `/mnt/...` path; targets `render/main.js`, which was split apart in v2.0
    - `tools/migrate-event-handlers.py` targets the now-completed inline-handler migration
    - `package.json` scripts invoke `python3`, which typically does not resolve on Windows (project's primary dev OS per `CLAUDE.md` Windows notes)
- Files: `validate.py`, `tools/analyze-render.py`, `tools/migrate-event-handlers.py`, `package.json:scripts`
- Impact: `npm run validate`, `npm run analyze:render`, `npm run build` (via npm) fail or mislead on Windows; dead tools add noise.
- Fix approach: Fix `validate.py` to use script-relative paths (pattern already used in `tools/purge-css.py:12`); delete completed-migration tools; use `python` or `py -3` in npm scripts (or document `python3` alias requirement).

**License metadata mismatch:**

- Issue: `package.json:46` declares `"license": "ISC"`; `LICENSE` file and `README.md:8,210` say MIT.
- Files: `package.json:46`, `LICENSE`, `README.md`
- Impact: Legal ambiguity for any distribution; trivial to fix.
- Fix approach: Set `"license": "MIT"` in `package.json`.

**Hardcoded export data version `'2.11'`:**

- Issue: `systems/spellslots/quick-roll.js:133` stamps exports with `exp._version = '2.11'` while `APP_CONFIG.VERSION` is `'2.6.0'`. Since `compareVersions('2.11', '2.6.0')` evaluates 11 > 6, re-imported exports skip `migrateData()` entirely (`quick-roll.js:63-72`).
- Files: `systems/spellslots/quick-roll.js:133`, `systems/spellslots/version-migration.js`
- Impact: Version semantics are confused (looks like an old internal data-format version); future migrations will not run on round-tripped export files.
- Fix approach: Stamp exports with `APP_CONFIG.VERSION` and add a migration test for export/import round-trips.

**Oversized modules:**

- Issue: Several modules exceed 1,000 lines: `features/dmscreen/dmscreen-render.js` (1,570), `ui/editors/rich-text.js` (1,488), `features/initiative.js` (1,384), `features/wiki/wiki.js` (1,227), `features/encounter-calculator.js` (1,199), `features/shops/shops-core.js` (1,053).
- Files: see above
- Impact: High cognitive load; initiative and DM Screen are the most-touched feature areas.
- Fix approach: Follow the existing split pattern (`features/npcs/*`, `features/party/*`) — separate render/CRUD/interactions when next doing major work in these files.

**Service Worker cache list duplication and stale entry:**

- Issue: `sw.js:4` hardcodes `CACHE_NAME = 'dnd-tracker-v2'`, duplicating `APP_CONFIG.SW_CACHE_NAME` (`core/config.js:24`) — the SW cannot read APP_CONFIG, so the two must be bumped manually together. `sw.js:10` pre-caches `./assets/body.html`, which is a "no longer used" notice file (`assets/body.html:1-2`); the 10 real template files in `assets/templates/` are only runtime-cached on first fetch.
- Files: `sw.js:4-11`, `core/config.js:24`, `assets/body.html`
- Impact: First offline use before all templates were fetched once could miss templates; dead file wastes a cache slot; cache-version drift risk between config and SW.
- Fix approach: Replace `assets/body.html` in `STATIC_ASSETS` with the `assets/templates/*.html` list (mirroring `loader.js:177-188`); add a comment in both files pointing at each other for the cache name.

## Known Bugs

**Stale-data shadowing for campaigns over 5MB (data-loss path):**

- Symptoms: After a campaign grows past 5MB, edits silently stop persisting across reloads — the app reverts to the last sub-5MB state.
- Files: `systems/spellslots/persistence.js:33-40,139-146` (save), `systems/spellslots/quick-roll.js:31-45` (load)
- Trigger: `saveImmediate()`/`save()` switch to IndexedDB-only when serialized `D` exceeds `LS_LIMIT_MB = 5`, but never remove/overwrite the old localStorage entry. `load()` reads localStorage FIRST and only falls back to IndexedDB `if (!s)` — so the stale localStorage snapshot shadows all newer IndexedDB saves on every reload.
- Workaround: The 4MB warning toast (`persistence.js:28-31`) prompts a backup; users can export/import. Real fix: on IDB-only save, delete the localStorage key (or store a pointer marker), or compare timestamps from both stores at load.

**Undo may not restore deleted entities (possible regression):**

- Symptoms: E2E tests "Löschen kann rückgängig gemacht werden" fail for NPCs, locations, and party — after delete + undo, the entity is absent from `D.characters`.
- Files: `tests/e2e/crud/{npcs,locations,party}.spec.js`, `systems/undo.js:24-63`, triaged in `docs/e2e-failure-triage.md` (Cluster 4)
- Trigger: Delete an entity, press Ctrl+Z.
- Workaround: None known; the triage doc explicitly flags this as "possible app regression — worth manual verification." Highest-priority item from the E2E triage. Manual browser verification needed before trusting undo for deletes.

**Duplicate `#random-tables-list` DOM instances at runtime:**

- Symptoms: Playwright locator for `#random-tables-list` matches 9 elements after tab switching (`docs/e2e-failure-triage.md` Cluster 3). IDs are unique in source templates (verified: only `assets/templates/view-tools.html:223`), so duplication arises at runtime.
- Files: `assets/templates/view-tools.html:223`, `features/random-tables.js:155`, `tests/e2e/tab-navigation.spec.js`
- Trigger: Tab switching in the built HTML under Playwright.
- Workaround: None; flagged in triage as "a yellow flag worth understanding regardless of test outcome" — investigate render duplication (DM Screen widget or repeated template injection).

**26 pre-existing Playwright E2E failures (140 total, 114 pass):**

- Symptoms: Stable failure set documented in `docs/e2e-failure-triage.md`: persistence specs assert on localStorage while `file://` mode forces the IndexedDB path (5 tests); initiative helper `addCombatant()` targets a removed `#combatant-name` form (6 tests); tab-navigation visibility (8); undo (3); validation (3); workflows (2).
- Files: `tests/e2e/features/persistence.spec.js`, `tests/e2e/features/initiative.spec.js`, `tests/e2e/tab-navigation.spec.js`, `tests/e2e/crud/*.spec.js`, `tests/e2e/integration/workflows.spec.js`
- Trigger: `npm run test:e2e`
- Workaround: Triage doc classifies most as test-spec bugs, not app bugs. Until fixed, E2E is not a reliable regression gate, and entire feature areas (initiative combat flow) have zero working E2E coverage.

**Undo/redo stack asymmetry on parse failure:**

- Symptoms: If a stored undo snapshot fails `safeJSONParse`, `undo()` has already pushed the current state to `redoStack` (`systems/undo.js:31-38`) and popped the undo entry (`undo.js:39`) — stacks end up inconsistent (a redo entry exists for an undo that never happened).
- Files: `systems/undo.js:24-63` (same pattern in `redo()`, lines 64-100)
- Trigger: Corrupted snapshot (rare; snapshots are in-memory strings).
- Workaround: Low impact in practice. Fix: validate the popped state before mutating either stack.

## Security Considerations

**XSS via `innerHTML` is the dominant risk class (historically recurring):**

- Risk: ~64 `innerHTML = \`...\``template-literal assignments across`features/`, `systems/`, `ui/`interpolate campaign data (names, descriptions, notes).`docs/bugfixes.md` documents 12+ past XSS fixes in this class.
- Files: highest concentrations in `features/random-tables.js`, `features/wiki/wiki.js`, `features/encounter-calculator.js`, `features/initiative.js`, `features/sessions/sessions.js`
- Current mitigation: `esc()` (`utils/basic.js:19-21`) and `sanitizeHTML()` (`utils/basic.js:44-156` — DOMParser-based tag/attribute allowlist, protocol filtering) are used widely (e.g., 19 `esc()` calls in `random-tables.js`); spot checks found no obvious unescaped interpolations.
- Recommendations: Keep treating every new `innerHTML` with user data as a review hotspot (per `CLAUDE.md` checklist). Consider an ESLint rule or grep-based CI check for `innerHTML` assignments lacking `esc(`/`sanitizeHTML(` in the same expression.

**Security-critical sanitizers are unit-tested only via drifted copies:**

- Risk: `tests/unit/*.test.js` require `utils/testable-utils.js` — a 280-line file of COPIES of `esc()`, `sanitizeHTML()`, `debounce()`, etc. (11 duplicated functions, verified). The copies have already drifted: testable `esc()` handles `s === 0` explicitly; production `esc()` (`utils/basic.js:19-21`) returns `''` for `0`. A regression in the production `sanitizeHTML` would pass the security test suite.
- Files: `utils/testable-utils.js`, `utils/basic.js`, `tests/unit/security.test.js`, `tests/unit/utilities.test.js`
- Current mitigation: `docs/bugfixes.md` documents the duplication as intentional (CommonJS exports for Jest) with a "keep in sync" note.
- Recommendations: Load the real `utils/basic.js` into jsdom in test setup (it attaches globals), or generate `testable-utils.js` from source at test time. At minimum, add a test asserting the two implementations produce identical output for a shared vector set.

**`sanitizeHTML` allows arbitrary `class` and broad inline styles:**

- Risk: `utils/basic.js:62` allows any `class` attribute on sanitized rich-text content — user content can adopt app CSS classes (e.g., modal/overlay classes) for UI redressing; allowed `style` properties include `width`, `margin`, `padding` (`utils/basic.js:61`) enabling layout breakage.
- Files: `utils/basic.js:59-69`
- Current mitigation: Tags are allowlisted; event handlers and dangerous protocols stripped; no script execution possible.
- Recommendations: Low severity (single-user offline app, content is the DM's own). If hardening: prefix-allowlist classes (e.g., only `read-aloud*`, highlight classes the editor emits).

**No Content-Security-Policy:**

- Risk: Neither `index.html` nor the `build.py` HTML template emits a CSP meta tag; combined with the innerHTML-heavy architecture, any XSS slip has full DOM/localStorage access (campaign data).
- Files: `index.html`, `build.py:437-475`
- Current mitigation: Offline single-user trust model; only external requests are Google Fonts (`build.py:449-451`).
- Recommendations: A meta CSP limited to `font-src`/`style-src` for Google Fonts plus `script-src 'unsafe-inline'` (required by the single-file architecture) would still block remote exfiltration targets. Low priority.

## Performance Bottlenecks

**Full-state JSON snapshot on every undoable operation:**

- Problem: `pushUndo()` runs `JSON.stringify(window.D)` synchronously before EVERY destructive operation (`systems/undo.js:9-20`), retaining up to 30 snapshots (`UNDO_LIMIT`, `core/config.js:28`); `undo()`/`redo()` stringify again for the opposite stack.
- Files: `systems/undo.js:9-20,31-38,71-75`
- Cause: Snapshot-based undo with no structural sharing or diffing.
- Improvement path: For multi-MB campaigns each delete/edit serializes the entire world (visible input lag) and undo memory can reach 30x campaign size. Consider per-entity snapshots for CRUD operations (the dominant case) and full snapshots only for bulk operations; or cap snapshot size and degrade gracefully.

**Every save serializes the full campaign (plus extra IDB writes >2MB):**

- Problem: `save()` (debounced 300ms) and `saveImmediate()` both `JSON.stringify(D)` and construct a `Blob` to measure size (`systems/spellslots/persistence.js:21-22,127-135`); campaigns over 2MB additionally write the full string to IndexedDB on every save (`persistence.js:50-52`).
- Files: `systems/spellslots/persistence.js`
- Cause: Single-key whole-campaign persistence model.
- Improvement path: Acceptable below ~2MB. For large campaigns, raise the optional-IDB-backup threshold or debounce the IDB mirror separately (e.g., every 30s instead of every save).

**Debug validation always on outside `--production` builds:**

- Problem: `DEBUG_MODE: true` and `DEBUG_VALIDATE_ON_SAVE: true` (`core/config.js:10-11`) mean dev-mode (`index.html` + `loader.js`) and `npm run build:dev` bundles run data-integrity validation on every save plus stack-trace generation on every missed `$()` lookup (`utils/basic.js:10`).
- Files: `core/config.js:10-11`, `utils/basic.js:7-13`
- Cause: Flags flipped only by the production build string-replace.
- Improvement path: By design for development; just be aware perf measurements in dev mode are pessimistic. Verify production artifacts actually have the flags off (see build fragility above).

**Sequential script loading in dev mode (92 modules):**

- Problem: `loader.js:204-228` loads all 92 modules strictly sequentially (await per script) plus 10 template fetches; dev startup is dozens of round-trips.
- Files: `loader.js:169-248`
- Cause: Global-scope architecture requires ordered execution.
- Improvement path: Dev-only concern (bundled builds are one file). Could pre-fetch all module texts in parallel and inject in order if dev startup becomes painful.

## Fragile Areas

**Global namespace + regex-based build deduplication:**

- Files: `build.py:96-228`, all of `core/`, `utils/`, `systems/`, `features/`, `ui/`, `render/`
- Why fragile: ~93 files share one global scope; correctness after bundling depends on three regex passes (`deduplicate_window_assignments`, `remove_duplicate_functions`) plus a brace-counting post-validation (`build.py:508-525`). The documented prevention greps from `CLAUDE.md` (no duplicate function names, no function-scoped window imports) are NOT enforced anywhere — 504 function-scoped `const X = window.X` instances exist today, and 11 duplicate function names exist (all currently harmless because the second copy lives in `utils/testable-utils.js`, which is excluded from the bundle).
- Safe modification: Never reuse a top-level function name; never add `const X = window.X` at module top level for `const`-declared globals; after any module change run `python build.py` AND open the bundle in a browser (syntax errors surface only at runtime).
- Test coverage: `tests/build/` and `tests/unit/test_build_deduplication.py` cover dedup behavior; no test covers the orphaned-function-body case.

**`saveImmediate()` can be silently disabled by an optional checkbox:**

- Files: `systems/spellslots/persistence.js:10-14,110-113`, `core/init.js:43-45`
- Why fragile: Both save paths begin with `if (autosaveToggle && !autosaveToggle.checked) return;` — if any element with id `autosave-toggle` exists unchecked, ALL saves (including "immediate" saves after deletes) silently no-op. The element is currently absent from the UI (note at `core/init.js:43-44`), and commit `2af81e9` already fixed one regression in this exact gate.
- Safe modification: If reintroducing an autosave toggle, exempt `saveImmediate()` (critical-action saves) from the gate; add an E2E test that data persists with the toggle present and off.
- Test coverage: None for the toggle-absent/present matrix.

**Lint and typecheck gates are too soft to catch global-scope errors:**

- Files: `eslint.config.js:95-105` (`no-undef: 'warn'`, `no-unused-vars: 'warn'`), `package.json` (`lint` uses `--max-warnings 50`), `tsconfig.json` (`strict: false`, `checkJs: false`)
- Why fragile: In a no-imports architecture, `no-undef` is the primary defense against typo'd globals and load-order mistakes — as a warning inside a 50-warning budget, real errors can hide. `npm run typecheck` passes without checking JS bodies at all.
- Safe modification: Treat `no-undef` as error with a curated globals list; ratchet the warning budget down; consider `checkJs: true` incrementally per directory.
- Test coverage: CI (`.github/workflows/ci.yml`) runs lint/typecheck/jest/build but NOT Playwright — UI regressions reach `main` undetected.

**Tab registry render functions referenced by string name:**

- Files: `systems/tab-registry.js`, `systems/spellslots/navigation.js`
- Why fragile: `TAB_RENDER_REGISTRY` maps tab names to function-name strings resolved on `window` at switch time; renames break silently (warning only in `DEBUG_MODE`). Past incident documented in `CLAUDE.md` (test mocks referenced nonexistent `renderInitiative` vs actual `renderInit`).
- Safe modification: When renaming any `render*` function, grep `systems/tab-registry.js` first; keep `tests/e2e/tab-navigation.spec.js` green (currently 8 of its tests fail — see Known Bugs).
- Test coverage: E2E tab-navigation suite exists but is failing; unit tests mock rather than verify registry-name validity.

**Unguarded interval in performance monitoring:**

- Files: `systems/backups.js:318-327`
- Why fragile: `initPerformanceMonitoring()` starts a bare 30s `setInterval` with no guard or handle — calling it twice leaks intervals. This is the exact leak class documented in `docs/bugfixes.md` ("Timer: Memory Leak durch nicht aufgeräumte Intervals"). Currently safe because `core/init.js:121` calls it exactly once.
- Safe modification: Mirror the guard pattern used 15 lines above in `startAutoBackup()` (`backups.js:302-308`).
- Test coverage: None.

**Loader continues after module load failures:**

- Files: `loader.js:224-227`
- Why fragile: A failed module logs an error and loading continues ("Fortfahren trotz Fehler"), so one broken file produces cascading `X is not a function` errors far from the root cause in dev mode.
- Safe modification: Acceptable as a debugging aid, but check the FIRST console error when diagnosing dev-mode breakage, not the last.

## Scaling Limits

**localStorage single-key campaign storage:**

- Current capacity: ~5MB per campaign (one JSON string under one key, `core/config.js:15`); warning toast at 4MB (`persistence.js:28-31`)
- Limit: At >5MB, persistence switches to IndexedDB-only — which currently triggers the stale-shadowing bug (see Known Bugs). IndexedDB fallback capacity is effectively unbounded for this use case.
- Scaling path: Fix the load-precedence bug first; long term, store entities in IndexedDB natively and keep localStorage for settings only.

**Undo history memory:**

- Current capacity: 30 full-state snapshots (`UNDO_LIMIT`, `core/config.js:28`) + up to 30 redo snapshots
- Limit: ~60x serialized campaign size in memory worst case; a 4MB campaign can hold ~240MB of snapshot strings.
- Scaling path: Per-operation diffs or entity-scoped snapshots; reduce limit dynamically based on snapshot size.

**Render performance with large lists:**

- Current capacity: Virtual scroll engages above 50 items (`VIRTUAL_SCROLL_THRESHOLD`, `core/config.js:46`); `CLAUDE.md` advises pagination beyond 500 entries; EntityLookup render-cycle caching exists (`features/initiative.js` pattern).
- Limit: Untested beyond ~500 spells / ~20 combatants (the documented test targets).
- Scaling path: Existing virtual-scroll + cache patterns; profile before optimizing further.

## Dependencies at Risk

**`document.execCommand` (browser API, deprecated):**

- Risk: Formally deprecated; the entire rich-text feature depends on it (21 calls in `ui/editors/rich-text.js`).
- Impact: Rich-text formatting in wiki, notes, NPC descriptions, session logs breaks if browsers remove it.
- Migration plan: Selection/Range-API replacement, incrementally (one already done: `insertUnorderedList` per `docs/bugfixes.md`).

**Python build toolchain invoked as `python3` from npm:**

- Risk: `package.json` scripts call `python3`, which is typically absent on Windows; `build.py` also needs `PYTHONIOENCODING=utf-8` on Windows (documented in `CLAUDE.md`).
- Impact: `npm run build`/`validate`/`analyze:*` fail on the project's own primary dev OS; CI (Ubuntu) is unaffected.
- Migration plan: Use `python` with the Windows launcher, or a small cross-platform wrapper (note `build_wrapper.py` exists at root — verify and standardize on it).

**Zero runtime dependencies (positive):**

- Risk: None — the app has no runtime npm dependencies; only devDependencies (jest, playwright, eslint, prettier, typescript). Supply-chain surface is build-time only.

## Missing Critical Features

**E2E suite absent from CI:**

- Problem: `.github/workflows/ci.yml` runs lint, typecheck, jest, and build — but not Playwright (blocked by the 26 known failures).
- Blocks: Automated detection of UI regressions; the tab-registry/initiative/undo regressions this app has historically suffered are exactly the class E2E would catch.

**No enforcement of documented build-safety invariants:**

- Problem: `CLAUDE.md` prescribes pre-build greps (no duplicate function names, no function-scoped window imports) and a `test_no_orphaned_return_statements` test — none are wired into CI or `build.py`.
- Blocks: Confidence that the known dedup failure modes cannot recur; currently relies on developer discipline.

**No automated dist smoke test:**

- Problem: Build validation (`build.py:486-534`) is static (regex/brace checks); nothing executes the bundled JS. Runtime `SyntaxError`s (the historical failure mode) are only caught by manually opening the bundle.
- Blocks: Safe unattended builds. A minimal Playwright "bundle boots, init() completes, no console errors" check against `dist/dnd-tracker-bundled.html` would close this gap.

## Test Coverage Gaps

**Unit tests exercise copies, not production code:**

- What's not tested: The real `esc()`, `sanitizeHTML()`, `debounce()`, `nextId()`, `parseDiceNotation()` etc. — `tests/unit/*.test.js` require `utils/testable-utils.js` (verified sole require target), whose `esc()` has already diverged from `utils/basic.js`.
- Files: `utils/testable-utils.js`, `tests/unit/security.test.js`, `tests/unit/utilities.test.js`
- Risk: Security/correctness regressions in production utilities ship while tests stay green.
- Priority: High

**Coverage thresholds apply to one file only:**

- What's not tested: `jest.config.cjs` sets `coverageThreshold` solely for `utils/testable-utils.js` (80%); 7 unit test files exist against ~93 source modules. Core systems — `systems/undo.js`, `systems/spellslots/persistence.js`, `systems/campaign-manager/campaign-manager.js`, `features/initiative.js` — have no direct unit tests.
- Files: `jest.config.cjs:60-70`, `tests/unit/`
- Risk: The most data-critical code paths (save/load/undo/campaign-switch) rely entirely on the partially-failing E2E suite.
- Priority: High

**Persistence edge cases untested:**

- What's not tested: >5MB IDB-only save followed by reload (the stale-shadowing bug); localStorage quota failure fallback; campaign switch + delete flows (`switchCampaign` does a raw `location.reload()`, `campaign-manager.js:48-53`); export/import version round-trip (`_version: '2.11'`).
- Files: `systems/spellslots/persistence.js`, `systems/spellslots/quick-roll.js`, `systems/campaign-manager/campaign-manager.js`
- Risk: Data loss paths discovered by users, not tests.
- Priority: High

**Initiative/combat flow has zero working E2E coverage:**

- What's not tested: All 6 initiative E2E tests fail on a stale `addCombatant()` helper (`docs/e2e-failure-triage.md` Cluster 2); death saves, concentration, AoE damage, quick actions have no automated coverage at all.
- Files: `tests/e2e/features/initiative.spec.js`, `features/initiative.js`, `features/quick-actions.js`
- Risk: The app's most complex interactive feature regresses invisibly.
- Priority: Medium (fix the shared helper first — one fix unblocks 6 tests)

**Build system orphaned-body case untested:**

- What's not tested: `remove_duplicate_functions` leaving orphaned function bodies (the documented 2026-01-10 incident); `tests/unit/test_build_deduplication.py` and `tests/build/` cover window-assignment dedup but not Pass 3's body handling.
- Files: `build.py:176-228`, `tests/build/`, `tests/unit/test_build_deduplication.py`
- Risk: The known-worst build failure mode can recur undetected.
- Priority: Medium

---

_Concerns audit: 2026-06-11_
