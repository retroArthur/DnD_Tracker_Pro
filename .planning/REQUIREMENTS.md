# Requirements: D&D Kampagnen-Tracker Pro — v1.1 Tech-Debt & Härtung

**Defined:** 2026-07-22
**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

**Milestone-Leitplanke:** Verhaltensneutral — kein Feature ändert sich aus Nutzersicht. „Done" heißt: gleiche UI, gleiches Verhalten, aber schuldenfreie, dauerhaft wartbare Basis.

## v1.1 Requirements

### Editor (execCommand-Ablösung)

- [x] **EDIT-01**: Alle 21 `document.execCommand`-Aufrufe in `ui/editors/rich-text.js` sind durch moderne Selection/Range-DOM-APIs ersetzt — verhaltensgleich für Bold/Italic/Underline/Strikethrough, Listen, Links, Tabellen, Border, Read-Aloud-Stile, Fonts/Größen und Highlight-Farben
- [x] **EDIT-02**: Alle Editor-Toolbars (3-Tier-System, statisch + floating) und Markdown-Shortcuts funktionieren nach der Ablösung unverändert in allen Entity-Editoren (Wiki, NPCs, Orte, Quests, Sessions, Quick-Ref …)
- [x] **EDIT-03**: Editor-Regressionsnetz existiert: E2E-Tests decken die Kern-Formatierungen ab (vorher ungetesteter Bereich), damit die Ablösung beweisbar verhaltensgleich ist

### Tests (Suite grün + gehärtet)

- [x] **TEST-01**: Die 11 vorbestehenden E2E-Fails sind auf 0 — tab-navigation (7: Registry-Re-Render mit injizierten Daten), crud-Modifier-Berechnung (2), Quest-Titel-Validierung (1), Global-Search-Ergebnisse (1); Ursache je Fall geklärt (Test-Bug vs. App-Bug)
- [x] **TEST-02**: Brüchige Test-Muster gehärtet: exakte Zähl-Assertions (`toBe(N)` statt `toBeGreaterThan(0)`), keine maskierenden manuellen Event-Dispatches, `npx playwright test` läuft vollständig grün als CI-tauglicher Gate

### Security (Altlasten schließen)

- [x] **SEC-01**: Der vorbestehende Import-XSS (Critical aus 01-REVIEW.md) ist behoben, mit Regressionstest (bösartige Import-Datei wird sanitisiert, kein Script-Execute)
- [x] **SEC-02**: Security-Audit nachgezogen: SECURITY.md mit `threats_open: 0` für die kritischen Angriffsflächen (Import/Export, Storage/IDB, Datei-Backup, Rich-Text/innerHTML) — via `/gsd-secure-phase` über die relevanten Phasen

### Architektur (Build-/Repo-Hygiene)

- [x] **ARCH-01**: Modullisten-Drift ist strukturell unmöglich: loader.js↔build.py haben eine Single Source of Truth ODER einen harten Gate (Build bricht bei Drift ab — nicht nur Warnung), abgesichert durch Tests
- [x] **ARCH-02**: build.py-Dedup Pass 3 ist gehärtet: verwaiste Funktionskörper können nicht mehr still im Bundle landen (Fehler statt kaputtem Build), mit Testabdeckung im bestehenden TDD-Suite-Muster (tests/build/)
- [x] **ARCH-03**: CI-/Konsolen-Hygiene: GitHub-Actions auf Node-24-kompatible Versionen gehoben (Deprecation-Warnungen weg), favicon-404 und `apple-mobile-web-app-capable`-Deprecation im Bundle behoben
- [ ] **ARCH-04**: Codebase-Map aufgefrischt (`.planning/codebase/` via `/gsd-map-codebase`, Stand nach Phasen 3–7) und CONCERNS.md-Restposten trianguliert: jeder Eintrag ist erledigt, obsolet-markiert oder als Requirement übernommen

## v2 Requirements

Deferred — nicht in diesem Milestone.

### Features

- **SOUND-PT-01**: Soundboard Per-Track-Play (▶/⏹ je Track, Layering — Design aus v1.0-Session liegt bereit)

### Technische Schulden (aus Phase-11-Triage)

Diese Posten wurden in Phase 11 (Plan 11-06, ARCH-04) trianguliert und bewusst NICHT gefixt — die
Milestone-Leitplanke v1.1 bleibt verhaltensneutral (D-16). Jeder Eintrag verweist auf seinen
Ursprung und die Live-Code-Belege in `.planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md`.

- **DEBT-01**: Schwache Lint-/Typecheck-/Coverage-Gates — `no-undef` als Warning statt Error (`eslint.config.js:102`), `tsconfig.json:11,21` mit `strict: false`/`checkJs: false`, Jest-`coverageThreshold` nur für `utils/testable-utils.js` (`jest.config.cjs:65-72`) — Ursprung: CONCERNS.md §Tech Debt/§Fragile Areas/§Test Coverage Gaps, triagiert in 11-CONCERNS-TRIAGE.md (Einträge 4, 29, 43)
- **DEBT-02**: `CLAUDE.md`/`docs/bugfixes.md` dokumentieren noch das entfernte Drei-Pass-Dedup-System und das inzwischen strukturell unmögliche Modullisten-Sync-Erfordernis — wird planmäßig in Plan 11-07 (D-08) dieser Phase behoben — Ursprung: CONCERNS.md §Tech Debt, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 6)
- **DEBT-03**: 3 verbleibende `document.execCommand`-Aufrufe außerhalb des Editor-Moduls (`systems/entity-links.js:87`, `features/wiki/wiki.js:831`, `ui/actions/system-actions.js:82`) — Ursprung: CONCERNS.md §Tech Debt/§Dependencies at Risk, triagiert in 11-CONCERNS-TRIAGE.md (Einträge 8, 36)
- **DEBT-04**: Oversized modules (`features/dmscreen/dmscreen-render.js` 1576, `ui/editors/rich-text.js` 1932, `features/initiative.js` 1655, `features/wiki/wiki.js` 1217, `features/encounter-calculator.js` 1292, `features/shops/shops-core.js` 1073 Zeilen) — Ursprung: CONCERNS.md §Tech Debt, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 12)
- **DEBT-05**: Undo/redo-Stack-Asymmetrie bei Parse-Fehler — `redoStack`/`undoStack` werden vor der `safeJSONParse`-Prüfung mutiert (`systems/undo.js`, `undo()`/`redo()`) — Ursprung: CONCERNS.md §Known Bugs, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 18)
- **DEBT-06**: Undo-Snapshot-Performance — voller `JSON.stringify(window.D)` vor jeder destruktiven Operation (`systems/undo.js:9-20`, `UNDO_LIMIT` 30) — Ursprung: CONCERNS.md §Performance Bottlenecks/§Scaling Limits, triagiert in 11-CONCERNS-TRIAGE.md (Einträge 23, 34)
- **DEBT-07**: Jeder Save serialisiert die volle Kampagne (`systems/spellslots/persistence.js`, `JSON.stringify(D)` + Blob-Messung bei jedem `save()`/`saveImmediate()`) — Ursprung: CONCERNS.md §Performance Bottlenecks, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 24)
- **DEBT-08**: `saveImmediate()` kann durch ein optionales, aktuell nicht im UI vorhandenes `autosave-toggle`-Element ohne Ausnahme für kritische Saves deaktiviert werden (`systems/spellslots/persistence.js:38-39`) — Ursprung: CONCERNS.md §Fragile Areas, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 28)
- **DEBT-09**: Tab-Registry-Renderfunktionen per String-Name referenziert (`systems/tab-registry.js`) — bricht bei Umbenennung nur mit `DEBUG_MODE`-Warnung — Ursprung: CONCERNS.md §Fragile Areas, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 30)
- **DEBT-10**: Ungeschütztes `setInterval` in `initPerformanceMonitoring()` (`systems/backups.js:325`), kein Guard wie bei `startAutoBackup()` — Ursprung: CONCERNS.md §Fragile Areas, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 31)
- **DEBT-11**: Persistence-Edge-Cases ungetestet (>5MB-IDB-only-Save+Reload, localStorage-Quota-Fallback, Export/Import-Versions-Rundlauf) — Ursprung: CONCERNS.md §Test Coverage Gaps, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 44)
- **DEBT-12**: `hasHtmlTags`-Wächter in `ui/editors/markdown-converter.js:264` nie verdrahtet — Markdown-Konvertierung läuft unbedingt über bereits-HTML, URLs mit ≥2 Unterstrichen werden korrumpiert (Anzeigebug, gespeicherte Daten unberührt) — Ursprung: STATE.md „Open TODOs" (Phase 10 IN-01), triagiert in 11-CONCERNS-TRIAGE.md (Ergänzung S1)
- **DEBT-13**: Doppeltes `data-id`-Attribut in `features/wiki/wiki.js:391-392` (Parser verwirft das zweite, folgenlos) — Ursprung: STATE.md „Open TODOs" (Phase 10 WR-02), triagiert in 11-CONCERNS-TRIAGE.md (Ergänzung S2)
- **DEBT-14**: Un-escapte Regex-Capture in `parseWikiLinks()` (`features/wiki/wiki.js:653`) — aktuell nicht ausnutzbar — Ursprung: STATE.md „Open TODOs" (Phase 10 IN-02), triagiert in 11-CONCERNS-TRIAGE.md (Ergänzung S3)
- **DEBT-15**: Latente Toast-Race in `tests/e2e/crud/locations.spec.js` und `encounters.spec.js` — fehlender Seed-Nachzug aus Plan 08-02 — Ursprung: STATE.md „Open TODOs", triagiert in 11-CONCERNS-TRIAGE.md (Ergänzung S4)
- **DEBT-16**: Totgelegter `mindmap`-Schreib-Seed an zwei Stellen — `systems/backups.js:232` (`mindmap: { nodes: [], edges: [] }` im `defaultD`-Literal, per `sanitizeBackupData()` bei jedem Restore neu injiziert, `edges` statt des überall sonst verwendeten `connections`) und `tools/debug.js:917` (`mindmap: { nodes: [], connections: [] }` in `completeReset()`, im Bundle via `loader.js:162`) — das Mindmap-Feature selbst ist entfernt, nur diese zwei Seeds schreiben den toten Key noch neu — Ursprung: CONCERNS.md §Tech Debt, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag 5, Beleg-Korrektur 2026-07-26)

### Technische Schulden (aus dem Codebase-Map-Refresh, Plan 11-07)

Gefunden beim Abgleich der am 2026-07-26 regenerierten `.planning/codebase/CONCERNS.md` gegen die
Phase-11-Triage (Plan 11-07 Task 3). Dispositioniert und belegt in
`.planning/phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md` §„Nach dem Map-Refresh
hinzugekommen".

- **DEBT-17**: Datei-Backup schreibt eine leere Kampagne, sobald der IndexedDB-Modus (>5 MB) greift — `systems/spellslots/persistence.js:64-68` loescht den localStorage-Schatten nach dem IDB-Write, `systems/file-backup/file-backup-manager.js:261-264` liest aber ausschliesslich aus localStorage (`{}` im Fallback); `pruneOldSnapshots()` loescht danach den aeltesten echten Snapshot. Kumulativer, stiller Totalverlust bei grossen Kampagnen — Ursprung: CONCERNS.md (2026-07-26) §Datenintegrität & Persistenz, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N1)
- **DEBT-18**: Umzugs-Export (`file://`→PWA) enthält keine IndexedDB-Inhalte — `systems/migration/full-export.js:9-18` (`FULL_EXPORT_SCHEMA`) deckt weder den Soundboard-Audio-Store (`features/soundboard/soundboard-idb.js:64-69`) noch die Würfelstatistik (`features/dice-stats/dice-stats-idb.js:20-22`) ab; irreversibler Verlust nach dem einmaligen, angeleiteten Umzug — Ursprung: CONCERNS.md §Datenintegrität & Persistenz, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N2)
- **DEBT-19**: `removeAudioFile()` im Soundboard (`features/soundboard/soundboard-crud.js:69-101`) löscht Blob und Szenen-Referenz ohne `saveUndoState`/`pushUndo` — Bruch der projektweiten Undo-Garantie — Ursprung: CONCERNS.md §Datenintegrität & Persistenz, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N3)
- **DEBT-20**: `isFreshInstall()` (`systems/migration/migration-wizard.js:31-36`) prüft nur `APP_CONFIG.STORAGE_KEY`, ignoriert `window.STORAGE_KEY_OVERRIDE` und den IDB-only-Löschpfad — kann den Umzugs-Wizard faelschlich fuer Nutzer mit vollen Daten anbieten — Ursprung: CONCERNS.md §Datenintegrität & Persistenz, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N4)
- **DEBT-21**: Datei-Backup sichert nur die aktive Kampagne (`file-backup-manager.js:255-266`) — der begleitende Kommentar „(D-13: je Kampagne einzeln)" behauptet das Gegenteil, falsches Sicherheitsversprechen für Nutzer mit mehreren Kampagnen — Ursprung: CONCERNS.md §Datenintegrität & Persistenz, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N5)
- **DEBT-22**: Backup-Dateinamen können zwischen Kampagnen kollidieren — `getBackupFilenames()` (`file-backup-manager.js:46-64`) normalisiert unterschiedliche Kampagnennamen (z. B. Sonderzeichen, nicht-lateinische Namen) auf denselben `safeName`, stilles gegenseitiges Überschreiben inkl. Snapshot-Pruning — Ursprung: CONCERNS.md §Datenintegrität & Persistenz, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N6)
- **DEBT-23**: Generische `call`-Aktion (`ui/actions/ui-actions.js:186-190`) ruft `window[ctx.value]` ohne Ziel-Whitelist auf — aktuell durch `sanitizeHTML()`s `data-*`-Filter defense-in-depth abgesichert, aber latentes Risiko bei jedem künftigen ungefilterten HTML-Renderpfad — Ursprung: CONCERNS.md §Sicherheit, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N7)
- **DEBT-24**: Würfelstatistik-IDB-Store (`features/dice-stats/dice-stats-idb.js`) wächst unbegrenzt, keine Prune-/Löschfunktion, `getAllStats()` lädt alles auf einmal in den Speicher — Ursprung: CONCERNS.md §Performance & Skalierung, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N10)
- **DEBT-25**: `const D` überschattet das globale Datenobjekt an mehreren konkreten Stellen (u. a. `features/soundboard/soundboard-player.js:145` mit einer Zahl) — reines Lesbarkeits-/Wartbarkeitsrisiko, kein Build-Konflikt, Umbenennungsaufwand nahe Null — Ursprung: CONCERNS.md §Fragile Bereiche & Wartungsrisiko, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N12)
- **DEBT-26**: Veralteter Header-Kommentar in `systems/file-backup/file-backup-manager.js:5-6,213,340` beschreibt das explizit verbotene `window.save`-Monkey-Patch-Muster, obwohl der Code korrekt `registerPostSaveHook()` nutzt — Risiko, dass ein künftiger Entwickler das im Kommentar beschriebene (falsche) Muster kopiert — Ursprung: CONCERNS.md §Fragile Bereiche & Wartungsrisiko, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N14)
- **DEBT-27**: `console.*`-Aufrufe außerhalb von `DEBUG_MODE`-Guards (u. a. `core/init.js:163`, `utils/basic.js` mehrfach, `systems/spellslots/import-export.js` mehrfach) widersprechen der CLAUDE.md-Zusicherung „Zero console.log in production" — Ursprung: CONCERNS.md §Fragile Bereiche & Wartungsrisiko, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N15)
- **DEBT-28**: Keine dedizierten Testdateien für Timeline/Reise/Fraktionen/Session-Prep/NPC-Generator — nur eine gemeinsame Sammel-Spec (`tests/unit/welt-story.test.js`, `tests/e2e/features/welt-story.spec.js`) für fünf Feature-Bereiche mit zusammen ~3200 Zeilen — Ursprung: CONCERNS.md §Test-Lücken, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N16)
- **DEBT-29**: Kein Test deckt das Zusammenspiel Persistenz-IDB-Modus ↔ Datei-Backup ab — exakt die Testlücke, die DEBT-17 unentdeckt ließ; eigener Regressionsschutz-Posten unabhängig vom Bugfix — Ursprung: CONCERNS.md §Test-Lücken, triagiert in 11-CONCERNS-TRIAGE.md (Eintrag N17)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Neue Spielleiter-Features | v1.1 ist bewusst verhaltensneutral — Features erst wieder ab v1.2 |
| Framework-/ESM-Migration | Bewährte non-ESM-Architektur bleibt (PROJECT.md-Constraint) |
| ~504 funktions-lokale `const X = window.X`-Imports flächig umbauen | Nur wo sie konkrete Bugs verursachen (vgl. CLAUDE.md-Dedup-Regeln); Flächen-Refactor = hohes Risiko, wenig Nutzen |
| Performance-Optimierungen | Kein gemeldetes Problem; nicht Teil der Schulden |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDIT-01 | Phase 9 | Complete |
| EDIT-02 | Phase 9 | Complete |
| EDIT-03 | Phase 9 | Complete |
| TEST-01 | Phase 8 | Complete |
| TEST-02 | Phase 8 | Complete |
| SEC-01 | Phase 10 | Complete |
| SEC-02 | Phase 10 | Complete |
| ARCH-01 | Phase 11 | Complete |
| ARCH-02 | Phase 11 | Complete |
| ARCH-03 | Phase 11 | Complete |
| ARCH-04 | Phase 11 | Pending |
