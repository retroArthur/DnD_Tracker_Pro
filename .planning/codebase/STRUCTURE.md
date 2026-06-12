# Codebase Structure

**Analysis Date:** 2026-06-11

## Directory Layout

```
dnd-tracker-modular/
├── index.html              # Dev-mode shell (loads styles.css + loader.js)
├── loader.js               # Dev module loader: MODULES array (92 entries) + template fetcher
├── main.js                 # Dead placeholder from abandoned TS migration (just loads loader.js)
├── sw.js                   # Service Worker (cache-first offline support)
├── build.py                # Build system: concat + dedup + minify → single HTML
├── build_wrapper.py        # UTF-8 wrapper for build.py on Windows
├── validate.py             # Source validation script (HTML-tags-in-JS checks)
├── core/                   # Config, data schema, constants, themes, SRD data, init
├── utils/                  # DOM/string helpers, StorageAPI, crud-helpers, validation
├── systems/                # Cross-cutting subsystems (undo, backups, tags, search, ...)
│   ├── spellslots/         # 11-module subsystem incl. persistence, navigation, migration
│   ├── search/             # global-search.js (fuzzy search)
│   └── campaign-manager/   # Multi-campaign management
├── render/                 # helpers.js only: ErrorHandler, EntityLookup, safeRender
├── features/               # Domain features (one folder or file per domain)
│   ├── party/  npcs/  locations/  quests/  encounters/
│   ├── shops/  sessions/  wiki/  dice/  dmscreen/  timers/
│   └── *.js                # initiative, encounter-calculator, rest-manager, ...
├── ui/                     # Event delegation, action handlers, editors, virtual scroll
│   ├── actions/            # 7 data-action handler modules (entity, combat, ui, ...)
│   └── editors/            # rich-text.js, markdown-shortcuts.js, markdown-converter.js
├── assets/
│   ├── styles.css          # @import hub for the 13 CSS modules (dev mode)
│   ├── styles/             # 13 modular CSS files (~22k lines)
│   ├── templates/          # 10 HTML templates (header, 5 views, 4 modal groups)
│   └── body.html           # Legacy note file (replaced by templates/)
├── types/                  # entities.d.ts, globals.d.ts, index.d.ts (+60 co-located .d.ts)
├── tests/
│   ├── unit/               # Jest unit tests (7 files)
│   ├── integration/        # Jest integration tests (3 files)
│   ├── e2e/                # Playwright specs (app, tab-navigation, crud/, features/, integration/)
│   ├── build/              # Python tests for build.py deduplication
│   └── setup.js            # Jest setup (jsdom globals)
├── tools/                  # Python analysis/migration scripts + debug.js (in build!)
├── docs/                   # bugfixes.md, build-system.md, e2e-failure-triage.md
├── dist/                   # BUILD OUTPUT (gitignored): bundled + optimized HTML
└── .github/workflows/      # ci.yml (lint+typecheck, test, build)
```

## Directory Purposes

**`core/` (4 modules + init + SRD data):**

- Purpose: App foundation, loaded first; `core/init.js` loaded last
- Key files: `core/config.js` (frozen `APP_CONFIG`, version 2.6.0), `core/data.js` (D schema), `core/constants.js` (`DND_RULES`, `UI_CONSTANTS`, `EDITOR_FONTS`, `READ_ALOUD_STYLES`, `COMBAT_CONSTANTS`, `UI_TIMING`), `core/themes.js`, `core/srd-spells.js`, `core/init.js` (bootstrap, IndexedDB wrapper, SW registration)

**`utils/` (10 modules):**

- Purpose: Infrastructure helpers used by every layer
- Key files: `utils/basic.js` (`$`, `$$`, `esc`, `sanitizeHTML`, `StorageAPI`), `utils/utilities.js` (`$c`, `debounce`, `throttle`, `parseEntityId`, `nextId`, `showToast`), `utils/crud-helpers.js`, `utils/validation.js`, `utils/filter-engine.js`, `utils/form-helpers.js`, `utils/game-rules.js`, `utils/performance.js`, `utils/performance-extras.js`
- Special: `utils/testable-utils.js` is a Jest-importable mirror of core helpers - NOT part of the build; it has its own 80% coverage threshold in `jest.config.cjs`

**`systems/` (22 modules):**

- Purpose: Cross-cutting subsystems
- Key files: `systems/undo.js`, `systems/backups.js`, `systems/tab-registry.js`, `systems/entity-links.js`, `systems/conditions.js`, `systems/hp-calculator.js`, `systems/avatars.js`, `systems/tags.js`, `systems/session-timer.js`, `systems/wiki-links.js`, `systems/markdown-import-export.js`, `systems/search/global-search.js`, `systems/campaign-manager/campaign-manager.js`
- `systems/spellslots/` is a historical extraction of a former monolith (`spellslots.js`) and now hosts app-wide concerns beyond spell slots: `persistence.js` (save/saveImmediate), `quick-roll.js` (contains the global `load()`), `navigation.js` (`switchView`, `showModal`, `hideModal`), `version-migration.js`, `keyboard-shortcuts.js`, `quick-reference.js`, `pwa-install.js`, `virtual-list.js`, `import-export.js`, `notes-templates.js`, `spell-slots-core.js`, `spellslots-ui.js`

**`render/` (1 module):**

- Purpose: Shared render infrastructure
- Key files: `render/helpers.js` (`ErrorHandler`, `safeExecute`, `safeRender`, `EntityLookup`, `getEntityForCombat`)

**`features/` (35 modules):**

- Purpose: Domain logic + rendering, one concern per file
- Entity folders follow a render/crud split: e.g. `features/party/party-render.js`, `features/party/party-details.js`, `features/party/party-crud.js`; `features/npcs/npc-render.js`, `npc-interactions.js`, `npc-dialogs.js`, `npc-crud.js`, `npc-popup.js`
- Largest files: `features/dmscreen/dmscreen-render.js` (1,570 lines), `features/initiative.js` (1,384), `features/wiki/wiki.js` (1,227), `features/encounter-calculator.js` (1,199), `features/shops/shops-core.js` (1,053)
- Root-level feature files: `render-dashboard.js` (defines `renderAll()`), `render-spells.js`, `render-loot.js`, `initiative.js`, `initiative-extras.js`, `encounter-calculator.js`, `rest-manager.js`, `quick-actions.js`, `random-tables.js`, `loot-distribution.js`

**`ui/` (16 modules):**

- Purpose: Event wiring and UI infrastructure
- Key files: `ui/event-delegation.js` (`EventDelegation` registry + legacy handler whitelist), `ui/virtual-scroll.js` (also bootstraps `EventDelegation.init()`), `ui/editors/rich-text.js` (1,488 lines), `ui/safe-render.js`, `ui/dom-builder.js`, `ui/lazy-loading.js`, `ui/layout-profiles.js`
- `ui/actions/`: one module per domain registering `data-action` handlers - `entity-actions.js`, `combat-actions.js`, `ui-actions.js`, `dice-actions.js`, `wiki-actions.js`, `shop-actions.js`, `system-actions.js`

**`assets/`:**

- `assets/styles/`: `variables.css` (CSS custom properties - always use `var(--gold)` etc.), `core.css`, `editors.css`, `npcs.css`, `encounters.css`, `initiative.css`, `loot.css`, `spells.css`, `party.css`, `dashboard.css` (3,432 lines, largest), `dmscreen.css`, `dice.css`, `tools.css`
- `assets/templates/`: `header.html`, `view-party.html`, `view-content.html`, `view-encounters.html`, `view-resources.html`, `view-tools.html`, `modals-entity.html`, `modals-shops.html`, `modals-tools.html`, `modals-editors.html` (largest, 768 lines)

**`tests/`:**

- `tests/unit/`: `encounter-calculator.test.js`, `entities.test.js`, `markdown-converter.test.js`, `markdown-shortcuts.test.js`, `security.test.js`, `stability.test.js`, `utilities.test.js`
- `tests/integration/`: `character-management.test.js`, `combat-system.test.js`, `encounter-builder.test.js`
- `tests/e2e/`: `app.spec.js`, `tab-navigation.spec.js`, `crud/{party,npcs,locations,quests,encounters}.spec.js`, `features/{dice,initiative,persistence,wiki}.spec.js`, `integration/workflows.spec.js`, helpers in `tests/e2e/helpers/`; reports/test-results are generated artifacts
- `tests/build/test_build_deduplication.py`: TDD suite for build.py dedup

**`tools/`:**

- Python dev scripts: `analyze-render.py`, `migrate-event-handlers.py`, `check-globals.py`, `purge-css.py`, `split-*.py`, `logging_util.py` (imported by build.py)
- `tools/debug.js` is RUNTIME code (in the build, second-to-last module) - the in-app debug log

**`types/`:**

- `entities.d.ts`, `globals.d.ts`, `index.d.ts` plus ~60 co-located `module.d.ts` files next to their `.js` sources; consumed only by `tsc --noEmit`

## Key File Locations

**Entry Points:**

- `index.html`: dev shell → `loader.js` → `core/init.js` `init()`
- `dist/dnd-tracker-bundled.html` / `dist/dnd-tracker-optimized.html`: generated single-file builds (E2E targets the bundled one)

**Configuration:**

- `core/config.js`: all app settings (`APP_CONFIG`)
- `loader.js` + `build.py:249-355`: the two module-order lists (keep in sync!)
- `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `jest.config.cjs`, `playwright.config.js`

**Core Logic:**

- State: `core/data.js`; persistence: `systems/spellslots/persistence.js` (save) + `systems/spellslots/quick-roll.js:23` (load); migrations: `systems/spellslots/version-migration.js`
- Navigation: `systems/spellslots/navigation.js` (`switchView`) + `systems/tab-registry.js` (`TAB_RENDER_REGISTRY`)
- Event dispatch: `ui/event-delegation.js` + `ui/actions/*.js`

**Testing:**

- Jest setup: `tests/setup.js`; run single file: `npx jest tests/unit/utilities.test.js`
- E2E requires a build first: `python build.py` then `npx playwright test`

## Naming Conventions

**Files:**

- kebab-case JS: `entity-links.js`, `hp-calculator.js`, `dmscreen-render.js`
- Feature-folder prefixing: `features/npcs/npc-render.js`, `features/party/party-crud.js` (folder name + concern suffix: `-render`, `-crud`, `-details`, `-interactions`, `-dialogs`, `-popup`, `-core`)
- Render/CRUD split is the standard decomposition for entity features
- Tests: `*.test.js` (Jest), `*.spec.js` (Playwright)
- Type declarations: `<module>.d.ts` co-located with `<module>.js`

**Code:**

- Section markers at file top: `// [SECTION:MODULE_NAME]`
- Functions camelCase and global; render functions named `renderX`, init functions `initX`, modals `showXModal`/`hideModal`
- Constants UPPER_SNAKE in `core/constants.js`, accessed via `DND_RULES.*` / `UI_CONSTANTS.*` namespaces (legacy direct names still work)
- CSS: feature-prefixed BEM-lite (`.dms-widget`, `.dms-widget-header`, modifier `.dms-item.active`); DM Screen prefix `dms-`

## Where to Add New Code

**New Feature (e.g. a new tab/domain):**

- Primary code: `features/<name>/<name>-render.js` + `features/<name>/<name>-crud.js` (or single `features/<name>.js` for small features)
- MANDATORY registration in THREE places:
    1. `loader.js` MODULES array (correct position: after its dependencies, before `ui/` actions)
    2. `build.py` modules list (same position - lists must match)
    3. `systems/tab-registry.js` `TAB_RENDER_REGISTRY` if it has a tab (renders/init/cleanup)
- View HTML: add to an existing template in `assets/templates/` (views live in `view-*.html`, modals in `modals-*.html`)
- Actions: register `data-action` handlers in the matching `ui/actions/*.js` module (or `system-actions.js` for modals/misc)
- CSS: new file in `assets/styles/` requires BOTH an `@import` in `assets/styles.css` AND an entry in `build.py:359-365` `css_files`; otherwise add to the closest existing file
- Export only what other modules/HTML need: `window.fn = fn` at file bottom
- Tests: `tests/unit/<name>.test.js`, E2E in `tests/e2e/features/<name>.spec.js`

**New Cross-Cutting System:**

- Implementation: `systems/<name>.js` (or `systems/<name>/` folder for multi-file)
- Load before `render/helpers.js` in both module lists

**Utilities:**

- Shared helpers: `utils/` - and mirror pure functions into `utils/testable-utils.js` if they need unit tests without the global environment

**Critical constraints when adding modules (build dedup rules):**

- NEVER `const X = window.X` inside a function body (becomes a global conflict after concatenation)
- NEVER reuse a top-level `function` name that exists in another module
- NEVER `var X = window.X` for variables declared `const`/`let` elsewhere (SyntaxError in loader mode) - access the global directly
- Module-level window-imports use `var` only for function-declared or window-only globals (e.g. `var D = window.D`)

## Special Directories

**`dist/`:**

- Purpose: build outputs (`dnd-tracker-bundled.html`, `dnd-tracker-optimized.html`, `test-script.html`)
- Generated: Yes (`python build.py`)
- Committed: No (gitignored), but required locally for Playwright E2E

**`node_modules/`, `coverage/`, `tests/e2e/reports/`, `tests/e2e/test-results/`, `tools/__pycache__/`:**

- Generated: Yes / Committed: No (gitignored or artifacts)

**`types/` + co-located `.d.ts`:**

- Purpose: type information for `tsc --noEmit`; hand-maintained, NOT auto-generated by the normal workflow (tsconfig can emit them via `emitDeclarationOnly` but they are checked in)
- Committed: Yes

**`docs/`:**

- `docs/bugfixes.md` (bug patterns/lessons - consult before fixing bugs), `docs/build-system.md` (dedup details), `docs/e2e-failure-triage.md`
- Committed: Yes

**`assets/body.html`:**

- Legacy placeholder note from before the template split; real markup is in `assets/templates/`. Still listed in `sw.js:10` STATIC_ASSETS (stale reference).

---

_Structure analysis: 2026-06-11_
