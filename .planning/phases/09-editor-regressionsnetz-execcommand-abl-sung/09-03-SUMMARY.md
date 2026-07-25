---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 03
subsystem: testing
tags: [playwright, e2e, execCommand, rich-text-editor, floating-toolbar, wiki, contenteditable]

# Dependency graph
requires:
  - phase: 09-editor-regressionsnetz-execcommand-abl-sung
    provides: "09-02: Baseline-Reparatur (EDITOR_FONTS/TOOLBAR_DIMENSIONS wiederhergestellt, Commit 19a355e) — die floating Toolbar ist ab hier per Mausklick bedienbar; vollständiges Netz der statischen Wiki-Toolbar als Referenzmuster"
provides:
  - "Vollständiges Regressionsnetz für die floating Toolbar: Sichtbarkeit, alle 8 Buttons (Markup-Assertion), 2 Toggle-Fälle, 1 Teilselektions-Fall, 3 Selects, 2 Highlight-Farbfelder, 1 Format-entfernen-Test, 4 Persistenz-Roundtrips, 4 UI-lose Zweige"
  - "Vorher-Beweis für alle 8 floating-Call-Sites, die in Plan 09-06/09-07 migriert werden (Zeilen 782/788/915/916), plus die 4 UI-losen Zweige aus Plan 09-06 (Zeilen 339/341/344/346)"
  - "Zählnachweis-Test verankert 21 execCommand-Vorkommen als Migrations-Anker für Plan 09-09"
affects: [09-04, 09-05, 09-06, 09-07, 09-08, 09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zeichen-Offset-Selektion auf dem Textknoten (nicht range.selectNodeContents(element)) für Toggle-Tests — sonst trifft applyFloatingFormat()s .parentElement.closest(tag)-Erkennung den Editor-Container statt das Format-Tag und nimmt fälschlich die Wrap- statt der Unwrap-Verzweigung (empirisch gefunden während der Testautorenschaft, kein App-Bug — reines Testdesign-Detail)"
    - "waitForFunction auf #floating-toolbar.visible statt waitForTimeout — respektiert den 150ms-selectionchange-Debounce ohne feste Wartezeit"
    - "Select-Aktionen (readAloud/font/fontSize) hängen an der gespeicherten floatingToolbarRange (nicht der Live-Selektion) — jeder Select-Testfall bekommt daher ein frisches Wiki-Formular mit genau einer Selektion vor dem selectOption()-Aufruf"

key-files:
  created:
    - tests/e2e/features/editor-floating.spec.js
  modified: []

key-decisions:
  - "Drei Task-Commits statt einem Gesamt-Commit trotz einer einzelnen neuen Datei — jeder Commit enthält den kumulativen Dateistand nach Abschluss des jeweiligen Tasks (Task 1: Sichtbarkeit+Buttons+Toggle+Teilselektion; Task 2: Selects+Farbfelder+Roundtrip; Task 3: UI-lose Zweige+Zählnachweis), jeweils grün verifiziert vor dem Commit"
  - "Table- und Link-Tests der floating Toolbar ersetzen die bestehende Selektion (insertHTML bzw. Wrap operieren auf der aktuell selektierten Textselektion) — anders als die statische Toolbar, wo Tabellen-Text nicht vorher selektiert wird; beides empirisch erhoben, nicht angeglichen"
  - "Partial-Selektions-Setup nutzt die statische Toolbar zum Vorformatieren von 'WortEins' (identisches <b>-Markup wie floating), nur der Teilselektions-Klick selbst läuft über die floating Toolbar — Setup-Weg ist funktional äquivalent, das eigentliche Prüfziel bleibt unverändert"
  - "highlight('none')-UI-lose-Test reproduziert exakt die 09-BASELINE.md-Messmethode (Zeile 344): mark-basiertes set-highlight-color der STATISCHEN Toolbar zuerst, dann direkter window.formatText()-Aufruf — nicht der eigene span-basierte 'highlight'-Zweig, da sonst ein anderes (nicht-Baseline-konformes) Markup gemessen würde"

patterns-established:
  - "Jede floating-Toolbar-Aktion: exakte innerHTML-Assertion direkt nach der Aktion + textContent-Erhaltungs-Check; Selects/Roundtrips zusätzlich mit Speichern/Reload-Zyklus"

requirements-completed: [EDIT-02, EDIT-03]

coverage:
  - id: D1
    description: "Sichtbarkeits-Basistest belegt die in Plan 09-02 umgesetzte Baseline-Reparatur: #floating-toolbar erhält nach Textselektion die Klasse visible, ohne Page-/Konsolenfehler"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-floating.spec.js — 'Basis: Textselektion bringt die floating Toolbar in den sichtbaren Zustand ohne Page-Error'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Alle 8 Bedienelemente der floating Toolbar (bold/italic/underline/strikethrough/list/border/table/link) haben eine exakte Markup-Assertion direkt nach der Aktion, inkl. dokumentierter bewusster Abweichungen ggü. der statischen Toolbar (Durchstreichen, Link)"
    requirement: "EDIT-03"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-floating.spec.js — test.describe('Editor-Regressionsnetz — Floating Toolbar (Wiki)') (9 Tests: Sichtbarkeit + 8 Buttons)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Toggle-Verhalten (Fett, Liste) und Teilselektion über eine Elementgrenze hinweg sind mit exakten Markup-Assertionen und Page-Error-freiem Verlauf abgedeckt"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-floating.spec.js — test.describe('Floating Toolbar — Toggle-Verhalten') + test.describe('Floating Toolbar — Teilselektion') (3 Tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Die vier in Plan 09-07 zu migrierenden floating-Call-Sites (Schriftart, Schriftgröße, Format entfernen ×2) haben einen exakten, roundtrip-geprüften Vorher-Beweis; Highlight-Farbfelder und Vorlese-Stil ebenfalls abgedeckt"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-floating.spec.js — test.describe('Selects und Farbfelder') (6 Tests) + test.describe('Persistenz-Roundtrip (floating)') (4 Tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Die vier UI-losen Zweige von formatText() (heading, font, highlight-Farbe, highlight-none) haben einen exakten Vorher-Beweis per direktem Funktionsaufruf, und die Zahl 21 (execCommand-Vorkommen) ist als Zählnachweis-Test verankert"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-floating.spec.js — test.describe('UI-lose Zweige (kein Toolbar-Pfad vorhanden)') (4 Tests) + test.describe('Inventar-Zählnachweis (bewusst änderbar in Plan 09-09)') (1 Test)"
        status: pass
    human_judgment: false

# Metrics
duration: 21min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 3: Floating-Toolbar-Regressionsnetz Summary

**27 neue Playwright-Tests für die floating Toolbar (Sichtbarkeit, 8 Buttons, Toggle, Teilselektion, 3 Selects, Highlight-Farbfelder, Format entfernen, 4 Persistenz-Roundtrips, 4 UI-lose Zweige, Zählnachweis-Anker 21 execCommand) — kein Produktionscode geändert.**

## Performance

- **Duration:** ~21 min (04:30 → 04:51 Uhr)
- **Started:** 2026-07-25T02:30:48Z
- **Completed:** 2026-07-25T02:51:44Z
- **Tasks:** 3
- **Files modified:** 1 (neue Testdatei, mehrfach fortgeschrieben)

## Accomplishments

- Sichtbarkeits-Basistest belegt die Baseline-Reparatur aus Plan 09-02 (`EDITOR_FONTS`/`TOOLBAR_DIMENSIONS`): `#floating-toolbar` wird nach Textselektion sichtbar, ohne Page-/Konsolenfehler. Alle 8 Bedienelemente (Fett, Kursiv, Unterstrichen, Durchgestrichen, Liste, Rahmen, Tabelle, Link) haben eine exakte `innerHTML`-Markup-Assertion, empirisch am gebauten Bundle erhoben. Zwei bewusst NICHT angeglichene Abweichungen zur statischen Toolbar sind im Testnamen benannt und mit Kommentar dokumentiert: Durchstreichen erzeugt `<s>` (statt `<strike>` der statischen Toolbar), Link setzt `target="_blank" rel="noopener noreferrer"` sofort beim Klick (statische Toolbar erst nach dem Speichern/Reload-Zyklus).
- Toggle-Verhalten (Fett, Liste) und ein Teilselektions-Testfall über eine Elementgrenze hinweg (09-RESEARCH.md Pitfall 6) sind mit exakten Markup-Assertionen abgedeckt. Für die Toggle-Fälle musste die Selektion exakt auf den Textknoten-Inhalt des Format-Tags gesetzt werden (Zeichen-Offsets, nicht `range.selectNodeContents(element)`) — sonst trifft die App-eigene Toggle-Erkennung (`.parentElement.closest(tag)`) den Editor-Container statt das Format-Tag und wrappt fälschlich doppelt statt zu entfernen (während der Testautorenschaft empirisch gefunden, reines Testdesign-Detail, kein App-Bug).
- Die vier in Plan 09-07 zu migrierenden floating-Call-Sites (Schriftart Zeile 782, Schriftgröße Zeile 788, Format-entfernen-Aktion Zeilen 915/916) haben einen exakten, roundtrip-geprüften Vorher-Beweis, ergänzt um Vorlese-Stil und beide Highlight-Farbfeld-Richtungen (setzen/entfernen). Vier Persistenz-Roundtrip-Tests (Fett, Schriftart, Schriftgröße, Highlight) dokumentieren die `sanitizeHTML()`-Style-Whitelist-Effekte (kein `border-radius`, kein trailing Semikolon nach dem Reload).
- Die vier UI-losen Zweige von `formatText()` (heading, font, highlight-Farbe, highlight-none — Zeilen 339/341/344/346, kein Template referenziert sie laut 09-BASELINE.md/A2-Grep) haben einen exakten Vorher-Beweis per direktem `window.formatText()`-Aufruf. Der `highlight('none')`-Testfall reproduziert exakt die 09-BASELINE.md-Messmethode (mark-basiertes `set-highlight-color` der statischen Toolbar zuerst, dann `formatText('highlight','none')`) und bestätigt: das `<mark>`-Element bleibt bestehen, nur `background-color` wird entfernt. Ein Zählnachweis-Test verankert exakt 21 `execCommand`-Vorkommen in `ui/editors/rich-text.js` als Migrations-Anker für Plan 09-09 — im Testnamen eindeutig als bewusst änderbar gekennzeichnet.

## Task Commits

Each task was committed atomically:

1. **Task 1: Sichtbarkeit + Inline-Formate, Liste, Rahmen, Tabelle, Link** - `e21e7b4` (test)
2. **Task 2: Selects, Farbfelder, Format entfernen + Persistenz-Roundtrip** - `b3d2c74` (test)
3. **Task 3: UI-lose Zweige + Zählnachweis 21 execCommand** - `c0f82f1` (test)

**Plan metadata:** (folgt, siehe finaler Commit)

## Files Created/Modified

- `tests/e2e/features/editor-floating.spec.js` - Neue Datei, 27 Tests: 9 Basis-Tests (Sichtbarkeit + 8 Buttons), 2 Toggle-Tests, 1 Teilselektions-Test, 6 Select-/Farbfeld-Tests, 4 Roundtrip-Tests, 4 UI-lose-Tests, 1 Zählnachweis-Test

## Decisions Made

- **Drei Task-Commits trotz einer Datei:** Jeder Commit enthält den kumulativen Dateistand nach Abschluss des jeweiligen Tasks, jeweils vor dem Commit grün gegen das gebaute Bundle verifiziert (Task-Commit-Protokoll erfüllt, ohne die Datei künstlich in drei separate Dateien zu zerlegen).
- **Tabelle/Link ersetzen die bestehende Selektion:** Anders als die statische Toolbar (Tabellen-Text wird nicht vorher selektiert) operiert die floating Toolbar bei bereits bestehender Textselektion — `insertHTML`/das Wrap-Verhalten wirken auf die aktuelle Selektion. Empirisch erhoben und exakt so getestet, nicht angeglichen.
- **Zeichen-Offset-Selektion statt `selectNodeContents(element)` für Toggle-Tests:** `range.selectNodeContents(el)` setzt den Range-Container auf das ELEMENT selbst (mit Kind-Index-Offsets) statt auf dessen Textknoten — dadurch trifft `applyFloatingFormat()`s `.parentElement.closest(tag)`-Prüfung den Editor-Container, nicht das Format-Tag, und nimmt die Wrap- statt der Unwrap-Verzweigung. Mit einer Zeichen-Offset-Range auf dem Textknoten funktioniert die Toggle-Erkennung wie vom echten Anwendungscode vorgesehen.

## Deviations from Plan

None — plan executed exactly as written. Alle drei Tasks liefen wie in `09-03-PLAN.md` spezifiziert (Sichtbarkeit+Buttons+Toggle+Teilselektion → Selects+Farbfelder+Roundtrip → UI-lose Zweige+Zählnachweis), keine Rule-1/2/3-Auto-Fixes und keine Architektur-Entscheidungen (Rule 4) waren nötig. Kein Produktionscode geändert (`git diff --name-only` gegen den 09-02-Abschluss-Commit listet ausschließlich `tests/e2e/features/editor-floating.spec.js`).

## Issues Encountered

- Beim ersten Entwurf der Toggle-Tests führte `editor.selectText()` (selektiert den GESAMTEN Editor-Inhalt via `selectNodeContents` auf dem Editor-Element) zu einem doppelten Wrap statt eines Toggle-Entfernens (`<b><b>Probetext</b></b>` statt `Probetext`), weil `range.commonAncestorContainer` dabei das Editor-Element selbst ist und die App-eigene `.closest(tag)`-Erkennung dadurch das Format-Tag verfehlt. Per temporärer Probe-Spec empirisch verifiziert und durch eine Zeichen-Offset-Selektion auf dem Textknoten des Format-Tags korrigiert (siehe `selectExactTextNodeRange`-Hilfsfunktion und Kommentar im Test). Reines Testdesign-Detail, kein App-Bug — die App verhält sich exakt wie ein Mensch es bei einer präzisen Wort-Selektion erwarten würde.
- Bei den Roundtrip-Proben fehlte anfänglich ein `hideWikiForm`-Klick zwischen zwei aufeinanderfolgenden `openFreshWikiForm`-Aufrufen nach einem Speichern/Reload/Wiedereröffnen-Zyklus, wodurch der noch offene Editier-Overlay den nächsten `showWikiForm`-Klick blockierte (Playwright-Timeout). Behoben durch expliziten `hideWikiForm`-Klick nach jedem Roundtrip-Testfall.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-04 kann jetzt starten: Beide Toolbar-Varianten (statisch aus 09-02, floating aus 09-03) haben ein vollständiges, exaktes Regressionsnetz. Alle 21 execCommand-Call-Sites (8 statische Formatgruppen + 4 UI-lose Zweige + 2 Setup-Calls ohne direkten Trigger + 3 Paste-Handler + 4 floating-spezifische) haben jetzt einen Vorher-Beweis über die beiden Wiki-Regressionsnetz-Dateien (`editor-formatting.spec.js` aus 09-02, `editor-floating.spec.js` aus diesem Plan).
- `09-BASELINE.md` bleibt vollständig referenzfähig für alle Migrations-Commits (09-06..09-09): Markup-Inventar (09-01) + umgesetzte Reparatur (09-02/Task 1) + statisches Netz (09-02) + floating Netz (09-03, dieser Plan).
- Kein Blocker für 09-04. Weiterhin offen (bewusst NICHT in dieser Phase behoben, für Phase 10 vorgemerkt): A4 (Strikethrough-Persistenz-Bug, betrifft nur die statische Toolbar) und Fund 3 (Doppel-Paste-Listener) aus 09-BASELINE.md.

## Self-Check: PASSED

- FOUND: `tests/e2e/features/editor-floating.spec.js`
- FOUND commits: `e21e7b4`, `b3d2c74`, `c0f82f1`

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
