# Phase 2: Technik-Fundament — Research

**Researched:** 2026-06-12
**Domain:** PWA (Service Worker / Manifest / GitHub Pages), File System Access API, Google Fonts bundling, Command Palette
**Confidence:** HIGH (TECH-01, TECH-03, TECH-04 durch offizielle Docs verifiziert) / MEDIUM (TECH-02 Migrationswizard-UX, Font-Bundle-Mechanik)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**PWA-Hosting & Installation (TECH-01)**
- D-01: GitHub Pages, Deploy nur bei grüner CI (Lint/Tests/Smoke als Quality-Gate)
- D-02: Production-Build auf Pages (minifiziert, DEBUG_MODE aus)
- D-03: Update per Hinweis + Klick — kein automatischer Versionswechsel mitten in der Session
- D-04: d20-Icon (SVG, Gold #d4af37 auf Dunkel #0d0d0d), PNG 192/512 maskable, echtes `manifest.webmanifest` ersetzt inline `data:`-Manifest
- D-05: Eigener „App installieren"-Button via `beforeinstallprompt` im Header/Menü, verschwindet nach Installation
- D-06: PWA ist empfohlener Hauptmodus; `file://` bleibt funktionsfähiger Notfall-/Zweitmodus
- D-07: Google Fonts gebündelt (Roboto + Editor-Fonts) — offline identisches Schriftbild

**Datenmigration file:// → PWA (TECH-02)**
- D-08: Voll-Migration aller Kampagnen, Einstellungen, Würfel-Favoriten, DM-Screen-Profile; neues Voll-Export-Format
- D-09: Geführter Wizard beim PWA-Erststart (leerer Speicher) mit Drag&Drop-Zone; überspringbar; über Einstellungen erneut aufrufbar
- D-10: file://-App erhält „Zur installierbaren App umziehen"-Flow + einmaliger dezenter Hinweis
- D-11: Divergenz-Schutz: file://-App zeigt nach Umzugs-Export Banner; abschaltbar

**Datei-Backup (TECH-03)**
- D-12: Je Kampagne: laufende Datei + datierter Snapshot pro Spieltag; max. 10 Snapshots pro Kampagne
- D-13: Scope je Kampagne (eine Datei), kein Gesamt-Voll-Export bei jedem Save
- D-14: Restore über Backup-Browser (Snapshots aus verbundenem Ordner), Klick + Bestätigung + Undo-Snapshot
- D-15: Einrichtung im Migrations-Wizard (letzter Schritt) + jederzeit über Einstellungen
- D-16: Störungsfall: einmalig „Backup-Ordner wieder verbinden?" + dauerhafter Status; kein Toast-Gewitter
- D-17: Voller Status in Einstellungen; im Header nur Warnindikator bei Problemen
- D-18: file://-Fallback: Download-Knopf + höchstens eine Erinnerung pro Sitzung

### Claude's Discretion

- Command Palette (TECH-04) vollständig: kollisionsfreier Shortcut nach Audit (Kandidaten Strg+Shift+K oder Strg+P), Fuzzy-Suche über Aktions-Registry, v1 Aktionsumfang, parametrisierte Aktionen, UI-Design, Verhältnis zu Global Search
- Technische PWA-Details: SW-Cache-Strategie, `manifest.webmanifest`-Struktur, Update-Mechanik, Pages-Layout
- Backup-Mechanik: Debounce/Timing, atomare Schreibstrategie, Dateinamens-Konvention, Spieltag-Trigger
- Format-Kompatibilität: Ob Backup-Dateien über normalen Import-Dialog einspielbar sind
- Alle exakten deutschen UI-Texte

### Deferred Ideas (OUT OF SCOPE)

Keine — die Diskussion blieb im Phasen-Scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Beschreibung | Research-Unterstützung |
|----|-------------|------------------------|
| TECH-01 | Nutzer kann App als PWA installieren (Manifest, Icons, SW) und über Desktop-Icon starten | manifest.webmanifest-Struktur, maskable Icons, beforeinstallprompt, SW-Cache-First, GitHub Pages Deploy |
| TECH-02 | Beim ersten PWA-Start werden file://-Kampagnendaten per Wizard übernommen (kein Datenverlust) | Voll-Export-Format, localStorage + IDB Lese-Logik, Drag&Drop Import, leerer-Speicher-Erkennung |
| TECH-03 | Nutzer kann automatische Datei-Backups aktivieren (File System Access API; Fallback: Download) | showDirectoryPicker, FileSystemDirectoryHandle, createWritable (atomar), IDB Handle-Persistenz, permission re-prompt |
| TECH-04 | Command Palette: kollisionsfreier Shortcut, Fuzzy-Suche über Aktions-Registry (z.B. „Neuer NPC") | data-action Registry, fuzzyMatch() Wiederverwendung, Shortcut-Audit |

</phase_requirements>

---

## Zusammenfassung

Phase 2 ist eine reine Infrastrukturphase ohne neue Spielleiter-Features. Sie besteht aus vier technisch voneinander abhängigen Lieferobjekten: (1) GitHub-Pages-Deploy mit echtem PWA-Manifest und Service-Worker-Cache-Strategie, (2) Migrations-Wizard für den einmaligen Wechsel von `file://` zur installierten PWA, (3) Datei-Backup-System auf Basis der File System Access API und (4) Command Palette als Fuzzy-Aktionsstarter.

Die kritische Reihenfolge-Abhängigkeit ist: Deploy vor allen anderen — File System Access API erfordert HTTPS-Origin, und die PWA-Tests erfordern eine laufende gehostete App. Die drei anderen Lieferobjekte können nach dem Deploy parallel entwickelt werden.

Die wichtigste technische Weichenstellung betrifft den Service Worker: Der bestehende `sw.js` cached Dev-Struktur-Dateien (`index.html`, `loader.js`). Für GitHub Pages mit Single-File-Build muss er vollständig neu konzipiert werden — die gesamte App ist eine einzige ~1,3 MB-HTML-Datei plus Manifest, Icons und Font-Dateien.

**Primäre Empfehlung:** SW komplett neu schreiben (Cache-First für alle statischen Assets, Netzwerk-Only für externe Anfragen); Version-Hash-Update-Erkennung; `beforeinstallprompt`-Logik vom bestehenden `pwa-install.js` wiederverwenden und auf Header-Button umstellen.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| GitHub Pages Deploy | CI/CD (GitHub Actions) | Build (build.py) | Deploy ist ein reiner CI-Job; build.py liefert das Artefakt |
| Service Worker Cache | Browser (SW-Scope) | — | SW läuft in eigenem Scope, kein Zugriff auf App-State |
| PWA-Manifest + Icons | Build (build.py) | Static Assets | Icons und Manifest sind Build-Outputs, die ins dist-Verzeichnis kopiert werden |
| beforeinstallprompt-Button | Frontend (core/init.js + systems) | Header-HTML | Event-Handler im Client, UI-Element im Header-Template |
| SW-Update-Erkennung | Frontend (core/init.js) | — | Listener auf `navigator.serviceWorker.register().then()` — Andockpunkt bereits vorhanden |
| Migrations-Wizard | Frontend (neues systems/migration/) | localStorage + IDB | Liest aus beiden Speichern; UI als Modal über Einstellungen |
| Voll-Export/Import | Frontend (systems/spellslots/import-export.js erweitern) | localStorage + IDB | Bestehende Export-Infrastruktur ausbauen |
| Datei-Backup (Schreiben) | Frontend (neues systems/file-backup/) | File System Access API | Browser-API, HTTPS-only, Chrome/Edge only |
| Datei-Backup (Fallback) | Frontend | — | `<a download>` Pattern für file:// und Firefox |
| Font-Bundle | Build (build.py) | WOFF2-Dateien in assets/ | Python-Script lädt WOFF2 herunter; build.py inlined @font-face-CSS |
| Command Palette | Frontend (neues features/command-palette/) | data-action Registry + fuzzyMatch | Eigenes Modul, kein Framework nötig |

---

## Standard Stack

### Core (alle Browser-nativ, keine Drittbibliotheken)

| API / Tool | Version | Zweck | Warum Standard |
|-----------|---------|-------|----------------|
| `showDirectoryPicker()` | File System Access API (Baseline 2023) | Ordner wählen für Datei-Backup | Einzige Browser-native API für Ordner-Schreiben; Chrome 86+/Edge 86+ |
| `FileSystemWritableFileStream.createWritable()` | Baseline 2025 | Atomares Schreiben von Backup-Dateien | Schreibt in Temp-Datei, committed bei `close()` — kein Datenverlust bei Absturz |
| `FileSystemHandle` (in IndexedDB serialisierbar) | Chrome 86+ | Ordner-Handle zwischen Sitzungen persistieren | Structured Clone Algorithm unterstützt FileSystemHandle |
| `navigator.serviceWorker.register()` | Alle modernen Browser | SW-Registrierung + Update-Erkennung | Bestehender Andockpunkt in `core/init.js:196-210` |
| `ServiceWorkerRegistration.updatefound` + `statechange` | Alle modernen Browser | Update-Erkennung für D-03 | Standard-Event-Pattern, keine Library nötig |
| `beforeinstallprompt` | Chrome/Edge | App-Install-Button (D-05) | Bereits in `pwa-install.js` implementiert, muss auf Header-Button umgestellt werden |
| `manifest.webmanifest` | W3C PWA Standard | PWA-Installierbarkeit | Ersetzt inline `data:`-Manifest in `index.html:12` |
| GitHub Actions `actions/upload-pages-artifact@v4` | aktuell | Pages-Artefakt hochladen | Offizieller GitHub-Action für Pages |
| GitHub Actions `actions/deploy-pages@v4` | aktuell | Pages deployen | Offizieller GitHub-Action für Pages |
| GitHub Actions `actions/configure-pages@v5` | aktuell | Pages konfigurieren | Offizieller GitHub-Action für Pages |

### Supporting

| Tool | Zweck | Wann nötig |
|------|-------|-----------|
| Python `requests` (Stdlib: `urllib.request`) | WOFF2-Dateien von Google Fonts CDN herunterladen | Font-Bundle-Build-Schritt (einmalig, danach gecacht) |
| `<a download>` Attribut | file://-Fallback für Backup-Download | Immer wenn File System Access API nicht verfügbar |
| `window.showSaveFilePicker()` | Alternative zu Ordner: einzelne Datei speichern | Nur falls Ordner-Picker zu komplex für Nutzer; D-13 setzt Ordner voraus |

### Alternatives Considered

| Statt | Könnte man nehmen | Tradeoff |
|-------|-----------------|----------|
| eigener SW | Workbox | Workbox ist npm-Dependency → widerspricht Zero-Runtime-Dependency-Architektur; eigener SW für Single-File trivial |
| WOFF2 inline als base64 | WOFF2 als separate Dateien im dist/ | base64 bläht ~1,3 MB HTML weiter auf; separate Dateien ermöglichen Browser-Caching |
| `FileSystemWritableFileStream` (createWritable) | Blob-Download bei jedem Save | createWritable ist das einzig mögliche Muster für automatisches Schreiben ohne User-Geste |

---

## Architecture Patterns

### System Architecture Diagram — TECH-01: PWA Deploy

```
Source (modular) ──[build.py --production]──> dist/
  92 JS-Module                                 ├── dnd-tracker-optimized.html (~1.3 MB)
  13 CSS-Dateien                               ├── manifest.webmanifest
  10 HTML-Templates                            ├── sw.js (neu: single-file-aware)
  assets/fonts/*.woff2 (neu)                   ├── icons/
                                               │    ├── icon-192.png
                                               │    └── icon-512.png
                                               └── assets/fonts/*.woff2

dist/ ──[CI: upload-pages-artifact]──> GitHub Pages
       (nur wenn lint+test+smoke grün)
       
Browser ──[HTTPS Request]──> GitHub Pages ──> dnd-tracker-optimized.html
         ──[SW installiert]──> Cache-First für alle dist-Assets
         ──[SW updatefound]──> Hinweis-Toast „Neue Version verfügbar"
```

### System Architecture Diagram — TECH-03: File Backup

```
App (save()) ──[nach save()]──> file-backup-manager.js
                                  ├── [IDB: Ordner-Handle vorhanden?] ──Nein──> skip / Fallback-Erinnerung
                                  └── Ja: requestPermission(readwrite)
                                         ├── granted: ──> writeCurrentFile()  [atomares createWritable]
                                         │               writeSnapshotIfNewDay() [datierter Snapshot]
                                         │               pruneOldSnapshots(max=10)
                                         └── denied:  ──> setBackupStatus('paused')
                                                          einmalig: showReconnectToast()
                                                          weitere: nur Event-Log

Firefox / file:// ──[Fallback]──> manuelle Download-Schaltfläche (D-18)
                                  einmalige Sitzungs-Erinnerung wenn Änderungen vorhanden
```

### Recommended Project Structure (neue Dateien)

```
systems/
├── migration/
│   ├── migration-wizard.js      # Wizard-UI, Drag&Drop, Schritte-Logik
│   └── full-export.js           # Voll-Export/Import aller Kampagnen + Settings
├── file-backup/
│   ├── file-backup-manager.js   # Hauptlogik: writeCurrentFile, writeSnapshot, prune
│   ├── file-backup-ui.js        # Status-Anzeige, Backup-Browser (Restore-Liste)
│   └── file-backup-permissions.js  # IDB Handle-Persistenz, queryPermission/requestPermission
features/
└── command-palette/
    ├── command-palette.js        # Overlay, Input, Ergebnis-Rendering
    └── action-registry.js        # Aktions-Definitionen (aus data-action ableiten)
assets/
└── fonts/
    ├── roboto-400.woff2
    ├── roboto-700.woff2
    ├── inter-400.woff2
    ├── poppins-400.woff2
    └── source-sans-pro-400.woff2
```

Neue Manifest- und Icon-Assets im `dist/`-Verzeichnis, generiert durch `build.py`:

```
dist/
├── manifest.webmanifest
├── sw.js
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── assets/fonts/*.woff2   (oder inline @font-face in der HTML-Datei)
```

### Pattern 1: Service Worker — Single-File Cache-First + Update-Erkennung

**Was:** Der SW cached alle dist-Assets beim Install-Event; erkennt Neuladen via Version-Konstante; zeigt bei neuer Version einen Hinweis-Toast.

**Wann:** Bei jedem Push auf GitHub Pages nach erfolgreicher CI.

**SW-Grundstruktur:**
```javascript
// Source: https://web.dev/learn/pwa/update/ [VERIFIED: web.dev]
const CACHE_VERSION = 'dnd-tracker-v3'; // wird bei jedem Build via build.py hochgezählt / ersetzt
const CACHED_ASSETS = [
    './',                              // index.html alias
    './dnd-tracker-optimized.html',
    './manifest.webmanifest',
    './sw.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './assets/fonts/roboto-400.woff2'  // + weitere Fonts
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(CACHED_ASSETS))
            // KEIN self.skipWaiting() hier — D-03: kein erzwungener Update
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
            ))
            .then(() => clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Cache-First für alle eigenen Assets
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request)
                .then(cached => cached || fetch(event.request))
        );
    }
    // Externe Requests (ehem. Google Fonts CDN): Network-Only
    // Nach D-07 keine mehr — alle Fonts sind lokal
});
```

**Update-Erkennung in `core/init.js` (Andockpunkt bei `registerServiceWorker()`):**
```javascript
// Source: https://web.dev/learn/pwa/update/ [VERIFIED: web.dev]
navigator.serviceWorker.register('./sw.js').then(reg => {
    // Prüfe sofort ob eine neue Version wartet
    if (reg.waiting) {
        showUpdateHint(reg.waiting);
    }
    // Höre auf zukünftige Updates
    reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateHint(newSW);
            }
        });
    });
});

function showUpdateHint(newSW) {
    // Dezenter Hinweis — KEIN automatischer Reload (D-03)
    showToast('Neue Version verfügbar — Neu laden?', 'info', {
        persistent: true,
        action: { label: 'Neu laden', callback: () => {
            newSW.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }}
    });
}
```

Hinweis: Der bestehende Toast `showToast()` muss für `persistent: true` und optionale Action-Buttons erweitert werden — oder eine einfache `confirm()`-Variante als erster Schritt.

### Pattern 2: manifest.webmanifest — Minimalkonfiguration für Installierbarkeit

**Was:** Externe JSON-Datei, die Chrome für den `beforeinstallprompt` benötigt.

**Pflichtfelder für Chrome-Install-Prompt:** `name`, `icons` (192x192 + 512x512 PNG), `start_url`, `display`.

```json
// Source: https://web.dev/articles/add-manifest [VERIFIED: web.dev]
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
    {
      "src": "./icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "./icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Wichtig für `start_url` auf GitHub Pages:** Da die App unter `https://user.github.io/repo/dnd-tracker-optimized.html` liegt, muss `start_url` relativ sein oder den vollständigen Pfad enthalten. Relative `./`-Pfade funktionieren wenn das Manifest selbst neben der HTML-Datei liegt. [CITED: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages]

**`index.html`-Link-Tag (ersetzt inline data: manifest):**
```html
<link rel="manifest" href="./manifest.webmanifest">
```

### Pattern 3: File System Access API — Ordner-Handle persistieren

**Was:** Nutzer wählt einmalig einen Ordner; Handle wird in IDB gespeichert; bei jedem späteren App-Start wird Permission erneut geprüft.

```javascript
// Source: https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api [VERIFIED: Chrome Docs]
// Source: https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable [VERIFIED: MDN]

// EINMALIG: Ordner wählen und Handle speichern
async function setupBackupFolder() {
    const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await saveHandleToIDB('backupDirHandle', dirHandle); // strukturierter Klon in IDB
    return dirHandle;
}

// BEI JEDEM APP-START: Handle laden und Permission prüfen
async function restoreBackupFolder() {
    const dirHandle = await loadHandleFromIDB('backupDirHandle');
    if (!dirHandle) return null;

    // Chrome 122+: 3-Wege-Dialog (einmalig / immer / ablehnen)
    const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') return dirHandle;

    // Permission abgelaufen → bei nächster User-Geste erneut fragen (D-16)
    const newPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
    return newPermission === 'granted' ? dirHandle : null;
}

// ATOMARES SCHREIBEN: createWritable schreibt in Temp-Datei, committed bei close()
async function writeBackupFile(dirHandle, filename, jsonData) {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(jsonData, null, 2));
    await writable.close(); // atomarer Commit — Original-Datei bleibt bei Fehler intakt
}
```

**requestPermission() muss in einem User-Gesture-Handler aufgerufen werden** (z.B. Button-Klick) — nicht automatisch beim App-Start. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API]

### Pattern 4: GitHub Pages Deploy Job (CI-Erweiterung)

**Was:** Neuer `deploy` Job in `.github/workflows/ci.yml` nach erfolgreichem `smoke-test`.

```yaml
# Source: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages [VERIFIED: GitHub Docs]
  deploy:
    runs-on: ubuntu-latest
    needs: [smoke-test]  # D-01: nur bei grüner CI
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
      # Kopiere SW, Manifest, Icons ins dist/
      - name: Bereite Pages-Artefakt vor
        run: |
          cp sw.js dist/sw.js
          cp manifest.webmanifest dist/manifest.webmanifest
          cp -r icons/ dist/icons/
          cp -r assets/fonts/ dist/assets/fonts/
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist/
      - uses: actions/deploy-pages@v4
        id: deployment
```

**Voraussetzung:** Im GitHub-Repo unter Settings → Pages → Source muss „GitHub Actions" ausgewählt sein, bevor der erste Workflow pusht.

### Pattern 5: Command Palette — Aktions-Registry aus data-action

**Was:** Alle Aktionen sind in einer zentralen `ACTION_REGISTRY`-Konstante als Array definiert; Fuzzy-Suche via bestehendem `fuzzyMatch()`.

```javascript
// Eigenes Modul: features/command-palette/action-registry.js
const ACTION_REGISTRY = [
    // Datei-Aktionen
    { id: 'new-npc', label: 'Neuer NPC', keywords: ['npc', 'gegenspieler', 'person'], action: () => { window.showModal('npc-modal'); } },
    { id: 'new-char', label: 'Neuer Charakter', keywords: ['char', 'spieler', 'party'], action: () => { window.toggleCollapse('char-form'); window.switchView('party'); } },
    { id: 'new-quest', label: 'Neue Quest', keywords: ['aufgabe', 'auftrag'], action: () => { window.showModal('quest-modal'); } },
    { id: 'roll-d20', label: 'Würfle d20', keywords: ['würfel', 'roll', 'w20'], action: () => { window.quickRoll(20); } },
    { id: 'roll-formula', label: 'Würfle 8d6', keywords: ['feuerball', 'schaden', 'formel'], action: () => { /* Formel-Eingabe */ } },
    { id: 'undo', label: 'Rückgängig', keywords: ['undo', 'zurück'], action: () => { window.undo(); } },
    { id: 'backup-setup', label: 'Datei-Backup einrichten', keywords: ['backup', 'sichern'], action: () => { /* Backup-Setup öffnen */ } },
    // Navigation
    { id: 'nav-initiative', label: 'Zur Initiative', keywords: ['kampf', 'runde'], action: () => { window.switchView('initiative'); } },
    // Einstellungen
    { id: 'open-settings', label: 'Einstellungen öffnen', keywords: ['optionen', 'config'], action: () => { window.showModal('settings-modal'); } },
];

// Suche via bestehendem fuzzyMatch() aus systems/search/global-search.js [VERIFIED: Codebase]
function searchActions(query) {
    if (!query || query.length < 1) return ACTION_REGISTRY.slice(0, 8); // Top 8 ohne Query
    return ACTION_REGISTRY
        .map(a => {
            const labelScore = fuzzyMatch(a.label, query).score;
            const keywordScore = Math.max(...(a.keywords || []).map(k => fuzzyMatch(k, query).score));
            return { ...a, score: Math.max(labelScore, keywordScore) };
        })
        .filter(a => a.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
}
```

**Shortcut-Empfehlung (Claude's Discretion):** `Strg+Shift+K` — Details im Pitfalls-Abschnitt.

### Anti-Patterns zu vermeiden

- **`self.skipWaiting()` im SW-Install-Handler:** Aktiviert sofort neue Version, auch während laufender Session — Datenverlust-Risiko wenn alter und neuer Code gleichzeitig laufen. Verboten durch D-03. [VERIFIED: web.dev]
- **SW-Version nie hochzählen:** Wenn `CACHE_VERSION` konstant bleibt, erkennt der Browser keine Änderungen — veraltete App trotz neuem Deploy.
- **`requestPermission()` ohne User-Gesture:** Wird von Chrome blockiert (SecurityError) — immer in Button-Click-Handler aufrufen.
- **Inline `data:` Manifest behalten:** Chrome's `beforeinstallprompt` feuert nicht zuverlässig mit data-URI-Manifests. [VERIFIED: web.dev]
- **`const X = window.X` in Funktionen für neue Module:** Build-Dedup-Fehler (bekannte CLAUDE.md-Regel). Neue Funktionen wie `setupBackupFolder` stattdessen direkt mit `window.showDirectoryPicker()` aufrufen.
- **IDB-Handle ohne `queryPermission()` laden:** Handle aus IDB hat initial `'prompt'`-Status, nicht `'granted'`. Immer prüfen vor Nutzung. [VERIFIED: Chrome Docs]

---

## Don't Hand-Roll

| Problem | Nicht selbst bauen | Stattdessen nutzen | Warum |
|---------|-------------------|-------------------|-------|
| Atomares Schreiben in Dateien | Custom Write-Retry-Logik | `createWritable().close()` | API schreibt in Temp-Datei, committed bei close() — edge-case-sicher [VERIFIED: MDN] |
| Font-WOFF2 laden | Font in base64 inline | Separate WOFF2-Dateien mit @font-face | Browser-Caching; base64 bläht Single-File auf |
| SW-Update-Mechanismus | Polling/setTimeout | `updatefound`/`statechange` Events | Browser-native Events, zuverlässig [VERIFIED: web.dev] |
| Permission-State prüfen | Eigenes Permission-Tracking | `handle.queryPermission()` | Browser pflegt Permission-State verlässlich |
| Fuzzy-Suche für Command Palette | Neue Fuzzy-Algo-Implementierung | `fuzzyMatch()` aus `global-search.js` | Bereits im Build, gleiche Qualität, kein Duplikat |
| Drag&Drop Import für Wizard | Eigene Drag&Drop-Logik | `dragover`/`drop` Events + `FileReader` | Standard-Web-APIs, 10 Zeilen ausreichend |

**Key Insight:** Die File System Access API erledigt alle Atomizitäts- und Permission-Bedenken intern. Der eigene Code ist nur Koordination, nicht Low-Level-IO.

---

## Common Pitfalls

### Pitfall 1: SW cached Single-File-Build nicht korrekt

**Was schiefgeht:** SW versucht `./index.html` und `./loader.js` zu cachen — diese Dateien existieren auf GitHub Pages nicht.
**Warum:** Bestehender `sw.js` ist auf Dev-Modus ausgerichtet (Multi-File-Struktur).
**Vorbeugung:** SW komplett neu schreiben; `CACHED_ASSETS` auf `./dnd-tracker-optimized.html`, `./manifest.webmanifest`, Icons und Fonts beschränken.
**Frühwarnung:** CI-Smoke-Test schlägt fehl wenn SW-Install fehlschlägt; DevTools → Application → Service Workers zeigt Install-Fehler.

### Pitfall 2: beforeinstallprompt feuert nicht auf GitHub Pages

**Was schiefgeht:** Chrome zeigt kein Install-Angebot trotz manifest.webmanifest.
**Warum passiert es:** Fehlende oder falsch formatierte Icons (192+512 PNG beide pflicht), fehlende `start_url`, oder manifest nicht via `<link rel="manifest">` geladen.
**Vorbeugung:** Chrome DevTools → Lighthouse → PWA Audit nach Deploy laufen lassen. Beide Icons als echte PNG (nicht SVG), beide mit `"purpose": "any maskable"`.
**Frühwarnung:** Chrome DevTools → Application → Manifest zeigt Validation-Fehler.

### Pitfall 3: File System Access API — Permission-Re-Prompt-Schleife

**Was schiefgeht:** App fragt bei jedem Start nach Permission, Nutzer wird genervt.
**Warum:** Chrome 122+ mit „Allow this time" speichert Permission nur für diese Session; bei „Allow on every visit" bleibt sie dauerhaft.
**Vorbeugung:** `queryPermission()` vor `requestPermission()` aufrufen; nur dann promoten wenn `'prompt'` zurückkommt; D-16 beachten (einmalig „Wieder verbinden?" pro Störfall, nicht bei jedem Start).
**Frühwarnung:** Konsolenwarnung wenn `requestPermission()` ohne User-Gesture aufgerufen wird.

### Pitfall 4: GitHub Pages deploy-pages benötigt vorher aktivierte Pages-Source

**Was schiefgeht:** Workflow baut und deployt, aber die Seite erscheint nie, da GitHub Pages noch nicht aktiviert ist.
**Warum:** Der `github-pages`-Environment existiert erst nach manuellem Aktivieren unter Settings → Pages → Source: GitHub Actions.
**Vorbeugung:** Dokumentieren dass ein One-Time-Setup im Repo erforderlich ist, bevor der erste Deploy-Workflow läuft.

### Pitfall 5: SW-Cache-Version nie bumpen = Nutzer sehen veraltete App

**Was schiefgeht:** Nach einem Deploy laden bestehende PWA-Nutzer monatelang die alte Version.
**Warum:** SW-Cache-Name ist konstant; Browser sieht keinen Unterschied.
**Vorbeugung:** `build.py` schreibt den CACHE_VERSION-Wert bei jedem Production-Build mit der aktuellen App-Version (z.B. `dnd-tracker-v3-2.7.0`) in `sw.js`. Alternativ: Timestamp beim Build einbetten.

### Pitfall 6: Voll-Export-Format enthält SRD-Spells

**Was schiefgeht:** Backup-Dateien und Migrations-Exports enthalten die vollständige Spell-Datenbank (SRD) — große Dateien, Lizenz-Risiko.
**Warum:** `D.spells` ist Teil des globalen State und würde bei naivem `JSON.stringify(D)` mitgenommen.
**Vorbeugung:** Export-Format explizit auf nutzer-eigene Daten beschränken; SRD-Spells aus `D` niemals exportieren (Muster aus STATE.md übernehmen).

### Pitfall 7: Command Palette — Strg+P blockiert Browser-Print

**Was schiefgeht:** `Strg+P` öffnet Browser-Drucken statt Command Palette.
**Warum passiert es:** Browser-Shortcuts haben Vorrang; `e.preventDefault()` bei `Strg+P` unterdrückt zwar den Druck-Dialog, aber das ist für Nutzer unerwartet.
**Vorbeugung:** `Strg+Shift+K` verwenden — nicht durch Browser-Default belegt (Edge belegt es für DevTools in der Standalone-PWA, aber nicht im normalen Tab). Im Standalone-PWA-Modus entfallen Browser-Shortcuts wie Adressleiste (Strg+K ist damit freier). Trotzdem: Audit prüfen.
**Frühwarnung:** Nutzer-Test im normalen Browser-Tab UND im installierten PWA-Modus.

### Pitfall 8: font-face @import in Single-File-Build — doppelte Deduplication

**Was schiefgeht:** `@font-face`-Regeln aus mehreren CSS-Dateien werden mehrfach in den Build-Output geschrieben.
**Warum:** `build.py` concateniert alle CSS-Dateien ohne Deduplizierung von `@font-face`.
**Vorbeugung:** Alle `@font-face`-Regeln in eine einzige Datei `assets/styles/variables.css` oder eine neue `assets/styles/fonts.css` packen — nicht in mehrere CSS-Dateien.

---

## Code Examples

### Vollständiger SW-Update-Flow (init.js Andockpunkt)

```javascript
// Zu ergänzen in registerServiceWorker() ab Zeile 196, core/init.js
// Source: https://web.dev/learn/pwa/update/ [VERIFIED]
function registerServiceWorker() {
    const protocol = window.location.protocol;
    if (protocol === 'file:') {
        log('[SW] file://-Modus — SW nicht verfügbar');
        return;
    }
    if (!('serviceWorker' in navigator)) return;
    if (protocol !== 'http:' && protocol !== 'https:') return;

    navigator.serviceWorker.register('./sw.js').then(reg => {
        log('[SW] Registriert:', reg.scope);

        // Neue Version wartet bereits
        if (reg.waiting) {
            showSWUpdateHint(reg.waiting);
        }

        // Zukünftige Updates
        reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            newSW.addEventListener('statechange', () => {
                if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                    showSWUpdateHint(newSW);
                }
            });
        });

        // Hör auf SKIP_WAITING Message
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'SW_UPDATED') {
                window.location.reload();
            }
        });
    }).catch(err => log('[SW] Registrierung fehlgeschlagen:', err.message));
}

function showSWUpdateHint(newSW) {
    // Einmaliger Hinweis pro Session (Spieltisch-Regel)
    if (sessionStorage.getItem('sw-update-shown')) return;
    sessionStorage.setItem('sw-update-shown', '1');
    // Einfache Implementierung ohne Toast-Erweiterung:
    const reload = confirm('Neue App-Version verfügbar. Jetzt neu laden?');
    if (reload) {
        newSW.postMessage({ type: 'SKIP_WAITING' });
    }
}
```

### File Backup — Spieltag-Snapshot-Logik

```javascript
// Dateiname-Konvention (Claude's Discretion: erste Save des Tages = Snapshot)
// Source: Eigenes Muster basierend auf D-12 [ASSUMED: Trigger-Logik]
function getBackupFilenames(campaignKey, campaignName) {
    const safeName = campaignName.replace(/[^a-z0-9äöüß-]/gi, '-').toLowerCase();
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    return {
        current: `${safeName}-aktuell.json`,
        snapshot: `${safeName}-${today}.json`
    };
}

async function writeBackupForCampaign(dirHandle, campaignKey, campaignName, data) {
    const { current, snapshot } = getBackupFilenames(campaignKey, campaignName);
    // Immer: aktuelle Datei überschreiben
    await writeBackupFile(dirHandle, current, data);
    // Nur wenn noch kein Snapshot heute: Snapshot schreiben
    const snapshotHandle = await dirHandle.getFileHandle(snapshot, { create: false }).catch(() => null);
    if (!snapshotHandle) {
        await writeBackupFile(dirHandle, snapshot, data);
        await pruneOldSnapshots(dirHandle, safeName);
    }
}

async function pruneOldSnapshots(dirHandle, safeName) {
    const MAX_SNAPSHOTS = 10; // D-12
    const allFiles = [];
    for await (const [name] of dirHandle.entries()) {
        if (name.startsWith(safeName + '-') && name.match(/\d{4}-\d{2}-\d{2}\.json$/)) {
            allFiles.push(name);
        }
    }
    allFiles.sort(); // chronologisch
    while (allFiles.length > MAX_SNAPSHOTS) {
        const oldest = allFiles.shift();
        await dirHandle.removeEntry(oldest);
    }
}
```

### Voll-Export-Format (Kampagnen-übergreifend)

```javascript
// Neues Format für D-08: alle Kampagnen + Meta-Daten
// Source: Abgeleitet aus systems/campaign-manager/campaign-manager.js [VERIFIED: Codebase]
function buildFullExport() {
    const campaignIndex = getCampaignIndex();
    const allCampaigns = {};

    // Alle Kampagnen-Daten sammeln
    for (const campaign of campaignIndex.campaigns) {
        const data = StorageAPI.getJSON(campaign.key, null);
        if (data) {
            allCampaigns[campaign.key] = {
                meta: campaign, // name, created, key
                data: stripNonUserData(data) // keine SRD-Spells
            };
        }
    }
    // Standard-Kampagne
    const defaultData = StorageAPI.getJSON(APP_CONFIG.STORAGE_KEY, null);
    if (defaultData) {
        allCampaigns[APP_CONFIG.STORAGE_KEY] = {
            meta: { key: APP_CONFIG.STORAGE_KEY, name: 'Standard-Kampagne' },
            data: stripNonUserData(defaultData)
        };
    }

    return {
        _exportType: 'full-v1',   // Format-Identifier
        _appVersion: APP_CONFIG.VERSION,
        _exportDate: new Date().toISOString(),
        _activeCampaignKey: campaignIndex.active,
        campaigns: allCampaigns,
        settings: D.settings || {},
        diceFavorites: StorageAPI.getJSON(APP_CONFIG.DICE_FAV_KEY, []),
        dmScreenProfiles: D.dmScreenProfiles || {},
        campaignIndex: campaignIndex
    };
}
```

---

## State of the Art

| Alter Ansatz | Aktueller Ansatz | Seit | Impact |
|--------------|-----------------|------|--------|
| Inline `data:` URI Manifest | Externe `manifest.webmanifest`-Datei | W3C Standard | Bessere Browser-Kompatibilität, Lighthouse-Score |
| SW mit `self.skipWaiting()` im Install | SW wartet; App zeigt Hinweis; Nutzer entscheidet | PWA Best Practice (2022+) | Keine Session-Unterbrechungen |
| Google Fonts CDN-Link im HTML | Lokal gebündelte WOFF2-Dateien + @font-face | Best Practice seit DSGVO | Vollständige Offline-Fähigkeit, Datenschutz |
| `showSaveFilePicker()` pro Datei | `showDirectoryPicker()` + Ordner-Handle in IDB | Chrome 122 (Dez 2023) | Dauerhafter Ordner-Zugriff ohne Re-Prompt |
| Chrome 86–121: Immer neu prompten | Chrome 122+: „Allow on every visit" Option | Chrome 122 (2024-03) | Weniger Permission-Interruptions |
| Kein atomares Schreiben | `createWritable().close()` = atomares Commit | Baseline 2025 | Null Datenverlust bei Schreib-Unterbrechungen |

**Deprecated/überholt:**
- Inline `data:` URI Manifest in `index.html:12`: wird durch `manifest.webmanifest` ersetzt
- SW cached `./index.html` + `./loader.js`: wird durch Single-File-aware SW ersetzt
- Google Fonts CDN-Links in `index.html:13-15`: werden durch lokale @font-face-Regeln ersetzt

---

## Assumptions Log

| # | Behauptung | Abschnitt | Risiko bei Falschheit |
|---|-----------|-----------|----------------------|
| A1 | GitHub-Repo ist `retroArthur/DnD_Tracker_Pro` (aus Phase-1-CONTEXT.md) — Pages-URL damit `retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html` | Pattern 2, Pattern 4 | start_url und sw.js-Scope müssen angepasst werden |
| A2 | Spieltag-Snapshot-Trigger = erster Save des Kalendertages (nicht des Session-Timers) | Code Example: Spieltag-Snapshot-Logik | Wenn Session-Timer der Trigger sein soll, ändert sich die Logik leicht |
| A3 | Font-Bundle-Strategie: WOFF2 als separate Dateien in `dist/assets/fonts/` (nicht base64-inline) | Pattern: Font-Bundle | Falls Single-File-Constraint strenger wird, könnte base64-inline nötig sein (+~200 KB) |
| A4 | Voll-Export-Format `_exportType: 'full-v1'` ist kompatibel mit bestehendem Import-Dialog (D-Discretion: Format-Kompatibilität) | Code Example: Voll-Export | Falls nicht kompatibel, braucht der Import-Dialog eine eigene Route für dieses Format |
| A5 | `Strg+Shift+K` ist kollisionsfrei in installierter PWA (kein Browser-Chrome) | Pitfall 7 | Edge-Browser hat Strg+Shift+K für Console-Highlight in DevTools — in PWA-Modus irrelevant |

---

## Open Questions

1. **GitHub Pages URL und start_url**
   - Was wir wissen: Pages-URL ist `user.github.io/repo/filename.html`; `start_url` muss auf diesen Pfad zeigen
   - Was unklar ist: Ob der Repo-Name `DnD_Tracker_Pro` (mit Unterstrichen) zu URL-Encoding-Problemen in `manifest.webmanifest` führt
   - Empfehlung: Beim ersten manuellen Test nach Deploy in Chrome DevTools → Application → Manifest prüfen

2. **Spieltisch-Test: Strg+Shift+K im installierten PWA-Modus**
   - Was wir wissen: Im Standalone-Modus entfallen Browser-Shortcuts; Strg+Shift+K ist in Chrome im normalen Tab unbelegte (Devtools brauchen F12)
   - Was unklar ist: Verhalten in Edge (Strg+Shift+K = DevTools in Entwickler-Tab)
   - Empfehlung: Planer soll beide Shortcut-Kandidaten implementierbar machen; finaler Audit im Smoke-Test

3. **Google Fonts: welche Gewichtungen (Weights) sind benötigt?**
   - Was wir wissen: `index.html:15` lädt nur `Roboto:wght@400;700`; Editor-Fonts (Inter, Poppins, Source Sans Pro) werden in `EDITOR_FONTS` in `core/constants.js` referenziert
   - Was unklar ist: Welche Gewichtungen der Editor-Fonts tatsächlich in CSS-Regeln verwendet werden
   - Empfehlung: Grep nach `font-family: Inter|Poppins|Source Sans Pro` in CSS-Dateien vor dem Font-Download

4. **PWA-Icon-SVG-Design**
   - Was wir wissen: D-04 legt fest: d20-Motiv, Gold `#d4af37` auf Dunkel `#0d0d0d`, Claude entwirft
   - Was unklar ist: Exaktes SVG-Design (Gemometrie des d20) und ob es als maskable (Safe-Zone 40% Radius) korrekt funktioniert
   - Empfehlung: SVG mit Realspace.io oder simplem Polygon-Ansatz; in Maskable.app.io testen

---

## Environment Availability

| Abhängigkeit | Benötigt von | Verfügbar | Version | Fallback |
|-------------|-------------|-----------|---------|---------|
| Python 3.x | build.py (Font-Download-Schritt) | ✓ (CI: `python-version: '3.x'`) | 3.x | — |
| Node 20 | npm run test, Playwright | ✓ (CI: `node-version: '20'`) | 20 | — |
| GitHub Pages (aktiviert) | deploy-pages Action | Unbekannt — manueller One-Time-Setup nötig | — | Workflow deployed, aber Seite erscheint nicht |
| File System Access API | TECH-03 Datei-Backup | Chrome/Edge ✓, Firefox ✗ | Chrome 105+, Edge 105+ | `<a download>` Fallback (D-18) |
| Google Fonts CDN (Download-Zeit) | Font-Bundle Build-Schritt | ✓ (Build läuft mit Netzwerk) | — | Fonts bereits in repo gecacht |

**Fehlende Abhängigkeiten ohne Fallback:**
- GitHub Pages manuell aktivieren (Settings → Pages → Source: GitHub Actions) — blockiert TECH-01 Deploy

**Fehlende Abhängigkeiten mit Fallback:**
- File System Access API in Firefox → `<a download>` Fallback für TECH-03 vollständig geplant

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30 (unit), Playwright 1.57 (E2E/smoke) |
| Config file | `jest.config.cjs`, `playwright.config.js`, `playwright.smoke.config.js` |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test && npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID | Verhalten | Test-Typ | Automatisierter Befehl | Datei vorhanden? |
|--------|-----------|---------|----------------------|----------------|
| TECH-01 | App startet als PWA (Standalone-Mode) und lädt ohne Fehler | E2E Smoke | `npx playwright test tests/e2e/smoke.spec.js` | ✅ (erweiterbar) |
| TECH-01 | manifest.webmanifest erreichbar + valide Felder | E2E | `npx playwright test tests/e2e/features/pwa.spec.js` | ❌ Wave 0 |
| TECH-01 | SW registriert sich korrekt auf https | E2E | Teil von pwa.spec.js | ❌ Wave 0 |
| TECH-01 | GitHub Pages Deploy-Job läuft durch | CI | `.github/workflows/ci.yml` smoke-test Pass | ✅ (CI-Erweiterung) |
| TECH-02 | Wizard erkennt leeren Speicher beim Erststart | Unit | `npx jest tests/unit/migration.test.js` | ❌ Wave 0 |
| TECH-02 | Voll-Export enthält alle Kampagnen + Settings | Unit | `npx jest tests/unit/full-export.test.js` | ❌ Wave 0 |
| TECH-02 | Voll-Import stellt alle Kampagnen wieder her | Unit | `npx jest tests/unit/full-import.test.js` | ❌ Wave 0 |
| TECH-03 | File Backup schreibt aktuelle Datei nach save() | Unit (mock FS API) | `npx jest tests/unit/file-backup.test.js` | ❌ Wave 0 |
| TECH-03 | Snapshot-Pruning: max 10 Snapshots pro Kampagne | Unit | Teil von file-backup.test.js | ❌ Wave 0 |
| TECH-04 | Command Palette öffnet sich mit Shortcut | E2E | `npx playwright test tests/e2e/features/command-palette.spec.js` | ❌ Wave 0 |
| TECH-04 | Fuzzy-Suche findet „Neuer NPC" | Unit | `npx jest tests/unit/action-registry.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per Task-Commit:** `npm run test:unit` (< 30 s)
- **Per Wave-Merge:** `npm run test && npm run test:e2e`
- **Phase Gate:** Full Suite grün vor `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/e2e/features/pwa.spec.js` — deckt TECH-01 Manifest + SW-Registrierung
- [ ] `tests/unit/migration.test.js` — deckt TECH-02 Wizard-Logik, Voll-Export/Import
- [ ] `tests/unit/full-export.test.js` — deckt Voll-Export-Format-Validierung
- [ ] `tests/unit/file-backup.test.js` — deckt TECH-03 mit gemockter File System API
- [ ] `tests/unit/action-registry.test.js` — deckt TECH-04 Fuzzy-Suche über Aktions-Registry
- [ ] `tests/e2e/features/command-palette.spec.js` — deckt TECH-04 E2E

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Anwendbar | Standard Control |
|---------------|-----------|-----------------|
| V2 Authentication | nein | — (keine Nutzer-Auth) |
| V3 Session Management | nein | — (kein Server) |
| V4 Access Control | nein | — (Single-User-App) |
| V5 Input Validation | ja | `esc()` / `sanitizeHTML()` für alle File-Namen und Import-Daten |
| V6 Cryptography | nein | — (keine Verschlüsselung nötig für lokale Backups) |

### Bekannte Bedrohungsmuster für diesen Stack

| Muster | STRIDE | Standard-Mitigation |
|--------|--------|-------------------|
| Schadhafte Backup-Datei beim Import (manipuliertes JSON) | Tampering | JSON.parse() + Schema-Validierung via bestehendem `IO_SCHEMA` in import-export.js vor Datenübernahme |
| XSS über Dateinamen in Backup-Browser (Restore-Liste) | Tampering | `esc()` für alle Dateinamen in der UI-Ausgabe |
| Path Traversal bei `getFileHandle(filename)` | Tampering | Dateinamen bereinigen: nur alphanumerisch + `-_` + `.json`; keine `../`-Sequenzen |
| Persistierter XSS in Voll-Export (NPC-Namen) | Information Disclosure | Bestehende Sanitierung beim Import bleibt aktiv; Export selbst nicht sanitisieren (würde Daten verfälschen) |
| SW liefert veraltete App dauerhaft aus (Supply Chain) | Denial of Service | CACHE_VERSION-Bump bei jedem Build; Update-Hinweis (D-03) |

---

## Quellen

### Primary (HIGH confidence)
- [MDN: FileSystemFileHandle.createWritable()](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable) — atomares Schreib-Pattern
- [Chrome Docs: Persistent permissions for FSA API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api) — Chrome 122 Permission-Dialog, IDB-Handle-Persistenz
- [web.dev: Handling Service Worker updates](https://web.dev/learn/pwa/update/) — updatefound, statechange, skipWaiting-Pattern
- [web.dev: Add a web app manifest](https://web.dev/articles/add-manifest) — Manifest-Pflichtfelder, Icon-Anforderungen
- [GitHub Docs: Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — deploy-pages-Action, Permissions
- [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) — queryPermission, requestPermission, IDB-Serialisierung
- [Can I Use: File System Access API](https://caniuse.com/native-filesystem-api) — Browser-Support-Matrix
- Codebase-Verifikation: `sw.js`, `core/init.js`, `systems/spellslots/pwa-install.js`, `systems/spellslots/keyboard-shortcuts.js`, `systems/campaign-manager/campaign-manager.js`, `systems/search/global-search.js`

### Secondary (MEDIUM confidence)
- [MDN: icons (manifest)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) — maskable Icons Safe-Zone
- [Handling Service Worker updates (progressier.com)](https://progressier.com/handling-service-worker-updates) — Praxis-Muster
- [Persistent file handling (Transloadit)](https://transloadit.com/devtips/persistent-file-handling-with-the-file-system-access-api/) — IDB Handle-Pattern Praxis

### Tertiary (LOW confidence)
- Shortcut-Kollisionsanalyse aus GitHub Community Discussions — nur für erste Orientierung; finaler Audit im Code erforderlich

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — alle APIs durch offizielle MDN/Chrome Docs / GitHub Docs verifiziert
- Architecture: HIGH — basiert auf verifizierten Codebase-Findings und offiziellen Docs
- Pitfalls: HIGH — Pitfalls 1–6 aus bekannten API-Verhalten verifiziert; Pitfall 7 (Shortcut) MEDIUM
- Font-Bundle-Mechanik: MEDIUM — Ansatz klar, exakter Build-Schritt in build.py noch nicht implementiert

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (File System Access API und Chrome-Permissions sind aktuell; GitHub Actions-Actions-Versionen können sich ändern)
