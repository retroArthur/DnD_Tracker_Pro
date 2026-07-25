---
phase: 10-security-h-rtung
reviewed: 2026-07-25T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - features/wiki/wiki.js
  - systems/spellslots/import-export.js
  - tests/e2e/features/editor-formatting.spec.js
  - tests/e2e/features/editor-insert.spec.js
  - tests/e2e/features/import-security.spec.js
  - tests/e2e/features/wiki.spec.js
  - tests/unit/import-sanitization.test.js
  - tests/unit/sanitizer-parity.test.js
  - tests/unit/security.test.js
  - ui/editors/markdown-converter.js
  - ui/editors/rich-text.js
  - utils/basic.js
  - utils/testable-utils.js
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-07-25
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 10 closed the import-boundary XSS chain (raw `<img onerror>`/`<script>`/`javascript:`/`<svg onload>` payloads landing unsanitized in `D.wiki` via campaign import) and added a real, empirically-solid regression net for that specific path: `sanitizer-parity.test.js` proves `utils/basic.js` and `utils/testable-utils.js` no longer drift, `security.test.js` exercises the production sanitizer against a wide vector catalog, and `import-security.spec.js`/`import-sanitization.test.js` prove the file→import→render chain end-to-end. That work is sound and the tests genuinely exercise the real production code paths (via `vm.runInContext` against the actual source, not reimplemented logic).

However, the phase's other hardening target — `handleEditorPaste()`'s table branch in `ui/editors/rich-text.js` — was only partially fixed. The task explicitly scoped the fix to stripping `on*` event-handler attributes from pasted `<table>` HTML ("Broken-Windows-Ledger-Eintrag 1", documented as a deliberately minimal, non-DOMParser fix). That narrow scope leaves the branch's ad-hoc regex cleaner without any tag allowlist or dangerous-URL-scheme stripping. I built and ran the actual production bundle (`dist/dnd-tracker-bundled.html`) through Playwright and confirmed that pasting a crafted `<table>` containing `<iframe srcdoc="...">` into any rich-text editor field (wiki, character notes, NPC/location/quest descriptions, encounter traits, loot/spell/session text, etc.) executes attacker-controlled JavaScript **immediately on paste**, in the same origin as the app, with full access to `window`/`document`/`localStorage` — before any save-time sanitization ever runs. This is a live, unauthenticated-input XSS vector that the phase's own new test suite does not cover (the new tests for the table branch only assert that `on*` attributes are gone, never that disallowed tags/protocols are gone).

Beyond that central finding, a few smaller quality/consistency issues surfaced during the review (an import-boundary field-list gap, dead code, and a duplicate HTML attribute).

## Critical Issues

### CR-01: Clipboard-paste XSS via `<iframe srcdoc>` / `javascript:` bypasses the "hardened" table-paste branch (empirically verified, app-wide)

**File:** `ui/editors/rich-text.js:952-1024` (specifically the `cleanTable` regex chain at 961-995 and its handoff to `insertHtmlAtSelection()` at 996)

**Issue:**
`handleEditorPaste()` extracts the first `<table>...</table>` substring from pasted clipboard HTML and passes it through a bespoke regex cleaner before inserting it live into the DOM via `insertHtmlAtSelection()` → `range.createContextualFragment()` → `range.insertNode()`. This phase hardened that cleaner to strip `on\w+=...` event-handler attributes (closing "Broken-Windows-Ledger-Eintrag 1"), but the cleaner:

1. Only strips a fixed **denylist** of noise tags (`colgroup`, `col`, `tbody`, `thead`, `tfoot`, HTML comments, `google-sheets-html-origin`, `meta`, `<style>` blocks) — it does **not** allowlist tags, so `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<form>` etc. pass through untouched.
2. Only strips a fixed list of **named attributes** (`class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-*`) — it never applies the `javascript:`/`vbscript:`/`data:text/html` protocol stripping that `utils/basic.js:sanitizeHTML()` applies elsewhere, and does not touch `href`, `src`, or `srcdoc`.

Because `insertHtmlAtSelection()` inserts the resulting fragment directly into the live, already-open contenteditable DOM (not through `sanitizeHTML()`), an `<iframe srcdoc="...">` nested inside the pasted `<table>` renders and executes its `srcdoc` document — including any `<script>` inside it — the instant the paste event fires. `srcdoc` iframes inherit the embedding document's origin, so the injected script has full same-origin access to `window.parent`/`document`/`localStorage` of the actual app. No click, no save, and no page reload is required.

I verified this empirically against the built production bundle (`python build.py` then Playwright automation dispatching a real `ClipboardEvent` at `#wiki-content`, mirroring the project's own `pasteInto()` test helper):

```
DOM after paste: ...<iframe srcdoc="&lt;script&gt;window.__xssIframe=true;&lt;/script&gt;"></iframe>...
xssIframe (via parent.window): true
document.title: PWNED   // set from inside the iframe's srcdoc <script>
page errors: []
```

The malicious `<script>` inside `srcdoc` ran with same-origin access to the parent app and rewrote `document.title`, proving arbitrary same-origin JS execution — this is not a theoretical gap.

The same regex chain also leaves `<a href="javascript:...">` untouched inside pasted table cells (`href` is not in the stripped-attribute list), so a `javascript:` link survives live in the editor DOM until the eventual save-time `sanitizeHTML()` call — a second, narrower residual XSS window (fires on click before save).

`initEditorPasteHandlers()` wires `handleEditorPaste` to **every** rich-text field in the app (`char-notes`, `npc-desc`, `loc-desc`, `quest-desc`, `quest-epilog`, `enc-traits`, `enc-equipment`, `enc-actions`, `enc-skills`, `loot-desc`, `spell-desc`, `spell-note`, `session-text`, `link-desc`, `wiki-content`, `quick-ref-entry-content`) plus any `.rich-editor`/`.dialog-text-area` element — this is not wiki-only, it's the entire editor surface of the app.

The phase's new regression tests (`editor-insert.spec.js` "Sicherheits-Regression: Ereignis-Attribut in eingefügtem Tabellen-Markup...") only assert the absence of `on*` attributes after paste; they never assert the absence of disallowed tags (`iframe`/`object`/`embed`/`svg`/`form`) or dangerous URL schemes, so this bypass is invisible to the phase's own test suite.

**Fix:** Route the extracted table HTML through the same production DOM-based sanitizer used everywhere else in the app instead of (or in addition to) the bespoke regex chain, before it ever reaches `insertHtmlAtSelection()`:

```javascript
// rich-text.js, end of the html.includes('<table') branch:
const cleanTable = tableMatch[0]
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
    // ...existing noise-tag/attribute stripping...
    .replace(/<td>/gi, '<td style="border:1px solid var(--border); padding:6px 10px;">');

// NEW: run through the real allowlist-based sanitizer before insertion —
// closes the iframe/object/embed/svg/form + javascript:/data:/vbscript:
// gap that the regex chain above does not cover.
const safeTable = window.sanitizeHTML(cleanTable);
insertHtmlAtSelection(safeTable);
```

`sanitizeHTML()`'s existing `allowedTags` already includes `table`/`thead`/`tbody`/`tr`/`th`/`td` and its `allowedAttributes.style` list already covers `border`/`padding`/`background`/etc., so this does not regress the intended default table styling — it only removes the tags/protocols the regex chain misses. Add a Playwright regression case pasting `<table><tr><td><iframe srcdoc="...script...">…` and `<table><tr><td><a href="javascript:...">…` to close the coverage gap the same way `import-security.spec.js` closed it for the import path.

## Warnings

### WR-01: `HTML_FIELDS_BY_TYPE` omits `loot`, contradicting the phase's own "Render-Pfad-Audit" claim of completeness

**File:** `systems/spellslots/import-export.js:148-158`

**Issue:** `IO_SCHEMA.loot` defines a `description` field of `type: 'string'` (line 72), and that field is in fact rendered as raw HTML elsewhere in the app (`features/initiative.js:1418/1464`, `sanitizeHTML(item.description)`). `HTML_FIELDS_BY_TYPE` — which the comment above it claims was "per Render-Pfad-Audit ermittelt" (determined via a render-path audit) — lists nine entity types but omits `loot` entirely. This means an imported loot item's `description` is **not** cleaned at the import boundary; the raw (potentially malicious) markup is written straight into `D.loot` and only neutralized later, at render time, by the independent `sanitizeHTML()` call in `initiative.js`. Today this is not actively exploitable (the render-time call covers it), but it is an inconsistency with the phase's stated defense-in-depth design (import boundary + render boundary, per the `10-RESEARCH.md`/E2E-spec comments), and it silently regresses to a single point of failure if that one `initiative.js` render call is ever refactored or a new loot-rendering call site is added without the same care.

**Fix:** Add `loot: ['description']` to `HTML_FIELDS_BY_TYPE`, and add a `loot` case to the vector-catalog test in `tests/unit/import-sanitization.test.js`'s `TYPES_AND_FIELDS` map (currently also missing `loot`).

### WR-02: Duplicate `data-id` attribute in `renderWikiTreeItem()`

**File:** `features/wiki/wiki.js:390-394`

**Issue:**
```javascript
<div class="wiki-tree-item ..."
     data-action="select-wiki-entry" data-id="${entry.id}"
     data-id="${entry.id}"
     style="padding-left: ${4 + depth * 8}px;"
     title="${esc(entry.title)}">
```
`data-id="${entry.id}"` is emitted twice on the same element (lines 391 and 392) — almost certainly leftover from an edit. Harmless in practice (both instances carry the same value and the DOM will just keep the first), but it's invalid/duplicate markup and a maintenance hazard: a future edit that changes one occurrence without noticing the other would silently desync the attribute's value from what event handlers read via `dataset.id`.

**Fix:** Remove the redundant `data-id="${entry.id}"` on line 392.

### WR-03: Function-scoped `const sanitizeHTML = window.sanitizeHTML` re-declares a name that also exists as a top-level global function

**File:** `ui/editors/markdown-converter.js:190, 259`

**Issue:** Both `markdownToHtml()` and `renderMarkdownInContent()` open with `const sanitizeHTML = window.sanitizeHTML;`, shadowing the identically-named top-level `function sanitizeHTML(html) {...}` defined in `utils/basic.js`. CLAUDE.md documents this exact pattern (function-scoped `const X = window.X` where `X` also exists as a global function declaration) as a historically real build-breakage source ("Duplicate Declaration Debugging Pattern", Jan 2026 incident) and explicitly instructs against it project-wide. I confirmed the current build (`python build.py`) still succeeds and the concatenated bundle parses without a `SyntaxError` today (Pass 2 of the deduplication step happens to strip most, though not all, occurrences of this pattern across the codebase — one instance, in `systems/spellslots/import-export.js:sanitizeImportedItem()`, survives concatenation unmodified and still works because it is genuinely function-scoped). This is not an active bug today, but it is a repeat of a pattern the project's own documentation calls out as fragile and forbids; it should not be reintroduced in phase-10 code.

**Fix:** Drop the local alias and call `window.sanitizeHTML(...)` directly (or rely on the fact that `sanitizeHTML` is already reachable as a bare identifier once both files are concatenated into the same global script scope), consistent with CLAUDE.md's guidance ("NEVER use `var X = window.X;`... access const/function-declared globals directly").

## Info

### IN-01: Dead variable `hasHtmlTags` in `renderMarkdownInContent()`

**File:** `ui/editors/markdown-converter.js:264`

**Issue:** `const hasHtmlTags = /<[^>]+>/.test(html);` is computed but never referenced anywhere else in the function body — the markdown-to-HTML conversions that follow run unconditionally regardless of its value.

**Fix:** Remove the unused computation, or (if the original intent was to skip markdown conversion for content that's already HTML) wire it into the conditional logic it was presumably meant to gate.

### IN-02: `parseWikiLinks()` inserts un-escaped regex-captured text as element content

**File:** `features/wiki/wiki.js:648-654`

**Issue:** `parseWikiLinks(content)` runs `content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => ...)` against content that has already passed through `sanitizeHTML()` (via `renderMarkdownInContent()`), and injects the captured `linkText` group verbatim as the new `<span>`'s inner content (only the `data-value` attribute value is quote-escaped, not the element content). Because the input is post-sanitization, `linkText` can only ever contain text or already-allowlisted tags, so this is not an XSS vector today — but the non-greedy `[^\]]+` capture can span across real tag boundaries inside allowed inline markup (e.g. `[[foo <b>bar</b> baz]]`), which would relocate/duplicate that markup unexpectedly inside the generated `<span>`. Low risk, but worth tightening for correctness.

**Fix:** Constrain the regex to not cross `<`/`>` boundaries (e.g. `\[\[([^\]<>]+)\]\]`), or escape `linkText` before interpolating it as element content.

---

_Reviewed: 2026-07-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
