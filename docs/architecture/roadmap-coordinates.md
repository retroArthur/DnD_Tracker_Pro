# Roadmap Coordinate System Architecture

> Extracted from `CLAUDE.md` for readability. Originally documented inline.


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
- `assets/styles/roadmap.css` - SVG and overlay layer CSS

**Future Consideration:**

For a more robust solution, consider refactoring to use SVG `<foreignObject>` elements for tiles, which would eliminate the dual coordinate system entirely.

---
