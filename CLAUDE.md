# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 1.4.0 | **Last Updated:** 2025-01-06

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
