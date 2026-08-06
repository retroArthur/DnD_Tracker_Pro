---
phase: 2
slug: technik-fundament
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (Unit) + Playwright 1.57 (E2E/Smoke) |
| **Config file** | `jest.config.cjs`, `playwright.config.js`, `playwright.smoke.config.js` |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test && npm run test:e2e` |
| **Estimated runtime** | ~30 s (Unit) · ~90 s (Full inkl. E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 s (Unit-Sampling pro Task-Commit)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | TECH-01..04 | T-02-01 | Stub-Module brechen Build nicht (eindeutige Top-Level-Namen, keine Duplikat-Deklaration) | build | `python build.py` exit 0 | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | TECH-01..04 | T-02-02 / T-02-03 | init() ruft Fremdmodule nur via typeof-Guard; SW-Update erzwingt keinen Reload (D-03) | syntax | `node --check core/init.js` | ✅ | ⬜ pending |
| 02-01-03 | 01 | 1 | TECH-02/03/04 | — | Wave-0-Tests existieren real (kein skip), Jest sammelt sie ein (RED erwartet) | unit | `npx jest tests/unit/full-export.test.js tests/unit/file-backup.test.js tests/unit/action-registry.test.js` | ✅ W0 (erstellt diese) | ⬜ pending |
| 02-02-01 | 02 | 2 | TECH-01 | T-02-05 / T-02-07 | SW ohne skipWaiting im Install (D-03); Manifest valide; keine Google-Fonts-CDN (DSGVO) | syntax+build | `node --check sw.js && node -e "JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8'))" && python build.py` | ❌ W0 (02-01-03 für pwa.spec.js) | ⬜ pending |
| 02-02-02 | 02 | 2 | TECH-01 | T-02-04 / T-02-06 | CACHE_VERSION wird beim Production-Build invalidiert; Deploy nur nach grünem smoke-test (D-01) | syntax+build+ci | `node --check systems/spellslots/pwa-install.js && python build.py --production && node -e "if(!/deploy-pages/.test(require('fs').readFileSync('.github/workflows/ci.yml','utf8')))throw new Error('no deploy job')"` | ✅ | ⬜ pending |
| 02-02-03 | 02 | 2 | TECH-01 | T-02-06 | d20-Icon maskable-sicher (80%-Safe-Zone); Manifest ohne Validierungsfehler in DevTools | human-check | MISSING — visueller Maskable-Check (maskable.app) + DevTools Manifest; kein automatisierter Befehl möglich | n/a (Checkpoint) | ⬜ pending |
| 02-02-04 | 02 | 2 | TECH-01 | T-02-04 | Pages-Quelle = GitHub Actions; Live-URL liefert installierbare App (D-01/Pitfall 4) | human-action | MISSING — Repo-Setup (Settings → Pages → Source: GitHub Actions); keine CLI im Kontext | n/a (Checkpoint) | ⬜ pending |
| 02-03-01 | 03 | 2 | TECH-02 | T-02-08 / T-02-09 | Voll-Export ohne SRD-Spells (Lizenz, Pitfall 6); Import migrationssicher (StorageAPI {success,error}) | unit | `npx jest tests/unit/full-export.test.js` exit 0 | ✅ W0 (02-01-03) — hier grün | ⬜ pending |
| 02-03-02 | 03 | 2 | TECH-02 | T-02-10 / T-02-11 | Wizard nur bei isFreshInstall; saveUndoState vor Import; esc() für dyn. Strings (XSS) | syntax+build | `node --check systems/migration/migration-wizard.js && python build.py` | ✅ | ⬜ pending |
| 02-03-03 | 03 | 2 | TECH-02 | T-02-19 / T-02-10 | Divergenz sichtbar statt still (D-11); einmaliger Hinweis pro Sitzung (D-10); esc() für {Datum} | syntax+build | `node --check systems/migration/migration-wizard.js && python build.py` | ✅ | ⬜ pending |
| 02-04-01 | 04 | 2 | TECH-03 | T-02-15 (Re-Prompt) | queryPermission vor requestPermission; requestPermission nur in User-Geste (Pitfall 3) | syntax | `node --check systems/file-backup/file-backup-permissions.js` | ✅ | ⬜ pending |
| 02-04-02 | 04 | 2 | TECH-03 | T-02-12 / T-02-15 | Path-Traversal-Schutz (Whitelist-Regex) im Dateinamen; max 10 Snapshots (D-12); 1×/Sitzung-Warnung (D-16) | unit | `npx jest tests/unit/file-backup.test.js` exit 0 | ✅ W0 (02-01-03) — hier grün | ⬜ pending |
| 02-04-03 | 04 | 2 | TECH-03 | T-02-13 / T-02-16 | saveUndoState VOR Restore; esc() für Datei-/Ordnernamen; roter Bestätigungsdialog | syntax+build | `node --check systems/file-backup/file-backup-ui.js && python build.py` | ✅ | ⬜ pending |
| 02-05-01 | 05 | 2 | TECH-04 | T-02-17 | Wiederverwendung fuzzyMatch (kein Duplikat); kein const X=window.X in action-Funktion | unit | `npx jest tests/unit/action-registry.test.js` exit 0 | ✅ W0 (02-01-03) — hier grün | ⬜ pending |
| 02-05-02 | 05 | 2 | TECH-04 | T-02-18 / T-02-17 | Strg+Shift+K kollidiert nicht mit Strg+K (Global Search); esc() für Labels (XSS) | syntax+build+e2e | `node --check features/command-palette/command-palette.js && node --check systems/spellslots/keyboard-shortcuts.js && python build.py` + `npx playwright test tests/e2e/features/command-palette.spec.js` | ✅ W0 (02-01-03 für command-palette.spec.js) — hier grün | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Plan **02-01 Task 3** legt das gesamte Wave-0-Test-Gerüst an (RED-Phase, real ausführbar, kein `test.skip`). Welle 2 zieht die Tests grün.

- [ ] `tests/unit/full-export.test.js` — Voll-Export-Format + SRD-Ausschluss (TECH-02; grün durch 02-03 Task 1)
- [ ] `tests/unit/file-backup.test.js` — Schreiben nach save + Snapshot-Pruning (TECH-03, gemockte File System API; grün durch 02-04 Task 2)
- [ ] `tests/unit/action-registry.test.js` — Fuzzy-Suche über Aktions-Registry (TECH-04; grün durch 02-05 Task 1)
- [ ] `tests/e2e/features/pwa.spec.js` — Manifest erreichbar + SW-Registrierung (TECH-01; grün durch 02-02 Task 1)
- [ ] `tests/e2e/features/command-palette.spec.js` — Öffnen + Treffer (TECH-04; grün durch 02-05 Task 2)

*Bestehende Infrastruktur (Jest 30 + Playwright 1.57) ist installiert — kein Framework-Install nötig. `tests/e2e/smoke.spec.js` deckt TECH-01 Standalone-Start (erweiterbar).*

*Hinweis: Die in RESEARCH Test Map separat gelistete `tests/unit/migration.test.js` bzw. `tests/unit/full-import.test.js` sind in `full-export.test.js` konsolidiert (Voll-Export UND Import + Fresh-Install-Erkennung), da Plan 02-03 Export/Import in einem Modul liefert.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| d20-Icon erkennbar + maskable-sicher | TECH-01 (D-04) | Visuelle Beurteilung der Geometrie/Safe-Zone nicht automatisierbar | 02-02 Task 3: icon-512.png auf maskable.app/editor laden (Circle/Squircle ohne Abschnitt); DevTools → Application → Manifest ohne Fehler |
| GitHub Pages liefert installierbare App | TECH-01 (D-01) | Repo-Einstellung (Settings → Pages → Source) hat keine CLI im Kontext (Pitfall 4) | 02-02 Task 4: Pages-Source auf „GitHub Actions"; nach grünem Deploy Live-URL in Chrome öffnen; Install-Dialog erscheint |
| Backup-Schreiben in echten Ordner (File System Access) | TECH-03 | `showDirectoryPicker`/Permission-Prompt erfordert echte User-Geste + OS-Dateisystem (in Jest nur gemockt) | Production-Build serven, Ordner wählen, speichern → `-aktuell.json` + Tages-Snapshot liegen im Ordner; Restore über Backup-Browser |
| Command Palette im installierten PWA-Modus (Strg+Shift+K) | TECH-04 | Standalone-PWA-Shortcut-Verhalten (Edge) nur am echten installierten Fenster prüfbar (RESEARCH Open Question 2) | Installierte PWA öffnen, Strg+Shift+K drücken → Palette offen; Strg+K öffnet weiterhin Global Search (keine Kollision) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (zwei Checkpoints 02-02-03/04 sind bewusst human-check/human-action — kein CLI möglich, als Manual-Only erfasst)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (längste Lücke = die zwei aufeinanderfolgenden Checkpoints in 02-02; davor/danach automatisierte Verifies in jedem Plan)
- [x] Wave 0 covers all MISSING references (alle ❌-W0-Testdateien werden von 02-01 Task 3 erstellt)
- [x] No watch-mode flags (alle Befehle sind Single-Run: `npx jest <datei>`, `node --check`, `python build.py`, `npx playwright test <datei>`)
- [x] Feedback latency < 30s (Quick-Run `npm run test:unit` < 30 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-12
