---
phase: 10
slug: security-h-rtung
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-25
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (`jest.config.cjs`, Unit) + Playwright (`playwright.config.js`, Chromium-only, E2E gegen `file:///…/dist/dnd-tracker-bundled.html`) |
| **Config file** | `jest.config.cjs`, `playwright.config.js` |
| **Quick run command** | `npx jest tests/unit/security.test.js` bzw. `npx playwright test tests/e2e/features/editor-insert.spec.js` |
| **Full suite command** | `npm test` (Jest) + `python build.py && npx playwright test` (Playwright — Build zwingend zuerst) |
| **Estimated runtime** | Jest ~3–10 s; einzelne Playwright-Spec ~15–30 s (nach Build); volle E2E-Suite mehrere Minuten |

---

## Sampling Rate

- **After every task commit:** Run `npx jest tests/unit/` (schnell, kein Build nötig) + betroffene Playwright-Spec-Datei gezielt (`python build.py && npx playwright test tests/e2e/features/<spec>.js`)
- **After every plan wave:** Run `python build.py && npx playwright test` (volle Suite — Doppel-Grün-Muster aus `09-BASELINE.md`)
- **Before `/gsd-verify-work`:** Volle Suite grün (Jest + Playwright) VOR dem `/gsd-secure-phase`-Abschluss-Audit (D-11: Fixes zuerst, Audit als letzter Schritt)
- **Max feedback latency:** ~30 seconds (Quick-Run einer einzelnen Spec-Datei nach Build)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-XX-XX | TBD | TBD | SEC-01 | CR-01 | `sanitizeHTML()` entfernt Review-Exploit-Vektor (`<img onerror>`) | unit (vm.runInContext gegen `utils/basic.js`) | `npx jest tests/unit/security.test.js` | ⚠ existiert, testet bisher nur `testable-utils.js` — vm-Block W0 | ⬜ pending |
| 10-XX-XX | TBD | TBD | SEC-01 | CR-01 | Import bösartiger Kampagnen-JSON → Wiki öffnen → kein Skript-Execute | e2e | `npx playwright test tests/e2e/features/import-security.spec.js` | ❌ W0 | ⬜ pending |
| 10-XX-XX | TBD | TBD | SEC-01 | CR-01/Pitfall 2 | `importDataGlobal()` sanitisiert in BEIDEN Zweigen (neu + überschreiben) | unit (vm.runInContext) | `npx jest tests/unit/import-sanitization.test.js` | ❌ W0 | ⬜ pending |
| 10-XX-XX | TBD | TBD | SEC-01 | Broken-Windows #1 | Paste eines Tabellen-Payloads mit `onerror` wird bereinigt (D-05/D-16) | e2e | `npx playwright test tests/e2e/features/editor-insert.spec.js` | ✅ (T-09-01 wird erweitert, begründungspflichtig) | ⬜ pending |
| 10-XX-XX | TBD | TBD | SEC-01 | — | `<strike>` überlebt Speichern/Reload-Roundtrip (D-06) | e2e | `npx playwright test tests/e2e/features/editor-formatting.spec.js` | ⚠ Teil des eingefrorenen Phase-9-Netzes — Änderung begründungspflichtig | ⬜ pending |
| 10-XX-XX | TBD | TBD | SEC-01 | — | `testable-utils.js` vs. `utils/basic.js` Paritäts-Vektor-Set (D-14) | unit | `npx jest tests/unit/sanitizer-parity.test.js` | ❌ W0 | ⬜ pending |
| 10-XX-XX | TBD | TBD | SEC-02 | — | `/gsd-secure-phase` über Phasen 1, 2, 9, 10 → `SECURITY.md` mit `threats_open: 0` | manual/agent-driven | `/gsd-secure-phase` (eigenes GSD-Kommando) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — Task-IDs werden nach der Planerstellung von validate-phase konkretisiert.*

---

## Wave 0 Requirements

- [ ] `tests/e2e/features/import-security.spec.js` — vollständiger Exploit-Ketten-Beweis (Datei-Import → Wiki öffnen → kein Skript-Execute), D-13/D-15
- [ ] `tests/unit/import-sanitization.test.js` — Import-Sanitisierung inkl. beider `importDataGlobal()`-Zweige (Pitfall 2), D-14
- [ ] `tests/unit/sanitizer-parity.test.js` — Paritätstest `utils/basic.js` vs. `utils/testable-utils.js` über gemeinsames Vektor-Set, D-14
- [ ] Erweiterung `tests/unit/security.test.js` um vm.runInContext-Block gegen den ECHTEN `utils/basic.js`-Quelltext (bisher ausschließlich `testable-utils.js`)

*(Bereits vorhanden und wiederverwendbar: `tests/e2e/features/editor-insert.spec.js` mit T-09-01 als Referenzmuster; `tests/unit/storage-conflict.test.js` als vm.runInContext-Vorlage, D-14)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Abschluss-Audit über die vier Angriffsflächen (Import/Export, Storage/IDB, Datei-Backup, Rich-Text/innerHTML) | SEC-02 | `/gsd-secure-phase` ist ein agent-getriebenes GSD-Kommando, kein Jest/Playwright-Lauf | `/gsd-secure-phase` gegen Phasen 1, 2, 9, 10 laufen lassen; Ergebnis speist `SECURITY.md` mit `threats_open: 0` (D-09..D-12) |
| Wiki-TOC-Sprunglinks nach Sanitizer-Umordnung (Pitfall 1: `id="toc-N"`-Anker) | SEC-01 | Sofern kein automatisierter Regressionstest im Plan ergänzt wird (offene Forschungsfrage 2) | Wiki-Eintrag mit ≥3 Überschriften öffnen → TOC-Link klicken → Seite springt zum Abschnitt |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
