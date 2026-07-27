# Roadmap: D&D Kampagnen-Tracker Pro

## Milestones

- ✅ **v1.0 Stabilisierung & Ausbau** — Phasen 1–7 (shipped 2026-07-22) → [Archiv](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Tech-Debt & Härtung** — Phasen 8–11 (shipped 2026-07-27) → [Archiv](milestones/v1.1-ROADMAP.md)

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

## Progress

| Milestone | Plans Complete | Status | Completed |
|-----------|----------------|--------|-----------|
| v1.0 (Phasen 1–7) | 44/44 | ✅ Shipped | 2026-07-22 |
| v1.1 (Phasen 8–11) | 27/27 | ✅ Shipped | 2026-07-27 |

Nächster Milestone: `/gsd-new-milestone` — die 27 offenen `DEBT`-Posten aus
[milestones/v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md) sind dabei zu übernehmen.
