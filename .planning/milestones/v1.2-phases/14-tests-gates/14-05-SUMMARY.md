---
phase: 14-tests-gates
plan: 05
subsystem: testing
tags: [jest, unit-tests, test-splitting, welt-story, test-04]

# Dependency graph
requires:
  - phase: 14-01
    provides: "14-GATE-BASELINE.md mit der bindenden Testsumme (37 Unit-Tests) der Sammel-Spec"
provides:
  - "Fuenf dedizierte Unit-Testdateien fuer Session-Prep, NPC-Generator, Timeline, Reise, Fraktionen unter tests/unit/, benannt nach Quellverzeichnis"
  - "tests/unit/welt-story.test.js entfernt — keine Datei deckt mehr zwei oder mehr Welt-Bereiche gleichzeitig ab"
affects: ["zukuenftige-unit-welt-tests", "14-09 (Modul-zu-Test-Gate, misst die Ausnahmeliste neu statt sie fortzuschreiben)"]

# Actuals (#2632)
actuals:
  tokens: 13700
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mechanische, verhaltensneutrale Dateiaufteilung: describe-Bloecke samt lokalem Setup woertlich in Zieldateien uebernommen, nur Dateikopf-Kommentar angepasst (D-05) — spiegelt Plan 14-04s Vorgehen fuer die E2E-Haelfte."
    - "Zielnamen nach Quellverzeichnis statt Planungscode (WELT-NN), damit der Testbaum ohne Nachschlagen lesbar ist (D-04)."

key-files:
  created:
    - tests/unit/session-prep.test.js
    - tests/unit/npc-generator.test.js
    - tests/unit/timeline.test.js
    - tests/unit/reise.test.js
    - tests/unit/fraktionen.test.js
  modified: []

key-decisions:
  - "Dateikopf-Kommentare der fuenf neuen Dateien verweisen nicht woertlich auf den Namen welt-story.test.js — dieselbe Ursache wie in Plan 14-04s dokumentierter Deviation: Task 2s eigene Verifikation (grep -rl welt-story tests/unit/) wertet eine Selbstreferenz auf eine im selben Plan entfallende Datei als Fehlschlag."
  - "// ====-Sektionsbanner aus der Quelle wurden unveraendert je Zieldatei mituebernommen (D-05 verlangt woertliche Uebernahme); nur der umgebende Dateikopf-Kommentar ist neu formuliert."

requirements-completed: [TEST-04]

coverage:
  - id: D1
    description: "Fuenf dedizierte Unit-Dateien (session-prep, npc-generator, timeline, reise, fraktionen) existieren unter tests/unit/, benannt nach Quellverzeichnis; jede enthaelt genau einen describe-Block, woertlich aus welt-story.test.js uebernommen (inkl. lokalem Setup und Sektionsbanner)."
    requirement: "TEST-04"
    verification:
      - kind: other
        ref: "ls der fuenf Zieldateien -> 5 Treffer"
        status: pass
      - kind: other
        ref: "node -e Zaehlung describe(...) je Datei -> je genau 1"
        status: pass
      - kind: unit
        ref: "npx jest tests/unit/{session-prep,npc-generator,timeline,reise,fraktionen}.test.js -> 37 Tests total, 5 Suiten"
        status: pass
      - kind: other
        ref: "diff je Block (Banner+describe) gegen tests/unit/welt-story.test.js (git show vor der Loeschung) -> byte-identisch, 0 Diff-Zeilen"
        status: pass
      - kind: other
        ref: "grep -l makeMockD ueber die fuenf Dateien -> >=1 Treffer (lokales Setup mitgewandert)"
        status: pass
    human_judgment: false
  - id: D2
    description: "tests/unit/welt-story.test.js ist per git rm entfernt; keine Datei unter tests/unit/ deckt mehr zwei oder mehr Welt-Bereiche gleichzeitig ab, und keine Referenz auf den alten Dateinamen bleibt zurueck."
    requirement: "TEST-04"
    verification:
      - kind: other
        ref: "test ! -f tests/unit/welt-story.test.js -> true"
        status: pass
      - kind: other
        ref: "grep -rl welt-story tests/unit/ -> 0 Treffer"
        status: pass
      - kind: other
        ref: "git diff --quiet -- jest.config.cjs tests/setup.js -> unveraendert"
        status: pass
    human_judgment: false
  - id: D3
    description: "Keine Regression: die volle Unit-Suite bleibt nach der Aufteilung gruen, Testzahl unveraendert (1112), Suitenzahl exakt um vier gestiegen (44 -> 48). npx eslint . bleibt fehlerfrei."
    verification:
      - kind: unit
        ref: "npx jest -> 48 Suiten / 1112 Tests, alle bestanden"
        status: pass
      - kind: other
        ref: "npx eslint . -> Exit 0, 0 Fehler"
        status: pass
      - kind: other
        ref: "git status -- 5 neue + 1 geloeschte Datei unter tests/unit/, sonst leer"
        status: pass
    human_judgment: false

duration: ~8min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 05: Welt-Story-Unit-Spec in fünf dedizierte Dateien aufgeteilt (TEST-04, Unit-Hälfte) Summary

**Die 593-zeilige Sammel-Testdatei `tests/unit/welt-story.test.js` (37 Tests, fünf `describe`-Blöcke) mechanisch und verhaltensneutral in fünf dedizierte Dateien unter `tests/unit/` zerlegt, benannt nach Quellverzeichnis statt Planungscode — spiegelbildlich zu Plan 14-04s E2E-Aufteilung und damit die zweite, in `DEBT-28` ausdrücklich geforderte Hälfte von `TEST-04`.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-09-07T06:59:20Z
- **Completed:** 2026-09-07T07:06:53Z
- **Tasks:** 2
- **Files modified:** 6 (5 neu angelegt, 1 gelöscht)

## Accomplishments

- Fünf `describe`-Blöcke wörtlich aus `welt-story.test.js` in fünf neue Dateien übernommen:
  `session-prep.test.js` (3 Tests), `npc-generator.test.js` (4 Tests), `timeline.test.js`
  (7 Tests), `reise.test.js` (11 Tests), `fraktionen.test.js` (12 Tests) — Summe 37, exakt die
  in `14-GATE-BASELINE.md` protokollierte Ausgangszahl.
- Lokales Setup (`makeMockD()`, `global.*`-Stubs) und `// ====`-Sektionsbanner je Block
  unverändert mitgewandert — per `diff` gegen die Quelldatei byte-identisch bestätigt, nicht nur
  gezählt.
- Sammel-Testdatei `welt-story.test.js` per `git rm` entfernt; `jest.config.cjs` (`roots`,
  `testMatch`) und `tests/setup.js` unverändert — bestehende Konfiguration erfasst die neuen
  Dateien ohne Anpassung.
- Volle Unit-Suite nach der Aufteilung unverändert grün: 1112/1112 Tests, Suitenzahl exakt um
  vier gestiegen (44 → 48, eine Datei wurde zu fünf); `npx eslint .` weiterhin Exit 0.
- `TEST-04` damit vollständig erfüllt — gemeinsam mit Plan 14-04 (E2E-Hälfte) sind beide in
  `DEBT-28` genannten Sammeldateien aufgeteilt.

## Task Commits

Each task was committed atomically:

1. **Task 1: Die fünf `describe`-Blöcke samt lokalem Setup in fünf Zieldateien übernehmen** - `ef7d9b0` (feat)
2. **Task 2: Sammeldatei entfernen und Neutralität binär belegen** - `bf809d5` (fix)

**Plan metadata:** siehe finaler Metadata-Commit (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `tests/unit/session-prep.test.js` - neu; WELT-01-Block (3 Tests)
- `tests/unit/npc-generator.test.js` - neu; WELT-02-Block (4 Tests)
- `tests/unit/timeline.test.js` - neu; WELT-03-Block (7 Tests)
- `tests/unit/reise.test.js` - neu; WELT-04-Block (11 Tests)
- `tests/unit/fraktionen.test.js` - neu; WELT-05-Block (12 Tests)
- `tests/unit/welt-story.test.js` - entfernt (git rm)

## Decisions Made

- Dateikopf-Kommentare der fünf neuen Dateien verweisen nicht wörtlich auf den Namen
  `welt-story.test.js` — dieselbe Ursache wie in Plan 14-04s dokumentierter Deviation: Task 2s
  eigene Verifikation (`grep -rl welt-story tests/unit/`) würde eine Selbstreferenz auf eine im
  selben Plan entfallende Datei sonst als Fehlschlag werten. Stattdessen: "Teil der
  Welt-Story-Sammel-Testdatei" (sachlich identisch, ohne wörtlichen Dateinamen).
- Der `// ====`-Sektionsbanner aus der Quelle (z. B. `// WELT-01: Session-Prep-Assistent
  (aktiviert Plan 05-03)`) wurde unverändert je Zieldatei mitgenommen, wie von D-05 verlangt —
  nur der umgebende, neu verfasste Dateikopf-Kommentar spricht nicht mehr den alten Dateinamen an.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Erster Entwurf der Dateikopf-Kommentare referenzierte den alten Dateinamen wörtlich und hätte Task 2s eigene Verifikation zum Scheitern gebracht**
- **Found during:** Task 2 (Verifikation `grep -rl welt-story tests/unit/` sollte 0 Treffer liefern)
- **Issue:** Beim ersten Anlegen der fünf Zieldateien in Task 1 enthielt jeder Dateikopf-Kommentar den wörtlichen Verweis "Teil der Sammeldatei tests/unit/welt-story.test.js (WELT-NN-Block)". Nach dem `git rm` der Sammeldatei in Task 2 hätte dieser Kommentar-Wortlaut die eigene, binäre Verifikation des Tasks ("keine Referenz mehr auf den alten Dateinamen") scheitern lassen — exakt dieselbe Fehlerklasse, die Plan 14-04 (E2E-Hälfte derselben Aufteilung) bereits als Deviation dokumentiert hat.
- **Fix:** Alle fünf Dateikopf-Kommentare umformuliert auf "Teil der Welt-Story-Sammel-Testdatei (WELT-NN-Block)" — sachlich identisch, ohne wörtlichen Dateinamen. Der `// ====`-Sektionsbanner (Pflichtbestandteil laut D-05) wurde dabei unverändert aus der Quelle beibehalten und nach dem Umformulieren erneut per `diff` gegen die Quelldatei als byte-identisch bestätigt.
- **Files modified:** tests/unit/session-prep.test.js, tests/unit/npc-generator.test.js, tests/unit/timeline.test.js, tests/unit/reise.test.js, tests/unit/fraktionen.test.js
- **Verification:** `grep -rl 'welt-story' tests/unit/` → 0 Treffer nach dem Fix; `npx jest` weiterhin 1112/1112 grün.
- **Committed in:** bf809d5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Reine Kommentarkorrektur, kein Test- oder Produktionscode betroffen. Kein Scope-Creep — dieselbe Fehlerklasse war bereits aus Plan 14-04 bekannt und wurde hier proaktiv erkannt und behoben, bevor sie die Verifikation blockierte.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `TEST-04` ist damit vollständig erfüllt: sowohl die E2E-Hälfte (Plan 14-04) als auch die
  Unit-Hälfte (dieser Plan) sind abgeschlossen. Beide Sammeldateien, die `DEBT-28` ausdrücklich
  nennt, existieren nicht mehr.
- Die elf Welt-Module bleiben auf der D-13-Ausnahmeliste (Modul-zu-Test-Gate), bis die
  dedizierten Dateien tatsächlich Modulpfad oder Funktionsnamen zitieren — reines Verschieben
  allein genügt dafür nicht (siehe `14-GATE-BASELINE.md` Messblock 4 und die "Offene
  Kanten-Sonde" in `14-05-PLAN.md`). Das ist Sache von Plan `14-09` (Modul-zu-Test-Gate), der die
  Ausnahmeliste selbst neu misst statt die CONTEXT.md-Erwartung (75 → 64) fortzuschreiben.
- Nächster Plan: die nächste PLAN.md ohne SUMMARY in `14-tests-gates/` (voraussichtlich `TEST-05`,
  D-07 ff. — Lint/Typecheck/Coverage-Gates).

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- `[ -f tests/unit/session-prep.test.js ]` → FOUND
- `[ -f tests/unit/npc-generator.test.js ]` → FOUND
- `[ -f tests/unit/timeline.test.js ]` → FOUND
- `[ -f tests/unit/reise.test.js ]` → FOUND
- `[ -f tests/unit/fraktionen.test.js ]` → FOUND
- `[ ! -f tests/unit/welt-story.test.js ]` → CONFIRMED REMOVED
- `git log --oneline -3` → ef7d9b0 and bf809d5 confirmed present
- Acceptance criteria re-verified for both tasks: PASS (see verify commands above)
- Plan-level `<verification>`: `npx jest` green (48 suites / 1112 tests), `npx eslint .` exit 0 (0 errors), `git status` shows five new + one deleted file under `tests/unit/`, sonst leer.
