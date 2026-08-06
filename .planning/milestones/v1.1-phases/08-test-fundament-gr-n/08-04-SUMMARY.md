---
phase: 08-test-fundament-gr-n
plan: 04
subsystem: testing
tags: [ci, github-actions, playwright, documentation, e2e-gate]

# Dependency graph
requires:
  - phase: 08-01
    provides: "App-Bug-Fixes (Attribut-Modifikator, Migration-Banner, renderAll-Lücke) — Teil der grünen Baseline und der Triage-Klassifikation"
  - phase: 08-02
    provides: "Test-Bug-Fixes (Selektoren, Timer-API, Toast-Race) — Baseline auf 0 Fails gebracht, Grundlage für D-07-Dokumentation"
  - phase: 08-03
    provides: "Suite-weite Assertion-Härtung (D-04/D-05/D-06) — volle Suite zweimal in Folge grün, Grundlage für das CI-Gate"
provides:
  - "Blockierender e2e-CI-Job in ci.yml (Dev-Build + volle Playwright-Suite gegen file://), ohne continue-on-error, mit Failure-Artefakt-Upload"
  - "build-Job hängt zusätzlich von e2e ab — roter e2e-Lauf blockiert transitiv build -> smoke-test -> deploy"
  - "docs/e2e-failure-triage.md: dauerhafter, commit-verlinkter Klassifikations-Datensatz (Test-Bug/App-Bug) für alle 11+2 ehemaligen Fails"
  - "Korrektur der stale 'Cluster 3: 9x DOM duplication'-Theorie (war Playwrights Retry-Poll-Zähler) und Auflösung von Cluster 4 (Undo-nach-Delete, kein Code-Fix nötig)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "e2e-CI-Job modelliert auf dem bestehenden smoke-test-Job (checkout/setup-node/setup-python/npm ci), aber gegen den Dev-Bundle statt Production und ohne HTTP-Server/SMOKE_BASE_URL"

key-files:
  created:
    - .planning/phases/08-test-fundament-gr-n/08-04-SUMMARY.md
  modified:
    - .github/workflows/ci.yml
    - docs/e2e-failure-triage.md

key-decisions:
  - "build-Job's needs-Array um e2e erweitert (statt nur smoke-test) — macht D-03s 'blockierend' so eng wie ci.yml allein es ausdrücken kann: ein roter e2e-Lauf verhindert bereits den Production-Build, nicht erst den Deploy-Schritt danach"
  - "Kein 3. Argument-Container-Fallback für den e2e-Job nötig — Job nutzt playwright.config.js's Defaults (file://, CI retries=2/workers=1) unverändert, wie in RESEARCH empfohlen"
  - "Cluster 3/4-Korrekturen direkt als Blockquote-Updates in den bestehenden Mai-2026-Abschnitten ergänzt UND im neuen Phase-8-Abschnitt zusammengefasst — durchsuchbar an beiden Stellen, keine Duplizierung der Erklärung selbst (Cluster-Update verweist auf den neuen Abschnitt)"

requirements-completed: [TEST-02]

coverage:
  - id: D1
    description: "Neuer blockierender e2e-Job in ci.yml: Dev-Build + npx playwright install --with-deps chromium + npx playwright test, kein continue-on-error, Failure-Artefakt-Upload; build.needs enthält e2e"
    requirement: TEST-02
    verification:
      - kind: other
        ref: "node -e Verify-Skript aus PLAN.md Task 1 (e2e:-Job vorhanden, install+test-Befehle, if: failure(), kein continue-on-error) — PASS"
        status: pass
      - kind: e2e
        ref: "npm run build:dev && npx playwright test (identische Befehle wie im neuen Job) — 231 passed / 2 skipped / 0 failed"
        status: pass
      - kind: unit
        ref: "npx jest --silent — 457/457 passed"
        status: pass
    human_judgment: true
    rationale: "Die tatsächliche Ausführung auf einem GitHub-Actions-Ubuntu-Runner sowie die Branch-Protection-Erzwingung des e2e-Checks vor dem Merge sind außerhalb dieser lokalen Verifikation und werden erst beim nächsten Push bzw. in den Repo-Settings bestätigt (per RESEARCH Open Question 1 als Repo-Settings-Folgeaufgabe geflaggt)."
  - id: D2
    description: "docs/e2e-failure-triage.md erhält einen datierten 'Phase 8 — Resolution (2026-07)'-Abschnitt mit Klassifikation (Test-Bug/App-Bug) + Root-Cause + Fix + Commit-Hash für jeden ehemaligen Fail, plus Korrektur von Cluster 3 (9x-DOM-Theorie widerlegt) und Auflösung von Cluster 4 (Undo-nach-Delete)"
    requirement: TEST-02
    verification:
      - kind: other
        ref: "node -e Verify-Skript aus PLAN.md Task 2 (Phase 8, Test-Bug, App-Bug, retry-poll-Referenz) — PASS"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-07-23
status: complete
---

# Phase 8 Plan 4: CI-Gate + Triage-Dokumentation (D-03/D-07) Summary

**Blockierender `e2e`-CI-Job (Dev-Build + volle Playwright-Suite gegen `file://`, ohne `continue-on-error`, im `build.needs`-Array verankert) plus ein dauerhafter, commit-verlinkter Klassifikations-Datensatz für alle 13 ehemaligen E2E-Fails in `docs/e2e-failure-triage.md`, der zugleich die stale "9× DOM-Duplikation"-Theorie widerlegt und die Undo-nach-Delete-Sorge als bereits gelöst dokumentiert.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-23 (nach Abschluss von 08-03)
- **Completed:** 2026-07-23
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Ein neuer `e2e:`-Job in `.github/workflows/ci.yml` baut den Dev-Bundle (`python build.py`, kein `--production`), installiert Chromium (`npx playwright install --with-deps chromium`) und führt die volle Suite aus (`npx playwright test`, nutzt `playwright.config.js`'s CI-Defaults: `retries=2`/`workers=1`) — ohne jegliches Ignorieren roter Schritte, mit `actions/upload-artifact@v4` (`if: failure()`) für Reports + Test-Results.
- Der `build`-Job hängt jetzt zusätzlich von `e2e` ab (`needs: [lint-and-typecheck, test, e2e]`) — ein roter E2E-Lauf blockiert damit transitiv `build` → `smoke-test` → `deploy`, so eng, wie D-03's "blockierend" innerhalb von `ci.yml` allein ausdrückbar ist. Ein YAML-Kommentar flaggt, dass das Erzwingen dieses Checks vor dem Merge eine GitHub-Branch-Protection-Einstellung außerhalb dieses Dateibereichs ist.
- `docs/e2e-failure-triage.md` erhielt einen neuen, datierten "Phase 8 — Resolution (2026-07)"-Abschnitt: für jeden der 7 vom Plan benannten ehemaligen Fail-Cluster (2 App-Bugs mit demselben Commit, 1 App-Bug, 4 Test-Bug-Fundstellen im selben Commit-Paar) steht Klassifikation, Ein-Satz-Root-Cause, Fix-Beschreibung und der reale Commit-Hash — verifiziert gegen `git log`.
- Die bestehenden Mai-2026-Abschnitte "Cluster 3" und "Cluster 4" wurden direkt mit Blockquote-Updates versehen: Cluster 3's "9x DOM duplication"-Verdacht ist als empirisch widerlegt markiert (Playwrights eigener Retry-Poll-Zähler, Live-DOM-Count immer 1 — der reale Bug war eine ambige `.dice-details`-Selektion); Cluster 4 (Undo-nach-Delete) ist als durch vorherige Arbeit gelöst markiert, mit der heutigen Baseline (5/5 Löschen-Undo-Tests grün) als Beleg, kein Code-Fix nötig.

## Task Commits

Each task was committed atomically:

1. **Task 1: Blockierender e2e-CI-Job (D-03)** - `205f528` (feat)
2. **Task 2: Triage-Dokumentation je Fail + Cluster-Korrekturen (D-07)** - `f3cf01f` (docs)

_Kein separater Plan-Metadaten-Commit — dieser folgt nach dem Self-Check via den Final-Commit-Schritt._

## Files Created/Modified
- `.github/workflows/ci.yml` - Neuer `e2e:`-Job (Dev-Build, Chromium-Install, volle Playwright-Suite, Failure-Artefakt-Upload, kein Ignorieren roter Schritte); `build`-Job's `needs`-Array um `e2e` erweitert
- `docs/e2e-failure-triage.md` - Neuer "Phase 8 — Resolution (2026-07)"-Abschnitt (7 klassifizierte Fail-Einträge + Hardening-Notiz + CI-Gate-Notiz); Cluster-3/4-Abschnitte mit Korrektur-/Auflösungs-Blockquotes versehen

## Decisions Made
- `build`-Job's `needs`-Array (statt nur `smoke-test`s) um `e2e` erweitert — verhindert bereits den Production-Build bei rotem E2E-Lauf, nicht erst den nachgelagerten Deploy-Schritt, und erfüllt damit D-03's "blockierend"-Anforderung so eng wie innerhalb von `ci.yml` möglich.
- Kein 3. Argument/Container-Override für den `e2e`-Job — nutzt `playwright.config.js`'s bestehende CI-Defaults unverändert (`retries=2`, `workers=1`, `file://`-`baseURL`), wie von RESEARCH empfohlen.
- Die Cluster-3/4-Korrekturen wurden sowohl als Blockquote direkt in den ursprünglichen Mai-2026-Abschnitten ergänzt (für Leser, die dort zuerst landen) als auch im neuen Phase-8-Abschnitt zusammengefasst — keine widersprüchliche Doppel-Erklärung, das Cluster-Update verweist auf den neuen Abschnitt für Details.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Verify-Skript für Task 1 schlug initial fehl — eigener Kommentartext enthielt den verbotenen String**
- **Found during:** Task 1 (automatisierte Verifikation nach dem ersten Edit)
- **Issue:** Der neu hinzugefügte YAML-Kommentar über dem `e2e:`-Job erklärte in Prosa, dass der Job bewusst *ohne* `continue-on-error` läuft — und enthielt dabei den Literal-String `continue-on-error`, den das Plan-Verify-Skript per `!/continue-on-error/.test(s)` als Abwesenheits-Prüfung nutzt. Das Skript schlug fälschlich fehl, obwohl kein echtes `continue-on-error:`-YAML-Feld gesetzt war.
- **Fix:** Kommentartext umformuliert, sodass er den Sachverhalt beschreibt, ohne den Literal-String zu wiederholen ("Bewusst OHNE die YAML-Option, die einen roten Schritt ignorieren würde").
- **Files modified:** .github/workflows/ci.yml
- **Verification:** `node -e` Verify-Skript aus PLAN.md Task 1 — PASS (vorher FAIL)
- **Committed in:** 205f528 (Teil von Task 1, vor dem Commit korrigiert)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug, reine Verify-Skript-String-Kollision, kein funktionaler YAML-Unterschied)
**Impact on plan:** Kein Scope-Creep — reine Formulierungskorrektur im Kommentar, keine Änderung an der YAML-Job-Logik selbst.

## Issues Encountered
None über die oben dokumentierte Verify-Skript-Deviation hinaus.

## User Setup Required

**Repo-Settings-Folgeaufgabe außerhalb dieses Commits** (nicht blockierend für Phase-8-Abschluss, aber für die volle D-03-Wirkung empfohlen): In GitHub → Settings → Branches → Branch protection rules für `main` den neuen `e2e`-Check als "Required status check before merging" hinzufügen. `ci.yml` allein kann diese Merge-Gate-Erzwingung nicht setzen (GitHub-Branch-Protection ist ein Repo-Settings-Konzept außerhalb der Workflow-Datei) — das ist auch im YAML-Kommentar über dem neuen Job vermerkt.

## Next Phase Readiness
- TEST-01 und TEST-02 sind für Phase 8 vollständig erfüllt: 0 E2E-Fails (volle Suite zweimal in Folge grün, zuletzt in dieser Sitzung erneut bestätigt: 231 passed / 2 skipped / 0 failed), suite-weite Assertion-Härtung (08-03), und jetzt ein blockierendes CI-Gate (dieser Plan) sowie eine vollständige, commit-verlinkte Triage-Dokumentation (dieser Plan).
- `npx jest`: 457/457 grün, keine Regression durch diesen Plan (reine CI/Doku-Änderungen, kein App- oder Test-Code angefasst).
- Phase 8 ist bereit für `/gsd-verify-work` bzw. den Phasen-Abschluss — kein bekannter Blocker.
- Offen (nicht-blockierend, siehe „User Setup Required"): GitHub-Branch-Protection-Regel für den `e2e`-Check ist eine manuelle Repo-Settings-Aktion, die von diesem Plan nicht ausgeführt werden kann.

---
*Phase: 08-test-fundament-gr-n*
*Completed: 2026-07-23*

## Self-Check: PASSED

All 2 modified files verified present on disk (.github/workflows/ci.yml, docs/e2e-failure-triage.md); both task commit hashes (205f528, f3cf01f) verified present in `git log --oneline --all`.
