---
phase: "02-technik-fundament"
plan: "02"
subsystem: "pwa"
tags: [pwa, service-worker, manifest, fonts, icons, ci-deploy, install-button, sw-update]
dependency_graph:
  requires: [02-01]
  provides: [manifest.webmanifest, sw.js, pwa-install.js, deploy-pages job, local-fonts]
  affects: [build.py, ci.yml, core/init.js (showSWUpdateHint called), header install-button]
tech_stack:
  added: []
  patterns:
    - Cache-First Service Worker (single-file build aware)
    - SKIP_WAITING message handler (D-03, no forced reload)
    - CACHE_VERSION timestamp bump in production build (T-02-04)
    - EventDelegation.registerAction self-registration (wave-2 conflict-free)
    - Wu antialiased line rendering for PNG icon generation (stdlib only)
key_files:
  created:
    - manifest.webmanifest
    - icons/icon.svg
    - icons/icon-192.png
    - icons/icon-512.png
    - tools/fetch-fonts.py
    - tools/render-icons.py
    - assets/fonts/ (10 WOFF2 files)
  modified:
    - sw.js
    - index.html
    - build.py
    - assets/styles/fonts.css
    - assets/styles/pwa.css
    - systems/spellslots/pwa-install.js
    - .github/workflows/ci.yml
decisions:
  - "D-03 enforced: skipWaiting only in SKIP_WAITING message handler, never in install handler"
  - "CACHE_VERSION bumped in production build with version+timestamp (dnd-tracker-v{VERSION}-{YYYYMMDDHHMM})"
  - "d20 PNG icons rendered via Python stdlib Wu-antialiasing (no cairosvg/PIL/inkscape required)"
  - "EventDelegation.registerAction in pwa-install.js itself (wave-2 conflict-free, no system-actions.js edit)"
  - "deploy job re-runs build.py --production rather than downloading artifact (needs full dist/ with fonts+icons)"
metrics:
  duration: "~45 minutes"
  completed: "2026-06-12T21:14:40Z"
  tasks_completed: 3
  tasks_total: 4
  files_created: 17
  files_modified: 7
---

# Phase 02 Plan 02: PWA-Grundlage + Deployment Summary

**One-liner:** Echtes manifest.webmanifest mit Cache-First-SW, lokalen WOFF2-Fonts, d20-Gold-Icon, Header-Install-Button und GitHub-Pages-Deploy-Job — App ist offline-installierbar.

---

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Service Worker neu + Manifest + Font-Bundle | 1c3245b | sw.js, manifest.webmanifest, assets/fonts/ (10 WOFF2), assets/styles/fonts.css, build.py, index.html |
| 2 | Install-Button + showSWUpdateHint + CACHE_VERSION + Deploy | 5eead70 | systems/spellslots/pwa-install.js, assets/styles/pwa.css, build.py, .github/workflows/ci.yml |
| 3 | d20-App-Icon SVG + PNG (Checkpoint: Visual Verify) | f5215cf | icons/icon.svg, icons/icon-192.png, icons/icon-512.png, tools/render-icons.py |

**Pending (Checkpoint):**
- Task 3: Human visual verification of d20 icon (maskable.app check)
- Task 4: GitHub Pages activation (repo settings, manual one-time action)

---

## What Was Built

### Task 1: PWA-Grundlage

**sw.js** komplett neu geschrieben (PATTERNS.md-konform):
- `const CACHE_VERSION = 'dnd-tracker-v3'` (gebumpt bei Production-Build)
- `CACHED_ASSETS`: `./`, `./dnd-tracker-optimized.html`, `./manifest.webmanifest`, Icons, alle 10 WOFF2-Fonts
- Install-Handler: `caches.open(CACHE_VERSION).then(c => c.addAll(CACHED_ASSETS))` — KEIN `skipWaiting()` (D-03)
- Activate-Handler: Alte Caches löschen + `clients.claim()`
- Fetch-Handler: Cache-First für Origin-Requests, Pass-Through für externe, HTML-Fallback auf `dnd-tracker-optimized.html`
- Message-Handler: `if (event.data?.type === 'SKIP_WAITING') { self.skipWaiting(); }` (einzig erlaubter Ort)

**manifest.webmanifest**: `display: standalone`, `theme_color: #d4af37`, `start_url: ./dnd-tracker-optimized.html`, zwei maskable Icons

**Google Fonts CDN entfernt** aus build.py HTML-Head und index.html. 10 WOFF2-Dateien lokal gebündelt (D-07, DSGVO-konform, offline-fähig). Alle 11 `@font-face`-Regeln in `assets/styles/fonts.css` (Pitfall 8 — eine Datei).

### Task 2: Interaktivität + CI

**pwa-install.js** erweitert:
- `initPWA()`: `beforeinstallprompt` → `#pwa-install-btn` sichtbar schalten (`display: flex`), nur wenn kein `localStorage['pwa-installed']`
- `appinstalled` → `StorageAPI.set('pwa-installed','true')`, Button dauerhaft ausblenden
- `window.showSWUpdateHint(newSW)`: `sessionStorage`-Guard, rendert `.pwa-update-banner`, „Jetzt neu laden" → `postMessage({type:'SKIP_WAITING'})` + `location.reload()`, „Jetzt nicht" → `banner.style.display='none'`
- `EventDelegation.registerAction('install-pwa', ...)` am Modulende (Selbst-Registrierung)

**pwa.css**: `.pwa-install-btn` (Gold-Rahmen, mobile icon-only), `.pwa-update-banner` (fixed bottom, `var(--yellow)` 85%, 40px, slide-up Animation)

**build.py CACHE_VERSION-Bump**: Beim `--production`-Build wird `'dnd-tracker-v3'` durch `'dnd-tracker-v{VERSION}-{YYYYMMDDHHMM}'` ersetzt. `dist/sw.js` wird mit gebumpter Version geschrieben (Threat T-02-04).

**ci.yml deploy-Job**: `needs: [smoke-test]`, `permissions: pages/id-token`, `environment: github-pages`, führt `python build.py --production` aus, kopiert `sw.js`/`manifest.webmanifest`/`icons/`/`assets/fonts/` nach `dist/`, dann `upload-pages-artifact@v4` + `deploy-pages@v4`.

### Task 3: d20-Icon (Checkpoint pending)

`icons/icon.svg`: Ikosaeder-Frontansicht, viewBox 0 0 100 100, Pentagon-Außenrahmen + 5 interne Kanten, „20" in Monospace, Gold `#d4af37` auf `#0d0d0d`. Alle Elemente innerhalb 10–90px = 80%-Safe-Zone.

`icons/icon-192.png` und `icons/icon-512.png`: Gerendert per Python-Stdlib (Wu-Antialiasing), keine externen Abhängigkeiten. `tools/render-icons.py` dokumentiert die Methode.

---

## Deviations from Plan

### Auto-fixed Issues

**[Rule 3 - Blocking] Keine SVG-Render-Bibliothek verfügbar**
- **Found during:** Task 3
- **Issue:** cairosvg, PIL/Pillow, inkscape, rsvg-convert alle nicht installiert
- **Fix:** Eigener Python-Stdlib-Renderer mit Wu-Antialiasing-Linienalgorithmus implementiert. Produziert funktionale PNGs ohne externe Abhängigkeiten.
- **Files modified:** icons/icon-192.png, icons/icon-512.png, tools/render-icons.py
- **Commit:** f5215cf

**[Rule 2 - Security] CACHE_VERSION-Bump als eigenständiger build.py-Block**
- **Found during:** Task 2
- **Issue:** Plan beschreibt CACHE_VERSION-Bump, aber sw.js wird nicht als Teil des HTML-Bundles eingebunden — separate dist/sw.js muss separat gepatch werden
- **Fix:** build.py schreibt beim Production-Build zusätzlich `dist/sw.js` mit gebumpter CACHE_VERSION (T-02-04 mitigation)
- **Files modified:** build.py
- **Commit:** 5eead70

---

## Known Stubs

Keine — alle implementierten Features sind vollständig verdrahtet.

---

## Threat Flags

Keine neuen Bedrohungsoberflächen jenseits des PLAN.md-Threat-Models eingeführt.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| manifest.webmanifest | FOUND |
| sw.js | FOUND |
| icons/icon.svg | FOUND |
| icons/icon-192.png | FOUND |
| icons/icon-512.png | FOUND |
| assets/styles/fonts.css | FOUND |
| assets/styles/pwa.css | FOUND |
| systems/spellslots/pwa-install.js | FOUND |
| .github/workflows/ci.yml | FOUND |
| tools/render-icons.py | FOUND |
| Commit 1c3245b (Task 1) | FOUND |
| Commit 5eead70 (Task 2) | FOUND |
| Commit f5215cf (Task 3) | FOUND |
