---
phase: 12-datensicherheit
plan: 13
subsystem: undo
tags: [undo-redo, jest, vm-context, gap-closure, sec-02, test-failing]

# Dependency graph
requires:
  - phase: 12-datensicherheit (Plan 05)
    provides: pushUndo()/undo()/redo() Peek-Parse-Pop + Push-Validierung (D-06), den vm-Kontext-Testblock und __undoDebug()
  - phase: 12-datensicherheit (Plan 11)
    provides: WR-02-Fix (Redo-Stack-Leerung im pushUndo()-catch-Zweig) — Voraussetzung für den vollständigen Quellstand dieses Plans
provides:
  - "SEC-02 geschlossen: undo() serialisiert den aktuellen Stand vor dem Redo-Push jetzt geschützt (try/catch nach dem Vorbild von pushUndo()) — ein gescheiterter Push wirft beim nächsten Strg+Z keinen ungefangenen TypeError mehr"
  - "Dieselbe Absicherung spiegelbildlich in redo() vor dem Undo-Push"
  - "test.failing-Zeitbombe 'R11-Rest' entschärft: auf test() umgestellt, weil der Fix sie zum unerwartet bestandenen Test gemacht hätte"
  - "Richtungs-Invariante als Tabelle: dieselbe Regel gilt für undo() und redo(), geprüft als zwei gemeldete Fälle statt zweier abgeschriebener Testkörper"
affects: []

# Actuals (#2632)
actuals:
  tokens: 1450
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Geschützte Serialisierung VOR jeder Stack-Mutation, NACH dem erfolgreichen Parse — derselbe try/catch-Rahmen wie in pushUndo(), damit die Datei genau eine Art hat, mit einem nicht serialisierbaren window.D umzugehen (Push wie Pop)"
    - "Schlüsselvergleich statt Tiefenvergleich für ein zirkulär gemachtes window.D in Tests — ein Tiefenvergleich scheitert an der Zirkularität selbst"

key-files:
  created: []
  modified:
    - systems/undo.js
    - tests/unit/stability.test.js

key-decisions:
  - "Bewusste Nebenwirkung (Consequence Note aus dem Plan, wortgetreu übernommen): der Fix bricht undo()/redo() bei nicht serialisierbarem D ab, statt den Wechsel ohne Redo/Undo-Eintrag durchzuführen. Ein 'halb ausgeführter' Wechsel würde den aktuellen Stand unwiederbringlich verlieren — das ist schlimmer als ein verweigertes Tastenkürzel mit Warnung."
  - "test.failing → test() ist Teil des Fixes, keine Testanpassung an eine kaputte Implementierung: die Annotation bedeutete 'dieser Test MUSS werfen' und war nur deshalb grün, WEIL undo() vor dem Fix ungeschützt war. Mit dem Fix hätte Jest den Test als unerwartet bestanden gemeldet und die Suite wäre rot gegangen — die Umstellung zündet diese bewusst gesetzte Zeitbombe, statt sie zu entschärfen, indem man sie stehen lässt."
  - "Genau eine Serialisierung pro Aufruf: die vorbereitete Variable (redoStateJSON in undo(), undoStateJSON in redo()) wird im Push wiederverwendet statt ein zweites Mal JSON.stringify(D) aufzurufen — sonst könnte die zweite Serialisierung scheitern, nachdem die erste bereits durchlief."

requirements-completed: [SAFE-05]

coverage:
  - id: D1
    description: "Nach gescheitertem Push wirft undo() nicht mehr und lässt beide Stacks unverändert"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Nachzug R11 — pushUndo()-Schutz haelt auch in den Randlagen von APP_CONFIG > R11-Rest: nach gescheitertem Push kippt das naechste undo() nicht in einen ungefangenen TypeError"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dasselbe gilt für redo()"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Nachzug R11 — pushUndo()-Schutz haelt auch in den Randlagen von APP_CONFIG > SEC-02: nach gescheitertem Push kippt das naechste redo() nicht in einen ungefangenen TypeError"
        status: pass
    human_judgment: false
  - id: D3
    description: "Bei einem Fehlschlag erscheint ein Warn-Toast statt einer stillen Ausnahme"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js — beide obigen Tests prüfen showToast(expect.any(String), 'warning') zusätzlich zur Wurf-Freiheit und den unveränderten Stacks"
        status: pass
    human_judgment: false
  - id: D4
    description: "Richtungs-Invariante: dieselbe Regel gilt für beide Wege, geprüft als Tabelle"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "npx jest tests/unit/stability.test.js -t \"Invariante\" — 2 passed (SEC-02 Invariante (undo), SEC-02 Invariante (redo))"
        status: pass
    human_judgment: false
  - id: D5
    description: "Mutationsnachweis: bei entferntem Wächter fällt genau die zugehörige Richtung um"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "Guard in undo() testweise entfernt → npx jest -t \"R11\" und -t \"Invariante\": jeweils genau der undo-Fall fällt (TypeError: Converting circular structure to JSON), der redo-Fall bleibt grün. Guard in redo() testweise entfernt → npx jest -t \"SEC-02\": genau der redo-Fall fällt. Beide Male zurückgenommen, danach wieder 878/878 grün."
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-05
status: complete
---

# Phase 12 Plan 13: SEC-02 — undo()/redo() serialisieren geschützt Summary

**`undo()` und `redo()` sichern den aktuellen Stand jetzt in try/catch (wie `pushUndo()`), bevor sie den jeweils anderen Stack verändern — ein nicht serialisierbares `window.D` löst beim nächsten Strg+Z/Strg+Y einen Warn-Toast statt einer ungefangenen `TypeError`-Ausnahme aus.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-05
- **Completed:** 2026-09-05T10:36:27Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- `undo()` (`systems/undo.js`) serialisiert den aktuellen Stand vor dem Redo-Push jetzt geschützt: try/catch, Warn-Toast bei Fehlschlag, Abbruch ohne Stack-Mutation, `ErrorHandler.log` nur bei `DEBUG_MODE`.
- `redo()` bekommt spiegelbildlich denselben Schutz vor dem Undo-Push.
- Die verankerte `test.failing`-Zeitbombe „R11-Rest" ist auf `test()` umgestellt und um Stack-/Toast-Nachweise erweitert — der erklärende Kommentar darüber beschreibt jetzt den Schutz statt des Defekts.
- Neuer Spiegeltest für `redo()` und ein tabellengetriebener Invarianten-Test über beide Richtungen (`SEC-02 Invariante (undo)` / `SEC-02 Invariante (redo)`) verankern die Regel dauerhaft, nicht nur die zwei Fundstellen.
- Volle Jest-Suite: 878/878 grün (Basislinie 875 + 3 neue Tests), keine Regression.

## Task Commits

Each task was committed atomically:

1. **Task 1: undo() serialisiert geschützt — und der verankerte test.failing wird zu test()** - `03b3426` (fix)
2. **Task 2: redo() bekommt denselben Schutz — die spiegelbildliche Stelle** - `01e96e4` (fix)
3. **Task 3: Die Richtungs-Invariante — gleiche Regel für beide Wege, geprüft als Tabelle** - `81e004e` (test)

**Plan metadata:** committed alongside this SUMMARY.

## Files Created/Modified
- `systems/undo.js` - `undo()` (vormals Zeile 69) und `redo()` (vormals Zeile 108) serialisieren den aktuellen Stand jetzt geschützt vor jeder Stack-Mutation; ausschließlich diese zwei Stellen erweitert (bestätigt per `git diff systems/undo.js`)
- `tests/unit/stability.test.js` - `test.failing` → `test()` für „R11-Rest" plus zwei zusätzliche Zusicherungen (Stacklängen, Warn-Toast); neuer Spiegeltest `SEC-02` für `redo()`; neuer tabellengetriebener Invarianten-Test über beide Richtungen

## Decisions Made
- Abbruch statt teilweiser Ausführung bei gescheiterter Serialisierung (siehe `key-decisions` in der Frontmatter — wortgetreue Übernahme der `<consequence_note>` des Plans).
- `test.failing` → `test()` ist Teil des Fixes, keine nachträgliche Testanpassung.
- Genau eine Serialisierung pro Aufruf (Variable wiederverwendet statt zweitem `JSON.stringify(D)`).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Mutationsnachweise (protokolliert wie in `<action>` gefordert)

**Task 1 (undo()):** Guard testweise entfernt (direktes `JSON.stringify(D)` im Redo-Push) → `npx jest tests/unit/stability.test.js -t "R11"` meldet `R11-Rest` als fehlgeschlagen mit `TypeError: Converting circular structure to JSON ... property 'self' closes the circle` an `Object.undo`. Guard wiederhergestellt → wieder grün (86/86 in der Datei zu diesem Zeitpunkt).

**Task 2 (redo()):** Guard testweise entfernt → `npx jest tests/unit/stability.test.js -t "SEC-02"` meldet den Spiegeltest als fehlgeschlagen mit demselben `TypeError` an `Object.redo`. Guard wiederhergestellt → wieder grün (87/87 zu diesem Zeitpunkt).

**Task 3 (Invariante):** Guard in `undo()` testweise entfernt → `npx jest tests/unit/stability.test.js -t "Invariante"` meldet exakt `SEC-02 Invariante (undo)` als fehlgeschlagen, `SEC-02 Invariante (redo)` bleibt grün — belegt, dass die Tabelle wirklich zwei unabhängige Fälle prüft und nicht zweimal denselben. Guard wiederhergestellt → `git diff --stat systems/undo.js` leer (Datei entspricht wieder exakt dem committeten Stand), volle Suite 878/878 grün.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SEC-02 geschlossen. Von den vier Welle-9-Plänen (12-12, 12-13, 12-14, 12-15) ist dies der letzte offene — Welle 10 (Plan 12-16, WR-03 + SEC-05/SEC-06) ist damit entsperrt.
- `dist/`-Neubau und volle Suiten (Playwright, pytest, build.py) bleiben bewusst Plan 12-17 vorbehalten (Scope Fence dieses Plans).

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-05*

## Self-Check: PASSED

- `[ -f systems/undo.js ]` → FOUND
- Commit `03b3426` (Task 1) → FOUND
- Commit `01e96e4` (Task 2) → FOUND
- Commit `81e004e` (Task 3) → FOUND
- Full suite: `npx jest` → 878 passed / 878 total (baseline 875 + 3 new tests)
