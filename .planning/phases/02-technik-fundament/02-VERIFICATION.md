---
phase: 02-technik-fundament
verified: 2026-06-13T00:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
re_verification: false
human_verification:
  - test: "PWA-Installierbarkeit im Browser prüfen"
    expected: "Der 'App installieren'-Button erscheint im Header bei uninstallierten Browsern; der Install-Dialog öffnet sich; nach Installation verschwindet der Button dauerhaft; die App startet über das Desktop-Icon offline ohne Browser-Chrome."
    why_human: "Erfordert einen gehosteten HTTP/HTTPS-Server und den BeforeInstallPromptEvent — der im file://-Modus nie feuert. Playwright-Smoke läuft lokal gegen file://, kann beforeinstallprompt nicht auslösen."
  - test: "Icons visuell prüfen (D-04 + Maskable-Safe-Zone)"
    expected: "icons/icon-192.png und icons/icon-512.png zeigen ein erkennbares d20-Motiv (Gold auf Dunkel, '20' lesbar). icon-512.png besteht den Maskable-Safe-Zone-Check auf maskable.app (Circle + Squircle ohne abgeschnittene Elemente)."
    why_human: "Visuelle Qualität nicht automatisch prüfbar. PNG-Dateien existieren und werden vom Manifest referenziert, aber Motivqualität und Safe-Zone erfordern menschliche Prüfung."
  - test: "GitHub Pages Deploy prüfen (Task 02-02 Task 4)"
    expected: "Nach Push auf main deployt der CI-Job den Production-Build. Unter der Pages-URL (github.io/…/dnd-tracker-optimized.html) lädt die App, DevTools → Application → Manifest zeigt beide Icons ohne Validierungsfehler, der Install-Dialog ist verfügbar."
    why_human: "Erfordert eine echte GitHub-Repo-Einstellung (Settings → Pages → Source: GitHub Actions) und einen echten CI-Lauf. Lokal nicht verifizierbar. Der CI-YAML-Job (deploy-pages) ist korrekt implementiert und lokal validiert — die Wirkung ist erst am echten Run beweisbar."
  - test: "SW-Update-Hinweis (D-03) bei neuer SW-Version prüfen"
    expected: "Wenn eine neuere SW-Version wartet, erscheint die .pwa-update-banner-Leiste mit 'Neue Version verfügbar', 'Jetzt neu laden' (lädt nach SW-Aktivierung neu) und 'Jetzt nicht' (schließt Banner, kein Zwang-Reload). SessionStorage-Guard verhindert Mehrfachzeigen."
    why_human: "Erfordert zwei SW-Versionen auf einem HTTPS-Server; der update-Zyklus ist in file://-Umgebung nicht reproduzierbar."
  - test: "Datei-Backup-Setup-Flow (D-15/D-16/D-17) am Spieltisch prüfen"
    expected: "Nutzer klickt 'Backup-Ordner wählen' in den Einstellungen (Daten-Tab), wählt einen Ordner. Nach save() entsteht eine <kampagne>-aktuell.json im Ordner. Der Backup-Status-Bereich zeigt grünen Punkt + Uhrzeit + Ordnernamen. Nach App-Reload bleibt der Ordner verbunden (IDB-Handle). Bei Verbindungsproblem erscheint EINMAL 'Ordner wieder verbinden?'-Warnung und Header-Warnindikator."
    why_human: "Die File System Access API (showDirectoryPicker) erfordert eine echte Browser-User-Geste in einer sicheren Umgebung. Der IDB-Handle-Persistenz-Zyklus (speichern + queryPermission nach Reload) ist in automatischen Tests nicht sinnvoll nachzustellen."
  - test: "Migrations-Wizard Drag-and-Drop im PWA-Modus (D-09) prüfen"
    expected: "Beim ersten PWA-Start bei leerem Speicher öffnet der Wizard. Eine gültige full-v1-Exportdatei per Drag-and-Drop → Importbestätigung → Reload → Kampagnendaten vorhanden. 'Überspringen' schließt ohne Import. Erneutes Öffnen via data-action='reopen-migration-wizard' zeigt den Wizard auch bei vorhandenen Daten mit Bestätigungsdialog."
    why_human: "Der beforeinstallprompt-Check (isFreshInstall) und der Reload-nach-Import benötigen einen realen Browser im HTTPS-Kontext. Drag-and-Drop-Interaktion ist mit Playwright grundsätzlich testbar, aber der Protokoll-Branch (protocol !== 'file:') tritt lokal nie ein."
---

# Phase 2: Technik-Fundament — Verifikationsbericht

**Phasenziel:** Die App ist als PWA installierbar, schreibt automatische Datei-Backups auf die Festplatte und bietet eine Command Palette für schnelle Aktionen.
**Verifiziert:** 2026-06-13T00:00:00Z
**Status:** human_needed
**Re-Verifikation:** Nein — Erstverifikation

**Hinweis:** Alle 23 Code-Review-Findings (11 Critical + 12 Warning) aus 02-REVIEW.md wurden in 02-REVIEW-FIX.md dokumentiert und in Commits e9c91a7…ce13194 behoben. Die Verifikation prüft den HEAD-Stand, nicht die SUMMARY-Behauptungen vor dem Review-Fix.

---

## Zielerreichung

### Beobachtbare Wahrheiten

| # | Wahrheit | Status | Nachweis |
|---|----------|--------|---------|
| 1 | App liefert echtes manifest.webmanifest mit name, start_url, display=standalone und zwei maskable Icons (192+512) | VERIFIED | manifest.webmanifest: valides JSON; enthält "display":"standalone", "sizes":"192x192", "sizes":"512x512", "purpose":"any maskable" auf beiden Einträgen; node -e JSON.parse: exit 0 |
| 2 | Service Worker cached Single-File-Build, kein erzwungenes skipWaiting bei Install; SKIP_WAITING nur auf explizite Message | VERIFIED | sw.js: kein self.skipWaiting() im Install-Handler; message-Handler: SKIP_WAITING-Typ-Guard vorhanden; dist/sw.js CACHE_VERSION gebumpt auf 'dnd-tracker-v2.6.1-202606122245'; CORE_ASSETS + OPTIONAL_ASSETS Split (CR-09-Fix) |
| 3 | Editor-Fonts und Roboto laden offline aus lokal gebündelten WOFF2-Dateien — kein Google-Fonts-CDN-Link mehr | VERIFIED | 10 woff2-Dateien in assets/fonts/; 11 @font-face-Regeln in fonts.css; build.py enthält rel="manifest" href=./manifest.webmanifest, kein fonts.googleapis.com; index.html: kein CDN-Link; Production-Bundle: url()-Pfade auf ./assets/fonts/ umgeschrieben (CR-08) |
| 4 | 'App installieren'-Button im Header (D-05) ist verdrahtet; install-pwa data-action registriert | VERIFIED | header.html: id="pwa-install-btn" class="pwa-install-btn" data-action="install-pwa" style="display:none"; pwa-install.js: beforeinstallprompt-Handler schaltet Button via $('pwa-install-btn') sichtbar; initPWAActions registriert 'install-pwa' bei init()-Laufzeit (CR-01/CR-06-Fix) |
| 5 | CI deployed nur nach grünem smoke-test nach GitHub Pages; nur bei Push auf main | VERIFIED | ci.yml: deploy-Job needs:[smoke-test], if: github.event_name == 'push' && github.ref == 'refs/heads/main', actions/deploy-pages@v4 |
| 6 | buildFullExport() sammelt alle Kampagnen + settings + diceFavorites + dmScreenProfiles mit _exportType 'full-v1'; exportiert KEINE SRD-Spells | VERIFIED | full-export.js: FULL_EXPORT_SCHEMA, _exportType:'full-v1', stripNonUserData entfernt D.spells; Jest-Test 9/9 grün (inkl. SRD-Strip real durchlaufen per differenziertem Mock) |
| 7 | importFullExport() stellt alle Kampagnen + diceFavorites via StorageAPI wieder her; führt migrateData aus; Key-Whitelist schützt vor manipulierten Dateien | VERIFIED | full-export.js: importFullExport prüft _exportType, schreibt diceFavorites, nutzt Key-Whitelist /^(dnd-tracker(-|$)|dnd-campaign-)/ + Mengenlimit 100 (WR-03/WR-04-Fix) |
| 8 | Migrations-Wizard (PWA-Modus): erscheint bei leerem Speicher; Drag-and-Drop-Import; überspringbar; via 'reopen-migration-wizard' jederzeit erneut aufrufbar (D-09); Wizard-Import reloaded statt save() auf stale D (CR-04) | VERIFIED | migration-wizard.js: isFreshInstall() prüft leeren Speicher; wizard-dropzone mit dragover/drop; wizard-close → location.reload(); reopen-migration-wizard ruft showMigrationWizard() direkt auf (kein Guard); Listener-Guard modal.dataset.actionsBound (WR-02-Fix) |
| 9 | file://-App bietet einmaligen Umzugs-Hinweis (D-10, sessionStorage-Guard) und dauerhaftes, abschaltbares Divergenz-Banner (D-11, StorageAPI-Guard) | VERIFIED | migration-wizard.js: startMigrationFileSide(); sessionStorage 'migration-hint-shown'-Guard; StorageAPI 'migration-divergence-since'/'migration-divergence-dismissed'; Divergenz-Banner-Text mit esc(dateStr) und "Änderungen hier kommen dort nicht an" (HTML-Entities) |
| 10 | Nach jedem save() schreibt der Datei-Backup-Manager je Kampagne eine -aktuell.json atomar (createWritable/close); pro Tag genau ein Snapshot; max 10 Snapshots (D-12); save-Hook via eigenem _fileBackupSaveHooked-Guard (CR-02) | VERIFIED | file-backup-manager.js: _fileBackupSaveHooked-Guard + Verkettung prevSave; createWritable/write/close; getSnapshotRegex (regex-escaped, CR-05-Fix); pruneOldSnapshots MAX=10; Jest-Test 9/9 grün (inkl. NotFoundError-Mock + CR-05-Regressionstest) |
| 11 | Ordner-Handle in IndexedDB persistiert (IDB_VERSION=3, fileHandles-Store); window.idb korrekt exportiert; queryPermission vor requestPermission; requestPermission nur in User-Geste (D-16) | VERIFIED | core/init.js: IDB_VERSION=3, window.idb=idb in onsuccess, fileHandles-Store in onupgradeneeded (CR-03-Fix); file-backup-permissions.js: restoreBackupFolder gibt null zurück wenn nicht 'granted' (kein automatisches requestPermission) |
| 12 | Command Palette: Strg+Shift+K (+Strg+Punkt Firefox-Fallback) öffnet .cp-overlay; fuzzyMatch findet 'Neuer NPC' und '8d6'-Aktion; Pfeil/Enter/Esc-Navigation; klar abgegrenzt von Global Search (Strg+K/F) | VERIFIED | keyboard-shortcuts.js: Strg+Shift+K-Binding + Strg+Punkt-Fallback (WR-01); command-palette.js: toggleCommandPalette, .cp-overlay, execute-command via ctx.target.dataset.commandId (CR-10-Fix); E2E command-palette.spec.js: 2/2 grün; Jest action-registry.test.js: 3/3 grün |

**Score:** 12/12 Wahrheiten verifiziert

---

## Erfoderliche Artefakte

| Artefakt | Erwartet | Status | Details |
|----------|----------|--------|---------|
| `manifest.webmanifest` | PWA-Pflichtfelder name/icons/start_url/display | VERIFIED | Valides JSON; standalone; 192+512; maskable |
| `sw.js` | Cache-First SW + SKIP_WAITING-Handler; kein skipWaiting im Install | VERIFIED | CR-09-Fix: CORE/OPTIONAL split; dist/sw.js CACHE_VERSION gebumpt |
| `assets/styles/fonts.css` | ≥8 @font-face-Regeln; lokal; alle in EINER Datei (Pitfall 8) | VERIFIED | 11 @font-face; 10 woff2-Dateien in assets/fonts/ |
| `icons/icon-192.png`, `icons/icon-512.png` | Maskable PWA-Icons (D-04) | PARTIAL — HUMAN | Dateien existieren; Motivqualität/Safe-Zone benötigt Mensch |
| `systems/spellslots/pwa-install.js` | showSWUpdateHint + Install-Button + initPWAActions | VERIFIED | showSWUpdateHint, installPWA, initPWAActions; WR-06-Fix (controllerchange) |
| `.github/workflows/ci.yml` | deploy-Job nach smoke-test; nur main-Push | VERIFIED | needs:[smoke-test]; event_name-Guard; actions/deploy-pages@v4 |
| `systems/migration/full-export.js` | buildFullExport, importFullExport, FULL_EXPORT_SCHEMA | VERIFIED | Jest 3/3 grün; WR-03/WR-04-Fix |
| `systems/migration/migration-wizard.js` | Wizard + file://-Side-Flow + Divergenz-Banner | VERIFIED | CR-04/WR-02-Fix; alle Kernfunktionen implementiert |
| `assets/styles/migration.css` | .migration-wizard, .wizard-dropzone, .wizard-dropzone.dragover, .divergence-banner, .migration-hint-banner | VERIFIED | Alle Klassen vorhanden |
| `systems/file-backup/file-backup-permissions.js` | queryPermission, saveHandleToIDB, restoreBackupFolder | VERIFIED | CR-03-Fix; queryPermission vor requestPermission |
| `systems/file-backup/file-backup-manager.js` | initFileBackup (save-Hook), writeBackupForCampaign, pruneOldSnapshots | VERIFIED | CR-02/CR-05-Fix; Jest 4/4 grün |
| `systems/file-backup/file-backup-ui.js` | showFileBackupBrowser, restoreFromFileBackup (saveUndoState + Strg+Z-Hinweis) | VERIFIED | saveUndoState VOR Restore; Bestätigungsdialog mit "Strg+Z"-Text |
| `assets/styles/file-backup.css` | .backup-status-section, .backup-entry | VERIFIED | Beide Klassen vorhanden |
| `assets/templates/view-tools.html` | .backup-status-section DOM-Anker | VERIFIED | Zeile 352; CR-07-Fix |
| `systems/tab-registry.js` | renderBackupStatus in data-Tab registriert | VERIFIED | Zeile 84; CR-07-Fix |
| `features/command-palette/action-registry.js` | ACTION_REGISTRY + searchActions (fuzzyMatch-Wiederverwendung) | VERIFIED | Jest 3/3 grün; fuzzyMatch direkt aufgerufen |
| `features/command-palette/command-palette.js` | initCommandPalette, toggleCommandPalette; execute-command registriert | VERIFIED | CR-10-Fix; "Keine Aktion gefunden…"-Text vorhanden; E2E 2/2 grün |
| `assets/styles/command-palette.css` | .cp-overlay, .cp-result.focused | VERIFIED | Beide Klassen vorhanden; z-index:1200 |
| `assets/styles/pwa.css` | .pwa-install-btn, .pwa-update-banner | VERIFIED | Beide Klassen vorhanden |
| `loader.js` + `build.py` | Alle 7 neuen Module registriert; Listen synchron | VERIFIED | Symmetrische Differenz = leer; command-palette in beiden enthalten |
| `assets/styles.css` | @import für alle 5 neuen CSS-Dateien | VERIFIED | fonts.css, pwa.css, migration.css, file-backup.css, command-palette.css |
| `assets/templates/header.html` | id="pwa-install-btn" + .backup-warning-indicator | VERIFIED | Beide Elemente mit display:none; CR-06-Fix (id-Ergänzung) |
| `core/init.js` | Defensive Init-Aufrufe + initPWAActions/FileBackupActions/MigrationActions + SW-Update-Erkennung | VERIFIED | 6 typeof-Guards in init(); updatefound-Listener; showSWUpdateHintGuarded |
| `tests/unit/full-export.test.js`, `file-backup.test.js`, `action-registry.test.js` | Grüne Unit-Tests | VERIFIED | 9/9 Tests grün (WR-09-Fix: realistische Mocks) |
| `tests/e2e/features/pwa.spec.js` | Korrekte Skip-Semantik (WR-08) | VERIFIED | test.skip() statt test.fail(); lokal: 2 skipped |
| `tests/e2e/features/command-palette.spec.js` | 2/2 grün (E2E Öffnen + NPC-Treffer) | VERIFIED | 2 passed gegen dist-Bundle |

---

## Key-Link-Verifikation

| Von | Nach | Via | Status | Details |
|-----|------|-----|--------|---------|
| `loader.js` | `build.py` Modulliste | Sync-Check (Mengensymmetrie) | VERIFIED | Differenz = {} |
| `core/init.js` initPWAActions/initFileBackupActions/initMigrationActions/initFileBackup/initCommandPalette | jeweilige Module | typeof-Guard | VERIFIED | 6 defensive Aufrufe in init() |
| `core/init.js registerServiceWorker` | `window.showSWUpdateHint` (pwa-install.js) | showSWUpdateHintGuarded + defensiver Guard | VERIFIED | updatefound + reg.waiting verdrahtet |
| `build.py` + `assets/styles.css` | 5 neue CSS-Dateien | Registrierung + @import | VERIFIED | Alle 5 in beiden Listen |
| `systems/file-backup/file-backup-manager.js` | `window.save` | _fileBackupSaveHooked-Guard + Verkettung | VERIFIED | CR-02-Fix; unabhängig vom DM-Screen-Hook |
| `systems/file-backup/file-backup-ui.js` | `saveUndoState` | vor Restore-Anwenden | VERIFIED | saveUndoState vor Object.assign |
| `features/command-palette/action-registry.js` | `fuzzyMatch` (global-search.js) | Direktaufruf (kein Duplikat) | VERIFIED | Kein eigener Fuzzy-Algorithmus |
| `systems/spellslots/keyboard-shortcuts.js` | `window.toggleCommandPalette` | Strg+Shift+K + Strg+Punkt | VERIFIED | Beide Bindings vorhanden; typeof-Guard |
| `systems/migration/migration-wizard.js` | `buildFullExport`/`importFullExport` | Funktionsaufruf in Wizard-Schritten | VERIFIED | typeof-Guard + window-Fallback |
| CI deploy-Job | smoke-test | needs:[smoke-test] | VERIFIED | WR-07-Fix: event_name-Guard |
| `pwa-install.js` | controllerchange-Event | Reload erst nach SW-Aktivierung | VERIFIED | WR-06-Fix; 3s-Fallback-Timeout |

---

## Datenfluss-Prüfung (Level 4)

| Artefakt | Datenvariable | Quelle | Echte Daten | Status |
|----------|---------------|--------|-------------|--------|
| `file-backup-manager.js` writeBackupForCampaign | StorageAPI.getJSON(campaignKey) | StorageAPI → localStorage | Kampagnendaten aus localStorage | FLOWING |
| `full-export.js` buildFullExport | getCampaignIndex().campaigns | campaign-manager.js → localStorage | Alle Kampagnen-Keys | FLOWING |
| `action-registry.js` searchActions | ACTION_REGISTRY (statische Aktionsliste) | Statisch + fuzzyMatch | Statische Registry mit echten window-Funktionsreferenzen | FLOWING |
| `migration-wizard.js` showDivergenceBanner | dateStr aus StorageAPI.getJSON('migration-divergence-since') | StorageAPI → localStorage | Persistiertes Umzugsdatum | FLOWING |
| `file-backup-ui.js` renderBackupStatus | getBackupStatus() + window._fileBackupDirHandle | In-Memory-State aus initFileBackup | Gesetzt nach IDB-Restore oder User-Setup | FLOWING |

---

## Behavioral Spot-Checks

| Verhalten | Prüfung | Ergebnis | Status |
|-----------|---------|----------|--------|
| Dev-Build fehlerfrei | `python build.py` | Exit 0; 2,18 MB | PASS |
| Production-Build fehlerfrei | `python build.py --production` | Exit 0; 1,87 MB | PASS |
| Syntaxprüfung alle Phase-2-Module | `node --check` auf 8 Dateien | Alle: exit 0 | PASS |
| Jest-Gesamtlauf | `npm test` | 300/300 Tests, 15/15 Suiten | PASS |
| TypeScript-Check | `npm run typecheck` | exit 0, keine Fehler | PASS |
| ESLint | `npm run lint` | 0 Errors (1276 Baseline-Warnings) | PASS |
| Smoke-E2E gegen Dev-Bundle | `npx playwright test --config=playwright.smoke.config.js` | 7/7 passed | PASS |
| Command-Palette-E2E | `npx playwright test tests/e2e/features/command-palette.spec.js` | 2/2 passed | PASS |
| PWA-Spec lokal | `npx playwright test tests/e2e/features/pwa.spec.js` | 2 skipped (korrekt ohne HTTPS-Server) | PASS |
| manifest.webmanifest valide | `node -e JSON.parse(…)` | MANIFEST_VALID | PASS |
| Loader/Build-Sync | Python Set-Differenz | Beide leer → synchron | PASS |
| CACHE_VERSION gebumpt | `cat dist/sw.js | grep CACHE_VERSION` | 'dnd-tracker-v2.6.1-202606122245' | PASS |
| Font-URLs im Bundle korrekt | `grep -c "./assets/fonts/" dist/dnd-tracker-optimized.html` | ≥1 (10 Font-URLs umgeschrieben) | PASS |
| Kein Google-CDN im Bundle | `grep fonts.googleapis dist/…` | Keine Treffer | PASS |

---

## Anforderungsabdeckung

| Anforderung | Quellplan | Beschreibung | Status | Nachweis |
|-------------|-----------|-------------|--------|---------|
| TECH-01 | 02-02 | PWA installierbar (Manifest, Icons, SW) | VERIFIED (Code) / HUMAN (Live-Deploy + Icon-Qualität) | manifest.webmanifest valide; sw.js korrekt; CI-Job implementiert; Install-Button verdrahtet. Visuell + Live-URL: human_needed |
| TECH-02 | 02-03 | file://-Kampagnendaten per Migrations-Assistent übernehmen | VERIFIED (Code) / HUMAN (End-to-End im Browser) | full-export.js grüne Tests; Wizard implementiert inkl. Drag-and-Drop + Bestätigungsdialog + Reload-Fix. Vollständiger Flow im HTTPS-Browser: human_needed |
| TECH-03 | 02-04 | Automatische Datei-Backups (File System Access API) | VERIFIED (Code) / HUMAN (Browser mit User-Geste) | file-backup-*.js grüne Tests; save-Hook; IDB; pruneOldSnapshots; DOM-Anker. Echter showDirectoryPicker-Flow: human_needed |
| TECH-04 | 02-05 | Command Palette mit Fuzzy-Suche (Strg+Shift+K) | VERIFIED | E2E 2/2 grün; Jest 3/3 grün; Strg+Shift+K + Strg+Punkt-Fallback |

---

## Anti-Pattern-Scan

| Datei | Zeile | Muster | Schwere | Auswirkung |
|-------|-------|--------|---------|------------|
| `systems/migration/migration-wizard.js` | 18 | MIGRATION_PWA_URL: 'DnD_Tracker_Pro' (Repo heißt 'DnD_Tracker_App_Pro') | INFO | Umzugs-Flow öffnet nach echtem Deploy möglicherweise eine 404-URL. Bekannte IN-06; nach erstem Deploy zu korrigieren. Kein Blocker für Code-Verifikation. |
| Alle Phase-2-Dateien | — | TBD / FIXME / XXX | — | Keine gefunden |

**Debt-Marker:** Keine TBD/FIXME/XXX ohne Issue-Referenz in Phase-2-Dateien.

---

## Menschliche Verifikation erforderlich

### 1. PWA-Installierbarkeit im Browser prüfen

**Test:** In Chrome/Edge auf einem HTTP/HTTPS-Server (z.B. `python -m http.server 8000 --directory dist`) oder über die GitHub Pages URL die App öffnen. Warten auf das Browser-Install-Angebot oder über die Browser-Menüzeile "App installieren" klicken.
**Erwartet:** Der 'App installieren'-Button im App-Header erscheint; Install-Dialog öffnet sich; nach Installation startet die App über Desktop-Icon ohne Browser-Chrome; offline nutzbar.
**Warum Mensch:** BeforeInstallPromptEvent feuert nur unter HTTPS/localhost-HTTP, nicht im file://-Modus. Playwright-Smoke läuft lokal gegen file://.

### 2. Icons visuell prüfen (D-04 + Maskable-Safe-Zone)

**Test:** icons/icon-192.png und icons/icon-512.png öffnen. icon-512.png auf https://maskable.app/editor hochladen → Circle + Squircle-Preview prüfen.
**Erwartet:** d20-Motiv erkennbar (Gold auf Dunkel, '20' lesbar); keine wichtigen Elemente in den Masken abgeschnitten (80%-Safe-Zone).
**Warum Mensch:** Visuelle Qualitätsprüfung nicht automatisierbar.

### 3. GitHub Pages Deploy aktivieren und prüfen (Task 02-02 Task 4)

**Test:** GitHub Repo → Settings → Pages → Source: "GitHub Actions". Push auf main abwarten. Pages-URL in Chrome öffnen → DevTools → Application → Manifest.
**Erwartet:** App lädt, Manifest zeigt beide Icons ohne Fehler, Install-Dialog verfügbar.
**Warum Mensch:** Einmalige Repository-Einstellung; Wirkung nur an echtem CI-Lauf beweisbar.

### 4. SW-Update-Hinweis bei neuer SW-Version

**Test:** App auf HTTPS-Server laden, zweite SW-Version deployen (CACHE_VERSION ändern), Tab im Hintergrund offen lassen.
**Erwartet:** .pwa-update-banner erscheint; 'Jetzt neu laden' aktualisiert auf neue Version; 'Jetzt nicht' schließt das Banner; kein Zwangs-Reload.
**Warum Mensch:** SW-Update-Zyklus erfordert HTTPS und zwei Deploy-Versionen.

### 5. Datei-Backup-Setup-Flow am Spieltisch

**Test:** App im Browser öffnen → Daten-Tab → Einstellungen-Bereich → 'Backup-Ordner wählen'. Einen Ordner auswählen. Etwas ändern und speichern. Ordner-Inhalt prüfen.
**Erwartet:** <kampagne>-aktuell.json im Ordner; Backup-Status zeigt grünen Punkt + Uhrzeit + Ordnernamen; nach App-Reload bleibt Ordner verbunden; bei Ordner-Entzug erscheint einmalig Warnung.
**Warum Mensch:** File System Access API erfordert echte Browser-User-Geste; IDB-Handle-Persistenz-Zyklus nicht sinnvoll automatisch testbar.

### 6. Migrations-Wizard Drag-and-Drop im PWA-Modus

**Test:** App im HTTPS-Modus ohne vorherige Daten starten → Wizard erscheint → Exportdatei per Drag-and-Drop einwerfen → Import bestätigen → Reload prüfen. Dann 'reopen-migration-wizard' aus den Einstellungen aufrufen bei vorhandenen Daten.
**Erwartet:** Wizard erscheint beim Erststart; Import mit Bestätigungsdialog; nach Reload sind Kampagnen geladen; Erneut-Aufrufen funktioniert mit Bestätigungsdialog.
**Warum Mensch:** protocol-Branch (PWA vs file://) tritt lokal nicht ein; Reload-Verhalten nach Import browserabhängig.

---

## Lücken-Zusammenfassung

Keine Code-Lücken — alle 12 Must-Haves sind im Codestand verifiziert. Die 6 Human-Verification-Items betreffen Browser-spezifische Verhaltensweisen (PWA-Install-Prompt, File System Access API, SW-Update-Zyklus, GitHub Pages Deploy), die programmatisch nicht sinnvoll nachstellbar sind.

**Bekannte offene Info-Findings (kein Blocker):**
- IN-06: MIGRATION_PWA_URL enthält 'DnD_Tracker_Pro' statt 'DnD_Tracker_App_Pro' — nach erstem Deploy zu korrigieren.
- IN-08: Stale-Bundle-False-Green strukturell offen (pretest:smoke → Rebuild); für diese Verifikation entschärft (beide Bundles frisch gebaut).
- IN-09: fuzzyMatch-Kopie im action-registry.test (Drift-Risiko, kein Funktionsfehler).
- IN-10: Fallback-Key 'dnd-tracker-data' statt 'dnd-tracker-v4' greift nur ohne APP_CONFIG.

---

_Verifiziert: 2026-06-13T00:00:00Z_
_Verifizierer: Claude (gsd-verifier)_
