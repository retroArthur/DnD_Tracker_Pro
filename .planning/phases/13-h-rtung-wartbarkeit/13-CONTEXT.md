---
phase: 13
phase_name: Härtung & Wartbarkeit
slug: h-rtung-wartbarkeit
created: 2026-09-05
requirements: [SEC-03, SEC-04, PERF-01, PERF-02, MAINT-01, MAINT-02, MAINT-03, MAINT-04, MAINT-05, MAINT-06]
decisions_count: 14
mode: auto-recommendation (Nutzer: "Führe alle Bereiche nach deinen Empfehlungen aus")
---

# Phase 13 — Context: Härtung & Wartbarkeit

<domain>
## Phase Boundary

Die verbliebenen Sicherheits- und Skalierungsrisiken sind geschlossen, und die Codebasis trägt keine
übergroßen, toten oder irreführenden Stellen mehr, die künftige Arbeit verteuern.

**Verhaltensneutral, mit zwei benannten Ausnahmen:** `MAINT-03` behebt einen echten Anzeigebug
(korrumpierte URLs), `PERF-02` führt eine Aufbewahrungsgrenze ein, die es heute nicht gibt. Alles
andere — insbesondere die Modul-Aufteilung — ändert Verhalten **nicht**.

**Nicht Teil dieser Phase:** neue Spielleiter-Funktionen; die fünf Welt-Feature-Testdateien, der
Toast-Race-Fix und die schärferen Lint-/Typecheck-/Coverage-Gates (alle Phase 14); Datensicherheit
(Phase 12, abgeschlossen).

</domain>

<decisions>
## Implementation Decisions

### Modul-Aufteilung (MAINT-01)

- **D-01: Die Grenze ist 800 Zeilen, hart für jede Nachfolgedatei der vier.**
  Der Wert ist nicht gegriffen: er fällt aus der vorhandenen Struktur. Die nächstgrößeren Module
  außerhalb des Phasen-Scopes liegen bei 1292 (`encounter-calculator.js`), 1105
  (`migration-wizard.js`) und 1073 (`shops-core.js`) Zeilen; die dicht darunter liegende Tier —
  `dice-core.js` 807, `random-tables.js` 749 — ist die Größenklasse, in der dieses Projekt
  nachweislich gut arbeitet. Bei 800 landen alle vier Dateien in dieser Klasse, und das
  Abnahmekriterium ist binär prüfbar.
  **Ausdrücklich nicht betroffen:** `core/srd-monsters.js` (7659 Zeilen) — reine SRD-Datenliste, kein
  Wartbarkeitsproblem, in `MAINT-01` nicht genannt.
  — **Reversibility:** costly — die Grenze später zu senken hieße erneut aufteilen; sie zu heben ist
  billig, macht aber die schon geleistete Aufteilung nicht rückgängig.

- **D-02: Geschnitten wird entlang der vorhandenen Banner-Sektionen, nicht auf die Zeilenzahl hin.**
  Alle vier Dateien tragen bereits `// ====`-Sektionsbanner. Die 800 sind das *Abnahmekriterium*,
  nicht das *Schnittkriterium*. Passt eine Verantwortlichkeit nicht in 800 Zeilen, wird sie entlang
  einer Unterverantwortlichkeit weiter geteilt — **keine Ausnahme von D-01**, damit
  Erfolgskriterium 4 binär bleibt.

- **D-03: `ui/editors/rich-text.js` wird zuerst entflochten, nicht zerschnitten.**
  Die Datei ist nicht ein zu großes Modul, sondern **zwei fremde Module in einer Datei**. Belegt
  durch die Sektionsbanner: `STATE` (6), `RENDER` (22), `SPELL FORM` (278) und `SPELL CRUD`
  (1625–1904) sind Zauberverwaltung — zusammen ~615 Zeilen; `EDITOR FORMATTING` (322–1120),
  `FLOATING TOOLBAR` (1121–1471) und `CONTEXT TOOLBARS` (1472–1624) sind der Editor — ~1300 Zeilen.
  Eine Datei namens `rich-text.js`, die die Zauberdatenbank-UI enthält, ist selbst eine
  irreführende Stelle im Sinne dieser Phase.
  **Zielschnitt:** Zauberverwaltung raus (~615) → Editor-Formatierung/Selection-DOM (~800) →
  Toolbars (~500). Drei Dateien, alle unter der Grenze, ohne eine einzige willkürliche Schnittkante.
  — **Reversibility:** costly — die Zauber-Funktionen wandern in ein anderes Verzeichnis; ein
  Rückbau müsste `loader.js`, die Exporte und die Testpfade erneut anfassen.

- **D-04: Kein Split ohne ein Netz, das eine Verhaltensänderung fängt — und `dmscreen-render.js`
  bekommt dieses Netz zuerst.**
  Die Abdeckung der vier ist grob ungleich: `wiki.js` wird in 14 Testdateien erwähnt,
  `initiative.js` in 12, der Editor trägt das eingefrorene 80-Test-Netz aus Phase 9 —
  `dmscreen-render.js` dagegen kommt in **genau zwei** Testdateien vor
  (`tests/unit/migration-wizard.test.js`, `tests/unit/stability.test.js`), mit zusammen **fünf**
  beiläufigen Erwähnungen. Es hat faktisch keine eigene Abdeckung.
  **Konsequenz:** Der Plan für `dmscreen-render.js` schreibt **zuerst** einen
  Charakterisierungstest gegen das *ungeteilte* Modul — alle 21 Widget-Typen rendern, HTML-Ausgabe
  als Snapshot festhalten — und dieser Test muss grün sein, bevor die erste Zeile verschoben wird.
  Danach beweist derselbe Snapshot die Verhaltensneutralität der Aufteilung.
  **Das korrigiert die Risikoannahme der Roadmap:** Dort steht, `rich-text.js` sei wegen seines
  Testnetzes der begründungspflichtige Fall. Tatsächlich ist es der **am besten abgesicherte** der
  vier. Der riskante ist `dmscreen-render.js` — 1576 Zeilen, 58 Funktionen, 21 Widget-Typen, kein
  Netz. Das Vorsichtsbudget gehört dorthin.

- **D-05: Reihenfolge nach steigendem Risiko — `wiki.js` → `initiative.js` → `rich-text.js` →
  `dmscreen-render.js`.**
  Je ein eigener Plan, je mit vollem Suiten-Lauf als Hard-Gate vor dem Commit (Roadmap-Vorgabe).
  `dmscreen-render.js` steht zuletzt, weil sein Plan die zusätzliche Test-Vorstufe aus D-04 trägt
  und das Aufteilungsverfahren bis dahin dreimal geübt ist.

- **D-06: Registrierung neuer Module ausschließlich in `loader.js`.**
  `build.py` liest `MODULES`/`TEMPLATES` daraus (ARCH-01, Phase 11) — keine zweite Liste pflegen.
  Einsortierung in Abhängigkeitsreihenfolge. **Erwartete Stolperstelle:** Beim Verschieben einer
  Funktion in eine neue Datei bleibt sie leicht auch in der alten stehen; `check_duplicate_functions()`
  bricht den Build dann vor dem Bündeln ab und nennt beide Dateien. Das ist der gewünschte Ausgang —
  nicht umgehen.

### Undo- und Save-Last (PERF-01)

- **D-07: Der Save-Pfad wird zuerst entlastet, nicht der Undo-Pfad — die Requirement-Reihenfolge ist
  invertiert zur tatsächlichen Frequenz.**
  Belegt: Von 76 `saveUndoState()`/`pushUndo()`-Aufrufstellen liegt **keine einzige** in einem heißen
  Pfad. Die Verteilung ist reine CRUD (`entity-actions.js` 5, `initiative-mob.js` 4,
  `fraktionen-crud.js` 4, `bestiary-actions.js` 4 …); `features/initiative.js` ruft es **gar nicht**,
  die zwei Treffer in `rich-text.js` sind Zauber-CRUD. Das sind menschlich getaktete Einzelaktionen,
  keine Schleife. `save()` dagegen ist debounced und läuft bei **jeder** Datenänderung.

- **D-08: Im Save-Pfad entfällt `new Blob([dataString]).size`.**
  In `saveImmediate()` (`persistence.js:42`) und in `save()` (`:205`) wird der komplette
  Datenstring ein **zweites Mal** in den Speicher kopiert — nur um eine Zahl für den
  5-MB-Schwellenwert zu bekommen. Ersatz: exakte UTF-8-Byte-Zahl per einmaligem Scan über den
  String, ohne Allokation. Die `JSON.stringify(D)` selbst bleibt — sie ist für den Schreibvorgang
  notwendig, nicht redundant.
  — **Reversibility:** reversible — lokale Änderung an zwei Stellen.

- **D-09: Die Undo-Semantik bleibt „ein Schritt stellt die volle Kampagne her". Entlastet wird über
  zwei Hebel, die nichts an dieser Zusage ändern:** (a) **Dedupe** — ein Snapshot, der mit dem
  Stack-Kopf identisch ist, wird nicht gepusht; (b) **Byte-Budget** über den Stack zusätzlich zum
  `UNDO_LIMIT` (30), das älteste Einträge verdrängt, bevor der Speicher davonläuft.

- **D-10: Kein Scoping einzelner Aufrufstellen, keine Delta-/Patch-Snapshots.**
  Beides würde eine Zusicherung ins Implizite verlagern — „diese Aufrufstelle fasst nur `D.npcs` an".
  Genau diese Fehlerklasse hat das Projekt zweimal getroffen (`DEBT-17`, `DEBT-18`: zwei Subsysteme,
  impliziter Vertrag, kein Test, der die Naht durchläuft), und eine falsche Scope-Angabe verlöre beim
  Undo still Daten. Für einen Einzelnutzer-Offline-Tracker ist dieser Preis nicht gerechtfertigt.
  Delta-Snapshots scheiden zusätzlich an der Runtime-Dependency-Sperre aus.
  — **Reversibility:** reversible — Scoping ließe sich später additiv nachrüsten, falls eine Messung
  es je rechtfertigt.

- **⚠ Konflikt mit Erfolgskriterium 2 — bewusst und benannt.** Die Roadmap formuliert: „Weder ein
  Undo-Snapshot noch ein Save serialisiert bei jeder Operation die vollständige Kampagne." Mit D-09/D-10
  serialisiert ein Undo-Snapshot weiterhin die volle Kampagne — nur nicht mehr redundant und nicht
  unbegrenzt akkumulierend. **Für den Planer:** Der Plan misst an einer realen Kampagne (Dauer von
  `JSON.stringify(D)`, Stringgröße, Stack-Gesamtgröße bei 30 Einträgen) und legt das Ergebnis der
  Verifikation vor. Liegt die Serialisierung im einstelligen Millisekundenbereich, wird Kriterium 2
  als „für den Save-Pfad erfüllt, für Undo nachweislich unkritisch" abgenommen und die Abweichung
  dokumentiert. Liegt sie darüber, ist D-10 neu zu bewerten — dann mit Messwert statt Vermutung.

### Würfelstatistik (PERF-02)

- **D-11: Deckel auf die Datensatzzahl plus manueller Löschen-Knopf. Kein automatisches Pruning nach
  Alter oder Session.**
  Der Store hat heute weder Prune noch Löschen (`dice-stats-idb.js` kennt nur `statsIdbPut`,
  `getAllStats`, `getStatsForSession`). Ein Deckel begrenzt ihn strukturell — Erfolgskriterium 3 ist
  damit erfüllt — ohne dass an einer Kalendergrenze still etwas verschwindet. „Meine Würfel hassen
  mich seit drei Jahren" ist genau die Auswertung, für die man Langzeitdaten behält; ein
  Alters-Pruning würde sie unbemerkt zerstören. Der Deckel wird großzügig gesetzt, sodass er für
  einen realen Spielleiter praktisch nie greift; verdrängt wird das Älteste zuerst.
  — **Reversibility:** one-way — verdrängte Würfe sind weg. Deshalb der großzügige Deckel und kein
  zeitbasiertes Kriterium. Der Löschen-Knopf braucht eine Rückfrage.

- **D-12: `getAllStats()` bleibt für den Export erhalten; die Auswertung bekommt einen eigenen,
  cursor-basierten Aggregat-Pfad.**
  Die Funktion hat zwei sehr verschiedene Konsumenten: `dice-stats-render.js:233` (heiß — läuft bei
  jedem Öffnen der Auswertung, braucht aber nur Aggregate) und `systems/migration/audio-export.js:202,229`
  (einmalig — braucht die vollständigen Datensätze). Nur der erste wird umgebaut: Aggregation per
  Cursor, sodass nie das ganze Array im Speicher liegt. Der Export behält den Vollzugriff.
  **Damit ist die offene Frage 3 aus `12-CONTEXT.md` beantwortet:** Der Umzugs-Export nimmt die
  Würfelstatistik weiterhin vollständig mit — begrenzt durch den Deckel aus D-11, nicht durch eine
  eigene Export-Regel.

### Markdown-Wächter (MAINT-03)

- **D-13: `hasHtmlTags` wird entfernt, und die Unterstrich-Regeln werden auf die
  CommonMark-Intraword-Regel gebracht.**
  Der Wächter wird bei `markdown-converter.js:264` berechnet und **nie gelesen**. Ihn zu verdrahten
  wäre der falsche Fix: Der Rich-Text-Editor speichert HTML, also enthielte praktisch **jeder**
  Wiki-Eintrag HTML-Tags — die Markdown-Darstellung auf Anzeige (Feature seit v2.6.0) fiele damit
  faktisch überall aus. Aus einem Anzeigebug würde ein Feature-Verlust.
  Die eigentliche Ursache liegt bei `:271` und `:275`: `__([^_]+)__` → `<b>` und `_([^_]+)_` → `<i>`
  greifen auch **innerhalb** eines Wortes. `https://example.com/foo_bar_baz` wird deshalb zu
  `foo<i>bar</i>baz`. CommonMark verbietet genau das — Unterstrich-Betonung gilt nicht wortintern.
  Die Regeln bekommen Wortgrenzen-Wächter; die `*`-Varianten bleiben unangetastet.
  — **Reversibility:** reversible — reine Regex-Änderung an zwei Zeilen; keine gespeicherten Daten
  betroffen, da die Konvertierung erst bei der Anzeige läuft.

### Claude's Discretion

Vom Nutzer delegiert („Führe alle Bereiche nach deinen Empfehlungen aus"). Nach Projektkonvention
entschieden — keine Rückfrage nötig, aber hier festgehalten, damit der Planer nicht neu wählt:

- **D-14 (SEC-03):** Explizite Ziel-Whitelist als Konstante, nicht Namenspräfix-Konvention. Eine
  Konvention wäre nur eine Regel, die man vergisst; eine Liste bricht sichtbar. Der Fehlerfall
  (`ui-actions.js:189`) geht von `console.error` auf `ErrorHandler.log` hinter `DEBUG_MODE` — er
  fällt sonst unter `MAINT-06`.
- **SEC-04:** `linkText` in `parseWikiLinks()` (`wiki.js:648-654`) läuft durch `esc()`, nicht nur
  durch das heutige `"`-Ersetzen. Der Kommentar bei `wiki.js:432-434` dokumentiert, dass die Stelle
  heute **nur** durch das vorgelagerte `sanitizeHTML()` ungefährlich ist — die Abhängigkeit wird
  aufgelöst, der Kommentar entsprechend nachgezogen.
- **MAINT-02:** Nur die drei benannten Fundstellen. Die echte Überschattung ist
  `const D = track.duration` in `soundboard-player.js:147` (die Roadmap nennt `:145`) — die
  **169** Vorkommen von `const D = window.D` sind das etablierte Zugriffsmuster dieses Projekts und
  bleiben unangetastet; sie anzufassen wäre eine 169-Dateien-Änderung ohne Nutzen und ohne Bezug zum
  Requirement. Die `mindmap`-Seeds (`backups.js:232`, `debug.js:917`) und das doppelte `data-id`
  (`wiki.js:391-392`) fallen weg.
- **MAINT-04:** Die drei `execCommand`-Aufrufe (`entity-links.js:87`, `wiki.js:831`,
  `system-actions.js:82`) werden mit den Phase-9-Hilfsfunktionen abgelöst —
  `insertTextAtSelection()` für die beiden `insertText`-Fälle, `wrapRangeWithElement()` für
  `createLink`. Die drei Treffer in `utils/basic.js:125,126,235` sind Kommentare und bleiben;
  Erfolgskriterium 6 verlangt nur Freiheit außerhalb von Kommentaren.
- **MAINT-05:** Tab-Registry-Renderer als Funktionsreferenzen statt Strings (`tab-registry.js` hält
  heute `renders: ['renderDashboard']` etc.); `initPerformanceMonitoring()` (`backups.js:321-325`)
  bekommt denselben Guard wie `startAutoBackup()` (`:306-308`).
- **MAINT-06:** Die 78 `console.*`-Aufrufe im Quellbaum werden nicht gelöscht, sondern auf
  `ErrorHandler.log()` hinter `APP_CONFIG.DEBUG_MODE` umgestellt — Löschen nähme Diagnosefähigkeit,
  die beim Debuggen am Spieltisch gebraucht wird. `build.py` strippt sie nicht, also muss der Guard
  im Quellcode sitzen. Die Kopfkommentare in `file-backup-manager.js:6,387` beschreiben künftig
  `registerPostSaveHook()`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Anforderungen und Belege
- `.planning/REQUIREMENTS.md` — `SEC-03`, `SEC-04`, `PERF-01`, `PERF-02`, `MAINT-01` … `MAINT-06`
  mit Datei-/Zeilenbelegen
- `.planning/ROADMAP.md` §Phase 13 — Erfolgskriterien 1–8 und der **Auslegungshinweis zum Zuschnitt**
  (eigener Plan je Datei, voller Suiten-Lauf als Hard-Gate)
- `.planning/milestones/v1.1-phases/11-architektur-build-hygiene/11-CONCERNS-TRIAGE.md` —
  Live-Code-Beleg je `DEBT`-Posten; die Triage-Grundlage für alle zehn Requirements dieser Phase
- `.planning/milestones/v1.1-REQUIREMENTS.md` — ungekürzte Beschreibungen von `DEBT-23/14/06/07/24/04/25/16/13/12/03/09/10/27/26`

### Projektregeln, die diese Phase bindet
- `CLAUDE.md` §Conventions → *execCommand-Ablösung* — benennt die drei verbleibenden Aufrufstellen
  und die Phase-9-Ersatzfunktionen (`MAINT-04`)
- `CLAUDE.md` §Architecture Patterns → *Live-Sync Pattern (Post-Save-Hooks)* — warum
  `window.save`-Wrapping strukturell wirkungslos ist (`MAINT-06`, Kopfkommentare)
- `CLAUDE.md` §Gotchas Nr. 1 (ARCH-01) — Module ausschließlich in `loader.js` registrieren (D-06)
- `CLAUDE.md` §Build System & Deduplication — `check_duplicate_functions()` bricht den Build bei
  doppelten Top-Level-Deklarationen ab; relevant beim Verschieben von Funktionen (D-06)
- `CLAUDE.md` §Duplicate Declaration Debugging Pattern — Fehlerbilder beim Modul-Verschieben

### Vorentscheidungen aus Phase 12
- `.planning/phases/12-datensicherheit/12-CONTEXT.md` — D-01 (zweite Export-Datei, Grund für die
  `getAllStats()`-Kopplung in D-12), D-06 (Undo-Reihenfolge und Push-Validierung, die D-09 nicht
  brechen darf), sowie **offene Frage 3** zum `diceStats`-Volumen, die D-11/D-12 hier beantworten
- `.planning/milestones/v1.1-phases/11-architektur-build-hygiene/11-LEARNINGS.md` und
  `.planning/milestones/v1.1-phases/08-test-fundament-gr-n/08-LEARNINGS.md` — wiederkehrendes Muster
  „ein grüner Test ist kein Beweis"; direkte Begründung für D-04

### Testnetz, das die Aufteilung absichert
- `tests/e2e/features/editor-formatting.spec.js`, `editor-floating.spec.js`, `editor-insert.spec.js`,
  `editor-smoke.spec.js` — das eingefrorene Phase-9-Netz für `rich-text.js`; vor **und** nach dem
  Split laufen lassen
- `tests/e2e/features/wiki.spec.js`, `initiative.spec.js`, `tests/unit/initiative-mob.test.js` —
  Absicherung für die ersten beiden Splits
- `tests/unit/markdown-converter.test.js`, `tests/unit/markdown-shortcuts.test.js` — Netz für D-13

**Keine externen ADRs oder Specs — dieses Projekt führt keine.**

</canonical_refs>

<code_context>
## Existing Code Insights

### Wiederverwendbare Bausteine
- **Phase-9-Editor-Hilfsfunktionen** (`ui/editors/rich-text.js`): `insertTextAtSelection()`,
  `insertHtmlAtSelection()`, `wrapRangeWithElement()`, `closestEditorAncestor()` — decken alle drei
  `execCommand`-Fälle aus `MAINT-04` ab. Kein neues Verfahren nötig.
- **`startAutoBackup()`** (`systems/backups.js:306-308`) — der Interval-Guard, den
  `initPerformanceMonitoring()` (`:321-325`) übernehmen soll (`MAINT-05`). Vorlage liegt in derselben
  Datei.
- **`ErrorHandler.log()` hinter `APP_CONFIG.DEBUG_MODE`** — etabliertes Muster, Ziel aller 78
  `console.*`-Umstellungen (`MAINT-06`).
- **`getStatsForSession()`** (`dice-stats-idb.js:54`) — nutzt bereits einen `sessionId`-Index; die
  Vorlage für den cursor-basierten Aggregatpfad aus D-12.

### Etablierte Muster, die den Rahmen setzen
- **Sektionsbanner in allen vier Zielmodulen** — `// ====`-Blöcke markieren die
  Verantwortlichkeitsgrenzen bereits; D-02 folgt ihnen statt neue Schnitte zu erfinden.
- **`const D = window.D` als Zugriffsmuster (169 Vorkommen)** — Projektstandard, kein Defekt; D-14
  grenzt `MAINT-02` bewusst dagegen ab.
- **Non-ESM, Global Scope, keine Runtime-Dependency** — schließt Delta-Bibliotheken für PERF-01 und
  Diff-Werkzeuge für die Aufteilung aus.
- **`save()` ist debounced, `saveImmediate()` nicht** (`persistence.js:185`, `:34`) — die
  Frequenzasymmetrie, auf der D-07 beruht.

### Integrationspunkte
- **`loader.js` `MODULES`-Array** — einziger Ort für neue Dateien (D-06); `build.py` liest daraus und
  bricht bei fehlender Datei ab.
- **`_notifyPostSaveHooks()`** (`persistence.js`) — läuft an jedem Persist-Erfolgspunkt; D-08 darf die
  Aufrufreihenfolge nicht verschieben.
- **`systems/migration/audio-export.js:201-229`** — zweiter Konsument von `getAllStats()`; die Naht,
  an der `PERF-02` und Phase-12-D-01 aufeinandertreffen.
- **`sanitizeHTML()` vor `parseWikiLinks()`** (`wiki.js:432-435`) — die dokumentierte
  Reihenfolgeabhängigkeit, die `SEC-04` auflöst.

</code_context>

<specifics>
## Specific Ideas

- **Der Nutzer hat die Entscheidungen delegiert, nicht die Sorgfalt.** Vorgabe war: alle vier
  Bereiche nach meiner Empfehlung entscheiden. Zwei Empfehlungen weichen dabei von der
  Roadmap-Erwartung ab und sind oben mit Beleg begründet — D-04 (Risiko liegt bei `dmscreen-render.js`,
  nicht bei `rich-text.js`) und D-07 (Save-Pfad ist der heiße, nicht Undo).
- **Ein Erfolgskriterium wird voraussichtlich nicht wörtlich erfüllt** (Kriterium 2, siehe Warnblock
  unter PERF-01). Das ist keine stille Abweichung, sondern eine Messvorgabe an den Planer.

</specifics>

<deferred>
## Deferred Ideas

- **`const D = window.D` projektweit auf ein anderes Zugriffsmuster umstellen** (169 Vorkommen) —
  außerhalb von `MAINT-02`, das nur die echte Überschattung nennt. Falls es je gemacht wird, gehört
  es in einen eigenen mechanischen Refactoring-Posten mit vollem Suiten-Lauf, nicht in diese Phase.
- **`encounter-calculator.js` (1292), `migration-wizard.js` (1105) und `shops-core.js` (1073)
  aufteilen** — liegen ebenfalls über der 800er-Grenze aus D-01, sind in `MAINT-01` aber nicht
  genannt. Kandidaten für einen künftigen Wartbarkeits-Posten, sobald die 800 als Projektnorm steht.
- **Dedizierte Testabdeckung für den DM-Screen über den Charakterisierungs-Snapshot hinaus** — D-04
  liefert nur das Minimum, das die Aufteilung absichert. Echte Widget-Tests (Interaktion, Profile,
  Live-Sync) wären ein eigener Posten; Berührung mit `TEST-04` in Phase 14.
- **Undo-Scoping je Aufrufstelle** — durch D-10 verworfen. Falls die Messung aus dem PERF-01-Warnblock
  zeigt, dass die Vollserialisierung am Spieltisch spürbar ist, ist das der nächste Schritt — dann mit
  Messwert und mit einem Test je gescopeter Aufrufstelle.
- **`console.*` per Build-Schritt strippen statt per Quellcode-Guard** — `build.py` könnte die
  Aufrufe im `--production`-Lauf entfernen. Sauberer als 78 Guards, aber eine Build-System-Änderung
  mit eigenem TDD-Aufwand (`tests/build/`); passt besser zu Phase 14 oder später.

</deferred>

---

*Phase: 13-Härtung & Wartbarkeit*
*Context gathered: 2026-09-05*
