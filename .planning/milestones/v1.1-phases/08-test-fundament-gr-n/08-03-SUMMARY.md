---
phase: 08-test-fundament-gr-n
plan: 03
subsystem: testing
tags: [playwright, jest, assertion-hardening, isvisible-guard, page-evaluate, waitfortimeout]

# Dependency graph
requires:
  - phase: 08-01
    provides: "App-Bug-Fixes (Attribut-Modifikator, Migration-Banner, renderAll-Luecke) — Baseline fuer die Haertung"
  - phase: 08-02
    provides: "Volle Playwright-Suite (233 Tests) 0 Fails, zweimal in Folge gruen — Haertung durfte gegen eine bereits gruene Baseline laufen"
provides:
  - "Exakte toBe(N)-Assertions ueberall dort, wo der Count aus bekannten Fixture-/Setup-Daten deterministisch ableitbar ist (6 Stellen in 4 Dateien)"
  - "Inline-Begruendungskommentare an allen verbleibenden losen toBeGreaterThan(0)-Stellen (17 Stellen: SRD-Datensatzgroesse, Fuzzy-Suche, Zufalls-Text, Zufalls-HP-Variation, Date.now()-Timestamps)"
  - "D-06-Keep-Entscheidung mit Inline-Dokumentation an beiden Bestandsausnahmen (page.evaluate(nextTurn), page.evaluate(switchView))"
  - "15 zuvor maskierende isVisible()-Guards (100% der Test-Assertions im Guard) in 5 Dateien durch harte Assertions ersetzt — inkl. echtem Root-Cause-Fund in quests.spec.js (.quest-details ist bis zum Header-Klick eingeklappt)"
  - "waitForSelector/waitForFunction statt fixer waitForTimeout(200-500) an den Stellen, die direkt an den in 08-01/08-02 gefixten Races haengen (tab-navigation.spec.js, party.spec.js, npcs.spec.js)"
affects: [08-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline-Begruendungskommentar direkt ueber jeder retained-loose toBeGreaterThan(0)-Assertion, mit Verweis auf Phase 8 / D-04"
    - "isVisible()-Guard-Konvention: statisches/immer-gerendertes Markup bekommt eine harte await expect(x).toBeVisible(); optionale Formularfelder ohne eigene expect()-Aufrufe im Guard bleiben unveraendert (legitimes Optional-Feld-Muster)"
    - "D-06-Bestandsausnahme-Dokumentation: mehrzeiliger Inline-Kommentar direkt am evaluate()-Aufruf, der die Pruefung gegen das Kriterium und den Keep-Grund festhaelt"

key-files:
  created: []
  modified:
    - tests/unit/action-registry.test.js
    - tests/unit/welt-story.test.js
    - tests/unit/stability.test.js
    - tests/unit/initiative-mob.test.js
    - tests/integration/encounter-builder.test.js
    - tests/e2e/features/character-advancement.spec.js
    - tests/e2e/features/bestiary.spec.js
    - tests/e2e/features/dice-stats.spec.js
    - tests/e2e/features/initiative.spec.js
    - tests/e2e/features/welt-story.spec.js
    - tests/e2e/app.spec.js
    - tests/e2e/tab-navigation.spec.js
    - tests/e2e/crud/quests.spec.js
    - tests/e2e/crud/party.spec.js
    - tests/e2e/crud/encounters.spec.js
    - tests/e2e/crud/npcs.spec.js

key-decisions:
  - "encounter-builder.test.js: suggestMonsterCount(2000,'1',4) haertet auf toBe(5) — reine Formel (CR_TO_XP, getMultiplier-Stufen), kein Zufall, exakt herleitbar"
  - "stability.test.js: compareVersionsLocal('2.11','2.6.1') haertet auf toBe(1) — Funktion gibt ausschliesslich -1/0/1 zurueck, Index-1-Vergleich (11 vs 6) entscheidet deterministisch"
  - "character-advancement.spec.js: XP-Verteilung 100/2 ausgewaehlte Charaktere haertet auf toBe(50) je Charakter — Fixture setzt total=100 explizit, distributeXP() nutzt Math.floor(100/2)"
  - "dice-stats.spec.js: 2 addToDiceHistory()-Aufrufe haerten auf toBe(2) IDB-Records — jeder Playwright-Test startet mit frischem Browser-Context (eigene IndexedDB-Partition), kein Batching in statsIdbPut()"
  - "SRD-Monsterdatensatz-abhaengige Counts (bestiary.spec.js 8x, initiative.spec.js 1x) bleiben bewusst loose — RESEARCH klassifiziert 'pre-seeded SRD/monster count' explizit als legitim nicht-exakt"
  - "Fuzzy-Suche 'mindestens N Treffer' (action-registry.test.js 2x) und zufaellige Text-Tabelleneintraege (welt-story.test.js/spec.js) bleiben loose — RESEARCH-Beispiele fuer legitime Nicht-Determinismen"
  - "Math.random()-basierte Mob-HP-Variation (initiative-mob.test.js) und echte Date.now()-Timestamps (stability.test.js 2x) bleiben loose — Zufall bzw. Laufzeit-Werte, kein exakter Wert moeglich"
  - "app.spec.js: Ort-/NPC-Chip-/NPC-Auswahl-Tests seeden jetzt vor der echten Klick-Interaktion Mindestdaten per page.evaluate() + renderX() (dokumentiertes Setup, D-06) — die Guards davor liessen die Tests bei der (immer leeren) Frisch-Installation permanent im Leerlauf durchlaufen"
  - "app.spec.js D20-Wuerfel-Test: Selektor war komplett stale ([data-value='d20'] statt echtem data-value='20', .dice-btn statt .dice-die.d20) — isVisible() war dadurch strukturell immer false, nicht nur 'optional'"
  - "quests.spec.js: echter Root-Cause hinter 4 der 5 Guards gefunden — .quest-details (inkl. edit-quest/delete-quest) ist per CSS bis zum Aufklappen des .quest-header eingeklappt; Fix ist ein echter Klick auf .quest-header vor der Interaktion, nicht nur eine harte Assertion"
  - "party.spec.js/npcs.spec.js/encounters.spec.js: edit-*/delete-*-Buttons liegen im automatisch ausgewaehlten Detail-Panel (kein Collapse-Mechanismus wie bei Quests) — Guards dort waren reine Vorsichtsmassnahmen ohne echten Maskierungs-Impact, trotzdem gemaess Audit-Kriterium gehaertet"
  - "waitForTimeout-Haertung (D-05) beschraenkt auf Stellen, die direkt an den 08-01/08-02-Fixes haengen (Pitfall-5/-6/-7/-8-Selektoren in tab-navigation.spec.js, Toast-Race in party.spec.js/npcs.spec.js) — keine Flaechenaenderung der uebrigen ~16 unberuehrten Spec-Dateien"

requirements-completed: [TEST-02]

coverage:
  - id: D1
    description: "Suite-weites Zaehl-Assertion-Inventar (23 toBeGreaterThan(0)-Stellen aus 08-RESEARCH.md) reviewed: 6 deterministische Stellen auf toBe(N) gehaertet, 17 verbleibende mit Inline-Begruendung dokumentiert"
    requirement: TEST-02
    verification:
      - kind: unit
        ref: "npx jest (457/457 passed)"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/{character-advancement,bestiary,dice-stats,initiative,welt-story}.spec.js (85/85 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "isVisible()-Guard-Audit: 15 zuvor 100%-innerhalb-Guard-Tests in app.spec.js, quests.spec.js, party.spec.js, encounters.spec.js, npcs.spec.js identifiziert und auf harte Assertionen umgestellt (inkl. Root-Cause-Fix in quests.spec.js: .quest-header muss aufgeklappt werden)"
    requirement: TEST-02
    verification:
      - kind: e2e
        ref: "npx playwright test (volle Suite, 233 Tests, zwei aufeinanderfolgende Laeufe: 231 passed / 2 skipped / 0 failed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "D-06 page.evaluate()-Audit: beide dokumentierten Bestandsausnahmen (nextTurn, switchView) einzeln geprueft und mit Inline-Keep-Begruendung versehen; keine weiteren interaktions-maskierenden evaluate()-Stellen in den 8 angefassten Dateien gefunden"
    requirement: TEST-02
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/initiative.spec.js tests/e2e/features/welt-story.spec.js"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-05 waitForTimeout-Haertung: fixe Waits an den Stellen ersetzt, die direkt an den 08-01/08-02-Race-Fixes haengen (tab-navigation.spec.js Pitfall-5/-6/-7/-8, party.spec.js/npcs.spec.js Toast-Race) — keine Flaechenaenderung der restlichen ~16 unberuehrten Spec-Dateien"
    requirement: TEST-02
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/tab-navigation.spec.js (13/13 passed, zweimal in Folge)"
        status: pass
    human_judgment: false

# Metrics
duration: 28min
completed: 2026-07-23
status: complete
---

# Phase 8 Plan 3: Assertion-Haertung (D-04/D-05/D-06) Summary

**Suite-weite Assertion-Haertung: 6 deterministische toBeGreaterThan(0)-Stellen auf exakte toBe(N) umgestellt, 15 maskierende isVisible()-Guards (inkl. eines echten quests.spec.js-Root-Cause-Bugs — eingeklapptes .quest-details) in harte Assertionen konvertiert, die beiden page.evaluate()-Bestandsausnahmen D-06-geprueft dokumentiert, und die direkt an 08-01/08-02-Fixes haengenden waitForTimeout-Stellen durch waitForSelector/waitForFunction ersetzt — volle Suite (233 Tests) zweimal in Folge 0 Fails.**

## Performance

- **Duration:** ~28 min
- **Started:** 2026-07-23T00:36:05+02:00 (nach Abschluss von 08-02)
- **Completed:** 2026-07-23T01:04:16+02:00
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- **Task 1 (D-04):** Das komplette 23-Stellen-Inventar aus 08-RESEARCH.md gegen aktuellen `main` reconciled (24. Stelle in `tests/unit/action-registry-collisions.test.js` — neu aus 08-01, nicht Teil des Inventars, unberuehrt gelassen). Sechs Stellen sind deterministisch aus bekannten Setup-Daten ableitbar und wurden auf exakte `toBe(N)` gehaertet: `encounter-builder.test.js` (Formel-basiert: `toBe(5)`), `stability.test.js` (Vergleichslogik: `toBe(1)`), `character-advancement.spec.js` 2x (XP-Fixture: `toBe(50)`), `dice-stats.spec.js` 2x (IDB-Record-Count: `toBe(2)`). Alle 17 verbleibenden losen Stellen (SRD-Monsterdatensatz-Groesse, Fuzzy-Suche "mindestens N", zufaellige Wetter-Texte, `Math.random()`-Mob-HP-Variation, echte `Date.now()`-Timestamps) tragen jetzt einen Inline-Begruendungskommentar.
- **Task 2a (D-06):** Beide dokumentierten `page.evaluate()`-Bestandsausnahmen (`nextTurn` in `initiative.spec.js`, `switchView` in `welt-story.spec.js`) einzeln gegen das D-06-Kriterium geprueft und mit ausfuehrlicher Inline-Begruendung als BEIBEHALTEN markiert — beide sind dokumentierte Navigations-/Setup-Vehikel (Pointer-Interception durch Statblock-Drawer bzw. Fullscreen-Modal), nicht Ersatz fuer die eigentlich getestete Interaktion. Keine weiteren maskierenden `evaluate()`-Stellen in den 8 angefassten Dateien gefunden.
- **Task 2b (isVisible-Audit):** 15 Tests identifiziert, deren gesamte Assertion-Menge in einem einzigen `isVisible()`-Guard lag — bei fehlendem Element liefen diese Tests permanent leer durch (stiller Pass). Alle konvertiert. In `app.spec.js` mussten dafuer erst Mindestdaten geseedet werden (Orte/NPCs existieren bei frischer App nicht), plus ein komplett stale D20-Wuerfel-Selektor gefixt. In `quests.spec.js` wurde ein echter Root-Cause gefunden: `.quest-details` (inkl. `edit-quest`/`delete-quest`) ist per CSS bis zum Aufklappen des `.quest-header` eingeklappt — der alte Guard maskierte dieses fehlende Aufklappen, der Fix ist ein echter Klick auf den Header vor der Interaktion.
- **Task 2c (D-05):** Fixe `waitForTimeout(200-500)`-Aufrufe, die direkt an den in 08-01/08-02 gefixten Races haengen, durch `waitForSelector`/`waitForFunction` auf die konkrete Bedingung ersetzt — 11 Stellen in `tab-navigation.spec.js` (Pitfall-5/-6/-7/-8-Selektor-Fixes) sowie je 1 Stelle in `party.spec.js`/`npcs.spec.js` (Toast-Race-Fix, jetzt `#toast.error` statt fixem Sleep). Die restlichen ~16 unberuehrten Spec-Dateien wurden nicht angefasst.
- Volle Playwright-Suite (233 Tests) zweimal in Folge gruen: 231 passed / 2 skipped / 0 failed. `npx jest`: 457/457 gruen, keine Regression.

## Task Commits

Each task was committed atomically:

1. **Task 1: Exakte Zaehl-Assertionen — toBeGreaterThan(0) → toBe(N) wo deterministisch (D-04)** - `4a25d98` (test)
2. **Task 2: Maskierungs-Audit (isVisible-Guards, page.evaluate) + waitForTimeout in angefassten Specs (D-05/D-06)** - `4238250` (fix)

_Kein separater Plan-Metadaten-Commit — dieser folgt nach dem Self-Check via den Final-Commit-Schritt._

## Files Created/Modified
- `tests/unit/action-registry.test.js` - 2x Inline-Begruendung (Fuzzy-Suche)
- `tests/unit/welt-story.test.js` - 2x Inline-Begruendung (Zufalls-Wettertext)
- `tests/unit/stability.test.js` - 1x `toBe(1)` gehaertet, 2x Inline-Begruendung (Date.now())
- `tests/unit/initiative-mob.test.js` - 1x Inline-Begruendung (Random-HP-Variation)
- `tests/integration/encounter-builder.test.js` - 1x `toBe(5)` gehaertet
- `tests/e2e/features/character-advancement.spec.js` - 2x `toBe(50)` gehaertet
- `tests/e2e/features/bestiary.spec.js` - 8x Inline-Begruendung (SRD-Datensatz)
- `tests/e2e/features/dice-stats.spec.js` - 2x `toBe(2)` gehaertet
- `tests/e2e/features/initiative.spec.js` - 1x Inline-Begruendung (SRD), 2x D-06-Keep-Kommentar (nextTurn)
- `tests/e2e/features/welt-story.spec.js` - 1x Inline-Begruendung (Zufalls-Wettertext), 1x D-06-Keep-Kommentar (switchView)
- `tests/e2e/app.spec.js` - 5 isVisible-Guards konvertiert (inkl. Daten-Seeding + D20-Selektor-Fix)
- `tests/e2e/tab-navigation.spec.js` - 11x waitForTimeout → waitForSelector/waitForFunction (D-05)
- `tests/e2e/crud/quests.spec.js` - 5 isVisible-Guards konvertiert (inkl. .quest-header-Aufklapp-Fix)
- `tests/e2e/crud/party.spec.js` - 4 isVisible-Guards konvertiert, 1x waitForTimeout → waitForSelector(#toast.error)
- `tests/e2e/crud/encounters.spec.js` - 5 isVisible-Guards konvertiert
- `tests/e2e/crud/npcs.spec.js` - 4 isVisible-Guards konvertiert, 1x waitForTimeout → waitForSelector(#toast.error)

## Decisions Made

Siehe `key-decisions` im Frontmatter fuer die vollstaendige Liste der Haertungs-Entscheidungen (deterministisch vs. legitim-loose) sowie die beiden Root-Cause-Funde (quests.spec.js Collapse-Verhalten, app.spec.js Daten-Abhaengigkeit + stale D20-Selektor).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] quests.spec.js: isVisible()-Guard maskierte ein echtes fehlendes UI-Aufklappen, nicht nur ein optionales Element**
- **Found during:** Task 2 (Verifikation der konvertierten Guards — 4 von 10 Tests schlugen fehl: `locator resolved ... unexpected value "hidden"`)
- **Issue:** Die urspruengliche Annahme (edit-quest/delete-quest sind wie bei Party/NPCs/Encounters immer sichtbares Detail-Panel-Markup) war falsch. `.quest-details` (assets/styles/core.css: `.quest-item.expanded .quest-details { display: block; }`) ist standardmaessig eingeklappt — die Buttons existieren im DOM, sind aber bis zum Klick auf `.quest-header` unsichtbar. Der alte `isVisible()`-Guard hatte dieses fehlende Aufklappen jahrelang als stillen Pass maskiert.
- **Fix:** Vor jeder editBtn/deleteBtn-Assertion einen echten `page.click('.quest-header')` + kurzes `waitForTimeout(200)` ergaenzt, dann harte `toBeVisible()`-Assertion.
- **Files modified:** tests/e2e/crud/quests.spec.js
- **Verification:** `npx playwright test tests/e2e/crud/quests.spec.js` 10/10 gruen (vorher 4 Fails)
- **Committed in:** 4238250 (Teil von Task 2)

**2. [Rule 1 - Bug] app.spec.js D20-Wuerfel-Selektor war komplett stale**
- **Found during:** Task 2 (Konvertierung des isVisible()-Guards zu harter Assertion)
- **Issue:** `[data-action="roll-dice"][data-value="d20"], .dice-btn[data-dice="d20"]` matchte nie die reale Produktions-Markup (`.dice-die.d20[data-action="roll-dice"][data-value="20"]`, assets/templates/view-tools.html:92) — der Test lief seit Erstellung im permanenten stillen Leerlauf.
- **Fix:** Selektor auf die reale Markup korrigiert.
- **Files modified:** tests/e2e/app.spec.js
- **Verification:** `npx playwright test tests/e2e/app.spec.js` 14/14 gruen
- **Committed in:** 4238250 (Teil von Task 2)

---

**Total deviations:** 2 auto-fixed (beide Rule 1 — Bug, innerhalb des Task-2-Scopes vor dem Commit behoben)
**Impact on plan:** Kein Scope-Creep — beide Funde sind exakt das, wonach der isVisible()-Guard-Audit gemaess Plan-Auftrag suchen sollte (maskierte fehlende Elemente), nur mit einer konkreteren Root-Cause als urspruenglich angenommen (Collapse-CSS bzw. stale Selektor statt reiner "Vorsichtsmassnahme").

## Issues Encountered

Keine unerwarteten Blocker. Die einzige Ueberraschung (Deviation 1/2 oben) wurde inline behoben, ohne den Plan-Scope zu verlassen.

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Next Phase Readiness

- TEST-02 (Assertion-Haertung) ist fuer die 8 in diesem Plan angefassten Dateien vollstaendig umgesetzt: exakte Counts wo deterministisch, keine 100%-innerhalb-Guard-Tests mehr, D-06-konforme evaluate()-Nutzung dokumentiert.
- Volle Playwright-Suite (233 Tests): zweimal in Folge 231 passed / 2 skipped / 0 failed.
- `npx jest`: 457/457 gruen, keine Regression.
- Keine Produktionscode-Aenderung in diesem Plan — reiner Test-Datei-Scope, wie von der Plan-Verifikation gefordert.
- 08-04 (verbleibende Restarbeiten: `docs/e2e-failure-triage.md`-Fortschreibung D-07, CI-Gate D-03) kann auf einer vollstaendig gruenen UND gehaerteten Baseline aufbauen.

---
*Phase: 08-test-fundament-gr-n*
*Completed: 2026-07-23*

## Self-Check: PASSED

All 16 modified files verified present on disk; both task commit hashes (4a25d98, 4238250) verified present in `git log --oneline --all`.
