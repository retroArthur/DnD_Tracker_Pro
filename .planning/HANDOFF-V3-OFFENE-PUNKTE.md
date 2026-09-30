# Design-Handoff v3 — offene Punkte

Was hier steht, ist **nicht erledigt und nicht stillschweigend freigegeben**. Jeder Punkt nennt
die Messung, auf der er beruht, den Befehl, mit dem sie nachvollziehbar ist, und die Frage, die
noch zu beantworten ist.

Die Einträge sind teilweise durch eine Ratsche gesichert: `tests/unit/design-consistency.test.js`
(Block R-02, Test „jede Zelle aus ATTR_HOVER_AUSNAHME ist im offenen Punkt gefuehrt") geht rot,
wenn eine hier geführte Zeile verschwindet, wenn ein Wert auseinanderläuft oder wenn eine Zeile
zur Altlast wird. Ein offener Punkt kann also nicht durch Vergessen verschwinden.

**Die 123 Zeilenanker `datei.css:ZEILE` in W1-D-01 werden ab dem 2026-09-29 nicht mehr von Hand
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

## W1-B-01 — Vier Attributkürzel fielen in Dark und Contrast beim Überfahren der Zeile unter 4,5

**Status: ERLEDIGT am 2026-09-29 (Welle 2, Schritt 9) — Entscheidung E3, Antwort D.**
Aufgenommen am 2026-09-28, Welle 1, Schritt 12.

### Worum es ging

Die Attributkürzel der Schnellreferenz (`.attr-str` … `.attr-cha`, Markup
`assets/templates/modals-editors.html:370-376`) lagen auf **drei** Trägerflächen, nicht auf zwei:

- `--bg-dark` — DM-Screen-Widgets `.dms-attr-item` / `.dms-save-item`
- `--bg-card` — `.qref-row` im Ruhezustand
- `--bg-hover` — `.qref-row:hover`

Die dritte Fläche ist beim Lesen einer Zeile kein Sonderfall, sondern der Normalfall: man fährt
mit dem Zeiger über die Zeile, die man liest.

**Entscheidung D-5 („Dark/Contrast behalten ihre Werte, außer `--attr-wis`") war auf der
Zwei-Flächen-Messung getroffen worden.** Dort zeigen die betroffenen Zellen 4,52–5,95 und damit
gar kein Problem. Erst `--bg-hover` (#333 in beiden Themes) brachte sie auf 3,16–3,58. Diese
Zahlen lagen der Entscheidung nicht vor.

### Die acht Zellen, gemessen — und warum sie hier nicht mehr als Tabellenzeilen stehen

Nachgerechnet am 2026-09-28 mit einem eigenen WCAG-Rechner (Selbstprobe `#777`/`#767676` gegen
Weiß = 4,48/4,54 — die bekannte Grenzprobe, an der ein falsch implementierter Rechner auffliegt),
am 2026-09-29 unabhängig bestätigt. Spalte „min2" ist das Minimum über `--bg-dark` und
`--bg-card`, also die Zahl, die D-5 vorlag.

Die Zahlen bleiben als **Fließtext** stehen und nicht mehr als Tabelle mit Theme in der ersten
Spalte. Das ist kein Kosmetikentscheid: die Ratsche im R-02-Block liest genau diese Zeilenform
und geht rot, sobald eine Zeile geführt wird, zu der es keinen Eintrag in `ATTR_HOVER_AUSNAHME`
mehr gibt. Die Liste ist seit Schritt 9 leer; eine zurückbleibende Tabellenzeile wäre damit
Altlast, und die Ratsche sagt das auch so. Der historische Befund darf davon nicht verloren
gehen, also steht er hier in einer Form, die die Ratsche nicht als Führung liest.

Auf `--bg-hover` (in Dark und Contrast beides #333) gemessen, dahinter in Klammern min2:

- **Dark** — Stärke 3,36 (4,62) · Intelligenz 3,44 (4,73) · Weisheit 3,28 (4,52) ·
  Ausstrahlung 3,58 (4,93)
- **Contrast** — Stärke 3,16 (4,72) · Intelligenz 3,44 (5,13) · Weisheit 3,28 (4,90) ·
  Ausstrahlung 3,58 (5,35)

Die übrigen vier Zellen (Geschicklichkeit 5,54 · Konstitution 5,88 in beiden Themes) hielten auch
auf `--bg-hover`. Light und Sepia waren bereits abgedunkelt und hielten dort 4,54–4,61 — dort
erlaubt D-5 das Abdunkeln ausdrücklich, und es ist geschehen (Commit `dab02ff`).

### Die Antwort des Nutzers: E3, Option 1 („Hover ohne Füllung")

Von den fünf gerechneten Wegen — A „bleibt so", B „genauso knapp anheben wie die Weisheit",
C „eigene, dunklere Hoverfläche", D „Hover nicht über die Fläche melden", E „Pille aus Fläche und
Tinte" — ist **D** gewählt worden.

`.qref-row:hover` setzte genau eine Deklaration. Sie meldet das Überfahren seit dem 2026-09-29
über einen Umriss (`outline: 1px solid var(--gold-dim)`) statt über eine Füllung. Damit ist
`--bg-card` die einzige Fläche dieser Zeile, und **alle sechs Kürzel halten in allen vier
Themes**:

| Theme    | min über --bg-dark und --bg-card |
| -------- | -------------------------------- |
| dark     | 4,52–8,10                        |
| light    | 5,66–5,74                        |
| sepia    | 4,98–5,05                        |
| contrast | 4,72–8,79                        |

Was das gegenüber B gewonnen hat:

- **Kein Farbwert ändert sich.** D-5 („Dark/Contrast behalten ihre Werte") bleibt unangetastet,
  statt mit acht neuen Tokenwerten überschrieben zu werden.
- **D-6 bewegt sich nicht.** Die Farbtöne sind dieselben, der kleinste Nachbarabstand bleibt
  29,63 / 29,74 / 30,85 / 29,63 — siehe die neue Ratsche R-15.
- **Eine Regel statt acht Tokenwerten.**

Der Preis, benannt statt verschwiegen: die Schnellreferenz-Zeile verliert ihre Füllung beim
Überfahren. Der Umriss ist 1px `--gold-dim` und hält WCAG 1.4.11 gegen `--bg-card` (5,21 · 5,09 ·
9,17 · 8,51). Er ist vom Tastaturfokus unterscheidbar, der in diesem Baum 2px `--gold` ist.

**Weg C ist gerechnet ausgeschlossen und kommt deshalb nicht wieder:** die hellste Graustufe, die
alle sechs bei ≥ 4,5 hält, ist in Dark #1a1a1a — zeichengleich `--bg-card`, der Hover verschwände
also ganz. In Contrast wäre es #161616 gegen `--bg-card` #111111, ein Unterschied, den niemand
sieht. Die Begründung steht auch im CSS an der Regel.

### Was sich in den Tests geändert hat

- `ATTR_FLAECHEN` führt wieder zwei Flächen statt drei — nicht weil die Messung sich geändert
  hätte, sondern weil es die dritte Fläche nicht mehr gibt.
- `ATTR_HOVER_AUSNAHME` ist **leer**, absichtlich statt abwesend: die Maschinerie bleibt stehen,
  damit eine künftige Ausnahme wieder namentlich mit ihrem gemessenen Wert eingetragen und hier
  geführt werden muss.
- Neu: die Ratsche „die Attributkuerzel liegen auf genau den Flaechen, die Teilformel 3 prueft"
  zählt die Flächen aller drei Träger nach. Ohne sie wäre die verkleinerte Prüfmenge eine bloße
  Behauptung — wer die Füllung zurückschreibt, fiele sonst lautlos auf 3,16 zurück.
- Neu: **R-15** gibt D-6 zum ersten Mal eine Schranke (Boden 29,63 / 29,63 / 30,67 / 29,63, am
  Ausgangsbestand `ca85d1b` gemessen).

### Nachrechnen

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n -- "--attr-\|--bg-hover" assets/styles/variables.css
grep -n "qref-row" assets/styles/dashboard.css
npx jest tests/unit/design-consistency.test.js -t "vier Teilformeln"
npx jest tests/unit/design-consistency.test.js -t "R-15"
```

**Nicht verwechseln mit D-4:** Die Tönungsstellen derselben Rolle — darunter `.dms-skill-header`,
wo dieselben Attributfarben auf einer Tönung sitzen — sind ein anderer Punkt und in Schritt 8
erledigt worden (die Tönung bleibt, die Tinte ist neutral). Sie sind hier nicht mitgemeint.

### Nachtrag Welle 3 Schritt 9 (2026-09-30) — die 4,52 gehören nicht zum DM-Screen

Der Punkt bleibt **erledigt**; berichtigt wird eine **Zuordnung**, die drei Pläne dieser Welle
weitergetragen haben. Sie lautete: „`--attr-wis` hält in Dark genau 4,52 — wer eine Höhenstufe als
**inset** auf `.dms-attr-item` legt, kippt diese 0,02." Der erste Halbsatz stimmt, der zweite
verweist auf die falsche Regel.

Die Tabelle oben zeigt je Theme die Spanne der **schlechteren** der zwei Flächen, nicht beide. Je
Fläche einzeln gerechnet, Minimum über alle sechs Tokens (dark · light · sepia · contrast):

- `--bg-dark` — `.dms-attr-item` und `.dms-save-item`: **5,04 · 5,66 · 4,98 · 5,25**
- `--bg-card` — `.attr-str` … `.attr-cha` in `.qref-row`: **4,52 · 6,17 · 5,81 · 4,72**

Die **4,52 sind `--attr-wis` gegen `--bg-card`, also die Schnellreferenz-Zeile `.qref-row`.** Auf
der Fläche von `.dms-attr-item` hält `--attr-wis` in Dark **5,04**; der knappste Wert dort ist
`--attr-dex` in Sepia mit **4,98**. Ein inset auf `.dms-attr-item` verschiebt also die erste Reihe
(Luft 0,48), ein inset auf `.qref-row` die zweite (Luft 0,02). Wer die 0,02 sucht, muss zu
`.qref-row` — und das ist ausgerechnet die Regel, die aus E3 einen Umriß statt einer Füllung trägt.

Heute trägt **keine** der beiden Regeln einen `box-shadow`; die neun `inset`-Lagen des Baumes sind
die sieben Papierhöfe des Vorlesetextes plus die zwei Glanzkanten in `dice.css` und `dmscreen.css`.
**R-23 Teil (6)** hält das fest: es prüft, daß beide Regeln ihre erwartete Fläche tragen und keinen
`box-shadow`, und rechnet beide Reihen bei jedem Lauf nach — die sechs Tokennamen liest es dafür aus
den `.dms-attr-item`-Regeln, statt sie zu tippen. Die zwei Reihen stehen zusätzlich mit
`R-23:`-Etikett am Attributfarben-Kommentar in `assets/styles/variables.css`.

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

## W1-D-01 — 123 Akzenttext-Stellen, deren Trägerfläche Schritt 9 nicht als neutral nachweisen konnte

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
Flächenmenge zeigen. 181 Stellen haben das erfüllt, 128 nicht. **Davon stehen heute noch 123
unten**; fünf sind erledigt worden — zwei in Schritt 11, zwei im Nachtrag der Prüfrunde W1-E
(siehe beide Vorbemerkungen zu Gruppe B), eine in Schritt 18 (Vorbemerkung zu Gruppe E).

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
# Die verbliebenen Stellen als Kategorie (Summe 123 + 5 bei der Geburt der Liste;
# seit Schritt 11, der Prüfrunde W1-E und Schritt 18 sind fünf davon erledigt,
# die Summe ist also um fünf kleiner):
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
124 seit der Prüfrunde W1-E, 123 seit Schritt 18).

Die Messung selbst: `<scratch>/measure5.js` (Playwright, gebautes Bündel, 24 Ansichten + 30
Dialoge, zwei Themes) und `<scratch>/decide.js` (Urteil je Stelle plus Geschwisterbindung).

### Was bis zur Entscheidung gilt

Diese 123 Stellen bleiben auf `color: var(--<rolle>)`. In Light und Sepia liegen sie damit
weiterhin bei 2,16–4,20 gegen eine neutrale Fläche — falls ihre Fläche neutral ist, was für
Gruppe E gerade nicht bewiesen ist. Sie sind **kein** erledigter Fall.

### Die fünf Gruppen

### Gruppe A — Dialogflaeche, 16 Stellen

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `bestiary.css:493` | `.bst-section-title` | `--gold` | #191919 | #1e1e1e |
| `bestiary.css:506` | `.bst-validation-error` | `--red` | #191919 | #1e1e1e |
| `core.css:1265` | `.char-modal-title h2` | `--gold` | #191919 | #1e1e1e |
| `core.css:1270` | `.char-modal-subtitle` | `--cyan` | #191919 | #1e1e1e |
| `dashboard.css:240` | `.modal-title` | `--gold` | #191919 | #1e1e1e · #252525 |
| `initiative.css:595` | `.aoe-modal-header h3` | `--red` | #191919 | #1e1e1e |
| `initiative.css:735` | `.aoe-target-save` | `--green` | #191919 | #1e1e1e |
| `initiative.css:752` | `.aoe-target-damage.full` | `--red` | #191919 | #1e1e1e |
| `initiative.css:756` | `.aoe-target-damage.half` | `--yellow` | #191919 | #1e1e1e |
| `party.css:2074` | `.rest-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `party.css:2345` | `.condition-ref-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:474` | `.rt-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:601` | `.rt-dice-label` | `--gold` | #191919 | #1e1e1e |
| `tools.css:684` | `.generator-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:811` | `.ld-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:844` | `.ld-gold-label` | `--gold` | #191919 | #1e1e1e |

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
| `dmscreen.css:600` | `.session-arc-title` | `--gold` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `dmscreen.css:1163` | `.drag-handle:hover` | `--gold` | --bg-card · GRAD:#0d0d0d | --bg-card · GRAD:#f5f5f5 |
| `initiative.css:175` | `.init-value` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:207` | `.init-name:hover` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:235` | `.init-hp-value.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:236` | `.init-hp-value.bloodied` | `--yellow` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:1263` | `.init-mob-alive.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:1264` | `.init-mob-alive.bloodied` | `--yellow` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `spells.css:92` | `.spell-info-line.classes` | `--cyan` | GRAD:#1a1a1a | GRAD:#ffffff |
| `spells.css:93` | `.spell-info-line.school` | `--purple` | GRAD:#1a1a1a | GRAD:#ffffff |
| `tools.css:859` | `.ld-split-amount` | `--gold` | GRAD:#191919 | GRAD:#1e1e1e |

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
| `dmscreen.css:1381` | `.dms-init-marker` | `--gold` | #3c331b | #fef5de |
| `dmscreen.css:1394` | `.dms-init-value` | `--cyan` | #3c331b | #fef5de |
| `loot.css:295` | `.shop-cat-badge.weapon` | `--red` | --bg-card | --bg-card |
| `loot.css:296` | `.shop-cat-badge.armor` | `--blue` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:298` | `.shop-cat-badge.service` | `--purple` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:300` | `.shop-cat-badge.all` | `--gold` | #d4af37 | #b8860b |
| `party.css:842` | `.wiki-tree-item.pinned` | `--gold` | --bg-card · #2f233b | --bg-card · #f2e6fe |
| `tools.css:586` | `.rt-dice-btn:hover` | `--gold` | --bg-dark · #d4af37 | --bg-dark · #b8860b |
| `tools.css:637` | `.rt-hint-warn` | `--orange` | #2f2618 | #332a1c |

### Gruppe D — zwei verschiedene Traeger fuer denselben Selektor, 5 Stellen

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `dashboard.css:541` | `.char-section-title` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `dice.css:661` | `.fdp-title` | `--gold-text` | --bg-card | --bg-card |
| `core.css:583` | `.form-group label` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `party.css:2676` | `.char-adv-btn.adv` | `--green` | --bg-dark · #191919 | --bg-dark · #1e1e1e |
| `party.css:2677` | `.char-adv-btn.dis` | `--red` | --bg-dark · #191919 | --bg-dark · #1e1e1e |

`.fdp-title` ist als einzige Zeile dieser Gruppe erledigt (Welle 2, Schritt 7), bleibt aber
gefuehrt, damit die Zahl 124 nicht lautlos sinkt: der zweite Traeger `#1e1e1e` WAR das
fest verdrahtete `rgba(26,26,26,0.98)` des Wuerfel-Panels. Seit die Panelflaeche
`var(--bg-card)` folgt, gibt es nur noch EINEN Traeger, und die Tinte ist `--gold-text`
(8,28 · 6,23 · 6,58 · 13,46 statt 5,12 · 3,25 in Light auf heller Karte). Die
gleichlautende Stelle an `.modal` ist NICHT erledigt — siehe W2-C-01.

### Gruppe E — in keinem erreichbaren Zustand gerendert, 81 Stellen

**Ein Eintrag dieser Gruppe ist seit dem 2026-09-29 erledigt und deshalb aus der Liste entfernt**
(Welle 2, Schritt 18, Prüfung W2-D Runde 1): `initiative.css` `.concentration-check-banner
.conc-dc` (`--gold`). Die Überschrift der Gruppe traf für sie **nicht zu** — sie wird sehr wohl
gerendert, und zwar über einen realen Klick: die E2E-Prüfung des Konzentrations-Bannens
(`tests/e2e/features/initiative.spec.js`) erzeugt es über die Schadensschaltfläche und prüft
danach `.conc-dc` auf „DC 10". Die Stelle war ein **Quergriff** (Tönung in der Elternregel, Tinte
im Kind) und lag mit Light 2,35 (Kopf) bzw. 2,16 (Fuß) unter dem schlechtesten der drei
Quergriffe, die Schritt 8 von Hand behoben hat. Sie trägt jetzt `var(--gold-text)` auf zwei
gedeckelten Stopps: Kopf 5,44 · 4,78 · 5,34 · 7,27, Fuß 5,91 · 4,62 · 5,21 · 10,01. Bewacht von
**R-14** in `tests/unit/design-consistency.test.js`. Die Zahl der geführten Stellen sinkt damit
von 124 auf 123; die Plausibilitätsprobe in R-06 ist im selben Commit nachgezogen.

**Die Überschrift dieser Gruppe ist damit eine Behauptung und kein Befund.** Sie ist für 81
Stellen nicht geprüft, sondern aus dem Ausbleiben eines Treffers im geseedeten Messlauf
geschlossen — eine Stelle, die der Messaufbau nicht erreicht, sieht genauso aus wie eine, die es
nicht gibt. Wer die Gruppe auflöst (siehe unten), prüft jede Zeile gegen die E2E-Suite, bevor er
sie als unerreichbar abschreibt.

```
bestiary.css
  142  .bestiary-fav.active
core.css
   17  [data-layout="mobile"] .mobile-nav-toggle-text
   75  [data-layout="mobile"] #mobile-timer-display
   79  [data-layout="mobile"] .mobile-timer.running #mobile-timer-display
   83  [data-layout="mobile"] .mobile-timer.paused #mobile-timer-display
 1161  .char-card-currency
 1937  .quest-reward-item-tag .remove-btn:hover
 1930  .quest-reward-item-tag .remove-btn
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
  454  .char-save-box.proficient .save-label
  502  .enc-save-box.active .enc-save-label
  706  .icon-btn.danger:hover
  707  .icon-btn.success:hover
 1140  .dash-timer-time
 1479  .qref-chip.danger
dice.css
  349  .dice-fav-item:hover .fav-del
dmscreen.css
   86  .dice-fav-btn .fav-name
  274  .condition-tooltip-title
  394  .notes-search-date
  524  .session-tag-remove:hover
  670  .quick-ref-section-title
 1283  .dms-stat-warning .dms-stat-value
 2375  .dms-profile-check
 2401  .dms-profile-save
 2405  .dms-profile-save .dms-profile-name
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
 1188  .enc-speed-line
file-backup.css
  243  .backup-entry-restore
initiative.css
   72  .bf-xp
  111  .init-entry.lair .init-name
  237  .init-hp-value.critical
  307  .death-saves-label
 1156  .la-label
 1197  .lr-label
 1265  .init-mob-alive.critical
loot.css
  297  .shop-cat-badge.item
  475  .si-tag-v
  640  .cart-shop-name
  707  .cart-item-total
npcs.css
  236  .npc-detail-location
  904  .npc-name
  985  .npc-popup-name
 1018  .npc-popup-section-title
party.css
 1982  .party-stat-card.critical .party-stat-value
 2249  .rest-heal-preview
 2255  .rest-hd-restore
 2631  .cf-attack-remove:hover
 2780  .char-skill-item.proficient .char-skill-item-name
 2803  .char-skill-item.expertise .char-skill-item-name
spells.css
  148  .spell-material
tools.css
  261  .timer-card-time
  455  .rt-result-label
 1159  .breadcrumb-item:hover
 1472  .sb-remove-btn:hover
welt.css
   61  .wp-session-nr
  272  .wp-detail-header h3
  595  .rs-tagesmarsch
```

### Wie Gruppe E aufzulösen ist

Nicht durch Raten, sondern durch mehr Zustand: die 81 Stellen sind Elemente, die im geseedeten
Zustand nirgends gerendert werden (Würfelergebnisse vor dem ersten Wurf, der
Begegnungs-Rechner, Warenkorb, NPC-Aufklapper, das mobile Layout, Rastdialog-Details). Wer den
Messlauf um die fehlenden Zustände erweitert, bekommt für jede dieser Stellen dieselbe Antwort
wie für die 181 umgestellten. Der Messaufbau liegt bei und ist wiederverwendbar.

---

## W1-D-02 — Fünf Tönungsstellen, die Schritt 10 einzeln nachgerechnet hat, plus eine Vorziehung

**Status: GESCHLOSSEN am 2026-09-29 durch Welle 2, Schritt 8 (D-4/E2).** Der Nachtrag ganz unten
führt die neuen Zahlen; alles darüber ist der Stand VOR Schritt 8 und bleibt stehen, weil die
Begründungskette sonst nicht mehr lesbar wäre.
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

> **Berichtigung, Schritt 8:** *der einzige Fall* stimmt nicht. Es sind **drei**, und der dritte
> stand in keiner Liste dieser Welle: `dashboard.css` `.char-save-box.proficient` (Gold auf Grün)
> war als zweiter bekannt, `spells.css` `.editor-btn:hover` (Gold auf Gelb) hat erst die erweiterte
> R-04 gefunden. Alle drei sind entschieden: die fremde Rolle bleibt, gedeckelt wird die Stärke,
> und die Schrift nimmt ihre Textvariante.

### Nachtrag 2026-09-29 (Welle 2, Schritt 8) — alle sechs Zeilen sind erledigt

Entscheidung **E2** setzt die Tinte auf `var(--<rolle>-text)` und deckelt die Stärke je Theme auf
**13 / 7 / 7 / 20 %** (`--tint-max` in `variables.css`). Gemessen mit
`tests/unit/helpers/wcag-contrast.js`, min über `--bg-card`/`--bg-dark`/`--bg-elevated` — das ist
die Zählweise, mit der der Deckel gerechnet ist, und sie ist eine andere als die vierflächige
Zählung der Tabelle weiter oben (dazu der eigene Punkt **W2-D-01**):

| Selektor | Datei | vorher → nachher (dark · light · sepia · contrast) |
| -------- | ----- | -------------------------------------------------- |
| `.dice-fav-add:hover` | dice.css | 6,02 · 2,43 · 4,91 · 8,91 → 6,02 · 4,78 · 5,13 · 8,91 |
| `.ds-rate-chip.ds-crit` | tools.css | 6,35 · 2,32 · 2,25 · 8,16 → 6,66 · 4,67 · 4,74 · 8,16 |
| `.ds-rate-chip.ds-fumble` | tools.css | 3,49 · 3,17 · 3,02 · 3,67 → 4,81 · 4,55 · 4,60 · 5,28 |
| `.wiki-link` (Ruhe) | dashboard.css | 6,65 · 2,62 · 2,24 · 11,81 → 6,65 · 4,59 · 4,55 · 11,81 |
| `.editor-btn.format-active`, `[aria-expanded='true']` | editors.css | 5,06 · 2,25 · 4,47 · 7,09 → 5,65 · 4,78 · 5,26 · 7,09 |

`.ds-rate-chip.ds-fumble` — die Zeile, die in **keinem** Theme 4,5 hielt, auch nicht mit der
Textvariante — hält jetzt in allen vieren. Die Abhilfe war, wie diese Akte seit dem 2026-09-28
vermutet hat, die **Stärke** und nicht die Tinte.

Der R-05-Eintrag zu `editors.css:69` ist im selben Commit **ersatzlos entfernt**; er war der
einzige `ausnahme`-Posten dieser Ratsche. Die Vorziehung `loot.css`
`.loot-tag-chip input:checked + span` ist wie angekündigt **nicht** ein zweites Mal angefasst
worden — nur die Tönung ihrer Elternregel ist mitgedeckelt.

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

**Stand:** 2026-09-29, Welle 2 Schritte 4–6. **ERLEDIGT in Schritt 7**, und zwar für die drei
Literale verschieden: die Bernsteinfläche bleibt als geführte Ausnahme in `R10_AUSNAHMEN`, die
beiden `13,13,13`-Stellen sind auf `var(--on-yellow)` aufgelöst. Begründung unten unter
„Was zu entscheiden ist"; der Ausschlag gab, dass `13,13,13` ein **Theme**-Token
(`--bg-dark@dark`) auf einer themenunabhängigen Fläche war — genau die Schieflage, die Welle 1 an
der Tinte behoben hat — während die Fläche selbst die Voraussetzung jener Messung ist.
Der folgende Text ist der Stand von Schritt 6 und bleibt als Beleg stehen.

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

> **ERLEDIGT in Schritt 7.** Alle sechzehn sind nach Zweck entschieden. Fünfzehn haben eine
> Theme-Rolle bekommen (`--purple`, `--green`, `--yellow`, `--orange`, `--blue`, `--red`,
> `--border`); genau **eine** bleibt auf einer Skala und ist als einziger Eintrag in
> `R12_AUSNAHMEN` begründet: `bestiary.css` `.bestiary-attr-cell` auf `--ra-parchment-rule`, weil
> die `--ra-*`-Skala dort keine fremde Bedeutung ist, sondern das Pergament selbst.
> Der folgende Text ist der Stand von Schritt 6 und bleibt als Beleg stehen.

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

**Status: ERLEDIGT am 2026-09-29 durch Welle 2, Schritt 8.** Alle 17 Paare gehören zu den
Tönungsstellen, die E2 gedeckelt hat; keines liegt danach noch unter 4,5. Der Punkt bleibt als
**Eingangsdatum** stehen, weil er die Zählweisenfrage aufgeworfen hat, die jetzt als **W2-D-01**
weiterläuft. Der Abschluss steht am Ende.

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

### Abschluss 2026-09-29 (Schritt 8)

Alle vier Folgerungen sind ausgeführt. Über die **drei** Trägerflächen gerechnet, mit denen der
Deckel belegt ist, liegen die drei Gruppen jetzt so (vorher → nachher, dark · light · sepia ·
contrast):

- Gold auf Gold, 30 % (`mark`, `.notes-search-excerpt mark`): 3,89 · 2,02 · 3,63 · 5,05 →
  5,66 · 4,78 · 5,13 · 6,74. Der schlechteste Abfall der Liste ist damit nicht nur zurückgeholt,
  sondern in Sepia **besser als vor Welle 2**.
- Gold auf Gold, 14–20 % (acht Regeln in core/dashboard/editors/loot/party/tools): alle zwischen
  5,66 · 4,78 · 5,13 · 6,74 und 5,66 · 4,78 · 5,13 · 7,78.
- Grün auf Grün, 30 % (`.condition-badge.poisoned`) 4,38 · 2,00 · 1,97 · 5,30 →
  6,66 · 4,67 · 4,74 · 7,09; Gold auf Grün (`.char-save-box.proficient`)
  4,66 · 2,18 · 4,76 · 6,94 → 5,52 · 4,75 · 5,33 · 6,94.

Folgerung 1 — die Kontrastbuchhaltung ist je Theme zu führen — ist eingehalten: jede Zahl dieses
Schritts steht als Viererreihe, keine ist über die Themes minimiert. Folgerung 3 (`mark`
vorziehen) ist erledigt; die **Verlagerung** der Weltregel aus einer Widget-Datei bleibt Welle 4.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
node -e "const W=require('./tests/unit/helpers/wcag-contrast.js');console.log(W.selfTest())"
grep -n "mark {" assets/styles/dmscreen.css
grep -rn "color-mix(in srgb, var(--gold)" assets/styles/*.css
```

---

## W2-B-05 — Der `@supports`-Auftrag von Schritt 11 nennt 6 Tokens; die Klasse hat 15

**Stand:** 2026-09-30, Welle 3 Schritt 9 — **ENTSCHIEDEN**: die neun bekommen **keinen** Rückfall,
bewußt und mit nachgemessenem Preis für den Gegenweg (Commits `49695bd`, `dcd8365`). Schritt 11 der
Welle 2 hatte die sechs von E4 benannten abgesichert, die neun aus Schritt 3 nicht. Der **zweite**
Nachtrag am Ende dieses Punktes führt die Entscheidung, ihre Gründe und den exakt bezifferten
Rückweg.

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

**6** der 22 Stellen sind **Modalblenden** — es sind genau die `--scrim-*`-Nutzungen:

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


### Nachtrag Schritt 11 (2026-09-29) — sechs abgesichert, neun offen, und die Lage hat sich verändert

Schritt 11 hat den Geltungsbereich **nicht** eigenmächtig erweitert: die Schrittanweisung sagt
wörtlich „@supports NUR um die 6 abgeleiteten Tokens", die Abnahmebedingung wiederholt es, und
eine Erweiterung ist eine Entscheidung des Nutzers bzw. des Orchestrators, keine des ausführenden
Schrittes. Umgesetzt ist deshalb genau das Angeordnete:

```css
@supports not (color: color-mix(in srgb, #000 50%, #fff)) {
    :root { --gold-hover: var(--gold); … --orange-dim: var(--orange); }
}
```

Der Rückfall setzt die **Rolle**, kein Literal — ein Hex wäre themenblind und in drei von vier
Themes die falsche Farbe. `R-13` fällt dadurch von 15 auf **9**: die sechs sind nicht mehr
rückfalllos, die neun aus Schritt 3 sind es weiterhin, und sie tragen ausgerechnet die sechs
Modalblenden. (Seit Welle 3 Schritt 2 steht `R-13` wieder bei **13**: die vier Leuchtfarben
`--glow-gold`, `--glow-yellow`, `--glow-green` und `--glow-red` sind dazugekommen.)

**Was sich seit der Aufnahme dieses Punktes geändert hat:** der Browserboden ist jetzt
aufgeschrieben (`DEVELOPMENT.md`, Abschnitt „Browser-Mindestanforderung"). Er liegt bei
Chromium/Edge 121 und Firefox 121 — nicht wegen `color-mix` (111/113), sondern wegen
`scrollbar-color` und sechs `:has()`-Regeln, die beide **älter** im Baum sind. Ein Browser, der
`color-mix` nicht kennt, würde also schon an zwei anderen Stellen scheitern. Das Restrisiko der
neun ist damit **theoretisch**, nicht praktisch — es bleibt trotzdem eine ungleiche Behandlung
zweier Hälften derselben Klasse, und genau das ist der Grund, warum der Punkt offen bleibt statt
abgehakt zu werden.

**Zu entscheiden bleibt** (Welle 3): den Zweig um die neun erweitern — ein Einzeiler je Token, in
demselben Block, `R-13` würde dabei auf 0 fallen und müsste dann als leeres Inventar begründet
werden. — _Diese letzte Zahl ist seit Welle 3 Schritt 2 überholt: `R-13` steht bei **13**, nicht bei
9 (die vier Leuchtfarben `--glow-*` sind dazugekommen), und fiele bei einer Erweiterung auf **4**,
nicht auf 0. Entschieden ist im zweiten Nachtrag darunter._

### Zweiter Nachtrag, Welle 3 Schritt 9 (2026-09-30) — entschieden: kein Rückfall, Preis gemessen

**Die neun bleiben ohne `@supports`-Rückfall.** Das ist ab jetzt eine Entscheidung, kein Aufschub.
Der Bestand, an diesem Tag frisch gezählt und nicht abgeschrieben:

| Größe                                | Zahl   | Befehl                                                                  |
| ------------------------------------ | -----: | ----------------------------------------------------------------------- |
| Definitionen in `variables.css`      | **9**  | `grep -cE "^\s*--(overlay-(faint\|weak\|mid\|strong\|heavy)\|scrim-..)\s*:" assets/styles/variables.css` |
| echte Nutzungen per `var()`          | **22** | 23 Rohtreffer minus **eine Nennung im Kommentar** von `tools.css`       |
| davon Modalblenden                   | **6**  | alle `var(--scrim-*)`-Nutzungen                                          |

**Grund 1, gemessen: der Zweig feuert oberhalb des Browserbodens nirgends.** Der Boden liegt bei
Chromium/Edge 121 und Firefox 121 (`DEVELOPMENT.md`), und zwar wegen `scrollbar-color` und sechs
`:has()`-Regeln — nicht wegen `color-mix` (111/113). Ein Rückfall kauft also für keinen Browser
etwas, den dieses Projekt als Ziel führt.

**Grund 2, gerechnet: für diese neun gibt es keinen Rollenrückfall.** Die sechs von E4 fallen auf
ihre Basisrolle zurück („die Rolle selbst, kein Literal" — ein Hex wäre themenblind und in drei von
vier Themes falsch). Die neun **sind** themenblind: absichtlich Weiß bzw. Schwarz mit einem
Deckungsanteil, ohne Rolle, auf die man zeigen könnte. Der einzige **exakte** Rückfall ist damit ein
`rgba()`-Tripel, und ein deckendes `#fff` wäre dort, wo der Zweig feuert, aktiv falsch: eine
2-%-Auflage würde zur weißen Fläche.

**Der Preis des `rgba()`-Wegs ist nachgemessen, nicht geschätzt.** Die neun Zeilen probehalber in den
Zweig eingesetzt, `R-10` und `R-13` gefahren, danach zurückgenommen:

| Ratsche | Zusicherung                                                       | vorher | mit Rückfall |
| ------- | ----------------------------------------------------------------- | -----: | -----------: |
| R-10    | `rgba()`-Tripel in `variables.css` (hart gepinnt, `toBe`)          |     12 |       **21** |
| R-13    | Inventar der rückfalllosen `color-mix`-Tokens                      |     13 |        **4** |
| R-13    | Tokens im verneinten `@supports`-Zweig                             |      6 |       **15** |

Drei Zusicherungen in zwei Ratschen also, deren Zweck genau dieses Sichtbarmachen ist — für einen
Gurt an einem Träger, den kein Zielbrowser braucht. **Der Rückweg ist damit exakt beziffert**: neun
Zeilen in dem Zweig plus die drei Zahlen 12 → 21, 13 → 4 und 6 → 15. Wer die Entscheidung umdreht,
weiß vorher, was sie kostet.

**Was die Klasse weiter bewacht:** `R-13` führt die neun unverändert als Inventar. Ein sechzehnter
Token dieser Bauart geht rot, ein verschwundener auch. Die Ungleichbehandlung der zwei Hälften
bleibt also sichtbar; sie ist nur nicht mehr offen, sondern begründet. Die Begründung steht
zusätzlich am Zweig selbst in `assets/styles/variables.css` und im Abschnitt „Was unterhalb des
Bodens passiert" von `DEVELOPMENT.md` — bis Schritt 9 nannte auch dieses Dokument den Punkt „offen",
und ein zweites Dokument, das einer Entscheidung widerspricht, macht sie unauffindbar.

---

## W2-C-01 — `.modal` ist in Light und Sepia unlesbar; die Abhilfe ist bekannt und darf trotzdem nicht nebenbei fallen

**Stand:** 2026-09-29, Welle 2 Schritt 7. Offen, bewusst nicht umgestellt. Geführte Ausnahme in
`R10_AUSNAHMEN`.

### Worum es geht

`assets/styles/dmscreen.css` `.modal` trägt `background: rgba(26, 26, 26, 0.95)`. Das Tripel ist
zeichengleich `--bg-card` im **Dark**-Block. Es ist die **einzige** Flächenquelle für die
Modal-Schachtel im ganzen Baum — 19 Vorkommen von `class="modal"` in den Templates, und keine
andere Regel setzt dort einen Hintergrund (`core.css:139` und `file-backup.css:174` setzen nur
Geometrie, `dashboard.css:226` nur `transform`).

Die Tinten auf dieser Fläche folgen dem Theme sehr wohl. Gemessen über `--bg-dark`, alle vier
Themes, heute und mit `color-mix(in srgb, var(--bg-card) 95%, transparent)`:

| Tinte | dark | light | sepia | contrast |
| ----- | ---- | ----- | ----- | -------- |
| `var(--text)` heute | 13,32 | **1,14** | **1,41** | 17,58 |
| `var(--text)` umgestellt | 13,32 | 17,40 | 10,15 | 19,03 |
| `var(--text-dim)` heute | 4,96 | **2,67** | **2,70** | 7,57 |
| `var(--text-dim)` umgestellt | 4,96 | 5,74 | 5,28 | 8,19 |
| `var(--gold)` heute | 8,36 | 4,71 | **2,18** | 12,54 |
| `var(--gold)` umgestellt | 8,36 | **3,25** | 6,53 | 13,57 |

**1,14 heißt: der Fließtext jedes Modals ist im Light-Theme unsichtbar.** Das ist rechnerisch
schlechter als jede Stelle, die Welle 1 angefasst hat, und schlechter als das Ereignis-Log
(1,07 ist knapp darunter, betrifft aber eine Anzeige, nicht jedes Formular der Anwendung).

### Warum Schritt 7 es trotzdem stehen lässt

Die Umstellung ist keine Literal-Auflösung mehr, sondern eine Gestaltungsentscheidung:

1. Sie ändert **jedes Modal der Anwendung** in drei von vier Themes sichtbar.
2. Die Tinten kommen aus rund zwanzig Dateien, nicht aus `dmscreen.css`. Mindestens eine
   verschlechtert sich nachweislich: `var(--gold)` in Modal-Überschriften fällt in Light von 4,71
   auf 3,25. Das ist derselbe Preis wie bei `.fdp-title` — dort war er zahlbar, weil **alle**
   Tinten des Panels in **einer** Datei lagen und in einem Zug mitgemessen werden konnten.
3. `backdrop-filter: blur(12px)` auf einer nun hellen Fläche ist eine optische Frage, die keine
   Kontrastrechnung beantwortet.

### Was zu entscheiden ist

Entweder `.modal` bekommt `color-mix(in srgb, var(--bg-card) 95%, transparent)` — dann müssen im
selben Zug alle `var(--gold)`-Tinten, die auf einem Modal sitzen, auf `var(--gold-text)` gezogen
und gemessen werden — oder die Fläche bleibt dunkel, dann braucht sie themenblinde Tinte-Tokens
wie das Ereignis-Log unter **E6** (`--on-modal`, `--on-modal-dim`), und zwar für alle Tinten, die
darauf liegen. Die zweite Variante ist die kleinere Sichtänderung und die größere Token-Arbeit.

Die Vier-Themes-Runde in Schritt 11 ist der natürliche Ort für die Sichtprobe.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -rn "\.modal\s*{" assets/styles/*.css
grep -c 'class="modal"' assets/templates/*.html
npx jest tests/unit/design-consistency.test.js -t "kein rgba"
```

---

### Nachtrag 2026-09-29 (Schritt 10): die Frage ist größer als der Fließtext

Schritt 10 hat beim Nachsehen der Trägerflächen festgestellt, dass auch die **Verweis-Vorschau**
(`systems/entity-links.js`) auf dieser Fläche liegt — samt einer zweiten, abweichenden
Seltenheitstabelle. Dort ist zusätzlich **gemessen**, dass die naheliegende Abhilfe genau falsch
herum wäre: `--<rolle>-text` ist in Light und Sepia die abgedunkelte Fassung und fällt auf dieser
dunklen Fläche von 2,93–5,25 auf 2,65–2,72. Die Zahlen und die Doppelführung stehen in **W2-E-02**.
Wer diesen Punkt entscheidet, entscheidet den dort mit.

---

## W2-C-02 — Vier Regeln fallen durch Schritt 7 in **Dark** unter 4,5; alle vier sind D-4-Stellen

**Status: GESCHLOSSEN am 2026-09-29 durch Welle 2, Schritt 8.** Alle vier halten jetzt 4,5 in
allen vier Themes. Die `W2C02`-Liste in R-11 ist im selben Zug entfallen, weil R-04 dieselben vier
Regeln seither mit derselben Schwelle beurteilt, nur härter: 4,5 statt *nicht schlechter als
gestern*. Nachtrag III unten führt die Zahlen.

### Worum es geht

Schritt 7 ersetzt palettenfremde Tönungen durch die Rolle, die die jeweilige Regel ohnehin als
Tinte führt. Wo das fremde Literal **dunkler** war als die Rolle, hellt die Tönung dadurch auf und
der Kontrast zur gleichfarbigen Tinte sinkt. In vier Regeln überschreitet das die 4,5 — und zwar
ausschließlich im **Dark**-Theme:

| Stelle | Tinte | dark | light | sepia | contrast |
| ------ | ----- | ---- | ----- | ----- | -------- |
| `encounters.css` `.calc-diff-badge.trivial` | `--blue` | 4,51 → **4,22** | 3,52 → 3,24 | 2,45 → 2,38 | 3,11 → 3,32 |
| `initiative.css` `.concentration-badge` (Kopf) | `--purple` | 4,84 → **4,03** | 3,51 → 3,50 | 3,05 → 3,18 | 4,36 → 4,21 |
| `party.css` `.wiki-tree-item.selected` | `--purple` | 4,76 → **4,41** | 3,94 → 3,78 | 3,43 → 3,37 | 4,27 → 4,48 |
| `party.css` `.wiki-detail-category` | `--purple` | 4,76 → **4,41** | 3,94 → 3,78 | 3,43 → 3,37 | 4,27 → 4,48 |

### Warum das kein neuer Befund ist

Alle vier gehören schon vorher zu den **108 D-4-Stellen** — sie sind in der Zählung des Plans als
„palettenfremdes Literal derselben Familie" (19 der 108) geführt. Sie fielen vor Schritt 7 in
**drei** von vier Themes durch und fallen jetzt in vier. Schritt 8 bringt nach **E2** alle 108 auf
≥ 4,5 in allen vier Themes, mit Tönungsdeckel **Dark 13 %** — für `--purple` gerechnet 4,56.

### Warum Schritt 7 es nicht selbst repariert

Die Abhilfe ist in allen vier Fällen die **Tönungsstärke**, nicht die Rolle. Stärken sind
ausdrücklich Gegenstand von D-4/E2; eine Vorwegnahme an vier von 108 Stellen wäre eine halbe
Entscheidung und ließe die Ratschen von Schritt 8 auf einem Mischbestand urteilen. Ein Wechsel nur
der Tinte hilft in Dark nicht: gemessen bringt `--purple-text` dort **dieselben** 4,03 bzw. 4,41,
weil `--purple-text` im Dark-Block auf denselben Wert auflöst.

### Nachtrag I (Prüfung W2-C, Runde 1): „genau vier" gilt nur für **Dark**

Zwei weitere Tinte/Tönung-Paare stehen auf den Goldflächen von `tools.css` und waren in der
Goldtabelle nicht geführt, weil sie weder die geerbte `--text`- noch die `--gold`-Tinte sind:
`var(--text-dim)` an `.search-result-preview` und an `.quick-access-item:hover .remove-btn`, beide
auf der 10-%-Tönung.

Gegen ihre **tatsächliche** Trägerfläche `var(--bg-card)` (`.wiki-search-dropdown` bzw.
`.wiki-quick-access` führen sie ausdrücklich) halten beide: 3,90 · 5,52 · 5,16 · 6,62 → 4,10 · 5,19
· 4,58 · 6,62. Dark liegt unter 4,5 und lag es vorher ebenso — verbessert, nicht verursacht.

Nach der Hauszählweise **D-2** (min über `--bg-card`/`--bg-dark`/`--bg-elevated`), mit der diese
Welle jede andere Zahl belegt, lesen dieselben Paare dagegen 3,38 · 4,58 · 4,51 · 5,38 → 3,56 ·
4,28 · 3,98 · 5,38: **Light und Sepia wechseln von ≥ 4,5 auf < 4,5.** Die Überschrift dieses Punkts
stimmt damit weiter für das Dark-Theme, aber die Aussage „genau vier neue Unterschreitungen"
braucht diese Einschränkung. Beide Zahlenreihen stehen im Goldkommentar von `tools.css`.

Abhilfe gehört zu Schritt 8: `--text-dim` ist die blasseste Tinte des Projekts, die Stärke der
Goldtönung ist D-4/E2-Gegenstand.

### Nachtrag II (Prüfung W2-C, Runde 1): **keine Ratsche deckte diese vier Befunde**

Sie stehen in dieser Akte, weil sie von Hand nachgerechnet wurden — nicht, weil ein Test sie
gemeldet hätte. `ruheRegeln()` in R-04 siebt die zu beurteilende Menge mit
`flaeche.match(/^var\((--[\w-]+)\)$/)` und wirft damit **jede** `color-mix`-Tönung weg, bevor
gerechnet wird. Belegt per Mutation im Spiegel: `.calc-diff-badge.trivial` von 20 % auf 95 %
gestellt (Kontrast fällt auf rund 1,0 in allen vier Themes) — `npx jest` meldet **keinen**
zusätzlichen roten Test.

Seit Runde 1 gilt:

- **R-11** (`design-consistency.test.js`) deckt die hier bezifferten Stellen ab. Die vier Zeilen der
  Tabelle oben stehen dort als `W2C02` mit denselben Zahlen; fällt eine weiter, ist der Test rot.
  Erreicht eine ≥ 4,5, verlangt er, die Zeile hier zu streichen.
- **Der blinde Fleck selbst ist beziffert:** 128 Regeln setzen Tinte auf eine Tönung, und R-04
  urteilt über keine davon. R-11 friert die Zahl ein, damit sie nicht lautlos wächst.
- **Offen bleibt die vollständige Abhilfe:** `ruheRegeln()` so erweitern, dass eine Fläche der Form
  `color-mix(in srgb, var(--x) N%, transparent)` über den drei neutralen Trägerflächen aufgelöst
  statt verworfen wird (`WCAG.resolveOver()` kann die Form längst). Mit der 4,5-Schwelle gemessen
  fallen danach **124 von 128** Regeln durch — das ist genau die Menge, die D-4/E2 in Schritt 8
  behandelt. **Die Erweiterung ist deshalb die rote Ratsche, mit der Schritt 8 beginnt**, nicht eine
  Nachbesserung von Schritt 7.

### Nachtrag III (Schritt 8): die vier Zahlen, und was aus dem blinden Fleck wurde

| Selektor | Datei | vorher → nachher (dark · light · sepia · contrast) |
| -------- | ----- | -------------------------------------------------- |
| `.calc-diff-badge.trivial` | encounters.css | 4,22 · 3,24 · 2,38 · 3,32 → 4,84 · 4,64 · 4,63 · 4,53 |
| `.concentration-badge` (Kopf) | initiative.css | 4,03 · 3,50 · 3,18 · 4,21 → 4,56 · 4,57 · 4,60 · 4,73 |
| `.wiki-tree-item.selected` | party.css | 4,41 · 3,78 · 3,37 · 4,48 → 4,56 · 4,57 · 4,60 · 5,05 |
| `.wiki-detail-category` | party.css | 4,41 · 3,78 · 3,37 · 4,48 → 4,56 · 4,57 · 4,60 · 5,05 |

`--purple` ist die **bindende** Rolle des Dark-Deckels: 13 % ergeben 4,56, 14 % nur noch 4,48. Die
drei Violettstellen liegen damit auf der knappsten Kante der ganzen Klasse — wer den Dark-Deckel je
anhebt, bricht zuerst hier.

**Der blinde Fleck ist geschlossen.** `ruheRegeln()` in R-04 löst die Tönung seit Schritt 8 über den
drei neutralen Trägerflächen auf, statt sie zu verwerfen. Die Erweiterung war bei ihrer Geburt rot
mit **116 Befunden** (114 unter 4,5, 2 nicht auflösbar) und ist am Ende des Schritts grün: 288
beurteilte Regeln, davon 128 Tönungen, 0 Befunde, ohne einen einzigen neuen Eintrag in
`RUHE_AUSNAHME`. Nachtrag II oben schätzte *124 von 128*; gemessen waren es 116, weil die zehn
farblosen Marken und zwei weitere schon hielten.

Nachtrag I (die zwei `var(--text-dim)`-Stellen auf der Goldtönung) ist damit **nicht** erledigt. Er
läuft als **W2-D-02** weiter: der Deckel ist dort nachweislich nicht die Abhilfe.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "calc-diff-badge.trivial" assets/styles/encounters.css
grep -n "wiki-tree-item.selected\|wiki-detail-category" assets/styles/party.css
npx jest tests/unit/design-consistency.test.js -t "R-11"
```

---

## W2-C-03 — Zwei Klassen heißen gleich und sind verschieden gefärbt; Schritt 7 hat das nicht aufgelöst

**Stand:** 2026-09-29, Welle 2 Schritt 7. Nur vermerkt, keine Arbeit in dieser Welle.

`encounters.css` `.list-trigger-item.triggered` und `npcs.css` `.npc-trigger-item.triggered`
bezeichnen denselben Zustand — ein Auslöser hat ausgelöst — und trugen zwei verschiedene fremde
Farben (`46,204,113` Flat-UI-Grün, `234,179,8` Tailwind-Gelb). Schritt 7 entscheidet **je Regel
nach ihrem Zweck** und hat deshalb die jeweils nächstliegende Rolle gesetzt: Grün bzw. Gelb. Die
Vereinheitlichung wäre eine Sichtänderung an einer der beiden Ansichten und gehört nicht in einen
Schritt, der Literale auflöst. In beiden Dateien steht ein Kommentar.

Dasselbe gilt für die Doppelführung `.condition-*` (`core.css`) / `.condition-badge.*`
(`dmscreen.css`), die **D-05** in Welle 4 zusammenlegt: sie trug für die vier farblosen Zustände
**vier** verschiedene Grautöne (`100,100,100` · `120,113,108` · `107,114,128` · `156,163,175`) und
steht jetzt in beiden Dateien geschlossen auf einer 30-%-Tönung von `var(--text-dim)` mit
`var(--text)` als Tinte. Wer sie zusammenlegt, findet damit erstmals zwei identische Fassungen vor.

**Berichtigung, Prüfung W2-C Runde 1:** dieser Satz stimmte bis dahin nicht. Beide Dateien standen
zwar auf `--border`, führten für `petrified` aber **zwei verschiedene Tinten** — `core.css`
`var(--text-dim)`, `dmscreen.css` `var(--text)`. Die Angleichung beider Achsen (Befund 1 derselben
Prüfung) hat das mit erledigt.

---

## W2-C-04 — Sichtliste für die Vier-Themes-Runde in Schritt 11

**Stand:** 2026-09-29, Welle 2 Schritt 7. Offen bis Schritt 11. Eine Liste, kein Befund.

Schritt 11 verlangt eine Sichtprobe „gegen die drei benannten Punkte, nicht als ungeführte
Vollrunde". Bis hierher gab es keine Stelle, an der die sichtbaren Änderungen der Welle gesammelt
werden; die Abnahmebedingung von Schritt 7 nennt eine „Sichtliste", die es noch nicht gab. Hier
ist sie. Alles andere dieser Welle ist **farbneutral** (gleicher Wert, andere Schreibweise) und
braucht keinen Blick.

| Stelle | Was sich ändert | Sichtbar in |
| ------ | --------------- | ----------- |
| `dice.css` `.floating-dice-panel` + `.fdp-title` | Feste dunkle Karte → `var(--bg-card)`; Titel `--gold` → `--gold-text`. **Die größte Sichtänderung der Welle.** Vorher war der Fließtext dieses Panels in Light (1,04) und Sepia (1,51) unsichtbar. | light, sepia |
| `dice.css` `.fdp-die.d20` | **E1.** Light-`--red` → eigene Rotrolle; dunkles Verlaufsende `--ra-crimson-rule` → `--red-dark`. In Dark sichtbar heller (`dc2626` → `ef4444`). | alle vier |
| `spells.css` `.spell-card-header` (Ruhe und Hover) | **E1.** Light-`--purple` → eigene Violettrolle. In Dark sichtbar heller (`7c3aed` → `a78bfa`). | alle vier |
| `tools.css`, sechs Goldstellen | **E1.** Münzgold `255,215,0` → Akzentgold `var(--gold)`. Nur im Contrast-Theme identisch, sonst wärmer und dunkler. | dark, light, sepia |
| `tools.css` `.search-result-preview mark` | Tinte `--gold` → `--text`. Hält dadurch erstmals in allen vier Themes (vorher in dreien durchgefallen). | alle vier |
| `tools.css` `.sb-progress` | `rgba(127,127,127,0.25)` → 20-%-Tönung von `var(--text-dim)`. Reproduziert die alte Laufschiene fast zeichengleich (Light `#cecece` identisch, Dark `#393939` statt `#3c3c3c`) und folgt dabei dem Theme. **Kaum sichtbar — der Blick gilt dem goldenen Fortschrittsbalken darauf.** | alle vier |
| `core.css` / `dmscreen.css` / `initiative.css`, die zehn farblosen Marken | Vier verschiedene Fremdgrau → 20-/30-%-Tönung von `var(--text-dim)`, **Tinte jetzt `var(--text)` statt `var(--text-dim)`**. Die Beschriftung der farblosen Zustände und der neutralen Beziehungsmarke liest sich damit kräftiger als bei den farbigen Geschwistern; die Fläche liegt wieder auf dem Stand vor der Welle. **Die zweitgrößte Sichtänderung der Welle.** | alle vier |
| `encounters.css` Schwierigkeitsskala, `initiative.css` Konzentration/Gelände, `party.css` Wiki-Violett und Cyan-Marken, `npcs.css`, `welt.css`, `dashboard.css` | Flat-UI- bzw. Tailwind-Literale → die Rolle, die die Regel ohnehin als Tinte führt. Jeweils ein kleiner Farbton-Versatz, keine Umfärbung. | alle vier |
| `welt.css` `.tl-typ-reise` (aus **W2-A**) | `#22c55e` → `var(--green)`. Beziffert: dark 5,64 → 5,26 · light 2,20 → 2,11 · sepia 2,13 → 2,07 · contrast 7,16 → 6,53. Schritt 8 holt das mehr als zurück (siehe unten). | alle vier |

### Nachtrag Schritt 8 (2026-09-29) — die eine beabsichtigte Sichtänderung der Welle

| Stelle | Was sich ändert | Sichtbar in |
| ------ | --------------- | ----------- |
| **Alle 113 Tönungsstellen, Fläche** | **E2.** Die Stärke wird je Theme gedeckelt: Dark 13 %, Light 7 %, Sepia 7 %, Contrast 20 %. In **Light und Sepia** sinkt sie damit von heute 10–30 % auf 7 % und ist **fast unsichtbar**: die Marke wird dort zu farbiger Schrift auf nahezu blanker Karte. In Dark sinkt sie von 14–30 % auf 13 % (10 % und 12 % bleiben stehen), in Contrast nur von 30 % auf 20 %. **Das ist die einzige beabsichtigte Sichtänderung dieses Schritts und der ganzen Welle.** | **light, sepia** (stark), dark/contrast (schwach) |
| **Alle 113 Tönungsstellen, Schrift** | **E2.** `var(--<rolle>)` → `var(--<rolle>-text)`. In **Dark und Contrast** ist das für sieben der zehn Rollen dieselbe Farbe und damit unsichtbar; in **Light und Sepia** wird die Schrift durchweg dunkler und satter. Zusammen mit der schwächeren Fläche liest sich die Rolle dort künftig über die Schrift. | light, sepia |
| `dmscreen.css` die fünf `.dms-skill-header` | Die Attributköpfe der Fertigkeitenliste verlieren ihre **Schriftfarbe**: `var(--attr-*)` → `var(--text)`. Die 20-%-Tönung bleibt unverändert und trägt die Zuordnung allein. Grund: die Attributfarben sind nach D-5 in Dark und Contrast eingefroren und erreichen dort schon auf der blanken Fläche nur 3,98–4,35. | alle vier |
| `core.css` `.condition-prone` | Rolle wechselt von `--orange-dim` auf `--orange` und wird dadurch **heller** — dieselbe Farbe wie `grappled` und `restrained` und wie die Zwillingsregel `.condition-badge.prone` in `dmscreen.css`. | alle vier |
| `welt.css` `.tl-typ-reise` | Der Verlust aus W2-A ist zurückgeholt und übertroffen: 6,35 · 2,32 · 2,25 · 8,16 → 6,66 · 4,67 · 4,74 · 8,16. | light, sepia |
| Die drei Stellen mit **fremder Rolle** | `.wiki-link` (Cyan auf Violett), `.char-save-box.proficient` (Gold auf Grün), `.editor-btn:hover` in `spells.css` (Gold auf Gelb). Die Farbpaarung bleibt **absichtlich** erhalten; nur Stärke und Schriftvariante ändern sich. | light, sepia |

### Nachtrag Schritte 16/18 (2026-09-29, Prüfung W2-D Runde 1) — zwei Tönungen **im Verlauf**

Beide waren von der Deckelung der Schritte 8–15 ausgenommen, **ohne dass das jemand entschieden
hätte**: ihre Tönung steht als Stopp in einem `linear-gradient(…)`, und alle Bestandslisten der
Welle haben freistehende Tönungen gezählt. Sie folgen jetzt derselben Regel wie die übrigen 113.

| Stelle | Was sich ändert | Sichtbar in |
| ------ | --------------- | ----------- |
| `spells.css` `.spell-note` | **E2, nachgezogen.** Verlaufsstopp `--yellow` 10 % → 7 % (Light/Sepia), Tinte `--gold` → `--gold-text`. Die Notizzeile jedes Zaubers (`spell-manager.js:202`). Vorher Light 2,45, jetzt 4,78. Der Zwilling `.editor-btn:hover` in derselben Datei war in Schritt 15 schon umgestellt. | light, sepia |
| `initiative.css` `.concentration-check-banner` + `.conc-dc` | **E2, nachgezogen.** Beide Verlaufsstopps (`--yellow`, `--purple`) 15 % → 7 % (Light/Sepia), Tinte der DC-Zahl `--gold` → `--gold-text`. Vorher Light 2,35 (Kopf) bzw. 2,16 (Fuß), jetzt 4,78 bzw. 4,62. Vierter **Quergriff** der Welle, jetzt unter R-14. | light, sepia |

**Worauf beim Blick zu achten ist:** ob eine Marke in Light und Sepia noch als Marke erkennbar
ist. Der Kontrast der Schrift ist gemessen und hält (≥ 4,5 in allen vier Themes, R-04); die
Frage, die eine Messung nicht beantwortet, ist die nach der **Fläche**: 7 % Tönung über
`--bg-card` ergibt einen Abstand von rund 1,05 zur Karte. Das ist gewollt (E2 nennt es
ausdrücklich als Preis), aber es ist die Stelle, an der der Nutzer widersprechen könnte.

### Zwei Nebenwirkungen, die zu W2-B-01 gehören

Seit die Fläche des Würfel-Panels dem Theme folgt, sind der Trennstrich in `.fdp-header` und die
Hover-Fläche von `.fdp-close` in **Light und Sepia unsichtbar** — beide stehen auf
`var(--overlay-mid)`, und die Auflagen-Leiter ist themenblind Weiß. Das ist keine neue Baustelle,
sondern genau der in W2-B-01 beschriebene Umschlag; das Panel ist jetzt der erste Ort, an dem er
auffällt. Kein Lesbarkeitsmangel: die Hover-Tinte `var(--text)` hält 17,40 bzw. 10,22.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
PYTHONIOENCODING=utf-8 python build.py
# dist/dnd-tracker-bundled.html öffnen, Theme im Kopf umschalten
```

---

### Nachtrag Schritte 9 und 10 (2026-09-29) — vier sichtbare Stellen, eine davon in allen Themes

| Stelle | Was sich ändert | Sichtbar in |
| ------ | --------------- | ----------- |
| `dashboard.css` `.qref-row:hover` | **E3.** Die Zeile der Schnellreferenz füllt sich beim Überfahren nicht mehr (`--bg-hover`), sondern bekommt einen Umriss (1px `--gold-dim`). **Das ist die einzige Stelle dieser beiden Schritte, die in allen vier Themes anders aussieht.** Der Gewinn: die vier Attributkürzel, die dort in Dark und Contrast auf 3,16–3,58 fielen, liegen jetzt bei 4,52–8,79. Zu prüfen ist nur eines: **ist der Umriss als Hover-Rückmeldung erkennbar, und verwechselt man ihn nicht mit dem Tastaturfokus** (der ist 2px `--gold`). | alle vier |
| `party.css` Ereignis-Log, vier Tinten | **E6.** Meldung, Titel, Knöpfe und Zeitstempel bekommen themenblinde Tinte. In **Dark und Contrast praktisch unverändert** (13,86 → 15,02 usw.); in **Light und Sepia** wird die Anzeige überhaupt erst lesbar (vorher 1,05–3,21). Zu prüfen: dass die Blende selbst unverändert dunkel wirkt und die farbigen Randstreifen ihren Ton behalten. | light, sepia (stark) |
| Schatzkammer, Seltenheitsfarben als Schrift | Gegenstandsname, Detailüberschrift und Zuweisungsliste. In **Dark und Contrast unverändert**; in **Light und Sepia** werden die fünf Töne deutlich dunkler (bis 4,5 auf der schlechtesten Trägerfläche). Zu prüfen: dass die fünf Stufen dort **untereinander** noch unterscheidbar sind — sie liegen nach der Abdunklung enger beieinander als im Dark-Theme. | light, sepia |
| Seltenheitsmarke, Verfolgen-Knopf, drei Pillen der Verweis-Vorschau | Tinte auf voller Akzentfläche: `var(--bg-dark)` → `var(--on-<rolle>)` bzw. `var(--on-rarity)`. In **Light und Sepia** von fast weiß auf fast schwarz — der eigentliche Zweck. In **Dark und Contrast** ein kaum merklicher Rückgang (z. B. 9,24 → 8,98), weil `--on-gold` #111111 ist und `--bg-dark` dort noch dunkler. | light, sepia (stark) |

## W2-C-05 — Der Computed-Style-Sollstand (D-24) ist seit den Tönungsschritten rot; die Playwright-Suite ist es damit auch

**Stand:** 2026-09-29, Prüfung W2-C Runde 1. **Geschlossen in Schritt 11** — der Nachtrag am Ende
dieses Punktes nennt Verfahren, Zahlen und die Begründung der Wegwahl. Nicht von dieser
Prüfeinheit verursacht.

### Worum es geht

`tests/e2e/features/computed-style-diff.spec.js` vergleicht die berechneten Stile gegen den
versionierten Sollstand `tests/e2e/baselines/computed-style-baseline.json`. Die Tönungsschritte
dieser Welle (4–7) ändern berechnete Hintergründe — genau das, wogegen der Wächter steht —, und der
Sollstand ist seither nicht nachgezogen worden. Der Lauf meldet **acht** abweichende Schlüssel:

```
party/button.char-action-btn.primary#0        initiative/div.init-ac#0
shops/button.si-cart-btn#0                    shops/span.shop-item-count#0
data/div.active.campaign-item#0               dmscreen/div.active.dms-init-entry.healthy#0
dicestats/span.ds-crit.ds-rate-chip#0         dicestats/span.ds-fumble.ds-rate-chip#0
```

Weil der Block `test.describe.configure({ mode: 'serial' })` führt, zieht der eine rote Test die
beiden folgenden („Schmales Layout", „Emulierte reduzierte Bewegung") mit: **1 failed, 2 did not
run**. Die volle Suite steht damit bei 378 passed / 1 failed / 7 skipped / 2 did not run statt der
in der Auftragslage genannten 381 / 0 / 7.

### Beleg, dass es nicht aus dieser Prüfeinheit stammt

Gegenprobe im Arbeitsbaum: `git checkout 34e8408 -- assets/styles`, neu gebaut, derselbe Lauf —
**dieselben acht Schlüssel, derselbe eine Fehlschlag**. Keiner der acht Selektoren wird vom Diff
dieser Einheit berührt (`git diff 34e8408..HEAD -- assets/styles` enthält keinen davon). Die
Einheit fügt dem Befund also **null** neue Schlüssel hinzu. Die Basiswerte der Auftragslage sind an
`ba3d3c2` gemessen, nicht an `34e8408`.

### Was zu tun ist, und von wem

Die Datei gehört ausdrücklich zu **Schritt 11** („Sollstand nachziehen"). Zwei Wege sieht der
Wächter selbst vor, und die Wahl gehört zu diesem Schritt, nicht hierher:

- `UPDATE_STYLE_BASELINE=1 npx playwright test tests/e2e/features/computed-style-diff.spec.js`
  erhebt den Sollstand bewusst neu — **erst**, wenn alle Stiländerungen der Welle stehen, sonst
  friert er einen Zwischenstand ein und verschluckt die Abweichungen der Schritte 8–10.
- `EXPECTED_DEVIATION_KEYS` in der Spec nimmt die acht Schlüssel für die Dauer der Welle auf. Der
  Kommentar dort verlangt die Nennung des Plans und das Leeren danach; eine Liste, die nichts mehr
  ausnimmt, wäre eine stille Freigabe.

Solange keiner der beiden Wege gegangen ist, ist **jeder** Playwright-Vollauf dieser Welle rot, und
zwar an genau dieser einen Stelle. Wer eine andere Zahl meldet, hat entweder den Sollstand
angefasst oder die Suite nicht vollständig gefahren.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/computed-style-diff.spec.js
```


### Nachtrag Schritt 11 (2026-09-29) — geschlossen, mit dem schlüsselweisen Vergleich als Beleg

**24 von 3626 Digests geändert (0,66 %), 0 Zugänge, 0 Abgänge.** Genau die erwartete
Größenordnung; Welle 1 änderte 254. Betroffen sind die acht oben genannten Schlüssel, jeder in
allen drei Durchgängen (`standard`, `narrow`, `reducedMotion`) — 8 × 3 = 24. Bei allen acht
ändert sich **genau eine** der zwölf Eigenschaften: `backgroundColor`. Chromium serialisiert eine
`color-mix`-Tönung als `color(srgb R G B / a)` statt als `rgba()`; die Zahlen sind dieselben
(0.937255 × 255 = 239 = `--red`).

**Weg (b) statt (a), und warum.** Der Plan sah vor, die Schlüssel in `EXPECTED_DEVIATION_KEYS`
einzutragen, mit `UPDATE_STYLE_BASELINE=1` neu zu schreiben und sie danach wieder zu entfernen.
Das trägt hier nicht:

1. Die drei Durchgänge laufen `serial`. Der erste rote bricht die beiden anderen ab — die
   Schlüssel von `narrow` und `reducedMotion` sind unsichtbar, solange `standard` rot ist. Die
   Liste wäre in drei Runden zu erraten.
2. `isExpectedDeviation()` prüft den **Element**-Schlüssel als Teilstring, ohne Ansicht und ohne
   Durchgang. Ein Eintrag für `div.init-ac#0` verschluckt an dieser Stelle auch Zugänge und
   Abgänge — also genau die zwei Befundarten, die 0 sein **müssen**.

Stattdessen: alte Fassung gesichert, Sollstand gelöscht, neu erhoben, und der Vergleich
schlüsselweise **außerhalb** des Tests gefahren. `EXPECTED_DEVIATION_KEYS` wurde dabei nicht
angefasst und ist weiterhin leer; `computed-style-diff.spec.js` steht unverändert.

Volle Suite danach: **381 bestanden, 0 Fehlschläge**. Übersprungen sind jetzt **11 statt 7** —
die vier neuen sind die vier Themes von `welle-2-screens.spec.js`, die ohne `WELLE2_SCREENS=1`
nicht laufen (dasselbe Muster wie Welle 1).

---

## W2-D-01 — Der Tönungsdeckel ist gegen DREI Trägerflächen gerechnet, nicht gegen vier

**Stand:** 2026-09-29, Welle 2 Schritt 8. Offen — eine benannte Grenze, kein Versehen.

### Worum es geht

Hausregel **D-2** sagt: maßgeblich ist das Minimum über die tatsächlichen Trägerflächen, und für
Textfarben sind das **vier** — `--bg-card`, `--bg-dark`, `--bg-elevated` und `--bg-hover`. Der
Tönungsdeckel aus **E2** (13 / 7 / 7 / 20 %) ist gegen **drei** gerechnet; `--bg-hover` steht
nicht darin. R-04 urteilt über Tönungen mit derselben Dreierliste, R-11 tut es seit Schritt 7.

### Warum nicht vier — gemessen, nicht bequem

Die `--<rolle>-text`-Tokens sind in Welle 1 so gewählt worden, dass sie auf der **schlechtesten**
der vier neutralen Flächen genau 4,5 erreichen. Diese schlechteste Fläche ist in jedem Theme
`--bg-hover`. Jede halbdurchsichtige Auflage darüber drückt sie also unter die Schwelle, gleich
welcher Stärke. Der größte zulässige Deckel gegen vier Flächen, für alle zehn Rollen gerechnet:

| Theme | Deckel gegen drei Flächen | Deckel gegen vier Flächen |
| ----- | ------------------------: | ------------------------: |
| dark | 13 % | **0 %** |
| light | 7 % | **0 %** |
| sepia | 7 % | **0 %** |
| contrast | 20 % | **0 %** |

Ein Deckel von 0 % ist ein Verbot jeder Tönung überhaupt — also die Abschaffung einer
Gestaltungsklasse mit 113 Stellen, und keine Entscheidung, die ein Kontrastschritt nebenbei
treffen darf.

### Warum das trotzdem offen ist, und wohin es gehört

Die Frage ist nicht D-4, sondern **W1-B-01 / E3**: solange eine Zeile ihren Hover-Zustand über
eine **Fläche** meldet (`background: var(--bg-hover)`), liegt jede Tönung darin auf einem Grund,
für den ihre Schrift nicht gerechnet ist. E3 stellt genau das für `.qref-row:hover` auf einen
Rahmen um. Wird derselbe Weg für die übrigen Hover-Flächen gegangen, verschwindet die Frage; wird
er es nicht, bleibt sie.

Ein konkreter Beleg steht im CSS: `dice.css` `.dice-fav-add:hover` hält mit dem Deckel gegen drei
Flächen 6,02 · 4,78 · 5,13 · 8,91 und gegen vier nur 4,97 · 4,33 · 4,70 · 7,05. Beide Zahlenreihen
stehen dort im Kommentar, damit niemand die alte Prognose gegen die neue Zusicherung stellt.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "bg-hover steht NICHT" -A 6 assets/styles/variables.css
npx jest tests/unit/design-consistency.test.js -t "R-04"
```

---

## W2-D-02 — `var(--text-dim)` auf Rollentönungen: der Deckel ist nicht die Abhilfe

**Stand:** 2026-09-29, Welle 2 Schritt 8; **Bestand erweitert im Nachtrag, Runde 2**. Offen —
Nachfolger von W2-C-02 Nachtrag I.

**Die Überschrift hieß bis dahin „Zwei `var(--text-dim)`-Stellen auf der Goldtönung".** Beide
Zahlwörter sind überholt: es sind mehr als zwei Stellen, und eine davon liegt auf einer
**Rot**tönung. Die Zahl im Titel war schon vor Runde 2 falsch — die Ausnahmetabelle von R-18
führte seit Runde 1 zwei `party.css`-Stellen zusätzlich hierher. Ein Titel, der mitzählt, wird
still falsch; dieser zählt nicht mehr mit.

### Worum es geht

`tools.css` `.search-result-preview` und `.quick-access-item:hover .remove-btn` setzen
`color: var(--text-dim)`; die 10-%-Goldtönung, auf der sie liegen, kommt aus der **Elternregel**.
W2-C-02 Nachtrag I hat die Abhilfe Schritt 8 zugewiesen. Schritt 8 hat sie gerechnet und **nicht
ausgeführt**, und der Grund ist die Messung.

**Dazu seit Runde 2 des Nachtrags zwei Stellen in `initiative.css`,** gefunden, als R-18 auch die
**Klassenform** des Zustands zu sehen bekam (siehe W2-D-05). Beide malen dieselbe Tinte auf die
Tönung derselben Zeile:

| Paar | Tönung | min (dark · light · sepia · contrast) |
| ---- | ------ | -------------------------------------- |
| `.init-entry.active` → `.init-entry .drag-handle` | Gold 10 % | **3,56** · 4,28 · 3,98 · 5,38 |
| `.init-entry.lair` → `.init-entry .drag-handle` | Rot 10 % | **3,93** · 4,22 · 4,18 · 6,53 |

Der Ziehgriff ⠿ steht als erste Gitterspalte (30 px) genau auf dem 0-%-Ende des Verlaufs, also
auf der **vollen** Tönung, und `.active` markiert die Zeile, auf die im Kampf am häufigsten
gesehen wird (`features/initiative.js` setzt die Klasse beim Rendern der aktiven Zeile).

### Was gemessen ist

Min über `--bg-card`/`--bg-dark`/`--bg-elevated` (dark · light · sepia · contrast):

- `var(--text-dim)` auf 10 % Gold, heute: 3,57 · 4,29 · 3,97 · 5,38
- dasselbe mit dem Deckel: 3,57 · 4,40 · 4,15 · 5,38 — **der Deckel bringt 0,00 bis 0,18**
- `var(--text-dim)` auf der **blanken** Fläche, ganz ohne Tönung: 4,32 · 4,69 · 4,57 · 6,85

Die letzte Zeile ist der Befund: `--text-dim` erreicht in Dark schon **ohne jede Tönung** nur
4,32 über `--bg-elevated` (und 3,56 über `--bg-hover`). Nicht die Tönung ist zu stark, die
gedämpfte Textfarbe ist zu blass. Ein Deckel kann das nicht heilen.

An `.init-entry.active` ist das in Runde 2 noch einmal einzeln nachgerechnet worden, weil dort
gar kein Deckel steht: mit Deckel 3,56 · 4,40 · 4,15 · 5,38, also in Dark **exakt dieselbe Zahl**
wie ohne. Der Grund ist arithmetisch und nicht strittig — 10 % liegt unter `--tint-max` 13 % in
Dark, `min(10%, var(--tint-max))` ist dort die 10 % selbst. Wer hier deckelt, ändert in Dark
nichts und hat trotzdem etwas geändert.

### Was zu entscheiden ist, und von wem

Drei Wege, keiner davon eine Tönungsfrage:

1. `--text-dim` als Token anheben — betrifft den ganzen Baum (die Rolle steht hunderte Male) und
   verschiebt die Schrifthierarchie. Gehört zu einer eigenen Entscheidung.
2. Die betroffenen Stellen auf `var(--text)` setzen — hält mit 9,59 · 12,99 · 7,63 · 12,49
   mühelos (am Ziehgriff gemessen 9,55 · 12,97 · 7,64 · 12,51 auf der Gold- und
   10,55 · 12,80 · 8,03 · 15,17 auf der Rottönung), macht aber Vorschautext, Löschknopf und
   Ziehgriff so kräftig wie den Haupttext und nimmt der Kachel bzw. der Zeile ihre Hierarchie.
3. Stehen lassen und führen — gegen ihre **tatsächliche** Trägerfläche `var(--bg-card)`
   (`.wiki-search-dropdown` bzw. `.wiki-quick-access` setzen sie ausdrücklich) lesen die beiden
   `tools.css`-Stellen 4,10 · 5,18 · 4,59 · 6,63; nur Dark liegt darunter, und zwar um 0,4. Für
   den Ziehgriff gilt dasselbe Bild: `.init-entry` setzt `var(--bg-card)` selbst, dagegen
   gerechnet 4,10 · 5,19 · 4,58 · 6,62 (Gold) bzw. 4,47 · 5,17 · 4,82 · 7,73 (Rot).

Gewählt ist vorerst (3): nicht geändert, hier geführt. **Geurteilt wird seit dem Nachtrag sehr
wohl** — R-18 führt alle vier Paare als benannte Ausnahme mit ihrem gemessenen Minimum und meldet
jede Verschlechterung. Der Satz „keine Ratsche urteilt über die beiden" stand hier bis Runde 2
und war die Lage von Schritt 8: R-04 verlangt Fläche UND Schrift in derselben Regel, und die
Tönung steht eine Regel höher. Die Ratsche ersetzt die Entscheidung nicht, sie hält den Stand
fest.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "EINE DRITTE TINTE LIEGT" -A 20 assets/styles/tools.css
grep -n "init-entry.active" -A 4 assets/styles/initiative.css
npx jest tests/unit/design-consistency.test.js -t "R-18"
```

---

## W2-D-03 — Elf von dreizehn Farbaliasen in `dashboard.css` werden nirgends benutzt

**Stand:** 2026-09-29, Welle 2 Schritt 8. Nur vermerkt, keine Farbfrage.

### Worum es geht

`dashboard.css` führt einen eigenen `:root`-Block mit dreizehn semantischen Aliasen
(`--color-success`, `--color-warning`, `--color-danger`, `--color-info`, `--color-primary`,
`--color-secondary`, `--color-character`, `--color-npc`, `--color-location`, `--color-quest`,
`--color-encounter`, `--color-spell`, `--color-loot`, `--color-note`). Benutzt wurden bis zu
diesem Schritt genau **zwei**: `--color-quest` und `--color-spell`, je einmal, als Tinte der
beiden `.entity-tag`-Regeln. Seit Schritt 8 nennen die beiden Regeln ihre Rolle direkt, wie die
vier `.status-badge`-Regeln vier Zeilen darüber — damit ist **keiner** der dreizehn mehr in
Gebrauch.

### Warum das hier steht

Der Umweg über ein Zweittoken hat die zwei Regeln vor **jeder** Bestandszählung dieser Welle
verborgen: wer nach *Rolle als Tinte auf einer Tönung derselben Rolle* sucht, sieht dort einen
fremden Namen und geht weiter. Gefunden hat sie erst die erweiterte R-04 — als *nicht auflösbar*,
weil der Kontrastrechner nur die Tokens aus `variables.css` kennt. Das ist die eigentliche
Lehre: **ein Alias, der nur an einer Stelle steht, ist keine Abstraktion, sondern eine Tarnung.**

Das Löschen der dreizehn Zeilen ist eine Aufräumfrage und gehört nicht in einen Farbschritt. F-01
verlangt nur die umgekehrte Richtung (jedes benutzte `var()` muss definiert sein) und bleibt grün.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -rn -- "--color-quest\|--color-spell\|--color-npc" assets/ features/ ui/ systems/
```

---

## W2-D-04 — Zehn **deckende** Verlaufsflächen urteilt keine Ratsche; die Tönungen im Verlauf sind seit Schritt 16 drin, diese nicht

**Stand:** 2026-09-29, Prüfung W2-D Runde 1 / Schritte 16–18. Kein akuter Lesbarkeitsmangel,
aber eine benannte Lücke.

### Worum es geht

Schritt 16 hat `ruheRegeln()` im R-04-Block so erweitert, dass eine **Tönung** auch dann
beurteilt wird, wenn sie als Stopp in einem `linear-gradient(…)` steht. Das schließt genau die
Bauart, an der die Prüfung W2-D zwei Befunde gefunden hat (`.spell-note`, und die fehlende
Deckung von `.concentration-badge`). Die Erweiterung ist **auf Tönungen begrenzt** — auf Stopps
der Form `color-mix(in srgb, var(--rolle) N%, transparent)`.

**Deckende** Verlaufsstopps bleiben außen: `linear-gradient(135deg, var(--red), var(--red-dark))`.
Das ist keine Nachlässigkeit, sondern eine andere Rechnung. Unter einem deckenden Stopp liegt
keine Trägerfläche; das Minimum über `--bg-card`/`--bg-dark`/`--bg-elevated`, mit dem R-04 jede
Tönung mißt, ist dort sinnlos — gerechnet werden muß gegen den Stopp selbst, und zwar über die
ganze Verlaufsspanne, nicht nur an den beiden Enden.

### Die Klasse, gemessen

Zehn Regeln im Baum führen eine Verlaufsfläche mit deckenden Stopps **und** eine eigene Tinte
(eigener Parser über `assets/styles/*.css`, eigene sRGB-Mathematik, Selbstprobe `#777777`/`#767676`
gegen Weiß = 4,48/4,54). Gemessen ist jeweils das Minimum über beide Verlaufsenden:

| Regel | Tinte | dark | light | sepia | contrast |
| ----- | ----- | ---- | ----- | ----- | -------- |
| `dashboard.css` `.conflict-banner` | `--ink-on-dark` | **3,76** | 4,83 | 4,63 | **4,00** |
| `dice.css` `.floating-dice-trigger` | `--ink-on-dark` | 6,76 | 8,25 | 7,97 | 7,20 |
| `dmscreen.css` `.dms-dice-btn.dms-dice-d20` | `--ink-on-dark` | 6,76 | 8,25 | 7,97 | 7,20 |
| `party.css` die sieben `.read-aloud`-Varianten | `--ra-*-ink` | 7,13–11,87 | identisch | identisch | identisch |

**Keine neue Unterschreitung.** Die einzige — `.conflict-banner` in Dark und Contrast — ist seit
Welle 1 Schritt 7 im CSS-Kommentar derselben Regel aktenkundig, mit denselben vier Zahlen, und
ausdrücklich auf Welle 3/4 verschoben: abgeleitete Flächen (`--red-dim`, `--red-dark`,
`--gold-hover`, …) haben kein `--on-*`-Pendant. Weiß ist dort an jedem Punkt der Spanne die
bessere der beiden möglichen Tinten (`var(--on-red)` ergäbe 2,03 / 1,90). Die sieben
Vorlese-Varianten sind themenunabhängiges Papier (§7-Ausnahme) und halten mit Abstand.

### Warum das trotzdem offen ist

Der Befund ist nicht die Zahl, sondern dass **niemand hinsieht**. Genau diese Form hat in dieser
Welle schon zweimal zugeschlagen: Schritt 7 legte `.concentration-badge` in einen Verlauf und
keine Ratsche urteilte darüber; Schritt 15 behob `.editor-btn:hover` und übersah den Zwilling
`.spell-note` acht Zeilen davor, weil er im Verlauf stand. Solange die deckende Spanne ungemessen
bleibt, ist `.conflict-banner` genauso gestellt: eine spätere Änderung an `--red`, an
`--red-dark` oder an der Tinte fällt lautlos durch.

Der Weg ist bekannt und nicht groß: dieselbe Erweiterung wie in Schritt 16, aber mit dem Stopp
als Grundfläche statt als Auflage, und mit einer Abtastung über die Spanne (die Enden genügen
nicht — der schlechteste Punkt von `.conflict-banner` liegt am hellen Ende, das dunkle hält
9,31–10,87). Er gehört zur Welle, die die abgeleiteten Flächen mit `--on-*`-Pendants versorgt,
nicht in einen Tönungsschritt.

### Zweiter Punkt derselben Prüfung: die Zahl der ungedeckelten Tönungen

Der Schrittbericht von Schritt 8 hält fest, die ungedeckelt gebliebenen Tönungen seien „alle
neutral, keine einzige trägt eine Rollentinte". Nachgezählt (eigener Parser, Stand vor Schritt 16):
**88 ungedeckelte Rollen-Tönungsstopps**, davon **18 in einer Regel mit eigener Tinte** — und
**eine** davon trug sehr wohl eine Rollentinte: `spells.css` `.spell-note`, Gold auf 10 % Gelb,
Light 2,45. Sie ist in Schritt 16 behoben. Die übrigen 17 tragen `var(--text)` auf einer
`--text-dim`- oder `--attr-*`-Tönung; für die gilt der Satz weiterhin. Die Aussage war also **um
genau eine Stelle zu weit**, und genau diese eine war der Befund.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
# Alle Verlaufsflaechen mit eigener Tinte:
grep -n "linear-gradient" assets/styles/*.css | head -40
# Die Begruendung an der einen Unterschreitung:
grep -n "BLEIBT weiss" -A 20 assets/styles/dashboard.css
# Die beiden Toenungen IM VERLAUF, die seit Schritt 16 geurteilt werden:
npx jest tests/unit/design-consistency.test.js -t "Toenungen IM VERLAUF"
```

---

## W2-D-05 — Zustandsregeln legen eine Rollen-Tönung, die Tinte kommt aus der Basisregel; keine Ratsche urteilt darüber

**Stand:** 2026-09-29, Prüfung W2-D Runde 2, **geschlossen im Nachtrag der Welle 2, Runde 1**
(Stellen und Lücke), **Schließung nachgebessert in Runde 2** (die Klassenform des Zustands).
Vorbestand, kein Rückschritt dieser Welle; es war die vierte Lücke derselben Familie und die
einzige, die noch nirgends geführt war.

**Was Runde 2 berichtigt hat.** Dieser Punkt und der Kopf von R-18 haben nach Runde 1
behauptet, die Menge der 14 Paare sei geschlossen geführt und eine fünfzehnte Stelle werde rot.
**Das galt nur für Zustände als Pseudoklasse.** `ZUSTAND` streicht `:hover`, `:checked`,
`:has(…)` und Genossen; steht der Zustand als **Klasse** im Kompound, blieb der Selektor
unverändert und wurde per `if (!basis || basis === zSel) return;` als „kein Zustand" verworfen.
Genau dort lag die nächste Stelle: `initiative.css` `.init-entry.active` tönt mit 10 % Gold und
setzt keine Tinte, `.init-entry .drag-handle` bringt `var(--text-dim)` mit — **3,56 · 4,28 ·
3,98 · 5,38**, Zahl für Zahl dieselbe Reihe wie bei zwei der benannten Ausnahmen. Belegt war die
Lücke per Mutation: Gold von 10 % auf 95 % gestellt, volle Jest-Suite unverändert grün, kein
einziger neuer roter Test. Seit Runde 2 meldet R-18 dieselbe Mutation mit min 1,10.

Die Paarung läuft seither über die **Teilmenge der Klassen** des Basis-Kompounds statt nur über
Zeichengleichheit (`trifftBasis()`): `.init-entry` trifft jedes `.init-entry.active`. Eine bloße
Erweiterung von `ZUSTAND` hätte dafür `.dice-attr.save small` verloren — das ist keine
Nachfahrenschreibweise von `.dice-attr`. Die Menge wächst damit von 14 auf **19**, die benannten
Ausnahmen von vier auf **sieben**; die drei Neuzugänge stehen in der Tabelle unter „Die gekreuzte
Bauart". Einer davon, `dice.css` `.fdp-die.d20`, gehört nicht zur `--text-dim`-Familie und läuft
als eigener Punkt **W2-D-06** weiter.

**Was der Nachtrag geändert hat, in zwei Schüben.** Der erste Schub hat vier der fünf
Unterschreitungen mit dem Tönungsdeckel aus Schritt 8 geschlossen, im selben Idiom wie die 114
übrigen Stellen dieser Welle; die Begründung, mit der diese Akte den Deckel zuvor verworfen hat
(„keine davon dadurch über 4,5"), war **gemessen falsch** und steht berichtigt unter „Die Klasse,
gemessen". Runde 1 des Nachtrags hat die drei Reste erledigt:

1. **Die fünfte Stelle**, `file-backup.css` `.backup-entry-restore`, hat **Tintenkorrektur und
   Deckel** bekommen — beides zusammen, weil der Deckel allein nicht trägt. Die Rechnung dazu stand
   schon in dieser Akte, umgesetzt war sie nicht. Die schwerere Hälfte war dabei gar nicht der
   Hover, sondern die **Grundregel**: `background: transparent` mit `color: var(--red)` las
   4,07 · 3,94 · 3,68 · 3,98, also in allen vier Themes unter 4,5, und das ist gewöhnlicher Text.
2. **Eine sechste Regel derselben Bauart** war nie gezählt worden, weil ihre Tinte nicht in der
   eigenen Grundregel steht, sondern in einem **Nachfahren**: `dice.css` `.dice-attr.save:hover`,
   4,41 · 4,09 · 4,18 · 5,05, in drei Themes darunter. Sie ist gedeckelt; die gekreuzte Bauart ist
   unter „Die Klasse, gemessen" nachgetragen.
3. **Die Lücke selbst ist geschlossen** — nicht an R-03, wie diese Akte es vorgezeichnet hatte,
   sondern in einer eigenen Ratsche **R-18** („verfeinernde Regel tönt, Tinte ist geerbt", am Ende
   von `tests/unit/design-consistency.test.js`). Sie urteilt über **beide** Wege, führt die Paare
   als **Menge** und hat benannte Ausnahmen mit gemessenem Minimum. Die Mutationsprobe, mit der
   die Prüfung die Lücke belegt hat (alle vier Deckel zurück auf BASE), läuft heute **rot**.
   Wieviele Paare und wieviele Ausnahmen es sind, steht oben unter „Was Runde 2 berichtigt hat"
   und in der Liste `ERWARTETE_PAARE` — nicht mehr an drei Stellen dieser Akte, denn genau das
   hat die falsche Zahl so lange am Leben gehalten.

### Worum es geht

Die Bauart steht vier Zeilen unter der, die Schritt 16 gerade gesichert hat:

```css
.concentration-badge       { color: var(--purple-text); /* … */ }
.concentration-badge:hover { background: color-mix(in srgb, var(--purple) 30%, transparent); }
```

Die Zustandsregel wechselt die **Fläche** auf eine Rollen-Tönung und setzt **keine eigene Tinte**.
Gemalt wird also die geerbte Tinte der Basisregel auf einer Fläche, für die sie nie gerechnet
wurde. Die Familie hat in dieser Welle schon drei Löcher gehabt — Tönung als Verlaufsstopp (R-04
erweitert, Schritt 16), Tönung im Elter und Tinte im Kind (R-14, Schritt 18), deckende
Verlaufsstopps (W2-D-04, offen). Dies ist das vierte.

### Die Klasse, gemessen

Eigene Vollerhebung über `assets/styles/*.css` in Kaskadenreihenfolge des `@import`-Hubs (eigener
Klammerzähl-Parser, `tests/unit/helpers/wcag-contrast.js` für die sRGB-Mathematik; Selbstprobe
`#777777`/`#767676` gegen Weiß = 4,48/4,54). Minimum über `--bg-card`/`--bg-dark`/`--bg-elevated`,
alle vier Themes. Neun Regeln haben diese Bauart, fünf unterschreiten 4,5 — **Stand der Prüfung**;
alle fünf sind seit dem Nachtrag geschlossen, siehe den Abschnitt gleich darunter.

**Präzisiert in Runde 1 des Nachtrags:** die Neun zählt Regeln mit geerbter Tinte **aus der eigenen
Grundregel**. Die Bauart mit Tinte **im Nachfahren** ist getrennt zu erheben und war in keiner Zahl
dieser Akte enthalten — siehe „Die gekreuzte Bauart" unten.

| Regel | Tönung | geerbte Tinte | dark | light | sepia | contrast |
| ----- | ------ | ------------- | ---- | ----- | ----- | -------- |
| `core.css` `.link-chip:hover` | `--blue` 40 % | `--blue-text` | **2,87** | **2,96** | **3,25** | **3,37** |
| `initiative.css` `.concentration-badge:hover` | `--purple` 30 % | `--purple-text` | **3,32** | **3,28** | **3,46** | **4,07** |
| `file-backup.css` `.backup-entry-restore:hover` | `--red` 12 % | `--red` | **3,61** | **3,32** | **3,15** | **3,74** |
| `pwa.css` `.pwa-install-btn:active` | `--gold` 22 % | `--gold-text` | **4,66**¹ | **4,15** | **4,12** | 6,34 |
| `initiative.css` `.concentration-add-btn:hover` | `--purple` 10 % | `--purple-text` | 4,81 | **4,40** | **4,43** | 5,31 |

¹ hält; fett steht nur, was unter 4,5 liegt.

#### Der Deckel IST die Abhilfe — an vier der fünf (Berichtigung, Nachtrag)

Diese Akte hat an dieser Stelle behauptet: „Vier der fünf lägen mit Deckel besser, aber keine davon
dadurch über 4,5 — der Deckel ist hier nicht die Abhilfe." **Das ist falsch, und es war die
Begründung, mit der die Abhilfe auf E3/Schritt 9 verschoben wurde.** Nachgerechnet im Nachtrag
(eigener Klammerzähl-Parser über `assets/styles/*.css` in Kaskadenreihenfolge des `@import`-Hubs,
`tests/unit/helpers/wcag-contrast.js` für die sRGB-Mathematik, Selbstprobe `#777777`/`#767676`
gegen Weiß = 4,48/4,54; Minimum über `--bg-card`/`--bg-dark`/`--bg-elevated`, alle vier Themes), mit
der eigenen Stärke jeder Regel im Idiom aus Schritt 8, also `min(<eigene Stärke>%, var(--tint-max))`:

| Regel | Stärke | vorher (d·l·s·c) | mit Deckel (d·l·s·c) | |
| ----- | ------ | ---------------- | -------------------- | - |
| `core.css` `.link-chip:hover` | 40 % | 2,87 · 2,96 · 3,25 · 3,37 | 4,81 · 4,64 · 4,64 · 4,52 | **hält** |
| `initiative.css` `.concentration-badge:hover` | 30 % | 3,32 · 3,28 · 3,46 · 4,07 | 4,57 · 4,57 · 4,60 · 4,74 | **hält** |
| `pwa.css` `.pwa-install-btn:active` | 22 % | 4,66 · 4,15 · 4,12 · 6,34 | 5,65 · 4,78 · 5,14 · 6,76 | **hält** |
| `initiative.css` `.concentration-add-btn:hover` | 10 % | 4,81 · 4,40 · 4,43 · 5,31 | 4,81 · 4,57 · 4,60 · 5,31 | **hält** |
| `file-backup.css` `.backup-entry-restore:hover` | 12 % | 3,61 · 3,32 · 3,15 · 3,74 | 3,61 · 3,55 · 3,37 · 3,74 | hält **nicht** |

**Warum das so sein muß, ohne den Rechner:** `--tint-max` ist 13/7/7/20 %, also in jedem Theme
höchstens 20 %. `min(40%, var(--tint-max))` und `min(20%, var(--tint-max))` ergeben damit
**dieselbe** Farbe. Die Grundregel `core.css` `.link-chip` trägt genau diese gedeckelte Fläche mit
derselben Tinte `var(--blue-text)`, wird von R-04 beurteilt und ist grün. Dasselbe Argument trägt
bei `.concentration-badge:hover`: der Verlaufskopf ihrer Grundregel liegt bei
`min(20%, var(--tint-max))` und ist im Kommentar derselben Regel mit 4,56 · 4,57 · 4,60 · 4,73
ausgewiesen.

**Die vier sind im Nachtrag gedeckelt**, je Datei ein Commit, mit der gerechneten Reihe als
Kommentar an der Regel. Zwei benannte Sichtfolgen dabei, beide im CSS-Kommentar festgehalten:

- Bei `.link-chip:hover` und `.concentration-badge:hover` fällt die Hover-Fläche mit der Ruhefläche
  zusammen (beide Stärken liegen über dem Deckel). Das Überfahren meldet sich nur noch über
  `transform`. Dieselbe Folge hat der Deckel an den 114 übrigen Stellen der Welle.
- `pwa.css`: `.pwa-install-btn:hover` daneben trägt 12 % **ungedeckelt** und hält
  (5,75 · 4,55 · 4,77 · 8,40), bleibt deshalb unangetastet. In Light und Sepia deckelt `--tint-max`
  auf 7 %, die gedrückte Fläche wird dort also **blasser** als die überfahrene — die Zustandsleiter
  kehrt sich um. In Dark (13 %) und Contrast (20 %) bleibt sie richtig herum. Das ist eine
  Sichtfrage der Tönungsregel E2 und nur zusammen mit der Hover-Stufe zu entscheiden; sie gehört zu
  E3/Schritt 9.

#### Die fünfte: `.backup-entry-restore:hover` — geschlossen, aber erst mit ihrer Tinte

**Erledigt in Runde 1 des Nachtrags** (Commit `fix(W2): die fuenfte Zustandsregel traegt —
Tintenkorrektur UND Deckel`). Der Abschnitt bleibt stehen, weil die Rechnung darin die Begründung
für **beide** Eingriffe ist.

Sie war die einzige der fünf, die der Deckel **nicht** trägt, und der Grund steht in der Tabelle
oben: ihre geerbte Tinte war `var(--red)`, die Rollenbasis, nicht `var(--red-text)`. Gemessen,
derselbe Rechenweg, min über die drei Trägerflächen:

| Fassung | dark | light | sepia | contrast | |
| ------- | ---- | ----- | ----- | -------- | - |
| heute (12 % ungedeckelt, Tinte `--red`) | 3,61 | 3,32 | 3,15 | 3,74 | |
| nur Deckel, Tinte bleibt `--red` | 3,61 | 3,55 | 3,37 | 3,74 | hält nicht |
| **nur Tintenkorrektur** auf `--red-text`, 12 % ungedeckelt | 4,85 | **4,24** | **4,31** | 5,39 | hält **nicht** |
| Tintenkorrektur **und** Deckel | 4,85 | 4,54 | 4,62 | 5,39 | hält |

**Die Tintenkorrektur allein genügt nicht** — Light 4,24 und Sepia 4,31 bleiben darunter. Der
Nachtrag hat deshalb im ersten Schub an dieser Regel **nichts geändert**. Runde 1 hat **beides
zusammen** gesetzt, also die letzte Zeile der Tabelle: `color`/`border-color` auf `var(--red-text)`,
`background` auf `min(12%, var(--tint-max))`. Nachgemessen am Endstand: Ruhe
5,48 · 5,04 · 5,05 · 5,73, Hover 4,85 · 4,54 · 4,62 · 5,39.

**Neu gemessen und bisher nirgends notiert — die Grundregel ist selbst betroffen.** Nicht nur der
Hover-Zustand: `.backup-entry-restore` trug `background: transparent`, ihre Tinte `var(--red)`
las direkt auf den Trägerflächen **4,07 · 3,94 · 3,68 · 3,98** — in **allen vier** Themes unter
4,5. Mit `var(--red-text)` sind es 5,48 · 5,04 · 5,05 · 5,73. R-04 sah das nicht: `transparent`
löst sich zu keiner Farbe auf, die Regel fiel vor der Rechnung heraus. Das war ein Rest aus
Welle 1 (Rollenbasis als Schriftfarbe) und zugleich die schwerere Hälfte dieses Punktes — es geht um
lesbaren Text, nicht um einen Zustand unter der Maus.

**Diese zweite Lücke ist mitgeschlossen.** R-04 hat in Runde 1 einen eigenen Zweig für
`background: transparent` bekommen: die Tinte wird dann unvermittelt gegen dieselben drei
Trägerflächen gerechnet. Die Menge ist gemessen **6 Regeln** und wird namentlich gezählt
(`die Regeln mit blanker Flaeche stehen namentlich unter Aufsicht`), damit der Zweig nicht
stillschweigend leerläuft. Zwei Tintenarten bleiben außen vor, beide mit eigenem Richter: neutrale
Textrollen (`--text`, `--text-dim`) gehören R-02 Teilformel 2, und `var(--on-*)`-Tokens **nennen**
ihre Fläche — sie gegen `--bg-card` zu rechnen ergäbe zwei Fehlalarme (`party.css`
`.event-log-btn` 1,87 und `pwa.css` `.pwa-update-dismiss` 1,00), die gegen ihre wirklichen Flächen
6,96–8,12 bzw. 8,11–11,97 lesen.

**Und noch eine Ebene tiefer:** die tatsächliche Trägerfläche dieser Schaltfläche ist nicht
`--bg-card`, sondern `--bg-hover`. Wer den Knopf überfährt, überfährt die Zeile `.backup-entry`
mit, und die schaltet auf `var(--bg-hover)`. Dagegen gerechnet hält **keine** der vier Fassungen
oben (beste: Tinte + Deckel mit 4,06 · 4,12 · 4,21 · 4,42). Das ist genau die Frage, die R-04 mit
seiner Begründung für drei statt vier Trägerflächen ausdrücklich an W1-B-01/E3 abgibt („solange eine
Zeile ihren Hover über eine Fläche meldet, liegt jede Tönung darin auf einer Fläche, für die ihre
Tinte nicht gerechnet ist"). Wer diese Stelle anfaßt, entscheidet sie mit.

### Wo derselbe Bau schon trägt

Die vier übrigen Regeln dieser Bauart halten in allen vier Themes, drei davon knapp — sie fallen
bei der nächsten Stärkeänderung als Erste:

- `dashboard.css` `.dice-formula-chip:hover` — `--cyan`, min 4,50 (sepia)
- `pwa.css` `.pwa-install-btn:hover` — `--gold`, min 4,55 (light)
- `file-backup.css` `.backup-warning-indicator:hover` — `--yellow`, min 4,60 (sepia)

Die neunte, `pwa.css` `.pwa-update-dismiss:hover`, ist ein **Trägerartefakt** und in beiden
Zählungen zu Recht ausgeklammert: sie sitzt auf der gelben Aktualisierungsleiste und trägt
`var(--on-yellow)`, ein Token, das seine Fläche selbst nennt. Gegen die drei neutralen Träger
gerechnet läse sie 1,00; gegen ihre wirkliche Fläche liest sie 8,11–11,97 (in `pwa.css`
vorgerechnet). R-18 klammert genau diese Tintenart aus, mit derselben Begründung.

### Die gekreuzte Bauart: Zustandsregel tönt, Tinte steht im Nachfahren

**Nachgetragen in Runde 1 des Nachtrags.** Sie ist dieselbe Bauart, fällt aber aus der Neun oben
heraus, weil die Tinte nicht aus der eigenen Grundregel kommt:

```css
.dice-attr.save:hover { background: color-mix(in srgb, var(--purple) 15%, transparent); }
.dice-attr.save small { color: var(--purple-text); }
```

Die Spezifität 0,2,1 von `.dice-attr.save small` schlägt `.dice-attr small` mit `--cyan-text` bei
0,1,1; das Markup steht in `assets/templates/view-tools.html` ab Zeile 194. **Gemessen
4,41 · 4,09 · 4,18 · 5,05** — in dark, light und sepia unter 4,5, und damit in dark und light
schlechter als `.concentration-add-btn:hover`, die der erste Schub behoben hat. Gedeckelt sind es
4,57 · 4,57 · 4,60 · 5,05.

Warum sie durch **alle** Netze fiel: R-04 sieht sie nicht (keine eigene Tinte in der Regel), R-14
auch nicht (sie paart nach Selektorpräfix, und `.dice-attr.save small` ist keine
Nachfahrenschreibweise von `.dice-attr.save:hover`) — und die Zählung dieser Akte sah sie ebenfalls
nicht, weil sie nur die Regeln mit Tinte aus der eigenen Grundregel erfaßt. Beide Wege zusammen
standen nach Runde 1 als **14 Paare** unter R-18; seit Runde 2 kommt die **Klassenform** des
Zustands dazu (oben, „Was Runde 2 berichtigt hat"), und es sind **19**. Die sieben, die unter 4,5
bleiben, sind samt und sonders Vorbestand und mit gemessenem Minimum geführt:

| Paar | Tinte | min | geführt als |
| ---- | ----- | --- | ----------- |
| `tools.css` `.quick-access-item:hover` → `.remove-btn` | `--text-dim` | 3,56 | W2-D-02 |
| `party.css` `.cf-attr-card:has(…)` → `.cf-attr-save` | `--text-dim` | 3,56 | W2-D-02 (gleiche Tinte, gleiche 10-%-Goldtönung) |
| `party.css` `.cf-attr-card:has(…)` → `.cf-attr-mod` | `--cyan-text` | 4,29 | dito |
| `initiative.css` `.init-entry.active` → `.init-entry .drag-handle` | `--text-dim` | 3,56 | W2-D-02, seit Runde 2 (dieselbe Reihe, dieselbe 10-%-Goldtönung) |
| `initiative.css` `.init-entry.lair` → `.init-entry .drag-handle` | `--text-dim` | 3,93 | W2-D-02, seit Runde 2 (dieselbe Tinte auf 10 % **Rot**) |
| `dice.css` `.fdp-die.d20` → `.fdp-die` | `--gold-text` | 2,87 | **W2-D-06**, seit Runde 2 |
| `loot.css` `.loot-tag-chip:has(input:checked)` → `input:checked + span` | `--gold-text` | 4,23 | Vorziehung Welle 1 Schritt 9 (siehe oben, § Vorziehung) |

### Warum keine Ratsche greift — Quelltext, nicht Vermutung (Stand der Prüfung)

- **R-03** (geerbte Tinte auf gewechselter Fläche) scheidet **doppelt** aus:
  `if (!flaeche || !/^var\(--[\w-]+\)$/.test(flaeche)) return;` verwirft jede `color-mix`-Fläche
  vor jeder Rechnung, und die geerbte Tinte muß `/^var\(--on-[\w-]+\)$/` erfüllen —
  `--purple-text` tut das nicht.
- **R-04** (jede Regel hält 4,5 auf ihrer eigenen Fläche): `ruheRegeln()` verlangt `background`
  **und** `color` in derselben Regel. Diese Regeln haben keine eigene Tinte.
- **R-05** (die Kaskade entscheidet) modelliert drei **benannte** Elementzustände
  (`shop-cat-badge`, `editor-btn.format-active`, `bestiary-dice`). Keiner davon ist dabei.
- **R-14** (Quergriffe) verlangt eine **Nachfahren**schreibweise (`k.startsWith(p + ' ')`) und ein
  Kind **ohne eigene Fläche**. Eine `:hover`-Regel am selben Element ist beides nicht.

**Empirisch belegt, nicht nur gelesen:** `.concentration-badge:hover` von 30 % auf 95 % gestellt
(Kontrast fällt gegen 1,0 in allen vier Themes), danach `npx jest
tests/unit/design-consistency.test.js` — **93 von 93 grün**, kein einziger Befund. Die Mutation ist
zurückgenommen.

Seit dem Nachtrag trägt dieselbe Regel `min(30%, var(--tint-max))`. Wer die Probe wiederholt, muß
deshalb **den Deckel mit entfernen** (`background: color-mix(in srgb, var(--purple) 95%,
transparent)`) — sonst mißt er den Deckel und nicht die Ratsche.

**Seit Runde 1 des Nachtrags läuft dieselbe Probe rot.** Die vier Punkte oben beschreiben den Stand
der Prüfung und bleiben als Begründung stehen, warum R-18 gebaut werden mußte; über die Bauart
urteilt jetzt R-18, mit beiden Wegen. Nachgestellt und belegt:

| Mutation | Befund |
| -------- | ------ |
| `core.css` `.link-chip:hover` zurück auf 40 % | R-18 rot, min 2,87 (dark 2,87 · light 2,96 · sepia 3,25 · contrast 3,37) |
| `dice.css` `.dice-attr.save:hover` zurück auf 15 % | R-18 rot, min 4,09 (dark 4,41 · light 4,09 · sepia 4,18 · contrast 5,05) |
| `file-backup.css` `.backup-entry-restore` zurück auf `var(--red)` | R-04 rot (min 3,68 auf `transparent`) **und** R-18 rot (min 3,37 auf der Tönung) |

Alle drei Mutationen sind zurückgenommen.

### Was daran Vorbestand ist, und was diese Welle getan hat

Dieselbe Erhebung gegen `bb7650e` (BASE der Welle), Trägerflächen und Mathematik unverändert:

| Regel | min an BASE | min bei der Prüfung | min nach dem Nachtrag |
| ----- | ----------- | ------------------- | --------------------- |
| `core.css` `.link-chip:hover` | 1,91 (Tinte war `var(--blue)`) | 2,87 | **4,52** |
| `initiative.css` `.concentration-badge:hover` | 2,79 (Tinte war `var(--purple)`) | 3,28 | **4,57** |
| `file-backup.css` `.backup-entry-restore:hover` | 3,15 | 3,15 | **4,54** (Tinte + Deckel) |
| `pwa.css` `.pwa-install-btn:active` | 4,12 | 4,12 | **4,78** |
| `initiative.css` `.concentration-add-btn:hover` | 4,40 | 4,40 | **4,57** |
| `dice.css` `.dice-attr.save:hover` (gekreuzt, nie gezählt) | 4,09 | 4,09 | **4,57** |

**Zwei** der fünf hatte Welle 2 bis zur Prüfung verbessert (durch die Umstellung der Basis-Tinte auf
`--<rolle>-text` in Schritt 5/6), drei waren unverändert, **keine war schlechter geworden**. Der
Befund war deshalb nie die Zahl, sondern daß **niemand hinsieht** — derselbe Maßstab wie in W2-D-04.
Genau das ist mit R-18 erledigt: alle sechs Zeilen oben stehen namentlich unter Aufsicht, und die
Menge ist geschlossen geführt, so daß eine weitere Stelle rot wird statt still in den blinden
Fleck zu fallen. **Wie weit „geschlossen" reicht, hat Runde 2 berichtigen müssen** — bis dahin
galt es nur für Zustände als Pseudoklasse, und die Klassenform lag daneben im selben blinden
Fleck (oben, „Was Runde 2 berichtigt hat"). Die Lehre ist dieselbe wie beim ersten Mal: eine
Schließung ist erst belegt, wenn die Mutation an einer Stelle **außerhalb** der bekannten Liste
rot wird.

### Die eine Stelle, die ein naiver Ausbau falsch melden würde

`pwa.css` `.pwa-update-dismiss:hover` hat exakt dieselbe Bauart (`--on-yellow` 10 % als Fläche,
`var(--on-yellow)` aus der Basisregel als Tinte) und liest über die drei neutralen Trägerflächen
1,03 · 12,61 · 12,25 · 1,00 — Unsinn. Ihre **tatsächliche** Trägerfläche ist die Bernsteinleiste
`.pwa-update-banner` (`rgba(251,191,36,0.85)`, geführte R-10-Ausnahme W2-B-02); dagegen gerechnet
hält sie 9,33 · 5,42 · 4,98 · 14,23, und genau diese vier Zahlen stehen seit Schritt 7 im Kommentar
derselben Regel. Wer R-03 erweitert, braucht für sie ein Trägermodell oder eine benannte Ausnahme,
sonst kauft er sich einen Fehlalarm mit Faktor 12 ein.

**R-18 hat den Fall anders gelöst, ohne benannte Ausnahme:** ausgeschlossen wird nicht diese eine
Regel, sondern die **Tintenart** `var(--on-*)`. Diese Tokens nennen ihre Fläche; sie gegen
`--bg-card` zu rechnen ist kategorisch falsch und keine Schwellenfrage. Beurteilt werden sie von
R-02, R-04 und R-17 auf ihren eigenen Flächen — der Ausschluß verschiebt sie, er verliert sie nicht.
Ein Schlupfloch ist er auch nicht: `--on-*`-Tokens sind themenblind und stehen unter R-01.

### Der Weg — gegangen

**Berichtigt und erledigt im Nachtrag.** Dieser Abschnitt hat die Abhilfe an den **fünf** Stellen
geschlossen an E3/Schritt 9 verwiesen. Das ruhte auf der falschen Zahl oben. Was er als offen
führte, ist beides getan:

1. **Die Ratsche** ist **R-18**, nicht die hier vorgezeichnete R-03-Erweiterung. Der Grund für den
   eigenen Block statt des Umbaus an R-03: R-03 modelliert die **Kaskade** (welche Deklaration am
   Ende gewinnt), R-18 die **Vererbung über die Fläche hinweg** — zwei verschiedene Fragen, und der
   Umbau hätte die geerbte `--on-*`-Logik von R-03 mitreißen müssen. R-18 führt die Paare als
   geschlossene Menge, prüft 4,5 auf der Tönung der verfeinernden Regel und hält die benannten
   Ausnahmen mit gemessenem Minimum. Die Regeln unter „Wo derselbe Bau schon trägt" stehen damit
   ebenfalls unter Aufsicht — sie waren als Erste gefährdet und sind es nicht mehr.
2. **Die fünfte Stelle**, `.backup-entry-restore` samt ihrem `:hover`, hat **Tintenkorrektur und
   Deckel**. Die Grundregel war dabei der schwerere Fall: gewöhnlicher Text, in allen vier Themes
   unter 4,5.

**Offen blieb nur die Trägerflächenfrage** `--bg-hover` an `.backup-entry-restore:hover` (die Zeile
`.backup-entry` schaltet beim Überfahren auf `var(--bg-hover)`, und dagegen hält keine Fassung).
Das ist W1-B-01/E3 und von D-2 ausdrücklich ausgenommen — kein Rest dieses Punktes, sondern ein
anderer. Für E3 selbst ändert sich an der Lage nichts: drei der fünf melden das Überfahren über eine
Füllung, und für genau diese Frage ist E3 entschieden — bisher allerdings nur für `.qref-row:hover`
ausformuliert. **Beides ist am 2026-09-30 in Welle 3 Schritt 9 geschlossen; siehe den Nachtrag am
Ende dieses Punktes.**

### Was der Schrittbericht von Schritt 8 damit zu weit sagt

„128 Tönungsregeln, 0 Befunde, dreifach nachgerechnet, gegen die tatsächliche Trägerfläche" gilt
für Regeln mit **eigener** Tinte. Regeln, die nur die Fläche wechseln und die Tinte erben, waren in
den 128 nie enthalten; gerechnet **und** bewacht sind sie seit Runde 1 des Nachtrags, durch R-18.
Die Einschränkung steht seit dieser Runde auch im R-04-Block von
`tests/unit/design-consistency.test.js`, damit sie dort steht, wo jemand die Zahl liest.

### Nachtrag Welle 3 Schritt 9 (2026-09-30) — die zwei letzten Reste, beide geschlossen

Dieser Punkt hieß seit dem Nachtrag der Welle 2 „geschlossen" und trug trotzdem zwei unerledigte
Teilstücke: die Trägerflächenfrage am Rückhol-Knopf und die benannte Sichtfolge am PWA-Knopf. Beide
sind jetzt entschieden, umgesetzt und unter einer Ratsche (**R-23**, die drei Reste dieses Schritts
beziffert geführt). Keine der beiden Lücken hätte R-18 finden können, und das ist der eigentliche
Befund: R-18 rechnet über die D-2-Dreierliste, nicht über die Fläche, auf der die Regel sitzt.

**1. `.backup-entry-restore:hover` — Weg A, E3 an der Zeile** (Commit `f443fa5`). Der Knopf ist
nur sichtbar, **während** man seine Zeile überfährt, und die Zeile füllte sich dabei mit
`var(--bg-hover)`. Dort ist die Sache strukturell verloren, nicht bloß knapp: `--red-text` ist in
Welle 1 **gegen genau diese Fläche** auf 4,5 gerechnet worden, jede Auflage darüber drückt es
darunter. Blank liest es 4,52 · 4,54 · 4,61 · 4,55, mit der gedeckelten Tönung
4,06 · 4,12 · 4,21 · 4,42. Nachgerechnet für **neun** Deckelwerte:

| Deckel | 12 % | 10 % | 8 % | 7 % | 6 % | 5 % | 4 % | 3 % | 2 % |
| ------ | ---: | ---: | --: | --: | --: | --: | --: | --: | --: |
| min über die vier Themes | 4,06 | 4,12 | 4,12 | 4,12 | 4,18 | 4,24 | 4,31 | 4,37 | 4,41 |

Das Beste, was eine Tönung überhaupt erreicht, sind **4,41 bei 2 %** — und dann ist sie unsichtbar.
Die **Fläche** ist das Problem, nicht die Stärke. Also E3 zum zweiten Mal, wortgleich mit
`.qref-row`: `.backup-entry:hover` meldet den Zustand über `outline: 1px solid var(--gold-dim)`. Der
Knopf ist in keiner Zeile angefaßt und sitzt dadurch auf `--bg-card`:
**5,52 · 5,55 · 5,32 · 6,35**, min 5,32. Der Umriß selbst hält WCAG 1.4.11 gegen `--bg-card` mit
**5,21 · 5,09 · 9,17 · 8,51**.

Zwei Folgeänderungen, beide unumgänglich: `.backup-entry-header:hover` hielt den Hover der
Kopfzeile mit `background: transparent` zurück — gegen einen Umriß greift das nicht, ohne
`outline: none` bekäme die nicht anklickbare Kopfzeile einen goldenen Ring. Und
`transition: background 0.12s` an `.backup-entry` ist entfallen, weil die Zeile ihre Fläche nicht
mehr wechselt (`.qref-row` führt aus demselben Grund keine).

**1a. Dabei ist der schwerste Befund dieses Schritts aufgefallen: die Tintenkorrektur der Welle 2 an
genau diesem Knopf war nie gerendert.** Das Markup (`systems/file-backup/file-backup-ui.js`) trug
`style="color: var(--red); border-color: var(--red);"`. Ein Inline-Stil schlägt **jeden** Selektor.
Die Umstellung von `var(--red)` auf `var(--red-text)`, die dieser Punkt oben als erledigt führt und
die in `file-backup.css` mit ihren Zahlen begründet steht, ist damit **nie auf einem Schirm
erschienen**. `R-18` las die Regel und meldete grün; diese Akte nannte den Punkt geschlossen.

Der Unterschied, gerechnet über die jeweilige Trägerfläche (dark · light · sepia · contrast):

| Lage | was die Regel sagt | was das Markup malte |
| --- | --- | --- |
| auf `--bg-hover` (Stand vor diesem Schritt) | 4,06 · 4,12 · 4,21 · 4,42 | **3,01 · 3,22 · 3,07 · 3,07** |
| auf `--bg-card` (nach dem Umriß) | 5,52 · 5,55 · 5,32 · 6,35 | **4,10 · 4,35 · 3,88 · 4,41** |

Beide Inline-Deklarationen sind entfernt (Commit `aea0fcf`); sie sagten dasselbe wie die Regel, nur
mit dem falschen Token. **Erst beides zusammen trägt** — der Umriß allein hob den gemalten Wert von
3,01 auf 3,88, also weiter unter 4,5; mit der Regel als Tinte steht er bei **5,32**. Das ist
wortgleich die Lehre, die der Welle-2-Nachtrag für diese Stelle schon gezogen hatte („erst beides
zusammen trägt") — sie war nur an der falschen Hälfte umgesetzt.

`R-23` prüft in Teil (4) deshalb **zuerst**, daß kein Inline-Stil die Tinte setzt, und meldet auch
den leeren Fall (findet es das Element nirgends im Markup, ist das ein Befund). Nachgesehen statt
vermutet: außer dieser einen trägt **keines** der von R-23 gerechneten Elemente einen farbsetzenden
Inline-Stil — der PWA-Knopf hat `style="display:none"` in `header.html`, das ist keine Farbe;
`.fdp-die.d20`, `.qref-row` und `.dms-attr-item` haben keinen.

**1b. Die Erhebung für die ganze Familie, nachgeholt in Prüfung W3-E, Runde 1.** Diese Akte hat die
Frage hier als „**nicht erhoben** — ein eigener Punkt für eine eigene Runde" geführt. Sie ist in
einem Durchgang erhoben, und sie war nicht leer. **259** Tags im Baum tragen `class=` **und**
`style=` (`sourceJs()` plus `assets/templates`, dieselben Quellen wie `inlineStilVon()`). Gezählt
nach der Form, über die sich streiten läßt, kommt man auf verschiedene Zahlen — die belastbare
Abgrenzung ist: **Basisregel** heißt, das Subjekt-Kompound des Selektors ist genau `.klasse`, ohne
zweite Klasse, Pseudoklasse oder Attribut; dynamische Werte (`${…}`) bleiben außen vor, weil sie
statisch nicht zu beurteilen sind. So gezählt: **12** Abweichungen von einer Basisregel und **1**
totgeschlagene Zustandsregel. **Drei** davon waren dieselbe Fehlerklasse wie diese hier, also ein
Inline-Wert, der vom CSS-Wert **abweicht** und eine Schwelle reißt oder einen Zustand stumm schaltet:

| Stelle | inline | was die Regel sagt | gemalt (d·l·s·c) | jetzt |
| --- | --- | --- | --- | --- |
| `features/initiative.js` `.init-type` (Unterzeile „Lair Action") | `color: var(--red)` | `initiative.css` `.init-type { color: var(--text-dim) }` | **4,21 · 4,35 · 3,88 · 4,49** auf dem getönten Lair-Ende — bei 0.75em in **allen vier** Themes unter 4,5 | `.init-entry.lair .init-type { color: var(--red-text) }`, **5,67 · 5,55 · 5,32 · 6,47** |
| `features/shops/shops-core.js` `.si-tag-v` (Etikett „Nachteil") | `color:var(--red)` | `loot.css` `.si-tag-v { color: var(--cyan) }` | **4,62 · 4,83 · 4,29 · 4,72** auf `.si-details` (`--bg-card`), **Sepia** darunter | `.si-tag-v.si-tag-neg { color: var(--red-text) }`, **6,22 · 6,17 · 5,88 · 6,80** |
| `systems/spellslots/quick-reference.js` `.qref-btn` (Löschknopf) | `border-color: var(--red)` | `dashboard.css` `.qref-btn:hover { border-color: var(--gold) }` | kein Kontrastmangel (`--red` gegen `--bg-hover` **3,36 · 3,56 · 3,36 · 3,16**), aber der Knopf hatte in **keinem** Theme eine Hover-Kontur | `.qref-btn-del { border-color: var(--red-text) }` mit 0-1-0, der Hover mit 0-2-0 gewinnt wieder; Ruhering **6,22 · 6,17 · 5,88 · 6,80** |

Die erste dieser drei ist die bezeichnendste: **drei CSS-Zeilen weiter** steht
`initiative.css` `.init-entry.lair .init-name { color: var(--red-text) }`. Die Tintenkorrektur der
Welle 2 ist am **Geschwister** angekommen und an der Unterzeile nicht — weil deren Tinte im JS stand
und im CSS gar nichts war, woran die Korrektur hätte greifen können. Wortgleich derselbe Mechanismus
wie bei diesem Knopf, nur eine Datei weiter.

**Was daraus folgt, und es steht diesmal nicht nur in einer Akte.** Die restlichen **9** Abweichungen
sind nachgesehen und geduldet, jede mit einem Grund in `INLINE_TINTE_GEDULDET` (die zwei
`#ef4444`-Knöpfe in `modals-editors.html` fallen auf einen Schlüssel, also 9 Einträge für 10
geduldete Stellen): die zwei Akzenteinträge der Systemgruppe im Navigationsmenü, vier Stellen des
eingefrorenen Editorleisten-Markups, der Verfolgen-Knopf der Quests (der Fläche **und** Tinte in
einem Zug setzt, also gar kein Alleingang der Tinte ist), die Sammelgruppe „Ohne Arc", der
Zählchip „+N" der Entity-Links und die Zeile „noch nicht eingerichtet" des Datei-Backups.
**R-23 Teil (8)** führt die Liste in **beide** Richtungen geschlossen — eine Stelle ohne Eintrag ist
ein Befund, ein Eintrag ohne Stelle auch —, damit sie mit jeder Behebung schrumpft statt zu
verwesen. Und warum bis dahin keine Ratsche hingesehen hat: **F-19** zählt `style="` ausschließlich
in `assets/templates`; JS-erzeugte Inline-Stile stehen in keinem Zählwerk, `INLINE_MAX` blieb beim
Entfernen eines Stils darum zu Recht bei 256, und die Klasse war ungedeckt.

**2. `.pwa-install-btn` — Hover mitgedeckelt plus eine nicht tönende Deklaration an `:active`**
(Commit `832ebde`). Der Nachtrag hatte `:active` gedeckelt und `:hover` ungedeckelt gelassen. Beide
halten 4,5, also schwieg jede Kontrastratsche — der Mangel war, daß die **gedrückte** Fläche in
Light und Sepia blasser wurde als die überfahrene und die Zustandsleiter auf dem Kopf stand
(Abstand zur Ruhefläche überfahren 1,14 gegen gedrückt 1,07 in Light, 1,19 gegen 1,11 in Sepia).

| Sprosse                 | vorher                     | nachher                    |
| ----------------------- | -------------------------- | -------------------------- |
| `:hover` (12 %)         | 5,75 · 4,55 · 4,77 · 8,40  | **5,75 · 4,78 · 5,14 · 8,40** |
| `:active` (22 %)        | 5,65 · 4,78 · 5,14 · 6,76  | 5,65 · 4,78 · 5,14 · 6,76 (unverändert) |

Der Deckel **verbessert** den Hover also zusätzlich. Dafür fallen die zwei Flächen danach in Light
und Sepia zusammen (beide 7 %) und liegen in Dark einen Prozentpunkt auseinander; nur in Contrast
bleibt der Unterschied deutlich (12/20 %). Der Druck wird deshalb von `transform: scale(0.97)`
getragen — dasselbe Mittel, mit dem der Nachtrag `.link-chip:hover` den Deckel aushalten ließ (dort
`scale(1.05)`). `transform` steht bewußt **nicht** in der `transition` der Grundregel: mit 0,15 s
liefe die Verkleinerung der Rückmeldung hinterher und beim Loslassen wieder zurück.

**Was daraus für R-18 folgt, und es ist kein Vorwurf an R-18.** Beide Lücken lagen außerhalb dessen,
was diese Ratsche nach ihrer Bauart sieht: die erste, weil D-2 `--bg-hover` bewußt ausschließt (mit
`--bg-hover` als Träger wäre jeder Deckel 0 %, also ein Verbot jeder Tönung); die zweite, weil eine
verkehrte Leiter kein Schwellenmangel ist. **R-23** urteilt genau über diese zwei Fragen: es rechnet
gegen die **tatsächliche** Fläche und prüft zusätzlich die **Richtung** der Leiter. Und es hängt
jede geführte Zahl an ein `R-23:`-Etikett im CSS, das bei jedem Lauf nachgerechnet wird — die 3,71
aus W2-D-06 wäre so nie entstanden.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
# Die fuenf Stellen samt Zeilennummern (Anker bewusst nicht in der Tabelle — sie rotten):
grep -n "concentration-badge:hover\|concentration-add-btn:hover" assets/styles/initiative.css
grep -n "link-chip:hover" assets/styles/core.css
grep -n "backup-entry-restore:hover" assets/styles/file-backup.css
grep -n "pwa-install-btn:active" assets/styles/pwa.css
# Die sechste, gekreuzte Stelle:
grep -n "dice-attr.save" assets/styles/dice.css
# Die beiden Ausschluesse in R-03, wortgleich:
grep -n "setzt eigene Tinte" -B 2 tests/unit/design-consistency.test.js
# Die Einschraenkung im R-04-Block samt Berichtigung:
grep -n "WORAUF SICH DIE ZAHL 128" -A 60 tests/unit/design-consistency.test.js
# Die Ratsche, die die Luecke schliesst:
npx jest tests/unit/design-consistency.test.js -t "R-18"
# Der Zweig fuer blanke Flaechen in R-04:
npx jest tests/unit/design-consistency.test.js -t "blanker Flaeche"
# Die Ratsche der drei Restposten aus Schritt 9:
npx jest tests/unit/design-consistency.test.js -t "R-23"
```

---

## W2-D-06 — Die Goldtinte des W20-Knopfs liegt auf zwei Rotstopps; die Zahlen standen im Kommentar, an keiner Schwelle

**Stand:** 2026-09-30, Welle 3 Schritt 9 — **ENTSCHIEDEN UND UMGESETZT** (Commit `862d885`):
Weg 1, beide Verlaufsstopps gedeckelt, min **5,49** gegen die tatsächliche Trägerfläche.
Aufgenommen am 2026-09-29 im Nachtrag der Welle 2, Runde 2, als Vorbestand seit Schritt 7 —
gefunden, als R-18 in Runde 2 auch die **Klassenform** der verfeinernden Regel zu sehen bekam
(W2-D-05). Der Nachtrag am Ende dieses Punktes nennt die Zahl, die der Entscheidung gefehlt hat,
und warum der Eintrag in R-18 trotzdem stehen bleibt.

### Worum es geht

```css
.fdp-die      { background: var(--bg-elevated); color: var(--gold-text); }
.fdp-die.d20  { background: linear-gradient(135deg,
                  color-mix(in srgb, var(--red) 20%, transparent),
                  color-mix(in srgb, var(--red-dark) 30%, transparent)); }
```

Dieselbe Bauart wie in W2-D-05, nur mit einer **Klasse** statt einer Pseudoklasse als
Verfeinerung: `.fdp-die.d20` ersetzt die Fläche der Grundregel vollständig durch zwei Rotstopps
und setzt **keine eigene Tinte**. Gemalt wird `var(--gold-text)` aus `.fdp-die` — Gold auf Rot.

### Was gemessen ist

Minimum über `--bg-card`/`--bg-dark`/`--bg-elevated` nach D-2 (dark · light · sepia · contrast):

- heute: **2,87** — 5,89 · **2,87** · **3,26** · 10,00
- mit dem Tönungsdeckel: 6,40 · **4,48** · 5,01 · 10,00 — **Light verfehlt um 0,02**

Gegen die **tatsächliche** Trägerfläche gerechnet ist es weniger dramatisch und immer noch
darunter. Das Panel `.floating-dice-panel` setzt `color-mix(in srgb, var(--bg-card) 98%,
transparent)`, also praktisch `--bg-card`; dagegen liest der Verlaufskopf
6,64 · 4,56 · 4,93 · 11,57 und der Verlaufsfuß 7,27 · 3,42 · 3,72 · 12,33. **Diese acht Zahlen
stehen seit Welle 2 Schritt 7 im Kommentar der Regel selbst** — sie waren nur nie gegen eine
Schwelle gehalten. Der Kommentar bewertet sie als „besser in Light und Sepia", und das stimmt
auch (vorher 2,29 bzw. 2,01 im Kopf); er sagt nur nicht, daß sie unter 4,5 bleiben.

### Warum keine Ratsche darüber urteilte

- **R-04** verlangt Fläche **und** Tinte in derselben Regel — `.fdp-die.d20` hat keine Tinte.
- **R-14** verlangt eine Nachfahrenschreibweise — `.fdp-die` ist kein Nachfahre von
  `.fdp-die.d20`, sondern sein Kopf.
- **R-18** sah bis Runde 2 nur Pseudoklassen als Verfeinerung.
- **R-12** urteilt über die Stelle, aber in einer anderen Sache: sie verbietet Skalentoken als
  Fläche. Der zweite Stopp stand bis Schritt 7 auf `--ra-crimson-rule` und ist genau deshalb auf
  `--red-dark` umgestellt worden (Entscheidung E1). Die **Lesbarkeit** der Beschriftung war in
  dieser Umstellung nie die Frage.

Seit Runde 2 steht das Paar als benannte Ausnahme mit min 2,87 in R-18 und meldet jede
Verschlechterung.

### Was zu entscheiden ist, und von wem

Eine D-4-Frage (Tinte gegen Tönung), keine Schreibweise:

1. **Nur deckeln** reicht nicht — 4,48 in Light, 0,02 unter der Schwelle. Eine Zahl, die man
   nicht runden darf, weil die Schwelle selbst die Rundung schon enthält.
2. **Eigene Tinte `var(--red-text)`** — gedeckelt 4,81 · 4,44 · 4,48 · 5,06, also in Light und
   Sepia weiterhin knapp darunter. Trägt nicht.
3. **Eigene Tinte `var(--text)`** — hält schon **ohne** Deckel: 9,38 · 8,02 · 5,07 · 14,03.
   Nimmt dem W20-Knopf aber die Goldbeschriftung, die alle anderen Würfelknöpfe tragen, und
   damit einen Teil seiner Sonderstellung. Mit Deckel 10,19 · 12,51 · 7,78 · 14,03.

Gewählt war vorerst: nicht geändert, hier geführt, in R-18 bewacht. Die Sichtprobe zu E1
(Schritt 4 der Vier-Themes-Runde, „hebt sich der W20 noch von den übrigen Würfelknöpfen ab")
fragt nach genau der Eigenschaft, die Weg 3 kostet — sie gehört vor diese Entscheidung, nicht
danach.

### Nachtrag Welle 3 Schritt 9 (2026-09-30) — Weg 1 trägt, weil die Fläche eine andere ist

**Der Satz „nur deckeln reicht nicht" war gegen die falsche Fläche gerechnet.** Beide Zahlen, die
oben stehen, sind richtig; der Schluß aus ihnen war es nicht. Die D-2-Dreierliste
(`--bg-card`/`--bg-dark`/`--bg-elevated`) ist hier nicht die Trägerfläche:
`background: linear-gradient(…)` ist die **Kurzschreibweise** und setzt `background-color` auf
`transparent` zurück — das `var(--bg-elevated)` der Grundregel `.fdp-die` ist damit weg. Dahinter
liegt genau eine Fläche, und sie steht zwanzig Zeilen weiter oben in derselben Datei:
`.floating-dice-panel` mit `color-mix(in srgb, var(--bg-card) 98%, transparent)`.

Dagegen gerechnet, Tinte `var(--gold-text)`, dark · light · sepia · contrast:

| Lage                         | ungedeckelt                    | gedeckelt                      |
| ---------------------------- | ------------------------------ | ------------------------------ |
| Verlaufskopf                 | 6,64 · 4,56 · 4,93 · 11,57     | 7,28 · 5,61 · 5,95 · 11,57     |
| Verlaufsfuß                  | 7,27 · 3,42 · 3,72 · 12,33     | 7,91 · 5,49 · 5,83 · 12,82     |
| **min beider Stopps**        | 6,64 · **3,42** · **3,72** · 11,57 | 7,28 · 5,49 · 5,83 · 11,57 |

min **5,49** — 0,99 **über** der Schwelle statt 0,02 darunter. Umgesetzt ist damit Weg 1 (nur
deckeln); Weg 3 („eigene Tinte `var(--text)`") ist nicht nötig geworden und kostet die
Goldbeschriftung nicht.

Die Vereinfachung „Träger = `--bg-card`" ist **gepinnt, nicht angenommen**: R-23 Teil (3) rechnet
die Reihe zusätzlich über die wirkliche Panelfläche und meldet jede Abweichung über 0,01. Gemessen
kostet sie genau 0,01, und nur in Sepia (5,82 gegen 5,83).

**Der Eintrag in R-18 bleibt, sein Wert ist von 2,87 auf 4,48 nachgezogen** (Commit `7266cb9`). Er
bleibt, weil R-18 nach seiner eigenen Bauart über D-2 urteilt wie R-04, R-11 und R-14, und dort
fehlen die 0,02. Er deckt damit **keinen Mangel mehr, sondern die bewußte Strenge von D-2**. Er
wird nachgezogen, weil 2,87 nach dem Deckel nicht mehr die Messung ist — mit der alten Zahl könnte
der Deckel lautlos wieder verschwinden. Mutationsprobe: beide `min()`-Klammern aus `dice.css`
entfernt, R-18 geht rot mit „eingetragen war min 4.48, gemessen 2.87".

**SICHTFOLGE, beziffert und auf der Sichtprobenliste (W3-F-01 Teil F).** `--tint-max` ist
13/7/7/20 %. Der Kopf fällt auf Faktor 0,65 · 0,35 · 0,35 · 1,00, der Fuß auf
0,43 · 0,23 · 0,23 · 0,67. Und weil der Deckel in **jedem** Theme beide Stopps auf denselben Anteil
zieht (13/13, 7/7, 7/7, 20/20), verliert der Verlauf sein **Deckkraftgefälle**; es bleibt das
Farbgefälle `--red` → `--red-dark` bei gleicher Deckung. Der Würfel wird also blasser **und**
flacher. Der Rahmen ist bewußt nicht mitgedeckelt — er ist keine Fläche unter der Schrift, sondern
eine Linie daneben; seine Zahlen (2,03 · 2,28 · 2,12 · 1,88, alle unter 3:1 wie schon vorher)
bleiben gültig.

Nebenbei korrigiert: der Kommentar an der Regel schrieb für den Verlaufsfuß in Sepia **3,71**.
Gemessen sind 3,7171, also 3,72 — abgeschnitten statt gerundet, folgenlos für das Urteil, aber
falsch. Genau diese Art Fehler findet **R-23** ab jetzt bei jedem Lauf: die fünf Zahlenreihen
dieser Regel stehen im CSS mit einem `R-23:`-Etikett und werden nachgerechnet, statt geglaubt zu
werden.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "fdp-die.d20" -A 60 assets/styles/dice.css
grep -n "floating-dice-panel" -A 40 assets/styles/dice.css | grep -n "background"
npx jest tests/unit/design-consistency.test.js -t "R-18"
npx jest tests/unit/design-consistency.test.js -t "R-23"
```

---

## W2-E-01 — Die Ruf-Leiste der Fraktionen baut einen ungültigen Farbwert und hat es immer getan

**Status: DOKUMENTIERT, nicht repariert.** Aufgenommen am 2026-09-29, Welle 2 Schritt 10.
So vom Plan verlangt („Nur dokumentieren, nicht reparieren").

### Worum es geht

`features/fraktionen/fraktionen-render.js` baut die Statusleiste der Rufstufe so:

```js
style="background:' + stufe.farbe + '22; border-left: 3px solid ' + stufe.farbe + '"
```

Das angehängte `22` soll eine 13-%-Tönung erzeugen. Diese Schreibweise (Alpha als zwei
zusätzliche Hexziffern) funktioniert **nur mit einem Hex-Literal**. `stufe.farbe` ist aber eine
`var()`-Referenz aus `FRAKTIONS_RUF_STUFEN` derselben Datei (fünf Stufen, alle mit Rollentokens).
Nach der Ersetzung stehen an der Stelle zwei getrennte Bestandteile; der Wert ist zur
Berechnungszeit ungültig, und die **ganze** `background`-Deklaration entfällt.

`.fr-ruf-statusbar` in `assets/styles/welt.css` setzt selbst keinen Hintergrund. Die beabsichtigte
Tönung erscheint also **in keinem Theme** und hat es nie getan. Es wirkt nur der linke Rand.

### Warum das nicht in dieser Welle repariert wird

Es ist kein Kontrastbefund — es fehlt eine Fläche, die nie da war. Sie erscheinen zu lassen wäre
eine **Sichtänderung ohne Entscheidung**, und die Fragen dahinter sind Gestaltungsfragen: welche
Stärke (der Tönungsdeckel aus E2 gilt für Flächen unter Schrift, und diese hier trägt Schrift),
und ob die Leiste überhaupt eine Fläche bekommen soll, nachdem sie seit jeher ohne auskommt.

Die Stelle trägt die Begründung jetzt im Klartext, damit sie nicht ein drittes Mal als „sieht
umgesetzt aus" durchgeht.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "fr-ruf-statusbar" features/fraktionen/fraktionen-render.js assets/styles/welt.css
grep -n "FRAKTIONS_RUF_STUFEN" -A 8 features/fraktionen/fraktionen-render.js
```

---

## W2-E-02 — Die Verweis-Vorschau liegt auf `.modal`; ihre Tinten gehören zu W2-C-01, nicht zu Schritt 10

**Status: OFFEN, gehört zu W2-C-01.** Aufgenommen am 2026-09-29, Welle 2 Schritt 10.

### Worum es geht

Schritt 10 stellt drei Stellen in `systems/entity-links.js` um (Status-Pille, Zaubergrad-Pille,
Schul-Pille). Alle drei setzen eine **eigene deckende Akzentfläche** und sind damit unabhängig von
ihrem Behälter — die Umstellung auf `var(--on-<rolle>)` ist dort richtig und gemessen.

Beim Nachsehen der Trägerfläche ist aufgefallen, dass **der Rest derselben Vorschau** es nicht ist.
Das Vorschaufenster wird in derselben Datei erzeugt und trägt `class="modal"` — also
`rgba(26, 26, 26, 0.95)`, die dunkle Fläche aus **W2-C-01**. Alle Fließtextzeilen der Vorschau
(Beschreibung, Belohnung, Rolle, Ort, Zeitaufwand, Reichweite, Dauer …) liegen darauf.

Dazu gehört eine **zweite Seltenheitstabelle** in derselben Datei, mit anderen Schlüsseln
(`very-rare`, `artifact` statt `veryrare`, `legendary`) und Rollentokens statt der Skala:

```js
const rarityColors = { common: 'var(--text)', uncommon: 'var(--green)', rare: 'var(--blue)',
                       'very-rare': 'var(--purple)', legendary: 'var(--gold)', artifact: 'var(--red)' };
```

Gemessen auf der zusammengesetzten Modalfläche (Schleier `--scrim-60` über der Seite, darauf
`rgba(26,26,26,0.95)`) — dark / light / sepia / contrast:

| Tinte | heute | mit der Textvariante |
| ----- | ----- | -------------------- |
| `var(--text)` (Fließtext) | 13,32 · **1,04** · **1,52** · 17,58 | — |
| `var(--text-dim)` | 4,96 · **2,90** · **2,93** · 7,57 | — |
| `var(--green)` (ungewöhnlich) | 10,09 · 5,06 · 5,25 · 12,81 | 10,09 · **2,72** · **2,66** · 12,81 |
| `var(--blue)` (selten) | 6,92 · **3,23** · 4,57 · 4,63 | 6,92 · **2,68** · **2,69** · 6,31 |
| `var(--purple)` (sehr selten) | 6,46 · **2,93** · **3,33** · 5,61 | 6,46 · **2,70** · **2,68** · 6,32 |
| `var(--gold)` (legendär) | 8,36 · 5,12 · **2,37** · 12,54 | 8,36 · **2,68** · **2,37** · 12,54 |
| `var(--red)` (Artefakt) | 4,67 · **3,45** · **3,64** · 4,40 | 6,29 · **2,70** · **2,65** · 6,34 |

### Warum hier nichts geändert wurde

**Die Textvariante wäre eine Verschlechterung.** `--<rolle>-text` ist in Light und Sepia die
**abgedunkelte** Fassung — richtig auf hellen Flächen, falsch auf dieser dunklen. Die Regel, die
Welle 1 überall durchgesetzt hat („Rolle als Tinte auf neutraler Fläche → Textvariante"), dreht
sich hier um, weil die Fläche eben nicht dem Theme folgt.

Das ist keine eigene Frage, sondern dieselbe wie W2-C-01: solange `.modal` in allen Themes dunkel
ist, braucht **alles** darauf themenblinde Tinte. Wer W2-C-01 nach Weg 1 entscheidet (Fläche auf
`var(--bg-card)`), wird diese Tabelle auf die Textvarianten umstellen müssen; nach Weg 2
(themenblinde `--on-modal`-Tokens) fällt sie mit den übrigen Zeilen zusammen. Beides gehört in
einen Zug, nicht in diesen Schritt.

**Nebenbefund für dieselbe Entscheidung:** die zweite Seltenheitstabelle ist eine Doppelführung.
`core/constants.js` führt `RARITY_LABELS` mit den Schlüsseln `normal/common/uncommon/rare/
veryrare/legendary`, diese hier mit `common/uncommon/rare/very-rare/legendary/artifact`. Die
Schlüssel überschneiden sich, die Bedeutungen verschieben sich um eine Stufe („common" ist hier
das, was dort „normal" ist), und die Farben stimmen nicht überein. Wer W2-C-01 anfasst, sollte das
mitentscheiden statt es zweimal zu übersetzen.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "rarityColors" -A 8 systems/entity-links.js
grep -n "entity-preview-modal" -A 14 systems/entity-links.js
grep -n "RARITY_LABELS" -A 8 core/constants.js
```

---

## W2-E-03 — Die Knöpfe des Ereignis-Logs blitzen im Überfahren hell auf

**Status: OFFEN, keine Kontrastfrage.** Aufgenommen am 2026-09-29, Welle 2 Schritt 10.

`assets/styles/party.css` `.event-log-btn:hover` setzt `background: var(--bg-alt)` und dazu
`color: var(--text)`. Beides folgt dem Theme und ist **in sich stimmig** — in Light dunkle Schrift
auf heller Fläche, gemessen weit über der Schwelle.

Der Log selbst ist seit Schritt 10 in allen vier Themes eine dunkle Blende mit themenblinder
Tinte (E6). In Light und Sepia blitzt beim Überfahren also ein **helles Rechteck in einer dunklen
Blende** auf. Das ist keine Verschlechterung durch diesen Schritt — es war vorher genauso, nur fiel
es nicht auf, weil dort ohnehin nichts zu lesen war.

Die Abhilfe wäre eine themenblinde Hoverfläche (etwa eine schwache weiße Auflage aus der Leiter,
die Schritt 3 angelegt hat) statt `--bg-alt`. Das ist eine Sichtänderung ohne Kontrastgewinn und
gehört deshalb in die Vier-Themes-Runde, nicht in diesen Schritt. Der Satz steht auch im CSS an
der Regel darüber.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "event-log-btn" -A 12 assets/styles/party.css
```

---

## W2-E-04 — Die Seltenheitsfarbe stand an vier Stellen als Schrift, gezählt war eine

**Status: ERLEDIGT am 2026-09-29 (Welle 2 Schritt 10).** Steht hier als Zählbefund, nicht als
offene Frage — die Lehre daraus betrifft jede weitere Bestandsaufnahme dieser Art.

Der Suchbefehl aus W1-C-02 sucht nach `style="… background …; color: var(--bg-…)"` und fand
fünf Stellen. Er findet **keine** Stelle, an der eine themenlose Farbe als **Schrift** gesetzt
wird — dort steht kein `var(--bg-…)`, sondern ein Template-Platzhalter. Genau so ist der
schlechteste Einzelwert des ganzen Farbbefunds durch alle Listen gefallen:

| Stelle | Was | in welcher Liste |
| ------ | --- | ---------------- |
| `features/initiative-loot.js` Gegenstandsname | Skala als Schrift | in keiner; erst in der Prüfrunde zu Welle 2 gefunden (1,12 in Sepia) |
| `features/initiative-loot.js` Detailüberschrift | dieselbe Skala, dieselbe Richtung | in keiner |
| `features/render-loot.js` Zuweisungsliste | dieselbe Skala, dieselbe Richtung | in keiner |
| `features/initiative-loot.js` Seltenheitsmarke | Theme-Tinte auf themenloser Fläche | W1-C-02, Plan Schritt 10 |

Drei von vier Stellen derselben Tabelle waren also ungezählt, und die **eine** gezählte war die
mit der harmloseren Richtung. Alle vier sind in Schritt 10 erledigt (Fläche und Tinte getrennt,
`RARITY_COLORS` und `RARITY_TEXT_COLORS`), und R-16 Teil (4) rechnet sie seither nach.

**Die Lehre:** ein Suchbefehl, der nach der falschen TINTE sucht, findet die Fälle nicht, in denen
die falsche Farbe die SCHRIFT ist. Wer eine Skala auf ihre Verwendungen absucht, muss nach dem
Namen der Skala suchen, nicht nach dem Muster des Fehlers.

**Nachtrag, Prüfrunde W2-E Runde 1:** diese Lehre war zunächst nicht in eine Schranke übersetzt.
R-16 Teil (4) rechnete die Kontraste nach, aber keiner der fünf Teile las die vier Stellen selbst
— der reparierte 1,12-Fall ließ sich rückstandsfrei zurückdrehen. Seit Teil (6) sucht die Ratsche
nach dem Namen der Skala, genau wie die Lehre es verlangt. Siehe W2-E-06.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
# Der alte Befehl (findet die Marke, nicht die drei Schriftstellen):
grep -rnoE "style=\"[^\"]*\"" --include=*.js core features systems ui render utils \
  | grep -E "color: ?var\(--bg-dark\)" | grep background
# Der Befehl, der alle vier findet:
grep -rn "RARITY_COLORS\|RARITY_TEXT_COLORS" --include=*.js core features systems ui render utils
```

---

---

## W2-E-05 — Der Alt-`#toast` ist sichtbar; das offene Risiko ist mit einem Bild geschlossen

**Status: OFFEN, gehört keiner Welle.** Aufgenommen am 2026-09-29, Welle 2 Schritt 10 (Sichtprobe).

Die Risikoliste des Wellenplans führt als achten Punkt: „Das Alt-`#toast`
(`utils/utilities.js`, Weiß auf festen Hexflächen, 2,15–3,76, keine verbergende CSS-Regel) ist
**ungeprüft** sichtbar — das braucht ein Bild, keine Rechnung, und ist in keiner Welle geführt."

**Das Bild gibt es jetzt.** Bei der Sichtprobe zu Schritt 10 (gebautes Bündel, Chromium,
`showToast()` dreimal aufgerufen) steht das Element sichtbar oben in der Mitte: 204 × 45 px,
`display: block`, Text „Konzentration gebrochen", `color: rgb(255,255,255)` auf
`rgb(245,158,11)`. Am Element gemessen: **2,15**. Es erscheint zusätzlich zum Ereignis-Log, also
zweimal dieselbe Meldung an zwei Stellen des Bildschirms.

Die vier Flächen und ihre beiden Tintenmöglichkeiten:

| Typ | Fläche | weiß (heute) | `#111111` |
| --- | ------ | ------------ | --------- |
| success | `#10b981` | **2,54** | 7,44 |
| error | `#ef4444` | **3,76** | 5,02 |
| warning | `#f59e0b` | **2,15** | 8,79 |
| info | `#3b82f6` | **3,68** | 5,13 |

Alle vier fallen durch, in allen vier Themes gleich (die Werte sind themenblind). Eine dunkle
Tinte brächte alle vier über 5.

**Warum hier nichts geändert wurde:** die Tinte zu tauschen wäre eine Zeile. Die eigentliche
Frage ist aber, ob das Element überhaupt noch erscheinen soll — sein Kommentar sagt „Backward
compatibility for E2E tests", und es dupliziert seit der Einführung des Ereignis-Logs jede
Meldung. Das ist keine Farbentscheidung, und es steht in keinem Schritt dieser Welle. Der Punkt
gehört vor die Entscheidung, nicht in einen Schritt.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -n "legacy #toast" -A 26 utils/utilities.js
grep -rn "#toast\|\.toast" assets/styles/*.css   # keine verbergende Regel
```

---

## W2-E-06 — Drei Ratschen-Lücken aus Schritt 10, alle drei geschlossen

**Status: ERLEDIGT am 2026-09-29 (Prüfrunde W2-E, Runde 1).** Steht hier als Lehrstück, nicht als
offene Frage. Alle drei Lücken haben dieselbe Form: eine Farbe war gemessen und repariert, aber
die Messung stand nur in Prosa, nicht in einer Schranke.

**Die Probe, mit der alle drei gefunden wurden:** die reparierte Stelle wieder auf ihren alten
Zustand zurückdrehen und die volle Jest-Suite laufen lassen. Bleibt sie grün, ist die Reparatur
unbewacht. Das ist billiger als jede Durchsicht und findet genau das, was Prosa nicht kann.

### (1) Der Ereignis-Log war von keiner Ratsche gedeckt

Entscheidung E6 hat dem Log themenblinde Tinte-Tokens gegeben (Light vorher 1,07). Beide
Rückdrehungen blieben grün: die vier Tintendeklarationen in `party.css` zurück auf die
Theme-Tinte, und die Tokenwerte in allen vier Theme-Blöcken auf einen dunklen Wert. Die neuen
Zahlen standen ausschließlich in einer Begründungs-Zeichenkette der R-10-Ausnahmeliste und in
CSS-Kommentaren; R-01 prüft nur die Namensmenge der Theme-Blöcke, R-13 greift nicht, weil die
Fläche ein rgba-Literal ist und keine Rolle.

**Geschlossen durch R-17** (drei Teile: Deklaration, Themenblindheit, Kontrast über beide
Flächen). Die zwei Flächenliterale liest R-17 aus der R-10-Ausnahmeliste, die dafür auf
Modulebene gezogen wurde.

### (2) R-16 prüfte die Seltenheits-TOKENS, aber nicht ihre Verwendung

Siehe W2-E-04. Dreht man in `features/initiative-loot.js` die Tinte des Gegenstandsnamens von
`${rarityInk}` auf `${rarityBg}` zurück, blieb die Suite grün — Teil (1) sucht nach
`color: var(--bg-…)` und sieht einen Template-Platzhalter nicht, Teil (3) liest
`core/constants.js`, Teil (4) urteilt über Tokenwerte statt über Verwendung.

**Geschlossen durch R-16 Teil (6):** er liest die Quelltexte, wie R-09 es für die Ortsfarben tut,
und prüft, welcher lokale Name an welche Tabelle gebunden ist und in welche Eigenschaft er geht.

### (3) R-16 Teil (4) rechnete gegen seine eigene Abschrift

Die zwei entscheidenden Trägerflächen — die Auswahlzeile und die zugewiesene Zeile — waren als
eingetippte Zahlen im Test gebildet, obwohl beide in der Quelle stehen. Der Spielraum an dieser
Stelle beträgt **0,00 bis 0,11**: die Auswahlzeile ist die bindende Fläche (sepia uncommon 4,50).
Eine gewöhnliche Gestaltungsanpassung — die Tönung von 10 % auf 15 % — drückt alle fünf Tinten auf
light 4,42–4,44 und sepia 4,30–4,32, während der Test weiter mit dem alten Wert rechnete,
4,50–4,53 meldete und grün blieb. Genau diese Bauart nennt der Kommentar zu `ZELL_TOENUNG` aus
Schritt 7 derselben Welle „die gefährlichste Bauart, die eine Ratsche haben kann".

**Geschlossen:** Basis und Stärke kommen jetzt aus dem Quelltext (`regelnMitRumpf` +
`zerlegeMix` für das CSS, eine rgba-Regex für das JS-Literal), mit Leerlaufschutz davor.

### Was sich dadurch sonst geändert hat

Die Ausnahmeliste in `tests/unit/module-test-coverage.test.js` schrumpft von 77 auf **75**:
`features/render-loot.js` und `features/initiative-loot.js` werden jetzt in ausführbarem Code
gelesen, nicht nur im Erklärtext erwähnt.

### Die Regel, die daraus folgt

Wer eine Farbe repariert, schreibt im selben Commit die Schranke dazu — und weist ihren Rotlauf
mit der kleinstmöglichen Rückdrehung nach. Eine Zahl in einem Kommentar oder in einer
Begründungs-Zeichenkette ist keine Schranke; sie wird beim nächsten Umbau nicht gelesen.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
npx jest tests/unit/design-consistency.test.js tests/unit/module-test-coverage.test.js
# Die Probe, die alle drei Luecken gefunden hat (Beispiel (3)):
sed -i '511s/var(--yellow) 10%/var(--yellow) 15%/' assets/styles/npcs.css
npx jest tests/unit/design-consistency.test.js   # muss jetzt rot sein
git checkout -- assets/styles/npcs.css
```

---

## W2-F-01 — Das Testmodell war blind für `@supports`; der Befund ist geschlossen

**Stand:** 2026-09-29, Welle 2 Schritt 11 (Abnahme). **Geschlossen**, Ratsche und Selbstprobe
stehen.

### Worum es ging

Beide Kaskadenmodelle von `tests/unit/design-consistency.test.js` lesen `variables.css` **flach**:
`aliasSchicht()` nimmt je Token den letzten Treffer, `themenblindeTokens()` zählt die Blöcke je
Token. Für flach nebeneinander liegende Blöcke ist das richtig. Ein `@supports not (…)`-Zweig
steht aber später in der Datei und greift trotzdem **nirgends** — er ist der Rückfall für eine
Fassung, die es oberhalb des Browserbodens nicht gibt.

Der Rückfall aus Schritt 11 hat das sofort sichtbar gemacht: `R-03` meldete für
`.calc-action-btn.primary:hover` plötzlich **5,73 statt 5,10**, `R-04` verschob sich mit — obwohl
im Browser keine einzige Farbe anders war. Das Modell urteilte über den Rückfallzweig statt über
das Sichtbare. In der Gegenrichtung wäre derselbe Fehler gefährlicher: ein Rückfall, der eine
Schwelle **hält**, hätte eine Regel grün gemeldet, die im Browser durchfällt.

### Was jetzt gilt

`ohneUnerreichbareZweige()` maskiert die verneinte Form zeilentreu, und zwar in **beiden**
Modellen. Zwei Eigenheiten sind Absicht:

- **Nur die verneinte Form.** Ob ein positiver `@supports`-Zweig greift, hängt an Bedingung und
  Boden. Die Funktion **wirft** dort hart, statt ihn als „gilt immer" zu lesen — wer einen
  einführt, entscheidet bewusst.
- **Kommentare werden vorher maskiert.** Die erste Fassung tat das nicht und las das Wort
  `@supports` aus dem Erklärtext neben dem Zweig; sieben Ratschen warfen auf einmal über einem
  Halbsatz. Die Selbstprobe hält genau diesen Fall fest.

Die Selbstprobe („Testmodell — unerreichbare @supports-Zweige") läuft gegen **Kunst-CSS**, nicht
gegen `variables.css`: sie muss grün bleiben, wenn der Zweig dort wieder verschwindet. Ihr
vierter Fall ist die Gegenprobe (ohne Maskierung „blau", mit „rot"); ohne ihn wären die drei
davor grün ohne Aussage.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
npx jest tests/unit/design-consistency.test.js -t "unerreichbare"
# Gegenprobe, dass die Maskierung wirklich etwas tut:
npx jest tests/unit/design-consistency.test.js -t "Unterschied"
```

---

## W2-F-02 — Die Bestandszahlen des Handoffs sind falsch; hier stehen die gemessenen

**Stand:** 2026-09-29, Welle 2 Schritt 11. **Kein Befund am Code** — eine Berichtigung, damit
Welle 3 die Drift nicht erbt. Das Auftragsdokument selbst liegt außerhalb dieses Repositoriums
und wird von hier aus nicht angefasst.

### Der Gesamtbestand

| | Handoff §1/§5 | gemessen (HEAD `ba3d3c2`, vor Welle 2) |
| --- | ---: | ---: |
| `rgba()`-Literale in `assets/styles/*.css` | 390 | **336** (332 Komponenten-CSS + 4 `--shadow`) |
| verschiedene vollständige Literale | 143 | **133** |
| verschiedene Zahlentripel | — | **47** |
| Hex-Farben im CSS | „Klasse" | **0** — der Beleganker `tools.css:1517 #ffd700` hat nie existiert |

### Die Überschneidung mit Welle 3, die der Handoff nur als Reihenfolgehinweis führt

**85 der 336 Literale stehen in einer Schattendeklaration** und gehören damit nach Welle 3:
78 in `box-shadow` (verteilt auf **71** Deklarationen, sieben tragen zwei Literale), 6 in
`text-shadow`, 1 in `filter: drop-shadow()` (`dice.css`). Der Handoff nennt für Welle 3
„88 box-shadow-Deklarationen" und für Welle 2 pauschal 390 Stellen — zwei Mengen, die sich zu
einem Viertel decken, ohne dass die Überschneidung beziffert wäre.

Das echte Revier der Welle 2 waren damit **247** Literale, nicht 390 und nicht 332. Genau diese
247 sind der Ausgangswert von `R-10`.

### Die Unterteilung, sechs von sieben Zahlen falsch

| Klasse | Handoff | gemessen |
| --- | ---: | ---: |
| exakte Treffer einer Dark-Rolle | 198 | 162 |
| Weiß-Auflagen | 35 | 29 |
| **schwarz außerhalb `box-shadow`** | **66** | **8** (davon 6 echte Flächen) |
| fremde Theme-Palette | 25 | 5 |
| palettenfremd | 66 | 28 |

„66 schwarz außerhalb `box-shadow`" ist um **Faktor 9** zu hoch — die 45 schwarzen Literale
liegen im `box-shadow`. Wer die Zahl für die Planung nimmt, dimensioniert die
`--overlay-*`-Arbeit für Stellen, die es nicht gibt, und zieht 45 Stellen versehentlich aus
Welle 3 nach vorn.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
grep -o "rgba\?([[:space:]]*[0-9][^)]*)" assets/styles/*.css | wc -l   # Rohtreffer inkl. Kommentare
npx jest tests/unit/design-consistency.test.js -t "R-10"
```

---

## W2-F-03 — Sichtungsliste für die menschliche Vier-Themes-Runde (Schritt 11)

**Stand:** 2026-09-29, Welle 2 Schritt 11. **Offen bis zur Runde.** Sechzehn Punkte, eng geführt.

Welle 2 ist per Konstruktion fast keine Sichtänderung: 8 von 8 Farbpaaren rendern
bildpunktgleich, der Sollstand ändert 24 von 3626 Digests und in allen 24 Fällen nur die
Schreibweise derselben Farbe. Eine ungeführte Runde durch 24 Ansichten fände deshalb **nichts**.
Diese Liste nennt die Stellen, an denen es etwas zu sehen gibt.

Material: `WELLE2_SCREENS=1 npx playwright test tests/e2e/features/welle-2-screens.spec.js`
legt 108 Bilder unter `tests/e2e/__screens__/welle-2/` ab (24 Ansichten × 4 Themes plus
`qref-hover`, `wuerfelblase`, `ereignis-log` je Theme). Umschalten im Kopf der App:
`PYTHONIOENCODING=utf-8 python build.py`, dann `dist/dnd-tracker-bundled.html` öffnen.

| # | Ansicht / Weg dorthin | Was sich geändert hat | Worauf zu achten ist |
| --: | --- | --- | --- |
| 1 | **Light und Sepia**, Schatzkammer · Zauber · Begegnungen · Initiative · NSC | **E2, die sichtbarste Änderung der Welle.** Die Füllung der farbigen Felder sinkt von 20 % auf **7 %**. Die Rolle liest sich dort künftig über die Schriftfarbe. | Ist eine Marke noch als Marke erkennbar — oder wirkt sie wie farbige Schrift auf blanker Karte? Das ist die Stelle, an der zu widersprechen wäre (E2 nennt den Preis ausdrücklich). |
| 2 | **Dark**, dieselben Ansichten | **E2.** Der Deckel liegt bei 13 %: Stellen mit 14/15/18/20/30 % sinken darauf, Stellen mit 10 % und 12 % bleiben stehen. | Stehen zwei Felder nebeneinander, die vorher verschieden stark waren und jetzt gleich aussehen? Eine verlorene Abstufung wäre ein Befund. |
| 3 | **Contrast**, dieselben Ansichten | **E2.** Nur 30 % → 20 %, sonst unverändert. | Verlieren die kräftigsten Marken ihr Signal? Im Kontrast-Theme ist die Fläche das tragende Merkmal, nicht die Schrift. |
| 4 | **Alle Ansichten** → roter W20-Knopf unten links anklicken | **E1.** `.fdp-die.d20` trägt die Rotrolle statt eines fremden Literals; in **Dark sichtbar heller** (`dc2626` → `ef4444`). Bild: `wuerfelblase-<theme>.png`. | Hebt sich der W20 noch von den übrigen Würfelknöpfen ab, und passt sein Rot zu den anderen roten Stellen derselben Ansicht? |
| 5 | **Zauber** → Kopfzeile einer Zauberkarte, in Ruhe **und** beim Überfahren | **E1.** Eigene Violettrolle statt Light-`--purple`; in **Dark sichtbar heller** (`7c3aed` → `a78bfa`). | Ist der Kopf noch vom Kartenrumpf zu unterscheiden, und ändert sich beim Überfahren noch sichtbar etwas? |
| 6 | **Start** → `/` drücken → Reiter **Regeln** → Abschnitt „Typische Proben" → Zeile überfahren | **E3.** Die Zeile füllt sich nicht mehr, sondern bekommt einen **Umriss** (1px `--gold-dim`). Bild: `qref-hover-<theme>.png`. | Ist der Umriss als Rückmeldung erkennbar — und verwechselt man ihn **nicht** mit dem Tastaturfokus? Der ist 2px `--gold`. |
| 7 | **Beliebig** → eine Aktion auslösen, die eine Meldung erzeugt (z. B. speichern) | **E6.** Der Ereignis-Log behält seine dunkle Blende und bekommt themenblinde Schrift. In **Light und Sepia** erstmals lesbar (vorher 1,05–3,21). Bild: `ereignis-log-<theme>.png`. | Wirkt die Blende noch dunkel (sie soll unverändert aussehen), behalten die vier farbigen Randstreifen ihren Ton, und sind die Kopfknöpfe lesbar? |
| 8 | **Werkzeuge / Suche** | **E1.** Sechs Goldstellen wechseln von Münzgold (`255,215,0`) auf `var(--gold)` — außer im Contrast-Theme wärmer und dunkler. Zusätzlich: die Trefferhervorhebung der Suche trägt jetzt `--text` statt `--gold`. | Stehen zwei verschiedene Goldtöne nebeneinander? Und ist der hervorgehobene Treffer noch auf Anhieb zu finden? |
| 9 | **Soundboard** | Die Laufschiene (`.sb-progress`) ist eine 20-%-Tönung von `--text-dim` statt eines Fremdgraus und folgt jetzt dem Theme. | Der Blick gilt dem **goldenen Balken darauf**: hebt er sich in allen vier Themes ausreichend von der Schiene ab? |
| 10 | **Initiative** · **DM-Screen** · **NSC** → die farblosen Zustands- und Beziehungsmarken | Fläche aus `--text-dim` getönt, **Schrift jetzt `--text` statt `--text-dim`** — sie liest sich kräftiger als bei den farbigen Geschwistern. | Schreit die neutrale Marke jetzt lauter als eine rote oder grüne? Eine umgekehrte Rangfolge wäre ein Befund. |
| 11 | **Schatzkammer**, Light und Sepia → Gegenstandsname, Detailüberschrift, Zuweisungsliste | Die fünf Seltenheitsfarben als **Schrift** werden dort deutlich dunkler. | Sind die fünf Stufen **untereinander** noch unterscheidbar? Sie liegen nach der Abdunklung enger beieinander als in Dark. |
| 12 | **Schatzkammer** (Seltenheitsmarke) · **Quests** (Verfolgen-Knopf) · **Verweise** (Pillen der Vorschau) | Schrift auf voller Akzentfläche: `--bg-dark` → `--on-<rolle>`. In **Light und Sepia** von fast weiß auf fast schwarz. | Wirkt keine dieser Marken „invertiert"? In Dark und Contrast darf sich fast nichts ändern. |
| 13 | **DM-Screen** → Widget „Fertigkeiten" | Die fünf Attributköpfe verlieren ihre **Schriftfarbe** (`--attr-*` → `--text`); die Tönung bleibt und trägt die Zuordnung allein. | Ist auf einen Blick noch zu sehen, welche Fertigkeit zu welchem Attribut gehört? |
| 14 | **Initiative** · **DM-Screen** → Zustand „liegend" | `.condition-prone` wechselt von `--orange-dim` auf `--orange` und wird **heller** — wie `grappled` und `restrained`. | Passt „liegend" jetzt zu seinen Geschwistern, und sieht die Zwillingsmarke im DM-Screen genauso aus? |
| 15 | **Welt → Zeitleiste**, Light und Sepia | `.tl-typ-reise` trägt die Grünrolle, Deckel und Schriftvariante zusammen heben sie von 2,32 auf 4,67. | Ist der Reise-Eintrag noch von den übrigen Zeitleisten-Typen zu unterscheiden? |
| 16 | **Quer durch alle Ansichten**, in Light oder Sepia | Sucharbeit, kein Einzelfall: die Deckelung steht an **119 Stellen** im Komponenten-CSS einzeln in der Datei (`grep -rc "var(--tint-max)" assets/styles/*.css` → 121 Treffer, zwei davon in `variables.css`: eine Erklärung und die Vorlage). | Fällt **eine** Marke auf, die deutlich stärker oder schwächer gefüllt ist als ihre Nachbarn? Das wäre ein Tippfehler in einem Prozentwert — die einzige Fehlerart, die keine Ratsche fängt. |

### Was diese Runde **nicht** finden kann

Kontrastwerte. Die sind gemessen und durch `R-02` bis `R-05`, `R-11` und `R-14` gesichert; ein
Auge misst sie nicht nach. Die Runde beantwortet genau eine Frage, die keine Messung beantwortet:
**ob eine 7-%-Fläche in Light und Sepia noch als Fläche wahrgenommen wird** (der Abstand zur Karte
beträgt dort rund 1,05).

---

## W3-F-01 — Sichtprobenliste der Vier-Themes-Runde (Welle 3, Schritt 10)

**Stand:** 2026-09-30, Welle 3 Schritte 3 und 4, **berichtigt in Runde 2 der Nachprüfung** (Teil B
von 22 auf 27, Teil C um die zwei Farbfeld-Marken), **erweitert nach der Umsetzung der
Höhenlagen** (Teil A von 6 auf 10 Einträge: die Tinten, die von Gold oder Rot auf Schwarz
gehen, der gleich gewordene Hover des Schnellreferenz-Knopfs, die größte Deckungsänderung in
Light/Sepia und der Doppelzustand des Würfelknopfs bei ausgesetzter Animation) und **berichtigt in
Runde 1 der Prüfung W3-B** (Eintrag 7 von sieben auf fünf Stellen: die zwei Höhenlagen des
Würfelknopfs werden von `floatingPulse` überschrieben und sind auf keinem Schirm zu sehen; Teil B von
27 auf 41 Regeln mit sichtbarem Rahmen, weil die Klassifikation die Regeln übersah, die ihren Rahmen
nur **umfärben** — darunter der schlechteste Doppellinienfall der Welle mit 1,05)
und **erweitert nach der Umsetzung der Schritte 5 und 6** (neuer **Teil E** für die fünf Ringe,
Teil C um die sechs **Text-Leuchten** und die drei Schatten, die bewusst draußen bleiben;
Eintrag 6 in Teil A trägt jetzt Datei, Selektor und alle vier Themes statt einer halben Zahl)
und **erweitert nach der Umsetzung der Schritte 7 und 8** (Teil A von 10 auf **13** Einträge:
die Schublade des Statblocks, die sieben Außenlagen des Vorlesetextes — die der Plan
fälschlich für folgenlos hielt — und die zwei weißen Glanzkanten als Nachweis, dass sie nicht
übersehen wurden; **Teil D** von vier Sätzen auf die vollständige Messung, weil die sechs
JS-Stellen **nicht** in der Planfassung umgesetzt sind, sondern nach **W3-D-05** verstärkt;
dazu unter Teil E die Notiz, warum die Ausnahmeliste mit Paragraph 7 nicht deckungsgleich
werden kann) und **erweitert nach der Umsetzung des Schritts 9** (neuer **Teil F** mit den drei
Restposten der Wellen 1 und 2 — dem gedeckelten W20-Knopf, dem Umriß statt der Füllung an der
Sicherungsliste und der gedeckelten Hover-Sprosse des PWA-Knopfs; zwei davon sind **nur im
Überfahren oder im Drücken** sichtbar. Diesen Teil F hatten die Kommentare des Schritts 8 schon
genannt, bevor es ihn gab — jetzt gibt es ihn).
**Offen bis zur Runde.** Gesichert durch **R-20** und **R-21** in
`tests/unit/design-consistency.test.js`: die Tests „jede Gluehlage, deren Deckung ODER Ton
sich aendert, steht in der Aktenlage unter W3-F-01", „jeder Rahmennachbar mit Abstand unter 3
steht namentlich in der Aktenlage unter W3-F-01", „jede von einer Animation ueberschriebene Lage
steht in W3-F-01 als nicht gerendert", „jeder Ring, dessen Dicke, Deckung oder Ton sich aendert,
steht zeilentreu in W3-F-01", „vier Text-Leuchten wechseln den Ton, und jede steht zeilentreu in
W3-F-01" und „die drei nicht mitgenommenen Schatten sind Hoehenform und stehen benannt in
W3-F-01" gehen rot, wenn eine Stelle hier verschwindet.
Diese Liste kann also nicht durch Vergessen kürzer werden.

**Die drei Prüfungen aus R-21 sind zeilentreu**, nicht teilstringweise: sie verlangen Datei und
Marke in **einer** Zeile und tragen denselben Riegel gegen Präfixtreffer wie die Animations-
ratsche. Das ist die stärkere Form, und sie ist hier möglich, weil jede der zwölf Stellen eine
eigene Tabellenzeile hat.

Was die Führungs-Ratschen **nicht** leisten: sie suchen Datei und Selektor als Teilstrings im
Abschnitt, nicht als Paar in einer Zeile. Eine Stelle kann darum durch einen Nachbareintrag
mitgedeckt scheinen — `dice.css` → `.floating-dice-trigger` gilt schon durch
`.floating-dice-trigger:hover` als geführt. Sie steht trotzdem ausdrücklich in Teil B. Die dritte
Ratsche (Animation) ist die **einzige** hier, die zeilentreu prüft: sie verlangt das Paar und das
Wort „nicht gerendert" in **einer** Zeile und verbietet dasselbe Paar in der Aufzählung des
Eintrags 7.

### Warum sie existiert

Welle 3 ist die erste Welle, die der versionierte Stil-Sollstand **nicht** abnehmen kann: von
3626 Digests führen genau **6** einen `box-shadow` ungleich `none`. Von 71 Deklarationen
erreichen nur 2 einen Ruhezustands-Schlüssel, 8 hängen an `:hover`/`:focus`, 61 liegen außerhalb
der View-Container. Wer aus „6 von 3626 grün" auf „die Welle ist belegt" schließt, hat 61 von 71
Deklarationen nie gesehen.

`R-19` und `R-20` messen dafür Geometrie, Zuordnung und Kontrastabstand — aber keine der beiden
beantwortet die Frage, die diese Runde beantwortet: **ob eine Höhenlage noch als Höhe und eine
Leuchtmarke noch als Marke gelesen wird.**

### Keine Zeilenanker in dieser Liste, und das ist Absicht

Die Stellen stehen als **Datei + Selektor**, nicht als `datei.css:ZEILE`. Grund: die drei
Zeilenanker, die das Auftragsdokument für Welle 3 nennt (`core.css:857`, `initiative.css:922`,
`dice.css:621`), zeigen alle drei ins Leere — richtig sind 840, 1055 und 634. `R-19` führt
Zeilennummern und hält sie in einem **eigenen** Test gegen die gefundene Deklaration; hier, wo
niemand sie nachzieht, wären sie nach dem nächsten Kommentar-Commit falsch.
`tools/sync-aktenlage-anker.js` deckt nur die 123 Farbanker von W1-D-01 ab, nicht Schatten.

### Teil A — die Höhenlagen

| # | Stelle | Was sich ändert | Worauf zu achten ist |
| --: | --- | --- | --- |
| 1 | `encounters.css` → `#calculator-modal .modal-content` (Begegnungen → Rechner) | **Größter Sprung der Welle:** `0 20px 60px` → Stufe 3 `0 8px 32px`, Faktor 0,53. | Wirkt das Modal noch abgehoben, oder klebt es auf der Seite? Das ist die Stelle, an der zu widersprechen wäre (W3-D-02 nennt den Preis ausdrücklich). |
| 2 | `command-palette.css` → `.cp-box` (`Strg+Shift+K`) | `0 16px 48px` → Stufe 3, Faktor 0,67. | Dasselbe eine Stufe schwächer. |
| 3 | `core.css` → `.offline-indicator` | Stufe 2 statt Stufe 1, obwohl der Radius näher an 6 liegt als an 16: die Leiste ist `position: fixed`, eine frei schwebende Auflage. Weichzeichnung 10 → 16 px, y 2 → 4 px. | Die einzige bewusste Abweichung von der Radiusregel. Sieht sie nach zu viel aus? |
| 4 | Die sechs `transition`-Regeln in **Contrast** (`core.css`, `dmscreen.css` zweimal, `migration.css`, `npcs.css`, `party.css`) | Aus weichem Aufsteigen wird hartes Einrasten — im Kontrast-Theme ist die Höhenlage ein Umriss ohne Verlauf. | Ruckelt es, oder liest es als bewusstes Einschnappen? |
| 5 | `dashboard.css` → `.dash-char:hover` und `party.css` → `.event-log-entry` | Dort trifft der Contrast-Umriss auf einen farbigen `border-left`-Statusstreifen. | Bleibt der Statusstreifen als Farbe erkennbar, oder verschluckt ihn der Umriss? |
| 6 | `migration.css` → `.wizard-step.active` (Umzugsassistent, der aktive Schritt) | **Drei Änderungen auf einmal:** Dicke 2 → 3 px (Faktor 1,50 in der Breite), Deckung 30 % → 15 % (Faktor 0,50) **und** der Ton, denn das Literal `rgba(212,175,55,0.3)` war themenblind. Der Ring wird breiter, halb so dicht und in Light/Sepia/Contrast anders gefärbt. Abstand zum Assistentenkasten (`--bg-card`), gerechnet mit dem Ton, der vorher wirklich dastand: dark 1,89 → 1,32 · light 1,24 → 1,17 · sepia **1,21 → 1,26** · contrast 1,85 → **13,46**. | Die Abschwächung des Schritts 6 — aber **nur in Dark und Light**: in Sepia gewinnt der Ring leicht, in Contrast massiv. (Die erste Fassung dieser Zeile rechnete das „vorher" mit dem Gold des jeweiligen Themes und schrieb darum sepia 1,60 → 1,26, also eine Abschwächung, wo eine Verbesserung steht; gefunden in Runde 1 der Prüfung **W3-C**.) Ist der aktive Schritt in Dark und Light noch als der aktuelle erkennbar? Die Punktfläche selbst trägt `var(--gold)` gegen `var(--text-dim)` an den inaktiven und ist unberührt — der Zustand hängt also nicht allein am Ring. Vollständig in **Teil E**. |
| 7 | **Die fünf farbigen Höhenlagen, die schwarz werden** (Schritte 3 und 4): `dashboard.css` → `.qref-fab:hover` · `dmscreen.css` → `.dragging` · `dmscreen.css` → `[data-sortable].drag-over` (zweite Lage) · `loot.css` → `.shop-cat-badge.active` · `loot.css` → `.shop-sort-btn.active` | Sie trugen goldene Tinte (`rgba(212,175,55,.3/.4)`) und tragen jetzt die schwarze Tinte ihrer Stufe. **In Dark verlieren sie ihren farbigen Hof praktisch ersatzlos:** gerechnet mit `tests/unit/helpers/wcag-contrast.js` gegen alle vier Dark-Flächen fällt der Abstand Hof-zu-Untergrund von **1,79–2,40 auf 1,03–1,46**, auf `--bg-dark` je auf 1,03–1,05. In **Light** steigt er von 1,15–1,33 auf **1,24–1,61**, in **Sepia** von 1,13–1,29 auf **1,23–1,52** — dort hebt der schwarze Hof also eher besser ab, nur ohne den Farbhinweis. | **Fehlt der Farbhinweis in Dark?** Vier der fünf melden einen Zustand (Ziehen, Ablegen, aktive Kategorie, aktive Sortierung), eine ist ein Hover. Wo der Zustand nur am Schatten hing, ist er in Dark jetzt weg — Hintergrund, Rahmen und Schriftfarbe müssen ihn allein tragen. |
| 7a | **Warum hier fünf und nicht sieben stehen** (Prüfung W3-B, Runde 1) | Die zwei roten Höhenlagen des Würfelknopfs standen hier mit `rgba(220,38,38,.4/.5)` und zogen die Dark-Spanne auf 1,48–2,40, die Light-Spanne auf 1,15–2,28 und die Sepia-Spanne auf 1,13–2,21. Beide werden von `floatingPulse` überschrieben und sind **nicht gerendert** — siehe Eintrag 10. Die drei Spannen oben sind ohne sie neu gerechnet. | Nichts. Dieser Eintrag ist nur die Begründung der Zahlen darüber. |
| 8 | `dashboard.css` → `.qref-fab` **und** `.qref-fab:hover` liegen jetzt auf **derselben** Stufe 2 | Folge der Radiusregel: Ruhe hatte 12 px, Hover 20 px, beide liegen näher an 16 als an 6 oder 32. Der Hover-Schatten ist damit **wertgleich mit dem Ruhezustand**; die Rückmeldung beim Überfahren trägt allein noch `transform: scale(1.1)`. | Reicht das Größerwerden als Rückmeldung, oder braucht der Knopf im Hover Stufe 3? Das wäre **ein** Wert in der Ort→Stufe-Tabelle von R-19 und **einer** in `dashboard.css`, keine Leiteränderung. |
| 9 | `editors.css` → `.editor-toolbar .tb-menu` in **Light und Sepia** | Die dichteste Schattendeklaration des ganzen Bestands (0,65) steht dort jetzt auf 0,20 bzw. 0,22, Faktor **0,31**; dazu y 14 → 8 px. | Die größte Deckungsänderung der Schritte 3 und 4. Steht das Werkzeugmenü in Light noch frei, oder liegt es flach auf? |
| 10 | `dice.css` → `.floating-dice-trigger` und `.floating-dice-trigger:hover` sind bei laufender Animation **nicht gerendert**; sichtbar werden sie nur bei **ausgesetzter Animation** (`prefers-reduced-motion`) | Die Regel trägt `animation: floatingPulse 3s ease-in-out infinite`, und `@keyframes floatingPulse` setzt `box-shadow` in allen drei Bildern mit der konstant roten ersten Lage `0 4px 16px rgba(220,38,38,0.4)` (R-19-Ausnahmen 10 und 11). Animationsdeklarationen stehen in der Kaskade **über** normalen Autorendeklarationen — auch über `:hover` und unabhängig von der Spezifität; nur `!important` schlüge sie, und keine der beiden trägt es. Läuft die Animation, sieht man nur die Bilder; setzt sie aus, steht ein **schwarzer** Schatten, wo vorher ein roter stand. **Der `:hover`-Schatten war schon vor Welle 3 toter Code** und ist in Runde 1 der Prüfung W3-B als lebend nachgemessen worden. | Kein Fehler, aber der einzige Ort der Welle, an dem dieselbe Regel zwei verschiedene Gesichter hat. Nur mit abgeschalteten Bewegungen prüfbar. **Für Schritt 7:** wer die Höhe des Knopfs wirklich auf die Leiter holen will, muss sie aus `floatingPulse` nehmen — das ist eine Entscheidung dort, nicht hier. **Für den Bericht von Schritt 10:** die Geometrieänderung an `.floating-dice-trigger:hover` (Weichzeichnung 24 → 32 px, y 6 → 8; einer der fünf Gleichstände, die nach oben aufgelöst wurden) ist wertgeändert, aber **nicht gerendert** — sie darf nicht unter den sichtbaren Sprüngen mitgezählt werden. |

| 11 | `initiative.css` → `.init-statblock-content` (die **Schublade** des Statblocks, Schritt 7) | Sie geht auf ihr eigenes Token `--shadow-drawer`, nicht auf Stufe 2. In **Dark wortgleich** (das Token trägt dort bewusst die gemessene Tinte 0,50 weiter statt der 0,45 von Stufe 2). In Light und Sepia bleibt die Geometrie (`-4px 0 24px`), aber die Deckung fällt **0,50 → 0,14** bzw. **0,16** (Faktor 0,28/0,32, in Sepia zusätzlich warme Tinte `rgba(60,40,10)`). In **Contrast wechselt die Form**: aus der 24-px-Weichzeichnung wird ein harter 2-px-Umriss links (`-2px 0 0 0 #aaa`). Abstand des Hofes zum Backdrop (gerechnet als `--scrim-60`, also 60 % Schwarz über `--bg-dark`): dark 1,01 → 1,01 · light **2,13 → 1,24** · sepia **2,01 → 1,13** · contrast 1,00 → **9,04**. | **Trennt sich die Schublade in Light und Sepia noch vom Backdrop?** Das ist die stärkste Abschwächung des Schritts 7. Der Backdrop ist selbst schon dunkel (`#626262`), ein dunkler Hof darauf ist dort ohnehin schwach — die Frage ist, ob die Kante des 420-px-Panels ohne den Hof verschwimmt. In Contrast umgekehrt: dort steht jetzt eine sichtbare Kante, wo rechnerisch nichts war. |
| 12 | **Die sieben Außenlagen des Vorlesetextes** (`party.css` → `.read-aloud` Grundton und `.parchment`/`.crimson`/`.violet`/`.sage`/`.sky`/`.slate`, Schritt 7) | Der Plan nennt das „einen reinen Namenswechsel ohne Sichtfolge". **Das ist nicht richtig.** `--shadow-1` ist nicht wertgleich mit dem alten `0 2px 6px rgba(0,0,0,0.15)`: die Geometrie ist in Dark/Light/Sepia wortgleich, die **Deckung ändert sich in jedem Theme**, und in Contrast wechselt die Form ganz. Dark **0,15 → 0,35** (Faktor 2,33, der Hof wird **stärker**) · Light 0,15 → 0,10 (0,67) · Sepia 0,15 → 0,12 (0,80) plus warme Tinte · **Contrast**: `0 2px 6px` → `0 0 0 1px #888`, ein harter Umriss statt eines Hauchs. Abstand je neutraler Fläche: dark 1,01–1,12 → 1,03–1,27 · light 1,40–1,41 → 1,24–1,25 · sepia 1,40–1,41 → 1,23–1,25 · **contrast 1,00–1,12 → 3,56–5,92**. Die sieben `inset`-Papiertöne bleiben roh und unberührt (R-19-Ausnahmen 1–7). | **Contrast ist der eigentliche Seheindruck:** sieben Vorlesekästen bekommen dort einen sichtbaren Umriss. Der Kasten trägt schon einen `border-left: 4px` in seiner Papierfarbe und einen Verlauf als Fläche — konkurriert der neue Umriss mit dem Papierrand, oder rahmt er ihn? In Dark die Gegenfrage: der Hof ist **dunkler** geworden, wirkt der Kasten jetzt tiefer eingesetzt als gewollt? |
| 13 | **Die zwei weißen Glanzkanten** — `dice.css` → `.floating-dice-panel` und `dmscreen.css` → `.modal`, je `0 0 0 1px rgba(255,255,255,0.05) inset` | **Nichts ändert sich.** Sie stehen hier, weil Paragraph 7 des Handoffs sie nicht kennt und Welle 2 sie unter ihren eigenen Ausnahmen führte — sie fielen zwischen die Wellen. Seit Schritt 7 sind sie namentlich als R-19-Ausnahmen **8 und 9** geführt, mit Grund: sie sind **themenblind** (eine Lichtkante auf einer Glasfläche, in jedem Theme dieselbe), und genau deshalb bleibt die Contrast-Prüfung von R-19 auf den Theme-Block beschränkt — ein Lauf über den ganzen Baum schlüge an ihnen an, obwohl sie mit Contrast nichts zu tun haben. | **Für die Runde nichts zu tun.** Der Eintrag ist der Nachweis, dass sie nicht übersehen wurden. Die Ausnahmeliste im Test hat damit **14** Einträge; Paragraph 7 des Handoffs nennt in einer Zeile drei Gruppen und kann mit ihr nicht deckungsgleich werden — siehe die Notiz unter Teil E. |

### Teil B — die Umrisse in Contrast: **41** Regeln mit sichtbarem Rahmen, nicht 27, nicht 22, nicht 13

Die Entscheidung W3-D-01 stellt Höhe in Contrast als harten Umriss dar (`#888` / `#aaa` / `#ccc`,
getrennt über den Spread 1/2/3 px). Der Plan nennt als Kandidaten für „Umriss nicht von Rahmen zu
unterscheiden" nur die **13** Schattenregeln mit `border: 1px solid var(--border)`. Gemessen am
2026-09-30 tragen **zusätzlich neun** Schattenregeln einen Rahmen aus `--gold` — und **fünf
weitere** einen anderen farbigen Rahmen. Das ergab 27. **Vierzehn weitere** kamen in Runde 1 der
Prüfung W3-B dazu: sie **färben** ihren Rahmen nur **um** (`border-color`), während Breite und Stil
aus der Basisregel kommen. Summe **41**.

**Warum hier zuerst 22 stand.** Die erste Fassung dieses Abschnitts zählte drei Klassen
(13 + 6 + 3) und nannte die Summe eine Kandidatenzahl. `rahmenArt()` in `R-20` hatte aber eine
**vierte** Klasse `sonst`, die kein Test angesehen hat, und dort lagen sechs weitere Regeln. Die
Zahl 22 war damit eine Messung von drei Klassen und keine Aussage über Geschlossenheit. Seit dem
2026-09-30 (Runde 2) fällt jede Schattenregel mit `border` in genau eine Klasse, und `R-20` rechnet
den Abstand **jeder** mit sichtbarem Rahmen.

**Und warum dann 27 auch noch zu klein war.** `rahmenArt()` suchte ausschließlich die
**Kurzschreibweise** `border: <breite> <stil> <farbe>` und gab `null` zurück, wenn sie fehlte. Eine
Zustandsregel, die nur `border-color` setzt, war damit unsichtbar — und genau so ist der
**schlechteste Doppellinienfall der ganzen Welle** geschrieben: `dmscreen.css` färbt beim Schweben
über fünf Kartenarten auf `--gold-dim` um und liegt mit **1,05** unter den 1,14 der drei
Stufe-3-Goldrahmen, an den zahlreichsten Karten der App. Seit Runde 1 der Prüfung W3-B fällt jede
Schattenregel mit Rahmen in genau eine von **sechs** Klassen — 13 `var(--border)` · 6 volles Gold ·
3 gemischtes Gold · 5 andere Farbe · **14 nur umgefärbt** · 1 `border: none` = 42. Die 42. Regel
(`encounters.css` → `#calculator-modal`) trägt `border: none !important` neben
`box-shadow: none !important` und ist deshalb kein Kandidat.

**Was die Klassifikation weiter NICHT sieht, und mit Absicht:** `border-left` und
`border-<seite>-color`. Ein Seitenstreifen ist keine Doppellinie rundherum; die sechs
`.read-aloud`-Varianten (`party.css`, 4 px links) wären sonst als Rahmennachbarn gezählt, obwohl der
Umriss an drei Seiten allein steht. Die Seitenstreifen sind in Teil A Eintrag 5 geführt.

**Von den 41 bekommen 32 überhaupt einen Umriss:** 27 aus der Kurzschreibweise und 5 der 14
Umfärber. Die neun anderen Umfärber tragen nur eine Glühe oder einen Ring — dort entsteht in
Contrast keine zweite Linie, und die Frage stellt sich nicht.

In Contrast ist `--gold` = `#ffd700`. Gerechnet mit `tests/unit/helpers/wcag-contrast.js`
(Selbstprobe `#777`/weiß = 4,48 und `#767676`/weiß = 4,54 bestanden):

| Stelle | Rahmen | Stufe | Umriss | Abstand Umriss ↔ Rahmen |
| --- | --- | --: | --- | --: |
| `dmscreen.css` → `.char-card:hover, .npc-card:hover, .location-card:hover, .encounter-card:hover, .spell-card:hover` | umgefärbt auf `var(--gold-dim)` = `#ccac00` | 2 | `#aaa`, 2 px | **1,05** |
| `core.css` → `.spell-tooltip` | voll `var(--gold)` | 3 | `#ccc`, 3 px | **1,14** |
| `editors.css` → `.editor-toolbar .tb-menu` | voll `var(--gold)` | 3 | `#ccc`, 3 px | **1,14** |
| `encounters.css` → `#calculator-modal .modal-content` | voll `var(--gold)` | 3 | `#ccc`, 3 px | **1,14** |
| `spells.css` → `.link-context-toolbar` | voll `var(--purple)` = `#ff00ff` | 2 | `#aaa`, 2 px | **1,35** |
| `party.css` → `.cf-languages-block .cf-lang-dropdown` | voll `var(--gold)` | 2 | `#aaa`, 2 px | 1,66 |
| `spells.css` → `.floating-toolbar` | voll `var(--gold)` | 2 | `#aaa`, 2 px | 1,66 |
| `tools.css` → `.wiki-link-suggester` | voll `var(--gold)` | 2 | `#aaa`, 2 px | 1,66 |
| `dashboard.css` → `.dash-char:hover` | umgefärbt auf `var(--gold)` | 2 | `#aaa`, 2 px | 1,66 |
| `dmscreen.css` → `[data-sortable].drag-over` | umgefärbt auf `var(--gold)` | 2 | `#aaa`, 2 px | 1,66 |
| `spells.css` → `.table-context-toolbar` | voll `var(--cyan)` = `#00ffff` | 2 | `#aaa`, 2 px | 1,85 |
| `dmscreen.css` → `[data-tooltip]::after` | `var(--border)` = `#555` | 1 | `#888`, 1 px | 2,10 |
| `loot.css` → `.shop-cat-badge.active` | umgefärbt auf `var(--gold)` | 1 | `#888`, 1 px | 2,53 |
| `loot.css` → `.shop-sort-btn.active` | umgefärbt auf `var(--gold)` | 1 | `#888`, 1 px | 2,53 |
| `dice.css` → `.floating-dice-trigger` (**nicht gerendert**, siehe Teil A Eintrag 10) | 20 % Weiß auf rotem Verlauf | 2 | `#aaa`, 2 px | 2,37 |
| die anderen **zwölf** `var(--border)`-Regeln | `#555` | 2 bzw. 3 | `#aaa` / `#ccc` | 3,21 / 4,64 |
| `command-palette.css` → `.cp-box` | 30 % Gold | 3 | `#ccc`, 3 px | 5,33 |
| `dice.css` → `.floating-dice-panel` | 30 % Gold | 3 | `#ccc`, 3 px | 5,33 |
| `encounters.css` → `#calc-budget-slider::-webkit-slider-thumb` | `var(--bg-dark)` = `#000` | 1 | `#888`, 1 px | 5,92 |
| `encounters.css` → `#calc-budget-slider::-moz-range-thumb` | `var(--bg-dark)` = `#000` | 1 | `#888`, 1 px | 5,92 |
| `dmscreen.css` → `.modal` | 20 % Gold | 3 | `#ccc`, 3 px | 7,20 |

**Die drei gemischten sind nicht das Problem, die sechs volldeckenden sind es.** 20–30 % Gold über
der Contrast-Karte lösen zu einem dunklen Oliv auf (`#41390e` bzw. `#584c0c`) und heben sich vom
Umriss deutlich ab. Volles `#ffd700` neben `#ccc` dagegen hat **keinen** Helligkeitsunterschied:
dort entsteht eine 4 px breite Bande aus 1 px Gold und 3 px Fast-Weiß, die als **verbreiteter
Rahmen** liest und nicht als Höhe. Die drei schlimmsten sind die Stufe-3-Fälle, und
`#calculator-modal .modal-content` ist gleichzeitig Punkt 1 dieser Liste.

**Die vier Nachzügler aus der alten Klasse `sonst` und der aufgeschlüsselten 13.** `--purple` mit
**1,35** ist schlechter als jeder volldeckende Goldrahmen derselben Stufe: die Werkzeugleiste für
Verweise bekommt in Contrast eine 3 px breite Bande aus 1 px Magenta und 2 px `#aaa`, in der die
Rahmenfarbe nicht mehr als eigene Linie liest. `--cyan` mit **1,85** ist derselbe Fall eine Spur
milder. `dmscreen.css` → `[data-tooltip]::after` ist die **einzige** der 13 `var(--border)`-Regeln
auf Stufe 1 und liegt mit **2,10** ebenfalls im Problembereich — die anderen zwölf liegen bei 3,21
und 4,64 und sind unauffällig; die frühere Sammelaussage „dort sollte `#888` gegen `#555`
unterscheidbar sein" betraf also genau eine Stelle. `dice.css` → `.floating-dice-trigger`
schließlich trägt `border: 2px solid var(--overlay-strong)` (20 % Weiß) auf einem Verlauf aus
`--red-dim` (70 % Rot auf Schwarz) und `--red-dark` (55 %); in Contrast löst der Rahmen dort zu
`#c23333` bzw. `#a33333` auf und liegt bei **2,37** bzw. 2,94 — gerechnet wird der schlechtere.
Der runde Würfelknopf bekäme damit einen 4 px breiten Doppelring. **Bekäme:** in Contrast steht
`--shadow-2` für den Umriss, und dieselbe Deklaration wird von `floatingPulse` überschrieben (Teil A
Eintrag 10). Der Doppelring erscheint darum nur bei ausgesetzter Bewegung. Die Zahl bleibt hier
stehen, weil sie richtig gerechnet ist und weil die Ratsche über **alle** Rahmennachbarn urteilt,
nicht nur über die gerenderten — sie ist keine Aufforderung zur Sichtprobe am laufenden Knopf.

**Die fünf Umfärber mit Umriss, und warum der erste die wichtigste Stelle dieses Teils ist.**
`dmscreen.css` → `.char-card:hover, .npc-card:hover, .location-card:hover, .encounter-card:hover, .spell-card:hover`
färbt beim Schweben auf `--gold-dim` um; in Contrast ist das `#ccac00`, und daneben steht der 2-px-Umriss
`#aaa`. **1,05** — der kleinste Abstand der ganzen Welle, kleiner als die 1,14 der drei
Stufe-3-Goldrahmen. Die Breite und den Stil malt die Basisregel (`.char-card`, `core.css`; ebenso
`.spell-card`, `spells.css`). Zwei Hinweise für die Sichtprobe: `.npc-card` trägt in der Basisregel
nur einen `border-left`, `.location-card` und `.encounter-card` haben im ganzen Stilbaum **keine**
Rahmenregel — die 4-px-Bande entsteht also an den Charakter- und Zauberkarten, an den NPC-Karten nur
links, und an Orts- und Begegnungskarten steht der Umriss allein. `dashboard.css` → `.dash-char:hover`
(1,66) ist derselbe Fall eine Spur milder und gleichzeitig Punkt 5 in Teil A — dort trifft der Umriss
zusätzlich auf den farbigen `border-left`-Statusstreifen. `dmscreen.css` →
`[data-sortable].drag-over` (1,66) legt neben den Umriss noch einen **eigenen** 2-px-Goldring als
erste Lage; dort liegen drei Linien übereinander, und der Rahmen kommt von der Klasse des Elements,
das das Attribut trägt (`.char-card`, `.quest-item`). Die zwei `loot.css`-Marken (2,53) sind die
mildesten der fünf: 1 px Gold neben 1 px `#888`.

**Anzusehen sind die 32 mit Umriss**, in dieser Reihenfolge: erst das Kartenschweben in `dmscreen.css`
(1,05), dann die drei mit 1,14, dann `--purple` (1,35), dann die fünf mit 1,66 (drei volle
Goldrahmen, `.dash-char:hover`, `[data-sortable].drag-over`), dann `--cyan` (1,85), dann
`[data-tooltip]::after` (2,10), dann die zwei `loot.css`-Marken (2,53), dann die restlichen zwölf
`var(--border)`-Regeln, zuletzt die drei gemischten Goldrahmen und die zwei
Schieberegler-Griffe als Gegenprobe. Der Würfelknopf (2,37) steht **nicht** in dieser Reihenfolge:
er ist nur mit abgeschalteten Bewegungen zu sehen und gehört damit zu Eintrag 10 in Teil A.

**Fällt die Ablesung an den Goldrahmen durch, ist die FORM falsch, nicht der Grauwert.** Die
Grauleiter ist nach oben ausgereizt: `#ccc` ist bereits die hellste der drei Stufen, und heller
würde den Abstand zu Gold weiter verkleinern. Dann kommen nur zwei Wege in Frage: ein **versetzter**
Umriss (y > 0, damit die Bande nicht rundherum gleich dick ist) oder für die betroffenen Stellen eine
helle weiche Auflage statt des harten Umrisses. Die Grauleiter nachzujustieren löst es nicht.

**Beim schlechtesten Fall der Liste ist es anders, und das ist wichtig.** `--gold-dim` = `#ccac00`
liegt in der Helligkeit fast genau auf `#aaa` — gemessen 1,05 —, hat zu `#888` aber **1,60** und zu
`#ccc` **1,38**. Die 1,05 sind also kein Ausreizen der Grauleiter, sondern ein Zusammentreffen mit
ihrer **mittleren** Sprosse; beide Nachbarsprossen wären besser. Weil die Stufe aus dem Radius folgt
und nicht frei wählbar ist, bleiben für diese eine Regel drei Wege: der versetzte Umriss, der
Verzicht auf den Umriss, oder ein anderer Contrast-Wert für `--gold-dim`. Alle drei sind **ein** Wert
und keine Leiteränderung. Zum Vergleich: volles `--gold` = `#ffd700` liegt bei `#888` auf 2,53, bei
`#aaa` auf 1,66 und bei `#ccc` auf 1,14 — dort wird es nach oben hin monoton schlechter, und nur
dort ist die Leiter wirklich ausgereizt.

### Teil C — die Glühlagen: **zwölf** von 14 ändern sich sichtbar

`--glow-gold` / `-yellow` / `-green` / `-red` tragen nach W3-D-03 nur die Farbe; die 14 Radien
bleiben unberührt (4/4/6/6/8/8/10/12/12/12/12/20/30/30, unter `R-20`). Die **Deckung** ist aber
ebenfalls keine Geometrie, und sie steht heute an jeder Stelle einzeln: sechs verschiedene Werte
(0,20 · 0,25 ×3 · 0,30 ×2 · 0,40 ×2 · 0,50 ×4 · 1,00 ×2; Median 0,40, Mittel 0,4536). Gewählt ist
**0,50** — der häufigste Wert —, damit **vier Stellen in Dark bildpunktgleich bleiben**.

**Die Überschrift hieß hier zuerst „alle 14 ändern ihre Deckung", und das war in zwei Richtungen
falsch.** Vier ändern die Deckung nicht (Faktor 1,00), und von diesen vier wechseln **zwei** in
den anderen drei Themes trotzdem den **Ton** — sie standen darum auf keiner Liste. Ihr Literal
`rgba(251, 191, 36, 0.5)` ist zufällig die Dark-Ziffer von `--yellow` (`#fbbf24`); nach der
Umstellung auf `var(--glow-yellow)` folgen sie dem Theme. Der Filter in `R-20`, der „ändert sich
sichtbar" auf die Deckungsdifferenz prüfte, sah davon nichts (Differenz null), und das Merkmal
`fremd` konnte es auch nicht fangen: es feuert nur, wenn das Literal **ungleich** dem Dark-Token
ist. Er prüft seit Runde 2 auf „Deckung **oder** Ton". Die zehn mit Deckungsänderung:

| Stelle | Deckung heute → Token | Faktor | Worauf zu achten ist |
| --- | --- | --: | --- |
| `encounters.css` → `.calc-threshold-marker` | 1,00 → 0,50 | **0,50** | Volldeckendes Gold wird halb so stark. Die Marke soll in zwei Sekunden zeigen, wo die Schwelle liegt. |
| `tools.css` → `.char-form-progress-dot.current` | 1,00 → 0,50 | **0,50** | Derselbe Fall: welcher Schritt des Formulars ist der aktuelle? |
| `spells.css` → `.floating-toolbar` | 0,20 → 0,50 | **2,50** | Der einzige große Sprung nach **oben**. Drängt sich die schwebende Leiste jetzt auf? |
| `dmscreen.css` → `.btn:hover` | 0,25 → 0,50 | 2,00 | Alle drei DM-Screen-Knöpfe glühen beim Überfahren doppelt so stark. |
| `dmscreen.css` → `.btn-success:hover` | 0,25 → 0,50 | 2,00 | ebenda |
| `dmscreen.css` → `.btn-danger:hover` | 0,25 → 0,50 | 2,00 | ebenda |
| `dice.css` → `.floating-dice-trigger:hover` | 0,30 → 0,50 | 1,67 | **Zusätzlich** wechselt der Ton: heute `#dc2626` (das Rot des Light-Blocks), künftig `--red` des jeweiligen Themes — in Dark sichtbar heller. **Aber: bei laufender Animation nicht gerendert.** Diese Glühlage steht in derselben Deklaration wie die Höhenlage aus Teil A Eintrag 10, und `floatingPulse` überschreibt `box-shadow` als Ganzes. Schritt 5 fasst hier also eine Stelle an, die nur mit abgeschalteten Bewegungen zu sehen ist; nicht in der Vier-Themes-Runde suchen. |
| `dice.css` → `.fdp-die.d20:hover` | 0,30 → 0,50 | 1,67 | derselbe Tonwechsel |
| `file-backup.css` → `.backup-dot-active` | 0,40 → 0,50 | 1,25 | Kaum sichtbar; nur zur Vollständigkeit. |
| `file-backup.css` → `.backup-dot-paused` | 0,40 → 0,50 | 1,25 | ebenda |

Und die **zwei mit gleicher Deckung, aber wechselndem Ton** — nicht mit Faktor geführt, der ist
1,00, sondern mit dem Ton je Theme:

| Stelle | Ton heute → Token | Faktor | Worauf zu achten ist |
| --- | --- | --: | --- |
| `editors.css` → `.editor-toolbar .color-swatch.active` | `rgba(251,191,36,.5)` fest → `--yellow` des Themes: Dark `#fbbf24`, Light `#ca8a04`, Sepia `#b58900`, Contrast `#ffff00` | 1,00 | Aus Amber wird in Light dunkles Ocker, in Contrast reines Gelb — an einem **Aktiv-Marker**. Ist das ausgewählte Farbfeld in Light und Sepia noch als ausgewählt erkennbar, oder verschwindet der Glanz in der Fläche? |
| `spells.css` → `.color-swatch.active` | ebenda (dieselbe Klasse in der schwebenden Leiste) | 1,00 | ebenda. Beide Leisten nebeneinander ansehen: sie sollen gleich aussehen, und in Dark tun sie es bildpunktgenau. |

**Wirklich unverändert bleiben nur zwei Stellen:** `dashboard.css` → `.dice-result.crit-effect`
und `.dice-result.fail-effect`. Sie tragen schon heute `color-mix(… var(--green)/var(--red) 50 %
…)` — gleiche Deckung, gleicher Ton, in allen vier Themes. Die anderen zwölf gehören auf diese
Liste.

**Die zwei Goldmarken oben sind die CSS-Zwillinge der vier JS-Sprungmarken aus W3-D-05** —
dieselbe Aufgabe („zeig mir in zwei Sekunden, wohin ich gesprungen bin"), dieselbe Richtung der
Änderung (volldeckend → halbdurchsichtig). Für alle sechs gilt dieselbe Antwort: **fällt eine
durch, bekommt sie eine höhere Deckung, am Code begründet** — nicht stillschweigend hinnehmen und
nicht als Ausnahme wegbuchen.

#### Und sechs **Text**-Leuchten dazu — Paragraph 3.2 regelt sie nicht, Schritt 5 nimmt sie mit

Neben den 71 `box-shadow`-Deklarationen trägt der Stilbaum **acht** `text-shadow` und **ein**
`filter: drop-shadow`. Genau **sechs** der acht haben die Glühform `0 0 <r>px <Farbe>` und gehen
deshalb auf `--glow-*`. Das kostet nichts: **alle sechs tragen heute 0,50** — genau die Deckung
des Tokens. Radius und Deckung bleiben an jeder der sechs unberührt; was sich ändert, ist allein
der **Ton**, und zwar an vier von ihnen in je drei der vier Themes. Gerechnet mit
`tests/unit/helpers/wcag-contrast.js` über die vier neutralen Flächen (Hof gegen Untergrund):

| Stelle | Radius | Ton heute → Token | Abstand vorher → nachher |
| --- | --: | --- | --- |
| `dice.css` → `.dice-hero-result.crit` (große Würfelansicht, Krit) | 20 px | `#4ade80` fest → `--green` des Themes | dark 2,97–3,51 → **gleich** · light 1,16–1,34 → 1,58–1,79 · sepia 1,16–1,30 → 1,50–1,65 · contrast 2,97–3,51 → 3,38–4,09 |
| `dice.css` → `.dice-hero-result.fail` (ebenda, Fehlschlag) | 20 px | `#ef4444` fest → `--red` des Themes | dark 1,75–2,07 → **gleich** · light 1,75–1,97 → 2,04–2,28 · sepia 1,73–1,91 → 1,92–2,12 · contrast 1,75–2,07 → **1,51–1,92** |
| `dice.css` → `.fdp-number.crit` (schwebendes Panel, Krit) | 20 px | wie oben | wie oben |
| `dice.css` → `.fdp-number.fail` (schwebendes Panel, Fehlschlag) | 20 px | wie oben | wie oben |
| `dashboard.css` → `.dice-crit` | 10 px | schon `color-mix(… --green 50 %)` — **kein** Wechsel | in allen vier Themes unverändert |
| `dashboard.css` → `.dice-fail` | 10 px | schon `color-mix(… --red 50 %)` — **kein** Wechsel | in allen vier Themes unverändert |

**Der einzige Wert, der in dieser ganzen Einheit schlechter wird,** steht in der zweiten Zeile:
in Contrast ist `--red` reines `#ff0000` und in der Luminanz dunkler als `#ef4444`; der rote
Texthof fällt dort von 1,75–2,07 auf 1,51–1,92. Er bleibt über dem Wert, den derselbe Hof heute
in Dark hat, und die Tinte der Zahl selbst ist `var(--red-text)` und nicht betroffen. **Anzusehen:**
die rote Fehlschlagzahl in Contrast, große Ansicht und Panel nebeneinander.

**Warum die zwei `dashboard.css`-Zeilen überhaupt hier stehen,** obwohl sie sich nicht ändern:
`.dice-result.crit-effect` (Rahmen und Hof des Würfelfelds) und `.dice-crit` (die Zahl darin) sind
dieselbe Aussage in zwei Eigenschaften. Die eine auf das Token zu ziehen und die andere vier Zeilen
weiter unten am Literal zu lassen, wäre nicht zu erklären — das ist die Begründung dafür, die
Familie nicht halb zu lassen.

#### Drei Schatten bleiben Literale, und das ist entschieden, nicht übersehen

| Stelle | Wert | Warum er bleibt |
| --- | --- | --- |
| `dashboard.css` → `.dice-result-main` | `text-shadow: 0 2px 10px rgba(251,191,36,0.3)` | **Höhenform** (`0 <y> <r>`), keine Glühe. Ein `--glow-*` hätte hier die Deckung um 1,67 erhöht — an der größten Zahl der Anwendung, ohne dass die Form es verlangt. |
| `dmscreen.css` → `.dms-hp-text` | `text-shadow: 0 1px 2px rgba(0,0,0,0.5)` | Schwarze Höhe für die Lesbarkeit auf dem HP-Balken. Keine Rolle, keine Farbe, kein Token. |
| `dice.css` → `.floating-dice-trigger svg` | `filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))` | Schwarze Höhe als Filter, gar keine Schattenlage. Nicht von `floatingPulse` überschrieben — das SVG ist ein anderes Element als der Knopf. |

Für eine **Texthöhe** gibt es kein Token, und zwar nicht aus Nachlässigkeit: `--shadow-1/-2/-3`
führen ihre Geometrie mit sich, sind schwarz, und in Contrast sind sie ein **Umriss mit Spread** —
als `text-shadow` ergäbe das eine Kontur um jeden Buchstaben. Ein Token „farbige Texthöhe" hätte
genau eine Verwendung; dieselbe Rechnung hat `--glow-purple` verhindert. Die drei stehen in
**R-21** namentlich mit Grund, damit die Restmenge benannt ist und nicht lautlos wächst. **Für die
Runde nichts zu tun** — sie ändern sich nicht.

### Teil D — die vier JS-Sprungmarken und die zwei Ringe (Schritt 8, **umgesetzt und verstärkt**)

Die vier `0 0 20px var(--gold)`-Sprungmarken (`encounters-render.js`, `locations-render.js`,
`npc-render.js`, `entity-links.js`) und die zwei `0 0 0 2px var(--gold)`-Ringe
(`entity-actions.js`, `undo.js`) gehen auf `--glow-gold` bzw. `--ring-gold`. Alle sechs waren
voll deckend; die Tokens sind es nicht. **Sie sind nicht in der Planfassung umgesetzt, sondern
mit einer zweiten Lage verstärkt** — die Messung hat gezeigt, dass die Planfassung die Marken
unter die Schwelle drückt, die dieses Projekt selbst für nicht-Text verlangt, und
Entscheidung **W3-D-05** sieht für genau diesen Fall vor: „gib ihr eine höhere Deckung und
begründe sie am Code".

**Die Zahlen, die das entschieden haben.** Gerechnet mit `tests/unit/helpers/wcag-contrast.js`
(Selbstprobe gegen die beiden kanonischen WCAG-Graupaare in jedem Lauf), Abstand des Hofes zu
seiner Trägerfläche. Für die Sprungmarken als **Minimum über die vier neutralen Flächen**
(`--bg-card`/`-dark`/`-elevated`/`-hover`), weil eine angesprungene Listenzeile an wechselnden
Orten sitzt; für die Ringe gegen `--bg-card` — beide Trägerflächen stehen so im CSS
(`core.css` → `.quest-item` und `dmscreen.css` → `.session-card`, je `background: var(--bg-card)`;
**R-22** liest sie dort nach). **Nur der erste der beiden Ringe ist auch zu sehen** — zum zweiten
siehe den Absatz „Eine der beiden Ringstellen ist unerreichbar" unten.

| Marke | | dark | light | sepia | contrast |
| --- | --- | --: | --: | --: | --: |
| **Sprungmarke** (4×) | heute, volles Gold | 6,01 | **2,40** | 5,16 | 9,01 |
| | Planfassung, **eine** Lage `--glow-gold` (50 %) | **2,64** | **1,52** | **2,11** | 3,44 |
| | umgesetzt: **zwei** Lagen = 75 % | 4,09 | **1,91** | 3,24 | 5,79 |
| **Ring** (2×) | heute, volles Gold 2 px | 8,28 | 3,25 | 6,58 | 13,46 |
| | Planfassung, `--ring-gold` allein (15 %, 3 px) | **1,32** | **1,17** | **1,26** | 13,46 |
| | umgesetzt: Ring + Leuchte 12 px | 3,61 | **1,90** | **2,66** | 13,46 |

**Fett heißt: unter 3:1** — der Schwelle, die **R-02** in diesem Projekt für nicht-Text
durchsetzt. Die Konvention gilt in **jeder** Zeile, auch in den beiden „heute"-Zeilen: nur so ist
der Tabelle zu entnehmen, wo die Umstellung einen Wert unter die Schwelle **drückt** und wo er
schon vorher darunter lag. Zwei Werte standen bis zur Prüfung W3-D Runde 1 unmarkiert da (2,40
und 2,66) und sind es jetzt; **R-22** prüft die Konvention seitdem beidseitig — jeder Wert unter
3,00 fett, jeder darüber nicht. Die Planfassung reißt die Schwelle bei den Sprungmarken in
**drei von vier** Themes — Dark eingeschlossen, also im Standardtheme am Spieltisch — und bei
den Ringen in **drei von vier** mit Werten um 1,2, was nicht „schwächer" heißt, sondern
unsichtbar.

**Sepia ist beim Ring der größte Sturz, und er ist ein Übertritt.** 6,58 → 2,66, Faktor **0,40**.
Das ist etwas anderes als der schlechteste Wert der Sprungmarken in Light: dort waren 2,40 schon
**volldeckend** unter 3, die Marke hat die Schwelle dort **nie** gehalten (D2 sagt das und
verweist zu Recht auf die Palettenfrage). Beim Ring dagegen hielten Sepia **und** Light vorher
(6,58 und 3,25) und halten nachher nicht mehr (2,66 und 1,90) — **diese Umstellung** setzt sie
darunter, und Sepia am stärksten. Nur Dark bleibt mit 3,61 über der Schwelle, Contrast bleibt
bei 13,46 unberührt. Läßt die Runde Sepia durchfallen, greift **Rücknahmestufe 3** (je Zeile) oder
**Stufe 2** (volldeckend plus `JS_AUSNAHMEN`-Eintrag) aus der Liste weiter unten. Welche Themes
die Sichtprobe nennen muß, rechnet **R-22** aus den Tokens und verlangt jedes namentlich in D3 —
die erste Fassung von D3 nannte Sepia nicht.

**Eine der beiden Ringstellen ist unerreichbar.** `systems/undo.js:778` wird **nie gemalt**:
`goToNote()` sucht die Notiz über `document.querySelector('[data-note-date="…"]')`, und
`data-note-date` kommt im **ganzen Quellbaum genau einmal** vor — in dieser Abfrage selbst. Es
gibt keinen Setzer, kein Template, kein `setAttribute`. Die Sitzungsnotizen werden nach `n.id`
gerendert (`features/sessions/sessions.js`, `data-id="${n.id}"`). Die Aktion feuert, `if (noteEl)`
greift, der Zweig ist tot. Für die Runde heißt das: **die beobachtbare Ringstelle ist die
Auftragskarte** (`ui/actions/entity-actions.js:373`), und eine ausbleibende Marke in der
Notizsuche ist **nicht** „zu schwach", sondern „gar nicht da" (Punkt D6). Der Tokenwechsel an der
Zeile bleibt trotzdem richtig und harmlos — er wirkt, sobald die Stelle erreichbar wird. **R-22**
hält den Befund an den Quellbaum gebunden: solange kein Setzer da ist, muß er hier stehen; sobald
einer kommt, verlangt die Ratsche das Gegenteil. Der fehlende Setzer selbst ist ein **eigener
Fund für Schritt 9/10** — entweder `data-note-date` beim Rendern der Notizen setzen oder
`goToNote()` auf `n.id` umstellen. Beides gehört nicht in Welle 3.

**Was umgesetzt ist, wörtlich:**

- 4× `0 0 20px var(--glow-gold), 0 0 8px var(--glow-gold)` — zwei Lagen desselben Tokens ergeben
  im Kern (bis 8 px) 75 % Deckung, im Ring von 8 bis 20 px weiter 50 %.
- 2× `var(--ring-gold), 0 0 12px var(--glow-gold)` — der Ring wird 2 → 3 px und 15 %, die
  Leuchte darüber bringt den Kern auf etwa 57 %.

Kein Literal und kein Nicht-Schattentoken kehrt damit ins JavaScript zurück; jede einzelne Lage
fällt unter dieselbe erlaubte Form, die **R-19** für das CSS verlangt (`ERLAUBT` steht seit
Schritt 8 genau einmal im Test und wird von der CSS- und der JS-Prüfung geteilt).

**Worauf in der Runde zu achten ist**

| # | Stelle | Was zu prüfen ist |
| --: | --- | --- |
| D1 | Die vier Sprungmarken: NSC anklicken, der auf einen Ort verweist; Querverweis in einer Wiki-Seite; Begegnung aus dem Rechner heraus anspringen | **Sieht man in den zwei Sekunden, wohin gesprungen wurde?** Das ist die eine Frage. Nicht „ist der Hof schön", sondern „finde ich die Zeile". Die Marke muss **gesucht** werden, nicht nur angesehen — wenn sie nur auffällt, weil man weiß, wo sie ist, ist sie durchgefallen. |
| D2 | Dieselben vier in **Light** | Hier steht mit 1,91 der schlechteste Wert. **Er ist nicht die Folge der Umstellung:** `--gold` ist in Light `#b8860b` und liest schon volldeckend nur 2,40 gegen die schlechteste der vier Flächen. Die Marke hat in Light **nie** 3:1 gehalten. Fällt sie hier durch, ist die Antwort nicht eine dritte Lage, sondern ein hellerer Goldton für Light oder eine andere Markierungsform (Hintergrund, Rahmen) — eine Palettenfrage, nicht eine Schattenfrage. |
| D3 | Der Ring an der **Auftragskarte** (Auftrag aus einem Verweis anspringen) in **Dark**, **Light** UND **Sepia** | Der Ring ist von 8,28 auf 3,61 (dark), 3,25 auf 1,90 (light) und 6,58 auf **2,66** (sepia) gefallen — das ist selbst **mit** der Verstärkung die stärkste Abschwächung der ganzen Einheit. **Sepia ist mit Faktor 0,40 der größte Sturz und gehört deshalb ausdrücklich dazu**; Light und Sepia treten dabei von „hält" zu „hält nicht" über (siehe den Absatz über der Tabelle). Reicht Ring plus Hof, oder muss die Marke voll deckend bleiben? |
| D4 | Der Ring an der Auftragskarte in **Contrast** | Dort ist `--ring-gold` volles Gold: der Wert bleibt 13,46, nur die **Dicke** wächst 2 → 3 px. Wirkt der Ring dort jetzt zu fett neben dem `border` des Kastens? |
| D5 | `entity-links.js` — die Marke des Querverweis-Systems | Sie ist die einzige der vier, die zusätzlich `transform: scale(1.02)` setzt, also die robusteste. Wenn **diese** in einem Theme nicht auffällt, fallen die anderen drei dort sicher durch. Guter Prüfeinstieg. |
| D6 | **Kein Sichtpunkt:** die Notizsuche (`systems/undo.js:778`) | Diese Ringstelle ist **unerreichbar** — nicht anzuschauen, weil sie nicht gemalt wird (Beleg im Absatz „Eine der beiden Ringstellen ist unerreichbar"). Wer hier keine Marke sieht, hat **nichts** über die Stärke der Marke gelernt. Die Zeile steht nur zur Kenntnis in der Liste, damit sie nicht als übersehene Sichtprobe gilt. |

**Der Rücknahmeweg, falls die Runde widerspricht.** Drei Stufen, jede billig:

1. **Verstärkung zurück auf die Planfassung:** die zweite Lage löschen, sechs Zeilen, je ein
   Teilausdruck. R-19 bleibt grün, weil beide Formen erlaubt sind.
2. **Voll deckend bleiben** (der Weg, den Schritt 8 selbst vorsieht): `0 0 20px var(--gold)`
   bzw. `0 0 0 2px var(--gold)` wiederherstellen **und** je einen Eintrag in `JS_AUSNAHMEN`
   von R-19 Teil (5) aufnehmen — heute sind es drei, dann bis zu neun. Das ist die Form, in der
   `dmscreen.css:1137` (das Ablageziel beim Ziehen) schon heute volldeckend geführt wird; die
   Begründung wäre wortgleich.
3. **Nur einzelne Stellen:** die Ausnahme gilt je Zeile, nicht je Familie.

**Was ausdrücklich draußen bleibt, und warum** — damit es nicht als übersehener Rest gilt:

- `features/shops/shop-export.js:292` (`0 4px 6px rgba(0,0,0,0.1)`) und `:486` (`none`) — die
  Datei erzeugt ein eigenständiges HTML-Handout zum Ausdrucken, das ohne die Variablen der App
  auskommen muss.
- `utils/utilities.js:707` (`0 4px 12px rgba(0,0,0,0.15)`) — eine Inline-Stilzeichenkette im
  Notfall-Toast (dem Alt-`#toast` aus W2-E-05), die läuft, wenn die App schon halb steht; ein
  `var()` könnte dort leer sein.
- `assets/templates/*.html` und die `*.html` im Wurzelverzeichnis: **null** `box-shadow`,
  nichts zu tun.

Alle drei stehen als `JS_AUSNAHMEN` namentlich in R-19 Teil (5) und werden dort je **genau
einmal** getroffen, mit Zeilenanker **und** Wertabgleich. Eine Ausnahme, die ins Leere zeigt,
lässt die Ratsche rot werden.

### Teil E — die fünf Ringe: **vier** gehen auf das Token, und in Contrast ändern sich alle vier

Paragraph 5 zählt vier goldene Zustandsschatten; es sind **fünf** (`welt.css` kam in Welle 2 auf
`color-mix` und fällt aus jedem `rgba(212,175,55`-Zähllauf heraus). Sie tragen **zwei Rollen in
zwei Stärken**, und ein einziges Token trägt beide nicht: vier gehen auf `--ring-gold`, das
Ablageziel beim Ziehen bleibt volldeckend.

`--ring-gold` ist in allen vier Themes **3 px** dick und trägt in Dark, Light und Sepia **15 %**
Gold — in **Contrast volles Gold**, weil eine 15-%-Mischung in einem Kontrastthema keine Aussage
ist (entschieden in Schritt 2, am Token begründet). **Daraus folgt der größte Einzelsprung der
ganzen Welle in einem Theme.** Die 15 % statt der 40 % aus Paragraph 3.2 halten die drei
Fokusringe da, wo sie sind; 40 % hätten sie um das 2,7- bis 4-fache deckender gemacht **und**
gleichzeitig das Ablageziel geschwächt — genau verkehrt herum.

Trägerfläche ist jeweils der Kasten **hinter** dem Element, denn der Ring liegt außerhalb; sie ist
aus dem CSS gelesen und nicht geraten. Gerechnet mit `tests/unit/helpers/wcag-contrast.js`.

**Drei der vier Ringe trugen ein themenblindes Gold, und darauf kommt es an.** `dmscreen.css`,
`party.css` und `migration.css` standen auf `rgba(212,175,55, …)` = fest `#d4af37`, das dem Theme
**nicht** folgte; nur `welt.css` trug schon `color-mix(… var(--gold) 15 % …)`. Die Spalte „vorher"
ist deshalb an diesen drei Stellen mit `#d4af37` gerechnet und **nicht** mit dem Gold des jeweiligen
Themes — die erste Fassung dieser Tabelle tat Letzteres und war an sechs Zahlen falsch (gefunden in
Runde 1 der Prüfung **W3-C**; `R-21` führt die Farbe jetzt als `vorher.farbe` und hält sie gegen das
CSS). Wo der Ring die Farbe wechselt, ist das eine **sichtbare** Änderung ohne einen Bildpunkt
Geometrie.

| Stelle | Rolle | Dicke | Deckung | Ton vorher | Fläche | Abstand vorher → nachher |
| --- | --- | --- | --- | --- | --- | --- |
| `dmscreen.css` → `.form-group input:focus` (mit `select` und `textarea`) | Fokus | 3 → 3 px | 10 % → 15 % (Faktor 1,50) | `#d4af37` fest | `.modal`, themenblindes Literal `rgba(26,26,26,0.95)` | dark 1,20 → 1,32 · light 1,20 → 1,23 · **sepia 1,20 → 1,10** · contrast 1,20 → **12,41** |
| `party.css` → `.cf-panel .cf-field input:focus` (mit `select`) | Fokus | 3 → 3 px | 15 % → 15 % (**geometrisch wortgleich**) | `#d4af37` fest | `.cf-panel` = `--bg-dark` | dark 1,27 → 1,27 · light **1,10 → 1,16** · sepia **1,08 → 1,24** · contrast 1,21 → **14,97** |
| `welt.css` → `.wp-rich-editor:focus` | Fokus | **2 → 3 px** | 15 % → 15 % | `var(--gold)`, folgt dem Theme | `.wp-section` = `--surface` → `--bg-card` | dark 1,32 → 1,32 · light 1,17 → 1,17 · sepia 1,26 → 1,26 · contrast 1,41 → **13,46** |
| `migration.css` → `.wizard-step.active` | Zustand | **2 → 3 px** | **30 % → 15 %** | `#d4af37` fest | `.migration-wizard` = `--bg-card` | dark 1,89 → 1,32 · light 1,24 → 1,17 · **sepia 1,21 → 1,26** · contrast 1,85 → **13,46** |
| `dmscreen.css` → `[data-sortable].drag-over` | Ablageziel | 2 px | 100 % | `var(--gold)`, folgt dem Theme | — | **unverändert**, siehe unten |

**Anzusehen sind vier Dinge, in dieser Reihenfolge.** Erstens **Contrast**: dort bekommen alle
vier Ringe einen satten goldenen 3-px-Rahmen, wo vorher ein nicht ablesbarer Hauch war
(1,20–1,85 → 12,41–14,97). Das ist gewollt und der Punkt des Themas — aber es ist die
größte sichtbare Änderung, die Welle 3 irgendwo macht, und sie gehört gesehen. Zweitens
`dmscreen.css` **in Sepia**: die einzige Stelle der Tabelle, die dort **schlechter** wird
(1,20 → 1,10) — das Literal war ein helles Gold auf dem dunklen, themenblinden Modalkasten, das
Token bringt dort das dunkle Sepia-Gold `#8b4513`. Drittens `migration.css`: die Abschwächung in
**Dark und Light** (Teil A Eintrag 6) — in Sepia gewinnt es leicht (1,21 → 1,26), die Überschrift
„die einzige Abschwächung" gilt also nicht für alle vier Themes. Viertens `welt.css`: der Ring wird
**einen Bildpunkt breiter**, sonst nichts — der Preis dafür, dass ein Token **eine** Dicke hat und
zwei der vier Stellen bereits 3 px trugen.

**`party.css` ist NUR in Dark bildpunktgleich, nicht in drei Themes.** Hier stand zuerst das
Gegenteil. Geometrisch ändert sich dort nichts (3 px, 15 %), und es bleibt der Maßstab, an dem die
15 % gewählt wurden — aber der Ring wechselt die **Farbe** von `#d4af37` auf `#b8860b` (Light) bzw.
`#8b4513` (Sepia) und wird dabei in beiden Themes **besser** ablesbar (1,10 → 1,16 und
1,08 → 1,24). In Sepia ist der Unterschied mit `#efdcac` → `#e4cca7` mit dem Auge zu sehen. Diese
Stelle gehört damit auf die Sichtprobenliste und stand in `R-21` zuerst fälschlich nur mit
`contrast`.

**Das Ablageziel bleibt volldeckend, und das ist der Kern der Entscheidung.** `[data-sortable]`
`.drag-over` trägt `0 0 0 2px var(--gold)` — ein einheitliches Token würde ausgerechnet das eine
Element schwächen, das beim Ziehen unmissverständlich sein muss. Es trägt kein Literal, steht als
Ausnahme 13 in `R-19` und ist in `R-21` die einzige Zeile mit `unveraendert`. In Contrast liegt
neben diesem Ring zusätzlich der Umriss der zweiten Lage und der umgefärbte Rahmen des Elements —
drei Linien übereinander, geführt in Teil B mit 1,66.

**Ein Punkt für den Bericht, keine Aufgabe der Runde:** `--ring-gold` bedeutet nach dieser Welle
**drei** Dinge — Fokus, aktiver Assistentenschritt, Ablageziel. Welle 6 baut den Tastaturfokus
genau darauf auf und erbt die Mehrdeutigkeit. Jetzt notiert, jetzt nicht gelöst. **Seit Schritt 8
sind es vier:** die zwei JS-Ringe (Auftragskarte, Notizzettel) sind Sprungmarken, keine
Fokusringe, und tragen dasselbe Token — siehe Teil D.

### Teil F — die drei Restposten aus Schritt 9: **drei** Stellen ändern sichtbar ihr Aussehen

Diese drei gehören nicht zur Schattenfamilie, sondern zu den Tönungen der Wellen 1 und 2. Sie
stehen hier, weil die Runde ohnehin alle vier Themes durchgeht und weil zwei von ihnen Zustände
betreffen, die **nur im Überfahren oder im Drücken** sichtbar sind — also genau die, die man beim
Ansehen einer Seite nicht findet. Gesichert durch **R-23** in
`tests/unit/design-consistency.test.js`.

| # | Stelle | Was sich ändert | Worauf zu achten ist |
| --: | --- | --- | --- |
| 14 | `dice.css` → `.fdp-die.d20` (der W20-Knopf im schwebenden Würfelpanel) | **Beide Verlaufsstopps sind gedeckelt** (W2-D-06). `--tint-max` ist 13/7/7/20 %: der Kopf fällt auf Faktor 0,65 · 0,35 · 0,35 · 1,00, der Fuß auf 0,43 · 0,23 · 0,23 · 0,67. Und weil der Deckel in **jedem** Theme beide Stopps auf denselben Anteil zieht (13/13 · 7/7 · 7/7 · 20/20), verliert der Verlauf sein **Deckkraftgefälle**; es bleibt das Farbgefälle `--red` → `--red-dark` bei gleicher Deckung. Der Knopf wird also **blasser und flacher**. Die Beschriftung gewinnt: 6,64 · 3,42 · 3,72 · 11,57 → 7,28 · 5,49 · 5,83 · 11,57. Rahmen unberührt (2,03 · 2,28 · 2,12 · 1,88, wie vorher unter 3:1). | **Hebt sich der W20 noch von den übrigen fünf Würfelknöpfen ab?** Dieselbe Frage, die die Sichtprobe zu E1 schon stellt — jetzt mit einem schwächeren Rot. In Light und Sepia ist die Fläche auf ein Drittel gefallen; wenn der Knopf dort nicht mehr als „der besondere" liest, ist die Antwort **eine benannte Ausnahme für diese Regel**, nicht ein anderer Deckel (der gilt für 115 weitere Stellen). Contrast ist unverändert. |
| 15 | `file-backup.css` → `.backup-entry:hover` (die Zeilen der Sicherungsliste im Modal „Datei-Backups") | **Aus einer Füllung wird ein Umriß** (E3, zum zweiten Mal nach `.qref-row`): `background: var(--bg-hover)` → `outline: 1px solid var(--gold-dim)`. Das Überfahren war bisher eine Andeutung (`--bg-hover` gegen `--bg-card`: 1,38 · 1,36 · 1,27 · 1,49), der Umriß liest **5,21 · 5,09 · 9,17 · 8,51** — die Zeile meldet also **deutlicher** als vorher, nur anders. Der rote Rückhol-Knopf darin sitzt dadurch auf `--bg-card` statt auf `--bg-hover`. **Und er wechselt zugleich seine Farbe**, weil sein Markup die Tinte inline überschrieb und das behoben ist (siehe W2-D-05, Punkt 1a): **gemalt** steigt er von 3,01 · 3,22 · 3,07 · 3,07 auf **5,52 · 5,55 · 5,32 · 6,35**. Sichtbar heißt das: aus `--red` wird `--red-text`, also ein etwas hellerer Rotton in Dark und Contrast und ein dunklerer in Light und Sepia, bei Schrift **und** Rand. | **Drei Fragen.** Erstens: liest der Knopf noch als „gefährlich"? Er ist rot geblieben, aber in Light und Sepia ein dunkleres, in Dark und Contrast ein etwas helleres Rot. Zweitens: liest der Ring als Zeilenhervorhebung oder als Fokusring? Er ist 1 px `--gold-dim`, der Tastaturfokus ist 2 px `--gold` — dieselbe Unterscheidung wie bei `.qref-row`, hier aber an einer Zeile **mit** einem Knopf darin, also dort, wo beides zusammen auftreten kann. Drittens: bekommt die **Kopfzeile** der Liste versehentlich einen Ring? Sie ist ausdrücklich ausgenommen (`outline: none`); greift die Ausnahme nicht, sieht man es sofort. |
| 16 | `pwa.css` → `.pwa-install-btn:hover` und `:active` (Installieren-Knopf in der Kopfzeile; erscheint nur, wenn der Browser die Installation anbietet) | **Der Hover ist mitgedeckelt**, die Fläche fällt auf Faktor 1,00 · 0,58 · 0,58 · 1,00. Danach stehen die zwei Sprossen bei 12/13 % (dark), 7/7 % (light), 7/7 % (sepia), 12/20 % (contrast) — in Light und Sepia sind sie **flächengleich**, in Dark trennt sie ein Prozentpunkt. Der Druck wird deshalb von `transform: scale(0.97)` getragen. Der Kontrast des Hovers steigt: 5,75 · 4,55 · 4,77 · 8,40 → **5,75 · 4,78 · 5,14 · 8,40**; `:active` bleibt bei 5,65 · 4,78 · 5,14 · 6,76. Vorher stand die Leiter in Light und Sepia **auf dem Kopf** (gedrückt blasser als überfahren, 1,14 gegen 1,07 bzw. 1,19 gegen 1,11); das ist behoben. | **Ist der Druck noch zu spüren?** In Light und Sepia trägt ihn allein das Zusammenziehen um 3 %, in Dark fast allein. Wenn das nicht reicht, ist der Weg **nicht** ein größerer Deckel (der gilt für die ganze Welle 2), sondern eine zweite nicht tönende Deklaration an `:active` — etwa der Rahmen auf `var(--gold-text)`. Ohne Installationsangebot des Browsers ist diese Zeile nicht prüfbar, und das ist kein Befund. |

**Was diese drei mit der Schattenwelle zu tun haben und was nicht.** Nichts an ihnen ist eine
Schattenlage; sie sind der Restposten, den Schritt 9 abräumt. Sie stehen aber in **derselben**
Runde, weil zwei von ihnen sonst niemand ansieht: Eintrag 15 ist nur im Überfahren einer Zeile in
einem Modal sichtbar, Eintrag 16 nur im Drücken eines Knopfs, der nur unter einer Bedingung
überhaupt erscheint. Eintrag 14 dagegen liegt offen — der W20 ist der auffälligste der sechs
Würfelknöpfe im schwebenden Panel.

**Der Ort, an dem in dieser Runde am ehesten etwas Unerwartetes zu sehen ist, ist Eintrag 15** — und
zwar nicht wegen des Umrisses, sondern wegen der Farbe des Knopfs darin. Sein Rot wechselt von
`--red` auf `--red-text`, weil ein Inline-Stil die Regel überschrieb und das behoben ist. Das ist
die **einzige** Änderung dieses Schritts, die eine Farbe wechselt und nicht bloß eine Deckung; alles
andere ist blasser, flacher oder anders geformt. Vollständig unter W2-D-05, Punkt 1a.

**Ein Punkt für den Bericht, keine Aufgabe der Runde** (W1-B-01): die 4,52, die drei Pläne dieser
Welle `.dms-attr-item` zugeschrieben haben, gehören zu `.qref-row`. Auf der Fläche von
`.dms-attr-item` (`--bg-dark`) hält `--attr-wis` in Dark **5,04**, und der knappste Wert dort ist
`--attr-dex` in Sepia mit **4,98**. Kein Schritt der Welle 3 hat ein `inset` auf eine dieser Flächen
gelegt; **R-23 Teil (6)** hält das fest. Vollständig unter W1-B-01.

**Nachtrag zu Eintrag 15 (Prüfung W3-E, Runde 1):** der Ring dieser Zeile hat zusätzlich
`outline-offset: -1px` bekommen und liegt jetzt **innen** statt außen. Zwei Dinge sind daran zu
sehen. Erstens: er sitzt einen Pixel weiter innen und **deckt dabei das eigene `border-bottom`** der
Zeile — die Doppellinie aus Ring und Trennlinie, die in Contrast am deutlichsten war, entfällt.
Zweitens, und das ist der Grund: außen lag er im 24-px-Polster des Modals, und `.modal` trägt ein
themenblindes `rgba(26, 26, 26, 0.95)` statt `--bg-card`. Gegen diese Fläche las `--gold-dim`
**5,27 · 3,01 · 1,57 · 7,93** — in **Sepia** waren die seitlichen Segmente des Rings **unsichtbar**,
in Light standen sie mit 3,01 auf der Schwelle. Die geführte Reihe 5,21 · 5,09 · 9,17 · 8,51 war
richtig gerechnet und gegen die falsche Fläche gehalten. **Worauf zu achten ist:** ob der Ring in
allen vier Themes **rundum gleich stark** liest — vorher war er in Sepia links und rechts weg. Und
ob er in Sepia und Light nicht zu dicht am Text sitzt; er liegt jetzt im 4-px-Polster der Zeile.

### Teil G — der Nachtrag aus Prüfung W3-E, Runde 1: **drei** Tinten, die nie im CSS standen

Diese drei sind keine Schattenlagen und kein Zustand, sondern der Ertrag des Befunds aus Teil F:
dieselbe Fehlerklasse wie beim Rückhol-Knopf — eine Tinte, die **inline im Markup** stand und damit
jede Regel und jede Rechnung schlug. Die Erhebung, die Punkt 1a von W2-D-05 als „nicht erhoben"
geführt hat, ist jetzt gemacht; **R-23 Teil (8)** urteilt seither über die ganze Menge. Alle drei
wechseln von `--red` auf `--red-text`, also einen etwas helleren Rotton in Dark und Contrast und
einen dunkleren in Light und Sepia — genau der Wechsel, den Eintrag 15 am Rückhol-Knopf schon zeigt.

| # | Stelle | Was sich ändert | Worauf zu achten ist |
| --: | --- | --- | --- |
| 17 | `initiative.css` → `.init-entry.lair .init-type` (die Unterzeile „Lair Action" in der Initiative, sichtbar sobald eine Lair-Action in der Reihenfolge steht) | Die Tinte stand inline als `var(--red)` und las auf dem getönten Ende des Lair-Verlaufs **4,21 · 4,35 · 3,88 · 4,49** — bei `font-size: 0.75em` in **allen vier** Themes unter 4,5. Jetzt `var(--red-text)`: **5,67 · 5,55 · 5,32 · 6,47**. | Die Unterzeile ist klein und steht direkt unter dem Namen der Lair-Action, der seit Welle 2 schon `--red-text` trägt. **Frage:** lesen Name und Unterzeile jetzt als **ein** Paar (gleicher Rotton, verschiedene Größe) oder wirkt die Unterzeile zu nah am Namen, weil der Farbunterschied weg ist? Vorher waren es zwei Rottöne, jetzt einer. |
| 18 | `loot.css` → `.si-tag-v.si-tag-neg` (das Etikett „Nachteil" bei Heimlichkeit, im aufgeklappten Detail eines Rüstungs-Eintrags im Laden) | Inline `var(--red)` auf `--bg-card`: **4,62 · 4,83 · 4,29 · 4,72**, Sepia darunter. Jetzt `var(--red-text)`: **6,22 · 6,17 · 5,88 · 6,80**. | Dieses Etikett ist das **einzige** rote in einer Reihe cyanfarbener Werte (`.si-tag-v` ist sonst `--cyan`). **Frage:** sticht es noch als Warnung heraus, oder liest es nach dem Wechsel wie ein normaler Wert? Besonders in **Light und Sepia**, wo `--red-text` dunkler geworden ist. |
| 19 | `dashboard.css` → `.qref-btn-del` (der 🗑️-Knopf an einem eigenen Eintrag der Schnellreferenz, neben dem ✏️-Knopf) | Der rote Rand stand inline und schlug damit **dauerhaft** `.qref-btn:hover { border-color: var(--gold) }`: dieser Knopf hatte in **keinem** Theme eine Hover-Kontur, sein Nachbar schon. Jetzt als Klasse mit `var(--red-text)` und schwächerer Spezifität — der Hover kommt zurück. Ruhering **6,22 · 6,17 · 5,88 · 6,80** statt 4,62 · 4,83 · 4,29 · 4,72. | **Zwei Fragen, und die zweite ist eine Geschmacksfrage, die der Nutzer entscheidet.** Erstens: liest der Knopf in Ruhe noch als „das löscht"? Zweitens: er wird beim Überfahren jetzt **golden** wie jeder andere Knopf der Schnellreferenz und verliert dabei kurz seine Warnfarbe. Ist das richtig (Gold = „hier bin ich", Rot = „das löscht") oder soll der Ring beim Überfahren rot **bleiben**? Beides ist eine Zeile CSS. |

**Ein Punkt für den Bericht, keine Aufgabe dieser Runde.** Zwei Messungen am Rand der drei Stellen
gehören in keine Welle und sind hier nur festgehalten, damit sie nicht wieder verlorengehen:
`.qref-btn:hover { border-color: var(--gold) }` hält gegen seine eigene Hover-Füllung
`--bg-hover` nur **6,01 · 2,40 · 5,16 · 9,01** — in **Light 2,40**, also unter 3 für eine Linie, und
das gilt für **alle** Knöpfe der Schnellreferenz, nicht erst seit Eintrag 19. Und `.si-tag-v` selbst
trägt `var(--cyan)` auf `--bg-card`: **8,85 · 3,68 · 2,93 · 15,06**, in Light und Sepia unter 4,5 —
`--cyan-text` wäre das Gegenstück. Beides sind Vorbestände ohne Ratsche, beides ist keine Folge
dieser Runde.

### Die Ausnahmeliste ist geschlossen — aber nicht deckungsgleich mit Paragraph 7, und das geht nicht

Schritt 7 verlangt, dass die Ausnahmeliste im Test und die in Paragraph 7 des Handoffs nach ihm
deckungsgleich sind. **Das ist von hier aus nicht erreichbar, und zwar aus einem strukturellen
Grund:** `DESIGN-HANDOFF-v3.md` liegt unter `Anpassungen/`, ist **nicht versioniert** und für die
Umsetzung ausdrücklich eine Nur-Lese-Quelle. Es kann nicht angefasst werden, ohne eine fremde
Datei in den Baum zu ziehen.

Der Stand, damit die Differenz benannt ist und nicht als Versehen gilt:

| | Test (`R-19` `AUSNAHMEN`) | Handoff Paragraph 7 |
| --- | --: | --- |
| `.read-aloud`-Papierhöfe | 7 (Einträge 1–7, je die **`inset`-Lage**) | „7 `inset`-Schatten `.read-aloud`" — als **Deklarationen**, also zu weit |
| weiße Glanzkanten | 2 (Einträge 8–9) | **fehlen ganz** |
| `@keyframes floatingPulse` | 2 (Einträge 10–11) | „2 `@keyframes`-Schatten `dice.css`" ✓ |
| `box-shadow: none !important` | 1 (Eintrag 12) | fehlt |
| Ablageziel beim Ziehen | 1 (Eintrag 13) | fehlt |
| Ruhelage der Pulsanimation | 1 (Eintrag 14) | fehlt |
| **Summe** | **14** | 3 Gruppen in einer Zeile |

Die Liste im Test ist die **verbindliche**: sie wird bei jedem Lauf darauf geprüft, dass jeder
Eintrag **genau einmal** getroffen wird (Teil 4 von R-19), also weder ins Leere zeigt noch
stillschweigend verallgemeinert. Paragraph 7 ist Prosa ohne Prüfung. Wer den Handoff später
nachzieht, findet hier die Sollmenge; wer ihn nicht nachzieht, verliert nichts Prüfbares.

**Auch die zweite Hälfte von Arbeitsregel §2 Nr. 9 („jede Ausnahme steht mit Kommentar im CSS
**und** in der Ausnahmeliste der Ratsche") ist für diese Familie nicht erfüllt — und zwar für
**keinen** der 14 Einträge.** Nachgesehen: keiner trägt heute einen Kommentar an seiner
Deklaration; die Begründungen stehen ausnahmslos in `R-19`. Zwei davon nachzutragen, wie Schritt 7
für die Glanzkanten vorschlägt, wäre eine einzelne Inkonsequenz und würde zusätzlich die
Zeilenanker in `dice.css` und `dmscreen.css` verschieben — mit Nachzug in der Ort→Stufe-Tabelle,
in der Ausnahmeliste, in `R-20`, `R-21`, `R-06` und in dieser Datei, für reine Prosa. Entweder
alle 14 in einem eigenen Durchgang oder keine; die Entscheidung gehört zu Schritt 10, nicht
hierher.

### Was diese Runde **nicht** finden kann

Kontrastwerte und Geometrie. Die sind gemessen und durch `R-19` (Form, Ort→Stufe, Contrast ohne
Weiß) und `R-20` (Radien, Deckungsverteilung, Abstand Umriss ↔ Rahmen für alle 41 Rahmennachbarn,
und welche Lagen eine Animation überschreibt) gesichert; ein Auge
misst sie nicht nach. Sie beantwortet genau zwei Fragen, die keine Messung beantwortet: **ob ein
harter Umriss als Höhe gelesen wird** und **ob eine halbdurchsichtige Marke noch zeigt, wo.**

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
PYTHONIOENCODING=utf-8 python build.py     # dist/dnd-tracker-bundled.html oeffnen
npx jest tests/unit/design-consistency.test.js -t "R-19"
npx jest tests/unit/design-consistency.test.js -t "R-20"
npx jest tests/unit/design-consistency.test.js -t "R-21"
npx jest tests/unit/design-consistency.test.js -t "R-23"
```

---

## W3-F-02 — `aliasSchicht()` liest Tokennamen aus Kommentaren als Deklarationen

**Status: OFFEN, gehört keiner Welle.** Aufgenommen am 2026-09-30, Welle 3 Schritt 2. **Kein
Befund am Produktivcode** — eine Schwäche des Testnetzes, die beim Schreiben der Begründung für
`--glow-*` zugeschnappt ist und deshalb hier steht und nicht im Vergessen.

### Was passiert ist

`aliasSchicht()` in `tests/unit/design-consistency.test.js` schneidet die vier Theme-Blöcke aus
`variables.css` heraus und läuft dann mit `WCAG.DECL_RE` über den Rest. Kommentare werden dabei
**nicht** maskiert. Der Erklärtext neben den vier Leuchttokens enthielt den Halbsatz „dieselbe
Regel steckt in `--ring-gold: 15 %`" — `DECL_RE` las daraus eine zweite Deklaration im
Aliasblock, und `R-02` meldete:

```
DOPPELT DEFINIERT, der Aliaswert gewinnt und der Theme-Wert ist tot:
--ring-gold (dark/light/sepia/contrast)
```

Ein Befund über einem Halbsatz, an einer Datei, in der sich kein Wert geändert hatte.

### Warum das schon einmal passiert ist

**Dieselbe Falle, andere Regex.** In Welle 2 Schritt 11 las `ohneUnerreichbareZweige()` das Wort
`@supports` aus einem Kommentar als positiven Zweig — „sieben Ratschen warfen auf einmal über
einem Halbsatz". Dort ist sie **im Parser** geschlossen worden, und die Selbstprobe „das Wort im
Kommentar ist kein Zweig" bewacht sie seitdem. Für `DECL_RE` gibt es diese Maskierung nicht.

### Umgangen, nicht behoben — und warum

Der Kommentar in `variables.css` ist umformuliert (kein Tokenname mit Doppelpunkt dahinter) und
trägt jetzt eine Warnung an genau der Stelle, an der der nächste Schreiber sie liest. **Der Parser
ist bewusst nicht angefasst worden:** `aliasSchicht()` steht in einem abgenommenen Welle-2-Block,
und ein Eingriff dort gehört in einen eigenen Schritt mit eigenem rotem Nachweis — nicht als
Beifang einer Kommentaränderung.

### Was noch offen ist

`aliasSchicht()` ist nur die **halbe** Stelle. `palette()` in `tests/unit/helpers/wcag-contrast.js`
läuft mit derselben `DECL_RE` über die vier **Theme-Blöcke** und maskiert dort ebenfalls keine
Kommentare. Heute fällt das nicht auf, weil kein Kommentar in einem Theme-Block einen Tokennamen
mit Doppelpunkt trägt — die Contrast-Erklärung nennt `--border` bewusst ohne. Ein Satz wie
„`--shadow-2: 0 4px 16px` wäre hier zu weich" in einem Theme-Block würde `palette()` still
verfälschen und über `BASELINE_TOKENS` bis in die 40 Fälle von
`wcag-contrast-helper.test.js` durchschlagen.

### Zu entscheiden bleibt

Beide Parser Kommentare maskieren (zeilentreu, wie `leerKommentare()` in `R-19`, damit
Zeilennummern nicht wandern) und je eine Kunst-CSS-Selbstprobe nach dem Muster „das Wort im
Kommentar ist kein Zweig" dazu — oder die Regel „in `variables.css` steht kein Tokenname mit
Doppelpunkt in einem Kommentar" als Ratsche schreiben. Die erste Antwort behebt die Ursache, die
zweite nur die Ausprägung in einer Datei.

### Befehle

```bash
cd /d/Claude_Code/Projekte/DnD_Tracker_App_Pro
# Die Falle nachstellen: in den Aliasblock von variables.css einen Kommentar
# mit "--ring-gold: 15 %" schreiben, dann
npx jest tests/unit/design-consistency.test.js -t "vier Teilformeln"
npx jest tests/unit/design-consistency.test.js -t "das Wort im Kommentar"
```

---

## W3-F-03 — Die Abnahme der Welle 3 (Schritt 10): gemessen, nicht behauptet

**Stand:** 2026-09-30, an HEAD nach den Schritten 1–9 (78 Commits über der Basis `03274fa`).

### Stufe 1 — die Suiten, jede Zahl mit ihrem Befehl

| Was | Befehl | Basis `03274fa` | Jetzt |
| --- | --- | --- | --- |
| Dev-Bündel | `PYTHONIOENCODING=utf-8 python build.py` | exit 0 | **exit 0** |
| Prod-Bündel | `… python build.py --production` | exit 0 | **exit 0** |
| Jest, voll | `npx jest` | 1786 / 71 Suiten | **1861 / 71 Suiten** (+75) |
| Stil-Ratschen | `npx jest tests/unit/design-consistency.test.js` | 119 | **194** (+75) |
| Kontrast-Helfer | `npx jest tests/unit/wcag-contrast-helper.test.js` | 40 | **40** |
| R-19 allein | `npx jest -t "R-19"` | — | **12 bestanden** |
| Playwright, voll | `npx playwright test` | 381 / 11 übersprungen / 0 | **382 / 15 übersprungen / 0** |
| Build-Tests | `python -m pytest tests/build` | 30 | **30** |
| Lint | `npm run lint` | exit 0, 363 Warnungen | **exit 0, 363** = Pin |
| Typen | `npm run typecheck` · `typecheck:strict` | exit 0 | **exit 0 · exit 0** |

**Die beiden Abweichungen von der Basis sind beide erklärt und keine Regression.**
Playwright zählt **382** statt 381, weil Schritt 9 mit `kaskade-tinten.spec.js` einen
Browser-Fall hinzugefügt hat (381 + 1). Es zählt **15** statt 11 Übersprungene, weil die
Ablichtung dieses Schritts vier Themes als übersprungene Fälle führt, solange
`WELLE3_SCREENS=1` nicht gesetzt ist — genau das Muster der Wellen 1 und 2.

### Die Ratschen ohne Spielraum

| Ratsche | Schwelle | Gemessen | Befehl |
| --- | --: | --: | --- |
| Dubletten | 0 | **0** | der Test rechnet `toBeLessThanOrEqual(0)` und ist grün |
| `!important` | 105 | **105** | `cat assets/styles/*.css`, Kommentare entfernt (roh 107, zwei stehen **in** Kommentaren) |
| Inline-Stile | 256 | **256** | `cat assets/templates/*.html \| grep -o 'style="' \| wc -l` |

Keine ist gestiegen. Der Pin der Lint-Warnungen steht unverändert bei 363.

### R-19 ist grün — und seine Tabelle stammt aus der Messung, nicht aus der Umsetzung

Das ist die Frage, an der diese Welle hängt, und sie ist am Verlauf belegbar, nicht nur
behauptet. `1b208d9` (`test(W3): R-19 … rot`) steht **vor** `947cdb1` (die Umsetzung der
Leiter). Entscheidend ist aber nicht die Reihenfolge allein, sondern ob die Tabelle
**danach** an die Umsetzung angepasst wurde. Strukturvergleich der `ORT_ZU_STUFE` zwischen
`1b208d9` und HEAD:

| | rot-Commit | HEAD |
| --- | --: | --: |
| Einträge | 52 | **52** |
| `stufe` oder `vorher` geändert | — | **0** |
| hinzugekommen | — | **0** |
| entfallen | — | **0** |
| nur `zeile` nachgezogen | — | 4 |

Die vier sind `core.css` → `.offline-indicator` 840→854, `.char-tag.clickable:hover`
1348→1362, `.spell-tooltip` 1427→1441 und `initiative.css` → `.init-statblock-content`
1055→1078 — Zeilen, die durch eingefügte Kommentare gewandert sind. **Die urteilenden
Spalten (Ort, Stufe, gemessener Altwert) sind byte-gleich mit dem roten Commit.**

### Der Stil-Sollstand: 6 Digests, und der schlüsselweise Vergleich dazu

`computed-style-diff.spec.js` ging beim ersten vollen Lauf rot — **erwartet**: `6367990`
(Schritt 4) hatte das angekündigt und die Sollstandsdatei ausdrücklich diesem Schritt
überlassen. Neu erhoben und **schlüsselweise** gegengeprüft, nicht nur „der Lauf ist grün":

| | |
| --- | --: |
| Digests gesamt | 3626 → **3626** |
| geänderte Digests | **6** |
| **Zugänge** (neuer Schlüssel) | **0** |
| **Abgänge** (Schlüssel weg) | **0** |
| Ansichten je Durchgang | 24 → 24, keine zu, keine ab |

Die 6 sind zwei Elemente in je drei Durchgängen (`standard`, `narrow`, `reducedMotion`),
beide aus `loot.css`: `button.active.shop-sort-btn#0` und
`span.active.all.shop-cat-badge#0`. Der **Wert** dahinter — den ein Digest nicht nennen
kann — steht im örtlichen Vollabzug: `rgba(0, 0, 0, 0.35) 0px 2px 6px 0px`, vorher
`rgba(212, 175, 55, 0.3) 0px 2px 4px 0px`. Das ist wörtlich die Vorhersage aus `6367990`.

**Wie neu erhoben, und warum die Ausnahmeliste danach wieder leer ist.**
`EXPECTED_DEVIATION_KEYS` trug die zwei Schlüssel genau für die Dauer der Neuerhebung,
damit die drei Durchgänge die übrigen **3620** Schlüssel weiter vergleichen. Danach leer —
eine Ausnahmeliste, die nichts mehr ausnimmt, ist eine stille Freigabe und würde ab dem
nächsten Lauf echte Befunde an genau diesen Schlüsseln verschlucken. Der anschließende Lauf
**ohne** Ausnahmeliste ist grün; `computed-style-diff.spec.js` ist an HEAD unverändert,
geändert wurde allein die JSON-Datei (6 Zeilen).

### Die Ablichtung

`tests/e2e/features/welle-3-screens.spec.js`, Schalter `WELLE3_SCREENS=1`, Ablage
`tests/e2e/__screens__/welle-3/`. 24 Ansichten × 4 Themes = 96 Vollbilder, dazu 9
Zustandsbilder je Theme = 36. **132 Bilder, keine Fehlmeldung eines Zustandsbildes.**
Die neun Zustände sind die Stellen, die im Ruhezustand einer Ansicht nicht zu sehen sind:
`rechner`, `befehlspalette`, `offline-hinweis`, `statblock-schublade`, `sprungmarke-nsc`,
`sprungmarke-ort`, `kartenschweben`, `qref-fab-hover`, `vorlesetext`.

### Zwei Beobachtungen, die nicht aus dieser Welle stammen

**(1) Der Offline-Hinweis hat zwei Beobachter, und einer schaltet eine Klasse, die es im
CSS nicht gibt.** Das Avatar-Modul schaltet `visible` — die Klasse, auf die `core.css`
hört, und darum erscheint der Hinweis. Die Initialisierung schaltet daneben `show`, und
**keine Regel im ganzen Stilbaum** trifft `.offline-indicator.show`. Der zweite Beobachter
ist damit wirkungslos. Das ist älter als Welle 3 und betrifft die Sichtbarkeit, nicht den
Schatten — hier nur festgehalten, nicht angefasst.

**(2) `prettier --check` beanstandet zwei Dateien, beide vorbestehend.** Die
Sollstandsdatei entsteht maschinell aus `JSON.stringify` und steht nicht in
`.prettierignore`; sie wird auch in ihrem HEAD-Stand beanstandet. Die neue
Ablichtungsdatei wird an **genau einem** Block beanstandet (die kompakt geschriebene
`VIEWS`-Liste) — wörtlich derselbe Block, an dem auch `welle-1-screens.spec.js` und
`welle-2-screens.spec.js` beanstandet werden. Sie bleibt stilgleich mit ihren Geschwistern.

---
