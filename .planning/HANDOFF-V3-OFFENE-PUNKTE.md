# Design-Handoff v3 — offene Punkte

Was hier steht, ist **nicht erledigt und nicht stillschweigend freigegeben**. Jeder Punkt nennt
die Messung, auf der er beruht, den Befehl, mit dem sie nachvollziehbar ist, und die Frage, die
noch zu beantworten ist.

Die Einträge sind teilweise durch eine Ratsche gesichert: `tests/unit/design-consistency.test.js`
(Block R-02, Test „jede Zelle aus ATTR_HOVER_AUSNAHME ist im offenen Punkt gefuehrt") geht rot,
wenn eine hier geführte Zeile verschwindet, wenn ein Wert auseinanderläuft oder wenn eine Zeile
zur Altlast wird. Ein offener Punkt kann also nicht durch Vergessen verschwinden.

---

## W1-B-01 — Vier Attributkürzel fallen in Dark und Contrast beim Überfahren der Zeile unter 4,5

**Status: OFFEN — Rückfrage an den Nutzer, Entscheidung D-5 beruht auf überholten Zahlen.**
Aufgenommen am 2026-09-28, Welle 1, Schritt 12.

### Worum es geht

Die Attributkürzel der Schnellreferenz (`.attr-str` … `.attr-cha`, Markup
`assets/templates/modals-editors.html:370-376`) liegen auf **drei** Trägerflächen, nicht auf zwei:

- `--bg-dark` — DM-Screen-Widgets `.dms-attr-item` / `.dms-save-item`
- `--bg-card` — `.qref-row` im Ruhezustand (`assets/styles/dashboard.css:1257`)
- `--bg-hover` — `.qref-row:hover` (`assets/styles/dashboard.css:1267`)

Die dritte Fläche ist beim Lesen einer Zeile kein Sonderfall, sondern der Normalfall: man fährt
mit dem Zeiger über die Zeile, die man liest.

**Entscheidung D-5 („Dark/Contrast behalten ihre Werte, außer `--attr-wis`") wurde auf der
Zwei-Flächen-Messung getroffen.** Dort zeigen die betroffenen Zellen 4,52–5,95 und damit gar kein
Problem. Erst `--bg-hover` (#333 in beiden Themes) bringt sie auf 3,16–3,58. Diese Zahlen lagen
der Entscheidung nicht vor.

### Die acht Zellen, gemessen

Nachgerechnet am 2026-09-28 mit einem eigenen WCAG-Rechner (Selbstprobe `#777`/`#767676` gegen
Weiß = 4,48/4,54 — die bekannte Grenzprobe, an der ein falsch implementierter Rechner auffliegt).
Spalte „min2" ist das Minimum über `--bg-dark` und `--bg-card`, also die Zahl, die D-5 vorlag.

| Theme    | Token       | Wert heute            | --bg-hover | min2 (bg-dark/bg-card) | Vorschlag B | dann --bg-hover |
| -------- | ----------- | --------------------- | ---------- | ---------------------- | ----------- | --------------- |
| dark     | --attr-str  | #ef4444 via var(--red) | 3,36       | 4,62                   | var(--red-text) = #f37373 | 4,52 |
| dark     | --attr-int  | #3b82f6               | 3,44       | 4,73                   | #619af8     | 4,50            |
| dark     | --attr-wis  | #aa58f7               | 3,28       | 4,52                   | #bd7ef9     | 4,52            |
| dark     | --attr-cha  | #ec4899               | 3,58       | 4,93                   | #f06dae     | 4,51            |
| contrast | --attr-str  | #ff0000 via var(--red) | 3,16       | 4,72                   | var(--red-text) = #ff6b6b | 4,55 |
| contrast | --attr-int  | #3b82f6               | 3,44       | 5,13                   | #619af8     | 4,50            |
| contrast | --attr-wis  | #aa58f7               | 3,28       | 4,90                   | #bd7ef9     | 4,52            |
| contrast | --attr-cha  | #ec4899               | 3,58       | 5,35                   | #f06dae     | 4,51            |

Die übrigen vier Zellen (`--attr-dex` 5,54 · `--attr-con` 5,88 in beiden Themes) halten auch auf
`--bg-hover`. Light und Sepia sind bereits abgedunkelt und halten dort 4,54–4,61 — dort erlaubt
D-5 das Abdunkeln ausdrücklich, und es ist geschehen (Commit `dab02ff`).

### Die Frage an den Nutzer

D-5 noch einmal, jetzt mit den vollständigen Zahlen. Zwei Antworten sind möglich:

- **A — bleibt so.** Die vier Kürzel STR/INT/WIS/CHA fallen in Dark und Contrast beim Überfahren
  der Zeile auf 3,16–3,58:1. Lesbar, aber unter der Schwelle, die diese Welle sonst überall
  durchsetzt. Die Ausnahmeliste bleibt bestehen und dieser Punkt wird auf „bewusst akzeptiert"
  gesetzt statt gelöscht.
- **B — genauso knapp anheben wie `--attr-wis`.** Dieselbe Behandlung, die `--attr-wis` schon
  bekommen hat (#a855f7 → #aa58f7, 4,40 → 4,52): das Minimum an Aufhellung, das 4,5 erreicht.
  Die Vorschlagsspalte oben ist genau dieses Minimum, in HSL bei gleicher Sättigung gerechnet;
  der Farbton wandert um höchstens 0,2° (270,9° → 270,7° beim Violett), die Attribute bleiben
  also unterscheidbar wie heute — Ratsche D-6 („kleinster Nachbarabstand im Farbton sinkt nicht
  unter 30°") ist nicht berührt.

**Nebenwirkung von B, die mitentschieden werden muss:** `--attr-str` ist heute in beiden Themes
`var(--red)`, also an die Rot-Rolle gekoppelt. Der Vorschlag entkoppelt sie nicht, sondern hängt
sie an `var(--red-text)` — dasselbe, was Light und Sepia bereits tun, und der Wert existiert in
beiden Themes bereits aus Entscheidung D-3. Die Kopplung an die Rot-Rolle bleibt damit erhalten,
sie wechselt nur von der Flächen- auf die Textvariante.

### Nachrechnen

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n -- "--attr-\|--bg-hover" assets/styles/variables.css
npx jest tests/unit/design-consistency.test.js -t "vier Teilformeln"
```

Die Werte selbst stehen in `assets/styles/variables.css` (Dark ab Zeile 150, Contrast ab
Zeile 447), die Ausnahmeliste in `tests/unit/design-consistency.test.js`
(`ATTR_HOVER_AUSNAHME`). Beide Stellen sind mit der Tabelle oben durch die Ratsche verbunden.

### Was bis zur Antwort gilt

Welle 1 ändert an diesen acht Zellen nichts. Die Ausnahmeliste hält den heutigen Stand fest und
meldet jede Verschlechterung, jeden Rückfall auf den anderen beiden Flächen und den Fall, dass
eine Zelle die Schwelle inzwischen hält und der Eintrag nur noch Altlast wäre.

**Nicht verwechseln mit D-4:** Die 108 Stellen auf einer 20-%-Tönung derselben Rolle — darunter
`.dms-skill-header` (`assets/styles/dmscreen.css:1728-1732`), wo dieselben Attributfarben auf
einer Tönung sitzen — sind ein anderer, ebenfalls offener Punkt und gehören ausdrücklich in
Welle 2. Sie sind hier nicht mitgemeint.

---

## W1-C-01 — Elf vorgefundene Stellen halten 4,5 auf ihrer eigenen Fläche nicht

**Status: OFFEN — keine dieser Stellen stammt aus Welle 1, keine ist damit erledigt.**
Aufgenommen am 2026-09-28, Welle 1, Schritt 15 (Prüfbefunde W1-C, Runde 1).

### Worum es geht

Die Runde-1-Prüfung hat gezeigt, dass von den 143 Deklarationen, die Welle 1 auf
`color: var(--on-<rolle>)` umgestellt hat, genau **eine** von einer Ratsche gedeckt war. Die
Lücke ist mit R-03 (Zustandsregeln) und R-04 (Ruheregeln) in
`tests/unit/design-consistency.test.js` geschlossen. Beim Schließen sind elf Stellen aufgefallen,
die die Schwelle heute nicht halten — **alle elf sind an base `0894408a` wortgleich vorhanden**,
sind also vorgefundene Schwächen und keine erzeugten. Sie stehen namentlich in
`ZUSTAND_AUSNAHME` (R-03) bzw. `RUHE_AUSNAHME` (R-04) und sind von dort aus an diese Tabelle
gebunden.

Gerechnet mit `tests/unit/helpers/wcag-contrast.js` (Selbstprobe `#777777`/`#767676` gegen Weiß
= 4,48/4,54). „min" ist das Minimum über die vier Themes dark/light/sepia/contrast.

| Datei | Selektor | Tinte auf Fläche | min | Gruppe |
| ----- | -------- | ---------------- | --- | ------ |
| `dashboard.css` | `.wiki-link:hover` | `var(--gold)` auf `var(--purple)` | 1,29 | a |
| `spells.css` | `.editor-btn.format-active` | `var(--gold)` auf `var(--gold-dim)` | 1,39 | a |
| `dmscreen.css` | `.dms-dice-btn:hover` | `var(--bg)` auf `var(--gold)` | 2,98 | b |
| `loot.css` | `.shop-cat-badge.active` | `var(--bg)` auf `var(--gold)` | 2,98 | b |
| `loot.css` | `.shop-sort-btn.active` | `var(--bg)` auf `var(--gold)` | 2,98 | b |
| `party.css` | `.cf-combat-value select option:hover, .cf-combat-value select option:checked` | `var(--bg)` auf `var(--gold)` | 2,98 | b |
| `dashboard.css` | `.qref-dmg.psychic` | `white` auf `var(--dmg-psychic)` | 3,53 | c |
| `dashboard.css` | `.qref-dmg.cold` | `white` auf `var(--dmg-cold)` | 3,68 | c |
| `dashboard.css` | `.qref-dmg.fire` | `white` auf `var(--dmg-fire)` | 3,76 | c |
| `dashboard.css` | `.qref-dmg.thunder` | `white` auf `var(--dmg-thunder)` | 4,23 | c |
| `encounters.css` | `.calc-action-btn.primary:hover` | `var(--on-green)` auf `var(--green-hover)` | 4,31 | d |

### Die vier Gruppen, und warum sie nicht in Welle 1 gehören

**(a) Akzent auf Akzent — 2 Stellen.** Tinte UND Fläche sind eine Farbrolle. Das ist keine
Tintenfrage, sondern eine Gestaltungsfrage: welche Fläche soll der Knopf überhaupt haben? Bei
`.editor-btn.format-active` sitzt Gold auf dem eigenen gedimmten Gold (1,39) — der aktive Zustand
ist damit praktisch nicht lesbar. Gehört in die Welle, die die jeweilige Rolle anfasst.

**(b) `var(--bg)` auf `var(--gold)` — 4 Stellen.** Dies ist **dieselbe Fehlerart, die Welle 1
sonst überall behoben hat**, und sie ist nur deshalb stehengeblieben, weil die Bestandsaufnahme
auf `var(--bg-dark)` suchte: `--bg` ist ein Alias darauf (`assets/styles/variables.css:486`).
Mechanisch zu beheben (`var(--on-gold)`, dann 8,98 / 5,80 / 7,10 / 13,46), aber außerhalb des
Auftrags dieser Runde — hier geführt, damit die nächste Welle sie nicht erneut übersieht.

**(c) Weiße Schrift auf der Schadensartenskala — 4 Stellen.** Die Begründung steht seit Welle 1
ausführlich in `assets/styles/dashboard.css` über `.qref-dmg`: die Skala muss als GANZES neu
gerechnet werden (13 Typen, sonst verschiebt sich ihre Ordnung). `--dmg-physical` hält mit Weiß
bereits 5,17 und steht deshalb nicht in der Tabelle.

**(d) `.calc-action-btn.primary:hover` — 1 Stelle.** Die einzige der elf, die Welle 1 angefasst
hat, und sie ist dabei **besser** geworden: vorher (mit `var(--bg-dark)`)
8,06 · 4,02 · 3,41 · 10,93, also min 3,41; jetzt 7,83 · 4,31 · 4,40 · 9,82, also min 4,31. Jedes
Theme unter der Schwelle liegt höher als zuvor. Sie ganz auf 4,5 zu bringen ginge mit einem neuen
`--on-green-hover` (`#000000` erreicht min 4,79) — das ist eine Farbentscheidung und gehört
entschieden, nicht nebenbei getan.

### Nachrechnen

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
npx jest tests/unit/design-consistency.test.js -t "R-03"
npx jest tests/unit/design-consistency.test.js -t "R-04"
git show 0894408a:assets/styles/loot.css | grep -A3 "shop-cat-badge.active"
```

### Was bis zur Entscheidung gilt

Welle 1 ändert an diesen elf Stellen nichts. Die beiden Ausnahmelisten halten den gemessenen
Stand fest und melden jede Verschlechterung, jeden Eintrag, dessen Stelle es nicht mehr gibt, und
jeden Eintrag, dessen Stelle die Schwelle inzwischen hält.

---

## W1-C-02 — Fünf JS-Inlinestellen setzen Tinte auf eine volle Rollenfläche und fehlen in der Bestandsaufnahme

**Status: OFFEN — nicht erledigt und nicht zurückgestellt, sondern bis zum 2026-09-28 nicht
gesehen.** Aufgenommen am 2026-09-28, Welle 1, Schritt 15 (Prüfbefund W1-C, Runde 1, major).

### Worum es geht

Die Bestandsaufnahme der Welle zählt ausschließlich `assets/styles`. JS wird nur für
`features/locations/locations-render.js:153` geführt (Entscheidung D-7, Schritt 13). Fünf weitere
Stellen setzen im `style`-Attribut genau dieselbe Kombination, die Welle 1 im CSS überall ersetzt
hat — eine volle Rollenfläche mit `color: var(--bg-dark)`:

```bash
grep -rnoE "style=\"[^\"]*\"" --include=*.js core features systems ui render utils \
  | grep -E "color: ?var\(--bg-dark\)" | grep background
```

| Datei | Zeile | Fläche | gemessen (dark light sepia contrast) |
| ----- | ----- | ------ | ------------------------------------ |
| `features/quests/quests-render.js` | 77 | `var(--gold)` | 9,24 · 2,98 · 5,65 · 14,97 |
| `systems/entity-links.js` | 317 | `var(--blue)` | 7,64 · 4,74 · 2,93 · 5,53 |
| `systems/entity-links.js` | 318 | `var(--purple)` | Soll `var(--on-purple)` |
| `systems/entity-links.js` | 287 | `statusColors[status]`: `--yellow` / `--green` / `--cyan` / `--red` | Gelb 11,64 · 2,69 · 2,55 · 19,56; Cyan 9,89 · 3,38 · 2,51 · 16,75 |
| `features/initiative-loot.js` | 102 | `RARITY_COLORS[rarity]`, feste Hex-Werte | sehr selten `#facc15` 12,69 · 1,40 · 1,22 · 13,71; gewöhnlich `#4ade80` 11,15 · 1,60 · 1,39 · 12,05; legendär `#fb923c` 8,59 · 2,08 · 1,80 · 9,28 |

**Damit ist eine Aussage des Umsetzungsberichts widerlegt:** „das PWA-Banner war mit 1,27 in
Sepia die schlechteste Stelle im ganzen Baum" — die Seltenheitsmarke der Beute erreicht in Sepia
1,22 und in Light 1,40.

**Sichtbare Folge schon heute:** `.filter-chip.active` trägt in `core.css` `var(--on-gold)`, der
inline gebaute Verfolgen-Knopf in `quests-render.js:77` daneben weiterhin `var(--bg-dark)` —
dieselbe Goldfläche, zwei verschiedene Tinten.

### Warum hier und nicht sofort behoben

Die Arbeitsregel der Welle lautet „nur in `assets/styles/*.css` arbeiten; JS nur dort, wo die
Schrittanweisung es ausdrücklich sagt", und der Prüfbefund verlangt ausdrücklich, die fünf
Stellen „in die Bestandsaufnahme aufzunehmen und der Welle zuzuordnen, die ohnehin die
JS-gesetzten Flächen anfasst". Das ist Schritt 13 (D-7).

Drei davon sind mechanisch (feste Rolle → `var(--on-<rolle>)`): `quests-render.js:77`,
`entity-links.js:317` und `:318`. `entity-links.js:287` braucht eine Abbildung
`statusColors` → `--on-<rolle>`. `initiative-loot.js:102` braucht eine **Entscheidung über
`RARITY_COLORS` als Ganzes** (`core/constants.js:265`, feste Hex-Werte ohne Themebezug) — analog
zur Schadensartenskala in W1-C-01 Gruppe c.

Die Inline-Stil-Ratsche (256) erlaubt keinen Zuwachs, steht dem aber nicht entgegen: ein
Wertwechsel in einem bestehenden `style`-Attribut fügt keinen hinzu, und sie zählt ohnehin nur
das Markup, nicht die von JS erzeugten Attribute.

### Nachrechnen

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
sed -n '77p' features/quests/quests-render.js
sed -n '285,290p;315,320p' systems/entity-links.js
sed -n '100,104p' features/initiative-loot.js
sed -n '258,272p' core/constants.js
```
