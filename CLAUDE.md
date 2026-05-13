# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 2.6.0 | **Last Updated:** 2026-03-18

## Project Overview

D&D Kampagnen-Tracker Pro - A single-page D&D 5e campaign management application. Pure JavaScript/HTML/CSS, runs entirely offline in browser with LocalStorage + IndexedDB persistence. German-localized. Supports multiple campaigns, network visualization, and comprehensive D&D 5e rules reference.

## Feedback Loop
Bevor du Code änderst oder Anpasst, gib beschreibung aus wie du den neuen Code testen würdest.
Nach dem inplemtieren des Codes, führe dann einen Test aus.

## Build Commands

```bash
# Development build (preserves readability)
python build.py

# Development build with minification
python build.py --minify

# Production build (minified, debug off, HTML minified)
python build.py --production

# With npm (requires PYTHONIOENCODING=utf-8 on Windows)
npm run build         # Production (optimized)
npm run build:dev     # Development
npm run build:prod    # Production variant

# Dev server
npm run dev               # Python HTTP server on :8000

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
| `features/shops/` | Shops, wiki, sessions, spell-editor, mindmap/network, shop-export |
| `features/dice/` | Dice roller, dice favorites, maps, search, themes, campaign manager |
| `features/timers/` | Combat and session timers |
| `features/dmscreen/` | DM Screen with widget system, profiles, live-sync |
| `ui/` | Virtual scroll, lazy loading, event delegation |
| `ui/actions/` | Action handlers by domain (entity, combat, ui, dice, wiki, shop, map, system) |
| `render/` | Rendering utilities/helpers |
| `assets/` | styles.css (@import hub), body.html (Hinweis-Datei) |
| `assets/styles/` | 14 modulare CSS-Dateien (variables, core, editors, npcs, encounters, etc.) |
| `assets/templates/` | 10 modulare HTML-Templates (header, views, modals) |
| `tests/` | Jest unit tests, Playwright E2E tests |
| `tools/` | Analysis scripts (render split, event handler migration, globals check) |

## Important Files

- `build.py` - Build script (Python, --production fuer Prod-Build)
- `loader.js` - Module loading order definition (60+ modules)
- `core/config.js` - APP_CONFIG with all settings
- `core/constants.js` - Centralized constants (EDITOR_FONTS, READ_ALOUD_STYLES, CONDITIONS, etc.)
- `core/data.js` - Global data schema (D object)
- `systems/undo.js` - Undo/redo implementation with state snapshots
- `systems/entity-links.js` - Cross-entity linking system
- `ui/editors/rich-text.js` - Rich text editor (floating toolbar)
- `features/network/mindmap.js` - Network/relationship visualization
- `features/encounter-calculator.js` - Encounter balance calculator with terrain/lair modifiers
- `features/dice/dice-core.js` - Dice roller with floating panel
- `systems/campaign-manager/campaign-manager.js` - Multi-campaign management
- `systems/search/global-search.js` - Fuzzy search across all entities
- `ui/actions/system-actions.js` - System action handlers (modals, editor actions)
- `features/dmscreen/dmscreen-render.js` - DM Screen widget system with 21 widget types and profiles
- `features/shops/shop-export.js` - Shop handout HTML export with print CSS
- `features/sessions/sessions.js` - Session management
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
- File: `ui/editors/rich-text.js` → `setReadAloudFormat(elementId, style)`
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
- File: `assets/templates/modals-tools.html` → `#about-modal`
- Action: `show-about-modal` in `ui/actions/system-actions.js`

### Campaign Manager
- Multiple campaigns support with separate LocalStorage keys
- Create, switch, delete campaigns
- Standard campaign (default) + custom campaigns
- Campaign index stored separately (`dnd-campaign-index`)
- Data isolation between campaigns
- File: `systems/campaign-manager/campaign-manager.js` → `createCampaign()`, `switchCampaign()`, `deleteCampaign()`

### Mindmap/Network Visualization
- Visual relationship mapping for characters, NPCs, locations
- Node types: Player, NPC, Enemy, Location, Faction, Item, Quest, Event, Group, and location variants
- Connection types: Ally (green), Enemy (red), Neutral, Family (pink), Business (gold), Quest (purple), Member (cyan)
- Features: Drag nodes, zoom/pan, connect mode, auto-layout
- Import entities from existing data (characters, NPCs, locations, quests, encounters)
- Filter by search and node type
- Data: `D.mindmap = { nodes: [], connections: [] }`
- File: `features/network/mindmap.js` → `renderMindmap()`, `saveNodeFromModal()`

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
- File: `systems/search/global-search.js` → `fuzzyMatch()`, `globalSearch()`

### Session Timer
- Track session duration with start/pause/reset
- Displays in header (desktop) and mobile-friendly version
- Auto-save at configurable intervals
- Keyboard shortcut: `T` to toggle
- File: `systems/session-timer.js` → `toggleSessionTimer()`, `resetSessionTimer()`

### Markdown Support (v2.6.0)
- Live shortcuts in all text editors (bold, italic, headers, lists)
- Markdown import/export for all entity types
- Render-on-display: Markdown rendered when viewing, raw editing when editing
- Consistent across all entity types (NPCs, locations, quests, wiki, etc.)
- File: Various entity render files, `utils/utilities.js`

### Shop Handout Export (v2.6.0)
- HTML download with print-optimized CSS for shop inventories
- Generates standalone HTML file for offline/printed use
- File: `features/shops/shop-export.js` → `exportShopHandout()`

### Unified Editor Toolbars (v2.6.0)
- All 17+ editor toolbars consolidated to a 3-tier system
- Tier 1: Basic (bold, italic, underline)
- Tier 2: Extended (lists, links, tables)
- Tier 3: Advanced (fonts, read-aloud, highlights)
- Consistent toolbar across all entity editors

### Wiki Categories Collapsed (v2.6.0)
- Wiki categories default to collapsed state for better overview
- Click to expand individual categories

### Shop Filters & Sorting (v2.6.0)
- Extended filter options for shop items
- Sorting by name, price, category
- Import/Export functionality for all shop tabs

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

## Open Roadmap Items

| Priority | Task | Notes |
|----------|------|-------|
| ~~Done~~ | ~~**CSS aufteilen**~~ | Already split into 14 modular files in `assets/styles/` (see CSS Organization) |
| Partial | **Inline Event-Handler migrieren** | Quick wins done (17 modal handlers migrated, March 2026). ~146 remain in templates/generated HTML |
| ~~Done~~ | ~~**Build-System konsolidieren**~~ | Webpack removed (March 2026), Python `build.py` is sole build system |
| ~~Done~~ | ~~**CI/CD Pipeline**~~ | GitHub Actions workflow in `.github/workflows/ci.yml` (lint, typecheck, test, build) |
| ~~Done~~ | ~~**.d.ts cleanup**~~ | 18 orphaned `.d.ts` removed (March 2026), 64 valid ones remain for `tsc --noEmit` type-checking |

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

**Problem Solved:** CSS file was 23k+ lines in a single file. Now split into 14 modular files under `assets/styles/`, loaded via `@import` in dev mode and concatenated by `build.py` for production.

**Current Structure:**
```
assets/styles.css          ← @import hub (18 lines)
assets/styles/
├── variables.css (260)    ← CSS custom properties
├── core.css (2500)        ← Base layout, global utilities
├── editors.css (451)      ← Rich text editor toolbars
├── npcs.css (2046)        ← NPC management
├── encounters.css (2200)  ← Encounter UI
├── initiative.css (896)   ← Combat tracker
├── loot.css (1010)        ← Loot/treasure
├── spells.css (674)       ← Spell management
├── party.css (2466)       ← Character roster
├── dashboard.css (3433)   ← Main dashboard
├── dmscreen.css (3037)    ← DM Screen widgets
├── dice.css (902)         ← Dice roller
├── tools.css (2583)       ← Quick reference, tools
└── roadmap.css (738)      ← Roadmap visualization
```

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
2. **Global Namespace:** Functions are global - use unique prefixes to avoid collisions. Constants are grouped in `DND_RULES` and `UI_CONSTANTS` namespaces (see `core/constants.js`)
3. **No ES Modules (Browser-Code):** Can't use import/export in browser modules - everything must be in global scope. Note: `package.json` has `"type": "module"` — that flag applies only to Node-side tooling configs (`eslint.config.js`, `playwright.config.js` use ESM; `jest.config.cjs` opts out via the `.cjs` extension). It does **not** affect browser code.
4. **const/var Conflict:** Never use `var X = window.X;` to "import" a variable declared with `const`/`let` in another module - this causes SyntaxError in loader mode. The `const` is already in the global lexical scope and accessible directly
4. **CSS Variables:** Always use `var(--gold)`, `var(--text-dim)` etc. for theming
5. **German Localization:** UI strings in German, code comments can be English
6. **XSS in Widgets:** Even static widgets should use `esc()` if showing any user data
7. **Mobile First:** Test widgets at 320px width - masonry layout adjusts columns

---

### Comprehensive Refactoring (Jan 2026) — Lessons Learned

5-Phasen-Refactoring der Codebase im Januar 2026 (Performance, Architektur, Quality).
Full retrospective: [docs/architecture/refactoring-jan-2026.md](./docs/architecture/refactoring-jan-2026.md)

**Patterns to follow today:**
- `ErrorHandler.log()` wrapped in `APP_CONFIG.DEBUG_MODE` — never raw `console.log()` in prod
- Extract magic numbers to `core/constants.js` (`COMBAT_CONSTANTS`, `UI_TIMING`)
- Use CRUD helpers: `deleteWithConfirm()`, `afterCrudOperation()`, `saveEntityWithUndo()`
- `saveUndoState()` before any destructive op
- Sanitize all user content with `esc()` or `sanitizeHTML()`
- `parseEntityId()` for all ID comparisons
- `EntityLookup.enableCache()` / `clearCache()` around render cycles
- `structuredClone()` instead of `JSON.parse(JSON.stringify())`

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
   - Verify ID in `assets/templates/*.html` matches JS
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
2. **Check HTML structure:** Does `assets/templates/*.html` have the container element?
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

Dual coordinate system (SVG viewBox + pixel overlay) must stay in sync.
Full architecture guide: [docs/architecture/roadmap-coordinates.md](./docs/architecture/roadmap-coordinates.md)

**Critical rule:** ViewBox origin MUST be `(0,0)` — normalize coords, never shift viewBox.

### Build System & Deduplication Pattern

Three-pass deduplication in `build.py` resolves global-scope conflicts.
Full implementation guide: [docs/build-system.md](./docs/build-system.md)

**Key rule:** Never `var X = window.X;` for vars that are `const`/`let` in another module.

### Duplicate Declaration Debugging Pattern

Build-Deduplikation hat Blind Spots (function-scoped `const`, doppelte Funktionen).
Full debugging guide: [docs/architecture/duplicate-declarations.md](./docs/architecture/duplicate-declarations.md)

**Quick rules:**
- No `const X = window.X` inside functions — use `window.X()` directly
- No duplicate function names across modules
- Module-level imports: `var`, not `const`/`let`
