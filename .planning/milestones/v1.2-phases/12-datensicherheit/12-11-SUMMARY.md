---
phase: 12-datensicherheit
plan: 11
subsystem: undo
tags: [undo-redo, jest, vm-context, gap-closure, wr-02, build, rebuild]

# Dependency graph
requires:
  - phase: 12-datensicherheit (Plan 05)
    provides: pushUndo()/undo()/redo() Peek-Parse-Pop + Push-Validierung, den bestehenden vm-Kontext-Testblock und dessen drei Pruefhaken (__undoDebug/__pushRawUndo/__pushRawRedo)
  - phase: 12-datensicherheit (Plan 09)
    provides: CR-01/WR-01-Fixes in migration-wizard.js — Voraussetzung fuer den vollstaendigen Quellstand dieses Plans
  - phase: 12-datensicherheit (Plan 10)
    provides: CR-02-Fix in file-backup-manager.js — Voraussetzung fuer den vollstaendigen Quellstand dieses Plans
provides:
  - "WR-02 geschlossen: pushUndo() leert den Redo-Stack jetzt auch im catch-Zweig, NACH dem Warn-Toast, VOR dem return — ein spaeteres Redo kann keine Zwischenaktion mehr stillschweigend ueberschreiben"
  - "Beide dist-Bundles aus dem vollstaendigen Quellstand aller drei Plaene dieser Runde (12-09/12-10/12-11) neu gebaut — W-1 (veraltetes Bundle) wiederholt sich nicht"
  - "Vier volle Suiten (Jest/pytest/build.py x2/Playwright) ueber der am 2026-09-04 gemessenen Basislinie bestaetigt"
affects: []

# Actuals (#2632)
actuals:
  tokens: 935
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Redo-Eintrag im Test aus einem ECHTEN realUndo()-Lauf erzeugen, nicht per __pushRawRedo() von Hand hinlegen — sonst prueft der Test eine Laborsituation statt der echten Bedienfolge (Aktion, Undo, weitere Aktion, gescheiterter Push)"

key-files:
  created: []
  modified:
    - systems/undo.js
    - tests/unit/stability.test.js

key-decisions:
  - "redoStack.length = 0 steht NACH dem showToast()-Aufruf im catch-Zweig, nicht davor — der Toast ist die einzige Rueckmeldung an den Nutzer und darf durch nichts verdraengt werden (Plan-Vorgabe, wortgetreu umgesetzt)"

requirements-completed: [SAFE-05]

coverage:
  - id: D1
    description: "Nach Aktion → Undo → nicht serialisierbarem D → pushUndo() ist der Redo-Stack leer"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Undo/Redo — Peek-Parse-Pop, Push-Validierung, Hooks (12-05 / D-06 / SAFE-05) > WR-02 Test J: Redo nach gescheitertem Push (nicht serialisierbares D) ist geleert, nicht der veraltete Eintrag"
        status: pass
    human_judgment: false
  - id: D2
    description: "pushUndo() wirft im Fehlerfall nicht, der Aufrufer läuft weiter, kein Eintrag landet auf dem Undo-Stack, der Warn-Toast erscheint"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Undo/Redo — Peek-Parse-Pop, Push-Validierung, Hooks (12-05 / D-06 / SAFE-05) > WR-02 Test K: pushUndo() wirft bei nicht serialisierbarem D weiterhin nicht, der Aufrufer läuft weiter, der Warn-Toast erscheint"
        status: pass
    human_judgment: false
  - id: D3
    description: "Mutationsnachweis: bei entferntem Leeren im catch-Zweig fällt der benannte Test um"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "npx jest tests/unit/stability.test.js -t \"WR-02\" mit entfernter redoStack.length = 0 im catch-Zweig — WR-02 Test J faellt (Expected: 0, Received: 1), WR-02 Test K bleibt gruen"
        status: pass
    human_judgment: false
  - id: D4
    description: "Volle Suiten über der Basislinie und beide dist-Bundles aus dem vollständigen Quellstand"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "npx jest — 760 passed / 29 Suiten (Basislinie 749)"
        status: pass
      - kind: integration
        ref: "python -m pytest tests/build -q — 24 passed (Basislinie 24)"
        status: pass
      - kind: integration
        ref: "PYTHONIOENCODING=utf-8 python build.py und --production — beide [SUCCESS], 124/124 Module, keine Kollisionsmeldung"
        status: pass
      - kind: e2e
        ref: "npx playwright test — 321 passed / 2 skipped, exit 0 (Basislinie 321 passed / 2 skipped)"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-09-04
status: complete
---

# Phase 12 Plan 11: WR-02 (Redo-Stack-Leerung im Fehlerpfad) + Wellenabschluss Summary

**`pushUndo()`s `catch`-Zweig leert jetzt den Redo-Stack, bevor er zurückkehrt — beide `dist/`-Bundles sind aus dem vollständigen Quellstand aller drei Gap-Closure-Pläne dieser Runde neu gebaut.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-09-04
- **Completed:** 2026-09-04
- **Tasks:** 3
- **Files modified:** 2 (`systems/undo.js`, `tests/unit/stability.test.js`)

## Accomplishments

- WR-02 geschlossen (`12-VERIFICATION.md` `warnings`, `12-REVIEW.md`): Schlägt `JSON.stringify(window.D)` in `pushUndo()` fehl (z. B. zirkuläre Referenz), leert die Funktion jetzt den Redo-Stack im `catch`-Zweig, NACH dem bestehenden `ErrorHandler.log`/`showToast`-Aufruf, VOR dem `return`. Ein späteres Redo kann eine Zwischenaktion, die nach dem gescheiterten Push lief, nicht mehr stillschweigend überschreiben.
- Der Erfolgspfad von `pushUndo()` ist byte-identisch unverändert: `undoStack.push(...)`, `UNDO_LIMIT`-Kappung, abschließendes Leeren des Redo-Stacks.
- `pushUndo()` wirft weiterhin nicht und blockiert den Aufrufer nicht (D-06, „am Spieltisch nie blockieren") — bestätigt durch Test K, der vor UND nach dem Fix grün ist.
- Zwei neue Regressionstests (Test J, Test K) im bestehenden `describe('Undo/Redo — Peek-Parse-Pop, Push-Validierung, Hooks (12-05 / D-06 / SAFE-05)')`-Block; beide mit Kennung `WR-02` im Namen. Test J erzeugt den Redo-Eintrag über einen echten `realUndo()`-Lauf, nicht über `__pushRawRedo()`. Testzahl der Datei: 73 → 75.
- Beide ausgelieferten Bundles (`dist/dnd-tracker-bundled.html`, `dist/dnd-tracker-optimized.html`) sind NACH allen drei Plänen dieser Runde (12-09, 12-10, 12-11) neu gebaut — die W-1-Lehre (acht Tage altes Produktions-Bundle ohne vier Plan-Fixes) wiederholt sich hier nicht.
- Alle vier Suiten liegen auf oder über der am 2026-09-04 gemessenen Basislinie: Jest 760 passed / 29 Suiten (Basislinie 749), `pytest tests/build` 24 passed (Basislinie 24), beide `build.py`-Läufe 124/124 Module ohne Kollisionsmeldung, Playwright 321 passed / 2 skipped bei Exit-Code 0 (Basislinie identisch).

## Task Commits

Jeder Task mit Produktionswirkung ist einzeln committet, Task 1/2 folgen dem RED-GREEN-Muster (TDD); Task 3 ist reine Verifikation + Rebuild ohne Quellcode-Änderung, deshalb ohne eigenen Task-Commit (`dist/` ist Build-Ausgabe, `.gitignore`d):

1. **Task 1: Roter Test WR-02** — `0a62424` (test) — Test J rot, Test K bereits grün
2. **Task 2: Der Fix** — `2260af3` (fix) — Redo-Stack-Leerung im catch-Zweig, Mutationsnachweis protokolliert
3. **Task 3: Volle Suiten + beide Bundle-Rebuilds** — kein neuer Commit (Verifikation + `dist/`-Rebuild, `dist/` nicht versioniert)

**Plan metadata:** (folgt in diesem Commit)

## Files Created/Modified

- `systems/undo.js` — `pushUndo()`s `catch`-Zweig leert `redoStack` vor dem `return` (5 neue Zeilen, davon 4 erläuternder Kommentar + 1 Codezeile)
- `tests/unit/stability.test.js` — zwei neue Tests (`WR-02 Test J`, `WR-02 Test K`) im bestehenden `Undo/Redo`-`describe`-Block

## Decisions Made

- `redoStack.length = 0` steht NACH dem `showToast()`-Aufruf, nicht davor — der Toast ist die einzige Rückmeldung an den Nutzer, dass dieser eine Schritt ohne Undo-Schutz lief, und darf durch nichts verdrängt werden. Wortgetreue Umsetzung der Plan-Vorgabe, keine eigenständige Abweichung.

## Deviations from Plan

None - plan executed exactly as written.

## Protokollierter Rot-Lauf (Task 1, Schritt 4)

Kommando: `npx jest tests/unit/stability.test.js -t "WR-02"`

```
● Data Integrity › Undo/Redo — Peek-Parse-Pop, Push-Validierung, Hooks (12-05 / D-06 / SAFE-05) › WR-02 Test J: Redo nach gescheitertem Push (nicht serialisierbares D) ist geleert, nicht der veraltete Eintrag

  expect(received).toBe(expected) // Object.is equality
  Expected: 0
  Received: 1

    at Object.toBe (tests/unit/stability.test.js:1415:43)

Tests:       1 failed, 73 skipped, 1 passed, 75 total
```

Test K (`WR-02 Test K`) war unter demselben Filter bereits grün. Zweites Verify-Kommando (`-t "Push-Validierung"`) bestätigt: alle fünf bestehenden Tests des `describe`-Blocks bleiben grün, nur Test J ist rot — `Tests: 1 failed, 63 skipped, 11 passed, 75 total`.

## Mutationsnachweis (Task 2, Schritt "Mutationsnachweis")

`redoStack.length = 0;` im `catch`-Zweig testweise entfernt, `npx jest tests/unit/stability.test.js -t "WR-02"` erneut gelaufen:

```
● WR-02 Test J: Redo nach gescheitertem Push (nicht serialisierbares D) ist geleert, nicht der veraltete Eintrag
  Expected: 0
  Received: 1

Tests:       1 failed, 73 skipped, 1 passed, 75 total
```

Test J fällt erwartungsgemäß um, Test K bleibt grün (er prüft den Aufrufer/Toast, nicht den Redo-Stack-Zustand). Mutation zurückgenommen, `node --check systems/undo.js` ohne Befund, Suite erneut grün: `Tests: 75 passed, 75 total`.

## Gemessene Suiten-Zahlen gegen Basislinie (Task 3)

| Suite | Basislinie (2026-09-04, vor dieser Runde) | Nach 12-09/12-10/12-11 | Ergebnis |
|---|---|---|---|
| `npx jest tests/unit/stability.test.js` | 73 passed | **75 passed** (+2 aus diesem Plan) | ✓ |
| `npx jest` (volle Suite) | 749 passed / 29 Suiten | **760 passed / 29 Suiten** (+5 aus 12-09, +4 aus 12-10, +2 aus 12-11) | ✓ über Basislinie |
| `python -m pytest tests/build -q` | 24 passed | **24 passed** | ✓ auf Basislinie |
| `python build.py` | 124/124 Module, Exit 0 | **124/124 Module, Exit 0**, `[SUCCESS] Build abgeschlossen! (Development)` | ✓ |
| `python build.py --production` | 124/124 Module, Exit 0 | **124/124 Module, Exit 0**, `[SUCCESS] Build abgeschlossen! (Production)` | ✓ |
| `npx playwright test` | 321 passed / 2 skipped, exit 0 | **321 passed / 2 skipped, exit 0** | ✓ auf Basislinie |

**Zeitstempel-Nachweis** (`ls -la --time-style=full-iso`):

```
dist/dnd-tracker-bundled.html      2026-09-04 15:36:26.488063700 +0200
dist/dnd-tracker-optimized.html    2026-09-04 15:36:30.998613700 +0200
systems/file-backup/file-backup-manager.js  2026-09-04 15:27:49.701975400 +0200
systems/migration/migration-wizard.js       2026-09-04 15:11:43.664411300 +0200
systems/undo.js                             2026-09-04 15:35:45.527061600 +0200
```

Beide Bundles sind jünger als alle drei in dieser Runde geänderten Quelldateien — die Voraussetzung aus `must_haves.truths` ist erfüllt.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- WR-02 ist geschlossen. Zusammen mit 12-09 (CR-01/WR-01) und 12-10 (CR-02) sind alle vier in `12-REVIEW.md`/`12-VERIFICATION.md` gefundenen Befunde dieser Gap-Closure-Runde behoben.
- Beide `dist/`-Bundles tragen den vollständigen Quellstand aller drei Pläne dieser Runde — bereit für eine erneute `/gsd-verify-work`-Runde.
- **Nicht durch diesen Plan erledigt — bewusst offen, kein Task:** der menschliche Prüfpunkt aus `12-VERIFICATION.md` (`human_verification`): eine echte Audio-Bibliothek knapp unter 300 MiB, `dist/dnd-tracker-bundled.html` per Doppelklick geöffnet, Divergenz-Banner, „Audio-Datei herunterladen". Unter Node/jsdom nicht messbar (Recherche-Annahme A1); der Nutzer hat sich am 2026-08-19 bewusst gegen das Zusammentragen der Dateien entschieden. Er wird nach dieser Runde erneut fällig und ist beim nächsten `/gsd-verify-work` vorzulegen — NICHT als erledigt zu behandeln.
- **Hinweis für `REQUIREMENTS.md`:** SAFE-01 und SAFE-02 stehen dort noch mit „✓" aus der Zeit vor dem Code-Review vom 2026-09-04. Nach erfolgreicher Re-Verifikation dieser Runde ist die Traceability-Tabelle nachzuziehen (12-09 bei SAFE-01, 12-10 bei SAFE-02, 12-11 bei SAFE-05 — SAFE-05 war bereits vorher „✓", dieser Plan schließt lediglich die WR-02-Randlücke innerhalb desselben Requirements).

## Self-Check: PASSED

- FOUND: `systems/undo.js`
- FOUND: `tests/unit/stability.test.js`
- FOUND: `.planning/phases/12-datensicherheit/12-11-SUMMARY.md`
- FOUND commit `0a62424` (Task 1, RED)
- FOUND commit `2260af3` (Task 2, GREEN)
- `npx jest tests/unit/stability.test.js`: 75 passed, 75 total
- `npx jest`: 760 passed, 29 Suiten
- `node --check systems/undo.js`: no findings
- `dist/dnd-tracker-bundled.html` und `dist/dnd-tracker-optimized.html` existieren, beide jünger als alle drei geänderten Quelldateien dieser Runde

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-04*
