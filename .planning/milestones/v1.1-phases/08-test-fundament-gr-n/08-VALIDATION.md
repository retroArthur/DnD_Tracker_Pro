---
phase: 8
slug: test-fundament-gr-n
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-22
validated: 2026-07-26
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

Retroaktiv abgeglichen am 2026-07-26 (validate-phase §6, State A). Der Draft war seit dem
22.07. nie nachgezogen worden, obwohl die Arbeit vollständig erledigt ist — jeder Eintrag unten
wurde gegen den Live-Code geprüft, nicht aus den SUMMARYs übernommen.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01 T1 | 08-01 | 1 | TEST-01 | unit | `npx jest tests/unit/action-registry-collisions.test.js` | ✅ 4 Tests | ✅ green |
| 08-01 T2 | 08-01 | 1 | TEST-01 | e2e | `npx playwright test tests/e2e/app.spec.js` | ✅ `app.spec.js:72` | ✅ green |
| 08-01 T3 | 08-01 | 1 | TEST-01 | e2e | `npx playwright test tests/e2e/tab-navigation.spec.js` | ✅ | ✅ green |
| 08-02 T1 | 08-02 | 2 | TEST-01 | e2e | `npx playwright test tests/e2e/tab-navigation.spec.js` | ✅ | ✅ green |
| 08-02 T2 | 08-02 | 2 | TEST-01, TEST-02 | e2e | `npx playwright test tests/e2e/crud/` | ✅ 5 Specs | ✅ green |
| 08-03 T1 | 08-03 | 3 | TEST-02 | unit + e2e | `npm test && npx playwright test` | N/A (Härtung bestehender Assertions) | ✅ green |
| 08-03 T2 | 08-03 | 3 | TEST-02 | unit + e2e | `npm test && npx playwright test` | N/A (Review-Task) | ✅ green |
| 08-04 T1 | 08-04 | 4 | TEST-02 | e2e (CI) | `.github/workflows/ci.yml` Job `e2e` (Zeile 54), blockierend über `build` → `smoke-test` → `deploy` | ✅ | ✅ green |
| 08-04 T2 | 08-04 | 4 | TEST-02 | doc | `docs/e2e-failure-triage.md` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Belegender Lauf (2026-07-26):** `npm test` → 628 passed / 27 Suiten; `npx playwright test` →
319 passed / 2 skipped. Beide Suiten enthalten sämtliche oben genannten Dateien.

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

- [x] `tests/unit/action-registry-collisions.test.js` — Unit-Test für Duplicate-`data-action`-Key-Detection (Pitfall 1, D-02). **Vorhanden, 4 Tests.**
- [x] Regressionstest für Migration-Hint-Banner-Layout-Offset-Fix (Pitfall 3, D-02). **Vorhanden als E2E:** `tests/e2e/app.spec.js:72` „Migration-Hinweis-Banner ueberdeckt #global-search nicht" — führt den geometrischen Beweis über `boundingBox()` (`searchBox.y >= bannerBox.y + bannerBox.height`) statt sich auf einen erfolgreichen Klick zu verlassen, und klickt anschließend ohne `{force:true}`.
- [x] `.github/workflows/ci.yml` — `e2e`-Job (D-03). **Vorhanden, Zeile 54**, blockierend über die Kette `build` → `smoke-test` → `deploy`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Suite-weite Assertion-Härtung (Review-Charakter) | TEST-02 | Editier-/Review-Task über Hardening-Inventar, kein einzelnes Kommando | Inventar aus RESEARCH.md `## Suite-Wide Hardening Inventory` abarbeiten; Diff-Review |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — alle drei Posten existieren, siehe oben
- [x] No watch-mode flags
- [x] Feedback latency < 30s (Einzel-Spec ~15 s, Jest ~2 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-26

---

## Validation Audit 2026-07-26

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Kein `gsd-nyquist-auditor` nötig: die Gap-Analyse ergab keine offenen Posten, deshalb greift der
Kurzschluss aus Schritt 3 des Workflows („No gaps → skip to Step 6, set `nyquist_compliant: true`").

**Was tatsächlich fehlte, war nur der Abgleich.** Die Datei stand seit dem 22.07. auf `draft`, weil
`plan-phase` sie angelegt und `validate-phase` sie nie nachgezogen hat. Alle drei Wave-0-Posten waren
zu diesem Zeitpunkt längst umgesetzt — der Draft beschrieb einen Zustand, den die Phase bereits
hinter sich gelassen hatte. Genau diese Konstellation meint `audit-milestone` §5.5 mit
NOT-VALIDATED statt PARTIAL: `nyquist_compliant: false` war hier nie ein Befund, sondern nur ein
nicht gepflegter Zähler.
