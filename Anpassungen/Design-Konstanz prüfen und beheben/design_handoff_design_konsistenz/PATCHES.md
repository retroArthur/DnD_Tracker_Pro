# Patches — konkrete Umsetzung

Alle Snippets sind für die geprüfte Fassung geschrieben. **Über die Such-Anker gehen, nicht über Zeilennummern.**
Wenn die modularen Quelldateien existieren, gehören die CSS-Blöcke in die jeweilige Modul-CSS (Tokens in die Basis-/Theme-Datei) und nicht ans Bündel-Ende.

---

## §1 — F-01: fehlende Tokens nachtragen

**Anker:** `--shadow: rgba(0,0,0,0.5);` (letzte Zeile des `:root, [data-theme="dark"]`-Blocks)

Direkt nach dieser Zeile, **noch innerhalb** des Blocks, einfügen:

```css
    /* ── Aliase für das zweite, historisch gewachsene Token-Set ───────────
       Die Module wp-/tl-/rs-/fr-/npcg- lesen diese Namen. Sie waren nie
       definiert (56 Zugriffe ohne Fallback → transparente Flächen,
       Radius 0, fehlende Abstände). Zielbild: dieser Block verschwindet,
       sobald die Module direkt die Basis-Tokens benutzen. */
    --bg:            var(--bg-dark);
    --bg-alt:        var(--bg-elevated);
    --bg-input:      var(--bg-dark);
    --surface:       var(--bg-card);
    --surface-alt:   var(--bg-elevated);
    --surface-hover: var(--bg-hover);
    --border-color:  var(--border);
    --border-light:  var(--bg-hover);
    --text-light:    var(--text);
    --teal:          var(--cyan);

    /* Abstands- und Radius-Skala (F-06); px, wie der Bestand */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 12px;
    --space-lg: 16px;
    --space-xl: 24px;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius:    10px;   /* Bestandswert von .loc-item/.npc-item */

    /* Hover-/Dim-Stufen, aus den Basisfarben gemischt statt neu erfunden */
    --gold-hover:  color-mix(in srgb, var(--gold) 85%, #fff);
    --green-hover: color-mix(in srgb, var(--green) 85%, #000);
    --red-dim:     color-mix(in srgb, var(--red) 70%, #000);

    /* rgba()-Kanäle — MÜSSEN als Zahlentripel vorliegen */
    --gold-rgb:  212, 175, 55;
    --green-rgb:  74, 222, 128;
    --red-rgb:   239,  68,  68;
```

**Wichtig, wenn es weitere Themes/`[data-theme="…"]`-Blöcke gibt:** die Aliase gehören in **jeden** Theme-Block, sonst zeigen helle Themes wieder den alten Zustand. Sauberer: die Alias-Zeilen in einen eigenen `:root`-Block *nach* allen Theme-Blöcken legen und nur auf Variablen verweisen (Vererbung erledigt den Rest).

**Aufräumen im selben Schritt:** `rgba(var(--gold-rgb, 180, 140, 60), …)` → `rgba(var(--gold-rgb), …)` (3 Stellen; der abweichende Fallback `180,140,60` ist ein dritter Goldton und verschwindet damit).

**Nicht anfassen:** `--hp-pct`, `--map-zoom`, `--migration-hint-height` werden zur Laufzeit gesetzt und haben bereits Fallbacks.

---

## §2 — F-07: die vier Welt-Views in den Container holen

**Anker:** `<section id="view-sessionprep"`, `<section id="view-kalender"`, `<section id="view-reise"`, `<section id="view-fraktionen"` — alle vier stehen **nach** `</main>`, direkt vor dem Modal-Block (`<div class="modal-overlay" id="filter-modal">`).

1. Die vier `<section class="view">…</section>` als Block ausschneiden.
2. Unmittelbar **vor** `</main>` wieder einsetzen (Reihenfolge beibehalten; Kommentare mitnehmen).
3. Die Kompensations-Paddings entfernen — das Padding kommt jetzt von `.main-content`:

```css
/* vorher */
.wp-view-content,
.tl-view-content,
.rs-view-content,
.fr-view-content { padding: var(--space-md, 1rem); }

/* nachher */
.wp-view-content,
.tl-view-content,
.rs-view-content,
.fr-view-content { padding: 0; }   /* oder die Regel ganz löschen */
```

4. `.fr-view-content` ist **zweimal identisch** definiert (F-18) — die Dublette löschen.
5. Prüfen, dass keine JS-Funktion die Views per `document.body.appendChild` o. Ä. verschiebt und dass `showView()`/`switchView()` weiterhin alle 30 Sections findet (Selektor ist `.view`, also unkritisch).

---

## §3 — F-13: fehlende Button-Varianten definieren

**Anker:** `.btn-sm { padding: 3px 8px; font-size: 11px; }`

Danach einfügen (Stil folgt dem Bestand: Outline auf `--bg-elevated`, gefüllt nur für bestätigende Aktionen):

```css
/* Sekundär: neutrale Kontur, tritt hinter Primär- und Gold-Buttons zurück */
.btn-secondary {
    background: transparent;
    border-color: var(--border);
    color: var(--text-dim);
}
.btn-secondary:hover {
    background: var(--bg-hover);
    border-color: var(--text-dim);
    color: var(--text);
}

/* Warnung: gelbe Kontur, gefüllt erst im Hover */
.btn-warning {
    border-color: var(--yellow);
    color: var(--yellow);
}
.btn-warning:hover {
    background: var(--yellow);
    color: var(--bg-dark);
}

/* Nur-Icon: quadratisch, ohne Kontur, Fläche ≥ 36px (Touch) */
.btn-icon {
    padding: 0;
    width: 36px;
    height: 36px;
    justify-content: center;
    background: transparent;
    border-color: transparent;
    color: var(--text-dim);
}
.btn-icon:hover {
    background: var(--bg-hover);
    color: var(--gold);
}
.btn-sm.btn-icon { width: 28px; height: 28px; }
```

Ergänzend für alle Buttons (Fokus ist derzeit Browser-Default):

```css
.btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
}
```

---

## §4 — F-02: eine Karten- und eine Listenzeilen-Klasse

**Anker:** `.loc-item {` (Bestandsdefinition) bzw. `.tl-event-card {`

Basisklassen anlegen (einmalig, im Komponenten-Teil des CSS):

```css
/* Listenzeile im Master-Panel — Bestandswerte von .loc-item/.npc-item/.loot-item */
.list-item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md) 14px;
    background: var(--bg-card);
    border: 2px solid transparent;   /* Slot für den Auswahl-Rahmen */
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
}
.list-item:hover    { border-color: var(--border); }
.list-item.selected { border-color: var(--gold); background: var(--bg-elevated); }

/* Inhaltskarte */
.card-surface {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: var(--space-md);
}
```

Dann die Duplikate darauf umstellen:

```css
.loc-item, .npc-item, .loot-item, .enc-item, .bestiary-item { /* → @extend .list-item */ }
.tl-event-card, .wp-card, .fr-card, .rs-card { /* → @extend .card-surface */ }
```

Ohne Präprozessor: die Selektoren an die Basisregel anhängen —

```css
.list-item,
.loc-item, .npc-item, .loot-item, .enc-item, .bestiary-item { … }

.card-surface,
.tl-event-card, .wp-card, .fr-card, .rs-card { … }
```

— und in den View-Blöcken nur noch das Besondere stehen lassen (z. B. `.tl-event-card { border-left: 3px solid var(--gold); }`, falls die Akzentleiste bewusst bleibt; dann bei **allen** Karten oder bei keiner).

---

## §5 — F-08 / F-09: Toolbar-Kontrakt

Verbindliche Reihenfolge für jede Listen-View (Bestandsmarkup, unverändert übernommen):

```html
<div class="section-toolbar">
    <div class="section-toolbar-identity">
        <span class="section-toolbar-title">📅 Timeline &amp; Kalender</span>
        <span class="section-toolbar-count" id="kalender-count">0</span>
    </div>
    <div class="section-toolbar-search">
        <div class="search-wrapper">
            <input type="text" id="kalender-search" class="toolbar-search"
                   placeholder="🔍 Ereignis suchen..."
                   data-action="search-input" data-render="renderTimeline">
            <button class="search-clear-btn" data-action="clear-search"
                    data-value="kalender-search" title="Suche leeren">✕</button>
        </div>
    </div>
    <div class="section-toolbar-filters">
        <div class="tl-filter-chips" id="kalender-filters"></div>
        <div class="section-toolbar-io">
            <button class="io-btn export" data-action="export-data"
                    data-value="timeline" title="Timeline exportieren">📤</button>
            <button class="io-btn import" data-action="trigger-click"
                    data-value="import-timeline" title="Timeline importieren">📥</button>
            <input type="file" id="import-timeline" class="io-file-input" accept=".json"
                   data-on-change="import-data" data-type="timeline">
        </div>
    </div>
    <div class="section-toolbar-actions">
        <button class="btn btn-primary" data-action="show-timeline-modal">+ Ereignis</button>
    </div>
</div>
```

Analog für **Session-Prep** (`sessionprep-search` → `renderSessionPrepList`, Typ `sessionPrep`), **Fraktionen** (`fraktionen-search` → `renderFraktionen`, Typ `fraktionen`) und **Reise** (Suche entfällt, aber Zähler und Primäraktion ergänzen — siehe F-09/F-10).

JS-Seite, in der jeweiligen `render*`-Funktion (Muster aus `renderLocations` übernehmen):

```js
const q = (document.getElementById('kalender-search')?.value || '').toLowerCase();
const list = events.filter(e =>
    !q || e.title.toLowerCase().includes(q) || (e.notes || '').toLowerCase().includes(q));
setViewCount('kalender', list.length);   // siehe §7
```

Für die acht Werkzeug-Views (Start, Würfel, Timer, Initiative, DM Screen, Soundboard, Statistiken, Daten): dieselbe Toolbar mit `section-toolbar-identity` und `section-toolbar-actions`; die Spezialsteuerung (`.encounter-controls`, `.dice-bar`, `.dms-quick-bar`) rutscht **unter** die Toolbar. `.dmscreen-header`, `.dice-hero`-Kopf und `.timer-hub`-Kopf verlieren dabei ihre eigenen Titelzeilen.

---

## §6 — F-14: eine Primäraktion

1. `.btn-primary` als echte Variante definieren (bisher nur `white-space: nowrap`):

```css
.btn-primary {
    white-space: nowrap;
    background: var(--gold);
    border-color: var(--gold);
    color: var(--bg-dark);
    font-weight: 600;
}
.btn-primary:hover {
    background: var(--gold-hover);
    border-color: var(--gold-hover);
}
```

2. Alle „+ Neu…"-Buttons auf `btn btn-primary` umstellen — betrifft u. a.:
   `+ Neuer Ort`, `+ Monster`, `+ NPC`, `+ Item`, `+ Encounter`, `+ Quest`, `+ Shop`, `+ Link`, `+ Zauber`.
3. `btn-success` bleibt nur für bestätigende Aktionen (Speichern, Abschließen, Rasten), `btn-gold` wird dadurch redundant → auf `btn-primary` mappen.
4. `.btn-primary.migration-btn-next` (eigene Padding-/Radius-Werte) auf die Basisvariante zurückführen.

---

## §7 — F-10: ein Zähler-Schema

1. Alle Zähler-IDs auf `<view>-count` umbenennen (`view` = Wert aus `data-view` der Navigation):
   `party-io-count` → `party-count`, `locations-io-count` → `locations-count`, … , `bestiary-count` bleibt.
2. Einen Helper einführen und alle direkten `textContent`-Zuweisungen darauf umstellen:

```js
function setViewCount(view, n) {
    const el = document.getElementById(view + '-count');
    if (el) el.textContent = n;
}
```

3. Reise bekommt einen Zähler (Anzahl geplanter Reisen/Etappen) und eine Primäraktion (`+ Neue Reise`).

---

## §8 — F-11: ein Master-Detail-Layout

```css
.master-detail {
    display: grid;
    grid-template-columns: 1fr 825px;
    gap: 0;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}
@media (max-width: 1200px) { .master-detail { grid-template-columns: 1fr 520px; } }
@media (max-width: 900px)  { .master-detail { grid-template-columns: 1fr; overflow: visible; } }
```

Dann `.loc-layout`, `.npc-layout`, `.loot-layout`, `.enc-layout`, `.bestiary-layout` durch `.master-detail` ersetzen (Klasse im Markup ergänzen, view-spezifische Grid-Regeln und ihre Media Queries löschen — `.enc-layout` hat vier Definitionen, `.npc-layout` und `.loot-layout` je drei).

`.fr-layout` (`320px 1fr`) auf dieselbe Achse drehen: Liste links, Detail rechts, gleiche Kette.

Das Detail-Panel bekommt ebenfalls eine gemeinsame Klasse (Bestandswerte aus `.loc-detail`):

```css
.detail-panel {
    background: var(--bg-card);
    border-left: 1px solid var(--border);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: calc(100vh - 120px);
    align-self: start;
}
@media (max-width: 900px) { .detail-panel { display: none; } }
```

---

## Reihenfolge-Hinweis
§1 zuerst und allein committen — danach sind die Welt-Views bereits sichtbar konsistent, und alle folgenden Patches lassen sich einzeln zurückrollen.
