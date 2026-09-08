---
review_scope: Zwischenarbeit nach v1.2 (30 Commits, v1.2..HEAD)
review_date: 2026-09-08
depth: standard
files_reviewed: 58
reviewers: 7 (nach Domäne aufgeteilt)
findings_total: 24
findings_confirmed: 14
findings_refuted: 4
findings_deferred: 6
fixes_applied: 14
---

# Code-Review: Zwischenarbeit nach v1.2

## Warum dieser Bericht nicht in einem Phasenordner liegt

`/gsd-code-review` erwartet eine Phasennummer. Es gibt hier keine: die beiden
Design-Handoffs liefen außerhalb des GSD-Ablaufs — keine Phase, kein Plan, kein
SUMMARY (siehe `PROJECT.md` § „Zwischenarbeit nach v1.2"). Alle v1.2-Phasen sind
archiviert und wurden bei ihrer Ausführung bereits reviewt. Ungeprüft war genau
dieser eine Bestand, deshalb ist er der Scope.

**Umfang:** 58 Quelldateien, +8521/−3153 Zeilen zwischen Tag `v1.2` und `HEAD`.
Ausgenommen: `tests/`, `.planning/`, `dist/`, `Anpassungen/`.

**Verfahren:** sieben Reviewer nach Domäne (Editor-Kern, Build/Aktionen,
Features A/B, CSS-Kern, CSS übrige, Templates). **Jeder Befund wurde vor dem Fix
gegen den Live-Code oder — wo es um Sichtbarkeit und Verhalten ging — gegen das
gebaute Bündel im Browser gegengeprüft.** Vier Befunde haben diese Gegenprobe
nicht überstanden und sind unten als widerlegt verzeichnet.

---

## Behoben

### C-01 · Critical · Der Import war app-weit tot

`assets/templates/*.html` (12 Stellen in 6 Dateien)

Die Datei-Eingabefelder trugen `data-on-change="import-data"`. `dataset.onChange`
liefert diesen Wert unverändert, und `ALLOWED_CHANGE_HANDLERS`
(`ui/event-delegation.js:9`) führt `importData` — die Prüfung schlug fehl, der
Handler wurde blockiert, `importData()` lief nie.

**Am echten Ereignispfad gemessen** (Change-Event auf dem gebauten Bündel,
`window.importData` durch eine Attrappe ersetzt):

```
datasetOnChange: "import-data"
importDataAufrufe: 0
konsole: "[EventDelegation]: Error: Blocked unauthorized onChange handler: import-data"
```

Betroffen waren **alle zwölf** Import-Felder, nicht nur die drei neuen der
Zwischenarbeit — neun sind vorbestehend (Beute, Zauber, Wiki, NSCs, Orte, Quests,
Charaktere, Begegnungen, Verweise). Es gab keine einzige korrekt geschriebene
Gegenstelle, also auch keinen funktionierenden Referenzfall.

Ein bloßes Aufnehmen von `'import-data'` in die Whitelist hätte **nicht**
gereicht: die Ausführung sucht danach `window['import-data']`, das es nicht gibt.
Richtig ist die Schreibweise im Markup, denn `window.importData` existiert und
steht bereits in der Liste.

**Fix:** alle 12 Attributwerte auf `importData`.
**Nachgemessen:** 12 Felder neu, 0 alt, `importData`-Aufrufe **1** (vorher 0).

---

### C-02 · Critical · Zwei Münzsorten waren farbgleich

`assets/styles/party.css:1660,1664` · `assets/styles/variables.css`

Beim Token-Umbau landeten Platin (`#b8860b`) **und** Kupfer (`#cd7f32`) auf
`var(--gold-dim)`; Silber (`#c0c0c0`) wechselte auf `var(--text)`. Im Browser
gemessen trugen `.cf-coin-item.pm` und `.km` denselben Wert `rgb(166,138,42)` —
im Finanz-Widget waren Platin- und Kupfermünzen nicht mehr unterscheidbar.

**Fix:** `--coin-pm/-gm/-sm/-km` in `:root` mit den v1.2-Werten, `party.css`
darauf umgestellt. Nachgemessen: vier verschiedene Farben, zeichengleich zu v1.2.

---

### C-03 · Critical · Fünf Attribute hatten je nach Widget eine andere Farbe

`assets/styles/dashboard.css:2559-2564`

F-04 führte `--attr-*` ein, um zwei DM-Screen-Widgets zu vereinheitlichen, und
übersah das dritte (Schnellreferenz-Modal). Die `--attr-*`-Token sind feste
Hexwerte, die dort verwendeten Palettentoken dagegen themeabhängig:

| Attribut | Token | Widget | gemessen |
|---|---|---|---|
| STR | `var(--red)` | `var(--red)` | gleich |
| DEX | `#22c55e` | `--green` | `rgb(34,197,94)` ≠ `rgb(74,222,128)` |
| CON | `#f59e0b` | `--orange` | `rgb(245,158,11)` ≠ `rgb(251,146,60)` |
| INT | `#3b82f6` | `--cyan` | `rgb(59,130,246)` ≠ `rgb(126,196,207)` |
| WIS | `#a855f7` | `--purple` | `rgb(168,85,247)` ≠ `rgb(167,139,250)` |
| CHA | `#ec4899` | `--pink` | `rgb(236,72,153)` ≠ `rgb(244,114,182)` |

Dieselbe Doppelführung, die beim Schadensarten-Satz zum acid/poison-Tausch
geführt hat — und die dieser Design-Durchgang beseitigen sollte. Im
Kontrast-Theme wächst die Abweichung, weil `--attr-*` fest bleibt.

**Fix:** `.attr-*` auf `var(--attr-*)`. Nachgemessen: **0 Abweichungen.**

---

### W-01 · Kategorie „Information" wechselte die Farbe

`assets/styles/loot.css:678` · `assets/styles/variables.css`

Vierzehn Warenkategorien standen in v1.2 als Hex-Literale da. Dreizehn bekamen
ein `--cat-*`-Token mit unverändertem Wert; `info` allein wurde auf `var(--cyan)`
umgebogen — aus dem Braun `#795548` wurde Cyan. Der Kommentar in `variables.css`
zählte `info` fälschlich zu den Kategorien, die „bereits über Palettentokens
laufen"; in v1.2 tat sie das nachweislich nicht.

**Fix:** `--cat-info: #795548` ergänzt, Kommentar richtiggestellt.
Nachgemessen: `rgb(121,85,72)`.

---

### W-02 · Der Goldknopf reagierte nicht auf Überfahren

`assets/styles/core.css:526`

```css
.btn-gold        { background: var(--gold); border-color: var(--gold); … }
.btn-gold:hover  { background: var(--gold); border-color: var(--gold); }
```

Identische Werte — ein Hover ohne Wirkung. In v1.2 stand dort `#c5a028`, ein
dunkleres Gold. Beim Token-Umbau wurde es durch das **Basis**-Gold ersetzt.

**Fix:** `var(--gold-dim)`, das sich in allen vier Themes vom Basiswert
unterscheidet (`#a68a2a` / `#8b6914` / `#6b3410` / `#ccac00`).

---

### W-03 · Der Rahmen-Baustein überlebte das Speichern nicht

`ui/editors/rich-text.js:350` · `assets/styles/editors.css`

`setBorderFormat()` setzt `border-radius` und `display: inline-block` als
Inline-Stil. Beide fehlen in der Stil-Erlaubnisliste von `sanitizeHTML()`
(`utils/basic.js:104-119`), und für `.editor-border` existierte **keine**
CSS-Regel. Der Rahmen sah bis zum ersten Speichern richtig aus und war danach
eckig und zurück im Fließtext — exakt der Fehlermodus, den `CLAUDE.md` für
Bausteine beschreibt.

**Fix:** Klassenregel in `editors.css` (Klassen überstehen den Filter). Das
Markup bleibt unverändert, damit das eingefrorene Netz nicht bricht.

**Teilweise widerlegt:** der Bericht nannte auch den Marker. Der ist nicht
betroffen — eine globale `mark`-Regel (`dmscreen.css:1785`) setzt
`border-radius: var(--radius-sm)` bereits. Der Reviewer hat sie übersehen.

---

### W-04 · Die schwebende Werkzeugleiste fand ihr eigenes Tag nicht

`ui/editors/rich-text-toolbars.js:174,216`

Die Umschaltung nutzte `range.commonAncestorContainer.parentElement?.closest(tag)`
— genau das Muster, dessen Fehler der Kommentar von `closestEditorAncestor()`
(`rich-text.js:71`) beschreibt: ist der `commonAncestorContainer` bereits ein
Element, springt `.parentElement` eine Ebene zu weit, das Umschalten findet das
eigene Tag nicht und wickelt erneut ein. Die statische Leiste nutzt den Helfer
seit jeher.

**Risiko und wie es aufgelöst wurde:** `editor-floating.spec.js:375` erwartet
wörtlich `<b>Wort</b><b><b>Eins</b> WortZwei</b>` — verschachteltes `<b>`. Das
ist aber ein **anderer** Selektionsfall (Teilauswahl, die aus dem `<b>`
herausläuft); dort ist der `commonAncestorContainer` das Editor-Element und beide
Varianten liefern `null`. Entschieden hat nicht diese Analyse, sondern der Lauf:
**115/115 des eingefrorenen Netzes grün.**

---

### W-05 · Linkeingabe ohne Protokollprüfung

`ui/editors/rich-text-toolbars.js:203,470`

`link.href` wurde direkt aus `prompt()` gesetzt. Zwei Folgen, und die zweite ist
die im Alltag ärgerlichere:

1. Ein `javascript:`-Link existiert bis zum nächsten Speichern im DOM. Selbst-XSS
   — der Nutzer muss ihn selbst eintippen und anklicken —, der Sanitizer entfernt
   ihn beim Speichern.
2. Ein völlig vernünftiger `mailto:`-Link steht ebenfalls nicht in der
   Erlaubnisliste und verschwindet beim Speichern **kommentarlos**.

**Fix:** `isAllowedEditorHref()` in `rich-text.js`, Spiegel der Sanitizer-Regel,
an beiden Stellen vorgeschaltet, mit Hinweis-Toast statt stillem Verlust.
Nachgemessen: `javascript:` ✗, `mailto:` ✗ (jetzt mit Meldung), `https://` ✓,
`#anker` ✓.

---

### W-06 · Leere Auswahl erzeugte leere Kästen

`ui/editors/rich-text.js:341,358`

`setBorderFormat()` und `setReadAloudFormat()` prüften nur `rangeCount > 0`, nicht
`collapsed`. Ein bloßer Cursorklick fügte einen **leeren** Rahmen bzw. einen
leeren, farbigen Vorlese-Block ein — beim Vorlese-Block meldete der Toast dazu
noch Erfolg — und löschte die Auswahl, ohne eine neue Cursorposition zu setzen.
Jede andere Formatierfunktion derselben Datei prüft das bereits.

**Fix:** `collapsed`-Prüfung. Beim Vorlese-Block nur im Einwickel-Zweig, damit das
Entfernen per Cursor im Block weiter funktioniert.

---

### W-07 · Suche lief über rohes Markup

`render/helpers.js:443`

`filterBySearch()` vergleicht als reinen Teilstring, bekommt aber an zwei von drei
Aufrufstellen Felder herein, die als `sanitizeHTML(innerHTML)` gespeichert sind:
`session-prep strongStart`, `fraktionen agenda`/`beschreibung`. Eine Suche nach
„div" oder „class" traf das Markup; ein durch `<b>` geteiltes Wort wurde nicht
gefunden. **Zwei Reviewer fanden das unabhängig an verschiedenen Aufrufstellen** —
deshalb sitzt der Fix im Helfer, nicht in der einzelnen Ansicht.

**Fix:** Tags entfernen vor dem Vergleich, gleiches Muster wie `sessions.js:191`.
Ersetzt wird durch die leere Zeichenkette, nicht durch ein Leerzeichen, damit ein
an einer Formatierungsgrenze geteiltes Wort zusammenhängend suchbar bleibt.

---

### W-08 · Leere beschriftete Sektion nach Import

`systems/spellslots/import-export.js:162-163`

`verbuendete`/`rivalen` sind zur Laufzeit **Strings** (`fraktionen-crud.js:43-44`
schreibt `esc(el.value.trim())`), waren aber als `type: 'object'`, `default: []`
deklariert. Ein Import ohne diese Felder setzte `[]` — und weil ein leeres Array
in JS truthy ist, rendert `fraktionen-render.js:269` dafür eine leere,
beschriftete Sektion.

**Fix:** `type: 'string'`, `default: ''`. Zusätzlich die Typangaben von `szenen`,
`offeneFaeden`, `rufHistorie` von `object` auf `array` korrigiert.

---

### W-09 · Vorgabewerte wurden per Referenz herausgegeben

`systems/spellslots/import-export.js:278,417`

`obj[key] = … : field.default` — zwei importierte Datensätze ohne dasselbe Feld
teilten sich danach **ein** Array-Objekt; eine Änderung am einen schlug auf den
anderen durch und mutierte zusätzlich `IO_SCHEMA` selbst, das nicht eingefroren
ist.

**Einordnung:** vorbestehend. Sechzehn ältere Schema-Einträge tragen dasselbe
Muster, die fünf neuen setzen es fort. Der Fix an den Zuweisungsstellen räumt
beides zugleich ab.

**Fix:** `ioCloneDefault()`. Die CSV-Stelle (Zeile 332) blieb unangetastet — dort
wird der Wert sofort serialisiert und nicht gespeichert.

---

### W-10 · Das Sync-Werkzeug schrieb vor der Fehlerprüfung

`tools/sync-editor-toolbars.js:167`

`fs.writeFileSync` stand **innerhalb** der Dateischleife, `problems.length` wurde
erst **danach** geprüft. Eine nicht gefundene Leiste in der letzten Datei beendete
den Lauf mit Code 1, obwohl die vorherigen Dateien längst geschrieben waren —
„Fehler" hieß also nicht „nichts angefasst".

**Fix:** zwei Durchgänge; erst alles im Speicher aufbauen, nach der Prüfung
schreiben. `--check` schreibt weiterhin nichts.

**Ausdrücklich nicht wiedergefunden:** das historische Muster „Datei zum Schreiben
geöffnet, bevor die Transformation lief" (das einmal eine CSS-Datei geleert hat)
kommt hier nicht vor — der Inhalt wird vollständig berechnet, bevor geschrieben
wird.

---

### I-01 · Veralteter Kommentar

`systems/spellslots/import-export.js:522` beschrieb das abgelöste
`${key}-io-count`-Schema und widersprach dem Kommentar direkt darunter. Entfernt.

---

## Widerlegt

Vier Befunde haben die Gegenprobe nicht überstanden. Sie stehen hier, weil ein
nicht dokumentierter Fehlalarm beim nächsten Review erneut Zeit kostet.

| Befund | Behauptung | Gegenprobe |
|---|---|---|
| CSS-Kern CR-01 | `.form-group label` ersatzlos gelöscht, 159 Formularbeschriftungen ohne Regel | **Am Bündel gemessen:** `color: rgb(212,175,55)`, `display: block`, `font-weight: 500`. Die Regel überlebte den F-18-Zusammenzug in `dmscreen.css:1581`, die drei Eigenschaften sind dort kommentiert übernommen. Der Reviewer sah nur den `core.css`-Diff und suchte den Gewinner des Zusammenzugs nicht. |
| CSS-Kern WR-02 | `.btn-danger:hover`/`.btn-success:hover` ersatzlos gelöscht statt korrigiert | Beide leben in `dmscreen.css:1487/1493`. `.btn-success:hover` nutzt korrekt `var(--green-dim)` — der Hellthema-Defekt ist sauber behoben, nicht weggelöscht. |
| Editor W-03 (Marker-Hälfte) | Marker verliert `border-radius` beim Speichern | Eine globale `mark`-Regel (`dmscreen.css:1785`) setzt `border-radius: var(--radius-sm)`. Nur `.editor-border` war betroffen. |
| Features A IN-01 (Teil) | Falsche Typangaben seien folgenlos | Der `default: []`-Teil ist **nicht** folgenlos (siehe W-08/W-09) — hier war der Befund zu milde, nicht zu streng. |

---

## Offen, bewusst nicht angefasst

### O-01 · Kontrast der Gold- und Warnknöpfe in zwei Themes

Gemessen am gebauten Bündel (WCAG-Relativluminanz; 4,5:1 für Text, 3:1 für
Bedienelemente):

| Theme | `.btn-primary` | `.btn-warning` | `.btn-success` | `.btn-danger` |
|---|---|---|---|---|
| Standard | 9,24 | 9,18 | 11,15 | 4,07 |
| **Hell** | **2,98** | **2,40** | 3,02 | 3,94 |
| **Sepia** | 5,65 | **2,62** | **2,55** | 3,77 |
| Kontrast | 14,97 | 14,82 | 15,30 | 3,98 |

Ursache ist `color: var(--bg-dark)` auf goldenem Grund: `--bg-dark` ist ein
**Hintergrund**-Token und im hellen Theme `rgb(245,245,245)`, also fast weiß.

**Warum nicht behoben:** das ist vorbestehend — `.btn-gold` trug dieselbe
Konstruktion schon in v1.2. Neu ist nur die Reichweite: `.btn-primary` (F-13/F-14)
trägt sie jetzt in die Primäraktion jeder Ansicht. Eine Korrektur bedeutet, die
Vordergrundfarbe der Knöpfe **pro Theme** neu zu bestimmen — im Sepia-Theme ist
`--gold` ein dunkles Braun, dort wäre ein dunkler Vordergrund falsch. Ein fester
Wert löst es also nicht. Das ist eine Gestaltungsentscheidung über das Aussehen
der Anwendung, keine mechanische Fehlerkorrektur, und gehört dem Nutzer.

**Vorschlag:** ein `--on-gold`-Token je Theme (dunkel bei hellem Gold, hell bei
dunklem Braun), verwendet von `.btn-primary`/`.btn-gold`. Additiv, ohne
Nebenwirkung auf die sechs bestehenden `--on-accent`-Verwendungen.

### O-02 · Zwei unausgeglichene Tags in Templates

`view-tools.html:307` (verwaistes `</section>`) und `view-party.html:589`
(ein `</div>` zu viel). Beide nachweislich schon in v1.2 vorhanden, beide
außerhalb der geänderten Zeilen. Die Reihenfolge in `loader.js` `TEMPLATES` hängt
an solchen Ungleichgewichten — das ist der Grund, warum `view-welt.html` vor
`view-tools.html` einsortiert werden musste. Anfassen sollte man das mit einem
eigenen Plan und einem Bündel-Vergleich, nicht nebenbei.

### O-03 · Kleinere Härtung des Sync-Werkzeugs

`--only=<tippfehler>` läuft still ins Leere und meldet Erfolg; kein `try/catch`
um `readFileSync`; das Schreiben ist nicht atomar (kein temp+rename). Alle drei
sind Entwicklerwerkzeug-Komfort, keine Nutzerprobleme; das Risiko ist durch die
Versionierung gedeckt.

### O-04 · Tote Selbstbezug-Fallbacks

Rund 44 `var(--x, var(--x))` in fünf CSS-Dateien. Der Fallback greift nie,
harmlos, aber inkonsistent zu den Stellen, an denen derselbe Durchgang die
Fallbacks korrekt entfernt hat. Reine Kosmetik.

---

## Gates

Vollständig gemessen, vor und nach den Korrekturen:

| Gate | Vorher | Nachher |
|---|---|---|
| Jest | 1217/1217 (53 Suiten) | **1217/1217** |
| Playwright | 352 bestanden / 2 übersprungen | **352 / 2** |
| davon eingefrorenes Editor-Netz | 115/115 | **115/115** |
| eslint | 0 Fehler / 366 Warnungen | **0 / 366** |
| tsc | sauber | **sauber** |
| pytest (Build) | 24/24 | **24/24** |
| `sync-editor-toolbars --check` | 22 synchron | **22 synchron** |

`eslint.generated-globals.js` wurde nach dem Hinzufügen von
`isAllowedEditorHref` per `npm run globals:generate` neu erzeugt — ohne das
meldete `no-undef` zwei Fehler und `eslint-globals-freshness.test.js` schlug fehl.
Beide Bündel sind aus dem vollständigen Quellstand neu gebaut.
