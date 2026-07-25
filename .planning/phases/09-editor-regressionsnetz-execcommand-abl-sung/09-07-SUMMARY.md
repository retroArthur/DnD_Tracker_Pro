---
phase: 09-editor-regressionsnetz-execcommand-abl-sung
plan: 07
subsystem: testing
tags: [rich-text-editor, execCommand, selection-range-api, playwright, regression-net, font]

# Dependency graph
requires:
  - phase: 09-editor-regressionsnetz-execcommand-abl-sung
    provides: "09-06 formatText() vollstaendig migriert (Modul-Zaehlstand 21 -> 12), Hilfsfunktionen wrapRangeWithElement/closestEditorAncestor/clearInlineFormattingAtSelection"
provides:
  - "Schriftart/-groesse der statischen Toolbar (setEditorFont/setEditorFontSize) auf Selection/Range umgestellt"
  - "Schriftart/-groesse/„Format entfernen" der floating Toolbar auf Selection/Range umgestellt"
  - "Zwei neue modul-interne Hilfsfunktionen: applyFontFamilyToSelection, applyFontSizeToSelection"
  - "clearInlineFormattingAtSelection() erweitert um Tag-Unwrap (b/i/u/s/strike)"
  - "Gesamtstand deprecated Editier-Kommando-API im Modul: 12 → 6"
affects: [09-08, 09-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Idempotenter Selection/Range-Wrap: applyFontFamilyToSelection/applyFontSizeToSelection aktualisieren ein bereits umschliessendes <font>-Element in-place statt erneut zu verschachteln, wenn die Selektion bereits innerhalb eines <font>-Vorfahren liegt (closestEditorAncestor-Wiederverwendung)"
    - "Doppel-Dispatch-Schutz via Microtask-Reset (_lastFontCallKey-Guard): unterdrueckt redundante Aufrufe mit identischen Parametern innerhalb desselben synchronen Tasks, ohne die aufrufende Infrastruktur (EventDelegation) zu veraendern"

key-files:
  created: []
  modified:
    - ui/editors/rich-text.js
    - tests/e2e/features/editor-floating.spec.js
    - .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md

key-decisions:
  - "_lastFontCallKey-Doppel-Dispatch-Guard in rich-text.js statt Fix in ui/event-delegation.js (Datei-Scope des Plans eingehalten, siehe Deviations)"
  - "clearInlineFormattingAtSelection() um Tag-Unwrap (b/i/u/s/strike) erweitert statt einer zweiten, dupliziert Funktion — Wiederverwendung fuer beide Aufrufer (UI-loser highlight('none')-Zweig aus 09-06 UND floating „Format entfernen") bei unveraendertem Verhalten fuer den bestehenden Aufrufer"

requirements-completed: [EDIT-01, EDIT-02]

coverage:
  - id: D1
    description: "Gruppe C: Schriftart/-groesse der statischen Toolbar (setEditorFont/setEditorFontSize) ersetzen die alte Editier-Kommando-API durch Selection/Range-Operationen, byte-gleiches Markup zur Baseline (inkl. Anfuehrungszeichen-Stripping bei mehrteiligen Font-Stacks), gemerkte Selektion bleibt wirksam"
    requirement: "EDIT-01"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js (80 passed nach Task 1)"
        status: pass
      - kind: unit
        ref: "npx jest (457 passed nach Task 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Gruppe D: Schriftart/-groesse/„Format entfernen" der floating Toolbar ersetzen die alte API; „Format entfernen" loest Fett+Highlight+Rahmen komplett auf ohne Inhaltsverlust, byte-gleich zur Baseline"
    requirement: "EDIT-02"
    verification:
      - kind: e2e
        ref: "npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js (80 passed nach Task 2)"
        status: pass
      - kind: unit
        ref: "npx jest (457 passed nach Task 2)"
        status: pass
      - kind: other
        ref: "node -e Zählskripte aus PLAN.md acceptance_criteria (Modul-Gesamtstand 6, initFloatingToolbar..handleSelectionChange-Scope 0 Aufrufe, setEditorFont..clearEditorFormatting-Scope 0 Aufrufe)"
        status: pass
    human_judgment: false

# Metrics
duration: 55min
completed: 2026-07-25
status: complete
---

# Phase 9 Plan 7: Schriftart/-größe + Format-entfernen Migrationsstufe 2 (Gruppe C+D) Summary

**Schriftart und Schriftgröße in beiden Toolbars sowie „Format entfernen" der floating Toolbar sind auf Selection/Range-DOM-Operationen umgestellt — Modul-Gesamtstand 12 → 6, komplettes Regressionsnetz (80 Tests) und volle Jest-Suite (457 Tests) nach jeder der zwei Migrationsgruppen grün.**

## Performance

- **Duration:** 55 min
- **Tasks:** 2
- **Files modified:** 3 (ui/editors/rich-text.js, tests/e2e/features/editor-floating.spec.js, 09-BASELINE.md)

## Accomplishments

- Gruppe C (Task 1): Die zwei Call-Sites in `setEditorFont()`/`setEditorFontSize()` (statische Toolbar) sind auf Selection/Range umgestellt. Neue Hilfsfunktionen `applyFontFamilyToSelection`/`applyFontSizeToSelection` erzeugen das Ziel-`<font>`-Element direkt an der Selektion — der bisherige Umweg über eine numerische Größenstufe mit anschließendem Umschreiben aller passenden Elemente im gesamten Editor entfällt ersatzlos. Byte-gleiches Markup zur 09-BASELINE.md-Referenz, inklusive Anführungszeichen-Stripping bei mehrteiligen Font-Stacks (empirisch am gebauten Bundle verifiziert).
- Gruppe D (Task 2): Die vier verbliebenen Call-Sites der floating Toolbar (font/fontSize im `change`-Handler, removeFormat/backColor in `applyFloatingFormat()`) sind migriert. `clearInlineFormattingAtSelection()` (aus Plan 09-06) wurde um einen Tag-Unwrap-Schritt (b/i/u/s/strike) erweitert, um die empirisch verifizierte Eigenheit der alten `removeFormat`-Kommando-API zu replizieren (entpackt Standard-Auszeichnungstags, lässt Custom-Elemente wie `<mark>`/`<span>` stehen).
- Modul-Gesamtstand deprecated Editier-Kommando-API: 21 → 6 (15 von 21 Call-Sites migriert, nach Phase 9 Plan 7).
- Regressionsnetz (4 Spec-Dateien, 80 Tests) und volle Jest-Suite (457 Tests) liefen nach JEDER der beiden Gruppen grün; `npm run build:dev` beendete beide Male mit Exit-Code 0.

## Task Commits

Each task was committed atomically:

1. **Task 1: Gruppe C — Schriftart/-größe der statischen Toolbar** - `8488634` (feat)
2. **Task 2: Gruppe D — Schriftart/-größe/Format-entfernen der floating Toolbar** - `a72609e` (feat)

**Plan metadata:** (folgt, siehe finaler Commit)

## Files Created/Modified

- `ui/editors/rich-text.js` - Zwei neue modul-interne Hilfsfunktionen (`applyFontFamilyToSelection`, `applyFontSizeToSelection`) mit Doppel-Dispatch-Schutz; `setEditorFont`/`setEditorFontSize` und der floating-Toolbar-`change`-Handler rufen diese statt der deprecated API auf; `clearInlineFormattingAtSelection()` um Tag-Unwrap erweitert und im floating „Format entfernen"-Zweig eingesetzt
- `tests/e2e/features/editor-floating.spec.js` - Zählnachweis-Test zweimal aktualisiert (12→10 nach Gruppe C, 10→6 nach Gruppe D) — die einzige im Netz-Freeze vorab autorisierte Ausnahme
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` - Zwei weitere Ausnahme-Änderungs-Einträge (3+4) dokumentiert, inklusive der zwei empirisch verifizierten Verhaltens-Funde (Doppel-Dispatch, removeFormat-Tag-Unwrap)

## Decisions Made

- Doppel-Dispatch-Guard direkt in `rich-text.js` implementiert (nicht in `ui/event-delegation.js`, wo die eigentliche Ursache liegt) — hält den Plan-Datei-Scope ein, siehe Deviation 1.
- `clearInlineFormattingAtSelection()` erweitert statt eine zweite, fast identische Funktion angelegt — DRY, Wiederverwendung für beide Aufrufer (UI-loser `highlight('none')`-Zweig aus 09-06 UND floating „Format entfernen").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Doppel-Dispatch von `<select data-action>`-Elementen erzeugte doppelt verschachtelte `<font>`-Wrapper**
- **Found during:** Task 1, Verifikationslauf des Netzes (Randfall „Ordnung" in `editor-formatting.spec.js`, mehrere weitere Font-Tests)
- **Issue:** `EventDelegation._handleChange` UND `_handleInput` (`ui/event-delegation.js`) feuern BEIDE für `<select data-action="...">`-Elemente bei jeder Auswahl — ein vorbestehender, plan-fremder Doppel-Dispatch. Bei der alten Editier-Kommando-API war das unsichtbar (No-Op auf bereits identisch formatiertem Text). Die reine Selection/Range-Ersetzung erzeugte ohne Schutz bei jeder Auswahl einen zweiten, verschachtelten `<font>`-Wrapper (`<font><font>Text</font></font>` statt `<font>Text</font>`), da beide Handler-Aufrufe synchron mit identischer Selektion liefen.
- **Fix:** `_lastFontCallKey`-Guard in `applyFontFamilyToSelection`/`applyFontSizeToSelection`: unterdrückt einen zweiten Aufruf mit identischen Parametern (editorId + Wert) innerhalb desselben synchronen Tasks (Microtask-Reset danach). Zusätzlich (Verteidigung in der Tiefe): beide Funktionen aktualisieren ein bereits umschließendes `<font>`-Element in-place statt erneut zu verschachteln. `ui/event-delegation.js` selbst wurde NICHT verändert (außerhalb des Datei-Scopes dieses Plans — `files_modified` der Plan-Frontmatter listet nur `ui/editors/rich-text.js`).
- **Files modified:** ui/editors/rich-text.js
- **Verification:** Randfall-Test „Ordnung" (zweimal dieselbe Aktion, byte-gleiches Ergebnis) grün, alle Schriftart-/Größen-Tests (statisch + floating, inkl. Roundtrip) grün, komplettes Netz (80/80) weiterhin grün.
- **Committed in:** 8488634 (Task 1)

**2. [Rule 1 - Bug] `clearInlineFormattingAtSelection()` (aus Plan 09-06) entpackte keine Auszeichnungstags — floating „Format entfernen" hätte `<b>` stehen gelassen**
- **Found during:** Task 2, Verifikationslauf des Netzes (Test „Format entfernen über die floating Toolbar löst Fett + Highlight + Rahmen komplett auf")
- **Issue:** Die alte `removeFormat`-Kommando-API entpackt empirisch nachweislich Standard-Auszeichnungstags (`<b>`, `<i>`, `<u>`, `<s>`, `<strike>`) aus der Selektion, lässt aber Custom-Elemente wie `<mark>`/`<span>` selbst stehen (nur deren Farb-Style wird entfernt) — verifiziert am gebauten Bundle mit verschachteltem `<span class="editor-border"><mark style="..."><b>Text</b></mark></span>`. Die 09-06-Version von `clearInlineFormattingAtSelection()` deckte nur den Farb-Style-Teil ab (ihr einziger bisheriger Aufrufer, der UI-lose `highlight('none')`-Zweig, hatte nie verschachtelte Auszeichnungen in der Selektion). Der Plan sah vor, die Funktion unverändert für den floating „Format entfernen"-Zweig wiederzuverwenden — das hätte `<b>Probetext</b>` stehen gelassen statt der erwarteten reinen `Probetext`.
- **Fix:** `clearInlineFormattingAtSelection()` um einen Unwrap-Schritt für `b`/`i`/`u`/`s`/`strike` innerhalb der Selektion erweitert (vor dem bestehenden Farb-Style-Schritt). Die bereits vorhandene Nachbehandlung in `applyFloatingFormat()` (Mark-Auflösung, `removeSelectionBorders()`, Toast) blieb unverändert außerhalb der Hilfsfunktion, exakt wie im Plan vorgegeben. Verhalten für den bestehenden Aufrufer (UI-loser `highlight('none')`-Zweig) unverändert, da dort keine Bold/Italic/Underline/Strikethrough-Tags in der Selektion vorkommen.
- **Files modified:** ui/editors/rich-text.js
- **Verification:** „Format entfernen"-Test grün (Fett+Highlight+Rahmen vollständig aufgelöst, Textinhalt erhalten), UI-lose `highlight('none')`-Test aus 09-06 weiterhin grün (unverändertes Verhalten), komplettes Netz (80/80) weiterhin grün.
- **Committed in:** a72609e (Task 2)

**3. [Rule 3 - Blocking] Netz-Freeze-Ausnahme (Zählnachweis-Test) musste zweimal statt nur einmal in Plan 09-09 angewandt werden**
- **Found during:** Task 1 und Task 2, jeweils beim Ausführen des `<verify>`-Blocks
- **Issue:** Analog zu Plan 09-06 (dortige Deviation 2): Da JEDER Zwischenplan sein eigenes Hard-Gate über das komplette Netz inklusive dieser Datei fährt, bliebe der Zählnachweis-Test bei unverändertem Erwartungswert dauerhaft rot.
- **Fix:** Zählnachweis-Test in zwei Schritten aktualisiert: `toBe(12)` → `toBe(10)` (nach Gruppe C, Task 1) → `toBe(6)` (nach Gruppe D, Task 2). Beide Änderungen sind in 09-BASELINE.md nach dem dort vorgeschriebenen Verfahren dokumentiert (Migrationsgruppe, alter/neuer Erwartungswert, Begründung, Commit-Referenz — Abschnitt „Netz-Freeze", Ausnahme-Änderungen 3+4).
- **Files modified:** tests/e2e/features/editor-floating.spec.js, .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
- **Verification:** Beide Male komplettes Netz (80/80) grün nach der Anpassung; `git diff` der Testdatei zeigt ausschließlich Änderungen am Zählnachweis-Testblock, keine andere Assertion berührt.
- **Committed in:** 8488634 (Task 1, 12→10), a72609e (Task 2, 10→6)
- **Hinweis für Folgepläne:** Plan 09-08 wird voraussichtlich dieselbe Anpassung für seine Migrationsgruppe benötigen, bevor Plan 09-09 den Endwert `0` setzt.

### Informationeller Hinweis (kein Fix nötig)

**4. Acceptance-Kriterium „keine neue funktions-lokale `const X = window.X`" — literaler Grep-Check ist überbreit**
- Wie bereits in 09-06 dokumentiert (dortiger informationeller Hinweis 3): Das im PLAN.md angegebene `node -e`-Skript (`/^\s+const\s+\w+\s*=\s*window\./`) erfasst auch harmlose, im gesamten Modul bereits vorbestehende Muster wie `const selection = window.getSelection();` (25+ Vorkommen bereits vor diesem Plan). Der eigentliche CLAUDE.md-Anti-Pattern (Aliasing eines global mit `const`/`let` deklarierten Bezeichners, das beim Build-Dedup-Pass kollidiert) wurde durch diesen Plan NICHT neu eingeführt — `window.getSelection`/`window.EDITOR_FONTS`/`window.TOOLBAR_DIMENSIONS` sind keine modul-scope `const`/`let`-Deklarationen, sondern legitime Web-API-/Konstanten-Zugriffe. Keine Korrektur an vorbestehendem, planfremdem Code vorgenommen (Scope Boundary).

---

**Total deviations:** 3 auto-fixed (2 Bugs, 1 Blocking/Prozess), 1 informationeller Hinweis ohne Fix
**Impact on plan:** Alle drei Fixes waren notwendig, um die Plan-eigenen Hard-Gates (komplettes Netz grün, byte-gleiches Markup zur Baseline) zu erfüllen. Kein Scope Creep — Fix 1 blieb innerhalb der Datei `ui/editors/rich-text.js` (kein Eingriff in `ui/event-delegation.js`), Fix 2 erweiterte eine bereits im Plan referenzierte Hilfsfunktion ohne Verhaltensänderung für ihren bestehenden Aufrufer, Fix 3 blieb innerhalb der bereits im Netz-Freeze vorab autorisierten Grenzen (Zählnachweis-Test).

## Issues Encountered

None über die dokumentierten Deviations hinaus.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Threat Flags

None. Die im Plan vorab identifizierten Bedrohungen (T-09-02, T-09-17, T-09-18) sind durch die Implementierung mitigiert: `applyFontFamilyToSelection`/`applyFontSizeToSelection` setzen ausschließlich die Style-Eigenschaften Schriftfamilie/-größe (beide auf der Whitelist in `utils/basic.js`), Werte stammen aus festen Auswahllisten bzw. der `EDITOR_FONTS`-Konstantenzuordnung. Der Wegfall des Nachbearbeitungs-Durchlaufs über alle Editor-Elemente (T-09-18) verkleinert den Wirkungsbereich nachweislich auf die Selektion — Roundtrip-Tests belegen identisches persistiertes Markup.

## Next Phase Readiness

- Beide Toolbars setzen Schriftart/-größe ohne die deprecated API; „Format entfernen" verhält sich unverändert und verliert keinen Textinhalt. Modul-Gesamtstand: 6 von ursprünglich 21 verbliebenen Aufrufen.
- Plan 09-08 kann jetzt starten (laut Roadmap/09-08-PLAN.md).
- **Hinweis für 09-08/09:** Der Zählnachweis-Test in `editor-floating.spec.js` muss nach der nächsten Migrationsgruppe erneut angepasst werden (siehe Deviation 3), bis Plan 09-09 ihn final auf `toBe(0)` umstellt.
- Keine Blocker für 09-08.

## Self-Check: PASSED

- FOUND: ui/editors/rich-text.js
- FOUND: tests/e2e/features/editor-floating.spec.js
- FOUND: .planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md
- FOUND commits: 8488634, a72609e
- Netz (80/80) grün nach beiden Tasks, `npx jest` (457/457) grün, `npm run build:dev` Exit-Code 0
- Modul-Gesamtstand execCommand: 6 (verifiziert via `grep -c execCommand ui/editors/rich-text.js`)

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Completed: 2026-07-25*
