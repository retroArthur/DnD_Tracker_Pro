---
phase: 01-stabilisierung
plan: 05
subsystem: infra
tags: [package.json, config, python, validate, cleanup, license, version]

# Dependency graph
requires: []
provides:
  - "package.json: MIT-Lizenz, Version 2.6.1, python-kompatible Scripts"
  - "APP_CONFIG.VERSION: 2.6.1 synchron mit package.json"
  - "validate.py: script-relative Pfade (Path(__file__)), laeuft auf Windows"
  - "Vier veraltete Python-Tools entfernt (analyze-render, migrate-event-handlers, split-shops, purge-css)"
  - "Tote Dateien entfernt (main.js, tsconfig.json.backup, MIGRATION_REPORT.md)"
affects: [01-06, 01-07, alle Folge-Plaene (VERSION 2.6.1 aktiviert Migration)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "python statt python3 in npm-Scripts (Windows-kompatibel)"
    - "Path(__file__).parent fuer skript-relative Pfade in Python-Tools"

key-files:
  created: []
  modified:
    - "package.json"
    - "core/config.js"
    - "validate.py"
  deleted:
    - "tools/analyze-render.py"
    - "tools/migrate-event-handlers.py"
    - "tools/split-shops.py"
    - "tools/purge-css.py"
    - "main.js"
    - "tsconfig.json.backup"
    - "MIGRATION_REPORT.md"

key-decisions:
  - "D-17: Lizenz ISC -> MIT in package.json (konsistent mit LICENSE-Datei)"
  - "D-06: Version 2.6.1 synchron in package.json und APP_CONFIG.VERSION"
  - "D-12: Vier veraltete Python-Tools geloescht, validate.py mit Path(__file__) repariert"
  - "python3 -> python in allen npm-Scripts (Windows-kompatibel, STAB-09)"
  - "Tote Dateien main.js, tsconfig.json.backup, MIGRATION_REPORT.md geloescht"

patterns-established:
  - "Path(__file__).parent: Skript-relative Pfade in Python-Tools statt Hardcode"
  - "python statt python3: Windows-kompatible npm-Scripts"

requirements-completed: [STAB-09, STAB-06]

# Metrics
duration: 15min
completed: 2026-06-12
---

# Phase 01 Plan 05: Repo-Hygiene & Konfigurations-Konsistenz — Summary

**MIT-Lizenz, Version 2.6.1 synchronisiert, Windows-kompatible npm-Scripts (python), validate.py repariert, 7 tote/veraltete Dateien geloescht**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-12T07:00:00Z
- **Completed:** 2026-06-12T07:15:00Z
- **Tasks:** 3
- **Files modified:** 3 / **Files deleted:** 7

## Accomplishments

- package.json: Lizenz ISC -> MIT (D-17), Version 2.6.0 -> 2.6.1 (D-06), alle python3-Aufrufe durch python ersetzt (STAB-09), vier tote Tool-Skript-Eintraege entfernt (D-12)
- core/config.js: APP_CONFIG.VERSION auf 2.6.1 angehoben — synchron mit package.json; aktiviert Migration 2.6.1 beim naechsten Laden bestehender Kampagnen
- validate.py: Linux-Hardcode-Pfad (/mnt/user-data/...) durch Path(__file__).parent ersetzt; Skript laeuft auf Windows fehlerfrei
- Vier veraltete Python-Tools geloescht: analyze-render.py, migrate-event-handlers.py, split-shops.py, purge-css.py (Zweck erfuellt, Output ungenutzt)
- Drei tote Root-Dateien geloescht: main.js (toter Entry-Point), tsconfig.json.backup (committetes Backup), MIGRATION_REPORT.md (einmaliger Bericht)

## Task Commits

Jeder Task wurde atomar committed:

1. **Task 1: package.json — MIT-Lizenz, Version 2.6.1, python statt python3, tote Tool-Scripts entfernt** - `a317ae8` (chore)
2. **Task 2: APP_CONFIG.VERSION auf 2.6.1 angehoben** - `7e9790f` (chore)
3. **Task 3: validate.py repariert + veraltete Tools + tote Dateien geloescht** - `0627e8a` (chore)

## Files Created/Modified

- `package.json` - Lizenz MIT, Version 2.6.1, python statt python3, 4 tote Skript-Eintraege entfernt
- `core/config.js` - VERSION: '2.6.1' (war: '2.6.0')
- `validate.py` - SOURCE_DIR: Path(__file__).parent (war: Linux-Hardcode)

**Geloescht:**
- `tools/analyze-render.py` - Render-Split-Analyse (Zweck erfuellt)
- `tools/migrate-event-handlers.py` - Event-Handler-Migration (Zweck erfuellt)
- `tools/split-shops.py` - Shop-Split-Skript (Zweck erfuellt)
- `tools/purge-css.py` - CSS-Purge-Generator (erzeugte styles-purged.css, die Plan 03 loescht)
- `main.js` - Toter Entry-Point-Platzhalter (nicht in index.html referenziert)
- `tsconfig.json.backup` - Committetes Backup ohne Nutzwert
- `MIGRATION_REPORT.md` - Einmaliger Migrationsbericht

## Decisions Made

- Lizenz MIT (D-17): konsistent mit LICENSE-Datei und README-Badge; keine rechtliche Mehrdeutigkeit mehr
- Version 2.6.1 (D-06): Patch-Bump, synchron in package.json und APP_CONFIG.VERSION; aktiviert Migrations-Einstiegspunkt fuer Plan 03
- python statt python3: auf Windows ist python3 typischerweise nicht verfuegbar; python ist der Windows-Standardaufruf (PYTHONIOENCODING=utf-8 bereits in CLAUDE.md dokumentiert)
- Path(__file__).parent-Pattern aus tools/purge-css.py (die danach geloescht wurde) vor dem Loeschen uebernommen

## Deviations from Plan

Keine — Plan exakt wie spezifiziert ausgefuehrt.

## Issues Encountered

Keine — alle Aenderungen verliefen ohne unerwartete Probleme. validate.py zeigt inhaltliche Validierungs-Warnungen (Exit-Code 1), was dem erwarteten Verhalten entspricht (heuristische Checks, nicht Pfad-Absturz).

## Known Stubs

Keine — reine Konfigurations- und Aufraeumarbeiten, kein UI-Code.

## Threat Flags

Keine neuen Sicherheitsflächen eingebracht. T-05-01 (Lizenz-Mismatch) und T-05-03 (Referenz auf geloeschte Tools) durch Plan vollstaendig mitigiert.

## Next Phase Readiness

- Version 2.6.1 steht bereit fuer Version-Migrations-Einstiegspunkt (Plan 03)
- npm run validate laeuft auf Windows ohne Pfad-Crash
- npm-Scripts (build, build:dev, validate etc.) sind Windows-kompatibel
- Keine Blocker fuer Folge-Plaene

---

## Self-Check: PASSED

Dateien geprueft:
- package.json: VORHANDEN, version=2.6.1, license=MIT, python3-frei
- core/config.js: VORHANDEN, VERSION: '2.6.1'
- validate.py: VORHANDEN, Path(__file__).parent gesetzt
- tools/analyze-render.py: NICHT VORHANDEN (korrekt geloescht)
- tools/migrate-event-handlers.py: NICHT VORHANDEN (korrekt geloescht)
- tools/split-shops.py: NICHT VORHANDEN (korrekt geloescht)
- tools/purge-css.py: NICHT VORHANDEN (korrekt geloescht)
- main.js: NICHT VORHANDEN (korrekt geloescht)
- tsconfig.json.backup: NICHT VORHANDEN (korrekt geloescht)
- MIGRATION_REPORT.md: NICHT VORHANDEN (korrekt geloescht)

Commits geprueft:
- a317ae8: chore(01-05): package.json — VORHANDEN
- 7e9790f: chore(01-05): APP_CONFIG.VERSION — VORHANDEN
- 0627e8a: chore(01-05): validate.py repariert — VORHANDEN

---
*Phase: 01-stabilisierung*
*Completed: 2026-06-12*
