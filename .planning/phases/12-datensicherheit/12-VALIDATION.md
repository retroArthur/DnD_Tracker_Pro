---
phase: 12
slug: datensicherheit
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: false
# nyquist_compliant bleibt false, obwohl die Abdeckung vollstaendig ist: zwei von der Phase
# geforderte Verhalten sind per test.failing als NACHWEISLICH VERLETZT verankert (D-02-Kern in
# SAFE-01, Crash-Haelfte von R11 in SAFE-05). Es gibt automatisierte Verifikation fuer beide —
# sie sagt nur "Anforderung nicht erfuellt". Siehe § Validation Audit 2026-09-04.
wave_0_complete: true
created: 2026-08-06
validated: 2026-09-04
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
- **Vor `/gsd-verify-work`:** volle Suite grün. **Basislinie: Jest 842 (30 Suites), Playwright 321
  passed / 2 skipped** (Stand 2026-09-04 nach dem Nyquist-Nachzug; davor 760/321, bei Planung 628/319 —
  die Recherche nannte die noch ältere 621/318)
- **Max feedback latency:** < 5 s (Quick-Run)

---

## Per-Task Verification Map

| # | Req ID | Behavior | Test Type | Automated Command | Status |
|---|--------|----------|-----------|-------------------|--------|
| R01 | SAFE-01 | `buildAudioExport()` sammelt `audioBlobs` + `diceStats`, Base64, 2. Datei | unit | `npx jest tests/unit/audio-export.test.js` | ✅ grün |
| R02 | SAFE-01 | Audio-Rundlauf: Export → Import → Szene **spielt** Track (D-08) | e2e | `npx playwright test tests/e2e/features/soundboard.spec.js` | ✅ grün |
| R03 | SAFE-01 | Fehlende Audio-Datei blockiert Hauptimport nicht, benennt Szenen (D-02) | unit | `npx jest tests/unit/audio-import-resilience.test.js` | ⚠️ **6 grün, D-02-Kern `test.failing`** |
| R04 | SAFE-02 | `_doBackup()` sichert ALLE Kampagnen aus `getCampaignIndex()` | unit | `npx jest tests/unit/file-backup.test.js tests/unit/file-backup-idb.test.js` | ✅ grün |
| R05 | SAFE-02 | Key nur bei echter `safeName`-Kollision (D-04) | unit | `npx jest tests/unit/file-backup.test.js` | ✅ grün |
| R06 | SAFE-02 | `FILE_BACKUP_MAX_SNAPSHOTS` gilt **pro Kampagne** | unit | `npx jest tests/unit/file-backup.test.js` | ✅ grün |
| R07 | SAFE-03 | `removeAudioFile()` ruft `saveUndoState()` VOR `deleteSoundBlob()` | unit | `npx jest tests/unit/soundboard.test.js` | ✅ grün |
| R08 | SAFE-04 | `isFreshInstall()` berücksichtigt `STORAGE_KEY_OVERRIDE` | unit | `npx jest tests/unit/migration.test.js` | ✅ grün |
| R09 | SAFE-04 | `isFreshInstall()` erkennt IDB-only-Kampagnen als „nicht frisch" | unit | `npx jest tests/unit/migration-wizard.test.js tests/unit/file-backup-idb.test.js` | ✅ grün |
| R10 | SAFE-05 | Parse-Fehler in `undo()`/`redo()` poppt NICHT vom Stack | unit | `npx jest tests/unit/stability.test.js` | ✅ grün |
| R11 | SAFE-05 | Nicht-serialisierbarer Snapshot wird NICHT gepusht **und crasht nicht** | unit | `npx jest tests/unit/stability.test.js` | ⚠️ **Push-Hälfte grün, Crash-Hälfte `test.failing`** |
| R12 | SAFE-05 | Kein `autosave-toggle`-String mehr im Quelltext (Grep-Test) | unit | `npx jest tests/unit/stability.test.js` | ✅ grün |
| R13 | SAFE-06 | >5-MB-IDB-only-Save **plus Reload** liest korrekt aus IDB | unit | `npx jest tests/unit/stability.test.js` | ✅ grün |
| R14 | SAFE-06 | localStorage-Quota-Fallback (`QuotaExceededError`) → IDB greift | unit | `npx jest tests/unit/stability.test.js` | ✅ grün |
| R15 | SAFE-06 | Export/Import-Versions-Rundlauf | unit | `npx jest tests/unit/full-export.test.js` | ✅ grün |
| R16 | SAFE-04 | `hasCampaignContent()` über ALLE Sammlungen (Gap G-12-3) | unit | `npx jest tests/unit/migration-wizard.test.js` | ✅ grün |

*Status: ✅ grün · ⚠️ teilweise / bekannter Defekt verankert · ❌ rot · ⬜ pending*

---

## Wave 0 Requirements

- [x] `tests/unit/audio-export.test.js` — angelegt, 35 Tests grün
- [x] `systems/file-backup/file-backup-manager.js`: `window._doBackup` exportiert — SAFE-02 direkt testbar
- [x] `QuotaExceededError`-Fallback-Test in `stability.test.js` — fährt die **echte** `StorageAPI.set()`
      und die **echte** `saveImmediate()`, nicht eine Testnachbildung (R14)
- [x] Kein neues Test-Framework nötig — geblieben bei Jest 30 + Playwright

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wizard-UX für zwei Dateien (Haupt + optional Audio) | SAFE-01 | Sichtbare UI-Änderung; von der Recherche als offene Frage 2 markiert | Umzugs-Wizard öffnen, beide Dateien nacheinander wählen; prüfen, dass der Hauptimport auch ohne die zweite durchläuft und die betroffenen Szenen benennt |
| Verhalten oberhalb der Base64-Grenze im echten Browser | SAFE-01 | Recherche-Annahme A1: die Node/V8-Grenze (384 MiB roh) ist gemessen, das Browser-Tab-OOM-Verhalten *unterhalb* der harten Grenze aber nicht live verifiziert | Mit einer künstlich großen Audio-Bibliothek exportieren und beobachten, ob die Warnschwelle greift, bevor der Tab kippt |

### Stand nach Plan 12-07, Checkpoint Task 4 (2026-08-19)

Der Punkt „Verhalten oberhalb der Base64-Grenze" zerfällt in zwei getrennt prüfbare Hälften. Nur
eine davon ist abgenommen — der Eintrag oben bleibt deshalb **offen**, nicht erledigt:

| Hälfte | Stand | Beleg / offener Rest |
|--------|-------|----------------------|
| **(a) Die Warnschwelle greift oberhalb von 300 MiB** | ✅ **verifiziert** (Nutzer, echter Browser, `dist/dnd-tracker-bundled.html`) | Beobachtet: Toast „Audio-Export fehlgeschlagen: Audio-Bibliothek zu groß für Export: 400.0 MB von 2 Dateien — Export übersprungen, betroffen: gross-1.wav, gross-2.wav", passender Konsolenfehler aus `buildAudioExport()`, **keine** Datei erzeugt. Quellenseitig bestätigt: der `throw` steht in `buildAudioExport()`, der Anchor wird erst danach in `downloadAudioExport()` erzeugt und geklickt — auf diesem Pfad *kann* keine Datei entstehen. Die Machbarkeitsprüfung läuft vor dem ersten Kodierschritt (`listSoundBlobs()` → `computeFeasibility()` → `throw`, vor `blobToBase64()`). |
| **(b) Ein echtes Tab bleibt *unterhalb* von 300 MiB gesund** | ✅ **verifiziert am 2026-09-04** (UAT Punkt 28, Nutzer, echter Browser) — Eintrag damit geschlossen | Braucht eine echte Bibliothek von ~4 großen Audiodateien; geprüft wird Speicherdruck im Renderer-Prozess, und genau das ist Annahme A1, die unter Node nicht messbar ist. Kein Konsolen-Trick ersetzt das. Der Nutzer hat sich entschieden, die Dateien heute nicht zusammenzutragen. **Annahme A1 bleibt unverifiziert.** |

**Wie (a) geprüft wurde (wiederholbar).** Die naheliegende Abkürzung „Schwellwert-Konstante in der
Konsole senken" funktioniert **nicht**: `AUDIO_EXPORT_SAFE_RAW_BYTES` ist ein Top-Level-`const`, das
`computeFeasibility()` lexikalisch liest; die exportierte Eigenschaft
`window.AUDIO_EXPORT_SAFE_RAW_BYTES` ist eine separate Kopie. Stattdessen `window.listSoundBlobs`
überschreiben — sowohl `checkAudioExportFeasible()` als auch `buildAudioExport()` holen ihre
Metadaten darüber:

```js
window.listSoundBlobs = async () => ([
  { id: 'audio_1_1', name: 'gross-1.wav', size: 200 * 1024 * 1024, type: 'audio/wav' },
  { id: 'audio_1_2', name: 'gross-2.wav', size: 200 * 1024 * 1024, type: 'audio/wav' }
]);
await window.getAudioExportSummary();   // feasible:false
await window.downloadAudioExport();     // Fehler-Toast, KEINE Datei
```

**(b) bleibt re-runnable.** Vollständige Anleitung inklusive der Rücksetz-Schritte für einen zweiten
Durchgang (`sessionStorage.removeItem('migration-hint-shown')` **und**
`localStorage.removeItem('migration-divergence-since')` — der Hinweis-Banner erscheint sonst nicht
wieder, `migration-wizard.js:765`) steht in `12-07-SUMMARY.md` § „Offene manuelle Prüfung".

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — 16 von 16 Zeilen haben Tests
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — alle drei MISSING-Zeilen geschlossen
- [x] No watch-mode flags
- [x] Feedback latency < 5s — volle Unit-Suite läuft in 1,7 s
- [ ] `nyquist_compliant: true` — **bewusst NICHT gesetzt.** Die Abdeckung ist vollständig, aber
      IMPL-01 und IMPL-02 sind automatisiert verifiziert als *nicht erfüllt*. Sobald beide behoben
      sind, schlagen die beiden `test.failing`-Anker an und dieser Haken kann gesetzt werden.

**Approval:** validiert am 2026-09-04 · Abdeckung vollständig · 2 Anforderungen nachweislich verletzt (IMPL-01, IMPL-02)


---

## Validation Audit 2026-09-04

Ausgelöst durch den `verify:post`-Hook `nyquist` beim Abschluss von `/gsd-verify-work 12`.
Die Karte oben stand seit dem 2026-08-06 unverändert auf `⬜ pending`, obwohl die Phase
inzwischen über 11 Pläne ausgeführt war.

**Methode.** Je Anforderungszeile ein Mapper plus zwei adversariale Refuter mit getrennten
Blickwinkeln (Assert-Lens: *behauptet der Test wirklich das genannte Verhalten?* · Mutations-Lens:
*ginge der Test bei genau dieser Regression rot?*). Die Refuter haben Mutanten nicht im
Arbeitsbaum erzeugt, sondern in-process über einen `jest --setupFiles`-Hook, der `fs.readFileSync`
beim Lesen der Quelldatei patcht — der Baum blieb dabei nachweislich unberührt.

| Metrik | Anzahl |
|--------|--------|
| Zeilen geprüft | 16 |
| Vor dem Nachzug: COVERED | 2 |
| Vor dem Nachzug: PARTIAL | 11 |
| Vor dem Nachzug: MISSING | 3 |
| Lücken geschlossen | 14 |
| Neue Testzeilen | 1.221 über 8 Dateien (1 neu angelegt) |
| Jest-Testfälle | 760 → 842 |
| Mutanten-Behauptungen unabhängig bestätigt | 51 von 53 |
| Eskalierte Implementierungsdefekte | 2 bestätigt, 4 Nebenbefunde |

**Warum die alte Karte trog.** Die Suite war grün, aber grün bedeutete nicht, was es zu bedeuten
schien. Die drei schwerwiegendsten Muster:

1. **Tautologischer Test (R16, `migration-wizard.test.js`).** Die `describe.each()`-Tabellen wurden
   aus den *eigenen Exports der Implementierung* gespeist. Ein Refuter entfernte 13 von 17
   Einträgen aus `CAMPAIGN_CONTENT_ARRAYS` — also fast die ganze Anforderung — und die Suite blieb
   grün, weil die Tests einfach mitverschwanden. Behoben: die Erwartungstabelle ist jetzt ein
   handgeschriebenes Literal im Testfile, plus ein Test, der die vollständige 17er-Liste festnagelt.
2. **Kein Produktivcode ausgeführt (R13/R14, SAFE-06).** Die Tests bildeten die IDB- und
   Quota-Logik lokal nach. Jetzt laufen die **echte** `StorageAPI.set()`, die **echte**
   `saveImmediate()` und die **echte** `load()` durch die vierstellige Fallback-Kette.
3. **Leeres Orakel (R15).** Der „Versions-Rundlauf" mutierte `_appVersion` — ein Feld, das repo-weit
   geschrieben und nirgends gelesen wird. Ersetzt durch Tests auf `migrateData()`, das die
   Kompatibilität tatsächlich herstellt.

### Eskalierte Implementierungsdefekte (NICHT behoben — Auditoren hatten Nur-Test-Mandat)

Beide unabhängig gegen den Quelltext nachgeprüft und als `test.failing` in der Suite verankert:
Der Test meldet heute „bestanden", weil sein Körper wirft; nach einem Fix meldet Jest ihn als
*unerwartet bestanden* und erzwingt das Umstellen auf `test()`. Die Defekte können damit nicht
still wieder in Vergessenheit geraten.

| ID | Ort | Defekt | Verletzt |
|----|-----|--------|----------|
| **IMPL-01** | `systems/migration/migration-wizard.js:511-533` | Der Audio-Benennungsblock steht im **selben `try`** wie `importFn(parsedObj)` (Zeile 485). Wirft `await window.listSoundBlobs()`, sind die Daten bereits geschrieben, der Wizard zeigt aber „Import fehlgeschlagen … Bitte erneut versuchen" und erreicht Schritt 4 nie. Der Quellkommentar behauptet ausdrücklich das Gegenteil („wird durch dieses Ergebnis in keinem Fall beeinflusst"). | **SAFE-01 / D-02** — und dem Phasenziel: der Nutzer hält eine geglückte Einweg-Migration für gescheitert und wird zum Wiederholen eingeladen. |
| **IMPL-02** | `systems/undo.js:69` und `:108` | `undo()` und `redo()` rufen `JSON.stringify(D)` **ohne** `try/catch`. `pushUndo()` lässt bei nicht serialisierbarem `window.D` die destruktive Aktion laut D-06 bewusst weiterlaufen — genau dieser Zustand lässt das nächste Strg+Z mit einem ungefangenen `TypeError: Converting circular structure to JSON` abbrechen, ohne Toast. Isoliert reproduziert: Schritt 1 und 2 verhalten sich wie vorgesehen, Schritt 3 wirft. | **SAFE-05 / R11** — die Hälfte „**und crasht nicht**". |

**Nebenbefunde (kein Test, kein Fix, dokumentiert):**

- `soundboard-player.js:257` — `activateSoundScene` setzt `_activeScene` bedingungslos, auch wenn
  null Tracks dekodiert haben; zusammen mit dem verschluckten Decode-Fehler (`:117-125`) kann die App
  eine „laufende" Szene melden und dabei völlig stumm sein.
- `full-export.js:70` — `_appVersion` wird geschrieben, aber nirgends gelesen; es gibt keine
  stempelgesteuerte Kompatibilitätsverzweigung beim Import.
- `full-export.js:181` — `campaignCount` stammt aus der Eingabe, nicht aus der Zahl erfolgreicher
  Schreibvorgänge; ein übersprungener Restore kann nicht gemeldet werden.
- `file-backup-manager.js:273` — das Entfernen von `snapshots.sort()` lässt die Suite grün, weil
  alle Fixtures bereits sortiert einspeisen. Eigenschaft von `pruneOldSnapshots`, nicht von R06 —
  bewusst außerhalb des Schnitts gelassen.
