---
phase: 01-stabilisierung
plan: 08
subsystem: testing
tags: [storage, persistence, regression-tests, vm, jest, tdd, cr-01, stab-05]

# Dependency graph
requires:
    - phase: 01-stabilisierung
      plan: 02
      provides: Persistenz-Härtung (_ts-Mechanismus, IDB-Stale-Shadow-Detection) die quick-roll.js nutzt
provides:
    - vm-basierte Regressionstests für resolveStorageConflict (CR-01-Nachweis + Absicherung)
    - Fix für Endlosrekursion in quick-roll.js (STAB-05/SC2 auf Code-Ebene erfüllt)
    - Deterministischer IDB-Vorrang ohne externen UI-Hook
    - Andockpunkt window.showStorageConflictDialogUI für spätere D-07-Dialog-Implementierung
affects:
    - 01-stabilisierung (gap-closure CR-01 geschlossen)
    - Zukünftige Phase: D-07 Auswahl-Dialog (window.showStorageConflictDialogUI-Hook)

# Tech tracking
tech-stack:
    added: []
    patterns:
        - 'vm-basierte Tests gegen echten Produktionscode (nicht Inline-Simulation) — analog migration.test.js'
        - 'Quelltext-Audit via Regex in Tests (Test E: Selbstreferenz-Guard)'

key-files:
    created:
        - tests/unit/storage-conflict.test.js
    modified:
        - systems/spellslots/quick-roll.js

key-decisions:
    - 'resolveStorageConflict statt showStorageConflictDialog — unterschiedlicher Name verhindert Selbstrekursion strukturell'
    - 'Andockpunkt window.showStorageConflictDialogUI (anders benannt) für späteren D-07-Dialog reserviert'
    - 'IDB-Vorrang als deterministischer Fallback — kein stiller LS-Sieg, SC2/STAB-05 auf Code-Ebene erfüllt'
    - 'D-07-Auswahl-Dialog bewusst NICHT in diesem Gap-Plan (nur Rekursions-Fix, kein UI-Scope-Creep)'
    - 'load() bleibt synchron/callback-basiert — kein await, verhindert Race-Condition mit laufendem Load-Pfad'

patterns-established:
    - 'vm-Test-Muster: fs.readFileSync + vm.createContext + vm.runInContext für echten Produktionscode (kein Inline-Replikat)'
    - 'Quelltext-Audit-Test: Regex-Prüfung direkt auf Quelldatei als dauerhafte Guard-Assertion'

requirements-completed: [STAB-05]

# Metrics
duration: 3min
completed: 2026-06-12
---

# Phase 01 Plan 08: Storage-Konflikt-Auflösung — CR-01-Fix Summary

**Endlosrekursion in quick-roll.js (CR-01) beseitigt: showStorageConflictDialog → resolveStorageConflict umbenannt, Selbstreferenz strukturell entfernt, vm-basierte Regressionstests sichern den Konfliktpfad dauerhaft ab.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-12T09:06:32Z
- **Completed:** 2026-06-12T09:09:16Z
- **Tasks:** 2 (Task 1: RED, Task 2: GREEN)
- **Files modified:** 2

## Accomplishments

- CR-01 strukturell beseitigt: `showStorageConflictDialog` durch `resolveStorageConflict` ersetzt, keine Selbstreferenz über `window.<eigener Name>` mehr möglich
- STAB-05/SC2 auf Code-Ebene erfüllt: bei echtem LS/IDB-Konflikt gewinnt deterministisch der neuere IDB-Stand (kein stiller Sieg veralteter LS-Daten)
- WR-06-Testlücke für Konfliktpfad geschlossen: 5 vm-basierte Tests rufen die PRODUKTIONS-Funktion auf (kein Inline-Replikat), inkl. dauerhaftem Quelltext-Audit (Test E)
- Ungenutzter `window.showStorageConflictDialogInternal`-Export entfernt (IN-02/Export-Audit-Regel)
- Andockpunkt `window.showStorageConflictDialogUI` für spätere D-07-Dialog-Implementierung vorbereitet

## Task Commits

Jede Task wurde einzeln committet (TDD-Zyklus):

1. **Task 1: vm-basierte Regressionstests schreiben (RED)** — `83fc966` (test)
2. **Task 2: CR-01 beheben — Selbstrekursion entfernen (GREEN)** — `80687fb` (fix)

_TDD-Zyklus: test → fix (kein separater refactor commit nötig — Code war nach dem Fix bereits sauber)_

## Files Created/Modified

- `tests/unit/storage-conflict.test.js` — Neue Datei: 5 vm-basierte Tests gegen echten quick-roll.js-Code (Test A: kein RangeError; B: IDB-Fallback; C: Identisch-Fall; D: UI-Hook; E: Quelltext-Audit)
- `systems/spellslots/quick-roll.js` — Umbenannt/gefixt: showStorageConflictDialog → resolveStorageConflict, Selbstrekursion entfernt, ungenutzter Export entfernt, Aufruf in load() angepasst

## Decisions Made

- `resolveStorageConflict` als neuer Funktionsname: strukturell unmöglich, dass `window.<eigener Name>` jemals auf diese Funktion zeigt (CR-01-Fix ist self-enforcing)
- `window.showStorageConflictDialogUI` als Andockpunkt: absichtlich anders benannt als die interne Funktion, damit kein zukünftiger Namenkonflikt entsteht
- IDB-Vorrang als deterministischer Default: sicherer als stiller LS-Sieg; Nutzer verliert keine neueren Daten
- `load()` bleibt synchron: kein `await resolveStorageConflict` eingeführt, da der Load-Pfad nach dem Dialog-Aufruf weiterläuft und ein asynchroner Dialog mit dem Wert `s` racen würde

## Deviations from Plan

### Plan-Abweichung: D-07 Auswahl-Dialog

> **Deviation ggü. D-07:** Der von D-07 geforderte Auswahl-Dialog wird in diesem Gap-Plan NICHT geliefert. Stattdessen ist der `window.showStorageConflictDialogUI`-Hook als Andockpunkt für eine spätere Phase vorbereitet; ist kein Hook gesetzt, gewinnt deterministisch der neuere IDB-Stand (kein stiller Verlust). SC2/STAB-05 ist damit auf Code-Ebene erfüllt; der vollständige D-07-Auswahl-Dialog ist als Folge-Arbeit reserviert.

**Begründung:** Dieser Gap-Plan hat ausschließlich den CR-01-Absturz (Endlosrekursion) als Scope. Der D-07-Dialog wäre ein eigenständiger UI-Feature-Scope (neue DOM-Elemente, esc()-Pflicht, asynchrones Warten auf Nutzereingabe). Diesen in einen Bugfix-Plan einzumischen hätte die Komplexität erhöht und den synchronen Load-Pfad mit einer Race-Condition belastet (siehe REVIEW.md CR-01 Zusatzhinweis). SC2 ist durch den deterministischen IDB-Vorrang code-seitig erfüllt.

---

Weitere Abweichungen: keine — Plan wurde exakt wie spezifiziert ausgeführt.

## Issues Encountered

None — der TDD-Zyklus verlief sauber: Tests waren im RED-Zustand korrekt rot (5/5 fail), nach dem Fix korrekt grün (5/5 pass). Keine unerwarteten Abhängigkeits- oder Build-Probleme.

## User Setup Required

None — keine externen Services, keine Umgebungsvariablen, keine Konfigurationsänderungen erforderlich.

## Next Phase Readiness

- Plan 01-09 (STAB-04: `npm run check` grünhalten) ist der letzte offene Gap-Plan dieser Phase
- CR-01 ist geschlossen; STAB-05/SC2 auf Code-Ebene erfüllt
- D-07 (Auswahl-Dialog UI) bleibt als reservierte Folge-Arbeit für eine spätere Phase offen
- Der `window.showStorageConflictDialogUI`-Hook ist vorbereitet und dokumentiert

## Self-Check

### Erstellte Dateien

- `tests/unit/storage-conflict.test.js`: FOUND
- `systems/spellslots/quick-roll.js`: FOUND (modifiziert)

### Commits

- `83fc966` (test): FOUND
- `80687fb` (fix): FOUND

### TDD Gate Compliance

| Gate     | Commit-Pattern     | Status         |
| -------- | ------------------ | -------------- |
| RED      | `test(01-08): ...` | 83fc966 — PASS |
| GREEN    | `fix(01-08): ...`  | 80687fb — PASS |
| REFACTOR | Nicht erforderlich | —              |

## Self-Check: PASSED

---

_Phase: 01-stabilisierung_
_Completed: 2026-06-12_
