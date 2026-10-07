# Design-Handoff v3 — Welle 3 (Schatten): Bericht und Sichtungsliste

**Stand:** 30.09.2026, HEAD `a90bdd6` · **Ausgangsstand der Welle:** `03274fa` · **81 Commits**
**Grundlage:** `HANDOFF-v3/DESIGN-HANDOFF-v3.md` §5 Welle 3 (D-03), dazu die 85 Literale, die Welle 2 bewusst ausgelassen hat, und die Restposten der Wellen 1 und 2

---

## 1 · Vorbemerkung: die Zahlen waren zum dritten Mal überholt

| Kennzahl | Handoff | Gemessen |
| --- | --- | --- |
| Schattendeklarationen | 88 | **80** (71 `box-shadow` + 8 `text-shadow` + 1 `drop-shadow`) |
| verschiedene Werte | 65 | **55** |
| „hartes Schwarz" | 58 | in keiner Lesart reproduzierbar (34 rein schwarz, 44 mit Schwarzanteil) |
| Glühlagen | 9 | **14** (inkl. Gelb, kein Violett) |
| goldene Ringe | 4 | **5** |
| Doppellinien-Kandidaten in Contrast | 13 | **41** Regeln mit sichtbarem Rahmen, **32** davon mit Umriss |

Die 88 zählen Stichwortnennungen über drei Eigenschaften, inklusive Übergängen und Kommentaren, und waren an keinem Commit je richtig. §5 ist zudem in sich widersprüchlich: der Abschnitt rechnet 58 + 22 = 80 und schreibt 88 darüber.

Drei Zeilenanker zeigten ins Leere (`core.css:857`, `initiative.css:922`, `dice.css:621`). Und die im Handoff vorgeschlagene Contrast-Grauleiter **`#555 / #777 / #aaa` fiel durch die projekteigene Kontrast-Ratsche** — `#555` liest gegen die vier Contrast-Flächen 2,82 / 2,53 / 2,13 / **1,69** und ist obendrein zeichengleich mit `--border`, hätte an 13 Stellen also eine zweite Linie in derselben Farbe gezogen.

---

## 2 · Entscheidungen dieser Welle

| ID | Entschieden | Von |
| --- | --- | --- |
| W3-D-01 | Contrast zeigt Höhe als Umriss, aber mit der helleren Leiter **`#888 / #aaa / #ccc`**, getrennt über die Dicke 1/2/3 px | Nutzer |
| W3-D-02 | Drei Stufen **`0 2px 6px` · `0 4px 16px` · `0 8px 32px`** (nicht die Handoff-Leiter) | Nutzer |
| W3-D-03 | `--glow-gold/-yellow/-green/-red` tragen **nur die Farbe**, Radien bleiben in der Regel; kein `--glow-purple` | Nutzer |
| W3-D-04 | `--shadow` und sein `BASELINE_TOKENS`-Eintrag fallen in **einem** Commit; R-19 ist die eigentliche Absicherung | Orchestrator |
| W3-D-05 | Die sechs JS-Inline-Schatten kommen mit; die Sprungmarken stehen auf der Sichtungsliste | Nutzer |

Alle drei Grauwerte halten 3:1 gegen **alle vier** Contrast-Flächen (min 3,56 / 5,44 / 7,87), nicht nur gegen eine. Die Stufen trennen bewusst über die Dicke, nicht über die Helligkeit: #888 gegen #aaa ist 1,53 — das liest niemand als Höhenunterschied.

---

## 3 · Ergebnis

**Alle Tore von mir unabhängig nachgefahren (HEAD `a90bdd6`):**

| Prüfung | Vor der Welle | Nach der Welle |
| --- | --- | --- |
| Jest | 1.786 | **1.861** (71 Suiten) |
| `design-consistency.test.js` | 119 | **194** |
| Playwright | 381 / 11 übersprungen | **382 / 15 übersprungen / 0 Fehlschläge** |
| pytest | 30 | **30** |
| Lint | 363 = Pin | **363 = Pin** |
| Typecheck / strict | grün | grün |
| Builds | grün | grün |
| DUBLETTEN / `!important` / Inline | 0 / 105 / 256 | **0 / 105 / 256** |

Playwright: 382 statt 381, weil Schritt 9 einen Browser-Fall hinzufügte; 15 statt 11 Übersprungene, weil die neue Ablichtung vier Theme-Fälle führt, solange `WELLE3_SCREENS=1` nicht gesetzt ist — das Muster der Wellen 1 und 2.

**Die messbare Vereinheitlichung** (selbst nachgezählt): die Zahl **verschiedener `box-shadow`-Werte fällt von 55 auf 28**, bei unveränderten 71 Deklarationen.

**Fünf neue Ratschen, +75 Fälle:** R-19 (Schatten nur aus Tokens, mit der Ort-zu-Stufe-Tabelle), R-20 (Glühlagen und Rahmennachbarn), R-21 (Ringe und Text-Leuchten), R-22 (die sechs JS-Marken), R-23 (die Restposten der Wellen 1 und 2).

**Stil-Sollstand:** 6 von 3.626 Digests geändert, **0 Zugänge, 0 Abgänge** — die zwei Laden-Marken aus `loot.css:313/353`, in je drei Durchgängen. Die Ausnahmeliste des Wächters trug ihre zwei Schlüssel nur während der Neuerhebung und ist wieder leer; die Wächterdatei selbst ist seit `03274fa` byte-unverändert.

### Die entscheidende Prüfung dieser Welle

Der Sollstand konnte hier nichts tragen: von 3.626 Digests haben **6** überhaupt einen Schatten. Die Absicherung ist deshalb R-19s Ort-zu-Stufe-Tabelle — und die ist nur dann etwas wert, wenn sie aus der Messung stammt und nicht der Umsetzung nachgeformt wurde. **Selbst nachgerechnet:** zwischen dem roten Commit `1b208d9` und HEAD hat die Tabelle je 52 Einträge, **0 Unterschiede** in Datei, Selektor, Stufe und gemessenem Altwert. Nur vier Zeilenanker sind nachgezogen.

---

## 4 · Zwei Zahlen aus den Entscheidungsvorlagen stimmten nicht

Beide nach oben, beide ohne Folge für die Umsetzung — aber du hast auf ihrer Grundlage entschieden, darum stehen sie hier:

1. **W3-D-02 versprach „24 von 53 wortgleich, nur 9 sichtbar geändert".** Nachgerechnet sind es **52 Stellen, 23 wortgleich, 29 geometrisch geändert**. Die Leiter ist exakt wie entschieden umgesetzt; nur die Folgenschätzung war zu niedrig. Die meisten der 29 sind Zuwächse von 12 auf 16 px und kaum zu sehen — vier fallen deutlich, fünf ändern sich sichtbar nach oben.
2. **Die 13 Doppellinien-Kandidaten in Contrast sind 32.** Die erste Klassifikation las nur die Kurzform `border:` und übersah die Regeln, die ihren Rahmen beim Überfahren nur **umfärben** (`border-color`) — darunter der schlechteste Fall der ganzen Welle mit **1,05**. Die Gegenprüfung hat das gefunden, die Ratsche liest jetzt beide Schreibformen.

---

## 5 · Offen

1. **`--ring-gold` bedeutet jetzt vier Dinge:** Tastaturfokus, aktiver Assistentenschritt, Ablageziel und die zwei JS-Sprungmarken. Welle 6 baut den Fokus genau darauf auf und erbt die Mehrdeutigkeit.
2. **Arbeitsregel §2 Nr. 9 ist für die Schattenfamilie unerfüllt:** keine der 14 R-19-Ausnahmen trägt einen Kommentar an ihrer Deklaration. Entweder in einem eigenen Durchgang nachtragen oder die Regel für diese Familie ausdrücklich ausnehmen.
3. **`--gold` hält in Light volldeckend nur 2,40** gegen die schlechteste neutrale Fläche. Die Sprungmarken haben dort **nie** die 3:1 gehalten, auch vor dieser Welle nicht. Das ist eine Palettenfrage, keine Schattenfrage — keine Zahl von Lagen repariert sie.
4. **`.fdp-die.d20`** steht mit 4,48 nun 0,02 unter der Schwelle. Gewollt, aber ab jetzt eine enge Grenze und kein Puffer.
5. **Aus Welle 1 und 2 erledigt:** `W2-D-06` (fehlende Zahl), `.backup-entry-restore` (jetzt über 4,5), `W2-D-05` (umgekehrte Zustandsleiter beim PWA-Knopf).
6. **Nicht aus dieser Welle, nur festgehalten:** der Offline-Hinweis hat zwei Beobachter — `core/init.js` schaltet eine Klasse `show`, die keine einzige Regel im Stilbaum trifft. Älter als Welle 3, betrifft Sichtbarkeit statt Schatten.
7. **`npx prettier --check` schlägt projektweit an**, an `03274fa` wie an HEAD. Altlast; `npm run format` bleibt als destruktiv gesperrt. Formatierung ist in diesem Repo von keinem Tor gedeckt.

---

## 6 · Sichtungsliste für die Vier-Themes-Runde

Bilder: `tests/e2e/__screens__/welle-3/` (132 Stück, lokal, nicht versioniert). Neu erzeugen:

```bash
python build.py && WELLE3_SCREENS=1 npx playwright test tests/e2e/features/welle-3-screens.spec.js
```

**Reihenfolge:** erst **Contrast** (dort ändert die Welle am meisten — aus weichen Schatten werden harte Umrisse), dann Light, dann Sepia, zuletzt Dark.

1. **Rechner-Fenster — größter Sprung der Welle.** `encounters.css:110`, `0 20px 60px` → `0 8px 32px`, Faktor **0,53**, die Weichzeichnung halbiert sich. Wirkt das Modal noch abgehoben, oder klebt es auf der Seite? *Hier wäre zu widersprechen, wenn überhaupt.* Bilder `rechner-<theme>.png`.
2. **Contrast, Doppellinien.** 32 Regeln bekommen einen Umriss neben einem sichtbaren Rahmen. Schlechtester Fall **1,05**: die Karten in `dmscreen.css` färben beim Schweben auf `--gold-dim` um, daneben 2 px `#aaa` — praktisch kein Helligkeitsunterschied, das liest sich als eine dicke matschige Kante statt als zwei Linien. Bild `kartenschweben-contrast.png`. Danach die drei mit 1,14 (Zauber-Tooltip, Werkzeugmenü, Rechner).
3. **Die vier goldenen Sprungmarken.** Sie tragen jetzt zwei Lagen `--glow-gold` (zusammen 75 %) statt volldeckendem Gold: gemessen 4,09 / **1,91** / 3,24 / 5,79. **Such sie, sieh sie nicht nur an** — ihre Aufgabe ist „zeig mir in zwei Sekunden, wohin ich gesprungen bin". Wenn sie nur auffällt, weil man weiß wo sie ist, ist sie durchgefallen. Achtung beim Urteilen: im NSC- und Orte-Bild trägt die Karte ohnehin schon einen goldenen Auswahlrahmen, die Marke wirkt dadurch stärker als sie ist. Bilder `sprungmarke-nsc-*.png`, `sprungmarke-ort-*.png`.
4. **Offline-Hinweis** (`core.css:854`). Die einzige Stelle, die je `var(--shadow)` gelesen hat; in Contrast war das ein weißer Hauch (1,21 — praktisch unsichtbar) und wird ein harter grauer Umriss. Dazu Stufe 2 statt Stufe 1 — die eine bewusste Abweichung von der Radiusregel, weil die Leiste frei schwebt. Sieht die Stufe 2 nach zu viel aus? Bild `offline-hinweis-contrast.png`.
5. **Die 29 Stellen mit geänderter Höhe**, nach Größe: vier fallen deutlich (0,53 Rechner · 0,67 Befehlspalette · 0,75 DM-Screen-Tooltip · 0,75 NSC-Marken beim Überfahren), vier leicht (0,80), eine bleibt gleich, **20 wachsen** (1,07 bis 1,60). Die meisten Zuwächse sind 12 → 16 px und kaum zu sehen.
6. **Statblock-Schublade** (`initiative.css:1078`). Eigenes Token: in Dark wortgleich, in Light/Sepia fällt die Deckung von 0,50 auf 0,14/0,16, in Contrast wird aus 24 px ein harter 2-px-Umriss links. Trennt sich die Schublade in Light und Sepia noch vom Backdrop, oder verschwimmt ihre Kante? Bilder `statblock-schublade-*.png`.
7. **Vorlesetext** (`party.css:390–438`). Der Plan hielt das für einen reinen Namenswechsel — **das stimmt nicht.** In Contrast bekommen sieben Kästen einen sichtbaren Umriss (1,00–1,12 → 3,56–5,92), in Dark wird der Hof **stärker** (Deckung 0,15 → 0,35). Rahmt der Umriss den 4-px-Papierrand, oder konkurriert er? Wirkt der Kasten in Dark jetzt tiefer eingesetzt als gewollt? Bilder `vorlesetext-*.png`.
8. **Schnellreferenz-Knopf** (`dashboard.css:1174/1181`): Ruhe und Überfahren liegen jetzt auf **derselben** Stufe. Die Rückmeldung trägt allein noch das Größerwerden. Reicht das? Bilder `qref-fab-hover-*.png`.
9. **Werkzeugmenü in Light und Sepia** (`editors.css:192`). Die dichteste Schattendeklaration des Bestands (0,65) steht jetzt auf 0,20 bzw. 0,22 — Faktor **0,31**, die größte Deckungsänderung der Welle. Steht das Menü noch frei, oder liegt es flach auf?
10. **Umzugsassistent** (`migration.css:65`): drei Änderungen auf einmal — Dicke 2 → 3 px, Deckung 30 % → 15 %, und der Ton wird themenabhängig. Abschwächung in Dark und Light. Ist der aktive Schritt dort noch als der aktuelle erkennbar?
11. **Laden-Marken** (`loot.css:313/353`) — die einzigen zwei Stellen, die der Sollstand überhaupt sieht. Der goldene Hof wird schwarz: in Dark fällt der Abstand von 1,84 auf **1,03**, der Farbhinweis ist ersatzlos weg. Beide melden einen Zustand (aktive Kategorie, aktive Sortierung). Trägt der Zustand noch, wenn Hintergrund, Rahmen und Schrift ihn allein melden müssen?
12. **Sechs Übergänge in Contrast** werden hart: aus weichem Aufsteigen wird Einrasten, weil die Höhe dort ein Umriss ohne Verlauf ist. Ruckelt es, oder liest es als bewusstes Einschnappen?
13. **Statusstreifen** (`dashboard.css:867`, `party.css:609`): dort trifft der Contrast-Umriss auf einen farbigen `border-left`. Bleibt der Streifen als Farbe erkennbar, oder verschluckt ihn der Umriss?
14. **W20-Knopf unten links** (Restposten aus Welle 2): die Fläche ist auf ein Drittel gefallen. Hebt er sich noch ab?
15. **Wiederherstellen-Knopf** in „Datei-Backups", nur beim **Überfahren einer Zeile** sichtbar — der Restposten, der in Welle 2 unter 4,5 blieb und jetzt hält.
16. **PWA-Knopf gedrückt** — nur prüfbar, wenn der Browser die Installation anbietet. Ohne Angebot ist die Zeile nicht prüfbar, und das ist kein Befund.
17. **Der Würfel-Knopf ist bei laufender Animation gar nicht zu sehen** (`dice.css:564/573`): `floatingPulse` setzt `box-shadow` in allen drei Bildern und steht über `:hover`. Nur mit abgeschalteten Bewegungen sichtbar — dann steht dort ein schwarzer Schatten, wo vorher ein roter stand. **Nicht** als sichtbaren Sprung mitzählen.

---

## 7 · Abnahme

Offen — die Vier-Themes-Runde steht aus. Danach folgt Welle 4 (Bewegung und Zusammenführung).
