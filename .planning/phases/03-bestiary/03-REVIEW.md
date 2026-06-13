---
phase: 03-bestiary
reviewed: 2026-06-13T16:18:20Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - features/bestiary/bestiary-render.js
  - features/bestiary/bestiary-crud.js
  - features/bestiary/bestiary-editor.js
  - features/bestiary/bestiary-actions.js
  - ui/actions/entity-actions.js
  - core/srd-monsters.js
  - features/encounters/monster-templates.js
  - core/data.js
  - systems/spellslots/version-migration.js
  - systems/tab-registry.js
  - assets/templates/view-bestiary.html
  - build.py
  - loader.js
findings:
  critical: 3
  warning: 3
  info: 2
  total: 8
status: resolved
resolved: 2026-06-13
---

# Phase 03: Code Review Report

**Reviewed:** 2026-06-13T16:18:20Z
**Depth:** deep
**Files Reviewed:** 13
**Status:** issues_found

## Summary

The Bestiary implementation is largely well-structured. Security hygiene (XSS via `esc()`/`sanitizeHTML()`), undo correctness (`saveUndoState()` before all mutations), and DoS protection (quantity cap at 100) are correctly implemented in the new modules. The custom-creature CRUD, editor, and actions modules follow project conventions.

Three blockers were found, all in `features/encounters/monster-templates.js` — a file that was refactored (not created) in this phase. The refactor replaced 12 hand-coded inline templates with an alias to `getSRDMonsters()`, but it did not update the `loadMonsterTemplate()` consumer function to handle the changed data shape, breaking the encounter template-load feature for 6 of 12 monsters.

---

## Critical Issues

### CR-01: Template buttons silently fail — half the monster keys don't match SRD `_id` values

**File:** `features/encounters/monster-templates.js:28-74`
**Also:** `assets/templates/view-encounters.html:42-53`

**Issue:** `loadMonsterTemplate(key)` builds a `{_id -> monster}` map from `getSRDMonsters()` and looks up the given key. The HTML template buttons were written for the old flat-data format that used English/short keys (`skeleton`, `orc`, `guard`, `giant_rat`, `cultist`, `ogre`). The SRD data uses German `_id` values (`skelett`, `ork`, `wache`, `riesenratte`, `kultist` is absent, `oger`). When the key is not found, `loadMonsterTemplate` reaches `if (!t) return;` and exits silently — no fields are populated, no error is shown to the user.

**Affected buttons (6 of 12 broken):**
- `data-value="skeleton"` — SRD `_id` is `"skelett"`
- `data-value="orc"` — SRD `_id` is `"ork"`
- `data-value="guard"` — SRD `_id` is `"wache"`
- `data-value="giant_rat"` — SRD `_id` is `"riesenratte"`
- `data-value="cultist"` — SRD `_id` is `"kultist"`
- `data-value="ogre"` — SRD `_id` is `"oger"`

**Fix:** Update the six `data-value` attributes in `view-encounters.html` to match the German SRD `_id` values:

```html
<!-- view-encounters.html lines 42-53 -->
<button ... data-value="goblin">🗡️ Goblin</button>
<button ... data-value="skelett">💀 Skelett</button>    <!-- was: skeleton -->
<button ... data-value="zombie">🧟 Zombie</button>
<button ... data-value="ork">👹 Ork</button>            <!-- was: orc -->
<button ... data-value="wolf">🐺 Wolf</button>
<button ... data-value="bandit">🗡️ Bandit</button>
<button ... data-value="wache">🛡️ Wache</button>       <!-- was: guard -->
<button ... data-value="kobold">🦎 Kobold</button>
<button ... data-value="riesenratte">🐀 Riesenratte</button>  <!-- was: giant_rat -->
<button ... data-value="kultist">👤 Kultist</button>    <!-- was: cultist -->
<button ... data-value="oger">👊 Oger</button>          <!-- was: ogre -->
<button ... data-value="troll">🧌 Troll</button>
```

---

### CR-02: `loadMonsterTemplate` sets `enc-init` to `"undefined"` and garbles traits/actions

**File:** `features/encounters/monster-templates.js:36, 60-62`

**Issue:** `loadMonsterTemplate()` was written for the old hand-crafted templates that had flat numeric fields (`init`, `perception`) and pre-formatted HTML strings for `traits`/`actions`. After the refactor, it now receives SRD monsters which:
- Have no `init` field → `String(t.init)` = `"undefined"` → `enc-init` field shows literal `"undefined"`
- Have no `perception` int field → always sets `enc-perception` to `0` (mild, but loses data)
- Have `traits`/`actions` as `Array<{name: string, desc: string}>` not HTML strings → `sanitizeHTML(t.traits)` calls `String(array)` = `"[object Object],[object Object]"` → `enc-traits.innerHTML` is set to garbage

**Fix:** Convert traits/actions arrays to HTML in `loadMonsterTemplate`, and derive `init` from DEX modifier:

```js
// Replace lines 36, 53, 60-62 in monster-templates.js:

// DEX modifier as init (SRD monsters have no init field)
$('enc-init').value = String(Math.floor(((t.dex || 10) - 10) / 2));

// Perception from senses array (parse "Passive Wahrnehmung N")
var perception = 0;
if (Array.isArray(t.senses)) {
    t.senses.forEach(function(s) {
        var m = /Passive Wahrnehmung\s+(\d+)/i.exec(s);
        if (m) perception = parseInt(m[1], 10);
    });
}
$('enc-perception').value = String(perception);

// Convert array traits/actions to HTML before setting innerHTML
function traitArrayToHtml(items) {
    if (!items) return '';
    if (typeof items === 'string') return sanitizeHTML(items);
    if (!items.length) return '';
    return items.map(function(item) {
        return '<p><strong>' + esc(item.name || '') + '.</strong> ' + esc(item.desc || '') + '</p>';
    }).join('');
}
$('enc-traits').innerHTML  = traitArrayToHtml(t.traits);
$('enc-equipment').innerHTML = sanitizeHTML(t.equipment || '');
$('enc-actions').innerHTML = traitArrayToHtml(t.actions);
```

---

### CR-03: `console.log` in `version-migration.js` runs unconditionally in production

**File:** `systems/spellslots/version-migration.js:80`

**Issue:** The migration loop emits `console.log(...)` for every executed migration step unconditionally. Per CLAUDE.md conventions, all console output in production modules must be wrapped in `if (APP_CONFIG.DEBUG_MODE)`. This leaks internal version state to any user with DevTools open, and violates the project's zero-console-in-production rule that was enforced in Phase 1.

```js
// Line 80 (inside migrateData for loop):
console.log(`[MIGRATION] Migriere von ${dataVersion} auf ${version}`);
```

**Fix:**
```js
if (window.APP_CONFIG?.DEBUG_MODE) {
    console.log(`[MIGRATION] Migriere von ${dataVersion} auf ${version}`);
}
```

---

## Warnings

### WR-01: Duplicate action registration for `bestiary-select`, `bestiary-roll-dice`, `bestiary-delete`

**File:** `features/bestiary/bestiary-render.js:460-499`
**Also:** `ui/actions/entity-actions.js:279-306`

**Issue:** `bestiary-render.js` defines `BestiaryRenderActions` (covering `bestiary-select`, `bestiary-roll-dice`, `bestiary-delete`) and registers them inside a `DOMContentLoaded` listener. `entity-actions.js` registers the same three actions unconditionally at module-load time. Since `entity-actions.js` loads later (after all scripts, via the loader sequence), it always overwrites the render-module registrations. This means:
- In bundled mode: the `BestiaryRenderActions` registrations fire in DOMContentLoaded, then are immediately overwritten when `entity-actions.js` registers at module scope — so the render-module handlers never actually win.
- The `BestiaryRenderActions` block is dead code in production.

The comment "plan 05 may re-register this; last-write-wins is OK" understates the issue — the entity-actions registration always overrides, making the DOMContentLoaded block permanently redundant.

**Fix:** Remove the `BestiaryRenderActions` object and its `DOMContentLoaded` registration from `bestiary-render.js` (lines 460–499). The implementations in `entity-actions.js` are canonical.

---

### WR-02: `monster.source` used unescaped in CSS class attribute

**File:** `features/bestiary/bestiary-render.js:126`

**Issue:** `'<span class="bestiary-badge ' + monster.source + '">'` writes `monster.source` into a CSS class attribute without `esc()`. While `monster.source` is currently always `'srd'` or `'custom'` (set programmatically in lines 159/162), the pattern is fragile. If future code paths allow a custom creature to persist a non-default `source` field (e.g., via a LocalStorage tampering or import), a crafted value like `"><img onerror=alert(1)>` could cause XSS in the list render.

**Fix:**
```js
// Line 126 — bestiary-render.js
'<span class="bestiary-badge ' + esc(monster.source) + '">' +
```

---

### WR-03: `setBstRichEditor` sets `innerHTML` from stored HTML without re-sanitization on edit-open

**File:** `features/bestiary/bestiary-editor.js:267`

**Issue:** When editing a custom creature, `setBstRichEditor` does `el.innerHTML = html` where `html` is the stored `creature.traits` string (sanitized at save time). If a user tampers with LocalStorage to inject unsanitized HTML before reopening the editor, it will be rendered as-is. The `contenteditable` div itself is not a code-execution context, but the innerHTML assignment could render injected DOM nodes (scripts are inert in contenteditable, but event handlers on injected elements could run on user interaction).

The risk is low in practice (offline single-user app), but it diverges from the project's defense-in-depth posture.

**Fix:** Re-sanitize before setting the editor HTML:
```js
function setBstRichEditor(id, html) {
    var el = window.$(id);
    if (el) el.innerHTML = typeof html === 'string' ? sanitizeHTML(html) : '';
}
```

---

## Info

### IN-01: `t.str`, `t.dex`, etc. set numeric SRD values into encounter form

**File:** `features/encounters/monster-templates.js:54-59`

**Issue:** Old templates stored attributes as strings like `'8/-1'` (score/modifier). SRD monsters store plain numbers (`str: 8`). The encounter form `enc-str` is `type="number"`, so numeric values work correctly. However, the old `attr-mod` display elements (`enc-str-mod`) are not updated after template load — the form would show the correct number but the modifier badge would remain stale until the user interacts with the field.

**Fix:** After setting all attribute values, trigger `updateEncAttrMod` for each attribute, or call a `updateAllEncAttrMods()` equivalent if it exists.

---

### IN-02: `renderClickableDice` comment order vs. actual invocation order

**File:** `features/bestiary/bestiary-render.js:39`

**Issue:** The comment at line 39 states "renderClickableDice runs BEFORE sanitizeHTML (output still sanitized)". The actual code in `renderTraitList` (lines 264-274) applies `sanitizeHTML` FIRST, then `renderClickableDice`. The comment is inverted relative to the implementation. It creates confusion about whether `data-*` attributes from `renderClickableDice` survive `sanitizeHTML` (they don't — per the comment at line 257: "sanitizeHTML strips data-* attributes").

The implementation is correct (sanitize first, then add safe dice spans). Only the comment is wrong.

**Fix:** Update line 39 comment:
```js
// renderClickableDice runs AFTER sanitizeHTML — dice spans added to already-clean HTML
```

---

_Reviewed: 2026-06-13T16:18:20Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_

---

## Resolution (2026-06-13)

All blockers and warnings fixed during execute-phase, verified by rebuild + 308/308 unit + 11/11 bestiary E2E.

| ID | Severity | Status | Commit |
|----|----------|--------|--------|
| CR-01 | Critical | Fixed — 6 encounter button keys → German SRD `_id`s | `ee66bbf` |
| CR-02 | Critical | Fixed — `loadMonsterTemplate` derives init/perception from dex/wis; `_srdFieldToHTML()` converts `{name,desc}` arrays to HTML | `ee66bbf` |
| CR-03 | Critical | Fixed — migration `console.log` guarded by `DEBUG_MODE` | `2fd11da` |
| WR-01 | Warning | Fixed — removed dead duplicate action registration from `bestiary-render.js` | `1f16d49` |
| WR-02 | Warning | Fixed — `esc(monster.source)` in list badge/attributes | `1f16d49` |
| WR-03 | Warning | Fixed — re-sanitize stored HTML in `setBstRichEditor` | `1f16d49` |
| IN-02 | Info | Fixed — corrected inverted `renderClickableDice` comment | `1f16d49` |
| IN-01 | Info | Deferred — encounter attr-mod badge lags until field interaction (cosmetic, pre-existing pattern); form values are correct |
