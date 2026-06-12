---
phase: 02-technik-fundament
reviewed: 2026-06-12T23:58:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - sw.js
  - manifest.webmanifest
  - build.py
  - loader.js
  - index.html
  - .github/workflows/ci.yml
  - assets/styles.css
  - assets/styles/command-palette.css
  - assets/styles/file-backup.css
  - assets/styles/fonts.css
  - assets/styles/migration.css
  - assets/styles/pwa.css
  - assets/templates/header.html
  - core/init.js
  - features/command-palette/action-registry.js
  - features/command-palette/command-palette.js
  - icons/icon.svg
  - systems/file-backup/file-backup-manager.js
  - systems/file-backup/file-backup-permissions.js
  - systems/file-backup/file-backup-ui.js
  - systems/migration/full-export.js
  - systems/migration/migration-wizard.js
  - systems/spellslots/keyboard-shortcuts.js
  - systems/spellslots/pwa-install.js
  - tests/e2e/features/command-palette.spec.js
  - tests/e2e/features/pwa.spec.js
  - tests/unit/action-registry.test.js
  - tests/unit/file-backup.test.js
  - tests/unit/full-export.test.js
  - tools/fetch-fonts.py
  - tools/render-icons.py
findings:
  critical: 11
  warning: 12
  info: 11
  total: 34
status: issues_found
---

# Phase 2: Code Review Report — Technik-Fundament

**Reviewed:** 2026-06-12T23:58:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

Review der Phase-2-Implementierung (PWA, Migration, Datei-Backup, Command Palette, Build/CI). Alle Querbezüge wurden gegen den realen Code verifiziert (EventDelegation-API, `$()`-Implementierung, `fuzzyMatch`-Signatur, `showToast`-Escaping, Persistenz-Pfad, Template-IDs, dist-Bundles).

**Schwerwiegendstes Ergebnis (empirisch bewiesen):** Das Produktions-Bundle `dist/dnd-tracker-optimized.html` (Build von heute 23:41) stirbt beim Laden mit `ReferenceError: Cannot access 'EventDelegation' before initialization` — die App startet im Production-Build überhaupt nicht (CR-01). Der lokale Smoke-„passed"-Status ist ein False Green: Die Smoke-Config fiel auf das veraltete Dev-Bundle von 13:56 zurück, das keines der Welle-2-Module enthält (IN-08). Ein Smoke-Lauf gegen das echte Produktions-Bundle schlägt reproduzierbar fehl (im Review ausgeführt).

Darüber hinaus ist die Datei-Backup-Kette (TECH-03) durch drei unabhängige Defekte vollständig funktionsunfähig (CR-02, CR-03, CR-07), der Migrations-Wizard zerstört im Erfolgspfad die gerade importierten Daten (CR-04), das Snapshot-Pruning kann Backups fremder Kampagnen löschen (CR-05), und die PWA-Offline-Fähigkeit (TECH-01) scheitert auf GitHub Pages am Precache (CR-08/CR-09). Der PWA-Install-Button kann nie erscheinen (CR-06), und die Command Palette reagiert nicht auf Maus-Klicks (CR-10).

Kein Performance-Scope (v1). Test-Dateien wurden nur auf Zuverlässigkeitsdefekte geprüft.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Produktions-Bundle stirbt mit TDZ-ReferenceError — App startet nicht (bewiesen)

**File:** `systems/spellslots/pwa-install.js:104`, `systems/file-backup/file-backup-ui.js:427`, `systems/migration/migration-wizard.js:484` (Ursache: `ui/event-delegation.js:36`)
**Issue:** Die drei Module führen auf Modul-Ebene `if (typeof EventDelegation !== 'undefined') { EventDelegation.registerAction(...) }` aus. `EventDelegation` ist aber als `const` in `ui/event-delegation.js` deklariert und wird **nicht** auf `window` exportiert. Die drei Module laden in der Modulreihenfolge (loader.js Z. 32, 51–55) **vor** `ui/event-delegation.js` (Z. 114).
- **Bundle (Produktion):** Alles ist EIN Script — die `const`-Deklaration liegt im selben Script-Scope ~1 MB weiter hinten (Byte-Offsets im gebauten Bundle: Registrierung `install-pwa` @ 668.227, `const EventDelegation` @ 1.698.616). `typeof` auf eine `const` in der Temporal Dead Zone **wirft** ReferenceError → das gesamte Bundle bricht ab, `init()` wird nie definiert, die App ist tot. **Empirisch verifiziert:** `npx playwright test --config=playwright.smoke.config.js` gegen `dist/dnd-tracker-optimized.html` schlägt fehl mit `"Cannot access 'EventDelegation' before initialization"`.
- **Loader-Modus (Dev):** Separate Scripts → `typeof` ergibt `'undefined'` → Registrierung wird still übersprungen → **alle 11 data-actions dieser Module sind tot**: `install-pwa`, `setup-file-backup`, `open-file-backup-browser`, `restore-file-backup`, `reconnect-file-backup`, `download-file-backup`, `open-settings-backup`, `reopen-migration-wizard`, `start-migration-flow`, `close-migration-hint`, `dismiss-divergence-banner`.

Das zitierte Vorbild (`ui/actions/entity-actions.js` Z. 279–283) funktioniert nur, weil es **nach** event-delegation.js lädt. `initCommandPalette()` (command-palette.js:202) macht es richtig: Registrierung erst zur init()-Laufzeit.
**Fix:**
```javascript
// In jedem der drei Module: Registrierung in eine init-Funktion verlagern
// und aus core/init.js aufrufen (Muster: initCommandPalette).
function initPWAActions() {
    if (typeof EventDelegation === 'undefined') return;
    EventDelegation.registerAction('install-pwa', () => {
        if (typeof window.installPWA === 'function') window.installPWA();
    });
}
window.initPWAActions = initPWAActions;
// core/init.js (nach initPWA()):
if (typeof window.initPWAActions === 'function') window.initPWAActions();
```
Analog `initFileBackupActions()` und `initMigrationActions()`. Die Modul-Level-`if (typeof EventDelegation ...)`-Blöcke ersatzlos entfernen.

### CR-02: `_originalSave`-Guard-Kollision — Datei-Backup-Hook wird nie installiert

**File:** `systems/file-backup/file-backup-manager.js:311-320` (Kollision mit `features/dmscreen/dmscreen-render.js:151-159`)
**Issue:** Beide Module benutzen denselben Guard `window._originalSave` mit `typeof === 'undefined'`-Check. Es kann nur EINER der beiden save()-Hooks installiert werden:
- Im Bundle registriert dmscreen-render.js seinen DOMContentLoaded-Listener vor dem init()-Trigger am Bundle-Ende → `setupDMScreenLiveSync()` läuft **vor** `initFileBackup()` → `_originalSave` ist definiert → der File-Backup-Hook wird still übersprungen → **`onAfterSave()` wird nie aufgerufen, es wird nie ein Backup geschrieben** (TECH-03-Kernfunktion tot).
- Im Loader-Modus gewinnt praktisch immer der `setTimeout(setupDMScreenLiveSync, 100)` (dmscreen-render.js:166), bevor init() die restlichen ~60 Module abgewartet hat — gleiches Ergebnis. Gewänne umgekehrt File-Backup, wäre der DM-Screen-Live-Sync tot (Regression).

Zusätzlich irreführend: Der Restore-Teil von `initFileBackup()` läuft trotzdem und setzt Status `active` — die UI behauptet dann ein aktives Backup, das nie schreibt.
**Fix:**
```javascript
// file-backup-manager.js — eigenen Guard verwenden und Kette bilden:
if (typeof window !== 'undefined' && typeof window.save === 'function' &&
        !window._fileBackupSaveHooked) {
    window._fileBackupSaveHooked = true;
    const prevSave = window.save;
    window.save = function () {
        prevSave.apply(this, arguments);
        onAfterSave();
    };
}
```
CLAUDE.md-Live-Sync-Doku entsprechend ergänzen (ein globaler `_originalSave`-Guard trägt nur EINEN Hook).

### CR-03: Backup-Ordner-Persistenz vollständig defekt — `window.idb` ist undefined und der IDB-Store `fileHandles` existiert nicht

**File:** `systems/file-backup/file-backup-permissions.js:29,33,46,49` und `core/init.js:266-303`
**Issue:** Zwei unabhängige Root Causes:
1. `saveHandleToIDB()`/`loadHandleFromIDB()` lesen `const idb = window.idb`. In `core/init.js:267` ist `idb` aber mit `let` deklariert — Top-Level-`let` in klassischen Scripts erzeugt **keine** window-Property. Nirgendwo wird `window.idb` gesetzt (Grep: nur `tools/debug.js:882` setzt es auf `null`). → `idb` ist `undefined` → `idb.transaction(...)` wirft TypeError.
2. Selbst mit korrektem `window.idb`: Der `onupgradeneeded`-Handler (core/init.js:279-301, `IDB_VERSION = 2`) legt nur `campaigns`, `backups`, `images` an — den vom Modul benötigten Store **`fileHandles` gibt es nicht** und `IDB_VERSION` wurde nicht gebumpt (der eigene Modul-Kommentar in file-backup-permissions.js:5-11 fordert genau das). → `transaction(['fileHandles'])` würde NotFoundError werfen.

Konsequenz-Kette in `showFileBackupSetup()` (file-backup-ui.js:32-35): `await saveHandleToIDB(dirHandle)` wirft **bevor** `window._fileBackupDirHandle = dirHandle` gesetzt wird → der catch zeigt „Backup-Ordner konnte nicht gewählt werden" → das Backup wird **nicht einmal für die laufende Sitzung** aktiv. `restoreBackupFolder()` liefert immer `null` → nach Reload nie wiederherstellbar. TECH-03 ist damit Ende-zu-Ende funktionsunfähig (zusätzlich zu CR-01/CR-02).
**Fix:**
```javascript
// core/init.js
const IDB_VERSION = 3; // Bump für fileHandles-Store
request.onsuccess = () => {
    idb = request.result;
    window.idb = idb; // Export für persistence.js, backups.js, file-backup-permissions.js
    resolve(idb);
};
// in onupgradeneeded ergänzen:
if (!db.objectStoreNames.contains('fileHandles')) {
    db.createObjectStore('fileHandles', { keyPath: 'id' });
}
// file-backup-ui.js: In-Memory-Handle VOR der IDB-Persistenz setzen,
// IDB-Fehler separat behandeln (Backup soll in der Sitzung trotzdem laufen).
```
Hinweis: Dass `window.idb` nie gesetzt wird, betrifft auch die Bestandsmodule `persistence.js`, `backups.js`, `campaign-manager.js` (gleiches Lesemuster) — der Fix in init.js repariert alle.

### CR-04: Migrations-Wizard überschreibt die importierten Daten im Erfolgspfad (kein Reload, stattdessen `save()`)

**File:** `systems/migration/migration-wizard.js:305-313`
**Issue:** `importFullExport()` schreibt die importierten Kampagnen korrekt in localStorage — das In-Memory-`D` wird aber nie neu geladen. Der `wizard-close`-Handler ruft danach `renderAll()` (rendert das alte, leere D) und `save()` auf. `save()`/`saveImmediate()` serialisieren `window.D` und schreiben es auf den aktiven Storage-Key (persistence.js:14-20, 167-177) — **das frisch importierte Aktiv-Kampagnen-Datenpaket wird mit dem leeren Fresh-Install-D überschrieben.** Der Kommentar sagt „App neu laden, damit importierte Daten geladen werden", der Code lädt aber nicht neu. Gleiches Problem im `wizard-setup-backup`-Pfad (Z. 314-321): stale D bleibt im Speicher, der nächste Autosave überschreibt den Import. Für den Nutzer sieht es aus, als wäre die Migration fehlgeschlagen.
**Fix:**
```javascript
} else if (action === 'wizard-close') {
    StorageAPI.setJSON('migration-wizard-shown', { shown: true, completed: true });
    location.reload(); // Importierte Daten laden — KEIN renderAll()/save() auf stale D
}
// wizard-setup-backup: Flag setzen, Backup-Setup-Absicht z.B. in sessionStorage merken,
// dann ebenfalls location.reload() (Setup nach Reload anbieten).
```

### CR-05: `pruneOldSnapshots()` löscht Backup-Dateien fremder Kampagnen (Substring-Match)

**File:** `systems/file-backup/file-backup-manager.js:144`
**Issue:** Snapshot-Erkennung via `name.includes(safeName)`. Ist ein safeName Präfix/Substring eines anderen (real: „kampagne" und „kampagne-2"), zählt das Pruning für „kampagne" auch alle „kampagne-2-…"-Snapshots mit. Sortierung: `"kampagne-2-2026-…"` sortiert **vor** `"kampagne-2026-…"` (`-` < `0`) — beim Überschreiten des Limits werden also zuerst die Snapshots der **anderen** Kampagne gelöscht. Stiller Datenverlust im Backup-Sicherheitsnetz des Nutzers.
**Fix:**
```javascript
const snapshotRe = new RegExp('^' + safeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '-\\d{4}-\\d{2}-\\d{2}\\.json$');
for await (const [name] of dirHandle.entries()) {
    if (snapshotRe.test(name)) snapshots.push(name);
}
```

### CR-06: PWA-Install-Button kann nie sichtbar werden (`$()`-ID-Lookup auf ein Element ohne ID)

**File:** `systems/spellslots/pwa-install.js:21,31,47` (Gegenstück: `assets/templates/header.html:11`)
**Issue:** `window.$('pwa-install-btn')` ist `getElementById` (utils/basic.js:7-13). Der Header-Button hat aber nur `class="pwa-install-btn"`, keine ID → Lookup liefert immer `null` → `btn.style.display = 'flex'` im `beforeinstallprompt`-Handler läuft nie → der Install-Button (D-05) bleibt dauerhaft `display:none`. (Die 02-02-SUMMARY behauptet fälschlich einen `#pwa-install-btn`.)
**Fix:**
```javascript
const btn = document.querySelector('.pwa-install-btn');
```
(an allen drei Stellen) — oder `id="pwa-install-btn"` in header.html ergänzen und `$()` beibehalten.

### CR-07: Backup-Status-UI hat keinen Ankerpunkt im DOM; Header-Warnindikator bleibt leer; Settings-Ziele existieren nicht

**File:** `systems/file-backup/file-backup-ui.js:250-253,266-285,440-444`, `features/command-palette/action-registry.js:133`, `assets/templates/header.html:32`
**Issue:** Verkettete Defekte rund um „Einstellungen":
1. `renderBackupStatus()` bricht sofort ab, wenn `.backup-status-section` fehlt — dieses Element wird **nirgends** erzeugt (kein Template, kein JS; nur CSS in file-backup.css:11 definiert es). → Der D-17-Status-Bereich und der D-18-file://-Download-Button sind unerreichbar.
2. Die Befüllung des Header-Warnindikators (⚠️-innerHTML, `aria-hidden`, data-action) liegt **nach** diesem Early-Return (Z. 266-285). `setBackupStatus()` (file-backup-manager.js:174-181) setzt im paused-Fall nur `display:flex` auf das **leere** `<div class="backup-warning-indicator">` aus header.html:32 → die Pausiert-Warnung (D-16) ist unsichtbar (leere Flexbox mit Tooltip).
3. `open-settings-backup` ruft `switchView('settings')` auf — es gibt keinen `data-view="settings"`-Tab (header.html:46-68). Die Palette-Aktion `open-settings` ruft `showModal('settings-modal')` auf — `settings-modal` existiert in keinem Template (Grep über assets/templates: nur about/location/npc/quest-modal). Beide Aktionen sind No-Ops.
**Fix:** `.backup-status-section` im bestehenden Einstellungen-Bereich des Daten-Tabs verankern (view-tools.html:344, „⚙️ Einstellungen"-data-section): `<div class="backup-status-section"></div>` ergänzen und `renderBackupStatus()` beim Tab-Render aufrufen. Indikator-Befüllung VOR den Section-Guard ziehen (oder in `setBackupStatus()` verschieben). `open-settings-backup` auf `switchView('data')` + scroll umstellen; Palette-Aktion `open-settings` ebenfalls auf den Daten-Tab zeigen lassen oder entfernen.

### CR-08: Font-URLs brechen in jedem gebündelten Build — `url('../fonts/…')` wird beim Inlining nicht umgeschrieben

**File:** `build.py:416-439` (Quelle: `assets/styles/fonts.css:13` ff.)
**Issue:** build.py liest fonts.css und inlined sie in den `<style>`-Block der HTML-Datei. Relative `url()`-Pfade in Inline-Styles lösen gegen die **Dokument-URL** auf, nicht mehr gegen `assets/styles/`: `https://host/repo/dnd-tracker-optimized.html` + `../fonts/roboto-400.woff2` → `https://host/fonts/roboto-400.woff2` (eine Ebene ÜBER dem App-Verzeichnis) → 404 in jedem dist-Build (dev und prod), lokal wie auf GitHub Pages. D-07 („vollständige Offline-Fähigkeit, lokale Fonts") regressiert still auf Fallback-Fonts (`font-display: swap` verschleiert es). Im Dev-Modus via `@import` (styles.css) stimmen die Pfade — der Fehler existiert nur im Bundle und fällt daher in keinem file://-Smoke auf.
**Fix:**
```python
# build.py, nach dem Einlesen von fonts.css (oder auf css_content gesamt):
css_content = css_content.replace("url('../fonts/", "url('./assets/fonts/")
```
(plus Deploy-Schritt, der `assets/fonts/` korrekt nach `dist/assets/fonts/` legt — siehe CR-09).

### CR-09: SW-Precache schlägt auf GitHub Pages fehl → kein Offline-Support (TECH-01); CI-Font-Kopie erzeugt verschachteltes Verzeichnis

**File:** `sw.js:5-21`, `.github/workflows/ci.yml:102-108`
**Issue:** `cache.addAll()` ist alles-oder-nichts — ein einziger 404 lässt die SW-Installation komplett scheitern:
1. `CACHED_ASSETS` enthält `'./'` (sw.js:6). Das Pages-Artefakt (dist/) enthält **kein index.html** (build.py erzeugt keins, der Deploy-Schritt kopiert keins) → `GET /repo/` liefert auf GitHub Pages 404 → `addAll` rejected → `install` schlägt fehl → es wird **nie etwas gecacht**, die PWA ist offline nicht nutzbar.
2. `mkdir -p dist/assets/fonts` + `cp -r assets/fonts/ dist/assets/fonts/` (ci.yml:106-107): GNU cp kopiert bei existierendem Zielverzeichnis das Quellverzeichnis **hinein** → `dist/assets/fonts/fonts/*.woff2`. Die SW-Einträge `./assets/fonts/*.woff2` (sw.js:11-20) sind dann 404 — zweiter unabhängiger Install-Killer.
(Der CI-Smoke-Test gegen `python -m http.server` maskiert Punkt 1, weil der Server für `./` ein Directory-Listing mit Status 200 liefert.)
**Fix:**
```yaml
# ci.yml — Verschachtelung vermeiden:
run: |
  cp manifest.webmanifest dist/manifest.webmanifest
  cp -r icons dist/
  mkdir -p dist/assets
  cp -r assets/fonts dist/assets/
```
```javascript
// sw.js — './' entfernen ODER ein index.html (Redirect auf die App) mit ausliefern;
// zusätzlich robust cachen, damit ein einzelner 404 nicht alles killt:
event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
        Promise.allSettled(CACHED_ASSETS.map(a => cache.add(a)))
    )
);
```
(Kernassets wie die HTML-Datei sollten weiterhin hart fehlschlagen dürfen — mindestens aber `'./'` entfernen, solange kein index.html deployt wird.)

### CR-10: Command Palette: Maus-Klick auf ein Ergebnis wirft TypeError und tut nichts

**File:** `features/command-palette/command-palette.js:206-207` (Vertrag: `ui/event-delegation.js:101,109`)
**Issue:** EventDelegation übergibt Handlern ein Kontext-Objekt `ctx = { id, type, value, target, event }` — **nicht** das Element. Der Handler liest `ctx.dataset` (undefined) und fällt auf `ctx.getAttribute('data-command-id')` zurück → `ctx.getAttribute is not a function` → TypeError, der von der Delegation gefangen und nur geloggt wird → **Klick auf ein Palette-Ergebnis führt nichts aus.** Da zusätzlich Enter ohne vorherige Pfeiltasten-Navigation nichts ausführt (`_handleCPKeydown` Z. 145-150 verlangt `_cpFocusedIndex >= 0`), ist der einzige funktionierende Bedienpfad „ArrowDown + Enter".
**Fix:**
```javascript
EventDelegation.registerAction('execute-command', function(ctx) {
    var el = ctx.target; // Element mit data-action
    var commandId = el && el.dataset ? el.dataset.commandId : null;
    if (!commandId) return;
    // ...
});
// Zusätzlich in _handleCPKeydown (Enter):
if (_cpFocusedIndex === -1 && _cpCurrentResults.length > 0) {
    _executeAction(_cpCurrentResults[0]); _closeCP(); return;
}
```

### CR-11: Wizard-Import überschreibt alle Kampagnen sofort beim Datei-Drop — ohne Bestätigung, Undo deckt nur die aktive Kampagne

**File:** `systems/migration/migration-wizard.js:239-258`, `systems/migration/full-export.js:121-143`
**Issue:** `_processWizardFile()` importiert unmittelbar nach Parse — kein Bestätigungsdialog. `importFullExport()` schreibt **alle** Kampagnen-Keys plus Kampagnen-Index direkt nach localStorage. Das davor aufgerufene `saveUndoState()` (T-02-11, „kein stiller Datenverlust") snapshottet aber nur `window.D` (undo.js:9-14) — also ausschließlich die aktive Kampagne. Alle anderen Kampagnen sind nach einem Drop **irreversibel** überschrieben. Der Wizard ist per `reopen-migration-wizard` ausdrücklich ohne Guards bei vorhandenen Daten aufrufbar (D-09, Z. 482-489) — sobald CR-01 behoben ist, genügt ein versehentlicher Drop, um Bestand-Kampagnen zu verlieren.
**Fix:** Vor dem Import bei nicht-leerem Bestand (`!isFreshInstall()` oder vorhandener Kampagnen-Index) einen `confirm()` mit Klartext einbauen („Überschreibt N vorhandene Kampagnen — fortfahren?"); alternativ/zusätzlich vor dem Import ein automatisches Voll-Backup der überschriebenen Keys anlegen (z. B. `downloadFullExport()` oder Kopie unter `key + '_pre-import'`).

## Warnings

### WR-01: Strg+Shift+K kollidiert mit Firefox-DevTools (Web-Konsole)

**File:** `systems/spellslots/keyboard-shortcuts.js:65-69`
**Issue:** `Ctrl+Shift+K` öffnet in Firefox die Web-Konsole; Browser-DevTools-Shortcuts sind per `preventDefault()` nicht abfangbar. Auf Firefox (laut CLAUDE.md unterstützt) ist die Command Palette per Tastatur unerreichbar.
**Fix:** Zusätzliches Binding registrieren (z. B. `Ctrl+Shift+P` ist in Firefox ebenfalls belegt — besser `Ctrl+.` oder `Ctrl+Shift+O`-Alternative prüfen) und/oder einen sichtbaren Einstieg (Header-Button/Palette-Eintrag in der globalen Suche) anbieten.

### WR-02: Wizard registriert bei jedem Öffnen einen weiteren Click-Listener (Aktionen feuern mehrfach)

**File:** `systems/migration/migration-wizard.js:149-164,293-323`
**Issue:** Beim Wiederöffnen wird das bestehende Modal-Element wiederverwendet (`modal.innerHTML = content`), aber `_setupWizardActions(modal)` hängt **erneut** einen Click-Listener an dasselbe Element. Nach N Öffnungen feuert jede Aktion N-fach: `wizard-next-step` springt mehrere Schritte, Flags werden mehrfach gesetzt.
**Fix:** Listener-Guard: `if (!modal.dataset.actionsBound) { modal.dataset.actionsBound = '1'; modal.addEventListener('click', ...); }` — oder das Modal vor Neuaufbau via `modal.remove()` ersetzen.

### WR-03: `importFullExport()` schreibt beliebige localStorage-Keys aus nicht vertrauenswürdiger Datei

**File:** `systems/migration/full-export.js:121-143`
**Issue:** Die Keys aus `parsedObj.campaigns` werden ungeprüft als localStorage-Keys verwendet (`StorageAPI.setJSON(key, ...)`). Eine manipulierte/fremde Exportdatei kann damit beliebige Same-Origin-Keys überschreiben (z. B. `dnd-tracker-campaigns`-Index, `migration-wizard-shown`, Theme-/Settings-Keys). Eingabevalidierungslücke.
**Fix:** Key-Whitelist erzwingen, z. B. `if (!/^dnd-tracker(-|$)/.test(key)) throw new Error('Unerwarteter Kampagnen-Key: ' + key);` und Anzahl/Gesamtgröße limitieren.

### WR-04: Migration verliert diceFavorites (Export enthält sie, Import stellt sie nie wieder her)

**File:** `systems/migration/full-export.js:74-77,109-157`
**Issue:** `buildFullExport()` exportiert `settings`, `diceFavorites` (eigener Storage-Key `DICE_FAV_KEY`) und `dmScreenProfiles` — `importFullExport()` schreibt aber nur `campaigns` + `campaignIndex` zurück. Würfel-Favoriten (separater localStorage-Key, nicht Teil der Kampagnendaten) gehen beim Umzug verloren; die Top-Level-Felder `settings`/`dmScreenProfiles` sind toter Export-Ballast.
**Fix:** Im Import ergänzen: `if (Array.isArray(parsedObj.diceFavorites)) StorageAPI.setJSON(APP_CONFIG.DICE_FAV_KEY, parsedObj.diceFavorites);` — oder die Felder aus dem Exportformat entfernen und FULL_EXPORT_SCHEMA anpassen.

### WR-05: Escaping im falschen Kontext — sichtbare HTML-Entities und Doppel-Escaping

**File:** `systems/migration/migration-wizard.js:234,263,280,284`, `systems/file-backup/file-backup-ui.js:41,45,186,236,377,404`
**Issue:** Drei Varianten desselben Fehlers:
1. `showError()` setzt `errorEl.textContent` — die übergebenen Strings enthalten rohe HTML-Entities (`g&#252;ltige`, `&#220;berspringen`) und `esc(msg)`/`esc(file.name)` → Nutzer sieht wörtlich `g&#252;ltige` bzw. `&amp;` statt Umlauten/Sonderzeichen.
2. `confirm()` (file-backup-ui.js:186) zeigt Klartext — `esc(campaignDisplay)` produziert sichtbare Entities im nativen Dialog.
3. `showToast()` escapet intern bereits selbst (utilities.js:285) — alle `showToast('… ' + esc(x))`-Aufrufe doppel-escapen (`D&D` → angezeigt als `D&amp;D`).
**Fix:** Bei `textContent` und `confirm()` echte UTF-8-Literale verwenden und `esc()` weglassen; bei `showToast()` rohe Strings übergeben (interne Escapung genügt). `esc()` nur für innerHTML-Interpolation.

### WR-06: „Jetzt neu laden" reloaded vor SW-Aktivierung — Update wird ggf. still nicht angewendet

**File:** `systems/spellslots/pwa-install.js:80-88`
**Issue:** Der Reload-Button sendet `SKIP_WAITING` und ruft sofort `location.reload()` auf. Die Aktivierung des neuen SW läuft asynchron — der Reload kann noch vom alten SW (Cache-First) bedient werden. Da der sessionStorage-Guard `sw-update-shown` Reloads im selben Tab überlebt (Z. 58), erscheint der Hinweis auch nicht erneut → Nutzer bleibt unbemerkt auf der alten Version.
**Fix:**
```javascript
navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
if (newSW) newSW.postMessage({ type: 'SKIP_WAITING' });
```

### WR-07: Deploy-Job läuft auch für pull_request-Events

**File:** `.github/workflows/ci.yml:3-7,81-114`
**Issue:** Alle Jobs — inklusive `deploy` — triggern sowohl auf `push` als auch auf `pull_request`. Ein Same-Repo-PR gegen main würde nach grünem Smoke ungemergten Code auf GitHub Pages deployen (Fork-PRs scheitern nur an Token-Rechten).
**Fix:**
```yaml
deploy:
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

### WR-08: `test.fail(true, …)` als Skip missbraucht — Tests schlagen lokal garantiert fehl

**File:** `tests/e2e/features/pwa.spec.js:27,51`
**Issue:** `test.fail(true, msg)` markiert den Test als „expected to fail"; das anschließende `return` lässt den Body erfolgreich enden → Playwright meldet „Expected to fail, but passed" = **Failure**. Ohne gesetzte `SMOKE_BASE_URL`/`PWA_BASE_URL` (lokaler `npm run test:e2e`-Lauf) sind beide PWA-Tests damit dauerhaft rot, obwohl „überspringen" gemeint war.
**Fix:** `test.skip(true, msg)` statt `test.fail(true, msg)` verwenden (bzw. `test.skip(!process.env.SMOKE_BASE_URL, …)` am Testanfang).

### WR-09: Unit-Tests prüfen das Kernverhalten vakuumös (Mocks verhindern den eigentlichen Codepfad)

**File:** `tests/unit/full-export.test.js:57`, `tests/unit/file-backup.test.js:29-32`
**Issue:**
1. full-export.test: `StorageAPI.getJSON`-Mock liefert für **alle** Keys `null` → `buildFullExport()` sammelt null Kampagnen → der SRD-Strip-Test (T-02-09, „keine `source:'srd'` im Output") besteht trivial, ohne dass `stripNonUserData()` je Daten mit Spells gesehen hat. Eine Regression im Strip-Code bliebe grün.
2. file-backup.test: Der `getFileHandle`-Mock wirft bei `{ create: false }` für fehlende Dateien **nicht** (echte API: NotFoundError) → `snapshotExists` ist immer `true` → der Tages-Snapshot-Zweig und das Prune-on-Write in `writeBackupForCampaign()` werden nie ausgeführt; die Assertion prüft nur „getFileHandle wurde aufgerufen".
**Fix:** (1) Mock per Key differenzieren und mindestens eine Kampagne mit `spells: [{source:'srd'}]` zurückgeben; zusätzlich assert auf `result.campaigns[key].data.spells === undefined`. (2) Mock: `getFileHandle: async (name, opts) => { if (!opts?.create && !files.has(name)) throw Object.assign(new Error('NotFound'), { name: 'NotFoundError' }); … }` und Assertions auf current- UND Snapshot-Dateinamen.

### WR-10: 13× function-scoped `const X = window.X` — verstößt gegen die dokumentierte Dedup-Regel

**File:** `systems/spellslots/keyboard-shortcuts.js:19,26,40,47,75,84,93,129,139,146,153,160,173`
**Issue:** CLAUDE.md verbietet `const X = window.X` innerhalb von Funktionen explizit (Incident 2026-01-10, `selectNPC`). Die Dedup-Pass-2-Regex in build.py:274 strip-t Einrückung und behandelt diese Zeilen wie Top-Level-Window-Imports: Sie landen in `seen_window_assigns` bzw. werden bei Konflikt mit `real_definitions` **mitten im Funktionskörper** durch einen Kommentar ersetzt. Aktuell rettet der Zufall (gleichnamige globale `function`-Deklarationen fangen die Referenzen auf), aber jedes neue Top-Level-`var X = window.X`/`const X = …` in einem anderen Modul kann diese Handler still umverdrahten oder brechen.
**Fix:** Direktaufrufe verwenden: `if (typeof window.hideShortcutsOverlay === 'function') window.hideShortcutsOverlay();` (alle 13 Stellen).

### WR-11: Backup-Browser stellt Snapshots fremder Kampagnen in die AKTIVE Kampagne wieder her; Restore ohne migrateData

**File:** `systems/file-backup/file-backup-ui.js:74-127,171-238`
**Issue:** Der Browser listet **alle** datierten `.json` des Ordners (alle Kampagnen, sogar app-fremde JSON-Dateien). `restoreFromFileBackup()` schreibt den Inhalt aber bedingungslos in das aktive `D` + `saveImmediate()` — der Snapshot von Kampagne B überschreibt so still Kampagne A (der confirm zeigt nur den Dateinamen, nicht das Ziel). Zudem wird das extern editierbare JSON — anders als beim Import-Pfad (`importFullExport` → `migrateData`) — nur oberflächlich validiert (5 Array-Typen) und ohne Versions-Migration/Sanitierung per `Object.assign` übernommen; fehlende Felder (z. B. `initiative`, `settings`) hinterlassen ein unvollständiges D bis zum nächsten Reload.
**Fix:** Beim Listen nach `safeName` der aktiven Kampagne filtern (oder pro Eintrag die Ziel-Kampagne anzeigen und den passenden Storage-Key wählen); vor `Object.assign` `migrateData(parsed)` aufrufen und Default-Felder auffüllen (gleiches Muster wie Import).

### WR-12: fetch-fonts.py greift die ERSTE woff2-URL aus dem Google-CSS — Risiko: falsches Subset ohne Latin/Umlaute

**File:** `tools/fetch-fonts.py:65-72`
**Issue:** Die Google-Fonts-CSS2-Antwort enthält mehrere `@font-face`-Blöcke mit `unicode-range` (Reihenfolge: cyrillic/greek/… zuerst, `latin` zuletzt). `extract_woff2_url()` nimmt den ersten Treffer — potenziell das Cyrillic-Subset. Da die lokale fonts.css keine `unicode-range` setzt, würde die einzige Datei für ALLE Zeichen verwendet → fehlende Latin-Glyphen/Umlaute. Beim nächsten Regenerieren der (aktuell eingecheckten) Fonts kann das still kaputtgehen.
**Fix:** Den Block mit dem Kommentar `/* latin */` selektieren, z. B. `re.search(r"/\* latin \*/.*?url\((https://[^)]+\.woff2)\)", css, re.DOTALL)`; zusätzlich die eingecheckten woff2 einmalig auf Umlaut-Glyphen prüfen.

## Info

### IN-01: E2E-Specs sammeln pageerror, prüfen sie aber nie

**File:** `tests/e2e/features/command-palette.spec.js:17-18,37-38`, `tests/e2e/features/pwa.spec.js:55-56`
**Issue:** Die `errors`-Arrays werden befüllt, aber nie assertet — die Tests können bei JS-Fehlern grün bleiben (genau die Fehlerklasse aus CR-01).
**Fix:** Am Testende `expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);` ergänzen (wie smoke.spec.js:14).

### IN-02: Toter `?`-Handler / `showKeyboardHelp()` unerreichbar

**File:** `systems/spellslots/keyboard-shortcuts.js:73-78,188-192`
**Issue:** Der zweite `if (e.key === '?')`-Block (Z. 188) ist unerreichbar — Z. 73 fängt `?` bereits ab und returnt. `showKeyboardHelp()` ist damit toter Code.
**Fix:** Block Z. 188-192 und `showKeyboardHelp()` entfernen (oder bewusst konsolidieren).

### IN-03: Palette-Aktion „Wuerfle 8d6" würfelt nicht

**File:** `features/command-palette/action-registry.js:64-71`
**Issue:** `roll-formula` mit Label „Wuerfle 8d6" wechselt nur zur Würfel-Ansicht — es wird nichts gewürfelt. Irreführendes Label.
**Fix:** Label zu „Zum Würfelbereich (Formel)" ändern oder tatsächlich `rollDice('8d6')`-Äquivalent aufrufen.

### IN-04: Toter Fallback + ungenutztes Schema in full-export.js

**File:** `systems/migration/full-export.js:9-21,40`
**Issue:** `window.getCampaignIndex ? window.getCampaignIndex() : getCampaignIndex()` — beide Zweige rufen dieselbe Funktion; der Fallback ist wirkungslos. `FULL_EXPORT_SCHEMA` wird exportiert, aber nirgends zur Validierung verwendet (deklarierte Felder werden vom Import nicht durchgesetzt, vgl. WR-04).
**Fix:** Fallback vereinfachen; Schema entweder in `importFullExport()` anwenden oder entfernen.

### IN-05: Doppeltes esc() beim Divergenz-Banner-Datum

**File:** `systems/migration/migration-wizard.js:448` (+ `:385`)
**Issue:** `showDivergenceBanner(esc(dateStr))` — innerhalb der Funktion wird erneut `esc(dateStr)` angewendet. Bei Datumsstrings harmlos, aber Doppel-Escaping-Muster.
**Fix:** `esc()` am Aufrufer entfernen.

### IN-06: MIGRATION_PWA_URL-Platzhalter weicht vom Repo-Namen ab

**File:** `systems/migration/migration-wizard.js:18`
**Issue:** URL nennt `DnD_Tracker_Pro`, das Repo heißt `DnD_Tracker_App_Pro`. Als Platzhalter kommentiert (A1), muss nach dem ersten Deploy zwingend verifiziert werden — sonst öffnet der Umzugs-Flow eine 404-Seite, nachdem der Export bereits heruntergeladen und der Divergenz-Status gesetzt wurde.
**Fix:** Nach Deploy reale URL eintragen; optional bis dahin einen Hinweis-Toast statt `window.open` verwenden.

### IN-07: Modullisten-Sync-Check vergleicht nur Mengen, nicht Reihenfolge

**File:** `build.py:179-200`
**Issue:** `check_module_list_sync` nutzt `set()`-Differenzen — eine abweichende **Reihenfolge** zwischen loader.js und build.py (lastrelevant, siehe CR-01) bliebe unentdeckt.
**Fix:** Zusätzlich Listengleichheit prüfen: `if loader_modules != build_modules: …` mit erster Abweichungsposition.

### IN-08: Veraltetes Dev-Bundle erzeugte lokalen False-Green-Smoke

**File:** `playwright.smoke.config.js:6-8` (Kontext zu CR-01)
**Issue:** `dist/dnd-tracker-bundled.html` (13:56) enthält keines der Welle-2-Module (`initCommandPalette`: 0 Treffer); der lokale Smoke-„passed" (`tests/e2e/test-results-smoke/.last-run.json`) testete dieses stale Artefakt via file://-Fallback, während das Produktions-Bundle (23:41) crasht.
**Fix:** Vor lokalem Smoke `python build.py` erzwingen (npm-Script `pretest:smoke`) oder im Fallback-Modus warnen, wenn das Bundle älter als die Quellen ist.

### IN-09: action-registry.test definiert fuzzyMatch neu statt es zu laden (Drift-Risiko)

**File:** `tests/unit/action-registry.test.js:62-90`
**Issue:** Der Test injiziert eine Kopie von `fuzzyMatch` in den vm-Kontext. Aktuell identisch mit `systems/search/global-search.js:10-40` (verifiziert), aber bei künftigen Änderungen an der echten Funktion testet der Test stillschweigend gegen die veraltete Kopie.
**Fix:** `fuzzyMatch` per Regex/Slice aus global-search.js extrahieren und in den Kontext laden, statt sie zu duplizieren.

### IN-10: Hardcodierter Fallback-Key weicht vom echten STORAGE_KEY ab

**File:** `systems/file-backup/file-backup-manager.js:249`, `systems/file-backup/file-backup-ui.js:362`
**Issue:** Fallback `'dnd-tracker-data'` — der reale Key ist `'dnd-tracker-v4'` (core/config.js:15). Greift nur, wenn APP_CONFIG fehlt, würde dann aber leere Backups schreiben.
**Fix:** Fallback an `'dnd-tracker-v4'` angleichen oder ganz auf APP_CONFIG bestehen (early return).

### IN-11: restore-file-backup-Handler benennt ctx als `e` — funktioniert nur zufällig

**File:** `systems/file-backup/file-backup-ui.js:431-435`
**Issue:** Der Parameter heißt `e` und wird wie ein Event behandelt (`e?.target?.closest(...)`) — tatsächlich ist es das ctx-Objekt der Delegation, dessen `target` zufällig das data-action-Element ist (deshalb funktioniert es, anders als CR-10). Irreführend und fragil gegenüber API-Änderungen.
**Fix:** `(ctx) => { const filename = ctx.target?.dataset?.filename; … }`.

---

_Reviewed: 2026-06-12T23:58:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
