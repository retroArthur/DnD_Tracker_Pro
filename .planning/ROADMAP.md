# Roadmap: D&D Kampagnen-Tracker Pro

## Milestones

- ✅ **v1.0 Stabilisierung & Ausbau** — Phasen 1–7 (shipped 2026-07-22) → [Archiv](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Tech-Debt & Härtung** — Phasen 8–11 (in progress)

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

### 🚧 v1.1 Tech-Debt & Härtung (In Progress)

**Milestone-Ziel:** Codebasis schuldenfrei und dauerhaft wartbar machen — deprecated APIs ablösen, Test-Suite vollständig grün, Sicherheits-Altlasten schließen, Build-/Architektur-Hygiene. Verhaltensneutral: keine Feature-Änderung aus Nutzersicht.

- [x] **Phase 8: Test-Fundament grün** - Alle 11 vorbestehenden E2E-Fails behoben, brüchige Assertions gehärtet (completed 2026-07-23)
- [x] **Phase 9: Editor-Regressionsnetz & execCommand-Ablösung** - Rich-Text-Editor auf Selection/Range-APIs migriert, abgesichert durch neues E2E-Netz das VOR der Migration steht (completed 2026-07-25)
- [ ] **Phase 10: Security-Härtung** - Vorbestehender Import-XSS behoben, aktueller Security-Audit ohne offene Findings
- [ ] **Phase 11: Architektur- & Build-Hygiene** - Modullisten-Drift strukturell unmöglich, Dedup-Pass-3 gehärtet, CI-Deprecations weg, Codebase-Map + CONCERNS.md aufgefrischt

## Phase Details

### Phase 8: Test-Fundament grün

**Goal**: Die komplette Test-Suite (Unit + E2E) läuft vollständig grün und ist als CI-Gate vertrauenswürdig — jeder vorbestehende Fail ist geklärt (Test-Bug behoben oder App-Bug gefixt), brüchige Assertion-Muster sind gehärtet.
**Depends on**: Nichts (erste Phase von v1.1; baut auf dem abgeschlossenen v1.0-Codebase auf)
**Requirements**: TEST-01, TEST-02
**Success Criteria** (what must be TRUE):

  1. `npx playwright test` läuft mit 0 Fails (vorher 11: 7 tab-navigation, 2 crud-Modifier-Berechnung, 1 Quest-Titel-Validierung, 1 Global-Search)
  2. Für jeden ehemaligen Fail ist dokumentiert, ob es ein Test-Bug oder ein App-Bug war und wie er behoben wurde
  3. Zähl-Assertions in der Suite nutzen exakte Werte (`toBe(N)`) statt `toBeGreaterThan(0)`, wo ein exakter Wert erwartbar ist
  4. Keine maskierenden manuellen Event-Dispatches verstecken mehr echte Interaktionsfehler in Test-Helpers
  5. Die E2E-Suite läuft vollständig durch und ist als CI-tauglicher Gate nutzbar

**Plans**: 4/4 plans executed
**Wave 1**

- [x] 08-01-PLAN.md — App-Bug-Fixes (attr-mod-Kollision, Banner-Overlap, renderAll-Lücke) + D-02-Regressionstests (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 08-02-PLAN.md — E2E-Test-Bug-Fixes: reale Selektoren + Timer-API + Toast-Race-Seeding (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 08-03-PLAN.md — Suite-weite Assertion-Härtung: toBe(N), Masking-Audit, waitForTimeout (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 08-04-PLAN.md — Blockierender e2e-CI-Gate (D-03) + Triage-Dokumentation (D-07) (Wave 4)

### Phase 9: Editor-Regressionsnetz & execCommand-Ablösung

**Goal**: Der Rich-Text-Editor ist von 21 deprecated `document.execCommand`-Aufrufen auf moderne Selection/Range-DOM-APIs migriert — abgesichert durch ein neues E2E-Regressionsnetz, das VOR der Migration existiert und Verhaltensgleichheit beweist.
**Depends on**: Phase 8 (braucht eine vertrauenswürdige grüne Suite als verlässliche Baseline für die riskanteste Änderung des Milestones)
**Requirements**: EDIT-01, EDIT-02, EDIT-03
**Success Criteria** (what must be TRUE):

  1. Ein E2E-Regressionsnetz für Kern-Formatierungen (Bold/Italic/Underline/Strikethrough, Listen, Links, Tabellen, Border, Read-Aloud-Stile, Fonts/Größen, Highlight-Farben) existiert und ist grün gegen den bestehenden execCommand-Code (Baseline vor der Migration)
  2. Alle 21 execCommand-Aufrufe in `ui/editors/rich-text.js` sind durch Selection/Range-DOM-APIs ersetzt
  3. Das Regressionsnetz bleibt nach der Migration grün — belegt Verhaltensgleichheit
  4. Alle Entity-Editoren (Wiki, NPCs, Orte, Quests, Sessions, Quick-Ref) und beide Toolbar-Varianten (statisch, floating) funktionieren unverändert inkl. Markdown-Live-Shortcuts

**Plans**: 9/9 plans executed

**Wave 1**

- [x] 09-01-PLAN.md — Tracer (Bold end-to-end), empirisches Markup-Inventar aller 21 Call-Sites, Baseline-Entscheidung (Checkpoint)

**Wave 2** *(blocked on Wave 1)*

- [x] 09-02-PLAN.md — Baseline-Entscheidung umsetzen + Netz der statischen Wiki-Toolbar inkl. Randfälle

**Wave 3** *(blocked on Wave 2, 09-03 und 09-04 parallel)*

- [x] 09-03-PLAN.md — Netz der floating Toolbar + UI-lose Zweige + Zählnachweis-Test
- [x] 09-04-PLAN.md — Netz für Einfüge-/Tastaturpfade + Smoke der 5 weiteren Entity-Editoren + Markdown-Shortcuts

**Wave 4** *(blocked on Wave 3)*

- [x] 09-05-PLAN.md — D-04a Doppel-Grün-Gate gegen den unveränderten Code + Netz-Freeze + CI-Nachweis

**Wave 5** *(blocked on Wave 4)*

- [x] 09-06-PLAN.md — Migration Gruppen A+B: Inline-Formate, Liste und UI-lose Zweige in formatText (9 Call-Sites)

**Wave 6** *(blocked on Wave 5)*

- [x] 09-07-PLAN.md — Migration Gruppen C+D: Schriftart/Größe (beide Toolbars) + Format entfernen (6 Call-Sites)

**Wave 7** *(blocked on Wave 6)*

- [x] 09-08-PLAN.md — Migration Gruppen E+F: Zwischenablage-Einfügungen, Tabelle, Zeilenumbruch (5 Call-Sites)

**Wave 8** *(blocked on Wave 7)*

- [x] 09-09-PLAN.md — Migration Gruppe G (Absatztrenner-Setup) + Abschluss-Gate + Doku + Handcheck (1 Call-Site)

### Phase 10: Security-Härtung

**Goal**: Der vorbestehende Import-XSS ist geschlossen und die kritischen Angriffsflächen der App sind mit einem aktuellen Security-Audit ohne offene Findings dokumentiert.
**Depends on**: Phase 9 (Audit soll den finalen Editor-/innerHTML-Code abdecken, nicht den bald ersetzten execCommand-Stand)
**Requirements**: SEC-01, SEC-02
**Success Criteria** (what must be TRUE):

  1. Der vorbestehende Import-XSS (Critical aus 01-REVIEW.md) ist behoben
  2. Ein Regressionstest belegt: eine bösartige Import-Datei wird sanitisiert, kein Skript wird ausgeführt
  3. SECURITY.md dokumentiert einen Audit über Import/Export, Storage/IDB, Datei-Backup und Rich-Text/innerHTML mit `threats_open: 0`
  4. Der Audit ist via `/gsd-secure-phase` gegen die relevanten Phasen durchgeführt (inkl. der neuen Editor-Implementierung aus Phase 9)

**Plans**: 5 plans

**Wave 1**

- [ ] 10-01-PLAN.md — Tracer: Anzeige-Grenze schließen (sanitizeHTML in renderMarkdownInContent + TOC-Reihenfolge) und CR-01-Kette end-to-end beweisen

**Wave 2** *(blocked on Wave 1)*

- [ ] 10-02-PLAN.md — Import-Grenze: Feldliste + sanitizeImportedItem an beiden Eintrittspunkten und beiden Zweigen, Undo/Backup (WR-03)

**Wave 3** *(blocked on Wave 2)*

- [ ] 10-03-PLAN.md — Sanitizer-Beweisnetz (Vektor-Katalog gegen echten Quelltext + Paritätstest) und `<strike>`-Whitelist

**Wave 4** *(blocked on Wave 3)*

- [ ] 10-04-PLAN.md — Paste-Tabellen-XSS (Broken-Windows #1) + saveSpell-Konsistenz + Ledger schließen

**Wave 5** *(blocked on Wave 4)*

- [ ] 10-05-PLAN.md — Abschluss-Audit über Phasen 1/2/9/10 + konsolidierte SECURITY.md mit `threats_open: 0`

*Sequenzielle Wellen: alle Pläne ab Welle 2 bauen `dist/dnd-tracker-bundled.html` und fahren die E2E-Suite gegen dasselbe Artefakt — paralleles Ausführen würde auf dem gemeinsamen Bundle kollidieren.*

### Phase 11: Architektur- & Build-Hygiene

**Goal**: Modullisten-Drift zwischen loader.js und build.py ist strukturell unmöglich, der build.py-Dedup bricht bei verwaisten Funktionskörpern statt still ein kaputtes Bundle zu bauen, CI läuft ohne Deprecation-Warnungen, und Codebase-Map + CONCERNS.md spiegeln den finalen Stand nach v1.1 wider.
**Depends on**: Phase 10 (letzte Phase — Codebase-Map-Refresh und CONCERNS.md-Triage sollen den finalen Stand nach allen v1.1-Phasen abbilden)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):

  1. Ein divergierender Modul-Eintrag zwischen loader.js und build.py lässt den Build hart fehlschlagen (nicht nur eine Warnung), abgesichert durch Tests
  2. Ein verwaister Funktionskörper aus Dedup-Pass-3 erzeugt einen Build-Fehler statt eines still kaputten Bundles, mit Testabdeckung in tests/build/
  3. Die GitHub-Actions-Workflows laufen ohne Node-Deprecation-Warnungen (Node-24-kompatible Action-Versionen)
  4. favicon-404 und die `apple-mobile-web-app-capable`-Deprecation-Warnung sind aus der Konsole verschwunden
  5. `.planning/codebase/` ist aufgefrischt (Stand nach allen v1.1-Phasen) und jeder CONCERNS.md-Eintrag ist erledigt, obsolet-markiert oder als Requirement übernommen

**Plans**: TBD

## Progress

**Execution Order:** Phasen laufen sequenziell in numerischer Reihenfolge: 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| v1.0 (Phasen 1–7) | 44/44 | ✅ Shipped | 2026-07-22 |
| 8. Test-Fundament grün | 4/4 | Complete    | 2026-07-23 |
| 9. Editor-Regressionsnetz & execCommand-Ablösung | 9/9 | Complete    | 2026-07-25 |
| 10. Security-Härtung | 0/5 | Planned | - |
| 11. Architektur- & Build-Hygiene | 0/TBD | Not started | - |
