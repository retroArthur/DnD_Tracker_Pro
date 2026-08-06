---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 06
subsystem: testing
tags: [rich-text-editor, execCommand, selection-range-api, playwright, regression-net]

# Dependency graph
requires:
  - phase: 09-editor-regressionsnetz-execcommand-abl-sung
    provides: "09-05 D-04a Doppel-Grün-Beweisgate + Netz-Freeze — Voraussetzung für den Beginn jeder Migrationsgruppe"
provides:
  - "Alle neun execCommand-Aufrufe innerhalb von formatText() sind auf Selection/Range-DOM-Operationen umgestellt (bold, italic, underline, strikethrough, list, heading, font, highlight-setzen, highlight-entfernen)"
  - "Fünf neue modul-interne Hilfsfunktionen: wrapRangeWithElement, unwrapEditorElement, applyInlineFormat, toggleUnorderedListAtSelection, clearInlineFormattingAtSelection, plus closestEditorAncestor (Bugfix-Helfer)"
  - "Gesamtstand deprecated Editier-Kommando-API im Modul: 21 → 12"
affects: [09-07, 09-08, 09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Selection/Range-Toggle-Erkennung robust gegen beide Selektionsformen (Zeichen-Offset auf Textknoten UND range.selectNodeContents(element)) — closestEditorAncestor() prüft explizit den nodeType des commonAncestorContainer, bevor .closest() aufgerufen wird"
    - "removeFormat-Reproduktion ohne die alte API: clearInlineFormattingAtSelection() entfernt gezielt nur background-color/color aus Style-Attributen innerhalb der Selektion, ohne das umschließende Element zu entpacken — repliziert die empirisch dokumentierte Eigenheit der alten API (09-BASELINE.md Zeile 344)"

key-files:
  created: []
  modified:
    - ui/editors/rich-text.js
    - tests/e2e/features/editor-floating.spec.js
    - .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md

key-decisions:
  - "closestEditorAncestor() als zusätzlicher Hilfsfunktion (nicht im Plan namentlich vorgesehen) eingeführt, um einen latenten Bug im applyFloatingFormat-Vorbild zu vermeiden — siehe Deviations"
  - "Netz-Freeze-Ausnahme (Zählnachweis-Test) zweimal in diesem Plan angepasst (21→16 nach Gruppe A, 16→12 nach Gruppe B) statt nur beim finalen Sprung in Plan 09-09 — siehe Deviations"

requirements-completed: [EDIT-01]

coverage:
  - id: D1
    description: "Migrationsgruppe A: bold/italic/underline/strikethrough/list in formatText() ersetzen die alte Editier-Kommando-API durch Selection/Range-Operationen, byte-gleiches Markup zur Baseline, Toggle-Semantik erhalten"
    requirement: "EDIT-01"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js (80 passed nach Gruppe A)"
        status: pass
      - kind: unit
        ref: "npx jest (457 passed nach Gruppe A)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Migrationsgruppe B: heading/font/highlight-setzen/highlight-entfernen (UI-lose Zweige) in formatText() ersetzen die alte API, byte-gleiches Ergebnis zum Vorher-Beweis aus Plan 09-03; formatText() enthält danach keinen Aufruf der alten API mehr"
    requirement: "EDIT-01"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js (80 passed nach Gruppe B)"
        status: pass
      - kind: unit
        ref: "npx jest (457 passed nach Gruppe B)"
        status: pass
      - kind: other
        ref: "node -e Zählskripte aus PLAN.md acceptance_criteria (formatText-Scope 0 Aufrufe, Modul-Gesamtstand 12, 3 externe Call-Sites unangetastet, clearInlineFormattingAtSelection genau 1 Definition)"
        status: pass
    human_judgment: false

# Metrics
duration: 45min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 6: formatText() Migrationsstufe 1 (Gruppe A+B) Summary

**Alle neun execCommand-Aufrufe in formatText() (bold/italic/underline/strikethrough/list/heading/font/highlight×2) sind auf Selection/Range-DOM-Operationen umgestellt — Modul-Gesamtstand 21 → 12, komplettes Regressionsnetz (80 Tests) und volle Jest-Suite (457 Tests) nach jeder der zwei Migrationsgruppen grün.**

## Performance

- **Duration:** 45 min
- **Tasks:** 2
- **Files modified:** 3 (ui/editors/rich-text.js, tests/e2e/features/editor-floating.spec.js, 09-BASELINE.md)

## Accomplishments

- Gruppe A (Task 1): Die fünf über die statische Toolbar erreichbaren Inline-/Listen-Call-Sites (bold, italic, underline, strikethrough, list) sind auf Selection/Range umgestellt. Neue Hilfsfunktionen `wrapRangeWithElement`, `unwrapEditorElement`, `applyInlineFormat`, `toggleUnorderedListAtSelection`. Byte-gleiches Markup zur 09-BASELINE.md-Referenz, Toggle-Semantik und Teilselektions-Rückfallpfad erhalten.
- Gruppe B (Task 2): Die vier UI-losen Zweige (heading, font, highlight-setzen, highlight-entfernen) sind funktionserhaltend migriert, obwohl über kein Template in der App erreichbar (09-BASELINE.md A2). Neue Hilfsfunktion `clearInlineFormattingAtSelection` repliziert exakt die empirisch dokumentierte Eigenheit der alten `removeFormat`-Semantik (nur `background-color`/`color` werden entfernt, das umschließende `<mark>`-Element bleibt bestehen).
- `formatText()` enthält nach diesem Plan keinen einzigen Aufruf der deprecated Editier-Kommando-API mehr (0 von zuvor 9). Modul-Gesamtstand: 21 → 12.
- Bugfix während Task 1: neue Hilfsfunktion `closestEditorAncestor()` korrigiert einen latenten Fehler im `applyFloatingFormat`-Vorbild bei element-basierter Selektion (`range.selectNodeContents(element)`) — siehe Deviations.
- Regressionsnetz (4 Spec-Dateien, 80 Tests) und volle Jest-Suite (457 Tests) liefen nach JEDER der beiden Gruppen grün; `npm run build:dev` beendete beide Male mit Exit-Code 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Gruppe A — Inline-Formate und Liste** - `413222e` (feat)
2. **Task 2: Gruppe B — UI-lose Zweige (heading/font/highlight)** - `dbdaac1` (feat)

**Plan metadata:** (folgt, siehe finaler Commit)

## Files Created/Modified

- `ui/editors/rich-text.js` - `formatText()` vollständig auf Selection/Range umgestellt; sechs neue modul-interne Hilfsfunktionen (`wrapRangeWithElement`, `unwrapEditorElement`, `applyInlineFormat`, `toggleUnorderedListAtSelection`, `closestEditorAncestor`, `clearInlineFormattingAtSelection`)
- `tests/e2e/features/editor-floating.spec.js` - Zählnachweis-Test zweimal aktualisiert (21→16 nach Gruppe A, 16→12 nach Gruppe B) — die einzige im Netz-Freeze vorab autorisierte Ausnahme
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` - Zwei Ausnahme-Änderungs-Einträge im Abschnitt „Verfahren bei rotem Netz-Test" dokumentiert (Migrationsgruppe, alter/neuer Erwartungswert, Begründung, Commit-Referenz)

## Decisions Made

- `closestEditorAncestor()` wurde als zusätzliche, im Plan nicht namentlich vorgesehene Hilfsfunktion eingeführt (Deviation, siehe unten) — notwendig, damit die Toggle-Erkennung auch bei element-basierter Selektion korrekt funktioniert.
- Die Netz-Freeze-Ausnahme für den Zählnachweis-Test wurde zweimal statt nur einmal (final in Plan 09-09) angewandt, weil dieser Plan (wie 09-07/08) sein eigenes Hard-Gate über das komplette Netz fährt und der Test sonst dauerhaft rot bliebe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Toggle-Erkennung schlägt bei element-basierter Selektion fehl (`range.selectNodeContents(element)`)**
- **Found during:** Task 1, Verifikationslauf des Netzes (Randfall „Adjazenz" in `editor-formatting.spec.js`)
- **Issue:** `applyInlineFormat()` übernahm das Erkennungsmuster `range.commonAncestorContainer.parentElement?.closest(tag)` unverändert aus `applyFloatingFormat()`. Wird die Selektion per `range.selectNodeContents(element)` gesetzt (statt per Zeichen-Offset auf einem Textknoten), ist der `commonAncestorContainer` bereits das Element selbst — ein zusätzliches `.parentElement` sprang eine Ebene zu weit nach oben (zum Editor-Container) und verfehlte die Toggle-Erkennung. Ergebnis: `<b><b>WortEins</b></b> <b>WortZwei</b>` statt der erwarteten Entfernung (`WortEins <b>WortZwei</b>`). Dieselbe Schwäche existiert bereits latent in `applyFloatingFormat()`, wird dort aber durch bewusst textknoten-basierte Testselektionen (siehe STATE.md-Entscheidung zu Plan 09-03) nie ausgelöst.
- **Fix:** Neue Hilfsfunktion `closestEditorAncestor(container, selector)` geprüft explizit den `nodeType` des `commonAncestorContainer`: Text-Knoten → `.parentElement.closest()`, Element-Knoten → `.closest()` direkt am Element. Von `applyInlineFormat` UND `toggleUnorderedListAtSelection` genutzt.
- **Files modified:** ui/editors/rich-text.js
- **Verification:** Randfall-Test „Adjazenz" grün (`WortEins <b>WortZwei</b>` nach Toggle), komplettes Netz (80/80) weiterhin grün.
- **Committed in:** 413222e (Task 1)

**2. [Rule 3 - Blocking] Netz-Freeze-Ausnahme (Zählnachweis-Test) musste zweimal statt nur einmal in Plan 09-09 angewandt werden**
- **Found during:** Task 1 und Task 2, jeweils beim Ausführen des `<verify>`-Blocks
- **Issue:** 09-BASELINE.md benennt den Zählnachweis-Test (`editor-floating.spec.js:577`) als die EINZIGE im gesamten Netz zulässige Änderung während der Migration, beschreibt aber nur den finalen Sprung `21 → 0` in Plan 09-09. Da JEDER Zwischenplan (09-06/07/08) sein eigenes Hard-Gate über das komplette Netz inklusive dieser Datei fährt, bliebe der Test bei unverändertem Erwartungswert `21` nach der ersten migrierten Call-Site dauerhaft rot — ein Widerspruch zum Plan-eigenen Akzeptanzkriterium „komplettes Netz grün". Zusätzlich widerspricht dies wörtlich der `<verification>`-Zeile dieses Plans („git diff --name-only listet nur ui/editors/rich-text.js"), die die bereits im Netz-Freeze dokumentierte Ausnahme nicht mitgedacht hat.
- **Fix:** Zählnachweis-Test in zwei Schritten aktualisiert: `toBe(21)` → `toBe(16)` (nach Gruppe A, Task 1) → `toBe(12)` (nach Gruppe B, Task 2). Beide Änderungen sind in 09-BASELINE.md nach dem dort vorgeschriebenen Verfahren dokumentiert (Migrationsgruppe, alter/neuer Erwartungswert, Begründung, Commit-Referenz — Abschnitt „Verfahren bei rotem Netz-Test während der Migration"). Keine andere Netz-Assertion wurde verändert; `git diff` bestätigt, dass ausschließlich dieser eine Testblock in der Datei angepasst wurde.
- **Files modified:** tests/e2e/features/editor-floating.spec.js, .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
- **Verification:** Beide Male komplettes Netz (80/80) grün nach der Anpassung; `git diff` der Testdatei zeigt ausschließlich Änderungen am Zählnachweis-Testblock (Kommentar + `toBe`-Wert), keine andere Assertion berührt.
- **Committed in:** 413222e (Task 1, 21→16), dbdaac1 (Task 2, 16→12)
- **Hinweis für Folgepläne:** Plan 09-07 und 09-08 werden voraussichtlich dieselbe Anpassung für ihre jeweiligen Migrationsgruppen benötigen (Zählstand weiter dekrementieren), bevor Plan 09-09 den Endwert `0` setzt.

### Informationeller Hinweis (kein Fix nötig)

**3. Acceptance-Kriterium „keine neue funktions-lokale `const X = window.X`" — literaler Grep-Check ist überbreit**
- Das im PLAN.md angegebene `node -e`-Skript (`/^\s+const\s+\w+\s*=\s*window\./`) erfasst auch harmlose, im gesamten Modul bereits vorbestehende Muster wie `const selection = window.getSelection();` (25+ Vorkommen bereits vor diesem Plan, u. a. in `applyFloatingFormat`, `handleSelectionChange`, `removeSelectionBorders`). Der eigentliche CLAUDE.md-Anti-Pattern (Aliasing eines global mit `const`/`let` deklarierten Bezeichners innerhalb einer Funktion, das beim Build-Dedup-Pass kollidiert) wurde durch diesen Plan NICHT neu eingeführt — verifiziert durch manuellen Vergleich der neu hinzugefügten Zeilen gegen die Menge bereits vorbestehender Top-Level-`const`/`let`-Deklarationen im Modul. Keine Korrektur an vorbestehendem, planfremdem Code vorgenommen (Scope Boundary).

---

**Total deviations:** 2 auto-fixed (1 Bug, 1 Blocking/Prozess), 1 informationeller Hinweis ohne Fix
**Impact on plan:** Beide Fixes waren notwendig, um die Plan-eigenen Hard-Gates (komplettes Netz grün, Toggle-Semantik erhalten) zu erfüllen. Kein Scope Creep — beide Änderungen bleiben innerhalb der bereits im Netz-Freeze vorab autorisierten Grenzen (Zählnachweis-Test) bzw. beheben einen Bug in genau dem Code, den dieser Plan selbst geschrieben hat.

## Issues Encountered

None über die dokumentierten Deviations hinaus.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None. Die im Plan vorab identifizierten Bedrohungen (T-09-02, T-09-15) sind durch die Implementierung mitigiert: `applyInlineFormat`/`clearInlineFormattingAtSelection` erzeugen ausschließlich Elementtypen (`b`, `i`, `u`, `strike`, `ul`/`li`, `h4`, `font`, `span`) und Style-Eigenschaften (`background-color`, `color`), die bereits vor diesem Plan im Editor verwendet und von der bestehenden Whitelist erfasst werden — keine neue Persistenz-Oberfläche.

## Next Phase Readiness

- `formatText()` ist vollständig migriert (0 von 9 verbleibenden Aufrufen der alten API). Modul-Gesamtstand: 12 von ursprünglich 21.
- Plan 09-07 kann jetzt starten (Schriftart/-größe in `setEditorFont()`/`setEditorFontSize()` sowie den floating-Toolbar-Font-Pfad migrieren, laut Roadmap/09-07-PLAN.md).
- **Hinweis für 09-07/08:** Der Zählnachweis-Test in `editor-floating.spec.js` muss nach jeder weiteren Migrationsgruppe erneut auf den tatsächlichen Zwischenstand angepasst werden (siehe Deviation 2), bis Plan 09-09 ihn final auf `toBe(0)` umstellt.
- Keine Blocker für 09-07.

## Self-Check: PASSED

- FOUND: ui/editors/rich-text.js
- FOUND: tests/e2e/features/editor-floating.spec.js
- FOUND: .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
- FOUND commits: 413222e, dbdaac1
- Netz (80/80) grün nach beiden Tasks, `npx jest` (457/457) grün, `npm run build:dev` Exit-Code 0

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
