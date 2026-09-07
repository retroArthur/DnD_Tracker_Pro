---
phase: 12-datensicherheit
plan: 02
subsystem: data-safety
tags: [migration, audio-export, wizard, chrome-download-policy, user-gesture, jest-vm]

requires:
  - phase: 12-datensicherheit
    provides: "systems/migration/audio-export.js — buildAudioExport/importAudioExport/checkAudioExportFeasible (Plan 12-01)"
provides:
  - "systems/migration/audio-export.js — downloadAudioExport() (Anchor angehaengt/entfernt, ehrliche Rueckmeldung), getAudioExportSummary() (Vorschau fuer den Button), findMissingSceneAudio()"
  - "systems/migration/migration-wizard.js — zweiter, optionaler Audio-Dropzone-Bereich in Schritt 3; expliziter Audio-Download-Button im Divergenz-Banner (Weg B) statt automatischem Zweit-Download"
affects: [12-03-multi-campaign-backup, 12-07-safe-06-restanden]

actuals:
  tokens: 11048
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Kein zweiter automatischer Download aus derselben Nutzergeste — Chrome gated ihn hinter der 'Automatische Downloads'-Berechtigung (besonders restriktiv unter file://). Ein zweiter, expliziter Button-Klick liefert eine eigene Geste."
    - "Anchor-Download-Muster gehaertet: an document.body anhaengen VOR dem Klick, danach entfernen (statt detached zu bleiben)"
    - "Erfolgs-Toasts duerfen nur behaupten, was a.click() tatsaechlich beweist (Angebot), nicht was es nicht garantieren kann (Zustellung)"
    - "Asynchrone Vorschau (getAudioExportSummary()) fuer einen UI-Button: leerer Slot sofort einblenden, Inhalt async nachladen, bei hasContent:false leer bleiben"

key-files:
  created: []
  modified:
    - systems/migration/audio-export.js
    - systems/migration/migration-wizard.js
    - tests/unit/audio-export.test.js

key-decisions:
  - "Weg B (Entscheidung des Entwicklers nach dem Checkpoint-Fund): kein automatischer Zweit-Download mehr. Der Divergenz-Banner bekommt stattdessen einen eigenen, asynchron nachgeladenen Button mit Datei-/Groessenvorschau, dessen Klick eine echte Nutzergeste liefert."
  - "full-export.js hat dieselbe detached-Anchor-Schwaeche wie audio-export.js hatte — bewusst NICHT mitgefixt, ausserhalb des files_modified-Scopes dieses Plans. Siehe 'Follow-up-Fund' unten."
  - "getAudioExportSummary() ist eine reine Zusammensetzung aus checkAudioExportFeasible() + getAllStats() — checkAudioExportFeasible() selbst wurde NICHT veraendert, um die bestehenden Task-3(12-01)-Tests nicht zu beruehren."

patterns-established:
  - "Ein gruener Unit-Test beweist die DATENPFAD-Korrektheit (buildAudioExport() war immer korrekt), nicht die BROWSER-INTERAKTION (Chromes Download-Gate liegt ausserhalb dessen, was ein vm-Test simulieren kann). Menschliche Sichtung im file://-Kontext ist fuer Anchor-Downloads kein optionaler Schritt."

requirements-completed: [SAFE-01]

coverage:
  - id: D1
    description: "downloadAudioExport() erzeugt genau einen Anchor-Download bei gefuellter Bibliothek, keinen bei leerer Bibliothek oder feasible:false"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#downloadAudioExport — Zwei-Datei-Download (SAFE-01)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Anchor wird vor dem Klick an document.body angehaengt und danach entfernt (Checkpoint-Fix)"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#Checkpoint-Fix: der Anchor wird VOR dem Klick an document.body angehaengt und danach entfernt"
        status: pass
    human_judgment: false
  - id: D3
    description: "Erfolgs-Toast behauptet nur 'angeboten', nie mehr unbedingt 'heruntergeladen' (ehrliche Rueckmeldung, Checkpoint-Fix)"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#Checkpoint-Fix (ehrliche Rueckmeldung): Erfolgs-Toast behauptet \"angeboten\", nicht \"heruntergeladen\""
        status: pass
    human_judgment: false
  - id: D4
    description: "startMigrationFlow() loest downloadAudioExport() nicht mehr automatisch aus (Weg B, Checkpoint-Fix)"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#Checkpoint-Fix (Weg B): startMigrationFlow() ruft downloadAudioExport() NICHT mehr automatisch auf"
        status: pass
    human_judgment: false
  - id: D5
    description: "Expliziter Button (download-audio-export-Action im Divergenz-Banner) ruft downloadAudioExport() aus einem echten Klick auf, mit Datei-/Groessenvorschau (getAudioExportSummary()) und ohne Button bei leerer Bibliothek"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#Checkpoint-Fix (Weg B): die download-audio-export-Action ruft downloadAudioExport() aus einem echten Klick auf"
        status: pass
      - kind: unit
        ref: "tests/unit/audio-export.test.js#getAudioExportSummary — Vorschau fuer den expliziten Download-Button (SAFE-01, Weg B)"
        status: pass
    human_judgment: true
    rationale: "Die eigentliche Behauptung — dass Chromes Automatische-Downloads-Sperre durch einen echten Zweitklick tatsaechlich umgangen wird — ist Browser-Verhalten, das kein vm-Test simulieren kann. Nur eine reale file://-Sichtung (Chrome) beweist, dass der Button-Download ankommt."
  - id: D6
    description: "findMissingSceneAudio() benennt Szenen mit unaufloesbaren blobIds; Wizard-Schritt 3 nimmt die Audio-Datei optional entgegen; Hauptimport laeuft ohne sie durch"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#findMissingSceneAudio — benennt Szenen mit unaufloesbaren blobIds (SAFE-01)"
        status: pass
      - kind: unit
        ref: "tests/unit/audio-export.test.js#migration-wizard.js — Quelltext-Belege fuer den zweiten Dropzone-Bereich (SAFE-01)"
        status: pass
    human_judgment: false

duration: ~2h (inkl. Checkpoint-Sichtung und Nachbesserung)
completed: 2026-08-18
status: complete
---

# Phase 12 Plan 02: Audio-Umzug per Zwei-Datei-Export mit explizitem Zweit-Download Summary

**Umzugs-Flow lädt Haupt- und Audio-Export getrennt herunter; der zweite Download läuft nach einem
Checkpoint-Fund über einen expliziten Button statt automatisch, weil Chrome den zweiten
automatischen Download derselben Geste stillschweigend verwirft.**

## Performance

- **Duration:** ~2h (Task 1+2 automatisiert, Task 3 Checkpoint + Nachbesserung manuell verifiziert)
- **Tasks:** 3 Plan-Tasks (davon 1 Checkpoint mit Nachbesserung)
- **Files modified:** 3 (`systems/migration/audio-export.js`, `systems/migration/migration-wizard.js`,
  `tests/unit/audio-export.test.js`)

## Accomplishments

- `downloadAudioExport()` erzeugt eine zweite JSON-Datei mit Audiodateien (Base64) + Würfelstatistik,
  mit Hinweis-Toast vor dem Bauen und stillem Verhalten bei leerer Bibliothek oder Übergröße.
- Wizard-Schritt 3 hat einen zweiten, ausdrücklich optionalen Dropzone-Bereich für die Audio-Datei;
  `_processWizardFile()` erkennt eine versehentlich in die Hauptzone gezogene Audio-Datei und leitet
  sie um, statt sie mit „kein full-v1-Export" abzulehnen.
- `findMissingSceneAudio()` benennt Szenen mit unauflösbaren `blobId`s nach dem Hauptimport — der
  Hauptimport läuft in jedem Fall durch (D-02), Audio ist nie Voraussetzung.
- **Checkpoint-Fund (Task 3) und Nachbesserung:** der ursprüngliche automatische Zweit-Download aus
  Task 1 wurde durch einen expliziten Button im Divergenz-Banner ersetzt (Weg B), weil Chrome den
  zweiten automatischen Download einer Nutzergeste stillschweigend verwirft — siehe unten.

## Task Commits

Each task was committed atomically:

1. **Task 1: Zweite Datei herunterladen** — `722b1dd` (feat) — später durch die
   Checkpoint-Nachbesserung (`9c14313`) modifiziert, siehe Deviations.
2. **Task 2: Wizard nimmt Audio-Datei optional entgegen, benennt fehlende Szenen** — `41e683c` (feat)
3. **Task 3: Checkpoint-Sichtung + Nachbesserung** — `9c14313` (fix)

_Kein separater Plan-Metadaten-Commit vor diesem SUMMARY — folgt im finalen Commit dieses Plans._

## Files Created/Modified

- `systems/migration/audio-export.js` — `downloadAudioExport()` haengt den Anchor jetzt vor dem Klick
  an, entfernt ihn danach, und der Erfolgs-Toast behauptet nur noch „angeboten". Neue Funktion
  `getAudioExportSummary()` (Datei-/Größenvorschau für den neuen Button, ohne Blobs zu laden).
- `systems/migration/migration-wizard.js` — `startMigrationFlow()` löst `downloadAudioExport()` nicht
  mehr automatisch aus. `showDivergenceBanner()` lädt asynchron `_renderAudioDownloadButton()` nach,
  die bei nicht-leerer Bibliothek einen Button mit Vorschau einblendet; neue EventDelegation-Action
  `download-audio-export`. Wizard-Schritt-2-Text an das neue Zwei-Klick-Verhalten angepasst.
- `tests/unit/audio-export.test.js` — 7 neue Tests: Anchor-Attach/Detach, ehrliche Toast-Formulierung,
  Quelltext-Beleg gegen den automatischen Zweit-Download, Quelltext-Beleg für die
  `download-audio-export`-Action, 3 Tests für `getAudioExportSummary()`.

## Decisions Made

- **Weg B statt Bugfix am automatischen Aufruf:** ein `setTimeout`, ein `await` vor dem zweiten
  Download oder ein sonstiger Timing-Trick hätte das Problem nicht gelöst — Chromes
  Automatische-Downloads-Sperre ist gestengebunden, nicht zeitgebunden. Nur ein zweiter, echter Klick
  liefert eine eigene Nutzergeste. Der Entwickler hat das nach der empirischen Diagnose entschieden.
- **`getAudioExportSummary()` als separate Funktion statt `checkAudioExportFeasible()` zu erweitern:**
  hält die bestehenden Task-3(12-01)-Tests für `checkAudioExportFeasible()` unangetastet und macht die
  neue Vorschau-Semantik (inkl. `diceStatsCount`) explizit statt implizit in einer bestehenden Funktion
  mitzuschleppen.
- **`full-export.js` NICHT mitgefixt:** hat dieselbe detached-Anchor-Schwäche wie `audio-export.js`
  vor diesem Fix, ist aber nicht in `files_modified` dieses Plans. Als Follow-up-Fund dokumentiert
  (siehe unten), nicht in dieser Änderung angefasst.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug, gefunden im Checkpoint] Automatischer Zweit-Download wird von Chrome stillschweigend verworfen**
- **Found during:** Task 3 (menschliche Sichtung des Wizard-Flows unter `file://`)
- **Issue:** `startMigrationFlow()` rief `downloadFullExport()` und `downloadAudioExport()` im selben
  Klick-Handler auf. Instrumentierung (`HTMLAnchorElement.prototype.click` gepatcht) zeigte:
  `buildAudioExport()` liefert korrekte Daten, der Anchor-Klick wird mit korrektem `download`-Namen
  und `blob:`-Href ausgelöst, `imDokument: false` (Anchor nie an `document` angehängt), die Funktion
  kehrt ohne Fehler zurück und zeigt den Erfolgs-Toast — aber die Datei kommt nie an. Ein einzelner,
  isolierter Download-Aufruf kommt zuverlässig an. Root Cause: Chrome erlaubt den ersten Download aus
  einer Nutzergeste und gated jeden weiteren hinter der „Automatische Downloads"-Berechtigung,
  besonders restriktiv unter `file://`. Browser-Richtlinie, kein Code-Defekt — deshalb konnten 21
  grüne Unit-Tests das nicht fangen (sie prüfen den Datenpfad, nicht Chromes Download-Gate).
- **Fix:** Weg B (Entscheidung des Entwicklers): `startMigrationFlow()` löst `downloadAudioExport()`
  nicht mehr automatisch aus. Stattdessen lädt `showDivergenceBanner()` asynchron
  `getAudioExportSummary()` nach und blendet bei nicht-leerer Bibliothek einen eigenen Button
  („Audio-Datei herunterladen (X Audiodateien, Y MB[, Z Würfelwürfe])") ein, dessen Klick eine eigene
  Nutzergeste liefert. Bei leerer Bibliothek erscheint kein Button (bestehendes Task-1-Verhalten
  bleibt korrekt).
- **Files modified:** `systems/migration/migration-wizard.js`, `systems/migration/audio-export.js`
- **Verification:** `npx jest tests/unit/audio-export.test.js` (28/28 grün, 7 neue Tests),
  `node --check` auf beiden Dateien, Produktions- und Dev-Build erfolgreich, `npx playwright test
  tests/e2e/app.spec.js` (14/14 grün, inkl. Migration-Hinweis-Banner-Test).
- **Committed in:** `9c14313`

**2. [Rule 2 — Missing Critical, gefunden im Checkpoint] Erfolgs-Toast behauptete etwas, das die Funktion nicht wissen kann**
- **Found during:** Task 3 (Checkpoint-Diagnose)
- **Issue:** `a.click()` wirft nicht, wenn der Browser den Download verwirft. Der Toast
  „Audio-Export heruntergeladen" war deshalb bei genau dem Fehlerfall falsch, den dieser Plan beheben
  soll — eine unbedingte Erfolgsbehauptung auf einem einmaligen, unwiederholbaren Migrationsschritt.
- **Fix:** Formulierung auf „Audio-Datei zum Download angeboten — bitte im Download-Ordner prüfen, ob
  sie angekommen ist" geändert — behauptet nur, was tatsächlich bekannt ist.
- **Files modified:** `systems/migration/audio-export.js`
- **Verification:** `tests/unit/audio-export.test.js` — neuer Test prüft explizit, dass die alte
  Formulierung „Audio-Export heruntergeladen" nicht mehr auftritt.
- **Committed in:** `9c14313`

**3. [Rule 2 — Missing Critical, gefunden im Checkpoint] Anchor blieb während des Klicks detached**
- **Found during:** Task 3 (Checkpoint-Diagnose, zusammen mit Punkt 1 instrumentiert)
- **Issue:** `document.createElement('a')` gefolgt von `a.click()` ohne Anhängen an `document.body` —
  Chrome toleriert das meist, aber es ist brüchig und eine unnötige zusätzliche Fehlerquelle neben dem
  eigentlichen Download-Gate-Problem.
- **Fix:** Anchor wird jetzt vor dem Klick an `document.body` angehängt und danach wieder entfernt.
- **Files modified:** `systems/migration/audio-export.js`
- **Verification:** neuer Test prüft Aufrufreihenfolge (`appendChild` → `click` → `removeChild`).
- **Committed in:** `9c14313`

---

**Total deviations:** 3 auto-fixed (1 Bug/Rule 1, 2 Missing-Critical/Rule 2) — alle im Checkpoint
gefunden, alle notwendig für Korrektheit auf einem einmaligen, unwiederholbaren Migrationsschritt.
**Impact on plan:** Kein Scope-Creep — alle drei Fixes bleiben innerhalb der ursprünglichen
`files_modified`-Liste dieses Plans. `full-export.js` hat dieselbe Anchor-Schwäche wie Punkt 3, wurde
aber bewusst NICHT mitgefixt (außerhalb des Scopes), siehe „Follow-up-Fund" unten.

## Follow-up Finding (nicht in diesem Plan behoben)

`systems/migration/full-export.js:84-103` (`downloadFullExport()`) hat dieselbe detached-Anchor-
Schwäche wie `audio-export.js` vor diesem Fix: `document.createElement('a')` → `a.click()` ohne
Anhängen an `document.body`. Da der Haupt-Export der ERSTE Download aus der Nutzergeste ist, tritt das
konkrete Chrome-Gate-Problem hier nicht auf — aber die Brüchigkeit besteht unabhängig davon. Nicht
mitgefixt, weil `full-export.js` außerhalb der `files_modified`-Liste dieses Plans liegt. Sollte in
einem künftigen Plan (oder als Teil von `12-03`, das ebenfalls `full-export.js`-nahe Backup-Logik
berührt) analog gehärtet werden.

## Issues Encountered

Der 90%-Fall des Checkpoint-Protokolls („menschliche Sichtung nach Automatisierung") hat hier genau
seinen Zweck erfüllt: die automatisierte Testsuite (21 grüne Unit-Tests nach Task 1+2) konnte die
Regression strukturell nicht sehen, weil sie den DATENPFAD prüft (`buildAudioExport()`,
`JSON.stringify`, Anchor-Attribute), nicht Chromes Download-Berechtigungsverhalten — das liegt
außerhalb dessen, was ein `vm`-Kontext-Test simulieren kann. Erst die reale `file://`-Sichtung in
Chrome, kombiniert mit gezielter Instrumentierung (`HTMLAnchorElement.prototype.click` gepatcht),
konnte die Lücke zwischen „Code läuft fehlerfrei durch" und „Datei kommt tatsächlich an" sichtbar
machen.

**Wiederkehrende Lektion dieser Phase (siehe auch 12-CONTEXT.md, D-08 und die referenzierten
11-/08-LEARNINGS.md):** „ein grüner Test ist kein Beweis" gilt hier in einer neuen Ausprägung — nicht
nur ungetesteter Code kann falsch sein, auch vollständig getesteter Code kann an einer
Browser-Policy-Grenze scheitern, die kein Unit-Test erreichen kann. Der Datenpfad (Base64-Encode,
JSON-Struktur, Blob-Bau) war in Task 1 bereits korrekt und ist es geblieben — der Fehler lag
ausschließlich in der Download-AUSLÖSUNG, einer Schicht, die nur echte Browser-Interaktion prüfen
kann. Für jeden künftigen Plan, der einen zweiten (dritten, …) Anchor-Download aus derselben
Codepfad-Ausführung auslöst, ist das ein strukturelles Risiko, kein Einzelfall.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SAFE-01 ist mit diesem Plan vollständig abgedeckt (Export-Rundlauf aus 12-01 + UI-Verdrahtung und
  Download-Härtung aus 12-02).
- Der Follow-up-Fund zu `full-export.js` (siehe oben) sollte vor oder während `12-03`
  (Multi-Campaign-Backup, berührt denselben Download-Bereich) aufgegriffen werden.
- Kein Blocker für nachfolgende Pläne dieser Phase.

---
*Phase: 12-datensicherheit*
*Completed: 2026-08-18*

## Self-Check: PASSED

All files exist (`systems/migration/audio-export.js`, `systems/migration/migration-wizard.js`,
`tests/unit/audio-export.test.js`), all commits found in `git log` (`722b1dd`, `41e683c`, `9c14313`).
