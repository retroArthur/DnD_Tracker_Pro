# Screenshots

## Enthalten
`01-bericht.png` … `04-bericht.png` — der Auditbericht als Bild (Kennzahlen, Leitbeispiel Orte/Kalender, Befunde, Maßnahmenplan). Inhaltlich identisch zu `../BEFUNDE.md`; nützlich als Übersicht, nicht als Umsetzungsvorlage.

## Nicht enthalten: Screenshots der App selbst
Die App-Views (Orte, Kalender, …) sind bewusst **nicht** als Bild beigelegt — das Audit ist am Code entstanden, und für die Umsetzung ist der Code die genauere Quelle (siehe `../PATCHES.md`).

Falls Vorher/Nachher-Bilder gewünscht sind, ist das in zwei Minuten selbst gemacht:

1. `dnd-tracker-bundled.html` per Doppelklick öffnen.
2. Tab **Welt ▸ Orte** aufnehmen → `vorher-orte.png`, Tab **Welt ▸ Kalender** → `vorher-kalender.png` (gleiche Fensterbreite verwenden, sonst sind die Bilder nicht vergleichbar).
3. Nach Welle 1 dieselben zwei Aufnahmen wiederholen → `nachher-orte.png`, `nachher-kalender.png`.

Erwartetes Ergebnis nach Welle 1: gleiche Kartenfläche (`--bg-card` statt transparent), gleicher Radius (10px statt 0), gleiche Randbreite und Zentrierung (Views liegen jetzt in `.main-content`), gleiche Buttonfarbe der Primäraktion.
