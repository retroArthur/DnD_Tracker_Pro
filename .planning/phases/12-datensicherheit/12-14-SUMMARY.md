---
phase: 12-datensicherheit
plan: 14
subsystem: migration
tags: [migration-wizard, error-handling, try-catch, tdd, sec-01]

# Dependency graph
requires:
  - phase: 12-datensicherheit
    provides: "12-02 (Wizard-Audio-Zweig), 12-09 (Wizard-Reload-Pfad CR-01/WR-01)"
provides:
  - "SEC-01 vollstaendig geschlossen: ein bereits erfolgreicher Umzug (Haupt- und Audio-Pfad) meldet sich nach dem Rueckschreiben nicht mehr als Fehlschlag"
  - "Strukturelle Grenze 'ab hier sind die Daten geschrieben' als Code-Konstrukt (Import-try endet nach dem Ruecksprung aus importFn()), nicht nur als Kommentar"
  - "Verhaltensnachweis (test.each-Invariante) ueber mehrere Wurfstellen im Nachbereich statt Absicherung nur der einen bekannten Stelle"
affects: [12-16, 12-17]

# Actuals (#2632)
actuals:
  tokens: 5721
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Import-try endet unmittelbar nach dem Ruecksprung aus der Importfunktion; der gesamte Nachlauf (Dropzone-Zustand, Ergebnisflaeche, Zusatzauskunft) liegt ausserhalb und bekommt fuer die Zusatzauskunft ein eigenes, nur DEBUG_MODE-protokollierendes try/catch"
    - "Verhaltensnachweis per test.each-Tabelle ueber mehrere Wurfstellen plus einen invertierten Gegen-Eintrag statt eines nie wahr werdenden Merkers"

key-files:
  created: []
  modified:
    - systems/migration/migration-wizard.js
    - tests/unit/audio-import-resilience.test.js

key-decisions:
  - "Blockgrenze statt Merker: der Import-try endet strukturell nach dem Ruecksprung aus importFn()/importAudioExport() statt eines Flags, das der aeussere catch abfragt — ein Merker waere nach der Umstellung nie wahr, also totes, untestbares Beiwerk (siehe <design_note> im Plan)"
  - "Die D-02-Audio-Benennung und die Audio-Pfad-Lueckenpruefung bekommen je ein eigenes, zusaetzliches try/catch (zwei Ebenen bewusst: die aeussere Grenze verhindert die falsche Fehlermeldung, die innere verhindert, dass ein Ausfall der Zusatzauskunft die bereits geschriebenen Erfolgszeilen mitreisst)"
  - "test.failing-Verankerung (Zeile 295) auf test() umgestellt — das ist der vorgesehene Zuendmechanismus des Nyquist-Nachzugs, kein Anpassen eines Tests an eine kaputte Implementierung"
  - "Eine zusaetzliche, im Plan nicht explizit geforderte Test-Zeile ('Erfolgsfall unveraendert' auf dem Audio-Pfad) ergaenzt, um die geforderte Mindestzahl 'Basislinie + 9' (16 statt 15) tatsaechlich zu erreichen, statt die Zahl nur behauptet zu erfuellen"

patterns-established:
  - "Nachlauf-nach-Erfolg-Muster: Code, der nach einem bereits abgeschlossenen, unwiederholbaren Schreibvorgang laeuft, gehoert strukturell ausserhalb von dessen try/catch — mit eigenem, nur protokollierendem Fehlerpfad fuer Zusatzauskuenfte"

requirements-completed: [SAFE-01]

coverage:
  - id: D1
    description: "Ein Wurf aus listSoundBlobs() laesst Erfolgszeilen und Schritt 4 unberuehrt (Hauptimport)"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "tests/unit/audio-import-resilience.test.js#SEC-01: wirft listSoundBlobs(), bleiben die Erfolgszeilen inhaltlich erhalten (nicht nur \"kein Fehler\")"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dasselbe fuer einen Wurf aus findMissingSceneAudio() (Hauptimport)"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "tests/unit/audio-import-resilience.test.js#SEC-01: wirft findMissingSceneAudio(), bleiben die Erfolgszeilen inhaltlich erhalten"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ein Wurf aus importFullExport() selbst erscheint weiterhin als Fehlschlag (Gegenprobe, kein zu weit greifender Fix)"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "tests/unit/audio-import-resilience.test.js#SEC-01 Invariante Gegen-Eintrag: wirft importFullExport() SELBST, bleibt es beim Fehlschlag"
        status: pass
    human_judgment: false
  - id: D4
    description: "Auf dem Audio-Pfad ueberleben Zahl und Gruende eine scheiternde Lueckenpruefung; ein echter Importfehler (importAudioExport() selbst wirft) bleibt Fehlschlag"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "tests/unit/audio-import-resilience.test.js#SEC-01: eine scheiternde Lueckenpruefung nach dem Audio-Import unterdrueckt weder Zahl noch Gruende bereits importierter/uebersprungener Dateien"
        status: pass
      - kind: unit
        ref: "tests/unit/audio-import-resilience.test.js#SEC-01 Gegenprobe: wirft importAudioExport() selbst, bleibt es bei der Fehlermeldung mit Fehlermarkierung"
        status: pass
    human_judgment: false
  - id: D5
    description: "Invariante ueber mehrere Wurfstellen (nicht nur die eine bekannte): nach dem Ruecksprung aus importFn() fuehrt kein Weg mehr in den Fehlschlag"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "tests/unit/audio-import-resilience.test.js#SEC-01 Invariante: listSoundBlobs() lehnt ab / wirft synchron / findMissingSceneAudio() wirft"
        status: pass
    human_judgment: false
  - id: D6
    description: "Mutationsnachweis: bei zurueckgeschobener Blockgrenze fallen die benannten Tests um, der Gegen-Eintrag bleibt gruen"
    requirement: SAFE-01
    verification:
      - kind: manual_procedural
        ref: "Pre-Fix-Quelltext (git show HEAD vor diesem Plan) gegen die neuen Tests gelaufen — siehe Abschnitt 'Mutationsnachweis' unten"
        status: pass
    human_judgment: false
  - id: D7
    description: "test.failing-Verankerung bei Zeile 295 auf test() umgestellt; Kommentarblock beschreibt jetzt die Struktur statt des Defekts; irrefuehrender Quelltextkommentar berichtigt"
    requirement: SAFE-01
    verification:
      - kind: unit
        ref: "tests/unit/audio-import-resilience.test.js#D-02-Kern: eine scheiternde listSoundBlobs()-Abfrage darf den bereits erfolgreichen Hauptimport NICHT in einen Fehler kippen"
        status: pass
    human_judgment: false

duration: ~30min
completed: 2026-09-05
status: complete
---

# Phase 12 Plan 14: SEC-01 — Migrations-Wizard meldet keinen Fehlschlag mehr fuer bereits geschriebene Daten Summary

**Beide Fundstellen von SEC-01 (Haupt- und Audio-Import in `migration-wizard.js`) strukturell geschlossen: der Import-`try` endet jetzt unmittelbar nach dem Ruecksprung aus der jeweiligen Importfunktion, der gesamte Nachlauf liegt ausserhalb und kann einen bereits gelungenen, unwiederholbaren Umzug nicht mehr als Fehlschlag ausgeben — abgesichert durch eine test.each-Invariante ueber drei unabhaengige Wurfstellen plus Gegenprobe.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-09-05T10:25:39Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- `_processWizardFile()`: Import-`try` endet nach `result = importFn(parsedObj)`; Dropzone-Zustand, Ergebnisflaeche und die D-02-Audio-Benennung liegen ausserhalb, die Benennung mit eigenem, nur `DEBUG_MODE`-protokollierendem try/catch; `showWizardStep(4)` wird unbedingt erreicht
- `_processWizardAudioFile()`: dieselbe Trennung — der Import-`try` umschliesst nur noch die Ermittlung der Importfunktion und den Ruecksprung aus `importAudioExport()`; die Lueckenpruefung bekommt ihr eigenes try/catch, `showStatus(msg, false)` steht am Ende ausserhalb beider Bereiche
- `test.failing`-Verankerung (vormals Zeile 295) auf `test()` umgestellt — der vorgesehene Zuendmechanismus des Nyquist-Nachzugs; der irrefuehrende Quelltextkommentar, der das Gegenteil des damaligen Codeverhaltens behauptete, ist berichtigt
- Sechs neue Tests: zwei fuer den Hauptimport (Wurf aus `listSoundBlobs()` bzw. `findMissingSceneAudio()`), drei fuer den Audio-Pfad (scheiternde Lueckenpruefung, Gegenprobe, unveraenderter Erfolgsfall) und eine `test.each`-Invariante mit vier Faellen (drei Wurfstellen + ein Gegen-Eintrag) — 16 Tests insgesamt (Basislinie 7 + 9)

## Task Commits

Each task was committed atomically:

1. **Task 1: Hauptimport — die Grenze „ab hier sind die Daten geschrieben" in den Code ziehen** - `95dd60a` (fix)
2. **Task 2: Audio-Pfad — die Übersprungen-Liste überlebt eine scheiternde Lückenprüfung** - `403244c` (fix)
3. **Task 3: Die Invariante — nach dem Rücksprung aus importFn() führt kein Weg mehr in den Fehlschlag** - `a5372e1` (test)

_Note: Task 1 und 2 sind reine Struktur-Fixes mit begleitenden Tests im selben Commit (kein separates RED/GREEN-Paar noetig — die Tests wurden gegen den bekannten kaputten Vorzustand rot verifiziert, siehe Mutationsnachweis unten, statt als eigener test-Commit vorab zu laufen)._

## Files Created/Modified

- `systems/migration/migration-wizard.js` - `_processWizardFile()` und `_processWizardAudioFile()`: Import-`try` endet nach dem Ruecksprung aus der Importfunktion; Nachlauf ausserhalb mit eigenem, nur protokollierendem try/catch fuer die jeweilige Zusatzauskunft; berichtigter Kommentar
- `tests/unit/audio-import-resilience.test.js` - `test.failing` -> `test()` umgestellt, Kommentarblock aktualisiert; sechs neue SEC-01-Tests inkl. `test.each`-Invariante; Testkontext um `migration-wizard-audio-status`-Attrappe und `window.importAudioExport`-Mock erweitert

## Decisions Made

- Blockgrenze statt Merker (siehe `<design_note>` im Plan): ein nach der Umstellung nie wahr werdendes Flag waere totes, untestbares Beiwerk gewesen — die Invariante aus Task 3 uebernimmt den Rueckfallschutz stattdessen als Verhaltensnachweis
- Zwei try/catch-Ebenen je Pfad sind bewusst getrennt: die aeussere Grenze (Import-try) verhindert die falsche Fehlermeldung, die innere (Benennung/Lueckenpruefung) verhindert, dass ein Ausfall der Zusatzauskunft die bereits geschriebenen Erfolgszeilen mitreisst
- Eine zusaetzliche Testzeile im Audio-Pfad ("Erfolgsfall unveraendert: ... zeigt weiterhin fehlende Szenen namentlich") wurde ergaenzt, weil die urspruenglich geplanten acht neuen Tests (2+2+4) die geforderte Gesamtzahl "Basislinie + 9" (16) sonst um eins verfehlt haetten (15 statt 16) — diese Luecke wurde durch echte, zusaetzliche Abdeckung geschlossen (unveraenderter Erfolgsfall mit Luecken-Nennung auf dem Audio-Pfad war im Plan-Text als Verhalten beschrieben, aber noch nicht separat getestet), nicht durch Duplizieren einer bestehenden Assertion

## Deviations from Plan

None - plan executed exactly as written. Die einzige Ergaenzung (ein zusaetzlicher Test, siehe oben) ist Rule-2-artig (fehlende Testabdeckung fuer ein im Plan-Text beschriebenes, aber ungetestetes Verhalten) und dient ausschliesslich der numerischen Anforderung "Basislinie + 9" — kein Scope-Creep an der Produktionslogik.

## Roter Vorlauf und Mutationsnachweis

**Roter Vorlauf (vor Task 1):** die `test.failing`-Verankerung wurde einmalig auf `test()` umgestellt und die Suite gegen den unveraenderten Quelltext gelaufen. Ergebnis: 6 passed, 1 failed —

```
Expected pattern: not /Import fehlgeschlagen/
Received string: "Import fehlgeschlagen: IndexedDB nicht verfuegbar. Bitte erneut versuchen oder Überspringen wählen."
```

Danach wurde die Annotation vor dem eigentlichen Fix zurueckgenommen (Basislinie: 7 passed).

**Mutationsnachweis (nach allen drei Tasks):** der komplette Pre-Fix-Quelltext von `migration-wizard.js` (`git show HEAD` vor diesem Plan) wurde testweise gegen die neue, vollstaendige Testdatei gelaufen. Ergebnis: 9 passed, 7 failed — genau die SEC-01-bezogenen Tests fielen um, alle anderen (inkl. beider Gegenproben) blieben gruen:

```
× D-02-Kern: eine scheiternde listSoundBlobs()-Abfrage darf den bereits erfolgreichen Hauptimport NICHT in einen Fehler kippen
× SEC-01: wirft listSoundBlobs(), bleiben die Erfolgszeilen inhaltlich erhalten (nicht nur "kein Fehler")
× SEC-01: wirft findMissingSceneAudio(), bleiben die Erfolgszeilen inhaltlich erhalten
× SEC-01: eine scheiternde Lueckenpruefung nach dem Audio-Import unterdrueckt weder Zahl noch Gruende bereits importierter/uebersprungener Dateien
× SEC-01 Invariante: listSoundBlobs() lehnt ab (Promise-Rejection)
× SEC-01 Invariante: listSoundBlobs() wirft synchron
× SEC-01 Invariante: findMissingSceneAudio() wirft
√ SEC-01 Gegenprobe: wirft importAudioExport() selbst, bleibt es bei der Fehlermeldung mit Fehlermarkierung
√ SEC-01 Invariante Gegen-Eintrag: wirft importFullExport() SELBST, bleibt es beim Fehlschlag
```

Danach wurde der gefixte Quelltext wiederhergestellt und die volle Suite erneut gruen bestaetigt (16/16).

## Issues Encountered

- **Nachbarpruefung `tests/unit/audio-export.test.js -t "Quelltext-Belege"`** (informativ, kein Gate laut Plan): lief gruen (2/2 passed) — die Umstrukturierung hat die von diesem Test geprueften Struktur-Invarianten (Dropzone-IDs, Zweigreihenfolge `audio-export-v1` vor `full-v1`) nicht verletzt.
- **Vorbestehende CRLF-Stat-Anomalie (nicht durch diesen Plan verursacht):** `git status --porcelain systems/migration/audio-export.js` meldet die Datei als „M", obwohl `git diff --exit-code` fuer diese Datei Exit-Code 0 (keine Inhaltsunterschiede) liefert. Dieselbe Anomalie betrifft auch `.claude/launch.json` und `systems/file-backup/file-backup-manager.js` (letzteres bereits in Plan 12-12 committet, lange vor diesem Plan) — repo-weites Line-Ending-Stat-Cache-Artefakt, kein Content-Diff, unabhaengig von diesem Plan verifiziert (`git diff --exit-code` = 0 fuer alle drei). `full-export.js` zeigt keinerlei Aenderung. Dieser Plan hat weder `full-export.js` noch `audio-export.js` inhaltlich veraendert.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SEC-01 an beiden Fundstellen geschlossen; SAFE-01 fuer diesen Plan erfuellt (Requirement wird erst im letzten deklarierenden Plan der Welle final als komplett markiert — SAFE-01 ist auf mehrere Plaene dieser Phase verteilt)
- Welle 9 (12-12, 12-13, 12-14, 12-15): 12-12 und 12-15 waren vor diesem Plan bereits fertig; mit 12-14 sind drei von vier Wave-9-Plaenen abgeschlossen. 12-13 (SEC-02) bleibt offen — erst danach ist Welle 10 (Plan 12-16, SEC-05/SEC-06+WR-03) entsperrt
- Scope-Grenzen eingehalten: `isFreshInstall()`, `hasCampaignContent()`, die `CAMPAIGN_CONTENT_*`-Listen, `AUDIO_IMPORT_MAX_BYTES`, der `wizard-skip`/`wizard-close`-Reload-Pfad, `full-export.js` und `audio-export.js` wurden nicht angefasst (verifiziert via `git status --porcelain` und inhaltlichem `git diff --exit-code`)
- Kein `dist/`-Neubau (bleibt Plan 12-17 vorbehalten)

## Self-Check: PASSED

- FOUND: systems/migration/migration-wizard.js
- FOUND: tests/unit/audio-import-resilience.test.js
- FOUND: .planning/phases/12-datensicherheit/12-14-SUMMARY.md
- Commits found in git log: 95dd60a, 403244c, a5372e1

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-05*
