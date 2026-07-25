---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 02
subsystem: testing
tags: [playwright, e2e, execCommand, rich-text-editor, wiki, contenteditable, constants]

# Dependency graph
requires:
  - phase: 09-editor-regressionsnetz-execcommand-abl-sung
    provides: "09-01: Bold-Tracer, empirisches Markup-Inventar der 21 execCommand-Call-Sites, protokollierte Baseline-Entscheidung (option-a)"
provides:
  - "Umgesetzte Baseline-Entscheidung: EDITOR_FONTS/TOOLBAR_DIMENSIONS in core/constants.js wiederhergestellt, Argument-Mismatch in setEditorFont()/setEditorFontSize() behoben — statischer Font-Picker UND floating Toolbar sind ab hier bedienbar"
  - "Vollständiges Regressionsnetz für die statische Wiki-Toolbar: 13 Formatgruppen mit exakter Markup-Assertion + 14 Persistenz-Roundtrip-Tests"
  - "Vier Randfall-Klassen abgedeckt: Adjazenz, Leer/Einzelelement, Kodierung, Ordnung"
  - "Beweisfreier Formatierungsblock in wiki.spec.js entfernt — eine Quelle der Wahrheit für Editor-Formatierung"
affects: [09-03, 09-04, 09-05, 09-06, 09-07, 09-08, 09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zwei-Aufrufer-Signatur (String-Wert ODER <select>-Element) in setEditorFont()/setEditorFontSize() statt starrer Element-only-Signatur"
    - "Direkter window.*-Zugriff an Verwendungsstellen statt funktions-lokaler const-Bindung (Build-Dedup-Pass-Konflikt vermeiden, CLAUDE.md 'Duplicate Declaration Debugging Pattern')"
    - "Temporäre Probe-Spec zur empirischen Erhebung von Formatgruppen-Markup, danach gelöscht — Wissensartefakt ist 09-BASELINE.md, nicht der Probe-Code (Fortsetzung des 09-01-Musters)"

key-files:
  created: []
  modified:
    - core/constants.js
    - ui/editors/rich-text.js
    - tests/e2e/features/editor-formatting.spec.js
    - tests/e2e/features/wiki.spec.js
    - .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md

key-decisions:
  - "EDITOR_FONTS/TOOLBAR_DIMENSIONS als Font-Family-Stacks bzw. Positionierungs-Maße in core/constants.js definiert, in UI_CONSTANTS + Legacy-window.*-Export aufgenommen (bestehendes Muster, kein neuer Export-Mechanismus)"
  - "setEditorFont()/setEditorFontSize() akzeptieren jetzt sowohl ein <select>-Element als auch einen reinen String-Wert als zweites Argument (Typprüfung), statt die Aufrufer in system-actions.js umzubauen"
  - "Highlight-/Read-Aloud-/Clear-Formatting-Entfernen-Fälle bekommen jeweils einen eigenen Roundtrip-Test (nicht nur den Set-Fall) — auch das Entfernen muss persistieren"
  - "wiki.spec.js-Formatierungsblock ersatzlos entfernt (nicht umgeschrieben) — vollständige Abdeckung lebt jetzt exklusiv in editor-formatting.spec.js"

patterns-established:
  - "Jede Formatgruppe: Markup-Assertion direkt nach Aktion (exakte innerHTML-Gleichheit) + separater Persistenz-Roundtrip-Test + Inhaltserhalt-Check (textContent enthält Testtext)"

requirements-completed: [EDIT-02, EDIT-03]

coverage:
  - id: D1
    description: "Baseline-Entscheidung (option-a) im Code umgesetzt: EDITOR_FONTS/TOOLBAR_DIMENSIONS wiederhergestellt, Argument-Mismatch in setEditorFont()/setEditorFontSize() behoben — Font-Picker und floating Toolbar erstmals bedienbar"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-formatting.spec.js — 'Schriftart (Serif) — kein Fallback auf Arial' + Smoke-Check (floating toolbar sichtbar, keine Konsolenfehler)"
        status: pass
      - kind: unit
        ref: "npx jest — 457/457 grün (keine Regression durch den Konstanten-Eingriff)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Alle 13 Formatgruppen der statischen Wiki-Toolbar haben eine exakte Markup-Assertion direkt nach der Aktion"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-formatting.spec.js — test.describe('Markup direkt nach Aktion') (13 Tests, alle toHaveJSProperty-Exaktvergleiche)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Alle Formatgruppen haben zusätzlich eine Persistenz-Roundtrip-Assertion (speichern, Reload, wiedereröffnen, erneut exakt prüfen)"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-formatting.spec.js — test.describe('Persistenz-Roundtrip') (14 Tests, per -g \"Roundtrip\" selektierbar)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Vier Randfall-Klassen (Adjazenz, Leer/Einzelelement, Kodierung, Ordnung) sind abgedeckt und in 09-BASELINE.md protokolliert"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-formatting.spec.js — test.describe('Randfälle') (4 Tests, per -g \"Randfälle\" selektierbar)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Der beweisfreie Formatierungsblock in wiki.spec.js existiert nicht mehr — kein Test bleibt zurück, der ohne Assertion grün wird"
    verification:
      - kind: other
        ref: "node -e Regex-Check (keine 'Wiki Editor Formatierung'-Phrase mehr im Datei-Body) — Teil des Task-3-<verify>-Blocks"
        status: pass
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/wiki.spec.js — 11/11 grün (unveränderte Tests, Formatierungsblock entfernt)"
        status: pass
    human_judgment: false

# Metrics
duration: 21min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 2: Baseline-Reparatur & vollständiges Formatgruppen-Netz Summary

**EDITOR_FONTS/TOOLBAR_DIMENSIONS wiederhergestellt und der Font-Setter-Argument-Mismatch behoben (Baseline-Entscheidung option-a umgesetzt), darauf aufbauend 27 neue Playwright-Tests für alle 13 Formatgruppen der statischen Wiki-Toolbar (Markup + Roundtrip) plus 4 Randfall-Tests, und der beweisfreie Formatierungsblock aus wiki.spec.js entfernt.**

## Performance

- **Duration:** 21 min (04:07 → 04:28 Uhr)
- **Started:** 2026-07-25T04:06:53+02:00
- **Completed:** 2026-07-25T04:27:34+02:00
- **Tasks:** 3
- **Files modified:** 5 (2 Produktionscode, 2 Testdateien, 1 Baseline-Doku, jeweils mehrfach fortgeschrieben)

## Accomplishments

- Baseline-Entscheidung aus 09-01/Task 3 (option-a) vollständig im Code umgesetzt: `EDITOR_FONTS` (7 Font-Family-Stacks) und `TOOLBAR_DIMENSIONS` in `core/constants.js` definiert und über `UI_CONSTANTS` + Legacy-`window.*` exportiert; die vier funktions-lokalen `const … = window.…`-Zuweisungen in `ui/editors/rich-text.js` entfernt und durch direkten `window.*`-Zugriff ersetzt (Build-Dedup-Pass-Konflikt vermieden); der Argument-Mismatch in `setEditorFont()`/`setEditorFontSize()` behoben (beide akzeptieren jetzt String-Wert ODER `<select>`-Element). Smoke-verifiziert: floating Toolbar wird nach Textselektion sichtbar, Serif-Auswahl liefert die Georgia-Familie statt des stillen Arial-Fallbacks, keine Konsolenfehler.
- Vollständiges Netz für die statische Wiki-Toolbar: 13 Formatgruppen (Kursiv, Unterstrichen, Durchgestrichen, Liste, Schriftart, Schriftgröße, Highlight setzen/entfernen, Vorlese-Stil setzen/Toggle-Entfernen, Rahmen, Tabelle, Formatierung entfernen, Link) mit exakter `innerHTML`-Markup-Assertion direkt nach der Aktion, plus 14 separate Persistenz-Roundtrip-Tests (speichern → Reload → wiedereröffnen → erneut exakt prüfen). Alle Erwartungswerte empirisch am gebauten Bundle erhoben (temporäre Probe-Specs, danach gelöscht), inklusive dokumentierter `sanitizeHTML()`-Style-Whitelist-Effekte (z.B. `border-radius`/`display` fallen beim Roundtrip weg).
- Vier Randfall-Klassen abgedeckt und in `09-BASELINE.md` protokolliert: Adjazenz (zwei benachbarte Wörter nacheinander fett formatiert bleiben getrennte `<b>`-Tags, kein Zusammenführen), Leer/Einzelelement (leerer Editor, kollabierter Cursor, Ein-Zeichen-Selektion — alle ohne Page-/Konsolenfehler), Kodierung (Umlaute + Emoji überstehen Fett + Schriftgröße + Reload zeichengleich), Ordnung (zwei identische Aktionsläufe liefern byte-gleiches `innerHTML`).
- Der bisherige, beweisfreie `test.describe('Wiki Editor Formatierung')`-Block in `wiki.spec.js` (drei Tests, die per `if (await btn.isVisible())` klickten und danach nichts prüften) ist ersatzlos entfernt — die vollständige, hart geprüfte Abdeckung lebt jetzt ausschließlich in `editor-formatting.spec.js`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Baseline-Entscheidung umsetzen** - `19a355e` (fix) + `8dcfa94` (docs, Baseline-Vermerk mit Commit-Referenz)
2. **Task 2: Netz aller Formatgruppen (Markup + Roundtrip)** - `f587ef1` (test)
3. **Task 3: Randfälle + Ablösung des wiki.spec.js-Blocks** - `c322c01` (test)

**Plan metadata:** (folgt, siehe finaler Commit)

## Files Created/Modified

- `core/constants.js` - `EDITOR_FONTS` (7 Font-Family-Stacks je Select-Option-Wert) und `TOOLBAR_DIMENSIONS` (Positionierungs-Maße der floating Toolbar) neu definiert, in `UI_CONSTANTS` + Legacy-`window.*`-Export aufgenommen
- `ui/editors/rich-text.js` - vier funktions-lokale `const EDITOR_FONTS/TOOLBAR_DIMENSIONS = window.…`-Zuweisungen entfernt (Build-Dedup-Pass-Konflikt), direkter `window.*`-Zugriff an den drei Verwendungsstellen; `setEditorFont()`/`setEditorFontSize()` akzeptieren jetzt String-Wert oder `<select>`-Element; Guard in `handleSelectionChange()` bei fehlendem `TOOLBAR_DIMENSIONS`
- `tests/e2e/features/editor-formatting.spec.js` - 27 neue Tests: 13 Markup-Assertionen je Formatgruppe, 14 Persistenz-Roundtrip-Tests, 4 Randfall-Tests (Adjazenz/Leer/Kodierung/Ordnung); Gesamtdatei jetzt 32 Tests (inkl. Bold-Tracer aus 09-01)
- `tests/e2e/features/wiki.spec.js` - beweisfreier `Wiki Editor Formatierung`-Block ersatzlos entfernt, Kommentar-Hinweis auf `editor-formatting.spec.js` als alleinige Quelle
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` - Baseline-Entscheidung als "entschieden + umgesetzt" mit Commit-Referenz vermerkt; neuer Abschnitt "Randfälle … — empirisch erhoben" mit allen vier Randfall-Klassen

## Decisions Made

- **EDITOR_FONTS/TOOLBAR_DIMENSIONS-Design:** Font-Family-Stacks orientiert an den bereits lokal gebündelten Web-Fonts (`assets/styles/fonts.css` — Roboto/Inter/Poppins/Source Sans Pro) plus System-Fonts (Arial/Serif/Mono); `TOOLBAR_DIMENSIONS` als geschätzte Pixel-Maße für die Positionsberechnung (die floating Toolbar hat kein festes CSS-Width/Height, nutzt Flex-Layout).
- **Zwei-Aufrufer-Signatur statt Aufrufer-Umbau:** `setEditorFont()`/`setEditorFontSize()` prüfen jetzt den Typ des zweiten Arguments (String vs. `<select>`-Element) statt `ui/actions/system-actions.js` umzubauen — minimalinvasiv, beide bestehenden Aufrufpfade (statische Toolbar über system-actions.js, floating Toolbar über den direkten change-Handler) funktionieren unverändert.
- **Highlight-/Read-Aloud-Entfernen bekommen eigene Roundtrip-Tests:** Nicht nur das Setzen einer Formatierung muss persistieren, sondern auch das Entfernen — beide Fälle sind jetzt gegen echten Speichern/Reload-Zyklus geprüft (nicht nur der direkte DOM-Zustand vor dem Speichern).
- **wiki.spec.js-Block entfernt statt umgeschrieben:** Vermeidet zwei Quellen der Wahrheit für dieselbe Funktionalität; alle Assertionen, die der alte Block hätte haben können, sind jetzt in `editor-formatting.spec.js` vorhanden (Bold, Vorlese-Stil, Tabelle sind dort mit harten Assertionen abgedeckt).

## Deviations from Plan

None — plan executed exactly as written. Alle drei Tasks liefen wie in `09-02-PLAN.md` spezifiziert (Baseline-Entscheidung option-a umsetzen → Netz bauen → Randfälle + Altlast entfernen), keine Rule-1/2/3-Auto-Fixes und keine Architektur-Entscheidungen (Rule 4) waren nötig.

## Issues Encountered

- Ein erster Kommentar in `ui/editors/rich-text.js` enthielt zufällig die exakte Zeichenkette `const TOOLBAR_DIMENSIONS = window.TOOLBAR_DIMENSIONS` (als Erklärung, warum diese Zuweisung NICHT mehr existiert) — der Acceptance-Criteria-Regex aus Task 1 hätte das fälschlich als verbliebene lokale Deklaration gewertet. Kommentartext umformuliert, um die exakte Zeichenkette zu vermeiden; kein funktionaler Effekt, reine Test-Robustheit.
- Chromiums `execCommand('insertHTML')`-Sanitizer normalisiert eingefügte `style`-Attribute unerwartet (das `background`-Shorthand in `insertTable()`s Tabellenkopfzellen wird zu acht leeren `background-*`-Langhand-Properties expandiert, `padding`/`color` fallen komplett weg) — empirisch erhoben statt geraten und als exakter Erwartungswert in den Tabellen-Test übernommen (kein Bugfix, reine Dokumentation des Ist-Zustands gemäß D-02).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-03 kann jetzt starten: Die Baseline ist umgesetzt und eingefroren, das Netz für die statische Wiki-Toolbar ist vollständig (13 Formatgruppen + 4 Randfälle + Roundtrips). Plan 09-03 kann sich auf die floating Toolbar und weitere Editor-Instanzen konzentrieren, ohne die Grundlagenarbeit an `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` zu wiederholen.
- `09-BASELINE.md` ist jetzt vollständig referenzfähig für alle Migrations-Commits (09-06..09-09): Markup-Inventar (09-01) + umgesetzte Reparatur (09-02/Task 1) + Randfall-Werte (09-02/Task 3).
- Kein Blocker für 09-03. Weiterhin offen (bewusst NICHT in dieser Phase behoben, für Phase 10 vorgemerkt): A4 (Strikethrough-Persistenz-Bug) und Fund 3 (Doppel-Paste-Listener) aus 09-BASELINE.md.

## Self-Check: PASSED

- FOUND: `core/constants.js`, `ui/editors/rich-text.js`, `tests/e2e/features/editor-formatting.spec.js`, `tests/e2e/features/wiki.spec.js`, `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md`
- FOUND commits: `19a355e`, `8dcfa94`, `f587ef1`, `c322c01`

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
