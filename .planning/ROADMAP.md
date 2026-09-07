# Roadmap: D&D Kampagnen-Tracker Pro

## Milestones

- ✅ **v1.0 Stabilisierung & Ausbau** — Phasen 1–7 (shipped 2026-07-22) → [Archiv](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Tech-Debt & Härtung** — Phasen 8–11 (shipped 2026-07-27) → [Archiv](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Schulden-Abbau** — Phasen 12–14 (shipped 2026-09-07) → [Archiv](milestones/v1.2-ROADMAP.md)
- ⬜ **v1.3** — noch nicht aufgesetzt (`/gsd-new-milestone`)

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
Audit: [v1.1-MILESTONE-AUDIT.md](v1.1-MILESTONE-AUDIT.md) · Übertrag nach v1.2: [milestones/v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md)

</details>

<details>
<summary>✅ v1.2 Schulden-Abbau (Phasen 12–14) — SHIPPED 2026-09-07</summary>

**Ziel war:** die 26 in der v1.1-Triage erfassten `DEBT`-Posten abarbeiten, damit der Backlog leer ist
und v1.3 wieder Features bringen kann. **Erreicht** — 19 Requirements, alle validiert.

- [x] Phase 12: Datensicherheit (17/17 Pläne) — Umzugs-Export erfasst IndexedDB, Datei-Backup deckt alle Kampagnen ab, Audio-Löschen rückgängig machbar, Persistenz-Randfälle getestet (completed 2026-09-05)
- [x] Phase 13: Härtung & Wartbarkeit (12/12 Pläne) — `call`-Whitelist (130 Ziele), Save-Pfad ohne Blob-Allokation, Würfelstatistik gedeckelt, vier übergroße Module in 14 Dateien aufgeteilt (alle ≤ 800 Zeilen), execCommand-Treffer auf 0, Konsole in Produktionspfaden still (completed 2026-09-06)
- [x] Phase 14: Tests & Gates (9/9 Pläne) — Toast-Race geschlossen, fünf Welt-Features abgedeckt, Lint-/Typecheck-/Coverage-Gates geschärft (completed 2026-09-07)

Tests: Jest 628 → **1120** · Playwright 319 → **323** (321 passed / 2 skipped) · pytest 24 → 24.
Sicherheit: `threats_open: 0` über alle drei Phasen (171 Bedrohungen). Nyquist: 12 COMPLIANT ·
13 COMPLIANT · 14 PARTIAL (9 datierte Restposten).

**Restschuld, bewusst geführt** (Details: [Audit](milestones/v1.2-MILESTONE-AUDIT.md), Übertrag in
[PROJECT.md](PROJECT.md) § „Next Milestone: v1.3"):

- **NQ-03..NQ-11** — die drei Gate-Ratschen sind Prosa-Regeln statt struktureller Gates; `14-GATE-BASELINE.md` in fünf Zahlen veraltet; beide stehenden Gates hängen an einem ungeprüften Extraktor
- **`npm run check` ist rot** — 132 Prettier-Dateien, und CI fährt `format:check` gar nicht
- **7 von 8 Phase-13-Aufteilungsdateien** stehen auf `MODULE_TEST_EXCEPTIONS` — die Aufteilung geschah für Testbarkeit, eingelöst ist sie erst mit echten Tests
- **`DEBT-01` teiloffen** — `tsconfig.strict.json` deckt 8 von 134 Dateien
- **2 subjektive Bedienabnahmen offen** — Editor-Bediengefühl, DM-Screen-Masonry

**Zwei Funde des Milestone-Audits, die keine Phase gemeldet hatte:** ein korrekt kalibriertes, aber
**nie ausgeführtes** Coverage-Gate (CI fuhr blankes `npm test`), und ein totes Aktionsziel
(`populateImportNodesList`), das entgegen der Behauptung seines Plan-Summaries in beide Bundles
ging. Beide am 2026-09-07 geschlossen. Phase 13 bekam ihre nie gelaufene Sicherheits- und
Validierungsprüfung retroaktiv — 67 Bedrohungen, 16/16 Verifikationszeilen, null Lücken.

Details: [milestones/v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md) ·
Requirements: [milestones/v1.2-REQUIREMENTS.md](milestones/v1.2-REQUIREMENTS.md) ·
Audit: [milestones/v1.2-MILESTONE-AUDIT.md](milestones/v1.2-MILESTONE-AUDIT.md)

</details>

## Progress

**14 Phasen abgeschlossen · 109 Pläne · 3 Milestones geshippt.**

Nächster Schritt: `/gsd-new-milestone` — v1.3 aufsetzen. Der `DEBT`-Backlog ist erstmals seit v1.0
leer, der Milestone ist damit frei für Features statt Schuldenabbau.
