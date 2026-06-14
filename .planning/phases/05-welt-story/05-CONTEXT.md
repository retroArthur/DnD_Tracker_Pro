# Phase 5: Welt & Story - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Diese Phase liefert fünf Spielleiter-Werkzeuge für Weltenbau & Story-Pflege (WELT-01…05):

1. **Session-Prep-Assistent** (WELT-01) — strukturierte Vorbereitung der nächsten Session
2. **NPC-Generator** (WELT-02) — NPCs per Knopfdruck aus lokalen Tabellen
3. **Kampagnen-Timeline** (WELT-03) — chronologische Ereignisse, an einen In-Game-Kalender gebunden
4. **Reise- & Wetter-Simulator** (WELT-04) — Tagesmärsche, Wetter, Zufallsbegegnungen je Gelände
5. **Fraktionen & Ruf-System** (WELT-05) — Fraktionsverwaltung mit Ruf-Tracking der Gruppe

**Großer Phasenblock:** 4 neue Tabs (Session-Prep, Timeline/Kalender, Reise, Fraktionen) + Generator-Funktion. Der Planner schneidet das in Wellen. Geteiltes Fundament zwischen Timeline und Reise ist das **In-Game-Datum** (`D.calendar`).

**Diese Phase klärt das WIE der gerouteten Features — sie fügt KEINE neuen Capabilities hinzu.** Scope kommt aus ROADMAP.md / REQUIREMENTS.md und ist fixiert.

</domain>

<decisions>
## Implementation Decisions

### Querschnitt (für alle 5 Features gesetzt — nicht erneut hinterfragen)
- **D-00a:** Rein **offline & lokal** — keine KI, keine API, kein Netzwerk. NPC-Generator, Wetter und Begegnungen laufen ausschließlich über Tabellen/Würfel (KI-Inhalte sind im Projekt explizit out of scope).
- **D-00b:** **Deutsche UI** durchgängig, inklusive aller generierten Inhalte.
- **D-00c:** Jedes neue Feature folgt dem etablierten Muster: Tab-Registry-Registrierung, CRUD mit `saveUndoState()`/Undo, `esc()`/`sanitizeHTML()` für jeglichen Nutzerinhalt, 3-fach-Modulregistrierung (loader.js + build.py + ggf. tab-registry.js).
- **D-00d:** **Schlichte Listen-/Tabellendarstellung** — die visuelle Fraktions-Beziehungsmatrix (WELT-06) und die horizontale Zoom-Timeline (WELT-07) bleiben v2.

### WELT-01: Session-Prep-Assistent
- **D-01:** Eigener **„Session-Prep"-Tab** mit neuem Datencontainer `D.sessionPreps[]`; klar getrennt von den bestehenden Session-Notizen (`D.sessionNotes`).
- **D-02:** Struktur folgt einer **Lazy-DM-Vorlage** mit festen Abschnitten: Strong Start, geplante Szenen, geheime Hinweise, wichtige NPCs, mögliche Belohnungen.
- **D-03:** „Offene Fäden der letzten Session" werden **automatisch aus offenen Quests (`D.quests`) und Story-Arcs (`D.storyArcs`) vorgeschlagen**, manuell ergänzbar.
- **D-04:** Szenenkarten unterstützen **Entity-Links** zu NPCs/Orten/Encountern (über `systems/entity-links.js`); Klick öffnet die verknüpfte Entität.

### WELT-02: NPC-Generator
- **D-05:** Generierte Felder: **Name + Persönlichkeitszug + Marotte** (Pflicht laut WELT-02) **plus Volk/Spezies, Beruf/Rolle, Aussehen/Merkmal**. (Stimme/Sprechweise bewusst NICHT.)
- **D-06:** Datenquelle: **eingebaute deutsche Default-Tabellen im Code** (immer verfügbar, <1 s) **+ optional über `D.randomTables` erweiterbar/überschreibbar**.
- **D-07:** Namen werden über einen **Vor-Filter Volk + Geschlecht** gewählt (z.B. Zwerg/weiblich) → passende Namensliste; Re-Roll bleibt schnell.
- **D-08:** Übernahme via **Vorschau-Karte mit Re-Roll**, dann „Als NPC speichern" → legt `D.npcs`-Eintrag an (mit Undo). Kein Müll bei mehrfachem Würfeln.

### WELT-03: Kampagnen-Timeline & In-Game-Kalender
- **D-09:** **Harptos/Faerûn-Kalender vorkonfiguriert** (12 Monate à 30 Tage + Festtage, Jahr 1492 DR) — passt zum bestehenden `D.calendar`-Schema. (Das In-Game-Datum ist das geteilte Substrat für Timeline UND Reise.)
- **D-10:** Timeline-Ereignisse tragen je ein **In-Game-Datum** und werden **chronologisch sortiert** (`D.calendar.events`, Schema ~ `{datum, titel, beschreibung, typ}`).
- **D-11:** **Auto-Vorschläge:** abgeschlossene Reisen und gespeicherte Sessions schlagen einen Timeline-Eintrag vor (bestätigen/verwerfen) — Timeline bleibt aber auch manuell befüllbar.

### WELT-04: Reise- & Wetter-Simulator
- **D-12:** Tagesmärsche nach **5e-Standard: Reisetempo × Gelände-Faktor** (langsam 18 / normal 24 / schnell 30 Meilen pro Tag; schwieriges Gelände halbiert). Vorhandene Gelände-Modifikatoren aus `encounter-calculator.js` als Vorbild/Quelle.
- **D-13:** Wetter wird aus einer **Klima- + Jahreszeit-Tabelle** gewürfelt (Temperatur/Niederschlag/Wind; Jahreszeit aus dem In-Game-Datum abgeleitet).
- **D-14:** Zufallsbegegnungen über **Gelände-spezifische Tabellen** (eingebaute Defaults + erweiterbar via `D.randomTables`) mit **konfigurierbarer Begegnungschance pro Reiseabschnitt/Tag** (z.B. 1-in-d20).
- **D-15:** Eine abgeschlossene Reise **rückt das In-Game-Datum automatisch vor** (`D.calendar` + Reisetage); optional gleich ein Timeline-Eintrag (siehe D-11).

### WELT-05: Fraktionen & Ruf-System
- **D-16:** Eigener **„Fraktionen"-Tab** mit neuem Datencontainer `D.factions[]`; Übersichtsliste mit aktuellem Rufstand (folgt Tab-Registry-Muster).
- **D-17:** Ruf je Fraktion als **Zahlenwert (z.B. −50…+50) gemappt auf benannte Stufen** (Feindlich / Misstrauisch / Neutral / Freundlich / Verbündet).
- **D-18:** Anpassung per **+/− Buttons oder direktem Setzen, mit optionaler Notiz/Grund**, die in eine **Ruf-Historie pro Fraktion** geschrieben wird.
- **D-19:** Fraktionsfelder: Name + Ziele/Agenda + Ruf (Kern) **plus Beschreibung & Symbol/Icon, Mitglieder (NPC-Verknüpfung, z.B. `npc.factionId`), Sitz/Einflussgebiet (Orts-Verknüpfung) und textuelle Rivalen/Verbündete-Liste**. Die Rivalen/Verbündete-Liste ist bewusst **rein textuell** — KEINE visuelle Matrix (WELT-06 = v2).

### Claude's Discretion
- **Generator-Platzierung/Einstieg** (Button im NPC-Tab, eigener Mini-Bereich und/oder Command-Palette-Aktion „NPC generieren") — Planner/Researcher wählt das Naheliegendste; Command Palette existiert bereits (`Strg+Shift+K`).
- **Detail des Harptos-Kalenders** (Festtags-Namen, Wochentage, Mondphasen) — Researcher klärt die konkreten Daten aus dem SRD/Setting-Wissen.
- **Tab-Reihenfolge & Einordnung** der 4 neuen Tabs in der Navigation.
- **Konkrete Default-Tabelleninhalte** (Namenslisten je Volk, Marotten, Begegnungs- und Wettertabellen) — Researcher/Planner befüllt sie; bei großen Tabellen Build-Time-Skript statt Hand-Tippen erwägen (siehe Deferred/Hinweis).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-Scope & Anforderungen
- `.planning/ROADMAP.md` § „Phase 5: Welt & Story" — Goal + 5 Success Criteria (die messbaren Wahrheiten)
- `.planning/REQUIREMENTS.md` § „Welt & Story (WELT)" — WELT-01…05 Wortlaut; § „v2 Requirements" (WELT-06 visuelle Matrix, WELT-07 Zoom-Timeline = NICHT in dieser Phase); § „Out of Scope" (KI-generierte Inhalte ausgeschlossen)
- `.planning/PROJECT.md` § Constraints / Out of Scope — offline-first, kein Netzwerk, non-ESM, deutsche UI

### Codebase-Karten
- `.planning/codebase/STRUCTURE.md` — „Where to Add New Code" (3-fach-Modulregistrierung, Render/CRUD-Split, Tab-Registrierung, CSS-Einbindung)
- `.planning/codebase/CONVENTIONS.md` — Namens-/Code-Konventionen (sollte der Planner zusätzlich lesen)
- `.planning/codebase/CONCERNS.md` — bekannte Build-/Dedup-Fallstricke (funktions-lokale `const X = window.X`, doppelte Funktionsnamen)

### Wiederzuverwendender Quellcode (Pfade)
- `features/random-tables.js` — `rollOnTable()`, `rollOnTableAndShow()`, `renderRandomTables()`, `D.randomTables` (NPC-Generator + Reise-Begegnungen)
- `features/npcs/npc-crud.js`, `features/npcs/npc-render.js` — NPC-CRUD + `npc.relations` (Status-Level-Vorbild für Ruf-Skala)
- `features/sessions/sessions.js` — `renderSessions()`, `D.sessionNotes`, `D.storyArcs` (Session-Prep-Basis)
- `core/data.js` — `D.calendar` `{day, month, year:1492, events:[]}`, `D.quests`, `D.storyArcs` (Schema-Erweiterungen hier eintragen)
- `features/encounter-calculator.js` — bestehende Gelände-Modifikatoren (Reise-Gelände-Faktoren)
- `systems/entity-links.js` — Cross-Entity-Verknüpfung (Session-Szenen, Fraktions-Mitglieder/Sitz)
- `systems/tab-registry.js` (`TAB_RENDER_REGISTRY`) — Registrierung der 4 neuen Tabs
- `loader.js` + `build.py` (Modullisten) — müssen synchron bleiben

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Random Tables** (`features/random-tables.js`, `D.randomTables`): liefert das Würfel-/Tabellen-Rückgrat für NPC-Generator-Felder und gelände-spezifische Reisebegegnungen; `rollOnTable()` ist direkt nachnutzbar.
- **NPC-System** (`features/npcs/*`): Save-Target des Generators; `npc.relations` mit Status-Levels (Freundlich/Neutral/Feindlich) ist die direkte Vorlage für die Ruf-Stufen.
- **Kalender-Schema** (`D.calendar`): existiert bereits (Tag/Monat/Jahr 1492 + events-Array), aber **ohne Render-/UI-Funktion** — Timeline/Reise bauen die erste Kalender-Oberfläche.
- **Sessions & Story-Arcs** (`features/sessions/sessions.js`, `D.storyArcs`, Story-Arc-Modal in `assets/templates/modals-editors.html`): Grundlage für Session-Prep und Quelle für „offene Fäden".
- **Encounter-Gelände-Modifikatoren** (`features/encounter-calculator.js`): Gelände-Faktoren für die Reiseberechnung.
- **CRUD-/Render-Infrastruktur**: `utils/crud-helpers.js` (`deleteWithConfirm`, `afterCrudOperation`), `render/helpers.js` (`safeRender`, `EntityLookup`), `systems/undo.js`.
- **DM Screen** (21 Widget-Typen, `features/dmscreen/dmscreen-render.js`): optional als späteres Anzeige-Ziel (für diese Phase NICHT eingeplant — Fraktionen bekommen einen eigenen Tab, kein Widget).

### Established Patterns
- **Tab-Registry-Muster** (siehe CLAUDE.md): neue Tabs über `TAB_RENDER_REGISTRY` registrieren (`renders`/`init`/`cleanup`), defensive Container-Checks.
- **Render/CRUD-Split** je Feature-Ordner: `features/<name>/<name>-render.js` + `<name>-crud.js`.
- **Build-Dedup-Fallstricke** (CONCERNS.md / CLAUDE.md): keine funktions-lokalen `const X = window.X`, keine doppelten Top-Level-Funktionsnamen — sonst Bundle-SyntaxError.
- **Migrations-Hook** (`systems/spellslots/version-migration.js`): neue `D.*`-Container (`D.sessionPreps`, `D.factions`, Kalender-Erweiterung) brauchen Schema-Default + ggf. Migration.

### Integration Points
- `core/data.js` `initializeData()` — neue Container ergänzen: `sessionPreps: []`, `factions: []`; ggf. `D.calendar` um Kalender-Definition (Monate/Festtage) erweitern; NPC ggf. `factionId`.
- `loader.js` MODULES + `build.py` Modulliste — neue Module an korrekter Position registrieren (Listen synchron halten).
- `systems/tab-registry.js` — 4 neue Tabs.
- `assets/templates/view-*.html` — neue Views; `assets/styles/` + `assets/styles.css` + `build.py` css_files — neue/erweiterte CSS.
- `ui/actions/*.js` — `data-action`-Handler für die neuen Features.

</code_context>

<specifics>
## Specific Ideas

- **Session-Prep = „Lazy DM"-Sheet** (Strong Start, geheime Hinweise, fantastische Orte/Szenen, wichtige NPCs, Belohnungen) — bewusst an „Return of the Lazy DM" angelehnt.
- **Kalender = 1492 DR / Harptos** (Forgotten-Realms-Default), passt zum bereits gesetzten `year: 1492` im Schema.
- **Ruf-Stufen** sinngemäß: Feindlich · Misstrauisch · Neutral · Freundlich · Verbündet, hinterlegt mit einem Zahlenwert (≈ −50…+50).
- **Reise-Mechanik** entlang der bekannten 5e-Reisetempi (18/24/30 Meilen pro Tag) — bewusst regelnah.

</specifics>

<deferred>
## Deferred Ideas

- **Visuelle Fraktions-Beziehungsmatrix** → WELT-06 (v2). In dieser Phase nur eine textuelle Rivalen/Verbündete-Liste.
- **Horizontale visuelle Timeline mit Zoom/Scroll** → WELT-07 (v2). Hier nur chronologische Listendarstellung.
- **Fraktions-Ruf pro Charakter** (statt pro Gruppe) → CHAR-04 (v2). Hier nur Gruppen-Ruf.
- **Hinweis (kein Deferral, Umsetzungs-Notiz):** Große Default-Tabellen (Namen je Volk, Begegnungs-/Wettertabellen) sollten per Build-Time-Skript erzeugt statt von Hand getippt werden (Output-Limit-Erfahrung aus Phase 3, vgl. [[large-dataset-via-build-script]]).

### Reviewed Todos (not folded)
None — es lagen keine offenen Todos für diese Phase vor.

</deferred>

---

*Phase: 5-welt-story*
*Context gathered: 2026-06-14*
