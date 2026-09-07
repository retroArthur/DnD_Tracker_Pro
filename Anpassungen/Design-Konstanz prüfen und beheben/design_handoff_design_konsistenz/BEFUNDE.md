# Befunde — Design-Konsistenz-Audit

Geprüfte Fassung: `dnd-tracker-bundled.html`, 85.534 Zeilen, ~3.729 CSS-Regeln, 30 Views.
Methodik: statische Analyse (Token-Auflösung, Selektor- und Wertehäufigkeiten, Markup-Struktur je View). Keine Laufzeitmessung.
Schwere: **Kritisch** = sichtbar defekt · **Hoch** = deutliche Inkonsistenz oder Funktionsloch · **Mittel** = systematische Drift · **Niedrig** = Wartbarkeit.

---

## Leitbeispiel: Orte vs. Kalender

| | 🏠 Orte (`.loc-view`) | 📅 Kalender (`tl-*`) |
|---|---|---|
| Toolbar | 4 Gruppen: Identität + Zähler, Suche, Filter-Chips + Import/Export, Primäraktion | 2 Gruppen: Titel + Zähler, Primäraktion |
| Layout | `grid-template-columns: 1fr 825px`, Detail-Panel sticky | kein Grid; Kopfzeile + `.tl-view-content` mit eigenem Padding |
| Karte | `background: var(--bg-card)`, `border-radius: 10px`, `border: 2px solid transparent` | `background: var(--surface)` (undefiniert → transparent), `border-radius: var(--radius)` (undefiniert → 0), `border-left: 3px solid var(--gold)` |
| Maße | px | rem |
| Primärbutton | `btn btn-success` (grün) | `btn btn-primary` |
| DOM | in `<main class="main-content">` | **außerhalb**, zwischen den Modals |

Kalender ist keine Variante von Orte, sondern eine eigene Insel. Dieselbe Insel: **Session-Prep** (`wp-`), **Reise** (`rs-`), **Fraktionen** (`fr-`).

---

# A · Fundament

## F-01 · Kritisch — 22 Custom Properties werden benutzt, aber nie definiert
Das `:root` definiert 18 Farb- und 29 Layout-Tokens. Die neueren Module lesen ein zweites, nie angelegtes Set. **56 Zugriffe haben keinen Fallback** und fallen damit auf „ungültig" zurück: transparente Flächen, Radius 0, fehlende Abstände.

```
--space-md   33×    --surface-alt   11×    --border-color 4×
--space-sm   25×    --gold-hover     4×    --teal         2×
--radius     23×    --gold-rgb       4×    --text-light   2×
--surface    17×    --bg-alt, --bg-input, --border-light, --surface-hover,
--bg         14×    --green-hover, --green-rgb, --red-dim, --red-rgb  je 1×
```

Drei weitere (`--hp-pct`, `--map-zoom`, `--migration-hint-height`) werden zur Laufzeit per `style.setProperty` bzw. inline gesetzt — die sind in Ordnung und bleiben.

Nebenbefund: `rgba(var(--gold-rgb, …))` benutzt zwei verschiedene Fallbacks — `212,175,55` (= `--gold`) und `180,140,60` (ein dritter Goldton).

**Fix:** die fehlenden Namen einmalig als Alias auf die vorhandenen Tokens legen. → `PATCHES.md` §1

## F-02 · Kritisch — zwei Karten-Sprachen für dieselbe Sache
```css
.loc-item      { background: var(--bg-card); border-radius: 10px;
                 border: 2px solid transparent; padding: 12px 14px; gap: 12px; }
.npc-item      { /* identisch */ }
.loot-item     { /* identisch */ }

.tl-event-card { background: var(--surface);      /* ✗ undefiniert */
                 border-radius: var(--radius);    /* ✗ undefiniert */
                 border: 1px solid var(--border);
                 border-left: 3px solid var(--gold);
                 padding: var(--space-md, 1rem); }
.wp-card       { /* wie tl-event-card, ohne Akzentleiste */ }
.fr-card       { /* wie wp-card */ }
```
**Fix:** eine Basisklasse (`.list-item` für Listenzeilen, `.card` für Inhaltskarten) als Single Source; die `tl-/wp-/fr-/rs-`-Karten darauf umstellen und dort nur noch Zustandsfarben ergänzen. → `PATCHES.md` §4

## F-03 · Hoch — zwei Maßsysteme: px und rem
```
Bestand (Zeile 19 – 25 683)     5 272 px   ·    79 rem
Welt-Views (ab Zeile 25 684)       63 px   ·   253 rem
```
Gleich gemeinte Abstände skalieren bei geänderter Browser-Schriftgröße unterschiedlich; die Views laufen beim Zoomen optisch auseinander.
**Fix:** eine Einheit festlegen (px passt zum Bestand), Spacing-Tokens in dieser Einheit definieren, `rem`-Werte in den Welt-Blöcken darauf umstellen.

## F-04 · Hoch — 100 hartkodierte Hex-Farben neben der Token-Palette
240 Farbangaben stehen direkt im CSS, in 100 verschiedenen Werten:
```
Grün  #22c55e ×17  #16a34a ×5  #4ade80 ×4  #2ecc71  #27ae60
Rot   #ef4444 ×13  #dc2626 ×8  #991b1b ×3  #b91c1c ×2  #e74c3c ×2
Blau  #3b82f6 ×10  #60a5fa      #3498db
Gold  #d4af37 ×5   #c5a028 ×4  #f59e0b ×3  #eab308 ×3
Grau  #888 ×8  #9ca3af ×6  #aaa ×2  #6b7280 ×2  #1f2937 ×2
```
Themes und Design-Profile greifen an diesen Stellen nicht.
**Fix:** die vorhandenen semantischen Tokens (`--color-success`, `--color-warning`, `--color-danger`, `--color-info`, `--color-primary`) konsequent verwenden; Hex-Literale per Suchen-Ersetzen kanalisieren.

## F-05 · Mittel — 14 verschiedene Schrift-Deklarationen
Neben den gebündelten Profil-Fonts stehen Segoe UI, Inter, Poppins, Roboto, Source Sans Pro, Georgia und **vier Mono-Stacks** (`monospace` ×17, `'JetBrains Mono'` ×5, `'Roboto Mono'`, `'Consolas','Monaco'`, `'Courier New'`) im CSS.
Besonders auffällig: `.section-toolbar { font-family: 'Segoe UI', system-ui, sans-serif; }` — erzwingt eine Familie und ignoriert damit das gewählte Design-Profil, in **jeder** Toolbar der App.
**Fix:** zwei Familien-Tokens (`--font-ui`, `--font-mono`); Komponenten benutzen `font-family: inherit` oder das Mono-Token.

## F-06 · Mittel — keine Radius- und Abstands-Skala
```
border-radius: 4px ×167 · 6px ×161 · 8px ×138 · 10px ×62 · 12px ×40
               3px ×38 · var(--radius) ×23 · 5px ×14 · 16px ×13 · 20px ×8
gap / padding: 136 unterschiedliche Werte
```
Gleichrangige Elemente wirken ungleich weich und ungleich dicht.
**Fix:** drei Radien (`--radius-sm 4px`, `--radius-md 8px`, `--radius-lg 12px`) und fünf Abstände (4/8/12/16/24) als Tokens; alle Werte darauf runden.

---

# B · View-Gerüst

## F-07 · Kritisch — vier Views liegen außerhalb des Seiten-Containers
```
Zeile 27 124   <main class="main-content">
Zeile 29 599   </main>
Zeile 29 608   <section id="view-sessionprep" class="view">    ✗
Zeile 29 624   <section id="view-kalender"    class="view">    ✗
Zeile 29 643   <section id="view-reise"       class="view">    ✗
Zeile 29 655   <section id="view-fraktionen"  class="view">    ✗
```
Sie erben deshalb weder `padding: 16px` noch `max-width: 1800px; margin: 0 auto` noch `padding-top: 60px` (Abstand zur fixierten Navigation). Kompensiert wurde das mit eigenem Padding in `.wp-/.tl-/.rs-/.fr-view-content` — daher die abweichende Randbreite und die fehlende Zentrierung.
**Fix:** die vier `<section>` vor `</main>` verschieben und die Kompensations-Paddings entfernen. → `PATCHES.md` §2

## F-08 · Hoch — drei Kopfzeilen-Muster in einer App
```
volle .section-toolbar (4 Gruppen, 74px):  12 Views
Kurzfassung (Titel + Aktion):               4 Views  (Welt-Modul)
gar keine Toolbar, eigener Kopf:            8 Views
   .dmscreen-header · .dice-hero · .timer-hub · .encounter-controls · …
```
Der Nutzer verliert beim Tab-Wechsel den festen Ankerpunkt (Titel links, Suche mittig, Primäraktion rechts).
**Fix:** Toolbar als verbindlicher Kontrakt für alle Views; Werkzeug-Views bekommen dieselbe Zeile mit Titel und Aktionen, ihre Spezialsteuerung darunter. → `PATCHES.md` §5

## F-09 · Hoch — Suche und Import/Export fehlen in den neuen Views
```
.section-toolbar     16× im Markup
.toolbar-search      12×      → 4 Views ohne Suche
.section-toolbar-io  10×      → 6 Views ohne Import/Export

Orte      Identität · Suche · Filter+IO · Aktion
Kalender  Identität ·   —   ·    —      · Aktion
Reise     Identität ·   —   ·    —      ·   —      (auch ohne Zähler)
```
Kalender, Fraktionen, Session-Prep und Reise führen Listen — beides ist dort ein Funktionsloch, nicht nur ein optischer Unterschied.
**Fix:** Suchgruppe und IO-Block übernehmen (Markup identisch, nur `id`, `placeholder`, `data-render` und `data-value` anpassen) und die Filterfunktion in den `render*`-Funktionen auswerten. → `PATCHES.md` §5

## F-10 · Mittel — drei Namensschemata für den Zähler
```
party-io-count · npcs-io-count · locations-io-count · quests-io-count
encounter-io-count · loot-io-count · shops-io-count · spells-io-count
notes-io-count · wiki-io-count · links-io-count          (11×)
bestiary-count                                            (1×)
kalender-count · fraktionen-count · sessionprep-count      (3×)
reise → kein Zähler
```
Ein gemeinsamer Update-Helper ist damit nicht möglich; jede `render*`-Funktion schreibt ihren Zähler selbst.
**Fix:** ein Schema `<view>-count` plus `setViewCount(view, n)`. → `PATCHES.md` §7

## F-11 · Hoch — Master-Detail: gleiche Grundform, fünf Verhaltensweisen
```
.loc-layout       1fr 825px  →                                1fr
.bestiary-layout  1fr 825px  →                                1fr
.npc-layout       1fr 825px  → 1fr 400px →                    1fr
.loot-layout      1fr 825px  → 1fr 500px →                    1fr
.enc-layout       1fr 825px  → 1fr 600px → 1fr 400px →        1fr
.fr-layout        320px 1fr  →                                1fr    ← Achse gedreht
```
**Fix:** eine Utility-Klasse `.master-detail` mit einer Breakpoint-Kette für alle; Fraktionen auf dieselbe Achse drehen (Liste links schmal, Detail rechts). → `PATCHES.md` §8

## F-12 · Mittel — 18 verschiedene Breakpoint-Grenzen
```
max-width: 600 ×14 · 768 ×10 · 480 ×6 · 900 ×6 · 1200 ×5 · 500 ×4
           1400 ×3 · 700 ×2 · 800 · 1000 · 640
min-width: 500 · 769 · 601–900 · 901–1200 · 1201
```
Beim Verkleinern brechen die Views zu unterschiedlichen Zeitpunkten um.
**Fix:** drei Grenzen festlegen (z. B. 600 / 900 / 1200) und alle Queries darauf ziehen.

---

# C · Komponenten

## F-13 · Hoch — drei Button-Varianten existieren nur im Markup
```
Klasse           CSS-Regel   Verwendungen   Beispiel
btn-icon         keine       17             Icon-Buttons in Listen
btn-secondary    keine        5             "🎲 Generator" (NPCs)
btn-warning      keine        2             "⭐ XP" (Initiative)
```
Diese Buttons sehen aus wie Standard-Buttons; die gemeinte Hierarchie (sekundär / warnend / nur Icon) ist unsichtbar.
**Fix:** die drei Varianten definieren. → `PATCHES.md` §3

## F-14 · Hoch — zwei Farben für dieselbe Rolle „Neu anlegen"
```
Orte        btn btn-success   "+ Neuer Ort"
Bestiar     btn btn-success   "+ Monster"
Kalender    btn btn-primary   "+ Ereignis"
Fraktionen  btn btn-primary   "+ Neue Fraktion"

btn-success  56 Verwendungen   ·   btn-primary  29 Verwendungen
```
Verschärfend: `.btn-primary` ist überhaupt keine Variante — die einzige Regel dazu lautet `.btn-primary { white-space: nowrap; }`. „+ Ereignis" im Kalender sieht damit genau aus wie ein neutraler Sekundär-Button, während „+ Neuer Ort" grün gefüllt ist. Die Primäraktion hat also nicht nur zwei Farben, sondern in der Hälfte der Views gar keine.
**Fix:** `btn-primary` als einzige Primärvariante; `btn-success` nur für bestätigende Aktionen (Speichern, Abschließen, Rasten). → `PATCHES.md` §6

## F-15 · Mittel — Bestiar bricht die Toolbar-Regeln im Detail
```html
<span class="section-toolbar-title" style="color:var(--gold);font-weight:700;">🐉 Bestiar</span>
<input id="bestiary-search" placeholder="Monster suchen...">      <!-- ohne 🔍 -->
<input id="loc-search"      placeholder="🔍 Orte suchen...">      <!-- Standard -->
<label class="bestiary-filter-label">HG</label>
<select class="bestiary-filter-select">                            <!-- eigene Klasse -->
```
Außerdem heißt der Zähler `bestiary-count` statt `bestiary-io-count` (siehe F-10).
**Fix:** Inline-Styles entfernen (die Klasse setzt Gold und 600 bereits), Platzhalter angleichen, Filter auf die Chip- oder Toolbar-Select-Variante bringen.

## F-16 · Mittel — vier verschiedene Filter-Bedienungen
```
Chips            .loc-filter-chips · .npc-filter-chips · .loot-filter-chips · .enc-filter-chips
natives Select   #party-class-filter · #shop-type-filter · #link-filter
Label + Select   .bestiary-filter-label + .bestiary-filter-select
Checkbox         .filter-checkbox (Quests: "Aktive")
```
**Fix:** Chips als Standard für Kategorien, Select nur bei mehr als ~8 Optionen, Checkbox nur für echte Boolean-Filter — und dann in allen Views gleich gestylt.

## F-17 · Mittel — rund 15 eigene Leerzustände
```
.empty-state / -icon / -title / -desc      3 Verwendungen (generisch)
+ 14 View-eigene Familien:
  loc-detail-empty · npc-detail-empty · loot-detail-empty · enc-detail-empty
  bestiary-detail-empty · wiki-detail-empty · dms-widget-empty · sb-empty-hint
  cart-empty · char-empty · calc-list-empty · calc-results-empty
  shop-items-empty · rt-preview-empty
```
**Fix:** ein Muster `.empty-state` (Icon, Titel, Beschreibung, optionale Aktion) plus Helper `emptyState({icon,title,desc,action})` im JS; alle anderen Familien löschen.

---

# D · CSS-Hygiene

## F-18 · Mittel — mehrfach definierte Selektoren und 132× `!important`
```
5× .dmscreen-grid          3× .npc-layout          3× .modal
4× .section-toolbar        3× .loot-layout         3× .modal-overlay
4× .enc-layout             3× .loot-item           3× .editor-toolbar
4× .spell-slots-grid       3× .enc-item            3× .floating-toolbar
… insgesamt 28 Selektoren mehr als zweimal definiert
```
Wer eine Regel ändert, trifft womöglich die falsche Fundstelle; die 132 `!important` sind die Folge davon.
**Fix:** Dubletten zusammenführen (je Komponente **ein** Block, Media Queries direkt dahinter), danach `!important` abbauen.

## F-19 · Niedrig — 684 Inline-Styles und 23 z-index-Werte
684 `style="…"`-Attribute, davon 324 im Body-Markup — darunter Farben direkt an Navigations-Tabs (`style="color: var(--purple)"`).
```
z-index: 2,3,4,5,10,15,98,99,100,200,989,990,998,999,1000,
         1050,1100,1200,5000,5001,9999,10000,10001
```
Overlays, Modals, Dropdowns und Toasts konkurrieren ohne Stufenlogik.
**Fix:** wiederkehrende Inline-Styles in Utility-Klassen überführen; fünf z-index-Tokens (`--z-base 1`, `--z-sticky 100`, `--z-dropdown 500`, `--z-modal 1000`, `--z-toast 2000`).
