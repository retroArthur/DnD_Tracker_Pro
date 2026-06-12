---
phase: 01-stabilisierung
verified: 2026-06-12T12:00:00Z
status: gaps_found
score: 3/5 must-haves verified
overrides_applied: 0
gaps:
    - truth: 'npm run check (ESLint + TypeScript + Prettier) laeuft gruen ohne Fehler; CI-Pipeline ist gruen'
      status: failed
      reason: 'npm run check endet mit Exit-Code 1. ESLint: 1227 Probleme (31 errors, 1196 warnings), ueberschreitet --max-warnings 50. Prettier: 170-171 Dateien nicht formatiert (Exit-Code 1). TypeScript: OK (Exit-Code 0). STAB-04 war lt. Plan 06 SUMMARY bewusst offen gelassen — dies ist aber ein Roadmap-Success-Criterion und bleibt ein echter Gap.'
      artifacts:
          - path: '.github/workflows/ci.yml'
            issue: 'CI-Pipeline hat smoke-test-Job korrekt integriert, aber der lint-and-typecheck-Job laeuft mit denselben ESLint/Prettier-Fehlern — CI ist nicht gruen'
      missing:
          - 'ESLint auto-fix fuer no-case-declarations, no-useless-escape, no-dupe-keys (31 echte Errors)'
          - 'Prettier --write fuer alle 170+ Dateien (Formatierung normalisieren)'
          - "eslint.config.js anpassen: no-undef/no-unused-vars auf 'warn' in Non-ESM Global-Scope statt blocking"
    - truth: 'Nutzer speichert eine Kampagne mit mehr als 5MB Daten, schließt den Browser, oeffnet die App erneut — alle Daten sind vollstaendig vorhanden (kein stiller Datenverlust)'
      status: failed
      reason: 'STAB-05 teilweise behoben: Timestamp-Mechanismus und LS-Schattenentfernung sind korrekt implementiert. Jedoch besteht CR-01 (Code Review): showStorageConflictDialog() referenziert sich in Zeile 32-33 rekursiv (window.showStorageConflictDialog === die Funktion selbst). Bei echtem LS/IDB-Konflikt (lsData !== idbData) entsteht ein RangeError: Maximum call stack size exceeded, der in load() verschluckt wird — stale LS-Daten gewinnen still. Genau das Szenario, das der Fix vermeiden sollte, tritt im Konfliktpfad weiterhin auf.'
      artifacts:
          - path: 'systems/spellslots/quick-roll.js'
            issue: "Zeile 32-33: if (typeof window.showStorageConflictDialog === 'function') { window.showStorageConflictDialog(...) } — Selbstreferenz, Endlosrekursion bei jedem echten Datenverlust-Szenario"
          - path: 'tests/unit/stability.test.js'
            issue: '56 Tests gruen, aber kein Test ruft die echte showStorageConflictDialog-Funktion auf — CR-01 ist unentdeckt geblieben (WR-06)'
      missing:
          - 'showStorageConflictDialog umbenennen (z.B. resolveStorageConflict) und window.showStorageConflictDialogUI als optionalen externen UI-Hook verwenden'
          - 'Oder: Selbst-Delegation entfernen, IDB als Standard-Fallback direkt implementieren (Zeile 36)'
          - 'Echte Regressionstests, die die Funktion via vm-Kontext aufrufen (analog migration.test.js)'
deferred: []
human_verification:
    - test: 'Kampagne >5 MB anlegen, Browser schliessen, app neu oeffnen — Datenvollstaendigkeit pruefen'
      expected: 'Alle Daten sind vorhanden; kein Datenverlust-Toast'
      why_human: 'Erfordert echte localStorage-/IndexedDB-Interaktion mit >5MB-Daten; nicht automatisiert testbar ohne laufenden Browser'
    - test: 'Zwei unterschiedliche Speicherstaende simulieren (LS alt, IDB neu) und App laden'
      expected: 'Konflikt-Dialog erscheint; Nutzer kann zwischen den Staenden waehlen; kein RangeError'
      why_human: 'CR-01 laesst sich nur im Browser mit echtem localStorage/IDB pruefen; Jest-Tests decken die reale Funktion nicht ab'
    - test: 'dist/dnd-tracker-bundled.html per Doppelklick (file://) oeffnen, alle Tabs durchklicken'
      expected: 'Browser-Konsole ist fehlerfrei in allen Tabs'
      why_human: 'Smoke-Test laeuft gegen HTTP-Server, nicht file://; file://-spezifisches Verhalten nur manuell pruefbar'
---

# Phase 01: Stabilisierung — Verifikationsbericht

**Phasenziel:** Die App laeuft zuverlaessig — kein Boot-Crash, keine stillen Datenverluste, CI erkennt kuenftige Brueche, Doku und Build-Pipeline spiegeln den echten Code-Stand

**Verifiziert:** 2026-06-12T12:00:00Z
**Status:** gaps_found
**Re-Verifikation:** Nein — initiale Verifikation

## Ziel-Erreichung

### Beobachtbare Wahrheiten (Success Criteria)

| #   | Wahrheit                                                                               | Status   | Evidenz                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | App laedt per file://-Doppelklick vollstaendig ohne Konsolenfehler in allen Tabs       | ? HUMAN  | Smoke-Test (7/7 gruen) gegen HTTP-Server bestaetigt, file://-Verhalten nur manuell pruefbar                                                                                                                                                      |
| 2   | Kampagne >5MB: nach Browser-Neustart alle Daten vollstaendig vorhanden                 | FAILED   | CR-01: showStorageConflictDialog() rekursiv — RangeError bei echtem Konflikt wird verschluckt, stale LS-Daten gewinnen still                                                                                                                     |
| 3   | Export -> Re-Import: keine Migrationen uebersprungen, alle Felder korrekt              | VERIFIED | exp.\_version = APP_CONFIG.VERSION (nicht '2.11'); Legacy-Normalisierung '2.11'->'2.0.0' vorhanden; Migration 2.6.1 Smart-Strip implementiert; migration.test.js 3/3 gruen                                                                       |
| 4   | npm run check gruen; CI gruen; Playwright-Smoke bestaetigt App-Initialisierung         | FAILED   | npm run check Exit-Code 1 (ESLint: 1227 Probleme > max-warnings 50; Prettier: 170 Dateien). CI smoke-test-Job integriert und Smoke lokal 7/7 gruen. TypeScript OK.                                                                               |
| 5   | Veraltete Dateien entfernt; CLAUDE.md, README, package.json-Lizenz konsistent mit Code | VERIFIED | main.js, tsconfig.json.backup, MIGRATION_REPORT.md, 4 Tools geloescht. CLAUDE.md: Version 2.6.1, korrekter Campaign-Key, keine toten Mindmap-Verweise. LICENSE: Arthur Siemens 2024-2026. README: SRD-Attribution. docs/srd-license.md erstellt. |

**Score: 3/5 Wahrheiten verifiziert** (SC3 + SC5 VERIFIED; SC1 human-needed; SC2 + SC4 FAILED)

---

## Artefakt-Verifikation

### Kernartefakte

| Artefakt                                       | Erwartet                                                                                     | Status   | Details                                                                                                                                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools/debug.js`                               | clearMindmap-Referenz entfernt                                                               | VERIFIED | 0 Treffer fuer clearMindmap/clearAllNodes; window-Exports ebenfalls entfernt                                                                                                                             |
| `playwright.smoke.config.js`                   | Smoke-Config mit SMOKE_BASE_URL + smoke.spec.js                                              | VERIFIED | Datei existiert, testMatch=smoke.spec.js, SMOKE_BASE_URL vorhanden                                                                                                                                       |
| `tests/e2e/smoke.spec.js`                      | Boot-Check + 6-Tab-Sweep (7 Tests)                                                           | VERIFIED | 7/7 Tests lokal gruen (file://-Fallback), pageerror-Listener vorhanden                                                                                                                                   |
| `systems/spellslots/persistence.js`            | \_ts-Mechanismus, StorageAPI.remove, loadFromIndexedDBFallbackRaw                            | VERIFIED | 6 \_ts-Treffer, 6 StorageAPI.remove-Treffer, loadFromIndexedDBFallbackRaw 2x (Definition + Export)                                                                                                       |
| `systems/spellslots/quick-roll.js`             | exp.\_version = APP_CONFIG.VERSION; Timestamp-Vergleich; showStorageConflictDialog           | PARTIAL  | Export-Stempel korrekt (1 Treffer); Legacy-Normalisierung '2.11' vorhanden; showStorageConflictDialog existiert ABER rekursiv (CR-01)                                                                    |
| `tests/unit/stability.test.js`                 | 56 Regressionstests gruen                                                                    | VERIFIED | 56/56 Tests gruen — aber: kein Test deckt die echte showStorageConflictDialog-Ausfuehrung ab (WR-06)                                                                                                     |
| `systems/spellslots/version-migration.js`      | Migration 2.6.1 mit Smart-Strip                                                              | VERIFIED | '2.6.1' vorhanden; delete data.mindmap vorhanden                                                                                                                                                         |
| `systems/spellslots/import-export.js`          | showMindmapExportDialog; mindmap-backup; reader.onload async                                 | VERIFIED | Definition (Zeile 413) + Aufruf (Zeile 483); mindmap-backup (1 Treffer)                                                                                                                                  |
| `systems/campaign-manager/campaign-manager.js` | kein mindmap-Seed                                                                            | VERIFIED | grep -c "mindmap:" == 0                                                                                                                                                                                  |
| `types/globals.d.ts`                           | keine Mindmap-Typen                                                                          | VERIFIED | 0 Mindmap-Treffer                                                                                                                                                                                        |
| `types/entities.d.ts`                          | keine Mindmap-Typen                                                                          | VERIFIED | 0 Mindmap-Treffer                                                                                                                                                                                        |
| `assets/styles-purged.css`                     | geloescht                                                                                    | VERIFIED | Datei nicht vorhanden                                                                                                                                                                                    |
| `tests/setup.js`                               | kein mindmap-Seed                                                                            | VERIFIED | 0 mindmap-Treffer                                                                                                                                                                                        |
| `build.py`                                     | MODULES modul-level; check_duplicate_functions; check_module_list_sync; DEBUG_MODE-Assertion | VERIFIED | ^MODULES = \[ (1 Treffer); check_duplicate_functions (2); check_module_list_sync (2); ABORTED (2)                                                                                                        |
| `tests/build/test_build_deduplication.py`      | 4 neue STAB-07-Tests                                                                         | VERIFIED | test_production_build_has_debug_mode_false, test_module_lists_are_synchronized, test_duplicate_function_check_detects_duplicate, test_no_orphaned_return_statements (alle vorhanden, 10/10 pytest gruen) |
| `.github/workflows/ci.yml`                     | smoke-test-Job mit HTTP-Server + download-artifact                                           | VERIFIED | smoke-test: (1); SMOKE_BASE_URL (1); playwright.smoke.config.js (1); http.server 8000 (1)                                                                                                                |
| `package.json`                                 | license MIT; version 2.6.1; kein python3                                                     | VERIFIED | MIT-Lizenz, 2.6.1, kein python3                                                                                                                                                                          |
| `core/config.js`                               | VERSION: '2.6.1'                                                                             | VERIFIED | 1 Treffer                                                                                                                                                                                                |
| `validate.py`                                  | Path(**file**).parent; kein Linux-Hardcode                                                   | VERIFIED | Zeile 11: SOURCE_DIR = str(Path(**file**).parent); 0 /mnt/user-data-Treffer                                                                                                                              |
| `CLAUDE.md`                                    | 2.6.1; kein dnd-campaign-index; keine features/network/mindmap.js; kein "146 remain"         | VERIFIED | alle Greps bestaetigt (0, 0, 0, 1 fuer dnd-tracker-campaigns)                                                                                                                                            |
| `docs/bugfixes.md`                             | 0 features/shops/spell-editor.js-Verweise                                                    | VERIFIED | 0 Treffer                                                                                                                                                                                                |
| `docs/srd-license.md`                          | SRD-Audit mit CC-BY-4.0 und Risikobewertung                                                  | VERIFIED | Datei existiert; 11 SRD-Treffer; 10 CC-BY-Treffer; 4 Risiko-Treffer                                                                                                                                      |
| `LICENSE`                                      | Arthur Siemens als Copyright-Inhaber                                                         | VERIFIED | "Arthur Siemens" vorhanden; 0 "Dein Name"-Treffer                                                                                                                                                        |
| Geloeschte Altdateien                          | main.js, tsconfig.json.backup, MIGRATION_REPORT.md, 4 Tools                                  | VERIFIED | alle 7 Dateien nicht mehr vorhanden                                                                                                                                                                      |

### Key-Link-Verifikation

| Von                                     | Zu                                          | Via                                                     | Status   | Details                                                                                                 |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| tests/e2e/smoke.spec.js                 | dist/dnd-tracker-bundled.html               | page.goto + waitForSelector('.app-title')               | VERIFIED | pattern page.goto vorhanden; 7/7 Tests gruen                                                            |
| playwright.smoke.config.js              | tests/e2e/smoke.spec.js                     | testMatch: 'smoke.spec.js'                              | VERIFIED | smoke.spec.js im testMatch                                                                              |
| quick-roll.js load()                    | persistence.js loadFromIndexedDBFallbackRaw | window.loadFromIndexedDBFallbackRaw                     | VERIFIED | 1 Treffer in quick-roll.js; window-Export in persistence.js                                             |
| persistence.js saveImmediate() IDB-only | localStorage Schatten-Key                   | StorageAPI.remove(key)                                  | VERIFIED | 6 StorageAPI.remove-Treffer (key + key+'\_ts')                                                          |
| quick-roll.js exportAllDataAsFile()     | APP_CONFIG.VERSION                          | exp.\_version = APP_CONFIG.VERSION                      | VERIFIED | 1 Treffer                                                                                               |
| quick-roll.js showStorageConflictDialog | Konflikts-Aufloesung                        | Funktion selbst (NICHT externer UI-Dialog)              | FAILED   | CR-01: window.showStorageConflictDialog referenziert die Funktion selbst — Endlosrekursion bei Konflikt |
| .github/workflows/ci.yml smoke-test     | tests/e2e/smoke.spec.js                     | npx playwright test --config=playwright.smoke.config.js | VERIFIED | Pattern vorhanden; needs: [build] + download-artifact                                                   |

---

## Anforderungsabdeckung

| Anforderung | Plan         | Beschreibung                                            | Status    | Evidenz                                                                                                                                                                                                                                                |
| ----------- | ------------ | ------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| STAB-01     | 01-01        | Boot-Crash clearMindmap behoben                         | SATISFIED | 0 clearMindmap-Treffer in debug.js; Smoke 7/7 gruen                                                                                                                                                                                                    |
| STAB-02     | 01-03        | Mindmap-Reste bereinigt                                 | SATISFIED | Migration 2.6.1; Seeds entfernt; Typen entfernt; styles-purged.css geloescht; test-Seeds bereinigt                                                                                                                                                     |
| STAB-03     | 01-06        | Frische Builds fehlerfrei                               | SATISFIED | python build.py Exit-Code 0 (2,028,513 Zeichen); python build.py --production Exit-Code 0 (1,725,306 Zeichen); Smoke-Test 7/7 gruen bestaetigt Konsolen-Fehlerfreiheit                                                                                 |
| STAB-04     | 01-06        | npm run check gruen (ESLint + TS + Prettier)            | BLOCKED   | npm run check Exit-Code 1. ESLint: 1227 Probleme (31 errors ueberschreiten --max-warnings 50). Prettier: 170+ Dateien nicht formatiert. TypeScript: OK.                                                                                                |
| STAB-05     | 01-02        | >5MB-Kampagnen verlieren keine Daten                    | BLOCKED   | Timestamp-Mechanismus korrekt implementiert; ABER CR-01 macht den Konfliktpfad funktionslos (Endlosrekursion). Ohne expliziten Konflikt funktioniert der Fix — bei einem real stale LS-Stand (kein \_ts) und abweichendem IDB-Stand tritt der Bug auf. |
| STAB-06     | 01-02, 01-05 | Export-Stempel APP_CONFIG.VERSION; Migration korrekt    | SATISFIED | exp.\_version = APP_CONFIG.VERSION (1 Treffer); Legacy-Normalisierung '2.11'->'2.0.0'; Migration 2.6.1 aktiv                                                                                                                                           |
| STAB-07     | 01-04        | build.py gehaertet (Pass-3-Fix, DEBUG_MODE, Modul-Sync) | SATISFIED | Pre-Build-Duplikat-Check; Modul-Sync-Check; DEBUG_MODE-Assertion; 10/10 pytest gruen. Hinweis: Pass-3-Body-Problem (WR-02) strukturell noch latent, aber Pre-Build-Check verhindert Duplikate vor Pass 3                                               |
| STAB-08     | 01-01, 01-06 | CI erkennt Boot-Crashes via Smoke-Test                  | SATISFIED | smoke-test-Job in ci.yml; lokaler Smoke 7/7 gruen; needs: [build] + download-artifact korrekt                                                                                                                                                          |
| STAB-09     | 01-05        | Tote Dateien entfernt; python statt python3             | SATISFIED | 7 Dateien geloescht; package.json: kein python3; validate.py: Path(**file**).parent; Hinweis: validate.py schlaegt bei Emoji-Ausgabe mit UnicodeEncodeError auf Windows (cp1252) fehl — kein Pfad-Absturz aber kein sauberer Exit                      |
| STAB-10     | 01-07        | CLAUDE.md, README, bugfixes.md faktenkonsistent         | SATISFIED | CLAUDE.md: 2.6.1, korrekter Key, keine toten Verweise; bugfixes.md: 0 spell-editor.js-Treffer; LICENSE: Arthur Siemens 2024-2026                                                                                                                       |
| STAB-11     | 01-07        | SRD-Herkunft dokumentiert, Attribution ergaenzt         | SATISFIED | docs/srd-license.md existiert mit CC-BY-4.0-Audit; README: SRD-Attribution; LICENSE: SRD-Hinweis                                                                                                                                                       |

---

## Anti-Pattern-Scan

| Datei                             | Zeile | Muster                                                                      | Schwere | Auswirkung                                                                                                                                                                                       |
| --------------------------------- | ----- | --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| systems/spellslots/quick-roll.js  | 32-33 | Selbstreferenz: window.showStorageConflictDialog === eigene Funktion        | Blocker | Bei echtem LS/IDB-Konflikt: RangeError (Endlosrekursion), verschluckt, stale LS gewinnt still — genau das STAB-05-Szenario                                                                       |
| systems/spellslots/quick-roll.js  | 39    | window.showStorageConflictDialogInternal — ungenutzter window-Export        | Warnung | Export-Audit-Verletzung (CLAUDE.md); entfaellt mit CR-01-Fix                                                                                                                                     |
| systems/spellslots/persistence.js | 41    | const STORAGE_KEY = window.STORAGE_KEY — window.STORAGE_KEY existiert nicht | Warnung | Im Bundle: vom Dedup-Pass 2 entfernt (413 Entfernungen). Im Loader-Modus: STORAGE_KEY === undefined, persistiert unter Key "undefined". Betrifft auch quick-roll.js:41, import-export.js (WR-01) |
| tools/debug.js                    | 820   | mindmap: { nodes: [], connections: [] } im Reset-Template                   | Warnung | Inkonsistent mit STAB-02 (Mindmap entfernt); Plan 03 hat debug.js nur die window-Exports entfernt, nicht dieses Template (WR-04)                                                                 |

---

## Verhaltens-Stichproben (Spot-Checks)

| Verhalten                       | Kommando                                                | Ergebnis                                            | Status |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------- | ------ |
| App bootet ohne Boot-Crash      | npx playwright test --config=playwright.smoke.config.js | 7/7 gruen (4.5s)                                    | PASS   |
| Production-Build erzeugt        | python build.py --production                            | Exit 0, 1,725,306 Zeichen                           | PASS   |
| DEBUG_MODE: false in prod-Build | node-Check gegen dist/dnd-tracker-optimized.html        | false bestaetigt                                    | PASS   |
| Unit-Tests 56/56 gruen          | npx jest tests/unit/stability.test.js --no-coverage     | 56 passed                                           | PASS   |
| Migration-Tests 3/3 gruen       | npx jest tests/unit/migration.test.js --no-coverage     | 3 passed                                            | PASS   |
| pytest Build-Tests 10/10 gruen  | python -m pytest tests/build/ -v                        | 10 passed                                           | PASS   |
| ESLint + Prettier + TypeScript  | npm run check                                           | Exit 1 (1227 ESLint-Probleme; 170 Prettier-Dateien) | FAIL   |

---

## Menschliche Verifikation erforderlich

### 1. file://-Boot-Test

**Test:** dist/dnd-tracker-bundled.html (oder -optimized.html) per Doppelklick oeffnen, DevTools -> Console pruefen, alle 9 Haupt-Tabs durchklicken.
**Erwartet:** Keine roten Fehler in der Konsole; alle Tabs laden vollstaendig.
**Warum Mensch:** Smoke-Test laeuft gegen HTTP-Server (file://-localStorage-Einschraenkung in Playwright); file://-spezifisches Verhalten kann nur manuell geprueft werden (VALIDATION.md Anforderung).

### 2. >5MB-Datenverlust-Szenario (STAB-05 Kerntest)

**Test:** Kampagne mit sehr vielen Eintraegen anlegen (>5MB Gesamtgroesse), App schliessen, neu oeffnen.
**Erwartet:** Alle Daten vorhanden; KEIN Dialog; kein Datenverlust.
**Warum Mensch:** Erfordert echte Browser-localStorage + IndexedDB-Interaktion mit grossen Datenmengen; CR-01 betrifft nur den Konfliktpfad (LS ohne \_ts + abweichender IDB-Stand) — dieser Pfad kann nur im echten Browser getestet werden. Wichtig: CR-01 tritt NUR auf, wenn ein aelterer LS-Schatten OHNE \_ts-Key existiert (d.h. bei Kampagnen, die vor dem Fix gespeichert wurden und seither ueber 5MB gewachsen sind).

### 3. CR-01-Verifikation: Konflikt-Dialog-Pfad

**Test:** Manuell in DevTools localStorage-Key ohne \_ts setzen (anderer Inhalt als IDB); App neu laden.
**Erwartet:** Konflikt-Dialog erscheint, kein RangeError in der Konsole.
**Warum Mensch:** CR-01 ist ein Code-Level-Bug (bewiesen durch Lesen des Quellcodes); das Verhalten im Browser wird durch den fehlenden Unit-Test nicht abgedeckt.

---

## Gaps-Zusammenfassung

Zwei echte Gaps blockieren das Phasenziel:

**Gap 1 — CR-01: showStorageConflictDialog Endlosrekursion (betrifft STAB-05/SC2)**
Die Funktion `showStorageConflictDialog` in `systems/spellslots/quick-roll.js` (Zeile 32-33) delegiert an `window.showStorageConflictDialog`, was die Funktion selbst ist (es gibt keine andere Definition im Repo). Das Ergebnis: Bei jedem echten LS/IDB-Datenverlust-Konflikt wird ein `RangeError: Maximum call stack size exceeded` geworfen, der in `load()` verschluckt wird — stale localStorage-Daten gewinnen still. Dies ist exakt das STAB-05-Szenario (Spieler verliert Daten am Spieltisch). Der Code-Review (CR-01) hat dies korrekt identifiziert. Da kein Unit-Test die echte Funktion aufruft (WR-06), blieb der Bug bisher unentdeckt und die Tests sind trotzdem gruen.

**Gap 2 — STAB-04: npm run check schlaegt fehl (betrifft SC4)**
`npm run check` endet mit Exit-Code 1: ESLint meldet 1227 Probleme (31 echte Errors + 1196 Warnings ueberschreiten --max-warnings 50), Prettier findet 170 unformatierte Dateien. TypeScript ist sauber. Dies war laut Plan 06 SUMMARY bewusst dokumentiert und fuer einen Gap-Closure-Plan vorgesehen, ist aber ein Roadmap-Success-Criterion (SC4) und daher ein echter Gap.

Diese beiden Gaps verhindern, dass die Phase ihr Gesamtziel vollstaendig erreicht. SC1 (file://-Boot) und SC2 (5MB-Datenverlust) benoetigen nach CR-01-Fix eine menschliche Verifikation. SC3, SC5 sind vollstaendig verifiziert.

---

_Verifiziert: 2026-06-12T12:00:00Z_
_Verifizierer: Claude (gsd-verifier)_
