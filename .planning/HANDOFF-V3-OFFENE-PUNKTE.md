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
