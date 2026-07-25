---
phase: 9
slug: editor-regressionsnetz-execcommand-abl-sung
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-25
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 9-XX-XX | TBD | TBD | EDIT-01 | — | N/A | e2e (Markup-Assertion) | `npx playwright test tests/e2e/features/editor-formatting.spec.js` | ❌ W0 | ⬜ pending |
| 9-XX-XX | TBD | TBD | EDIT-02 | — | N/A | e2e (Smoke pro Entity-Editor) | `npx playwright test tests/e2e/features/editor-formatting.spec.js -g "Smoke"` | ❌ W0 | ⬜ pending |
| 9-XX-XX | TBD | TBD | EDIT-03 | — | N/A | e2e (das Netz selbst ist Liefergegenstand) | `npx playwright test tests/e2e/features/editor-formatting.spec.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — Task-IDs werden nach der Planerstellung von validate-phase konkretisiert.*

---

## Wave 0 Requirements

- [ ] `tests/e2e/features/editor-formatting.spec.js` (oder mehrere Dateien, Claude's Discretion D-04) — deckt alle Formatgruppen aus EDIT-01/EDIT-03 ab; existiert noch nicht
- [ ] Empirische Markup-Baseline-Erhebung (Wissensbasis: pro execCommand einmal ausführen, HTML-Output notieren) — Voraussetzung für exakte Assertions, per CONTEXT.md Specifics zwingend VOR Testerstellung
- [ ] Klärung Pitfall 1 (`EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` nirgends definiert) — beeinflusst, ob die Migrationsgruppe „Fonts/Größen" testbar ist, bevor sie geplant wird

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visuelle Parität der Toolbar-Darstellung (Icons, Dropdown-Optik) nach Migration | EDIT-02 | Pixel-Optik ist per Markup-Assertion nicht sinnvoll prüfbar | Editor in Wiki öffnen, beide Toolbars sichten, mit Vorher-Zustand vergleichen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
