---
phase: 01-stabilisierung
plan: "04"
subsystem: build
tags: [build, python, pytest, deduplication, tdd, stab-07]

requires:
  - phase: 01-01
    provides: "Smoke-Test-Infrastruktur (dist/ Artefakte vorausgesetzt)"

provides:
  - "MODULES-Konstante auf Modul-Level in build.py (importierbar fuer Tests)"
  - "check_duplicate_functions(): Pre-Build-Schutz gegen verwaiste Funktionskoerper"
  - "check_module_list_sync(): Abbruch bei Abweichung loader.js vs build.py"
  - "DEBUG_MODE-Post-Replace-Assertion: Production-Build bricht ab wenn DEBUG_MODE: true nach Flip noch vorhanden"
  - "pytest-Suite 10/10 Tests gruen (4 neue STAB-07-Tests)"

affects: [build-system, ci, alle-zukunftigen-module-hinzufuegungen]

tech-stack:
  added: []
  patterns:
    - "Pre-Build-Check-Pattern: check_*()-Funktionen brechen Build mit sys.exit(1) ab (deterministisch, an der Wurzel)"
    - "Modul-Level-MODULES-Konstante: Ermoeglicht Import-Barkeit in pytest ohne Seiteneffekte"
    - "TDD-Commit-Protokoll fuer Build-System: test(RED) -> feat(GREEN)"

key-files:
  created: []
  modified:
    - "build.py"
    - "tests/build/test_build_deduplication.py"

key-decisions:
  - "Pre-Build-Duplikat-Check statt Pass-3-Body-Fix (loest Problem an der Wurzel, deterministisch, kein komplexes Brace-Tracking)"
  - "MODULES auf Modul-Level fuer Test-Import-Barkeit (pytest kann 'from build import MODULES' ohne build() aufzurufen)"
  - "TDD-Protokoll strikt eingehalten: RED-Commit mit NameError-Fehlern, dann GREEN-Commit mit aktivierten Imports"

patterns-established:
  - "Build-Haertung-Pattern: Alle Pre-Build-Validierungen als eigenstaendige Funktionen, nicht inline in build()"
  - "pytest-Sync-Test-Pattern: check_module_list_sync() wird in try/except SystemExit aufgerufen -> pytest.fail()"

requirements-completed: [STAB-07]

duration: 40min
completed: "2026-06-12"
---

# Phase 1 Plan 04: Build-System-Haertung (STAB-07) Summary

**Build bricht jetzt hart ab bei doppelter Top-Level-Funktion, DEBUG_MODE=true in Production oder Modullisten-Abweichung — 10/10 pytest-Tests gruen, TDD-Protokoll eingehalten**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-06-12T06:55:54Z
- **Completed:** 2026-06-12T07:13:54Z
- **Tasks:** 3 (Task 1 + Task 2 + Task 3 TDD RED/GREEN)
- **Files modified:** 2

## Accomplishments

- MODULES-Konstante von lokalem build()-Scope auf Modul-Level gehoben — jetzt importierbar fuer Tests ohne den Build zu starten
- Pre-Build-Duplikat-Check (check_duplicate_functions) und Modullisten-Sync-Check (check_module_list_sync) laufen vor dem JS-Kombinieren; aktueller Stand: 92 Module synchron, keine Duplikat-Funktionen
- DEBUG_MODE-Post-Replace-Assertion: Production-Build bricht mit `[ABORTED]`-Meldung ab, wenn nach dem String-Replace noch `DEBUG_MODE: true` im Bundle steht
- pytest-Suite von 6 auf 10 Tests erweitert; alle Tests gruen inkl. neu hinzugefuegter STAB-07-Abdeckung

## Task Commits

1. **Task 1: MODULES zu Modul-Level heben + Pre-Build-Duplikat- und Sync-Check** - `71db752` (feat)
2. **Task 2: DEBUG_MODE-Post-Replace-Assertion** - `937699f` (feat)
3. **Task 3 RED: Neue pytest-Tests (NameError wegen fehlender Importe)** - `98716a9` (test)
4. **Task 3 GREEN: Import-Zeile aktiviert, 10/10 Tests gruen** - `4ce64b7` (feat)

## Files Created/Modified

- `build.py` - MODULES als Modul-Level-Konstante; check_duplicate_functions(); check_module_list_sync(); DEBUG_MODE-Assertion in Production-Zweig; lokale modules-Liste in build() durch MODULES ersetzt; beide Checks vor JS-Kombinieren aufgerufen
- `tests/build/test_build_deduplication.py` - Importzeile erweitert; 4 neue Testmethoden: test_production_build_has_debug_mode_false, test_module_lists_are_synchronized, test_duplicate_function_check_detects_duplicate, test_no_orphaned_return_statements

## Decisions Made

- **Pre-Build-Check statt Pass-3-Body-Fix:** Der bestehende Pass-3-Code (remove_duplicate_functions) hat einen bekannten Bug: er ueberspringt die `function`-Zeile, aber nicht den Funktionskoerper — das loest Orphaned-Body-Fehler aus. Statt diesen Bug zu fixen (komplex, fragil durch verschachtelte Funktionen), wird das Problem an der Quelle geloest: Duplikate werden VOR dem Bundling erkannt und der Build abbricht hart.
- **MODULES auf Modul-Level:** Test-Import-Barkeit war das entscheidende Kriterium. Mit lokaler Variable in build() konnten Tests nicht `from build import MODULES` nutzen ohne den ganzen Build-Prozess zu triggern.
- **TDD-Protokoll eingehalten:** Gemass CLAUDE.md "Test-Driven Development Pattern" fuer Build-System-Aenderungen: RED-Commit mit bewusst fehlenden Imports (NameError), dann GREEN-Commit mit aktiviertem Import.

## Deviations from Plan

None - Plan wurde exakt wie beschrieben ausgefuehrt.

## Issues Encountered

- pytest war auf dem System nicht installiert (`No module named pytest`) — via `pip install pytest` behoben (kein Commit noetig, da nur Entwicklungsumgebung).
- `test_no_orphaned_return_statements` prueft `dnd-tracker-bundled.html` (dev-Build) — musste zusaetzlich `python build.py` (ohne --production) ausfuehren, damit dieser Test nicht geskippt wird.

## User Setup Required

None - keine externen Services, keine Umgebungsvariablen.

## Next Phase Readiness

- Build-Haertung vollstaendig: STAB-07 abgeschlossen
- Naechste Phase (01-05 oder 01-06) kann darauf aufbauen, dass der Build bei Modullisten-Abweichungen oder Duplikat-Funktionen abbricht
- Kein Blocker fuer nachfolgende Plans

## Self-Check

Files exist check:
- `build.py` — existiert und wurde committed (71db752, 937699f)
- `tests/build/test_build_deduplication.py` — existiert und wurde committed (98716a9, 4ce64b7)

Commits exist check:
- 71db752 — Task 1 MODULES + Checks
- 937699f — Task 2 DEBUG_MODE-Assertion
- 98716a9 — Task 3 RED
- 4ce64b7 — Task 3 GREEN

## Self-Check: PASSED

Alle 4 Commits existieren. Beide modifizierten Dateien vorhanden. Build (--production) endet mit Exit-Code 0. pytest 10/10 gruen.

---
*Phase: 01-stabilisierung*
*Completed: 2026-06-12*
