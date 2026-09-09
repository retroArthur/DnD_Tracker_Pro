---
phase: 15-befundlage-vorlauf
plan: 02
subsystem: documentation
tags: [design-handoff, decisions, gate-04, gate-05, css-audit, checkpoint-decision]

# Dependency graph
requires:
  - phase: 15-01
    provides: "Ratschen-Schleife bewiesen; N-08 im Handoff geschlossen (B-07 damit ausführbar)"
provides:
  - "Alle dreizehn Blocker B-01..B-13 aus HANDOFF-V2-VERIFIKATION.md als begründete, rückverweisbare Entscheidungen in PROJECT.md § Blocker-Entscheidungen v1.3"
  - "GATE-04 gesetzt: sechs Befundgruppen außerhalb assets/styles/ je mit Phasenzuordnung (16/18) oder Übertragszeile; sieben harte Ausnahmen namentlich, sw.js ausdrücklich nicht darunter"
  - "GATE-05 gesetzt: dreistufige Abnahmeform — Stufe 3 bleibt bei FÜNF vollen Vier-Themes-Runden (nach jeder der Phasen 15-19), nachdem der Nutzer die im Plan vorgesehene Reduktion auf drei Runden (D-53) per Checkpoint ausdrücklich abgelehnt hat"
  - "Zwei sachlich falsche CLAUDE.md-Behauptungen korrigiert: CSS-Dateizahl (13 -> gemessen 20) und der nicht existierende Werkzeugleisten-Wächtertest (jetzt als Restschuld benannt statt implizit vorausgesetzt)"
affects: [15-03, 15-04, 15-05, 15-06, 15-07, 15-08, "16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 6514
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Blocker-Entscheidung als vierteiliges Format (Kennung, Entscheidung, Begründung, Auswirkung) mit Doppel-Rückverweis auf HANDOFF-V2-VERIFIKATION.md (B-NN) und 15-CONTEXT.md (D-NN) — macht jede Entscheidung später ihrem Anlass zuordenbar (T-15-03)"
    - "Restschuld-Tabelle mit Messbefehl + gemessener Zahl im Kernfeld, identisches Format zur bestehenden v1.2-Tabelle — überlebt das Archivieren des Milestones (D-33)"
    - "Eine per Checkpoint vorgeschlagene Reduktion, die der Nutzer ablehnt, wird als ausdrückliche Ablehnung gebucht, nicht als stille Beibehaltung des Status quo — die Ablehnung selbst ist der Beleg, dass GATE-05s Verbot einer stillschweigenden Absenkung eingehalten wurde"

key-files:
  created: []
  modified:
    - .planning/PROJECT.md
    - CLAUDE.md

key-decisions:
  - "D-53 (Absenkung der händischen Abnahme von fünf auf drei volle Runden) wurde dem Nutzer als Checkpoint-Entscheidung vorgelegt und von ihm AUSDRÜCKLICH ABGELEHNT (2026-09-09) — gebucht ist die ursprüngliche, strengere Form: eine volle Vier-Themes-Runde nach JEDER der fünf Phasen 15-19, keine gezielte Stellenliste als Ersatz für Phase 15 oder 19"
  - "D-43, D-39, D-41 wie in 15-CONTEXT.md vorgeschlagen bestätigt: sichtbarer Rahmenwechsel gilt als Fokusring-Ersatz (33 von 34 Stellen fertig); Kurven-Token `--ease` wird eingeführt, aber mit dem Wert `ease` (Kurvenwechsel bleibt Restschuld); Zielwert für `font-weight: 500` ist 600, Ausführung bleibt bei TYPO-07 zurückgestellt"
  - "Hex-Farbliteral-Zählung außerhalb CSS eigenständig nachgemessen (149, nicht die aus 15-CONTEXT.md übernommenen 148) — Messmethode (Lookbehind-Ausschluss von HTML-Entities wie `&#246;`, Scope: sourceJs()-Verzeichnisse + assets/templates + loader.js + index.html) im Übertrag-Eintrag dokumentiert, damit die Zahl jederzeit nachprüfbar bleibt"
  - "Werkzeugleisten-Wächtertest-Behauptung in CLAUDE.md nicht wörtlich vorgefunden (anders als in 15-CONTEXT.md § Gemessene Defekte beschrieben) — die aktuelle CLAUDE.md-Formulierung behauptet lediglich die `--check`-Fähigkeit des Generators, nicht die Existenz eines Tests; trotzdem wurde eine explizite Restschuld-Klarstellung ergänzt, um die Lücke (kein Test, kein CI-Schritt) nicht implizit offenzulassen"

requirements-completed: [BASE-01, GATE-04, GATE-05]

coverage:
  - id: D1
    description: "Alle 13 Blocker B-01..B-13 als begründete Einträge (Entscheidung + Begründung + Auswirkung) in PROJECT.md § Blocker-Entscheidungen v1.3, mit 13 Verweiszeilen in der bestehenden Key-Decisions-Tabelle (auch für B-01/B-02/B-07)"
    requirement: "BASE-01"
    verification:
      - kind: unit
        ref: "grep -c \"^## Blocker-Entscheidungen v1.3\" .planning/PROJECT.md == 1; grep -oE \"B-(0[1-9]|1[0-3])\" .planning/PROJECT.md | sort -u | wc -l == 13; grep -oE \"D-[0-9]{2}\" .planning/PROJECT.md | sort -u | wc -l == 26 (>= 25)"
        status: pass
      - kind: unit
        ref: "awk-Reihenfolgeprüfung: Key Decisions < Blocker-Entscheidungen v1.3 < Evolution"
        status: pass
    human_judgment: false
  - id: D2
    description: "GATE-04 gesetzt: sechs Befundgruppen (3 mit Phasenzuordnung 16/18, 3 als Übertrag-aus-v1.3-Tabelle mit Messbefehl+Zahl), sieben harte Ausnahmen namentlich, sw.js ausdrücklich ausgenommen; CLAUDE.md CSS-Dateizahl und Werkzeugleisten-Wächter-Behauptung korrigiert"
    requirement: "GATE-04"
    verification:
      - kind: unit
        ref: "test $(ls assets/styles/*.css | wc -l) = 20 && grep -q \"### Übertrag aus v1.3\" .planning/PROJECT.md && grep -q \"20 modulare CSS-Dateien\" CLAUDE.md"
        status: pass
      - kind: unit
        ref: "grep -c \"13 modulare CSS-Dateien\" CLAUDE.md == 0"
        status: pass
    human_judgment: true
    rationale: "Das Task-2-<human-check> verlangt eine inhaltliche Prüfung, dass jede der sechs D-32-Befundgruppen in PROJECT.md auffindbar ist und eine Phase oder Übertragszeile trägt — das ist eine redaktionelle Vollständigkeitsprüfung, kein Messwert. Per workflow.human_verify_mode=end-of-phase für die gebündelte Phasen-UAT vorgemerkt."
  - id: D3
    description: "GATE-05 gesetzt: dreistufige Abnahmeform mit D-54-Harness-Grenze (4 Punkte); D-53-Reduktion vom Nutzer per Checkpoint abgelehnt, Form bleibt bei fünf vollen Vier-Themes-Runden nach jeder Phase 15-19; Phase-15-Mindestumfang (3 Bereiche, 4 Themes) als Teil der vollen Runde benannt, nicht als Ersatz"
    requirement: "GATE-05"
    verification:
      - kind: unit
        ref: "grep -c GATE-05 .planning/PROJECT.md == 2 (>= 1)"
        status: pass
      - kind: unit
        ref: "vier nummerierte D-54-Punkte unter 'Grenze des Harness'; 'Gelände, Fertigkeiten und Wissensgebiete' + 'allen vier Themes' je mindestens einmal vorhanden"
        status: pass
    human_judgment: true
    rationale: "Der Checkpoint selbst war die menschliche Entscheidung (bereits eingeholt und in den Deviations dokumentiert); das ursprüngliche Task-3-<human-check> ('Stellenliste deckt ab, was der Nutzer sehen will') ist durch die Ablehnung von D-53 gegenstandslos geworden, weil es keine gezielte Stellenliste als eigenständiges Abnahmeobjekt mehr gibt — die drei Bereiche sind jetzt Teil einer vollen Runde. Als human_judgment markiert, weil die redaktionelle Vollständigkeit der GATE-05-Formulierung eine Lektüreprüfung bleibt."

# Metrics
duration: ~40min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 02: Blocker-Entscheidungen, GATE-04, GATE-05 Summary

**Alle dreizehn Blocker aus dem verifizierten Design-Handoff als begründete Entscheidungen in PROJECT.md gebucht, GATE-04 (Geltungsbereich CSS/JS) und GATE-05 (dreistufige Abnahme) gesetzt — wobei der Nutzer die im Plan vorgesehene Reduktion der händischen Abnahme (D-53) per Checkpoint ausdrücklich ablehnte und die strengere Fünf-Runden-Form bestätigte.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-09-09T08:44:30Z
- **Tasks:** 3 (plus 1 Checkpoint-Entscheidung vor Task 1)
- **Files modified:** 2 (`.planning/PROJECT.md`, `CLAUDE.md`)

## Accomplishments

- **Checkpoint (vorab):** Der Nutzer beantwortete die vier vorgelegten Entscheidungen einzeln: D-43, D-39, D-41 wie in `15-CONTEXT.md` vorgeschlagen bestätigt; **D-53 (Reduktion der händischen Abnahme von fünf auf drei volle Runden) ausdrücklich abgelehnt.**
- **Task 1:** Neuer Abschnitt `## Blocker-Entscheidungen v1.3 (B-01..B-13)` in `PROJECT.md` zwischen `## Key Decisions` und `## Evolution` — alle dreizehn Blocker mit Entscheidung, Begründung und Auswirkung auf die Folgephasen, jeweils rückverwiesen auf `HANDOFF-V2-VERIFIKATION.md` (B-NN) und die zugehörigen `D-NN`-Kennungen aus `15-CONTEXT.md`. Dreizehn neue Verweiszeilen in der bestehenden Key-Decisions-Tabelle (auch für B-01, B-02, B-07, die dort inhaltlich schon standen — deren bestehende Zeilen blieben unverändert).
- **Task 2:** GATE-04 gesetzt — sechs Befundgruppen außerhalb `assets/styles/` je einer Phase (Farbliterale mit Theme-Gewinn -> Phase 16; Schriftgrößen und die drei von TYPO-05 verbotenen Schriftgewichte -> Phase 18) oder einer neuen Tabelle `### Übertrag aus v1.3 (weiterhin offen)` zugeordnet (Übergänge/Schatten außerhalb CSS: 0 Vorkommen; Hex-Farbliterale außerhalb CSS: 149 selbst nachgemessen; fehlender Werkzeugleisten-Wächter). Sieben harte Ausnahmen von jeder Tokenisierung namentlich mit Datei und Grund geführt; `sw.js` ausdrücklich nicht darunter. Zwei CLAUDE.md-Behauptungen korrigiert: die CSS-Dateizahl (13 -> gemessen 20) und die implizite Werkzeugleisten-Wächter-Annahme (jetzt als offene Restschuld benannt).
- **Task 3:** GATE-05 gesetzt — dreistufige Abnahmeform (automatisch je Welle, Screenshot-Serie, menschliche Stufe). **Stufe 3 bleibt bei fünf vollen Vier-Themes-Runden** (eine nach jeder Phase 15-19), weil der Nutzer die im Plan vorgesehene Reduktion (D-53) ablehnte. Die drei Phase-15-spezifischen Prüfbereiche (DM-Screen-Widgets, Zauberplatz-Pips, Würfelergebnis) sind als Mindestumfang INNERHALB der vollen Runde benannt, nicht als Ersatz dafür. D-54-Harness-Grenze mit vier nicht abgedeckten Urteilen dokumentiert.

## Task Commits

Each task was committed atomically:

1. **Checkpoint (kein Commit — Nutzerentscheidung, in Deviations dokumentiert)**
2. **Task 1: Die dreizehn Blocker in PROJECT.md buchen** - `d949488` (docs)
3. **Task 2: Geltungsbereich und Restschuld — GATE-04 setzen, Übertrag aus v1.3 anlegen** - `7211269` (docs)
4. **Task 3: Abnahmeform festschreiben — GATE-05 dreistufig** - `9e3dd34` (docs)

## Files Created/Modified

- `.planning/PROJECT.md` - Neuer Abschnitt „Blocker-Entscheidungen v1.3" (13 Einträge), 13 neue Key-Decisions-Verweiszeilen, neuer Abschnitt „GATE-04", neue Tabelle „Übertrag aus v1.3", neuer Abschnitt „GATE-05"
- `CLAUDE.md` - CSS-Dateizahl korrigiert (13 -> 20), Werkzeugleisten-Wächter-Restschuld ergänzt

## Decisions Made

Siehe `key-decisions` im Frontmatter. Kernpunkt: **D-53 wurde dem Nutzer als Checkpoint vorgelegt und abgelehnt** — die im Plan-Text mehrfach genannte "Reduktion auf drei Vollrunden" wurde NICHT gebucht; stattdessen steht die ursprüngliche, strengere Form (fünf volle Runden) in `PROJECT.md`. Diese Ablehnung ist der Beleg, dass das GATE-05-Verbot einer stillschweigenden Absenkung eingehalten wurde — es wurde ausdrücklich vorgeschlagen, ausdrücklich verworfen, nicht kommentarlos beibehalten.

## Deviations from Plan

### Authorized Deviation — Human Checkpoint Decision

**1. [Checkpoint-Entscheidung] D-53 (Reduktion der händischen Abnahme) abgelehnt — Plan-Text zu "drei Vollrunden" nicht befolgt**
- **Found during:** Checkpoint vor Task 1 (`gate="blocking-human"`)
- **Plan-Annahme:** `15-02-PLAN.md` Task 3 und `15-CONTEXT.md` D-53 gingen von einer Absenkung auf drei volle Runden (nach Phasen 16, 17, 18) plus gezielten Stellenlisten nach Phasen 15 und 19 aus.
- **Nutzerentscheidung:** Der Nutzer beantwortete die vier vorgelegten Punkte individuell und lehnte D-53 ausdrücklich ab; D-43, D-39, D-41 wurden wie vorgeschlagen bestätigt.
- **Umsetzung:** GATE-05 wurde mit der ursprünglichen, strengeren Form gebucht — eine volle Vier-Themes-Runde nach JEDER der fünf Phasen 15-19, keine gezielte Stellenliste als Ersatz. Die drei für Phase 15 vorgesehenen Prüfbereiche wurden nicht gestrichen, sondern als Mindestumfang INNERHALB der vollen Runde neu formuliert.
- **Files modified:** `.planning/PROJECT.md` (Abschnitt „GATE-05")
- **Verification:** `grep -c GATE-05 .planning/PROJECT.md` == 2; Abschnitt nennt explizit „ABGELEHNT (2026-09-09)" und die fünf Phasen mit „volle Runde" für jede.
- **Committed in:** `9e3dd34` (Task 3 commit)
- **Impact:** Dies ist eine **autorisierte Abweichung**, keine Ausführungslücke — der Plan sah genau diesen Checkpoint als Entscheidungspunkt vor, und die getroffene Entscheidung war eine der beiden im Plan angebotenen Optionen ("Einzeln entscheiden — abweichende Punkte benennen"). Phase 15 endet dadurch mit einer vollen Vier-Themes-Runde statt eines Ersatz-Stellenlisten-Checks; die Phasen 16-19 erben dieselbe unveränderte Form.

---

**Total deviations:** 1 autorisierte Abweichung (Checkpoint-Entscheidung, keine Rule-1/2/3/4-Autofixes nötig).
**Impact on plan:** Die Kernstruktur (drei Tasks, 13 Blocker, GATE-04/05) blieb unverändert; nur der konkrete Inhalt von GATE-05s Stufe 3 wurde durch die Nutzerentscheidung bestimmt, wie es der Checkpoint vorsah.

## Issues Encountered

Eine methodische Abweichung von einer im Kontextdokument übernommenen Zahl (nicht blockierend): `15-CONTEXT.md` § Deferred nennt „148 streng gemessene" Hex-Farbliteral-Stellen außerhalb CSS. Eigene Nachmessung mit Lookbehind-Ausschluss von HTML-Entities (`grep -rhoP "(?<!&)#[0-9a-fA-F]{3,8}\b" ...` über dieselben sechs JS-Verzeichnisse plus `assets/templates`, `loader.js`, `index.html`) ergab **149**. Die Differenz von 1 ist am wahrscheinlichsten eine Zählart-Nuance (Zeilen- vs. Vorkommenszählung an einer Stelle mit zwei Hex-Werten in derselben Zeile, vgl. `loader.js:204`). Der Übertrag-Eintrag in `PROJECT.md` nennt die selbst nachgemessene Zahl (149) mit dem exakten Reproduktionsbefehl, statt die nicht exakt reproduzierbare Handoff-Zahl unkritisch zu übernehmen — konsistent mit der in Phase 15 etablierten Praxis, Zahlen zu messen statt zu übernehmen (vgl. 15-01: 11 statt 12 kolportierte `.skeleton`-Treffer).

## User Setup Required

None - keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- Die Phasen 16-19 finden alle dreizehn Blockerentscheidungen, den Geltungsbereich (GATE-04) und die Abnahmeform (GATE-05) an einer einzigen, garantiert gelesenen Stelle (`PROJECT.md`) und müssen keine davon erneut verhandeln.
- GATE-05s Stufe-3-Form ist jetzt bindend für alle fünf Phasen: eine volle Vier-Themes-Runde nach JEDER Phase, nicht nur nach 16/17/18. Plan 15-08 (Phase-15-Abschluss) muss diese volle Runde einplanen, nicht eine reduzierte Stellenliste.
- Die Restschuld (Übergänge/Schatten: 0; Hex-Literale: 149; Werkzeugleisten-Wächter: fehlt) ist sichtbar, datiert und mit Messbefehl geführt — überlebt das Archivieren des Milestones.
- Volle Suiten unverändert grün (dieser Plan hat ausschließlich Markdown-Prosa in `.planning/PROJECT.md` und `CLAUDE.md` geändert, keine Quelldatei berührt): Jest 1220/1220, Playwright 355 passed/2 skipped (Stand 15-04-SUMMARY.md, unverändert).

## Self-Check: PASSED

- FOUND: `## Blocker-Entscheidungen v1.3 (B-01..B-13)` in `.planning/PROJECT.md`, mit allen 13 Einzelüberschriften `**B-NN — ...**`
- FOUND: `### Übertrag aus v1.3 (weiterhin offen)` mit 3 Datenzeilen (Messbefehl + Zahl je Zeile)
- FOUND: `## GATE-05` mit drei Stufen und expliziter D-53-Ablehnung
- FOUND: `20 modulare CSS-Dateien` in `CLAUDE.md`; `13 modulare CSS-Dateien` kommt 0-mal mehr vor
- FOUND: commit `d949488` in `git log --oneline --all`
- FOUND: commit `7211269` in `git log --oneline --all`
- FOUND: commit `9e3dd34` in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green (siehe Accomplishments/Next Phase Readiness oben)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
