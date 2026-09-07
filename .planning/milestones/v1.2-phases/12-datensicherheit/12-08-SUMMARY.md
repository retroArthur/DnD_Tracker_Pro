---
phase: 12-datensicherheit
plan: 08
subsystem: migration
tags: [migration-wizard, data-safety, gap-closure, G-12-3, SAFE-04, jest]

# Dependency graph
requires:
  - phase: 12-datensicherheit (12-04)
    provides: "isFreshInstall() async, delegiert an readCampaignDataForBackup()"
provides:
  - "systems/migration/migration-wizard.js: CAMPAIGN_CONTENT_ARRAYS/_TEXT_FIELDS/_PATHS + hasCampaignContent(), verdrahtet in isFreshInstall()"
affects:
  - "systems/migration/migration-wizard.js: isFreshInstall() — Inhaltsdefinition erweitert von 3 auf 22 belegte Stellen"

# Actuals (#2632)
actuals:
  tokens: 21000
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Aufnahmeregel als Kopfkommentar direkt an der Konstante: eine Sammlung zaehlt als Inhalt, wenn sie im Startzustand leer ist UND nur durch Nutzerhandlung befuellt wird — verhindert den Gegenfehler (T-12-25), jede Installation dauerhaft als 'nicht frisch' einzustufen"
    - "Strukturpruefung gegen die echte initializeData() (vm.createContext(), core/data.js in eigenem isoliertem Kontext geladen, nicht abgetippt) als Schutzschicht gegen kuenftige stille Erweiterung der Inhaltsliste"
    - "describe.each()/test.each() brauchen die zu iterierende Liste zur Modul-Sammelzeit (vor beforeAll()) — dafuer ein eigener, minimaler Wegwerf-vm-Kontext direkt beim Testdatei-Laden, unabhaengig vom geteilten Verhaltens-Kontext"

key-files:
  created: []
  modified:
    - systems/migration/migration-wizard.js
    - tests/unit/migration-wizard.test.js

key-decisions:
  - "describe.each(REAL_CAMPAIGN_CONTENT_PATHS.map(p => [p])) statt describe.each(REAL_CAMPAIGN_CONTENT_PATHS) direkt — describe.each() spreadet jede Zeile eines Arrays von Arrays als Einzelparameter; ohne die Verpackung waeren die zwei Segmente eines Pfads (z. B. ['soundboard','scenes']) als zwei separate Testparameter angekommen statt als ein Pfad-Array (waehrend der Implementierung gefunden, kein Plan-Text wörtlich uebernehmbar)"
  - "Zugriff auf die drei Inhaltslisten in den Tests ueber context.window.CAMPAIGN_CONTENT_ARRAYS statt context.CAMPAIGN_CONTENT_ARRAYS — top-level const-Deklarationen werden von vm.runInContext() NICHT als Eigenschaft auf dem Kontext-Objekt selbst sichtbar (nur function-Deklarationen sind das, wie schon bei context.isFreshInstall()); der window.*-Export macht sie ueber context.window.* erreichbar"

requirements-completed: []

coverage:
  - id: D1
    description: "Eine Kampagne mit ausschliesslich Zaubern (keine characters/npcs/quests) gilt nicht als Frischinstallation"
    requirement: "SAFE-04"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#nur Zauber gefuellt (characters/npcs/quests leer) -> false (Durchstich G-12-3)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Eine leere Kampagne im realistischen Startzustand (initializeData() plus Standard-Zufallstabellen, Standard-DM-Screen-Layout, befuelltes _nextId) gilt weiterhin als Frischinstallation"
    requirement: "SAFE-04"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#Gegenprobe: realistischer Startzustand bleibt frisch (initializeData() + Standard-Zufallstabellen + Standard-DM-Screen-Layout + befuelltes _nextId)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Jeder Eintrag aus CAMPAIGN_CONTENT_ARRAYS / _TEXT_FIELDS / _PATHS kippt das Urteil einzeln"
    requirement: "SAFE-04"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#Sammlung \"<name>\" kippt das Urteil einzeln (CAMPAIGN_CONTENT_ARRAYS) — 17 Faelle"
        status: pass
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#Textfeld \"<name>\" kippt das Urteil einzeln (CAMPAIGN_CONTENT_TEXT_FIELDS) — 2 Faelle (plus Leerzeichen-Gegenprobe je Feld)"
        status: pass
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#Pfad \"<path>\" kippt das Urteil einzeln (CAMPAIGN_CONTENT_PATHS) — 3 Faelle"
        status: pass
    human_judgment: false
  - id: D4
    description: "Strukturpruefung: jeder gelistete Eintrag ist im Rueckgabewert von initializeData() leer oder nicht vorhanden; settings/randomTables/dmScreenLayout/_nextId stehen in keiner Liste"
    requirement: "SAFE-04"
    verification:
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#Strukturpruefung: jeder Eintrag aus CAMPAIGN_CONTENT_ARRAYS/_TEXT_FIELDS/_PATHS ist im Rueckgabewert von initializeData() nicht vorhanden oder leer"
        status: pass
      - kind: unit
        ref: "tests/unit/migration-wizard.test.js#Umkehrprobe: settings/randomTables/dmScreenLayout/_nextId stehen in keiner der drei Listen (T-12-25)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Mutationsnachweis: bei zurueckgenommenem Fix fallen benannte Tests um"
    requirement: "SAFE-04"
    verification:
      - kind: unit
        ref: "hasCampaignContent() testweise auf 'return false' gesetzt (hartkodierte Mutation, systems/migration/migration-wizard.js) -> 6 von 14 Task-1-Tests fielen um: 'STORAGE_KEY_OVERRIDE gesetzt und unter diesem Key liegen Charaktere -> false', 'localStorage-Key entfernt, Daten nur ueber IDB-Stufe erreichbar -> false', 'window.readCampaignDataForBackup nicht verfuegbar -> synchrone StorageAPI-Rueckfallebene', 'nur Zauber gefuellt (characters/npcs/quests leer) -> false (Durchstich G-12-3)', 'vorhandene Daten (isFreshInstall -> false) -> kein setTimeout(showMigrationWizard) geplant', 'vorhandene Daten + Abbruch am confirm() -> Import blockiert, keine Aenderung'. Mutation zurueckgenommen, 14/14 wieder gruen."
        status: pass
    human_judgment: false

# Metrics
duration: ~50min
completed: 2026-09-04
status: complete
---

# Phase 12 Plan 08: Gap-Closure G-12-3 — Inhalts-Prüfung der Frischinstallation Summary

**`isFreshInstall()` zählt Kampagneninhalt jetzt über 22 belegte Stellen (17 Arrays, 2 Textfelder, 3 verschachtelte Pfade) statt nur `characters`/`npcs`/`quests` — eine Kampagne mit ausschließlich einer Zauberbibliothek löst den Bestandsschutz-Dialog vor dem Import jetzt korrekt aus, während eine wirklich leere Installation weiterhin als frisch gilt.**

## Performance

- **Duration:** ~50 min
- **Started:** im Anschluss an die Verifikation von Phase 12 (12-VERIFICATION.md, G-12-3)
- **Completed:** 2026-09-04
- **Tasks:** 3
- **Files modified:** 2 (1 Produktionsdatei, 1 Unit-Testdatei)

## Accomplishments

- **`hasCampaignContent(data)`** in `systems/migration/migration-wizard.js`: neue Funktion, die einen Kampagnendatensatz gegen drei Listen prüft — `CAMPAIGN_CONTENT_ARRAYS` (17 Einträge: `characters`, `npcs`, `quests`, `locations`, `encounters`, `loot`, `spells`, `wiki`, `sessionNotes`, `storyArcs`, `bestiary`, `sessionPreps`, `factions`, `shops`, `links`, `filters`, `tags`), `CAMPAIGN_CONTENT_TEXT_FIELDS` (`quickNotes`, `dmScreenNotes`) und `CAMPAIGN_CONTENT_PATHS` (`soundboard.scenes`, `calendar.events`, `initiative.combatants`). Wirft nie — ein falscher Typ an gelisteter Stelle (`wiki: "kaputt"`) zählt einfach als "kein Inhalt", statt den Init-Pfad zu reißen (T-12-28).
- Die Aufnahmeregel steht als Kopfkommentar direkt an der Konstante: eine Sammlung zählt als Inhalt, wenn sie im Startzustand leer ist UND nur durch bewusste Nutzerhandlung gefüllt wird. Bewusst ausgeschlossen (mit Begründung im Kommentar dokumentiert): `settings`, `randomTables`, `dmScreenLayout`, `initiative`/`calendar`/`soundboard` als ganze Objekte, `_nextId`/`_version`/`campaign`, `dmScreenProfiles`/`dmScreenActiveProfile`, `bestiaryFavorites`/`monsterFavorites`, `wikiRecentlyViewed`, `diceHistory`, `sessionHistory`, `partyGold`, `timers`.
- `isFreshInstall()` delegiert die Inhaltsprüfung jetzt vollständig an `hasCampaignContent()` (`return !hasCampaignContent(data);`) statt der alten Summenzeile `characters+npcs+quests === 0`. Der `if (!data) return true;`-Guard davor blieb unverändert.
- Vier neue `window.*`-Exports (`hasCampaignContent`, `CAMPAIGN_CONTENT_ARRAYS`, `CAMPAIGN_CONTENT_TEXT_FIELDS`, `CAMPAIGN_CONTENT_PATHS`) — kein `const x = window.x`-Muster (CLAUDE.md-Dedup-Regel).
- **Test-Netz** in `tests/unit/migration-wizard.test.js`: 27 neue Tests (11 alte + 3 Durchstich-Tests aus Task 1 + 27 aus Task 2 = 41 gesamt). Task 1: Durchstich (Zauberbibliothek → `false`), `hasCampaignContent(null|undefined)` → `false` ohne Wurf, Fremdtyp an gelisteter Stelle → `false` ohne Wurf. Task 2: Gegenprobe im realistischen Startzustand (`initializeData()` + drei Standard-Zufallstabellen + Standard-DM-Screen-Layout + befülltes `_nextId`) → `true`; je einer der 22 Stellen kippt einzeln (`describe.each`/Testname nennt die Sammlung); Strukturprüfung sammelt ALLE Verstöße gegen die echte `initializeData()` (statt beim ersten abzubrechen); Umkehrprobe hält `settings`/`randomTables`/`dmScreenLayout`/`_nextId` ausdrücklich aus allen drei Listen fern.
- **`initializeData()` in eigenem `vm.createContext()`** geladen (nicht abgetippt) — genau der Punkt, der die Strukturprüfung wertvoll macht: sie hängt am echten Schema aus `core/data.js`, nicht an einer Kopie davon.

## Protokollierter roter Lauf (Task 1, Schritt 1)

Vor der Implementierung von `hasCampaignContent()` schlug genau ein Test fehl (die anderen zwei neuen Tests warfen `TypeError: context.hasCampaignContent is not a function`, da die Funktion noch nicht existierte):

```
● isFreshInstall() — Quellenkette wie readCampaignDataForBackup() (D-07, SAFE-04) › nur Zauber gefuellt (characters/npcs/quests leer) -> false (Durchstich G-12-3)
  expect(received).toBe(expected) // Object.is equality
  Expected: false
  Received: true
Tests: 3 failed, 11 passed, 14 total
```

## Mutationsnachweis (Task 1, Schritt 5)

`hasCampaignContent()` testweise auf ein hartes `return false;` gesetzt (erste Zeile im Funktionskörper, Rest unerreichbar). 6 von 14 Tests fielen um:

1. `STORAGE_KEY_OVERRIDE gesetzt und unter diesem Key liegen Charaktere -> false (heute faelschlich true)`
2. `localStorage-Key entfernt, Daten nur ueber IDB-Stufe erreichbar (simuliert im Stub) -> false`
3. `window.readCampaignDataForBackup nicht verfuegbar -> synchrone StorageAPI-Rueckfallebene, echtes Boolean statt undefined`
4. `nur Zauber gefuellt (characters/npcs/quests leer) -> false (Durchstich G-12-3)`
5. `vorhandene Daten (isFreshInstall -> false) -> kein setTimeout(showMigrationWizard) geplant`
6. `vorhandene Daten + Abbruch am confirm() -> Import blockiert, keine Aenderung`

Mutation zurückgenommen, `npx jest tests/unit/migration-wizard.test.js` wieder 14/14 grün (zu diesem Zeitpunkt vor Task 2, danach 41/41).

## Task Commits

Each task was committed atomically:

1. **Task 1: Durchstich — hasCampaignContent() + Verdrahtung in isFreshInstall()** - `ef00f38` (test)
2. **Task 2: Gegenprobe + Sammlungs-Einzelnachweis + Strukturprüfung gegen core/data.js** - `07d151c` (test)
3. **Task 3: volle Suiten + beide dist-Bundles neu gebaut** - kein eigener Commit (keine Code-Änderung; `dist/` ist gitignored)

**Plan metadata:** commit pending (docs: complete plan)

## Files Created/Modified

- `systems/migration/migration-wizard.js` — `CAMPAIGN_CONTENT_ARRAYS`/`CAMPAIGN_CONTENT_TEXT_FIELDS`/`CAMPAIGN_CONTENT_PATHS`, `hasCampaignContent()`, `isFreshInstall()` delegiert daran, vier neue `window.*`-Exports
- `tests/unit/migration-wizard.test.js` — 30 neue Tests (3 Durchstich/Edge-Case aus Task 1, 27 aus Task 2), eigener `vm.createContext()` für `core/data.js`, eigener Wegwerf-Kontext zur Sammelzeit für `describe.each()`

## Decisions Made

- **`describe.each(REAL_CAMPAIGN_CONTENT_PATHS.map(p => [p]))` statt direktem `describe.each(REAL_CAMPAIGN_CONTENT_PATHS)`:** Jest spreadet jede Zeile eines Arrays von Arrays als separate Testparameter. Ohne die zusätzliche Verpackung (`.map(p => [p])`) wären die zwei Segmente eines Pfads (z. B. `['soundboard', 'scenes']`) als zwei unabhängige Parameter angekommen statt als ein zusammenhängendes Pfad-Array — beim ersten Testlauf als `Test suite failed to run: contentPath.join is not a function` sichtbar geworden, sofort korrigiert.
- **`context.window.CAMPAIGN_CONTENT_ARRAYS` statt `context.CAMPAIGN_CONTENT_ARRAYS`:** `vm.runInContext()` legt top-level `const`-Deklarationen NICHT als Eigenschaft auf dem Kontext-Objekt selbst ab (anders als `function`-Deklarationen, die schon vorher über `context.isFreshInstall()` erreichbar waren). Die drei Listen sind deshalb nur über den expliziten `window.*`-Export (`context.window.CAMPAIGN_CONTENT_ARRAYS`) sichtbar. Verifiziert per Miniatur-Reproduktion vor der eigentlichen Implementierung.
- **Eigener, minimaler Wegwerf-`vm`-Kontext zur Extraktion der drei Listen bei Testdatei-Ladezeit:** `describe.each()`/`test.each()` benötigen die zu iterierende Liste zur Modul-Sammelzeit — bevor die `beforeAll()`-Hooks der Haupt-Testsuite laufen und den geteilten `context` mit Mocks befüllen. Deshalb ein zweiter, unabhängiger `vm.createContext({ window: {} })`, der `migration-wizard.js` nur zum Zweck der Listen-Extraktion ausführt (keine Interferenz mit den Verhaltens-Mocks).

## Beobachtung: T-12-27 (`spells` in `SRD_FIELDS`)

Bewusst außerhalb des Scopes dieses Plans (siehe `<scope_fence>` und `<threat_model>` T-12-27 in `12-08-PLAN.md`), hier als Notiz für `REQUIREMENTS.md`/`STATE.md` festgehalten: `spells` zählt nach diesem Fix als Kampagneninhalt (`CAMPAIGN_CONTENT_ARRAYS`), wird aber über `SRD_FIELDS` in `systems/migration/full-export.js:21` aus dem Umzugs-Export entfernt (`stripNonUserData()`). Wer ausschließlich eine Zauberbibliothek besitzt, bekommt den Migrations-Wizard also jetzt korrekt NICHT mehr als Frischinstallation angeboten — die Bibliothek selbst reist beim Umzug aber weiterhin nicht mit (Entscheidung T-02-09, SRD-Daten dürfen nicht in Nutzerdaten-Exporte wandern). Kein neuer Befund, kein Widerspruch zu diesem Plan — nur eine Randbedingung, die jetzt sichtbarer wird, weil der Wizard-Guard korrekt reagiert.

## Deviations from Plan

Keine inhaltlichen Abweichungen von `<scope_fence>` oder `<tasks>`. Zwei implementierungsbedingte Anpassungen am (nicht direkt copy-paste-fähigen) Test-Pseudocode des Plans sind oben unter "Decisions Made" dokumentiert (`describe.each()`-Verpackung, `context.window.*`-Zugriffspfad) — beides Rule-1-Fixes (Testcode funktionierte in der ersten Fassung nicht, sofort korrigiert, keine Verhaltensänderung am Produktionscode).

**Total deviations:** 0 (Verhalten/Architektur), 2 (Testcode-Detailkorrekturen, dokumentiert)
**Impact on plan:** Keine funktionale Abweichung. Alle `must_haves` erfüllt: Zauberbibliothek löst Bestandsschutz aus, leerer Startzustand bleibt frisch, jede der 22 Stellen einzeln nachgewiesen, Strukturprüfung hängt am echten `initializeData()`, alle vier Suiten auf/über Basislinie, beide dist-Bundles neu gebaut.

## Verifikation

- `npx jest tests/unit/migration-wizard.test.js` — **41/41 grün** (Basislinie 11 + 3 aus Task 1 + 27 aus Task 2)
- `node --check systems/migration/migration-wizard.js` — fehlerfrei
- `npx jest` (volle Suite) — **749 passed, 29 Suiten, 0 skipped** (Basislinie 719 + 30 neue Tests, keine Regression)
- `python -m pytest tests/build -q` — **24 passed** (Basislinie 24, unverändert)
- `PYTHONIOENCODING=utf-8 python build.py` — `[SUCCESS] Build abgeschlossen! (Development)`, 124/124 Module, alle Validierungen bestanden, keine `[DEDUP]`-Kollision bei den vier neuen Bezeichnern
- `PYTHONIOENCODING=utf-8 python build.py --production` — `[SUCCESS] Build abgeschlossen! (Production)`; `dist/dnd-tracker-optimized.html` (2026-09-04 13:41:40) ist neuer als `systems/migration/migration-wizard.js` (2026-09-04 13:38:47)
- `npx playwright test` — **321 passed / 2 skipped**, exit 0 (Basislinie 321/2, keine Regression — dieser Plan ändert keinen vom Frontend ausgelösten UI-Pfad, nur die Guard-Logik hinter `isFreshInstall()`)

## Self-Check

- `systems/migration/migration-wizard.js` — FOUND
- `tests/unit/migration-wizard.test.js` — FOUND
- Commit `ef00f38` — FOUND (`git log --oneline --all | grep ef00f38`)
- Commit `07d151c` — FOUND (`git log --oneline --all | grep 07d151c`)

## Self-Check: PASSED

## Known Stubs

Keine.

## Threat Flags

Keine neue, nicht im `<threat_model>` erfasste sicherheitsrelevante Fläche gefunden. Alle fünf im Plan benannten Threats (T-12-24, T-12-25, T-12-26, T-12-27, T-12-28) sind über die oben beschriebenen Änderungen, Kommentare und Tests mitigiert bzw. (T-12-27) bewusst als akzeptiertes Restrisiko dokumentiert.

## User Setup Required

None - no external service configuration required.
