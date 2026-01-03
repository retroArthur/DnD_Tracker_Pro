# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

D&D Kampagnen-Tracker Pro - A single-page D&D 5e campaign management application. Pure JavaScript/HTML/CSS, runs entirely offline in browser with LocalStorage persistence. German-localized.

## Build Commands

```bash
# Development build (preserves readability)
python build.py

# Production build (minified, single HTML file)
python build-optimized.py

# With npm (requires PYTHONIOENCODING=utf-8 on Windows)
npm run build         # Production
npm run build:dev     # Development

# Serve locally
npm run serve         # Python HTTP server on :8000

# Testing
npm run test          # Jest unit tests
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:headed  # E2E with visible browser

# Code quality
npm run lint          # ESLint
npm run typecheck     # TypeScript validation
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
- **`D`** - Global data object (party, encounters, locations, npcs, quests, shops, spells, etc.)
- **`APP_CONFIG`** - Frozen configuration object in `core/config.js`
- Persisted to `localStorage[APP_CONFIG.STORAGE_KEY]`

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
| `core/` | App config, constants, initialization |
| `utils/` | DOM helpers, debounce, throttle, caching |
| `systems/` | Cross-cutting: undo, backups, tags, entity-links |
| `systems/spellslots/` | Spell slot tracking subsystem |
| `features/party/` | Character management |
| `features/npcs/` | NPC CRUD and display |
| `features/encounters/` | Encounter management |
| `features/locations/` | Location tracking |
| `features/quests/` | Quest system |
| `features/shops/` | Shops, wiki, sessions, spell-editor |
| `features/dice/` | Dice roller, maps, timers, search |
| `ui/` | Virtual scroll, lazy loading, event delegation |
| `ui/actions/` | Action handlers by domain |
| `render/` | Rendering utilities |
| `assets/` | styles.css, body.html |

## Important Files

- `build.py` / `build-optimized.py` - Build scripts (Python)
- `loader.js` - Module loading order definition
- `core/config.js` - APP_CONFIG with all settings
- `core/constants.js` - Centralized constants (EDITOR_FONTS, READ_ALOUD_STYLES, CONDITIONS, etc.)
- `systems/undo.js` - Undo/redo implementation
- `features/shops/spell-editor.js` - Rich text editor (floating toolbar)
- `features/encounter-calculator.js` - Encounter balance calculator with terrain/lair modifiers
- `features/dice/dice-core.js` - Dice roller with floating panel
- `ui/actions/system-actions.js` - System action handlers (modals, editor actions)
- `docs/bugfixes.md` - Bug fix patterns and lessons learned

## Recent Features

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

## Known Issues

- **Edit tool unreliable:** Use Python scripts for file modifications when Edit tool fails with "File unexpectedly modified"
- **Windows encoding:** Set `PYTHONIOENCODING=utf-8` before running build.py


## CRITICAL: File Editing on Windows

### ⚠️ MANDATORY: Always Use Backslashes on Windows for File Paths

**When using Edit or MultiEdit tools on Windows, you MUST use backslashes (`\`) in file paths, NOT forward slashes (`/`).**

#### ❌ WRONG - Will cause errors:
```
Edit(file_path: "D:/repos/project/file.tsx", ...)
MultiEdit(file_path: "D:/repos/project/file.tsx", ...)
```

#### ✅ CORRECT - Always works:
```
Edit(file_path: "D:\repos\project\file.tsx", ...)
MultiEdit(file_path: "D:\repos\project\file.tsx", ...)
