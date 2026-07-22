---
phase: 08-test-fundament-gr-n
reviewed: 2026-07-22T23:22:59Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - .github/workflows/ci.yml
  - assets/styles/migration.css
  - docs/e2e-failure-triage.md
  - features/render-dashboard.js
  - systems/migration/migration-wizard.js
  - tests/e2e/app.spec.js
  - tests/e2e/crud/encounters.spec.js
  - tests/e2e/crud/npcs.spec.js
  - tests/e2e/crud/party.spec.js
  - tests/e2e/crud/quests.spec.js
  - tests/e2e/features/bestiary.spec.js
  - tests/e2e/features/character-advancement.spec.js
  - tests/e2e/features/dice-stats.spec.js
  - tests/e2e/features/initiative.spec.js
  - tests/e2e/features/welt-story.spec.js
  - tests/e2e/tab-navigation.spec.js
  - tests/integration/encounter-builder.test.js
  - tests/unit/action-registry-collisions.test.js
  - tests/unit/action-registry.test.js
  - tests/unit/initiative-mob.test.js
  - tests/unit/stability.test.js
  - tests/unit/welt-story.test.js
  - ui/actions/combat-actions.js
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-07-22T23:22:59Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

This phase's actual diff (`git diff 9cf67ac^..HEAD`) is much narrower than the 22-file
review scope suggests: most of the listed files only picked up comments or one-line
assertion tightenings. The real changes are: (1) a 3-line production fix in
`ui/actions/combat-actions.js` removing a duplicate/broken `data-action` registration,
(2) an 8-line `renderAll()` dispatch fix in `features/render-dashboard.js`, (3) a small
CSS/JS pair (`migration.css` + `migration-wizard.js`) fixing a fixed-banner layout-offset
bug, (4) a new static-analysis regression test
(`tests/unit/action-registry-collisions.test.js`), (5) a new blocking `e2e` job in
`ci.yml`, and (6) substantial E2E assertion-hardening across the CRUD/tab-navigation
specs (removing `isVisible()` masking guards, swapping `waitForTimeout` for
`waitForSelector`/`waitForFunction`, tightening `toBeGreaterThan(0)` to exact `toBe(N)`
where the outcome is deterministic).

The production fixes were traced back to their root causes and verified correct against
the actual handler implementations (`entity-actions.js`, `initiative-mob.js`,
`utilities.js`/`validation.js`). No bugs were found in the three production-code changes
themselves. The hardened E2E assertions were spot-checked against the DOM/behavior they
claim to test (toast class, error-message wording, `#encounter-round-num` field names,
etc.) and are accurate.

Three issues remain, all in the test/regression layer this phase built specifically to
raise trust in the CI gate — which is why they're flagged rather than waved through:
one E2E test still contains a leftover tautological assertion that silently defeats the
exact "Undo funktioniert" contract the phase's own documentation claims is now verified;
the new collision-detection regression test has a blind spot for one of the two key
styles used in `ui/actions/*.js`; and a ~65-line environment-seeding block was
copy-pasted byte-for-byte into three spec files instead of being extracted to the
already-imported shared helpers module.

## Warnings

### WR-01: "Löschen kann rückgängig gemacht werden" (encounters) never actually asserts undo restored the entity

**File:** `tests/e2e/crud/encounters.spec.js:261-302`
**Issue:** This test was touched in this phase specifically to remove its `isVisible()`
masking guard (per the inline comment added at line 277-280, matching the D-05/D-06
Task-2b pattern applied to the sibling `party.spec.js`/`npcs.spec.js`/`quests.spec.js`
undo tests). But unlike those three siblings — which now assert
`expect(charData).toBeTruthy()` / `expect(questData...)` against the actually-restored
entity — this test's final assertion is still:

```js
// Test ist erfolgreich wenn entweder:
// 1. Undo funktioniert hat (countAfter >= countBefore)
// 2. Oder das Monster wurde zumindest gelöscht (Löschfunktion funktioniert)
expect(countAfter >= 0).toBe(true);
```

`D.encounters.length` is always `>= 0` by definition (array length can't be negative)
— this assertion cannot fail regardless of whether undo restores the encounter, deletes
it permanently, or leaves it deleted and adds three more. It is a no-op wearing the shape
of a test. `docs/e2e-failure-triage.md` (also in this review's scope) explicitly claims
in the "Phase 8 — Resolution" section that "Der Undo-Pfad funktioniert korrekt" is
verified for all 5 "Löschen kann rückgängig gemacht werden" tests including
`crud/encounters.spec.js` — that claim is not actually backed by this test's assertion.
Given the whole stated purpose of this phase (D-07, "Gate-Vertrauenswürdigkeit") was to
eliminate exactly this class of always-green assertion so the new blocking `e2e` CI job
can be trusted, this is a direct regression against the phase's own success criterion:
if `undo()` for encounters silently breaks tomorrow, this test — and the CI gate now
guarding merges — will not catch it.
**Fix:**
```js
const countAfter = await page.evaluate(() => (D.encounters ? D.encounters.length : 0));
expect(countAfter).toBe(countBefore);

const encData = await page.evaluate(name => {
    // @ts-ignore
    return D.encounters ? D.encounters.find(e => e.name && e.name.includes(name)) : null;
}, encName);
expect(encData).toBeTruthy();
```

### WR-02: New action-collision regression test has a blind spot for unquoted-key registrations

**File:** `tests/unit/action-registry-collisions.test.js:34`
**Issue:** `scanActionKeysByFile()` scans `ui/actions/*.js` with
`/^\s*'([a-zA-Z0-9_-]+)':/gm`, which only matches keys written with single quotes
(`'foo': ...`). `ui/actions/system-actions.js` registers several actions with the
unquoted identifier shorthand instead (`undo: () => undo()`, `redo: () => redo()`,
`exportSpellAsMarkdown: () => {...}`, `importSpellMarkdown`, `exportNPCAsMarkdown`,
`importNPCMarkdown`, `exportQuestAsMarkdown`, `importQuestMarkdown` — 8 keys total,
confirmed via `grep -n "^\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*(" ui/actions/*.js`). None of
these 8 keys are captured by the regex, so a future duplicate registration of e.g.
`undo` in another `ui/actions/*.js` file (the exact last-write-wins failure mode this
test's own docstring says it exists to catch, per the Pitfall 1/2 incident) would pass
this test silently. This doesn't currently mask a live collision (no duplicates exist
today for these 8 keys), but it undermines the completeness the test's docstring implies
("scannt jede Datei... nach registrierten data-action-Schlüsseln").
**Fix:** Broaden the regex to match both quote styles and the unquoted-identifier
shorthand, e.g.:
```js
const re = /^\s*(?:'([a-zA-Z0-9_-]+)'|"([a-zA-Z0-9_-]+)"|([a-zA-Z_$][a-zA-Z0-9_$]*))\s*:/gm;
// then: const key = match[1] || match[2] || match[3];
```
and add a regression fixture asserting `undo`/`redo` are picked up by
`scanActionKeysByFile()`.

### WR-03: ~65-line environment-seed block duplicated verbatim across three spec files

**File:** `tests/e2e/crud/party.spec.js:19-79`, `tests/e2e/crud/npcs.spec.js:19-79`,
`tests/e2e/crud/quests.spec.js:19-79`
**Issue:** The `page.addInitScript(...)` block that seeds `localStorage['dnd-tracker-v4']`
with `markdownOnboardingSeen: true`, empty `randomTables`/`timers`/`shops`/`campaign`,
and a fully-populated `_nextId` map (added in this phase to fix the toast-race documented
in `docs/e2e-failure-triage.md` fail #7) is byte-for-byte identical in all three files
(verified via `md5sum` on the extracted block — all three hash to
`6364cafedc46ba23962c342745340154`). All three files already import shared helpers from
`tests/e2e/helpers/test-utils.js` (`loadApp`, `navigateToTab`, `fillField`,
`performUndo`, ...), so there was an existing, natural place to put this. As written, a
future change to the seed shape (e.g. adding a new default-schema key that needs
seeding) requires editing three files in lockstep, and it's easy to update one and miss
the others — silently reintroducing the toast-race flakiness this phase fixed, in
whichever spec file gets missed.
**Fix:** Extract into `tests/e2e/helpers/test-utils.js`, e.g.:
```js
export async function seedValidatedAppState(page) {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('dnd-tracker-v4', JSON.stringify({ /* ... */ }));
        } catch {
            // file:// localStorage restrictions vary by browser build.
        }
    });
}
```
and call `await seedValidatedAppState(page);` from each `test.beforeEach`.

## Info

### IN-01: Divergence-Banner CSS offset still hardcoded, inconsistent with this phase's own dynamic-height fix

**File:** `assets/styles/migration.css:360-362`
**Issue:** This phase (Pitfall 3) fixed `#migration-hint-banner` covering the sticky
header by measuring the banner's real `offsetHeight` at runtime and writing it to
`--migration-hint-height` (`systems/migration/migration-wizard.js:399-404`), explicitly
because "kann durch Zeilenumbruch bei schmalen Viewports groesser als das CSS
min-height:48px sein" (comment at `migration.css:304-307`). The pre-existing sibling
rule for the divergence banner was not given the same treatment and still hardcodes the
assumption it just proved wrong:
```css
.migration-hint-banner ~ .divergence-banner {
    top: 48px;
}
```
Both banners are only both-visible for a brief window inside `startMigrationFlow()`
(divergence banner is shown, then the hint banner is `.remove()`d a few lines later), so
impact is low, but on a narrow viewport where the hint banner's text wraps past 48px
this rule would position the divergence banner to overlap the (still momentarily visible)
hint banner — the same visual bug class Pitfall 3 was written to eliminate elsewhere.
Not introduced by this phase (the rule itself is unchanged in the diff), but adjacent to
and undermined by this phase's own fix, and within this review's file scope.
**Fix:** Reuse the same custom property: `.migration-hint-banner ~ .divergence-banner { top: var(--migration-hint-height, 48px); }`.

---

_Reviewed: 2026-07-22T23:22:59Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
