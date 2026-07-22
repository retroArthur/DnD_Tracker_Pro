---
status: complete
phase: 02-technik-fundament
source: [02-VERIFICATION.md]
started: 2026-06-13T00:00:00Z
updated: 2026-07-20T22:15:00Z
---

## Current Test

[testing complete]

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
result: pass
note: "2026-07-20: End-to-end auf der Live-URL getestet. Update-Erkennung ✓ (neuer Deploy 202607202030 → Worker #567 Install→Wait in DevTools-Timeline; Aktivierung regulär in Client-Lücke). Banner-UI ✓ ('Neue Version verfügbar' + Jetzt neu laden/Jetzt nicht, gestylt, D-03-konform nur-auf-Klick). Beobachtungen: (a) GitHub Pages cached sw.js mit max-age=600 → Update-Erkennung bis ~10 Min verzögert (akzeptiert, 'nächster Besuch'-Semantik); (b) Once-per-Session-Guard (sessionStorage sw-update-shown) wird beim ANZEIGEN gesetzt — bei schnellen Reload-Serien mit mehreren Deploys kann ein Hinweis 'verschluckt' werden (bewusstes D-02-Anti-Spam-Design; mögliche Verbesserung: Flag erst bei Nutzer-Dismiss setzen)."

### 5. Datei-Backup-Flow (TECH-03)

expected: In installierter PWA: Backup-Ordner per Dialog wählen (User-Geste) → nach Datenänderung entsteht/aktualisiert `<kampagne>-aktuell.json` + datierter Tages-Snapshot (max. 10) → nach App-Neustart bleibt der Ordner verbunden (IDB-Handle) bzw. Permission-Reprompt erscheint; Restore-Browser stellt Backup der aktiven Kampagne wieder her (Strg+Z möglich).
result: pass
note: "2026-07-20: UAT fand den Struktur-Bug (window.save-Wrapper wirkungslos für bare save() — keine .json trotz verbundenem Ordner) → gefixt via generischem Post-Save-Hook (1430e8c + 6ea8309, registerPostSaveHook an allen 6 Persist-Erfolgspunkten). Zweiter UAT-Fund: kein 'Anderen Ordner wählen' im Verbunden-Zustand → Button ergänzt (cc2af9e). Re-Test auf Live-App: hooks=2 registriert, save() → Status 'Letztes Backup: 23:40 · Ordner: BackUp' (Zeitstempel wird nur nach erfolgreichem Write gesetzt = Dateien geschrieben). Ordner-Verbindung überlebte mehrere Reloads/Sessions via IDB-Handle."

### 6. Migrations-Wizard im PWA-Modus (TECH-02)

expected: Unter file://: Voll-Export erzeugen (alle Kampagnen + Einstellungen) → in der installierten PWA Wizard öffnen → Datei per Drag-and-Drop importieren → App lädt neu und zeigt alle Kampagnen; Divergenz-Banner erscheint bei erneutem file://-Besuch.
result: pass
note: "2026-07-20: Kompletter Umzug bestätigt — startMigrationFlow() (file://) → Voll-Export-JSON + Divergenz-Marker + PWA geöffnet; showMigrationWizard() (PWA) → Drag&Drop-Import → 'Umzug erfolgreich' → Reload mit allen Daten (7 Chars, 23 NPCs, 33 Orte, 15 Quests, 75 Zauber). Divergenz-Banner-Logik verifiziert (D-10/D-11: Hint-Banner erscheint korrekt NICHT mehr, wenn migration-divergence-since gesetzt + dismissed — war beim Test zunächst irritierend, ist aber Design)."

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Nach jeder Datenänderung schreibt das Datei-Backup <kampagne>-aktuell.json + Tages-Snapshot in den verbundenen Ordner (TECH-03)"
  status: resolved
  reason: "UAT Test 5 (2026-07-20): Ordner verbunden, Charakter angelegt — KEINE .json im Backup-Ordner."
  severity: major
  test: 5
  root_cause: "initFileBackup() patchte window.save — aber bare save()-Aufrufe (fast alle Entity-CRUDs) binden an die globale const-Deklaration aus persistence.js, die jeden window.save-Wrapper dauerhaft überdeckt. Der After-Save-Hook feuerte nie für klassische CRUD-Pfade; nur Module mit explizitem window.save() (z.B. Soundboard) hätten Backups ausgelöst."
  resolution: "Commit 1430e8c — expliziter Hook-Punkt _notifyFileBackup() → window.onFileBackupAfterSave() an allen 6 Persist-Erfolgspunkten in persistence.js (im Funktions-Body statt Wrapper); wirkungsloser window.save-Patch entfernt. Bonus: Hook feuert nach dem tatsächlichen Write (kein Stale-Read). 3 Regressionstests. Gleicher Struktur-Bug im DM-Screen-Live-Sync als Follow-up-Task geflaggt (setupDMScreenLiveSync + CLAUDE.md-Muster)."
  artifacts: [systems/spellslots/persistence.js, systems/file-backup/file-backup-manager.js, tests/unit/file-backup-hook.test.js]
  missing: []
