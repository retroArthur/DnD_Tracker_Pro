---
phase: 01-stabilisierung
plan: 01
subsystem: testing
tags: [playwright, smoke-test, debug, boot-crash, mindmap-cleanup]

# Dependency graph
requires: []
provides:
  - "Boot-Crash in tools/debug.js behoben (clearMindmap-Referenz entfernt)"
  - "Playwright-Smoke-Test-Infrastruktur (playwright.smoke.config.js + tests/e2e/smoke.spec.js)"
  - "Frischer dev-Build ohne tote Mindmap-Referenzen"
affects: [02-persistenz, 03-mindmap-bereinigung, 04-build-haertung, 05-lint-typecheck, 06-ci-haertung, 07-doku-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Smoke-Test mit eigenständiger Config (playwright.smoke.config.js) getrennt vom Haupt-E2E"
    - "SMOKE_BASE_URL Env-Variable für CI-HTTP-Server vs. lokaler file://-Fallback"
    - "pageerror-Listener in Playwright-Tests für Boot-Crash-Erkennung"

key-files:
  created:
    - playwright.smoke.config.js
    - tests/e2e/smoke.spec.js
  modified:
    - tools/debug.js

key-decisions:
  - "Tote window-Exports (clearMindmap, generateTestMindmap, testNetworkSystem, testNodeTypes) ebenfalls entfernt — Rule 1 (Bug), da sie beim Script-Load ReferenceErrors verursachen"
  - "Smoke-Config auf smoke.spec.js beschränkt (testMatch) um bekannte 26 E2E-Failures nicht zu importieren"
  - "file://-Fallback in Smoke-Tests für lokale Entwicklung; SMOKE_BASE_URL für CI-HTTP-Server"

patterns-established:
  - "Smoke-Test-Pattern: Eigenständige Config + pageerror-Listener + Tab-Sweep ohne Interaktionstests"

requirements-completed: [STAB-01, STAB-08]

# Metrics
duration: 25min
completed: 2026-06-12
---

# Phase 1, Plan 1: Boot-Crash-Fix + Smoke-Test-Infrastruktur

**clearMindmap-Boot-Crash (STAB-01) behoben durch Entfernen toter Mindmap-Referenzen in tools/debug.js; Playwright-Smoke-Infrastruktur (playwright.smoke.config.js + smoke.spec.js) bestätigt fehlerfreien Boot und 6 crash-freie Tabs**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-12T00:20:00Z
- **Completed:** 2026-06-12T00:45:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Boot-Crash behoben: `const clearAllNodes = clearMindmap` und zugehöriger Kommentar aus `tools/debug.js` entfernt (STAB-01)
- Alle weiteren toten Mindmap-Referenzen in tools/debug.js entfernt (4 window-Exports: clearMindmap, generateTestMindmap, testNetworkSystem, testNodeTypes)
- `playwright.smoke.config.js` angelegt: eigenständige Config, nur smoke.spec.js, CI-HTTP-Server + file://-Fallback
- `tests/e2e/smoke.spec.js` angelegt: 7 Tests (1 Boot-Check + 6 Tab-Sweep), alle grün (7/7)
- Frischer dev-Build erstellt und validiert (2,019,320 Zeichen, kein SyntaxError)

## Task Commits

1. **Task 1: clearMindmap-Boot-Crash in tools/debug.js entfernen** - `2a7d4ef` (fix)
2. **Task 2: playwright.smoke.config.js anlegen** - `911178f` (feat)
3. **Task 3: tests/e2e/smoke.spec.js anlegen** - `561d5e6` (feat)

## Files Created/Modified

- `tools/debug.js` - Tote clearMindmap-Referenzen entfernt (Zeile 98-99 + 4 window-Exports)
- `playwright.smoke.config.js` - Eigenständige Smoke-Test-Config (testMatch: smoke.spec.js, SMOKE_BASE_URL)
- `tests/e2e/smoke.spec.js` - Boot-Check + 6-Tab-Sweep (7 Tests)

## Decisions Made

- Neben der geplanten `const clearAllNodes = clearMindmap`-Zeile wurden auch 4 weitere tote window-Exports entfernt (`window.clearMindmap`, `window.generateTestMindmap`, `window.testNetworkSystem`, `window.testNodeTypes`). Diese würden beim Script-Load in der gebündelten HTML ebenfalls ReferenceErrors verursachen und sind somit Teil desselben Boot-Crash-Problems. Anwendung: Rule 1 (Bug-Fix).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Weitere tote Mindmap-Window-Exports entfernt**
- **Found during:** Task 1 (clearMindmap-Boot-Crash-Fix)
- **Issue:** Grep zeigte nach dem initialen Fix noch `window.clearMindmap = clearMindmap;` (Zeile 973), `window.generateTestMindmap = generateTestMindmap;` (Zeile 978), `window.testNetworkSystem = testNetworkSystem;` (Zeile 981), `window.testNodeTypes = testNodeTypes;` (Zeile 982). Keine dieser Funktionen existiert mehr nach der Mindmap-Entfernung. Im gebündelten Script würden diese Zeilenim globalen Scope ausgewertet und denselben Boot-Crash wie clearAllNodes verursachen.
- **Fix:** Alle 4 toten window-Exports aus dem Backward-Compatibility-Exports-Block entfernt.
- **Files modified:** tools/debug.js
- **Verification:** `python -c "print(open('tools/debug.js').read().count('clearMindmap'))"` → 0; Build läuft durch, 7/7 Smoke-Tests grün.
- **Committed in:** 2a7d4ef (Teil des Task-1-Commits)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 - Bug)
**Impact on plan:** Notwendige Erweiterung — ohne diesen Fix hätte der Boot-Crash weiter bestanden, da window-Exports im globalen Scope ausgewertet werden.

## Issues Encountered

Keine unerwarteten Probleme. `dist/` ist in `.gitignore` — nur `tools/debug.js` committed (korrekt, Build-Artefakt nicht versioniert).

## User Setup Required

Keine — keine externen Services konfiguriert.

## Next Phase Readiness

- App startet nun ohne pageerror (STAB-01 abgeschlossen)
- Smoke-Test-Infrastruktur für CI vorhanden (STAB-08-Fundament)
- Plan 02 (Persistenz-Fix, STAB-05/06) kann gestartet werden
- Plan 03 (Mindmap-Reste-Bereinigung, STAB-02) profitiert vom Smoke-Test als Regressionsschutz

---
*Phase: 01-stabilisierung*
*Completed: 2026-06-12*

## Self-Check: PASSED

- FOUND: tools/debug.js
- FOUND: playwright.smoke.config.js
- FOUND: tests/e2e/smoke.spec.js
- FOUND: .planning/phases/01-stabilisierung/01-01-SUMMARY.md
- FOUND commit: 2a7d4ef (Task 1 - fix debug.js)
- FOUND commit: 911178f (Task 2 - smoke config)
- FOUND commit: 561d5e6 (Task 3 - smoke spec)
