# Die vier Funde der Vier-Themes-Runde — Bericht

**Stand:** 01.10.2026, HEAD `cecfefe` · **Ausgangsstand:** `a90bdd6` · **49 Commits**, 76 Dateien, +9.007 / −799 Zeilen
**Grundlage:** deine Sichtung vom 30.09.2026 (GSD-Plan 15-14 Task 3, Abschnitt C)

---

## 1 · Die Hypothese war falsch — und das ist die wichtigste Erkenntnis

Ich hatte den Löschlauf der Phase 15 verdächtigt (5.400 Zeilen CSS). **Für alle vier Funde widerlegt.** Zwei kommen stattdessen aus der Design-Konsolidierung vom 7. September:

| Fund | Ursache | Seit | Verursacher |
| --- | --- | --- | --- |
| **F2** Listen unerreichbar | `.view.active{display:block}` schlägt `display:flex` der Schalen | 07.09.2026 | `f514ba4` „Dubletten zusammengeführt (F-18)" |
| **F3** Überlappungen | drei bewusst verschiedene z-Stufen (100/99/98) auf eine gezogen | 07.09.2026 | `297a910` „Stapel-Skala (F-19)" |
| **F1** Ereignis-Dialog | `class="modal-overlay active"` — den Schalter gibt es nicht | 15.06.2026 | `d05ce45`, Tag eins der Funktion |
| **F4** Historie | 2 s Standzeit, Deckel bei 5 Einträgen, kein Puffer | 28.12.2025 | Entwurf, den das Mob-Modul im Juni überwuchs |

Beide September-Commits waren **Aufräumarbeiten mit grünen Suiten**. Sie haben drei Wochen lang 77 % einer Liste unerreichbar gemacht, ohne dass ein Test angeschlagen hätte.

---

## 2 · Was behoben ist

### F1 — Der Ereignis-Dialog
Der Dialog wurde gebaut und hing im DOM — mit **0×0 Pixeln**, weil die Sichtklasse `active` hieß statt `show`. Ein Selektor `.modal-overlay.active` hat in diesem Repository **nie** existiert. Dazu ein zweiter Bruch: `.modal-box` hat null CSS-Regeln.

Derselbe Defekt steckte im NPC-Generator und wurde **drei Tage später** in derselben Phase gefunden und behoben — samt Wächtertest. F1 ist ein Wiederholungsfehler, der durchrutschte, weil **kein einziger Test das Modal anfasste**: die vier vorhandenen riefen die CRUD-Funktionen direkt auf, ohne je einen Knopf zu klicken. Behoben nach dem damals abgenommenen Hausmuster, nicht als Zwei-Zeilen-Flick. Mitgenommen: `.form-label` und `.form-control` hatten nie Regeln — ein Feld ragte 68 px über die Dialogkarte hinaus, in **drei** Dialogen.

### F2 — Die Listen
31 von 40 Einträgen waren per Mausrad, Scrollbalken und Berührung unerreichbar. Der Verlust begann exakt ab dem **10. Eintrag**; darunter sieht man nichts — deshalb fiel es keinem Test auf, die Seeds sind kurz.

**Eine Falle, die beinahe zu einem Rückschritt geführt hätte:** Die naheliegende Korrektur hätte Begegnungen von 40/40 auf 38/40 verschlechtert. Gemessen, bevor es ausgeliefert wurde, und mitkorrigiert.

### F3 — Die Überlappungen
6 von 144 Ansicht-×-Menü-Kombinationen kaputt, alle auf der Initiative, dort **alle sechs** Menüs — 21 von 25 Einträgen unerreichbar. Zwei neue Stufen in der Stapelleiter stellen die ursprüngliche, im Quelltext kommentierte Ordnung wieder her. Die Kette der Klebe-Abstände hatte nur **ein** berechnetes Glied von dreien; jetzt sind alle drei gemessen.

Dazu ein Fund, den du nicht gemeldet hast, der dich aber in jeder Sitzung traf: das Umzugs-Band lag über der Kopfzeile und verdeckte App-Titel und globale Suche.

### F4 — Das Kampfprotokoll
Nicht die zwei Sekunden waren das Schlimmste, sondern ein **stiller Deckel bei fünf Einträgen**. Sechs schnelle Mob-Angriffe gemessen: fünf kamen an, der erste war weg, bevor er verblassen konnte.

Gebaut ist ein eigenes Panel (Taste `K`) mit Ringpuffer von 200 Einträgen, Filter „Alles / Kampf", übersteht den Neustart. Der Puffer liegt **nicht in `D`** — `pushUndo()` serialisiert bei jeder löschenden Aktion das ganze `D`, ein wachsendes Protokoll dort würde jeden Undo-Schritt verteuern.

Die Prüffrage und ihre Antwort: *nach sechs schnellen Angriffen und 3.000 ms Wartezeit steht der **zweite** Angriff wörtlich nachlesbar da.* Die blaue Doppelblase ist abgeschaltet, ihre 20 Zusicherungen in 10 Testdateien sind auf das Ereignis-Log umgehängt, nicht abgeschwächt.

### F5 — Was wir selbst eingebaut und wieder entfernt haben
Die Stapelkorrektur hat eine Verdeckung gegen eine andere getauscht: 59 der 74 px der Such- und Filterleiste lagen hinter der Kopfzeile, das Suchfeld war nicht anklickbar. **Die Abnahme hat es selbst gefunden.**

Behoben an der Wurzel: das Höhenbudget `calc(100vh - 120px)` war verdrahtet und um 14 px zu knapp (real 134) — deshalb überhing die Seite überhaupt, und auf diesem Überhang rutschte die Leiste unter die Kopfzeile. Jetzt kommt es aus derselben gemessenen Kette wie die Leisten-Versätze.

**128 Zustände** gemessen (4 Ansichten × 4 Breiten × 2 Höhen × mit/ohne Band × gescrollt/oben):

| | vorher | nachher |
| --- | --- | --- |
| Seitenüberhang > 0 | 128 von 128 | **0 von 128** |
| Suchfeld verdeckt | 32 von 128 | **0 von 128** |
| Kopfzeile verdeckt | 0 von 128 | 0 von 128 |

---

## 3 · Der F-18-Durchgang

Du hattest entschieden, alle 131 verschobenen Deklarationen durchzumessen. Ergebnis: **14 Umkehrungen**, davon 7 mit identischem Wert (folgenlos). **Drei Blöcke sind zurückverlegt.** Die übrigen 7 wurden am gebauten Bündel nachgemessen — kein Element im Baum trägt beide Selektoren, sie sind theoretisch.

Das Werkzeug `tools/check-f18-kaskade.js` steht als Wächter im Baum, damit sich die Klasse nicht wiederholen kann.

---

## 4 · Alle Tore, von mir unabhängig nachgefahren

| | vorher (`a90bdd6`) | jetzt (`cecfefe`) |
| --- | --- | --- |
| Jest | 1.861 (71 Suiten) | **1.908 (75 Suiten)** |
| Playwright | 382 / 15 übersprungen | **444 / 19 / 0 Fehlschläge** |
| pytest | 30 | 30 |
| Lint | 363 = Pin | 363 = Pin |
| Typecheck / strict | grün | grün |
| Builds | grün | grün |
| DUBLETTEN / `!important` / Inline | 0 / 105 / 256 | **0 / 105 / 256** |
| `check-f18-kaskade --check` | — | OK |
| `sync-aktenlage-anker --check` | 0 bei 123 | 0 bei 123 |

Jede Abweichung ist auseinandergerechnet: +47 Jest-Fälle aus vier neuen Dateien und acht Einfügungen, +62 E2E-Fälle aus fünf neuen Zusicherungsdateien. **Kein Fall ist weggefallen.**

---

## 5 · Der Preis, den die Korrektur kostet

Ehrlich und beziffert: weil die Seite nicht mehr überhängt, fehlt bei **sehr kurzen Fenstern** der Fluchtweg „Seite blättern". Ab 600 px Fensterhöhe ist das genau **ein Eintrag weniger** (13→12), bei 1280×400 fünf→zwei. Das Bestiar zeigt bei 1280×720 mit stehendem Band **zwei Listenzeilen weniger** (13 statt 15) — die 75 px, die wegfallen, waren eben jener Überhang.

Nicht dieser Runde zuzurechnen: bei etwa 390 px Fensterhöhe sind 0 von 24 Einträgen erreichbar — mit der alten verdrahteten Zahl Pixel für Pixel genauso. Ursache ist die 157 px hohe umgebrochene Werkzeugleiste.

---

## 6 · Offen, nach Gewicht

1. **Im Mobil-Layout ist kein Ansichtswechsel per Klick möglich.** Das Reiter-Raster liegt 127 bis 301 px unter der Fensterkante. Vorbestehend, unabhängig von allem hier — aber gravierender als alles andere auf dieser Liste.
2. **Das Layoutprofil folgt dem Fenster nicht.** Es wird nur beim Laden gewählt; ein schmalgezogenes Desktop-Fenster behält eine 234 px hohe Kopfzeile.
3. **360 px Breite mit stehendem Band** ist der teuerste Fall: die Listenspalte schrumpft auf 126 px (NSCs) bzw. 54 px (Truhe).
4. **Das Mobil-Layout reserviert den Platz der unteren Leiste zweimal** (70 px doppelt).
5. Eine tote Geschwisterregel in `migration.css` mit einer falschen verdrahteten Zahl.
6. Die 42 benannten Ausnahmen im Stil-Wächter (Bestiar-Zeilen) gehören weg, sobald der Sollstand regulär neu erhoben wird.
7. `hoehenbudget.spec.js` misst nur bei 1440×800; die 128-Zustands-Matrix steckt im Messskript, nicht in der Suite.

---

## 7 · Nachkontrolle

28 Bilder in `tests/e2e/__screens__/uat-funde/` (sieben Zustände × vier Themes), neu erzeugen:

```bash
python build.py && UAT_SCREENS=1 npx playwright test tests/e2e/features/uat-funde-screens.spec.js
```

**Die fünf Handgriffe, die zählen:**

1. **Kampfprotokoll** — sechsmal schnell „Angriff würfeln", drei Sekunden warten, Taste `K`. Steht der **zweite** Angriff noch da, und findest du ihn auf einen Blick?
2. **Die drei Listen** — Orte, NSCs, Truhe mit dem Mausrad ganz nach unten. Erreichst du den letzten Eintrag, und öffnet ein Klick sein Detail?
3. **Initiative mit Menü** — scrollen, dann „Inhalte" aufklappen. Liegen alle sechs Einträge frei, und führt ein Klick wirklich dorthin?
4. **Ereignis-Dialog** — Welt → Kalender → „+ Ereignis". Geht er auf, sieht das Formular aus wie der Rest der App, landet das Ereignis in der Liste?
5. **Die Werkzeugleiste** — in einer Liste scrollen, während das Umzugs-Band oben steht. Ist das Suchfeld anklickbar?

Dazu zwei Entscheidungsfragen: ob das Panel dich stört, wo es einen Knopf verdeckt (bei 1280 px zwei), und ob die zwei fehlenden Bestiar-Zeilen in Ordnung gehen.

---

## 8 · CLAUDE.md

Vier Zeilen in der Kürzeltabelle ergänzt — `K` (Kampfprotokoll) sowie drei implementierte, aber nie dokumentierte: `Strg+Shift+K` (Kommandopalette, `Strg+.` als Firefox-sichere Alternative), `Entf`/`Backspace` (Knoten löschen, nur Netzwerk-Ansicht), `Alt+1/2/4/6/8` (Schnellwurf d12/d20/d4/d6/d8). Alle vier habe ich am Quelltext gegengelesen; die Würfelzuordnung stimmt auf die Ziffer.
