---
phase: 15-befundlage-vorlauf
plan: 01
subsystem: css-testing
tags: [css, jest, ratchet, prefers-reduced-motion, design-consistency, handoff-docs]

# Dependency graph
requires: []
provides:
  - "Ein einziger globaler prefers-reduced-motion-Block in core.css, gegen Rückbau gesichert"
  - "Die Ratschen-Schleife (messen -> rot -> aendern -> gruen -> Gegenprobe -> Ausgangswert im Kommentar) einmal vollstaendig durchgespielt und protokolliert"
  - "N-08 im externen Handoff als widerlegt geschlossen, Originaltext erhalten (PATCHES.md §8, BEFUNDE-v2.md N-08)"
  - "REQUIREMENTS.md/ROADMAP.md tragen die gemessene Zeilenspanne 1408-1419 und die korrigierte Phasenzuordnung von MOTION-05 (Phase 17 -> Phase 15)"
  - "declarationsOf() schliesst fonts.css aus (Vorarbeit fuer eine spaetere, hier NICHT geschriebene font-weight-Ratsche)"
affects: [15-02, 15-03, 15-04, 15-05, 15-06, 15-07, 15-08, "16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 4128
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rueckbau-Ratsche mit Zaehlart im Kommentar (Erhebungsdatum, Richtungssatz, Zaehlart, Verweis auf 15-RATCHET-BASELINE.md) — Vorbild F-18/F-19"
    - "Beidseitig bewiesene Ratsche: Grenzwert N->N-1 rot, zurueck auf N gruen, echten Verstoss einfuegen -> rot, zuruecknehmen -> gruen, alle Exit-Codes protokolliert (D-49)"
    - "Verworfenes wird im externen Handoff markiert statt geloescht (VERWORFEN-Block neben dem Originaltext, D-05)"

key-files:
  created: []
  modified:
    - tests/unit/design-consistency.test.js
    - assets/styles/core.css
    - assets/styles/dmscreen.css
    - assets/styles/command-palette.css
    - assets/styles/migration.css
    - assets/styles/pwa.css
    - "Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md"
    - "Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/BEFUNDE-v2.md"
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md

key-decisions:
  - "Rueckbau-Ratsche zaehlt Dateien (readAll()+withoutComments()), nicht Vorkommen — REDUCED_MOTION_BLOCKS_MAX=1, Konstante erscheint genau zweimal im Testfile (Definition + eine Zusicherung), damit die Selbstpruefung nicht durch Mehrfachnennung verzerrt wird"
  - "Selbst gemessene .skeleton-Trefferzahl (11) verwendet statt der kolportierten 12 aus CONTEXT.md (Pitfall 3 aus 15-RESEARCH.md bestaetigt)"
  - "PATCHES.md §8 und BEFUNDE-v2.md N-08 bekommen einen VERWORFEN/WIDERLEGT-Block direkt nach der Ueberschrift; der urspruengliche Rezepttext bleibt vollstaendig stehen (D-05 — Pruefspur vor Kosmetik)"
  - "MOTION-05s scroll-behavior-Klausel wird als bereits erfuellt vermerkt statt ausgefuehrt: null Treffer fuer `scroll-behavior: auto !important` in assets/styles/, der einzige aehnliche Fund ist `overscroll-behavior` (core.css), eine andere Eigenschaft"
  - "declarationsOf() bekommt den fonts.css-Ausschluss als reine Vorarbeit (D-42) — keine font-weight-Ratsche wird in diesem Plan geschrieben"

requirements-completed: [BASE-03, BASE-04, GATE-03, MOTION-05]

coverage:
  - id: D1
    description: "Ratschen-Schleife end-to-end an der Bewegungsunterdrueckung bewiesen: vier Bloecke gemessen, Ratsche rot geschrieben, CSS zusammengefuehrt, Ratsche gruen, Gegenprobe (Schwellwert- und Verstoss-Sweep) durchgefahren"
    requirement: "GATE-03"
    verification:
      - kind: unit
        ref: "tests/unit/design-consistency.test.js#F-20 — Bewegungsunterdrueckung (Ratsche)"
        status: pass
      - kind: unit
        ref: "npx jest tests/unit/design-consistency.test.js (66/66)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Genau ein globaler prefers-reduced-motion-Block, in core.css; vier redundante Bloecke entfernt; tote .skeleton-Familie geloescht; IMPORTANT_MAX/DUBLETTEN_MAX unveraendert"
    requirement: "BASE-03"
    verification:
      - kind: unit
        ref: "node -e Einzeiler gegen assets/styles/*.css (acceptance_criteria Task 1)"
        status: pass
      - kind: unit
        ref: "npx jest tests/unit/design-consistency.test.js (F-18 Dubletten/!important)"
        status: pass
    human_judgment: false
  - id: D3
    description: "N-08 im Handoff als widerlegt geschlossen (PATCHES.md §8, BEFUNDE-v2.md N-08), Originaltext erhalten; REQUIREMENTS.md/ROADMAP.md mit korrigierter Zeilenspanne und MOTION-05-Phasenzuordnung"
    requirement: "MOTION-05"
    verification:
      - kind: unit
        ref: "grep -c \"VERWORFEN (B-07\" PATCHES.md == 1"
        status: pass
      - kind: unit
        ref: "grep -c \"1408-1414\" REQUIREMENTS.md ROADMAP.md == 0/0, grep -c \"1408-1419\" REQUIREMENTS.md >= 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "declarationsOf() ignoriert fonts.css; volle Kette (Jest, Playwright, pytest, beide Builds) einmal gruen protokolliert"
    requirement: "BASE-04"
    verification:
      - kind: unit
        ref: "npx jest (1219/1219)"
        status: pass
      - kind: e2e
        ref: "npx playwright test (352 passed, 2 skipped)"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python -m pytest tests/build -q (24/24)"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python build.py && python build.py --production"
        status: pass
    human_judgment: false

# Metrics
duration: ~25min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 01: Bewegungsunterdrueckung — Ratschen-Tracer Summary

**Vier redundante `prefers-reduced-motion`-Bloecke zu einem einzigen, ratschengesicherten Block in `core.css` zusammengefuehrt und die tote `.skeleton`-Familie geloescht — mit vollstaendig protokolliertem Rot-Gruen-Beweis der neuen Ratsche.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-09-09T07:00:00Z (ungefaehr, keine exakte Startuhrzeit erfasst)
- **Completed:** 2026-09-09T07:10:01Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- `prefers-reduced-motion` existiert jetzt genau einmal im Quellbaum, in `core.css`; vier Entfernungen (`command-palette.css`, `dmscreen.css`, `migration.css`, `pwa.css`) und eine Neuanlage, kein Umzug
- Neue Rueckbau-Ratsche `REDUCED_MOTION_BLOCKS_MAX=1` in `design-consistency.test.js` (F-20), rot vor der Aenderung, gruen danach, plus vollstaendiger Schwellwert-/Verstoss-Sweep
- Tote `.skeleton`/`.skeleton-*`-Familie aus `dmscreen.css` entfernt (11 selbst gemessene Treffer, alle in dieser Datei, keine Aufrufer sonst im Quellbaum)
- N-08 im externen Handoff (`PATCHES.md` §8, `BEFUNDE-v2.md` N-08) als widerlegt/VERWORFEN geschlossen, Originaltext vollstaendig erhalten
- `REQUIREMENTS.md`/`ROADMAP.md` korrigiert: Zeilenspanne 1408-1414 -> 1408-1419, MOTION-05 von Phase 17 nach Phase 15 verschoben
- `declarationsOf()` schliesst `fonts.css` aus (Vorarbeit fuer eine spaetere, hier bewusst nicht geschriebene `font-weight`-Ratsche)

## Task Commits

Each task was committed atomically:

1. **Task 1: Bewegungsunterdrueckung end-to-end — messen, rot, zusammenfuehren, gruen** - `6533aaa` (feat)
2. **Task 2: Denselben Befund im Handoff schliessen — Paragraph 8 als VERWORFEN markieren** - `6ddfb77` (docs)
3. **Task 3: fonts.css-Ausschluss in declarationsOf() und volle Kette** - `a51a12a` (chore)

_Note: Task 1 is a `type="tracer"` task; it produced a single commit like a standard `auto` task (no separate RED/GREEN commits — the RED proof was run and logged in-memory before the merge, not committed separately, since this plan is not `type: tdd`)._

## Files Created/Modified

- `tests/unit/design-consistency.test.js` - Neuer `describe`-Block F-20 (Ratsche), `declarationsOf()`-Erweiterung um `fonts.css`-Ausschluss
- `assets/styles/core.css` - Neuer, einziger globaler `prefers-reduced-motion`-Block am Dateiende
- `assets/styles/dmscreen.css` - Alter globaler Block entfernt, tote `.skeleton`-Familie geloescht
- `assets/styles/command-palette.css` - Redundanten `prefers-reduced-motion`-Block entfernt
- `assets/styles/migration.css` - Redundanten `prefers-reduced-motion`-Block entfernt
- `assets/styles/pwa.css` - Redundanten `prefers-reduced-motion`-Block entfernt
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md` - §8 als VERWORFEN (B-07) markiert, Originaltext erhalten
- `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/BEFUNDE-v2.md` - N-08 als widerlegt geschlossen, Originaltext erhalten
- `.planning/REQUIREMENTS.md` - BASE-03-Zeilenspanne korrigiert, MOTION-05-Traceability auf Phase 15, scroll-behavior-Klausel als erfuellt vermerkt
- `.planning/ROADMAP.md` - Phase-15-Erfolgskriterium 2 praezisiert, MOTION-05 von Phase-17- in Phase-15-Requirements-Zeile verschoben

## Ratschen-Beweis (D-49)

**Messung (D-49/D-50), mit dem spaeteren Testausdruck (`readAll('assets/styles', '.css')` + `withoutComments()`), VOR jeder Aenderung:**

```
COUNT=4
FILES=command-palette.css,dmscreen.css,migration.css,pwa.css
```

`core.css` war NICHT in der Liste — Ausgangswert bestaetigt.

**Selbst gemessene `.skeleton`-Trefferzahl, VOR der Loeschung** (Pitfall 3 aus `15-RESEARCH.md` bestaetigt: 11, nicht die kolportierten 12):

```
$ grep -rn "skeleton" assets/styles/ features/ systems/ ui/ core/ render/ utils/ assets/templates/
11 Treffer, alle in assets/styles/dmscreen.css
```

**Rot-Gruen-Protokoll, sechs Laeufe, alle Exit-Codes:**

| # | Schritt | Grenzwert | Befehl | Ergebnis | Exit-Code |
|---|---------|-----------|--------|----------|-----------|
| 1 | Ratsche geschrieben, VOR dem CSS-Merge | 1 | `npx jest tests/unit/design-consistency.test.js -t "F-20"` | ROT — 2 von 2 Tests fehlgeschlagen (erwartet <=1, erhalten 4; erwartet `["core.css"]`, erhalten alle vier Dateien) | **1** |
| 2 | Nach dem CSS-Merge (vier Entfernungen + eine Neuanlage) | 1 | `npx jest tests/unit/design-consistency.test.js` | GRUEN — 66/66 (64 bestehende + 2 neue) | **0** |
| 3 | Schwellwert-Sweep: Grenzwert auf 0 gesetzt | 0 | `npx jest tests/unit/design-consistency.test.js -t "F-20"` | ROT — erwartet <=0, erhalten 1 | **1** |
| 4 | Schwellwert-Sweep: Grenzwert zurueck auf 1 | 1 | `npx jest tests/unit/design-consistency.test.js -t "F-20"` | GRUEN — 2/2 | **0** |
| 5 | Schwellwert-Sweep: echten Verstoss eingefuegt (zweiter Block in `loot.css`) | 1 | `npx jest tests/unit/design-consistency.test.js -t "F-20"` | ROT — 2 von 2 Tests fehlgeschlagen (erhalten 2 Dateien statt 1, `["core.css","loot.css"]` statt `["core.css"]`) | **1** |
| 6 | Schwellwert-Sweep: Verstoss zurueckgenommen (`git checkout -- assets/styles/loot.css`) | 1 | `npx jest tests/unit/design-consistency.test.js -t "F-20"` | GRUEN — 2/2 | **0** |

Mindestens vier protokollierte Exit-Codes (sechs vorhanden), mindestens einer ungleich 0 (drei vorhanden) — Kriterium erfuellt. Diese Tabelle geht unveraendert in `15-RATCHET-BASELINE.md` (Plan 15-07).

**Nachgemessene Invarianten nach dem Merge:**

```
$ node -e "... IMPORTANT_MAX-Aequivalent ..."
105   # unveraendert, wie geplant — die drei !important-Deklarationen zogen mit um
$ grep -rc "skeleton" assets/styles/dmscreen.css
0     # tote Familie vollstaendig entfernt
```

`DUBLETTEN_MAX` (0) und der volle F-18-Test blieben in allen sechs Laeufen gruen — keine Dublette entstand durch den Umzug.

## Decisions Made

- Rueckbau-Ratsche zaehlt Dateien mit `readAll()`/`withoutComments()`, keine grep-Aequivalent-Zaehlung — deckungsgleich mit der Zaehlart, die der Test selbst ausfuehrt (BASE-04-Grundsatz)
- Selbst gemessene `.skeleton`-Zahl (11) statt der kolportierten 12 aus `CONTEXT.md` verwendet (Pitfall 3, `15-RESEARCH.md`)
- VERWORFEN/WIDERLEGT-Bloecke stehen NEBEN dem Originaltext in `PATCHES.md`/`BEFUNDE-v2.md`, nicht anstelle — Pruefspur vor Kosmetik (D-05)
- `declarationsOf()`-Aenderung ist reine Vorarbeit fuer eine spaetere `font-weight`-Ratsche (D-42); diese Ratsche selbst wird bewusst NICHT in diesem Plan geschrieben, solange TYPO-07 zurueckgestellt ist

## Deviations from Plan

None - plan executed exactly as written. Alle drei Tasks, alle `acceptance_criteria` und die plan-weite `<verification>` wurden ohne Abweichung erfuellt; keine Rule-1/2/3-Autofixes waren noetig.

## Issues Encountered

None. Der einzige bemerkenswerte Punkt war rein methodisch: `git diff --diff-filter=D` und der Schwellwert-Sweep liefen wie geplant ohne Ueberraschungen; das injizierte `loot.css`-Testartefakt wurde mit `git checkout -- assets/styles/loot.css` (dateispezifisch, keine Blanket-Operation) sauber zurueckgenommen und vor dem Commit verifiziert (`git status --short` zeigte die Datei danach als unveraendert).

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Next Phase Readiness

- Die Ratschen-Schleife ist einmal vollstaendig bewiesen und dokumentiert; Plan 15-07 kann die Tabelle unter „Ratschen-Beweis (D-49)" unveraendert nach `15-RATCHET-BASELINE.md` uebernehmen
- `declarationsOf()` traegt den `fonts.css`-Ausschluss bereits, bevor Plan 15-05/15-08 eine `font-weight`-bezogene Aenderung anfassen
- N-08 ist im Handoff geschlossen; Plan 15-02/15-03 koennen die verbleibenden 12 Blocker unabhaengig davon buchen
- Volle Suiten und beide Builds sind grün: Jest 1219/1219, Playwright 352 passed/2 skipped, `design-consistency.test.js` 66/66, `pytest tests/build` 24/24 — bereit fuer die naechste Welle (15-02, 15-03, 15-04)

## Self-Check: PASSED

- FOUND: tests/unit/design-consistency.test.js (F-20 block present)
- FOUND: assets/styles/core.css (new global prefers-reduced-motion block at file end)
- FOUND: commit 6533aaa in `git log --oneline --all`
- FOUND: commit 6ddfb77 in `git log --oneline --all`
- FOUND: commit a51a12a in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green (see Ratschen-Beweis and Accomplishments above)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
