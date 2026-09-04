---
phase: 12-datensicherheit
plan: 09
subsystem: migration
tags: [migration-wizard, tdd, jest, vm-context, xss-safe, gap-closure]

# Dependency graph
requires:
  - phase: 12-datensicherheit (Plan 02)
    provides: den Migrations-Wizard selbst (showMigrationWizard, _processWizardFile, _setupWizardActions) und dessen Testdatei
provides:
  - "CR-01 geschlossen: wizard-skip nimmt ab Schritt 4 denselben window.location.reload()-Pfad wie wizard-close, statt den stale In-Memory-D per beforeunload-Autosave ueber die frisch importierten Daten zurueckschreiben zu lassen"
  - "Footer mit dem Ueberspringen-Button ist ab Schritt 4 unsichtbar (id=migration-wizard-footer, geschaltet in showWizardStep())"
  - "WR-01 geschlossen: eine Audio-Export-Datei in der Haupt-Dropzone markiert jetzt die tatsaechliche Audio-Dropzone als file-ready (mit Rueckfall auf die Haupt-Dropzone, falls das Element fehlt)"
affects: [12-11]

# Actuals (#2632)
actuals:
  tokens: 9800
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Vor jedem Fix ein FRISCHES Attrappen-Modal je Test bauen (dataset/addEventListener/querySelectorAll/querySelector), damit der modal.dataset.actionsBound-Guard in _setupWizardActions() den Klick-Handler nicht leer laufen laesst — sonst ist der Test ohne Bindung an den echten Handler gruen (T-12-31)"
    - "Reload-Beobachtbarkeit via window.location = { protocol, reload: jest.fn() } im describe-lokalen beforeEach, das NACH dem globalen beforeEach laeuft und dessen reload-lose location ueberschreibt"

key-files:
  created: []
  modified:
    - systems/migration/migration-wizard.js
    - tests/unit/migration-wizard.test.js

key-decisions:
  - "Schwelle _wizardStep >= 4 statt === 4 fuer sowohl den Reload-Zweig als auch die Footer-Ausblendung — ein kuenftiger Schritt 5 darf den Button nicht versehentlich wieder einblenden (Plan-Vorgabe, nicht eigenstaendig entschieden)"
  - "T-12-34 (Skip stellt den Wizard nach Import stumm, reopen-migration-wizard nicht beworben) bewusst NICHT behoben — deskriptorloses Verbot in must_haves.prohibitions, damit es sichtbar unverifiziert bleibt statt als erledigt zu gelten"

requirements-completed: [SAFE-01]

coverage:
  - id: D1
    description: "Klick auf wizard-skip nach abgeschlossenem _processWizardFile()-Import loest window.location.reload() aus"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#_setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01) > CR-01 Test A"
        status: pass
    human_judgment: false
  - id: D2
    description: "Klick auf wizard-skip vor dem Import (Schritt 2) loest keinen Reload aus und setzt weiterhin skipped: true"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#_setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01) > CR-01 Test B (Gegenprobe vor dem Import)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Der Wizard-Footer ist auf Schritt 3 sichtbar und ab Schritt 4 ausgeblendet"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#_setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01) > CR-01 Test C"
        status: pass
    human_judgment: false
  - id: D4
    description: "Eine Audio-Export-Datei in der Haupt-Dropzone markiert die Audio-Dropzone als file-ready; fehlt sie, greift der Rueckfall ohne Wurf"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#_processWizardFile() — Audio-Export-Datei in der Haupt-Dropzone (WR-01, SAFE-01) > WR-01 Test D"
        status: pass
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#_processWizardFile() — Audio-Export-Datei in der Haupt-Dropzone (WR-01, SAFE-01) > WR-01 Test E (der Rueckfall)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Mutationsnachweis: bei wirkungslosem Reload-Zweig faellt der benannte Test um"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#_setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01) > CR-01 Test A (Mutation: _wizardStep >= 999 statt >= 4)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-04
status: complete
---

# Phase 12 Plan 09: CR-01 (Migrations-Skip nach Import) + WR-01 (Audio-Feedback-Element) Summary

**wizard-skip nimmt ab Schritt 4 denselben reload()-Pfad wie wizard-close, Footer verschwindet dort — der beforeunload-Autosave kann frisch importierte Daten nicht mehr rückstandslos überschreiben.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-09-04
- **Completed:** 2026-09-04
- **Tasks:** 3
- **Files modified:** 2 (`systems/migration/migration-wizard.js`, `tests/unit/migration-wizard.test.js`)

## Accomplishments

- CR-01 geschlossen (12-VERIFICATION.md `gaps[0]`, Truth 7 FAILED): `wizard-skip` prüft jetzt `_wizardStep >= 4` und ruft in diesem Fall `window.location.reload()` auf, genau wie `wizard-close`/`wizard-setup-backup` — der unbedingte `beforeunload`-Autosave in `systems/avatars.js:170-176` kann das stale In-Memory-`D` danach nicht mehr über die frisch importierten Daten zurückschreiben.
- Der Footer mit dem „Überspringen"-Button trägt `id="migration-wizard-footer"` und wird in `showWizardStep(n)` ab `n >= 4` per `style.display = 'none'` ausgeblendet — der Button ist auf der Erfolgsbestätigung gar nicht mehr klickbar. Vor Schritt 4 verhält sich „Überspringen" unverändert (kein unmotivierter Reload, Test B bestätigt das als Gegenprobe).
- WR-01 geschlossen (12-REVIEW.md): `_processWizardFile()` löst die tatsächliche Audio-Dropzone über `document.getElementById('migration-wizard-audio-dropzone')` auf und reicht sie an `_processWizardAudioFile()` weiter, statt der Haupt-Dropzone — die Text-Rückmeldung und `.file-ready` erscheinen jetzt am selben Element. Rückfall auf die übergebene Haupt-Dropzone, falls das Audio-Element fehlt (kein Wurf, D-02-Prinzip bleibt gewahrt).
- Fünf neue Regressionstests (`CR-01` Test A/B/C, `WR-01` Test D/E) in `tests/unit/migration-wizard.test.js`, alle mit Kennung im Testnamen für gezielte `-t`-Filterung. Testzahl der Datei: 41 → 46 (+5).

## Task Commits

Jeder Task ist einzeln committet, Task 1 und Task 3 folgen dem RED-GREEN-Muster (TDD):

1. **Task 1: Roter Durchstich CR-01** — `084722e` (test) — Test A und Test C rot, Test B (Gegenprobe) bereits grün
2. **Task 2: Der Fix (CR-01)** — `740224e` (fix) — Reload-Zweig + Footer-Ausblendung, Mutationsnachweis protokolliert
3. **Task 3, Schritt 1: Roter Durchstich WR-01** — `37adabf` (test) — Test D rot, Test E bereits grün
4. **Task 3, Schritt 2: Der Fix (WR-01)** — `73fc1fc` (fix) — Audio-Dropzone-Auflösung mit Rückfall

**Plan metadata:** (folgt in diesem Commit)

## Files Created/Modified

- `systems/migration/migration-wizard.js` — Footer-Id + Ausblendung in `showWizardStep()`, Reload-Zweig in `_setupWizardActions()`s `wizard-skip`-Handler, Audio-Dropzone-Auflösung in `_processWizardFile()`
- `tests/unit/migration-wizard.test.js` — zwei neue `describe`-Blöcke: `_setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01)` (3 Tests) und `_processWizardFile() — Audio-Export-Datei in der Haupt-Dropzone (WR-01, SAFE-01)` (2 Tests)

## Decisions Made

- Schwelle `_wizardStep >= 4` statt `=== 4` für Reload-Zweig UND Footer-Ausblendung (Plan-Vorgabe): ein künftiger Schritt 5 darf den Button nicht versehentlich wieder einblenden bzw. den Reload-Schutz verlieren.
- T-12-34 (Skip stellt den Wizard nach einem Import dauerhaft stumm, `reopen-migration-wizard` ist dem Nutzer nicht beworben) bleibt bewusst offen — als deskriptorloses `must_haves.prohibitions`-Verbot geführt, nicht stillschweigend fallen gelassen. Nach diesem Fix ist der Fall entschärft: nach einem Import wird ohnehin neu geladen.

## Deviations from Plan

None — plan executed exactly as written. Beide Fixes entsprechen wörtlich dem im `12-REVIEW.md` vorgeschlagenen Patch; die Test-Attrappen-Konstruktion (frisches Modal je Test, `window.location.reload` als `jest.fn()`) folgt der im Plan vorgegebenen Anleitung.

## Protokollierter Rot-Lauf (Task 1, Schritt 5)

Kommando: `npx jest tests/unit/migration-wizard.test.js -t "CR-01"`

```
● _setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01) › CR-01 Test A: Skip-Klick NACH abgeschlossenem _processWizardFile()-Import loest window.location.reload() aus
  expect(jest.fn()).toHaveBeenCalledTimes(expected)
  Expected number of calls: 1
  Received number of calls: 0

● _setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01) › CR-01 Test C: Wizard-Footer ist auf Schritt 3 sichtbar und ab Schritt 4 ausgeblendet
  expect(received).toBe(expected)
  Expected: "none"
  Received: ""

Tests: 2 failed, 41 skipped, 1 passed, 44 total
```

(Test B — die Gegenprobe — war unter demselben Filter bereits grün; separat mit `-t "vor dem Import"` bestätigt: `Tests: 43 skipped, 1 passed, 44 total`, Exit-Code 0.)

## Protokollierter Rot-Lauf (Task 3, Schritt 1)

Kommando: `npx jest tests/unit/migration-wizard.test.js -t "WR-01"`

```
● _processWizardFile() — Audio-Export-Datei in der Haupt-Dropzone (WR-01, SAFE-01) › WR-01 Test D: Audio-Datei in der Haupt-Dropzone markiert die AUDIO-Dropzone als file-ready, nicht die Haupt-Dropzone
  expect(jest.fn()).toHaveBeenCalledWith(...expected)
  Expected: "file-ready"
  Number of calls: 0

Tests: 1 failed, 44 skipped, 1 passed, 46 total
```

(Test E — der Rückfall — war bereits vor dem Fix grün, da er nur den bestehenden Haupt-Dropzone-Pfad prüft.)

## Mutationsnachweis (Task 2, Schritt 4)

`_wizardStep >= 4` testweise auf `_wizardStep >= 999` gesetzt (Reload-Zweig damit unerreichbar), Verify-Kommando erneut gelaufen:

```
● _setupWizardActions() — wizard-skip nach Schritt 4 (CR-01, SAFE-01) › CR-01 Test A: ...
  Expected number of calls: 1
  Received number of calls: 0
Tests: 1 failed, 41 skipped, 2 passed, 44 total
```

Test A fällt erwartungsgemäß um, Test B und Test C bleiben unberührt (Test C hängt an der Footer-Bedingung, nicht am Reload-Zweig; Test B prüft explizit das Ausbleiben des Reloads). Mutation zurückgenommen, Suite erneut grün: `Tests: 44 passed, 44 total`.

## Gemessene Testzahl gegen Baseline

- Baseline (2026-09-04, vor diesem Plan): **41 passed**
- Nach Task 2 (CR-01-Fix): **44 passed** (41 + 3 neue)
- Nach Task 3 (WR-01-Fix): **46 passed** (44 + 2 neue) — erfüllt die Mindestanforderung aus der Plan-`<verification>`

## Issues Encountered

- Beim ersten Entwurf des Modal-Attrappen für Test A/B warf `_closeWizard()` einen `TypeError: Cannot set properties of undefined (setting 'display')`, weil das Attrappen-Modal kein `style`-Objekt trug — der Vor-Fix-Pfad ruft `_closeWizard()` auf, das `modal.style.display = 'none'` setzt. Behoben durch `style: {}` im Modal-Stub, danach schlugen Test A/B mit den beabsichtigten Assertion-Fehlern (nicht mehr mit einem TypeError) fehl — der rote Lauf misst jetzt tatsächlich den Befund, nicht ein Test-Setup-Problem.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CR-01 und WR-01 sind geschlossen; Plan 12-10 (CR-02, disjunkte Datei `file-backup-manager.js`) und Plan 12-11 (WR-02 + Rebuild beider `dist/`-Bundles, Welle 8) folgen unverändert dem in `STATE.md` festgehaltenen Fahrplan.
- **Nicht durch diesen Plan erledigt:** der offene menschliche Prüfpunkt aus `12-VERIFICATION.md` (`human_verification`) — eine echte Audio-Bibliothek knapp unter 300 MiB im echten Browser-Tab (Recherche-Annahme A1). Er wird nach den Fixes dieser Runde (12-09/12-10/12-11) erneut fällig und ist nicht Gegenstand dieses Plans.
- **Bewusst offen belassen (T-12-34):** ein Skip nach einem abgeschlossenen Import stellt den Wizard weiterhin dauerhaft stumm (`migration-wizard-shown: {skipped:true}` verhindert das automatische Wiedererscheinen); der Rückweg über `reopen-migration-wizard` existiert, ist dem Nutzer aber nicht angezeigt. Als deskriptorloses Verbot in der Plan-Frontmatter geführt — nach diesem Fix ist der Fall entschärft, weil nach einem Import ohnehin neu geladen wird, aber der Zugang bleibt unbeworben.
- `dist/dnd-tracker-bundled.html` und `dist/dnd-tracker-optimized.html` sind NICHT neu gebaut — das ist laut Plan-`<verification>` und `STATE.md` bewusst Plan 12-11, Task 3 vorbehalten (Rebuild nach allen drei Gap-Closure-Fixes dieser Runde).

## Self-Check: PASSED

- FOUND: `systems/migration/migration-wizard.js`
- FOUND: `tests/unit/migration-wizard.test.js`
- FOUND: `.planning/phases/12-datensicherheit/12-09-SUMMARY.md`
- FOUND commit `084722e` (Task 1, RED)
- FOUND commit `740224e` (Task 2, GREEN)
- FOUND commit `37adabf` (Task 3, RED)
- FOUND commit `73fc1fc` (Task 3, GREEN)
- `npx jest tests/unit/migration-wizard.test.js`: 46 passed, 46 total
- `node --check systems/migration/migration-wizard.js`: no findings

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-04*
