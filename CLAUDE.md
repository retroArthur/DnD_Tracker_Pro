# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 1.5.0 | **Last Updated:** 2026-01-07

## Project Overview

D&D Kampagnen-Tracker Pro - A single-page D&D 5e campaign management application. Pure JavaScript/HTML/CSS, runs entirely offline in browser with LocalStorage + IndexedDB persistence. German-localized. Supports multiple campaigns, network visualization, and comprehensive D&D 5e rules reference.

## Build Commands

```bash
# Development build (preserves readability)
python build.py

# Production build (minified, single HTML file)
python build-optimized.py

# With npm (requires PYTHONIOENCODING=utf-8 on Windows)
npm run build         # Production (optimized)
npm run build:dev     # Development
npm run build:prod    # Production variant

# Webpack builds (alternative)
npm run build:webpack      # Production bundle
npm run build:webpack:dev  # Development bundle
npm run dev                # Webpack dev server

# Serve locally
npm run serve         # Python HTTP server on :8000

# Testing
npm run test          # Jest unit tests
npm run test:unit     # Unit tests only
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:headed  # E2E with visible browser
npm run test:e2e:ui   # E2E with Playwright UI

# Code quality
npm run lint          # ESLint
npm run lint:fix      # Auto-fix lint errors
npm run typecheck     # TypeScript validation
npm run format        # Prettier formatting
npm run check         # All checks (tsc + lint + format)
npm run validate      # Python validation script
```

**Output:** `dist/dnd-tracker-bundled.html` (dev) or `dist/dnd-tracker-optimized.html` (prod)

## Architecture

### Module Loading
Non-ESM architecture using `<script>` tags. `loader.js` defines strict loading order:
1. **core/** - Config, data, constants, init
2. **utils/** - DOM utilities, performance, helpers
3. **systems/** - Undo, backups, tags, entity-links, conditions
4. **render/** - Rendering helpers
5. **features/** - All feature modules (party, npcs, encounters, etc.)
6. **ui/** - Virtual scroll, event delegation, action handlers

### Global State
- **`D`** - Global data object containing:
  - `characters[]` - Party members
  - `npcs[]` - Non-player characters with relations
  - `locations[]` - Places and areas
  - `quests[]` - Quest tracking
  - `encounters[]` - Encounter definitions
  - `initiative{}` - Combat state (combatants, currentTurn, round)
  - `spells[]` - Spell database
  - `loot[]` - Items and treasure
  - `wiki[]` - Custom wiki entries
  - `sessionNotes[]` - Session logs
  - `mindmap{}` - Network visualization (nodes, connections)
  - `calendar{}` - In-game calendar
  - `randomTables[]` - Custom rollable tables
  - `settings{}` - User preferences
- **`APP_CONFIG`** - Frozen configuration object in `core/config.js`
- Persisted to `localStorage[APP_CONFIG.STORAGE_KEY]` + IndexedDB backup

### Key Patterns

**Undo System:**
```javascript
saveUndoState();  // Call BEFORE any destructive operation
// Make changes to D
saveImmediate();
```

**DOM Selection:**
```javascript
$(id)           // Direct ID lookup (no # prefix)
$c(id)          // Cached DOM element lookup
esc(text)       // XSS-safe HTML escaping
```

**CRUD Operations:**
```javascript
function deleteEntity(id) {
    saveUndoState();
    D.entities = D.entities.filter(e => e.id !== id);
    saveImmediate();
    renderAll();
}
```

**Event Delegation:** Actions use `data-action` attributes handled in `ui/actions/` modules.

## Module Organization

| Directory | Purpose |
|-----------|---------|
| `core/` | App config, constants, data schema, initialization |
| `utils/` | DOM helpers, debounce, throttle, caching, performance |
| `systems/` | Cross-cutting: undo, backups, tags, entity-links, conditions, avatars, hp-calculator |
| `systems/spellslots/` | Spell slot tracking subsystem, quick-reference, persistence, import/export |
| `features/party/` | Character management (render, details, CRUD) |
| `features/npcs/` | NPC CRUD, display, interactions, dialogs, popup |
| `features/encounters/` | Encounter management (render, CRUD) |
| `features/locations/` | Location tracking (render, CRUD) |
| `features/quests/` | Quest system (render, CRUD) |
| `features/shops/` | Shops, wiki, sessions, spell-editor, mindmap/network |
| `features/dice/` | Dice roller, maps, timers, search, themes, campaign manager, SRD data |
| `features/dmscreen/` | DM Screen with widget system, profiles, live-sync |
| `ui/` | Virtual scroll, lazy loading, event delegation |
| `ui/actions/` | Action handlers by domain (entity, combat, ui, dice, wiki, shop, map, system) |
| `render/` | Rendering utilities/helpers |
| `assets/` | styles.css, body.html |
| `tests/` | Jest unit tests, Playwright E2E tests |
| `tools/` | Webpack config, analysis scripts |

## Important Files

- `build.py` / `build-optimized.py` - Build scripts (Python)
- `loader.js` - Module loading order definition (60+ modules)
- `core/config.js` - APP_CONFIG with all settings
- `core/constants.js` - Centralized constants (EDITOR_FONTS, READ_ALOUD_STYLES, CONDITIONS, etc.)
- `core/data.js` - Global data schema (D object)
- `systems/undo.js` - Undo/redo implementation with state snapshots
- `systems/entity-links.js` - Cross-entity linking system
- `features/shops/spell-editor.js` - Rich text editor (floating toolbar)
- `features/shops/mindmap.js` - Network/relationship visualization
- `features/encounter-calculator.js` - Encounter balance calculator with terrain/lair modifiers
- `features/dice/dice-core.js` - Dice roller with floating panel
- `features/dice/campaign-manager.js` - Multi-campaign management
- `features/dice/global-search.js` - Fuzzy search across all entities
- `ui/actions/system-actions.js` - System action handlers (modals, editor actions)
- `features/dmscreen/dmscreen-render.js` - DM Screen widget system with 21 widget types and profiles
- `docs/bugfixes.md` - Bug fix patterns and lessons learned
- `sw.js` - Service Worker for offline support

## Recent Features

### DM Screen (Widget-Based Dashboard)
- **Widget System:** Modular, toggleable widgets with masonry CSS layout
- **Live-Sync:** Auto-updates when data changes (debounced 150ms)
- **Profile System:** 4 presets (Standard, Kampf, Minimal, Referenz) + custom profiles
- **21 Widget Types:**
  - **Data Widgets:** Party stats, Initiative tracker, Dice roller, Conditions, DC reference, Random tables, Rules, Notes
  - **Reference Widgets (13 new):**
    - Actions (Aktionen): Combat actions, bonus, reactions, free interactions
    - Attributes (Attribute): 6 ability scores with modifier table
    - Saving Throws (Rettungswürfe): All saves with typical triggers
    - Skills (Fertigkeiten): 18 skills grouped by ability
    - Combat Economy (Kampfökonomie): Turn breakdown
    - Creature Sizes (Größen): Tiny to Gargantuan with grid space
    - Objects (Objekte): AC by material, HP by size
    - Improvised Weapons: 1d4 damage rules
    - Ritual & Concentration: Rules and DC formula
    - Damage Types (Schadensarten): 13 types color-coded
    - Terrain (Gelände): Normal/difficult/hazardous
    - Knowledge Areas (Wissensgebiete): Skills with creature types
    - Travel & Carrying (Reisen & Traglast): Speeds and capacity
- **Data:** `D.dmScreenLayout`, `D.dmScreenProfiles`
- **File:** `features/dmscreen/dmscreen-render.js`

### Encounter Calculator
- **Terrain Modifiers:** Normal (×1.0), Schwieriges Gelände (×1.25), Gefährlich (×1.5), Extrem (×2.0)
- **Lair Actions:** +25% XP modifier, adds reminder at Initiative 20
- **Calculator to Initiative:** Adds monsters individually with auto-rolled initiative and HP variation
- **Battlefield Banner:** Shows active terrain/lair conditions in initiative view

### Floating Dice Panel (D&D Beyond Style)
- Red D20 trigger button (fixed bottom-left, always visible)
- Quick dice buttons: d4, d6, d8, d10, d12, d20
- Advantage/Disadvantage quick rolls
- Custom formula input
- Mini roll history (last 5 rolls)
- Syncs with main dice tab history

### Party Overview (Quick Stats Header)
- Displays above party roster when characters exist
- Shows: Lowest passive perception, AC range, Party HP %, Party size, Active conditions count
- Color-coded HP status (healthy/bloodied/critical)
- File: `features/party/party-render.js` → `renderPartyOverview()`

### Death Saves Tracker
- Appears in initiative for players at 0 HP
- 3 success dots / 3 failure dots (click to toggle)
- Auto-stabilization at 3 successes (sets HP to 1)
- Auto-reset when healed above 0 HP
- Data: `combatant.deathSaves = { successes: 0, failures: 0 }`
- File: `features/initiative.js` → `renderDeathSaves()`, `toggleDeathSave()`

### Concentration Tracker
- Badge shows active concentration spell in initiative
- On damage: Shows DC calculation banner (DC = max(10, damage/2))
- CON save button rolls with character's modifier
- Modal for setting concentration (suggests character's concentration spells)
- Data: `combatant.concentration = { active: bool, spell: string, pendingCheck: damage }`
- File: `features/initiative.js` → `renderConcentration()`, `showConcentrationModal()`

### AoE Damage Calculator
- 💥 AoE button in initiative toolbar
- Dice formula input (e.g., "8d6+5") with roll button
- Multi-target selection with checkboxes
- Save checkbox per target for half damage
- Quick select buttons: All / None / Enemies
- Triggers concentration checks on affected targets
- File: `features/initiative.js` → `showAoEDamageModal()`, `applyAoEDamage()`

### NPC Relations System
- Structured relationships between NPCs and characters
- Status levels: Friendly (green) / Neutral (gray) / Hostile (red)
- Visual status bar in NPC detail panel
- Modal for adding/managing relations
- Cycle status with single click
- Data: `npc.relations = [{ targetId, targetType, status, note }]`
- File: `features/npcs/npc-render.js` → `renderNPCRelations()`, `showRelationsModal()`

### Rest Manager
- Short Rest: Spend Hit Dice to heal, class-specific features
- Long Rest: Full HP, half Hit Dice back, all spell slots
- Party-wide rest modal with character selection
- Hit Die type based on class (d6-d12)
- Warlock: Spell slots on short rest
- File: `features/rest-manager.js` → `showRestModal()`, `applyRest()`

### Quick Actions Bar
- Combat action shortcuts for active combatant in initiative
- Actions: Dodge, Dash, Disengage, Hide, Help, Ready, Search, Use Object
- Auto-applies effects where applicable (Dodging, Hidden, etc.)
- Auto-rolls for Hide (Stealth) and Search (Perception)
- File: `features/quick-actions.js` → `renderQuickActionsBar()`, `applyQuickAction()`

### Random Tables
- Custom rollable tables with weighted entries
- Default tables: Forest Encounters, Tavern Rumors, Weather
- Create/Edit/Delete tables with icon
- Quick roll from Dice view
- Data: `D.randomTables = [{ id, name, icon, entries: [{ weight, text }] }]`
- File: `features/random-tables.js` → `renderRandomTables()`, `rollOnTable()`

### Loot Distribution
- Fair gold splitting across party members
- Shows per-character share and remainder
- Item assignment to characters
- Party inventory overview modal
- Data: `D.partyGold`, `item.assignedTo`
- File: `features/loot-distribution.js` → `showLootDistributionModal()`, `applyGoldSplit()`

### Condition Quick Reference
- Searchable modal with all D&D 5e conditions
- Shows icon, name, and full description
- Accessible from Initiative toolbar
- File: `features/quick-actions.js` → `showConditionReference()`

### Quick Reference Panel v2
- Redesigned collapsible panel with tabs (Zustände, Schaden, Regeln, Eigene)
- Search bar with `/` keyboard shortcut to open and focus
- Interactive conditions: Click to show detail, `+` button to apply to current combatant
- Damage types section with 13 color-coded types
- Clickable dice formulas for fall damage (auto-roll on click)
- Spell components (V/S/M) reference
- Custom entries support with rich text editor
- Data: `D.quickRefCustom = [{ id, title, content, expanded }]`
- File: `systems/spellslots/quick-reference.js` → `QREF_CONDITIONS`, `applyQrefCondition()`, `rollQrefDice()`

### Event Log (replaces Toast)
- Centered notification panel at bottom of screen
- Shows multiple entries with timestamps and type icons
- Color-coded left border: green (success), red (error), yellow (warning), cyan (info)
- Persistent mode: Press `L` to keep log visible with up to 50 entries
- Header with "Leeren" (clear) and close buttons in persistent mode
- File: `utils/utilities.js` → `showToast()`, `toggleEventLog()`, `clearEventLog()`

### Read-Aloud Text Styles (Vorlese-Text)
- Boxed text formatting for DM read-aloud passages
- 6 paper-like color variants:
  - Parchment (default, warm beige)
  - Crimson (subtle red)
  - Violet (soft purple)
  - Sage (subtle green)
  - Sky (soft blue)
  - Slate (neutral gray)
- Dropdown selector in both static and floating editor toolbars
- Toggle behavior: Click again to remove formatting
- CSS: `.read-aloud`, `.read-aloud.crimson`, etc.
- File: `features/shops/spell-editor.js` → `setReadAloudFormat(elementId, style)`
- Constants: `READ_ALOUD_STYLES` in `core/constants.js`

### Synchronized Editor Toolbars
- Static toolbar (in wiki form) and floating toolbar (on text selection) now have same tools
- Both include: Bold, Italic, Underline, Strikethrough, Link, List, Border, Table, Read-Aloud, Fonts, Sizes, Highlight colors
- Fonts available: Arial, Serif, Mono, Roboto, Inter, Poppins, Source Sans Pro
- Google Fonts loaded via `build.py` HTML template
- Constants: `EDITOR_FONTS` in `core/constants.js`

### About/Impressum Modal
- Info button (ℹ️) in header opens modal
- Shows: App name, version, developer credits, GitHub link
- MIT License notice
- File: `assets/body.html` → `#about-modal`
- Action: `show-about-modal` in `ui/actions/system-actions.js`

### Campaign Manager
- Multiple campaigns support with separate LocalStorage keys
- Create, switch, delete campaigns
- Standard campaign (default) + custom campaigns
- Campaign index stored separately (`dnd-campaign-index`)
- Data isolation between campaigns
- File: `features/dice/campaign-manager.js` → `createCampaign()`, `switchCampaign()`, `deleteCampaign()`

### Mindmap/Network Visualization
- Visual relationship mapping for characters, NPCs, locations
- Node types: Player, NPC, Enemy, Location, Faction, Item, Quest, Event, Group, and location variants
- Connection types: Ally (green), Enemy (red), Neutral, Family (pink), Business (gold), Quest (purple), Member (cyan)
- Features: Drag nodes, zoom/pan, connect mode, auto-layout
- Import entities from existing data (characters, NPCs, locations, quests, encounters)
- Filter by search and node type
- Data: `D.mindmap = { nodes: [], connections: [] }`
- File: `features/shops/mindmap.js` → `renderMindmap()`, `saveNodeFromModal()`

### HP Calculator Modal
- Quick HP modification modal for any entity
- Supports: Damage (with temp HP absorption), Heal (capped at max), Temp HP
- Dice formula parsing (e.g., "2d6+3", "1d8")
- Works for both party characters and initiative combatants
- File: `systems/hp-calculator.js` → `showHpCalculator()`, `applyHpChange()`

### Avatar/Image System
- URL-based portraits for characters, NPCs, locations, etc.
- Preview before saving
- Entity helper functions for cross-type lookups
- Offline mode detection and touch optimizations
- File: `systems/avatars.js` → `showAvatarModal()`, `saveAvatar()`

### Global Search (Fuzzy Match)
- Cross-entity search from header
- Fuzzy matching algorithm with scoring
- Results grouped by entity type
- Keyboard shortcut: `Strg+K` or `Strg+F`
- File: `features/dice/global-search.js` → `fuzzyMatch()`, `globalSearch()`

### Session Timer
- Track session duration with start/pause/reset
- Displays in header (desktop) and mobile-friendly version
- Auto-save at configurable intervals
- Keyboard shortcut: `T` to toggle
- File: `features/dice/session-timer.js` → `toggleSessionTimer()`, `resetSessionTimer()`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1-9` | Switch to tab 1-9 |
| `Strg+Z` | Undo |
| `Strg+Y` | Redo |
| `Strg+S` | Save |
| `Strg+K/F` | Focus global search |
| `R` | Quick roll d20 |
| `T` | Toggle session timer |
| `L` | Toggle event log (persistent mode) |
| `/` | Open Quick Reference and focus search |
| `?` | Show keyboard shortcuts |
| `N` | Next turn (Initiative) / New element (context) |
| `P` | Previous turn (Initiative) |
| `Shift+N` | New round (Initiative) |
| `Space` | Next turn (Initiative) |
| `Escape` | Close overlays/modals |

## Conventions

- **Language:** German (UI text, D&D terms, comments)
- **Indentation:** 4 spaces
- **Section markers:** `// [SECTION:MODULE_NAME]`
- **No execCommand:** Use manual DOM manipulation for rich text editing
- **Always call `saveUndoState()`** before delete/edit operations
- **XSS prevention:** Use `esc()` for user content, validate input with whitelists

## Testing

```bash
# Single test file
npx jest tests/unit/specific.test.js

# E2E with UI
npx playwright test --ui

# Specific E2E test
npx playwright test tests/e2e/features/wiki.spec.js
```

## Known Issues & Tips

- **Windows encoding:** Set `PYTHONIOENCODING=utf-8` before running build.py
- **IndexedDB:** Campaign data uses both LocalStorage and IndexedDB for redundancy
- **Large campaigns:** Virtual scroll handles large lists; use pagination for 500+ entries
- **Browser support:** Tested on Chrome/Edge (Chromium), Firefox. Safari may have minor CSS differences
- **Offline mode:** Service Worker caches app shell; data persists in LocalStorage

---

## Architecture Patterns & Lessons Learned

### Widget System Pattern (DM Screen)

**Problem Solved:** Need for a flexible, extensible dashboard where users can toggle, reorder, and customize which information panels they see.

**Why This Approach:**
- **Registry Pattern:** Widgets defined in a central `getDMScreenWidgets()` function returning `{ type: { name, icon, render, compact } }`
- **Separation of Concerns:** Each widget has its own render function returning HTML string
- **Profile-Based Configuration:** Layouts stored as arrays of `{ id, type, visible }` objects
- **Alternative Considered:** Component-based with classes - rejected for simplicity in non-ESM architecture

**Pattern to Follow:**
```javascript
// 1. Define widget in getDMScreenWidgets()
'mywidget': {
    name: 'Widget Name',
    icon: '📊',
    render: renderMyWidget,
    compact: false  // true = header bar, false = grid
}

// 2. Create render function returning HTML
function renderMyWidget() {
    return `<div class="dms-ref-widget">...</div>`;
}

// 3. Add CSS with dms- prefix
.dms-mywidget { ... }

// 4. Add to profile if needed
{ id: 'mywidget-ref', type: 'mywidget', visible: true }
```

**Mistakes to Avoid:**
- Don't add event handlers in render functions - use data-action delegation
- Don't store widget state in variables - use D.dmScreenLayout
- Don't forget compact: false/true - determines header vs grid placement

---

### Tab Navigation Architecture (Tab Registry Pattern)

**Problem Solved:** UI render functions failing silently when DOM elements are missing, causing blank sections when users switch between tabs.

**Root Cause:**
- `switchView()` had no centralized system for tab-specific renders
- Only 3 out of 19 tabs had explicit re-render logic
- When users switched tabs, content was never refreshed → stale UI
- Test mocks referenced `renderInitiative` which didn't exist (actual: `renderInit`)

**Why This Approach:**
- **Centralized Registry Pattern:** `TAB_RENDER_REGISTRY` maps tabs to their render functions
- **Declarative Configuration:** Easy to see which tabs have which renders
- **Automatic Re-rendering:** `renderTabContent()` called on every tab switch
- **Error Visibility:** Debug mode warnings for missing DOM elements and functions
- **Lifecycle Hooks:** Supports one-time `init` and `cleanup` per tab

**Pattern to Follow:**
```javascript
// 1. Register tab in systems/tab-registry.js
const TAB_RENDER_REGISTRY = {
    'mytab': {
        renders: ['renderMyTab', 'renderMyTabStats'],  // Called on every switch
        init: 'initMyTab',      // Called once on first view
        cleanup: 'cleanupMyTab' // Called when leaving tab
    }
};

// 2. Create render function with defensive checks
function renderMyTab() {
    const container = $('mytab-container');
    if (!container) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderMyTab] Container missing - likely not on mytab');
        }
        return;
    }

    // Render content
    container.innerHTML = `<div>...</div>`;
}

// 3. Navigation automatically calls renderTabContent()
// No manual if statements needed in switchView()
```

**Benefits:**
- ✅ All 19 tabs now re-render correctly when switched to
- ✅ Centralized, maintainable architecture
- ✅ Self-documenting (registry shows full tab structure)
- ✅ Error handling catches and logs render failures
- ✅ Test mocks aligned with production code

**Mistakes to Avoid:**
- ❌ Don't add renders directly to `switchView()` - use the registry
- ❌ Don't use silent `if (!container) return` - add debug warnings
- ❌ Don't put render logic in `init` hook - use `renders` array
- ❌ Don't forget to register new tabs in the registry

**Common Pitfalls:**
```javascript
// BAD - defeats the purpose of registry
function switchView(name) {
    renderTabContent(name);
    if (name === 'mytab') renderMyTab();  // ❌ Don't do this
}

// GOOD - registry handles it
const TAB_RENDER_REGISTRY = {
    'mytab': { renders: ['renderMyTab'], init: null, cleanup: null }
};
```

**Testing Tab Navigation:**
When adding render functions, always test:
1. Initial render (on app startup)
2. Re-render on tab switch
3. Re-render after data change (import/undo/restore)
4. Multiple rapid tab switches

See `tests/e2e/tab-navigation.spec.js` for examples.

**Documentation:**
- **Full Guide:** `systems/tab-registry.md`
- **Implementation:** `systems/tab-registry.js`
- **Integration:** `systems/spellslots/navigation.js`

---

### Live-Sync Pattern

**Problem Solved:** Widgets showing stale data when user makes changes in other tabs.

**Why This Approach:**
- **Hook into save():** Override global save function to trigger refresh
- **Debouncing:** 150ms delay prevents excessive re-renders during rapid changes
- **Partial Update:** `renderDMScreenWidgetsOnly()` updates content without rebuilding layout

**Pattern to Follow:**
```javascript
// Hook into existing function without breaking it
if (typeof window._originalSave === 'undefined') {
    window._originalSave = save;
    window.save = function() {
        window._originalSave.apply(this, arguments);
        refreshIfVisible();
    };
}

// Debounced refresh
let timer = null;
function refreshIfVisible() {
    if (!isVisible()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        doPartialRefresh();
        timer = null;
    }, 150);
}
```

**Mistakes to Avoid:**
- Don't do full re-render on every save - too slow
- Don't forget visibility check - wastes cycles on hidden views
- Don't use intervals - debounced events are more efficient

---

### Reference Data Pattern

**Problem Solved:** D&D 5E rules reference data scattered across code, hard to maintain.

**Why This Approach:**
- **Inline Data:** Rules embedded in render functions for simplicity
- **Semantic HTML:** Use CSS classes for styling, not inline styles
- **Color Coding:** Consistent attribute colors across all widgets (STR=red, DEX=green, etc.)

**Pattern to Follow:**
```javascript
// Use semantic class names
<div class="dms-attr-item str">  // Not style="color: red"
<div class="dms-dmg-item fire">  // Consistent damage type styling

// Group related CSS
.dms-attr-item.str .dms-attr-abbr { color: #ef4444; }
.dms-attr-item.dex .dms-attr-abbr { color: #22c55e; }
```

**Mistakes to Avoid:**
- Don't hardcode colors in HTML - use CSS classes
- Don't mix German/English in same widget - stay consistent
- Don't add interactive features to reference widgets - keep them static

---

### CSS Organization for New Features

**Problem Solved:** CSS file growing large (21k+ lines), need consistent organization.

**Pattern to Follow:**
```css
/* ========================================
   FEATURE NAME - WIDGET TYPE
   ======================================== */

/* Base container */
.dms-feature-widget { }

/* Sub-components */
.dms-feature-item { }
.dms-feature-title { }

/* Variants/modifiers */
.dms-feature-item.active { }
.dms-feature-item.disabled { }
```

**Naming Convention:**
- Prefix with feature abbreviation: `dms-` for DM Screen
- Use BEM-lite: `.dms-widget`, `.dms-widget-header`, `.dms-widget-body`
- Modifiers as additional classes: `.dms-item.str`, `.dms-item.active`

---

### Gotchas & Common Pitfalls

1. **Build Order Matters:** New modules must be added to `build.py` modules list in correct order
2. **Global Namespace:** All functions are global - use unique prefixes to avoid collisions
3. **No ES Modules:** Can't use import/export - everything must be in global scope
4. **CSS Variables:** Always use `var(--gold)`, `var(--text-dim)` etc. for theming
5. **German Localization:** UI strings in German, code comments can be English
6. **XSS in Widgets:** Even static widgets should use `esc()` if showing any user data
7. **Mobile First:** Test widgets at 320px width - masonry layout adjusts columns

---

### Comprehensive Refactoring (Jan 2026) - Lessons Learned

**Background:** In January 2026, the codebase underwent a systematic 5-phase refactoring addressing code quality, performance, architecture, and robustness. This section documents what was learned and patterns to follow.

#### Phase 1: Quick Wins - Code Quality & Performance

**Problem 1: Production Console Pollution**
- **What was wrong:** 35+ files with `console.log()`, `console.error()`, `console.warn()` in production code
- **Why it mattered:** Debug output exposed internal state, cluttered user console, impacted performance
- **Solution:** Replaced all with `ErrorHandler.log()` wrapped in `APP_CONFIG.DEBUG_MODE` checks
- **Pattern to follow:**
```javascript
// NEVER do this:
console.log('Debug info:', data);
console.error('Error:', err);

// ALWAYS do this:
if (APP_CONFIG.DEBUG_MODE) {
    ErrorHandler.log('contextName', err, 'Additional context');
}
```

**Problem 2: Magic Numbers Everywhere**
- **What was wrong:** Hardcoded values (25, 50 for HP thresholds, 150ms delays) scattered throughout code
- **Why it mattered:** D&D rules changes or UI timing adjustments required hunting through multiple files
- **Solution:** Created `COMBAT_CONSTANTS` and `UI_TIMING` in `core/constants.js`
- **Pattern to follow:**
```javascript
// NEVER: Hardcoded values
const hpClass = hpPct <= 25 ? 'critical' : hpPct <= 50 ? 'bloodied' : 'healthy';
setTimeout(updateUI, 150);

// ALWAYS: Named constants
const hpClass = hpPct <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD ? 'critical'
              : hpPct <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD ? 'bloodied'
              : 'healthy';
setTimeout(updateUI, UI_TIMING.DM_SCREEN_SYNC_DELAY);
```

**Problem 3: Expensive Repeated String Operations**
- **What was wrong:** `spell.spellClass.split(',').map()` called repeatedly during every filter operation
- **Why it mattered:** With 500 spells, this meant 2,500+ operations per filter
- **Solution:** Pre-compute `spellClasses` array once at load time
- **Pattern to follow:**
```javascript
// During data load (once):
D.spells.forEach(spell => {
    if (spell.spellClass && !spell.spellClasses) {
        spell.spellClasses = spell.spellClass.split(',').map(c => c.trim());
    }
});

// During filtering (many times):
const classes = spell.spellClasses || []; // Fast array access, not string split
```
- **Result:** 50%+ faster spell filtering

---

#### Phase 2: Code Quality - Breaking Up Mega-Functions

**Problem: 250-Line renderInit() Function**
- **What was wrong:** renderInit() mixed data lookup, business logic, HTML generation in 250+ lines
- **Why it mattered:** Impossible to test, hard to understand, high cognitive load
- **Solution:** Extracted 4 helper functions:
  1. `getInitCombatantDetails()` - Entity lookup
  2. `getCombatantHpStatus()` - HP calculations
  3. `renderCombatantEffects()` - Effects badge rendering
  4. `renderCombatantSpellSlots()` - Spell slot display
- **Pattern to follow:**
```javascript
// BAD: Everything in one function
function renderInit() {
    // 250 lines of mixed concerns
}

// GOOD: Extracted helpers
function renderInit() {
    EntityLookup.enableCache();

    const html = init.combatants.map(cb => {
        const { hpPercent, hpClass } = getCombatantHpStatus(cb);
        const { ac, entityType, entityId } = getInitCombatantDetails(cb);
        const effects = renderCombatantEffects(cb);
        // ... simple template
    }).join('');

    EntityLookup.clearCache();
}
```
- **Rule:** If a function is >100 lines, look for extraction opportunities

**Problem: Duplicate Entity Lookup Code**
- **What was wrong:** Same AC/entity lookup pattern copied to 12+ files (~40 lines each)
- **Why it mattered:** Bug fixes required changes in 12 places, inconsistent behavior
- **Solution:** Created `getEntityForCombat()` utility function
- **Pattern to follow:**
```javascript
// Don't duplicate this pattern everywhere:
if (type === 'player') {
    const char = EntityLookup.findByName('characters', name);
    if (char) { ac = char.ac || char.armorClass || 10; /* ... */ }
} else if (type === 'enemy') { /* ... */ }

// Call centralized utility instead:
const { ac, type, id } = getEntityForCombat(entityType, entityName);
```
- **Result:** 200+ lines removed, single source of truth

**Problem: Multiple Filter Passes**
- **What was wrong:** 5 separate `.filter()` calls on same array (2,500+ operations for 500 spells)
- **Why it mattered:** Slow filtering, poor UX with large datasets
- **Solution:** Combined all filters into single pass
- **Pattern to follow:**
```javascript
// BAD: Multiple passes
let filtered = spells;
if (classFilter) filtered = filtered.filter(s => ...);
if (levelFilter) filtered = filtered.filter(s => ...);
if (schoolFilter) filtered = filtered.filter(s => ...);
if (search) filtered = filtered.filter(s => ...);

// GOOD: Single pass
const filtered = spells.filter(s => {
    if (classFilter && !s.spellClasses?.includes(classFilter)) return false;
    if (levelFilter && s.level !== parseInt(levelFilter)) return false;
    if (schoolFilter && s.school !== schoolFilter) return false;
    if (search && !matchesSearch(s, search)) return false;
    return true;
});
```
- **Result:** 50-70% faster filtering

---

#### Phase 3: Architecture - Reducing Duplication

**Problem: Duplicated CRUD Patterns**
- **What was wrong:** Every delete function had 10-15 lines of boilerplate (confirm, find entity, undo, filter, save, render)
- **Why it mattered:** Inconsistent UX, bugs in some but not others, code duplication
- **Solution:** Created `utils/crud-helpers.js` with generic utilities
- **Pattern to follow:**
```javascript
// BEFORE: Every delete function looks like this (10-15 lines)
function deleteChar(id) {
    const numId = parseEntityId(id);
    if (numId === null) return;
    const char = EntityLookup.character(id);
    if (!char) { showToast('Charakter nicht gefunden', 'error'); return; }
    if (!confirm(`"${char.name}" löschen?`)) return;
    saveUndoState('Charakter gelöscht');
    D.characters = D.characters.filter(c => c.id !== numId);
    renderParty();
    save();
}

// AFTER: One-liner with helper (4 lines)
function deleteChar(id) {
    deleteWithConfirm({
        entityType: 'characters',
        id: id,
        onSuccess: () => afterCrudOperation(renderParty, 'Charakter gelöscht')
    });
}
```
- **Helpers created:**
  - `deleteWithConfirm()` - Generic delete with confirmation + undo
  - `afterCrudOperation()` - Standard render + save + toast flow
  - `saveEntityWithUndo()` - Generic entity save with undo support
- **Result:** 150+ lines removed, consistent UX across all CRUD operations

**Problem: No Error Boundaries on Render Functions**
- **What was wrong:** Render functions had no try-catch, errors caused white screens
- **Why it mattered:** User sees blank page instead of helpful error message
- **Solution:** Enhanced `safeRender()` with fallback options
- **Pattern to follow:**
```javascript
// Wrap critical renders:
function renderInit() {
    return safeRender(() => {
        const c = $('init-list');
        if (!c) throw new Error('init-list container not found');
        // ... rest of render
    }, 'renderInit', 'init-list', {
        showToastOnError: true,
        toastMessage: 'Initiative konnte nicht aktualisiert werden'
    });
}
```
- **Benefits:** Graceful degradation, user-facing error messages, errors logged for debugging

---

#### Phase 4: Performance - Caching & Optimization

**Problem: Redundant EntityLookup Calls**
- **What was wrong:** renderInit() with 10 combatants = 30-40 array iterations through D.characters, D.encounters, D.npcs
- **Why it mattered:** Rendering was slow (150ms) with large combat groups
- **Solution:** Enable EntityLookup cache during render cycle
- **Pattern to follow:**
```javascript
function renderInit() {
    // Enable cache for this render cycle
    EntityLookup.enableCache();

    // All lookups now use cache
    const html = combatants.map(cb => {
        const char = EntityLookup.findByName('characters', cb.name); // Cached!
        // ...
    }).join('');

    // Clear cache to prevent stale data
    EntityLookup.clearCache();
}
```
- **Result:** 50-70% faster rendering (150ms → <50ms with 10 combatants)

**Problem: Slow Deep Cloning in Backups**
- **What was wrong:** `JSON.parse(JSON.stringify(obj))` used for deep cloning (slow, loses Date objects)
- **Why it mattered:** Backup operations were sluggish, type information lost
- **Solution:** Use native `structuredClone()` with polyfill
- **Pattern to follow:**
```javascript
// Add polyfill in utils/utilities.js:
if (typeof structuredClone === 'undefined') {
    window.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Use structuredClone everywhere:
const cloned = structuredClone(originalObject);
```
- **Result:** 30-50% faster deep cloning, preserves Date objects and other types

---

#### Phase 5: Final Polish - UX & Data Integrity

**Problem: AoE Selection Lag**
- **What was wrong:** updateAoETargetDisplay() called immediately on every checkbox change
- **Why it mattered:** Selecting 8+ targets felt sluggish
- **Solution:** Debounce updates with 50ms delay
- **Pattern to follow:**
```javascript
// Create debounced version once:
const debouncedUpdate = debounce(updateAoETargetDisplay, UI_TIMING.AOE_UPDATE_DEBOUNCE);

// Use in event handlers:
function aoeSelectAll() {
    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => cb.checked = true);
    debouncedUpdate(); // Smooth!
}
```
- **Result:** Smooth performance with rapid selection changes

**Problem: Invalid Foreign Key References**
- **What was wrong:** No validation before saving - quest could reference deleted NPC as giver
- **Why it mattered:** Data integrity issues, broken links, confusing UX
- **Solution:** Created validation system with schemas
- **Pattern to follow:**
```javascript
// 1. Define schema in utils/validation.js:
const VALIDATION_SCHEMAS = {
    quest: {
        title: { type: 'string', required: true, maxLength: 200 },
        giverId: { type: 'entityRef', entityType: 'npcs', required: false },
        locationId: { type: 'entityRef', entityType: 'locations', required: false }
    }
};

// 2. Validate before saving:
function saveQuest() {
    const quest = { /* ... */ };
    if (!validateAndShowErrors(quest, 'quest')) return; // Blocks invalid saves
    // ... proceed with save
}
```
- **Result:** No invalid references can be saved, clear error messages to user

---

#### Critical Patterns from Bug History

**From docs/bugfixes.md analysis:**

**1. ALWAYS Call saveUndoState() Before Destructive Operations**
```javascript
// This pattern appeared in 15+ bugs:
function deleteEntity(id) {
    saveUndoState(); // ← MUST be first!
    D.entities = D.entities.filter(e => e.id !== id);
    save();
}
```
- **Why:** User expects Ctrl+Z to work, no undo = bad UX
- **Checklist:** Any function with delete/edit/modify in name needs `saveUndoState()` or `pushUndo()`

**2. NEVER Use innerHTML with User Content Without Sanitization**
```javascript
// 12+ XSS vulnerabilities found:
container.innerHTML = `<div>${user.description}</div>`; // ❌ DANGEROUS

// Always sanitize:
container.innerHTML = `<div>${sanitizeHTML(user.description)}</div>`; // ✅ SAFE
```
- **Even "safe" fields:** Icons, titles, short text - always use `esc()` or `sanitizeHTML()`
- **Rule:** If it came from user input (D.characters, D.npcs, D.quests, etc.), sanitize it

**3. NEVER Trust Client-Side Validation Alone**
```javascript
// HTML has maxlength="2":
<input id="icon" maxlength="2">

// But JS must also validate (can be bypassed via DevTools/LocalStorage):
function saveTable() {
    const icon = $('icon').value;
    const validatedIcon = [...icon].slice(0, 2).join(''); // ✅ Server-side validation
}
```

**4. ID Comparison: Always Use parseEntityId()**
```javascript
// Bug appeared 8+ times:
const found = D.entities.find(e => e.id === id); // ❌ String vs Number mismatch

// Always parse:
const found = D.entities.find(e => e.id === parseEntityId(id)); // ✅ Correct
```

**5. setInterval/setTimeout: Always Clean Up**
```javascript
// Memory leak pattern (found 3 times):
let intervalId;
function startTimer() {
    intervalId = setInterval(tick, 1000); // ❌ Creates multiple intervals
}

// Always clear first:
function startTimer() {
    if (intervalId) clearInterval(intervalId); // ✅ Cleanup
    intervalId = setInterval(tick, 1000);
}
```

**6. querySelectorAll in Loops: Use Array.from()**
```javascript
// Bug: querySelectorAll returns static NodeList
const entries = document.querySelectorAll('.entry');
while (entries.length > 10) {
    entries[0].remove(); // ❌ Length never changes!
}

// Use Array for mutation:
const entries = Array.from(document.querySelectorAll('.entry'));
while (entries.length > 10) {
    entries.pop().remove(); // ✅ Mutates array
}
```

**7. User Input in Loops: Always Set Limits**
```javascript
// DoS vulnerability (found in random-tables):
function parseRange(input) {
    const [start, end] = input.split('-').map(Number);
    for (let i = start; i <= end; i++) { // ❌ User can input "1-1000000"
        // ...
    }
}

// Always limit:
const MAX_RANGE_SIZE = 100;
if (end - start > MAX_RANGE_SIZE) {
    showToast('Range zu groß (max 100)', 'error');
    return [];
}
```

---

#### Refactoring Metrics & Results

**Code Size:**
- Lines added: ~550
- Lines removed: ~900
- Net reduction: ~350 lines
- New utility modules: 3 (crud-helpers.js, validation.js, polyfills)

**Performance Improvements:**
- Initiative render: 150ms → <50ms (66% faster) with 10 combatants
- Spell filtering: 250ms → <100ms (60% faster) with 500 spells
- Backup operations: 30-50% faster with structuredClone
- AoE updates: Smooth with debouncing (no more lag)

**Code Quality:**
- Zero console.log in production builds ✅
- All magic numbers extracted to constants ✅
- No functions >100 lines ✅
- Code duplication: ~15% → <5% ✅
- CRUD consistency: 5 delete functions now use same helper ✅
- Error boundaries on critical renders ✅

**Testing:**
- 199/199 unit tests passing after each phase ✅
- No breaking changes ✅
- Full backward compatibility ✅

---

#### Future Development Guidelines

**When Adding New Features:**

1. **Before Writing Code:**
   - Check if similar functionality exists (avoid duplication)
   - Identify which module(s) to modify (follow directory structure)
   - Check `build.py` for module load order requirements

2. **While Writing Code:**
   - Use `ErrorHandler.log()` wrapped in `DEBUG_MODE`, never `console.log()`
   - Extract constants to `core/constants.js`, never hardcode
   - Use CRUD helpers (`deleteWithConfirm`, `afterCrudOperation`) for consistency
   - Add `saveUndoState()` before any destructive operation
   - Always sanitize user content with `sanitizeHTML()` or `esc()`
   - Validate foreign key references before persisting
   - Use `parseEntityId()` for all ID comparisons
   - Enable/clear EntityLookup cache in render functions

3. **After Writing Code:**
   - Write unit tests (Jest) for new functions
   - Write E2E tests (Playwright) for new user flows
   - Run full test suite: `npm run test && npm run test:e2e`
   - Check build: `npm run build`
   - Test with large datasets (500+ spells, 20+ combatants)
   - Test undo/redo for all data modifications

4. **Before Committing:**
   - Review for XSS vulnerabilities (any innerHTML with user data?)
   - Review for memory leaks (any setInterval/setTimeout without cleanup?)
   - Review for DoS risks (any user input in loops without limits?)
   - Check for magic numbers (extract to constants)
   - Check for duplicate code (extract to utilities)
   - Update CLAUDE.md if new patterns emerged

**When Fixing Bugs:**

1. **Reproduce First:** Write a failing test before fixing
2. **Root Cause:** Don't just fix symptoms, understand why it happened
3. **Document:** Add entry to `docs/bugfixes.md` with pattern to avoid
4. **Test:** Verify fix works, tests pass, no regressions

**When Refactoring:**

1. **Start Small:** One module/function at a time
2. **Test After Each Change:** Keep tests green throughout
3. **No Behavior Changes:** Refactoring should not change functionality
4. **Commit Atomically:** Each refactor step is its own commit
5. **Document Decisions:** Update CLAUDE.md with new patterns

---

### Debugging Checklist

#### UI Not Updating?

When a tab or view isn't showing updated content:

1. **✓ Is the render function registered in `TAB_RENDER_REGISTRY`?**
   - Check `systems/tab-registry.js`
   - Ensure tab name matches `data-view` attribute in HTML

2. **✓ Is the render function being called?**
   - Enable `APP_CONFIG.DEBUG_MODE = true` in console
   - Check console for `[TabRegistry] Rendered X() for tab Y` messages
   - Add `console.log()` in render function to verify execution

3. **✓ Does the DOM container exist?**
   - Check with `$('container-id')` in console
   - Verify ID in `assets/body.html` matches JS
   - Look for `[DOM] Element not found:` warnings in DEBUG mode

4. **✓ Is the tab active when render is called?**
   - Check if view has `class="view active"`
   - Verify tab button has `class="nav-tab active"`

5. **✓ Are there silent failures?**
   - Enable DEBUG_MODE to see warnings
   - Check browser console for errors
   - Look for early `return` statements in render functions

6. **✓ Is data being saved/loaded correctly?**
   - Check `D.yourData` in console
   - Verify `save()` is called after data changes
   - Check localStorage in DevTools

#### Missing DOM Elements?

When you see blank sections or missing content:

1. **Check the tab registry:** Is the tab registered with correct render functions?
2. **Check HTML structure:** Does `assets/body.html` have the container element?
3. **Check module loading:** Is the render function's module loaded in `build.py`?
4. **Check function names:** Do they match between registry and actual function definitions?
5. **Check DEBUG mode:** Enable it and look for warnings about missing elements

#### Console Errors?

Common error patterns and fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| `X is not a function` | Function not loaded yet | Check module load order in `build.py` |
| `Cannot read property of undefined` | Data not initialized | Add fallback: `D.data || []` |
| `Element not found: #X` | Container doesn't exist | Check HTML or add null check |
| `[TabRegistry] Function X not found` | Function name typo | Fix name in registry or add function |

---

### Roadmap Coordinate System Architecture

**Critical Architecture Constraint:**

The Roadmap feature uses a **dual coordinate system** that must remain synchronized:

```
roadmap-viewport (transformed container)
├── roadmap-svg (SVG with viewBox coordinate system)
└── roadmap-events (div overlay with pixel-based positioning)
```

**Coordinate Systems:**

1. **SVG Coordinate System (viewBox-based):**
   - Uses `viewBox="x y width height"` attribute
   - Connections rendered as SVG paths using event.x, event.y coordinates
   - ViewBox can define custom coordinate space (e.g., starting at negative values)

2. **Overlay Coordinate System (pixel-based):**
   - Event tiles positioned with `style.left/top` in pixels
   - Always relative to container's (0,0) origin
   - Cannot have negative pixel positions

**Synchronization Requirement:**

⚠️ **CRITICAL:** ViewBox origin MUST always be `(0,0)` to match overlay container origin.

```javascript
// CORRECT: ViewBox origin at (0,0)
svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

// WRONG: Custom origin breaks overlay synchronization
svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
```

**Why This Matters:**

- If viewBox origin is set to `(minX, minY)` where minX/minY are negative
- SVG content shifts to account for the origin offset
- BUT overlay tiles still render at pixel (0,0) → misalignment!

**Pattern to Follow:**

When expanding SVG viewport, **normalize coordinates** instead of shifting viewBox origin:

```javascript
// 1. Find coordinate bounds
let minX = Math.min(...events.map(e => e.x));
let minY = Math.min(...events.map(e => e.y));

// 2. Calculate offset to make all coordinates positive
const offsetX = padding - minX;
const offsetY = padding - minY;

// 3. Shift all event coordinates
if (offsetX !== 0 || offsetY !== 0) {
    events.forEach(e => {
        e.x += offsetX;
        e.y += offsetY;
    });
    save(); // Persist normalized coordinates
}

// 4. Set viewBox with origin at (0,0)
svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
```

**Bug Pattern to Avoid:**

❌ Changing SVG viewBox origin without updating overlay positions
❌ Assuming SVG and CSS positioning are interchangeable
❌ Using negative coordinates without normalization

**Files to Check When Modifying:**

- `features/roadmap/roadmap-render.js:32-81` - `updateSVGViewBox()` function
- `features/roadmap/roadmap-render.js:248-249` - Tile positioning
- `assets/styles.css:22263-22281` - SVG and overlay layer CSS

**Future Consideration:**

For a more robust solution, consider refactoring to use SVG `<foreignObject>` elements for tiles, which would eliminate the dual coordinate system entirely.
