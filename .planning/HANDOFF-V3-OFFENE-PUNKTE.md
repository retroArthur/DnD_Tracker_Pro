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
| `bestiary.css:525` | `.bst-section-title` | `--gold` | #191919 | #1e1e1e |
| `bestiary.css:538` | `.bst-validation-error` | `--red` | #191919 | #1e1e1e |
| `core.css:1484` | `.char-modal-title h2` | `--gold` | #191919 | #1e1e1e |
| `core.css:1489` | `.char-modal-subtitle` | `--cyan` | #191919 | #1e1e1e |
| `dashboard.css:234` | `.modal-title` | `--gold` | #191919 | #1e1e1e · #252525 |
| `initiative.css:730` | `.aoe-modal-header h3` | `--red` | #191919 | #1e1e1e |
| `initiative.css:870` | `.aoe-target-save` | `--green` | #191919 | #1e1e1e |
| `initiative.css:887` | `.aoe-target-damage.full` | `--red` | #191919 | #1e1e1e |
| `initiative.css:891` | `.aoe-target-damage.half` | `--yellow` | #191919 | #1e1e1e |
| `party.css:2081` | `.rest-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `party.css:2360` | `.condition-ref-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:465` | `.rt-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:595` | `.rt-dice-label` | `--gold` | #191919 | #1e1e1e |
| `tools.css:678` | `.generator-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:805` | `.ld-modal-header h3` | `--gold` | #191919 | #1e1e1e |
| `tools.css:838` | `.ld-gold-label` | `--gold` | #191919 | #1e1e1e |

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
| `dmscreen.css:604` | `.session-arc-title` | `--gold` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `dmscreen.css:1159` | `.drag-handle:hover` | `--gold` | --bg-card · GRAD:#0d0d0d | --bg-card · GRAD:#f5f5f5 |
| `initiative.css:271` | `.init-value` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:303` | `.init-name:hover` | `--gold` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:331` | `.init-hp-value.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:332` | `.init-hp-value.bloodied` | `--yellow` | GRAD:#0d0d0d · --bg-card | GRAD:#f5f5f5 · --bg-card |
| `initiative.css:1392` | `.init-mob-alive.healthy` | `--green` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `initiative.css:1393` | `.init-mob-alive.bloodied` | `--yellow` | GRAD:#0d0d0d | GRAD:#f5f5f5 |
| `spells.css:92` | `.spell-info-line.classes` | `--cyan` | GRAD:#1a1a1a | GRAD:#ffffff |
| `spells.css:93` | `.spell-info-line.school` | `--purple` | GRAD:#1a1a1a | GRAD:#ffffff |
| `tools.css:853` | `.ld-split-amount` | `--gold` | GRAD:#191919 | GRAD:#1e1e1e |

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
| `dashboard.css:186` | `.campaign-name` | `--cyan` | #1f2e24 | #edfcf2 |
| `dmscreen.css:1376` | `.dms-init-marker` | `--gold` | #3c331b | #fef5de |
| `dmscreen.css:1389` | `.dms-init-value` | `--cyan` | #3c331b | #fef5de |
| `loot.css:289` | `.shop-cat-badge.weapon` | `--red` | --bg-card | --bg-card |
| `loot.css:290` | `.shop-cat-badge.armor` | `--blue` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:292` | `.shop-cat-badge.service` | `--purple` | #d4af37 · --bg-card | #b8860b · --bg-card |
| `loot.css:294` | `.shop-cat-badge.all` | `--gold` | #d4af37 | #b8860b |
| `party.css:842` | `.wiki-tree-item.pinned` | `--gold` | --bg-card · #2f233b | --bg-card · #f2e6fe |
| `tools.css:576` | `.rt-dice-btn:hover` | `--gold` | --bg-dark · #d4af37 | --bg-dark · #b8860b |
| `tools.css:631` | `.rt-hint-warn` | `--orange` | #2f2618 | #332a1c |

### Gruppe D — zwei verschiedene Traeger fuer denselben Selektor, 5 Stellen

| Stelle | Selektor | Rolle | Traeger dark | Traeger light |
| ------ | -------- | ----- | ------------ | ------------- |
| `dashboard.css:534` | `.char-section-title` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `dice.css:778` | `.fdp-title` | `--gold-text` | --bg-card | --bg-card |
| `core.css:758` | `.form-group label` | `--gold` | --bg-card · #191919 | --bg-card · #1e1e1e |
| `party.css:2690` | `.char-adv-btn.adv` | `--green` | --bg-dark · #191919 | --bg-dark · #1e1e1e |
| `party.css:2691` | `.char-adv-btn.dis` | `--red` | --bg-dark · #191919 | --bg-dark · #1e1e1e |

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
  146  .bestiary-fav.active
core.css
   17  [data-layout="mobile"] .mobile-nav-toggle-text
  112  [data-layout="mobile"] #mobile-timer-display
  116  [data-layout="mobile"] .mobile-timer.running #mobile-timer-display
  120  [data-layout="mobile"] .mobile-timer.paused #mobile-timer-display
 1380  .char-card-currency
 2152  .quest-reward-item-tag .remove-btn:hover
 2145  .quest-reward-item-tag .remove-btn
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
  448  .char-save-box.proficient .save-label
  496  .enc-save-box.active .enc-save-label
  696  .icon-btn.danger:hover
  697  .icon-btn.success:hover
 1165  .dash-timer-time
 1504  .qref-chip.danger
dice.css
  420  .dice-fav-item:hover .fav-del
dmscreen.css
   85  .dice-fav-btn .fav-name
  273  .condition-tooltip-title
  392  .notes-search-date
  522  .session-tag-remove:hover
  674  .quick-ref-section-title
 1278  .dms-stat-warning .dms-stat-value
 2360  .dms-profile-check
 2386  .dms-profile-save
 2390  .dms-profile-save .dms-profile-name
encounters.css
   34  .list-view-row.expanded .row-toggle
   47  .list-dialog-item.used .list-dialog-status
  307  .calc-list-remove:hover
  374  .calc-diff-xp
  406  .calc-threshold-label.easy
  407  .calc-threshold-label.medium
  408  .calc-threshold-label.hard
  409  .calc-threshold-label.deadly
  482  .calc-stat-info:hover
  508  .calc-preview-xp
  513  .calc-preview-change
  679  .calc-fav-item.save
 1184  .enc-speed-line
file-backup.css
  259  .backup-entry-restore
initiative.css
   72  .bf-xp
  108  .init-entry.lair .init-name
  333  .init-hp-value.critical
  403  .death-saves-label
 1288  .la-label
 1329  .lr-label
 1394  .init-mob-alive.critical
loot.css
  291  .shop-cat-badge.item
  468  .si-tag-v
  629  .cart-shop-name
  696  .cart-item-total
npcs.css
  232  .npc-detail-location
  890  .npc-name
  971  .npc-popup-name
 1004  .npc-popup-section-title
party.css
 1972  .party-stat-card.critical .party-stat-value
 2264  .rest-heal-preview
 2270  .rest-hd-restore
 2645  .cf-attack-remove:hover
 2794  .char-skill-item.proficient .char-skill-item-name
 2817  .char-skill-item.expertise .char-skill-item-name
spells.css
  148  .spell-material
tools.css
  252  .timer-card-time
  446  .rt-result-label
 1144  .breadcrumb-item:hover
 1457  .sb-remove-btn:hover
welt.css
   61  .wp-session-nr
  271  .wp-detail-header h3
  594  .rs-tagesmarsch
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

## U6-R2-01 — Drei Restbeobachtungen aus der Höhenbudget-Korrektur, Runde 2

**Status: FESTGEHALTEN, nicht angefasst.** Aufgenommen am 2026-10-01, nach den beiden
Korrekturen `fix(UAT): die Bandhoehe wird nachgemessen, nicht geglaubt` und
`fix(UAT): die umbrechende Werkzeugleiste behaelt ihr Suchfeld`.

Alle drei sind **vorbestehend** und keine Folge dieser Runde. Sie stehen hier, weil die Runde
sie gemessen hat und weil (3) die Form eines neuen Fehlerbildes hat, auch wenn die Ursache alt
ist. Gemessen am gebauten Bündel mit dem Abnahme-Saatgut (24 Einträge je Liste), Skript
`r4-rest.mjs`.

### (1) Die Stapelregel für zwei gleichzeitige Bänder ist tot

> **ERLEDIGT in M3a (2026-10-01): die Regel ist gestrichen.** Die unten offen gelassene
> Entscheidung fiel auf *entfernen*, aus drei gemessenen Gründen — siehe Abschnitt
> „M3 — Tote Regel, Wächter-Ausnahmen und die Messmatrix“ am Ende dieser Akte.

`.migration-hint-banner ~ .divergence-banner { top: 48px }` (`assets/styles/migration.css`)
soll das zweite feste Band unter das erste schieben. Der Geschwisterwähler trifft nie:
`showDivergenceBanner()` hängt sein Band als `document.body.firstChild` ein, also **vor** dem
Hinweisband — es ist kein nachfolgendes Geschwister. Gemessen bei 390x844 mit beiden Bändern:
Hinweisband `0..157`, Divergenzband `0..40`, also vollständig übereinander.

Folgenlos im Betrieb: `startMigrationFileSide()` verzweigt entweder/oder, und
`startMigrationFlow()` entfernt den Hinweis im selben synchronen Block. Die beiden Bänder
koexistieren nicht. Glied 1 rechnet ohnehin `max(bottom)` über beide und wäre auch im
gestapelten Fall richtig; der Seitenüberhang blieb in der Messung 0.

**Zu entscheiden bleibt:** die tote Regel entfernen (sie behauptet eine Ordnung, die es nicht
gibt) oder die Einfügereihenfolge umdrehen und die 48px durch
`var(--migration-hint-height)` ersetzen.

### (2) Das Layoutprofil wird nur beim Start gewählt, nicht beim Verkleinern

`loadLayout()` (`ui/layout-profiles.js`) wählt bei `innerWidth <= 768` selbst `mobile`; ein
`resize` ändert daran nichts. Zieht der DM ein Desktop-Fenster auf Telefonbreite, bleibt
`data-layout="desktop"`, und damit bleibt die Desktop-Kopfzeile stehen — bei 390px Breite ist
sie **234px** hoch (`157..391`), weil ihre Zeilen umbrechen.

Gemessen 1440x800 -> 390x844: Umrahmung 195 -> **411px**, Schalenhöhe 605 -> 433px von 844.
Der Seitenüberhang bleibt 0, die Werkzeugleiste bleibt frei (das ist die Korrektur dieser
Runde) — die Ansicht wird nur schmal und hoch zugleich bedient, statt in das Mobil-Layout zu
wechseln, das für diese Breite gebaut ist. Dasselbe Fenster **vor** dem Laden gesetzt wählt
`mobile` und kommt auf 250px Umrahmung.

**Zu entscheiden bleibt:** soll das Profil dem Fenster folgen, oder ist die einmalige Wahl
gewollt (sie überlebt einen Wechsel von Hand, was ein Argument dafür ist)?

### (3) Sehr kurze Fenster lassen von der Schale fast nichts übrig

Weil die Umrahmung jetzt **gemessen** statt verdrahtet ist, kann sie im Grenzfall fast die
ganze Fensterhöhe aufbrauchen. Gemessen bei 390x420 (Desktop-Layout nach Punkt 2, Band steht):
Umrahmung 411px von 420 Fensterhöhe, **Schalenhöhe 9px**. Der Seitenüberhang ist 0 — die
Zusicherung von U6 hält —, aber die Liste ist unbenutzbar.

Die verdrahteten 120px gaben dort 300px Schalenhöhe, dafür lag die Werkzeugleiste hinter der
Kopfzeile: es ist ein Tausch, kein Rückschritt, und 420px Fensterhöhe ist ein Randfall. Nicht
von einem Test gedeckt — die Fälle in `tests/e2e/features/hoehenbudget.spec.js` messen bei 700
bis 900px Höhe.

**Zu entscheiden bleibt:** eine `min-height`-Untergrenze an den fünf Schalen (dann scrollt die
Seite im Grenzfall wieder, und der Anheft-Versatz muss es tragen), oder Punkt 2 lösen und den
Grenzfall damit auflösen.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/hoehenbudget.spec.js   # 23 Faelle
npx playwright test tests/e2e/features/sticky-stapel.spec.js tests/e2e/features/ansichts-schalen.spec.js
```

---

## U6-R3-01 — Abnahme der Höhenbudget-Korrektur: der Kurzfenster-Befund, auseinandergerechnet

**Status: BEANTWORTET, nichts geändert.** Aufgenommen am 2026-10-01 bei der Abnahme der Runde 2.
Der Prüfbefund lautete: *„Kurze Fenster, vor allem Telefon im Querformat: die gemessene
Umrahmung frisst die Schale auf — 0 anklickbare Einträge, Suchfeld nicht treffbar."* Er ist in
zwei Hälften zu teilen; nur eine davon ist überhaupt ein Befund, und die gehört nicht dieser
Runde.

Alle Zahlen am gebauten Bündel gemessen, Saatgut mit 24 Einträgen je Liste, A/B im SELBEN
Bündel: der Vorher-Zustand wird durch eine Stilregel nachgestellt, die genau die eine geänderte
Zeile zurückdreht (`height: calc(100vh - 120px)` an den fünf Schalen). Skripte unter
`<scratch>/uat-budget/abnahme/` (`menschlich.mjs`, `regress2.mjs`, `kurz-innen.mjs`,
`mobil-360.mjs`, `mobil-probe.mjs`).

### (1) „0 anklickbare Einträge" — richtig gemessen, aber vorbestehend

Bei Breiten **bis 900px** zusammen mit **etwa 390px Fensterhöhe** (844x390 und 900x390, beides
Desktop-Layout, einspaltiger Zweig `@media (max-width: 900px)`) erreicht ein Mausrad **0 von 24**
Einträgen — **mit dem gemessenen Budget und mit der zurückgedrehten 120px gleichermaßen**, über
dieselbe Radfolge (Ruhe, Seite blättern, fünf Etappen über der Master-Spalte).

Die Ursache ist nicht das Budget: die umgebrochene Werkzeugleiste der Ansicht ist bei diesen
Breiten **157px** hoch und damit so hoch wie die ganze Schale (157px bei 844x390). Die
Master-Spalte landet dadurch unter der `overflow: hidden`-Kante der Schale — vorher mit 113px
Höhe unterhalb des Fensterrands, nachher mit 32px direkt an der Kante. In beiden Fällen bleibt
nichts zu klicken.

**Methodenhinweis, der hier den Unterschied macht:** `scrollIntoViewIfNeeded()` eines
Testwerkzeugs scrollt eine Schale mit `overflow: hidden` **programmatisch** und meldet dann
„Klick erfolgreich". Ein Mausrad kann das nicht. Wer in diesem Randfall mit
`scrollIntoViewIfNeeded` prüft, misst eine Erreichbarkeit, die es am Tisch nicht gibt. Gemessen
wurde deshalb ausschließlich mit `mouse.wheel`.

### (2) „Suchfeld nicht treffbar" — reproduziert nicht

In allen acht gemessenen Kurzfenstern (844x390, 740x360, 667x375, 900x390, 1024x600, 1280x400,
1366x500, 390x844), in beiden Varianten, antwortet `elementFromPoint` auf der Mitte des
Suchfelds mit dem Suchfeld: **frei**. Ebenso in 128 von 128 Zuständen der Desktop-Matrix (vier
Ansichten x vier Breiten x zwei Höhen x mit/ohne Band x gescrollt/oben) und in 24 von 24
Mobil-Zuständen. Die Hälfte des Befunds ist gegenstandslos.

### (3) Was dieser Runde wirklich zuzurechnen ist: der Fluchtweg der Seite ist weg

Vor der Korrektur hatte die Seite in kurzen Fenstern einen Überhang (113px bei 844x390, 151px
im Mobil-Layout), und der Nutzer konnte die Seite blättern, um an die gequetschte Liste zu
kommen. Jetzt ist der Überhang 0 — das IST die Korrektur — und damit auch dieser Weg. Der Preis,
beziffert:

| Fenster | vorher erreichbar | jetzt erreichbar |
| ------- | ----------------- | ---------------- |
| 1920x1080 | 13 von 24 | 12 von 24 |
| 1440x800 | 13 von 24 | 12 von 24 |
| 1024x600 | 10 von 24 | 9 von 24 |
| 1280x400 | 5 von 24 | 2 von 24 |
| 900x390 / 844x390 | 0 von 24 | 0 von 24 |

(Vereinigungsmenge über dieselbe feste Radfolge; ab 600px Fensterhöhe ist der Unterschied genau
ein Eintrag.)

**Mobil, 360px Breite, mit stehendem Umzugs-Band** ist der sichtbarste Fall: die Umrahmung ist
dort 346px von 740px Fensterhöhe (Band allein 157px), die Schale also 394 statt 620px. Die
Werkzeugleiste nimmt davon 256 bis 328px, die Listenspalte behält **126px (NSCs), 54px (Truhe),
201px (Orte)** statt vorher 352/280/427px. In zwei der vier Ansichten liegt die geometrische
Mitte des letzten Eintrags danach hinter der Filterzeile der Werkzeugleiste; anklickbar bleibt
er über seinen unteren Rand. **Ohne Band sind alle 24 Mobil-Zustände sauber** (Umrahmung 210px,
Überhang 0, Suchfeld frei, letzter Eintrag getroffen).

### (4) Nebenbefund derselben Messung: die Reiter-Leiste im Mobil-Layout ist unerreichbar

`.app-header` ist im Mobil-Layout `position: fixed` und **357px hoch**, sichtbar bleibt davon
nur ein 56px-Streifen am unteren Fensterrand. Das Reiter-Raster liegt damit **127 bis 301px
unter** der Fensterkante und ist mit einem Klick nicht erreichbar — gemessen bei 390x844,
700x800 und 360x740, **auf den Pixel gleich in beiden Varianten** (Reiter 915..971 bei 844px
Fensterhöhe). Vorbestehend, vom Höhenbudget unabhängig; ein Ansichtswechsel im Mobil-Layout
gelingt in diesen Fenstern nur über die Kommandopalette oder die Tastatur.

> **RICHTIGSTELLUNG (M1, 2026-10-01).** Der letzte Satz ist falsch, und zwar der zweite Teil.
> Die Leiste **fährt per Klick aus**: `.mobile-nav-toggle` ist 56px hoch, sitzt am unteren
> Fensterrand und `elementFromPoint` traf ihn in allen gemessenen Fenstern selbst; ein Klick
> setzt `.nav-open` und die Leiste fährt auf `translateY(0)`. Gemessen wurde oben nur der
> **eingeklappte** Zustand. Die ausgefahrene Leiste war sehr wohl erreichbar — nur nicht
> vollständig: von 24 Reitern antworteten **7 (390x844), 10 (360x740), 16 (700x800)**. Die
> wirklichen Ursachen und ihre Behebung stehen unter „M1" am Ende dieser Akte.

**Zu entscheiden bleibt** (zusammen mit U6-R2-01 Punkt 3, es ist dieselbe Entscheidung): eine
Untergrenze an den fünf Schalen — dann scrollt die Seite im Grenzfall wieder und die
Werkzeugleiste kann dort wieder unter die Kopfzeile rutschen —, oder die Werkzeugleiste bei
kleinen Breiten niedriger bauen, was den Randfall an der Wurzel auflöst und auch Punkt (1)
mitnimmt.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/hoehenbudget.spec.js   # 23 Faelle
UAT_SCREENS=1 npx playwright test tests/e2e/features/uat-funde-screens.spec.js   # 28 Bilder
```

---

## M1 — Alle 24 Ansichten auf dem Telefon erreichbar (2026-10-01, erledigt)

Behebt den Nebenbefund (4) oben, nachdem dessen Diagnose richtiggestellt war.

### Der Ausgangsstand, beziffert

Gebautes Bündel zu `cecfefe`, Mobil-Layout per `setLayout('mobile')`, Umschalter geklickt,
`elementFromPoint` auf der Reitermitte:

| Fenster | Reiter | im Sichtfeld | anklickbar | Leiste | Raster Sicht/Inhalt |
| --- | --- | --- | --- | --- | --- |
| 390x844 | 24 | 16 | **7** | 357px | 300px / 444px |
| 360x740 | 24 | 16 | **10** | 357px | 300px / 444px |
| 700x800 | 24 | 16 | **16** | 357px | 300px / 444px |

### Zwei unabhängige Ursachen

**A — der Deckel.** `[data-layout="mobile"] .nav-tabs` trug `max-height: 300px` bei 444px
Rasterinhalt. Die unterste Reihe (Soundboard, Statistiken, Session-Prep, Daten) lag dauerhaft
hinter dem `overflow`. Die 300 hatten keinen Bezug zum Fenster: bei 390x844 lagen unter dem
Umzugs-Band 623px frei.

**B — Überdeckung.** Vier bodenverankerte Flächen lagen auf der ausgefahrenen Leiste; je Reiter
der Verdecker, den `elementFromPoint` zurückgab (390x844, Deckungsfläche in Bildpunkten²):

| Element | z-index | Deckung | betroffene Reiter |
| --- | --- | --- | --- |
| `#event-log` | `--z-toast` 4000 | 71420 | Orte, Kalender, Reise, Quests, Initiative, Begegnung, Bestiar |
| `#floating-dice-trigger` | `--z-floating` 2000 | 2304 | Notizen |
| `.qref-fab` | `--z-panel` 600 | 2500 | DM Screen, Daten |
| `.kplog-panel` | `--z-panel` 600 | — | sobald es offen stand |

Die `.qref-fab` liegt auf **derselben** Ebene wie die Leiste und gewann allein durch die
Dokumentreihenfolge. Wie viele Reiter das Ereignis-Log traf, hing daran, wie viele Meldungen
gerade darin standen — die Erreichbarkeit war nicht einmal stabil.

**Und der Weg in die Leiste.** Das Kampfprotokoll rechnete seine Höhe gegen den unteren
Fensterrand, der im Mobil-Layout der eingeklappten Leiste gehört. Bei 740x360 antwortete
`elementFromPoint` auf der Mitte der Umschalter-Zeile mit `div.kplog-text`: der Umschalter war
nicht klickbar, und damit waren **alle** 24 Ansichten unerreichbar — ein Zustand, den keine
Messung an der ausgefahrenen Leiste je bemerkt hätte.

### Die Entscheidung

Die **56px Tippfläche bleiben**. Der andere Weg, 24 Reiter in 300px zu bringen, wäre eine
kleinere Tippfläche gewesen; der Nutzer ist Spielleiter am Tisch und bedient die App mit dem
Daumen, unter 44px trifft er nicht mehr zuverlässig. Auch die Desktop-Gruppierung (6 Gruppen
statt 24 Reitern) ist nicht übernommen: sie macht aus einem Tipp zwei und versteckt den
Ansichtsnamen hinter einem Gruppennamen — am Tisch muss „wo ist das Soundboard" durch Hinsehen
beantwortbar sein, nicht durch Erinnern. Falsch war der Deckel, nicht die Reitergröße.

Statt der Zahl steht jetzt eine **Messung**: `setzeMobilLeistenDeckel()` in der Anheft-Kette
(`ui/editors/rich-text-insert.js`) veröffentlicht zwei weitere Tokens auf `<html>` —
`--mobile-nav-max-height` (Glied 4: Fensterhöhe minus die tiefste Unterkante der festen
Kopfblöcke minus die Umschalter-Zeile minus 8px Luft) und `--mobile-nav-rest` (Glied 5: die Höhe
des Streifens, den die eingeklappte Leiste immer belegt). Die vier Schwebeelemente verbergen
sich, solange `.nav-open` steht; ausweichen war nicht möglich, oberhalb der offenen Leiste wäre
bei 740x360 ein Rest von **-17px** geblieben.

### Die gemessene Wirkung

Gebautes Bündel, voller Zustand (Dauermodus-Log mit fünf Meldungen, Kampfprotokoll offen), in
allen vier Themes auf den Bildpunkt gleich:

| Fenster | Deckel | Leiste | Raster Sicht/Inhalt | anklickbar (vorher) | kleinster Reiter |
| --- | --- | --- | --- | --- | --- |
| 390x844 | 623px | 501px | 444 / 444 | **24/24** (7) | 56px |
| 360x740 | 540px | 501px | 444 / 444 | **24/24** (10) | 56px |
| 700x800 | 672px | 501px | 444 / 444 | **24/24** (16) | 56px |
| 740x360 | 232px | 289px | 232 / 444 | **24/24** nach zwei echten Radrunden | 56px |

Null Überlapper in allen 16 Zuständen, Umschalter-Zeile in allen 16 frei, alle vier
Schwebeelemente nach dem Einfahren wieder sichtbar.

### Die Zusicherung

`tests/e2e/features/mobil-navigation.spec.js`, 13 Fälle, alle fünf Zusicherungen vorher rot:
alle 24 im echten Mausrad-Durchlauf erreichbar · kein sichtbares Schwebeelement über der Leiste ·
bei 360x740 und 390x844 passt der Rasterinhalt ohne Scrollen hinein · Tippfläche ≥ 44px · im
Querformat 740x360 muss gescrollt werden und das Rad erreicht trotzdem alle 24. Gescrollt wird
nur per `page.mouse.wheel`, geklickt nur auf gemessenen Koordinaten.

### Offen geblieben

- `.event-log-entry` trägt `pointer-events: auto`, obwohl an einem **flüchtigen** Eintrag nichts
  zu klicken ist (nur der Dauermodus hat Knöpfe). Dadurch schluckt das Ereignis-Log Klicks auf
  alles, was unter ihm liegt — auch im Desktop-Layout, wo es mittig auf `bottom: 20px` sitzt.
  M1 brauchte die Korrektur nicht, weil das Log im Mobil-Layout ohnehin verborgen wird; der
  Befund steht aber und ist zwei Zeilen wert.
- `.qref-fab` sitzt im Mobil-Layout auf `bottom: 10px` (unter 600px Breite) bzw. `20px` und
  überlappt damit den 56px-Streifen der **eingeklappten** Leiste — bei 390x844 liegt sie über dem
  ▲-Zeichen der Umschalter-Zeile. Der Umschalter bleibt an seiner Mitte klickbar (x=195 gegen
  330..380), es ist ein kosmetischer Befund, aber derselbe Fehler wie der behobene am
  Kampfprotokoll.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/mobil-navigation.spec.js   # 21 Faelle
```

---

## M1 Runde 2 — die waagerechte Achse (2026-10-01, erledigt)

Runde 1 hat die Leiste nur **senkrecht** vermessen. Die Prüfung der Einheit hat die zweite Achse
gefunden; sie ist echt, und sie trifft genau die Breite, die CLAUDE.md als Mobil-Prüfbreite nennt.

### Der Befund, nachgemessen

`.nav-tabs` steht auf `repeat(4, 1fr)`. Ein `1fr` ist `minmax(auto, 1fr)`, und `auto` löst als
Mindestbreite die **Min-Inhalt-Breite** des Rasterkindes auf. Solange die Beschriftung aus
`core.css` `white-space: nowrap` erbt, ist das die volle Textbreite — die vier Spalten konnten
gar nicht unter **408px** gehen, bei jeder Fensterbreite.

| Fenster | Rasterbreite / Fenster | Überhang | erreichbar |
| --- | --- | --- | --- |
| 320x568, 320x740 | 408px / 320px | 88px | **18/24** |
| 360x740 | 408px / 360px | 48px | 24/24 (rechte Spalte angeschnitten) |
| 390x844 | 408px / 390px | 18px | 24/24 (rechte Spalte angeschnitten) |

Bei 320px lag die vierte Spalte (x 308..400) **ganz** außerhalb der Scheibe. `elementFromPoint`
antwortete auf ihrer Mitte (x=354) mit `null` — nicht weil etwas darüberlag, sondern weil der
Punkt das Fenster verlassen hatte. Unerreichbar waren Fraktionen, Quests, Wiki, Shops, DM Screen
und Daten. Ein senkrechtes Mausrad half nicht (`scrollLeft` blieb 0); nur ein **waagerechtes**
Rad erreichte sie, und dann verließ die erste Spalte das Fenster. Es waren nie alle 24
gleichzeitig da, und nichts in der Leiste deutete auf diese Geste hin.

Die Ursache ist vorbestehend (`grid-template-columns` ist im Diff der Runde 1 unveränderte
Kontextzeile). Die **Zusicherung** der Runde 1 war aber „alle 24 Ansichten erreichbar", und ihr
Netz prüfte ausschließlich 360px und 390px — es konnte diesen Fall nie melden.

### Die Entscheidung

Vier Angaben an `[data-layout="mobile"] .nav-tab`: `min-width: 0` (nimmt der Spalte die
Mindestbreite), `white-space: normal` (hebt das geerbte `nowrap` auf), `overflow-wrap: anywhere`
(die funktionale Zusage — die einzige der drei, die auch die Min-Inhalt-Breite senkt) und
`hyphens: auto` (nur die Form: mit `lang="de"` wird aus „Soundboar|d" ein „Sound-|board").

`min-width: 0` **allein** wäre die halbe Lösung gewesen: die Spalten schrumpfen (408 → 320, 24/24
erreichbar), aber die Beschriftung behält `nowrap` und quillt über den Knopfrand auf den Nachbarn
— bei 320px gemessen `dmscreen` +1px, `soundboard` +4px, `sessionprep` +6px. Dagegen steht jetzt
Zusicherung 7.

Nicht gewählt: eine Ellipse (schneidet die Beschriftung ab — am Tisch muss „wo ist das
Soundboard" durch Hinsehen beantwortbar sein, und „Soundb…" ist kein Hinsehen); drei Spalten
unter 360px (568px hohes Raster bei 368px Sichtfeld, also mehr Wischen statt weniger, gemessen
18/24 ohne Rad bei 320x568); eine kleinere Schrift oder Tippfläche (unter 44px trifft ein Daumen
nicht mehr zuverlässig — derselbe Grund wie beim Deckel in Runde 1).

### Die gemessene Wirkung

Gebautes Bündel, vier Themes auf den Bildpunkt gleich, beide Zustände:

| Fenster | Raster waagerecht Inhalt/Sichtfeld | erreichbar (vorher) | kleinster Reiter |
| --- | --- | --- | --- |
| 320x568 | 320 / 320 (vorher 408) | **24/24** (18) | 72x56 |
| 320x740 | 320 / 320 (vorher 408) | **24/24** (18) | 72x56 |
| 360x740 | 360 / 360 (vorher 408) | **24/24** (24) | 82x56 |
| 390x844 | 390 / 390 (vorher 408) | **24/24** (24) | 89x56 |
| 700x800 | 700 / 700 | **24/24** | 167x56 |
| 740x360 | 740 / 740 | **24/24** nach Rad | 177x56 |

Kein Textüberlauf in keinem Fall. Bei 320px laufen zwei Beschriftungen auf zwei Zeilen und machen
ihren Reiter 64px hoch. Das Desktop-Layout ist unberührt; der Stil-Sollstand erfasst ohnehin nur
Elemente innerhalb der `#view-*`-Behälter, die Leiste liegt im Kopf.

### Richtiggestellt: der Kopf der Probe

Die Prüfung hat außerdem gemeldet, die Ausgangszahlen im Kopf von `mobil-navigation.spec.js`
(11/13/16) seien „nicht reproduzierbar" und die Wirklichkeit sei 7/10/14. **Das stimmt nur zur
Hälfte.** Nachgemessen am selbst gebauten `cecfefe`-Bündel sind *beide* Reihen echt — der
Unterschied ist **eine einzige flüchtige Meldung**:

| Zustand | Einträge im Ereignis-Log | 390x844 | 360x740 | 700x800 |
| --- | --- | --- | --- | --- |
| schlicht | 2 (Sicherungserinnerung, „Layout: Mobil") | 11 | 13 | 16 |
| schlicht + `setTheme()` | 3 (zusätzlich „Theme: Dunkel") | 7 | 10 | 14 |
| voll (Dauermodus mit 5, Kampfprotokoll offen) | 5 | 6 | 0 | 8 |

Jeder Eintrag macht das Log rund 70px höher (153px bei zwei, 223px bei drei Einträgen) und
verdeckt damit eine weitere Reiterreihe. `setLayout('mobile')` schreibt dabei **selbst** eine
Meldung: die Messung störte ihren eigenen Gegenstand. Bei 360x740 im vollen Zustand lag das
Kampfprotokoll auf der Umschalter-Zeile, die Leiste ließ sich gar nicht ausfahren — daher die 0.

Der echte Fehler im Kopf war deshalb nicht die Zahlenreihe, sondern ihre **Beschriftung**: dort
stand als Bedingung der volle Zustand, die Zahlen waren aber die des schlichten. Die Spalte „im
Feld 16" war ebenfalls falsch, gemessen sind es 20. Der Kopf führt jetzt alle drei Zustände mit
ihrer Bedingung statt einer Reihe ohne. Die Tabelle der Runde 1 weiter oben (7/10/16) bleibt, wie
sie ist: sie nennt den Stand, gegen den Runde 1 gearbeitet hat.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/mobil-navigation.spec.js   # 21 Faelle
```

---

## M2 — Das Layoutprofil folgt dem Fenster, und der Platz wird einmal reserviert (2026-10-01, erledigt)

Drei vorbestehende Befunde der Vorrunden, alle gemessen statt geraten. Zwei davon standen
weiter oben in dieser Akte schon mit Zahlen: **U6-R4-01 Punkt (2)** („Das Layoutprofil wird nur
beim Start gewählt") und der Absatz **„Mobil, 360px Breite, mit stehendem Umzugs-Band"** unter
U6-R4-01 Punkt (3). Beide sind hiermit entschieden und behoben.

### (a) Das Profil folgt dem Fenster — aber nie gegen die Wahl des Nutzers

`loadLayout()` erkannte die Breite genau einmal beim Start. Gemessen am Bündel zu `f58699b`,
Fenster **nach** dem Laden gezogen, in allen vier Themes auf den Bildpunkt gleich:

| Messgröße | 1440x800 | 390x844 vorher | 390x844 nachher |
| --- | --- | --- | --- |
| `data-layout` | desktop | **desktop** | mobile |
| Höhe der Kopfzeile | 102px | **234px** | 501px (56 sichtbar) |
| Oberkante der Kopfzeile | 61px | 157px | 788px |
| Mobil-Kopfzeile | 0px | **0px** | 64px |
| sichtbare Reiter von 24 | 1 | **1** | 24 |
| Seitenüberhang | 74px | 658px | 528px |

234 von 844 Bildpunkten sind 28% des Fensters, und 23 der 24 Reiter steckten in zugeklappten
Gruppenmenüs. Der umgekehrte Weg stimmt jetzt ebenso (390x844 nach 1440x800 ergibt `desktop`), und
der Verlauf über vier Wechsel lautet mobile/desktop/mobile/desktop statt viermal desktop.

**Die Entscheidung mit ihrer Begründung.** Das Profil folgt dem Fenster, weil der Gegenfall ein
Fehler am Spieltisch ist; es folgt aber **nur**, solange `D.settings.layout` leer ist. Was der
Nutzer per Schalter gewählt hat, bleibt stehen (zwei Wächterfälle, beide Richtungen). Und der
automatische Wechsel schreibt selbst **nichts** nach `D.settings.layout` — täte er es, würde die
erste Verkleinerung das Profil für immer festschreiben und die Zusicherung sich selbst aufheben
(gemessen: nach vier Wechseln steht dort viermal `null`). Kein `save()`, kein Toast: ein
Fensterwechsel ist keine Anweisung, und M1 hat gemessen, dass gerade das Ereignis-Log die
Navigationsleiste zudeckt. **Ein** Beobachter, nicht zwei: die Profilwahl läuft im bestehenden
entprellten `resize`-Beobachter von `core/init.js`, und zwar **vor** `updateStickyOffsets()`,
weil dessen Mobil-/Desktop-Zweig an `data-layout` verzweigt.

### (b) Der Platz der unteren festen Leiste war doppelt reserviert

`body { padding-bottom: 70px }` **und** `.main-content { margin-bottom: 70px }` hielten denselben
Platz frei — 140px für einen 56px hohen sichtbaren Streifen. Die Höhenbudget-Kette zählt beides
mit, das Ergebnis stimmte also; dem Inhalt gingen die 70px doppelt verloren. Der Rand an
`.main-content` ist entfallen: der body-Innenabstand ist die Reservierung, die das **ganze**
Dokument abdeckt, und die Leiste ist `position: fixed` zum Fenster.

### (c) Das Hinweisband war auf Telefonbreite das teuerste Element der Seite

| Breite | 320 | 360 | 390 | 480 | 500 | 600 |
| --- | --- | --- | --- | --- | --- | --- |
| vorher | 136 | 136 | **157** | 101 | 80 | 61 |
| nachher | 94 | 94 | **117** | 61 | 61 | 61 |

157px bei 390px Breite sind 19% des Fensters für einen Satz. Vier Fassungen wurden gegeneinander
gemessen; die Klammer auf zwei Zeilen (`-webkit-line-clamp`) bringt nichts, was der kurze Text
nicht schon bringt, und bleibt deshalb weg. Zwei Fassungen desselben Hinweises stehen jetzt im
Markup, eine Regel an der 600px-Grenze schaltet — der lange Satz bleibt auf dem Desktop Zeichen
für Zeichen derselbe. Was übrig bleibt, sind zwei Tippreihen zu 44px, und die darf nichts
schrumpfen (Daumen, wie bei M1).

**Die Kürzung allein wäre eine Verschlechterung gewesen.** Mobil-Kopfzeile und Band sind beide
`position: fixed; top: 0` auf `--z-panel` (600), und die Kopfzeile gewann, weil sie später im
Dokument steht. Gemessen bei 390x844 mit `elementsFromPoint` auf der Mitte von „Zum App-Umzug"
(Kasten 237,28,137x44): obenauf lag der klassenlose Flex-Behälter der Mobil-Kopfzeile
(266,10,116x43) — der Knopf war **nicht anklickbar**. Bei 320/360px brach er in die zweite
Bandreihe aus und war frei; dieser Zufall **kippte** durch die Kürzung, weil die zweite Reihe auf
`y 41..85` stieg und damit selbst unter die 64px hohe Kopfzeile geriet (dann war auch der
Schließknopf verdeckt). Das Band weicht deshalb im Mobil-Layout unter die Kopfzeile aus, nicht
umgekehrt: die Mobil-Kopfzeile trägt Suche, Rückgängig, Schnellnotizen, Theme, Layout **und** den
einzigen Mobil-Einstieg ins Kampfprotokoll (U5). Die Höhe kommt aus `setzeMobilKopfHoehe()`
(Glied 6 der Messkette, `--mobile-header-height`), weil die Kopfzeile keine gesetzte Höhe hat; an
derselben Zahl hing die Platzhaltung `.main-content { padding-top }`, die auf verdrahteten 60px
gegen eine 64px hohe Kopfzeile stand.

Die tote Geschwisterregel `.migration-hint-banner ~ .divergence-banner { top: 48px }` aus
U6-R4-01 Punkt (1) blieb davon **unberührt** und damit offen: sie regelt einen Zustand, der im
Betrieb nicht eintritt; die neue Ausweichregel gilt für beide Bänder einzeln. **M3a hat sie
gestrichen** — und dabei gemessen, dass sie, zum Treffen gebracht, genau diese Ausweichregel
geschlagen hätte (gleiche Spezifität (0,2,0), aber später in der Datei).

### Gemessene Wirkung

Mobil-Layout mit stehendem Band, 24 Einträge je Liste, in allen vier Themes gleich:

| Messgröße | 360x740 | 390x844 |
| --- | --- | --- |
| Reservierung für die Leiste | 140 auf **70px** | 140 auf **70px** |
| totes Feld unter der Schale | 94 auf **24px** | 94 auf **24px** |
| Umrahmung (`--view-frame-height`) | 346 auf **238px** | 367 auf **261px** |
| Schalenhöhe | 394 auf **502px** | 477 auf **583px** |
| Listenspalte NSCs | 126 auf **234px** | 209 auf **315px** |
| Listenspalte Truhe | 54 auf **162px** | 137 auf **243px** |
| Listenspalte Begegnungen | 88 auf **200px** | 171 auf **281px** |
| Listenspalte Orte | 201 auf **313px** | 284 auf **394px** |

Die Zahlen 126/54/201 sind dieselben, die weiter oben unter U6-R4-01 Punkt (3) stehen — sie sind
die Höhe der **Listenspalte** (`.npc-master` und Geschwister), nicht die der Schale. Eine
Listenspalte von 54px zeigt bei 74px Eintragshöhe **keinen ganzen Eintrag**; in fünf von acht
gemessenen Zuständen passte kein zweiter hinein. Seitenüberhang bleibt 0, und der letzte von 24
Einträgen ist in allen acht Zuständen per Mausrad erreichbar und unverdeckt (vorher war er in der
Truhe bei 360x740 von `BUTTON.io-btn` verdeckt). Band: beginnt bei 64px (Unterkante der
Mobil-Kopfzeile), endet genau dort, wo der Inhalt anfängt; beide Knöpfe frei.

### Die Zusicherung

`tests/e2e/features/layoutprofil.spec.js`, 28 Fälle, davon **25 vorher rot**. Die drei grünen sind
absichtlich grün und im Kopf als Wächter benannt: die ausdrückliche Wahl überlebt den
Fensterwechsel (beide Richtungen) und im breiten Fenster steht der vollständige Hinweis.
Gescrollt wird nur per `page.mouse.wheel`, und der Radpunkt kommt aus der sichtbaren Mitte der
**Listenspalte**, nicht der Liste: aus der Liste gerechnet lag er bei 54px Spalte und 2049px Liste
weit unter dem Scrollbereich, `.npc-master.scrollTop` blieb 0 von 1927 — eine Unerreichbarkeit vom
Messpunkt, nicht von der App.

### Drei bestehende Proben nachgetragen (Verhaltensänderungen, keine Anpassungen zum Grünwerden)

- `tests/e2e/app.spec.js` „App funktioniert auf Mobile-Größe" prüft auf einem 375px-Fenster jetzt
  das Mobil-Profil samt Mobil-Kopfzeile und Umschalter statt `.app-title` — die Desktop-Kopfzeile
  **ist** dort ausgeblendet, und das ist der erwünschte Zustand.
- `tests/e2e/features/sticky-stapel.spec.js` Fall A erwartete nach dem Großziehen `mobile`. Jetzt
  steht dort `desktop`, und die Versatzkette muss schon **ohne** jeden Schalterklick vollständig
  besetzt sein — die Zusicherung wird stärker. Der leere Mobil-Zustand der drei Glieder und der
  Rückweg per Schalter bleiben beide geprüft.
- `tests/e2e/features/hoehenbudget.spec.js`: der Fall 1440x800 nach 500x800 verlangte als
  **Vorbedingung** einen Bandumbruch bei 500px. Den gibt es dort nicht mehr (61px Einzeiler). Die
  Vorbedingung steht jetzt auf `false`, und 1440x800 nach 360x740 kommt als vierter Fall hinzu
  (gemessen 61 auf 94px), damit sie nicht an einem einzigen Fenster hängt.

### Offen geblieben

- **Die Listenspalte des Bestiars folgt der Schale nicht.** M2b/M2c geben der Schale bei 375x812
  108px zurück (466 auf 574px), und die Liste **schrumpft** dabei: Sichtfeld 400 auf 122px,
  gerenderte Zeilen 13 auf 8. Ursache ist nicht die Schale, sondern `VirtualScroll.create()`
  (`ui/virtual-scroll.js`): es nimmt `container.clientHeight`, sonst `parent.clientHeight - padY`,
  sonst den festen Rückfall **400**. In der Schmalfassung ist `.bestiary-master`
  inhaltsgetrieben (`grid-template-rows: auto`, `overflow-y: visible`), die Messung hängt also an
  der vorigen Messung — ein Fixpunkt ohne Bezug zum verfügbaren Platz. Die 400px vorher waren
  genau dieser Rückfall, keine Messung; mit der größeren Schale greift der zweite Zweig und
  liefert 122px, wo rund 228px frei sind. **Gemessen, dass keine Funktion verlorengeht:** die Liste
  scrollt in allen sechs Zuständen (drei Telefonfenster, vorher und nachher) bis an ihr Ende, das
  letzte Monster liegt im Fenster und ist anklickbar. Der Wert ist auch nachher nicht einheitlich
  (400px bei 360x740, 122 bei 375x812, 127 bei 390x844) — er war nie eine Eigenschaft des
  Entwurfs. Eine saubere Behebung heißt, der geteilten Maschinerie eine echte Platzrechnung zu
  geben; das ist eine Einheit für sich. Sieben Schlüssel der achten Bestiar-Zeile sind dafür im
  schmalen Durchgang von `computed-style-diff.spec.js` benannt ausgenommen (28 auf 35 schmal,
  42 auf **49** gesamt).
- `.event-log-entry { pointer-events: auto }` im **flüchtigen** Modus (aus M1) — unverändert
  offen, zwei Zeilen wert.
- `.qref-fab` überlappt den 56px-Streifen der eingeklappten Leiste (aus M1) — unverändert offen.
- Das Umzugs-Band und `.mobile-header` überlappen sich **nicht** mehr (siehe (c)); der dort
  genannte Grund, warum im Querformat rechnerisch kein Platz für ein Panel neben der offenen
  Leiste bleibt, ist damit um die Bandhöhe entspannt, aber nicht aufgehoben.
- `npm run check` bleibt rot, weil `prettier --check` über den ganzen Baum läuft und der Baum
  (vorbestehend) nicht prettier-konform ist. Unverändert gegenüber `cecfefe`.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/layoutprofil.spec.js   # 28 Faelle
```

---
## M2 Runde 2 — das Querformat gehört noch zum Telefon (2026-10-01, erledigt)

Ein Rückschlag der eigenen Korrektur M2a, vom Prüfbefund gemessen und von mir unabhängig
nachgemessen. M2a ließ das Layoutprofil dem Fenster folgen — und öffnete damit eine Richtung,
die vorher unerreichbar war, weil das Profil nur beim Laden gewählt wurde: **das Drehen ins
Querformat verlässt das Mobil-Profil.**

### Der Befund, nachgemessen

Eigene Messung (Playwright/Chromium, eigenes Bündel, je frisch geladen, 900 ms nach dem Drehen),
am Bündel zu `960b32b`:

| Gerät | hoch → quer | Kopf quer | Mobil-Kopf | Überhang X |
| ------- | ----------------- | ------------ | ---------- | ---------- |
| 390x844 | mobile → DESKTOP | 152px @ 61px | 0px | **184px** |
| 393x852 | mobile → DESKTOP | 152px @ 61px | 0px | **176px** |
| 430x932 | mobile → DESKTOP | 152px @ 61px | 0px | **96px** |
| 360x740 | mobile → mobile | — | 64px | 0px |

Mit dem 61px hohen Umzugs-Band sind das **213 von 390 Bildpunkten** feste Kopf-Möblierung (55 %
des Fensters), **ein** sichtbarer Reiter von 24 — und eine Seite, die seitwärts scrollt.
Zurückdrehen heilte; der zweite Ausweg war der Layout-Schalter, der die Wahl dann aber dauerhaft
festschreibt. 740x360 blieb mobil: **dieselbe Geste, zwei Ergebnisse.**

Ursache: `layoutAusFenster()` entschied allein an `window.innerWidth <= 768`. Die gängige
Telefonklasse ist im Querformat 740..956 Bildpunkte **breit**.

### Die Entscheidung

Die Regel bekommt eine zweite, von der ersten unabhängige Bedingung: **kurze Seite ≤ 480 UND lange
Seite ≤ 1000** ist ein gedrehtes Telefon (`LAYOUT_QUER_KURZE_SEITE`, `LAYOUT_QUER_LANGE_SEITE` in
`ui/layout-profiles.js`). Die Klasse selbst gibt die Zahlen her: im Hochformat 320..448 breit, im
Querformat 568..956.

**Zustandslos, keine Hysterese.** Dieselbe Funktion trägt `loadLayout()` beim Start und
`autoLayoutNachFenster()` am Fensterbeobachter. Eine Hysterese („das Mobil-Profil erst oberhalb von
1000px verlassen") hätte die beiden auseinanderlaufen lassen: ein direkt im Querformat geöffnetes
Telefon bekäme Desktop, ein gedrehtes Mobil — das Ergebnis hinge daran, wie der Spielleiter das
Gerät in der Hand hielt, als er die App öffnete. Jeder Querformat-Fall ist deshalb **doppelt**
geprüft, gezogen und direkt geladen.

**Die Schranke auf der langen Seite ist der Teil, der wehtut.** Der naheliegende Griff
`innerWidth <= 768 || innerHeight <= 500` ist falsch: er zieht jedes flache Desktop-Fenster mit.
Gemessen bleiben **1440x450, 1280x400, 1024x768 und 901x700** Desktop, auf beiden Wegen — vier
Wächter, die vor der Korrektur schon hielten und die eine Übertreibung sofort melden.

### Gemessene Wirkung

Alle vier Geräte, hoch → quer → zurück: durchgehend `mobile`, Mobil-Kopfzeile 64px,
Seitenüberhang X = 0, `--view-frame-height` im Querformat 205px (gemessen, nicht verdrahtet).
`D.settings.layout` bleibt in jedem Schritt leer — der automatische Wechsel schreibt nichts fest.
In allen vier Themes auf den Bildpunkt gleich.

### Die Zusicherung

`tests/e2e/features/layoutprofil.spec.js`, neuer Block **(a2)**, 19 neue Fälle — davon
**10 rot vor der Korrektur** (vier Themes beim Drehen, drei Gerätepaare, drei direkt im Querformat
geladen) und 9 Wächter, die vorher wie nachher halten. Die Datei steht bei **48/48**.

### Mitgemessen, nicht mitbehoben — der offene Punkt

Weil die Korrektur das gedrehte Telefon neu ins Mobil-Profil führt, gehört die Frage dazu, ob das
Mobil-Profil bei **390px Fensterhöhe** trägt. Für Kopf und Fuß ja, für die Listenspalte **nein**:

| erreicht über | Rahmen | Schale | Werkzeugleiste | Liste | letzter von 24 |
| ----------------------- | ------ | ------ | -------------- | ----- | -------------- |
| Drehen (neue Regel) | 205px | 185px | 158px | 15px | nicht erreichbar |
| Layout-Schalter (alt) | 205px | 185px | 158px | 15px | nicht erreichbar |

**Auf den Bildpunkt gleich — vorbestehend, nicht von dieser Korrektur gemacht.** Es ist die
Rechnung selbst: 390px Fenster minus 205px gemessener Möblierung (61 Band + 64 Mobil-Kopf + 56
Streifen + Innenabstand) lassen 185px Schale, und `.section-toolbar` allein braucht 158px davon
(zwei Zeilen Suchfeld/Filter, `min-height: 74px`, `flex: 0 1 auto`). Weil die Schale
`overflow: hidden` führt, scrollt auch die **Seite** nicht (Überhang 0).

**Warum trotzdem mobil.** Im Desktop-Profil ist dieselbe Schale noch kleiner (Rahmen 239px, Schale
151px) **und** es kommen 184px Seitenüberhang sowie eine 152px hohe Kopfzeile mit einem sichtbaren
Reiter von 24 dazu. Mobil ist der strikt bessere der zwei Zustände — nur nicht gut.

**Warum nicht hier behoben.** Die Abhilfe heißt, die Schale in kurzen Fenstern nicht zu kappen
(`height: auto`, die Seite scrollt). Diese Zeile führen **fünf Geschwisterschalen** gemeinsam
(`.loc-view`, `.npc-view`, `.loot-view`, `.enc-view`, `.bestiary-view`), bewacht von
`tests/unit/schalen-aktenlage.test.js`, das genau auf ihrer Gleichheit besteht. Das ist eine
Messung über fünf Ansichten und vier Themes und gehört nicht in dieselbe Runde wie die Profilwahl.
Der Fall „im Querformat trägt die Möblierung, die Liste bleibt eng" hält die **158px** als Schranke
nach oben fest, damit es nicht schlechter wird, ohne aufzufallen.

Aus demselben Grund steht 844x390 **nicht** in der `FENSTER`-Liste des Blocks (b): dessen
Zusicherung lautet „Platz für zwei Einträge", und die hält dort nicht — aus Gründen, die nicht an
der Reservierung des Leistenplatzes liegen.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/layoutprofil.spec.js   # 48 Faelle
```

---

## M3 — Tote Regel, Wächter-Ausnahmen und die Messmatrix (2026-10-01, erledigt)

Drei benannte Restposten aus den Runden davor. Alle drei waren Schulden am **Nachweisnetz**, nicht
am Produkt: eine Regel, die eine Ordnung behauptete, die es nicht gibt; eine Ausnahmeliste, die
über mehrere Wellen hinweg etwas ausnahm; und eine Messmatrix, die die wichtigste Korrektur der
Runde gefunden hat und danach im Scratchpad liegen blieb.

### (a) Die Stapelregel der zwei Kopfbänder ist gestrichen

Schließt **U6-R4-01 Punkt (1)** (die Unterüberschrift „(1) Die Stapelregel für zwei
gleichzeitige Bänder ist tot“ unter `## U6-R2-01` weiter oben — dieselbe Stelle, zwei Namen
in dieser Akte) und den dortigen Nachtrag „bleibt davon unberührt und damit offen".
Die Entscheidung, die dort offen gelassen war („entfernen **oder** die Einfügereihenfolge umdrehen
und die 48px durch `var(--migration-hint-height)` ersetzen"), fiel auf **entfernen** — aus drei
gemessenen Gründen, nicht aus Geschmack. Gemessen am Bündel zu `b256750`, dark, 1440x800 und
390x800, die CSSOM nach dem Wähler und die Bänder nach ihrem berechneten `top` gefragt:

| Zustand | Index Divergenz / Hinweis | Wähler trifft | Divergenz `top` |
| --- | --- | --- | --- |
| Zweig „noch nicht umgezogen" (nur Hinweis) | −1 / 0 | 0 | (kein Band) |
| Zweig „bereits umgezogen" (nur Divergenz) | 0 / −1 | 0 | 0px |
| gestapelt, Hinweis zuerst → dann Divergenz | 0 / 1 | **0** | 0px |
| gestapelt, Divergenz zuerst → dann Hinweis | 1 / 0 | 1 | **48px** |

1. **Der Zustand tritt im Betrieb nicht ein.** Der `file://`-Einstieg verzweigt entweder/oder
   (Zeile 1 und 2). Die einzige Stelle, an der beide Bänder gleichzeitig hängen, liegt synchron
   innerhalb des Umzugs-Starts (Divergenz anlegen, dann Hinweis entfernen) — dazwischen rechnet der
   Browser kein Layout.
2. **Die Dokumentreihenfolge schlägt den Wähler.** Beide Bänder hängen per
   `insertBefore(.., body.firstChild)` ein; das **später** eingehängte steht damit **vor** dem
   früheren. In der Reihenfolge, die der Code erzeugen würde, liegt das Divergenzband auf Index 0
   und der Hinweis auf Index 1 — `~` verlangt das Gegenteil und trifft 0 Elemente (Zeile 3).
3. **Die 48px wären in jeder gemessenen Lage falsch.** Das Hinweisband ist bei 1440 Breite **61px**
   hoch, bei 390 Breite **117px** — nie 48. In der einzigen Reihenfolge, in der der Wähler trifft
   (Zeile 4), setzte er das Divergenzband also 13px (1440) bzw. 69px (390) **in** das Hinweisband
   hinein. Auf Telefonbreite schlimmer: die Regel gewinnt gegen
   `[data-layout="mobile"] .divergence-banner { top: var(--mobile-header-height) }` — gleiche
   Spezifität (0,2,0), aber später in der Datei — und zieht das Band aus dem Ausweichplatz **zurück
   unter die Mobil-Kopfzeile**, genau der Fehler, den M2c behoben hat.

Und ein brauchbares gestapeltes Layout gäbe es auch mit richtiger Zahl nicht:
`body.has-migration-hint` und `body.has-divergence-banner` setzen **beide** `padding-top` auf
`body`, die spätere gewinnt — gemessen 40px Innenabstand für 101px Band. Die eine Regel hat nie ein
Layout hergestellt, das sie hätte retten können.

### (b) Der Stil-Sollstand ist regulär neu erhoben, die Ausnahmeliste ist leer

`EXPECTED_DEVIATION_KEYS` (14) und `EXPECTED_DEVIATION_KEYS_NARROW` (35) in
`tests/e2e/features/computed-style-diff.spec.js` trugen zusammen **49** Schlüssel: Bestiar-
Listenzeilen, die durch die Höhenbudget-Korrektur (U6) und die beiden Platzgewinne aus M2 aus der
Erfassung gefallen waren. Die Datei verlangt selbst, dass ein Eintrag nur für die Dauer genau der
Welle stehen bleibt, die die Änderung herbeiführt. Statt sie weiterzuschleppen: Sollstand neu
erhoben (`UPDATE_STYLE_BASELINE=1`), **schlüsselweise** verglichen, Listen geleert.

| Durchgang | Zugänge | Abgänge | Digest-Änderungen | Elementzahl Bestiar |
| --- | --- | --- | --- | --- |
| standard | 0 | 14 | 0 | 129 → 115 |
| narrow | 0 | 35 | 0 | 115 → 80 |
| reducedMotion | 0 | 14 | 0 | 129 → 115 |

63 Meldungen an **49** verschiedenen Schlüsseln (standard und reducedMotion nennen dieselben 14).
Die Abgänge sind in jedem Durchgang dieselben sieben Signaturen (`button.bestiary-fav`,
`div.bestiary-list-item`, `span.bestiary-badge.srd`, `span.bestiary-cr`, `span.bestiary-name`,
`span.bestiary-type`, `span.sr-only`) für die Zeilen `#13`/`#14` bzw. `#8` bis `#12`. Gegenprobe:
**0** Abgänge außerhalb der Bestiar-Ansicht; die 9 ohne `bestiary` im Klassennamen sind
`span.sr-only#8` bis `#14` aus genau denselben Zeilen. **Kein** Abgang darüber hinaus, **kein**
Zugang, und **null** Digest-Änderungen an gemeinsamen Schlüsseln — an keinem weiterhin erfassten
Element hat sich ein berechneter Wert bewegt. Das war die Behauptung der beiden Listen; sie ist
jetzt geprüft statt geglaubt.

**Weg der Erhebung**, damit es nachvollziehbar bleibt: die Schreibsperre verhindert richtigerweise,
dass ein roter Lauf seinen eigenen Befund festschreibt. Der Sollstand wurde deshalb mit den **noch**
gefüllten Listen und gesetztem Schalter geschrieben, danach die leere Fassung wiederhergestellt und
der Lauf wiederholt — grün, ohne eine einzige Ausnahme. Die Mechanik
(`isExpectedDeviation()` mit dem `durchgang`-Parameter) bleibt stehen; die Listen sind **absichtlich
leer, nicht abwesend**.

### (c) Die Messmatrix läuft in der Suite

`tests/e2e/features/hoehenbudget.spec.js` prüfte bis M3 **alles** bei 1440x800. Die Matrix, mit der
die Korrektur gefunden wurde (rund 2 Minuten), lag nur als Messskript im Scratchpad. Jetzt stehen
**80 der 160** Zustände in der Suite, als 8 Fälle zu je 10 Zuständen (5 Ansichten × oben/gescrollt).
Alle 80 befundfrei: Seitenüberhang 0px, Suchfeld `frei`, App-Titel und globale Suche `frei`, letzter
Eintrag gescrollt erreichbar.

> **Berichtigung (Runde 1).** Hier stand „64 der 128 Zustände … 4 Ansichten" und daneben die
> Behauptung, alle anderen Achsen blieben vollständig — „alle vier Ansichten (vier unabhängige
> `calc(100vh - var(--view-frame-height, ..))`-Deklarationen in drei Stilblättern)". Gezählt sind es
> **fünf** Deklarationen in **vier** Stilblättern (`bestiary.css:25`, `core.css:2276`,
> `encounters.css:932`, `npcs.css:10`, `npcs.css:439`). Die fünfte Schale (Bestiar) lief nicht mit,
> und die Auslassung war als Vollständigkeit ausgewiesen — der schlimmere der beiden Fehler, denn
> eine so ausgewiesene Lücke sucht niemand. Die 128 stammen aus dem Messskript, das ebenfalls nur
> vier Ansichten fuhr; mit der fünften sind es 160. Behoben wurde die **Lücke**, nicht nur die Zahl:
> die Matrix fährt jetzt alle fünf, und `tests/unit/schalen-aktenlage.test.js` hält den Zensus der
> Stilblätter maschinell gegen den Kommentar der Matrix — eine sechste Schale macht beides rot.
> Vorher gemessen (eigenes Skript, dieselben 16 Bestiar-Zustände): Überhang 0px, Suchfeld, App-Titel
> und globale Suche `frei`, Kopfzeile deckt die Leiste 0px in **allen 16**; gescrollt steht der
> letzte gerenderte Eintrag in allen 16 im Fenster und ist anklickbar. Es gab also keine verdeckte
> Regression, nur eine ungedeckte Deklaration.

Die fünfte Schale fährt in zwei Punkten anders, und das steht in `MATRIX_ANSICHTEN` statt in einer
Ausnahmeliste: das Bestiar bringt seine Liste selbst mit (SRD) und rendert sie hinter einer
VirtualScroll-Hülle, weshalb `#bestiary-list` genau **ein** Kind führt (gemessen in allen 16
Zuständen) und `messeBudget()` einen eigenen Einträge-Wähler bekommt — ohne ihn würde die vierte
Zusicherung die Hülle messen und wäre immer grün. Und die Zahl der gerenderten Einträge hängt an
genau der Schalenhöhe, die geprüft wird (gemessen **7 bis 18**), weshalb dort „mindestens einer"
statt der festen 24 gilt.

| Fenster | mit Band (61px) | ohne Band |
| --- | --- | --- |
| 1280x900 | Rahmen 195px | Rahmen 134px |
| 1280x700 | Rahmen 195px | Rahmen 134px |
| 900x900 | Rahmen 233px | Rahmen 172px |
| 900x700 | Rahmen 233px | Rahmen 172px |

**Was weggelassen ist, und warum** — nicht still, sondern im Testkommentar: die Breiten **1920 und
1440**. 1920/1440/1280 lagen am Bündel zu `fef3afb` in allen 96 ihrer Zustände auf demselben Wert
(14px Überhang ohne Band, 75px mit Band); 900 war der Ausreißer (52 / 113) und der schlimmste Fall.
1440 prüfen die fünf Fälle oben in derselben Datei ohnehin in beiden Bandzuständen, und 1920 ist der
dritte Messpunkt desselben Plateaus für ein Viertel der Laufzeit. Das Budget hängt per Konstruktion
an einer **Messung** und nicht an einer Breakpoint-Grenze; eine dritte Probe auf derselben Fläche
kann nichts Neues zeigen. (Die 96 sind die Zustandszahl jener Messung, die vier Ansichten fuhr.)
Alle anderen Achsen bleiben vollständig: beide Fensterhöhen, beide Bandzustände, beide
Scrollzustände, alle **fünf** Ansichten (fünf unabhängige
`calc(100vh - var(--view-frame-height, ..))`-Deklarationen in vier Stilblättern).

**Die Gegenprobe ist der rote Nachweis.** Eine Probe, die seit ihrer Geburt grün ist, beweist
nichts. Der letzte Fall des Abschnitts zwingt `--view-frame-height` auf die alte verdrahtete 120px
zurück und fährt die schlimmste Ecke der Matrix (kleinste Breite × kleinste Höhe ihrer eigenen
Achsen, mit Band, gescrollt — die Zahlen kommen aus `MATRIX_BREITEN`/`MATRIX_HOEHEN`, nicht
verdrahtet). Gemessen bei 900x700:

| | Rahmen | Überhang | Suchfeld | Kopfzeile deckt Leiste | Befunde |
| --- | --- | --- | --- | --- | --- |
| gemessenes Budget | 233px | 0px | frei | 0px | 0 |
| verdrahtete 120px | 120px | **113px** | **verdeckt von `BUTTON.nav-group-btn`** | 103px | 2 |

Die 113px und die Verdeckung durch `BUTTON.nav-group-btn` sind Zeichen für Zeichen die Zahlen, die
der Kopfkommentar der Datei als historischen Befund bei 900 Breite nennt. Der Zwang läuft per
Stilblatt mit `!important`, nicht per Inline-Stil: `setzeRahmenHoehe()` schreibt bei jedem Lauf der
Kette einen neuen Inline-Wert, ein Inline-Zwang wäre beim nächsten `resize` weg. Die
`!important`-Ratsche bleibt unberührt — die zählt die Quelldateien unter `assets/styles/`.

### Ein Befund an der Matrix selbst, im ersten Lauf gemessen

Ungescrollt meldete die vierte Zusicherung (letzter Eintrag erreichbar) in allen 8 Fällen je 4
Befunde — „1280x900 MIT Band oben locations: letzter Eintrag 2148..2222px AUSSERHALB
NICHT-KLICKBAR", einen je Ansicht, 32 insgesamt. **Das ist richtig so:** am Listenanfang liegt der
24. Eintrag legitim unter der Falz. Sie dort zu verlangen hieße zu verlangen, dass die ganze Liste
in die Schale passt, und das verspricht das Höhenbudget nicht; versprochen ist, dass die Liste
**selbst** scrollt und ihr Ende erreichbar **bleibt**. Die Zusicherung gilt deshalb nur im
gescrollten Zustand, mit der Begründung an `befundeAus()` statt nur im Commit. Die drei anderen
Zusicherungen gelten in beiden Zuständen und waren im selben Lauf in beiden grün. (Die Zahlen sind
die des ersten Laufs mit vier Ansichten. Das in Runde 1 nachgezogene Bestiar verhält sich gleich:
ungescrollt liegt sein letzter gerenderter Eintrag in **12 von 16** Zuständen unter der Falz,
gescrollt steht er in allen 16 im Fenster.)

### Gemessene Wirkung

Die Streichung aus (a) ist **nachweislich verhaltensneutral**. Zwei Bündel gebaut (vor und nach der
Streichung) und dieselbe Messung zweimal gefahren: **6 Fenstergrößen × 4 Themes × beide
Bandzweige = 48 Zustände**, je Zustand Bandhöhe, berechnetes `top` beider Bänder,
`body { padding-top }`, `--view-frame-height`, `--sticky-top-header`, Seitenüberhang, Schalenhöhe und
die Trefferzahl des Geschwisterwählers. **Zeilenweise identisch in allen 48 Zuständen**, Wähler
überall 0. Das ist genau das, was die Streichung einer Regel bewirken darf, die nie getroffen hat.

| | 1440x800 | 1280x900 | 900x700 | 390x844 | 360x740 | 740x360 |
| --- | --- | --- | --- | --- | --- | --- |
| Layout | desktop | desktop | desktop | mobile | mobile | mobile |
| Hinweisband (Höhe @ `top`) | 61 @ 0 | 61 @ 0 | 61 @ 0 | 117 @ 64 | 94 @ 64 | 61 @ 64 |
| Divergenzband (Höhe @ `top`) | 40 @ 0 | 40 @ 0 | 40 @ 0 | 40 @ 64 | 40 @ 64 | 40 @ 64 |
| Rahmen mit Hinweis | 195px | 195px | 233px | 261px | 238px | 205px |
| Rahmen mit Divergenz | 174px | 174px | 212px | 184px | 184px | 184px |
| Wähler trifft | 0 | 0 | 0 | 0 | 0 | 0 |

In allen vier Themes auf den Bildpunkt gleich (die Tabelle zeigt `dark`; die anderen drei Spalten
der Messung sind zeilengleich). Die beiden `top`-Werte 0 und 64 sind die Aussage: im Desktop sitzt
das Band am Fensterrand, im Mobil-Layout weicht es unter die 64px hohe Mobil-Kopfzeile aus (M2c) —
und zwar in **beiden** Zweigen gleich, also auch das Divergenzband, das die gestrichene Regel bei
Treffer auf 48px gezogen hätte.

Diese Probe steht auf der Startansicht und misst **Bandgeometrie**, nicht das Höhenbudget der
Schalen; das messen die 80 Zustände aus (c). (b) und (c) fassen keinen Produktionscode an.

### Die Zusicherungen

- `tests/e2e/features/baender-stapel.spec.js` — **4 neue Fälle**, davon **1 vorher rot**. Die drei
  grünen sind absichtlich grün: sie halten die Unerreichbarkeit fest (beide Produktionszweige, der
  erzwungene Stapel samt Dokumentreihenfolge), und ohne sie wäre der vierte eine bloße
  Quelltextprüfung. Der vierte fragt `document.styleSheets` des gebauten Bündels, nicht
  `migration.css` per `grep` — die App läuft gegen das Bündel, in dem alle 20 Stilblätter
  zusammenlaufen. Die Kommaliste jedes Wählers wird dabei einzeln geprüft, sonst meldete die
  M2c-Gruppe `[data-layout="mobile"] .migration-hint-banner, [data-layout="mobile"]
  .divergence-banner` einen Stapelzustand, den sie nicht beschreibt (erst gemessen: 2 Regeln, davon
  1 falsch positiv).
- `tests/e2e/features/hoehenbudget.spec.js` — **9 neue Fälle** (8 Matrix-Fälle à 10 Zustände + die
  Gegenprobe), 25 → **33 Fälle**, Laufzeit 24,5s → **46,9s** (43,3s mit vier Ansichten; die fünfte
  kostet rund 3,6s).
- `tests/unit/schalen-aktenlage.test.js` — **2 neue Fälle** (Runde 1), 2 → **4**: die Deckung der
  Messmatrix über alle fünf Schalen und der Zensus der Stilblätter gegen den Kommentar der Matrix.
- `tests/e2e/features/computed-style-diff.spec.js` — keine neuen Fälle, aber die drei bestehenden
  bewachen wieder 49 Schlüssel mehr.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/baender-stapel.spec.js        # 4 Faelle
npx playwright test tests/e2e/features/hoehenbudget.spec.js          # 33 Faelle
npx playwright test tests/e2e/features/computed-style-diff.spec.js   # 3 Faelle, seriell
```

### Offen geblieben

- **Die Listenspalte des Bestiars folgt der Schale nicht** — unverändert offen aus M2, und durch (b)
  jetzt auch im Stil-Sollstand sichtbar: die Elementzahl der Bestiar-Ansicht sinkt 129 → 115
  (breit) und 115 → 80 (schmal), weil die Platzrechnung der geteilten Scroll-Maschinerie
  (`container.clientHeight`, sonst `parent.clientHeight - padY`, sonst fester Rückfall 400) bei
  **größerer** Schale **weniger** Zeilen rendert. Der Sollstand bildet diesen Istzustand ab, er
  rechtfertigt ihn nicht. Eigene Einheit.
- **`.event-log-entry { pointer-events: auto }`** gilt auch im flüchtigen Modus — unverändert offen
  aus M1, zwei Zeilen wert. Ändert Desktop-Verhalten, deshalb weiter außerhalb des gemessenen
  Netzes.
- **`.qref-fab` überlappt den 56px-Streifen der eingeklappten Leiste** — unverändert offen aus M1.
  Saubere Behebung: `--mobile-nav-rest` auch von ihrem `bottom` abziehen.
- **Sehr kurze Fenster** (U6-R4-01 Punkt 3) — unverändert offen; M2 entspannt den Fall, hebt ihn
  nicht auf. Die Matrix aus (c) deckt ihn **nicht** ab: ihre kleinste Fensterhöhe ist 700px. Das ist
  Absicht und keine Lücke — ein Fall, dessen Zusicherung noch nicht entschieden ist, kann nicht
  bewacht werden.
- **`npm run check` bleibt rot**, weil `prettier --check` über den ganzen Baum läuft und der Baum
  vorbestehend nicht prettier-konform ist. Unverändert. Die drei in dieser Runde angefassten
  Testdateien sind einzeln prettier-konform; `assets/styles/migration.css` war es schon vorher
  nicht und bleibt unformatiert, damit die Streichung nicht in einer Umformatierung der ganzen Datei
  verschwindet.

---

## M-Abnahme — die Mobil-Runde nachgefahren (2026-10-01)

Abnahme der drei Einheiten M1/M2/M3. **Kein Befund am Produkt** — alle Tore stehen, und jede der
vier Behauptungen aus M1/M2 hält der eigenen Nachmessung stand. Was diese Runde beiträgt, ist
Nachweisnetz: eine fehlende Gegenprobe und das Bildmaterial für das menschliche Urteil.

### Die Tore, gegen die Basiswerte aufgerechnet

Die Basiswerte des Auftrags stammen von `cecfefe` — also von **vor** M1/M2/M3. Jede Abweichung ist
deshalb auseinandergerechnet statt als Fehler gemeldet:

| Tor | Basiswert (cecfefe) | gemessen (HEAD) | Differenz |
| --- | --- | --- | --- |
| Jest | 1908 in 75 Suiten | **1910 in 75 Suiten** | +2 aus M3 (`schalen-aktenlage.test.js` 2 → 4) |
| Playwright | 444 / 19 übersprungen / 0 | **528 / 23 / 0** | +84 bestanden, +4 übersprungen — siehe unten |
| pytest | 30 | **30** | — (`python -m pytest tests/build/`; ohne Pfad sammelt pytest nichts) |
| Lint | exit 0, exakt 363 Warnungen | **exit 0, 363** | — |
| Builds | beide exit 0 | **beide exit 0** | — |
| typecheck / :strict | exit 0 | **beide exit 0** | — |
| `check-f18-kaskade --check` | OK | **OK, 126 Abhängigkeiten, 8509 Elemente** | — |
| `sync-aktenlage-anker --check` | 0 Abweichungen, 123 Anker | **0 / 123** | — |

Die 84 zusätzlich bestandenen Playwright-Fälle: `layoutprofil.spec.js` **48** (neu, M2),
`mobil-navigation.spec.js` **21** (20 neu aus M1 + **1 aus dieser Runde**), `baender-stapel.spec.js`
**4** (neu, M3), `hoehenbudget.spec.js` 23 → **33** (+10 aus M3). Die 4 zusätzlich übersprungenen
sind `mobil-screens.spec.js` aus dieser Runde — dieselbe Bauart wie die vier vorhandenen
Ablichtungs-Dateien, die zusammen mit 2 PWA-Fällen und 1 Service-Worker-Fall die bisherigen 19
ausmachen.

**Ratschen.** Dubletten **0**, `!important` **105** (kommentarfrei gezählt wie die Ratsche; roh 108,
die Differenz sind drei Erwähnungen in Kommentaren), Inline-Stile **256**. Keine gestiegen. Als
nackte Zahl kommt `z-index` nur mit **2** und **10** vor, beide unter der Schranke 20.

**Eine erklärungsbedürftige Abweichung vom Auftragstext.** Der Auftrag nennt „42 benannte Ausnahmen
in `EXPECTED_DEVIATION_KEYS` (14 breit + 28 schmal)". An HEAD sind **beide Listen leer**. Das ist
kein Verlust, sondern `ab16e43`: der Stil-Sollstand wurde regulär neu erhoben und schlüsselweise
verglichen — 0 Zugänge, 63 Abgänge an 49 Schlüsseln, **0 Digest-Änderungen** in allen drei
Durchgängen, alle Abgänge in der Bestiar-Ansicht. Die Ausnahmen mussten danach nicht mehr geführt
werden. Der Auftragstext beschreibt den Stand von `cecfefe`.

### Was ich selbst gefahren bin, mit eigenen Skripten und echten Klicks

Alle Messungen: gebautes Bündel per `file://`, Umzugs-Band **nicht** unterdrückt, Klicks mit der
Maus auf gemessene Koordinaten, Scrollen nur per Mausrad. Kein `scrollTop`, kein `scrollIntoView`.

**(a) Alle 24 Ansichten, und jede führt wirklich in ihre Ansicht.** Geprüft wird nicht nur
`elementFromPoint`, sondern nach jedem Klick `section.view.active` gegen `view-<name>`.

| Zustand | 360x740 | 390x844 | 740x360 | 320x700 |
| --- | --- | --- | --- | --- |
| schlicht, vier Themes | **24/24**, 0 Radrunden | **24/24**, 0 | **24/24**, max 2 | — |
| voll (Dauer-Log mit 8 Einträgen, Kampfprotokoll offen, Würfel-Schweber, Schnellreferenz) | **24/24**, 0 | **24/24**, 0 | **24/24**, max 2 | **24/24**, 0 |

Der volle Zustand ist die Zeile, auf die es ankommt: dort meldete M1 vorher **6 von 24** (390x844)
und **0 von 24** (360x740, das Kampfprotokoll lag auf der Umschalter-Zeile). 16 Zustände, alle
24/24.

**(b) Die Messung misst wirklich etwas.** Gegenprobe mit dem erzwungenen Deckel von vor M1
(`--mobile-nav-max-height: 300px`): Sichtfeld 444px → **300px**, Rasterinhalt unverändert 444px,
sofort erreichbar 24 → **20**. Diese Gegenprobe steht jetzt fest in `mobil-navigation.spec.js`
(siehe unten).

**(c) Das Desktop-Layout ist unverändert** — die fünf Funde der Vorrunde einzeln nachgefahren, bei
1440x900, 1280x800 und 1000x800 in allen vier Themes (**12 Zustände, 0 rot**):

| Fund | gemessen |
| --- | --- |
| F1 Ereignis-Dialog | Karte 500x438px sichtbar, Klassen `modal-overlay modal-transient show`, 6 Felder, **0** ragen über die Karte |
| F2 Listen | 24/24 gerendert in Orten, NSCs, Truhe, Begegnungen; der **letzte** Eintrag nach 60 Radstößen in allen 12 Zuständen erreichbar |
| F3 Initiative mit Menü | gescrollt (scrollY 582/682/770), **6** Menüs, **23/23** Einträge erreichbar, kein Verdecker |
| F4 Kampfprotokoll | 6 echte Klicks ohne `force`, 0 Klickfehler, flüchtiges Log nach 3000 ms **leer**, Panel sichtbar, **6 Angriffszeilen**, der zweite wörtlich nachlesbar |
| F5 Werkzeugleiste frei | Seitenüberhang **0** in allen 12 Zuständen, Suchfeld in Orten/NSCs/Truhe **klickbar** |

F4 zusätzlich bei 390x844 nachgefahren: ebenfalls 6 Angriffszeilen, zweiter lesbar.

**(d) Das Layoutprofil folgt dem Fenster** (M2a), ohne Eingriff nachgemessen: frisch geladen
`desktop` bei 1440x900 und 1000x800, `mobile` bei 740x360, 390x844, 360x740 und 320x700; beim
Verkleinern **und** Vergrößern folgt es in beide Richtungen; `D.settings.layout` bleibt dabei
durchweg `null` — der automatische Wechsel schreibt nichts. Nach ausdrücklichem `setLayout('desktop')`
bleibt das Profil `desktop`, auch bei 390x844 und 360x740, und `D.settings.layout` steht auf
`desktop`. Beides wie behauptet.

### Was neu dazugekommen ist

- **`tests/e2e/features/mobil-navigation.spec.js`** — **1 neuer Fall**, 20 → **21**: die permanente
  Gegenprobe zum Deckel. Sie stellt den Zustand vor M1 wirklich her (Zwang auf
  `--mobile-nav-max-height` per Stilblatt mit `!important`, nicht per Inline-Stil — die Kette
  schreibt den Inline-Wert bei jedem Lauf neu) und besteht aus einer Vorbedingung und dem Befund.
  Ohne Vorbedingung wäre sie eine Probe, die einen vorbestehenden Fehler als Erfolg verbucht.
  Der rote Nachweis steht in `1937a88`: ohne den Zwang ist der „verdrahtete" Durchgang mit dem
  gemessenen identisch (444px / 24-von-24), der Lauf fällt an `Expected: 300 / Received: 444`.
- **`tests/e2e/features/mobil-screens.spec.js`** — **4 neue, standardmäßig übersprungene Fälle**.
  Mit `MOBIL_SCREENS=1`: 3 Zustände (ausgefahrene Leiste, Ortsliste ganz unten, laufende Initiative)
  x 2 Fenster x 4 Themes = **24 Bilder** nach `tests/e2e/__screens__/mobil/`, keines 0 Byte. Sie
  prüft **nichts am Aussehen** — sie fällt durch, wenn ein Zustand sich nicht herstellen lässt.
  Der erste Lauf war genau daran rot (4 von 6 bei dark); Ursache war die Hülle, nicht die
  Anwendung.

### Befehle

```bash
PYTHONIOENCODING=utf-8 python build.py
npx playwright test tests/e2e/features/mobil-navigation.spec.js       # 21 Faelle
MOBIL_SCREENS=1 npx playwright test tests/e2e/features/mobil-screens.spec.js   # 4 Faelle, 24 Bilder
python -m pytest tests/build/                                          # 30 Faelle
```

### Offen geblieben

- **NEU UND SCHWER: die Start-Ansicht scrollt auf dem Telefon seitwärts.** Gefunden in dieser
  Abnahme, **nicht** von M1/M2/M3 verursacht (`assets/styles/dashboard.css` wurde in keiner der
  drei Einheiten angefasst) und von keiner Zusicherung gedeckt — die waagerechte Achse ist bisher
  nur an der Navigationsleiste gemessen (M1 Runde 2), nicht am Seiteninhalt.

  **Ursache, isoliert:** `.dash { display: grid }` (dashboard.css:823) gibt **keine**
  `grid-template-columns` an. Die einzige implizite Spalte wird dadurch `auto` dimensioniert, also
  auf ihre **max-content**-Breite — und die ist durch `.dash-party-grid { max-width: 720px }` mit
  `repeat(auto-fill, minmax(160px, 1fr))` konstant **710px**, unabhängig vom Fenster. Der
  Rasterbehälter ist 340px breit, seine Inhalte sind 710px breit.

  | Fenster | Seitenüberhang X | `.dash`-Spalte | `.dash-party` | Karten je Reihe |
  | --- | --- | --- | --- | --- |
  | 320x700 | **416px** | 710px | 710px | 4 (angeschnitten) |
  | 360x740 | **376px** | 710px | 710px | 4 (angeschnitten) |
  | 390x844 | **346px** | 710px | 710px | 4 (angeschnitten) |
  | 740x360 | 0px | 710px | 710px | 4 |

  **Gegenprobe, die die Ursache belegt:** mit erzwungenem
  `.dash { grid-template-columns: minmax(0, 1fr) }` fällt der Überhang in allen drei
  Telefonfenstern auf **0**, die Spalte auf 268/308/338px, und die Partykarten brechen auf **eine je
  Reihe** um.

  **Hier NICHT behoben**, weil es eine Abnahmerunde ist: die Korrektur ändert die Dashboard-Lage in
  allen vier Themes und braucht eine eigene Messmatrix plus die Entscheidung, ob eine Karte je Reihe
  bei 320-390px gewollt ist oder `minmax(140px, 1fr)` mit zwei je Reihe. Eigene Einheit — aber die
  dringendste: die Start-Ansicht ist das Erste, was der Spielleiter auf dem Telefon sieht.
- **`.qref-fab` liegt auf dem 56px-Streifen der eingeklappten Leiste** — unverändert offen aus M1,
  jetzt beziffert: gemessen **2250 px² Deckung** bei 360x740, 390x844 und 320x700, **1750 px²** bei
  740x360. Die **Mitte** der Umschalter-Zeile bleibt in allen vier Fenstern frei, die Navigation
  funktioniert also — aber ein Daumen, der die rechte Seite des Streifens trifft, öffnet die
  Schnellreferenz statt der Leiste. Saubere Behebung bleibt: `--mobile-nav-rest` auch von ihrem
  `bottom` abziehen.
- **`.event-log-entry { pointer-events: auto }`** gilt auch im flüchtigen Modus — unverändert offen
  aus M1. In dieser Runde zusätzlich am Desktop gesehen: beim Radeln über die Initiative antwortete
  `elementFromPoint` an einzelnen Rollständen mit `div.event-log-time` (1100x800 und 1000x800).
  Folgenlos, weil das Ziel einen Rollstand später frei liegt — aber derselbe Befund, eine
  Vierteldrehung weiter.
- **Kein `scroll-margin-top` im ganzen Stilbaum**, bei zwölf `scrollIntoView`-Aufrufen im Quellbaum
  und drei angehefteten Leisten darüber. Gemessen: nach `scrollIntoViewIfNeeded()` auf die Mob-Zeile
  der Initiative antwortet `elementFromPoint` auf der Mitte des Angriffsknopfs ab **1100px Breite
  abwärts** mit `span.qa-name` (der Aktionsleiste), bei 1440 und 1280 nicht. Ein Mausrad-Durchlauf
  erreicht den Knopf an jeder Breite (Rollstand 0 / 60 / 240 / 240 / 180) — der Knopf ist also
  **nicht unerreichbar**, er landet nur dort, wo eine Leiste klebt. **Nicht zu Ende untersucht:**
  der eine Aufruf mit `block: 'start'` (das Sitzungsformular) ließ sich nicht messen, weil das
  Formular im Ruhezustand 0px hoch ist. Eigene Einheit, kein Rückschritt dieser Runde.
- **Die Listenspalte des Bestiars folgt der Schale nicht** — unverändert offen aus M2/M3.
- **Sehr kurze Fenster** (U6-R4-01 Punkt 3) — unverändert offen.
- **`npm run check` bleibt rot**, weil `prettier --check` über den ganzen Baum läuft und der Baum
  vorbestehend nicht prettier-konform ist. Die beiden in dieser Runde angefassten Testdateien sind
  einzeln prettier-konform (`npx prettier --check` je Datei).
- **Der Verlaufsstreifen der Würfelansicht hat keine Anordnung** — gefunden in C2 (2026-10-02) von
  der Sonde, die ungestaltete Formularelemente aufspürt. `.dice-history-bar`,
  `.dice-history-label` und `.dice-history-scroll` stehen einmal im Markup
  (`assets/templates/view-tools.html:233`) und haben im ganzen Stilbaum **keine einzige Regel**;
  die drei Kinder stehen deshalb untereinander statt nebeneinander, obwohl die Schwesterleiste
  `.dice-favorites-bar` direkt darüber eine vollständige Karte ist (dice.css:374). Der vierte
  Teil, `.dice-history-clear`, ist in C2 behoben — er stand als **graues Systemblech** da
  (rgb(107,107,107) Fläche, rgb(255,255,255) Rahmen, 13.3333px aus `font:
  -webkit-small-control`) und war damit plattformabhängig; er trägt jetzt die Gestalt von
  `.search-clear-btn`. **Bewusst zurückhaltend**, weil die Anordnung des Streifens ein eigener,
  älterer Befund ist: ein runder 32px-Knopf wie `.dice-fav-add` wäre ein neuer Blickfang an einer
  Stelle ohne Anordnung gewesen. Saubere Behebung: `.dice-history-bar` an den Selektorblock von
  `.dice-favorites-bar` hängen (keine Dublette, F-18), `.dice-history-scroll` an den von
  `.dice-fav-list` plus `flex-wrap: nowrap; overflow-x: auto` — der Streifen ist laut
  Markup-Kommentar als waagerechter Rollstreifen gedacht.

---

## W5-A — Vorlauf der Welle 5: Grundlinie eingefroren, zwei Ratschen rot bewiesen, Tokens als Nulleingriff (2026-10-05)

**Status: ERLEDIGT.** Erste Einheit der Welle 5 (Schrift). Drei Commits, kein einziger
Umbau einer bestehenden Deklaration — der Vorlauf legt die Messmittel und die Schranken,
gegen die die Schritte 3 bis 8 gefahren werden.

### Was entstanden ist

- `tools/typo-baseline.js` — das Grundlinienwerkzeug. Erhebt am gebauten Bündel auf
  **gefüllter** Kampagne (`seedPopulatedSession`) alle 24 Ansichten plus vier
  Rahmenbereiche, in **drei Zuständen** (Ruhelage · aufgeklappte Formulare,
  Schnellreferenz, Würfelpaneel · Editor-Menüs und Mob-Modus), in vier Themes bei 1440 px
  und in Dark bei 375 px, und berichtet je Element **fünf** Felder: Größe, Gewicht,
  Zeilenhöhe, Sichtbarkeit und eigener Textknoten.
  `--diff` stellt zwei Erhebungen in **Bildpunkten** gegenüber und nennt jede Änderung
  über 2 px einzeln. Das Abnahmekriterium des Handoffs fragt nach Bildpunkten; der
  Stil-Sollstand kennt nur Hashwerte und kann die Frage nicht beantworten.
- `tests/unit/typo-baseline.test.js` — 25 Fälle am Werkzeug selbst. Es trägt die Abnahme
  der ganzen Welle und war bis dahin unbewacht; die zwei Befunde, die das gekostet hat,
  stehen unten unter „Zwei Befunde am Werkzeug".
- `W5-R-05` und `W5-R-06` in `tests/unit/design-consistency.test.js` — vier Schranken,
  die nur sinken dürfen, dazu sechs bzw. vier Proben an den Ratschen selbst.

### Die Zahlen, gemessen und zweifach gerechnet

Beide Ratschen zählen mit einem klammerzählenden CSS-Leser; eine Selbstprobe rechnet
dieselbe Menge mit dem Deklarations-Regex des Handoffs gegen und verlangt dieselbe Zahl.

| Schranke | Ausgangswert | Ziel |
| --- | --- | --- |
| W5-R-05a font-size außerhalb der Skala | **839** Befunde von 853 Deklarationen (5 geduldet, 9 schon richtig) | 0 |
| W5-R-05b font-size in `em` | **603** in 28 verschiedenen Werten | 0 |
| W5-R-05c SVG-Attribut `font-size="…"` im JS | **3** (dice-stats-render.js, Zeilen 194/210/213) | 0 |
| W5-R-06 font-weight außerhalb 400/500/600 | **95** von 360 Deklarationen | 0 |

Roter Nachweis in eigenem Commit, mit Schranke 0: `4 failed, 265 passed`. Alle Selbst-,
Gegen- und Verwesungsproben waren dabei **grün** — die vier roten Zusicherungen sind der
Befund, nicht ein Fehler im Werkzeug.

**Zwei Zahlen des Handoffs sind falsch** und hier richtiggestellt: `em`-Deklarationen
**603**, nicht 784; umzustellende Gewichte **95**, nicht 110 (der Handoff zählt die 10
`@font-face`-Gewichte aus `fonts.css` und die 6 schon richtigen `400` mit).
Ebenso: `line-height` hat im Geltungsbereich der Ratschen **66** Deklarationen in **10**
Werten, nicht 67 in 11 — die 67 der Vermessung schließen `variables.css` mit ein.

### Die neun Tokens bewegen nichts, und das ist gemessen

Der Aliasblock in `assets/styles/variables.css` führt jetzt `--text-md` 14 · `--text-lg`
16 · `--text-xl` 20 · `--text-2xl` 26 · `--text-3xl` 34 · `--text-hero` 72 px und
`--leading-tight` 1.2 · `--leading-snug` 1.35 · `--leading-normal` 1.5. `--text-xs` (11)
und `--text-sm` (12) sind unberührt. Ein Token ohne Leser darf nichts ändern, und diese
Messung ist die Probe darauf, dass der Block an der richtigen Stelle steht:

- Leser-Kontrolle: **0** Fundstellen der neun Tokens im ganzen Baum außer der Definition.
- `tools/typo-baseline.js`, Erhebung vor und nach dem Commit, dieselbe Browser-Fassung:
  5 Läufe, **22155** verglichene Schlüssel, **0** Größen-, **0** Gewichts-, **0**
  Zeilenhöhen-Abweichung, Spanne **0 px**, kein Schlüssel nur auf einer Seite.
- Stil-Sollstand `tests/e2e/features/computed-style-diff.spec.js`: **4 passed**, also
  null bewegte Digests — einschließlich des Laufs „Breitere Schriftmetrik bewegt den
  Digest nicht".
- Linux-Nachstellung (Verdana, Faktor 1,155): identische Ausgabe vor und nach dem
  Commit, nachgefahren mit einem Kontrolllauf gegen das Bündel aus dem Vorgänger-Stand.

Im bestehenden Kommentar stand „die drei fehlenden Sprossen (`--text-md`, `--text-lg`,
`--text-xl`)". Gemessen fehlten **sechs** — `2xl`, `3xl` und `hero` waren vergessen. Der
Satz ist berichtigt.

### Zwei Befunde am Werkzeug, in der Prüfrunde W5-A gefunden und behoben

Das Grundlinienwerkzeug stand in der Rolle des Abnahmetors und war selbst ungeprüft. Zwei
Löcher, beide eigenhändig nachgemessen und beide vor der Behebung rot bewiesen:

**(1) Die geschriebene Grundlinie verlor zwei von fünf Feldern.** `erhebeImBrowser()` erhob
Sichtbarkeit (`sb`) und eigenen Textknoten (`txt`) — mit einem Kommentar, der sie „den
Unterschied zwischen einem Befund und einem Fehlalarm" nennt — und das Schreiben warf sie
weg. Eigener Lauf `--nur dark-375`: 5552 Einträge, alle Tupelbreite 3, Index 3 und 4
`undefined`. Damit war die Frage, die D-06 überhaupt stellt, aus der Grundlinie **nicht
beantwortbar**. Dazu standen zwei Summen kommentarlos nebeneinander, die über **dieselbe
DOM-Menge mit zwei verschiedenen Filtern** rechnen: `unterGrenzeSichtbar` (375 px: 107) und
`unterGrenzeMitText` (375 px: 229) — die naheliegende Lesart „107 sichtbar, davon 229 mit
Text" ist arithmetisch unmöglich. Die Kopfzahl der Konsole war `unterGrenzeDom` (249), also
die größte der drei.

Jetzt: `tupel()` und `TUPEL_BREITE = 5` als benannte, exportierte Stelle, `tupelBreite` im
Kopf jeder Datei, und `kennzahlen()` weist vier Zahlen aus, jede mit ihrer Bezugsmenge im
Kommentar. **Am 375-px-Lauf gemessen und aus der Datei selbst nachgerechnet: 249 unter
11 px im Baum, davon 107 sichtbar, davon 95 mit eigenem Textknoten.** In der Ruhelage
(1440 px) sind es 153 / 53 / 49 — die 53 und 49 sind unabhängig gegengerechnet.

Rückwärtsverträglich: alle vorher erhobenen Dateien führen Tupelbreite 3, auch die
eingefrorene Grundlinie der Vermessung in allen fünf Läufen. `vergleiche()` urteilt über
Sichtbarkeit nur, wenn **beide** Seiten die Flaggen führen. Nachgewiesen: 3-Tupel gegen
5-Tupel desselben Standes ergibt 5552 verglichene Schlüssel, **0** Sichtbarkeitswechsel,
Exit 0; gegen die eingefrorene Grundlinie 3637 gemeinsame Schlüssel und 0 Abweichung in
allen vier Eigenschaften.

**(2) Der Rückgabewert von `--diff` beurteilte nur die Größe.** Fünf eigene Eingaben,
Rückgabewerte unmaskiert gemessen (vorher → nachher):

| Eingabe | vorher | nachher |
| --- | --- | --- |
| kein gemeinsamer Schlüssel, beide Seiten voll | **0**, „OK" | 1 (leerer Vergleich) |
| jedes Gewicht **und** jede Zeilenhöhe gesprungen | **0**, „OK" | 1 (4 Befunde) |
| der Lauf fehlt in der neuen Datei | **0**, „OK" | 1 (einseitiger Lauf) |
| 2000 von 2500 Schlüsseln fehlen | **0**, „OK" | 0, aber in der Schlusszeile beziffert |
| Kontrolle: Größe +6 px | 1 | 1 |

`befunde` bildet sich jetzt aus sechs Zählern: Größen-Überschreitung, Gewichts-,
Zeilenhöhen- und Sichtbarkeitswechsel an gemeinsamen Schlüsseln, leerer Vergleich und
einseitiger Lauf — dazu ein nicht hergestellter Zustand (`offen=false` im Protokoll). Jeder
Wechsel wird bis 20 Stück **einzeln** genannt, nicht nur summiert; dieselbe Begründung, mit
der die Größen-Überschreitungen schon einzeln standen.

Zwei Dinge bleiben **bewusst** außerhalb des Urteils und stehen dafür in der Schlusszeile
unter „NICHT im Urteil":

- **Einseitige Schlüssel.** Die Schlüsselform trägt einen laufenden Index; eine nachladende
  Liste mit einer Zeile mehr verschiebt alle folgenden. Im Bestand gemessen sind das 1915
  bzw. 28 Schlüssel — ein Tor, das daran immer rot ist, wird abgeschaltet und schützt danach
  nichts mehr. `--schluessel-streng` nimmt sie auf Verlangen auf.
- **„kein Umschalter gefunden"** — siehe den eigenen offenen Punkt unten.

`--egal gewicht,zeilenhoehe,sichtbarkeit` nimmt eine Eigenschaft aus dem Urteil und
berichtet sie weiter. Schritt 6 stellt 95 Gewichte **absichtlich** um; ohne diesen Ausweg
wäre der Rückgabewert dort zwangsläufig 1 und das Tor wertlos. Ein unbekannter Wert bricht
mit 2 ab statt still zu wirken.

Die Schlusszeile nennt jede geprüfte Eigenschaft namentlich. „OK — keine Änderung über
2 px" klang wie „nichts hat sich bewegt" und bedeutete „die Größe hat sich nicht bewegt".

Wiederholbarkeitsprobe nach der Änderung erneut gefahren: zwei Läufe `dark-375`
byte-identisch (SHA-256 `23616bad092b530b`).

### Offen geblieben

- **DIE ZWEI OBERSTEN SPROSSEN SIND NOCH NICHT ENTSCHIEDEN — 54 sichtbare Elemente in 26
  Selektorgruppen springen über 2 px, 10 davon ungedeckt.** Eigene Rechnung auf gefüllter
  Kampagne gegen die Skala 11/12/14/16/20/26/34/72, jedes **sichtbare** Element auf die
  nächste Sprosse gezogen: dark-1440 (alle drei Zustände) **54 Elemente in 26
  Selektorgruppen** über 2 px, dark-375 **51 in 24**, die reine Ruhelage **46 in 18**.
  Gedeckt sind 44:
    - **E-4, 25 Elemente:** 21× SVG-`<text>` der Würfelstatistik 8 → 11 (+3), 4× `.slot-pip`
      8 → 11 (+3; 18-px-Kreise, `txt=0` gemessen, also ohne Textinhalt).
    - **E-3, 19 Elemente:** 5× `.empty-state-icon` 56 → 72 (+16); 6× die
      `*-empty-icon`-Reihe (loot, enc, enc-detail, rt, bestiary-detail) 48 → 34 (-14);
      `.cf-avatar-placeholder` 40 → 34 (-6); `.dash-char-avatar` und `.loc-detail-icon`
      28,8 → 26 (-2,8); `.loc-item-icon` und `.npc-item-avatar` 22,4 → 20 (-2,4); dazu die
      drei Emoji-Knöpfe `.dice-roll-btn` (🎲) und `.timer-ctrl-btn` (▶️ ↺) 22,4 → 20.
  
  **Nicht gedeckt, 10 Elemente in 5 Gruppen — ihre namentliche Freigabe steht aus:**

  | Stelle | heute | Ziel | Delta | Anzahl |
  | --- | --- | --- | --- | --- |
  | `div.dice-hero-result` (5em) | **80 px** | 72 | **-8** | 1 |
  | `div.timer-hero-time` (3em) | **48 px** | 34 | **-14** | 1 |
  | `div.fdp-number#fdp-result` (3em) | **48 px** | 34 | **-14** | 1 |
  | `div.dms-dice-result` (1,4em) | 22,4 px | 20 | -2,4 | 1 |
  | `input.attr-input` (1,4em) | 22,4 px | 20 | -2,4 | 6 |

  Alle fünf tragen Text, den jemand liest — keine Emoji, keine Dekoration. Der Kommentar
  bei `assets/styles/variables.css` (Sprossen `3xl` und `hero`) nennt jetzt je Sprosse den
  gemessenen Ausgangswert und das Delta und sagt ausdrücklich, dass die Zuordnung **offen**
  ist; vorher las er sich unter der Überschrift „DIE SKALA IST JETZT VOLLSTÄNDIG" wie
  abgeschlossen und erwähnte die 80 px nur, um zu begründen, warum `hero` nicht 34 ist.
  Zwei Wege: die Sprünge namentlich freigeben, oder `--text-hero: 80px` setzen und eine
  Sprosse 48 für `.timer-hero-time` und `.fdp-number` ergänzen. Das ist eine
  Gestaltungsentscheidung und gehört vor Schritt 4.

  **Messgenauigkeit, die man kennen muss:** `input.attr-input` wird mit `txt=0` gemessen.
  Der Wert eines `<input>` ist kein Kindtextknoten — die `txt`-Flagge ist für Formularfelder
  also kein Lesbarkeitssignal. Für `<input>` entscheidet die Sichtbarkeit allein.

- **9 der 12 Einträge in `FORMULARE` haben gar keinen Umschalter im Markup.** Nachgemessen
  am 2026-10-05: `data-action="toggle-collapse"` existiert in den Templates nur für
  `char-form`, `enc-form` und `session-form`. Die neun übrigen (`npc-form`, `loc-form`,
  `quest-form`, `loot-form`, `wiki-form`, `link-form`, `spell-form`, `shop-form`,
  `init-form`) melden pro Lauf „kein Umschalter gefunden" — der Zustand „offen" ist für sie
  also **leer erhoben**, und zwar ohne dass irgendetwas fehlschlägt. Das Protokoll sagt es
  seit je, nur hat es niemand gezählt; jetzt steht die Zahl in der Schlusszeile von
  `--diff`. Bewusst **nicht** im Rückgabewert: es ist eine Lücke der Erhebungsbreite, kein
  Urteil über verglichene Werte, und ein Tor, das daran rot ist, bliebe es bis zur Behebung.
  Zu klären ist, ob diese Formulare über einen anderen Weg aufgehen (dann gehört der Weg in
  `erhebeZustandOffen()`) oder ob die Einträge aus `FORMULARE` müssen. **Solange das offen
  ist, deckt der Zustand „offen" weniger ab, als sein Name verspricht.**

- **DIE GEBÜNDELTEN SCHRIFTDATEIEN SIND DAS FALSCHE TEILSTÜCK — eigene Reparatur,
  ausdrücklich NICHT Teil der Welle 5.** Alle zehn `woff2` unter `assets/fonts/` sind
  `cyrillic-ext` bzw. `devanagari`; keine enthält einen lateinischen Kleinbuchstaben,
  eine Ziffer oder einen Umlaut. Inter deckt aus dem lateinischen Alphabet genau drei
  Zeichen ab: Leerzeichen, A und Ä. Ursache: `tools/fetch-fonts.py` nahm die erste
  `woff2`-URL der Google-Antwort, und das ist `cyrillic-ext`; der Skript-Fix (WR-12) ist
  da, aber niemand hat das Skript danach laufen lassen — `git diff` über `assets/fonts/`
  seit dem einzigen Commit dieser Dateien ist leer. Folge: die Welle 5 fährt **ohne
  Schriftwechsel**, Segoe UI bleibt. Die Umkehrkosten sind eine Zeile
  (`--font-ui` wird genau einmal deklariert und genau einmal gelesen, testbewacht durch
  F-05 mit `expect(uiDecls).toBe(1)`), die Entscheidung ist also nach der Reparatur in
  einem Einzeiler nachholbar.
- **„Gebündelt" kommt im `file://`-Betrieb gar nicht an** — derselbe Komplex, eigener
  Punkt. `build.py` schreibt `url('../fonts/` auf `url('./assets/fonts/` um, also
  relative Nachbardateien statt `data:`-URI. Das Bündel allein in einen leeren Ordner
  kopiert und geöffnet: drei `NetworkError`, `document.fonts.load()` falsch. Der Favicon
  zeigt, dass das Projekt die Konsequenz kennt (`build.py` begründet seinen `data:`-URI
  ausdrücklich mit dem `file://`-Doppelklick als Hauptmodus) — für die Schriften wurde sie
  nicht gezogen. Hängt mit dran: die `url()`-Umschreibung in `build.py`, zehn
  Precache-Pfade in `sw.js` und zwei `cp -r assets/fonts`-Zeilen in `ci.yml`.
- **Die vier Editor-Schriften des Werkzeugleisten-Menüs sind wirkungslos** (`EDITOR_FONTS`
  in `core/constants.js`: roboto, inter, poppins, source-sans). Wer im Editor „Inter"
  wählt, bekommt Arial — den Rückfall. Betrifft gespeicherte Wiki- und Sitzungstexte, in
  denen schon `font-family`-Auszeichnungen stecken können. Eigener Fehlerbericht, nicht
  Welle 5.
- **Nichts im Testnetz prüft Glyphendeckung.** `design-consistency.test.js` und
  `f18-kaskade.test.js` nehmen `fonts.css` ausdrücklich aus der Betrachtung, und kein
  E2E-Fall lädt je eine `@font-face`-Familie und sieht nach, ob sie rendert. Eine Schrift
  kann im Repo liegen, fehlerfrei laden, `document.fonts.check` wahr melden und trotzdem
  kein einziges Zeichen der Oberfläche darstellen — genau das ist seit Juni 2026 der Fall.
  Saubere Wächterprobe: für jede `@font-face`-Familie zusichern, dass die Datei a–z, A–Z,
  0–9 und äöüÄÖÜß in ihrer `cmap` führt.
- **~~ÜBERGABE AN SCHRITT 3: die Tokenliste von W5-R-05 muss umziehen, nicht kopiert
  werden.~~ ERLEDIGT in W5-B.** `SKALA_TOKENS` ist nach `tools/typo-map.js` **verlegt**
  (nicht kopiert) und wird von der Ratsche importiert; mit ihr die beiden Ausnahmelisten
  und die Dateiausnahme. `tests/unit/typo-map.test.js` sichert zu, dass in der
  Ratschendatei keine zweite Aufzählung der Tokennamen entsteht — mit drei einzeln
  belegten erlaubten Nennungen statt einer Pauschale. Zwei hand-synchrone Listen sind in
  diesem Projekt schon einmal auseinandergelaufen (ARCH-01, deshalb liest `build.py` die
  Modulliste heute aus `loader.js`).
- **UMGEBUNGSMANGEL, kein Befund am Code: die E2E-Suite ist örtlich nicht lauffähig.**
  `playwright-core` 1.57.0 verlangt die Chromium-Revision **1200**; im
  Browser-Zwischenspeicher liegen 1217, 1234 und 1243. `npx playwright test` bricht
  deshalb bei jedem Fall mit „Executable doesn't exist" ab — unabhängig von jeder
  Änderung dieser Einheit und auch vor ihr. Die in dieser Einheit nötigen Browser-Läufe
  sind über zwei Umwege gefahren: `tools/typo-baseline.js` nimmt den Pfad aus
  `TYPO_BASELINE_CHROMIUM`, und für den Stil-Sollstand zeigte `PLAYWRIGHT_BROWSERS_PATH`
  auf einen Ordner mit Verzweigungen (`chromium-1200`, `chromium_headless_shell-1200`,
  `ffmpeg-1011`) auf die vorhandene 1217er Fassung. Der Zwischenspeicher des Nutzers ist
  dabei **nicht** angefasst worden. Saubere Behebung: `npx playwright install chromium`
  einmal laufen lassen. **Solange das nicht geschehen ist, ist der Basiswert „595
  bestanden / 27 übersprungen" nicht ohne Umweg nachvollziehbar** — das sollte vor der
  nächsten Einheit geklärt sein, weil die Welle 5 Schriftgrößen ändert und das
  eingefrorene Editor-Testnetz (114 Fälle) ihre Schutzschicht ist.
- **Die Browser-Fassung bestimmt die Schriftmetrik mit.** Deshalb trägt die Ausgabe des
  Grundlinienwerkzeugs die benutzte Fassung im Kopf, und der Abnahme-Vergleich muss
  **beide Seiten mit derselben** erheben. Gegenprobe dieser Einheit: die eingefrorene
  Grundlinie der Vermessung und eine frische Erhebung unter der 1217er Fassung stimmen
  auf **3672 gemeinsamen Schlüsseln** in Größe, Gewicht und Zeilenhöhe **vollständig**
  überein — die Fassungsdrift ist für diese drei Eigenschaften also folgenlos. Die 28
  Schlüssel, die nur die eingefrorene Grundlinie führt, sind vier Bestiar-Listenzeilen
  (Nachladen der Liste), kein Größenunterschied.

### Befehle

```bash
# Grundlinie erheben (Wiederholbarkeitsprobe: zweimal laufen, Dateien byteweise vergleichen)
node tools/typo-baseline.js --out <datei>.json
node tools/typo-baseline.js --out <datei>.json --nur dark-375

# Abnahme-Gegenüberstellung, beide Seiten mit derselben Browser-Fassung.
# WAS DER RÜCKGABEWERT BEURTEILT: Größen-Überschreitung über der Schwelle,
# Gewichts-, Zeilenhöhen- und Sichtbarkeitswechsel an gemeinsamen Schlüsseln,
# leerer Vergleich (0 gemeinsame Schlüssel), einseitiger Lauf, nicht
# hergestellter Zustand (offen=false). NICHT im Urteil, aber in der
# Schlusszeile beziffert: einseitige Schlüssel und nicht gefundene Umschalter.
node tools/typo-baseline.js --diff <alt>.json <neu>.json

# Absichtlich geänderte Eigenschaft aus dem Urteil nehmen (Schritt 6: 95 Gewichte)
node tools/typo-baseline.js --diff <alt>.json <neu>.json --egal gewicht

# Zwei Läufe desselben Standes: dann ist jeder einseitige Schlüssel ein Befund
node tools/typo-baseline.js --diff <alt>.json <neu>.json --schluessel-streng

# Die vier Schranken
npx jest tests/unit/design-consistency.test.js -t W5-R-0

# Das Werkzeug selbst (25 Fälle)
npx jest tests/unit/typo-baseline.test.js
```

---

## W5-B — Zuordnungstabelle, Umstellungswerkzeug und sein Wächter (2026-10-06)

**Status: ERLEDIGT.** Zweite Einheit der Welle 5, Schritt 3 des geprüften Plans. Drei
Commits, **keine Zeile CSS**, **kein Byte Unterschied im gebauten Bündel**. Was entsteht,
ist das Werkzeug, mit dem Schritt 5 die 839 mechanischen Deklarationen umstellt — und sein
Wächter, zuerst rot bewiesen.

### Warum das Werkzeug mitcommittet wird und nicht der Diff

Der atomare Commit der Umstellung enthält **nur Werkzeugergebnis**. Alles, worüber ein
Mensch urteilen muss, steht vorher in eigenen, kleinen Commits. Der Prüfer liest dann
drei Dateien und einen Bericht statt 839 geänderter Deklarationen.

### Was entstanden ist

- `tools/typo-map.js` — die Zuordnungstabelle (**44 Zeilen**: 28 `em`-Werte, 16
  px-Literale, auf 8 Sprossen) und die **einzige** Quelle für alles mit zwei Lesern:
  Tokenliste, `font-size`-Ausnahmen, SVG-Ausnahmen, Dateiausnahme, Schutzliste der
  Welle-4-Familien, Ikonen-Muster, Kleinst-Grenze. Die Bildpunktwerte der Skala stehen
  **nicht** darin — `skalaWerte()` liest sie aus `assets/styles/variables.css`.
- `tools/sync-typo-tokens.js` — `--check` / `--report [--kategorien]` / `--only=<datei>`
  und der schreibende Lauf. Eigener, klammerzählender Zerleger, der die
  **Zeichengrenzen** des Wertes mitführt; ein urteilender Zerleger kann das nicht, und
  zwei unabhängige Rechnungen sind ohnehin verlangt.
- `tests/unit/typo-map.test.js` — **43 Fälle am Werkzeug**, nicht am Ergebnis.

### Die Rechnung, die `--check` nennt

| Lage | Zahl |
| --- | --- |
| `font-size`-Deklarationen im Geltungsbereich (18 Dateien) | **853** |
| davon bereits auf einer Sprosse (Welle 4) | 2 |
| davon `inherit` (legt keine Größe fest) | 7 |
| davon namentlich geduldet, mit Begründung | ~~5~~ **11** (Runde 1) |
| davon ohne Tabellenzeile | **0** |
| davon in einer geschützten Familie | **0** |
| **OFFEN** | ~~839~~ **833** (Runde 1) |

**Drei Wege, eine Zahl.** Die 853 nennen (a) der klammerzählende Zerleger des Werkzeugs,
(b) ein Regex-Zähler im Wächtertest und (c) die Zerlegung der Ratsche W5-R-05, die ihren
eigenen Zerleger mitbringt. Die 833 stimmen mit `AUSSERHALB_MAX` von W5-R-05 überein —
zwei getrennt geschriebene Zerleger, dieselbe Menge. **Die 839 wurden in Runde 1 auf 833
gesenkt**, weil die sechs Überschriftenregeln des Reichtext-Inhalts seither namentlich
geduldet sind; siehe den Abschnitt **W5-B Runde 1** weiter unten.

### Der Delta-Bericht, den `--report` schreibt

~~840 Deklarationen tragen einen Zahlenwert. **31** springen um mehr als 2 px, **809** um
2 px oder weniger, davon **151** um exakt 0,00 px.~~ **Stand nach Runde 1: 833 mit
Zahlenwert, 30 über 2 px, 803 darunter, davon 158 mit exakt 0,00 px — und es sind ANDERE
Stellen.** Das ist die Liste, die das Abnahmekriterium des Handoffs ("keine Änderung
> 2 px außer beabsichtigt") namentlich braucht und die der Handoff nicht liefert.

**~~Die 31er-Liste ist gegen eine unabhängige Rechnung abgeglichen~~ — DIESER SATZ WAR
FALSCH, und sein Fehler ist der Hauptbefund der Prüfrunde 1.** Ein zeilenweiser
Regex-Zähler aus der Vorab-Vermessung und der klammerzählende Zerleger des Werkzeugs
nannten dieselben 31 `Datei:Zeile`-Paare, sortierter Diff leer — aber **beide Rechnungen
lösten einen `em`-Wert gegen eine 16-px-Wurzel auf**. Auf dieser gemeinsamen Annahme ist
die Übereinstimmung eine **Tautologie** und keine Bestätigung. Gemessen sitzen 55 Kanten
auf einem Elternwert ungleich 16 px; bei 15 von ihnen war die Zuordnung falsch, und
**keine der 15 stand in der 31er-Liste**. Was trägt, ist der Abgleich der Gesamtzahl 853
über drei Zerlegungen — der hat keine gemeinsame Annahme.

**~~Die Spalte "alt" ist eine Annahme und wird als solche benannt~~ — seit Runde 1 rechnet
sie mit der MESSUNG, wo es eine gibt.** Neue Spalte **"Q"**: `g` = gemessen (aus `KETTEN`
oder `SONDERZUORDNUNG`), `a` = Annahme (deklarierter Wert bei 16-px-Wurzel). Eine Spalte,
die beides vermengt, ohne es zu nennen, ist keine Urteilsgrundlage. Was auf dem Bildschirm
geschieht, misst weiterhin `tools/typo-baseline.js`; `--ketten` zeigt die Ketten mit
Eltern- und Kindwert.

### Zwei Handoff-Zeilen fehlen in der Tabelle, mit Absicht

`26px → --text-2xl` und `34px → --text-3xl` haben **null** Quellstellen. Eine
Tabellenzeile, die nichts trifft, ist keine Zuordnung, sondern eine Behauptung über einen
Bestand, den es nicht gibt. Damit sind es 44 Zeilen und nicht 46. Kommt der Wert je vor,
meldet `--check` ihn als "ohne Zeile" — diese Zusicherung steht auf **0** und ist nicht
an den Ausgangsbestand gebunden.

### Ein echter Fehler, gefunden und eingefangen

Die erste Fassung des Zerlegers sammelte den Rohtext auf und lief mit dem Original
auseinander, sobald ein maskierter Kommentar vor der Deklaration stand: `13px` kam als
`px` an (in `core.css`, Zeile 693, `.form-group label` mit zweizeiligem Kommentar
darüber). Ein **schreibendes** Werkzeug hätte dort mitten in den Wert geschrieben. Die
Fassung führt jetzt den absoluten Index mit, und der Wächter prüft die Zeichengrenzen an
neun Kunstfällen **und an allen 853 echten Stellen einzeln** (`css.slice(von, bis)` muss
zeichengleich dem gemeldeten Wert sein).

### Die Grenze des Musters, benannt statt verschwiegen

Das Vorbild `tools/sync-editor-toolbars.js` **besitzt** das Markup, das es schreibt, und
kann deshalb "identisch neu erzeugbar" prüfen. Eine `font-size` steht mitten in
handgeschriebenem CSS. `--check` kann hier also nur "kein Wert außerhalb der Tokenmenge"
prüfen — und genau das tut W5-R-05 ohnehin, dauerhaft. **Das Werkzeug ist ein einmaliges
Umstellungswerkzeug mit Bericht; die dauerhafte Wache sind W5-R-05 und W5-R-06.**

Und die zweite Lehre aus demselben Vorbild: es behauptet in Zeile 18 einen Wächtertest
(`tests/unit/editor-toolbar-sync.test.js`), den es nicht gibt. Der Wächter dieser Einheit
prüft deshalb, dass **jeder** von den beiden neuen Dateien genannte Testpfad existiert —
mit genau einer Ausnahme, und die ist die Pointe: der fehlende Test des Vorbilds wird als
**fehlend zugesichert**. Entsteht er eines Tages, fällt der Fall und der Kommentar wird
berichtigt.

### Die Schutzliste: wo eine Ersetzung ein Rückschritt wäre

Der Chip- und Markenvertrag der Welle 4 (W4-R-06) verlangt die Größe an der **Basis** und
verbietet sie jedem Mitgliedsselektor. Die 53 Chip- und 33 Markenstellen, die der Plan
nennt, sind damit **erledigt**, nicht ausgenommen — darum steht dort eine 0 und keine
Ausnahmeliste. Ein Werkzeug, das in einem Mitglied eine `font-size` durch ein Token
*ersetzt* statt sie zu *entfernen*, macht die Welle 4 rot, und zwar an einer Stelle, die
wie Fortschritt aussieht. Darum **verweigert** das Werkzeug dort den Dienst (Exit 2).

### Kandidatenmengen: benannt und gezählt, aber nicht geduldet

`--report --kategorien` zählt aus, worüber die Folgeschritte urteilen müssen — die
Entscheidung selbst bleibt dort, wo sie hingehört:

| Menge | Zahl | Gehört zu |
| --- | --- | --- |
| Ikonen und Avatar-Platzhalter (Selektor-Muster) | **73**, davon 18 mit Sprung > 2 px | E-3 |
| Deklarationen unter 11 px (deklarierter Wert) | **34** | E-4 |
| Leser der Mobilvergrößerung im Geltungsbereich | **4** (+ 4 in `variables.css`) | E-2 |
| Geschützte Familien | 18 + 9 Klassen, **0** Eigengrößen | Welle 4 |

**Die 73 sind nicht die 66 des Plans**, und die Differenz ist benannt: die Menge ist über
die *Größe* nicht zu bestimmen (nur 21 Deklarationen tragen einen Wert ab 32 px, und sechs
davon sind Zahlen und kein Ikon), sondern über den *Namen*. Ein erster Musterentwurf mit
`-empty` zählte **91** und zog `.enc-empty-title`, `.detail-empty-text` und
`.sb-empty-hint` herein — lauter Fließtext in Leerzustands-Kästen, also genau das, was die
Welle anfassen soll. Nach dem Schärfen sind es 73. Geduldet ist **nichts** davon; der
Wächter prüft ausdrücklich, dass kein Kandidat in der Dulde-Liste steht.

### Was nicht zur Ratsche gemacht ist, und warum

Die Zahlen 840/31/809/151 sind Eigenschaften des heutigen Bestandes und nach der
Umstellung alle 0. Härtete man sie ein, müsste der Schritt, der die Welle vollendet,
seinen eigenen Wächter aufweichen — und ein Wächter, der beim ersten Erfolg gesenkt wird,
bewacht ab dann nichts. Festgenagelt ist stattdessen die **innere Stimmigkeit** des
Berichts: die Summe der Lagen gleicht der Gesamtzahl, der Block "> 2 px" hat so viele
Zeilen wie sein Kopf behauptet, und jede dieser Zeilen trägt wirklich mehr als 2 px. Das
gilt heute und nach der Umstellung.

### Abnahme

- Roter Nachweis in eigenem Commit (`70c86b5`), Schranke `OFFEN_MAX = 0`:
  **1 failed / 42 passed**, Ausgabe nennt 853 / 839 beziffert.
- Schranke **exakt ausgereizt**, nachgemessen: 838 → 1 failed, 839 → 43 passed.
- `npx jest`: **2048 Tests in 77 Suiten**, alle grün (vorher 2005 in 76).
- `npm run lint` Exit 0 mit **363** Warnungen · `typecheck` und `typecheck:strict` Exit 0
  · `python -m pytest tests/build` **30 passed** · beide Builds Exit 0 · beide Wächter OK
  (`check-f18-kaskade --check`, `sync-aktenlage-anker --check` 0 Abweichungen, 123 Anker).
- Ratschen unverändert: Dubletten **0**, `!important` **105**, Inline **254**,
  `transition: all` **0**, W5-R-05 839/603/3, W5-R-06 95.
- **Das gebaute Bündel ist byteidentisch** mit dem Bau des Vorzustands `a3081be`:
  `d189459c…` (dev) und `10f35d93…` (prod), erzeugt aus einem `git archive` desselben
  Commits in einem zweiten Baum. Damit ist jede Bildschirmwirkung ausgeschlossen, bevor
  irgendein Browser läuft.
- Grundlinien-Diff gegen die eingefrorene Grundlinie der Vermessung: **18325 verglichene
  Schlüssel** in 5 Läufen, **0** Größen-, **0** Gewichts-, **0** Zeilenhöhen-, **0**
  Sichtbarkeitsabweichung, Spanne **0 px**.
- Linux-Nachstellung (`--modus=verdana`, Faktor 1,155): G3 und G4 vollständig OK, G1 24
  CI-Schlüssel erfasst, G2 unverändert `npcs:5`/`loot:7` — vorbestehend, und wegen der
  Byteidentität des Bündels zwangsläufig derselbe Lauf wie am Vorzustand.

### Zwei Beobachtungen am Messaufbau, nicht am Code

- **Die eingefrorene Grundlinie der Vermessung ist kein voll vergleichbarer Maßstab für
  das committete Werkzeug.** Sie stammt aus den Vorab-Skripten
  (`20-typo-baseline.mjs`) und trägt ein anderes Dateiformat (`meta`/`elemente` statt
  `kopf`/`zustaende`), keinen Bündel-SHA und nur die Ruhelage. Daher im Diff: **1915**
  Schlüssel nur neu (die Zustände "offen" und "mob", die es damals nicht gab) in den zwei
  Dark-Läufen und **28** Schlüssel nur alt in jedem 1440er-Lauf (vier Bestiar-Listenzeilen:
  17 statt 13 — dieselben, die W5-A schon benannt hat). Im strengen Modus
  (`--schluessel-streng`) sind es **112 Befunde, alle einseitige Schlüssel, 0 Größen-,
  Gewichts-, Zeilenhöhen- oder Sichtbarkeitsabweichung**. Künftige Einheiten sollten
  Werkzeug gegen Werkzeug vergleichen (Erhebung vor und nach dem Commit, wie W5-A) und
  die eingefrorene Grundlinie nur als historische Gegenprobe führen.
- **Die Erhebung ist heute deterministisch**, und das ist gemessen, nicht angenommen: zwei
  Läufe von `--nur contrast-1440` gegen denselben Baum liefern **byteidentische** Dateien
  (SHA `35c69cc8…`) und einen Diff mit 0 einseitigen Schlüsseln. Die 18 nicht gefundenen
  Umschalter aus dem Diff oben liegen damit am Alter der Grundlinie, nicht an einer
  schwankenden Messung.

### Offen, an die Folgeschritte übergeben

- **Die Entscheidungen E-3 und E-4 sind NICHT getroffen.** Die Kandidatenmengen stehen
  ausgezählt bereit (73 Ikonen/Avatare, 34 Stellen unter 11 px), geduldet ist keine. Wer
  sie duldet, trägt sie mit Begründung in `AUSNAHMEN` in `tools/typo-map.js` ein — die
  Verwesungsprobe von W5-R-05 verlangt, dass jeder Eintrag eine Deklaration trifft.
- **`EM_MAX` kann 0 nur erreichen, wenn keine geduldete Stelle in `em` stehen bleibt.**
  W5-R-05b zählt die Einheit **ohne** Rücksicht auf die Dulde-Liste (absichtlich: Schranke
  1 verlangt ein Token, Schranke 2 verbietet die Einheit). Bleiben die Ikonen bei `3em`,
  bleibt `EM_MAX` bei deren Zahl stehen. Das muss der urteilende Schritt sehen, bevor er
  entscheidet — sonst verspricht die Welle eine 0, die ihre eigene Ausnahme verbietet.
- **Der schreibende Lauf ist noch nie gelaufen.** Seine Richtigkeit ist an neun
  Kunstfällen und an allen 853 Zeichengrenzen geprüft, aber `fs.writeFileSync` hat in
  dieser Einheit keine CSS-Datei berührt. Schritt 5 fährt ihn, und zwar mit `--only=` je
  Datei, damit ein halb gelaufener Lauf nicht zurückgedreht werden muss.
- **Die Umgebungsmängel aus W5-A bestehen weiter**: `npx playwright test` ist örtlich
  nicht lauffähig (`playwright-core` 1.57.0 verlangt Chromium-Revision 1200, vorhanden
  sind 1217/1234/1243). Die Browser-Läufe dieser Einheit sind wieder über
  `TYPO_BASELINE_CHROMIUM` und `PLAYWRIGHT_BROWSERS_PATH` gefahren; der
  Browser-Zwischenspeicher des Nutzers ist **nicht** angefasst. `npm run check` bleibt
  vorbestehend rot, weil `prettier --check` über den ganzen Baum läuft; die drei in dieser
  Einheit angelegten bzw. geänderten Dateien sind einzeln geprüft — die drei neuen sind
  prettier-konform, `design-consistency.test.js` war schon an `7e4aa09` nicht konform und
  ist es unverändert.

### Befehle

```bash
# Die Rechnung, schreibt nichts, Exit 1 solange eine Stelle offen ist
node tools/sync-typo-tokens.js --check

# Die Delta-Tabelle und die Kandidatenmengen
node tools/sync-typo-tokens.js --report --kategorien

# Der schreibende Lauf, gestaffelt je Datei (Schritt 5)
node tools/sync-typo-tokens.js --only=pwa.css

# Der Wächter (43 Fälle)
npx jest tests/unit/typo-map.test.js
```

---

## W5-B Runde 1 — die 16-px-Annahme hatte 15 Stellen falsch zugeordnet (2026-10-06)

**Status: ERLEDIGT.** Nachbesserung der Einheit W5-B nach der Prüfrunde. Zwei Commits,
**keine Zeile CSS** — korrigiert wird die ZUORDNUNG, nicht der Bestand. Das gebaute
Bündel ist unberührt: `git diff cbc6be7..HEAD` über alles außer `tests/`, `tools/` und
`.planning/` ist **leer**, es ist also kein Datei im Bündel geändert worden.

### Der Befund in einem Satz

`altPx()` löst einen `em`-Wert gegen eine 16-px-Wurzel auf. Für **55 gemessene Kanten**
stimmt diese Wurzel nicht — der sichtbare Wert ist dort ein **Produkt** aus Elternwert und
Faktor. Die Zuordnungstabelle ersetzte beide Glieder einzeln und **zerriss die Kette**.

Die Prüfrunde hat es an der Attribut-Pille vorgerechnet, und die Messung bestätigt es:
`.char-attr-pill` trägt `0.7em` = 11,2 px und wird `--text-xs` = 11 px; seine drei Kinder
(`0.9em` / `1.1em` / `0.95em` **von 11,2 px** = 10,08 / 12,32 / 10,64 px) hätte die Tabelle
auf 14 / 16 / 14 px gelegt. Das Kind wäre **45 % größer als die Grundgröße seines
Behälters** geworden (vorher 10 % kleiner), die Pillenbox **28,6 % höher**.

### Warum kein Tor das sah

**Die 31er-Liste von `--report` und die unabhängige Vorab-Vermessung teilten die Annahme.**
Beide lösten `em` gegen 16 px auf, beide nannten dieselben 31 `Datei:Zeile`-Paare, Diff
leer — und beide lagen bei denselben Stellen daneben. Eine Übereinstimmung zweier
Rechnungen über derselben falschen Annahme ist eine **Tautologie**. Der Satz "zwei
Rechnungen, die nichts voneinander wissen" stand in dieser Akte und ist oben als falsch
markiert. Was trägt, ist der Abgleich der **Gesamtzahl 853** über drei Zerlegungen: der
hat keine gemeinsame Annahme.

Die zwei anderen Befunde waren aus demselben Grund unsichtbar:

- **Die fünf `1em`-Eingabefelder** liegen gemessen auf 16,00 px — die Annahme stimmt hier
  sogar. Der Sprung auf `--text-md` ist **exakt −2,00 px** und fällt damit unter die
  2-px-Schwelle, obwohl er eine **Funktionsgrenze** reißt: unter 16 px löst ein Telefon
  beim Antippen den Auto-Zoom aus (E-2, Arbeitsregel 10). Über den Selektor sind sie nicht
  zu finden — `.dice-formula` und `.dice-multi` nennen ihr Eingabefeld nicht, und die
  Kategorie "LESER DER MOBILVERGROESSERUNG" zählte nur die vier `var(--font-size-*)`-Leser.
- **Die sechs Überschriftenregeln** springen einzeln um −0,4 bis −2,0 px, also ebenfalls
  unter der Schwelle. Der Schaden ist nicht die Größe eines Sprungs, sondern der **Verlust
  der Unterschiede**: sechs Stufen werden drei. Und die acht Reichtext-Behälter stehen in
  **keiner** Grundlinien-Erhebung, weil `seedPopulatedSession` keinen Eintrag mit
  Überschriften erzeugt — `typo-baseline --diff` kann über sie nichts melden.

### Die Messung, auf der die Behebung steht

Gebautes Bündel, gefüllte Kampagne (`seedPopulatedSession`), 24 Ansichten besucht, zwei
Läufe: **dark-1440** (layout desktop) und **dark-375** (layout mobile). Je Element wird die
**Eigentümer-Deklaration** bestimmt — der Selektor trifft UND der berechnete Wert ist mit
der Deklaration vereinbar (`px` wörtlich, `em` als Elternwert mal Faktor) — und dann die
nächste Vorfahrenkante gebildet.

**Die Eigentümerprobe ist der Teil, auf den es ankommt.** Ein erster Entwurf der Messung
nahm einfach alle Treffer von `querySelectorAll('.btn')`, schrieb deren Werte der
`.btn`-Deklaration zu und meldete `.btn` mit 17,6 px — an jenen Elementen gewinnt eine
spezifischere Regel. Ohne diese Probe hätte die Behebung 144 "Abweichungen" statt der
15 echten gesehen.

| Messung | Zahl |
| --- | --- |
| Elternteile mit Wert ungleich 16 px | **35** |
| Kanten (Eltern → Kind) | **55** |
| betroffene Elemente | **319** |
| Kanten, bei denen die Ordnung Eltern/Kind kippt | **12** (53 Elemente, 46 mit Textknoten) |
| Kanten mit Sprung > 2 px gegen den GEMESSENEN Wert | **8** |
| zusammen falsch zugeordnete Deklarationen | **15** |
| davon in der alten 31er-Liste | **0** |
| `1em`/`1.0em`-Deklarationen im Geltungsbereich | **27** (9 ohne Messwert, je mit Grund) |
| davon Steuerelemente mit heute ≥ 16 px | **5** |
| Reichtext-Behälter mit sechs streng fallenden Stufen | **8** (Behälter 13,6 / 14,4 / 16 px) |

**Beide Läufe nennen für jede Kante denselben Messwert — 0 Abweichungen.** Darum steht in
`KETTEN` eine Zahl je Kante und nicht zwei.

### Regel K — wie die 15 neu zugeordnet werden

Eine Regel, überall dieselbe, damit die Zeilen nachrechenbar sind und nicht nach Gefühl
gesetzt:

1. Den **gemessenen** Wert auf ganze Bildpunkte runden und durch die **px-Zeilen derselben
   Tabelle** schicken. Nicht "nächste Sprosse" — die Tabelle rundet an ihren Bucketgrenzen
   bewusst anders (12,0 px aus `0.75em` geht nach 11, das px-Literal `12px` nach 12), und
   eine zweite Rundungsregel wäre eine zweite Tabelle.
2. An der **Ordnung zum Elternziel** kappen: war das Kind gemessen kleiner, darf es nicht
   größer werden; war es größer, nicht kleiner; war es gleich, bleibt es gleich.

**Geurteilt wird über die Ordnung, nicht über die Strenge.** Zwei Messwerte im Abstand von
1,4 px landen auf einer achtsprossigen Skala zu Recht auf derselben Sprosse; was nicht
passieren darf, ist eine **Umkehrung**. Bei den vier Kindern mit Elternziel 11 px ist
Gleichheit sogar erzwungen — 11 px ist die unterste Sprosse und gleichzeitig die
Untergrenze aus E-4.

Für die Pillenkette ergibt Regel K genau die Werte, die die Prüfrunde vorgerechnet hat:
name 10,08 → **11** (+0,92), val 12,32 → **12** (−0,32), mod 10,64 → **11** (+0,36).

### Was entstanden ist

- **`SONDERZUORDNUNG`** in `tools/typo-map.js`, **21 Einträge in drei Gründen**, jeder mit
  seinem Messwert, seinem Elternwert und einer Begründung in Prosa:
  - `kette` (**15**) — Ziel aus dem gemessenen Wert nach Regel K.
  - `kette-reichtext` (**1**, Runde 2) — `.spell-desc`. Nicht `kette`: dort weicht der
    gemessene Wert von der 16-px-Annahme ab, hier stimmt sie (0,85 × 16 = 13,6 ist genau
    der Messwert). Abgewichen wird wegen der **Kinder** — der sechs geduldeten
    em-Überschriften, die sich mit dem Behälter mitbewegen, ohne dass eine ihrer
    Deklarationen angefasst würde. Die Kante steht nicht in `KETTEN` und kann dort nicht
    stehen (Begründung im nächsten Abschnitt). Ziel nach derselben Rundungsregel:
    13,6 → 14 → px-Zeile `14px` → `--text-md`.
  - `formular-e2` (**5**) — `1em` auf einem Eingabefeld geht auf `--text-lg` = 16 px,
    **Delta 0,00 px**. Eine Ausnahme wäre hier das schlechtere Mittel: sie ließe den
    em-Wert stehen und damit eine Stelle, die bei jeder Änderung ihres Behälters wieder
    unter 16 px rutschen kann. Nebenbefund mitgezogen: der Kommentar an `dice.css:156`
    leitet die Sollbreite 160 px aus "`4d6kh3+2d8+5` ist in `var(--font-mono)` bei 1em
    130 px breit" ab — bei 14 px hätte diese Begründung nicht mehr gestimmt, bei 16 px
    bleibt sie, wie sie ist.
- **`zielFuer(datei, selektoren, wert)`** — die **einzige** Stelle, die ein Ziel bestimmt:
  `AUSNAHMEN` → `SONDERZUORDNUNG` → `ZUORDNUNG`. Das Werkzeug und der Wächter rufen beide
  sie; `ZUORDNUNG` direkt nachzuschlagen umgeht die Sonderzuordnungen und war genau der
  Fehler.
- **Sechs neue `AUSNAHMEN`** — die Überschriftenstufen h1…h6 des Reichtext-Inhalts bleiben
  in `em`. Sie sind **EIN Verhältnis** zu ihrem Behälter und keine sechs Größen, und der
  Behälter ist gemessen 13,6 / 14,4 **oder** 16 px. Eine feste Sprosse kann nicht
  gleichzeitig über einem 13,6-px- und unter einem 16-px-Fließtext liegen. **Sechs Sprossen
  wären auch keine Lösung**: unter `xl` (20) hat die Skala nur 16 / 14 / 12 / 11 — bei h5
  ist sie zu Ende, und h4 läge mit 12 px wieder unter dem 16-px-Fließtext. Die Schlüssel
  werden aus `REICHTEXT_BEHAELTER` **gebaut** (der Selektor ist 230 Zeichen lang und
  sechsmal fast derselbe); die Verwesungsprobe belegt die Konstruktion.
- **Drei Messbestände** in `tools/typo-map.js`, Abschnitt 7: `KETTEN` (55 Kanten),
  `EM_EINS` (27 Stellen, 9 davon mit `EM_EINS_UNGEMESSEN`-Grund statt stiller Null),
  `UEBERSCHRIFTEN_GEMESSEN` (8 Behälter). **Messung, nicht Entscheidung** — eine Messung
  darf man nachmessen, eine Entscheidung muss man bestreiten können, und beides im selben
  Satz macht keins von beidem prüfbar.
- **Neue Betriebsart `--ketten`**: zeigt die 35 Elternteile / 55 Kanten / 319 Elemente mit
  Eltern- UND Kindwert und urteilt über die Ordnung. `--report` sortiert nach dem Sprung
  **einer** Deklaration; eine Kette ist aber ein **Verhältnis**, und jede Zeile für sich sah
  unauffällig aus. Ausgabe: `ORDNUNG KIPPT: 0 Kante(n). Soll: 0.`, Exit 0.
- **`--kategorien` nennt jetzt die 27 stillen Leser der Wurzel** (`1em`) mit Messwert,
  Elementnamen und Sonderzuordnung — die Kategorie, in der die fünf Eingabefelder fehlten.
- **Drei neue Wächterblöcke** in `tests/unit/typo-map.test.js`, **12 Fälle** (43 → 55):
  - **W5-W9** — Ketten: Bestand (35/55/319), Verwesungsprobe je Anker, "kein Kind wird
    größer als sein Elternelement", "kein Sprung > 2 px gegen den gemessenen Wert, außer
    benannt", und eine **Gegenprobe**, dass die Annahme wirklich abweicht (sonst wären die
    Fälle auch grün, wenn Annahme und Messung überall zusammenfielen).
  - **W5-W10** — Formularschrift: `EM_EINS` ist **vollständig** (gegen alle
    `1em`-Deklarationen des Bestandes geprüft, also kann keine neue unbeurteilt
    hineinwachsen), jede ungemessene Stelle trägt ihren Grund, kein Steuerelement mit heute
    ≥ 16 px fällt darunter, plus Gegenprobe, dass es wirklich fünf zu schützen gibt.
  - **W5-W11** — Überschriften: Verwesungsprobe der sechs gebauten Anker, die Messung zeigt
    sechs streng fallende Stufen, und "sechs Stufen bleiben sechs Stufen" **lässt beide
    gültigen Entwürfe zu** (alle in `em` geduldet ODER sechs verschiedene Sprossen, die
    nicht unter den Fließtext rutschen) und schließt nur das Dazwischen aus.

### Ratschen gesenkt, nicht gelockert

| Ratsche | vorher | jetzt | Grund |
| --- | --- | --- | --- |
| `OFFEN_MAX` (typo-map.test.js) | 839 | **833** | 6 Überschriften geduldet |
| `AUSSERHALB_MAX` (W5-R-05a) | 839 | **833** | dieselbe Ursache |
| Zielwert von `EM_MAX` (W5-R-05b) | "0" | **`EM_ZIEL = 6`** | siehe unten |

**`EM_MAX` kann 0 nicht erreichen, und das steht jetzt dort.** Schranke 2 zählt die
**Einheit** `em` ohne Rücksicht auf die Dulde-Liste — absichtlich, denn Schranke 1 verlangt
ein Token und Schranke 2 verbietet die Einheit. Mit sechs dauerhaft in `em` verbleibenden
Überschriftenregeln ist der Zielwert **6**. `EM_ZIEL` wird gegen die Dulde-Liste
**nachgerechnet** und nicht behauptet. Eine Zahl, die beim Aufschreiben schon nicht zu
halten ist, wird beim ersten roten Lauf gesenkt statt erfüllt — das war der schon in W5-B
übergebene offene Punkt, und er ist damit beantwortet.

### Abnahme

- Roter Nachweis in eigenem Commit (`4831eb5`): **4 failed / 51 passed**, Ausgabe nennt
  die 12 kippenden Kanten, die 8 Sprünge > 2 px, die 5 Eingabefelder und die 27
  Überschriften-Befunde **namentlich und beziffert**.
- Grüner Commit (`c0284f2`): `npx jest tests/unit/typo-map.test.js
  tests/unit/design-consistency.test.js` **324/324 grün**.
- `npx jest`: **2060 Tests in 77 Suiten**, alle grün (vorher 2048 — die 12 neuen Fälle).
- `npm run lint` Exit 0 mit **363** Warnungen · `typecheck` Exit 0 · `python -m pytest
  tests/build` **30 passed** · beide Builds Exit 0 · beide Wächter OK
  (`check-f18-kaskade --check`, `sync-aktenlage-anker --check` 0 Abweichungen, 123 Anker).
- Ratschen unverändert: Dubletten **0**, `!important` **105**, Inline **254**,
  `transition: all` **0**. W5-R-05 **833**/603/3, W5-R-06 95.
- `node tools/sync-typo-tokens.js --ketten` → `ORDNUNG KIPPT: 0 Kante(n). Soll: 0.`
- **Keine Bildschirmwirkung, und das ist nicht gemessen, sondern hergeleitet**: es wurde
  keine Datei geändert, die ins Bündel eingeht (`git diff cbc6be7..HEAD` ohne `tests/`,
  `tools/`, `.planning/` ist leer). Eine Grundlinien-Erhebung kann hier nichts zeigen, was
  nicht schon aus dem leeren Diff folgt.
- **`npx playwright test` bleibt örtlich nicht lauffähig** — derselbe Umgebungsmangel wie
  in W5-A und W5-B: `playwright-core` 1.57.0 verlangt Chromium-Revision **1200**, vorhanden
  sind 1217/1234/1243. Nachgefahren und belegt an `tests/e2e/features/wiki.spec.js`
  (`browserType.launch: Executable doesn't exist … chromium_headless_shell-1200`). Der
  Browser-Zwischenspeicher des Nutzers ist **nicht** angefasst; die Browser-Messungen
  dieser Runde liefen über einen ausdrücklich gesetzten `executablePath` auf
  chromium-1217. Da kein Bündel-Byte geändert ist, ist der E2E-Ausgang zwangsläufig
  derselbe wie an `cbc6be7`.

### Offen, an die Folgeschritte übergeben

- **Die neun ungemessenen `1em`-Stellen sind eine offene Messschuld**, nicht ein Nullwert.
  Keine davon ist nach ihrem Elementnamen ein `input`, `select` oder `textarea` — aber das
  ist eine **Beobachtung und keine Herleitung**, und darum stehen sie mit Grund in
  `EM_EINS_UNGEMESSEN`. Wer einen ihrer Zustände erreichbar macht (Widget "Referenz" des
  DM-Schirms, Belohnung im Quest-Formular, Konzentrationsmarke, Wiki-Baum ausgeklappt),
  sollte sie nachmessen.
- **Die Grundlinie sieht den Reichtext-Inhalt nicht.** `seedPopulatedSession` erzeugt
  keinen Eintrag mit `h1`…`h6`, also fehlen alle acht Behälter in `grundlinie-v5.json`.
  Diese Runde hat die Stellen mit einem eingehängten Probekörper gemessen und das Ergebnis
  als `UEBERSCHRIFTEN_GEMESSEN` **in den Quellbaum** gelegt, damit ein Unit-Test darüber
  urteilen kann. Die Saat selbst wurde **nicht** erweitert: sie würde die eingefrorene
  Grundlinie verschieben, und das ist eine Entscheidung für den Schritt, der die Grundlinie
  neu zieht — nicht für eine Nachbesserung. **Wer die Saat erweitert, muss die Grundlinie
  neu erheben.**
- **Regel K ist auf 15 Stellen angewandt, nicht auf alle 55 Kanten.** Bei den übrigen 40
  liegt der Sprung gegen den gemessenen Wert unter 2 px und die Ordnung kippt nicht; ihre
  Zuordnung bleibt die der Tabelle. Das ist Absicht: die Tabelle ist die
  Entwurfsentscheidung des Handoffs (§ 3.7), und 20 weitere Stellen auf "nächste Sprosse"
  umzuschreiben wäre ein anderer Entwurf und nicht die Behebung eines Befundes. **Wer das
  ändern will, ändert § 3.7 und nicht diese Tabelle.**
- **`--ketten` ist eine Momentaufnahme, keine Dauersynchronisation.** `KETTEN` ist ein
  gemessener Bestand; verschiebt die Umstellung in Schritt 5 einen Elternwert auf ein
  Token, verschwinden Kanten aus der Messung, und die Verwesungsprobe verlangt dann, dass
  ihr Eintrag mitgeht. **Nach dem schreibenden Lauf von Schritt 5 ist `KETTEN` neu zu
  erheben** — die 21 Sonderzuordnungen bleiben gültig (sie tragen ein Token, keinen
  em-Wert), aber die Kantenliste beschreibt dann einen Bestand, der nicht mehr existiert.
- Die übrigen offenen Punkte aus W5-B bleiben: **E-3 und E-4 sind nicht getroffen**, der
  **schreibende Lauf ist noch nie gelaufen**.

### Befehle

```bash
# Die Ketten mit Eltern- UND Kindwert, mit Urteil über die Ordnung
node tools/sync-typo-tokens.js --ketten

# Die Delta-Tabelle mit Herkunftsspalte Q (g = gemessen, a = Annahme)
node tools/sync-typo-tokens.js --report --kategorien

# Der Wächter (57 Fälle)
npx jest tests/unit/typo-map.test.js
```

---

## W5-B Runde 2 — die Überschriften-Ausnahme hing am Ziel ihres Behälters (2026-10-06)

**Status: ERLEDIGT.** Dritte Nachbesserung der Einheit W5-B. Drei Commits, **keine Zeile
CSS** — korrigiert wird wieder die ZUORDNUNG, nicht der Bestand. `git diff 088f9a0..HEAD`
über alles außer `tests/`, `tools/` und `.planning/` ist **leer**.

### Der Befund in einem Satz

Die sechs Überschriftenregeln des Reichtext-Inhalts bleiben in `em` (Runde 1, namentlich
geduldet) — also bleiben sie ein **Verhältnis zu ihrem Behälter**. `.spell-desc` ging nach
der Tabellenzeile `0.85em → --text-sm` von 13,6 auf **12 px**, und damit fiel
`.spell-desc h6` auf 0,9 × 12 = **10,80 px**, unter die E-4-Untergrenze von 11 px, **ohne
dass eine der sechs Überschriftendeklarationen angefasst worden wäre**. `h1` fiel auf
15,60 gegen gemessene 17,68 px, also **−2,08 px** über der Abnahmeschwelle. Beide Stufen
sind sichtbar und tragen einen Textknoten.

**Genau ein Behälter von acht ist betroffen.** Sechs erben die Wurzelgröße und ändern sich
nicht (16 → 16 px); `.char-notes-content` geht 14,4 → 14 und hält `h6` bei 12,6 px.

### Warum kein Tor das sah — vier Schranken, alle blind an derselben Stelle

1. **`--report` kennt kein Delta für die sechs Regeln.** `einordnen()` führt sie als
   `geduldet`, `ziel` ist `null`, `neu` ist `null` — es gibt keine Zahl, auf die eine
   2-px-Schwelle angewandt werden könnte.
2. **W5-W11 war an dieser Stelle leer.** Der Fall "nach der Zuordnung bleiben sechs Stufen
   sechs Stufen" kehrt an `ziele.every(z => z === null)` sofort zurück; sein
   Untergrenzen-Zweig lief nur, wenn **alle sechs umgestellt** wären. Heute sind alle sechs
   geduldet — der Fall prüfte also gerade im eingetretenen Entwurf nichts.
3. **`KETTEN` kann diese Kante nicht enthalten.** Die Liste ist aus dem **DOM** erhoben,
   und in der Ruhelage steht in keinem Reichtext-Inhalt eine Überschrift. Zur Gegenprobe,
   dass die Liste sonst vollständig ist: die sehr ähnliche, aber sichtbare Kante
   `.bst-save-item 0.85em 13,6` → `.bst-save-val` **steht** darin. `.spell-desc` fehlt
   ganz.
4. **Die Grundlinien-Erhebung sieht die acht Behälter nicht** — das stand seit Runde 1 in
   dieser Akte, als Messschuld. Es war zugleich die Ursache: `UEBERSCHRIFTEN_GEMESSEN`
   enthielt die Zahlen, die den Befund zeigen (Behälter 13,6 px), aber sie wurden **nur
   zur Begründung der Ausnahme** benutzt und nirgends gegen das **Ziel** des Behälters
   gerechnet. Eine Messung im Quellbaum, über die nichts urteilt, ist Dokumentation und
   keine Schranke.

### Was entstanden ist

- **Ein Fall, der im heutigen Entwurf nicht leer ist** (`tests/unit/typo-map.test.js`,
  W5-W11): je Behälter das Ziel seiner **eigenen** Deklaration über `zielFuer()`, mal jeden
  der sechs `UEBERSCHRIFTEN_WERTE`, zugesichert gegen `KLEINST_GRENZE` **und** gegen die
  2-px-Schwelle. Rot bewiesen an genau zwei Stellen, beide `.spell-desc`. Eine
  Verwesungsprobe hält fest, dass **genau zwei** der acht Behälter überhaupt eine eigene
  `font-size` tragen — ohne sie würde der Fall grün, sobald die Suche nichts mehr trifft.
- **`SONDERZUORDNUNG['spells.css||.spell-desc||0.85em']` → `--text-md`**, dritter Grund
  `kette-reichtext`. Danach h1…h6 = 18,2 / 16,8 / 15,4 / 14,0 / 13,3 / 12,6 px: alle über
  11 px, alle innerhalb **0,52 px** der Messung, und der Behälter selbst springt **+0,40**
  statt −1,60 px.
- **Der Kopf von `KETTEN` nennt jetzt die Grenze seiner Erhebung**: nur Kanten, deren Kind
  in der Ruhelage im DOM steht; Reichtext-Inhalt fällt grundsätzlich heraus. Wer dort eine
  Kette braucht, misst sie eigens mit einem Probekörper und trägt sie nach
  `UEBERSCHRIFTEN_GEMESSEN` ein, nicht nach `KETTEN`.
- **Ein Wächter über `SONDER_GRUENDE`** — Nebenfund, aber kein kleiner: die Menge nannte
  sich *geschlossen*, und geprüft hat das nichts. Der neue Fall verlangt je
  Sonderzuordnung dreiteiligen Anker, Grund **aus** der Menge, Begründung über 60 Zeichen
  (dieselbe Schranke wie bei `AUSNAHMEN`) und ein Ziel auf der Skala; eine
  Verwesungsprobe verlangt, dass jeder Grund der Menge auch benutzt wird.

### Die verworfene Alternative, benannt statt verschwiegen

`.spell-desc h6` namentlich aus E-4 auszunehmen wäre der andere Weg gewesen. **Verworfen:**
eine 10,8-px-Überschrift im Zauberblatt ist lesbarer Text, und genau dafür gilt die
Untergrenze. Die 25 benannten Kleinst-Ausnahmen sind SVG-Beschriftungen der Würfelstatistik
und textlose Punkte (`.slot-pip`) — eine Überschrift mit eigenem Textknoten gehört nicht in
diese Klasse.

### Eine Schranke wurde erfüllt, nicht gesenkt

Der neue `SONDER_GRUENDE`-Wächter war sofort rot, und zwar an einer **vorbestehenden**
Stelle: `dmscreen.css .dms-init-value` trug 59 Zeichen Begründung, einen Querverweis auf
den Nachbareintrag. Die 60er-Schranke zu senken wäre genau der Fehler, vor dem
`plan.atomar_wie` warnt. Statt dessen ist die Begründung ausgeschrieben — Elternteil,
Tabellenwert, warum er nicht taugt, Rundungsweg, Sprung. `.dms-init-marker` liegt mit 65
Zeichen über der Schranke und **bleibt unangetastet**: was der Wächter nicht meldet, wird
nicht angefasst.

### Abnahme

`npx jest` **2062/2062 in 77 Suiten** · `npm run lint` exit 0 mit **exakt 363** Warnungen ·
`typecheck` und `typecheck:strict` exit 0 · beide Builds exit 0 · `check-f18-kaskade
--check` OK (126 Abhängigkeiten) · `sync-aktenlage-anker --check` 0 Abweichungen.
Ratschen unverändert: **DUBLETTEN 0 · !important 105 · Inline-Stile 254 · `transition:
all` 0**. `--check` unverändert **833 offen**, `--report` unverändert **30 Stellen über
2 px / 803 darunter / 158 mit Sprung 0,00** — die Zeile von `.spell-desc` wechselt von
`−1.60 a` auf `+0.40 g`.

**Die CI-Schriftmetrik ist nicht berührt:** diese Runde ändert keine CSS-Deklaration,
sondern eine Zuordnungstabelle, die noch nie schreibend gelaufen ist. Kein gerenderter
Bildpunktwert hat sich bewegt.

### Offen, an die Folgeschritte übergeben

- **Die Grundlinie sieht den Reichtext-Inhalt weiterhin nicht.** Das bleibt die
  Messschuld aus Runde 1, unverändert. Diese Runde hat nur die Folge eingefangen, nicht
  die Ursache: wer die Saat um einen Eintrag mit `h1`…`h6` erweitert, muss die Grundlinie
  neu erheben.
- **`kette-reichtext` hat genau einen Fall.** Entstehen weitere Behälter mit eigener
  `font-size` **und** em-Kindern, deckt der neue W5-W11-Fall sie ab — aber nur für die
  acht Behälter, die in `REICHTEXT_BEHAELTER` stehen. Ein neunter müsste dort eingetragen
  und eigens gemessen werden.
- Die übrigen offenen Punkte aus W5-B bleiben: **E-3 und E-4 sind nicht getroffen**, der
  **schreibende Lauf ist noch nie gelaufen**.

### Befehle

```bash
# Der Fall, der den Befund gefunden hat
npx jest tests/unit/typo-map.test.js -t "gerechnet gegen das ZIEL"

# Der neue Wächter über die geschlossene Gründemenge
npx jest tests/unit/typo-map.test.js -t "Grund AUS der geschlossenen Menge"

# Die Zeile von .spell-desc im Delta-Bericht
node tools/sync-typo-tokens.js --report | grep spell-desc
```

---

## W5-C — die 31 Urteilsstellen: 22 bleiben neben der Skala, 9 kommen darauf (2026-10-06)

**Status: ERLEDIGT, mit einer Rücknahme in Runde 1** (eigener Abschnitt weiter unten).
Einheit W5-C (Schritt 4), zwei Commits, `5f313a6 → 4534b38`. Die
erste Einheit dieser Welle, die **CSS ändert**: 31 Deklarationen in zehn Dateien, jede mit
einem nachgestellten Kommentar, der alten Wert, neuen Wert und Grund nennt.

### Die Teilung, und sie ist gemessen

31 Deklarationen springen um mehr als 2 px — die Schwelle, die das Abnahmekriterium nennt.
Davon tragen **22 keinen Lesetext**: 19 ein einzelnes Emoji (gemessen 🏠 📖 👹 🎭 🎲 📍 👤
⚔️ 📦 🐉 ✨ 📝 🔗 📜), zwei einen Avatar-Platzhalter (`?` bzw. der Anfangsbuchstabe des
Namens), einer ein Aufklapp-Pfeilzeichen (▶). Sie bleiben neben der Skala (E-3) und stehen
unter **20 Ankern** namentlich in `tools/typo-map.js`, Abschnitt 7a. Die anderen **9** sind
Zahlen und Überschriften und bekommen ihre Sprosse — alle neun nach der Zuordnungstabelle,
**keine** braucht eine Sonderzuordnung.

**Der Plan nannte 20 und 11; gemessen sind es 22 und 9.** Die Differenz ist keine Rundung:
`.rt-empty-icon` und `.generator-empty-icon` standen dort als Textstellen („rt-empty und
generator-empty"), tragen aber gemessen das Emoji 🎲 — der Fließtext daneben heißt `-text`
und gehört dem Schritt 5. Dazu kommt `.enc-item-icon` in `@media (max-width: 600px)`: ihr
Sprung wäre nur −1,60 px, sie ist aber **mitgezogen**, weil der zeilenfreie Anker der
Ausnahmeliste Grundregel und Mobilfassung gemeinsam führt. Namentlich in `MITGEZOGEN`.

### Warum die Ikonen ihre Einheit verlieren

Das ist der Teil, der begründet sein muss, weil er 21 Deklarationen anfasst, die sichtbar
**nichts** ändern.

- **Die Umschreibung ist exakt.** Der Elternwert ist an allen 30 erreichten Urteilsstellen
  **16 px** — gemessen, bei 1440 **und** 375 px. `3.5em` ist dort keine Rechnung, sondern
  eine Schreibweise für 56 px. Belegt: im Grundlinien-Diff **null** Abweichungen bis 2 px,
  und das Charaktermodal ist im Bildvergleich in allen vier Themes **pixelgleich**.
- **Schranke 2 von W5-R-05 zählt die EINHEIT, nicht den Wert.** Mit 21 geduldeten
  em-Stellen wäre ihr Zielwert **27 statt 6** gewesen. Eine Schranke, deren Ziel ihre
  eigene Ausnahme verbietet, verspricht etwas, das sie nicht halten kann; Schritt 3 hat
  genau das als Falle übergeben.
- **Sieben von 22 sitzen in einem Kasten mit Pixelmaß** (`.loc-item-icon` 44×44,
  `.loc-detail-icon` und `.enc-detail-icon` 56×56, `.enc-item-icon` 40×40,
  `.npc-item-avatar` 44×44, `.timer-ctrl-btn` 50×50, `.dice-roll-btn` 50×44). Dort ist px
  die richtige Einheit und nicht nur die buchhalterische: ein Zeichen, das mitwächst,
  während sein Kasten es nicht tut, läuft über.

`28.8`, `22.4` und `17.6 px` sehen nach Tippfehlern aus und sind keine. W5-R-07b vergleicht
sie zeichengenau; wer sie auf 28, 22 und 18 rundet, ändert sichtbar und wird rot.

### Die neun Textstellen

| Stelle | gemessen | neu | Δ |
| --- | --- | --- | --- |
| `.dice-hero-result` (dice.css) | 80,00 px | `--text-hero` 72 | −8,00 |
| `.dice-result-main` (dashboard.css) | **0 Elemente** | `--text-hero` 72 | — |
| `.fdp-number` (dice.css) | 48,00 px | `--text-3xl` 34 | −14,00 |
| `.timer-hero-time` (tools.css) | 48,00 px | `--text-3xl` 34 | −14,00 |
| `.checkout-amount` (loot.css) | 28,80 px | `--text-2xl` 26 | −2,80 |
| `.char-attr-box .attr-input` (dashboard.css) | 22,40 px | `--text-xl` 20 | −2,40 |
| `.dms-dice-result` (dmscreen.css) | 22,40 px | `--text-xl` 20 | −2,40 |
| `.wiki-detail-title` (party.css) | 22,40 px | `--text-xl` 20 | −2,40 |
| ~~`.floating-toolbar .kbd-hint` (spells.css) | 8,00 px | `--text-xs` 11 | **+3,00**~~ | — | — | — |

**Die letzte Zeile ist in Runde 1 zurückgenommen worden**, die Tabelle hat seither **acht**
Zeilen. Grund: die Hebung erzeugt gemessen Überlappung. Siehe **W5-C Runde 1** weiter unten.

`.dice-result-main` hat **0 Elemente**: `#dice-result` existiert im Markup nicht, der
Rückfallpfad in `dice-core.js:372` findet seinen Behälter nie. Namentlich in `OHNE_MESSUNG`
mit Grund — eine 0 wäre dort eine Behauptung. **Der tote Behälter ist ein eigener Befund**
(siehe offene Punkte). Der Dead-CSS-Bericht hält die Klasse für lebendig, weil `dice-core.js`
ihren Namen als Zeichenkette führt; sie rendert trotzdem nie.

### Eine gemessene Nebenwirkung, die nicht verschwiegen wird

`.kbd-hint` von 8 auf 11 px lässt die fünf Tastenhilfen **überlappen**. Sie stehen absolut
unter ihren Knöpfen und werden bei `:hover` der Leiste **gemeinsam** sichtbar
(`.floating-toolbar:hover .kbd-hint { opacity: 0.7 }`). Gemessen, beide Stände, dieselbe
Sitzung:

| | Strg+B / Strg+I | Strg+I / Strg+U |
| --- | --- | --- |
| 8 px (vorher) | keine Überlappung | keine Überlappung |
| 11 px (nachher) | **2,80 px** | **3,09 px** |
| 11 px, breite Schrift | **9,50 px** | **9,74 px** |

~~Das ist eine **Layout-Frage** (welche Hilfe wann sichtbar ist) und keine Größenfrage; nach
Arbeitsregel 10 gehört sie nicht in eine Typografie-Welle. 8 px unlesbaren Text
stehenzulassen wäre die schlechtere Wahl — E-4 zieht die Untergrenze bei 11 px für alles,
was man liest.~~ **Dieser Absatz hat in Runde 1 nicht gehalten.** Die Abwägung „klein, aber
getrennt" gegen „größer, aber verschmolzen" ist nicht neutral: bei 11 px fällt der
Lückenabstand auf **null**, und die drei linken Hilfen rendern als eine einzige Zeichenkette
(`Strg+BStrg+IStrg+U`). Für drei von fünf erreicht die Hebung damit das Gegenteil ihres
Zwecks. Die Stelle ist zurückgenommen; siehe **W5-C Runde 1**. Die Zahlen stehen an der
Stelle im CSS.

**Nebenbefund dabei:** `.kbd-hint` erbt gemessen `Arial` und **nicht** `--font-ui`. Die
Linux-Nachstellung über `--font-ui` greift dort also gar nicht; die breite Schrift ist für
die Messung oben direkt an die Hilfe gelegt worden.

### Was dieser Schritt NICHT entschieden hat

- **E-3 ist nur für 22 von 73 Kandidaten entschieden.** Die übrigen **54**
  Ikon-Deklarationen springen um 2 px oder weniger. Die Ratsche dieses Schrittes begrenzt
  ihn ausdrücklich auf die eigenen Anker („wächst um genau diese Anker und keinen mehr"),
  und `W5-R-07e` sichert zu, dass keine davon still in der Dulde-Liste landet. **Schritt 5
  muss sagen**, ob er sie mechanisch auf eine Sprosse hebt — dann ist E-3 für sie nicht
  erfüllt, mit ≤ 2 px Wirkung — oder ob sie ebenfalls geduldet werden.
- **Die Untergrenze für Pfeilzeichen gehört Schritt 8.** `.wiki-tree-item-toggle` bleibt
  bei 8 px (gemessen 8,00 px in einer 12,8-px-Baumzeile): kein Lesetext, aber auch kein
  Emoji-Ikon. Er muss **gemeinsam mit `.tb-caret`** (editors.css, 9 px, ▾) entschieden
  werden — dasselbe Zeichen in derselben Rolle darf nicht zwei verschiedene Antworten
  bekommen. Beide stehen so im CSS. **Seit Runde 1 gehört `.floating-toolbar .kbd-hint`
  (8 px) zu demselben Bündel** — dort aber zusätzlich mit der Layoutfrage.

### Nachweise

**Grundlinien-Diff gegen die eingefrorene Grundlinie** (`grundlinie-v5.json`, HEAD
7e4aa09): 18325 gemeinsame Schlüssel, **50 Größenabweichungen in genau 10
Elementschlüsseln** (je 5 Läufe), **0 Gewichtsabweichungen**, Spanne **−14,00 … −2,40 px**,
und **null** Abweichungen bis 2 px. Werkzeug gegen Werkzeug (`nach-w5b.json`, dasselbe
Bündel `d189459c`, derselbe Browser `chromium-1217`): 0 Schlüssel nur alt, 0 nur neu, 0
Gewicht, 0 Sichtbarkeit; 64 Elementtreffer über 2 px in **5** Selektoren, alle benannt. Die
20 Zeilenhöhenwechsel sind Folgen von `line-height: 1` bzw. `1.5` an genau diesen Zahlen.

**Bildabgleich, vier Themes, vorher gegen nachher.** `truhe-leer` und das aufgeklappte
Encounter-Formular: **0 Pixel** in allen vier. Charaktermodal: **0 Pixel** in allen vier —
der Beleg, dass die em→px-Umschreibung der Ausnahmen ein Nulleingriff ist. `npcs-leer`,
`orte-leer`, `enc-leer`: 6–226 Pixel, alle in einem 60×60-Kasten unten links; eine
**Wiederholbarkeitsprobe desselben Baus** nennt dort **278** Pixel — das ist die
Animationsphase des schwebenden Würfelknopfes, nicht diese Änderung. `timer-hero`: ~2800
Pixel, die Uhr 48 → 34 px. `wuerfel-hero` und `dmschirm`: Höhe 851 → 843 bzw. 798 → 795 px,
die Folge der kleineren Zahlen.

**Stil-Sollstand bewusst neu erhoben** und Schlüssel für Schlüssel gelesen: **9 von 3549
Digests geändert, 0 Zugänge, 0 Abgänge** — drei Elemente in je drei Durchgängen
(`.dice-hero-result`, `.timer-hero-time`, `.dms-dice-result`) und **genau eine**
Eigenschaft, `fontSize`. `EXPECTED_DEVIATION_KEYS` und `_NARROW` bleiben **leer** (O-9).

**Linux-Nachstellung** (Verdana, Faktor 1,155) zeichengleich mit dem Stand vor dieser
Einheit: Überhang 0 px, Knopfsumme 262,6 px in 320 px, alle acht Listenspalten OK, G1 24
CI-Schlüssel.

**Keine einzige Zeile ist verschoben.** Alle 31 Kommentare sind **nachgestellt**; 120
Zeilenanker in `design-consistency.test.js` und 48 in dieser Akte zeigen in diese zehn
Dateien. Zeilenzahl je Datei vor und nach dem Lauf gemessen; der Diff zeigt 31 geänderte
und 31 entfernte Zeilen.

### Ratschen

Alle gesunken und exakt ausgereizt: `AUSSERHALB_MAX` **833 → 802**, `EM_MAX` **603 → 574**
(`EM_ZIEL` bleibt **6**, und das ist jetzt haltbar), `OFFEN_MAX` **833 → 802**. **Beide
Schranken stehen auch nach Runde 1 auf 802** — nachgemessen, Begründung dort. Unverändert:
DUBLETTEN 0, `!important` 105, Inline-Stile 254, `transition: all` 0, `SVG_MAX` 3. Lint
Exit 0 mit **363** Warnungen, typecheck und typecheck:strict Exit 0, beide Builds Exit 0,
pytest 30, Jest **2069/2069 in 77 Suiten**, Playwright **595 bestanden / 27 übersprungen /
0 Fehlschläge**, `check-f18-kaskade` OK (126/126), `sync-aktenlage-anker` 0 Abweichungen.

### Offene Punkte

- **Der tote Würfel-Behälter.** `#dice-result` gibt es nicht; `dice-core.js:372` und die
  CSS-Regeln `.dice-result-main`, `.dice-result-detail`, `#dice-result-extra` hängen an
  einem Markup, das keine Vorlage mehr erzeugt. Der Dead-CSS-Bericht hält sie für lebendig,
  weil der Klassenname als Zeichenkette im JS steht. Eigene Aufräumarbeit, keine
  Typografie.
- ~~**Die Überlappung der Tastenhilfen** (oben beziffert) braucht eine
  Layout-Entscheidung.~~ **In Runde 1 beseitigt** (Rücknahme auf 8 px). Was bleibt, ist
  die Kopplung: wer die Hilfen je größer setzt, muss die Layoutregel **mit** ändern —
  naheliegend, nur die Hilfe des **berührten** Knopfes zu zeigen statt aller fünf. Gehört
  jetzt zum Bündel unten.
- **Die 54 unbeurteilten Ikon-Kandidaten** (Schritt 5) und **die Untergrenze für
  Kleinstschrift** (Schritt 8): `.wiki-tree-item-toggle` (8 px) + `.tb-caret` (9 px) +
  seit Runde 1 `.floating-toolbar .kbd-hint` (8 px, **mit** der Layoutregel).
- **Die Uhr im 250-px-Ring wirkt bei 34 px kleiner als nötig.** Die Skala hat zwischen 34
  und 72 px keine Sprosse; 72 würde mit „Kein Timer" darunter kollidieren. Wenn eine
  Zwischensprosse je gebraucht wird, ist dies die Stelle, die danach fragt.
- **Weiterhin offen aus W5-A/W5-B und von dieser Einheit nicht berührt:** die oertlich
  nicht lauffähige E2E-Suite (`playwright-core` 1.57.0 verlangt Chromium-Revision 1200, im
  Zwischenspeicher liegen 1217/1234/1243 — diese Einheit ist wieder über
  `TYPO_BASELINE_CHROMIUM` und `PLAYWRIGHT_BROWSERS_PATH` gefahren, der Zwischenspeicher
  des Nutzers ist **nicht** angefasst; saubere Behebung: einmal
  `npx playwright install chromium`), die zehn kaputten `woff2`, der `file://`-Pfad der
  gebündelten Schriften, die vier wirkungslosen Editor-Schriften, die fehlende
  Glyphendeckungs-Probe, `npm run check` vorbestehend rot (`prettier --check` über den
  ganzen Baum; die zehn geänderten CSS-Dateien waren schon vorher nicht konform,
  `tools/typo-map.js` und der neue Block in `design-consistency.test.js` sind es), und die
  Restschuld der Folgeschritte: IMPORTANT_MAX 105 → 104 (O-2), INLINE_MAX 254 → 252 (O-6),
  die 36 Formularelemente auf Browser-Vorgabe (O-10), die Neuerhebung des Stil-Sollstands
  am Wellenende (O-9).

### Befehle

```bash
# Der Wächter über die geschlossene Menge (7 Fälle)
npx jest tests/unit/design-consistency.test.js -t "W5-R-07"

# Die Rechnung nach dem Schritt: 853 = 11 Sprossen + 7 inherit + 33 geduldet + 802 offen
# (seit Runde 1: 10 Sprossen + 7 inherit + 34 geduldet + 802 offen — OFFEN unverändert)
node tools/sync-typo-tokens.js --check

# Die 31 im Delta-Bericht — nach dem Schritt ist die Liste über 2 px LEER
node tools/sync-typo-tokens.js --report | sed -n '/STELLEN MIT SPRUNG > 2 px/,/STELLEN MIT SPRUNG <= 2 px/p'
```

---

## W5-C Runde 1 — die Hebung auf 11 px hat drei Tastenhilfen verschmolzen (2026-10-06)

**Status: ERLEDIGT.** Nachbesserung der Einheit W5-C nach der Prüfrunde. Vier Commits
(`39aef23 → HEAD`), **eine Zeile CSS** — und sie geht zurück, nicht vor. Der dritte Commit
nimmt eine Zahl zurück, die die Prüfrunde vorgerechnet hatte und die nachgemessen nicht
stimmte; der Abschnitt **Ratschen** unten führt sie.

### Der Befund in einem Satz

`.floating-toolbar .kbd-hint` von 8 auf 11 px zu heben macht die drei linken Tastenhilfen
**schlechter** lesbar, nicht besser: der Lückenabstand fällt auf null, und „Strg+B",
„Strg+I", „Strg+U" rendern als eine einzige Zeichenkette.

### Warum das keine Geschmacksfrage ist

Die Hilfen hängen **absolut** unter ihren Knöpfen und nehmen im Fluss der Leiste keinen
Platz ein (`position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%)`).
Ihre Breite ist die Breite ihres Textes, ihr Abstand der Abstand ihrer Knöpfe (2 px Spalt,
`padding: 6px 10px`). **Wächst die Schrift, wächst nur der Text — der Platz dazwischen
nicht.** Gemessen, eigener Bau, gefüllte Kampagne, 1440 px:

| | Strg+B / Strg+I | Strg+I / Strg+U | Strg+U / Strg+K | Strg+K / Strg+⇧+T |
| --- | --- | --- | --- | --- |
| **8 px** | +5,86 | +5,67 | +52,11 | +80,22 |
| **11 px** | **−2,80** | **−3,09** | +42,78 | +69,28 |
| 8 px, breite Schrift | +2,30 | +1,90 | +48,05 | +74,94 |
| **11 px, breite Schrift** | **−8,20** | **−8,68** | +37,06 | +62,02 |

Negative Lücke heißt Überlappung. Die Zahlen des ursprünglichen Laufs sind damit **in der
Standardschrift exakt bestätigt** (2,80 / 3,09); für die breite Schrift wurden dort 9,50 und
9,74 px genannt, hier gemessen 8,20 und 8,68 — dieselbe Größenordnung, dieselbe Aussage.

**Es ist der Normalfall, kein Randfall.** `.floating-toolbar:hover .kbd-hint` hängt an der
**Leiste**, nicht am berührten Knopf. Wer die Leiste irgendwo berührt, sieht alle fünf
gleichzeitig; einen Zustand mit nur einer Hilfe gibt es nicht.

### Warum die ursprüngliche Abwägung nicht trug

Die Einheit hat die Nebenwirkung gemessen, benannt und bewusst in Kauf genommen: „8 px
unlesbaren Text stehenzulassen wäre die schlechtere Wahl". Diese Abwägung setzt voraus, dass
11 px lesbarer sind als 8 px. **Für drei der fünf Hilfen trifft das nicht zu** — sie sind bei
11 px größer **und** ohne Worttrennung. Eine Welle, die einen Lesbarkeitsmangel durch einen
anderen ersetzt und beide offen lässt, hat an dieser Stelle nichts gewonnen.

Dazu kommt die **Ungleichbehandlung im eigenen Haus**: die beiden anderen Stellen unter
11 px — `.wiki-tree-item-toggle` (8 px) und `.tb-caret` (9 px) — hat dieselbe Einheit
ausdrücklich stehengelassen und **gemeinsam** an Schritt 8 übergeben, mit der Begründung,
dass zwei gleiche Zeichen nicht zwei Antworten bekommen dürfen. Die Tastenhilfe ging denselben
Weg nicht.

### Was geändert wurde

| Stelle | vorher | nachher |
| --- | --- | --- |
| `assets/styles/spells.css` | `var(--text-xs)` | `8px`, Kommentar nachgestellt |
| `tools/typo-map.js` Abschnitt 7a | 20 Anker | **21** Anker, eigener Eintrag mit Messung |
| `tools/typo-map.js` Kettenanker | Wert `var(--text-xs)`, kindPx 11 | Wert `8px`, kindPx 8 |
| `URTEIL_IKON` | 22 Zeilen | **23** |
| `URTEIL_TEXT` | 9 Zeilen | **8** |

23 + 8 = 31; die Menge des Schrittes ist unverändert. **Die Zeilenzahl von `spells.css`
bleibt 711** — der Kommentar ist nachgestellt, kein Zeilenanker verschiebt sich.

Der Kettenanker **trägt den Wert** und musste darum zum zweiten Mal mitwandern, sonst träfe
die Verwesungsprobe in `typo-map.test.js` ihn nicht mehr und die Kante hörte lautlos auf zu
urteilen.

### Die Zusicherung, und was sie NICHT festschreibt

`tests/e2e/features/tastenhilfen.spec.js`, **4 Fälle**:

1. alle fünf Hilfen werden bei einer Berührung **gemeinsam** sichtbar (belegt, dass es der
   Normalfall ist, statt den Selektor nur zu lesen),
2. keine zwei berühren einander in der Standardschrift,
3. dasselbe in der **breiten Schrift** (Verdana, Linux-Näherung — `.kbd-hint` erbt gemessen
   `Arial` und **nicht** `--font-ui`, die Umlegung sitzt deshalb direkt an der Hilfe),
4. unter 901 px nimmt `@media (max-width: 900px)` die Hilfen weg — ohne diesen Fall sicherten
   die drei anderen auf Telefonbreiten etwas zu, das dort nicht gilt.

**Der Fall schreibt keine Schriftgröße fest.** Er verlangt nur Platz zwischen zwei Hilfen.
Schritt 8 darf sie größer setzen — dann aber **mit** der Layoutregel. Genau diese Kopplung ist
der Zweck: Größe und Anordnung dürfen hier nicht getrennt entschieden werden.

### Ratschen

**`AUSSERHALB_MAX` und `OFFEN_MAX` bleiben auf 802 — und das ist nachgemessen, nicht
angenommen.** Die Prüfrunde hatte 803 vorgerechnet; das ist falsch. Die Stelle wandert von
**„bereits auf einer Sprosse"** (11 → 10) nach **„namentlich geduldet"** (33 → 34). Beide
Mengen liegen **außerhalb** dessen, was diese Schranken zählen — die offene Menge berührt sie
weder vorher noch nachher. `node tools/sync-typo-tokens.js --check` nach der Rücknahme:

```
  font-size-Deklarationen gesamt      :  853
    davon bereits auf einer Sprosse   :   10
    davon inherit (legt nichts fest)  :    7
    davon namentlich geduldet         :   34
  OFFEN (zuordenbar, noch nicht Token):  802
```

Und `W5-R-05a`, mit der Schranke vorübergehend auf 0 gesetzt, um die gemeldete Zahl zu lesen:
`ausserhalbDerSkala: 802, geduldet: 32, gesamt: 853`. **Wer hier auf 803 angehoben hätte,
ließe beide Schranken um eine Stelle locker stehen** — genau der Fehler, den diese Akte an
anderer Stelle schon einmal festgehalten hat („eine Schranke, die nach einer Änderung um sechs
Stellen locker steht, bewacht sechs Stellen weniger als sie behauptet"). `EM_MAX` bleibt
**574** (die Stelle war nie `em`), DUBLETTEN 0, `!important` 105, Inline-Stile 254,
`transition: all` 0.

### Ein Gate hat zugeschlagen, und es ist nicht umgangen worden

Der Kopfkommentar des neuen Falls nannte `rich-text-toolbars.js` mit vollem Pfad — worauf
`module-test-coverage.test.js` das Modul als abgedeckt zählte und rot wurde. Das Gate sucht
Modulpfade als Teilzeichenkette in **allen** Testdateien und zählt jeden Treffer, auch einen
im Erklärtext. Die Datei prüft das Modul nicht, sie nennt es als Herkunft der Klasse
`visible`. Also **Kurzform plus Begründung an Ort und Stelle**, wie beim Präzedenzfall
`dice-core.js` in `OHNE_MESSUNG`; die Ausnahmeliste bleibt unberührt. Die Alternative — das
Modul von der Liste streichen — hätte eine Abdeckung behauptet, die es nicht gibt.

### Nachweise

**Rot vor grün, beziffert.** Der Fall wurde gegen den gebauten Stand `39aef23` gefahren und
meldete 2 von 4 Fällen rot mit genau den Zahlen der Tabelle oben; nach der Rücknahme 4/4 grün.
Beide Läufe stehen in den Commit-Nachrichten `4f30c1f` und `ab38cc3`.

**Gegenprobe mit einem Kontrollbau.** Statt `5f313a6` auszuchecken (30 weitere geänderte
Deklarationen) wurde **nur die eine Zeile** auf `8px` zurückgesetzt und gebaut — ein
Experiment mit genau einer Variablen. Beide Bauten in derselben Sitzung, demselben Browser,
derselben Kampagne gemessen.

**Volle Tore:** Jest **2069/2069 in 77 Suiten**, Playwright **599 bestanden / 27 übersprungen /
0 Fehlschläge** (595 + die vier neuen), pytest 30, Lint Exit 0 mit **363** Warnungen,
typecheck und typecheck:strict Exit 0, beide Builds Exit 0, `check-f18-kaskade` OK (126/126),
`sync-aktenlage-anker` 0 Abweichungen.

### Offene Punkte

- **Die Untergrenze für Kleinstschrift ist jetzt ein Bündel aus drei Stellen** (Schritt 8):
  `.wiki-tree-item-toggle` 8 px, `.tb-caret` 9 px, `.floating-toolbar .kbd-hint` 8 px. Die
  dritte unterscheidet sich von den beiden anderen: sie trägt **Lesetext** und ist damit die
  einzige, für die E-4 unmittelbar gilt — sie ist nur deshalb nicht gehoben, weil die
  Anordnung es nicht zulässt. **Ohne Layoutänderung ist sie nicht lösbar.**
- **Eine Ungenauigkeit im Kopfkommentar von Abschnitt 7a, nicht angefasst:** dort steht
  „ZWEI ANKER DECKEN DREI DEKLARATIONEN MEHR, als die Liste Zeilen hat". Gemeint und richtig
  sind **zwei** (`.enc-detail-icon` und `.enc-item-icon`, je Grundregel + Mobilfassung). Der
  Satz war schon vor dieser Runde so und ist kein Befund dieser Prüfung; er wird hier nur
  benannt, damit er nicht als geprüft gilt.
- Unverändert aus W5-C: der tote Würfel-Behälter, die 54 unbeurteilten Ikon-Kandidaten, die
  Uhr im 250-px-Ring, und die Restschuld aus W5-A/W5-B (örtlich nicht lauffähige E2E-Suite —
  diese Runde ist wieder über `PLAYWRIGHT_BROWSERS_PATH` gefahren, der Zwischenspeicher des
  Nutzers ist **nicht** angefasst; die zehn kaputten `woff2`, der `file://`-Pfad der
  gebündelten Schriften, `npm run check` vorbestehend rot).

### Befehle

```bash
# Die Zusicherung (4 Fälle, Browser)
npx playwright test tests/e2e/features/tastenhilfen.spec.js

# Der Wächter über die geschlossene Menge (7 Fälle)
npx jest tests/unit/design-consistency.test.js -t "W5-R-07"

# Die Rechnung nach der Rücknahme: 853 = 10 Sprossen + 7 inherit + 34 geduldet + 802 offen
node tools/sync-typo-tokens.js --check
```

---

## W5-D — der atomare Commit: 801 Schriftgrößen erzeugt, nicht getippt (2026-10-06)

**Status: ERLEDIGT.** Fünfte Einheit der Welle 5, Schritt 5 des geprüften Plans. Sechs
Commits, `44d33da → ebc2914`. Der mechanische Lauf selbst ist **ein** Commit; alles,
worüber ein Mensch urteilen musste, steht davor in eigenen, kleinen Commits — so, wie
`plan.atomar_wie` es verlangt.

### Was gelaufen ist

`node tools/sync-typo-tokens.js --only=<datei>`, achtzehnmal, eine Datei je Lauf. **Kein
Byte von Hand getippt.** 801 Deklarationen in 18 Dateien: party 97, dmscreen 94, core 88,
dashboard 77, tools 74, welt 61, encounters 60, npcs 52, initiative 51, loot 28, dice 27,
spells 23, bestiary 21, editors 19, migration 15, file-backup 8, command-palette 4, pwa 2.

`--check` schweigt: **853 = 811 auf einer Sprosse + 7 `inherit` + 35 geduldet + 0 ohne
Tabellenzeile + 0 in geschützter Familie + 0 OFFEN**, Rückgabewert 0. Der Lauf ist
**wiederholbar**: die achtzehn Einzelläufe liefern byteweise dasselbe wie ein Lauf über den
ganzen Baum (`diff -rq`, leer).

**Die drei Zahlen, die den Charakter des Diffs belegen:** 801 entfernte und 801 eingefügte
Zeilen, **jede einzelne mit `font-size` im Text** (nachgezählt am Diff — es ist keine
Fremdänderung mitgelaufen). **158** Deklarationen mit Delta exakt 0,00 px: px-Literale, die
schon auf einem Skalenwert lagen. Ihr Text ändert sich, ihr Bildpunkt nicht — der Beleg,
dass das Werkzeug **benennt** statt zu rechnen. Und **0 von 801** springen über 2 px.

### Die zwei Urteile, die der Lauf erzwungen hat

**(1) Die 54 unbeurteilten Ikon-Kandidaten werden mechanisch gehoben.** W5-C hat diese
Frage ausdrücklich offen übergeben („beides ist vertretbar, keines darf unbemerkt
passieren"). Gemessen springt **keine** von ihnen über 2 px (Spanne -2,00 .. +2,00, mehrere
bei 0,00). E-3 ist für sie damit **nicht** erfüllt, mit ≤ 2 px Wirkung. Der Gegenweg hätte
die Ausnahmeliste von 32 auf 86 Anker getrieben — eine Liste, die den größeren Teil des
Befundes umfasst, bewacht nichts mehr (dieselbe Lehre wie O-5) — und wäre an `W5-R-07e`
gescheitert, das sie namentlich NICHT geduldet sehen will.

**(2) `.tb-caret` bleibt bei 9 px, damit das Pfeilpaar zusammenbleibt.** Der Lauf hätte es
auf 11 px gehoben (+2,00 px liegt in seiner Menge), während sein Zwilling
`.wiki-tree-item-toggle` bei 8 px bleibt (+3,00 px liegt außerhalb) — genau die Aufspaltung,
die W5-C an **drei** Stellen verboten hat. **Die Hebung wäre gemessen harmlos:** Knopf
+1,67 px (87,88 → 89,55 und 107,91 → 109,58), Höhe 30 px und Leiste 43 px unverändert,
Spalt zur Beschriftung 7,00 px (keine Überlappung), Zeichen bleibt im Knopf — bei 1440 UND
375 px. Sie bleibt trotzdem aus, weil Schritt 8 für **beide** entscheidet. Dazu die zweite
Hälfte der Antwort für Schritt 8: **`.wiki-tree-item-toggle` hat auf gefüllter Kampagne
0 Elemente** (nachgemessen in allen fünf Grundlinien-Läufen und direkt am DOM). Neu bewacht
von `W5-R-07f`: erlaubt sind genau zwei Lagen — beide geduldet oder beide auf einer Sprosse.

### Grundlinien-Diff

**Werkzeug gegen Werkzeug** (Erhebung vor und nach dem Lauf, dieselbe Browser-Fassung
chromium-1217, gefüllte Kampagne, 24 Ansichten, vier Themes, 1440 und 375 px):
**18255 verglichene Schlüssel, 0 nur alt, 0 nur neu. 0 Größenänderungen über 2 px,
Spanne -2 .. +2 px. 0 Gewichts- und 0 Sichtbarkeitswechsel.**

Die 5230 gemeldeten **Zeilenhöhen**-Änderungen sind **alle 5230 abgeleitet**, und das ist
nachgerechnet und nicht angenommen: das Verhältnis Zeilenhöhe/Schriftgröße bleibt in jedem
einzelnen Fall gleich (±1 %), und es gibt **keinen** Fall, in dem die Zeilenhöhe wandert,
während die Schriftgröße steht. O-11 hält also: `line-height` ist nicht ausgerollt.

**Gegen die eingefrorene Grundlinie** (`v5-vermessung/typo-grundlinie/grundlinie-v5.json`,
HEAD 7e4aa09): 50 Größenabweichungen über 2 px in **genau 10 Elementschlüsseln** (je 5
Läufe), Spanne -14 .. +2 px — **dieselben zehn, die W5-C gemeldet hat**, keine einzige neue.
Alle zehn sind Urteilsstellen des Schrittes 4: `.dice-hero-result` 80→72,
`.dms-dice-result` 22,4→20, sechs `input.attr-input` 22,4→20, `.fdp-number` 48→34,
`.timer-hero-time` 48→34.

**Die Wirkung der Welle, in zwei Zahlen:** Anteil auf einer Sprosse (sichtbare Elemente)
**57,57 → 92,30 %** (dark-1440), 63,97 → 92,68 % (light/sepia/contrast), 60,47 → 91,89 %
(dark-375). Sichtbare Textelemente unter 11 px **95 → 25** bzw. 49 → 23; im DOM 249 → 35
bzw. 153 → 31. Das Minimum bleibt **7 px** — das sind die SVG-Präsentationsattribute in
`dice-stats-render.js` (O-7), und die gehören Schritt 8.

### Linux-Nachstellung

Gefahren als Vergleich **Vorzustand (8d1fd01) gegen Nachzustand**, je mit Segoe und mit
Verdana (Faktor 1,155), bei 1440 und 375 px, über alle 24 Ansichten:

- **Waagerechter Textüberlauf 0 → 0** in allen vier Kombinationen.
- **Seitenüberlauf 0 → 0** in allen vier Kombinationen.
- Senkrechter Textüberlauf 1 → 5 unter Segoe, **1 → 1 unter Verdana**. Die Differenz ist
  nachgemessen **keine neue Lage, sondern eine Rundungsschwelle**: `.party-stat-value` trägt
  `line-height: 1.2`, das enger ist als der natürliche Zeilenkasten von Segoe UI. Vorher
  24 px, Kasten 28,80, Glyphenkasten 30 → Überhang **1,20 px**. Nachher 26 px, Kasten 31,19,
  Glyphenkasten 33 → Überhang **1,81 px**. Es schneidet nichts ab: die Karte trägt
  `overflow: visible`, der Spalt zur Beschriftung bleibt **4,00 px**, der Glyphenkasten endet
  49 px innerhalb der Kartenkante, und die Karte wächst 139,58 → 140,19 px. Der fünfte Fall,
  `.dice-hero-result` (+12 Segoe / +7 Verdana), ist **vorbestehend** und von diesem Schritt
  unberührt.

### Zwei Folgen, die kein Werkzeug von sich aus erzeugt

**Der F-18-Kaskadenstand: 126 → 117 Abhängigkeiten, 0 GEDREHTE und 0 NEUE.** Das
Abnahmemaß ist die Art, nicht die Zahl: eine Drehung ist die F-18-Fehlerklasse. Die neun
entfallenen sind einzeln nachgerechnet und stehen mit alten und neuen Werten im Kopf von
`tests/unit/f18-kaskade.test.js` — bei allen neun tragen **beide** Konkurrentinnen jetzt
denselben Wert, also entscheidet die Reihenfolge nichts mehr.

**Der Stil-Sollstand: 1143 von 3549 Digests bewegt (32,21 %), 0 Zugänge, 0 Abgänge.** Mehr
als die Vorhersage (660–815), und der Grund ist nachgemessen: die Digest-Liste enthält neben
`fontSize` auch `padding` und `margin`. Eine Gegenprobe über 3082 gemeinsame
Elementschlüssel nennt, **welche** Eigenschaft wirklich wandert — `fontSize` 1394,
`margin` 11, `opacity` 1 (ein Animationsbild), und **`padding` 0, `borderRadius` 0,
`color` 0, `backgroundColor` 0, `borderColor` 0, `boxShadow` 0, `display` 0, `textAlign` 0,
`fontWeight` 0**. Die elf Ränder sind `margin-left: auto` (editors.css:642,
dmscreen.css:2407), also der übrige Platz, der der Breite des Nachbartextes folgt; kein
px-Rand dieser Größenordnung existiert irgendwo im CSS. **Beide Ausnahmelisten bleiben
leer** — `EXPECTED_DEVIATION_KEYS` steht unverändert auf `[]`.

### Ein Irrtum, der in die Akte gehört

Die neun entfallenen F-18-Paare sahen zuerst nach **gelöschten Markern** aus: ein
einseitiger Vergleich zählte nur die entfernten Zeilen mit Kommentar (9) und nicht die
hinzugefügten. Der Lauf wurde daraufhin zurückgenommen und erst nach der Gegenprobe erneut
gefahren. Nachgemessen sind es **9 entfernte UND 9 hinzugefügte** Kommentarzeilen, und die
Markerzahl je Datei ist gegen HEAD unverändert (112: core 3, dashboard 19, dice 7,
dmscreen 31, loot 1, npcs 25, party 3, spells 11, welt 12). Das Werkzeug ersetzt nur die
Zeichengrenzen des **Wertes**; ein nachgestellter Kommentar liegt dahinter. Belegt an einem
Kunstfall mit und ohne abschließendes Semikolon.

### Schranken

`AUSSERHALB_MAX` **802 → 801** (Urteil `.tb-caret`) **→ 0** (der Lauf). `EM_MAX` **574 → 6**
— genau die sechs Überschriftenstufen h1 bis h6 des Reichtext-Inhalts, keine siebte. Beide
stehen damit erstmals auf ihrem **Zielwert** und können nicht mehr sinken; sie fallen beim
ersten neuen px- oder em-Literal. `SVG_MAX` bleibt 3 (O-7, Schritt 8). Unberührt:
DUBLETTEN 0, `!important` 105, Inline 254, `transition: all` 0.

**E-2 hält punktgenau:** die fünf Eingabefelder mit 16 px tragen jetzt `var(--text-lg)` =
16 px. Die Auto-Zoom-Schwelle ist nicht unterschritten.

### Offene Punkte

- **Die Untergrenze für Kleinstschrift ist unverändert ein Bündel aus drei Stellen**
  (Schritt 8), aber jetzt mit Zahlen für zwei von ihnen: `.tb-caret` 9 px (Hebung gemessen
  harmlos), `.wiki-tree-item-toggle` 8 px (0 gerenderte Elemente),
  `.floating-toolbar .kbd-hint` 8 px (Hebung erzeugt Überlappung, ohne Layoutänderung nicht
  lösbar). Die erste Frage, die Schritt 8 beantworten muss, ist, ob ein **Pfeilzeichen**
  überhaupt in die Textskala gehört; die Zahlen dafür liegen jetzt vor.
- **`.party-stat-value` trägt eine Zeilenhöhe, die enger ist als ihr Glyphenkasten**
  (1,81 px Überhang bei 26 px, vorher 1,20 bei 24 px; unter Verdana gar keiner). Es schneidet
  nichts ab, und `line-height` ist nach O-11 nicht Gegenstand dieser Welle — aber wenn die
  drei `--leading-*` je ausgerollt werden, ist dies die Stelle, an der sich das lohnt.
- **Die 1143 bewegten Digests sind ein Zwischenstand, nicht die Summe der Welle.** O-9
  verlangt am Wellenende eine Erhebung mit beziffertem Delta; W5-C hat 9 Digests bewegt,
  diese Einheit 1143. Schritt 9 muss die **Summe über alle Schritte** nennen, nicht die
  letzte Zahl.
- Unverändert aus W5-A/W5-B/W5-C: der tote Würfel-Behälter, die Uhr im 250-px-Ring, die
  örtlich **nicht lauffähige E2E-Suite** (`playwright-core` 1.57.0 verlangt
  Chromium-Revision 1200, im Zwischenspeicher liegen 1217/1234/1243 — diese Einheit ist
  wieder über `PLAYWRIGHT_BROWSERS_PATH` und `TYPO_BASELINE_CHROMIUM` gefahren, der
  Zwischenspeicher des Nutzers ist **nicht** angefasst; saubere Behebung: einmal
  `npx playwright install chromium`), die zehn kaputten `woff2`, der `file://`-Pfad der
  gebündelten Schriften, die vier wirkungslosen Editor-Schriften in `EDITOR_FONTS`, die
  fehlende Glyphendeckungs-Probe, `npm run check` vorbestehend rot.
- Restschuld der Folgeschritte, unverändert: `IMPORTANT_MAX` 105 → 104 (O-2), `INLINE_MAX`
  254 → 252 (O-6), die 36 Formularelemente auf Browser-Vorgabe (O-10), die drei
  SVG-Präsentationsattribute (O-7).

### Befehle

```bash
# Die Abnahme des Schrittes: --check schweigt, Rueckgabewert 0
node tools/sync-typo-tokens.js --check

# Die Delta-Tabelle und die Kandidatenmengen
node tools/sync-typo-tokens.js --report --kategorien

# Die Ketten-Ordnung kippt nicht (0 Kanten)
node tools/sync-typo-tokens.js --ketten

# Das neue Pfeilpaar-Tor und der Urteilsblock (8 Faelle)
npx jest tests/unit/design-consistency.test.js -t "W5-R-07"

# Der F-18-Kaskadenstand (117 Abhaengigkeiten)
node tools/check-f18-kaskade.js --check
```

---

## W5-D Runde 1 — zwei Zuordnungen rechneten gegen eine Annahme statt gegen die Messung (2026-10-06)

**Status: ERLEDIGT.** Prüfrunde zur Einheit W5-D. Beide Befunde der Prüfung sind
nachgemessen **bestätigt** und behoben; keiner wurde zurückgewiesen. Fünf Commits,
`5a06ca5 → 9892508`, Reihenfolge nach `plan.atomar_wie`: zuerst der rote Nachweis, dann
die Urteile, dann das Werkzeugergebnis.

### Die gemeinsame Ursache, in einem Satz

`altPx()` rechnet jede `em`-Angabe gegen eine 16-px-Wurzel und **nennt das selbst eine
Annahme**; an zwei Stellen trifft sie nicht, und an beiden ist der wirkliche Sprung größer
als der gerechnete. Die 2-px-Abnahme des Schrittes 5 prüfte gegen denselben angenommenen
Altwert — sie konnte den Fehler also nicht finden, weil sie ihn teilte.

### Befund 1 (blocker) — `.rest-type-icon` sprang um +7,33 px und nicht um +2,00

`party.css:2123` sitzt in `<button class="rest-type-btn">`, und dieser Knopf trägt in der
**ganzen App keine** `font-size`: die einzige Regel, die Schaltflächen `inherit` gibt,
gilt nur in `.loc-toolbar`. Also entscheidet das Stilblatt des Browsers — Chrome setzt an
`button` **13,3333 px**, nicht 16. `2em` sind dort gemessen **26,67 px**, die Tabelle gab
`--text-3xl` = 34 px. Nachgemessen am gebauten Bündel mit geöffnetem Rast-Modal wuchs die
Karte von **237x111 auf 237x123 px**.

**Vier Schranken waren an dieser Stelle blind,** und das ist der eigentliche Befund:
`KETTEN` kann die Kante nicht führen (ihr Anker `datei||selektoren||wert` braucht eine
Elterndeklaration, und es gibt keine); die eingefrorene Grundlinie läuft nur über
`#view-*` und fünf Rahmen, **Modale liegen außerhalb**, und die Stelle steht nur im
Rast-Modal; die 2-px-Abnahme rechnete mit der Annahme; `W5-R-07e` zählt die
Ikon-Kandidaten, urteilt aber nicht über ihren Sprung.

**Behebung:** Sonderzuordnung mit dem neuen, vierten Grund `browser-vorgabe` auf
`--text-2xl` (26 px, Sprung **-0,67 px**). Der Grund ist ausdrücklich **nicht** `kette` —
alle 16 `kette`-Einträge sind nachgemessen Kinder in `KETTEN`, und `grund: 'kette'` hätte
eine Herkunft behauptet, die es nicht gibt (dieselbe Überlegung, mit der
`kette-reichtext` entstanden ist). **Keine Ausnahme:** 26 px liegen innerhalb der 2-px-
Abnahme, unter der Schritt 5 alle 54 unbeurteilten Ikon-Kandidaten mechanisch gehoben
hat — die Begründung jener Entscheidung gilt also weiter, die Ausnahmeliste bleibt bei
**35** Ankern, `W5-R-05a` bleibt bei **0**, und `W5-R-07e` bleibt bei 73/54.

### Befund 2 (major) — unter der Linux-Metrik brach bei 375 px die Leiste zweier Ansichten um

`editors.css:745`, `.section-toolbar-title` im Block `@media (max-width: 600px)`:
`0.9em` → `var(--text-md)`. Der Elternwert ist dort **14 px**, die Schrift ging also
12,6 → 14 px (**+1,40**), und die Titelgruppe wurde 10,4 px breiter. Gemessen auf
gefüllter Kampagne bei 375 px unter der Verdana-Nachstellung (1,155x), VOR gegen NACH:

| Ansicht | belegt (Titel + Lücke + Aktion) von 331 px | Leiste | Listenspalte |
| --- | --- | --- | --- |
| encounter | 322,64 → **333,04** | 158 → **187** px | `.enc-master` 305,2 → **276,2** px |
| kalender | 324,37 → **342,59** | 146 → **175** px | – |
| npcs | 321,99 → **328,44** | 179 → 179 px | 383 → 383 px |

Aus **einer** Zeile werden **zwei**, die Leiste wächst um 29 px, und bei `encounter` gehen
diese 29 px **1:1 aus der scrollenden Listenspalte**, weil die Ansicht höhenbegrenzt ist.
Das ist dieselbe Größenordnung, die der C1-Kommentar in `editors.css:752` als Gewinn der
Welle 4 verbucht — nur rückwärts. `npcs` stand mit 2,56 px Reserve am selben Kippen.

**Warum nichts rot wurde:** waagerechter Überlauf und Seitenüberlauf blieben in allen vier
Kombinationen **0**. Es wird nichts abgeschnitten; der Umbruch ist gültiges
Flex-Verhalten. Unter Segoe passiert gar nichts (158/158, 146/146). `breite-schrift.spec.js`
maß Überlauf und Spaltenhöhe bei 320/360 — nicht die **Zeilenbelegung** bei 375.

**Behebung:** Sonderzuordnung mit Grund `kette` auf `--text-sm` (12 px, Sprung
**-0,60 px** statt +1,40). Die Kante stand **schon** in `KETTEN` (Elternwert 14 px,
gemessen 12,6 px, 24 Elemente) — nur urteilte dort nichts über die **Größe** des Sprungs,
bloß über die Ordnung, und 12,6 → 14 kippt die Ordnung nicht (14 ≤ 14). Nach der Korrektur
sind Leiste und Listenspalte **exakt** auf dem Stand vor der Welle (encounter 158 px /
305,2 px), die Belegung mit 318,19 px sogar besser als die 322,64 px von davor.

### Die eigene Erhebung, die die Grundlinien-Lücke geschlossen hat

Weil die Grundlinie Modale nicht sieht, ist für diese Runde eigens über **49 Zustände**
gemessen worden: alle 24 Ansichten mit geöffneten Aufklapp-Formularen **plus 24 geöffnete
Modale**, gefüllte Kampagne, 1440x900, am VOR-Bündel (`44d33da`, `em` noch im Baum).
Erfasst wurde jede `font-size`-Regel mit em-Wert samt gemessenem Elternwert.

**207** em-Regeln sichtbar · **28** auf einem Elternwert ≠ 16 px · **7** mit einem
Formularelement als Eltern · **5** davon auf der Browser-Vorgabe 13,3333 px. Über die
2-px-Abnahme geht, gerechnet gegen den **gemessenen** Wert und **mit** den vorhandenen
Sonderzuordnungen, **genau eine**: `.rest-type-icon`. Die anderen vier liegen bei
+0,67 … +1,33 px, die restlichen 23 bei -1,60 … +1,82 px.

Diese fünf Stellen stehen jetzt als Bestandsliste im Wächter (`W5-W12`), mit zwei
Zusicherungen: **keine** springt gegen ihren gemessenen Wert um mehr als 2 px, und wo die
**Tabellenzeile** darüber hinausgriffe, muss eine Sonderzuordnung entscheiden — und wo
nicht, darf keine stehen (eine Sonderzuordnung ohne Not wäre eine Abweichung ohne Grund).

### Eine falsche Messung in der Akte, zurückgenommen statt übergangen

`tests/unit/design-consistency.test.js` behauptete für die 54 Ikon-Kandidaten eine
„Spanne -2,00 .. +2,00 px, mehrere bei 0,00". Diese Spanne war gegen den **angenommenen**
Altwert gerechnet; `.rest-type-icon` ist Nummer 18 der Liste. Der Absatz nennt jetzt den
Irrtum, die Korrektur und die Bezugsmenge der neuen Messung.

### Abnahme

- `node tools/sync-typo-tokens.js --check` schweigt: **853 = 811 + 7 + 35 + 0 + 0**,
  OFFEN **0**, Rückgabewert 0. Ausnahmeliste **nicht** gewachsen.
- Ein erneuter Lauf `--only=party.css` / `--only=editors.css` lässt beide Dateien
  **byteweise** unverändert — die zwei neuen Ankerkommentare verschieben die
  Zeichengrenzen des Werkzeugs nicht (genau der Fehler, den es beim ersten Lauf hatte).
- `npx jest` **2074/2074 in 77 Suiten**. `npm run lint` Rückgabewert 0 mit **363**
  Warnungen. `typecheck` und `typecheck:strict` Rückgabewert 0. Beide Builds 0.
- `node tools/check-f18-kaskade.js --check` OK, 117 Abhängigkeiten.
  `node tools/sync-aktenlage-anker.js --check` OK, **0** Abweichungen bei **123** Ankern
  (8 Anker nachgezogen: der Kommentar in `party.css` verschiebt alles nach Zeile 2123 um
  elf Zeilen — genau der Grund, warum die Typo-Ausnahmeliste zeilenfrei ist).
- Ratschen unverändert: **DUBLETTEN 0 · !important 105 · Inline-Stile 254**,
  `transition: all` 0.
- `tests/e2e/features/breite-schrift.spec.js` **9/9**; knappste Stelle `npcs` mit
  **10,14 px** Reserve gegen eine Schranke von 4 (vor der Welle 6,63 px, im Befundstand
  -11,59 px).

### Ein Gate hat zugeschlagen, und es ist nicht umgangen worden

Das Abdeckungs-Gate (`module-test-coverage`) wurde rot, weil der neue Wächterblock
`features/rest-manager.js` als **Fundort eines Markups** nannte — das Gate zählt jeden
Treffer eines Modulpfads in `tests/` als Abdeckung, auch einen im Erklärtext. Die Nennung
ist auf die Kurzform `rest-manager.js:26/31` gebracht, **mit** dem Satz, warum: ein voller
Pfad hätte verlangt, das Modul von seiner Ausnahmeliste zu streichen, und damit eine
Abdeckung behauptet, die es nicht gibt. Dasselbe Muster steht schon bei `OHNE_MESSUNG` in
`design-consistency.test.js`.

### Offene Punkte

- **21 em-Stellen mit Faktor ≥ 1,2 ließen sich in keinem der 49 Zustände rendern** — u. a.
  `.avatar-placeholder.avatar-lg` (2em), `.loot-detail-icon` (2em),
  `.npc-popup-avatar-placeholder` (1.5em), `.rt-preview-icon` (1.5em),
  `.generator-table-icon` (1.5em). Für sie trägt die 16-px-Annahme **ungeprüft** weiter.
  Das ist eine offene **Messschuld**, keine Entwarnung: genau so war `.rest-type-icon`
  gelagert, bis ein Modal geöffnet wurde.
- **Die eingefrorene Grundlinien-Erhebung sieht Modale nicht** (`tools/typo-baseline.js`
  läuft über `#view-*` und fünf Rahmen). Für diese Runde ist die Lücke mit einer eigenen
  Erhebung geschlossen worden; eine **dauerhafte** Erweiterung der Grundlinie um die
  Modalbäume ist nicht erfolgt — sie würde den eingefrorenen Bezugsstand ändern und gehört
  deshalb nicht in eine Fehlerrunde. Übergeben an Schritt 9.
- **O-10 bleibt stehen und hat jetzt eine Zahl:** von den dort genannten
  Formularelementen auf Browser-Vorgabe tragen gemessen **5** eine em-Schriftgröße, und
  **eine** davon war falsch zugeordnet. Die übrigen vier bleiben bei ihrer Tabellenzeile.
- Unverändert aus W5-A bis W5-D: der tote Würfel-Behälter, die Uhr im 250-px-Ring, die
  zehn kaputten `woff2`, der `file://`-Pfad der gebündelten Schriften, die vier
  wirkungslosen Editor-Schriften, die fehlende Glyphendeckungs-Probe, `npm run check`
  vorbestehend rot. **Und die örtlich nicht lauffähige E2E-Suite:** `playwright-core`
  1.57.0 verlangt Chromium-Revision 1200, im Zwischenspeicher liegen 1217/1234/1243. Diese
  Runde ist über eine Konfiguration im Kratzspeicher gefahren, die nur `executablePath`
  umlegt; der Zwischenspeicher des Nutzers ist **nicht** angefasst. Saubere Behebung:
  einmal `npx playwright install chromium`.
- Restschuld der Folgeschritte, unverändert: `IMPORTANT_MAX` 105 → 104 (O-2),
  `INLINE_MAX` 254 → 252 (O-6), die drei SVG-Präsentationsattribute (O-7), die Untergrenze
  für Kleinstschrift als Bündel (Schritt 8).

### Befehle

```bash
# Der neue Waechter: die fuenf Stellen auf der Browser-Vorgabe
npx jest tests/unit/typo-map.test.js -t "W5-W12"

# Die neue Zeilenprobe bei 375 px unter breiter Schrift
npx playwright test tests/e2e/features/breite-schrift.spec.js --grep "\(5\)"

# --check schweigt weiter, und ein erneuter Lauf schreibt nichts
node tools/sync-typo-tokens.js --check
node tools/sync-typo-tokens.js --only=party.css
node tools/sync-typo-tokens.js --only=editors.css

# Die zwei Waechter des Zweigs
node tools/check-f18-kaskade.js --check
node tools/sync-aktenlage-anker.js --check
```

---

## W5-E — Gewichte, Inline-Typografie, Untergrenze und Formularschrift (2026-10-06)

**Status: ERLEDIGT.** Sechste Einheit der Welle 5, Schritte **6, 7 und 8** des geprüften
Plans. Sieben Commits, `10aa860 → 4de0e3a`. Jeder Schritt hat seinen **eigenen roten
Nachweis in einem eigenen Commit**, gefolgt von seiner Umsetzung.

### Schritt 6 — die 99 Schriftgewichte

Roter Nachweis `8b512e3`: 3 failed / 276 passed. `!important` 105 gegen Schranke 104;
W5-R-06 **95 von 360** Deklarationen außerhalb 400/500/600 (700 83x, `bold` 10x, `normal`
1x, `300` 1x); W5-R-06b (neu) **4 von 17** Inline-Gewichten außerhalb.

Umsetzung `476ce50`. **91 der 95 CSS-Stellen sind Werkzeugergebnis** (82x `700 -> 600`,
9x `bold -> 600`); der Lauf ersetzt nur den WERT und nur, wenn danach ein Semikolon oder
eine Blockgrenze folgt — deshalb hat er die `spells.css`-Doppelzeile von selbst nicht
angefasst, dort steht `!important` dazwischen. Verteilung danach: **600 304x,
`600 !important` 9x, 500 38x, 400 8x — kein vierter Wert.**

Vier Urteilsstellen, jede mit nachgestellter Begründung im CSS:

| Stelle | vorher -> nachher | Begründung |
| --- | --- | --- |
| `spells.css` Editor-Fett | `700 !important` -> `600 !important`, zweite Zeile (`bold !important`) entfällt | Das Ausgabe-Fett derselben Inhalte steht schon auf `600 !important`; Editor und gespeicherte Ansicht zeigen jetzt **dasselbe** Fett. `IMPORTANT_MAX` 105 -> 104 (O-2). |
| `party.css` `.cf-hp-divider` | `300` -> `400` | Die einzige 300 im Baum, Inhalt ist **ein** Schrägstrich. Ein fünfter Wert für ein Zeichen ist die Unterscheidung nicht wert. Sichtbar nur unter Windows (Segoe UI Light). |
| `tools.css` `.category-tag` | `normal` -> `400` | **Gemessen ein Nullzug**: `normal` IST 400. Geändert wird die Schreibweise. |
| 4x inline | `bold`/`normal` -> `600`/`400` | `modals-shops.html`, `view-resources.html`, `tags.js:62`, `loader.js:344`. |

**Die gelöschte Zeile ist durch eine Kommentarzeile ersetzt, und das ist Absicht.**
`spells.css` trägt neun Zeilenanker aus `R-19`, aus der Radientabelle und aus dieser Akte.
Der erste Versuch löschte ohne Ersatz und verschob alle sechs Anker oberhalb von 353 um
eins — `R-19` meldete "Anker 436/525/563, gefunden 435/524/562". Mit Ersatzzeile ist die
**Zeilenzahl jeder angefassten Datei unverändert** (numstat: 99 hinzugefügt, 99 entfernt,
je Datei gleich).

### Schritt 7 — die 137 Inline-Schriftgrößen

Roter Nachweis `be4fd80`: 2 failed / 2085 gesamt. `F-19` 254 gegen Schranke 252; W5-R-08
(neu) **131 von 137** außerhalb der Skala. Die 137 treffen die Vorhersage des Plans
(39 + 98) **auf den Punkt** — aber nur, weil die Erhebung Kommentare streicht: ohne diesen
Schritt zählt sie 141 (`rich-text-insert.js:872` nennt `font-size: 1.3em` im JSDoc und
erklärt daneben, warum die Stelle nicht angefasst wird; drei weitere sind
`.style.fontSize`-Zuweisungen der Editor-Schriftwahl).

Umsetzung `1eb1e80`. **124 Stellen sind Werkzeugergebnis.** Quellseitige Delta-Spanne
−1,60 .. +2,00 px, **kein Wert darüber**: −1,60 41x, −0,80 22x, −0,40 20x, 0,00 16x,
+1,00 6x, +0,80 6x, −1,00 5x, +2,00 5x, −1,20 1x, −0,20 1x, +0,40 1x.

13 Urteilsstellen: **7 entfernt** (vier Chip-Mitglieder in `npc-popup.js` — der
Welle-4-Vertrag `W4-R-06` verbietet einem Mitgliedsselektor eine eigene Schriftgröße und
verlangt sie an der Basis; `.session-tag`, dessen Basisregel gemessen denselben Wert
deklariert, Delta 0,00; und die zwei Beschriftungen "Typ"/"Ziel", bei denen das ganze
Attribut weicht und `.form-group label` entscheidet, Delta −0,80 — das sind die zwei, die
`INLINE_MAX` auf 252 senken). **1 geduldet** (das Würfel-Emoji des Impressumsfensters,
48 px; die Skala hat zwischen 34 und 72 px keine Sprosse, beide Wege wären −14,00 bzw.
+24,00 px). **5 ausgenommen** (`loader.js`).

**Die 37 übrigen Attribute behalten ihre Deklaration — als Token, nicht als Klasse.** Eine
Inline-Deklaration in eine Hilfsklasse zu verlegen ändert die KASKADE: ein Inline-Stil
schlägt jede Regel, eine Hilfsklasse (0,1,0) verliert gegen jede Komponentenregel mit
einem zweiten Glied, und `.form-group label` (0,1,1) ist genau so eine. Wer 137 Stellen so
verschiebt, ändert an unbekannt vielen, WELCHE Regel gewinnt. Mit dem Token ändert sich
die Zahl und sonst nichts — und genau diese eine Änderung misst der Grundlinien-Diff.

**`loader.js` ist eine namentliche DATEI-Ausnahme, und das ist keine Geschmacksfrage.**
Ladeanzeige (196-218) und Fehlerschirm (320-348) entstehen, BEVOR oder OHNE DASS das
Stilblatt wirkt — der Fehlerschirm erscheint genau dann, wenn das Laden fehlgeschlagen
ist. Ein `font-size: var(--text-md)` ohne definiertes Token ist zur Berechnungszeit
ungültig und fällt auf den geerbten Wert zurück: das Schwerter-Zeichen stünde dann bei
16 px statt bei 48. **Dass das Absicht ist und nicht Schlamperei, steht in der Datei
selbst:** beide Schirme führen ihre Farben als Hex-Literale, obwohl der übrige Baum unter
`F-04` keine duldet.

Drei `rem`-Zeilen sind in die Zuordnungstabelle nachgetragen (44 -> 47). Im CSS kommt `rem`
nicht vor — dort wacht `F-03` —, die Inline-Stile tragen aber `0.8rem`, `0.85rem` und
`1.2rem`. Sie stehen in DERSELBEN Tabelle, weil die Rechnung dieselbe ist: die Wurzel
trägt gemessen 16 px, und die Browser-Messung nennt für alle vier rem-Stellen genau diesen
Elternwert. `altPx()` rechnet `rem` jetzt mit; der frühere zugesicherte `null` war richtig,
solange die Tabelle nur CSS führte, und hätte die Monotonieprobe an diesen drei Zeilen
blind gemacht.

### Schritt 8 — Untergrenze und Formularschrift

Roter Nachweis `8b62ebb`: Jest 6 failed / 286 passed, Playwright 4 failed / 0 passed.
Daneben unabhängig gemessen, weil der erste rote Fall den zweiten verdeckt: **254
Bedienelemente in 18 Signaturen** standen auf Chromiums `font: -webkit-small-control`
(13,3333 px) — 187 blanke `input`, 18 `.cf-skill-exp-check`, 8 `.qa-btn`, je 6
`.bst-attr-input`, `.dice-attr`, `.dice-attr.save`, `.mobile-search-btn`, 5
`.npc-detail-btn`, 3 blanke `select`, 1 `.roster-add`.

Umsetzung `1c8e4f8`, vier Eingriffe:

**(1) Eine Regel für die Bedienelemente** (`core.css`, O-10):
`button, input, select, textarea { font-size: var(--text-sm) }`. 12 px und nicht 14, weil
die App selbst sagt, was ein Formularfeld trägt (`.form-group input/select/textarea`:
`var(--text-sm)`); 14 lag näher an 13,3333, wäre aber eine ZWEITE Antwort auf dieselbe
Frage. Sprung −1,33 px. Elementselektoren und keine Klasse: Spezifität (0,0,1) ist die
kleinste, die es gibt — jede bestehende Klassenregel gewinnt weiter, auch die Chip- und
Markenbasen der Welle 4. **Sie steht am ENDE von `core.css`** und nicht bei `body`, wo sie
der Sache nach hingehörte: der erste Versuch setzte sie dorthin, und 41 eingefügte Zeilen
machten vier Ratschen rot (`R-06`, `R-19` und drei Fälle von `W4-R-04`) — reine
Zeilenanker-Verschiebung. Die Stellung ist für diese Eigenschaft gemessen folgenlos: es ist
die **einzige** Regel im Stilblatt, die `font-size` mit einem reinen Elementselektor setzt
(nachgezählt über alle 20 Dateien: 0 weitere).

**(2) Eine Folge davon, gefunden und behoben** (`dice.css`). `.dice-attr small` trug keine
Größe; `small` ist in jedem Browser `font-size: smaller`, also 0,8333 mal den Elternwert.
Mit dem Knopf auf 12 px fällt das auf **10,00 px** — die neue Formularregel hätte 12
Elemente UNTER die Untergrenze geschoben (6 Attribut- und 6 Rettungswurf-Knöpfe). Jetzt
steht dort `var(--text-xs)`: 11,11 -> 11,00 px, Delta −0,11. **Genau diese Sorte Kind nennt
O-10 beim Namen** ("40 em-Kinder, deren Endwert heute ein Produkt aus einer
Browser-Vorgabe ist").

**(3) Die drei SVG-Präsentationsattribute verschwinden** (O-7, `SVG_MAX` 3 -> 0) — und zwar
OHNE einen Eintrag in `SVG_GEDULDET`. Die Histogramm-Beschriftungen tragen jetzt die
Klassen `.ds-hist-face-label` (8) und `.ds-hist-axis-label` (7); ihre WERTE sind
unverändert und stehen namentlich in `AUSNAHMEN`, also unter `W5-R-05a`. Der Unterschied
ist der Ort: geduldet in einer Kategorie, in der nichts hinsieht, gegen geduldet dort, wo
jede andere Größe auch geurteilt wird.

**DER WICHTIGSTE NEUE BEFUND DIESER EINHEIT: die Lesbarkeit dieser Beschriftungen hängt
an der viewBox-Skalierung und NICHT an ihrem deklarierten Wert.** Das SVG trägt
`viewBox="0 0 440 180"` und `width: 100%`, die Zahl ist also eine BENUTZEREINHEIT.
Gemessen auf gefüllter Kampagne:

| Fensterbreite | Skalierung | 8 Einheiten wirken | 7 Einheiten wirken |
| --- | --- | --- | --- |
| 1440 px | 1,4175 | **11,34 px** | **9,93 px** |
| 375 px | 0,68 | **5,44 px** | **4,76 px** |

Auf dem Schreibtisch liegt die Beschriftung damit **bereits** auf der Untergrenze; eine
Hebung auf 11 Einheiten machte dort 15,6 px daraus und ließe sie auf dem Telefon mit
7,5 px weiter darunter. Wer das wirklich lösen will, muss die Beschriftungen aus dem
skalierten Koordinatensystem nehmen (HTML-Schicht über dem Diagramm oder ein mitwachsendes
viewBox-Maß). Das ist eine **Struktur**-Änderung und keine Typografie-Entscheidung
(Arbeitsregel 10) — Folgearbeit, siehe unten.

**(4) Die drei offenen Untergrenzen-Fragen sind beantwortet**, jede an ihrer Deklaration
und in `tools/typo-map.js`:

- **`.wiki-tree-item-toggle` (8 px) und `.tb-caret` (9 px) bleiben**, und zwar gemeinsam,
  wie Schritt 4 es an drei Stellen zugesichert hat. Entschieden wird **nicht** über die
  Harmlosigkeit der Hebung — die ist belegt —, sondern darüber, OB ein Pfeilzeichen in die
  TEXTskala gehört. Die Untergrenze gilt wörtlich für "alles, was man liest"; der Plan
  nennt genau diese Falle in seiner Risikoliste ("ein Pfeilzeichen, keine Schrift").
  `.wiki-tree-item-toggle` hat überdies 0 gerenderte Elemente — seine Hebung wäre eine
  Änderung ohne Betrachter.
- **`.floating-toolbar .kbd-hint` (8 px) bleibt** und ist die **einzige** Duldung der
  Welle, die Lesetext betrifft. Die Hebung macht den Text nicht lesbarer, sondern unlesbar
  (drei der fünf Hilfen laufen ineinander, −2,80 und −3,09 px, breite Linux-Näherung −8,20
  und −8,68). Der einzige Weg, der beides löst, ist eine Layoutregel — nur die Hilfe des
  berührten Knopfes zeigen statt aller fünf der Leiste —, und die ändert, WANN ein Hinweis
  erscheint. Funktionsänderung, Arbeitsregel 10. Die Stelle trägt auch kein Padding, an
  dem sich 2,80 px einsparen ließen (nachgesehen: position/bottom/left/transform,
  font-size, color, white-space, opacity, transition, pointer-events — kein Innenabstand).

### Zwei neue Ratschen

**`W5-R-09`** (`tests/e2e/features/schriftuntergrenze.spec.js`, 4 Fälle) misst die
Untergrenze **und** die Formularschrift in drei Zuständen bei zwei Breiten auf gefüllter
Kampagne. Warum es ein Browserfall sein MUSS: `W5-R-05` urteilt über DEKLARATIONEN.
`0.7em` ist quelltextlich unauffällig und wird zu 8,96 px, wenn der Elternwert 12,8 px
trägt. Und die Browser-Vorgabe ist das Gegenteil: dort gibt es **gar keine** Deklaration,
die eine Quelltextsuche finden könnte. **Die bestehende Handoff-Zusage "0 außer
`.sr-only`" taugt nicht** — diese Ausnahme ist gemessen LEER (alle 17
`.sr-only`-Elemente liegen bei 17,6 px) und verdeckt den echten Befund statt ihn zu
benennen. Die Ausnahmeliste nennt je Signatur Wert, Anzahl, Textknoten und Grund: **34
Elemente in 5 Signaturen** (2+2 `.slot-pip`, 5 `.kbd-hint`, 4 `.tb-caret`, 20+1
SVG-Beschriftungen). Das ist mehr als die 25 Stellen, die E-4 nennt — die drei anderen
Signaturen (9 Elemente) sind in den Schritten 4 und 5 gefunden und dort einzeln beurteilt
worden.

**`W5-R-10`** legt die BEZUGSMENGE der Zielquote fest (O-13). **Die Hauptzusicherung ist
NICHT rot und war es auch vorher nicht:** die Quote lag nach Schritt 5 schon bei 98,67 %
(818 von 829 Text-Deklarationen), nach dieser Einheit bei **98,68 % (820 von 831)** und
bei 95,68 % über **alle** 857 Deklarationen. Das ist kein Versehen, sondern der Punkt — die
Ratsche behauptet keinen neuen Fortschritt, sie hält fest, WORAUF sich die 95 Prozent
beziehen. Der Ausgangswert 63,36 % des Handoffs ist eine **Element**-Quote
(`typo-baseline`, Feld `skalaAnteilSichtbar`) und bewusst durch die Deklarationsquote
ersetzt; auf der Elementmenge ist 95 % mit den Ausnahmen E-2/E-3/E-4 arithmetisch
unerreichbar. **In der Bezugsmenge BLEIBEN die drei Duldungen, die Text betreffen** (sechs
Überschriftenstufen, vier Leser der Mobilvergrößerung, die Tastenhilfe) — eine Quote, aus
der jede unbequeme Stelle herausdefiniert ist, ist eine Tautologie.

### Der Grundlinien-Diff

**Werkzeug gegen Werkzeug** (Erhebung vor und nach der Einheit, dieselbe Browser-Fassung,
gefüllte Kampagne, 24 Ansichten, vier Themes, 1440 und 375 px):

| Lauf | Schlüssel | Größen geändert | Spanne | **über 2 px** | Gewicht | Zeilenhöhe |
| --- | --- | --- | --- | --- | --- | --- |
| dark-1440 | 5566 | 355 | −1,6 .. +2,0 px | **0** | 293 | 17 |
| dark-375 | 5531 | 355 | −1,6 .. +2,0 px | **0** | 288 | 17 |
| light-1440 | 3651 | 212 | −1,6 .. +2,0 px | **0** | 200 | 15 |
| sepia-1440 | 3651 | 212 | −1,6 .. +2,0 px | **0** | 200 | 15 |
| contrast-1440 | 3651 | 212 | −1,6 .. +2,0 px | **0** | 200 | 15 |

**Keine einzige Überschreitung der 2-px-Schwelle, in keinem der fünf Läufe.** 0
Sichtbarkeitswechsel. Die 79 Zeilenhöhen-Befunde sind die **mechanische Folge** der
Größenänderung und keine eigene Änderung: **alle 17 je Lauf sitzen auf Elementen, deren
Schriftgröße sich ebenfalls ändert** (einzeln nachgerechnet), denn eine einheitenlose
`line-height` rechnet sich aus der Größe. Größter Wert: `.backup-status-label`
19,04 -> 16,80 px bei 13,6 -> 12 px.

Der Anteil auf der Skala steigt: **92,30 -> 98,11 %** (dark-1440), 92,68 -> 97,00 %
(light/sepia/contrast), **91,89 -> 97,81 %** (dark-375). Sichtbarer Text unter 11 px fällt
25 -> 23 bzw. 23 -> 21; das gemessene **Minimum bleibt 7 px** (die Y-Achse des
Histogramms).

**Gegen die eingefrorene Grundlinie** `grundlinie-v5.json` (HEAD 7e4aa09, also die ganze
Welle 5): 50 Überschreitungen in genau **10** Elementschlüsseln (je 5 Läufe), Spanne
−14,00 .. +2,00 px. Es sind **dieselben 10**, die W5-C für Schritt 4 gemeldet hat
(`.fdp-number` und `.timer-hero-time` 48 -> 34, `.dice-hero-result` 80 -> 72,
`.dms-dice-result` und sechs `.attr-input` 22,4 -> 20). **Diese Einheit fügt keine einzige
hinzu.**

### Die Linux-Nachstellung

Vorzustand gegen Nachzustand, je mit Segoe und mit Verdana (Faktor 1,1554), bei 1440 und
375 px, über alle 24 Ansichten:

| Lage | waagerechter Textüberlauf | senkrechter | Ansichten mit Seitenüberlauf |
| --- | --- | --- | --- |
| 1440 / Segoe | 0 -> 0 | 5 -> 5 | 0 -> 0 |
| 1440 / Verdana | 0 -> 0 | 1 -> 1 | 0 -> 0 |
| 375 / Segoe | 0 -> 0 | 5 -> 5 | 0 -> 0 |
| 375 / Verdana | 0 -> 0 | 1 -> 1 | 0 -> 0 |

**Keine Änderung in keiner der vier Lagen.** Das ist die Fehlerklasse, die die CI schon
einmal 12 Tests gekostet hat, und diese Welle ändert Schriftgrößen — die Probe gehört
dazu, nicht in die Fußnote.

### Der Stil-Sollstand

Bewusst neu erhoben (`4de0e3a`, O-9). **Die Zahl, die hier zuerst stand, war falsch, und
der Irrtum ist lehrreich genug, um benannt zu bleiben statt stillschweigend überschrieben
zu werden.**

Gegengerechnet auf den **Digest-WERTEN** (`tools/vergleich-stil-sollstand.js --alt 10aa860
--neu 1ebc13a`, Befund der Prüfrunde 1):

| Durchgang | vorher | nachher | geändert | Zugänge | Abgänge |
| --- | --- | --- | --- | --- | --- |
| standard | 1213 | 1234 | 99 | 21 | 0 |
| narrow | 1123 | 1144 | 86 | 21 | 0 |
| reducedMotion | 1213 | 1234 | 99 | 21 | 0 |
| **SUMME** | **3549** | **3612** | **284** | **63** | **0** |

**Vorher stand hier „0 geändert".** Der Sollstand trägt je Ansicht ZWEI Felder: `keys` (die
Elementsignaturen) und `digests` (die Hashwerte dazu). Wer `keys` vergleicht, sieht Zugänge
und Abgänge — eine Wertänderung an einem BESTEHENDEN Schlüssel ist dort unsichtbar, weil
sich der Schlüssel dabei nicht ändert. Auf `keys` gerechnet kommt für diese Welle Ziffer für
Ziffer „0 geändert, 63 Zugänge, 0 Abgänge" heraus. Der Vergleich hat nicht falsch gerechnet,
er hat das falsche Feld gelesen. Zweite, unabhängige Methode (Zeilen-Diff der Datei): 287
Minus- und 350 Plus-Zeilen; drei der 287 tragen denselben Wert wie ihre Plus-Zeile
(`svg.ds-histogram-svg#0`, reine Kommaverschiebung), 287 − 3 = **284**.

Die **63 Zugänge** sind unverändert richtig und haben **eine einzige Ursache**: dreimal
dieselben 21 Schlüssel, alle in `dicestats`, alle `text.ds-hist-face-label#0..19` und
`text.ds-hist-axis-label#0`. Die Beschriftungen trugen ihre Größe bis zu diesem Schritt als
Präsentationsattribut und hatten KEINE Klasse; die Abtastung greift Elemente an ihrer
Signatur und ließ sie fallen. Sie sind also nicht „neu", sondern erstmals **erfasst**.

**Der tragende Satz der ersten Fassung ist widerlegt und gestrichen:** „die 95 Gewichte und
die 254 Bedienelemente liegen gemessen außerhalb dieser Auswahl". Beide Gruppen liegen
mitten in der Auswahl — 194 bewegte Digests kommen von der Gewichtsumstellung, 81 von der
neuen Bedienelement-Regel. `div.dash-stat-value`, `button.qa-btn`, `button.dice-attr`,
`button.dice-attr.save` und `button.npc-detail-btn` stehen in der Auswahl UND haben sich
bewegt; die vier Knöpfe führt `1c8e4f8` selbst unter seinen 254 Bedienelementen auf.

**Die 284 sind eigenschaftsgenau erklärt — rechnend, nicht erzählend.** „284 bewegt" allein
wäre kein Freispruch: der Digest ist ein SHA-256 über zwölf Eigenschaften und sagt nur DASS,
nicht WAS; bewegt haben könnte sich auch eine Farbe oder ein Rahmen. Die Rekonstruktion
nimmt den heutigen Satz aller zwölf Werte aus dem lokalen Vollabzug, ersetzt darin NUR Größe
und Gewicht durch Kandidatenwerte und prüft, ob eine Kombination den ALTEN Digest exakt
reproduziert; trifft sie, sind die übrigen zehn Eigenschaften unverändert. Ergebnis:
**bewegt 284 · erklärt 284 · unerklärt 0**, verteilt auf 38 Signaturen:

| Digests | Signaturen | Ursache | Commit |
| --- | --- | --- | --- |
| 194 | 28 | Gewicht 700 -> 600 | `476ce50` |
| 81 | 8 | Größe 13,3333 -> 12 px (`font: -webkit-small-control`, also genau die Browser-Vorgabe, die Schritt 8 verlassen wollte) | `1c8e4f8` |
| 6 | 1 | Größe 17,6 -> 16 px — `render/helpers.js:436`, `renderEmptyState`, `1.1em` -> `var(--text-lg)` | `1eb1e80` |
| 3 | 1 | Größe 13,6 -> 12 px — `systems/file-backup/file-backup-ui.js:322`, `0.85em` -> `var(--text-sm)` | `1eb1e80` |

Es verbirgt sich also nichts Unbeabsichtigtes in den 284. **Das ist jetzt eine
Werkzeugaussage mit Gegenprobe und keine Zusage im Begleittext mehr** — und darauf kommt es
an: der Sollstand ist der einzige Wächter im Baum, der eine unbeabsichtigte Bildänderung
fängt, eine Neuerhebung schreibt ihn neu, und unter der Zusage „0 bewegt" bleibt dieser
Beweis ungeführt, weil es scheinbar nichts zu beweisen gibt. Genau dieser Schritt war
ausgefallen.

Der Sollstand erfasst 1213 von gemessen 3672 Elementen je Durchgang, nämlich eine kuratierte
Auswahl je Ansicht — die Auswahl ist der Grund, warum es 284 bewegte Digests sind und nicht
mehr. Der Bildpunkt-Vergleich nennt für dieselbe Umstellung 355 Größen- und 293
Gewichtsänderungen je Lauf. **Beide Werkzeuge nebeneinander sind Absicht.**
`EXPECTED_DEVIATION_KEYS` und `EXPECTED_DEVIATION_KEYS_NARROW` bleiben LEER.

**Summe über die Welle, alle vier Neuerhebungen mit demselben Werkzeug nachgerechnet:**
W5-C 9 (`4534b38`), W5-D 1143 (`ebc2914`), W5-D Runde 1 **24** (`304a297` — stand bisher in
keinem Abschnitt dieser Akte, deshalb hier nachgetragen), W5-E **284** (`4de0e3a`, plus 63
Zugänge). **Gesamt 1460 bewegte Digests.** Die ersten drei Zahlen treffen ihre
Commit-Nachrichten auf den Punkt — sie waren auf den Werten gerechnet, und das ist der
Beleg, dass der Irrtum auf W5-E beschränkt bleibt und keine stille Serie ist.

**Gegen die Wiederkehr** steht ab jetzt `tools/vergleich-stil-sollstand.js` mit
`tests/unit/stil-sollstand-vergleich.test.js` (20 Fälle): der Vergleich rechnet auf
`digests`, die Schlüsselmengen-Rechnung steht im selben Testfall zum Gegenhalten, die
Eigenschaftsliste wird aus dem Vergleichslauf GELESEN statt nachgebaut (ARCH-01), und ein
Vollabzug aus einem fremden Baumzustand wird gemeldet statt stillschweigend verrechnet. Das
Werkzeug ist **kein Tor** und läuft in keiner Pipeline — die Rekonstruktion braucht den per
`.gitignore` ausgeschlossenen Vollabzug und Git-Historie, die `actions/checkout@v7` nicht
holt. Es ist ein handgefahrenes Berichtswerkzeug für den Augenblick der Neuerhebung,
dieselbe Bauart wie `--verlauf` in `tools/check-f18-kaskade.js`.

### Geprüfte Basiswerte

`npx jest` **2090/2090 in 77 Suiten** · `npx playwright test` **604 bestanden / 27
übersprungen / 0 Fehlschläge** (vor der Sollstand-Neuerhebung: 600 bestanden, 1
Fehlschlag, 3 nicht gelaufen — genau die erwartete Stelle) · `npm run lint` exit 0 mit
**exakt 363** Warnungen · `typecheck` und `typecheck:strict` exit 0 · `pytest` 30 · beide
Builds exit 0 · `check-f18-kaskade --check` OK (117 Abhängigkeiten) ·
`sync-aktenlage-anker --check` 0 Abweichungen. Ratschen: **DUBLETTEN 0 · !important 104 ·
Inline-Attribute 252 · `transition: all` 0 · SVG_MAX 0 · AUSSERHALB_MAX 0 (Größe und
Gewicht) · EM_MAX 6 · INLINE_AUSSERHALB_MAX 0**.

### Offene Punkte

- **NEU, und der stärkste Befund dieser Einheit: die Histogramm-Beschriftungen sind auf
  dem Telefon 4,76 bis 5,44 px groß**, obwohl ihre Deklaration 7 bzw. 8 sagt. Ursache ist
  die viewBox-Skalierung (0,68 bei 375 px, 1,4175 bei 1440 px), nicht der Wert. Lösung:
  Beschriftungen aus dem skalierten Koordinatensystem nehmen. Eigene Arbeit, nicht
  Typografie.
- **NEU: die Layoutregel der Tastenhilfen.** `.floating-toolbar:hover .kbd-hint` zeigt
  alle fünf Hilfen gleichzeitig; nur die Hilfe des berührten Knopfes zu zeigen
  (`.editor-btn:hover .kbd-hint`) wäre die Voraussetzung dafür, die 8 px je auf 11 zu
  heben. Funktionsänderung, gehört in eine eigene Einheit.
- **NEU: die Schrift-FAMILIE der Bedienelemente.** Die neue Regel setzt nur `font-size`.
  Knöpfe und Felder benutzen weiter die Schrift des Systems, und die ist
  plattformabhängig — dieselbe Ursache, nur eine Eigenschaft weiter. `F-05` lässt genau
  EINE `font-family: var(--font-ui)`-Deklaration zu; wer das angeht, muss die Ratsche
  mitdenken.
- **NEU als Klasse von Fehlern, einmal belegt: relative Größen unter einem
  Bedienelement.** `.dice-attr small` ist gefunden und behoben; eine systematische Suche
  nach `smaller`/`larger`/Prozent-Größen, deren Elternteil eine Browser-Vorgabe war, hat
  diese Einheit nicht gefahren.
- **UMGEBUNGSMANGEL, unverändert aus W5-A bis W5-D: die E2E-Suite ist örtlich nicht ohne
  Umweg lauffähig.** `playwright-core` 1.57.0 verlangt Chromium-Revision 1200, im
  Zwischenspeicher liegen 1217/1234/1243. Alle Browser-Läufe dieser Einheit sind über
  `PLAYWRIGHT_BROWSERS_PATH` und `TYPO_BASELINE_CHROMIUM` gefahren; der Zwischenspeicher
  des Nutzers ist **nicht** angefasst. Saubere Behebung: einmal
  `npx playwright install chromium`.
- **`npm run check` bleibt vorbestehend rot**, weil `prettier --check` über den ganzen
  Baum läuft. Der neu erhobene Stil-Sollstand ist wie seine Vorgängerfassung nicht
  prettier-konform (beide nachgemessen — kein Statuswechsel);
  `tests/e2e/features/schriftuntergrenze.spec.js` und `tools/typo-map.js` sind einzeln
  konform.
- **Weiterhin offen aus W5-A/W5-B und von dieser Einheit nicht berührt:** die zehn
  kaputten `woff2` unter `assets/fonts/` (kyrillische bzw. devanagari Teilmengen, kein
  lateinischer Kleinbuchstabe), der `file://`-Pfad der gebündelten Schriften, die vier
  wirkungslosen Editor-Schriften in `EDITOR_FONTS`, die fehlende Glyphendeckungs-Probe im
  Testnetz, der tote Würfel-Behälter `#dice-result`, und die fehlende Zwischensprosse
  zwischen 34 und 72 px (die Uhr im 250-px-Ring).
- **Die Restschuld der Schritte 6 bis 8 ist damit abgetragen:** `IMPORTANT_MAX` 104 (O-2),
  `INLINE_MAX` 252 (O-6), `SVG_MAX` 0 (O-7), die Formularschrift (O-10), die Zielquote mit
  benannter Bezugsmenge (O-13), die Neuerhebung des Sollstands (O-9).

### Befehle

```bash
# Die neue Untergrenzen-Probe (4 Faelle, Browser, zwei Breiten)
npx playwright test tests/e2e/features/schriftuntergrenze.spec.js

# Die drei neuen Quelltext-Schranken
npx jest tests/unit/design-consistency.test.js -t "W5-R-06"
npx jest tests/unit/design-consistency.test.js -t "W5-R-08"
npx jest tests/unit/design-consistency.test.js -t "W5-R-10"

# Der Grundlinien-Diff gegen den Vorzustand
node tools/typo-baseline.js --diff vorher.json nachher.json --schwelle 2 --egal gewicht

# Die zwei Waechter des Zweigs
node tools/check-f18-kaskade.js --check
node tools/sync-aktenlage-anker.js --check
```

---

## W5-E Runde 1 — „0 bewegt" war ein Vergleich der Schlüssel, nicht der Werte (2026-10-06)

**Status: ERLEDIGT.** Prüfrunde zur Einheit W5-E. Der eine Befund der Prüfung ist
nachgemessen **bestätigt** und behoben; keiner wurde zurückgewiesen. Drei Commits,
Reihenfolge nach `plan.atomar_wie`: zuerst der rote Nachweis, dann das Werkzeug, dann die
Akte.

### Der Befund in einem Satz

Die Neuerhebung des Stil-Sollstands wurde mit der Zusage begleitet, es habe sich **kein**
bestehender Digest bewegt („GEPRÜFT UND NICHT GEHOFFT", `4de0e3a`). Gemessen haben sich
**284 von 3549** bewegt. Die Rechnung hatte das Feld `keys` verglichen statt `digests` —
auf den Schlüsselmengen ist eine Wertänderung an einem bestehenden Schlüssel unsichtbar,
und dort kommt Ziffer für Ziffer „0 geändert, 63 Zugänge, 0 Abgänge" heraus.

Die vollständige Richtigstellung mit beiden Messmethoden, der eigenschaftsgenauen Zuordnung
der 284 auf 38 Signaturen und der gestrichenen Behauptung steht oben im Abschnitt
**„Der Stil-Sollstand"** der Einheit W5-E — dort, wo die falsche Zahl stand, und nicht hier
in einer Fußnote.

### Warum das schwerer wog als eine falsche Zahl

Der Sollstand ist der **einzige** Wächter im Baum, der eine unbeabsichtigte Bildänderung
fängt: er hängt an zwölf berechneten Eigenschaften je Element und meldet jede Bewegung, ohne
zu wissen, welche gewollt war. Eine Neuerhebung **schreibt diesen Wächter neu** und ist nur
zulässig, wenn vorher bewiesen ist, dass in den bewegten Werten nichts Unbeabsichtigtes
steckt. Unter der Zusage „0 bewegt" bleibt dieser Beweis ungeführt, weil es scheinbar nichts
zu beweisen gibt — genau dieser Schritt war ausgefallen. Nachgeholt ist er jetzt rechnend:
**284 bewegt, 284 erklärt, 0 unerklärt.**

### Was dauerhaft dagegen steht

`tools/vergleich-stil-sollstand.js` + `tests/unit/stil-sollstand-vergleich.test.js`
(20 Fälle). Vier Vorkehrungen, jede gegen einen konkreten Fehlgriff:

| Vorkehrung | Gegen welchen Fehlgriff |
| --- | --- |
| `vergleiche()` rechnet nur auf `digests` | den Irrtum dieser Runde |
| die Schlüsselmengen-Rechnung steht **im selben Testfall** zum Gegenhalten | denselben Irrtum als Prosa-Warnung, die niemand liest |
| `PROPERTIES`/`DIGEST_HEX_LENGTH` werden aus dem Vergleichslauf **gelesen**, nicht nachgebaut; Abweichung bricht hart | ARCH-01, zwei handgepflegte Kopien einer Liste |
| ein Vollabzug, der nicht zum neuen Digest passt, wird gemeldet statt verrechnet | Abzug aus einem fremden Baumzustand |

**Das Werkzeug ist kein Tor** und läuft in keiner Pipeline — gesagt, weil CLAUDE.md für
genau diese Unehrlichkeit eine eigene Mahnung führt (Phase 15, GATE-04). Die Rekonstruktion
braucht den per `.gitignore` ausgeschlossenen Vollabzug und Git-Historie, die
`actions/checkout@v7` nicht holt. Handgefahrenes Berichtswerkzeug für den Augenblick der
Neuerhebung, dieselbe Bauart **und dieselbe Einschränkung** wie `--verlauf` in
`tools/check-f18-kaskade.js`. Über den echten Sollstand urteilt weiterhin der
Vergleichslauf in der E2E-Suite, bei jedem Lauf.

### Ein echter Fehler, vom eigenen Wächter gefangen

Die Kandidatensuche ließ den **heutigen** Wert eines Feldes aus, wenn der Aufrufer ihn nicht
nannte. Bewegt sich an einem Element nur die Größe, muss das Gewicht auf seinem
unveränderten Wert stehenbleiben können — sonst bleibt genau dieser häufigste Fall
unerklärt, und zwar stillschweigend als „andere Eigenschaft bewegt". An der vollen
Kandidatenmenge aus dem Vollabzug fiel es **nicht** auf, weil die heutigen Werte dort
ohnehin alle vorkommen; zwei Fälle mit enger Menge haben es rot gemacht. Das ist der Grund,
warum der Wächter vor dem Werkzeug entstand.

### Die Gegenprobe: ist es eine Serie?

**Nein.** Alle vier Neuerhebungen der Welle 5 mit demselben Werkzeug nachgerechnet:
`4534b38` **9**, `ebc2914` **1143**, `304a297` **24**, `4de0e3a` **284**. Die ersten drei
treffen ihre Commit-Nachrichten auf den Punkt — sie waren auf den Werten gerechnet. Der
Irrtum bleibt auf W5-E beschränkt. Nebenbei gefunden: die **24** von `304a297` (W5-D
Runde 1) stand in keinem Abschnitt dieser Akte und ist jetzt in der Wellensumme
nachgetragen.

### Geprüfte Basiswerte

`npx jest` **2110/2110 in 78 Suiten** (die 20 neuen Fälle heben 2090 auf 2110) ·
`npx playwright test` **604 bestanden / 27 übersprungen / 0 Fehlschläge** · `npm run lint`
exit 0 mit **exakt 363** Warnungen · `typecheck` und `typecheck:strict` exit 0 · `pytest`
30 · beide Builds exit 0 · `check-f18-kaskade --check` OK · `sync-aktenlage-anker --check`
0 Abweichungen. Ratschen unverändert: **DUBLETTEN 0 · !important 104 · Inline-Attribute
252 · `transition: all` 0 · SVG_MAX 0 · AUSSERHALB_MAX 0 · EM_MAX 6 ·
INLINE_AUSSERHALB_MAX 0**. Diese Runde ändert **keine** Quelldatei der App — nur ein
Werkzeug, einen Wächter und diese Akte; die Ratschen können davon nicht berührt sein, und
dass sie es nicht sind, ist gemessen und nicht geschlossen.

### Offene Punkte

- **Die Rekonstruktion deckt nur die Eigenschaften ab, die man ihr nennt.** Für Welle 5
  waren das `fontSize` und `fontWeight`, und das war richtig. Eine Welle, die Farben oder
  Ränder bewegt, muss ihre Kandidatenmengen selbst mitbringen — sonst meldet das Werkzeug
  ihre beabsichtigten Änderungen als „unerklärt". Das ist die gewollte Richtung des
  Irrtums (laut statt still), aber es ist eine Bedienpflicht und keine Automatik.
- **Niemand fährt das Werkzeug automatisch.** Es ist bewusst kein Tor (Begründung oben),
  aber damit gilt für es dieselbe Restschuld, die CLAUDE.md für
  `sync-editor-toolbars --check` führt: eine Fähigkeit, die nur jemand nutzt, der an sie
  denkt. Der nächste Schritt, falls je gewünscht: der Vollabzug müsste versioniert oder in
  der CI erzeugt werden, und `fetch-depth: 0` in den Workflow.
- **Der Umgebungsmangel aus W5-A bis W5-E ist behoben.** `npx playwright install chromium`
  ist in dieser Runde gelaufen (Chromium 143.0.7499.4, Playwright-Build v1200); die
  E2E-Suite läuft örtlich ohne `PLAYWRIGHT_BROWSERS_PATH`-Umweg. Der entsprechende Punkt
  der Einheit W5-E ist damit erledigt.

### Befehle

```bash
# Der Waechter des Vergleichswerkzeugs (20 Faelle)
npx jest tests/unit/stil-sollstand-vergleich.test.js

# Die Neuerhebung dieser Welle nachrechnen — Werte, nicht Schluessel
node tools/vergleich-stil-sollstand.js --alt 10aa860 --neu 1ebc13a

# Den Vollabzug erzeugen, den die Rekonstruktion braucht
npx playwright test tests/e2e/features/computed-style-diff.spec.js
```

---

## W5-F — Die Abnahme der Welle 5: der Grundlinien-Diff als Hauptnachweis (2026-10-06)

**Status: ERLEDIGT.** Schritt 9 des geprüften Plans (Abnahme, Sollstand, Bilderserie).
Diese Einheit ändert **keine** Quelldatei der App — sie misst, legt Bilder ab und schreibt
diese Akte. Alles, was hier steht, ist am Buendel von `63103b1` **selbst gefahren** und
nicht aus den Einheiten W5-A bis W5-E übernommen. Die beiden Commits dieser Einheit
(`514318c` Bilderserie, danach diese Akte) fassen nur `tests/` und `.planning/` an; das
gebaute Buendel ist davon unberuehrt, und deshalb gelten alle Zahlen unten unveraendert
fuer den Zweigkopf.

### Der Grundlinien-Diff — die Hauptabnahme

Gegen die **eingefrorene Grundlinie** `grundlinie-v5.json` (HEAD `7e4aa09`, also die ganze
Welle 5), gefüllte Kampagne, 24 Ansichten, vier Themes, 1440 und 375 px:

| Lauf | verglichene Schlüssel | Größe geändert | Spanne | **über 2 px** | Gewicht | Zeilenhöhe | Sichtbarkeit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dark-1440 | 3651 | 1855 | −14 .. +2 px | **10** | 200 | 869 | 0 |
| light-1440 | 3651 | 1855 | −14 .. +2 px | **10** | 200 | 869 | 0 |
| sepia-1440 | 3651 | 1855 | −14 .. +2 px | **10** | 200 | 869 | 0 |
| contrast-1440 | 3651 | 1855 | −14 .. +2 px | **10** | 200 | 869 | 0 |
| dark-375 | 3616 | 1623 | −14 .. +2 px | **10** | 195 | 867 | 0 |
| **Summe** | **18220** | **9043** | | **50** | **995** | **4343** | **0** |

**Die 50 Überschreitungen sind 10 Elementschlüssel, jeder in allen fünf Läufen.** Es sind
dieselben 10, die Schritt 4 (W5-C) einzeln beurteilt hat; die Einheiten W5-D und W5-E haben
keine einzige hinzugefügt, und diese Abnahme bestätigt das an einer eigenen Erhebung. Jede
trägt ihre Begründung **am Code**, nicht in dieser Akte — das ist die Lesart von
"beabsichtigt":

| Delta | Selektor | von -> nach | Begründung am Code |
| --- | --- | --- | --- |
| −14,00 | `.timer-hero-time` | 48 -> 34 | "Die Uhrzeit ist Text. `--text-3xl` ist die nächste Sprosse; die Skala hat zwischen 34 und 72 px keine, und der 250-px-Ring trägt 34 px ohne Weiteres" |
| −14,00 | `.fdp-number` | 48 -> 34 | "Die Wurfzahl ist Text, kein Ikon. `--text-3xl` und nicht `--text-hero`: das schwebende Paneel bleibt dem Würfel-Hero (72 px) untergeordnet" |
| −8,00 | `.dice-hero-result` | 80 -> 72 | "Die größte Zahl der App; `--text-hero` ist genau für sie da (Handoff §7)" |
| −2,40 | `.dms-dice-result` | 22,40 -> 20 | "Die Wurfzahl des Würfel-Widgets ist Text" |
| −2,40 | `.attr-input` (6×: `enc-str/dex/con/int/wis/cha`) | 22,40 -> 20 | "Ein Eingabefeld mit dem Attributwert, also Text. 20 px liegt über der 16-px-Schwelle und löst beim Antippen keinen Auto-Zoom aus (E-2)" |

**Kein weiterer Schlüssel überschreitet die Schwelle, in keinem der fünf Läufe. Null
Sichtbarkeitswechsel.** Die 4343 Zeilenhöhen-Befunde sind die **mechanische Folge** der
Größenänderung: eine einheitenlose `line-height` rechnet sich aus der Größe.

Der Diff führt außerdem 217 nur einseitig vorhandene Schlüssel und 18 nicht gefundene
Umschalter. **Beides liegt am Alter der Grundlinie und nicht an einer Änderung dieser
Welle** — die eingefrorene Grundlinie stammt aus den Vorab-Skripten und kennt nur die
Ruhelage, während das committete Werkzeug drei Zustände erhebt. Die 1936 "nur neu"-Schlüssel
der beiden Dark-Läufe sind genau diese Zustände; die 49 "nur alt" sind vier
Bestiar-Listenzeilen (Nachladen) und die 21 `dicestats`-Beschriftungen, die erst seit
Schritt 8 eine Klasse tragen und damit erstmals **erfasst** sind.

### Die Zielquote — Zähler, Nenner und Bezugsmenge

**Bezugsmenge ist die TEXT-Deklaration (E-3/O-13), nicht das Element und nicht "alle".**
Gemessen mit demselben Erhebungspfad, den `W5-R-10` benutzt (18 Dateien unter
`assets/styles`, ohne `variables.css` und `fonts.css`):

| Menge | Zähler | Nenner | Quote |
| --- | --- | --- | --- |
| **Text-Deklarationen** (857 − 26 ohne Lesetext) | **820** | **831** | **98,68 %** |
| alle `font-size`-Deklarationen | 820 | 857 | 95,68 % |

Die 820 sind 813 Deklarationen auf einer Sprosse plus 7 `inherit` (legt nichts fest); die
11 Stellen, die in der Textmenge **bleiben** und daneben liegen, sind die drei geduldeten
TEXT-Gruppen: sechs Überschriftenstufen des Reichtext-Inhalts, vier Leser der
Mobilvergrößerung (E-2) und die Tastenhilfe. Sie DRÜCKEN die Quote, und das sollen sie.

**Die Element-Quote erreicht die 95 Prozent ebenfalls — das war beim Aufschreiben von E-3
nicht erwartet.** Feld `skalaAnteilSichtbar` des Grundlinienwerkzeugs, sichtbare Elemente
auf einem Skalenwert:

| Lauf | vorher (7e4aa09) | nachher |
| --- | --- | --- |
| dark-1440 | 63,36 % | **98,11 %** |
| light/sepia/contrast-1440 | 63,36 % | **97,00 %** |
| dark-375 | 63,45 % | **97,81 %** |

Die Begründung von O-13 ("auf der Elementmenge ist 95 % arithmetisch unerreichbar") ist
damit **gemessen widerlegt**. Sie bleibt trotzdem die richtige Entscheidung: die
Deklarationsquote ist die prüfbare, weil sie nicht davon abhängt, wie viele Elemente eine
Saat gerade erzeugt. Beide Zahlen stehen hier nebeneinander, damit niemand die eine für die
andere hält. Einschränkung, die dazugehört: die 63,36 % stammen aus dem Vorab-Skript, die
98,11 % aus dem committeten Werkzeug — zwei Umsetzungen derselben Definition (dieselben acht
Sprossen, nachgeprüft), nicht zweimal dasselbe Programm.

### Die Untergrenze

**0 Elemente unter 11 px außerhalb der namentlichen Liste**, in beiden unabhängigen
Messungen:

- `W5-R-09` (Browser, drei Zustände, zwei Breiten, gefüllte Kampagne): grün, mit
  Werte- und Anzahlprüfung je Signatur und der Zusicherung "Minimum = 7".
- Eigene Erhebung über die fünf Grundlinien-Läufe: **29 Elemente in der Ruhelage** (vorher
  **153**), 33 über alle drei Zustände, verteilt auf **genau fünf** Signaturen —
  `span.slot-pip` und `span.filled.slot-pip` (je 2 bei 8 px), `span.tb-caret` (4 bei 9 px),
  `text.ds-hist-face-label` (20 bei 8) und `text.ds-hist-axis-label` (1 bei 7).

**Jede Ausnahme trifft eine existierende Stelle** — das prüft die VERWESUNGSPROBE von
`W5-R-09` auf die Anzahl genau, und sie ist grün.

**Die Liste ist mit 34 Elementen in 5 Signaturen länger als die 25 Stellen, die E-4 nennt,
und das muss hier stehen statt in einer Fußnote.** E-4 führt 21 SVG-Beschriftungen und 4
`.slot-pip`. Dazu kommen 5 `.kbd-hint` (8 px) und 4 `.tb-caret` (9 px), beide in den
Schritten 4 und 5 einzeln beurteilt. Auf die Frage, die E-4 wirklich stellt — "was von dem,
was man LIEST, ist kleiner als 11 px?" — lautet die Antwort **26**: 21 SVG-Beschriftungen in
Benutzereinheiten und 5 Tastenhilfen. Die 8 `.slot-pip`/`.tb-caret` tragen keinen
Textinhalt. Die eine Abweichung von E-4 sind damit die fünf Tastenhilfen, und ihr Grund ist
gemessen: bei 11 px laufen sie ineinander.

### Die Linux-Nachstellung

Der Auftrag verlangt "die volle Suite ODER mindestens jede Leiste und jede Eingabe unter der
breiten Schrift". Gefahren ist der zweite Weg, beziffert, über alle 24 Ansichten, Vorzustand
`7e4aa09` gegen HEAD, je mit Segoe und mit Verdana (Faktor 1,1554 — Textbreite 114,75 ->
132,59 px, am CI-Befund kalibriert), bei 1440 und 375 px:

| Lage | Leisten gesehen | beschnitten | Überhang | Eingaben | beschnitten | Knöpfe | beschnitten | Seitenüberlauf |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440 / Segoe | 193 -> 193 | 0 -> 0 | 0 -> 0 | 50 -> 50 | 0 -> 0 | 209 -> 209 | 0 -> 0 | 0 -> 0 |
| 1440 / Verdana | 193 -> 193 | 0 -> 0 | 0 -> 0 | 50 -> 50 | 0 -> 0 | 209 -> 209 | 0 -> 0 | 0 -> 0 |
| 375 / Segoe | 191 -> 191 | 0 -> 0 | 0 -> 0 | 50 -> 50 | 0 -> 0 | 188 -> 188 | 0 -> 0 | 0 -> 0 |
| 375 / Verdana | 191 -> 191 | 0 -> 0 | 0 -> 0 | 50 -> 50 | 0 -> 0 | 188 -> 188 | 0 -> 0 | 0 -> 0 |

**Keine Änderung in keiner der vier Lagen.** Das ist die Fehlerklasse, die die CI schon
einmal 12 Tests gekostet hat, und diese Welle ändert Schriftgrößen — die Probe gehört dazu.

**Die Probe hat sich dabei selbst einmal belogen, und das bleibt hier stehen.** Der erste
Lauf meldete in allen vier Lagen "0 -> 0" bei JEDER Zeile — weil `page.evaluate` nur EIN
Argument übergibt, der Aufruf mit zweien warf, und ein `.catch(() => null)` den Fehler
verschluckte. Eine Messung, die nichts gesehen hat, meldet "0 Änderungen" und sieht aus wie
ein Erfolg. Die Fassung oben hat deshalb eine Selbstprobe: sie nennt die Zahl der GESEHENEN
Leisten, Eingaben und Knöpfe und schreibt "NULLMESSUNG" hin, wenn eine davon 0 ist.

### E-2 nachgerechnet: der Auto-Zoom

E-2 ist mit dem Satz begründet, unter 16 px löse ein Telefon beim Antippen den Auto-Zoom
aus. Diese Zusage ist nirgends bewacht, also hier gemessen — 201 antippbare Textfelder (die
fünf Aufklapp-Formulare geöffnet), bei 375 px:

| | vorher (7e4aa09) | nachher |
| --- | --- | --- |
| antippbare Felder | 201 | 201 |
| davon unter 16 px | **75** | **75** |
| die Grenze neu unterschritten | — | **0** |
| die Grenze verlassen | — | 0 |
| Größe gesunken / gestiegen | — | 71 / 11 |

**Kein einziges Feld überquert die 16-px-Linie in irgendeine Richtung.** Die Welle
verschlechtert die Lage also nicht — aber sie verbessert sie auch nicht, und die Zahl 75
gehört benannt: **E-2 schützt nachweislich weniger, als sein Begründungssatz verspricht.**
Die Mobilvergrößerung hält 126 Felder bei oder über 16 px; die übrigen 75 lagen schon vorher
darunter (Suchfelder bei 14, Charakterformular 15,20 -> 14, Bestiar 13,33 -> 12). Das zu
entfernen wäre schlechter gewesen — das ist der Kern von E-2 und bleibt richtig. Dass es
reicht, ist nicht gemessen und war nie gemessen. Als Folgearbeit unten geführt.

### Der Stil-Sollstand

**Die Neuerhebung dieses Schritts ist byteidentisch mit der bestehenden Datei.** Mit
`UPDATE_STYLE_BASELINE=1` neu erhoben: SHA-256 vorher und nachher `2b7b99df8ced2d39…`,
`git diff` über die Datei **0 Zeilen**. Das ist die stärkste Form von "0 bewegt" — bewiesen
statt behauptet, und genau die Probe, deren Ausfall die Runde W5-E/1 nachträglich hat holen
müssen. `EXPECTED_DEVIATION_KEYS` und `EXPECTED_DEVIATION_KEYS_NARROW` sind **beide leer**
(nachgelesen, nicht erinnert) — das ist die eigentliche Ratsche dieses Schritts.

Schlüsselweise über die **ganze Welle** (`tools/vergleich-stil-sollstand.js --alt 7e4aa09
--neu HEAD --schluessel`, gerechnet auf den Digest-WERTEN):

| Durchgang | vorher | nachher | geändert | Zugänge | Abgänge |
| --- | --- | --- | --- | --- | --- |
| standard | 1213 | 1234 | 452 | 21 | 0 |
| narrow | 1123 | 1144 | 414 | 21 | 0 |
| reducedMotion | 1213 | 1234 | 452 | 21 | 0 |
| **SUMME** | **3549** | **3612** | **1318** | **63** | **0** |

**1318 und nicht 1460, und der Unterschied ist kein Widerspruch.** W5-E summiert die vier
Neuerhebungen der Welle einzeln (9 + 1143 + 24 + 284 = 1460); diese Zeile misst Anfang gegen
Ende. Ein Digest, der in W5-D und noch einmal in W5-E bewegt wurde, zählt dort zweimal und
hier einmal. **1460 ist die Zahl der Bewegungen, 1318 die Zahl der bewegten Schlüssel.**
Die 63 Zugänge sind dreimal dieselben 21 `dicestats`-Beschriftungen, die erst seit Schritt 8
eine Klasse tragen; **0 Abgänge** in allen drei Durchgängen.

### Die Bilderserie

`tests/e2e/features/welle-5-screens.spec.js`, hinter eigenem Schalter `WELLE5_SCREENS=1`,
Muster der vier Vorgänger. Auf gefüllter Kampagne, vier Themes: **24 Vollbilder + 15
Zustandsbilder + 12 Naheinstellungen = 51 je Theme, 204 insgesamt**, davon drei bei 375 px.
Dazu ein **Vorher/Nachher-Kontaktbogen** mit 15 Paaren (`kontaktbogen-welle-5.png`), beide
Spalten mit demselben Seed, demselben Theme und demselben Bildausschnitt, die Werte unter
jedem Bild GEMESSEN. Ablage unter `tests/e2e/__screens__/welle-5/`, von `.gitignore`
ausgenommen.

**Zwei Befunde am Messaufbau, in der ersten Runde gefunden und behoben:** (1) bei 375 px
liegt die feste Mobil-Kopfzeile über dem Formularkopf, `scrollIntoViewIfNeeded` wird dort
nie "stabil sichtbar" und lief in allen vier Themes in den Zeitablauf — genau beim Bild zur
E-2-Frage; (2) `Escape` schließt Modale, aber NICHT die Aufklapp-Formulare, weshalb die
Charakterkarte im Mobilbild vom offenen Formular verdeckt war.

### Geprüfte Tore

`npx jest` **2110/2110 in 78 Suiten** · `npx playwright test` **604 bestanden /
31 übersprungen / 0 Fehlschläge** (so gemessen in den zwei schnellsten von fünf Vollläufen;
zu den lastabhängigen Wacklern der drei langsameren siehe "Offene Punkte") ·
`pytest tests/build` **30** · `npm run lint` exit 0 mit
**exakt 363** Warnungen · `typecheck` und `typecheck:strict` exit 0 · beide Builds exit 0 ·
`check-f18-kaskade --check` OK (117 Abhängigkeiten) · `sync-aktenlage-anker --check` 0
Abweichungen · **CLAUDE.md unverändert** (`git diff 7e4aa09..HEAD -- CLAUDE.md` leer).

**Jede Abweichung vom Basiswert ist aufgerechnet, nicht gerundet:**

- Jest **1963 -> 2110 (+147)**: 110 in drei neuen Suiten (`typo-baseline.test.js`,
  `typo-map.test.js`, `stil-sollstand-vergleich.test.js`) plus 37 neue Fälle in
  `design-consistency.test.js` (W5-R-05 9 · W5-R-06 7 · W5-R-07 9 · W5-R-08 8 · W5-R-10 4).
  110 + 37 = 147, Ziffer für Ziffer.
- Suiten **75 -> 78 (+3)**: dieselben drei neuen Dateien.
- Playwright **595 -> 604 (+9)**: `schriftuntergrenze.spec.js` 4 (neu) ·
  `tastenhilfen.spec.js` 4 (neu) · ein neuer Fall in `breite-schrift.spec.js`
  ("(5) Titelgruppe und primäre Aktion teilen bei 375x812 eine Zeile"). 4 + 4 + 1 = 9.
- Übersprungen **27 -> 31 (+4)**: die vier Themes der neuen Bilderserie, die sich ohne
  `WELLE5_SCREENS=1` selbst überspringt — genau wie ihre vier Vorgänger.
- Lint **363 -> 363**, pytest **30 -> 30**, typecheck **0 -> 0**: unverändert.

**Ratschen — keine gestiegen, zwei gesunken:** DUBLETTEN **0** · `!important` **105 -> 104**
(−1) · Inline-Attribute **254 -> 252** (−2, und nur um 2, wie die Rechnung von E-2 es
vorgab) · `transition: all` **0** · SVG_MAX **0** · AUSSERHALB_MAX **0** · EM_MAX **6** ·
INLINE_AUSSERHALB_MAX **0**. Alle direkt nachgezählt, nicht aus den Schranken abgelesen.

### Offene Punkte

- **NEU, und für die nächste CI-Runde das Wichtigste hier: zwei lastabhängige Wackler in
  der vollen Suite, beide VORBESTEHEND und beide nachgewiesen, nicht vermutet.**

  (a) `computed-style-diff.spec.js`, Fall "Breitere Schriftmetrik bewegt den Digest nicht",
  braucht allein gemessen **25,1 s gegen eine 30-s-Schranke** — 4,9 s Reserve. In **drei von
  fünf** Vollläufen an HEAD lief er in den Zeitablauf. **Der Beweis, dass es nicht an dieser
  Welle liegt, ist gefahren und nicht geschlossen:** derselbe Fall fällt im Vollauf des
  VORZUSTANDS `7e4aa09` genauso aus (594 bestanden / 1 Fehlschlag / 27 übersprungen, also
  dieselben 595 wie der Basiswert — der Basiswert ist nur dann reproduzierbar, wenn dieser
  eine Fall nicht in den Zeitablauf läuft). Die Spec-Datei ist zwischen `7e4aa09` und HEAD
  **byteidentisch**; gewachsen ist nur ihre Eingabe, der Sollstand, um 63 von 3549
  Schlüsseln (+1,8 %).

  **Die Messumgebung selbst ist der Mitverursacher, und das gehört dazu statt verschwiegen:**
  dieselbe Suite brauchte im Lauf der Abnahme nacheinander 5,6 · 5,7 · 6,1 · 7,4 · 8,2
  Minuten — monoton steigend, bei unverändertem Baum. Am Ende lagen 14 `node`-Prozesse auf
  der Maschine. Die zwei grünen Läufe sind die beiden schnellsten; die drei roten sind die
  drei langsamsten. Wer die Zahl nachfahren will, fährt sie auf einer ruhigen Maschine.

  (b) `multi-tab-persistence.spec.js`, Vorbedingung "A sieht Bs Schreibvorgang im geteilten
  Speicher", ist in EINEM der fünf Vollläufe rot geworden; `localStorage` trug dort noch den
  Saatzustand. Das ist ein Wettlauf zwischen dem Anlaufschreiben der Seite A und `await
  saveImmediate()` auf Seite B. Drei Isolationsläufe grün. Die Spec-Datei und **alle**
  Module, die sie anfasst, sind in dieser Welle unverändert: `systems/avatars.js`,
  `systems/spellslots/persistence.js`, `systems/campaign-manager/campaign-manager.js`,
  `core/init.js`, `tests/e2e/helpers/test-utils.js` — einzeln mit `git diff --quiet`
  nachgeprüft.

  **Gegenprobe zur Frage, ob die Welle irgendetwas Nicht-Typografisches angefasst hat:** der
  gesamte JS-Diff `7e4aa09..HEAD` über `core features systems ui utils render loader.js`
  enthält **16 Zeilen**, die weder `font-size`/`font-weight` noch Kommentar sind — die zwei
  neuen Klassen an den Histogramm-Beschriftungen (Schritt 8, damit die Ratsche sie sieht),
  fünf Ersetzungen eines Inline-Stils durch eine Klasse (Schritt 7) und ein Kommentarblock.
  Nichts davon berührt Persistenz, Mehrfach-Tab-Verhalten oder Zeitverhalten.
- **NEU: E-2 schützt weniger, als sein Begründungssatz verspricht** (Zahlen oben). 75 von
  201 antippbaren Textfeldern liegen bei 375 px unter 16 px, vorher wie nachher. Keine
  Regression dieser Welle — aber auch keine Zusage, die man zitieren dürfte. Wer sie
  einlösen will, braucht eine eigene Einheit und eine Ratsche, die das Element misst.
- **Unverändert aus W5-E, und für die Welle 5 die stärkste offene Stelle: die
  Histogramm-Beschriftungen sind auf dem Telefon 4,76 bis 5,44 px groß**, obwohl ihre
  Deklaration 7 bzw. 8 sagt. Ursache ist die viewBox-Skalierung, nicht der Wert.
- **Unverändert: die Layoutregel der Tastenhilfen** (nur die Hilfe des berührten Knopfes
  zeigen) ist die Voraussetzung dafür, die 8 px je auf 11 zu heben. Funktionsänderung.
- **Unverändert: die Schrift-FAMILIE der Bedienelemente.** Die neue Regel setzt nur
  `font-size`; Knöpfe und Felder benutzen weiter die Schrift des Systems.
- **RESTSCHULD, ausdrücklich NICHT in dieser Welle behoben und hier geführt, damit sie nicht
  verschwindet: die zehn kaputten `woff2` unter `assets/fonts/`** (kyrillische bzw.
  devanagari Teilmengen, kein lateinischer Kleinbuchstabe) **und der `file://`-Pfad der
  gebündelten Schriften.** E-1 nimmt beides ausdrücklich aus der Welle 5 heraus (kein
  Schriftwechsel, keine gebündelte Schrift, die sieben `tnum`-Deklarationen entfallen
  ersatzlos als gemessener Nullzug). Es bleibt eine eigene Reparatur. Dazu gehören die vier
  wirkungslosen Editor-Schriften in `EDITOR_FONTS` und die fehlende Glyphendeckungs-Probe im
  Testnetz.
- **Unverändert: der tote Würfel-Behälter `#dice-result`** und **die fehlende
  Zwischensprosse zwischen 34 und 72 px** (die Uhr im 250-px-Ring — der Kontaktbogen zeigt
  sie, und sie wirkt im Ring jetzt kleiner).
- **Messlücke der Bilderserie, benannt statt geschönt:** die Naheinstellung
  `editor-tastenhilfen` zeigt die vier `.tb-caret`, nicht die fünf `.kbd-hint` — die
  erscheinen erst beim Berühren EINES Knopfes, und der Zeiger steht beim Auslösen auf der
  Leiste. Die Zahlen dazu stehen in `tastenhilfen.spec.js`. Ebenso: in den drei Mobilbildern
  liegt die rote Mehrfach-Tab-Warnung über der Werkzeugleiste — ein Artefakt des
  Messaufbaus (ein zweiter Kontext hielt die Kampagnensperre), keine Änderung dieser Welle.
- **`npm run check` bleibt vorbestehend rot**, weil `prettier --check` über den ganzen Baum
  läuft. Die eine in dieser Einheit angelegte Datei (`welle-5-screens.spec.js`) ist einzeln
  geprüft und konform.

### Befehle

```bash
# Der Grundlinien-Diff, die Hauptabnahme dieser Welle
node tools/typo-baseline.js --out nachher.json
node tools/typo-baseline.js --diff grundlinie-v5.json nachher.json --schwelle 2

# Die Zielquote mit Zaehler und Nenner
node tools/sync-typo-tokens.js --check

# Die Untergrenze am Element (4 Faelle, zwei Breiten, drei Zustaende)
npx playwright test tests/e2e/features/schriftuntergrenze.spec.js

# Die Bilderserie und der Kontaktbogen
WELLE5_SCREENS=1 npx playwright test tests/e2e/features/welle-5-screens.spec.js

# Der Sollstand: Neuerhebung muss byteidentisch sein
UPDATE_STYLE_BASELINE=1 npx playwright test tests/e2e/features/computed-style-diff.spec.js
git diff --stat -- tests/e2e/baselines/computed-style-baseline.json   # muss leer sein
```

---

## W6-D — Zwei Zähler zwei Namen, und die Phantom-Halte aus der Tabulatorreihenfolge (2026-10-07)

**Status: ERLEDIGT.** Schritt 7 des geprüften Plans plus Entscheidung **W6-E-4 = B**. Drei
Commits: der Rotnachweis zuerst (`d450a42`), dann die Zähler (`0a3c0ef`), dann die
Phantom-Halte (`4fd464f`). Basis `186e4e7`. Alle Zahlen unten sind an **meinem** Stand
gemessen, nicht aus Plan oder Vermessung übernommen; wo eine Zahl der Vorlage widerspricht,
steht beides.

### Der Zählerfehler, in zwei Zeilen Messwert

Der Zähler in der Werkzeugleiste der Zauber- und der Auftragsansicht stand im Normalbetrieb
**dauerhaft auf 0**, egal wie viele Zauber oder Aufträge im Bestand lagen. Am gebauten
Bündel, gefüllte Kampagne, vorher und nachher mit demselben Skript:

| Handgriff | Element | vorher | nachher |
| --- | --- | --- | --- |
| 2 Zauber in `D.spells`, **nur** `renderSpells()` | `#spells-count` | `0` | `2` |
| 1 Auftrag in `D.quests`, **nur** `renderQuests()` | `#quests-count` | `0` | `1` |
| letzten Auftrag gelöscht, **nur** `renderQuests()` | `#quests-count` | `0` | `0` |
| ohne Filter | Filterrückmeldung | `📖 2` | `📖 2` |
| Stufenfilter 1 | Filterrückmeldung | `📖 1/2` | `📖 1/2` |

`renderSpells()` und `renderQuests()` sind die Pfade, die **jede** Zauber- und
Auftrags-CRUD geht. `renderAll()` — die einzige Stelle, die den Zähler bisher über
`updateIOCounts()` schrieb — läuft nur beim Import, beim Zurücknehmen und beim
Wiederherstellen. Beide Renderpfade rufen jetzt `setViewCount()` selbst, und bei den
Aufträgen steht der Aufruf **vor** der frühen Rückkehr des Leerzustands: sonst bliebe der
Zähler nach dem Löschen des letzten Auftrags auf der alten Zahl stehen, also genau
umgekehrt falsch. Beide Richtungen sind gemessen und beide stehen in der Ratsche.

### Der Widerspruch des Handoffs, aufgelöst durch zwei Namen (W6-E-3 = A)

Der Handoff will beide Zähler behalten **und** die F-10-Ratsche so verschärfen, dass nur
ein Schreibweg erlaubt ist. Das geht nicht zusammen — rot nachgefahren: mit `'spell'` in
`COUNTED_VIEWS` wird F-10 Test 3 rot mit genau **einem** Befund, und grün wird er nur, wenn
der Leser der Filterrückmeldung verschwindet. Dann ist die Rückmeldung, die §3.7
desselben Handoffs ausdrücklich behalten will, ein leeres `div`.

Entschieden und ausgeführt: die Rückmeldung heißt `#spells-filter-count` und fällt damit
**nachweislich** aus dem Schema — die Regex von F-10 Test 3 kann sie nicht treffen, weil
ihre Zeichenklasse keinen Bindestrich enthält. In der Gegenprobe von W6-R-09 beidseitig
vorgeführt. F-10 bleibt dreifach grün, **ohne** Ausnahmeliste.

### Der eigentliche Risikopunkt waren zwei Layout-Deklarationen, nicht die Farbe

Der gelöschte Inline-Stil trug vier Deklarationen, und zwei davon sind Layout:
`white-space: nowrap` (sonst bricht `📖 1/2` um) und `margin-left: auto` (das einzige
Mittel, das den Zähler im Flex-Streifen nach rechts schiebt — das Elternelement führt kein
`justify-content`). Beide sind in `.filter-count` mitgegangen. Gemessen am Bündel, in vier
Themes:

| Zustand | Abstand der rechten Kante zum rechten Innenrand |
| --- | --- |
| mit dem alten Inline-Stil | **0,0 px** |
| mit der neuen Klasse | **0,0 px** (dark, light, sepia, contrast) |
| mit zurückgenommenem `margin-left` | **296,3 px** nach links, an die Schulfilter |

Die berechneten Werte der Rückmeldung sind vor und nach dem Umbau identisch: 12 px,
`rgb(136, 136, 136)`, `nowrap`. Die Klasse ist dieselbe Angabe, nur an einem Ort, den eine
Medienabfrage erreichen kann.

`.filter-bar { gap }` ist von 6 px auf `var(--space-sm)` = 8 px gehoben (§3.7 verlangt die
Abstandsleiter, 6 px stand auf keiner Sprosse). Drei Verwendungen im Markup, alle im
Zauberfilter. Gemessene Folge: die drei Marken-Reihen werden zusammen **46,0 px** breiter
(23 Spalte × 2 px), der `auto`-Rest links von der Rückmeldung sinkt von 342,3 auf
296,3 px, ihre rechte Kante bleibt bei 0,0 px.

### Die Phantom-Halte: eine Zeile, 384 Halte je Theme (W6-E-4 = B)

Die schwebende Editorleiste trug `position: fixed; display: flex; opacity: 0` **ohne**
`visibility: hidden` und blieb damit im Layout UND in der Tabulatorreihenfolge;
`pointer-events: none` deckte nur die Maus ab. In **jeder** Ansicht liefen zwölf
Tabulaturschritte dorthin — 9 `.editor-btn` und 3 `.editor-select` — und der Fokus
verschwand dort in nichts, weil ein Ring auf einem Vorfahren mit `opacity: 0` selbst
`opacity: 0` hat.

Echte Tabulatorsprünge, gefüllte Kampagne, 1600×1000, gebautes Bündel, frische Seite je
Theme, 24 Ansichten + 3 Aufklapp-Formulare + 6 Modale. Dasselbe Skript vorher und nachher:

| Theme | Halte | sichtbar | **unsichtbar** | davon in der Leiste | Ringe | ≥ 3:1 | Boden |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dark vorher | 1761 | 1319 | 442 | **384** | 1319 | 1319 | 7,29 |
| dark nachher | 1372 | 1314 | **58** | **0** | 1314 | 1314 | 7,29 |
| light vorher | 1743 | 1301 | 442 | **384** | 1301 | 1301 | 3,50 |
| light nachher | 1333 | 1276 | **57** | **0** | 1276 | 1276 | 3,50 |
| sepia vorher | 1743 | 1301 | 442 | **384** | 1301 | 1301 | 3,44 |
| sepia nachher | 1377 | 1319 | **58** | **0** | 1319 | 1319 | 3,44 |
| contrast vorher | 1703 | 1274 | 429 | **372** | 1274 | 1274 | 11,34 |
| contrast nachher | 1359 | 1301 | **58** | **0** | 1301 | 1301 | 11,34 |

Der Kontrastboden ist in allen vier Themes **unverändert** — die Änderung nimmt Halte weg,
sie berührt keinen Ring. Gerechnet gegen die **geschichtet** ausgerechnete Trägerfläche,
einschließlich der themenblinden Modalfläche: `.modal { background: rgba(26,26,26,0.95) }`
löst über dem Schleier zu `#191919` (dark) / `#1e1e1e` (light) / `#1e1d1d` (sepia) /
`#191919` (contrast) auf und trägt dort 109 Ringe je Theme mit den Minima 8,36 / 3,50 /
3,50 / 12,54.

**Die Nebenwirkung ist gemessen, nicht abgeschätzt.** Abtastung je Bild über 300 ms, auf
dem echten Weg (Textauswahl im Wiki-Editor):

| Richtung | 4 ms | 37 ms | 70 ms | 104 ms | 137 ms | 154 ms | 170 ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ausblenden | 1,000 sichtbar | 0,888 sichtbar | 0,424 sichtbar | 0,147 sichtbar | 0,030 sichtbar | 0,007 sichtbar | 0,000 **verborgen** |
| Einblenden | 0,000 verborgen | 0,345 sichtbar | 0,740 sichtbar | 0,925 sichtbar | 0,993 sichtbar | — | 1,000 sichtbar |

Die ganze 150-ms-Ausblende ist sichtbar; der einzige verborgene Punkt der Einblende liegt
bei Deckkraft 0,000, wo es nichts zu sehen gibt. Dafür steht `visibility` in der
Eigenschaftsliste des Übergangs. **Kein `--trans-reveal`-Token:** die zwei Reveal-Listen
laufen auf 200 und 300 ms, diese Leiste auf `--dur-fast` = 150 ms, und eine zu lange
visibility-Dauer hielte die Leiste nach dem Ausblenden sichtbar — derselbe Fehler, nur
später, genau wie W4-R-02 Teil B ihn beschreibt.

**Ihre zwei Geschwister waren nie betroffen,** und das war der eigentliche Befund:
`.table-context-toolbar` und `.link-context-toolbar` schalten über `display: none` und
tauchen in keinem Tabulatorlauf auf. Nur die eine Leiste wich ab. `display` statt
`visibility` kommt hier trotzdem nicht in Frage — `display` ist nicht übergangsfähig, die
Blende wäre verloren.

### Abgetragen durch T-A (2026-10-07): die gekaperte Leertaste

**Die Restschuld-Liste unten war nicht der schlimmste Teil.** Sie zählt Stellen, die man
ohne Maus nicht *erreicht*. Darunter lag ein Fehler an Knöpfen, die man sehr wohl erreicht
— sie taten beim Tastendruck etwas **anderes** als das, was draufsteht.

Gemessen am gebauten Bündel, gefüllte Kampagne, echte Tabulatorsprünge, je Ziel ein
frischer Seitenaufbau, Ziel über Objektidentität aufgelöst, `click`-Ereignisse am Dokument
in der Capture-Phase gezählt und nach `isTrusted` getrennt — bei **sechs und bei zwanzig**
Kämpfern mit gleichem Ergebnis:

| Ziel (Halt) | vorher | nachher |
| --- | --- | --- |
| `prevTurn` (21) | Klick 0, Zug 0 → **1** (vorwärts!) | Klick 1, Zug 0 → 5 / 0 → 19 |
| `nextEncounterRound` (22) | Klick 0, Runde bleibt 1 | Klick 1, Runde 1 → 2 |
| `addPartyToInit` (23) | Klick 0, 6 → 6 / 20 → 20 | Klick 1, 6 → 12 / 20 → 40 |
| `rollAllInitiative` (24) | Klick 0, 0 Würfe | Klick 1, 6 / 20 Würfe |
| `show-condition-reference` (27) | Klick 0, kein Modal | Klick 1, Modal offen |

Der Spielleiter tabulierte auf „◀ Zurück", drückte die Leertaste — und der Zug ging
**vorwärts**. Der Kampf war eine Runde falsch und niemand sah warum. Ursache war die
`isTyping`-Schranke in `systems/spellslots/keyboard-shortcuts.js`: ein fokussierter
`<button>` zählte dort nicht als „am Tippen", also fing der Leertasten-Zweig die Taste ab
und schickte sie an `nextTurn()`.

**Kein Doppelfeuer — gezählt, nicht vermutet.** An jedem Ziel steht nachher `echt=1` und
`synthetisch=0`. Der tragende Fall ist „▶ Nächster Zug": dort täten Kaperung und Knopf
*dasselbe*, ein Doppelfeuer wäre an der Wirkung nicht zu erkennen. Vorher 0 Klicks und Zug
+1 (das Kürzel), nachher 1 Klick und Zug **exakt +1**. Ebenso `addPartyToInit`: 6 → 12 und
20 → 40, also genau **ein** Anhängen. `scrollY` bleibt überall 0 — ein fokussierter
`<button>` unterdrückt die Vorgabe der Leertaste selbst.

**Wichtig für die Liste unten:** das waren Knöpfe, die schon echte `<button>` **sind**. Kein
`tabindex` und kein `role` hätte daran etwas geändert — die drei Stufen, die die Restschuld
unten nennt, hätten diesen Fehler nicht berührt. Wer die 90 Stellen nachrüstet, **ohne**
diese Schranke, macht 90 weitere Ziele erreichbar, auf denen die Leertaste dann dasselbe
Falsche tut.

Nicht mitgesperrt sind `r`/`t`/`l`/`k`/`n`/`p`/`/` und `Alt+Ziffer` — `/` und `k` sind
heute der einzige Zugang zu ihrer Fläche; eine „konsequente" Ausweitung der Schranke nähme
dem Nutzer einen Weg weg, um einen Fehler zu beheben, den sie nicht verursachen. Ohne Fokus
(`activeElement = BODY`) bleibt der gewohnte Griff: Leertaste = nächster Zug, bei 6 und bei
20 Kämpfern nachgemessen.

**Nachtrag Runde 1 (2026-10-08): die Ziffern `1`–`9` gehören NICHT in diese Schranke.**
Die erste Fassung hat sie mitgesperrt (O-7) und dabei „0 nativer Klick" mit „falsche
Handlung" gleichgesetzt. Bei der Leertaste trifft das zu — der Knopf sagt „zurück", die
Taste tat „vorwärts". Bei einer Ziffer nicht: `3` heißt „zeig mir die NSC", und das ist
genau die dokumentierte, gewollte Handlung. Ein Ziffernanschlag ist keine Bitte, das
fokussierte Ding zu bedienen. Gemessen gab es dort auch nichts zu schützen und etwas zu
verlieren:

| Messung | vorher (mit Ziffern-Schranke) | nachher |
| --- | --- | --- |
| Ziffer `3` auf ertabuliertem Knopf (Halt 25) | Klicks echt 0 / synth 0, Ansicht bleibt | Klicks echt 0 / synth 0, Ansicht → NSC |
| Ziffer `3` nach echtem Mausklick, 6 von 6 dauerhaften Knöpfen | Ansicht unverändert | Ansicht → NSC |
| ⌨️ per Maus → Escape → `7` | `view-dashboard` (Fokus bleibt am ⌨️-Knopf) | `view-initiative` |
| Gegenprobe: Hilfe per `?` → Escape → `7` (Fokus BODY) | wirkt | wirkt |
| Leertaste auf `prevTurn` (Halt 21) | Klick 0, Zug ging vorwärts | Klick 1, Zug 0 → 5 / 0 → 19 |

Also: **null** native Klicks durch eine Ziffer, vorher wie nachher — ein `<button>` hat
keine Ziffern-Handlung, es gab kein Doppelfeuer zu verhindern. Dafür war das Kürzel nach
jedem gewöhnlichen Mausklick tot, bei 6 und bei 20 Einträgen je Typ und in allen vier
Themes. Am schiefsten der Weg, der sich selbst widerlegt: wer den ⌨️-Knopf anklickt, in der
Hilfe „Initiative = 7" liest, Escape drückt und 7 tippt, bekam nichts — die App warb weiter
für eine Taste, die nach einem Klick nicht mehr ging, zweifach dokumentiert (Kürzeltabelle
und `assets/templates/modals-editors.html`). Zu revidieren war die **Entscheidung** O-7,
nicht die Treue ihrer Umsetzung. Die Variable heißt jetzt `beanspruchtLeertaste`, damit der
Name nicht behauptet, was der Code nicht tut.

Belegt nebenbei, warum die Nachrüstung der 90 Stellen unten hier gefahrlos ist: der
Tabulatorring der Initiative-Ansicht enthält bei sechs Kämpfern **87 Halte und 0
nicht-native Elemente** (80 `BUTTON`, 1 `BUTTON[role=tab]`, 2 `INPUT[text]`, 3
`INPUT[number]`, 1 `SELECT`). Keines davon verarbeitet eine Ziffer nativ;
`INPUT`/`TEXTAREA`/`SELECT`/`contentEditable` deckt `isTyping` unverändert ab.

Wächter: `tests/e2e/features/tastatur-ausloesung.spec.js`, 12 Fälle, in der vollen E2E-Suite
— Fall (g) sichert Ansichtswechsel UND `echt=0`/`synth=0` in **einem** Satz zu (wer nur das
erste zusichert, lädt ein Doppelfeuer ein; wer nur das zweite zusichert, schreibt den
Verlust des Kürzels fest), Fall (g2) den Maus-Weg über die In-App-Hilfe.
Nebenbefund derselben Messung: beim **ersten** Aufbau belegen die zwei Knöpfe des
Umzugs-Hinweises die Halte 1 und 2 — nach einem Neuladen ist er weg und die ganze Reihe
rutscht um zwei nach vorn (19/20/21/22/18 statt 21/22/23/24/20). Wer Tabulatorwege
vergleicht, muss beide Lagen auseinanderhalten.

### Abgetragen durch T-B (2026-10-12): der fehlende keydown-Zweig im Verteiler

**Das ist die Vorarbeit für die Liste unten, nicht ihre Erledigung.** Durch diese Einheit
wird **keine** einzige Stelle neu erreichbar — die Zahl der Tabulatorhalte ist vorher und
nachher identisch (gemessen: 20/26/29/37/3/22/85/47/68/24 an zehn Zielen). Was sie baut,
ist der Mechanismus, der bei der Nachrüstung darüber entscheidet, **ob ein nachgerüstetes
Element auf Enter und Leertaste überhaupt etwas tut**. Ohne ihn wäre die Nachrüstung aus
der Liste unten wirkungslos: ein `div[tabindex="0"]` ist fokussierbar und sieht wie ein
Knopf aus, aber der Browser macht aus Enter und Leertaste darauf **kein** `click`.

Gemessen am gebauten Bündel (Entwicklungs- **und** Produktionsbündel, Wert für Wert
gleich), gefüllte Kampagne, 1440 px, echte Tastendrücke, je Ziel ein frischer
Seitenaufbau, Ziel über Objektidentität aufgelöst, `click`-Ereignisse am Dokument in der
Capture-Phase gezählt und nach `isTrusted` getrennt — bei **sechs und bei zwanzig**
Einträgen je Typ mit gleichem Ergebnis:

| Ziel (Halt) | vorher | nachher |
| --- | --- | --- |
| nachgerüstetes `div.dash-char` (20) | 0 Klicks, Ansicht bleibt, **scrollY 0 → 143 / 564** | 1 synth., → `view-party`, scrollY 0 |
| nachgerüstetes `div.collapsible-header` (26) | 0 Klicks, Formular zu, **scrollY 0 → 123 / 787** | 1 synth., `#char-form` offen, scrollY 0 |
| nachgerüstetes `div.char-card-hp` (29) | 0 Klicks, kein Rechner | 1 synth., Rechner offen, `#char-form` bleibt **zu** |
| nachgerüstete `label.char-resistance-chip` (68) | 0 Klicks, `.selected` bleibt `false` | 1 synth., `.selected true`, `checked` bleibt `false` |
| echter `button[roll-dice=4]` (20) | 1 Klick, echt 1 / synth 0, 1 Wurf | 1 Klick, echt 0 / synth 1, 1 Wurf |
| echter `button[call=nextTurn]` (20) | 1 Klick, Zug 0 → 1 | 1 Klick, Zug 0 → 1 |

Die beiden Spalten „vorher" mit dem Seitenlauf sind der Teil, der am Spieltisch weher tut
als ein unerreichbarer Knopf: das Dokument **rollt bei jedem Anschlag weg**, und zwar um
so weiter, je voller die Kampagne ist.

**Kein Doppelfeuer — gezählt, nicht vermutet, und gegengeprobt.** Auf einem echten
`<button>` ist der Zweig gefährlich: der Browser würde aus derselben Taste ohnehin ein
`click` machen. Derselbe Zweig, zur Laufzeit durch eine Fassung **ohne**
`preventDefault()`/`stopPropagation()` ersetzt, dann dieselbe Messung:

| Gegenprobe (ohne die zwei Zeilen) | Messung |
| --- | --- |
| `button[roll-dice=4]`, Leertaste | **2 Klicks** (echt 1 / synth 1), **2 Würfe** |
| `button[call=nextTurn]`, Leertaste | **2 Klicks**, Zug 0 → **2** |
| nachgerüstetes `div.dash-char`, Leertaste | 1 Klick, **scrollY 787** |

Zwei Würfe statt einem, und der Zug springt um **zwei** — genau der Fehler, den T-A gerade
beseitigt hat, nur aus der anderen Richtung. **Wer eine der beiden Zeilen beim Aufräumen
für redundant hält, bricht jeden `<button>` der App bzw. gibt die gekaperte Leertaste
zurück.** Eine *gehaltene* Taste (1,5 s) löst ebenfalls nur **einmal** aus, bei
Leertaste und Enter, und rollt dabei nicht.

**Das `stopPropagation()` ersetzt die Schranke aus T-A nicht.** Es entzieht die Taste dem
globalen Einzeltasten-Lauscher, der auf demselben Knoten in der *Bubble*-Phase sitzt — aber
nur dort, wo dieser Zweig greift. Ein fokussierbares Element **ohne** `data-action` oder
mit einer nicht registrierten Aktion (`<summary>`, die Assistenten-Ablagezonen) fällt
weiterhin allein unter `beanspruchtLeertaste`. Beide Schichten bleiben nötig.

**Nachtrag Runde 1 (2026-10-12): diese Aussage war bis `736404b` von keinem Wächter
gedeckt.** Die sechs Fälle (a)–(f) in `tests/e2e/features/tastatur-ausloesung.spec.js`
bewachten bis T-B die Schranke aus T-A — sie standen auf `echt: 1`, also auf dem nativen
Klick, den die Schranke durchließ. Seit dem `keydown`-Zweig stehen sie auf `echt: 0 /
synthetisch: 1` und bewachen damit den neuen Zweig. Nachgemessen: nimmt man
`!beanspruchtLeertaste &&` aus dem Leertasten-Zweig heraus und baut neu, bleiben beide
Tastaturdateien grün (36 bestanden), und keine andere Datei im Testbaum drückt überhaupt
eine Leertaste. Tragend ist die Schranke dabei weiter — über 88 echte Tabulatorhalte der
Initiative-Ansicht (sechs Kämpfer, 1440 px, Registrierung gegen
`EventDelegation._handlers` geprüft) ist **genau ein** Halt fokussierbar, nicht tippend
und ohne registrierte Aktion: `button.nav-tab` „🏠 Start" auf Halt 13, denn die
Hauptnavigation arbeitet mit `data-view`.

| Messung auf diesem Halt       | mit Schranke               | ohne Schranke     |
| ----------------------------- | -------------------------- | ----------------- |
| `D.initiative.currentTurn`    | 0 → **0**                  | 0 → **1**         |
| aktive Ansicht                | initiative → **dashboard** | bleibt initiative |
| Klicks am Ziel (echt / synth) | **1 / 0**                  | **0 / 0**         |

Fall (l) „Die Schranke aus T-A ist bewacht" deckt die Lücke. Er sucht das **Merkmal**
(`<button>` ohne registrierte Aktion), nicht die Haltnummer — die verschiebt sich mit den
Nachrüstungen der Schritte 4 und 5. Roter Nachweis mit derselben Mutation: 1 Fehlschlag /
36 bestanden, „Expected 0, Received 1".

**Die riskantere Hälfte ist, was der Zweig NICHT anfasst.** Am gebauten Bündel gezählt
sitzen im Dokument Tippflächen **mit** eigener Aktion oder **in** einem Element mit
Aktion: der Wiki-Editor als `div[contenteditable][data-action="wiki-content-input"]`,
`textarea#quick-notes` innerhalb von `div[data-action="backdrop-close"]`, 38
`input[type=checkbox]` in `label[data-action="toggle-selected"]`, 15 Suchfelder und ~45
Auswahllisten mit eigener Aktion. Ein Zweig, der die Leertaste dort abfängt, macht den
Wiki-Editor unbenutzbar und schließt die Schnellnotizen beim Tippen. Die Schranke hängt
deshalb an der **Quelle** des Ereignisses, nicht am aufgelösten Ziel — hinge sie am Ziel,
wäre genau der Fall „Textfeld in einer Schale mit Aktion" offen. Nachgemessen und grün:
Suchfeld, Textfeld und Wiki-Editor nehmen weiter `"a b"` an, das Modal bleibt offen, ein
Kontrollkästchen schaltet weiter **nativ** (echt 1 / synth 0), ein `<summary>` klappt
weiter nativ auf (fünf in der Würfelansicht, keines mit einem `[data-action]`-Vorfahren).
Keine Absende-Falle: der Quellbaum enthält **0** `<form>`-Elemente, nachgezählt in
Quelltext und gebautem Dokument.

**Der synthetische Klick geht auf die Quelle, nicht auf das aufgelöste Ziel.** Keine
Geschmacksfrage: `backdrop-close` prüft `ctx.event.target === ctx.target` und schließt nur
bei einem Treffer auf der Schale selbst. Ein Klick auf das aufgelöste Ziel würde diese
Prüfung immer erfüllen — ein Tastendruck auf irgendetwas *innerhalb* der Schale würde den
Dialog schließen.

**Für die Liste unten heißt das:** die Nachrüstung braucht `tabindex="0"` plus — außer auf
einer Marke — `role="button"` (O-1), und **sonst nichts**. Kein eigener Tastenlauscher je
Stelle, keine `div → button`-Umbauten, keine Fallunterscheidung je Ansicht. Die 38
`label.char-resistance-chip` sind nachgemessen der Beleg dafür, dass eine Marke **ohne**
`role` trägt: Leertaste → 1 synthetischer Klick, `.selected false → true`, `checked`
bleibt `false` — identisch zum Mausklick (O-6).

Wächter: `tests/e2e/features/tastatur-verteiler.spec.js` (24 Fälle, zwei
Kampagnengrößen, in der vollen E2E-Suite) und
`tests/unit/event-delegation-keydown.test.js` (38 Fälle, die Entscheidungstabelle —
dort stehen die Lagen, die im Browser nicht erreichbar sind: `a[href][data-action]` ist
im Dokument unsichtbar, `input[type=button|submit|reset]` kommt nicht vor, und eine
gehaltene Taste lässt sich mit Playwright nicht verlässlich erzeugen). Der rote Nachweis
steht als eigener Commit: 16 Fehlschläge, 8 bestanden, zweimal reproduziert.

Nebenbefund für künftige Messungen an nicht-nativen Zielen: die zehn `span.dmg-chip` der
Würfelansicht liegen in einem **geschlossenen** `<details>` und sind auch nachgerüstet in
400 echten Tabulatorsprüngen nicht erreichbar. Wer sie messen will, muss die Klappe
vorher öffnen — sonst liest die Messung „unerreichbar", wo „zugeklappt" steht.

### Benannte Restschuld 1: der Rest des Tastatur-Strangs (90 Stellen)

W6-E-4 = B deckt **nur** die Phantom-Halte. Der Rest bleibt benannte Restschuld, und hier
ist er mit Zahl und Stellenliste. Frisch gemessen an meinem Stand, zweimal mit demselben
Ergebnis (gefüllte Kampagne, 24 Ansichten, echte Tabulatorsprünge, Ahnenprüfung gegen
geschlossene `<details>`): **355 sichtbare Bedienelemente, 90 nie per Tabulator erreicht
(25,4 %), davon 0 natürlich fokussierbar.** Die Vermessung vom 2026-10-06 nannte 92; der
Unterschied sind zwei Bestiar-Zeilen der virtuell gerollten Liste, deren Erreichbarkeit mit
der Rollposition schwankt. Durch diese Einheit ist **keine** Funktion neu erreichbar
geworden, wie die Entscheidung es vorhersagt.

| Ansicht | Zahl | Stelle | was man ohne Maus nicht kann |
| --- | --- | --- | --- |
| spells | **26** | `div.filter-chip` | Zauber nach Typ, Stufe, Schule filtern |
| bestiary | **23** | `div.bestiary-list-item` | ein Monster auswählen |
| loot | **10** | `div.loot-filter-chip` | Beute nach Kategorie filtern |
| dashboard | 7 | `div.dash-stat` | ins Feld springen, das die Kennzahl zeigt |
| dashboard | 2 + 1 | `span.dash-card-link`, `div.dash-char` | „Alle →", Charakterkarte |
| party | 4 | `span.slot-pip` | Zauberplätze abhaken |
| party | 1 + 1 | `div.char-card-header`, `div.char-card-hp` | Karte öffnen, HP-Rechner |
| npcs | 2 + 1 | `div.npc-filter-chip`, `div.npc-item` | filtern, NSC auswählen |
| locations | 1 + 1 | `div.loc-filter-chip`, `div.loc-item` | filtern, Ort auswählen |
| shops | 1 + 2 | `div.shop-header`, `span.entity-link` | Laden aufklappen, Verweis folgen |
| party/encounter/notes | 3 | `div.collapsible-header` | Formular aufklappen |
| encounter | 1 | `div.enc-filter-chip` | filtern |
| initiative | 1 | `div.init-value` | Initiativwert direkt bearbeiten |
| data | 1 | `div.campaign-item` | Kampagne wechseln |
| fraktionen | 1 | `div.fr-faction-card` | Fraktion auswählen |

Das Muster wiederholt sich dreimal, und die billigsten Stufen zuerst: (1) **ein**
`keydown`-Zweig in der Ereignisdelegation (sie hört heute nur `click`, `change`, `input`) —
ohne ihn ist jedes `tabindex` wirkungslos; (2) Elementtausch `div`/`span` → `<button
type=button>` für die fünf Marken-Familien, deren Gegenprobe im Baum schon läuft
(`.dice-chip` **ist** ein `<button>` und funktioniert vollständig); (3) `display: none` →
`.sr-only` an zwei CSS-Zeilen (`dashboard.css` und `loot.css`) macht 57 versteckte Kästchen
wieder fokussierbar, ohne sie zu zeigen — `.sr-only` existiert und ist 23-mal in Gebrauch,
und F-16 ist der Präzedenzfall. Was danach bleibt und ein eigenes Vorhaben ist: `role=dialog`,
Fokusfalle und Fokusrückgabe für die Modale (fast alles in **einem** Funktionspaar, plus vier
Stellen, die es umgehen) und 188 Marken ohne Bindung.

### Benannte Restschuld 2: 57 bis 58 unsichtbare Halte bleiben, aus drei anderen Quellen

Nach dieser Einheit liegt **kein** Halt mehr unter der Editorleiste. Was bleibt, ist
gemessen und nicht geschätzt — drei andere `opacity: 0`-Vorfahren, je Theme:

| Vorfahr | Halte | was es ist | warum es nicht diese eine Zeile ist |
| --- | --- | --- | --- |
| `#shortcuts-overlay` | 31–32 | die Tastenkürzel-Übersicht | eigene Ein-/Ausblende, eigener Öffnungsweg |
| `.search-clear-btn` | 18 | das Löschkreuz im Suchfeld | es blendet sich mit Texteingabe ein; es aus der Reihenfolge zu nehmen heißt entscheiden, ob es per Tastatur erreichbar sein soll |
| `.dmscreen-widget-hide` | 7 | der Verstecken-Knopf am Widget | erscheint beim Überfahren; dasselbe Urteil |

Jede der drei ist eine eigene Entscheidung über Bedienbarkeit, keine
Aufräumarbeit — darum stehen sie hier und nicht im Commit.

### Mitgezogene Arbeit, die im Schrittplan nicht steht

- **Stil-Sollstand regulär neu erhoben**, und es ist die kleinste Neuerhebung der Reihe:
  **0** bewegte Digests, **0** Abgänge, **genau 1** Zugang, in allen drei Durchgängen
  derselbe (`spells/div.filter-count#0`). Der Zugang entsteht nicht aus einer
  Stiländerung, sondern weil die Erfassung nur Elemente **mit** Klasse nimmt — die
  Rückmeldung hatte bisher keine und fiel durch. Schlüsselweise verglichen, nicht als
  Hashzahl. `EXPECTED_DEVIATION_KEYS` bleibt leer. Das `gap` der Filterleiste sieht der
  Sollstand **nicht**: `gap` ist keine der zwölf gehashten Eigenschaften.
- **F-19** `INLINE_MAX` 252 → 251. Nur um eins, obwohl der Inline-Stil vier Deklarationen
  trug — diese Zahl zählt Attribute. Dasselbe Missverständnis ist in der Datei schon
  zweimal aktenkundig.
- **W5-R-08 Selbstprobe** Templates 37 → 36, Gesamt 130 → 129. Die **Dateizahl** bleibt 6:
  `view-resources.html` führt gemessen noch zwei weitere Inline-Schriftgrößen und fällt
  nicht aus dem Geltungsbereich.
- **Zeilenanker nachgezogen,** alle aus den Meldungen der Ratschen selbst, keiner geraten:
  `core.css` wächst um 25 Zeilen oberhalb von 2236 → `DAUER_GEDULDET` 3345 → 3370 und die
  Blockangabe 3341 → 3366, dazu der Selbsttestfall, der denselben Anker führt.
  `spells.css` wächst um 36 Zeilen → die drei Schattenstellen von R-19
  (`.floating-toolbar` 450 → 454, `.table-context-toolbar` 539 → 575,
  `.link-context-toolbar` 577 → 613). Die 123 Zeilenanker **dieser Akte** waren und sind
  unberührt (`--check` meldet 0 Abweichungen) — sie liegen alle unterhalb der Einschübe
  bzw. in anderen Dateien.

### Zwei stille Fehlanker, beim Nachziehen gefunden (nicht von dieser Einheit verursacht)

- `design-consistency.test.js`, Prosa im W4-R-04-Block: die zwei Anker des
  reduced-motion-Blocks standen auf `:3325/:3327` und trafen am Vorzustand `186e4e7` eine
  **Leerzeile** bzw. `width: 18px` in einer Avatar-Regel — 43 Zeilen zu hoch. Die
  Verwesungsprobe prüft nur die **Schlüssel** der Erlaubnisliste, nicht die Anker in der
  Prosa; das Paar ist darum nie aufgefallen. Jetzt `:3368/:3370`, gemessen.
- **Noch offen, in Dateien, die diese Einheit nicht anfasst:** `hoehenbudget.spec.js`
  nennt `core.css:2307` für eine `height: calc(100vh - var(--view-frame-height, …))`-Zeile
  (am Vorzustand stand dort `color: var(--text-dim)`; die Deklaration liegt jetzt bei
  2516), und `typo-map.test.js` nennt `core.css:2693` für die `font-size: inherit`-Regel
  der Ortsleiste (am Vorzustand `.loc-view .loc-filter-chip`; jetzt 2779). Auch dieselbe
  Akte nennt `core.css:2276` für die erste Zeile (am Vorzustand ein Kommentartrenner).
  Alle drei waren **vor** dieser Einheit falsch und sind reine Prosa; keiner steht unter
  R-06. Sie gehören in einen eigenen Durchgang, nicht in einen Zählerschritt.

### Was diese Einheit NICHT in Prosa gebracht hat

Die inhaltlichen Korrekturen der Einheiten **W6-A, W6-B und W6-C** stehen weiter nur in
deren Commit-Rümpfen und in den Dateiköpfen ihrer Ratschen. Das ist Schritt 8 der Welle.
Diese Einheit hat nur ihren eigenen Schritt und ihre eigene Entscheidung verschriftet.

### Abnahme nachfahren

```bash
# Die drei Ratschen dieser Einheit
npx jest tests/unit/design-consistency.test.js -t "W6-R-09"
npx playwright test tests/e2e/features/zaehler.spec.js

# Der Zählerstand am echten Pfad (2 Zauber / 1 Auftrag, NUR renderSpells/renderQuests)
npx playwright test tests/e2e/features/zaehler.spec.js -g "W6-R-10"

# Die Phantom-Halte und die Blende
npx playwright test tests/e2e/features/zaehler.spec.js -g "W6-R-11"

# Das Editor-Regressionsnetz — die Leiste muss bedienbar bleiben
npx playwright test tests/e2e/features/editor-floating.spec.js tests/e2e/features/editor-formatting.spec.js tests/e2e/features/editor-insert.spec.js tests/e2e/features/editor-smoke.spec.js tests/e2e/features/tastenhilfen.spec.js

# Der Fokusring der Welle, mit Schalter
FOKUSRING=1 npx playwright test tests/e2e/features/fokusring.spec.js

# Der Sollstand: eine Neuerhebung muss jetzt byteidentisch sein
UPDATE_STYLE_BASELINE=1 npx playwright test tests/e2e/features/computed-style-diff.spec.js
git diff --stat -- tests/e2e/baselines/computed-style-baseline.json   # muss leer sein
```

---

## W6-F — Die Abnahme der Welle 6: der Tastaturlauf als Hauptnachweis (2026-10-07)

**Status: ERLEDIGT.** Schritt 8 des geprüften Plans und damit die **letzte Einheit des
Design-Handoffs v3**. Basis `3a4a2a9`, Vorzustand der ganzen Welle `e4ac3a7`. Zwei
Commits: die Ablichtung (`931b0cd`), dann diese Akte. Alle Zahlen sind an **meinem** Stand
gemessen, mit eigenen Skripten, gegen ein aus `e4ac3a7` frisch gebautes Vergleichsbündel —
nicht aus Plan, Vermessung oder den Commit-Rümpfen der vier Einheiten übernommen. Wo eine
Zahl der Vorlage widerspricht, steht beides.

### Der Tastaturlauf — die Hauptabnahme, vorher und nachher mit demselben Skript

24 Ansichten + 3 Aufklapp-Formulare + 6 Modale, gefüllte Kampagne, 1600×1000, **echte
Tabulatorsprünge**, vier Themes. Links das Bündel aus `e4ac3a7`, rechts der Wellenstand.

| Theme | Halte | sichtbar | Phantom | mit Ring | **ohne Ring** | Ring <3:1 | schlechtestes Verhältnis |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dark | 1727 → 1359 | 1298 → 1301 | 428 → **57** | 1104 → 1301 | **194 → 0** | 0 → 0 | 7,29 → 7,29 |
| light | 1635 → 1239 | 1180 → 1180 | 454 → **58** | 1060 → 1180 | **120 → 0** | **333 → 0** | **2,64 → 3,86** |
| sepia | 1597 → 1239 | 1155 → 1180 | 441 → **58** | 1036 → 1180 | **119 → 0** | 0 → 0 | **5,09 → 3,44** |
| contrast | 1622 → 1233 | 1180 → 1175 | 441 → **57** | 1061 → 1175 | **119 → 0** | 0 → 0 | 11,34 → 11,34 |

**552 sichtbare Tastaturhalte ohne jedes Fokuskennzeichen sind 0 geworden**, über vier
Themes summiert. Jeder einzelne sichtbare Halt trägt danach einen Ring, und jeder dieser
Ringe hält 3:1 gegen die Fläche, die er wirklich berührt — die Trägerfläche wird dabei
geschichtet gerechnet (alle Füllungen vom Elternknoten bis zur Wurzel, mit Alpha), weil
`outline-offset: 2px` den Ring **außerhalb** des Elements legt.

**Der Ring ist danach EINE Farbe und EIN Maß je Theme** — über alle 1175 bis 1301
sichtbaren Halte hinweg, ohne eine einzige Abweichung:

| Theme | Ringfarbe vorher | nachher | Maß (vorher wie nachher) |
| --- | --- | --- | --- |
| dark | `rgb(212, 175, 55)` | unverändert | 2px solid, Abstand 2px |
| light | `rgb(184, 134, 11)` | **`rgb(148, 108, 9)`** | 2px solid, Abstand 2px |
| sepia | `rgb(139, 69, 19)` | **`rgb(181, 88, 25)`** | 2px solid, Abstand 2px |
| contrast | `rgb(255, 215, 0)` | unverändert | 2px solid, Abstand 2px |

**Sepia hat etwas abgegeben, und das gehört benannt.** Sein schlechtestes Verhältnis fällt
von 5,09 auf 3,44. Das ist kein Mangel, sondern der Preis der Entscheidung W6-E-2: der
alte Sattelbraun-Ring hielt mühelos auf den hellen Sepia-Flächen und fiel auf der dunklen,
themenblinden Modalfläche auf 2,37. Der neue hält auf **beiden** — mit 15 % Puffer über der
Schwelle statt mit 70 % auf der einen und einem Durchfall auf der anderen. Die Bildpaare
`j-modalfeld-sepia-vorher/-nachher` zeigen genau das.

**Die 333 Unterschreitungen in Light** verteilten sich im Vorzustand auf zwei Flächen:
`#b8860b` auf `#f5f5f5` (2,98) und auf `#f3e4e4` (2,64). Beide sind weg.

#### Die Phantom-Halte — und eine Zahl, die anders ausfällt als im Plan

| | dark | light | sepia | contrast |
| --- | --- | --- | --- | --- |
| `#floating-toolbar` (unsichtbare Editorleiste) | 372 → **0** | 396 → **0** | 384 → **0** | 384 → **0** |
| `#shortcuts-overlay` | 31 → 32 | 33 → 33 | 32 → 33 | 32 → 32 |
| `.search-clear-btn` | 18 → 18 | 18 → 18 | 18 → 18 | 18 → 18 |
| `.dmscreen-widget-hide` | 7 → 7 | 7 → 7 | 7 → 7 | 7 → 7 |
| **Summe** | **428 → 57** | **454 → 58** | **441 → 58** | **441 → 57** |

Der Plan führt „363 Phantom-Halte, davon 264 durch W6-E-4". **Beide Zahlen treffen meinen
Messbereich nicht**, und der Unterschied ist kein Widerspruch, sondern ein anderer
Ausschnitt: die Zahl des Plans stammt aus einem Lauf über die 24 Ansichten allein, meiner
nimmt die drei Aufklapp-Formulare und die sechs Modale dazu — und genau dort steht die
Editorleiste mehrfach im Weg. Gemessen fallen **371 bis 396 Phantom-Halte je Theme** weg,
nicht 264. Die drei verbleibenden Gruppen sind **nicht** von dieser Welle und stehen als
benannte Restschuld unten.

#### Bei 375 px, mit Berührungsgerät

| Theme | Halte | sichtbar | Phantom | mit Ring | ohne Ring | Ring <3:1 | min | Seitenüberhang |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dark | 1681 | 1626 | 55 | 1626 | **0** | **0** | 7,29 | **0** |
| light | 1598 | 1542 | 56 | 1542 | **0** | **0** | 3,86 | **0** |
| sepia | 1598 | 1542 | 56 | 1542 | **0** | **0** | 3,44 | **0** |
| contrast | 1598 | 1542 | 56 | 1542 | **0** | **0** | 11,34 | **0** |

Dieselben Minima wie auf dem Schreibtisch, kein seitlicher Überhang, 1,4-mal so viele
sichtbare Halte (die Telefonbreite klappt Leisten auf, die auf 1600 px nebeneinander
liegen).

### Die Weltregel: genau eine, in `core.css`, und in `dmscreen.css` steht nichts mehr

`DUBLETTEN_MAX = 0` fängt eine **Dublette** sofort — einen **vergessenen Rest** fängt es
nicht. Darum einzeln nachgesehen:

- `grep -rn ":focus-visible" assets/styles/*.css` findet im ganzen Baum **acht**
  Regelköpfe: die unbedingte Weltregel und `.btn:focus-visible` in `core.css`, vier
  Leistenregeln in `editors.css`, eine in `tools.css`, und
  `.backup-entry-header:hover:not(:focus-visible)` in `file-backup.css`. **Genau eine ist
  unbedingt, und sie steht in `core.css`.**
- In `dmscreen.css` ist von der Regel **nichts** übrig: die Datei enthält genau EIN
  Vorkommen der Zeichenfolge `focus-visible`, und das ist der Hinweiskommentar an der
  alten Stelle („stand hier und ist nach core.css umgezogen … NICHT zurückholen und NICHT
  danebenstellen"). Kein verwaistes `outline`, keine leere Regelhülle, keine zweite
  Deklaration.
- `outline`-Deklarationen im ganzen Stilbaum: **11**, davon **genau eine**
  `outline: none` — `file-backup.css`, und die ist kein Fokusunterdrücker (Begründung im
  Rumpf von `a2b6784`). Vorzustand: 31.

### Die zwei Zähler, mit echten Daten und ohne `renderAll()`

Fünf Zauber und drei Aufträge angelegt, danach **ausschließlich** `renderSpells()` bzw.
`renderQuests()` gerufen — der Pfad, den jede CRUD dieser beiden Ansichten geht:

| Handgriff | Element | vorher (`e4ac3a7`) | nachher |
| --- | --- | --- | --- |
| 5 Zauber, nur `renderSpells()` | `#spells-count` | `0` | **`5`** |
| auf 2 gekürzt, nur `renderSpells()` | `#spells-count` | `0` | **`2`** |
| geleert, nur `renderSpells()` | `#spells-count` | `0` | **`0`** |
| 3 Aufträge, nur `renderQuests()` | `#quests-count` | `0` | **`3`** |
| auf 1 gekürzt, nur `renderQuests()` | `#quests-count` | `0` | **`1`** |
| geleert, nur `renderQuests()` | `#quests-count` | `0` | **`0`** |

Die Filterrückmeldung behält ihre eigene Aussage, über den **echten Bedienweg** geprüft
(Stufenmarke anklicken, nicht ein Element setzen, das es nicht gibt — siehe Messfalle
unten): ohne Filter `📖 5`, mit Stufenmarke 1 `📖 2/5`, mit Suchtext „Licht" `📖 1/5`,
nach dem Zurücknehmen wieder `📖 5`. Sie heißt `#spells-filter-count`, trägt die Klasse
`.filter-count` und **keinen** Inline-Stil; die alte ID `#spell-count` ist im ganzen Baum
nicht mehr vorhanden. Ihre rechte Kante steht in allen vier Themes **10 px** vom inneren
Rand des Filterstreifens — `white-space: nowrap` und `margin-left: auto` sind mit in die
Klasse gegangen.

**Eine Messfalle, die ich selbst gestellt habe und die hierher gehört:** mein erster
Abnahmelauf setzte `select#spell-level-filter` — ein Element, das es **nicht gibt**. Der
Stufenfilter ist eine Markenleiste (`#spell-level-filters` mit `.filter-chip` und
`data-action`). Ein Zugriff auf ein nicht vorhandenes Element wirft nicht, er tut nichts:
der Zähler las weiter `📖 5`, und das sah aus wie „die n/N-Form ist weg". Wer die
Filterrückmeldung nachmisst, klickt die Marke an.

### Der Stil-Sollstand, schlüsselweise

Mit dem Vergleichswerkzeug des Projekts (`tools/vergleich-stil-sollstand.js`), auf den
**Digestwerten** gerechnet, gegen `e4ac3a7`, mit dem lokalen Vollabzug dieses Laufs:

| Durchgang | vorher | nachher | geändert | Zugänge | Abgänge |
| --- | --- | --- | --- | --- | --- |
| standard | 1234 | 1235 | 32 | 1 | 0 |
| narrow | 1144 | 1145 | 32 | 1 | 0 |
| reducedMotion | 1234 | 1235 | 32 | 1 | 0 |
| **Summe** | **3612** | **3615** | **96** | **3** | **0** |

**`outline` steht nicht unter den zwölf gehashten Eigenschaften** — am Werkzeug
abgefragt, nicht abgeschrieben: color, backgroundColor, borderColor, borderRadius,
padding, margin, fontSize, fontWeight, boxShadow, opacity, display, textAlign. Eine
Bewegung hier kann also nur von `borderColor` kommen, und genau das ist der Befund:
**96 von 96 bewegten Digests sind allein durch `borderColor` erklärt, 0 unerklärt**, alle
mit demselben Übergang `rgb(58, 58, 58)` → `rgb(124, 124, 124)` (= `--border` →
`--border-input` im Dark-Block, in dem der Sollstand erhoben wird), verteilt auf zehn
Signaturen:

```
45x input.toolbar-search      15x select.toolbar-select     12x select.form-select
 6x input.form-input           3x input.dice-formula         3x input.dice-multi
 3x input.dms-dice-input       3x input.fr-ruf-grund-input   3x input.fr-ruf-set-input
 3x textarea.dms-notes-input
```

**Die drei Zugänge sind EIN Element, und das ist ein Nebenbefund mit Wert:**
`spells/div.filter-count#0`, einmal je Durchgang. Der Erheber nimmt nur Elemente auf, die
**mindestens eine Klasse** tragen (`computed-style-diff.spec.js`, die Filterzeile im
Sammler). Die Filterrückmeldung hatte vorher nur eine ID und vier Inline-Deklarationen —
sie war für den einzigen Wächter, der unbeabsichtigte Bildänderungen fängt, **unsichtbar**.
Mit der Klasse aus Schritt 7 steht sie zum ersten Mal unter seiner Aufsicht. 0 Abgänge:
nichts ist aus dem Sollstand gefallen.

Die Neuerhebung ist inhaltlich **byteidentisch** (`UPDATE_STYLE_BASELINE=1`, danach
`git diff --stat` leer). Der Arbeitsbaum zeigt danach CRLF → LF, weil der Erheber mit LF
schreibt und der Baum CRLF führt; git normalisiert das weg, der Inhalt ist zeichengleich
(mit `tr -d '\r'` gegengeprüft). Die Datei ist zurückgesetzt.

### Linux-Nachstellung (die CI läuft auf ubuntu-latest)

Rezept wörtlich aus der CI-Reproduktion übernommen: `--font-ui` `'Segoe UI'` → Verdana,
`--font-mono` Consolas → Courier New. **Beleg, dass die Umstellung ankommt:** die
Probezeichenkette „+ Neuer Charakter" misst 114,75 px gegen **132,59 px** — Faktor 1,155,
das Linux-Vorbild liegt bei ~1,145.

Der **vollständige Tastaturlauf** unter dieser Schrift, vier Themes:

| Theme | Halte | sichtbar | Phantom | mit Ring | ohne Ring | Ring <3:1 | min |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dark | 1337 | 1280 | 56 | 1280 | **0** | **0** | **7,29** |
| light | 1239 | 1180 | 58 | 1180 | **0** | **0** | **3,86** |
| sepia | 1214 | 1156 | 57 | 1156 | **0** | **0** | **3,44** |
| contrast | 1239 | 1180 | 58 | 1180 | **0** | **0** | **11,34** |

Die vier Minima sind **auf die dritte Stelle dieselben** wie unter Windows. Das ist keine
Überraschung, sondern der Beleg einer Behauptung: Ring und Rahmen sind metrikfrei, eine
breitere Schrift kann sie nicht bewegen. Gemessen statt behauptet.

Metrikabhängig ist an dieser Welle genau **eine** Stelle: die umbenannte
Filterrückmeldung mit `white-space: nowrap` und `margin-left: auto` in einem
Flex-Streifen. Unter der breiten Schrift, in allen vier Themes, bei 1600 px **und** bei
375 px: Zähler innerhalb der Leiste, 10 px vom rechten Innenrand, Überhang der Leiste 0,
Überhang der Ansicht 0, Überhang der Seite 0 — identisch zum Windows-Lauf.

### Die Bilder

**376 Dateien** in `tests/e2e/__screens__/welle-6/`, 94 je Theme: 24 Ruhebilder, 24
Fokusbilder mit einem **wirklich ertabulierten** Feld, 24 Naheinstellungen und 13
Zustandsbilder. Dazu **26 Bilder und ein Kontaktbogen** mit **13 Vorher/Nachher-Paaren**
in `tests/e2e/__screens__/welle-6/vorher-nachher/` (`kontaktbogen-welle-6.png`, daneben
die HTML-Fassung). Beide Spalten des Bogens stammen aus demselben Skript, demselben Seed
und demselben Bündelverfahren; links `e4ac3a7`, rechts der Wellenstand. Die Werte unter
jeder Beschriftung sind gemessen.

Neu erzeugen:

```bash
WELLE6_SCREENS=1 npx playwright test tests/e2e/features/welle-6-screens.spec.js
```

Der Kontaktbogen entsteht aus einem Handskript (Muster der Wellen 4 und 5) und braucht ein
aus `e4ac3a7` gebautes Vergleichsbündel; er ist kein Teil der Suite.

### Alle Tore, von mir unabhängig nachgefahren

| | Basis (`e4ac3a7`) | jetzt (`931b0cd`) | Differenz |
| --- | --- | --- | --- |
| Jest | 2.110 in 78 Suiten | **2.137 in 78 Suiten** | +27, **alle** in `design-consistency.test.js` (292 → 319 Fälle); keine andere Unit-Datei ist angefasst |
| Playwright | 604 / 31 / 0 | **634 / 39 / 0** | +34 Ratschen (fokusring 7+4, eingaberahmen 12, zaehler 11) und +4 übersprungene Ablichtung |
| pytest | 30 | **30** | — |
| Lint | exit 0, 363 Warnungen | **exit 0, 363 Warnungen** | Pin gehalten |
| typecheck / strict | grün | **grün** | — |
| Builds dev / prod | exit 0 | **exit 0** | — |
| Anker-Wächter | OK, 123 Anker | **OK, 0 Abweichungen bei 123 Ankern** | — |
| Editorleisten-Wächter | 22/22 | **22/22** | — |
| F-18-Kaskade | 117/117 | **117/117** | — |
| CLAUDE.md | — | **unverändert** | `git diff e4ac3a7..HEAD -- CLAUDE.md` leer |

**Ratschen:** DUBLETTEN **0** (= Decke) · `!important` **104** (= Decke) · Inline-Stile
**251** (von 252 **gesunken**, Nebenergebnis der Umbenennung in Schritt 7) ·
`transition: all` **0** · `outline: none` **1** Deklaration (von 31). Keine ist gestiegen.

**Die zwei bekannten Suiten-Wackler** (Toast-Rennen in `locations.spec.js` /
`encounters.spec.js`, 08-02-Seed nie nachgezogen) sind in **beiden** vollen Läufen dieser
Abnahme **nicht** aufgetreten. Sie bleiben als vorbestehend geführt und sind nicht geheilt
worden.

### Was die vier Einheiten W6-A bis W6-D inhaltlich korrigiert haben

Die Akte führte das bis hierher nur für W6-D; der Rest stand in den Commit-Rümpfen. Das
ist Schritt 8, also hier:

**Vier tote Anker im Handoff.** `party.css:1485` ist in Wahrheit 1371 — und 1485 trägt
heute eine **andere** Eingaberegel, der falsche Anker führt also an die falsche Stelle,
nicht ins Leere. `core.css:1965` ist 2172. Diese Welle musste in zwei Einheiten **178
Zeilenanker** nachziehen; die Stellenlisten sind darum am Baum erzeugt und führen
Selektortexte statt Zeilennummern.

**Die Teilaufgabe „border-radius aus der globalen `:focus-visible`-Regel streichen" hat
keinen Gegenstand.** Die Regel enthielt an ihrem alten Ort genau zwei Deklarationen —
dieselben zwei wie jetzt. Der Anspruch stammt aus einem v2-Patch, der nie eingebaut wurde,
und der genannte Formsprung an `.nav-tab` von 12 auf 4 Bildpunkte aus demselben. Das steht
jetzt im Kommentar an der Regel, damit niemand ein drittes Mal danach sucht.

**`--border-input` existierte seit Welle 1** in allen vier Theme-Blöcken — und wurde von
**keiner einzigen Regel gelesen**. Punkt 3 war reine Anwendung. Der Dark-Wert ist
`#7c7c7c`, nicht das `#6b6b6b` des Handoffs; Welle 1 hat ihn mit Begründung korrigiert.

**`:focus:not(:focus-visible)` wurde NICHT umgesetzt** (W6-E-1 = A, Orchestrator-Grund
O-3). Chromium setzt `:focus-visible` bei Textfeldern und `select` **auch beim Mausklick**
— an `#spell-search` und `#spell-class-filter` nachgewiesen und in dieser Abnahme erneut
bestätigt (Paar `b` des Kontaktbogens: `:focus-visible=true` nach einem echten Klick,
voller Ring). Alle 31 Unterdrücker saßen auf genau solchen Eingaben. Das Rezept hätte sein
Ziel an keiner seiner Stellen erreichen können und dabei an 29 Regeln das damals
**einzige** Kennzeichen entfernt.

**„2 von 31 ohne Kennzeichen" waren SECHS, „7 Elemente" waren ACHT.** Der Plan zählte den
ruhenden `border: 1px solid var(--border)` einer Grundregel als Kennzeichen mit; ein
Ruhezustand ist keins. Und `.cf-combat-value` trägt sechs Felder, nicht fünf —
`char-proficiency` ist `readonly` und darum leicht zu übersehen, tabulierbar ist es
trotzdem.

**Schritt 5 brauchte keine eigene Änderung, und das ist ein Befund.** Der Handoff wollte
den vier blinden Selektoren ein `box-shadow: var(--ring-gold)` geben; gerechnet liest das
auf ihrer Trägerfläche 1,27 / 1,16 / 1,24 / 14,97, der Ring aus Schritt 3 dort
8,28 / 4,76 / 4,45 / 13,46. Sobald `outline: none` fiel, trug die Weltregel sie mit.

**Die 31. Deklaration bleibt, verengt.** `file-backup.css {.backup-entry-header:hover}` ist
kein Fokusunterdrücker — das Element ist ein `div` ohne `tabindex` und ohne `data-action`,
also kein Tastaturhalt; die Zeile nimmt einen **Hover**-Umriss zurück. Löschen hätte keinen
Fokusring freigelegt, sondern einen goldenen Hover-Ring erzeugt. Der Selektor ist auf
`:hover:not(:focus-visible)` verengt: heute verhaltensneutral, aber die Regel sagt jetzt,
was sie meint.

**Das zentrale technische Problem der Welle ist aufgelöst, nicht umgangen.** Der
aufgehellte Ruherahmen ließ den Fokus-**Rahmenwechsel** einbrechen (dark 5,41 → 1,98),
auf dem 223 von 297 Feldern als zweites Kennzeichen standen. Alle drei Wege der
Aufgabenstellung sind durchgerechnet; gewählt ist der erste **mit dem bestehenden Token
`--focus-ring`**, weil WCAG 1.4.11 die Schwelle an den **Raum** legt und nicht an die
**Zeit**: die Norm vergleicht benachbarte Farben, nicht einen Zustand mit seinem eigenen
Vorzustand. Dabei stellte sich heraus, dass der Fokusrahmen seine 3:1 vorher in zwei von
vier Themes **nicht** hielt (`--gold` in light 2,98, `--cyan` in sepia 2,93). Nebenbei ist
ein Mangel weg, den niemand benannt hatte: in light und sepia zeigte jedes fokussierte
Feld **zwei verschiedene Goldtöne, 2 px voneinander entfernt** — 0 von 219 gleich, jetzt
146 von 146.

**Die Elementregel nahm die Schieberegler mit.** `input[type="range"]` fehlte in der
Aufzählung der ausgenommenen Nicht-Vertragstypen — der einzige, der auf dem Schirm steht.
Der Budgetregler des Begegnungsrechners verlor ein Viertel seiner Höhe (8 → 6), die
Lautstärkeschiene jeder Soundboard-Spur die **Hälfte** (4 → 2). Eine Zeile Ausnahme neben
der Elementregel, nicht zwei an zwei Reglern — damit ist ein künftiger dritter Regler von
selbst gedeckt.

### Sichtungsliste — zehn Punkte, in der Reihenfolge der Themes

Die Bilder liegen unter `tests/e2e/__screens__/welle-6/`; der Kontaktbogen ist der
schnellste Weg, die Welle in einem Blick zu beurteilen.

1. **Der Ring im hellen Theme nach der Farbänderung.** `#946c09` statt `#b8860b` — ein
   gedecktes Gold, Farbwinkel 42,73 gegen 42,66 Grad, Sättigung 0,939 gegen 0,940. Zahlen
   sagen „dasselbe Gold, nur dunkler". **Liest es sich auch so?**
   → `a-suchfeld-tabulator-light-vorher/-nachher`, `<ansicht>-fokus-nah-light.png`
2. **Die 26 Felder, die den Ring neu bekommen.** Das sind die Eingaben, auf denen die 31
   Unterdrücker saßen: alle Suchfelder, die Filterwähler, die Initiativ-Eingaben, der
   Würfelausdruck, das Notizfeld des DM-Schirms, die Bestiariums- und Kalenderfilter.
   **Stört der Ring an einem Suchfeld?** (Frage 1 des Plans.)
   → `suchfeld-fokus-*.png`, `b-suchfeld-maus-light-*`
3. **Der Rahmenwechsel an den 29 Regeln — ist er noch da?** Gemessen: ja, alle 25
   `border-color`-Zeilen stehen (21× Gold, 4× Cyan), nur lesen sie jetzt `--focus-ring`
   statt `--gold`/`--cyan`. **Wirken Rahmen UND Ring zusammen als zu viel?** (Frage 2.)
   → `d-formularfeld-fokus-light-*`, `formular-fokus-party-*.png`
4. **Die ~300 aufgehellten Ruherahmen.** `#cccccc` → `#767676` in Light, `#3a3a3a` →
   `#7c7c7c` in Dark. **Wirken die Formulare noch ruhig, oder jetzt wie ein Gitter?**
   (Frage 3.)
   → `e-formularfeld-ruhe-light-*`, `f-formularfeld-ruhe-dark-*`, `formular-ruhe-party-*.png`
5. **Sepia im Modal.** Hier geht der Ring **herauf**, und das ist die Stelle, die die
   ganze Token-Entscheidung ausgelöst hat: vorher 2,37 auf der dunklen Modalfläche.
   → `j-modalfeld-sepia-vorher/-nachher`, `modal-zauber-fokus-sepia.png`
6. **Die zwei Zähler in Zauber und Aufträgen.** Die Pille in der Werkzeugleiste zeigt zum
   ersten Mal eine Zahl (0 → 5 bzw. 0 → 3); die Filterrückmeldung darunter behält ihre
   n/N-Form. **Zwei Zahlen in einer Ansicht — verwirrt das?** (Frage 5.)
   → `g-zaehler-zauber-dark-*`, `h-zaehler-auftraege-dark-*`, `zaehler-*-nah-*.png`
7. **Der Tabulaturlauf durch eine Ansicht: verschwindet der Fokus noch irgendwo?**
   Gemessen nein — 0 ringlose sichtbare Halte in vier Themes und auf zwei Breiten. Der
   Lauf durch die 24 Fokusbilder einer Ansichtsreihe ist die menschliche Gegenprobe.
   → `<ansicht>-fokus-<theme>.png`, 24 je Theme
8. **Die geduldete Ausnahme.** `#char-hp-temp` behält seinen bedeutungstragenden cyanen
   Rahmen und liest in Sepia 2,93 — die **einzige** Zelle unter 3:1, namentlich und mit
   Zahl geführt. **Ist die Bedeutung die 0,07 wert?**
   → `l-hp-temp-sepia-vorher/-nachher`
9. **Contrast als Gegenprobe.** Ringfarbe unverändert `rgb(255,215,0)`, nur der Rahmen
   wird heller. **Sieht man überhaupt, dass sich etwas geändert hat?** Wenn nein, ist das
   das richtige Ergebnis.
   → `k-ring-contrast-vorher/-nachher`
10. **375 px.** Derselbe Ring auf Telefonbreite, 1542 bis 1626 sichtbare Halte je Theme,
    kein Überhang. **Ist der 2-px-Ring mit 2 px Abstand auf dem Telefon zu dick?**
    → `mobil-fokus-*.png`, `mobil-formular-rahmen-*.png`, `m-mobil-fokus-light-*`

### Abnahme nachfahren

```bash
# Die Hauptabnahme: der Fokusring am echten Tabulatorlauf, vier Themes
FOKUSRING=1 npx playwright test tests/e2e/features/fokusring.spec.js

# Der Eingaberahmen und die zwei Zaehler am Element
npx playwright test tests/e2e/features/eingaberahmen.spec.js tests/e2e/features/zaehler.spec.js

# Die elf Ratschen der Welle im Quelltext
npx jest tests/unit/design-consistency.test.js -t "W6-R"

# Die Weltregel: genau eine unbedingte, und sie steht in core.css
grep -rn ":focus-visible" assets/styles/*.css | grep "{"
grep -c "focus-visible" assets/styles/dmscreen.css      # 1 = nur der Hinweiskommentar
grep -rn "outline\s*:\s*none" assets/styles/*.css       # 1 Deklaration, file-backup.css

# Der Sollstand schluesselweise gegen den Vorzustand der Welle
node tools/vergleich-stil-sollstand.js --alt e4ac3a7 \
     --vollabzug tests/e2e/test-results/computed-style-snapshot.json

# Der Sollstand: eine Neuerhebung muss inhaltlich byteidentisch sein
UPDATE_STYLE_BASELINE=1 npx playwright test tests/e2e/features/computed-style-diff.spec.js
git diff --stat -- tests/e2e/baselines/computed-style-baseline.json   # muss leer sein

# Die Bilderserie und die Fokusbilder
WELLE6_SCREENS=1 npx playwright test tests/e2e/features/welle-6-screens.spec.js

# Die drei Waechter
node tools/sync-aktenlage-anker.js --check
node tools/sync-editor-toolbars.js --check
node tools/check-f18-kaskade.js
```

---

# NACH DEM HANDOFF — was offen bleibt

Mit Welle 6 ist der **Design-Handoff v3 abgearbeitet**. Das Design-System ist damit nicht
fertig. Dies ist die Übergabe, geordnet nach Größe. Die Zahlen sind die der jeweiligen
Wellenberichte bzw. der Vermessung dieser Welle; wo ich sie in dieser Abnahme nachgemessen
habe, steht meine Zahl.

## 1 · Der Tastatur-Strang — der größte Posten, und er war nie Teil einer Designwelle

§8 Punkt 5, Arbeitsregel 10, Welle 6 Punkt 6. Welle 6 hat davon **genau einen** Teil
erledigt (die Phantom-Halte, W6-E-4 = B). Offen bleibt:

- **84 sichtbare, bedienbare Elemente ohne Tastaturzugang.** Bestiarium-Liste 17,
  Zauberfilter 26, Beutefilter 10, Armaturenbrett-Sprungfelder 10, Charakterbogen 7
  (inkl. Lebenspunkte-Rechner und Zauberplatz-Punkte), NSC/Orte/Läden/Begegnungen 10,
  Kampagnenwechsel 1, Initiative-Wertbearbeitung 1. Keines hat `tabindex`, keines `role`.
  **Ein `tabindex` allein genügt nicht:** die Ereignisverteilung hört nur auf `click`,
  `change` und `input` — es gibt keinen `keydown`-Zweig. Im ganzen Quellbaum existieren
  genau **zwei** `tabindex` (im Umzugsassistenten, mit eigenem `keydown`-Handler — das
  Vorbild).
- **Die drei verbliebenen Phantom-Halte-Gruppen**, von mir in dieser Abnahme nachgemessen:
  `#shortcuts-overlay` 32–33, `.search-clear-btn` 18, `.dmscreen-widget-hide` 7 — zusammen
  **57 bis 58 je Theme**, auf 375 px 55 bis 56. Sie sind **nicht** von dieser Welle und
  haben je einen eigenen Grund (ein durchsichtiges Overlay, ein Löschknopf in einem leeren
  Suchfeld, ein Widget-Knopf unter einer Einblendung).
- **35 Modale ohne `role="dialog"` und ohne Fokusfalle.** Im Lebenspunkte-Rechner
  verlassen 15 von 25 Tabulaturschritten das Modal.
- **38 versteckte Marken-Kästchen** (`display: none`) und **188 Marken ohne Bindung** von
  413 (206 sind implizit gebunden und sollten nicht angefasst werden). `.sr-only` ist
  bereits definiert und 23× in Gebrauch.

## 2 · Die §7-Ausnahmen

Acht geführte Ausnahmen, aber nur **zwei** tragen den von Arbeitsregel 9 geforderten
Kommentar an der Deklaration. Der Welle-3-Bericht hält das für die Schattenfamilie
ausdrücklich fest (keine der 14 R-19-Ausnahmen ist kommentiert). Entweder ein eigener
Durchgang oder die Regel für diese Familien ausdrücklich aufheben — der heutige Zustand
ist eine Regel, die nicht gilt.

## 3 · Die Restschulden der sechs Wellen, wie ihre Berichte sie führen

- **Welle 1** — fünf JS-Stellen mit der D-7-Fehlerart (Quests, Zauber) nicht erfasst; der
  Ereignis-Log unten ist in Light und Sepia kaum lesbar (fest verdrahtete dunkle Fläche in
  `party.css`, älter als Welle 1).
- **Welle 2** — `.backup-entry-restore:hover` bleibt unter 4,5 (3,15–3,74) gegen
  `--bg-hover`; die umgekehrte Zustandsleiter bei `.pwa-install-btn` (W2-D-05).
- **Welle 3** — `.fdp-die.d20` steht mit 4,48 nur 0,02 unter der Schwelle; der
  Offline-Hinweis hat eine Klasse `show`, die keine Regel trifft. Der dritte Punkt
  (`--gold` hält in Light volldeckend nur 2,40 gegen die schlechteste neutrale Fläche)
  ist **mit dieser Welle erledigt**, soweit er den Fokusring betrifft: dafür gibt es jetzt
  ein eigenes Token. Für `--gold` selbst in seinen übrigen Verwendungen gilt er weiter.
- **Welle 4** — fünf Bewegungsstellen außerhalb CSS (vier `style.transition` im JS, ein
  Inline-Stil im Template); zwei Stellen springen künftig in der Randbreite statt zu
  wachsen.
- **Welle 5** — zehn kaputte `woff2` und der `file://`-Pfad der gebündelten Schriften; die
  Schrift-**Familie** der Bedienelemente (Schritt 8 setzte nur `font-size`, Knöpfe und
  Felder benutzen weiter die Systemschrift); die fehlende Sprosse zwischen 34 und 72 px;
  die Layoutregel der Tastenhilfen als Voraussetzung, die 8 px auf 11 zu heben; die
  Histogramm-Beschriftungen, die durch viewBox-Skalierung auf 4,76–5,44 px landen.
- **Welle 6** — die drei Phantom-Halte-Gruppen und der Tastatur-Strang (oben); die eine
  geduldete Kontrastzelle `#char-hp-temp` in Sepia mit 2,93; und die Decke von **3,50**,
  gegen die der Ring in Light und Sepia läuft: solange er **ein** Wert je Theme ist, lässt
  sich der Puffer über 3:1 nicht über 17 Prozent heben. Ein zweiter Wert für Modalflächen
  wäre der Weg, falls das je nötig wird.

## 4 · Was die Aktenlage sonst führt

- **`.filter-bar` `gap: 6px`** gegen den §3.7-Vertrag `var(--space-sm)` = 8 px —
  **erledigt** in Schritt 7 dieser Welle (Fall 5 von W6-R-09).
- **GATE-04** (CLAUDE.md): `tools/sync-editor-toolbars.js --check` existiert als Fähigkeit,
  aber **keine Testdatei, kein npm-Skript und kein CI-Schritt fahren ihn**. 22/22 sind
  synchron — nichts hält sie so. Offene Restschuld aus v1.3.
- **149 Hex-Farbliterale außerhalb CSS**, von keinem Requirement gedeckt. Achtung bei der
  Nachmessung: die naive Regex trifft HTML-Entities wie `&#246;` mit.
- **`npx prettier --check` ist projektweit rot, an jedem Stand.** Formatierung ist von
  keinem Tor gedeckt, und `npm run format` bleibt gesperrt (es schreibt 135+ Dateien
  einschließlich CLAUDE.md). Einzeldateien per `npx prettier --write <datei>` sind der Weg;
  so sind die vier neuen Testdateien dieser Welle entstanden.
- **Nichts ist gepusht.** Die Wellen 1 bis 6 liegen als lokale Commits auf
  `design-welle-4`.
