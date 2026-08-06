# Deferred Items — Phase 08

Items discovered during execution that are out-of-scope for the current task/plan (per
executor SCOPE BOUNDARY rule) — logged, not fixed here.

## 08-01, Task 3: Flaky `tests/unit/welt-story.test.js` (test-order-dependent)

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
