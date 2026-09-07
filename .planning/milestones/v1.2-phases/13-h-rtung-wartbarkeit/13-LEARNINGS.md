---
phase: 13
phase_name: "Härtung & Wartbarkeit"
project: "D&D Kampagnen-Tracker Pro"
generated: "2026-09-06"
counts:
  decisions: 14
  lessons: 13
  patterns: 9
  surprises: 7
missing_artifacts: []
---

# Phase 13 Learnings: Härtung & Wartbarkeit

## Decisions

### Maintainer-Override auf Erfolgskriterium 2 — die volle Undo-Serialisierung bleibt
Erfolgskriterium 2 („Weder ein Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollständige Kampagne") blieb als 8. von 8 Must-Haves unerfüllt und wurde per signiertem Override freigegeben (`accepted_by: maintainer`, `accepted_at: 2026-09-06`). `pushUndo()` serialisiert weiterhin unbedingt `window.D`; geliefert wurden der Wegfall der zweiten Vollkopie (`new Blob([dataString]).size`), Dedupe zeichengleicher Snapshots und Verdrängung unter `UNDO_BYTE_BUDGET_MB: 64` mit `UNDO_MIN_ENTRIES: 5` als Untergrenze.

**Rationale:** Das Kriterium war absoluter formuliert als die gesperrten Entscheidungen — D-09 sichert volle Wiederherstellung in EINEM Schritt zu, D-10 verwirft Scoping und Deltas. Freigabefähig war die Abweichung nur, weil der Konflikt VOR der Ausführung benannt war („⚠ Konflikt mit Erfolgskriterium 2 — bewusst und benannt") und an eine vorab gesetzte Messgrenze gebunden: einstellige Millisekunden, erreicht mit 0.922 ms Median (`GSD_WRITE_PERF_REPORT=1 npx jest tests/unit/stability.test.js`).
**Source:** 13-VERIFICATION.md (overrides, Truth 2), 13-CONTEXT.md (D-09/D-10), 13-06-SUMMARY.md

---

### D-10: Kein Undo-Scoping je Aufrufstelle, keine Delta-/Patch-Snapshots
Die naheliegende Entlastung — pro Aufrufstelle nur die berührten Teilbäume von `D` schnappschießen oder Deltas speichern — wurde verworfen und bleibt auch nach der Messung geschlossen.

**Rationale:** Beides verlagert eine Zusicherung ins Implizite („diese Aufrufstelle fasst nur `D.npcs` an"). Diese Fehlerklasse hat das Projekt zweimal getroffen (DEBT-17, DEBT-18: zwei Subsysteme, impliziter Vertrag, kein Test über die Naht), und eine falsche Scope-Angabe verlöre beim Undo STILL Daten. Deltas scheitern zusätzlich an der Runtime-Dependency-Sperre. Gilt als reversibel/additiv nachrüstbar.
**Source:** 13-CONTEXT.md (D-10)

---

### D-01/D-02: 800 Zeilen sind das Abnahme-, die Sektionsbanner sind das Schnittkriterium
Harte 800-Zeilen-Grenze je Nachfolgedatei, geschnitten wird entlang der vorhandenen `// ====`-Banner; passt eine Verantwortlichkeit nicht hinein, wird sie entlang einer Unterverantwortlichkeit weiter geteilt. `core/srd-monsters.js` (7659 Zeilen) ist ausgenommen: reine SRD-Datenliste.

**Rationale:** Der Wert ist nicht gegriffen, er fällt aus der Struktur: die nächstgrößeren Module außerhalb des Scopes liegen bei 1292/1105/1073 (`encounter-calculator.js`, `migration-wizard.js`, `shops-core.js`), die Tier darunter — `dice-core.js` 807, `random-tables.js` 749 — ist die Größenklasse, in der dieses Projekt nachweislich gut arbeitet. Bei 800 landen alle vier Zieldateien dort, und das Kriterium bleibt binär prüfbar.
**Source:** 13-CONTEXT.md (D-01, D-02)

---

### D-03: `rich-text.js` wird entflochten, nicht zerschnitten
Statt auf die Zeilengrenze hin zu schneiden, wurde die 1932-Zeilen-Datei zuerst entflochten: `RENDER`, `SPELL FORM`, `SPELL CRUD` plus die drei Zauber-Zustandsvariablen zogen als Ganzes nach `features/spells/spell-manager.js` (607 Zeilen, 15 Exporte, beide `pushUndo()`-Aufrufe). Erst der Rest wurde gegen die Grenze geprüft.

**Rationale:** Nicht ein zu großes Modul, sondern zwei fremde Module in einer Datei — belegt an den Bannern (SPELL CRUD 1625–1904 gegen EDITOR FORMATTING 322–1120, FLOATING TOOLBAR 1121–1471, CONTEXT TOOLBARS 1472–1624). „Eine Datei namens `rich-text.js`, die die Zauberdatenbank-UI enthält, ist selbst eine irreführende Stelle im Sinne dieser Phase." Eine reine Größenaufteilung hätte die Fehlbenennung konserviert.
**Source:** 13-CONTEXT.md (D-03), 13-11-PLAN.md, 13-11-SUMMARY.md

---

### Die Schnittlinie folgt der Bedeutung, nie der Zeilenbalance
`EDITOR FORMATTING` misst exakt 799 Zeilen — eine unter dem Cap, ohne Puffer für Kopfbanner und Exportblock. Geteilt wurde deckungsgleich zu den eingefrorenen Phase-9-Spezifikationen: Selektion/Zeichenformatierung blieb in `rich-text.js` (401), Einfügen/Zwischenablage/Tastatur/Tabelle ging nach `rich-text-insert.js` (438). Ebenso die 13 Referenz-Widgets: `dmscreen-widgets-combat.js` (170) gegen `dmscreen-widgets-reference.js` (276), bewusst ungleich.

**Rationale:** Die Editor-Trennlinie hält das Testnetz entlang derselben Grenze lesbar (`editor-formatting.spec.js` vs. `editor-insert.spec.js`); zudem blieb die Kette `handleEditorPaste` → `sanitizeInsertedInlineStyle` → `insertHtmlAtSelection` → `escapeHtml` als sichtbare Sicherheitskette zusammen (T-13-44). Bei den Widgets: „Wer später ein Widget sucht, sucht nach seinem Inhalt."
**Source:** 13-11-PLAN.md (T-13-44), 13-11-SUMMARY.md, 13-12-PLAN.md, 13-12-SUMMARY.md

---

### Charakterisierungs-Snapshot an die öffentliche Oberfläche und an `loader.js` gebunden — und nie nachgezogen
`loadDmScreenSandbox()` liest zur Testlaufzeit `MODULES` aus `loader.js`, filtert auf `features/dmscreen/` und wertet die Treffer in Array-Reihenfolge in EINER vm-Sandbox aus; angesprochen wird nur die öffentliche Oberfläche (`getDMScreenWidgets()`, der on-window-Einstieg, `switchDMSProfile()`), iteriert über die Registry-Schlüssel statt über eine hartkodierte Typenliste. Als `must_haves.prohibition`: der Snapshot bleibt unverändert, alle Folgeläufe mit `--ci`.

**Rationale:** Der Snapshot entsteht sechs Wellen vor der Aufteilung, die er absichern soll — ein fester Pfad zeigte danach ins Leere oder machte den Test leer-grün (T-13-19); `loader.js` ist seit ARCH-01/Phase 11 die einzige Modulliste und damit der einzige Anker, der die Aufteilung überlebt. Ein nachgezogener Snapshot macht das Netz wertlos: eine Abweichung ist ein Befund, kein Anlass zur Aktualisierung. Ergebnis: 51/51 Tests, 50/50 Snapshots unverändert.
**Source:** 13-05-PLAN.md, 13-05-SUMMARY.md, 13-12-SUMMARY.md

---

### Gemessene Invariante schlägt Plan-Zahl — dokumentieren statt „reparieren"
In allen vier Aufteilungen wich die im Plan genannte Invariante von der Messung ab (Exporte 28 statt 30, 38 statt 34, 26 statt 30; `registerPostSaveHook` 3 statt 1). Jedes Mal galt die am Original gemessene Zahl, die Abweichung wurde im SUMMARY dokumentiert — nie wurde Code an die Plan-Zahl angepasst.

**Rationale:** Gemessen wurde gegen die Datei vor der ersten Änderung, in 13-11/13-12 zusätzlich per `git show HEAD~3:` bzw. `git show 77f78f8:` verifiziert. Damit ist belegt, dass die Plan-Zahl veraltet war und nicht der Code abweicht; eine Anpassung an sie hätte funktionierenden Code an eine alte Recherche angeglichen.
**Source:** 13-09-, 13-10-, 13-11-, 13-12-SUMMARY.md

---

### Explizite Allowlist statt Namenspräfix-Konvention für die `call`-Aktion (SEC-03/D-14)
`CALL_ACTION_WHITELIST` (`Set`, 130 Namen) in `core/constants.js`; `UIActions.call` prüft `window.CALL_ACTION_WHITELIST?.has(ctx.value)` vor jedem Zugriff auf `window[ctx.value]` und blockiert auch, wenn die Konstante nicht auflösbar ist — fail closed. Die Namen wurden zur Ausführungszeit frisch gescannt (139 Vorkommen gegen 138 zum Planungszeitpunkt), samt den drei Nullaussagen aus 13-RESEARCH.md: 0 umgekehrte Attributreihenfolgen, 0 per Template-Literal gebaute Ziele, 0 Vorkommen ohne `data-value`.

**Rationale:** Eine Namenspräfix-Konvention ist nur eine Regel, die man vergisst; eine Liste bricht sichtbar. Vorher hing die Stelle allein am `data-*`-Filter in `sanitizeHTML()` — jeder künftige ungefilterte Renderpfad hätte sie geöffnet (T-13-01/T-13-02). Nur die drei bestätigten Nullaussagen belegen, dass die Zielmenge geschlossen ist; ohne sie wäre die Allowlist eine Vermutung.
**Source:** 13-01-PLAN.md, 13-01-SUMMARY.md

---

### Konsolen-Guard im Quellcode statt im Build, genau ein markierter Ausgang (MAINT-06)
Die 81 ungefilterten Konsolenaufrufe in 31 Modulen wurden im Quellcode umgestellt, nicht per Build-Schritt gestrippt. Genau eine Ausgabe bleibt: die `console.error`-Zeile in `ErrorHandler.log()` (`render/helpers.js:38`), markiert mit `gsd:konsolen-senke`; `tests/unit/console-hygiene.test.js` nimmt nur Zeilen mit diesem Literal aus. Verlegt, nicht gelöscht.

**Rationale:** `build.py` strippt keine Konsolenaufrufe, und ein Strip im Build wäre eine Build-System-Änderung mit eigenem TDD-Aufwand (in 13-CONTEXT.md zurückgestellt). Der markierte Einzelausgang macht den Zustand per Scan-Test durchsetzbar statt von Review-Aufmerksamkeit abhängig; Löschen hätte die Diagnose genommen, die beim Debuggen am Spieltisch gebraucht wird.
**Source:** 13-08-PLAN.md, 13-08-SUMMARY.md

---

### D-07: Erst der Save-Pfad, dann Undo — die Requirement-Reihenfolge ist zur Frequenz invertiert
PERF-01 nennt Undo zuerst; umgesetzt wurde zuerst der Save-Pfad: die zweite Vollkopie via `new Blob([dataString])` in `saveImmediate()` und `save()` wich `_measureDataByteLength()`. Die `JSON.stringify(D)`-Serialisierung bleibt — sie ist für den Schreibvorgang nötig, redundant war nur die zweite Kopie zur Größenermittlung.

**Rationale:** Von 76 `saveUndoState()`/`pushUndo()`-Aufrufstellen liegt keine in einem heißen Pfad — die Verteilung ist reine CRUD (`entity-actions.js` 5, `initiative-mob.js` 4, `fraktionen-crud.js` 4 …), also menschlich getaktete Einzelaktionen. `save()` dagegen ist debounced und läuft bei JEDER Datenänderung.
**Source:** 13-CONTEXT.md (D-07, D-08), 13-06-PLAN.md, 13-06-SUMMARY.md

---

### `utf8ByteLength()` als Codepoint-Schleife, `TextEncoder` ausdrücklich verboten
Ein Durchlauf addiert pro Codepoint die UTF-8-Bytezahl und überspringt bei Surrogatpaaren den zweiten Index; ein Akzeptanzkriterium prüft, dass `utils/basic.js` KEIN `TextEncoder` enthält. Die Gleichheit zur Blob-Referenz wurde vor der ersten Umstellung für sechs Fälle bewiesen (leer, ASCII, `äöüß`, Emoji außerhalb der BMP, unpaariges Surrogat, `JSON.stringify`-Ausschnitt).

**Rationale:** `TextEncoder` legt intern ebenfalls eine komplette Kopie an, löst also genau das Problem nicht, um dessentwillen die Blob-Messung ersetzt wird. Die Blob-Messung war die Referenz, nicht der Feind — eine falsch gezählte Byte-Zahl verschiebt die 5-MB-Schwelle zwischen localStorage und IndexedDB (T-13-20, derselbe Codepfad wie DEBT-17).
**Source:** 13-06-PLAN.md (Task 1), 13-06-SUMMARY.md

---

### D-11/D-12: Deckel auf die Datensatzzahl plus Löschknopf — kein Alters-Pruning
`DICE_STATS_MAX_RECORDS: 50000` mit Verdrängung des Ältesten (`enforceStatsCap()`, nachgelagert an `store.add()` in derselben readwrite-Transaktion, gedrosselt auf jeden 50. Schreibvorgang, nie blockierend), dazu ein rückfragegesicherter Löschknopf mit eigener `data-action="clear-dice-stats"` (hängt so nicht an der Whitelist aus 13-01). Entschieden an einem Task mit `gate="blocking-human"` und drei durchgerechneten Optionen (20k/50k/200k); die Herleitung steht als Kommentar in `core/config.js`.

**Rationale:** Verdrängte Würfe sind unwiederbringlich — `diceStats` liegt in IndexedDB, also außerhalb des `window.D`-Snapshots des Undo-Stacks; deshalb keine autonome Entscheidung. „Meine Würfel hassen mich seit drei Jahren" ist genau die Auswertung, für die man Langzeitdaten behält; Alters-Pruning zerstörte sie unbemerkt. 50.000 × ~200 Byte ≈ 10 MB liegen im Phase-12-Rahmen; bei 300 Würfen je Sitzung greift der Deckel erst nach gut drei Jahren.
**Source:** 13-CONTEXT.md (D-11, D-12), 13-07-PLAN.md, 13-07-SUMMARY.md

---

### D-13: `hasHtmlTags` ersatzlos löschen statt verdrahten
Der berechnete, aber nie gelesene Wächter in `ui/editors/markdown-converter.js:264` wurde entfernt (vorher belegt: genau ein Vorkommen, die Deklaration selbst). Die eigentliche Reparatur waren Wortgrenzen-Lookarounds auf den Unterstrich-Regeln.

**Rationale:** Der Rich-Text-Editor speichert HTML, also enthält praktisch jeder Wiki-/NPC-/Locations-Eintrag HTML-Tags. Ein verdrahteter Wächter hätte die Markdown-Darstellung-auf-Anzeige (seit v2.6.0) faktisch überall abgeschaltet — aus einem Anzeigebug wäre ein Feature-Verlust geworden. Der Review bestätigte, dass der Wächter schon vorher toter Code war; die Entfernung ist ein No-op.
**Source:** 13-CONTEXT.md (D-13), 13-03-PLAN.md, 13-03-SUMMARY.md, 13-REVIEW.md

---

### Tracer-Auswahl wechselt mit der Absicherungslage
Bei den drei gut abgesicherten Dateien war die riskanteste Einzelbewegung der Tracer: 13-10 verschob zuerst `LOOT SYSTEM` (373 Zeilen, größte Sektion, einziger Beute-`pushUndo()`), 13-11 zuerst die komplette Zauberverwaltung. Bei `dmscreen-render.js` umgekehrt die risikoärmste Gruppe zuerst: die acht zustandslosen Referenz-Widgets ohne Ereignisbehandlung.

**Rationale:** Bei vorhandenem Netz validiert die schwerste Bewegung das Verfahren am schärfsten. Beim DM Screen war das Netz selbst neu (Snapshot aus 13-05) und musste zuerst validiert werden: „wenn das Verfahren hier etwas kaputtmacht, liegt es am Verfahren und nicht am Widget."
**Source:** 13-10-SUMMARY.md, 13-11-SUMMARY.md, 13-12-PLAN.md (Task 1)

---

## Lessons

### Ein E2E-Test kann einen Bug konservieren statt ihn zu fangen
Der Doppel-Einfüge-Fehler („Fund 3") überlebte vier Phasen, weil `tests/e2e/features/editor-insert.spec.js:148-151` das FEHLERHAFTE Verhalten als Sollwert eingefroren hatte — `TABELLEN_ERWARTET` enthielt die doppelt verschachtelte Tabelle. Kein Test schlug an, obwohl die Suite mit 1073 Jest- und 321 Playwright-Tests grün war. Aufgedeckt, als ein Mensch in UAT-Test 4 vier Zeilen Text einfügte und den Inhalt doppelt sah; die Reparatur (e6cd20d, 7dab71a) musste 5 eingefrorene Erwartungswerte „auftauen".

**Context:** Bei jedem geerbten Erwartungswert prüfen, ob er ein Sollverhalten oder nur den Status quo festhält — besonders wenn ein Bug im BASELINE-Dokument als „bekannt, vertagt" geführt wird. Fund 3 stand seit 2026-07-25 in 09-BASELINE.md und wurde von den Phasen 10, 11, 12 und 13 nicht aufgegriffen.
**Source:** 13-UAT.md (Gaps, Fund 3)

---

### Was `python build.py` garantiert — und was ausdrücklich nicht
Der Build prüft: die in `loader.js` (`MODULES`/`TEMPLATES`) und im `@import`-Hub gelisteten Dateien existieren; `check_duplicate_functions()` findet vor dem Bündeln doppelte Top-Level-Deklarationen; dieselbe Prüfung läuft als Backstop gegen das fertige Bündel. Was er NICHT prüft: ob nach einer Verschiebung noch alles da ist. Fehlender Code ist für ihn kein Fehlerbild.

**Context:** Beim Aufteilen einer Datei ist genau die Gegenrichtung („zu wenig") das reale Risiko, gegen das der Build blind ist — in 13-11 verschwanden 12 Top-Level-Deklarationen und `python build.py` lief mit Exit-Code 0 durch. Der Namens-Diff (siehe Patterns) ist die fehlende Hälfte.
**Source:** 13-11-SUMMARY.md, 13-09-PLAN.md (Task 1 verify)

---

### Zahlenangaben in Akzeptanzkriterien waren in 4 von 4 Plänen veraltet
Jeder Aufteilungsplan nannte mindestens eine zur Ausführungszeit falsche Zahl (Exportsummen 30/34/30 statt 28/38/26; `registerPostSaveHook` 1 statt 3); dazu waren die Zeilennummern aus 13-RESEARCH.md nach 13-02/13-08 nicht mehr exakt und das „79-Test-Netz" aus Phase 9 umfasste real 84 Tests. Selbst SUMMARY-Zahlen veralteten vor der Verifikation: 564/358 Zeilen gegen gemessene 573/474 (phasenfremder Commit 7e4a860).

**Context:** In einer Phase mit mehreren Wellen auf denselben Dateien ist jede Plan-Zahl ein Messwert mit Verfallsdatum — die Recherche eines Plans liegt vor den Änderungen früherer Pläne derselben Phase. Praxisfolge: die Invariante vor der ersten Änderung selbst messen, die Plan-Zahl nur als Größenordnung lesen, den SUMMARYs nicht glauben.
**Source:** 13-09-, 13-10-, 13-11-, 13-12-SUMMARY.md, 13-VERIFICATION.md (Truth 4)

---

### Beim Laden ausgewertete Zeilen sind die einzigen, die die Dateigrenze wirklich binden
Funktionsaufrufe zwischen Modulen lösen zur Laufzeit auf und sind gegenüber Dateigrenzen unkritisch (`getDMScreenWidgets()` → Widget-Renderer über vier Dateien). Kritisch sind nur Load-Time-Auswertungen wie `const debouncedUpdateAoE = debounce(updateAoETargetDisplay, UI_TIMING.AOE_UPDATE_DEBOUNCE);` — sie müssen in dieselbe Datei wie die entprellte Funktion und hinter die Module, die `debounce`/`UI_TIMING` liefern. Ebenso geteilter Zustand: die zehn Editor-Variablen mussten in `rich-text.js` bleiben, weil `ui/actions/system-actions.js` `floatingToolbarTarget` als bare Bezeichner zuweist.

**Context:** Nur diese beiden Kategorien erzwingen eine Reihenfolge in `loader.js` `MODULES`; alles andere ist frei gruppierbar. Fehler dieser Sorte brechen den Start laut, nicht still.
**Source:** 13-10-PLAN.md (T-13-41), 13-11-PLAN.md (T-13-46), 13-12-PLAN.md

---

### Playwright läuft gegen das Entwicklungs-Bündel, `npm run build` schreibt nur das Produktions-Bündel
Die E2E-Suite prüft `dist/dnd-tracker-bundled.html`. Deshalb steht in allen vier Aufteilungsplänen als Gate-Kommando `PYTHONIOENCODING=utf-8 python build.py && npx playwright test` — `python build.py` ohne Schalter muss unmittelbar vor dem Playwright-Lauf laufen.

**Context:** Beim Zusammenstellen eines Hard-Gates nach Quelltextänderungen: ein `npm run build` allein macht den E2E-Lauf wertlos, ohne dass etwas rot wird.
**Source:** 13-09-PLAN.md (Task 3), gleichlautend in 13-10-/13-11-/13-12-PLAN.md

---

### Unit-Tests, die ein Modul direkt per `vm` laden, brechen bei jeder Aufteilung dieses Moduls
`tests/unit/wiki-links.test.js` lädt `features/wiki/wiki.js` direkt über Nodes `vm`-Modul, nicht über `loader.js`. Nachdem `parseWikiLinks()` nach `wiki-crud.js` gewandert war, schlugen 5 von 6 Tests mit `TypeError: context.parseWikiLinks is not a function` fehl. Fix: zweiter `vm.runInContext(...)`-Aufruf für die neue Datei, zwingend in `MODULES`-Reihenfolge, weil `wiki-crud.js` `WikiState`/`WIKI_CATEGORIES` als bare Bezeichner aus `wiki.js` liest.

**Context:** Vor jeder Aufteilung prüfen, ob eine Testdatei die Quelldatei direkt per `vm` lädt. Die drei Folgepläne haben das getan und jeweils dokumentiert, dass kein solcher Test existiert.
**Source:** 13-09-SUMMARY.md, 13-10-SUMMARY.md, 13-11-SUMMARY.md

---

### `ErrorHandler.log()` schreibt immer `console.error` — und die E2E-Suite läuft gegen den Dev-Build mit `DEBUG_MODE = true`
Die wörtliche Umstellung aller `console.log`/`warn`-Aufrufe auf `ErrorHandler.log()` hob Routineereignisse (`_nextId`-Selbstreparatur, Migrationsfortschritt, „container missing"-Render-Guards) auf `console.error`-Niveau, weil der Einzelausgang nur ein Schweregrad-Niveau kennt. Nur `build.py --production` kippt `DEBUG_MODE` auf `false`; Playwright testet den Dev-Build. 5 Tests in 3 Specs brachen an ihren `msg.type() === 'error'`-Assertions — sichtbar erst im vollen Playwright-Lauf, nicht in `node --check`, `npx jest` oder dem Smoke-Test. Behoben durch einen zweiten, konsolenfreien Kanal (`window.debugLogAdd()`) für Infomeldungen.

**Context:** Vor einer Sammel-Umstellung prüfen, mit welchem Level der Zielausgang schreibt und welche Tests auf Konsolensauberkeit assertieren — und die Kommentare an den betroffenen Stellen lesen: am `validateDataIntegrity`-Hinweis stand bereits „Selbstheilung ist Normalverhalten, kein Fehler … (UAT 01)", was die Plananweisung wörtlich rückgängig gemacht hätte.
**Source:** 13-08-SUMMARY.md (key-decisions, Deviations)

---

### Die Konsolen-Hygiene schaltete den Sicherheitspfad stumm, den dieselbe Phase eingebaut hat
Die MAINT-06-Umstellung setzte die Ablehnungspfade des neuen SEC-03-Wächters (`ui/actions/ui-actions.js:186-207`) und die `onChange`/`onInput`-Ablehnungen (`ui/event-delegation.js:144-152, 192-200`) hinter `window.APP_CONFIG?.DEBUG_MODE`. Im Produktionsbuild erzeugt ein blockiertes `call`-Ziel damit NULL Konsolenausgabe und NULL Logeintrag — vorher war jede Blockade unbedingt sichtbar. Zusätzlich wurden drei `else console.error(...)`-Fallbacks gelöscht.

**Context:** Der Guard ist obendrein redundant und strenger als der Logger selbst — `ErrorHandler.log()` schreibt über `this._consoleLog` ohnehin unabhängig von `DEBUG_MODE`; die Reparatur ist Entfernen des Guards, nicht ein Sonderfall. Beim Umstellen auf einen zentralen Logger die Sicherheits- und Ablehnungspfade ausnehmen. Offen als WR-02 für Phase 14.
**Source:** 13-REVIEW.md (WR-02), 13-VERIFICATION.md (Truth 8)

---

### MAINT-03 reparierte nur den Anzeigepfad — der Importpfad korrumpiert URLs weiter (offener Gap)
`renderMarkdownInContent()` bekam die CommonMark-Wortgrenzen-Lookarounds; `markdownToHtml()` (`ui/editors/markdown-converter.js` ab 189) trägt weiterhin die ungeschützten Regeln `__(.+?)__` (210) und `_(.+?)_` (213). Beleg per vm-geladenem Modul: `"https://example.com/foo_bar_baz"` → `foo<i>bar</i>baz`. Betroffen: `systems/markdown-import-export.js` ruft `markdownToHtml()` für Import-Vorschau (174) und Import (222).

**Context:** Das Requirement nannte eine konkrete Zeile (264), Erfolgskriterium 5 formulierte den zweiten Halbsatz unbedingt — die Verifikation führte es als ✓ VERIFIED, weil sie nur den Anzeigepfad prüfte; erst die UAT-Sitzung fand die Lücke. Bei Regex-Klassen-Fixes immer nach der zweiten Fundstelle derselben Regel suchen.
**Source:** 13-UAT.md (Gaps), 13-VERIFICATION.md (Truth 5)

---

### Ein Listener am Zielelement feuert unabhängig von Capture/Bubble — `preventDefault()` stoppt den zweiten Handler nicht
Ursache des Doppel-Einfügens: `initEditorPasteHandlers()` hängt `handleEditorPaste` direkt an jedes Element der `editorIds`-Liste (`ui/editors/rich-text-insert.js:42`) UND dokumentweit in der Capture-Phase an alles mit `.rich-editor`/`.dialog-text-area` (47-56). Ein Listener am Zielelement läuft in der At-Target-Phase, also feuern beide. 15 der 17 gelisteten Editoren tragen beide Merkmale (alle außer `char-notes`), `features/npcs/npc-dialogs.js:51` registriert eine dritte Instanz.

**Context:** Immer wenn Element-Listener und dokumentweite Delegation dieselbe Elementmenge abdecken. Weil die Registrierung nicht zentralisierbar war, setzte die Reparatur am Ereignis an statt an der Registrierung: ein Guard `e.__dndEditorPasteHandled` in `handleEditorPaste()` wirkt gegen alle drei Wege — und gegen einen künftigen vierten.
**Source:** 13-UAT.md (Gaps, Fund 3, root_cause / fixed_in)

---

### Ein Erklärkommentar kann die grep-basierte Abnahme verunreinigen, die er erklärt
Zweimal passiert: Der Doc-Kommentar über `CALL_ACTION_WHITELIST` zitierte das Suchmuster wörtlich und tauchte beim Ableiten der Whitelist selbst als Treffer auf — der Platzhalter `<name>` landete in der Zielmenge, eine zweite Kommentarzeile löste ausgerechnet die Nullaussage „Vorkommen ohne `data-value`" aus. Und der neue Kopfkommentar in `rich-text.js` enthielt `document.execCommand` als Verneinung und brach den eigenen Verify-Schritt.

**Context:** Beide Male behoben durch Prosa statt Zitat („execCommand-API" ohne `document.`-Präfix — dasselbe Muster wie `utils/basic.js:125,126,235`). Drei Pläne warnen die Ausführung deshalb im `<action>`-Block davor, den gesuchten Text in Kommentare zu schreiben (13-01, 13-02, 13-03).
**Source:** 13-01-SUMMARY.md, 13-11-SUMMARY.md, 13-01-/13-02-/13-03-PLAN.md

---

### Jede neue `loader.js`-Registrierung bricht dieselbe hartkodierte Zahl im Build-Test
`test_ssot_module_list_parses_from_loader` in `tests/build/test_build_deduplication.py` behauptet die Modulanzahl als Literal. Sie musste in jedem der vier Pläne nachgezogen werden: 124 → 125 → 127 → 130 → 134. Jeder Fund passierte erst im Hard-Gate-Lauf `python -m pytest tests/build -q`, nie vorher.

**Context:** Wer ein Modul in `loader.js` `MODULES` einträgt, sollte diese Assertion sofort mitziehen. Über die ganze Phase war das der einzige Test-Bruch, der in mehr als der Hälfte der Aufteilungen auftrat.
**Source:** 13-09-, 13-10-, 13-11-, 13-12-SUMMARY.md

---

### `saveUndoState()` ist nur ein Alias für `pushUndo()` — die Prüfung auf einen Namen erzeugte eine Falschaussage
`systems/undo.js:41-43` definiert `saveUndoState()` als Alias. Die Vorrecherche prüfte nur einen Namen und behauptete daraufhin in D-07, `features/initiative.js` rufe `pushUndo()` „gar nicht" auf — tatsächlich sind es zwei Stellen (374 XP-Verteilung, 1565 Beute entfernen).

**Context:** Beim Auditieren von Aufrufstellen immer BEIDE Namensformen greppen. Der Plan korrigierte die Tatsachenbehauptung, ließ die Schlussfolgerung von D-07 aber stehen, weil beide Aufrufe Einzelaktionen sind — eine widerlegte Tatsachenbehauptung widerlegt nicht automatisch die darauf gestützte Entscheidung.
**Source:** 13-06-PLAN.md (objective, Task 2 d)

---

## Patterns

### Zählbare Invarianten jeder Verschiebung: Namens-Diff, Exportmenge, Undo-Aufrufstellen
Vor und nach der Aufteilung messen und über alle Ergebnisdateien aufsummieren: (1) alle Top-Level-Deklarationen (`function`/`const`/`let`/`class`) als Namensliste diffen; (2) `grep -c "^window\."`; (3) `grep -cE 'saveUndoState\(|pushUndo\('`. In 13-11 benannte der Namens-Diff die 12 verschwundenen Deklarationen präzise, nachdem die Fehlermeldung in eine völlig andere Richtung gezeigt hatte; in 13-12 präventiv gefahren (Original 64 == Summe der fünf neuen Dateien 64); in 13-10 Exporte 18+8+12 = 38 und Undo-Aufrufe 2 unverändert.

**When to use:** Nach jeder Verschiebung von Code zwischen Dateien — der Build deckt nur Dubletten ab, dieser Diff die Gegenrichtung. Ein verlorener Export macht einen `data-action`-Knopf still wirkungslos (T-13-40/T-13-47), ein verlorener `pushUndo()`-Aufruf bricht die Strg+Z-Zusage, ohne dass ein Test es meldet (T-13-39).
**Source:** 13-11-SUMMARY.md, 13-12-SUMMARY.md, 13-10-PLAN.md, 13-10-SUMMARY.md

---

### MAINT-01-Aufteilungskonvention (viermal bestätigt)
Pro Zieldatei: eigener `// [SECTION:X]`-Kopf und eigener `EXPORTS FOR GLOBAL ACCESS`-Block am Dateiende (Konvention aus `npc-render.js`/`npc-crud.js`); Schnitt entlang der `// ====`-Banner; Sektionsreihenfolge wie im Original; keine `import`/`export`; Registrierung nur in `loader.js` `MODULES`, nichts in `build.py` (ARCH-01); `python build.py` plus relevantes Testnetz nach JEDER einzelnen Sektionsverschiebung; voller Suiten-Lauf mit vorgelegter Ausgabe als Hard-Gate vor dem Commit.

**When to use:** Für jede weitere Aufteilung eines übergroßen Moduls. Das Verfahren hat 4 Aufteilungen (1223/1655/1932/1576 Zeilen → 14 Dateien, alle ≤ 800) mit unveränderten Suitenzahlen überstanden (Jest 1066/1066, Playwright 321 passed / 2 skipped, pytest tests/build 24/24).
**Source:** 13-09-SUMMARY.md, fortgeschrieben in 13-10-/13-11-/13-12-SUMMARY.md

---

### Tests leiten ihre Prüfliste zur Laufzeit aus der Quelle ab statt eine Zweitliste zu pflegen
Der Test liest `loader.js`, extrahiert `MODULES` per Brace-Depth-Tracking (nicht mit einer gierigen Regex) und filtert; bei null Treffern schlägt er hart fehl statt still eine leere Liste zu prüfen. Dreimal benutzt: `console-hygiene.test.js` (alle 134 Module), der DM-Screen-Charakterisierungstest (Filter `features/dmscreen/`) und der Abgleichstest in `event-delegation.test.js`, der `CALL_ACTION_WHITELIST` gegen die frisch gescannten `data-action="call"`-Ziele rekonziliiert.

**When to use:** Wenn eine Regel projektweit gelten soll — verhindert, dass ein neu registriertes Modul die Prüfung stillschweigend umgeht. Besonders bei Allowlists, deren Unvollständigkeit sich nicht als Fehler, sondern als stiller Funktionsverlust äußert (als eigene Bedrohung T-13-04 geführt: die Härtung bedroht die Funktion, nicht nur der Angreifer).
**Source:** 13-05-, 13-08-, 13-01-PLAN/SUMMARY.md, 13-VERIFICATION.md (Truth 1, Truth 8)

---

### vm-Sandbox-Form für Nicht-ESM-Module: echte Quelldatei, `context.window = context`, Konstanten zuerst
Unit-Tests laden die reale Quelldatei per `vm.runInContext()` statt die Logik nachzubauen, Abhängigkeiten als `jest.fn()`-Doubles. Drei Griffe: `context.window` zeigt auf das Kontextobjekt selbst und spiegelt `window === globalThis` (nötig, weil die Module bare Bezeichner und `window.`-Zugriffe mischen); `core/constants.js` wird in DENSELBEN Kontext geladen, bevor das Modul folgt, damit Top-Level-`const`-Lesezugriffe die Projektwerte auflösen statt einer Testkopie; `document.implementation.createHTMLDocument()` liefert ein isoliertes DOM ohne jsdom. Determinismus-Shadows nie durch Mutation echter Globals (`Object.create(Math)`).

**When to use:** Für jeden neuen Unit-Test an einem Nicht-ESM-Modul, zwingend bei Sicherheitszusicherungen: `wiki-links.test.js` lädt ZWEI echte Quelldateien in denselben Kontext, damit `esc()` die echte Projektfunktion ist — ein gestubbtes `esc()` hätte das Escaping überhaupt nicht geprüft.
**Source:** 13-01-/13-02-/13-03-/13-04-SUMMARY.md, 13-05-SUMMARY.md

---

### Registry hält verzögerte Funktionsreferenzen, ein statischer Wächtertest prüft ihre Existenz
`TAB_RENDER_REGISTRY` speichert statt `'renderDashboard'` einen Pfeilausdruck `() => renderDashboard` — statisch für Grep, ESLint und Suchwerkzeuge sichtbar, aufgelöst erst zur Benutzungszeit (`resolveTabFn()`; `window[` kommt nicht mehr vor). Die Verzögerung ist zwingend, weil `tab-registry.js` im Loader-Modus vor allen Feature-Modulen läuft. Dazu `tests/unit/tab-registry.test.js` (38/38): extrahiert die Bezeichner aus dem Registry-Literal und prüft, dass jeder als Top-Level-`function <name>(` in einer `MODULES`-Datei vorkommt.

**When to use:** Für jede Struktur, die Funktionsnamen führt und vor ihren Zielmodulen ausgewertet wird. Verlagert den Fehler von der Laufzeit (stille leere Ansicht) in die Testzeit.
**Source:** 13-04-PLAN.md, 13-04-SUMMARY.md, 13-VERIFICATION.md (Truth 7)

---

### Regression oder Vorbestand? Per `git show <pre-split-hash>:<datei>` entscheiden
Ein Befund aus Bedienprobe, UAT oder Review wird nicht diskutiert, sondern gegen den Vor-Phasen-Stand gehalten. In 13-12 zeigte die Widget-Konfigurationsliste nur 8 statt 21 Typen; `renderDMSConfigList()` war bytegleich zu `git show 77f78f8:features/dmscreen/dmscreen-render.js` und iterierte schon immer nur über `D.dmScreenLayout.widgets`. Der Review diffte alle 34 Dateien gegen `cc75339`. Auch zwei UAT-Meldungen fielen so als Nicht-Regressionen weg — u. a. die nach Strg+Z „verschwundenen" Orte/NPCs, die ausschließlich die während des Tests neu angelegten waren (korrektes Verhalten, Bestätigung von D-09).

**When to use:** Bei jedem Befund während einer Verhaltensneutralitäts-Abnahme. Ohne den Diff wird Vorbestehendes als Regression gemeldet und Neueingeführtes als „war schon immer so" durchgewinkt.
**Source:** 13-12-SUMMARY.md, 13-REVIEW.md (IN-01, IN-03), 13-UAT.md (Tests 1 und 6)

---

### Konflikt mit einem Erfolgskriterium vorab benennen und mit messbarer Abnahmebedingung versehen
13-CONTEXT.md trägt einen eigenen Warnblock mit einer Vorgabe an den Planer: an einer realistisch dimensionierten Kampagne messen und das Ergebnis der Verifikation vorlegen; einstellige Millisekunden = abnehmen, sonst die Entscheidung mit Messwert statt Vermutung neu bewerten. Der Jest-Messfall assertiert bewusst KEINE absolute Schwelle (die auf fremder Hardware flackern würde), sondern schreibt nach 13-PERF-MEASUREMENT.md — mit Node-Version, Hardware, Fixture, Messwerten und einer Anleitung für dieselbe Messung gegen die EIGENE Kampagne.

**When to use:** Wenn beim Planen auffällt, dass ein Erfolgskriterium absoluter formuliert ist, als die getroffenen Entscheidungen es zulassen. Der Unterschied zwischen Override und Versäumnis liegt darin, dass die Bedingung VOR der Ausführung feststand.
**Source:** 13-CONTEXT.md (D-10 Warnblock), 13-06-PLAN.md (Task 3), 13-VERIFICATION.md (overrides)

---

### Grep-basierte Verifikation macht die Textform des Codes zum Vertrag
Wo ein Plan seine Abnahme per grep formuliert, wird die Schreibweise Teil der Anforderung: der Aufruf über `sandbox.context.window['render' + 'DMScreen']`, damit der Text `renderDMS` nie in der Datei steht (das Verbot sollte interne Widget-Renderer treffen, kollidierte aber mit dem öffentlichen Einstieg `renderDMScreen` — der Plan widersprach sich selbst); und der Parametername `str` statt `dataString` in `_measureDataByteLength(str)`, damit der verbleibende Blob-Rückfallpfad nicht als `new Blob([dataString])` erscheint.

**When to use:** Sobald ein Prüfkommando ein Textmuster verbietet, das der geforderte Code selbst enthalten müsste. Immer zusätzlich einen präzisen Gegen-Grep auf das SUBSTANTIELL Verbotene laufen lassen und beides im SUMMARY belegen — sonst ist die Umgehung nicht von einer Vertuschung zu unterscheiden.
**Source:** 13-05-SUMMARY.md (Deviations), 13-06-SUMMARY.md

---

### `(?<!\w)` / `(?!\w)` als Lookaround-Form für Unterstrich-Emphase
Die Regeln für fett (`__…__`) und kursiv (`_…_`) bekamen `(?<!\w)`/`(?!\w)` nach der CommonMark-Intraword-Regel. Der Trick: `\w` schließt `_` selbst ein, ein einziges Lookaround-Paar erfüllt daher gleichzeitig „nicht von einem weiteren Unterstrich umgeben" (der wegen der Vorrangfolge bold-vor-italic nötige Schutz) und „nicht von einem alphanumerischen Zeichen umgeben" (der eigentliche Bugfix). Die `*`-Varianten blieben byte-gleich.

**When to use:** Bei jeder unterstrichbasierten Markdown-Regel in diesem Codebase — insbesondere beim Schließen des offenen `markdownToHtml()`-Gaps. Die engere `(?<!_)`/`(?!_)`-Form ist der bekannte Fehlgriff, der `https://example.com/foo_bar_baz` zu `foo<i>bar</i>baz` verstümmelt.
**Source:** 13-03-PLAN.md, 13-03-SUMMARY.md

---

## Surprises

### Grüner Build trotz 12 komplett verschwundener Deklarationen — gefangen erst vom E2E-Netz
In 13-11 Task 1 wurde versehentlich die für Task 2 vorgesehene Zeilenspanne (324–694) statt der vollständigen `EDITOR FORMATTING`-Sektion (324–1119) extrahiert; 10 Funktionen und 2 Konstanten fehlten vollständig im Bündel. `python build.py` lief trotzdem mit Exit-Code 0 und ohne `[FEHLER]`/`[ABORTED]` durch. Sichtbar wurde es erst im E2E-Lauf: 96 von 97 Tests scheiterten mit `ReferenceError: Cannot access 'debugLog' before initialization` — einer TDZ-Kettenreaktion über `renderTabContent` → `ErrorHandler.log` → `debugLogAdd`, also an einer Stelle ohne Bezug zu den fehlenden Funktionen.

**Impact:** Die Diagnose gelang erst über den Namens-Diff aller Top-Level-Deklarationen; danach 97/97 grün. Bestätigt empirisch D-06 (nach JEDER Verschiebung bauen UND das Netz laufen lassen) und belegt D-04: bei `dmscreen-render.js`, das vorher kein Netz hatte, wäre ein äquivalenter Fehler unsichtbar geblieben.
**Source:** 13-11-SUMMARY.md (Auto-fixed Issue 1), 13-12-SUMMARY.md

---

### Die Risikoeinschätzung der Roadmap war invertiert
Die Roadmap führte `rich-text.js` wegen seines Testnetzes als den riskanten Fall. Tatsächlich war das eingefrorene Phase-9-Netz (im Plan als 79 Tests geführt, real 84) genau der Grund, warum diese Datei die AM BESTEN abgesicherte der vier war. Riskant war `dmscreen-render.js`: 1576 Zeilen, 58 Funktionen, 21 Widget-Typen — und genau zwei Testdateien mit zusammen fünf beiläufigen Erwähnungen. Zum Vergleich: `wiki.js` wird in 14 Testdateien erwähnt, `initiative.js` in 12.

**Impact:** 13-CONTEXT.md (D-04) korrigierte das vor der Ausführung und verlegte das Vorsichtsbudget: Plan 13-05 (Snapshot gegen das ungeteilte Modul) wurde harte Vorbedingung für 13-12 — ohne grünen Snapshot durfte keine Zeile verschoben werden. Ohne die Korrektur wäre der einzige ungeschützte Split ohne Netz gefahren worden. Lehre: die tatsächliche Abdeckung je Zieldatei zählen, nicht schätzen.
**Source:** 13-CONTEXT.md (D-04, D-05), 13-11-PLAN/SUMMARY.md, 13-12-PLAN.md

---

### Die vermutete Undo-Last existierte nicht: 0.922 ms Median
Gegen eine bewusst groß dimensionierte synthetische Kampagne (8 Charaktere, 120 NPCs, 60 Orte, 80 Quests, 40 Begegnungen, vollständiger SRD-Zauber- und Monsterbestand, 200 Wiki-Einträge, 300 Sitzungsnotizen) liegt die Median-Dauer eines `JSON.stringify(D)`-Durchlaufs bei 0.922 ms; der volle Undo-Stack mit 30 Einträgen misst 23,98 MB. Das 64-MB-Budget greift im gemessenen Normalfall gar nicht.

**Impact:** Die als PERF-01 geführte Skalierungssorge war für den Undo-Pfad nicht messbar; die Abweichung von Erfolgskriterium 2 ist damit „gemessen statt vermutet" und wurde per Override freigegeben statt durch weiteren Umbau geschlossen. D-10 bleibt geschlossen, weil die Messung es stützt. Das Budget wurde bewusst NICHT nach oben korrigiert; 13-PERF-MEASUREMENT.md ist Pflichtlektüre für jede Phase, die `systems/undo.js` anfasst.
**Source:** 13-06-SUMMARY.md, 13-VERIFICATION.md (overrides, Truth 2)

---

### `init: 'initDiceTab'` war seit Januar 2026 ein stiller No-Op — die Funktion existierte nie
Beim Schreiben des statischen Deklarationstests zeigte sich, dass `TAB_RENDER_REGISTRY.dice.init` auf `'initDiceTab'` verwies, obwohl kein Commit der Historie (`git log --all -p`) je eine Funktion dieses Namens definiert hat. Sichtbar wurde das nie, weil `renderTabContent()` nur bei fehlenden *render*-Funktionen warnt, niemals bei einem fehlenden `init`-Hook — auch nicht im `DEBUG_MODE`. Der Eintrag bestand seit Einführung der Registry (`01c7b12`).

**Impact:** Korrigiert zu `init: null` (Laufzeitverhalten byte-identisch), statt den statischen Test abzuschwächen — das hätte den Zweck des Wächters zerstört. Belegt zugleich den Wert der Umstellung: die alte String-Form machte den toten Verweis unsichtbar, die neue macht ihn laut.
**Source:** 13-04-SUMMARY.md

---

### Die bestehende `markdown-converter.test.js` prüfte nur Eingabe-Zeichenketten und lud das Modul nie
Die Testdatei (Zeilen 1–192) enthielt überwiegend Zusicherungen der Form `expect(html).toContain('<b>')` auf selbst gebauten Eingabestrings — sie rief die realen Konvertierungsfunktionen gar nicht auf und lud `ui/editors/markdown-converter.js` nicht. Der MAINT-03-Block sind die ersten Tests dieser Datei, die das echte Modul ausführen (8 Fälle, per `vm` geladen).

**Impact:** Der URL-Korruptionsbug (`https://example.com/foo_bar_baz` → `foo<i>bar</i>baz`) konnte jahrelang bei grüner Suite bestehen. Der Umbau der Altfälle wurde bewusst nicht mitgemacht und ist Phase 14 zugeordnet.
**Source:** 13-03-PLAN.md, 13-03-SUMMARY.md

---

### `range.surroundContents()` wirft bei kollabierter Selektion NICHT — es fügt ein leeres `<a>` ein
Die execCommand-Ablösung von `insert-link` (`ui/actions/system-actions.js:75-94`) nutzt `wrapRangeWithElement()`, das nur bei geworfener Exception auf `extractContents()`+`insertNode()` ausweicht. Bei kollabierter Range gelingt `surroundContents()` trivial und setzt ein leeres, unsichtbares `<a href="…">` ein; das alte `execCommand('createLink')` fügte die URL als sichtbaren Linktext ein. Der Nutzer sieht: nichts passiert.

**Impact:** Erfolgskriterium 6 („grep `execCommand` liefert außerhalb von Kommentaren keinen Treffer") gilt wörtlich, während die Verhaltensparität an einer Stelle bricht. Ein grep-basiertes Kriterium beweist die Migration, nicht ihre Äquivalenz. Offen als WR-01 für Phase 14.
**Source:** 13-REVIEW.md (WR-01), 13-VERIFICATION.md (Anti-Patterns)

---

### Nur 4 der 21 DM-Screen-Widgets sind überhaupt datenabhängig
Der Vergleich der Snapshots gegen `DMS_FIXTURE` und `DMS_EMPTY_FIXTURE` zeigte genau vier datenabhängige Widgets (`party`, `initiative`, `notes`, `tables`); die übrigen 17 rendern byte-gleich, unabhängig vom Kampagneninhalt. Ebenfalls erst durch den Snapshot sichtbar: nur `conditions` ist `compact: true`.

**Impact:** Der Leerfall war im Plan als Randfall gedacht und lieferte nebenbei die Risikokarte für Plan 13-12: das Risiko der Aufteilung konzentriert sich auf vier Renderer.
**Source:** 13-05-SUMMARY.md (Accomplishments)
