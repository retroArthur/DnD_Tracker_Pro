---
status: testing
phase: 07-komfort-analyse
source: [07-VERIFICATION.md]
started: 2026-06-20T09:40:00Z
updated: 2026-06-20T10:05:00Z
---

## Current Test

number: 1
name: Echte Audio-Ausgabe
expected: |
  Soundboard-Tab öffnen, MP3/OGG-Datei importieren, Szene daraus bauen und abspielen —
  layered Loops sind hörbar, AudioContext startet nach dem ersten User-Klick unter file://.
awaiting: user response

## Tests

### 1. Echte Audio-Ausgabe
expected: MP3/OGG-Datei in den Soundboard-Tab importieren, eine Szene daraus bauen und abspielen — layered Loops sind hörbar, AudioContext resumt nach dem ersten User-Klick unter `file://`.
result: [pending]
note: "Beim Setup gefundener Doppel-Import-Bug (eine Datei → zwei Einträge) behoben in Commit 75aadfe (file input feuerte input+change → doppelter importAudioFile). Nach Reload des frischen Builds neu testen — Import sollte jetzt genau einen Eintrag erzeugen; danach Audio-Ausgabe prüfen."

### 2. Crossfade beim Szenenwechsel
expected: Während eine Szene läuft, per Alt+Shift+2 (oder Klick) auf eine andere Slot-Szene wechseln — der alte Loop blendet über ~2 Sekunden aus, der neue ein, hörbar smooth (linearRampToValueAtTime).
result: [pending]

### 3. Lautstärkeregler-Persistenz
expected: Track-Volume-Slider im Soundboard-Tab bewegen, Seite neu laden — der Slider-Wert ist in `D.soundboard.scenes` persistiert und wird nach Reload korrekt angezeigt.
result: [pending]

### 4. AudioContext resume nach Suspend
expected: App längere Zeit offen lassen (AudioContext geht in `suspended`), dann eine Szene abspielen — `getAudioContext()` ruft `.resume()` auf, kein still-stummer Kontext.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

- truth: "Ein einzelner Audio-Import erzeugt genau einen Eintrag in der Audio-Bibliothek"
  status: resolved
  reason: "User reported: Es wird immer doppelt importiert — eine Datei erscheint zweimal (gleicher Name + 87.6 KB)."
  severity: major
  test: 1
  root_cause: "<input type=file> feuert input+change; EventDelegation dispatcht die data-action auf beiden → importAudioFile lief zweimal → zwei audioBlobs-Records (distinkte Zufalls-IDs)."
  resolution: "Commit 75aadfe — Handler 'soundboard-file-change' nur auf 'change' reagieren + input.value reset. Unit- + E2E-Regression (toBe(1)) ergänzt."
  artifacts: [ui/actions/system-actions.js, tests/unit/soundboard.test.js, tests/e2e/features/soundboard.spec.js]
  missing: []
