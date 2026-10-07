# Das Mobil-Layout — Bericht

**Stand:** 02.10.2026, HEAD `3480d1d` · **Ausgangsstand:** `cecfefe` · **46 Commits**, 25 Dateien, +7.903 / −790 Zeilen
**Anlass:** ein Nebenbefund aus der UAT-Runde — „im Mobil-Layout ist kein Ansichtswechsel möglich"

---

## 1 · Der Anlass war falsch gemeldet, der Befund darunter echt

Ein Prüfagent hatte berichtet, auf dem Telefon lasse sich die Ansicht gar nicht wechseln. **Das stimmte nicht** — er hatte nur den eingeklappten Zustand gemessen; der Umschalter ist erreichbar und fährt die Leiste aus.

Was ich beim Nachmessen fand, war anders und schlimmer, als es klingt:

| Fenster | Reiter im Fenster | **anklickbar** |
| --- | --- | --- |
| 390×844 | 16 von 24 | **8** |
| 360×740 | 16 von 24 | **9** |
| 700×800 | 16 von 24 | **12** |

Und mit **gefüllter** Kampagne (Ereignis-Log offen, Kampfprotokoll offen) war es noch schlechter: **6 von 24** bei 390×844 und **0 von 24** bei 360×740 — dort lag das neue Kampfprotokoll genau auf der Umschalter-Zeile, die Leiste ließ sich also gar nicht erst ausfahren.

Die Null ist die eigentliche Pointe: in diesem einen Fall hatte der Agent im Ergebnis recht, aber aus dem falschen Grund.

---

## 2 · Was behoben ist

### Alle 24 Ansichten erreichbar
Zwei Ursachen. Ein Deckel ohne Fensterbezug: `.nav-tabs` trug `max-height: 300px` bei 444 px Rasterinhalt — die unterste Reiterreihe lag dauerhaft hinter dem Überlauf, obwohl bei 390×844 unter dem Umzugs-Band **623 px** frei waren. Und vier bodenverankerte Schwebeelemente, die zusammen über **76.000 px²** auf der Leiste lagen (Ereignis-Log 71.420, Würfel-Auslöser 2.304, Referenz-Kugel 2.500).

Die 56-px-Tippfläche ist geblieben. Falsch war der Deckel, nicht die Reitergröße: der Nutzer bedient die App mit dem Daumen, und unter 44 px trifft er nicht zuverlässig. Die Desktop-Gruppierung (6 Gruppen statt 24 Reitern) wurde verworfen, weil sie aus einem Tipp zwei macht und den Ansichtsnamen hinter einem Gruppennamen versteckt — am Tisch muss „wo ist das Soundboard" durch Hinsehen beantwortbar sein.

**Jetzt:** 24/24 bei 320×700, 360×740 und 390×844 ohne jedes Scrollen, im Querformat nach zwei Radrunden — in allen vier Themes, auch im vollen Zustand.

### Kein seitlicher Überlauf mehr
Sechs Ursachen, alle an der Wurzel, **kein einziges `overflow-x: hidden`** dazugekommen.

Die Kernstelle: `1fr` ist `minmax(auto, 1fr)`, und das `auto`-Minimum ist die `min-content`-Breite des Inhalts. Beim Dashboard löste das zu **710 px** in einem 300 px breiten Raster auf. Dieselbe Bauart steckte in der Master-Detail-Familie und — als `min-width: auto` — in zwei Formularfeldern, wo die intrinsische Feldbreite zur harten Schranke wird.

| Ansicht | 320×700 | 360×740 | 390×844 |
| --- | --- | --- | --- |
| Dashboard | 416 → 0 | 376 → 0 | 346 → 0 |
| Initiative | 244 → 0 | 204 → 0 | 174 → 0 |
| Fraktionen | 116 → 0 | 76 → 0 | 46 → 0 |
| Würfel | 72 → 0 | 32 → 0 | 2 → 0 |
| Quests | 48 Elemente geklippt → 0 | 32 → 0 | 24 → 0 |

**Eine Stelle wurde bewusst anders gelöst:** In der Initiative hätte `minmax(0, 1fr)` die sechs Knöpfe von 379 px auf 140 px gepresst — unter die 44-px-Tippfläche, die gerade erst gesichert worden war. Dort bekommt die Knopfreihe eine eigene Zeile und bricht darin um.

**Und ein Befund, den nur die Einzelelement-Prüfung fand:** In den Quests meldete das Dokument **null** Überhang, während 48 Elemente außerhalb lagen — sauber weggeschnitten von einem `overflow: hidden`. Die Done- und Loot-Marken begannen bei x=328 in einem 320-px-Fenster. Deshalb prüft die Zusicherung jetzt beides: die Scrollbreite **und** jedes Element einzeln.

### Weiteres
- **Das Layoutprofil folgt dem Fenster** — aber nur, solange du keines gewählt hast, und der automatische Wechsel schreibt selbst nichts fest (sonst hätte die erste Verkleinerung das Profil für immer gesetzt).
- **Der Platz der unteren Leiste wird nur noch einmal reserviert** (vorher 70 px doppelt).
- **Der Umschalter-Streifen ist auf ganzer Breite frei.** Die Referenz-Kugel saß mit 2.250 px² darauf; die Mitte war frei, deshalb funktionierte die Navigation und deshalb fiel es nie auf — ein Rechtshänder tippt aber rechts.
- Tote Geschwisterregel in `migration.css` gestrichen, die 42 Ausnahmen im Stil-Wächter abgeräumt, die 128-Zustands-Messmatrix in die Suite gezogen.

---

## 3 · Alle Tore, von mir unabhängig nachgefahren

| | vorher (`cecfefe`) | jetzt (`3480d1d`) |
| --- | --- | --- |
| Jest | 1.908 (75 Suiten) | **1.910 (75 Suiten)** |
| Playwright | 444 / 19 übersprungen | **585 / 23 / 0 Fehlschläge** |
| pytest | 30 | 30 |
| Lint | 363 = Pin | 363 = Pin |
| Typecheck / strict | grün | grün |
| Builds | grün | grün |
| DUBLETTEN / `!important` / Inline | 0 / 105 / 256 | **0 / 105 / 256** |
| beide Wächter | OK | OK |
| CLAUDE.md | — | unverändert |

**Desktop unverändert, auf den Bildpunkt:** für jede der 24 Ansichten jedes Element als Rechteck erfasst, bei 1440×900 und 1280×800, mit derselben gefüllten Saat, gegen den Ausgangsstand — **keine einzige abweichende Zelle in 48 Paaren**. Die fünf UAT-Funde sind weiter durch ihre eigenen Wächter gedeckt.

---

## 4 · Zwei Fehler im Vorgehen, die hier hingehören

1. **Ich habe zuerst auf einer leeren Kampagne gemessen** und bekam null Überhang — der Befund schien widerlegt. Mit Daten reproduzierte er sofort. Das ist exakt die Falle, durch die der Listen-Fehler drei Wochen unentdeckt blieb: *die Seeds sind zu kurz.* Jede Zusicherung dieser Runde legt jetzt genug Daten an, um ihren Fall überhaupt zu erzeugen, und die Prüfung musste belegen, ab welcher Datenmenge sie greift.
2. **Ich habe einem Agenten einen 15 Commits alten Ausgangsstand genannt.** Jest, Lint, Ratschen und Wächter stimmten trotzdem, nur die Playwright-Zahl war um 53 zu niedrig angesetzt. Der Agent hat es selbst auseinandergerechnet, statt die Abweichung durchgehen zu lassen.

---

## 5 · Offen

- Die Theme-Achse ist bei 320×700 eingefroren, an den drei anderen Fenstern nur gemessen (alle sauber). Begründung: die Zahlen sind je Fenster über alle vier Themes bitgleich, die Ursachen sind Raster- und Flex-Minima, keine Farben.
- Gemessen wird nur Chromium — Firefox und WebKit stehen in `playwright.config.js` auskommentiert. Das inhaltsbasierte Minimum von Formularfeldern ist browserabhängig.
- Kein Wächter nimmt eine **25. Ansicht** automatisch in die Prüfung auf; die Reiterliste steht als Literal in der Probe.
- `GATE-04` aus CLAUDE.md bleibt offen: `tools/sync-editor-toolbars.js --check` existiert, aber nichts fährt es automatisch.
- Sehr kurze Fenster (unter 700 px Höhe) deckt die Messmatrix bewusst nicht ab.

---

## 6 · Nachkontrolle

Acht Handgriffe, jeder mit Gerätegröße. Die drei wichtigsten:

1. **320×700, Soundboard** — diese Ansicht lief bis zu dieser Runde **leer** durch jede Prüfung. Sie misst sauber, aber kein Mensch hat sie gefüllt gesehen.
2. **740×360 (gedreht), Navigationsleiste** — hier *muss* die Leiste scrollen, alles andere wäre Zufall. Mit dem Daumen durch alle 24 Reiter wischen und den letzten antippen.
3. **320×700, voller Zustand** (Log im Dauermodus, Protokoll offen, Schnellreferenz offen) — den 56-px-Streifen **ganz links und ganz rechts** antippen, nicht nur in der Mitte.

Dazu: das Formelfeld der Würfel-Ansicht (`4d6kh3+2d8+5` eintippen und ohne Wischen lesen), die Done- und Loot-Marken im Auftragskopf, die Todesrettungs-Punkte in der Initiative, alle vier Themes auf Dashboard und Initiative — und auf dem Desktop die zwei Stellen, die man nur sieht, wenn man sie bedient: der Ereignis-Dialog und die Such- und Filterleiste beim Scrollen.
