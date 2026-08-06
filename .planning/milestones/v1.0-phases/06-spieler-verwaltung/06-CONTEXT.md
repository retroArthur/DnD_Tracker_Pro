# Phase 6: Spieler-Verwaltung - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Diese Phase liefert drei Spielleiter-Werkzeuge, die das **bestehende Party-/Charakter-System erweitern** (CHAR-01…03) — kein Neubau eines Charakterbogens:

1. **XP-/Milestone-Tracker** (CHAR-01) — Gruppen-Fortschritt verfolgen, XP aus abgeschlossenen Encountern übernehmen, Levelaufstieg-Hinweis an der XP-Schwelle.
2. **Inspiration** (CHAR-02) — Inspiration per Klick vergeben/entfernen, sofort sichtbarer Marker in der Party-Übersicht.
3. **Erweiterte Charakterwerte** (CHAR-03) — Skill-Proficiencies, Saving Throws und Angriffe auf einen Blick; klickbarer Skill-Check liefert sofort den korrekten Wurf inkl. Übungsbonus.

**Brownfield-Erweiterung, kein neuer Daten-Tab:** Vieles existiert bereits am Charakter-Objekt (`inspiration`-Boolean, `saveProficiencies`, `level` + auto `proficiencyBonus`, Attribut-Modifier) und in den Hilfsfunktionen/Konstanten (`getProficiencyBonus`, `getAbilityModifier`, `SKILL_INFO`, `CR_TO_XP`, `renderClickableDice`). Diese Phase fügt das **Fehlende** hinzu (XP-Feld + Verteilung, Inspiration-Toggle, Skills/Expertise, Angriffe, klickbare Würfe) und verdrahtet es.

**Diese Phase klärt das WIE der gerouteten Features — sie fügt KEINE neuen Capabilities hinzu.** Scope kommt aus ROADMAP.md / REQUIREMENTS.md und ist fixiert. Insbesondere bleibt ein **vollständiger digitaler Spieler-Charakterbogen Out of Scope** (REQUIREMENTS.md) — nur DM-relevante Werte am Tisch.

</domain>

<decisions>
## Implementation Decisions

### Querschnitt (für alle 3 Features gesetzt — nicht erneut hinterfragen)
- **D-00a:** Rein **offline & lokal** — keine KI, keine API, kein Netzwerk.
- **D-00b:** **Deutsche UI** durchgängig.
- **D-00c:** Jedes neue Feature folgt dem etablierten Muster: CRUD mit `pushUndo()`/`saveUndoState()` vor destruktiven Mutationen, `esc()`/`sanitizeHTML()` für jeglichen Nutzerinhalt, `data-action`-Delegation (keine inline-Handler), 3-fach-Modulregistrierung (loader.js + build.py [+ tab-registry.js falls Tab]), Build-Dedup-Regeln (keine funktions-lokalen `const X = window.X`, keine doppelten Top-Level-Funktionsnamen).
- **D-00d:** **Maximaler Reuse statt Neubau.** Vorhandene Felder/Funktionen/Konstanten erweitern, nicht duplizieren. Kein vollständiger digitaler Spieler-Charakterbogen (Out of Scope) — nur DM-relevante Werte. **Regel-Korrektheit (5e-konform) und Spieltisch-Tempo (minimale Klicks)** sind die Leitprinzipien (vgl. Phase 4).

### CHAR-02: Inspiration
- **D-01:** **Klickbarer ⭐ auf der Charakterkarte** (`renderCharacterCard`) als Vergabe-/Entfernen-Toggle. Der Stern ist **immer sichtbar** (gefüllt = an, ausgegraut/Umriss = aus), damit man ihn auch zum Vergeben antippen kann (heute erscheint ⭐ nur bei `inspiration === true`). Eigener **`-stop`-Handler** (Vorbild `show-hp-calculator-stop`, `party-render.js:183`), damit der Klick NICHT die `edit-char`-Aktion der Karten-Kopfzeile auslöst.
- **D-02:** **Binär An/Aus** — bleibt der vorhandene `inspiration`-Boolean (kein Schema-Umbau, keine Migration, 5e-RAW-konform). Der Toggle ist eine **reguläre Mutation (`save()`), KEIN `saveUndoState()`** (trivial reversibel, kein Undo-Spam — analog HP-Edits).

### CHAR-03: Erweiterte Charakterwerte (Skills, Saves, Angriffe)
- **D-03:** **Alle 18 Fertigkeiten mit Übungs-Häkchen + optionalem Expertise-Häkchen** (doppelter Übungsbonus — Schurke/Barde). Datenstruktur analog dem bestehenden `saveProficiencies`-Objekt (z.B. `skillProficiencies{}` + `skillExpertise{}`, Schlüssel = Skill-Keys). **Skill→Attribut-Mapping und deutsche Namen aus `SKILL_INFO`** (`core/constants.js:217`) wiederverwenden — NICHT neu definieren. (Jack-of-all-Trades bewusst nicht in v1.)
- **D-04:** **Klick = Wurf, mit Vorteil/Nachteil-Buttons.** Klick auf eine Fertigkeit/einen Save/einen rohen Attribut-Check würfelt **W20 + Attribut-Modifier + Übungsbonus (×2 bei Expertise)** über den vorhandenen Roller; das Ergebnis landet in der bestehenden Würfel-Historie/Event-Log. **Skills UND Saves UND rohe Attribut-Checks sind klickbar.** Zwei kleine Zusatz-Schaltflächen je Wurf (oder ein Modus-Schalter, Discretion) für **Vorteil/Nachteil** (Muster aus dem Floating-Dice-Panel). Rechen-Helfer: `getAbilityModifier()` (`game-rules.js:16`), `getProficiencyBonus()`/`getProfBonus`.
- **D-05:** **Angriffe als freie, manuell gepflegte Liste je Charakter** — Einträge `{ name, attackBonus, damage(sformel), opt. damageType }`. **Angriffsbonus und Schaden sind klickbar** (W20+Bonus / Schadenswurf) über `renderClickableDice()` (`bestiary-render.js:41`), wie im Bestiary-Statblock. Kein automatisches Ableiten aus Loot-Waffen (es gibt kein Waffen-/Schadens-Schema im Loot).
- **D-06:** **Heimat: Anzeige im Detail-Modal, Bearbeitung im bestehenden Charakter-Editor.** `showCharacterDetails()` (`party-details.js`) bekommt eine **Skills-Sektion (nach Attribut gruppiert)**, die vorhandene Save-Anzeige wird **klickbar**, plus eine **Angriffs-Sektion** — alles „auf einen Blick". Pflege der Skill-/Expertise-Häkchen und der Angriffsliste im **bestehenden Charakter-Formular** (`assets/templates/view-party.html` + `saveCharacter()`/`editChar()`), genau wie heute `saveProficiencies`. **Kein neuer Tab, keine Vollansicht.**

### CHAR-01: XP-/Milestone-Tracker (Defaults vom Nutzer bestätigt — als gelockte Entscheidungen)
- **D-07:** **Beide Aufstiegsarten.** Eine Einstellung pro Gruppe/Kampagne „Aufstiegsart: XP | Milestone". Im **Milestone-Modus** kein XP-Tracking, nur ein „+1 Level"-Knopf (einzelner Charakter und/oder ganze Gruppe).
- **D-08:** **Neues `xp`-Feld je Charakter**, mit Migration (Default `0`; optional aus aktuellem Level ableiten). Aktueller XP-Stand wird im Detail-Modal angezeigt (Karte optional).
- **D-09:** **Encounter-Abschluss-Trigger in der Initiative-Ansicht** („Kampf abschließen / XP verteilen") — der natürliche Ort am Tisch, wenn ein Kampf endet. **XP automatisch aus den Kampf-Monstern summiert** über `CR_TO_XP` (Kombattanten mit CR/`statblockRef`), **manuelle Korrektur/Direkteingabe möglich**. (Zusätzlicher Einstieg im Encounters-Tab = Discretion.)
- **D-10:** **Verteilung:** Gesamt-XP **gleichmäßig auf alle aktiven Charaktere** (lebende Party-Mitglieder, keine Gegner) — entspricht SC1 „auf alle aktiven Charaktere".
- **D-11:** **Levelaufstieg = Hinweis, kein Auto-Bump.** Erreicht `xp` die nächste Schwelle, erscheint ein Hinweis (Badge/Toast „X kann aufsteigen"); der DM bestätigt den Level-Anstieg manuell (regelkonform, kein stilles Überschreiben von Werten). **Benötigt eine neue PHB-Level→XP-Aufstiegstabelle als Konstante (20 Werte)** — `XP_THRESHOLDS` in `encounter-calculator.js` ist die Encounter-**Schwierigkeitstabelle**, NICHT die Aufstiegstabelle.

### Claude's Discretion
- **Genaue deutsche UI-Texte** — Button-Labels, Tooltips, Sektion-Überschriften, Hinweis-Texte.
- **Exakte Feld-/Schema-Benennung** — `xp`, `skillProficiencies`/`skillExpertise`, `attacks[]`, Aufstiegsart-Flag (z.B. `D.settings.levelingMode`) — Planner legt fest, konsistent mit bestehenden Namen.
- **Platzierung des Abschluss-Buttons** in der Initiative (Toolbar vs. „Kampf beenden"-Aktion) und ob zusätzlich ein Einstieg im Encounters-Tab angeboten wird.
- **Adv/Disadv-Bedienung** — zwei Mini-Buttons je Wurf vs. ein globaler Vorteil/Nachteil-Modus-Schalter im Modal.
- **Optionaler Inspiration-Überblick** in `renderPartyOverview` (Quick-Stats-Leiste) zusätzlich zum Karten-Stern.
- **Migrationsstrategie** für `xp`/Skill-Felder in `systems/spellslots/version-migration.js` (neue Schema-Version + Defaults).
- **Darstellung des XP-Stands** (nur Detail-Modal vs. auch Karte/Party-Übersicht).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-Scope & Anforderungen
- `.planning/ROADMAP.md` § „Phase 6: Spieler-Verwaltung" — Goal + die 3 messbaren Success Criteria.
- `.planning/REQUIREMENTS.md` § „Spieler-Verwaltung (CHAR)" — CHAR-01/02/03 (vollständiger Wortlaut); § „v2 Requirements" (**CHAR-04 Fraktions-Ruf pro Charakter = NICHT diese Phase**); § „Out of Scope" (**Vollständiger digitaler Spieler-Charakterbogen** ausgeschlossen — nur DM-relevante Werte).
- `.planning/PROJECT.md` § Constraints / Out of Scope — offline-first, kein Netzwerk, non-ESM, deutsche UI.

### Codebase-Karten
- `.planning/codebase/STRUCTURE.md` — „Where to Add New Code" (3-fach-Modulregistrierung, Render/CRUD-Split, CSS-Einbindung, Build-Dedup-Constraints).
- `.planning/codebase/CONVENTIONS.md` — Namens-/Code-Konventionen für neue Module/Funktionen.
- `.planning/codebase/CONCERNS.md` — bekannte Build-/Dedup-Fallstricke (funktions-lokale `const X = window.X`, doppelte Top-Level-Funktionsnamen).

### Wiederzuverwendender Quellcode (Pfade + Zeilen)
- `features/party/party-crud.js` — `saveCharacter()` (`:174`, Charakter-Schema inkl. `inspiration` `:235`, `saveProficiencies` `:198`), `editChar()` (`:287`), `updateProficiencyBonus()` (`:444`). **Andockpunkt für `xp`, `skillProficiencies`/`skillExpertise`, `attacks[]`.**
- `features/party/party-details.js` — `showCharacterDetails()` (Detail-Modal: Attribut-Grid mit Modifiern + Save-Proficiency-Anzeige + ⭐ im Titel). **Heimat für Skills-/Angriffs-Sektion + klickbare Würfe (D-04/05/06).**
- `features/party/party-render.js` — `renderCharacterCard()` (`:131`; ⭐-Anzeige `:175`; `-stop`-Action-Vorbild `show-hp-calculator-stop` `:183`), `renderPartyOverview()` (`:360`). **Andockpunkt Inspiration-Toggle (D-01) + optionaler Inspiration-Überblick.**
- `core/constants.js` — **`SKILL_INFO`** (`:217`, alle 18 Skills `{name, attr}` mit deutschen Namen — Quelle für D-03); Hinweis: separates `SKILLS` existiert fürs Würfelsystem. **Heimat für die neue PHB-Level→XP-Aufstiegstabelle (D-11).** Konstanten via `DND_RULES.*`-Namespace.
- `utils/game-rules.js` — `getAbilityModifier()` (`:16`), `getProficiencyBonus(level)` (`:32`), `formatModifier()` (`:43`). **Rechenkern für Skill-/Save-/Attribut-Würfe (D-04).**
- `features/bestiary/bestiary-render.js` — `renderClickableDice()` (`:41`) — klickbare W20-/Schadens-Spans. **Muster für Angriffs- und Skill-Würfe (D-04/D-05).**
- `features/dice/dice-core.js` — Würfel-Roller + Floating-Panel mit Vorteil/Nachteil-Schnellwürfen + Historie/Event-Log (Ziel der klickbaren Würfe, D-04).
- `features/encounter-calculator.js` — `XP_THRESHOLDS` (`:9`, **Encounter-Schwierigkeit, NICHT Aufstieg**), `CR_TO_XP` (`:32`, Monster→XP für Auto-Summe D-09), `calculateMonsterXP()` (`:447`).
- `features/initiative.js` — `renderInit()`, `nextTurn()`, Battlefield-Banner. **Andockpunkt für Encounter-Abschluss-Button + XP-Verteilung (D-09/D-10).**
- `features/dmscreen/dmscreen-render.js` — Fertigkeiten-Referenz-Widget (`:1150`, 18 Skills nach Attribut) als optische Vorlage (Datenquelle bleibt `SKILL_INFO`).
- `core/data.js` — `D.characters`-Schema (Felder ergänzen), `D.settings` (Aufstiegsart-Flag D-07), Migration-Hook.
- `systems/spellslots/version-migration.js` — Migration für `xp`/Skill-Felder (neue Schema-Version + Defaults, D-08).
- `ui/actions/entity-actions.js` — `data-action`-Handler (Inspiration-Toggle, Skill/Save/Attribut-Würfe, Level-Up-Bestätigung); `ui/actions/combat-actions.js` — Initiative-Abschluss/XP-Verteilung.
- `loader.js` + `build.py` (Modullisten) — synchron halten, falls neue Module entstehen.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`inspiration`-Boolean** (am Charakter; ⭐ in `renderCharacterCard` `:175` und im Detail-Modal-Titel) — bleibt; braucht nur den Klick-Toggle + immer sichtbaren Stern (D-01/D-02).
- **`saveProficiencies{}`** (`party-crud.js:198`, im Modal angezeigt) — direkte Strukturvorlage für `skillProficiencies`/`skillExpertise`; Saves werden zusätzlich klickbar (D-03/D-04).
- **`SKILL_INFO`** (`core/constants.js:217`) — fertige 18-Skill→Attribut-Map mit deutschen Namen; kein Neu-Definieren nötig (D-03).
- **`getAbilityModifier`/`getProficiencyBonus`/`formatModifier`** (`utils/game-rules.js`) — Rechenkern für klickbare Würfe (D-04).
- **`renderClickableDice()`** (`bestiary-render.js:41`) + Roller (`dice-core.js`) — klickbare W20-/Schadens-Würfe + Vorteil/Nachteil + Historie (D-04/D-05).
- **`CR_TO_XP` / `calculateMonsterXP()`** (`encounter-calculator.js`) — Auto-Summe der Encounter-XP (D-09).
- **`-stop`-Action-Muster** (`show-hp-calculator-stop`, `party-render.js:183`) — verhindert Karten-Header-Klick beim Inspiration-Toggle (D-01).
- **`showCharacterDetails()`** (`party-details.js`) — vorhandenes „Bogen auf einen Blick"-Modal; wird um Skills/Angriffe erweitert (D-06).

### Established Patterns
- **CRUD/Mutation:** `pushUndo()`/`saveUndoState()` vor destruktiven Aktionen → mutieren → `save()` → re-render. Trivial-reversible Toggles (Inspiration, Würfe) ohne Undo (D-02).
- **Event-Delegation:** neue Aktionen als `data-action` in `ui/actions/*.js` registrieren, nie inline-Handler; `-stop`-Varianten gegen Eltern-Klicks.
- **XSS:** `esc()` für Nutzerwerte (Skill-/Angriffsnamen, Notizen); `sanitizeHTML()` nur wo Markup gewollt ist. Würfel-Spans NACH Sanitisierung injizieren (sanitize-then-dice, vgl. Phase 3/4).
- **Build/Loader:** falls neue Module — in `build.py` UND `loader.js` an korrekter Position; keine `const X = window.X` in Funktionen; keine doppelten Top-Level-Funktionsnamen (Pass-3-Dedup).
- **ID-Vergleiche:** `parseEntityId()` für Charakter-IDs; `EntityLookup.character(id)`.
- **Konstanten:** neue Konstanten in `core/constants.js`, Zugriff via `DND_RULES.*`.

### Integration Points
- **Charakter-Schema** (`core/data.js` / `saveCharacter()`): `xp`, `skillProficiencies`, `skillExpertise`, `attacks[]` ergänzen; `D.settings` um Aufstiegsart-Flag.
- **Migration** (`version-migration.js`): neue Felder mit Defaults nachrüsten.
- **Charakter-Editor** (`view-party.html` + `saveCharacter`/`editChar`): Eingabe-UI für Skills/Expertise/Angriffe (analog Save-Checkboxen).
- **Detail-Modal** (`showCharacterDetails`): Skills-Sektion, klickbare Saves, Angriffs-Sektion, XP-Anzeige.
- **Charakterkarte** (`renderCharacterCard`): immer sichtbarer, klickbarer Inspiration-Stern.
- **Initiative** (`initiative.js` + `ui/actions/combat-actions.js`): „Kampf abschließen / XP verteilen"-Button + XP-Summe + Verteilung + Level-Hinweis.
- **CSS:** in vorhandene Dateien (`assets/styles/party.css`, `initiative.css`) erweitern, ggf. neue Sektion — `@import` + `build.py css_files` nur bei NEUER Datei.

</code_context>

<specifics>
## Specific Ideas

- **Spieltisch-Tempo:** Inspiration = ein Klick auf den Stern; Skill-/Save-/Angriffs-Würfe = ein Klick → Ergebnis sofort in der Historie; Vorteil/Nachteil ohne Umweg (Phase-4-Philosophie der minimalen Klicks).
- **Regel-Korrektheit (5e):** Inspiration binär (RAW); Expertise = doppelter Übungsbonus; Levelaufstieg als Hinweis statt Auto-Bump (DM behält Kontrolle, keine stillen Wertänderungen) — vgl. die bewusst regelkonforme Entscheidung bei den Legendären Resistenzen (Phase 4).
- **Reuse vor Neubau:** ausdrücklich `SKILL_INFO`, `saveProficiencies`-Struktur, `renderClickableDice`, `CR_TO_XP`, das bestehende Detail-Modal und der Charakter-Editor — nichts davon wird dupliziert.
- **Out-of-Scope-Grenze:** bewusst KEIN voller digitaler Charakterbogen — nur die am DM-Tisch nützlichen Werte (Skills/Saves/Angriffe/XP/Inspiration).

</specifics>

<deferred>
## Deferred Ideas

- **Fraktions-Ruf pro Charakter** → CHAR-04 (v2). Hier nicht.
- **Jack-of-all-Trades** (Barde: halber Übungsbonus auf ungelernte Checks) — bewusst aus v1 herausgehalten (D-03); mögliche spätere Verfeinerung.
- **Angriffe aus zugewiesenen Loot-Waffen ableiten** — verworfen (kein Waffen-/Schadens-Schema im Loot); denkbar, falls später ein Ausrüstungs-/Waffensystem entsteht.
- **Inspiration zählbar/stapelbar** — verworfen zugunsten 5e-RAW-Binär (D-02); House-Rule-Erweiterung wäre eine eigene spätere Option.
- **Zusätzlicher XP-Abschluss-Einstieg im Encounters-Tab** — als optionale Ergänzung notiert (D-09, Discretion); v1 reicht der Initiative-Trigger.

### Reviewed Todos (not folded)
None — discussion stayed within phase scope (kein `todos/`-Verzeichnis, keine offenen TODOs für Phase 6).

</deferred>

---

*Phase: 06-spieler-verwaltung*
*Context gathered: 2026-06-15*
