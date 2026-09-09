---
phase: 15-befundlage-vorlauf
plan: 04
subsystem: css-testing
tags: [css, playwright, jest, ratchet, dm-screen, design-consistency, computed-style]

# Dependency graph
requires:
  - phase: 15-01
    provides: "Die Ratschen-Schleife (messen -> rot -> aendern -> gruen -> Gegenprobe -> Ausgangswert im Kommentar) einmal vollstaendig durchgespielt und protokolliert; declarationsOf()-Vorarbeit"
provides:
  - "Ein Playwright-Spec (tests/e2e/features/design-fixes.spec.js), der FIX-01/FIX-02/FIX-03 gemeinsam per getComputedStyle gegen das gebaute Buendel abnimmt — Plan 15-05 erweitert dieselbe Datei"
  - "Gelaende-, Fertigkeiten- und Wissensgebiete-Widget des DM-Screens rendern gestylt; CSS folgt dem tatsaechlich erzeugten JS-Markup (D-09)"
  - "Attributfarben der Fertigkeits-Kopfzeilen kommen aus den kanonischen --attr-*-Tokens statt aus fuenf eigenen rgba-Literalen (D-13) — wirkt in Phase 16 automatisch mit"
  - "Neue Ratsche DMS_UNSTYLED_MAX (F-21) in design-consistency.test.js, gepinnt auf den nach dem Fix gemessenen Wert 7"
affects: [15-05, 15-07, "16"]

# Actuals (#2632)
actuals:
  tokens: 3138
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Probe-Container-Injektion per page.evaluate() gegen globale Renderfunktionen statt Profilwechsel — beruehrt keinen gespeicherten Zustand, jeder Testfall sichert zuerst Probe-Elemente > 0 zu (T-15-08)"
    - "CSS folgt dem JS-Markup, nie umgekehrt, wenn ein eingefrorener Charakterisierungs-Snapshot existiert (D-09, Vorbild aus Phase 13)"
    - "Attributfarben ueber color-mix(in srgb, var(--attr-<x>) 20%, transparent) statt eigener rgba-Palette (D-13)"
    - "Ratsche zaehlt Klassennamen ausschliesslich aus class-Attributen (Filter zwingend, sonst 24 statt 7) — zweite Instanz desselben Musters wie F-19/F-20"

key-files:
  created:
    - tests/e2e/features/design-fixes.spec.js
  modified:
    - assets/styles/dmscreen.css
    - tests/unit/design-consistency.test.js

key-decisions:
  - "Zustandsklasse (normal/difficult/hazard) sitzt CSS-seitig auf .dms-terrain-item, nicht auf einem eigenen Titel-Span — der Renderer traegt sie am Eintrag, nicht am Typ-Span; alte Klasse hiess ausserdem 'hazardous', der Renderer schreibt 'hazard'"
  - "Listencontainer (.dms-terrain-list) bekommt keine eigene Flaeche/Rahmen/Mindesthoehe — ein leeres Widget darf keine sichtbare Kachel erzeugen (FIX-01/empty)"
  - "Fuenf Attribut-Modifikatoren stehen im Quelltext NACH der Basisregel .dms-skill-header, nicht davor, damit sie ihre Flaeche ueberschreiben (FIX-01/ordering) — keine Regel fuer .dms-skill-header.con, D&D 5e hat keine KON-Fertigkeit"
  - "D-10 schlaegt die (widerspruechliche) Deferred-Ideas-Notiz: alle drei Referenzwidgets werden repariert, nicht zwei — dms-know-skill/dms-know-types verlassen dadurch den Restbestand zwei Klassen frueher als urspruenglich erwartet (9 statt 7)"
  - "DMS_UNSTYLED_MAX wird auf den selbst gemessenen Wert (7) gepinnt, nicht auf einen aus dem Plan uebernommenen Schaetzwert"

requirements-completed: [FIX-01, GATE-03]

coverage:
  - id: D1
    description: "Neuer Playwright-Spec design-fixes.spec.js nimmt Gelaende/Fertigkeiten/Wissensgebiete per getComputedStyle ab, mit Probe-Element-Wache und rot bewiesenem Vorlauf"
    requirement: "FIX-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js (3/3 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gelaende-Widget: .dms-terrain-item traegt Innenabstand/Flaeche/Eckenradius; Zustandsfarben (normal/difficult/hazard) sitzen richtig; Listencontainer erzeugt keine leere Kachel"
    requirement: "FIX-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Gelaende-Eintrag hat Innenabstand, Flaeche und Eckenradius"
        status: pass
      - kind: unit
        ref: "tests/unit/dmscreen-characterization.test.js (51/51, 0 neu geschriebene Snapshots)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fertigkeiten-Widget: .dms-skill-header traegt Flaeche und Schriftgewicht >400; die fuenf Attributfarben kommen aus den kanonischen --attr-*-Tokens (D-13), keine .con-Regel"
    requirement: "FIX-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Fertigkeiten-Kopfzeile (Staerke) hat Flaeche und erhoehtes Schriftgewicht"
        status: pass
      - kind: unit
        ref: "grep-Kriterien (dms-skill-header>=6, .con==0, Basisregel vor Attributregeln) — siehe Ratschen-Beweis"
        status: pass
    human_judgment: false
  - id: D4
    description: "Wissensgebiete-Widget: Fertigkeitsname und Kreaturentypen unterscheiden sich sichtbar (Schriftgewicht/Farbe); D-10 (alle drei Widgets) statt der widerspruechlichen Deferred-Notiz umgesetzt"
    requirement: "FIX-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/design-fixes.spec.js#Wissensgebiete: Fertigkeitsname und Kreaturentypen unterscheiden sich"
        status: pass
    human_judgment: false
  - id: D5
    description: "Neue Ratsche DMS_UNSTYLED_MAX=7 (F-21), zaehlt ausschliesslich class-Attribut-Vorkommen des dms-Praefixes ohne CSS-Selektor; beidseitig bewiesen (rot/gruen/echter Verstoss/Ruecknahme)"
    requirement: "GATE-03"
    verification:
      - kind: unit
        ref: "tests/unit/design-consistency.test.js#F-21 (Beweischeckliste, vier Laeufe)"
        status: pass
      - kind: unit
        ref: "npx jest tests/unit/design-consistency.test.js (67/67)"
        status: pass
    human_judgment: false
  - id: D6
    description: "DM-Screen im Referenz-Profil, alle vier Themes: Gelaende-Eintraege als Kaesten, farbige Attribut-Kopfzeilen, Wissensgebiete-Spans unterscheidbar"
    verification: []
    human_judgment: true
    rationale: "Visuelle Themen-Gegenprobe ist eine Sichtpruefung (Task 3 <human-check>); per workflow.human_verify_mode=end-of-phase (Default) wird sie von der Phasenverifikation gebuendelt in {phase}-UAT.md aufgenommen, nicht mid-flight ausgefuehrt."

# Metrics
duration: ~35min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 04: DM-Screen-Referenzwidgets — Gelaende, Fertigkeiten, Wissensgebiete Summary

**Drei DM-Screen-Referenzwidgets (Gelaende, Fertigkeiten, Wissensgebiete) rendern wieder gestylt, indem CSS an das tatsaechlich erzeugte JS-Markup angeglichen wurde — abgenommen per `getComputedStyle` gegen das gebaute Buendel, mit einem rot bewiesenen Vorlauf und einer neuen, beidseitig bewiesenen Ratsche gegen Rueckfall.**

## Performance

- **Duration:** ~35 min (ungefaehr, keine exakte Startuhrzeit erfasst)
- **Completed:** 2026-09-09T07:29:32Z
- **Tasks:** 3
- **Files modified:** 3 (1 neu, 2 geaendert)

## Accomplishments

- Neuer Playwright-Spec `tests/e2e/features/design-fixes.spec.js` misst berechnete Endwerte fuer alle drei Widgets gegen `dist/dnd-tracker-bundled.html`; jeder Testfall sichert zuerst Probe-Elemente > 0 zu (T-15-08), bevor er Stile prueft
- Gelaende-Widget: `.dms-terrain-list`/`.dms-terrain-item`/`.dms-terrain-type`/`.dms-terrain-effect` ersetzen die veraltete `.dms-terrain-sections`/`-section`/`-title`-Familie; Zustandsklasse `normal`/`difficult`/`hazard` sitzt jetzt am Eintrag (Renderer-Wahrheit), nicht an einem Titel-Span, und die falsch benannte `hazardous`-Klasse ist weg
- Fertigkeiten-Widget: `.dms-skills-widget`/`.dms-skill-header` ersetzen `.dms-skill-groups`/`-group-header`; die fuenf Attributfarben sitzen direkt an `.dms-skill-header.<attr>` (wo das JS die Klasse traegt) und kommen jetzt aus `color-mix(in srgb, var(--attr-<x>) 20%, transparent)` statt aus fuenf eigenen rgba-Literalen (D-13) — keine `.con`-Regel, weil D&D 5e keine KON-Fertigkeit hat
- Wissensgebiete-Widget: neue Regeln fuer `.dms-know-skill` (fett, normale Farbe) und `.dms-know-types` (klein, gedaempft), beide als eigene Zeile — D-10 (alle drei Widgets reparieren) statt der widerspruechlichen Deferred-Ideas-Notiz
- Neue Ratsche `DMS_UNSTYLED_MAX = 7` (F-21) in `design-consistency.test.js`: zaehlt Klassennamen mit dem `dms-`-Praefix, die in einem `class`-Attribut vorkommen und im kommentarfreien CSS keinen Selektor haben; der Attributfilter ist zwingend (24 statt 7 ohne ihn)
- Kein JS-Renderer und kein Snapshot wurden angefasst — `dmscreen-characterization.test.js` bleibt 51/51 gruen, 0 neu geschriebene Snapshots

## Task Commits

Each task was committed atomically:

1. **Task 1: Den Abnahme-Spec anlegen und rot beweisen** - `6541f12` (test)
2. **Task 2: Gelaende- und Fertigkeiten-Regeln auf die gerenderten Klassennamen umschreiben** - `5c711ba` (fix)
3. **Task 3: Wissensgebiete-Regeln ergaenzen und die Ratsche fuer regelfreie Widget-Klassen setzen** - `51ce01b` (feat)

_Note: Task 1 carries `tdd="true"`; the RED proof (3/3 failed, exit code 1) was run and logged before the CSS fix, without a separate GREEN commit for this task — the fix that turns the spec green happens across Tasks 2 and 3, which is the plan's own sequencing (spec-first, then CSS-follows-JS in two widget groups)._

## Files Created/Modified

- `tests/e2e/features/design-fixes.spec.js` - Neu: 3 Testfaelle (Gelaende, Fertigkeiten, Wissensgebiete), Probe-Container-Injektion per `page.evaluate`, `getComputedStyle`-Assertions
- `assets/styles/dmscreen.css` - Gelaende- und Fertigkeiten-Widget-CSS auf gerenderte Klassennamen umgeschrieben (D-09); Attributfarben auf `color-mix` mit kanonischen Tokens (D-13); zwei neue Regeln fuer die Wissensgebiete-Spans
- `tests/unit/design-consistency.test.js` - Neuer `describe`-Block F-21 mit der Ratsche `DMS_UNSTYLED_MAX`

## Decisions Made

Siehe `key-decisions` im Frontmatter. Kernpunkt: D-10 (alle drei Widgets reparieren) hat Vorrang vor der widerspruechlichen Deferred-Ideas-Notiz — die Abweichung ist arithmetisch sichtbar (Restbestand 7 statt der urspruenglich erwarteten 9).

## Deviations from Plan

None - plan executed exactly as written. Die im Plan selbst benannte Abweichung
(D-10 schlaegt die Deferred-Ideas-Notiz, Restbestand 7 statt 9) ist keine
Ausfuehrungs-Abweichung, sondern eine vom Plan selbst verlangte Entscheidung
(Task 3, Abschnitt "PLANERANNAHME") — dokumentiert oben unter Decisions Made und
im F-21-Kommentar, keine Rule-1/2/3-Autofixes waren noetig.

## Issues Encountered

Ein methodischer Stolperstein beim Rot-Beweis von Task 2/3 (nicht am
Ausfuehrungsergebnis): ein erster Rebuild-Versuch leitete die Build-Ausgabe in
einen Pfad ausserhalb des Arbeitsverzeichnisses um (`Permission denied`), wodurch
`build.py` gar nicht lief und der Playwright-Lauf gegen das VERALTETE Buendel
noch rot war. Erkannt am fehlenden Build-Log, sofort mit einem gueltigen Pfad
wiederholt — der danach beobachtete Uebergang von rot zu gruen ist der reale
Beweis, nicht der erste (fehlerhafte) Lauf.

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Ratschen-Beweis (D-49)

**Task 1 — roter Vorlauf des neuen Spec (VOR jeder CSS-Aenderung):**

```
npx playwright test tests/e2e/features/design-fixes.spec.js --reporter=list
3 failed (alle drei Faelle), Exit-Code 1
```

Fehlerursachen bestaetigen den Defekt: Gelaende-Eintrag `padding-top: 0px`;
Fertigkeiten-Kopfzeile `background-color: rgba(0, 0, 0, 0)`; Wissensgebiete-Spans
identisch formatiert (`differs === false`).

**Task 2 — nach dem CSS-Umbau (Gelaende + Fertigkeiten):**

```
npx jest tests/unit/dmscreen-characterization.test.js
51/51 passed, 50/50 Snapshots unveraendert, Exit-Code 0

npx playwright test tests/e2e/features/design-fixes.spec.js --reporter=list
2 passed (Gelaende, Fertigkeiten), 1 failed (Wissensgebiete — erwartet, Task 3 folgt), Exit-Code 1
```

**Task 3 — Wissensgebiete-Fix, danach alle drei gruen:**

```
npx playwright test tests/e2e/features/design-fixes.spec.js --reporter=list
3 passed, Exit-Code 0
```

**Task 3 — Beweischeckliste der neuen Ratsche `DMS_UNSTYLED_MAX`, vier Laeufe:**

| # | Schritt | Grenzwert | Ergebnis | Exit-Code |
|---|---------|-----------|----------|-----------|
| 1 | Ist-Wert gemessen und als Grenzwert gesetzt | 7 | GRUEN — 1/1 (F-21) | **0** |
| 2 | Schwellwert-Sweep: Grenzwert auf 6 gesenkt | 6 | ROT — erwartet <=6, erhalten 7 | **1** |
| 3 | Schwellwert-Sweep: Grenzwert zurueck auf 7 | 7 | GRUEN — 1/1 | **0** |
| 4 | Echten Verstoss eingefuegt (`dms-temp-unstyled-probe` in `dmscreen-widgets-combat.js`) | 7 | ROT — erwartet <=7, erhalten 8 | **1** |
| 5 | Verstoss zurueckgenommen (`git checkout -- features/dmscreen/dmscreen-widgets-combat.js`) | 7 | GRUEN — 1/1 | **0** |

Fuenf protokollierte Exit-Codes, mindestens vier davon Pflicht — Kriterium erfuellt
(Zeilen 2/3 sind der Schwellwert-Sweep, Zeilen 4/5 der Verstoss-Sweep). Die Zahl
ohne Attributfilter (jedes `dms-`-Vorkommen im Quellbaum, nicht nur in
`class`-Attributen) betraegt 24 gegen 7 mit Filter — der Filter ist zwingend, wie
im F-21-Kommentar festgehalten.

**Gemessener Wert `DMS_UNSTYLED_MAX = 7`**, Restbestand namentlich:
`dms-dc-mini`, `dms-econ-icon`, `dms-econ-val`, `dms-economy-header`,
`dms-ritual-item`, `dms-ritual-list`, `dms-save-desc`. Abweichung zur
urspruenglich in `15-CONTEXT.md` (Deferred Ideas) erwarteten 9: zwei Klassen
weniger (`dms-know-skill`, `dms-know-types`), weil dieser Plan D-10 folgt und
alle drei Referenzwidgets repariert statt nur zwei.

## Volle Suiten (nach Task 3, alle gruen)

```
npx jest                                       1220/1220 passed
npx jest tests/unit/design-consistency.test.js 67/67 passed
npx playwright test                            355 passed / 2 skipped
PYTHONIOENCODING=utf-8 python build.py         [SUCCESS]
PYTHONIOENCODING=utf-8 python build.py --production   [SUCCESS]
PYTHONIOENCODING=utf-8 python -m pytest tests/build -q  24/24 passed
```

## Next Phase Readiness

- `tests/e2e/features/design-fixes.spec.js` steht bereit fuer Plan 15-05, das die
  Zauberplatz-Pips (FIX-02) und die Wuerfelfarbe (FIX-03) als weitere Testfaelle
  in derselben Datei ergaenzt
- Der `DMS_UNSTYLED_MAX`-Messblock (7, Restliste, Filterzahl 24) geht unveraendert
  in `15-RATCHET-BASELINE.md` (Plan 15-07) ein
- Das Task-3-`<human-check>` (DM-Screen im Referenz-Profil, alle vier Themes)
  ist per `workflow.human_verify_mode=end-of-phase` fuer die gebuendelte
  Phasen-UAT vorgemerkt, nicht separat abgenommen

## Self-Check: PASSED

- FOUND: tests/e2e/features/design-fixes.spec.js
- FOUND: assets/styles/dmscreen.css (.dms-terrain-list, .dms-skill-header, .dms-know-skill present)
- FOUND: tests/unit/design-consistency.test.js (F-21 block, DMS_UNSTYLED_MAX present)
- FOUND: commit 6541f12 in `git log --oneline --all`
- FOUND: commit 5c711ba in `git log --oneline --all`
- FOUND: commit 51ce01b in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green (see Ratschen-Beweis and Volle Suiten above)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
