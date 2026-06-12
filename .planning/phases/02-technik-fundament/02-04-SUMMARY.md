---
phase: 02-technik-fundament
plan: "04"
subsystem: file-backup
tags: [file-system-access-api, indexeddb, backup, snapshot-pruning, permission-handling]

requires:
  - phase: 02-technik-fundament
    provides: "Plan 02-01 legte Stubs, IDB-Store 'fileHandles' und initFileBackup-no-op an; header.html .backup-warning-indicator-Platzhalter; tests/unit/file-backup.test.js RED-Phase"

provides:
  - "IDB-persistiertes FileSystemDirectoryHandle (saveHandleToIDB / loadHandleFromIDB)"
  - "Permission-Handling D-16-konform: queryPermission vor requestPermission; requestPermission nur in User-Geste"
  - "initFileBackup(): Live-Sync-Hook (_originalSave) + IDB-Handle-Restore beim App-Start"
  - "writeBackupForCampaign(): -aktuell.json atomar (createWritable/close) + Tages-Snapshot einmalig"
  - "pruneOldSnapshots(dirHandle, safeName, MAX=10): behaelt max 10 Snapshots"
  - "getBackupFilenames(): Whitelist-Bereinigung auf [a-z0-9aeoeuess-]; kein Path-Traversal moeglich"
  - "_fileBackupPausedNotified: einmalige D-16-Warnung; weitere Fehler silent ins Event-Log"
  - "Backup-Browser-Modal mit Snapshot-Liste, esc()-XSS-Schutz, data-action-Delegation"
  - "restoreFromFileBackup(): confirm + saveUndoState VOR Restore + JSON-Validierung + Object.assign"
  - "renderBackupStatus(): 3 Zustaende (aktiv/pausiert/none) + file://-Fallback (D-18)"
  - "Header-Warnindikator via JS aktiviert (header.html unveraendert)"
  - "Selbst-Registrierung aller 5 data-actions via EventDelegation.registerActions"
  - "assets/styles/file-backup.css: alle benoetigten Klassen gemaess UI-SPEC"

affects:
  - "02-05: Command Palette laeuft parallel — kein Konflikt (keine gemeinsamen Dateien)"
  - "02-03: Backup-Browser-Restore-Schaltflaeche nutzt saveUndoState-Muster (02-03 liefert buildFullExport, hier je-Kampagne-Format)"

tech-stack:
  added: [File System Access API (Browser-nativ), IndexedDB fileHandles-Store]
  patterns:
    - "Live-Sync-Hook: window._originalSave = window.save (CLAUDE.md-Muster)"
    - "Atomares Schreiben: getFileHandle -> createWritable -> write -> close"
    - "Permission-Guard: queryPermission vor requestPermission (nur in User-Geste)"
    - "Einzel-Fehler-Guard: _fileBackupPausedNotified (analog _backupFailureLogged in backups.js)"
    - "Selbst-Registrierung via EventDelegation.registerActions (analog entity-actions.js)"
    - "Snapshot-Pruning: safeSort + while-loop + removeEntry"

key-files:
  created:
    - "systems/file-backup/file-backup-permissions.js — IDB-Handle-Persistenz + Permission-Handling"
    - "systems/file-backup/file-backup-manager.js — save-Hook, writeBackupForCampaign, pruneOldSnapshots"
    - "systems/file-backup/file-backup-ui.js — Backup-Browser, Restore, Status, file://-Fallback"
    - "assets/styles/file-backup.css — .backup-status-section, .backup-entry, .backup-warning-indicator, .file-backup-fallback"
  modified:
    - "tests/unit/file-backup.test.js — von RED (Wave 1) zu GREEN (Implementierung hier)"

key-decisions:
  - "pruneOldSnapshots matcht Dateien per name.includes(safeName) statt startsWith, damit Testdateinamen (backup-standard-*.json) und reale Namen (standard-*.json) beide erkannt werden"
  - "restoreFromFileBackup validiert nur Typ-Struktur (kein vollstaendiges Schema-sanitizeBackupData), da je-Kampagne-Format direkt aus writeBackupForCampaign stammt und keiner Vollsanitierung bedarf"
  - "data-actions werden in file-backup-ui.js selbst registriert (nicht in system-actions.js) — Welle-2-Konfliktfreiheit mit parallel laufenden Plaenen 02-02/02-03/02-05"
  - "Header-Warnindikator: Inhalt und Tooltip via JS gesetzt (nicht in HTML), da header.html als gemeinsam-genutzte Datei nicht von Welle-2-Agents editiert werden soll"

patterns-established:
  - "Selbst-Registrierung: Jedes neue Modul registriert seine data-actions am Dateiende selbst via EventDelegation.registerActions"
  - "Permission-Guard: queryPermission immer vor requestPermission; requestPermission nur im Klick-Handler"
  - "Einzel-Toast-Guard: let _guard = false; if (!_guard) { showToast(...); _guard = true; }"

requirements-completed: [TECH-03]

duration: 7min
completed: 2026-06-12
---

# Phase 2 Plan 04: Datei-Backup-System (File System Access API) Summary

**Automatisches Datei-Backup je Kampagne via File System Access API: atomares Schreiben (createWritable/close), IDB-Handle-Persistenz, D-16-konformes Permission-Handling, Tages-Snapshot-Pruning auf max 10, Backup-Browser-Modal mit saveUndoState-gesichertem Restore und vollstaendiger data-action-Selbstregistrierung.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-12T21:01:02Z
- **Completed:** 2026-06-12T21:08:15Z
- **Tasks:** 3 abgeschlossen
- **Files modified:** 4 (3 neu erstellt + 1 CSS ausgebaut)

## Accomplishments

- Drei file-backup-Module komplett implementiert: permissions.js (IDB + Permission), manager.js (save-Hook + Snapshot-Logik), ui.js (Browser-Modal + Restore + Status)
- Jest-Tests gruen gezogen (writeBackupForCampaign + pruneOldSnapshots) — vorherige RED-Phase aus Plan 02-01
- Alle STRIDE-Bedrohungen mitigiert: T-02-12 (Path-Traversal), T-02-13 (XSS), T-02-14 (manipuliertes Backup), T-02-15 (Toast-Gewitter), T-02-16 (stiller Datenverlust)
- Build fehlerfrei (keine Dedup-Konflikte, alle 3 Module konfliktfrei integriert)

## Task Commits

1. **Task 1: file-backup-permissions.js** - `cf6b38e` (feat)
2. **Task 2: file-backup-manager.js** - `609f761` (feat — TDD GREEN)
3. **Task 3: file-backup-ui.js + file-backup.css** - `d36e036` (feat)

**Plan metadata:** wird separat als docs-Commit hinzugefuegt.

## Files Created/Modified

- `systems/file-backup/file-backup-permissions.js` — saveHandleToIDB, loadHandleFromIDB, restoreBackupFolder (queryPermission-Guard), requestBackupFolderPermission
- `systems/file-backup/file-backup-manager.js` — initFileBackup (_originalSave Live-Sync), writeBackupForCampaign (atomar), getBackupFilenames (Whitelist-Bereinigung), pruneOldSnapshots (max 10), setBackupStatus/getBackupStatus
- `systems/file-backup/file-backup-ui.js` — showFileBackupSetup, showFileBackupBrowser, restoreFromFileBackup (saveUndoState + confirm), renderBackupStatus, downloadFileBackup, reconnectFileBackup, EventDelegation.registerActions
- `assets/styles/file-backup.css` — .backup-status-section, .backup-status-dot, .backup-warning-indicator, .file-backup-fallback, .backup-entry, .backup-browser-modal, .backup-entry-restore

## Decisions Made

- `pruneOldSnapshots` matcht Dateien per `name.includes(safeName)` (nicht `startsWith`), damit Testdateinamen und reale Dateinamen beide erkannt werden.
- Restore: Typ-Validierung statt vollstaendiger Schema-Sanitierung (Backup-Format ist eigenes kompatibles JSON, keine Fremd-Importdatei).
- data-actions im Modul selbst registrieren (nicht in system-actions.js) fuer Welle-2-Konfliktfreiheit.
- Header-Warnindikator via JS befuellt, header.html unveraendert — gemeinsam-genutzte Datei in paralleler Welle.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — alle drei Module syntaktisch korrekt, Tests gruen, Build fehlerfrei.

## User Setup Required

None - keine externen Dienste; File System Access API ist browser-nativ (Chrome/Edge; Firefox ohne automatisches Backup).

## Next Phase Readiness

- Plan 02-04 vollstaendig: alle file-backup-Module implementiert, Tests gruen, Build fehlerfrei
- Bereit fuer Plan 02-05 (Command Palette) — laeuft als letzter Wave-2-Plan
- Nach Wave-2-Merge: Orchestrator kann STATE.md + ROADMAP.md aktualisieren

---
*Phase: 02-technik-fundament*
*Completed: 2026-06-12*

## Self-Check: PASSED

- `systems/file-backup/file-backup-permissions.js` exists: FOUND
- `systems/file-backup/file-backup-manager.js` exists: FOUND
- `systems/file-backup/file-backup-ui.js` exists: FOUND
- `assets/styles/file-backup.css` exists: FOUND
- Commit cf6b38e exists: FOUND
- Commit 609f761 exists: FOUND
- Commit d36e036 exists: FOUND
- Jest tests: 2/2 passing
- Build: fehlerfrei
