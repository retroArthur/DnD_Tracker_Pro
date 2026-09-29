# Design-Handoff v3 — offene Punkte

Was hier steht, ist **nicht erledigt und nicht stillschweigend freigegeben**. Jeder Punkt nennt
die Messung, auf der er beruht, den Befehl, mit dem sie nachvollziehbar ist, und die Frage, die
noch zu beantworten ist.

Die Einträge sind teilweise durch eine Ratsche gesichert: `tests/unit/design-consistency.test.js`
(Block R-02, Test „jede Zelle aus ATTR_HOVER_AUSNAHME ist im offenen Punkt gefuehrt") geht rot,
wenn eine hier geführte Zeile verschwindet, wenn ein Wert auseinanderläuft oder wenn eine Zeile
zur Altlast wird. Ein offener Punkt kann also nicht durch Vergessen verschwinden.

**Die 124 Zeilenanker `datei.css:ZEILE` in W1-D-01 werden ab dem 2026-09-29 nicht mehr von Hand
nachgezählt.** `R-06` prüft sie gegen die echten `color: var(--x)`-Deklarationen, und jede in
eine der 14 geführten CSS-Dateien eingefügte oder aus ihr entfernte Zeile verschiebt sie — auch
ein reiner Kommentar-Commit. Welle 2 fasst genau diese Dateien an. Das Werkzeug dazu:

```bash
node tools/sync-aktenlage-anker.js --check   # meldet Abweichungen, Exit 1
node tools/sync-aktenlage-anker.js --write   # zieht sie nach
```

Es benutzt zeichengleich dieselbe Zerlegung wie R-06 und löst zusätzlich `Selektor + Rolle →
Zeile` rückwärts auf; mehrdeutige oder verschwundene Stellen zieht es **nicht** stillschweigend
nach, sondern meldet sie. Es läuft am Ende jedes Welle-2-Schritts.

Die rgba-Literale im Komponenten-CSS bewacht seit dem 2026-09-29 die Ratsche **R-10** in
derselben Testdatei (Ausgangswert 247 Stellen außerhalb jeder Schattendeklaration, Ziel 0 plus
eine begründete Ausnahmeliste; die Liste ist bei ihrer Geburt absichtlich leer).

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

## W1-C-01 — Elf vorgefundene Stellen hielten 4,5 auf ihrer eigenen Fläche nicht; fünf sind noch offen

**Status: TEILWEISE ERLEDIGT — sechs der elf Stellen sind in Schritt 10 behoben (Welle 1, W1-D),
fünf bleiben offen.** Aufgenommen am 2026-09-28, Welle 1, Schritt 15 (Prüfbefunde W1-C, Runde 1);
fortgeschrieben am 2026-09-28, Welle 1, Schritt 10 (W1-D).

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
| `dashboard.css` | `.qref-dmg.psychic` | `white` auf `var(--dmg-psychic)` | 3,53 | c |
| `dashboard.css` | `.qref-dmg.cold` | `white` auf `var(--dmg-cold)` | 3,68 | c |
| `dashboard.css` | `.qref-dmg.fire` | `white` auf `var(--dmg-fire)` | 3,76 | c |
| `dashboard.css` | `.qref-dmg.thunder` | `white` auf `var(--dmg-thunder)` | 4,23 | c |
| `encounters.css` | `.calc-action-btn.primary:hover` | `var(--on-green)` auf `var(--green-hover)` | 4,31 | d |

### Was Schritt 10 davon erledigt hat (2026-09-28, W1-D)

Sechs Zeilen sind aus der Tabelle verschwunden, weil die Stellen behoben sind — nicht, weil sie
nachgelassen hätten. Die beiden Ausnahmelisten in `tests/unit/design-consistency.test.js` sind im
selben Zug gekürzt worden; die Ratsche verlangt das (ein Eintrag, dessen Stelle die Schwelle
inzwischen hält, wird von ihr als Altlast gemeldet).

| Datei | Selektor | vorher | jetzt | gemessen (dark light sepia contrast) |
| ----- | -------- | ------ | ----- | ------------------------------------ |
| dashboard.css | .wiki-link:hover | `var(--gold)` auf `var(--purple)` | `var(--on-purple)` | 6,94 5,70 5,05 6,02 |
| ~~spells.css~~ | ~~.editor-btn.format-active~~ | — | Regel entfernt | siehe Berichtigung |
| dmscreen.css | .dms-dice-btn:hover | `var(--bg)` auf `var(--gold)` | `var(--on-gold)` | 8,98 5,80 7,10 13,46 |
| loot.css | .shop-cat-badge.active | `var(--bg)` auf `var(--gold)` | `var(--on-gold)` | 8,98 5,80 7,10 13,46 |
| loot.css | .shop-sort-btn.active | `var(--bg)` auf `var(--gold)` | `var(--on-gold)` | 8,98 5,80 7,10 13,46 |
| party.css | .cf-combat-value select option:hover/:checked | `var(--bg)` auf `var(--gold)` | `var(--on-gold)` | 8,98 5,80 7,10 13,46 |

**Berichtigung vom 2026-09-28 (Prüfung W1-D, Runde 1).** Zwei der sechs Zeilen haben zunächst
etwas anderes behauptet, als auf dem Schirm ankam. Beide Male war die Kaskade der Grund, und beide
Male hat keine der drei Ratschen es sehen können, weil sie regelweise urteilen. Seither gibt es
dafür R-05.

- **`spells.css .editor-btn.format-active` hat nie gemalt.** Die Regel hat die Spezifität (0,2,0)
  und verliert **beide** Eigenschaften gegen `editors.css:69 .editor-toolbar
  .editor-btn.format-active` (0,3,0). `format-active` wird ausschließlich in
  `ui/editors/rich-text-toolbars.js:309` auf Knöpfen unterhalb von `[data-toolbar-for]` gesetzt,
  und jedes dieser Elemente trägt zugleich `editor-toolbar` — die 22 statischen Leisten der
  Vorlagen wie die vom Generator erzeugten. Es gab keinen Zustand, in dem sie galt. Die Regel ist
  entfernt. Was wirklich rendert, ist `var(--gold)` auf `rgba(212,175,55,0.18)`: **5,06 2,41 5,28
  7,94** — eine 18-%-Tönung derselben Rolle und damit ein Fall von D-4. Er steht jetzt in
  W1-D-02. **Die frühere Sichtprüfungsanweisung „in Sepia 1,39 → 9,89, dort ist der Unterschied
  am deutlichsten" ist gegenstandslos** — dort war und ist kein Unterschied zu sehen.
- **`loot.css .shop-cat-badge.active` war umgestellt, aber unwirksam.** Zwölf Zeilen später
  standen die sechs Kategorieregeln mit derselben Spezifität und holten `color` zurück. Jede Marke
  trägt immer beide Klassen (`features/shops/shops-core.js:427` und :438); die Voreinstellung
  jedes Ladens ist `shop-cat-badge all active`, also Gold auf Gold. Gemessen auf `var(--gold)`:
  `.all` 1,00 1,00 1,00 1,00 · `.weapon` 1,79 1,48 1,53 2,85 · `.armor` 1,21 1,59 1,93 2,71 ·
  `.item` 1,21 1,01 2,22 1,02 · `.service` 1,29 1,75 1,40 2,24 · `.misc` 1,69 1,76 1,24 1,66 —
  also **schlechter als der gestrichene Ausnahmewert 2,98**. Behoben, indem die sechs
  Kategorieregeln jetzt **vor** `.shop-cat-badge.active` stehen: keine Spezifitätserhöhung, kein
  neuer Selektor, nur Reihenfolge. Seither gelten die 8,98 5,80 7,10 13,46 der Tabelle wirklich.
  Die vier Einträge der Gruppe C in W1-D-01 beschreiben den **Ruhezustand** derselben Marken und
  sind davon unberührt.

**Gruppe (a) war entgegen der ursprünglichen Einschätzung doch eine Tintenfrage** — aber nur an
**einer** der beiden Stellen. `--purple` ist eine Rolle, für die seit Schritt 4 ein
`--on-*`-Token in allen vier Theme-Blöcken steht; die Fläche musste gar nicht angefasst werden, es
fehlte nur die Tinte. `.wiki-link:hover` war mit 1,29 die schlechteste Stelle im ganzen Baum. Die
zweite Stelle (`--gold-dim`) war gar keine Stelle, siehe Berichtigung.

**Gruppe (b) ist mechanisch behoben** — drei der vier Stellen sofort, die vierte
(`.shop-cat-badge.active`) erst mit der Umsortierung aus der Berichtigung.

### Die zwei verbliebenen Gruppen, und warum sie nicht in Welle 1 gehören

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
# Die Kaskadenprobe der Berichtigung — sie urteilt auf der Tinte, die gewinnt:
npx jest tests/unit/design-consistency.test.js -t "R-05"
git show 0894408a:assets/styles/loot.css | grep -A3 "shop-cat-badge.active"
# Die Marke trägt IMMER beide Klassen, `active` kommt nur dazu:
grep -n "shop-cat-badge" features/shops/shops-core.js
# Und `format-active` sitzt nur in Leisten, die `editor-toolbar` tragen:
grep -c 'class="editor-toolbar[^"]*" data-toolbar-for=' assets/templates/*.html
```

### Was bis zur Entscheidung gilt

Welle 1 ändert an den fünf verbliebenen Stellen nichts. Die beiden Ausnahmelisten halten den gemessenen
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

---

## W1-D-01 — 124 Akzenttext-Stellen, deren Trägerfläche Schritt 9 nicht als neutral nachweisen konnte

**Status: OFFEN — bewusst unverändert gelassen, nicht übersehen.**
Aufgenommen am 2026-09-28, Welle 1, Schritt 9.

### Worum es geht

Schritt 9 stellt `color: var(--<rolle>)` auf `color: var(--<rolle>-text)` um, **wenn** die
Trägerfläche eine der vier neutralen Theme-Flächen ist (`--bg-card`, `--bg-dark`,
`--bg-elevated`, `--bg-hover`). Für 309 der 342 in Frage kommenden Deklarationen steht die
Trägerfläche **nicht in ihrer eigenen Regel** — sie musste über den Vorfahren bestimmt werden.

Sie wurde nicht geraten, sondern gemessen: headless am gebauten Bündel wurde für jede Stelle der
nächste **deckende** Vorfahr bestimmt (alle halbdurchsichtigen Schichten zusammengesetzt), und
zwar in **Dark und Light**. Umgestellt wurde nur, wenn beide Themes auf dieselbe neutrale
Flächenmenge zeigen. 181 Stellen haben das erfüllt, 128 nicht. **Davon stehen heute noch 124
unten**; vier sind erledigt worden — zwei in Schritt 11, zwei im Nachtrag der Prüfrunde W1-E
(siehe beide Vorbemerkungen zu Gruppe B).

Der Grund für die Strenge ist gemessen und nicht vorsichtshalber: die `-text`-Werte sind für
**helle** Flächen gerechnet. Auf der Dialogfläche sind sie **schlechter** als die Rolle selbst.
An `party.css` `.cf-skill-exp-label` hat W1-C das beziffert: 3,23 → 2,68 in Light. Eine falsch
geratene Trägerfläche ist schlimmer als eine unveränderte Stelle.

### Der Strukturbefund dahinter, der weit über diesen Punkt hinausreicht

`.modal { background: rgba(26, 26, 26, 0.95) }` (`assets/styles/dmscreen.css:701`) ist die
**einzige** Hintergrundregel für Dialoge im ganzen Baum, und sie ist ein rgba-Literal. Über
`.modal-overlay` (`rgba(0,0,0,0.6)`) über der Seitenfläche ergibt das gemessen #191919 (Dark) und
#1e1e1e (Light) — **jeder Dialog ist in allen vier Themes nahezu schwarz und folgt keinem Theme.**
Gruppe A unten ist die Liste der Akzenttexte, die deshalb nicht umgestellt werden konnten; Gruppe
D sind Selektoren, die in einer Karte UND in einem Dialog vorkommen und deshalb gar keine
einheitliche Tinte haben können, solange die Dialogfläche nicht am Theme hängt.

Solange dieser Befund steht, ist jede Aussage der Form „Trägerfläche `--bg-card` → `-text`" für
alles falsch, was in einem Dialog gerendert wird. Das gehört entschieden, bevor eine weitere
Welle Farben in Dialogen anfasst.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
# Die verbliebenen Stellen als Kategorie (Summe 124 + 4 bei der Geburt der Liste;
# seit Schritt 11 und der Prüfrunde W1-E sind vier davon erledigt, die Summe ist
# also um vier kleiner):
node <scratch>/classify.js | grep -E "^ *[0-9]+  ROLE \|"
# Die Dialogfläche selbst:
grep -n "^\.modal {" -A4 assets/styles/dmscreen.css
grep -rn "modal-overlay" assets/styles/*.css | head -3
# Die Zeilenanker gegen den HEAD-Stand (seit 2026-09-28 eine Ratsche):
npx jest tests/unit/design-consistency.test.js -t "R-06"
```

**Die Zeilenanker sind seit dem 2026-09-28 bewacht.** In der Fassung vom selben Tag zeigten 34 der
128 auf `font-weight`, auf eine Leerzeile oder auf eine schließende Klammer — sie waren vor den
Kommentareinfügungen desselben Commits erzeugt und nicht nachgezogen worden. Das ist genau die
Fehlerart, wegen der die Auftragslage die Anker des Handoffs v3 für unbrauchbar erklärt hat. R-06
in `tests/unit/design-consistency.test.js` prüft jetzt jede geführte Zeile gegen die Datei: sie
muss dort eine `color: var(--…)`-Deklaration im genannten Selektor mit der genannten Rolle
treffen. **Wer eine dieser CSS-Dateien anfasst, zieht die Tabelle im selben Commit nach** — sonst
ist die Ratsche rot. Ihre Plausibilitätsprobe nennt die Zahl der geführten Stellen; sie darf nur
sinken, und nur zusammen mit einer erledigten Stelle (128 bei der Geburt, 126 seit Schritt 11,
124 seit der Prüfrunde W1-E).

Die Messung selbst: `<scratch>/measure5.js` (Playwright, gebautes Bündel, 24 Ansichten + 30
Dialoge, zwei Themes) und `<scratch>/decide.js` (Urteil je Stelle plus Geschwisterbindung).

### Was bis zur Entscheidung gilt

Diese 124 Stellen bleiben auf `color: var(--<rolle>)`. In Light und Sepia liegen sie damit
weiterhin bei 2,16–4,20 gegen eine neutrale Fläche — falls ihre Fläche neutral ist, was für
Gruppe E gerade nicht bewiesen ist. Sie sind **kein** erledigter Fall.

### Die fünf Gruppen

### Gruppe A — Dialogflaeche, 16 Stellen

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `bestiary.css:483` | `.bst-section-title` | `--gold` | #191919 | #1e1e1e |
| `bestiary.css:496` | `.bst-validation-error` | `--red` | #191919 | #1e1e1e |
| `core.css:1043` | `.char-modal-title h2` | `--gold` | #191919 | #1e1e1e |
| `core.css:1048` | `.char-modal-subtitle` | `--cyan` | #191919 | #1e1e1e |
| `dashboard.css:240` | `.modal-title` | `--gold` | #191919 | #1e1e1e · #252525 |
| `initiative.css:461` | `.aoe-modal-header h3` | `--red` | #191919 | #1e1e1e |
| `initiative.css:601` | `.aoe-target-save` | `--green` | #191919 | #1e1e1e |
| `initiative.css:618` | `.aoe-target-damage.full` | `--red` | #191919 | #1e1e1e |
| `initiative.css:622` | `.aoe-target-damage.half` | `--yellow` | #191919 | #1e1e1e |
| `party.css:2018` | `.rest-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `party.css:2289` | `.condition-ref-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:474` | `.rt-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:601` | `.rt-dice-label` | `--gold` | #191919 | #1e1e1e |
| `tools.css:676` | `.generator-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:803` | `.ld-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:836` | `.ld-gold-label` | `--gold` | #191919 | #1e1e1e |

### Gruppe B — Verlauf als Traeger, 11 Stellen

**Zwei Einträge dieser Gruppe sind seit dem 2026-09-28 erledigt und deshalb aus der Tabelle
entfernt** (Welle 1, Schritt 11): `bestiary.css` `.bestiary-statblock-name` und
`.bestiary-statblock-section-heading`, beide `--red`. Ihr „Verlauf" war kein Theme-Verlauf,
sondern die **themenunabhängige** Pergamentpalette (`--ra-parchment-from` #f5e6c8 →
`--ra-parchment-to` #e8d4a8) — sie konnten deshalb gar nie eine `-text`-Rolle bekommen. Sie tragen
jetzt `var(--parchment-ink-red)` #58180d, gemessen 10,98 und 9,29 gegen die beiden Verlaufsenden,
in allen vier Themes identisch (vorher 2,58–3,92). Bewacht von **R-07** in
`tests/unit/design-consistency.test.js`. Die Zahl der geführten Stellen sinkt damit von 128 auf
126; die Plausibilitätsprobe in R-06 ist im selben Commit nachgezogen.

**Zwei weitere Einträge sind seit dem 2026-09-28 erledigt und ebenfalls aus der Tabelle
entfernt** (Prüfrunde W1-E): `bestiary.css` `.bestiary-dice` (`--cyan`) und
`.bestiary-dice:hover` (`--gold`).

> **Berichtigung, Prüfrunde W1-E Runde 2.** Die erste Fassung dieser Vorbemerkung hat die
> Trägerangabe der beiden Zeilen für „schlicht falsch" erklärt. Das war sie **nicht**. Geführt
> war „`--bg-dark` · GRAD:#0d0d0d · GRAD:#1a1a1a" bzw. „`--bg-dark` · GRAD:#f5f5f5 ·
> GRAD:#ffffff", und diese Werte lösen Zeichen für Zeichen auf `--bg-dark`, `--bg` und
> `--bg-card` auf — die App-Flächen einer **zweiten, realen Verwendungsstelle derselben
> Klasse**: `features/party/party-details.js:215-216` erzeugt die klickbaren Treffer- und
> Schadenswürfel im Charakter-Detail mit `class="bestiary-dice"`, verpackt in
> `.char-attack-entry`. Die Zeilen waren also nicht falsch, sondern **unvollständig**: sie
> beschrieben die Nicht-Pergament-Verwendung, und die Pergament-Verwendung fehlte in der Akte.
> Mit der Streichung verschwand zugleich der einzige schriftliche Hinweis darauf, dass es die
> zweite Stelle überhaupt gibt — unmittelbar bevor genau sie kaputtging (Hover-Kontrast 6,01 →
> 1,69 in dark und contrast, siehe unten). Die Streichung war damit zum Zeitpunkt des Commits
> **verfrüht**, nicht unberechtigt.

Für die Pergament-Verwendung gilt unverändert: die Würfelspans liegen INNERHALB des
Pergaments — `renderClickableDice()` (`bestiary-render.js:41`) setzt sie über
`renderTraitList()` (:240, :249) in Merkmale und Aktionen, und `renderStatblockHTML()` (:300)
verpackt beides in `bestiary-statblock read-aloud parchment`. Gemessen je Theme Ruhe / Hover,
beide Verlaufsenden: dark 1,59/1,35 und 1,71/1,44 · light 2,99/2,53 und 2,64/2,23 · sepia
2,56/2,17 und 5,76/4,87 · contrast 1,02/1,16 und 1,14/1,04 — der schlechteste Wert des ganzen
Kastens, schlechter als die 2,58–3,92, die Schritt 11 behoben hat. Sie tragen jetzt
`var(--parchment-ink-link)` #105f6b (5,93 / 5,02) und `var(--parchment-ink-link-hover)`
#7a4a00 (6,07 / 5,13), beide themenunabhängig und von **R-07** bewacht, dessen Suchmuster
`.bestiary-dice` bis dahin nicht kannte.

Seit Runde 2 tragen die beiden Regeln den Präfix `.bestiary-statblock` und gelten damit nur
noch dort, wo auch Pergament liegt. Die Nicht-Pergament-Verwendung erbt seitdem wieder
`--gold-text` aus `party.css:2854` und hält in beiden Zuständen: Ruhe auf `--bg` dark 9,24 ·
light 5,71 · sepia 5,65 · contrast 14,97; Hover auf `--bg-hover` dark 6,01 · light 4,59 ·
sepia 5,16 · contrast 9,01. **Sie wird deshalb NICHT als eigene Zeile hier aufgenommen** — sie
hält 4,5 in allen vier Themes, und ihre Träger sind flache Tokens, keine Verläufe; in eine
Akte offener Punkte gehört sie nicht. Bewacht wird sie stattdessen als benannter Zustand
„Angriffswürfel im Charakter-Detail, Mauszeiger darauf" in **R-05**, der dafür um
Pseudoklassen erweitert wurde.

Die Zahl der geführten Stellen sinkt damit von 126 auf 124 — diese Zahl ist **erst seit der
Behebung in Runde 2** gedeckt, davor war sie es für eine der beiden Zeilen nicht.

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `dmscreen.css:553` | `.session-arc-title` | `--gold` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `dmscreen.css:1081` | `.drag-handle:hover` | `--gold` | --bg-card · GRAD:#0d0d0d | --bg-card · GRAD:#f5f5f5 |
| `initiative.css:139` | `.init-value` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:171` | `.init-name:hover` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:199` | `.init-hp-value.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:200` | `.init-hp-value.bloodied` | `--yellow` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:1111` | `.init-mob-alive.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:1112` | `.init-mob-alive.bloodied` | `--yellow` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `spells.css:79` | `.spell-info-line.classes` | `--cyan` | GRAD:#1a1a1a | GRAD:#ffffff |
| `spells.css:80` | `.spell-info-line.school` | `--purple` | GRAD:#1a1a1a | GRAD:#ffffff |
| `tools.css:851` | `.ld-split-amount` | `--gold` | GRAD:#191919 | GRAD:#1e1e1e |

### Gruppe C — Akzent- oder Toenungsflaeche, 10 Stellen

Die vier `.shop-cat-badge.*`-Zeilen dieser Gruppe beschreiben den **Ruhezustand** der Ladenmarken
(Kategoriefarbe auf `--bg-card` bzw. auf der Goldfläche der aktiven Marke). Ihr **aktiver**
Zustand war ein eigener Befund und ist behoben — siehe die Berichtigung unter W1-C-01: bis zum
2026-09-28 gewannen genau diese vier Regeln die Tinte auch dann, wenn `.active` daneben stand, und
druckten die Voreinstellung jedes Ladens auf 1,00. Seit die Kategorieregeln **vor**
`.shop-cat-badge.active` stehen, betreffen sie nur noch den Ruhezustand — also genau das, was
diese Tabelle führt.

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `dashboard.css:192` | `.campaign-name` | `--cyan` | #1f2e24 | #edfcf2 |
| `dmscreen.css:1296` | `.dms-init-marker` | `--gold` | #3c331b | #fef5de |
| `dmscreen.css:1309` | `.dms-init-value` | `--cyan` | #3c331b | #fef5de |
| `loot.css:295` | `.shop-cat-badge.weapon` | `--red` | --bg-card | --bg-card |
| `loot.css:296` | `.shop-cat-badge.armor` | `--blue` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:298` | `.shop-cat-badge.service` | `--purple` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:300` | `.shop-cat-badge.all` | `--gold` | #d4af37 | #b8860b |
| `party.css:796` | `.wiki-tree-item.pinned` | `--gold` | --bg-card · #2f233b | --bg-card · #f2e6fe |
| `tools.css:586` | `.rt-dice-btn:hover` | `--gold` | --bg-dark · #d4af37 | --bg-dark · #b8860b |
| `tools.css:629` | `.rt-hint-warn` | `--orange` | #2f2618 | #332a1c |

### Gruppe D — zwei verschiedene Traeger fuer denselben Selektor, 5 Stellen

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `dashboard.css:505` | `.char-section-title` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `dice.css:602` | `.fdp-title` | `--gold` | --bg-card | #1e1e1e |
| `dmscreen.css:999` | `.form-group label` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `party.css:2620` | `.char-adv-btn.adv` | `--green` | --bg-dark · #191919 | --bg-dark · #1e1e1e |
| `party.css:2621` | `.char-adv-btn.dis` | `--red` | --bg-dark · #191919 | --bg-dark · #1e1e1e |

### Gruppe E — in keinem erreichbaren Zustand gerendert, 82 Stellen

```
bestiary.css
  142  .bestiary-fav.active
core.css
   17  [data-layout="mobile"] .mobile-nav-toggle-text
   75  [data-layout="mobile"] #mobile-timer-display
   79  [data-layout="mobile"] .mobile-timer.running #mobile-timer-display
   83  [data-layout="mobile"] .mobile-timer.paused #mobile-timer-display
  939  .char-card-currency
 1715  .quest-reward-item-tag .remove-btn:hover
 1708  .quest-reward-item-tag .remove-btn
dashboard.css
    3  .dice-btn.d4
    5  .dice-btn.d6
    7  .dice-btn.d8
    9  .dice-btn.d10
   11  .dice-btn.d12
   13  .dice-btn.d20
   15  .dice-btn.d100
   17  .dice-btn.coin
   59  .dice-result-main
   64  .dice-result-hit
   65  .dice-result-miss
   66  .dice-crit
   67  .dice-fail
   88  .dice-skill-btn:hover
  422  .char-save-box.proficient .save-label
  466  .enc-save-box.active .enc-save-label
  655  .icon-btn.danger:hover
  656  .icon-btn.success:hover
 1082  .dash-timer-time
 1346  .qref-chip.danger
dice.css
  349  .dice-fav-item:hover .fav-del
dmscreen.css
   86  .dice-fav-btn .fav-name
  247  .condition-tooltip-title
  355  .notes-search-date
  477  .session-tag-remove:hover
  623  .quick-ref-section-title
 1201  .dms-stat-warning .dms-stat-value
 2259  .dms-profile-check
 2285  .dms-profile-save
 2289  .dms-profile-save .dms-profile-name
encounters.css
   34  .list-view-row.expanded .row-toggle
   47  .list-dialog-item.used .list-dialog-status
  298  .calc-list-remove:hover
  343  .calc-diff-xp
  375  .calc-threshold-label.easy
  376  .calc-threshold-label.medium
  377  .calc-threshold-label.hard
  378  .calc-threshold-label.deadly
  449  .calc-stat-info:hover
  475  .calc-preview-xp
  480  .calc-preview-change
  646  .calc-fav-item.save
 1146  .enc-speed-line
file-backup.css
  156  .backup-entry-restore
initiative.css
   66  .bf-xp
   98  .init-entry.lair .init-name
  201  .init-hp-value.critical
  271  .death-saves-label
  423  .concentration-check-banner .conc-dc
 1004  .la-label
 1045  .lr-label
 1113  .init-mob-alive.critical
loot.css
  297  .shop-cat-badge.item
  475  .si-tag-v
  623  .cart-shop-name
  690  .cart-item-total
npcs.css
  236  .npc-detail-location
  879  .npc-name
  960  .npc-popup-name
  993  .npc-popup-section-title
party.css
 1926  .party-stat-card.critical .party-stat-value
 2193  .rest-heal-preview
 2199  .rest-hd-restore
 2575  .cf-attack-remove:hover
 2724  .char-skill-item.proficient .char-skill-item-name
 2747  .char-skill-item.expertise .char-skill-item-name
spells.css
  135  .spell-material
tools.css
  261  .timer-card-time
  455  .rt-result-label
 1113  .breadcrumb-item:hover
 1412  .sb-remove-btn:hover
welt.css
   61  .wp-session-nr
  272  .wp-detail-header h3
  570  .rs-tagesmarsch
```

### Wie Gruppe E aufzulösen ist

Nicht durch Raten, sondern durch mehr Zustand: die 82 Stellen sind Elemente, die im geseedeten
Zustand nirgends gerendert werden (Würfelergebnisse vor dem ersten Wurf, der
Begegnungs-Rechner, Warenkorb, NPC-Aufklapper, das mobile Layout, Rastdialog-Details). Wer den
Messlauf um die fehlenden Zustände erweitert, bekommt für jede dieser Stellen dieselbe Antwort
wie für die 181 umgestellten. Der Messaufbau liegt bei und ist wiederverwendbar.

---

## W1-D-02 — Fünf Tönungsstellen, die Schritt 10 einzeln nachgerechnet hat, plus eine Vorziehung

**Status: OFFEN — gehört nach Entscheidung D-4 geschlossen in Welle 2.**
Aufgenommen am 2026-09-28, Welle 1, Schritt 10; fortgeschrieben am 2026-09-28 nach der Prüfung
W1-D, Runde 1 (eine Stelle kam dazu, eine Vorziehung wurde ausgewiesen).

### Worum es geht

Schritt 10 nennt vier Einzelfälle, die auf einer Tönung sitzen. Alle vier bleiben nach D-4
unverändert, aber sie sind jetzt **beziffert**, und die Zahlen sagen etwas, das die Planung nicht
vorwegnehmen konnte: **an drei von ihnen reicht auch das neue `-text`-Token nicht.** Die Tönung
selbst ist zu stark. Welle 2 muss dort Tönungsstärke UND Tinte zusammen entscheiden — genau die
Begründung, mit der D-4 die Trennung gezogen hat.

„min" ist das Minimum über die vier neutralen Flächen, auf denen die Tönung liegen kann.

| Stelle | Selektor | Tönung | heute `var(--<rolle>)` min | mit `var(--<rolle>-text)` min |
| ------ | -------- | ------ | -------------------------- | ----------------------------- |
| `dice.css:371` | `.dice-fav-add:hover` | `color-mix(--gold 10%)` | dark 5,00 · light 2,20 · sepia 4,51 · contrast 7,10 | light **4,21** — weiter darunter |
| `tools.css:1698` | `.ds-rate-chip.ds-crit` | `color-mix(--green 15%)` | dark 5,26 · light 2,11 · sepia 2,07 · contrast 6,53 | light **3,92** · sepia **4,08** |
| `tools.css:1714` | `.ds-rate-chip.ds-fumble` | `color-mix(--red 15%)` | dark 2,92 · light 2,89 · sepia 2,78 · contrast 3,02 | dark **3,93** · light **3,69** · sepia **3,82** · contrast **4,35** |
| `dashboard.css:250` | `.wiki-link` (Ruhezustand) | `rgba(168,85,247,0.1)`, FREMDE Rolle unter Cyan-Text | dark 5,84 · light 2,44 · sepia 2,08 · contrast 9,15 | — |
| `editors.css:69` + `:75` | `.editor-toolbar .editor-btn.format-active` und `[aria-expanded='true']` | `rgba(212,175,55,0.18)` über `var(--bg-elevated)` | dark 5,06 · light **2,41** · sepia 5,28 · contrast 7,94 | light 4,62 — **reicht** |

`.ds-rate-chip.ds-fumble` hält in **keinem** Theme 4,5, auch nicht mit der Textvariante. Die
Tönung muss dort schwächer werden oder die Fläche eine andere Rolle bekommen.

**Mechanikwechsel am 2026-09-29 (Welle 2, Schritt 2), inhaltlich folgenlos.** Die beiden
`.ds-rate-chip`-Flächen kamen aus den rgba()-Kanal-Tokens, die es seitdem nicht mehr gibt; sie
stehen jetzt als `color-mix`. Der Wechsel ist **farbneutral** — die Tripel der Kanäle waren
zeichengleich das Hex ihrer Rolle —, und alle acht Zahlen der beiden Zeilen sind nach dem
Wechsel erneut gemessen und **unverändert**. Die offene Frage bleibt die Tönungsstärke, nicht die
Schreibweise. Neu in dieser Liste steht damit nichts; neu ist nur, dass die Tönung jetzt für den
Kontrastrechner auflösbar ist (`rgba(var(--x-rgb), a)` war ihm unsichtbar und lieferte `null`).

**`editors.css:69`/`:75` kam am 2026-09-28 durch die Prüfung W1-D dazu** und ist der einzige
Eintrag dieser Tabelle, an dem die Textvariante allein genügen würde (light 2,41 → 4,62). Die
Stelle ist nachgetragen, weil Schritt 10 sie für erledigt hielt: die dort korrigierte Regel stand
in `spells.css` und hat nie gemalt (Spezifität 0,2,0 gegen 0,3,0 — siehe Berichtigung unter
W1-C-01). Die Trägerfläche ist **bewiesen, nicht geschätzt**: `editors.css:15 .editor-toolbar`
setzt `background: var(--bg-elevated)`. `var(--on-gold)` wäre hier falsch (1,34 in Sepia) — die
Tönung ist hell, nicht voll. Bewacht von R-05 mit dem gemessenen Wert 2,41; wird der Wert besser
oder schlechter, meldet die Ratsche es.

### Vorziehung: eine Stelle dieser Bauart ist in Welle 1 schon umgestellt

`loot.css` `.loot-tag-chip input:checked + span` trägt seit Schritt 9 `var(--gold-text)` statt
`var(--gold)`. Die Stelle gehört der Bauart nach hierher: sie gilt nur bei angekreuztem Kästchen,
und genau dann setzt die Elternregel `.loot-tag-chip:has(input:checked)` eine 20-%-Tönung
**derselben** Rolle. Sie ist Schritt 9 durchgerutscht, weil die Kontrollzahl `ROLE | rgba` nur
innerhalb **einer** Regel zählt und eine Tönung in der Elternregel nicht sieht.

Zurückgedreht wird sie nicht, weil die Zahlen besser werden — gemessen über `--bg-card`:
`var(--gold)` 5,55 2,83 5,81 9,23 → `var(--gold-text)` 5,55 **5,41** 5,81 9,23. Sie steht hier,
damit **Welle 2 sie nicht ein zweites Mal anfasst**: die Tintenfrage ist entschieden, offen bleibt
nur, ob die 20-%-Tönung selbst bleibt. Der Hinweis steht wortgleich an der Stelle im CSS.

`.wiki-link` ist der einzige Fall im Baum, bei dem die Tönung von einer **anderen** Rolle stammt
als der Text (Violett-Tönung, Cyan-Schrift). Der Hover-Zustand derselben Regel ist in Schritt 10
behoben worden (siehe W1-C-01), die Ruhefläche nicht — sie ist eine Tönung.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
sed -n '368,373p' assets/styles/dice.css
sed -n '1696,1710p' assets/styles/tools.css
sed -n '249,262p' assets/styles/dashboard.css
# Die zwei Nachträge vom 2026-09-28:
sed -n '15,23p;66,80p' assets/styles/editors.css
grep -n "loot-tag-chip" -A4 assets/styles/loot.css | head -40
npx jest tests/unit/design-consistency.test.js -t "R-05"
```

---

## W1-D-03 — `.npc-dialog-marker.used`: keine Tinte hilft, die Ursache ist `opacity: 0.6`

**Status: OFFEN — Gestaltungsentscheidung, keine Farbentscheidung.**
Aufgenommen am 2026-09-28, Welle 1, Schritt 10 (Fall 6).

### Worum es geht

`assets/styles/npcs.css` `.npc-dialog-marker.used` setzt `background: var(--text-dim)`,
`color: var(--bg-dark)` und `opacity: 0.6`. Die Deckkraft wirkt auf Fläche UND Schrift, mischt
also beide gegen den Träger und drückt den Abstand zwischen ihnen zusammen. Schritt 10 hat vier
Tinten durchgerechnet (Minimum über die vier neutralen Träger):

| Theme | `var(--bg-dark)` | `#000000` | `var(--bg-card)` | `white` |
| ----- | ---------------- | --------- | ---------------- | ------- |
| dark | 2,69 | 2,82 | 2,53 | 2,56 |
| light | 2,40 | 2,28 | 2,52 | 2,52 |
| sepia | 2,22 | 2,32 | 2,43 | 2,53 |
| contrast | 3,66 | 3,66 | 3,45 | 1,91 |

**Keine Tinte erreicht 4,5, in keinem Theme.** Ohne die Deckkraft hielte die heutige Tinte
5,48 · 5,27 · 4,57 · 9,04 — dieselbe Regel ohne `opacity` steht als `.npc-dialog-status.used`
zwölf Zeilen weiter unten im Baum und hält überall. Die Stelle bleibt deshalb unverändert: die
Deckkraft zu entfernen ist eine Gestaltungsänderung (Arbeitsregel 1), und eine Tinte zu wechseln,
die das Problem nicht löst, wäre Kosmetik.

Dieselbe Ursache, an zwei weiteren Stellen schon von W1-C vermerkt: `party.css:2449`
`.cf-skill-exp-label` (`opacity: 0.8`) und `npcs.css` `.npc-dialog-marker.used`. Eine Welle, die
`opacity` auf Textelementen als Ganzes anfasst, erledigt alle drei zusammen.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "npc-dialog-marker.used" -A14 assets/styles/npcs.css
grep -rn "opacity: 0\.[0-9]" assets/styles/*.css | wc -l
```
