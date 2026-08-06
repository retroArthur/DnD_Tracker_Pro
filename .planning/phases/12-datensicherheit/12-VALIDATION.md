---
phase: 12
slug: datensicherheit
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-06
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Abgeleitet aus `12-RESEARCH.md` § "Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.2.0 (Unit, jsdom) + Playwright 1.57.0 (E2E) |
| **Config file** | `jest.config.cjs`, `playwright.config.js` |
| **Quick run command** | `npx jest tests/unit/<datei>.test.js` (< 5 s) |
| **Full suite command** | `npm test` (Jest) + `npx playwright test` (E2E, Build zwingend zuerst) |
| **Estimated runtime** | Jest ~2 s · volle E2E-Suite ~2 min |

**Zwei etablierte Lademuster — je nach Bedarf wählen:**

- **`vm.createContext()`** (`tests/unit/full-export.test.js`, `file-backup.test.js`,
  `migration.test.js`): lädt EINE Quelldatei isoliert mit gemockten `window.*`-Globals. Bevorzugt,
  wenn nur ein Modul mit klaren Abhängigkeiten geprüft wird.
- **`eval(fs.readFileSync(...))`** (`file-backup-hook.test.js`, `soundboard.test.js`): lädt die echte
  Quelldatei in den globalen jsdom-Scope. Bevorzugt, wenn mehrere Module zusammenspielen müssen
  (z. B. `persistence.js` + `soundboard-idb.js`).

---

## Sampling Rate

- **Nach jedem Task-Commit:** `npx jest tests/unit/<betroffene-datei>.test.js` — gezielt, < 5 s
- **Nach jeder Welle:** `npm test` (volle Unit-Suite) plus gezielte E2E-Teilmenge
  (`npx playwright test tests/e2e/features/soundboard.spec.js tests/e2e/features/persistence.spec.js`)
- **Vor `/gsd-verify-work`:** volle Suite grün. **Basislinie: Jest 628, Playwright 319 passed /
  2 skipped** (Stand nach v1.1 — die Recherche nannte die ältere 621/318, hier korrigiert)
- **Max feedback latency:** < 5 s (Quick-Run)

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| SAFE-01 | `buildAudioExport()` sammelt `audioBlobs` + `diceStats`, Base64, 2. Datei | unit | `npx jest tests/unit/audio-export.test.js` | ❌ W0 (neu) | ⬜ pending |
| SAFE-01 | Audio-Rundlauf: Export → Import → Szene spielt Track (D-08) | e2e | `npx playwright test tests/e2e/features/soundboard.spec.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-01 | Fehlende Audio-Datei blockiert Hauptimport nicht, benennt Szenen (D-02) | unit | `npx jest tests/unit/migration.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-02 | `_doBackup()` sichert ALLE Kampagnen aus `getCampaignIndex()` | unit | `npx jest tests/unit/file-backup.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-02 | Key nur bei echter `safeName`-Kollision (D-04) | unit | `npx jest tests/unit/file-backup.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-02 | `FILE_BACKUP_MAX_SNAPSHOTS` gilt **pro Kampagne** | unit | `npx jest tests/unit/file-backup.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-03 | `removeAudioFile()` ruft `saveUndoState()` VOR `deleteSoundBlob()` | unit | `npx jest tests/unit/soundboard.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-04 | `isFreshInstall()` berücksichtigt `STORAGE_KEY_OVERRIDE` | unit | `npx jest tests/unit/migration.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-04 | `isFreshInstall()` erkennt IDB-only-Kampagnen als „nicht frisch" | unit | `npx jest tests/unit/migration.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-05 | Parse-Fehler in `undo()`/`redo()` poppt NICHT vom Stack | unit | `npx jest tests/unit/stability.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-05 | Nicht-serialisierbarer Snapshot wird NICHT gepusht, kein Crash | unit | `npx jest tests/unit/stability.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-05 | Kein `autosave-toggle`-String mehr im Quelltext (Grep-Test) | unit | `npx jest tests/unit/stability.test.js` | ⚠️ erweitern | ⬜ pending |
| SAFE-06 | >5-MB-IDB-only-Save **plus Reload** liest korrekt aus IDB | unit | `npx jest tests/unit/stability.test.js` | ⚠️ Save-Seite da, Reload fehlt | ⬜ pending |
| SAFE-06 | localStorage-Quota-Fallback (`QuotaExceededError`) → IDB greift | unit | `npx jest tests/unit/stability.test.js` | ❌ W0 (neu) | ⬜ pending |
| SAFE-06 | Export/Import-Versions-Rundlauf | unit | `npx jest tests/unit/full-export.test.js` | ⚠️ Import-Gegenseite fehlt | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/audio-export.test.js` — neue Datei für SAFE-01 (`buildAudioExport`,
      `downloadAudioExport`, `importAudioExport`). Vorlage: `tests/unit/full-export.test.js`
- [ ] `systems/file-backup/file-backup-manager.js`: `window._doBackup = _doBackup;` zu den Exports
      ergänzen (fehlt aktuell). **Ohne diesen Export ist SAFE-02 nicht direkt testbar**, ohne den
      gesamten `onAfterSave()`-Debounce-Pfad zu durchlaufen.
- [ ] `QuotaExceededError`-Fallback-Test in `stability.test.js` — `StorageAPI.set`-Mock, der wirft
- [ ] Kein neues Test-Framework nötig

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wizard-UX für zwei Dateien (Haupt + optional Audio) | SAFE-01 | Sichtbare UI-Änderung; von der Recherche als offene Frage 2 markiert | Umzugs-Wizard öffnen, beide Dateien nacheinander wählen; prüfen, dass der Hauptimport auch ohne die zweite durchläuft und die betroffenen Szenen benennt |
| Verhalten oberhalb der Base64-Grenze im echten Browser | SAFE-01 | Recherche-Annahme A1: die Node/V8-Grenze (384 MiB roh) ist gemessen, das Browser-Tab-OOM-Verhalten *unterhalb* der harten Grenze aber nicht live verifiziert | Mit einer künstlich großen Audio-Bibliothek exportieren und beobachten, ob die Warnschwelle greift, bevor der Tab kippt |

---

## Validierungs-Nuancen (für Verifier und Plan-Checker)

**Die Base64-Grenze ist eine harte Konstante, keine Schätzung.** V8s String-Limit liegt bei
`0x1fffffe8` = 536.870.888 Zeichen (512 MiB); Base64 bläht um 4/3 auf, also scheitert die Kodierung
bei **384 MiB Rohdaten**. Die empfohlene Warnschwelle von 300 MiB muss **vor** dem Kodieren greifen,
über die Metadaten aus `listSoundBlobs()` — eine Prüfung danach käme zu spät, weil der `RangeError`
bereits geworfen wurde.

**`getCampaignIndex()` ist verlässlich.** `saveCampaignIndex()` (`campaign-manager.js:17-19`) ruft
`StorageAPI.setJSON()` direkt auf und umgeht `save()`/`saveImmediate()` vollständig — der Index
überlebt also den IDB-Umschaltpfad, der `DEBT-17` verursacht hat. D-03 darf ihm unbedingt vertrauen.

**`diceStats` braucht hier keine Begrenzung.** Worst Case ~15 MB auch bei jahrelanger intensiver
Nutzung. Die Begrenzung ist `PERF-02` in Phase 13 — **nicht in dieser Phase mitbauen**, sonst
entstehen zwei konkurrierende Capping-Mechanismen.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s (Unit-Ebene)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
