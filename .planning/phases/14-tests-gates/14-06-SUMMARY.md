---
phase: 14-tests-gates
plan: 06
subsystem: testing
tags: [eslint, no-undef, dead-code, data-action, lint-ratchet]

# Dependency graph
requires:
  - phase: 14-tests-gates
    provides: "14-02: Globals-Generator + eslint.generated-globals.js reduzieren no-undef auf genau die 7 D-09-Fundstellen — Vorbedingung fuer no-undef: error"
provides:
  - "Sieben tote/fehlerhafte Aktionsziele behoben (D-09): sechs Registrierungen ohne Bedienflaeche entfernt, ein echter ReferenceError (export-csv) korrigiert"
  - "no-undef: error in eslint.config.js — 0 Fehler, projektweiter Nulltoleranz-Fehler statt Rauschen unter 2196 Warnungen"
  - "Warnungsgrenze als Ratsche gepinnt: npm run lint = eslint . --max-warnings 367, beidseitig geprueft (367 -> Exit 0, 366 -> Exit 1); lint:all entfernt"
affects: [14-09]

# Actuals (#2632)
actuals:
  tokens: 1700
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Entscheidungsregel je Fundstelle statt Pauschalbehandlung: data-action in assets/templates/** vorhanden -> beheben; nicht vorhanden -> Registrierung entfernen (kein Platzhalter-Handler)"
    - "Lint-Ratsche ueber gemessenen --max-warnings-Wert statt globaler Statement-Schwelle — Haerte kommt aus no-undef: error (Toleranz 0), Trend aus einer Zahl, die nur fallen darf"

key-files:
  created: []
  modified:
    - ui/actions/entity-actions.js
    - ui/actions/system-actions.js
    - ui/actions/ui-actions.js
    - core/init.js
    - types/globals.d.ts
    - eslint.config.js
    - package.json
    - .planning/phases/14-tests-gates/14-GATE-BASELINE.md

key-decisions:
  - "export-csv ruft jetzt exportToCSV(ctx.value) statt der nicht existierenden exportDataCSV — Aufruf korrigiert, kein Alias ergaenzt"
  - "sechs Registrierungen ersatzlos entfernt (scroll-to-npc, remove-loot-tag, populate-import-nodes, set-view-mode, clear-error-log inkl. showErrorLogModal-Aufruf, initLootTagSystem-Aufruf) — kein data-action in assets/templates/** oder im JS-Quellbaum referenziert sie"
  - "Warnungsgrenze frisch auf 367 gemessen (nicht aus RESEARCH.md uebernommen, das 367 fuer einen aelteren Dateisatz nennt) und exakt so gepinnt, ohne Puffer"

requirements-completed: [TEST-05]

coverage:
  - id: D1
    description: "Sieben D-09-Fundstellen je nach Befund behoben oder entfernt — echter ReferenceError im Zauber-Tab (export-csv) beseitigt, sechs tote Registrierungen ohne Bedienflaeche entfernt"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "node --check auf allen vier Aktionsdateien — Exit 0"
        status: pass
      - kind: other
        ref: "grep-Nachweis: exportDataCSV/scrollToNPC/removeLootTag/populateImportNodesList/setViewMode/showErrorLogModal/initLootTagSystem kommen nirgends mehr vor; exportToCSV genau 1x in system-actions.js"
        status: pass
      - kind: other
        ref: "git diff zeigt in den vier Aktionsdateien ausschliesslich Loeschungen + eine geaenderte Zeile — kein Platzhalter"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py — Exit 0, keine [FEHLER]/[ABORTED]"
        status: pass
      - kind: unit
        ref: "npx jest — 48/48 Suiten, 1112/1112 Tests"
        status: pass
      - kind: e2e
        ref: "npx playwright test (nach frischem Build) — 321 passed / 2 skipped"
        status: pass
    human_judgment: false
  - id: D2
    description: "no-undef auf error gehoben, 0 Fehler nachgewiesen, keine Hand-Globals oder neuen ignores-Eintraege"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "grep \"'no-undef': 'error'\" eslint.config.js — vorhanden"
        status: pass
      - kind: other
        ref: "npx eslint . — Exit 0, 0 Fehler, 367 Warnungen"
        status: pass
      - kind: other
        ref: "git diff --unified=0 eslint.config.js | grep '^+.*ignores' — keine Treffer"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit — Exit 0"
        status: pass
      - kind: unit
        ref: "npx jest — 48/48 Suiten, 1112/1112 Tests"
        status: pass
    human_judgment: false
  - id: D3
    description: "Warnungsgrenze als Ratsche auf den gemessenen Reststand (367) gepinnt, zweiter Lint-Befehl entfernt, Ratschenwirkung beidseitig belegt"
    requirement: TEST-05
    verification:
      - kind: other
        ref: "node-Probe: lint:all fehlt, lint traegt --max-warnings 367 — Exit 0"
        status: pass
      - kind: other
        ref: "npm run lint — Exit 0"
        status: pass
      - kind: other
        ref: "npx eslint . --max-warnings 366 — Exit 1 (Ratsche sitzt exakt am Reststand)"
        status: pass
      - kind: other
        ref: "grep lint:all in .github/workflows/ci.yml und package.json — keine Treffer"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 06: Tote Aktionsziele behoben, no-undef auf error, Lint-Ratsche gepinnt (D-08/D-09/D-10) Summary

**Sieben tote/fehlerhafte `data-action`-Ziele behandelt (ein echter `ReferenceError` im Zauber-Tab behoben, sechs verwaiste Registrierungen entfernt), `no-undef` auf `error` gehoben (0 Fehler), und die Warnungsgrenze exakt auf den gemessenen Reststand von 367 gepinnt — `lint:all` entfällt.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-09-07
- **Completed:** 2026-09-07
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- **D-09 behoben:** `export-csv` ruft jetzt die tatsächlich existierende `exportToCSV(dataType)`
  aus `systems/spellslots/import-export.js` statt der nirgends im Repo definierten
  `exportDataCSV` — ein Klick auf den CSV-Knopf im Zauber-Tab (`assets/templates/view-resources.html:143`)
  löste vorher einen `ReferenceError` aus. `types/globals.d.ts` deklariert jetzt `exportToCSV`
  statt der verwaisten `exportDataCSV`-Ambient-Deklaration.
- Sechs Registrierungen ohne jede Bedienfläche ersatzlos entfernt: `scroll-to-npc`,
  `remove-loot-tag`, `populate-import-nodes` (alle drei in `entity-actions.js`), `set-view-mode`
  (`ui-actions.js`), `clear-error-log` samt seinem `showErrorLogModal()`-Aufruf
  (`system-actions.js`), und der `typeof`-geschützte, aber unbedingte `initLootTagSystem()`-Aufruf
  in `core/init.js`. Kein Platzhalter-Handler ergänzt — ein Klick, der stumm nichts tut, wäre
  schlechter als der vorherige sichtbare Fehler.
- **D-08 abgeschlossen:** `no-undef` in `eslint.config.js` von `warn` auf `error` gehoben, mit
  Begründungszeile zum generierten Artefakt. `npx eslint .` meldet 0 Fehler, 367 Warnungen — genau
  der Reststand aus `14-GATE-BASELINE.md` ohne die (jetzt behobenen) `no-undef`-Treffer. Keine
  Hand-Globals, keine neuen `ignores`-Einträge.
- **D-10 abgeschlossen:** Reststand frisch mit `npx eslint . --format json` gemessen: exakt 367
  Warnungen (336 `no-unused-vars`, 11 `no-misleading-character-class`, 8 unbenutzte
  `eslint-disable`-Direktiven, 8 `no-useless-escape`, 4 `no-empty`). `package.json`s `lint`-Skript
  jetzt `eslint . --max-warnings 367`; `lint:all` (abweichende Grenze 100) entfernt.
  Ratschenwirkung beidseitig bewiesen: gepinnter Wert → Exit 0, ein Warnwert weniger (366) → Exit 1.
  `.github/workflows/ci.yml` rief bereits nur `npm run lint` auf — keine CI-Änderung nötig.
- Gepinnter Wert und Messdatum in `14-GATE-BASELINE.md` nachgetragen (neuer Abschnitt „Nachtrag
  (Plan 14-06, Task 3)").

## Task Commits

1. **Task 1: Sieben tote Aktionsziele je Fundstelle behandelt (D-09)** - `cc5959c` (fix)
2. **Task 2: `no-undef` auf `error` gehoben (D-08 Abschluss)** - `24bb27f` (feat)
3. **Task 3: Warnungsgrenze als Ratsche gepinnt, `lint:all` entfernt (D-10)** - `291a35b` (fix)

**Plan metadata:** wird im Anschluss committet (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified
- `ui/actions/system-actions.js` - `export-csv` ruft `exportToCSV`; `clear-error-log`/`showErrorLogModal`-Block entfernt
- `ui/actions/entity-actions.js` - `scroll-to-npc`, `remove-loot-tag`, `populate-import-nodes` entfernt
- `ui/actions/ui-actions.js` - `set-view-mode` entfernt
- `core/init.js` - `initLootTagSystem()`-Aufruf entfernt
- `types/globals.d.ts` - `exportDataCSV` → `exportToCSV`-Deklaration
- `eslint.config.js` - `no-undef: 'error'` + Begründungskommentar
- `package.json` - `lint` mit `--max-warnings 367`; `lint:all` entfernt
- `.planning/phases/14-tests-gates/14-GATE-BASELINE.md` - Ratschenwert + Messdatum nachgetragen

## Decisions Made
- **`export-csv` korrigiert statt Alias ergänzt:** genau ein Name für die Funktion
  (`exportToCSV`), kein `exportDataCSV`-Wrapper. Verhindert eine zweite Wahrheit über dieselbe
  Funktionalität.
- **Sechs Entfernungen statt Platzhalter:** für keine der sechs toten Registrierungen existiert
  ein `data-action` in `assets/templates/**` oder eine zur Laufzeit erzeugte Bedienfläche im
  JS-Quellbaum. Ein leerer Handler wäre ein stiller Klick ohne Wirkung — schlechter als der
  vorherige, sichtbare Fehler.
- **367 frisch gemessen, nicht aus `RESEARCH.md` übernommen:** `RESEARCH.md`s Pitfall 3 nennt
  ebenfalls 367, aber für einen anderen Dateisatz (vor den zehn neuen Testdateien aus Plan 14-04/
  14-05). Der Plan verlangt ausdrücklich eine frische Messung — sie ergab zufällig denselben Wert,
  was gegen den Live-Baum nachgerechnet wurde, nicht übernommen.

## Deviations from Plan

None - plan executed exactly as written.

**Hinweis (kein Deviation, aber dokumentationspflichtig):** `npm run check` (`tsc:check && lint &&
format:check`) endet mit Exit 1, weil `format:check` (Prettier) bei 131 Dateien Formatierungsfragen
meldet. Das ist eine **vorbestehende, plan-unabhängige Abweichung** — verifiziert per
`git show 1253a95:ui/actions/entity-actions.js` (letzter Commit vor Plan 14-06) gegen `npx prettier
--check`: derselbe Befund bereits vor jeder Änderung dieses Plans. Ursache ist plausibel
Windows-Zeilenenden (Git meldet beim Staging wiederholt „LF will be replaced by CRLF"), nicht
Plan-14-06-Inhalt. Außerhalb des Scope-Boundary dieses Plans (Rule: nur Fehler beheben, die die
aktuelle Aufgabe verursacht hat) — nicht gefixt, hier benannt statt stillschweigend übergangen.
`tsc:check` und `lint` (die beiden für diesen Plan relevanten Teilbefehle von `check`) laufen
beide grün.

## Issues Encountered

**Arbeitsunfall während Task-3-Messung (selbst verursacht, folgenlos behoben):** Beim Prüfen, ob
die vorbestehende `format:check`-Abweichung schon vor diesem Plan existierte, wurde versehentlich
`git checkout 1253a95 -- .` auf den gesamten Arbeitsbaum angewendet (statt gezielt auf eine
Kopie) — das hätte die unstaged Task-3-Änderung an `package.json` durch den alten Stand ersetzt.
Vorher stand ein `git stash` (ebenfalls Teil desselben Prüfschritts). Sofort erkannt und behoben:
`git checkout HEAD -- .` stellte den Arbeitsbaum auf die committeten Task-1/2-Stände zurück,
`git stash pop` (im Haupt-Repo, kein Worktree — sicher) restaurierte die gestashte
`package.json`-Änderung unverändert. Nach der Wiederherstellung wurden alle Task-1/2-Dateien
gegen `grep`/`git diff` erneut geprüft — keine Datenverluste. Kein Produktionscode betroffen,
kein Commit ging verloren.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `no-undef` ist jetzt ein harter Fehler (0 Vorkommen); künftige Tippfehler in Funktionsnamen
  brechen `npx eslint .` sofort ab, statt in 2196 Warnungen unterzugehen.
- `npm run lint` trägt eine gemessene, beidseitig geprüfte Ratsche (367); ein neuer Verstoß macht
  den Lauf rot.
- Ein echter Bedienfehler im Zauber-Tab (CSV-Export) ist behoben; volle Suiten grün (Jest
  48/48 Suiten · 1112 Tests, Playwright 321 passed/2 skipped, `tsc --noEmit` Exit 0, `build.py`
  Exit 0).
- Keine Blocker für die verbleibenden Pläne dieser Phase (14-07 ff.) — D-11/D-12/D-13
  (Typecheck-Zulassungsliste, Coverage-`roots`-Fix, Modul-zu-Test-Gate) bleiben offen.
- Die vorbestehende `npm run check`/Prettier-Formatierungsabweichung (131 Dateien, vermutlich
  Windows-Zeilenenden) bleibt unbehoben und außerhalb des Scope dieses Plans — Kandidat für einen
  eigenen, dedizierten Posten.

---
*Phase: 14-tests-gates*
*Completed: 2026-09-07*

## Self-Check: PASSED

- FOUND: commit `cc5959c` (Task 1)
- FOUND: commit `24bb27f` (Task 2)
- FOUND: commit `291a35b` (Task 3)
- Re-ran `npx eslint .` → Exit 0, 0 Fehler, 367 Warnungen
- Re-ran `npm run lint` → Exit 0; `npx eslint . --max-warnings 366` → Exit 1
- Re-ran `npx jest` → 48/48 Suiten, 1112/1112 Tests grün
- Re-ran `npx tsc --noEmit` → Exit 0
- Re-ran `PYTHONIOENCODING=utf-8 python build.py` → Exit 0
- Re-ran `npx playwright test` (frischer Build) → 321 passed / 2 skipped
