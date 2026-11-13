# Inspiration pflegen

`catalog.json` legt Abteilungen, Themen und Reihenfolge der Markdown-Artikel fest. Die Dateien jeder Abteilung liegen im gleichnamigen Unterordner. Die erste Zeile eines Artikels ist eine Markdown-Überschrift der ersten Ebene. Links auf andere Dateien derselben Abteilung verwenden deren Dateinamen.

Die Nummer vor dem ersten Bindestrich ist die lokale Artikel-ID. Für `README.md` ist die Nummer 100 reserviert. Bestehende Nummern bleiben stabil. Für weitere Abteilungen vergib einen eigenen `idOffset`, damit die Summen aus Offset und Artikel-ID über alle Abteilungen hinweg eindeutig sind.

`unlisted` enthält Artikel, die über Links erreichbar sind und in der Themenliste ausgeblendet werden. `notSearchable` hält zum Beispiel ein umfangreiches Quellenverzeichnis aus der globalen Suche heraus.

Nach Änderungen am Bestand erzeugt `python tools/generate_inspiration.py` das JavaScript für den Offline-Build. Mit `python tools/generate_inspiration.py --check` lässt sich prüfen, ob das generierte Modul zum Bestand passt.
