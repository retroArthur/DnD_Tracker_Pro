---
phase: 10-security-h-rtung
plan: 03
subsystem: security
tags: [xss, sanitization, vm-runincontext, sanitizer-parity, editor-regression-net]

# Dependency graph
requires:
  - phase: 10-security-h-rtung
    provides: "Sanitisierte Anzeige-Grenze (10-01) und Import-Grenze (10-02) — Plan 10-03 baut das Beweisnetz um den Sanitizer selbst und behebt den in Phase 9 eingefrorenen Datenintegritäts-Bug (A4)"
provides:
  - "Vektor-Katalog gegen den ECHTEN Produktions-Sanitizer (utils/basic.js) via vm.runInContext — nicht mehr nur gegen den Test-Zwilling"
  - "Paritätstest (tests/unit/sanitizer-parity.test.js), der utils/basic.js und utils/testable-utils.js über ein gemeinsames Vektor-Set vergleicht — strukturell erzwungener Zaun gegen künftige Ein-Datei-Whitelist-Änderungen"
  - "<strike> in beiden sanitizeHTML()-Whitelists (D-06) — Durchgestrichener Text übersteht jetzt den Speichern-/Reload-Zyklus"
  - "Begründete Netz-Freeze-Anpassung in 09-BASELINE.md (Ausnahme-Änderung 8)"
affects: [10-04, 10-05-security-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vm-Doppellast für Paritätstests: beide Sanitizer-Kopien werden in GETRENNTEN vm-Kontexten geladen und ihre Ausgaben über ein gemeinsames, benanntes Vektor-Set strikt verglichen (Vorlage für künftige Zwillings-Paare)"
    - "Fallback-Strukturprüfung bei function-scoped Konstanten: wenn eine Konstante innerhalb einer Funktion deklariert ist (hier allowedTags in sanitizeHTML()) und daher nicht per vm.runInContext(expr, context) erreichbar ist, wird stattdessen für eine gepflegte Tag-Liste das Behalten/Entfernen-Verhalten beider Kopien verglichen"

key-files:
  created:
    - tests/unit/sanitizer-parity.test.js
  modified:
    - tests/unit/security.test.js
    - utils/basic.js
    - utils/testable-utils.js
    - tests/e2e/features/editor-formatting.spec.js
    - .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md

key-decisions:
  - "Strukturprüfung (a) des Paritätstests nutzt die im Plan vorgesehene Fallback-Variante (Tag-Namen-Liste, Behalten/Entfernen-Vergleich) statt eines direkten allowedTags-Zugriffs — allowedTags ist eine function-scoped const innerhalb von sanitizeHTML() und über vm.runInContext(expr, context) nicht erreichbar (nur Top-Level-Deklarationen landen in der lexikalischen Umgebung des Kontexts)"
  - "esc()-Null-Drift (10-RESEARCH.md Pitfall 5) wird als eigener, dokumentierter Testfall festgehalten statt behoben — Scope dieses Plans ist ausschließlich der <strike>-Whitelist-Fix; die Drift ist jetzt aber strukturell sichtbar und kann nicht mehr unbemerkt wachsen"

requirements-completed: [SEC-01]

coverage:
  - id: D1
    description: "Sicherheitstests laufen jetzt gegen den echten Produktions-Sanitizer (utils/basic.js), nicht mehr nur gegen den Test-Zwilling; ein Paritätstest erzwingt strukturell, dass jede künftige Whitelist-Änderung in beiden Kopien landet"
    requirement: "SEC-01"
    verification:
      - kind: unit
        ref: "tests/unit/security.test.js — neuer vm.runInContext-Block gegen utils/basic.js: 6 D-15-Pflichtvektoren + Erhaltungs-Gegenprobe + 3 Randfälle (11 Tests)"
        status: pass
      - kind: unit
        ref: "tests/unit/sanitizer-parity.test.js — 61 Tests: 16 Vektor-Vergleiche (strikte Gleichheit), 40 Tag-Strukturprüfungen, 2 esc()-Drift-Dokumentationstests, 1 Vorab-Test — grün VOR und NACH der Whitelist-Änderung"
        status: pass
    human_judgment: false
  - id: D2
    description: "Durchgestrichener Text (Auszeichnung) übersteht jetzt den Speichern-/Reload-Zyklus im Wiki-Editor (D-06) — <strike> synchron in utils/basic.js und utils/testable-utils.js ergänzt, Netz-Freeze-Anpassung begründet dokumentiert"
    requirement: "SEC-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-formatting.spec.js#Durchgestrichen übersteht Speichern/Reload (D-06, ehemals A4-Datenintegritäts-Bug — in Phase 10 behoben)"
        status: pass
      - kind: e2e
        ref: "volles Editor-Netz (80 Tests, 4 Spec-Dateien) + volle Playwright-Suite (314 passed / 2 skipped)"
        status: pass
    human_judgment: false

duration: ~30min
completed: 2026-07-25
status: complete
---

# Phase 10 Plan 03: Beweisnetz um den Sanitizer + Whitelist-Fix Summary

**Der kuratierte Vektor-Katalog läuft jetzt gegen den echten `utils/basic.js`-Produktionsquelltext (statt gegen den Test-Zwilling), ein Paritätstest nagelt beide Sanitizer-Kopien strukturell aneinander, und erst danach wurde `<strike>` synchron in beide Whitelists aufgenommen — der in Phase 9 eingefrorene Strikethrough-Datenintegritäts-Bug ist behoben.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 3 (alle `type="auto"`)
- **Files modified:** 6 (1 neu, 5 geändert)

## Accomplishments

- Neuer vm.runInContext-Testblock in `tests/unit/security.test.js` lädt `utils/basic.js` per `fs.readFileSync` + `vm.runInContext` — den ECHTEN Produktionsquelltext, nicht den Test-Zwilling `utils/testable-utils.js`. Ein Vorab-Test stellt die Definiertheit der geladenen Funktion sicher, bevor der erste Vektor läuft (verhindert stilles Durchlaufen bei Ladefehler). Deckt alle sechs D-15-Pflichtvektoren (Review-Exploit img/onerror, Ereignis-Attribut ohne Anführungszeichen, Skript-Element, gemischte Groß-/Kleinschreibung, javascript:-Protokoll im Verweis, SVG onload) plus eine T-09-01-Stil-Tabellen-Nutzlast, eine Erhaltungs-Gegenprobe (erlaubte Auszeichnung + Textinhalt bleiben vollständig erhalten) und drei Randfälle (leer/null/undefined) ab
- Neue Datei `tests/unit/sanitizer-parity.test.js`: lädt `utils/basic.js` UND `utils/testable-utils.js` in getrennten vm-Kontexten und vergleicht `sanitizeHTML()`-Ausgaben über ein gemeinsames, benanntes Vektor-Set (16 Vektoren: 6 D-15-Angriffsvektoren + 9 whitelist-relevante Auszeichnungs-Vektoren inkl. beider Strikethrough-Schreibweisen) mit strikter Zeichenketten-Gleichheit ohne Vorverarbeitung. Zwei Strukturprüfungen ergänzen den reinen Ausgabevergleich: (a) 40 Tag-Namen werden auf identisches Behalten/Entfernen-Verhalten beider Kopien geprüft (Fallback statt direktem `allowedTags`-Zugriff, da `allowedTags` function-scoped ist — siehe Decisions), (b) die bekannte `esc(0)`-Drift (`''` vs. `'0'`) wird als eigener, kommentierter, NICHT-rot-machender Testfall dokumentiert. Der Test lief grün gegen den unveränderten Ausgangszustand — der Beweis der Drift-Freiheit von `sanitizeHTML()` VOR der Whitelist-Änderung — und bleibt danach grün als wirksamer Zaun
- `<strike>` synchron in die `allowedTags`-Liste von `utils/basic.js` UND `utils/testable-utils.js` aufgenommen (reine additive Datenänderung, keine Logikänderung, `class`/`style`-Attribut-Erlaubnis unangetastet, D-08) — der Paritätstest aus Task 2 bleibt danach grün
- Genau eine Netz-Assertion geändert: `NETZ.strikethrough.roundtrip` in `tests/e2e/features/editor-formatting.spec.js` von `'Probetext'` (Verlust) auf `'<strike>Probetext</strike>'` (Erhalt, identisch zum `after`-Wert). Testname umbenannt, um den neuen (positiven) Beweis widerzuspiegeln. Begründete Netz-Freeze-Anpassung als „Ausnahme-Änderung 8" in `09-BASELINE.md` protokolliert (datiert, mit altem/neuem Erwartungswert und Begründung, warum das kein Beweis-Leck ist — die Änderung verschärft die Assertion, sie schwächt sie nicht ab)
- Vollständige Verifikationskette gelaufen: `npx jest tests/unit/sanitizer-parity.test.js` grün → `python build.py` → volles Editor-Netz (80 Tests, 4 Spec-Dateien) grün → volle Playwright-Suite (314 passed / 2 skipped) grün → volle Jest-Suite (554/554) grün. `git diff --name-only` gegen die vier eingefrorenen Netz-Dateien bestätigt: ausschließlich `editor-formatting.spec.js` geändert

## Task Commits

Each task was committed atomically:

1. **Task 1: Vektor-Katalog gegen den echten Produktions-Sanitizer** - `7562035` (test)
2. **Task 2: Paritätstest zwischen Produktions-Sanitizer und Test-Zwilling** - `3d0e449` (test)
3. **Task 3: `<strike>` in beide Whitelists aufnehmen + Netz-Anpassung begründen** - `33c7923` (feat)

**Plan metadata:** wird mit diesem Commit erzeugt (docs: complete plan)

## Files Created/Modified

- `tests/unit/sanitizer-parity.test.js` — Neue Paritäts-Beweisdatei (vm.runInContext gegen beide Sanitizer-Kopien getrennt, 61 Tests)
- `tests/unit/security.test.js` — Neuer vm-basierter Testblock gegen `utils/basic.js` (11 neue Tests), bestehende Blöcke unangetastet
- `utils/basic.js` — `sanitizeHTML()`s `allowedTags`-Liste: `'strike'` neben `'s'` ergänzt
- `utils/testable-utils.js` — dieselbe Ergänzung, synchron im selben Commit
- `tests/e2e/features/editor-formatting.spec.js` — `NETZ.strikethrough.roundtrip` geändert + Testname/Kommentar aktualisiert (einzige Netzänderung)
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` — „Ausnahme-Änderung 8" im Abschnitt „Netz-Freeze" ergänzt

## Decisions Made

- Strukturprüfung (a) im Paritätstest nutzt die Plan-vorgesehene Fallback-Variante (Tag-Namen-Liste statt direktem `allowedTags`-Zugriff) — begründet in Decisions oben
- `esc(0)`-Drift bewusst nur dokumentiert, nicht behoben (außerhalb des Plan-Scopes)

## Deviations from Plan

None — Plan exakt wie geschrieben ausgeführt. Alle drei Tasks, alle `<acceptance_criteria>` und die plan-weite `<verification>` sind erfüllt.

## Issues Encountered

- `tests/unit/sanitizer-parity.test.js` benötigte beim Laden von `utils/testable-utils.js` per `vm.runInContext` einen `module: { exports: {} }`-Stub im Kontextobjekt, da diese Datei mit `module.exports = {...}` endet (CommonJS-Export für Jest) — `utils/basic.js` hat das nicht. Sofort im selben Task behoben (kein Deviation-Rule-Fall, reines Test-Setup-Detail vor dem ersten grünen Lauf).

## Known Stubs

None — keine Platzhalter, keine leeren Datenquellen eingeführt.

## User Setup Required

None — keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- SEC-01-Beweisnetz jetzt vollständig gegen den echten Produktionscode geführt (D-14); künftige Whitelist-Änderungen können strukturell nicht mehr in nur einer Sanitizer-Kopie landen
- Der in Phase 9 eingefrorene Strikethrough-Datenintegritäts-Bug (A4) ist behoben und per E2E bewiesen
- Volle Suiten grün: `npx jest` 554/554 (26 Test-Suiten), `npx playwright test` 314 passed / 2 skipped (PWA-Tests, https/localhost-only, unabhängig von dieser Phase)
- SEC-01 bleibt bis zur letzten deklarierenden Plan-SUMMARY (10-04, Shared-ID-Gate #2388) formal "Pending" in REQUIREMENTS.md
- Bereit für Plan 10-04 und den abschließenden Security-Audit (Plan 10-05, D-09..D-12)

---
*Phase: 10-security-h-rtung*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: tests/unit/sanitizer-parity.test.js
- FOUND: tests/unit/security.test.js (neuer vm-Block gegen utils/basic.js)
- FOUND: utils/basic.js ('strike' in allowedTags)
- FOUND: utils/testable-utils.js ('strike' in allowedTags)
- FOUND: tests/e2e/features/editor-formatting.spec.js (NETZ.strikethrough.roundtrip geändert)
- FOUND: .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md (Ausnahme-Änderung 8)
- FOUND: commit 7562035 (test: Task 1)
- FOUND: commit 3d0e449 (test: Task 2)
- FOUND: commit 33c7923 (feat: Task 3)
