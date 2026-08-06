---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
reviewed: 2026-07-25T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - core/constants.js
  - features/reise/reise-crud.js
  - tests/e2e/features/editor-floating.spec.js
  - tests/e2e/features/editor-formatting.spec.js
  - tests/e2e/features/editor-insert.spec.js
  - tests/e2e/features/editor-smoke.spec.js
  - tests/e2e/features/wiki.spec.js
  - tests/unit/welt-story.test.js
  - ui/editors/rich-text.js
findings:
  critical: 2
  warning: 2
  info: 1
  total: 5
status: issues_found
---

# Phase 09: Code Review Report

**Reviewed:** 2026-07-25
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

The execCommand→Selection/Range migration in `ui/editors/rich-text.js` is unusually well
documented and the accompanying 5-file Playwright regression net (`editor-smoke`,
`editor-formatting`, `editor-floating`, `editor-insert`) verifies byte-for-byte markup parity
against the pre-migration baseline for every editor it exercises. The `reise-crud.js` NaN-safe
threshold-0 fix and the `core/constants.js` `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` restoration are
both correct in isolation and covered by tests.

However, two concrete, previously-unflagged bugs were found by tracing the new code against
call sites that are *not* covered by the new test suite:

1. The `reise-crud.js` fix for "threshold 0 must mean 'never'" was applied only inside
   `rollBegegnung()`. Its only real caller, `startReise()`, still normalizes a `0` input value
   to `1` one line earlier with the exact `|| 1` pattern the fix was written to eliminate — so
   the bug this phase claims to have fixed is still reachable through the UI.
2. The migration introduced new "already-formatted?" detection logic (`applyInlineFormat`,
   `toggleUnorderedListAtSelection`, `applyFontFamilyToSelection`, `applyFontSizeToSelection`)
   that gates on a hardcoded editor-class allowlist (`.rich-editor, .spell-editor,
   .dialog-text`). The Character Notes editor (`#char-notes`, class `.cf-notes-editor`, Party
   tab) is the one contenteditable editor in the whole app that is *not* in that allowlist, even
   though it has its own static Bold/Italic/Underline/Strikethrough/List toolbar and a font
   picker wired to exactly these new functions. Toggling Bold/Italic/etc. off, or reapplying a
   font, no longer works there — it nests instead. This editor is absent from all five new spec
   files, so the regression net the phase built does not catch its own gap.

Both are logic-error regressions in shipped, commonly used functionality, not in the
already-accepted/tracked items (paste double-registration, on*-attribute XSS gap in the table
paste branch, `<s>`/`<strike>` sanitize drift — all correctly left alone here).

## Critical Issues

### CR-01: `startReise()` still collapses threshold `0` to `1`, defeating the just-applied fix

**File:** `features/reise/reise-crud.js:145` (read) and `:162` (call site)

**Issue:** `rollBegegnung()` was correctly patched to treat an explicit `threshold=0` as "never
trigger an encounter" (`isNaN(thParsed) ? 1 : thParsed`, `features/reise/reise-crud.js:104-105`).
But `startReise()` — the only production caller of `rollBegegnung()`, invoked once per travel
day (line 162) — reads the DM's UI input one line above with:

```js
var threshold = parseInt(thresholdEl ? thresholdEl.value : 1, 10) || 1;
```

`parseInt('0', 10)` is `0`, and `0 || 1` evaluates to `1` (0 is falsy) — so a DM who sets the
"Begegnungs-Schwellenwert" field to `0` (intending "no random encounters this trip") has that
value silently rewritten to `1` *before* `rollBegegnung()` ever sees it. `rollBegegnung()`'s
NaN-safe handling of `threshold===0` is therefore unreachable from the real UI flow — the exact
defect the fix was meant to close is still present, just one call frame further out. This is not
covered by any test: `tests/unit/welt-story.test.js` only exercises the already-fixed
`rollBegegnungInline()`/`rollBegegnung()` logic directly, never `startReise()`'s own value
parsing, and there is no e2e spec for the Reise feature in this phase's file list.

**Fix:**
```js
// features/reise/reise-crud.js — startReise()
var thresholdParsed = parseInt(thresholdEl ? thresholdEl.value : 1, 10);
var threshold = isNaN(thresholdParsed) ? 1 : thresholdParsed;
```
(Mirrors the exact pattern already used inside `rollBegegnung()` — consider extracting a shared
`parseIntOrDefault(value, fallback)` helper so the two call sites can't drift again.)

### CR-02: New font/format "already-applied" detection breaks Bold/Italic/List/Font toggling in the Character Notes editor

**File:** `ui/editors/rich-text.js:363` (`applyInlineFormat`), `:381`
(`toggleUnorderedListAtSelection`), `:519` (`applyFontFamilyToSelection`), `:539`
(`applyFontSizeToSelection`)

**Issue:** These four functions are new in this phase (replacing
`execCommand('bold'|'italic'|'underline'|'strikeThrough'|'insertUnorderedList'|'fontName'|
'fontSize')`). Each decides whether to *unwrap* an existing format (toggle off / merge) or
*wrap* a new one by checking:

```js
if (parentTag && parentTag.closest('.rich-editor, .spell-editor, .dialog-text')) { /* unwrap */ }
else { /* always wrap again */ }
```

`assets/templates/view-party.html:591` defines the Character Notes editor as
`<div id="char-notes" class="cf-notes-editor" contenteditable="true">` — the *only*
contenteditable editor in the codebase (confirmed via
`grep -rn 'contenteditable="true"' assets/templates/`) that carries none of
`rich-editor`/`spell-editor`/`dialog-text`. It has its own static toolbar
(`view-party.html:572-590`) with `data-action="format-text"` Bold/Italic/Underline/
Strikethrough/List buttons and a `data-action="set-editor-font"` select, all routed to
`formatText()` → the four functions above.

Because `.cf-notes-editor` is absent from the allowlist, `parentTag.closest(...)` (and
`existingFont.closest(...)`) always returns `null` for content typed in Character Notes, so the
`else` branch runs every time: clicking Bold on already-bold text (or reselecting a different
font) never toggles/merges — it just nests another `<b>`/`<font>` wrapper around the existing
one. Repeated use accumulates `<b><b><b>text</b></b></b>` / `<font><font>text</font></font>`
inside `D.characters[i].notes`, which is what gets persisted by `saveCharacter`. Before this
migration, `document.execCommand('bold', ...)` handled toggling natively regardless of editor
class, so this is a genuine regression, not a pre-existing gap.

This is unverified by the new regression net: none of `editor-smoke.spec.js`,
`editor-formatting.spec.js`, `editor-floating.spec.js`, or `editor-insert.spec.js` reference
`char-notes`/`cf-notes-editor` (`grep -rn "char-notes|cf-notes-editor" tests/e2e/features` —
zero matches), even though `editor-smoke.spec.js`'s stated purpose is proving "die geteilte
Editor-Engine … in allen fünf weiteren Entity-Editoren" — the Character Notes editor was left
off that list of five.

**Fix:** Add `.cf-notes-editor` to the allowlist used by the four new functions (the
floating-toolbar's `handleSelectionChange()` at `rich-text.js:1324` and
`initContextToolbars()` at `:1510` already include it — the new functions should match):

```js
const EDITABLE_SELECTOR = '.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor';
```

and reference that one constant everywhere instead of the ad-hoc inline strings (see WR-01).
Then add a `char-notes` case to `editor-smoke.spec.js`'s `EDITORS` table (or a dedicated toggle
test) so this class of regression is caught going forward.

## Warnings

### WR-01: Editor-recognition selector duplicated 11× with two silently different variants

**File:** `ui/editors/rich-text.js:363, 381, 519, 539, 675-676, 1172, 1205, 1247, 1324, 1326,
1510`

**Issue:** The string `'.rich-editor, .spell-editor, .dialog-text'` (3 classes) and
`'.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor'` (4 classes) are both hand-typed
repeatedly through the file instead of sharing one constant. CR-02 is a direct consequence of
this duplication — the 4-class list only "won" at the two spots (`handleSelectionChange`,
`initContextToolbars`) that happened to be updated when `.cf-notes-editor` was introduced;
every other spot, old and new, silently kept the 3-class list. Left as-is, any future editor
class (or the next contributor who copies one of these lines) will reintroduce the same drift.

**Fix:**
```js
// near the top of the EDITOR FORMATTING section
const RICH_EDITOR_SELECTOR = '.rich-editor, .spell-editor, .dialog-text, .cf-notes-editor';
```
and replace all 11 occurrences with a reference to it (a plain module-scoped `const` is safe
here per the file's own build-dedup convention, since it isn't re-declared from `window.*`).

### WR-02: Zero-width-space cleanup listeners can attach to the wrong node when Enter is pressed inside inline formatting

**File:** `ui/editors/rich-text.js:904-934` (`insertLineBreakAtSelection`)

**Issue:**
```js
const br = document.createElement('br');
range.insertNode(br);
const editor = br.parentNode;          // not necessarily the contenteditable host
...
editor.addEventListener('input', cleanupPlaceholder, { once: true });
editor.addEventListener('blur', cleanupPlaceholder, { once: true });
```
`br.parentNode` is whatever DOM node directly contains the caret at the moment Enter is pressed.
If the caret is inside an inline formatting element (e.g. `<b>text|</b>`, `<i>`, `<mark>`,
`<font>`, produced by the very formatting functions in this file), `range.insertNode(br)` inserts
the `<br>` — and the code then attaches the cleanup listeners — as a child of that inline
element, not the actual `.rich-editor`/`.cf-notes-editor` host.

Two failure modes follow: (1) `input` events for a contenteditable host are dispatched on the
host itself and bubble *up* through the host's ancestors — a listener on a *descendant* inline
element such as `<b>` is not on that bubble path and will not receive them; (2) `blur` does not
bubble at all and only fires on the element that actually held focus (the host), never on an
inline descendant. In both cases `cleanupPlaceholder` never runs, and the invisible
`U+200B` placeholder character is left permanently embedded in the saved content (it survives
into `innerHTML`/localStorage since nothing else strips it).

Not covered by `editor-insert.spec.js`'s Enter tests, which only type into a plain, unformatted
editor (`'ZeileEins'` + Enter + `'ZeileZwei'`) — the "Enter pressed while caret is inside
existing inline formatting" path is untested.

**Fix:** Resolve to the actual editing host instead of the immediate parent, e.g.:
```js
const editor = br.closest('[contenteditable="true"]') || br.parentNode;
```

## Info

### IN-01: Four `formatText()` branches (heading/font/highlight) are dead code by the file's own admission

**File:** `ui/editors/rich-text.js:456-481` (`heading`, `font`, `highlight` branches of
`formatText`)

**Issue:** The migration comment above `clearInlineFormattingAtSelection` (`rich-text.js:412-415`)
states these branches are "über KEIN Template in der App erreichbar" — i.e. no template wires a
`data-action` to them with `format=heading|font|highlight`. They were migrated for behavioral
parity rather than removed, which is a reasonable call during a behavior-preserving migration,
but it's worth flagging for a follow-up cleanup pass now that the migration itself is done —
carrying unreachable branches long-term increases maintenance surface without benefit.

**Fix:** Track for a later cleanup phase (delete or wire up); no action needed for this phase.

---

_Reviewed: 2026-07-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
