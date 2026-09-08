# Gegenproben — was das Audit nicht gesucht hat

Vier adversarische Durchgaenge, jeder mit einer eigenen Linse. Ergaenzung zu `HANDOFF-V2-VERIFIKATION.md`; die dort unter „Was das Audit nicht gefunden hat" gefuehrten Punkte sind die entdoppelte Auswahl hieraus.

---

## Linse: Theme-Vollstaendigkeit

_Theme-Vollstaendigkeit — Token-Symmetrie ueber die vier Theme-Bloecke, themenblinde Farben ausserhalb der Palette, und Stellen, an denen ein helles Theme eine Dark-Annahme erbt (bzw. umgekehrt)_

**Abdeckung:** GEPRUEFT UND SAUBER (Negativbefunde, ebenfalls gemessen):
1. Token-Symmetrie der vier Theme-Bloecke: Skript ueber variables.css ergibt je 21 Properties; light/sepia/contrast gegen dark: FEHLT [] / EXTRA []. Die Bloecke driften heute NICHT auseinander — die im Auftrag vermutete Hauptursache liegt nicht im Bestand, sondern im vorgeschlagenen Patch (Befund --red-text).
2. Spezifitaets-Kollisionen: Alle :root-Bloecke, die in der Kaskade (aus dem @import-Hub assets/styles.css gelesen) NACH den Theme-Bloecken stehen — variables.css :root (103 Props), variables.css :root,[data-layout=desktop] (12), core.css :root (3), dashboard.css :root (14) — kollidieren mit KEINEM der 21 Theme-Token. Kein Alias uebersteuert still ein Theme.
3. Hex-Literale ausserhalb variables.css: exakt 0 in allen 19 Komponenten-CSS (F-04 ist vollstaendig durchgezogen).
4. Theme-eigene Selektoren ausserhalb variables.css: 0 Treffer fuer `data-theme` in assets/styles/ ohne variables.css. Es gibt keine verstreuten Theme-Overrides.
5. Undefinierte Tokens: 10 Kandidaten, davon 7 (--color-character/-npc/-location/-quest/-encounter/-spell/-loot) in einem zweiten :root-Block in dashboard.css:1800 definiert (sie verweisen auf Palettentokens und folgen dem Theme korrekt) und 3 Laufzeit-Tokens (--hp-pct, --map-zoom, --migration-hint-height), die im Testnetz bereits als solche deklariert sind.
6. Inline-Stile in Templates: 44 Hex-Literale, aber nach Sichtung sind sie fast alle legitim themenunabhaengig — Farbfelder der Marker-Palette (modals-editors.html:109-117), die vier Theme-Vorschau-Kacheln (modals-tools.html:291-303) und das Debug-Terminal. Kein Befund.
7. Verlaeufe: 51 insgesamt, 16 ohne jedes Token — alle davon rgba-basiert und damit von N-01 als Klasse erfasst (Ausnahme siehe Befund zur Fremdpaletten-Herkunft).
8. Rechner-Kalibrierung: Mein WCAG-Rechner reproduziert JEDE in der N-02-Tabelle gedruckte Zelle exakt (--gold 8,28/3,25/6,58/13,46; .btn-success 11,15/3,02/2,55/15,30 usw.). Die Zahlen dieses Berichts sind mit demselben Code entstanden.

WAS ICH NICHT AUSSCHLIESSEN KANN:
- Ausschliesslich statische Analyse. Kein Browser, kein gebautes Buendel, keine gerenderte Seite. Kaskaden-Ueberschreibungen zur Laufzeit (spaetere Regel gewinnt) koennen einzelne der genannten Paarungen aufheben; ich habe jeweils die Regel geprueft, in der beide Deklarationen stehen, nicht den finalen berechneten Stil.
- Grossschrift-Ausnahme: Ich habe die 51 `color: white`-Stellen nicht einzeln auf >=18,66px fett bzw. >=24px geprueft. Wo das zutrifft, gilt 3:1 statt 4,5:1 — bei --purple (2,72) und --green (1,74) im Dark-Theme reisst auch diese Schwelle, bei --red (3,76) nicht.
- Alpha-Kompositing: Wo rgba-Auflagen ueber einer Elternflaeche liegen, habe ich die Volltonfarben verglichen, nicht die zusammengesetzte Flaeche. Die Ueberlagerungen aus N-01 sind dadurch bei mir eher zu guenstig als zu streng bewertet.
- Checkbox-Abdeckung: Ich konnte nicht bestimmen, wie viele der 205 Ankreuzfelder tatsaechlich unter einen der 13 accent-color-Selektoren fallen — nur, dass es keine globale Regel gibt.
- Dekorative Akzentleisten (--cat-*, --know-*, --dmg-* als 3px border-left, 30 Stellen) habe ich nicht gegen WCAG 1.4.11 bewertet; sie sind wahrscheinlich nicht „zur Identifikation erforderlich\", aber ich habe es nicht entschieden.
- Randnotiz ohne Befundcharakter, damit die Zahlen nachvollziehbar bleiben: meine Zaehlung ergibt 396 rgba()-Vorkommen in 146 normalisierten Werten; N-01 nennt 390 in 173 Werten. Die Differenz erklaert sich vermutlich durch Whitespace-Varianten (ich normalisiere `rgba(0, 0, 0, .3)` und `rgba(0,0,0,0.3)` NICHT auf denselben Wert, wohl aber Leerzeichen) und ist fuer keinen der Befunde tragend.

### [hoch] 51× `color: white` auf gesaettigter Flaeche — im STANDARD-Theme (Dark) unter 4,5:1; der Quellkommentar behauptet das Gegenteil

**Ort:** assets/styles/variables.css:283-287 (Token) + 51 Regeln in 14 CSS-Dateien

**Beleg:** Zaehlung (eigenes Skript ueber alle assets/styles/*.css, Kommentare entfernt, Regelkoerper-basiert):
  `white` als Farbwert: 56 Deklarationen in 56 Regeln — 51x color, 4x border, 1x stroke
Verteilung der 51 `color: white` nach Hintergrund DERSELBEN Regel:
   25x var(--red) · 13x var(--purple) · 2x var(--blue) · 1x var(--green) · 3x Rot-Verlaeufe · 5x var(--dmg-*) · 2x sonstige

WCAG-Kontrast #ffffff auf der Akzentflaeche, je Theme (Rechner gegen die N-02-Tabelle kalibriert — er reproduziert jede dort gedruckte Zelle exakt, z.B. --gold auf --bg-card: 8,28 / 3,25 / 6,58 / 13,46):
  Flaeche      Dark    Light   Sepia  Contrast
  --red        3,76!   4,83    4,63    4,00!
  --purple     2,72!   5,70    4,38!   3,14!
  --blue       2,54!   5,17    3,68!   3,80!
  --green      1,74!   3,30!   3,20!   1,37!
  --gold       2,10!   3,25!   7,10    1,40!
  --yellow     1,67!   2,94!   3,21!   1,07!
  --cyan       1,97!   3,68!   3,16!   1,25!

Damit fallen 41 der 51 Stellen (25 rot + 13 lila + 2 blau + 1 gruen) im Dark-Theme durch — dem Standard (core/themes.js:23 `D.settings?.theme || 'dark'`).

Der Kommentar an variables.css:283-287 behauptet woertlich: „Schrift auf gesaettigten Akzentflaechen (roter/gruener Knopf). BEWUSST themenunabhaengig weiss: die Akzentfarben sind in allen vier Themes dunkel genug" — die Messung widerlegt das fuer JEDES Theme. Dieselbe Annahme steckt in den 6 Verwendungen von `var(--on-accent)` (initiative.css:948 auf --red, party.css:3147 auf --purple, spells.css:75 und :135 auf --purple, welt.css:1065 auf --red, welt.css:1073 auf --green → 1,74:1 in Dark).

**Warum es zaehlt:** N-02 misst zwei Richtungen: Textrollen gegen --bg-card und `--bg-dark` als Schrift auf gefuellten Knoepfen. Die dritte, ebenso verbreitete Richtung — WEISS auf Akzentflaeche — ist in BEFUNDE-v2 nirgends geprueft. Ihr Befund kehrt die Aussage des Berichts um: hier ist nicht Light/Sepia kaputt, sondern das Dark-Theme, das die App standardmaessig traegt. Betroffen sind Zaehler-Badges (.badge, .cart-badge), Schadensausgaben (.aoe-damage-result), CR-Marken (.enc-item-cr) und die Loeschen-Hover in jeder Liste. Der irrefuehrende Kommentar ist der eigentliche Schaden: er wird die naechste Welle davon abhalten, hier nachzumessen.

**Bezug:** neu, grenzt an N-02 (dort nur --bg-dark-Schrift und Text auf --bg-card)

### [hoch] Das Muster `color: var(--bg-dark)` steht an 100 Stellen, nicht an 3+5 — und die Triage-Regel in PATCHES §1c erzeugt neue Fehler

**Ort:** assets/styles/*.css (100 Deklarationen) vs. PATCHES.md §1b/§1c

**Beleg:** Gezaehlt mit einem regelkoerper-basierten Skript ueber alle assets/styles/*.css:
  Deklarationen 'color: var(--bg-dark)': 100
  nach Hintergrund DERSELBEN Regel:
    45x var(--gold) · 21x var(--green) · 13x var(--cyan) · 4x var(--yellow)
     4x var(--orange) · 4x var(--red) · 1x var(--purple) · 1x var(--pink)
     1x var(--gold-dim) · 5x ohne/neutraler Hintergrund

PATCHES §1b patcht drei Selektoren (.btn-primary/.btn-success/.btn-gold); §1c sagt woertlich „dieselbe Ursache an fuenf weiteren Stellen". Tatsaechlich sind es 66 allein auf --gold/--green und 100 insgesamt.

Kontrast --bg-dark ALS SCHRIFT auf der Flaeche (heutiger Zustand):
  Flaeche     Stellen   Dark   Light  Sepia  Contrast
  --gold        45      9,24   2,98!  5,65   14,97
  --green       21     11,15   3,02!  2,55!  15,30
  --cyan        13      9,89   3,38!  2,51!  16,75
  --yellow       4     11,64   2,69!  2,55!  19,56
  --orange       4      8,59   3,26!  3,67!   8,34
  --red          4      5,16   4,43!  3,68!   5,25

§1c gibt als Ausweichregel vor: „Liegt darunter --red oder --blue, ist --on-accent (weiss) richtig und bleibt." Nachgerechnet ist Weiss auf --red 3,76 (Dark) und 4,00 (Contrast) — beides unter 4,5. Und zu --cyan (13 Stellen), --yellow (4), --orange (4), --pink (1) sagt die Regel gar nichts; wer sie sinngemaess auf Weiss ausdehnt, verschlechtert das Dark-Theme massiv (--yellow: heute 11,64 → mit Weiss 1,67).

**Warum es zaehlt:** Der Handoff beziffert den Umfang von N-02 um Faktor 12 zu niedrig. Wer CHECKLISTE.md abarbeitet, patcht drei Knoepfe, sieht den grep-Haken gruen (die Checkliste prueft nur `grep btn-primary\|btn-success\|btn-gold ... | grep bg-dark  # leer`) und laesst 97 Stellen mit demselben Defekt stehen — darunter .qref-diff.*, .quest-type-badge.*, .spell-comp.active, .search-result-type.*, .enc-add-btn, .char-confirm-level-btn. Der vorgeschlagene Ratschen-Test in CHECKLISTE.md prueft ausschliesslich --on-gold/--on-green gegen --gold/--green und wuerde diesen Rest ebenfalls nie sehen.

**Bezug:** N-02 (Umfang und Fix-Regel), PATCHES §1b/§1c, CHECKLISTE Zeile 16-18

### [hoch] `--shadow` ist im Contrast-Theme WEISS — N-03 behauptet, es sei in allen vier Themes schwarz, und PATCHES §4 baut alle Hoehenstufen darauf

**Ort:** assets/styles/variables.css:101

**Beleg:** $ grep -n "--shadow:" assets/styles/variables.css
  20:            --shadow: rgba(0,0,0,0.5);      <- Dark
  49:            --shadow: rgba(0,0,0,0.15);     <- Light
  75:            --shadow: rgba(0,0,0,0.1);      <- Sepia
  101:            --shadow: rgba(255,255,255,0.1);  <- Contrast

BEFUNDE-v2 N-03 sagt woertlich: „`--shadow` ist in allen vier Themes passend definiert (`rgba(0,0,0,0.5)` bis `rgba(0,0,0,0.1)`)". Der Contrast-Wert ist weiss, nicht schwarz — die Spanne stimmt nicht.

PATCHES §4a definiert darauf aufbauend:
  --elev-1: 0 2px 6px var(--shadow);
  --elev-2: 0 4px 14px var(--shadow);
  --elev-3: 0 12px 32px var(--shadow);
mit dem Kommentar „im Dark-Theme 0.5, im Sepia 0.1" — das Contrast-Theme kommt darin nicht vor.

$ grep -rhoE "box-shadow[^;]*rgba\( *0, *0, *0" assets/styles/*.css | wc -l
  57
$ grep -rn "var(--shadow)" assets/styles/*.css
  assets/styles/core.css:857:            box-shadow: 0 2px 10px var(--shadow);   (einzige Verwendung)

**Warum es zaehlt:** Die 57 heute hart schwarzen Schatten sind im Contrast-Theme wenigstens noch Schatten. Nach §4 werden aus allen 57 im Contrast-Theme weisse Halos um jede Karte, jedes Dropdown und jedes Modal auf schwarzem Grund — ein Theme-weiter Umbau des Erscheinungsbilds, den weder N-03 noch die Checkliste erwaehnt. Die Checkliste ratscht nur `box-shadow` auf die Tokens (Zeile 36-41) und wuerde diesen Zustand als korrekt abhaken. Der Fix ist klein (Contrast-Theme braucht ein eigenes --shadow oder die Stufen brauchen eine eigene Deckkraftquelle), aber er muss VOR §4 passieren.

**Bezug:** N-03 (Praemisse falsch), PATCHES §4a

### [hoch] `--coin-*` und `--attr-*` sind themenunabhaengige Textfarben und fallen in Light/Sepia bis auf 1,29:1 — bis zur Unsichtbarkeit

**Ort:** assets/styles/variables.css:228-231 und :289-294; verbraucht in party.css:1645-1649, dmscreen.css:2352-2357 und :2453-2458, dashboard.css:2524-2529

**Beleg:** Diese Tokens stehen im Aliasblock `:root` — also EINMAL fuer alle vier Themes. Verbrauchsstellen (Skript ueber alle Regelkoerper):
  --attr-*  -> 18x als `color`
  --coin-*  ->  4x als `color`
Die tragende Flaeche steht im CSS:
  party.css:1241  .cf-panel { background: var(--bg-dark); ... }   (enthaelt .cf-coin-label)
  dmscreen.css:2373  .dms-attr-item { ... background: var(--bg-dark); }

Kontrast gegen --bg-dark je Theme:
  Token          Wert       Dark   Light  Sepia  Contrast
  --attr-dex     #22c55e    8,53   2,09!  1,81!   9,22
  --attr-con     #f59e0b    9,05   1,97!  1,71!   9,78
  --attr-int     #3b82f6    5,28   3,37!  2,93!   5,71
  --attr-wis     #a855f7    4,91   3,63!  3,15!   5,31
  --attr-cha     #ec4899    5,51   3,24!  2,81!   5,95
  --coin-gm      #ffd700   13,86   1,29!  1,12!  14,97
  --coin-sm      #c0c0c0   10,68   1,67!  1,45!  11,54
  --coin-km      #cd7f32    6,18   2,88!  2,50!   6,68
  --coin-pm      #b8860b    5,97   2,98!  2,59!   6,45

Der Kommentar an variables.css:224-231 datiert die Muenzfarben auf „Code-Review 2026-09-08" und begruendet sie mit Unterscheidbarkeit im Finanz-Widget („am gebauten Buendel gemessen: beide rgb(166,138,42)").

**Warum es zaehlt:** Lehrbuchfall der gesuchten Klasse: ein Fix wurde am Dark-Theme gemessen und als themenunabhaengiges Token abgelegt. Im Light- und Sepia-Theme ist die Goldmuenzen-Beschriftung „GM" bei 1,29:1 faktisch weisse Schrift auf Weiss — der Wert daneben ist lesbar, das Label nicht. Die N-02-Tabelle listet ausschliesslich Palettenrollen (--text, --text-dim, --gold, --green, --cyan, --yellow, --orange, --blue, --purple, --pink) und beruehrt die 22 themenunabhaengigen Textfarben nicht. Der in CHECKLISTE.md vorgeschlagene Ratschen-Test prueft nur die ROLLEN-Liste ['gold','green','cyan','yellow','orange','blue','purple'] und wuerde sie ebenfalls nie sehen.

**Bezug:** neu, ausserhalb der N-02-Tabelle

### [mittel] PATCHES §2 legt `--red-text` NUR im Sepia-Block an — genau der Fehlertyp, den das bestehende Testnetz nicht faengt

**Ort:** PATCHES.md §2a/§2b, gegen tests/unit/design-consistency.test.js:45

**Beleg:** PATCHES §2a (Aliasblock, gilt fuer alle Themes) definiert acht Namen:
  --gold-text, --green-text, --cyan-text, --yellow-text, --orange-text, --blue-text, --purple-text, --pink-text
  -> `--red-text` ist NICHT dabei.
PATCHES §2b, Block [data-theme="sepia"], definiert neun Namen, darunter:
  --red-text: #da2825;    /* 4,29 -> 4,52 */

Damit existiert `--red-text` ausschliesslich unter [data-theme="sepia"]. In Dark, Light und Contrast ist `var(--red-text)` ein ungueltiger Wert; bei der geerbten Eigenschaft `color` faellt das Element auf den ererbten Wert zurueck, also lautlos auf --text.

Das vorhandene Netz faengt das nicht:
  tests/unit/design-consistency.test.js:45  'kein var(--x) ohne Definition, Fallback oder Laufzeitquelle'
  -> baut EINE Menge `defined` ueber cssAll (alle Dateien, alle Bloecke zusammen). Eine Definition in irgendeinem Block genuegt.
Der in CHECKLISTE.md vorgeschlagene neue Kontrast-Test ebenfalls nicht:
  const ROLLEN = ['gold','green','cyan','yellow','orange','blue','purple'];
  -> weder 'red' noch 'pink'.

Gegenprobe am Bestand: die vier Theme-Bloecke sind heute exakt symmetrisch (Skript: je 21 Properties, FEHLT: [] / EXTRA: [] fuer light, sepia, contrast gegen dark). §2b waere der erste Bruch dieser Symmetrie.

**Warum es zaehlt:** Der Auftrag nennt als Vorbild den Vorfall mit den „zwei widersprüchlichen Schadensart-Farbsaetzen". Dies ist derselbe Mechanismus, nur vorwaerts: ein Token, das in drei von vier Themes fehlt, faellt nicht auf, weil CSS ungueltige var()-Werte nicht meldet. Die Symmetrie der vier Bloecke ist der einzige Grund, warum die Themes heute nicht auseinanderdriften — und es gibt keinen Test, der sie sichert. Ein Test, der die Property-Mengen der vier Bloecke gegeneinander prueft (statt nur --gold-rgb/--green-rgb/--red-rgb wie Zeile 62), waere die eigentlich fehlende Ratsche.

**Bezug:** PATCHES §2a/§2b; Luecke in tests/unit/design-consistency.test.js:45 und im Vorschlag der CHECKLISTE

### [mittel] Die rgba-Literale stammen NICHT nur aus der Dark-Palette — N-01s Praemisse deckt 25 Vorkommen nicht ab, die Ersetzungstabelle in §3b noch weniger

**Ort:** assets/styles/dice.css:576-599 und :745-751, tools.css (9x), spells.css:32/38, initiative.css:355-422

**Beleg:** Alle rgba()-Farbtripel aus assets/styles/*.css (ohne variables.css) gegen die vier Palettenbloecke aufgeloest:
  54x rgb(212,175,55)  -> dark:--gold
  40x rgb(239,68,68)   -> dark:--red
  32x rgb(251,191,36)  -> dark:--yellow
  19x rgb(74,222,128)  -> dark:--green
  12x rgb(126,196,207) -> dark:--cyan
  12x rgb(251,146,60)  -> dark:--orange
  11x rgb(96,165,250)  -> dark:--blue
   8x rgb(167,139,250) -> dark:--purple
  --- und dann:
  11x rgb(220,38,38)   -> LIGHT:--red      (#dc2626)
   9x rgb(255,215,0)   -> CONTRAST:--gold  (#ffd700)
   2x rgb(124,58,237)  -> LIGHT:--purple   (#7c3aed)
   4x rgb(147,51,234) / 2x rgb(234,179,8) -> in KEINEM Theme eine Palettenfarbe

BEFUNDE-v2 N-01 sagt: „dort steht die Dark-Theme-Palette weiterhin als Zahlentripel". Fuer 25 Vorkommen stimmt das nicht.

Belegfall, ein Element mit zwei Rots gleichzeitig (assets/styles/dice.css:744-752):
  .fdp-die.d20 { background: linear-gradient(135deg, rgba(220,38,38,0.2), rgba(153,27,27,0.3));
                 border-color: rgba(220,38,38,0.5); }
  .fdp-die.d20:hover { border-color: var(--red); box-shadow: 0 0 12px rgba(220,38,38,0.3); }
Der Rahmen wechselt beim Hover von #dc2626 auf var(--red) — in Dark #ef4444, in Sepia #dc322f, in Contrast #ff0000. In drei von vier Themes ein Farbtonsprung, im vierten (Light) zufaellig identisch.

PATCHES §3b listet als Ersetzungstabelle genau fuenf Tripel (212,175,55 / 251,191,36 / 239,68,68 / 74,222,128 / 96,165,250). Die 25 Fremdpaletten-Vorkommen und die 6 palettenfremden stehen nicht darin.

**Warum es zaehlt:** §3b ist als „mechanisches Ersetzen" beschrieben und schliesst mit „Danach bleibt in rgba() kein Zahlentripel mehr uebrig ausser denen in variables.css". Nach der Tabelle bleiben aber mindestens 31 Vorkommen stehen — und wer sie beim Aufraeumen doch noch trifft, muss entscheiden, ob rgba(220,38,38) auf --red abgebildet wird (dann aendert sich in Dark, Sepia und Contrast der sichtbare Farbton) oder erhalten bleibt (dann bleibt der Bruch). Diese Entscheidung ist im Handoff nicht getroffen, weil die Praemisse „alles ist Dark" sie unsichtbar macht.

**Bezug:** N-01 (Praemisse unvollstaendig), PATCHES §3b

### [mittel] `color-scheme` ist nirgends gesetzt — die nativen Bedienelemente ignorieren alle vier Themes

**Ort:** assets/styles/variables.css / core.css (Fehlstelle), Templates: 88 <select>, 205 type="checkbox", 76 type="number"

**Beleg:** $ grep -rn "color-scheme" assets/ core/ ui/ systems/ utils/ features/ render/ build.py index.html
  (keine Treffer)
$ grep -rn "prefers-color-scheme" assets/ core/ ui/ systems/ features/
  (keine Treffer)
$ grep -c "<select" assets/templates/*.html
  modals-editors 10, modals-entity 34, modals-shops 5, modals-tools 3,
  view-bestiary 7, view-encounters 8, view-party 7, view-resources 9, view-tools 5  = 88
$ grep -rho 'type="(checkbox|date|number)"' assets/templates/*.html | sort | uniq -c
  205 checkbox · 76 number · 1 date

Abdeckung der nativen Teile heute:
  accent-color: nur 13 Regeln, alle eng gescopet (.assign-spell-item input, .cf-skill-row input,
  .aoe-target-checkbox, .filter-toggle input, …) — KEINE globale input[type="checkbox"]-Regel.
  scrollbar-color (Firefox): genau 1x, dmscreen.css:1954.
  appearance: none nur an Number-Spinnern und zwei Reglern — kein <select> ist nachgebaut.

Das Theme haengt am Wurzelelement (core/themes.js:13 `document.documentElement.setAttribute('data-theme', theme)`), erreicht die UA-Oberflaechen aber ohne `color-scheme` nicht.

**Warum es zaehlt:** Ohne `color-scheme` rendert der Browser Bildlaufleisten (ausser den 4 ::-webkit-Stellen), Ankreuzfelder ohne accent-color, die Spinner der 76 Zahlenfelder und den Datumswaehler in seinem hellen Standard — im Dark- und im Contrast-Theme also fremdkoerperhaft hell. Es ist die einzige theme-relevante Eigenschaft, die man NICHT durch Aufraeumen von Literalen erreicht, sondern nur durch eine Zeile pro Theme-Block (`color-scheme: dark` bzw. `light`). Sie fehlt in BEFUNDE-v2, PATCHES und CHECKLISTE vollstaendig.

**Bezug:** neu

### [mittel] Theme-Rot auf festem Pergament: der Statblock traegt eine themenabhaengige Ueberschriftfarbe auf einer bewusst themenunabhaengigen Flaeche

**Ort:** assets/styles/bestiary.css:212-216 und :292-298, Flaeche aus party.css:394-398

**Beleg:** features/bestiary/bestiary-render.js:300 baut:
  '<div class="bestiary-statblock read-aloud parchment">'
assets/styles/party.css:394-398:
  .read-aloud.parchment { background: linear-gradient(135deg, var(--ra-parchment-from) 0%, var(--ra-parchment-to) 100%); color: var(--ra-parchment-ink); }
Die drei Tokens sind laut variables.css:239-251 „BEWUSST themenunabhaengig" (#f5e6c8 / #e8d4a8 / #2c1810).

Auf dieser festen Flaeche stehen aber zwei theme-folgende Regeln (Skript ueber alle .bestiary-statblock*-Regeln, nur diese beiden nutzen Palettentokens):
  bestiary.css:212  .bestiary-statblock-name { color: var(--red); font-size: 18px; font-weight: 700; }
  bestiary.css:292  .bestiary-statblock-section-heading { color: var(--red); border-bottom: 1px solid var(--red); font-size: 16px; font-weight: 700; }

Kontrast var(--red) gegen das Pergament:
  auf --ra-parchment-from #f5e6c8:  Dark 3,05 · Light 3,92 · Sepia 3,75 · Contrast 3,24
  auf --ra-parchment-to   #e8d4a8:  Dark 2,58 · Light 3,31 · Sepia 3,17 · Contrast 2,74
Alle acht Werte unter 4,5. Die Abschnittsueberschrift ist mit 16px/700 normaler Text, fuer sie gilt 4,5 ohne Ausnahme.

**Warum es zaehlt:** Zwei Entwurfsentscheidungen stossen hier zusammen, ohne dass es jemandem auffaellt: die Flaeche wurde bewusst aus dem Theme herausgenommen, die Schrift darauf nicht. Ergebnis ist ein Element, dessen Lesbarkeit sich je Theme aendert (2,58 bis 3,92), obwohl der Untergrund konstant ist — und das in keinem Theme die Schwelle erreicht. N-02 misst ausschliesslich gegen --bg-card und kann das per Konstruktion nicht sehen. Es ist zugleich die Stelle, an der ein spaeteres „--red-text"-Umschreiben (PATCHES §2c) das Problem verschlimmern koennte, wenn jemand die Regel als „Text auf --bg-card" fehlklassifiziert.

**Bezug:** neu, ausserhalb der Messbasis von N-02

### [niedrig] Rahmen von Eingabefeldern und Karten erreichen in KEINEM Theme 3:1 — auch nicht im Theme, das „Hoher Kontrast" heisst

**Ort:** assets/styles/variables.css:19/48/74/100 (--border), verbraucht 489x

**Beleg:** $ grep -rn "var(--border)" assets/styles/*.css | wc -l
  489
assets/styles/core.css:541-547:
  .form-group input, .form-group select, .form-group textarea {
      background: var(--bg-dark); border: 1px solid var(--border); color: var(--text); }

Kontrast --border gegen die Feldflaeche --bg-dark (WCAG 1.4.11 verlangt 3:1 fuer Bedienelement-Begrenzungen):
  Dark      #3a3a3a auf #0d0d0d = 1,71
  Light     #ccc    auf #f5f5f5 = 1,47
  Sepia     #c9b99a auf #f4e4c1 = 1,53
  Contrast  #555    auf #000000 = 2,82
gegen die Kartenflaeche --bg-card: 1,53 / 1,61 / 1,79 / 2,53.

**Warum es zaehlt:** Der Audit prueft ausdruecklich nur TEXT-Rollen; die Nicht-Text-Schwelle aus WCAG 1.4.11 kommt in BEFUNDE-v2 nicht vor. Auffaellig ist weniger der Bestand als das Contrast-Theme: es existiert, um Kontrast zu liefern, und liegt bei den Feldrahmen mit 2,82 als einziges Kriterium knapp unter der Schwelle — d.h. der Nutzer, der es einschaltet, bekommt fuer Formularfelder keine Verbesserung. Zusammen mit N-05 (Fokusringe) ist das derselbe blinde Fleck aus zwei Richtungen: N-05 behandelt den Fokuszustand, hier fehlt schon der Ruhezustand.

**Bezug:** grenzt an N-05, aber dort geht es um :focus, nicht um die Ruhezustands-Begrenzung

---

## Linse: Patch-Kollision

_Patch-Kollision — die neun Vorschläge gegen das eingefrorene Testnetz (tests/unit/design-consistency.test.js, 64 Tests), die Ratschen daraus, tests/e2e/ und die Werkzeugkette (build.py, tools/sync-editor-toolbars.js)_

**Abdeckung:** Geprüft und mit eigenen Läufen belegt: (1) tests/unit/design-consistency.test.js vollständig gelesen (956 Zeilen, 64 Tests) und zuerst gegen den unveränderten Baum ausgeführt — `npx jest tests/unit/design-consistency.test.js` -> 64 passed, 64 total. Alle Ist-Werte selbst gemessen, nicht aus dem Bericht übernommen: !important = 105 (Ratsche IMPORTANT_MAX = 105, sitzt punktgenau auf dem Ist-Wert), Dubletten = 0 (DUBLETTEN_MAX = 0), rem = 0, Inline-Stile-Ratsche INLINE_MAX = 257 (N-09 senkt sie nur, keine Kollision), rgba-Tripel im Komponenten-CSS = 390 (deckt sich mit N-01), 784 em-font-size-Deklarationen von 1088 (BEFUNDE nennt \"~740\" bzw. \"~1.000\" — dieselbe Größenordnung, meine Zahlen stammen aus dem T-2-Prüfumfang ohne variables.css). (2) Alle sechs vom Auftrag genannten Regeln einzeln gegen die Patches gehalten: !important-Ratsche, Dubletten-Ratsche, Hex-Regel (F-04), Radien-Skala (F-06), Breakpoint-Regel (F-12) — dazu F-01, F-03, F-05, F-13, F-14, F-17, F-19. Ohne Kollision: F-04 (die Patches legen Hex ausschließlich in variables.css ab, das der Test ausnimmt), F-06 (`border-radius: var(--radius-sm)` in §7a ist von der Skala gedeckt), F-12 (§8 bringt eine Media Query ohne width-Grenze mit), F-05, F-13, F-17, F-19. (3) Kollisionen gegen die Patches per Simulation im Arbeitsspeicher nachgestellt — kein Repo-Schreibzugriff, PATCHES.md §1b/§2a/§2b/§5a/§8 wörtlich angewandt, danach die Original-Prädikate der Tests laufen lassen (inkl. wortgleicher Kopie der bloecke()-Funktion). (4) Werkzeugkette: `python -c \"...minify_css(...)\"` gegen fünf Patch-Schnipsel — `:where(...)`, `color-mix(in srgb, ...)`, `@media (prefers-reduced-motion: reduce)`, die fünfteilige transition-Langform und `box-shadow: 0 0 0 3px color-mix(...)` überstehen die Minifizierung syntaktisch unbeschädigt; keine Kollision. build.py liest CSS-Reihenfolge, Modul- und Template-Liste aus dem @import-Hub bzw. loader.js — die Patches legen keine neue Datei an, also kein SSoT-Problem. `node tools/sync-editor-toolbars.js --check` -> \"Alle 22 Leisten sind mit dem Generator synchron\"; der Generator besitzt in view-resources.html nur die zwei Editorleisten (session-text, wiki-content) und findet seine Blöcke über `data-toolbar-for=\"<id>\"` — die N-09-Stellen (Zeilen 173-186) liegen außerhalb, keine Kollision. (5) tests/e2e/: einzige Zusicherung auf einen berechneten Stil ist tests/e2e/features/wiki.spec.js:396 (`toHaveCSS('background-color', 'rgba(255, 215, 0, 0.3)')`); Quelle ist features/wiki/wiki-crud.js:495, ein per JS gesetzter Inline-Stil — die reinen CSS-Patches machen sie nicht ungültig. Gesucht und NICHT gefunden: Zusicherungen auf Fokusringe, Schriftgrößen oder Übergänge (`grep press('Tab')|:focus-visible|activeElement` in tests/e2e/ -> leer). Weiterer CSS-lesender Unit-Test: tests/unit/stability.test.js (Zeile 1728) — durchsucht assets/styles nur nach der Zeichenkette 'autosave-toggle', von keinem Patch berührt. NICHT ausgeschlossen: (a) die volle Playwright-Suite habe ich nicht ausgeführt, nur statisch durchsucht — ein Spec, der indirekt über Sichtbarkeit/Position auf geänderte Schriftgrößen oder das transition-Verhalten reagiert, kann mir entgangen sein; (b) Laufzeit- und Sichtwirkungen (color-mix-Ergebnisse, tatsächliche Kontraste im Browser, das Verhalten des globalen Fokusrings über Overlays) habe ich nicht gemessen, das ist rein statische Analyse; (c) die Kontrastzahlen aus N-02 habe ich bewusst NICHT nachgerechnet — sie fallen in die Verifikationsrolle, nicht in diese Gegenprüfung; (d) §6 (transition-Utility) und §4 (Höhenstufen) sind zu unspezifisch formuliert, um sie zeilengenau zu simulieren — ich konnte für sie nur ausschließen, dass sie eine der zwölf bestehenden Ratschen direkt verletzen, nicht, dass ihre konkrete Umsetzung es tut.

### [hoch] §1b bricht den eingefrorenen F-14-Test: er verlangt genau das color: var(--bg-dark), das der Patch entfernt

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/tests/unit/design-consistency.test.js:260

**Beleg:** Der eingefrorene Test (Zeile 257-260) lautet:
    const base = cssCode.match(/\n\s*\.btn-primary\s*\{([^{}]*)\}/);
    expect(base[1]).toMatch(/background:\s*var\(--gold\)/);
    expect(base[1]).toMatch(/color:\s*var\(--bg-dark\)/);

Gemessen (Patch-Simulation im Speicher, kein Repo-Schreibzugriff; PATCHES.md §1b wörtlich angewandt):
  $ node -e "...C.content=C.content.replace(/(\.btn-primary \{[^}]*?)color: var\(--bg-dark\);/s,'$1color: var(--on-gold);')..."
  === NACH PATCH ===
  F-14  .btn-primary hat color:var(--bg-dark)? false   -> Test erwartet true

Ausgangslage vorher gemessen:
  $ npx jest tests/unit/design-consistency.test.js
  Tests:       64 passed, 64 total

Die Quelle steht in core.css:2497-2502 mit `color: var(--bg-dark);`. CHECKLISTE.md fordert exakt das Gegenteil des Tests: `grep -n "btn-primary\|btn-success\|btn-gold" assets/styles/core.css | grep "bg-dark"   # leer`.

**Warum es zaehlt:** Welle 4 macht die Suite rot, sobald der erste Patch angewandt ist. Weder BEFUNDE-v2.md noch CHECKLISTE.md erwähnt, dass F-14 den alten Wert festnagelt — die Reihenfolge "§1 -> §2 -> ..." am Ende der Checkliste unterstellt eine grüne Suite. Der Test muss im selben Commit mitgezogen werden (auf `var(--on-gold)` mit Begründung), sonst wird er beim Rotwerden vermutlich einfach entschärft — und das war der Test, der F-14 überhaupt festhielt.

**Bezug:** N-02 (die Ratsche, die N-02 blockiert, wird nirgends genannt)

### [hoch] §5a bricht F-03 "keine rem-Werte": die Typo-Skala legt 7 rem-Literale genau in die Datei, die der Test NICHT ausnimmt

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/tests/unit/design-consistency.test.js:584

**Beleg:** F-03 (Zeile 584-591) filtert nur fonts.css heraus, variables.css bleibt im Prüfumfang:
    const scope = withoutComments(cssFiles.filter(f => f.name !== 'fonts.css').map(f => f.content).join('\n'));
    const rems = scope.match(/\d*\.?\d+rem/g) || [];
    expect(rems).toEqual([]);

Gemessen:
  IST:  $ node -e "..." -> F-03 rem-Treffer IST: 0
  NACH §5a (7 Tokens --text-xs..--text-3xl in variables.css eingesetzt):
    F-03  rem-Treffer: 7 -> ["0.786rem","0.857rem","1rem","1.143rem","1.429rem","1.857rem","2.429rem"]  Test erwartet []

**Warum es zaehlt:** PATCHES.md §5a wählt rem ausdrücklich als Einheit ("rem gegen die Profil-Basis") — und trifft damit frontal die Einheiten-Ratsche aus Welle 3, deren erklärter Zweck war, dass px und rem nicht mehr nebeneinander laufen. Das ist kein Formfehler, sondern ein echter Zielkonflikt: entweder F-03 bekommt eine begründete Ausnahme für den Token-Block, oder die Skala wird in px definiert und das Mobil-Profil anders gelöst. Beides muss vor Welle 5 entschieden sein, nicht im Rotlauf.

**Bezug:** N-04

### [hoch] §2b bricht F-01 "Aliasblock steht NACH allen Theme-Blöcken" — der Patch schiebt zwei [data-theme]-Blöcke dahinter

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/tests/unit/design-consistency.test.js:54

**Beleg:** F-01 (Zeile 54-60):
    const lastTheme = vars.lastIndexOf('[data-theme=');
    const alias = vars.indexOf('--surface: var(--bg-card)');
    expect(alias).toBeGreaterThan(lastTheme);

PATCHES.md §2b sagt wörtlich: "Diese Blöcke müssen **nach** dem Aliasblock stehen, sonst gewinnt die Alias-Zuweisung."

Gemessen:
  IST:      lastIndexOf('[data-theme=') = 4046   alias = 4485   -> alias > lastTheme, grün
  NACH §2b: lastTheme = 5405                     alias = 4485   -> alias < lastTheme, ROT

Struktur bestätigt:
  $ grep -n "^\s*:root\|\[data-theme=\|--surface: var(--bg-card)" assets/styles/variables.css
  2:  :root, [data-theme="dark"] {
  31: [data-theme="light"] {
  57: [data-theme="sepia"] {
  83: [data-theme="contrast"] {
  118:   [data-theme="light"] das Basis-Token umdefiniert, folgt der Alias   <- Kommentar, aktuell der letzte Treffer
  128: --surface: var(--bg-card);

**Warum es zaehlt:** Der Patch hat inhaltlich recht (Überschreibung muss nach dem Alias stehen), aber der Test kodiert die alte, jetzt zu grobe Invariante als reine Textposition. Er fällt, ohne dass ein Fehler vorliegt. Wird er im Rotlauf "repariert", indem man die Zeile streicht, geht die Aussage "Alias folgt dem Theme" ersatzlos verloren — genau die Regel, die F-01 überhaupt erst gerettet hat. Der Test braucht eine Nachfolgeform (z. B.: der Aliasblock steht nach den vier PALETTEN-Blöcken), und das gehört in denselben Commit.

**Bezug:** N-02

### [hoch] §8 bricht die Dubletten-Ratsche (DUBLETTEN_MAX = 0): ein identischer globaler reduced-motion-Block existiert bereits in dmscreen.css

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/assets/styles/dmscreen.css:1408

**Beleg:** Der Bestand:
  $ grep -rn -A6 "prefers-reduced-motion" assets/styles/
  assets/styles/dmscreen.css:1408:        @media (prefers-reduced-motion: reduce) {
  assets/styles/dmscreen.css-1409-            *, *::before, *::after {
  assets/styles/dmscreen.css-1410-                animation-duration: 0.01ms !important;
  assets/styles/dmscreen.css-1411-                animation-iteration-count: 1 !important;
  assets/styles/dmscreen.css-1412-                transition-duration: 0.01ms !important;

Er steht auf Top-Level, nicht verschachtelt (Klammertiefe vor Zeile 1408 gemessen: depth: 0), gilt also global — nicht nur im DM Screen.

Dubletten-Ratsche mit der exakten bloecke()-Funktion aus dem Testnetz nachgefahren:
  $ node scratchpad/dub.js
  IST  — echte Dubletten: 0 (Ratsche DUBLETTEN_MAX = 0)
  NACH Paragraph 8 — echte Dubletten: 1
     2x  @media (prefers-reduced-motion: reduce)||*, *::before, *::after

**Warum es zaehlt:** Zwei Punkte in einem. Erstens fällt die Dubletten-Ratsche, die auf 0 steht und laut Kommentar "nur SINKEN" darf. Zweitens ist die Befundlage von N-08 dadurch schief: die genannten "4 prefers-reduced-motion"-Regeln sind nicht vier Einzelfälle, einer davon ist bereits der globale Block, den §8 anzulegen vorschlägt. Der richtige Eingriff ist Verschieben und Ergänzen (Block aus dmscreen.css nach core.css, `scroll-behavior` und die Würfel-Ausnahme dazu), nicht Anlegen — sonst stehen zwei Blöcke mit unterschiedlichem Inhalt an zwei Orten.

**Bezug:** N-08

### [mittel] §8: die vorgeschlagene !important-Obergrenze 109 ist um eins zu niedrig — gemessen sind es 110

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/tests/unit/design-consistency.test.js:898

**Beleg:** PATCHES.md §8: "Die !important hier sind gewollt und schlagen die Ratsche aus F-18 um 4 — die Obergrenze in design-consistency.test.js entsprechend von 105 auf 109 anheben". CHECKLISTE.md wiederholt "von 105 auf 109".

Der Patch-Block enthält aber FÜNF: vier im `*, *::before, *::after`-Block (animation-duration, animation-iteration-count, transition-duration, scroll-behavior) und ein fünftes in der Würfel-Ausnahme (.dice-result, .dice-crit-glow { animation-duration: 150ms !important; }).

Gemessen:
  IST:      !important IST: 105   (IMPORTANT_MAX = 105 — die Ratsche sitzt exakt auf dem Ist-Wert)
  NACH §8:  !important: 110  Ratsche 105, Vorschlag 109

**Warum es zaehlt:** Die Ratsche steht punktgenau auf 105; jedes zusätzliche !important macht sie rot. Wer die Anweisung wörtlich befolgt und auf 109 hebt, hat danach immer noch einen roten Test und sucht die Ursache im CSS statt in der Anleitung. Nebenbei: `scroll-behavior: auto !important` in einem `*`-Block ist ohnehin fragwürdig (scroll-behavior wird nicht vererbt und gehört auf html) — streicht man es, kommt man auf 109 und die Anleitung stimmt wieder.

**Bezug:** N-08

### [mittel] Die vorgeschlagene Ratsche §T-4 "der globale reduced-motion-Block existiert" ist heute schon grün — sie bewacht nichts

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/CHECKLISTE.md

**Beleg:** Der in CHECKLISTE.md §T-4 vorgeschlagene Test, wörtlich gegen den UNVERÄNDERTEN Quellbaum ausgeführt:
  $ node -e "const m=cssCode.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\*,\s*\*::before[^}]*\}/); ..."
  T-4 Match gefunden (ohne jeden Patch)? true
    animation-duration 0.01ms? true
    transition-duration 0.01ms? true

Grund: `[\s\S]*?` ist ungierig, startet am ERSTEN reduced-motion-Block (command-palette.css, readdir-Reihenfolge: bestiary, command-palette, core, dashboard, dice, dmscreen, ...) und läuft über Dateigrenzen hinweg bis zum `*, *::before` in dmscreen.css.

**Warum es zaehlt:** Ein Test, der vor dem Patch grün ist, belegt nach dem Patch nichts. Er würde auch grün bleiben, wenn jemand den Block später wieder auf Einzelfälle zurückbaut, solange irgendwo im 27k-Zeilen-Bestand noch ein `*, *::before` in einem reduced-motion-Kontext steht. Der Regex muss den Block als Einheit fassen (pro Datei prüfen oder auf `@media[^{]*reduce[^{]*\{\s*\*,` verankern), sonst ist Welle 6 nur scheinbar abgesichert.

**Bezug:** N-08

### [hoch] N-09/CHECKLISTE: die Umbenennung .filter-bar -> .filter-chips hängt drei Filterleisten an eine Klasse, die im CSS gar nicht existiert

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/assets/templates/view-resources.html:176

**Beleg:** BEFUNDE-v2 N-09: "Nebenbei heißt die Filterleiste dort `.filter-bar`, überall sonst `.filter-chips`." CHECKLISTE: "`.filter-bar` in `view-resources.html` heißt `.filter-chips`".

Gemessen:
  $ grep -rn "filter-chips\|filter-bar" assets/styles/
  assets/styles/core.css:1965:        .filter-bar {
  assets/styles/core.css:1971:        .spell-filter-bar {
  assets/styles/core.css:2322:        .loc-filter-chips {
  assets/styles/encounters.css:1440:.enc-filter-chips {
  assets/styles/loot.css:1003:.loot-view .loot-filter-chips {
  assets/styles/npcs.css:98:.npc-filter-chips {
  assets/styles/npcs.css:609:.loot-filter-chips {
  assets/styles/npcs.css:1056:        .location-filter-bar {

Eine blanke Klasse `.filter-chips` gibt es NICHT — nur view-präfigierte Varianten (.loc-, .enc-, .loot-, .npc-). `.filter-bar` dagegen ist definiert und trägt echtes Layout:
  $ sed -n '1960,1970p' assets/styles/core.css
  .filter-bar {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
  }

Betroffen sind view-resources.html:176, :180, :184 (spell-filters, spell-level-filters, spell-school-filters).

**Warum es zaehlt:** Nach der Umbenennung verlieren die drei Zauber-Filterreihen display:flex, gap und flex-wrap; die per JS erzeugten Chips fallen auf Block-Fluss zurück und stapeln sich untereinander. Genau die lautlose Fehlerklasse, für die Welle 1 das F-13-Netz gebaut hat ("eine benutzte, aber nicht definierte Klasse fällt still auf die Basis-Optik zurück") — nur prüft F-13 ausschließlich `btn-*`-Klassen (Zeile 133: `/^btn-[a-z][\w-]*$/`), fängt das hier also nicht. Die Vereinheitlichung müsste zuerst eine geteilte `.filter-chips`-Basisregel anlegen.

**Bezug:** N-09

### [mittel] §3b deckt nur 5 von 42 Farb-Tripeln ab: 133 rgba-Vorkommen bleiben stehen, die eigene Abnahme ("# leer") ist damit unerreichbar

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md

**Beleg:** PATCHES.md §3b listet fünf Ersetzungsregeln (212,175,55 / 251,191,36 / 239,68,68 / 74,222,128 / 96,165,250), §3a die Weiß-Auflagen (255,255,255), §4 die Schatten (0,0,0). N-01 schließt: "Danach bleibt in rgba() kein Zahlentripel mehr übrig außer denen in variables.css." CHECKLISTE fordert `grep -rn "rgba([[:space:]]*[0-9]" assets/styles/ | grep -v variables.css   # leer`, T-2 `expect(treffer).toEqual([])`.

Gemessen im selben Prüfumfang wie T-2 (ohne variables.css und fonts.css):
  $ node -e "..."
  T-2 Ausgangswert (rgba/rgb mit Zahl) im Komponenten-CSS: 390
  NICHT von PATCHES 3a/3b/4 abgedeckt: 133 Vorkommen in 42 Kanal-Tripeln
    rgba(126,196,207)  12x
    rgba(251,146,60)   12x
    rgba(220,38,38)    11x
    rgba(34,197,94)    10x
    rgba(255,215,0)     9x
    rgba(167,139,250)   8x
    rgba(168,85,247)    8x
    rgba(244,114,182)   5x
    rgba(147,51,234)    4x
    ... 33 weitere

**Warum es zaehlt:** Die Gesamtzahl 390 stimmt, aber die Restmenge ist nicht "mechanisch" erledigt: 133 Vorkommen sind Töne, die gar nicht in der Vier-Themen-Palette stehen (u. a. rgba(255,215,0) = das Contrast-Gold #ffd700, rgba(220,38,38) und rgba(34,197,94) = zwei ZWEITE Rots/Grüns neben --red/--green). Für die braucht es je eine Entscheidung — auf ein bestehendes Token abbilden oder als eigenes Token aufnehmen —, keine Suchen-Ersetzen-Zeile. Wer §3b abarbeitet und dann die Abnahme laufen lässt, steht vor 133 Treffern ohne Anleitung und wird die Ratsche vermutlich aufweichen.

**Bezug:** N-01

### [mittel] §5a: die Voraussetzung "html { font-size } bzw. body" ist als body unmöglich — und als html ein stiller 16px->14px-Schrumpf über 784 em-Deklarationen

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/assets/styles/variables.css:361

**Beleg:** PATCHES.md §5a: "Voraussetzung: `html { font-size: var(--font-size-base); }` bzw. `body` — die Profil-Tokens existieren schon". Anker laut Patch: `[data-layout="mobile"] body { font-size: var(--font-size-base); }`.

Gemessen — welche Regel setzt heute überhaupt font-size auf html oder body:
  $ node -e "...für jede Regel mit \\b(html|body)\\b, die font-size enthält..."
  variables.css:  [data-layout="mobile"] body -> font-size: var(--font-size-base)
  (kein einziger html-Treffer; keine Desktop-body-Regel)

  $ grep -rn "html\s*{\|html," assets/styles/*.css   -> keine Ausgabe

Werte: variables.css:335 `--font-size-base: 14px` (Desktop), :351 `16px` (Mobil). Das Attribut sitzt auf dem Wurzelelement:
  $ grep -rn "data-layout" --include=*.js ... | grep setAttribute
  ui/layout-profiles.js:10:    document.documentElement.setAttribute('data-layout', layout);

Umfang der betroffenen Kaskade:
  $ node -e "..." -> font-size-Deklarationen gesamt (ohne variables.css): 1088, davon mit em: 784

**Warum es zaehlt:** Zwei Dinge. (1) Die Alternative "bzw. body" funktioniert nicht: rem löst immer gegen das Wurzelelement auf, nie gegen body — mit der body-Variante wäre die ganze Skala eingefroren auf den Browser-Default und das Mobil-Profil ohne Wirkung. (2) Die html-Variante ist kein no-op: heute gibt es überhaupt keine html- oder Desktop-body-font-size, die em-Kette wurzelt also im Browser-Default (16px). `html { font-size: var(--font-size-base) }` setzt sie auf Desktop auf 14px und schrumpft damit in einem Schlag jede der 784 em-Deklarationen um 12,5 % — solange §5b nur teilweise umgestellt ist, also während der gesamten Welle 5. Der Patch verkauft das als Vorbedingung in einem Nebensatz; es ist der sichtbarste Einzeleffekt des ganzen Handoffs und gehört an den Anfang von §5, mit Sichtprüfung.

**Bezug:** N-04

### [mittel] N-09: die zwei Zähler zeigen NICHT dasselbe — setViewCount() kann die Filter-Rückmeldung "gefiltert/gesamt" gar nicht darstellen

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/features/spells/spell-manager.js:126

**Beleg:** BEFUNDE-v2 N-09: "Die einzige Ansicht mit zwei Zähl-Anzeigen für dieselbe Liste." CHECKLISTE: "`id=\"spell-count\"` ist entfernt oder läuft über `setViewCount('spells', n)`".

Was die beiden tatsächlich anzeigen:
  $ sed -n '126,132p' features/spells/spell-manager.js
      if (countEl) {
          if (spells.length === totalCount) {
              countEl.textContent = `📖 ${totalCount}`;
          } else {
              countEl.textContent = `📖 ${spells.length}/${totalCount}`;
          }
      }
  (countEl = $('spell-count'), Zeile 25 — der ZWEITE Zähler; zeigt gefiltert/gesamt)

  $ sed -n '524,538p' systems/spellslots/import-export.js
      spells: D.spells?.length || 0,
      ...
      setViewCount(view, count);
  (schreibt spells-count — der ERSTE Zähler; zeigt nur den Gesamtbestand)

Und die vorgeschlagene Zielfunktion kann das zweite Format nicht:
  $ grep -n -A4 "function setViewCount" render/helpers.js
  475:function setViewCount(view, n) {
  476-    const el = $(view + '-count');
  477-    if (el) el.textContent = String(n);

**Warum es zaehlt:** Beide angebotenen Wege löschen Information: Entfernen nimmt die Filter-Rückmeldung ganz weg, Umstellen auf setViewCount('spells', n) kann nur eine Zahl schreiben und würde außerdem in `spells-count` landen, also das Element, das schon den Gesamtbestand führt. Bei ~300 Zaubern ist "12/319" die einzige Anzeige, die dem DM sagt, wie scharf der aktive Filter greift. Der Inline-Stil und die verwaiste ID sind echte Befunde — die Fassung der Aufgabe als "Dublette" ist es nicht. Immerhin harmlos: `if (countEl)` (Zeile 126) fängt das fehlende Element ab, es gibt also keinen Absturz, nur den stillen Verlust.

**Bezug:** N-09

### [niedrig] §2b definiert --red-text nur im Sepia-Block, ohne Alias — weder das bestehende noch das vorgeschlagene Testnetz sieht das

**Ort:** D:/Claude_Code/Projekte/DnD_Tracker_App_Pro/Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md

**Beleg:** PATCHES.md §2a legt acht Aliase an: --gold-text, --green-text, --cyan-text, --yellow-text, --orange-text, --blue-text, --purple-text, --pink-text. §2b ergänzt im Sepia-Block zusätzlich `--red-text: #da2825;` — ein Name, für den §2a KEINEN Alias vorsieht.

Das bestehende F-01-Netz kann das nicht sehen, weil es Definitionen ohne Theme-Bezug einsammelt (Zeile 46):
    const defined = new Set(cssAll.match(/^\s*(--[\w-]+)\s*:/gm)...)
Eine Definition allein im Sepia-Block zählt dort als "definiert".

Der vorgeschlagene Test §T-1 sieht es ebenfalls nicht — seine Rollenliste lautet:
    const ROLLEN = ['gold', 'green', 'cyan', 'yellow', 'orange', 'blue', 'purple'];
weder 'red' noch 'pink'.

Gegenprobe, dass die Basis-Rollen selbst vollständig sind (also nicht der eigentliche Mangel):
  $ node scratchpad/check.js
  dark      fehlende Rollen im Theme-Block: (keine)
  light     fehlende Rollen im Theme-Block: (keine)
  sepia     fehlende Rollen im Theme-Block: (keine)
  contrast  fehlende Rollen im Theme-Block: (keine)

**Warum es zaehlt:** Wird `var(--red-text)` später irgendwo benutzt, ist es in drei von vier Themes unauflösbar und die Deklaration fällt am berechneten Wert aus — dieselbe lautlose Klasse, die F-01 in Welle 1 aufgeräumt hat. Kostet eine Zeile (`--red-text: var(--red);` in den Aliasblock) und eine Erweiterung der ROLLEN-Liste um 'red' und 'pink'.

**Bezug:** N-02

---

## Linse: Bedienbarkeit jenseits des Fokusrings

_Bedienbarkeit jenseits des Fokusrings — Tastatur-Erreichbarkeit, programmatische Benennung, Trefferflächen, Farbe als einziges Signal_

**Abdeckung:** GEPRÜFT (jede Zahl aus einem selbst ausgeführten Befehl gegen den lebenden Quellcode, nicht aus BEFUNDE-v2.md übernommen):
· Tastatur-Erreichbarkeit: Python-Tag-Scan über alle 12 `assets/templates/*.html` und alle `.js` unter features|systems|ui|render|core|utils nach `data-action` auf nicht nativ fokussierbaren Elementen; Gegenprobe per grep auf `tabindex` (2 Treffer im ganzen Baum) und `role=` (nur header.html).
· Tastatur-Brücke: `ui/event-delegation.js` vollständig gelesen (nur click/change/input); alle 12 `addEventListener('keydown')` aufgelistet und gegen `data-action`/`.click()`/`dispatchEvent` geprüft — keine Enter/Leertaste-Übersetzung.
· Versteckte Eingaben: CSS-Regelscan aller 20 Dateien in `assets/styles/` nach `display:none|visibility:hidden|opacity:0` auf `input`; jede Trefferklasse gegen ihr Markup aufgelöst. `.io-file-input` bewusst NICHT gemeldet — dort löst eine echte Schaltfläche aus (z. B. view-party.html:38), das ist das korrekte Muster.
· Beschriftungen: Auszählung aller `<label>` (380) gegen `<label for=` (1) sowie Mustersuche „Beschriftung direkt vor Feld mit id, ohne for, ohne aria-label" (155).
· Trefferflächen: CSS-Regelscan nach festem `width` UND `height` < 24 px auf Bedienelement-Selektoren, danach Abstandsausnahme (WCAG 2.5.8) über die `gap`-Werte der Container einzeln nachgerechnet.
· Modale: Container-Auszählung, `role=dialog`/`aria-modal`-Suche, `showModal()`/`hideModal()` gelesen, Suche nach Fokusfallen-Code, Escape-Pfad gelesen, `display:none`-Zustand geschlossener Modale bestätigt.
· Farbe als einziges Signal: `aria-pressed` (1 Treffer projektweit), `.dmg-chip.active`, `.filter-chip.active`, `.qref-condition.danger` gegen ihre Grundregel gelesen.
· Überschneidungsprüfung: `tests/unit/design-consistency.test.js` (76 Tests) und `CHECKLISTE.md` nach tabindex/aria/role/label/Treffergröße durchsucht — kein Treffer, keiner der acht Befunde ist bereits abgesichert oder vorgeschlagen. `.mobile-nav-toggle` und die Zauberplatz-Pips wurden zusätzlich gegen `dist/dnd-tracker-bundled.html` gegengeprüft.
· Entlastend geprüft und NICHT gemeldet: die Bestiar-Filter (view-bestiary.html) sind inzwischen echte `<button>`/`<input>` — der Befund der Vorrunde ist dort behoben und hat sich nicht wiederholt; die NPC-Beziehungsleiste (features/npcs/npc-render.js:487-489) trägt neben dem Farbbalken eine Textmarke (`status.label`), Farbe ist dort also nicht das einzige Signal; die Sprachauswahl-Listen (`.cf-lang-item`, `.enc-lang-item`) haben sichtbare Kontrollkästchen; in den Templates gibt es keine Schaltfläche ohne zugänglichen Namen (0 Treffer).

NICHT AUSGESCHLOSSEN (ehrliche Grenzen):
· Keine Laufzeitmessung. Kein Browser, kein axe/Lighthouse-Lauf, keine echte Tabulator-Reise. Alle Aussagen sind statisch aus Quelltext und CSS abgeleitet; berechnete Werte (`getComputedStyle`) wurden nicht gemessen.
· Trefferflächen: gezählt wurden ausschließlich Regeln mit FESTEM `width`/`height`. Bedienelemente, deren Größe nur aus `padding` + `font-size`/`line-height` entsteht — das ist die Mehrheit —, sind in den 14 Treffern NICHT enthalten. Die tatsächliche Zahl zu kleiner Ziele liegt sehr wahrscheinlich höher; ebenso ungeprüft ist, ob Medienabfragen im Mobil-Profil einzelne Ziele vergrößern.
· Farbe als einziges Signal wurde STICHPROBENARTIG geprüft (Schadenstypen, Filter-Chips, gefährliche Zustände, NPC-Beziehungen, HP-Status). Eine erschöpfende Aufzählung aller Zustands-Klassen über 27k Zeilen CSS habe ich nicht durchgeführt; weitere Fälle sind wahrscheinlich.
· Die 176 unerreichbaren Elemente sind eine Auszählung von Fundstellen im Quelltext, nicht von Instanzen zur Laufzeit: in Schleifen erzeugtes Markup (Listenzeilen, Karten) multipliziert sich pro Datensatz, eine tote Codeverzweigung dagegen erscheint nie. Ich habe die Erreichbarkeit des Codepfads nur für die im Bericht namentlich zitierten Fälle nachgewiesen (u. a. `renderCompactSpellSlots` über party-render.js:159/241), nicht für alle 176.
· Tabulator-REIHENFOLGE (DOM-Ordnung vs. visuelle Ordnung) und das Verhalten des virtuellen Scrollens (`ui/virtual-scroll.js`) beim Fokussieren ausgelagerter Zeilen sind ungeprüft.
· Die E2E-Suite wurde nicht ausgeführt; ob eine der acht Aussagen einen bestehenden Playwright-Test bricht, ist offen.
· Ausschließlich `assets/templates/` und der JS-Quellbaum wurden betrachtet. `index.html`, `sw.js` und die Handout-Ausgabe (`features/shops/shop-export.js`) wurden nicht auf dieselben Muster geprüft.

### [hoch] 176 interaktive Elemente sind für die Tastatur vollständig unerreichbar — `tabindex` existiert im gesamten Quellbaum genau 2×

**Ort:** ui/event-delegation.js:37-44 · assets/templates/modals-editors.html:197-514 · assets/templates/view-tools.html:117-126 · features/party/party-details.js:183

**Beleg:** Zählung nicht-fokussierbarer Elemente (div/span/li/td/p) mit `data-action`, ohne `tabindex`, ohne natives Fokusverhalten, Backdrop-Wrapper ausgenommen:
  Templates: 54 · JS-erzeugt: 122 · SUMME 176
(Python-Scan über assets/templates/*.html und features|systems|ui|render|core|utils/**/*.js, Tag-Regex mit DOTALL.)

Gegenprobe Tastatur-Ersatz:
  $ grep -rn "tabindex" features/ systems/ ui/ render/ core/ utils/ --include=*.js assets/templates/*.html
  systems/migration/migration-wizard.js:288 role="button" tabindex="0"
  systems/migration/migration-wizard.js:324 role="button" tabindex="0"
  → 2 Treffer im GESAMTEN Quellbaum, beide in einer Datei. Templates: 0.
  $ grep -c 'role=' assets/templates/*.html → nur header.html:33, alle übrigen 11 Dateien: 0.

Keine Tastatur-Brücke vorhanden: EventDelegation.init() (ui/event-delegation.js:37-44) registriert ausschließlich 'click', 'change', 'input'. Keiner der 12 `addEventListener('keydown')` im Baum übersetzt Enter/Leertaste auf `[data-action]` (geprüft per grep auf keydown ∩ (data-action|.click()|dispatchEvent) → 0 Treffer).

Belegfälle (Quelltext zitiert):
  assets/templates/view-tools.html:117  <span class="dmg-chip" data-action="toggle-damage-type" data-type="Wucht">🔨</span>
  assets/templates/modals-editors.html:197  <div class="qref-section-header" data-action="toggle-qref-section">   (16×)
  assets/templates/modals-editors.html:203  <span class="qref-condition" data-action="show-condition-detail">…   (12×)
  assets/templates/modals-editors.html:335  <span class="qref-dice-btn" data-action="roll-qref-dice" data-dice="1d6">3m</span>   (7×)
  assets/templates/view-party.html:44  <div class="collapsible-header" data-action="toggle-collapse" data-value="char-form">
  features/party/party-details.js:183  <div class="char-save-box … char-roll-btn" data-action="roll-char-save-stop">
Häufigste Aktionen im JS-Teil: show-view 11×, navigate-entity-stop 10×, select-wiki-entry 6×, bestiary-roll-dice 3×.

**Warum es zaehlt:** N-05 behandelt nur, ob ein fokussiertes Element sichtbar ist. Diese 176 Elemente können gar nicht erst fokussiert werden — der Ring aus N-05 würde sie nie erreichen. Betroffen sind ganze Funktionsbereiche: die komplette Schnell-Referenz (16 Abschnittsköpfe, 12 Zustände, 7 Würfelknöpfe), alle 10 Schadenstyp-Chips, das Auf- und Zuklappen der Eingabeformulare (Charakter, Encounter, Sitzung) und die Rettungswurf-Kästen. Der Fix für N-05 ist wirkungslos, solange diese Elemente kein `tabindex`/`role`/Tastenbehandlung bekommen — und `PATCHES.md` §7 fügt nur eine Fokusring-Regel hinzu. Die zwei sauber gemachten Ablegeflächen im Migrations-Assistenten zeigen, dass das Muster im Projekt bekannt ist; es wurde nur genau zweimal angewandt.

**Bezug:** neu (grenzt an N-05 an, ist aber die vorgelagerte Stufe: N-05 = Ring unsichtbar, hier = Element nicht fokussierbar)

### [hoch] Mobil-Layout: Navigation per Tastatur nicht zu öffnen, und die Reiter darin sind fokussierbar, obwohl sie unter dem Bildschirmrand liegen

**Ort:** assets/templates/header.html:42 · assets/styles/variables.css:366-384 · utils/performance-extras.js:34

**Beleg:** $ sed -n '40,48p' assets/templates/header.html
  <div class="mobile-nav-toggle" data-action="call" data-value="toggleMobileNav">
      <span class="mobile-nav-toggle-text">📍 Navigation</span>
      <span class="mobile-nav-toggle-icon">▲</span>
  </div>
→ reines <div>, kein tabindex, kein role, kein fokussierbares Kind. Der einzige Umschalter der Navigation im Mobil-Profil.

$ sed -n '366,384p' assets/styles/variables.css
  [data-layout="mobile"] .app-header {
      position: fixed;
      bottom: 0;
      …
      transform: translateY(calc(100% - 56px));
  }
  [data-layout="mobile"] .app-header.nav-open { transform: translateY(0); }

$ grep -rn -A8 '\[data-layout="mobile"\] .nav-tabs' assets/styles/variables.css
  [data-layout="mobile"] .nav-tabs { display: grid; … max-height: 300px; overflow-y: auto; }
→ kein display:none, kein visibility:hidden. Die ~24 <button class="nav-tab"> (header.html:47-100) bleiben also im Tabulator-Verlauf.

$ grep -rn -A6 "function toggleMobileNav" utils/performance-extras.js
  header.classList.toggle('nav-open');   ← der einzige Weg, den Kopfbereich hereinzuschieben

**Warum es zaehlt:** Im Mobil-Profil (Tablet am Spieltisch, angeschlossene Tastatur) ist die Hauptnavigation weder zu öffnen noch zu sehen: der Umschalter nimmt keinen Fokus an, und die Tabulator-Reise führt danach in ~24 Schaltflächen, die per `position: fixed` + `translateY(100% − 56px)` unter dem Sichtfenster liegen — kein Scrollen kann sie hereinholen, weil das Element fixiert ist. Zusammen mit N-05 (die `.nav-tab` hat laut Befund keinen Ring) verschwindet der Fokus vollständig aus dem Sichtfeld. N-05 nennt `.nav-tab` nur als Element ohne Fokusring; dass der Fokus dort im Mobil-Profil ins Nichts wandert und der Öffner unbedienbar ist, steht in keinem der neun Befunde.

**Bezug:** neu (berührt N-05 nur am Rand)

### [hoch] 58 Chip-Bedienelemente verstecken ihre Eingabe per `display: none` — dadurch aus dem Tabulator-Verlauf entfernt, der sichtbare Ersatz hat kein tabindex

**Ort:** assets/styles/dashboard.css:1639 · assets/styles/loot.css:210 · assets/styles/encounters.css:1271 · assets/templates/view-encounters.html:247-294 · assets/templates/modals-entity.html:217-235

**Beleg:** CSS-Scan (Regel `.<klasse> input … { … display:none … }`) über assets/styles/*.css ergibt die Klassen:
  calc-lair-toggle, char-inspiration-box, char-resistance-chip, char-save-box, loot-attunement-toggle, loot-tag-chip

$ sed -n '1639,1641p' assets/styles/dashboard.css
  .char-resistance-chip input { display: none; }
$ sed -n '210,212p' assets/styles/loot.css
  .loot-tag-chip input { display: none; }
$ sed -n '1271,1273p' assets/styles/encounters.css
  .calc-lair-toggle input { display: none; }

Markup (die Beschriftung ist das sichtbare Bedienelement, ohne tabindex):
  assets/templates/view-encounters.html:247
    <label class="char-resistance-chip" data-action="toggle-selected"><input type="checkbox" value="Feuer">🔥 Feuer</label>
  assets/templates/modals-entity.html:217
    <label class="loot-tag-chip" data-category="type"><input type="checkbox" value="weapon"><span>⚔️ Waffe</span></label>
  features/encounter-calculator.js:1147
    <label class="calc-lair-toggle"><input type="checkbox" id="calc-lair-actions" data-action="calc-toggle-lair"><span class="calc-lair-slider"></span>…

Auszählung:
  $ grep -cE '<label class="char-resistance-chip"[^>]*><input type="checkbox"' assets/templates/view-encounters.html  → 38
  $ grep -cE '<label class="loot-tag-chip"[^>]*><input type="checkbox"' assets/templates/modals-entity.html          → 19
  + 1 (calc-lair-toggle)  = 58 Bedienelemente

Gegenprobe, dass es auch anders geht: `.enc-lang-item input[type="checkbox"] { width:16px; height:16px }` (assets/styles/encounters.css:1953) — dort ist die Eingabe sichtbar und erreichbar.

**Warum es zaehlt:** `display: none` entfernt ein Formularfeld aus dem Tabulator-Verlauf und aus dem Barrierefreiheits-Baum. Weil die umschließende `<label>` weder `tabindex` noch `role` trägt, sind Resistenzen und Immunitäten beim Encounter (38 Chips), sämtliche Beutestück-Kategorien (19 Chips) und der Lair-Actions-Schalter des Encounter-Rechners per Tastatur überhaupt nicht setzbar — und für eine Vorlesehilfe unsichtbar. Das ist kein Fokusring-Problem (N-05), sondern ein Erreichbarkeits-Problem, und keiner der neun Befunde nennt es. Der übliche Fix (`.sr-only`/`opacity:0` statt `display:none`, plus `:focus-visible`-Regel auf dem Chip) berührt genau die Dateien, die PATCHES.md §7 ohnehin anfasst.

**Bezug:** neu

### [mittel] 155 Formularfelder haben eine Beschriftung, die nicht mit ihnen verknüpft ist — genau 1 von 380 `<label>` trägt `for=`

**Ort:** assets/templates/modals-entity.html (46 Fälle) · view-bestiary.html (26) · modals-shops.html (22) · view-encounters.html (17) · modals-tools.html (14) · view-party.html (11) · view-resources.html (9) · modals-editors.html (6) · view-tools.html (4)

**Beleg:** $ grep -o '<label' assets/templates/*.html | wc -l              → 380
$ grep -c '<label[^>]*for=' assets/templates/*.html
  modals-entity.html:1 — alle übrigen 11 Dateien: 0

Python-Scan nach dem Muster «<label ohne for>…</label> direkt gefolgt von input|select|textarea mit id und ohne aria-label»:
  155 Treffer, Verteilung wie oben.

Belegfall, Quelltext zitiert (assets/templates/modals-entity.html:57):
  <div class="form-group"><label>Name *</label><input type="text" id="npc-name"></div>
Die Beschriftung ist ein Geschwisterelement — weder `for="npc-name"` noch umschließend. Weitere: #loc-name (34), #npc-role (58), #loot-qty (175), #relationship-target (modals-editors.html:680).

Gesamtbild aller Formularfelder in den Templates (ohne type=hidden):
  518 Felder · 516 ohne <label for> und ohne aria-label
  davon 334 auch ohne placeholder und ohne title → gar keine zugängliche Bezeichnung

Gegenprobe: im JS existieren 10 `<label … for=`; die Templates sind der Ausreißer.

**Warum es zaehlt:** Ohne `for`/Umschließung hat das Feld keinen zugänglichen Namen: eine Vorlesehilfe meldet „Textfeld, leer“, und der Klick auf die Beschriftung setzt den Fokus nicht ins Feld — letzteres trifft auch reine Maus- und Touch-Bedienung und vergrößert bei jedem dieser 155 Felder die Trefferfläche nicht, obwohl das Markup so aussieht, als täte es das. Der Fix ist rein mechanisch (`for` = vorhandene `id`, die überall schon da ist) und grep-prüfbar — genau das Format der Ratschen in CHECKLISTE.md. Keiner der neun Befunde erwähnt Beschriftungen; N-09 fasst view-resources.html an, ohne das dort zu bemerken.

**Bezug:** neu (N-09 arbeitet in derselben Datei, nennt es aber nicht)

### [mittel] Kampfkritische Bedienelemente unter 24×24 CSS-px bei 4 px Abstand — WCAG 2.2 AA (2.5.8) auch über die Abstandsausnahme nicht erfüllt

**Ort:** assets/styles/initiative.css:293-306 (Todesrettungswürfe) · initiative.css:1004-1012 (legendäre Aktionen) · initiative.css:1045-1053 + 1068 (legendärer Widerstand) · assets/styles/dashboard.css:3024 (qref-apply-btn) · assets/styles/core.css:1605 (spell-tooltip-close)

**Beleg:** CSS-Scan über assets/styles/*.css nach Regeln mit festem width UND height < 24px, deren Selektor btn|chip|tab|toggle|dot|close|icon enthält → 14 Treffer. Davon nachweislich interaktiv (data-action bzw. <button>):
  .death-save-dot   16×16px  initiative.css:298   ← features/initiative-combat-widgets.js:133/150, data-action="toggle-death-save-stop"
  .la-dot           16×16px  initiative.css:1009  ← initiative-combat-widgets.js:215, data-action="init-use-la-stop"
  .lr-dot           16×16px  initiative.css:1051  ← initiative-combat-widgets.js:237, data-action="init-use-lr-stop"
  .qref-apply-btn   16×16px  dashboard.css:3024   ← <button> in modals-editors.html:203-214 (12×)
  .lr-reset-btn     20×20px  initiative.css:1068
  .spell-tooltip-close 20×20px core.css:1605

Abstandsausnahme geprüft:
  $ sed -n '293,296p' assets/styles/initiative.css   → .death-saves-dots { display:flex; gap: 4px; }
  $ sed -n '1004,1007p' assets/styles/initiative.css → .la-dots { display:flex; gap: 4px; }
  $ sed -n '1045,1048p' assets/styles/initiative.css → .lr-dots { display:flex; gap: 4px; }
→ Mittenabstand 16 + 4 = 20 px < 24 px. Die Ausnahme „unterdimensioniert, aber ausreichend beabstandet“ greift damit nicht.

Zusätzlich: .la-dot und .lr-dot sind LEERE <span> (kein Textinhalt) — ein Scan nach `<span …></span>` mit data-action und ohne aria-label findet genau 4 Stellen: initiative-combat-widgets.js:215, :237, party/party-render.js:330, spellslots/spellslots-ui.js:81. Alle vier tragen weder tabindex noch role.

**Warum es zaehlt:** Das sind die Elemente, die mitten im Kampf unter Zeitdruck getroffen werden müssen: drei Erfolge und drei Fehlschläge des Todesrettungswurfs, die Pips für legendäre Aktionen und legendären Widerstand. 16 px mit 4 px Lücke heißt: ein Fehlgriff schreibt einen Fehlschlag statt eines Erfolgs — und weil die Elemente leere <span> ohne tabindex sind, gibt es keinen Tastaturweg als Rückfallebene und keine Rückmeldung an eine Vorlesehilfe. Der Bericht misst Schriftgrößen (N-04) und Bewegung (N-08), aber keine Trefferflächen; die Zahlen sind identisch grep-/scan-prüfbar und passen in dieselbe Ratsche.

**Bezug:** neu (methodisch die Ergänzung zu N-04: dort Schriftmaße, hier Trefferflächen)

### [mittel] Die kompakte Zauberplatz-Anzeige der Charakterkarte hat KEINE einzige CSS-Regel — leere <span>, unsichtbar und auch mit der Maus nicht klickbar

**Ort:** features/party/party-render.js:308-340 (erzeugt) · assets/styles/*.css (nicht vorhanden)

**Beleg:** $ grep -rn 'char-slot-pip' --include=*.css --include=*.js --include=*.html . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage
  ./features/party/party-render.js:330
→ genau EIN Treffer im ganzen Projekt, und der ist die Erzeugung, nicht eine Regel.

$ grep -rn 'char-slot-group|char-slot-label|char-card-slots' --include=*.css . --exclude-dir=node_modules --exclude-dir=dist
  (leer)

Gegenprobe im gebauten Bündel (CSS und JS in EINER Datei):
  $ grep -an 'char-card-slots' dist/dnd-tracker-bundled.html
    44617:    let html = '<div class="char-card-slots">';
  $ grep -an 'char-slot-pip' dist/dnd-tracker-bundled.html
    44627:                html += `<span class="char-slot-pip ${isAvailable ? 'available' : ''}"
→ je genau eine Fundstelle, beide im JS-Abschnitt. Kein Regelsatz.

Das erzeugte Markup (party-render.js:330-335) ist ein <span> OHNE Textinhalt:
  <span class="char-slot-pip …" data-action="toggle-spell-slot-stop" data-char=… data-level=… data-index=… title="Verfügbar"></span>
Der Codepfad ist aktiv: party-render.js:159 `const slotPips = renderCompactSpellSlots(ch);` und :241 `${slotPips}` im Rückgabewert der Charakterkarte.

Zum Vergleich existiert die Schwester-Klasse sehr wohl: `.slot-pip { width:18px; height:18px; … }` in dashboard.css:1320 (verwendet von systems/spellslots/spellslots-ui.js:81).

**Warum es zaehlt:** Ein <span> ohne Inhalt und ohne Regel ist ein Inline-Element der Breite 0 — die Anzeige ist unsichtbar, und `data-action="toggle-spell-slot-stop"` lässt sich weder anklicken noch antippen noch per Tastatur erreichen. Auf der Charakterkarte fehlt damit die Zauberplatz-Übersicht komplett, ohne dass irgendetwas eine Fehlermeldung erzeugt — genau die „lautlose“ Klasse Defekt, die BEFUNDE-v2.md in der Einleitung für sich reklamiert, hier aber nicht gefunden hat. Der Bericht zählt 66 Schattenwerte (N-03) und 55 Schriftgrößen (N-04); eine Komponente mit null Regeln ist ihm entgangen.

**Bezug:** neu

### [mittel] Zustand nur über Farbe, ohne ARIA-Zustand — und 10 Chips, deren einziger Inhalt ein Emoji ist

**Ort:** assets/templates/view-tools.html:117-126 · assets/styles/dice.css:228-250 · assets/styles/core.css:2147 · assets/styles/dashboard.css:2998-3022 · assets/templates/modals-editors.html:209/213/214

**Beleg:** $ grep -rn 'aria-pressed' --include=*.js --include=*.html . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage
  ./features/soundboard/soundboard-render.js:110
→ EIN Treffer im gesamten Projekt.

Fall A — Schadenstyp-Chips (assets/templates/view-tools.html:117-126, 10 Stück):
  <span class="dmg-chip" data-action="toggle-damage-type" data-type="Wucht">🔨</span>
  <span class="dmg-chip" data-action="toggle-damage-type" data-type="Stich">🗡️</span>
  <span class="dmg-chip" data-action="toggle-damage-type" data-type="Hieb">⚔️</span>
Kein title, kein aria-label; der Typ steht ausschließlich in `data-type`.
  $ sed -n '247,250p' assets/styles/dice.css
    .dmg-chip.active { background: var(--gold); border-color: var(--gold); }
→ der gewählte Zustand ändert Hintergrund und Rahmen, sonst nichts.

Fall B — Filter-Chips:
  $ sed -n '2147p' assets/styles/core.css
    .filter-chip.active { background: var(--gold); color: var(--bg-dark); border-color: var(--gold); }
→ ebenfalls rein farblich, ohne aria-pressed/aria-selected.

Fall C — gefährliche Zustände in der Schnell-Referenz:
  $ grep -n -A14 '^\.qref-condition {' assets/styles/dashboard.css   (Zeilen 2998-3009: background/border/padding/font-size)
  $ sed -n '3020,3023p' assets/styles/dashboard.css
    .qref-condition.danger { border-color: var(--red); color: var(--red); }
→ Gelähmt (modals-editors.html:209), Betäubt (:213) und Bewusstlos (:214) unterscheiden sich von den übrigen zehn Zuständen ausschließlich durch Rot.

**Warum es zaehlt:** N-02 misst, ob eine Farbe genügend Kontrast zum Hintergrund hat; hier trägt die Farbe dagegen die einzige Bedeutung. Ein Chip, dessen Auswahl nur an einem Goldton hängt, ist bei Rot-Grün-Schwäche oder in der Sepia-Variante (deren Gold laut N-02 dunkelbraun ist) nicht als „gewählt“ zu erkennen — und für eine Vorlesehilfe existiert der Zustand nicht, weil `aria-pressed` genau einmal im Projekt vorkommt. Verschärfend bei den Schadenstypen: 🔨/🗡️/⚔️ werden als „Hammer/Dolch/gekreuzte Schwerter“ vorgelesen, die deutschen Fachbegriffe Wucht/Stich/Hieb kommen im zugänglichen Namen nicht vor. Das ist eine andere Achse als N-02 und wird von keinem der neun Befunde berührt.

**Bezug:** neu (Nachbar von N-02, aber andere Achse: dort Kontrast, hier Farbe als alleiniger Bedeutungsträger)

### [niedrig] 35 von 36 Modalen ohne `role="dialog"`; `showModal()` setzt nur eine Klasse — kein Fokus ins Modal, keine Fokusfalle, keine Fokus-Rückgabe

**Ort:** systems/spellslots/navigation.js:78-95 · assets/templates/modals-*.html · assets/templates/view-bestiary.html

**Beleg:** $ grep -c 'class="modal-overlay"' assets/templates/*.html
  modals-editors.html:6 · modals-entity.html:11 · modals-shops.html:5 · modals-tools.html:12 · view-bestiary.html:1  → 35
  + 1 `class="modal-backdrop"` (modals-tools.html:194) = 36

$ grep -rn 'aria-modal|role="dialog"' --include=*.js --include=*.html . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage
  ./features/command-palette/command-palette.js:21   overlay.setAttribute('aria-modal', 'true');
  ./features/session-prep/session-prep-render.js:160 role="dialog" aria-modal="true" aria-labelledby="prep-modal-title"
→ in den Templates: 0 Treffer.

$ sed -n '78,95p' systems/spellslots/navigation.js
  function showModal(id) {
      const modal = $(id);
      if (modal) modal.classList.add('show');
      … (populateSelects / renderPresetList / populateQuestSelects)
  }
  function hideModal(id) { … modal.classList.remove('show'); }
→ kein .focus(), kein Merken des vorher fokussierten Elements.

$ grep -rn "focusTrap|trapFocus|_lastFocus|previouslyFocused|activeElement" --include=*.js features/ systems/ ui/ core/ utils/
  nur 3 Treffer, alle im Editor-/Kurzbefehl-Kontext, keiner zur Modal-Fokusverwaltung.

Entlastend geprüft und in Ordnung: `.modal-overlay { display: none }` (dashboard.css / dmscreen.css:1072) — geschlossene Modale sind korrekt aus dem Tabulator-Verlauf entfernt; und Escape schließt das offene Modal (systems/spellslots/keyboard-shortcuts.js:59-63).

**Warum es zaehlt:** Beim Öffnen eines Modals bleibt der Fokus auf der auslösenden Schaltfläche hinter dem Overlay; die nächste Tabulator-Taste wandert durch die verdeckte Seite statt durch den Dialog, und beim Schließen ist die Fokusposition verloren. Weil ohne `role="dialog"`/`aria-modal` auch keine Vorlesehilfe den Kontextwechsel meldet, merkt eine Tastaturbedienung überhaupt nicht, dass ein Dialog offen ist. Zwei Modale machen es richtig — das Muster ist im Haus vorhanden, aber 35 Mal nicht angewandt. Niedrig eingestuft, weil Escape funktioniert und geschlossene Modale sauber ausgeblendet sind.

**Bezug:** neu

---

## Linse: Was-die-Zahlen-verbergen

_Was-die-Zahlen-verbergen — adversariale Statistik-Perspektive auf ein rein statisches Zähl-Audit_

**Abdeckung:** Gesucht wurde ausschließlich nach dem, was die neun Befunde NICHT nennen, durch die Linse „die Zählung führt in die Irre".

Was ich getan habe: (1) Einen eigenen Brace-Parser über alle 20 Dateien in assets/styles/ laufen lassen, der Selektor, Datei, Zeile, @-Kontext und Regelkörper erfasst (Kommentare durch Leerzeichen gleicher Länge ersetzt, damit Zeilennummern stimmen — mein erster Anlauf strippte Kommentare und lieferte falsche Zeilen; die Zeilennummern in diesem Bericht stammen deshalb durchweg aus direkten grep -n-Läufen). (2) Nutzungskorpus aus assets/templates/*.html, index.html und allen .js in features|ui|systems|render|core|utils gebildet, dynamisch zusammengesetzte Klassennamen (`prefix-${…}`, `'prefix-' +`) per Präfixerkennung ausgenommen — das rettete 140 Klassen vor einem Fehlalarm (z. B. condition-blinded aus systems/conditions.js:112). (3) Die Gegenrichtung geprüft: Klassen im Markup ohne jede CSS-Regel. (4) Alle 56 @-Blöcke auf Vollständig-Totsein geprüft. (5) Auf Verdeckungen geprüft: identische Selektoren mit widersprechenden Eigenschaften, doppelte Eigenschaften innerhalb eines Blocks, Kurzform-nach-Langform. (6) Das gebaute dist/dnd-tracker-bundled.html über einen lokalen HTTP-Server (Port 8731, danach beendet) im Browser geladen und gemessen: berechnete Stile, Reichweite jeder Regel per querySelectorAll, Fokussierbarkeit, Layout-Profil bei 500/700/800/1200 px, und ein Spezifitätsexperiment mit strukturgleichen Pseudoklassen.

Negative Ergebnisse, die ich ausdrücklich melde: Es gibt KEINE widersprüchlichen Media Queries (die Bruchpunkte 600/900/1200 überlappen sauber, dazu min-width 601/901/1201). Es gibt nur 2 Selektoren mit mehr als einem identischen Regelblock und darunter KEINEN mit widersprechenden Eigenschaften — F-18 hat hier sauber gearbeitet. KEIN Regelblock deklariert dieselbe Eigenschaft zweimal mit verschiedenen Werten. Genau EINE echte Kurzform-nach-Langform-Überschreibung (npcs.css:1441), und die ist folgenlos, weil der Wert identisch ist. Die Ratsche gegen undefinierte var(--x)-Tokens hält auch für Templates und JS: 0 Treffer.

Was ich NICHT ausschließen kann: (a) Meine Totmeldung beruht auf Textsuche. Eine Klasse, die ausschließlich aus einer Datendatei (Daten/), aus einer .md-Vorlage oder per mehrfacher String-Verkettung entsteht, würde ich fälschlich als tot führen — für die zwölf einzeln zitierten Stichproben habe ich das repoweit gegengeprüft (0 Treffer außerhalb assets/), für die restlichen 426 nicht. (b) Die Reichweiten-Messung im Browser lief auf dem frisch geladenen Grundgerüst ohne Kampagnendaten; JS-gerenderte Listen fehlen darin, also unterschätzt sie die Reichweite listenbezogener Regeln und ist NUR als Größenordnung zu lesen — die Totmeldungen selbst stützen sich nicht darauf, sondern auf die Quelltextsuche. (c) Eine frühe Laufzeitmessung, bei der ich data-theme im laufenden Dokument umgeschaltet habe, lieferte veraltete berechnete Werte (.nav-tab schien in allen vier Themes dunkel zu bleiben); nach einem echten Neuladen war der Wert korrekt. Ich habe diese Fehlmessung verworfen — sie steht in keinem Befund. Wer Theme-Aussagen nachmisst, muss neu laden, nicht das Attribut kippen. (d) Kontrastrechnungen aus N-02 habe ich bewusst nicht nachgerechnet, das liegt außerhalb dieser Linse. (e) Die vier Themes habe ich nur an .nav-tab, body und .app-header stichprobenartig live geprüft, nicht flächendeckend.

### [hoch] Tote Karten-Ansicht: 678 CSS-Zeilen in dashboard.css für ein Feature, das im Code nicht mehr existiert

**Ort:** assets/styles/dashboard.css:547-1224

**Beleg:** Selektoren zählen:
$ grep -c "^\s*\.map-\|\s\.map-" assets/styles/*.css | grep -v ':0'
assets/styles/dashboard.css:116

Nutzung im gesamten Repo (ohne node_modules/dist/coverage/.git/Anpassungen/assets):
$ for c in map-marker map-container map-viewport map-tab; do grep -rl "$c" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage --exclude-dir=.git --exclude-dir=Anpassungen --exclude-dir=assets; done
(leer — kein einziger Treffer)

$ grep -rn "map-" assets/templates/ index.html | grep -v "mindmap\|sitemap\|roadmap"
(leer)
$ find . -name "maps*.js" -not -path "./node_modules/*" -not -path "./dist/*"
(leer)   # kein Karten-Modul in loader.js

Kennzahlen des Blocks:
$ awk 'NR>=547 && NR<=1224' assets/styles/dashboard.css > /tmp/m2.css; wc -l < /tmp/m2.css
678
rgba: 13 · box-shadow: 7 · font-size mit em: 13 · transition:all: 1 · font-weight: 5

Der Block trägt die Überschrift "MAP INTEGRATION" (dashboard.css:544-546). Zusätzlich sind die drei .tooltip-link/-links/-timestamp-Regeln darin ebenfalls ohne jede Nutzung.

**Warum es zaehlt:** Das Audit zählt diesen Block vollständig mit: 13 der 390 rgba-Literale (N-01), 7 der 66 Schatten (N-03), 13 der ~1.000 em-Schriftgrößen (N-04). Wer die PATCHES abarbeitet, ersetzt hier 13 rgba() durch color-mix(), rundet 7 Schatten auf --elev-Stufen und tauscht 13 em gegen rem — an Regeln, die kein Browser je auswertet. 678 Zeilen sollten gelöscht statt migriert werden; das ist die billigste Maßnahme im ganzen Handoff und steht in keinem der neun Befunde.

**Bezug:** N-01, N-03, N-04, N-06 (neu)

### [hoch] DM-Screen-Referenzwidgets: CSS und JS-Markup sind zwei Generationen auseinander — die Widgets rendern ungestylt

**Ort:** assets/styles/dmscreen.css:2469-2510, 2832-2875

**Beleg:** CSS erwartet (dmscreen.css):
2832 .dms-terrain-sections / 2838 .dms-terrain-section / 2844 .dms-terrain-title / 2853-2855 .dms-terrain-title.normal|.difficult|.hazardous / 2863 .dms-terrain-examples / 2869 .dms-terrain-tag
2481 .dms-skill-group-header / 2490-2494 .dms-skill-group.str|.dex|.int|.wis|.cha .dms-skill-group-header { background: rgba(...) } / 2496 .dms-skill-list / 2503 .dms-skill-tag

JS erzeugt (features/dmscreen/dmscreen-widgets-combat.js:136-147, -widgets-reference.js:89-118):
.dms-terrain-list / .dms-terrain-item normal|difficult|hazard / .dms-terrain-type
.dms-skill-group / .dms-skill-header str|dex|int|wis|cha / .dms-skill-item

$ grep -rn "dms-terrain-title\|dms-skill-group-header" --include=*.js . --exclude-dir=node_modules --exclude-dir=dist
(leer)

Laufzeitmessung im gebauten Bundle (dist/dnd-tracker-bundled.html über lokalen HTTP-Server, renderDMSTerrainWidget()+renderDMSSkillsWidget() injiziert, getComputedStyle):
.dms-terrain-list  -> display:block (CSS will flex/column/gap:10px)
.dms-terrain-item  -> padding:0px, background:rgba(0,0,0,0), border-radius:0px
.dms-terrain-item.normal .dms-terrain-type -> color:rgb(224,224,224), font-weight:400, font-size:16px (CSS will grün/600/0.8em)
.dms-skill-header.str -> background:rgba(0,0,0,0), color:rgb(224,224,224), font-weight:400, padding:0px
.dms-skill-item -> background:rgba(0,0,0,0), padding:0px

Systematisch: 62 tote dms-*-Klassen im CSS, 15 dms-*-Klassen im JS-Markup ohne jede CSS-Regel (dms-terrain-list/-item/-type, dms-skill-header/-item/-widget, dms-ritual-list/-item, dms-know-skill/-types, dms-econ-icon/-val, dms-economy-header, dms-save-desc, dms-dc-mini).

**Warum es zaehlt:** Zwei sichtbar kaputte Widgets (Gelände, Fertigkeiten) plus mehrere teilkaputte — die Attributs-Farbkodierung der Fertigkeiten fehlt komplett. Für das Audit relevant: die fünf rgba()-Regeln in dmscreen.css:2490-2494 sind fünf der 390 gezählten Literale aus N-01; sie in color-mix() zu überführen ändert nichts, weil kein Element sie je trifft. Kein Befund N-01..N-09 nennt diese Drift.

**Bezug:** N-01 (neu)

### [hoch] 438 tote Klassen in 607 Regelblöcken (~3.174 Zeilen, 11,7 %) blähen jede Zählung des Audits auf

**Ort:** assets/styles/

**Beleg:** Eigenes Skript (Brace-Parser über assets/styles/*.css; Nutzungskorpus = assets/templates/*.html + index.html + features|ui|systems|render|core|utils/**/*.js; dynamisch gebaute Namen wie `condition-${c.type}` per Präfix-Erkennung ausgenommen — 140 Klassen wurden so als lebend erkannt):

Regeln gesamt: 4057 · CSS-Klassen gesamt: 2758
dynamisch erklärbar: 140 · TOT: 438
vollständig tote Regelblöcke: 607 (~3.174 Zeilen von 27.141 = 11,7 %)
  dashboard.css 158 Regeln ~758 Z. · dmscreen.css 146 ~751 · encounters.css 80 ~398
  npcs.css 73 ~440 · tools.css 55 ~298 · core.css 32 ~175 · party.css 29 ~143 · loot.css 18 ~119

Anteil der vom Audit gezählten Deklarationen, die IN toten Regeln liegen:
  rgba()          400 gesamt →  52 tot (13,0 %)
  font-size em    784 gesamt → 126 tot (16,1 %)
  box-shadow       88 gesamt →  14 tot (15,9 %)
  transition:all  163 gesamt →  13 tot ( 8,0 %)

Stichprobe, je einzeln gegengeprüft (CSS-Fundstelle vorhanden, Nutzung im gesamten Repo leer):
  .shadow-sm/.shadow-md/.shadow-lg  dmscreen.css:1427-1429
  .loc-io-btn core.css:2359 · .loc-toolbar-title core.css:2264 · .loc-search-clear core.css:2305
  .dashboard-card-title core.css:610 · .concentration-inline tools.css:1219
  .conc-picker-dropdown tools.css:1306 · .char-form-tab tools.css:1413
  .round-badge initiative.css:13 · .quick-panel party.css:451 · .npcg-field-label welt.css:334
  .bestiary-back-btn bestiary.css:383 · .fr-card-header welt.css:709
Zusätzlich zwei komplett tote @media-Blöcke: dashboard.css:1270 (@media min-width:601px, .spell-slots-grid) und loot.css:116 (@media max-width:900px, .loot-form-grid) — beide Selektoren existieren nirgends im Markup.

**Warum es zaehlt:** Das Audit ist reine Zählung ohne Lebendigkeitsprüfung. Rund ein Achtel des CSS ist tot, und in den drei Kategorien mit den größten Zahlen sitzen 8-16 % der Fundstellen dort. Die CHECKLISTE macht diese Zahlen zu Abnahmekriterien und Jest-Ratschen — die Arbeit wird also gegen Zielwerte gemessen, die zu einem Achtel aus Regeln bestehen, die man stattdessen ersatzlos löschen sollte. Eine Löschrunde VOR den Wellen 4-6 würde den Umfang jedes Patches messbar verkleinern.

**Bezug:** N-01, N-03, N-04, N-06, N-07 (neu)

### [hoch] Das Desktop-Token --font-size-base wird nie angewandt — die Begründung von N-04 und der rem-Vorschlag stehen auf falschem Fundament

**Ort:** assets/styles/core.css:284-290 und assets/styles/variables.css:329-353

**Beleg:** Quelle:
$ awk '/^\s*body\s*\{/,/\}/' assets/styles/core.css
        body { font-family: var(--font-ui); background: var(--bg-dark); color: var(--text); line-height: 1.5; min-height: 100vh; }
→ KEIN font-size.

$ grep -rn "var(--font-size-base)|var(--font-size-small)" assets/styles/*.css
variables.css:362  [data-layout="mobile"] body { font-size: var(--font-size-base); }
variables.css:470  [data-layout="mobile"] .btn { font-size: var(--font-size-small); }
variables.css:478  [data-layout="mobile"] .form-group input|select|textarea { font-size: var(--font-size-base); }
→ alle drei Leser stehen unter [data-layout="mobile"].

Kein html/:root setzt je eine font-size (Python-Scan über alle 20 Dateien nach Regeln, deren Selektor html oder :root enthält UND font-size deklariert: 0 Treffer). build.py:507-528 injiziert ebenfalls keine.

Laufzeit (dist/dnd-tracker-bundled.html, lokaler HTTP-Server, Frischladen je Breite):
  1400px: data-layout=desktop · --font-size-base=14px · html 16px · body 16px · .main-content 16px
   800px: data-layout=desktop · body 16px
   700px: data-layout=mobile  · body 16px
→ In BEIDEN Profilen rendert der Body mit 16px. Der Desktop-Wert 14px wird nirgends gelesen.

**Warum es zaehlt:** Zwei Konsequenzen. (a) N-04 begründet die em-Gefahr mit „Im Mobil-Profil wächst die Basis auf 16px, wodurch alle Abweichungen mitskalieren" — gemessen wächst nichts, beide Profile stehen bei 16px, und 0,7em sind auch auf dem Desktop schon ~11px. Die Diagnose stimmt, die Ursachenerzählung nicht. (b) Gravierender: PATCHES §5 will sieben Stufen „in rem gegen die Profil-Basis" definieren, „damit das Mobil-Profil weiter greift". rem löst gegen das ROOT-Element auf, nicht gegen body — und auf html/:root steht nirgends eine font-size. Nach dem Umbau wären alle Schriftgrößen fest an 16px gekoppelt und das Layout-Profil hätte auf Typografie GAR keinen Einfluss mehr, statt wie behauptet weiter zu greifen. Der Patch braucht zusätzlich ein font-size auf :root pro Profil, sonst baut er die einzige verbliebene Profilwirkung ab.

**Bezug:** N-04 (neu)

### [hoch] Der vorgeschlagene N-05-Fokusring ist an 33 von 37 Stellen wirkungslos — und die dazu vorgeschlagene Jest-Ratsche wird trotzdem grün

**Ort:** Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/PATCHES.md §7b / CHECKLISTE.md §T-4

**Beleg:** PATCHES §7b behauptet: „Liegt sie auf einem :focus-Selektor, bleibt sie — dort ersetzt eine Rahmenfarbe den Ring für den Maus-Klick, und :focus-visible greift trotzdem."

Quelle:
$ grep -ro "outline: none|outline:none" assets/styles/*.css | wc -l
37
$ grep -rn -B4 "outline: *none" assets/styles/*.css | grep -E "focus" | wc -l
33   # z. B. core.css:2085 .toolbar-select:focus, core.css:2162 .toolbar-search:focus,
     # core.css:2300 .loc-search:focus, party.css:1485 .cf-combat-value input:focus

Spezifitätsnachweis im Browser (dist-Bundle; :focus-visible und :focus haben beide Pseudoklassen-Gewicht 1, für den Test durch das erzwingbare :enabled ersetzt, Struktur identisch):
  injiziert: :where(a,button,input,select,textarea,summary,[tabindex]):enabled { outline-color:#d4af37; outline-style:solid; outline-width:2px }
             .probe-toolbar-select:enabled { outline-style:none }
  gemessen an <select class="probe-toolbar-select">:
             outlineColor rgb(212,175,55) · outlineWidth 2px · outlineStyle "none"
→ Die Komponentenregel (0-2-0) schlägt die :where()-Regel (0-1-0). Es wird KEIN Ring gezeichnet.

Die Ratsche in CHECKLISTE §T-4 prüft nur, dass kein outline:none auf einem :focus-VISIBLE-Selektor steht — alle 33 :focus-Fälle passieren sie. Das Handprüfkriterium in CHECKLISTE Zeile 89-90 nennt ausgerechnet das Orte-Suchfeld: assets/templates/view-content.html:60 <input id="loc-search" class="toolbar-search"> — und .toolbar-search:focus{outline:none} (core.css:2162) gewinnt.

**Warum es zaehlt:** Der Patch würde als „erledigt" abgehakt (Ratsche grün, Regel existiert), während die Tastaturbedienung an 33 Eingabefeldern unverändert ohne Ring bleibt — inklusive genau des Feldes, an dem die Handprobe stattfinden soll. Wer den Ring dort wirklich will, muss die 33 Regeln von :focus auf :focus:not(:focus-visible) umstellen oder outline im Ring-Block mit höherer Spezifität setzen. Kein Befund N-01..N-09 nennt diesen Kaskadenkonflikt.

**Bezug:** N-05 (neu)

### [mittel] Chips, Karten und Listenzeilen sind gar nicht fokussierbar — ein Fokusring kann dort nichts sichtbar machen

**Ort:** features/spells/spell-manager.js:42, features/locations/locations-render.js:60, assets/templates/view-content.html

**Beleg:** N-05 listet .filter-chip · .nav-tab · .btn-icon als „ohne Ring". Tatsächlich:

$ grep -rn "filter-chip" --include=*.js features/ | head
features/spells/spell-manager.js:42  <div class="filter-chip ..." data-action="set-spell-filter" ...>
features/locations/locations-render.js:60  <div class="loc-filter-chip ..." data-action="set-loc-filter" ...>
features/encounters/encounters-render.js:84  <div class="enc-filter-chip ...">
features/initiative-loot.js:27  <div class="loot-filter-chip ...">
→ <div>, kein <button>, kein tabindex. Und .filter-chip existiert nur in der Zauber-Ansicht; die übrigen Ansichten benutzen .enc-/.loc-/.loot-/.npc-filter-chip.

$ grep -rn "filter-chip" --include=*.js features/ | grep -c "tabindex"
0
$ grep -rhoE 'tabindex=' --include=*.js features/ ui/ systems/ render/ | wc -l
2
$ grep -rhoE 'tabindex=' assets/templates/*.html | wc -l
0
$ grep -rhoE '<(div|span|li|td|tr)[^>]{0,400}data-action=' --include=*.js features/ ui/ systems/ render/ | wc -l
90

Laufzeit (dist-Bundle):
  Elemente mit data-action im statischen Markup: 894
  davon nicht nativ fokussierbar (kein a[href]/button/input/select/textarea/summary/[tabindex]): 107 (38 div, 38 label, 31 span)
  Probe: <div class="filter-chip" data-action="set-spell-filter">.focus() → document.activeElement === probe: false

**Warum es zaehlt:** N-05 diagnostiziert „kein Fokusring", aber die Ursache ist eine Stufe tiefer: diese Elemente können überhaupt keinen Fokus bekommen. Der :where()-Patch listet nur a/button/input/select/textarea/summary/[tabindex] — Chips und Listenzeilen sind in keiner dieser Gruppen und wären auch mit passender Spezifität nicht erreichbar. Das Abnahmekriterium „Tab durch Orte-Ansicht — Filter-Chips … zeigen jeweils einen Ring" ist mit dem vorgeschlagenen Patch nicht erfüllbar; es braucht tabindex="0" + role="button" + Tastaturhandler an ~197 Stellen. Außerdem: der in N-05 genannte Selektor .filter-chip deckt nur eine von fünf Chip-Familien ab.

**Bezug:** N-05 (neu)

### [mittel] Der globale reduced-motion-Block existiert bereits — N-08 dupliziert ihn und lockert dafür die !important-Ratsche

**Ort:** assets/styles/dmscreen.css:1408-1413

**Beleg:** $ grep -rn -A 12 "prefers-reduced-motion" assets/styles/dmscreen.css | head
1408:        @media (prefers-reduced-motion: reduce) {
1409-            *, *::before, *::after {
1410-                animation-duration: 0.01ms !important;
1411-                animation-iteration-count: 1 !important;
1412-                transition-duration: 0.01ms !important;
1413-            }

Im gebauten Bundle live nachgewiesen: beim Durchlauf durch document.styleSheets trifft die Regel `*, ::before, ::after` im Kontext `(prefers-reduced-motion: reduce)` u. a. .nav-tab.

PATCHES §8 schlägt exakt dieselben drei Deklarationen plus `scroll-behavior: auto !important` am ENDE von core.css vor. core.css wird laut assets/styles.css als 3. importiert, dmscreen.css als 12. — bei gleicher Spezifität und beidseitigem !important gewinnt der spätere, also der bereits vorhandene Block. Netto neu wären genau eine Deklaration (scroll-behavior) und die .dice-result-Ausnahme.

$ node -e "...(Kommentare entfernt wie im Test)..."
!important ohne Kommentare: 105   ← exakt die Obergrenze IMPORTANT_MAX = 105 in tests/unit/design-consistency.test.js:894
CHECKLISTE Zeile 96 verlangt, diese Grenze auf 109 anzuheben.

Der Testkommentar in design-consistency.test.js:885 zählt die vorhandenen bereits auf: „3 prefers-reduced-motion" — es sind genau die drei aus dmscreen.css:1410-1412.

**Warum es zaehlt:** N-08s Prämisse („Würfelwurf, Trefferpunkt-Puls, Toast und die Kampf-Hervorhebung laufen weiter") trifft nicht zu: sie sind bereits auf 0,01 ms gedrosselt. Die Zählung „4 prefers-reduced-motion" verdeckt, dass eine dieser vier die universelle ist. Umgesetzt wie vorgeschlagen wächst die !important-Zahl um 4 für eine einzige neue Wirkung, und eine bewusst gesetzte Ratsche wird dafür gelockert. Richtig wäre: den bestehenden Block in dmscreen.css um scroll-behavior und die .dice-result-Ausnahme ergänzen — dann bleibt die Grenze bei 105 oder steigt um 1.

**Bezug:** N-08 (neu)

### [mittel] --shadow ist im Kontrast-Theme WEISS — der N-03-Vorschlag würde dort jeden Schatten in einen Halo verwandeln

**Ort:** assets/styles/variables.css:20, 49, 75, 101

**Beleg:** $ grep -rn "^\s*--shadow" assets/styles/variables.css
20:            --shadow: rgba(0,0,0,0.5);      (Dark)
49:            --shadow: rgba(0,0,0,0.15);     (Light)
75:            --shadow: rgba(0,0,0,0.1);      (Sepia)
101:            --shadow: rgba(255,255,255,0.1); (Kontrast — Kontext geprüft: steht im Block mit --text:#ffffff, --border:#555, --gold-rgb:255,215,0)

N-03 beschreibt das Token als „in allen vier Themes passend definiert (rgba(0,0,0,0.5) bis rgba(0,0,0,0.1))" — die Spanne lässt den vierten Wert weg.

$ grep -ro "var(--shadow)" assets/styles/*.css | wc -l
1
$ grep -rn "var(--shadow)" assets/styles/*.css
assets/styles/core.css:857:            box-shadow: 0 2px 10px var(--shadow);   ← .offline-indicator

**Warum es zaehlt:** N-03 will vier Höhenstufen --elev-1..3 und --glow-gold „jede aus var(--shadow) gebaut, also pro Theme richtig". Im Kontrast-Theme wäre das Ergebnis: jede Karte, jedes Dropdown und jedes Modal bekommt einen weißen Schein statt eines Schattens — auf schwarzem Grund ein Leuchtrand um alles. Dass das heute niemandem auffällt, liegt allein daran, dass genau EIN Element das Token benutzt. Die Umstellung skaliert diesen einen Sonderfall auf 88 Schatten hoch. Der Patch braucht entweder einen dunklen --shadow für Kontrast oder eine eigene Elevation-Definition pro Theme.

**Bezug:** N-03 (neu)

### [mittel] Zwei Responsive-Systeme mit verschiedenen Schwellen: JS entscheidet einmalig bei 768px, CSS bricht bei 600/900/1200 — kein resize-Listener

**Ort:** ui/layout-profiles.js:17-24

**Beleg:** Quelle (ui/layout-profiles.js):
  function loadLayout() { let layout = D.settings?.layout; if (!layout) { layout = window.innerWidth <= 768 ? 'mobile' : 'desktop'; } ... }
→ einmalig beim Laden, Schwelle 768.

$ grep -hn "@media" assets/styles/*.css | sed 's/^[0-9]*: *//' | sort | uniq -c | sort -rn
     27 @media (max-width: 600px)
     21 @media (max-width: 900px)
      6 @media (max-width: 1200px)
      ... (+ min-width 601/901/1201)
$ grep -c 'data-layout="mobile"' assets/styles/*.css | awk -F: '{s+=$2} END{print s}'
59
$ grep -rn "addEventListener('resize'" --include=*.js features/ ui/ systems/ core/ render/ utils/
core/init.js:118:    window.addEventListener('resize', debounce(updateStickyOffsets, 200));
→ der einzige resize-Listener betrifft Sticky-Offsets, nicht das Layout-Profil.

Laufzeit (dist-Bundle, lokaler HTTP-Server):
  Frischladen 800×900 → data-layout="desktop", matchMedia('(max-width:900px)')=true, .main-content padding 10px
  Frischladen 700×900 → data-layout="mobile",  (max-width:900px)=true, (max-width:600px)=false
  Laden bei 1200, dann auf 500 verkleinert → data-layout bleibt "desktop", (max-width:600px)=true UND (max-width:900px)=true,
     .app-header position=sticky (statt fixed), .mobile-nav-toggle display=none, .nav-tabs display=flex, margin-bottom 0px

Sieben Selektoren deklarieren in BEIDEN Systemen widersprechende Werte (eigenes Skript):
  .main-content padding — variables.css:434 vs @media(max-width:900px) dashboard.css:1718
  .party-grid/.npc-grid/.encounter-grid/.loot-list grid-template-columns — variables.css:440 vs dashboard.css:1719
  .modal max-width/max-height/margin — variables.css:482 vs @media(max-width:600px) dmscreen.css:1106
  .bestiary-layout grid-template-columns — bestiary.css:344 vs @media(max-width:1200px) core.css:2424

**Warum es zaehlt:** Wer das Fenster verkleinert oder ein Tablet dreht, bekommt die Media-Query-Hälfte des Mobil-Layouts (Einspalten-Raster, 10px Innenabstand, 600px-Regeln) ohne die andere Hälfte (fester Kopf, Kachel-Navigation, Bodenabstand für die Leiste, größere Formularfelder) — nachweislich reproduziert. Das Audit rechnet ausschließlich statisch und sieht die 59 [data-layout]-Regeln und die 54 Media-Query-Blöcke als zwei unabhängige Zahlen. Für N-04 kommt hinzu, dass die Argumentation über „das Mobil-Profil" ein Profil voraussetzt, das sich zur Laufzeit gar nicht anpasst.

**Bezug:** N-04 (neu)

### [niedrig] Mobile Navigation: .nav-tab-icon und .nav-tab-text sind tot — das zweizeilige Kachel-Layout greift nie

**Ort:** assets/styles/variables.css:423-432

**Beleg:** $ sed -n '423,432p' assets/styles/variables.css
        [data-layout="mobile"] .nav-tab-icon { font-size: 18px; display: block; margin-bottom: 2px; }
        [data-layout="mobile"] .nav-tab-text { display: block; font-size: 9px; }

$ grep -rl "nav-tab-icon\|nav-tab-text" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage --exclude-dir=.git --exclude-dir=Anpassungen --exclude-dir=assets
(leer)

Tatsächliches Markup (assets/templates/header.html:47):
        <button class="nav-tab active" data-view="dashboard" role="tab" aria-selected="true">🏠 Start</button>
→ Emoji und Text stehen als ein einziger Textknoten im Button, keine Kind-Spans.

Laufzeit (dist-Bundle, 1400px): .nav-tab outerHTML = <button class="nav-tab active" data-view="dashboard" role="tab" aria-selected="true">🏠 Start</button>

**Warum es zaehlt:** [data-layout="mobile"] .nav-tabs baut ein 4-spaltiges Raster (variables.css:391) und rechnet mit 56px hohen Kacheln, in denen Symbol über Beschriftung steht. Weil die beiden Spans fehlen, bleibt der Reiter einzeilig und die Beschriftung bei 11px statt 9px — auf 4 Spalten wird das schnell abgeschnitten. Die beiden font-size-Deklarationen (18px, 9px) sind zwei der 55/58 in N-04 gezählten Werte und lassen sich nicht „auf eine Skala runden", weil sie nie greifen; die Regeln sind entweder zu löschen oder das Markup ist nachzuziehen.

**Bezug:** N-04 (neu)

### [niedrig] Ungenutzte Elevation-Utilities .shadow-sm/-md/-lg existieren bereits — N-03 führt daneben --elev-1..3 ein

**Ort:** assets/styles/dmscreen.css:1427-1429

**Beleg:** $ grep -rn "\.shadow-sm\|\.shadow-md\|\.shadow-lg" assets/styles/*.css
assets/styles/dmscreen.css:1427:        .shadow-sm { box-shadow: ... }
assets/styles/dmscreen.css:1428:        .shadow-md { box-shadow: ... }
assets/styles/dmscreen.css:1429:        .shadow-lg { box-shadow: ... }

$ for c in shadow-sm shadow-md shadow-lg; do grep -rl "$c" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=coverage --exclude-dir=.git --exclude-dir=Anpassungen --exclude-dir=assets; done
(leer — keine Nutzung im gesamten Repo)

Jede der drei Regeln enthält genau ein rgba(0,0,0,…)-Literal und ein box-shadow, wird also in N-01 wie in N-03 mitgezählt.

**Warum es zaehlt:** N-03 formuliert die Einführung von vier Höhenstufen als Neubau und erwähnt nicht, dass ein — allerdings unbenutzter und nicht themenfähiger — Dreier-Satz bereits im Baum liegt. Wird der Patch eingespielt, ohne diese drei zu löschen, stehen anschließend zwei parallele Elevation-Vokabulare nebeneinander; genau die Dublettenlage, die Welle 3 (F-18) beseitigt hat.

**Bezug:** N-03 (neu)

### [niedrig] Eigene Nachzählung weicht von drei Kopfzahlen des Berichts ab — N-06 unterschätzt den Umfang um 23 %

**Ort:** assets/styles/

**Beleg:** Eigene Zählung über alle 20 Dateien in assets/styles/, Kommentare entfernt (Python, re):
  rgba( gesamt: 400            — Bericht N-01: „390 rgba()-Literale"
  transition: all: 163         — Bericht N-06 Überschrift: „132× transition: all"
                                 (132 ist nur `all 0.2s`; +19 `all 0.15s` = 151, Rest verteilt auf die
                                  übrigen sechs Dauern)
  font-size-Deklarationen: 1095, davon 58 verschiedene Werte — Bericht N-04: „55 verschiedene"
  font-weight: 600 → 280 plus 8× `600 !important` = 288 — Bericht N-07: „600 277×"
  Unverändert bestätigt: box-shadow 88 Deklarationen, var(--shadow) 1×, outline:none 37,
  :focus-visible 7, @keyframes 19, animation-Deklarationen 29
  Zeilenumfang: 27.141 Zeilen in assets/styles/*.css (20 Dateien) + 25 Zeilen assets/styles.css
  — Bericht: „21 Dateien, 27.187 Zeilen"

**Warum es zaehlt:** Die CHECKLISTE macht mehrere dieser Zahlen zu Zielwerten von Jest-Ratschen. Wenn die Ausgangszahl schon 23 % danebenliegt (163 statt 132 `transition: all`), ist eine Ratsche darauf entweder von Anfang an rot oder sie wird auf einen Wert gesetzt, der 31 Fundstellen stillschweigend durchlässt. Vor dem Setzen jeder Ratsche muss der Ausgangswert mit demselben Ausdruck gemessen werden, den der Test später benutzt.

**Bezug:** N-01, N-04, N-06, N-07 (neu)
