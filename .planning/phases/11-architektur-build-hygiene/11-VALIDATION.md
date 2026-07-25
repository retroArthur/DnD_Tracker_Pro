---
phase: 11
slug: architektur-build-hygiene
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-25
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Abgeleitet aus `11-RESEARCH.md` § "Validation Architecture" (Zeilen 398-436).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (Build)** | pytest 9.0.3 — bestehende Suite `tests/build/test_build_deduplication.py` (10 Tests, per `pytest --collect-only` nachgezählt) |
| **Framework (E2E)** | Playwright — `playwright.config.js` (Dev-Bundle, `file://`) und `playwright.smoke.config.js` (Production-Bundle, HTTP in CI) |
| **Config file (pytest)** | keine — Pfad-Discovery über `tests/build/` (weder `pytest.ini` noch `[tool.pytest]`-Sektion vorhanden) |
| **Quick run command** | `python -m pytest tests/build/ -v` |
| **Full suite command** | `python build.py && python build.py --production && python -m pytest tests/build/ && npm test && npx playwright test --config=playwright.smoke.config.js` |
| **Estimated runtime** | Quick: ~5 s · Full: mehrere Minuten (Build + Jest + Playwright) |

**Windows-Hinweis:** `PYTHONIOENCODING=utf-8` vor jedem lokalen `python build.py`-Lauf setzen (CLAUDE.md § Known Issues).

---

## Sampling Rate

- **After every task commit:** `python -m pytest tests/build/ -v` nach jeder `build.py`-Änderung, plus ein manueller `python build.py`-Lauf mit Konsolenprüfung
- **After every plan wave:** `python -m pytest tests/build/` + `npm test` + `python build.py --production` + `npx playwright test --config=playwright.smoke.config.js` gegen lokalen HTTP-Server (spiegelt den `smoke-test`-Job aus `ci.yml:85`)
- **Before `/gsd-verify-work`:** Volle Suite grün **und** ein echter CI-Lauf nach Push (die Actions-Deprecation-Warnung ist lokal nicht simulierbar)
- **Max feedback latency:** ~5 s (Build-Ebene) / ~120 s (Smoke-Ebene)

---

## Per-Task Verification Map

> Task-IDs werden vom Planer vergeben; diese Tabelle ist als Anforderungs-Ebene geseedet und wird
> von `/gsd-validate-phase` auf Task-Granularität nachgezogen.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | ARCH-01 | — | Parse-Fehler bricht Build ab statt still leere Liste zu liefern | unit (pytest) | `python -m pytest tests/build/ -k ssot` | ❌ W0 (bestehender `test_module_lists_are_synchronized` prüft die unter D-01 entfallende Funktion) | ⬜ pending |
| TBD | TBD | TBD | ARCH-01 | — | N/A | unit (pytest) | `python -m pytest tests/build/ -k missing_file` | ❌ W0 (D-02 heute ungetestet) | ⬜ pending |
| TBD | TBD | TBD | ARCH-02 | T-11-01 (Build-Time-Datei-Injection) | Quell-Duplikat → Exit ≠ 0 **und** keine Ausgabedatei geschrieben | unit (pytest) | `python -m pytest tests/build/ -k duplicate` | ⚠️ teilweise (`test_duplicate_function_check_detects_duplicate` deckt nur `function`, nicht `const`/`let`/`class`) | ⬜ pending |
| TBD | TBD | TBD | ARCH-02 | — | N/A | unit (pytest) | `python -m pytest tests/build/ -k dedup_function_marker` | ❌ W0 (ersetzt `test_no_orphaned_return_statements`) | ⬜ pending |
| TBD | TBD | TBD | ARCH-03 | T-11-02 (CI-Supply-Chain) | Action-Majors auf geprüftem Stand | CI-Log-Inspektion (dokument-verifiziert) | — kein Kommando; Nachweis über echten CI-Lauf nach Push | — | ⬜ pending |
| TBD | TBD | TBD | ARCH-03 | — | N/A | E2E (Playwright smoke) | `npx playwright test --config=playwright.smoke.config.js` | ⚠️ `tests/e2e/smoke.spec.js` existiert, braucht `response`-404- und `console`-String-Assertions (D-12) | ⬜ pending |
| TBD | TBD | TBD | ARCH-04 | — | N/A | Dokument-Verifikation | — kein Kommando; Abgleich `11-CONCERNS-TRIAGE.md` ↔ regenerierte `.planning/codebase/*.md` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/build/test_build_deduplication.py` — Test „fehlende gelistete Datei bricht Build ab" (D-02), heute nicht abgedeckt
- [ ] `tests/build/test_build_deduplication.py` — Tests für `const`/`let`/`class`-Duplikaterkennung (D-06); heute nur `function`
- [ ] `tests/build/test_build_deduplication.py` — Test „kein `[DEDUP] Removed duplicate function`-Marker im Bundle" (D-07, ersetzt `test_no_orphaned_return_statements`)
- [ ] `tests/build/test_build_deduplication.py` — `test_module_lists_are_synchronized` umschreiben (ruft eine unter D-01 entfallende Funktion auf)
- [ ] `tests/e2e/smoke.spec.js` — `page.on('response', …404)` + `page.on('console', …)`-Assertions (D-12)
- [ ] pytest-Verfügbarkeit in CI (D-03) — `requirements-dev.txt` mit gepinnter Version **oder** Inline-`pip install pytest`; heute existiert kein requirements-File (RESEARCH Open Question 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub-Actions-Workflows laufen ohne Node-Deprecation-Warnung | ARCH-03 | Job-Annotationen des Runners sind lokal nicht simulierbar; kein Playwright-/pytest-Zugriff auf CI-Logs | Nach Push: Actions-Tab öffnen, den Lauf des geänderten Workflows aufrufen, Annotations-Bereich auf „Node.js … actions are deprecated" prüfen. Ergänzend maschinennah absicherbar: kein Action-Eintrag in `ci.yml` liegt unter dem zum Zeitpunkt geprüften aktuellen Major. |
| `.planning/codebase/` bildet den Stand nach allen v1.1-Phasen ab | ARCH-04 | Reines Planungsartefakt, keine Code-Assertion möglich | Nach Map-Refresh: alle sieben Dateien auf Datum + Modulzahl (~123, nicht 92) und Erwähnung von Bestiary/PWA/Datei-Backup/Command-Palette prüfen |
| Jeder CONCERNS.md-Eintrag ist erledigt, obsolet-markiert oder als Requirement übernommen | ARCH-04 | Disposition ist eine Bewertung, kein Testergebnis | `11-CONCERNS-TRIAGE.md` gegen die 46 gezählten Ursprungseinträge abgleichen; je Disposition muss ein Beleg (Datei:Zeile, Phase oder Commit) gegen **Live-Code** stehen, nicht gegen die CONCERNS.md-Beschreibung (D-15) |

---

## Validierungs-Nuancen (aus RESEARCH.md übernommen — für Verifier und Plan-Checker)

**Erfolgskriterium 2 („verwaister Funktionskörper erzeugt Build-Fehler"):** D-05 entfernt Pass 3, statt ihn werfen zu lassen. Ein Test „Pass 3 wirft einen Fehler" existiert nach dieser Phase nicht und darf **nicht** als Lücke gewertet werden. Die zu beweisende Aussage lautet: ein Quell-Duplikat wird **vor** dem Bündeln abgefangen (Pre-Check-Exit ≠ 0, keine Ausgabedatei), und es existiert kein Pfad mehr, der ein Bundle mit stillem Orphan-Body erzeugt.

**Erfolgskriterium 5 (Map-Refresh + Triage):** ausschließlich dokument-verifizierbar. Kein automatisierter Test kann „jeder Eintrag ist disponiert" prüfen.

**Erfolgskriterium 3 (Deprecation-Warnungen):** String-Matching im CI-Log ist unzuverlässig (RESEARCH Assumption A2 — der exakte Wortlaut ist nur sekundär belegt). Belastbarer ist die Assertion „kein Action-Eintrag unter dem aktuellen Major".

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s (Build-Ebene)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
