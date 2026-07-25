# Phase 9 — Editor-Baseline (empirisch erhoben)

**Zweck:** Diese Datei ist die Referenz, gegen die jede spätere Assertion des Regressionsnetzes (Pläne 09-02..09-04) und jeder Migrations-Commit (Pläne 09-06..09-09) geprüft wird. Alle Werte unten sind **gemessen**, nicht aus Dokumentation geraten (CONTEXT.md Specifics-Mandat).

## Kopf

| Feld | Wert |
|------|------|
| Bundle-Build-Zeitpunkt | 2026-07-25T01:31:19.692Z (`npm run build:dev`, `PYTHONIOENCODING=utf-8`, frisch vor der Erhebung gebaut) |
| Playwright | `1.57.0` |
| Chromium (Playwright-gebündelt) | `143.0.7499.4` |
| Testumgebung | `file:///.../dist/dnd-tracker-bundled.html`, Windows, Chromium-only-Projekt |
| Erhebungsmethode | Temporäre Probe-Spec `tests/e2e/features/editor-baseline-probe.spec.js` (Boot-/Formular-/Selektions-Muster identisch zum Tracer aus Task 1); pro Call-Site einmal die auslösende Aktion ausgeführt, `#wiki-content`-`innerHTML` sowie Konsolenfehler (`page.on('console')`/`page.on('pageerror')`) erfasst. Rohdaten in `09-BASELINE-RAW.json` (wird nach Übernahme in dieses Dokument mit der Probe-Spec gelöscht — kein Dauerbestandteil des Netzes). |

## Markup-Inventar aller 21 execCommand-Call-Sites

Alle Zeilennummern verifiziert per `grep -n execCommand ui/editors/rich-text.js` (Stand dieses Plans) — identisch zur 09-RESEARCH.md-Inventarliste.

| Zeile | Kommando | Funktion | Auslöser/Selektor | Erhobenes Ergebnis-Markup / Fehlerzustand |
|-------|----------|----------|--------------------|--------------------------------------------|
| 329 | `bold` | `formatText()` | `[data-editor="bold"]` statische Toolbar | `<b>Sondentext</b>` |
| 331 | `italic` | `formatText()` | `[data-editor="italic"]` statische Toolbar | `<i>Sondentext</i>` |
| 333 | `underline` | `formatText()` | `[data-editor="underline"]` statische Toolbar | `<u>Sondentext</u>` |
| 335 | `strikeThrough` | `formatText()` | `[data-editor="strikethrough"]` statische Toolbar | `<strike>Sondentext</strike>` direkt nach Klick. **Nach Speichern+Reload+Wiedereröffnen: `Sondentext`** (Auszeichnung vollständig weg — siehe A4) |
| 337 | `insertUnorderedList` | `formatText()` | `[data-editor="list"]` statische Toolbar | `<ul><li>Sondentext</li></ul>` |
| 339 | `formatBlock('<h4>')` | `formatText()` (toter Code) | **UI unerreichbar** (A2-Grep: 0 Treffer `data-editor="heading"` in allen 12 Templates). Gemessen via `page.evaluate(() => window.formatText('wiki-content','heading'))` | `<h4>Sondentext</h4>` — Funktion selbst arbeitet korrekt, hat aber keinen UI-Pfad |
| 341 | `fontName(value)` | `formatText()` 'font'-Zweig (toter Code) | **UI unerreichbar** (A2-Grep: 0 Treffer `data-editor="font"`). Gemessen via `page.evaluate(() => window.formatText('wiki-content','font','Arial'))` | `<font face="Arial">Sondentext</font>` — funktioniert bei Direktaufruf, kein UI-Pfad |
| 344 | `removeFormat` | `formatText()` 'highlight'-Zweig, `value==='none'` (toter Code) | **UI unerreichbar** (kein `data-editor="highlight"`-Template). Gemessen via `page.evaluate(() => window.formatText('wiki-content','highlight','none'))` nach vorherigem `set-highlight-color` | `<mark style="border-radius: 2px; padding: 0px 3px;">Sondentext</mark>` — `removeFormat` entfernt nur `background-color`, das `<mark>`-Element selbst bleibt (execCommand entpackt keine Custom-Elemente) |
| 346 | `backColor(value)` | `formatText()` 'highlight'-Zweig, `value` gesetzt (toter Code) | **UI unerreichbar** (wie oben). Gemessen via `page.evaluate(() => window.formatText('wiki-content','highlight','#fbbf24'))` | `<span style="background-color: rgb(251, 191, 36);">Sondentext</span>` |
| 371 | `fontName` | `setEditorFont()` | `[data-action="set-editor-font"]` statische Toolbar Select | **Kein `<font>`-Wrapper entsteht — Text bleibt `Sondentext`.** Konsole: `TypeError: Cannot read properties of undefined (reading 'undefined')` in `setEditorFont`. Doppelter Root-Cause (siehe Zusätzliche Funde): `EDITOR_FONTS` ist `undefined` UND die Toolbar-Verdrahtung übergibt den falschen Argumenttyp |
| 393 | `fontSize('7')` | `setEditorFontSize()` | `[data-action="set-editor-font-size"]` statische Toolbar Select | `<font>Sondentext</font>` — **leeres `<font>`-Tag ohne Größenangabe.** `execCommand('fontSize','7')` läuft durch (kein `EDITOR_FONTS`-Bezug), aber `el.style.fontSize = select.value` schlägt still fehl (Argument-Mismatch, `select` ist ein String statt Element) — kein Wurf, nur wirkungslos |
| 513 | `defaultParagraphSeparator` | `initEditorPasteHandlers()` (Setup-Call, kein Format-Trigger) | Kein direkter UI-Trigger — betrifft natives Enter/Shift+Enter-Verhalten | Siehe A1: kein messbarer Effekt (weder Enter noch Shift+Enter erzeugen `<div>`/`<p>`-Absätze in diesem Editor) |
| 574 | `insertLineBreak` | `handleEditorKeydown()` | Enter-Taste (ohne Shift) im Editor | `ZeileEins<br>ZeileZwei` |
| 615 | `insertHTML` (Tabelle) | `handleEditorPaste()` | Paste von Tabellen-HTML (`text/html` enthält `<table>`) | `<table>...<td>A</td><td>B<table>...(dieselbe Tabelle nochmal)...</table></td></tr></table>` — **Tabelle erscheint doppelt verschachtelt.** Root Cause identifiziert, siehe Zusätzliche Funde (Doppel-Registrierung des `paste`-Listeners auf `#wiki-content`) |
| 637 | `insertHTML` (Tab-getrennt) | `handleEditorPaste()` | Paste von Tab-separiertem Text (nur `text/plain`, kein `<table>` in `text/html`) | Analog zu Zeile 615 — Tabelle aus Tab-Text ebenfalls doppelt verschachtelt (derselbe Root Cause) |
| 642 | `insertText` | `handleEditorPaste()` | Paste von Plaintext ohne Tab | `Reiner Text ohne TabReiner Text ohne Tab` — **Text erscheint doppelt** (derselbe Root Cause wie 615/637) |
| 674 | `insertHTML` (insertTable) | `insertTable()` | `[data-action="insert-table"]` Klick | `Sondentext<table>...(3×3 Tabelle mit "Spalte 1/2/3"-Kopfzeile)...</table><p></p>` — funktioniert korrekt, KEIN Doppel-Effekt (kein Paste-Event, kein Doppel-Listener betroffen) |
| 782 | `fontName` | floating Toolbar `change`-Handler | `[data-floating-action="font"]` Select | **Kein `<font>`-Wrapper — Text bleibt `Sondentext` unverändert**, obwohl `selectOption()` erfolgreich das Select geändert hat. Root Cause: `EDITOR_FONTS` ist `undefined` → `EDITOR_FONTS[value]` wirft im `change`-Handler, `execCommand('fontName', ...)` wird nie erreicht |
| 788 | `fontSize('7')` | floating Toolbar `change`-Handler | `[data-floating-action="fontSize"]` Select | `<font style="font-size: 1.5em;">Sondentext</font>` — **funktioniert korrekt** (dieser Zweig referenziert `EDITOR_FONTS` nicht) |
| 915 | `removeFormat` | `applyFloatingFormat()` 'removeFormat'-Aktion | `[data-floating-action="removeFormat"]` Button ("✕ Format") | **Per Mausklick nicht erreichbar** — `Element is outside of the viewport` (siehe A3/Zusätzliche Funde: gesamte floating Toolbar unpositioniert) |
| 916 | `backColor('transparent')` | `applyFloatingFormat()` 'removeFormat'-Aktion (derselbe Button wie 915) | wie oben | wie oben — derselbe Klick-Fehlschlag |

## Annahmen A1–A4 (gemessen)

### A1 — `defaultParagraphSeparator`-Verhalten bei nativem Enter/Shift+Enter

**Messung:** Enter (ohne Shift, von `handleEditorKeydown()` abgefangen) und Shift+Enter (nativ, nicht abgefangen — die einzige Stelle, an der `defaultParagraphSeparator` überhaupt greifen könnte) liefern in Chromium `143.0.7499.4` **identisches Markup**: `ZeileEins<br>ZeileZwei` in beiden Fällen.

**Schlussfolgerung:** Der `execCommand('defaultParagraphSeparator', false, 'div')`-Setup-Call (Zeile 513) hat **keinen messbaren Effekt** auf das Editor-Markup dieser App:
1. Reguläres Enter wird von `handleEditorKeydown()` immer per `preventDefault()`/`stopImmediatePropagation()` abgefangen und zwingend durch `insertLineBreak` (`<br>`) ersetzt — native Absatztrennung greift hier nie.
2. Shift+Enter fällt zwar durch zur nativen Browser-Behandlung, aber Shift+Enter ist in allen gängigen Browsern (unabhängig von `defaultParagraphSeparator`) als "weicher Zeilenumbruch" (`<br>`) spezifiziert — `defaultParagraphSeparator` beeinflusst nur reguläres (nicht abgefangenes) Enter, das es in diesem Editor gar nicht gibt.

Ein ersatzloses Entfernen dieses Setup-Calls bei der Migration (Plan 09-09) sollte daher D-02-konform sein — empirisch bestätigt, nicht nur angenommen.

### A2 — Erreichbarkeit von `data-editor="font"` (und `"heading"`/`"highlight"`)

**Messung:** Grep über alle 12 Dateien in `assets/templates/*.html` nach `data-editor="font"`, `data-editor="heading"`, `data-editor="highlight"`.

**Ergebnis:** 0 Treffer für alle drei Werte in allen 12 gescannten Templates.

**Schlussfolgerung:** Alle drei toten Zweige von `formatText()` (Zeilen 339 heading, 341 font, 344/346 highlight) sind über **keinen** Entity-Editor in der gesamten App per UI erreichbar — nicht nur im Wiki-Referenz-Editor. Die tatsächlichen Font-Picker sind ausschließlich `setEditorFont()` (statisches Select) und der floating-Toolbar-Font-Select (Zeile 782) — beide eigene, separate Call-Sites.

### A3 — Laufzeitzustand `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` und floating Toolbar

**Messung** (direkt am gebauten Bundle, Chromium `143.0.7499.4`):

- `typeof window.EDITOR_FONTS` → **`"undefined"`**
- `typeof window.TOOLBAR_DIMENSIONS` → **`"undefined"`**
- Erscheint `#floating-toolbar.visible` nach Textselektion? → **nein** (`floatingToolbarVisible: false`)
- Konsole bei jeder Selektionsänderung: `ReferenceError: TOOLBAR_DIMENSIONS is not defined` in `handleSelectionChange()` (bei jedem `selectionchange`-Event, reproduzierbar)
- Zusätzlich beim Nutzen des statischen Font-Selects: zwei `TypeError: Cannot read properties of undefined (reading 'undefined')` in `setEditorFont()`

**Schlussfolgerung:** Pitfall 1 ist **empirisch vollständig bestätigt und schwerwiegender als in der Research vermutet** — siehe „Zusätzliche Funde" unten für den vollen Wirkungsradius (nicht nur der Font-Picker ist betroffen, sondern die **gesamte floating Toolbar** ist per Mausklick unbedienbar).

### A4 — Überlebt die Durchstreich-Auszeichnung (statische Toolbar) den Speichern/Reload-Zyklus?

**Messung:** Strikethrough über die statische Toolbar anwenden (`<strike>Sondentext</strike>`), speichern, Seite neu laden, Eintrag erneut öffnen.

- Markup vor dem Speichern: `<strike>Sondentext</strike>`
- Markup nach Reload + Wiedereröffnen: `Sondentext` (kein `<strike>`, keine visuelle Durchstreichung mehr)

**Schlussfolgerung:** **Nein — die Durchstreichung überlebt den Zyklus nicht.** `sanitizeHTML()`s `allowedTags`-Liste (`utils/basic.js:72-100`) enthält `'s'`, aber **nicht** `'strike'`. Beim Speichern wird der `<strike>`-Tag durch `sanitizeHTML()`s `cleanNode()` als nicht erlaubtes Tag erkannt und durch reinen Textinhalt ersetzt (`document.createTextNode(element.textContent)`), die Formatierung geht vollständig verloren. Dies ist ein **vorbestehender Bug**, unabhängig von der execCommand-Migration (Pitfall 5 aus 09-RESEARCH.md empirisch bestätigt).

## Zusätzliche Funde (empirisch, über A1–A4 hinaus)

Diese Funde sind für die Baseline-Entscheidung in Task 3 unmittelbar relevant und werden dort NICHT repariert — nur dokumentiert (Auftrag dieses Tasks: "jeder Fund wird als Fund dokumentiert und dem Entwickler zur Entscheidung vorgelegt", nicht nebenbei behoben).

### Fund 1 — Die komplette floating Toolbar ist per Mausklick aktuell unbedienbar

Nicht nur der Font-Picker ist betroffen: **Jeder** Button und Farb-Swatch der floating Toolbar (bold/italic/underline/strikethrough/list/border/table/highlight-Swatches/removeFormat) scheitert bei echtem `locator.click()` mit `Element is outside of the viewport`.

**Root Cause:** `.floating-toolbar` hat in `assets/styles/spells.css` `position: fixed` ohne Standard-`top`/`left` und `pointer-events: none` (nur `.visible` schaltet auf `pointer-events: auto` und positioniert das Element über `toolbar.style.left`/`toolbar.style.top`). Diese Positionierung passiert in `handleSelectionChange()` (`ui/editors/rich-text.js:970`) — aber die Funktion wirft dort `ReferenceError: TOOLBAR_DIMENSIONS is not defined`, **bevor** `toolbar.classList.add('visible')` erreicht wird. Die Toolbar bleibt dauerhaft an ihrer nicht positionierten Default-Stelle im Dokumentfluss (weit außerhalb des sichtbaren Viewports) und mit `pointer-events: none` — für echte Mausklicks technisch unerreichbar.

Playwrights `isVisible()` meldet dennoch `true` (Opacity/Position zählen für Playwrights Sichtbarkeitsdefinition nicht als "hidden"), was den Unterschied zwischen "im DOM vorhanden" und "durch einen Menschen bedienbar" verschleiert — genau der Unterschied, den die Maskierungsregel aus Phase 8 verhindern soll.

Nur die drei `<select>`-Elemente der floating Toolbar (readAloud, font, fontSize) ließen sich über Playwrights `selectOption()` ansteuern, weil dieser Mechanismus den Wert direkt setzt statt einen echten Mausklick auf eine bestimmte Bildschirmposition zu simulieren — kein Beweis, dass ein Mensch am Spieltisch diese Selects heute per Maus bedienen könnte.

**Impact auf EDIT-02:** Die Anforderung "floating Toolbar funktioniert nach der Ablösung unverändert" ist heute bereits ein funktionsunfähiger Ist-Zustand für alle Klick-Aktionen dieser Toolbar (nicht nur Fonts).

### Fund 2 — `setEditorFont()` hat einen zweiten, von `EDITOR_FONTS` unabhängigen Bug

`ui/actions/system-actions.js:43-47` ruft `setEditorFont(editorId, font)` auf (zwei Strings) — aber `setEditorFont(elementIdOrSelect, selectEl)` in `ui/editors/rich-text.js:350-372` erwartet im zweiten Fall ein `<select>`-**Element**, aus dem `select.value` gelesen wird. Bei einem String-Argument ist `select.value` (String hat keine `.value`-Property) `undefined`, wodurch `EDITOR_FONTS[select.value]` als `EDITOR_FONTS[undefined]` ausgewertet wird (passend zur beobachteten Fehlermeldung `reading 'undefined'`). **Dieser Bug bestünde auch nach einer Wiederherstellung von `EDITOR_FONTS` weiter** — beide Fehlerursachen sind unabhängig voneinander und müssten beide behoben werden, damit der statische Font-Picker funktioniert.

`setEditorFontSize()` hat denselben Argument-Mismatch, wirkt sich aber milder aus: `execCommand('fontSize','7')` selbst braucht `EDITOR_FONTS` nicht und läuft durch; nur die nachgelagerte Zuweisung `el.style.fontSize = select.value` (ebenfalls `undefined`) schlägt still fehl (CSS ignoriert ungültige Werte, kein Wurf) — Ergebnis ist ein leeres `<font>`-Tag ohne sichtbare Größenänderung, aber kein Konsolenfehler.

### Fund 3 — Paste-Handler von Tabellen-HTML/Tab-Text/Plaintext fügt Inhalte doppelt ein

Bei einem einzelnen `paste`-Event auf `#wiki-content` erscheint der eingefügte Inhalt **zweimal** (verschachtelte Tabelle bzw. verdoppelter Text). Root Cause: `initEditorPasteHandlers()` registriert **zwei** `paste`-Listener, die beide auf `#wiki-content` feuern:
1. Ein direkter, elementspezifischer Listener (`editor.addEventListener('paste', handleEditorPaste)`), da `'wiki-content'` explizit in der `editorIds`-Liste steht (`ui/editors/rich-text.js:494-511`).
2. Ein document-weiter, capture-phasiger Delegations-Listener (`document.addEventListener('paste', ..., true)`, `ui/editors/rich-text.js:524-536`), der jedes Element mit Klasse `.rich-editor` abdeckt — `#wiki-content` trägt diese Klasse.

Da ein Listener auf dem Zielelement selbst unabhängig von Capture/Bubble-Konfiguration in der "At-Target"-Phase feuert, laufen bei jedem echten Paste-Event auf `#wiki-content` **beide** Listener und rufen `handleEditorPaste()` zweimal auf. Dies ist kein Artefakt des synthetischen `ClipboardEvent`-Test-Setups, sondern ein **vorbestehender, unabhängig von execCommand existierender Doppel-Registrierungs-Bug**, der jeden echten Paste-Vorgang in `#wiki-content` betrifft (Tabellen-Paste, Tab-getrennter Text, Plaintext — alle drei Call-Sites 615/637/642).

## Offene Baseline-Entscheidung

**Status: ENTSCHIEDEN (2026-07-25, Task 3, `checkpoint:decision` — vom Entwickler getroffen).**

### Entwickler-Entscheidung (wörtlich)

> 1. **Hauptentscheidung: `option-a` — Konstanten wiederherstellen, reparierten Zustand als Baseline setzen.** Begründung des Entwicklers: Beide Toolbars müssen testbar sein, EDIT-02 („beide Toolbars funktionieren unverändert") muss beweisbar sein; die Wiederherstellung ist das Rückgängigmachen einer Fremd-Regression, kein neues Feature. Die einmalige Verschiebung des Ist-Zustands vor dem Einfrieren ist als bewusste, protokollierte Ausnahme zur Milestone-Leitplanke (v1.1 verhaltensneutral) zu dokumentieren. Das gilt für BEIDE Befunde: (a) fehlende Konstanten EDITOR_FONTS/TOOLBAR_DIMENSIONS, (b) Signatur-Mismatch im setEditorFont()/setEditorFontSize()-Wiring der statischen Toolbar.
> 2. **A4-Teilentscheidung: Einfrieren + Phase 10 vormerken.** Das heutige Verhalten (Durchstreichen überlebt Speichern/Reload nicht, sanitizeHTML erlaubt `<s>` aber nicht `<strike>`) wird als vorbestehender Zustand in der Baseline eingefroren; zusätzlich wird der Fund als Datenintegritäts-Item für Phase 10 vorgemerkt.

### Konsequenzen für die weiteren Pläne dieser Phase

- **Option A (Hauptentscheidung):** Bevor das Regressionsnetz (Pläne 09-02..09-04) gegen den Font-/Toolbar-Pfad Assertions schreibt, muss Plan 09-02 (siehe Artefakt-Liste oben, "Bedingt (nur bei Entscheidung `option-a`)") die Reparatur umsetzen — konkret die drei in Task 3 beschriebenen mechanischen Teilschritte:
  1. `EDITOR_FONTS` und `TOOLBAR_DIMENSIONS` in `core/constants.js` definieren und exportieren (namespaced + Legacy-`window.*`, konsistent mit dem bestehenden Muster).
  2. Die funktions-lokalen `const … = window.…`-Zugriffe in `ui/editors/rich-text.js` durch direkten `window.*`-Zugriff ersetzen (Build-Dedup-Pass-Konflikt vermeiden, CLAUDE.md „Duplicate Declaration Debugging Pattern").
  3. Den Argument-Mismatch in `ui/actions/system-actions.js:43–52` (`setEditorFont(editorId, font)`/`setEditorFontSize(editorId, size)` übergeben Strings, die Funktionen erwarten ein `<select>`-Element) auflösen.
  - Erst NACH dieser Reparatur gilt der reparierte Zustand als eingefrorene Baseline (D-04a-Doppel-Grün-Gate in 09-05 läuft gegen den reparierten Zustand).
  - Diese Reparatur ist eine bewusste, protokollierte Ausnahme zur Milestone-v1.1-Leitplanke „verhaltensneutral" — sie behebt eine Fremd-Regression (nie funktionsfähiger Font-Picker + nie erreichbare floating Toolbar), kein neues Feature. Nutzer-sichtbares Verhalten wird dadurch tatsächlich SICHTBAR verändert (Font-Picker + floating Toolbar werden erstmals bedienbar) — dies ist gewollt und hier ausdrücklich autorisiert.
- **Fund 1 (floating Toolbar per Mausklick komplett unbedienbar)** ist eine direkte Folge derselben `TOOLBAR_DIMENSIONS`-Lücke (siehe „Zusätzliche Funde" oben) und wird durch dieselbe Reparatur mitbehoben.
- **Fund 3 (Doppel-Paste-Listener)** ist von dieser Entscheidung NICHT betroffen — bleibt als vorbestehender Bug dokumentiert, keine Reparatur in dieser Phase vorgesehen (außerhalb des Task-3-Entscheidungsrahmens; ggf. eigener Fund für Phase 10/11).
- **A4 (Strikethrough-Persistenz):** Bleibt eingefroren wie gemessen (`<strike>` überlebt Speichern/Reload nicht, `sanitizeHTML()`-Whitelist kennt `s` aber nicht `strike`). Kein Code-Fix in Phase 9. Als Datenintegritäts-Item für Phase 10 vorgemerkt (SEC-01/SEC-02-Nachbarschaft, analog zum bereits vorgemerkten `saveSpell()`-sanitizeHTML-Fund).

<!-- Entschieden in Task 3 (Plan 09-01), 2026-07-25. Umsetzung der Reparatur erfolgt in Plan 09-02 ("Setze die in 09-01 getroffene Baseline-Entscheidung im Code um"). -->

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Plan: 09-01, Task 2*
*Erhoben: 2026-07-25*
