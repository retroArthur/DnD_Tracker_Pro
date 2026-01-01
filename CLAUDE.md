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
- `systems/undo.js` - Undo/redo implementation
- `features/shops/spell-editor.js` - Rich text editor (floating toolbar)
- `features/encounter-calculator.js` - Encounter balance calculator with terrain/lair modifiers
- `features/dice/dice-core.js` - Dice roller with floating panel
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
