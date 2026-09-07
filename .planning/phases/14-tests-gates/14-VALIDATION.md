---
phase: "14"
slug: "tests-gates"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: false
wave_0_complete: true
created: "2026-09-06"
validated: "2026-09-07"
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

> Gefuellt durch `/gsd-validate-phase` am 2026-09-07 gegen die neun fertigen Plaene.
> Alle Statuswerte unten wurden in dieser Sitzung frisch gemessen, nicht aus den
> SUMMARY-Dateien uebernommen.

| Requirement | Behavior | Test Type | Automated Command | Status | Gemessen |
|-------------|----------|-----------|-------------------|--------|----------|
| TEST-03 | `seedCleanSession(page)` von allen 5 CRUD-Specs aufgerufen; Toast-Race unter Volllast nicht reproduzierbar | E2E, Wiederholungslauf | `npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js --repeat-each=20 --workers=8 --retries=0` | PARTIAL | 380/380 gruen (4.1 min). Lastlauf gruen, aber siehe Restposten NQ-04 |
| TEST-04 | 26 E2E- und 37 Unit-Tests ueber je 5 neue Dateien, Summen unveraendert | Unit + E2E, Zaehlprobe | `npx jest tests/unit/{session-prep,npc-generator,timeline,reise,fraktionen}.test.js` und `npx playwright test tests/e2e/features/{...}.spec.js` | PARTIAL | 37/37 Unit + 26/26 E2E gruen, Summen exakt wie vertraglich. Siehe Restposten NQ-05 |
| TEST-05 (Lint) | 0 Fehler, `no-undef: error`, `--max-warnings` als Ratsche | Statisch | `npm run lint` | COVERED | 0 Fehler / 367 Warnungen, Exit 0. `eslint.config.js:128` setzt `no-undef` auf `error`. Laeuft in CI |
| TEST-05 (Typecheck) | Allowlist gruen unter `checkJs: true` | Statisch | `npm run typecheck:strict` | COVERED | Exit 0. Laeuft in CI (Job `lint-and-typecheck`) |
| TEST-05 (Coverage-Gate) | Jedes `loader.js MODULES`-Modul hat eine Testerwaehnung, ausser datierter Ausnahmeliste | Unit, statischer Waechter | `npx jest tests/unit/module-test-coverage.test.js` | COVERED | 4/4 gruen; Regressionsbeweis in `14-VERIFICATION.md` (fiktives Modul in `loader.js` -> Gate sofort rot) |
| TEST-05 (Coverage-Ratsche) | `utils/testable-utils.js` bleibt ueber der angehobenen Schwelle | Unit, Coverage-Threshold | `npm run test:coverage` | COVERED | 92.81/89.28/100/94.44 gegen Schwellen 92/89/99/94, Exit 0. **Gap NQ-01 geschlossen: laeuft jetzt in CI** |
| TEST-05 (D-09) | Jeder `ALLOWED_CHANGE_HANDLERS`-Eintrag benennt einen deklarierten Bezeichner | Unit, statischer Waechter | `npx jest tests/unit/action-target-integrity.test.js` | COVERED | 2/2 gruen; Mutationsbeweis unabhaengig reproduziert (toter Eintrag -> rot, zurueck -> gruen). **Gap NQ-02 geschlossen** |
| D-08 (Globals-Drift) | `eslint.generated-globals.js` bleibt gegenueber `loader.js MODULES` frisch | Unit, Drift-Waechter | `npx jest tests/unit/eslint-globals-freshness.test.js` | COVERED | gruen; laeuft in CI ueber den `test`-Job |

*Status: COVERED = automatisiert, laeuft gruen, faengt Regression - PARTIAL = Test existiert, deckt aber nicht die volle Aussage - MISSING = keine Automatisierung*

---

## Wave 0 Requirements

- [x] `tests/e2e/helpers/test-utils.js` - Export `seedCleanSession(page)` (TEST-03 / D-01) - vorhanden (Zeile 59), in allen 5 CRUD-Specs verdrahtet
- [x] `tools/generate-eslint-globals.js` + eingechecktes Globals-Artefakt (TEST-05 / D-08) - beide vorhanden
- [x] `tests/unit/eslint-globals-freshness.test.js` - Drift-Waechter (TEST-05 / D-08) - vorhanden, gruen
- [x] `tests/unit/module-test-coverage.test.js` - Modul-zu-Test-Gate (TEST-05 / D-13) - vorhanden, 4/4 gruen
- [x] `tsconfig.strict.json` + npm-Skript `typecheck:strict` (TEST-05 / D-11) - vorhanden, Exit 0
- [x] Fuenf neue Unit- und fuenf neue E2E-Testdateien (TEST-04 / D-04) - alle 10 vorhanden, Sammeldateien entfernt
- [x] `jest.config.cjs` `roots`-Reparatur (TEST-05 / D-12) - angewendet

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Stand 2026-09-07 |
|----------|-------------|------------|------------------|
| Falsifikationsprobe der Toast-Race gegen den **ungefixten** Stand | TEST-03 / D-02 | Der Nachweis verlangt einen roten Vorlauf gegen einen anderen Codestand. Einmaliger, protokollierter Vergleich zweier Codestaende, kein wiederholbarer Regressionstest. | **ERLEDIGT.** Protokoll `14-TOAST-RACE-MEASUREMENT.md`; menschliche Freigabe am 2026-09-07 erteilt (`14-UAT.md`, Test 1 = pass). Bleibt legitim manual-only. |
| Entscheidung je totem Aktionsziel: Registrierung entfernen vs. echter Bedienfehler | TEST-05 / D-09 | Urteil je Fundstelle gegen `assets/templates/**`. | **NICHT MEHR MANUAL-ONLY.** Der manuelle Sweep aus 14-06 war datei-lokal und hat `populateImportNodesList` uebersehen (tot in der Whitelist, in beide dist-Bundles ausgeliefert). Die stehende Invariante ist jetzt durch `tests/unit/action-target-integrity.test.js` mechanisiert; nur ein **neuer** Fund braucht noch ein menschliches Urteil. |

---

## Offene Nyquist-Restposten (Audit 2026-09-07)

> Ergebnis des Audits: 11 Luecken gefunden, 2 Blocker auf Nutzerentscheidung geschlossen,
> 9 bewusst als datierte Restposten offen gelassen. `nyquist_compliant` bleibt deshalb `false`
> (= PARTIAL nach audit-milestone Abschnitt 5.5). Diese Liste ist der Eingang fuer einen
> spaeteren Aufraum-Plan, keine Blockade dieser Phase.

| ID | Requirement | Typ | Befund | Schwere |
|----|-------------|-----|--------|---------|
| NQ-01 | TEST-05 (Coverage-Ratsche) | MISSING | **GESCHLOSSEN 2026-09-07.** Der Gate lief nirgends: `collectCoverage: false`, `jest --coverage` nur im nie aufgerufenen Skript `test:coverage`, CI fuhr blankes `npm test`. Behoben: `ci.yml` faehrt jetzt `npm run test:coverage`. | ~~blocker~~ |
| NQ-02 | TEST-05 / D-09 | MANUAL-ONLY | **GESCHLOSSEN 2026-09-07.** `populateImportNodesList` stand tot in `ALLOWED_CHANGE_HANDLERS` und ging in beide dist-Bundles; `14-06-SUMMARY.md` D1 behauptete das Gegenteil. Behoben: Eintrag entfernt + `action-target-integrity.test.js` als stehender Waechter. | ~~blocker~~ |
| NQ-03 | TEST-05 (alle Ratschen) | MISSING | `--max-warnings 367`, die `tsconfig.strict`-Include-Liste und `MODULE_TEST_EXCEPTIONS` sind reine Prosa-Regeln. Alle drei lassen sich mit einer Zeile lockern, ohne dass ein Gate anschlaegt; zwei haben sich bereits gegen die eigene Vorschrift bewegt (17 auf 8 Dateien, 78 auf 86 Ausnahmen). Auch `no-undef: error` ist ungesichert: auf `off` gedreht bleibt Exit 0, weil es aktuell 0 Funde gibt. | major |
| NQ-04 | TEST-03 (Strukturhaelfte) | PARTIAL | Dass alle 5 CRUD-Specs `seedCleanSession` aufrufen, behauptet kein Test. Nur `encounters.spec.js:134` (`toBeVisible()`) erkennt die Race - `locations`/`quests` pruefen nur `toContainText` (sichtbarkeitsblind), `npcs`/`party` nur `waitForSelector`. Die Aufrufe in 4 von 5 Specs sind loeschbar, ohne dass etwas rot wird. Zusaetzlich hat die Seed-Payload keine automatisierte Kopplung an `core/data.js` und `render/helpers.js` (WR-02 dokumentiert die Luecke selbst). | major |
| NQ-05 | TEST-04 | PARTIAL | Die Zahlen 37/26 sind nirgends asserted; ein vollstaendiger Revert des Splits liesse CI gruen, weil CI musterweit (`npm test`, `npx playwright test`) statt dateiweise faehrt. Die Unit-Haelfte testet Inline-Nachbauten statt der Produktionsmodule - alle elf Welt-Module stehen auf `MODULE_TEST_EXCEPTIONS`. Die E2E-Haelfte traegt echten Regressionswert. | major |
| NQ-06 | TEST-05 (Baseline) | MISSING | `14-GATE-BASELINE.md` ist die gepinnte Vergleichsbasis von vier Folgeplaenen, wird von keinem Test gelesen und ist in mindestens fuenf Zahlen veraltet (78 vs 86 Ausnahmen, 1116 vs 1120 Tests, 17 vs 8 Dateien in `tsconfig.strict`, 30 vs 28 Ladepfade). | major |
| NQ-07 | TEST-05 + D-08 | PARTIAL | Beide stehenden Gates leiten ihren Gegenstand aus demselben `extractModulesFromLoader()` ab, abgesichert nur durch `modules.length > 0`. Ein teilkaputtes Regex, das 3 statt 134 Module liefert, entschaerft **beide** Gates gleichzeitig, ohne rot zu werden. Die erwartete Modulzahl ist nirgends gepinnt. | major |
| NQ-08 | TEST-05 / D-12 | MISSING | Die `roots`-Reparatur hat kein eigenes Gate. Ein Revert auf `['<rootDir>/tests']` bleibt unentdeckt: die Testfindung ist beweisbar identisch, und `utils/testable-utils.js` war laut `14-GATE-BASELINE.md` Lauf A schon vor dem Fix mit denselben Werten instrumentiert - die einzige vorhandene Schwelle haelt also auch mit kaputten `roots`. | major |
| NQ-09 | TEST-05 (`npm run check`) | PARTIAL | `npm run check` ist deklariertes Akzeptanzkriterium von 14-06 Task 3 und 14-07 Task 2 und ist **rot**: `format:check` meldet Stilprobleme in 132 Dateien (Exit 1). CI faehrt `format:check` ueberhaupt nicht. Die Formatierungsschuld wurde ohne Tracking-ID auf eine spaetere Runde verschoben. | major |
| NQ-10 | D-08 (Globals) | PARTIAL | Der Frische-Waechter vergleicht nur Schluesselmengen - die `readonly`/`writable`-Unterscheidung (Ausloeser waren 22 echte `no-global-assign`-Fehler) driftet unbemerkt. `renderGlobalsArtifact` wird von keinem Test importiert; die CLI-Schreibverzweigung und die Existenz des npm-Skripts `globals:generate` sind ungetestet. | minor |
| NQ-11 | TEST-05 (Lint-Reichweite) | PARTIAL | `sw.js` ist die einzige Quelldatei, die ESLint nie sieht - ausgerechnet der Service Worker, den `build.py` ausliefert und der der Offline-Einstiegspunkt ist. Der Ausschluss ist nirgends als datierte, begruendete Ausnahme erfasst (anders als `MODULE_TEST_EXCEPTIONS` und die `tsconfig.strict`-Include-Liste). | minor |

---

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Requirements geprueft | 8 |
| COVERED | 6 |
| PARTIAL | 2 (TEST-03, TEST-04) |
| MISSING | 0 |
| Luecken gefunden | 11 |
| Geschlossen | 2 (beide Blocker) |
| Als datierter Restposten offen | 9 |

**Methode:** 26 parallele Audit-Agenten (Plan-Mapping, adversarielle Artefaktpruefung je Plan,
Requirement-Klassifikation, Vollstaendigkeitskritiker) plus eigene Messlaeufe des Orchestrators
fuer jedes Gate. Beide Blocker wurden vor der Behebung unabhaengig gegen den Live-Baum bestaetigt,
der neue Waechter danach unabhaengig per Mutation (rot -> gruen) nachgeprueft.

**Neue Artefakte dieses Audits:**

- `tests/unit/action-target-integrity.test.js` (neu)
- `.github/workflows/ci.yml` - `npm test` zu `npm run test:coverage` im `test`-Job
- `ui/event-delegation.js` - toter Whitelist-Eintrag `populateImportNodesList` entfernt

**Gate-Stand nach dem Audit:** `npx jest` 50 Suiten / 1120 Tests gruen - `npx eslint . --max-warnings 367`
0 Fehler / 367 Warnungen - `npx tsc --noEmit` Exit 0 - `npx tsc -p tsconfig.strict.json` Exit 0 -
`npx jest --coverage` Exit 0 - `python -m pytest tests/build/` 24 gruen - `python build.py` Exit 0.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s (Unit/Lint/Typecheck-Pfad: `npx jest` 2.8 s, Lint und Typecheck je unter 30 s)
- [ ] `nyquist_compliant: true` - **bewusst nicht gesetzt**: 9 datierte Restposten (NQ-03 bis NQ-11) bleiben offen

**Approval:** validated (PARTIAL) - 2026-09-07
