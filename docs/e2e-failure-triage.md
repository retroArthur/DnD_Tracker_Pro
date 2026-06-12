# E2E Failure Triage (May 22, 2026)

Snapshot of the 26 pre-existing Playwright E2E failures discovered during the
inline-handler migration session. These failures were stable across all
migration commits (baseline = post-A = post-B = post-C), so they are pre-existing
issues unrelated to the migration.

**Baseline:** 140 tests total, 114 pass, 26 fail, ~10 min runtime, `chromium` only.

## Failure Clusters & Root-Cause Hypothesis

### 1. Persistence (5 tests) — Test spec checks wrong storage layer

Files: `tests/e2e/features/persistence.spec.js`, `tests/e2e/features/wiki.spec.js:363`

Sample test "Daten werden automatisch gespeichert":

- Step asserting `D.characters` contains the new character → **passes**
- Step asserting `localStorage` has any key with > 100 bytes → **fails**

In `file://` mode (which Playwright uses via `baseURL: file:///.../dist/...html`),
browsers heavily restrict `localStorage`. The app falls back to **IndexedDB** for
real persistence, but the test only inspects `localStorage`.

**Fix path:** Update test assertions to also check IndexedDB (or detect the
storage layer via the app's `StorageAPI`).

**Severity:** Test-spec bug, not an app bug.

---

### 2. Initiative (6 tests) — Stale selectors

File: `tests/e2e/features/initiative.spec.js`

Sample test "sollte mehrere Combatants sortiert nach Initiative anzeigen":

- `await nameInput.fill(name)` times out after 30s
- Locator: `page.locator('#combatant-name, [name="combatant-name"]').first()`
- **Neither `#combatant-name` nor any element with `name="combatant-name"` exists in the built HTML.**

The test helper `addCombatant()` is built around an Add-Combatant modal/form
that has either been redesigned or removed. The same helper underpins all
6 failing initiative tests.

**Fix path:** Identify the current Add-Combatant flow (probably via Encounter
Calculator → "Add to Initiative", or a different modal), and rewrite the
helper to drive that flow.

**Severity:** Stale test infrastructure.

---

### 3. Tab-Navigation (8 tests) — Container present but `hidden`

File: `tests/e2e/tab-navigation.spec.js`

Sample test "dice tab renders random tables when switched to":

- `expect(container).toBeVisible()` fails (`Received: hidden`)
- Locator matches `<div id="random-tables-list">` 9 times — likely picking up
  duplicate or shadow instances. (IDs should be unique; possibly nested
  template instances or stale snapshots.)

**Fix path:** Investigate why multiple `#random-tables-list` candidates exist
in the DOM after tab switch. Could be: HMR/re-render duplication, modal
instances, or a CSS visibility bug.

**Severity:** Could be app bug (DOM duplication) or test issue. Needs reproduction.

---

### 4. CRUD Undo (3 tests) — Undo path broken or test expectation wrong

Files: `tests/e2e/crud/{npcs,locations,party}.spec.js` — "Löschen kann
rückgängig gemacht werden"

Sample (party.spec.js:248): After delete + undo, the test expects the
restored character data:

```
expect(charData).toBeTruthy();  // received: undefined
```

So the entity is not present in `D.characters` after the undo. Either:

- Undo doesn't restore character deletion (regression / never worked here), or
- Test reads the data from the wrong place

**Fix path:** Manually verify the undo flow in the browser. If it works
interactively, fix the test query; if it doesn't, this is a real app bug.

**Severity:** Possible app regression — worth manual verification.

---

### 5. CRUD Validation (3 tests) — Implementation details changed

Files:

- `crud/encounters.spec.js:87` "Attribut-Modifikatoren werden berechnet"
- `crud/party.spec.js:86` same name
- `crud/quests.spec.js:77` "Quest ohne Titel zeigt Fehlermeldung"

These test specific UI feedback (computed modifiers shown next to inputs;
error messages on empty submit). Likely stale selectors / changed behavior.

**Fix path:** Inspect each assertion against current UI.

**Severity:** Likely stale tests.

---

### 6. Workflows / Integration (2 tests)

- `integration/workflows.spec.js:115` Multiple Undo/Redo — probably overlaps with
  Cluster 4 (Undo)
- `integration/workflows.spec.js:239` Keyboard-Navigation mit Zahlen — keys 1-9
  should switch tabs. Either keyboard handler changed or the assertion is for
  a tab that no longer exists.

**Fix path:** Triage each individually.

---

## Recommended Next Steps

In priority order, when these become worth fixing:

1. **Cluster 4 (CRUD Undo)** — verify manually in browser. If broken there,
   it's a real bug. If only test fails, fix the test.
2. **Cluster 2 (Initiative)** — biggest cluster, single shared helper. One
   focused fix on `addCombatant()` likely unblocks all 6 tests.
3. **Cluster 1 (Persistence)** — test spec issue, low user-impact, can wait.
4. **Cluster 3 (Tab-Navigation)** — needs DOM investigation; the duplicate-id
   finding is a yellow flag worth understanding regardless of test outcome.
5. **Cluster 5+6** — small clean-ups, address after Cluster 2 fix.

## Why Not Fixed In This Session

User scope decision (May 22, 2026): triage and document, not fix. These have
been failing since before the inline-handler migration started; fixing them
would be a separate workstream needing its own session and verification budget.
