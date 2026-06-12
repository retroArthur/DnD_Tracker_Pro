# SRD-Lizenz-Audit: D&D Kampagnen-Tracker Pro

**Erstellt:** 2026-06-12
**Betrifft:** `core/srd-spells.js` (151 Zeilen, 28 Zauber auf Deutsch)
**Repo:** github.com/retroArthur/DnD_Tracker_Pro (offentlich)

---

## Herkunft

### Betroffene Daten

Die Datei `core/srd-spells.js` enthalt 28 deutsche Zauberbeschreibungen (Cantripps und Zauberstufen 1-3) als JavaScript-Datenobjekte. Die Texte umfassen Zaubereffekte, Komponenten, Wirkungszeiten und Klassenzuweisungen.

### Quellangaben im Code

Ein Audit (grep nach `source`, `Quelle`, `lizenz`, `license`, `CC-BY`, `creative`, `wizards`, `copyright`) ergab: **keine Quellenangabe** im Code oder in den Zaubertexten selbst.

### Einschatzung der Herkunft

Die Zaubernamen und -effekte entsprechen den deutschen Bezeichnungen aus dem Dungeons & Dragons 5e System Reference Document (SRD 5.1) von Wizards of the Coast. Die deutschen Beschreibungen sind kompakte Paraphrasen (nicht wortwortliche Zitate aus einem lizenzierten Druckprodukt wie dem deutschen Spielerhandbuch). Der Stil und die Kürze deuten auf eine **eigene Zusammenfassung** der SRD-Regeln hin, nicht auf eine kopierte Drittübersetzung.

**Befund: Eigene Paraphrase der SRD 5.1-Regelinhalte auf Deutsch** — kein Hinweis auf Kopie aus einem geschützten lizenzierten Druckwerk (z.B. deutsches Spielerhandbuch von Ulisses Spiele).

---

## Lizenz

### SRD 5.1 (Grundregeln)

Das System Reference Document 5.1 (SRD 5.1) von Wizards of the Coast steht unter der **Creative Commons Attribution 4.0 International (CC-BY-4.0)** Lizenz:

- **Lizenz:** CC-BY-4.0
- **Lizenzgeber:** Wizards of the Coast LLC
- **Dokument:** "System Reference Document 5.1"
- **Lizenz-URL:** https://creativecommons.org/licenses/by/4.0/
- **SRD-URL:** https://dnd.wizards.com/resources/systems-reference-document

### Pflicht-Attribution laut CC-BY-4.0

CC-BY-4.0 verlangt, dass jede Weitergabe des SRD-Materials folgende Attribution enthalt:

> This work includes content from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/.

---

## Risikobewertung

### Szenario: Eigene Paraphrase (aktueller Befund)

- **Risiko: NIEDRIG** — Die CC-BY-4.0-Lizenz erlaubt Weitergabe, Bearbeitung und kommerzielle Nutzung, solange die Attribution korrekt angegeben ist.
- **Pflicht-Attribution fehlte** bis zu diesem Audit in README und LICENSE.
- **Massnahme:** Attribution in README.md und LICENSE ergänzt (siehe unten).

### Szenario: Geschützte Drittübersetzung (nicht gefunden)

Falls zukünftig eine wortliche Übereinstimmung mit einer urheberrechtlich geschützten deutschen Übersetzung (z.B. aus dem Ulisses-Spielerhandbuch) gefunden wird:

- **Risiko: HOCH** — Das deutschsprachige Spielerhandbuch ist KEINE CC-BY-lizenzierte Quelle; Ulisses Spiele hat eigene Urheberrechte an der Übersetzung.
- **Konsequenz:** Betroffene Texte müssen ersetzt oder entfernt werden (eigene Neufassung).
- **Entscheidung D-16:** Kein stilles Löschen — Eskalation als eigene Folge-Entscheidung mit Nutzerbestätigung.

**Aktueller Status: Kein hartes Risiko identifiziert. Monitoring bei zukünftigen Ergänzungen empfohlen.**

---

## Attribution

Die folgende Attribution ist in README.md und LICENSE aufgenommen worden:

```
This application includes content from the System Reference Document 5.1 ("SRD 5.1")
by Wizards of the Coast LLC, available at https://dnd.wizards.com/resources/systems-reference-document.
The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License
(CC-BY-4.0), available at https://creativecommons.org/licenses/by/4.0/.
```

Gekürzter Hinweis fur README (Deutsch):

```
Die App enthält Regelinhalte aus dem System Reference Document 5.1 (SRD 5.1) von
Wizards of the Coast LLC (CC-BY-4.0). Weitere Details: docs/srd-license.md
```

---

## Empfehlungen

1. **Neue Zaubertexte:** Bei zukünftigen Ergänzungen immer die Quelle im Code-Kommentar angeben.
2. **Druckwerk-Vergleich:** Falls deutsche Texte aus dem Ulisses-Spielerhandbuch übernommen werden, gesondertes Kommentar + Eskalation gemäss D-16.
3. **CC-BY-4.0-Compliance:** Die Attribution in README und LICENSE ist ausreichend für die Anforderungen der CC-BY-4.0-Lizenz.

---

*Audit durchgeführt: 2026-06-12 | Entscheidung: D-16 | Anforderung: STAB-11*
