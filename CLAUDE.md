# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version:** 2.6.1 | **Last Updated:** 2026-06-12

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
saveUndoState(); // Call BEFORE any destructive operation
// Make changes to D
saveImmediate();
```

**DOM Selection:**

```javascript
$(id); // Direct ID lookup (no # prefix)
$c(id); // Cached DOM element lookup
esc(text); // XSS-safe HTML escaping
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

| Directory              | Purpose                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `core/`                | App config, constants, data schema, initialization                                   |
| `utils/`               | DOM helpers, debounce, throttle, caching, performance                                |
| `systems/`             | Cross-cutting: undo, backups, tags, entity-links, conditions, avatars, hp-calculator |
| `systems/spellslots/`  | Spell slot tracking subsystem, quick-reference, persistence, import/export           |
| `features/party/`      | Character management (render, details, CRUD)                                         |
| `features/npcs/`       | NPC CRUD, display, interactions, dialogs, popup                                      |
| `features/encounters/` | Encounter management (render, CRUD)                                                  |
| `features/locations/`  | Location tracking (render, CRUD)                                                     |
| `features/quests/`     | Quest system (render, CRUD)                                                          |
| `features/shops/`      | Shops, wiki, sessions, spell-editor, mindmap/network, shop-export                    |
| `features/dice/`       | Dice roller, dice favorites, maps, search, themes, campaign manager                  |
| `features/timers/`     | Combat and session timers                                                            |
| `features/dmscreen/`   | DM Screen with widget system, profiles, live-sync                                    |
| `ui/`                  | Virtual scroll, lazy loading, event delegation                                       |
| `ui/actions/`          | Action handlers by domain (entity, combat, ui, dice, wiki, shop, map, system)        |
| `render/`              | Rendering utilities/helpers                                                          |
| `assets/`              | styles.css (@import hub), body.html (Hinweis-Datei)                                  |
| `assets/styles/`       | 13 modulare CSS-Dateien (variables, core, editors, npcs, encounters, etc.)           |
| `assets/templates/`    | 10 modulare HTML-Templates (header, views, modals)                                   |
| `tests/`               | Jest unit tests, Playwright E2E tests                                                |
| `tools/`               | Analysis scripts (render split, event handler migration, globals check)              |

## Important Files

- `build.py` - Build script (Python, --production fuer Prod-Build)
- `loader.js` - Module loading order definition (60+ modules)
- `core/config.js` - APP_CONFIG with all settings
- `core/constants.js` - Centralized constants (EDITOR_FONTS, READ_ALOUD_STYLES, CONDITIONS, etc.)
- `core/data.js` - Global data schema (D object)
- `systems/undo.js` - Undo/redo implementation with state snapshots
- `systems/entity-links.js` - Cross-entity linking system
- `ui/editors/rich-text.js` - Rich text editor (floating toolbar)
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
- Campaign index stored separately (`dnd-tracker-campaigns`)
- Data isolation between campaigns
- File: `systems/campaign-manager/campaign-manager.js` → `createCampaign()`, `switchCampaign()`, `deleteCampaign()`

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

| Shortcut   | Action                                         |
| ---------- | ---------------------------------------------- |
| `1-9`      | Switch to tab 1-9                              |
| `Strg+Z`   | Undo                                           |
| `Strg+Y`   | Redo                                           |
| `Strg+S`   | Save                                           |
| `Strg+K/F` | Focus global search                            |
| `R`        | Quick roll d20                                 |
| `T`        | Toggle session timer                           |
| `L`        | Toggle event log (persistent mode)             |
| `/`        | Open Quick Reference and focus search          |
| `?`        | Show keyboard shortcuts                        |
| `N`        | Next turn (Initiative) / New element (context) |
| `P`        | Previous turn (Initiative)                     |
| `Shift+N`  | New round (Initiative)                         |
| `Space`    | Next turn (Initiative)                         |
| `Escape`   | Close overlays/modals                          |
| `Alt+Shift+1..5` | Activate Soundboard scene in quick-slot 1–5 (D-03) |
| `Alt+Shift+0`    | Toggle Soundboard mute (D-03)                  |

## Conventions

- **Language:** German (UI text, D&D terms, comments)
- **Indentation:** 4 spaces
- **Section markers:** `// [SECTION:MODULE_NAME]`
- **execCommand (Tech-Debt):** `document.execCommand` wird aktuell an 21 Stellen in `ui/editors/rich-text.js` genutzt (API deprecated). Die Ablösung durch manuelle DOM-Manipulation ist als Tech-Debt vorgemerkt (eigene Phase). Bis dahin: execCommand-Aufrufe sind bewusst geduldet.
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

| Priority | Task                                   | Notes                                                                                           |
| -------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| ~~Done~~ | ~~**CSS aufteilen**~~                  | Already split into 13 modular files in `assets/styles/` (see CSS Organization)                  |
| ~~Done~~ | ~~**Inline Event-Handler migrieren**~~ | Migration abgeschlossen (641 data-action-Attribute, 0 inline-Handler verbleibend, Juni 2026)    |
| ~~Done~~ | ~~**Build-System konsolidieren**~~     | Webpack removed (March 2026), Python `build.py` is sole build system                            |
| ~~Done~~ | ~~**CI/CD Pipeline**~~                 | GitHub Actions workflow in `.github/workflows/ci.yml` (lint, typecheck, test, build)            |
| ~~Done~~ | ~~**.d.ts cleanup**~~                  | 18 orphaned `.d.ts` removed (March 2026), 64 valid ones remain for `tsc --noEmit` type-checking |

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
    mytab: {
        renders: ['renderMyTab', 'renderMyTabStats'], // Called on every switch
        init: 'initMyTab', // Called once on first view
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
    if (name === 'mytab') renderMyTab(); // ❌ Don't do this
}

// GOOD - registry handles it
const TAB_RENDER_REGISTRY = {
    mytab: { renders: ['renderMyTab'], init: null, cleanup: null }
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
    window.save = function () {
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

**Problem Solved:** CSS file was 23k+ lines in a single file. Now split into 13 modular files under `assets/styles/`, loaded via `@import` in dev mode and concatenated by `build.py` for production.

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
└── tools.css (2583)       ← Quick reference, tools
```

**Pattern to Follow:**

```css
/* ========================================
   FEATURE NAME - WIDGET TYPE
   ======================================== */

/* Base container */
.dms-feature-widget {
}

/* Sub-components */
.dms-feature-item {
}
.dms-feature-title {
}

/* Variants/modifiers */
.dms-feature-item.active {
}
.dms-feature-item.disabled {
}
```

**Naming Convention:**

- Prefix with feature abbreviation: `dms-` for DM Screen
- Use BEM-lite: `.dms-widget`, `.dms-widget-header`, `.dms-widget-body`
- Modifiers as additional classes: `.dms-item.str`, `.dms-item.active`

---

### Gotchas & Common Pitfalls

1. **Build Order Matters:** New modules must be added to `build.py` modules list in correct order
2. **Global Namespace:** Functions are global - use unique prefixes to avoid collisions. Constants are grouped in `DND_RULES` and `UI_CONSTANTS` namespaces (see `core/constants.js`)
3. **No ES Modules:** Can't use import/export - everything must be in global scope
4. **const/var Conflict:** Never use `var X = window.X;` to "import" a variable declared with `const`/`let` in another module - this causes SyntaxError in loader mode. The `const` is already in the global lexical scope and accessible directly
5. **CSS Variables:** Always use `var(--gold)`, `var(--text-dim)` etc. for theming
6. **German Localization:** UI strings in German, code comments can be English
7. **XSS in Widgets:** Even static widgets should use `esc()` if showing any user data
8. **Mobile First:** Test widgets at 320px width - masonry layout adjusts columns

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
const hpClass =
    hpPct <= COMBAT_CONSTANTS.HP_CRITICAL_THRESHOLD
        ? 'critical'
        : hpPct <= COMBAT_CONSTANTS.HP_BLOODIED_THRESHOLD
          ? 'bloodied'
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

    const html = init.combatants
        .map(cb => {
            const { hpPercent, hpClass } = getCombatantHpStatus(cb);
            const { ac, entityType, entityId } = getInitCombatantDetails(cb);
            const effects = renderCombatantEffects(cb);
            // ... simple template
        })
        .join('');

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
    if (char) {
        ac = char.ac || char.armorClass || 10; /* ... */
    }
} else if (type === 'enemy') {
    /* ... */
}

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
    if (!char) {
        showToast('Charakter nicht gefunden', 'error');
        return;
    }
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
    return safeRender(
        () => {
            const c = $('init-list');
            if (!c) throw new Error('init-list container not found');
            // ... rest of render
        },
        'renderInit',
        'init-list',
        {
            showToastOnError: true,
            toastMessage: 'Initiative konnte nicht aktualisiert werden'
        }
    );
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
    const html = combatants
        .map(cb => {
            const char = EntityLookup.findByName('characters', cb.name); // Cached!
            // ...
        })
        .join('');

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
    window.structuredClone = obj => JSON.parse(JSON.stringify(obj));
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
    document.querySelectorAll('.aoe-target-checkbox').forEach(cb => (cb.checked = true));
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
    const quest = {
        /* ... */
    };
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
    for (let i = start; i <= end; i++) {
        // ❌ User can input "1-1000000"
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

| Error                                | Cause                   | Fix                                   |
| ------------------------------------ | ----------------------- | ------------------------------------- | --- | --- |
| `X is not a function`                | Function not loaded yet | Check module load order in `build.py` |
| `Cannot read property of undefined`  | Data not initialized    | Add fallback: `D.data                 |     | []` |
| `Element not found: #X`              | Container doesn't exist | Check HTML or add null check          |
| `[TabRegistry] Function X not found` | Function name typo      | Fix name in registry or add function  |

---

### Build System & Deduplication Pattern

**Critical Architecture Constraint:**

The non-ESM architecture (global scope, `<script>` tags) requires all modules to be concatenated into a single file. This creates variable declaration conflicts that must be resolved through **three-pass deduplication**.

**Problem Solved:**

When concatenating 93 modules, duplicate declarations cause `SyntaxError: Identifier 'X' has already been declared`:

```javascript
// Module A: core/constants.js
const UI_TIMING = { DM_SCREEN_SYNC_DELAY: 150 };
window.UI_TIMING = UI_TIMING;

// Module B: features/dmscreen/dmscreen-render.js (later in build)
var UI_TIMING = window.UI_TIMING; // ❌ CONFLICT with const above!
```

**Three-Pass Deduplication Solution:**

```python
# Pass 1: Find Real Definitions (NOT window assignments)
real_definitions = set()
for line in lines:
    if not is_window_assignment(line):
        if matches_declaration(line):
            real_definitions.add(var_name)

# Pass 2: Remove Window Assignment Conflicts
for line in lines:
    if is_window_assignment(line):
        if var_name in real_definitions:
            # Conflict with definition - remove
            output_comment(f"// [DEDUP] Removed: {var_name}")
        elif var_name in seen_window_assigns:
            # Duplicate window assignment - remove
            output_comment(f"// [DEDUP] Removed duplicate: {var_name}")
        else:
            # First occurrence - keep
            seen_window_assigns.add(var_name)
            output_line(line)

# Pass 3: Remove Duplicate Function Declarations
seen_functions = {}
for line in lines:
    if matches_function(line):
        if func_name in seen_functions:
            comment_out_function_and_body()
        else:
            seen_functions[func_name] = line_num
```

**Why This Approach:**

1. **Pass 1 Prevents False Positives**: Must distinguish real definitions from imports before removing anything
2. **Pass 2 Handles Two Conflict Types**:
    - **Duplicate imports**: `var X = window.X` appears twice
    - **Definition vs Import**: `const X = ...` exists, later `var X = window.X` conflicts
3. **Pass 3 Catches Functions**: Regex-based detection missed by variable patterns

**Pattern to Follow:**

When adding new modules, do NOT use `var X = window.X;` for variables declared with `const`/`let` in other modules. These are already in the global lexical scope:

```javascript
// GOOD: Access const-declared globals directly (they're in global lexical scope)
// APP_CONFIG, StorageAPI, log, ErrorHandler, etc. are all accessible without imports
const MY_KEY = APP_CONFIG.MY_SETTING;
StorageAPI.getJSON('key', []);

// GOOD: Use var for function-declared or window-only globals
var D = window.D;
var save = window.save;

// BAD: var redeclaration of const/let → SyntaxError in loader mode!
var APP_CONFIG = window.APP_CONFIG; // ❌ SyntaxError if const APP_CONFIG exists
var StorageAPI = window.StorageAPI; // ❌ SyntaxError if const StorageAPI exists
```

**Namespace Constants (Feb 2026):**

Constants from `core/constants.js` are available via namespace objects:

```javascript
// NEW: Namespace access (preferred)
DND_RULES.CONDITIONS; // D&D rules: CONDITIONS, DAMAGE_TYPES, ATTRIBUTES, etc.
UI_CONSTANTS.UI_TIMING; // UI/App: UI_TIMING, MAP_CONSTANTS, MARKER_ICONS, etc.

// LEGACY: Direct access (still works, will be removed in future)
CONDITIONS; // Same as DND_RULES.CONDITIONS
UI_TIMING; // Same as UI_CONSTANTS.UI_TIMING
```

**Export Audit Rule:** Only export functions/variables to `window` if they are used by OTHER modules or HTML event handlers. Module-internal functions should NOT be exported.

**Module-Level Constants Pattern:**

For constants from APP_CONFIG, define module-level fallbacks:

```javascript
// GOOD: Module-level constant with fallback
const BACKUP_INTERVAL = window.APP_CONFIG?.BACKUP_INTERVAL || 300000;
const MAX_BACKUPS = window.APP_CONFIG?.MAX_BACKUPS || 5;

// Then use directly in code
function startBackup() {
    setInterval(createBackup, BACKUP_INTERVAL); // ✅ No window.APP_CONFIG needed
}

// BAD: Access APP_CONFIG in every function
function startBackup() {
    const APP_CONFIG = window.APP_CONFIG; // ❌ Repeated everywhere
    setInterval(createBackup, APP_CONFIG.BACKUP_INTERVAL);
}
```

**Benefits:**

- ✅ Eliminates window access overhead
- ✅ Provides fallback values for missing config
- ✅ Makes code testable (constants can be mocked)
- ✅ No conflicts with other modules

**Test-Driven Development Pattern:**

All build system changes MUST follow TDD:

```bash
# 1. Write failing tests first
python -m pytest tests/build/test_build_deduplication.py -v
# Should show FAILURES

# 2. Implement fix
# Edit build.py

# 3. Verify tests pass
python -m pytest tests/build/test_build_deduplication.py -v
# Should show all PASSING

# 4. Commit in two steps
git commit -m "test: [feature] failing tests"
git commit -m "feat: [feature] implementation"
```

**Test Coverage Requirements:**

Build deduplication tests must verify:

1. ✅ Duplicate window assignments removed
2. ✅ Conflicting definitions handled correctly
3. ✅ Multiple conflicts resolved
4. ✅ Generated build has no duplicates
5. ✅ Generated JavaScript is syntactically valid
6. ✅ Required constants available in build

**Performance Characteristics:**

| Operation                | Complexity | Time (1.29 MB) |
| ------------------------ | ---------- | -------------- |
| Pass 1: Scan definitions | O(n)       | ~70ms          |
| Pass 2: Filter conflicts | O(n)       | ~60ms          |
| Pass 3: Remove functions | O(n)       | ~20ms          |
| **Total**                | **O(n)**   | **~150ms**     |

Where n = number of lines (~59,000)

**Results:**

- **Input**: 1,290,596 bytes (1.29 MB)
- **Removed**: 523 window assignment conflicts + 1 duplicate function
- **Output**: 1,280,596 bytes (1.28 MB)
- **Savings**: ~11 KB (0.8%)

**Files to Check When Modifying:**

- `build.py:56-187` - Deduplication implementation
- `tests/build/test_build_deduplication.py` - TDD test suite
- `docs/build-system.md` - Comprehensive documentation

**Common Pitfalls:**

❌ **Removing real definitions** - Pass 1 must correctly identify them
❌ **Missing function body** - Pass 3 must track braces to comment entire function
❌ **Regex too greedy** - Must not match comments or string literals
❌ **Module order wrong** - Dependencies must load before dependents

**Debugging Build Issues:**

```bash
# 1. Check which variables were removed
python build.py 2>&1 | grep "[DEDUP]"

# 2. Find specific variable in build
grep "var UI_TIMING" dist/dnd-tracker-bundled.html

# 3. Test deduplication on isolated code
python -c "
from build import deduplicate_window_assignments
code = '''
var TEST = window.TEST;
var TEST = window.TEST;
'''
print(deduplicate_window_assignments(code))
"

# 4. Run only build tests
python -m pytest tests/build/ -v
```

**Related Documentation:**

- **[Build System Guide](./docs/build-system.md)** - Full implementation details
- **[Module Loading Order](./loader.js)** - Dependency graph
- **[Testing Guide](./docs/testing.md)** - Test procedures

---

### Duplicate Declaration Debugging Pattern (2026-01-10)

**Critical Learnings from Production Incidents:**

This section documents duplicate declaration bugs discovered in production builds and patterns to prevent them.

**Problem #1: Function-Scoped `const` Window Imports**

**What Happened:**

```javascript
// npc-interactions.js:9 (INSIDE a function)
function toggleNPCCard(cardOrId) {
    const selectNPC = window.selectNPC; // ❌ CONFLICT
    // ...
    selectNPC(id);
}

// npc-render.js:155 (GLOBAL scope)
function selectNPC(id, scroll = true) {
    // Real implementation
}
```

**Why It Failed:**

- Build concatenation places function-scoped `const` in global scope
- When `toggleNPCCard` is called, the `const selectNPC` declaration becomes global
- **Deduplication Pass 2 doesn't check inside functions** - only scans top-level declarations
- Result: `SyntaxError: Identifier 'selectNPC' has already been declared`

**Why This Approach Over Alternatives:**

- ✅ **Chosen**: Remove local variable, use `window.selectNPC()` directly
- ❌ **Rejected**: Rename local variable → Breaks pattern consistency
- ❌ **Rejected**: Fix deduplication to scan functions → Too complex, performance hit

**Pattern to Follow:**

```javascript
// NEVER: Local const for window functions
function myFunction() {
    const save = window.save; // ❌ Will conflict when concatenated
    save();
}

// ALWAYS: Direct window access
function myFunction() {
    if (typeof window.save === 'function') {
        // ✅ Safe
        window.save();
    }
}

// OR: Module-level var (deduplicated)
var save = window.save; // ✅ At top of file
function myFunction() {
    if (typeof save === 'function') {
        save();
    }
}
```

---

**Problem #2: Duplicate Function Definitions Across Modules**

**What Happened:**

```javascript
// npc-render.js:381
function toggleNPCCard(id) {
    selectNPC(id); // Simple wrapper
}

// npc-interactions.js:8
function toggleNPCCard(cardOrId) {
    // Full implementation with fallback logic
}
```

**Build Output:**

```javascript
// Line 36000: First definition (from npc-render.js)
function toggleNPCCard(id) {
    selectNPC(id);
}

// Line 37273: Deduplication tries to remove second
// [DEDUP] Removed duplicate function: toggleNPCCard
    const id = parseEntityId(cardOrId);  // ❌ Orphaned function body!
    if (id === null)
        return;  // ❌ SyntaxError: Illegal return statement
    // ...
}
```

**Why It Failed:**

- **Deduplication Pass 3** correctly detects duplicate function name
- Comments out function declaration: `// [DEDUP] Removed duplicate function: toggleNPCCard`
- **BUT fails to comment out entire function body** - only the `function` line
- Orphaned `return` statements cause `SyntaxError: Illegal return statement`

**Root Cause Analysis:**

```python
# build.py:171-187 - remove_duplicate_functions()
match = re.match(r'^function\s+(\w+)\s*\(', stripped)
if match:
    func_name = match.group(1)
    if func_name in seen_functions:
        filtered_lines.append(f"// [DEDUP] Removed duplicate function: {func_name}")
        continue  # ❌ Only skips function declaration line, not body!
```

**Why This Approach Over Alternatives:**

- ✅ **Chosen**: Remove simpler duplicate from source code before build
- ❌ **Rejected**: Fix deduplication to track braces → Complex, fragile with nested functions
- ❌ **Rejected**: Rename one function → Breaks existing references

**Pattern to Follow:**

```javascript
// ❌ NEVER: Same function name in multiple files
// File A
function processEntity(id) {
    /* simple version */
}

// File B
function processEntity(id) {
    /* full version */
}

// ✅ ALWAYS: One canonical implementation
// File A: features/entities/entity-core.js
function processEntity(id) {
    // Full, comprehensive implementation
}

// File B: Use the canonical version
function handleEntity(id) {
    window.processEntity(id); // Call the global function
}

// ✅ OR: Different names for different purposes
function processEntitySimple(id) {
    /* ... */
}
function processEntityFull(id) {
    /* ... */
}
```

---

**Debugging Checklist for Duplicate Declarations:**

When encountering `SyntaxError: Identifier 'X' has already been declared`:

1. **Find ALL declarations:**

    ```bash
    grep -rn "^function X\|^const X\|^var X\|^let X" features/ systems/ ui/
    grep -n "const X = window.X" features/ systems/ ui/  # Function-scoped
    ```

2. **Check build output:**

    ```bash
    grep -n "function X\|const X\|var X" dist/dnd-tracker-bundled.html
    ```

3. **Identify conflict type:**
    - **Type A**: Two global definitions → Remove one from source
    - **Type B**: Global + function-scoped `const` → Remove function-scoped
    - **Type C**: Definition + window import → Fix deduplication or remove import

4. **Verify deduplication results:**
    ```bash
    python build.py 2>&1 | grep "\[DEDUP\]"
    grep "\[DEDUP\]" dist/dnd-tracker-bundled.html | grep "X"
    ```

When encountering `SyntaxError: Illegal return statement`:

1. **Search for orphaned function bodies:**

    ```bash
    grep -B2 "^\s*return;" dist/dnd-tracker-bundled.html | grep "\[DEDUP\]"
    ```

2. **Find which function was commented out:**

    ```bash
    grep "\[DEDUP\] Removed duplicate function:" dist/dnd-tracker-bundled.html
    ```

3. **Locate duplicate in source:**

    ```bash
    grep -rn "^function FUNC_NAME" features/ systems/ ui/
    ```

4. **Choose canonical version:**
    - Keep most comprehensive implementation
    - Remove simple wrappers
    - Ensure all callers use global `window.FUNC_NAME()` if needed

---

**Prevention Strategies:**

**Pre-Build Validation:**

```bash
# Add to CI/CD pipeline or pre-commit hook
# Check for function-scoped window imports
grep -rn "^\s\+const .* = window\." features/ systems/ ui/ | grep -v "^//"
# Should return empty (no matches)

# Check for duplicate function definitions
for func in $(grep -rho "^function \w\+" features/ systems/ ui/ | cut -d' ' -f2 | sort | uniq -d); do
    echo "Duplicate function: $func"
    grep -rn "^function $func" features/ systems/ ui/
done
```

**Code Review Checklist:**

- [ ] No `const X = window.X` inside functions (use `window.X()` directly)
- [ ] No duplicate function names across modules
- [ ] Module-level imports use `var`, not `const`/`let`
- [ ] Run `python build.py` and check browser console before committing

**Testing Requirements:**

```python
# tests/build/test_build_deduplication.py
def test_no_function_scoped_window_imports(self):
    """Ensure no function-scoped const assignments to window properties"""
    # Check all source files for pattern inside functions
    # Fail if found

def test_no_orphaned_return_statements(self):
    """Ensure deduplication doesn't leave orphaned function bodies"""
    dist_file = Path('dist/dnd-tracker-bundled.html')
    with open(dist_file) as f:
        content = f.read()

    # Find all [DEDUP] comments
    dedup_lines = [i for i, line in enumerate(content.split('\n'))
                   if '[DEDUP]' in line]

    # Check next 20 lines for orphaned returns
    for line_num in dedup_lines:
        # Verify no uncontained return statements
```

---

**Mistakes to Avoid:**

1. ❌ **Don't assume deduplication catches everything** - It's regex-based and has blind spots
2. ❌ **Don't use `const` for window imports inside functions** - Always breaks in build
3. ❌ **Don't duplicate function names** - Even with different implementations
4. ❌ **Don't rely on build-time fixes** - Fix duplicates in source code
5. ❌ **Don't skip browser console testing** - SyntaxErrors only appear at runtime

**When in Doubt:**

- Search for existing implementations before creating new functions
- Use `window.FUNCTION()` for cross-module calls instead of local imports
- Run full build + browser test after any module changes
- Check `build.py` deduplication output for unexpected removals

---

**Historical Context:**

These patterns emerged from debugging sessions on:

- **2026-01-07**: Initial deduplication system (UI_TIMING, save() conflicts)
- **2026-01-10**: Function-scoped const and duplicate functions (selectNPC, toggleNPCCard)

**Lessons Applied:**

- TDD for build system changes (6 tests covering deduplication)
- Documentation-first for complex systems (docs/build-system.md)
- Source-level fixes preferred over build-time workarounds

---
