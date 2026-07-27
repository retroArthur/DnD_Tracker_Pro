---
phase: 9
slug: editor-regressionsnetz-execcommand-abl-sung
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-25
validated: 2026-07-26
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E, primär für diese Phase) + Jest 30.2.0/jsdom (optional für tote Code-Pfade) |
| **Config file** | `playwright.config.js` (Chromium-only, `file:///…/dist/dnd-tracker-bundled.html`, `retries: 2` in CI, `workers: 1` in CI) |
| **Quick run command** | `npx playwright test tests/e2e/features/editor-formatting.spec.js` (Dateiname Vorschlag, Claude's Discretion) |
| **Full suite command** | `python build.py && npx playwright test` (E2E — Build zwingend zuerst) / `npm test` (Jest) |
| **Estimated runtime** | ~15–30 s (einzelne Spec) / mehrere Minuten (volle E2E-Suite); Jest ~3 s |

---

## Sampling Rate

- **After every task commit (je Migrationsgruppe, D-05):** Run `python build.py && npx playwright test tests/e2e/features/editor-formatting.spec.js` — das komplette Regressionsnetz muss nach JEDER Migrationsgruppe grün sein (nicht nur die Tests der gerade migrierten Gruppe)
- **After every plan wave:** Run `python build.py && npx playwright test` (volle Suite — das neue Netz ist automatisch Teil des blockierenden `e2e`-CI-Jobs aus Phase 8)
- **Before `/gsd-verify-work`:** Volle Suite grün; zusätzlich D-04a: das Regressionsnetz muss VOR der Migration ZWEIFACH in Folge grün gegen die unveränderte execCommand-Baseline gelaufen sein (expliziter Verifikationsschritt im ersten Plan)
- **Max feedback latency:** ~30 seconds (Quick-Run einer einzelnen Spec-Datei nach Build)

---

## Per-Task Verification Map

Retroaktiv abgeglichen am 2026-07-26 (validate-phase §6, State A). Jeder Eintrag wurde gegen den
Live-Code geprüft, nicht aus den SUMMARYs übernommen.

| Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01 | 1 | EDIT-01, EDIT-03 | Messung | Baseline-Erhebung → `09-BASELINE.md` (399 Zeilen) | ✅ | ✅ green |
| 09-02 | 2 | EDIT-02, EDIT-03 | e2e | `npx playwright test tests/e2e/features/editor-formatting.spec.js` | ✅ 32 Tests | ✅ green |
| 09-03 | 3 | EDIT-02, EDIT-03 | e2e | `npx playwright test tests/e2e/features/editor-floating.spec.js` | ✅ 27 Tests | ✅ green |
| 09-04 | 3 | EDIT-02, EDIT-03 | e2e | `npx playwright test tests/e2e/features/editor-insert.spec.js` | ✅ 13 Tests | ✅ green |
| 09-05 | 4 | EDIT-03 | e2e | `npx playwright test tests/e2e/features/editor-smoke.spec.js` | ✅ 7 Tests | ✅ green |
| 09-06 | 5 | EDIT-01 | e2e | volles Netz nach Migrationsgruppe | ✅ | ✅ green |
| 09-07 | 6 | EDIT-01, EDIT-02 | e2e | volles Netz nach Migrationsgruppe | ✅ | ✅ green |
| 09-08 | 7 | EDIT-01 | e2e | volles Netz nach Migrationsgruppe | ✅ | ✅ green |
| 09-09 | 8 | EDIT-01, EDIT-02, EDIT-03 | e2e + grep | volles Netz + `grep execCommand ui/editors/rich-text.js` = 0 | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Belegender Lauf (2026-07-26):** `npx playwright test` → 319 passed / 2 skipped. Das Regressionsnetz
umfasst **79 Tests** in vier Dateien und läuft als Teil des blockierenden `e2e`-CI-Jobs aus Phase 8 mit.

**Nachweis EDIT-01:** `grep` über den gesamten Quellbaum findet null `execCommand`-Aufrufe in
`ui/editors/rich-text.js` und exakt die drei dokumentierten Ausnahmen ausserhalb des Editor-Moduls
(`features/wiki/wiki.js`, `systems/entity-links.js`, `ui/actions/system-actions.js`) — deckungsgleich
mit dem, was `CLAUDE.md` und `.planning/codebase/CONCERNS.md` behaupten. Im Milestone-Audit
unabhängig gegengeprüft.

---

## Wave 0 Requirements

- [x] Regressionsnetz. **Die Discretion aus D-04 wurde genutzt: es wurden vier Dateien statt einer**, jede mit eigenem Schnitt — `editor-formatting.spec.js` (32 Tests), `editor-floating.spec.js` (27), `editor-insert.spec.js` (13), `editor-smoke.spec.js` (7). Zusammen 79 Tests.
- [x] Empirische Markup-Baseline-Erhebung. **Vorhanden als `09-BASELINE.md` (399 Zeilen)**, erstellt in Plan 09-01 vor der ersten Migration. Sie protokolliert zusätzlich Funde, die bewusst NICHT in dieser Phase repariert wurden (§ ab Zeile 377) — die Baseline ist gemessen, nicht geraten, und Fehlzustände wurden nicht stillschweigend als korrekt eingetragen.
- [x] Klärung Pitfall 1 (`EDITOR_FONTS`/`TOOLBAR_DIMENSIONS`). **Beide sind definiert und exportiert:** `core/constants.js:450` bzw. `:464`, Export in `:619/:620`. Die Migrationsgruppe „Fonts/Größen" war damit testbar.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visuelle Parität der Toolbar-Darstellung (Icons, Dropdown-Optik) nach Migration | EDIT-02 | Pixel-Optik ist per Markup-Assertion nicht sinnvoll prüfbar | Editor in Wiki öffnen, beide Toolbars sichten, mit Vorher-Zustand vergleichen |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — alle drei Posten erfüllt, siehe oben
- [x] No watch-mode flags
- [x] Feedback latency < 30s (Einzel-Spec nach Build ~15–30 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-26

---

## Validation Audit 2026-07-26

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Kein `gsd-nyquist-auditor` nötig — die Gap-Analyse ergab keine offenen Posten (Kurzschluss aus
Schritt 3 des Workflows).

Wie bei Phase 8 fehlte nur der Abgleich: `plan-phase` legte die Datei am 25.07. an,
`validate-phase` zog sie nie nach. Die Per-Task-Karte trug noch `9-XX-XX`-Platzhalter und alle drei
Wave-0-Posten standen als offen, obwohl das Regressionsnetz zu dem Zeitpunkt bereits vier Dateien
umfasste und die Baseline erhoben war. `nyquist_compliant: false` war also kein Befund, sondern ein
nicht gepflegter Zähler — NOT-VALIDATED im Sinne von `audit-milestone` §5.5, nicht PARTIAL.

**Bemerkenswert für die Bewertung dieser Phase:** die Reihenfolge wurde eingehalten, die das
Vorhaben überhaupt erst absicherbar macht — erst messen (`09-BASELINE.md`), dann das Netz bauen,
dann migrieren. Ohne die vorherige Baseline wären die Markup-Assertions geraten gewesen, und ein
Regressionsnetz mit geratenen Sollwerten hätte die execCommand-Ablösung nicht absichern können.
