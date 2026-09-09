# Patches — Welle 4 bis 6

> **Korrekturvermerk (2026-09-09):** Die Kennzahlen dieser Datei wurden gegen
> `.planning/HANDOFF-V2-VERIFIKATION.md` (Tabelle „Korrigierte Ausgangswerte") nachgemessen. Wo
> dieses Dokument der Verifikation widerspricht, gilt die Verifikation. Der ursprüngliche
> Bericht-Wert bleibt an jeder korrigierten Stelle als Vergleichswert sichtbar, nichts wurde
> spurlos ersetzt. Zusätzlich sind die in `.planning/HANDOFF-V2-VERIFIKATION.md` Zeile 318 namentlich
> genannten defekten Anker (§1b, §3b) in `.planning/phases/15-befundlage-vorlauf/15-03-SUMMARY.md`
> als Tripel repariert (Task 2 dieses Plans).

Einsetzbare Blöcke. **Such-Anker statt Zeilennummer**: der zitierte Text ist im
Repo eindeutig. Alle Farbwerte sind berechnet, nicht geschätzt — der Zielwert
ist 4,5:1 gegen `--bg-card` des jeweiligen Themes, Hue und Sättigung bleiben,
nur die Helligkeit sinkt.

---

## §1 · N-02a — Schriftfarbe auf gefüllten Knöpfen

**Warum zwei Tokens und nicht `--on-accent`:** im Sepia-Theme ist `--gold`
dunkelbraun (`#8b4513`, braucht helle Schrift), `--green` aber olivhell
(`#859900`, braucht dunkle Schrift). Ein gemeinsames Token kann beides nicht.

### 1a — in `assets/styles/variables.css`, in **jeden** der vier Theme-Blöcke

**Anker (Tripel, erhoben 2026-09-09):**
- Datei+Zeile: `assets/styles/variables.css:20/49/75/101` (je eine pro Theme-Block)
- Wörtliches Zitat (Dark, Zeile 20): `            --shadow: rgba(0,0,0,0.5);`
- Grep mit erwarteter Trefferzahl: `grep -n -- "--shadow: rgba" assets/styles/variables.css` → **4**
  Treffer (Zeilen 20, 49, 75, 101 — Dark/Light/Sepia/Contrast in dieser Reihenfolge)

```css
/* Dark  — Anker: --shadow: rgba(0,0,0,0.5); */
    --on-gold: #111111;   /* 8,98:1 auf #d4af37 */
    --on-green: #111111;  /* 10,84:1 auf #4ade80 */

/* Light — Anker: --shadow: rgba(0,0,0,0.15); */
    --on-gold: #111111;   /* 5,80:1 auf #b8860b  (vorher --bg-dark: 2,98) */
    --on-green: #111111;  /* 5,73:1 auf #16a34a  (vorher --bg-dark: 3,02) */

/* Sepia — Anker: --shadow: rgba(0,0,0,0.1); */
    --on-gold: #fdf6e3;   /* 6,58:1 auf #8b4513 */
    --on-green: #111111;  /* 5,89:1 auf #859900  (vorher --bg-dark: 2,55) */

/* Contrast — Anker: --shadow: rgba(255,255,255,0.1); */
    --on-gold: #000000;   /* 14,97:1 auf #ffd700 */
    --on-green: #000000;  /* 15,30:1 auf #00ff00 */
```

### 1b — in `assets/styles/core.css`

**Anker (Tripel, erhoben 2026-09-09 — REPARIERT, vormals defekt):** Der bisher zitierte Einzeiler
`.btn-primary { background: var(--gold);` existiert so NICHT — `.btn-primary` ist ein
**mehrzeiliger Regelblock**, kein einzeiliges Kompaktformat (`.planning/HANDOFF-V2-VERIFIKATION.md`
Zeile 318 nennt diesen Anker namentlich als defekt).
- Datei+Zeile: `assets/styles/core.css:2497-2503`
- Wörtliches Zitat:
  ```css
  .btn-primary {
      background: var(--gold);
      border-color: var(--gold);
      color: var(--bg-dark);
      font-weight: 600;
      white-space: nowrap;
  }
  ```
- Grep mit erwarteter Trefferzahl: `grep -n "^        .btn-primary {$" assets/styles/core.css` → **1**
  Treffer (Zeile 2497); `grep -c "color: var(--bg-dark);" assets/styles/core.css` findet diese
  Zeile unter mehreren `--bg-dark`-Fundstellen wieder (siehe §1c, 100 echte Treffer im ganzen Baum).

`.btn-success` und `.btn-gold` liegen als eigene, ebenfalls mehrzeilige Blöcke unmittelbar danach
(nicht als kompakte Einzeiler wie unten dargestellt — das folgende Codebeispiel zeigt nur den
**Zielzustand** nach dem Patch, nicht den Ist-Zustand):

```css
.btn-primary { background: var(--gold);  border-color: var(--gold);  color: var(--on-gold);  font-weight: 600; white-space: nowrap; }
.btn-success { background: var(--green); border-color: var(--green); color: var(--on-green); font-weight: 600; }
.btn-gold    { background: var(--gold);  border-color: var(--gold);  color: var(--on-gold);  font-weight: 600; }
```

**Gegenprobe im Browser:** Theme auf Light, dann Sepia stellen und den Knopf
„+ Neuer Ort" ansehen — vorher hell auf hell, nachher dunkle Schrift.

### 1c — dieselbe Ursache an fünf [Bericht] weiteren Stellen

`color: var(--bg-dark)` auf gesättigter Fläche steht außerdem in:

```
grep -rn "color: var(--bg-dark)" assets/styles/
```

**Gemessen: 97, nicht 5.** Eigene Messung: 100 echte `color: var(--bg-dark)`-Deklarationen (der
abgedruckte grep liefert 101 Zeilen, davon 1 Fehltreffer auf `background-color`), minus die 3
Buttons aus §1b = 97. Verteilung: gold 45, green 21, cyan 13, yellow 4, orange 4, red 4, purple 1,
pink 1, gold-dim 1, ohne Hintergrund 5.

Jede Fundstelle prüfen: liegt darunter eine `--gold`- oder `--green`-Fläche,
gehört das passende `--on-*`-Token hin. Liegt darunter `--red` oder `--blue`,
ist `--on-accent` (weiß) richtig und bleibt.

---

## §2 · N-02b — Light- und Sepia-Akzente als Textfarbe

**Warum eigene `--*-text`-Tokens und nicht die Palette selbst abdunkeln:** die
Palettenfarbe ist auch die **Fläche** der Knöpfe und Statusleisten. Dunkelt man
sie, verschieben sich die eben in §1 gerechneten Knopf-Kontraste wieder
(nachgerechnet: `#996f09` mit `#111` fällt auf 4,17). Fläche und Schrift sind
zwei Rollen — sie brauchen zwei Tokens.

### 2a — in `variables.css`, Aliasblock (NACH den Theme-Blöcken)

**Anker (Tripel, erhoben 2026-09-09):**
- Datei+Zeile: `assets/styles/variables.css:134`
- Wörtliches Zitat: `            --teal: var(--cyan);`
- Grep mit erwarteter Trefferzahl: `grep -n -- "--teal: var(--cyan);" assets/styles/variables.css`
  → **1** Treffer

```css
            /* N-02: Akzent als TEXTFARBE. In Dark und Contrast identisch zur
               Palette; in Light und Sepia abgedunkelt, bis 4,5:1 gegen
               --bg-card erreicht ist. Die Palettenfarbe selbst bleibt
               unverändert — sie ist auch die Flaeche der Knoepfe. */
            --gold-text: var(--gold);
            --green-text: var(--green);
            --cyan-text: var(--cyan);
            --yellow-text: var(--yellow);
            --orange-text: var(--orange);
            --blue-text: var(--blue);
            --purple-text: var(--purple);
            --pink-text: var(--pink);
```

### 2b — Überschreibungen, direkt danach

```css
        [data-theme="light"] {
            --gold-text: #996f09;    /* 3,25 -> 4,53 */
            --green-text: #12883e;   /* 3,30 -> 4,55 */
            --cyan-text: #07819e;    /* 3,68 -> 4,52 */
            --yellow-text: #9f6d03;  /* 2,94 -> 4,50 */
            --orange-text: #cd4d0b;  /* 3,56 -> 4,50 */
        }
        [data-theme="sepia"] {
            --green-text: #687800;   /* 2,97 -> 4,55 */
            --cyan-text: #217d76;    /* 2,93 -> 4,57 */
            --yellow-text: #8f6c00;  /* 2,98 -> 4,51 */
            --blue-text: #2076b2;    /* 3,41 -> 4,53 */
            --purple-text: #6368c0;  /* 4,06 -> 4,56 */
            --orange-text: #c44815;  /* 4,27 -> 4,54 */
            --pink-text: #cf2d7c;    /* 4,21 -> 4,51 */
            --red-text: #da2825;     /* 4,29 -> 4,52 */
        }
```

> Diese Blöcke müssen **nach** dem Aliasblock stehen, sonst gewinnt die
> Alias-Zuweisung. Der Kommentar im Aliasblock erklärt die Reihenfolge —
> bitte dort ergänzen, dass jetzt ein zweiter Theme-Abschnitt folgt.

### 2c — Umstellung im Komponenten-CSS

Nur `color:`-Deklarationen umstellen, **nicht** `background`, `border-color`
oder `box-shadow`:

```
grep -rn "color: var(--\(gold\|green\|cyan\|yellow\|orange\|blue\|purple\|pink\))" assets/styles/
```

**Achtung — die Trefferliste ist NICHT unmittelbar die Arbeitsliste (gemessen):** dieser grep
liefert 715 Treffer, davon 229 Fehltreffer auf `border-color: var(--…)` — genau die Eigenschaft,
die dieser Abschnitt zwei Zeilen darüber ausdrücklich ausschließt. Echte `color:`-Deklarationen:
482. Vor der Bearbeitung `grep -v "border-color"` vorschalten, sonst gilt implizit „die Trefferliste
ist die Arbeitsliste", was hier gemessen falsch ist.

Bei jeder Fundstelle prüfen, worauf der Text liegt. Auf `--bg-card`,
`--bg-dark` oder `--bg-elevated` → `--*-text`. Auf einer gesättigten Fläche
→ unverändert lassen, das ist §1.

---

## §3 · N-01 — rgba-Literale auf Theme-Tokens

### 3a — Overlay-Tokens in `variables.css`, in jeden Theme-Block

```css
/* Dark und Contrast — Auflagen hellen auf */
    --overlay-weak: rgba(255,255,255,0.05);
    --overlay-mid: rgba(255,255,255,0.10);
    --overlay-strong: rgba(255,255,255,0.20);

/* Light und Sepia — Auflagen dunkeln ab, sonst sind sie unsichtbar */
    --overlay-weak: rgba(0,0,0,0.04);
    --overlay-mid: rgba(0,0,0,0.08);
    --overlay-strong: rgba(0,0,0,0.16);
```

Damit sind die 35 `rgba(255,255,255,…)` erledigt.

**Anker für die schwerwiegendste Stelle (Tripel, erhoben 2026-09-09):**
- Datei+Zeile: `assets/styles/core.css:337-349`
- Wörtliches Zitat (erste Zeile des Blocks): `        .nav-tab {` gefolgt von
  `            background: rgba(255,255,255,0.05);` (Zeile 338)
- Grep mit erwarteter Trefferzahl: `grep -n "background: rgba(255,255,255,0.05);" assets/styles/core.css`
  → **2** Treffer (Zeile 338 `.nav-tab`, Zeile 369 `.nav-group-btn` — beide betroffen, nicht nur
  `.nav-tab`)

```css
/* vorher */  .nav-tab { background: rgba(255,255,255,0.05); …
/* nachher */ .nav-tab { background: var(--overlay-weak); …
```

### 3b — die 138 [Bericht] Farb-Auflagen auf `color-mix`

**Gemessen: 156, nicht 138.** 54 (gold) + 32 (gelb, korrigiert von §N-01) + 40 (rot) + 19 (grün,
`rgba(74,222,128,…)`) + 11 (blau, `rgba(96,165,250,…)`) = 156. Die 138 aus dem Bericht sind
54+44+40 — also dieselbe Tabellenzeile, die den falschen Gelb-Wert (44 statt 32) trägt.

Mechanisches Ersetzen, Deckkraft bleibt gleich:

```
rgba(212,175,55,X)  ->  color-mix(in srgb, var(--gold)   {X*100}%, transparent)
rgba(251,191,36,X)  ->  color-mix(in srgb, var(--yellow) {X*100}%, transparent)
rgba(239,68,68,X)   ->  color-mix(in srgb, var(--red)    {X*100}%, transparent)
rgba(74,222,128,X)  ->  color-mix(in srgb, var(--green)  {X*100}%, transparent)
rgba(96,165,250,X)  ->  color-mix(in srgb, var(--blue)   {X*100}%, transparent)
```

**Anker (Tripel, erhoben 2026-09-09 — REPARIERT, vormals defekt):** Der bisher als `core.css`
zitierte Anker `rgba(212, 175, 55, 0.3)` steht dort NICHT — die Zeile existiert wörtlich
**zweimal in `loot.css`**, nicht in `core.css` (`.planning/HANDOFF-V2-VERIFIKATION.md` Zeile 318
nennt diesen Anker namentlich als defekt).
- Datei+Zeile: `assets/styles/loot.css:439` und `:483`
- Wörtliches Zitat (identisch an beiden Stellen): `            box-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);`
- Grep mit erwarteter Trefferzahl: `grep -n "box-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);" assets/styles/loot.css`
  → **2** Treffer (Zeilen 439, 483) — der Mehrfachtreffer darf nicht als Einzelstelle
  missverstanden werden; beide Vorkommen brauchen dieselbe Ersetzung.

```css
/* vorher */  box-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
/* nachher */ box-shadow: 0 2px 4px color-mix(in srgb, var(--gold) 30%, transparent);
```

`color-mix` ist im Projekt bereits im Einsatz (`--gold-hover`, `--red-dim`,
`--green-dim` in `variables.css`) — keine neue Abhängigkeit.

**Reihenfolge:** 3a zuerst (35 Stellen, mechanisch), dann 3b nach Farbe
gruppiert, dann §4 für die 58 Schatten-rgba. *(Bericht: „danach bleibt kein Zahlentripel mehr übrig"
— gemessen FALSCH: §3a [35] + §3b [156] + §4 [58] = 249 von 390. 141 Fundstellen haben nach diesem
Patch noch KEINE Vorschrift, während `CHECKLISTE.md` §T-2 exakt null verlangt und keine Ausnahme
kennt. Diese 141 sind vorab zu klassifizieren, siehe `.planning/REQUIREMENTS.md` COLOR-08.)*

---

## §4 · N-03 — vier Höhenstufen

### 4a — in `variables.css`, Aliasblock

**Anker (Tripel, erhoben 2026-09-09):**
- Datei+Zeile: `assets/styles/variables.css:316`
- Wörtliches Zitat: `            --gold-hover: color-mix(in srgb, var(--gold) 85%, #fff);`
- Grep mit erwarteter Trefferzahl: `grep -n -- "--gold-hover: color-mix" assets/styles/variables.css`
  → **1** Treffer

```css
            /* N-03: Hoehenstufen. Aus var(--shadow) gebaut, damit die
               Deckkraft dem Theme folgt: im Dark-Theme 0.5, im Sepia 0.1 —
               derselbe Schatten, der auf Schwarz kaum zu sehen ist, wirkt auf
               Pergament wie ein Fleck. */
            --elev-1: 0 2px 6px var(--shadow);
            --elev-2: 0 4px 14px var(--shadow);
            --elev-3: 0 12px 32px var(--shadow);
            --glow-gold: 0 0 0 3px color-mix(in srgb, var(--gold) 35%, transparent);
```

### 4b — Zuordnung der 66 [Bericht] Werte *(gemessen 65 nach Leerraum-Normierung — dice.css:575 und
:598 sind derselbe Wert, einmal umbrochen; 88 Deklarationen insgesamt)*

| bisher | neu |
|---|---|
| `0 1px …` bis `0 2px 8px` | `--elev-1` |
| `0 4px 12px` bis `0 4px 20px` | `--elev-2` |
| `0 8px 24px` und größer | `--elev-3` |
| `0 0 Npx <gold/gelb>` | `--glow-gold` |

**Bleiben unverändert** (begründete Sonderfälle, jeweils mit Kommentar
versehen): die `inset`-Schatten des Statblock-Pergaments, das Würfel-Glühen
bei kritischem Treffer, die Fortschrittsbalken-Innenschatten. *(Korrektur, gemessen: von diesen drei
"dokumentierten Sonderfällen" existieren ZWEI NICHT. Alle 7 `inset`-Schatten sitzen auf
`.read-aloud` [party.css:390-438]; `bestiary.css` hat 0 `box-shadow`; es gibt keinen einzigen
`inset`-Schatten an einem Fortschrittsbalken. Siehe `.planning/REQUIREMENTS.md` ELEV-04 für die
tatsächliche Sonderfall-Liste.)*

---

## §5 · N-04 — Typo-Skala

### 5a — in `variables.css`, Aliasblock

```css
            /* N-04: Typo-Skala. rem gegen die Profil-Basis, damit das
               Mobil-Profil (--font-size-base: 16px) weiter greift. Vorher
               55 verschiedene Groessen, davon 509 Fundstellen in vier
               em-Werten — und em multipliziert sich bei Verschachtelung. */
            --text-xs: 0.786rem;   /* 11px @14 */
            --text-sm: 0.857rem;   /* 12px */
            --text-md: 1rem;       /* 14px — Basis */
            --text-lg: 1.143rem;   /* 16px */
            --text-xl: 1.429rem;   /* 20px */
            --text-2xl: 1.857rem;  /* 26px */
            --text-3xl: 2.429rem;  /* 34px */
```

Voraussetzung: `html { font-size: var(--font-size-base); }` bzw. `body` — die
Profil-Tokens existieren schon, werden aber nur 2× gelesen. *(Korrektur, gemessen: nicht 14px
Desktop/16px Mobil wie im Bericht behauptet — `html` und `body` sind in BEIDEN Layout-Profilen
16px; `--font-size-base: 14px` erreicht die Wurzel nie, siehe N-04-Korrektur oben.)*

**Anker (Tripel, erhoben 2026-09-09):**
- Datei+Zeile: `assets/styles/variables.css:361-364`
- Wörtliches Zitat:
  ```css
  [data-layout="mobile"] body {
      font-size: var(--font-size-base);
      padding-bottom: 70px;
  }
  ```
  Diese Regel setzt `body`-`font-size` NUR im Mobil-Profil explizit (auf `--font-size-base`, dort
  16px); im Desktop-Profil gibt es keine `body{font-size:…}`-Regel — die 16px kommen dort aus dem
  Browser-Standard. Beide Profile landen also bei 16px, aber auf verschiedenen Wegen — das ist die
  gemessene Grundlage der N-04-Korrektur oben, nicht ein Widerspruch dazu.
- Grep mit erwarteter Trefferzahl: `grep -n "data-layout=\"mobile\"\] body {" assets/styles/variables.css`
  → **1** Treffer

### 5b — Zuordnung

| bisher | neu |
|---|---|
| `0.6em · 0.65em · 0.7em · 9px · 10px · 11px` | `--text-xs` |
| `0.75em · 0.78em · 0.8em · 0.82em · 12px · 13px` | `--text-sm` |
| `0.85em · 0.9em · 0.95em · 1em · 14px · 15px` | `--text-md` |
| `1.05em · 1.1em · 1.2em · 16px · 18px` | `--text-lg` |
| `1.25em · 1.3em · 1.4em · 1.5em · 20px · 22px` | `--text-xl` |
| `1.8em · 2em · 24px · 32px` | `--text-2xl` |
| `3em · 3.5em` | `--text-3xl` |

**Achtung — hier verändert sich Optik:** die `em`-Werte waren je Einbautiefe
verschieden groß. Nach der Umstellung sind sie überall gleich. Die vier
sichtbarsten Stellen zum Nachsehen: Karten-Metazeilen (Orte/NPCs), die
Statblock-Tabellen im Bestiar, die DM-Screen-Widgets und die
Initiative-Zeile. Untergrenze: **nichts unter `--text-xs`** in der UI.

---

## §6 · N-06 — drei Dauern, kein `all`

### 6a — in `variables.css`, Aliasblock

```css
            --dur-fast: 120ms;  /* Hover, Farbwechsel */
            --dur: 200ms;       /* Standard */
            --dur-slow: 300ms;  /* Panel, Overlay, Layoutwechsel */
            --ease: cubic-bezier(0.2, 0, 0.2, 1);
```

### 6b — Ersetzung

```css
/* vorher (132×) */  transition: all 0.2s;
/* nachher */        transition: background var(--dur) var(--ease),
                                 border-color var(--dur) var(--ease),
                                 color var(--dur) var(--ease),
                                 transform var(--dur) var(--ease),
                                 box-shadow var(--dur) var(--ease);
```

Das ist lang — deshalb einmal als Utility in `core.css` definieren und die
Komponenten darauf zeigen lassen. `0.15s`/`0.12s`/`0.1s` → `--dur-fast`;
`0.25s`/`0.3s`/`0.5s` → `--dur-slow`.

**Nicht ersetzen:** die `width`-Übergänge der Fortschrittsbalken
(`transition: width 0.3s`) — dort ist die Layout-Animation gewollt.

---

## §7 · N-05 — ein Fokusring

### 7a — in `core.css`, direkt nach dem `.btn:focus-visible`-Block

**Anker (Tripel, erhoben 2026-09-09):**
- Datei+Zeile: `assets/styles/core.css:519`
- Wörtliches Zitat: `        .btn:focus-visible {` (Beginn des Regelblocks)
- Grep mit erwarteter Trefferzahl: `grep -n "\.btn:focus-visible {" assets/styles/core.css` →
  **1** Treffer. *(Hinweis: eine app-weite globale `:focus-visible`-Regel existiert bereits an
  anderer Stelle, `assets/styles/dmscreen.css:1661` — siehe BEFUNDE-v2.md N-05-Korrektur. §7 fügt
  eine ZWEITE, `:where()`-basierte Regel hinzu; ob das neben der bestehenden globalen Regel Sinn
  ergibt, ist bei der Ausführung [Phase 19] zu klären.)*

```css
        /* N-05: EIN Fokusring fuer alles Fokussierbare. :where() hat
           Spezifitaet 0 — jede Komponente kann die Regel ohne !important
           ueberschreiben. Vorher: 37× outline:none gegen 7 :focus-visible;
           Chips, Nav-Reiter und Icon-Knoepfe hatten gar keinen Ring. */
        :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
            outline: 2px solid var(--gold);
            outline-offset: 2px;
            border-radius: var(--radius-sm);
        }
```

### 7b — die 37 `outline: none` entschärfen

**Anker (Tripel, erhoben 2026-09-09):**
- Grep mit erwarteter Trefferzahl: `grep -rn "outline: none" assets/styles/` → **37** Treffer
  (bestätigt, Bericht-Wert und gemessener Wert stimmen überein)

```
grep -rn "outline: none" assets/styles/
```

Jede Fundstelle: liegt sie auf einem `:focus`-Selektor, **bleibt sie** — dort
ersetzt eine Rahmenfarbe den Ring für den Maus-Klick, und `:focus-visible`
greift trotzdem. Liegt sie ohne Pseudoklasse auf dem Element
(`.bst-rich-editor`, `.cp-input`, `#session-tags-input`, `.wp-rich-editor`),
auf `:focus-visible` ändern oder streichen.

Eine Stelle hat **keinen** sichtbaren Ersatz und muss einen bekommen:

**Anker (Tripel, erhoben 2026-09-09):**
- Datei+Zeile: `assets/styles/party.css:1485-1488`
- Wörtliches Zitat:
  ```css
  .cf-combat-value input:focus,
  .cf-combat-value select:focus {
      outline: none;
  }
  ```
- Grep mit erwarteter Trefferzahl:
  `grep -n "cf-combat-value input:focus" assets/styles/party.css` → **1** Treffer (Zeile 1485)

```css
/* party.css, Anker: .cf-combat-value input:focus, .cf-combat-value select:focus */
            outline: none;
            border-color: var(--gold);   /* <- ergaenzen */
```

---

## §8 · N-08 — `prefers-reduced-motion`

**VERWORFEN (B-07, 2026-09-08)** — N-08 ist widerlegt, dieser Patch wurde NICHT ausgeführt.
Begründung:

1. Der globale Block existiert bereits seit Langem in `assets/styles/dmscreen.css`
   (gemessene Spanne 1408-1419), Top-Level, wirkt app-weit — dieser Patch hätte ihn
   dupliziert, nicht neu angelegt.
2. Der Patch hätte eine Dublette erzeugt und damit die Ratsche für Dubletten von
   `DUBLETTEN_MAX = 0` auf 1 gehoben.
3. Der Patch hätte die Zahl der `!important`-Deklarationen von 105 auf 110 gehoben,
   statt auf die angewiesenen 109.
4. Seine Ausnahmeliste trifft nichts: `.dice-crit-glow` existiert nirgends im Repo,
   `.dice-result` ist toter Code.

Ausgeführt wurde stattdessen: vier Entfernungen (`command-palette.css`, `dmscreen.css`,
`migration.css`, `pwa.css`) und eine Neuanlage des einen verbliebenen globalen Blocks in
`core.css`, plus eine Rückbau-Ratsche (`REDUCED_MOTION_BLOCKS_MAX`, Plan 15-01, Task 1).
Siehe `.planning/HANDOFF-V2-VERIFIKATION.md` Blocker B-07.

Am Ende von `core.css`:

```css
        /* N-08: 19 @keyframes und 29 animation-Deklarationen standen
           bisher gegen 4 reduced-motion-Regeln. */
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
            /* Ausnahme: das Wuerfelergebnis IST die Information. Statt der
               Rotation eine kurze Einblendung, damit der Wechsel sichtbar
               bleibt. */
            .dice-result, .dice-crit-glow {
                animation-duration: 150ms !important;
            }
        }
```

Die `!important` hier sind gewollt und schlagen die Ratsche aus F-18 um 4 —
die Obergrenze in `design-consistency.test.js` entsprechend von 105 auf 109
anheben, **mit** Begründung im Kommentar (so wie die 65 `.spell-desc`-Fälle
dort schon begründet sind).
