<!-- refreshed: 2026-07-26 -->
# Architecture

**Analysis Date:** 2026-07-26

## System Overview

```text
┌────────────────────────────────────────────────────────────────┐
│              Browser Load: index.html / loader.js               │
│  Single entry point, loads HTML5 shell and loader script       │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│         MODULE LOADING (loader.js)                              │
│  • Sequential: 123 JS modules (dependency order)               │
│  • Parallel: 12 HTML templates from assets/templates/          │
│  • Source of truth: MODULES array in loader.js               │
│  • Module order: core → utils → systems → features → UI → init │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  CORE INITIALIZATION (core/init.js)                            │
│  • Global error handlers (window.onerror, unhandledRejection)  │
│  • Load campaign/storage (await load())                        │
│  • Theme & layout loading                                      │
│  • Tab registry validation                                     │
│  • Event delegation init, navigation listeners                 │
│  • Subsystem inits: backups, timers, search, keyboards         │
│  • Service Worker, PWA, offline detection                      │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│         APPLICATION RUNTIME                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Global State: window.D                                   │  │
│  │ • Persistent JSON: characters[], npcs[], locations[]    │  │
│  │ • Combat state: initiative {combatants[], round}        │  │
│  │ • Features: spells[], wiki[], loot[], shops[]           │  │
│  │ • Subsystems: bestiary[], soundboard{}, factions[]      │  │
│  │ • UI state: settings {}, dmScreenLayout, calendar[]     │  │
│  │ • Undo stacks: (snapshots, max 30)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │ User Interaction (Event Delegation)                     │  │
│  │ • Click on [data-action="delete-char"]                 │  │
│  │ • Captured at document level (capture phase)           │  │
│  │ • Routed through EventDelegation registry              │  │
│  │ • No inline onclick handlers                           │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │ Action Handlers (ui/actions/*.js)                       │  │
│  │ • 7 domains: entity, combat, ui, dice, wiki, shop,     │  │
│  │   system                                               │  │
│  │ • 433 handlers total                                   │  │
│  │ • Mutate D, call save/saveImmediate                    │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │ Persistence Layer                                       │  │
│  │ • save(): debounced (1500ms default)                   │  │
│  │ • saveImmediate(): synchronous                         │  │
│  │ • localStorage: primary (<5MB)                         │  │
│  │ • IndexedDB: fallback (>5MB or full)                   │  │
│  │ • registerPostSaveHook() callbacks                     │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │ Render Functions (features/*/[*-render.js])             │  │
│  │ • Read from D, generate HTML                           │  │
│  │ • Update DOM via innerHTML                             │  │
│  │ • Called via actions or tab registry                   │  │
│  │ • 25+ render functions across features                 │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────────┐  │
│  │ DOM Display (CSS + Event Delegation Reattach)           │  │
│  │ • Browser renders HTML + CSS                           │  │
│  │ • data-action attributes re-active                     │  │
│  │ • Loop: user action → handler → update → render        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File(s) |
|-----------|----------------|---------|
| **Loader** | Sequential module injection, template fetch | `loader.js` (MODULES array = source of truth) |
| **App Config** | Frozen settings, versions, constants | `core/config.js` (APP_CONFIG object) |
| **Data Schema** | Global state initialization | `core/data.js` (window.D) |
| **Core Constants** | D&D rules, UI timing, icon maps | `core/constants.js` (DND_RULES, UI_CONSTANTS) |
| **Themes** | Dark/light CSS injection | `core/themes.js` |
| **Initialization** | Bootstrap sequence, subsystem setup | `core/init.js` (init() function) |
| **Undo/Redo** | State snapshots, restore logic | `systems/undo.js` (saveUndoState, undo, redo) |
| **Persistence** | Save/load D, storage fallback chain | `systems/spellslots/persistence.js` (save, saveImmediate, post-save-hooks) |
| **Tab Navigation** | Central render registry & lifecycle | `systems/tab-registry.js` (TAB_RENDER_REGISTRY) |
| **Entity Links** | Cross-entity [[type:id:name]] references | `systems/entity-links.js` |
| **Event Delegation** | Central action dispatch (data-action) | `ui/event-delegation.js` (EventDelegation object) |
| **Action Handlers** | Feature-specific mutations & renders | `ui/actions/*.js` (7 domain modules) |
| **Render Helpers** | Error boundaries, entity lookup, caching | `render/helpers.js` |
| **Feature Renders** | Domain HTML generation | `features/*/[*-render.js]` (25+ functions) |
| **Feature CRUDs** | Create/Read/Update/Delete operations | `features/*/[*-crud.js]` (16+ modules) |
| **DM Screen** | Widget-based dashboard, 21+ widget types | `features/dmscreen/dmscreen-render.js` |
| **Rich Editor** | Markdown formatting, floating toolbar | `ui/editors/rich-text.js` |
| **Virtual Scroll** | Efficient rendering of large lists | `ui/virtual-scroll.js` |

## Pattern Overview

**Overall:** Non-ESM global monolith with centralized state, event delegation, and snapshot-based undo.

**Key Characteristics:**

- **Global Namespace Only:** 123 modules in single global scope via `<script>` tags; no ES6 import/export; cross-module calls via `window.fn()` or direct const/let access (both in global lexical scope)
- **Single Source of Truth for Module Lists:** `loader.js:MODULES` array and `loader.js:TEMPLATES` array are the ONLY places module/template lists live. `build.py` READS these at build time (not duplicating), hard-aborts if file missing on disk.
- **Single Mutable Global State:** `window.D` object, mutated in-place, persisted to localStorage (primary) or IndexedDB (fallback >5MB)
- **Event Delegation:** All user interaction routed via `data-action` attributes and `EventDelegation` registry; no inline `onclick` handlers
- **Snapshot Undo:** Full `D` state captured via JSON.stringify before mutations; restore via Object.assign
- **Tab Registry Pattern:** TAB_RENDER_REGISTRY maps tab names to render functions declaratively; on tab switch, registry determines which renders execute
- **German Localization:** UI strings in German; code comments mixed German/English

## Layers

**Core Layer** (`core/`):
- **Purpose:** Application configuration and initialization
- **Location:** `core/config.js`, `core/data.js`, `core/constants.js`, `core/themes.js`, `core/init.js`
- **Contains:** APP_CONFIG (frozen), D (global data), D&D rules constants, theme loader, bootstrap sequence
- **Depends on:** None (loaded first)
- **Used by:** All other modules

**Utilities Layer** (`utils/`):
- **Purpose:** Pure helper functions, utilities, validation
- **Location:** `utils/basic.js`, `utils/utilities.js`, `utils/crud-helpers.js`, `utils/validation.js`, `utils/filter-engine.js`, `utils/game-rules.js`, `utils/performance.js`
- **Contains:** DOM helpers ($, $$, esc), debounce/throttle, parseEntityId, entity lookups, CRUD patterns, validation schemas, XP calculations
- **Depends on:** core/
- **Used by:** systems, features, UI

**Systems Layer** (`systems/`):
- **Purpose:** Cross-cutting infrastructure and subsystems
- **Location:** `systems/undo.js`, `systems/spellslots/*` (9 modules), `systems/entity-links.js`, `systems/tab-registry.js`, `systems/campaign-manager/`, `systems/search/`, `systems/migration/`, `systems/file-backup/`, etc.
- **Contains:** Undo/redo stacks, persistence (save/load/hooks), spell slots management, tab rendering, entity linking, campaign switching, global search, file backup, migrations
- **Depends on:** core/, utils/
- **Used by:** features, UI, init

**Render Helpers** (`render/`):
- **Purpose:** Rendering infrastructure and utilities
- **Location:** `render/helpers.js`
- **Contains:** ErrorHandler (error ring buffer), safeRender (error boundaries), EntityLookup (with optional cache), HTML building helpers
- **Depends on:** core/, utils/
- **Used by:** All feature renders

**Feature Modules** (`features/`):
- **Purpose:** Domain-specific functionality (Party, NPCs, Encounters, etc.)
- **Organization:** One subdirectory per feature with `*-render.js`, `*-crud.js`, optional `*-dialogs.js`
- **Features:** party, npcs, locations, quests, encounters, loot, spells, wiki, shops, sessions, timers, initiative, dice, soundboard, dice-stats, dmscreen, bestiary, npc-generator, timeline, reise, fraktionen, session-prep, command-palette
- **Depends on:** core/, utils/, systems/, render/
- **Used by:** UI actions, event delegation

**UI Layer** (`ui/`):
- **Purpose:** User interaction, event handling, input management
- **Location:** `ui/event-delegation.js`, `ui/actions/*.js`, `ui/editors/rich-text.js`, `ui/virtual-scroll.js`, `ui/dom-builder.js`, `ui/safe-render.js`
- **Contains:** EventDelegation registry, 7 action handler domains (433 total handlers), rich editor, markdown support, virtual scrolling, lazy loading, safe rendering
- **Depends on:** All layers above
- **Used by:** Browser event system at runtime

## Data Flow

### Primary Request Path (User Action)

1. **Event Capture** — User clicks `<button data-action="delete-char" data-id="42">`
2. **Delegation Dispatch** (`ui/event-delegation.js:_handleClick`) — Intercepts in capture phase, extracts action + context
3. **Handler Lookup** — Finds `EventDelegation._handlers.get('delete-char')`
4. **Action Execution** (`ui/actions/entity-actions.js`) — Calls `deleteChar(ctx.id)`
5. **State Mutation** — Calls `saveUndoState()`, mutates D, calls `save()` or `saveImmediate()`
6. **Persistence** (`systems/spellslots/persistence.js`) — Serializes D to JSON, saves to localStorage or IndexedDB, fires post-save hooks
7. **Render Update** — Action handler calls `renderParty()` (or equiv)
8. **DOM Update** — Render function reads D, generates HTML, updates DOM
9. **Display** — Browser displays result, event delegation reattached automatically

### Tab Navigation Path

1. User clicks `.nav-tab[data-view="initiative"]`
2. Calls `switchView('initiative')`
3. `renderTabContent('initiative')` via `TAB_RENDER_REGISTRY`
4. Executes `config.init()` if first visit (once per session)
5. Executes all render functions in `config.renders` array
6. On tab exit, executes `config.cleanup()` if defined
7. Previous tab's `cleanup` clears intervals/listeners

### Undo/Redo Flow

1. **Before mutation:** `saveUndoState('Action label')` pushes full D snapshot to undoStack (max 30)
2. **User Ctrl+Z:** `undo()` pops undoStack, pushes current D to redoStack, restores D, calls renderAll()
3. **User Ctrl+Y:** `redo()` pops redoStack, pushes current D to undoStack, restores D, calls renderAll()

**State Management:**
- D is `const` (reference immutable), contents mutated directly
- Snapshots via JSON.stringify (full deep copy, no diffing)
- No partial updates
- Large campaigns (>2MB) use IndexedDB backup automatically

## Key Abstractions

**Tab Abstraction** (`systems/tab-registry.js`):
- Purpose: Declarative mapping of tab names to render functions
- Pattern: `TAB_RENDER_REGISTRY = { tabName: { renders: [], init, cleanup } }`
- Benefits: No hardcoded renders in switchView(), easy to add tabs

**Entity Lookup** (`render/helpers.js`):
- Purpose: Centralized entity access by type/id with optional per-render caching
- Pattern: `EntityLookup.enableCache()` at start of heavy render, `clearCache()` at end
- Benefits: Reduced redundant array iterations, improved performance

**Widget Abstraction** (DM Screen):
- Purpose: Modular, toggleable dashboard panels
- Pattern: Registry of `{ name, icon, render: () => HTML, compact: bool }`
- 21+ widget types: data widgets (party-stats, initiative, dice) + reference widgets (conditions, damage-types, terrain, etc.)
- Benefits: Users toggle/reorder widgets, profiles save layouts

**Action Handler Abstraction** (`ui/event-delegation.js`):
- Purpose: Dispatch user actions via data-action attributes
- Pattern: `EventDelegation.registerAction('action-name', handlerFn)`
- Benefits: No inline onclick, centralized event handling, action registry self-documenting

**Filter Abstraction** (`utils/filter-engine.js`):
- Purpose: Composable, chainable filtering of lists
- Pattern: Conditions can be AND/OR combined, evaluated efficiently
- Benefits: Consistent filter UI across features, reusable logic

## Entry Points

**HTML Entry** — `dist/dnd-tracker-bundled.html` (dev) or `dist/dnd-tracker-optimized.html` (prod)
- Triggers: Browser navigation or file:// open
- Loads: loader.js via `<script src="loader.js">`

**loader.js** — Module loader and template injector
- Triggers: When DOM ready
- Loads: 123 modules sequentially, 12 templates in parallel
- Calls: `init()` from `core/init.js` when complete
- Source of Truth: MODULES array (lines 10-166) and TEMPLATES array (lines 219-232)

**core/init.js** — Application bootstrap
- Triggers: Called by loader.js after all modules loaded
- Setup: Error handlers, storage loading, theme/layout, event listeners, tab renders, subsystem inits, Service Worker, PWA
- Validations: Tab registry validation (DEBUG mode)
- Inits: Timers, backups, search, keyboard shortcuts, offline detection

## Architectural Constraints

- **Global Namespace:** All functions/variables in window.* or global lexical scope; no module scoping
- **No Circular Dependencies:** Sequential module loading ensures dependencies load before dependents
- **Mutable Global State:** D mutated in-place; patterns recommend saveUndoState() before mutations
- **Synchronous Rendering:** All renders execute immediately, no async/concurrent rendering
- **Single-Threaded:** All operations on main thread; heavy ops (backups, imports) may block
- **Concatenated Bundle:** 123 modules concatenated; no tree-shaking, all code loaded
- **localStorage Limit:** ~5-10MB per browser; >5MB uses IndexedDB fallback
- **Module List Synchronization:** MODULES and TEMPLATES arrays in loader.js are single source of truth; build.py reads them
- **Build Deduplication:** Two-pass system removes duplicate window import-aliases (Pass 1: scan declarations, Pass 2: filter conflicts). No function-scoped `const X = window.X` allowed.

## Anti-Patterns

### Don't Add Inline Event Handlers

**Pattern:** `onclick="deleteChar(id)"` in HTML

**Why Wrong:** Defeats event delegation, mixes markup/logic, hard to track, security whitelist bypasses possible

**Do Instead:** Use data-action + register in ui/actions/*.js

```javascript
// ❌ Don't
<button onclick="deleteChar(${id})">Delete</button>

// ✅ Do
<button data-action="delete-char" data-id="${id}">Delete</button>
// In ui/actions/entity-actions.js:
'delete-char': ctx => deleteChar(ctx.id)
```

### Don't Call render*() from Other render*() Functions

**Pattern:** renderParty() calls renderDashboard() internally

**Why Wrong:** Creates tight coupling, hidden dependencies, race conditions

**Do Instead:** Call render from action handlers after mutation; use post-save hooks for cross-feature updates

```javascript
// ❌ Don't
function renderParty() {
    // ... render party
    renderDashboard();  // Hidden dependency
}

// ✅ Do
function deleteChar(id) {
    saveUndoState('Charakter gelöscht');
    D.characters = D.characters.filter(c => c.id !== id);
    save();
    renderParty();  // Only render affected view
}
```

### Don't Wrap window.save()

**Pattern:** `window.save = function() { window._originalSave(); myHook(); }`

**Why Wrong:** Bare save() calls bind to const declaration, bypass wrapper permanently, post-save hooks never fire

**Do Instead:** Register post-save hooks via registerPostSaveHook(fn)

```javascript
// ❌ Don't
window._originalSave = save;
window.save = function() {
    window._originalSave();
    myHook();  // Never runs for bare save()
};

// ✅ Do
registerPostSaveHook(() => {
    myHook();  // Runs after every save
});
```

### Don't Use var X = window.X for const-Declared Variables

**Pattern:** `var APP_CONFIG = window.APP_CONFIG`

**Why Wrong:** SyntaxError in bundle (const + var redeclaration conflict)

**Do Instead:** Access const-declared globals directly

```javascript
// ❌ Don't
var APP_CONFIG = window.APP_CONFIG;  // SyntaxError if const exists
var save = window.save;

// ✅ Do
const BACKUP_INTERVAL = APP_CONFIG?.BACKUP_INTERVAL || 300000;  // Direct access
if (typeof save === 'function') save();  // Direct access
```

### Don't Use innerHTML with User Content Without Sanitization

**Pattern:** `container.innerHTML = `<p>${npc.description}</p>`

**Why Wrong:** User content can execute JavaScript (XSS)

**Do Instead:** Sanitize with esc() or sanitizeHTML()

```javascript
// ❌ Don't
container.innerHTML = `<p>${npc.description}</p>`;  // XSS risk

// ✅ Do
container.innerHTML = `<p>${esc(npc.description)}</p>`;  // Safe
```

## Error Handling

**Strategy:** Graceful degradation with defensive checks and error logging.

**Patterns:**

- **Error Boundaries:** safeRender() wraps critical renders, catches errors, shows fallback
- **Defensive Checks:** `if (typeof window.fn === 'function')` before calling
- **Logging:** ErrorHandler.log() for errors (ring buffer, debounced toasts); log() for debug (DEBUG_MODE gated)
- **User Feedback:** showToast() for errors/warnings; event log panel for persistent view
- **Graceful Cascade:** localStorage → IndexedDB → export auto-attempt on save failure

## Cross-Cutting Concerns

**Logging:** Wrapped in APP_CONFIG.DEBUG_MODE checks; ErrorHandler for error ring buffer; log() for debug output

**Validation:** validateAndShowErrors() before saves, validateTabRegistry() on boot (DEBUG), data integrity repairs on undo/redo

**Authentication:** None (local single-user app), campaign switching via separate localStorage keys + reload

**Accessibility:** Semantic HTML, ARIA labels, keyboard shortcuts (Ctrl+Z, Ctrl+K, /, etc.), focus management in modals

**Persistence:** Every mutation path ends in save() (debounced) or saveImmediate(); auto-backup every 5 min; session timer auto-save every 5 min

**Multi-Campaign:** Each campaign = separate localStorage key; switching saves campaign index and reloads page

---

*Architecture analysis: 2026-07-26*
