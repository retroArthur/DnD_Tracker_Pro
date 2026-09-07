---
phase: 12-datensicherheit
plan: 01
subsystem: data-safety
tags: [indexeddb, base64, migration, export-import, jest-vm, quota-fallback]

requires:
  - phase: 11-architektur-build-hygiene
    provides: "Single-Source-of-Truth-Modulliste in loader.js (build.py liest sie zur Build-Zeit)"
provides:
  - "systems/migration/audio-export.js — Audio-Export/-Import-Rundlauf (buildAudioExport, importAudioExport, blobToBase64, base64ToBlob, checkAudioExportFeasible)"
  - "window._doBackup-Export in file-backup-manager.js (Testbarkeits-Voraussetzung fuer Plan 12-03/SAFE-02)"
  - "localStorage-Quota-Fallback-Testabdeckung in stability.test.js (SAFE-06)"
  - "tests/unit/audio-export.test.js — 12 Kontrakt-Tests fuer den Audio-Export-Rundlauf"
affects: [12-02-migration-wizard-audio-ui, 12-03-multi-campaign-backup, 12-07-safe-06-restanden]

actuals:
  tokens: 8631
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Zweite Export-Datei fuer IndexedDB-Inhalte (audio-export-v1), strikt getrennt von FULL_EXPORT_SCHEMA (full-v1)"
    - "Vorab-Metadaten-Pruefung (listSoundBlobs()-size, ohne Blob-Bytes) VOR jedem teuren Base64-Encode"
    - "Pro-Datei try/catch beim Import (D-02: benannt, nicht blockierend) statt einem globalen try/catch"
    - "vm.createContext() mit jest.fn()-Mocks fuer window.* + jsdom-Globals (Blob/File/FileReader/atob/btoa) durchgereicht"

key-files:
  created:
    - systems/migration/audio-export.js
    - tests/unit/audio-export.test.js
  modified:
    - systems/file-backup/file-backup-manager.js
    - tests/unit/stability.test.js
    - loader.js
    - tests/build/test_build_deduplication.py

key-decisions:
  - "audio-export.test.js wurde in zwei Tranchen geschrieben (Task 1: Task-2-Kontrakt, Task 3: Haertungs-Kontrakt) statt als ein einziger RED-Block in Task 1 — siehe Deviations."
  - "checkAudioExportFeasible() und buildAudioExport() teilen sich eine reine Hilfsfunktion (computeFeasibility), damit die Groessenpruefung nicht zweimal unabhaengig implementiert wird."
  - "SAFE-01/SAFE-02/SAFE-06 NICHT als requirements-completed markiert — jedes ist auf mehrere Plaene verteilt (12-01+12-02 fuer SAFE-01, 12-01+12-03 fuer SAFE-02, 12-01+12-07 fuer SAFE-06); vollstaendig erst im jeweils letzten Plan."

patterns-established:
  - "Blob<->Base64 ausschliesslich ueber FileReader.readAsDataURL()/atob() — nie String.fromCharCode.apply() ueber ein Byte-Array (RangeError bei grossen Dateien)"
  - "Groessenpruefung immer VOR dem teuren Encode-Schritt, nie danach — der RangeError waere sonst schon geworfen"

requirements-completed: []

coverage:
  - id: D1
    description: "buildAudioExport() sammelt alle IDB-Audiodateien als Base64 plus die vollstaendige Wuerfelstatistik, Base64-Rundlauf ist byte-identisch"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#buildAudioExport — Struktur und Metadaten (SAFE-01)"
        status: pass
      - kind: unit
        ref: "tests/unit/audio-export.test.js#Base64-Rundlauf (SAFE-01)"
        status: pass
    human_judgment: false
  - id: D2
    description: "importAudioExport() schreibt Dateien zurueck nach IndexedDB, lehnt fremde Export-Typen ab"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Rundlauf (SAFE-01)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ueber 300 MiB Rohdaten bricht der Export benannt ab, BEVOR ein Blob geladen oder kodiert wird"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#checkAudioExportFeasible — Groessenpruefung vor dem Kodieren (SAFE-01/T-12-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Import lehnt Uebermengen ab (>500 Dateien), ueberspringt fremdformatige blobIds, uebersteht kaputtes Base64 pro Datei"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Haertung (SAFE-01/T-12-01/T-12-02/T-12-03)"
        status: pass
    human_judgment: false
  - id: D5
    description: "window._doBackup ist direkt testbar (Testbarkeits-Voraussetzung fuer SAFE-02, Plan 12-03)"
    requirement: "SAFE-02"
    verification:
      - kind: other
        ref: "grep -c 'window._doBackup' systems/file-backup/file-backup-manager.js == 1"
        status: pass
    human_judgment: false
  - id: D6
    description: "localStorage-Quota-Fallback (QuotaExceededError) faellt auf IndexedDB zurueck, entfernt Begleit-Timestamp"
    requirement: "SAFE-06"
    verification:
      - kind: unit
        ref: "tests/unit/stability.test.js#localStorage-Quota-Fallback (SAFE-06)"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-08-06
status: complete
---

# Phase 12 Plan 01: Audio-Export-Rundlauf + Wave-0-Testfundament Summary

**Zweite Export-Datei (`audio-export-v1`) fuer IndexedDB-Audioblobs + Wuerfelstatistik mit
verlustfreiem Base64-Rundlauf, Vorab-Groessenpruefung gegen die gemessene 384-MiB-V8-Grenze und
gehaertetem Import-Pfad (Mengenlimit, blobId-Whitelist, Pro-Datei-Fehlerisolation).**

## Performance

- **Duration:** ~35 min (inkl. Kontext-Lektuere von PLAN/CONTEXT/VALIDATION/RESEARCH)
- **Completed:** 2026-08-06T09:34:34Z
- **Tasks:** 3 (alle abgeschlossen)
- **Files modified:** 6 (2 neu, 4 geaendert)

## Accomplishments

- `systems/migration/audio-export.js` neu: `buildAudioExport()`, `importAudioExport()`,
  `blobToBase64()`/`base64ToBlob()`, `checkAudioExportFeasible()` — vollstaendiger IndexedDB ->
  Base64 -> JSON -> IndexedDB-Rundlauf fuer Audio-Blobs (`audioBlobs`-Store) und Wuerfelstatistik
  (`diceStats`-Store, unbeschnitten).
- Groessenpruefung (`AUDIO_EXPORT_SAFE_RAW_BYTES = 300 MiB`) laeuft ausschliesslich auf
  `listSoundBlobs()`-Metadaten (ohne Blob-Bytes) und wird VOR jedem Encode-Versuch ausgewertet —
  der gemessene 384-MiB-`RangeError` (V8-Stringgrenze `0x1fffffe8`) wird strukturell verhindert.
  Kein Teilexport bei Ueberschreitung.
- Import-Haertung: `MAX_IMPORT_AUDIO_FILES = 500`, `ALLOWED_BLOB_ID_RE = /^audio_\d+_\d+$/`
  (Whitelist gegen `saveSoundBlob()`-ID-Format), Pro-Datei-`try/catch` um `atob()` — eine kaputte
  Datei kostet nur sich selbst, der Rest des Imports laeuft durch (D-02-Prinzip).
- `window._doBackup = _doBackup;` in `file-backup-manager.js` ergaenzt — macht SAFE-02 (Plan 12-03)
  direkt testbar, ohne den `onAfterSave()`-Debounce-Pfad zu durchlaufen.
- `localStorage-Quota-Fallback (SAFE-06)`-Testblock in `stability.test.js`: Verhaltenssimulation
  (QuotaExceededError -> IDB-Write -> `_ts`-Entfernung) plus Quelltext-Audit, dass
  `saveImmediate()` UND `save()` im `catch`-Zweig tatsaechlich `saveToIndexedDBFallback()`
  aufrufen.
- `tests/unit/audio-export.test.js`: 12 Tests, alle gruen — deckt Task 2 (Struktur, Base64-Rundlauf,
  Import-Grundfall) und Task 3 (Groessenpruefung, Mengenlimit, ID-Whitelist, Base64-Fehlerisolation)
  vollstaendig ab.
- `systems/migration/audio-export.js` in `loader.js`s `MODULES`-Array registriert (hinter
  `dice-stats-idb.js`, Abhaengigkeitsreihenfolge) — einzige Registrierungsstelle, `build.py` liest
  sie zur Build-Zeit.

## Task Commits

1. **Task 1: Wave 0 — Testbarkeit herstellen** - `a780f1b` (test)
2. **Task 2: Audio-Rundlauf end-to-end** - `de3e078` (feat, tracer)
3. **Task 3: Groessenpruefung + Haertung des Import-Pfads** - `ccd639e` (feat)
4. **Deviation-Fix: Modulzahl-Assertion** - `44e7292` (test)

**Plan metadata:** siehe abschliessenden `docs(12-01)`-Commit (folgt diesem Summary-Write).

_Hinweis: Task 2 trug `type="tracer"` — die Tracer-Verify (`npx jest
tests/unit/audio-export.test.js && python build.py`) wurde direkt nach dem Commit erneut
ausgefuehrt (Autonomous-Run-Gate) und bestand, bevor Task 3 (Expansion) begann._

## Files Created/Modified

- `systems/migration/audio-export.js` - Neues Modul: Audio-Export/-Import-Rundlauf, Groessenpruefung, Haertung
- `tests/unit/audio-export.test.js` - 12 Kontrakt-Tests (vm.createContext + jest.fn()-Mocks)
- `systems/file-backup/file-backup-manager.js` - `window._doBackup`-Export ergaenzt (1 Zeile)
- `tests/unit/stability.test.js` - Neuer Block `localStorage-Quota-Fallback (SAFE-06)` (2 Tests)
- `loader.js` - `systems/migration/audio-export.js` im `MODULES`-Array registriert
- `tests/build/test_build_deduplication.py` - Hartkodierte Modulzahl 123 -> 124 (Rule 1, siehe Deviations)

## Decisions Made

- `checkAudioExportFeasible()` und `buildAudioExport()` teilen sich die reine Funktion
  `computeFeasibility(metas)`, damit die 300-MiB-Pruefung nicht zweimal unabhaengig implementiert
  wird und garantiert identisch bewertet.
- `audio-export.test.js` wurde in zwei Tranchen geschrieben statt als ein einziger RED-Block in
  Task 1 (siehe Deviations — Klarstellung zum Plantext).
- SAFE-01/SAFE-02/SAFE-06 wurden NICHT in `requirements-completed` markiert, obwohl sie im
  Plan-Frontmatter stehen — jede dieser Requirement-IDs ist auf mehrere Plaene dieser Phase verteilt
  (12-01+12-02 fuer SAFE-01, 12-01+12-03 fuer SAFE-02, 12-01+12-07 fuer SAFE-06). Ein
  `requirements mark-complete` hier haette REQUIREMENTS.md faelschlich als "fertig" markiert,
  waehrend die Wizard-UI-Integration (12-02), die Multi-Kampagnen-Backup-Logik (12-03) und die
  restlichen SAFE-06-Randfaelle (12-07) noch ausstehen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `blob.arrayBuffer()` in jsdom/Jest-Umgebung nicht vorhanden**
- **Found during:** Task 2 (erster Testlauf von `audio-export.test.js`)
- **Issue:** Der Test-Helper `blobBytes()` nutzte `blob.arrayBuffer()`, um den Base64-Rundlauf
  byte-genau zu vergleichen. jsdoms Blob-Implementierung in diesem Jest-Setup (jsdom 26, Node-Test-
  Env) besitzt diese Methode nicht (`TypeError: blob.arrayBuffer is not a function`) — verifiziert
  per Debug-Testlauf in dieser Sitzung.
- **Fix:** `blobBytes()` auf `FileReader.readAsArrayBuffer()` umgestellt (dieselbe API-Familie wie
  `blobToBase64()`, die bereits erfolgreich `readAsDataURL()` nutzt).
- **Files modified:** `tests/unit/audio-export.test.js`
- **Verification:** `npx jest tests/unit/audio-export.test.js` — Base64-Rundlauf-Test gruen.
- **Committed in:** `de3e078` (Task 2 commit)

**2. [Rule 1 - Bug] Hartkodierte Modulzahl in `test_build_deduplication.py` nach neuer Registrierung**
- **Found during:** Nach Task 3, beim Ausfuehren von `python -m pytest tests/build` (Baseline-Check
  ueber die im Plan genannten Verify-Kommandos hinaus, da Plan 12-VALIDATION.md `pytest 24` als
  Baseline nennt).
- **Issue:** `test_ssot_module_list_parses_from_loader` erwartete hartkodiert 123 Module aus
  `loader.js`. Die Registrierung von `systems/migration/audio-export.js` (Task 2, plankonform)
  erhoehte die Zahl auf 124 — eine direkte, erwartete Folge dieser Plan-Aenderung, kein
  unabhaengiger Bug.
- **Fix:** Assertion auf 124 aktualisiert, mit Kommentarverweis auf Phase 12 / Plan 01.
- **Files modified:** `tests/build/test_build_deduplication.py`
- **Verification:** `python -m pytest tests/build -q` — 24/24 gruen.
- **Committed in:** `44e7292`

---

**Total deviations:** 2 auto-fixed (beide Rule 1 — direkte Testfolgen der plankonformen Aenderungen,
kein Scope-Creep).
**Impact on plan:** Keine funktionale Aenderung am Audio-Export-Code selbst; beide Fixes betreffen
ausschliesslich Testinfrastruktur.

### Klarstellung zum Plantext (keine Code-Deviation, aber dokumentationswuerdig)

Task 1(c) im Plan verlangt, dass `audio-export.test.js` "den vollen Kontrakt aus Task 2 und Task 3"
beschreibt und "bis zum Ende von Task 2 rot" ist — gleichzeitig verlangt Task 2s `<done>`-Kriterium
explizit "`tests/unit/audio-export.test.js` ist gruen" nach Abschluss von Task 2. Diese beiden
Anforderungen sind fuer denselben Zeitpunkt nicht gleichzeitig erfuellbar, wenn Task 1 bereits
Task-3-spezifische Tests (`checkAudioExportFeasible`, Mengenlimit, ID-Whitelist — deren
Implementierung erst in Task 3 folgt) enthaelt: die Datei waere dann zwangslaeufig noch rot, wenn
Task 2 sein eigenes gruenes Verify-Gate erreicht.

Geloest durch pragmatische Aufteilung: Task 1 schrieb ausschliesslich den Task-2-Kontrakt (3
describe-Bloecke: Struktur/Metadaten, Base64-Rundlauf, Import-Grundfall — 6 Tests), sodass Task 2s
eigenes `<verify>`/`<done>`-Gate erfuellbar blieb. Task 3 ergaenzte anschliessend die
Haertungs-Kontrakt-Tests (`checkAudioExportFeasible`, Mengenlimit, ID-Whitelist, Base64-
Fehlerisolation — 6 weitere Tests) in derselben Datei — konsistent mit Task 3s eigener
`<files>`-Liste, die `tests/unit/audio-export.test.js` explizit als zu aendernde Datei nennt. Am
Ende der Plan-Ausfuehrung beschreibt die Datei tatsaechlich den vollen Kontrakt beider Tasks (12
Tests, alle gruen) — nur der Zeitpunkt, WANN welcher Teil geschrieben wurde, weicht vom
Plan-Wortlaut ab. Keine Funktionalitaet wurde dadurch anders implementiert als spezifiziert.

## Issues Encountered

None ueber die oben dokumentierten Deviations hinaus.

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Next Phase Readiness

- `window._doBackup` ist exportiert — Plan 12-03 (SAFE-02, Multi-Kampagnen-Backup) kann direkt
  darauf testen, ohne den Debounce-Pfad zu simulieren.
- `systems/migration/audio-export.js` steht bereit fuer die Wizard-UI-Integration in Plan 12-02
  (zweite Dropzone fuer die optionale Audio-Datei, D-02: fehlende/falsche Datei blockiert den
  Hauptimport nicht).
- `diceStats`-Export nimmt bewusst "alles, was `getAllStats()` liefert" — sollte `PERF-02` (Phase
  13) spaeter ein Pruning einfuehren, muss `audio-export.js` dafuer NICHT geaendert werden.
- Keine Blocker fuer nachfolgende Plaene dieser Phase erkannt.

## Self-Check: PASSED

All claimed files verified present on disk; all 4 task/commit hashes (`a780f1b`, `de3e078`,
`ccd639e`, `44e7292`) verified present in `git log --all`.

---
*Phase: 12-datensicherheit*
*Plan: 01*
*Completed: 2026-08-06*
