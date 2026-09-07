---
phase: 13-h-rtung-wartbarkeit
plan: 02
subsystem: editor
tags: [xss-hardening, execCommand-migration, wiki, rich-text, jest-vm]

# Dependency graph
requires:
  - phase: 09-editor-migration
    provides: insertTextAtSelection(), wrapRangeWithElement(), closestEditorAncestor() (Phase 9 Selection/Range helpers)
provides:
  - Zero document.execCommand() call sites left in the source tree (only 3 untouched comment mentions in utils/basic.js)
  - parseWikiLinks() escapes both the data-value attribute and the visible text node via esc()
  - wiki-tree-item has exactly one data-id attribute
  - tests/unit/wiki-links.test.js (vm-loaded real esc(), regression net for wiki-link escaping)
affects: [13-09 (wiki.js split — must carry forward the escaping fix and the corrected ordering comment)]

# Actuals (#2632)
actuals:
  tokens: 2350
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "window.<phase9Helper>(...) with typeof guard replaces document.execCommand at all remaining call sites"
    - "vm.runInContext loading two real source files (utils/basic.js then features/wiki/wiki.js) into one sandbox so a unit test exercises the project's real esc(), not a stub"

key-files:
  created:
    - tests/unit/wiki-links.test.js
  modified:
    - systems/entity-links.js
    - features/wiki/wiki.js
    - ui/actions/system-actions.js

key-decisions:
  - "insertWikiLink() (features/wiki/wiki.js) has no preceding editor.focus() call in the plan's read; left as-is rather than adding a blind focus() — insertTextAtSelection() already no-ops safely when selection.rangeCount === 0 (Randfall 'empty')"
  - "insert-link action uses window.wrapRangeWithElement() (Phase 9 helper, not window-exported by name but reachable as a bare global function attached to window via non-strict top-level function declaration semantics in the concatenated bundle) instead of createLink; showToast only fires when a range was actually wrapped"
  - "parseWikiLinks() ordering comment rewritten to state the true post-fix relationship: parseWikiLinks() is self-sufficient now; renderMarkdownInContent() -> addTOCAnchors() -> parseWikiLinks() order is kept only because addTOCAnchors() needs already-rendered markup for heading anchor IDs"

requirements-completed: [SEC-04, MAINT-04, MAINT-02]

coverage:
  - id: D1
    description: "insertEntityLinkToEditor() (systems/entity-links.js) routes through insertTextAtSelection() instead of document.execCommand('insertText', ...)"
    requirement: "MAINT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-insert.spec.js + editor-smoke.spec.js (25/25 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "insertWikiLink() and the insert-link action migrated off execCommand; source-tree grep for document.execCommand returns 0 outside the 3 untouched utils/basic.js comments"
    requirement: "MAINT-04"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-{insert,formatting,floating,smoke}.spec.js + wiki.spec.js (97/97 passed)"
        status: pass
      - kind: other
        ref: "grep -rn 'document\\.execCommand' --include=*.js core features systems ui utils render loader.js | wc -l -> 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "parseWikiLinks() escapes both the attribute value and the visible text node via esc(); exists/missing classification unaffected; wiki-tree-item has exactly one data-id attribute"
    requirement: "SEC-04"
    verification:
      - kind: unit
        ref: "tests/unit/wiki-links.test.js (6/6 passed, vm-loaded real esc())"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/wiki.spec.js (13/13 passed)"
        status: pass
      - kind: unit
        ref: "npx jest full suite (922/922, 33 suites)"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 02: execCommand-Ablösung + parseWikiLinks()-Härtung Summary

**Letzte drei `document.execCommand`-Aufrufstellen auf die Phase-9-Hilfsfunktionen umgestellt, `parseWikiLinks()` escapt jetzt Attributwert UND sichtbaren Textknoten über `esc()`, doppeltes `data-id` im Wiki-Baum entfernt.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3
- **Files modified:** 3 source files + 1 new test file

## Accomplishments
- `insertEntityLinkToEditor()` (`systems/entity-links.js:87`), `insertWikiLink()` (`features/wiki/wiki.js:831`) und die `insert-link`-Aktion (`ui/actions/system-actions.js:82`) laufen jetzt über `window.insertTextAtSelection()` bzw. `window.wrapRangeWithElement()` statt über die deprecated Editier-Kommando-API — Erfolgskriterium 6 ist erfüllt: `grep -rn 'document\.execCommand' --include=*.js core features systems ui utils render loader.js` liefert `0`, die drei Kommentar-Erwähnungen in `utils/basic.js:125,126,235` bleiben unangetastet.
- `parseWikiLinks()` schickt sowohl den Attributwert als auch den sichtbaren Linktext durch das projektweite `esc()` statt nur das Anführungszeichen manuell zu ersetzen — ein Wiki-Link-Titel mit `<`, `>`, `"` erzeugt kein echtes Markup mehr im DOM (SEC-04 geschlossen).
- Der irreführende Reihenfolge-Kommentar bei `renderWikiDetail()` (ehemals „NICHT ändern") ist nachgezogen und beschreibt jetzt den tatsächlichen Zustand.
- Das doppelte, folgenlose `data-id`-Attribut am `wiki-tree-item`-Element ist entfernt (MAINT-02, Teil 1 von 2).
- Neue Testdatei `tests/unit/wiki-links.test.js`: lädt `utils/basic.js` und `features/wiki/wiki.js` per `vm` in denselben Kontext, sodass `esc()` die echte Projektfunktion ist (nicht gestubbt) — 6 Testfälle, RED gegen den Alt-Stand bestätigt, GREEN nach dem Fix.

## Task Commits

Each task was committed atomically:

1. **Task 1: Erste Aufrufstelle end-to-end umgestellt** - `4b1b8d2` (fix)
2. **Task 2: Verbleibende zwei Aufrufstellen abgelöst** - `c98bdd9` (fix)
3. **Task 3: parseWikiLinks() gehärtet + doppeltes data-id entfernt** - `8c44438` (fix, enthält test+fix in einem Commit da RED/GREEN im selben Task-Zyklus verifiziert wurde)

_Note: Task 3 folgte intern dem RED→GREEN-Muster (Testdatei zuerst rot gegen den Alt-Stand laufen lassen, dann Fix), aber beide Änderungen landeten in einem Commit, da der Plan sie als einen zusammenhängenden Task-Abschluss definiert (kein separates `type="tdd"`-Flag in der Plan-Frontmatter)._

## Files Created/Modified
- `systems/entity-links.js` - `insertEntityLinkToEditor()`: `execCommand('insertText', ...)` → `window.insertTextAtSelection(linkCode)` mit `typeof`-Guard
- `features/wiki/wiki.js` - `insertWikiLink()` migriert, `parseWikiLinks()` escapt via `esc()`, Reihenfolge-Kommentar korrigiert, doppeltes `data-id` entfernt
- `ui/actions/system-actions.js` - `insert-link`-Aktion: `execCommand('createLink', ...)` → `window.wrapRangeWithElement()` mit manuell gebautem `<a>`-Element
- `tests/unit/wiki-links.test.js` (neu) - 6 Testfälle für `parseWikiLinks()`-Escaping und `renderWikiTreeItem()`-Attribut-Eindeutigkeit

## Decisions Made
- `insertWikiLink()` bekommt keinen neu ergänzten `focus()`-Aufruf — `insertTextAtSelection()` fällt bei fehlender Selektion sauber auf ein No-Op zurück (Randfall `empty`, MAINT-04)
- `insert-link`-Aktion nutzt `window.wrapRangeWithElement()` mit `getSelection()`/`getRangeAt(0)`-Guard; `showToast()` feuert nur, wenn tatsächlich umschlossen wurde
- Reihenfolge-Kommentar bei `renderWikiDetail()` komplett umformuliert statt nur den Verbots-Satz zu entfernen — die neue Begründung (Anker-Ids brauchen gerendertes Markup) ist die tatsächliche, unveränderte Abhängigkeit

## Deviations from Plan

None - plan executed exactly as written. Threat T-13-07 (fehlende URL-Schema-Prüfung in der `insert-link`-Aktion) bleibt bewusst `accept` laut Plan-Threat-Model — keine Verhaltensänderung außerhalb des Scopes.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Erfolgskriterium 6 (keine execCommand-Aufrufe außerhalb von Kommentaren) vollständig erfüllt
- SEC-04 geschlossen, MAINT-04 (drei Aufrufstellen + drei Randfälle) erfüllt, MAINT-02 zur Hälfte erfüllt (doppeltes data-id entfernt; der zweite Teil von MAINT-02 liegt in einem späteren Plan)
- Plan 13-09 (Aufteilung von `features/wiki/wiki.js`) muss den Escaping-Fix und den korrigierten Kommentar unverändert mitnehmen
- Volle Suiten grün: Jest 922/922 (33 Suiten), Playwright editor+wiki-Specs 97/97 + 25/25 (Task 1) + 13/13 (Task 3) gegen frisch gebauten `dist/dnd-tracker-bundled.html`

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED

All created/modified files verified present on disk; all 4 task/docs commits (`4b1b8d2`, `c98bdd9`, `8c44438`, `4734460`) verified present in `git log`.
