---
phase: 02-technik-fundament
plan: "01"
subsystem: infra
tags: [pwa, file-backup, command-palette, migration, service-worker, build]

# Dependency graph
requires:
  - phase: 01-stabilisierung
    provides: Stabiler Build (python build.py), loader.js-Sync-Check, init.js mit defensivem Guard-Muster
provides:
  - 7 JS-Stub-Module (3 mit no-op-Init + window-Export, 4 reine Header)
  - 5 CSS-Stub-Dateien (fonts, pwa, migration, file-backup, command-palette)
  - Aktualisiertes loader.js und build.py (exakt synchron, 7 neue Module + 5 neue CSS)
  - Aktualisiertes assets/styles.css (@import alle 5 neuen CSS)
  - header.html mit versteckten Andockpunkten (.pwa-install-btn, .backup-warning-indicator)
  - core/init.js mit 3 defensiven Init-Aufrufen und SW-Update-Erkennungs-Kette
  - Wave-0-Test-Geruest: 3 Unit-Tests (RED) + 2 E2E-Stubs
affects: [02-02, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defensive typeof-Guard fuer Welle-2-Module: if (typeof window.X === 'function') window.X()"
    - "SW-Update-Erkennungs-Kette: reg.waiting + updatefound + statechange ohne erzwungenen Reload (D-03)"
    - "Stub-Module mit eindeutigem Top-Level-Funktionsnamen (CLAUDE.md Dedup-Regel)"
    - "Wave-0-RED-Phase: expect(typeof fn).toBe('function') als Platzhalter-Assertions"

key-files:
  created:
    - systems/migration/full-export.js
    - systems/migration/migration-wizard.js
    - systems/file-backup/file-backup-permissions.js
    - systems/file-backup/file-backup-manager.js
    - systems/file-backup/file-backup-ui.js
    - features/command-palette/action-registry.js
    - features/command-palette/command-palette.js
    - assets/styles/fonts.css
    - assets/styles/pwa.css
    - assets/styles/migration.css
    - assets/styles/file-backup.css
    - assets/styles/command-palette.css
    - tests/unit/full-export.test.js
    - tests/unit/file-backup.test.js
    - tests/unit/action-registry.test.js
    - tests/e2e/features/pwa.spec.js
    - tests/e2e/features/command-palette.spec.js
  modified:
    - loader.js
    - build.py
    - assets/styles.css
    - assets/templates/header.html
    - core/init.js

key-decisions:
  - "showSWUpdateHintGuarded() als lokale Hilfsfunktion in init.js statt direktem window.showSWUpdateHint-Aufruf — kapselt defensiven Guard, Plan 02-02 fuellt Implementierung"
  - "Wave-0 RED-Phase nutzt expect(typeof fn).toBe('function') statt Jasmine fail() — Jest-kompatibel, keine ReferenceError"
  - "fonts.css als ERSTE CSS-Datei in build.py css_files (vor variables.css) — Schriftreihenfolge im Build sichergestellt"

patterns-established:
  - "Stub-Modul-Muster: // [SECTION:NAME] Header + eindeutige no-op-Funktion + window-Export (kein Duplizierungsrisiko)"
  - "Wave-0-Test-RED-Muster: expect(typeof fn).toBe('function') als erste Zeile — schlaegt sauber fehl, kein ReferenceError"
  - "SW-Update D-03-Muster: kein self.skipWaiting() in install-Event, kein automatisches reload() — nur Hinweis delegieren"

requirements-completed: [TECH-01, TECH-02, TECH-03, TECH-04]

# Metrics
duration: 8min
completed: 2026-06-12
---

# Phase 02 Plan 01: Technik-Fundament Integrations-Rueckgrat Summary

**7 JS-Stubs + 5 CSS-Stubs als build-sichere Wave-0-Grundlage, init.js mit defensiver D-03-konformer SW-Update-Erkennung, und vollstaendiges RED-Phase-Test-Geruest fuer die 4 Welle-2-Feature-Plaene**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-12T20:45:18Z
- **Completed:** 2026-06-12T20:52:36Z
- **Tasks:** 3
- **Files modified:** 22

## Accomplishments

- Alle 7 neuen Phase-2-JS-Module als build-sichere Stubs angelegt und in loader.js + build.py (exakt synchron) registriert
- header.html mit versteckten Andockpunkten fuer PWA-Install-Button und Backup-Warnindikator ausgestattet (Welle 2 verdrahtet nur das Verhalten)
- core/init.js mit 3 defensiven Init-Aufrufen (typeof-Guard) und vollstaendiger SW-Update-Erkennungs-Kette (reg.waiting + updatefound + statechange) ohne erzwungenen Reload (D-03-konform)
- Wave-0-Test-Geruest: 3 Unit-Tests (RED, 7 Assertions) + 2 E2E-Stubs — alle von Jest/Playwright eingesammelt, keine Laufzeitfehler

## Task Commits

1. **Task 1: Stub-Module + CSS-Stubs + Header-Platzhalter** - `f592b93` (feat)
2. **Task 2: init.js verdrahten** - `7f88a37` (feat)
3. **Task 3: Wave-0-Test-Geruest** - `8fecc6b` (test)

**Plan metadata:** (folgt)

## Files Created/Modified

- `systems/migration/full-export.js` - Stub, Welle 2 fuellt Voll-Export-Implementierung
- `systems/migration/migration-wizard.js` - Stub mit `initMigrationWizardIfNeeded()` no-op
- `systems/file-backup/file-backup-permissions.js` - Stub, Welle 2 fuellt File System API-Permissions
- `systems/file-backup/file-backup-manager.js` - Stub mit `initFileBackup()` no-op
- `systems/file-backup/file-backup-ui.js` - Stub, Welle 2 fuellt Backup-Browser-Modal
- `features/command-palette/action-registry.js` - Stub, Welle 2 fuellt Aktions-Register
- `features/command-palette/command-palette.js` - Stub mit `initCommandPalette()` no-op
- `assets/styles/fonts.css` - CSS-Stub (lokal gebundelte Fonts, Welle 2)
- `assets/styles/pwa.css` - CSS-Stub (PWA-UI, Welle 2)
- `assets/styles/migration.css` - CSS-Stub (Wizard + Divergenz-Banner, Welle 2)
- `assets/styles/file-backup.css` - CSS-Stub (Backup-Browser, Welle 2)
- `assets/styles/command-palette.css` - CSS-Stub (Command-Palette-Overlay, Welle 2)
- `loader.js` - 7 neue Module in korrekter Ladereihenfolge eingetragen
- `build.py` - Identische Modulliste + fonts.css als erste CSS-Datei + 4 Feature-CSS am Ende
- `assets/styles.css` - 5 neue @imports in Reihenfolge hinzugefuegt
- `assets/templates/header.html` - .pwa-install-btn und .backup-warning-indicator (beide display:none)
- `core/init.js` - 3 defensive Init-Aufrufe + SW-Update-Kette + showSWUpdateHintGuarded()
- `tests/unit/full-export.test.js` - RED-Phase: 2 Tests fuer buildFullExport (TECH-02)
- `tests/unit/file-backup.test.js` - RED-Phase: 2 Tests fuer writeBackupForCampaign + pruneOldSnapshots mit FS-Mocks (TECH-03)
- `tests/unit/action-registry.test.js` - RED-Phase: 3 Tests fuer searchActions + ACTION_REGISTRY (TECH-04)
- `tests/e2e/features/pwa.spec.js` - E2E-Stub: manifest.webmanifest + SW-Registrierung (TECH-01)
- `tests/e2e/features/command-palette.spec.js` - E2E-Stub: Strg+Shift+K + NPC-Suche (TECH-04)

## Decisions Made

- `showSWUpdateHintGuarded()` als lokale Hilfsfunktion in init.js eingefuehrt statt direktem Aufruf von `window.showSWUpdateHint` — kapselt den defensiven Guard sauber, Plan 02-02 fuellt die eigentliche UI-Implementierung
- Wave-0 RED-Phase verwendet `expect(typeof fn).toBe('function')` statt Jasmine `fail()` — Jest-circus ist nicht mit `fail` kompatibel; `expect`-Assertions schlagen sauber fehl ohne ReferenceError
- `fonts.css` als erste Datei in `css_files` (vor `variables.css`) damit Schriftart-@font-face-Regeln vor allen CSS-Custom-Properties geladen werden

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Jasmine fail() nicht in Jest-circus verfuegbar**
- **Found during:** Task 3 (Wave-0-Test-Geruest)
- **Issue:** Erster Test-Entwurf verwendete Jasmine `fail()` fuer RED-Phase-Fehlermeldungen; Jest-circus wirft `ReferenceError: fail is not defined`
- **Fix:** Ersetzt durch `expect(typeof fn).toBe('function')` als erste Assertion im Testkoerper — faellt sauber mit klarer Fehlermeldung, kein Laufzeitfehler
- **Files modified:** tests/unit/full-export.test.js, tests/unit/file-backup.test.js, tests/unit/action-registry.test.js
- **Verification:** `npx jest` laeuft durch, 3 Suites mit 7 Tests eingesammelt, keine ReferenceErrors
- **Committed in:** 8fecc6b (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Minimale Anpassung der RED-Phase-Assertions. Kein Scope-Creep. Alle Acceptance Criteria erfuellt.

## Issues Encountered

Keine — alle drei Tasks liefen sauber durch.

## User Setup Required

Keine — kein externer Service konfiguriert in diesem Plan.

## Next Phase Readiness

- Welle-2-Plaene (02-02 bis 02-05) koennen vollstaendig parallel starten
- Jeder Feature-Plan beruehrt nur seine eigenen, isolierten Dateien
- Gemeinsame Dateien (loader.js, build.py, init.js, styles.css, header.html) sind abgeschlossen und nicht mehr zu beruehren
- Wave-0-Tests definieren die Erwartungen, die Welle 2 gruen zieht

## Self-Check

**Alle 17 neuen Dateien vorhanden:** PASSED
**Alle 5 modifizierten Dateien korrekt aktualisiert:** PASSED
**Build (dev + prod) fehlerfrei:** PASSED
**node --check core/init.js:** PASSED
**Jest sammelt 3 Suites, 7 Tests ein:** PASSED
**3 Task-Commits in git log:** PASSED

## Self-Check: PASSED

---
*Phase: 02-technik-fundament*
*Completed: 2026-06-12*
