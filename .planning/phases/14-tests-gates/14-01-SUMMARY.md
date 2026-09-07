---
phase: 14-tests-gates
plan: 01
subsystem: testing
tags: [eslint, no-control-regex, lint, ci, measurement-protocol, tsc-checkjs, jest-coverage]

# Dependency graph
requires:
  - phase: 12-datensicherheit
    provides: "WR-01-Steuerzeichen-Strip in validateAvatarURL() (Commit d2a521c), der den seit 2026-09-05 roten Lint-Fehler auslöste"
  - phase: 13-h-rtung-wartbarkeit
    provides: "13-PERF-MEASUREMENT.md als Formvorbild für das Messprotokoll dieses Plans"
provides:
  - "npx eslint . läuft wieder mit Exit 0 — CI-Job lint-and-typecheck und die davon abhängige needs:-Kette (e2e, build, smoke-test, deploy) sind entsperrt"
  - "14-GATE-BASELINE.md: eingechecktes Vor-Schärfungs-Messprotokoll mit allen Startwerten für die Pläne 14-06 (Lint), 14-07 (Typecheck), 14-08 (Coverage/roots), 14-09 (Modul-zu-Test-Gate)"
affects: [14-02, 14-06, 14-07, 14-08, 14-09]

# Actuals (#2632)
actuals:
  tokens: 3200
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "eslint-disable-next-line mit Begründung + Herkunftsverweis (WR-01/Commit) statt Regel- oder Dateiabschaltung"
    - "Eingechecktes Messprotokoll (Befehl + Datum + Ergebnis + Interpretation) als Artefakt statt Behauptung im Summary — Fortsetzung des Musters aus 13-PERF-MEASUREMENT.md"

key-files:
  created:
    - .planning/phases/14-tests-gates/14-GATE-BASELINE.md
  modified:
    - systems/avatars.js

key-decisions:
  - "D-07 zuerst und isoliert umgesetzt: der rote Lint-Fehler blockierte die gesamte CI-Kette, deshalb eigene erste Aufgabe vor jeder anderen Gate-Arbeit dieser Phase"
  - "tsc --checkJs-Fehlerzahl dieser Messung (1758/117/134) als maßgeblich gegenüber der CONTEXT.md-Zahl (1617/98/103) gesetzt — reproduzierbar mit dokumentiertem Befehl, stimmt mit RESEARCH.md-Re-Verifikation exakt überein"
  - "vm-Ladepfad-Zahl auf 28 von 40 korrigiert (CONTEXT.md nannte 30) — nicht ratschen-relevant für D-13, aber der Vollständigkeit halber aufgelöst"
  - "Modul-zu-Test-Kriterium (c) hat einen dokumentierten Falsch-Positiv (npc-generator.js trifft auf den UI-Bezeichner #npc-generator-modal, nicht das Modul) — als Warnsignal für die Kriteriumswahl in 14-09 festgehalten, nicht stillschweigend gezählt"

patterns-established:
  - "Fünf-Block-Messprotokoll-Form (Befehl, Datum, Ergebnis, Interpretation je Block, Divergenz-Abschnitt am Ende) für alle künftigen Baseline-Erhebungen dieser Phase"

requirements-completed: [TEST-05]

coverage:
  - id: D1
    description: "Roter no-control-regex-Lint-Fehler in systems/avatars.js gezielt und begründet stummgeschaltet (D-07)"
    requirement: "TEST-05"
    verification:
      - kind: unit
        ref: "tests/unit/avatars.test.js — 14/14 Tests"
        status: pass
      - kind: other
        ref: "npx eslint . — Exit 0, 0 Fehler, 2196 Warnungen (unverändert)"
        status: pass
      - kind: other
        ref: "grep -c 'eslint-disable' systems/avatars.js == 1; grep -c 'eslint-disable-next-line no-control-regex' == 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "Vor-Schärfungs-Messprotokoll 14-GATE-BASELINE.md mit fünf Messblöcken erhoben und eingecheckt (Basis für 14-06 bis 14-09)"
    requirement: "TEST-05"
    verification:
      - kind: other
        ref: "test -f .planning/phases/14-tests-gates/14-GATE-BASELINE.md"
        status: pass
      - kind: other
        ref: "grep -c '^## ' 14-GATE-BASELINE.md -> 6 (>= 6 gefordert)"
        status: pass
      - kind: unit
        ref: "tests/unit/welt-story.test.js — 37/37 Tests (Abnahmewert für D-05, Messblock 5)"
        status: pass
    human_judgment: true
    rationale: "Die inhaltliche Richtigkeit der erhobenen Zahlen (insbesondere die aufgelöste tsc-checkJs-Divergenz und die Modul-zu-Test-Kriteriumswahl) ist kein automatisch prüfbares Kriterium — der Planer von 14-06/14-07/14-09 muss die Interpretation im Dokument fachlich nachvollziehen, bevor er die Ratschen darauf pinnt."

duration: 15min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 01: Lint-Fix + Gate-Baseline Summary

**Roten `no-control-regex`-Lint-Fehler in `avatars.js` gezielt stummgeschaltet und ein
Fünf-Block-Messprotokoll für die Lint-/Typecheck-/Coverage-Ratschen der Pläne 14-06 bis 14-09 erhoben.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-09-07T06:06Z (ca.)
- **Completed:** 2026-09-07T06:14Z
- **Tasks:** 2
- **Files modified:** 2 (1 geändert, 1 neu)

## Accomplishments
- `systems/avatars.js`: `eslint-disable-next-line no-control-regex` mit Begründung (WR-01, Commit
  `d2a521c`) direkt über dem Steuerzeichen-Strip in `validateAvatarURL()` eingefügt — `npx eslint .`
  läuft wieder mit Exit 0 (0 Fehler, 2196 Warnungen unverändert). Die CI-Kette `lint-and-typecheck`
  → `e2e`/`build`/`smoke-test`/`deploy` ist damit entsperrt.
- `tests/unit/avatars.test.js` (14 Tests, WR-01-Regressionsnetz) bleibt vollständig grün — der
  Steuerzeichen-Strip selbst wurde nicht angefasst.
- `.planning/phases/14-tests-gates/14-GATE-BASELINE.md` angelegt: fünf frisch erhobene Messblöcke
  (Lint-Reststand, `tsc --checkJs`, Coverage vor/nach `roots`-Fix, Modul-zu-Test-Abdeckung,
  Testsummen der beiden Welt-Sammeldateien) plus ein Abschnitt zu den zwei dokumentierten
  Divergenzen zwischen `CONTEXT.md` und `RESEARCH.md`.
- Beide temporären Mess-Artefakte (`tsconfig.checkjs-probe.json`, ESLint-JSON-Export) wurden nach
  der Auswertung wieder entfernt und nie eingecheckt.

## Task Commits

Each task was committed atomically:

1. **Task 1: Roten `no-control-regex`-Fehler gezielt und begründet stumm schalten (D-07)** - `1f5abd0` (fix)
2. **Task 2: Vor-Schärfungs-Messprotokoll erheben und einchecken** - `1e777dd` (docs)

**Plan metadata:** wird im Anschluss committet (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified
- `systems/avatars.js` - eine `eslint-disable-next-line`-Zeile mit Begründung ergänzt, Regex selbst unverändert
- `.planning/phases/14-tests-gates/14-GATE-BASELINE.md` - neues Messprotokoll (5 Blöcke + Divergenz-Abschnitt)

## Decisions Made
- `tsc --checkJs`-Fehlerzahl dieser Messung (1758 Fehler, 117 von 134 Dateien) als maßgeblich
  gegenüber der CONTEXT.md-Zahl (1617/98/103) festgeschrieben — reproduzierbar mit dem in
  `14-GATE-BASELINE.md` dokumentierten Befehl, deckungsgleich mit `RESEARCH.md`s unabhängiger
  Re-Verifikation.
- `vm`-Ladepfad-Zahl auf 28 von 40 Unit-Testdateien korrigiert (CONTEXT.md nannte 30); kein
  Einfluss auf eine Ratsche, aber der Vollständigkeit halber im Divergenz-Abschnitt aufgelöst.
- Modul-zu-Test-Kriterium (c) (Basisname mit Wortgrenzen) erzeugt einen Falsch-Positiv bei
  `npc-generator.js` (trifft auf den UI-Bezeichner `#npc-generator-modal`, nicht auf das Modul
  selbst) — dokumentiert statt stillschweigend als Abdeckung gezählt, als Warnsignal für die
  Kriteriumswahl in Plan 14-09.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `npx eslint .` ist grün; alle nachfolgenden Pläne dieser Phase (inkl. des Tracers in 14-02)
  können sich auf einen laufenden Lint-Gate-Nachweis stützen.
- `14-GATE-BASELINE.md` liefert allen späteren Ratschen-Plänen (14-06 bis 14-09) ihre
  Startwerte — insbesondere die 17-Dateien-Zulassungsliste für `tsconfig.strict.json` (14-07) und
  die aufgelöste `tsc --checkJs`-Fehlerzahl.
- Keine Blocker für Plan 14-02 (Tracer).

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- FOUND: `systems/avatars.js`
- FOUND: `.planning/phases/14-tests-gates/14-GATE-BASELINE.md`
- FOUND: commit `1f5abd0` (Task 1)
- FOUND: commit `1e777dd` (Task 2)
- Re-ran `npx eslint .` → Exit 0, 0 Fehler, 2196 Warnungen (unverändert)
- Re-ran `npx jest tests/unit/avatars.test.js` → 14/14 grün
- Re-ran full `npx jest` → 43 Suiten / 1109 Tests grün (unverändert)
