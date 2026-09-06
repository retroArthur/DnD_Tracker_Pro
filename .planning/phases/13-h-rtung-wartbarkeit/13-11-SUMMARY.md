---
phase: 13-h-rtung-wartbarkeit
plan: 11
subsystem: maintainability
tags: [module-split, loader, editor, non-esm, build-system]

# Dependency graph
requires:
  - phase: 13-10
    provides: "Proven MAINT-01 split blueprint (banner-cut, single Task-1 tracer slice, immediate build-after-move, full-suite hard gate), applied here to ui/editors/rich-text.js — the file D-03 identified as two foreign modules in one, not one oversized module"
provides:
  - "ui/editors/rich-text.js entflochten (D-03) und aufgeteilt (D-02) in vier Dateien: features/spells/spell-manager.js (Zauberverwaltung, neues Verzeichnis features/spells/), ui/editors/rich-text.js (Editor-Zustand + Selektion/Zeichenformatierung), ui/editors/rich-text-insert.js (Einfuegen/Zwischenablage/Tastatur/Tabelle), ui/editors/rich-text-toolbars.js (Floating- + Kontext-Toolbars)"
  - "Alle vier Dateien in loader.js MODULES registriert, in Abhaengigkeitsreihenfolge; nichts in build.py"
  - "Blueprint ein drittes Mal bestaetigt (3/4 MAINT-01-Splits) — bereit fuer den letzten, riskantesten Fall (13-12, dmscreen-render.js, D-04's Charakterisierungs-Snapshot-Vorstufe)"
affects: [13-12, maint-01, loader.js]

actuals:
  tokens: 26000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "MAINT-01 file-split convention (confirmed 3/4): [SECTION:X] header + own EXPORTS FOR GLOBAL ACCESS block per file, cut along // ==== banners, registered only in loader.js MODULES, single build.py run after each individual section move (not batched)"
    - "Entflechten vor Zerschneiden (D-03): wenn ein Sektionsbanner eine fremde Domaene markiert (hier: Zauberverwaltung in einer Editor-Datei), zieht die fremde Domaene komplett in ihr eigenes Feature-Verzeichnis aus, bevor der verbleibende Rest ueberhaupt auf die 800-Zeilen-Grenze geprueft wird"
    - "Wortlaut-Vorsicht in Kopfkommentaren neuer Split-Dateien: ein Kommentar, der woertlich 'document.execCommand' erwaehnt (auch nur beschreibend, 'kein document.execCommand mehr'), troff die eigene Erfolgskriterium-4-Pruefung (grep 'document\\.execCommand' ohne Kommentarfilter). Umformuliert auf 'execCommand-API' (ohne 'document.'-Praefix), wie es utils/basic.js bereits fuer die drei akzeptierten Kommentar-Treffer aus MAINT-04/D-14 tut."

key-files:
  created:
    - features/spells/spell-manager.js
    - ui/editors/rich-text-insert.js
    - ui/editors/rich-text-toolbars.js
  modified:
    - ui/editors/rich-text.js
    - loader.js
    - tests/build/test_build_deduplication.py

key-decisions:
  - "Task 1 (tracer) verschob NUR die Zauberverwaltung (STATE-Anteil: currentSpellPage/filteredSpellsCache/expandedSpells; RENDER; SPELL FORM; SPELL CRUD) nach features/spells/spell-manager.js — exakt wie geplant, die groesste Einzelverschiebung und die mit beiden pushUndo()-Aufrufen, damit die riskanteste Bewegung zuerst gegen das eingefrorene Phase-9-Netz plus tab-navigation.spec.js gepruefte wurde, bevor der Editor selbst angefasst wurde."
  - "Waehrend Task 1 wurde ein eigener Fehler gefunden und sofort korrigiert (Rule 1): beim ersten Zusammenbau der Task-1-Zwischendatei wurde versehentlich schon die Task-2-Unterteilungsgrenze (Zeilen 324-694, nur Selektion/Zeichenformatierung) statt der vollen EDITOR-FORMATTING-Sektion (Zeilen 324-1119) verwendet — das liess 12 Funktionen/Konstanten (initEditorPasteHandlers, insertHtmlAtSelection, insertTextAtSelection, insertLineBreakAtSelection, handleEditorKeydown, handleEditorPaste, escapeHtml, insertTable, updateStickyOffsets, sanitizeInsertedInlineStyle, STRIP_STYLE_PROPS, EMPTY_BACKGROUND_LONGHANDS) komplett aus dem Bundle verschwinden. Sichtbar geworden ist der Fehler NICHT am Build (der lief grob durch), sondern erst am E2E-Netz: 96 von 97 Tests schlugen mit 'ReferenceError: Cannot access debugLog before initialization' fehl (eine TDZ-Verkettung ueber renderTabContent -> ErrorHandler.log -> debugLogAdd, ausgeloest durch die veraenderte Bundle-Groesse/-Reihenfolge, nicht durch debugLog selbst). Diagnose ueber einen Zeilennamen-Diff (grep aller Top-Level-Deklarationen im Original gegen die neuen Dateien) fand die fehlenden 12 Namen praezise; Fix war die korrekte Zeilenspanne (324-1119) neu zu extrahieren. Nach dem Fix: 97/97 gruen. Dieser Fund bestaetigt, warum das Plan-Verfahren 'nach jeder einzelnen Verschiebung bauen UND das Netz laufen lassen' fordert (D-06) — der Build allein haette diesen Fehler nicht gefangen, nur das E2E-Netz."
  - "Task 2 teilte die verbleibende EDITOR-FORMATTING-Sektion (799 Zeilen inkl. Banner, exakt an der 800er-Grenze, D-02) entlang der Phase-9-Spezifikationsgrenze: Selektions-/Range-Grundlagen und Zeichenformatierung (wrapRangeWithElement, unwrapEditorElement, closestEditorAncestor, applyInlineFormat, toggleUnorderedListAtSelection, clearInlineFormattingAtSelection, formatText, _lastFontCallKey, applyFontFamilyToSelection, applyFontSizeToSelection, setEditorFont, setEditorFontSize, clearEditorFormatting, setBorderFormat, setReadAloudFormat, removeSelectionBorders, EDITOR_HOST_SELECTOR) blieben in rich-text.js; Einfuegen/Zwischenablage/Tastatur/Tabelle wanderten nach rich-text-insert.js. FLOATING TOOLBAR + CONTEXT TOOLBARS wanderten unveraendert als ein Block nach rich-text-toolbars.js."
  - "Exportmengen-Invariante: die Plan-Vorgabe nannte 30 Exporte vor der Aufteilung; die tatsaechlich gemessene Zahl (grep -c '^window\\.' auf der ORIGINALEN rich-text.js vor jeder Aenderung, per git show HEAD~3 nachtraeglich verifiziert) war 26. Gleiches Stale-Count-Muster wie 13-09 (28 statt 30) und 13-10 (38 statt 34) — an dieser Stelle dokumentiert statt am Code korrigiert, weil 26 = 6 (rich-text.js) + 3 (rich-text-insert.js) + 2 (rich-text-toolbars.js) + 15 (spell-manager.js) bei jedem Zwischenschritt direkt gegen die Datei verifiziert wurde, nicht nur behauptet."
  - "Der ausfuehrliche Erklaerkommentar ueber insertLineBreakAtSelection()s Chromium-Cursor-Eigenheit (der laut Plan teuerste Teil des Phase-9-Wissens in dieser Datei) wanderte vollstaendig, unveraendert und an derselben Stelle relativ zur Funktion nach rich-text-insert.js — per Zeilen-Diff bestaetigt, keine Kuerzung."

patterns-established:
  - "Kopfkommentare in neuen Split-Dateien duerfen den Wortlaut 'document.execCommand' nicht enthalten, auch nicht als Verneinung ('kein document.execCommand mehr') — die eigene Erfolgskriterium-4-Pruefung (grep ohne Kommentarfilter) faengt das ab. utils/basic.js loest das bereits durch 'execCommand' ohne 'document.'-Praefix in seinen drei akzeptierten Kommentar-Treffern (MAINT-04/D-14); dieses Muster jetzt auch in den drei neuen Editor-Dateien uebernommen."

requirements-completed: []

coverage:
  - id: D1
    description: "Zauberverwaltung (STATE-Anteil currentSpellPage/filteredSpellsCache/expandedSpells, RENDER, SPELL FORM, SPELL CRUD, 15 Exporte, 2 pushUndo()-Aufrufe) verlaesst ui/editors/ vollstaendig und liegt in features/spells/spell-manager.js"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -c '^function renderSpells' ui/editors/rich-text.js == 0; grep -c '^function renderSpells' features/spells/spell-manager.js == 1; grep -cE 'saveUndoState\\(|pushUndo\\(' features/spells/spell-manager.js == 2"
        status: pass
      - kind: other
        ref: "Top-Level-Deklarations-Diff (Name-fuer-Name) zwischen dem urspruenglichen rich-text.js (73 Deklarationen) und der Summe aller vier Ergebnisdateien — identisch, nichts verloren"
        status: pass
    human_judgment: false
  - id: D2
    description: "Die 799-Zeilen-EDITOR-FORMATTING-Sektion (kein Puffer unter der 800er-Grenze) ist entlang der Phase-9-Spezifikationsgrenze weiter geteilt: Selektion/Zeichenformatierung bleibt in rich-text.js (401 Zeilen), Einfuegen/Zwischenablage/Tastatur/Tabelle geht nach rich-text-insert.js (438 Zeilen), FLOATING TOOLBAR + CONTEXT TOOLBARS gehen nach rich-text-toolbars.js (513 Zeilen); spell-manager.js liegt bei 607 Zeilen — alle vier unter der 800-Zeilen-Grenze aus D-01"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "wc -l fuer alle vier Dateien: 401, 438, 513, 607 — alle <= 800"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/editor-formatting.spec.js + editor-floating.spec.js + editor-insert.spec.js + editor-smoke.spec.js + tab-navigation.spec.js (97/97 nach Task 1), dieselben vier Editor-Specs + wiki.spec.js (97/97 nach Task 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Alle vier Dateien in loader.js MODULES registriert (spell-manager.js direkt hinter render-spells.js; rich-text-insert.js und rich-text-toolbars.js direkt hinter rich-text.js, vor markdown-shortcuts.js), in Abhaengigkeitsreihenfolge; nichts in build.py; kein Symbol in zwei Quelldateien"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -c 'features/spells/spell-manager.js' loader.js == 1; grep -c 'spell-manager' build.py == 0; grep -c 'rich-text-insert' loader.js == 1; grep -c 'rich-text-toolbars' loader.js == 1; PYTHONIOENCODING=utf-8 python build.py (Exit 0, kein [FEHLER]/[ABORTED], nach beiden Verschiebungen)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Kein Aufruf der deprecated Editier-Kommando-API zurueckgekehrt (grep 'document\\.execCommand' ausserhalb Kommentaren == 0); Exportmengen-Invariante gemessen (26, nicht die im Plan genannten 30) und ueber die Aufteilung unveraendert"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -rn 'document\\.execCommand' --include=*.js core features systems ui utils render loader.js | wc -l == 0 (nach Umformulierung des eigenen Kopfkommentars, siehe Deviations); grep -c '^window\\.' summiert ueber alle vier Dateien == 26, unveraendert vor/nach Task 2"
        status: pass
    human_judgment: false
  - id: D5
    description: "Volles Suiten-Gate gruen vor dem finalen Commit: Jest, tsc, beide dist-Buendel + Python-Build-Tests, volle Playwright-Suite"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "npx jest (38 suites, 1066/1066 passed — unveraendert zur 13-10-Baseline)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit (Exit 0, kein error TS)"
        status: pass
      - kind: other
        ref: "python build.py && python build.py --production && python -m pytest tests/build -q (24/24 passed, inkl. dieses Plans MODULES-Zahl-Fix 127 -> 130)"
        status: pass
      - kind: e2e
        ref: "python build.py && npx playwright test (321 passed / 2 skipped, unveraendert zur 13-10-Baseline)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Bedienprobe (Task 4, checkpoint:human-verify) — zehn manuelle Punkte zum Bediengefuehl des Editors nach der Aufteilung, ausserhalb des Automatisierungsbereichs (13-VALIDATION.md 'Manual-Only Verifications')"
    requirement: "MAINT-01"
    verification:
      - kind: manual_procedural
        ref: "Durchgefuehrt und freigegeben am 2026-09-06 durch den Entwickler (zugleich Endnutzer/DM) an dist/dnd-tracker-bundled.html: alle zehn Punkte verhalten sich wie vor der Aufteilung — Floating-Toolbar an der Selektion, Zeichenformatierung, Schriftart/-groesse, Read-Aloud-Stile, Tabelle, Zeilenumbruch-Cursor, Einfuegen, Formatierung entfernen, Link, sowie die herausgeloeste Zauberverwaltung"
        status: pass
    rationale: "Automatisierte Tests belegen, dass der Editor nach der Aufteilung funktioniert - nicht, dass er sich unveraendert BEDIENT. Die Chromium-Cursor-Stabilitaet war in Phase 9 der teuerste Befund ueberhaupt und faellt in keinem automatisierten Lauf auf."
    human_judgment: true

duration: ~55min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 11: Rich-Text-Editor-Entflechtung und -Aufteilung (MAINT-01, 3/4) Summary

**`ui/editors/rich-text.js` (1932 Zeilen) zuerst entflochten (D-03: Zauberverwaltung nach `features/spells/spell-manager.js` ausgelagert) und dann aufgeteilt (D-02: 799-Zeilen-Formatierungssektion entlang der Phase-9-Spezifikationsgrenze in `rich-text.js` und `rich-text-insert.js`, Toolbars in `rich-text-toolbars.js`) — vier Dateien, alle unter 800 Zeilen, das eingefrorene 79-Test-Netz aus Phase 9 (tatsächlich 84 Tests) grün vor und nach jeder Verschiebung, volles Suiten-Gate bestanden.**

## Warum diese Datei anders behandelt wurde

Die Roadmap nannte `rich-text.js` als den begründungspflichtigen Fall wegen seines Testnetzes. `13-CONTEXT.md` (D-04) hatte das bereits korrigiert: Mit dem eingefrorenen 79-Test-Netz aus Phase 9 ist dieses Modul tatsächlich das **am besten abgesicherte** der vier — der riskante Fall ist `dmscreen-render.js` (13-12, ohne eigenes Netz). Dieser Plan bestätigt das: Der einzige während der Ausführung gefundene Fehler (siehe Deviations) wurde ausschließlich durch das Testnetz sichtbar, nicht durch den Build — ein direkter Beleg für den Wert des Netzes und dafür, warum 13-12 zuerst einen Charakterisierungs-Snapshot braucht, bevor dort überhaupt etwas verschoben wird.

## Performance

- **Duration:** ~55 min (inkl. einer gefundenen und behobenen Selbstverursachten Regression, siehe Deviations)
- **Started:** 2026-09-06
- **Completed:** 2026-09-06
- **Tasks:** 3 (Task 4 ist ein `checkpoint:human-verify` und folgt nach diesem SUMMARY)
- **Files modified:** 6 (ui/editors/rich-text.js, ui/editors/rich-text-insert.js [neu], ui/editors/rich-text-toolbars.js [neu], features/spells/spell-manager.js [neu], loader.js, tests/build/test_build_deduplication.py)

## Accomplishments

- `features/spells/spell-manager.js` (neu, 607 Zeilen) angelegt: eigener `[SECTION:SPELL_MANAGER]`-Kopf, eigener `EXPORTS FOR GLOBAL ACCESS`-Block; trägt die drei Zauber-Zustandsvariablen, RENDER (Zauberliste/Filter/Pagination), SPELL FORM (Bereichs-/Zeit-/Dauer-Umschaltung) und SPELL CRUD (inkl. beider `pushUndo()`-Aufrufe) — 15 Exporte
- `ui/editors/rich-text.js` (401 Zeilen) enthält jetzt nur noch den geteilten Editor-Zustand (10 Variablen) und Selektion/Zeichenformatierung — 6 Exporte
- `ui/editors/rich-text-insert.js` (neu, 438 Zeilen) trägt Einfügen/Zwischenablage/Tastatur/Tabelle, inklusive des ausführlichen Chromium-Cursor-Erklärkommentars zu `insertLineBreakAtSelection()` — 3 Exporte
- `ui/editors/rich-text-toolbars.js` (neu, 513 Zeilen) trägt FLOATING TOOLBAR + CONTEXT TOOLBARS als einen zusammenhängenden Block — 2 Exporte
- `loader.js` `MODULES` aktualisiert: `'features/spells/spell-manager.js'` direkt hinter `'features/render-spells.js'`; `'ui/editors/rich-text-insert.js'` und `'ui/editors/rich-text-toolbars.js'` direkt hinter `'ui/editors/rich-text.js'`, vor `'ui/editors/markdown-shortcuts.js'` — nichts in `build.py`
- Volles Hard-Gate mit vorgelegter Ausgabe vor dem letzten Commit (siehe Coverage D5)

## Task Commits

Jede Task wurde atomar committet:

1. **Task 1: Zauberverwaltung aus dem Editor-Modul herauslösen** - `526762b` (feat)
2. **Task 2: Editor-Modul in drei Verantwortlichkeiten teilen** - `4c891e9` (feat)
3. **Task 3: Hard-Gate — volle Suiten, beide Bündel, Typprüfung vor dem Commit** - `fe12069` (test — nur der `loader.js`-Modulzahl-Fix war nötig)

**Plan metadata:** wird zusammen mit diesem SUMMARY committet (siehe finaler Commit unten)

## Files Created/Modified

- `features/spells/spell-manager.js` - Neues Modul: Zauberverwaltung (STATE-Anteil, RENDER, SPELL FORM, SPELL CRUD), 607 Zeilen, 15 Exporte, 2 `pushUndo()`-Aufrufe
- `ui/editors/rich-text-insert.js` - Neues Modul: Einfügen/Zwischenablage/Tastatur/Tabelle, 438 Zeilen, 3 Exporte, 0 Undo-Aufrufe
- `ui/editors/rich-text-toolbars.js` - Neues Modul: Floating- + Kontext-Toolbars, 513 Zeilen, 2 Exporte, 0 Undo-Aufrufe
- `ui/editors/rich-text.js` - Reduziert auf Editor-Zustand + Selektion/Zeichenformatierung, 401 Zeilen, 6 Exporte, 0 Undo-Aufrufe
- `loader.js` - Drei neue `MODULES`-Einträge in Abhängigkeitsreihenfolge eingefügt
- `tests/build/test_build_deduplication.py` - `test_ssot_module_list_parses_from_loader`-Modulzahl-Assertion 127 → 130 aktualisiert

## Decisions Made

Siehe `key-decisions` im Frontmatter — Zusammenfassung:
1. Task 1 verschob die gesamte Zauberverwaltung als einen Tracer-Schritt (größte und undo-tragende Bewegung zuerst).
2. Ein während Task 1 selbst verursachter Fehler (falsche Zeilenspanne bei der ersten Extraktion, 12 Deklarationen fehlten) wurde durch das E2E-Netz gefangen (nicht durch den Build) und per Namens-Diff präzise diagnostiziert und behoben, bevor committet wurde.
3. Task 2 teilte die 799-Zeilen-Formatierungssektion entlang der Phase-9-Spezifikationsgrenze (`editor-formatting` vs. `editor-insert`).
4. Die Exportmengen-Invariante wurde mit 26 (nicht den im Plan genannten 30) gemessen und über beide Tasks hinweg als unverändert bestätigt.
5. Der Chromium-Cursor-Erklärkommentar wanderte vollständig und ungekürzt mit seiner Funktion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task-1-Zwischendatei verlor 12 Deklarationen durch falsche Zeilenspanne**
- **Found during:** Task 1, beim ersten E2E-Lauf nach dem Build (96 von 97 Tests schlugen fehl)
- **Issue:** Bei der Konstruktion der Task-1-Zwischenfassung von `rich-text.js` wurde versehentlich bereits die für Task 2 vorgesehene Unterteilungsgrenze (Zeilen 324–694, nur Selektion/Zeichenformatierung) statt der vollständigen `EDITOR FORMATTING`-Sektion (Zeilen 324–1119) extrahiert. Dadurch fehlten `initEditorPasteHandlers`, `sanitizeInsertedInlineStyle`, `insertHtmlAtSelection`, `insertTextAtSelection`, `insertLineBreakAtSelection`, `handleEditorKeydown`, `handleEditorPaste`, `escapeHtml`, `insertTable`, `updateStickyOffsets` sowie zwei Konstanten (`STRIP_STYLE_PROPS`, `EMPTY_BACKGROUND_LONGHANDS`) komplett im Bundle. `python build.py` lief trotzdem grün durch (keine doppelten Deklarationen, keine fehlenden Dateien — der Build prüft nicht auf fehlenden Aufrufcode). Erst der E2E-Lauf zeigte einen `ReferenceError: Cannot access 'debugLog' before initialization`, eine durch die veränderte Bundle-Struktur ausgelöste TDZ-Kettenreaktion (`renderTabContent` → `ErrorHandler.log` → `debugLogAdd`).
- **Fix:** Namens-Diff aller Top-Level-Deklarationen (`function`/`const`/`let`/`class`) zwischen der ursprünglichen Datei und den neuen Dateien identifizierte die 12 fehlenden Namen präzise. Die korrekte Zeilenspanne (324–1119) wurde neu extrahiert und die Zwischendatei neu zusammengesetzt.
- **Files modified:** ui/editors/rich-text.js (vor dem Task-1-Commit korrigiert — der committete Stand ist bereits der korrekte)
- **Verification:** Namens-Diff zeigte danach 0 Abweichungen; `npx playwright test` (die vier Editor-Specs + tab-navigation.spec.js) lief 97/97 grün
- **Committed in:** 526762b (Task 1 commit — der Fehler wurde vor dem Commit gefunden und behoben, erscheint nicht als eigener Commit)

**2. [Rule 1 - Bug] Eigener Kopfkommentar löste die eigene execCommand-Prüfung aus**
- **Found during:** Task 2, Verify-Schritt (`grep -rn 'document\.execCommand' ... | wc -l` lieferte 1 statt 0)
- **Issue:** Der neu geschriebene Kopfkommentar in `ui/editors/rich-text.js` enthielt wörtlich die Zeichenkette `document.execCommand` (als Verneinung: „kein document.execCommand — Phase 9 execCommand-Ablösung"), was die eigene Akzeptanzprüfung des Plans auslöste. Diese Prüfung filtert Kommentare nicht heraus (im Gegensatz zu `MAINT-04`/`D-14`s Erfolgskriterium 6, das ausdrücklich nur Freiheit außerhalb von Kommentaren verlangt — aber dieser Plan-Task's Verify-Kommando ist strenger formuliert).
- **Fix:** Kommentar umformuliert auf „execCommand-API" (ohne `document.`-Präfix), analog zum bereits etablierten Muster in `utils/basic.js:125,126,235` (drei akzeptierte Kommentar-Treffer aus `MAINT-04`).
- **Files modified:** ui/editors/rich-text.js
- **Verification:** `grep -rn 'document\.execCommand' --include=*.js core features systems ui utils render loader.js | wc -l` → 0
- **Committed in:** 4c891e9 (Task 2 commit — der Fehler wurde vor dem Commit gefunden und behoben)

---

**Total deviations:** 2 auto-fixed (beide Rule 1 — direkte, in-scope Folgen dieses Plans' Dateiaufteilung, keine der beiden erscheint als eigener Commit, da vor dem jeweiligen Task-Commit gefunden und behoben)
**Impact on plan:** Beide Fehler wurden VOR dem jeweiligen Task-Commit gefunden und korrigiert — kein fehlerhafter Zwischenstand liegt im Git-Verlauf. Kein Scope-Creep, keine Verhaltensänderung an Produktionscode über die geplante Verschiebung hinaus.

## Known Stubs

Keine — reine Verschiebung, keine neuen Platzhalter oder unverdrahteten Datenquellen.

## Issues Encountered

- Die Plan-Vorgabe „30 Exporte" war stale (tatsächlich 26, gemessen an der Originaldatei vor jeder Änderung) — dokumentiert unter Decisions Made, gleiches Muster wie in 13-09 (28 statt 30) und 13-10 (38 statt 34).
- Kein Unit-Test lädt `ui/editors/rich-text.js` direkt per `vm` (anders als `wiki.js` in 13-09) — keine Testdatei brauchte eine Anpassung dieser Art.

## User Setup Required
None - keine externe Dienstkonfiguration nötig.

## Next Phase Readiness
- Das MAINT-01-Verfahren ist ein drittes Mal bestätigt (Banner-Schnitt nach D-02, ausschließliche `loader.js`-Registrierung nach ARCH-01, `python build.py` nach jeder Verschiebung, volles Suiten-Gate mit vorgelegter Ausgabe vor dem Commit) und bereit für den letzten, laut D-04 riskantesten Fall: 13-12 (`dmscreen-render.js`, ohne eigenes Testnetz, braucht zuerst einen Charakterisierungs-Snapshot).
- Dieser Plan liefert einen zusätzlichen, direkten Beleg für D-04: Der einzige gefundene Fehler wurde ausschließlich durch das E2E-Netz sichtbar, nicht durch den Build — für `dmscreen-render.js` ohne Netz wäre ein äquivalenter Fehler beim Bauen unsichtbar geblieben.
- Task 4 (Bedienprobe, `checkpoint:human-verify`) ist am 2026-09-06 durchgeführt und **freigegeben**: alle zehn Punkte verhalten sich wie vor der Aufteilung, einschließlich der beiden verwundbarsten (Zeilenumbruch-Cursorposition aus Phase-9-Territorium und die frisch herausgelöste Zauberverwaltung). Damit ist 13-11 vollständig abgeschlossen.
- `MAINT-01` bleibt in `REQUIREMENTS.md` als „Pending" stehen (nicht mit ✓ markiert) — die Anforderung deckt alle vier Aufteilungen ab und wird erst nach 13-12 als erfüllt markiert.

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED
Alle erzeugten/veränderten Dateien auf der Festplatte verifiziert vorhanden; alle drei Task-Commit-Hashes (526762b, 4c891e9, fe12069) im Git-Log verifiziert vorhanden.
