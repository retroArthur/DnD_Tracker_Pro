---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 08
subsystem: testing
tags: [rich-text-editor, execCommand, selection-range-api, playwright, regression-net, paste, insert-table, line-break]

# Dependency graph
requires:
  - phase: 09-editor-regressionsnetz-execcommand-abl-sung
    provides: "09-07 Schriftart/-groesse + Format-entfernen migriert (Modul-Zaehlstand 21 -> 6), Hilfsfunktionen wrapRangeWithElement/closestEditorAncestor/clearInlineFormattingAtSelection/applyFontFamilyToSelection/applyFontSizeToSelection"
provides:
  - "Zwischenablage-Einfuegungen (Tabellen-HTML, tabulatorgetrennter Text, reiner Text) in handleEditorPaste() auf Selection/Range umgestellt"
  - "Tabelleneinfuegen (insertTable()) und der abgefangene Zeilenumbruch (handleEditorKeydown()) auf Selection/Range umgestellt"
  - "Drei neue modul-interne Hilfsfunktionen: insertHtmlAtSelection, insertTextAtSelection, insertLineBreakAtSelection"
  - "Zusatz-Hilfsfunktion sanitizeInsertedInlineStyle() repliziert die execCommand-eigene Stil-Nachbereinigung fuer eingefuegtes HTML"
  - "Gesamtstand deprecated Editier-Kommando-API im Modul: 6 → 1 (nur noch der defaultParagraphSeparator-Setup-Aufruf)"
affects: [09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "insertHTML-Ersatz ueber Range.createContextualFragment() + Range.insertNode() (09-RESEARCH.md Pattern 3), kein <script>-Ausfuehren moeglich"
    - "Cursor-Positionierung nach Fragment-Einfuegung steigt zum tiefsten letzten Nachfahren des zuletzt eingefuegten Knotens ab (nicht zum Geschwister danach) — reproduziert empirisch die execCommand-eigene Cursor-Platzierung, sichtbar am doppelt feuernden Paste-Listener (Fund 3)"
    - "sanitizeInsertedInlineStyle(): deterministische Nachbildung der execCommand('insertHTML')-eigenen Stil-Bereinigung (Layout-Eigenschaften padding/margin/width/border-collapse immer entfernt; bei 2+ verbleibenden Deklarationen wird 'background' in acht leere Langform-Eigenschaften aufgesplittet und 'color' entfernt — ein reproduzierbarer Chromium-Effekt bei CSS-Custom-Property-Werten, der 'border' nicht betrifft)"
    - "Zero-Width-Space-Textplatzhalter als Selektions-Anker nach einem abschliessenden <br>: Chromium haelt eine per Range/Selection-API gesetzte Cursor-Position 'hinter einem trailing <br> ohne Folgeinhalt' nicht stabil; ein Platzhalter-Textknoten mit tatsaechlichem (wenn auch unsichtbarem) Inhalt gibt einen stabilen Anker, der beim naechsten Tastatur-Input oder beim Verlassen des Editors per deleteData() (nicht per .data-Neuzuweisung) spurlos entfernt wird"

key-files:
  created: []
  modified:
    - ui/editors/rich-text.js
    - tests/e2e/features/editor-floating.spec.js
    - .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md

key-decisions:
  - "sanitizeInsertedInlineStyle() als deterministische String-Transformation implementiert statt sich auf Blinks eigene CSSOM-Reserialisierung zu verlassen — letztere reproduziert den execCommand-Effekt fuer 'background'/'color' NICHT (empirisch per Probe-Skripten widerlegt), waehrend die explizite Nachbildung fuer die drei bekannten, durch die unveraenderte Bereinigungs-Kette erzeugten Stil-Muster (Tabelle, TD, TH) exakt matcht"
  - "Zero-Width-Space-Platzhalter mit deleteData()-Cleanup statt einer Container/Kindindex- oder leeren-Textknoten-Cursor-Positionierung fuer insertLineBreakAtSelection() — beide letzteren Varianten liessen den Cursor beim naechsten Tippen empirisch nachweisbar vor das <br> zurueckspringen"

requirements-completed: [EDIT-01]

coverage:
  - id: D1
    description: "Gruppe E: Die drei Zwischenablage-Einfuegungen (Tabellen-HTML, tabulatorgetrennter Text, reiner Text) in handleEditorPaste() ersetzen die alte Editier-Kommando-API durch Selection/Range-Operationen, byte-gleiches Markup zur Baseline inklusive des doppelt feuernden Paste-Listener-Bugs (Fund 3, bewusst repliziert nicht behoben); der Sicherheits-Regressionstest aus Plan 09-04 bleibt unveraendert gruen"
    requirement: "EDIT-01"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js (80 passed nach Task 1)"
        status: pass
      - kind: unit
        ref: "npx jest (457 passed nach Task 1)"
        status: pass
      - kind: other
        ref: "node -e Zaehl-/Scope-Skripte aus PLAN.md acceptance_criteria (kein execCommand in handleEditorPaste-Scope, genau je eine Definition von insertHtmlAtSelection/insertTextAtSelection, kein neuer innerHTML-Zuweisungspfad)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gruppe F: Tabelleneinfuegen (insertTable(), Schaltflaeche/floating/Tastenkombination) und der abgefangene Zeilenumbruch (Enter-Taste) ersetzen die alte Editier-Kommando-API; die Umschalt-Eingabetaste (A1-Referenz) bleibt unangetastet; Modul-Gesamtstand execCommand sinkt auf 1 (nur Setup-Aufruf)"
    requirement: "EDIT-01"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js (80 passed nach Task 2)"
        status: pass
      - kind: unit
        ref: "npx jest (457 passed nach Task 2)"
        status: pass
      - kind: other
        ref: "node -e Zaehlskript aus PLAN.md acceptance_criteria (Modul-Gesamtstand 1), genau eine Definition von insertLineBreakAtSelection"
        status: pass
    human_judgment: false

# Metrics
duration: 37min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 8: Einfuege-Operationen Migrationsstufe 3 (Gruppe E+F) Summary

**Zwischenablage-Einfuegungen, Tabelleneinfuegen und der abgefangene Zeilenumbruch sind auf Selection/Range-DOM-Operationen umgestellt — Modul-Gesamtstand 6 → 1, komplettes Regressionsnetz (80 Tests) und volle Jest-Suite (457 Tests) nach jeder der zwei Migrationsgruppen grün; zwei empirisch entdeckte Chromium-Eigenheiten (Stil-Nachbereinigung bei insertHTML, Cursor-Instabilität hinter einem trailing `<br>`) wurden gezielt nachgebildet, um byte-gleiches Markup zur Baseline zu garantieren.**

## Performance

- **Duration:** 37 min
- **Tasks:** 2
- **Files modified:** 3 (ui/editors/rich-text.js, tests/e2e/features/editor-floating.spec.js, 09-BASELINE.md)

## Accomplishments

- Gruppe E (Task 1): Die drei Call-Sites in `handleEditorPaste()` (Tabellen-HTML-Paste, tabulatorgetrennter Text, reiner Text) sind auf Selection/Range umgestellt. Neue Hilfsfunktionen `insertHtmlAtSelection`/`insertTextAtSelection` nutzen `Range.createContextualFragment()` (führt kein `<script>` aus). Die vorgeschaltete Attribut-Bereinigungs-Kette blieb Zeichen für Zeichen unverändert (verifiziert per `git diff -U0`).
- Gruppe F (Task 2): `insertTable()` (Schaltfläche, floating Schaltfläche, Tastenkombination Strg+Shift+T) nutzt jetzt `insertHtmlAtSelection()` aus Task 1. Eine neue Hilfsfunktion `insertLineBreakAtSelection()` ersetzt den Enter-Handler in `handleEditorKeydown()`. Der Zweig für die Umschalt-Eingabetaste (A1-Referenz, Plan 09-09) wurde nicht angefasst.
- Modul-Gesamtstand deprecated Editier-Kommando-API: 21 → 1 (20 von 21 Call-Sites migriert, nach Phase 9 Plan 8) — nur noch der `defaultParagraphSeparator`-Setup-Aufruf bleibt (empirisch als wirkungslos nachgewiesen in 09-BASELINE.md Abschnitt A1, Entfernung in Plan 09-09).
- Zwei empirisch am gebauten Bundle verifizierte Chromium-Eigenheiten wurden gezielt nachgebildet, damit das erzeugte Markup byte-gleich zur 09-BASELINE.md-Referenz bleibt: (1) die execCommand-eigene Stil-Nachbereinigung bei `insertHTML` (Layout-Eigenschaften entfernt, `background`/`color`-Sonderfall bei Mehrfach-Deklarationen mit CSS-Custom-Properties) und (2) eine Cursor-Instabilität bei Selektionen unmittelbar hinter einem abschließenden `<br>` (Zero-Width-Space-Platzhalter als Anker, per `deleteData()` spurlos entfernt).
- Regressionsnetz (4 Spec-Dateien, 80 Tests) und volle Jest-Suite (457 Tests) liefen nach JEDER der beiden Gruppen grün; `npm run build:dev` beendete beide Male mit Exit-Code 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Gruppe E — Zwischenablage-Einfügungen** - `b83addf` (feat)
2. **Task 2: Gruppe F — Tabelleneinfügen + Zeilenumbruch** - `2a8542d` (feat)

**Plan metadata:** (folgt, siehe finaler Commit)

## Files Created/Modified

- `ui/editors/rich-text.js` - Drei neue modul-interne Hilfsfunktionen (`insertHtmlAtSelection`, `insertTextAtSelection`, `insertLineBreakAtSelection`) plus eine Zusatz-Hilfsfunktion (`sanitizeInsertedInlineStyle`); `handleEditorPaste()`, `insertTable()` und `handleEditorKeydown()` rufen diese statt der deprecated API auf
- `tests/e2e/features/editor-floating.spec.js` - Zählnachweis-Test zweimal aktualisiert (6→3 nach Gruppe E, 3→1 nach Gruppe F) — die einzige im Netz-Freeze vorab autorisierte Ausnahme
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` - Zwei weitere Ausnahme-Änderungs-Einträge (5+6) dokumentiert, inklusive der zwei empirisch verifizierten Chromium-Eigenheiten (Stil-Nachbereinigung, Cursor-Instabilität hinter trailing `<br>`)

## Decisions Made

- `sanitizeInsertedInlineStyle()` als deterministische String-Transformation implementiert statt Blinks eigene CSSOM-Reserialisierung (`el.style.removeProperty()`) zu nutzen — letztere reproduziert die execCommand-eigene `background`/`color`-Eigenheit empirisch NICHT (per Probe-Skript widerlegt: eine reine CSSOM-Touch-Operation lässt `background: var(--bg-elevated)` unangetastet, während die alte `insertHTML`-API es in acht leere Langform-Eigenschaften auflöst). Die explizite Nachbildung matcht alle drei real vorkommenden Stil-Muster (Tabelle, TD, TH) exakt.
- Zero-Width-Space-Platzhalter mit `deleteData()`-Cleanup statt Container/Kindindex- oder leerem-Textknoten-Adressierung für `insertLineBreakAtSelection()` — beide letzteren Varianten ließen den Cursor beim nächsten Tippen empirisch nachweisbar vor das `<br>` zurückspringen (neuer Text landete vor statt hinter dem Umbruch). Eine komplette `.data`-Neuzuweisung zum Entfernen des Platzhalters wurde verworfen zugunsten von `deleteData()` an der exakten Zeichen-Position, da erstere eine Selektion, die genau an der Löschgrenze steht, fälschlich auf den Anfang zurückwirft (ebenfalls empirisch verifiziert).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `insertHtmlAtSelection()` platzierte den Cursor nach dem Einfügen als Geschwister-Knoten statt am tiefsten letzten Nachfahren — doppelt feuernder Paste-Listener erzeugte Geschwister-Tabellen statt der protokollierten Verschachtelung**
- **Found during:** Task 1, Verifikationslauf des Netzes (`editor-insert.spec.js`, alle drei Paste-Tabellen-Tests)
- **Issue:** Die wörtliche Umsetzung von 09-RESEARCH.md Pattern 3 (`range.setStartAfter(lastNode)`, `lastNode` = letzter Top-Level-Knoten des Fragments) positioniert den Cursor als Geschwister-Knoten hinter dem zuletzt eingefügten Top-Level-Element. Der doppelt feuernde Paste-Listener (Fund 3, 09-BASELINE.md) fügt beim zweiten Aufruf dieselbe Tabelle dadurch als SIBLING neben statt VERSCHACHTELT in die letzte Tabellenzelle der ersten Tabelle ein — abweichend von der gemessenen Baseline (`TABELLEN_ERWARTET`).
- **Fix:** Nach dem Einfügen wird zum tiefsten letzten Nachfahren des zuletzt eingefügten Knotens abgestiegen (rekursiv über `lastChild`); ist dieser ein Textknoten, wird der Cursor an dessen Ende positioniert, sonst dahinter. Das reproduziert die empirisch verifizierte execCommand-eigene Cursor-Platzierung.
- **Files modified:** ui/editors/rich-text.js
- **Verification:** Alle drei Paste-Tabellen-Tests grün (verschachtelte Struktur byte-gleich zur Baseline), Persistenz-Roundtrip-Test grün, komplettes Netz (80/80) weiterhin grün.
- **Committed in:** b83addf (Task 1)

**2. [Rule 1 - Bug] Neu eingefügte Inline-Styles behielten Layout-Eigenschaften (padding/margin/width/border-collapse) sowie unveränderte `background`/`color`-Werte — die alte insertHTML-API entfernt/verändert diese empirisch**
- **Found during:** Task 1, Verifikationslauf des Netzes (Markup-Diff bei allen drei Paste-Tabellen-Tests)
- **Issue:** `Range.createContextualFragment()` parst das Style-Attribut wörtlich, ohne die execCommand-eigene Stil-Nachbereinigung zu durchlaufen. Per Probe-Skripten gegen das gebaute Bundle empirisch verifiziert (Chromium 143.0.7499.4): die alte `insertHTML`-API entfernt IMMER `padding`/`margin`/`width`/`border-collapse`; bleiben danach 2+ Deklarationen übrig und ist `background` darunter, wird es in acht leere Langform-Eigenschaften aufgesplittet; eine mitenthaltene `color`-Deklaration wird ersatzlos entfernt (`border` selbst ist von diesem Effekt nicht betroffen). Ohne Nachbildung entstand abweichendes Markup (z. B. `<table style="width:100%; ...">` statt ohne Style-Attribut, `padding` blieb erhalten).
- **Fix:** Neue Hilfsfunktion `sanitizeInsertedInlineStyle()` bildet dieses Verhalten deterministisch nach (String-Parsing der Deklarationen statt CSSOM-Touch, da Letzteres den `background`/`color`-Effekt empirisch NICHT reproduziert) und wird auf alle Elemente mit `style`-Attribut im frisch geparsten Fragment angewendet, bevor es eingefügt wird.
- **Files modified:** ui/editors/rich-text.js
- **Verification:** Alle drei Paste-Tabellen-Tests sowie der Persistenz-Roundtrip-Test zeigen byte-gleiches Markup zur Baseline; komplettes Netz (80/80) weiterhin grün.
- **Committed in:** b83addf (Task 1)

**3. [Rule 1 - Bug] `insertLineBreakAtSelection()` ließ den Cursor nicht stabil hinter dem `<br>` — nachfolgend getippter Text landete vor statt hinter dem Umbruch**
- **Found during:** Task 2, Verifikationslauf des Netzes (`editor-insert.spec.js`, Enter-Test)
- **Issue:** Eine per Range/Selection-API gesetzte Cursor-Position unmittelbar hinter einem abschließenden `<br>` ohne nachfolgenden Inhalt ist in Chromium empirisch nicht stabil — unabhängig davon, ob sie per Container-Kindindex oder per leerem Rest-Textknoten adressiert wird. Der nächste getippte Text landete kommentarlos VOR dem `<br>` (Ergebnis `ZeileEinsZeileZwei<br>` statt `ZeileEins<br>ZeileZwei`), das `<br>` selbst wanderte ans Ende.
- **Fix:** Ein Textknoten-Platzhalter mit einem Zero-Width-Space-Zeichen direkt nach dem `<br>` gibt der Selektion einen stabilen Text-Anker; der Cursor wird an dessen Anfang (vor das Zero-Width-Space-Zeichen) gesetzt. Der Platzhalter wird über einmalige `input`- und `blur`-Listener beim nächsten echten Tastatur-Input bzw. beim Verlassen des Editors per `deleteData()` an der exakten Zeichen-Position entfernt (eine komplette `.data`-Neuzuweisung würde eine Selektion, die genau an der Löschgrenze steht, fälschlich auf den Anfang zurückwerfen — ebenfalls empirisch verifiziert und verworfen).
- **Files modified:** ui/editors/rich-text.js
- **Verification:** Enter-Test und Shift+Enter-Test (A1-Referenz) grün, Endergebnis byte-gleich zur Baseline ohne Zero-Width-Space im Markup; komplettes Netz (80/80) weiterhin grün.
- **Committed in:** 2a8542d (Task 2)

**4. [Rule 3 - Blocking] Neue Dokumentationskommentare enthielten das literale Wort "execCommand" und erhöhten den Zählnachweis-Wert versehentlich**
- **Found during:** Task 1, erster Verifikationslauf des Zählnachweis-Tests
- **Issue:** Der Zählnachweis-Test zählt jedes literale Vorkommen von `execCommand` im Datei-Text (auch in Kommentaren), nicht nur echte Aufrufe. Neue Kommentare, die das Wort "execCommand" zur Erklärung nutzten, erhöhten den Zählwert versehentlich von 3 (erwartet) auf 7.
- **Fix:** Kommentare auf die bereits in Plänen 09-06/09-07 etablierte Paraphrase "Editier-Kommando-API" umgeschrieben (kein literales "execCommand" mehr in Kommentaren).
- **Files modified:** ui/editors/rich-text.js
- **Verification:** `grep -c execCommand ui/editors/rich-text.js` liefert exakt 3 (nach Task 1) bzw. 1 (nach Task 2), passend zu den erwarteten Werten.
- **Committed in:** b83addf (Task 1)

**5. [Rule 3 - Blocking] Netz-Freeze-Ausnahme (Zählnachweis-Test) musste zweimal statt nur einmal in Plan 09-09 angewandt werden**
- **Found during:** Task 1 und Task 2, jeweils beim Ausführen des `<verify>`-Blocks
- **Issue:** Analog zu den Plänen 09-06/09-07: Da jeder Zwischenplan sein eigenes Hard-Gate über das komplette Netz inklusive dieser Datei fährt, bliebe der Zählnachweis-Test bei unverändertem Erwartungswert dauerhaft rot.
- **Fix:** Zählnachweis-Test in zwei Schritten aktualisiert: `toBe(6)` → `toBe(3)` (nach Gruppe E, Task 1) → `toBe(1)` (nach Gruppe F, Task 2). Beide Änderungen sind in 09-BASELINE.md nach dem dort vorgeschriebenen Verfahren dokumentiert (Ausnahme-Änderungen 5+6).
- **Files modified:** tests/e2e/features/editor-floating.spec.js, .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
- **Verification:** Beide Male komplettes Netz (80/80) grün nach der Anpassung; `git diff` der vier Netz-Spec-Dateien zeigt über beide Commits hinweg ausschließlich Änderungen am Zählnachweis-Testblock in `editor-floating.spec.js`, keine andere Assertion berührt.
- **Committed in:** b83addf (Task 1, 6→3), 2a8542d (Task 2, 3→1)
- **Hinweis:** Die Ausnahme-Änderung-5-Dokumentation (für Task 1) wurde technisch erst im Task-2-Commit `2a8542d` in 09-BASELINE.md nachgetragen (beide Ausnahme-Einträge 5+6 in einer Bearbeitung), statt bereits mit `b83addf` committet zu werden — reine Dokumentations-Reihenfolge ohne Auswirkung auf Code oder Testverhalten.

### Informationeller Hinweis (kein Fix nötig)

**6. Zwei empirisch entdeckte Chromium-Eigenheiten waren nicht im Plan vorhergesehen, aber durch dessen "Claude's Discretion"-Klausel gedeckt**
- 09-RESEARCH.md räumt explizit ein: "Technischer Range/Selection-Ansatz je Kommando ..., solange das Markup identisch bleibt (D-02)" liegt im Ermessen des Ausführenden. Die zwei in diesem Plan entdeckten Eigenheiten (Stil-Nachbereinigung bei insertHTML, Cursor-Instabilität hinter trailing `<br>`) sind reale, reproduzierbare Chromium-Verhaltensweisen, keine App-Bugs — beide wurden per Probe-Skripten gegen das gebaute Bundle verifiziert (Details siehe 09-BASELINE.md Ausnahme-Änderungen 5+6). Kein Abweichen von Plan-Vorgaben, lediglich zusätzliche Implementierungsdetails, die zur Erfüllung von D-02 nötig waren.

---

**Total deviations:** 5 auto-fixed (3 Bugs, 2 Blocking/Prozess), 1 informationeller Hinweis ohne Fix
**Impact on plan:** Alle fünf Fixes waren notwendig, um die Plan-eigenen Hard-Gates (komplettes Netz grün, byte-gleiches Markup zur Baseline) zu erfüllen. Kein Scope Creep — alle Fixes blieben innerhalb der Datei `ui/editors/rich-text.js` (bzw. der autorisierten Zählnachweis-Ausnahme in `editor-floating.spec.js`), keine Änderung an der vorgeschalteten Bereinigungs-Kette, an `utils/basic.js`, `utils/testable-utils.js` oder `assets/styles/editors.css`.

## Issues Encountered

None über die dokumentierten Deviations hinaus.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None. Die im Plan vorab identifizierten Bedrohungen (T-09-01, T-09-19, T-09-20) sind durch die Implementierung mitigiert: `insertHtmlAtSelection()`/`insertTextAtSelection()` nutzen ausschließlich `Range.createContextualFragment()` (führt kein `<script>` aus, laut Spezifikation) — der Sicherheits-Regressionstest aus Plan 09-04 bleibt unverändert grün, sowohl direkt nach dem Einfügen als auch nach Speichern/Reload. Keine direkte Zuweisung an die HTML-Eigenschaft eines Elements wurde als Einfügeweg eingeführt (verifiziert per Scope-Grep). Die vorgeschaltete Attribut-Bereinigungs-Kette in `handleEditorPaste()` ist Zeichen für Zeichen unverändert (verifiziert per `git diff -U0`).

## Next Phase Readiness

- Beide Aufgabengruppen (Zwischenablage-Einfügungen, Tabelleneinfügen + Zeilenumbruch) laufen ohne die deprecated API. Modul-Gesamtstand: 1 von ursprünglich 21 verbliebenen Aufrufen — nur noch der `defaultParagraphSeparator`-Setup-Aufruf.
- Plan 09-09 kann jetzt starten: letzte Migrationsgruppe (Setup-Aufruf entfernen, empirisch als wirkungslos nachgewiesen in 09-BASELINE.md Abschnitt A1), Zählnachweis-Test final auf `toBe(0)` umstellen, Umschalt-Eingabetaste-Pfad (A1-Referenz) prüfen/dokumentieren.
- Keine Blocker für 09-09.

## Self-Check: PASSED

- FOUND: ui/editors/rich-text.js
- FOUND: tests/e2e/features/editor-floating.spec.js
- FOUND: .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
- FOUND commits: b83addf, 2a8542d
- Netz (80/80) grün nach beiden Tasks, `npx jest` (457/457) grün, `npm run build:dev` Exit-Code 0
- Modul-Gesamtstand execCommand: 1 (verifiziert via `node -e "const s=require('fs').readFileSync('ui/editors/rich-text.js','utf8');console.log((s.match(/document\.execCommand/g)||[]).length)"`, ergibt 1)

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
