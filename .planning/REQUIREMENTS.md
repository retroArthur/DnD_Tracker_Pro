# Requirements: D&D Kampagnen-Tracker Pro — v1.1 Tech-Debt & Härtung

**Defined:** 2026-07-22
**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

**Milestone-Leitplanke:** Verhaltensneutral — kein Feature ändert sich aus Nutzersicht. „Done" heißt: gleiche UI, gleiches Verhalten, aber schuldenfreie, dauerhaft wartbare Basis.

## v1.1 Requirements

### Editor (execCommand-Ablösung)

- [ ] **EDIT-01**: Alle 21 `document.execCommand`-Aufrufe in `ui/editors/rich-text.js` sind durch moderne Selection/Range-DOM-APIs ersetzt — verhaltensgleich für Bold/Italic/Underline/Strikethrough, Listen, Links, Tabellen, Border, Read-Aloud-Stile, Fonts/Größen und Highlight-Farben
- [ ] **EDIT-02**: Alle Editor-Toolbars (3-Tier-System, statisch + floating) und Markdown-Shortcuts funktionieren nach der Ablösung unverändert in allen Entity-Editoren (Wiki, NPCs, Orte, Quests, Sessions, Quick-Ref …)
- [ ] **EDIT-03**: Editor-Regressionsnetz existiert: E2E-Tests decken die Kern-Formatierungen ab (vorher ungetesteter Bereich), damit die Ablösung beweisbar verhaltensgleich ist

### Tests (Suite grün + gehärtet)

- [ ] **TEST-01**: Die 11 vorbestehenden E2E-Fails sind auf 0 — tab-navigation (7: Registry-Re-Render mit injizierten Daten), crud-Modifier-Berechnung (2), Quest-Titel-Validierung (1), Global-Search-Ergebnisse (1); Ursache je Fall geklärt (Test-Bug vs. App-Bug)
- [ ] **TEST-02**: Brüchige Test-Muster gehärtet: exakte Zähl-Assertions (`toBe(N)` statt `toBeGreaterThan(0)`), keine maskierenden manuellen Event-Dispatches, `npx playwright test` läuft vollständig grün als CI-tauglicher Gate

### Security (Altlasten schließen)

- [ ] **SEC-01**: Der vorbestehende Import-XSS (Critical aus 01-REVIEW.md) ist behoben, mit Regressionstest (bösartige Import-Datei wird sanitisiert, kein Script-Execute)
- [ ] **SEC-02**: Security-Audit nachgezogen: SECURITY.md mit `threats_open: 0` für die kritischen Angriffsflächen (Import/Export, Storage/IDB, Datei-Backup, Rich-Text/innerHTML) — via `/gsd-secure-phase` über die relevanten Phasen

### Architektur (Build-/Repo-Hygiene)

- [ ] **ARCH-01**: Modullisten-Drift ist strukturell unmöglich: loader.js↔build.py haben eine Single Source of Truth ODER einen harten Gate (Build bricht bei Drift ab — nicht nur Warnung), abgesichert durch Tests
- [ ] **ARCH-02**: build.py-Dedup Pass 3 ist gehärtet: verwaiste Funktionskörper können nicht mehr still im Bundle landen (Fehler statt kaputtem Build), mit Testabdeckung im bestehenden TDD-Suite-Muster (tests/build/)
- [ ] **ARCH-03**: CI-/Konsolen-Hygiene: GitHub-Actions auf Node-24-kompatible Versionen gehoben (Deprecation-Warnungen weg), favicon-404 und `apple-mobile-web-app-capable`-Deprecation im Bundle behoben
- [ ] **ARCH-04**: Codebase-Map aufgefrischt (`.planning/codebase/` via `/gsd-map-codebase`, Stand nach Phasen 3–7) und CONCERNS.md-Restposten trianguliert: jeder Eintrag ist erledigt, obsolet-markiert oder als Requirement übernommen

## v2 Requirements

Deferred — nicht in diesem Milestone.

### Features

- **SOUND-PT-01**: Soundboard Per-Track-Play (▶/⏹ je Track, Layering — Design aus v1.0-Session liegt bereit)

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
| EDIT-01 | Phase 9 | Pending |
| EDIT-02 | Phase 9 | Pending |
| EDIT-03 | Phase 9 | Pending |
| TEST-01 | Phase 8 | Pending |
| TEST-02 | Phase 8 | Pending |
| SEC-01 | Phase 10 | Pending |
| SEC-02 | Phase 10 | Pending |
| ARCH-01 | Phase 11 | Pending |
| ARCH-02 | Phase 11 | Pending |
| ARCH-03 | Phase 11 | Pending |
| ARCH-04 | Phase 11 | Pending |
