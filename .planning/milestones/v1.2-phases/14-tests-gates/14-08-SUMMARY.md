---
phase: 14-tests-gates
plan: 08
subsystem: testing
tags: [jest, coverage, istanbul, roots, coverage-threshold]

# Dependency graph
requires:
  - phase: 14-tests-gates
    provides: "14-04/14-05: Aufteilung der Sammeldateien in dedizierte Testdateien lieferte die Suiten-/Testzahl-Baseline (48/1112), gegen die die roots-Aenderung geprueft wird"
  - phase: 14-tests-gates
    provides: "14-06: Lint-Ratsche (no-undef: error, --max-warnings 367) als unabhaengige Referenz, dass npx eslint . unveraendert gruen bleibt"
provides:
  - "roots in jest.config.cjs repariert (D-12): Coverage-Sammlung durchsucht jetzt tatsaechlich core/features/systems/ui/render statt nur tests/"
  - "Ehrliche Gesamt-Coverage (0,77% Statements ueber 125 instrumentierte Dateien) in 14-GATE-BASELINE.md dokumentiert statt kaschiert"
  - "Coverage-Schwellen fuer utils/testable-utils.js auf gemessenen Stand angehoben (D-14): vier Einzelwerte statt Pauschalwert 80, beidseitig als Ratsche geprueft"
affects: [14-09]

# Actuals (#2632)
actuals:
  tokens: 900
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "roots muss das Projekt-Wurzelverzeichnis umfassen, damit collectCoverageFrom greift — testPathIgnorePatterns reicht allein nicht aus, um Testerkennung und Instrumentierungsumfang zu entkoppeln"
    - "Coverage-Schwellen als Ratsche: je Metrik einzeln auf naechstkleinere ganze Zahl unterhalb des gemessenen Werts setzen (nicht aufrunden, nicht pauschalisieren), beidseitig mit Probe-Skript belegen"

key-files:
  created: []
  modified:
    - jest.config.cjs
    - .planning/phases/14-tests-gates/14-GATE-BASELINE.md

key-decisions:
  - "roots von ['<rootDir>/tests'] auf ['<rootDir>'] erweitert statt collectCoverageFrom-Pfadstil zu aendern — der Defekt lag ausschliesslich in roots, testMatch/testPathIgnorePatterns/collectCoverageFrom blieben unangetastet (Diff-Nachweis: 0 Loeschungen in diesen drei Schluesseln)"
  - "Schwellen einzeln je Metrik gesetzt (branches 89, functions 99, lines 94, statements 92) statt eines gemeinsamen Werts — die vier gemessenen Prozentwerte liegen messbar auseinander (92,81/89,28/100/94,44)"
  - "Keine globale Statement-Schwelle ergaenzt — die dafuer noetige Instrumentierung des vm-basierten Ladepfads ist eigenes Vorhaben ausserhalb dieser Phase; das schaerfere Gate ist das Modul-zu-Test-Gate aus Plan 14-09"

requirements-completed: [TEST-05]

coverage:
  - id: D1
    description: "roots repariert: Coverage-Sammlung durchsucht jetzt core/features/systems/ui/render; Testerkennung (48 Suiten/1112 Tests) bleibt exakt unveraendert; ehrliche Gesamtzahl (0,77% Statements, 125 instrumentierte Dateien) in 14-GATE-BASELINE.md dokumentiert"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "grep -n 'roots:' jest.config.cjs — zeigt <rootDir> ohne /tests-Pfadbestandteil"
        status: pass
      - kind: unit
        ref: "npx jest — 48/48 Suiten, 1112/1112 Tests, identisch vor und nach der Aenderung"
        status: pass
      - kind: other
        ref: "npx jest --coverage — Coverage-Tabelle listet 125 statt vormals 2 Dateien"
        status: pass
      - kind: other
        ref: "git diff --unified=0 jest.config.cjs | grep -c '^-.*collectCoverageFrom\\|^-.*testMatch' — 0 Treffer"
        status: pass
      - kind: other
        ref: "grep -q 'Coverage nach dem roots-Fix' .planning/phases/14-tests-gates/14-GATE-BASELINE.md — vorhanden"
        status: pass
    human_judgment: false
  - id: D2
    description: "Coverage-Schwellen fuer utils/testable-utils.js auf gemessenen Stand angehoben: vier Einzelwerte (branches 89, functions 99, lines 94, statements 92), beidseitig als Ratsche belegt"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "node-Probe: alle vier Werte sind Zahlen > 80"
        status: pass
      - kind: other
        ref: "npx jest --coverage mit gesetzten Werten — Exit 0, kein 'coverage threshold' in der Ausgabe"
        status: pass
      - kind: other
        ref: "Probe-Skript: statements-Schwelle probeweise +6 Punkte angehoben — Lauf bricht ab (Exitcode 1), eingecheckte Datei danach unveraendert, kein .probe-Rest"
        status: pass
      - kind: other
        ref: "git diff --unified=0 jest.config.cjs | grep -c '^+.*global:' — 0 Treffer, keine globale Schwelle ergaenzt"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 08: Coverage-Messung repariert, ehrliche Zahl dokumentiert, Ratsche fuer testable-utils.js gesetzt Summary

**`jest.config.cjs`s `roots` reparierte die tote Coverage-Konfiguration (2 → 125 instrumentierte Dateien, ehrliche 0,77% Statement-Coverage in `14-GATE-BASELINE.md` dokumentiert), und die vier Einzelschwellen für `utils/testable-utils.js` sitzen jetzt beweisbar am gemessenen Stand statt 13 Punkte darunter.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-09-07
- **Completed:** 2026-09-07
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- **D-12 behoben:** `roots: ['<rootDir>/tests']` → `roots: ['<rootDir>']`. `testMatch`,
  `testPathIgnorePatterns` und `collectCoverageFrom` blieben dabei unangetastet — der Defekt lag
  ausschließlich in `roots`, das bisher verhinderte, dass Jest die in `collectCoverageFrom`
  gelisteten Quellverzeichnisse überhaupt in seine Modulkarte aufnimmt.
- **Testerkennung nachweislich unverändert:** `npx jest` meldet vor und nach der Änderung
  identisch 48 Suiten / 1112 Tests. Zusätzlich per `find` bestätigt, dass keine `*.test.js`-Datei
  außerhalb von `tests/` existiert, die durch den breiteren `roots`-Wert neu eingesammelt werden
  könnte.
- **Ehrliche Gesamt-Coverage dokumentiert (nicht kaschiert):** 125 statt vormals 2 Dateien werden
  jetzt instrumentiert; die ehrliche Statement-Coverage ist **0,77 %** (147/18942), nicht die
  vorherigen scheinbaren 92,45 % (die sich nur auf 159 von 18950 möglichen Statements bezogen).
  `14-GATE-BASELINE.md` trägt jetzt einen Abschnitt „Coverage nach dem roots-Fix" mit allen vier
  Metriken und einer Einordnung, warum die Zahl strukturell niedrig bleibt: der überwiegende Teil
  der Unit-Tests lädt Produktionscode über einen eigenen `vm.createContext`-Ausführungskontext, an
  den Istanbuls Instrumentierung nicht herankommt, und ein weiterer Teil prüft Quelltext als Text.
- **D-14 abgeschlossen:** Die vier `coverageThreshold`-Werte für `utils/testable-utils.js` — der
  einzigen Datei, für die Statement-Coverage in dieser Architektur aussagekräftig ist, weil sie
  über den regulären Jest-Ladepfad läuft — wurden einzeln gemessen (92,81 % / 89,28 % / 100 % /
  94,44 %) und je auf die nächstkleinere ganze Zahl darunter gesetzt (92 / 89 / 99 / 94). Ein
  Kommentar über dem Block nennt Messdatum, die vier gemessenen Werte und die Nur-Steigen-Regel.
- **Ratschenwirkung beidseitig bewiesen:** mit den gesetzten Werten läuft `npx jest --coverage`
  durch (Exit 0); ein Probe-Skript hebt die `statements`-Schwelle temporär um 6 Punkte an — derselbe
  Lauf bricht dann ab (Exit 1) — und stellt die eingecheckte Datei danach unverändert wieder her
  (kein `.probe`-Rest in `git status`).
- Keine globale Coverage-Schwelle ergänzt (D-13 bleibt ausdrücklich eigenes Vorhaben außerhalb
  dieser Phase — das schärfere Gate dieser Phase ist das Modul-zu-Test-Gate aus Plan 14-09).

## Task Commits

1. **Task 1: `roots` reparieren und Testerkennung als unverändert nachweisen (D-12)** - `f176f50` (fix)
2. **Task 2: Schwellen für `utils/testable-utils.js` auf gemessenen Stand anheben (D-14)** - `adef493` (fix)

**Plan metadata:** wird im Anschluss committet (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified
- `jest.config.cjs` - `roots` repariert (`<rootDir>` statt `<rootDir>/tests`), vier Coverage-Schwellen für `utils/testable-utils.js` angehoben mit Begründungskommentar
- `.planning/phases/14-tests-gates/14-GATE-BASELINE.md` - neuer Abschnitt „Coverage nach dem roots-Fix" mit den ehrlichen Zahlen und ihrer Einordnung

## Decisions Made
- **`roots` statt `collectCoverageFrom`-Pfadstil geändert:** `roots` steuert, welche Verzeichnisse
  Jest überhaupt in seine Modulkarte aufnimmt — ein anderer Pfadstil in `collectCoverageFrom` hätte
  das strukturelle Problem nicht gelöst.
- **Vier Einzelwerte statt Pauschalwert:** die gemessenen Prozentwerte (92,81/89,28/100/94,44)
  liegen messbar auseinander; ein gemeinsamer Wert wäre für drei Metriken zu locker oder für eine
  zu eng gewesen.
- **Keine globale Statement-Schwelle:** die dafür nötige Instrumentierung des `vm`-basierten
  Ladepfads ist ein eigenes, außerhalb dieser Phase liegendes Vorhaben.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Die Coverage-Konfiguration misst jetzt tatsächlich den Quellbaum; die ehrliche Zahl (0,77 %
  Statements über 125 Dateien) steht im Messprotokoll statt in der Schublade.
- Die einzige aussagekräftige Coverage-Schwelle (`utils/testable-utils.js`) wirkt nachweislich als
  Ratsche — beidseitig geprüft.
- Volle Suiten grün: `npx jest` 48/48 Suiten · 1112/1112 Tests, `npx jest --coverage` grün,
  `npx eslint .` 0 Fehler/367 Warnungen (unveränderte Ratsche aus Plan 14-06), `npx tsc --noEmit`
  Exit 0.
- Bereit für Plan 14-09 (Modul-zu-Test-Gate) — das schärfere Coverage-Gate dieser Phase.

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- FOUND: commit `f176f50` (Task 1)
- FOUND: commit `adef493` (Task 2)
- Re-ran `npx jest` → 48/48 Suiten, 1112/1112 Tests grün
- Re-ran `npx jest --coverage` → Exit 0, 125 instrumentierte Dateien, 0,77% Statements gesamt
- Re-ran `npx eslint .` → Exit 0, 0 Fehler, 367 Warnungen
- Re-ran `npx tsc --noEmit` → Exit 0
- Verified `jest.config.cjs` restored after probe script (no `.probe` file, `git status` clean for that path)
