---
phase: 12-datensicherheit
reviewed: 2026-09-04T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - .gitignore
  - core/init.js
  - features/soundboard/soundboard-crud.js
  - features/soundboard/soundboard-idb.js
  - loader.js
  - systems/avatars.js
  - systems/file-backup/file-backup-manager.js
  - systems/migration/audio-export.js
  - systems/migration/migration-wizard.js
  - systems/spellslots/persistence.js
  - systems/undo.js
  - tests/build/test_build_deduplication.py
  - tests/e2e/features/soundboard.spec.js
  - tests/unit/audio-export.test.js
  - tests/unit/file-backup.test.js
  - tests/unit/full-export.test.js
  - tests/unit/migration-wizard.test.js
  - tests/unit/soundboard.test.js
  - tests/unit/stability.test.js
findings:
  critical: 0
  warning: 1
  info: 1
  total: 2
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-09-04
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Dies ist die erneute Prüfung nach den Lückenschluss-Plänen 12-09/12-10/12-11, die die vier
Befunde des vorherigen `12-REVIEW.md` (CR-01, CR-02, WR-01, WR-02) adressiert haben. Alle
vier wurden verifiziert und sind **korrekt behoben**, inklusive dediziertem
Regressionstest je Fund:

- **CR-01** (`wizard-skip` überschreibt frisch importierte Daten): `migration-wizard.js`
  löst `wizard-skip` ab Schritt 4 jetzt über denselben `window.location.reload()`-Pfad wie
  `wizard-close` aus (Zeile 650-653), und der Footer wird ab Schritt 4 zusätzlich per
  `showWizardStep()` ausgeblendet (Zeile 173-176). Regressionstests: `migration-wizard.test.js`
  „CR-01 Test A/B/C".
- **CR-02** (`readCampaignDataForBackup()` liefert bei fehlenden Daten die falsche aktive
  Kampagne): Stufe 3 prüft jetzt `campaignKey === aktiverBackupKey`, bevor `window.D`
  zurückgegeben wird (`file-backup-manager.js:412-421`). Fünf gezielte Regressionstests in
  `file-backup.test.js` (u. a. die Invariante „jede geschriebene Datei trägt nur die eigene
  Kennmarke") decken sowohl den Fehlerfall als auch die Gegenprobe „aktive Kampagne bekommt
  ihr Backup weiterhin" ab.
- **WR-01** (Audio-Datei in Haupt-Dropzone markiert falsches Element): `_processWizardFile()`
  löst jetzt explizit `#migration-wizard-audio-dropzone` auf, mit Fallback auf die
  übergebene Dropzone (`migration-wizard.js:434-441`). Regressionstests: „WR-01 Test D/E".
- **WR-02** (`pushUndo()` leert den Redo-Stack bei Serialisierungsfehler nicht):
  `redoStack.length = 0;` läuft jetzt auch im `catch`-Zweig vor dem `return`
  (`undo.js:23-28`). Regressionstests: „WR-02 Test J/K" in `stability.test.js`.

Der bereits in der Vorprüfung gelobte Gesamtzustand (durchdachtes Grabstein-Löschsystem,
atomare Mehr-Kampagnen-Backups, Whitelist-Sanitizing, verankerte Snapshot-Regex,
Peek-Parse-Pop bei Undo/Redo) bleibt unverändert solide. Bei dieser Prüfung wurde
zusätzlich der Größen-Rundlauf zwischen Audio-Export und -Import genauer nachgerechnet;
dabei kam ein bisher unentdecktes Inkonsistenz-Problem zutage (WR-03 unten), das den
Phasenanspruch „kein Pfad verliert Daten" für den Audio-Umzug bei großen Bibliotheken
punktuell unterläuft. Keine neuen Blocker gefunden.

## Warnings

### WR-03: Audio-Export-Größenlimit (300 MiB roh) und Audio-Import-Größenlimit (350 MiB Datei) sind inkonsistent — ein maximal großer, erfolgreich erstellter Export kann beim Reimport abgelehnt werden

**File:** `systems/migration/audio-export.js:30` (`AUDIO_EXPORT_SAFE_RAW_BYTES`),
`systems/migration/migration-wizard.js:568` (`AUDIO_IMPORT_MAX_BYTES`)

**Issue:**
`buildAudioExport()` erlaubt Audio-Bibliotheken bis `AUDIO_EXPORT_SAFE_RAW_BYTES = 300 *
1024 * 1024` (300 MiB **Rohbytes**, vor Base64-Kodierung) — begründet im Kommentar direkt
über der Konstante mit der V8-String-Obergrenze (~512 MiB) und dem Base64-Aufblähfaktor
4/3. Genau dieser Aufblähfaktor wird aber beim Import nicht gegengerechnet:
`_processWizardAudioFile()` prüft die tatsächliche **Datei**-Größe der (bereits
Base64-kodierten) JSON-Exportdatei gegen ein eigenes, unabhängig hartkodiertes Limit:

```js
// migration-wizard.js:568
const AUDIO_IMPORT_MAX_BYTES = 350 * 1024 * 1024;
if (file.size > AUDIO_IMPORT_MAX_BYTES) {
    showStatus('Die Audio-Datei ist zu groß und konnte nicht gelesen werden.', true);
    return;
}
```

Rechnung: 300 MiB Rohdaten = 314.572.800 Bytes. Base64 kodiert das auf
`ceil(314572800/3)*4 = 419.430.400` Bytes ≈ **400 MiB** (zzgl. minimalem JSON-Overhead für
Feldnamen/Struktur). Eine Audio-Bibliothek, die genau an der vom Export selbst als „sicher“
deklarierten Obergrenze liegt (z. B. drei bis vier Dateien nahe dem 100-MiB-Pro-Datei-Limit
aus `checkAudioFileSize()`), erzeugt damit eine Exportdatei von ~400 MiB — oberhalb des
350-MiB-Importlimits (367.001.600 Bytes). Der Nutzer bekommt beim Reimport exakt dieser
selbst erzeugten, gültigen Datei die Fehlermeldung „Die Audio-Datei ist zu groß und konnte
nicht gelesen werden“, obwohl `downloadAudioExport()` sie anstandslos erstellt und
angeboten hat.

Das ist kein *stiller* Datenverlust (der Fehler wird angezeigt), aber es unterläuft den
eigentlichen Zweck von Phase 12 für genau den Fall, für den die Größenprüfungen ersichtlich
mit Absicht so präzise kalibriert wurden: Bei einer großen, aber laut Exportlogik
„machbaren“ Audio-Bibliothek liefert der Umzugsweg eine Datei, die auf der Zielseite
grundlos abgelehnt wird — es gibt keinen alternativen Weg, diese Audiodateien zurück in die
App zu bekommen. Kein bestehender Test in `audio-export.test.js` oder
`migration-wizard.test.js` prüft den Rundlauf `downloadAudioExport()` →
`_processWizardAudioFile()` für eine Bibliothek nahe der 300-MiB-Grenze; alle
Größentests behandeln Export und Import unabhängig voneinander.

Zusätzlich: `AUDIO_IMPORT_MAX_BYTES` ist ein lokal in `_processWizardAudioFile()`
hartkodierter Magic-Number-Duplikat von `window.AUDIO_EXPORT_SAFE_RAW_BYTES` (das bereits
exportiert wird, siehe `audio-export.js:412`), statt daraus mit dem bekannten
Base64-Faktor abgeleitet zu werden — genau diese Duplizierung hat die Inkonsistenz
ermöglicht.

**Fix:** Das Importlimit aus der Export-Konstante ableiten statt unabhängig zu
duplizieren, mit Puffer für JSON-Struktur-Overhead:

```js
// migration-wizard.js — AUDIO_IMPORT_MAX_BYTES ableiten statt neu hartkodieren
const AUDIO_IMPORT_MAX_BYTES = Math.ceil(
    (window.AUDIO_EXPORT_SAFE_RAW_BYTES || 300 * 1024 * 1024) * 4 / 3
) + 10 * 1024 * 1024; // Base64-Aufblähfaktor + 10 MiB Puffer für JSON-Struktur
```

Ergänzend einen Regressionstest, der `buildAudioExport()` mit einer Bibliothek nahe
`AUDIO_EXPORT_SAFE_RAW_BYTES` aufruft, die resultierende (simulierte) Dateigröße gegen
`AUDIO_IMPORT_MAX_BYTES` prüft und so das Reimport-Versprechen für den worst case belegt.

---

## Info

### IN-01: `wizard-skip`-Kommentar zitiert nicht mehr existierenden alten Codepfad, kein funktionaler Mangel

**File:** `systems/migration/migration-wizard.js:643-654`

**Issue:** Kleinigkeit, keine Funktionsauswirkung: Der Fix-Kommentar über dem
`wizard-skip`-Handler erklärt ausführlich, warum ab Schritt 4 reload’t werden muss, verweist
aber nicht mehr explizit auf den (jetzt behobenen) alten Zustand aus CR-01 des vorherigen
Reviews, was das Nachvollziehen für zukünftige Leser ohne Zugriff auf `12-REVIEW.md`
(diese Datei wird überschrieben) leicht erschwert, sobald die Historie aus dem Blick fällt.
Rein dokumentarisch, keine Handlung erforderlich außer bei Gelegenheit.

**Fix:** Optional: kurzer Verweis auf den Git-Commit/Plan (`Plan 12-09`) ergänzen, falls
`12-REVIEW.md` künftig durch neuere Prüfungen ersetzt wird und der Kontext sonst verloren
ginge. Kein Blocker für den Merge.

---

_Reviewed: 2026-09-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
