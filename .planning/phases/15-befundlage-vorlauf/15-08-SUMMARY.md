---
phase: 15-befundlage-vorlauf
plan: 08
subsystem: css-testing
tags: [css, jest, playwright, ratchet, measurement-protocol, design-consistency]

# Dependency graph
requires:
  - phase: 15-01
    provides: "Die Ratschen-Schleife (messen -> rot -> aendern -> gruen -> Gegenprobe -> Ausgangswert im Kommentar) und ihr vollstaendiges Rot-Gruen-Protokoll fuer F-20"
  - phase: 15-04
    provides: "Die DM-Screen-Referenzwidget-Fixes und das Rot-Gruen-Protokoll fuer F-21 (DMS_UNSTYLED_MAX)"
  - phase: 15-05
    provides: "Die Zauberplatz-Pip- und Wuerfelfarb-Fixes und ihre roten Vorlaeufe"
  - phase: 15-06
    provides: "tools/css-usage-report.js und die verbindliche Vor-Loeschlauf-Loeschzahl (738/757/5.762)"
  - phase: 15-07
    provides: "Den vollstaendigen Loeschlauf (20 Commits, 0 tote Regelbloecke) und die INLINE_MAX-Absenkung 257->256"
provides:
  - "Das eine Ratchet-Baseline-Messprotokoll dieser Phase (15-RATCHET-BASELINE.md), formgleich zum Phase-14-Vorbild, auf das die Ratschen der Phasen 16-19 gepinnt werden"
  - "Alle vier DEAD-03-Basisgroessen frisch NACH dem Loeschlauf gemessen (nicht aus 15-06 fortgeschrieben): rgba 336, em 641, box-shadow 71, transition:all 132 — je 0 davon in toten Regeln"
  - "Die drei bestehenden Ratschen (DUBLETTEN_MAX, IMPORTANT_MAX, INLINE_MAX) mit ihrem jeweils eigenen Testausdruck neu gemessen: zwei unveraendert exakt auf der Grenze, eine (INLINE_MAX) bereits in 15-07 nachgezogen"
  - "Fuenf Ratschen-Nachtraege mit je rotem und gruenem Exit-Code, uebernommen aus den SUMMARYs der Plaene 15-01/15-04/15-05/15-07"
  - "Eine ehrlich dokumentierte, unveraendert offene `--check`-Restfrage (204 tote Klassennamen in verbund-/kommagesicherten Selektoren) statt eines kuenstlich gruen gemachten Gates"
  - "Eine agentengestuetzte Vier-Themes-Screenshot-Serie (Stufe 2) der drei Mindestumfang-Stellen aus GATE-05, mit ausdruecklicher Kennzeichnung, dass die volle menschliche Stufe-3-Runde NICHT in diesem Plan stattgefunden hat"
affects: ["16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 5800
  tasks: 3
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ad-hoc-Nachmessskripte im Scratchpad, die die Testausdruecke aus tests/unit/design-consistency.test.js WORTGLEICH (per String-Konkatenation statt Template-Literal, um Backslash-Escaping-Fehler beim Nachbau strukturell auszuschliessen) reproduzieren, um den tatsaechlichen Ist-Wert einer Ratsche zu erhalten, nicht nur PASS/FAIL"
    - "Stufe-2-Screenshot-Serie (GATE-05) als eigenstaendiger, agentengestuetzter Nachweis, ausdruecklich getrennt von und nicht verwechselbar mit der menschlichen Stufe-3-UAT-Runde"

key-files:
  created:
    - .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md
  modified:
    - tests/unit/design-consistency.test.js

key-decisions:
  - "Die Task-1-Präzondition ('node tools/css-usage-report.js --check endet mit Exit-Code 0') ist woertlich NICHT erfuellt (Exit-Code 1, 204 Restklassen) — dieselbe, in 15-07 bereits gemessene und dokumentierte Zahl, unveraendert seit dem letzten Loeschcommit. Nicht als blockierende, unerwartete Praezondition behandelt: der Orchestrator hat diese exakte Diskrepanz vorab benannt und angewiesen, sie ehrlich zu dokumentieren statt sie zu 'fixen' (beide dafuer noetigen Wege — Anker-Regel aufweichen oder ~204 ungeprueften DEAD_EXCEPTIONS-Eintraegen — wurden in 15-07 bereits explizit als Ratschen-Verfaelschung verworfen). Die Loeschlauf-VOLLSTAENDIGKEIT selbst (0 tote Regelbloecke, alle 20 Commits vorhanden) wurde unabhaengig verifiziert und ist gegeben."
  - "Keine der drei bestehenden Ratschen (DUBLETTEN_MAX, IMPORTANT_MAX) wird in diesem Plan gesenkt — beide stehen nach dem Loeschlauf exakt unveraendert auf ihrer alten Grenze (0 bzw. 105), weil keine der 5.148 in Plan 15-07 geloeschten Zeilen eine Dublette oder ein `!important` enthielt. Da sich die Konstanten nicht aendern, ist kein neuer Rot-Gruen-Doppelbeweis faellig (D-49 gilt fuer AENDERUNGEN, nicht fuer eine bestaetigte Konstante) — nur `INLINE_MAX` hatte bereits in 15-07 einen vollstaendigen Doppelbeweis."
  - "GATE-05-Konflikt aufgeloest zugunsten des Orchestrator-Overrides, nicht des woertlichen Plantexts: der Plantext (Task 3) verlangt eine 'gezielte Sichtung' als Stufe-3-Ersatz fuer Phase 15 — genau die Reduktion, die der Nutzer per Checkpoint-Entscheidung am 2026-09-09 ausdruecklich ABGELEHNT hat (`PROJECT.md` § GATE-05, D-53). Diese Sitzung fuehrt deshalb NICHT eine 'gezielte Sichtung' als vollwertigen Stufe-3-Ersatz durch und behauptet das auch nicht. Stattdessen: eine automatisierte Stufe-2-Screenshot-Serie (GATE-05 sieht diese Stufe ohnehin vor) fuer die drei Mindestumfang-Stellen in allen vier Themes, tatsaechlich durchgefuehrt und von Claude selbst visuell gegengeprueft (12 Screenshots, alle vier Themes, keine Layoutbrueche gefunden) — UND eine ausdrueckliche, unmissverstaendliche Feststellung, dass die volle menschliche Stufe-3-Runde damit NICHT ersetzt ist und der Phasen-UAT vorbehalten bleibt."
  - "Zwei generische Testkommentar-Verweise auf `15-RATCHET-BASELINE.md` (F-20, F-21) wurden auf ihre jeweils spezifische Messblock-Nummer (3 bzw. 4) praezisiert, wie von Task 2 verlangt — beide Verweise zeigten vorher auf die Datei als Ganzes, nicht ins Leere, wurden aber dennoch praezisiert, weil die Akzeptanzkriterien einen Verweis auf einen 'tatsaechlich existierenden Abschnitt' verlangen."

requirements-completed: [DEAD-03, BASE-04, GATE-03, GATE-05]

coverage:
  - id: D1
    description: "15-RATCHET-BASELINE.md existiert, formgleich zum Phase-14-Vorbild: Kopf mit Datum/Node-Version/Voraussetzung, Blockquote-Nichtuebernahme-Hinweis, 7 Messbloecke (>= 6 gefordert), 5 Ratschen-Nachtraege (>= 5 gefordert), 4 offene Annahmen (>= 4 gefordert)"
    requirement: "DEAD-03"
    verification:
      - kind: other
        ref: "grep -c '^## Messblock' 15-RATCHET-BASELINE.md == 7; grep -c 'Nachtrag' == 7 (5 Ueberschriften + 2 Querverweise); grep -cE '^[0-9]\\. \\*\\*' Offene-Annahmen-Abschnitt == 4"
        status: pass
    human_judgment: false
  - id: D2
    description: "Alle vier DEAD-03-Basisgroessen frisch NACH dem Loeschlauf gemessen (rgba 336, em 641, box-shadow 71, transition:all 132), je 0 explizit in toten Regeln eingetragen statt ausgelassen"
    requirement: "DEAD-03"
    verification:
      - kind: other
        ref: "node tools/css-usage-report.js (diese Sitzung, HEAD c9f14d2/79db6fc unveraendert) — Werte identisch mit 15-07-SUMMARY.md, damit reproduzierbar bestaetigt (DEAD-03/ordering)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Die drei bestehenden Ratschen (DUBLETTEN_MAX=0, IMPORTANT_MAX=105, INLINE_MAX=256) mit ihrem eigenen Testausdruck (nicht grep-Aequivalent) neu gemessen; alle drei Ist-Werte identisch mit der jeweiligen Konstante"
    requirement: "GATE-03"
    verification:
      - kind: unit
        ref: "npx jest tests/unit/design-consistency.test.js (67/67 passed, F-18/F-19 Faelle darunter)"
        status: pass
      - kind: other
        ref: "Scratchpad-Nachmessskript, das bloecke()/withoutComments()/den style=\"-Zaehlausdruck wortgleich reproduziert — DUBLETTEN 0, IMPORTANT 105, INLINE 256"
        status: pass
    human_judgment: false
  - id: D4
    description: "Fuenf Ratschen-Nachtraege (F-20-Rueckbausicherung, F-21-Zaehlung, FIX-01-roter-Vorlauf, FIX-02/03-roter-Vorlauf, INLINE_MAX-Absenkung) mit je rotem und gruenem Exit-Code, Zahlen 1:1 aus den Quell-SUMMARYs uebernommen"
    requirement: "GATE-03"
    verification:
      - kind: other
        ref: "Manueller Abgleich jeder Nachtrag-Tabelle in 15-RATCHET-BASELINE.md gegen die Ratschen-Beweis-Abschnitte in 15-01-SUMMARY.md/15-04-SUMMARY.md/15-05-SUMMARY.md/15-07-SUMMARY.md — Zahlen identisch"
        status: pass
    human_judgment: false
  - id: D5
    description: "`node tools/css-usage-report.js --check` bleibt ehrlich mit Exit-Code 1 und 204 Restklassen dokumentiert — nicht kuenstlich gruen gemacht, nicht verschwiegen"
    requirement: "DEAD-03"
    verification:
      - kind: other
        ref: "node tools/css-usage-report.js --check (diese Sitzung) — Exit-Code 1, 204 Klassen ausserhalb der Ausnahmeliste, identisch mit 15-07-SUMMARY.md"
        status: pass
    human_judgment: false
  - id: D6
    description: "Abschlusslauf: alle automatisierten Suiten und beide Builds gruen (Jest 1243/1243, Playwright 364 passed/2 skipped, pytest 24/24, beide Builds Exit 0)"
    requirement: "GATE-05"
    verification:
      - kind: unit
        ref: "npx jest (1243/1243, 54 Suiten)"
        status: pass
      - kind: e2e
        ref: "npx playwright test --reporter=list (364 passed / 2 skipped, inkl. computed-style-diff.spec.js — 0 unerwartete Abweichungen)"
        status: pass
      - kind: other
        ref: "PYTHONIOENCODING=utf-8 python -m pytest tests/build -q (24/24); python build.py + --production (beide Exit 0, kein [FEHLER]/[ABORTED])"
        status: pass
    human_judgment: false
  - id: D7
    description: "Vier-Themes-Screenshot-Serie (Stufe 2, GATE-05) fuer die drei Mindestumfang-Stellen (DM-Screen-Widgets, Zauberplatz-Pips, Wuerfelergebnis inkl. Crit/Fumble) tatsaechlich durchgefuehrt und von Claude visuell gegengeprueft — 12 Screenshots, alle vier Themes, keine Layoutbrueche; zusaetzlich Stichprobe an zwei stark geloeschten Views (dashboard, encounter)"
    verification: []
    human_judgment: true
    rationale: "Dies ist eine agentengestuetzte Screenshot-Sichtung (Stufe 2 nach GATE-05), NICHT die volle menschliche Vier-Themes-UAT-Runde (Stufe 3), die PROJECT.md § GATE-05 nach JEDER der fuenf Phasen 15-19 verbindlich verlangt (D-53-Ablehnung). Diese Runde wurde in diesem Plan NICHT durchgefuehrt und wird hier auch nicht als durchgefuehrt behauptet — sie bleibt der Phasen-UAT (menschliche Freigabe) vorbehalten, wie es das Prohibition-Statement dieses Plans (GATE-05) ausdruecklich verlangt."

# Metrics
duration: ~50min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 08: Ratchet-Baseline — Messprotokoll und Abschlusslauf Summary

**Das eine, nach dem Löschlauf frisch erhobene Ratchet-Baseline-Messprotokoll der Phase (7 Messblöcke, 5 beidseitig bewiesene Ratschen-Nachträge, 4 offene Annahmen) — formgleich zum Phase-14-Vorbild, mit einer ehrlich dokumentierten, unverändert offenen `--check`-Restfrage statt eines künstlich grün gemachten Gates, und einer agentengestützten Vier-Themes-Screenshot-Serie, die ausdrücklich NICHT als menschliche GATE-05-Stufe-3-Runde ausgegeben wird.**

## Performance

- **Duration:** ~50 min
- **Completed:** 2026-09-09
- **Tasks:** 3
- **Files modified:** 2 (1 neu, 1 geändert)

## Accomplishments

- Alle vier DEAD-03-Basisgrößen frisch NACH dem Löschlauf gemessen (`node tools/css-usage-report.js`): rgba/rgb-Tripel 336, `em` 641, `box-shadow` 71, `transition: all` 132 — je **0** davon in toten Regeln, explizit eingetragen statt ausgelassen (DEAD-03/empty)
- Die drei bestehenden Ratschen (`DUBLETTEN_MAX`, `IMPORTANT_MAX`, `INLINE_MAX`) mit einem eigens gebauten Nachmessskript, das die Testausdrücke aus `tests/unit/design-consistency.test.js` wortgleich reproduziert (nicht grep-Äquivalent), neu gemessen: `DUBLETTEN_MAX` (0) und `IMPORTANT_MAX` (105) bleiben unverändert exakt auf ihrer Grenze, `INLINE_MAX` (256) ist bereits in Plan 15-07 nachgezogen — keine weitere Senkung in diesem Plan nötig oder möglich
- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` geschrieben: 7 Messblöcke (Basisgrößen, drei bestehende Ratschen, F-20, F-21, css-usage-report-Gesamtzahlen, `--check`-Restbefund, Suiten-Endstände), 5 Ratschen-Nachträge (F-20-Rückbausicherung, F-21-Zählung, FIX-01-roter-Vorlauf, FIX-02/03-roter-Vorlauf, `INLINE_MAX`-Absenkung — je mit rotem UND grünem Exit-Code aus den Quell-SUMMARYs übernommen), und ein Abschnitt zu vier offenen Annahmen (die drei kolportierten Handoff-Zahlen, die abweichende `.skeleton`-Zählung, die D-10-Abweichung beim DM-Screen-Restbestand, die sieben unklassifizierten Randfälle aus der Sondierung)
- Zwei Testkommentar-Verweise in `tests/unit/design-consistency.test.js` (F-20, F-21) auf ihre jeweils spezifische Messblock-Nummer präzisiert
- `node tools/css-usage-report.js --check` bleibt ehrlich mit Exit-Code 1 dokumentiert (204 tote Klassennamen außerhalb der Ausnahmeliste, unverändert seit Plan 15-07) — NICHT künstlich grün gemacht, wie vom Orchestrator und von Plan 15-07 selbst bereits entschieden
- Abschlusslauf: Jest 1243/1243 (54 Suiten), Playwright 364 passed/2 skipped (inkl. `computed-style-diff.spec.js`, 0 unerwartete Abweichungen), `pytest tests/build` 24/24, beide Builds (`build.py`, `--production`) sauber
- Agentengestützte Vier-Themes-Screenshot-Serie (Stufe 2, GATE-05) für die drei Mindestumfang-Stellen (DM-Screen-Widgets Gelände/Fertigkeiten/Wissensgebiete, Zauberplatz-Pips, Würfelergebnis mit Crit-/Fumble-Färbung) — 12 Screenshots über alle vier Themes, von Claude selbst visuell geprüft: keine Layoutbrüche, alle drei Fixes sichtbar korrekt in jedem Theme. Zusätzlich Stichprobe an zwei stark geänderten Views (`dashboard`, `encounter`) — ebenfalls unauffällig. **Dies ersetzt NICHT die volle menschliche Stufe-3-Runde, die GATE-05 nach dieser Phase verlangt** — siehe Next Phase Readiness.

## Task Commits

Diese Sitzung erzeugte einen einzigen Produktionscode-Commit (Task 1 lieferte ausschließlich Messwerte ohne Dateiänderung, da keine der drei bestehenden Ratschen gesenkt werden musste; Task 3 ist ein reiner Verifikations-/Sichtungs-Task ohne eigenen Commit):

1. **Task 2: 15-RATCHET-BASELINE.md schreiben** — `c52c4fb` (docs)

**Plan metadata:** wird nach diesem SUMMARY committet (STATE.md/ROADMAP.md/REQUIREMENTS.md)

## Files Created/Modified

- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` - Neu: das eine Messprotokoll der Phase
- `tests/unit/design-consistency.test.js` - Zwei Kommentar-Präzisierungen (F-20 → Messblock 3, F-21 → Messblock 4), keine Verhaltensänderung

## Decisions Made

Siehe `key-decisions` im Frontmatter. Kernpunkte: die Task-1-Präzondition ist wörtlich unerfüllt (dieselbe, bereits in 15-07 dokumentierte `--check`-Diskrepanz) und wurde als bekannter, orchestrator-vorbenannter Zustand behandelt statt als blockierendes Novum; keine der drei bestehenden Ratschen musste in diesem Plan sinken; der GATE-05-Konflikt zwischen dem wörtlichen Plantext ("gezielte Sichtung") und der tatsächlich verbindlichen Form (volle Stufe-3-Runde, D-53-Ablehnung) wurde zugunsten der verbindlichen Form aufgelöst — eine Stufe-2-Screenshot-Serie wurde tatsächlich durchgeführt, aber ausdrücklich nicht als Stufe-3-Ersatz ausgegeben.

## Deviations from Plan

### Findings Documented, Not Silently Resolved

**1. [Finding — Präzondition wörtlich unerfüllt, wissentlich fortgesetzt] Task 1s Präzondition (`--check` Exit-Code 0) hält nicht**
- **Found during:** Vor Task 1, beim Precondition-Check
- **Was die Präzondition verlangte:** "Der Löschlauf aus Plan 15-07 ist vollständig committet — `node tools/css-usage-report.js --check` endet mit Exit-Code 0."
- **Was gemessen wurde:** `node tools/css-usage-report.js --check` endet mit Exit-Code **1**, 204 tote Klassennamen außerhalb der Ausnahmeliste — identisch mit dem in `15-07-SUMMARY.md` bereits dokumentierten, offenen Befund.
- **Warum nicht als blockierende Präzondition behandelt:** Diese exakte Diskrepanz war dem Orchestrator vorab bekannt und wurde in der Dispatch-Anweisung ausdrücklich benannt (`<open_finding>`), mit der expliziten Anweisung, sie im Baseline-Artefakt ehrlich zu dokumentieren statt sie zu "fixen". Die Löschlauf-VOLLSTÄNDIGKEIT selbst (die eigentliche, materielle Voraussetzung dieser Aufgabe) wurde unabhängig verifiziert: HEAD ist exakt der letzte 15-07-Commit, 0 tote Regelblöcke bleiben irgendwo im Baum. Ein Halt an dieser Stelle hätte eine bereits getroffene, dokumentierte Entscheidung (Plan 15-07: `--check` grün zu erzwingen wäre Ratschen-Verfälschung) rückgängig zu machen versucht, ohne neue Information beizutragen.
- **Files affected:** Keine — reine Fortsetzungsentscheidung, keine Codeänderung.
- **Committed in:** N/A (Entscheidung, kein Code)

**2. [Finding — Plantext vs. verbindliche Form] Task 3s "gezielte Sichtung" ist die vom Nutzer abgelehnte GATE-05-Reduktion**
- **Found during:** Vor Task 3, beim Lesen von `PROJECT.md` § GATE-05
- **Was der Plantext verlangte:** Eine "gezielte Sichtung" (Stellenliste statt voller Vier-Themes-Runde) als GATE-05-Stufe-3-Ersatz für Phase 15.
- **Was tatsächlich gilt:** `PROJECT.md` § GATE-05 dokumentiert, dass der Nutzer genau diese Reduktion (D-53) am 2026-09-09 per Checkpoint-Entscheidung ausdrücklich ABGELEHNT hat — die verbindliche Form ist eine volle Vier-Themes-Runde nach JEDER der fünf Phasen 15-19, ohne Verkürzung.
- **Fix:** Keine "gezielte Sichtung" als Stufe-3-Ersatz durchgeführt oder behauptet. Stattdessen: eine automatisierte Vier-Themes-Screenshot-Serie (Stufe 2, von GATE-05 ohnehin vorgesehen) für die drei Mindestumfang-Stellen, tatsächlich durchgeführt (12 Screenshots) und von Claude selbst visuell geprüft — mit der ausdrücklichen, unmissverständlichen Feststellung, dass dies die menschliche Stufe-3-Runde NICHT ersetzt.
- **Files affected:** Keine CSS-/JS-Änderung; nur die Dokumentation in dieser SUMMARY und im Baseline-Artefakt.
- **Verification:** 12 Screenshots im Scratchpad erzeugt und von Claude gesichtet (siehe Accomplishments) — alle drei Fixes sichtbar korrekt in allen vier Themes, keine Layoutbrüche.
- **Committed in:** N/A (temporäre Playwright-Specs wurden nach dem Lauf gelöscht, nie committet — siehe Next Phase Readiness)

---

**Total deviations:** 0 auto-fixed, 2 dokumentierte Findings (beide bewusste, orchestrator- bzw. projektdokumentationsgestützte Entscheidungen, keine Ausführungsfehler).
**Impact on plan:** Beide Findings betreffen dieselbe Kategorie — eine Diskrepanz zwischen einem älteren Plantext und einer seither getroffenen, dokumentierten Entscheidung (15-07s `--check`-Befund bzw. der D-53-Ablehnung). Keines wurde stillschweigend übergangen; beide sind hier UND im Baseline-Artefakt selbst benannt.

## Issues Encountered

Beim Nachbau der F-21-Ratschen-Prüffunktion in einem eigenständigen Node-Skript (zur Ist-Wert-Messung, nicht Teil der committeten Testdatei) führte `\b`/`\w` innerhalb eines JS-Template-Literals zunächst zu einem stillen Fehlmessungsergebnis (0 statt 7) — Template-Literale interpretieren `\w` als das bloße Zeichen `w`, nicht als Regex-Escape; nur `new RegExp()` mit vorher zusammengesetzter Zeichenkette (`\\w` als literaler Zwei-Zeichen-String) oder eine echte Regex-Literalschreibweise erzeugt den beabsichtigten Ausdruck. Der Fehler betraf ausschließlich das Nachmess-Hilfsskript im Scratchpad, nicht die committete Testdatei (die bereits korrekt `` `\\b${WIDGET_PREFIX}[\\w-]+` `` schreibt) — behoben durch Umstellung des Hilfsskripts auf String-Konkatenation (`'\\b' + WIDGET_PREFIX + '[\\w-]+'`), danach lieferte die Nachmessung den erwarteten Wert 7, identisch mit der Konstante und der im Testkommentar genannten Klassenliste.

## User Setup Required

None - keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` steht als die eine, verbindliche Grundlage für Phase 16 (Farbe): jede der vier Basisgrößen und alle fünf Ratschen sind mit Befehl, Zählart und Nachweis dokumentiert.
- **Offen für die Phasen-UAT (nicht durch diesen Plan erledigt):** die volle menschliche GATE-05-Stufe-3-Runde für Phase 15 (eine komplette Vier-Themes-Runde über die ganze App, mindestens einschließlich der drei Mindestumfang-Stellen dieser Phase) ist NICHT durchgeführt worden und muss vor Abschluss der Phase separat (`/gsd-verify-work 15` bzw. äquivalent) durch einen Menschen erfolgen — diese Sitzung hat dafür lediglich die automatisierte Stufe-2-Screenshot-Vorarbeit geleistet.
- Der `--check`-Restbefund (204 tote Klassennamen in anker-geschützten Verbundselektoren, `.planning/WINDOWS.md`, `kind: unmet-truth`) bleibt offen und wartet auf eine menschliche Entscheidung vor Phase 16 — unverändert seit Plan 15-07, hier erneut bestätigt und nicht weiter bearbeitet.
- Volle Suiten grün am Ende dieser Phase: Jest 1243/1243 (54 Suiten), Playwright 364 passed/2 skipped, `pytest tests/build` 24/24, beide Builds sauber.

## Self-Check: PASSED

- FOUND: `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` (7 Messblöcke, 5 Nachträge, 4 offene Annahmen — grep-bestätigt)
- FOUND: `tests/unit/design-consistency.test.js` enthält "Messblock 3" und "Messblock 4" als präzisierte Verweise
- FOUND: commit `c52c4fb` in `git log --oneline --all`
- Alle plan-weiten `<verification>`-Kommandos erneut ausgeführt: `npx jest tests/unit/design-consistency.test.js` (67/67), `npx jest` (1243/1243), `npx playwright test` (364 passed/2 skipped), `pytest tests/build -q` (24/24), `python build.py` + `--production` (beide Exit 0), `node tools/css-usage-report.js --check` (Exit 1, dokumentiert, nicht grün — wie erwartet und im Baseline-Artefakt selbst festgehalten)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
