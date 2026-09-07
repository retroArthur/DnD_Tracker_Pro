# Phase 12 — Discussion Log

*Menschliche Referenz für Audits und Retrospektiven. Wird von den Downstream-Agents (Researcher,
Planner, Executor) NICHT gelesen — die verbindlichen Entscheidungen stehen in `12-CONTEXT.md`.*

**Datum:** 2026-08-06
**Modus:** discuss (Standard)
**Besprochene Bereiche:** alle vier angebotenen

---

## Scout-Befunde vor der Diskussion

Vier Annahmen wurden vorab am Live-Code geprüft, damit die Fragen an Fakten hängen:

| Prüfung | Ergebnis |
| --- | --- |
| Wie erzeugt `full-export.js` die Datei? | **Ein** JSON-Blob per `JSON.stringify(exportObj, null, 2)`, Anchor-Download (`:84-99`) |
| Existiert `autosave-toggle` im UI? | **Nein** — abgefragt in `persistence.js:38`, `:192`, `avatars.js:173`, in keinem Template vorhanden |
| Popt `undo()` vor der Parse-Prüfung? | **Ja** — `undoStack.pop()` auf `:39`, `safeJSONParse` erst auf `:41`; identisch in `redo()` `:72-74` |
| Wo liegt das Soundboard-Audio? | IDB-Store `audioBlobs` (`soundboard-idb.js:64-66`), getrennt von localStorage |

---

## Bereich 1 — Export-Format für Audio

**Frage:** Wie soll das Soundboard-Audio in den Umzugs-Export?

**Vorgelegt:** Zweite Datei nur für Audio (empfohlen) · Base64 direkt in den bestehenden Export ·
Beim Export auswählen · Ohne Audio, aber mit Warnung

**Gewählt:** **Zweite Datei nur für Audio**

*Begründung der Empfehlung:* Ein einziger Blob inklusive Audio kann am Browser-Speicher scheitern —
und dann scheitert der gesamte Umzug, nicht nur das Audio. Ein ZIP schied aus, weil es ein
Runtime-Dependency erfordert hätte, was die Projektregel ausschließt.

**Folgefrage:** Was tut der Import, wenn die Audio-Datei fehlt oder nicht passt?
**Gewählt:** **Hauptimport läuft, Audio wird gemeldet** — mit Angabe der betroffenen Szenen.
*Der Umzug läuft nur einmal; ein blockierender Import wäre hier das größere Risiko.*

→ D-01, D-02

---

## Bereich 2 — Backup-Umfang und Namenskollision

**Frage:** Welchen Umfang soll ein Datei-Backup-Lauf haben?

**Vorgelegt:** Immer alle Kampagnen (empfohlen) · Aktive Kampagne, andere auf Wunsch · Alle, aber
Snapshots nur für die aktive

**Gewählt:** **Immer alle Kampagnen**

*Begründung:* Erfüllt endlich, was der Kommentar „D-13: je Kampagne einzeln" seit Phase 2 behauptet.
Der gefährliche Standardfall — man vergisst die anderen — verschwindet strukturell.

**Folgefrage:** Wie werden kollidierende `safeName`s aufgelöst?
**Gewählt:** **Kampagnen-Key anhängen**

**Nachgeschobene Frage (Konsequenz für vorhandene Dateien):** Der Key im Dateinamen würde die
bestehenden Backups des Nutzers zu Waisen machen — `standard-kampagne-aktuell.json` würde zu
`standard-kampagne-dnd-tracker-data-aktuell.json`.
**Gewählt:** **Key nur bei echter Kollision anhängen** — vorhandene Backups laufen nahtlos weiter,
kein schreibender Eingriff in den Backup-Ordner.

→ D-03, D-04

---

## Bereich 3 — `autosave-toggle`

**Frage:** Einführen oder entfernen?

**Vorgelegt:** Codepfad entfernen (empfohlen) · Schalter wirklich einbauen · Erstmal nur absichern

**Gewählt:** **Codepfad entfernen**

*Begründung:* Toter Code, der `saveImmediate()` theoretisch abschalten kann. Entfernen macht das
Speichern unbedingt; ein echter Schalter wäre eine neue Fehlerquelle für einen Nutzen, der nicht
angefragt war.

→ D-05

---

## Bereich 4 — Tiefe der Undo-Reparatur

**Frage:** Nur die Reihenfolge korrigieren oder zusätzlich beim Push validieren?

**Vorgelegt:** Reihenfolge + Validierung beim Push (empfohlen) · Nur die Reihenfolge

**Gewählt:** **Reihenfolge korrigieren und beim Push validieren**

*Begründung:* Die Reihenfolgekorrektur allein lässt einen defekten Snapshot auf dem Stack liegen; die
Push-Validierung verhindert, dass er dorthin gelangt.

→ D-06

---

## Zusatzfrage — Testumfang

**Frage:** Sollen die Persistenz-Randfall-Tests auch den neuen Audio-Export abdecken?

**Gewählt:** **Ja, Export/Import-Rundlauf mit Audio**

*Begründung:* Genau die Naht, an der `DEBT-18` entstanden ist — und dieselbe Fehlerklasse, die schon
`DEBT-17` verdeckt hat: zwei Subsysteme mit implizitem Vertrag und kein Test, der die Naht durchläuft.

→ D-08

---

## Beobachtung

Alle acht Entscheidungen fielen auf die jeweilige Empfehlung. Bemerkenswert ist die letzte: die
Konsequenz für vorhandene Backup-Dateien war in der ursprünglichen Frage nach der Kollisionsauflösung
nicht sichtbar und wäre bei einem „immer Key anhängen" stillschweigend zulasten der bestehenden
Snapshot-Historie gegangen. Sie wurde nachgeschoben, weil sie den Nutzer als Endanwender direkt
betrifft — nicht als technisches Detail.

Kein Scope Creep in der Diskussion; die vier zurückgestellten Ideen stehen in `12-CONTEXT.md`
§„Noted for Later".
