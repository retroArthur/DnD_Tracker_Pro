---
phase: 08-test-fundament-gr-n
plan: 02
subsystem: testing
tags: [playwright, e2e, test-fixtures, toast-race, event-delegation]

# Dependency graph
requires:
  - phase: 08-01
    provides: "renderAll() dispatch parity (renderRandomTables/renderTimers) and the attribute-modifier collision fix, both needed for tab-navigation.spec.js to verify fully green"
provides:
  - "tests/e2e/tab-navigation.spec.js references real production DOM (.init-entry, .char-card, .timer-card, #encounter-round-num, cb.currentHp) and the real addTimerWithSeconds() API instead of stale/aspirational selectors and a non-existent D.timers data key"
  - "tests/e2e/crud/{quests,npcs,party}.spec.js seed a fully self-consistent D shape (markdownOnboardingSeen + randomTables/timers/shops/campaign/_nextId) before loadApp(), eliminating two independent early-boot save()-triggered info toasts that raced the shared #toast node against validation-error assertions"
  - "quests.spec.js's title-validation assertion corrected to match the real validation-message field key ('title', not the German word 'Titel')"
affects: [08-03, 08-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "page.addInitScript() localStorage seeding of a minimal-but-schema-complete D snapshot (far-future _version so migrateData() is skipped) as documented E2E setup, per D-06, to suppress deterministic early-boot side effects that are unrelated to the interaction under test"
    - "Stack-trace instrumentation technique for tracing async setTimeout-driven side effects back to their trigger: intercept window.setTimeout(fn, exactDelayMs) to capture the caller's stack at schedule-time, since the callback's own stack trace loses the original call chain"

key-files:
  created: []
  modified:
    - tests/e2e/tab-navigation.spec.js
    - tests/e2e/crud/quests.spec.js
    - tests/e2e/crud/npcs.spec.js
    - tests/e2e/crud/party.spec.js

key-decisions:
  - "Seed payload extended beyond RESEARCH's Pitfall-4 recommendation (markdownOnboardingSeen only) to also include randomTables/timers/shops/campaign/_nextId, after stack-trace-instrumented root-cause analysis found a SECOND independent early-boot save()-triggered toast race (features/random-tables.js:initRandomTables() and render/helpers.js:validateDataIntegrity()'s repair-save both call save() unconditionally on a fresh/incomplete D, triggering the file-backup-manager's once-per-session backup-reminder toast) — both toasts stomp the same legacy #toast node the validation tests assert against"
  - "quests.spec.js's 'Titel' assertion corrected to 'title': utils/validation.js builds the toast message from the VALIDATION_SCHEMAS key name directly (`${field}: Pflichtfeld fehlt`), and that key is the English 'title', not the German word 'Titel' — a pre-existing test/prod mismatch that was masked by the toast race and only surfaced once the race was fixed"
  - "#round-num -> #encounter-round-num and combatant hp/maxHp -> currentHp/maxHp fixed in tab-navigation.spec.js's initiative tests (same Pitfall-5 stale-selector/stale-shape pattern as the plan's named fixes, discovered while verifying the named fixes actually turned the tests green)"

requirements-completed: [TEST-01, TEST-02]

coverage:
  - id: D1
    description: "tab-navigation.spec.js's 7 previously-failing tests (init-entry/char-card selectors, ambiguous dice-details selector at 5 sites, timer-item/D.timers data-shape mismatch) now pass against real production DOM and the real addTimerWithSeconds API"
    requirement: TEST-01
    verification:
      - kind: e2e
        ref: "tests/e2e/tab-navigation.spec.js (13/13 tests, 2 consecutive full-file runs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Onboarding-toast race (Pitfall 4) and a second, independently-discovered early-boot backup-reminder-toast race no longer stomp the validation-error toast in quests/npcs/party CRUD specs"
    requirement: TEST-01
    verification:
      - kind: e2e
        ref: "tests/e2e/crud/quests.spec.js, tests/e2e/crud/npcs.spec.js, tests/e2e/crud/party.spec.js (36/36 tests, 2 consecutive full-file runs; the two previously-flaky name-validation tests additionally verified 5x isolated)"
        status: pass
    human_judgment: false
  - id: D3
    description: "No maskierende Dispatches introduced (D-06): addTimerWithSeconds() and the localStorage seed are documented setup, not replacements for the interaction paths under test; no .skip/.only added; no assertion weakened"
    requirement: TEST-02
    verification:
      - kind: e2e
        ref: "npx playwright test (full suite, 233 tests, 2 consecutive runs)"
        status: pass
    human_judgment: false

# Metrics
duration: 50min
completed: 2026-07-23
status: complete
---

# Phase 8 Plan 2: Test-Bug-Fixes (Selektoren, Timer-API, Toast-Race) Summary

**Reale DOM-Selektoren und die echte Timer-API in tab-navigation.spec.js verdrahtet, und zwei unabhängige Boot-Zeit-Toast-Races (Markdown-Onboarding UND ein bislang unbekannter Backup-Hinweis-Toast) in den quests/npcs/party CRUD-Specs per Test-seitigem Daten-Seeding entschärft — reduziert die volle Playwright-Suite von 11 bekannten Fails auf 0 (zweimal in Folge grün, 233 Tests).**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-07-22T23:51:30+02:00 (nach Abschluss von 08-01)
- **Completed:** 2026-07-23T00:33:20+02:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `tab-navigation.spec.js`: `.init-combatant`→`.init-entry`, `.party-member`→`.char-card`, `.timer-item`→`.timer-card`, `window.D.timers.push()`→`window.addTimerWithSeconds()`, sowie die ambige `document.querySelector('.dice-details')`-Selektion (traf immer den ersten von 4 gleichnamigen `<details>`-Blöcken) an allen 5 Fundstellen durch `getElementById('random-tables-list').closest('details')` ersetzt — alle 7 zuvor roten Tests plus der Undo/Redo-Re-Render-Test sind jetzt grün.
- Zwei weitere, im selben Datei-Cluster gefundene Stale-Selektor/Stale-Shape-Bugs mitgefixt (gleiches Muster wie Pitfall 5, nicht einzeln in RESEARCH benannt): `#round-num` existierte nie in der Produktion (real: `#encounter-round-num`), und die Test-Combatants nutzten `hp`/`maxHp` statt dem echten Feld `currentHp`/`maxHp` (`renderInit()` liest `cb.currentHp`).
- Onboarding-Toast-Race (Pitfall 4) in `quests.spec.js`/`npcs.spec.js`/`party.spec.js` durch Pre-Init-Seeding von `D.settings.markdownOnboardingSeen = true` via `page.addInitScript()` entschärft.
- Per Stack-Trace-Instrumentierung (Interception von `window.setTimeout` mit exaktem Delay-Wert, um den Aufrufer eines später feuernden Timers zu ermitteln) eine ZWEITE, unabhängige Boot-Zeit-Race mit identischem Symptom aufgedeckt: `features/random-tables.js:initRandomTables()` ruft bei jedem frischen Boot ungefragt `save()` auf, wenn `D.randomTables` fehlt (~150ms nach Boot); `render/helpers.js:validateDataIntegrity()` plant eine Reparatur-`save()` 1s nach `load()`, wenn `D.timers`/`D.shops`/`D.campaign` oder ein `_nextId`-Eintrag fehlt (alle vier sind keine Default-Felder in `core/data.js:initializeData()`). Beide `save()`-Aufrufe lösen `systems/file-backup/file-backup-manager.js:onAfterSave()`s einmaligen "Ungesicherte Änderungen — Backup herunterladen?"-Info-Toast aus, der denselben geteilten `#toast`-Node überschreibt wie die Validierungsfehler-Meldung — betrifft real jede frische Sitzung, nicht nur Tests. Fix: Seed-Payload um `randomTables: [], timers: [], shops: [], campaign: {}` und einen vollständig befüllten `_nextId` erweitert, sodass `validateDataIntegrity()` keine Reparatur mehr findet und `initRandomTables()`s Guard bereits erfüllt ist.
- `quests.spec.js`: Assertion `toContainText('Titel')` → `toContainText('title')` korrigiert. Die Toast-Meldung wird aus dem Validierungs-Schema-Feldnamen gebaut (`${field}: Pflichtfeld fehlt`, `utils/validation.js:32`); `VALIDATION_SCHEMAS.quest.title` ist der englische Schlüssel `title`, nie das deutsche Wort „Titel" — dieser Mismatch war zuvor durch die Toast-Race maskiert (der Test schlug ohnehin am falschen Toast-Inhalt fehl, sodass der zweite Fehler nie sichtbar wurde).

## Task Commits

Each task was committed atomically:

1. **Task 1: tab-navigation.spec.js — reale Selektoren + echte Timer-API (Pitfall 5/6/8)** - `55d449f` (fix)
2. **Task 2: Onboarding-Toast-Race in crud-Validierungstests entschärfen (Pitfall 4, D-06)** - `715baa9` (fix)

_Kein separater Plan-Metadaten-Commit — dieser folgt nach dem Self-Check via den Final-Commit-Schritt._

## Files Created/Modified
- `tests/e2e/tab-navigation.spec.js` - Reale Klassen/IDs/APIs statt stale/aspirationaler Selektoren (siehe Accomplishments)
- `tests/e2e/crud/quests.spec.js` - Pre-Init-Seed (markdownOnboardingSeen + randomTables/timers/shops/campaign/_nextId) in `beforeEach`; `'Titel'`→`'title'`-Assertion-Fix
- `tests/e2e/crud/npcs.spec.js` - Gleicher Pre-Init-Seed in `beforeEach`
- `tests/e2e/crud/party.spec.js` - Gleicher Pre-Init-Seed in `beforeEach`

## Decisions Made
- Seed-Payload über RESEARCH's Pitfall-4-Empfehlung (nur `markdownOnboardingSeen`) hinaus erweitert, nachdem die Stack-Trace-Analyse eine zweite, unabhängige Boot-Zeit-Race fand (Details siehe Accomplishments / Deviations).
- `quests.spec.js`'s `'Titel'`-Assertion auf `'title'` korrigiert, um dem tatsächlichen Validierungs-Schema-Feldnamen zu entsprechen.
- `#round-num`→`#encounter-round-num` und `hp`/`maxHp`→`currentHp`/`maxHp` in den Initiative-Tests von `tab-navigation.spec.js` gefixt (gleiches Pitfall-5-Muster, beim Verifizieren der benannten Fixes entdeckt).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zusätzliche Stale-Selektoren in den Initiative-Tests von tab-navigation.spec.js**
- **Found during:** Task 1 (Verifikation nach dem `.init-combatant`→`.init-entry`-Fix)
- **Issue:** Nach dem Selektor-Fix schlugen zwei Initiative-Tests weiterhin fehl: `#round-num` existiert nirgends in der Produktion (real: `#encounter-round-num`, `features/initiative.js:117`), und die Test-Fixtures setzten `hp`/`maxHp` statt dem tatsächlich von `renderInit()` gelesenen Feld `currentHp`/`maxHp` (`features/initiative.js:192`).
- **Fix:** Beide Stellen auf die realen Feld-/ID-Namen korrigiert (2x `#round-num`→`#encounter-round-num`, 3x `hp:`→`currentHp:` in den Combatant-Fixtures, 1x `.hp = 15`→`.currentHp = 15` bei der Re-Render-Modifikation).
- **Files modified:** tests/e2e/tab-navigation.spec.js
- **Verification:** `npx playwright test tests/e2e/tab-navigation.spec.js` 13/13 grün, zwei Läufe in Folge.
- **Committed in:** 55d449f (Teil von Task 1)

**2. [Rule 1 - Bug] Zweite, unabhängige Boot-Zeit-Toast-Race entdeckt und entschärft**
- **Found during:** Task 2 (Verifikation nach dem `markdownOnboardingSeen`-Seed — `party.spec.js`s "Charakter ohne Namen"-Test blieb weiterhin flakig/fehlschlagend trotz des Onboarding-Fixes)
- **Issue:** Stack-Trace-Instrumentierung (temporäres `window.setTimeout`-Interception in einer Kopie des Tests, danach entfernt) zeigte: `features/random-tables.js:initRandomTables()` ruft bei fehlendem `D.randomTables` ungefragt `save()` auf (~150ms nach Boot); `render/helpers.js:validateDataIntegrity()` plant zusätzlich eine Reparatur-`save()` 1s nach `load()`, wenn `D.timers`/`D.shops`/`D.campaign` oder `_nextId`-Einträge fehlen (keiner dieser 4 Felder ist Teil des Default-Schemas in `core/data.js`). Beide `save()`-Pfade lösen den einmaligen Backup-Hinweis-Toast aus `systems/file-backup/file-backup-manager.js:onAfterSave()` aus, der den geteilten `#toast`-Node überschreibt — exakt dasselbe Symptom wie die Onboarding-Race, nur mit anderer Quelle.
- **Fix:** Seed-Payload in allen 3 CRUD-Specs um `randomTables: [], timers: [], shops: [], campaign: {}` und einen vollständig befüllten `_nextId` (alle 11 von `validateAndRepairNextId()` geprüften Entity-Typen) erweitert — reines Test-Setup, keine App-Quelle verändert.
- **Files modified:** tests/e2e/crud/quests.spec.js, tests/e2e/crud/npcs.spec.js, tests/e2e/crud/party.spec.js
- **Verification:** `npx playwright test tests/e2e/crud/{quests,npcs,party}.spec.js` 36/36 grün, zwei Läufe in Folge; die zuvor flakige `party.spec.js`-Namensvalidierung zusätzlich 5x isoliert stabil; volle Suite (233 Tests) zweimal in Folge 0 Fails.
- **Committed in:** 715baa9 (Teil von Task 2)

**3. [Rule 1 - Bug] quests.spec.js's 'Titel'-Assertion entsprach nie der echten Toast-Meldung**
- **Found during:** Task 2 (nach dem Toast-Race-Fix zeigte der Test einen NEUEN, spezifischeren Fehlschlag statt des maskierten)
- **Issue:** `expect(page.locator('#toast')).toContainText('Titel')` erwartete das deutsche Wort „Titel", aber `utils/validation.js`s Fehlermeldung nutzt den Schema-Feldnamen direkt (`title: Pflichtfeld fehlt`) — die beiden Strings sind trotz gleicher Buchstaben in unterschiedlicher Reihenfolge keine Substring-Übereinstimmung. Dieser Mismatch existierte schon vor diesem Plan, war aber durch die Toast-Race maskiert (der Test schlug ohnehin am falschen — Onboarding- bzw. Backup-Hinweis- — Toast-Inhalt fehl).
- **Fix:** Assertion auf `toContainText('title')` korrigiert (Kommentar mit Quellenverweis ergänzt).
- **Files modified:** tests/e2e/crud/quests.spec.js
- **Verification:** `npx playwright test tests/e2e/crud/quests.spec.js -g "Quest ohne Titel"` grün, zwei Läufe in Folge.
- **Committed in:** 715baa9 (Teil von Task 2)

---

**Total deviations:** 3 auto-fixed (alle Rule 1 — Bug, alle innerhalb des Task-Scopes vor dem jeweiligen Commit behoben)
**Impact on plan:** Kein Scope-Creep — alle drei Funde liegen exakt in den vom Plan benannten Dateien und sind dieselbe Fehlerklasse (Stale-Selektor bzw. Boot-Zeit-Race), nur zusätzlich zu den explizit benannten Fällen entdeckt. Ein `prohibitions`-Punkt des Plans wird dadurch NICHT verletzt vollständig erfüllt: keine Assertion wurde geschwächt oder entfernt, `toContainText('Titel')` wurde auf den tatsächlich korrekten String korrigiert (nicht gelockert), und der Plan-Acceptance-Kriterium „grep findet toContainText('Titel')" wird technisch nicht mehr erfüllt — dies ist eine bewusste, dokumentierte Abweichung, da der Plan-Autor die reale Toast-Meldung noch nicht kennen konnte (die Race maskierte sie zum Planungszeitpunkt).

## Issues Encountered
- Die Root-Cause-Suche für die zweite Boot-Zeit-Race (Deviation 2) erforderte mehrere Instrumentierungs-Iterationen (DOM-Polling, MutationObserver, `window.setTimeout`-Interception), da `save()` als lexikalisch gebundene `const`-Deklaration in `systems/spellslots/persistence.js` deklariert ist — ein externer `window.save`-Wrapper hätte bare `save()`-Aufrufe strukturell nicht abgefangen (dokumentiertes CLAUDE.md-Muster). Die `window.setTimeout(fn, 300)`-Interception (300ms = die Save-Debounce-Verzögerung) lieferte den entscheidenden Stack: `init()` → `renderRandomTables()` → `initRandomTables()` → `save()`. Alle Diagnose-Skripte (`tests/e2e/probe-*.spec.js`) wurden nach Abschluss der Untersuchung entfernt, nicht committet.

## User Setup Required
None - keine externe Service-Konfiguration nötig.

## Next Phase Readiness
- Alle 11 in 08-RESEARCH.md dokumentierten E2E-Fails (7 tab-navigation + 2 CRUD-Attribut-Modifikator aus 08-01 + 1 Quest-Titel-Validierung + 1 Global-Search aus 08-01, plus die 2 zusätzlich in der Baseline gefundenen flakigen Namensvalidierungstests) sind behoben.
- `npx playwright test` (volle Suite, 233 Tests): 231 grün / 2 skipped / 0 fails — zweimal in Folge bestätigt.
- `npx jest`: 457/457 grün, keine Regression.
- 08-03/08-04 (suite-weite Assertion-Härtung, CI-Gate) können auf einer bereits vollständig grünen Baseline aufbauen — kein „Test-Bug vs. App-Bug"-Rauschen mehr zu klären.
- Der `docs/e2e-failure-triage.md`-Fortschreibung (D-07) sowie das formale zweimalige Voll-Lauf-Gate sind laut Plan-Verifikationstext Teil von 08-04; hier bereits informell zweimal grün verifiziert als Vorab-Bestätigung.

---
*Phase: 08-test-fundament-gr-n*
*Completed: 2026-07-23*

## Self-Check: PASSED

All 4 modified files verified present on disk (tests/e2e/tab-navigation.spec.js, tests/e2e/crud/quests.spec.js, tests/e2e/crud/npcs.spec.js, tests/e2e/crud/party.spec.js); both task commit hashes (55d449f, 715baa9) verified present in `git log --oneline --all`.
