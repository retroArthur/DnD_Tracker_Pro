---
phase: 14-tests-gates
plan: 04
subsystem: testing
tags: [playwright, e2e, test-splitting, welt-story, test-04]

# Dependency graph
requires:
  - phase: 14-01
    provides: "14-GATE-BASELINE.md mit der bindenden Testsumme (26 E2E-Tests) der Sammel-Spec"
provides:
  - "Fuenf dedizierte E2E-Spec-Dateien fuer Session-Prep, NPC-Generator, Timeline, Reise, Fraktionen unter tests/e2e/features/, benannt nach Quellverzeichnis"
  - "welt-story.spec.js entfernt — keine Datei deckt mehr zwei oder mehr Welt-Bereiche gleichzeitig ab"
affects: ["14-05 (Unit-Haelfte derselben Aufteilung, TEST-04)", "zukuenftige-e2e-welt-specs"]

# Actuals (#2632)
actuals:
  tokens: 12500
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mechanische, verhaltensneutrale Dateiaufteilung: test.describe-Bloecke woertlich in Zieldateien uebernommen, nur Dateikopf-Kommentar angepasst (D-05)."
    - "Zielnamen nach Quellverzeichnis statt Planungscode (WELT-NN), damit der Testbaum ohne Nachschlagen lesbar ist (D-04)."

key-files:
  created:
    - tests/e2e/features/session-prep.spec.js
    - tests/e2e/features/npc-generator.spec.js
    - tests/e2e/features/timeline.spec.js
    - tests/e2e/features/reise.spec.js
    - tests/e2e/features/fraktionen.spec.js
  modified:
    - tests/e2e/features/inspiration.spec.js

key-decisions:
  - "APP_URL-Konstante bleibt in jeder neuen Datei selbstgebaut, kein Wechsel auf loadApp() (D-06) — waere eine Timing-Aenderung."
  - "Dateikopf-Kommentare wurden je Zieldatei sinngemaess umformuliert und verweisen nicht mehr woertlich auf den alten Dateinamen welt-story.spec.js, weil Task 2s Verifikation (`grep -rl welt-story tests/e2e/`) jede verbleibende Referenz als Fehlschlag wertet — auch eine reine Kommentar-Selbstreferenz auf eine Datei, die im selben Task entfernt wird."
  - "Stale Referenz auf welt-story.spec.js in einer unabhaengigen Datei (inspiration.spec.js:17, Kommentar) korrigiert — reine Kommentaraenderung, ausserhalb des Plans files_modified, aber noetig, damit Task 2s bindende Verifikation (keine Referenz mehr unter tests/e2e/) zutrifft."

requirements-completed: []

coverage:
  - id: D1
    description: "Fuenf dedizierte E2E-Dateien (session-prep, npc-generator, timeline, reise, fraktionen) existieren unter tests/e2e/features/, benannt nach Quellverzeichnis; jede enthaelt genau einen test.describe-Block, woertlich aus welt-story.spec.js uebernommen."
    requirement: "TEST-04"
    verification:
      - kind: other
        ref: "ls der fuenf Zieldateien -> 5 Treffer"
        status: pass
      - kind: other
        ref: "node -e Zaehlung test.describe(...) je Datei -> je genau 1"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/{session-prep,npc-generator,timeline,reise,fraktionen}.spec.js --list -> 26 Tests total"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/ -> 221 passed / 2 skipped"
        status: pass
    human_judgment: false
  - id: D2
    description: "welt-story.spec.js ist per git rm entfernt; keine Datei unter tests/e2e/ deckt mehr zwei oder mehr Welt-Bereiche gleichzeitig ab, und keine Referenz auf den alten Dateinamen bleibt zurueck."
    requirement: "TEST-04"
    verification:
      - kind: other
        ref: "test ! -f tests/e2e/features/welt-story.spec.js -> true"
        status: pass
      - kind: other
        ref: "grep -rl welt-story tests/e2e/ -> 0 Treffer"
        status: pass
      - kind: other
        ref: "git diff --stat playwright.config.js -> leer (unveraendert)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Keine Regression: die volle E2E-Suite bleibt nach der Aufteilung unveraendert gruen und zaehlt exakt dieselbe Gesamtzahl wie vor der Phase (321 passed / 2 skipped, 323 total)."
    verification:
      - kind: e2e
        ref: "PYTHONIOENCODING=utf-8 python build.py && npx playwright test --list -> 323 tests in 31 files"
        status: pass
      - kind: e2e
        ref: "npx playwright test -> 321 passed / 2 skipped"
        status: pass
      - kind: other
        ref: "npx eslint . -> Exit 0, 0 errors"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 04: Welt-E2E-Spec in fünf dedizierte Dateien aufgeteilt (TEST-04, E2E-Hälfte) Summary

**Die 520-zeilige Sammel-Spec `welt-story.spec.js` (26 Tests, fünf `describe`-Blöcke) mechanisch und verhaltensneutral in fünf dedizierte Dateien unter `tests/e2e/features/` zerlegt, benannt nach Quellverzeichnis statt Planungscode.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-09-07T06:47:23Z
- **Completed:** 2026-09-07T06:57:22Z
- **Tasks:** 2
- **Files modified:** 6 (5 neu angelegt, 1 gelöscht, 1 unabhängige Datei mit Kommentar-Fix)

## Accomplishments

- Fünf `test.describe`-Blöcke wörtlich aus `welt-story.spec.js` in fünf neue Dateien
  übernommen: `session-prep.spec.js` (5 Tests), `npc-generator.spec.js` (8 Tests),
  `timeline.spec.js` (4 Tests), `reise.spec.js` (4 Tests), `fraktionen.spec.js` (5 Tests) —
  Summe 26, exakt die in `14-GATE-BASELINE.md` protokollierte Ausgangszahl.
- Selbstgebaute `APP_URL`-Konstante in jeder Datei unverändert erhalten; keine der fünf
  Dateien importiert `loadApp()` (D-06 bewusst nicht angewendet).
- Sammel-Spec `welt-story.spec.js` per `git rm` entfernt; `playwright.config.js` unverändert
  (bestehendes `testMatch` erfasst die neuen Dateien ohne Konfigurationsänderung).
- Volle E2E-Suite nach frischem Build unverändert grün: 321 passed / 2 skipped (323 total),
  identisch zum protokollierten Stand vor der Phase; `npx eslint .` weiterhin Exit 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Die fünf `test.describe`-Blöcke wörtlich in fünf Zieldateien übernehmen** - `a7ff7cd` (feat)
2. **Task 2: Sammel-Spec entfernen und Neutralität der Aufteilung binär belegen** - `d74bb38` (fix)

**Plan metadata:** siehe finaler Metadata-Commit (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `tests/e2e/features/session-prep.spec.js` - neu; WELT-01-Block (5 Tests)
- `tests/e2e/features/npc-generator.spec.js` - neu; WELT-02-Block (8 Tests)
- `tests/e2e/features/timeline.spec.js` - neu; WELT-03-Block (4 Tests)
- `tests/e2e/features/reise.spec.js` - neu; WELT-04-Block (4 Tests)
- `tests/e2e/features/fraktionen.spec.js` - neu; WELT-05-Block (5 Tests)
- `tests/e2e/features/welt-story.spec.js` - entfernt (git rm)
- `tests/e2e/features/inspiration.spec.js` - Kommentarzeile korrigiert (Verweis auf entfallenen Dateinamen entfernt)

## Decisions Made

- Dateikopf-Kommentare der fünf neuen Dateien verweisen nicht wörtlich auf den Namen
  `welt-story.spec.js`, weil Task 2s eigene Verifikation genau das als Fehlschlag wertet — eine
  Selbstreferenz auf eine Datei, die im selben Plan entfällt, wäre eine „Referenz auf den alten
  Dateinamen", die die Verifikation binär prüft.
- Eine unabhängige, außerhalb dieses Plans liegende Datei (`inspiration.spec.js:17`) enthielt
  ebenfalls einen Kommentarverweis auf `welt-story.spec.js`. Da Task 2s Verifikation den gesamten
  `tests/e2e/`-Baum scannt, wurde die Zeile korrigiert (reine Kommentaränderung, keine
  Verhaltensänderung, Rule 3 — blockierendes Problem für die Aufgabenerfüllung).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stale Referenz auf `welt-story.spec.js` in `inspiration.spec.js` verhinderte Task 2s Verifikation**
- **Found during:** Task 2 (Verifikation `grep -rl welt-story tests/e2e/` sollte 0 Treffer liefern)
- **Issue:** `tests/e2e/features/inspiration.spec.js:17` enthielt einen Kommentar mit wörtlichem Verweis auf die soeben entfernte Sammel-Spec (`// file://-Basis analog zu tests/e2e/crud/party.spec.js und welt-story.spec.js`). Das ist eine von diesem Plan unabhängige Datei, nicht in `files_modified` gelistet — aber Task 2s eigene, binäre Verifikation ("Unter `tests/e2e/` gibt es keine Referenz mehr auf den alten Dateinamen") schließt den gesamten Baum ein, nicht nur die fünf Zieldateien.
- **Fix:** Kommentarzeile umformuliert auf "und den Welt-Feature-Specs" — keine Codeänderung, keine Verhaltensänderung.
- **Files modified:** tests/e2e/features/inspiration.spec.js
- **Verification:** `grep -rl 'welt-story' tests/e2e/` → 0 Treffer nach dem Fix; `npx playwright test tests/e2e/features/inspiration.spec.js` weiterhin grün.
- **Committed in:** d74bb38 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Reine Kommentarkorrektur außerhalb der geplanten Dateiliste, notwendig um Task 2s eigene bindende Verifikation zu erfüllen. Kein Produktionscode betroffen, keine Testlogik geändert.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `TEST-04`s E2E-Hälfte ist abgeschlossen. Das Requirement selbst bleibt `blocked` (geteilt mit
  Plan `14-05`, der Unit-Testhälfte derselben Sammel-Spec-Aufteilung) — bestätigt via
  `requirements.ready-ids`: 0/1 bereit, da `14-05` noch keine SUMMARY hat. Wird automatisch
  `Complete`, sobald `14-05` fertig ist.
- Die elf Welt-Module bleiben auf der D-13-Ausnahmeliste (Modul-zu-Test-Gate), bis die
  dedizierten Dateien tatsächlich Modulpfad oder Funktionsnamen zitieren — reines Verschieben
  allein genügt dafür nicht (siehe `14-GATE-BASELINE.md` Messblock 4). Das ist Sache von Plan
  `14-09` (Modul-zu-Test-Gate), nicht dieses Plans.
- Nächster Plan: `14-05` (Unit-Testhälfte derselben Aufteilung) oder die nächste PLAN.md ohne
  SUMMARY in `14-tests-gates/`.

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- `[ -f tests/e2e/features/session-prep.spec.js ]` → FOUND
- `[ -f tests/e2e/features/npc-generator.spec.js ]` → FOUND
- `[ -f tests/e2e/features/timeline.spec.js ]` → FOUND
- `[ -f tests/e2e/features/reise.spec.js ]` → FOUND
- `[ -f tests/e2e/features/fraktionen.spec.js ]` → FOUND
- `[ ! -f tests/e2e/features/welt-story.spec.js ]` → CONFIRMED REMOVED
- `git log --oneline --all --grep="14-04"` → not used as grep pattern (commits use plain feat/fix subjects); commits a7ff7cd and d74bb38 confirmed present via `git log --oneline -3`
- Acceptance criteria re-verified for both tasks: PASS (see verify commands above)
- Plan-level `<verification>`: `npx playwright test tests/e2e/features/` green (221 passed/2 skipped), `npx playwright test --list` 323 total (unchanged), `npx eslint .` exit 0, `git status` shows five new + one deleted file plus one unrelated comment fix under `tests/e2e/`.
