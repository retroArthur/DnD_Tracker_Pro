---
phase: 8
slug: test-fundament-gr-n
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-22
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.57.0 (E2E) + Jest 30.2.0/jsdom (Unit) |
| **Config file** | `playwright.config.js` (E2E, file:// gegen Dev-Bundle), `jest.config.cjs` (Unit) |
| **Quick run command** | `npx playwright test tests/e2e/<file>.spec.js` (einzelne Spec, ~15s) / `npx jest tests/unit/<file>.test.js` |
| **Full suite command** | `npm run build:dev && npx playwright test` (E2E — Build zwingend zuerst) / `npm test` (Jest) |
| **Estimated runtime** | ~15 s (einzelne Spec) / mehrere Minuten (volle E2E-Suite); Jest ~2,6 s |

---

## Sampling Rate

- **After every task commit:** Run die betroffene Spec-Datei (`npx playwright test tests/e2e/<file>.spec.js`) plus `npx jest` (schnell, fängt Jest-Regressionen aus geteilten Codepfaden)
- **After every plan wave:** Run `npm run build:dev && npx playwright test` (volle Suite) — mindestens zweimal wegen bestätigter Flakiness (Pitfall #4-Cluster)
- **Before `/gsd-verify-work`:** Volle Suite muss zweimal in Folge grün sein (Phasenziel ist Vertrauenswürdigkeit des Gates selbst)
- **Max feedback latency:** ~15 seconds (Quick-Run)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _wird vom Planner befüllt_ | — | — | TEST-01, TEST-02 | — | — | — | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Vorab bekannte Requirement→Test-Zuordnung (aus RESEARCH.md `## Validation Architecture`):

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Alle 11 bekannten E2E-Fails laufen grün | e2e | `npx playwright test` (volle Suite, 0 failed) | ✅ (Tests existieren; Fixes gehen in Source + Test-Assertions) |
| TEST-01 | Attribut-Modifier-Fix hat dedizierten Regressionstest (D-02) | unit | Neu: `npx jest tests/unit/action-registry-collisions.test.js` (o. ä.) | ❌ Wave 0 |
| TEST-01 | Global-Search-Banner-Overlap-Fix hat dedizierten Regressionstest (D-02) | e2e/unit | Neuer Test (siehe RESEARCH Pitfall 3) | ❌ Wave 0 |
| TEST-01 | `renderAll()`-Dispatch-Lücke hat Regressionstest (D-02) | e2e | Bestehender `tab-navigation.spec.js:533` genügt nach Selector-Fix | ✅ |
| TEST-02 | Suite-weite `toBe(N)`-Härtung | unit + e2e | Editier-Task per Hardening-Inventar; kein neues Kommando | N/A |
| TEST-02 | `npx playwright test` als CI-Gate grün | e2e (CI) | Neuer `e2e`-Job in `.github/workflows/ci.yml` (D-03) | ❌ Wave 0 |

---

## Wave 0 Requirements

- [ ] `tests/unit/action-registry-collisions.test.js` (o. ä.) — Unit-Test für Duplicate-`data-action`-Key-Detection (Pitfall 1, D-02)
- [ ] Regressionstest für Migration-Hint-Banner-Layout-Offset-Fix (Pitfall 3, D-02) — e2e vs. DOM-Geometrie-Unit-Test entscheidet der Planner
- [ ] `.github/workflows/ci.yml` — neuer `e2e`-Job (D-03) existiert noch nicht

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Suite-weite Assertion-Härtung (Review-Charakter) | TEST-02 | Editier-/Review-Task über Hardening-Inventar, kein einzelnes Kommando | Inventar aus RESEARCH.md `## Suite-Wide Hardening Inventory` abarbeiten; Diff-Review |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
