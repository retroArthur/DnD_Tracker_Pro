---
phase: 04-initiative-erweiterungen
reviewed: 2026-06-14T12:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - features/initiative.js
  - features/initiative-mob.js
  - features/initiative-statblock.js
  - features/bestiary/bestiary-actions.js
  - features/bestiary/bestiary-render.js
  - ui/actions/combat-actions.js
  - assets/styles/initiative.css
findings:
  critical: 4
  warning: 5
  info: 2
  total: 11
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-14T12:00:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 04 added three initiative features: a statblock drawer (INIT-01), legendary action/resistance pips (INIT-02), and mob mode with pool-HP (INIT-03). The architecture is sound and the build-dedup rules are followed correctly throughout. `saveUndoState()` is called correctly in `dissolveMob()` and `addBestiaryToInitiative()`. XSS prevention is consistent in all new mob and statblock rendering code.

Four critical bugs were found: a schema mismatch in `updateCharacterHP` that silently corrupts HP to `NaN`; a mob-pool-HP desync when the standard ➕/➖ buttons or AoE damage are used on a mob row; an unbounded dice-roll loop in `rollAoEDamage` that can freeze the browser; and an `EntityLookup` cache leak when `renderInit()` returns early on empty combatants.

---

## Critical Issues

### CR-01: `updateCharacterHP` uses wrong field names — produces NaN

**File:** `features/initiative.js:362-364`

**Issue:** `updateCharacterHP()` reads `ch.currentHp` and `ch.hp` from the character object. The party schema (`party-crud.js`, `party-render.js`) uses `hpCurrent` and `hpMax`. Both fields are `undefined` on real character objects, so `(ch.currentHp || ch.hp) + amount` evaluates to `NaN`, and the function then writes `ch.currentHp = NaN` — a field that does not exist on the character schema. The real `ch.hpCurrent` is never updated. Any UI that calls this via the `update-char-hp` action silently no-ops.

**Fix:**
```javascript
function updateCharacterHP(id, amount) {
    const ch = EntityLookup.character(id);
    if (!ch) return;
    if (amount < 0) {
        ch.hpCurrent = Math.max(0, (ch.hpCurrent || ch.hpMax || 0) + amount);
    } else {
        ch.hpCurrent = Math.min(ch.hpMax || 0, (ch.hpCurrent || 0) + amount);
    }
    window.renderParty();
    window.save();
}
```

---

### CR-02: Mob pool-HP desyncs when ➕/➖ buttons or AoE damage hit a mob row

**File:** `features/initiative.js:328-356` (`modHp`), `features/initiative.js:13-21` (`applyDamage`)

**Issue:** `renderMobRow` generates HP buttons with `data-action="mod-hp"`, which routes to `modHp()`. The `modHp()` function only updates `c.currentHp`; it never touches `c.mob.poolHp`. `getMobAlive()` reads `cb.mob.poolHp`, so the "X of N alive" counter and the `defeated`/`bloodied`/`healthy` colour will not update when the DM clicks ➕/➖ on a mob row. The same fault applies to AoE damage: `applyAoEDamage()` calls `applyDamage()` which also only updates `currentHp`.

After one ➕/➖ click: `c.currentHp` changes but `c.mob.poolHp` is stale. After the render, `getMobAlive()` continues to show the old count. The dedicated `applyMobDamage()` function (which correctly syncs both fields) is exported but never wired to the ➕/➖ buttons.

**Fix:** Add a pool-HP sync block inside `modHp()` for mob combatants:
```javascript
function modHp(id, amt) {
    const c = getCombatant(id);
    if (!c) return;
    const wasAtZero = c.currentHp <= 0;
    if (amt < 0) {
        let remaining = Math.abs(amt);
        const actualDamage = remaining;
        if (c.tempHp && c.tempHp > 0) {
            const absorbed = Math.min(c.tempHp, remaining);
            c.tempHp -= absorbed;
            remaining -= absorbed;
        }
        c.currentHp = Math.max(0, c.currentHp - remaining);
        // Sync mob pool-HP
        if (c.mob) c.mob.poolHp = c.currentHp;
        if (c.concentration?.active && actualDamage > 0) {
            c.concentration.pendingCheck = actualDamage;
        }
    } else {
        c.currentHp = Math.min(c.maxHp, c.currentHp + amt);
        // Sync mob pool-HP
        if (c.mob) c.mob.poolHp = c.currentHp;
        if (wasAtZero && c.currentHp > 0) resetDeathSaves(c);
    }
    renderInit();
    window.save();
}
```
Apply the same `if (combatant.mob) combatant.mob.poolHp = combatant.currentHp;` sync to `applyDamage()`.

---

### CR-03: Unbounded dice-roll loop in `rollAoEDamage` — browser freeze DoS

**File:** `features/initiative.js:948-951`

**Issue:** `rollAoEDamage()` parses `count` and `sides` from user-typed formula input with no upper bound. A formula like `999999d999999` causes a loop of one million synchronous iterations on the main thread, freezing the browser tab. CLAUDE.md "User Input in Loops: Always Set Limits" explicitly flags this pattern.

**Fix:**
```javascript
const MAX_DICE_COUNT = 1000;
const MAX_DICE_SIDES = 10000;

function rollAoEDamage() {
    const formula = $('aoe-damage-formula')?.value?.trim();
    if (!formula) { showToast('Bitte Schadenswürfel eingeben', 'error'); return; }

    let total = 0;
    const diceMatch = formula.match(/(\d+)d(\d+)/i);
    if (diceMatch) {
        const count = Math.min(parseInt(diceMatch[1]), MAX_DICE_COUNT);
        const sides = Math.min(parseInt(diceMatch[2]), MAX_DICE_SIDES);
        if (count !== parseInt(diceMatch[1]) || sides !== parseInt(diceMatch[2])) {
            showToast(`Formel auf ${MAX_DICE_COUNT}d${MAX_DICE_SIDES} begrenzt`, 'warning');
        }
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        // ... rest of modifier parsing unchanged
    }
    // ...
}
```

---

### CR-04: `EntityLookup` cache never cleared when `renderInit()` returns early on empty combatants

**File:** `features/initiative.js:113` and `features/initiative.js:121-124`

**Issue:** `EntityLookup.enableCache()` is called at line 113, but the function returns early at line 124 (when `!init.combatants.length`) without calling `EntityLookup.clearCache()`. After an early return, subsequent EntityLookup calls in other render functions will use a stale cache. The pattern throughout the project (e.g., `renderBestiaryList`) always pairs `enableCache()` with `clearCache()` at all exit points.

**Fix:**
```javascript
if (!init.combatants.length) {
    c.innerHTML = '<div style="text-align:center; ...">Keine Kämpfer</div>';
    EntityLookup.clearCache();  // ADD THIS
    return;
}
```

---

## Warnings

### WR-01: `removeCombatant` and `endCombat` skip `saveUndoState()` — Ctrl+Z cannot recover

**File:** `features/initiative.js:317-327` (`removeCombatant`), `features/initiative.js:230-252` (`endCombat`)

**Issue:** Both functions perform destructive operations without calling `saveUndoState()`. Per CLAUDE.md: "ALWAYS Call `saveUndoState()` Before Destructive Operations." Clicking ❌ on a combatant or ending combat cannot be undone with Ctrl+Z, contrary to user expectation. `removeLoot()` at line 1413 correctly calls `window.pushUndo()`, and `dissolveMob()` correctly calls `saveUndoState()` — the initiative removal functions are inconsistent.

**Fix:**
```javascript
function removeCombatant(id) {
    saveUndoState('Kämpfer entfernt');  // ADD
    const D = window.D;
    // ...rest unchanged
}

function endCombat() {
    // ...
    if (confirm('Kampf beenden und alle Teilnehmer entfernen?')) {
        saveUndoState('Kampf beendet');  // ADD
        // ...rest unchanged
    }
}
```

---

### WR-02: `saveLoot()` skips `saveUndoState()` — both create and edit paths

**File:** `features/initiative.js:1335-1408`

**Issue:** `saveLoot()` modifies `D.loot` (update path at line 1377, merge path at line 1394, add path at line 1397) without calling `saveUndoState()`. `removeLoot()` in the same file correctly calls `pushUndo()`. The save/edit path is inconsistent.

**Fix:** Add `saveUndoState('Beute gespeichert');` at the start of `saveLoot()`, before any data mutation.

---

### WR-03: `calcMobHits` forces minimum 1 hit for small groups vs high-AC targets

**File:** `features/initiative-mob.js:75`

**Issue:** When `needed >= 20` (target AC is very high relative to attack bonus), the function returns `Math.max(1, Math.floor(count * 0.05))`. For `count = 1`, this yields `Math.max(1, 0) = 1`, guaranteeing a hit even for a single attacker who would only hit on a natural 20. The D&D rule is a 5% chance, not a guaranteed hit. This incorrect `Math.max(1, ...)` guard means a Mob of 1 creature always hits a dragon's AC 22.

**Fix:**
```javascript
if (needed >= 20) return Math.floor(count * 0.05);  // remove Math.max(1, ...)
```

---

### WR-04: AoE target checkbox changes do not update damage preview — `data-on-change` is not processed

**File:** `features/initiative.js:897-901`

**Issue:** The AoE modal renders checkboxes with `data-on-change="updateAoETargetDisplay"`. This is a non-standard custom attribute not handled by `EventDelegation` (confirmed: `event-delegation.js` has no `data-on-change` processing). The `_handleChange` handler in event delegation only processes `data-action`. Clicking individual target checkboxes or "Save ½" checkboxes does NOT update the per-target damage preview or the "selected" highlight; only `rollAoEDamage()` and the quick-select buttons trigger `debouncedUpdateAoE()`. The DM sees stale damage previews after manually toggling targets.

**Fix:** Either wire the checkbox inputs to event delegation with `data-action="aoe-update-display"`, or add a direct `addEventListener('change', updateAoETargetDisplay)` call after the modal renders:
```javascript
// After showModal('aoe-damage-modal'):
document.querySelectorAll('.aoe-target-checkbox, [id^="aoe-save-"]').forEach(el => {
    el.addEventListener('change', updateAoETargetDisplay);
});
```

---

### WR-05: `getBestiaryMonster` applies `parseEntityId()` to SRD `_id` strings when source is ambiguous

**File:** `features/bestiary/bestiary-actions.js:13-14`

**Issue:** For custom monsters, `getBestiaryMonster` calls `c.id === parseEntityId(id)`. The `id` parameter here comes from `statblockRef.id`, which is set in `createMobCombatant` as `monster.id` (already a number for custom creatures from `nextId()`). `parseEntityId(number)` should handle this correctly. However, the function signature says `id` can be either a string SRD key or a numeric custom ID, but the code only guards on `source === 'custom'` — if `source` is ever `undefined` or missing, the function falls through to the SRD path and tries to compare `m._id === id` where `id` may be a number. No null-guard on `source`. Low-impact but worth documenting.

**Fix:** Add a guard or early return for null/undefined source:
```javascript
function getBestiaryMonster(id, source) {
    if (!source) return null;
    if (source === 'custom') { /* ... */ }
    return getSRDMonsters().find(m => m._id === id) || null;
}
```

---

## Info

### IN-01: `traitArrayToHtml` (bestiary-actions.js) passes custom HTML strings through unsanitized

**File:** `features/bestiary/bestiary-actions.js:220`

**Issue:** When `items` is a string (custom creature format), `traitArrayToHtml` returns it as-is (`return items`). This string is then stored into `encounterEntry.traits` and `encounterEntry.actions` without re-sanitization. The data was presumably sanitized when the custom creature was saved, but there is no defense-in-depth here at the read path. If a custom creature with unsanitized HTML (from a data migration or manual localStorage edit) is added to an encounter, the encounter view would render the raw HTML. This is lower risk because it requires deliberate local data manipulation.

**Fix:** Apply `sanitizeHTML()` before storing:
```javascript
function traitArrayToHtml(items) {
    if (!items) return '';
    if (typeof items === 'string') return sanitizeHTML(items);  // ADD sanitize
    // ... array path unchanged
}
```

---

### IN-02: `renderInit` renders the statblock button for all combatants with no statblockRef — tooltip is misleading

**File:** `features/initiative.js:201`

**Issue:** The statblock button renders for every non-lair, non-mob combatant unconditionally. Its `title` attribute uses `cb.statblockRef ? 'Statblock anzeigen' : 'Basisinfos anzeigen'`. This is functional but slightly misleading: the 📖 button is always visible even for manually-added combatants with no useful data, potentially confusing the DM. Not a bug — cosmetic.

**Suggestion:** Consider adding `opacity: 0.4;` to the button via CSS when `!cb.statblockRef`, which would reduce confusion without removing functionality.

---

_Reviewed: 2026-06-14T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
