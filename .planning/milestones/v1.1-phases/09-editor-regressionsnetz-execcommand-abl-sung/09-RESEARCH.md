# Phase 9: Editor-Regressionsnetz & execCommand-Ablösung - Research

**Researched:** 2026-07-25
**Domain:** Browser-native Rich-Text-Editing (Selection/Range-DOM-APIs als Ersatz für deprecated `document.execCommand`), E2E-Regressionstests (Playwright), Non-ESM-Vanilla-JS-Architektur
**Confidence:** HIGH (Codebasis vollständig gelesen und per Grep verifiziert; State-of-the-Art zu execCommand per Websuche gegengeprüft)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Editor-Undo (Strg+Z)**
- **D-01: Status quo festschreiben.** Strg+Z löst überall das App-Daten-Undo aus — auch bei Fokus im Editor (`systems/spellslots/keyboard-shortcuts.js:66`: „immer aktiv", `preventDefault()`). Ein Text-/Formatierungs-Undo im Editor ist explizit KEIN Ziel dieser Migration. Akzeptierte Konsequenz: Das native Browser-Undo (heute nur übers Kontextmenü erreichbar) wirkt nach der Migration nicht mehr auf Formatierungen — ersatzlos. Das Regressionsnetz darf kein Text-Undo im Editor erwarten und dokumentiert diese Baseline.

**Markup-Kompatibilität**
- **D-02: Identisches Markup.** Die neue Selection/Range-Implementierung erzeugt exakt die Tags, die Chromium-execCommand heute erzeugt: `<b>`/`<i>`/`<u>`/`<strike>`, `<font face>`/`<font size>`, `<div>`-Absätze (defaultParagraphSeparator), backColor-Spans wie heute. Alt- und Neu-Inhalte sind ununterscheidbar; `sanitizeHTML`-Whitelist (`utils/basic.js:58`) und `assets/styles/editors.css` bleiben unangetastet. Die Toggle-Erkennung (ist Selektion bereits formatiert?) erkennt dieselben Tag-Formen wie heute. Konsequenz: Das Netz kann Verhaltensgleichheit über exakte Markup-Assertions beweisen.

**Regressionsnetz**
- **D-03: Prüfebene: Markup + Roundtrip.** Je Kern-Formatgruppe: (a) exakte DOM-Markup-Assertion unmittelbar nach der Toolbar-Aktion, (b) Persistenz-Roundtrip (formatieren → speichern → App neu laden → Markup intakt). Der Roundtrip deckt die sanitizeHTML-Speicher-Pipeline ab, die Markup strippen könnte.
- **D-04: Abdeckung: Referenz-Editor + Smoke.** Wiki ist Referenz-Editor: alle Formatgruppen (Bold/Italic/Underline/Strikethrough, Listen, Links, Tabellen, Border, Read-Aloud-Stile, Fonts/Größen, Highlight) über BEIDE Toolbars (statisch + floating) plus Markdown-Live-Shortcuts. Jeder weitere Entity-Editor (NPCs, Orte, Quests, Sessions, Quick-Ref) bekommt einen schlanken Smoke-Test (z. B. Bold via floating Toolbar + ein Markdown-Shortcut), der die Verdrahtung der geteilten Engine beweist.
- **D-04a: Baseline-First-Regel.** Das Netz MUSS in einem eigenen Plan VOR allen Migrations-Plänen entstehen und zweifach grün gegen den unveränderten execCommand-Code laufen. Während der Migration werden die Netz-Tests NICHT angepasst (Markup-Identität per D-02 macht Anpassung unnötig — jede nötige Teständerung wäre ein Beweis-Leck und ist begründungspflichtig).

**Migrations-Strategie**
- **D-05: Inkrementell je Kommandogruppe.** Migration in sinnvollen Gruppen (z. B. Inline-Formate → Listen/Block → Fonts/Größen → Highlight/Clear → HTML/Text-Inserts → Setup/defaultParagraphSeparator). Nach jeder Gruppe muss das KOMPLETTE Netz grün sein; ein atomarer Commit je Gruppe.
- **D-06: Kein Laufzeit-Fallback** auf execCommand (kein Feature-Flag, keine Doppel-Codepfade). Rollback-Einheit ist der Git-Revert einer Gruppe. EDIT-01 gilt erst als erfüllt, wenn alle 21 Call-Sites ersetzt sind.

**Fortgeltende Testregeln (aus Phase 8, nicht erneut verhandeln)**
- Maskierungs-Kriterium für `page.evaluate` (08-CONTEXT D-06): verboten, wenn es den geprüften Interaktionspfad ersetzt; erlaubt als dokumentiertes Setup-Vehikel. Für das Editor-Netz heißt das: Formatierungs-Aktionen laufen über echte Toolbar-Klicks/Tastatur, DOM-Markup-Assertions via `page.evaluate`/`innerHTML` sind legitime Prüfebene.
- Keine `waitForTimeout` in neuen Specs — Wait-Conditions (`waitForSelector`/`waitForFunction`).
- Exakte Assertions statt `toBeGreaterThan(0)`, wo deterministisch.
- Das Netz läuft automatisch im blockierenden e2e-CI-Job (Phase 8, D-03) mit.

### Claude's Discretion
- Exakte Gruppenaufteilung und Reihenfolge der Migrations-Gruppen (D-05-Gruppen sind Vorschlag)
- Technischer Range/Selection-Ansatz je Kommando (Toggle-Erkennung, Range-Splitting), solange das Markup identisch bleibt (D-02)
- Testdatei-Organisation des Netzes (eine `editor-formatting.spec.js` vs. mehrere Dateien) und minimale Gestalt der Smoke-Tests
- Umgang mit dem `defaultParagraphSeparator`-Setup-Call (kein direktes Formatierungs-Kommando)
- Ob `insertHTML`-Ersatz über `Range.insertNode`/`deleteContents` oder DOM-Fragment-Bau läuft

### Deferred Ideas (OUT OF SCOPE)
- **Editor-Text-Undo** (eigener Undo-Stack für Formatierungsschritte, Strg+Z im Editor-Fokus): bewusst NICHT in v1.1 (Verhaltensänderung gegen die Leitplanke). Kandidat für einen späteren Milestone.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-01 | Alle 21 `document.execCommand`-Aufrufe in `ui/editors/rich-text.js` sind durch moderne Selection/Range-DOM-APIs ersetzt — verhaltensgleich für Bold/Italic/Underline/Strikethrough, Listen, Links, Tabellen, Border, Read-Aloud-Stile, Fonts/Größen und Highlight-Farben | Vollständige Inventarliste aller 21 Call-Sites mit Zeilennummer, Erreichbarkeit (welche UI löst sie aus) und konkretem Ersatzmuster siehe „Architecture Patterns" und „Code Examples". Zwei der 21 Call-Sites sind aktuell **totes Code** (kein UI-Trigger) — siehe Pitfall 3. |
| EDIT-02 | Alle Editor-Toolbars (3-Tier-System, statisch + floating) und Markdown-Shortcuts funktionieren nach der Ablösung unverändert in allen Entity-Editoren (Wiki, NPCs, Orte, Quests, Sessions, Quick-Ref …) | Toolbar-Verdrahtung (statisch via `data-action="format-text"` → `ui/actions/system-actions.js` → `formatText()`; floating via `data-floating-action` → `applyFloatingFormat()` direkt in `rich-text.js`) vollständig dokumentiert, inkl. eines bereits vorhandenen, aber vermutlich aktuell **kaputten** Laufzeit-Pfads (Pitfall 1) der vor der Migration empirisch geklärt werden muss. |
| EDIT-03 | Editor-Regressionsnetz existiert: E2E-Tests decken die Kern-Formatierungen ab (vorher ungetesteter Bereich), damit die Ablösung beweisbar verhaltensgleich ist | Bestehendes `tests/e2e/features/wiki.spec.js` als Startpunkt identifiziert, mit einer wichtigen Warnung: sein „Wiki Editor Formatierung"-Block nutzt weiche `if (isVisible())`-Guards, die NICHT als D-04a-Baseline taugen (Pitfall 2). Playwright-Version, Config und CI-Job-Integration verifiziert. |
</phase_requirements>

## Summary

Diese Phase migriert 21 `document.execCommand`-Aufrufe in `ui/editors/rich-text.js` (Non-ESM-Vanilla-JS, kein Framework) auf Selection/Range-DOM-APIs — abgesichert durch ein E2E-Regressionsnetz, das VOR der Migration entsteht und gegen die unveränderte execCommand-Baseline grün laufen muss. Alle 21 Call-Sites wurden per Grep gezählt und einzeln gegen die UI-Templates gegengeprüft (Zeilen 329–916 in `ui/editors/rich-text.js`); die Zahl 21 aus CONTEXT.md/REQUIREMENTS.md ist bestätigt.

Der Code enthält bereits ein **funktionierendes Referenzmuster** für Selection/Range-basierte Formatierung: `applyFloatingFormat()` (floating Toolbar, Zeilen 817–935) implementiert Bold/Italic/Underline/Strikethrough, Listen, Links und Highlight bereits OHNE execCommand — inklusive Toggle-Erkennung (ist die Selektion schon formatiert? → entpacken statt erneut wrappen) und dem Standard-Fallback für `Range.surroundContents()` (wirft `InvalidStateError` bei Selektionen, die mehrere Elemente nur teilweise umfassen → `extractContents()` + `appendChild()` + `insertNode()` als Ersatz). Diese Muster sollten für die Migration der statischen Toolbar (`formatText()`, `setEditorFont()`, `setEditorFontSize()`) direkt wiederverwendet werden, statt neu erfunden zu werden.

Drei kritische, tief verifizierte Befunde verändern die Planungsgrundlage gegenüber einer naiven Lesart von CONTEXT.md/REQUIREMENTS.md und MÜSSEN vor der Baseline-Aufnahme (D-04a) geklärt werden:

1. **`window.EDITOR_FONTS` und `window.TOOLBAR_DIMENSIONS` sind im aktuellen Quellcode nirgends definiert** (nur referenziert). `setEditorFont()`/`setEditorFontSize()` und die Positionierung der floating Toolbar (`handleSelectionChange()`) würden bei tatsächlicher Nutzung eine `TypeError` werfen. Dies ist wahrscheinlich eine Regression aus einem TypeScript-Migrations-Commit vom 10. Januar 2026 (`git log -S EDITOR_FONTS`), nicht aus dieser Phase. Muss vor der Baseline-Aufnahme empirisch am gebauten Bundle verifiziert werden — die „echte" Baseline könnte ein Crash/No-op sein, nicht das im Code erkennbare Verhalten.
2. **Zwei der 21 execCommand-Aufrufe sind toter Code** (`formatBlock`/„heading" und `removeFormat`+`backColor`/„highlight" innerhalb von `formatText()`): kein Template referenziert `data-editor="heading"` oder `data-editor="highlight"`. Sie zählen weiterhin zu den 21 (EDIT-01/D-06 verlangt „alle 21"), sind aber nur per direktem Funktionsaufruf testbar, nicht per Toolbar-Klick.
3. **Drei weitere `execCommand`-Aufrufe existieren außerhalb von `ui/editors/rich-text.js`** (`ui/actions/system-actions.js:82` `createLink`, `features/wiki/wiki.js:817` `insertText`, `systems/entity-links.js:87` `insertText`) — bereits in `.planning/codebase/CONCERNS.md` dokumentiert. Sie gehören NICHT zu den 21 (D-06 scoped explizit auf `rich-text.js`) und dürfen in dieser Phase nicht versehentlich mitmigriert werden, aber der Wiki-Referenz-Editor (D-04) nutzt sie mit (Link-Button, `[[]]`-Button) — das Regressionsnetz muss sie als unverändert erwarteten Baseline-Pfad einplanen.

**Primary recommendation:** Vor Erstellung des Baseline-Netzes (Plan 1 gemäß D-04a) eine kurze manuelle/empirische Verifikation am gebauten `dist/dnd-tracker-bundled.html` durchführen: Font-Dropdown und Text-Selektion in einem Editor testen und beobachten, ob die floating Toolbar überhaupt erscheint und ob der Font-Dropdown wirft. Das Ergebnis bestimmt, ob Pitfall 1 in dieser Phase mitbehoben werden muss (da sonst die Migrationsgruppe „Fonts/Größen" nichts Sinnvolles zu testen hätte) oder ob es als bekannter, unveränderter Fehlerzustand in die Baseline aufgenommen wird.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rich-Text-Formatierung (Bold/Italic/Liste/Font/Highlight/…) | Browser / Client | — | Läuft vollständig im Browser über `contenteditable` + Selection/Range-DOM-APIs; keine Server-Komponente in dieser Single-Page-Offline-App |
| Toolbar-Event-Verdrahtung (statisch + floating) | Browser / Client | — | Event-Delegation (`data-action`) über `ui/actions/*.js`, reiner Client-Code |
| Sanitisierung vor Persistenz (`sanitizeHTML`) | Browser / Client | Database / Storage | DOMParser-basierte Whitelist läuft im Client, bevor der String in `D` (State-Objekt) landet, das anschließend gespeichert wird |
| Persistenz-Roundtrip (Markup nach Speichern/Reload) | Database / Storage | Browser / Client | `localStorage`/IndexedDB via `save()`/`saveImmediate()`; Roundtrip-Test deckt Client→Storage→Client-Zyklus ab |
| E2E-Regressionsnetz | Testing / Tooling | — | Playwright gegen gebautes `file://`-Bundle; kein eigenes App-Tier, aber CI-Gate-relevant (Phase 8, blockierender `e2e`-Job) |
| Markdown-Live-Shortcuts | Browser / Client | — | `ui/editors/markdown-shortcuts.js`, reine Client-Text-Verarbeitung auf `input`-Events, unabhängig von execCommand |

## Standard Stack

### Core

Keine neuen Abhängigkeiten. Diese Phase ersetzt eine Browser-native, deprecated API (`document.execCommand`) durch andere Browser-native APIs (`Selection`, `Range`, DOM-Manipulation) — kein npm-Paket, kein Build-Tooling-Wechsel.

| API | Herkunft | Zweck | Warum Standard |
|-----|----------|-------|-----------------|
| `Selection` (`window.getSelection()`) | Browser-nativ (DOM Living Standard) | Zugriff auf aktuelle Text-Selektion im Editor | Bereits im Code etabliert (`applyFloatingFormat`, `handleSelectionChange`), keine Alternative nötig |
| `Range` (`selection.getRangeAt(0)`, `document.createRange()`) | Browser-nativ | Selektions-Grenzen manipulieren, Inhalte extrahieren/einfügen/umwickeln | Einzige Standard-Alternative zu execCommand für DOM-Manipulation in `contenteditable`; bereits im Code etabliert |
| `Range.surroundContents()` / `extractContents()` / `insertNode()` | Browser-nativ | Inline-Formate (Bold/Italic/…) wrappen/entpacken | Bereits produktiv im Code (`applyFloatingFormat`, `applyFloatingHighlight`, `setBorderFormat`, `setReadAloudFormat`) — dieselben Funktionen, die für die floating Toolbar schon ohne execCommand auskommen |
| `Range.createContextualFragment()` | Browser-nativ | Ersatz für `execCommand('insertHTML', …)` — parsed HTML-String zu DOM-Fragment, ohne `<script>` auszuführen | Empfohlener Standard-Ersatz für insertHTML-artige Operationen (siehe Code Examples) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@playwright/test` | `^1.57.0` [VERIFIED: package.json] | E2E-Regressionsnetz (D-04a Baseline + Post-Migration) | Bereits Projektstandard, `playwright.config.js` zeigt auf `file:///.../dist/dnd-tracker-bundled.html`, Chromium-only-Projekt (`devices['Desktop Chrome']`) — passt zur „Chromium ist Referenz"-Definition aus CONTEXT.md Specifics |
| `jest` | `^30.2.0` [VERIFIED: package.json] | Optionale Ergänzung für die 2 toten Code-Pfade (heading/highlight), die nicht per UI-Klick erreichbar sind — dort ist ein direkter Funktionsaufruf (Jest mit jsdom oder Playwright `page.evaluate`) die einzige Testmöglichkeit | Nur falls der Planner sich für Jest statt Playwright-`evaluate()` für diese 2 Sonderfälle entscheidet (Claude's Discretion) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Selection/Range-API (händisch) | `document.execCommand('insertHTML', …)` weiter nutzen | Verboten durch D-06 (kein Laufzeit-Fallback) und Ziel der Phase; execCommand ist formal deprecated, Verhalten browser-abhängig |
| Selection/Range-API (händisch) | Drittanbieter-Rich-Text-Library (Quill.js, TipTap, ProseMirror) | Contra: Framework-/ESM-Einführung explizit Out-of-Scope (`REQUIREMENTS.md`: „Framework-/ESM-Migration" — bewährte non-ESM-Architektur bleibt bestehen). Nicht relevant für diese Phase. |
| `Range.createContextualFragment()` für insertHTML-Ersatz | `element.insertAdjacentHTML()` an Cursor-Position | `insertAdjacentHTML` kennt keine Selektionsgrenzen/Range-Konzept nativ — müsste die Cursor-Position selbst über Range emulieren; `createContextualFragment` ist der range-native Weg und daher konsistenter mit den übrigen Migrationen |

**Installation:** Keine — reine Browser-API-Migration, kein `npm install` nötig.

**Version verification:** `@playwright/test` `^1.57.0` und `jest` `^30.2.0` wurden direkt aus `package.json` gelesen [VERIFIED: package.json] — keine Registry-Abfrage nötig, da keine neue Version installiert wird und die Phase keine Paket-Änderungen vornimmt.

## Package Legitimacy Audit

**Nicht anwendbar.** Diese Phase installiert keine externen Pakete — reine Migration von einer Browser-API (`document.execCommand`) zu anderen Browser-APIs (`Selection`/`Range`). Keine `npm install`-Schritte im Scope. Package-Legitimacy-Gate entfällt.

## Architecture Patterns

### System Architecture Diagram

```
Nutzer-Interaktion (Toolbar-Klick ODER Tastatur ODER Paste)
        │
        ├─► Statische Toolbar (Formular-fest, z. B. Wiki-Formular)
        │      data-action="format-text" / "set-editor-font" / "set-editor-font-size"
        │      / "set-border-format" / "set-read-aloud-style" / "insert-table"
        │      / "set-highlight-color" / "clear-formatting"
        │        │
        │        ▼
        │   ui/actions/system-actions.js  (SystemActions-Registry, Event-Delegation)
        │        │  liest ctx.target.dataset.{cmd,editor,value}
        │        ▼
        │   ui/editors/rich-text.js:  formatText() / setEditorFont() / setEditorFontSize()
        │      / setBorderFormat() / setReadAloudFormat() / insertTable()
        │        │
        │        ▼
        │   [MIGRATIONSZIEL] execCommand(...) → Selection/Range-DOM-Manipulation
        │
        ├─► Floating Toolbar (erscheint bei Text-Selektion in .rich-editor/.spell-editor/.dialog-text)
        │      selectionchange-Event (debounced 150ms) → handleSelectionChange()
        │      Klick auf data-floating-action → applyFloatingFormat() / applyFloatingHighlight()
        │        │
        │        ▼
        │   [BEREITS Selection/Range — kein execCommand, dient als Referenzmuster]
        │
        ├─► Tastatur im Editor (Enter, Strg+Shift+T)
        │      document-level keydown-Listener (delegiert, .rich-editor/.dialog-text-area)
        │        │
        │        ▼
        │   handleEditorKeydown() → execCommand('insertLineBreak') [MIGRATIONSZIEL]
        │                         → insertTable() bei Strg+Shift+T
        │
        └─► Paste-Event (Clipboard)
               document-level paste-Listener (delegiert)
                 │
                 ▼
            handleEditorPaste() → Tabellen-Erkennung (Regex-Cleanup) ODER Tab-getrennter Text
                 │
                 ▼
            execCommand('insertHTML' | 'insertText') [MIGRATIONSZIEL]

Nach jeder Formatierungsaktion:
   editor.innerHTML  ──(bei Speichern)──►  sanitizeHTML() [utils/basic.js, UNVERÄNDERT per D-02]
                                                 │
                                                 ▼
                                          D.<entity>.content/description/… (State)
                                                 │
                                                 ▼
                                          save() → localStorage + IndexedDB
                                                 │
                                                 ▼ (Reload)
                                          editor.innerHTML = sanitizeHTML(entry.content)
                                          [D-03 Persistenz-Roundtrip-Prüfpunkt]
```

### Recommended Project Structure

Keine neuen Verzeichnisse/Dateien nötig — alle Änderungen erfolgen in bestehenden Dateien:

```
ui/editors/
├── rich-text.js          # Migrationsziel: alle 21 execCommand-Calls
├── markdown-shortcuts.js # unverändert, execCommand-frei, muss weiter funktionieren (EDIT-02)
└── markdown-converter.js # unverändert, execCommand-frei
ui/actions/
└── system-actions.js     # ruft formatText()/setEditorFont()/etc. auf — selbst KEIN Migrationsziel,
                           # enthält aber einen eigenen, separaten execCommand('createLink')-Call
                           # (Zeile 82) außerhalb der 21 — NICHT anfassen (Pitfall 4)
tests/e2e/
└── features/
    └── editor-formatting.spec.js   # NEU (Namensvorschlag, Claude's Discretion) — D-04a Baseline-Netz
```

### Pattern 1: Inline-Format-Toggle mit Fallback (bereits produktiv im Code)

**What:** Erkennen, ob die aktuelle Selektion bereits im Ziel-Tag steckt (→ entpacken) oder nicht (→ wrappen), mit robustem Fallback für `surroundContents()`-Fehler bei Selektionen, die mehrere Elemente nur teilweise umfassen.
**When to use:** Für die Migration von `formatText()`'s bold/italic/underline/strikethrough (4 der 21 Calls) — exakt dasselbe Muster wie die bereits funktionierende floating Toolbar.
**Example:**
```javascript
// Source: ui/editors/rich-text.js:817-861 (bereits produktiv, floating Toolbar,
// applyFloatingFormat() — als Vorlage für die Migration der statischen Toolbar
// in formatText() nutzen)
const tagMap = { bold: 'b', italic: 'i', underline: 'u', strikethrough: 's' };
if (tagMap[action]) {
    const tag = tagMap[action];
    const parentTag = range.commonAncestorContainer.parentElement?.closest(tag);
    if (parentTag && parentTag.closest('.rich-editor, .spell-editor, .dialog-text')) {
        // Toggle OFF: Tag entpacken (Kinder vor das Tag verschieben, Tag entfernen)
        const parent = parentTag.parentNode;
        while (parentTag.firstChild) parent.insertBefore(parentTag.firstChild, parentTag);
        parent.removeChild(parentTag);
    } else {
        // Toggle ON: Tag wrappen
        const wrapper = document.createElement(tag);
        try {
            range.surroundContents(wrapper);
        } catch (e) {
            // Quelle des Fallbacks: Range.surroundContents() wirft InvalidStateError,
            // wenn die Range ein Nicht-Text-Element nur TEILWEISE umfasst
            // (MDN: https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents)
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);
        }
    }
}
```
**Wichtig für D-02 (identisches Markup):** `execCommand('bold')` erzeugt in Chromium `<b>`-Tags (nicht `<strong>`) — das o.g. Muster produziert exakt dasselbe. `execCommand('strikeThrough')` erzeugt `<strike>` in Chromium (nicht `<s>` oder `<del>`) — bei der Migration MUSS `strike` als Tag-Name verwendet werden, NICHT `s` (das bereits existierende floating-Toolbar-Pattern nutzt fälschlich schon `s` statt `strike` für strikethrough — dieser Unterschied zwischen den beiden Toolbars ist VORHANDENE Baseline, siehe Pitfall 5, keine neue Abweichung).

### Pattern 2: Formatierungs-Wrapper mit Attribut statt `execCommand`-Wert (für fontName/fontSize)

**What:** `execCommand('fontName', false, value)` wrappt die Selektion in `<font face="value">`. Der Selection/Range-Ersatz baut dieses Element direkt.
**When to use:** Migration von `formatText()`'s `font`-Branch, `setEditorFont()` und dem floating-Toolbar-`fontName`-Handler (3 der 21 Calls).
**Example:**
```javascript
// Ersatz für: document.execCommand('fontName', false, value)
const wrapper = document.createElement('font');
wrapper.setAttribute('face', value);
try {
    range.surroundContents(wrapper);
} catch (e) {
    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
}
```
**fontSize-Sonderfall (2 der 21 Calls, siehe auch Code Examples):** Der bestehende Code nutzt bereits einen Umweg — `execCommand('fontSize', '7')` gefolgt von Post-Processing, das `size="7"` entfernt und durch `style.fontSize` ersetzt (`ui/editors/rich-text.js:393-398`). Das persistierte Endergebnis ist bereits ein `<font style="font-size:…">`-Element OHNE `size`-Attribut. Die Migration kann daher DIREKT das Zielelement bauen (`<font>` mit `style.fontSize` gesetzt, ohne den `size="7"`-Zwischenschritt) — das erzeugt laut D-02 dasselbe finale Markup, ist aber einfacher als den Zwischenschritt nachzubilden.

### Pattern 3: `insertHTML`-Ersatz über `createContextualFragment` (für Tabellen-Paste + `insertTable()`)

**What:** `execCommand('insertHTML', false, htmlString)` durch Range-natives Einfügen ersetzen.
**When to use:** 3 der 21 Calls — Tabellen-Paste (Zeilen 615, 637) und `insertTable()` (Zeile 674).
**Example:**
```javascript
// Ersatz für: document.execCommand('insertHTML', false, htmlString)
const range = window.getSelection().getRangeAt(0);
range.deleteContents();
const fragment = range.createContextualFragment(htmlString);
// createContextualFragment() parsed HTML ohne <script>-Ausführung — sicherer
// Baustein als naives innerHTML, siehe Security Domain
const lastNode = fragment.lastChild;
range.insertNode(fragment);
if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}
```

### Pattern 4: `insertText`/`insertLineBreak`-Ersatz (für Paste-Plaintext und Enter-Handling)

**What:** Text bzw. `<br>` an der Cursor-Position einfügen, Selektion danach kollabieren.
**When to use:** 3 der 21 Calls — Paste-Plaintext (Zeile 642), Enter-Handling (Zeile 574).
**Example:**
```javascript
// Ersatz für: document.execCommand('insertText', false, text)
const range = window.getSelection().getRangeAt(0);
range.deleteContents();
const textNode = document.createTextNode(text);
range.insertNode(textNode);
range.setStartAfter(textNode);
range.collapse(true);

// Ersatz für: document.execCommand('insertLineBreak', false, undefined)
const br = document.createElement('br');
range.insertNode(br);
range.setStartAfter(br);
range.collapse(true);
```

### Anti-Patterns to Avoid

- **`innerHTML +=` oder direkte String-Konkatenation für Insert-Operationen:** Zerstört die aktuelle Selektion/Cursor-Position und läuft nicht durch die Sanitisierungs-Logik konsistent mit dem Rest des Editors. Immer `Range`-basiert arbeiten, wie in den bestehenden `setBorderFormat()`/`setReadAloudFormat()`-Funktionen bereits vorgemacht.
- **`surroundContents()` ohne Try/Catch:** Wirft garantiert bei jeder Selektion, die ein Element nur teilweise umfasst (z. B. Selektion beginnt mitten in einem `<b>`-Tag und endet danach). Immer den Extract+Insert-Fallback mitführen (Pattern 1).
- **Funktions-lokale `const X = window.X` für neue Helper (CLAUDE.md-Dedup-Regel):** Beim Refactoring von `formatText()` in kleinere Helper-Funktionen (falls der Planner das für sinnvoll hält) keine funktions-lokalen `const`-Re-Deklarationen von bereits global via `const`/`let` deklarierten Bezeichnern einführen — bricht den Build (siehe CLAUDE.md „Duplicate Declaration Debugging Pattern").

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle-Erkennung „ist Selektion formatiert?" | Eigene Tag-Suche/Parser | `range.commonAncestorContainer.parentElement?.closest(tag)` (bereits im Code) | Bereits korrekt implementiert und getestet in `applyFloatingFormat()` — Wiederverwendung reduziert Risiko neuer Bugs in der riskantesten Phase des Milestones |
| Selektion nach Einfüge-Operation wiederherstellen | Eigene Cursor-Tracking-Logik | `Range.setStartAfter()` + `selection.removeAllRanges()`/`addRange()` (bereits im Code, z. B. `setEditorFont()` Zeilen 364-370) | Standardmuster, bereits mehrfach im Code etabliert |
| HTML-String sicher parsen (insertHTML-Ersatz) | Eigener Mini-HTML-Parser oder `innerHTML`-Zuweisung | `Range.createContextualFragment()` | Browser-nativ, führt keine `<script>`-Tags aus (siehe Security Domain), spec-konformer Ersatz für `execCommand('insertHTML')` |

**Key insight:** Diese Phase ist explizit die Phase, in der etwas „handgerollt" wird (Selection/Range statt execCommand) — aber der Code selbst enthält bereits die Referenzimplementierung (floating Toolbar). Die Aufgabe ist NICHT, neue Muster zu erfinden, sondern bestehende, bereits produktiv laufende Muster auf die verbleibenden 21 Call-Sites zu übertragen.

## Common Pitfalls

### Pitfall 1: `window.EDITOR_FONTS` und `window.TOOLBAR_DIMENSIONS` sind aktuell nirgends definiert

**What goes wrong:** `setEditorFont()`, `setEditorFontSize()` und der floating-Toolbar-Font-Handler lesen `window.EDITOR_FONTS` (Zeilen 351, 371, 699, 782-786) — dieser Bezeichner wird im gesamten aktuellen Quellcode (`core/`, `ui/`, `features/`, `systems/`, `utils/`) NIRGENDS zugewiesen [VERIFIED: `grep -rln "EDITOR_FONTS" --include=*.js .` liefert außerhalb von `ui/editors/rich-text.js` und `dist/` keine Treffer]. Genauso `window.TOOLBAR_DIMENSIONS` (Zeilen 700, 938, 970) — auch hier keine Zuweisung im Quellcode. `handleSelectionChange()` destructured `TOOLBAR_DIMENSIONS` bei Zeile 970 (`const { width, height, padding } = TOOLBAR_DIMENSIONS`) — bei `undefined` wirft das eine `TypeError`.
**Why it happens:** `git log -S EDITOR_FONTS -- core/constants.js` zeigt, dass `EDITOR_FONTS` am 10. Januar 2026 im Commit „Finalize TypeScript migration - Use compiled JS as runtime" aus `core/constants.js` verschwunden ist (großflächiger, riskanter Migrations-Commit). `core/constants.js` exportiert aktuell nur `UI_CONSTANTS = { UI_TIMING, ENTITY_ICONS, LINK_ICONS, ENTITY_TYPE_NAMES, MARKDOWN_PATTERNS }` [VERIFIED: `core/constants.js:554-560`] — kein `EDITOR_FONTS`, kein `TOOLBAR_DIMENSIONS`. `dist/dnd-tracker-bundled.html` enthält noch einen `// [DEDUP] Removed duplicate window assignment: EDITOR_FONTS`-Kommentar — Hinweis, dass ein gebautes Bundle im Repo STALE ist gegenüber dem aktuellen Quellcode (das Bundle könnte vor der TS-Migrations-Regression gebaut worden sein).
**How to avoid:** VOR der Baseline-Aufnahme (D-04a) am frisch gebauten Bundle (`python build.py`, dann `dist/dnd-tracker-bundled.html` im Chrome öffnen) empirisch prüfen: (1) Text in einem Editor selektieren → erscheint die floating Toolbar? (2) Font-Dropdown in der statischen Toolbar nutzen → wirft die Konsole eine `TypeError`? Je nach Ergebnis zwei Wege: **(a)** Falls tatsächlich kaputt: Da EDIT-02 verlangt, dass Editor-Funktionen „unverändert" bleiben, und ein kaputter Font-Picker/floating-Toolbar keine sinnvolle Baseline für die Migrationsgruppe „Fonts/Größen" liefert, mit dem Nutzer klären, ob das Wiederherstellen von `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS` als Voraussetzung in diese Phase gehört (kein neues Feature, sondern Wiederherstellung einer vor der execCommand-Migration bereits vorhandenen Konstante — würde D-02s „identisches Markup ggü. heutigem Zustand" neu verankern müssen: „heutiger Zustand" wäre dann NACH der Wiederherstellung, nicht der aktuell kaputte). **(b)** Falls es doch funktioniert (z. B. weil eine andere, hier nicht gefundene Zuweisung zur Laufzeit passiert, oder das gebaute `dist/`-Bundle im Repo zufällig noch die alte Definition enthält und aktuell genutzt wird statt eines Neu-Builds) — dann Fund als nicht-blockierend dokumentieren und normal fortfahren.
**Warning signs:** Browser-Konsole zeigt `Uncaught TypeError: Cannot read properties of undefined (reading 'arial')` oder `Cannot destructure property 'width' of 'undefined'` bei Interaktion mit Font-Dropdown bzw. Text-Selektion im Editor.

### Pitfall 2: Bestehende `wiki.spec.js`-Formatierungstests taugen NICHT als D-04a-Baseline

**What goes wrong:** `tests/e2e/features/wiki.spec.js` hat bereits einen „Wiki Editor Formatierung"-Block (Zeilen 299-356) mit Tests für Bold, Read-Aloud und Tabelle — aber alle drei nutzen `if (await xBtn.isVisible()) { ... }`-Guards OHNE `else`-Zweig und OHNE abschließende Markup-Assertion. Ein Test wie „sollte Text fett formatieren können" klickt den Bold-Button nur, WENN er sichtbar ist, und prüft danach gar nichts. Diese Tests sind grün, unabhängig davon, ob Bold tatsächlich funktioniert.
**Why it happens:** Diese Tests wurden vor Phase 8s Härtungsregeln geschrieben (weiche Sichtbarkeits-Guards statt harter Assertions — exakt das Muster, das Phase 8/D-06 im übrigen Testbestand bereits verboten hat, hier aber noch nicht bereinigt wurde, weil `wiki.spec.js` nicht Teil von Phase 8s Scope war).
**How to avoid:** Diese bestehenden 3 Tests NICHT als Beweis für D-04a wiederverwenden oder als „bereits vorhanden, spart Arbeit" fehlinterpretieren. `wiki.spec.js`s `beforeEach`/App-Boot-/Navigations-Muster (Zeilen 10-21) sind gute Vorlagen für Setup-Code — aber der neue `editor-formatting.spec.js`-Testkörper braucht harte, deterministische Markup-Assertionen (`await expect(editor).toHaveJSProperty('innerHTML', '<b>Text</b>')` o. ä. per D-02/D-03), keine `if (isVisible())`-Soft-Skips.
**Warning signs:** Ein grüner Testlauf, der keine `expect()`-Assertion auf DOM-Markup enthält, ist kein Beweis für D-02-Verhaltensgleichheit.

### Pitfall 3: Zwei der 21 execCommand-Calls sind aktuell unerreichbarer Code

**What goes wrong:** `formatText()`s `heading`-Branch (`execCommand('formatBlock', false, '<h4>')`, Zeile 339) und `highlight`-Branch (`execCommand('removeFormat')` + `execCommand('backColor', value)`, Zeilen 344/346) werden von KEINEM Template mit `data-editor="heading"` oder `data-editor="highlight"` aufgerufen [VERIFIED: `grep -rn 'data-editor="heading"\|data-editor="highlight"' assets/` liefert 0 Treffer; `grep -rn "formatText(.*'heading'\|formatText(.*'highlight'"` liefert ebenfalls 0 Treffer]. Der tatsächliche Highlight-Feature-Pfad läuft komplett getrennt über `set-highlight-color` (`ui/actions/system-actions.js:92-139`, bereits DOM-basiert mit `<mark>`-Elementen, KEIN execCommand) bzw. die floating Toolbar (`applyFloatingHighlight`, ebenfalls `<mark>`-basiert).
**Why it happens:** Vermutlich Altcode aus einer früheren Toolbar-Iteration, der beim Umbau auf die heutige `<mark>`-basierte Highlight-Implementierung nicht entfernt wurde.
**How to avoid:** Diese 2 Call-Sites (3 execCommand-Statements) zählen weiterhin zu den 21 (D-06: „EDIT-01 gilt erst als erfüllt, wenn alle 21 Call-Sites ersetzt sind" — keine Ausnahme für toten Code). Sie können nicht per Toolbar-Klick getestet werden. Empfehlung für den Plan: direkter Funktionsaufruf-Test (`page.evaluate(() => window.formatText('some-editor-id', 'heading'))` bzw. `'highlight'`) für die Baseline- UND Post-Migration-Assertion — oder mit dem Nutzer klären, ob totes Code trotzdem 1:1 migriert werden muss (D-06 spricht dafür) oder als Cleanup entfernt werden darf (würde D-06 wörtlich widersprechen — „ersetzt" impliziert Beibehaltung der Funktion, nicht Entfernung).
**Warning signs:** Kein Toolbar-Button mit „Überschrift"/Heading-Funktion in irgendeinem Editor-Toolbar-Template.

### Pitfall 4: Drei execCommand-Aufrufe außerhalb von `rich-text.js` — explizit außerhalb des Scopes

**What goes wrong:** `ui/actions/system-actions.js:82` (`execCommand('createLink', false, url)`, ausgelöst durch den STATISCHEN Toolbar-Link-Button, `data-action="insert-link"`), `features/wiki/wiki.js:817` (`execCommand('insertText', ..., '[[title]]')`, der `[[]]`-Wiki-Link-Button) und `systems/entity-links.js:87` (`execCommand('insertText', ..., linkCode)`, Entity-Link-Einfügen) sind NICHT Teil der 21 Call-Sites in `rich-text.js` und werden von EDIT-01 nicht erfasst [VERIFIED: bereits dokumentiert in `.planning/codebase/CONCERNS.md` Zeile 57/66-67]. Bemerkenswert: Die floating Toolbar löst Links bereits KOMPLETT ohne execCommand (`applyFloatingFormat` action==='link', Zeilen 864-879, baut `<a>` manuell mit `href`/`target="_blank"`/`rel="noopener noreferrer"`), während die statische Toolbar über `execCommand('createLink', ...)` läuft, das diese zusätzlichen Attribute NICHT setzt — die beiden Toolbars erzeugen für „Link" also schon HEUTE unterschiedliches Markup. Das ist vorbestehendes Verhalten, keine neue Abweichung.
**Why it happens:** Historisch gewachsene Code-Organisation — Link-Handling liegt teils in `rich-text.js`, teils in `system-actions.js`/`wiki.js`/`entity-links.js`.
**How to avoid:** Diese 3 Call-Sites NICHT anfassen (Scope-Kriechen vermeiden — D-06 spricht explizit von „21 Call-Sites" in `rich-text.js`). Für D-04 (Wiki-Referenz-Editor testet „Links" über beide Toolbars) bedeutet das: der Link-Test via statische Toolbar bleibt automatisch grün (unverändertes execCommand), der Link-Test via floating Toolbar bleibt automatisch grün (war nie execCommand). „Links" in EDIT-01s Formatliste bezieht sich demnach NICHT auf einen der 21 zu migrierenden Calls — es gibt keinen `createLink`-Call unter den 21.
**Warning signs:** Ein Migrationsplan, der versucht, `system-actions.js:82` als Teil von „Gruppe X" zu migrieren, verletzt D-06s Scope-Grenze.

### Pitfall 5: `strikeThrough` erzeugt in Chromium `<strike>`, nicht `<s>` — Inkonsistenz zwischen den beiden Toolbars ist bereits vorhanden

**What goes wrong:** `execCommand('strikeThrough', ...)` (statische Toolbar, Zeile 335) erzeugt in Chromium `<strike>`-Tags. Die floating Toolbar (`applyFloatingFormat`, Zeile 835) nutzt bereits JETZT `tagMap.strikethrough = 's'` — erzeugt also `<s>`. `sanitizeHTML()` erlaubt beide Tags (`utils/basic.js` `allowedTags` enthält sowohl `'s'` als auch kein `'strike'`!) — **Achtung:** In der gelesenen `allowedTags`-Liste (`utils/basic.js:72-100`) taucht `'strike'` NICHT auf, nur `'s'`. Falls das zutrifft, würde `sanitizeHTML()` von der statischen Toolbar erzeugte `<strike>`-Tags beim Speichern in reinen Text umwandeln (nicht erlaubtes Tag → nur `textContent` behalten) — ein potenzieller vorbestehender Bug, der die Persistenz-Roundtrip-Prüfung (D-03) für „Strikethrough via statische Toolbar" zum Scheitern bringen könnte, wenn er nicht schon vorher (durch Zufall/fehlende Tests) unbemerkt blieb.
**Why it happens:** `sanitizeHTML`s Whitelist wurde vermutlich mit dem floating-Toolbar-Verhalten (`<s>`) als Referenz erstellt, nicht mit execCommand-Chromium-Verhalten (`<strike>`) abgeglichen.
**How to avoid:** Bei der empirischen Markup-Erhebung (CONTEXT.md Specifics: „pro Kommando einmal ausführen, erzeugtes HTML festhalten") EXPLIZIT einen Persistenz-Roundtrip-Test für Strikethrough via STATISCHE Toolbar einplanen — dieser deckt auf, ob `<strike>` heute schon durch `sanitizeHTML()` gefiltert wird. Falls ja: Das ist vorbestehendes (potenziell fehlerhaftes) Verhalten, das gemäß D-02 identisch reproduziert werden muss (nicht heimlich „verbessert" werden darf) — der Migrationscode müsste dann ebenfalls `<strike>` erzeugen UND es würde beim Speichern ebenfalls gefiltert. Kein Fix-Auftrag dieser Phase (Milestone-Leitplanke: verhaltensneutral), aber ein Fund, der dem Nutzer als Open Question vorgelegt werden sollte, da er sich anfühlt wie ein Bug, den man reflexhaft mitfixen möchte.
**Warning signs:** Persistenz-Roundtrip-Test für Strikethrough via statische Toolbar zeigt nach Reload keinen durchgestrichenen Text mehr, während der Bold/Italic-Roundtrip-Test daneben grün bleibt.

### Pitfall 6: `Range.surroundContents()` wirft bei Mehrfach-Element-Selektionen — Standardproblem, nicht Editor-spezifisch

**What goes wrong:** Wählt der Nutzer Text aus, der mehrere Inline-Elemente nur teilweise umfasst (z. B. „…halb **fett**, halb normal…" mit Selektion, die mitten im `<b>` beginnt), wirft `range.surroundContents(wrapper)` eine `InvalidStateError` [CITED: MDN `Range/surroundContents`, „An exception is thrown if the range partially contains any non-Text node"].
**Why it happens:** Spec-Verhalten von `Range.surroundContents()`, nicht app-spezifisch.
**How to avoid:** Immer den bereits im Code etablierten Try/Catch-Fallback (`extractContents()` + `appendChild()` + `insertNode()`) verwenden — siehe Pattern 1. Dieser Fallback ist in `applyFloatingFormat()` und `applyFloatingHighlight()` bereits vorhanden; bei der Migration von `formatText()` denselben Fallback mitführen, sonst wirft die neue statische-Toolbar-Implementierung bei genau den Selektionen, die execCommand klaglos verarbeitet hätte.
**Warning signs:** Baseline-Test mit einer bewusst „unsauberen" Mehrfach-Element-Selektion wirft eine Exception in der Konsole, statt zu formatieren.

## Code Examples

### Vollständige Call-Site-Inventarliste (alle 21, mit Erreichbarkeit)

```
# Quelle: ui/editors/rich-text.js — Grep-verifiziert (grep -n execCommand)
Zeile 329  bold                        formatText()         UI: data-editor="bold" ✓ erreichbar
Zeile 331  italic                      formatText()         UI: data-editor="italic" ✓ erreichbar
Zeile 333  underline                   formatText()         UI: data-editor="underline" ✓ erreichbar
Zeile 335  strikeThrough               formatText()         UI: data-editor="strikethrough" ✓ erreichbar
Zeile 337  insertUnorderedList         formatText()         UI: data-editor="list" ✓ erreichbar
Zeile 339  formatBlock ('<h4>')        formatText()         UI: KEINE — toter Code (Pitfall 3)
Zeile 341  fontName (value)            formatText()         UI: KEINE data-editor="font" gefunden — vermutlich
                                                              ebenfalls unerreichbar; setEditorFont()/floating
                                                              Toolbar decken Font-Auswahl tatsächlich ab
Zeile 344  removeFormat                formatText()         UI: KEINE — toter Code (Pitfall 3, highlight-Zweig)
Zeile 346  backColor (value)           formatText()         UI: KEINE — toter Code (Pitfall 3, highlight-Zweig)
Zeile 371  fontName                    setEditorFont()       UI: data-action="set-editor-font" ✓ erreichbar
Zeile 393  fontSize ('7')              setEditorFontSize()   UI: data-action="set-editor-font-size" ✓ erreichbar
Zeile 513  defaultParagraphSeparator   initEditorPasteHandlers() Init-Call, kein Format-Trigger — betrifft
                                                              natives Shift+Enter-Verhalten (siehe unten)
Zeile 574  insertLineBreak             handleEditorKeydown() UI: Enter-Taste (ohne Shift) im Editor ✓ erreichbar
Zeile 615  insertHTML (Tabelle)        handleEditorPaste()    UI: Paste von Tabellen-HTML ✓ erreichbar
Zeile 637  insertHTML (Tab-getrennt)   handleEditorPaste()    UI: Paste von Tab-separiertem Text ✓ erreichbar
Zeile 642  insertText                  handleEditorPaste()    UI: Paste von Plaintext ✓ erreichbar
Zeile 674  insertHTML (insertTable)    insertTable()          UI: data-action="insert-table" / Strg+Shift+T ✓
Zeile 782  fontName                    floating Toolbar change UI: floating font-Select ✓ erreichbar
Zeile 788  fontSize ('7')              floating Toolbar change UI: floating fontSize-Select ✓ erreichbar
Zeile 915  removeFormat                applyFloatingFormat()  UI: floating "✕ Format"-Button ✓ erreichbar
Zeile 916  backColor ('transparent')   applyFloatingFormat()  UI: floating "✕ Format"-Button ✓ erreichbar
= 21 execCommand-Aufrufe insgesamt
```

Hinweis zu Zeile 341 (`fontName` in `formatText()`): Es wurde in den Templates KEIN `data-editor="font"`-Button gefunden. Die tatsächlich genutzten Font-Picker sind `setEditorFont()` (statische Select-Box) und der floating-Toolbar-Font-Select (Zeile 782) — beide eigene, separate execCommand-Aufrufe. Der `formatText()`-`font`-Zweig könnte ebenfalls toter Code sein; das MUSS empirisch (Grep auf `data-editor="font"` in allen Templates, nicht nur Wiki) vor der Baseline-Erhebung final geklärt werden, da es die Zählung „welche der 21 sind per UI testbar" beeinflusst.

### fontSize-Migration (kompletter Ersatz, siehe Pattern 2 für Begründung)

```javascript
// Ersatz für: ui/editors/rich-text.js:393-398
// document.execCommand('fontSize', false, '7');
// const fontElements = editor.querySelectorAll('font[size="7"]');
// fontElements.forEach(el => { el.removeAttribute('size'); el.style.fontSize = select.value; });

const range = selection.getRangeAt(0);
const wrapper = document.createElement('font');
wrapper.style.fontSize = select.value;
try {
    range.surroundContents(wrapper);
} catch (e) {
    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
}
// Ergebnis ist markup-identisch zum bisherigen Endzustand: <font style="font-size:…">…</font>,
// OHNE den transienten size="7"-Zwischenschritt (der beim execCommand-Weg ohnehin nie
// persistiert wurde — siehe Pattern 2).
```

### `defaultParagraphSeparator` — kein Format-Kommando, betrifft natives Enter

```javascript
// Quelle: ui/editors/rich-text.js:511-516
try {
    document.execCommand('defaultParagraphSeparator', false, 'div');
} catch (e) {
    // Ignore
}
```
Dieser Call konfiguriert das Browser-native Verhalten für NICHT abgefangene Enter-Presses (Shift+Enter fällt durch `handleEditorKeydown()`s `if (e.key === 'Enter' && !e.shiftKey)`-Bedingung durch und wird NICHT abgefangen — natives Enter-Verhalten des `contenteditable`-Elements greift). Chromium/Blink verwendet bereits standardmäßig `'div'` als Default-Separator, wenn `defaultParagraphSeparator` nie gesetzt wird [ASSUMED — muss im aktuell genutzten Chromium/Playwright-Build empirisch verifiziert werden, siehe CONTEXT.md Specifics: „empirisch erheben, nicht aus Doku raten"]. Falls das zutrifft, hat das ersatzlose Entfernen dieses Calls KEINEN Effekt auf D-02s Markup-Identität. Falls nicht, muss ein Äquivalent gefunden werden — es gibt keine direkte Selection/Range-API, die "Standard-Absatz-Trenner für natives contenteditable-Enter" konfiguriert; die einzige robuste Alternative wäre, den bisher unabgefangenen Shift+Enter-Fall EBENFALLS über `keydown` abzufangen und explizit `<div>` statt nativem Verhalten einzufügen (würde D-06 „kein execCommand mehr" erfüllen, aber die Interaktionslogik geringfügig verändern — mit dem Nutzer abstimmen, ob das noch „verhaltensneutral" ist oder als Ausnahme gilt).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.execCommand()` für Rich-Text-Bearbeitung | `Selection`/`Range`-DOM-APIs, ergänzt um Input Events Level 2 (`beforeinput`) für komplexere Editoren | execCommand seit ~2018 formal "obsolete" in der HTML-Spec markiert, aber weiterhin implementiert (kein Entfernungsdatum bekannt) [CITED: MDN `Document/execCommand`] | Rich-Text-Editing-Code muss langfristig ohne execCommand auskommen; Chromium/Firefox/Safari unterstützen es aktuell noch alle, es gilt aber als technische Schuld |

**Deprecated/outdated:**
- `document.execCommand(...)`: Formal deprecated, funktioniert aber in allen aktuellen Chromium-Versionen weiter (Playwright nutzt Chromium — die Baseline-Tests dieser Phase laufen gegen genau die Engine, in der execCommand noch funktioniert) [CITED: MDN `Document/execCommand`, GitHub `mdn/content#40245` — „execCommand has valid use cases without viable alternatives", z. B. dass execCommand-Änderungen den nativen Undo-Buffer des Browsers befüllen, was reine DOM-Manipulation nicht tut]. Letzterer Punkt bestätigt indirekt D-01s Entscheidung: der Verlust des nativen Undo-Buffers nach der Migration ist eine bekannte, dokumentierte Nebenwirkung dieses Migrationstyps, keine App-spezifische Überraschung.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Chromium/Blink verwendet `'div'` als Default-Absatztrenner für natives `contenteditable`-Enter-Verhalten, auch ohne expliziten `execCommand('defaultParagraphSeparator', …)`-Call | Code Examples, „defaultParagraphSeparator" | Falls falsch: Shift+Enter erzeugt nach Entfernen des Calls andere Absatzstruktur (`<p>` statt `<div>`) als heute — D-02-Verstoß, der erst im Post-Migrations-Regressionslauf auffiele. Muss vor Migrationsgruppe „Setup" empirisch verifiziert werden (siehe CONTEXT.md Specifics-Mandat). |
| A2 | Der `formatText()`-„font"-Branch (Zeile 341) hat ebenfalls keinen UI-Trigger (analog zu heading/highlight) | Code Examples, Call-Site-Inventarliste | Falls doch ein Template `data-editor="font"` nutzt (nur in Wiki-Templates geprüft, nicht in ALLEN Entity-Editor-Templates), wäre die Erreichbarkeits-Einordnung falsch und ein UI-Pfad würde beim Baseline-Test übersehen. Vor Baseline-Erhebung: Grep über ALLE `assets/templates/*.html` auf `data-editor="font"` wiederholen. |
| A3 | `window.EDITOR_FONTS`/`window.TOOLBAR_DIMENSIONS` sind tatsächlich zur Laufzeit `undefined` und lösen die beschriebenen Fehler aus (nicht nur „im Quellcode nicht gefunden") | Summary, Pitfall 1 | Falls doch zur Laufzeit definiert (z. B. durch einen hier nicht gefundenen dynamischen Zuweisungspfad), wäre die empfohlene Vorab-Klärung mit dem Nutzer unnötig — aber die empirische Prüfung selbst (Font-Dropdown im gebauten Bundle testen) ist so oder so risikofrei und schnell, daher trotzdem empfohlen. |
| A4 | `sanitizeHTML()`s Whitelist filtert `<strike>`-Tags heraus (nur `<s>` erlaubt) | Pitfall 5 | Basiert auf einer gelesenen, aber nicht bis zum Dateiende durchgezählten `allowedTags`-Liste (`utils/basic.js:72-100`, ca. 30 Zeilen gelesen). Falls `strike` doch in einer späteren, nicht gelesenen Zeile der Liste steht, entfällt der Persistenz-Bug — die Warnung würde sich erübrigen, aber der empfohlene Test bleibt trotzdem sinnvoll als Teil der ohnehin geforderten Markup-Empirie. |

**Wie zu lesen:** A1-A4 sind alles Punkte, die CONTEXT.md bereits implizit verlangt empirisch zu klären („Die tatsächlichen execCommand-Markup-Formen … empirisch erheben"). Diese Research-Phase liefert die GRÜNDE, warum diese Empirie nötig ist (konkrete Fundstellen mit Unsicherheit), nicht die fertigen Messwerte selbst — letztere entstehen erst beim Bauen und Ausführen des Baseline-Netzes (D-04a, Aufgabe des ersten Plans).

## Open Questions

1. **Ist Pitfall 1 (EDITOR_FONTS/TOOLBAR_DIMENSIONS) ein Blocker für diese Phase oder eine separate Angelegenheit?**
   - What we know: Beide Bezeichner sind im aktuellen Quellcode nirgends definiert; ein Regressions-Commit vom 10. Januar 2026 hat `EDITOR_FONTS` aus `core/constants.js` entfernt.
   - What's unclear: Ob dieser Zustand im gebauten/deployten Bundle tatsächlich zu einem sichtbaren Fehler führt (evtl. ist das ausgelieferte `dist/`-Bundle im Repo noch älter und enthält die Definition noch), und ob der Nutzer dies bereits kennt (kein Eintrag in `docs/bugfixes.md`).
   - Recommendation: Vor Plan 1 (Baseline-Netz) eine 5-Minuten-Verifikation am frisch gebauten Bundle durchführen und das Ergebnis dem Nutzer vorlegen, bevor die Migrationsgruppe „Fonts/Größen" (D-05) geplant wird — die Gruppe braucht eine funktionierende Baseline, um überhaupt sinnvoll getestet werden zu können.

2. **Wie soll mit den 2 toten Code-Pfaden (heading, highlight in `formatText()`) umgegangen werden?**
   - What we know: D-06 verlangt „alle 21 Call-Sites ersetzt" ohne Ausnahme für unerreichbaren Code.
   - What's unclear: Ob „ersetzt" bedeutet, die tote Funktionalität 1:1 nachzubauen (auch wenn sie nie aufgerufen wird), oder ob eine Absprache mit dem Nutzer eine Bereinigung (Entfernen des toten Zweigs) statt Migration erlaubt.
   - Recommendation: Im Zweifel 1:1 migrieren (konservativste Lesart von D-06), mit einem Kommentar im Code, der auf die fehlende UI-Anbindung hinweist — Testabdeckung ausschließlich per direktem Funktionsaufruf (`page.evaluate`).

3. **Ist die in Pitfall 5 vermutete `sanitizeHTML()`-Filterung von `<strike>` real, und falls ja: gehört die Behebung in diese Phase?**
   - What we know: `strikeThrough` via execCommand erzeugt in Chromium `<strike>`; die gelesene Teilliste von `allowedTags` in `sanitizeHTML()` enthielt kein `strike`.
   - What's unclear: Ob die vollständige Liste `strike` doch enthält (nicht bis Dateiende gelesen) und ob — falls der Bug real ist — er bereits vor dieser Phase existierte (dann: nicht Teil des Milestone-Scopes, nur dokumentieren) oder ob er faktisch bedeutet, dass Strikethrough via statische Toolbar heute schon nie persistiert.
   - Recommendation: Bei der empirischen Markup-Erhebung als expliziten Testfall aufnehmen (Strikethrough via statische Toolbar → Speichern → Reload → ist der Strike noch da?). Ergebnis dem Nutzer vorlegen, bevor die Inline-Format-Migrationsgruppe geplant wird.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Playwright/Jest-Ausführung, `npm ci` | ✓ (Projekt-Standard, `engines.node >=18.0.0`) | — | — |
| `@playwright/test` | E2E-Regressionsnetz (D-04a) | ✓ [VERIFIED: package.json] | `^1.57.0` | — |
| `jest` | Optionale Unit-Tests für tote Code-Pfade (Pitfall 3) | ✓ [VERIFIED: package.json] | `^30.2.0` | — |
| Python 3 | `python build.py` vor jedem E2E-Lauf (Bundle-Erzeugung) | ✓ (Projektstandard, in CI via `actions/setup-python@v5`) | `3.x` | — |
| Chromium (Playwright-Browser) | E2E-Ausführung (`playwright.config.js` projects: `chromium` only) | ✓ (installiert via `npx playwright install --with-deps chromium` in CI; lokal ggf. `npx playwright install` nötig) | — | — |
| GitHub Actions `e2e`-Job | CI-Gate für das neue Netz | ✓ (bereits aus Phase 8 vorhanden, blockierend, `needs: [lint-and-typecheck, test]`) | — | — |

**Missing dependencies with no fallback:** Keine.

**Missing dependencies with fallback:** Keine — alle benötigten Werkzeuge sind bereits Projektstandard aus vorherigen Phasen.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright `^1.57.0` (E2E, primär für diese Phase) + Jest `^30.2.0` (optional für tote Code-Pfade) |
| Config file | `playwright.config.js` (Chromium-only, `file:///…/dist/dnd-tracker-bundled.html`, `retries: 2` in CI, `workers: 1` in CI) |
| Quick run command | `npx playwright test tests/e2e/features/editor-formatting.spec.js` (Dateiname Vorschlag, Claude's Discretion) |
| Full suite command | `python build.py && npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | Alle 21 execCommand-Ersatz-Implementierungen erzeugen identisches Markup wie die execCommand-Baseline | e2e (Markup-Assertion) | `npx playwright test tests/e2e/features/editor-formatting.spec.js -g "Bold\|Italic\|Underline\|Strikethrough\|Liste\|Font\|Highlight"` | ❌ Wave 0 — Datei existiert noch nicht |
| EDIT-01 (tote Pfade) | `formatBlock`/heading und `removeFormat`+`backColor`/highlight via `formatText()` bleiben nach Migration funktionsgleich (auch ohne UI-Trigger) | e2e via `page.evaluate()` oder Jest mit jsdom | `npx playwright test -g "toter Code\|heading\|dead-path"` (Namensvorschlag) | ❌ Wave 0 |
| EDIT-02 | Beide Toolbars (statisch + floating) + Markdown-Shortcuts funktionieren in allen 6 Entity-Editoren unverändert | e2e (Smoke pro Editor) | `npx playwright test tests/e2e/features/editor-formatting.spec.js -g "Smoke"` | ❌ Wave 0 |
| EDIT-03 | Regressionsnetz existiert und deckt Kern-Formatierungen ab | e2e (das Netz selbst ist der Liefergegenstand) | `npx playwright test tests/e2e/features/editor-formatting.spec.js` | ❌ Wave 0 |
| D-03 (Persistenz-Roundtrip) | Formatieren → Speichern → Reload → Markup intakt, je Formatgruppe | e2e (`page.reload()` + Markup-Re-Assertion) | Teil derselben Spec-Datei, `-g "Roundtrip"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit (je Migrationsgruppe, D-05):** `python build.py && npx playwright test tests/e2e/features/editor-formatting.spec.js` — komplettes Netz muss nach JEDER Gruppe grün sein (D-05-Vorgabe, nicht nur die Tests der gerade migrierten Gruppe).
- **Per wave merge:** volle Suite (`npx playwright test`), da das neue Netz automatisch Teil des blockierenden `e2e`-CI-Jobs ist (Phase 8, D-03).
- **Phase gate:** D-04a verlangt das Netz VOR der Migration ZWEIFACH grün gegen die unveränderte execCommand-Baseline — das ist eine zusätzliche, über die normale Nyquist-Stichprobe hinausgehende Anforderung, die im ersten Plan als expliziter Verifikationsschritt (zwei aufeinanderfolgende volle Testläufe) auftauchen muss.

### Wave 0 Gaps

- [ ] `tests/e2e/features/editor-formatting.spec.js` (oder mehrere Dateien, Claude's Discretion D-04) — deckt alle Formatgruppen aus REQ EDIT-01/EDIT-03 ab; existiert noch nicht.
- [ ] Empirische Markup-Baseline-Erhebung (kein Testcode, sondern eine Wissensbasis: pro Kommando einmal ausführen, HTML-Output notieren) — Voraussetzung für exakte Assertions in der neuen Spec-Datei, per CONTEXT.md Specifics zwingend vor Testerstellung.
- [ ] Klärung von Pitfall 1 (EDITOR_FONTS/TOOLBAR_DIMENSIONS) — beeinflusst, ob die Migrationsgruppe „Fonts/Größen" überhaupt sinnvoll testbar ist, bevor sie geplant wird.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Keine Auth in dieser Offline-Single-Page-App |
| V3 Session Management | no | Kein Server-Session-Konzept |
| V4 Access Control | no | Einzelnutzer-lokale App |
| V5 Input Validation | yes | `sanitizeHTML()` (`utils/basic.js`, DOMParser-basierte Tag-/Attribut-Whitelist) — bleibt laut D-02 UNVERÄNDERT; neue Insert-Operationen (`Range.createContextualFragment()`-Ersatz für `insertHTML`) MÜSSEN weiterhin durch denselben Sanitisierungs-Pfad beim Speichern laufen wie heute, dürfen also keinen neuen ungeprüften `innerHTML`-Zuweisungspfad einführen |
| V6 Cryptography | no | Nicht relevant für diese Phase |

### Known Threat Patterns for Rich-Text-Editing

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via eingefügtes HTML (Paste, Tabellen-Insert) | Tampering / Elevation of Privilege | Aktuell: Ad-hoc-Regex-Stripping VOR `execCommand('insertHTML')` (Attribut-Blacklist in `handleEditorPaste()`, Zeilen 586-614) + `sanitizeHTML()`-Whitelist beim späteren Speichern. `Range.createContextualFragment()` als Ersatz führt `<script>`-Inhalte laut Spec NICHT aus — vergleichbares Sicherheitsniveau zu `execCommand('insertHTML')`, aber KEIN Ersatz für die bestehende Regex-Bereinigung und `sanitizeHTML()`-Whitelist, die beide unverändert (D-02) weiterlaufen müssen |
| XSS via `<mark>`/`<font>`-Style-Injection | Tampering | `sanitizeHTML()`s `style`-Attribut-Whitelist (nur bestimmte CSS-Properties erlaubt, `utils/basic.js:103-118`) filtert bereits gefährliche `style`-Werte; neue Wrapper-Elemente (Pattern 1/2) müssen weiterhin nur die bereits erlaubten Properties setzen (z. B. `font-size`, nicht z. B. `background-image: url(javascript:…)`) |
| Bekannte, aber außerhalb des Scopes liegende Lücke: `saveSpell()` speichert `descEl.innerHTML` OHNE `sanitizeHTML()`-Wrapper (`ui/editors/rich-text.js:1288/1303`, im Unterschied zu Wiki, das `sanitizeHTML(contentEl.innerHTML)` nutzt) | Tampering | Spells sind NICHT Teil der D-04-Referenz-/Smoke-Editor-Liste (Wiki, NPCs, Orte, Quests, Sessions, Quick-Ref) — dieser Fund liegt außerhalb des Phase-9-Scopes, sollte aber für SEC-01/SEC-02 (Phase 10, Security-Audit) vorgemerkt werden, nicht in dieser Phase behoben werden (Milestone-Leitplanke: verhaltensneutral) |

## Sources

### Primary (HIGH confidence)
- `ui/editors/rich-text.js` (vollständig gelesen, 1506 Zeilen) — alle 21 execCommand-Call-Sites, Toolbar-Handler, Paste-Handler
- `ui/actions/system-actions.js` (Zeilen 1-140) — Toolbar-Action-Registry, Verdrahtung statisch↔`rich-text.js`
- `utils/basic.js` (Zeilen 1-170) — `sanitizeHTML()`-Whitelist
- `core/constants.js` (vollständig via Grep durchsucht) — Beleg für fehlendes `EDITOR_FONTS`/`TOOLBAR_DIMENSIONS`
- `assets/templates/modals-entity.html`, `view-resources.html`, `view-tools.html`, `view-encounters.html`, `view-party.html` — Toolbar-Markup, `data-action`/`data-editor`-Attribute
- `tests/e2e/features/wiki.spec.js`, `tests/e2e/helpers/test-utils.js`, `playwright.config.js` — bestehendes Testmuster
- `.github/workflows/ci.yml` — blockierender `e2e`-Job aus Phase 8
- `.planning/codebase/CONCERNS.md` — bereits dokumentierte execCommand-Fundstellen außerhalb von `rich-text.js`
- `git log -S EDITOR_FONTS -- core/constants.js` — Regressions-Commit-Nachweis (10. Januar 2026)
- `package.json` — Playwright `^1.57.0`, Jest `^30.2.0` [VERIFIED: direkt gelesen]

### Secondary (MEDIUM confidence)
- [MDN: Document: execCommand() method](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand) — Deprecation-Status, Undo-Buffer-Verhalten
- [MDN: Range: surroundContents() method](https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents) — `InvalidStateError`-Bedingung bei Teilselektionen
- [GitHub mdn/content#40245: `document.execCommand` has valid use cases without viable alternatives](https://github.com/mdn/content/issues/40245) — bestätigt Undo-Buffer-Nebenwirkung, stützt D-01

### Tertiary (LOW confidence)
- Allgemeine Websuchergebnisse zu "execCommand deprecated replacement" (freeCodeCamp-Artikel, dev.to-Beiträge) — nur zur groben Einordnung des State-of-the-Art genutzt, nicht für konkrete Migrationsentscheidungen zitiert

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — keine neuen Abhängigkeiten, reine Browser-API-Migration, bestehende Referenzimplementierung im Code selbst vorhanden
- Architecture: HIGH — alle 21 Call-Sites einzeln per Grep lokalisiert und gegen UI-Templates auf Erreichbarkeit geprüft
- Pitfalls: HIGH für Pitfall 2-4/6 (direkt am Code verifiziert), MEDIUM für Pitfall 1/5 (Fund statisch verifiziert, Laufzeit-Auswirkung noch nicht am laufenden Bundle bestätigt — deshalb als Open Question/Assumption markiert statt als Fakt behauptet)

**Research date:** 2026-07-25
**Valid until:** 14 Tage (kurzlebig, da diese Research auf einem Momentaufnahme-Grep des aktuellen `main`-Branchs beruht; jede weitere Änderung an `ui/editors/rich-text.js` oder `core/constants.js` vor Phasenbeginn entwertet die Zeilennummern-Referenzen)
