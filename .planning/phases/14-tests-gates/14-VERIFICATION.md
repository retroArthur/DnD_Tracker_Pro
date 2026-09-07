---
phase: 14-tests-gates
verified: 2026-09-07T11:05:00Z
status: human_needed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Das Coverage-Gate (Modul-zu-Test-Abdeckungs-Gate, TEST-05/D-13) misst ehrlich, ob ein Modul von einem echten JS-Test angefasst wird, und faengt damit kuenftige Testluecken ab"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: >-
      Freigabe der Toast-Race-Beweisführung in
      .planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md prüfen (von Plan 14-03,
      Task 3 ausdrücklich als "manuelle Abnahme" an das Phasenende (workflow.human_verify_mode=
      end-of-phase) delegiert, kein automatisierbarer Regressionstest).
    expected: >-
      Alle vier im Plan genannten Prüfpunkte treffen zu: (1) ein ROTER Vorlauf gegen den
      ungefixten Stand mit Fehlerauszug und Zeilennummer aus locations.spec.js oder
      encounters.spec.js liegt vor, (2) Vor- und Nachlauf-Parameter sind zeichengleich
      (--repeat-each=5 --workers=4 --retries=0), (3) beide Nachläufe sind grün,
      (4) playwright.config.js ist unverändert (retries: process.env.CI ? 2 : 0).
    why_human: >-
      Der Plan benennt dies ausdrücklich als einmalige, protokollierte manuelle Abnahme eines
      Vergleichs zweier Codestände, keinen wiederholbaren Test — die Freigabeentscheidung selbst
      ist laut Plan Sache eines Menschen. Diese Verifikation (initial UND diese Re-Verifikation)
      hat die Beweisführung unabhängig nachvollzogen und findet sie schlüssig, kann die im Plan
      verlangte menschliche Freigabe aber nicht selbst aussprechen. Keine neue Aktivität an
      `14-TOAST-RACE-MEASUREMENT.md` seit der Ur-Verifikation (`git log` auf die Datei zeigt nur
      die beiden Commits aus Plan 14-03, `2d00236`/`f591c9d`) — der Punkt ist unverändert offen.
---

# Phase 14: Tests & Gates Verification Report

**Phase Goal:** Die verbliebenen Testlücken sind geschlossen und die Qualitäts-Gates greifen
scharf genug, um künftige Rückschritte zu fangen.
**Verified:** 2026-09-07T11:05:00Z
**Status:** human_needed
**Re-verification:** Ja — nach Schließung von GAP-01 (Commits `f284fb7`, `113a003`, `d56302a`,
`0a7aae9`, alle nach der Ur-Verifikation `a61b8c5` vom 2026-09-07 08:22 Uhr entstanden)

## Re-Verifikation: was geprüft wurde und mit welchem Ergebnis

Die Ur-Verifikation (`gaps_found`, 4/5) hatte genau einen Blocker: GAP-01 / Observable Truth #5
(TEST-05, D-13) — `tests/unit/module-test-coverage.test.js`s `walk()` sammelte ungefiltert
**alle** Dateien unter `tests/`, sodass `isCovered()` Modulpfade auch als reinen Textsubstring in
einer thematisch unabhängigen Python-Testdatei (`tests/build/test_build_deduplication.py`) fand
und 8 real ungetestete JS-Module fälschlich als "abgedeckt" durchwinkte (false green).

Diese Re-Verifikation hat **Wahrheit #5 komplett neu und unabhängig von den Behauptungen aus
`14-REVIEW-FIX.md` hergeleitet**, nicht aus dem Fix-Report übernommen:

1. **Quellcode gelesen:** `tests/unit/module-test-coverage.test.js` (aktueller Stand) zeigt
   `walk()` jetzt mit `else if (full.endsWith('.js'))`-Filter (Zeile 77) statt dem alten
   ungefilterten `results.push(full)`.
2. **Direkter Grep-Gegenbeweis:** Für alle 8 zuvor betroffenen Module liefert
   `grep -rl "<pfad>" tests/ --include="*.js"` **ausschließlich**
   `tests/unit/module-test-coverage.test.js` selbst (den Ausnahmeliste-Eintrag als String) —
   kein echter Test lädt sie. Gleichzeitig bestätigt, dass
   `tests/build/test_build_deduplication.py` die Pfade unverändert erwähnt — der Python-Fund ist
   nicht verschwunden, sondern wird jetzt vom `.js`-Filter korrekt ignoriert.
3. **Eigener Testlauf:** `npx jest tests/unit/module-test-coverage.test.js` → 4/4 grün.
4. **Aktiver Regressionsbeweis (nicht nur Präsenzprüfung):** ein fiktives, ungetestetes Modul
   (`features/__fake_regression_probe__.js`) wurde testweise in `loader.js MODULES` eingefügt
   (Arbeitsbaum vorher als sauber bestätigt) — das Gate schlägt sofort mit exakt diesem einen
   Verstoß fehl ("Module ohne Testerwaehnung und ohne Ausnahmeliste-Eintrag (1):
   features/__fake_regression_probe__.js"). Danach `git checkout -- loader.js`, Baum wieder
   sauber bestätigt, Gate wieder 4/4 grün. Das ist der eigentliche Beleg für "fängt künftige
   Rückschritte" — keine bloße Symbolpräsenz-Prüfung.
5. **Zahlen-Gegenprobe:** `MODULE_TEST_EXCEPTIONS` enthält jetzt 86 Einträge (Kopfkommentar nennt
   die ursprüngliche Erhebung vom 2026-09-07 mit 78 Modulen; 86 − 8 (CR-01-markierte Einträge,
   per `grep -c "CR-01, 2026-09-07"` bestätigt) = 78 — die Arithmetik stimmt exakt mit der
   dokumentierten Baseline überein, kein Zahlendreher).
6. **Design-Legitimität geprüft, nicht unterstellt:** `14-CONTEXT.md` D-13 legt bereits vor
   Beginn der Phase fest: "Das schärfere Coverage-Gate ist ein Modul-zu-Test-Abdeckungs-Gate ...
   mit datierter Ausnahmeliste als Ratsche." Die Aufnahme neu entdeckter, tatsächlich
   ungetesteter Module in eine sichtbare, datierte Ausnahmeliste ist damit der im Phasendesign
   selbst vorgesehene Mechanismus für genau diesen Fall — keine Ad-hoc-Ausnahme, die nur
   erfunden wurde, um diesen einen Gap billig zu schließen. Die Ur-Verifikation selbst hatte
   diesen Weg in ihrer `missing:`-Liste explizit als gültige Schließungsoption benannt ("... muessen
   entweder einen echten Test erhalten oder sichtbar und datiert in MODULE_TEST_EXCEPTIONS
   aufgenommen werden").

**Ergebnis:** GAP-01 ist geschlossen. Wahrheit #5 wechselt von ✗ FAILED zu ✓ VERIFIED.

**Aber ein wichtiger Vorbehalt, der plain gesagt werden muss:** Die 8 betroffenen Module
(`features/spells/spell-manager.js`, `features/bestiary/bestiary-editor.js`,
`features/initiative-loot.js`, `features/initiative-combat-widgets.js`,
`features/dmscreen/dmscreen-widgets-{base,combat,reference}.js`,
`ui/editors/rich-text-toolbars.js`) haben nach wie vor **null echte JS-Testabdeckung**. Der Fix
behebt die **Messung** (das Gate lügt nicht mehr), nicht die zugrunde liegende Testlücke selbst.
Das ist keine verdeckte Verschiebung des blinden Flecks — er ist jetzt sichtbar, datiert, per
Ratschen-Test (`kein Eintrag ... ist inzwischen abgedeckt`) gegen stillschweigendes
Wiederverstecken abgesichert, und deckungsgleich mit dem bereits vor Phase 14 bestehenden Zustand
für ~78 weitere Module. Der Phasen-Wortlaut "Testlücken sind geschlossen" bezieht sich laut
`REQUIREMENTS.md` TEST-03/TEST-04 auf die konkret benannten Lücken (Toast-Race,
Sammel-Spec-Aufteilung); TEST-05 selbst definiert sein Ziel explizit als "Gates sind geschärft"
und beschreibt das Modul-zu-Test-Gate als Ersatz für eine bedeutungslose globale Schwelle — nicht
als Zusage vollständiger Testabdeckung. Unter dieser (durch REQUIREMENTS.md gedeckten) Lesart ist
GAP-01 ehrlich geschlossen. Wer die Restlücke der 8 (bzw. insgesamt 86) untesteten Module als
eigenständiges technisches Schuldenproblem behandelt sehen will, sollte das als eigenen Backlog-
Posten (DEBT-Nachtrag) erfassen — das ist keine Blockade dieser Phase, sondern eine bewusste,
jetzt sichtbare Grenze ihres Scopes.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Toast-Race in `locations.spec.js`/`encounters.spec.js` ist geschlossen (Seed-Nachzug aus Plan 08-02, auch unter Volllast nicht reproduzierbar) | ✓ VERIFIED | `seedCleanSession(page)` per grep in beiden Specs verdrahtet (vor `loadApp`); `14-TOAST-RACE-MEASUREMENT.md` unverändert seit Ur-Verifikation (`git log` auf die Datei zeigt nur `2d00236`/`f591c9d`, beide aus Plan 14-03). Eigener Lauf: `npx playwright test` (Orchestrator-Messung vor diesem Run) → 321 passed/2 skipped, hier nicht erneut vollständig ausgeführt (Kostenersparnis, keine Codeänderung seit dem letzten bestätigten Lauf), aber `playwright.config.js` per `git log` weiterhin unverändert in Phase 14 bestätigt. Menschliche Freigabe der Beweisführung selbst steht laut Plan noch aus (siehe Human Verification). |
| 2 | Timeline, Reise, Fraktionen, Session-Prep, NPC-Generator haben je eine dedizierte Testdatei statt Sammel-Spec | ✓ VERIFIED | Keine Änderung seit Ur-Verifikation: `find tests -iname "welt-story*"` → keine Treffer; 5 dedizierte E2E-Specs + 5 dedizierte Unit-Dateien vorhanden und unangetastet (keine Commits seit `a61b8c5` berühren diese Dateien). |
| 3 | Lint-Gate ist geschärft und läuft grün gegen die Codebasis | ✓ VERIFIED | Eigener Lauf: `npx eslint . --max-warnings 367` → Exit 0, "0 errors, 367 warnings" — exakte Ratsche, identisch zur Baseline trotz der beiden Fix-Commits (WR-01 fügte 2 neue Tests hinzu, keine neuen Warnungen). |
| 4 | Typecheck-Gate ist geschärft und läuft grün gegen die Codebasis | ✓ VERIFIED | Eigener Lauf: `npx tsc --noEmit` → Exit 0. `npx tsc -p tsconfig.strict.json` → Exit 0. Bewusste Teilschärfung weiterhin in `REQUIREMENTS.md` TEST-05 als Restposten (`DEBT-01`) benannt, nicht verschwiegen. |
| 5 | Coverage-Gate ist geschärft und läuft scharf genug, um künftige Rückschritte bei der Testabdeckung zu fangen | ✓ VERIFIED | GAP-01 geschlossen (siehe Abschnitt "Re-Verifikation" oben). `walk()` jetzt auf `.js`-Dateien beschränkt; unabhängig durch Grep, Testlauf UND aktiven Regressionsbeweis (fiktives Modul in `loader.js` eingefügt → Gate schlägt sofort fehl → zurückgesetzt → wieder grün) bestätigt. Die 8 zuvor maskierten Module sind jetzt sichtbar, datiert und ratschen-gesichert in `MODULE_TEST_EXCEPTIONS` (86 = 78 Baseline + 8 CR-01, Arithmetik geprüft). Restposten: diese 8 Module haben weiterhin keine echte Testabdeckung — ehrlich offengelegt statt fälschlich als abgedeckt gemeldet, konsistent mit dem in D-13 vorgesehenen Ausnahmelisten-Mechanismus. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/e2e/helpers/test-utils.js` (`seedCleanSession`) | Zentraler Seed-Helfer, in 5 CRUD-Specs verdrahtet | ✓ VERIFIED | Export vorhanden, in `locations.spec.js`/`encounters.spec.js` verdrahtet; WR-02-Doku-Kommentar (Cross-Reference zu `core/data.js`/`render/helpers.js`) jetzt vorhanden (Zeilen 18-49) |
| `.planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md` | Rot/Grün-Messprotokoll | ✓ VERIFIED | Unverändert seit Ur-Verifikation, weiterhin vollständig |
| `tests/e2e/features/{timeline,reise,fraktionen,session-prep,npc-generator}.spec.js` | 5 dedizierte E2E-Dateien | ✓ VERIFIED | Alle vorhanden, unverändert |
| `tests/unit/{timeline,reise,fraktionen,session-prep,npc-generator}.test.js` | 5 dedizierte Unit-Dateien | ✓ VERIFIED | Alle vorhanden, unverändert |
| `tools/generate-eslint-globals.js`, `eslint.generated-globals.js` | Globals-Generator für `no-undef: error` | ✓ VERIFIED | Jetzt zusätzlich mit `hasUncapturedTopLevelBinding()` (WR-01-Fix, lauter Abbruch statt stiller Lücke bei Top-Level-Destrukturierung); `npx eslint .` weiterhin grün |
| `tsconfig.strict.json` | Wachsende Zulassungsliste für `checkJs` | ✓ VERIFIED | 8 Dateien, `tsc -p tsconfig.strict.json` grün |
| `jest.config.cjs` (roots-Fix + Schwelle `utils/testable-utils.js`) | Coverage misst realen Quellbaum | ✓ VERIFIED | Unverändert, weiterhin grün |
| `tests/unit/module-test-coverage.test.js` | Modul-zu-Test-Gate, das echte Lücken fängt | ✓ VERIFIED | `walk()` jetzt `.js`-gefiltert (CR-01-Fix); 4/4 Tests grün; aktiver Regressionsbeweis erbracht (siehe oben) |

### Data-Flow Trace (Level 4)

Nicht anwendbar — Phase 14 produziert Test-/Gate-Infrastruktur, keine UI-Datenanzeige.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Lint-Ratsche exakt bei 367 | `npx eslint . --max-warnings 367` | "0 errors, 367 warnings", Exit 0 | ✓ PASS |
| `tsc --noEmit` grün | `npx tsc --noEmit` | Exit 0, keine Ausgabe | ✓ PASS |
| `tsc -p tsconfig.strict.json` grün | `npx tsc -p tsconfig.strict.json` | Exit 0, keine Ausgabe | ✓ PASS |
| Jest volle Suite grün | `npx jest` | 49/49 Suiten, 1118/1118 Tests, 50 Snapshots | ✓ PASS |
| Modul-zu-Test-Gate: normaler Lauf grün | `npx jest tests/unit/module-test-coverage.test.js` | 4/4 PASS | ✓ PASS |
| Modul-zu-Test-Gate: **aktiver Regressionsbeweis** — fängt ein fiktives, ungetestetes Modul | Fiktives Modul in `loader.js MODULES` eingefügt, Gate erneut gelaufen, danach `git checkout -- loader.js` | Gate scheiterte exakt an diesem einen Modul ("Module ohne Testerwaehnung ... (1): features/__fake_regression_probe__.js"); nach Rückbau wieder 4/4 grün, `loader.js` sauber | ✓ PASS |
| `eslint-globals-freshness.test.js` (WR-01-Guards) grün | `npx jest tests/unit/eslint-globals-freshness.test.js` | 5/5 PASS (inkl. der beiden neuen WR-01-Testfälle) | ✓ PASS |
| Python-Fund weiterhin vorhanden, aber jetzt korrekt ignoriert | `grep -l "<modulpfad>" tests/build/test_build_deduplication.py` | Treffer (Python-Datei erwähnt Pfade weiterhin) — vom `.js`-Filter aber nicht mehr eingesammelt | ✓ PASS (Fix wirkt strukturell, nicht zufällig) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| TEST-03 | 14-03 | Toast-Race in locations/encounters.spec.js geschlossen | ✓ SATISFIED (mit offenem Human-Verify-Punkt) | `seedCleanSession` verdrahtet, Beweisführung unverändert und schlüssig; Plan verlangt zusätzlich explizite menschliche Freigabe (siehe Human Verification) — weiterhin offen |
| TEST-04 | 14-04, 14-05 | Dedizierte Testdateien statt Sammel-Spec | ✓ SATISFIED | 10 dedizierte Dateien, unverändert seit Ur-Verifikation |
| TEST-05 | 14-01, 14-02, 14-06, 14-07, 14-08, 14-09 | Lint-/Typecheck-/Coverage-Gates geschärft | ✓ SATISFIED | GAP-01 geschlossen (siehe oben); Lint, Typecheck (bewusst teilgeschärft, dokumentiert), Coverage-Gate (jetzt ehrlich und regressionsfest) alle verifiziert |

Keine verwaisten Requirements — alle drei Phase-Requirements sind in mindestens einem Plan
deklariert und decken sich mit `REQUIREMENTS.md`. `REQUIREMENTS.md` selbst trägt TEST-05 noch
als "○ offen (Gap aus 14-VERIFICATION.md, GAP-01)" — dieser Status ist durch diese
Re-Verifikation überholt und sollte bei der nächsten Gelegenheit (z.B. `/gsd-progress`) auf ✓
nachgezogen werden; das ist ein Dokumentationsnachzug, kein inhaltlicher Vorbehalt.

### Anti-Patterns Found

Keine `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`-Marker in den seit der Ur-Verifikation
geänderten Kerndateien (`tests/unit/module-test-coverage.test.js`,
`tools/generate-eslint-globals.js`, `tests/e2e/helpers/test-utils.js`,
`tests/unit/eslint-globals-freshness.test.js`) — eigenständig per Grep bestätigt.

Die drei Findings aus `14-REVIEW.md` sind laut `14-REVIEW-FIX.md` alle behoben; hier
gegengeprüft:

| File | Line | Pattern | Severity | Status nach Re-Verifikation |
|------|------|---------|----------|------------------------------|
| `tests/unit/module-test-coverage.test.js` | 60-71 (jetzt 71-82) | `walk()` ohne Dateityp-Filter → False-Positive-Abdeckung über Python-Testdatei | 🛑 Blocker (CR-01) | ✓ Behoben, unabhängig via Regressionsbeweis bestätigt |
| `tools/generate-eslint-globals.js` | 65 | `DECLARATION_PATTERN` erfasst keine destrukturierten/Mehrfach-`var`-Top-Level-Deklarationen | ⚠️ Warning (WR-01) | ✓ Behoben — lauter Abbruch (`hasUncapturedTopLevelBinding()`) statt stiller Lücke, 2 neue Regressionstests grün |
| `tests/e2e/helpers/test-utils.js` | 34-76 | `seedCleanSession()`-Payload implizit an Schema gekoppelt, kein Cross-Reference-Kommentar | ⚠️ Warning (WR-02) | ✓ Behoben — Doku-Kommentar mit expliziten Dateiverweisen ergänzt (reiner Doku-Fix, keine Verhaltensänderung, per Diff bestätigt) |

Kein neuer Anti-Pattern-Fund in den Fix-Commits selbst.

### Human Verification Required

### 1. Freigabe der Toast-Race-Beweisführung

**Test:** `.planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md` öffnen und gegen die
vier im Plan 14-03 (Task 3) genannten Prüfpunkte abgleichen.
**Expected:** Roter Vorlauf mit Fehlerauszug/Zeilennummer aus `locations.spec.js` oder
`encounters.spec.js`; identische Vor-/Nachlauf-Parameter; beide Nachläufe grün;
`playwright.config.js` unverändert.
**Why human:** Der Plan benennt dies ausdrücklich als einmalige, manuelle Abnahme eines
Vergleichs zweier Codestände (kein wiederholbarer Regressionstest) und verlangt explizite
Freigabe durch einen Menschen, nicht durch den Verifier. Unverändert seit der Ur-Verifikation
offen — `git log` auf die Messdatei zeigt keine neue Aktivität seit den beiden Plan-14-03-Commits.

### Gaps Summary

Keine Gaps mehr. Der einzige Blocker der Ur-Verifikation (GAP-01, Wahrheit #5 / TEST-05) ist
durch die Commits `f284fb7` (CR-01-Fix), `113a003` (WR-01-Fix) und `d56302a` (WR-02-Fix)
geschlossen und in dieser Re-Verifikation unabhängig — durch Grep, Testlauf und einen aktiven
Regressionsbeweis (fiktives Modul eingefügt/zurückgesetzt) — bestätigt. Alle drei
Phase-Requirements (TEST-03, TEST-04, TEST-05) sind inhaltlich erfüllt.

Der Status bleibt dennoch `human_needed`, nicht `passed`: Plan 14-03 verlangt für TEST-03
ausdrücklich eine menschliche Freigabe der Toast-Race-Beweisführung, die bislang nicht erfolgt
ist (keine neue Aktivität an der Messdatei seit ihrer Erstellung). Dieser Punkt ist rein eine
menschliche Entscheidung, keine technische Lücke — die Beweisführung selbst wurde von dieser wie
auch der vorherigen Verifikation unabhängig nachvollzogen und für schlüssig befunden.

---

_Verified: 2026-09-07T11:05:00Z_
_Verifier: Claude (gsd-verifier)_
