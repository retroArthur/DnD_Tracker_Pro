# Requirements: D&D Kampagnen-Tracker Pro — v1.3 Design-System

**Defined:** 2026-09-08
**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter,
der nie im Weg steht und keine Daten verliert.

**Milestone-Ziel:** Die Befunde des Design-Audits v2 umsetzen — auf der korrigierten Befundlage,
nicht auf dem Wortlaut des Handoffs. Farbe kommt in allen vier Themes an, Schatten/Typografie/Tempo
werden Skalen statt Sammlungen, und die Tastaturbedienung bekommt einen sichtbaren Zustand.

**Herkunft:** `Anpassungen/Design-Konsistenz und Verbesserungen/design_handoff_konsistenz_v2/`
(9 Befunde N-01..N-09). Der Handoff wurde vor dem Aufsetzen **verifiziert statt übernommen** —
14 Agenten, 797 Werkzeugaufrufe, jede Zahl mit einem eigenen Kommando gegen HEAD `1aba0ac`
nachgemessen, dazu vier adversarische Gegenproben.

> **Wo diese Datei dem Handoff widerspricht, gilt diese Datei.**
> Belege: [`HANDOFF-V2-VERIFIKATION.md`](HANDOFF-V2-VERIFIKATION.md) (Urteil, 13 Blocker,
> 36 korrigierte Kennzahlen, 16 übersehene Befunde) und
> [`HANDOFF-V2-GEGENPROBEN.md`](HANDOFF-V2-GEGENPROBEN.md) (40 Einzelbefunde aus vier Linsen).
> Jede Abweichung trägt dort das Kommando, mit dem sie gemessen wurde.

**Nicht verhaltensneutral.** `TYPO-01` vereinheitlicht Größen, die heute je Einbautiefe verschieden
sind — nach der Umstellung sind sie überall gleich. `COLOR-*` ändert Schriftfarben in allen vier
Themes sichtbar. Beides ist beabsichtigt und braucht eine Sichtprüfung, keine reine Testabnahme.

**Ausgangsstand der Gates (gemessen 2026-09-08):** Jest 1217 · Playwright 354 (2 skipped) ·
pytest 24 · `design-consistency.test.js` 64/64 · `DUBLETTEN_MAX` 0 · `IMPORTANT_MAX` 105 (Ist 105) ·
`INLINE_MAX` 257 (Ist 257).

---

## v1.3 Requirements

### Befundlage — erst messen, dann ändern

- [x] **BASE-01**: Die 13 Blocker aus `HANDOFF-V2-VERIFIKATION.md` sind schriftlich entschieden,
      jeder mit Begründung und Auswirkung. Drei davon sind beim Milestone-Aufsetzen bereits
      entschieden und als Key Decision in `PROJECT.md` gebucht: **B-01** (Wurzel bleibt bei 16px,
      `--text-*` gegen 16 gerechnet), **B-02** (`--*-text`-Übersteuerungen *innerhalb* der
      bestehenden Theme-Blöcke), **B-07** (§8 gestrichen). Die übrigen zehn sind offen.
- [x] **BASE-02**: Die 36 korrigierten Kennzahlen sind in `BEFUNDE-v2.md`, `PATCHES.md` und
      `CHECKLISTE.md` eingearbeitet, damit keine Welle mit falschen Ausgangs- oder Zielzahlen
      beginnt. Kernfälle: `transition: all` ist **163**, nicht 151 (der Abnahme-grep der CHECKLISTE
      findet alle 163 — die Abnahme ist heute strenger als die eigene Anweisung); `em`-Fundstellen
      sind **784 in 30 Werten**, nicht ~740 in 20; `rgba(251,191,36,…)` ist **32×**, nicht 44×
      (die 44 enthalten 12× `rgba(251,146,60,…)` = `--orange`, zwei Rollen in einer Zahl);
      §1c nennt „fünf weitere Stellen", es sind **97**.
- [x] **BASE-03**: N-08 ist als **widerlegt** geschlossen und §8 aus `PATCHES.md` aus dem
      Ausführungsumfang genommen und im Dokument als VERWORFEN markiert. Der
      globale `prefers-reduced-motion`-Block existiert seit Langem (`dmscreen.css:1408-1419`,
      Top-Level, in beiden Bundles). Der Patch hätte eine Dublette angelegt (`DUBLETTEN_MAX = 0`
      bricht), `!important` auf 110 statt der angewiesenen 109 gehoben, und seine Ausnahmeliste
      trifft nichts: `.dice-crit-glow` existiert nirgends im Repo, `.dice-result` ist toter Code.
      Verteidigbarer Rest: den vorhandenen Block nach `core.css` **verschieben** und gegen Rückbau
      sichern — nicht einen zweiten danebenstellen.
- [x] **BASE-04**: Jede Ratsche, die eine Welle abschließen soll, ist **vorab mit demselben
      Ausdruck gemessen**, den der Test später benutzt. Fünf heute grüne Prüfungen brechen sonst
      an den Patches, ohne dass der Handoff es erwähnt: `F-14` prüft wörtlich
      `color: var(--bg-dark)` in `.btn-primary` (§1b entfernt genau das), `F-01` prüft die
      Blockreihenfolge (§2b schreibt neue `[data-theme]`-Blöcke dahinter vor), `F-03` verbietet
      `rem`-Literale (§5a legt sieben davon an), `DUBLETTEN_MAX = 0` bricht an §8,
      `IMPORTANT_MAX = 105` stiege auf 110.

### Toter Bestand — was nicht mehr gebraucht wird, wird nicht mitgezählt

- [ ] **DEAD-01**: **Die von `tools/css-usage-report.js` gemessene Menge** toter Klassen in
      vollständig toten Regelblöcken ist gelöscht, beginnend mit `dashboard.css:547-1224` — 678
      Zeilen „MAP INTEGRATION" für ein Feature, das im Code nicht mehr existiert (kein Karten-Modul
      in `loader.js`, 0 Treffer für `map-marker`/`map-container` in JS und HTML). *(Korrektur D-20:
      die kolportierten Zahlen — 438 tote Klassen in 607 Regelblöcken, ~3.174 von 27.141 Zeilen —
      sind in drei unabhängigen Nachmessungen NICHT reproduziert worden; nur die Gesamtzeilenzahl
      27.141 hat sich bestätigt. Verbindlich ist der Wert, den das Werkzeug nach seinem Lauf
      ausgibt; er steht dann in `.planning/phases/15-befundlage-vorlauf/15-RATCHET-BASELINE.md`.)*
      Mit weg: zwei tote `@media`-Blöcke
      (`dashboard.css:1270`, `loot.css:116`), die ungenutzte Leiter
      `.shadow-sm/-md/-lg` (`dmscreen.css:1427-1429`, stünde sonst als Dublette zu den geplanten
      `--elev-*`), `.nav-tab-icon`/`.nav-tab-text` (`variables.css:423-432`, das Markup hat keine
      Kind-Spans) und der tote `.pwa-install-banner`.
- [ ] **DEAD-02**: Vor jeder Löschung läuft eine Präfixerkennung für dynamisch zusammengesetzte
      Klassennamen (`condition-${…}`), damit nichts gelöscht wird, das nur zur Laufzeit entsteht —
      **die vom Werkzeug gemessene Menge** wird als lebend erkannt. *(Korrektur D-20/D-21: die
      Handoff-Angabe „140 präfixgerettete Klassen" ist nicht reproduzierbar; klassenkontext-
      beschränkt [nur `class="…"`, `className =`, `classList.*`] retten die fünf eingefrorenen
      Präfixe [`color-`, `condition-`, `editor-toolbar-`, `rel-btn-`, `tag-`] gemessen 34.)* Die
      E2E-Suite ist danach grün.
- [ ] **DEAD-03**: Der Umfang jeder Folgewelle ist nach der Löschung **neu gemessen**, nicht
      fortgeschrieben. Anteile in totem CSS: 52 von 400 `rgba` (13 %), 126 von 784 `em` (16 %),
      14 von 88 `box-shadow` (16 %), 13 von 163 `transition: all` (8 %). Ohne diesen Schritt frieren
      die neuen Ratschen toten Bestand ein.

### Echte Defekte — vom Audit nicht gesucht, beim Nachmessen gefunden

- [x] **FIX-01**: Die DM-Screen-Referenzwidgets „Gelände", „Fertigkeiten" und „Wissensgebiete"
      rendern wieder gestylt — **drei Widgets, nicht zwei** (Korrektur D-12: die Registry ist
      eindeutig, `terrain` = „Gelände", `skills` = „Fertigkeiten", `knowledge` = „Wissensgebiete";
      diese Fassung nannte zuvor nur „Gelände" und „Wissensgebiete", belegte Letzteres aber mit
      einer Klasse aus „Fertigkeiten" — genau diese Verwechslung ist die Ursache dafür, dass zwei
      aufeinanderfolgende Analysen dasselbe falsche Widget bearbeitet haben). CSS und JS-Markup
      waren zwei Generationen auseinander. *(Korrektur D-11 der Fundstellen: der hier ursprünglich
      zitierte CSS-Bereich `dmscreen.css:2469-2510` war in Wahrheit der Block des
      FERTIGKEITEN-Widgets [`.dms-skill-*`, heute nach Plan 15-04 bei `dmscreen.css:2404-2459`] und
      enthielt keine einzige `.dms-terrain-*`-Regel; die Gelände-Regeln liegen an anderer Stelle
      derselben Datei [heute `dmscreen.css:2777-2827`]. Ebenso war das zitierte JS-Fenster
      `dmscreen-widgets-reference.js:89-118` der Fertigkeiten-Renderer [`renderDMSSkillsWidget`,
      gemessen heute Zeilen 87-125], nicht der Gelände-Renderer — der liegt in
      `features/dmscreen/dmscreen-widgets-combat.js` [`renderDMSTerrainWidget`, Zeilen 133-170].)*
      Gemessen am gebauten Bündel vor der Reparatur: `.dms-terrain-item` padding 0px, background
      transparent, border-radius 0px; `.dms-skill-header.str` background transparent, font-weight
      400. 62 tote `dms-*`-Klassen im CSS gegen 15 `dms-*`-Klassen im JS ohne jede Regel. Reparatur:
      Plan 15-04 (`tests/e2e/features/design-fixes.spec.js`, Ratsche `DMS_UNSTYLED_MAX`).
- [ ] **FIX-02**: Die kompakte Zauberplatz-Anzeige der Charakterkarte ist sichtbar und bedienbar.
      `party-render.js:330` erzeugt `.char-slot-pip` als `<span>` **ohne Textinhalt** mit
      `data-action="toggle-spell-slot-stop"` — und es existiert keine einzige CSS-Regel dafür
      (auch nicht für `.char-slot-group/-label`, `.char-card-slots`). Ein Inline-Element der Breite 0:
      weder sichtbar noch anklickbar noch antippbar. Der Codepfad ist aktiv
      (`party-render.js:159`, `:241`); die Schwesterklasse `.slot-pip` (`dashboard.css:1320`)
      existiert sehr wohl.
- [ ] **FIX-03**: Die Würfelzahl behält nach dem ersten Wurf ihre Formatierung, und die
      Kritisch-/Patzer-Färbung greift. `dice-core.js:345` setzt `heroResult.className = ''` und
      nimmt `#dice-hero-result` damit `.dice-hero-result` weg — mit `font-size: 5em`,
      `color: var(--gold)` und `font-weight: 700` (`dice.css:21-27`). Die anschließend gesetzten
      `crit`/`fail`-Klassen landen auf dem Container `#dice-hero`, und `.dice-hero.crit`/`.fail`
      existiert in **keiner** CSS-Datei. Nur das Floating-Panel färbt heute korrekt.

### Farbe — die Palette erreicht alle vier Themes

- [ ] **COLOR-01**: Die Schrift auf gefüllten Knöpfen erreicht in allen vier Themes 4,5:1.
      `.btn-primary`/`.btn-success`/`.btn-gold` tragen heute `color: var(--bg-dark)`, und
      `--bg-dark` ist in den hellen Themes **hell** — gemessen: Gold/Light 2,98, Grün/Light 3,02,
      Grün/Sepia 2,55. Das sind die Knöpfe, die in jeder Ansicht oben rechts stehen.
      Achtung Richtungswechsel: `--on-gold` ist in Sepia **hell** (`#fdf6e3`), sonst dunkel.
      *(Korrektur zum Bericht: die Primäraktion fällt nur in Light durch; in Sepia erreicht sie 5,65.
      Nur `.btn-success` fällt in beiden hellen Themes durch.)*
- [ ] **COLOR-02**: Es gibt einen **vollständigen** `--on-<rolle>`-Satz für alle acht Akzente pro
      Theme, plus eigene Werte für `--gold-dim`/`--gold-hover`/`--green-dim` — oder eine ausdrücklich
      dokumentierte Ausnahmeliste. `--on-gold`/`--on-green` allein decken nur 66 der 97 Fundstellen;
      für `--cyan` (13), `--yellow` (4), `--orange` (4), `--purple` (1), `--pink` (1) gibt es keine
      Regel, und für `--red` (4) ist die Patch-Regel („`--on-accent` bleibt") gemessen falsch.
- [ ] **COLOR-03**: Die abgeleiteten Flächen sind mitgeprüft und verschlechtern sich nicht.
      Gemessene Regressionspfade, die der Patch nicht sieht: `.btn-gold:hover` fällt in Light von
      4,67 (bestanden) auf **3,71**; `.btn-success:hover` (`dmscreen.css:1487`) von durchweg
      bestanden auf durchgefallen in **drei von vier Themes**.
- [ ] **COLOR-04**: `--on-accent` ist repariert oder ersetzt. Es ist das Token, das N-02
      ausdrücklich als *die Lösung* präsentiert — und es ist der **schwerste Kontrastfehler im
      ganzen Baum**: `.fr-ruf-btn-plus` (`welt.css:1073`, weiß auf `--green`) liegt bei **1,74:1**
      im Standard-Theme. Von 51 `color: white`-Deklarationen auf gesättigten Flächen unterschreiten
      **41** die Schwelle im Dark-Theme (weiß auf `--red` 3,76; auf `--purple` 2,72; auf `--blue`
      2,54; auf `--green` 1,74). Der Kommentar an `variables.css:283-287` behauptet wörtlich das
      Gegenteil und ist mit zu korrigieren.
- [ ] **COLOR-05**: Die Akzente als **Textfarbe** erreichen 4,5:1 gegen `--bg-card` in allen vier
      Themes (`--*-text`-Rollen, in Dark/Contrast Alias auf die Palette, in Light/Sepia abgedunkelt).
      Die Palettenfarbe selbst bleibt unverändert — sie ist auch die Fläche der Knöpfe.
      `--red-text` gehört in den Aliasblock: §2b definiert es **nur** im Sepia-Block, in den drei
      anderen Themes wäre `var(--red-text)` unauflösbar und fiele bei der geerbten Eigenschaft
      `color` lautlos auf den ererbten Wert zurück. Die fehlende Zeile `--red` (Sepia 4,29) gehört
      in die Tabelle, `--pink` ist entgegen dem Bericht in allen vier Themes definiert.
- [ ] **COLOR-06**: Die themenunabhängigen Textfarben `--coin-*` und `--attr-*` sind theme-fähig.
      Sie stehen im Aliasblock, gelten also für alle vier Themes, und liegen gegen ihre tragende
      Fläche `var(--bg-dark)` bei bis zu **1,29:1**: `--coin-gm` Dark 13,86 / Light 1,29 /
      Sepia 1,12; `--attr-dex` 8,53 / 2,09 / 1,81. Der Quellkommentar datiert sie auf ein
      Code-Review vom 2026-09-08 und beruft sich auf eine Messung „am gebauten Bündel" — gemessen
      wurde offenkundig nur im Dark-Theme. 22 Verwendungen.
- [ ] **COLOR-07**: `color-scheme` ist pro Theme gesetzt. Heute: **0 Treffer** im ganzen Baum. Ohne
      es rendern 88 `<select>`, 205 Checkboxen, 76 Zahlenfelder, Bildlaufleisten und Datumswähler im
      Dark- und Contrast-Theme hell — die einzige theme-relevante Eigenschaft, die man durch
      Aufräumen von Literalen *nicht* erreicht.
- [ ] **COLOR-08**: Kein `rgba()` mit Zahlentripel mehr im Komponenten-CSS, **außer den benannten
      und kommentierten Ausnahmen**. Ausgangswert 390 Fundstellen in 143 [Bericht: 173] Werten nach
      Leerraum-Normierung (D-30 — die Differenz sind 30 reine Schreibweisenvarianten; wer aus 173
      einen Tokenbedarf ableitet, plant 30 Tokens zu viel). Der Handoff deckt
      nur 249 davon ab (§3a 35 + §3b 156 + §4 58) und behauptet zugleich Vollständigkeit; die
      restlichen 141 sind vorab zu klassifizieren (66 palettenfremd, 25 aus **fremden**
      Theme-Paletten, 8 schwarze `rgba` außerhalb `box-shadow`, 42 sonstige).
- [ ] **COLOR-09**: Die Navigationsfläche ist in allen vier Themes sichtbar. `.nav-tab`
      (`core.css:338`) steht auf `rgba(255,255,255,0.05)` über `.app-header` mit `var(--bg-card)` —
      gemessene Kanaldifferenz: Dark 11,5 · **Light 0,0** · **Sepia 1,4** · Contrast 11,9. Im
      Light-Theme buchstäblich unsichtbar. Overlay-Tokens dunkeln in Light und Sepia ab statt
      aufzuhellen.
- [ ] **COLOR-10**: Es gibt **eine** Mechanik für theme-fähige Farbauflagen, nicht zwei. Das Projekt
      führt `--gold-rgb`/`--green-rgb`/`--red-rgb` in allen vier Themes, benutzt sie 6× und erzwingt
      sie per Test (`design-consistency.test.js:62`, `:77`); `variables.css:22-24` trägt dazu den
      Wartungskommentar „BEIM ÄNDERN EINER FARBE HIER MITZIEHEN". §3 führt `color-mix` als zweiten
      Weg ein, ohne den ersten zu erwähnen. Entweder `-rgb` auf alle acht Akzente erweitern oder es
      samt Test und Kommentar im selben Commit abräumen. **Nebenwirkung beachten:** Chromium
      serialisiert `color-mix` als `color(srgb …)`, nicht als `rgba(…)` — 7 `toHaveCSS`-Zusicherungen
      im Repo hängen daran (`wiki.spec.js:396` und 6 in den Editor-Specs).
- [ ] **COLOR-11**: Die Stellen, an denen eine mechanische Umsetzung Funktion zerstören würde, sind
      **vorab als benannte Ausnahmen** eingetragen — bevor jemand den grep abarbeitet.
      `npcs.css:1617` (`.npc-trigger-reveal.hidden`) setzt bewusst `background` **und** `color` auf
      `var(--bg-dark)`: unsichtbarer Spoilertext, der erst auf Klick erscheint. Wer die Zeile
      mitzieht, deckt NPC-Trigger vorzeitig auf. `core.css:2596` (`.loc-item-tag`) bekommt seinen
      Hintergrund erst zur **Laufzeit** aus `locations-render.js:153` — dafür kann kein statisches
      `--on-*`-Token richtig sein.

### Schatten — vier Höhenstufen, die dem Theme folgen

- [ ] **ELEV-01**: `box-shadow` kommt aus vier Höhenstufen-Tokens oder aus benannten, kommentierten
      Sonderfällen. Ausgangswert: 88 Deklarationen, 65 verschiedene Werte (nicht 66 — `dice.css:575`
      und `:598` sind derselbe Wert, einmal umbrochen; eine Ratsche auf 66 hinge an einer
      Formatierung), 58 mit hartem `rgba(0,0,0,…)`, `var(--shadow)` genau **1×** benutzt.
- [ ] **ELEV-02**: Die Deckkraft ist **pro Stufe gestaffelt**, nicht aus einem einzigen `--shadow`
      abgeleitet. Ein Token kann drei Stufen nicht bedienen: bei Sepia (0.1) verlöre ein Modal seine
      Ablösung, das heute 0.4–0.6 trägt; bei Dark (0.5) bekäme `.shadow-sm` dreifachen Blur bei
      2,5-facher Deckkraft.
- [ ] **ELEV-03**: Das Contrast-Theme bekommt einen eigenen Schattenwert **oder** die Inversion wird
      ausdrücklich freigegeben. `variables.css:101` setzt dort `--shadow: rgba(255,255,255,0.1)` —
      **weiß**. Der Bericht behauptet „in allen vier Themes passend (rgba(0,0,0,0.5) bis
      rgba(0,0,0,0.1))". Dass es heute niemandem auffällt, liegt allein daran, dass genau ein
      Element das Token benutzt; §4 skaliert diesen Sonderfall auf 88 Schatten hoch.
- [ ] **ELEV-04**: Die 22 [Bericht — gemessen: die deterministische Klassifikation aller 88
      `box-shadow`-Deklarationen ergibt rund **40** Sonderfälle, nicht 22] Deklarationen, die auf
      keine der vier Stufen abbilden, haben eine benannte Behandlung nach vier Behandlungsarten
      statt einzeln verhandelt: 9 farbige Glühe (purpur/rot/grün), 4 gold getönte Schlagschatten als
      Zustandsanzeige, 4 Größen zwischen den Tabellenzeilen (darunter das einzige heute korrekte
      `var(--shadow)` in `core.css:857`), 1 negativer X-Offset (`initiative.css:922`, seitlich
      einfahrende Schublade), 2 `@keyframes`-Zustände (`dice.css:598/599`, animierter Spread 0→8px)
      — plus die weiteren Fälle, die erst die vollständige 88er-Klassifikation aufdeckt (Gesamtsumme
      rund 40, siehe `.planning/phases/15-befundlage-vorlauf/15-CONTEXT.md` D-37).
      `--glow-gold` wird geteilt: Ring (`0 0 0 3px`) und Glühen (Blur 4–12px) sind zwei Rollen.
      *(Korrektur zum Bericht: von den drei genannten „dokumentierten Sonderfällen" existieren zwei
      nicht. Alle 7 `inset`-Schatten sitzen auf `.read-aloud`; `bestiary.css` hat **0** `box-shadow`;
      es gibt keinen einzigen `inset`-Schatten an einem Fortschrittsbalken.)*

### Bewegung — drei Dauern, kein `all`

- [ ] **MOTION-01**: Kein `transition: all` mehr. Ausgangswert **163** (nicht 151): es fehlen
      `all 0.3s` (4), `all 0.2s ease` (4), `all 0.3s ease` (2), `all 0.15s ease` (1),
      `all 0.3s cubic-bezier(…)` (1).
- [ ] **MOTION-02**: Die Ersetzungsliste lässt **nichts Tragendes** fallen. Die vorgeschlagene
      Fünferliste (`background, border-color, color, transform, box-shadow`) verliert genau die
      Eigenschaften, die unter `all` die sichtbare Arbeit leisten: `opacity` (9 lebende Stellen),
      `visibility` (1), `filter` (2), `text-shadow` (1). Schwerster Fall: `dice.css:603` — das
      Floating-Dice-Panel hält `opacity:0; visibility:hidden; transform:…` und wird per
      `classList.toggle('show')` geschaltet; ohne `visibility` verschwände es beim Schließen
      schlagartig. Zweitschwerster: `dashboard.css:54` (acht Würfelknöpfe) und `encounters.css:1537`
      verlieren ihre `filter: brightness()`-Aufhellung — dort die **einzige** Hover-Rückmeldung.
- [ ] **MOTION-03**: Es gibt drei Dauer-Tokens und eine Kurve. Ausgangswert **8** Dauern, nicht
      sieben — `0.08s` fehlt im Bericht vollständig (`party.css:2718`, `:2754`, `:2971`,
      Mikro-Druckeffekt). Die `width`-Übergänge der Fortschrittsbalken bleiben unangetastet.
- [ ] **MOTION-04**: Ob `--ease: cubic-bezier(0.2,0,0.2,1)` die **263 heute impliziten**
      `ease`-Übergänge ersetzt, ist eine eigene, ausdrückliche Freigabe — das ist eine app-weite
      Änderung des Bewegungsgefühls und steht in keinem der drei Handoff-Dokumente als Folge.
- [x] **MOTION-05**: Der bestehende globale `prefers-reduced-motion`-Block ist nach `core.css`
      verschoben, dort dokumentiert und gegen Rückbau gesichert — ohne Dublette, ohne zusätzliches
      `!important`. `scroll-behavior: auto !important` entfällt ersatzlos: alle 16 Scroll-Stellen
      rufen `scrollIntoView({behavior:'smooth'})` mit explizitem Argument, gegen das CSS nie gewinnt.
      **Bereits erfüllt (nachgemessen, Plan 15-01):** im gesamten Verzeichnis `assets/styles/`
      gibt es keine einzige `scroll-behavior: auto !important`-Deklaration (null Treffer); der
      einzige ähnliche Fund ist `core.css`s `overscroll-behavior: contain`, eine andere
      Eigenschaft. Dieser Teil des Requirements verlangt keine weitere Ausführung.

### Typografie — eine Skala statt 55 Größen

- [ ] **TYPO-01**: `font-size` kommt aus einer Sieben-Stufen-Skala oder ist `inherit`; kein `em`
      mehr. Ausgangswert **784 Fundstellen in 30 Werten** (gemessen mit exakt dem in der CHECKLISTE
      abgedruckten grep — die Checkliste widerspricht der Ausgabe ihres eigenen Kommandos).
      **Atomar in einem Commit**: Wurzelregel und Ersetzungen zusammen, sonst ist die App in jeder
      noch nicht umgestellten Datei 12,5 % zu klein.
- [ ] **TYPO-02**: Die Wurzel bleibt bei **16px**, und die `--text-*`-Werte sind gegen 16 gerechnet
      (`xs 0.6875rem`, `sm 0.75rem`, `md 0.875rem`, `lg 1rem` …). Die Prämisse des Berichts ist
      falsch: gemessen ist `html` = 16px und `body` = 16px in **beiden** Layout-Profilen; es gibt
      **0** `html`-Selektoren in `assets/styles/`, `core.css:284` `body{}` setzt keine `font-size`,
      und `--font-size-base: 14px` erreicht die Wurzel nie — der Profilwechsel ändert die Basis
      heute um 0 %. Die Handoff-Variante hätte allein durch die Wurzelregel 3.431 von 5.032
      Elementen geändert und die Elemente unter 11px von 169 auf 326 erhöht.
- [ ] **TYPO-03**: Die Zuordnung deckt auch das ab, was in §5b fehlt: die 12 Werte ohne
      Tabellenzeile, die 8 `var(--font-size-*)`-Lesestellen (inklusive der iOS-Auto-Zoom-Sperre),
      die 53 gemessenen Verschachtelungsketten und `variables.css` selbst (dort stehen die 9px der
      Mobil-Navigation). Untergrenze: nichts unter `--text-xs` in der UI. Heute liegen 169 von 5.032
      Elementen unter 11px, kleinster Wert **7,70px** (`.dms-live-badge`) — und zwar auf dem
      **Desktop**, nicht auf dem Telefon wie der Bericht annimmt.
- [ ] **TYPO-04**: Die vier sichtbarsten Stellen sind nach der Umstellung geprüft:
      Karten-Metazeilen (Orte/NPCs), Statblock-Tabellen im Bestiar, DM-Screen-Widgets,
      Initiative-Zeile.
- [ ] **TYPO-05**: `font-weight` kennt kein `bold`, `normal` oder `300` mehr — **21 garantiert
      folgenlose Stellen** (14× `bold`→700, 3× `normal`→400, 300 einzeln entschieden) plus die tote
      Doppelzeile `spells.css:338-339`. Dort steht `font-weight: 700 !important` unmittelbar
      gefolgt von `font-weight: bold !important` — die einzige Regel im ganzen CSS mit zwei
      `font-weight`-Deklarationen; die zweite gewinnt. Das ist wörtlich das „bold und 700 parallel",
      das N-07 abstrakt beschreibt, ohne zu bemerken, dass es in zwei aufeinanderfolgenden Zeilen
      steht. Löschen senkt `!important` von 105 auf 104.
      *(`font-weight: 500` bleibt — 49 Vorkommen, eigene Entscheidung, nicht Teil dieses Milestones.
      Die Ratsche „nur 400/600/700" ist deshalb NICHT zu schreiben; sie schlüge ohnehin fehl, weil
      `declarationsOf()` `fonts.css` mitliest.)*

### Bedienbarkeit — ein Fokusring, ein Zähler

- [ ] **UX-01**: Es gibt **eine** dokumentierte globale `:focus-visible`-Regel, und sie steht in
      `core.css`. Sie existiert bereits — `dmscreen.css:1722`, nackt auf Klammertiefe 0, in beiden
      Bundles — und widerlegt damit die Kernaussage des Befundes: `.nav-tab` und `.btn-icon` haben
      ihren goldenen Ring längst. Sie wird **verschoben und dokumentiert**, nicht dupliziert.
      Der `:where()`-Vorschlag ist Nullarbeit: Spezifität (0,1,0) verliert gegen jede der 33
      `.x:focus { outline: none }`-Regeln (mindestens (0,2,0)); im kontrollierten Nachbau *mit*
      Patch blieben sieben Selektoren zeichengleich auf `outline-style: none`. `border-radius`
      gehört nicht in die globale Regel — es erzeugt einen Formsprung bei Tastaturfokus
      (`.nav-tab` 12px→4px).
- [ ] **UX-02**: Es ist entschieden, ob ein goldener **Rahmen** als Ringersatz gilt. Sagt man ja,
      sind 33 Stellen fertig und die Welle schrumpft auf 5 Edits; sagt man nein, sind 33
      `:focus`-Selektoren auf `:focus-visible` umzuschreiben — *das* ist die eigentliche Arbeit.
- [ ] **UX-03**: `.cf-combat-value input:focus` hat einen sichtbaren Fokuszustand — die einzige
      Stelle ohne jeden Ersatz. Der Patch-Vorschlag (`border-color` ergänzen) ist wirkungslos:
      das Feld trägt `border: none`, dort zeichnet eine Rahmenfarbe nichts. Lösung über
      `box-shadow`-Ring oder `:focus-within` am `.cf-combat-stat`.
- [ ] **UX-04**: Die Zauber-Ansicht zeigt eine korrekte Gesamtzahl **und** behält ihre
      Filterrückmeldung. Die beiden Zähler zeigen **nicht** dasselbe: `#spells-count` ist die
      Gesamtzahl, `#spell-count` ist `📖 12/318` — die einzige Live-Rückmeldung über 300+ Zauber,
      die `setViewCount()` (schreibt nur `String(n)`) gar nicht darstellen kann. Der zuerst genannte
      Handoff-Fix („zweiten Zähler entfernen") löscht die funktionierende Anzeige.
- [ ] **UX-05**: Der Altfehler dahinter ist behoben: `#spells-count` ist heute nach Anlegen oder
      Löschen eines Zaubers **stale** — `saveSpell()` (`spell-manager.js:434`) und `deleteSpell()`
      (`:530`) rufen nur `renderSpells()` + `save()`, nie `updateIOCounts()`; kein Post-Save-Hook
      ruft es, und `TAB_RENDER_REGISTRY.spells` rendert ebenfalls nur `renderSpells`. Der Badge
      steht bis zum nächsten `renderAll` falsch. `features/quests/quests-render.js` hat exakt
      dieselbe Lücke. Die `F-10`-Ratsche ist nachzuschärfen — sie ließ `#spell-count` durch, weil
      `COUNTED_VIEWS` `'spells'` kennt, aber nicht `'spell'`.
- [ ] **UX-06**: Beim Umbenennen von `.filter-bar` wird die CSS-Regel mitgezogen. Eine nackte
      Klasse `.filter-chips` existiert **nirgends** (0 Treffer in CSS/HTML/JS) — etabliert sind vier
      präfigierte Container. `.filter-bar` (`core.css:1965`) trägt echtes Layout
      (`display:flex; gap:6px; flex-wrap:wrap`); eine Umbenennung ohne die Regel bricht das Layout
      der drei Zauber-Filterleisten. Der Inline-Stil wird durch eine eigene Klasse ersetzt —
      `.meta-text` (`core.css:2045`) reicht nicht: es hat **zwei** Eigenschaften, nicht vier
      (es fehlen `margin-left: auto` und `white-space: nowrap`, und die `font-size` weicht ab).

### Abnahme — gemessene Endwerte statt Deklarationstext

- [ ] **GATE-01**: Für `COLOR-*` und `TYPO-*` gibt es eine **headless gemessene** Abnahme gegen das
      gebaute Bündel (berechnete Endwerte), nicht nur eine Quelltextprüfung. Das bestehende
      64-Test-Netz prüft ausschließlich Deklarationstext — genau deshalb konnte `--on-accent` 17 von
      24 Theme-Zellen verfehlen, ohne dass etwas rot wurde.
- [ ] **GATE-02**: Es gibt einen Test, der die Property-**Mengen** der vier Theme-Blöcke
      gegeneinander prüft. Heute tragen alle vier je 21 Properties, `FEHLT []` / `EXTRA []` — die
      Symmetrie ist perfekt und **durch nichts geschützt**: der bestehende `F-01`-Test bildet eine
      einzige `defined`-Menge über alle Dateien und Blöcke, eine Definition in irgendeinem Block
      genügt ihm.
- [x] **GATE-03**: Jede neue Ratsche ist beidseitig als rot-machend bewiesen (wie in Phase 14
      etabliert) und trägt ihren gemessenen Ausgangswert im Kommentar. Ausnahmelisten sind datiert
      und begründet — `T-2` wird als „leer außer den N benannten Ausnahmen" formuliert, nicht als
      Alles-oder-nichts (sonst widersprechen sich `COLOR-08` und `ELEV-04` gegenseitig und keiner
      der beiden Haken ist je setzbar).
- [x] **GATE-04**: Der Geltungsbereich ist pro Befund entschieden und dokumentiert. Alle
      Abnahme-greps enden heute bei `assets/styles/`; außerhalb liegen ~170 Fundstellen:
      7 numerische `rgba` in JS, 39 Inline-`font-size` in 6 Templates und 108 in 29 JS-Dateien,
      16 `font-weight`-Stellen. Zwei harte Ausnahmen bleiben: `features/shops/shop-export.js`
      (eigenständiges Druckdokument mit `pt`-Einheiten ohne Token-Zugriff) und der Editor-Marker
      (CLAUDE.md verbietet die Änderung ausdrücklich — „der feste dunkle Wert ist Absicht",
      eingefrorenes Testnetz).
- [ ] **GATE-05**: Nach jeder Welle sind alle Suiten grün (Jest, Playwright, pytest), `python build.py`
      läuft durch, und die App ist in **allen vier Themes** gesichtet — die Hälfte dieser Befunde ist
      nur dort zu sehen.

---

## Future Requirements

Anerkannt, aber nicht in diesem Milestone.

### Tastatur-Erreichbarkeit (eigener JS-Strang)

Beim Aufsetzen von v1.3 bewusst abgewählt. **Folge:** `UX-01` bleibt an genau diesen Elementen
wirkungslos, und die Tastaturprobe der CHECKLISTE („Tab durch Orte-Ansicht — Filter-Chips und
Listenzeilen zeigen einen Ring") ist bis dahin **nicht abnehmbar** und muss aus den
Akzeptanzkriterien heraus. Belege in `HANDOFF-V2-GEGENPROBEN.md`.

- **A11Y-01**: 176 interaktive `div`/`span`/`li`/`td` mit `data-action` bekommen `tabindex`/`role`
  und Enter-/Leertaste-Behandlung. `tabindex` kommt heute im ganzen JS-Baum **2×** vor (beide in
  `migration-wizard.js`), in den Templates **0×**; keiner der 12 `keydown`-Listener übersetzt auf
  `[data-action]`.
- **A11Y-02**: 58 Chip-Bedienelemente verstecken ihre Checkbox per `display: none` und sind damit
  aus dem Tabulator-Verlauf entfernt (38 Resistenz-Chips, 19 Beute-Kategorien, 1 Lair-Schalter) —
  Umstellung auf `.sr-only`.
- **A11Y-03**: Die Mobil-Navigation ist bedienbar: `.mobile-nav-toggle` ist ein reines `<div>` ohne
  `tabindex`, während die ~24 `.nav-tab`-Buttons per `position:fixed` + `translateY(100%−56px)`
  unter dem Sichtfenster liegen und trotzdem fokussierbar bleiben.
- **A11Y-04**: 155 Felder bekommen eine verknüpfte Beschriftung (380 `<label>`, davon genau **1**
  mit `for=`).
- **A11Y-05**: 35 von 36 Modalen bekommen `role="dialog"` und Fokusverwaltung — `showModal()` setzt
  heute nur eine Klasse, kein Fokus ins Modal, keine Rückgabe.
- **A11Y-06**: Die Trefferflächen der Kampf-Pips (`.death-save-dot`, `.la-dot`, `.lr-dot`: 16×16px
  bei 4px gap, Mittenabstand 20px) werden vergrößert — das sind die Elemente, die mitten im Kampf
  getroffen werden müssen.

### Weitere

- **TYPO-06**: Die 285 Vorkommen von `font-weight: 600` durchsehen, ob dort 400 hingehört.
  Abgewählt: unbegrenzte Handarbeit ohne Abnahmekriterium.
- **TYPO-07**: `font-weight: 500` (49 Vorkommen) auf 400 zusammenfalten. Braucht eine eigene
  Entscheidung: Segoe UI — die tatsächliche UI-Schrift — hat keinen 500er-Schnitt und rendert 500
  bereits als 400, die Änderung wäre unter Windows folgenlos, auf macOS/SF Pro und Android/Roboto
  aber sichtbar. Zudem hebt 500→600 die Unterscheidung `.nav-tab` gegen `.nav-tab.active` auf.
- **RESP-01**: Die zwei Responsive-Systeme zusammenführen. `loadLayout()`
  (`ui/layout-profiles.js:17-24`) entscheidet **einmalig beim Laden** bei 768px, die Media Queries
  brechen bei 600/900/1200, und es gibt keinen `resize`-Listener dafür. Reproduziert: Laden bei
  1200px, dann auf 500px verkleinert → `data-layout` bleibt `"desktop"`, während zwei Media Queries
  greifen. Sieben Selektoren deklarieren in beiden Systemen widersprechende Werte.
- **BORDER-01**: `--border` erreicht in keinem Theme 3:1 gegen die Feldfläche (WCAG 1.4.11 für
  Bedienelement-Begrenzungen): Dark 1,71 / Light 1,47 / Sepia 1,53 / **Contrast 2,82**. Auffällig
  ist das Contrast-Theme — es existiert, um Kontrast zu liefern, und liegt bei Formularfeldern knapp
  darunter. 489 Verwendungen.
- **STAT-01**: Die Statblock-Überschriften (`bestiary.css:212-216`, `:292-298`, `color: var(--red)`
  auf dem bewusst themenunabhängigen Pergament) liegen in **allen acht** geprüften
  Theme/Fläche-Kombinationen unter 4,5 (2,58 bis 3,92). `COLOR-05` kann das per Konstruktion nicht
  sehen, weil es nur gegen `--bg-card` misst — bei der Umstellung nicht als „Text auf `--bg-card`"
  fehlklassifizieren.

---

## Out of Scope

| Feature | Grund |
|---------|-------|
| Redesign, neue Komponenten, neue Navigationsstruktur | Refactoring im Bestand — Klassennamen, `data-action`/`data-render`/`data-value` und die JS-Delegation bleiben |
| Framework-Umstellung, Änderung der Datenhaltung | Bewährte non-ESM-Architektur bleibt (Constraint aus PROJECT.md) |
| Emoji-Icons ersetzen | Ausdrücklich nicht Teil des Auftrags |
| Die vier begründeten Ausnahmen aus Welle 3 | 65 `!important` in `.spell-desc *` (schlagen Inline-Stile des Editors), bedeutungstragende Farbskalen (Schadensarten, Attribute, Warenkategorien, Wissensgebiete), Vorlese-Papierpalette, Statblock-Pergamenttöne — alle vier bewusst themenunabhängig |
| Editor-Marker theme-fähig machen | CLAUDE.md verbietet es ausdrücklich: der feste dunkle Wert ist Absicht, das Testnetz ist eingefroren |
| `shop-export.js` auf Tokens umstellen | Eigenständiges Druckdokument mit `pt`-Einheiten, kein Token-Zugriff |
| v1.2-Restschuld (NQ-03..NQ-11, `npm run check`, `MODULE_TEST_EXCEPTIONS`, `DEBT-01`) | Beim Aufsetzen von v1.3 bewusst abgewählt — bleibt in PROJECT.md unter „Übertrag aus v1.2" |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BASE-01 | Phase 15 | Complete |
| BASE-02 | Phase 15 | Complete |
| BASE-03 | Phase 15 | Complete |
| BASE-04 | Phase 15 | Complete |
| DEAD-01 | Phase 15 | Pending |
| DEAD-02 | Phase 15 | Pending |
| DEAD-03 | Phase 15 | Pending |
| FIX-01 | Phase 15 | Complete |
| FIX-02 | Phase 15 | Pending |
| FIX-03 | Phase 15 | Pending |
| GATE-03 | Phase 15 | Complete |
| GATE-04 | Phase 15 | Complete |
| GATE-05 | Phase 15 | Pending |
| COLOR-01 | Phase 16 | Pending |
| COLOR-02 | Phase 16 | Pending |
| COLOR-03 | Phase 16 | Pending |
| COLOR-04 | Phase 16 | Pending |
| COLOR-05 | Phase 16 | Pending |
| COLOR-06 | Phase 16 | Pending |
| COLOR-07 | Phase 16 | Pending |
| COLOR-08 | Phase 16 | Pending |
| COLOR-09 | Phase 16 | Pending |
| COLOR-10 | Phase 16 | Pending |
| COLOR-11 | Phase 16 | Pending |
| GATE-01 | Phase 16 | Pending |
| GATE-02 | Phase 16 | Pending |
| ELEV-01 | Phase 17 | Pending |
| ELEV-02 | Phase 17 | Pending |
| ELEV-03 | Phase 17 | Pending |
| ELEV-04 | Phase 17 | Pending |
| MOTION-01 | Phase 17 | Pending |
| MOTION-02 | Phase 17 | Pending |
| MOTION-03 | Phase 17 | Pending |
| MOTION-04 | Phase 17 | Pending |
| MOTION-05 | Phase 15 | Complete |
| TYPO-01 | Phase 18 | Pending |
| TYPO-02 | Phase 18 | Pending |
| TYPO-03 | Phase 18 | Pending |
| TYPO-04 | Phase 18 | Pending |
| TYPO-05 | Phase 18 | Pending |
| UX-01 | Phase 19 | Pending |
| UX-02 | Phase 19 | Pending |
| UX-03 | Phase 19 | Pending |
| UX-04 | Phase 19 | Pending |
| UX-05 | Phase 19 | Pending |
| UX-06 | Phase 19 | Pending |

**Coverage:**

- v1.3 Requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0 ✓

**Zuordnungshinweis (GATE-01..05):** `GATE-03/04/05` sind in Phase 15 verortet, weil sie die
Regeln festlegen (rot-grün-Beweispflicht, Geltungsbereich CSS vs. JS, Grün-Pflicht nach jeder Welle),
denen alle Folgephasen nur noch folgen. `GATE-01/02` sind in Phase 16 verortet, weil `COLOR-*` die
erste Welle ist, die einen berechneten Endwert statt Deklarationstext braucht (der headless-Harness
und der Property-Mengen-Test); Phase 18 (`TYPO-*`) nutzt denselben Harness weiter, baut ihn nicht
neu.

---

_Requirements defined: 2026-09-08_
_Last updated: 2026-09-08 — Roadmap erstellt, Traceability gefüllt (Phasen 15–19, 46/46 Requirements gemappt)._
