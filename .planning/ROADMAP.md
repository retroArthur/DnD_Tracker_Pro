# Roadmap: D&D Kampagnen-Tracker Pro

## Milestones

- ✅ **v1.0 Stabilisierung & Ausbau** — Phasen 1–7 (shipped 2026-07-22) → [Archiv](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Tech-Debt & Härtung** — Phasen 8–11 (shipped 2026-07-27) → [Archiv](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 Schulden-Abbau** — Phasen 12–14 (in progress)

## Phases

<details>
<summary>✅ v1.0 Stabilisierung & Ausbau (Phasen 1–7) — SHIPPED 2026-07-22</summary>

- [x] Phase 1: Stabilisierung (9/9 Pläne) — App startet, Daten sind sicher, CI erkennt Crashes
- [x] Phase 2: Technik-Fundament (5/5 Pläne) — Installierbare PWA, Datei-Backup, Migrations-Wizard (completed 2026-06-12)
- [x] Phase 3: Bestiary (5/5 Pläne) — 112 SRD-Monster offline + eigene Kreaturen + Encounter-Import (completed 2026-06-13)
- [x] Phase 4: Initiative-Erweiterungen (4/4 Pläne) — Statblock-Popup, Legendäre Aktionen, Mob-Modus (completed 2026-06-13)
- [x] Phase 5: Welt & Story (8/8 Pläne) — Session-Prep, NPC-Generator, Kalender, Reise, Fraktionen (completed 2026-06-18)
- [x] Phase 6: Spieler-Verwaltung (9/9 Pläne) — XP/Milestone-Tracker, Inspiration, Charakterwerte (completed 2026-06-18)
- [x] Phase 7: Komfort & Analyse (4/4 Pläne) — Soundboard, Würfel-Statistiken (completed 2026-06-20)

Details, Success Criteria und Coverage: [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 Tech-Debt & Härtung (Phasen 8–11) — SHIPPED 2026-07-27</summary>

- [x] Phase 8: Test-Fundament grün (4/4 Pläne) — 11 vorbestehende E2E-Fails behoben, `e2e` als blockierendes CI-Gate (completed 2026-07-23)
- [x] Phase 9: Editor-Regressionsnetz & execCommand-Ablösung (9/9 Pläne) — Rich-Text auf Selection/Range migriert, 79-Test-Netz stand VOR der Migration (completed 2026-07-25)
- [x] Phase 10: Security-Härtung (7/7 Pläne) — Import-XSS behoben, Sanitizer-Tests gegen den Produktionsquelltext, `threats_open: 0` (completed 2026-07-25)
- [x] Phase 11: Architektur- & Build-Hygiene (7/7 Pläne) — Modullisten-Drift strukturell unmöglich, Dedup-Pass 3 entfernt, CI deprecation-frei (completed 2026-07-27)

Tests: Jest 457 → 628 · Playwright 231 → 319 · pytest 10 → 24. Nyquist 4/4 compliant.

Details, Success Criteria und Nachbetrachtung: [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)
Audit: [v1.1-MILESTONE-AUDIT.md](v1.1-MILESTONE-AUDIT.md) · **27 offene DEBT-Posten** als Übertrag nach v1.2: [milestones/v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md)

</details>

### 🚧 v1.2 Schulden-Abbau (In Progress)

**Milestone-Ziel:** Die 26 in der v1.1-Triage erfassten `DEBT`-Posten abarbeiten — allen voran die
Datenverlust-Risiken in Backup, Export und Migration — damit der Backlog leer ist und v1.3 wieder
Features bringen kann. **Nicht verhaltensneutral:** was gesichert und wiederherstellbar ist, ändert
sich spürbar.

- [x] **Phase 12: Datensicherheit** — Umzugs-Export erfasst IndexedDB, Datei-Backup deckt alle Kampagnen ab, Audio-Löschen rückgängig machbar, Persistenz-Randfälle getestet (completed 2026-09-05)
- [ ] **Phase 13: Härtung & Wartbarkeit** — `call`-Whitelist, Serialisierungslast senken, vier übergroße Module aufteilen, tote und irreführende Codestellen beseitigen
- [ ] **Phase 14: Tests & Gates** — Toast-Race schließen, fünf Welt-Features abdecken, Lint-/Typecheck-/Coverage-Gates schärfen

## Phase Details

### Phase 12: Datensicherheit

**Goal**: Kein Pfad in Backup, Export oder Migration verliert oder überschreibt mehr stillschweigend Daten, und die Randfälle, die solche Verluste bisher verdeckt haben, sind getestet.
**Depends on**: Nothing (erste Phase des Milestones)
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06
**Plans:** 17/17 plans complete
**Success Criteria** (what must be TRUE):

  1. Ein Umzugs-Export `file://` → PWA enthält Soundboard-Audio und Würfelstatistik; nach dem Import spielen Szenen ihre Tracks, keine toten `blobId`s bleiben zurück
  2. Ein Datei-Backup umfasst alle Kampagnen, nicht nur die aktive; zwei Kampagnen mit Namen, die auf denselben `safeName` normalisieren würden, überschreiben sich nicht gegenseitig
  3. `Strg+Z` nach dem Löschen einer Audiodatei stellt Blob und Szenen-Referenz wieder her
  4. Der Umzugs-Wizard bietet sich einem Nutzer mit vorhandenen Daten nicht an — auch nicht bei gesetztem `STORAGE_KEY_OVERRIDE` oder im IndexedDB-Modus
  5. Ein Parse-Fehler in `undo()`/`redo()` lässt die Stacks unverändert; kritische Saves laufen unabhängig vom `autosave-toggle`
  6. Tests decken den >5-MB-IDB-only-Save mit Reload, den localStorage-Quota-Fallback und den Export/Import-Versions-Rundlauf ab

Plans:
**Wave 1**

- [x] 12-01-PLAN.md — Testfundament (Wave 0) + Audio-Export-Tracer: IndexedDB → Base64 → JSON → IndexedDB (Welle 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 12-02-PLAN.md — Umzugs-Flow mit zwei Dateien: zweite Datei erzeugen, optional importieren, fehlende Szenen benennen (Welle 2)
- [x] 12-03-PLAN.md — Datei-Backup über alle Kampagnen, Kollisions-Suffix nur bei echtem Namenskonflikt (Welle 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 12-04-PLAN.md — Frischinstallations-Erkennung mit Override und IndexedDB-Modus (Welle 3)
- [x] 12-05-PLAN.md — Undo-Kern: erst parsen dann poppen, Push-Validierung, Undo-Hooks, toter Autosave-Schalter entfernt (Welle 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 12-06-PLAN.md — Audio-Löschen rückgängig: aufgeschobenes Löschen plus Wiederherstellung über den Undo-Hook (Welle 4)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 12-07-PLAN.md — Persistenz-Randfälle getestet: IDB-Neustart, Export/Import-Rundlauf, Audio-Rundlauf (Welle 5)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 12-08-PLAN.md — Lücken-Plan G-12-3: Inhalts-Prüfung der Frischinstallation zählt alle Nutzer-Sammlungen statt drei (Welle 6)

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 12-09-PLAN.md — Lücken-Plan CR-01/WR-01: „Überspringen" nach abgeschlossenem Import lädt neu statt das stale D zurückschreiben zu lassen; Footer ab Schritt 4 aus; Audio-Rückmeldung am richtigen Element (Welle 7)
- [x] 12-10-PLAN.md — Lücken-Plan CR-02: Backup-Rückfall auf `window.D` greift nur noch für die tatsächlich angefragte, aktive Kampagne (Welle 7)

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 12-11-PLAN.md — Lücken-Plan WR-02: Redo-Stack auch im Serialisierungsfehler leeren; volle Suiten und beide dist-Bundles aus dem Stand aller drei Lückenpläne (Welle 8)

**Wave 9** *(blocked on Wave 8 completion — vier Pläne mit überschneidungsfreien Dateien, parallel)*

- [x] 12-12-PLAN.md — Lücken-Plan SEC-04/SEC-03: Leerprüfung des Backups zählt Inhalt statt Schlüssel; Backup-Dateien tragen wieder den Namen ihrer eigenen Kampagne (Welle 9)
- [x] 12-13-PLAN.md — Lücken-Plan SEC-02: `undo()`/`redo()` serialisieren geschützt und brechen ohne Stack-Mutation ab statt ungefangen zu werfen (Welle 9)
- [x] 12-14-PLAN.md — Lücken-Plan SEC-01: nach dem Rücksprung aus dem Import führt kein Weg mehr in „Import fehlgeschlagen" — beide Fundstellen (Welle 9)
- [x] 12-15-PLAN.md — Lücken-Plan SEC-07: Audio-Import begrenzt auch das Volumen, geprüft vor dem Dekodieren (Welle 9)

**Wave 10** *(blocked on Wave 9 completion — teilt sich `migration-wizard.js` mit 12-14)*

- [x] 12-16-PLAN.md — Lücken-Plan SEC-05/SEC-06 (+WR-03): Import führt Würfel-Favoriten und Kampagnen-Index zusammen; Inhaltslisten vollständig; Audio-Importgrenze aus der Exportgrenze abgeleitet (Welle 10)

**Wave 11** *(blocked on Wave 10 completion)*

- [x] 12-17-PLAN.md — Integrationsstufe: volle Suiten, Build-Tests und beide dist-Bundles aus dem Stand aller fünf Fix-Pläne dieser Runde (Welle 11)

**Auslegungshinweis:** Erfolgskriterium 6 schließt dieselbe Testlücken-Klasse, die `DEBT-17` in v1.1 verdeckt hat — die Tests gehören in dieselbe Phase wie die Fixes, nicht ans Ende des Milestones.

### Phase 13: Härtung & Wartbarkeit

**Goal**: Die verbliebenen Sicherheits- und Skalierungsrisiken sind geschlossen, und die Codebasis trägt keine übergroßen, toten oder irreführenden Stellen mehr, die künftige Arbeit verteuern.
**Depends on**: Phase 12 (`PERF-01` fasst dieselben Persistenz-Dateien an wie `SAFE-05`)
**Requirements**: SEC-03, SEC-04, PERF-01, PERF-02, MAINT-01, MAINT-02, MAINT-03, MAINT-04, MAINT-05, MAINT-06
**Plans:** 12 plans
**Success Criteria** (what must be TRUE):

  1. Die `call`-Aktion ruft nur noch Ziele aus einer Whitelist auf; die Regex-Capture in `parseWikiLinks()` ist escapt
  2. Weder ein Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollständige Kampagne
  3. Der Würfelstatistik-Store hat eine Prune-/Löschfunktion und wird nicht mehr komplett in den Speicher geladen
  4. Keine der vier zuvor übergroßen Dateien überschreitet noch die Grenze, entlang derer sie aufgeteilt wurde — bei unverändertem Verhalten, belegt durch die bestehenden Suiten
  5. Der `hasHtmlTags`-Wächter ist verdrahtet oder entfernt; URLs mit ≥2 Unterstrichen werden nicht mehr korrumpiert
  6. `grep execCommand` liefert außerhalb von Kommentaren keinen Treffer mehr im gesamten Quellbaum
  7. Tab-Registry und `initPerformanceMonitoring()` sind gegen Umbenennung bzw. Mehrfachstart abgesichert; tote `mindmap`-Seeds, `const D`-Überschattung und das doppelte `data-id` sind weg
  8. Produktionspfade schreiben nichts mehr ungefiltert auf die Konsole; die Kopfkommentare im Datei-Backup beschreiben `registerPostSaveHook()` statt des verbotenen `window.save`-Musters

Plans:
**Wave 1** *(sechs Pläne mit überschneidungsfreien Dateien, parallel)*

- [ ] 13-01-PLAN.md — SEC-03: `call`-Aktion gegen eine explizite Ziel-Whitelist, Fehlerpfad hinter `DEBUG_MODE` (Welle 1)
- [ ] 13-02-PLAN.md — SEC-04 + MAINT-04 + MAINT-02: Wiki-Link-Escaping, letzte drei execCommand-Aufrufe abgelöst, doppeltes `data-id` weg (Welle 1)
- [ ] 13-03-PLAN.md — MAINT-03: toter `hasHtmlTags`-Wächter entfernt, Unterstrich-Wortgrenzen nach CommonMark (Welle 1)
- [ ] 13-04-PLAN.md — MAINT-05 + MAINT-02: Interval-Guard, Tab-Registry auf Funktionsreferenzen, tote `mindmap`-Seeds und `const D`-Überschattung weg (Welle 1)
- [ ] 13-05-PLAN.md — MAINT-01/D-04: Charakterisierungs-Snapshot für `dmscreen-render.js` gegen das UNGETEILTE Modul, vor jeder Verschiebung (Welle 1)
- [ ] 13-06-PLAN.md — PERF-01: Save-Pfad ohne zweite Vollkopie, Undo-Dedupe und Byte-Budget, Messprotokoll zu Erfolgskriterium 2 (Welle 1)

**Wave 2** *(blocked on Wave 1 — teilt `core/config.js` mit 13-06 und `system-actions.js` mit 13-02)*

- [ ] 13-07-PLAN.md — PERF-02: Deckel und Löschfunktion für den Würfelstatistik-Store, cursor-basierter Aggregatpfad (Welle 2, Entscheidungs-Checkpoint)

**Wave 3** *(blocked on Wave 2 — fasst 28 Module an, die in den Wellen 1–2 geändert wurden)*

- [ ] 13-08-PLAN.md — MAINT-06: Konsolen-Hygiene über alle gebündelten Module, Kopfkommentare im Datei-Backup nachgezogen (Welle 3)

**Wave 4** *(blocked on Wave 3 — MAINT-01, Reihenfolge D-05 nach steigendem Risiko)*

- [ ] 13-09-PLAN.md — MAINT-01: `features/wiki/wiki.js` aufgeteilt, volles Suiten-Gate vor dem Commit (Welle 4)

**Wave 5** *(blocked on Wave 4 — teilt `loader.js`)*

- [ ] 13-10-PLAN.md — MAINT-01: `features/initiative.js` in Kern, Kampf-Widgets und Beute-System aufgeteilt (Welle 5)

**Wave 6** *(blocked on Wave 5 — teilt `loader.js`)*

- [ ] 13-11-PLAN.md — MAINT-01: `ui/editors/rich-text.js` entflochten und aufgeteilt, Zauberverwaltung zieht aus (Welle 6, Bedienprobe)

**Wave 7** *(blocked on Wave 6 — teilt `loader.js`; braucht zusätzlich den Snapshot aus 13-05)*

- [ ] 13-12-PLAN.md — MAINT-01: `features/dmscreen/dmscreen-render.js` in fünf Module aufgeteilt, Snapshot beweist Neutralität (Welle 7, Bedienprobe)

**Auslegungshinweis zum Zuschnitt:** `MAINT-01` (Aufteilung von `ui/editors/rich-text.js` 1932, `features/initiative.js` 1655, `features/dmscreen/dmscreen-render.js` 1576 und `features/wiki/wiki.js`) ist der riskanteste Posten des Milestones und liegt hier **ohne eigenes Phasen-Gate**. Die Planung muss das ausgleichen: eigener Plan je Datei, jeweils mit vollem Suiten-Lauf als Hard-Gate vor dem Commit. `rich-text.js` trägt das eingefrorene 79-Test-Netz aus Phase 9 — jede Änderung daran ist begründungspflichtig.

### Phase 14: Tests & Gates

**Goal**: Die verbliebenen Testlücken sind geschlossen und die Qualitäts-Gates greifen scharf genug, um künftige Rückschritte zu fangen.
**Depends on**: Phase 13 (`TEST-05` braucht die endgültige Modulstruktur aus `MAINT-01` und die neuen Tests aus `TEST-04`)
**Requirements**: TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

  1. `tests/e2e/crud/locations.spec.js` und `encounters.spec.js` tragen den Seed-Nachzug aus Plan 08-02; die Toast-Race ist auch unter Volllast nicht mehr reproduzierbar
  2. Timeline, Reise, Fraktionen, Session-Prep und NPC-Generator haben je eine dedizierte Testdatei statt einer gemeinsamen Sammel-Spec
  3. Lint-, Typecheck- und Coverage-Gates sind geschärft und laufen grün gegen die Codebasis nach Phase 13

**Auslegungshinweis:** `TEST-05` kommt bewusst zuletzt. Schärfere Coverage-Gates gegen eine Codebasis zu setzen, die gerade aufgeteilt wird, würde gegen sich selbst arbeiten.

**Execution Order:** streng sequenziell 12 → 13 → 14. Präzedenz aus v1.0/v1.1: fast alle Pläne fassen geteilte Dateien an, paralleles Ausführen kollidiert.

## Progress

| Milestone | Plans Complete | Status | Completed |
|-----------|----------------|--------|-----------|
| v1.0 (Phasen 1–7) | 44/44 | ✅ Shipped | 2026-07-22 |
| v1.1 (Phasen 8–11) | 27/27 | ✅ Shipped | 2026-07-27 |

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 12. Datensicherheit | 17/17 | Complete (2026-09-05) — Verifikation `passed` (9/9), UAT 28/28, `threats_open: 0`, `nyquist_compliant: true`. Gap-Closure SEC-01…SEC-07 in den Wellen 9–11 geschlossen, dazu CR-01/WR-01 aus dem Code-Review | 2026-09-05 |
| 13. Härtung & Wartbarkeit | 0/12 | Planned (12 Pläne, 7 Wellen; Welle 1 mit sechs parallelen Plänen). Drei Pläne nicht autonom: Entscheidungs-Checkpoint zur Würfelstatistik-Obergrenze (13-07), Bedienproben nach den Aufteilungen von `rich-text.js` (13-11) und `dmscreen-render.js` (13-12) | |
| 14. Tests & Gates | TBD | Not started | |
