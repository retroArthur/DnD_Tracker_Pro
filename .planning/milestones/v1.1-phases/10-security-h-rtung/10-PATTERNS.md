# Phase 10: Security-Härtung - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 8 (modified; no new files in this phase — Security-Härtung is a bugfix/audit phase)
**Analogs found:** 8 / 8 (all in-repo, sibling code already implementing the correct pattern)

Note: This phase creates no new source files. All "files to change" are existing files where an
established in-repo sanitization pattern must be extended/applied consistently. The closest analog
for each fix is therefore a **sibling call site in the same codebase** that already does it correctly
— verified directly against source in RESEARCH.md and re-confirmed here.

## File Classification

| File to Modify | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `ui/editors/markdown-converter.js` (`renderMarkdownInContent()`) | utility/transform | transform (string→sanitized HTML) | `markdownToHtml()` in the same file (lines 189-244) | exact — same file, same responsibility, already sanitizes |
| `features/wiki/wiki.js` (`renderWikiDetail()`, ~line 423-460) | component/render | request-response (render-on-display) | `encounters-render.js:446,457,468,479`, `quests-render.js:89`, `locations-render.js:293`, `sessions.js:314`, `npc-popup.js:85`, `render-spells.js:53-54` — all wrap `renderMarkdownInContent()` in `sanitizeHTML()` at call site | exact — 6 existing analogs, same wrapper pattern |
| `systems/spellslots/import-export.js` (`executeImport()`, ~line 292-368) | service/CRUD | CRUD (validate + persist) | `wiki.js:696` (in-app save path, sanitizes `content` on save) | role-match — same sanitize-before-persist intent, different entry point |
| `systems/spellslots/import-export.js` (`importDataGlobal()`, ~line 464-588) | service/CRUD | CRUD (batch import, two branches) | `executeImport()`'s undo/backup pattern (lines 351/355, same file) for D-07; `wiki.js:696` for sanitization | exact for undo/backup (same file, sibling function); role-match for sanitization |
| `utils/basic.js` (`sanitizeHTML()` `allowedTags`, ~line 72-101) | utility/config | transform (allowlist config) | `utils/testable-utils.js` (~line 48-77) — near-identical twin, verified NOT drifted for `sanitizeHTML()` | exact — structural twin, same array literal |
| `utils/testable-utils.js` (`allowedTags`, ~line 48-77) | utility/config (test twin) | transform | `utils/basic.js` `allowedTags` (production source of truth) | exact — must mirror 1:1 |
| `ui/editors/rich-text.js` (`handleEditorPaste()` table branch, ~line 961-989) | utility/event-handler | event-driven (paste event → DOM sanitize) | `utils/basic.js:63-64` on\*-attribute regex pre-cleaning inside `sanitizeHTML()` | role-match — same regex pattern, different call site (string-based vs DOMParser-based) |
| `ui/editors/rich-text.js` (`saveSpell()`, ~line 1663-1679) | controller/save-handler | CRUD (form → entity save) | `note` field two lines below in same function (already calls `sanitizeHTML(noteEl.innerHTML.trim())`); also `wiki.js:696` | exact — same function, sibling field, literally adjacent lines |

## Pattern Assignments

### `ui/editors/markdown-converter.js` — `renderMarkdownInContent()`

**Analog:** `markdownToHtml()`, same file, lines 189-244 (verified: `grep -n "function markdownToHtml"` → line 189; `sanitizeHTML` call → lines 190/242-243)

**Core pattern to copy** (from `markdownToHtml()`):
```javascript
function markdownToHtml(markdown) {
    const sanitizeHTML = window.sanitizeHTML;
    // ... markdown conversions ...
    if (typeof sanitizeHTML === 'function') {
        html = sanitizeHTML(html);
    }
    return html;
}
```

**Apply identically at the end of `renderMarkdownInContent()`** (currently missing — this is CR-01):
```javascript
function renderMarkdownInContent(html) {
    if (!html || typeof html !== 'string') return html;
    let result = html;
    // ... existing markdown conversions unchanged ...
    const sanitizeHTML = window.sanitizeHTML;
    if (typeof sanitizeHTML === 'function') {
        result = sanitizeHTML(result);
    }
    return result;
}
```

**Guard pattern:** `typeof sanitizeHTML === 'function'` defensive check — matches project convention of guarding cross-module globals before calling (loader-order safety, non-ESM architecture).

---

### `features/wiki/wiki.js` — `renderWikiDetail()` (~line 423-460)

**Analog:** every other `renderMarkdownInContent()` consumer already wraps in `sanitizeHTML()`:
- `encounters-render.js:446,457,468,479` → `sanitizeHTML(renderMarkdownInContent(enc.X))`
- `quests-render.js:89` → `sanitizeHTML(renderMarkdownInContent(q.description))`
- `locations-render.js:293` → `sanitizeHTML(renderMarkdownInContent(loc.description))`
- `sessions.js:314` → `sanitizeHTML(renderMarkdownInContent(n.content))`
- `npc-popup.js:85` → `sanitizeHTML(renderMarkdownInContent(npc.description))`
- `render-spells.js:53-54` → `sanitizeHTML(renderMd(spell.description))`

**Critical ordering fix (Pitfall 1, TOC anchors would be stripped by allowedAttributes lacking `id`):**
```javascript
// BEFORE (breaks TOC after D-01 fix is applied to renderMarkdownInContent):
const contentWithAnchors = addTOCAnchors(entry.content || '');
const contentWithMarkdown = renderMarkdownInContent
    ? renderMarkdownInContent(contentWithAnchors)
    : contentWithAnchors;
const parsedContent = parseWikiLinks(contentWithMarkdown);

// AFTER — sanitize first, inject code-generated (non-user) TOC ids after:
const markdownRendered = renderMarkdownInContent
    ? renderMarkdownInContent(entry.content || '')
    : (entry.content || '');
const contentWithAnchors = addTOCAnchors(markdownRendered);
const parsedContent = parseWikiLinks(contentWithAnchors);
```

**Do not touch:** `renderWikiTOC(entry.content)` (separate TOC sidebar list) — uses its own `extractWikiTOC()` regex on raw content, unaffected by this ordering change, generates identical `toc-N` ids as long as `addTOCAnchors()` keeps matching `<h2-4>` tags in the same document order.

**Note:** `wiki.js` is the **only** confirmed live-exploitable render path (CR-01) — the E2E regression test (D-13) must exercise this exact function/file.

---

### `systems/spellslots/import-export.js` — `executeImport()` + `importDataGlobal()` (Import-Grenze)

**Analog for sanitize-on-persist intent:** `wiki.js:696` (in-app save path — already calls `sanitizeHTML()` before storing `content`).

**Analog for undo/backup pattern (D-07/WR-03):** `executeImport()`'s own existing undo/backup calls at lines 351/355 (same file) — copy that pattern into `importDataGlobal()`'s overwrite branch.

**New shared helper (per RESEARCH.md "Empfohlene Implementierungsstruktur"):**
```javascript
const HTML_FIELDS_BY_TYPE = {
    characters: ['notes'],
    npcs: ['description'],
    locations: ['description'],
    quests: ['description'],
    encounters: ['traits', 'actions', 'skills'],
    spells: ['description'],
    sessionNotes: ['content'],
    wiki: ['content'],
    links: ['description']
};

function sanitizeImportedItem(type, item) {
    const fields = HTML_FIELDS_BY_TYPE[type];
    if (!fields) return item;
    const sanitizeHTML = window.sanitizeHTML;
    if (typeof sanitizeHTML !== 'function') return item;
    const result = { ...item };
    fields.forEach(field => {
        if (typeof result[field] === 'string') {
            result[field] = sanitizeHTML(result[field]);
        }
    });
    return result;
}
```

**`executeImport()` — extend existing `validatedItems` map (~line 292-301):**
```javascript
const validatedItems = importData.data.map((item, idx) => {
    const validated = {};
    for (const [key, field] of Object.entries(schema)) {
        if (field.required && item[key] === undefined) {
            throw new Error(`Eintrag ${idx + 1}: Pflichtfeld "${key}" fehlt`);
        }
        validated[key] = item[key] !== undefined ? item[key] : field.default;
    }
    return sanitizeImportedItem(dataType, validated); // NEW
});
```

**`importDataGlobal()` — apply BEFORE the `choice` branch (Pitfall 2 — both branches persist raw fields, not just the overwrite branch that WR-03 names):**
```javascript
Object.entries(HTML_FIELDS_BY_TYPE).forEach(([type, fields]) => {
    if (Array.isArray(imp[type])) {
        imp[type] = imp[type].map(item => sanitizeImportedItem(type, item));
    }
});
// ... unchanged: if (choice) { StorageAPI.setJSON(...) } else { Object.assign(D, imp); ... }
```

**Undo/backup fix (D-07, WR-03) — overwrite branch only, copy `executeImport()`'s pattern:**
```javascript
// In the "overwrite" (else) branch, before Object.assign(D, imp):
saveUndoState();      // matches CLAUDE.md rule + executeImport() line ~351
createAutoBackup();   // matches executeImport() line ~355 pattern
Object.assign(D, imp);
```

---

### `utils/basic.js` + `utils/testable-utils.js` — `<strike>` whitelist (D-06)

**Analog:** the two files are structural twins for `sanitizeHTML()`'s `allowedTags` array (verified: `grep -n "allowedTags"` → `utils/basic.js:72`, `'s',` → line 76). Change is data-only, applied identically in both.

```javascript
const allowedTags = [
    'b', 'i', 'u', 's',
    'strike', // NEW (D-06)
    'strong', 'em', 'ul', 'ol', 'li', 'p', 'br', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'mark', 'a', 'font'
];
```

**Rule:** any future whitelist change to `utils/basic.js` MUST land in `utils/testable-utils.js` in the same commit — this is exactly what D-14's parity test (below) exists to enforce structurally.

---

### `ui/editors/rich-text.js` — `handleEditorPaste()` table branch (~line 961-989, D-05)

**Analog:** `sanitizeHTML()`'s own on\*-attribute pre-cleaning regexes in `utils/basic.js:63-64` — reuse the identical regex pair rather than inventing new detection logic.

```javascript
// BEFORE (line 963):
.replace(
    /\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi,
    ''
)

// AFTER — insert on*-stripping ahead of the existing attribute-list strip:
.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')
.replace(
    /\s+(class|style|width|height|border|cellpadding|cellspacing|align|valign|bgcolor|xmlns|x:|data-[\w-]+)="[^"]*"/gi,
    ''
)
```

**Scope discipline:** do NOT refactor the paste handler to use `sanitizeHTML()`'s DOMParser approach — that would be scope creep beyond D-05 (see RESEARCH.md Pitfall 6). Minimal regex extension only.

---

### `ui/editors/rich-text.js` — `saveSpell()` (~line 1663-1679, Pitfall 3 mitfix)

**Analog:** the `note` field, two lines below `description` in the same function — already correctly sanitized. Also matches `wiki.js:696`'s save-path pattern.

```javascript
// BEFORE:
description: descHtml,
// note field (already correct, do not change):
note: sanitizeHTML(noteEl.innerHTML.trim()),

// AFTER:
description: sanitizeHTML(descHtml),
```

---

## Shared Patterns

### Central sanitizer (single source of truth)
**Source:** `utils/basic.js` → `sanitizeHTML()` (DOMParser-based allowlist sanitizer, lines ~58-226)
**Apply to:** every fix in this phase (D-01, D-05, D-06). No new sanitizer is built — this is the canonical, project-wide implementation already used by >10 entity renderers.

### Defensive `typeof X === 'function'` guard for cross-module globals
**Source:** `markdownToHtml()` (`ui/editors/markdown-converter.js:190,242`)
**Apply to:** any new call site that invokes `window.sanitizeHTML` from a module that may load before `utils/basic.js` in edge cases (non-ESM loader-order safety per CLAUDE.md).

### `saveUndoState()` + backup before destructive/overwrite persistence
**Source:** `executeImport()` (`systems/spellslots/import-export.js:351,355`); CLAUDE.md "ALWAYS call saveUndoState() before destructive operations"
**Apply to:** `importDataGlobal()`'s overwrite branch (D-07/WR-03).

### `vm.runInContext` test pattern — load real production source, not a copy
**Source:** `tests/unit/storage-conflict.test.js`
**Apply to:** all new Phase 10 security unit tests (D-14) against `utils/basic.js` and `ui/editors/markdown-converter.js`. Pattern:
```javascript
const context = { window: {}, document: global.document, DOMParser: global.DOMParser, Node: global.Node, console };
vm.createContext(context);
const src = fs.readFileSync(path.join(__dirname, '../../utils/basic.js'), 'utf8');
vm.runInContext(src, context);
const sanitizeHTML = context.sanitizeHTML;
```

### Parity test twin-enforcement
**Source:** none pre-existing — new pattern for this phase (D-14), but structurally modeled on the fact that `sanitizeHTML()` is currently NOT drifted between `utils/basic.js` and `utils/testable-utils.js` (verified diff-equal). Write a test that asserts both files produce identical output for a shared vector set — this is the "fence" that must go green BEFORE the `<strike>` fix (D-06) so it proves 0-drift-before and enforces 0-drift-after.

### E2E against built bundle via `file://`
**Source:** established project pattern (CLAUDE.md, `tests/e2e/features/editor-insert.spec.js`)
**Apply to:** D-13's E2E proof (malicious wiki import → open entry → no script execution) and D-16's paste-XSS test extension. Always run `python build.py` before E2E; use `data-action` selectors; German test names.

## No Analog Found

None — every file in scope has a strong (exact or role-match) analog because this phase deliberately extends an already-consistent, pre-existing sanitization convention rather than introducing new architecture. The one net-new artifact (`HTML_FIELDS_BY_TYPE` + `sanitizeImportedItem()` helper in `import-export.js`) is not a new pattern but a factoring-out of the field list already implied by the render-pfad audit table in RESEARCH.md.

## Metadata

**Analog search scope:** `ui/editors/`, `features/wiki/`, `systems/spellslots/`, `utils/`, plus all `*-render.js` files across `features/` (encounters, quests, locations, sessions, npcs, spells) as sanitize-wrapper analogs.
**Files scanned:** verified via Grep/Read against live source: `ui/editors/markdown-converter.js`, `utils/basic.js`, `utils/testable-utils.js`, `ui/editors/rich-text.js`, `systems/spellslots/import-export.js`, `features/wiki/wiki.js`, plus RESEARCH.md's already-verified excerpts for the 6 sibling renderers.
**Pattern extraction date:** 2026-07-25
**Note on source of excerpts:** Most code excerpts below reproduce RESEARCH.md's "Code Examples" section verbatim (already verified against source with exact line numbers per that document's Assumptions Log — marked `[VERIFIED: codebase read/grep]`). Two excerpts (`markdownToHtml()` line numbers, `allowedTags` line numbers) were independently re-confirmed via Grep in this pass.
