# Phase 9: Editor-Regressionsnetz & execCommand-Ablösung - Context

**Gathered:** 2026-07-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Der Rich-Text-Editor wird von 21 deprecated `document.execCommand`-Aufrufen in `ui/editors/rich-text.js` auf moderne Selection/Range-DOM-APIs migriert — beweisbar verhaltensgleich durch ein neues E2E-Regressionsnetz, das VOR der Migration existiert und gegen den bestehenden execCommand-Code grün läuft (Baseline). Nach der Migration bleibt dasselbe Netz grün. Alle Entity-Editoren (Wiki, NPCs, Orte, Quests, Sessions, Quick-Ref) und beide Toolbar-Varianten (statisch, floating) inkl. Markdown-Live-Shortcuts funktionieren unverändert.

Milestone-Leitplanke v1.1 gilt: verhaltensneutral aus Nutzersicht — keine neuen Editor-Features, keine UX-Änderungen.

</domain>

<decisions>
## Implementation Decisions

### Editor-Undo (Strg+Z)
- **D-01:** **Status quo festschreiben.** Strg+Z löst überall das App-Daten-Undo aus — auch bei Fokus im Editor (`systems/spellslots/keyboard-shortcuts.js:66`: „immer aktiv", `preventDefault()`). Ein Text-/Formatierungs-Undo im Editor ist **explizit KEIN Ziel** dieser Migration. Akzeptierte Konsequenz: Das native Browser-Undo (heute nur übers Kontextmenü erreichbar) wirkt nach der Migration nicht mehr auf Formatierungen — ersatzlos. Das Regressionsnetz darf kein Text-Undo im Editor erwarten und dokumentiert diese Baseline.

### Markup-Kompatibilität
- **D-02:** **Identisches Markup.** Die neue Selection/Range-Implementierung erzeugt exakt die Tags, die Chromium-execCommand heute erzeugt: `<b>`/`<i>`/`<u>`/`<strike>`, `<font face>`/`<font size>`, `<div>`-Absätze (defaultParagraphSeparator), backColor-Spans wie heute. Alt- und Neu-Inhalte sind ununterscheidbar; `sanitizeHTML`-Whitelist (`utils/basic.js:58`) und `assets/styles/editors.css` bleiben **unangetastet**. Die Toggle-Erkennung (ist Selektion bereits formatiert?) erkennt dieselben Tag-Formen wie heute. Konsequenz: Das Netz kann Verhaltensgleichheit über exakte Markup-Assertions beweisen.

### Regressionsnetz
- **D-03:** **Prüfebene: Markup + Roundtrip.** Je Kern-Formatgruppe: (a) exakte DOM-Markup-Assertion unmittelbar nach der Toolbar-Aktion, (b) Persistenz-Roundtrip (formatieren → speichern → App neu laden → Markup intakt). Der Roundtrip deckt die sanitizeHTML-Speicher-Pipeline ab, die Markup strippen könnte.
- **D-04:** **Abdeckung: Referenz-Editor + Smoke.** Wiki ist Referenz-Editor: alle Formatgruppen (Bold/Italic/Underline/Strikethrough, Listen, Links, Tabellen, Border, Read-Aloud-Stile, Fonts/Größen, Highlight) über BEIDE Toolbars (statisch + floating) plus Markdown-Live-Shortcuts. Jeder weitere Entity-Editor (NPCs, Orte, Quests, Sessions, Quick-Ref) bekommt einen schlanken Smoke-Test (z. B. Bold via floating Toolbar + ein Markdown-Shortcut), der die Verdrahtung der geteilten Engine beweist.
- **D-04a:** **Baseline-First-Regel:** Das Netz MUSS in einem eigenen Plan VOR allen Migrations-Plänen entstehen und zweifach grün gegen den unveränderten execCommand-Code laufen. Während der Migration werden die Netz-Tests NICHT angepasst (Markup-Identität per D-02 macht Anpassung unnötig — jede nötige Teständerung wäre ein Beweis-Leck und ist begründungspflichtig).

### Migrations-Strategie
- **D-05:** **Inkrementell je Kommandogruppe.** Migration in sinnvollen Gruppen (z. B. Inline-Formate → Listen/Block → Fonts/Größen → Highlight/Clear → HTML/Text-Inserts → Setup/defaultParagraphSeparator). Nach jeder Gruppe muss das KOMPLETTE Netz grün sein; ein atomarer Commit je Gruppe.
- **D-06:** **Kein Laufzeit-Fallback** auf execCommand (kein Feature-Flag, keine Doppel-Codepfade). Rollback-Einheit ist der Git-Revert einer Gruppe. EDIT-01 gilt erst als erfüllt, wenn alle 21 Call-Sites ersetzt sind.

### Fortgeltende Testregeln (aus Phase 8, nicht erneut verhandeln)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Editor-Code (Migrationsgegenstand)
- `ui/editors/rich-text.js` — Die 21 execCommand-Call-Sites (Z. 329–916: bold/italic/underline/strikeThrough, insertUnorderedList, formatBlock, fontName ×2, fontSize ×2, backColor ×2, removeFormat ×2, insertHTML ×3, insertText, insertLineBreak, defaultParagraphSeparator); Kernfunktionen `formatText`, `setEditorFont`, `setEditorFontSize`, `clearEditorFormatting`, `setBorderFormat`, `setReadAloudFormat`, `insertTable`, Paste-Handler, Floating- und Context-Toolbars
- `ui/editors/markdown-shortcuts.js` + `ui/editors/markdown-converter.js` — Markdown-Live-Shortcuts (Success Criterion 4: müssen unverändert funktionieren)
- `core/constants.js` — `EDITOR_FONTS`, `READ_ALOUD_STYLES` (Namespaces `DND_RULES`/`UI_CONSTANTS`)
- `assets/styles/editors.css` — Editor-/Toolbar-/Read-Aloud-CSS; bleibt per D-02 unangetastet
- `utils/basic.js:58` — `sanitizeHTML`-Whitelist (Produktion; Zwilling in `utils/testable-utils.js:34`) — Roundtrip-Prüfziel, bleibt per D-02 unangetastet
- `systems/spellslots/keyboard-shortcuts.js:66` — Strg+Z „immer aktiv"-Zweig (Beleg für D-01-Baseline)

### Tests & CI
- `tests/e2e/features/wiki.spec.js` — bestehender editor-nächster Spec (Muster für Editor-Interaktion im Netz)
- `tests/e2e/helpers/test-utils.js` — zentrale E2E-Helper (loadApp, navigateToTab, clickAction …)
- `playwright.config.js` — file://-Baseline gegen `dist/dnd-tracker-bundled.html`, CI: retries 2, workers 1
- `.github/workflows/ci.yml` — blockierender `e2e`-Job (Phase 8): das neue Netz läuft dort automatisch mit und blockt Deploys
- `.planning/phases/08-test-fundament-gr-n/08-CONTEXT.md` — fortgeltende Testregeln (Maskierungs-Kriterium D-06, Härtungsregeln)

### Projektregeln
- `CLAUDE.md` — § Conventions/execCommand (Tech-Debt-Vermerk: Ablösung ist genau diese Phase), § Synchronized Editor Toolbars, § Read-Aloud Text Styles, § Unified Editor Toolbars (3-Tier), Build-Dedup-Regeln
- `.planning/ROADMAP.md` — Phase-9-Success-Criteria (4 Kriterien, wörtlich)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/e2e/features/wiki.spec.js` + `tests/e2e/helpers/test-utils.js`: etablierte Muster für App-Boot, Tab-Navigation und Editor-Zugriff — das Netz baut darauf auf statt eigene Helper zu erfinden
- Blockierender e2e-CI-Job aus Phase 8: Das Netz wird ohne CI-Arbeit automatisch zum Deploy-Gate
- `ui/editors/rich-text.js` ist die EINE geteilte Engine aller Entity-Editoren — ein gründlich getesteter Referenz-Editor deckt die Logik, Smoke-Tests decken die Verdrahtung (Basis von D-04)

### Established Patterns
- E2E läuft gegen das gebaute Bundle via `file://` — vor jedem Lauf `python build.py` (dev); gilt auch lokal für das neue Netz
- Selektoren targeten `data-action`/`data-value` (Event-Delegation); Toolbar-Buttons sind so adressierbar
- Deutsche Testnamen („sollte …"), Abschnitts-Banner in Testdateien
- Build-Dedup-Regeln: keine funktions-lokalen `const X = window.X`, keine doppelten Top-Level-Funktionsnamen — gilt für jede neue Editor-Hilfsfunktion

### Integration Points
- Statische Toolbar im Wiki-Formular (`assets/templates/`), floating Toolbar erscheint bei Textauswahl in allen contenteditable-Editoren — beide rufen dieselben `formatText`/`setEditor*`-Funktionen
- `handleEditorPaste`/`handleEditorKeydown` (rich-text.js:564/577) nutzen execCommand für Insert-Operationen — Teil der Migrationsgruppen
- Read-Aloud/Border/Table-Funktionen bauen HTML-Strings und inserieren via `insertHTML` — bei D-02 muss das erzeugte Resultat-Markup byte-gleich bleiben

</code_context>

<specifics>
## Specific Ideas

- **Definition „verhaltensgleich" (wörtlich für Researcher/Planner/Netz):** Dieselbe Nutzeraktion erzeugt nach der Migration byte-gleiches Markup wie Chromium-execCommand heute, und der Persistenz-Roundtrip (speichern → neu laden) erhält es unverändert. Chromium ist die Referenz (Playwright-Suite läuft Chromium; App-Zielplattform ist Chromium-Browser des Nutzers).
- **Baseline-Beweis zweistufig:** Netz grün gegen execCommand (vor Migration, zweifach) → Migration je Gruppe → identisches Netz grün (nach jeder Gruppe und am Ende). Jede Testanpassung während der Migration ist begründungspflichtig (Beweis-Leck-Verdacht).
- Die tatsächlichen execCommand-Markup-Formen zu Beginn der Netz-Erstellung **empirisch erheben** (nicht aus Doku raten): pro Kommando einmal ausführen, erzeugtes HTML festhalten — das wird die Assertion-Basis.

</specifics>

<deferred>
## Deferred Ideas

- **Editor-Text-Undo (eigener Undo-Stack für Formatierungsschritte, Strg+Z im Editor-Fokus):** bewusst NICHT in v1.1 (Verhaltensänderung gegen die Leitplanke). Kandidat für einen späteren Milestone.

</deferred>

---

*Phase: 9-Editor-Regressionsnetz & execCommand-Ablösung*
*Context gathered: 2026-07-23*
