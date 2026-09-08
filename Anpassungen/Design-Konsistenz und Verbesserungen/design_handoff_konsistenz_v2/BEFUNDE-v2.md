# Befunde — Design-Konsistenz-Audit v2

Geprüfte Fassung: `assets/styles/*.css` (21 Dateien, 27.187 Zeilen) und
`assets/templates/*.html` (13 Dateien, 24 Ansichten), Stand 08.09.2026.
Methodik: statische Analyse (Token-Auflösung, Werte- und Selektorhäufigkeiten,
WCAG-Kontrastberechnung aus `variables.css`). Keine Laufzeitmessung.

Schwere: **Hoch** = in mindestens einem Theme sichtbar defekt ·
**Mittel** = systematische Drift · **Niedrig** = Wartbarkeit und Feinschliff.

Alle neun Befunde sind **lautlos**: ein zu heller Akzent, ein fehlender
Fokusring und ein `rgba()` mit festem Zahlentripel erzeugen keine
Fehlermeldung — genau deshalb sind sie durch drei Wellen Aufräumen
hindurchgekommen.

---

# A · Farbe

## N-01 · Hoch — die Palette hat ein zweites Leben in rgba-Notation

Der Hex-Umbau aus Welle 3 (F-04) hat die Literale in `color:` und
`background:` beseitigt. Die Farbkanäle in `rgba()` sind geblieben: dort steht
die **Dark-Theme-Palette weiterhin als Zahlentripel** im Komponenten-CSS, und
kein Theme erreicht sie.

```
390 rgba()-Literale in 173 verschiedenen Werten

  rgba(0,0,0,…)         58×   Schatten (siehe N-03)
  rgba(212,175,55,…)    54×   = --gold   im Dark-Theme
  rgba(251,191,36,…)    44×   = --yellow im Dark-Theme
  rgba(239,68,68,…)     40×   = --red    im Dark-Theme
  rgba(255,255,255,…)   35×   Weiß-Auflagen (.nav-tab u. a.)

  Gegenprobe: --gold-rgb / --green-rgb / --red-rgb sind in ALLEN
  vier Themes definiert — und werden 4× benutzt.
```

**Belegfall 1.** Im Light-Theme ist `--gold` `#b8860b`. Jede goldene
Hinterlegung, die als `rgba(212,175,55,.2)` geschrieben ist, bleibt dort das
dunkle Gold — Rahmen und Fläche desselben aktiven Elements haben zwei
verschiedene Goldtöne.

**Belegfall 2.** `.nav-tab { background: rgba(255,255,255,0.05) }` — im
Sepia- und Light-Theme eine Weiß-Auflage auf Weiß, also wirkungslos. Die
Grundfläche der Navigation fehlt in zwei von vier Themes.

**Fix:** `color-mix(in srgb, var(--gold) 20%, transparent)` statt
`rgba(212,175,55,.2)` — dieselbe Optik, folgt aber dem Theme; `color-mix` ist
im Projekt für die Hover-Stufen (`--gold-hover`, `--red-dim` …) schon in
Gebrauch. Für die Weiß-Auflagen zwei Tokens pro Theme
(`--overlay-weak`, `--overlay-strong`), in den hellen Themes schwarz statt
weiß. → `PATCHES.md` §3

## N-02 · Hoch — die Palette ist für Dark entworfen; Light und Sepia unterschreiten den Kontrast

Alle vier Themes verwenden dieselben semantischen Rollen, aber nur Dark und
Contrast wurden gegen ihren Hintergrund geprüft. Berechnet nach WCAG aus
`variables.css`, Grenze für Text 4,5:1. **Rot = unter 4,5.**

| Rolle auf `--bg-card` | Dark | Light | Sepia | Contrast |
|---|---:|---:|---:|---:|
| `--text` | 13,18 | 17,40 | 10,23 | 18,88 |
| `--text-dim` | 4,91 | 5,74 | 5,32 | 8,13 |
| `--gold` | 8,28 | **3,25** | 6,58 | 13,46 |
| `--green` | 9,99 | **3,30** | **2,97** | 13,76 |
| `--cyan` | 8,85 | **3,68** | **2,93** | 15,06 |
| `--yellow` | 10,43 | **2,94** | **2,98** | 17,58 |
| `--orange` | 7,69 | **3,56** | **4,27** | 7,50 |
| `--blue` | 6,85 | 5,17 | **3,41** | 4,97 |
| `--purple` | 6,40 | 5,70 | **4,06** | 6,02 |
| `--pink` | — | 4,60 | **4,21** | — |
| `.btn-primary` (Schrift auf Gold) | 9,24 | **2,98** | 5,65 | 14,97 |
| `.btn-success` (Schrift auf Grün) | 11,15 | **3,02** | **2,55** | 15,30 |

Die beiden untersten Zeilen sind die schwerwiegendsten: **die Primäraktion und
der Speichern-Knopf sind im Light- und Sepia-Theme grenzwertig lesbar** — und
das sind die Knöpfe, die in jeder Ansicht oben rechts stehen.

Ursache ist die Kombination

```css
.btn-primary { background: var(--gold);  color: var(--bg-dark); }
.btn-success { background: var(--green); color: var(--bg-dark); }
.btn-gold    { background: var(--gold);  color: var(--bg-dark); }
```

In den hellen Themes ist `--bg-dark` **hell** (`#f5f5f5` bzw. `#f4e4c1`), die
Fläche also hell auf hell. Das vorhandene Token `--on-accent` löst genau
dieses Problem und wird 6× benutzt — an den drei gefüllten Button-Varianten
nicht.

**Fix:** zwei Tokens `--on-gold` / `--on-green` pro Theme (Sepia braucht
verschiedene: sein Gold ist dunkelbraun, sein Grün olivhell), und für
Text-Akzente je ein abgedunkeltes `--*-text`-Token in Light und Sepia, damit
die **Fläche** der Knöpfe unverändert bleibt. Berechnete Werte in
`PATCHES.md` §1 und §2.

## N-03 · Hoch — 66 verschiedene Schatten, ein ungenutztes Schatten-Token

```
66 verschiedene box-shadow-Werte
58 davon mit hartem rgba(0,0,0,…)
 1 Verwendung von var(--shadow)   ← das themenfähige Token

  0 4px 12px  rgba(0,0,0,0.3)     7×
  0 4px 16px  rgba(0, 0, 0, 0.4)  4×   ← gleiche Absicht,
  0 4px 16px  rgba(0,0,0,0.3)     2×      drei Schreibweisen
  0 8px 24px  rgba(0,0,0,0.4)     3×
  0 2px 8px   rgba(0,0,0,0.5)     2×
```

Gleichrangige Elemente schweben unterschiedlich hoch. Und weil die Deckkraft
fest verdrahtet ist, wirkt derselbe Schatten im Sepia-Theme auf Pergament wie
ein Fleck, wo im Dark-Theme kaum etwas zu sehen war. `--shadow` ist in allen
vier Themes passend definiert (`rgba(0,0,0,0.5)` bis `rgba(0,0,0,0.1)`) und
wird genau einmal benutzt.

**Fix:** vier Höhenstufen als Tokens — `--elev-1` (Karte, ruhend), `--elev-2`
(Hover, Dropdown), `--elev-3` (Modal), `--glow-gold` (Fokus/Aktiv) — jede aus
`var(--shadow)` gebaut, also pro Theme richtig. Die 66 Werte darauf runden.
Die Innen- und Glüh-Sonderfälle (Statblock-Pergament, Würfel-Kritisch) bleiben
begründet stehen. → `PATCHES.md` §4

---

# B · Typografie und Bewegung

## N-04 · Mittel — 55 Schriftgrößen, zwei Maßsysteme, und `em` multipliziert sich

```
55 verschiedene font-size-Werte

  relativ   0.85em 157×   0.8em 133×   0.9em 127×   0.75em 92×
            0.7em   48×   1.1em  43×   1em    32×   0.65em 16×
            … bis 0.6em, 0.78em, 0.82em, 1.05em, 1.25em
  absolut   14px    81×   12px   55×   13px   46×   11px   30×
            10px    22×   16px   15×   18px   13×   9px     6×

  Es gibt keine Typo-Skala. --font-size-base/-small sind
  Layout-Profil-Tokens (14/12px Desktop, 16/14px Mobil) und
  werden 2× gelesen.
```

Die relativen Werte sind das eigentliche Problem: `em` rechnet gegen den
Elternwert. Eine Meta-Zeile mit `0.85em` in einer Karte, die selbst `0.9em`
trägt, ergibt 0,77em — **dieselbe Klasse ist je Einbautiefe verschieden groß.**
Im Mobil-Profil wächst die Basis auf 16px, wodurch alle Abweichungen
mitskalieren. Ab 0,7em (≈10px) wird es auf dem Telefon unlesbar.

**Fix:** sieben Stufen als Tokens, in `rem` gegen die Profil-Basis definiert,
damit das Mobil-Profil weiter greift. Die vier häufigsten `em`-Werte decken
509 der ~1.000 Fundstellen ab — im Wesentlichen ein Suchen-Ersetzen.
→ `PATCHES.md` §5

## N-06 · Mittel — 132× `transition: all`

```
58 verschiedene transition-Deklarationen, 8 Dauern

  all 0.2s      132×      0.2s   195×
  all 0.15s      19×      0.15s   62×
  transform 0.2s 14×      0.3s    21×
  background 0.2s 13×     0.1s     6×   0.12s 6×
  …                       0.25s 1× · 0.5s 1×
```

Zwei Dinge stecken darin. Erstens sind 0,1 / 0,12 / 0,15 / 0,2 / 0,25 / 0,3 /
0,5 s **sieben Geschwindigkeiten für dieselbe Art von Übergang** — die App
fühlt sich je Ansicht anders schnell an. Zweitens ist `all` teuer und riskant:
es animiert auch `width`, `padding` und `grid-template-columns`, sodass beim
Auf- und Zuklappen von Karten und Widgets Layout-Sprünge mit-animiert werden.

**Fix:** drei Dauer-Tokens plus eine Kurve; `all` durch die tatsächlich
gemeinten Eigenschaften ersetzen (fast immer
`background, border-color, color, transform, box-shadow`). → `PATCHES.md` §6

## N-07 · Niedrig — Halbfett ist der Normalzustand

```
600  277×    700   91×
500   49×    bold  13×
400    6×    normal 3×
```

277 Stellen zeichnen etwas aus — damit zeichnet nichts mehr aus. Dazu `bold`
und `700` parallel für dieselbe Absicht. Die gebündelten Schriften liegen in
400/500/600/700 vor (`assets/fonts/`), `300` (1×) hat keine Datei und fällt
auf 400 zurück.

**Fix:** drei Gewichte festlegen — 400 Fließtext, 600 Überschrift/Label,
700 Zahl/Titel — `bold`/`normal`/`300` ersetzen und die 277 Vorkommen von
600 durchsehen: überall, wo ein ganzer Absatz halbfett ist, gehört 400 hin.

---

# C · Bedienbarkeit

## N-05 · Mittel — Fokus: 37× abgeschaltet, 7× ersetzt

```
outline: none        37×    :focus-visible    7×    :focus (alt)  45×

Einen Ring haben:   .btn · die Editorleiste (4 Regeln) · .rt-dice-btn
Keinen Ring haben:  .filter-chip · .nav-tab · .btn-icon
                    .toolbar-select · .toolbar-search
                    Listenzeilen und Karten mit data-action

Ohne jeden sichtbaren Ersatz:
  .cf-combat-value input:focus, .cf-combat-value select:focus
```

Die Eingabefelder ersetzen den Ring meist durch eine Rahmenfarbe — in Ordnung,
aber 36× einzeln entschieden, mit unterschiedlichem Ergebnis. Chips, Nav-Reiter
und Icon-Buttons haben nichts: wer mit der Tastatur arbeitet, sieht nicht, wo
er steht. Bei den Icon-Buttons (Bearbeiten/Löschen in jeder Liste) ist das ein
Bedienrisiko, weil die Reihenfolge ohne Ring nicht nachvollziehbar ist.

**Fix:** eine globale Regel mit `:where(...)` (Spezifität 0, also von jeder
Komponente ohne `!important` überschreibbar) und die 37 `outline: none` auf
`:focus` statt `:focus-visible` beschränken — Maus-Klick bleibt ruhig,
Tastatur behält den Ring. → `PATCHES.md` §7

## N-08 · Niedrig — Bewegung ist kaum abschaltbar

```
19  @keyframes
29  animation-Deklarationen
 4  prefers-reduced-motion
```

Würfelwurf, Trefferpunkt-Puls, Toast und die Kampf-Hervorhebung laufen weiter,
wenn das Betriebssystem „weniger Bewegung" meldet.

**Fix:** ein Block am Ende von `core.css`, der `animation-duration` und
`transition-duration` global auf 0,01 ms setzt; die Animationen, die
Information tragen (Würfelergebnis), namentlich ausnehmen. → `PATCHES.md` §8

## N-09 · Niedrig — zwei Zähler in der Zauber-Ansicht

```
assets/templates/view-resources.html

  Zeile 123   <span class="section-toolbar-count" id="spells-count">0</span>
  Zeile 186   <div id="spell-count" style="font-size: 0.85em;
                   color: var(--text-dim); white-space: nowrap;
                   margin-left: auto;"></div>
```

Die einzige Ansicht mit zwei Zähl-Anzeigen für dieselbe Liste. Die zweite
umgeht das Zähler-Schema aus F-10 (`setViewCount()`) und ist inline gestylt —
vier Eigenschaften, die als `.meta-text` schon existieren. Nebenbei heißt die
Filterleiste dort `.filter-bar`, überall sonst `.filter-chips`.

**Fix:** zweiten Zähler entfernen oder auf `setViewCount('spells', n)`
umstellen; Inline-Stil durch `.meta-text` ersetzen; `.filter-bar` auf
`.filter-chips` umbenennen.
