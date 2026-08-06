---
phase: 01-stabilisierung
plan: 06
subsystem: infra
tags: [ci, playwright, smoke-test, github-actions, quality-gate]

# Dependency graph
requires:
    - phase: 01-01
      provides: 'playwright.smoke.config.js + tests/e2e/smoke.spec.js (smoke-Infrastruktur)'
    - phase: 01-04
      provides: 'build.py gehaertet (DEBUG_MODE-Assertion, Pre-Build-Duplikat-Check)'
    - phase: 01-05
      provides: 'npm run check Konfiguration (eslint, tsc, prettier)'
provides:
    - 'smoke-test-Job in .github/workflows/ci.yml (needs [build], HTTP-Server, download-artifact, SMOKE_BASE_URL)'
    - 'Phase-Quality-Gate-Befund: npm run check-Status fuer Abschlusspruefung dokumentiert'
    - 'Frische dev- und prod-Builds aus gehaertetem build.py verifiziert'
    - 'Lokaler Smoke-Test (7/7) bestaetigt STAB-03 und STAB-08'
affects: [alle-kuenftigen-ci-laeufe, 07-doku-audit]

# Tech tracking
tech-stack:
    added: []
    patterns:
        - 'CI-Smoke-Test-Pattern: needs [build] + download-artifact@v4 + python http.server + SMOKE_BASE_URL'
        - 'Artifact-Download-Pattern: production-build Artefakt aus build-Job in smoke-test-Job'

key-files:
    created: []
    modified:
        - .github/workflows/ci.yml

key-decisions:
    - 'Smoke-Test gegen lokalen HTTP-Server (nicht file://) wegen Playwright-localStorage-Einschraenkungen unter file:// (RESEARCH.md Entscheidung)'
    - 'npx playwright install --with-deps chromium (kein Browser-Cache, MVP-Ansatz per RESEARCH.md D-03)'
    - 'npm run check schlaegt fehl (1196 ESLint-Warnings > --max-warnings 50, Prettier 166 Dateien), STAB-04 nicht erfuellt — kein Reparieren in diesem Task'

patterns-established:
    - 'CI Smoke-Test-Job: immer nach build-Job (needs: [build]), Artefakt herunterladen, HTTP-Server starten, Smoke-Test ausfuehren'

requirements-completed: [STAB-08]

# Metrics
duration: 30min
completed: 2026-06-12
---

# Phase 1, Plan 6: CI-Haertung + Quality-Gate-Verifikation

**smoke-test-Job in ci.yml integriert (HTTP-Server, Artefakt-Download, SMOKE_BASE_URL); frische Builds gruen; lokaler Smoke-Test 7/7; npm run check schlaegt fehl (1196 ESLint-Warnings ueberschreiten --max-warnings 50 + Prettier 166 Dateien) — STAB-04 offen**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-06-12T00:00:00Z
- **Completed:** 2026-06-12T00:30:00Z
- **Tasks:** 2 (Task 1 vollstaendig, Task 2 verifikationsblockiert bei npm run check)
- **Files modified:** 1

## Accomplishments

- smoke-test-Job in `.github/workflows/ci.yml` ergaenzt: `needs: [build]`, `download-artifact@v4`, `python -m http.server 8000 --directory dist`, `npx playwright test --config=playwright.smoke.config.js` mit `SMOKE_BASE_URL=http://localhost:8000/dnd-tracker-optimized.html` (STAB-08)
- Alle Akzeptanzkriterien von Task 1 erfuellt: smoke-test:=1, needs:[build]=1, SMOKE_BASE_URL=1, playwright.smoke.config.js=1, http.server 8000=1, download-artifact=1
- Frischer dev-Build (`python build.py`): Exit 0, dist/dnd-tracker-bundled.html (1.93 MB) erzeugt (STAB-03 partiell)
- Frischer prod-Build (`python build.py --production`): Exit 0, dist/dnd-tracker-optimized.html (1.65 MB) erzeugt (STAB-03 partiell)
- Lokaler Smoke-Test (`npx playwright test --config=playwright.smoke.config.js`): 7/7 Tests gruen, Exit 0 (STAB-03 + STAB-08 lokal bestaetigt)

## Task Commits

1. **Task 1: smoke-test-Job in ci.yml ergaenzen** - `2af32a5` (feat)
2. **Task 2: Phase-Quality-Gate VERIFIZIEREN** - kein Commit (reiner Verifikations-Task, keine Dateiandeirungen)

## Files Created/Modified

- `.github/workflows/ci.yml` - smoke-test-Job als 4. Job nach build-Job eingefuegt (28 Zeilen hinzugefuegt)

## Decisions Made

- Kein Browser-Cache fuer Playwright in CI (MVP-Ansatz, ~30s Overhead akzeptabel, spaeter optimierbar)
- HTTP-Server statt file:// in CI: Playwright unter file:// hat localStorage-Einschraenkungen (dokumentiert in RESEARCH.md)
- `npx playwright install --with-deps chromium` statt nur `install chromium` (mit-deps installs OS-Abhaengigkeiten auf ubuntu-latest)

## Deviations from Plan

Keine code-seitigen Abweichungen. Task 1 wurde exakt nach Plan ausgefuehrt.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** Kein Scope Creep.

## Quality-Gate-Befund (Task 2 - npm run check)

**Status: FEHLGESCHLAGEN — kein Reparieren in diesem Task (per Plan-Aufgabenstellung)**

Task 2 ist ein reiner Verifikations-Task. Befund wird hier dokumentiert:

### ESLint (`npm run lint`)

- **Exit-Code:** 1 (wegen `--max-warnings 50` ueberschritten)
- **Gesamtprobleme:** 1227 (31 errors, 1196 warnings)
- **Fehler-Kategorien:**
    - `no-case-declarations` (16 Faelle): `Unexpected lexical declaration in case block`
    - `no-misleading-character-class` (11 Faelle): Surrogate pairs / combined characters in regex
    - `no-useless-escape` (2 Faelle): Unnecessary escape character
    - `no-dupe-keys` (1 Fall): `Duplicate key 'Paladin'`
    - `no-undef` (1 Fall): `'module' is not defined`
- **Betroffene Dateien:** ca. 30+ Dateien, Hauptlast in core/, features/, utils/
- **Hinweis:** Die 1196 "warnings" sind `no-undef`/`no-unused-vars` — legitim in Non-ESM Global-Scope-Architektur

### Prettier (`npm run format:check`)

- **Exit-Code:** 1
- **Betroffene Dateien:** 166 Dateien nicht nach Prettier-Standard formatiert
- **Meldung:** "Code style issues found in 166 files. Run Prettier with --write to fix."

### TypeScript (`npm run tsc:check`)

- **Exit-Code:** 0 (keine TypeScript-Fehler)

### Empfehlung fuer Gap-Closure-Plan (ausserhalb Plan 06)

Ein gezielter Folge-Plan sollte:

1. `eslint --fix` ausfuehren (auto-fixierbare Regeln: no-case-declarations, no-useless-escape)
2. `prettier --write "**/*.{js,json,md}"` ausfuehren (Formatierung normalisieren)
3. Nicht-auto-fixierbare Errors manuell beheben (no-misleading-character-class, no-dupe-keys)
4. ESLint-Konfiguration anpassen: `no-undef`/`no-unused-vars` auf "warn" setzen (da Non-ESM-Architektur) statt als blocking errors

## Issues Encountered

- `npm run check` schlug fehl wegen ESLint-Warning-Ueberschreitung (1196 > 50) und Prettier-Formatierungsfehlern in 166 Dateien. Gemaess Task-2-Aufgabenstellung wurde nicht repariert — Befund dokumentiert.
- ESLint "31 errors" in der Ausgabe sind irrefuehrend: ESLint-Exit war trotzdem 1 wegen `--max-warnings 50` (alle als "errors" gezaehlten Regeln sind Severity 1/Warning in der ESLint-Konfiguration)

## User Setup Required

Keine — kein externer Service.

## Next Phase Readiness

- CI hat jetzt smoke-test-Job (STAB-08 in CI integriert) ✅
- Lokale Builds sind frisch und fehlerfrei (STAB-03 lokal) ✅
- Lokaler Smoke-Test 7/7 gruen (STAB-08 lokal) ✅
- `npm run check` schlaegt fehl (STAB-04 NICHT erfuellt) — erfordert Gap-Closure-Plan vor Phase-2-Start
- Plan 07 (Doku-Audit) kann unabhaengig starten (kein npm run check als Voraussetzung)

---

_Phase: 01-stabilisierung_
_Completed: 2026-06-12_

## Self-Check: PASSED

- FOUND: .github/workflows/ci.yml (28 Zeilen hinzugefuegt, smoke-test-Job vorhanden)
- FOUND: .planning/phases/01-stabilisierung/01-06-SUMMARY.md (diese Datei)
- FOUND commit 2af32a5: feat(01-06): smoke-test-Job in ci.yml ergaenzen
- Builds: dist/dnd-tracker-bundled.html + dist/dnd-tracker-optimized.html (beide vorhanden nach python build.py)
- Smoke-Test: 7/7 gruen (STAB-03 + STAB-08 lokal bestaetigt)
- STAB-08 in CI: smoke-test-Job korrekt nach Artefakt-Upload (needs: [build]) eingehaengt
