---
status: partial
phase: 01-stabilisierung
source: [01-VERIFICATION.md]
started: 2026-06-12T14:05:00Z
updated: 2026-06-12T14:05:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. file://-Boot-Test (alle Tabs)

`dist/dnd-tracker-bundled.html` (oder `-optimized.html`) per Doppelklick (file://) öffnen, DevTools → Console prüfen, alle 9 Haupt-Tabs durchklicken.
expected: Keine roten Fehler in der Konsole; alle Tabs laden vollständig
result: [pending]

### 2. Persistenz >5 MB nach Browser-Neustart

Kampagne mit vielen Einträgen anlegen (>5 MB Gesamtgröße), Browser schließen, App neu öffnen.
expected: Alle Daten vorhanden; kein Datenverlust-Toast; kein RangeError in der Konsole
result: [pending]

### 3. LS/IDB-Konfliktpfad manuell auslösen

In DevTools localStorage-Key ohne `_ts` mit anderem Inhalt als IDB setzen, App neu laden.
expected: Kein RangeError in der Konsole; neuerer IDB-Stand wird geladen (kein stiller veralteter LS-Sieg)
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
