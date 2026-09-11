---
phase: 15-befundlage-vorlauf
type: orchestrator-audit
created: 2026-09-11
subject: KNOWN_FALSE_POSITIVES in tests/unit/css-deletion-audit.test.js (Plan 15-12) und Praezision von collectConcatVarLiterals() (Plan 15-11)
audited_at: ec2bc5c
method: unabhaengiger, rein lesender Pruefer; instrumentierte Kopie von tools/css-usage-report.js im Sitzungs-Scratchpad (Token-Menge 1:1 identisch mit collectLiveTokens(): 3610 Tokens, davon 1719 aus collectConcatVarLiterals())
status: input-for-verifier
---

# Gegenprobe der Ausnahmeliste und der Zwischenvariablen-Regel

Angelegt vom Orchestrator waehrend `/gsd-execute-phase 15 --gaps-only`, nachdem Plan 15-12
15 der 22 im roten Lauf genannten Klassen nicht wiederhergestellt, sondern als
`KNOWN_FALSE_POSITIVES` ausgenommen hatte. Eine Ausnahmeliste in einem Waechtertest ist genau
die Stelle, an der sich eine echte Regression verstecken kann — deshalb unabhaengig geprueft.
Keine Repository-Aenderung durch den Pruefer.

## Teil 1 — die 15 Ausnahmen

**Ergebnis: 15 von 15 bestaetigte Fehlalarme, 0 echte Regressionen, 0 unentschieden.**

Gegenprobe der Zuordnung: Ohne `collectConcatVarLiterals()` ist die rohe Fehlerliste des
Loeschaudits auf heutigem Baum leer; mit der Regel sind es genau diese 15 Namen.

| Klasse | geloeschte Selektoren (Commit) | entscheidender Beleg | Begruendungstext korrekt? |
|---|---|---|---|
| description | `.list-detail-section.description .list-detail-text` (encounters.css, 4d7c8f3) | `list-detail-section`/`list-detail-text` haben heute und am Ausgangscommit 0 Treffer im Quellbaum | **unvollstaendig** — nennt nur `score`; derselbe String wird auch aus `locs` (locations-render.js:82) und `npcs` (npc-render.js:95) geerntet |
| dice-char-select | `.dice-char-select`, `.dice-char-select select` (dashboard.css, a37e17e) | view-tools.html:171 nur `id=` | ja |
| dice-formula-history | `.dice-formula-history` (dashboard.css, a37e17e) | nur `$('dice-formula-history')`, kein Template traegt die ID | ja |
| dice-history | `.dice-history` (dice.css, 6681595) | view-tools.html:235 `class="dice-history-scroll" id="dice-history"` | ja |
| divider | `.divider` (dmscreen.css, fa2fdfb) | Baustein heisst `editor-block editor-block-divider`; `git log -G` findet nie ein `class="…divider…"` | ja |
| enc-search | `.enc-search` + Varianten (encounters.css, 4d7c8f3) | view-encounters.html:12 `id="enc-search" class="toolbar-search"` | ja |
| encounter | `.entity-tag.encounter` (dashboard.css, a37e17e); `.map-marker.encounter` (dashboard.css, fb54b3e) | Elternklassen `entity-tag`/`map-marker` existieren in keinem Markup (Karten-Feature entfernt in dddc833) | **teilweise falsch** — `allowedTypes` fliesst sehr wohl in eine Klasse: global-search.js:180 `class="search-result-type ${safeType}"`, `type:'encounter'` bei :144. `encounter` ist also eine lebende Laufzeitklasse; folgenlos nur, weil es nie eine `.search-result-type.encounter`-Regel gab |
| loc-search | `.loc-search` + `:focus` (core.css, 50b30cf) | view-content.html:60 nur ID + `toolbar-search` | ja |
| loot | `.entity-tag.loot` (dashboard.css, a37e17e) | Elternklasse fehlt; global-search pusht nie `type:'loot'` | ja (Hinweis: `allowedTypes` speist dennoch ein Klassenattribut) |
| loot-search | `.loot-search` + Varianten (npcs.css, e743f8d) | view-resources.html:12 nur ID + `toolbar-search` | ja |
| npc-search | `.npc-search` + Varianten (npcs.css, e743f8d) | view-content.html:12 nur ID + `toolbar-search` | ja |
| party | `.map-marker.party` (dashboard.css, fb54b3e) | Elternklasse fehlt; geernteter String ist der Vergleich `rel.targetType === 'party'` (npc-render.js:522) | ja |
| timer-list | `.timer-list` (dashboard.css, a37e17e) | view-tools.html:285 `class="timer-grid" id="timer-list"` | ja |
| timer-name | `.timer-name` (dashboard.css, a37e17e) | modals-tools.html:8 nur `id=` | **Mechanismus falsch beschrieben** — die neben `class=` gematchte `nameInput` ist `$('preset-name')` (timers.js:76); das Literal stammt aus einer gleichnamigen Deklaration `$('timer-name')` bei :189 |
| timer-presets | `.timer-presets` (dashboard.css, a37e17e) | view-tools.html:269 `class="timer-quick-presets" id="timer-presets"` | **vage/falsch** — es ist `$('timer-presets')` (:22); der gematchte `container` ist eine andere gleichnamige Variable `$('preset-list')` (:48) |

Zusaetzlich:

- Der Testkommentar (Zeile 135) verweist auf „deferred-items.md Eintrag 4" — der Eintrag ist **6**.
- **Zweiter, nicht dokumentierter Defekt der Regel:** sie vereinigt die Literale ALLER
  gleichnamigen `var`/`let`/`const` einer Datei und matcht jeden Bezeichner im Fenster, auch
  Vergleichsoperanden — nicht nur tatsaechlich in die Klasse verkettete Werte.
- **Restrisiko der Liste:** Sie ist nur nach Klassenname geschluesselt. `encounter` ist bereits
  eine lebende Laufzeitklasse an `.search-result-type`. Wird spaeter eine
  `.search-result-type.encounter`-Regel angelegt und von einer kuenftigen Bereinigung wieder
  geloescht, bliebe der Test wegen dieser Ausnahme gruen.

## Teil 2 — verdeckt dieselbe Uebergreifung tote Klassen im Pruefmodus?

**Ja, gemessen.** Heutige CSS: 2227 Klassen. Tot mit Regel: 159 (= `analyze()`).
Tot ohne Regel: 191. **32 Klassen sind ausschliesslich durch `collectConcatVarLiterals()`
lebendig.** Die Belegung der 5 Live-Praefixe ist mit und ohne Regel identisch.

**11 — korrekt geerntet (die beabsichtigte Zwischenvariablen-Form):**
`bloodied`, `healthy`, `defeated` (initiative-mob.js:174/201, dmscreen-widgets-base.js:97),
`expertise` (party-details.js:153), `expired` (timers.js:320), `fr-hist-plus`, `fr-hist-minus`
(fraktionen-render.js:215), `init-mob-dmg-inputs`, `hidden` (initiative-mob.js:189),
`ds-toggle-btn--active` (dice-stats-render.js:279/280), `sb-file-warn` (soundboard-render.js:51).

**15 — tatsaechlich lebendig, aber nur zufaellig richtig** (wirklich ueber eine
Laufzeitvariable gesetzt, die das Werkzeug nicht verfolgen kann; geerntet wurde ein
fremder String):
`ally`, `player` (initiative.js:175 `init-entry init-row ${cb.type}`; undo.js:451),
`character` (global-search.js:180), `buff`, `healing` (spell-manager.js:176; shops-core.js:596),
`custom`, `srd` (bestiary-render.js:126), `plot`, `side` (quests-render.js:79;
performance-extras.js:396), `error` (utilities.js:279, undo.js:237 — geerntet aus dem
Objektnamen `ErrorHandler`, render/helpers.js:9), sowie `crimson`, `sage`, `sky`, `slate`,
`violet` (Vorlese-Varianten; ohnehin in `DEAD_EXCEPTIONS`).

**6 — tote CSS, durch ID-Lookup oder Datenschluessel verdeckt:**

- `locations-list` — geerntet aus `$('locations-list')` (locations-render.js:50); Markup ist
  `class="loc-list" id="locations-list"` (view-content.html:83); Regeln in dashboard.css:580 und
  variables.css:431.
- `arcana`, `history`, `investigation`, `nature`, `religion` — geerntet aus den `SKILLS`-Schluesseln
  in dice-core.js:11. Die Regeln `.dms-knowledge-item.<gebiet>` (dmscreen.css:1920-1924) greifen
  nie, weil dmscreen-widgets-reference.js:217-233 alle fuenf `dms-knowledge-item`-Elemente OHNE
  Modifikatorklasse rendert. **Offene Designfrage, keine Loeschfrage:** entweder tote CSS, oder
  dem Markup fehlen die Modifikatoren, fuer die die Farben gedacht waren (vgl. Plan 15-04, der
  genau dieses Widget wieder zum Rendern gebracht hat).

**Folge:** Nach Klassen-Kontext-Belegen liegt die echte Totenzahl bei mindestens **165**, nicht
159. 15 der 32 regelabhaengigen Lebend-Urteile sind nur zufaellig richtig.

## Was das fuer die Verifikation bedeutet

- Die Ausnahmeliste verdeckt heute **keine** Regression — die Wiederherstellungen aus 15-12 sind
  vollstaendig.
- Das DEAD-01/DEAD-02-Ziel „die Totenliste misst, was sie zu messen behauptet" ist mit 15-11 in
  Richtung Recall verbessert, aber mit einem neuen **Praezisions**-Fehler erkauft: mindestens 6
  tote Klassen sind im Pruefmodus unsichtbar, und die Loeschwellen der Phasen 16-19 wuerden sie
  nicht finden.
- Kandidaten fuer eine weitere Lueckenrunde oder fuer den Uebertrag: (1) Regel auf tatsaechlich
  in `class=` verkettete Bezeichner und die zum Verwendungsort naechste Deklaration einschraenken,
  (2) die vier ungenauen Begruendungen und den Querverweis im Test korrigieren, (3) die
  Ausnahmeliste zusaetzlich an Selektor-Kontext statt nur Klassenname binden, (4) Designfrage
  Wissensgebiete-Modifikatoren klaeren.

Rohdaten (sitzungslokal, nicht versioniert): `harness.js`, `css-usage-report.copy.js`,
`provenance.json`, `summary.txt` im Scratchpad-Unterordner `audit/` dieser Sitzung.
