# Architecture

**Analysis Date:** 2026-06-11

## Pattern Overview

**Overall:** Offline-first single-page application built as a **non-ESM, global-scope modular monolith**. 92 JavaScript modules share one global namespace, loaded in strict dependency order, with all state in a single global object (`window.D`) persisted to localStorage/IndexedDB.

**Key Characteristics:**

- **No ES modules.** No `import`/`export` anywhere in runtime code. Cross-module calls use globals directly (const/let declarations are in global lexical scope) or `window.fn()`. Functions are exposed via explicit `window.X = X` assignments at the bottom of modules (see `features/initiative.js` tail).
- **Two delivery modes from one codebase:** dev mode (`index.html` + `loader.js` injects scripts/templates at runtime) and bundled mode (`build.py` concatenates everything into one HTML file with a three-pass deduplication step).
- **Single mutable state tree** (`D`), mutated directly by feature code, with snapshot-based undo and debounced persistence.
- **Declarative UI wiring**: `data-action` attributes + capture-phase event delegation instead of inline handlers (migration ongoing - ~146 inline handlers remain in templates/generated HTML).
- German-localized UI strings throughout; code comments mixed German/English.

## Layers

Load order defined identically in `loader.js:10-124` (MODULES array) and `build.py:249-355` - these two lists MUST stay in sync.

**1. Core (`core/`):**

- Purpose: Configuration, state schema, constants, themes, bootstrap
- Contains: `config.js` (frozen `APP_CONFIG`), `data.js` (`initializeData()` → `window.D`), `constants.js` (`DND_RULES`, `UI_CONSTANTS` namespaces + legacy direct names), `themes.js`, `srd-spells.js` (lazy-cached German SRD spell data), `init.js` (the `init()` bootstrap + IndexedDB wrapper + Service Worker registration)
- Depends on: nothing (loaded first); `init.js` is loaded LAST and depends on everything
- Used by: all layers

**2. Utils (`utils/`):**

- Purpose: Pure-ish helpers and infrastructure primitives
- Contains: `basic.js` (`$`, `$$`, `esc`, `stripHtml`, `sanitizeHTML`, `StorageAPI`), `utilities.js` (`$c` cached DOM lookup, `debounce`, `throttle`, `parseEntityId`, `nextId`, `showToast`/event log), `performance.js` (`log`/`warn`/`error`, `PerformanceManager`), `crud-helpers.js`, `validation.js` (`VALIDATION_SCHEMAS` with `entityRef` foreign-key checks), `form-helpers.js`, `filter-engine.js`, `game-rules.js`, `performance-extras.js` (drag-and-drop, debounced renders), `testable-utils.js` (Jest-importable copies of core helpers - NOT in the build)
- Depends on: `core/config.js`
- Used by: systems, features, ui

**3. Systems (`systems/`):**

- Purpose: Cross-cutting subsystems independent of any one feature
- Contains: `undo.js` (snapshot undo/redo + BroadcastChannel conflict detection), `backups.js` (auto-backup to IndexedDB, localStorage fallback), `tags.js`, `entity-links.js` (cross-entity linking), `conditions.js`, `hp-calculator.js`, `avatars.js`, `tab-registry.js`, `session-timer.js`, `wiki-links.js`, `markdown-import-export.js`, `search/global-search.js` (fuzzy search), `campaign-manager/campaign-manager.js` (multi-campaign via separate localStorage keys + reload), `spellslots/` subsystem (11 modules: persistence, navigation/`switchView`, version migration, quick reference, PWA install, virtual list, keyboard shortcuts, import/export, quick roll + **the global `load()` function** in `quick-roll.js:23`)
- Depends on: core, utils
- Used by: features, ui

**4. Render helpers (`render/`):**

- Purpose: Shared rendering infrastructure
- Contains: `helpers.js` only - defines `ErrorHandler` (`render/helpers.js:9`), `safeExecute`/`safeRender` wrappers (`:78`, `:103`), `EntityLookup` with optional per-render-cycle cache (`:440`), `getEntityForCombat()` (`:528`), select-population helpers
- Depends on: utils
- Used by: every feature render module

**5. Features (`features/`):**

- Purpose: Domain functionality, one folder (or file) per domain
- Contains: entity folders split by concern - `party/` (`party-render.js`, `party-details.js`, `party-crud.js`), `npcs/` (render, interactions, dialogs, crud, popup), `locations/`, `quests/`, `encounters/` (+ `monster-templates.js`), `shops/` (`shops-core.js`, `shop-export.js`, `links.js`), `sessions/`, `wiki/`, `dice/` (`dice-core.js` floating panel, `dice-favorites.js`), `dmscreen/` (`dmscreen-render.js` widget registry, 21 widget types), `timers/`; plus single-file features: `initiative.js`, `initiative-extras.js`, `encounter-calculator.js`, `rest-manager.js`, `quick-actions.js`, `random-tables.js`, `loot-distribution.js`, `render-dashboard.js` (defines `renderAll()` at `:7`), `render-spells.js`, `render-loot.js`
- Depends on: core, utils, systems, render
- Used by: ui/actions (action handlers call feature functions)

**6. UI (`ui/`):**

- Purpose: Event wiring, editors, rendering infrastructure
- Contains: `event-delegation.js` (the `EventDelegation` registry), `actions/` (7 domain modules that register handlers: `entity-actions.js`, `combat-actions.js`, `ui-actions.js`, `dice-actions.js`, `wiki-actions.js`, `shop-actions.js`, `system-actions.js`), `editors/` (`rich-text.js` floating toolbar - manual DOM, no execCommand; `markdown-shortcuts.js`, `markdown-converter.js`), `virtual-scroll.js` (also calls `EventDelegation.init()` at `:101-105`), `dom-builder.js`, `safe-render.js`, `lazy-loading.js`, `layout-profiles.js`
- Depends on: everything above
- Used by: DOM events at runtime

## Data Flow

**Startup (dev mode):**

1. `index.html` loads `assets/styles.css` (@import hub) and `loader.js`
2. `loader.js` shows a loading screen, fetches 10 HTML templates from `assets/templates/` in parallel, then sequentially injects 92 `<script>` tags (`loader.js:169-228`)
3. Template HTML is inserted into `#app-root`, then `init()` (`core/init.js:5`) runs: resolves active campaign key → `await load()` → theme/layout → event listeners → `renderAll()` → subsystem inits (timers, backups, SW, PWA)

**Startup (bundled mode):** Single HTML file contains CSS in `<style>`, templates in `<body>`, all JS in one `<script>`; `init()` is invoked by an inline DOMContentLoaded handler appended by `build.py:461-472`.

**Mutation flow (the canonical CRUD pattern):**

1. User clicks element with `data-action="delete-npc" data-id="42"`
2. Capture-phase document listener in `EventDelegation._handleClick` (`ui/event-delegation.js:69`) resolves the handler from its `_handlers` Map and builds `ctx = { id, type, value, target, event }`
3. Handler (registered in `ui/actions/*.js`) calls the feature function, e.g. `deleteNPC(id)`
4. Feature function calls `saveUndoState(label)` BEFORE mutating, mutates `D`, then `save()` (debounced 1500ms) or `saveImmediate()`, then re-renders - often via `deleteWithConfirm()`/`afterCrudOperation()` from `utils/crud-helpers.js`
5. `save()` (`systems/spellslots/persistence.js:109`) serializes `D` to JSON → `StorageAPI.set(key, ...)`; auto-falls back to IndexedDB above ~5MB or on quota errors; calls `broadcastSave()` for other tabs

**Tab switching:**

1. Nav click → `switchView(name)` (`systems/spellslots/navigation.js:7`)
2. Toggles `.view.active` / `.nav-tab.active` classes, then delegates to `renderTabContent(name)` (`systems/tab-registry.js:100`)
3. `TAB_RENDER_REGISTRY` (`systems/tab-registry.js:7`) maps 17 tabs to `renders[]` (every switch), `init` (once), `cleanup` (on leave). New tabs MUST be registered here, never special-cased in `switchView`.

**State Management:**

- `window.D` is the single source of truth (schema in `core/data.js`: characters, npcs, locations, quests, encounters, initiative, spells, loot, wiki, sessionNotes, storyArcs, links, filters, calendar, tags, settings, `_nextId`)
- Optional collections are lazily initialized by their features: `D.randomTables` (`features/random-tables.js:21`), `D.shops` (`features/shops/shops-core.js:344`), `D.dmScreenLayout` (`features/dmscreen/dmscreen-render.js:174`), `D.quickRefCustom`, `D.diceHistory`, `D.partyGold`
- Undo/redo: full-state JSON snapshots on stacks capped at 30 (`systems/undo.js:5-20`); restore clears and `Object.assign`s into the same `D` object (it is `const`)
- Versioned migrations on load: `MIGRATIONS` map keyed by version in `systems/spellslots/version-migration.js:9`, applied by `migrateData()` when `D._version` < `APP_CONFIG.VERSION`
- DM Screen live-sync: wraps `window.save` once (`window._originalSave` pattern) and refreshes widgets debounced 150ms

## Key Abstractions

**`EventDelegation`** (`ui/event-delegation.js:36`):

- Purpose: Central action dispatch replacing inline onclick handlers
- Pattern: `Map<actionName, handler>`; action modules self-register at load via `EventDelegation.registerAction(name, handler)` loops (e.g. `ui/actions/entity-actions.js:181-185`). Legacy `data-on-change`/`data-on-input` handler names are whitelist-validated (`ALLOWED_CHANGE_HANDLERS`, `:9`).

**`TAB_RENDER_REGISTRY`** (`systems/tab-registry.js:7`):

- Purpose: Declarative tab → render-function mapping with lifecycle hooks and DEBUG-mode validation (`validateTabRegistry()`)

**`EntityLookup`** (`render/helpers.js:440`):

- Purpose: Centralized entity access by type+id with optional caching
- Pattern: `EntityLookup.enableCache()` at start of heavy renders, `clearCache()` at end; convenience methods `EntityLookup.npc(id)`, `.character(id)`, etc.; `findByName()` for combat lookups

**`StorageAPI`** (`utils/basic.js:158`):

- Purpose: Exception-safe localStorage wrapper returning `{ success, error }` results; JSON helpers; quota/private-browsing detection

**`ErrorHandler` + `safeRender`** (`render/helpers.js:9`, `:103`):

- Purpose: Error ring buffer (50 entries), debounced error toasts, render error boundaries with optional fallback render

**CRUD helpers** (`utils/crud-helpers.js`):

- `deleteWithConfirm({ entityType, id, onSuccess })`, `afterCrudOperation(renderFn, message)`, `saveEntityWithUndo({...})` - standard flows wrapping confirm + undo + mutate + save + toast

**Widget registry (DM Screen)** (`features/dmscreen/dmscreen-render.js`):

- `getDMScreenWidgets()` returns `{ type: { name, icon, render, compact } }`; layouts stored as `{ id, type, visible }[]` in `D.dmScreenLayout`; profiles in `D.dmScreenProfiles`

**Build deduplication** (`build.py:96-228`):

- Pass 1 collects real declarations, Pass 2 strips conflicting/duplicate `var X = window.X` import-aliases, Pass 3 comments out duplicate `function` declarations. Constrains coding style: never `const X = window.X` inside functions; never duplicate top-level function names across modules.

## Entry Points

**`index.html`:**

- Location: project root
- Triggers: browser navigation (dev mode)
- Responsibilities: shell with `#app-root` placeholder, Google Fonts links, loads `assets/styles.css` + `loader.js`

**`loader.js` → `init()`:**

- Location: `loader.js`, `core/init.js:5`
- Triggers: DOMContentLoaded
- Responsibilities: load modules/templates, then bootstrap (campaign resolution, `load()`, listener setup, `renderAll()`, auto-backup, SW/PWA init)

**`dist/dnd-tracker-bundled.html` / `dist/dnd-tracker-optimized.html`:**

- Generated by `build.py`; self-contained; inline bootstrap calls `init()` directly. Playwright E2E runs against the bundled dev file.

**`sw.js`:**

- Triggers: registered by `registerServiceWorker()` (`core/init.js:170`) only when served over http(s)
- Responsibilities: cache-first offline support for same-origin assets

**`main.js`:**

- Placeholder from an abandoned TypeScript-migration entry point; merely injects `loader.js`. NOT referenced by `index.html` or the build - effectively dead code.

## Error Handling

**Strategy:** Defensive, never-crash. Errors are logged, surfaced as toasts, and rendering degrades gracefully instead of white-screening.

**Patterns:**

- Global hooks: `window.onerror` / `window.onunhandledrejection` (`core/init.js:7-19`)
- Render boundaries: `safeRender(fn, fnName, containerId, options)` with optional fallback render and error toast
- Per-action try/catch inside `EventDelegation` dispatch (`ui/event-delegation.js:101-109`)
- Defensive existence checks before cross-module calls: `if (typeof window.fn === 'function') window.fn()` - pervasive because load-order/optional modules
- Storage failures cascade: localStorage → IndexedDB fallback → error toast advising export (`systems/spellslots/persistence.js:54-68`)
- Logging gated by `APP_CONFIG.DEBUG_MODE`; `ErrorHandler.log(fnName, error, context)` is the sanctioned channel (raw `console.log` is banned in production paths)

## Cross-Cutting Concerns

**Logging:** `log()` (`utils/performance.js:9`) - debug-gated console; `ErrorHandler` for errors; in-app event log panel via `showToast()` (`utils/utilities.js:258`)

**Validation:** `VALIDATION_SCHEMAS` + `validateAndShowErrors()` in `utils/validation.js` (type, required, maxLength, `entityRef` foreign keys); `validateDataIntegrity()` repairs data on load; `parseEntityId()` for all string/number ID normalization

**XSS prevention:** `esc()` for text interpolation, `sanitizeHTML()` (DOMParser-based allowlist, `utils/basic.js:44`) for rich-text content - mandatory for anything from `D`

**Authentication:** none (local single-user app)

**Persistence triggers:** every mutation path ends in `save()` (debounced) or `saveImmediate()`; `startAutoBackup()` snapshots to IndexedDB every 5 min (`APP_CONFIG.BACKUP_INTERVAL`); session timer auto-save every 300s

**Multi-campaign isolation:** each campaign is a separate localStorage key; switching writes the index and `location.reload()`s (`systems/campaign-manager/campaign-manager.js:48-53`)

**Note on removed feature:** The Mindmap/Network visualization (`features/network/mindmap.js`, `D.mindmap`) was removed entirely (git commit `7ef9bf5`). Residual references remain in `systems/campaign-manager/campaign-manager.js:35` (empty-campaign template still seeds `mindmap: { nodes: [], connections: [] }`), `systems/backups.js`, and `systems/spellslots/import-export.js` (backward-compat for old exports). CLAUDE.md still documents the feature - treat those sections as stale.

---

_Architecture analysis: 2026-06-11_
