# Phase 8: Test-Fundament grün - Pattern Map

**Mapped:** 2026-07-22
**Files analyzed:** 11
**Analogs found:** 10 / 11

**Note on this phase:** RESEARCH.md already contains exact line numbers, before/after code diffs, and root-cause analysis for every source-level fix (Pitfalls 1–8, Code Examples section). This PATTERNS.md does not repeat that diagnostic work — it focuses on the *codebase conventions* (test structure, CI job shape, doc format) the planner needs to write the two genuinely new files (a Jest unit test, a CI job) and to touch existing files consistently with house style.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `ui/actions/combat-actions.js` | event-handler module | event-driven | *(self-edit, see RESEARCH.md Pitfall 1/2 for exact diff)* | n/a — surgical deletion, no analog needed |
| `features/render-dashboard.js` | render-orchestration | batch/event-driven | *(self-edit, see RESEARCH.md Pitfall 7 for exact diff)* | n/a — 2-line addition, no analog needed |
| `assets/styles/migration.css` | config/CSS | request-response (layout) | same file, `.migration-hint-banner ~ .divergence-banner` rule (lines 352-354) | exact — extend existing compensation pattern in the same file |
| `systems/migration/migration-wizard.js` | utility/UI-state | event-driven | same file's existing `showMigrationHintBanner()` / `close-migration-hint` handler | exact — add a `body` class toggle alongside existing show/hide logic |
| `tests/unit/action-registry-collisions.test.js` (NEW) | test (unit) | file-I/O / static-analysis | `tests/unit/action-registry.test.js` | role-match (fs/path/vm-based static scan of source files, no DOM) |
| Migration-banner regression test (NEW, e2e or unit — planner's choice) | test | request-response / DOM-geometry | `tests/e2e/app.spec.js` (existing `#global-search` focusability test at line 69) | exact — same file, same subject, extend rather than create new file if feasible |
| `tests/e2e/tab-navigation.spec.js` | test (e2e) | request-response | itself (existing structure, fixing 6 stale selectors — see RESEARCH.md Pitfalls 5/6/7/8) | n/a — in-place fix |
| `tests/e2e/app.spec.js` | test (e2e) | request-response | itself (existing structure) | n/a — in-place fix, add banner-dismiss setup step |
| `tests/e2e/crud/quests.spec.js`, `crud/npcs.spec.js`, `crud/party.spec.js` | test (e2e) | request-response | `tests/e2e/helpers/test-utils.js`'s `loadApp()` pattern | exact — add `page.addInitScript()` seeding before `loadApp()` |
| `docs/e2e-failure-triage.md` | documentation | append-only log | itself (existing Cluster 1-4 sections) | exact — append per-fail rows in existing format |
| `.github/workflows/ci.yml` | config (CI pipeline) | batch/CI | same file's `smoke-test:` job (lines 53-79) | exact — same runner pattern (checkout, setup-node, setup-python, npm ci, playwright install, run tests, upload artifact-on-failure) |

## Pattern Assignments

### `tests/unit/action-registry-collisions.test.js` (NEW test, static-analysis/file-I/O)

**Analog:** `tests/unit/action-registry.test.js`

**Imports pattern** (lines 7-9 of analog):
```javascript
const fs = require('fs');
const path = require('path');
const vm = require('vm');
```
For the new collision-detection test, `vm` is not needed (no code execution, pure regex scan) — only `fs`/`path`, matching the simpler pattern used in `tests/unit/file-backup.test.js:9-10` and `tests/unit/full-export.test.js:8-9`.

**Header/banner comment convention** (analog lines 1-5):
```javascript
/**
 * Action-Registry Tests — TECH-04 (Wave-0 RED-Phase, jetzt GREEN)
 * Testet searchActions() Fuzzy-Suche des Command-Palette Aktions-Registers.
 * GREEN-Phase: Implementierung aus Plan 02-05, Welle 2.
 */
```
New file should follow the same German-comment, phase-reference banner style, e.g. referencing Phase 8 / D-02 and Pitfall 1.

**Core static-scan pattern** — reuse RESEARCH.md's already-verified, already-run scan script verbatim (RESEARCH.md "Pattern: EventDelegation Last-Write-Wins Collision Detection" section, lines 180-197 of RESEARCH.md):
```javascript
// Source: RESEARCH.md verification script — already run and validated against
// the current codebase; adapt into an `it()` block with fs.readdirSync/readFileSync
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../../ui/actions');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
const seen = {};
for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const re = /^\s*'([a-zA-Z0-9_-]+)':/gm;
    let m;
    while ((m = re.exec(content))) {
        (seen[m[1]] ??= []).push(f);
    }
}
// assert: no key maps to >1 distinct file (after the Pitfall 1/2 fix is applied,
// this list should be empty; 'apply-quick-action' collision is pre-existing/harmless
// per RESEARCH.md and may need an explicit allowlist if not also cleaned up)
```

**Test structure convention** — `describe`/`it` German test names, one assertion focus per `it`, matching suite convention (`TESTING.md`: "Deutsche Testnamen (\"sollte …\")"). Example structure to mirror (from `action-registry.test.js`'s later body, standard Jest):
```javascript
describe('Action-Registry: keine doppelten data-action Keys', () => {
    it('sollte keine data-action Keys mehrfach in ui/actions/*.js registrieren', () => {
        // scan + expect(duplicates).toEqual([]) or toHaveLength(0)
    });
});
```

---

### `.github/workflows/ci.yml` — new `e2e` job (D-03)

**Analog:** same file's `smoke-test:` job (lines 53-79)

**Job skeleton pattern** (analog, lines 53-67):
```yaml
smoke-test:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - uses: actions/setup-python@v5
        with:
          python-version: '3.x'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
```

**Key deviations required for the new `e2e` job** (per RESEARCH.md's "CI job addition for D-03" code example — use RESEARCH.md's exact YAML, it is already validated against this file's structure):
- `needs:` should NOT be `[build]` (that triggers the production-build artifact path) — use `[lint-and-typecheck, test]` directly and do its own `python build.py` (**dev** build, not `--production`), since D-03 explicitly requires `npm run build:dev`.
- Artifact-on-failure step uses `if: failure()` + `actions/upload-artifact@v4`, mirroring the general upload pattern but pointing at `tests/e2e/reports/` and `tests/e2e/test-results/` instead of `production-build`.
- No `SMOKE_BASE_URL` env var — the e2e job runs against `file://` per `playwright.config.js` defaults, not an HTTP server (smoke-test's `python -m http.server` step is NOT needed here).
- Per RESEARCH.md Open Question 1: also add `e2e` to `build`'s (or `smoke-test`'s) `needs:` array so a red e2e run transitively blocks `deploy`, matching "blockierend".

**Full recommended job body:** see RESEARCH.md § "CI job addition for D-03" (already written, ready to paste with only the `needs:` chain decision left to the planner).

---

### `docs/e2e-failure-triage.md` — per-fail append (D-07)

**Analog:** itself — read existing Cluster sections to match format before appending.

**Format required by D-07/CONTEXT.md** (verbatim from CONTEXT.md line 97): each entry needs Klassifikation (Test-Bug | App-Bug) + Root-Cause in one sentence + Fix-Beschreibung + Commit-Hash. Use whichever structural convention (table vs. prose sections) the existing document already uses for Clusters 1-3 — do not introduce a second format in the same file. Also mark the Cluster 3 "9× DOM duplication" theory as **corrected/superseded** (RESEARCH.md Pitfall 6) and Cluster 4 (Undo-nach-Delete) as **resolved, no fix needed** (RESEARCH.md "Cluster 4 is resolved" section) — both are documentation-only edits, no code change.

---

### E2E spec touch-ups (`tab-navigation.spec.js`, `app.spec.js`, `crud/quests.spec.js`, `crud/npcs.spec.js`, `crud/party.spec.js`)

**Analog:** the files themselves — these are in-place fixes, not new files. Use `tests/e2e/helpers/test-utils.js`'s `loadApp()` (lines 11-17) as the integration point for the Pitfall 4 fix:

```javascript
// Source: tests/e2e/helpers/test-utils.js:11-17 (existing loadApp — do not modify this
// shared helper for a 3-spec-only fix; instead add page.addInitScript() in each
// affected spec's beforeEach, BEFORE calling loadApp(page))
export async function loadApp(page) {
    const filePath = `file:///${process.cwd().replace(/\\/g, '/')}/dist/dnd-tracker-bundled.html`;
    await page.goto(filePath);
    await page.waitForSelector('.app-title', { timeout: 10000 });
    await page.waitForTimeout(500);
}
```
Existing spec `beforeEach` convention to extend (from `tests/e2e/crud/quests.spec.js:16-19`):
```javascript
test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToTab(page, 'quests');
});
```
Add `await page.addInitScript(() => { localStorage.setItem(...) })` (or equivalent seeding of the onboarding-seen flag per RESEARCH.md Pitfall 4 option 1) **before** `await loadApp(page)` in this same block, in exactly the 3 affected spec files (`quests.spec.js`, `npcs.spec.js`, `party.spec.js`) — no change to the shared helper.

All exact selector/data-shape fixes for `tab-navigation.spec.js` and `app.spec.js` are fully specified with before/after code in RESEARCH.md (Pitfalls 5, 6, 7, 8, Code Examples section) — copy those diffs directly.

---

### Source fixes (`ui/actions/combat-actions.js`, `features/render-dashboard.js`, `assets/styles/migration.css`, `systems/migration/migration-wizard.js`)

These are 1-2 line surgical diffs fully specified in RESEARCH.md's Code Examples section (Pitfall 1/2 and Pitfall 7 fixes) — no additional analog search needed beyond what RESEARCH.md already did (it read the actual production source at the exact line numbers). For the migration-banner CSS fix, follow the existing sibling-combinator compensation precedent already in the same file:

```css
/* Source: assets/styles/migration.css:352-354 (existing precedent, extend this pattern
   to the main app header/body instead of only .divergence-banner) */
.migration-hint-banner ~ .divergence-banner { top: 48px; }
```

## Shared Patterns

### German test naming & section banners
**Source:** All files under `tests/unit/` and `tests/e2e/` (e.g. `action-registry.test.js:1-5`, `crud/quests.spec.js:1-14`)
**Apply to:** The new unit test file and all modified spec files.
```javascript
/**
 * [Feature] Tests — [Phase/Ticket ref]
 * Testet [German description of behavior under test]
 */
```

### CI job structure (checkout → setup-node → setup-python → npm ci → playwright install → run → upload-on-failure)
**Source:** `.github/workflows/ci.yml` `smoke-test:` job, lines 53-79
**Apply to:** New `e2e:` job — reuse this exact step sequence, swapping the server-start/env-var steps for a dev build + no-server file:// run per RESEARCH.md's ready-made YAML.

### Regression-test-per-app-bug (D-02)
**Source:** CLAUDE.md "Reproduce First" bugfix rule + RESEARCH.md's per-pitfall "Regression test (D-02)" subsections
**Apply to:** Every App-Bug fix in this phase (Pitfall 1/2 → unit test; Pitfall 3 → e2e/unit geometry test; Pitfall 7 → existing e2e test, confirmed sufficient once Pitfall 6 selector is fixed).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| Migration-banner layout-offset regression test (new, if implemented as a standalone DOM-geometry unit test rather than extending `app.spec.js`) | test | request-response | No existing DOM-geometry (`getBoundingClientRect()` overlap) unit test exists in this codebase to copy from; recommend extending `app.spec.js`'s existing e2e test instead (exact match available there) rather than inventing a new unit-test pattern for one assertion |

## Metadata

**Analog search scope:** `tests/unit/`, `tests/e2e/`, `tests/e2e/helpers/`, `.github/workflows/ci.yml`, `assets/styles/migration.css`, `ui/actions/`, `features/render-dashboard.js` — cross-referenced against RESEARCH.md's already-verified line-level findings (avoided re-deriving what RESEARCH.md already proved via live diagnostic scripts and direct source reads).
**Files scanned:** ~15 (targeted reads/greps; broad search was unnecessary since RESEARCH.md already pinpointed every source-level location)
**Pattern extraction date:** 2026-07-22
