---
phase: 14-tests-gates
plan: 09
subsystem: testing
tags: [jest, coverage-gate, loader.js, module-coverage, gate-baseline]

# Dependency graph
requires:
  - phase: 14-tests-gates
    provides: "14-04/14-05: Aufteilung der Sammeldateien in dedizierte Testdateien lieferte die endgueltige Testdateimenge, gegen die die Ausnahmeliste dieses Plans erhoben wurde"
  - phase: 14-tests-gates
    provides: "14-06: extractModulesFromLoader() aus tools/generate-eslint-globals.js wiederverwendet statt ein drittes Extraktions-Idiom zu schreiben"
  - phase: 14-tests-gates
    provides: "14-07/14-08: Lint- und Coverage-Ratschen als unveraenderte Referenz fuer den vollstaendigen Phasenabschluss-Suitenlauf"
provides:
  - "Modul-zu-Test-Abdeckungs-Gate (tests/unit/module-test-coverage.test.js): jedes Modul aus loader.js MODULES muss von mindestens einem Test woertlich per Pfad angefasst werden, ausser auf einer datierten Ausnahmeliste"
  - "MODULE_TEST_EXCEPTIONS: 78 Module (Pfad-Kriterium), frisch erhoben nach der Aufteilung aus 14-04/14-05, eingecheckt als Ratsche"
  - "Beidseitiger Wirkungsnachweis: Test wird rot bei neuem unabgedecktem Modul UND bei verwaister Ausnahme"
  - "14-GATE-BASELINE.md Abschlussabschnitt 'Stand nach Phase 14' mit Vorher/Nachher je Gate — Phase 14 vollstaendig abgeschlossen"
affects: []

# Actuals (#2632)
actuals:
  tokens: 5100
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pfad-Kriterium statt Basisnamen-Substring fuer Modul-Testabdeckung: woertlicher loader.js-relativer Pfad in einer Testdatei, um Zufallstreffer (z.B. DOM-Bezeichner gleichen Namens) auszuschliessen"
    - "Selbstreferenz-Ausschluss: die Testdatei, die eine Ausnahmeliste mit Modulpfaden als String-Literale fuehrt, muss sich selbst von der eigenen Abdeckungspruefung ausnehmen, sonst zaehlt die Ausnahmeliste als falscher Beweis fuer Abdeckung"

key-files:
  created:
    - tests/unit/module-test-coverage.test.js
  modified:
    - .planning/phases/14-tests-gates/14-GATE-BASELINE.md

key-decisions:
  - "Pfad-Kriterium (a) statt Basisnamen-Kriterium (b)/(c) gewaehlt, obwohl es die laengere Ausnahmeliste ergibt (78 statt 62) — eine falsche Abdeckungs-Zusicherung nimmt ein Modul dauerhaft und unsichtbar aus dem Gate, eine laengere Liste ist sichtbar und schrumpfbar"
  - "Ausnahmeliste erst NACH 14-04/14-05 erhoben (D-15) — beide Vor- und Nachher-Zahlen sind identisch (78/62), weil die mechanische Aufteilung verhaltensneutral war und keine der elf Welt-Module-Dateien Produktionscode-Pfade zitiert"
  - "extractModulesFromLoader() aus tools/generate-eslint-globals.js wiederverwendet statt ein drittes Extraktions-Idiom zu schreiben (kein eigenstaendiger Regex-Parser fuer loader.js in dieser Testdatei)"

requirements-completed: [TEST-05, TEST-04]

coverage:
  - id: D1
    description: "Modul-zu-Test-Abdeckungs-Gate existiert (tests/unit/module-test-coverage.test.js, 4 Testfaelle), verwendet das praezisierte Pfad-Kriterium, gewinnt die Modulliste ueber die vorhandene extractModulesFromLoader()-Funktion, und die 78 Ausnahmen sind als benannte, datierte, alphabetisch sortierte Konstante gefuehrt"
    requirement: TEST-05
    verification:
      - kind: unit
        ref: "npx jest tests/unit/module-test-coverage.test.js — 4/4 Tests bestanden"
        status: pass
      - kind: other
        ref: "node-Probe: MODULE_TEST_EXCEPTIONS >=2x referenziert, Erhebungsdatum (Regex 20\\d\\d-\\d\\d-\\d\\d) im Kopfkommentar vorhanden"
        status: pass
      - kind: other
        ref: "grep -q extractModulesFromLoader tests/unit/module-test-coverage.test.js — vorhanden, kein drittes Extraktions-Idiom"
        status: pass
      - kind: other
        ref: "grep -q 'Modul-zu-Test' .planning/phases/14-tests-gates/14-GATE-BASELINE.md — Nachtrag mit beiden Kriteriumszahlen vorhanden"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ratschenwirkung beidseitig belegt: Probe mit neuem unabgedecktem Modul in loader.js MODULES macht den Test rot und meldet den Pfad namentlich; Probe mit verwaister Ausnahme macht den Test rot und meldet den Eintrag namentlich; loader.js und Testdatei danach unveraendert"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "Probe 1 (Platzhaltermodul in loader.js MODULES eingetragen): npx jest tests/unit/module-test-coverage.test.js -> Exit 1, Fehlermeldung nennt features/_gate-probe/placeholder.js; danach git diff --quiet -- loader.js -> unveraendert"
        status: pass
      - kind: other
        ref: "Probe 2 (erfundener Pfad in MODULE_TEST_EXCEPTIONS): npx jest tests/unit/module-test-coverage.test.js -> Exit 1, Fehlermeldung nennt features/_gate-probe/does-not-exist.js; danach git diff --quiet -- tests/unit/module-test-coverage.test.js -> unveraendert"
        status: pass
    human_judgment: false
  - id: D3
    description: "Vollstaendiger Phasenabschluss-Suitenlauf gruen: Lint mit Ratsche, beide Typpruefungen, volle Unit-Suite, Coverage-Lauf, Build-Tests, Produktionsbuild, volle E2E-Suite — und 14-GATE-BASELINE.md traegt den Vorher/Nachher-Abschlussabschnitt fuer alle drei Requirements der Phase"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "npm run lint -> Exit 0, 0 Fehler, 367 Warnungen"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit -> Exit 0; npm run typecheck:strict -> Exit 0"
        status: pass
      - kind: unit
        ref: "npx jest --coverage -> 49/49 Suiten, 1116/1116 Tests, 0,77% Statements, kein 'coverage threshold' in der Ausgabe"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py --production -> Exit 0; python -m pytest tests/build/ -> 24/24"
        status: pass
      - kind: e2e
        ref: "PYTHONIOENCODING=utf-8 python build.py && npx playwright test -> 321 passed / 2 skipped"
        status: pass
      - kind: other
        ref: "grep -q 'Stand nach Phase 14' .planning/phases/14-tests-gates/14-GATE-BASELINE.md — vorhanden"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 9: Modul-zu-Test-Abdeckungs-Gate mit Ratschenwirkung, Phasenabschluss Summary

**Ein schärferes Coverage-Gate ersetzt die für diese Architektur bedeutungslose globale Statement-Schwelle: `tests/unit/module-test-coverage.test.js` prüft, dass jedes von `loader.js MODULES` geladene Modul von mindestens einem Test wörtlich per Pfad angefasst wird, mit einer datierten 78-Modul-Ausnahmeliste als Ratsche — beidseitig als rot-machend bewiesen, und der Phasenabschluss steht als Vorher/Nachher-Zahlentabelle in `14-GATE-BASELINE.md`.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-09-07
- **Completed:** 2026-09-07
- **Tasks:** 2
- **Files modified:** 2 (1 neu, 1 geändert)

## Accomplishments

- **Kriterium präzisiert und mit Zahlen belegt:** Das Pfad-Kriterium (wörtlicher
  `loader.js`-relativer Pfad in einer Testdatei) wurde gegen das kürzere Basisnamen-Kriterium
  gemessen und bewusst bevorzugt — 78 statt 62 unabgedeckte Module, aber ohne den dokumentierten
  Falsch-Positiv (`npc-generator.js` würde unter dem Basisnamen-Kriterium fälschlich als
  abgedeckt gelten, weil `data-action="show-npc-generator"` im DOM denselben Namen trägt).
- **`tests/unit/module-test-coverage.test.js` angelegt**, im Stil von `console-hygiene.test.js`:
  vier Testfälle (Leer-grün-Wächter, Abdeckung, verwaiste Ausnahmen, Ratsche). Die Modulliste wird
  über die bereits vorhandene `extractModulesFromLoader()`-Funktion aus
  `tools/generate-eslint-globals.js` gewonnen — kein drittes Extraktions-Idiom im Projekt.
- **Basislinie frisch erhoben, nach 14-04/14-05:** 78 von 134 Modulen ohne Testerwähnung unter dem
  Pfad-Kriterium, alphabetisch als `MODULE_TEST_EXCEPTIONS` mit Erhebungsdatum eingecheckt. Beide
  Kriteriumszahlen (78 und 62) stehen als Nachtrag in `14-GATE-BASELINE.md`, mit der Begründung,
  warum die Wahl auf das strengere Pfad-Kriterium fällt.
- **Ratschenwirkung beidseitig bewiesen:** Probe 1 (ein neues, unabgedecktes Modul temporär in
  `loader.js MODULES` eingetragen) macht den Test rot und nennt den Pfad namentlich. Probe 2 (ein
  erfundener Pfad in `MODULE_TEST_EXCEPTIONS`) macht den Test ebenfalls rot und nennt den Eintrag.
  Beide Änderungen wurden danach vollständig zurückgedreht — `loader.js` und die Testdatei sind
  gegenüber dem committeten Stand unverändert (per `git diff --quiet` bestätigt).
- **Phasennachweis abgeschlossen:** Alle Gates einmal vollständig gefahren — Lint (0 Fehler/367
  Warnungen), `tsc --noEmit`, `typecheck:strict`, volle Unit-Suite mit Coverage (49/49 Suiten,
  1116/1116 Tests, 0,77 % Statements), Build-Tests (24/24), Produktionsbuild, volle E2E-Suite
  (321 passed/2 skipped). `14-GATE-BASELINE.md` trägt jetzt einen Abschnitt „Stand nach Phase 14"
  mit einer Vorher/Nachher-Zeile je Gate sowie dem ausdrücklich festgehaltenen Befund, dass die
  elf Welt-Module die Ausnahmeliste durch `TEST-04` nicht verlassen.

## Task Commits

1. **Task 1: Kriterium präzisieren, Basislinie frisch erheben, Gate schreiben** - `15f5f6f` (feat)
2. **Task 2: Ratschenwirkung beidseitig belegen und den Phasennachweis abschließen** - `9982944` (docs)

**Plan metadata:** siehe finaler Metadata-Commit (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `tests/unit/module-test-coverage.test.js` - neu; Modul-zu-Test-Abdeckungs-Gate mit
  `MODULE_TEST_EXCEPTIONS` (78 Module, Pfad-Kriterium, datiert 2026-09-07)
- `.planning/phases/14-tests-gates/14-GATE-BASELINE.md` - Nachtrag zu Plan 14-09 Task 1 (beide
  Kriteriumszahlen nach der Aufteilung) und Abschlussabschnitt „Stand nach Phase 14" (Task 2)

## Decisions Made

- Pfad-Kriterium statt Basisnamen-Kriterium — siehe key-decisions oben; ausführliche Begründung
  mit Falsch-Positiv-Beleg im Kopfkommentar von `tests/unit/module-test-coverage.test.js` und im
  Nachtrag in `14-GATE-BASELINE.md`.
- Die Testdatei nimmt sich selbst von der eigenen Abdeckungsprüfung aus (siehe Deviations unten) —
  ohne diesen Ausschluss könnte der Ratschen-Testfall strukturell nie rot werden, weil die
  Ausnahmeliste ihre eigenen Einträge als String-Literale enthält.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Ausnahmeliste im eigenen Testfile erzeugte Selbstreferenz-Falsch-Positive im Ratschen-Testfall**
- **Found during:** Task 1, erster Testlauf nach dem Eintragen von `MODULE_TEST_EXCEPTIONS`
- **Issue:** `tests/unit/module-test-coverage.test.js` selbst liegt unter `tests/` und wird daher
  in die Menge der auf Abdeckung durchsuchten Dateien einbezogen. Da `MODULE_TEST_EXCEPTIONS`
  jeden der 78 Ausnahme-Pfade wörtlich als String-Literal enthält, meldete `isCovered()` für JEDEN
  Ausnahme-Eintrag `true` — der Ratschen-Testfall („kein Eintrag der Ausnahmeliste ist inzwischen
  abgedeckt") schlug sofort mit allen 78 Einträgen fehl, obwohl kein einziger davon tatsächlich
  von einem Test gelesen wird. Genau die Fehlerklasse, vor der der Kopfkommentar warnt: eine
  Erwähnung zur Gate-Beruhigung statt eines echten Tests.
- **Fix:** Die Testdatei nimmt sich selbst (`__filename`, aufgelöst gegen die per `walk()`
  gesammelten Testdateipfade) von der Menge der auf Abdeckung durchsuchten Dateien aus, bevor der
  Inhalt gelesen wird. Kommentar im Quelltext erklärt die Notwendigkeit.
- **Files modified:** tests/unit/module-test-coverage.test.js
- **Verification:** Nach dem Fix laufen alle vier Testfälle grün; Probe 2 (Task 2, verwaister
  Eintrag) bestätigt zusätzlich, dass der Ratschen-Mechanismus weiterhin unabhängig funktioniert
  und nicht durch den Selbstausschluss entschärft wurde.
- **Committed in:** 15f5f6f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Notwendige Korrektur für die Funktionsfähigkeit des Gates selbst — ohne sie
wäre der Ratschen-Testfall strukturell nie grün geworden. Kein Scope-Creep, keine Änderung an
Produktionscode.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 14 (Tests & Gates) ist mit diesem Plan vollständig abgeschlossen: alle drei Requirements
  (`TEST-03`, `TEST-04`, `TEST-05`) sind erfüllt, alle neun Pläne sind committet.
- Alle Gates laufen grün und sind nachweislich in der Lage, echte Regressionen zu fangen: der rote
  Lint-Fehler ist behoben und `no-undef` ist ein harter Fehler; die Coverage-Messung ist ehrlich
  (0,77 % statt vorgetäuschter 92,45 %); das neue Modul-zu-Test-Gate ist beidseitig als
  wirksam bewiesen.
- Offen und ausdrücklich benannt (kein stiller Rest): `DEBT-01`-Restposten (126 von 134 Dateien
  außerhalb der `checkJs`-Zulassungsliste), der nicht instrumentierbare `vm`-Ladepfad, die dünne
  Testabdeckung der fünf Welt-Features, und der unveränderte `retries: 2` in
  `playwright.config.js`. Alle vier sind in `14-GATE-BASELINE.md` §„Was offen bleibt" sowie in
  `14-CONTEXT.md` §Deferred Ideas dokumentiert.
- Bereit für `/gsd-verify-work 14`.

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- FOUND: commit `15f5f6f` (Task 1)
- FOUND: commit `9982944` (Task 2)
- `[ -f tests/unit/module-test-coverage.test.js ]` → FOUND
- Re-ran `npx jest tests/unit/module-test-coverage.test.js` → 4/4 Tests grün
- Re-ran `npm run lint` → Exit 0, 0 Fehler, 367 Warnungen
- Re-ran `npx tsc --noEmit` → Exit 0; `npm run typecheck:strict` → Exit 0
- Re-ran `npx jest --coverage` → 49/49 Suiten, 1116/1116 Tests, 0,77% Statements
- Re-ran `python -m pytest tests/build/` → 24/24
- Re-ran `git diff --quiet -- loader.js` → unverändert (Probe 1 zurückgedreht)
- Re-ran `git diff --quiet -- tests/unit/module-test-coverage.test.js` → unverändert (Probe 2 zurückgedreht)
- `grep -q 'Stand nach Phase 14' .planning/phases/14-tests-gates/14-GATE-BASELINE.md` → gefunden
