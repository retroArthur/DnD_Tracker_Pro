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
  entfernt. Was wirklich rendert, ist `var(--gold)` auf einer 18-%-Tönung derselben Rolle und
  damit ein Fall von D-4. Er steht jetzt in W1-D-02. Die Zahlen **5,06 2,41 5,28 7,94** galten
  für die Tönung als festes Dark-Gold; seit Welle 2 Schritt 6 steht dort `color-mix(in srgb,
  var(--gold) 18%, transparent)` und die Messung lautet **5,06 2,25 4,47 7,09**. **Die frühere Sichtprüfungsanweisung „in Sepia 1,39 → 9,89, dort ist der Unterschied
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
| `bestiary.css:493` | `.bst-section-title` | `--gold` | #191919 | #1e1e1e |
| `bestiary.css:506` | `.bst-validation-error` | `--red` | #191919 | #1e1e1e |
| `core.css:1067` | `.char-modal-title h2` | `--gold` | #191919 | #1e1e1e |
| `core.css:1072` | `.char-modal-subtitle` | `--cyan` | #191919 | #1e1e1e |
| `dashboard.css:240` | `.modal-title` | `--gold` | #191919 | #1e1e1e · #252525 |
| `initiative.css:500` | `.aoe-modal-header h3` | `--red` | #191919 | #1e1e1e |
| `initiative.css:640` | `.aoe-target-save` | `--green` | #191919 | #1e1e1e |
| `initiative.css:657` | `.aoe-target-damage.full` | `--red` | #191919 | #1e1e1e |
| `initiative.css:661` | `.aoe-target-damage.half` | `--yellow` | #191919 | #1e1e1e |
| `party.css:2053` | `.rest-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `party.css:2324` | `.condition-ref-header h3` | `--gold` | #191919 | #1e1e1e |
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
| `dmscreen.css:572` | `.session-arc-title` | `--gold` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `dmscreen.css:1122` | `.drag-handle:hover` | `--gold` | --bg-card · GRAD:#0d0d0d | --bg-card · GRAD:#f5f5f5 |
| `initiative.css:145` | `.init-value` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:177` | `.init-name:hover` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:205` | `.init-hp-value.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:206` | `.init-hp-value.bloodied` | `--yellow` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:1157` | `.init-mob-alive.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:1158` | `.init-mob-alive.bloodied` | `--yellow` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `spells.css:92` | `.spell-info-line.classes` | `--cyan` | GRAD:#1a1a1a | GRAD:#ffffff |
| `spells.css:93` | `.spell-info-line.school` | `--purple` | GRAD:#1a1a1a | GRAD:#ffffff |
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
| `dmscreen.css:1340` | `.dms-init-marker` | `--gold` | #3c331b | #fef5de |
| `dmscreen.css:1353` | `.dms-init-value` | `--cyan` | #3c331b | #fef5de |
| `loot.css:295` | `.shop-cat-badge.weapon` | `--red` | --bg-card | --bg-card |
| `loot.css:296` | `.shop-cat-badge.armor` | `--blue` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:298` | `.shop-cat-badge.service` | `--purple` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:300` | `.shop-cat-badge.all` | `--gold` | #d4af37 | #b8860b |
| `party.css:821` | `.wiki-tree-item.pinned` | `--gold` | --bg-card · #2f233b | --bg-card · #f2e6fe |
| `tools.css:586` | `.rt-dice-btn:hover` | `--gold` | --bg-dark · #d4af37 | --bg-dark · #b8860b |
| `tools.css:629` | `.rt-hint-warn` | `--orange` | #2f2618 | #332a1c |

### Gruppe D — zwei verschiedene Traeger fuer denselben Selektor, 5 Stellen

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `dashboard.css:511` | `.char-section-title` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `dice.css:633` | `.fdp-title` | `--gold-text` | --bg-card | --bg-card |
| `dmscreen.css:1040` | `.form-group label` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `party.css:2655` | `.char-adv-btn.adv` | `--green` | --bg-dark · #191919 | --bg-dark · #1e1e1e |
| `party.css:2656` | `.char-adv-btn.dis` | `--red` | --bg-dark · #191919 | --bg-dark · #1e1e1e |

`.fdp-title` ist als einzige Zeile dieser Gruppe erledigt (Welle 2, Schritt 7), bleibt aber
gefuehrt, damit die Zahl 124 nicht lautlos sinkt: der zweite Traeger `#1e1e1e` WAR das
fest verdrahtete `rgba(26,26,26,0.98)` des Wuerfel-Panels. Seit die Panelflaeche
`var(--bg-card)` folgt, gibt es nur noch EINEN Traeger, und die Tinte ist `--gold-text`
(8,28 · 6,23 · 6,58 · 13,46 statt 5,12 · 3,25 in Light auf heller Karte). Die
gleichlautende Stelle an `.modal` ist NICHT erledigt — siehe W2-C-01.

### Gruppe E — in keinem erreichbaren Zustand gerendert, 82 Stellen

```
bestiary.css
  142  .bestiary-fav.active
core.css
   17  [data-layout="mobile"] .mobile-nav-toggle-text
   75  [data-layout="mobile"] #mobile-timer-display
   79  [data-layout="mobile"] .mobile-timer.running #mobile-timer-display
   83  [data-layout="mobile"] .mobile-timer.paused #mobile-timer-display
  963  .char-card-currency
 1739  .quest-reward-item-tag .remove-btn:hover
 1732  .quest-reward-item-tag .remove-btn
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
  428  .char-save-box.proficient .save-label
  472  .enc-save-box.active .enc-save-label
  661  .icon-btn.danger:hover
  662  .icon-btn.success:hover
 1095  .dash-timer-time
 1359  .qref-chip.danger
dice.css
  349  .dice-fav-item:hover .fav-del
dmscreen.css
   86  .dice-fav-btn .fav-name
  263  .condition-tooltip-title
  374  .notes-search-date
  496  .session-tag-remove:hover
  642  .quick-ref-section-title
 1242  .dms-stat-warning .dms-stat-value
 2309  .dms-profile-check
 2335  .dms-profile-save
 2339  .dms-profile-save .dms-profile-name
encounters.css
   34  .list-view-row.expanded .row-toggle
   47  .list-dialog-item.used .list-dialog-status
  308  .calc-list-remove:hover
  375  .calc-diff-xp
  407  .calc-threshold-label.easy
  408  .calc-threshold-label.medium
  409  .calc-threshold-label.hard
  410  .calc-threshold-label.deadly
  483  .calc-stat-info:hover
  509  .calc-preview-xp
  514  .calc-preview-change
  680  .calc-fav-item.save
 1180  .enc-speed-line
file-backup.css
  156  .backup-entry-restore
initiative.css
   72  .bf-xp
  104  .init-entry.lair .init-name
  207  .init-hp-value.critical
  277  .death-saves-label
  462  .concentration-check-banner .conc-dc
 1050  .la-label
 1091  .lr-label
 1159  .init-mob-alive.critical
loot.css
  297  .shop-cat-badge.item
  475  .si-tag-v
  623  .cart-shop-name
  690  .cart-item-total
npcs.css
  236  .npc-detail-location
  888  .npc-name
  969  .npc-popup-name
 1002  .npc-popup-section-title
party.css
 1961  .party-stat-card.critical .party-stat-value
 2228  .rest-heal-preview
 2234  .rest-hd-restore
 2610  .cf-attack-remove:hover
 2759  .char-skill-item.proficient .char-skill-item-name
 2782  .char-skill-item.expertise .char-skill-item-name
spells.css
  148  .spell-material
tools.css
  261  .timer-card-time
  455  .rt-result-label
 1113  .breadcrumb-item:hover
 1412  .sb-remove-btn:hover
welt.css
   61  .wp-session-nr
  272  .wp-detail-header h3
  583  .rs-tagesmarsch
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
| `editors.css:69` + `:75` | `.editor-toolbar .editor-btn.format-active` und `[aria-expanded='true']` | `color-mix(--gold 18%)` über `var(--bg-elevated)` | dark 5,06 · light **2,25** · sepia 4,47 · contrast 7,09 | light **4,31** — reicht **nicht mehr** |

`.ds-rate-chip.ds-fumble` hält in **keinem** Theme 4,5, auch nicht mit der Textvariante. Die
Tönung muss dort schwächer werden oder die Fläche eine andere Rolle bekommen.

**Mechanikwechsel am 2026-09-29 (Welle 2, Schritt 2), inhaltlich folgenlos.** Die beiden
`.ds-rate-chip`-Flächen kamen aus den rgba()-Kanal-Tokens, die es seitdem nicht mehr gibt; sie
stehen jetzt als `color-mix`. Der Wechsel ist **farbneutral** — die Tripel der Kanäle waren
zeichengleich das Hex ihrer Rolle —, und alle acht Zahlen der beiden Zeilen sind nach dem
Wechsel erneut gemessen und **unverändert**. Die offene Frage bleibt die Tönungsstärke, nicht die
Schreibweise. Neu in dieser Liste steht damit nichts; neu ist nur, dass die Tönung jetzt für den
Kontrastrechner auflösbar ist (`rgba(var(--x-rgb), a)` war ihm unsichtbar und lieferte `null`).

**`editors.css:69`/`:75` kam am 2026-09-28 durch die Prüfung W1-D dazu** und war der einzige
Eintrag dieser Tabelle, an dem die Textvariante allein genügt hätte (light 2,41 → 4,62). Die
Stelle ist nachgetragen, weil Schritt 10 sie für erledigt hielt: die dort korrigierte Regel stand
in `spells.css` und hat nie gemalt (Spezifität 0,2,0 gegen 0,3,0 — siehe Berichtigung unter
W1-C-01). Die Trägerfläche ist **bewiesen, nicht geschätzt**: `editors.css:15 .editor-toolbar`
setzt `background: var(--bg-elevated)`. `var(--on-gold)` wäre hier falsch (1,34 in Sepia) — die
Tönung ist hell, nicht voll. Bewacht von R-05 mit dem gemessenen Wert; wird er besser oder
schlechter, meldet die Ratsche es.

**Nachtrag 2026-09-29 (Welle 2, Schritt 6) — die Textvariante genügt hier nicht mehr.** Die
Tönung war ein festes Dark-Gold und folgte damit in drei von vier Themes gar nicht dem Theme;
Schritt 6 hat sie auf `color-mix(in srgb, var(--gold) 18%, transparent)` gestellt. Die Fläche
wurde dadurch in light, sepia und contrast eine andere, und alle Zahlen dieser Zeile sind neu
gemessen (`tests/unit/helpers/wcag-contrast.js`, Tönung über `var(--bg-elevated)`):

| | dark | light | sepia | contrast |
| - | ---- | ----- | ----- | -------- |
| `var(--gold)`, vorher | 5,06 | 2,41 | 5,28 | 7,94 |
| `var(--gold)`, jetzt | 5,06 | **2,25** | 4,47 | 7,09 |
| `var(--gold-text)`, vorher | 5,06 | 4,62 | 5,28 | 7,94 |
| `var(--gold-text)`, jetzt | 5,06 | **4,31** | 4,47 | 7,09 |

Dark ist unverändert — dort **ist** das Dark-Gold das Theme-Gold. Die drei anderen verlieren
0,16 bis 0,85. Keine neue Schwelle wird gerissen (light lag mit 2,41 ohnehin weit darunter),
aber die vorgerechnete Abhilfe trägt nicht mehr: `var(--gold-text)` erreicht in light nur noch
4,31 statt 4,62. **D-4 muss für diese Stelle über die TönungsSTÄRKE entscheiden, nicht nur über
die Tinte.** Der R-05-Eintrag steht seit demselben Commit auf 2,25.

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

---

## W2-B-01 — Die Auflagen-Leiter ist themenblind geblieben; in Light und Sepia malt sie nichts

**Stand:** 2026-09-29, Welle 2 Schritt 3. Offen, bewusst vertagt.

### Worum es geht

Schritt 3 hat 16 weiße Auflagen `rgba(255,255,255,a)` und 6 schwarze Blenden `rgba(0,0,0,a)` auf
zwei Token-Leitern in `assets/styles/variables.css` gezogen — `--overlay-faint/-weak/-mid/-strong/-heavy`
und `--scrim-60/-70/-75/-85`. Beide stehen im Aliasblock und sind damit **themenblind**: in allen
vier Themes derselbe Wert. Das war die Bedingung dafür, dass der Schritt farbneutral bleibt.

§3.1 des Handoffs will etwas anderes: die Auflage soll in Light und Sepia auf Schwarz umschlagen
(`rgba(0,0,0,.04/.08/.16)`). Das ist eine **sichtbare** Änderung an 16 Flächen in zwei Themes und
steht in keiner der sechs Entscheidungen der Welle 2. Sie ist deshalb nicht ausgeführt, sondern
hier vermerkt.

### Warum der Umschlag trotzdem fällig ist — gemessen

Eine weiße Auflage auf einer hellen Fläche hebt sich nicht ab. Der Helligkeitsabstand zwischen
Fläche und Auflage (`ratio2` aus `tests/unit/helpers/wcag-contrast.js`, Fläche gegen die über ihr
gemischte Auflage):

| Fläche | Dark, weiß 5 % | Light, weiß 5 % | Sepia, weiß 5 % | Light, schwarz 5 % |
| ------ | -------------- | --------------- | --------------- | ------------------ |
| `--bg-card` | 1,14 | **1,00** | **1,00** | 1,12 |
| `--bg-dark` | 1,11 | **1,01** | **1,01** | 1,11 |
| `--bg-elevated` | 1,16 | **1,01** | **1,01** | 1,12 |
| `--bg-hover` | 1,16 | **1,02** | **1,02** | 1,11 |

Auf Light `--bg-card` (`#ffffff`) ist der Effekt **exakt** null: weiß über weiß ergibt weiß, und
zwar auch bei der stärksten Stufe (30 % → `#ffffff`, Abstand 1,00). Die Auflage existiert dort
nur im Quelltext. Ein schwarzes Gegenstück bei 5 % erreicht in Light dieselbe Größenordnung wie
das weiße in Dark (1,11 gegen 1,14) — der Umschlag ist also nicht Geschmack, sondern die einzige
Fassung, in der die Leiter in allen vier Themes dasselbe leistet.

Das war schon vor Welle 2 so: die 16 Stellen trugen dasselbe Weiß als Literal. Der Schritt hat
den Befund nicht erzeugt, er hat ihn nur benennbar gemacht.

### Was zu entscheiden ist

Der Umschlag ändert 16 Flächen in zwei Themes sichtbar. Er braucht dieselbe Vier-Themes-Runde wie
jede andere Sichtänderung dieser Welle und eine Freigabe. Die Stufen sind dann je Theme zu setzen
(§3.1 nennt für Light/Sepia `.04/.08/.16` statt `.05/.1/.2`, also nicht nur eine andere Farbe,
sondern auch eine andere Leiter).

### Zweiter, kleinerer Punkt: R-04 urteilt nicht über Tinte auf halbdurchsichtiger Auflage

`NEUTRAL` in `tests/unit/design-consistency.test.js` (Block R-04) schließt seit Schritt 3 auch
`--overlay-*` und `--scrim-*` aus. Grund: eine halbdurchsichtige Auflage **ist keine Fläche** —
was eine Tinte darauf hinter sich hat, ist die Fläche des Eltern-Elements, und die kennt die
Ratsche nicht. `resolve()` liefert für `color-mix(..., transparent)` bewusst `null`.

**Es geht dadurch keine Deckung verloren.** Dieselben sechs Regeln (`core.css .nav-tab`,
`.nav-tab:hover`, `.nav-group-btn`, `.nav-group-btn:hover`, `dashboard.css .conflict-banner .btn`,
`dice.css .fdp-close:hover`) trugen vorher ein nacktes `rgba(...)` als Hintergrund und fielen
schon am Filter `^var\((--[\w-]+)\)$` in `ruheRegeln()` heraus. Die Ratsche hat über sie nie
geurteilt. Offen bleibt die Lücke als solche: Tinte auf halbdurchsichtiger Auflage über einer
unbekannten Elternfläche wird von keiner Ratsche geprüft. Sie zu schließen hieße, die Elternkette
aufzulösen.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n -- "--overlay-\|--scrim-" assets/styles/variables.css
grep -rn "var(--overlay-\|var(--scrim-" assets/styles/*.css
```

---

## W2-B-02 — Drei Literale der SW-Update-Leiste bleiben stehen und gehören keinem Schritt

**Stand:** 2026-09-29, Welle 2 Schritte 4–6. Offen, bewusst nicht umgestellt.

### Worum es geht

Nach den Schritten 3–6 zählt **R-10** noch 52 Stellen. 49 davon sind vorgesehen: mehrdeutige und
tokenlose Tripel für Schritt 7, `core.css` `.condition-prone` für die D-4-Entscheidung in
Schritt 8, und die zwei festen Flächen des Ereignis-Logs (`party.css`) für Schritt 10.

**Die drei übrigen sind es nicht.** Sie liegen in `assets/styles/pwa.css` an der
SW-Update-Hinweis-Leiste:

| Stelle | Deklaration | Tripel |
| ------ | ----------- | ------ |
| `pwa.css` `.pwa-update-banner` | `background` | `251,191,36` = Dark `--yellow`, 85 % |
| `pwa.css` `.pwa-update-dismiss` | `border` | `13,13,13` = Dark `--bg-dark`, 40 % |
| `pwa.css` `.pwa-update-dismiss:hover` | `background` | `13,13,13` = Dark `--bg-dark`, 10 % |

Mechanisch sind alle drei eindeutige Dark-Treffer und gehörten damit in die Runde der Schritte
4–6. Sie sind trotzdem unverändert, weil die Fläche dieser Leiste **absichtlich** keinem Theme
folgt: Welle 1 Schritt 8 hat das entschieden und im Kommentar über der Regel begründet. Die Tinte
stand dort auf `var(--bg-dark)` und folgte dem Theme sehr wohl — in Sepia ergab das **1,27**, den
schlechtesten Wert des ganzen Baums. Die Abhilfe war nicht, die Fläche dem Theme zu unterwerfen,
sondern die Tinte auf `var(--on-yellow)` zu setzen (`#111111` in allen vier Themes, gemessen
8,29 · 11,97 · 11,79 · 8,11).

Wer die Fläche jetzt mechanisch auf `color-mix(… var(--yellow) 85% …)` zöge, machte sie
themenabhängig und die gesamte Welle-1-Messung ungültig — in Light würde aus dem hellen `#fbbf24`
das dunkle `#ca8a04`. Die beiden `13,13,13`-Stellen sind die dunkle Kontur auf ebendieser festen
Fläche und teilen die Begründung.

### Dieselbe Bauart an einer zweiten Stelle

`party.css` `.event-log` (zwei Flächen `15,15,25` und `20,20,30`) ist derselbe Fall: feste Fläche,
Tinte dafür gewählt. Der Unterschied ist nur, dass **E6** für das Ereignis-Log bereits
entschieden hat (dunkle Blende behalten, themenblinde Tinte-Tokens nach dem Muster `pwa.css`) und
Schritt 10 sie ausführt. Für die drei Stellen hier gibt es keine solche Entscheidung.

### Was zu entscheiden ist

Entweder bekommen die drei Literale — wie das Ereignis-Log — **themenblinde Tokens** (gleicher
Wert, andere Schreibweise, R-10 wird dadurch grün), oder sie werden als **begründete Ausnahme**
in `R10_AUSNAHMEN` eingetragen. Beides ist vertretbar; nichts von beidem darf stillschweigend
passieren, weil Schritt 7 die Ratsche auf 0 bringen soll und diese drei sonst als „vergessen"
durchgehen.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "rgba" assets/styles/pwa.css
grep -n -B18 "pwa-update-banner" assets/styles/pwa.css | grep -n "on-yellow"
npx jest tests/unit/design-consistency.test.js -t "kein rgba"
```

---

## W2-B-03 — Sechzehn Skalentoken-Stellen waren in den Schritten 4–6 nach Wert entschieden; sie sind zurückgenommen

**Stand:** 2026-09-29, Prüfrunde W2-B Runde 1. Zurückgenommen und wieder offen — die Entscheidung
gehört **Schritt 7 Punkt (3)**, nicht der mechanischen Runde.

### Worum es geht

Die Schritte 4–6 ersetzen `rgba(R,G,B,a)` durch `color-mix(in srgb, var(--rolle) N%, transparent)`.
Zugelassen ist dabei nur, was auf einem Tripel mit **genau einem** Tokennamen liegt. Dieser Filter
trennt eine **Theme-Rolle** nicht von einem **Skalentoken**:

| | Theme-Rolle | Skalentoken |
| --- | --- | --- |
| Beispiel | `--gold`, `--red`, `--blue` | `--cat-drink`, `--know-religion`, `--dmg-necrotic-text` |
| Deklariert in | vier Blöcken, vier Werte | **einem** Block, ein Wert |
| Trifft das Tripel | in einem Theme | in allen vier |

Ein Skalentoken ist damit der **eindeutigste Treffer überhaupt** — kein zweites Theme vergibt
seinen Wert noch einmal. Es rutscht zwangsläufig durch einen Filter, der es heraushalten soll.
Schritt 4 warnt davor wörtlich („Wer es hier nach Wert ersetzt, entscheidet stillschweigend eine
Bedeutungsfrage"), hatte aber kein Werkzeug, das die Warnung durchsetzt.

### Warum das nicht folgenlos war, obwohl keine Farbe wechselte

Alle acht betroffenen Tokens sind themenblind — in allen vier Themes derselbe Wert. Die 16
Umstellungen waren bildpunktgleich. Der Schaden liegt woanders:

1. **Eine Zweckentscheidung fiel nach dem Wert.** Der Schwierigkeitsgrad einer Begegnung hing
   danach an der Ladenkategorie „Getränk", der Zustand „versteinert" an der **Tinte** der
   Schadensart „nekrotisch", das Konzentrationsabzeichen am Wissensgebiet „Religion", der
   d20-Würfel an der Linienfarbe eines Vorlesetext-Stils. Wer eine dieser Skalen später umfärbt,
   färbt unbeteiligte Bedienoberfläche mit.
2. **Die Klasse verschwand aus der einzigen Ratsche, die sie führte.** `R-10` zählte 52 Stellen,
   keine der 16 war darunter. Schritt 7, der sie einzeln entscheiden soll, hätte sie nicht mehr
   vorgelegt bekommen.
3. **Als Skala waren sie danach unvollständig.** `.calc-diff-badge` hat fünf Stufen; `trivial`,
   `medium` und `hard` bekamen Ladenkategorie-Tokens, `easy` und `deadly` blieben Literale, weil
   ihre Tripel in keiner Skala vorkommen. Eine fünfstufige Skala führte drei Fremdtokens und zwei
   Literale.

### Die 16 Stellen

Zurückgenommen auf ihr Literal, Zeile für Zeile zeichengleich gegen `765103f` geprüft:

| Datei, Regel | Skalentoken, Anteil | Literal |
| --- | --- | --- |
| `dashboard.css` `.wiki-link` | `--know-religion` 10 % | `rgba(168, 85, 247, 0.1)` |
| `party.css` `.wiki-tree-cat-header.active` | `--know-religion` 20 % | `rgba(168, 85, 247, 0.2)` |
| `party.css` `.wiki-tree-item.selected` | `--know-religion` 15 % | `rgba(168, 85, 247, 0.15)` |
| `party.css` `.wiki-detail-category` | `--know-religion` 15 % | `rgba(168, 85, 247, 0.15)` |
| `initiative.css` `.concentration-badge` (Verlaufsstopp) | `--know-religion` 15 % | `rgba(168, 85, 247, 0.15)` |
| `dmscreen.css` `.condition-badge.petrified` | `--dmg-necrotic-text` 30 % | `rgba(156, 163, 175, 0.3)` |
| `dmscreen.css` `.relationship-badge.neutral` | `--dmg-necrotic-text` 20 % | `rgba(156, 163, 175, 0.2)` |
| `initiative.css` `.npc-relation-status.neutral` | `--dmg-necrotic-text` 20 % | `rgba(156, 163, 175, 0.2)` |
| `encounters.css` `.calc-diff-badge.trivial` | `--cat-gear` 20 % | `rgba(52, 152, 219, 0.2)` |
| `encounters.css` `.calc-diff-badge.medium` | `--cat-drink` 20 % | `rgba(243, 156, 18, 0.2)` |
| `encounters.css` `.calc-diff-badge.hard` | `--cat-food` 20 % | `rgba(230, 126, 34, 0.2)` |
| `encounters.css` `.calc-threshold-seg.medium` | `--cat-drink` 30 % | `rgba(243, 156, 18, 0.3)` |
| `encounters.css` `.calc-threshold-seg.hard` | `--cat-food` 30 % | `rgba(230, 126, 34, 0.3)` |
| `initiative.css` `.concentration-check-banner` (Verlaufsstopp) | `--dmg-lightning` 15 % | `rgba(234, 179, 8, 0.15)` |
| `npcs.css` `.npc-trigger-item.triggered` | `--dmg-lightning` 10 % | `rgba(234, 179, 8, 0.1)` |
| `dice.css` `.fdp-die.d20` (Verlaufsstopp) | `--ra-crimson-rule` 30 % | `rgba(153, 27, 27, 0.3)` |

**R-10 steigt dadurch von 52 auf 68.** Das ist kein Rückschritt, sondern die Wiederherstellung der
Zählgrundlage: die Ratsche ist ohnehin bis Schritt 7 rot, und ihre Aufgabe ist es, genau diese
Stellen vorzulegen.

### Die siebzehnte Stelle, die nie umgestellt war

Der Kopfkommentar von R-10 führt **17** Skalentoken-Stellen. Die fehlende ist `bestiary.css`
`.bestiary-statblock-meta`: `color: rgba(44, 24, 16, 0.7)` = `--ra-parchment-ink` bei 70 %. Sie
ist eine **Tinte**, keine Fläche, und fiel deshalb aus der mechanischen Runde heraus. Der
Kommentar über ihr nennt die Abhilfe bereits („Literal → Token oder color-mix aus
`--parchment-ink-dark`") und wartet ebenfalls auf Schritt 7.

### Was Schritt 7 Punkt (3) jetzt zu beantworten hat

Der Plan sagt „auf das **TOKEN** umstellen, NICHT auf color-mix". **Das ist an 16 von 17 Stellen
nicht wörtlich ausführbar:** alle tragen ein Alpha unter 1, `var(--cat-food)` ist deckend. Wer das
Alpha wegwirft, ändert das Bild; wer eine Mischung baut, ist wieder bei `color-mix` — und damit
bei genau der Frage, die zurückgenommen wurde. Pro Stelle ist deshalb zuerst zu entscheiden:

- Gehört die Fläche **in den Gegenstandsbereich der Skala**? (Bei `.calc-diff-badge` offensichtlich
  nicht: die Tinte daneben ist `var(--yellow)`/`var(--orange)`, also eine Theme-Rolle.)
- Wenn nein: welche **Theme-Rolle** trägt sie? Dann ist es eine Tönung derselben oder einer fremden
  Rolle und gehört mit in die **D-4**-Entscheidung aus Schritt 8, nicht nur in eine Schreibweise.
- Wenn ja: Eintrag in `R12_AUSNAHMEN` mit Begründung — die Ratsche verbietet die Skala als Fläche
  nicht, sie verlangt nur, dass die Entscheidung geschrieben dasteht.

**Sonderfall `dice.css` `.fdp-die.d20`.** Der Verlauf hat zwei Stopps. Der erste
(`rgba(220,38,38,0.2)`) geht nach **E1** auf `color-mix(var(--red) 20 %)`. Bliebe der zweite auf
`--ra-crimson-rule`, führte ein und dieselbe Deklaration eine Theme-Rolle und ein themenblindes
Vorlesetext-Token nebeneinander — der Verlauf liefe in Light und Sepia auseinander. Beide Stopps
gehören zusammen entschieden.

### Was jetzt verhindert, dass es wieder passiert

`R-12` in `tests/unit/design-consistency.test.js` (Block „Skalentoken als Tönungsfläche"). Sie
zählt jede `background`-Tönung, deren Basis ein Token einer Skalenfamilie (`--know-`, `--cat-`,
`--dmg-`, `--ra-`) **und** in genau einem Block von `variables.css` deklariert ist.
`R12_AUSNAHMEN` ist bei der Geburt leer — wie `R10_AUSNAHMEN`. Sie verbietet nichts; sie macht die
stille Umstellung unmöglich.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
npx jest tests/unit/design-consistency.test.js -t "keine Skala"
npx jest tests/unit/design-consistency.test.js -t "kein rgba"
grep -rn "cat-drink\|cat-food\|cat-gear\|know-religion\|dmg-necrotic-text\|dmg-lightning\|ra-crimson-rule" assets/styles/*.css | grep -v variables.css
```

---

## W2-B-04 — 17 Regel-×-Theme-Paare verlieren durch Welle 2 die 4,5; über die Themes minimiert sieht man keines davon

**Stand:** 2026-09-29, Prüfrunde W2-B Runde 1. Offen — Eingangsdaten für die **D-4**-Entscheidung
in Schritt 8.

### Worum es geht

Die Schritte 4–6 haben feste Farbliterale durch Tönungen derselben Rolle ersetzt. Wo vorher
`rgba(212,175,55,0.2)` stand — das **Dark**-Gold, in allen vier Themes dasselbe —, steht jetzt
`color-mix(in srgb, var(--gold) 20%, transparent)`. Die Fläche folgt damit dem Theme. Das ist
gewollt und richtig. Es hat aber eine Folge, die die bisherige Buchführung nicht zeigt.

**Die Aggregation ist der ganze Punkt.** Hausregel **D-2** sagt: maßgeblich ist das Minimum über
die tatsächlichen Trägerflächen (`--bg-card`, `--bg-dark`, `--bg-elevated`, `--bg-hover`). Wer
darüber hinaus auch noch **über die vier Themes** minimiert, bekommt für jede dieser Regeln
denselben Wert wie vorher — weil sie in **Light** ohnehin schon durchfallen und Light das Minimum
stellt. Die Zahl „0 neu durchgefallen" ist unter dieser Aggregation richtig gerechnet und sagt
nichts. Je Theme gerechnet sieht es anders aus:

> **17 Regel-×-Theme-Paare fallen von ≥ 4,5 unter 4,5. Kein einziges steigt darüber.**

### Die 17 Paare

Gemessen mit `tests/unit/helpers/wcag-contrast.js` (Selbsttest `#777777`/`#767676` auf Weiß =
4,48/4,54 bestanden), Minimum über die vier Trägerflächen, **je Theme**, `765103f` gegen den
heutigen Stand:

| Datei, Regel | Tinte auf Tönung | Theme | vorher | nachher |
| --- | --- | --- | ---: | ---: |
| `dmscreen.css` `mark` (globale Elementregel) | `--gold` auf `--gold` 30 % | sepia | 4,55 | **3,37** |
| `dmscreen.css` `.notes-search-excerpt mark` | `--gold` auf `--gold` 30 % | sepia | 4,55 | **3,37** |
| `core.css` `.condition-custom` | `--gold` auf `--gold` 20 % | sepia | 4,74 | **3,91** |
| `core.css` `.tag-gold` | `--gold` auf `--gold` 20 % | sepia | 4,74 | **3,91** |
| `dashboard.css` `.status-badge.primary` | `--gold` auf `--gold` 20 % | sepia | 4,74 | **3,91** |
| `loot.css` `.si-cart-btn` | `--gold` auf `--gold` 20 % | sepia | 4,74 | **3,91** |
| `editors.css` `.editor-btn.format-active` | `--gold` auf `--gold` 18 % | sepia | 4,78 | **4,03** |
| `editors.css` `.editor-btn[aria-expanded='true']` | `--gold` auf `--gold` 18 % | sepia | 4,78 | **4,03** |
| `editors.css` `.tb-menu-item:hover` | `--gold` auf `--gold` 18 % | sepia | 4,78 | **4,03** |
| `editors.css` `.editor-block-handle button:hover` | `--gold` auf `--gold` 18 % | sepia | 4,78 | **4,03** |
| `editors.css` `.editor-btn:hover` | `--gold` auf `--gold` 14 % | sepia | 4,87 | **4,26** |
| `party.css` `.cf-chip.selected` | `--gold` auf `--gold` 15 % | sepia | 4,83 | **4,22** |
| `tools.css` `.rt-entry .rt-entry-range` | `--gold` auf `--gold` 15 % | sepia | 4,83 | **4,22** |
| `dashboard.css` `.char-save-box.proficient` | `--gold` auf `--green` 20 % | sepia | 4,84 | **4,42** |
| `dmscreen.css` `mark` (globale Elementregel) | `--gold` auf `--gold` 30 % | contrast | 5,03 | **4,23** |
| `dmscreen.css` `.notes-search-excerpt mark` | `--gold` auf `--gold` 30 % | contrast | 5,03 | **4,23** |
| `dmscreen.css` `.condition-badge.poisoned` | `--green` auf `--green` 30 % | contrast | 4,81 | **4,48** |

14 Paare liegen in **Sepia**, 3 im **Contrast**-Theme — also gerade dem Barrierefreiheits-Theme.
Der schlechteste Einzelabfall ist **−1,18** (`mark`/sepia).

### Die Ursache ist systematisch, nicht zufällig

In Sepia ist `--gold` ein **dunkles Braun** (`#8b4513`), nicht das helle Dark-Gold (`#d4af37`).
Die Tönung wird dadurch dunkler **und** trägt dieselbe braune Tinte — der Abstand bricht von zwei
Seiten ein. Handnachgerechnet für `.tag-gold` über `--bg-hover` (`#e5dbc5`):

| | Mischung | Fläche | L | gegen `#8b4513` (L = 0,0978) |
| --- | --- | --- | ---: | ---: |
| vorher | `rgba(212,175,55,0.2)` | `#e2d2a9` | 0,6513 | **4,74** |
| nachher | `color-mix(--gold 20 %)` | `#d3bda1` | 0,5282 | **3,91** |

### Keine Ratsche urteilt heute über diese Stellen

`ruheRegeln()` im R-04-Block filtert Flächen mit `^var\((--[\w-]+)\)$`. Eine `color-mix`-Fläche
fällt dort heraus — **vorher wie nachher**, denn vorher stand ein nacktes `rgba(...)` da, das
ebenso wenig auf das Muster passt. Es geht also keine Deckung verloren; es gab nie welche. Die
Lücke als solche bleibt offen und ist dieselbe wie unter W2-B-01 zweiter Punkt: Tinte auf einer
halbdurchsichtigen Fläche wird von keiner Ratsche geprüft.

### Was daraus für Schritt 8 folgt

1. **Die Kontrastbuchhaltung ist je Theme zu führen**, nicht über die Themes zu minimieren. Sonst
   verschwindet jede Verschlechterung hinter dem ohnehin durchgefallenen Light.
2. Die 17 Paare sind **Eingangsdaten für D-4**. **E2** deckelt die Stärke je Theme
   (Dark 13 / Light 7 / Sepia 7 / Contrast 20 %) — das entlastet die Fläche. Für Sepia ist
   zusätzlich zu entscheiden, ob `--gold` als **Tinte auf einer `--gold`-Tönung** dort überhaupt
   tragfähig ist; der Nachtrag unter W1-D-02 zeigt für `editors.css:69`, dass auch
   `var(--gold-text)` auf der themenfolgenden Tönung nicht mehr reicht (light 4,31).
3. **`dmscreen.css` `mark` vorziehen.** Das ist keine Widget-Regel, sondern eine nackte globale
   Elementregel in einer Widget-Datei — sie trifft **jede** Texthervorhebung der App. Sie trägt
   zugleich den schlechtesten Abfall der Liste und ist dreifach geführt
   (`.notes-search-excerpt mark`, `.search-result-preview mark`). Die Verlagerung der Weltregel
   selbst bleibt Welle 4, die Farbentscheidung nicht.
4. `dashboard.css` `.char-save-box.proficient` ist einer der zwei Fälle mit **fremder Rolle**
   (Gold auf Grün), die Schritt 8 ohnehin namentlich mitentscheidet.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
node -e "const W=require('./tests/unit/helpers/wcag-contrast.js');console.log(W.selfTest())"
grep -n "mark {" assets/styles/dmscreen.css
grep -rn "color-mix(in srgb, var(--gold)" assets/styles/*.css
```

---

## W2-B-05 — Der `@supports`-Auftrag von Schritt 11 nennt 6 Tokens; die Klasse hat 15

**Stand:** 2026-09-29, Prüfrunde W2-B Runde 1. Offen — **Geltungsbereich von E4 / Schritt 11
Punkt (2)** ist zu erweitern, bevor Schritt 11 läuft.

### Worum es geht

**E4** verzichtet an den Flächen bewusst auf einen Zwei-Deklarations-Rückfall: eine unbekannte
`color-mix`-Form fällt dort von selbst auf die vorausgehende Deklaration derselben Eigenschaft
zurück, und ein zusätzliches `rgba`-Literal ließe `R-10` an jeder Stelle anschlagen. Für **Tokens**
trägt diese Begründung nicht:

- Ein Custom Property, das nur **einmal** deklariert ist, hat keine vorausgehende Deklaration.
- `var(--x, ersatz)` hilft ebenfalls nicht — der Rückfall feuert nur bei einem **nicht
  definierten** Namen, nicht bei einem definierten mit unbrauchbarem Wert. Der Wert ist dann
  „invalid at computed value time", die Eigenschaft fällt auf ihren Anfangswert. Bei
  `background-color` heißt das **durchsichtig**.

Deshalb ordnet E4 für die abgeleiteten Tokens eine `@supports`-Absicherung an. Genannt sind
**sechs** (`--gold-hover`, `--green-hover`, `--red-dim`, `--green-dim`, `--red-dark`,
`--orange-dim`). Schritt 11 sagt wörtlich „**@supports NUR um die 6 abgeleiteten Tokens**" und
wiederholt es in der Abnahme.

**Schritt 3 derselben Welle hat neun weitere Tokens exakt derselben Bauart angelegt.**

### Die Klasse, gemessen

| | Tokens | Nutzungen per `var()` | davon mit Rückfall |
| --- | ---: | ---: | ---: |
| von E4 benannt (Aliasblock) | 6 | 19 | 0 |
| von Schritt 3 angelegt | **9** | **22** | 0 |
| **Klasse insgesamt** | **15** | **41** | **0** |

Die neun: `--overlay-faint`, `--overlay-weak`, `--overlay-mid`, `--overlay-strong`,
`--overlay-heavy`, `--scrim-60`, `--scrim-70`, `--scrim-75`, `--scrim-85`. Sie stehen im
Basis-`:root` und werden ausnahmslos ohne Rückfall benutzt. **Die ungeschützte Menge ist damit
größer als die, für die der Schutz angeordnet ist.**

Vor Schritt 3 trugen alle 22 Stellen ein nacktes `rgba(...)` und funktionierten überall. Der
Schritt hat die Klasse also nicht nur vergrößert, er hat 22 Stellen aus der sicheren in die
unsichere Bauart überführt.

### Warum das nicht kosmetisch ist

Sechs der 22 Stellen sind **Modalblenden**:

| Datei | Regel |
| --- | --- |
| `command-palette.css` | `.cp-overlay` |
| `dmscreen.css` | `.shortcuts-overlay` |
| `dmscreen.css` | `.modal-overlay` |
| `encounters.css` | `#calculator-modal` |
| `migration.css` | `.migration-wizard-overlay` |
| `party.css` | `.wiki-form-overlay` |

Fällt der Wert aus, ist die Blende nicht blass, sondern **weg** — der Dialog steht ohne Abdunklung
über der Anwendung dahinter.

### Zweite Falle im selben Punkt: die Zeilenanker von Schritt 11 sind verschoben

Schritt 11 verweist auf `variables.css:718-723`. Dort stehen die sechs Tokens **nicht mehr**; sie
liegen heute auf **`:778-783`** (Welle 1 und die Schritte 3–6 haben Kommentare eingefügt). Die
neun neuen liegen auf `:833-841`. Wer den Anker wörtlich nimmt, greift ins Leere. Das ist
dieselbe Fehlerart, gegen die `R-06` steht — nur betrifft sie hier den **Plan**, nicht die
Aktenlage, und wird von keiner Ratsche gefangen.

### Was zu entscheiden ist

**Eine `@supports`-Absicherung deckt alle 15 in einem Block ab.** Der Geltungsbereich von E4 ist
dafür auf die neun neuen zu erweitern. Die Alternative wäre, Blenden und Auflagen an der
Fundstelle als `color-mix` auszuschreiben statt per Token — dann greift E4s Begründung wieder
(Rückfall auf die vorausgehende Deklaration), allerdings um den Preis, dass `D-01` dort wieder
Literale sähe und die Leiter als Abstraktion verloren ginge. Die Token-Fassung mit `@supports` ist
die bessere; sie braucht nur die ausdrückliche Erweiterung.

An den **Flächenregeln** bleibt es unverändert bei **kein `@supports`, kein `rgba`-Rückfall** —
dort ist E4s Begründung richtig.

### Was jetzt verhindert, dass die Klasse wieder unbemerkt wächst

`R-13` in `tests/unit/design-consistency.test.js` (Block „color-mix im Basis-:root ohne
Rückfall"). Sie führt die 15 Namen als Inventar und geht rot, sobald ein sechzehnter dazukommt
oder einer verschwindet. Sie ist bei der Geburt **grün** — sie ist kein Nachweis, sondern die
Sperre gegen das lautlose Wachsen.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "color-mix" assets/styles/variables.css
grep -rn "var(--overlay-\|var(--scrim-" assets/styles/*.css | wc -l
grep -rn "@supports" assets/styles/*.css          # heute: kein Treffer
npx jest tests/unit/design-consistency.test.js -t "rueckfalllosen"
```
