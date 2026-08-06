---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 01
subsystem: testing
tags: [playwright, e2e, execCommand, rich-text-editor, wiki, contenteditable]

# Dependency graph
requires:
  - phase: 08-test-fundament-gruen
    provides: Vollständig grüne Jest/Playwright-Suite als stabile Ausgangsbasis, blockierender E2E-CI-Gate
provides:
  - Ein echter End-to-End-Bold-Tracer (statische Wiki-Toolbar) mit exakter Markup-Assertion vor und nach Persistenz-Roundtrip
  - Empirisches Markup-Inventar aller 21 execCommand-Call-Sites in ui/editors/rich-text.js
  - Gemessene Antworten auf die Research-Annahmen A1 (Absatztrenner), A2 (data-editor=font-Erreichbarkeit), A3 (Laufzeitzustand EDITOR_FONTS/TOOLBAR_DIMENSIONS + floating-Toolbar-Sichtbarkeit), A4 (Strikethrough-Persistenz)
  - Vom Entwickler getroffene und wörtlich protokollierte Baseline-Entscheidung (option-a: Konstanten wiederherstellen)
affects: [09-02, 09-03, 09-04, 09-05, 09-06, 09-07, 09-08, 09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Playwright-Tracer mit exakter innerHTML-Gleichheitsassertion (kein toContain/Regex) als Prüfkette-Beweis vor Ausrollen des vollen Netzes"
    - "Temporäre Probe-Spec zur empirischen Erhebung, danach gelöscht — Wissensartefakt ist das Markdown-Dokument, nicht der Probe-Code"

key-files:
  created:
    - tests/e2e/features/editor-formatting.spec.js
    - .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
  modified: []

key-decisions:
  - "Baseline-Definition: option-a — EDITOR_FONTS/TOOLBAR_DIMENSIONS werden in Plan 09-02 wiederhergestellt, der reparierte Zustand gilt als eingefrorene Baseline (bewusste, protokollierte Ausnahme zur v1.1-Leitplanke 'verhaltensneutral')"
  - "A4 (Strikethrough-Persistenz-Bug) wird eingefroren, nicht repariert; als Datenintegritäts-Item für Phase 10 vorgemerkt"
  - "Fund 3 (Doppel-Paste-Listener) bleibt unangetastet — außerhalb des Task-3-Entscheidungsrahmens"

patterns-established:
  - "Exakte innerHTML-Gleichheitsassertion statt toContain/Regex als Standard für Markup-Beweise im Editor-Regressionsnetz"

requirements-completed: []

coverage:
  - id: D1
    description: "Bold-Tracer beweist die komplette Prüfkette (echter Toolbar-Klick → exaktes Markup → sanitizeHTML → localStorage → Reload → exaktes Markup) end-to-end"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-formatting.spec.js — 'sollte Bold über die statische Toolbar setzen und den Speichern/Reload-Zyklus überstehen'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Empirisches Markup-Inventar aller 21 execCommand-Call-Sites gemessen und dokumentiert (09-BASELINE.md)"
    requirement: "EDIT-01"
    verification:
      - kind: other
        ref: "node -e Zeilenzahl-Check gegen 09-BASELINE.md (>=21 Call-Site-Zeilen, A1-A4 vorhanden) — Teil des Task-2-<verify>-Blocks"
        status: pass
    human_judgment: false
  - id: D3
    description: "Baseline-Definitionsentscheidung (Reparatur vs. Einfrieren) ist vom Entwickler getroffen und wörtlich in 09-BASELINE.md protokolliert"
    verification: []
    human_judgment: true
    rationale: "Die Entscheidung selbst ist eine menschliche Wertentscheidung (Trade-off Testbarkeit vs. Verhaltensneutralität) — sie wurde bereits im Checkpoint eingeholt und ist hier nur noch als Fakt zu verifizieren, aber der Verifier soll den Wortlaut gegen die tatsächliche Entwickleraussage prüfen können, kein automatisierter Test kann das."

# Metrics
duration: 51min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 1: Editor-Regressionsnetz-Fundament & Baseline-Entscheidung Summary

**Bold-Tracer über die statische Wiki-Toolbar end-to-end abgesichert (Klick → exaktes Markup → Persistenz-Roundtrip), empirisches Markup-Inventar aller 21 execCommand-Call-Sites erhoben, und die teuerste Entscheidung der Phase — was „die Baseline" konkret ist — vom Entwickler getroffen und protokolliert (option-a: fehlende Editor-Konstanten werden in Plan 09-02 repariert, der reparierte Zustand wird eingefroren).**

## Performance

- **Duration:** 51 min (03:16 → 04:07 Uhr, über zwei Executor-Sessions mit einem blockierenden Decision-Checkpoint dazwischen)
- **Started:** 2026-07-25T03:16:01+02:00
- **Completed:** 2026-07-25T04:06:53+02:00
- **Tasks:** 3 (Tracer, Baseline-Erhebung, Entscheidungs-Checkpoint)
- **Files modified:** 2 (1 neu erstellt: Spec; 1 neu erstellt + 1× fortgeschrieben: BASELINE.md)

## Accomplishments

- Kompletter vertikaler Beweispfad für das Regressionsnetz steht: echter Toolbar-Klick auf `[data-action="format-text"][data-cmd="wiki-content"][data-editor="bold"]` → exakte `innerHTML`-Gleichheitsassertion → `saveWikiEntry()` → `sanitizeHTML()` → `localStorage` → `page.reload()` → erneutes Öffnen über `edit-wiki` → identische exakte Assertion. Zwei aufeinanderfolgende Läufe grün.
- Markup-Inventar aller 21 execCommand-Call-Sites empirisch erhoben (nicht aus Dokumentation geraten) — inklusive dreier bislang unbekannter Zusatzfunde: die komplette floating Toolbar ist per Mausklick aktuell unbedienbar (Fund 1), `setEditorFont()`/`setEditorFontSize()` haben einen zweiten, von `EDITOR_FONTS` unabhängigen Argument-Mismatch-Bug (Fund 2), und der Paste-Handler fügt Inhalte wegen doppelter Listener-Registrierung zweifach ein (Fund 3).
- Alle vier offenen Research-Annahmen A1–A4 haben jetzt Messwerte: A1 (Shift+Enter erzeugt identisches Markup wie abgefangenes Enter — Setup-Call ohne messbaren Effekt), A2 (0 UI-Treffer für `data-editor="font"`/`"heading"`/`"highlight"` in allen 12 Templates), A3 (`EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` beide `undefined`, floating Toolbar wird nie sichtbar), A4 (Strikethrough überlebt Speichern/Reload nicht, `sanitizeHTML` kennt `<s>` aber nicht `<strike>`).
- Entwickler hat die Baseline-Definition entschieden (option-a) und die A4-Teilentscheidung (einfrieren + Phase-10-Vormerkung); beides wortgetreu in `09-BASELINE.md` protokolliert, inklusive der Konsequenzen für die nachfolgenden Pläne.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tracer — Bold über die statische Wiki-Toolbar end-to-end absichern** - `08a358a` (test)
2. **Task 2: Empirisches Markup-Inventar aller 21 Call-Sites + A1–A4-Messung → 09-BASELINE.md** - `df11fb7` (docs)
3. **Task 3: Entscheidung — was ist „die Baseline"? (Checkpoint aufgelöst)** - `1b78d13` (docs)

**Plan metadata:** (nachfolgend, siehe finaler Commit)

_Note: Task 3 war ein `checkpoint:decision`-Gate; ein separater Executor-Agent hat den Checkpoint gestellt (Tasks 1–2), ein zweiter Executor-Agent hat die Entwicklerantwort nach Auflösung eingetragen und den Plan abgeschlossen (Task 3 + Wrap-up)._

## Files Created/Modified

- `tests/e2e/features/editor-formatting.spec.js` - Bold-Tracer über die statische Wiki-Toolbar (Klick → exaktes Markup → Speichern → Reload → exaktes Markup), zwei exakte `innerHTML`-Gleichheitsassertionen, kein `waitForTimeout`, kein maskierendes `isVisible()`-Muster
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` - Markup-Inventar aller 21 Call-Sites, A1–A4-Messwerte, drei Zusatzfunde, protokollierte Entwicklerentscheidung mit Konsequenzen für Pläne 09-02..09-05

## Decisions Made

- **Baseline-Definition (option-a):** `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` werden in Plan 09-02 wiederhergestellt (drei mechanische Teilschritte: Konstanten definieren, funktions-lokale `const … = window.…`-Zugriffe in `rich-text.js` entfernen, Argument-Mismatch in `system-actions.js:43–52` auflösen). Der reparierte Zustand — nicht der heutige defekte — gilt als eingefrorene Baseline für das D-04a-Doppel-Grün-Gate (09-05) und alle Migrations-Commits (09-06..09-09). Begründung: Beide Toolbar-Varianten müssen testbar sein, EDIT-02 muss belegbar sein; die Reparatur ist das Rückgängigmachen einer Fremd-Regression, kein neues Feature — dennoch eine bewusste, protokollierte Ausnahme zur Milestone-v1.1-Leitplanke „verhaltensneutral", weil Font-Picker und floating Toolbar dadurch erstmals sichtbar bedienbar werden.
- **A4-Teilentscheidung (Strikethrough-Persistenz):** Wird als vorbestehender Zustand eingefroren (kein Code-Fix in Phase 9), zusätzlich als Datenintegritäts-Fund für Phase 10 vorgemerkt.
- **Fund 3 (Doppel-Paste-Listener) bleibt unangetastet** in dieser Phase — außerhalb des in Task 3 vorgelegten Entscheidungsrahmens (nur die Konstanten- und Signatur-Bugs standen zur Entscheidung).

## Deviations from Plan

None — plan executed exactly as written. Die Entscheidung in Task 3 war explizit als Checkpoint geplant (keine Abweichung, sondern der vorgesehene Ablauf); die Antwort des Entwicklers wurde wortgetreu übernommen.

## Issues Encountered

Keine neuen Probleme in dieser Fortsetzungssession. Die drei in Task 2 gefundenen Zusatzbefunde (floating Toolbar unbedienbar, Font-Setter-Argument-Mismatch, Doppel-Paste) wurden bewusst NICHT repariert (Auftrag von Task 2: „jeder Fund wird als Fund dokumentiert und dem Entwickler zur Entscheidung vorgelegt") — Fund 1 und Fund 2 sind über die Baseline-Entscheidung jetzt der Umsetzung in Plan 09-02 zugewiesen, Fund 3 bleibt offen dokumentiert.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-02 kann jetzt starten: Es hat sowohl das Markup-Inventar (welche Assertions das Netz braucht) als auch die Baseline-Entscheidung (option-a) als konkreten Auftrag — inklusive der drei mechanischen Teilschritte zur Reparatur von `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS`.
- `09-BASELINE.md` ist referenzfähig für alle nachfolgenden Pläne (09-02 bis 09-09) — jede spätere Assertion und jeder Migrations-Commit wird gegen dieses Dokument geprüft.
- Kein Blocker für 09-02. Einziger offener Hinweis: Fund 3 (Doppel-Paste-Listener) und A4 (Strikethrough-Persistenz) sind für Phase 10 vorgemerkt, nicht für diese Phase — sollten in der Phase-9-Abschlussdokumentation nicht versehentlich als „behoben" erscheinen.

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
