---
phase: 14-tests-gates
fixed_at: 2026-09-07T08:45:00Z
review_path: .planning/phases/14-tests-gates/14-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-09-07T08:45:00Z
**Source review:** .planning/phases/14-tests-gates/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (CR-01, WR-01, WR-02 — fix_scope=critical_warning; IN-01/IN-02 excluded)
- Fixed: 3
- Skipped: 0

**Isolation:** Alle Fixes wurden in einem dedizierten Git-Worktree
(`.claude/worktrees/rf-14-1355-1788770005`, Branch `gsd-reviewfix/14-1355`)
erarbeitet und dort committet, um den Hauptarbeitsbaum waehrend der
Fix-Anwendung nicht zu beruehren. Nach Abschluss aller drei Fixes wurde
`main` per `git merge --ff-only` auf den Stand des Fix-Branches
vorgespult, der Worktree entfernt und der temporaere Branch geloescht
(transaktionaler Cleanup, keine verwaisten Worktrees/Branches). Die
abschliessende Gate-Verifikation (siehe unten) lief NACH diesem
Fast-Forward direkt im Hauptcheckout (nicht im Worktree, der kein
`node_modules` besitzt) — die Zahlen sind also aus dem Baum reproduzierbar,
in dem dieser Report liegt.

## Fixed Issues

### CR-01: Module-to-test coverage gate accepts non-JS-test matches as "covered", masking 8 real gaps

**Files modified:** `tests/unit/module-test-coverage.test.js`
**Commit:** `f284fb7`
**Applied fix:** `walk(TESTS_DIR)` auf `.js`-Dateien beschraenkt (`else if
(full.endsWith('.js'))` statt einem ungefilterten `results.push(full)`),
analog zum bereits engeren Scope von
`tests/unit/eslint-globals-freshness.test.js`. Dadurch zaehlt
`tests/build/test_build_deduplication.py` nicht mehr als "Testerwaehnung"
fuer JS-Module. Nach dem Fix wurden die acht dadurch aufgedeckten Module
(`features/spells/spell-manager.js`,
`features/bestiary/bestiary-editor.js`, `features/initiative-loot.js`,
`features/initiative-combat-widgets.js`,
`features/dmscreen/dmscreen-widgets-base.js`,
`features/dmscreen/dmscreen-widgets-combat.js`,
`features/dmscreen/dmscreen-widgets-reference.js`,
`ui/editors/rich-text-toolbars.js`) — wie von der wichtigen
Zusatzanweisung dieses Runs sowie D-13 (`14-CONTEXT.md`) vorgegeben —
sichtbar und datiert (2026-09-07, mit Verweis auf den CR-01-Fund) in
`MODULE_TEST_EXCEPTIONS` aufgenommen statt echte Tests zu schreiben (das
ist laut D-13 eine eigene Phase, keine Review-Fix-Aufgabe). Unabhaengig
verifiziert per `Grep`, dass keines der acht Module einen `.js`-Treffer
unter `tests/` hat. Test-Datei selbst laeuft nach dem Fix gruen (4/4
Tests), die Ausnahmeliste ist jetzt ehrlich statt maskiert.

### WR-01: `generate-eslint-globals.js`'s declaration regex silently drops destructured/multi-var top-level globals

**Files modified:** `tools/generate-eslint-globals.js`,
`tests/unit/eslint-globals-freshness.test.js`
**Commit:** `113a003`
**Applied fix:** Anstatt die bestehende `DECLARATION_PATTERN`-Regex auf
alle denkbaren Destrukturierungs-/Mehrfach-Muster zu erweitern (riskanter,
da eine Regex-Nachbildung eines echten Parsers selbst eine neue
Fehlerquelle waere), wurde die im Review als Alternative genannte
"lauter Abbruch statt still" umgesetzt: eine neue Funktion
`hasUncapturedTopLevelBinding(line)` (String-literal-bewusster
Komma-Scan + `TOP_LEVEL_DESTRUCTURE_PATTERN` fuer `const {`/`const [`)
wird in `generateGlobalsFromModules()` an Klammertiefe 0 aufgerufen und
wirft eine beschreibende `Error` (Datei, Zeile, Zeileninhalt,
Regenerierungsbefehl), sobald ein Modul eine destrukturierte oder
Mehrfachdeklaration auf Top-Level enthaelt, statt sie stillschweigend zu
uebergehen. Die Funktion wurde als vierter Export ergaenzt (die
"genau drei Namen"-Angabe im Kopfkommentar von
`eslint-globals-freshness.test.js` wurde auf "vier Namen" korrigiert).
Zwei neue Regressionstests wurden ergaenzt: einer prueft
`hasUncapturedTopLevelBinding()` direkt gegen synthetische Faelle
(inkl. eines echten False-Positive-Kandidaten aus dem Live-Baum —
`ui/editors/rich-text.js`s `EDITOR_HOST_SELECTOR`, ein String mit
eingebetteten Kommas, der beim ersten Implementierungsversuch faelschlich
als Mehrfachdeklaration erkannt wurde und zur Nachbesserung des
Komma-Scans um String-Literal-Erkennung fuehrte — Nachweis fuer korrekte
Iteration, nicht nur Behauptung), der andere ruft
`generateGlobalsFromModules()` gegen den echten `loader.js
MODULES`-Baum auf und bestaetigt, dass der neue Guard heute nicht
faelschlich anschlaegt (kein Vorkommen im Live-Baum, wie vom Review
bereits vermerkt).

### WR-02: `seedCleanSession()`'s hardcoded storage payload will silently stop working if `core/data.js`'s default schema changes

**Files modified:** `tests/e2e/helpers/test-utils.js`
**Commit:** `d56302a`
**Applied fix:** Reiner Dokumentations-Fix, keine Verhaltensaenderung.
Ein neuer Kommentarblock im JSDoc von `seedCleanSession()` verweist
explizit namentlich auf `core/data.js`s `initializeData()`-Default-Keys
und auf `render/helpers.js`s `validateDataIntegrity()`
`requiredArrays`/`requiredObjects`-Listen (inkl. aller aktuell
enthaltenen Feldnamen), damit eine kuenftige Aenderung an einer dieser
beiden Stellen eher zu einer entsprechenden Anpassung des Seed-Payloads
fuehrt. Erklaert zusaetzlich, warum der Seed nur die Felder wiederholt,
die `initializeData()` NICHT bereits vorbelegt.

## Skipped Issues

Keine — alle drei Findings im Scope (`critical_warning`) wurden
angewendet und verifiziert.

## Verifikations-Baseline (nach allen drei Fixes, im Hauptcheckout)

| Gate | Befehl | Ergebnis | Vergleich zur vorgegebenen Baseline |
|------|--------|----------|--------------------------------------|
| Lint | `npm run lint` | Exit 0, "0 errors, 367 warnings" | Identisch (exakte Ratsche gehalten) |
| Typecheck | `npx tsc --noEmit` | Exit 0 | Identisch |
| Typecheck (strict) | `npm run typecheck:strict` | Exit 0 | Identisch |
| Jest (voll) | `npx jest` | 49/49 Suiten, **1118/1118** Tests | +2 Tests ggue. Baseline (1116) — beide neu von WR-01 (`hasUncapturedTopLevelBinding`-Regressionstests), kein Verlust bestehender Tests |
| Jest Coverage | `npx jest --coverage` | Exit 0, 0,77% Statements | Identisch |
| Build | `PYTHONIOENCODING=utf-8 python build.py` | `[SUCCESS] Build abgeschlossen!`, Exit 0 | Identisch |
| `npm run check` (Prettier) | — nicht erneut gelaufen | vorbestehend rot (laut Auftrag: nicht meine Baustelle) | Unveraendert, keine der drei Fix-Dateien wurde formatiert angefasst |

Alle Verifikationslaeufe fanden NACH dem Fast-Forward direkt im
Hauptcheckout statt (der Worktree hatte kein `node_modules` und war zum
Zeitpunkt der Verifikation bereits entfernt).

## Hinweis zu CR-01 / Phasenverifikation

Dieser Fix adressiert direkt GAP-01 aus
`.planning/phases/14-tests-gates/14-VERIFICATION.md` (Status
`gaps_found`, TEST-05, einziger Blocker der Phase). Nach diesem Fix
laeuft `tests/unit/module-test-coverage.test.js` ehrlich gruen (4/4
Tests) — die acht zuvor maskierten Module sind jetzt sichtbar (datierte
Ausnahmeliste) statt fälschlich als abgedeckt zu gelten. Eine erneute
Verifikation der Phase (`gsd-verifier` bzw. `/gsd-progress`) sollte
diesen Gap als geschlossen bestaetigen.

---

_Fixed: 2026-09-07T08:45:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
