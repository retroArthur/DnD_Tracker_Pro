---
phase: 02-technik-fundament
plan: "03"
subsystem: infra
tags: [migration, full-export, pwa, file-backup, drag-drop, divergence-banner]

# Dependency graph
requires:
  - phase: 02-technik-fundament
    provides: Stub-Module (full-export.js, migration-wizard.js), migration.css, Wave-0-RED-Tests
  - phase: 01-stabilisierung
    provides: StorageAPI, getCampaignIndex, saveCampaignIndex, saveUndoState, APP_CONFIG
provides:
  - buildFullExport/downloadFullExport/importFullExport (full-v1-Format, kampagnenuebergreifend)
  - stripNonUserData (SRD-Spells-Schutz, T-02-09)
  - initMigrationWizardIfNeeded (Protokoll-Verzweigung file:// vs PWA)
  - showMigrationWizard (4-Schritt-Wizard mit Drag&Drop, D-09)
  - isFreshInstall (Erststart-Erkennung)
  - startMigrationFileSide (file://-Side-Logik)
  - startMigrationFlow (Voll-Export + PWA-URL + Divergenz-Zeitpunkt, D-10)
  - showDivergenceBanner (dauerhaft abschaltbar, D-11)
  - showMigrationHintBanner (einmalig pro Sitzung, D-10)
  - migration.css (Komponenten 3/4/5 aus UI-SPEC)
affects: [02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Voll-Export-Format full-v1: kampagnenuebergreifend, SRD-frei, StorageAPI-{success,error}-Pruefung"
    - "create-or-update Modal-Muster (analog loot-distribution.js)"
    - "FileReader/Drag&Drop in Wizard-Schritt (analog import-export.js)"
    - "Protokoll-Verzweigung in initMigrationWizardIfNeeded: file:// -> Side-Flow; http/https -> Wizard"
    - "Selbst-Registrierung via EventDelegation.registerAction am Modul-Ende (analog entity-actions.js)"
    - "sessionStorage-Guard fuer Einmal-pro-Sitzung-Hinweise (Spieltisch-Regel)"
    - "MIGRATION_PWA_URL als dokumentierter Platzhalter (A1 RESEARCH.md, manuell nach Deploy pruefen)"

key-files:
  created: []
  modified:
    - systems/migration/full-export.js
    - systems/migration/migration-wizard.js
    - assets/styles/migration.css

key-decisions:
  - "full-v1-Format: campaigns als Objekt (key->meta+data), nicht als Array — erlaubt O(1)-Lookup beim Importieren"
  - "showMigrationWizard() enthaelt KEINE isFreshInstall-/shown-Guards — guards nur in initMigrationWizardIfNeeded; trennt Auto-Erststart von manuellem Wiederaufruf (D-09)"
  - "MIGRATION_PWA_URL als Modul-Konstante mit PLATZHALTER-Kommentar dokumentiert (RESEARCH.md A1)"
  - "StorageAPI.setJSON fuer migration-wizard-shown und migration-divergence-* (konsistent mit restlichem Muster)"
  - "Task 2 und Task 3 in einem Commit zusammengefasst da migration-wizard.js beide Teilaufgaben enthaelt"

patterns-established:
  - "Migrations-Wizard-Muster: create-or-update + showWizardStep() + _setupWizardDragDrop() + _setupWizardActions()"
  - "file://-Side-Flow: D-11 zuerst (Divergenz pruefen), dann D-10 (Hinweis zeigen — nur wenn noch nicht umgezogen)"

requirements-completed: [TECH-02]

# Metrics
duration: 7min
completed: 2026-06-12
---

# Phase 02 Plan 03: Voll-Export, Migrations-Wizard, file://-Umzugs-Flow (D-08/D-09/D-10/D-11) Summary

**full-v1-Voll-Export (alle Kampagnen + SRD-frei), 4-Schritt-PWA-Erststart-Wizard mit Drag&Drop, file://-Umzugs-Hinweis und dauerhaft abschaltbares Divergenz-Banner**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-12T21:00:27Z
- **Completed:** 2026-06-12T21:07:24Z
- **Tasks:** 3 (Task 2 + Task 3 als ein Commit, da gleiche Datei)
- **Files modified:** 3

## Accomplishments

- buildFullExport() sammelt alle Kampagnen (Index + Standard-Kampagne) + Settings + diceFavorites + dmScreenProfiles ohne SRD-Spells in full-v1-Format; Unit-Tests gruen (2/2)
- Migrations-Wizard (D-09): 4-Schritt-Modal mit Drag&Drop-Import, Ueberspringen-Moeglichkeit, Erfolgsbestaetigung mit Kampagnenanzahl; jederzeit via data-action reopen-migration-wizard erneut aufrufbar (keine guards in showMigrationWizard)
- file://-Umzugs-Flow (D-10): einmaliger Hinweis-Banner pro Sitzung (sessionStorage-Guard); Divergenz-Banner (D-11) nach Umzug dauerhaft sichtbar, per Klick abschaltbar (StorageAPI-Flag)
- migration.css: alle drei UI-SPEC-Komponenten implementiert (Wizard, Hinweis-Banner, Divergenz-Banner)

## Task Commits

1. **Task 1: full-export.js Voll-Export-Format (D-08)** - `ec6ee54` (feat)
2. **Task 2+3: migration-wizard.js + migration.css (D-09/D-10/D-11)** - `0641c17` (feat)

**Plan metadata:** (folgt)

## Files Created/Modified

- `systems/migration/full-export.js` - buildFullExport, downloadFullExport, importFullExport, stripNonUserData, FULL_EXPORT_SCHEMA
- `systems/migration/migration-wizard.js` - PWA-Erststart-Wizard, isFreshInstall, initMigrationWizardIfNeeded, startMigrationFileSide, startMigrationFlow, showDivergenceBanner, showMigrationHintBanner
- `assets/styles/migration.css` - Komponenten 3/4/5 (.migration-wizard, .migration-hint-banner, .divergence-banner)

## Decisions Made

- `full-v1`-Format speichert `campaigns` als Objekt (key -> {meta, data}), nicht als Array: O(1)-Lookup beim Importieren, kompatibel mit bestehendem getCampaignIndex-Muster.
- `showMigrationWizard()` enthaelt bewusst KEINE isFreshInstall-/shown-Guards: die Guards liegen ausschliesslich in `initMigrationWizardIfNeeded`. So ist der Wizard via data-action "reopen-migration-wizard" jederzeit neu aufrufbar (D-09, PATTERNS.md Hinweis).
- `MIGRATION_PWA_URL` als Modul-Konstante mit dokumentiertem Platzhalter-Kommentar (RESEARCH.md A1 — URL nach erstem Deploy manuell in Chrome DevTools verifizieren).
- Tasks 2 und 3 in einem Commit: beide bearbeiten ausschliesslich migration-wizard.js und migration.css, die logische Trennung liegt im Code (separate Funktionen), nicht in separaten Commits.

## Deviations from Plan

None — plan executed exactly as written.

Die Planhinweise zu Task 2 und Task 3 werden in einer einzigen Datei (migration-wizard.js) implementiert; beide Commits haetten dieselben Dateien beruehrt. Ein gemeinsamer Commit ist hier korrekter als zwei partielle Commits derselben Datei.

## Issues Encountered

Keine — alle drei Verifikationen liefen sauber durch.

**Hinweis:** Tests muessen aus dem Worktree-Verzeichnis laufen (`cd .claude/worktrees/agent-...`), da der Testpfad `../../systems/migration/full-export.js` relativ zum Testverzeichnis aufgeloest wird und sonst die Stub-Datei im Haupt-Checkout trifft.

## Known Stubs

- `MIGRATION_PWA_URL` in `systems/migration/migration-wizard.js` (Zeile 15): Konstante mit Platzhalter-URL `https://retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html`. Intentionell — exakte URL haengt vom GitHub-Pages-Deploy ab. Manueller Verify-Schritt: nach Deploy in Chrome DevTools -> Application -> Manifest pruefen (RESEARCH.md A1, Plan 02-02 Human-Verify-Checkpoint).

## User Setup Required

Keine — kein externer Service konfiguriert in diesem Plan.

## Next Phase Readiness

- Plan 02-04 (Datei-Backup) kann den optionalen "Automatische Backups einrichten"-Button im Wizard-Schritt-4 via `window.showFileBackupSetup()` benutzen (defensiver Aufruf bereits implementiert)
- Voll-Export-Format `full-v1` ist als Basis fuer Datei-Backup (Plan 02-04) nutzbar
- REQUIREMENTS.md TECH-02 kann als abgeschlossen markiert werden

## Self-Check

---

**Dateien vorhanden:**
- [x] systems/migration/full-export.js - VORHANDEN
- [x] systems/migration/migration-wizard.js - VORHANDEN
- [x] assets/styles/migration.css - VORHANDEN

**Commits vorhanden:**
- [x] ec6ee54 feat(02-03): full-export.js - VORHANDEN
- [x] 0641c17 feat(02-03): migration-wizard.js + migration.css - VORHANDEN

**Tests:**
- [x] npx jest tests/unit/full-export.test.js: 2/2 PASS

**Build:**
- [x] python build.py: exit code 0

**Syntax:**
- [x] node --check full-export.js: PASS
- [x] node --check migration-wizard.js: PASS

## Self-Check: PASSED

---
*Phase: 02-technik-fundament*
*Completed: 2026-06-12*
