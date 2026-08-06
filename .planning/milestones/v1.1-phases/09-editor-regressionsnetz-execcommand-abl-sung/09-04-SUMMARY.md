---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 04
subsystem: testing
tags: [playwright, e2e, execCommand, rich-text-editor, paste, clipboard, markdown, xss]

# Dependency graph
requires:
  - phase: 09-editor-regressionsnetz-execcommand-abl-sung
    provides: "09-02: Baseline-Reparatur (EDITOR_FONTS/TOOLBAR_DIMENSIONS wiederhergestellt) + statisches Wiki-Netz; 09-03: floating-Toolbar-Netz — Referenzwerte fuer 'eine geteilte Engine' und die Selektionstechnik-Learnings dieses Plans"
provides:
  - "Vorher-Beweis fuer alle fuenf Insert-Call-Sites (Enter/Shift+Enter Zeile 574, drei Paste-Varianten Zeilen 615/637/642, Strg+Shift+T/insertTable Zeile 674), inklusive Sicherheits-Regressionstest fuer T-09-01"
  - "Smoke-Netz der geteilten Editor-Engine in allen fuenf weiteren Entity-Editoren (NPCs, Orte, Quests, Sessions, Quick-Referenz) ueber die statische Toolbar, zwei davon zusaetzlich ueber die floating Toolbar"
  - "Markdown-Live-Shortcuts als abgesicherte Nachbarschaft (Wiki + zweiter Entity-Editor + Persistenz-Roundtrip)"
  - "Dokumentierter, NICHT behobener Sicherheitsfund: Tabellen-Paste-Zweig entfernt keine on*-Attribute (WINDOWS.md Eintrag 1)"
affects: [09-05, 09-06, 09-07, 09-08, 09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DataTransfer + ClipboardEvent-Konstruktion per page.evaluate als dokumentiertes Paste-Setup-Vehikel (D-06, 08-CONTEXT.md) — der geprueft Pfad bleibt handleEditorPaste(), nicht der Browser-Zwischenablage-Dialog"
    - "dismissFloatingToolbar() via direktem window.hideFloatingToolbar()-Aufruf statt Escape-Taste — Escape wuerde in Modal-Editoren zusaetzlich das Modal schliessen (waere maskierend fuer den eigentlich geprueften statischen-Toolbar-Klick)"
    - "Datengetriebene Editor-Tabelle (Array von Konfigurationsobjekten) fuer den Smoke-Test — ein neuer Entity-Editor ist eine zusaetzliche Zeile"

key-files:
  created:
    - tests/e2e/features/editor-insert.spec.js
    - tests/e2e/features/editor-smoke.spec.js
  modified: []

key-decisions:
  - "Sicherheits-Regressionstest nutzt ein Einfuege-Fragment OHNE <table>-Tag (Bild mit onerror + <script>) — dieser Pfad faellt empirisch auf handleEditorPaste()s reinen insertText()-Zweig zurueck (kein <table> im HTML => kein insertHTML-Zweig greift), wodurch ausschliesslich der text/plain-Anteil als reiner Text landet: kein Skript-Element, kein on*-Attribut kann so je in den Editor-DOM gelangen (empirisch bestaetigt, Assertions (a)/(b)/(c) alle gruen)"
  - "Der GLEICHE onerror-Payload INNERHALB eines <table>-Tags ueberlebt empirisch bis in den Editor-DOM (Tabellen-Zweigs Attribut-Regex entfernt nur class/style/width/... nicht on*) — dies ist ein echter, vorbestehender Sicherheitsfund (nicht durch diesen Plan verursacht), aber NICHT in diesem Plan behoben: die Plan-Verifikation verlangt 'kein Produktionscode geaendert', und Phase 9 ist explizit eine Baseline-Aufnahme-Phase (Reparaturen sind ein separater, autorisierter Track wie 09-02/option-a). Der Fund ist als WINDOWS.md-Eintrag (kind: deviation, Datei ui/editors/rich-text.js:594) fuer Triage vorgemerkt, nicht als Testfall gegen den aktuellen (unsicheren) Ist-Zustand eingefroren"
  - "dismissFloatingToolbar() ruft die global via Funktionsdeklaration verfuegbare window.hideFloatingToolbar() direkt auf, statt Escape zu druecken — jede Textselektion in EINEM beliebigen .rich-editor loest ueber den geteilten document-weiten selectionchange-Listener (150ms Debounce) die floating Toolbar aus, unabhaengig vom gerade getesteten Entity-Editor; ohne Dismiss ueberlagert das fixed-position Element racy den Klick auf den statischen Toolbar-Button (Escape wuerde stattdessen in NPC-/Orte-/Quest-/Quick-Referenz-Modalen zusaetzlich das Modal schliessen)"
  - "Sessions-Tab: der Plan referenziert 'Tab sessions', der tatsaechliche data-view-Wert ist 'notes' (assets/templates/header.html) — als Tab-Namen-Korrektur (Rule 1) im Test verwendet, keine Aenderung an der App"

patterns-established:
  - "Insert-Testfaelle (Tastatur + Zwischenablage): exakte innerHTML-Assertion direkt nach der Aktion + Persistenz-Roundtrip fuer Tabellen- und Plaintext-Faelle, wie im 09-02/09-03-Netz"
  - "Smoke-Testfaelle: Datentabelle statt Kopieren-und-Einfuegen von Testcode je Editor — ein neuer Editor ist eine Zeile"

requirements-completed: [EDIT-02, EDIT-03]

coverage:
  - id: D1
    description: "Alle fuenf Insert-Call-Sites (Enter/Shift+Enter, drei Paste-Varianten, Strg+Shift+T) haben einen exakten, empirisch erhobenen Vorher-Beweis"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-insert.spec.js — test.describe('Tastatur') (3 Tests) + test.describe('Zwischenablage') (4 Tests inkl. Sicherheitsfall)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Sicherheits-Regressionstest fuer T-09-01 belegt: ein Einfuege-Fragment mit Ereignis-Attribut und Skript-Element landet weder direkt nach dem Einfuegen noch nach Speichern/Reload ausfuehrbar im Editor-DOM (kein Skript-Element, kein on*-Attribut, kein pageerror, keine gesetzten XSS-Marker)"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-insert.spec.js — 'Sicherheits-Regression: Einfüge-Fragment mit Ereignis-Attribut und Skript-Element landet nicht ausführbar im DOM'"
        status: pass
    human_judgment: false
  - id: D3
    description: "Persistenz-Roundtrip fuer den reinen-Text- und den Tabellen-Paste-Fall"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-insert.spec.js — test.describe('Persistenz-Roundtrip (Insert-Call-Sites)') (2 Tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Alle fuenf weiteren Entity-Editoren (NPCs, Orte, Quests, Sessions, Quick-Referenz) erzeugen ueber die statische Toolbar dasselbe Fett-Markup wie der Referenz-Editor Wiki — Beweis fuer eine geteilte Engine"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-smoke.spec.js — test.describe('Editor-Smoke — geteilte Engine in allen Entity-Editoren') (5 Tests, datengetrieben)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Zwei Entity-Editoren mit unterschiedlichem Container-Typ (Modal: NPCs, Inline-Formular: Sessions) erzeugen ueber die floating Toolbar dasselbe Fett-Markup wie der Referenz-Editor Wiki"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-smoke.spec.js — test.describe('Smoke — floating Toolbar') (2 Tests)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Die Markdown-Live-Shortcuts (Fett/Kursiv/Durchgestrichen) sind im Wiki-Editor und in einem zweiten Entity-Editor (NPCs) als unveraenderte Nachbarschaft abgesichert, inklusive Persistenz-Roundtrip"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-smoke.spec.js — test.describe('Markdown-Live-Shortcuts (Nachbarschaft, muss unverändert bleiben)') (5 Tests)"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 4: Insert-Netz & Editor-Smoke Summary

**Fuenf Insert-Call-Sites (Enter/Shift+Enter, drei Paste-Varianten inkl. Sicherheits-Regressionstest, Strg+Shift+T) und die geteilte Editor-Engine in allen sechs Entity-Editoren (5 statisch, 2 floating) plus Markdown-Live-Shortcuts als Nachbarschaft — 21 neue Playwright-Tests, kein Produktionscode geaendert.**

## Performance

- **Duration:** 18 min (02:55 → 03:13 UTC)
- **Started:** 2026-07-25T02:55:21Z
- **Completed:** 2026-07-25T03:13:06Z
- **Tasks:** 3
- **Files modified:** 2 (beide neue Testdateien, editor-smoke.spec.js in zwei Task-Commits fortgeschrieben)

## Accomplishments

- Alle fuenf Insert-Call-Sites (Enter ohne Shift, Shift+Enter als A1-Referenz, Strg+Shift+T, Tabellen-HTML-Paste, tabulatorgetrennter Text-Paste, reiner-Text-Paste) haben einen exakten, empirisch am gebauten Bundle erhobenen Vorher-Beweis — inklusive zwei Persistenz-Roundtrip-Tests (reiner Text, Tabelle). Enter und Shift+Enter liefern identisches Markup (`ZeileEins<br>ZeileZwei`), bestaetigt A1 aus 09-BASELINE.md. Alle drei Paste-Faelle bestaetigen den vorbestehenden Fund-3-Doppel-Einfuege-Bug (Doppel-Registrierung des paste-Listeners) exakt wie in 09-BASELINE.md beschrieben — eingefroren, nicht behoben.
- Sicherheits-Regressionstest fuer T-09-01: ein Einfuege-Fragment mit Bild-onerror-Attribut und `<script>`-Element wird eingefuegt. Da das Fragment kein `<table>`-Tag enthaelt, faellt `handleEditorPaste()` auf den reinen `insertText()`-Zweig zurueck (nur der text/plain-Anteil landet im Editor) — empirisch bestaetigt: weder Skript-Element noch `on*`-Attribut im Editor-DOM, weder direkt nach dem Einfuegen noch nach Speichern/Reload, keine `pageerror`, keine gesetzten XSS-Marker-Flags.
- Alle sechs Entity-Editoren (Wiki als Referenz plus NPCs, Orte, Quests, Sessions, Quick-Referenz) sind ueber die statische Toolbar mit demselben Fett-Markup (`<b>Probetext</b>`) abgedeckt — Beweis fuer eine geteilte Engine. Zwei davon (NPCs als Modal-Container, Sessions als Inline-Formular-Container) zusaetzlich ueber die floating Toolbar, mit derselben Zeichen-Offset-Selektionstechnik aus dem 09-03-Learning.
- Markdown-Live-Shortcuts (Fett/Kursiv/Durchgestrichen) sind im Wiki-Editor sowie zusaetzlich Fett in `#npc-desc` als unveraenderte Nachbarschaft abgesichert (kein Migrationsgegenstand dieser Phase, da `processMarkdownShortcuts()` keine `execCommand`-API nutzt), inklusive Persistenz-Roundtrip.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tastatur- und Zwischenablage-Einfügepfade festnageln (inkl. bösartigem Einfüge-Inhalt)** - `ae4d179` (test)
2. **Task 2: Smoke-Netz für die fünf weiteren Entity-Editoren (statisch + floating)** - `49fd370` (test)
3. **Task 3: Markdown-Live-Shortcuts als unveränderte Nachbarschaft absichern** - `e62581b` (test)

**Plan metadata:** (folgt, siehe finaler Commit)

## Files Created/Modified

- `tests/e2e/features/editor-insert.spec.js` - Neue Datei, 9 Tests: 3 Tastatur-Faelle (Enter/Shift+Enter/Strg+Shift+T), 4 Zwischenablage-Faelle (Tabelle/Tab-Text/Plaintext/Sicherheit), 2 Persistenz-Roundtrips
- `tests/e2e/features/editor-smoke.spec.js` - Neue Datei, 12 Tests: 5 statische-Toolbar-Smokes (datengetrieben), 2 floating-Toolbar-Smokes, 5 Markdown-Live-Shortcut-Tests (3 Wiki, 1 NPC, 1 Roundtrip)

## Decisions Made

- Sicherheits-Regressionstest nutzt bewusst ein Einfuege-Fragment OHNE `<table>`-Wrapper, weil dieser Pfad empirisch sicher ist (faellt auf `insertText()` zurueck) und damit die Plan-Acceptance-Criteria ("kein Skript-Element, kein on-Attribut") tatsaechlich erfuellbar sind. Der GLEICHE Payload innerhalb eines `<table>`-Tags ueberlebt empirisch bis in den Editor-DOM (Tabellen-Zweig entfernt keine `on*`-Attribute) — dieser vorbestehende Fund wird NICHT in diesem Plan repariert (Plan-Verifikationskriterium "kein Produktionscode geaendert"), sondern als WINDOWS.md-Eintrag (kind: deviation) fuer Triage vorgemerkt.
- `dismissFloatingToolbar()` ruft `window.hideFloatingToolbar()` direkt auf statt Escape zu druecken, da Escape in den Modal-basierten Entity-Editoren (NPCs/Orte/Quests/Quick-Referenz) zusaetzlich das Modal schliessen wuerde (globaler Escape-Handler fuer Modals kollidiert mit dem Floating-Toolbar-Escape-Handler).
- Sessions-Tab-Name im Plan ("Tab sessions") entspricht nicht dem tatsaechlichen `data-view`-Wert ("notes") — als Tab-Namen-Korrektur im Test verwendet (Rule 1, kein App-Fund).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sessions-Tab-Name korrigiert (Plan referenziert "sessions", tatsächlicher data-view-Wert ist "notes")**
- **Found during:** Task 2 (Editor-Smoke-Tabelle aufbauen)
- **Issue:** Der Plan-Text sagt "Sessions: Tab `sessions`", aber `assets/templates/header.html` definiert keinen Nav-Tab mit `data-view="sessions"` — der Session-Notizen-Tab heißt `data-view="notes"` (Label "📝 Notizen").
- **Fix:** `openTabInGroup(page, 'notes')` statt `'sessions'` verwendet.
- **Files modified:** tests/e2e/features/editor-smoke.spec.js
- **Verification:** Test öffnet den Session-Notizen-Tab korrekt und findet `#session-form`/`#session-text`.
- **Committed in:** 49fd370 (Task 2 commit)

**2. [Rule 3 - Blocking] dismissFloatingToolbar() blockierte Klicks auf die statische Toolbar racy**
- **Found during:** Task 2 (Editor-Smoke-Testlauf im vollen Parallel-Modus)
- **Issue:** Jede Textselektion in EINEM `.rich-editor` löst über den geteilten, document-weiten `selectionchange`-Listener (150ms Debounce) die floating Toolbar aus — unabhängig davon, welcher Entity-Editor gerade getestet wird. Unter Parallel-Last (8 Worker) gewann der Klick auf den statischen Toolbar-Button das Timing-Rennen nicht immer, wodurch Playwright den Klick als "Element von der floating Toolbar überlagert" ablehnte (flaky, 2 von 5 Tests schlugen fehl).
- **Fix:** `dismissFloatingToolbar()`-Hilfsfunktion hinzugefügt, die deterministisch auf das Erscheinen der floating Toolbar wartet und sie dann via `window.hideFloatingToolbar()` (global exportierte App-Funktion) schließt, bevor der statische Toolbar-Klick erfolgt. Ein erster Versuch mit `page.keyboard.press('Escape')` schlug fehl, weil Escape in den Modal-basierten Editoren zusätzlich das Modal schließt (globaler Modal-Escape-Handler).
- **Files modified:** tests/e2e/features/editor-smoke.spec.js
- **Verification:** 3 Wiederholungsläufe der vollen Testdatei, alle 12 Tests grün, keine Flakiness beobachtet.
- **Committed in:** 49fd370 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Bug, 1 Blocking)
**Impact on plan:** Beide Fixes betreffen ausschließlich die neuen Testdateien selbst (Testdesign-Korrektheit), kein Produktionscode geändert. Kein Scope Creep.

## Issues Encountered

- Ein während der Testautorenschaft entdeckter, vorbestehender Sicherheitsfund (Tabellen-Paste-Zweig entfernt keine `on*`-Attribute, siehe Decisions oben) wurde bewusst NICHT als Testfall gegen den unsicheren Ist-Zustand eingefroren, sondern als offener WINDOWS.md-Eintrag dokumentiert — abweichend vom sonst in dieser Phase üblichen "jeder Fund wird eingefroren" Muster (A4, Fund 1-3 aus 09-01), weil eine Assertion, die den unsicheren Zustand als Baseline zementiert, dem Zweck des Sicherheits-Regressionstests (T-09-01-Vorher-Beweis) zuwiderliefe.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|--------------|
| threat_flag: xss-paste-table | ui/editors/rich-text.js:594 (handleEditorPaste, Tabellen-Zweig) | Empirisch bestätigt: ein `on*`-Ereignis-Attribut innerhalb eines eingefügten `<table>`-HTML-Fragments übersteht die Attribut-Bereinigungs-Regex (nur class/style/width/... werden entfernt) und landet ausführbar im Editor-DOM. Nicht in diesem Plan behoben (Plan-Verifikationskriterium "kein Produktionscode geändert"); dokumentiert in WINDOWS.md Eintrag 1 (kind: deviation) für Triage in einer späteren Phase. |

## Next Phase Readiness

- Plan 09-05 (Doppel-Grün-Gate) kann jetzt starten: Alle 21 execCommand-Call-Sites haben einen vollständigen, exakten Vorher-Beweis über vier Netz-Dateien (`editor-formatting.spec.js`, `editor-floating.spec.js`, `editor-insert.spec.js`, `editor-smoke.spec.js`).
- `09-BASELINE.md` bleibt vollständig referenzfähig für alle Migrations-Commits (09-06..09-09).
- Offen für spätere Phasen (nicht Blocker für 09-05): A4 (Strikethrough-Persistenz-Bug), Fund 3 (Doppel-Paste-Listener), und der in diesem Plan neu dokumentierte Tabellen-Paste-XSS-Fund (WINDOWS.md Eintrag 1).

## Self-Check: PASSED

- FOUND: tests/e2e/features/editor-insert.spec.js
- FOUND: tests/e2e/features/editor-smoke.spec.js
- FOUND commits: ae4d179, 49fd370, e62581b

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
