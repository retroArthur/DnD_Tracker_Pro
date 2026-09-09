---
phase: 15-befundlage-vorlauf
plan: 10
subsystem: documentation
tags: [claude-md, gate-04, base-01, docs-consistency, jest-guard]

# Dependency graph
requires:
  - phase: 15-02
    provides: "Erste (unvollstaendige) Korrektur der CSS-Dateizahl in CLAUDE.md; Ursache des hier geschlossenen Gaps"
  - phase: 15-09
    provides: "Verifikationsbericht 15-VERIFICATION.md, dessen Gap 2 diesen Plan ausloest"
provides:
  - "CLAUDE.md nennt die CSS-Dateizahl an allen drei Stellen (Zeile 144, 523, 759) einheitlich als 20 — gemessen, nicht behauptet"
  - "tests/unit/docs-consistency.test.js: sprachunabhaengiger Jest-Waechter (DOC-01..DOC-04), der eine kuenftige Abweichung zwischen CLAUDE.md und dem gemessenen Baum dauerhaft rot macht"
  - "Struktur-Codeblock der CSS-Organisation vollstaendig (20 Dateien) und kaskadensortiert (@import-Reihenfolge des Hubs), ohne veraltete Zeilenzahlen-Klammern"
affects: ["16", "17", "18", "19"]

# Actuals (#2632)
actuals:
  tokens: 3700
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sprachunabhaengige Zahlpruefung: Kandidatenzeilen ueber Kontext-Substring filtern (assets/styles / CSS-Datei), dann (\\d+)\\s+modular\\w* matchen — trifft modular/modulare/modularen gleichermassen statt eine einzelne woertliche Zeichenkette in einer Sprache zu grepen"
    - "Struktur-Codeblock als Pruefgegenstand ueber eine benannte Marker-Konstante (STRUCTURE_BLOCK_MARKER) identifizieren, mit expliziter GENAU-EINEN-Block-Zusicherung vor jeder Inhaltspruefung"
    - "Nicht messbar geschuetzte Angaben (Zeilenzahlen je Datei) werden entfernt statt fortgeschrieben; an ihre Stelle tritt Messbefehl + Datum (BASE-01/empty-Prinzip)"

key-files:
  created:
    - tests/unit/docs-consistency.test.js
  modified:
    - CLAUDE.md
    - .planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md

key-decisions:
  - "Zeilenzahlen-Spalte im Struktur-Codeblock entfernt statt neu gemessen — die alten Werte waren bereits vor dem Loeschlauf der Phase 15 grob falsch (z.B. variables.css: weit unter dem Ist-Wert; dashboard.css: fast das Doppelte) und ohne Waechter beim naechsten CSS-Merge wieder falsch geworden. An ihre Stelle: Messbefehl + Datum unter dem Block."
  - "Struktur-Codeblock-Reihenfolge = @import-Kaskadenreihenfolge aus assets/styles.css, nicht alphabetisch — richtig UND durch DOC-04 dauerhaft pruefbar."
  - "DOC-02 scheitert explizit bei weniger als drei gefundenen Zahlenbehauptungen (BASE-01/empty) — ein leerer Trefferlauf durch kuenftige Umformulierung ist kein stiller Erfolg."
  - "Nur der eine in 15-VERIFICATION.md (Gap 2) benannte Befund wird geschlossen; der in CLAUDE.md selbst gefuehrte fehlende Werkzeugleisten-Waechtertest bleibt ausdruecklich unberuehrte Restschuld (GATE-04/unclassified)."

requirements-completed: [BASE-01, GATE-04]

coverage:
  - id: D1
    description: "CLAUDE.md widerspricht sich nicht mehr ueber die CSS-Dateizahl: Zeile 144, 523 und 759 nennen alle denselben, gemessenen Wert (20)"
    requirement: "BASE-01"
    verification:
      - kind: unit
        ref: "tests/unit/docs-consistency.test.js#DOC-02: jede Zahlenbehauptung ueber die CSS-Dateizahl in CLAUDE.md nennt die gemessene Zahl, sprachunabhaengig"
        status: pass
    human_judgment: false
  - id: D2
    description: "Struktur-Codeblock listet alle 20 vorhandenen CSS-Dateien (inkl. der 7 zuvor fehlenden) in der @import-Kaskadenreihenfolge des Hubs, ohne Zeilenzahlen"
    requirement: "GATE-04"
    verification:
      - kind: unit
        ref: "tests/unit/docs-consistency.test.js#DOC-03: der Struktur-Codeblock listet genau so viele .css-Eintraege, wie Dateien vorhanden sind"
        status: pass
      - kind: unit
        ref: "tests/unit/docs-consistency.test.js#DOC-04: die Dateinamen im Struktur-Codeblock stimmen in Menge UND Reihenfolge mit der @import-Reihenfolge des Hubs ueberein"
        status: pass
    human_judgment: false
  - id: D3
    description: "Waechtertest DOC-01..DOC-04 macht den Rueckfall strukturell unmoeglich, ist dauerhaft in der Jest-Suite und rot-gruen bewiesen"
    requirement: "GATE-04"
    verification:
      - kind: unit
        ref: "tests/unit/docs-consistency.test.js — vollstaendige Datei, 4 Faelle"
        status: pass
      - kind: other
        ref: "Rot-Gruen-Protokoll: npx jest tests/unit/docs-consistency.test.js vor der Korrektur (3 failed, 1 passed, Exit 1) und danach (4 passed, Exit 0), dokumentiert in Messblock 9"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-09-09
status: complete
---

# Phase 15 Plan 10: CLAUDE.md-Selbstwiderspruch ueber die CSS-Dateizahl geschlossen, sprachunabhaengiger Jest-Waechter Summary

**CLAUDE.md nennt die CSS-Dateizahl jetzt an allen drei Stellen einheitlich (gemessen: 20), abgesichert durch einen neuen Jest-Waechter (`docs-consistency.test.js`, DOC-01..DOC-04), der auf die Zahl vor dem Wortstamm zielt statt auf eine einzelne woertliche Zeichenkette in einer Sprache — genau die Abnahmeform, die den Gap in Plan 15-02 erzeugt hat.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2
- **Files modified:** 3 (1 neu, 2 geaendert)

## Accomplishments

- Neue Testdatei `tests/unit/docs-consistency.test.js` mit vier Faellen (DOC-01..DOC-04), rot bewiesen VOR jeder CLAUDE.md-Aenderung: `3 failed, 1 passed, 4 total`, Exit-Code 1 (DOC-02/DOC-03/DOC-04 rot, DOC-01 gruen — DOC-01 ist die Verankerung Dateizahl == @import-Zeilenzahl und war bereits vorher korrekt).
- CLAUDE.md an den drei betroffenen Stellen korrigiert: Roadmap-Tabellenzeile (Zeile 523) und Fliesstext + Struktur-Codeblock des Abschnitts "CSS Organization for New Features" (Zeile 759ff.) von 13 auf den gemessenen Wert 20 gesetzt. Struktur-Codeblock vollstaendig neu geschrieben: alle 20 Dateien in `@import`-Kaskadenreihenfolge aus `assets/styles.css`, inklusive der sieben zuvor fehlenden Eintraege (`bestiary.css`, `command-palette.css`, `file-backup.css`, `fonts.css`, `migration.css`, `pwa.css`, `welt.css`).
- Zeilenzahlen-Klammerangabe je Datei aus dem Struktur-Codeblock entfernt (sie war bereits vor dem Loeschlauf der Phase 15 grob veraltet) und durch eine Zeile mit Stand-Datum und dem woertlichen Messbefehl ersetzt.
- Waechter danach gruen gefahren: `4 passed, 4 total`, Exit-Code 0. Vollstaendige Jest-Suite ebenfalls gruen: `1251 passed, 1251 total` (55 Suiten, 50 Snapshots).
- `## Messblock 9` in `15-RATCHET-BASELINE.md` ergaenzt (nach Messblock 8), mit Messbefehl, vollstaendigem Rot-Gruen-Protokoll und der begruendeten Entscheidung zur entfernten Zeilenzahlen-Spalte.

## Task Commits

Each task was committed atomically:

1. **Task 1: Waechtertest anlegen und rot beweisen** - `add2a2b` (test)
2. **Task 2: CLAUDE.md widerspruchsfrei machen und den Messstand protokollieren** - `50ae9eb` (docs)

## Files Created/Modified

- `tests/unit/docs-consistency.test.js` - Neuer Waechter, vier Faelle (DOC-01..DOC-04), liest `assets/styles/`, `assets/styles.css` und `CLAUDE.md` vom echten Baum; nur Node-Standardmodule (`fs`, `path`)
- `CLAUDE.md` - Drei Stellen korrigiert (Zeile 144 bereits vorher korrekt, Zeile 523 und 759ff. jetzt nachgezogen); Struktur-Codeblock vollstaendig neu geschrieben (20 statt 13 Eintraege, kaskadensortiert, ohne Zeilenzahlen)
- `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md` - Neuer Abschnitt `## Messblock 9` mit Messbefehl, Rot-Gruen-Protokoll und Entscheidungsbegruendung

## Rot-Gruen-Protokoll (D-49)

```
Task 1 — vier neue Faelle gegen das UNVERAENDERTE CLAUDE.md:
npx jest tests/unit/docs-consistency.test.js
Tests:       3 failed, 1 passed, 4 total
Exit-Code:   1
Fehlgeschlagene Faelle: DOC-02, DOC-03, DOC-04 (DOC-01 gruen)

Task 2 — nach der Korrektur an allen drei Stellen von CLAUDE.md:
npx jest tests/unit/docs-consistency.test.js
Tests:       4 passed, 4 total
Exit-Code:   0

Vollstaendige Suite danach:
npx jest
Tests:       1251 passed, 1251 total (55 Suiten, 50 Snapshots)
Exit-Code:   0
```

Zwei protokollierte Zustaende, ein Exit-Code ungleich 0 vor der Korrektur, 0 danach — Kriterium
erfuellt. Die drei roten Faelle (DOC-02, DOC-03, DOC-04) entsprechen exakt den in
`15-VERIFICATION.md` (Gap 2) benannten widersprochenen Stellen, kein Ueberschuss und keine Luecke.

## Geaenderte Stellen in CLAUDE.md

| Zeile | Vorher | Nachher |
|---|---|---|
| 144 | "20 modulare CSS-Dateien" (bereits korrekt aus Plan 15-02) | unveraendert, jetzt zusaetzlich vom Waechter geschuetzt |
| 523 | "Already split into **13** modular files in `assets/styles/`" | "Already split into **20** modular files in `assets/styles/`" |
| 759 | "Now split into **13** modular files under `assets/styles/`" + Struktur-Codeblock mit 13 Eintraegen (7 fehlten) und Zeilenzahlen-Klammern | "Now split into **20** modular files under `assets/styles/`" + Struktur-Codeblock mit 20 Eintraegen in `@import`-Kaskadenreihenfolge, ohne Zeilenzahlen, mit Messbefehl+Datum-Zeile darunter |

## Begruendung fuer die entfernte Zeilenzahlen-Spalte

Die bisherigen Klammerangaben je Datei (z.B. `variables.css (260)`, `dashboard.css (3433)`) waren
bereits vor dem Loeschlauf der Phase 15 grob falsch — `variables.css`s tatsaechliche Zeilenzahl lag
deutlich ueber dem doppelten des genannten Werts, `dashboard.css`s bei ungefaehr der Haelfte. Eine
Zahl, die sich bei jeder CSS-Aenderung verschiebt und die kein Test schuetzt, waere beim naechsten
CSS-Merge zwangslaeufig wieder falsch gewesen. Konsistent mit dem BASE-01/empty-Prinzip dieser
Phase (eine nicht messbar geschuetzte Angabe wird weggelassen, nicht geraten) wurde die Spalte
entfernt statt neu gemessen; an ihrer Stelle steht jetzt eine Zeile mit Stand-Datum und dem
woertlichen Messbefehl (`ls assets/styles/*.css | wc -l`), genau wie bereits in der
Modul-Organisations-Tabelle (Zeile 144) seit Plan 15-02 etabliert.

## Decisions Made

Siehe `key-decisions` im Frontmatter.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Ein selbst verursachter, sofort korrigierter Zwischenfehler beim Schreiben des Struktur-Codeblocks:
der erste Edit-Versuch erzeugte versehentlich eine treppenfoermig zunehmende Einrueckung je Zeile
(kein inhaltlicher Fehler, reine Whitespace-Formatierung). Vor dem Waechterlauf bemerkt und mit
einem zweiten Edit auf gleichmaessige Ausrichtung korrigiert — der Waechter selbst pruefte diesen
Aspekt nicht (er ist formatunabhaengig: `TREE_CONNECTOR_PATTERN` und `\s+`-Trennung ignorieren
variable Einrueckungsbreite), das galt ausschliesslich der Lesbarkeit fuer Menschen.

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Next Phase Readiness

- CLAUDE.md ist widerspruchsfrei ueber die CSS-Dateizahl und der Widerspruch kann nicht
  zurueckkehren, ohne dass `npx jest` sofort rot wird — die Abnahme zielt jetzt auf die Zahl selbst,
  in jeder Sprachfassung, gegen den gemessenen Baum.
- Der letzte offene, im GATE-04-Geltungsbereich dieses Plans NICHT geschlossene Befund aus
  `15-VERIFICATION.md` (Gap 1, CR-01 `collectLiveTokens()`-Blindstelle fuer `.className = <Ternary>`
  und `containerClass:`/`className:`-Schluessel) ist unveraendert offen — dieser Plan hat ihn nicht
  angefasst, weil er ein anderes Werkzeug (`tools/css-usage-report.js`) betrifft, nicht CLAUDE.md.
- Phase 15 hat jetzt beide in `15-VERIFICATION.md` benannten Gaps entweder geschlossen (Gap 2, dieser
  Plan) oder unveraendert dokumentiert offen gelassen (Gap 1, bereits in `15-09-SUMMARY.md` als
  eigener Fund behandelt — siehe dortiges Messblock-8-Protokoll). Re-Verifikation sollte beide Gaps
  gegen den jeweils zustaendigen Plan pruefen.
- Volle Suiten gruen: Jest 1251/1251 (55 Suiten, 50 Snapshots). Playwright/pytest/Build wurden in
  diesem Plan nicht erneut ausgefuehrt (keine Aenderung an Quellcode, Templates oder Build-Skript —
  nur Markdown-Prosa und ein neues Node-Testmodul, kein Browsermodul, nicht in `loader.js`
  eingetragen); ihr zuletzt gemessener Stand aus Messblock 7 bleibt unveraendert massgeblich.

## Self-Check: PASSED

- FOUND: `tests/unit/docs-consistency.test.js` auf der Festplatte
- FOUND: `20 modulare CSS-Dateien` in CLAUDE.md Zeile 144
- FOUND: `Already split into 20 modular files` in CLAUDE.md Zeile 523
- FOUND: `Now split into 20 modular files` in CLAUDE.md Zeile 759
- FOUND: `13 modular` kommt 0-mal mehr in CLAUDE.md vor
- FOUND: alle 7 zuvor fehlenden Dateinamen (`bestiary.css`, `command-palette.css`, `file-backup.css`, `fonts.css`, `migration.css`, `pwa.css`, `welt.css`) im Struktur-Codeblock
- FOUND: `## Messblock 9` genau einmal in `15-RATCHET-BASELINE.md`
- FOUND: commit `add2a2b` in `git log --oneline --all`
- FOUND: commit `50ae9eb` in `git log --oneline --all`
- All plan-level `<verification>` commands re-run and green (siehe Rot-Gruen-Protokoll oben)

---
*Phase: 15-befundlage-vorlauf*
*Completed: 2026-09-09*
