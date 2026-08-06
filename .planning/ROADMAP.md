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

- [ ] **Phase 12: Datensicherheit** — Umzugs-Export erfasst IndexedDB, Datei-Backup deckt alle Kampagnen ab, Audio-Löschen rückgängig machbar, Persistenz-Randfälle getestet
- [ ] **Phase 13: Härtung & Wartbarkeit** — `call`-Whitelist, Serialisierungslast senken, vier übergroße Module aufteilen, tote und irreführende Codestellen beseitigen
- [ ] **Phase 14: Tests & Gates** — Toast-Race schließen, fünf Welt-Features abdecken, Lint-/Typecheck-/Coverage-Gates schärfen

## Phase Details

### Phase 12: Datensicherheit

**Goal**: Kein Pfad in Backup, Export oder Migration verliert oder überschreibt mehr stillschweigend Daten, und die Randfälle, die solche Verluste bisher verdeckt haben, sind getestet.
**Depends on**: Nothing (erste Phase des Milestones)
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06
**Success Criteria** (what must be TRUE):

  1. Ein Umzugs-Export `file://` → PWA enthält Soundboard-Audio und Würfelstatistik; nach dem Import spielen Szenen ihre Tracks, keine toten `blobId`s bleiben zurück
  2. Ein Datei-Backup umfasst alle Kampagnen, nicht nur die aktive; zwei Kampagnen mit Namen, die auf denselben `safeName` normalisieren würden, überschreiben sich nicht gegenseitig
  3. `Strg+Z` nach dem Löschen einer Audiodatei stellt Blob und Szenen-Referenz wieder her
  4. Der Umzugs-Wizard bietet sich einem Nutzer mit vorhandenen Daten nicht an — auch nicht bei gesetztem `STORAGE_KEY_OVERRIDE` oder im IndexedDB-Modus
  5. Ein Parse-Fehler in `undo()`/`redo()` lässt die Stacks unverändert; kritische Saves laufen unabhängig vom `autosave-toggle`
  6. Tests decken den >5-MB-IDB-only-Save mit Reload, den localStorage-Quota-Fallback und den Export/Import-Versions-Rundlauf ab

**Auslegungshinweis:** Erfolgskriterium 6 schließt dieselbe Testlücken-Klasse, die `DEBT-17` in v1.1 verdeckt hat — die Tests gehören in dieselbe Phase wie die Fixes, nicht ans Ende des Milestones.

### Phase 13: Härtung & Wartbarkeit

**Goal**: Die verbliebenen Sicherheits- und Skalierungsrisiken sind geschlossen, und die Codebasis trägt keine übergroßen, toten oder irreführenden Stellen mehr, die künftige Arbeit verteuern.
**Depends on**: Phase 12 (`PERF-01` fasst dieselben Persistenz-Dateien an wie `SAFE-05`)
**Requirements**: SEC-03, SEC-04, PERF-01, PERF-02, MAINT-01, MAINT-02, MAINT-03, MAINT-04, MAINT-05, MAINT-06
**Success Criteria** (what must be TRUE):

  1. Die `call`-Aktion ruft nur noch Ziele aus einer Whitelist auf; die Regex-Capture in `parseWikiLinks()` ist escapt
  2. Weder ein Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollständige Kampagne
  3. Der Würfelstatistik-Store hat eine Prune-/Löschfunktion und wird nicht mehr komplett in den Speicher geladen
  4. Keine der vier zuvor übergroßen Dateien überschreitet noch die Grenze, entlang derer sie aufgeteilt wurde — bei unverändertem Verhalten, belegt durch die bestehenden Suiten
  5. Der `hasHtmlTags`-Wächter ist verdrahtet oder entfernt; URLs mit ≥2 Unterstrichen werden nicht mehr korrumpiert
  6. `grep execCommand` liefert außerhalb von Kommentaren keinen Treffer mehr im gesamten Quellbaum
  7. Tab-Registry und `initPerformanceMonitoring()` sind gegen Umbenennung bzw. Mehrfachstart abgesichert; tote `mindmap`-Seeds, `const D`-Überschattung und das doppelte `data-id` sind weg
  8. Produktionspfade schreiben nichts mehr ungefiltert auf die Konsole; die Kopfkommentare im Datei-Backup beschreiben `registerPostSaveHook()` statt des verbotenen `window.save`-Musters

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
| 12. Datensicherheit | TBD | Not started | |
| 13. Härtung & Wartbarkeit | TBD | Not started | |
| 14. Tests & Gates | TBD | Not started | |
