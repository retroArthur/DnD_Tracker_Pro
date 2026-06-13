# Phase 3: Bestiary - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Die App erhält einen eigenen **Bestiary-Tab**: ein offline durchsuch- und filterbares SRD-Monster-Kompendium (deutsch, kuratiert ~100–150 Monster, SRD 5.1, vollständige Statblocks), eine **CRUD-Verwaltung für eigene Kreaturen** (mit Undo) und die **direkte Übernahme** von Monstern in Encounter und Initiative. Requirements BEST-01, BEST-02, BEST-03.

Keine Initiative-Erweiterungen (Statblock-Popup, Legendary-Tracker, Mob-Modus) — die gehören zu Phase 4 und werden hier nur datenseitig vorbereitet (Combatant↔Bestiary-Referenz).

</domain>

<decisions>
## Implementation Decisions

### SRD-Datenbestand & Sprache (BEST-01)

- **D-01:** **Deutsch durchgängig** — Monsternamen und alle Texte (Traits, Aktionen, Reaktionen) auf Deutsch, konsistent mit den 76 deutschen SRD-Zaubern (`core/srd-spells.js`) und den 12 deutschen Monster-Templates. Es gibt keine offizielle freie deutsche SRD-Monster-Quelle — Übersetzungen werden beim Implementieren erstellt/kuratiert; der Researcher prüft Community-Quellen (z.B. dnddeutsch.de) auf Brauchbarkeit und Lizenz.
- **D-02:** **Kuratiert ~100–150 Monster** über alle CR-Stufen (die am Tisch häufigsten Gegner, Goblin bis Drache). Deckt den Großteil der Spielabende ab, hält Übersetzungsqualität und Datengröße im Griff. Spätere Erweiterung Richtung Vollbestand bleibt möglich.
- **D-03:** **Quelle: SRD 5.1 / 2014er Regeln** — passt zu den 12 bestehenden Templates, der deutschen Begriffswelt der App und den meisten deutschen Community-Übersetzungen. Nicht die 2024er-Statblocks.
- **D-04:** **Voller SRD-Statblock pro Monster** — Attribute, Saves, Skills, Resistenzen/Immunitäten/Zustandsimmunitäten, Sinne, Sprachen, Traits, Aktionen, Reaktionen, **Legendäre Aktionen**. Dies ist bewusst das Fundament für Phase 4 (Statblock-Popup INIT-01, Legendary-Tracker INIT-02) — die Daten müssen jetzt vollständig sein.

### Bestiary-Tab & Darstellung (BEST-01)

- **D-05:** **Liste + Detail-Panel** — kompakte Monsterliste (Name, CR, Typ) links, Klick öffnet den vollen Statblock rechts daneben. Gleiches Muster wie der NPC-Tab; schnelles Durchblättern am Tisch ohne Modal-Geklicke. Lange Listen über vorhandenen Virtual-Scroll.
- **D-06:** **Klassischer 5e-Statblock-Look** im Detail-Panel (Pergament-Optik, rote Überschriften, Trennlinien, Attribut-Zeile mit Modifikatoren). Vorhandenes Read-Aloud-/Pergament-CSS wiederverwenden.
- **D-07:** **Suchleiste + Filter-Chips** — Suchfeld oben, darunter immer sichtbare CR- und Typ-Filter (Chips/Dropdowns). Lehnt sich an `filter-engine.js` und das Shop-Filter-Muster an. Sofortige, netzfreie Ergebnisse (SC1).
- **D-08:** **SRD und eigene Kreaturen gemischt in einer Liste**, zusammen durchsuch- und filterbar, unterschieden durch ein kleines **Herkunfts-Badge** („SRD" / „Eigen") plus einen Filter „Nur Eigene". Am Tisch sucht man das Monster, nicht die Quelle.
- **D-09:** **Anklickbare Würfe im Statblock** — Trefferwürfe (z.B. +4) und Schadensformeln (z.B. 1d6+2) sind klickbar und würfeln über den vorhandenen Dice-Roller. Vorbild: `rollQrefDice()` im Quick-Reference-Panel.
- **D-10:** **Portraits nur für eigene Kreaturen** — eigene Kreaturen können ein URL-Portrait bekommen (wiederverwendetes Avatar-System `systems/avatars.js`); SRD-Monster bleiben bildlos (offline-tauglich, kein Pflegeaufwand für 100+ Bild-URLs).
- **D-11:** **Favoriten-Stern** — häufig genutzte Monster anheften / über einen „Favoriten"-Filter schnell wiederfinden. Vorbild: `features/dice/dice-favorites.js`. Favoriten werden als reine ID/Key-Liste im User-State gehalten (z.B. `D.bestiaryFavorites`), **nie** als Kopie der SRD-Daten.

### Eigene Kreaturen (BEST-02)

- **D-12:** **Einheitliches Kreatur-Datenmodell** — eigene Kreaturen teilen exakt dieselbe volle Statblock-Struktur wie SRD-Monster (D-04). Unterschied ist nur die Herkunft: SRD = statische Built-in-Daten (read-only), Eigene = editierbare Einträge in `D.bestiary[]`. So funktionieren Detail-Panel, Klick-Würfe und Übernahme zu Encounter/Initiative für beide identisch.
- **D-13:** **CRUD mit Undo** — Anlegen, Bearbeiten und Löschen eigener Kreaturen laufen über das etablierte Muster (`saveUndoState()` vor jeder Mutation, `deleteWithConfirm`/`afterCrudOperation`), alle Operationen sind rückgängig machbar (SC2).

### Übernahme in Encounter & Initiative (BEST-03)

- **D-14:** **Mengen-Dialog beim Hinzufügen zur Initiative** — beim Klick auf „Zur Initiative" fragt ein kleiner Dialog die Anzahl (z.B. 3 Goblins) und fügt alle in einem Rutsch hinzu.
- **D-15:** **Auto-Wurf + HP-Variation, wie im Encounter-Calculator** — jedes Exemplar bekommt einen eigenen 1d20+Bonus-Initiativewurf und leicht variierte HP (±10 %). Wiederverwendung der bewährten `addMonster`-Mechanik aus `features/encounter-calculator.js`.
- **D-16:** **Automatische Nummerierung** mehrerer gleicher Monster („Goblin 1", „Goblin 2", „Goblin 3") — am Tisch eindeutig zuordenbar, wer welchen Schaden hat.
- **D-17:** **Statblock-Referenz am Kombattanten** — jeder aus dem Bestiary erzeugte Kombattant merkt sich seine Herkunft (z.B. `statblockRef`). Phase 4 kann damit per Klick den vollen Statblock zeigen, ohne erneute Verknüpfung. Runtime-Feld am Combatant, **keine Migration nötig** (analog Legendary-/Mob-Felder laut STATE.md).

### Architektur (locked — aus STATE.md ## Architecture Notes)

- **SRD-Monsterdaten:** statisch wie `core/srd-spells.js` (lazy-gecacht), **NIEMALS in `D`**, nie in Undo-Snapshots, nie in Exporten.
- **Eigene Kreaturen:** neue Collection `D.bestiary[]` — Teil von Undo/Export; einmalige Migration **`3.0.0`** in `systems/spellslots/version-migration.js`.
- **Favoriten:** `D.bestiaryFavorites` (nur IDs/Keys) — User-State, klein, in `D`.
- **Combatant `statblockRef`:** Runtime-only, keine Migration.
- **Modullisten:** alle neuen Module in `build.py` **und** `loader.js` synchron eintragen (Sync-Check seit Phase 1).

### Claude's Discretion

- **Editor für eigene Kreaturen:** Wiederverwendung/Erweiterung des bestehenden Encounter-Statblock-Formulars (`saveEncounter` in `encounters-crud.js` hat bereits Saves, Resistenzen, Immunitäten, Zustandsimmunitäten, Sprachen, Traits, Equipment, Aktionen) vs. eigener Bestiary-Editor. **Empfehlung:** ein gemeinsames Formular als Superset, ergänzt um die fehlenden Felder für den vollen Statblock (Legendäre Aktionen, Reaktionen, Sinne) — damit D-04 und D-12 für eigene Kreaturen pflegbar sind. Planung entscheidet die konkrete Umsetzung.
- **„Zu Encounter hinzufügen"-Weg (BEST-03):** genaue Verdrahtung der Encounter-Seite (eigene `D.encounters`-Zeile aus Monsterdaten erzeugen, Wiederverwendung des Encounter-Formulars/`saveEncounter`). Encounter sind in dieser App einzelne Gegner-Einträge — Planung klärt das Mapping.
- **Schicksal der 12 `monster-templates.js`-Einträge:** **Empfehlung:** als Teil des kuratierten SRD-Seeds ins Bestiary überführen (Goblin, Skelett, Ork etc. gehören ohnehin in die ~100–150). Den `loadMonsterTemplate`-Knopf im Encounter-Formular entweder entfernen oder auf das Bestiary umlenken. Kein toter Code zurücklassen.
- **Datengröße-Spike (aus STATE.md):** pruned+minified messen — **<200 KB** rechtfertigt Inline-Einbettung (wie `srd-spells.js`), **≥200 KB** → Index + IndexedDB-Lazy-Load. Entscheidet die Researcher-/Planungsphase.
- **Daten-Repräsentation:** Struktur der statischen Statblock-Daten und Lazy-Load-Mechanik (Proxy-Muster wie `MONSTER_TEMPLATES`), CR-Sortier-/Anzeigeformat (Bruchwerte 1/8, 1/4 …), Badge-Gestaltung, **alle exakten deutschen UI-Texte** (Tab, Dialoge, Filter, Mengen-Dialog).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Anforderungen & Roadmap
- `.planning/REQUIREMENTS.md` — BEST-01, BEST-02, BEST-03 (vollständiger Wortlaut)
- `.planning/ROADMAP.md` §"Phase 3: Bestiary" — die 3 Erfolgskriterien (sofortige Offline-Suche/Filter; CRUD mit Undo; Übernahme zu Encounter/Initiative mit korrekten HP/AC)

### Architektur-Entscheidungen (locked)
- `.planning/STATE.md` §"Architecture Notes" — `D.bestiary[]`, SRD-Daten nie in `D`, Migration `3.0.0`, `statblockRef` runtime-only, Würfel-/Statistik-Stores getrennt, Modullisten-Sync. **Bindend.**

### Codebase-Maps (Ist-Stand)
- `.planning/codebase/ARCHITECTURE.md` — Datenfluss (CRUD-Pattern, `save()`/Undo), `EntityLookup`, `TAB_RENDER_REGISTRY`, Modul-Layer & Build-Dedup-Regeln, Hinweis „SRD-Spells lazy-cached, nicht in D" als Vorbild
- `.planning/codebase/CONVENTIONS.md` — Namens-/Struktur-/CSS-Konventionen für den neuen Tab und die neuen Module
- `.planning/codebase/STRUCTURE.md` — wo neue Feature-Module, Templates und Styles liegen

### Leitlinien aus Phase 1
- `.planning/phases/01-stabilisierung/01-CONTEXT.md` — Spieltisch-Leitlinien (Hinweise höchstens einmal pro Sitzung, kein stiller Datenverlust, `saveUndoState()` vor destruktiven Aktionen) — gelten auch hier

### Bestehender Code (Vorbilder & Andockpunkte)
- `features/encounters/monster-templates.js` — 12 deutsche Statblock-Templates, Lazy-Proxy-Muster, `loadMonsterTemplate()` (D-03/D-12, Discretion: Überführung)
- `features/encounter-calculator.js` — `addMonster()` / `addCalculatorToInitiative()`: Auto-Initiative-Wurf, HP-Variation ±10 %, Nummerierung, Battlefield (D-14/D-15/D-16)
- `features/encounters/encounters-crud.js` — `saveEncounter()`: vorhandenes volles Statblock-Formular (Saves, Resistenzen, Immunitäten, Sprachen, Traits, Aktionen) (D-12, Editor-Discretion)
- `features/initiative.js` — `addCombatant()` / `addPartyToInit()`: Combatant-Schema (Andockpunkt für `statblockRef`, D-17)
- `core/srd-spells.js` — Vorbild für statische, lazy-gecachte deutsche SRD-Daten außerhalb von `D` (D-01/Architektur)
- `systems/avatars.js` — Portrait-System für eigene Kreaturen (D-10)
- `features/dice/dice-favorites.js` — Favoriten-Muster (D-11)
- `systems/spellslots/quick-reference.js` — `rollQrefDice()` für anklickbare Würfe (D-09)
- `systems/tab-registry.js` — neuen Bestiary-Tab registrieren (Tab-Registry-Pattern)
- `systems/spellslots/version-migration.js` — Migration `3.0.0` für `D.bestiary[]`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`monster-templates.js`** — 12 fertige deutsche Statblocks (goblin, skeleton, zombie, orc, wolf, bandit, guard, kobold, giant_rat, cultist, ogre, troll) + Lazy-Proxy `MONSTER_TEMPLATES`; Daten- und Felder-Vorlage für das Bestiary-Schema
- **`encounter-calculator.js` → `addMonster()`** — komplette „Monster zur Initiative"-Mechanik inkl. 1d20+Bonus-Wurf, HP-Variation, Sortierung, Battlefield-Banner; direkt nachnutzbar für D-14/D-15/D-16
- **`encounters-crud.js` → `saveEncounter()`** — umfangreiches Statblock-Formular; Basis für den Editor eigener Kreaturen (als Superset zu erweitern)
- **`srd-spells.js`** — Muster für statische, lazy-gecachte deutsche SRD-Daten, die NICHT in `D` liegen — exakt das Vorgehen für die SRD-Monster
- **Virtual Scroll** (`ui/virtual-scroll.js`), **Filter-Engine** (`utils/filter-engine.js`), **Fuzzy-Search** (`systems/search/global-search.js`), **Avatar-System** (`systems/avatars.js`), **Dice-Favoriten** (`features/dice/dice-favorites.js`), **`rollQrefDice()`** — alle für Liste/Filter/Bilder/Favoriten/Klick-Würfe wiederverwendbar

### Established Patterns
- **CRUD:** `saveUndoState()` → mutieren → `save()`/`saveImmediate()` → re-render; `deleteWithConfirm`/`afterCrudOperation` aus `utils/crud-helpers.js`
- **Tab-Registry:** neue Tabs MÜSSEN in `TAB_RENDER_REGISTRY` registriert werden, nie in `switchView` sonderbehandelt
- **Statische SRD-Daten:** lazy-cached, außerhalb `D`, nie in Undo/Export (wie `srd-spells.js`) — gilt für SRD-Monster
- **XSS:** `esc()` / `sanitizeHTML()` für alle aus `D` oder Statblock-Texten gerenderten Inhalte (Traits/Aktionen enthalten bewusst `<b>`-Markup → `sanitizeHTML`)
- **Build/Loader:** neue Module in `build.py` UND `loader.js`; keine `const X = window.X` in Funktionen, keine doppelten Top-Level-Funktionsnamen
- **`parseEntityId()`** für alle ID-Vergleiche

### Integration Points
- **Neuer Tab:** Template in `assets/templates/`, Styles in `assets/styles/` (eigene `bestiary.css`), Registrierung in `systems/tab-registry.js` + Navigation
- **Initiative:** `features/initiative.js` `addCombatant`-Pfad / Combatant-Schema (neues Feld `statblockRef`)
- **Encounter:** `features/encounters/encounters-crud.js` (Übernahme-Weg, ggf. `loadMonsterTemplate`-Knopf umlenken)
- **Migration:** `systems/spellslots/version-migration.js` (`3.0.0` legt `D.bestiary` an)
- **State-Schema:** `core/data.js` (`D.bestiary`, `D.bestiaryFavorites` initialisieren)

</code_context>

<specifics>
## Specific Ideas

- **Spieltisch-Tauglichkeit bleibt Leitlinie:** schneller Zugriff (Favoriten, sofortige Suche/Filter), keine wiederholten Toasts, Undo überall.
- **Konsistenz mit der App:** klassischer 5e-Statblock-Look, aber durchgängig deutsche Begriffe und UI-Texte — wie bei den 76 deutschen SRD-Zaubern.
- **Phase-4-Vorbereitung ist bewusster Teil von Phase 3:** vollständige Statblocks (D-04) und `statblockRef` am Kombattanten (D-17) existieren, damit Statblock-Popup, Legendary- und Mob-Tracker in Phase 4 ohne Datennachrüstung andocken können.
- **Lizenz/Attribution:** SRD 5.1 ist CC-BY-4.0 — Quelle und Attribution wie bei den Zaubern dokumentieren; deutsche Übersetzungsquelle auf Lizenz prüfen (Anschluss an STAB-11-Audit).

</specifics>

<deferred>
## Deferred Ideas

- **Erweiterung auf den vollständigen SRD-Monsterbestand (~330)** — bewusst auf später verschoben (D-02: erst kuratierte ~100–150); spätere Ausbau-Phase.
- **Statblock-Popup in der Initiative (INIT-01), Legendary-Aktionen/Resistenzen-Tracker (INIT-02), Mob-Modus (INIT-03)** — bereits als **Phase 4** in der Roadmap; Phase 3 liefert nur die Datengrundlage (vollständige Statblocks + `statblockRef`), implementiert die Tracker aber nicht.

</deferred>

---

*Phase: 03-bestiary*
*Context gathered: 2026-06-13*
