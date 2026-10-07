# Design-Handoff v3 — Welle 5 (Typografie): Bericht und Sichtungsliste

**Stand:** 06.10.2026, HEAD `e4ac3a7` auf Zweig `design-welle-4` · **Ausgangsstand:** `7e4aa09` · **59 Commits**, 74 Dateien, +15.226 / −2.466
**Grundlage:** `HANDOFF-v3/DESIGN-HANDOFF-v3.md` §5 Welle 5 (D-06, D-09, D-12) — die als **atomar** und **Risiko hoch** ausgewiesene Welle

---

## 1 · Die Vermessung hat einen Fehler gefunden, der nichts mit Typografie zu tun hat

Vor der ersten Zeile wurde gemessen. Dabei kam heraus:

**Die zehn gebündelten Schriften im Repo enthalten das lateinische Alphabet nicht.** Google liefert je Familie mehrere Zeichen-Teilstücke; das Repo hat jeweils das *erste* statt `latin` bekommen. Gemessen: `inter-400` deckt **157 Zeichen**, `source-sans-pro-400` deckt **61**. Der Beweis ist kein leeres Kästchen, sondern ein Schriftwechsel: der deutsche Satz erscheint in einer Serifenschrift, die kyrillische Zeile daneben in echten Inter-Formen.

**Und selbst mit richtigen Dateien würden sie dich nie erreichen.** `build.py:428` schreibt die Schriftpfade auf relative Nachbardateien um, nicht als `data:`-URI. Gegenprobe: das Bündel allein in einen leeren Ordner kopiert und per `file://` geöffnet → **drei NetworkError, keine Schrift geladen.** Beim Favicon hat das Projekt genau diese Konsequenz gezogen — `build.py:561` begründet den `data:`-URI wörtlich mit dem `file://`-Doppelklick. Für die Schriften wurde sie nie gezogen.

**Daraus folgt ein Fehler im Alltag:** die vier Schriften im Editor-Menü (Roboto, Inter, Poppins, Source Sans) sind sämtlich wirkungslos. Wer „Inter" wählt, bekommt **Arial**.

Das war der Grund, die Handoff-Empfehlung (Inter) zu verwerfen: sie ist heute technisch nicht wählbar. „Inter" an die erste Stelle zu setzen hätte **A und Ä** aus Inter geholt und alles Übrige aus Segoe UI — im Commit sähe das aus wie eine Typografie-Entscheidung und wäre ein Schriftmischmasch.

### Die Zahlen des Handoffs, zum fünften Mal

| Behauptung | Gemessen |
| --- | --- |
| `em`-Deklarationen **784** | **603** |
| px-Literale **47** | **238** (Faktor 5,1) — davon 149 schon auf einem Skalenwert |
| Verschachtelungsketten **53** | **102 Elemente in 26 Pfaden**, alle Tiefe 2 — das eigentliche Risiko sind **225** em-Elemente mit Elternwert ≠ 16px |
| Gewichte umzustellen **110** | **95** |
| Inline in JS **108** | **94** echte Deklarationen |
| `INLINE_MAX` senken um **39** | um **2** — die Ratsche zählt `style="`-Attribute, nur zwei tragen ausschließlich `font-size` |
| kleinste Schrift **7,70px** | **7px** in SVG-Beschriftungen (die 7,70 hat Welle 4 repariert) |
| Inline in Templates **39** | **39** ✓ |

---

## 2 · Deine Entscheidungen

| ID | Entschieden | Folge |
| --- | --- | --- |
| E-1 | Segoe behalten, Dateien separat reparieren | 0 Stellen; die 7 `tnum`-Deklarationen entfallen ersatzlos |
| E-2 | Mobilvergrößerung **bleibt** | 480 Elemente bei 375px bleiben, wie sie sind |
| E-3 | Emoji-Icons bleiben Ausnahme | 66 von 853 Deklarationen neben der Skala |
| E-4 | Fließtext streng, Diagramm/Punkte benannt ausgenommen | Untergrenze 11px, 34 benannte Ausnahmen in 5 Signaturen |

**`tnum` war ein gemessener Nullzug:** Segoe UIs Ziffern sind bereits alle gleich breit (Spanne 0,00). Nachgewiesen per Gegenprobe mit Candara, Constantia und Corbel, die Mediävalziffern führen und sehr wohl reagieren — die Messung war also nicht blind.

---

## 3 · Eine Richtigstellung zu etwas, das ich dir gesagt habe

Bei E-2 habe ich als Begründung angeführt, Formulareingaben müssten bei 16 px bleiben, weil ein Telefon darunter beim Antippen den Auto-Zoom auslöst.

**Gemessen: 75 von 201 antippbaren Textfeldern liegen bei 375 px unter 16 px — vorher wie nachher.** Die Mobilvergrößerung hält 126 Felder bei oder über 16 px; die übrigen 75 lagen schon vorher darunter.

Die Entscheidung bleibt richtig — sie schützt 126 Felder, und die Alternative hätte alle unter die Linie geschickt. Mein Satz klang aber, als schütze sie alle. **Das ist eine der zwei offenen Fragen in §7.**

---

## 4 · Wie „atomar" prüfbar gemacht wurde

Der Handoff verlangt einen Commit für alle Ersetzungen. Ein Diff über 801 Deklarationen liest niemand.

**Die Lösung:** der atomare Commit (`e9ad3bf`) enthält **nur Werkzeugergebnis** — 801 Deklarationen in 18 Dateien, erzeugt von achtzehn `--only`-Läufen, kein Byte von Hand getippt. Alles, worüber ein Mensch urteilen muss, steht vorher in eigenen kleinen Commits: die Zuordnungstabelle, das Werkzeug, sein Wächter, die 31 Urteilsstellen. Der Prüfer liest rund 110 Zeilen statt 840 Deklarationen.

Die **Grenze des Musters** ist dabei benannt und eingehalten: anders als bei den Editor-Werkzeugleisten besitzt dieses Werkzeug das Markup nicht — eine `font-size` steht mitten in handgeschriebenem CSS. `--check` kann hier nicht „identisch neu erzeugbar" prüfen, nur „kein Wert außerhalb der Tokenmenge". Es ist ein **einmaliges** Umstellungswerkzeug, keine Dauersynchronisation.

---

## 5 · Was die Prüfung zurückgedreht hat

Vier Stellen, an denen der Plan falsch lag und die Gegenprüfung es vor dem atomaren Commit fand:

- **„die 16-px-Annahme hat 15 Stellen falsch zugeordnet"** — das Werkzeug rechnete Zielgrößen gegen einen *angenommenen* Elternwert von 16 px statt gegen den gemessenen. Genau die Falle mit den 225 verschachtelten Elementen.
- **„die Tastenhilfe bleibt bei 8 px — die Hebung hat sie unlesbar gemacht"** — die 11-px-Untergrenze stur angewandt ließ die Tastenkürzel-Hinweise ineinanderlaufen.
- **„die vorgerechnete Anhebung war falsch"** — eine Schrankenrechnung zurückgedreht.
- **„die Akte nennt die Tautologie, nicht die Übereinstimmung"** — ein Vergleich bestätigte sich selbst, statt etwas zu messen.

**Und ein Agent hat seine eigene frühere Entscheidung widerlegt:** O-13 hatte festgelegt, die 95-%-Quote gelte nur für die Textmenge, weil die Elementquote sie nicht erreichen könne. Gemessen erreicht sie beide.

---

## 6 · Alle Tore, von mir unabhängig nachgefahren

| | vorher (`7e4aa09`) | jetzt (`e4ac3a7`) |
| --- | --- | --- |
| Jest | 1.963 (75 Suiten) | **2.110 (78 Suiten)** |
| Playwright | 595 / 27 übersprungen | **604 / 31 / 0 Fehlschläge** |
| pytest | 30 | 30 |
| Lint | 363 = Pin | 363 = Pin |
| Typecheck / strict | grün | grün |
| Builds | grün | grün |
| DUBLETTEN / `!important` / Inline | 0 / 105 / 254 | **0 / 104 / 252** (zwei gesunken) |
| beide Wächter | OK | OK |
| CLAUDE.md | — | unverändert |

**Zielquote erreicht:** 820 / 831 = **98,68 %** auf die Textmenge, 820 / 857 = 95,68 % auf alle Deklarationen. Die Elementquote steigt von 63,36 auf **98,11 %**. Die 11 Stellen, die in der Textmenge danebenliegen, sind bewusst drin — eine Quote, aus der jede unbequeme Stelle herausdefiniert ist, wäre eine Tautologie.

**Untergrenze erfüllt:** 0 Textelemente unter 11 px außerhalb von 5 benannten Signaturen (34 Elemente). Vorher waren es 153. Jede Ausnahme trifft nachweislich eine existierende Stelle.

**Grundlinien-Diff:** 18.220 verglichene Schlüssel, 9.043 Größenänderungen — aber nur **10 Elemente** über der 2-px-Schranke, jedes mit Begründung am Code. Größter Sprung: die Zeitgeber-Uhr im 250-px-Ring, 48 → 34 px.

**Ein Nachtrag von mir:** der vierte Durchgang des Stil-Wächters erhebt zwei Vollabzüge, lag aber auf der globalen 30-s-Schranke und fiel bei mir im Volllauf aus. Er hat jetzt sein eigenes 90-s-Budget mit Begründung an der Stelle; die globale Schranke bleibt bei 30 s, damit die übrigen Fälle weiter auffallen (`e4ac3a7`, dreimal nachgefahren: 25,9 / 25,6 / 25,7 s).

---

## 7 · Offen — zwei Fragen an dich

1. **E-2 schützt weniger als zugesagt** (§3). Eigene Einheit mit einer Ratsche am Element — oder die Begründung auf das abschwächen, was sie wirklich leistet?
2. **Die Histogramm-Beschriftungen** wirken auf dem Telefon 4,76 bis 5,44 px, obwohl ihre Deklaration 7 bzw. 8 sagt. Ursache ist die viewBox-Skalierung, nicht der Wert — die Untergrenze greift dort konstruktionsbedingt nicht. Sie aus dem skalierten Koordinatensystem zu nehmen wäre die Lösung, ist aber eine eigene Arbeit.

**Restschuld, benannt und nicht behoben:**
- die zehn kaputten `woff2` und der `file://`-Pfad der gebündelten Schriften (E-1 nimmt beides heraus)
- die Layoutregel der Tastenhilfen (nur die des berührten Knopfs zeigen) — Voraussetzung dafür, die 8 px auf 11 zu heben; Funktionsänderung
- die Schrift-**Familie** der Bedienelemente: Schritt 8 setzt nur `font-size`, Knöpfe und Felder benutzen weiter die Systemschrift
- die fehlende Zwischensprosse zwischen 34 und 72 px
- `npm run check` bleibt vorbestehend rot (prettier über den ganzen Baum)

---

## 8 · Sichtungsliste

206 Dateien in `tests/e2e/__screens__/welle-5/`, darunter ein Kontaktbogen mit 15 Paaren. Neu erzeugen:

```bash
python build.py && WELLE5_SCREENS=1 npx playwright test tests/e2e/features/welle-5-screens.spec.js
```

**Die fünf Punkte, bei denen ich am ehesten mit Widerspruch rechne:**

1. **Die Charakterkarte.** Die Attributpillen steigen von 10,08 (Name) und 10,64 (Modifikator) auf je 11 px; der Namenskasten wird 1,58 px breiter, die Pille 1,47 px höher. Sechs Pillen in einer Reihe — liest sich das noch?
2. **Die Zeitgeber-Uhr im 250-px-Ring** — größter Sprung der Welle (48 → 34 px). Der Kasten fällt von 105,56 auf 74,78 px Breite. Wirkt „0:00" im Ring jetzt verloren? Hier wird die fehlende Zwischensprosse sichtbar.
3. **Das Mobil-Profil bei 375 px.** E-2 heißt: die Vergrößerung bleibt. Sieht die Fläche noch stimmig aus, oder wirkt sie doppelt vergrößert?
4. **Die Gewichtsumstellung 700 → 600** an 83 Stellen, besonders die sieben Armaturenbrett-Kennzahlen in Reihe. Im hellen Theme fällt ein Gewichtsunterschied stärker auf als im dunklen.
5. **Die Würfelstatistik.** Die Beschriftung bleibt bewusst bei 7 bzw. 8 Einheiten. Die Frage ist nicht, ob das klein ist — das ist gemessen —, sondern ob es auf dem Telefon zumutbar bleibt.

Der **Kontaktbogen** ist der schnellste Weg, die Welle in einem Blick zu beurteilen. Die Gegenprobe-Zeile (`#loot-search` 14 → 14 px) ist absichtlich dabei, damit sichtbar ist, dass sich *nicht* alles bewegt hat.
