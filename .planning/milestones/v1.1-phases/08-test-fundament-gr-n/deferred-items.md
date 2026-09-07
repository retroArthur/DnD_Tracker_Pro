# Deferred Items — Phase 08

Items discovered during execution that are out-of-scope for the current task/plan (per
executor SCOPE BOUNDARY rule) — logged, not fixed here.

## 08-01, Task 3: Flaky `tests/unit/welt-story.test.js` (test-order-dependent) — ✅ ERLEDIGT 2026-09-07

> **Aufgeloest durch Phase 14 (v1.2), nicht durch eine gezielte Fehlersuche.** Die Datei
> existiert nicht mehr: Plan 14-05 hat `tests/unit/welt-story.test.js` in fuenf dedizierte
> Dateien aufgeteilt (`session-prep`, `npc-generator`, `timeline`, `reise`, `fraktionen`) und
> die Sammeldatei entfernt (Commit `bf809d5`, TEST-04 / `DEBT-28`). Genau die Aufteilung, die
> die Empfehlung unten als Untersuchungsrichtung nannte. Gegenprobe 2026-09-07:
> `ls tests/unit/welt-story.test.js` → nicht vorhanden; volle Suite `npx jest` → 50 Suiten /
> 1120 Tests gruen, kein Order-Effekt mehr beobachtbar.

<details>
<summary>Urspruenglicher Eintrag (historisch)</summary>

- **Found during:** `npx jest` verification run for Task 3 (renderAll dispatch gap).
- **Symptom:** `tests/unit/welt-story.test.js:476` fails only when the full suite runs
  (`npx jest`), but passes 37/37 when run in isolation
  (`npx jest tests/unit/welt-story.test.js`). Reproduced the flake once, then two
  subsequent full-suite runs came back 457/457 green.
- **Why out of scope:** Not caused by any file this plan touches
  (`ui/actions/combat-actions.js`, `assets/styles/migration.css`,
  `systems/migration/migration-wizard.js`, `features/render-dashboard.js`,
  `tests/unit/action-registry-collisions.test.js`, `tests/e2e/app.spec.js`) — likely
  shared global/date-dependent state bleeding across test files in full-suite run order.
  Not fixed per SCOPE BOUNDARY (only auto-fix issues directly caused by the current
  task's changes).
- **Recommendation:** Investigate test isolation (shared `D`/module state, or a
  date-dependent assertion) in `welt-story.test.js` in a dedicated task if it recurs.

</details>
  status: acknowledged
