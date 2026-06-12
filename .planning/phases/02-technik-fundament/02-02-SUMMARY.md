---
phase: 02-technik-fundament
plan: "02"
subsystem: pwa
tags: [pwa, service-worker, manifest, fonts, icons, ci-deploy, install-button, sw-update, github-pages]

requires:
  - phase: 02-01
    provides: "SW-Registrierung in core/init.js (defensiver showSWUpdateHint-Aufruf), leere assets/styles/fonts.css + pwa.css, Platzhalter-Button #pwa-install-btn in header.html, E2E-Stub tests/e2e/features/pwa.spec.js"
provides:
  - "manifest.webmanifest mit display=standalone, maskable Icons 192+512, theme_color #d4af37"
  - "sw.js: Cache-First-SW fuer Single-File-Build, SKIP_WAITING nur per Message-Handler (D-03)"
  - "10 lokale WOFF2-Fonts in assets/fonts/ + vollstaendige @font-face-Regeln in assets/styles/fonts.css (kein CDN)"
  - "d20-App-Icon SVG + PNG 192/512 (Gold auf Dunkel, Hexagon-Silhouette, 80%-Safe-Zone)"
  - "window.showSWUpdateHint(newSW): Update-Leiste mit sessionStorage-Guard + SKIP_WAITING + reload"
  - "Header-Install-Button via initPWA() / beforeinstallprompt (localStorage pwa-installed-Flag)"
  - "CACHE_VERSION-Bump beim Production-Build (dnd-tracker-v{VER}-{YYYYMMDDHHMM})"
  - "CI deploy-Job: needs [smoke-test] -> upload-pages-artifact@v4 + deploy-pages@v4"
affects: [02-03, 02-04, 02-05, core/init.js, build.py, .github/workflows/ci.yml]

tech-stack:
  added: []
  patterns:
    - "Cache-First Service Worker (single-file-build-aware, CACHED_ASSETS explizit)"
    - "SKIP_WAITING nur per Message-Handler (D-03 kein erzwungenes Update)"
    - "CACHE_VERSION timestamp-Bump im Production-Build (Threat T-02-04)"
    - "EventDelegation.registerAction Selbst-Registrierung im Modul (Welle-2-konfliktfrei)"
    - "Python-Stdlib Wu-Antialiasing fuer PNG-Icon-Rendering (keine externen Abhaengigkeiten)"

key-files:
  created:
    - manifest.webmanifest
    - icons/icon.svg
    - icons/icon-192.png
    - icons/icon-512.png
    - tools/fetch-fonts.py
    - tools/render-icons.py
    - assets/fonts/ (10 WOFF2: inter-400/500/600, poppins-400/500/600, roboto-400/700, source-sans-pro-400/600)
  modified:
    - sw.js
    - index.html
    - build.py
    - assets/styles/fonts.css
    - assets/styles/pwa.css
    - systems/spellslots/pwa-install.js
    - .github/workflows/ci.yml

key-decisions:
  - "D-03 enforced: skipWaiting nur im SKIP_WAITING-Message-Handler, nie im Install-Handler"
  - "CACHE_VERSION mit Version+Timestamp gebumpt (dnd-tracker-v{VERSION}-{YYYYMMDDHHMM}) — Threat T-02-04"
  - "PNG-Icons per Python-Stdlib Wu-Antialiasing gerendert (kein cairosvg/PIL/inkscape noetig)"
  - "EventDelegation.registerAction in pwa-install.js selbst (Welle-2-konfliktfrei, kein system-actions.js-Edit)"
  - "deploy-Job fuehrt python build.py --production erneut aus statt Artefakt-Download (braucht dist/ mit fonts+icons)"
  - "Google-Fonts-CDN vollstaendig entfernt (DSGVO/offline-faehig, Threat T-02-07)"

patterns-established:
  - "Wave-2-Selbst-Registrierung: jedes parallele Wellen-Modul registriert seine data-actions selbst via EventDelegation.registerAction"
  - "SW Cache-First fuer Single-File-Build: CACHED_ASSETS listet ./, optimized.html, manifest, icons, alle WOFF2"

requirements-completed: [TECH-01]

duration: ~90min (inkl. Icon-Revision-Checkpoint)
completed: "2026-06-12"
---

# Phase 02 Plan 02: PWA-Grundlage + Deployment Summary

**Echtes manifest.webmanifest mit Cache-First-SW, 10 lokalen WOFF2-Fonts, d20-Gold-Icon (Hexagon-Silhouette, maskable), Header-Install-Button und GitHub-Pages-Deploy-Job — App ist offline-installierbar ohne CDN-Abhaengigkeit.**

## Performance

- **Duration:** ~90 Minuten (inkl. Icon-Revision-Checkpoint nach erster Fassung)
- **Started:** 2026-06-12T21:09:09Z
- **Completed:** 2026-06-12T23:35:00Z
- **Tasks:** 3 von 4 vollstaendig automatisiert; Task 4 wartet auf manuellen Repo-Setup
- **Files modified:** 23 (7 modifiziert, 16 neu erstellt)

## Accomplishments

- App ist als echte PWA installierbar: echtes Manifest, maskable Icons, Header-Install-Button der verschwindet nach Installation
- Vollstaendige Offline-Faehigkeit: Cache-First-SW cached Single-File-Build + alle Fonts lokal (kein Google-Fonts-CDN)
- Sicherer Update-Mechanismus: `showSWUpdateHint()` implementiert D-03-konform (kein erzwungenes skipWaiting, nur auf Nutzer-Klick)
- CI deployed automatisch nach GitHub Pages — aber nur wenn smoke-test gruen ist (D-01)
- Alle STRIDE-Threats T-02-04 bis T-02-07 mitigiert (CACHE_VERSION-Bump, skipWaiting-Isolation, Maskable-Check, CDN entfernt)

## Task Commits

Jeder Task wurde atomar committet:

| Task | Name | Commit | Typ |
|------|------|--------|-----|
| 1 | Service Worker neu + Manifest + Font-Bundle | `1c3245b` | feat |
| 2 | Install-Button + showSWUpdateHint + CACHE_VERSION + Deploy-Job | `5eead70` | feat |
| 3 (Erstfassung) | d20-App-Icon SVG + PNG 192/512 | `f5215cf` | feat |
| 3 (Icon-Revision) | d20-Icon ueberarbeitet — Hexagon, dickere Linien, zentriert | `323d287` | fix |
| 4 | GitHub Pages aktivieren — manueller Schritt, kein Commit | — | (manuell) |

**Plan-Metadaten (diese SUMMARY):** wird als docs(02-02)-Commit hinzugefuegt.

## Files Created/Modified

| Datei | Was es tut |
|-------|------------|
| `sw.js` | Cache-First-SW fuer Single-File-Build, SKIP_WAITING-Message-Handler, Activate-Cleanup |
| `manifest.webmanifest` | PWA-Manifest: display=standalone, theme_color=#d4af37, start_url=./dnd-tracker-optimized.html, 2 maskable Icons |
| `icons/icon.svg` | d20-Icon: Hexagon-Silhouette, 5 Innenlinien, "20"-Text, Gold #d4af37 auf #0d0d0d, 80%-Safe-Zone |
| `icons/icon-192.png` | Gerendertes PNG 192x192 (Wu-Antialiasing) |
| `icons/icon-512.png` | Gerendertes PNG 512x512 (Wu-Antialiasing) |
| `tools/fetch-fonts.py` | Laedt 10 WOFF2-Dateien von Google Fonts herunter nach assets/fonts/ |
| `tools/render-icons.py` | Rendert icon.svg zu PNG 192/512 via Python-Stdlib-Geometrie + Wu-Antialiasing |
| `assets/fonts/` | 10 WOFF2-Dateien: Inter 400/500/600, Poppins 400/500/600, Roboto 400/700, Source Sans Pro 400/600 |
| `assets/styles/fonts.css` | Alle 11 @font-face-Bloecke (Pitfall 8: EINE Datei), font-display: swap, lokale Pfade |
| `assets/styles/pwa.css` | .pwa-install-btn (Gold-Rahmen, mobile icon-only), .pwa-update-banner (fixed bottom, slide-up Animation) |
| `systems/spellslots/pwa-install.js` | initPWA(), installPWA(), showSWUpdateHint(), EventDelegation.registerAction-Selbst-Registrierung |
| `index.html` | data:-Manifest-Link und Roboto-CDN durch echte Manifest-Links ersetzt |
| `build.py` | HTML-Head: data:-Manifest -> rel=manifest, CDN-Zeilen entfernt; Production: CACHE_VERSION-Bump + dist/sw.js schreiben |
| `.github/workflows/ci.yml` | deploy-Job: needs [smoke-test], permissions pages/id-token, upload-pages-artifact@v4 + deploy-pages@v4 |

## Decisions Made

1. **D-03 skipWaiting-Isolierung:** `self.skipWaiting()` AUSSCHLIESSLICH im `message`-Handler bei `type === 'SKIP_WAITING'`. Im `install`-Handler kein skipWaiting. Entspricht RESEARCH Anti-Pattern-Warnung und Threat T-02-05.

2. **CACHE_VERSION-Bump-Strategie:** `'dnd-tracker-v{VERSION}-{YYYYMMDDHHMM}'` beim Production-Build. Alternativen: reiner Timestamp (zu volatil), manuelles Bumpen (vergessbar). Gewaehlte Loesung kombiniert semantische Version mit Deployment-Zeit (Threat T-02-04).

3. **PNG-Rendering ohne externe Bibliotheken:** cairosvg, Pillow, inkscape nicht verfuegbar. Eigener Python-Stdlib-Renderer mit Wu-Antialiasing implementiert. Trade-off: weniger pixelgenaue Kurven, aber keine Installationsabhaengigkeit — akzeptabel fuer ein App-Icon.

4. **EventDelegation Selbst-Registrierung:** pwa-install.js registriert `data-action="install-pwa"` selbst am Modulende, statt system-actions.js zu bearbeiten. Haelt parallele Wellen-2-Plaene (02-03/02-04/02-05) konfliktfrei (kein gemeinsamer Edit-Zielfile).

5. **deploy-Job baut neu statt Artefakt zu verwenden:** Der CI-Job fuehrt `python build.py --production` selbst aus, weil `dist/` zusaetzlich `sw.js`, `manifest.webmanifest`, `icons/` und `assets/fonts/` benoetigt — diese sind nicht im HTML-Bundle, muessen separat ins Pages-Artefakt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Keine SVG-Render-Bibliothek verfuegbar**
- **Found during:** Task 3 (d20-App-Icon PNG-Rendering)
- **Issue:** Plan sah cairosvg/rsvg-convert/Headless-Browser vor. Keine dieser Optionen war auf dem System installiert.
- **Fix:** Eigenen Python-Stdlib-Renderer mit Wu-Antialiasing-Linienalgorithmus entwickelt (`tools/render-icons.py`). Rendert Hexagon-Silhouette + 5 Innenlinien + Text geometrisch direkt als PNG-Bytestream.
- **Files modified:** icons/icon-192.png, icons/icon-512.png, tools/render-icons.py (neu)
- **Verification:** `ls -la icons/*.png` zeigt 4011 / 12748 Bytes; beide Dateien sind valide PNG (magic bytes 89504E47)
- **Committed in:** f5215cf (Task-3-Commit)

**2. [Rule 1 - Bug / Checkpoint-Revision] d20-Icon visuell nachgebessert**
- **Found during:** Checkpoint Task 3 (human-verify) — Nutzer meldete Icon nicht klar erkennbar
- **Issue:** Erste Fassung (f5215cf): Pentagon-Zeichnung war zu duenn, "20" nicht gut zentriert, Hexagon-Silhouette nicht klar genug
- **Fix:** SVG ueberarbeitet: Hexagon-Silhouette (statt Pentagon), alle stroke-width auf 3.5px erhoehen, "20"-Text exakt zentriert (x=50 y=57), dominant-baseline=central. PNG neu gerendert.
- **Files modified:** icons/icon.svg, icons/icon-192.png, icons/icon-512.png
- **Verification:** Nutzer hat "approved" bestaetigt nach zweitem Checkpoint
- **Committed in:** 323d287 (Icon-Revisionscommit)

**3. [Rule 2 - Security] CACHE_VERSION-Bump als eigenstaendiger dist/sw.js-Schreibschritt**
- **Found during:** Task 2 (build.py-Anpassung)
- **Issue:** sw.js ist nicht Teil des HTML-Bundles (wird separat nach dist/ kopiert). Der Plan beschrieb den Bump abstrakt; die konkrete Umsetzung erforderte einen zusaetzlichen `open('dist/sw.js', 'w')` Schreibschritt nach dem Prod-Build.
- **Fix:** build.py-Production-Modus schreibt zusaetzlich `dist/sw.js` mit ersetzer CACHE_VERSION (`re.sub`). Mitigiert Threat T-02-04 (dauerhaft veraltete App).
- **Files modified:** build.py
- **Committed in:** 5eead70 (Task-2-Commit)

---

**Total Deviations:** 3 (1 blocking-fix, 1 visual-revision, 1 security-enhancement)
**Impact on plan:** Alle notwendig fuer korrekte Funktion. Kein Scope-Creep.

## Checkpoint-Historie

| Checkpoint | Typ | Ergebnis |
|------------|-----|---------|
| Task 3 (Erstfassung) | human-verify | Nutzer meldete Icon nicht klar — Revision notwendig |
| Task 3 (Revision) | human-verify | Nutzer: "approved" — Icon freigegeben |
| Task 4 | human-action | Manueller GitHub-Repo-Setup ausstehend (siehe unten) |

## Manuelle Schritte ausstehend

### Task 4: GitHub Pages aktivieren (einmaliger Repo-Setup)

Der CI-Deploy-Job (`.github/workflows/ci.yml`, Job `deploy-pages`) ist vollstaendig implementiert und wartet auf die Pages-Quelle. Dieser Schritt erfordert GitHub-Web-UI-Zugang:

**Schritt 1 — Pages-Quelle setzen:**
1. Oeffne das Repository auf GitHub
2. Gehe zu **Settings** -> **Pages** -> **Build and deployment** -> **Source**
3. Waehle **"GitHub Actions"** (statt "Deploy from branch")
4. Speichern

**Schritt 2 — Ersten Deploy ausloesen:**
- Pushe auf `main` (oder warte auf den naechsten gruenen CI-Lauf nach dem Merge)
- Nach erfolgreichem `deploy-pages`-Job erscheint unter Settings -> Pages die Live-URL

**Schritt 3 — Verifikation (optional, nach erstem Deploy):**
- Oeffne die Pages-URL (`https://{user}.github.io/{repo}/dnd-tracker-optimized.html`) in Chrome
- DevTools -> Application -> Manifest: echtes Manifest wird angezeigt, beide Icons ohne Fehler
- Install-Dialog erscheint im Browser

**Hinweis Open Question 1 (RESEARCH):** Falls der Repo-Name Unterstriche enthaelt (z.B. `dnd_tracker`), muss `start_url` in manifest.webmanifest auf den korrekten Sub-Pfad angepasst werden: `./dnd-tracker-optimized.html` -> `/{repo-name}/dnd-tracker-optimized.html`.

**Live-Verifikation lokal nicht moeglich:** Ohne Push nach GitHub kann der Deploy-Job nicht ausgefuehrt werden. Alle automatisierbaren Anteile von Task 4 (der CI-Job selbst) wurden in Task 2 (Commit `5eead70`) committet.

## Known Stubs

Keine — alle implementierten Features sind vollstaendig verdrahtet.

## Threat Flags

Keine neuen Bedrohungsoberflächen jenseits des PLAN.md-Threat-Models eingeführt.

Alle PLAN.md-Threats mitigiert:
- T-02-04 (Stale Cache): CACHE_VERSION-Bump im Production-Build
- T-02-05 (skipWaiting-Risiko): skipWaiting nur im Message-Handler
- T-02-06 (Manifest-Fehler): Maskable-Check + Nutzer-Freigabe des Icons
- T-02-07 (CDN-IP-Leak): Alle Google-Fonts-CDN-Links entfernt, lokale WOFF2

## Self-Check: PASSED

| Check | Status |
|-------|--------|
| manifest.webmanifest vorhanden | FOUND |
| sw.js vorhanden + node --check OK | FOUND |
| icons/icon.svg vorhanden | FOUND |
| icons/icon-192.png vorhanden | FOUND |
| icons/icon-512.png vorhanden | FOUND |
| assets/styles/fonts.css vorhanden | FOUND |
| assets/styles/pwa.css vorhanden | FOUND |
| systems/spellslots/pwa-install.js vorhanden + node --check OK | FOUND |
| .github/workflows/ci.yml deploy-Job vorhanden | FOUND |
| tools/render-icons.py vorhanden | FOUND |
| Commit 1c3245b (Task 1) | FOUND |
| Commit 5eead70 (Task 2) | FOUND |
| Commit f5215cf (Task 3 Erstfassung) | FOUND |
| Commit 323d287 (Task 3 Icon-Revision) | FOUND |
| python build.py exit 0 | PASSED |
| manifest.webmanifest display=standalone | PASSED |
| sw.js enthaelt dnd-tracker-optimized.html | PASSED |
| pwa-install.js enthaelt showSWUpdateHint | PASSED |
| ci.yml enthaelt deploy-pages | PASSED |

## Next Phase Readiness

**Bereit fuer 02-03 und 02-04 (Welle 2):**
- `window.showSWUpdateHint` ist implementiert und exportiert (von core/init.js defensiv aufgerufen)
- `EventDelegation.registerAction` Selbst-Registrierungs-Pattern etabliert (02-03/02-04/02-05 koennen parallel arbeiten)
- Build laeuft fehlerfrei, Production-Build aktiv

**Offener Punkt:**
- GitHub Pages muss manuell aktiviert werden (Settings -> Pages -> Source -> GitHub Actions) bevor der Deploy-Job greift. Bis dahin bleibt die Live-URL unavailable — das beeintraechtigt aber die weiteren Wellen-2-Plaene nicht.

---
*Phase: 02-technik-fundament*
*Completed: 2026-06-12*
