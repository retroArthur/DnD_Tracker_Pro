---
phase: 11
slug: architektur-build-hygiene
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-25
validated: 2026-07-26
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

Retroaktiv abgeglichen am 2026-07-26 (validate-phase §6, State A). Jeder Eintrag wurde gegen den
Live-Code bzw. das Artefakt geprüft.

| Plan | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01, 11-02 | ARCH-01 | — | Parse-Fehler bricht Build ab statt still leere Liste zu liefern | unit (pytest) | `python -m pytest tests/build/ -k ssot` | ✅ 5 Tests | ✅ green |
| 11-01, 11-02 | ARCH-01 | — | Fehlende gelistete Datei bricht den Build ab, ohne Ausgabe zu schreiben | unit (pytest) | `python -m pytest tests/build/ -k missing` | ✅ 4 Tests | ✅ green |
| 11-03 | ARCH-02 | T-11-01 (Build-Time-Datei-Injection) | Quell-Duplikat → Exit ≠ 0 **und** keine Ausgabedatei | unit (pytest) | `python -m pytest tests/build/ -k duplicate` | ✅ 5 Tests (`function`/`const`/`let`/`class` + Negativkontrolle) | ✅ green |
| 11-03 | ARCH-02 | — | Kein Pfad erzeugt mehr ein Bundle mit stillem Orphan-Body | unit (pytest) | `python -m pytest tests/build/ -k marker` | ✅ `test_no_dedup_function_marker_in_bundle` | ✅ green |
| 11-04 | ARCH-03 | T-11-02 (CI-Supply-Chain) | Action-Majors auf geprüftem Stand, Node 22 | CI-Lauf | Actions-Tab nach Push | ✅ Lauf 30216452989 | ✅ green |
| 11-05 | ARCH-03 | — | Kein Favicon-404, keine Meta-Tag-Deprecation in der Konsole | E2E (smoke) | `npx playwright test --config=playwright.smoke.config.js` | ✅ `smoke.spec.js:38-62` | ✅ green |
| 11-05 | ARCH-03 | — | Favicon-Data-URI ist wohlgeformtes SVG | unit (pytest) | `python -m pytest tests/build/ -k favicon` | ✅ `test_favicon_data_uri_payload_is_wellformed_svg` | ✅ green |
| 11-06, 11-07 | ARCH-04 | — | Map-Refresh deckt sich widerspruchsfrei mit der Triage | Dokument-Verifikation | Abgleich `11-CONCERNS-TRIAGE.md` ↔ `.planning/codebase/*.md` | ✅ in `11-07-SUMMARY.md` protokolliert | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Belegender Lauf (2026-07-26):** `python -m pytest tests/build/ -q` → **24 passed** (die Datei
umfasste beim Seeding der Strategie noch 10 Tests). Dazu `npm test` → 628 passed,
`npx playwright test` → 319 passed / 2 skipped.

---

## Wave 0 Requirements

- [x] Test „fehlende gelistete Datei bricht Build ab" (D-02). **Vorhanden, und zwar vierfach** — je Asset-Typ und zusätzlich der Nachweis, dass keine Ausgabedatei entsteht: `test_missing_module_file_aborts_build`, `test_build_aborts_without_writing_output_on_missing_module`, `test_missing_template_file_aborts_build`, `test_missing_css_file_aborts_build`.
- [x] `const`/`let`/`class`-Duplikaterkennung (D-06). **Vorhanden:** `test_duplicate_const_check_detects_duplicate`, `test_duplicate_class_check_detects_duplicate`, `test_duplicate_let_check_detects_duplicate` — plus `test_nested_declaration_is_not_a_duplicate` als Negativkontrolle, die verhindert, dass der Pre-Check verschachtelte Deklarationen fälschlich meldet.
- [x] Test „kein `[DEDUP] Removed duplicate function`-Marker im Bundle" (D-07). **Vorhanden:** `test_no_dedup_function_marker_in_bundle`. Sein Docstring benennt ausdrücklich, dass er `test_no_orphaned_return_statements` ersetzt — der alte Test prüfte einen Zustand, den es nicht mehr geben kann.
- [x] `test_module_lists_are_synchronized` abgelöst. **Der alte Test ist entfernt** (kein Vorkommen mehr im Quelltext) und durch fünf SSoT-Tests ersetzt: `test_ssot_module_list_parses_from_loader`, `test_ssot_template_list_parses_from_loader`, `test_ssot_css_order_matches_styles_hub`, `test_ssot_parse_failure_aborts_build`, `test_ssot_empty_array_aborts_build`.
- [x] `tests/e2e/smoke.spec.js` — `page.on('response', …404)` + `page.on('console', …)`-Assertions (D-12). **Vorhanden**, Zeilen 46-62. Der Kommentar ab Zeile 42 hält fest, warum `response.status() === 404` und nicht `requestfailed` verwendet wird: ein 404 ist aus Netzwerksicht eine erfolgreiche Antwort, das Fehler-Event würde nie feuern.
- [x] pytest-Verfügbarkeit in CI (D-03). **`requirements-dev.txt` existiert** mit gepinntem `pytest==9.0.3`; der CI-`test`-Job installiert daraus (`ci.yml:43`) und führt `python -m pytest tests/build/ -v` aus (`ci.yml:45`).

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

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references — alle sechs Posten erfüllt, siehe oben
- [x] No watch-mode flags
- [x] Feedback latency < 5s (Build-Ebene: pytest-Lauf 0,27 s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-07-26

---

## Status der Manual-Only-Verifikationen

Alle drei manuellen Punkte wurden inzwischen durchgeführt und belegt:

| Behavior | Ergebnis |
|----------|----------|
| Actions-Workflows ohne Node-Deprecation-Warnung (ARCH-03) | ✅ CI-Lauf 30216452989 auf `bfd6447`: sechs Jobs grün, Annotations-Bereich ohne Deprecation-Meldung. Die zehn vorhandenen Annotationen sind ESLint-Warnungen aus `lint-and-typecheck`. |
| `.planning/codebase/` bildet den Stand nach allen v1.1-Phasen ab (ARCH-04) | ✅ Alle sieben Dateien am 2026-07-26 aufgefrischt. Modulzahl 123 (nicht 92), Bestiary/PWA/Datei-Backup/Command-Palette erwähnt. Beim Abgleich wurden 38 falsche Zahlenangaben und zwei erfundene Verzeichnisse korrigiert. |
| Jeder CONCERNS.md-Eintrag ist disponiert (ARCH-04) | ✅ 24 Befunde der regenerierten `CONCERNS.md` gegen 46 Alt-Dispositionen gestellt; 21 neu, davon 13 als `DEBT-17`..`DEBT-29` übernommen. DEBT-ID-Mengen in Triage und `REQUIREMENTS.md` deckungsgleich. |

---

## Validation Audit 2026-07-26

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Kein `gsd-nyquist-auditor` nötig — die Gap-Analyse ergab keine offenen Posten (Kurzschluss aus
Schritt 3 des Workflows).

Vierter und letzter Fall desselben Musters (Phasen 8–11): die Datei stand seit dem 25.07. auf
`draft` mit `TBD`-Platzhaltern in der Per-Task-Karte, während die Testsuite `tests/build/` in
derselben Phase von 10 auf 24 Tests gewachsen war und alle sechs Wave-0-Posten abdeckte.

**Ein Detail ist erwähnenswert, weil es leicht als Lücke fehlgedeutet wird:** die
Validierungs-Nuance zu Erfolgskriterium 2 unten hält fest, dass ein Test „Pass 3 wirft einen
Fehler" nach dieser Phase **nicht** existiert und auch nicht existieren darf — Pass 3 wurde
ersatzlos entfernt. Der Nachweis läuft stattdessen über zwei Verhaltensgarantien:
`test_source_duplicate_aborts_build_without_writing_output` (Quell-Duplikat wird vor dem Bündeln
abgefangen, keine Ausgabedatei) und `test_no_dedup_function_marker_in_bundle` (der Marker des
entfernten Passes kommt in keinem Bundle mehr vor). Beide existieren und laufen grün. Wer nur nach
dem Namen des alten Tests sucht, hält das fälschlich für eine Regressionslücke.
