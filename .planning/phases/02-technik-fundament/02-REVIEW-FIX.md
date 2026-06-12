---
phase: 02-technik-fundament
fixed_at: 2026-06-12T22:41:37Z
review_path: .planning/phases/02-technik-fundament/02-REVIEW.md
iteration: 1
findings_in_scope: 23
fixed: 23
skipped: 0
status: all_fixed
---

# Phase 2: Code Review Fix Report

**Behoben am:** 2026-06-12T22:41:37Z
**Quell-Review:** .planning/phases/02-technik-fundament/02-REVIEW.md
**Iteration:** 1
**Scope:** critical_warning (11 Critical + 12 Warnings); 4 Info-Findings trivial mitbehoben

**Zusammenfassung:**
- Findings im Scope: 23
- Behoben: 23
- Übersprungen: 0

## Verifikation (Beweis, nicht Behauptung)

| Prüfung | Ergebnis |
|---|---|
| `PYTHONIOENCODING=utf-8 python build.py` (Dev) | ✅ fehlerfrei, dist/dnd-tracker-bundled.html neu (2.08 MB) |
| `PYTHONIOENCODING=utf-8 python build.py --production` | ✅ fehlerfrei, dist/dnd-tracker-optimized.html neu (1.78 MB) |
| **CR-01-Beweis:** Smoke gegen Produktions-Bundle (`SMOKE_BASE_URL=file:///…/dist/dnd-tracker-optimized.html npx playwright test --config=playwright.smoke.config.js`) — exakt die Repro des Reviewers, die vorher mit `Cannot access 'EventDelegation' before initialization` starb | ✅ **7/7 passed** (App bootet ohne Konsolen-Fehler + Tab-Sweep) |
| Smoke gegen Dev-Bundle (file://-Fallback, frisch gebaut) | ✅ 7/7 passed |
| Command-Palette-E2E gegen Produktions-Bundle (inkl. neuer pageerror-Assertions) | ✅ 2/2 passed |
| PWA-Spec lokal ohne SMOKE_BASE_URL (WR-08-Semantik) | ✅ 2 skipped (vorher: garantierte Failures) |
| `npm test` (kompletter Jest-Lauf) | ✅ **300/300 passed** (298 Bestand + 2 neue WR-09-Tests), 15/15 Suites |
| `npm run typecheck` (tsc --noEmit) | ✅ fehlerfrei |
| `npm run lint` | ✅ 0 Errors (1276 vorbestehende Baseline-Warnings) |
| CR-08 im Artefakt: alle 10 Font-URLs im Bundle auf `./assets/fonts/` umgeschrieben, 0 alte `../fonts/`-Pfade | ✅ verifiziert per grep |

## Behobene Findings

### CR-01: Produktions-Bundle stirbt mit TDZ-ReferenceError (empirisch bewiesen)

**Dateien:** `systems/spellslots/pwa-install.js`, `systems/file-backup/file-backup-ui.js`, `systems/migration/migration-wizard.js`, `core/init.js`
**Commit:** e9c91a7
**Fix:** Die drei Modul-Level-Blöcke `if (typeof EventDelegation !== 'undefined') { … }` ersatzlos entfernt und durch `initPWAActions()` / `initFileBackupActions()` / `initMigrationActions()` ersetzt (Muster: `initCommandPalette`). Aufruf erfolgt defensiv aus `core/init.js` zur init()-Laufzeit — dann ist die `const EventDelegation` garantiert initialisiert. Damit sind alle 11 data-actions auch im Loader-Modus aktiv. **Trivial mitbehoben: IN-11** (restore-file-backup-Handler nutzt jetzt korrekt benannten `ctx`-Parameter mit `ctx.target.dataset.filename`).

### CR-02: `_originalSave`-Guard-Kollision — Datei-Backup-Hook nie installiert

**Datei:** `systems/file-backup/file-backup-manager.js`
**Commit:** 6001368
**Fix:** Eigener Guard `window._fileBackupSaveHooked` + Verkettung über `const prevSave = window.save` — beide Hooks (DM-Screen-Live-Sync und Datei-Backup) laufen jetzt unabhängig von der Initialisierungsreihenfolge. **Abweichung vom Review-Vorschlag:** Die empfohlene CLAUDE.md-Doku-Ergänzung wurde bewusst NICHT vorgenommen (Projektregel: CLAUDE.md wird nicht automatisch modifiziert); das Muster ist stattdessen als Code-Kommentar an der Hook-Stelle dokumentiert.

### CR-03: `window.idb` undefined + IDB-Store `fileHandles` fehlt

**Dateien:** `core/init.js`, `systems/file-backup/file-backup-permissions.js`, `systems/file-backup/file-backup-ui.js`
**Commit:** fa049c8
**Fix:** (1) `IDB_VERSION` 2→3 mit `fileHandles`-Store in `onupgradeneeded`; (2) `window.idb = idb` im `onsuccess`-Handler exportiert — repariert auch die Bestandsleser persistence.js/backups.js/campaign-manager.js; (3) file-backup-permissions.js nutzt zusätzlich direkt den Rückgabewert von `initIndexedDB()` (robust ohne window-Abhängigkeit); (4) `showFileBackupSetup()` setzt das In-Memory-Handle VOR der IDB-Persistenz und behandelt IDB-Fehler separat (Sitzungs-Backup läuft trotzdem, Warnung nur für die Reload-Wiederherstellung).

### CR-04: Wizard überschreibt importierte Daten im Erfolgspfad

**Datei:** `systems/migration/migration-wizard.js`
**Commit:** 82e242a
**Fix:** `wizard-close` ruft `location.reload()` auf — kein `renderAll()`/`save()` auf dem stale In-Memory-D mehr. `wizard-setup-backup` merkt die Setup-Absicht in `sessionStorage` (`migration-backup-setup-pending`) und reloaded ebenfalls; `initMigrationWizardIfNeeded()` wertet das Flag nach dem Reload aus und öffnet den Daten-Tab mit Backup-Bereich + Hinweis-Toast (Ordner-Picker braucht ohnehin eine frische User-Geste).

### CR-05: Snapshot-Pruning löschte Backups fremder Kampagnen

**Dateien:** `systems/file-backup/file-backup-manager.js`, `tests/unit/file-backup.test.js`
**Commit:** 45a0e09
**Fix:** Neuer Helper `getSnapshotRegex(safeName)` (verankert: `^{safeName}-\d{4}-\d{2}-\d{2}\.json$`, regex-escaped) ersetzt den Substring-Match in `pruneOldSnapshots()`. Test-Mock-Dateinamen an die reale Namenskonvention angepasst (`standard-2026-01-01.json` statt `backup-standard-2026-01-001.json`).

### CR-06: PWA-Install-Button konnte nie sichtbar werden

**Datei:** `assets/templates/header.html`
**Commit:** 9b8f607
**Fix:** `id="pwa-install-btn"` am Header-Button ergänzt (Review-Alternative 2) — alle drei `window.$('pwa-install-btn')`-Lookups in pwa-install.js funktionieren jetzt, Projektkonvention `$()` bleibt erhalten.

### CR-07: Backup-Status-UI ohne DOM-Anker; Warnindikator leer; Settings-Ziele tot

**Dateien:** `assets/templates/view-tools.html`, `systems/tab-registry.js`, `systems/file-backup/file-backup-ui.js`, `features/command-palette/action-registry.js`
**Commit:** 1f627ae
**Fix:** (1) `<div class="backup-status-section">` im „⚙️ Einstellungen"-Bereich des Daten-Tabs verankert (D-17/D-18 erreichbar); (2) `renderBackupStatus` in `TAB_RENDER_REGISTRY.data.renders` registriert; (3) Indikator-Befüllung VOR den Section-Guard gezogen (Pausiert-Warnung D-16 jetzt sichtbar, Befüllung vor `display:flex`); (4) `open-settings-backup` → `switchView('data')` + Scroll; (5) Palette-Aktion `open-settings` → Daten-Tab statt nicht-existentem `settings-modal`.

### CR-08: Font-URLs brachen in jedem gebündelten Build

**Datei:** `build.py`
**Commit:** 29a6358
**Fix:** Nach dem CSS-Einlesen wird `url('../fonts/` → `url('./assets/fonts/` umgeschrieben (vor Minifizierung). Im Artefakt verifiziert: 10/10 Font-URLs korrekt, 0 alte Pfade.

### CR-09: SW-Precache scheiterte auf GitHub Pages; CI-Font-Kopie verschachtelt

**Dateien:** `sw.js`, `.github/workflows/ci.yml`
**Commit:** 28999a9
**Fix:** (1) `'./'` aus dem Precache entfernt (kein index.html im Pages-Artefakt → 404 → addAll-Totalausfall); (2) Split in `CORE_ASSETS` (HTML+Manifest, hartes `cache.addAll`) und `OPTIONAL_ASSETS` (Icons/Fonts via `Promise.allSettled` — einzelne 404 killen die Installation nicht mehr); `CACHE_VERSION`-Zeile unverändert, build.py-Bump funktioniert weiter; (3) ci.yml: `mkdir -p dist/assets` + `cp -r assets/fonts dist/assets/` — keine `fonts/fonts`-Verschachtelung mehr, icons-Kopie normalisiert.

### CR-10: Command Palette — Klick warf TypeError; Enter ohne Navigation tat nichts

**Datei:** `features/command-palette/command-palette.js`
**Commit:** d71c124
**Fix:** Handler liest `ctx.target.dataset.commandId` (ctx ist das Delegation-Kontextobjekt, nicht das Element). Enter ohne Pfeiltasten-Fokus führt jetzt den Top-Treffer aus.

### CR-11: Wizard-Import überschrieb Bestand ohne Bestätigung

**Datei:** `systems/migration/migration-wizard.js`
**Commit:** 26c3599
**Fix:** Vor dem Import bei nicht-leerem Bestand (`!isFreshInstall()` ODER Kampagnen-Index nicht leer) `confirm()` mit Klartext (Kampagnen-Anzahl der Datei, expliziter Hinweis dass nur die aktive Kampagne per Strg+Z zurückholbar ist). Abbruch hinterlässt unveränderte Daten. Vorgelagerte `_exportType`-Prüfung, damit der Dialog nicht für ungültige Dateien erscheint.

### WR-01: Strg+Shift+K kollidiert mit Firefox-DevTools

**Datei:** `systems/spellslots/keyboard-shortcuts.js`
**Commit:** c8c1005
**Fix:** Zusätzliches Binding `Strg+.` (browserneutral, in Firefox unbelegt) als Alternative; Strg+Shift+K bleibt für Chrome/Edge erhalten.

### WR-02: Wizard registrierte bei jedem Öffnen einen weiteren Click-Listener

**Datei:** `systems/migration/migration-wizard.js`
**Commit:** 1f4be49
**Fix:** Guard `modal.dataset.actionsBound` in `_setupWizardActions()` — der Listener hängt am wiederverwendeten Modal-Element und wird nur einmal gebunden. Drag&Drop-Listener (auf per innerHTML neu erzeugten Kindern) werden weiterhin korrekt neu gebunden.

### WR-03: Import schrieb beliebige localStorage-Keys

**Datei:** `systems/migration/full-export.js`
**Commit:** 1291e2d
**Fix:** Key-Whitelist + Mengenlimit (max 100) + Längenlimit (200 Zeichen). **Abweichung vom Review-Vorschlag:** Whitelist `/^(dnd-tracker(-|$)|dnd-campaign-)/` statt nur `/^dnd-tracker(-|$)/` — `createCampaign()` erzeugt real Keys im Format `dnd-campaign-<timestamp>` (campaign-manager.js:29); der Review-Regex hätte legitime Kampagnen-Importe blockiert.

### WR-04: Migration verlor diceFavorites

**Datei:** `systems/migration/full-export.js`
**Commit:** fbf260a
**Fix:** `importFullExport()` schreibt `parsedObj.diceFavorites` nach `APP_CONFIG.DICE_FAV_KEY` zurück. Die Top-Level-Felder `settings`/`dmScreenProfiles` bleiben im Exportformat (liegen redundant in den Kampagnendaten; Entfernen hätte den bestehenden Export-Test gebrochen).

### WR-05: Escaping im falschen Kontext (+ IN-05)

**Dateien:** `systems/migration/migration-wizard.js`, `systems/file-backup/file-backup-ui.js`
**Commit:** a32dfb1
**Fix:** Alle `showError()`-/`textContent`-Strings auf echte UTF-8-Literale umgestellt (keine HTML-Entities, kein `esc()`); `confirm()`-Text ohne `esc()`; alle 7 `showToast('… ' + esc(x))`-Doppel-Escapings entfernt (showToast escapet intern, utilities.js:285). `esc()` bleibt überall dort, wo in innerHTML interpoliert wird. **Trivial mitbehoben: IN-05** (Doppel-esc beim Divergenz-Banner-Datum am Aufrufer entfernt).

### WR-06: „Jetzt neu laden" reloadete vor SW-Aktivierung

**Datei:** `systems/spellslots/pwa-install.js`
**Commit:** a46bdbb
**Fix:** Reload erst bei `controllerchange` (`{ once: true }`), dann `SKIP_WAITING` senden; 3s-Fallback-Timeout falls die Aktivierung hängt (kein Doppel-Reload möglich — Page-Unload beendet Timer/Listener).

### WR-07: Deploy-Job lief auch für pull_request-Events

**Datei:** `.github/workflows/ci.yml`
**Commit:** 196b1db
**Fix:** `if: github.event_name == 'push' && github.ref == 'refs/heads/main'` am deploy-Job.

### WR-08: `test.fail(true, …)` als Skip missbraucht (+ IN-01)

**Dateien:** `tests/e2e/features/pwa.spec.js`, `tests/e2e/features/command-palette.spec.js`
**Commit:** 0c13bcb
**Fix:** `test.skip(true, …)` bzw. `test.skip(!targetUrl || file://, …)` statt `test.fail` — lokal verifiziert: 2 skipped statt 2 failed. **Trivial mitbehoben: IN-01** — `expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)` am Ende des SW-Tests und beider Command-Palette-Tests (genau die Fehlerklasse aus CR-01 wird jetzt gefangen; gegen das Produktions-Bundle grün gelaufen).

### WR-09: Vakuumöse Unit-Tests

**Dateien:** `tests/unit/full-export.test.js`, `tests/unit/file-backup.test.js`
**Commit:** 477191f
**Fix:** (1) `StorageAPI.getJSON`-Mock per Key differenziert — Kampagnen-Key liefert echte Daten MIT `spells: [{source:'srd'}]`; neue Assertions: Kampagne wurde eingesammelt + `data.spells === undefined` (Strip-Pfad real durchlaufen). (2) `getFileHandle`-Mock wirft `NotFoundError` bei `{create:false}` für fehlende Dateien — Tages-Snapshot-Zweig und Prune-on-Write werden jetzt ausgeführt; Assertions auf konkrete current- UND Snapshot-Dateinamen; neuer Test „nur EIN Snapshot pro Tag"; neuer CR-05-Regressionstest (Präfix-Kollision `kampagne` vs. `kampagne-2`).

### WR-10: 13× function-scoped `const X = window.X` (+ IN-02)

**Dateien:** `systems/spellslots/keyboard-shortcuts.js`, `systems/spellslots/keyboard-shortcuts.d.ts`
**Commit:** 7839bc1
**Fix:** Alle 13 Stellen auf Direktaufrufe `if (typeof window.X === 'function') window.X();` umgestellt (CLAUDE.md-Dedup-Regel, Incident 2026-01-10). **Trivial mitbehoben: IN-02** — unerreichbarer zweiter `?`-Block und tote `showKeyboardHelp()` entfernt, `.d.ts`-Deklaration bereinigt (typecheck grün).

### WR-11: Backup-Browser restaurierte fremde Kampagnen in die aktive; Restore ohne migrateData

**Dateien:** `systems/file-backup/file-backup-manager.js`, `systems/file-backup/file-backup-ui.js`
**Commit:** 4cecdb6
**Fix:** (1) Neuer Export `getActiveBackupFilenames()`; Browser-Listing filtert via `getSnapshotRegex(safeName)` auf Snapshots der AKTIVEN Kampagne (app-fremde JSONs erscheinen nicht mehr); (2) `restoreFromFileBackup()` validiert den Dateinamen zusätzlich gegen die aktive Kampagne (Defense-in-Depth); (3) vor `Object.assign`: `migrateData(parsed)` (wie Import-Pfad) + Default-Auffüllung fehlender Kernfelder über `initializeData()` (kanonisches D-Schema aus core/data.js) — kein unvollständiges D mehr bis zum Reload.

### WR-12: fetch-fonts.py griff erste woff2-URL (falsches Subset)

**Datei:** `tools/fetch-fonts.py`
**Commit:** ce13194
**Fix:** `extract_woff2_url()` selektiert gezielt den `/* latin */`-Block (DOTALL, exakt — matcht nicht `latin-ext`), mit Fallback auf den ersten Treffer. Mit synthetischem Google-CSS getestet (latin gewinnt; Fallback greift, wenn kein latin-Kommentar existiert).

## Mitbehobene Info-Findings (trivial, im selben Fix)

| Info | Mitbehoben in | Commit |
|---|---|---|
| IN-01 (pageerror nie geprüft) | WR-08 | 0c13bcb |
| IN-02 (toter `?`-Handler / showKeyboardHelp) | WR-10 | 7839bc1 |
| IN-05 (Doppel-esc Divergenz-Banner) | WR-05 | a32dfb1 |
| IN-11 (restore-Handler ctx als `e`) | CR-01 | e9c91a7 |

## Nicht behandelte Info-Findings (außerhalb fix_scope, kein trivialer Beifang)

IN-03 (Palette-Label „Wuerfle 8d6"), IN-04 (toter Fallback/ungenutztes Schema in full-export.js), IN-06 (MIGRATION_PWA_URL-Platzhalter — erfordert realen Deploy zur Verifikation), IN-07 (Modullisten-Sync prüft nur Mengen), IN-08 (stale-Bundle-False-Green — für diese Session entschärft: beide Bundles wurden frisch gebaut und gegen das Produktions-Bundle gesmoked; strukturelle Lösung via `pretest:smoke` bleibt offen), IN-09 (fuzzyMatch-Kopie im Test), IN-10 (Fallback-Key `'dnd-tracker-data'` vs. `'dnd-tracker-v4'` — greift nur ohne APP_CONFIG).

## Hinweise für Folgearbeiten

1. **CLAUDE.md-Ergänzung (aus CR-02):** Das Live-Sync-Muster in CLAUDE.md sollte um den Hinweis ergänzt werden, dass der globale `_originalSave`-Guard nur EINEN Hook trägt (neue Hooks: eigener Guard + Verkettung). Bewusst nicht automatisch ausgeführt — bitte manuell nachziehen.
2. **IN-06:** Nach dem ersten echten Pages-Deploy die `MIGRATION_PWA_URL` (migration-wizard.js:18) gegen die reale URL prüfen (Repo heißt `DnD_Tracker_App_Pro`, Platzhalter nennt `DnD_Tracker_Pro`).
3. **WR-07/CR-09 (ci.yml):** Wirkung final erst am echten GitHub-Actions-Lauf beweisbar (lokal nur YAML-validiert + Logik geprüft).

---

_Behoben: 2026-06-12T22:41:37Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
