# Tab Navigation System - Developer Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-07
**Module:** `systems/tab-registry.js`

## Overview

The Tab Registry System provides a centralized, declarative way to manage tab-specific render functions in the D&D Tracker application. It solves the problem of stale UI content when users switch between tabs by automatically re-rendering tab content on every tab switch.

---

## Architecture

### The Problem (Before)

Previously, `switchView()` in `navigation.js` used manual `if` statements to trigger renders:

```javascript
// OLD APPROACH - Easy to miss tabs
function switchView(name) {
    // ... show/hide tabs ...
    if (name === 'party') renderParty();
    if (name === 'dashboard') renderDashboard();
    if (name === 'dmscreen') renderDMScreen();
    // ❌ Missing: dice, initiative, timers, maps, etc.
}
```

**Problems:**

- ❌ Inconsistent: Only 3 out of 19 tabs had explicit renders
- ❌ Maintainability: Developers had to manually remember to add renders
- ❌ Stale UI: Tabs that weren't explicitly rendered showed outdated content
- ❌ Silent Failures: No warnings when renders were missing

### The Solution (Now)

The Tab Registry System uses a centralized mapping:

```javascript
// NEW APPROACH - Declarative, centralized
const TAB_RENDER_REGISTRY = {
    dice: {
        renders: ['renderRandomTables', 'renderDiceHistory', 'renderDiceFavorites'],
        init: 'initDiceTab',
        cleanup: null
    }
    // ... 18 more tabs
};

function switchView(name) {
    // ... show/hide tabs ...
    renderTabContent(name); // ✓ Uses registry
}
```

**Benefits:**

- ✅ Centralized: All tab-render mappings in one place
- ✅ Declarative: Easy to see which tabs have which renders
- ✅ Self-documenting: Registry shows the full architecture
- ✅ Error handling: Catches and logs render failures
- ✅ Lifecycle hooks: Supports init/cleanup per tab

---

## Tab Registry Structure

### Registry Entry Format

Each tab in `TAB_RENDER_REGISTRY` has the following structure:

```typescript
type TabConfig = {
    renders: string[]; // Array of render function names
    init: string | null; // One-time initialization function
    cleanup: string | null; // Cleanup function (called on tab exit)
};
```

### Example Entries

#### Simple Tab (Single Render)

```javascript
'party': {
    renders: ['renderParty'],
    init: null,
    cleanup: null
}
```

#### Complex Tab (Multiple Renders)

```javascript
'initiative': {
    renders: [
        'renderInit',              // Main combat tracker
        'renderBattlefieldBanner', // Terrain/lair display
        'renderQuickActionsBar'    // Combat action shortcuts
    ],
    init: null,
    cleanup: null
}
```

#### Tab with Initialization

```javascript
'dice': {
    renders: ['renderRandomTables', 'renderDiceHistory', 'renderDiceFavorites'],
    init: 'initDiceTab',  // Called once on first view
    cleanup: null
}
```

#### Static Tab (No Renders)

```javascript
'data': {
    renders: [],  // Data management tab is mostly forms
    init: null,
    cleanup: null
}
```

---

## How to Add a New Tab

### Step 1: Create the HTML Structure

Add your tab section to `assets/body.html`:

```html
<section id="view-mytab" class="view" data-view-name="My Tab">
    <div class="view-header">
        <h2>🎯 My Tab</h2>
    </div>
    <div id="mytab-container" class="view-content">
        <!-- Tab content will be rendered here -->
    </div>
</section>
```

### Step 2: Create the Render Function

Create your render function in the appropriate feature module:

```javascript
// features/mytab/mytab-render.js
function renderMyTab() {
    const container = $('mytab-container');
    if (!container) {
        if (window.APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderMyTab] Container missing - likely not on mytab');
        }
        return;
    }

    // Render your content
    container.innerHTML = `
        <div class="mytab-content">
            <h3>Hello from My Tab!</h3>
        </div>
    `;
}
```

**Best Practices:**

- ✅ Always check if container exists before rendering
- ✅ Add debug warnings for missing containers
- ✅ Use `esc()` to prevent XSS when rendering user content
- ✅ Keep render functions pure (no side effects except DOM updates)

### Step 3: Register in Tab Registry

Add your tab to `systems/tab-registry.js`:

```javascript
const TAB_RENDER_REGISTRY = {
    // ... existing tabs ...

    mytab: {
        renders: ['renderMyTab'],
        init: null, // Add initialization function if needed
        cleanup: null
    }
};
```

### Step 4: Add Navigation Button

Add a navigation button to the header (if not already present):

```html
<!-- In assets/body.html, within .nav-tabs -->
<button class="nav-tab" data-view="mytab" aria-selected="false">🎯 My Tab</button>
```

### Step 5: Test

1. **Manual Test:** Click the tab and verify content renders
2. **Switch Test:** Switch away and back - content should re-render
3. **Debug Test:** Enable `APP_CONFIG.DEBUG_MODE = true` and check console logs

---

## Lifecycle Hooks

### Init Hook

Called **once** when the tab is first shown. Use for expensive setup operations:

```javascript
'maps': {
    renders: ['displayMap'],
    init: 'initMapPanning',  // Initialize pan/zoom controls once
    cleanup: null
}

// In features/dice/maps.js
function initMapPanning() {
    console.log('[Maps] Initializing pan controls (one-time)');
    // Setup event listeners, initialize state, etc.
}
```

**When to use `init`:**

- Setting up event listeners that persist across tab switches
- Loading external resources (images, data files)
- Initializing third-party libraries
- Creating permanent DOM elements

**When NOT to use `init`:**

- Simple data rendering (use `renders` instead)
- Operations that need to run every time tab is shown

### Cleanup Hook

Called when **leaving** the tab. Use for cleanup operations:

```javascript
'mytab': {
    renders: ['renderMyTab'],
    init: 'initMyTab',
    cleanup: 'cleanupMyTab'  // Clean up when leaving
}

function cleanupMyTab() {
    console.log('[MyTab] Cleaning up resources');
    // Remove event listeners, clear intervals, etc.
}
```

**When to use `cleanup`:**

- Removing event listeners added in `init`
- Clearing intervals/timeouts
- Releasing resources (WebGL contexts, large data structures)

---

## Error Handling

### Function Not Found

If a render function is missing, the registry logs a warning:

```javascript
console.warn(`[TabRegistry] Function renderMyTab not found for tab mytab`);
```

**Fix:** Ensure the function is defined globally before `init()` runs.

### Render Function Crashes

If a render function throws an error, it's caught and logged:

```javascript
console.error(`[TabRegistry] Render renderMyTab() failed for tab mytab:`, error);
```

The error doesn't prevent other render functions from running.

### Container Missing

If a render function's container is missing (checked with `$()`):

```javascript
// In DEBUG_MODE, you'll see:
console.warn(`[DOM] Element not found: #mytab-container`, stack trace);
console.warn(`[renderMyTab] Container missing - likely not on mytab`);
```

**Common Causes:**

- Tab HTML not loaded (check `body.html`)
- ID typo in HTML or JavaScript
- Container conditionally rendered by another function

---

## Debug Mode

### Enabling Debug Mode

```javascript
// In browser console:
APP_CONFIG.DEBUG_MODE = true;

// Or permanently in core/config.js:
const APP_CONFIG = Object.freeze({
    DEBUG_MODE: true // Change to true
    // ...
});
```

### Debug Output

With `DEBUG_MODE` enabled, you'll see:

**On App Startup:**

```
[TabRegistry] Validating registry...
[TabRegistry] Validation complete: No issues found ✓
```

**On Tab Switch:**

```
[TabRegistry] Init initDiceTab() for tab dice
[TabRegistry] Rendered renderRandomTables() for tab dice
[TabRegistry] Rendered renderDiceHistory() for tab dice
[TabRegistry] Rendered renderDiceFavorites() for tab dice
```

**On Missing Elements:**

```
[DOM] Element not found: #mytab-container
    at $ (basic.js:9)
    at renderMyTab (mytab-render.js:5)
    ...stack trace...
[renderMyTab] Container missing - likely not on mytab
```

### Registry Validation

On startup (DEBUG_MODE only), `validateTabRegistry()` checks:

- ✅ All render functions exist
- ⚠️ All init functions exist (warning if missing)
- ⚠️ All cleanup functions exist (warning if missing)

---

## Testing

### Manual Testing Checklist

For each new tab:

- [ ] Tab button appears in navigation
- [ ] Clicking tab shows the correct view
- [ ] Initial render displays content correctly
- [ ] Switch to another tab
- [ ] Switch back - content re-renders (verify with data change)
- [ ] Check console for errors (both normal and DEBUG_MODE)
- [ ] Test on mobile viewport (responsive layout)

### Automated Testing

See `tests/e2e/tab-navigation.spec.js` for examples:

```javascript
test('switching to dice tab renders random tables', async () => {
    await page.click('[data-view="dice"]');
    const visible = await page.isVisible('.rt-card');
    expect(visible).toBe(true);
});
```

---

## Common Pitfalls

### ❌ Don't: Add renders directly to switchView()

```javascript
// BAD - defeats the purpose of the registry
function switchView(name) {
    renderTabContent(name);
    if (name === 'mytab') renderMyTab(); // ❌ Don't do this
}
```

### ✅ Do: Register in the registry

```javascript
// GOOD - centralized, maintainable
const TAB_RENDER_REGISTRY = {
    mytab: { renders: ['renderMyTab'], init: null, cleanup: null }
};
```

### ❌ Don't: Use silent failures

```javascript
// BAD - hides problems
function renderMyTab() {
    const c = $('mytab-container');
    if (!c) return; // Why is it missing? Unclear.
}
```

### ✅ Do: Add debug warnings

```javascript
// GOOD - helps debugging
function renderMyTab() {
    const c = $('mytab-container');
    if (!c) {
        if (APP_CONFIG?.DEBUG_MODE) {
            console.warn('[renderMyTab] Container missing');
        }
        return;
    }
}
```

### ❌ Don't: Render in init hook

```javascript
// BAD - init runs once, content won't refresh
'mytab': {
    renders: [],
    init: 'renderMyTab',  // ❌ Wrong place
    cleanup: null
}
```

### ✅ Do: Use renders array

```javascript
// GOOD - renders on every tab switch
'mytab': {
    renders: ['renderMyTab'],  // ✓ Correct
    init: 'initMyTab',         // One-time setup only
    cleanup: null
}
```

---

## Performance Considerations

### Render Function Performance

Render functions should be fast (<16ms for 60fps):

**Best Practices:**

- Use `requestAnimationFrame` for expensive operations
- Implement virtual scrolling for large lists (>50 items)
- Cache DOM elements with `$c()` instead of `$()`
- Avoid layout thrashing (batch DOM reads/writes)

**Example:**

```javascript
function renderMyTab() {
    const container = $('mytab-container');
    if (!container) return;

    requestAnimationFrame(() => {
        // Render in next frame to avoid blocking
        container.innerHTML = generateLargeContent();
    });
}
```

### Registry Lookup Performance

Registry lookups are O(1) and negligible (<0.1ms). No performance concerns.

---

## Advanced Patterns

### Conditional Rendering

Only render if data exists:

```javascript
function renderMyTab() {
    const container = $('mytab-container');
    if (!container) return;

    const items = D.myItems || [];
    if (items.length === 0) {
        container.innerHTML = '<div class="empty">No items yet</div>';
        return;
    }

    container.innerHTML = items
        .map(
            item => `
        <div class="item">${esc(item.name)}</div>
    `
        )
        .join('');
}
```

### Lazy Initialization

Defer expensive operations until tab is shown:

```javascript
let mapInstance = null;

function initMap() {
    if (!mapInstance) {
        console.log('[Maps] Lazy initializing map library');
        mapInstance = new MapLibrary({...});
    }
}

'maps': {
    renders: ['displayMap'],
    init: 'initMap',  // Only creates map instance once
    cleanup: null
}
```

### Cleanup Pattern

Clean up resources when leaving tab:

```javascript
let animationFrameId = null;

function startAnimation() {
    function animate() {
        // Update animation
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
}

function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

'animation': {
    renders: ['renderAnimation'],
    init: 'startAnimation',
    cleanup: 'stopAnimation'  // Stop animation when leaving
}
```

---

## Migration Guide

### Migrating Existing Tabs

If you have an existing tab that renders inconsistently:

**Step 1: Identify the render function**

Find the function that renders your tab's content. Common patterns:

- `render<TabName>()`
- `display<TabName>()`
- `update<TabName>()`

**Step 2: Check if it's in switchView()**

Look in `systems/spellslots/navigation.js`:

```javascript
if (name === 'mytab' && typeof renderMyTab === 'function') {
    renderMyTab(); // ← Found it!
}
```

**Step 3: Remove from switchView()**

Delete the manual `if` statement (the registry handles it now).

**Step 4: Add to registry**

```javascript
const TAB_RENDER_REGISTRY = {
    mytab: {
        renders: ['renderMyTab'],
        init: null,
        cleanup: null
    }
};
```

**Step 5: Test**

Switch to the tab multiple times and verify content renders correctly.

---

## Troubleshooting

### Tab Content Not Rendering

**Symptoms:** Blank tab or outdated content

**Checklist:**

1. ✓ Is tab registered in `TAB_RENDER_REGISTRY`?
2. ✓ Is render function name spelled correctly?
3. ✓ Is render function defined globally?
4. ✓ Does container element exist in HTML?
5. ✓ Check console for errors (enable DEBUG_MODE)

### Render Function Not Found Warning

```
[TabRegistry] Function renderMyTab not found for tab mytab
```

**Causes:**

- Function not defined yet (module loading order)
- Function not global (wrapped in closure)
- Typo in function name

**Fix:** Ensure function is defined globally before `init()` runs.

### Container Missing Warning

```
[DOM] Element not found: #mytab-container
[renderMyTab] Container missing
```

**Causes:**

- Container ID doesn't match between HTML and JS
- Container is conditionally rendered and not present
- HTML not loaded (check `body.html`)

**Fix:** Verify container exists in HTML with correct ID.

### Init Function Runs Multiple Times

**Symptoms:** Initialization logic runs on every tab switch

**Cause:** Function is in `renders` array instead of `init` field

**Fix:**

```javascript
// WRONG
'mytab': {
    renders: ['initMyTab', 'renderMyTab'],  // ❌ init runs every time
    init: null
}

// CORRECT
'mytab': {
    renders: ['renderMyTab'],
    init: 'initMyTab',  // ✓ init runs once
    cleanup: null
}
```

---

## API Reference

### `renderTabContent(tabName: string): void`

Executes all render functions for the specified tab.

**Parameters:**

- `tabName` - Tab identifier (e.g., 'dice', 'initiative')

**Returns:** `void`

**Side Effects:**

- Calls init function (if not already called)
- Calls all render functions in order
- Logs to console (if DEBUG_MODE enabled)
- Catches and logs errors from render functions

**Example:**

```javascript
renderTabContent('dice');
// Renders: renderRandomTables(), renderDiceHistory(), renderDiceFavorites()
```

### `validateTabRegistry(): void`

Validates the tab registry on app startup (DEBUG_MODE only).

**Returns:** `void`

**Side Effects:**

- Logs validation results to console
- Checks for missing functions
- Reports errors and warnings

**Example:**

```javascript
// Called automatically in init() when DEBUG_MODE is true
if (APP_CONFIG?.DEBUG_MODE) {
    validateTabRegistry();
}
```

---

## Related Files

- **Registry Definition:** `systems/tab-registry.js`
- **Navigation Integration:** `systems/spellslots/navigation.js`
- **Test Mocks:** `tests/setup.js`
- **E2E Tests:** `tests/e2e/tab-navigation.spec.js`
- **HTML Structure:** `assets/body.html`
- **Build Configuration:** `build.py`

---

## Version History

- **1.0.0** (2026-01-07) - Initial implementation
    - Created centralized tab registry
    - Added lifecycle hooks (init/cleanup)
    - Integrated with navigation system
    - Added debug mode validation
    - Fixed renderInitiative → renderInit mismatch

---

## Support

For questions or issues:

1. Check console with `APP_CONFIG.DEBUG_MODE = true`
2. Review this documentation
3. See `CLAUDE.md` for architecture overview
4. Check implementation plan: `D:\AI_CLI\Claude\Aktivität\plans\linked-rolling-salamander.md`
