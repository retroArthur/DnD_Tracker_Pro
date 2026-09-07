# Phase 13: Härtung & Wartbarkeit - Pattern Map

**Mapped:** 2026-09-06
**Files analyzed:** ~20 modified-file groups (10 requirements; MAINT-01 alone touches 4 source files → ~11-14 new files)
**Analogs found:** all groups matched (this is a hardening phase — nearly every target is a *modification*, not a new file; analogs are for the *shape* of the change, not a file to scaffold from)

## File Classification

| Target File (modified unless noted) | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `ui/editors/rich-text.js` → split into 3 (spell-mgmt/editor-formatting/toolbars) | component (editor) | request-response (DOM edit) | `features/npcs/` split family (`npc-render.js`, `npc-crud.js`, `npc-dialogs.js`, `npc-interactions.js`, `npc-popup.js`) | exact (established multi-file split-with-globals convention) |
| `features/initiative.js` → split (combat-widgets file + loot-system file, ≥2 files) | component/controller | request-response + CRUD | `features/party/` split family (`party-render.js`, `party-crud.js`, `party-details.js`) | exact |
| `features/dmscreen/dmscreen-render.js` → split into 3-4 (registry/base-widgets + 2-3 reference-widget-group files) | component | request-response | `systems/spellslots/` split family (11 files, registry-style `spell-slots-core.js` + feature files) | exact — closest to dmscreen's "one registry + many independent renderer groups" shape |
| `features/wiki/wiki.js` → split into 2 (`wiki-render.js`, `wiki-crud.js`) | component | CRUD + request-response | `features/party/` split (`party-render.js` / `party-crud.js` naming convention) | exact |
| `loader.js` (MODULES array edits, once per split file) | config | — | `loader.js` itself (existing `party/`, `npcs/`, `spellslots/` entries) | exact |
| `ui/actions/ui-actions.js` (`call` action → whitelist, SEC-03) | middleware (action dispatch) | event-driven | same file, existing `ACTIONS` map entries | exact |
| `core/constants.js` (new `CALL_ACTION_WHITELIST` constant, SEC-03/D-14) | config | — | existing constant declarations (`CATS`, `TAG_COLORS`, etc.) + `DND_RULES`/`UI_CONSTANTS` namespace export block | exact |
| `features/wiki/wiki.js` `parseWikiLinks()` (SEC-04, escaping) | utility (transform) | transform | same function, existing `esc()` calls elsewhere in `wiki.js` | exact |
| `systems/spellslots/persistence.js` (`saveImmediate()`, `save()` — PERF-01/D-08 byte-size) | service | CRUD (persistence) | same file, both call sites | exact |
| `systems/undo.js` (`pushUndo()` — PERF-01/D-09 dedupe + byte-budget) | service | event-driven | same file | exact |
| `features/dice-stats/dice-stats-idb.js` (PERF-02/D-11 cap + delete, D-12 cursor aggregate) | service (IndexedDB) | CRUD + streaming (cursor) | same file's `getStatsForSession()` (index-based query) | exact — already shows the index/cursor pattern to extend |
| `features/dice-stats/dice-stats-render.js:233` (switch `getAllStats()` → aggregate path) | component | streaming | `dice-stats-idb.js` `getStatsForSession()` caller pattern | role-match |
| `ui/editors/markdown-converter.js` (MAINT-03, `hasHtmlTags` removal + underscore word-boundary regex) | utility (transform) | transform | same file, adjacent `*`-emphasis regex line (276, unchanged sibling) | exact |
| `systems/entity-links.js:87`, `features/wiki/wiki.js:831`, `ui/actions/system-actions.js:82` (MAINT-04, `execCommand` → Phase-9 helpers) | utility call sites | event-driven (DOM edit) | `ui/editors/rich-text.js` `insertTextAtSelection()` / `wrapRangeWithElement()` (already-migrated call sites within same file) | exact |
| `systems/tab-registry.js` (MAINT-05, string renders → function refs) | config/registry | request-response | same file, current `renders: ['renderX']` entries | exact |
| `systems/backups.js` (`initPerformanceMonitoring()` — MAINT-05 guard parity) | service | event-driven | same file, `startAutoBackup()` (lines 306-308) | exact |
| ~89 `console.*` call sites project-wide (MAINT-06) | cross-cutting | — | existing `ErrorHandler.log()` + `APP_CONFIG.DEBUG_MODE` guarded call sites already in codebase | exact |
| `systems/file-backup/file-backup-manager.js:6,674` (MAINT-06 header comments) | doc/comment | — | `systems/spellslots/persistence.js:14-18` (`registerPostSaveHook` real impl) | exact |
| `soundboard-player.js:145` (MAINT-02 shadowing fix) | utility | — | n/a (rename-only, no analog needed) | trivial |
| `tests/unit/wiki-links.test.js` (new) | test | transform | `tests/unit/dice-stats.test.js` (pure-logic inline-reimplementation test style, no DOM/IDB) | role-match |
| `tests/unit/event-delegation.test.js` (new) | test | event-driven | `tests/unit/dice-stats.test.js` style (inline logic) + `ui/event-delegation.js`/`ui/actions/ui-actions.js` as subject | partial (no existing event-delegation test to copy from) |
| `tests/unit/dice-stats-idb.test.js` (new) | test | streaming (IndexedDB) | `tests/unit/file-backup-idb.test.js` (`createMockIDB`-adjacent hand-rolled IDB mock against a real source module via `vm`) | exact |
| `tests/unit/dmscreen-characterization.test.js` (new, D-04 snapshot net) | test | request-response (snapshot) | `tests/unit/stability.test.js` (characterization-style test against existing render output, per D-04's own citation) | role-match |
| `tests/unit/backups.test.js` (new, MAINT-05 guard regression) | test | event-driven | `tests/unit/file-backup.test.js` (interval/guard-adjacent service test in same `systems/` family) | role-match |

## Pattern Assignments

### MAINT-01: Module splits — the established convention

**Analog:** `features/npcs/` (5 files) and `features/party/` (3 files), registered in `loader.js:60-71`

**loader.js registration pattern** (`loader.js:60-71`):
```javascript
'features/party/party-render.js',
'features/party/party-details.js',
'features/party/party-crud.js',
// ...
'features/npcs/npc-render.js',
'features/npcs/npc-interactions.js',
'features/npcs/npc-dialogs.js',
'features/npcs/npc-crud.js',
'features/npcs/npc-popup.js',
```
Order matters (dependency order) — the "render" file that defines shared state (`selectedNpcId`, filters) loads before files that call into it.

**Section banner → file boundary** (`features/npcs/npc-render.js:1-4`, `features/npcs/npc-crud.js:1-4`):
```javascript
// [SECTION:NPC_RENDER]
// ============================================================
// NPC RENDER - @master-detail @filter @icons
// ============================================================
```
Each split file keeps its own `// [SECTION:X]` banner as the file's own header — directly reusable for the four MAINT-01 targets since D-02 already mandates cutting along existing banners.

**Cross-file call convention (non-ESM, global scope)** — no imports; functions call each other as bare globals since everything loads into `window`/global scope in `loader.js` order. Shared per-module state (e.g. `selectedNpcId` in `npc-render.js:6`) stays in the file that "owns" it and is read directly by other split files as a bare identifier (not `window.X`) because they share the lexical/global scope post-concatenation.

**Exports block convention** (`features/npcs/npc-render.js` tail, `features/npcs/npc-crud.js` tail):
```javascript
// ============================================================
// EXPORTS FOR GLOBAL ACCESS
// ============================================================
window.selectedNpcId = selectedNpcId;
window.renderNPCList = renderNPCList;
window.selectNPC = selectNPC;
// ...
```
Every split file ends with an explicit `window.X = X` export block — **only for functions/vars used by other modules or HTML `data-action` handlers** (per CLAUDE.md's "Export Audit Rule"). Apply this same tail-block convention to each of the ~11-14 new split files. This is also where D-06's "expected stumbling block" applies: a function accidentally left in both the old and new file will trip `check_duplicate_functions()` at build time — run `python build.py` after each individual move, not once at the end (Pitfall 4 in RESEARCH.md).

**For `dmscreen-render.js` specifically:** closest shape is `systems/spellslots/` (11 files, one clear "core"/registry file plus many independent feature files) rather than `npcs`/`party` (state-and-CRUD split). `dmscreen-render.js`'s own `WIDGET DEFINITIONS` registry section (`getDMScreenWidgets()`, lines 638-782) is the "core" file; the 21 widget renderers split into 2-3 grouped files as RESEARCH.md's own grouping proposal (combat-related / character-related / environment-misc) — group by rendered content, not alphabetically.

---

### SEC-03: `call` action whitelist (D-14)

**Analog:** same file `ui/actions/ui-actions.js`, current `ACTIONS.call` entry (lines 186-190)

**Current (unsafe) pattern:**
```javascript
call: ctx => {
    const fn = window[ctx.value];
    if (typeof fn === 'function') fn(ctx.id);
    else console.error('[EventDelegation] Function not found:', ctx.value);
},
```

**Constant declaration analog** (`core/constants.js:10` style, e.g. `const CATS = {...}`) — declare `CALL_ACTION_WHITELIST` the same way as other top-level `const` tables in `core/constants.js`, then fold it into the `DND_RULES`/`UI_CONSTANTS` namespace export block (`core/constants.js:559-592`) per project convention — this is a UI/app-level constant so it belongs under `UI_CONSTANTS`, not `DND_RULES` (which is reserved for D&D rules data).

**Fix pattern (from RESEARCH.md Code Examples, already verified against source):**
```javascript
const CALL_ACTION_WHITELIST = new Set([ /* 131 grep-derived names */ ]);
call: ctx => {
    if (!CALL_ACTION_WHITELIST.has(ctx.value)) {
        if (window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler) {
            window.ErrorHandler.log('EventDelegation', new Error('Blocked non-whitelisted call target'), ctx.value);
        }
        return;
    }
    const fn = window[ctx.value];
    if (typeof fn === 'function') fn(ctx.id);
},
```
Error-path pattern (`console.error` → `ErrorHandler.log` behind `DEBUG_MODE`) is the same MAINT-06 shared pattern — see below.

---

### SEC-04: `parseWikiLinks()` escaping

**Analog:** same file `features/wiki/wiki.js`, existing `esc()` usage elsewhere in the file (search `esc(` in `wiki.js` render sections for the established call convention: `esc(userValue)` wrapping any interpolated user string).

**Current (partial) pattern** (`features/wiki/wiki.js:648-654`):
```javascript
function parseWikiLinks(content) {
    const D = window.D;
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
        const exists = D.wiki?.some(e => e.title.toLowerCase() === linkText.toLowerCase());
        const escapedText = linkText.replace(/"/g, '&quot;');
        return `<span class="wiki-link ${exists ? '' : 'missing'}" data-action="wiki-link-click-stop" data-value="${escapedText}" data-exists="${exists}">${linkText}</span>`;
    });
}
```
Fix: both `escapedText` (attribute) and the raw `linkText` in the text node must go through `esc()` (from `utils/basic.js`), replacing the manual `"`-only replace. The dependency comment at `wiki.js:432-434` documenting reliance on upstream `sanitizeHTML()` must be updated to reflect that this call site is now self-sufficient.

---

### PERF-01: Save/undo byte-size (D-08, D-09)

**Analog:** same file, both call sites — `systems/spellslots/persistence.js:42` (`saveImmediate`) and `:205` (`save`)

**Current pattern (both sites):** `const dataSizeMB = new Blob([dataString]).size / (1024 * 1024);`

**Replacement (RESEARCH.md `[ASSUMED]`, needs own test coverage before replacing the proven `Blob` path):**
```javascript
function utf8ByteLength(str) {
    let bytes = 0;
    for (let i = 0; i < str.length; i++) {
        const code = str.codePointAt(i);
        if (code > 0xffff) i++;
        if (code < 0x80) bytes += 1;
        else if (code < 0x800) bytes += 2;
        else if (code < 0x10000) bytes += 3;
        else bytes += 4;
    }
    return bytes;
}
```
Apply identically at both call sites — must not shift `_notifyPostSaveHooks()` call order (per CONTEXT.md integration note).

**Undo dedupe/budget analog:** `systems/undo.js:17` already serializes via `JSON.stringify(D)` inside `pushUndo()` — the dedupe check is a plain string comparison against `undoStack[undoStack.length-1].state`, no new dependency (Don't Hand-Roll table confirms: reuse the string already being produced, don't add a deep-equal library).

---

### PERF-02: Dice-stats cap + cursor aggregate (D-11, D-12)

**Analog:** `features/dice-stats/dice-stats-idb.js`, existing `getStatsForSession()` (lines 54-70) — the only function in the file that already uses an IndexedDB index instead of a full-store scan.

```javascript
// Source: features/dice-stats/dice-stats-idb.js:54-70 (existing, verified)
async function getStatsForSession(sessionId) {
    if (!window.initIndexedDB) return [];
    await window.initIndexedDB();
    return new Promise(function(resolve) {
        if (!window.idb) { resolve([]); return; }
        try {
            var tx = window.idb.transaction(['diceStats'], 'readonly');
            var store = tx.objectStore('diceStats');
            var index = store.index('sessionId');
            var req = index.getAll(sessionId);
            req.onsuccess = function() { resolve(req.result || []); };
            req.onerror = function() { resolve([]); };
        } catch (e) { resolve([]); }
    });
}
```
The new cursor-based aggregate function (consumed only by `dice-stats-render.js:233`) should follow this exact transaction/store-open/try-catch shape but use `store.openCursor()` and accumulate counters instead of `getAll()`. `getAllStats()` itself stays unchanged (D-12 — `audio-export.js:202,229` keeps using it for full-fidelity export).

**Cap+evict (D-11):** no existing "evict oldest" code in this store today — nearest analog for "cap + evict oldest" logic in this codebase is the undo stack's `UNDO_LIMIT` eviction in `systems/undo.js` (fixed-size array, shift-oldest-when-full). Apply the same shape to `statsIdbPut()`: check count via cursor/count before insert, delete oldest key(s) if over cap.

---

### MAINT-03: Markdown underscore guard (D-13)

**Analog:** same file `ui/editors/markdown-converter.js`, adjacent line 276 (`*`-emphasis regex, which is NOT changed) shows the sibling pattern to preserve while only the `_`-lines get word-boundary guards.

```javascript
// Current, lines 271 & 275 (VERIFIED)
result = result.replace(/__([^_]+)__/g, '<b>$1</b>');
result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>');
```
Fix: replace `(?<!_)`/`(?!_)` with word-boundary lookarounds (`(?<![\w])`/`(?![\w])`) on both lines; delete `hasHtmlTags` (line 264) entirely — it is computed but never read (verified `markdown-converter.js:258-290`).

---

### MAINT-04: execCommand replacement

**Analog:** `ui/editors/rich-text.js` itself — the Phase-9 helper functions are already defined and already called elsewhere in the same file; the three remaining external call sites just need to call the same helpers instead of `document.execCommand`.

- `systems/entity-links.js:87` (insertText case) → `insertTextAtSelection()`
- `features/wiki/wiki.js:831` (insertText case) → `insertTextAtSelection()`
- `ui/actions/system-actions.js:82` (createLink case) → `wrapRangeWithElement()`

No new pattern — CLAUDE.md's "execCommand-Ablösung" section names the exact same four helper functions already in production use.

---

### MAINT-05: Tab registry + interval guard

**Tab registry analog:** `systems/tab-registry.js`'s own current entries, e.g. `renders: ['renderDashboard']` — convert string names to direct function references (`renders: [renderDashboard]`) throughout the same file, same array shape.

**Interval guard analog** (`systems/backups.js:306-308`, existing correct pattern):
```javascript
let backupInterval = null;
function startAutoBackup() {
    if (backupInterval) clearInterval(backupInterval);
    backupInterval = window.setInterval(createAutoBackup, BACKUP_INTERVAL);
    setTimeout(createAutoBackup, 60000);
}
```
Apply identically to `initPerformanceMonitoring()` (`systems/backups.js:321-330`, currently missing the guard) — same file, same module, copy the guard variable + `if (x) clearInterval(x)` shape verbatim.

---

### MAINT-06: Console hygiene + header comments

**Analog:** any already-migrated call site using `ErrorHandler.log()` behind `APP_CONFIG.DEBUG_MODE` (pattern documented in CLAUDE.md "Problem 1: Production Console Pollution" from the Jan-2026 refactor — search codebase for `if (APP_CONFIG.DEBUG_MODE) { ErrorHandler.log(...)` for a live call-site example to copy the exact guard shape from).

**Header-comment fix analog:** `systems/spellslots/persistence.js:14-18` — the real, correct `registerPostSaveHook()` implementation. `file-backup-manager.js:6` and `:674` describe the old (wrong) `window.save`-wrapping approach and must be rewritten to describe `registerPostSaveHook()` instead, matching what `file-backup-manager.js:685-686` already does in code (`window.registerPostSaveHook(onAfterSave)`).

---

## Shared Patterns

### Non-ESM cross-module calls (applies to all MAINT-01 splits)
**Source:** `loader.js` (module concatenation order), `features/npcs/`, `features/party/`, `systems/spellslots/`
**Apply to:** every new split file
No `import`/`export` — functions are bare globals after concatenation. New split files call sibling-file functions directly by name (not `window.name`) since they share global scope post-build; only functions consumed by *other feature areas* or by `data-action` HTML handlers get an explicit `window.fn = fn` in the file's own tail export block. Never `var X = window.X` for a `const`/`let`-declared global (CLAUDE.md "const/var Conflict" gotcha) — this is directly relevant since split files may be tempted to "import" siblings this way.

### Build-time duplicate-declaration gate (D-06)
**Source:** `build.py`'s `check_duplicate_functions()`, documented in CLAUDE.md "Build System & Deduplication"
**Apply to:** all four MAINT-01 splits
Run `python build.py` after each individual function move, not once at the end of a file's split — a function left in both old and new file aborts the build with `[FEHLER] Doppelte Top-Level-Deklaration '<name>': <a> und <b>`. This is the intended safety net (D-06), not a bug to work around.

### `saveUndoState()` before destructive operations
**Source:** CLAUDE.md "Conventions" + `systems/undo.js:41-43` (`saveUndoState` is a thin alias for `pushUndo`)
**Apply to:** PERF-01 work must not remove or reorder existing `pushUndo`/`saveUndoState` call sites — only change what happens *inside* `pushUndo()` (dedupe, byte-budget). Note the RESEARCH.md correction: grep for **both** `saveUndoState(` and `pushUndo(` when auditing call sites — they are aliases, and `features/initiative.js` has 2 real call sites (lines 374, 1565) despite an earlier claim of zero.

### `ErrorHandler.log()` behind `APP_CONFIG.DEBUG_MODE`
**Source:** CLAUDE.md "Problem 1", applies project-wide
**Apply to:** SEC-03's new error path, and all ~89 MAINT-06 `console.*` call sites
```javascript
if (APP_CONFIG.DEBUG_MODE) {
    ErrorHandler.log('contextName', err, 'Additional context');
}
```

### IndexedDB mock for unit tests
**Source:** `tests/unit/file-backup-idb.test.js` (hand-rolled mock loaded via `vm` against the real source file) and `tests/unit/soundboard.test.js:150` (`createMockIDB(seedRecords)` factory)
**Apply to:** `tests/unit/dice-stats-idb.test.js`
```javascript
// Source: tests/unit/soundboard.test.js:150-218 (verified, read this session)
function createMockIDB(seedRecords) {
    const mockStore = {};
    (seedRecords || []).forEach(function (r) { mockStore[r.id] = Object.assign({}, r); });
    function transaction() { /* objectStore().get/getAll/put with async onsuccess via Promise.resolve().then(...) */ }
    return { idbInstance: { transaction } };
}
function setupMockIDB(seedRecords) {
    const mock = createMockIDB(seedRecords);
    global.window.idb = mock.idbInstance;
    global.window.initIndexedDB = function () {
        global.window.idb = mock.idbInstance;
        return Promise.resolve();
    };
    return mock;
}
```
Do NOT introduce `fake-indexeddb` (not in `package.json`; Don't Hand-Roll table explicitly rejects it) — reuse this exact factory shape, extended with a `count()`/cursor stub for the new cap-check and aggregate-cursor code paths.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `tests/unit/event-delegation.test.js` | test | event-driven | No existing test exercises `ui/event-delegation.js` or `ui/actions/*.js` directly; closest shape is `tests/unit/dice-stats.test.js`'s "inline pure-logic reimplementation, no DOM" style — but event delegation is inherently DOM-dependent (`ctx.value`, `data-action` attributes), so the plan should decide between a `vm`-loaded real-module test (`file-backup-idb.test.js` style) or a jsdom-based test, not a pure-logic reimplementation. |
| `tests/unit/dmscreen-characterization.test.js` | test | request-response (snapshot) | No dedicated DM-Screen test file exists (D-04's own finding — 2 incidental mentions across `migration-wizard.test.js`/`stability.test.js`, no real coverage). `tests/unit/stability.test.js` is the closest precedent for "characterize existing render output before refactor" but was not itself written against `dmscreen-render.js`; treat RESEARCH.md's D-04 section as the primary spec instead of a copyable test file. |

## Metadata

**Analog search scope:** `features/npcs/`, `features/party/`, `systems/spellslots/`, `core/constants.js`, `systems/backups.js`, `systems/undo.js`, `systems/spellslots/persistence.js`, `ui/actions/`, `ui/editors/`, `tests/unit/` (dice-stats, file-backup, file-backup-idb, soundboard, stability)
**Files scanned:** ~35
**Pattern extraction date:** 2026-09-06
