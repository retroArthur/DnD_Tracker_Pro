---
phase: 13-h-rtung-wartbarkeit
plan: 07
subsystem: performance
tags: [indexeddb, dice-stats, cursor, cap-eviction, perf-02]

requires:
  - phase: 13-h-rtung-wartbarkeit
    provides: "13-01..13-06 landed on main first; this plan touches core/config.js (13-06 already added byte-budget keys there, no overlap with the new DICE_STATS_MAX_RECORDS key), features/dice-stats/*, ui/actions/system-actions.js — no file overlap with 13-01..13-06's changes"
provides:
  - "DICE_STATS_MAX_RECORDS (core/config.js, 50000) — user-decided hard cap on the diceStats IndexedDB store"
  - "enforceStatsCap() (dice-stats-idb.js) — count()+ascending-openCursor() eviction of the OLDEST records (smallest autoIncrement keys), throttled every 50th write, never throws"
  - "clearAllStats() + getStatsCount() (dice-stats-idb.js) — full-store clear and a count()-only helper, both resolve false/0 instead of throwing"
  - "getStatsAggregate(sessionId) (dice-stats-idb.js) — cursor-based { total, counts, byChar } aggregate, never materializing the record array; calls the shared _classifyD20Roll()/parseCharFromNotation() rule instead of duplicating it"
  - "'clear-dice-stats' action (system-actions.js) + button (dice-stats-render.js) — confirms with the exact record count before calling clearAllStats()"
affects: ["Any future plan touching features/dice-stats/*.js should know getAllStats() is now exclusively the migration-export path (systems/migration/audio-export.js) — the live evaluation view goes through getStatsAggregate() instead"]

actuals:
  tokens: 10569
  tasks: 4
  commits: 4

tech-stack:
  added: []
  patterns:
    - "enforceStatsCap() reuses the same readwrite store instance statsIdbPut() already opened for store.add() — no second transaction, so the throttled cap-check rides on the same transaction lifecycle as the write it follows"
    - "_classifyD20Roll(record, counts) extracted out of computeD20Counts() and exported to window so the new cursor path (dice-stats-idb.js) and the existing array path (dice-stats-render.js) share one classification rule instead of two copies (DEBT-17/18 avoidance, per D-12's explicit callout)"
    - "getStatsCount() fetched in parallel (Promise.all) with the scoped aggregate in renderDiceStats() — the delete button's visibility/count reflects the WHOLE store regardless of the session/total toggle, while the histogram/rates stay scoped"

key-files:
  created:
    - tests/unit/dice-stats-idb.test.js
  modified:
    - core/config.js
    - features/dice-stats/dice-stats-idb.js
    - features/dice-stats/dice-stats-render.js
    - ui/actions/system-actions.js

key-decisions:
  - "Task 1 decision checkpoint (blocking-human, one-way per D-11) resolved by the user: 50,000 records (planner's Option A). ~10 MB at ~200 bytes/record, stays inside the ~15 MB envelope Phase 12 already assessed for this store (12-CONTEXT.md open question 3); at 300 rolls/session and 50 sessions/year that's gp3-4 years of continuous weekly play before the cap ever bites. Recorded in core/config.js as a documented constant, not a bare number."
  - "enforceStatsCap() is throttled (every 50th write, STATS_CAP_CHECK_INTERVAL) rather than checked on every roll — count() on every single dice roll would be needless overhead for a store that, by the chosen cap, only approaches the limit after years of play. A dedicated test drives statsIdbPut() through 150 simulated rolls with realistic event-loop yields between them and asserts the store never exceeds cap+throttle-width at any observed point."
  - "enforceStatsCap() is exported to window (not explicitly listed in the plan's artifact table, unlike clearAllStats()/getStatsAggregate()) purely for direct, deterministic unit testing — without it, tests would need to simulate 50 real writes just to trigger one cap-enforcement pass. Documented inline as test-only surface; statsIdbPut() is still the only production caller."
  - "getStatsCount() (dice-stats-idb.js) was added beyond the plan's artifact list — a small, justified Rule 2 addition: the delete-button requirement ('names the exact record count') needs the count of the WHOLE store regardless of the current session/total scope toggle, which the existing scoped queries can't provide without materializing an array. It uses store.count() (no cursor, no array), consistent with D-12's spirit."
  - "getStatsAggregate() is called with sessionId only for the session-scoped view; the total-scope view calls it with no argument, using store.openCursor() over the whole store (same store the delete/cap functions touch) — this is the same branching shape getStatsForSession()/getAllStats() had, just moved to a single function with a cursor instead of two functions with a full array getAll()."

key-links:
  - "features/dice/dice-core.js addToDiceHistory() -> statsIdbPut() -> diceStats store — unchanged call site; the cap is enforced downstream of it, never blocking the write."
  - "dice-stats-render.js renderDiceStats() -> getStatsAggregate()/getStatsCount() (Promise.all) -> _renderDiceStatsContent(container, aggregate, totalStoreCount) — replaces the former getStatsForSession()/getAllStats() -> records[] flow."
  - "systems/migration/audio-export.js:201,228 -> getAllStats() — untouched (confirmed via `git diff` showing zero changes to this file); this is the D-12 boundary the plan required."

requirements-completed: [PERF-02]

coverage:
  - id: D1
    description: "diceStats store has a hard record-count cap (DICE_STATS_MAX_RECORDS=50000); on breach, oldest records (smallest autoIncrement keys) are evicted via ascending openCursor(), never time/session-based; enforcement never blocks a write or throws outward"
    requirement: PERF-02
    verification:
      - kind: unit
        ref: "tests/unit/dice-stats-idb.test.js#enforceStatsCap — Deckel und Verdraengung (PERF-02/D-11) (7 tests: below-cap no-op, oldest-first eviction, idempotency, two concurrency edge cases, throttle bound, missing window.idb)"
        status: pass
      - kind: other
        ref: "core/config.js contains DICE_STATS_MAX_RECORDS: 50000 with rationale comment; grep -c 'fake-indexeddb' package.json == 0 (no new dependency)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Explicit delete function reachable via a button in the stats view, confirms with the exact record count before deleting (D-11: eviction/deletion is unrecoverable, IndexedDB has no undo path)"
    requirement: PERF-02
    verification:
      - kind: unit
        ref: "tests/unit/dice-stats-idb.test.js#clearAllStats / getStatsCount — Loeschfunktion mit Rueckfrage (PERF-02/D-11) (4 tests: success, throwing transaction resolves false, missing window.idb, exact count)"
        status: pass
      - kind: other
        ref: "grep -c \"'clear-dice-stats'\" ui/actions/system-actions.js == 1; grep -c 'data-action=\"clear-dice-stats\"' features/dice-stats/dice-stats-render.js == 1; action contains a confirm() call whose text interpolates the count"
        status: pass
    human_judgment: false
  - id: D3
    description: "Evaluation view no longer fully loads the store into memory: dice-stats-render.js gets its aggregate via a cursor-based path that never materializes the record array; getAllStats() remains untouched for the migration export"
    requirement: PERF-02
    verification:
      - kind: unit
        ref: "tests/unit/dice-stats-idb.test.js#getStatsAggregate — Cursor-Aggregat identisch zum bisherigen Array-Weg (PERF-02/D-12) (4 tests: parity with the old getAllStats()+computeD20Counts()/attributeRolls() path, empty store, session-scoped cursor, missing window.idb)"
        status: pass
      - kind: other
        ref: "grep -c 'getAllStats' features/dice-stats/dice-stats-render.js == 0; git diff (this plan's commits) against systems/migration/audio-export.js is empty — file untouched, still calls getAllStats() at both existing call sites"
        status: pass
    human_judgment: false
  - id: D4
    description: "Displayed metrics after the switch are identical to before: 20-face histogram, crit/fumble rate, expected-value line, per-character breakdown, session/total toggle"
    requirement: PERF-02
    verification:
      - kind: unit
        ref: "tests/unit/dice-stats.test.js (unchanged, 6 tests, still pass — computeD20Counts()/critFumbleRates()/attributeRolls()/renderD20Histogram() signatures and behavior untouched)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/dice-stats.spec.js (2/2: dice stats tab renders, rolls captured in IDB) and tests/e2e/features/dice.spec.js (11/11) against the built bundle"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 07: Würfelstatistik-Deckel, Löschfunktion und Cursor-Aggregat Summary

**Der `diceStats`-IndexedDB-Store trägt jetzt einen harten, vom Nutzer entschiedenen Deckel (50.000 Datensätze, ältestes zuerst verdrängt), eine mit Rückfrage abgesicherte Löschfunktion, und die Auswertung aggregiert per Cursor statt den gesamten Store zu laden — der Umzugs-Export bleibt unverändert vollständig.**

## Performance

- **Duration:** 55 min
- **Tasks:** 4 (1 decision checkpoint + 3 implementation tasks)
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments

- `core/config.js`: `DICE_STATS_MAX_RECORDS: 50000` — die vom Nutzer am Task-1-Checkpoint getroffene Entscheidung (Option A, Planer-Empfehlung), mit ausführlicher Begründung im Code-Kommentar (Speicherrahmen, Jahresvolumen, Unwiederbringlichkeit).
- `enforceStatsCap()` (`features/dice-stats/dice-stats-idb.js`): verdrängt beim Überschreiten des Deckels die ältesten Datensätze (kleinste autoIncrement-Keys) über einen aufsteigenden `openCursor()`, gedrosselt auf jeden 50. Schreibvorgang (`STATS_CAP_CHECK_INTERVAL`), niemals blockierend, niemals nach außen werfend. In `statsIdbPut()` nach `store.add()` verdrahtet.
- `clearAllStats()` + `getStatsCount()` (`dice-stats-idb.js`): vollständiges Leeren des Stores bzw. eine reine `store.count()`-Abfrage, beide mit derselben defensiven Rückgabeform (`false`/`0` statt Wurf) wie die bestehenden Funktionen der Datei.
- `'clear-dice-stats'`-Aktion (`ui/actions/system-actions.js`) + Knopf in der Toggle-Leiste (`dice-stats-render.js`): fragt mit `confirm()` und der exakten Datensatzzahl zurück, bevor gelöscht wird; eigene Aktion statt der generischen `call`-Aktion, damit dieser Plan nicht von der Whitelist aus Plan 13-01 abhängt.
- `getStatsAggregate(sessionId)` (`dice-stats-idb.js`): cursor-basiertes `{ total, counts, byChar }`-Aggregat, das den Datensatz-Array nie materialisiert. Ruft die aus `dice-stats-render.js` extrahierte `_classifyD20Roll()`-Regel auf, statt sie zu kopieren. `renderDiceStats()`/`_renderDiceStatsContent()` konsumieren jetzt dieses Aggregat; `getAllStats()` bleibt für `systems/migration/audio-export.js` unverändert (per `git diff` bestätigt: keine Änderung an dieser Datei).
- `tests/unit/dice-stats-idb.test.js` (neu, 15 Tests): handgerolltes IndexedDB-Mock (erweitert `createMockIDB()` aus `soundboard.test.js` um `count()`/`openCursor()`/`index().openCursor()`/`clear()`) — keine neue Abhängigkeit (`fake-indexeddb` bleibt abgelehnt).

## Task Commits

1. **Task 1: Entscheidung — konkrete Obergrenze** - `8d2d2cf` (docs, checkpoint resolved: 50.000)
2. **Task 2: Deckel und Verdrängung im Schreibpfad** - `028a31b` (feat)
3. **Task 3: Löschfunktion mit Rückfrage und Knopf** - `c671ea5` (feat)
4. **Task 4: Cursor-basierter Aggregatpfad** - `a036565` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `core/config.js` - `DICE_STATS_MAX_RECORDS: 50000` mit Begründungskommentar
- `features/dice-stats/dice-stats-idb.js` - `enforceStatsCap()`, `clearAllStats()`, `getStatsCount()`, `getStatsAggregate()`, throttled cap-check in `statsIdbPut()`, window exports
- `features/dice-stats/dice-stats-render.js` - `_classifyD20Roll()` extrahiert aus `computeD20Counts()` und exportiert; `renderDiceStats()`/`_renderDiceStatsContent()` auf Aggregat + Delete-Knopf umgestellt
- `ui/actions/system-actions.js` - `'clear-dice-stats'`-Aktion mit beziffertem `confirm()`
- `tests/unit/dice-stats-idb.test.js` (neu) - 15 Tests über Deckel/Verdrängung, Löschen, Aggregat

## Decisions Made

See `key-decisions` in frontmatter — zusammengefasst: die Nutzerentscheidung 50.000 (Task 1) ist im Code begründet dokumentiert statt als bloße Zahl; die Drosselung der Deckel-Durchsetzung (jeder 50. Schreibvorgang) ist bewusst und durch einen eigenen Testfall belegt; `enforceStatsCap()` bekam einen reinen Test-Export (über die Plan-Artefaktliste hinaus); `getStatsCount()` wurde als kleine, begründete Ergänzung (Rule 2) für die Löschknopf-Anforderung hinzugefügt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] `getStatsCount()` ergänzt**
- **Found during:** Task 3
- **Issue:** Der Löschknopf-Text muss die exakte Datensatzzahl des GESAMTEN Stores nennen — unabhängig vom aktuellen Session-/Gesamt-Scope. Die vorhandenen Abfragen (`getStatsForSession()`, später `getStatsAggregate()`) liefern nur den aktuell gewählten Scope.
- **Fix:** `getStatsCount()` ergänzt (reiner `store.count()`-Aufruf, kein Array), parallel zur Scope-Abfrage in `renderDiceStats()` per `Promise.all` abgefragt.
- **Files modified:** `features/dice-stats/dice-stats-idb.js`, `features/dice-stats/dice-stats-render.js`
- **Commit:** `c671ea5`

**2. [Rule 3-artig — Testbarkeit] `enforceStatsCap()` als `window`-Export**
- **Found during:** Task 2
- **Issue:** Die Plan-Artefakttabelle listet für `enforceStatsCap()` keinen `window`-Export (anders als bei `clearAllStats()`/`getStatsAggregate()`). Ohne Export könnten Tests die Verdrängung nur indirekt über 50 simulierte `statsIdbPut()`-Aufrufe je Testfall auslösen — unnötig langsam und weniger deterministisch für die Randfälle `idempotency`/`concurrency`.
- **Fix:** `window.enforceStatsCap = enforceStatsCap;` ergänzt, mit Kommentar, der den Export ausdrücklich als testbedingt kennzeichnet (Produktionscode ruft die Funktion weiterhin nur über `statsIdbPut()` auf).
- **Files modified:** `features/dice-stats/dice-stats-idb.js`
- **Commit:** `028a31b`

**3. [Plan-Verifikationsabweichung — nicht Code] `grep -c 'getAllStats' systems/migration/audio-export.js` liefert 4 statt der im Plan erwarteten 2**
- **Found during:** Task 4, beim Ausführen der Verify-Kommandos
- **Issue:** Der Plan erwartete exakt 2 Treffer für `getAllStats` in `audio-export.js` (ein Treffer je Aufrufstelle). Die tatsächliche, von diesem Plan UNVERÄNDERTE Datei formatiert jeden der zwei logischen Aufrufe über zwei Zeilen (`typeof window.getAllStats === 'function'` gefolgt von `await window.getAllStats()`), also 4 Zeilentreffer für `grep -c` (das Zeilen zählt, nicht Vorkommen). Vermutlich eine Fehlannahme der Recherche (13-RESEARCH.md), nicht ein Implementierungsfehler.
- **Fix:** Keine Code-Änderung — `audio-export.js` bleibt bewusst unangetastet (D-12-Grenze). Bestätigt per `git diff` (leerer Diff für diese Datei über alle vier Commits dieses Plans) und per manueller Zeilenzählung: es sind weiterhin genau 2 logische `getAllStats()`-Aufrufstellen, unverändert.
- **Files modified:** keine
- **Commit:** n/a (kein Code-Effekt)

Kein Rule-1-Bug gefunden; keine Rule-4-Architekturfrage aufgetreten außerhalb des bereits vom Nutzer entschiedenen Task-1-Checkpoints.

## Threat Flags

Keine neuen — die drei mitigate-Einträge aus dem Plan-Threat-Model (T-13-24 Cap-DoS, T-13-25 Vollladen-DoS, T-13-27 doppelte Klassifikationsregel) sind wie geplant umgesetzt; T-13-28 (Charakternamen in `notation` im HTML) blieb per `accept`-Disposition unverändert — die bestehende `esc()`-Absicherung (Phase 7) ist unangetastet, dieser Plan ändert nur die Aggregation, nicht die Ausgabe.

## Known Stubs

Keine.

## Issues Encountered

- Anfänglicher `eval()`-Namenskonflikt in der Testdatei: ein direktes `eval()` des Moduls im sloppy-mode-Modulkontext von Jest leakt Top-Level-`const`/`function`-Deklarationen (`enforceStatsCap`, `statsIdbPut`, …) als bare Identifier in den umgebenden Funktionsscope der Testdatei — ein zusätzlicher lokaler `const enforceStatsCap = global.window.enforceStatsCap` kollidierte damit (`SyntaxError: Identifier 'enforceStatsCap' has already been declared`). Behoben durch Entfernen der redundanten lokalen Deklaration; die bare Identifier sind direkt nutzbar.
- Der erste Entwurf des Drosselungs-Testfalls prüfte den Enddeckel sofort nach der letzten Runde, ohne der zuletzt angestoßenen (asynchronen) `enforceStatsCap()`-Kette genug Ticks zum vollständigen Durchlaufen zu geben (`expected 5, received 40`). Behoben durch zusätzliche Ticks nach der Schreib-Schleife, bevor der Enddeckel geprüft wird — die Zwischenwert-Prüfung (`maxSizeSeen <= cap + throttle`) war bereits beim ersten Lauf korrekt.

## User Setup Required

None - keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- Full Jest suite: 1059/1059 passing (37 suites) — up from 1044/36 nach Plan 13-06, +15 neue Tests (`tests/unit/dice-stats-idb.test.js`).
- Build (`PYTHONIOENCODING=utf-8 python build.py`) und `npx playwright test tests/e2e/features/dice-stats.spec.js tests/e2e/features/dice.spec.js` (13/13) beide grün nach allen vier Tasks.
- `npx eslint` auf allen geänderten Dateien: 0 Fehler (nur bestehende, unveränderte `no-undef`-Warnungen für cross-modulare Globals in `system-actions.js`, wie im Rest des Projekts üblich).
- Keine Blocker für nachfolgende Pläne dieser Phase — `features/dice-stats/*.js` ist stabil; eine künftige Änderung der Deckel-Zahl sollte den Begründungskommentar in `core/config.js` lesen (Speicherrahmen aus Phase 12, Jahresvolumen-Herleitung) bevor sie angepasst wird.

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED

- FOUND: core/config.js
- FOUND: features/dice-stats/dice-stats-idb.js
- FOUND: features/dice-stats/dice-stats-render.js
- FOUND: ui/actions/system-actions.js
- FOUND: tests/unit/dice-stats-idb.test.js
- FOUND: .planning/phases/13-h-rtung-wartbarkeit/13-07-SUMMARY.md
- FOUND commit: 8d2d2cf (Task 1)
- FOUND commit: 028a31b (Task 2)
- FOUND commit: c671ea5 (Task 3)
- FOUND commit: a036565 (Task 4)
