---
phase: 14-tests-gates
plan: 03
subsystem: testing
tags: [playwright, e2e, test-utils, toast-race, flake-fix]

# Dependency graph
requires:
  - phase: 14-01
    provides: Phase-14-Grundlagen (Nyquist-Baseline, Gate-Messwerte)
provides:
  - "seedCleanSession(page) als einziger Seed-Helfer fuer die fuenf CRUD-E2E-Specs"
  - "Toast-Race in locations.spec.js/encounters.spec.js geschlossen, mit rot/gruen-Beweis"
affects: [14-tests-gates-restliche-plaene, zukuenftige-e2e-crud-specs]

# Actuals (#2632)
actuals:
  tokens: 9500
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Byte-identische Testsetup-Bloecke werden als benannter Helfer in test-utils.js extrahiert, nicht ein drittes/viertes Mal kopiert (D-01)."
    - "Ein Fix-Nachweis fuer eine intermittierende Race besteht aus protokolliertem rotem Vorlauf + gruenem Nachlauf bei identischen Lastparametern, nicht aus einem gruenen Lauf allein (D-02, Fortsetzung von 08-LEARNINGS/11-LEARNINGS/13-PERF-MEASUREMENT)."

key-files:
  created:
    - .planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md
  modified:
    - tests/e2e/helpers/test-utils.js
    - tests/e2e/crud/party.spec.js
    - tests/e2e/crud/npcs.spec.js
    - tests/e2e/crud/quests.spec.js
    - tests/e2e/crud/locations.spec.js
    - tests/e2e/crud/encounters.spec.js

key-decisions:
  - "seedCleanSession(page) wandert als einziger Helfer nach test-utils.js (D-01) — der 61-zeilige Ursachenkommentar aus Plan 08-02 wandert vollstaendig mit."
  - "Der Fix wurde nicht abgenommen, bevor ein roter Vorlauf gegen den ungefixten Stand vorlag (D-02) — bereits die niedrigste Laststufe (--repeat-each=5 --workers=4) war rot, eine hoehere Stufe war nicht noetig."
  - "playwright.config.js bleibt unangetastet, retries: process.env.CI ? 2 : 0 (D-03) — Retries wurden nur punktuell per Kommandozeile fuer den Beweislauf auf 0 gesetzt."

patterns-established:
  - "Seed-Helfer-Extraktion mit MD5-Gleichheitspruefung vor dem Entfernen der Kopien, um Verhaltensneutralitaet nachzuweisen."

requirements-completed: [TEST-03]

coverage:
  - id: D1
    description: "seedCleanSession(page) existiert genau einmal in tests/e2e/helpers/test-utils.js und wird von allen fuenf CRUD-Specs (party, npcs, quests, locations, encounters) vor loadApp(page) aufgerufen."
    requirement: "TEST-03"
    verification:
      - kind: other
        ref: "grep -c 'export async function seedCleanSession' tests/e2e/helpers/test-utils.js -> 1"
        status: pass
      - kind: other
        ref: "grep -l 'await seedCleanSession(page);' ueber alle fuenf CRUD-Specs -> 5"
        status: pass
      - kind: other
        ref: "node -e Reihenfolgen-Check (seedCleanSession vor loadApp in allen fuenf Specs)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/crud/ -> 55 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Die Toast-Race in locations.spec.js/encounters.spec.js ist geschlossen und durch einen protokollierten roten Vorlauf plus zwei gruene Nachlaeufe bei identischen Lastparametern belegt (nicht durch einen gruenen Lauf allein)."
    requirement: "TEST-03"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js --retries=0 --repeat-each=5 --workers=4 (Vorlauf gegen d384e2e: 5 failed / 90 passed; Nachlauf 1+2 gegen 83815cb: je 95 passed / 0 failed)"
        status: pass
      - kind: other
        ref: ".planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md"
        status: pass
    human_judgment: true
    rationale: "Task 3 traegt einen expliziten <human-check> (Beweisfuehrung freigeben) in seinem <verify>-Block. Per workflow.human_verify_mode=end-of-phase (Default, unveraendert in config.json) wird dieser Checkpoint nicht mid-flight ausgeloest, sondern von der Verifikation am Phasenende aus dem Messprotokoll geharvestet."
  - id: D3
    description: "Keine Regression: volle E2E- und Jest-Suite bleiben nach der Extraktion gruen, keine kleinere Testzahl als der Ausgangswert nach Phase 13."
    verification:
      - kind: e2e
        ref: "npx playwright test (volle Suite) -> 321 passed / 2 skipped"
        status: pass
      - kind: unit
        ref: "npx jest -> 44 Suiten, 1112 Tests, alle bestanden"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 03: Toast-Race in locations/encounters.spec.js geschlossen (TEST-03) Summary

**`seedCleanSession(page)` als einziger Seed-Helfer in `test-utils.js` extrahiert und in allen fünf CRUD-E2E-Specs verdrahtet — Fix belegt durch protokollierten roten Vorlauf und zwei grüne Nachläufe bei identischen Lastparametern, nicht durch einen grünen Lauf allein.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3
- **Files modified:** 7 (6 geändert, 1 neu angelegt)

## Accomplishments

- Falsifikationsprobe gegen den ungefixten Stand: bereits die niedrigste Laststufe
  (`--repeat-each=5 --workers=4 --retries=0`) war rot — 5 von 95 Tests scheiterten an
  `encounters.spec.js:132` (`#toast` fällt zwischen Setzen und Assertion auf `hidden` zurück).
- `seedCleanSession(page)` als einziger Helfer nach `tests/e2e/helpers/test-utils.js` extrahiert,
  inklusive des vollständigen 61-zeiligen Ursachenkommentars zur Race (08-RESEARCH Pitfall 4).
- Alle fünf CRUD-Specs (`party`, `npcs`, `quests`, `locations`, `encounters`) rufen den Helfer
  jetzt vor `loadApp(page)` auf; `locations.spec.js` und `encounters.spec.js` seeden damit
  erstmals.
- Fix mit zwei unabhängigen, grünen Nachläufen bei identischen Beweisparametern belegt (95/95
  je Lauf, 0 Fehlschläge); volle Suiten (Playwright 321/2, Jest 1112/1112) bleiben unverändert
  grün.

## Task Commits

Each task was committed atomically:

1. **Task 1: Falsifikationsprobe — den ungefixten Stand nachweislich ROT bekommen** - `2d00236` (docs)
2. **Task 2: `seedCleanSession(page)` extrahieren und alle fünf CRUD-Specs darauf umstellen (D-01)** - `83815cb` (fix)
3. **Task 3: Nachlauf mit identischen Beweisparametern und Abschluss des Messprotokolls (D-02)** - `f591c9d` (docs)

**Plan metadata:** siehe finaler Metadata-Commit (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `.planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md` - Messprotokoll: roter Vorlauf, gefixte Nachläufe, Vergleichstabelle, Interpretation
- `tests/e2e/helpers/test-utils.js` - neue exportierte Funktion `seedCleanSession(page)` vor `loadApp`
- `tests/e2e/crud/party.spec.js` - lokaler Seed-Block entfernt, `seedCleanSession(page)` importiert und aufgerufen
- `tests/e2e/crud/npcs.spec.js` - dito
- `tests/e2e/crud/quests.spec.js` - dito
- `tests/e2e/crud/locations.spec.js` - `seedCleanSession(page)` neu importiert und vor `loadApp(page)` aufgerufen (Race-Fix)
- `tests/e2e/crud/encounters.spec.js` - dito

## Decisions Made

- D-01: Extraktion statt fünfter Kopie, Ursachenkommentar wandert vollständig mit.
- D-02: Kein Abnehmen des Fixes ohne roten Vorlauf; die erste, niedrigste Laststufe reichte bereits als Beweis.
- D-03: `playwright.config.js`/`retries` bleiben unangetastet; Retries nur punktuell per CLI im Beweislauf auf 0 gesetzt.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `TEST-03` ist abgeschlossen. Die Toast-Race, die seit der bekannten Vorbelastung offen war
  (siehe `preexisting-e2e-failures`-Notiz), ist geschlossen und die Ausnahme kann fallen.
- Task 3s `<human-check>` (Beweisführung freigeben) ist per `workflow.human_verify_mode=end-of-phase`
  an die Phasen-Verifikation weitergereicht — dort anhand dieses Messprotokolls freizugeben.
- Nächster Plan: `14-04` (nächste PLAN.md ohne SUMMARY in `14-tests-gates/`).

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- `[ -f tests/e2e/helpers/test-utils.js ]` → FOUND
- `[ -f .planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md ]` → FOUND
- `git log --oneline --all --grep="14-03"` → 3 commits found (2d00236, 83815cb, f591c9d)
- Acceptance criteria re-verified for all three tasks: PASS (see verify commands above)
- Plan-level `<verification>`: `npx playwright test tests/e2e/crud/` green, `npx playwright test` (full) 321 passed/2 skipped, `npx jest` 1112/1112, `git diff` against `playwright.config.js` empty, both measurement halves checked in.
