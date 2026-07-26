# Codebase Structure

**Analysis Date:** 2026-07-26

## Directory Layout

```
dnd-tracker-modular/
├── index.html                  # Dev-mode HTML shell (loads styles.css + loader.js)
├── loader.js                   # Dev module loader (MODULES array = 123 entries, single source of truth)
├── main.js                     # Dead code (abandoned TS migration entry point)
├── sw.js                        # Service Worker (cache-first offline support)
├── build.py                     # Build system: reads loader.js lists → concat + dedup + minify → dist/
├── build_wrapper.py             # UTF-8 wrapper for build.py on Windows
├── validate.py                  # Source validation (HTML-in-JS checks)
│
├── core/                        # [1] Configuration, data schema, initialization (loaded first)
│   ├── config.js                # APP_CONFIG (frozen, version 2.6.1)
│   ├── data.js                  # window.D initialization schema
│   ├── constants.js             # D&D rules, UI timing, constants (DND_RULES, UI_CONSTANTS namespaces)
│   ├── themes.js                # Dark/light theme CSS injection
│   ├── srd-spells.js            # German SRD spell database (cached)
│   ├── srd-monsters.js          # SRD monster stats
│   └── init.js                  # Bootstrap sequence (loaded last)
│
├── utils/                       # [2] Infrastructure helpers (used by all layers)
│   ├── performance.js           # log(), ErrorHandler setup
│   ├── basic.js                 # $(), $$(), esc(), sanitizeHTML(), StorageAPI
│   ├── utilities.js             # $c(), debounce, throttle, parseEntityId, nextId, showToast, log
│   ├── crud-helpers.js          # deleteWithConfirm, afterCrudOperation, saveEntityWithUndo
│   ├── validation.js            # Validation schemas, validateAndShowErrors
│   ├── form-helpers.js          # Form manipulation utilities
│   ├── filter-engine.js         # Composable filtering logic
│   ├── game-rules.js            # D&D rule calculations (XP, proficiency bonus, etc.)
│   └── performance-extras.js    # Drag-drop, debounced renders
│
├── systems/                     # [3] Cross-cutting subsystems
│   ├── undo.js                  # Undo/redo stacks (snapshots, max 30)
│   ├── spellslots/              # Historical subsystem (now app-wide concerns)
│   │   ├── spell-slots-core.js  # Spell slot calculations
│   │   ├── persistence.js       # save(), saveImmediate(), post-save-hooks ⭐ CRITICAL
│   │   ├── quick-roll.js        # load() function (global data loading) ⭐ CRITICAL
│   │   ├── navigation.js        # switchView(), showModal(), hideModal()
│   │   ├── version-migration.js # Data migration on version updates
│   │   ├── quick-reference.js   # Quick reference UI & data
│   │   ├── keyboard-shortcuts.js # Global keyboard handlers
│   │   ├── import-export.js     # Data import/export
│   │   ├── pwa-install.js       # PWA install prompts
│   │   ├── virtual-list.js      # Virtual list rendering
│   │   ├── notes-templates.js   # Note templates
│   │   └── spellslots-ui.js     # Spell slots UI
│   ├── tab-registry.js          # TAB_RENDER_REGISTRY (maps tabs to renders/init/cleanup) ⭐ CRITICAL
│   ├── backups.js               # Auto-backup to IndexedDB
│   ├── entity-links.js          # Cross-entity [[type:id:name]] linking
│   ├── conditions.js            # D&D conditions reference
│   ├── hp-calculator.js         # HP modification modal
│   ├── avatars.js               # Avatar/image management
│   ├── tags.js                  # Entity tagging system
│   ├── session-timer.js         # Session timer
│   ├── wiki-links.js            # Wiki linking utilities
│   ├── markdown-import-export.js # Markdown data import/export
│   ├── search/
│   │   └── global-search.js     # Fuzzy search across all entities
│   ├── campaign-manager/
│   │   └── campaign-manager.js  # Multi-campaign management
│   ├── migration/               # Data migration wizard
│   │   ├── full-export.js       # Export all data
│   │   └── migration-wizard.js  # Migration UI
│   └── file-backup/             # File-based backup system
│       ├── file-backup-permissions.js
│       ├── file-backup-manager.js
│       └── file-backup-ui.js
│
├── render/                      # [4] Render infrastructure (1 file)
│   └── helpers.js               # ErrorHandler, safeRender, EntityLookup (w/ optional cache)
│
├── features/                    # [5] Domain features (35+ modules, 59 files total)
│   ├── party/                   # Character management
│   │   ├── party-render.js      # Party roster render
│   │   ├── party-details.js     # Character detail modal
│   │   └── party-crud.js        # Character CRUD
│   ├── npcs/                    # NPC management
│   │   ├── npc-render.js
│   │   ├── npc-interactions.js
│   │   ├── npc-dialogs.js
│   │   ├── npc-crud.js
│   │   └── npc-popup.js
│   ├── locations/               # Location management
│   │   ├── locations-render.js
│   │   └── locations-crud.js
│   ├── quests/                  # Quest tracking
│   │   ├── quests-render.js
│   │   └── quests-crud.js
│   ├── encounters/              # Encounter management
│   │   ├── encounters-render.js
│   │   ├── encounters-crud.js
│   │   └── monster-templates.js
│   ├── loot/                    # Loot distribution (root-level file)
│   ├── spells/                  # Spell management (root-level file)
│   ├── wiki/                    # Custom wiki
│   │   └── wiki.js
│   ├── shops/                   # Shop management
│   │   ├── shops-core.js
│   │   ├── shop-export.js
│   │   └── links.js
│   ├── sessions/                # Session notes
│   │   └── sessions.js
│   ├── dice/                    # Dice roller
│   │   ├── dice-core.js         # Floating dice panel
│   │   └── dice-favorites.js
│   ├── dmscreen/                # DM Screen dashboard
│   │   └── dmscreen-render.js   # 21+ widget types, profiles
│   ├── timers/                  # Combat & session timers
│   │   └── timers.js
│   ├── initiative.js            # Combat tracker (1,381 lines)
│   ├── initiative-extras.js     # Initiative add-ons
│   ├── initiative-mob.js        # Mob combat rules
│   ├── initiative-statblock.js  # Statblock display
│   ├── encounter-calculator.js  # Encounter balance (1,574 lines)
│   ├── rest-manager.js          # Rest mechanics
│   ├── quick-actions.js         # Combat action shortcuts
│   ├── random-tables.js         # Custom rollable tables
│   ├── loot-distribution.js     # Loot splitting
│   ├── render-dashboard.js      # Dashboard (defines renderAll())
│   ├── render-spells.js         # Spell list rendering
│   ├── render-loot.js           # Loot list rendering
│   ├── bestiary/                # Custom creature database (Phase 3)
│   │   ├── bestiary-render.js
│   │   ├── bestiary-crud.js
│   │   ├── bestiary-editor.js
│   │   └── bestiary-actions.js
│   ├── npc-generator/           # NPC generation (Phase 6)
│   │   ├── npc-default-tables.js
│   │   └── npc-generator.js
│   ├── timeline/                # Calendar & timeline (Phase 5)
│   │   ├── timeline-render.js
│   │   └── timeline-crud.js
│   ├── reise/                   # Travel system (Phase 5)
│   │   ├── reise-default-tables.js
│   │   ├── reise-render.js
│   │   └── reise-crud.js
│   ├── fraktionen/              # Factions (Phase 5)
│   │   ├── fraktionen-render.js
│   │   └── fraktionen-crud.js
│   ├── session-prep/            # Session planning (Phase 5)
│   │   ├── session-prep-render.js
│   │   └── session-prep-crud.js
│   ├── soundboard/              # Audio player (Phase 7)
│   │   ├── soundboard-idb.js
│   │   ├── soundboard-player.js
│   │   ├── soundboard-crud.js
│   │   └── soundboard-render.js
│   ├── dice-stats/              # Dice statistics (Phase 7)
│   │   ├── dice-stats-idb.js
│   │   └── dice-stats-render.js
│   ├── command-palette/         # Quick command palette (Phase 2)
│   │   ├── action-registry.js
│   │   └── command-palette.js
│   └── *.d.ts files             # TypeScript declarations for features
│
├── ui/                          # [6] Event wiring and UI infrastructure
│   ├── event-delegation.js      # EventDelegation registry + data-action dispatch ⭐ CRITICAL
│   ├── actions/                 # Action handler modules (7 domains, 433 handlers)
│   │   ├── entity-actions.js    # Character, NPC, location, quest, encounter actions
│   │   ├── combat-actions.js    # Initiative & combat actions
│   │   ├── ui-actions.js        # UI/modal actions
│   │   ├── dice-actions.js      # Dice roller actions
│   │   ├── wiki-actions.js      # Wiki actions
│   │   ├── shop-actions.js      # Shop actions
│   │   └── system-actions.js    # System/modal actions
│   ├── editors/                 # Text editors
│   │   ├── rich-text.js         # Rich text editor w/ floating toolbar (1,500+ lines)
│   │   ├── markdown-shortcuts.js # Markdown shortcut expansion
│   │   └── markdown-converter.js # Markdown ↔ HTML conversion
│   ├── virtual-scroll.js        # Efficient list rendering + EventDelegation.init()
│   ├── dom-builder.js           # DOM construction helpers
│   ├── safe-render.js           # Error boundaries for renders
│   ├── lazy-loading.js          # Lazy loading utilities
│   └── layout-profiles.js       # Layout profile management
│
├── assets/                      # Static resources
│   ├── styles.css               # @import hub (25 lines) — orders 20 CSS modules
│   ├── styles/                  # Modular CSS (20 files, ~27k lines total)
│   │   ├── variables.css        # CSS custom properties (use var(--gold), etc.)
│   │   ├── core.css             # Global layout, utilities
│   │   ├── editors.css          # Editor styling
│   │   ├── npcs.css             # NPC UI
│   │   ├── encounters.css       # Encounter UI
│   │   ├── initiative.css       # Combat tracker
│   │   ├── loot.css             # Loot UI
│   │   ├── spells.css           # Spell UI
│   │   ├── party.css            # Party/character UI
│   │   ├── dashboard.css        # Dashboard (3,400+ lines, largest)
│   │   ├── dmscreen.css         # DM screen widgets
│   │   ├── dice.css             # Dice roller UI
│   │   └── tools.css            # Tools & reference UI
│   ├── templates/               # HTML templates (12 files)
│   │   ├── header.html          # Navigation header
│   │   ├── view-party.html      # Party tab
│   │   ├── view-content.html    # NPCs/Locations/Quests tabs
│   │   ├── view-encounters.html # Encounters/Initiative tabs
│   │   ├── view-bestiary.html   # Bestiary tab
│   │   ├── view-resources.html  # Spells/Loot/Shops tabs
│   │   ├── view-tools.html      # Dice/Wiki/Links/Timers tabs
│   │   ├── view-welt.html       # World/Phase 5 tabs (session-prep, timeline, reise, fraktionen)
│   │   ├── modals-entity.html   # Entity edit/detail modals
│   │   ├── modals-shops.html    # Shop modals
│   │   ├── modals-tools.html    # Tool/reference modals
│   │   └── modals-editors.html  # Rich editor modals
│   ├── fonts/                   # Google Fonts directory
│   └── body.html                # Legacy placeholder (templates replaced it)
│
├── types/                       # TypeScript type definitions
│   ├── entities.d.ts            # Entity type schemas
│   ├── globals.d.ts             # Global type stubs
│   ├── index.d.ts               # Main type entry
│   └── *.d.ts (60)              # Co-located with .js modules
│
├── tests/                       # Test suites
│   ├── setup.js                 # Jest configuration
│   ├── unit/                    # Jest unit tests (7 files)
│   │   ├── encounter-calculator.test.js
│   │   ├── entities.test.js
│   │   ├── markdown-converter.test.js
│   │   ├── markdown-shortcuts.test.js
│   │   ├── security.test.js
│   │   ├── stability.test.js
│   │   └── utilities.test.js
│   ├── integration/             # Jest integration tests (3 files)
│   │   ├── character-management.test.js
│   │   ├── combat-system.test.js
│   │   └── encounter-builder.test.js
│   ├── e2e/                     # Playwright E2E tests
│   │   ├── app.spec.js          # App loading & basic functionality
│   │   ├── tab-navigation.spec.js # Tab switching
│   │   ├── crud/                # CRUD tests per entity (5 files)
│   │   │   ├── party.spec.js
│   │   │   ├── npcs.spec.js
│   │   │   ├── locations.spec.js
│   │   │   ├── quests.spec.js
│   │   │   └── encounters.spec.js
│   │   ├── features/            # Feature-specific tests (5 files)
│   │   │   ├── dice.spec.js
│   │   │   ├── initiative.spec.js
│   │   │   ├── persistence.spec.js
│   │   │   ├── wiki.spec.js
│   │   │   └── editor-formatting.spec.js
│   │   ├── integration/
│   │   │   └── workflows.spec.js # Multi-step workflows
│   │   ├── helpers/             # E2E test utilities
│   │   │   └── common.js
│   │   └── reports/             # Test run reports (generated)
│   └── build/                   # Python build system tests
│       └── test_build_deduplication.py # TDD for build.py dedup
│
├── tools/                       # Development/analysis scripts
│   ├── analyze-render.py        # Analyze render function structure
│   ├── migrate-event-handlers.py # Migrate inline handlers to data-action
│   ├── check-globals.py         # Check global variable usage
│   ├── purge-css.py             # Find unused CSS
│   ├── split-*.py               # CSS splitting utilities
│   ├── logging_util.py          # Logging utilities (imported by build.py)
│   └── debug.js                 # RUNTIME debug log (in build, second-to-last)
│
├── docs/                        # Documentation
│   ├── bugfixes.md              # Bug patterns & lessons (consult before fixing bugs)
│   ├── build-system.md          # Build deduplication details
│   ├── e2e-failure-triage.md    # E2E test troubleshooting
│   └── architecture/            # Architecture documentation
│
├── dist/                        # BUILD OUTPUT (gitignored, required for E2E)
│   ├── dnd-tracker-bundled.html # Dev build (readable, E2E target)
│   ├── dnd-tracker-optimized.html # Production build (minified)
│   └── test-script.html         # Test harness
│
├── .github/workflows/
│   └── ci.yml                   # GitHub Actions CI (lint, typecheck, test, build)
│
├── .planning/codebase/          # This documentation
│   ├── ARCHITECTURE.md          # System architecture & layers
│   ├── STRUCTURE.md             # This file (directory & file organization)
│   ├── CONVENTIONS.md           # Coding patterns & style
│   ├── TESTING.md               # Test organization & patterns
│   ├── STACK.md                 # Technology stack
│   ├── INTEGRATIONS.md          # External integrations
│   └── CONCERNS.md              # Technical debt & issues (curated)
│
└── package.json, tsconfig.json, jest.config.cjs, playwright.config.js, .eslintrc.js, .prettierrc
```

## Directory Purposes

**`core/` (7 modules) — Application Foundation:**

- Loaded first in module order
- `config.js`: APP_CONFIG (frozen object, version 2.6.1, all app settings)
- `data.js`: D object schema (characters, npcs, locations, initiatives, etc.)
- `constants.js`: D&D 5e rules (DND_RULES, UI_CONSTANTS namespaces), timings, icon maps
- `themes.js`: Dark/light theme CSS injection
- `srd-spells.js`, `srd-monsters.js`: German SRD data
- `init.js`: Bootstrap (loads campaign, themes, layout, inits subsystems, renders dashboard, registers Service Worker). Loaded LAST.

**`utils/` (9 modules) — Infrastructure Helpers:**

- Pure functions used by all layers
- `basic.js`: DOM helpers ($, $$, esc, sanitizeHTML), StorageAPI (exception-safe localStorage wrapper)
- `utilities.js`: Caching, debounce/throttle, entity ID parsing, showToast, event logging
- `crud-helpers.js`: Standardized CRUD patterns (deleteWithConfirm, afterCrudOperation, saveEntityWithUndo)
- `validation.js`: Validation schemas, entityRef foreign-key checks, validateAndShowErrors
- Form, filter, game rule utilities

**`systems/` (30 modules) — Cross-Cutting Subsystems:**

- Undo/redo, persistence, navigation, entity linking, search, backups, conditions, HP calc, avatars, tags, session timer, wiki links, markdown, campaign manager, migrations, file backup
- **`systems/spellslots/` subsystem (12 modules):** Historical extraction, now hosts app-wide concerns
  - `persistence.js`: save(), saveImmediate(), post-save-hook system ⭐ CRITICAL
  - `quick-roll.js`: load() function (global data loading) ⭐ CRITICAL
  - `navigation.js`: switchView(), showModal(), hideModal()
  - Other: version migration, quick reference, keyboard shortcuts, import/export, PWA, virtual list, notes templates, UI

**`render/` (1 module) — Render Infrastructure:**

- `helpers.js`: ErrorHandler (error ring buffer), safeRender (error boundaries), EntityLookup (with optional per-render cache)

**`features/` (59 files across 20+ subdirectories) — Domain Features:**

- Each feature in own subdirectory (or file) with `*-render.js`, `*-crud.js`, optional `*-dialogs.js`
- Entities: party (3 files), npcs (5), locations (2), quests (2), encounters (3), wiki (1)
- Systems: spells (1), loot (1), shops (3), sessions (1), dice (2), timers (1), initiative (4), dmscreen (1)
- Modern features: bestiary (4, Phase 3), npc-generator (2, Phase 6), timeline (2, Phase 5), reise (3, Phase 5), fraktionen (2, Phase 5), soundboard (4, Phase 7), dice-stats (2, Phase 7), session-prep (2, Phase 5), command-palette (2, Phase 2)
- Root-level: render-dashboard, render-spells, render-loot, encounter-calculator (largest feature), rest-manager, quick-actions, random-tables, loot-distribution, initiative-extras, initiative-mob, initiative-statblock

**`ui/` (16 modules) — Event Wiring & Infrastructure:**

- `event-delegation.js`: Central EventDelegation registry, data-action dispatch ⭐ CRITICAL
- `actions/` (7 files): Action handler modules registering 433 handlers (entity, combat, ui, dice, wiki, shop, system)
- `editors/`: Rich text editor (1,500+ lines), markdown shortcuts/converter
- Other: virtual scroll, DOM builder, safe render, lazy load, layout profiles

**`assets/` — Styles & Templates:**

- `styles/`: 20 modular CSS files (~27k lines), ordered by @import in styles.css hub
- `templates/`: 12 HTML template files (header, 4 view groups, 4 modal groups)

## Key File Locations

**Entry Points:**

- `index.html`: Dev shell → `loader.js` → `core/init.js` init()
- `dist/dnd-tracker-bundled.html`: Generated single-file build (dev, E2E target)
- `dist/dnd-tracker-optimized.html`: Generated single-file build (production)

**Configuration:**

- `core/config.js`: APP_CONFIG (frozen settings)
- `loader.js`: MODULES array (123 modules, lines 10-166, single source of truth for JS modules)
- `loader.js`: TEMPLATES array (12 HTML templates, lines 219-232, single source of truth)
- `assets/styles.css`: @import hub (single source of truth for CSS module order)
- `build.py`: Reads loader.js arrays at build time (does NOT have duplicate lists)

**Core Logic:**

- **State:** `core/data.js` (D object schema)
- **Persistence:** `systems/spellslots/persistence.js` (save/saveImmediate), `systems/spellslots/quick-roll.js` (load)
- **Navigation:** `systems/spellslots/navigation.js` (switchView, showModal, hideModal), `systems/tab-registry.js` (TAB_RENDER_REGISTRY)
- **Event Dispatch:** `ui/event-delegation.js` (EventDelegation), `ui/actions/*.js` (handler modules)
- **Migrations:** `systems/spellslots/version-migration.js`

**Testing:**

- Jest: `tests/unit/`, `tests/integration/`, `tests/setup.js`
- E2E: `tests/e2e/`, Playwright config in `playwright.config.js`
- Build tests: `tests/build/test_build_deduplication.py`

## Naming Conventions

**Files:**

- kebab-case: `entity-links.js`, `party-render.js`, `dmscreen-render.js`
- Feature folders: `features/<name>/` with `<name>-render.js`, `<name>-crud.js`, optional `<name>-dialogs.js`, `<name>-details.js`, `<name>-interactions.js`, `<name>-popup.js`, `<name>-core.js`
- Tests: `*.test.js` (Jest), `*.spec.js` (Playwright)
- Declarations: `*.d.ts` (co-located with `.js`)

**Code:**

- Section markers: `// [SECTION:MODULE_NAME]` at file top
- Functions: camelCase, global scope (e.g., renderParty, deleteChar, showCharacterDetails)
- Render functions: `renderX` pattern
- Init functions: `initX` pattern
- Modal functions: `showXModal`, `hideModal`
- Constants: UPPER_SNAKE in `core/constants.js`, accessed via `DND_RULES.*`, `UI_CONSTANTS.*` namespaces
- CSS: feature-prefixed BEM-lite (`.dms-widget`, `.dms-widget-header`, `.dms-widget.active`); DM Screen prefix: `dms-`

## Where to Add New Code

**New Feature (e.g., new tab or domain):**

1. **Primary code:**
   - `features/<name>/<name>-render.js` + `features/<name>/<name>-crud.js` (or single `features/<name>.js` for small features)

2. **MANDATORY registrations (3 places):**
   - `loader.js` MODULES array (correct position: after dependencies, before `ui/` modules)
   - `assets/styles.css` @import hub (if new CSS file)
   - `systems/tab-registry.js` TAB_RENDER_REGISTRY (if has own tab with renders/init/cleanup)

3. **HTML template:**
   - Add to existing `assets/templates/view-*.html` (views) or `assets/templates/modals-*.html` (modals)

4. **Event handlers:**
   - Register `data-action` handlers in `ui/actions/*.js` (matching domain) or `ui/actions/system-actions.js` (misc)

5. **Styling:**
   - New file in `assets/styles/` requires:
     - `@import "styles/<name>.css";` in `assets/styles.css` hub
   - OR add to closest existing file

6. **Exports:**
   - Only export what other modules/HTML need: `window.fn = fn` at file bottom
   - Don't export module-internal helpers

7. **Tests:**
   - Unit: `tests/unit/<name>.test.js`
   - E2E: `tests/e2e/features/<name>.spec.js`

**New Cross-Cutting System:**

- Implementation: `systems/<name>.js` or `systems/<name>/` folder
- Load position: Before `render/helpers.js` in both MODULES array and @import hub

**Utilities:**

- Shared helpers: `utils/` directory
- Mirror pure functions into `utils/testable-utils.js` if they need Jest unit tests

**Build Deduplication Constraints (Read Before Adding Modules):**

- NEVER `const X = window.X` inside a function (becomes global redeclaration after concatenation)
- NEVER reuse a top-level `function` name across modules
- NEVER `var X = window.X` for const/let-declared variables elsewhere (SyntaxError in loader mode)
- Module-level window imports: use `var` only for function-declared or window-only globals (e.g., `var D = window.D`)

## Special Directories

**`dist/`:**

- Purpose: Build outputs
- Generated: Yes (python build.py)
- Committed: No (gitignored, but required locally for Playwright E2E)
- Files: dnd-tracker-bundled.html (dev), dnd-tracker-optimized.html (prod), test-script.html

**`types/` + co-located `.d.ts`:**

- Purpose: TypeScript type information for `tsc --noEmit`
- Generated: No (hand-maintained)
- Committed: Yes
- Note: NOT auto-generated by normal workflow; emitted via tsconfig if desired

**`docs/`:**

- `bugfixes.md`: Bug patterns & lessons (consult before fixing bugs)
- `build-system.md`: Build deduplication implementation details
- `e2e-failure-triage.md`: E2E test troubleshooting guide
- Committed: Yes

**`.planning/codebase/` (This Documentation):**

- ARCHITECTURE.md: System layers, data flow, abstractions, entry points
- STRUCTURE.md: Directory layout, file locations, naming conventions, where to add code
- CONVENTIONS.md: Coding patterns, style rules, best practices
- TESTING.md: Test organization, patterns, how to run tests
- STACK.md: Technology stack, frameworks, dependencies
- INTEGRATIONS.md: External services, APIs, storage systems
- CONCERNS.md: Technical debt, known issues, fragile areas (curated by developers)

---

_Structure analysis: 2026-07-26_
