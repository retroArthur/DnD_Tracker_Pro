---
phase: 12-datensicherheit
plan: 05
subsystem: infra
tags: [undo-redo, data-integrity, vm-runincontext, jest, dead-code-removal]

# Dependency graph
requires:
  - phase: 12-datensicherheit (12-01)
    provides: readCampaignDataForBackup() Quellen-Kette und Backup-Grundlagen
provides:
  - "systems/undo.js: Peek→Parse→Pop-Reihenfolge in undo()/redo() — ein Parse-Fehler lässt beide Stacks unverändert"
  - "systems/undo.js: pushUndo() validiert Serialisierbarkeit vor dem Push (try/catch um JSON.stringify)"
  - "systems/undo.js: registerUndoHook()/_notifyUndoHooks() — Konsument: Plan 12-06"
  - "Vier entfernte autosave-toggle-Fundstellen (persistence.js x2, avatars.js, core/init.js)"
affects: [12-06]

# Actuals (#2632)
actuals:
  tokens: 5880
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "registerUndoHook()/_notifyUndoHooks() nach dem Vorbild von registerPostSaveHook() (systems/spellslots/persistence.js) — explizite Hook-Registrierung statt window.save-artiger Wrapper"
    - "vm.runInContext zum Laden des ECHTEN Quelltexts von systems/undo.js in Tests, isoliert von den globalen Undo/Redo-Mocks aus tests/setup.js (Präzedenz: storage-conflict.test.js, migration.test.js)"

key-files:
  created: []
  modified:
    - systems/undo.js
    - systems/spellslots/persistence.js
    - systems/avatars.js
    - core/init.js
    - tests/unit/stability.test.js

key-decisions:
  - "Push-Validierung (pushUndo) warnt und lässt den Aufrufer weiterlaufen statt zu blockieren — folgt demselben 'nie am Spieltisch blockieren'-Prinzip wie D-02, hier neu für den Undo-Push-Pfad festgelegt"
  - "Ein bereits vorhandener unparsbarer Stack-Eintrag bleibt nach dem Fix dauerhaft liegen (blockiert weitere Undo/Redo-Versuche bis clearUndoHistory()) — bewusst in Kauf genommen als kleineres Übel gegenüber stillem Datenverlust"
  - "Das Aktionslabel wandert beim Umschichten zwischen den Stacks mit (last.action statt fester 'Undo'/'Redo'-Strings) — Voraussetzung für Plan 12-06s Hook-Konsumenten"

patterns-established:
  - "vm.runInContext-Testmuster für Undo/Redo: reale Produktionslogik statt der vereinfachten globalen Mocks aus tests/setup.js testen, wenn genau die Fehlerpfad-Reihenfolge (nicht nur das Endergebnis) bewiesen werden muss"

requirements-completed: [SAFE-05]

coverage:
  - id: D1
    description: "undo()/redo() peeken und parsen VOR dem Stack-Pop — ein Parse-Fehler lässt beide Stacks unverändert"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Parse-Fehler beim Undo lässt Undo- UND Redo-Stack unverändert"
        status: pass
      - kind: unit
        ref: "tests/unit/stability.test.js#Parse-Fehler beim Redo lässt Redo- UND Undo-Stack unverändert"
        status: pass
    human_judgment: false
  - id: D2
    description: "Ein erfolgreicher Undo-Vorgang verschiebt genau einen Eintrag vom Undo- auf den Redo-Stack (und umgekehrt bei Redo)"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Ein erfolgreicher Undo-Vorgang verschiebt genau einen Eintrag vom Undo- auf den Redo-Stack"
        status: pass
    human_judgment: false
  - id: D3
    description: "pushUndo() prüft Serialisierbarkeit vor dem Push — ein zirkuläres window.D erzeugt keinen Stack-Eintrag, wirft nicht, und die aufrufende Operation läuft weiter"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Ein zirkuläres window.D beim Push legt keinen Eintrag an, wirft nicht, Aufrufer läuft weiter"
        status: pass
    human_judgment: false
  - id: D4
    description: "registerUndoHook()/_notifyUndoHooks(): Hooks feuern nach erfolgreichem Undo/Redo mit korrektem Label und Richtung, nie im Fehlerfall; ein werfender Hook bleibt folgenlos; Deduplizierung bei Doppelregistrierung"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#registerUndoHook() (Task 2 — Konsument: Plan 12-06)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Toter autosave-toggle-Codepfad an allen vier Fundstellen entfernt (persistence.js x2, avatars.js, core/init.js) — kritische Saves laufen unbedingt"
    requirement: "SAFE-05"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#Quelltext-Audit: \"autosave-toggle\" kommt in persistence.js, avatars.js, init.js nicht mehr vor"
        status: pass
    human_judgment: false
  - id: D6
    description: "Undo/Redo bleibt in einer echten Browser-Session funktionsfähig (kein Regressionsverdacht durch die Reihenfolgeänderung)"
    verification:
      - kind: e2e
        ref: "tests/e2e/integration/workflows.spec.js#Undo/Redo Workflow › Mehrfaches Undo und Redo funktioniert korrekt"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/welt-story.spec.js#Undo nach Ruf-Änderung stellt alten Wert wieder her"
        status: pass
      - kind: e2e
        ref: "tests/e2e/tab-navigation.spec.js#undo/redo triggers re-render on active tab"
        status: pass
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-08-18
status: complete
---

# Phase 12 Plan 05: Undo-Mechanik-Härtung Summary

**Undo/Redo prüft und parst jetzt VOR dem Stack-Pop statt danach, `pushUndo()` validiert Serialisierbarkeit vor dem Push, `registerUndoHook()` steht bereit, und der tote `autosave-toggle`-Codepfad ist an allen vier Fundstellen entfernt.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-18T21:30Z (im Anschluss an 12-04)
- **Completed:** 2026-08-18T21:41Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- `undo()`/`redo()` peeken und parsen den obersten Stack-Eintrag, bevor irgendein Stack angefasst wird — ein Parse-Fehler lässt beide Stacks unverändert statt den Eintrag zu verlieren (D-06).
- `pushUndo()` hebt `JSON.stringify(window.D)` in ein try/catch: ein nicht serialisierbarer Zustand (z. B. zirkuläre Referenz) landet nicht auf dem Stack, die auslösende Operation läuft aber weiter (Warn-Toast statt Block).
- `registerUndoHook()`/`_notifyUndoHooks()` nach dem Vorbild von `registerPostSaveHook()` ergänzt — Plan 12-06 registriert hier den Hook zum Wiederherstellen gelöschter Audiodateien.
- Vierte, in Recherche und CONTEXT nicht erfasste Fundstelle des toten `autosave-toggle`-Schalters in `core/init.js:44-48` per erneutem Grep gefunden und zusammen mit den drei bekannten Stellen entfernt.
- 12 neue Jest-Tests: 10 verhaltensbasierte Tests gegen den ECHTEN `systems/undo.js`-Quelltext via `vm.runInContext` (isoliert von den vereinfachten globalen Mocks in `tests/setup.js`) + 2 Quelltext-Audit-Tests gegen die Wiedereinführung des toten Schalters.

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Peek-Parse-Pop, Push-Validierung, Undo-Hooks** - `08b6645` (fix)
2. **Task 3: Toten Autosave-Schalter an allen vier Fundstellen entfernen** - `29297f5` (fix)

**Plan metadata:** commit pending (docs: complete plan)

_Note: Tasks 1 and 2 both touch `systems/undo.js` and are tightly coupled (undo()/redo() call `_notifyUndoHooks()` from Task 2), so they landed in a single commit rather than two — see Deviations._

## Files Created/Modified
- `systems/undo.js` - Peek→Parse→Pop in undo()/redo(); Push-Validierung in pushUndo(); registerUndoHook()/_notifyUndoHooks()
- `systems/spellslots/persistence.js` - autosave-toggle-Abfrage in saveImmediate() und save() entfernt
- `systems/avatars.js` - autosave-toggle-Abfrage im beforeunload-Handler entfernt
- `core/init.js` - autosave-toggle-Initialisierung beim Boot entfernt
- `tests/unit/stability.test.js` - 10 vm.runInContext-Tests für die echte Undo/Redo-Logik + 2 Quelltext-Audit-Tests für die Schalter-Entfernung

## Decisions Made

- **Push-Validierung blockiert nicht:** Ein gescheiterter `pushUndo()` (nicht serialisierbares `D`) zeigt einen Warn-Toast und lässt die aufrufende destruktive Operation weiterlaufen, statt sie abzubrechen. Das ist eine Design-Entscheidung dieses Plans, explizit dem D-02-Prinzip "am Spieltisch nie blockieren" folgend, angewandt auf den Undo-Push-Pfad. Der Preis: diese eine Operation läuft ohne Undo-Schutz.
- **Bekannte Nebenwirkung:** Ein bereits vorhandener, unparsbarer Stack-Eintrag bleibt nach dem Fix dauerhaft oben liegen und lässt jeden weiteren Undo-Versuch scheitern, bis `clearUndoHistory()` läuft. Gegenüber dem vorherigen stillen Verschwinden ist das das kleinere Übel — und die neue Push-Validierung verhindert, dass solche Einträge künftig überhaupt entstehen.
- **Aktionslabel wandert mit:** Beim Umschichten zwischen den Stacks wird jetzt `last.action` statt der festen Strings `'Undo'`/`'Redo'` verwendet. Ein repo-weiter Grep vor der Änderung bestätigte, dass kein Konsument außerhalb von `systems/undo.js` auf `undoStack`/`redoStack` zugreift — die Relabelling-Änderung ist damit sicher und notwendig für Plan 12-06s Hook-Konsumenten.
- **Testarchitektur:** Die bestehende `describe('Undo/Redo system')`-Sektion in `stability.test.js` testet die vereinfachten globalen Mocks aus `tests/setup.js` (die gar kein `safeJSONParse` aufrufen). Um die reale Peek→Parse→Pop-Logik tatsächlich zu beweisen, wurde eine neue, isolierte `describe`-Sektion mit `vm.runInContext` ergänzt, die den echten Quelltext von `systems/undo.js` lädt (Präzedenzmuster aus `storage-conflict.test.js`/`migration.test.js`). Zugriff auf die intern `const`-deklarierten `undoStack`/`redoStack`-Arrays erfolgt über kleine, im selben Skript-Scope angehängte Debug-Helferfunktionen (Closures), da `const`/`let` bei `vm.runInContext` — wie bei einem `<script>`-Tag im Browser — keine Eigenschaften des globalen Objekts werden.

## Deviations from Plan

**1. [Rule 4-adjacent, aber nicht architektonisch — pragmatische Commit-Zusammenlegung] Task 1 und Task 2 in einem gemeinsamen Commit statt zwei**
- **Gefunden während:** Commit-Vorbereitung nach Task 2
- **Grund:** Beide Tasks ändern denselben Funktionskörper von `undo()`/`redo()` in `systems/undo.js` — `_notifyUndoHooks()` aus Task 2 wird direkt im Erfolgspfad von `undo()`/`redo()` aus Task 1 aufgerufen. Eine saubere Trennung in zwei unabhängig anwendbare Diffs hätte einen künstlichen Zwischenzustand erfordert (Aufruf einer noch nicht existierenden Funktion), was gegen "jeder Commit ist ein lauffähiger Zustand" verstößt.
- **Entscheidung:** Ein gemeinsamer Commit `08b6645` für Task 1 + Task 2, mit Testabdeckung für beide. Task 3 (Schalter-Entfernung) blieb ein eigener Commit `29297f5`, da unabhängig.
- **Impact:** Kein Verlust an Nachvollziehbarkeit — beide Tasks sind im selben Commit klar in der Nachricht benannt, und die Tests decken beide Verhaltensweisen separat ab.

---

**Total deviations:** 1 (Commit-Granularität, kein Scope-Deviation)
**Impact on plan:** Keine funktionale Abweichung vom Plan. Alle `must_haves` (Peek-Parse-Pop, Push-Validierung, registerUndoHook, vier entfernte Fundstellen) sind erfüllt.

## Issues Encountered

- Die im Plan referenzierte Testtechnik ("dieselbe Technik wie in der bestehenden Sektion", d. h. direktes Schreiben eines `{ action: 'X', state: '{invalid' }`-Eintrags in den Stack) ließ sich gegen die REALE `systems/undo.js`-Implementierung nicht direkt anwenden, weil die bestehende Sektion gegen die globalen `tests/setup.js`-Mocks testet, nicht gegen den echten Quelltext, und `undoStack`/`redoStack` in `undo.js` als `const` deklariert sind (dadurch bei `vm.runInContext` nicht als Eigenschaften des globalen Kontexts erreichbar). Gelöst durch zwei im selben Skript-Compile-Lauf angehängte Debug-Helferfunktionen (`__pushRawUndo`/`__pushRawRedo`/`__undoDebug`), die per Closure Zugriff auf die realen Stack-Arrays haben, ohne den Produktionsquelltext zu verändern.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `registerUndoHook()` ist einsatzbereit für Plan 12-06 (Wiederherstellen gelöschter Audiodateien nach Undo/Redo) — Vertrag: Hook wird mit `{ action, direction: 'undo' | 'redo' }` nach erfolgreicher Wiederherstellung aufgerufen, nie im Fehlerfall, werfende Hooks brechen weder Undo/Redo noch andere Hooks ab.
- Volle Jest-Suite (694/694, +12 gegenüber Baseline 682), pytest (24/24, Baseline gehalten) grün; `python build.py` läuft ohne Duplikat-Fehler durch.
- Playwright-Vollsuite: **319 passed / 2 skipped** — exakt die dokumentierte Baseline, keine Regression durch die Reihenfolgeänderung. Insbesondere die Undo/Redo-relevanten E2E-Tests (`workflows.spec.js` Undo/Redo Workflow, `welt-story.spec.js` Ruf-Undo, `tab-navigation.spec.js` Undo/Redo-Re-Render) sind grün und belegen die Peek-Parse-Pop-Änderung in einer echten Browser-Session.

---
*Phase: 12-datensicherheit*
*Completed: 2026-08-18*

## Self-Check: PASSED

All created/modified files verified present on disk; both task commits (`08b6645`, `29297f5`) verified present in git log.
