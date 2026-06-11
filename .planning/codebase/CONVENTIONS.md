# Coding Conventions

**Analysis Date:** 2026-06-11

## Naming Patterns

**Files:**
- kebab-case for all JS modules: `utils/crud-helpers.js`, `systems/hp-calculator.js`, `ui/event-delegation.js`
- Feature modules follow `{feature}-{role}.js` pattern: `features/npcs/npc-render.js`, `features/npcs/npc-crud.js`, `features/party/party-details.js`, `features/quests/quests-crud.js`
- Roles in use: `-crud`, `-render`, `-details`, `-dialogs`, `-interactions`, `-popup`, `-core`, `-export`, `-extras`
- Action handler modules: `ui/actions/{domain}-actions.js` (e.g. `entity-actions.js`, `combat-actions.js`, `system-actions.js`)
- Type declarations: `.d.ts` files alongside sources and in `types/` (e.g. `types/entities.d.ts`, `types/globals.d.ts`) — used only for `tsc --noEmit` type-checking, not runtime
- Test files: `*.test.js` (Jest), `*.spec.js` (Playwright), `test_*.py` (pytest)

**Directories:**
- Lowercase, feature-grouped: `core/`, `utils/`, `systems/`, `features/`, `ui/`, `render/`
- Subsystems get subdirectories: `systems/spellslots/`, `systems/campaign-manager/`, `systems/search/`, `features/npcs/`, `ui/actions/`, `ui/editors/`

**Functions:**
- camelCase, verb-first: `saveQuest()`, `editQuest()`, `deleteQuest()`, `renderInit()`, `showToast()`, `populateQuestSelects()`
- Entity CRUD naming convention: `save{Entity}`, `edit{Entity}`, `delete{Entity}`, `render{Entity}`, `clear{Entity}Form` — sometimes abbreviated (`deleteChar`, `deleteNpc`, `deleteLoc` in production)
- Render helpers prefixed with `render`: `renderPartyOverview()`, `renderDeathSaves()`, `renderCombatantEffects()`
- Modal openers prefixed with `show`: `showHpCalculator()`, `showRestModal()`, `showAoEDamageModal()`

**Variables:**
- camelCase for locals and parameters: `numId`, `displayName`, `rewardItems`
- Singleton/service objects in PascalCase: `EventDelegation` (`ui/event-delegation.js`), `ErrorHandler` (`render/helpers.js`), `StorageAPI` (`utils/basic.js`), `PerformanceManager` (`utils/performance.js`), `EntityLookup`
- Private members use leading underscore: `EventDelegation._handlers`, `ErrorHandler._errorLog`, `D._nextId`
- Intentionally unused vars/args prefixed with `_` (enforced via ESLint `argsIgnorePattern: '^_'`)

**Types:**
- No runtime types (pure JS). Constants in UPPER_SNAKE_CASE: `APP_CONFIG` (`core/config.js`), `CONDITIONS`, `CATS`, `LINK_CATS` (`core/constants.js`), `VALIDATION_SCHEMAS` (`utils/validation.js`), `ALLOWED_CHANGE_HANDLERS` (`ui/event-delegation.js`), `UNDO_LIMIT` (`systems/undo.js`)
- Constants grouped in namespace objects: `DND_RULES.*` (D&D rules) and `UI_CONSTANTS.*` (UI/app constants) in `core/constants.js`; legacy direct access (`CONDITIONS`, `UI_TIMING`) still works
- Global single-letter conventions: `D` (global data object), `$`/`$$`/`$c` (DOM helpers)

## Code Style

**Formatting:**
- Prettier 3.x, config in `.prettierrc`:
  - `semi: true`, `singleQuote: true`, `tabWidth: 4`, `useTabs: false`
  - `trailingComma: "none"`, `bracketSpacing: true`, `arrowParens: "avoid"`
  - `printWidth: 100`, `endOfLine: "auto"`
- 4-space indentation in all runtime modules (`core/`, `utils/`, `systems/`, `features/`, `ui/`, `render/`)
- Config files and Playwright E2E tests use 2-space indentation (existing pattern in `playwright.config.js`, `jest.config.cjs`, `tests/e2e/`)
- `.prettierignore`: `node_modules/`, `dist/`, `coverage/`, `*.min.js`, `*.min.css`, `package-lock.json`
- Run: `npm run format` (write), `npm run format:check` (verify)

**Linting:**
- ESLint 9 flat config in `eslint.config.js`: `@eslint/js` recommended + `eslint-config-prettier`
- Intentionally relaxed for legacy JS: `no-unused-vars: warn` (with `^_` ignore), `no-undef: warn`, `no-console: off`, `no-prototype-builtins: off`
- App globals declared in config (`D` writable; `$`, `$$`, `esc`, `log`, `save`, `showToast`, `ErrorHandler`, `EntityLookup`, etc. readonly) — add new cross-module globals here when introducing them
- Test files (`tests/**`) get Jest globals and `no-unused-vars: off`
- Ignored: `node_modules/`, `dist/`, `coverage/`, `*.min.js`, `sw.js`
- Quality gate: `npm run lint` fails above 50 warnings (`--max-warnings 50`)
- Type checking: `npm run typecheck` (`tsc --noEmit` against JS via `tsconfig.json`, `checkJs: false`, declarations in `types/`)
- Combined gate: `npm run check` = tsc + lint + format:check (mirrors CI in `.github/workflows/ci.yml`)

## Import Organization

**Order:**
This is a NON-ESM codebase. Runtime modules have NO `import`/`export` statements — everything lives in global scope, loaded via `<script>` tags in the order defined by `loader.js` (and mirrored in `build.py` for the bundled build):
1. `core/` (config, data, constants, themes)
2. `utils/` (performance, basic, utilities, crud-helpers, validation, ...)
3. `systems/` (undo, spellslots, backups, ...)
4. `render/`, `features/`, `ui/`

New modules MUST be registered in both `loader.js` (`MODULES` array) and `build.py`, after their dependencies.

**Cross-module access rules (critical — build deduplication constraints):**
- `const`/`let`-declared globals (e.g. `APP_CONFIG`, `StorageAPI`, `ErrorHandler`, `log`) are in global lexical scope — access them directly. NEVER write `var APP_CONFIG = window.APP_CONFIG;` (causes `SyntaxError` after concatenation)
- NEVER use `const X = window.X;` inside a function for cross-module functions — call `window.X()` directly or use a function-level `const D = window.D;` only for window-attached (non-const) globals like `D`, `save`, `renderQuests` (pattern seen in `features/quests/quests-crud.js`, `systems/undo.js`)
- Module-level config constants use fallback pattern: `const UNDO_LIMIT = window.APP_CONFIG?.UNDO_LIMIT || 30;` (`systems/undo.js`)
- No duplicate function names across modules — `build.py` three-pass deduplication comments out duplicates and can orphan function bodies

**Path Aliases:**
- `@core/*`, `@features/*`, `@utils/*`, `@ui/*`, `@types/*`, `@systems/*`, `@render/*` defined in `tsconfig.json` and `jest.config.cjs` (`moduleNameMapper`) — used by tooling/tests only, never in runtime code

## Error Handling

**Patterns:**
- Central logger: `ErrorHandler.log(fnName, error, context)` in `render/helpers.js` — keeps ring buffer of 50 errors, writes `console.error` with `[fnName] (context)` prefix; debounced user toast via `ErrorHandler.showError(message)`
- Render error boundaries: wrap critical renders in `safeRender(fn, fnName, containerId, options)` (`render/helpers.js`) — logs, optionally toasts, renders fallback error state with reload button into the container, re-throws in `DEBUG_MODE`
- Generic guard: `safeExecute(fn, fnName, { fallback, showToast, onError })` (`render/helpers.js`); `withErrorBoundary(fn, context)` in `utils/utilities.js` supports sync AND async (catches Promise rejections)
- Storage never accessed raw: `StorageAPI.get/set/getJSON/setJSON` (`utils/basic.js`) wraps all `localStorage` calls in try/catch, returns `{ success, error }` result objects, distinguishes `QuotaExceededError` and `SecurityError` (private browsing) with German user toasts
- Event delegation handlers wrapped in try/catch with `ErrorHandler.log('EventDelegation', err, 'Action: X')` (`ui/event-delegation.js`)
- Optional chaining for global access: `window.ErrorHandler?.log(...)`, `window.APP_CONFIG?.DEBUG_MODE` — modules tolerate missing globals
- Defensive DOM checks: `if (!container) return;` with a `console.warn` gated by `DEBUG_MODE` (never silent in debug)
- User-facing errors via `showToast(msg, 'error')` — German text, emoji prefixes (`❌` error, `⚠️` warning, `✅` success, `↩️` undo)
- Global handlers: `window.onerror` and `unhandledrejection` route into `ErrorHandler` (`core/init.js`)
- Data integrity: `validateAndShowErrors(entity, 'schemaName')` against `VALIDATION_SCHEMAS` (`utils/validation.js`) before persisting; `validateAndRepairNextId()` (`utils/utilities.js`) repairs ID counters after restore/import

## Logging

**Framework:** Conditional console wrapper, no external library

**Patterns:**
- `log(...)` = `console.log.bind(console, '[DnD]')` only when `APP_CONFIG.DEBUG_MODE` is true, otherwise no-op (`utils/performance.js`); `warn`/`error` always active with `[DnD]` prefix
- NEVER raw `console.log()` in production paths — use `log()` or `ErrorHandler.log()` wrapped in `APP_CONFIG.DEBUG_MODE` checks (refactoring rule from Jan 2026, documented in `CLAUDE.md`)
- Subsystem prefixes in messages: `[DOM]`, `[Storage]`, `[EventDelegation]`, `[TabRegistry]`, `[Perf]`
- User notifications go through `showToast(msg, type, duration)` (`utils/utilities.js`) which renders into the `#event-log` panel (success/error/warning/info, timestamps, persistent mode via `L` key)
- Performance: `PerformanceManager.startMeasure(label)` / `endMeasure(label)` warns when > 50ms in debug mode (`utils/performance.js`)

## Comments

**When to Comment:**
- Every module starts with a section marker + banner (91 of 92 modules):
  ```javascript
  // [SECTION:QUESTS_CRUD]
  // ============================================================
  // QUESTS CRUD - @create @edit @delete @save
  // ============================================================
  ```
- Sub-sections separated with `// ============================================================` banners and a title line
- Language: UI strings MUST be German; comments are mixed German/English (German dominates in `utils/`, English in newer helpers like `utils/crud-helpers.js`) — both acceptable per `CLAUDE.md`
- Inline comments explain WHY (security reasoning, build constraints), e.g. `// SICHER: Verwendet DOMParser statt innerHTML` in `utils/basic.js`

**JSDoc/TSDoc:**
- JSDoc with `@param`, `@returns`, `@example` on shared utility functions (`utils/utilities.js`, `utils/crud-helpers.js`, `render/helpers.js`); ~21 of 92 modules use it
- `@type {Object.<string, string>}` annotations on constants in `core/constants.js`
- Playwright helpers use `// @ts-check` + JSDoc types: `@param {import('@playwright/test').Page} page` (`tests/e2e/helpers/test-utils.js`)
- Not enforced everywhere — required for new shared utilities, optional for feature-internal functions

## Function Design

**Size:** Keep functions under 100 lines (post-refactoring rule). Extract helpers like `getCombatantHpStatus()`, `renderCombatantEffects()` instead of mega-functions (see `features/initiative.js`).

**Parameters:** Config-object pattern for multi-option helpers: `deleteWithConfirm({ entityType, id, onSuccess, confirmMessage, undoLabel })` (`utils/crud-helpers.js`); defaults via destructuring with fallbacks.

**Return Values:** Result objects for fallible operations: `{ success: boolean, error?: string }` (`StorageAPI`), `{ valid: boolean, errors: [] }` (`validateEntityReferences`); `null` for not-found (`parseEntityId`, `withErrorBoundary` on error); booleans for did-it-happen (`deleteWithConfirm`).

**Mandatory CRUD pattern** (every destructive operation):
```javascript
function deleteEntity(id) {
    deleteWithConfirm({                    // utils/crud-helpers.js — confirm + undo + filter + save
        entityType: 'quests',
        id: id,
        undoLabel: 'Quest gelöscht',
        onSuccess: () => { renderQuests(); showToast('✅ Quest gelöscht', 'success'); }
    });
}
// Or manually: saveUndoState() / pushUndo(label) BEFORE mutation → mutate D → render → save()
```
- `saveUndoState()` / `pushUndo(label)` (`systems/undo.js`) MUST be called before any delete/edit/modify of `D`
- Post-operation flow via `afterCrudOperation(renderFn, message, toastType)` (`utils/crud-helpers.js`)
- ID comparisons ALWAYS via `parseEntityId(id)` (`utils/utilities.js:149`) — handles string/number mismatch, returns `null` if invalid
- New IDs via `nextId(type)` (`utils/utilities.js:191`)

**Security rules (non-negotiable):**
- `esc(text)` (`utils/basic.js:19`) for ALL user data interpolated into HTML templates
- `sanitizeHTML(html)` (`utils/basic.js:44`, DOMParser-based tag/attribute/protocol whitelist) for rich-text content before storing AND before re-inserting into `innerHTML`
- No inline `onclick` in new code — use `data-action` attributes handled by `EventDelegation` (`ui/event-delegation.js`); legacy `data-on-change` handlers must be whitelisted in `ALLOWED_CHANGE_HANDLERS`
- Validate user input limits in loops (DoS prevention, e.g. max range size in `features/random-tables.js`)

**DOM access:**
- `$(id)` — `getElementById` without `#` prefix, warns in debug mode when missing (`utils/basic.js:7`)
- `$$(sel)` — `querySelectorAll` wrapper; `$c(id)` — cached lookup (`utils/utilities.js:20`)
- Use `Array.from(querySelectorAll(...))` when mutating the result set

## Module Design

**Exports:** Explicit window assignment block at end of each module, only for functions used by OTHER modules or HTML:
```javascript
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.saveQuest = saveQuest;
window.editQuest = editQuest;
window.deleteQuest = deleteQuest;
```
(`features/quests/quests-crud.js:216-220`). Module-internal helpers are NOT exported (export audit rule). Some modules export nothing and rely on global lexical scope (`systems/undo.js`).

**Barrel Files:** Not applicable (non-ESM). `assets/styles.css` acts as a CSS `@import` hub for 13 modular stylesheets in `assets/styles/`; `loader.js` is the JS equivalent.

**Other module conventions:**
- One feature concern per file; registry patterns for extensibility: `TAB_RENDER_REGISTRY` (`systems/tab-registry.js`), `getDMScreenWidgets()` (`features/dmscreen/dmscreen-render.js`), `EventDelegation.registerActions({...})` (`ui/actions/*.js`)
- CSS classes prefixed per feature (`dms-` for DM Screen), BEM-lite naming, theme via CSS variables (`var(--gold)`, `var(--text-dim)`)
- Timers always cleaned up before re-creating (`if (intervalId) clearInterval(intervalId);`)
- `structuredClone()` (with polyfill) instead of `JSON.parse(JSON.stringify())` for deep cloning

---

*Convention analysis: 2026-06-11*
