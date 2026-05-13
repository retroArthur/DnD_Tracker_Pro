# Duplicate Declaration Debugging Pattern

> Extracted from `CLAUDE.md` for readability. Originally documented inline.


**Critical Learnings from Production Incidents:**

This section documents duplicate declaration bugs discovered in production builds and patterns to prevent them.

**Problem #1: Function-Scoped `const` Window Imports**

**What Happened:**
```javascript
// npc-interactions.js:9 (INSIDE a function)
function toggleNPCCard(cardOrId) {
    const selectNPC = window.selectNPC;  // ❌ CONFLICT
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
    const save = window.save;  // ❌ Will conflict when concatenated
    save();
}

// ALWAYS: Direct window access
function myFunction() {
    if (typeof window.save === 'function') {  // ✅ Safe
        window.save();
    }
}

// OR: Module-level var (deduplicated)
var save = window.save;  // ✅ At top of file
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
    selectNPC(id);  // Simple wrapper
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
function processEntity(id) { /* simple version */ }

// File B
function processEntity(id) { /* full version */ }

// ✅ ALWAYS: One canonical implementation
// File A: features/entities/entity-core.js
function processEntity(id) {
    // Full, comprehensive implementation
}

// File B: Use the canonical version
function handleEntity(id) {
    window.processEntity(id);  // Call the global function
}

// ✅ OR: Different names for different purposes
function processEntitySimple(id) { /* ... */ }
function processEntityFull(id) { /* ... */ }
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
