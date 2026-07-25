---
phase: 2
slug: technik-fundament
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-25
register_authored_at_plan_time: false
audit_mode: retroactive-STRIDE
---

# Phase 2 — Security (Datei-Backup)

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Phase 2 (`02-technik-fundament`) did not author a formal `<threat_model>` block at
> planning time. This is a **retroactive** STRIDE register, built directly from the
> File System Access API backup implementation this phase introduced. Verified against
> the codebase state AFTER all Phase 10 fixes (2026-07-25), per D-11.

---

## Scope — Files & Code Paths Audited

- `systems/file-backup/file-backup-manager.js` — `writeBackupFile()` (line 77, atomic `createWritable()` → `write()` → `close()`), `writeBackupForCampaign()` (line 99, current file + once-per-play-day snapshot), `pruneOldSnapshots()` (line 152, caps snapshots at `FILE_BACKUP_MAX_SNAPSHOTS = 10`, line 17), registration point at the persistence layer (lines 345–346: `window.registerPostSaveHook(onAfterSave)`)
- `systems/file-backup/file-backup-permissions.js` — `restoreBackupFolder()` (line 79, read-only `queryPermission()`), `requestBackupFolderPermission()` (line 105, `requestPermission()` — gated to be called only from a user-gesture click handler per the code comments at lines 67, 101), `saveHandleToIDB()`/`loadHandleFromIDB()` (lines 27, 44 — directory handle persistence)
- `systems/file-backup/file-backup-ui.js` — the click-handler entry points (`data-action` wiring) that invoke `showDirectoryPicker()` (line 28) and `requestBackupFolderPermission()`, confirming the user-gesture requirement is structurally satisfied (handler is bound to a click action, not called on page load or a timer)
- `systems/spellslots/persistence.js` — the generic `registerPostSaveHook()` mechanism (lines 14–20, exported at line 275) that the file-backup module hooks into; this is the fix for the historical "bare `save()` calls bypass `window.save` wrapper" incident documented in `CLAUDE.md` (window.save must never be wrapped — `const save` is a global const, bare calls bind to the lexical declaration)
- `features/dmscreen/dmscreen-render.js` — a second, independent consumer of `registerPostSaveHook()` (lines 155–156), confirming the hook mechanism is generic and not a one-off wiring for the backup module alone

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Campaign state (`D`) → local filesystem | User-selected folder receives periodic JSON snapshots of the full campaign | Serialized campaign JSON (may include names, notes, DM content) |
| Directory handle → IndexedDB | A `FileSystemDirectoryHandle` (capability to write to a user-chosen folder) is persisted across sessions | Structured-clone-able handle object |
| Save event → backup write | Every confirmed persistence write should trigger a backup write (post-save hook) | In-memory event, no cross-origin data |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Tampering | `requestBackupFolderPermission()` called outside a user gesture | medium | mitigate | `requestPermission()` throws a `SecurityError` outside a real user gesture (browser-enforced). Code structurally isolates the call: `restoreBackupFolder()` only ever calls read-only `queryPermission()` (line 79); `requestBackupFolderPermission()` (the only caller of `requestPermission()`) is invoked exclusively from `file-backup-ui.js`'s click-action handlers, never from an automatic/reconnect path. Comments at `file-backup-permissions.js:67,101` document the anti-pattern this avoids (re-prompt loop, RESEARCH Pitfall 3). | closed |
| T-02-02 | Tampering | Non-atomic file write could corrupt a backup file on a crash mid-write | medium | mitigate | `writeBackupFile()` uses the File System Access API's `createWritable()` → `write()` → `close()` sequence (`file-backup-manager.js:77–82`), which performs an atomic swap on `close()` — a crash before `close()` leaves the previous file version intact, never a half-written file. | closed |
| T-02-03 | Denial of Service | Unbounded snapshot accumulation fills the user's backup folder | low | mitigate | `pruneOldSnapshots()` (line 152) caps retained daily snapshots at `FILE_BACKUP_MAX_SNAPSHOTS = 10` (line 17), invoked immediately after each new snapshot write (`writeBackupForCampaign()`, line 92). | closed |
| T-02-04 | Information Disclosure | Persisted directory handle grants standing write access to a user-chosen folder across sessions | low | accept | The folder is explicitly chosen by the user via the native OS picker (`showDirectoryPicker()`) — this is the intended capability-based design of the File System Access API, not an escalation. Permission is still origin-scoped and browser-mediated (`queryPermission`/`requestPermission`); a denied/revoked permission is handled gracefully (returns `null`, no exception surfaces to the user as a crash). Single-user offline app; no remote attacker can trigger a folder write without local code execution, which is already outside this app's threat model. | accept |
| T-02-05 | Repudiation | Post-save hooks silently never firing for bare `save()` calls (the documented `window.save`-wrapper incident) | high | mitigate | `CLAUDE.md` documents the historical bug: `window.save = function(){...}` never intercepts `save()` calls because `save` is declared as a global `const` in `persistence.js` — bare calls bind to the lexical declaration, permanently bypassing any wrapper. This was found in UAT (file backups silently never written). Fixed via the generic `registerPostSaveHook()` mechanism: hooks run at every persist success point *after* the actual write (`persistence.js:14–20/275`), verified wired correctly by two independent consumers (`file-backup-manager.js:345–346`, `dmscreen-render.js:155–156`) and covered by `tests/unit/file-backup-hook.test.js` (5 tests: hooks fire after write for both `saveImmediate()` and debounced `save()`, a throwing hook does not break saving or other hooks, dedup/type-guard, zero-hooks no-op). | closed |

*Status: closed · open · open — below block threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` count toward `threats_open`*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-04 | User-chosen folder + browser-mediated, revocable permission is the File System Access API's intended capability model; single-user offline app has no remote attacker path to this surface. | Phase 10 Plan 05 audit | 2026-07-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-25 | 5 | 4 | 0 (1 accepted, non-blocking) | Phase 10 Plan 05 (retroactive-STRIDE, executor agent) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-25
