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

### 2. Initiative (6 tests) — Stale selectors — ✅ RESOLVED (2026-06-14)

File: `tests/e2e/features/initiative.spec.js`

Sample test "sollte mehrere Combatants sortiert nach Initiative anzeigen":

- `await nameInput.fill(name)` times out after 30s
- Locator: `page.locator('#combatant-name, [name="combatant-name"]').first()`
- **Neither `#combatant-name` nor any element with `name="combatant-name"` exists in the built HTML.**

The test helper `addCombatant()` was built around an Add-Combatant modal/form
that never existed in the built HTML. The same broken helper underpinned all
6 failing initiative tests.

**Resolution (commit `a613023`):** The real Add-Combatant flow is an **inline
form** in `#view-initiative` (`assets/templates/view-encounters.html`), not a
modal: inputs `#init-name`, `#init-value` (initiative), `#init-hp`; submit
`[data-action="call"][data-value="addCombatant"]`. Replaced the per-test broken
helpers with one shared `addCombatant(page, name, init, hp)` and rewrote the 6
tests with real row/action selectors (`#init-list .init-entry`, `.init-name`,
`.init-entry.active`, `[data-action="remove-combatant"]`,
`[data-action="call"][data-value="nextTurn"|"prevTurn"]`, `#encounter-round-num`,
`[data-action="sort-initiative"]`, the `show-aoe-damage-modal` flow) and hard
assertions, removing the `isVisible()` guards that masked failures. 30/30
initiative E2E now pass, deterministic across repeats.

**Severity:** Stale test infrastructure — fixed.

> **Related finding (2026-06-14):** An adversarial audit of the rewrite found
> **10 *other* initiative tests still pass trivially** (no-op) — their entire
> bodies are wrapped in `if (await addBtn.isVisible())` guards on the same dead
> `[data-action="add-combatant"]` selector, so every assertion is skipped.
> Several (`sollte Schaden anwenden`, `Heilung`, `Concentration-Check`,
> `Death Saves bei 0 HP`, `Death Save Toggle`, `Condition entfernen`) also have
> **no `expect()` at all** (or a commented-out one). These are green but
> meaningless. Affected: `hinzufügen`, HP Management (2), Concentration (2),
> Death Saves (2), Conditions (2), Encounter Reset (1). **✅ RESOLVED
> (2026-06-14):** all 10 rewritten with real selectors + real assertions
> (119 expect() calls, 0 isVisible() guards remaining); full initiative suite
> 31/31 green, deterministic across repeats. Notable: the Encounter-Reset test's
> original expectation was wrong — `resetEncounter()` clears round/conditions/
> tempHp/exhaustion but does NOT remove combatants (asserted the real contract).
> All 6 audited features verified correctly wired — no app bugs surfaced.

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

> **KORRIGIERT (Phase 8, 2026-07):** Die "9× DOM duplication"-Theorie ist
> **empirisch widerlegt**. Eine Live-Diagnose gegen den gebauten Bundle
> (`document.querySelectorAll('#random-tables-list').length`) über mehrere
> Tab-Wechsel hinweg ergab **immer genau 1** DOM-Knoten. Die "9×"-Zahl in
> Playwrights Fehlerausgabe (`9 × locator resolved to <div id="random-tables-list">…`)
> ist Playwrights eigener **Retry-Poll-Zähler** — er re-resolved den Locator
> bei jedem Polling-Tick innerhalb des 5000ms-Expect-Timeouts und loggt jeden
> Versuch, das ist keine Evidenz für 9 unterschiedliche DOM-Knoten. Der
> tatsächliche Root-Cause war eine ambige `document.querySelector('.dice-details')`
> im Test selbst (4 gleichnamige `<details class="dice-details">`-Blöcke in
> `view-tools.html`, `querySelector` traf immer den ersten/falschen). Details
> und Fix siehe „Phase 8 — Resolution" unten (Fall 5). **Kein App-seitiger
> DOM-Duplikations-Fix nötig.**

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

> **AUFGELÖST (Phase 8, 2026-07) — durch vorherige Arbeit, kein Code-Fix
> nötig:** In der aktuellen Baseline (2026-07-22) laufen alle 5 "Löschen kann
> rückgängig gemacht werden"-Tests grün: `crud/encounters.spec.js:214`,
> `crud/locations.spec.js:196`, `crud/npcs.spec.js:265`,
> `crud/party.spec.js:248`, `crud/quests.spec.js:245`. Der Undo-Pfad
> funktioniert korrekt; die ursprüngliche Vermutung war vermutlich als
> Seiteneffekt einer der CRUD-Härtungsphasen zwischen der Mai-2026-Triage und
> heute (u. a. Phase 4's Initiative-Helper-Rewrite) behoben worden. Kein
> dedizierter Fix-Task in Phase 8 nötig — heutige Baseline dient als Beleg.

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

---

## Phase 8 — Resolution (2026-07)

Phase 8 ("Test-Fundament grün", v1.1 Tech-Debt & Härtung) took on exactly the
workstream deferred above. A fresh baseline measurement at phase start
(2026-07-22, commit `b23c82b`) found **11 stable, reproducible E2E fails**
(matching the documented clusters above) **plus 2 additional flaky fails**
that shared the same root cause as fail 7 below. All 13 are now fixed; the
full Playwright suite (233 tests) ran green twice in a row (231 passed / 2
skipped / 0 failed) before this document was written, and again after the
CI-gate work in this same plan. Root-cause analysis and every fix is detailed
in `.planning/phases/08-test-fundament-gr-n/08-RESEARCH.md`; this section is
the durable per-fail record required by D-07.

### 1. (App-Bug) Charakter-/Encounter-Attribut-Modifikator-Badge bleibt bei "+0"

**Root cause (ein Satz):** `combat-actions.js` registrierte `update-attr-mod`
und `update-enc-attr-mod` unter demselben `data-action`-Schlüssel wie
`entity-actions.js`, aber mit falscher Signatur (`ctx.value` statt
`ctx.target.dataset.value`), und überschrieb dessen korrekte Registrierung
per Last-Write-Wins (Ladereihenfolge in `loader.js`).
**Fix:** Die zwei falschen Duplikat-Registrierungen aus `combat-actions.js`
entfernt; `entity-actions.js`'s korrekte Handler bleiben unangefochten. Ein
permanenter statischer Jest-Regressionstest
(`tests/unit/action-registry-collisions.test.js`) verhindert künftige
`data-action`-Kollisionen strukturell.
**Betroffene Tests:** `crud/party.spec.js#Attribut-Modifikatoren werden
berechnet`, `crud/encounters.spec.js#Attribut-Modifikatoren werden berechnet`
(Cluster 5 oben).
**Commit:** `9cf67ac`

### 2. (App-Bug) Global Search unklickbar — Migrations-Hinweis-Banner ohne Layout-Offset

**Root cause (ein Satz):** Der einmalige `#migration-hint-banner`
(`position: fixed; top: 0`) legte sich ohne kompensierenden Layout-Offset über
den sticky Header (inkl. `#global-search`), sodass Klicks in den obersten
~48–61px des Viewports abgefangen wurden — ein echter, nutzersichtbarer Bug,
nicht nur ein Testartefakt.
**Fix:** `showMigrationHintBanner()` misst die tatsächliche gerenderte
Bannerhöhe (`offsetHeight`) und setzt sie als CSS-Custom-Property
(`--migration-hint-height`); `body.has-migration-hint` wendet sie als
`padding-top` an. Neuer geometrischer Regressionstest in `app.spec.js`
vergleicht `getBoundingClientRect()` von Banner und Header.
**Betroffener Test:** `app.spec.js#Global Search ist fokussierbar`
(Cluster 5/6-Umfeld).
**Commit:** `3bc7332`

### 3. (App-Bug) Undo/Redo lässt Würfel-/Timer-Panels veraltet zurück

**Root cause (ein Satz):** `renderAll()` (genutzt von `undo()`/`redo()`/Import)
dispatchte nur 14 der tatsächlich benötigten Render-Funktionen und ließ
`renderRandomTables` sowie `renderTimers` aus — beide sind aber im
`TAB_RENDER_REGISTRY` für den normalen Tab-Wechsel-Pfad registriert, sodass
zwei parallele, manuell gepflegte Dispatch-Listen auseinanderliefen.
**Fix:** `renderSafe(renderRandomTables, ...)` und
`renderSafe(renderTimers, ...)` zu `renderAll()`'s Dispatch-Liste in
`features/render-dashboard.js` ergänzt.
**Betroffener Test:** `tab-navigation.spec.js#undo/redo triggers re-render on
active tab` (Cluster 3-Umfeld, siehe auch die Korrektur oben).
**Commit:** `d38eea3`

### 4. (Test-Bug) Tab-Navigation — veraltete CSS-Klassen-Selektoren

**Root cause (ein Satz):** `tab-navigation.spec.js` erwartete `.init-combatant`
und `.party-member` — Klassennamen, die in der Produktion nie existiert
haben; die realen Klassen sind `.init-entry` (`renderInit()`) bzw.
`.char-card` (`renderParty()`). Zusätzlich wurden beim Fixen zwei weitere
Stale-Stellen im selben Cluster gefunden und korrigiert: `#round-num` (real:
`#encounter-round-num`) und Combatant-Feld `hp`/`maxHp` (real: `currentHp`/
`maxHp`).
**Fix:** Alle Selektoren/Feldnamen auf die reale Produktions-DOM-Struktur
korrigiert.
**Betroffene Tests:** `tab-navigation.spec.js` — "initiative tab renders
combat tracker", "initiative tab re-renders when switching back", "party tab
re-renders when switching back" (Cluster 3).
**Commit:** `55d449f`

### 5. (Test-Bug) Würfel-Panel "hidden" — ambige `.dice-details`-Selektion

**Root cause (ein Satz):** `view-tools.html` enthält 4 separate
`<details class="dice-details">`-Blöcke; `document.querySelector('.dice-details')`
liefert immer den ersten DOM-Order-Treffer (die Charakter-Attribut-Würfe),
nie den Random-Tables-Block — ein geschlossenes natives `<details>` versteckt
seine Kinder korrekt, das war kein DOM-Duplikations-App-Bug (siehe Korrektur
zu Cluster 3 oben).
**Fix:** Alle 5 Fundstellen auf
`document.getElementById('random-tables-list').closest('details')`
umgestellt (präzise Scope-Query statt klassenbasierter Mehrdeutigkeit).
**Betroffene Tests:** `tab-navigation.spec.js` — "dice tab renders random
tables when switched to", "switching to tab with no data shows empty state"
(Cluster 3).
**Commit:** `55d449f`

### 6. (Test-Bug) Timers-Test schreibt auf nicht-existenten Datenpfad + falsche Klasse

**Root cause (ein Satz):** Der Test schrieb Testdaten nach `window.D.timers`
— ein Schlüssel, der im App-Datenschema (`core/data.js`) gar nicht existiert
(Timer sind bewusst reiner Laufzeit-Zustand in einer modul-lokalen
`timers`-Closure-Variable) — und erwartete die Klasse `.timer-item` statt der
realen `.timer-card`.
**Fix:** Test-Setup auf die echte API (`window.addTimerWithSeconds(...)`)
umgestellt; Assertion auf `.timer-card` korrigiert.
**Betroffener Test:** `tab-navigation.spec.js#timers tab re-renders when
switching back` (Cluster 3).
**Commit:** `55d449f`

### 7. (Test-Bug) Validierungs-Toast-Race — Onboarding-Toast überschreibt Fehlermeldung

**Root cause (ein Satz):** Ein Onboarding-`setTimeout`
(`ui/editors/markdown-shortcuts.js`, 2000ms) sowie ein zweiter, unabhängig
gefundener Boot-Zeit-Backup-Hinweis-Toast (ausgelöst durch ungefragte
`save()`-Aufrufe in `initRandomTables()`/`validateDataIntegrity()` bei
fehlenden Default-Feldern) überschrieben den geteilten `#toast`-Legacy-Knoten,
bevor Playwrights `toContainText`-Polling die eigentliche
Validierungsfehlermeldung sehen konnte — betraf real jede frische Sitzung,
nicht nur Tests. Zusätzlich wurde dabei ein unabhängiger, durch die Race
maskierter Mismatch aufgedeckt: `quests.spec.js` erwartete den deutschen
String "Titel", die echte Meldung nutzt den Schema-Feldnamen `title`.
**Fix:** Test-seitiges Pre-Init-Seeding (`page.addInitScript()`) von
`D.settings.markdownOnboardingSeen = true` sowie eines vollständigen
`randomTables`/`timers`/`shops`/`campaign`/`_nextId`-Payloads in den
betroffenen CRUD-Specs; `quests.spec.js`'s Assertion von `'Titel'` auf
`'title'` korrigiert. Dieselbe Race betraf zwei zusätzlich in der
Baseline-Messung gefundene flakige Namensvalidierungstests
(`crud/npcs.spec.js`, `crud/party.spec.js`, "... ohne Namen zeigt
Fehlermeldung") — mit demselben Fix stabilisiert.
**Betroffene Tests:** `crud/quests.spec.js#Quest ohne Titel zeigt
Fehlermeldung` (Cluster 5), plus die 2 zusätzlich gefundenen flakigen Tests
in `crud/npcs.spec.js` und `crud/party.spec.js`.
**Commit:** `715baa9`

### Zusätzlich in Phase 8: suite-weite Assertion-Härtung (TEST-02, kein eigener Fail-Fix)

Über die 11+2 oben dokumentierten Fails hinaus wurde die gesamte Test-Suite
suite-weit gehärtet (nicht Teil der Fail-Liste, aber Teil des D-07-Auftrags
zur Gate-Vertrauenswürdigkeit): 6 deterministische
`toBeGreaterThan(0)`-Stellen auf exakte `toBe(N)` gehärtet, 15 zuvor
maskierende `isVisible()`-Guards (inkl. eines echten Root-Cause-Bugs in
`quests.spec.js` — `.quest-details` war bis zum Header-Klick eingeklappt) auf
harte Assertions umgestellt, beide `page.evaluate()`-Bestandsausnahmen
D-06-geprüft dokumentiert, und `waitForTimeout` in den direkt betroffenen
Specs durch `waitForSelector`/`waitForFunction` ersetzt. Details:
`.planning/phases/08-test-fundament-gr-n/08-03-SUMMARY.md`. Commits: `4a25d98`
(Zähl-Assertionen), `4238250` (Masking-Audit).

### CI-Gate (D-03, TEST-02)

Ein neuer, blockierender `e2e`-Job in `.github/workflows/ci.yml` führt die
volle Playwright-Suite gegen den Dev-Bundle aus (kein HTTP-Server, kein
`SMOKE_BASE_URL` — abweichend vom bestehenden `smoke-test`-Job, der den
Production-Bundle prüft). Kein Ignorieren roter Schritte; der `build`-Job
hängt jetzt zusätzlich von `e2e` ab, sodass ein roter E2E-Lauf transitiv
`build` → `smoke-test` → `deploy` blockiert. Erzwingung vor dem Merge (Branch
Protection) ist eine Repo-Settings-Aufgabe außerhalb dieses Dokuments.
