---
status: complete
phase: 01-stabilisierung
source: [01-VERIFICATION.md]
started: 2026-06-12T14:05:00Z
updated: 2026-06-20T14:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. file://-Boot-Test (alle Tabs)

`dist/dnd-tracker-bundled.html` (oder `-optimized.html`) per Doppelklick (file://) öffnen, DevTools → Console prüfen, alle 9 Haupt-Tabs durchklicken.
expected: Keine roten Fehler in der Konsole; alle Tabs laden vollständig
result: pass
note: "2026-06-20: Erster Lauf zeigte alle Tabs funktional (TabRegistry rendert jeden Tab), aber rote Manifest-CORS-Fehler unter file:// + #autosave-toggle-Warnung → gefixt in cd75093 (Manifest nur unter http/https zur Laufzeit injiziert; getElementById). Re-Check vom Nutzer bestätigt: Konsole sauber, nur Info-Logs."

### 2. Persistenz >5 MB nach Browser-Neustart

Kampagne mit vielen Einträgen anlegen (>5 MB Gesamtgröße), Browser schließen, App neu öffnen.
expected: Alle Daten vorhanden; kein Datenverlust-Toast; kein RangeError in der Konsole
result: pass
note: "2026-06-20: ~6 MB Fülltest-Daten (60×100KB sessionNotes) → IDB-Fallback griff ('Daten aus IndexedDB geladen'), Daten nach komplettem Browser-Neustart vollständig da, kein RangeError. Nebenbefund Konsolen-Hygiene (Info-Meldungen rot als Error geloggt, #toast/#autosave-toggle-Warnungen) → gefixt in c029f11. _nextId-Selbstheilung arbeitete korrekt (Snippet nutzte Date.now()-IDs)."

### 3. LS/IDB-Konfliktpfad manuell auslösen

In DevTools localStorage-Key ohne `_ts` mit anderem Inhalt als IDB setzen, App neu laden.
expected: Kein RangeError in der Konsole; neuerer IDB-Stand wird geladen (kein stiller veralteter LS-Sieg)
result: pass
note: "2026-06-20: Deterministisch getestet — IDB-Record mit Marker 'IDB-NEUER-STAND', LS-Schatten 'VERALTETER-LS-STAND' ohne _ts, Reload → D.quickNotes === 'IDB-NEUER-STAND' (D-07 IDB-Vorrang greift), kein RangeError, Boot-Konsole sauber. (Erster Snippet-Versuch scheiterte an window.STORAGE_KEY=undefined in der Konsole — App-intern korrekt; Test-Artefakt, kein App-Bug.)"

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Beim >5-MB-Load erscheinen keine irreführenden roten Error-Logs für Normalverhalten"
  status: resolved
  reason: "UAT Test 2 (2026-06-20): IDB-Fallback lud die >5-MB-Daten korrekt (funktional pass), aber die Konsole zeigte rote 'Error'-Einträge für Erfolgs-/Selbstheilungs-Meldungen ('Daten aus IndexedDB geladen: null', 'ID/Data repairs performed') plus '#toast'- und '#autosave-toggle'-Warnungen aus save()/showToast()."
  resolution: "Commit c029f11 — DEBUG-Infos via log() statt ErrorHandler.log; Reparaturen als gelbe console.warn; legacy #toast + autosave-toggle via getElementById (bekannt-optional). Keine Save/Load-Logik geändert. Die _nextId-Reparatur selbst war korrekt (Test-Snippet nutzte Date.now()-IDs > _nextId — Selbstheilung hat funktioniert)."
  severity: minor
  test: 2
  artifacts: [utils/utilities.js, systems/spellslots/quick-roll.js, systems/spellslots/persistence.js, systems/avatars.js]
  missing: []

- truth: "Der file://-Boot ist frei von roten Konsolenfehlern"
  status: resolved
  reason: "UAT (2026-06-20): file://-Boot zeigte rote Fehler — statischer <link rel=manifest> per CORS blockiert (origin 'null'), 'Unsafe attempt to load URL', ERR_FAILED — sowie eine gelbe '[DOM] Element not found: #autosave-toggle'-Warnung. Alle Tabs renderten aber sauber (funktional ok)."
  resolution: "Commit cd75093 — statischen Manifest-Link aus build.py entfernt; registerServiceWorker() injiziert das Manifest nur unter http/https (PWA dort unverändert), unter file:// gar nicht → keine roten Fehler. init.js liest #autosave-toggle via getElementById statt $() → keine DEBUG-Warnung. Build exit 0, 448 Unit grün, statischer Manifest-Link im Bundle = 0."
  severity: minor
  test: 1
  artifacts: [build.py, core/init.js]
  missing: []
