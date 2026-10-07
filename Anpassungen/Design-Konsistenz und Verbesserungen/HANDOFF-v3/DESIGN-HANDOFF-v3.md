# Design-Handoff v3 — Konsistentes, stabiles Design-System für den D&D Kampagnen-Tracker Pro

**Stand:** 27.09.2026 · **Ersetzt:** `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/` (BEFUNDE-v2, PATCHES, CHECKLISTE) als Arbeitsgrundlage
**Bleibt gültig:** `.planning/HANDOFF-V2-VERIFIKATION.md` (Messgrundlage, 13 Blocker), `.planning/HANDOFF-V2-GEGENPROBEN.md`, alle Ergebnisse der Phase 15 (Löschlauf, drei Bugfixes, Ratschen-Basiswerte in `15-RATCHET-BASELINE.md`)
**Visuelle Referenz:** `Design-Übersicht.dc.html` (Tokens, Kontraste live gerechnet, Komponenten in vier Themes) und `Ist-Zustand App.dc.html` (24 Ansichten mit dem echten Stylesheet, Theme/Ansicht per Tweaks)

---

## 0 · Auftrag in drei Sätzen

Die App hat vier Themes, aber nur eines wurde je angeschaut: Dark. Farbe, Schatten, Schriftgröße, Bewegung und Fokus liegen als **Sammlungen** vor (390 rgba-Literale, 65 Schatten, 50 Schriftgrößen, 8 Dauern, 37 abgeschaltete Fokusringe), nicht als **Skalen**. Dieser Handoff legt das Soll-System als Token-Satz und Komponentenverträge fest und führt den Bestand in sechs Wellen darauf — ohne Redesign, ohne neue Features, jede Welle mit eigener Test-Ratsche und einer Sichtung in allen vier Themes.

Wo v3 von v2 abweicht, liegt es daran, dass v2 an sieben von neun Rezepten nachweislich defekt war (Verifikation 08.09.2026). v3 übernimmt die **Diagnosen** von v2, die **Zahlen** der Verifikation und ersetzt die **Rezepte** vollständig.

---

## 1 · Ausgangslage

| Kennzahl (nachgemessen gegen HEAD, Phase 15 läuft) | Wert | Wirkung |
|---|---|---|
| `rgba()` mit Zahlentripel im Komponenten-CSS | 390 (143 Werte; 198 = Dark-Token, 25 fremde Theme-Palette, 66 palettenfremd) | Light/Sepia bekommen Dark-Farben |
| `color: var(--bg-dark)` auf Akzentfläche | 100 (gold 45, green 21, cyan 13, …) | Light: `.btn-primary` 2,98:1, `.btn-success` 3,02:1 |
| `color: white` auf Akzentfläche | 51 (25 auf --red, 13 auf --purple) | Dark: Weiß auf --green 1,74:1, auf --purple 2,72:1 |
| `box-shadow`-Deklarationen | 88 (65 Werte, 58 hartes Schwarz, `var(--shadow)` 1×) | Contrast-Theme: `--shadow` ist **weiß** |
| `transition: all` | 163 (8 Dauern, 12 Kurven) | je Ansicht anderes Tempo; opacity/visibility hängen an `all` |
| `font-size` in `em` | 784 (50 Größen) | 169 Elemente < 11px, Minimum 7,70px; Wurzel ist in BEIDEN Layout-Profilen 16px |
| `font-weight` | 285× 600, 92× 700, 54× 500, 14× bold, 3× normal, 1× 300 | 500 rendert unter Segoe UI als 400 |
| `outline: none` | 37 gegen 7 `:focus-visible` (eine globale Regel versteckt in `dmscreen.css`) | Tastatur ohne sichtbaren Ort |
| Chip-Familien für dieselbe Aufgabe | 5 (`.filter-chip`, `.npc-/.loc-/.enc-/.loot-filter-chip`, `.chip`, `.dice-chip`, `.dmg-chip`) | Filter sehen je Ansicht anders aus |
| Icon-Knopf-Höhen in Listen | 3 (`.btn-sm` 28px, `.btn-icon` 36px, `.loot-detail-btn`) | Aktionsleisten springen |
| `color-scheme` | 0 Treffer | Häkchen, Spinner, Bildlaufleisten in Dark/Contrast hell |

Testnetz: `tests/unit/design-consistency.test.js` 64/64 grün, `DUBLETTEN_MAX 0`, `IMPORTANT_MAX 105`, `INLINE_MAX 257` (nach Phase 15 gesenkt — Wert aus `15-RATCHET-BASELINE.md` übernehmen). **Das Netz prüft Deklarationstext, nie den berechneten Endwert** — deshalb konnte `--on-accent` 17 von 24 Theme-Zellen verfehlen, ohne dass etwas rot wurde.

---

## 2 · Arbeitsregeln (gelten für jede Welle)

1. **Refactoring im Bestand, kein Redesign.** Klassennamen, `data-action`/`data-render`/`data-value`, die Ereignisdelegation und die Navigationsstruktur bleiben. Emoji-Icons bleiben.
2. **Nur in den Modulen ändern:** `assets/styles/*.css`, `assets/templates/*.html`, `core/`, `features/`, `ui/`. Danach `python build.py` und `python build.py --production`. Nie im gebauten Bündel.
3. **Kein neuer Roh-Wert im Komponenten-CSS.** Farbe, Schatten, Größe, Dauer, Radius, Abstand, z-index kommen aus `assets/styles/variables.css`. Was dort fehlt, wird als Token angelegt — themenfolgend in den vier Theme-Blöcken, abgeleitet im Aliasblock (der steht bewusst NACH den Theme-Blöcken; F-01).
4. **Kontrast wird gerechnet, nicht gelesen.** Jede Farbänderung wird gegen ihre tatsächliche Trägerfläche (Kaskade!) in allen vier Themes nachgerechnet. Die Ratschen dazu stehen in §6. Zusätzlich ein Playwright-Lauf gegen das gebaute Bündel, der `getComputedStyle` misst (GATE-01-Harness).
5. **Ratsche vor Code.** Jede Ratsche wird zuerst rot bewiesen (Ausgangswert im Kommentar), dann grün gemacht (GATE-03). Bestehende Ratschen (F-01, F-03, F-14, DUBLETTEN_MAX, IMPORTANT_MAX) werden **vorher** angepasst, nicht im Rotlauf entschärft — die Konflikte sind in §5 je Welle benannt.
6. **Eine Welle = ein Commit-Paket**, dateiweise Zwischencommits wo möglich (Wellen 2, 3, 4, 6), **atomar** wo nötig (Welle 5 Typografie: Wurzelentscheidung und alle Ersetzungen in einem Commit).
7. **Abnahme dreistufig** (GATE-05, in `PROJECT.md` gebucht): (1) alle Suiten grün + Build; (2) Screenshot-Serie der Stellenliste der Welle × vier Themes; (3) menschliche Vier-Themes-Runde nach **jeder** Welle, ohne Verkürzung.
8. **Geltungsbereich pro Welle festlegen** (B-10): CSS-only oder auch Templates/JS. Ausnahmen, die NICHT angefasst werden: `features/shops/shop-export.js` (eigenständiges Druckdokument), der feste dunkle Editor-Marker (CLAUDE.md), die 65 `!important` in `.spell-desc *`.
9. **Begründete Ausnahmen bleiben begründet** — siehe §7. Jede Ausnahme steht mit Kommentar im CSS und in der Ausnahmeliste der Ratsche.
10. **Funktion ändert sich nicht.** Die einzige Verhaltensänderung ist sichtbarer Tastaturfokus (Welle 6). Tastatur-Erreichbarkeit (tabindex, role, Enter/Leertaste für 176 `div[data-action]`) ist ein **eigener JS-Strang** nach Welle 6, nicht Teil einer Designwelle.

---

## 3 · Soll-Design-System

### 3.1 Farbe

**Grundsatz:** Jede Farbe ist ein Token. Jedes Token existiert in allen vier Theme-Blöcken mit identischer Property-Menge (neue Ratsche: die vier Blöcke haben dieselben Schlüssel). Themenunabhängige Skalen (Schadensarten, Attribute, Warenkategorien, Wissensgebiete, Vorlese-Papier, Statblock-Pergament) bleiben im Aliasblock — aber **nur als Flächen- oder Rahmenfarbe**, nie als Textfarbe auf einer Theme-Fläche (D-03).

**Bestehende Rollen** (unverändert): `--bg-dark`, `--bg-card`, `--bg-elevated`, `--bg-hover`, `--border`, `--text`, `--text-dim`, `--gold`, `--gold-dim`, `--cyan`, `--green`, `--red`, `--yellow`, `--purple`, `--blue`, `--orange`, `--pink`.

**Neu — Tinte auf gefüllten Akzentflächen** `--on-<rolle>` (berechnet gegen die Fläche, WCAG ≥ 4,5:1; Werte aus `Design-Übersicht.dc.html`):

| Token | Dark | Light | Sepia | Contrast |
|---|---|---|---|---|
| `--on-gold` | `#111111` (8,98) | `#111111` (5,80) | `#ffffff` (7,10) | `#111111` (13,46) |
| `--on-gold-dim` | `#111111` (5,66) | `#ffffff` (5,09) | `#ffffff` (9,89) | `#111111` (8,51) |
| `--on-green` | `#111111` (10,84) | `#111111` (5,73) | `#111111` (5,89) | `#111111` (13,76) |
| `--on-red` | `#111111` (5,02) | `#ffffff` (4,83) | `#ffffff` (4,63) | `#111111` (4,72) |
| `--on-cyan` | `#111111` (9,61) | `#111111` (5,13) | `#111111` (5,98) | `#111111` (15,06) |
| `--on-yellow` | `#111111` (11,31) | `#111111` (6,43) | `#111111` (5,88) | `#111111` (17,58) |
| `--on-orange` | `#111111` (8,34) | `#111111` (5,30) | `#ffffff` (4,61) | `#111111` (7,50) |
| `--on-blue` | `#111111` (7,43) | `#ffffff` (5,17) | `#111111` (5,13) | `#111111` (4,97) |
| `--on-purple` | `#111111` (6,94) | `#ffffff` (5,70) | `#ffffff` (4,38 ⚠) | `#111111` (6,02) |
| `--on-pink` | `#111111` (7,13) | `#ffffff` (4,60) | `#ffffff` (4,55) | `#111111` (5,00) |

⚠ Sepia `--purple #6c71c4` erreicht mit keiner Tinte 4,5. Entscheidung nötig: `--purple` in Sepia auf `#6266bd` abdunkeln (dann `#fff` ≥ 4,5 — im Test gegenrechnen) **oder** als dokumentierte Ausnahme führen. Empfehlung: abdunkeln, die Fläche ist selten (Zustands-Chips).

Überraschung, die die Regel „Weiß auf Rot“ kippt: im **Dark**-Theme ist dunkle Tinte auf `--red` besser (5,02) als Weiß (3,76). `--on-accent: #ffffff` wird **abgeschafft**; die 6 Verwendungen gehen auf das passende `--on-<rolle>`.

**Abgeleitete Flächen** (`:hover`): `--gold-hover`, `--green-hover`, `--red-dim`, `--green-dim`, `--red-dark`, `--orange-dim` bekommen je ein `--on-*`-Pendant **oder** die Hover-Regel behält die Tinte der Ruhefläche und die Hover-Fläche wird so gewählt, dass die Tinte hält (einfacher; im Test prüfen — B-03 nennt `.btn-gold:hover` Light 4,67→3,71 und `.btn-success:hover` als Regressionspfade).

**Neu — Akzent als Textfarbe** `--<rolle>-text`: in Dark und Contrast ein Alias (`var(--gold)` …), in Light und Sepia abgedunkelt, **innerhalb der bestehenden Theme-Blöcke** (nicht in neuen Blöcken hinter dem Alias — F-01):

| Token | Light | Sepia |
|---|---|---|
| `--gold-text` | `#976e09` (4,62) | `#8b4513` (6,58, = --gold) |
| `--green-text` | `#12863d` (4,66) | `#687700` (4,61) |
| `--cyan-text` | `#07809d` (4,58) | `#217e77` (4,51) |
| `--yellow-text` | `#9e6c03` (4,57) | `#8d6b00` (4,60) |
| `--orange-text` | `#c94c0a` (4,64) | `#c34815` (4,57) |
| `--red-text` | `#dc2626` (4,83, = --red) | `#d3302d` (4,60) |
| `--blue-text` | `#2563eb` (5,17, = --blue) | `#2075b0` (4,60) |
| `--purple-text` | `#7c3aed` (5,70, = --purple) | `#666ab8` (4,51) |
| `--pink-text` | `#db2777` (4,60, = --pink) | `#c6337a` (4,68) |

Regel: `color: var(--gold)` steht nur noch auf Elementen, die **Rahmen oder Fläche** färben. Text bekommt `--gold-text`. Die 482 echten `color:`-Deklarationen werden danach klassifiziert (Trägerfläche `--bg-card`/`--bg-dark`/`--bg-elevated` → `-text`; Trägerfläche Akzent → `--on-*`; Sonderflächen → Ausnahme).

**Neu — Münz- und Attributfarben theme-fähig:** `--coin-pm/-gm/-sm/-km` und `--attr-str…cha` wandern aus dem Aliasblock in die vier Theme-Blöcke. Dark/Contrast behalten die heutigen Werte; Light/Sepia bekommen abgedunkelte (Rechenweg wie `--*-text`, Fläche `--bg-dark`). Unterscheidbarkeit der sechs Attribute bleibt Pflicht (Hue-Abstand ≥ 40°).

**Neu — Auflagen statt Weiß:** `--overlay-weak`, `--overlay-mid`, `--overlay-strong` pro Theme (Dark/Contrast: `rgba(255,255,255,.05/.1/.2)`, Light/Sepia: `rgba(0,0,0,.04/.08/.16)`). Ersetzt die 35 Weiß-Auflagen (u. a. `.nav-tab`).

**Neu — getönte Flächen:** `color-mix(in srgb, var(--gold) 20%, transparent)` ersetzt `rgba(212,175,55,.2)` und alle 156 Palettenauflagen. Damit **eine** Mechanik; die drei `--*-rgb`-Tokens, ihr Test (design-consistency.test.js:62/:77) und der Wartungskommentar in `variables.css:22-24` werden im selben Commit entfernt. Achtung: Chromium serialisiert `color-mix` als `color(srgb …)` — 7 `toHaveCSS`-Zusicherungen (wiki.spec.js:396, 6 Editor-Specs) sind mit anzupassen.

**Neu — `color-scheme`:** `color-scheme: dark` in Dark/Contrast, `light` in Light/Sepia, je eine Zeile im Theme-Block.

**Neu — Rahmen mit Kontrast:** `--border-input` pro Theme ≥ 3:1 gegen `--bg-dark` (Dark `#6b6b6b`, Light `#767676`, Sepia `#8a7a5a`, Contrast `#8c8c8c` — im Test gegenrechnen). `--border` bleibt für Karten und Trenner (Dekor darf unter 3:1 liegen).

### 3.2 Schatten

`--shadow` wird durch drei gestaffelte Stufen pro Theme ersetzt; Contrast bekommt **schwarze** Werte:

| Token | Rolle | Dark | Light | Sepia | Contrast |
|---|---|---|---|---|---|
| `--shadow-1` | Karte ruhend, Chip aktiv | `0 2px 8px rgba(0,0,0,.35)` | `0 1px 4px rgba(0,0,0,.10)` | `0 1px 4px rgba(60,40,10,.12)` | `0 0 0 1px #555` |
| `--shadow-2` | Hover, Dropdown, Popover | `0 4px 16px rgba(0,0,0,.45)` | `0 4px 12px rgba(0,0,0,.14)` | `0 4px 12px rgba(60,40,10,.16)` | `0 0 0 1px #777` |
| `--shadow-3` | Modal, Floating Panel | `0 12px 32px rgba(0,0,0,.6)` | `0 12px 32px rgba(0,0,0,.20)` | `0 12px 32px rgba(60,40,10,.22)` | `0 0 0 2px #aaa` |
| `--ring-gold` | Aktiv/Fokus-Ring | `0 0 0 3px color-mix(in srgb, var(--gold) 40%, transparent)` | (gleich) | (gleich) | `0 0 0 3px var(--gold)` |
| `--glow-gold/-green/-red/-purple` | Zustands-Glühen (Würfel-Krit, HP-kritisch, Konzentration) | `0 0 12px color-mix(in srgb, var(--<rolle>) 55%, transparent)` | … | … | … |

Sonderfälle bleiben mit Kommentar: 7 `inset`-Schatten auf `.read-aloud` (Papieroptik), 2 `@keyframes`-Zustände in `dice.css` (animierter Spread), 1 seitlicher Schatten `initiative.css:922` (Schublade → `--shadow-2` mit negativem X, als Token `--shadow-drawer`).

### 3.3 Typografie

**Schrift:** `--font-ui: 'Inter', 'Segoe UI', system-ui, sans-serif` (Empfehlung; Inter ist in `assets/fonts/` bereits in 400/500/600 gebündelt, Offline-fähig, identische Metrik auf allen Systemen, tabellarische Ziffern via `font-feature-settings: "tnum"` für HP-, Initiative- und Zählerspalten). Alternative Source Sans Pro (400/600) — schmaler, aber ohne 500. `--font-mono` und `--font-serif` unverändert. → Offene Entscheidung §8.

**Größenskala** in px (Wurzel bleibt 16px; kein `rem`, weil F-03 `rem` außerhalb `fonts.css` verbietet und die Browser-Grundgröße des Nutzers unangetastet bleiben soll — B-01/B-02):

| Token | px | Rolle |
|---|---|---|
| `--text-xs` | 11 | Metazeile, Zähler, Badge, Tabellenkopf — **nichts darunter** |
| `--text-sm` | 12 | Knöpfe, Nav-Reiter, Chips, Tabellenzellen |
| `--text-md` | 14 | Fließtext, Eingaben, Listenzeilen (heutiger De-facto-Standard, 81×) |
| `--text-lg` | 16 | Kartentitel, Modal-Titel, Statblock-Fließtext |
| `--text-xl` | 20 | Ansichtstitel, Statblock-Name |
| `--text-2xl` | 26 | Dashboard-Kennzahl, Rundenzähler, Timer-Karte |
| `--text-3xl` | 34 | Timer-Hero, Würfelergebnis (`.dice-hero-result` heute 5em ≈ 80px → eigene begründete Ausnahme `--text-hero: 72px`) |

`--font-size-base/-small/-title` (Layout-Profil-Tokens) werden entfernt; das Mobil-Profil skaliert künftig **nicht** die Schrift (heute tut es das faktisch auch nicht — B-01), sondern nur Abstände und Trefferflächen (`min-height: 44px` bleibt).

**Gewichte:** 400 Fließtext · 500 Label, Nav-Reiter, Chips · 600 Titel, Zahlen, aktive Zustände. `700`, `bold` → 600; `normal` → 400; `300` (`.cf-hp-divider`) → 400. Die Doppelzeile `spells.css:338-339` (`700 !important` + `bold !important`) wird gelöscht (senkt IMPORTANT auf 104). Editor-Fett (`<b>` 700) und Ausgabe-Fett (`strong` 600 !important) werden auf **600** vereinheitlicht — derselbe Text sieht beim Tippen und nach dem Speichern gleich aus.

**Zeilenhöhe:** `1.5` Fließtext (body, unverändert), `1.2` Titel und Zahlen, `1.35` Listenzeilen — drei Werte als `--leading-tight/-snug/-normal`.

### 3.4 Abstand, Radius, Stapel — bestehend, bleibt

`--space-xs…xl` (4/8/12/16/24), `--radius-sm/md/lg` (4/8/12) + 50 % / 999px, `--z-sticky…toast` (7 Stufen), Breakpoints 600/900/1200 — alles aus Welle 1–3 des ersten Audits, unverändert. Neue Komponenten benutzen ausschließlich diese Leitern.

### 3.5 Bewegung

| Token | Wert | Rolle |
|---|---|---|
| `--dur-fast` | 120ms | Druckeffekt, Hover-Farbe, Chip-Toggle (ersetzt 0.08/0.1/0.12/0.15 s) |
| `--dur` | 200ms | Standard (ersetzt 0.2/0.25 s) |
| `--dur-slow` | 300ms | Panels ein-/ausfahren, Modal, Mobil-Nav (ersetzt 0.3/0.5 s) |
| `--ease` | `ease` | **bleibt `ease`** — eine neue Kurve würde das Bewegungsgefühl von 263 impliziten Übergängen ändern (B-09); nur die 12 expliziten Varianten werden auf `--ease` bzw. eine dokumentierte `--ease-out` gemappt |
| `--trans-std` | `background-color var(--dur) var(--ease), border-color var(--dur) var(--ease), color var(--dur) var(--ease), opacity var(--dur) var(--ease), transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease), filter var(--dur) var(--ease)` | ersetzt `transition: all` an ~150 mechanischen Stellen |
| `--trans-reveal` | `--trans-std` + `visibility var(--dur) var(--ease)` | für die drei ein-/ausblendenden Overlays (`dice.css:603`, `dmscreen.css:1017`, `dashboard.css:2317`) |

`prefers-reduced-motion`: der bestehende globale Block (nach Phase 15 in `core.css`) bleibt die einzige Regel; `scroll-behavior: auto !important` darin entfällt (wirkungslos gegen `scrollIntoView({behavior})`).

### 3.6 Fokus

Eine Weltregel in `core.css`, dokumentiert, mit Spezifität (0,1,0) — **nicht** `:where()`:

```css
:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
```

Die 33 `.x:focus { outline: none }`-Regeln werden auf `.x:focus:not(:focus-visible)` umgeschrieben (Mausklick ruhig, Tastatur sichtbar). Eingabefelder mit `border: none` (`.cf-combat-value input`) bekommen `box-shadow: var(--ring-gold)` statt Rahmenfarbe. `border-radius` aus der globalen Regel streichen (verursachte Formsprung `.nav-tab` 12→4px).

### 3.7 Komponentenverträge

Jede Komponente hat **eine** Basisklasse, Modifikatoren für Bedeutung, und liest nur Tokens. Bestehende Klassennamen bleiben als Aliase, bis die Templates nachgezogen sind.

**Button `.btn`** — Höhe 32px (Basis), `.btn-sm` 28px, `.btn-xs` 24px, `.btn-icon` quadratisch **32px** (Basis) / 28px (`.btn-sm.btn-icon`); Schrift `--text-sm`, Gewicht 500; Radius `--radius-sm`; `--trans-std`.
Varianten und ihre Tinte: `.btn` Kontur Gold auf `--bg-elevated`, Text `--gold-text` · `.btn-primary`/`.btn-gold` Fläche `--gold`, Tinte `--on-gold` · `.btn-success` Fläche `--green`, Tinte `--on-green` · `.btn-danger` Kontur `--red`, Text `--red-text`; gefüllt (`.btn-danger.filled`) Tinte `--on-red` · `.btn-warning` Kontur `--yellow`, Hover-Fläche `--yellow` mit `--on-yellow` · `.btn-secondary` Kontur `--border`, Text `--text-dim` · `.btn-text` ohne Fläche.
Regel: **eine** Primäraktion pro Toolbar (rechts), Sekundäres als Kontur, Destruktives nie gefüllt außer in Bestätigungsdialogen.

**Icon-Knöpfe in Listen** — überall `.btn .btn-sm .btn-icon` (28px). `.loot-detail-btn`, `.timer-card-btn`, `.dmscreen-widget-hide`, `.io-btn` werden darauf gemappt (Alias-Selektoren im CSS, kein Template-Umbau nötig).

**Chip `.chip`** — Höhe 26px, Padding 3px 10px, `--text-sm`/500, Radius 999px, Kontur `--border`, Fläche `--bg-elevated`; `.chip.active` Fläche `--gold`, Tinte `--on-gold`; farbige Zustände `.chip.color-<rolle>` Kontur `--<rolle>`, Text `--<rolle>-text`, aktiv Fläche `--<rolle>` mit `--on-<rolle>`. `.filter-chip`, `.npc-/.loc-/.enc-/.loot-filter-chip`, `.dice-chip`, `.dmg-chip`, `.spell-comp`, `.shop-cat-badge` werden per Alias auf `.chip` gemappt; Container `.filter-bar` (bleibt so heißen — B-12) `display:flex; gap: var(--space-sm); flex-wrap: wrap`.

**Badge `.badge`** — Höhe 18px, Padding 1px 7px, `--text-xs`/600, Radius 999px, Fläche `--bg-elevated`, Text `--text-dim`; `.badge.color-<rolle>` Fläche `color-mix(<rolle> 20%, transparent)`, Text `--<rolle>-text`. `.section-toolbar-count`, `.npc-badge`, `.enc-stat-badge`, `.difficulty-badge`, `.bestiary-badge`, `.cart-badge`, `.dms-live-badge` (heute 7,70px!) werden darauf gemappt.

**Eingabe** — Fläche `--bg-dark`, Rahmen `--border-input`, Text `--text`, Höhe 32px (Toolbar) / 36px (Formular), `--text-md`, Radius `--radius-sm`; Fokus: Rahmen `--gold` + `--ring-gold`. `.toolbar-search`, `.toolbar-select`, `.form-group input/select/textarea`, `.cf-field input`, `.dice-formula` folgen demselben Vertrag.

**Karte `.card`** — Fläche `--bg-card`, Rahmen `--border`, Radius `--radius-md`, Padding `--space-lg`, kein Schatten im Ruhezustand (`--shadow-1` nur für schwebende Karten wie `.dmscreen-widget`). `.card-title` `--text-lg`/600, Farbe `--gold-text`.

**Listenzeile (Master-Detail)** — `.npc-item`, `.loc-item`, `.enc-item`, `.loot-item`, `.bestiary-list-item`: Höhe ≥ 56px, Padding `--space-md`, Radius `--radius-md`, Hover `--bg-hover`, `.selected` Rahmen `--gold` + Fläche `color-mix(gold 10%, transparent)` — heute fünf verschiedene Ausprägungen, künftig eine Regelgruppe `.list-row` mit Aliasen.

**Section-Toolbar** — bleibt (`editors.css:498`), Höhe 74px, vier Gruppen (Identität · Suche · Filter+IO · Primäraktion); der Zähler ist ein `.badge`. Der Zauber-Filterzähler `#spell-count` wird `.filter-count` (Klasse statt Inline-Stil) und **bleibt** als Filterrückmeldung; `renderSpells()` ruft zusätzlich `setViewCount('spells', total)` (behebt den Stale-Zähler; gleiches Muster bei Quests).

**Modal** — Fläche `--bg-card`, Rahmen `--border`, `--shadow-3`, Radius `--radius-lg`, Kopfzeile `--text-lg`/600, Fußleiste rechtsbündig: Abbrechen (`.btn`) links von Speichern (`.btn-success`). Heute stehen in `view-party.html` Speichern **vor** Abbrechen, in `view-bestiary.html` umgekehrt — vereinheitlichen auf „Abbrechen · Speichern“.

**Statblock (`.bestiary-statblock.read-aloud.parchment`)** — Pergamentpalette bleibt themenunabhängig; alle **Textfarben darauf** kommen aus `--parchment-ink`/`--parchment-ink-dark`/`--ra-parchment-rule` (nie aus der Theme-Palette; heute `color: var(--red)` mit 2,58–3,92:1).

---

## 4 · Befunde v3 (D-01 … D-12)

Schwere: **Hoch** = in mindestens einem Theme sichtbar defekt · **Mittel** = systematische Drift · **Niedrig** = Feinschliff.

| ID | Schwere | Befund | Beleg (gemessen) | Welle |
|---|---|---|---|---|
| D-01 | Hoch | Tinte auf gefüllten Flächen nicht themenfähig | 100× `color: var(--bg-dark)`, 51× `color: white`, 6× `--on-accent`; Light `.btn-primary` 2,98, `.btn-success` 3,02; Dark Weiß/--green 1,74 (`welt.css:1073`) | 1 |
| D-02 | Hoch | Palette als rgba-Tripel dupliziert | 390 Literale; `.nav-tab` Weiß-Auflage in Light/Sepia wirkungslos; zwei Mechaniken (--*-rgb, color-mix) | 2 |
| D-03 | Hoch | Themenunabhängige Textfarben auf Theme-Flächen | `--coin-gm` Light 1,29 / Sepia 1,12; `--attr-dex` Light 2,09; Statblock `--red` auf Pergament max. 3,92 | 1 |
| D-04 | Hoch | Schatten ohne Stufen, `--shadow` in Contrast weiß | 88 Deklarationen, 65 Werte, `var(--shadow)` 1× (`core.css:857`) | 3 |
| D-05 | Mittel | 5 Chip-Familien, 3 Icon-Knopf-Höhen, 7 Badge-Klassen | siehe §1; Abnahmebild: `Design-Übersicht.dc.html` §3 | 4 |
| D-06 | Mittel | Keine Typo-Skala, em multipliziert sich | 784 em, 50 Größen, 169 Elemente < 11px, min 7,70px | 5 |
| D-07 | Mittel | `transition: all` 163×, 8 Dauern, 12 Kurven | opacity/visibility/filter hängen an `all` (11 stille Regressionen bei naiver Ersetzung) | 4 |
| D-08 | Mittel | Fokus abgeschaltet / Weltregel versteckt | 37 `outline:none`; `:focus-visible`-Weltregel in `dmscreen.css`; `:where()`-Patch wirkungslos | 6 |
| D-09 | Mittel | UI-Schrift systemabhängig, kein 500er | Segoe nur Windows; 54× 500 wirkungslos; Inter gebündelt, aber nur im Editor | 5 |
| D-10 | Mittel | `color-scheme` fehlt | 0 Treffer; 88 select, 205 checkbox, 76 number rendern hell in Dark/Contrast | 1 |
| D-11 | Niedrig | Rahmen < 3:1 in allen Themes | `--border` gegen `--bg-dark`: 1,71 / 1,47 / 1,53 / 2,82 | 6 |
| D-12 | Niedrig | Inline-Typo/-Farbe in Templates und JS | 39 + 108 Inline-font-size, 16 font-weight; `#spell-count` komplett inline | 5/6 |

Geschlossen (nicht mehr Teil des Auftrags): N-08 (reduced-motion — widerlegt, Block existiert), FIX-01…03 (Phase 15), Löschlauf (Phase 15).

---

## 5 · Wellenplan

Jede Welle: **Vorlauf** (Ratsche rot, Basiswert im Kommentar, bestehende Ratschen angepasst) → **Tokens** → **mechanische Stellen** (dateiweise Commits) → **Urteilsstellen** (einzeln, mit Kontrast-Nachrechnung) → **Abnahme** (§6) → **Ratsche grün, Commit**.

### Welle 1 — Farbe: Tinten, Textrollen, color-scheme (D-01, D-03, D-10) · ~600 Stellen · Risiko hoch
1. Tokens: `--on-<rolle>` (10 × 4), `--<rolle>-text` (9 × 4, Light/Sepia abgedunkelt, in den Theme-Blöcken), `--coin-*`/`--attr-*` in die Theme-Blöcke, `color-scheme` je Block, `--border-input`. `--on-accent` entfernen.
2. Bestehende Ratschen anpassen: F-14 (prüft wörtlich `color: var(--bg-dark)` in `.btn-primary`) auf `--on-gold` umschreiben; F-01 bleibt grün, weil nichts hinter den Alias wandert.
3. Mechanisch: 3 Button-Varianten (`core.css` `.btn-primary`/`.btn-success`/`.btn-gold`), `.nav-tab.active`, `.nav-group-btn.has-active`, `[data-layout="mobile"] .nav-tab.active`.
4. Urteil: 97 weitere `color: var(--bg-dark)`, 51 `color: white`, 482 `color: var(--<rolle>)` — Klassifikation nach Trägerfläche. Benannte Ausnahmen: `npcs.css:1617` (Spoiler, absichtlich unsichtbar), `core.css:2596` `.loc-item-tag` (Hintergrund kommt aus JS — hier `locations-render.js:153` um `color: var(--on-${filter.color})` erweitern), `dashboard.css:3159` (Kaskade), Statblock (§3.7).
5. Hover-Ableitungen einzeln prüfen: `.btn-gold:hover` (Light), `.btn-success:hover` (`dmscreen.css:1487`), `.btn-warning:hover`.
6. Sichtprüfung: alle Toolbars (Primärknopf), Party-Karten (HP-Zahlen), Initiative (HP, Effekte), Loot (Seltenheits-Tags), Finanz-Widget (Münzen), Statblock, Fraktionen-Ruf.

### Welle 2 — Farbliterale → color-mix (D-02) · 390 Stellen · Risiko mittel
1. Mechanik: `color-mix`. `--gold-rgb/--green-rgb/--red-rgb` + Test (:62/:77) + Kommentar `variables.css:22-24` im selben Commit entfernen. 7 `toHaveCSS`-Zusicherungen auf `color(srgb …)` anpassen.
2. Tokens: `--overlay-weak/-mid/-strong` pro Theme.
3. Klassifikation der 390: 198 exakte Dark-Treffer → `color-mix(var(--<rolle>) N%, transparent)`; 35 Weiß → `--overlay-*` (13 tote var()-Fallbacks löschen, 7 als Ausnahme: Marker-Rand, Konflikt-Banner-Knopf, Kartenraster, Würfelknopf-Rand, 2 inset-Glanzkanten); 66 schwarz außerhalb box-shadow → `--overlay-*` (hell) oder Welle 3; 25 fremde Theme-Palette → **sichtbare** Änderung, einzeln freigeben (`tools.css:1517 #ffd700 → --gold`); 66 palettenfremd → nächstes Token oder dokumentierte Ausnahme.
4. Ratsche T-2: „leer außer den N benannten, kommentierten Ausnahmen“ (nicht Alles-oder-nichts).

### Welle 3 — Schatten als Höhenstufen (D-04) · 88 Stellen · Risiko mittel
1. Tokens §3.2; `--shadow` entfernen (1 Verwendung `core.css:857` → `--shadow-2`).
2. 58 mechanische Stellen → `--shadow-1/-2/-3` nach Zuordnungstabelle (Dropdown/Tooltip → 2, Modal/Floating → 3, Karte → 1 oder keiner).
3. 22 Urteilsstellen: 9 farbige Glühe → `--glow-*`, 4 goldene Zustandsschatten → `--ring-gold`, 4 Zwischengrößen → nächste Stufe, 1 Schublade → `--shadow-drawer`, 2 `@keyframes` → Ausnahme.
4. Ratsche: `box-shadow` nur aus `--shadow-[123]`, `--shadow-drawer`, `--ring-gold`, `--glow-*`, `inset`, `none` + Ausnahmeliste; Contrast-Schatten enthält kein `255,255,255`.

### Welle 4 — Bewegung und Konsolidierung (D-07, D-05) · ~290 + ~60 Stellen · Risiko mittel
1. Tokens §3.5. Schritt a: ~150 rein mechanische `all` → `var(--trans-std)`. Sichtprüfung Würfelansicht, Floating-Dice-Panel, Löschknöpfe in Listen. Schritt b: ~13 tragende Stellen einzeln (`--trans-reveal`, `filter`, `text-shadow`). Schritt c: 124 Dauer-Literale → Tokens; 0,08 s → `--dur-fast`; `dice.css:621` eigene Kurve als Ausnahme.
2. Konsolidierung: `.chip`, `.badge`, `.list-row`, Icon-Knopf-Höhe als Basis-Regelgruppen in `core.css`; die alten Klassennamen werden **Aliase** in derselben Selektorliste (kein Template-Umbau), abweichende Eigenschaften der Aliase gelöscht. Sichtprüfung: NPC/Orte/Encounter/Truhe-Toolbars, Zauber-Filterleiste, Würfel-Chips, Shop-Kategorien.
3. Ratschen: kein `transition:[^;]*all`; Dauern nur aus Tokens; Chip-Selektoren teilen sich eine Regelgruppe (Test: `ruleBodiesFor('.npc-filter-chip')` enthält keine eigene `padding`/`border-radius`-Deklaration).

### Welle 5 — Typografie und Schrift (D-06, D-09, D-12) · 1.078 Stellen · Risiko hoch · **atomar**
1. Vorlauf: headless Messung (Playwright, gebautes Bündel) aller `font-size`-Endwerte pro Ansicht als Baseline (`tools/typo-baseline.js`), Zielverteilung festlegen: nach dem Umbau ≥ 95 % der Elemente auf einem Skalenwert, 0 Elemente < 11px außer `.sr-only`.
2. Tokens §3.3 in px; `--font-ui` → Inter (nach Entscheidung §8); `font-feature-settings: "tnum"` auf `.char-card-hp-value`, `.init-value`, `.init-hp-value`, `.dash-stat-value`, `.timer-card-time`, `.session-timer-display`, `.encounter-round-num`.
3. **Ein Commit:** alle 784 `em` + 47 px-Literale → Tokens nach Zuordnungstabelle (0.65/0.7/0.75em → xs; 0.8/0.85em, 12/13px → sm; 0.9/1em, 14px → md; 1.05/1.1em, 16px → lg; 1.25em, 18/20px → xl; 26px → 2xl; 34px → 3xl; 5em → `--text-hero`). Verschachtelungsketten (53 gemessen) durch Token am Blatt-Element auflösen. `variables.css:423-432` (Mobil-Nav 18/9px, tot) löschen.
4. Gewichte: 14× bold → 600, 92× 700 → 600, 3× normal → 400, 1× 300 → 400, `spells.css:339` löschen; 500 bleibt 500 (mit Inter wirksam). Ratsche: nur 400/500/600 (mit `fonts.css`-Ausschluss wie F-05).
5. Templates/JS (Geltungsbereich B-10): 39 Inline-`font-size` in Templates → Klasse; 108 in JS → Klasse, **außer** `shop-export.js`. `INLINE_MAX` entsprechend senken.
6. Abnahme: Baseline-Diff (keine Änderung > 2px außer beabsichtigt), Vier-Themes-Runde, Mobil-Profil bei 375px.

### Welle 6 — Fokus, Rahmen, Zähler (D-08, D-11) · ~45 Stellen · Risiko niedrig
1. Weltregel nach `core.css` (aus `dmscreen.css` **verschieben**, nicht duplizieren — DUBLETTEN_MAX 0), `border-radius` daraus streichen, dokumentieren.
2. 33× `.x:focus { outline: none }` → `.x:focus:not(:focus-visible)`; `party.css:1485` `.cf-combat-value input:focus` → `box-shadow: var(--ring-gold)`.
3. `--border-input` auf alle Eingaben (§3.7).
4. `#spell-count` → `.filter-count`; `renderSpells()`/`renderQuests()` rufen `setViewCount()`; F-10-Ratsche um `spell` erweitern. `.filter-bar` **bleibt** (`core.css:1965` trägt Layout).
5. Ratschen: kein `outline: none` auf einem Selektor mit `:focus-visible`; jedes verbleibende `outline: none` steht auf `:not(:focus-visible)` oder hat `box-shadow`/`border-color` daneben; `--border-input` ≥ 3:1 in vier Themes.
6. Danach, eigener Strang: Tastatur-Erreichbarkeit (176 `div[data-action]`, 58 `display:none`-Chip-Eingaben → `.sr-only`, 155 `<label for>`, 35 Modale `role="dialog"` + Fokusfalle, `.mobile-nav-toggle`). Erst dann ist die Tastaturprobe („Tab durch Orte-Ansicht“) abnehmbar.

**Gesamtumfang:** ~2.400–2.800 Bearbeitungsstellen, davon rund ein Drittel Einzelurteile. Reihenfolge ist verbindlich: Welle 1 vor 2 (die Chip-Tinte muss stehen, bevor die Chip-Fläche zu color-mix wird), 2 vor 3 (Haarlinien und Schatten stehen in derselben Deklaration), 5 nach 1–4 (optische Regressionen eindeutig zuordenbar).

---

## 6 · Abnahme

### 6.1 Automatisch (Stufe 1, nach jeder Welle)
`npm test` · `npm run test:e2e` · `pytest tests/build` · `python build.py` und `--production` · `design-consistency.test.js` mit den neuen Ratschen grün · Ratschenwerte dürfen nur sinken.

Neue Ratschen (alle in `tests/unit/design-consistency.test.js`, Helfer `cssFiles`, `withoutComments`, `declarationsOf`, `ruleBodiesFor` wiederverwenden):

- **R-01 Theme-Symmetrie:** die vier Theme-Blöcke haben identische Property-Mengen (Test bildet pro Block eine Menge, `expect(diff).toEqual([])`).
- **R-02 Tinte:** für jede Rolle `ratio(--on-<rolle>, --<rolle>) ≥ 4,5` in vier Themes; `ratio(--<rolle>-text, --bg-card) ≥ 4,5`; `ratio(--coin-*/--attr-*, --bg-dark) ≥ 4,5`; `ratio(--border-input, --bg-dark) ≥ 3`. Rechenweg wie §T-1 im v2-CHECKLISTE (der ist korrekt), Rollenliste vollständig inkl. red/pink.
- **R-03 Keine rgba-Tripel** außer kommentierter Ausnahmeliste (Array im Test, jede Zeile mit Datei:Anker).
- **R-04 Schatten** nur aus Tokens/inset/none/Ausnahmen; Contrast-Block ohne `255, 255, 255`.
- **R-05 font-size** nur `var(--text-*)`/`inherit`; kein `em`; **R-06 font-weight** nur 400/500/600 (fonts.css ausgeschlossen).
- **R-07 transition** ohne `all`; Dauern nur `var(--dur*)`.
- **R-08 Fokus** wie Welle 6 Punkt 5.
- **R-09 Chip/Badge/Icon-Knopf:** Alias-Selektoren tragen keine eigenen Geometrie-Deklarationen.

### 6.2 Gemessen (Stufe 2, headless gegen das gebaute Bündel)
Playwright-Spec `tests/e2e/design-measure.spec.js`: lädt jede der 24 Ansichten in vier Themes, misst `getComputedStyle` für Farbe/Hintergrund der Stellenliste der Welle und rechnet Kontrast; schreibt Screenshots nach `tests/e2e/__screens__/<welle>/<ansicht>-<theme>.png`. Stellenliste pro Welle steht im Wellen-Abschnitt („Sichtprüfung“).

### 6.3 Menschlich (Stufe 3)
Nach **jeder** Welle eine volle Runde durch alle 24 Ansichten in allen vier Themes (Nutzerentscheidung D-53, keine Verkürzung). Prüffragen: Ist jede Schrift lesbar? Sieht dieselbe Komponente in jeder Ansicht gleich aus? Bewegt sich etwas anders schnell als vorher? Wo ist der Tastaturfokus?

---

## 7 · Begründete Ausnahmen (bleiben, mit Kommentar im CSS)

- 65 `!important` in `.spell-desc *` (schlagen Inline-Stile des Rich-Text-Editors).
- Bedeutungstragende Skalen: `--dmg-*`, `--attr-*` (Flächen), `--cat-*`, `--know-*` — themenunabhängig als **Fläche/Rahmen**; als Text nur über theme-fähige Ableitungen (Welle 1).
- Vorlese-Papierpalette `--ra-*` und Statblock-Pergament — themenunabhängig; Text darauf nur aus `--parchment-ink*`.
- `features/shops/shop-export.js` — Druckdokument mit pt-Einheiten, kein Token-Zugriff.
- Editor-Marker fester dunkler Wert (CLAUDE.md), eingefrorenes Testnetz.
- `npcs.css:1617` `.npc-trigger-reveal.hidden` — Text absichtlich unsichtbar.
- 7 `inset`-Schatten `.read-aloud`, 2 `@keyframes`-Schatten `dice.css`, 1 eigene Kurve `dice.css:621`.
- `.dice-hero-result` Größe (`--text-hero`), Emoji-Icons, Navigationsstruktur.

---

## 8 · Offene Entscheidungen (vor Welle 1 bzw. 5 zu treffen)

1. **UI-Schrift** (Welle 5): Inter (Empfehlung) · Source Sans Pro · Segoe behalten. Bei Inter: `inter-700.woff2` **nicht** nachbündeln — die Skala endet bei 600.
2. **Sepia `--purple`** (Welle 1): abdunkeln auf ≥ 4,5 mit Weiß oder dokumentierte Ausnahme 4,38.
3. **25 Fundstellen aus fremden Theme-Paletten** (Welle 2): Umstellung ändert das Bild auch in Dark sichtbar — Liste vorab freigeben.
4. **`--ease`** (Welle 4): `ease` behalten (Empfehlung) oder app-weit auf `cubic-bezier(0.2,0,0.2,1)` — Letzteres ist eine spürbare Änderung des Bewegungsgefühls.
5. **Tastatur-Strang** (nach Welle 6): jetzt einplanen oder als geführte Restschuld ausweisen.

---

## 9 · Dateien dieser Übergabe

- `HANDOFF-v3/DESIGN-HANDOFF-v3.md` — dieses Dokument (Aufgabenliste + Soll-System + Abnahme)
- `HANDOFF-v3/CLAUDE-CODE-PROMPT.md` — Start-Prompt für Claude Code
- `Design-Übersicht.dc.html` — Tokens, Kontraste (live gerechnet), Komponenten in vier Themes, Schriftvergleich, Befunde, Wellen
- `Ist-Zustand App.dc.html` — 24 Ansichten mit dem unveränderten Stylesheet (`app/assets/styles/`), Tweaks: `theme`, `view` (`alle` = alle 24 gestapelt mit Quellenangabe je Ansicht)
- `app/assets/` — Kopie von `assets/styles.css`, `assets/styles/*.css`, `assets/fonts/*.woff2` (Stand 27.09.2026) als Referenz; **nicht** zurückkopieren
