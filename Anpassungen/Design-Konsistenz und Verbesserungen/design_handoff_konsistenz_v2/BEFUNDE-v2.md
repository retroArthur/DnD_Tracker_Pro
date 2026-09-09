# Befunde — Design-Konsistenz-Audit v2

> **Korrekturvermerk (2026-09-09):** Die Kennzahlen dieser Datei wurden gegen
> `.planning/HANDOFF-V2-VERIFIKATION.md` (Tabelle „Korrigierte Ausgangswerte") nachgemessen. Wo
> dieses Dokument der Verifikation widerspricht, gilt die Verifikation. Der ursprüngliche
> Bericht-Wert bleibt an jeder korrigierten Stelle als Vergleichswert sichtbar (Kennzeichnung
> „[Bericht]" bzw. Klammer-Zusatz „Bericht"), nichts wurde spurlos ersetzt.

Geprüfte Fassung: `assets/styles/*.css` (21 Dateien, 27.187 Zeilen [Bericht] — gemessen: 20 Dateien
in `assets/styles/` mit 27.141 Zeilen; mit dem `@import`-Hub `assets/styles.css` mitgezählt 21
Dateien / 27.166 Zeilen. 27.187 ist in keiner Lesart reproduzierbar) und
`assets/templates/*.html` (13 Dateien [Bericht] — gemessen 12, `loader.js` `TEMPLATES` führt
ebenfalls 12; die 24 Ansichten sind bestätigt), Stand 08.09.2026.
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
390 rgba()-Literale in 173 [Bericht] verschiedenen Werten — gemessen: die 390 Vorkommen sind
bestätigt, aber nur 143 davon sind nach Leerraum-Normierung verschiedene Werte; die Differenz sind
30 reine Schreibweisenvarianten.

  rgba(0,0,0,…)         58×   Schatten (siehe N-03) — gemessen: 58 in box-shadow bestätigt,
                               66 rgba(0,0,0,…) insgesamt (6× background, 1× filter, 1× text-shadow)
  rgba(212,175,55,…)    54×   = --gold   im Dark-Theme
  rgba(251,191,36,…)    44×   [Bericht] = --yellow im Dark-Theme — gemessen: 32× davon sind
                               tatsächlich Gelb, die restlichen 12 sind rgba(251,146,60,…) =
                               --orange im Dark-Theme. Zwei Rollen waren in einer Zahl
                               zusammengefasst.
  rgba(239,68,68,…)     40×   = --red    im Dark-Theme
  rgba(255,255,255,…)   35×   Weiß-Auflagen (.nav-tab u. a.)

  Gegenprobe: --gold-rgb / --green-rgb / --red-rgb sind in ALLEN
  vier Themes definiert — und werden 4× [Bericht] benutzt. Gemessen: 6× insgesamt
  (initiative.css:1294, tools.css:2193/2199, welt.css:156/422/424); nur 4 davon sind background:.
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
| `--pink` | ~~—~~ 6,57 *(Bericht: „—", gemessen)* | 4,60 | **4,21** | ~~—~~ 5,00 *(Bericht: „—", gemessen)* |
| `--red` *(fehlt im Bericht — gemessen ergänzt)* | — | — | **4,29** | — |
| `.btn-primary` (Schrift auf Gold) | 9,24 | **2,98** | 5,65 | 14,97 |
| `.btn-success` (Schrift auf Grün) | 11,15 | **3,02** | **2,55** | 15,30 |

*(Korrektur: `--pink` IST in allen vier Themes definiert — dark `#f472b6` Z.16, contrast `#ff0080`
Z.97 — die zwei Gedankenstriche des Berichts sind sachlich falsch. Die `--red`-Zeile fehlte
vollständig: auf `--bg-card` ergibt Sepia 4,29 und unterschreitet ebenfalls — PATCHES §2b definiert
dafür bereits `--red-text: #da2825`.)*

Die beiden untersten Zeilen sind die schwerwiegendsten. *(Bericht: „die Primäraktion und der
Speichern-Knopf sind im Light- und Sepia-Theme grenzwertig lesbar" — gemessen präziser: die
Primäraktion [Gold] fällt nur im Light-Theme durch [2,98]; in Sepia erreicht sie 5,65. Nur
`.btn-success` fällt in BEIDEN hellen Themes durch [3,02 / 2,55]. Die Tabelle selbst sagt es schon
richtig — nur der Fließtext-Satz darüber nicht.)* Das sind die Knöpfe, die in jeder Ansicht oben
rechts stehen.

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
66 [Bericht] verschiedene box-shadow-Werte — gemessen 65 nach Leerraum-Normierung (dice.css:575
und :598 sind derselbe Wert, einmal umbrochen; eine Ratsche auf 66 hinge an einer reinen
Formatierungsfrage). 88 Deklarationen insgesamt (im Bericht nicht genannt).
58 davon mit hartem rgba(0,0,0,…) [Bericht: "58 der 66 WERTE" — gemessen: 58 DEKLARATIONEN, aber
nur 39 verschiedene WERTE. Die Zahl ist richtig, die Einheit war falsch.]
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
vier Themes passend definiert (`rgba(0,0,0,0.5)` bis `rgba(0,0,0,0.1)`) [Bericht — gemessen
FALSCH: `variables.css:101` setzt im Contrast-Theme `--shadow: rgba(255,255,255,0.1)` — WEISS,
nicht Schwarz. Dass es heute niemandem auffällt, liegt daran, dass genau EIN Element
(`core.css:857`, `.offline-indicator`) das Token benutzt; §4 würde diesen Sonderfall auf 88
Schatten hochskalieren.] und
wird genau einmal benutzt.

**Fix:** vier Höhenstufen als Tokens — `--elev-1` (Karte, ruhend), `--elev-2`
(Hover, Dropdown), `--elev-3` (Modal), `--glow-gold` (Fokus/Aktiv) — jede aus
`var(--shadow)` gebaut, also pro Theme richtig. Die 66 Werte darauf runden.
Die Innen- und Glüh-Sonderfälle (Statblock-Pergament, Würfel-Kritisch) bleiben
begründet stehen [Bericht — gemessen: von den drei genannten "dokumentierten Sonderfällen"
existieren ZWEI NICHT. Alle 7 `inset`-Schatten sitzen auf `.read-aloud` (party.css:390-438);
`bestiary.css` hat 0 `box-shadow`. Es gibt keinen einzigen `inset`-Schatten an einem
Fortschrittsbalken.]. → `PATCHES.md` §4

---

# B · Typografie und Bewegung

## N-04 · Mittel — 55 Schriftgrößen, zwei Maßsysteme, und `em` multipliziert sich

```
55 [Bericht — gemessen: 55 nur als Roh-Strings ohne variables.css ("0.9em" und "0.9em !important"
zählen als zwei Werte); 50 normalisiert, 47 reine Längen-Literale; mit variables.css mitgezählt 58.]
verschiedene font-size-Werte

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
*(Bericht: „Im Mobil-Profil wächst die Basis auf 16px, wodurch alle Abweichungen mitskalieren." —
gemessen FALSCH: `html` = 16px und `body` = 16px in BEIDEN Layout-Profilen. Es gibt 0
`html`-Selektoren in `assets/styles/`, `core.css:284` `body{}` setzt keine `font-size`, und
`--font-size-base: 14px` erreicht die Wurzel nie. Der Profilwechsel ändert die Basis heute um 0 %.)*
*(Bericht: „Ab 0,7em (≈10px) wird es auf dem Telefon unlesbar." — gemessen: 0,7em gegen die reale
Basis 16px = 11,2px. Die realen Kleinstwerte entstehen durch Verschachtelung und treten auf dem
DESKTOP auf: 169 von 5.032 Elementen unter 11px, kleinster Wert 7,70px, `.dms-live-badge`.)*

**Fix:** sieben Stufen als Tokens, in `rem` gegen die Profil-Basis definiert,
damit das Mobil-Profil weiter greift. Die vier häufigsten `em`-Werte decken
509 der ~1.000 Fundstellen ab — im Wesentlichen ein Suchen-Ersetzen.
→ `PATCHES.md` §5

## N-06 · Mittel — 132× `transition: all` *(Bericht — die Sammelzahl über alle `all`-Varianten ist gemessen 163, nicht 151/132+19; siehe CHECKLISTE.md)*

```
58 verschiedene transition-Deklarationen, 8 Dauern

  all 0.2s      132×      0.2s   195×
  all 0.15s      19×      0.15s   62×
  transform 0.2s 14×      0.3s    21×   [nachgemessen und bestätigt: 21 ohne variables.css, 22 mit
                                          — variables.css:380, mobile Navigationsleiste]
  background 0.2s 13×     0.1s     6×   0.12s 6×
  …                       0.25s 1× · 0.5s 1×
```

Zwei Dinge stecken darin. Erstens sind 0,1 / 0,12 / 0,15 / 0,2 / 0,25 / 0,3 /
0,5 s **sieben [Bericht] Geschwindigkeiten für dieselbe Art von Übergang** — gemessen sind es ACHT:
`0.08s` fehlt im Bericht vollständig (`party.css:2718`, `:2754`, `:2971`, Mikro-Druckeffekt) — die App
fühlt sich je Ansicht anders schnell an. Zweitens ist `all` teuer und riskant:
es animiert auch `width`, `padding` und `grid-template-columns`, sodass beim
Auf- und Zuklappen von Karten und Widgets Layout-Sprünge mit-animiert werden.

**Fix:** drei Dauer-Tokens plus eine Kurve; `all` durch die tatsächlich
gemeinten Eigenschaften ersetzen (fast immer
`background, border-color, color, transform, box-shadow`). → `PATCHES.md` §6

## N-07 · Niedrig — Halbfett ist der Normalzustand

```
600  277×  [Bericht] gemessen 285 (ohne variables.css/fonts.css); 288 über alle Dateien
700   91×  [Bericht] gemessen 92; 92 über alle Dateien
500   49×
bold  13×  [Bericht] gemessen 14; 14 über alle Dateien
400    6×
normal 3×
```

Die Differenz zwischen 277/91/13 (Bericht) und 285/92/14 (gemessen, ohne `variables.css`/
`fonts.css`) sind 8× `600 !important` (`party.css`), 1× `700 !important` und 1× `bold !important`
(beide `spells.css`) — der Bericht hat `!important`-Varianten nicht mitgezählt.

277 [Bericht] Stellen zeichnen etwas aus — damit zeichnet nichts mehr aus. Dazu `bold`
und `700` parallel für dieselbe Absicht. *(Bericht: „Die gebündelten Schriften liegen in
400/500/600/700 vor (`assets/fonts/`)" als Maßstab für reale Gewichte — gemessen gilt das nur als
Vereinigung über vier Font-Familien; keine einzelne Familie hat alle vier. Vor allem benutzt die UI
KEINE davon: `body` trägt `var(--font-ui) = 'Segoe UI'`. Segoe UI hat keinen 500er-Schnitt [500
rendert dort bereits als 400] und sehr wohl einen 300er — die 300-Begründung des Berichts ist
falsch.)* `300` (1×) hat keine Datei und fällt
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

*(Korrektur, gemessen: Die Aufzählung „Einen Ring haben" nennt nur 6 `:focus-visible`-Regeln (`.btn`
+ 4 Editorleisten-Regeln + `.rt-dice-btn`). Die 7. ist eine NACKTE globale Regel —
`assets/styles/dmscreen.css:1661` (Stand nach den CSS-Verschiebungen der Pläne 15-01/15-04;
ursprünglich vom Audit unter :1722 referenziert): `:focus-visible { outline: 2px solid var(--gold);
outline-offset: 2px }`, auf Klammertiefe 0, app-weit in beiden Bundles wirksam. Diese siebte Regel
widerlegt die Aussage „Keinen Ring haben: … `.nav-tab` · `.btn-icon`": beide bekommen den goldenen
Ring aus dieser globalen Regel — `.nav-tab` ist ein `<button>` ohne `outline:none`, `.btn-icon`
sitzt in 14 von 15 Fundstellen auf `<button>`. Die Bearbeiten-/Löschen-Knöpfe sind zu 29 von 30
`<button>`.)*

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

**WIDERLEGT (B-07, 2026-09-08):** Der beschriebene Block existiert bereits seit Langem
in `assets/styles/dmscreen.css` (gemessene Spanne 1408-1419), Top-Level, app-weit
wirksam — dieser Befund ist geschlossen, nicht ausgeführt. Details:
`.planning/HANDOFF-V2-VERIFIKATION.md` Blocker B-07, und der VERWORFEN-Block in
`PATCHES.md` §8.

## N-09 · Niedrig — zwei Zähler in der Zauber-Ansicht

```
assets/templates/view-resources.html

  Zeile 123   <span class="section-toolbar-count" id="spells-count">0</span>
  Zeile 186   <div id="spell-count" style="font-size: 0.85em;
                   color: var(--text-dim); white-space: nowrap;
                   margin-left: auto;"></div>
```

Die einzige Ansicht mit zwei Zähl-Anzeigen für dieselbe Liste [Bericht — gemessen: verschiedene
Semantik. `#spells-count` ist die Gesamtzahl (`String(n)`); `#spell-count` ist „📖 12/318", die
einzige Live-Filterrückmeldung. `setViewCount()` schreibt nur `String(n)` und kann die Bruchform
nicht darstellen — ein Löschen von `#spell-count` würde die korrekte Anzeige entfernen und die
falsche stehen lassen]. Die zweite
umgeht das Zähler-Schema aus F-10 (`setViewCount()`) und ist inline gestylt — [Bericht: „vier
Eigenschaften, die als `.meta-text` schon existieren" — gemessen hat `.meta-text` (`core.css:2045`)
nur ZWEI Eigenschaften: `color` und `font-size: 11px`. Es fehlen `margin-left: auto` (drückt den
Zähler an den rechten Rand) und `white-space: nowrap`; die `font-size` weicht zudem ab (0,85em ≈
13,6px gegen 11px).] Nebenbei heißt die
Filterleiste dort `.filter-bar`, überall sonst `.filter-chips` [Bericht — gemessen FALSCH: eine
nackte Klasse `.filter-chips` existiert NIRGENDS (0 Treffer in CSS/HTML/JS). Etabliert sind vier
präfigierte Container (`.npc-`/`.loc-`/`.enc-`/`.loot-filter-chips`). `.filter-bar` (`core.css:1965`)
trägt echtes Layout: `display:flex; gap:6px; flex-wrap:wrap`.].

**Fix:** zweiten Zähler entfernen oder auf `setViewCount('spells', n)`
umstellen; Inline-Stil durch `.meta-text` ersetzen; `.filter-bar` auf
`.filter-chips` umbenennen. *(Korrekturhinweis: dieser Fix-Vorschlag ist nach obiger Messung selbst
defekt — ein Entfernen von `#spell-count` löscht die korrekte Anzeige, und eine Umbenennung von
`.filter-bar` bräche das Layout dreier Filterleisten. Siehe `.planning/HANDOFF-V2-VERIFIKATION.md`
Blocker B-12 und `.planning/phases/15-befundlage-vorlauf/15-CONTEXT.md` D-47/D-48 für die
tatsächlich gebuchte Entscheidung.)*
