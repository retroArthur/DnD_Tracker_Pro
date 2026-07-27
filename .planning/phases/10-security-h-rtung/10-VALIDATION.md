---
phase: 10
slug: security-h-rtung
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-25
validated: 2026-07-26
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

Retroaktiv abgeglichen am 2026-07-26 (validate-phase §6, State A). Jeder Eintrag wurde gegen den
Live-Code bzw. das Artefakt geprüft, nicht aus den SUMMARYs übernommen.

| Plan | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01/03/04 | SEC-01 | CR-01 | `sanitizeHTML()` entfernt Review-Exploit-Vektor (`<img onerror>`) | unit (`vm.runInContext` gegen `utils/basic.js`) | `npx jest tests/unit/security.test.js` | ✅ vm-Block ab `security.test.js:489` | ✅ green |
| 10-01/03/04 | SEC-01 | CR-01 | Import bösartiger Kampagnen-JSON → Wiki öffnen → kein Skript-Execute | e2e | `npx playwright test tests/e2e/features/import-security.spec.js` | ✅ 8 Tests | ✅ green |
| 10-01/03/04 | SEC-01 | CR-01/Pitfall 2 | `importDataGlobal()` sanitisiert in BEIDEN Zweigen | unit | `npx jest tests/unit/import-sanitization.test.js` | ✅ 16 Tests | ✅ green |
| 10-03 | SEC-01 | Broken-Windows #1 | Paste eines Tabellen-Payloads mit `onerror` wird bereinigt (D-05/D-16) | e2e | `npx playwright test tests/e2e/features/editor-insert.spec.js` | ✅ 13 Tests | ✅ green |
| 10-04 | SEC-01 | — | `<strike>` überlebt Speichern/Reload-Roundtrip (D-06) | e2e | `npx playwright test tests/e2e/features/editor-formatting.spec.js` | ✅ (Phase-9-Netz, `strike` in `allowedTags` beider Sanitizer-Kopien) | ✅ green |
| 10-06 | SEC-01 | — | Paritäts-Vektor-Set `testable-utils.js` vs. `utils/basic.js` (D-14) | unit | `npx jest tests/unit/sanitizer-parity.test.js` | ✅ 5 Tests | ✅ green |
| 10-05/06/07 | SEC-02 | — | `/gsd-secure-phase` über Phasen 1, 2, 9, 10 → je `SECURITY.md` mit `threats_open: 0` | agent-driven | `/gsd-secure-phase` | ✅ 4 Dateien | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Belegender Lauf (2026-07-26):** `npm test` → 628 passed / 27 Suiten; `npx playwright test` →
319 passed / 2 skipped.

**SEC-02 ist entgegen dem ersten Eindruck belegt.** Das Milestone-Audit hatte SEC-02 als „schwach
nachverfolgbar" markiert, weil die Traceability-Tabelle jenseits von „weitere Sicherheits-Altlasten"
kein benanntes Artefakt nennt. Der Nachweis existiert sehr wohl, nur an anderer Stelle: alle vier
geforderten `*-SECURITY.md` liegen vor und tragen jeweils `status: verified` und `threats_open: 0` —
`01-stabilisierung`, `02-technik-fundament`, `09-editor-regressionsnetz-execcommand-abl-sung`,
`10-security-h-rtung`. Damit ist das Abschluss-Audit über die vier Angriffsflächen (Import/Export,
Storage/IDB, Datei-Backup, Rich-Text/innerHTML) gefahren und dokumentiert.

---

## Wave 0 Requirements

- [x] `tests/e2e/features/import-security.spec.js` — Exploit-Ketten-Beweis (Datei-Import → Wiki öffnen → kein Skript-Execute), D-13/D-15. **Vorhanden, 8 Tests.**
- [x] `tests/unit/import-sanitization.test.js` — Import-Sanitisierung inkl. beider `importDataGlobal()`-Zweige (Pitfall 2), D-14. **Vorhanden, 16 Tests.**
- [x] `tests/unit/sanitizer-parity.test.js` — Paritätstest `utils/basic.js` vs. `utils/testable-utils.js`, D-14. **Vorhanden, 5 Tests** über ein gemeinsames Vektor-Set; die eine bekannte Abweichung (`esc(0)`) ist explizit festgeschrieben statt versteckt.
- [x] Erweiterung `tests/unit/security.test.js` um einen `vm.runInContext`-Block gegen den ECHTEN `utils/basic.js`-Quelltext. **Vorhanden ab Zeile 489**, lädt `utils/basic.js` per `vm.runInContext` (Zeile 510-512) — die Tests laufen damit gegen den Produktionsquelltext, nicht mehr nur gegen `testable-utils.js`.

*(Bereits vorhanden und wiederverwendbar: `tests/e2e/features/editor-insert.spec.js` mit T-09-01 als Referenzmuster; `tests/unit/storage-conflict.test.js` als vm.runInContext-Vorlage, D-14)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Abschluss-Audit über die vier Angriffsflächen (Import/Export, Storage/IDB, Datei-Backup, Rich-Text/innerHTML) | SEC-02 | `/gsd-secure-phase` ist ein agent-getriebenes GSD-Kommando, kein Jest/Playwright-Lauf | `/gsd-secure-phase` gegen Phasen 1, 2, 9, 10 laufen lassen; Ergebnis speist `SECURITY.md` mit `threats_open: 0` (D-09..D-12) |
| Wiki-TOC-Sprunglinks nach Sanitizer-Umordnung (Pitfall 1: `id="toc-N"`-Anker) | SEC-01 | Sofern kein automatisierter Regressionstest im Plan ergänzt wird (offene Forschungsfrage 2) | Wiki-Eintrag mit ≥3 Überschriften öffnen → TOC-Link klicken → Seite springt zum Abschnitt |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — alle vier Posten erfüllt, siehe oben
- [x] No watch-mode flags
- [x] Feedback latency < 30s (Jest ~3–10 s, Einzel-Spec nach Build ~15–30 s)
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

Dritter Fall desselben Musters nach den Phasen 8 und 9: die Datei stand seit dem 25.07. auf `draft`,
die Per-Task-Karte trug `10-XX-XX`-Platzhalter, alle vier Wave-0-Posten galten als offen — während
die zugehörigen Tests längst existierten und grün liefen. Nicht gepflegter Zähler, kein Befund.

**Ein Ergebnis dieses Abgleichs geht über die Phase hinaus:** der im Milestone-Audit vermerkte
Punkt „SEC-02 hat kein eigenes benanntes Artefakt, Integration-Check konnte keinen von SEC-01
unterscheidbaren Pfad nachverfolgen" ist damit beantwortet. Das Artefakt existiert — es steht nur
nicht in der Traceability-Tabelle, sondern in vier `*-SECURITY.md` mit `threats_open: 0`. Der Befund
war eine Lücke in der Nachverfolgbarkeit, nicht in der Sache.
