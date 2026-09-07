# Handoff: Texterstellung (Rich-Text-Editor) — Variante 2a

## Überblick

Neugestaltung der Editor-Werkzeugleiste („Texterstellung") im D&D-Tracker.
Ausgangslage: drei **zentrierte** Werkzeugreihen (`.editor-toolbar` mit `.toolbar-row`),
die zusammen ~107 px hoch werden und die eigentliche Schreibfläche verdrängen.

Ziel (Variante **2a**): **eine** flach gebaute, links ausgerichtete Leiste (43 px),
Werkzeuge nach Funktion gruppiert und durch Trenner getaktet, Seltenes hinter
Aufklapp-Menüs, plus Kopf- und Statuszeile um den Editor.

## Zu den Design-Dateien

Die Dateien in diesem Bündel sind **Design-Referenzen in HTML** — ein Prototyp, der
Aussehen und Verhalten zeigt, **kein produktionsfertiger Code zum Kopieren**.
Aufgabe ist, das Design in der bestehenden Umgebung des Zielprojekts nachzubauen
(hier: eine einzelne, gebündelte HTML/CSS/Vanilla-JS-Anwendung mit CSS-Variablen-Themes und
`data-action`-Event-Delegation) und dabei deren Konventionen zu verwenden — also
`.editor-toolbar`-Klassen, `data-action`-Attribute und die `--gold/--bg-card/...`-Tokens,
statt der Inline-Styles des Prototyps.

Der Prototyp ist mit React/Design-Components gebaut; **das ist nur das Prototyping-Werkzeug**.
Die Zielimplementierung bleibt Vanilla JS im bestehenden Bundle.

## Fidelity

**High-fidelity.** Farben, Größen, Abstände, Zustände und Interaktionen sind final gemeint.
Alle Farben stammen aus den bestehenden Theme-Variablen der App (`--gold`, `--bg-card`,
`--bg-elevated`, `--border`, `--text`, `--text-dim`) und funktionieren damit in allen vier
Themes (dark, light, sepia, contrast) mit.

---

## Struktur (von oben nach unten)

Der Editor besteht aus vier gestapelten Bereichen in einem Container
(`background: var(--bg-card); border: 1px solid var(--border);` — **kein** border-radius):

1. **Kopfzeile** (`padding: 10px 12px; border-bottom: 1px solid var(--border)`)
   - 6×6 px Quadrat in `var(--gold)`
   - Titel: 12 px, `font-weight: 600`, `letter-spacing: .04em`, `text-transform: uppercase`
     — Inhalt: Kontext des Feldes, z. B. „ORT — DAS KONTOR AM ASCHEPFAD"
   - rechts (`margin-left:auto`): Speicherstand, 11 px, `var(--text-dim)`
2. **Werkzeugleiste** (siehe unten)
3. **Schreibfläche** (`contenteditable`)
   - `min-height: 230px; padding: 22px 26px; font: 15px/1.7 Georgia, serif;`
   - `background: #111` (dunkler als die Karte — die Schreibfläche ist „Papier")
   - Platzhalter über `[contenteditable]:empty:before { content: attr(data-ph); color: #5f5f5f }`
4. **Statuszeile** (`padding: 8px 12px; border-top: 1px solid var(--border); background: var(--bg-elevated)`)
   - links: „N Wörter", „N Zeichen", Hinweis „Strg+Shift+V fügt ohne Formatierung ein" (`#5f5f5f`)
   - rechts: „Abbrechen" (Ghost) + „Speichern" (`background: var(--gold); color: #111; font-weight: 700`)
   - alle 11 px, `var(--text-dim)`, Buttonhöhe 26 px, Padding `0 12px`

---

## Werkzeugleiste (Kern der Änderung)

Container: `display:flex; flex-wrap:wrap; align-items:center; gap:2px; padding:6px 8px;
background: var(--bg-elevated); border-bottom:1px solid var(--border); position:relative;`
**Flush links** — nichts zentrieren.

Reihenfolge der Gruppen, Trenner dazwischen
(`span`, `width:1px; height:18px; background: var(--border); margin: 0 6px`):

| # | Gruppe | Inhalt | Attribut fürs Ausblenden |
|---|--------|--------|--------------------------|
| 1 | Verlauf | Rückgängig, Wiederholen | `data-tb="hist"` |
| 2 | Zeichen | **B**, *I*, <u>U</u>, ~~S~~ | immer sichtbar |
| 3 | Struktur | Liste, Link | `data-tb="mid"` |
| 4 | Auszeichnung | Marker ▾, Bausteine ▾ | immer sichtbar (Text mit `data-tb="label"`) |
| 5 | Typo | Schrift-Select, Größen-Select | `data-tb="fonts"` |
| 6 | rechts (`margin-left:auto`) | Format löschen, ⋯ | ⋯ = `data-tb="more"` |

**Icon-Buttons**: 30×30 px, `display:grid; place-items:center`, transparent, randlos,
`color: var(--text)`, Icon 15 px (Lucide, `stroke-width:2`).
B/I/U/S als Typografie gesetzt (Georgia 14 px, fett/kursiv/unterstrichen/durchgestrichen).
**Hover**: `background: rgba(212,175,55,.14); color: var(--gold)`.
**Aktiv** (Cursor steht in diesem Format): `background: rgba(212,175,55,.18); color: var(--gold)`.
**Text-Buttons** (Marker/Bausteine/Blase): Höhe 30 px, `padding: 0 9px`, 12 px, `gap: 7px`.
**Selects**: Höhe 30 px, `background: var(--bg-card); border:1px solid var(--border)`, 12 px.
Fokus: `outline: 2px solid var(--gold); outline-offset: 2px` (keine Browser-Standardringe).

### Responsives Verhalten (wichtig)

Die Leiste darf **nie** in mehrere Reihen kippen. Umschaltung per Media-Query, das
Ausgeblendete ist im ⋯-Menü vollständig erreichbar:

```css
[data-tb="more"] { display: none; }

@media (max-width: 900px) {
  [data-tb="hist"], [data-tb="fonts"] { display: none !important; }
  [data-tb="more"] { display: flex !important; }
}
@media (max-width: 680px) {
  [data-tb="mid"], [data-tb="blase"], [data-tb="label"] { display: none !important; }
}
```

- **> 900 px**: alles inline (Leiste 43 px hoch)
- **≤ 900 px**: Verlauf + Schrift/Größe ins ⋯
- **≤ 680 px**: zusätzlich Liste/Link/Blase ins ⋯; Marker und Bausteine werden reine Icons
- immer sichtbar: B/I/U/S, Marker, Bausteine, Format löschen, ⋯

### Aufklapp-Menüs

Alle drei Menüs (Marker, Bausteine, ⋯) hängen **an ihrem Button**, nicht an der Leiste:
Button + Menü in einem `position:relative`-Wrapper, Menü
`position:absolute; top:100%; left:0` (⋯: `right:0`), `margin-top:6px`.
Stil: `background:#2b2b2b; border:1px solid var(--gold); box-shadow:0 14px 34px rgba(0,0,0,.65); padding:4px`.
Kopfzeile im Menü: 10 px, `letter-spacing:.12em`, uppercase, `var(--text-dim)`.
Einträge: `padding:8px 10px`, 13 px, links ausgerichtet, Hover `rgba(212,175,55,.18)` + `var(--gold)`.
Menü schließt nach Auswahl. (Nicht implementiert, empfohlen: Schließen bei Klick außerhalb + `Esc`.)

- **Marker-Menü**: vier Swatches 24×24 px — `#fbbf24`, `#7ec4cf`, `#4ade80`, `#ef4444` — plus „×" (Marker entfernen).
  Die zuletzt gewählte Farbe wird im Marker-Button als 11×11-Swatch angezeigt.
- **Bausteine-Menü**: Vorlesetext, Statblock, Würfeltabelle, Trenner (je mit 3×15-px-Farbstreifen als Marke).
- **⋯-Menü**: Rückgängig, Wiederholen, Liste, „Link …", Schrift- und Größen-Select, „Werkzeug-Blase: an/aus".

---

## Verhalten / Logik

### 1. Marker und Lesbarkeit (war der größte Fehler im Alt-Zustand)

Marker setzt **immer** Hintergrund **und** dunkle Schriftfarbe:

```js
document.execCommand('hiliteColor', false, color);
document.execCommand('foreColor', false, '#141414');
```

„Marker entfernen": `hiliteColor 'transparent'` + `foreColor '#e4e4e4'` (bzw. `var(--text)`).

Zusätzlich läuft bei jedem `input` eine **Normalisierung** über die Schreibfläche, weil
Browser beim Weitertippen den Marker fortführen, aber die Schriftfarbe verlieren:

- Für jedes Element den nächsten Vorfahren mit eigenem `style.backgroundColor` suchen.
- Nur **deckende** Marker (Alpha ≥ 0.6) erzwingen `color:#141414`; zarte Tints bleiben hell.
- Liegt kein Marker an, wird ein gesetztes `rgb(20,20,20)` (bzw. `var(--txt)`) wieder entfernt.
- Danach leere Hüllen (`<span style="">`, attributloses `<font>`) auflösen und `el.normalize()`;
  das Element, das den Cursor enthält, dabei **auslassen** (sonst springt die Einfügemarke).

### 2. Bausteine einfügen

`execCommand('insertHTML')` zerlegt Block-Markup (der erste Absatz des Blocks landet im
vorherigen Absatz, `div`-Wrapper verschwinden ganz). Stattdessen als echte Knoten einhängen:

1. Block-HTML in einem Hilfs-`div` parsen, `firstElementChild` nehmen.
2. Vom `selection.anchorNode` nach oben laufen, bis das Elternelement die Schreibfläche ist
   → dieses „oberste Kind" ist der Einfügepunkt.
3. `editor.insertBefore(block, top.nextSibling)` und danach
   `editor.insertBefore(<p style="margin:0"><br></p>, block.nextSibling)`.
4. Cursor per `Range` in diesen leeren Absatz setzen.

Jeder Baustein trägt `data-block="read-aloud" | "statblock"`; Tabellen und `<hr>` sind über
Tag-Namen erkennbar.

**Enter verlässt einen Baustein**: bei `keydown` Enter (ohne Shift) vom Cursor nach oben
laufen; liegt ein `[data-block]`-Vorfahre vor (und **keine** `<table>`), `preventDefault()`,
neuen Absatz hinter den Block setzen und Cursor dorthin. `Shift+Enter` bleibt Zeilenumbruch
im Block, `Enter` in Tabellenzellen bleibt Browser-Standard.

Baustein-Markup im Prototyp:

- Vorlesetext: `border-left:3px solid var(--gold); background:rgba(212,175,55,.08); padding:12px 16px; font-style:italic; margin:14px 0`
- Statblock: `border:1px solid var(--border); padding:12px 16px; margin:14px 0; font-size:14px`
- Würfeltabelle: `width:100%; border-collapse:collapse`, Zellen `border:1px solid var(--border); padding:6px`
- Trenner: `<hr style="border:none;border-top:2px solid var(--border);margin:16px 0">`

### 3. Block-Handle

Bei `mousemove` über der Schreibfläche das oberste Kind unter dem Zeiger bestimmen; ist es ein
Baustein/`table`/`hr`, eine kleine Leiste **26 px über dem Block** einblenden (absolut im
Editor-Wrapper positioniert, `z-index:7`):

`[Label] · Markieren · Duplizieren · ×` — bei Tabellen zusätzlich `+ Zeile` und `+ Spalte`.

- Markieren: `Range.selectNode(block)`
- Duplizieren: `cloneNode(true)` hinter den Block
- ×: `block.remove()`
- +Zeile: letzte Zeile als Vorlage klonen, Zellen leeren (`&nbsp;`)
- +Spalte: in jede Zeile eine Zelle mit dem Stil der letzten anhängen
- `mousedown` auf der Handle-Leiste: `preventDefault()`, damit die Auswahl erhalten bleibt
- Handle verschwindet bei `mouseleave` der Schreibfläche

### 4. Werkzeug-Blase (optional zuschaltbar)

Schalter „Blase" in der Leiste (Toggle, Zustand sichtbar: `border:1px solid var(--gold)`,
`background: rgba(212,175,55,.18)`, `color: var(--gold)`), Zustand in
`localStorage['dnd-editor-bubble'] = '1' | '0'`.

Ist er aktiv, erscheint bei jeder nicht-leeren Auswahl (`mouseup`/`keyup`) eine schwebende
Leiste über der Markierung: B · I · U · Marker · × · Link · „Format löschen".
Stil wie die Menüs, `padding:4px`, Buttons 28×28 px.

Positionierung (relativ zum Editor-Wrapper, `position:relative`):

```js
let x = rect.left - host.left + rect.width / 2;          // Mitte der Auswahl
const half = bubble.offsetWidth / 2 + 8;                  // echte Breite messen
x = Math.min(Math.max(x, half), host.width - half);       // an den Kanten klemmen
let y = rect.top - host.top - 8;                          // über der Auswahl
if (y < bubble.offsetHeight + 10) y = rect.bottom - host.top + 8;  // sonst darunter
```

`transform: translate(-50%, -100%)` (bzw. `translate(-50%, 0)`, wenn sie nach unten kippt).
`mousedown` auf der Blase: `preventDefault()` (Auswahl darf nicht verloren gehen).
Blase verschwindet, sobald die Auswahl leer ist oder der Schalter aus ist.

### 5. Aktive Formatzustände

Bei `mouseup`, `keyup` und `focus` `document.queryCommandState('bold'|'italic'|'underline'|'strikeThrough')`
abfragen und B/I/U/S entsprechend hervorheben (nur neu rendern, wenn sich etwas geändert hat).

### 6. Einfügen filtern

`paste` abfangen (`preventDefault`):

- Merker `forcePlain` wird bei `keydown` mit `Ctrl/Cmd+Shift+V` gesetzt → dann nur
  `insertText` mit `text/plain`.
- Sonst `text/html` parsen, `style/script/meta/link/img/svg` entfernen und alles außer
  `B STRONG I EM U S STRIKE P BR UL OL LI A DIV SPAN H1 H2 H3 TABLE TBODY TR TD TH` auflösen.
- An den verbleibenden Elementen **alle** Attribute entfernen, außer `href` an `<a>`
  (damit gehen fremde Farben, Schriftgrößen und Klassen weg — das war die Ursache des
  „gelben Wiki-Textes").
- `H1..H3` → `<p><strong>…</strong></p>`.
- Ergebnis per `insertHTML` einsetzen.

### 7. Formatierung entfernen

`removeFormat` allein lässt Links und Inline-Styles stehen. Deshalb zusätzlich:
`unlink`, dann über die betroffenen Elemente (Auswahl per `range.intersectsNode`, ohne
Auswahl über die ganze Fläche) `color`, `background-color`, `background`, `font-size`,
`font-family`, `text-shadow` entfernen und `<a>`-Elemente auflösen.
Bausteine (`[data-block]`) dabei **auslassen**.

### 8. Speicherstand

`input` → „Wird gespeichert …"; 1200 ms nach der letzten Eingabe → „Gespeichert · HH:MM".
Der Speichern-Button setzt den Zustand sofort. (Im Prototyp nur Anzeige — im Tracker an die
vorhandene Persistenz hängen.)

### 9. Tastatur

`Strg+B/I/U` (Browser-Standard), `Strg+Z` / `Strg+Y` über die Verlaufs-Buttons,
`Strg+Shift+V` = reiner Text, `Enter` = Block verlassen, `Shift+Enter` = Umbruch im Block.

---

## Design-Tokens

Alles aus den bestehenden Theme-Variablen; die folgenden Werte gelten im Dark-Theme:

| Token | Wert | Verwendung |
|---|---|---|
| `--gold` | `#d4af37` | Akzent, aktive Zustände, Menürahmen, Primärbutton |
| `--bg-card` | `#1a1a1a` | Editor-Container, Selects |
| `--bg-elevated` | `#252525` | Werkzeugleiste, Statuszeile |
| Schreibfläche | `#111` | Papierfläche (dunkler als Karte) |
| Menüfläche | `#2b2b2b` | Aufklapp-Menüs, Blase |
| `--border` | `#3a3a3a` | Rahmen, Trenner, Tabellenlinien |
| `--text` | `#e0e0e0` | Text |
| `--text-dim` | `#888` | Sekundärtext, inaktive Icons |
| Platzhalter | `#5f5f5f` | leerer Editor, Hinweise |
| Markerfarben | `#fbbf24` `#7ec4cf` `#4ade80` `#ef4444` | Marker (immer mit `#141414` Schrift) |
| Hover-Tint | `rgba(212,175,55,.14)` | Icon-Hover |
| Aktiv-Tint | `rgba(212,175,55,.18)` | aktives Format, offenes Menü |
| Löschen-Tint | `rgba(239,68,68,.12)` | „Format entfernen"-Hover |

Maße: Radius **0** überall · Icon-Button 30×30 · Icon 15 px · Blasen-Button 28×28 ·
Swatch 24×24 (Leiste: 11×11) · Leistenhöhe 43 px · Trenner 1×18 px, Margin `0 6px` ·
Gap in der Leiste 2 px · Schriftgrößen 11 / 12 / 13 / 15 px · Editor `15px/1.7 Georgia, serif`.

Schatten: Menüs/Blase `0 14px 34px rgba(0,0,0,.65)`, Block-Handle `0 6px 18px rgba(0,0,0,.6)`.

## Assets

Keine Bilddateien. Icons sind Lucide-Pfade, inline als SVG (`stroke-width:2`,
`stroke-linecap:round`): undo, redo, list, link, message-square (Blase), grid (Bausteine),
trash (Format entfernen). Die Emoji-Icons des Alt-Zustands (🧹, 📖, 📊) fallen weg.

## Dateien in diesem Bündel

- `Texterstellung Prototypen.dc.html` — der Prototyp. Ganz oben Runde 2 (**2a**, die
  umzusetzende Variante), darunter Runde 1 mit den drei Ausgangsrichtungen
  (1a einzeilig, 1b nur Blase, 1c Reiter) als Begründung der Entscheidung.
  Die Logikklasse am Dateiende enthält alle oben beschriebenen Algorithmen im Original.
- `alt-zustand.png` — Screenshot der bisherigen Texterstellung (drei zentrierte Reihen).
- `screenshots/01-leiste-weit.png` — 2a über 900 px: alles inline, Leiste 43 px.
- `screenshots/02-leiste-900.png` — ≤ 900 px: Verlauf und Schrift/Größe im ⋯, Leiste bleibt einzeilig.
- `screenshots/03-leiste-680-mit-menu.png` — ≤ 680 px: nur B/I/U/S, Marker- und Bausteine-Icon,
  Format löschen und ⋯; das geöffnete ⋯-Menü zeigt die ausgelagerten Werkzeuge.

## Umsetzung im Tracker

Die App enthält aktuell drei Toolbar-Stufen (`.editor-toolbar-minimal|-mid|-full`), die über
`.toolbar-row:nth-child()` Reihen ausblenden. 2a ersetzt dieses Konzept:

- eine Reihe, Stufen über **Gruppen** (`data-tb`) statt über Reihen,
- `.toolbar-row` entfällt; `.editor-toolbar` wird `flex-direction: row`,
- die Tier-Klassen können bleiben und nur noch steuern, **welche Gruppen** im Markup stehen
  (Minimal = Gruppe 2 + Format löschen; Mid = + Struktur/Typo; Full = alle),
- Buttons behalten das bestehende `data-action`/`data-cmd`/`data-editor`-Schema, damit die
  vorhandene Event-Delegation weiterläuft; neu hinzu kommen Aktionen für Bausteine,
  Marker-Farbwahl, Block-Handle, Blase-Toggle und Paste-Filter.
