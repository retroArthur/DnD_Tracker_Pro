---
status: testing
phase: 07-komfort-analyse
source: [07-VERIFICATION.md]
started: 2026-06-20T09:40:00Z
updated: 2026-06-20T10:05:00Z
---

## Current Test

number: 2
name: Crossfade beim Szenenwechsel
expected: |
  Während eine Szene läuft, per Alt+Shift+N (oder Play einer anderen Slot-Szene) wechseln —
  der alte Loop blendet über ~2 s aus, der neue ein, hörbar smooth.
awaiting: user response

## Tests

### 1. Echte Audio-Ausgabe
expected: MP3/OGG-Datei in den Soundboard-Tab importieren, eine Szene daraus bauen und abspielen — layered Loops sind hörbar, AudioContext resumt nach dem ersten User-Klick unter `file://`.
result: pass
note: "Bestätigt vom Nutzer (2026-06-20). Beim Testen 3 Bugs gefunden+gefixt: Doppel-Import (75aadfe), Audio läuft nach Szene-Löschen weiter (b85dbe1), Volume-Regler nicht live (801ed48). Audio-Ausgabe, Import (genau 1 Eintrag), Stop-beim-Löschen und Live-Volume verifiziert."

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
passed: 1
issues: 0
pending: 3
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

- truth: "Beim Löschen/Ändern der gerade spielenden Szene stoppt das Soundboard-Audio"
  status: resolved
  reason: "User reported: nach dem Löschen der Szene (Mülltonnen-Button) läuft der Sound im Hintergrund weiter, auch beim Tab-Wechsel."
  severity: major
  test: 1
  root_cause: "ECHTE Ursache (nach User-Klarstellung): SZENE löschen, nicht Kampagne. deleteScene() entfernte die Szene aus D, rief aber stopAllTracks() nie auf → der laufende Crossfade-Loop spielte weiter (Web Audio überlebt das Entfernen aus D/DOM)."
  resolution: "Commit b85dbe1 — Player-Helfer stopAllTracksIfScene(sceneId)+getActiveSceneId(); deleteScene/removeTrackFromScene/removeAudioFile stoppen das Audio der betroffenen Szene. 3 Unit-Tests für die Verdrahtung. (Frührer Fix 2333356 patchte Kampagne/Restore/Import-Pfade — korrekte Defensive, aber NICHT der gemeldete Auslöser.)"
  artifacts: [features/soundboard/soundboard-player.js, features/soundboard/soundboard-crud.js, tests/unit/soundboard-loop.test.js]
  missing: []
