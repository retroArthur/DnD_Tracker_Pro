---
phase: 13-h-rtung-wartbarkeit
reviewed: 2026-09-06T00:00:00Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - core/config.js
  - core/constants.js
  - core/init.js
  - features/dice-stats/dice-stats-idb.js
  - features/dice-stats/dice-stats-render.js
  - features/dmscreen/dmscreen-config.js
  - features/dmscreen/dmscreen-render.js
  - features/dmscreen/dmscreen-widgets-base.js
  - features/dmscreen/dmscreen-widgets-combat.js
  - features/dmscreen/dmscreen-widgets-reference.js
  - features/initiative.js
  - features/initiative-combat-widgets.js
  - features/initiative-loot.js
  - features/soundboard/soundboard-player.js
  - features/spells/spell-manager.js
  - features/wiki/wiki.js
  - features/wiki/wiki-crud.js
  - loader.js
  - render/helpers.js
  - systems/backups.js
  - systems/entity-links.js
  - systems/file-backup/file-backup-manager.js
  - systems/spellslots/persistence.js
  - systems/tab-registry.js
  - systems/undo.js
  - tools/debug.js
  - ui/actions/system-actions.js
  - ui/actions/ui-actions.js
  - ui/editors/markdown-converter.js
  - ui/editors/rich-text.js
  - ui/editors/rich-text-insert.js
  - ui/editors/rich-text-toolbars.js
  - ui/event-delegation.js
  - utils/basic.js
  - assets/templates/view-tools.html
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-09-06
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Phase 13 is predominantly pure code movement (four oversized files split along existing
section banners: `wiki.js`, `initiative.js`, `rich-text.js`, `dmscreen-render.js`), plus a
handful of genuinely new/changed logic call outs (SEC-03 call-whitelist, SEC-04 wiki-link
escaping, execCommand→Selection/Range migration, PERF-01 undo byte-budget, PERF-02 dice-stats
IDB cap, MAINT-05 multi-start guard/lazy thunks, MAINT-06 console routing, and a genuinely new
DM-Screen widget-config feature).

Verification performed:
- Diffed every file in scope against `cc75339` to separate moved code from new logic.
- Confirmed no duplicate top-level `function`/`const`/`let`/`class` declarations were
  introduced across the newly split file groups (wiki, initiative, rich-text, dmscreen) —
  `check_duplicate_functions()`'s failure mode cannot trigger.
- Confirmed all `data-action="call"` targets found in templates and JS-generated markup
  (147 unique values) are present in `CALL_ACTION_WHITELIST` — SEC-03 has no dead call sites.
- Confirmed `utf8ByteLength()` is correct for surrogate pairs and lone surrogates (matches the
  documented `Blob`/`TextEncoder` replacement-character semantics).
- Confirmed `parseWikiLinks()` escapes the same value used for both the `data-value` attribute
  and the visible text node (SEC-04 fix is complete, not partial).
- Confirmed the underscore-emphasis CommonMark word-boundary fix in `markdown-converter.js`
  actually changes behavior for a real case (`foo_bar_baz` no longer corrupts), and that the
  removed `hasHtmlTags` guard was provably dead code in the pre-phase version (computed, never
  read) — its removal is a no-op.
- Ran an actual `python build.py` and inspected the generated bundle to confirm a
  build-time-only theory (whether stripped `const D = window.D;` bindings inside functions
  break at runtime) does **not** manifest — `window.D` properties resolve as bare globals via
  the global object regardless, so the dedup pass's removal of the redundant local binding is
  harmless. No finding filed for this.

Two real Warnings surfaced from the genuinely-new logic (not from the relocated code), detailed
below. One of the Info items is a pre-existing bug that predates this phase (confirmed via
`git show cc75339`) and is included only because it sits directly inside the surface this phase
extended.

## Warnings

### WR-01: `insert-link` toolbar action can silently insert an invisible, empty `<a>` instead of a visible link

**File:** `ui/actions/system-actions.js:75-94`
**Issue:** This is one of the three `execCommand` call sites this phase migrated away from
(previously `document.execCommand('createLink', false, url)` at the same line, see
`git show cc75339:ui/actions/system-actions.js` line 79). The old `execCommand('createLink')`
handled a **collapsed** selection (cursor placed but no text highlighted) by inserting a new
`<a>` element whose visible text is the URL itself — this is standard native browser behavior
for `createLink` with no selected text.

The replacement calls `window.wrapRangeWithElement(range, anchor)`
(`ui/editors/rich-text.js:27-35`), which tries `range.surroundContents(wrapper)` and falls back
to `extractContents()` + `insertNode()` only on a thrown exception. For a **collapsed** range,
`surroundContents()` does not throw — it succeeds trivially, wrapping zero content and inserting
an **empty** `<a href="...">` at the cursor position. The user sees nothing happen (no visible
link text), even though an anchor tag was in fact inserted into the document.

Compare this to the *floating* toolbar's own `link` action
(`ui/editors/rich-text-toolbars.js:170-185`, inside `applyFloatingFormat()`), which is guarded
by `if (!selectedText) return;` a few lines earlier in the same function — that path correctly
refuses to act on an empty selection. The static-toolbar `insert-link` action in
`system-actions.js` has no equivalent guard.

Additionally, `editor.focus()` is called but the code never verifies the *current* selection
actually lives inside `editor` before calling `wrapRangeWithElement`. If the user had text
selected elsewhere on the page (e.g. in an unrelated input or paragraph) and then clicks
"insert link" without first clicking into the target editor, the stale `window.getSelection()`
range may still point outside the editor, and `wrapRangeWithElement` would wrap that unrelated
DOM content in an anchor tag instead.

**Fix:**
```javascript
'insert-link': ctx => {
    const editorId = ctx.target.dataset.editor;
    const editor = $(editorId);
    if (!editor) return;
    editor.focus();
    const url = prompt('Link URL eingeben:');
    if (!url) return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !selection.toString()) {
        showToast('⚠️ Bitte erst Text markieren', 'warning');
        return;
    }
    const range = selection.getRangeAt(0);
    // Guard against a stale selection living outside the target editor
    const container = range.commonAncestorContainer;
    const inEditor = (container.nodeType === Node.TEXT_NODE ? container.parentElement : container)
        ?.closest?.('#' + editorId);
    if (!inEditor) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    if (typeof window.wrapRangeWithElement === 'function') {
        window.wrapRangeWithElement(range, anchor);
        showToast('🔗 Link eingefügt');
    }
},
```

---

### WR-02: MAINT-06 console migration removed the last-resort visibility for dispatch failures and gated security-relevant block events behind `DEBUG_MODE`

**File:** `ui/event-delegation.js:104-115, 118-152, 166-212`; `ui/actions/ui-actions.js:186-207`
**Issue:** Confirmed via diff against `cc75339` — this is new-in-phase behavior, not moved code.

1. In `_handleClick`, `_handleChange`, and `_handleInput`, the old code was:
   ```javascript
   } catch (actionError) {
       if (typeof ErrorHandler !== 'undefined') {
           ErrorHandler.log('EventDelegation', actionError, `Action: ${action}`);
       } else {
           console.error(`[EventDelegation] Fehler in Action "${action}":`, actionError);
       }
   }
   ```
   The `else console.error(...)` fallback branch was deleted entirely (three separate
   occurrences). If `ErrorHandler` is ever undefined at the point an action handler throws
   (e.g. a future refactor breaks `render/helpers.js`'s load order, or a partial script-load
   failure), the error is now swallowed with **zero** console output and zero log entry —
   previously guaranteed visibility is gone.

2. The whitelist-rejection paths for `onChange`/`onInput` handlers changed from an
   unconditional `console.warn(...)` to a `window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler`
   gated call (`ui/event-delegation.js:144-152, 192-200`). The same pattern applies to the new
   `call` action's whitelist rejection and "function not found" paths in
   `ui/actions/ui-actions.js:186-207` (previously an unconditional
   `console.error('[EventDelegation] Function not found:', ctx.value)`).

   In a production build (`APP_CONFIG.DEBUG_MODE = false`), a blocked unauthorized
   `data-on-change`/`data-on-input` handler or a rejected `call` target (exactly the SEC-03
   guard this phase added) now produces **no** console output and **no** log entry anywhere.
   Previously such blocks were always visible in the console regardless of debug mode, which
   served as a lightweight audit trail for anomalous/blocked dispatch attempts. This is a
   genuine reduction in diagnosability for the very code path meant to harden the app.

**Fix:** Keep the whitelist-rejection and "not found" logging unconditional (or at least route
it through `ErrorHandler.log()` unconditionally — `ErrorHandler.log()` already writes to
`console.error` via `this._consoleLog` independent of `DEBUG_MODE`, see
`render/helpers.js:37-39` — the extra `APP_CONFIG?.DEBUG_MODE &&` guard added here is
redundant with, and stricter than, `ErrorHandler.log()`'s own gating). Restore the
`else console.error(...)` fallback in the three `EventDelegation` handlers so a missing/failed
`ErrorHandler` cannot make action-dispatch errors disappear silently:
```javascript
} catch (actionError) {
    if (typeof ErrorHandler !== 'undefined') {
        ErrorHandler.log('EventDelegation', actionError, `Action: ${action}`);
    } else {
        console.error(`[EventDelegation] Fehler in Action "${action}":`, actionError);
    }
}
```

## Info

### IN-01: `dms-toggle-widget` checkbox double-fires (click + change) — pre-existing, predates Phase 13

**File:** `features/dmscreen/dmscreen-render.js:470-472, 508-514`; `features/dmscreen/dmscreen-config.js:169-172`
**Issue:** The widget-visibility checkbox rendered by `renderDMSConfigList()` carries
`data-action="dms-toggle-widget"` directly on the `<input type="checkbox">`. A single click
fires **both** a `click` event (caught by the delegated `document.addEventListener('click', …)`
switch in `dmscreen-render.js`, which calls `toggleDMSWidget()`) **and**, via the checkbox's own
activation behavior, a `change` event (caught by a second, dedicated
`document.addEventListener('change', …)` listener a few lines below, which calls
`toggleDMSWidget()` again). The visibility flag gets toggled twice per click and nets back to
its original value — clicking the checkbox appears to do nothing.
Confirmed via `git show cc75339:features/dmscreen/dmscreen-render.js` that this exact
click+change dual-registration already existed before this phase; it is not something Phase 13
introduced. Flagged at Info level only because this phase's new `dms-add-widget-type` checkboxes
(the "not yet added" widget list) deliberately avoid the same trap by using a distinct action
name with only a `click` handler — worth fixing the older `dms-toggle-widget` checkboxes to
match that pattern in a future pass.
**Fix:** Remove either the `click`-switch case `'dms-toggle-widget'` or the dedicated `change`
listener at the bottom of `dmscreen-render.js` — keep only one.

### IN-02: `console.table()` left un-migrated in a devtools-only helper

**File:** `systems/backups.js:415`
**Issue:** `getPerformanceReport()` still calls `console.table(report.entities)` directly,
inconsistent with the "single sanctioned `ErrorHandler.log()` outlet" goal of MAINT-06 (the two
`console.log()` calls immediately following it in the same function were converted). This is
low-risk: the function is not called anywhere else in the codebase and exists purely to be
invoked manually from browser devtools by a developer, where a formatted table is the whole
point — but it is technically a residual raw console call.
**Fix:** No action needed if this function is intentionally devtools-only; otherwise route
through `ErrorHandler.log()` for consistency.

### IN-03: `format-text` action's local variable names are swapped relative to their content (pre-existing, predates Phase 13)

**File:** `ui/actions/system-actions.js:37-41`
**Issue:** `const cmd = ctx.target.dataset.cmd || ctx.value; const editorId = ctx.target.dataset.editor; formatText(cmd, editorId);` — despite the variable names, `dataset.cmd` actually holds
the editor element id (e.g. `"loc-desc"`) and `dataset.editor` actually holds the format command
(e.g. `"bold"`), matching `formatText(elementId, format)`'s real signature
(`ui/editors/rich-text.js:146`). The call is *functionally correct* — confirmed against the HTML
templates' `data-cmd="loc-desc" data-editor="bold"` attribute pairs — but the local variable
names are backwards from what they hold, which reads as a parameter-order bug on first inspection.
Confirmed identical in `git show cc75339:ui/actions/system-actions.js` — this predates Phase 13
and was only relocated/untouched by this phase's diff.
**Fix:** Rename the local variables (`cmd` → `editorId`, `editorId` → `cmd`) to match their
actual content; no behavior change needed.

---

_Reviewed: 2026-09-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
