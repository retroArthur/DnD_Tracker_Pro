---
phase: 14-tests-gates
verified: 2026-09-07T08:22:11Z
status: gaps_found
score: 4/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Das Coverage-Gate (Modul-zu-Test-Abdeckungs-Gate, TEST-05/D-13) misst ehrlich, ob ein Modul von einem echten JS-Test angefasst wird, und faengt damit kuenftige Testluecken ab"
    status: failed
    reason: >-
      walk(TESTS_DIR) in tests/unit/module-test-coverage.test.js sammelt rekursiv ALLE Dateien
      unter tests/ ohne Endungsfilter; isCovered() durchsucht deren Inhalt dann als reinen
      Text-Substring — auch bei .py-Dateien. tests/build/test_build_deduplication.py (ein
      Python-Test fuer den Build-Dedup-Mechanismus, thematisch unabhaengig von JS-Testabdeckung)
      erwaehnt zufaellig acht loader.js-Modulpfade in seinen eigenen Kommentaren/Assertions.
      Dadurch gelten diese acht Module als "abgedeckt", obwohl sie in KEINER .js-Testdatei unter
      tests/ (unit, integration oder e2e) je vorkommen. Unabhaengig nachvollzogen: fuer alle acht
      Pfade liefert `grep -rl "<pfad>" tests/ --include="*.js"` keinen Treffer, waehrend
      `grep -rl "<pfad>" tests/` genau tests/build/test_build_deduplication.py liefert. Keines
      der acht Module steht in MODULE_TEST_EXCEPTIONS (per grep bestaetigt) — die Datei ist
      also bereits im vom Gate selbst als "ausgeschlossen" bezeichneten Zustand
      ("ein neues, unabgedecktes Modul aufzunehmen ... ist ausgeschlossen"), nur unsichtbar,
      weil das Gate selbst den blinden Fleck hat. `npx jest tests/unit/module-test-coverage.test.js`
      laeuft dennoch gruen (false green) — bestaetigt durch eigenen Testlauf. Das widerspricht
      Erfolgskriterium 3 der Roadmap ("Coverage-Gates sind geschaerft ... und laufen scharf genug,
      um kuenftige Ruckschritte zu fangen"): das Gate laeuft zwar gruen, misst aber nicht, was es
      zu messen behauptet, und faengt den Rueckschritt genau nicht, den es verhindern soll.
    artifacts:
      - path: "tests/unit/module-test-coverage.test.js"
        issue: "walk() (Zeilen 60-71) filtert nicht nach Dateityp; isCovered() (Zeilen 99-102) durchsucht dadurch auch Nicht-JS-Dateien (insbesondere tests/build/*.py) als Textsubstring-Match"
    missing:
      - "walk() auf .js-Dateien beschraenken (z.B. `else if (full.endsWith('.js'))` statt `results.push(full)` fuer jede Datei), analog zum engeren Scope von tests/unit/eslint-globals-freshness.test.js"
      - "Nach dem Fix erneut laufen lassen: die acht betroffenen Module (features/spells/spell-manager.js, features/bestiary/bestiary-editor.js, features/initiative-loot.js, features/initiative-combat-widgets.js, features/dmscreen/dmscreen-widgets-base.js, features/dmscreen/dmscreen-widgets-combat.js, features/dmscreen/dmscreen-widgets-reference.js, ui/editors/rich-text-toolbars.js) muessen entweder einen echten Test erhalten oder sichtbar und datiert in MODULE_TEST_EXCEPTIONS aufgenommen werden"
human_verification:
  - test: >-
      Freigabe der Toast-Race-Beweisfuehrung in
      .planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md pruefen (von Plan 14-03,
      Task 3 ausdruecklich als "manuelle Abnahme" an das Phasenende (workflow.human_verify_mode=
      end-of-phase) delegiert, kein automatisierbarer Regressionstest).
    expected: >-
      Alle vier im Plan genannten Pruefpunkte treffen zu: (1) ein ROTER Vorlauf gegen den
      ungefixten Stand mit Fehlerauszug und Zeilennummer aus locations.spec.js oder
      encounters.spec.js liegt vor, (2) Vor- und Nachlauf-Parameter sind zeichengleich
      (--repeat-each=5 --workers=4 --retries=0), (3) beide Nachlaeufe sind gruen,
      (4) playwright.config.js ist unveraendert (retries: process.env.CI ? 2 : 0).
    why_human: >-
      Der Plan benennt dies ausdruecklich als einmalige, protokollierte manuelle Abnahme eines
      Vergleichs zweier Codestaende, keinen wiederholbaren Test — die Freigabeentscheidung selbst
      ist laut Plan Sache eines Menschen. Diese Verifikation hat die Beweisfuehrung unabhaengig
      nachvollzogen (siehe Abschnitt "Toast-Race-Beweisfuehrung" unten) und findet sie schluessig,
      kann die im Plan verlangte menschliche Freigabe aber nicht selbst aussprechen.
---

# Phase 14: Tests & Gates Verification Report

**Phase Goal:** Die verbliebenen Testlücken sind geschlossen und die Qualitäts-Gates greifen
scharf genug, um künftige Rückschritte zu fangen.
**Verified:** 2026-09-07T08:22:11Z
**Status:** gaps_found
**Re-verification:** Nein — initiale Verifikation

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Toast-Race in `locations.spec.js`/`encounters.spec.js` ist geschlossen (Seed-Nachzug aus Plan 08-02, auch unter Volllast nicht reproduzierbar) | ✓ VERIFIED | `seedCleanSession(page)` per grep in beiden Specs verdrahtet (vor `loadApp`); `14-TOAST-RACE-MEASUREMENT.md` dokumentiert roten Vorlauf (5/95 Fehlschläge, exakt `encounters.spec.js:132`, Toast-Race-Fehlerbild) gegen ungefixten Commit `d384e2e` und zwei unabhängige grüne Nachläufe (95/95) gegen `83815cb`, identische Parameter (`--repeat-each=5 --workers=4 --retries=0`). `playwright.config.js` unverändert bestätigt (`git log` zeigt keinen Commit in Phase 14). Eigener Lauf: `npx playwright test` → 321 passed/2 skipped. Siehe zusätzlich Human-Verification-Punkt unten (Plan verlangt ausdrückliche menschliche Freigabe dieser Beweisführung). |
| 2 | Timeline, Reise, Fraktionen, Session-Prep, NPC-Generator haben je eine dedizierte Testdatei statt Sammel-Spec | ✓ VERIFIED | `find tests -iname "welt-story*"` → keine Treffer (alte Sammeldateien entfernt). 5 dedizierte E2E-Specs (`tests/e2e/features/{timeline,reise,fraktionen,session-prep,npc-generator}.spec.js`) + 5 dedizierte Unit-Dateien vorhanden. Testzahl per eigenem Lauf bestätigt: `npx playwright test ... --list` → 26 Tests; `npx jest ...` → 37 Tests — exakt wie in REQUIREMENTS.md TEST-04 behauptet. Code-Review bestätigt byte-identischen Diff der Aufteilung. |
| 3 | Lint-Gate ist geschärft und läuft grün gegen die Codebasis | ✓ VERIFIED | Eigener Lauf: `npx eslint . --max-warnings 367` → Exit 0, "0 errors, 367 warnings" — exakte Ratsche. `no-undef` ist jetzt harter Fehler (Generator aus `loader.js MODULES`, 134 Module extrahiert, per eigenem Node-Aufruf bestätigt). |
| 4 | Typecheck-Gate ist geschärft und läuft grün gegen die Codebasis | ✓ VERIFIED | Eigener Lauf: `npx tsc --noEmit` → Exit 0. `npm run typecheck:strict` (`tsconfig.strict.json`, 8-Datei-Zulassungsliste) → Exit 0, keine Fehlerausgabe. Bewusste Teilschärfung (`checkJs` global aus) ist in REQUIREMENTS.md TEST-05 als Restposten benannt, nicht verschwiegen — Review bestätigt dies als dokumentierte, keine verdeckte Einschränkung. |
| 5 | Coverage-Gate ist geschärft und läuft scharf genug, um künftige Rückschritte bei der Testabdeckung zu fangen | ✗ FAILED | `roots`-Fix technisch verifiziert (`npx jest --coverage` → Exit 0, 0,77% Statements, 125 instrumentierte Dateien, ehrlich dokumentiert). Das eigentliche schärfere Gate — `tests/unit/module-test-coverage.test.js` (Modul-zu-Test-Abdeckungs-Gate) — hat jedoch einen verifizierten False-Green-Defekt: `walk()` filtert nicht nach Dateityp, wodurch 8 reale JS-Module (u.a. `ui/editors/rich-text-toolbars.js`) als "abgedeckt" gelten, weil ihr Pfad zufällig in einer Python-Testdatei (`tests/build/test_build_deduplication.py`) vorkommt — nicht weil ein JS-Test sie lädt. Eigenständig reproduziert (`grep --include="*.js"` liefert 0 Treffer, `grep` ohne Filter liefert genau die Python-Datei; keines der 8 Module steht in `MODULE_TEST_EXCEPTIONS`; `npx jest tests/unit/module-test-coverage.test.js` läuft dennoch grün). Deckt sich mit `14-REVIEW.md` CR-01 (Blocker). |

**Score:** 4/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/e2e/helpers/test-utils.js` (`seedCleanSession`) | Zentraler Seed-Helfer, in 5 CRUD-Specs verdrahtet | ✓ VERIFIED | Export vorhanden, in `locations.spec.js`/`encounters.spec.js` importiert und vor `loadApp()` aufgerufen |
| `.planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md` | Rot/Grün-Messprotokoll | ✓ VERIFIED | Vollständig, mit rotem Vorlauf, zwei grünen Nachläufen, Vergleichstabelle |
| `tests/e2e/features/{timeline,reise,fraktionen,session-prep,npc-generator}.spec.js` | 5 dedizierte E2E-Dateien | ✓ VERIFIED | Alle vorhanden, alte Sammeldatei entfernt |
| `tests/unit/{timeline,reise,fraktionen,session-prep,npc-generator}.test.js` | 5 dedizierte Unit-Dateien | ✓ VERIFIED | Alle vorhanden, alte Sammeldatei entfernt |
| `tools/generate-eslint-globals.js`, `eslint.generated-globals.js` | Globals-Generator für `no-undef: error` | ✓ VERIFIED | 134 Module extrahiert, `npx eslint .` grün |
| `tsconfig.strict.json` | Wachsende Zulassungsliste für `checkJs` | ✓ VERIFIED | 8 Dateien, `typecheck:strict` grün |
| `jest.config.cjs` (roots-Fix + Schwelle `utils/testable-utils.js`) | Coverage misst realen Quellbaum | ✓ VERIFIED | `roots: ['<rootDir>']`, 125 instrumentierte Dateien, Schwelle grün |
| `tests/unit/module-test-coverage.test.js` | Modul-zu-Test-Gate, das echte Lücken fängt | ✗ STUB (funktional) | Existiert, läuft, aber miss-klassifiziert 8 Module als abgedeckt (siehe Gap oben) — Artefakt vorhanden, Zweck nicht erfüllt |

### Data-Flow Trace (Level 4)

Nicht anwendbar — Phase 14 produziert Test-/Gate-Infrastruktur, keine UI-Datenanzeige.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Lint-Ratsche exakt bei 367 | `npx eslint . --max-warnings 367` | "0 errors, 367 warnings", Exit 0 | ✓ PASS |
| `tsc --noEmit` grün | `npx tsc --noEmit` | Exit 0, keine Ausgabe | ✓ PASS |
| `typecheck:strict` grün | `npm run typecheck:strict` | Exit 0, keine Ausgabe | ✓ PASS |
| Jest volle Suite grün | `npx jest` | 49/49 Suiten, 1116/1116 Tests | ✓ PASS |
| Jest Coverage grün, ehrliche Zahl | `npx jest --coverage` | Exit 0, "Statements: 0.77% (147/18942)" | ✓ PASS |
| Playwright volle Suite grün | `npx playwright test` | 321 passed, 2 skipped | ✓ PASS |
| Build grün | `PYTHONIOENCODING=utf-8 python build.py` | `[SUCCESS] Build abgeschlossen!` | ✓ PASS |
| Modul-zu-Test-Gate erkennt fehlende JS-Abdeckung | `npx jest tests/unit/module-test-coverage.test.js` | PASS (grün) trotz 8 nachweislich ungetesteter Module | ✗ FAIL (false green — siehe Gap) |
| 5 dedizierte E2E-Dateien, korrekte Testzahl | `npx playwright test tests/e2e/features/{timeline,reise,fraktionen,session-prep,npc-generator}.spec.js --list` | "Total: 26 tests in 5 files" | ✓ PASS |
| 5 dedizierte Unit-Dateien, korrekte Testzahl | `npx jest tests/unit/{timeline,reise,fraktionen,session-prep,npc-generator}.test.js` | "Tests: 37 passed, 37 total" | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| TEST-03 | 14-03 | Toast-Race in locations/encounters.spec.js geschlossen | ✓ SATISFIED (mit Human-Verify-Punkt) | `seedCleanSession` verdrahtet, Falsifikationsbeweis vorhanden und eigenständig nachvollzogen; Plan verlangt zusätzlich explizite menschliche Freigabe (siehe Human Verification) |
| TEST-04 | 14-04, 14-05 | Dedizierte Testdateien statt Sammel-Spec | ✓ SATISFIED | 10 dedizierte Dateien, Testzahlen unverändert (26 E2E, 37 Unit) bestätigt |
| TEST-05 | 14-01, 14-02, 14-06, 14-07, 14-08, 14-09 | Lint-/Typecheck-/Coverage-Gates geschärft | ✗ BLOCKED (teilweise) | Lint und Typecheck vollständig verifiziert grün und geschärft; Coverage-Teil (Modul-zu-Test-Gate) hat einen verifizierten Blocker (false-green bei 8 Modulen) — die Kernaussage "Rückschritte fangen" trifft für diesen Gate-Teil nicht zu |

Keine verwaisten Requirements — alle drei Phase-Requirements sind in mindestens einem Plan deklariert und decken sich mit `REQUIREMENTS.md`.

### Anti-Patterns Found

Keine `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`-Marker in den geprüften Kerndateien
(`tests/e2e/helpers/test-utils.js`, `tests/unit/module-test-coverage.test.js`,
`tests/unit/eslint-globals-freshness.test.js`, `tools/generate-eslint-globals.js`,
`tsconfig.strict.json`, `eslint.config.js`, `eslint.generated-globals.js`).

Aus `14-REVIEW.md` (unabhängig durchgeführter Code-Review dieser Phase) übernommen und hier
gegengeprüft:

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/unit/module-test-coverage.test.js` | 60-71 | `walk()` ohne Dateityp-Filter → False-Positive-Abdeckung über Python-Testdatei | 🛑 Blocker | Gate erfüllt seinen Zweck nicht (siehe Gap oben) — eigenständig reproduziert |
| `tools/generate-eslint-globals.js` | 65 | `DECLARATION_PATTERN` erfasst keine destrukturierten/Mehrfach-`var`-Top-Level-Deklarationen | ⚠️ Warning | Aktuell latent (kein Vorkommen im Live-Baum), könnte künftig stille `no-undef`-Fehlalarme erzeugen |
| `tests/e2e/helpers/test-utils.js` | 34-76 | `seedCleanSession()`-Payload implizit an `core/data.js`/`render/helpers.js`-Schema gekoppelt, kein Cross-Reference-Kommentar | ⚠️ Warning | Dokumentationslücke, kein aktiver Bug |

Der Vorfall aus Plan 14-06 (`git checkout <alter-commit> -- .` versehentlich auf den Arbeitsbaum
angewendet) ist im Summary transparent dokumentiert und wurde nach eigener Prüfung folgenlos
behoben: `git status` zeigt einen sauberen Baum (keine unerwarteten Änderungen), `git stash list`
ist leer, die Commit-Historie von Phase 14 (`git log --oneline`) ist lückenlos und plausibel. Kein
Hinweis auf Datenverlust.

### Human Verification Required

### 1. Freigabe der Toast-Race-Beweisführung

**Test:** `.planning/phases/14-tests-gates/14-TOAST-RACE-MEASUREMENT.md` öffnen und gegen die
vier im Plan 14-03 (Task 3) genannten Prüfpunkte abgleichen.
**Expected:** Roter Vorlauf mit Fehlerauszug/Zeilennummer aus `locations.spec.js` oder
`encounters.spec.js`; identische Vor-/Nachlauf-Parameter; beide Nachläufe grün;
`playwright.config.js` unverändert.
**Why human:** Der Plan benennt dies ausdrücklich als einmalige, manuelle Abnahme eines
Vergleichs zweier Codestände (kein wiederholbarer Regressionstest) und verlangt explizite
Freigabe durch einen Menschen, nicht durch den Verifier. Diese Verifikation hat die
Beweisführung unabhängig nachvollzogen (Commits `d384e2e` ungefixt, `83815cb` gefixt geprüft,
`playwright.config.js`-Historie in Phase 14 leer, eigener `npx playwright test`-Lauf grün) und
hält sie für schlüssig — die im Plan verlangte Freigabe selbst bleibt aber eine menschliche
Entscheidung.

### Gaps Summary

Ein Blocker verhindert den vollständigen Abschluss von Erfolgskriterium 3 / TEST-05: Das
Modul-zu-Test-Abdeckungs-Gate (`tests/unit/module-test-coverage.test.js`), das laut Plan 14-09
die bedeutungslose globale Coverage-Schwelle durch eine aussagekräftige Prüfung ersetzen sollte,
hat selbst einen blinden Fleck — es unterscheidet nicht zwischen JS- und Nicht-JS-Testdateien
und markiert dadurch 8 Module fälschlich als getestet, weil ihr Pfad in einer unabhängigen
Python-Testdatei (`tests/build/test_build_deduplication.py`) erwähnt wird. Diese 8 Module haben
tatsächlich null JS-Testabdeckung und stehen auch nicht auf der bewusst geführten
Ausnahmeliste — genau der Zustand, den das Gate laut eigenem Kopfkommentar verhindern soll. Der
Befund wurde bereits im Code-Review dieser Phase (`14-REVIEW.md`, CR-01) identifiziert und hier
unabhängig reproduziert und bestätigt (Grep-Nachweis, Testlauf, Abgleich mit
`MODULE_TEST_EXCEPTIONS`). Alle übrigen Teile von TEST-05 (Lint, Typecheck) sowie TEST-03 und
TEST-04 sind vollständig verifiziert. Zusätzlich verlangt Plan 14-03 eine explizite menschliche
Freigabe der Toast-Race-Beweisführung, die hier unabhängig nachvollzogen, aber nicht final
abgenommen werden kann.

---

_Verified: 2026-09-07T08:22:11Z_
_Verifier: Claude (gsd-verifier)_
