---
status: partial
phase: 07-komfort-analyse
source: [07-VERIFICATION.md]
started: 2026-06-20T09:40:00Z
updated: 2026-06-20T09:40:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Echte Audio-Ausgabe
expected: MP3/OGG-Datei in den Soundboard-Tab importieren, eine Szene daraus bauen und abspielen — layered Loops sind hörbar, AudioContext resumt nach dem ersten User-Klick unter `file://`.
result: [pending]

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
