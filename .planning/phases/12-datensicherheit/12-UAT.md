---
status: testing
phase: 12-datensicherheit
source: 12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md, 12-04-SUMMARY.md, 12-05-SUMMARY.md, 12-06-SUMMARY.md, 12-07-SUMMARY.md, 12-VERIFICATION.md (2. Re-Verifikation, 2026-09-04)
started: 2026-08-26T17:40:00Z
reopened: 2026-09-04T00:00:00Z
updated: 2026-09-04T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 28
name: Echte Audio-Bibliothek knapp UNTER 300 MiB — Export blockiert den Browser-Tab nicht
expected: |
  Wartehinweis erscheint, die Datei wird angeboten, der Tab bleibt bedienbar und
  stuerzt nicht ab. Wird der Tab schon deutlich unter 300 MiB unruhig, ist die
  Warnschwelle zu hoch angesetzt und gehoert gesenkt.
awaiting: user response

**Wiedereroeffnet am 2026-09-04.** Die Runde 12-01..12-07 war mit 27/27 bestanden
abgeschlossen (Status `resolved`, Eintraege unten unveraendert erhalten). Die
2. Re-Verifikation (`12-VERIFICATION.md`, Status `human_needed`, 8/8 must-haves)
macht genau einen menschlichen Pruefpunkt erneut faellig — Punkt 28. Er ist der
einzige Grund, warum die Phase nicht auf `passed` steht.

## Vorbedingungen dieser Sitzung

- `verify:pre`-Gate `api-coverage` schlug blockierend an, wurde nach Prüfung als
  Fehlalarm übergangen (Nutzerentscheidung). Beleg und Korrektur stehen in
  `12-VERIFICATION.md` § Acknowledged Gaps.
- `dist/dnd-tracker-optimized.html` war vom 2026-08-18 und enthielt keine
  Phase-12-Korrekturen. Vor dem UAT neu gebaut; beide Bundles sind jetzt aktuell.
- Playwright-MCP steht in dieser Sitzung nicht zur Verfügung — die automatische
  UI-Verifikation fällt planmäßig auf manuelle Prüfpunkte zurück.
- Die App-Instanz des Nutzers ist leer (keine Kampagnen, keine Audiodateien).
  Tests 2 und 3 brauchen deshalb vorher angelegte Testdaten.

## Tests

### 1. Wartehinweis erscheint nicht mehr bei zu großer Bibliothek
expected: Bei einer Bibliothek über 300 MiB erscheint nur die Fehlermeldung, nicht mehr zusätzlich der grüne Hinweis "Audio-Export wird erstellt"
result: pass

### 2. Datei-Backup sichert alle Kampagnen, ohne dass sie sich überschreiben
expected: Mit zwei angelegten Kampagnen schreibt ein Datei-Backup für jede eine eigene Momentaufnahme. Zwei Kampagnen, deren Namen sich auf denselben Dateinamen normalisieren (z. B. "Die Tiefen" und "Die/Tiefen"), erhalten unterscheidbare Dateinamen statt sich gegenseitig zu überschreiben
result: pass

### 3. Umzugs-Hinweis erscheint nicht bei vorhandenen Daten
expected: Mit angelegten Kampagnendaten erscheint die Hinweisleiste "Die D&D Tracker App ist jetzt als installierbare Web-App verfügbar" beim Neuladen NICHT mehr — auch nicht im IndexedDB-Modus oder bei gesetztem STORAGE_KEY_OVERRIDE
result: pass
note: |
  Beobachtetes Verhalten korrekt (Leiste blieb aus). Der Nutzer merkte an, dass
  sie auch nach einem reinen SRD-Zauber-Import ausbleibt — das führte zur
  Entdeckung von G-12-3: der Inhalts-Check zählt nur drei von zwölf Sammlungen.
  Der Test selbst ist bestanden; die Lücke daneben ist separat als Gap erfasst.

### 4. Audio-Datei kommt über einen eigenen Button im Divergenz-Banner
expected: Nach ausgelöstem Umzug zeigt das Divergenz-Banner einen eigenen Button "Audio-Datei herunterladen" mit Datei- und Größenvorschau. Bei leerer Bibliothek erscheint dieser Button gar nicht
result: pass

### 5. buildAudioExport() sammelt alle IDB-Audiodateien als Base64 plus die vollständige Würfelstatistik
expected: siehe 12-01 Coverage D1
result: pass
source: automated
coverage_id: D1

### 6. importAudioExport() schreibt Dateien zurück nach IndexedDB, lehnt fremde Export-Typen ab
expected: siehe 12-01 Coverage D2
result: pass
source: automated
coverage_id: D2

### 7. Über 300 MiB bricht der Export benannt ab, BEVOR ein Blob geladen oder kodiert wird
expected: siehe 12-01 Coverage D3
result: pass
source: automated
coverage_id: D3

### 8. Import lehnt Übermengen ab (>500 Dateien), überspringt fremdformatige blobIds
expected: siehe 12-01 Coverage D4
result: pass
source: automated
coverage_id: D4

### 9. window._doBackup ist direkt testbar (Testbarkeits-Voraussetzung für SAFE-02)
expected: siehe 12-01 Coverage D5
result: pass
source: automated
coverage_id: D5

### 10. localStorage-Quota-Fallback (QuotaExceededError) fällt auf IndexedDB zurück
expected: siehe 12-01 Coverage D6
result: pass
source: automated
coverage_id: D6

### 11. downloadAudioExport() erzeugt genau einen Anchor-Download bei gefüllter Bibliothek
expected: siehe 12-02 Coverage D1
result: pass
source: automated
coverage_id: D1

### 12. Anchor wird vor dem Klick an document.body angehängt und danach entfernt
expected: siehe 12-02 Coverage D2
result: pass
source: automated
coverage_id: D2

### 13. Erfolgs-Toast behauptet nur "angeboten", nie mehr unbedingt "heruntergeladen"
expected: siehe 12-02 Coverage D3
result: pass
source: automated
coverage_id: D3

### 14. startMigrationFlow() löst downloadAudioExport() nicht mehr automatisch aus (Weg B)
expected: siehe 12-02 Coverage D4
result: pass
source: automated
coverage_id: D4

### 15. findMissingSceneAudio() benennt Szenen mit unauflösbaren blobIds
expected: siehe 12-02 Coverage D6
result: pass
source: automated
coverage_id: D6

### 16. undo()/redo() peeken und parsen VOR dem Stack-Pop — Parse-Fehler lässt Stacks unverändert
expected: siehe 12-05 Coverage D1
result: pass
source: automated
coverage_id: D1

### 17. Ein erfolgreicher Undo-Vorgang verschiebt genau einen Eintrag vom Undo- auf den Redo-Stack
expected: siehe 12-05 Coverage D2
result: pass
source: automated
coverage_id: D2

### 18. pushUndo() prüft Serialisierbarkeit vor dem Push — zirkuläres window.D erzeugt keinen Stack-Eintrag
expected: siehe 12-05 Coverage D3
result: pass
source: automated
coverage_id: D3

### 19. registerUndoHook()/_notifyUndoHooks(): Hooks feuern nach erfolgreichem Undo/Redo
expected: siehe 12-05 Coverage D4
result: pass
source: automated
coverage_id: D4

### 20. Toter autosave-toggle-Codepfad an allen vier Fundstellen entfernt
expected: siehe 12-05 Coverage D5
result: pass
source: automated
coverage_id: D5

### 21. Undo/Redo bleibt in einer echten Browser-Session funktionsfähig
expected: siehe 12-05 Coverage D6
result: pass
source: automated
coverage_id: D6

### 22. softDeleteSoundBlob() versieht den Eintrag mit einem Grabstein; listSoundBlobs() filtert ihn
expected: siehe 12-06 Coverage D1
result: pass
source: automated
coverage_id: D1

### 23. restoreSoundBlob() entfernt den Grabstein, Eintrag erscheint unverändert
expected: siehe 12-06 Coverage D2
result: pass
source: automated
coverage_id: D2

### 24. deleteSoundBlob() löscht weiterhin sofort und endgültig (unverändert)
expected: siehe 12-06 Coverage D3
result: pass
source: automated
coverage_id: D3

### 25. removeAudioFile() ruft saveUndoState('Audio entfernt') als erste wirksame Anweisung
expected: siehe 12-06 Coverage D4
result: pass
source: automated
coverage_id: D4

### 26. Undo-Hook stellt die zuletzt entfernte Datei wieder her
expected: siehe 12-06 Coverage D5
result: pass
source: automated
coverage_id: D5

### 27. Strg+Z nach dem Entfernen einer Audiodatei in einer echten Browser-Session (inkl. Reload)
expected: siehe 12-06 Coverage D6
result: pass
source: automated
coverage_id: D6

### 28. Echte Audio-Bibliothek knapp UNTER 300 MiB — Export blockiert den Browser-Tab nicht
expected: |
  Echte Audio-Bibliothek knapp UNTER 300 MiB zusammenstellen (mind. 4 grosse Dateien,
  Einzeldatei-Obergrenze 100 MB), `dist/dnd-tracker-bundled.html` per Doppelklick oeffnen,
  Banner-Button "Zum App-Umzug" klicken, dann im Divergenz-Banner
  "Audio-Datei herunterladen (…)" klicken. Erwartet: Wartehinweis erscheint, die Datei
  wird angeboten, der Tab bleibt bedienbar und stuerzt nicht ab. Wird der Tab schon
  deutlich unter 300 MiB unruhig, ist die Warnschwelle zu hoch angesetzt und gehoert gesenkt.
why_human: |
  Geprueft wird Speicherdruck im Renderer-Prozess eines echten Browsers
  (Recherche-Annahme A1). Unter Node/jsdom nicht messbar; kein Konsolen-Trick ersetzt
  echte Dateien.
result: [pending]
source: 12-VERIFICATION.md human_verification[0]
note: |
  Uebernommen aus Erstverifikation und 1. Re-Verifikation. Der Nutzer hat sich am
  2026-08-19 bewusst entschieden, die Dateien nicht zusammenzutragen; durch die
  2. Re-Verifikation erneut faellig.

## Summary

total: 28
passed: 27
issues: 0
pending: 1
open_gaps: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-12-3
  truth: "Der Umzugs-Wizard bietet sich einem Nutzer mit vorhandenen Daten nicht an (Erfolgskriterium 4, SAFE-04)"
  status: resolved
  reason: "Beim Testen von Test 3 entdeckt. Der Nutzer merkte an, dass die Hinweisleiste auch nach einem reinen SRD-Zauber-Import ausbleibt. Die Nachprüfung im Code zeigte: isFreshInstall() zählt als Inhalt ausschließlich characters, npcs und quests. Wer eine SRD-Zauberbibliothek, Orte, Begegnungen, Beute, Wiki-Einträge, Sessions oder Zufallstabellen besitzt, aber keinen Charakter angelegt hat, gilt als Frischinstallation und bekommt den Umzugs-Wizard angeboten."
  severity: major
  test: 3
  root_cause: "systems/migration/migration-wizard.js — hasContent summiert nur data.characters/npcs/quests. Die Zeile stammt aus Commit 0641c17 (Phase 2, Plan 02-03, 2026-06-12) und wurde von Plan 12-04 nicht angefasst: 12-04 reparierte die Schlüsselauflösung (STORAGE_KEY_OVERRIDE) und die Datenquelle (readCampaignDataForBackup), nicht die Definition von 'Inhalt'. Keine Regression aus Phase 12, aber eine offene Flanke desselben Erfolgskriteriums."
  artifacts:
    - path: "systems/migration/migration-wizard.js"
      issue: "hasContent berücksichtigt 3 von 12 Sammlungen des D-Objekts"
  missing:
    - "hasContent über alle Datensammlungen bilden statt über drei fest verdrahtete"
    - "Unit-Test: Kampagne mit ausschließlich spells (keine characters/npcs/quests) gilt NICHT als Frischinstallation"
    - "Gegenprobe-Test: eine tatsächlich leere Kampagne gilt weiterhin als Frischinstallation"
  debug_session: ""
