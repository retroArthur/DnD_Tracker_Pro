---
phase: 1
slug: stabilisierung
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **Framework**          | Jest 30.2.0 (Unit) · Playwright 1.57.0 (E2E/Smoke) · pytest (Build)                       |
| **Config file**        | `jest.config.cjs`, `playwright.config.js` (+ neues `playwright.smoke.config.js` — Wave 0) |
| **Quick run command**  | `npx jest tests/unit/stability.test.js --no-coverage`                                     |
| **Full suite command** | `npm test && python -m pytest tests/build/ -v`                                            |
| **Estimated runtime**  | Quick ~10 s · Full ~60 s                                                                  |

---

## Sampling Rate

- **After every task commit:** Run `npx jest tests/unit/stability.test.js --no-coverage`
- **After every plan wave:** Run `npm test && python -m pytest tests/build/ -v`
- **Before `/gsd-verify-work`:** Full suite must be green + `npm run check` + `npx playwright test tests/e2e/smoke.spec.js`
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

> Task-IDs werden vom Planner vergeben; Zeilen sind nach Requirement vorbefüllt (aus RESEARCH.md → Validation Architecture).

| Task ID | Plan | Wave | Requirement          | Threat Ref | Secure Behavior                       | Test Type      | Automated Command                                                                      | File Exists    | Status     |
| ------- | ---- | ---- | -------------------- | ---------- | ------------------------------------- | -------------- | -------------------------------------------------------------------------------------- | -------------- | ---------- |
| TBD     | TBD  | TBD  | STAB-01              | —          | N/A                                   | e2e-smoke      | `npx playwright test tests/e2e/smoke.spec.js`                                          | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-02              | —          | N/A                                   | unit           | `npx jest tests/unit/stability.test.js -t "mindmap"`                                   | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-03              | —          | N/A                                   | build (pytest) | `python -m pytest tests/build/ -v`                                                     | ✅ (erweitern) | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-04              | —          | N/A                                   | lint/type      | `npm run check`                                                                        | ✅             | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-05              | —          | N/A                                   | unit           | `npx jest tests/unit/stability.test.js -t "5MB"`                                       | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-05 (D-07)       | —          | esc() für Nutzer-Strings im Dialog    | unit           | `npx jest tests/unit/stability.test.js -t "conflict"`                                  | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-06              | —          | N/A                                   | unit           | `npx jest tests/unit/stability.test.js -t "export version"`                            | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-06 (Legacy)     | —          | Import-Felder sanitisiert (bestehend) | unit           | `npx jest tests/unit/stability.test.js -t "legacy stamp"`                              | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-07 (DEBUG_MODE) | —          | Kein Debug-Code in Production         | pytest         | `python -m pytest tests/build/ -v -k "debug_mode"`                                     | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-07 (Duplikate)  | —          | N/A                                   | pytest         | `python -m pytest tests/build/ -v -k "duplicate"`                                      | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-07 (Sync)       | —          | N/A                                   | pytest         | `python -m pytest tests/build/ -v -k "sync"`                                           | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-08              | —          | N/A                                   | e2e-smoke      | `npx playwright test tests/e2e/smoke.spec.js`                                          | ❌ W0          | ⬜ pending |
| TBD     | TBD  | TBD  | STAB-10              | —          | N/A                                   | check          | `node -e "const p=require('./package.json'); if(p.license!=='MIT') throw new Error()"` | —              | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `tests/e2e/smoke.spec.js` — neu erstellen, deckt STAB-01, STAB-08 (Boot-Check + 6-Tab-Sweep)
- [ ] `playwright.smoke.config.js` — Smoke-Config (HTTP-Server-baseURL für CI, file://-Fallback lokal)
- [ ] `tests/unit/stability.test.js` — erweitern um STAB-05 (>5MB-Mock-Roundtrip), STAB-06 (Export-Version + Legacy-Stempel), STAB-02 (Migration), D-07 (Konflikt-Logik)
- [ ] `tests/build/test_build_deduplication.py` — erweitern um DEBUG_MODE-Assertion, Pre-Build-Duplikat-Check, Modullisten-Sync-Check
- [ ] `docs/srd-license.md` — neu erstellen (STAB-11 Dokumentations-Artefakt)

---

## Manual-Only Verifications

| Behavior                                   | Requirement     | Why Manual                                                                                     | Test Instructions                                                                              |
| ------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run build` läuft auf Windows          | STAB-09         | Plattform-spezifisch; CI ist Ubuntu                                                            | `npm run build:dev` lokal auf Windows ausführen, Exit-Code 0 prüfen                            |
| file://-Doppelklick lädt App in allen Tabs | STAB-01/STAB-03 | Browser-Doppelklick nicht CI-automatisierbar (localStorage-Limits unter file:// in Playwright) | `dist/dnd-tracker-bundled.html` per Doppelklick öffnen, Konsole prüfen, alle Tabs durchklicken |
| SRD-Lizenzbefund inhaltlich korrekt        | STAB-11         | Rechtsbewertung erfordert menschliche Prüfung                                                  | `docs/srd-license.md` lesen, Attribution in README/LICENSE sichten                             |
| Doku-Faktenkorrektur vollständig           | STAB-10         | Faktenabgleich Doku vs. Code ist semantisch                                                    | Stichproben: Inline-Handler-Zahl, Campaign-Index-Key, tote Verweise                            |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
