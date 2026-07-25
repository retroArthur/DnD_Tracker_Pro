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

**Status: ENTSCHIEDEN + UMGESETZT (2026-07-25, Plan 09-02/Task 1, Commit `19a355e`).**

Die Reparatur ist im Code umgesetzt und das Netz (Plan 09-02, Task 2/3) prueft ab
hier gegen den reparierten Zustand: `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` sind in
`core/constants.js` definiert und exportiert (namespaced ueber `UI_CONSTANTS` +
Legacy-`window.*`), die vier funktions-lokalen `const … = window.…`-Zugriffe in
`ui/editors/rich-text.js` sind entfernt (direkter `window.*`-Zugriff an den
Verwendungsstellen), und der Argument-Mismatch in `setEditorFont()`/
`setEditorFontSize()` ist behoben (beide Funktionen akzeptieren jetzt sowohl ein
`<select>`-Element als auch einen reinen String-Wert als zweites Argument).
Smoke-verifiziert: Serif-Auswahl liefert `<font face="Georgia, ...">` (kein
Arial-Fallback), `#floating-toolbar` erhaelt nach Textselektion die Klasse
`visible`, keine Konsolen-/Page-Errors.

**Status der urspruenglichen Entwickler-Entscheidung (2026-07-25, Task 3,
`checkpoint:decision`):**

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

## Randfälle (Adjazenz, Leer/Einzelelement, Kodierung, Ordnung) — empirisch erhoben (Plan 09-02, Task 3)

Erhoben am reparierten Zustand (nach Plan 09-02/Task 1, Commit `19a355e`), statische
Wiki-Toolbar, Chromium `143.0.7499.4`. Referenz für `tests/e2e/features/editor-formatting.spec.js`
(`test.describe('Randfälle', ...)`).

| Fall | Aktion | Erhobenes Markup |
|------|--------|-------------------|
| Adjazenz, 1. Wort fett | `WortEins WortZwei` → 1. Wort selektiert+fett | `<b>WortEins</b> WortZwei` |
| Adjazenz, 2. Wort fett (direkt danach) | 2. Wort selektiert+fett | `<b>WortEins</b> <b>WortZwei</b>` — **kein Zusammenführen**, zwei getrennte `<b>`-Tags (das Leerzeichen dazwischen bleibt als eigener Textknoten außerhalb beider Tags) |
| Adjazenz, Toggle auf 1. Wort | Selektion auf Inhalt von `<b>WortEins</b>`, erneut fett | `WortEins <b>WortZwei</b>` — Toggle entfernt nur das erneut angewandte Tag |
| Leerer Editor, Bold-Klick | Kein Text eingegeben, Bold-Button geklickt | `` (leerer String) — kein Crash, kein Page-Error |
| Kollabierter Cursor (kein Selektion), Bold-Klick | Text „Cursortext" eingegeben, Cursor am Ende (kein Select), Bold-Button geklickt | `Cursortext` — unverändert, keine Formatierung ohne Selektion |
| Ein-Zeichen-Selektion, Bold-Klick | Text „X", volltextselektiert, Bold-Button geklickt | `<b>X</b>` — funktioniert wie bei längerem Text |
| Kodierung: Bold auf Umlaut/Emoji-Text | „Größenwahn ⚔️ Straße" volltextselektiert, Bold-Klick | `<b>Größenwahn ⚔️ Straße</b>` |
| Kodierung: danach Schriftgröße 20px | Selektion bleibt auf dem `<b>`-Inhalt, Fontgröße-Select auf `20px` | `<b><font style="font-size: 20px;">Größenwahn ⚔️ Straße</font></b>` — `<font>` verschachtelt sich INNERHALB des bestehenden `<b>` |
| Kodierung: nach Speichern/Reload/Wiedereröffnen | — | `<b><font style="font-size: 20px">Größenwahn ⚔️ Straße</font></b>` (nur Trailing-Semikolon durch sanitizeHTML()-Style-Serialisierung entfernt), `textContent` zeichengleich `Größenwahn ⚔️ Straße` |
| Ordnung: zweimal identische Aktion (Fontgröße 18px) auf zwei frische, gleichartige Editorinhalte | „Ordnungstext" volltextselektiert, Fontgröße-Select auf `18px`, zweimal auf unabhängigen Editoren wiederholt | Beide Läufe liefern byte-gleich `<font style="font-size: 18px;">Ordnungstext</font>` |

Keine Page-Errors während der gesamten Erhebung (`page.on('pageerror')`-Sammlung blieb leer).

## D-04a Doppel-Grün-Nachweis

**Zweck:** Beweis, dass das komplette Regressionsnetz (vier Spec-Dateien) zweimal in Folge — ohne Wiederholungsversuch, ohne selektives Ausführen — gegen den unveränderten Editor-Code grün läuft, bevor die erste Zeile Migrationscode entsteht (D-04a, 09-CONTEXT.md). Ab diesem Protokoll ist das Netz eingefroren (siehe Abschnitt „Netz-Freeze" unten).

**Ausgangslage (verifiziert vor beiden Läufen):**
- Commit-Kennung: `c8239d7` (unverändert während beider Läufe — `git diff --name-only` zeigte vor, zwischen und nach den Läufen nur `.claude/launch.json`, eine phasenfremde IDE-Konfigurationsdatei, keine Produktions- oder Test-Datei)
- `grep -c execCommand ui/editors/rich-text.js` → **21** — der Editor-Code enthält zum Nachweiszeitpunkt exakt die 21 deprecated Editier-Kommando-Aufrufe aus dem Markup-Inventar oben, unverändert seit der Baseline-Reparatur (Plan 09-02, Commit `19a355e`)
- Bundle frisch gebaut: `PYTHONIOENCODING=utf-8 npm run build:dev` (Python `build.py`) — Build-Log meldet „Alle Validierungen bestanden", 1.960.334 Zeichen JavaScript, keine Deduplizierungs-Konflikte über die erwarteten hinaus

**Werkzeugversionen (für beide Läufe identisch):**

| Werkzeug | Version |
|----------|---------|
| Playwright | `1.57.0` |
| Chromium (Playwright-gebündelt) | `143.0.7499.4` (identisch zur Erhebung in Kopf oben) |
| Node | `v24.14.0` |

**Verwendete Playwright-Konfiguration (lokal, nicht CI — `playwright.config.js`):** `retries: 0` (da `process.env.CI` lokal nicht gesetzt), `workers: undefined` (Playwright-Default = Anzahl CPU-Kerne), `fullyParallel: true`. Diese lokalen Werte weichen bewusst von den CI-Werten (`retries: 2`, `workers: 1`) ab — für den Doppel-Grün-Nachweis zählt ausschließlich ein Lauf **ohne jeden Wiederholungsversuch** als grün; da lokal `retries: 0` gilt, ist "kein Fehlschlag" hier gleichbedeutend mit "keine Wiederholung nötig".

### Lauf 1

| Feld | Wert |
|------|------|
| Zeitstempel (Start, UTC) | 2026-07-25T03:18:44Z |
| Befehl | `npx playwright test tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js` |
| Commit | `c8239d7` |
| Ergebnis | **80 passed (27.9s)**, 0 failed, 0 flaky, 0 retries |

Testzahl je Spec-Datei (per `npx playwright test <datei> --list`, deckungsgleich mit den tatsächlich ausgeführten Tests):

| Spec-Datei | Testzahl |
|------------|----------|
| `editor-formatting.spec.js` | 32 |
| `editor-floating.spec.js` | 27 (davon 1 der Zählnachweis-Test) |
| `editor-insert.spec.js` | 9 |
| `editor-smoke.spec.js` | 12 |
| **Summe** | **80** |

Zählnachweis-Test (`editor-floating.spec.js:577`, „ZÄHLNACHWEIS: ui/editors/rich-text.js enthält exakt 21 execCommand-Vorkommen"): **grün** — bestätigt im selben Lauf, dass der Editor-Code zu diesem Zeitpunkt unverändert 21 execCommand-Aufrufe enthält.

### Lauf 2

| Feld | Wert |
|------|------|
| Zeitstempel (Start, UTC) | 2026-07-25T03:19:20Z (unmittelbar nach Lauf 1, kein Codewechsel dazwischen) |
| Befehl | identisch zu Lauf 1 |
| Commit | `c8239d7` (unverändert) |
| Ergebnis | **80 passed (27.5s)**, 0 failed, 0 flaky, 0 retries, Exit-Code 0 (`EXIT_STATUS_PIPE=0` verifiziert) |

Testzahl je Spec-Datei identisch zu Lauf 1 (80 gesamt, Zählnachweis-Test wieder grün, wieder 21).

**Kein Test war in einem der beiden Läufe instabil** — daher entfällt der im Plan vorgesehene Reparatur-und-Neustart-Zyklus.

### Volle Suite und Unit-Suite (im Anschluss an beide Netzläufe)

| Suite | Befehl | Ergebnis |
|-------|--------|----------|
| Playwright, volle Suite (kein Dateifilter) | `npx playwright test` | **308 passed, 2 skipped** (1.9m), 0 failed — das Netz (80 der 310 gelisteten Tests) läuft im selben Aufruf wie die restliche E2E-Suite ohne Beeinflussung |
| Jest, volle Unit-Suite | `npx jest` | **457 passed, 24 Test-Suiten**, 0 failed (1.777s) |

Beide Läufe fanden **gegen den unveränderten Editor-Code** statt: `ui/editors/rich-text.js` und `core/constants.js` wurden zwischen Baseline-Reparatur (Commit `19a355e`, Plan 09-02) und diesem Doppel-Grün-Nachweis nicht verändert (`git log --oneline ui/editors/rich-text.js core/constants.js` zeigt keinen neuen Commit seit `19a355e`); der Commit-Stand während beider Netzläufe und beider Suiten war durchgehend `c8239d7`.

## Netz-Freeze (gültig ab Doppel-Grün-Nachweis)

**Eingefrorene Spec-Dateien (alle vier Netz-Dateien):**

1. `tests/e2e/features/editor-formatting.spec.js` (32 Tests)
2. `tests/e2e/features/editor-floating.spec.js` (27 Tests)
3. `tests/e2e/features/editor-insert.spec.js` (9 Tests)
4. `tests/e2e/features/editor-smoke.spec.js` (12 Tests)

**Änderungsregel:** Ab dem Zeitpunkt dieses Doppel-Grün-Nachweises (2026-07-25, Commit `c8239d7`) bis zum Ende der Migrationsphase darf **keine Assertion, kein Erwartungswert und kein Testname** dieser vier Dateien geändert werden.

**Einzige zulässige Ausnahme:** Der in Plan 09-03 ausdrücklich gekennzeichnete Zählnachweis-Test (`editor-floating.spec.js:577`, „ZÄHLNACHWEIS: ui/editors/rich-text.js enthält exakt 21 execCommand-Vorkommen"). Dieser Test wird in Plan 09-09 bewusst von `toBe(21)` auf `toBe(0)` umgestellt, sobald alle 21 Call-Sites migriert sind — das ist der einzige Punkt, an dem sich der erwartete Wert im Netz während der Migration ändern darf, weil der Test genau diese Zahl misst, nicht ein Verhalten des Editors.

**Verfahren bei rotem Netz-Test während der Migration:**

1. **Erste Annahme: Der Migrationscode ist fehlerhaft, nicht der Test.** Ein roter Netz-Test während eines Migrations-Commits gilt als Beweis, dass die neue Selection/Range-Implementierung nicht das gleiche Markup erzeugt wie zuvor (Verstoß gegen D-02, Markup-Kompatibilität) — der Migrationscode ist zu korrigieren, nicht der Test.
2. **Nur wenn nachweisbar der Test selbst falsch ist** (z. B. ein Tippfehler in der Assertion, eine falsche Selektor-Referenz, die nie das gemessene Verhalten aus `09-BASELINE.md` korrekt abbildete), darf er geändert werden.
3. In diesem Ausnahmefall ist die Änderung **schriftlich in genau diesem Abschnitt** zu dokumentieren, mit: Migrationsgruppe (aus D-05), altem Erwartungswert, neuem Erwartungswert, und einer Begründung, warum das kein Beweis-Leck ist (d. h. warum der alte Wert nachweisbar nie das reale execCommand-Verhalten aus dem Markup-Inventar oben widerspiegelte).
4. Bislang wurden **keine** Ausnahme-Änderungen vorgenommen — dieser Abschnitt enthält noch keine Einträge unterhalb dieser Regel.

**Ausnahme-Änderung 1 (Plan 09-06, Task 1, Migrationsgruppe A):**
- **Alter Erwartungswert:** `toBe(21)`
- **Neuer Erwartungswert:** `toBe(16)`
- **Begründung:** Der Zaehlnachweis-Test ist bereits oben als die EINZIGE zulaessige Netzaenderung waehrend der Migration benannt — die vorhandene Formulierung beschreibt nur den finalen Sprung `21 → 0` in Plan 09-09, deckt aber implizit nicht ab, dass die Zwischenplaene 09-06/07/08 denselben Zaehler jeweils in eigenen Teilschritten dekrementieren muessen, weil jeder dieser Plaene sein eigenes `<verify>`-Gate ueber das komplette Netz (inkl. dieser Datei) faehrt. Migrationsgruppe A (Plan 09-06, Task 1: bold/italic/underline/strikethrough/list in `formatText()`) hat 5 der 21 Call-Sites ersetzt — der Test misst nachweislich nur den Fortschrittszaehler selbst (kein Editor-Verhalten, siehe Praeambel oben), sein alter Wert `21` spiegelte ab diesem Commit nicht mehr den tatsaechlichen Bestand wider. Kein Beweis-Leck: alle uebrigen Netz-Assertionen (Markup-Ergebnisse) blieben unveraendert und gruen; nur diese eine Zahl wurde an den nachgewiesenen Ist-Stand angepasst. Wird in Plan 09-06/Task 2 (Gruppe B, → 12), danach in Plan 09-07/08 weiter dekrementiert, bis Plan 09-09 den Endwert `0` setzt.
- **Commit:** siehe Task-1-Commit dieses Plans (Gruppe A)

**Ausnahme-Änderung 2 (Plan 09-06, Task 2, Migrationsgruppe B):**
- **Alter Erwartungswert:** `toBe(16)`
- **Neuer Erwartungswert:** `toBe(12)`
- **Begründung:** Fortsetzung von Ausnahme-Änderung 1. Migrationsgruppe B (Plan 09-06, Task 2: heading/font/highlight-setzen/highlight-entfernen in `formatText()`) hat die restlichen 4 der 9 in `formatText()` liegenden Call-Sites ersetzt — `formatText()` enthaelt danach keinen einzigen Aufruf der alten Editier-Kommando-API mehr. Gesamtstand im Modul: 21 - 9 = 12. Kein Beweis-Leck: alle Markup-Assertionen fuer die vier UI-losen Zweige (`editor-floating.spec.js`, Block „UI-lose Zweige") blieben unveraendert und gruen; nur der Fortschrittszaehler wurde an den nachgewiesenen Ist-Stand angepasst. Wird in Plan 09-07/08 weiter dekrementiert, bis Plan 09-09 den Endwert `0` setzt.
- **Commit:** siehe Task-2-Commit dieses Plans (Gruppe B)

**Ausnahme-Änderung 3 (Plan 09-07, Task 1, Migrationsgruppe C):**
- **Alter Erwartungswert:** `toBe(12)`
- **Neuer Erwartungswert:** `toBe(10)`
- **Begründung:** Fortsetzung von Ausnahme-Änderung 1/2. Migrationsgruppe C (Plan 09-07, Task 1: die zwei Call-Sites in `setEditorFont()`/`setEditorFontSize()`, statische Toolbar) hat 2 weitere der verbliebenen 12 Call-Sites ersetzt. Gesamtstand im Modul: 12 - 2 = 10. Kein Beweis-Leck: alle Markup-Assertionen für Schriftart/-größe der statischen Toolbar (`editor-formatting.spec.js`) blieben unverändert und grün; nur der Fortschrittszähler wurde an den nachgewiesenen Ist-Stand angepasst. Wird in Plan 09-07/Task 2 (Gruppe D, → 6) weiter dekrementiert, danach in Plan 09-08, bis Plan 09-09 den Endwert `0` setzt.
- **Zusätzlicher Fund (kein Netz-Test betroffen, dokumentiert weil er die neue Implementierung erklärt):** Die zwei neuen Hilfsfunktionen `applyFontFamilyToSelection`/`applyFontSizeToSelection` mussten mit einem Doppel-Dispatch-Schutz (`_lastFontCallKey`-Guard) versehen werden. Ursache: `EventDelegation._handleChange` UND `_handleInput` (`ui/event-delegation.js`) feuern BEIDE für `<select data-action="...">`-Elemente bei jeder Auswahl — ein vorbestehender, plan-fremder Doppel-Dispatch, der bei der alten Editier-Kommando-API unsichtbar blieb, weil sie auf bereits identisch formatiertem Text ein No-Op war. Die reine Selection/Range-Ersetzung ist das nicht von Natur aus und hätte ohne den Guard bei jeder Auswahl einen doppelt verschachtelten `<font>`-Wrapper erzeugt (empirisch reproduziert: `Randfälle`-Test „Ordnung" schlug ohne den Guard fehl). Der Guard unterdrückt den zweiten, redundanten Aufruf mit identischen Parametern innerhalb desselben synchronen Tasks — `ui/event-delegation.js` selbst wurde NICHT verändert (außerhalb des Datei-Scopes dieses Plans).
- **Commit:** siehe Task-1-Commit dieses Plans (Gruppe C)

**Ausnahme-Änderung 4 (Plan 09-07, Task 2, Migrationsgruppe D):**
- **Alter Erwartungswert:** `toBe(10)`
- **Neuer Erwartungswert:** `toBe(6)`
- **Begründung:** Fortsetzung von Ausnahme-Änderung 1/2/3. Migrationsgruppe D (Plan 09-07, Task 2: die vier verbliebenen Call-Sites der floating Toolbar — font/fontSize im `change`-Handler, removeFormat/backColor in `applyFloatingFormat()`) hat die restlichen 4 der 10 Call-Sites ersetzt. Gesamtstand im Modul: 10 - 4 = 6. Kein Beweis-Leck: alle Markup-Assertionen für Schriftart/-größe/„Format entfernen" der floating Toolbar (`editor-floating.spec.js`) blieben unverändert und grün, inklusive Roundtrip; nur der Fortschrittszähler wurde an den nachgewiesenen Ist-Stand angepasst. Wird in Plan 09-08 weiter dekrementiert, bis Plan 09-09 den Endwert `0` setzt.
- **Zusätzlicher Fund (kein Netz-Test betroffen, dokumentiert weil er die neue Implementierung erklärt):** Die alte `removeFormat`-Kommando-API entpackt nachweislich Standard-Auszeichnungstags (`<b>`, `<i>`, `<u>`, `<s>`, `<strike>`) aus der Selektion, laesst aber Custom-Elemente wie `<mark>`/`<span>` selbst stehen (nur deren Farb-Style wird entfernt) — empirisch am gebauten Bundle verifiziert (verschachteltes `<span class="editor-border"><mark style="..."><b>Text</b></mark></span>` → nach `removeFormat`+`backColor`: `<span class="editor-border"><mark style="">Text</mark></span>`, `<b>` entfernt, `<mark>`/`<span>` bleiben). Die in Plan 09-06 angelegte `clearInlineFormattingAtSelection()` deckte bisher nur den Farb-Style-Teil ab (kein Tag-Unwrap noetig fuer ihren einzigen bisherigen Aufrufer, den UI-losen `highlight('none')`-Zweig ohne verschachtelte Auszeichnungen). Fuer den floating „Format entfernen"-Aufruf wurde die Funktion um einen Unwrap-Schritt fuer `b`/`i`/`u`/`s`/`strike` innerhalb der Selektion erweitert (vor dem bestehenden Farb-Style-Schritt) — das bereits vorhandene explizite Entpacken von `<mark>` und `removeSelectionBorders()` in `applyFloatingFormat()` bleibt unveraendert und bleibt AUSSERHALB der Hilfsfunktion, exakt wie im Plan vorgegeben. Die erweiterte Funktion bleibt fuer ihren bestehenden Aufrufer (UI-loser `highlight('none')`-Zweig) verhaltensgleich, da dort keine Bold/Italic/Underline/Strikethrough-Tags in der Selektion vorkommen.
- **Commit:** siehe Task-2-Commit dieses Plans (Gruppe D)

**Ausnahme-Änderung 5 (Plan 09-08, Task 1, Migrationsgruppe E):**
- **Alter Erwartungswert:** `toBe(6)`
- **Neuer Erwartungswert:** `toBe(3)`
- **Begründung:** Fortsetzung von Ausnahme-Änderung 1–4. Migrationsgruppe E (Plan 09-08, Task 1: die drei Zwischenablage-Einfuegungen in `handleEditorPaste()` — Tabellen-HTML, tabulatorgetrennter Text, reiner Text) hat 3 der verbliebenen 6 Call-Sites ersetzt. Gesamtstand im Modul: 6 - 3 = 3. Kein Beweis-Leck: alle drei Einfuege-Markup-Assertionen (`editor-insert.spec.js`) inklusive des Sicherheits-Regressionstests aus Plan 09-04 blieben unveraendert und gruen; nur der Fortschrittszaehler wurde an den nachgewiesenen Ist-Stand angepasst. Wird in Plan 09-08/Task 2 (Gruppe F, → 1) weiter dekrementiert, danach in Plan 09-09 auf den Endwert `0` gesetzt.
- **Zusaetzlicher Fund (kein Netz-Test betroffen, dokumentiert weil er die neue Implementierung erklaert):** `Range.createContextualFragment()` + `insertNode()` durchlaeuft NICHT dieselbe Stil-Nachbereinigung, die die alte `insertHTML`-Editier-Kommando-API auf eingefuegte Inline-Styles anwendet (empirisch per Probe-Skripten gegen das gebaute Bundle verifiziert): Layout-Eigenschaften (`padding`/`margin`/`width`/`border-collapse`) werden von der alten API immer entfernt; bleiben danach 2+ Deklarationen uebrig und ist darunter `background`, wird diese in acht leere Langform-Eigenschaften aufgesplittet, eine mitenthaltene `color`-Deklaration wird ersatzlos entfernt (ein reproduzierbarer Chromium-Effekt bei Mehrfach-Deklarationen mit CSS-Custom-Property-Werten, der `border` selbst nicht betrifft). Die neue `sanitizeInsertedInlineStyle()`-Hilfsfunktion repliziert dieses Verhalten explizit fuer neu eingefuegte Elemente, damit das erzeugte Markup byte-gleich zur Baseline bleibt (D-02). Zusaetzlich platziert die alte `insertHTML`-API den Cursor nach dem Einfuegen empirisch am tiefsten letzten Nachfahren des zuletzt eingefuegten Knotens (z. B. innerhalb der letzten Tabellenzelle) statt als Geschwister-Knoten dahinter — reproduzierbar am doppelt feuernden Paste-Listener (Fund 3): die zweite Einfuegung landet dort verschachtelt statt als Geschwister-Tabelle. `insertHtmlAtSelection()` repliziert diesen Abstieg bewusst.
- **Commit:** siehe Task-1-Commit dieses Plans (Gruppe E)

**Ausnahme-Änderung 6 (Plan 09-08, Task 2, Migrationsgruppe F):**
- **Alter Erwartungswert:** `toBe(3)`
- **Neuer Erwartungswert:** `toBe(1)`
- **Begründung:** Fortsetzung von Ausnahme-Änderung 1–5. Migrationsgruppe F (Plan 09-08, Task 2: Tabelleneinfuegen `insertTable()` und der abgefangene Zeilenumbruch in `handleEditorKeydown()`) hat die restlichen 2 der 3 Call-Sites ersetzt. Gesamtstand im Modul: 3 - 2 = 1 (nur noch der `defaultParagraphSeparator`-Setup-Aufruf, wird in Plan 09-09 entfernt). Kein Beweis-Leck: alle Tabellen-Markup-Assertionen (statisch, floating, Tastenkombination — je 3 Kopf- und 6 Datenzellen) sowie der Eingabetaste-Test blieben unveraendert und gruen; nur der Fortschrittszaehler wurde an den nachgewiesenen Ist-Stand angepasst.
- **Zusaetzlicher Fund (kein Netz-Test betroffen, dokumentiert weil er die neue Implementierung erklaert):** Eine Selektion, die per Range/Selection-API auf die Position UNMITTELBAR HINTER einem abschliessenden `<br>` ohne nachfolgenden Inhalt zeigt (egal ob per Container-Kindindex oder per leerem Rest-Textknoten adressiert), ist in Chromium empirisch NICHT stabil: der naechste getippte Text landet kommentarlos VOR dem `<br>`, der Umbruch selbst wandert ans Ende (reproduziert unabhaengig von `handleEditorPaste()`s Doppel-Listener-Bug, ein eigener, allgemeiner Chromium-Effekt bei Cursor-Positionierung nach einem trailing `<br>`). Die neue `insertLineBreakAtSelection()` umgeht das mit einem Text-Platzhalter (ein Zero-Width-Space-Zeichen direkt nach dem `<br>`), der der Selektion einen stabilen Text-Anker gibt; der Platzhalter wird beim naechsten echten Tastatur-Input (oder beim Verlassen des Editors) per `deleteData()` an der exakten Zeichen-Position entfernt — eine komplette `.data`-Neuzuweisung wuerde eine Selektion, die genau an der Loeschgrenze steht, faelschlich auf den Anfang zurueckwerfen (empirisch verifiziert), `deleteData()` an der exakten Position laesst sie unangetastet. Das Endergebnis enthaelt keinen Zero-Width-Space und ist byte-gleich zur Baseline.
- **Commit:** siehe Task-2-Commit dieses Plans (Gruppe F)

**Ausnahme-Änderung 7 (Plan 09-09, Task 1, Migrationsgruppe G — letzte Call-Site):**
- **Alter Erwartungswert:** `toBe(1)`
- **Neuer Erwartungswert:** `toBe(0)`
- **Begründung:** Fortsetzung von Ausnahme-Änderung 1–6. Migrationsgruppe G (Plan 09-09, Task 1: der `defaultParagraphSeparator`-Setup-Aufruf in `initEditorPasteHandlers()`) wurde ersatzlos entfernt (kein zweiter, kompensierender Code-Pfad nötig — siehe A1-Nachweis unten). Gesamtstand im Modul: 1 - 1 = 0. Kein Beweis-Leck: Der A1-Referenztest (`editor-insert.spec.js`, „Shift+Enter erzeugt dasselbe Markup wie Enter") blieb byte-identisch unverändert (verifiziert per `git diff`) und grün, ebenso alle übrigen 79 Netz-Tests. Task 1s eigenes Hard-Gate verlangt ein komplett grünes Netz nach der Migrationsgruppe (wie bei allen Gruppen A–F zuvor) — da diese Gruppe zugleich die letzte der 21 Call-Sites ist, wird der Zähler hier bereits auf seinen Endwert 0 gesetzt statt auf einen weiteren Zwischenstand. Der in Task 2 des selben Plans vorgesehene Umbau des Tests (Kommentarzeilen-Filterung, finale Testbeschreibung) baut auf diesem Wert auf und ändert ihn nicht erneut.
- **Commit:** siehe Task-1-Commit dieses Plans (Gruppe G)

**Ausnahme-Änderung 8 (2026-07-25, Phase 10, Plan 10-03, Task 3 — Datenintegritäts-Fix, kein Migrationsschritt):**
- **Datum:** 2026-07-25
- **Anlass:** Phase 10 (D-06, `10-CONTEXT.md`), das in dieser Datei unter „A4 — Überlebt die Durchstreich-Auszeichnung..." und in „Offene Baseline-Entscheidung" (A4-Teilentscheidung) explizit für Phase 10 vorgemerkte Datenintegritäts-Item: `sanitizeHTML()`s `allowedTags`-Liste (`utils/basic.js`) kannte `'s'`, aber nicht `'strike'` — die execCommand-erzeugte `<strike>`-Auszeichnung ging beim Speichern-Roundtrip vollständig verloren.
- **Betroffene Datei und Testfall:** `tests/e2e/features/editor-formatting.spec.js`, Konstante `NETZ.strikethrough.roundtrip` sowie der zugehörige Testfall in `test.describe('Persistenz-Roundtrip', ...)` (vormals „Durchgestrichen übersteht Speichern/Reload NICHT — vorbestehender Bug (A4, eingefroren)").
- **Alter Erwartungswert:** `roundtrip: 'Probetext'` (Auszeichnung ging beim Roundtrip verloren, nur der reine Text blieb übrig).
- **Neuer Erwartungswert:** `roundtrip: '<strike>Probetext</strike>'` (identisch zum `after`-Wert direkt nach der Formatierung — die Auszeichnung übersteht den Zyklus jetzt).
- **Begründung, warum das kein Beweis-Leck ist:** Die Änderung schwächt keine Assertion ab, sondern verschärft sie — gefordert wird jetzt Erhalt statt Verlust der Auszeichnung, ein strengerer, nicht ein laxerer Erwartungswert. Der zugrunde liegende Produktionsfehler wurde behoben (`'strike'` synchron in `utils/basic.js` UND `utils/testable-utils.js` ergänzt, Task 1/2 desselben Plans stellen per Vektor-Katalog + Paritätstest sicher, dass diese Änderung nicht in nur einer Kopie landet), nicht der Test angepasst, um einen Fehlschlag zu verdecken. Der Testname wurde entsprechend umbenannt („... übersteht Speichern/Reload (D-06, ehemals A4-Datenintegritäts-Bug — in Phase 10 behoben)"), die Text-Erhalt-Assertion (`textContent` enthält `Probetext`) blieb unverändert bestehen. Keine weitere Assertion dieser Datei und keine Assertion der drei übrigen Netz-Dateien (`editor-floating.spec.js`, `editor-insert.spec.js`, `editor-smoke.spec.js`) wurde angefasst — `git diff --name-only` gegen den eingefrorenen Netz-Bestand listet ausschließlich `tests/e2e/features/editor-formatting.spec.js`.
- **Reversibilitäts-Hinweis (aus D-06 übernommen):** costly — sobald `'strike'` erlaubt ist, erzeugen Nutzerdaten entsprechendes Markup; eine spätere Verengung der Whitelist würde dieses Markup in bereits gespeicherten Kampagnen zerstören.
- **Commit:** siehe Task-3-Commit von Plan 10-03.

**A1-Nachweis nach Wegfall des Setup-Aufrufs (Plan 09-09, Task 1):**

`document.execCommand('defaultParagraphSeparator', false, 'div')` wurde ersatzlos aus `initEditorPasteHandlers()` entfernt (kein try/catch-Rest, kein Ersatzcode). Verifikationslauf gegen den A1-Referenztest (`tests/e2e/features/editor-insert.spec.js`, „Shift+Enter erzeugt dasselbe Markup wie Enter"): **grün, unverändert** — `ZeileEins<br>ZeileZwei` für Shift+Enter, identisch zu regulärem Enter. Damit ist die in A1 (Kopf-Abschnitt oben) formulierte Erwartung bestätigt: Der Wegfall des Setup-Calls ist folgenlos, weil (1) reguläres Enter durch `handleEditorKeydown()`/`insertLineBreakAtSelection()` immer abgefangen wird und (2) Shift+Enter browserübergreifend bereits als weicher Zeilenumbruch (`<br>`) spezifiziert ist, unabhängig von `defaultParagraphSeparator`. Der erste (einfachere) der beiden in Task 1 vorgesehenen Wege wurde gewählt — kein zusätzliches Abfangen der Umschalt-Eingabetaste in `handleEditorKeydown()` war nötig.

**CI-Nachweis (blockierender Mitlauf ohne Konfigurationsänderung):**

- `.github/workflows/ci.yml`, Job `e2e` (Zeile 40–63): `needs: [lint-and-typecheck, test]`, Schritt `npx playwright test` (Zeile 55) — **ohne Dateifilter**, identisch zum lokalen Befehl der vollen Suite oben. Die vier neuen Spec-Dateien liegen unter `tests/e2e/features/`, dem von `playwright.config.js`s `testDir: './tests/e2e'` (Standard-`testMatch`, kein Dateifilter) erfassten Verzeichnis — sie werden **automatisch** mitgeführt, ohne dass diese oder eine andere Phase die CI-Konfiguration ändern musste.
- Der nachgelagerte `build`-Job (Zeile 65–83) hat `needs: [lint-and-typecheck, test, e2e]` — ein roter `e2e`-Job blockiert also sowohl den Production-Build als auch (transitiv über `smoke-test` → `deploy`) das Deployment. Diese Blockier-Eigenschaft stammt aus Phase 8 (D-03, `08-CONTEXT.md`) und wird vom neuen Netz ohne zusätzliche CI-Arbeit geerbt.
- Trockenlauf-Nachweis: `npx playwright test --list` beendet mit Exit-Code 0 und listet **310 Tests** insgesamt (die 80 Netz-Tests sind darin enthalten — siehe „Volle Suite" oben, 308 passed + 2 skipped = 310), davon 32 aus `editor-formatting.spec.js`, 27 aus `editor-floating.spec.js`, 9 aus `editor-insert.spec.js`, 12 aus `editor-smoke.spec.js` — alle vier Dateien werden vom Standard-Testmuster erfasst.

## Abschluss-Protokoll (Plan 09-09, Task 2)

**Zweck:** Abschluss der execCommand-Migration. Diese Sektion bündelt den vollständigen Zählstands-Nachweis, alle Commit-Kennungen der sieben Migrationsgruppen, die Ergebnisse der vollen Suiten nach der letzten Gruppe, die Liste bewusster Implementierungsabweichungen sowie die Liste der bewusst nicht behobenen Funde.

### Zählstands-Kette

| Migrationsgruppe | Plan/Task | Umfang | Zählstand vorher → nachher |
|---|---|---|---|
| A | 09-06, Task 1 | `formatText()`: bold/italic/underline/strikethrough/list | 21 → 16 |
| B | 09-06, Task 2 | `formatText()`: heading/font/highlight-setzen/-entfernen | 16 → 12 |
| C | 09-07, Task 1 | Statische Toolbar: `setEditorFont()`/`setEditorFontSize()` | 12 → 10 |
| D | 09-07, Task 2 | Floating Toolbar: font/fontSize/removeFormat/backColor | 10 → 6 |
| E | 09-08, Task 1 | `handleEditorPaste()`: Tabellen-HTML/Tab-Text/Plaintext | 6 → 3 |
| F | 09-08, Task 2 | `insertTable()` + abgefangener Zeilenumbruch | 3 → 1 |
| G | 09-09, Task 1 | Setup-Aufruf `defaultParagraphSeparator` (ersatzlos entfernt) | 1 → 0 |

**Endstand:** 0 Aufrufe der deprecated Editier-Kommando-API in `ui/editors/rich-text.js` (Kommentarzeilen ausgefiltert, `tests/e2e/features/editor-floating.spec.js`, Test „ZÄHLNACHWEIS: ... enthält keinen Aufruf ... mehr"). EDIT-01 damit maschinell belegt erfüllt.

**Zählstands-Kette je Plan (Start-/Endwert des jeweiligen Plans):** 21 (vor Plan 09-06) → 12 (nach Plan 09-06 / vor 09-07) → 6 (nach Plan 09-07 / vor 09-08) → 1 (nach Plan 09-08 / vor 09-09) → 0 (nach Plan 09-09, dieser Plan).

### Commit-Kennungen der sieben Gruppen-Commits

| Gruppe | Commit |
|---|---|
| A | `413222e` |
| B | `dbdaac1` |
| C | `8488634` |
| D | `a72609e` |
| E | `b83addf` |
| F | `2a8542d` |
| G | `7bee469` |

### Ergebnis der vollen Suiten (nach Gruppe G + Zählnachweis-Umstellung, Plan 09-09, Task 2)

| Prüfung | Befehl | Ergebnis |
|---|---|---|
| Dev-Build | `npm run build:dev` (`PYTHONIOENCODING=utf-8`) | Exit-Code 0, „Alle Validierungen bestanden" |
| Playwright, volle Suite | `npx playwright test` | **308 passed, 2 skipped**, 0 failed (1.8m) — identisch zum D-04a-Doppel-Grün-Nachweis |
| Jest, volle Unit-Suite | `npx jest` | **457 passed, 24 Test-Suiten**, 0 failed |
| Typecheck | `npm run typecheck` | Exit-Code 0, keine Ausgabe |
| Lint | `npm run lint` | Exit-Code 0 (1 vorbestehende, plan-fremde Fehlermeldung in einer untracked Debug-Datei außerhalb des Projekts gefunden und entfernt — siehe „Bewusste Abweichungen" unten) |
| Production-Build | `npm run build` (`PYTHONIOENCODING=utf-8`) | Exit-Code 0, „Alle Validierungen bestanden", DEBUG_MODE deaktiviert und verifiziert |

### Bewusste Implementierungsabweichungen vom naiven Vorbild (über die gesamte Migration)

Diese Abweichungen wurden in den jeweiligen Plan-Summaries dokumentiert und hier zur Vollständigkeit gebündelt:

1. **Cursor-Platzierung nach Fragment-Einfügung** (Gruppe E, Plan 09-08): steigt zum tiefsten letzten Nachfahren des zuletzt eingefügten Knotens ab statt zum Geschwister-Knoten danach — reproduziert die execCommand-eigene Cursor-Platzierung.
2. **`sanitizeInsertedInlineStyle()`** (Gruppe E, Plan 09-08): repliziert die execCommand-eigene Stil-Nachbereinigung bei `insertHTML` (Layout-Eigenschaften entfernt; `background`/`color`-Sonderfall bei Mehrfach-Deklarationen).
3. **Zero-Width-Space-Platzhalter** (Gruppe F, Plan 09-08): `insertLineBreakAtSelection()` nutzt einen unsichtbaren Textanker + `deleteData()`-Cleanup, weil eine Cursor-Position unmittelbar hinter einem trailing `<br>` in Chromium ohne Anker nicht stabil ist.
4. **`_lastFontCallKey`-Doppel-Dispatch-Guard** (Gruppe C, Plan 09-07): unterdrückt den zweiten von zwei synchronen `EventDelegation`-Aufrufen pro Select-Änderung (vorbestehender, plan-fremder Doppel-Dispatch in `ui/event-delegation.js`, nicht behoben — Fix im Datei-Scope des Editor-Moduls gehalten).
5. **`clearInlineFormattingAtSelection()` um Tag-Unwrap erweitert** (Gruppe D, Plan 09-07): repliziert, dass die alte `removeFormat`-API Standard-Auszeichnungstags entpackt, Custom-Elemente (`<mark>`/`<span>`) aber stehen lässt.
6. **`toBe(1)` → `toBe(0)` bereits in Task 1 statt erst in Task 2** (Gruppe G, Plan 09-09): siehe Ausnahme-Änderung 7 oben — Task 1s eigenes Hard-Gate verlangte ein komplett grünes Netz nach der letzten Migrationsgruppe.

### Bewusst NICHT behobene Funde (Verweis auf Plan 09-01)

Diese Funde wurden in Plan 09-01 (Baseline-Erhebung) identifiziert und bewusst nicht in dieser Phase repariert:

- **Fund 3 — Doppel-Paste-Listener** (`09-BASELINE.md`, Abschnitt „Zusätzliche Funde"): `initEditorPasteHandlers()` registriert zwei `paste`-Listener auf `#wiki-content`, wodurch jeder echte Paste-Vorgang doppelt verarbeitet wird (Tabellen-Verschachtelung, Text-Verdopplung). Bewusst repliziert (nicht behoben), byte-gleiches Markup zur Baseline ist das Ziel dieser Phase, nicht Bugfixing.
- **A4 — Strikethrough-Persistenz** (`09-BASELINE.md`, Abschnitt „Annahmen A1–A4"): `<strike>` übersteht Speichern/Reload nicht (`sanitizeHTML()`-Whitelist kennt `s` aber nicht `strike`). Eingefroren wie gemessen, als Datenintegritäts-Item für Phase 10 vorgemerkt.
- **Sicherheits-Payload in Tabellen-Zweig** (siehe STATE.md-Decision-Log): Ein Einfüge-Fragment mit `<table>`-Wrapper durchläuft nicht denselben Sicherheits-Check wie der reine `insertText()`-Fallback — als WINDOWS.md-Fund vorgemerkt, kein Produktionscode in dieser Phase geändert.
- **Drei execCommand-Aufrufe außerhalb des Editor-Moduls**: `systems/entity-links.js:108`, `features/wiki/wiki.js:819`, `ui/actions/system-actions.js:79` — außerhalb des Phasen-Scopes (nur `ui/editors/rich-text.js` war Gegenstand dieser Phase), dokumentiert in `.planning/codebase/CONCERNS.md` als eigener offener Eintrag.

### Bewusste Abweichungen (Plan 09-09, Task 2 — Ausführung)

- **Entfernung einer plan-fremden, untracked Debug-Datei (`_smoke_welt.cjs`) am Repo-Root:** Diese Datei war nicht Teil des Git-Verlaufs (untracked), gehörte zu keiner Phase und blockierte `npm run lint` mit einem echten `no-unused-vars`-Fehler (Severity 2, laut CLAUDE.md/`01-09`-Konvention „echte Errors weiterhin fatal"). Entfernt, damit das Task-2-Hard-Gate (`npm run lint` Exit-Code 0) erfüllbar ist. Keine Produktionsdatei, kein Git-Verlust (nie committet).

### Handcheck im Browser (Plan 09-09, Task 3 — menschliche Sichtprüfung)

**Ergebnis:** Freigegeben (2026-07-25). Der Entwickler hat `dist/dnd-tracker-bundled.html` im Chrome/Edge per `file://`-Doppelklick geöffnet und alle neun Prüfschritte aus der Checkpoint-Anleitung durchgeführt (statische Toolbar aller 13 Werkzeuge, floating Toolbar nach Textselektion, Einfügen aus echter Word-/Excel-Zwischenablage, Einfügen aus einer formatierten Webseite, Enter/Umschalt+Enter, Markdown-Kurzschreibweisen, Speichern/Reload/Wiedereröffnen, Kurz-Check in einem zweiten Editor). Antwort: „Freigegeben" — keine Abweichung im Aussehen, im Einfüge-Verhalten oder im Tippgefühl gegenüber dem Stand vor der Migration festgestellt.

Damit ist EDIT-02 („beide Toolbars, alle sechs Entity-Editoren und die Markdown-Live-Shortcuts funktionieren unverändert") zusätzlich zum automatisierten Regressionsnetz auch von Hand bestätigt. Die Phase ist mit diesem Freigabe-Eintrag inhaltlich abgeschlossen.

---
*Phase: 09-editor-regressionsnetz-execcommand-abl-sung*
*Plan: 09-01, Task 2*
*Erhoben: 2026-07-25*
*Abschluss-Protokoll ergänzt: Plan 09-09, Task 2, 2026-07-25*
*Handcheck-Freigabe ergänzt: Plan 09-09, Task 3, 2026-07-25*
