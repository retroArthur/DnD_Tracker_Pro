# Abnahme-Checkliste

Alle Prüfungen gegen die gebündelte Datei bzw. den zusammengefassten CSS-Block.

## Welle 1

- [ ] **F-01 — keine undefinierten Tokens.** Alle im CSS per `var(--x)` gelesenen Namen sind entweder im `:root` definiert, per JS gesetzt (`--hp-pct`, `--map-zoom`, `--migration-hint-height`) oder haben einen Fallback.
      Prüfung: benutzte Namen aus `var(--…)` extrahieren, gegen die `--…:`-Definitionen abgleichen; Sollwert: Restmenge ⊆ {hp-pct, map-zoom, migration-hint-height}.
- [ ] **F-01b** — `rgba(var(--gold-rgb, …))` benutzt an allen Stellen denselben Fallback (aktuell zwei: `212,175,55` und `180,140,60`).
- [ ] **F-07 — alle Views im Container.** `grep -n 'section id="view-' ` liefert 30 Treffer, alle mit Zeilennummer *kleiner* als die von `</main>`.
- [ ] **F-07b** — `.wp-view-content`, `.tl-view-content`, `.rs-view-content`, `.fr-view-content` haben kein eigenes `padding` mehr (Padding kommt von `.main-content`).
- [ ] **F-13 — keine undefinierten Button-Klassen.** Für jede im Markup verwendete `btn-*`-Klasse existiert eine CSS-Regel. Prüfen: `btn-secondary`, `btn-warning`, `btn-icon`.
- [ ] **Sichtprüfung:** Tab „Orte" und Tab „Kalender" nebeneinander — Kartenfläche, Radius, Innenabstand, Randfarbe und Abstand zur Toolbar identisch.

## Welle 2

- [ ] **F-02** — `.tl-event-card`, `.wp-card`, `.fr-card`, `.rs-card` erben von einer gemeinsamen Klasse; keine eigenen `background`/`border-radius`-Deklarationen mehr.
- [ ] **F-08** — jede der 16 Listen-Views beginnt mit `<div class="section-toolbar">` mit denselben vier Gruppen in derselben Reihenfolge.
- [ ] **F-09** — Kalender, Fraktionen, Session-Prep und Reise haben ein funktionierendes Suchfeld (`.toolbar-search` mit `data-render`) und einen `.section-toolbar-io`-Block mit Export (und Import, wo Datenimport sinnvoll ist).
- [ ] **F-14** — `btn-success` erscheint nicht mehr an „+ Neu…"-Buttons; alle Primäraktionen sind `btn btn-primary`.
- [ ] **F-10** — alle Zähler heißen `<view>-count`; `setViewCount(view, n)` ist die einzige Schreibstelle; Reise hat einen Zähler.
- [ ] **F-11** — `.loc-layout`, `.npc-layout`, `.loot-layout`, `.enc-layout`, `.bestiary-layout`, `.fr-layout` nutzen `.master-detail`; identische Breakpoint-Kette; Fraktionen hat die Liste links und das Detail rechts wie alle anderen.

## Welle 3

- [ ] **F-03** — keine `rem`-Werte mehr in den `wp-/tl-/rs-/fr-`-Blöcken (Ausnahme: bewusste Typo-Skala).
- [ ] **F-04** — Hex-Literale im CSS außerhalb des `:root`-Blocks: unter 20 (Ausgangswert 240 Verwendungen / 100 Werte).
- [ ] **F-05** — genau zwei `font-family`-Quellen (UI + Mono) plus `inherit`; `.section-toolbar` erzwingt keine eigene Familie mehr.
- [ ] **F-06** — `border-radius` nur noch aus `var(--radius-sm|md|lg)` bzw. `50%`/`999px`; `gap`/`padding` nur aus der Space-Skala.
- [ ] **F-12** — höchstens vier verschiedene Breakpoint-Grenzen im gesamten CSS.
- [ ] **F-17** — nur eine Leerzustands-Familie (`.empty-state` + `-icon/-title/-desc/-action`).
- [ ] **F-18** — kein Selektor mehr als einmal definiert (Ausnahme: Media Queries); `!important` unter 20 Vorkommen.
- [ ] **F-19** — z-index nur noch aus fünf Tokens; Inline-Styles im Body-Markup unter 100.

## Regressionsprüfung nach jeder Welle
- [ ] Jeder der 30 Tabs öffnet ohne Konsolenfehler.
- [ ] Master-Detail-Views: Auswahl in der Liste füllt das Detail-Panel; Mobile-Layout (`[data-layout="mobile"]`, < 900 px) zeigt eine Spalte.
- [ ] Import/Export je View liefert dieselbe JSON-Struktur wie vorher.
- [ ] Themes und Design-Profile umschalten: keine View fällt auf Browser-Defaults zurück.
- [ ] Öffnen per `file://` (Doppelklick) funktioniert weiterhin ohne Konsolenfehler.
