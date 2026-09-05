# Phase 13: Härtung & Wartbarkeit - Discussion Log

> **Nur Prüfspur.** Nicht als Eingabe für Planung, Recherche oder Ausführung verwenden.
> Die Entscheidungen stehen in `13-CONTEXT.md` — dieses Protokoll bewahrt die verworfenen Alternativen.

**Datum:** 2026-09-05
**Phase:** 13-Härtung & Wartbarkeit
**Besprochene Bereiche:** Aufteilungs-Schnitt, Undo- und Save-Last, Würfelstatistik, Markdown-Wächter
**Modus:** Nutzer wählte alle vier Bereiche und delegierte die Entscheidung —
*„Führe alle Bereiche nach deinen Empfehlungen aus."* Statt vier Fragerunden je Bereich wurden die
Optionen am Live-Code abgewogen und jeweils die begründete Empfehlung gesetzt.

---

## Aufteilungs-Schnitt (MAINT-01)

### Frage 1 — Woran bemisst sich „übergroß"?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| 800 Zeilen hart | Fällt aus der vorhandenen Struktur: nächste Tier darunter ist `dice-core.js` 807 / `random-tables.js` 749 | ✓ |
| 900–1000 Zeilen | Weniger Aufteilungsarbeit, aber die vier blieben in derselben Größenklasse wie die ungelösten Fälle (`shops-core.js` 1073) | |
| Keine feste Zahl, nur „entlang Verantwortlichkeiten" | Erfolgskriterium 4 wäre nicht binär prüfbar | |

**Begründung:** Die Zahl ist Abnahmekriterium, nicht Schnittkriterium (D-02). `core/srd-monsters.js`
(7659 Zeilen) bleibt ausdrücklich außen vor — reine SRD-Daten.

### Frage 2 — Wie wird `rich-text.js` (1932) geschnitten?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Entflechten statt zerschneiden | Die Datei enthält zwei fremde Module: Zauberverwaltung (~615 Zeilen) + Editor (~1300). Zauber raus, Editor dann in zwei | ✓ |
| Gleichmäßig in drei Teile à ~640 | Erreicht die Grenze, erzeugt aber willkürliche Schnittkanten mitten in Verantwortlichkeiten | |
| Unangetastet lassen (Testnetz-Risiko) | Erfolgskriterium 4 wäre für eine der vier Dateien verfehlt | |

**Belegt durch die Sektionsbanner:** `STATE` (6), `RENDER` (22), `SPELL FORM` (278), `SPELL CRUD`
(1625–1904) = Zauber; `EDITOR FORMATTING` (322), `FLOATING TOOLBAR` (1121), `CONTEXT TOOLBARS`
(1472) = Editor. Eine Datei namens `rich-text.js` mit der Zauberdatenbank-UI darin ist selbst eine
irreführende Stelle im Sinne dieser Phase.

### Frage 3 — Wo liegt das eigentliche Risiko bei MAINT-01?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Bei `dmscreen-render.js` — Netz zuerst bauen | Kommt in **genau zwei** Testdateien vor (`migration-wizard.test.js`, `stability.test.js`), zusammen fünf beiläufige Erwähnungen. 1576 Zeilen, 58 Funktionen, 21 Widget-Typen, faktisch ungetestet | ✓ |
| Bei `rich-text.js` (Roadmap-Annahme) | Trägt das eingefrorene 80-Test-Netz aus Phase 9 — der **am besten** abgesicherte der vier | |
| Überall gleich, voller Suiten-Lauf reicht | Ein Suiten-Lauf beweist nichts über ein Modul, das die Suite kaum berührt | |

**Notiz:** Das korrigiert eine Annahme der Roadmap. Der Auslegungshinweis dort nennt `rich-text.js`
als begründungspflichtig; die Abdeckungsmessung zeigt das Gegenteil. Vorsichtsbudget wandert zum
DM-Screen: Charakterisierungstest über alle 21 Widget-Typen **vor** der ersten verschobenen Zeile.
Direkter Bezug zum wiederkehrenden Projektmuster „ein grüner Test ist kein Beweis"
(`08-LEARNINGS.md`, `11-LEARNINGS.md`).

### Frage 4 — Reihenfolge der vier Pläne?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Steigendes Risiko: wiki → initiative → rich-text → dmscreen | Verfahren dreimal geübt, bevor der ungetestete Fall drankommt | ✓ |
| Größte zuerst (rich-text 1932) | Höchster Aufwand ohne eingeübtes Verfahren | |
| Parallel in einer Welle | Widerspricht der Roadmap-Vorgabe „eigener Plan je Datei mit vollem Suiten-Lauf als Hard-Gate" | |

---

## Undo- und Save-Last (PERF-01)

### Frage 1 — Welcher der beiden Pfade ist wirklich heiß?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Der Save-Pfad | `save()` ist debounced und läuft bei jeder Datenänderung | ✓ |
| Der Undo-Pfad | Requirement nennt ihn zuerst — Messung widerspricht | |

**Belegt:** Von 76 `saveUndoState()`/`pushUndo()`-Aufrufstellen liegt keine in einer Schleife. Die
Verteilung ist reine CRUD (`entity-actions.js` 5, `initiative-mob.js` 4, `fraktionen-crud.js` 4,
`bestiary-actions.js` 4 …). `features/initiative.js` ruft es **gar nicht**; die zwei Treffer in
`rich-text.js` (`:1737`, `:1842`) sind Zauber-CRUD. Menschlich getaktete Einzelaktionen.

### Frage 2 — Was genau ist im Save-Pfad redundant?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| `new Blob([dataString]).size` entfernen | Kopiert den kompletten Datenstring ein zweites Mal, nur für eine Zahl (`persistence.js:42`, `:205`) | ✓ |
| `JSON.stringify(D)` vermeiden | Nicht möglich — das Ergebnis ist der Schreibvorgang selbst | |
| Save seltener auslösen | Ändert Datensicherheits-Zusagen aus Phase 12 | |

### Frage 3 — Wie wird der Undo-Stack entlastet?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Dedupe + Byte-Budget, Semantik unverändert | Identischer Snapshot wird nicht gepusht; Budget verdrängt Älteste zusätzlich zu `UNDO_LIMIT` 30 | ✓ |
| Scoping je Aufrufstelle (`saveUndoState('...', {scope})`) | Größter Gewinn, aber eine falsche Scope-Angabe verlöre beim Undo still Daten | |
| Delta-/Patch-Snapshots | Scheitert an der Runtime-Dependency-Sperre | |
| `structuredClone` statt `JSON.stringify` | CPU billiger, Speicher teurer — verschiebt das Problem | |

**Notiz zum verworfenen Scoping:** Es verlagerte eine Zusicherung ins Implizite — „diese
Aufrufstelle fasst nur `D.npcs` an". Genau diese Fehlerklasse hat das Projekt zweimal getroffen
(`DEBT-17`, `DEBT-18`: zwei Subsysteme, impliziter Vertrag, kein Test, der die Naht durchläuft).

### Frage 4 — Umgang mit Erfolgskriterium 2?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Messvorgabe an den Planer, Abweichung benennen | Zeit für `JSON.stringify(D)`, Stringgröße, Stackgröße bei 30 Einträgen messen und der Verifikation vorlegen | ✓ |
| Kriterium still als erfüllt abhaken | Wäre eine stille Abweichung | |
| Scoping doch umsetzen, um es wörtlich zu erfüllen | Kriterium über Verlässlichkeit gestellt | |

**Notiz:** Liegt die Serialisierung im einstelligen Millisekundenbereich, wird Kriterium 2 als „für
den Save-Pfad erfüllt, für Undo nachweislich unkritisch" abgenommen. Darüber ist D-10 mit Messwert
statt Vermutung neu zu bewerten.

---

## Würfelstatistik (PERF-02)

### Frage 1 — Welche Aufbewahrungsregel?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Deckel auf Datensatzzahl + manueller Löschen-Knopf | Begrenzt strukturell, ohne dass an einer Kalendergrenze still etwas verschwindet | ✓ |
| Nach Alter (z. B. 12 Monate) | Zerstört unbemerkt genau die Langzeitauswertung, für die man die Daten behält | |
| Nach Sessionzahl (letzte N) | `sessionId`-Index existiert, aber gleiches Problem wie Alters-Pruning | |
| Nur manuell, kein Deckel | Erfüllt Erfolgskriterium 3 nicht — Store bliebe unbegrenzt | |

**Notiz:** Deckel großzügig, sodass er für einen realen Spielleiter praktisch nie greift; verdrängt
wird das Älteste. Verdrängte Würfe sind unwiederbringlich — deshalb Rückfrage beim Löschen-Knopf.

### Frage 2 — Wie wird `getAllStats()` abschnittsweise?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Nur die Auswertung umbauen, Export behält Vollzugriff | Zwei sehr verschiedene Konsumenten: `dice-stats-render.js:233` (heiß, braucht nur Aggregate) vs. `audio-export.js:202,229` (einmalig, braucht Datensätze) | ✓ |
| `getAllStats()` global auf Cursor umstellen | Bräche den Umzugs-Export aus Phase 12 (D-01) | |
| Nur Aggregate zurückgeben | Derselbe Bruch, nur unsichtbarer | |

**Notiz:** Beantwortet die offene Frage 3 aus `12-CONTEXT.md` — der Umzugs-Export nimmt die
Würfelstatistik weiterhin vollständig mit, begrenzt durch den Deckel, nicht durch eine eigene
Export-Regel.

---

## Markdown-Wächter (MAINT-03)

### Frage 1 — `hasHtmlTags` anschließen oder entfernen?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Entfernen und die Unterstrich-Regeln reparieren | Behebt die Ursache, ohne ein Feature zu verlieren | ✓ |
| Anschließen (`if (hasHtmlTags) return html`) | Der Rich-Text-Editor speichert HTML → praktisch **jeder** Wiki-Eintrag enthielte Tags → Markdown-auf-Anzeige (v2.6.0) fiele überall aus. Aus einem Anzeigebug würde ein Feature-Verlust | |
| Beides: anschließen und Regeln fixen | Der Wächter wäre dann wirkungslos toter Code mit Nebenwirkung | |

### Frage 2 — Wie werden die Regeln repariert?

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| CommonMark-Intraword-Regel für `_`/`__` | Unterstrich-Betonung gilt nicht wortintern — genau der Standard, der `foo_bar_baz` schützt | ✓ |
| URLs vorab maskieren und nachher zurücksetzen | Löst nur den URL-Fall, nicht `snake_case_bezeichner` allgemein | |
| `_`-Regeln ganz streichen | Nimmt eine funktionierende Markdown-Schreibweise weg | |

**Belegt:** `markdown-converter.js:271` (`__([^_]+)__` → `<b>`) und `:275` (`_([^_]+)_` → `<i>`)
greifen wortintern; `https://example.com/foo_bar_baz` wird zu `foo<i>bar</i>baz`. Die `*`-Varianten
bleiben unangetastet. Betrifft keine gespeicherten Daten — die Konvertierung läuft erst bei der
Anzeige.

---

## Claude's Discretion

Vom Nutzer pauschal delegiert. Nach Projektkonvention entschieden, in `13-CONTEXT.md` festgehalten,
damit der Planer nicht neu wählt:

| Requirement | Entscheidung | Verworfene Alternative |
|---|---|---|
| SEC-03 | Explizite Ziel-Whitelist als Konstante; Fehlerfall auf `ErrorHandler.log` hinter `DEBUG_MODE` | Namenspräfix-Konvention — nur eine Regel, die man vergisst |
| SEC-04 | `linkText` durch `esc()`, Reihenfolge-Kommentar bei `wiki.js:432-434` nachziehen | Weiterhin nur `"` ersetzen und auf `sanitizeHTML()` vertrauen |
| MAINT-02 | Nur die drei benannten Fundstellen (`soundboard-player.js:147`, zwei `mindmap`-Seeds, doppeltes `data-id`) | Alle 169 `const D = window.D` mit umstellen — Projektstandard, kein Defekt |
| MAINT-04 | Phase-9-Hilfsfunktionen: `insertTextAtSelection()` ×2, `wrapRangeWithElement()` ×1 | Neues Verfahren erfinden |
| MAINT-05 | Funktionsreferenzen statt Strings in `tab-registry.js`; Interval-Guard nach Vorlage `startAutoBackup()` | Nur die `DEBUG_MODE`-Warnung schärfen |
| MAINT-06 | 78 `console.*` auf `ErrorHandler.log()` hinter `DEBUG_MODE` umstellen | Löschen — nähme Diagnosefähigkeit am Spieltisch |

## Deferred Ideas

- `const D = window.D` projektweit umstellen (169 Vorkommen) — eigener mechanischer Posten
- `encounter-calculator.js` (1292), `migration-wizard.js` (1105), `shops-core.js` (1073) aufteilen —
  ebenfalls über 800, in `MAINT-01` aber nicht genannt
- Echte DM-Screen-Widget-Tests über den Charakterisierungs-Snapshot hinaus — Berührung mit `TEST-04`
- Undo-Scoping je Aufrufstelle — nur falls die PERF-01-Messung es rechtfertigt
- `console.*` per `build.py --production` strippen statt per Quellcode-Guard — Build-Änderung mit
  eigenem TDD-Aufwand
