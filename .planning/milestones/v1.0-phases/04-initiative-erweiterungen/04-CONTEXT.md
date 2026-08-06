# Phase 4: Initiative-Erweiterungen - Context

**Gathered:** 2026-06-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Die **Initiative-Ansicht** bekommt drei Spielleiter-Erweiterungen, die ausschließlich auf den in Phase 3 gelegten Daten aufsetzen (vollständige Statblocks D-04, `statblockRef` am Kombattanten D-17):

1. **Statblock-Popup (INIT-01):** Voller Statblock eines Kombattanten direkt aus der Initiative abrufbar.
2. **Legendäre Aktionen & Resistenzen (INIT-02):** Klickbare Rundenzähler für Bosse, mit korrektem Reset-Verhalten.
3. **Mob-Modus (INIT-03):** Gegnergruppen als eine Initiative-Zeile mit Pool-HP und Sammel-Würfen.

Requirements INIT-01, INIT-02, INIT-03.

**Nicht in dieser Phase:** Keine neuen Daten/Monster (Phase 3 abgeschlossen), kein Encounter-Builder-Umbau, keine neuen Bestiary-Felder. Die Statblock-Daten sind fertig — diese Phase liefert nur **Verhalten & Bedienung am Tisch**. Combatant-Felder für Legendary + Mob sind **runtime-only, keine Migration** (laut STATE.md).

</domain>

<decisions>
## Implementation Decisions

### Statblock-Popup (INIT-01)

- **D-01:** **Seitliches Panel (Drawer rechts)** — der volle Statblock erscheint in einem seitlichen Panel, die Initiative-Liste bleibt sichtbar (Statblock UND Kampf gleichzeitig im Blick). Wiederverwendung des Bestiary-Detail-Renderers `renderBestiaryDetail(id, source)` (`features/bestiary/bestiary-render.js:218`), der bereits den klassischen Pergament-Statblock inkl. „Legendäre Aktionen" rendert.
- **D-02:** **Auslöser = eigener 📖-Button pro Kombattanten-Zeile** — bewusst KEIN Klick auf Name/Zeile (vermeidet Konflikt mit bestehenden Zeilen-Interaktionen: HP-Edit, Effekte, Auswahl). Weicht vom wörtlichen SC1 („Klick auf einen Kombattanten") ab, erfüllt es aber funktional eindeutiger.
- **D-03:** **Basis-Infos bei Kombattanten ohne `statblockRef`** — der Button erscheint bei ALLEN Kombattanten. Bei Bestiary-Monstern (mit `statblockRef`) zeigt das Panel den vollen Statblock; bei Spielern / manuell angelegten Gegnern (ohne Ref) zeigt es die verfügbaren Basis-Infos (HP/AC/Effekte/Conditions). Einheitliches Verhalten, nie eine tote Schaltfläche.
- **D-04:** **Klickbare Würfe im Panel** — Treffer- und Schadensformeln sind anklickbar und würfeln über den vorhandenen Roller (Wiederverwendung `renderClickableDice()` aus `bestiary-render.js:41`). Direkt am Tisch würfeln.

### Legendäre Resistenzen (INIT-02)

- **D-05:** **Anzahl auto-parsen + manuelles Override** — die Statblocks haben kein eigenes Zählfeld für Legendäre Resistenzen, nur Trait-Text (z.B. „Legendäre Resistenz (3/Tag)"). Die App liest die Zahl automatisch per Regex auf das Muster `(N/Tag)` aus dem passenden Trait und erlaubt manuelle Korrektur pro Kombattant (für eigene Kreaturen mit abweichendem Textformat).
- **D-06:** **Anzeige nur bei Erkennung** — der Resistenz-Zähler erscheint nur, wenn im Statblock eine Legendäre Resistenz erkannt wurde. Bei normalen Gegnern keine UI-Unordnung.
- **D-07:** **KEIN Auto-Reset bei Init 20 (regelkonform /Tag)** — klickbare Pips, Verbrauch reduziert um 1, aber **kein** automatischer Rundenwechsel-Reset. Legendäre Resistenzen sind pro Tag (Reset bei Langer Rast), nicht pro Runde. Reset per manuellem Knopf; optionale Kopplung an den Rest-Manager (Claude's Discretion). **Bewusste Abweichung vom Roadmap-SC2-Wortlaut**, der LR + LA gemeinsam bei Init 20 zurücksetzt — das wäre regelwidrig (Boss faktisch unbesiegbar gegen Saves). Vom Nutzer bestätigt.

### Legendäre Aktionen (INIT-02)

- **D-08:** **Einfacher Punkte-Zähler (Pips)** — z.B. 3 Pips; Klick verbraucht 1 Punkt. UI-Vorbild: die bestehenden Death-Save-Dots / Concentration-Badges in `features/initiative.js`. Schnell am Tisch, minimale UI. Die inhaltlichen Details der einzelnen Aktionen sieht der DM bei Bedarf im Statblock-Panel (INIT-01) — keine itemisierte Aktionsliste in v1.
- **D-09:** **Auto-Anzeige bei `legendaryActionsPerRound > 0`** — der Zähler erscheint automatisch nur bei Monstern mit gesetztem Feld (existiert bereits im SRD-Schema, `core/srd-monsters.js:72`). Bei normalen Gegnern keine UI.
- **D-10:** **Auto-Reset bei Init 20** — die Punkte füllen sich automatisch beim Rundenwechsel wieder auf (regelkonform: LA = pro Runde). Andockt an die vorhandene Init-20-Logik / `nextTurn()` (`features/initiative.js:372`, `round++` bei `:386`; Init-20-Zeile bei `:150`).

### Mob-Modus (INIT-03)

- **D-11:** **Erstellung via Toggle im Mengen-Dialog** — der bestehende Phase-3-Mengen-Dialog („Zur Initiative" aus dem Bestiary, `features/bestiary/bestiary-actions.js`) bekommt eine Option „als Mob führen". Statt N Einzelzeilen entsteht **eine** Mob-Zeile. Nutzt die vorhandene Verdrahtung.
- **D-12:** **Pool-HP + „X von N am Leben"** — Pool-HP = Summe aller Einzel-HP; Schaden frisst vom Pool. Die Mob-Zeile zeigt automatisch berechnet, wie viele Kreaturen noch leben (Pool-HP / Einzel-Max-HP). Bei 0 Pool-HP ist der Mob besiegt (SC3).
- **D-13:** **Sammel-Angriff: beide Modi umschaltbar** — (a) einfacher **N-fach-Wurf** (eine Angriffsprobe, vom DM N-mal gewertet, Wurf + Schaden je Treffer) ODER (b) offizielle **DMG-Mob-Regel** (aus Ziel-AC ableiten, wie viele der N automatisch treffen, kein Würfeln). DM wählt je nach Mob-Größe.
- **D-14:** **Schaden automatisch summiert** — bei einem Treffer würfelt/summiert die App den Schaden der Treffer automatisch (Anzahl Treffer × Waffenschaden) über den klickbaren Roller. Ein Klick = fertiger Gesamtschaden.

### Architektur (locked — aus STATE.md ## Architecture Notes)

- **Combatant-Felder für Legendary Actions + Mob Mode:** **Runtime-only, keine Migration** (analog `statblockRef` aus Phase 3). Neue Felder am Combatant-Objekt: z.B. `legendaryActions { max, remaining }`, `legendaryResistance { max, remaining }`, `mob { count, poolHp, maxPoolHp, individualMaxHp, attackMode }` — Benennung klärt die Planung.
- **SRD-Monsterdaten:** NIEMALS in `D`, nie in Undo-Snapshots oder Exporten. Das Statblock-Panel liest lazy über `getSRDMonsters()` (SRD) bzw. `D.bestiary[]` (custom), aufgelöst über `statblockRef = { source, id }`.
- **Modullisten:** alle neuen Module in `build.py` UND `loader.js` synchron eintragen.
- **XSS:** Statblock-Texte (Traits/Aktionen) enthalten bewusst `<b>`-Markup → `sanitizeHTML()`; alle sonstigen aus `D` gerenderten Werte → `esc()`.
- **Persistenz/Undo:** `saveUndoState()` vor destruktiven Mutationen (Mob auflösen, Kombattant entfernen); Pip-Klicks/HP-Abzüge sind reguläre Initiative-Mutationen → `save()`.

### Claude's Discretion

- **Genaue deutsche UI-Texte:** Button-Tooltip (z.B. „Statblock anzeigen"), Panel-Header, Mengen-Dialog-Toggle-Label („Als Mob führen"), Mob-Zeilen-Format („Goblin-Schwarm (7/10)"), Pip-Labels.
- **Panel-Realisierung:** eigenes Drawer-Element vs. wiederverwendetes Modal-Gerüst als seitliches Panel gestylt — Planung entscheidet. Ebenso: direkter Aufruf von `renderBestiaryDetail()` vs. schlanke Kopie (Researcher prüft Kopplung an Bestiary-Tab-Abhängigkeiten).
- **DMG-Mob-Regel-Berechnung (D-13b):** exakte Schwellen-Tabelle „benötigter d20-Wert → Anteil automatischer Treffer" (DMG „Handling Mobs"). Researcher/Planung präzisiert die konkrete Formel.
- **LR-Reset-Kopplung (D-07):** nur manueller Knopf vs. zusätzlich an Lange Rast / Rest-Manager gekoppelt.
- **Pip-Darstellung/CSS:** Anlehnung an Death-Saves-Dots / Concentration-Badge — exakte Optik.
- **Integration Mob ↔ bestehende Initiative-Features:** Death Saves, Concentration, AoE-Schaden-Modal, Quick Actions und Conditions sind auf Einzel-Kombattanten ausgelegt. Eine Mob-Sonderzeile muss diese sinnvoll ausblenden/anpassen (z.B. keine Death Saves für eine Gruppe; AoE-Modal-Zielauswahl gegen einen Mob). **Forschungs-/Planungs-Flag** — in der Diskussion nicht im Detail entschieden.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Anforderungen & Roadmap
- `.planning/REQUIREMENTS.md` — INIT-01, INIT-02, INIT-03 (vollständiger Wortlaut)
- `.planning/ROADMAP.md` §"Phase 4: Initiative-Erweiterungen" — die 3 Erfolgskriterien. **Achtung:** SC2 setzt LR + LA gemeinsam „bei Initiative 20 zurück". Diese Diskussion weicht bei den Legendären Resistenzen bewusst ab (D-07: LR = pro Tag, kein Init-20-Reset). Legendäre Aktionen folgen SC2 (Init-20-Reset, D-10).

### Architektur-Entscheidungen (locked)
- `.planning/STATE.md` §"Architecture Notes" — Legendary/Mob-Combatant-Felder **runtime-only** (keine Migration), SRD-Daten nie in `D`, Modullisten-Sync (build.py + loader.js). **Bindend.**

### Phase-3-Datenfundament (direkte Andockpunkte)
- `.planning/phases/03-bestiary/03-CONTEXT.md` — D-04 (voller SRD-Statblock inkl. Legendäre Aktionen), D-12 (einheitliches Kreatur-Datenmodell SRD = eigene), D-17 (`statblockRef`-Schema am Kombattanten). Genau diese Daten nutzt Phase 4.

### Codebase-Maps (Ist-Stand)
- `.planning/codebase/ARCHITECTURE.md` — `initiative.js`-Tail/Globals-Export, `EventDelegation`-Dispatch, `TAB_RENDER_REGISTRY`, `save()`/Undo-Fluss, Build-Dedup-Regeln (keine `const X = window.X` in Funktionen, keine doppelten Top-Level-Funktionsnamen)
- `.planning/codebase/CONVENTIONS.md` — Namens-/CSS-/Struktur-Konventionen für neue Module
- `.planning/codebase/STRUCTURE.md` — wo neue Feature-Module, Templates und Styles liegen

### Leitlinien aus Phase 1
- `.planning/phases/01-stabilisierung/01-CONTEXT.md` — Spieltisch-Leitlinien (`saveUndoState()` vor destruktiven Aktionen, kein stiller Datenverlust, Hinweise höchstens einmal pro Sitzung) — gelten auch hier

### Bestehender Code (Vorbilder & Andockpunkte)
- `features/initiative.js` — `renderInit()` (`:104`), `nextTurn()` (`:372`, `round++` `:386`), Init-20-Zeile (`:150`), Battlefield-Banner (`:1329`), bestehende Death-Saves-/Concentration-/AoE-Logik. **Zentraler Andockpunkt** für Statblock-Button, Legendary-Pips, Mob-Zeile und Round-Reset (D-02/D-08/D-10/D-11/D-12)
- `features/bestiary/bestiary-render.js` — `renderBestiaryDetail(id, source)` (`:218`) voller Pergament-Statblock inkl. „Legendäre Aktionen" (`:420`); `renderClickableDice()` (`:41`) — Basis für Statblock-Panel und Klick-Würfe (D-01/D-04)
- `features/bestiary/bestiary-actions.js` — `statblockRef`-Erzeugung `{ source, id }` (`:101`) und der Mengen-Dialog-Pfad → Mob-Toggle (D-11)
- `core/srd-monsters.js` — SRD-Schema mit `legendaryActions[]` + `legendaryActionsPerRound` (`:71`) und Trait-Text als Quelle für LR-Parsing (D-05/D-09)
- `features/encounter-calculator.js` — `addMonster()`: Auto-Initiative-Wurf + HP-Variation ±10 % (Referenz für Mob-Erzeugung/Pool-HP-Summe, D-11/D-12)
- `features/initiative-extras.js` — vorhandene Initiative-Zusatzlogik (Andockpunkt prüfen)
- `systems/hp-calculator.js` — `showHpCalculator()` / `applyHpChange()` — Muster für Pool-HP-Schadensabzug (D-12)
- `ui/actions/combat-actions.js` — Registrierung neuer `data-action`-Handler (Statblock-Button, Legendary-Pip-Klick, Mob-Toggle/Mob-Angriff)
- `features/dice/dice-core.js` / `systems/spellslots/quick-reference.js` `rollQrefDice()` — Roller für Klick-Würfe und automatisch summierten Mob-Schaden (D-04/D-14)
- `systems/conditions.js` — Conditions-Anzeige in der Initiative (Integrations-Check Mob-Zeile)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`renderBestiaryDetail(id, source)`** (`bestiary-render.js:218`) — fertiger Pergament-Statblock-Renderer inkl. Legendäre Aktionen; direkt für das Statblock-Panel (D-01)
- **`renderClickableDice()`** (`bestiary-render.js:41`) — klickbare Würfel-Spans für Treffer-/Schadensformeln (D-04, D-14)
- **`statblockRef = { source, id }`** auf jedem Bestiary-Kombattanten (`bestiary-actions.js:101`) — die Brücke vom Combatant zum Statblock
- **SRD-Schema-Felder `legendaryActions[]` + `legendaryActionsPerRound`** (`srd-monsters.js:71`) — Datengrundlage für LA-Zähler-Auto-Anzeige (D-09)
- **Init-20-Zeile + `nextTurn()`/`round++`** (`initiative.js:150`, `:372`, `:386`) — vorhandener Rundenwechsel-Haken für LA-Reset (D-10)
- **Death-Saves-Dots / Concentration-Badge** (`features/initiative.js`) — UI-Vorbild für die Legendary-Pips (D-08)
- **Mengen-Dialog** (`bestiary-actions.js`) — bestehender „Zur Initiative"-Pfad, erweitert um den Mob-Toggle (D-11)
- **`addMonster()` / HP-Variation** (`encounter-calculator.js`) — Referenz für Mob-Pool-HP-Aufbau (D-12)
- **`hp-calculator.js`** — Schadensabzug-Muster für Pool-HP (D-12)

### Established Patterns
- **CRUD/Mutation:** `saveUndoState()` → mutieren → `save()`/`saveImmediate()` → re-render. Mob-Auflösen/Kombattant-Entfernen sind destruktiv → Undo-pflichtig.
- **Event-Delegation:** neue Aktionen als `data-action` in `ui/actions/combat-actions.js` registrieren, nie inline-Handler.
- **Statische SRD-Daten:** lazy über `getSRDMonsters()`, außerhalb `D`, nie in Undo/Export — gilt fürs Statblock-Panel.
- **XSS:** `sanitizeHTML()` für Statblock-Markup (`<b>`), `esc()` für sonstige Werte.
- **Build/Loader:** neue Module in `build.py` UND `loader.js`; keine `const X = window.X` in Funktionen; keine doppelten Top-Level-Funktionsnamen (Pass-3-Dedup).
- **`parseEntityId()`** für Combatant-ID-Vergleiche; **Achtung:** SRD-`statblockRef.id` ist ein String (z.B. `'goblin'`) — Auflösung über `source`, nicht über `parseEntityId`.

### Integration Points
- **Initiative-Render:** `renderInit()` erweitern um 📖-Button, Legendary-Pip-Block (bedingt) und die Mob-Sonderzeile.
- **Rundenwechsel:** `nextTurn()` / Init-20-Logik um LA-Reset ergänzen (NICHT LR — D-07).
- **Mengen-Dialog:** Mob-Toggle in den bestehenden „Zur Initiative"-Pfad (`bestiary-actions.js`).
- **Statblock-Panel:** neues Drawer-Element/Template + `bestiary-render.js`-Renderer; Styles in `assets/styles/` (Initiative- oder eigene Datei).
- **Combat-Actions:** neue `data-action`-Handler in `ui/actions/combat-actions.js`.
- **Integrations-Konflikt-Punkt:** Mob-Sonderzeile vs. Death Saves / Concentration / AoE-Modal / Quick Actions — muss in der Planung aufgelöst werden (Research-Flag).

</code_context>

<specifics>
## Specific Ideas

- **Regel-Korrektheit war dem Nutzer wichtig:** Legendäre Resistenzen sind pro Tag, nicht pro Runde — die App setzt sie bewusst NICHT bei Init 20 zurück, obwohl das Roadmap-Erfolgskriterium das wörtlich nahelegt (D-07). Legendäre Aktionen dagegen schon (D-10).
- **Alles auf Spieltisch-Tempo ausgelegt:** Pips wie Death-Saves, Auto-Anzeige nur wo relevant, Auto-Reset der LA, automatisch summierter Mob-Schaden, klickbare Würfe überall — der DM soll mit minimalen Klicks durchkommen.
- **Statblock-Button universell:** auch Spieler/manuelle Kombattanten bekommen den Button (mit Basis-Infos), damit die Bedienung überall gleich ist (D-03).
- **Konsistenz mit der App:** klassischer 5e-Pergament-Look des Statblocks (aus Phase 3), durchgängig deutsche UI-Texte.

</specifics>

<deferred>
## Deferred Ideas

- **Itemisierte Legendäre-Aktionsliste mit Punktkosten** (Klick auf konkrete Aktion zieht ihre Kosten ab und würfelt) — bewusst zugunsten des einfachen Pip-Zählers (D-08) zurückgestellt; mögliche spätere Ausbau-Stufe.
- **Nachträgliches Verknüpfen** von Kombattanten ohne `statblockRef` mit einem Bestiary-Monster — verworfen zugunsten der Basis-Infos (D-03); denkbar als spätere Komfortfunktion.
- **Nachträgliches Zusammenfassen** bestehender Einzel-Kombattanten zu einem Mob — verworfen zugunsten des Toggles im Mengen-Dialog (D-11); denkbar als spätere Erweiterung.
- **LR-Reset an Rest-Manager / Lange Rast koppeln** — als optionale Veredelung notiert (D-07, Claude's Discretion); v1 reicht ein manueller Reset-Knopf.

### Reviewed Todos (not folded)
None — keine offenen Todos matchten diese Phase (`todo match-phase 4` → 0 Treffer).

</deferred>

---

*Phase: 04-initiative-erweiterungen*
*Context gathered: 2026-06-13*
