# Phase 2: Technik-Fundament - Pattern Map

**Mapped:** 2026-06-12
**Files analyzed:** 12 new/modified files
**Analogs found:** 11 / 12

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `sw.js` (rewrite) | config | event-driven | `sw.js` (current) | exact |
| `manifest.webmanifest` (new) | config | — | inline `data:` manifest in `index.html:12` | exact |
| `core/init.js` (modify) | utility | event-driven | `core/init.js` (current) | exact |
| `systems/spellslots/pwa-install.js` (modify) | utility | event-driven | `systems/spellslots/pwa-install.js` (current) | exact |
| `.github/workflows/ci.yml` (modify) | config | — | `.github/workflows/ci.yml` (current) | exact |
| `systems/migration/migration-wizard.js` | utility | request-response | `systems/backups.js` + `features/loot-distribution.js` | role-match |
| `systems/migration/full-export.js` | utility | CRUD | `systems/spellslots/import-export.js` | exact |
| `systems/file-backup/file-backup-manager.js` | service | event-driven | `systems/backups.js` | role-match |
| `systems/file-backup/file-backup-ui.js` | utility | request-response | `systems/backups.js` showBackupsModal() | role-match |
| `systems/file-backup/file-backup-permissions.js` | utility | event-driven | `systems/backups.js` saveBackupToIndexedDB() | role-match |
| `features/command-palette/command-palette.js` | utility | request-response | `systems/search/global-search.js` | role-match |
| `features/command-palette/action-registry.js` | config | — | `systems/spellslots/keyboard-shortcuts.js` | partial-match |

---

## Pattern Assignments

### `sw.js` (rewrite) — config, event-driven

**Analog:** `sw.js` (lines 1–103) — full file read

**Imports/Header pattern** (lines 1–11):
```javascript
// Service Worker for D&D Tracker
// Cache-First Strategie für Offline-Support

const CACHE_NAME = 'dnd-tracker-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './loader.js',
    './assets/styles.css',
    './assets/body.html'
];
```
For Phase 2 the constant and asset list change; the structure and comment style are copied exactly:
```javascript
const CACHE_VERSION = 'dnd-tracker-v3';   // bumped by build.py at production time
const CACHED_ASSETS = [
    './',
    './dnd-tracker-optimized.html',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './assets/fonts/roboto-400.woff2'
    // + weitere Font-Dateien
];
```

**Install event pattern** (lines 14–22):
```javascript
self.addEventListener('install', event => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())   // ← REMOVE this in Phase 2 (D-03)
            .catch(() => self.skipWaiting())  // ← REMOVE this in Phase 2 (D-03)
    );
});
```
Phase 2 version omits `self.skipWaiting()` from install — only allowed in the SKIP_WAITING message handler.

**Activate/Fetch pattern** (lines 25–103):
```javascript
self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
                );
            })
            .then(() => clients.claim())
    );
});
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET') { return; }
    if (url.origin !== location.origin) {
        // Phase 2: alle Fonts sind lokal → kein Netzwerk-Fallback nötig für Fonts
        return;
    }
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) { return cachedResponse; }
            return fetch(event.request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type === 'opaque') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                    return response;
                })
                .catch(() => {
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('./dnd-tracker-optimized.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
        })
    );
});
```

**New: SKIP_WAITING message handler** (no analog — add after fetch handler):
```javascript
self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
```

---

### `manifest.webmanifest` (new) — config, static

**Analog:** inline `data:` manifest in `index.html:12` (not read — it is a data-URI, not a file)

No direct code analog exists in the codebase. Use the RESEARCH.md Pattern 2 verbatim:
```json
{
  "name": "D&D Kampagnen-Tracker Pro",
  "short_name": "D&D Tracker",
  "description": "Offline-Kampagnenverwaltung für Dungeons & Dragons 5e",
  "start_url": "./dnd-tracker-optimized.html",
  "id": "./dnd-tracker-optimized.html",
  "display": "standalone",
  "background_color": "#0d0d0d",
  "theme_color": "#d4af37",
  "lang": "de",
  "icons": [
    { "src": "./icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "./icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

### `core/init.js` (modify) — utility, event-driven

**Analog:** `core/init.js` (current) — full file

**SW registration anchor** (lines 173–210) — this block is the precise insertion point:
```javascript
function registerServiceWorker() {
    const protocol = window.location.protocol;
    if (protocol === 'file:') {
        log('[SW] Lokaler Modus (file://) - Service Worker nicht verfügbar, ...');
        return;
    }
    if (!('serviceWorker' in navigator)) {
        log('[SW] Service Worker nicht unterstützt');
        return;
    }
    if (protocol !== 'http:' && protocol !== 'https:') {
        log('[SW] Unbekanntes Protokoll:', protocol);
        return;
    }
    fetch('./sw.js', { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                navigator.serviceWorker
                    .register('./sw.js')
                    .then(reg => log('[SW] Registriert:', reg.scope))
                    .catch(err => log('[SW] Registrierung fehlgeschlagen:', err.message));
            }
        })
        .catch(() => { log('[SW] Offline-Modus via localStorage aktiv'); });
}
```
Phase 2 replaces the `.then(reg => log(...))` callback with the full update-detection chain from RESEARCH.md Code Example (lines 552–577). The HEAD-fetch outer wrapper stays.

**init() function — initPWA() and startAutoBackup() call sites** (lines 112–128):
```javascript
    // Auto-Backup starten
    startAutoBackup();

    // Service Worker für Offline-Sync registrieren
    registerServiceWorker();

    // Offline-Erkennung initialisieren
    initOfflineDetection();

    // PWA Installation
    initPWA();
```
New calls to add in the same block after `initPWA()`:
- `initFileBackup()` (from `systems/file-backup/file-backup-manager.js`)
- `initMigrationWizardIfNeeded()` (from `systems/migration/migration-wizard.js`)
- `initCommandPalette()` (from `features/command-palette/command-palette.js`)

**Pattern: defensive init call** (line 58, repeated throughout):
```javascript
if (typeof window.renderDashboard === 'function') window.renderDashboard();
```
Copy this defensive guard for every new init call:
```javascript
if (typeof window.initFileBackup === 'function') window.initFileBackup();
if (typeof window.initMigrationWizardIfNeeded === 'function') window.initMigrationWizardIfNeeded();
if (typeof window.initCommandPalette === 'function') window.initCommandPalette();
```

---

### `systems/spellslots/pwa-install.js` (modify) — utility, event-driven

**Analog:** `systems/spellslots/pwa-install.js` (lines 1–65) — full file

**Current pattern** (lines 9–32):
```javascript
function initPWA() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App läuft im Standalone-Modus');
        return;
    }
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        // Zeige Install-Banner nach 30 Sekunden
        setTimeout(() => {
            if (deferredPrompt && !StorageAPI.has('pwa-dismissed')) {
                showPWABanner();
            }
        }, 30000);
    });
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App wurde installiert');
        deferredPrompt = null;
        hidePWABanner();
    });
}
```
Phase 2 changes:
1. Replace `console.log` with `log(...)` (existing project convention)
2. Change `showPWABanner()` (passive banner) to show an explicit header install button (D-05): show `$('install-btn')` element instead of `$('pwa-install-banner')`
3. Add `StorageAPI.set('pwa-installed', 'true')` in `appinstalled` handler

**installPWA() pattern** (lines 45–57) — keep exactly, just update toast text:
```javascript
async function installPWA() {
    if (!deferredPrompt) {
        showToast('Installation nicht verfügbar');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        showToast('App wird installiert!');
    }
    deferredPrompt = null;
    hidePWABanner();
}
```

---

### `.github/workflows/ci.yml` (modify) — config, CI/CD

**Analog:** `.github/workflows/ci.yml` (lines 1–80) — full file

**Existing job chain** (lines 9–79):
```yaml
jobs:
  lint-and-typecheck:  # runs first
  test:               # runs first (parallel with lint)
  build:              # needs: [lint-and-typecheck, test]
  smoke-test:         # needs: [build]
```
Add new `deploy` job after `smoke-test`. Copy the `smoke-test` job header pattern:
```yaml
  smoke-test:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      ...
```
New `deploy` job:
```yaml
  deploy:
    runs-on: ubuntu-latest
    needs: [smoke-test]        # D-01: nur bei grüner CI
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.x'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: python build.py --production
      - name: Bereite Pages-Artefakt vor
        run: |
          cp sw.js dist/sw.js
          cp manifest.webmanifest dist/manifest.webmanifest
          cp -r icons/ dist/icons/
          cp -r assets/fonts/ dist/assets/fonts/
        shell: bash
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist/
      - uses: actions/deploy-pages@v4
        id: deployment
```
Note: the existing CI uploads only `dnd-tracker-optimized.html` as an artifact (line 50). The deploy job re-runs `build.py` instead of downloading that artifact, to get the full dist/ directory including fonts and icons.

---

### `systems/migration/full-export.js` — utility, CRUD

**Analog:** `systems/spellslots/import-export.js` — full file (565 lines, already read)

**IO_SCHEMA constant pattern** (lines 6–142):
```javascript
const IO_SCHEMA = {
    characters: {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        // ... all fields
    },
    // ... all entity types
};
```
New file defines a `FULL_EXPORT_SCHEMA` analogous to `IO_SCHEMA`, but scoped to user-owned data only (no SRD spells):
```javascript
const FULL_EXPORT_SCHEMA = {
    _exportType: 'full-v1',
    _appVersion: APP_CONFIG.VERSION,
    // ...
};
```

**exportData() download pattern** (lines 145–195):
```javascript
function exportData(dataType) {
    // ...
    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataType}-${campaignName}-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`📁 ${data.length} ${dataType} exportiert`);
}
```
`buildFullExport()` assembles the full-export object; a separate `downloadFullExport()` wraps it with the same blob/anchor download pattern above.

**getCampaignIndex() usage pattern** (lines 167–174):
```javascript
const getCampaignIndex = window.getCampaignIndex;
const index = getCampaignIndex();
let campaignName = 'Standard-Kampagne';
if (index.active !== APP_CONFIG.STORAGE_KEY) {
    const campaign = index.campaigns.find(c => c.key === index.active);
    campaignName = campaign?.name || 'Unbenannte Kampagne';
}
```
Copy this pattern to iterate all campaigns in `buildFullExport()`.

**importDataGlobal() / executeImport() pattern** (lines 463–583, 339–376):
```javascript
function importDataGlobal() {
    const fileInput = $('import-file');
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const imp = JSON.parse(e.target?.result);
            // validate + migrate + confirm + apply
            Object.assign(D, sanitized);
            renderAll();
            save();
            showToast('Import OK!');
        } catch (e) {
            alert('Fehler: ' + e.message);
        }
    };
    reader.readAsText(file);
}
```
`importFullExport(data)` follows the same try/catch + Object.assign(D, sanitized) + `renderAll()` + `save()` + `showToast()` structure, but iterates all campaigns via `StorageAPI.setJSON(key, campaignData)` + `saveCampaignIndex(index)` + `location.reload()`.

**Error handling pattern** (lines 320–330):
```javascript
try {
    // ... parse and validate
    showToast(`✅ Datei validiert: ${validatedItems.length} Einträge bereit`);
} catch (err) {
    showToast('❌ Import-Fehler: ' + err.message, 'error');
    console.error('[Import] Parse error:', err);
}
```

---

### `systems/migration/migration-wizard.js` — utility, request-response

**Primary analog:** `features/loot-distribution.js` (dynamic modal creation pattern, lines 11–66)

**Dynamic modal creation pattern** (lines 51–65):
```javascript
let modal = $('loot-dist-modal');
if (!modal) {
    modal = document.createElement('div');
    modal.id = 'loot-dist-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal" style="max-width: 600px;">${content}</div>`;
    modal.onclick = e => {
        if (e.target === modal) hideModal('loot-dist-modal');
    };
    document.body.appendChild(modal);
} else {
    const modalContent = modal.querySelector('.modal');
    if (modalContent) modalContent.innerHTML = content;
}
showModal('loot-dist-modal');
```
Migration wizard uses the same create-or-update pattern with `modal.id = 'migration-wizard-modal'`.

**Secondary analog:** `systems/backups.js` showBackupsModal() (lines 250–301) for the dynamically built modal with innerHTML content.

**Drag-and-drop import from `systems/spellslots/import-export.js`** (lines 257–336):
```javascript
const reader = new FileReader();
reader.onload = evt => {
    try {
        const result = evt.target?.result;
        const importData = JSON.parse(result);
        // validate ...
    } catch (err) {
        showToast('❌ Import-Fehler: ' + err.message, 'error');
    }
};
reader.readAsText(file);
```
Drag&drop zone in wizard adds `dragover` + `drop` event listeners; `drop` handler calls `reader.readAsText(file)` with the same FileReader pattern.

**Step-switching pattern** (no exact analog — nearest: tab-switching in `systems/spellslots/navigation.js`):
Use a local variable `let wizardStep = 1;` and a `showWizardStep(n)` function that shows/hides `.wizard-step[data-step="N"]` elements via classList:
```javascript
let wizardStep = 1;
function showWizardStep(n) {
    document.querySelectorAll('.migration-step').forEach(el => {
        el.style.display = el.dataset.step === String(n) ? '' : 'none';
    });
    wizardStep = n;
}
```

**localStorage empty-check for first-start detection** (copy from `systems/spellslots/persistence.js` pattern — load returns null or empty):
```javascript
function isFreshInstall() {
    const data = StorageAPI.getJSON(APP_CONFIG.STORAGE_KEY, null);
    if (!data) return true;
    const hasContent = (data.characters?.length || 0) + (data.npcs?.length || 0) + (data.quests?.length || 0);
    return hasContent === 0;
}
```

**initMigrationWizardIfNeeded() — called from init.js:**
```javascript
function initMigrationWizardIfNeeded() {
    if (window.location.protocol === 'file:') return; // file://-Modus: kein Wizard
    if (StorageAPI.has('migration-wizard-shown')) return; // bereits gesehen
    if (!isFreshInstall()) return; // Daten vorhanden: kein Wizard nötig
    // Kleiner Delay: App muss erst fertig laden
    setTimeout(showMigrationWizard, 500);
}
```

---

### `systems/file-backup/file-backup-manager.js` — service, event-driven

**Primary analog:** `systems/backups.js` (full file, already read)

**Module-level constants pattern** (lines 6–9):
```javascript
const BACKUP_INTERVAL = window.APP_CONFIG?.BACKUP_INTERVAL || 300000;
const MAX_BACKUPS = window.APP_CONFIG?.MAX_BACKUPS || 5;
const MAX_BACKUP_SIZE_MB = window.APP_CONFIG?.MAX_BACKUP_SIZE_MB || 2;
const BACKUP_KEY = window.APP_CONFIG?.BACKUP_KEY || 'dnd-tracker-backups';
```
Copy this constant-with-fallback pattern:
```javascript
const FILE_BACKUP_MAX_SNAPSHOTS = 10;   // D-12
const FILE_BACKUP_IDB_KEY = 'fileBackupDirHandle';
let _fileBackupPausedNotified = false;  // D-16: einmalige Warnung pro Sitzung
```

**Single-failure-log guard pattern** (lines 76–83):
```javascript
let _backupFailureLogged = false;
// ...
if (APP_CONFIG?.DEBUG_MODE && !_backupFailureLogged) {
    ErrorHandler?.log('createAutoBackup', e, 'Auto-backup failed (weitere Fehler werden unterdrückt)');
    _backupFailureLogged = true;
}
```
Copy as `_fileBackupPausedNotified` for D-16 (einmalig „Backup-Ordner wieder verbinden?").

**IDB storage pattern** (lines 88–113):
```javascript
async function saveBackupToIndexedDB(backup) {
    const initIndexedDB = window.initIndexedDB;
    await initIndexedDB();
    const idb = window.idb;
    return new Promise((resolve, reject) => {
        const transaction = idb.transaction(['backups'], 'readwrite');
        const store = transaction.objectStore('backups');
        // ... store.put(backup);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}
```
`saveHandleToIDB(key, handle)` follows the same `initIndexedDB()` + `idb.transaction` + `store.put()` + Promise pattern. Use a dedicated IDB store `'fileHandles'`.

**startAutoBackup() timer pattern** (lines 303–308):
```javascript
let backupInterval = null;
function startAutoBackup() {
    if (backupInterval) clearInterval(backupInterval);
    backupInterval = window.setInterval(createAutoBackup, BACKUP_INTERVAL);
    setTimeout(createAutoBackup, 60000);
}
```
`initFileBackup()` follows this pattern: checks if a stored handle exists in IDB, calls `restoreBackupFolder()`, stores result; hooks into `save()` via the Live-Sync override pattern (see CLAUDE.md):
```javascript
function initFileBackup() {
    // Hook into existing save() (Live-Sync pattern from CLAUDE.md)
    if (typeof window._originalSave === 'undefined') {
        window._originalSave = window.save;
        window.save = function() {
            window._originalSave.apply(this, arguments);
            onAfterSave();
        };
    }
    // Restore previously chosen folder handle from IDB
    restoreBackupFolder().then(handle => {
        if (handle) window._fileBackupDirHandle = handle;
    });
}
```

**createAutoBackup error handling** (lines 74–85):
```javascript
} catch (e) {
    if (APP_CONFIG?.DEBUG_MODE && !_backupFailureLogged) {
        ErrorHandler?.log('createAutoBackup', e, 'Auto-backup failed ...');
        _backupFailureLogged = true;
    }
}
```
`writeBackupForCampaign()` wraps File System API calls in the same try/catch; on error sets status to `'paused'` and triggers the once-per-session reconnect toast (D-16).

---

### `systems/file-backup/file-backup-permissions.js` — utility, event-driven

**Analog:** `systems/backups.js` saveBackupToIndexedDB() / the IDB pattern (lines 88–113)

**IDB handle persistence** — no direct codebase analog for FileSystemHandle in IDB. Pattern from RESEARCH.md Pattern 3, using the same `initIndexedDB()` + Promise wrapper:
```javascript
async function saveHandleToIDB(handle) {
    await window.initIndexedDB();
    const idb = window.idb;
    return new Promise((resolve, reject) => {
        const tx = idb.transaction(['fileHandles'], 'readwrite');
        tx.objectStore('fileHandles').put({ id: FILE_BACKUP_IDB_KEY, handle });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
async function loadHandleFromIDB() {
    await window.initIndexedDB();
    const idb = window.idb;
    return new Promise((resolve) => {
        const tx = idb.transaction(['fileHandles'], 'readonly');
        const req = tx.objectStore('fileHandles').get(FILE_BACKUP_IDB_KEY);
        req.onsuccess = () => resolve(req.result?.handle || null);
        req.onerror = () => resolve(null);
    });
}
```

**queryPermission / requestPermission** (no codebase analog — use RESEARCH.md Pattern 3 verbatim):
```javascript
async function restoreBackupFolder() {
    const dirHandle = await loadHandleFromIDB();
    if (!dirHandle) return null;
    const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') return dirHandle;
    // Only request in user-gesture context (D-16)
    return null; // caller must request on user action
}
async function requestBackupFolderPermission(dirHandle) {
    const newPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
    return newPermission === 'granted' ? dirHandle : null;
}
```

---

### `systems/file-backup/file-backup-ui.js` — utility, request-response

**Primary analog:** `systems/backups.js` showBackupsModal() (lines 250–301)

**Dynamic modal with list pattern** (lines 250–301):
```javascript
async function showBackupsModal() {
    const backups = await getBackups();
    let content = '';
    if (backups.length === 0) {
        content = renderEmptyState({ icon: '💾', titleEmpty: 'Keine Backups', ... });
    } else {
        content = backups.map((b, i) => `
            <div class="backup-item" style="...">
                <div>
                    <div style="font-weight: 500;">${timeStr}</div>
                    <div style="font-size: 0.85em; color: var(--text-dim);">Backup #${i + 1} (${sizeMB} MB)</div>
                </div>
                <button class="btn btn-sm" data-action="restore-backup" data-id="${i}">Wiederherstellen</button>
            </div>
        `).join('');
    }
    let modal = $('backups-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'backups-modal';
        modal.innerHTML = `...`;
        document.body.appendChild(modal);
    }
    const list = $('backups-list');
    if (list) list.innerHTML = content;
    if (showModal) showModal('backups-modal');
}
```
`showFileBackupBrowser()` copies this pattern exactly with `modal.id = 'file-backup-modal'`, listing snapshot filenames from the IDB-persisted directory handle.

**restoreBackup() safety pattern** (lines 189–248):
```javascript
async function restoreBackup(index) {
    // ...
    if (!confirm('Aktuellen Stand mit Backup überschreiben?')) return;
    try {
        saveUndoState('Backup wiederhergestellt');   // ← CRITICAL
        const parsed = JSON.parse(backups[index].data);
        // validate structure...
        const sanitized = sanitizeBackupData(parsed, defaultD);
        Object.assign(D, sanitized);
        renderAll();
        saveImmediate();
        showToast('✅ Backup wiederhergestellt');
    } catch (e) {
        ErrorHandler.log('restoreBackup', e, '...');
        showToast('❌ Backup fehlerhaft: ' + e.message, 'error');
    }
}
```
`restoreFromFileBackup(filename)` copies this pattern: `confirm()` + `saveUndoState()` + parse + sanitize + `Object.assign(D, ...)` + `renderAll()` + `saveImmediate()`.

---

### `features/command-palette/command-palette.js` — utility, request-response

**Primary analog:** `systems/search/global-search.js` (lines 1–267, full file)

**Debounced input pattern** (line 56):
```javascript
const debouncedGlobalSearch = debounce(performGlobalSearch, 150);
```
Command palette uses the same `debounce()` wrapper:
```javascript
const debouncedCommandSearch = debounce(performCommandSearch, 80);
```

**Result rendering with data-action pattern** (lines 171–188):
```javascript
results.innerHTML = matches
    .slice(0, 12)
    .map(m => {
        const safeType = allowedTypes.includes(m.type) ? m.type : 'unknown';
        const safeId = typeof m.id === 'number' ? m.id : parseInt(String(m.id)) || 0;
        return `
            <div class="search-result-item" data-action="navigate-result"
                 data-type="${safeType}" data-id="${safeId}">
                <span class="search-result-type ${safeType}">${getTypeIcon(safeType)}</span>
                <span class="search-result-name">${highlightMatch(m.name, query)}</span>
                ${m.detail ? `<div class="search-result-detail">${esc(m.detail)}</div>` : ''}
            </div>
        `;
    })
    .join('');
results.classList.add('visible');
```
Command palette renders action results with `data-action="execute-command"` and `data-command-id` instead of navigate-result.

**Click-outside close pattern** (lines 247–254):
```javascript
document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target.closest('.global-search-container')) {
        const results = $('global-search-results');
        if (results) results.classList.remove('visible');
    }
});
```
Copy for command palette with `.command-palette-overlay` and keyboard Escape handling.

**Keyboard shortcut registration** (from `systems/spellslots/keyboard-shortcuts.js` lines 7–64):
```javascript
function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        const activeEl = document.activeElement;
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName)
            || activeEl?.isContentEditable;
        // Strg+K oder Strg+F: Globale Suche
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'k')) {
            e.preventDefault();
            $('global-search')?.focus();
            return;
        }
    });
}
```
Command palette adds `Strg+Shift+K` in the same `keydown` handler block — after the existing Strg+K block:
```javascript
// Strg+Shift+K: Command Palette (TECH-04)
if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
    e.preventDefault();
    if (typeof window.toggleCommandPalette === 'function') window.toggleCommandPalette();
    return;
}
```
This goes inside `initKeyboardShortcuts()` in `systems/spellslots/keyboard-shortcuts.js`. `initCommandPalette()` in the new module registers the overlay; the shortcut binding stays in the central keyboard-shortcuts file.

**initGlobalSearchListener() pattern** (lines 255–260):
```javascript
function initGlobalSearchListener() {
    const input = $('global-search');
    if (input) {
        input.addEventListener('focus', performGlobalSearch);
    }
}
window.initGlobalSearchListener = initGlobalSearchListener;
```
`initCommandPalette()` follows the same pattern: sets up the input listener and exports itself.

---

### `features/command-palette/action-registry.js` — config, event-driven

**Primary analog:** `systems/spellslots/keyboard-shortcuts.js` (action dispatch structure, lines 64–186)

The keyboard shortcuts file shows the canonical list of context-sensitive actions. The action registry is the data-driven equivalent.

**Action dispatch pattern** (lines 170–179):
```javascript
if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const activeView = document.querySelector('.view.active')?.id;
    if (activeView === 'view-party') toggleCollapse('char-form');
    else if (activeView === 'view-npcs') showModal('npc-modal');
    else if (activeView === 'view-quests') showModal('quest-modal');
    else if (activeView === 'view-encounter') toggleCollapse('enc-form');
    return;
}
```
Each action in the registry captures one of these dispatch cases as a `() => { ... }` function. Do NOT re-declare `const showModal = window.showModal` inside action functions — call `window.showModal()` directly (CLAUDE.md non-ESM rule).

**Export pattern** (from `systems/search/global-search.js` lines 263–266):
```javascript
window.debouncedGlobalSearch = debouncedGlobalSearch;
window.performGlobalSearch = performGlobalSearch;
window.initGlobalSearchListener = initGlobalSearchListener;
```
Action registry exports:
```javascript
window.ACTION_REGISTRY = ACTION_REGISTRY;
window.searchActions = searchActions;
```

---

## Shared Patterns

### StorageAPI error handling
**Source:** `systems/spellslots/import-export.js` lines 558–568
**Apply to:** `systems/migration/full-export.js`, `systems/file-backup/file-backup-manager.js`
```javascript
const saveResult = StorageAPI.setJSON(key, newData);
if (saveResult.success) {
    showToast(`✅ Kampagne "${campaignName}" importiert`);
    location.reload();
} else {
    throw new Error(`Speichern fehlgeschlagen: ${saveResult.error}`);
}
```

### saveUndoState() before restore
**Source:** `systems/backups.js` restoreBackup() line 198 (implicit via saveImmediate pattern)
**Apply to:** `systems/file-backup/file-backup-ui.js`, `systems/migration/migration-wizard.js`
```javascript
// ALWAYS first before any destructive data operation:
saveUndoState('Backup wiederhergestellt');
// ...then modify D, then save
```

### Single-session notification guard
**Source:** `systems/backups.js` lines 11–12, 76–83
**Apply to:** `systems/file-backup/file-backup-manager.js` (D-16), `systems/spellslots/pwa-install.js` (D-03 update hint)
```javascript
let _warningShown = false;  // or use sessionStorage.getItem('key')
// In error handler:
if (!_warningShown) {
    showToast('...', 'warning');
    _warningShown = true;
}
// Further errors: only to event log, no toast
```

### Module-level APP_CONFIG constants
**Source:** `systems/backups.js` lines 6–9
**Apply to:** All new systems/ modules
```javascript
const SOME_SETTING = window.APP_CONFIG?.SOME_SETTING || defaultValue;
```

### XSS prevention in dynamic HTML
**Source:** `systems/search/global-search.js` lines 166–188, `systems/backups.js` lines 268–276
**Apply to:** All new modules that render user data to innerHTML
```javascript
// Use esc() for all user-originated strings:
`<div>${esc(campaignName)}</div>`
`<div style="font-size: 0.85em; color: var(--text-dim);">${esc(filename)}</div>`
```

### data-action delegation (no inline handlers)
**Source:** `systems/backups.js` line 273, `features/loot-distribution.js` line 43
**Apply to:** All new modal HTML
```javascript
// GOOD: data-action attribute
`<button class="btn btn-sm" data-action="restore-file-backup" data-filename="${esc(filename)}">Wiederherstellen</button>`
// BAD: onclick=""
```

### window.export for cross-module access
**Source:** `systems/search/global-search.js` lines 263–266, `systems/backups.js` line 418
**Apply to:** All new module functions called from other modules or init.js
```javascript
window.initFileBackup = initFileBackup;
window.showFileBackupBrowser = showFileBackupBrowser;
window.initMigrationWizard = initMigrationWizard;
window.toggleCommandPalette = toggleCommandPalette;
window.ACTION_REGISTRY = ACTION_REGISTRY;
```

---

## loader.js and build.py Registration

**Apply to:** All new JS files

New modules must appear in BOTH `loader.js` AND `build.py` in the correct dependency order:

```javascript
// In loader.js MODULES array — after 'systems/campaign-manager/campaign-manager.js':
'systems/migration/full-export.js',
'systems/migration/migration-wizard.js',
'systems/file-backup/file-backup-permissions.js',
'systems/file-backup/file-backup-manager.js',
'systems/file-backup/file-backup-ui.js',

// After 'features/dmscreen/dmscreen-render.js':
'features/command-palette/action-registry.js',
'features/command-palette/command-palette.js',
```
The same list must be added to `build.py` modules array in the same order.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `manifest.webmanifest` | config | static | No webmanifest exists in codebase (only inline data: URI); no analog — use RESEARCH.md Pattern 2 verbatim |

---

## Metadata

**Analog search scope:** `sw.js`, `core/init.js`, `systems/backups.js`, `systems/spellslots/import-export.js`, `systems/spellslots/pwa-install.js`, `systems/spellslots/keyboard-shortcuts.js`, `systems/search/global-search.js`, `systems/campaign-manager/campaign-manager.js`, `systems/hp-calculator.js`, `features/loot-distribution.js`, `.github/workflows/ci.yml`, `loader.js`
**Files scanned:** 12 source files + loader.js
**Pattern extraction date:** 2026-06-12
