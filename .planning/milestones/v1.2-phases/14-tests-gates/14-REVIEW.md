---
phase: 14-tests-gates
reviewed: 2026-09-07T08:10:37Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - .github/workflows/ci.yml
  - core/init.js
  - eslint.config.js
  - eslint.generated-globals.js
  - jest.config.cjs
  - package.json
  - systems/avatars.js
  - tests/e2e/crud/encounters.spec.js
  - tests/e2e/crud/locations.spec.js
  - tests/e2e/crud/npcs.spec.js
  - tests/e2e/crud/party.spec.js
  - tests/e2e/crud/quests.spec.js
  - tests/e2e/features/fraktionen.spec.js
  - tests/e2e/features/inspiration.spec.js
  - tests/e2e/features/npc-generator.spec.js
  - tests/e2e/features/reise.spec.js
  - tests/e2e/features/session-prep.spec.js
  - tests/e2e/features/timeline.spec.js
  - tests/e2e/helpers/test-utils.js
  - tests/unit/eslint-globals-freshness.test.js
  - tests/unit/fraktionen.test.js
  - tests/unit/module-test-coverage.test.js
  - tests/unit/npc-generator.test.js
  - tests/unit/reise.test.js
  - tests/unit/session-prep.test.js
  - tests/unit/timeline.test.js
  - tools/generate-eslint-globals.js
  - tools/package.json
  - tsconfig.strict.json
  - types/globals.d.ts
  - ui/actions/entity-actions.js
  - ui/actions/system-actions.js
  - ui/actions/ui-actions.js
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-09-07T08:10:37Z
**Depth:** standard
**Files Reviewed:** 29
**Status:** issues_found

## Summary

Phase 14 ("Tests & Gates") touches CI config, ESLint/TypeScript gate configuration, a
generated-globals tool, several test-infrastructure files, and a handful of dead
`data-action` removals in the three `ui/actions/*.js` files. Diffs were traced against
`94db4bde9103a3620f2879566509a16ca1b6448d^` and cross-checked by actually running the
affected tools (`npx eslint . --max-warnings 367`, `npx tsc --noEmit`, `npx tsc -p
tsconfig.strict.json`, targeted `npx jest` runs) rather than trusting the code on
inspection alone.

Most of the phase holds up well under adversarial scrutiny: the `no-undef: 'error'`
upgrade is empirically clean (0 errors / exactly 367 warnings, matching the new
`--max-warnings` ratchet precisely), `tsconfig.strict.json`'s allow-list currently
type-checks cleanly, the `export-csv` → `exportToCSV` rename is verified correct against
the real implementation, the five dead `data-action` removals are confirmed absent from
`assets/templates/**` and from source, and the `welt-story.spec.js` → five per-feature
spec files split is byte-identical (verified via diff) — a genuinely clean mechanical
split, not a rewrite that silently dropped assertions. The new `seedCleanSession()`
helper's design was checked against `core/data.js`'s `initializeData()` default schema
and `load()`'s `Object.assign()` merge semantics and is correct.

One finding is classified **BLOCKER**: the module-to-test coverage gate added in this
phase (`tests/unit/module-test-coverage.test.js`, TEST-05/D-13) has a verified
false-positive — its "is this module covered by a test?" check does not filter test
files by type, so a module is treated as "covered" if its path merely appears inside a
**Python** file under `tests/build/`. Eight real JS modules currently pass the gate
this way with **zero actual JS test coverage**, defeating the gate's stated purpose.

## Critical Issues

### CR-01: Module-to-test coverage gate accepts non-JS-test matches as "covered", masking 8 real gaps

**File:** `tests/unit/module-test-coverage.test.js:60-71` (the `walk()`/`isCovered()` helpers)

**Issue:** `walk(TESTS_DIR)` recursively collects **every file** under `tests/` with no
extension filter, and `isCovered()` then does a plain substring search over all of
their contents. `tests/build/test_build_deduplication.py` (a Python test for the
build-time duplicate-declaration checker, unrelated to JS test coverage) happens to
enumerate `loader.js`-registered module paths in its own comments/assertions for a
completely different purpose (verifying `build.py`'s module-registration behavior).
Because `isCovered()` doesn't distinguish a Python file from a Jest spec, any module
path that is merely *mentioned* there is marked "covered" — even though no JavaScript
test in the repository ever loads or exercises that module.

Verified concretely: the following 8 modules are in `loader.js MODULES`, are **not**
present in `MODULE_TEST_EXCEPTIONS`, and have **zero** matches in any `.js` file under
`tests/` (unit, integration, or e2e) — their *only* match anywhere under `tests/` is in
`tests/build/test_build_deduplication.py`:

- `features/spells/spell-manager.js`
- `features/bestiary/bestiary-editor.js`
- `features/initiative-loot.js`
- `features/initiative-combat-widgets.js`
- `features/dmscreen/dmscreen-widgets-base.js`
- `features/dmscreen/dmscreen-widgets-combat.js`
- `features/dmscreen/dmscreen-widgets-reference.js`
- `ui/editors/rich-text-toolbars.js` (a non-trivial, user-facing rich-text editor
  toolbar module)

This directly contradicts the file's own header comment ("ein Modul gilt als von einem
Test angefasst, wenn sein `loader.js`-relativer Pfad ... in mindestens einer Datei
unter `tests/` vorkommt" — intended to mean *a JS test*, per the surrounding prose about
"Modulpfad zusammensetzen und Datei einlesen") and defeats the explicit prohibition in
the same file ("ein neues, unabgedecktes Modul ... aufzunehmen UND es hier einzutragen
statt einen Test dafuer zu schreiben, ist ausgeschlossen") — these 8 modules are
*already* in that exact unabgedeckt-and-uncaught state today, silently, because the gate
itself has a blind spot rather than because someone added an exception-list entry.
Reproduce with:

```bash
grep -rl "ui/editors/rich-text-toolbars.js" tests/
# → only tests/build/test_build_deduplication.py
npx jest tests/unit/module-test-coverage.test.js   # currently PASSES (false green)
```

**Fix:** Restrict the file collection (or the match) to actual JS test files, mirroring
the sibling gate `tests/unit/eslint-globals-freshness.test.js`'s narrower scope, e.g.:

```javascript
function walk(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(walk(full));
        } else if (full.endsWith('.js')) {   // <-- exclude tests/build/**/*.py, .pyc, etc.
            results.push(full);
        }
    }
    return results;
}
```

After this fix, re-run the gate: the 8 modules above will fail and must either receive
real tests or be added — visibly and deliberately — to `MODULE_TEST_EXCEPTIONS` (which
is the behavior the file's own header comment already describes as the intended
outcome for genuinely untested modules).

## Warnings

### WR-01: `generate-eslint-globals.js`'s declaration regex silently drops destructured/multi-var top-level globals

**File:** `tools/generate-eslint-globals.js:65` (`DECLARATION_PATTERN`)

**Issue:** `DECLARATION_PATTERN = /^\s*(?:async\s+)?(function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/`
only captures a single identifier immediately following the keyword. A top-level
declaration such as `const { FOO, BAR } = window.X;` or `let a, b;` at brace-depth 0
would silently contribute **zero** names to `eslint.generated-globals.js`, even though
both `FOO`/`BAR` (or `a`/`b`) would be real cross-module globals used elsewhere. Given
that `eslint.config.js` now sets `'no-undef': 'error'` (this same phase's D-08 change),
a single such declaration introduced in the future would cause `npm run lint` to fail
the whole CI job with `no-undef` errors that look like a random regression rather than
what they actually are (a generator blind spot) — and the failure would not be caught
by `tests/unit/eslint-globals-freshness.test.js`, since that test only diffs the
generator's own output against itself, not against a hand-verified ground truth.

No occurrence of this pattern exists in the current `loader.js MODULES` set (verified
by scanning all listed source files), so this is latent rather than actively firing —
but it's a real gap in a generator whose whole job is to make `no-undef: 'error'` safe.

**Fix:** Either broaden the regex to also match comma-separated and destructured
top-level bindings, or add an explicit code comment + a guard test asserting that no
top-level `const {`/`const [`/multi-var declaration exists in any `loader.js`-listed
module (fail loudly instead of silently under-generating).

### WR-02: `seedCleanSession()`'s hardcoded storage payload will silently stop working if `core/data.js`'s default schema changes

**File:** `tests/e2e/helpers/test-utils.js:34-76`

**Issue:** `seedCleanSession()`'s correctness depends on an implicit contract with
`core/data.js:initializeData()` (which array/object keys already exist as defaults
before `load()`'s `Object.assign(D, p)` runs) and with `render/helpers.js:
validateDataIntegrity()`'s `requiredArrays` list (which keys must exist or a repair
`save()` fires 1s after boot). The seed payload was verified correct against the
*current* state of both files, but nothing ties them together: if a future change adds
a new required top-level array/object to either `initializeData()` or
`validateDataIntegrity()`'s `requiredArrays`/`requiredObjects` without a matching update
to `seedCleanSession()`, the toast race this helper was written to prevent (08-RESEARCH
Pitfall 4 / D-06) would silently reappear — flaky E2E failures with no direct link back
to the actual root cause (this Phase 14 file goes untouched, so it wouldn't be an
obvious suspect during a future debugging session).

**Fix:** Add a short inline comment at the top of `seedCleanSession()` cross-referencing
`render/helpers.js:validateDataIntegrity()`'s `requiredArrays`/`requiredObjects` lists
and `core/data.js:initializeData()`'s default keys explicitly by name, so a future
change to either is more likely to prompt a corresponding update here (this is a
documentation/maintainability gap, not a currently-active bug — the payload is correct
today).

## Info

### IN-01: `package.json`'s `lint` gate is an exact-match ratchet with zero slack

**File:** `package.json:24` (`"lint": "eslint . --max-warnings 367"`)

**Issue:** The current warning count is exactly 367 (verified by running `npx eslint .
--max-warnings 367`, which reports `✖ 367 problems (0 errors, 367 warnings)`). This is
presumably intentional (matches the project's "ratchet, never loosen" philosophy seen
elsewhere in this phase, e.g. `jest.config.cjs`'s coverage thresholds), but it means any
contributor who introduces even a single new unrelated warning (e.g. touching an
existing file that trips `no-unused-vars`) will fail CI with a somewhat opaque
`--max-warnings` message rather than a clear diff against a baseline. Not a defect, just
worth flagging since the number 367 has no comment in `package.json` itself explaining
that it's a measured ratchet value (unlike, e.g., `jest.config.cjs`'s coverage
thresholds, which do carry such a comment).

**Fix (optional):** Add a one-line comment near the script (package.json doesn't support
comments natively, so this would need to live in `CLAUDE.md`/`docs/` or a sibling
`.md`) noting the ratchet nature and regeneration method, analogous to the
`eslint.generated-globals.js` header.

### IN-02: `tsconfig.strict.json`'s allow-list only covers 8 files; base `typecheck` (`tsc --noEmit`) has `checkJs: false`

**File:** `tsconfig.strict.json`, `tsconfig.json:11`

**Issue:** Not a bug — this is explicitly documented as an intentional, incremental
rollout in `tsconfig.strict.json`'s own header comment — but worth surfacing for the
record: `npm run typecheck` (`tsc --noEmit`, base `tsconfig.json`) runs with
`checkJs: false`, so it does not actually type-check the bodies of `.js` files; it only
validates `.d.ts` declaration consistency and JS syntax. The *only* file for which real
`checkJs` type errors are caught in CI is the 8-file allow-list in
`tsconfig.strict.json` (plus `types/**/*.d.ts`). This means the vast majority of the
`.js` source tree currently has no compiler-enforced type safety at all despite the new
`typecheck:strict` CI step's name suggesting broader coverage. Confirmed both
`npm run typecheck` and `npm run typecheck:strict` currently pass cleanly.

---

_Reviewed: 2026-09-07T08:10:37Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
