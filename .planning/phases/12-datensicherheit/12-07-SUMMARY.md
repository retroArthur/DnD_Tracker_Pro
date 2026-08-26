---
phase: 12-datensicherheit
plan: 07
subsystem: persistence-migration
tags: [testing, indexeddb, base64, migration, jest, playwright, safe-06]

# Dependency graph
requires:
  - phase: 12-datensicherheit (12-01)
    provides: "systems/migration/audio-export.js — buildAudioExport()/importAudioExport(), Machbarkeitspruefung"
  - phase: 12-datensicherheit (12-02)
    provides: "Weg B: eigener Audio-Download-Button im Divergenz-Banner (download-audio-export)"
  - phase: 12-datensicherheit (12-06)
    provides: "Grabstein-Loeschung; deleteSoundBlob() bleibt der harte Loeschweg, den der Rundlauf-Test braucht"
provides:
  - "tests/unit/stability.test.js: Neustart-Seite des IDB-only-Pfads (Lesen aus IndexedDB bei leerem localStorage) plus Quelltext-Beleg"
  - "tests/unit/full-export.test.js: importFullExport()-Gegenseite inkl. Wuerfel-Favoriten, Versionsstempel und fuenf Ablehnungsfaellen"
  - "tests/e2e/features/soundboard.spec.js: Audio-Rundlauf Export -> harte Loeschung -> Neustart -> Import -> dekodierbare Datei"
  - "systems/migration/audio-export.js: downloadAudioExport() zeigt den Wartehinweis erst nach bestandener Machbarkeitspruefung"
affects: []

# Actuals (#2632)
actuals:
  tokens: 8798
  tasks: 5
  commits: 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verhaltenssimulation IMMER zusammen mit einem Quelltext-Beleg gegen die echte Produktionsdatei — eine Simulation ohne Beleg prueft nur den Testcode (T-12-22)"
    - "Echte Produktionsfunktion per new Function() aus der Quelldatei in den Test heben (loadRealResolveStorageConflict), statt die Konfliktlogik nachzubauen"
    - "Neustart (page.reload()) zwischen Loeschung und Import erzwingen, wenn ein Modul-Cache (_bufferCache) einen Rundlauf faelschlich gruen faerben koennte (T-12-23)"
    - "Dauer statt sampleRate/length als Assertion nach decodeAudioData — der Decoder resampelt auf die AudioContext-Rate, die Dauer ist die resampling-unabhaengige Groesse"
    - "Verhaltenstest mit Spy statt Quelltext-Grep, wenn eine Codezeile bestehen bleibt und sich nur ihre Position/Bedingung aendert"

key-files:
  created: []
  modified:
    - tests/unit/stability.test.js
    - tests/unit/full-export.test.js
    - tests/e2e/features/soundboard.spec.js
    - tests/unit/audio-export.test.js
    - systems/migration/audio-export.js
    - .planning/phases/12-datensicherheit/12-VALIDATION.md

key-decisions:
  - "Jede der drei Testluecken wurde nach dem Schliessen per Mutation gegengeprueft (Produktionscode absichtlich kaputtgemacht, Fehlschlag beobachtet, zurueckgenommen) — ohne diesen Schritt waere unbewiesen, dass die neuen Tests ueberhaupt etwas halten koennen"
  - "resolveStorageConflict wird aus quick-roll.js in den Test geladen statt nachgebaut; ein nachgebauter Konfliktloeser haette exakt die Beweiskraft-Luecke gehabt, die T-12-22 beschreibt"
  - "Die Assertion auf sampleRate/length im Audio-Rundlauf wurde durch eine Dauer-Assertion ersetzt, nachdem der erste Lauf 48000 statt 44100 lieferte — decodeAudioData resampelt auf die Kontext-Rate; die urspruengliche Assertion haette nur die Hardware des Testrechners gemessen"
  - "Wartehinweis-Fix (Abweichung, vom Nutzer genehmigt): der Abbruch bleibt in buildAudioExport(), der Aufrufer baut die Fehlermeldung NICHT nach — genau eine Quelle fuer den Meldungstext"
  - "Manuelle Pruefung nur zur Haelfte abgenommen und exakt so verzeichnet: (a) Warnschwelle verifiziert, (b) Tab-Gesundheit unterhalb 300 MiB offen; Annahme A1 bleibt unverifiziert"

patterns-established:
  - "Mutations-Gegenprobe als Standardabschluss beim Schliessen einer Testluecke: Produktionscode kaputtmachen, Fehlschlag der neuen Assertion beobachten, zuruecknehmen, sauberen git-Status belegen"

requirements-completed: [SAFE-06]
status: complete
---

# Phase 12 Plan 07: Randfälle der Datensicherheit schließen Summary

Die drei Testlücken, die diese Fehlerklasse verdeckt haben, sind geschlossen — der >5-MB-Pfad wird
jetzt auch von der Neustart-Seite gelesen, der Export auch von der Import-Seite, und der
Audio-Rundlauf endet mit einer nachweislich dekodierbaren Datei in der Szene.

## Was gebaut wurde

| Task | Ergebnis | Commit |
| ---- | -------- | ------ |
| 1 | `stability.test.js`: Neustart mit leerem localStorage liest die Kampagne byte-gleich aus IndexedDB zurück; Quelltext-Beleg für den Ladepfad; Stale-Shadow ohne `_ts` mit echter `resolveStorageConflict` | `9066b6d` |
| 2 | `full-export.test.js`: `importFullExport(buildFullExport())` inkl. Würfel-Favoriten, Kampagnen-Index, Versionsstempel, SRD-Abgrenzung und fünf Ablehnungsfällen | `02b1572` |
| 3 | `soundboard.spec.js`: Audio-Rundlauf über Export, harte Löschung, Neustart, Import — endet mit `decodeAudioData` | `ba5f660` |
| 4 | Menschliche Sichtung der Base64-Obergrenze — **halb abgenommen**, siehe unten | — |
| 4b | Abweichung: Wartehinweis erscheint erst nach bestandener Machbarkeitsprüfung | `19c760f` |

## Die drei Nähte im Einzelnen

**Task 1 — der Neustart.** Die Sektion `5MB IDB-only Roundtrip (STAB-05)` prüfte bisher nur das
Schreiben: IDB-Write erfolgt, localStorage-Schatten wird entfernt. Ob nach einem Neustart überhaupt
jemand die Daten von dort zurückholt, prüfte niemand — genau diese fehlende Hälfte hat `DEBT-17`
überleben lassen. Neu: der Zustand nach dem IDB-Zweig von `saveImmediate()` wird hergestellt (Daten
in IDB, weder `key` noch `key + '_ts'` in localStorage), dann läuft der Ladepfad aus `quick-roll.js`
nach — `StorageAPI.get()` liefert `null`, der `loadFromIndexedDBFallback`-Zweig greift, die
Zeichenkette kommt byte-gleich zurück.

Der begleitende Quelltext-Beleg belegt drei Dinge an der echten Quelle: dass der `!s`-Zweig den
IDB-Fallback ruft, dass `loadFromIndexedDBFallback` in `persistence.js` auf oberster Ebene deklariert
ist (nur dann findet `window.loadFromIndexedDBFallback` sie im gebündelten Classic-Script — eine
explizite `window.`-Zuweisung gibt es dafür nicht), und dass der LS-Schatten erst **nach** dem
bestätigten IDB-Write entfernt wird.

**Task 2 — die Import-Gegenseite.** `buildFullExport()` war geprüft, `importFullExport()` nicht —
dabei ist der Import der Pfad, auf dem beim einmaligen Umzug tatsächlich Daten ankommen. Beide
Funktionen kommen aus der echten `systems/migration/full-export.js` (vm-Kontext), kein Nachbau.
Geprüft: Kampagnendaten unverändert, Index wiederhergestellt, Würfel-Favoriten unter
`APP_CONFIG.DICE_FAV_KEY` (der WR-04-Pfad, der sonst still verlorenginge), Versionsstempel aus
`APP_CONFIG.VERSION`, älterer Stempel läuft durch `migrateData` je Kampagne, SRD-Strip bleibt auch
beim Import wirksam. Dazu die fünf Ablehnungsfälle — und in jedem die Zusatzassertion, dass **vor**
dem Wurf kein einziger Kampagnen-Key geschrieben wurde.

**Task 3 — der Audio-Rundlauf.** Die bestehenden Soundboard-Tests benutzen ein 44-Byte-WAV ohne
Samples; damit lässt sich nichts dekodieren, und genau deshalb prüfte bisher niemand, ob eine Datei
den Base64-Rundlauf als *abspielbare* Datei übersteht. Neu: `makeWavBuffer(4410)` erzeugt echtes
PCM (0,1 s Stille). Ablauf: Import → Szene → `buildAudioExport()` → `deleteSoundBlob()` →
`page.reload()` → `importAudioExport()`. Der Neustart ist die Pointe (T-12-23): er leert
`_bufferCache` in `soundboard-player.js`, der sonst einen alten AudioBuffer zurückgäbe und den Test
fälschlich grün färbte.

## Beweiskraft: jede neue Assertion wurde per Mutation gegengeprüft

`T-12-22` verlangt, dass kein Test nur sich selbst prüft. Nach dem Grün-Werden wurde deshalb jeweils
der **Produktionscode** absichtlich beschädigt und der Fehlschlag beobachtet:

| Mutation im Produktionscode | Beobachteter Fehlschlag |
| --------------------------- | ----------------------- |
| `StorageAPI.remove(key)` vor `await saveToIndexedDBFallback()` gezogen (`persistence.js`) | Quelltext-Beleg (Task 1) schlägt fehl |
| `StorageAPI.setJSON(APP_CONFIG.DICE_FAV_KEY, …)` entfernt (`full-export.js`) | 2 Tests aus Task 2 schlagen fehl |
| `atob(base64).slice(0, 2000)` in `base64ToBlob` (`audio-export.js`) | Dauer fällt von 0,10 s auf 0,022 s, Task-3-Test schlägt fehl |
| Wartehinweis-Toast ganz abgeschaltet (`audio-export.js`) | Regressionswächter aus 4b schlägt fehl |

Alle Mutationen wurden zurückgenommen; `git diff` gegen die betroffenen Quelldateien war danach
jeweils leer.

## Abweichungen vom Plan

### [Rule 1 – Bug, vom Nutzer genehmigt] Wartehinweis versprach Arbeit, die nie begann

- **Gefunden bei:** Task 4 (menschliche Sichtung)
- **Problem:** `downloadAudioExport()` zeigte „Audio-Export wird erstellt — bei großen Bibliotheken
  dauert das einen Moment" **unbedingt** als Erstes; die Größenprüfung schlug unmittelbar danach in
  `buildAudioExport()` zu. Beide Toasts fielen in dieselbe Sekunde: erst ein Versprechen, dann ein
  Fehler.
- **Fix:** `getAudioExportSummary()` läuft zuerst (reine Metadaten, lädt keinen Blob); der
  Wartehinweis erscheint nur bei `feasible === true`. Der `throw` bleibt in `buildAudioExport()` —
  die Fehlermeldung mit Größe, Dateizahl und Namen behält damit **genau eine Quelle** und wird im
  Aufrufer nicht nachgebaut.
- **Tests:** zwei Verhaltenstests mit `showToast`-Spy in `tests/unit/audio-export.test.js`, bewusst
  **kein** Quelltext-Grep: die Toast-Zeile existiert weiterhin, nur Position und Bedingung ändern
  sich — ein Grep auf ihren Text hätte vor *und* nach dem Fix bestanden.
- **Ehrlich zum Testzustand:** Fall 1 (zu große Bibliothek → kein Wartehinweis) war vor dem Fix
  **rot** und ist danach grün. Fall 2 (machbare Bibliothek → Hinweis erscheint, und zwar vor der
  Erfolgsmeldung) war schon vorher grün; er ist ein Regressionswächter, kein RED-Test — dass er
  trägt, zeigt die Mutation oben.
- **Dateien:** `systems/migration/audio-export.js`, `tests/unit/audio-export.test.js`
- **Commit:** `19c760f`

### [Form, nicht Verhalten] Lokale statt `window.`-Bindung

Die abgestimmte Beschreibung sagte „`window.getAudioExportSummary()` zuerst aufrufen". Implementiert
ist der Aufruf der **modul-lokalen** Funktion `getAudioExportSummary()` — dasselbe Funktionsobjekt,
das die Datei am Ende als `window.getAudioExportSummary` exportiert. Verhalten identisch; die lokale
Bindung kann nicht durch Export-Reihenfolge brechen. Genannt, weil es von der wörtlichen Vorgabe
abweicht.

### Assertion korrigiert (Task 3)

Der erste Lauf des Rundlauf-Tests scheiterte an `expect(sampleRate).toBe(44100)` → erhalten: 48000.
Ursache ist kein Fehler im Rundlauf: `decodeAudioData` resampelt auf die Rate des AudioContext. Die
Assertion hätte die Audio-Hardware des Testrechners gemessen, nicht die Datenintegrität. Ersetzt
durch eine Dauer-Assertion (0,09 s < d < 0,12 s), die resampling-unabhängig ist — und die, wie die
Mutation oben zeigt, eine abgeschnittene Nutzlast zuverlässig fängt.

## Offene manuelle Prüfung (Task 4 — bewusst nur halb abgenommen)

Der Checkpoint zerfällt in zwei getrennt prüfbare Hälften. **Nur eine ist abgenommen.**

**(a) Die Warnschwelle greift oberhalb von 300 MiB — ✅ verifiziert.** Der Nutzer hat im echten
Browser (`dist/dnd-tracker-bundled.html`) mit einem `window.listSoundBlobs`-Override zwei Dateien à
200 MiB vorgetäuscht. Beobachtet: Toast „Audio-Export fehlgeschlagen: Audio-Bibliothek zu groß für
Export: 400.0 MB von 2 Dateien — Export übersprungen, betroffen: gross-1.wav, gross-2.wav",
passender Konsolenfehler aus `buildAudioExport()`, **keine** Datei erzeugt. Quellenseitig bestätigt:
der `throw` steht in `buildAudioExport()`, der Anchor entsteht und klickt erst danach in
`downloadAudioExport()` — auf diesem Pfad *kann* keine Datei entstehen. Die Machbarkeitsprüfung läuft
vor dem ersten Kodierschritt, wie `12-VALIDATION.md` es verlangt.

**(b) Ein echtes Tab bleibt *unterhalb* von 300 MiB gesund — ❌ nicht verifiziert.** Das braucht eine
echte Bibliothek aus ~4 großen Audiodateien, weil Speicherdruck im Renderer-Prozess geprüft wird;
kein Konsolen-Trick ersetzt das. Der Nutzer hat sich entschieden, die Dateien heute nicht
zusammenzutragen. **Recherche-Annahme A1 bleibt damit unverifiziert**, der Eintrag in
`12-VALIDATION.md` § Manual-Only Verifications bleibt **offen**.

### So lässt sich (b) später nachholen

1. `dist/dnd-tracker-bundled.html` per Doppelklick öffnen, Soundboard-Tab.
2. Mehrere große Audiodateien importieren, bis die Bibliothek knapp **unter** 300 MiB liegt
   (Einzeldatei-Obergrenze 100 MB, also mindestens vier Dateien).
3. Banner-Button **„Zum App-Umzug"** klicken (`migration-wizard.js:600` — der einzige Auslöser; einen
   Einstellungs-Eintrag dafür gibt es nicht). Erwartung: Haupt-Export lädt, ein Tab mit der
   PWA-Platzhalter-URL öffnet sich, die Hinweisleiste weicht dem **Divergenz-Banner**.
4. Im Divergenz-Banner den eigenen Button „Audio-Datei herunterladen (N Audiodateien (X MB))"
   klicken (`migration-wizard.js:681`). Erwartung: Wartehinweis, dann die Datei; der Tab bleibt
   bedienbar und stürzt nicht ab.
5. Für einen zweiten Durchgang reicht `sessionStorage.removeItem('migration-hint-shown')` **nicht** —
   die Hinweisleiste erscheint nur, solange `migration-divergence-since` fehlt
   (`migration-wizard.js:765`):
   ```js
   sessionStorage.removeItem('migration-hint-shown');
   localStorage.removeItem('migration-divergence-since');
   location.reload();
   ```
6. Wird der Tab schon deutlich unter 300 MiB unruhig oder stürzt ab: melden — dann ist die
   Warnschwelle zu hoch angesetzt und gehört gesenkt.

## Bekannter Restfehler (nicht behoben, bewusst)

Bei **leerer** Bibliothek zeigt `downloadAudioExport()` weiterhin den Wartehinweis und kehrt danach
still zurück (kein Download, kein weiterer Toast) — dieselbe Klasse „Versprechen ohne Arbeit" wie der
behobene Fall. Unverändert gelassen, weil die abgestimmte Bedingung ausdrücklich `feasible` lautete
und nicht `feasible && hasContent`, und weil der Pfad aus der UI nicht erreichbar ist: der
Audio-Button rendert nur bei `hasContent === true` (`_renderAudioDownloadButton()`). Genannt statt
still behoben, damit die Entscheidung sichtbar bleibt.

## Suiten-Stand

| Suite | Basislinie | Nach diesem Plan |
| ----- | ---------- | ---------------- |
| Jest | 705 → 717 | **719 passed** (29 Suites) |
| pytest `tests/build` | 24 | **24 passed** |
| Playwright | 320 / 2 skipped | **321 passed / 2 skipped** |
| `python build.py` | grün | **grün**, 124/124 Module |

Netto +14 Jest-Tests (3 Task 1, 9 Task 2, 2 Abweichung), +1 Playwright-Test. `dist/` wurde nach dem
Produktionscode-Fix neu gebaut, der ausgelieferte Bundle entspricht dem Quellstand.

## Erfüllte Wahrheiten aus dem Plan

- ✅ Ein Save über 5 MB landet in IndexedDB, und ein simulierter Neustart liest die Daten von dort
  zurück — plus Quelltext-Beleg, dass der echte Ladepfad das tut.
- ✅ Ein Export lässt sich in derselben Fassung wieder importieren; Kampagnen, Index und
  Würfel-Favoriten kommen an.
- ✅ Ein Audio-Rundlauf über Export, Neustart und Import endet mit einer abspielbaren Datei in der
  Szene (`decodeAudioData`, Dauer 0,1 s).
- ✅ Die volle Suite ist grün und liegt nicht unter der Basislinie.
- ⚠️ Die menschliche Sichtung der Base64-Obergrenze ist **zur Hälfte** abgenommen: (a) ja, (b) offen.

## Self-Check: PASSED

Alle in dieser Zusammenfassung genannten Dateien existieren auf der Platte, alle vier
Commit-Hashes (`9066b6d`, `02b1572`, `ba5f660`, `19c760f`) sind in `git log` auffindbar.
