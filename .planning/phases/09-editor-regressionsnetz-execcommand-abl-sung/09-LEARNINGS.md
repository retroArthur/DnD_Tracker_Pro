---
phase: 9
phase_name: "Editor-Regressionsnetz & execCommand-Ablösung"
project: "D&D Kampagnen-Tracker Pro"
generated: "2026-07-27"
counts:
  decisions: 6
  lessons: 7
  patterns: 5
  surprises: 6
missing_artifacts:
  - "09-UAT.md (keine UAT-Session für diese Phase)"
---

# Phase 9 — Learnings: Editor-Regressionsnetz & execCommand-Ablösung

Die Phase mit der höchsten Beweisdichte des Milestones: 9 Pläne über 8 Wellen, ein Netz aus 79 Tests,
das **vor** der ersten Migration gegen eine empirisch gemessene Baseline stand — und ein
eingefrorener Beweisstand, dessen einzige zulässige Änderung schriftlich benannt war.

## Decisions

**Baseline-Definition „option-a": den reparierten, nicht den defekten Zustand einfrieren**
Die Messung ergab, dass `EDITOR_FONTS` und `TOOLBAR_DIMENSIONS` schlicht `undefined` waren — die
floating Toolbar war nie sichtbar, der Font-Picker fiel still auf Arial zurück. Der Entwickler
entschied, diese Fremd-Regression in 09-02 zu reparieren und **den reparierten Zustand** als
eingefrorene Baseline zu setzen. Begründung: beide Toolbar-Varianten müssen testbar sein, EDIT-02
muss belegbar sein. Bewusst protokolliert als Ausnahme zur Milestone-Leitplanke
„verhaltensneutral" — Font-Picker und floating Toolbar werden dadurch erstmals bedienbar.
*Source: 09-01-SUMMARY.md*

**Gefundene Bugs einfrieren statt nebenbei reparieren**
Die Baseline-Erhebung hatte den ausdrücklichen Auftrag, Fehlzustände als Fund zu dokumentieren und
dem Entwickler vorzulegen — nicht sie stillschweigend als korrekt zu protokollieren oder zu fixen.
So blieben A4 (Strikethrough überlebt den Reload nicht) und Fund 3 (Doppel-Paste-Listener) bewusst
unangetastet und wurden für Phase 10 vorgemerkt.
*Source: 09-01-SUMMARY.md*

**Zwei-Aufrufer-Signatur statt Umbau der Aufrufer**
`setEditorFont()`/`setEditorFontSize()` prüfen nun den Typ des zweiten Arguments (String vs.
`<select>`), statt `system-actions.js` umzubauen. Minimalinvasiv, beide bestehenden Aufrufpfade
laufen unverändert.
*Source: 09-02-SUMMARY.md*

**Den alten, beweisfreien Testblock löschen statt umschreiben**
Der `test.describe('Wiki Editor Formatierung')`-Block in `wiki.spec.js` klickte per
`if (await btn.isVisible())` und prüfte danach nichts. Ersatzlos entfernt statt umgeschrieben —
vermeidet zwei Quellen der Wahrheit für dieselbe Funktionalität.
*Source: 09-02-SUMMARY.md*

**`sanitizeInsertedInlineStyle()` als String-Transformation statt CSSOM-Touch**
Ein Probe-Skript widerlegte den naheliegenden Weg: eine reine CSSOM-Operation
(`el.style.removeProperty()`) reproduziert die Eigenheit der alten API **nicht** — sie lässt
`background: var(--bg-elevated)` unangetastet, während `insertHTML` es in acht leere
Langform-Eigenschaften auflöst. Die explizite String-Nachbildung trifft alle drei real vorkommenden
Stil-Muster exakt.
*Source: 09-08-SUMMARY.md*

**Sicherheits-Regressionstest bewusst ohne `<table>`-Wrapper**
Der Payload ohne Tabelle fällt auf den `insertText()`-Zweig zurück und ist damit sicher — die
Acceptance-Kriterien sind erfüllbar. Derselbe Payload **innerhalb** eines `<table>` überlebt
empirisch bis in den Editor-DOM. Dieser Fund wurde bewusst **nicht** als Test gegen den unsicheren
Ist-Zustand eingefroren, sondern als offener `WINDOWS.md`-Eintrag vermerkt — eine Assertion, die den
unsicheren Zustand zementiert, liefe dem Zweck eines Sicherheits-Regressionstests zuwider.
*Source: 09-04-SUMMARY.md*

## Lessons

**Ein Zählnachweis-Test zählt Kommentare mit**
Neue Dokumentationskommentare, die das Wort `execCommand` zur Erklärung nutzten, trieben den
Zählwert von 3 auf 7. Ab da galt die Paraphrase „Editier-Kommando-API" in allen Kommentaren. Derselbe
Fehler war Phase 8 schon einmal passiert (YAML-Kommentar mit `continue-on-error`) — **String-basierte
Gates kollidieren mit Prosa, die den verbotenen String benennt.**
*Source: 09-08-SUMMARY.md, vgl. 08-04-SUMMARY.md*

**Eine eingefrorene Beweisbasis braucht eine benannte Ausnahme — sonst blockiert sie sich selbst**
Der Netz-Freeze erlaubte als einzige Änderung den Zählnachweis-Test und beschrieb nur den finalen
Sprung `21 → 0` in Plan 09-09. Da aber **jeder** Zwischenplan sein eigenes Hard-Gate über das
komplette Netz fährt, wäre der Test ab der ersten migrierten Call-Site dauerhaft rot geblieben. Die
Ausnahme musste in 09-06, 09-07 und 09-08 je zweimal angewandt werden (21→16→12→10→6→…→0), jedes Mal
protokolliert.
*Source: 09-06/09-07/09-08-SUMMARY.md*

**Die Selektionsart entscheidet über das Verhalten — im Test wie im Code**
`range.selectNodeContents(element)` setzt den Range-Container auf das **Element** (mit
Kind-Index-Offsets), nicht auf dessen Textknoten. Dadurch trifft die App-eigene
`.parentElement.closest(tag)`-Toggle-Erkennung den Editor-Container statt das Format-Tag und wrappt
doppelt (`<b><b>Text</b></b>`) statt zu entfernen. Im Test per Zeichen-Offset-Range gelöst — im
migrierten Code per `closestEditorAncestor()`, das den `nodeType` prüft.
*Source: 09-03-SUMMARY.md, 09-06-SUMMARY.md*

**Ein Doppel-Dispatch bleibt unsichtbar, solange die API idempotent ist**
`EventDelegation._handleChange` **und** `_handleInput` feuern beide für `<select data-action>`. Bei
der alten Kommando-API war das ein No-Op auf bereits identisch formatiertem Text. Die reine
Selection/Range-Ersetzung erzeugte dadurch bei jeder Auswahl einen zweiten, verschachtelten
`<font>`-Wrapper. **Eine Migration deckt latente Defekte der Umgebung auf, weil sie deren Toleranz
verliert.**
*Source: 09-07-SUMMARY.md*

**Eine wiederverwendete Hilfsfunktion passt nur zu ihrem bisherigen Aufrufer**
`clearInlineFormattingAtSelection()` aus 09-06 deckte nur den Farb-Style-Teil ab — ihr einziger
Aufrufer (der UI-lose `highlight('none')`-Zweig) hatte nie verschachtelte Auszeichnungen in der
Selektion. Der Plan sah vor, sie unverändert für „Format entfernen" wiederzuverwenden; das hätte
`<b>` stehen gelassen. Erweiterung um einen Unwrap-Schritt war nötig.
*Source: 09-07-SUMMARY.md*

**Eine Cursor-Position hinter einem abschließenden `<br>` ist in Chromium nicht stabil**
Weder Container/Kindindex noch ein leerer Rest-Textknoten halten sie — der nächste getippte Text
landet kommentarlos **vor** dem Umbruch. Gelöst über einen Zero-Width-Space-Platzhalter als
Text-Anker, der beim nächsten echten Input per `deleteData()` an exakter Position entfernt wird
(eine komplette `.data`-Neuzuweisung wirft eine Selektion an der Löschgrenze fälschlich auf den
Anfang zurück — ebenfalls empirisch verworfen).
*Source: 09-08-SUMMARY.md*

**Ein Acceptance-Grep kann überbreit sein und trotzdem stehenbleiben**
Der Check „keine neue funktions-lokale `const X = window.X`" erfasst auch harmlose Muster wie
`const selection = window.getSelection()` — 25+ Vorkommen bestanden bereits vorher. Statt am
planfremden Code zu korrigieren (Scope Boundary), wurde die Überbreite zweimal als informationeller
Hinweis dokumentiert und manuell gegen die echte Anti-Pattern-Definition geprüft.
*Source: 09-06/09-07-SUMMARY.md*

## Patterns

**Erst messen, dann das Netz bauen, dann migrieren**
Das Markup-Inventar aller 21 Call-Sites wurde empirisch am gebauten Bundle erhoben, nicht aus der
Dokumentation geraten. Erst danach entstanden die Assertions, erst danach die Migration. Ein Netz mit
geratenen Sollwerten hätte die Ablösung nicht absichern können.
*Verwenden bei: jeder Migration, die Verhaltensgleichheit verspricht. Source: 09-01-SUMMARY.md*

**Doppel-Grün-Gate vor dem Einfrieren**
Das komplette Netz lief zweimal unmittelbar hintereinander (80/80, 0 Retries) gegen einen Commit, der
seit der Baseline-Reparatur die relevanten Dateien nicht verändert hatte — per `git log` verifiziert.
Erst danach galt der Beweisstand als eingefroren.
*Verwenden bei: jedem Regressionsnetz, das als Migrationsgrundlage dient. Source: 09-05-SUMMARY.md*

**Netz-Freeze mit schriftlichem Rot-Verfahren**
Ab dem Doppel-Grün ist jede Änderung an den Netz-Dateien begründungspflichtig und gilt als
Beweis-Leck-Verdacht. Die eine erlaubte Ausnahme ist namentlich benannt, und jede ihrer Anwendungen
wird mit Migrationsgruppe, altem/neuem Erwartungswert, Begründung und Commit protokolliert.
*Verwenden bei: mehrstufigen Migrationen mit Zwischen-Gates. Source: 09-05-SUMMARY.md*

**Temporäre Probe-Specs zur Messung, danach löschen**
Erwartungswerte wurden per Wegwerf-Spec am gebauten Bundle erhoben und anschließend entfernt, nicht
committet. Gleiches Muster bei den Chromium-Eigenheiten (Style-Normalisierung, Cursor-Stabilität).
*Verwenden bei: Assertions, deren Sollwert nur empirisch bestimmbar ist. Source: 09-02/09-08-SUMMARY.md*

**Persistenz-Roundtrip als eigener Test, nicht nur DOM-Zustand**
Für jede Formatierung existiert ein separater Test speichern → Reload → wiedereröffnen → erneut exakt
prüfen. Auch das **Entfernen** einer Formatierung bekam Roundtrip-Tests. Deckte die
`sanitizeHTML()`-Whitelist-Effekte auf (`border-radius`/`display` fallen weg, kein trailing
Semikolon).
*Verwenden bei: allem, was durch einen Sanitizer in den Speicher wandert. Source: 09-02/09-03-SUMMARY.md*

## Surprises

**Die floating Toolbar war per Maus überhaupt nicht bedienbar**
`EDITOR_FONTS` und `TOOLBAR_DIMENSIONS` waren beide `undefined` — die Toolbar wurde nie sichtbar. Das
war keine Annahme der Recherche, sondern fiel erst bei der Messung auf.
*Impact: Änderte die Baseline-Definition und machte eine Reparatur zur Voraussetzung der Phase.
Source: 09-01-SUMMARY.md*

**Drei unbekannte Zusatzfunde in der Baseline-Erhebung**
Neben der unbedienbaren Toolbar: ein zweiter, von `EDITOR_FONTS` unabhängiger Argument-Mismatch in
den Font-Settern, und ein Paste-Handler, der wegen doppelter Listener-Registrierung alles zweifach
einfügt.
*Impact: Zwei davon wanderten in die Baseline-Reparatur, einer wurde eingefroren.
Source: 09-01-SUMMARY.md*

**Chromiums `insertHTML` normalisiert Styles auf überraschende Weise**
Das `background`-Shorthand wird zu acht leeren `background-*`-Langhand-Properties expandiert,
`padding`/`color` fallen komplett weg — und `padding`/`margin`/`width`/`border-collapse` werden
**immer** entfernt. Nichts davon war dokumentiert; alles musste per Probe-Skript gegen Chromium
143.0.7499.4 gemessen werden.
*Impact: Erzwang eine explizite Nachbildung statt der naheliegenden CSSOM-Lösung.
Source: 09-02/09-08-SUMMARY.md*

**Der Doppel-Paste-Bug änderte die Struktur, nicht nur die Menge**
Weil die wörtliche Umsetzung des Research-Patterns den Cursor als Geschwister-Knoten platzierte,
fügte der doppelt feuernde Listener die zweite Tabelle **neben** statt **verschachtelt in** die erste
ein — abweichend von der gemessenen Baseline. Der Fix musste zum tiefsten letzten Nachfahren
absteigen, um die alte Cursor-Platzierung zu reproduzieren.
*Impact: Ein eingefrorener Bug diktierte das Verhalten des Ersatzcodes.
Source: 09-08-SUMMARY.md*

**Ein Sicherheitsfund entstand während der Testautorenschaft**
Der Tabellen-Paste-Zweig entfernt keine `on*`-Attribute. Gefunden beim Schreiben des
Sicherheits-Regressionstests, nicht bei der Sicherheitsarbeit.
*Impact: Als `WINDOWS.md`-Eintrag für Triage vorgemerkt; wurde in Phase 10 aufgegriffen.
Source: 09-04-SUMMARY.md*

**Eine planfremde, nie committete Debug-Datei blockierte das Abschluss-Gate**
`_smoke_welt.cjs` am Repo-Root enthielt einen echten `no-unused-vars`-Fehler und hielt `npm run lint`
rot. Entfernt — nie im Git-Verlauf, kein Verlust.
*Impact: Kostete Zeit im letzten Gate der Phase. Source: 09-09-SUMMARY.md*
