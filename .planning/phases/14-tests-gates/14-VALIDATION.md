---
phase: "14"
slug: "tests-gates"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-06"
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Abgeleitet aus `14-RESEARCH.md` § Validation Architecture (Messwerte dieser Sitzung, 2026-09-06).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (Unit)** | Jest `^30.2.0` |
| **Framework (E2E)** | Playwright `@playwright/test` 1.57.0 |
| **Framework (Build)** | pytest (`tests/build/`) |
| **Config file** | `jest.config.cjs`, `playwright.config.js`, `eslint.config.js`, `tsconfig.json` |
| **Quick run command (Unit)** | `npx jest tests/unit/<datei>.test.js` |
| **Quick run command (E2E)** | `npx playwright test tests/e2e/<pfad>/<datei>.spec.js` |
| **Full suite command** | `npx jest && npx eslint . && npx tsc --noEmit` (E2E separat, siehe unten) |
| **Full E2E command** | `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` |
| **Estimated runtime** | Unit ~60 s (43 Suiten / 1109 Tests) · E2E mehrere Minuten (Build-Schritt zwingend vorgeschaltet) |

**Neu in dieser Phase:** `npx tsc -p tsconfig.strict.json` (D-11) — existiert zu Phasenbeginn nicht, siehe Wave 0.

---

## Sampling Rate

- **After every task commit:** Der jeweilige Quick-Run-Befehl aus der Verification Map; zusätzlich `npx eslint .` nach jeder Änderung aus D-07/D-08/D-09/D-10 (die Lint-Konfiguration ist in dieser Phase selbst Gegenstand der Arbeit — ein Task, der sie anfasst, ohne sie zu fahren, misst nichts).
- **After every plan wave:** `npx jest` + `npx eslint .` + `npx tsc --noEmit` + `npx tsc -p tsconfig.strict.json` (sobald aus Wave 0 vorhanden).
- **Before `/gsd-verify-work`:** Alle Suiten grün — `npx jest`, `npx eslint .`, `npx tsc --noEmit`, `npx tsc -p tsconfig.strict.json`, `python -m pytest tests/build/`, und `PYTHONIOENCODING=utf-8 python build.py && npx playwright test`.
- **Max feedback latency:** ~60 s für den Unit-/Lint-/Typecheck-Pfad; der E2E-Pfad liegt darüber und wird deshalb nicht pro Task, sondern pro Wave gefahren.

---

## Per-Task Verification Map

> Seeded by plan-phase — Task-IDs werden erst durch die PLAN.md-Dateien vergeben.
> `/gsd-validate-phase` füllt diese Tabelle gegen die fertigen Pläne.

Vorab feststehende Requirement-Ebene (aus `14-RESEARCH.md`):

| Requirement | Behavior | Test Type | Automated Command | File Exists |
|-------------|----------|-----------|-------------------|-------------|
| TEST-03 | `seedCleanSession(page)` von allen 5 CRUD-Specs aufgerufen; Toast-Race unter Volllast nicht reproduzierbar | E2E, Wiederholungslauf | `npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js --repeat-each=20 --workers=8 --retries=0` | ❌ W0 |
| TEST-04 | 26 E2E- und 37 Unit-Tests über je 5 neue Dateien, Summen unverändert | Unit + E2E, Zählprobe | `npx jest tests/unit/{session-prep,npc-generator,timeline,reise,fraktionen}.test.js` · `npx playwright test tests/e2e/features/{session-prep,npc-generator,timeline,reise,fraktionen}.spec.js` | ❌ W0 |
| TEST-05 (Lint) | 0 Fehler, `no-undef: error`, `--max-warnings` als Ratsche | Statisch | `npm run lint` | ✅ Skript vorhanden, Konfiguration ändert sich |
| TEST-05 (Typecheck) | Allowlist grün unter `checkJs: true` | Statisch | `npm run typecheck:strict` | ❌ W0 |
| TEST-05 (Coverage-Gate) | Jedes `loader.js MODULES`-Modul hat eine Testerwähnung, außer datierter Ausnahmeliste | Unit, statischer Wächter | `npx jest tests/unit/module-test-coverage.test.js` | ❌ W0 |
| TEST-05 (Coverage-Ratsche) | `utils/testable-utils.js` bleibt über der angehobenen Schwelle | Unit, Coverage-Threshold | `npx jest --coverage` | ✅ Mechanismus vorhanden, Werte werden angehoben |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/helpers/test-utils.js` — Export `seedCleanSession(page)` fehlt (TEST-03 / D-01)
- [ ] `tools/generate-eslint-globals.js` + eingechecktes Globals-Artefakt — Generator und Ausgabe fehlen (TEST-05 / D-08)
- [ ] `tests/unit/eslint-globals-freshness.test.js` — Drift-Wächter gegen `loader.js MODULES` fehlt (TEST-05 / D-08)
- [ ] `tests/unit/module-test-coverage.test.js` — Modul-zu-Test-Gate fehlt (TEST-05 / D-13)
- [ ] `tsconfig.strict.json` + npm-Skript `typecheck:strict` — fehlen (TEST-05 / D-11)
- [ ] Fünf neue Unit- und fünf neue E2E-Testdateien (Session-Prep, NPC-Generator, Timeline, Reise, Fraktionen) — fehlen (TEST-04 / D-04)
- [ ] `jest.config.cjs` `roots`-Reparatur — noch nicht angewendet (TEST-05 / D-12)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Falsifikationsprobe der Toast-Race gegen den **ungefixten** Stand | TEST-03 / D-02 | Der Nachweis verlangt einen roten Vorlauf: reproduziert der Lastlauf die Race vor dem Fix nicht, beweist der grüne Nachlauf nichts. Das ist ein einmaliger, protokollierter Vergleich zweier Codestände, kein wiederholbarer Regressionstest. | 1. Auf dem Stand **vor** dem Seed-Fix den Befehl aus der Verification Map fahren, Ausgabe protokollieren. 2. Ist er grün, Last erhöhen (`--repeat-each`, `--workers`) oder Verfahren wechseln, bis rot. 3. Fix anwenden. 4. Denselben Befehl erneut fahren, Ausgabe protokollieren. 5. Beide Protokolle als Artefakt ablegen (Muster: `13-PERF-MEASUREMENT.md`). |
| Entscheidung je totem Aktionsziel: Registrierung entfernen vs. echter Bedienfehler | TEST-05 / D-09 | Die Regel aus D-09 verlangt eine Prüfung gegen `assets/templates/**` und danach ein Urteil. Der Research hat für `export-csv` bereits belegt, dass ein echter Knopf darauf zeigt — das ist ein Befund, kein Aufräumposten, und die Behandlung unterscheidet sich je Fundstelle. | Je Fundstelle: `grep -rn "data-action=\"<aktion>\"" assets/templates/` · kein Treffer → Registrierung entfernen · Treffer → Funktion fehlt, echter Fehler, Behebung statt Löschung. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (Unit/Lint/Typecheck-Pfad)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
