---
phase: 12-datensicherheit
plan: 04
subsystem: migration
tags: [migration-wizard, data-safety, async, D-07, DEBT-17-shape]
dependency-graph:
  requires: ["12-02: readCampaignDataForBackup() Quellenkette (file-backup-manager.js)"]
  provides: ["isFreshInstall() async, delegiert an readCampaignDataForBackup()"]
  affects: ["systems/migration/migration-wizard.js: initMigrationWizardIfNeeded(), _processWizardFile()"]
tech-stack:
  added: []
  patterns: ["window.*-Laufzeitbindung statt const-Import (Dedup-Regel)", "vm.createContext()-Testmuster fuer non-ESM-Module"]
key-files:
  created:
    - tests/unit/migration-wizard.test.js
  modified:
    - systems/migration/migration-wizard.js
decisions:
  - "isFreshInstall() und initMigrationWizardIfNeeded() in einem gemeinsamen Commit statt zwei Task-Commits — ein Zwischenzustand mit asynchronem isFreshInstall() aber synchronen Aufrufern waere ein stiller Wahrheitswert-Bug (Promise als truthy), also kein sinnvoller Zwischen-Checkpoint"
metrics:
  duration: ~25min
  completed: 2026-08-18
status: complete
actuals:
  tokens: 9000
  tasks: 2
  commits: 1
---

# Phase 12 Plan 04: isFreshInstall() konsultiert dieselbe Quellenkette wie readCampaignDataForBackup() Summary

`isFreshInstall()` ist jetzt eine `async`-Funktion, die dieselbe Quellenkette wie
`readCampaignDataForBackup()` (localStorage unter dem aktiven Key → IndexedDB → laufendes
`D`) abfragt, statt nur `APP_CONFIG.STORAGE_KEY` zu prüfen — D-07 geschlossen, beide Aufrufer
auf `await` umgestellt.

## Was gebaut wurde

**`isFreshInstall()` (Zeilen 31-59):**
- Schlüssel: `window.STORAGE_KEY_OVERRIDE || APP_CONFIG.STORAGE_KEY` statt hartkodiert
  `APP_CONFIG.STORAGE_KEY`.
- Daten über `window.readCampaignDataForBackup(key)`, falls verfügbar (`typeof`-Guard);
  sonst Rückfallebene `StorageAPI.getJSON(key, null)`.
- Direkter `window.readCampaignDataForBackup(...)`-Aufruf, KEIN
  `const readCampaignDataForBackup = window....` (CLAUDE.md-Dedup-Regel — der Aufruf ist
  laufzeitgebunden, weil `isFreshInstall()` erst zur Init-Zeit läuft, wenn alle Module
  geladen sind).
- Inhaltsprüfung `(characters + npcs + quests) === 0` unverändert erhalten — sonst würde
  jede Installation als „nicht frisch" gelten, weil `readCampaignDataForBackup()` als dritte
  Stufe auf das befüllte `window.D` zurückfällt.
- `null`/`undefined` → `true`.

**Beide Aufrufer auf `await` umgestellt:**
- `initMigrationWizardIfNeeded()` (Zeile 780) ist jetzt `async`; Aufruf in Zeile 802:
  `if (!(await isFreshInstall())) return;`. `core/init.js:149` ruft die Funktion weiterhin
  defensiv per `typeof`-Guard ohne Ergebnisauswertung auf — keine Änderung nötig,
  verifiziert.
- `_processWizardFile()`s `reader.onload`-Handler war bereits `async`; Zeile 354:
  `const hasExistingData = !(await isFreshInstall()) || indexCampaigns.length > 0;`, der
  `await` liegt innerhalb des bestehenden `try/catch`. Reihenfolge unverändert:
  `_exportType`-Prüfung → Bestandsschutz-`confirm()` → `saveUndoState('Migration importiert')`
  → `importFullExport()`.

**Re-Grep vor der Änderung** (Plan verlangte das explizit, da im Verlauf der Phase schon
einmal eine Zählung falsch war): `grep -rn "isFreshInstall" --include=*.js .` fand genau die
erwartete Definition (Zeile 31), zwei Aufrufer (damals Zeilen 331/775) und den Export
(Zeile 829) — keine übersehene Stelle.

**Neue Testdatei `tests/unit/migration-wizard.test.js`** (11 Tests, `vm.createContext()`-Muster
analog `audio-export.test.js`):
- 5 Tests für `isFreshInstall()`: leerer Speicher → `true`; `STORAGE_KEY_OVERRIDE` mit
  Charakteren → `false`; IDB-simulierter Stub → `false`; inhaltsleere Kampagne → `true`;
  fehlender `readCampaignDataForBackup`-Helfer → echtes Boolean (nicht `undefined`) in
  beiden Richtungen.
- 1 Quelltext-Beleg-Test: jede Verwendungsstelle von `isFreshInstall(` außerhalb Definition
  und `window.`-Export trägt ein `await` — der einzige Test, der die
  Promise-Wahrheitswert-Falle strukturell fangen kann.
- 3 Tests für `initMigrationWizardIfNeeded()`: vorhandene Daten → kein `setTimeout`;
  frischer Speicher + noch nicht gezeigt → `setTimeout(showMigrationWizard, 500)`; bereits
  gezeigt → gar kein Wizard-Pfad.
- 2 Verhaltenstests für `_processWizardFile()`: Abbruch am Bestandsschutz-`confirm()`
  blockiert Import vollständig (kein `saveUndoState`, kein `importFullExport`); Bestätigung
  hält die Reihenfolge `saveUndoState` VOR `importFullExport` ein (über eine geteilte
  `callOrder`-Liste in den Mocks nachgewiesen, nicht nur über Quelltext-Reihenfolge).

## Abweichungen vom Plan

Keine inhaltlichen Abweichungen. Eine strukturelle Anpassung des Commit-Zuschnitts:

**Ein gemeinsamer Commit statt zwei Task-Commits.** Der Plan sieht Task 1
(`isFreshInstall()` async) und Task 2 (Aufrufer auf `await`) als separate TDD-Zyklen vor.
Ein Zwischen-Commit nach Task 1 allein hätte einen Zustand erzeugt, in dem `isFreshInstall()`
bereits ein `Promise` zurückgibt, aber beide Aufrufer es noch synchron als Wahrheitswert
auswerten würden (`if (!isFreshInstall())` — ein Promise-Objekt ist immer truthy, die
Bedingung kehrt sich also still um, exakt der Fehler, den T-12-13 verhindern soll). Dieser
Zwischenzustand wäre kein sinnvoller, eigenständig lauffähiger Checkpoint gewesen, deshalb
beide Tasks in einem Commit (`e2dea5e`). Kein Rule-4-Fall (keine architektonische Änderung),
reine Commit-Granularitätsentscheidung — dokumentiert statt stillschweigend abgewichen.

## Bekannte Stubs

Keine.

## Threat Flags

Keine neue, nicht im `<threat_model>` erfasste sicherheitsrelevante Fläche gefunden. Die
drei im Plan benannten Threats (T-12-12, T-12-13, T-12-14) sind über die oben beschriebenen
Änderungen und Tests mitigiert.

## Verifikation

- `npx jest tests/unit/migration-wizard.test.js` — 11/11 grün
- `node --check systems/migration/migration-wizard.js` — fehlerfrei
- `grep -rn "isFreshInstall" --include=*.js .` — außer Definition und Export nur
  `await`-Verwendungen (verifiziert vor UND nach der Änderung)
- Volle Jest-Suite: **682/682 grün** (Baseline 671 + 11 neue Tests — keine Regression)
- `pytest tests/build`: **24/24 grün** (Baseline unverändert, kein Build-System-Eingriff)
- `PYTHONIOENCODING=utf-8 python build.py`: erfolgreich, 124/124 Module, alle
  Build-Integritätsprüfungen bestanden
- Playwright E2E nicht erneut ausgeführt — dieser Plan ändert keinen vom Frontend
  ausgelösten UI-Pfad (der Wizard selbst wurde nicht verändert, nur seine
  Anzeige-Entscheidung), Baseline aus 12-02/12-03 bleibt maßgeblich. Falls am
  Spieltisch getestet werden soll: Override-Fall (`window.STORAGE_KEY_OVERRIDE` in der
  Konsole setzen, dann Seite neu laden) und IDB-Fall (Kampagne über 5 MB anlegen, dann
  Reload) sind nur im echten Browser beobachtbar — unittest-technisch bereits über die
  Stub-Delegation an `readCampaignDataForBackup()` abgedeckt, aber ein echter End-to-End-Lauf
  wurde in diesem Plan nicht durchgeführt.

## Self-Check

- `systems/migration/migration-wizard.js` — FOUND
- `tests/unit/migration-wizard.test.js` — FOUND
- Commit `e2dea5e` — FOUND (`git log --oneline --all | grep e2dea5e`)

## Self-Check: PASSED
