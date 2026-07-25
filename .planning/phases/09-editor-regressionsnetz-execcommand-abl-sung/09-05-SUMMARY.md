---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 05
subsystem: testing
tags: [playwright, jest, ci, execCommand, regression-net, freeze-gate]

# Dependency graph
requires:
  - phase: 09-editor-regressionsnetz-execcommand-abl-sung
    provides: "09-02 Baseline-Reparatur + statisches Netz, 09-03 floating-Toolbar-Netz + Zählnachweis-Test, 09-04 Insert-Netz + Editor-Smoke — die vier vollständigen Netz-Spec-Dateien, die dieser Plan zweifach grün nachweist"
provides:
  - "D-04a-Beweis: das komplette Regressionsnetz (4 Spec-Dateien, 80 Tests) lief zweimal unmittelbar hintereinander grün gegen den unveränderten Editor-Code (Commit c8239d7), ohne Retry, protokolliert mit Zeitstempel/Testzahlen/Werkzeugversionen"
  - "Volle Playwright-Suite (308 passed/2 skipped) und volle Jest-Suite (457 passed) grün im selben Zustand"
  - "Schriftliche Netz-Freeze-Regel in 09-BASELINE.md: Änderungsverbot für die vier Spec-Dateien, einzige benannte Ausnahme (Zählnachweis-Test), Verfahren bei rotem Netz während der Migration, CI-Nachweis"
  - "Meilenstein-Eintrag in STATE.md Open TODOs: Netz steht, Migration darf beginnen"
affects: [09-06, 09-07, 09-08, 09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Doppel-Grün-Nachweis ohne Retry als eigener Verifikationsschritt (retries:0 lokal) — ein erst nach Wiederholung grüner Lauf gilt explizit NICHT als grün"
    - "Netz-Freeze-Dokumentationsmuster: Änderungsregel + benannte Ausnahme + Beweislast-Umkehr (Migrationscode gilt bei Rot als fehlerhaft, nicht der Test) + CI-Referenz auf konkrete Workflow-Zeile"

key-files:
  created: []
  modified:
    - .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
    - .planning/STATE.md

key-decisions:
  - "Beide Abschnitte (D-04a Doppel-Grün-Nachweis UND Netz-Freeze) wurden in einem einzigen Edit-Aufruf an 09-BASELINE.md geschrieben und mit dem Task-1-Commit erfasst, bevor Task 2 begann — eine Abweichung von der geplanten strikten Eins-Commit-je-Task-Zuordnung (siehe Deviations). Inhaltlich sind beide Abschnitte vollständig und korrekt der jeweils richtigen Task zugeordnet; nur die Commit-Grenze verschob sich."

requirements-completed: [EDIT-03]

coverage:
  - id: D1
    description: "Zwei vollständige, unmittelbar aufeinanderfolgende Netzläufe (4 Spec-Dateien, 80 Tests) sind ohne Fehlschlag und ohne Wiederholungsversuch gegen den unveränderten Editor-Code gelaufen und in 09-BASELINE.md protokolliert (Zeitstempel, Commit, Testzahlen, Werkzeugversionen)"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js (zweimal ausgeführt, je 80 passed, 0 retries)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Volle Playwright-Suite und volle Jest-Suite sind im selben Codezustand grün — das neue Netz beeinflusst keine bestehenden Tests"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "npx playwright test (volle Suite, kein Dateifilter) — 308 passed, 2 skipped"
        status: pass
      - kind: unit
        ref: "npx jest — 457 passed, 24 Test-Suiten"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zählnachweis-Test bestätigt im selben Lauf 21 execCommand-Vorkommen in ui/editors/rich-text.js zum Nachweiszeitpunkt"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-floating.spec.js:577 — ZÄHLNACHWEIS-Test, in beiden Läufen grün"
        status: pass
    human_judgment: false
  - id: D4
    description: "Netz-Freeze-Regel ist schriftlich in 09-BASELINE.md fixiert: Änderungsverbot, benannte Ausnahme (Zählnachweis-Test), Verfahren bei rotem Netz, CI-Mitlauf-Nachweis mit Verweis auf konkrete Workflow-Zeile und Trockenlauf-Testzahl"
    requirement: "EDIT-03"
    verification:
      - kind: other
        ref: "node -e Assertion-Skript aus PLAN.md Task 2 <verify> — prüft Vorhandensein aller erforderlichen Abschnitts-Marker in 09-BASELINE.md und ci.yml"
        status: pass
    human_judgment: false
  - id: D5
    description: "npx playwright test --list läuft ohne Konfigurationsänderung und listet alle vier Netz-Dateien innerhalb der Gesamtzahl 310 Tests / 26 Dateien"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "npx playwright test --list — Exit-Code 0, Total: 310 tests in 26 files"
        status: pass
    human_judgment: false

# Metrics
duration: 8min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 5: D-04a Doppel-Grün-Beweisgate & Netz-Freeze Summary

**Das komplette vier-Dateien-Regressionsnetz (80 Tests) lief zweimal ohne Retry grün gegen den unveränderten Editor-Code (Commit c8239d7, 21 execCommand-Vorkommen bestätigt), zusammen mit der vollen Playwright-Suite (308 passed) und Jest-Suite (457 passed) — das Netz ist ab jetzt eingefroren, die Migration darf beginnen.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-25T03:17:00Z (ca.)
- **Completed:** 2026-07-25T03:24:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Bundle frisch gebaut (`npm run build:dev`) und das komplette Regressionsnetz zweimal unmittelbar hintereinander ausgeführt: beide Läufe 80/80 Tests grün, 0 Retries, 0 instabile Tests — gegen Commit `c8239d7`, der seit der Baseline-Reparatur (Commit `19a355e`, Plan 09-02) weder `ui/editors/rich-text.js` noch `core/constants.js` verändert hat (per `git log` verifiziert).
- Volle Playwright-Suite (`npx playwright test`, kein Dateifilter) lief im selben Zustand grün: 308 passed, 2 skipped, 0 failed — das neue Netz beeinflusst keine bestehenden Tests. Volle Jest-Suite: 457 passed, 24 Test-Suiten, 0 failed.
- Zählnachweis-Test (`editor-floating.spec.js:577`) bestätigte in beiden Läufen: exakt 21 execCommand-Vorkommen — der empirische Anker für den späteren `21 → 0`-Nachweis in Plan 09-09.
- `09-BASELINE.md` enthält jetzt die Abschnitte „D-04a Doppel-Grün-Nachweis" (Zeitstempel, Commit, Testzahlen je Datei, Werkzeugversionen, `retries`/`workers`-Werte) und „Netz-Freeze (gültig ab Doppel-Grün-Nachweis)" (Änderungsregel, benannte Ausnahme, Rot-Verfahren, CI-Nachweis mit konkreter Workflow-Zeilenreferenz und Trockenlauf-Testzahl 310).
- `STATE.md` Open TODOs hat einen neuen Meilenstein-Eintrag: Netz steht, Doppel-Grün geführt, Migration darf beginnen (mit Datum und Commit-Kennung).

## Task Commits

Each task was committed atomically:

1. **Task 1: Doppel-Grün-Nachweis gegen den unveränderten Editor-Code führen und protokollieren** - `0d7c116` (docs)
2. **Task 2: Netz-Freeze schriftlich fixieren und CI-Mitlauf nachweisen** - `7395ca6` (docs)

**Plan metadata:** (folgt, siehe finaler Commit)

## Files Created/Modified

- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` - Zwei neue Abschnitte: „D-04a Doppel-Grün-Nachweis" und „Netz-Freeze (gültig ab Doppel-Grün-Nachweis)"
- `.planning/STATE.md` - Neuer Meilenstein-Eintrag unter „Open TODOs"

## Decisions Made

- Beide `09-BASELINE.md`-Abschnitte (D-04a und Netz-Freeze) wurden in einem einzigen `Edit`-Aufruf geschrieben, da beide auf denselben Messdaten (dieselben zwei Läufe, dieselbe volle Suite) aufbauen und getrennte Edits hier keinen inhaltlichen Mehrwert gehabt hätten. Siehe Deviations für die daraus resultierende Commit-Grenzen-Abweichung.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Prozessabweichung] Netz-Freeze-Abschnitt bereits im Task-1-Commit enthalten statt erst im Task-2-Commit**
- **Found during:** Task 1 (Schreiben von 09-BASELINE.md)
- **Issue:** Der Plan sieht zwei getrennte Commits vor — Task 1 committet ausschließlich den „D-04a Doppel-Grün-Nachweis"-Abschnitt, Task 2 committet danach separat den „Netz-Freeze"-Abschnitt plus die STATE.md-Änderung. Da beide Abschnitte in derselben `Edit`-Operation an dieselbe Datei geschrieben wurden, landete der Netz-Freeze-Text bereits in der Diff des Task-1-Commits (`0d7c116`), obwohl dessen Commit-Message nur den D-04a-Nachweis beschreibt.
- **Fix:** Kein Code-Fix nötig — der Inhalt beider Abschnitte ist vollständig, korrekt und an der laut Plan vorgesehenen Stelle in `09-BASELINE.md`. Task 2 wurde regulär mit eigenem Commit (`7395ca6`) abgeschlossen, der die STATE.md-Änderung trägt und in seiner Commit-Message auf die bereits vorhandene Netz-Freeze-Sektion verweist, damit die Historie nachvollziehbar bleibt.
- **Files modified:** .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
- **Verification:** Beide Plan-Acceptance-Criteria für Task 1 und Task 2 wurden unabhängig voneinander per `<verify>`-Kommando bestätigt (grün); `git diff --name-only HEAD~2 HEAD` zeigt ausschließlich die zwei erwarteten Planungsartefakte.
- **Committed in:** 0d7c116 (Netz-Freeze-Textinhalt), 7395ca6 (Task-2-STATE.md-Änderung + Commit-Referenz auf den bereits vorhandenen Abschnitt)

---

**Total deviations:** 1 auto-fixed (1 Prozessabweichung, kein funktionaler Fehler)
**Impact on plan:** Rein kosmetisch — beide inhaltlichen Deliverables (D-04a-Protokoll, Netz-Freeze-Regel) sind vollständig, korrekt platziert und durch die Acceptance-Criteria beider Tasks unabhängig verifiziert. Keine Beweislücke, kein Scope Creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None.

## Next Phase Readiness

- Das Netz ist eingefroren (D-04a erfüllt, Netz-Freeze schriftlich fixiert). Migrationsplan 09-06 kann jetzt starten — jede Änderung an den vier Netz-Dateien außer dem Zählnachweis-Test ist ab hier begründungspflichtig und gilt als Beweis-Leck-Verdacht.
- `09-BASELINE.md` bleibt vollständig referenzfähig für alle Migrations-Commits (09-06..09-09): Markup-Inventar, A1–A4-Annahmen, Baseline-Entscheidung, Randfälle, D-04a-Protokoll und Netz-Freeze-Regel liegen jetzt vollständig in einer Datei.
- Keine Blocker für 09-06.

## Self-Check: PASSED

- FOUND: .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md contains "D-04a Doppel-Grün-Nachweis" and "Netz-Freeze"
- FOUND: .planning/STATE.md contains new Open-TODOs entry referencing 09-05-PLAN.md
- FOUND commits: 0d7c116, 7395ca6

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
