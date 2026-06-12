---
status: partial
phase: 02-technik-fundament
source: [02-VERIFICATION.md]
started: 2026-06-13T00:00:00Z
updated: 2026-06-13T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. PWA-Installierbarkeit

expected: App über HTTPS (GitHub Pages) oder localhost öffnen → Chrome/Edge zeigt Install-Prompt bzw. Header-Install-Button (⊕) erscheint → nach Installation startet die App standalone (eigenes Fenster, ohne Browser-UI).
result: [pending]

### 2. Icon-Qualität & Maskable-Safe-Zone

expected: icons/icon-512.png auf https://maskable.app/editor hochladen → in Circle- und Squircle-Vorschau wird nichts Wichtiges abgeschnitten; d20 + „20" klar erkennbar. Installiertes App-Icon auf Homescreen/Taskleiste prüfen.
result: [pending]

### 3. GitHub Pages Deploy

expected: Einmalig Repo → Settings → Pages → Source: „GitHub Actions" setzen → auf main pushen → CI-Lauf inkl. deploy-Job grün → Live-URL lädt die App; DevTools → Application → Manifest ohne Validierungsfehler. Danach MIGRATION_PWA_URL prüfen/korrigieren (IN-06: nennt aktuell `DnD_Tracker_Pro` statt `DnD_Tracker_App_Pro`).
result: [pending]

### 4. SW-Update-Hinweis (D-03)

expected: App über HTTPS geöffnet → neue Version deployen → beim nächsten Besuch erscheint der Update-Hinweis (kein erzwungener Reload); Klick auf „Aktualisieren" wendet die neue Version nach controllerchange an.
result: [pending]

### 5. Datei-Backup-Flow (TECH-03)

expected: In installierter PWA: Backup-Ordner per Dialog wählen (User-Geste) → nach Datenänderung entsteht/aktualisiert `<kampagne>-aktuell.json` + datierter Tages-Snapshot (max. 10) → nach App-Neustart bleibt der Ordner verbunden (IDB-Handle) bzw. Permission-Reprompt erscheint; Restore-Browser stellt Backup der aktiven Kampagne wieder her (Strg+Z möglich).
result: [pending]

### 6. Migrations-Wizard im PWA-Modus (TECH-02)

expected: Unter file://: Voll-Export erzeugen (alle Kampagnen + Einstellungen) → in der installierten PWA Wizard öffnen → Datei per Drag-and-Drop importieren → App lädt neu und zeigt alle Kampagnen; Divergenz-Banner erscheint bei erneutem file://-Besuch.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
