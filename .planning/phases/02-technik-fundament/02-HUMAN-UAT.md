---
status: testing
phase: 02-technik-fundament
source: [02-VERIFICATION.md]
started: 2026-06-13T00:00:00Z
updated: 2026-06-20T14:30:00Z
---

## Current Test

number: 4
name: SW-Update-Hinweis (D-03) auf der Live-URL
expected: |
  Live-App über HTTPS öffnen (SW registriert) → neue Version deployen → beim nächsten
  Besuch erscheint der Update-Hinweis (kein Zwangs-Reload); "Aktualisieren" wendet die
  neue Version nach controllerchange an.
awaiting: user response

## Tests

### 1. PWA-Installierbarkeit

expected: App über HTTPS (GitHub Pages) oder localhost öffnen → Chrome/Edge zeigt Install-Prompt bzw. Header-Install-Button (⊕) erscheint → nach Installation startet die App standalone (eigenes Fenster, ohne Browser-UI).
result: pass
note: "2026-07-20: Auf localhost mit exakt nachgestelltem Pages-Layout (Prod-Build + Manifest + Icons + SW) getestet — Install-Option erschien, App startet standalone (Screenshot: eigenes Fenster ohne Browser-UI, gruppierte Nav funktioniert in der PWA). Validiert nebenbei den Manifest-Runtime-Injection-Fix (cd75093)."

### 2. Icon-Qualität & Maskable-Safe-Zone

expected: icons/icon-512.png auf https://maskable.app/editor hochladen → in Circle- und Squircle-Vorschau wird nichts Wichtiges abgeschnitten; d20 + „20" klar erkennbar. Installiertes App-Icon auf Homescreen/Taskleiste prüfen.
result: pass
note: "2026-07-20: Installiertes Icon vom Nutzer bestätigt (Titelleiste/Taskleiste, scharf). Maskable-Bildanalyse: '20' + inneres Dreieck liegen komfortabel in der Safe-Zone (~80%-Kreis); nur die äußeren Hexagon-Spitzen (~6% vom Rand) würden bei strenger Circle-Maske minimal angeschnitten — kosmetisch, d20 bleibt klar erkennbar (relevant nur Android-Homescreen)."

### 3. GitHub Pages Deploy

expected: Einmalig Repo → Settings → Pages → Source: „GitHub Actions" setzen → auf main pushen → CI-Lauf inkl. deploy-Job grün → Live-URL lädt die App; DevTools → Application → Manifest ohne Validierungsfehler. Danach MIGRATION_PWA_URL prüfen/korrigieren (IN-06: nennt aktuell `DnD_Tracker_Pro` statt `DnD_Tracker_App_Pro`).
result: pass
note: "2026-07-20: Pages-Source 'GitHub Actions' war bereits gesetzt. Remote war 7 Commits voraus (Mai-Repo-Review) → sauber gemergt (lokal gewinnt bei ci.yml/CLAUDE.md/README/package.json/tsconfig; Loot-Toolbar-Fix + docs/architecture übernommen; alter pages.yml-Deploy entfernt — publizierte nur index.html OHNE Manifest/Icons/SW und racte mit dem ci.yml-Deploy). Push e8b9264+7f4858a → CI komplett grün (2m18s) → Live verifiziert: optimized.html/manifest/sw.js/icons/fonts alle 200, Manifest valide (2 Icons any+maskable). IN-06 aufgelöst: Repo heißt wirklich DnD_Tracker_Pro — MIGRATION_PWA_URL ist KORREKT, keine Änderung."

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
passed: 3
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
