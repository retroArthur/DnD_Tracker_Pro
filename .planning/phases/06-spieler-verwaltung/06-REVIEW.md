---
phase: 06-spieler-verwaltung
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - core/constants.js
  - core/data.js
  - utils/game-rules.js
  - utils/testable-utils.js
  - systems/spellslots/version-migration.js
  - features/initiative.js
  - features/party/party-crud.js
  - features/party/party-details.js
  - features/party/party-render.js
  - features/dice/dice-core.js
  - ui/actions/combat-actions.js
  - ui/actions/entity-actions.js
  - assets/templates/modals-entity.html
  - assets/templates/view-encounters.html
  - assets/templates/view-party.html
  - assets/styles/initiative.css
  - assets/styles/party.css
findings:
  critical: 1
  warning: 6
  info: 5
  total: 12
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-06-15
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Phase 6 (Spieler-Verwaltung) adds XP/level constants and pure rules helpers (`calcSkillModifier`, `canLevelUp`, `getXPForCR`, `distributeXP`), a 5.0.0 schema migration, an inspiration toggle, extended character stats (skills/expertise/attacks with clickable rolls), and an XP/milestone tracker.

The **new** Phase-6 code is generally solid: XSS escaping with `esc()`/`sanitizeHTML()` is applied consistently in the new detail-modal render paths, the damage-formula whitelist (`/^\d+[dD]\d+([+-]\d+)?$/`) and `MAX_ATTACKS=20` cap mitigate injection/DoS, `parseEntityId()` is used for ID comparison in `saveCharacter`, and the level-up flow correctly calls `pushUndo()` and never auto-bumps. The pure helpers are safe against empty arrays and division-by-zero.

The most serious finding is in a reviewed file but is **pre-existing**: the dice-tab attribute/save/skill roll handlers in `combat-actions.js` pass arguments in an order the target `dice-core.js` functions do not accept, so those rolls compute against the wrong attribute. Phase 6 built a *parallel* roll path (`roll-char-*-stop` in `entity-actions.js`) rather than fixing the broken originals — those new handlers are correct. The remaining findings are robustness/maintainability issues: a lexicographic (non-semver) migration sort, an unescaped `resistances`/`immunities`/`languages` join in two render paths, a duplicate-source-of-truth maintenance hazard between `game-rules.js` and `testable-utils.js`, and several dead/duplicated constants.

## Critical Issues

### CR-01: Dice-tab attr/save/skill roll handlers pass wrong argument order to dice-core functions

**File:** `ui/actions/combat-actions.js:151-175` (and the functions they call in `features/dice/dice-core.js:538, 561, 587, 608`)

**Issue:** The delegation handlers build calls with a leading `modifier`/`bonus` argument that the target functions do not declare, and the HTML buttons that trigger them carry no `data-value`, so the leading argument is always `0` and shifts every real argument out of position.

`view-tools.html` emits:
```html
<button class="dice-attr" data-action="roll-attr-check" data-attr="str">…</button>
<button class="dice-attr save" data-action="roll-char-save" data-attr="con">…</button>
```
`combat-actions.js` handles them as:
```javascript
'roll-attr-check': ctx => {
    const modifier = parseInt(ctx.target.dataset.value) || 0; // always 0 (no data-value)
    const attr = ctx.target.dataset.attr;                     // "str"
    rollAttrCheck(modifier, attr);                            // rollAttrCheck(0, "str")
},
'roll-char-save': ctx => {
    const modifier = parseInt(ctx.target.dataset.value) || 0;
    const attr = ctx.target.dataset.attr;
    rollCharSave(modifier, attr);                             // rollCharSave(0, "con")
},
'roll-skill-check': ctx => { … rollSkillCheck(modifier, skill); },
```
But `dice-core.js` declares single-argument functions:
```javascript
function rollAttrCheck(attr) { … ch?.attributes?.[attr] … }   // receives 0, not "str"
function rollCharSave(attr)  { … ch?.attributes?.[attr] … }   // receives 0, not "con"
function rollSkillCheck(skill, mod, skillName) { … }          // (skill, mod, name) — completely misaligned
```
So `rollAttrCheck` reads `ch.attributes[0]` (undefined → defaults to 10) instead of the chosen attribute, and `rollSkillCheck(modifier, skill)` maps `skill ← 0` and `mod ← "stealth"` (a string), producing `roll + "stealth"` string concatenation in the total. The dice-tab character attribute, saving-throw, and skill buttons therefore compute incorrect results.

This is pre-existing (it predates Phase 6 and was not introduced by this phase), but it lives in a file under review and the phase had an opportunity to fix it; instead Phase 6 added a separate, correct roll path (`roll-char-*-stop` in `entity-actions.js`) used by the new detail modal, leaving the dice-tab handlers broken.

**Fix:** Align the handlers with the actual function signatures (which already look the character up internally via `dice-char-select`):
```javascript
'roll-attr-check': ctx => rollAttrCheck(ctx.target.dataset.attr),
'roll-char-save': ctx => rollCharSave(ctx.target.dataset.attr),
'roll-skill-check': ctx => {
    const mod = parseInt(ctx.target.dataset.mod) || 0;
    const name = ctx.target.dataset.name || '';
    rollSkillCheck(ctx.target.dataset.skill, mod, name);
},
'roll-char-initiative': () => rollCharInitiative(),
```
Then add a regression E2E covering a dice-tab attribute roll (assert the displayed modifier matches the selected character's attribute).

## Warnings

### WR-01: Migration version ordering uses lexicographic string sort, not semver

**File:** `systems/spellslots/version-migration.js:111`

**Issue:** `const versions = Object.keys(MIGRATIONS).sort();` orders migration keys with `String.prototype.sort` (lexicographic). It happens to be correct today (`'2.3.0' < '2.4.0' < … < '5.0.0'` all single-digit majors), but it is a latent ordering bug: the moment a two-digit major like `'10.0.0'` is added it will sort *before* `'2.3.0'` and migrations will run out of order, silently corrupting data. The codebase already has a correct `compareVersions()` helper a few lines below — the sort should use it.

**Fix:**
```javascript
const versions = Object.keys(MIGRATIONS).sort(compareVersions);
```

### WR-02: `resistances` / `immunities` / `languages` joined into innerHTML without `esc()`

**File:** `features/party/party-details.js:306, 318, 324, 332` and `features/party/party-render.js:249-250`

**Issue:** In the detail modal and character card, defense lists are interpolated raw:
```javascript
<span class="char-info-value wrap">${ch.resistances.join(', ')}</span>   // line 324
<span class="char-info-value wrap">${ch.immunities.join(', ')}</span>    // line 332
…${ch.resistances.join(', ')}…  // party-render.js:249
```
For data entered through the form these are whitelisted checkbox values (safe). But `D.characters` is also populated via JSON import (`import-characters`), where `resistances`/`immunities`/`languages` are attacker-controllable arrays of arbitrary strings. An imported value like `<img src=x onerror=alert(1)>` would be injected unescaped. `sanitizeHTML` is not applied on this path. (Note: `languages` at line 318 IS escaped; the resistance/immunity joins are not — inconsistent.)

**Fix:** Escape each element before joining, e.g.:
```javascript
${ch.resistances.map(esc).join(', ')}
${ch.immunities.map(esc).join(', ')}
```
Apply the same in `party-render.js:249-250`.

### WR-03: Pure-helper logic duplicated by hand across two files invites silent drift

**File:** `utils/testable-utils.js:315-443` mirrors `utils/game-rules.js:148-211` and `core/constants.js:502-523`

**Issue:** `calcSkillModifier`, `canLevelUp`, `getXPForCR`, `distributeXP`, the full `XP_LEVEL_THRESHOLDS` array, the 18-entry `SKILL_INFO` map, and the `CR_TO_XP` map are re-typed as `*_TEST` copies in `testable-utils.js`. The only thing keeping them correct is a "keep in sync" comment. Tests run against the copies, so a divergence in the production file (`game-rules.js`/`constants.js`) would pass CI while shipping a bug — the tests would be validating the wrong code. This is exactly the failure mode the "duplicate function" guidance in CLAUDE.md warns about, applied to data/logic.

**Fix:** Add a guard test that asserts equality between production and mirror, e.g. read `XP_LEVEL_THRESHOLDS` and `SKILL_INFO` from the real source (or via a shared CommonJS-importable module) and `expect(XP_LEVEL_THRESHOLDS_TEST).toEqual(<production>)`. At minimum, add a test that fails if the arrays/maps differ in length or values.

### WR-04: `calcSkillModifier` trusts `ch.proficiencyBonus` without bounds, diverging from clamped formula

**File:** `utils/game-rules.js:155` (and mirror `utils/testable-utils.js:393`)

**Issue:** `const profBonus = ch.proficiencyBonus || getProficiencyBonus(ch.level || 1);` prefers a persisted `ch.proficiencyBonus`. `getProficiencyBonus` clamps level to 1–20, but a persisted/imported `proficiencyBonus` is used verbatim with no validation. A corrupted or imported character with `proficiencyBonus: 999` (or a negative value) yields nonsense skill modifiers, and because `0` is falsy a stored `proficiencyBonus: 0` is silently replaced by the formula result — an inconsistency between "explicitly zero" and "unset". Saving throws in `party-details.js:179` use the same pattern.

**Fix:** Validate/clamp the persisted bonus, and distinguish unset from zero:
```javascript
const profBonus = Number.isInteger(ch.proficiencyBonus)
    ? Math.max(2, Math.min(6, ch.proficiencyBonus))
    : getProficiencyBonus(ch.level || 1);
```

### WR-05: `saveCharacter` does not validate level bounds before computing proficiency / persisting

**File:** `features/party/party-crud.js:263, 275`

**Issue:** `level: parseInt($('char-level').value) || 1` accepts any integer the user types (the HTML `max="20"` is trivially bypassable via DevTools/import, per CLAUDE.md "never trust client-side validation"). A level of `0`, `-3`, or `500` is stored as-is. `getProfBonus(level)` may clamp, but the raw out-of-range `level` is persisted and later drives XP-threshold lookups in `party-details.js:254` (`XP_LEVEL_THRESHOLDS[nextLevel - 1]`), where a level above 19 indexes past the array (returns `undefined`, masked by `|| 0`, but producing a misleading "/ 0 XP" threshold) and a level ≤ 0 produces negative indices.

**Fix:** Clamp on save:
```javascript
level: Math.max(1, Math.min(20, parseInt($('char-level').value) || 1)),
```

### WR-06: `damageType` stored from free-text input with no whitelist (inconsistent with damage-formula hardening)

**File:** `features/party/party-crud.js:245`

**Issue:** Attacks validate the `damage` formula against a strict regex and the `name` is length-capped, but `damageType: typeEl ? typeEl.value.trim() : ''` is stored as arbitrary free text (only `maxlength="30"` in HTML, which is bypassable). It is later rendered in `party-details.js:219` as `<span class="char-attack-type-badge">${safeType}</span>` — `safeType` IS escaped there, so this is not an active XSS, but storing unvalidated type strings undermines the otherwise-strict attack-validation contract and allows junk values that won't match `DAMAGE_TYPES`. Lower severity because the render path escapes; flagged for consistency with the hardening done on `damage`.

**Fix:** Either map the input to a `<select>` of `DAMAGE_TYPES` keys, or validate against `Object.keys(DAMAGE_TYPES)` / a known-label whitelist on save and drop unknown values.

## Info

### IN-01: `roll-char-attack-stop` flags crit/fail off non-d20 dice

**File:** `ui/actions/entity-actions.js:181-182`

**Issue:** `isCrit = (parsed.keptRolls || rolls).some(r => r === 20)` is applied to *both* the hit roll (`1d20+x`) and the damage roll (`1d8+3`, etc.). For a damage formula the "20" check is meaningless and a `1d20` damage die (rare but possible via the validated formula) or any die that happens to roll 20 would spuriously trigger the crit visual. Hit rolls are correct; damage rolls should not be crit-evaluated.

**Fix:** Only evaluate crit/fail when the formula is the d20 hit roll (e.g. pass an `isHitRoll` flag from the two call sites in `party-details.js`, or detect `/d20/` in the formula).

### IN-02: Dead/misleading action handlers retained alongside the new correct ones

**File:** `ui/actions/combat-actions.js:151-170`

**Issue:** Independent of the CR-01 signature bug, the codebase now has two roll systems: the broken `roll-attr-check`/`roll-char-save`/`roll-skill-check` (dice tab) and the correct `roll-char-attr-stop`/`roll-char-save-stop`/`roll-char-skill-stop` (detail modal, added in 06-03). Keeping both — one of which is wired but non-functional — is a maintenance trap. Once CR-01 is fixed, consider consolidating skill/attr/save roll math into a single shared helper used by both entry points.

**Fix:** After fixing CR-01, extract a shared `rollCharacterCheck(ch, {kind, key, adv})` and have both delegation paths call it.

### IN-03: Duplicate `getProficiencyBonus` definition in `testable-utils.js`

**File:** `utils/testable-utils.js:210` and `:393` (inside `calcSkillModifier` the formula is inlined again)

**Issue:** `getProficiencyBonus` is defined at line 210, but `calcSkillModifier` at line 393 re-inlines `Math.ceil((ch.level || 1) / 4) + 1` instead of calling it, and `getModifier`/`getAbilityModifier` logic is likewise inlined at line 392. Three copies of the same two formulas in one file increase the chance one is fixed and the others are not.

**Fix:** Call the local `getProficiencyBonus`/`getModifier` from within `calcSkillModifier` in the mirror, mirroring the production file's structure.

### IN-04: `RARITIES` vs `RARITY_LABELS`/`RARITY_COLORS` use divergent key casing (`veryRare` vs `veryrare`)

**File:** `core/constants.js:241-272`

**Issue:** `RARITIES` uses camelCase keys (`veryRare`) while `RARITY_LABELS`/`RARITY_COLORS` use lowercase (`veryrare`), and `RARITIES` includes `artifact`/`common` colors as CSS vars while the lowercase maps hardcode hex. This is not introduced by Phase 6 but sits in a Phase-6-modified file; a lookup with the wrong-cased key silently falls through to defaults. Worth a normalization pass.

**Fix:** Standardize on one key casing and derive one map from the other, or document the intentional split.

### IN-05: `formatModifier` used by Phase-6 code but not exported to `window`

**File:** `utils/game-rules.js:43, 213-218`

**Issue:** `formatModifier` is called in `party-details.js:152/181` and `entity-actions.js:121/144/164` but is not in the `window.*` export block (only `getProficiencyBonus`, `calcSkillModifier`, `canLevelUp`, `getXPForCR`, `distributeXP` are). In the concatenated build this works because `function formatModifier` is in the global lexical scope, but the inconsistency (sibling helpers like `getProficiencyBonus` ARE exported) is confusing and would break if anyone refactored these into an IIFE/module. Harmless today; flagged for export-audit consistency.

**Fix:** Add `window.formatModifier = formatModifier;` (and `window.getAbilityModifier`/`calculateLevelUpHP` if used cross-module) to the export block, or document why these intentionally rely on lexical scope only.

---

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
