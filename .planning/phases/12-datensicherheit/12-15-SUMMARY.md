---
phase: 12-datensicherheit
plan: 15
subsystem: data-safety
tags: [indexeddb, base64, migration, import-hardening, dos-mitigation, jest-vm]

requires:
  - phase: 12-datensicherheit
    provides: "systems/migration/audio-export.js (importAudioExport, base64ToBlob, MAX_IMPORT_AUDIO_FILES, ALLOWED_BLOB_ID_RE) — Plan 12-01"
provides:
  - "schaetzeAudioRohbytes() — schaetzt die Rohbyte-Groesse eines Import-Eintrags VOR dem Base64-Dekodieren (Maximum aus entry.size und Base64-Laenge)"
  - "AUDIO_IMPORT_MAX_ENTRY_BYTES (100 MB) — Einzelgrenze fuer einen Import-Eintrag, gespiegelt aus soundboard-idb.js MAX_AUDIO_BYTES_HARD, per Abgleichtest gegen Drift gesichert"
  - "AUDIO_IMPORT_MAX_TOTAL_BYTES — Gesamtbudget fuer die Summe aller dekodierten Eintraege, abgeleitet aus AUDIO_EXPORT_SAFE_RAW_BYTES"
  - "importAudioExport() lehnt uebergrosse Einzeleintraege UND ein erschoepftes Gesamtbudget VOR base64ToBlob() ab — benannt in skipped, kein Wurf (D-02)"
affects: [12-16-wr-03-wizard-groessenkalibrierung, 12-17-gesamtlauf-dist-rebuild]

actuals:
  tokens: 3967
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Rohbyte-Schaetzung VOR jedem teuren Dekodierschritt (Math.max aus deklarierter Groesse und Base64-Laenge) — analog zur bereits bestehenden Vorab-Metadaten-Pruefung im Export-Pfad (checkAudioExportFeasible)"
    - "Gespiegelte Sicherheitskonstante + Abgleichtest per Regex-Extraktion aus dem Quelltext der Quelle der Wahrheit, statt eines window.*-Exports nur fuer Testzwecke"
    - "Tabellengetriebene Invarianten-Tests (test.each) fuer mehrere strukturell gleiche Ablehnungsgruende"

key-files:
  created: []
  modified:
    - systems/migration/audio-export.js
    - tests/unit/audio-export.test.js

key-decisions:
  - "AUDIO_IMPORT_MAX_TOTAL_BYTES wird direkt von AUDIO_EXPORT_SAFE_RAW_BYTES abgeleitet (keine vierte unabhaengige Zahl) — vermeidet die Fehlkalibrierungsbauart, die als WR-03 bereits einmal aufgefallen ist."
  - "Die Dekodier-Attrappe im vm-Kontext aus dem Plan-Text (Task 3) war nicht erreichbar: top-level `const`-Deklarationen sind — anders als `function`-Deklarationen — im vm-Kontext KEINE Eigenschaften des Kontextobjekts. mockSaveSoundBlob dient wie geplant als Ersatz-Nachweis; die Abgleichtest-Konstante AUDIO_IMPORT_MAX_ENTRY_BYTES wird deshalb ebenfalls per Regex aus dem Quelltext gezogen statt aus dem vm-Kontext gelesen."
  - "Task 1 und Task 2 wurden im selben Schleifenkörper implementiert (Einzelgrenze direkt gefolgt vom Gesamtbudget), aber fuer die Commit-Historie sauber in zwei atomare Commits zerlegt — inklusive eines eigenstaendigen roten Zwischenzustands je Task, nicht nur eines gemeinsamen roten Vorlaufs."

patterns-established:
  - "Eine unterschlagene oder zu klein angegebene Groessenangabe in einer nicht vertrauenswuerdigen Importdatei wird durch eine zusaetzliche Schaetzung aus der tatsaechlichen Payload-Laenge kompensiert (Math.max-Prinzip) — anwendbar auf jede zukuenftige Base64-Import-Groessenpruefung in diesem Codebase."

requirements-completed: []

coverage:
  - id: D1
    description: "Ein übergroßer Eintrag wird vor der Dekodierung übersprungen und namentlich begründet"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Härtung (SAFE-01/T-12-01/T-12-02/T-12-03) SEC-07: Eintrag mit angegebener Groesse ueber der Einzelgrenze wird uebersprungen und benannt, base64ToBlob()/saveSoundBlob() laufen fuer ihn nicht"
        status: pass
    human_judgment: false
  - id: D2
    description: "Er kostet nur sich selbst — die übrigen Dateien werden importiert, es wird nicht geworfen"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Härtung (SAFE-01/T-12-01/T-12-02/T-12-03) SEC-07/D-02: ein einzelner uebergrosser Eintrag kostet nur sich selbst — die uebrigen werden importiert, kein Wurf"
        status: pass
    human_judgment: false
  - id: D3
    description: "Eine unterschlagene Größenangabe umgeht die Grenze nicht"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Härtung (SAFE-01/T-12-01/T-12-02/T-12-03) SEC-07: schaetzeAudioRohbytes() liefert das Maximum aus Groessenangabe und Base64-Schaetzung, wirft nie"
        status: pass
    human_judgment: false
  - id: D4
    description: "Das Gesamtbudget begrenzt auch viele Einträge unterhalb der Einzelgrenze; jeder übersprungene wird benannt"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Härtung (SAFE-01/T-12-01/T-12-02/T-12-03) SEC-07: Gesamtbudget — der vierte von vier 90-MiB-Eintraegen wird uebersprungen (Test D)"
        status: pass
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Härtung (SAFE-01/T-12-01/T-12-02/T-12-03) SEC-07: Gesamtbudget — bei fuenf 90-MiB-Eintraegen werden die letzten zwei einzeln benannt (Test E)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Einzelgrenze und MAX_AUDIO_BYTES_HARD stimmen überein (Abgleich gegen den Quelltext)"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "tests/unit/audio-export.test.js#importAudioExport — Abgleich und Reihenfolge-Invariante (SEC-07) SEC-07 Abgleich: Einzelgrenze stimmt mit MAX_AUDIO_BYTES_HARD aus soundboard-idb.js überein"
        status: pass
    human_judgment: false
  - id: D6
    description: "Mutationsnachweis: eine hinter die Dekodierung verschobene Prüfung lässt benannte Tests umfallen"
    requirement: "SAFE-01"
    verification:
      - kind: unit
        ref: "manuelle Mutation in systems/migration/audio-export.js (Einzelgrenzpruefung nach base64ToBlob() verschoben) — Test A fiel um (Grund-Assertion), zurueckgenommen; siehe Deviations/Vorgehen unten"
        status: pass
    human_judgment: false

duration: ~15min
completed: 2026-09-05
status: complete
---

# Phase 12 Plan 15: SEC-07 Audio-Import-Volumenbegrenzung Summary

**`importAudioExport()` prüft jetzt Einzelgröße UND Gesamtvolumen VOR jedem Base64-Decode — ein einzelner übergroßer oder viele mittelgroße Einträge frieren den Tab nicht mehr ein, ohne den restlichen Import zu blockieren.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 2 (`systems/migration/audio-export.js`, `tests/unit/audio-export.test.js`)
- **Commits:** 3

## Accomplishments

- **Einzelgrenze (Task 1):** `schaetzeAudioRohbytes(entry)` schätzt die Rohbyte-Größe eines Import-Eintrags VOR `base64ToBlob()` — als Maximum aus der (manipulierbaren) `entry.size`-Angabe und einer Schätzung aus der Base64-Zeichenkettenlänge. Eine neue Konstante `AUDIO_IMPORT_MAX_ENTRY_BYTES` (100 MB, gespiegelt aus `soundboard-idb.js` `MAX_AUDIO_BYTES_HARD`) wird in der Import-Schleife VOR dem Dekodier-Versuch geprüft. Ein übergroßer Eintrag landet benannt in `skipped`, die Funktion wirft nicht (D-02).
- **Gesamtbudget (Task 2):** Auch die Summe vieler Einträge unterhalb der Einzelgrenze ist jetzt begrenzt — `AUDIO_IMPORT_MAX_TOTAL_BYTES` (abgeleitet aus `AUDIO_EXPORT_SAFE_RAW_BYTES`, 300 MiB) wird laufend gegen die Summe der bereits eingeplanten Rohbytes geprüft. Ist das Budget erschöpft, wird JEDER weitere Eintrag einzeln benannt, die Schleife bricht nicht ab.
- **Abgleich + Invariante (Task 3):** Ein Testfall liest `MAX_AUDIO_BYTES_HARD` aus `soundboard-idb.js` UND `AUDIO_IMPORT_MAX_ENTRY_BYTES` aus `audio-export.js` per Regex direkt aus dem Quelltext und vergleicht sie — künftiges Auseinanderdriften wird sofort mit einer Fehlermeldung erkannt, die benennt, welche Seite nachzuziehen ist. Eine tabellengetriebene Invariante deckt alle drei Ablehnungsgründe (ID-Format, Einzelgrenze, Gesamtbudget) einheitlich ab, plus ein Reihenfolgenachweis: ein Eintrag mit fremdem ID-Format UND Übergröße wird mit dem ID-Grund abgelehnt (billigste Prüfung zuerst).

## Task Commits

Each task was committed atomically:

1. **Task 1: Einzelgrenze — kein Dekodieren vor der Größenprüfung** - `7d3499a` (feat)
2. **Task 2: Gesamtbudget — auch die Summe vieler mittelgroßer Einträge ist begrenzt** - `84adf12` (feat)
3. **Task 3: Abgleich gegen Drift und die Reihenfolge-Invariante** - `37cbceb` (test)

_Note: Task 1 and Task 2 share the same loop body in `importAudioExport()` — the two checks were implemented together (single-entry check immediately followed by total-budget check, both reading the same `schaetzeAudioRohbytes()` estimate) but split into two atomic commits by temporarily removing Task 2's pieces, verifying the Task-1-only state (38 tests passing), committing, then restoring Task 2's pieces and verifying again (41 tests passing) before its own commit. Each task still got its own genuine RED-before-GREEN cycle, not a shared one._

## Files Created/Modified

- `systems/migration/audio-export.js` — `schaetzeAudioRohbytes()` (neue Top-Level-Funktion, kein `window.*`-Export), `AUDIO_IMPORT_MAX_ENTRY_BYTES`, `AUDIO_IMPORT_MAX_TOTAL_BYTES`, zwei neue Prüfschritte in `importAudioExport()`'s Schleife zwischen ID-Whitelist und `base64ToBlob()`, JSDoc-Härtungsblock ergänzt
- `tests/unit/audio-export.test.js` — 11 neue Tests (A–F, Abgleich, 3× Invariante-Fälle via `test.each`, Reihenfolgenachweis) in/neben dem bestehenden `describe`-Block „importAudioExport — Härtung"

## Decisions Made

- `AUDIO_IMPORT_MAX_TOTAL_BYTES` leitet sich direkt von `AUDIO_EXPORT_SAFE_RAW_BYTES` ab statt eine vierte unabhängige Zahl einzuführen (Kalibrierungsschutz, vgl. WR-03).
- Die im Plan-Text vorgeschlagene "Dekodier-Attrappe im vm-Kontext" für Task 3 war technisch nicht erreichbar: top-level `const`-Deklarationen (anders als `function`-Deklarationen) werden von `vm.runInContext()` NICHT als Eigenschaften des Kontextobjekts exponiert. Das betraf sowohl den geplanten Dekodier-Mock als auch den ursprünglichen Plan, `AUDIO_IMPORT_MAX_ENTRY_BYTES` direkt aus dem vm-Kontext zu lesen — beide Stellen wurden stattdessen per Regex-Extraktion aus dem jeweiligen Quelltext gelöst (identische Technik wie beim bereits bestehenden `migration-wizard.js`-Quelltext-Beleg-Test). `mockSaveSoundBlob` dient wie im Plan vorgesehen als Ersatz-Beobachtungspunkt für "nicht geschrieben".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fehlerhafte Test-Assertion in Test B (D-02-Konformität) korrigiert**
- **Found during:** Task 1, erster Testlauf
- **Issue:** `await expect(async () => {...}).not.toThrow()` führt die übergebene async-Funktion aus, wartet aber nicht auf ihre Promise-Auflösung — die Zuweisung an `result` geschah nicht rechtzeitig, sodass `result` bei der nächsten Assertion `undefined` war (Testfehler, kein Produktionsfehler).
- **Fix:** Direkter `await importAudioExport(exportObj)`-Aufruf; ein rejectetes Promise hätte den `await` selbst fehlschlagen lassen, was als Wurf-Nachweis genügt.
- **Files modified:** `tests/unit/audio-export.test.js`
- **Verification:** Test B lief danach korrekt rot (implementierungsbedingt) und grün (nach dem Fix).
- **Committed in:** `7d3499a` (Task 1 commit)

**2. [Rule 1 - Bug] `AUDIO_IMPORT_MAX_ENTRY_BYTES` nicht per vm-Kontext lesbar (Abgleichtest)**
- **Found during:** Task 3, erster Testlauf
- **Issue:** `context.AUDIO_IMPORT_MAX_ENTRY_BYTES` war `undefined` — `const`-Deklarationen landen (anders als von der Design-Notiz für Funktionsdeklarationen beschrieben) nicht als Eigenschaften auf dem vm-Kontextobjekt.
- **Fix:** Beide Seiten des Abgleichs (`MAX_AUDIO_BYTES_HARD` und `AUDIO_IMPORT_MAX_ENTRY_BYTES`) werden per Regex direkt aus dem jeweiligen Quelltext extrahiert und eng ausgewertet (nur Ziffern/`*`/Leerzeichen zugelassen).
- **Files modified:** `tests/unit/audio-export.test.js`
- **Verification:** Abgleichtest lief grün; künstlich verursachter Drift (100→99 MB) ließ ihn kontrolliert umfallen mit einer Fehlermeldung, die die abweichende Seite benennt.
- **Committed in:** `37cbceb` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (beide Rule 1 — Testcode-Bugs, kein Produktionscode betroffen)
**Impact on plan:** Keine Scope-Änderung; beide Fixes betrafen ausschließlich die Testinfrastruktur dieses Plans.

## Rote Vorläufe und Mutationsnachweise (protokolliert)

- **Task 1 — Roter Vorlauf:** Vor der Implementierung schlugen Tests A und B mit falschen Zählwerten fehl (`imported: 1` statt `0`), Test C mit `typeof schaetzeAudioRohbytes === 'undefined'`.
- **Task 1 — Mutationsnachweis:** Die Einzelgrenzprüfung testweise hinter `base64ToBlob()` verschoben (innerhalb des `try`-Blocks) — Test A fiel mit einer falschen `grund`-Zeichenkette um (`"MUTATION: zu spaet geprueft"` statt einer größenbezogenen Begründung). Danach zurückgenommen, wieder grün (41/41 zu dem Zeitpunkt für die Härtungssuite).
- **Task 2 — Roter Vorlauf:** Budgetprüfung testweise auskommentiert — Tests D und E fielen mit `imported: 4`/`5` statt `3` um; Test F blieb unberührt grün (Kontrollgruppe).
- **Task 3 — Gezielte Brüche:** (a) `AUDIO_IMPORT_MAX_ENTRY_BYTES` von 100 auf 99 MB geändert → Abgleichtest fiel mit einer Fehlermeldung um, die die abweichende Seite benennt; zurückgenommen. (b) Ein Tabelleneintrag der Invariante verfälscht (`rejectedId` auf einen falschen Wert gesetzt) → der zugehörige Testfall fiel mit `toBeDefined()`-Fehler um; zurückgenommen.

## Reichweite des Fixes (ehrlich benannt)

Dieser Fix begrenzt **Dekodierung und Schreiben** — die beiden Stellen, an denen `importAudioExport()` tatsächlich Speicher alloziert (`atob()`/`Uint8Array` in `base64ToBlob()`, danach `saveSoundBlob()`). Er begrenzt **NICHT das Einlesen der Datei** durch den FileReader im Migrations-Wizard — dafür ist `AUDIO_IMPORT_MAX_BYTES` in `migration-wizard.js:568` zuständig (WR-03, Plan 12-16, außerhalb des Scopes dieses Plans). Beide Grenzen zusammen ergeben die vollständige Kette; dieser Plan schließt das Glied, das vorher ganz fehlte.

## Issues Encountered

None außer den oben dokumentierten Testcode-Deviationen.

## User Setup Required

None - keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- SEC-07 vollständig geschlossen: Einzelgrenze, Gesamtbudget, Schätzregel gegen unterschlagene Größenangaben, und Drift-Schutz für die gespiegelte 100-MB-Zahl sind alle testabgedeckt.
- `migration-wizard.js` und `soundboard-idb.js` bleiben unverändert — Plan 12-16 (WR-03, Wizard-seitige `AUDIO_IMPORT_MAX_BYTES`-Kalibrierung) kann unabhängig davon starten.
- Voller Suitenlauf, Playwright und `dist/`-Neubau bleiben Plan 12-17 (Welle 11) vorbehalten.

---
*Phase: 12-datensicherheit*
*Completed: 2026-09-05*
