---
phase: 12-datensicherheit
plan: 03
subsystem: file-backup
tags: [backup, data-safety, dedup, filenames]
dependency-graph:
  requires: ["12-01"]
  provides: ["resolveBackupTargets()", "multi-campaign _doBackup()", "collision-suffixed backup filenames"]
  affects: ["systems/file-backup/file-backup-manager.js", "systems/file-backup/file-backup-ui.js (unchanged, out of scope)"]
tech-stack:
  added: []
  patterns: ["per-item try/catch inside a loop instead of one try/catch around the whole run", "collision-only filename suffix (opt-in mutation, not default)"]
key-files:
  created: []
  modified:
    - systems/file-backup/file-backup-manager.js
    - tests/unit/file-backup.test.js
decisions:
  - "Suffix is appended only on a real safeName collision (D-04) — empty-string safeName always counts as a collision, even alone"
  - "FILE_BACKUP_MAX_SNAPSHOTS stays per-campaign — enforced by passing resolveBackupTargets()'s precomputed filenames.safeName into writeBackupForCampaign()/pruneOldSnapshots() instead of letting them recompute it"
  - "_doBackup() has no throw inside the per-campaign loop; a caught error just logs (DEBUG_MODE) and moves to the next campaign"
  - "Status is 'active' if at least one campaign wrote successfully, 'paused' only if none did — the once-per-session toast guard is unchanged"
metrics:
  duration: "~35 min"
  completed: 2026-08-18
actuals:
  tokens: 6458
  tasks: 2
  commits: 3
status: complete
---

# Phase 12 Plan 03: Datei-Backup sichert alle Kampagnen mit Kollisions-sicheren Dateinamen Summary

`_doBackup()` now iterates every campaign in the index (not just the active one) with
per-campaign error isolation, and `getBackupFilenames()` only appends the campaign key to a
backup filename when two campaigns' sanitized names actually collide.

## What Was Built

**Task 1 — `getBackupFilenames()` collision suffix + `resolveBackupTargets()`:**
- `getBackupFilenames(campaignKey, campaignName, suffix)` gained an optional third parameter.
  Callers that omit it get byte-identical output to before (existing backup files keep working
  untouched, per D-04).
- `_sanitizeForFilename()` extracted as the shared whitelist-cleaning helper (was previously
  inlined once in `getBackupFilenames`); both the campaign name and the collision suffix now run
  through the identical path-traversal-safe cleaning (T-12-08).
- `_sanitizeKeySuffix(campaignKey)` derives a short filename-safe suffix from a campaign key: the
  epoch digits from `dnd-campaign-<epoch>`, or the word `standard` from a `dnd-tracker` key.
- `resolveBackupTargets(campaignIndex, storageKey)` builds the full campaign list (standard
  campaign + index, de-duplicated exactly like `buildFullExport()` does), computes each
  campaign's unsuffixed `safeName`, groups by `safeName` to detect collisions, and only then
  computes the final filenames — appending the suffix when `safeName` collides with another
  campaign's OR when `safeName === ''` (the non-Latin-name collapse case, which always counts as
  a collision per D-04, even when it is currently the only one).

**Task 2 — `_doBackup()` iterates all campaigns with per-campaign fault isolation (D-03):**
- Replaced the single-campaign body with a loop over `resolveBackupTargets()`'s output.
- The DEBT-17 "never write an empty campaign" null-check on `readCampaignDataForBackup()` now
  runs **once per campaign** rather than once for the whole run — this is the actual point of
  the change, not a side effect. A campaign with no readable data is `continue`d, not thrown.
- The per-campaign body is wrapped in its own `try/catch` **inside** the loop; nothing `throw`s
  out of the loop, so one broken campaign can no longer cancel the backup of the others
  (T-12-10).
- `writeBackupForCampaign()` gained an optional 5th `filenames` parameter. `_doBackup()` passes
  `target.filenames` (computed once by `resolveBackupTargets()`) straight through, so
  `pruneOldSnapshots()` uses the exact same collision-suffixed `safeName` that was used to write
  the files — without this, a colliding neighbor campaign's daily snapshots would get counted
  and possibly deleted by the wrong campaign's prune run (T-12-09). `FILE_BACKUP_MAX_SNAPSHOTS`
  (10) is therefore enforced per campaign, not globally, exactly as D-03 requires.
- Status logic: `active` if at least one campaign wrote successfully (regardless of how many
  others were skipped or failed); `paused` only if none did. The existing once-per-session
  "Ordner wieder verbinden?" toast guard (`_fileBackupPausedNotified`) is unchanged — no
  per-campaign toast spam.
- Header comment and the data-loading comment updated so "je Kampagne einzeln" describes actual
  behavior instead of a stale intent statement (this was the exact gap the CONTEXT.md flagged:
  the comment said one thing, `_doBackup()` did another).

## Deviations from Plan

None — plan executed as written. No architectural changes, no Rule 4 escalations.

## Verification

- `npx jest tests/unit/file-backup.test.js tests/unit/file-backup-hook.test.js` — 22/22 passed
  (13 new tests added: 3 for `getBackupFilenames` suffix, 6 for `resolveBackupTargets`, 4 for
  `_doBackup()` multi-campaign behavior).
- `node --check systems/file-backup/file-backup-manager.js` — no syntax errors.
- Full baseline re-run: `npx jest` → 671/671 passed (658 baseline + 13 new, exact match).
  `pytest tests/build` → 24/24 passed (unchanged baseline).
- `PYTHONIOENCODING=utf-8 python build.py` — succeeds, 124/124 modules combined, no duplicate
  declarations, build integrity validation passed. (`dist/` is gitignored, no commit needed.)
- Playwright E2E was **not** run for this plan — the change is a pure backend/data-safety
  refactor with no DOM-facing surface; the existing Jest coverage (writeBackupForCampaign,
  pruneOldSnapshots, resolveBackupTargets, getBackupFilenames, _doBackup, plus the unrelated
  post-save-hook regression suite) is the correct verification layer here, not the browser. If
  the orchestrator's phase-level gate re-runs the full Playwright suite anyway, no regression is
  expected since nothing DOM-facing changed, but that has not been independently confirmed in a
  real browser by this plan.

## Threat Flags

None — this plan's threat_model register (T-12-08 through T-12-11) covers everything touched;
no new surface was introduced outside what was already registered.

## Known Stubs

None.

## Self-Check: PASSED

- `systems/file-backup/file-backup-manager.js` — FOUND
- `tests/unit/file-backup.test.js` — FOUND
- Commit `53857c9` (test) — FOUND in `git log --oneline`
- Commit `6be80de` (feat, Task 1) — FOUND in `git log --oneline`
- Commit `9cdab21` (feat, Task 2) — FOUND in `git log --oneline`
