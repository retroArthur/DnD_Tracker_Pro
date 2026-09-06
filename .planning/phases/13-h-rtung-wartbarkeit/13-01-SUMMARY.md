---
phase: 13-h-rtung-wartbarkeit
plan: 01
subsystem: security
tags: [event-delegation, whitelist, xss-defense-in-depth, jest-vm-sandbox]

requires: []
provides:
  - "CALL_ACTION_WHITELIST (Set, 130 Namen) in core/constants.js, im UI_CONSTANTS-Namensraum und als Legacy-Einzelexport"
  - "UIActions.call prüft gegen die Whitelist vor jedem window[ctx.value]-Aufruf"
  - "tests/unit/event-delegation.test.js — 8 Tests inkl. Quellbaum-Abgleich"
affects: [13-08]

actuals:
  tokens: 3857
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Explizite Allowlist (Set) statt Namenspräfix-Konvention für dynamischen window[name]-Dispatch"
    - "vm-Sandbox lädt reale Quelldatei statt Logik im Test nachzubauen (Muster aus tests/unit/file-backup-idb.test.js)"

key-files:
  created:
    - tests/unit/event-delegation.test.js
  modified:
    - core/constants.js
    - ui/actions/ui-actions.js

key-decisions:
  - "flipCoin als Tracer-Ziel bestätigt real (features/dice/dice-core.js:213, window.flipCoin:786, view-tools.html data-value)"
  - "Whitelist zur Ausführungszeit frisch aus dem Quellbaum abgeleitet statt Recherchezahl übernommen — 139 reale Vorkommen, 130 eindeutige Namen (vs. 138/130 zum Planungszeitpunkt; Drift durch Codebase-Entwicklung seit Recherche, kein Bug)"
  - "Zugriff auf CALL_ACTION_WHITELIST ausschließlich über window.-Prefix mit optional chaining (window.CALL_ACTION_WHITELIST?.has(...)) an der Verwendungsstelle — kein lokales const X = window.X in der Funktion (CLAUDE.md Duplicate-Declaration-Pattern)"
  - "Zwei unterscheidbare Fehlermeldungstexte im ErrorHandler.log-Aufruf ('Call-Ziel nicht in Whitelist' vs. 'Call-Ziel ist keine Funktion') für Diagnosefähigkeit"

patterns-established:
  - "Whitelist-Kommentare, die das gesuchte Attributmuster selbst wörtlich zitieren, verunreinigen textbasierte Scans über sich selbst — Beschreibung in Prosa statt Literal-Syntax verwenden"

requirements-completed: [SEC-03]

coverage:
  - id: D1
    description: "UIActions.call ruft window[ctx.value] nur noch auf, wenn ctx.value in CALL_ACTION_WHITELIST steht"
    requirement: "SEC-03"
    verification:
      - kind: unit
        ref: "tests/unit/event-delegation.test.js#ruft ein gelistetes Ziel mit ctx.id auf"
        status: pass
      - kind: unit
        ref: "tests/unit/event-delegation.test.js#ruft ein nicht gelistetes Ziel nicht auf"
        status: pass
      - kind: unit
        ref: "tests/unit/event-delegation.test.js#bricht ohne Wurf ab, wenn ein gelistetes Ziel keine Funktion ist"
        status: pass
    human_judgment: false
  - id: D2
    description: "CALL_ACTION_WHITELIST deckt alle 130 im Quellbaum vorhandenen data-action=\"call\"-Ziele ab, kein bestehender Knopf verliert seine Funktion"
    requirement: "SEC-03"
    verification:
      - kind: unit
        ref: "tests/unit/event-delegation.test.js#CALL_ACTION_WHITELIST deckt jedes im Quellbaum gefundene call-Ziel ab"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/integration/workflows.spec.js (10/10 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fehlerpfad der call-Aktion läuft über ErrorHandler.log() hinter APP_CONFIG.DEBUG_MODE statt roher Konsolenausgabe"
    requirement: "SEC-03"
    verification:
      - kind: unit
        ref: "tests/unit/event-delegation.test.js#protokolliert ein nicht gelistetes Ziel bei aktivem DEBUG_MODE genau einmal über ErrorHandler"
        status: pass
      - kind: unit
        ref: "tests/unit/event-delegation.test.js#protokolliert nicht, wenn DEBUG_MODE aus ist (nicht gelistetes Ziel)"
        status: pass
      - kind: other
        ref: "grep -cE 'console\\.(log|error|warn|info|debug)' ui/actions/ui-actions.js == 0"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 01: Whitelist-Wächter für die `call`-Aktion Summary

**`UIActions.call` ruft `window[ctx.value]` jetzt nur noch auf, wenn der Name in einer 130-Einträge-Allowlist `CALL_ACTION_WHITELIST` steht — Fehlerpfad protokolliert über `ErrorHandler.log()` hinter `DEBUG_MODE` statt roher Konsolenausgabe.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 3 (`core/constants.js`, `ui/actions/ui-actions.js`, `tests/unit/event-delegation.test.js` neu)

## Accomplishments

- `CALL_ACTION_WHITELIST` als `Set` mit 130 zur Ausführungszeit aus dem Quellbaum abgeleiteten Namen in `core/constants.js`, eingetragen im `UI_CONSTANTS`-Namensraum und als Legacy-Einzelexport `window.CALL_ACTION_WHITELIST`
- `UIActions.call` prüft `window.CALL_ACTION_WHITELIST?.has(ctx.value)` VOR jedem Zugriff auf `window[ctx.value]`; ein nicht gelistetes Ziel führt zu keinem Aufruf
- Fehlerpfad läuft über `window.ErrorHandler.log('EventDelegation', <Error>, ctx.value)` hinter `window.APP_CONFIG?.DEBUG_MODE && window.ErrorHandler` (Vorlage `systems/undo.js:18-22`), zwei unterscheidbare Meldungstexte für "nicht in Whitelist" vs. "keine Funktion"
- Neue `tests/unit/event-delegation.test.js` (8 Tests): Tracer-Beweis (gelistet/nicht gelistet/nicht-callable), echter Quellbaum-Abgleich (Whitelist ↔ live gescannte `data-action="call"`-Ziele), sowie DEBUG_MODE-An/Aus-Verhalten des Fehlerpfads

## Task Commits

1. **Task 1: Whitelist-Wächter end-to-end an EINEM Ziel beweisen** - `529af68` (feat)
2. **Task 2: Vollständige Whitelist aus dem Quellbaum ableiten** - `fbb1864` (feat)
3. **Task 3: Fehlerpfad der `call`-Aktion auf ErrorHandler hinter DEBUG_MODE** - `ad2020d` (fix)

_Kein separater Plan-Metadaten-Commit nötig über die im final_commit-Schritt erzeugte docs()-Änderung hinaus._

## Files Created/Modified

- `core/constants.js` - `CALL_ACTION_WHITELIST` (Set, 130 Namen) + `UI_CONSTANTS`-Eintrag + Legacy-Export `window.CALL_ACTION_WHITELIST`
- `ui/actions/ui-actions.js` - `call`-Handler: Whitelist-Check vor `window[ctx.value]`, Fehlerpfad über `ErrorHandler.log()` hinter `DEBUG_MODE`
- `tests/unit/event-delegation.test.js` (neu) - vm-Sandbox-Tests für den `call`-Handler, inkl. Quellbaum-Abgleichstest

## Decisions Made

- `flipCoin` als Tracer-Ziel bestätigt real vor Verwendung (`features/dice/dice-core.js:213`, `window.flipCoin` Zeile 786, `view-tools.html` `data-value="flipCoin"`) — kein Platzhalter
- Whitelist-Liste bewusst zur Ausführungszeit neu aus dem Quellbaum abgeleitet statt der im Plan genannten Recherchezahl (138/130) blind zu übernehmen: gemessen 139 reale Vorkommen, 130 eindeutige Namen, 0 Treffer mit umgekehrter Attributreihenfolge, 0 dynamische Template-Literal-Ziele, 0 Vorkommen ohne `data-value` auf derselben Zeile — alle drei Nullaussagen aus `13-RESEARCH.md` (Pattern 2) bestätigt weiterhin geschlossen
- Zugriff auf `CALL_ACTION_WHITELIST` ausschließlich als `window.CALL_ACTION_WHITELIST?.has(...)` an der Verwendungsstelle, kein `const X = window.X` innerhalb der Handler-Funktion (CLAUDE.md „Duplicate Declaration Debugging Pattern")
- Zwei unterscheidbare Fehlermeldungstexte (`'Call-Ziel nicht in Whitelist'` / `'Call-Ziel ist keine Funktion'`) im `ErrorHandler.log`-Aufruf, damit im Diagnosefall (DEBUG_MODE) erkennbar ist, welcher der beiden Fälle vorlag

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Doc-Kommentar in `core/constants.js` verunreinigte den eigenen Quellbaum-Scan**
- **Found during:** Task 2 (Vollständige Whitelist ableiten)
- **Issue:** Der in Task 1 geschriebene Doc-Kommentar über `CALL_ACTION_WHITELIST` zitierte das Suchmuster wörtlich (`data-action="call" data-value="<name>"`), wodurch er selbst als Treffer im textbasierten Scan über `core/` auftauchte — ein Platzhalter-Ziel `<name>` landete in der extrahierten Zielmenge, und eine zweite Kommentarzeile ohne `data-value` löste den "fehlendes data-value"-Fall aus
- **Fix:** Kommentar auf Prosa-Beschreibung umgestellt ("data-action mit Wert 'call', Zielname im data-value-Attribut") statt Literal-Attributsyntax; Scan danach sauber (139 Vorkommen, 130 eindeutige Namen, 0 fehlende data-value)
- **Files modified:** `core/constants.js`
- **Verification:** `grep -n 'data-action="call"' core/constants.js` liefert keinen Treffer mehr; Abgleichs-Testfall grün
- **Committed in:** `fbb1864` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 Bug)
**Impact on plan:** Selbstverursachter Fund innerhalb desselben Tasks korrigiert, bevor er in einen Commit gelangte, der die Whitelist-Vollständigkeit verfälscht hätte. Kein Scope-Creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SEC-03 (erste Hälfte, Erfolgskriterium 1 der Phase) vollständig erfüllt: `call`-Aktion nur noch über Whitelist erreichbar, Vollständigkeit test-gesichert, Fehlerpfad hinter `DEBUG_MODE`
- Der Fehlerpfad in `ui/actions/ui-actions.js` fällt bewusst nicht zusätzlich unter MAINT-06 (Plan 13-08) — Kommentare der Datei enthalten keine Konsolen-Methodennamen mehr
- Volle Suiten grün: Jest 916/916 (32 Suites, inkl. der 8 neuen Tests), Playwright `workflows.spec.js` 10/10, `python build.py` Exit 0
- Die offene Kanten-Annahme aus dem Plan (SEC-03, Probe-Kategorie `unclassified`) bleibt bewusst unresolved — wie im Plan dokumentiert, keine automatische Auflösung in diesem Durchlauf versucht

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*
