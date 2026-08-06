# Phase 5: Welt & Story — Research

**Recherchiert:** 2026-06-15
**Domäne:** Weltenbau & Story-Werkzeuge (Session-Prep, NPC-Generator, Timeline/Kalender, Reise/Wetter, Fraktionen)
**Konfidenz:** HOCH (alle kritischen Signaturen aus Quellcode verifiziert; Harptos-Daten aus D&D-5e-SRD-Wissen — ASSUMED, aber kanonisch stabil)

---

<user_constraints>
## Nutzer-Constraints (aus CONTEXT.md)

### Festgelegte Entscheidungen

- **D-00a:** Rein offline & lokal — keine KI, keine API, kein Netzwerk. NPC-Generator, Wetter und Begegnungen laufen ausschließlich über Tabellen/Würfel.
- **D-00b:** Deutsche UI durchgängig, inklusive aller generierten Inhalte.
- **D-00c:** Jedes neue Feature folgt dem etablierten Muster: Tab-Registry-Registrierung, CRUD mit `saveUndoState()`/Undo, `esc()`/`sanitizeHTML()` für jeglichen Nutzerinhalt, 3-fach-Modulregistrierung.
- **D-00d:** Schlichte Listen-/Tabellendarstellung — visuelle Fraktions-Matrix (WELT-06) und horizontale Zoom-Timeline (WELT-07) bleiben v2.
- **D-01:** Eigener „Session-Prep"-Tab mit `D.sessionPreps[]`, klar getrennt von `D.sessionNotes`.
- **D-02:** Lazy-DM-Vorlage: Strong Start, geplante Szenen, geheime Hinweise, wichtige NPCs, mögliche Belohnungen.
- **D-03:** Auto-Vorschläge offener Fäden aus `D.quests` und `D.storyArcs`.
- **D-04:** Szenenkarten unterstützen Entity-Links über `systems/entity-links.js`.
- **D-05:** Generierte Felder: Name + Persönlichkeitszug + Marotte (Pflicht) plus Volk/Spezies, Beruf/Rolle, Aussehen/Merkmal. Stimme/Sprechweise NICHT.
- **D-06:** Eingebaute deutsche Default-Tabellen im Code + optional via `D.randomTables` erweiterbar.
- **D-07:** Namen via Vor-Filter Volk + Geschlecht.
- **D-08:** Vorschau-Karte mit Re-Roll → „Als NPC speichern" → `D.npcs`-Eintrag mit Undo.
- **D-09:** Harptos/Faerûn-Kalender vorkonfiguriert (12 Monate à 30 Tage + Festtage, Jahr 1492 DR).
- **D-10:** Timeline-Ereignisse tragen je ein In-Game-Datum, chronologisch sortiert (`D.calendar.events`).
- **D-11:** Auto-Vorschläge: abgeschlossene Reisen + gespeicherte Sessions; Timeline manuell befüllbar.
- **D-12:** 5e-Standard-Reisetempo × Gelände-Faktor (langsam 18 / normal 24 / schnell 30 Meilen/Tag; schwieriges Gelände halbiert).
- **D-13:** Wetter aus Klima- + Jahreszeit-Tabelle (Jahreszeit aus In-Game-Datum abgeleitet).
- **D-14:** Zufallsbegegnungen via gelände-spezifische Tabellen (Defaults + erweiterbar via `D.randomTables`), konfigurierbare Begegnungschance.
- **D-15:** Abgeschlossene Reise rückt `D.calendar` vor; optional gleich Timeline-Eintrag.
- **D-16:** Eigener „Fraktionen"-Tab mit `D.factions[]`.
- **D-17:** Ruf als Zahlenwert (−50…+50) auf benannte Stufen gemappt.
- **D-18:** Anpassung per +/− oder direktem Setzen, optionale Notiz in Ruf-Historie.
- **D-19:** Fraktionsfelder: Name + Ziele/Agenda + Ruf (Kern) plus Beschreibung & Icon, Mitglieder (NPC-Link `npc.factionId`), Sitz (Orts-Link), textuelle Rivalen/Verbündete-Liste.

### Claude's Discretion

- Generator-Platzierung (Button im NPC-Tab, Mini-Bereich oder Command-Palette-Aktion).
- Tab-Reihenfolge & Einordnung der 4 neuen Tabs.
- Konkrete Default-Tabelleninhalte (Namenslisten, Begegnungs-/Wettertabellen) — bei großen Tabellen Build-Time-Skript.

### Deferred Ideas (AUßER SCOPE)

- WELT-06: Visuelle Fraktions-Beziehungsmatrix.
- WELT-07: Horizontale visuelle Timeline mit Zoom/Scroll.
- CHAR-04: Fraktions-Ruf pro Charakter (statt pro Gruppe).
</user_constraints>

<phase_requirements>
## Phase-Anforderungen

| ID | Beschreibung | Research-Grundlage |
|----|-------------|-------------------|
| WELT-01 | Sessions mit Szenenkarten vorbereiten (Strong Start, geplante Szenen, offene Fäden) | D-01..04, `D.sessionPreps[]`, `D.storyArcs`, `systems/entity-links.js` |
| WELT-02 | NPCs per Knopfdruck generieren (dt. Name, Persönlichkeit, Marotte) | D-05..08, `rollWeightedEntry()`, eingebaute Tabellen, `saveNPC()` |
| WELT-03 | Kampagnen-Ereignisse chronologisch festhalten (Timeline, Kalender) | D-09..11, Harptos-Daten, `D.calendar.events` |
| WELT-04 | Reisen tageweise simulieren (Wetter, Zufallsbegegnungen, Reisetempo) | D-12..15, 5e-Tempo, `TERRAIN_MODIFIERS`, `rollWeightedEntry()` |
| WELT-05 | Fraktionen mit Zielen verwalten, Ruf je Fraktion verfolgen | D-16..19, `D.factions[]`, NPC-Link `npc.factionId` |
</phase_requirements>

---

## Zusammenfassung

Phase 5 fügt fünf eigenständige Spielleiter-Werkzeuge hinzu, die alle dasselbe technische Rückgrat teilen: das bestehende Non-ESM-Muster (3-fach-Registrierung, Render/CRUD-Split, `pushUndo` + `esc()`). Das **geteilte Substrat** aller Features ist das In-Game-Datum (`D.calendar`), das bisher nur als Datenschema ohne UI existiert. Timeline und Reise bauen dessen erste Oberfläche — der Planner muss das Kalender-Fundament als früheste Wave einplanen.

Der größte Implementierungsaufwand liegt in den **deutschen Default-Tabellen** für den NPC-Generator und Reise-/Begegnungs-/Wettertabellen. Diese sind inhaltlich groß (≥ 200 Einträge bei Namenslisten), dürfen aber wegen des 32k-Output-Limits eines Implementierungs-Agenten NICHT in einem Schritt hand-getippt werden. Der Planner muss ein Build-Time-Generierungsskript einplanen (Lektion aus Phase 3: SRD-Statblocks via `build_generate_npc_tables.py`).

**Primär-Empfehlung:** Wave 0 = Schema + Migration + Modul-Skelette (alle 4 neuen Tabs) + Kalender-Definition (HARPTOS_CALENDAR). Wave 1 = Tabellen-Generator-Skript + eingebaute Tabellen. Wave 2 = Features WELT-01 + WELT-02. Wave 3 = WELT-03 + WELT-04. Wave 4 = WELT-05.

---

## Architektonische Verantwortlichkeitskarte

| Fähigkeit | Primäre Schicht | Sekundäre Schicht | Begründung |
|-----------|----------------|-------------------|------------|
| Session-Prep CRUD + Lazy-DM-Vorlage | `features/session-prep/` | `ui/actions/entity-actions.js` | Eigener Domain-Ordner wie npcs/, quests/ |
| NPC-Generator-Logik + Tabellen | `features/npc-generator/npc-generator.js` (oder im npcs/-Ordner) | `features/random-tables.js` (wiederverwendet) | Reine Tabellen-/Würfellogik, kein eigener Tab |
| Timeline-Render + CRUD | `features/timeline/timeline-render.js` + `timeline-crud.js` | `core/data.js` (Kalender-Schema) | Eigene Feature-Domäne, Tab „kalender" |
| Kalender-Definition (Harptos) | `core/data.js` `initializeData()` | `systems/spellslots/version-migration.js` | Geteiltes Substrat für Timeline + Reise |
| Reise-Simulator | `features/reise/reise-render.js` + `reise-crud.js` | `features/encounter-calculator.js` (TERRAIN_MODIFIERS) | Eigene Domäne, Tab „reise" |
| Wetter-/Begegnungs-Tabellen | `features/reise/reise-tabellen.js` | `features/random-tables.js` (`rollWeightedEntry`) | Inline-Daten für Offline-Betrieb |
| Fraktionen + Ruf | `features/fraktionen/fraktionen-render.js` + `fraktionen-crud.js` | `features/npcs/` (NPC-Verknüpfung) | Eigene Domäne, Tab „fraktionen" |

---

## Standard-Stack (Wiederverwendung aus Codebase)

### Kern (kein neues npm-Paket nötig)

| Modul | Signatur/Zweck | Wiederverwendung in Phase 5 |
|-------|---------------|----------------------------|
| `features/random-tables.js` | `rollWeightedEntry(table)` → `{entry, roll, diceType}` | NPC-Generator + Reise-Begegnungen + Wetter |
| `features/random-tables.js` | `rollOnTable(id)` — zeigt Ergebnis via Toast | Optionaler Schnell-Aufruf |
| `systems/entity-links.js` | `parseEntityLinks(content)` — `[[type:id:name]]` → klickbare Spans | Session-Szenen, Fraktions-Mitglieder |
| `systems/entity-links.js` | `showInsertEntityLinkModal(editorId)` — Modal für Link-Einfügung | Session-Szenen Editor |
| `features/npcs/npc-crud.js` | `saveNPC()` — vollständiger NPC-CRUD inkl. Validation | NPC-Generator-Übernahme |
| `features/encounter-calculator.js` | `TERRAIN_MODIFIERS` — Array von `{id, label, multiplier}` | Reise-Gelände-Faktoren |
| `systems/tab-registry.js` | `TAB_RENDER_REGISTRY[tabName] = {renders:[...], init, cleanup}` | 4 neue Tab-Registrierungen |
| `utils/crud-helpers.js` | `deleteWithConfirm({entityType, id, onSuccess, undoLabel})` | CRUD für sessionPreps, factions |
| `utils/crud-helpers.js` | `afterCrudOperation(renderFn, message, toastType)` | Standard Post-CRUD-Fluss |
| `systems/undo.js` | `pushUndo(label)` — Snapshot vor jeder Mutation | Pflicht vor jeder Datenmutation |
| `render/helpers.js` | `safeRender(fn, fnName, containerId, options)` | Render-Fehlerschutz |
| `render/helpers.js` | `EntityLookup.npc(id)`, `.location(id)` | Fraktions-Mitglieder/-Ort auflösen |

### Keine neuen externen Pakete

Alle benötigten Werkzeuge sind bereits im Bundle. Package Legitimacy Audit entfällt.

---

## Harptos/Faerûn-Kalender — Konkrete Daten

[ASSUMED — aus D&D-5e-Forgotten-Realms-Quellen, kanonisch stabil; kein Tool-Zugriff auf offizielle Docs in dieser Session]

### Monate (12 × 30 Tage = 360 Tage)

| Nr | Name (Harptos) | Entspricht | Jahreszeit (Faerûn Nord) |
|----|---------------|-----------|--------------------------|
| 1 | Hammer | Jan | Winter |
| 2 | Alturiak | Feb | Winter |
| 3 | Ches | März | Frühling |
| 4 | Tarsakh | April | Frühling |
| 5 | Mirtul | Mai | Frühling |
| 6 | Kythorn | Juni | Sommer |
| 7 | Flamerule | Juli | Sommer |
| 8 | Eleasis | Aug | Sommer |
| 9 | Eleint | Sept | Herbst |
| 10 | Marpenoth | Okt | Herbst |
| 11 | Uktar | Nov | Herbst |
| 12 | Nightal | Dez | Winter |

### Intercalary-/Festtage (5 reguläre + 1 alle 4 Jahre)

| Name | Position (nach Monat) | Beschreibung |
|------|----------------------|-------------|
| Midwinter | nach Monat 1 (Hammer 30) | Midwinterfest, Wintersonnenzeit |
| Greengrass | nach Monat 4 (Tarsakh 30) | Frühlingsbeginn, Fest der Erneuerung |
| Midsummer | nach Monat 7 (Flamerule 30) | Mittsommerfest |
| Highharvestide | nach Monat 9 (Eleint 30) | Ernte-/Herbstfest |
| Feast of the Moon | nach Monat 11 (Uktar 30) | Totenfest, Ende des Herbsts |
| Shieldmeet | alle 4 Jahre nach Midsummer | Ratsversammlung, Schaltjahr-Festtag |

**Jahres-Gesamtlänge:** 365 Tage (normal) / 366 Tage (Schaltjahr mit Shieldmeet; 1492 DR ist kein Schaltjahr — 1488, 1492+4=1496 wären die nächsten)

### Zehntagewoche (Tenday / Ride)

Harptos nutzt keine 7-Tage-Woche. Ein Monat = 3 Zehntagetakte (Tendays). Für einfache UI: Wochentag-Anzeige optional, Tenday-Nummer sinnvoller.

### Jahreszeiten-Mapping (für Wettertabellen)

```javascript
// [ASSUMED — kanonisch]
const HARPTOS_SEASONS = {
    1: 'winter',  // Hammer
    2: 'winter',  // Alturiak
    3: 'fruehling',
    4: 'fruehling',
    5: 'fruehling',
    6: 'sommer',
    7: 'sommer',
    8: 'sommer',
    9: 'herbst',
    10: 'herbst',
    11: 'herbst',
    12: 'winter',
    // Festtage: erben die Jahreszeit des Vormonats
};
```

### Empfohlene D.calendar-Erweiterung

Das bestehende Schema `{day:1, month:0, year:1492, events:[]}` wird in `core/data.js` um die Kalender-Definition erweitert:

```javascript
// In initializeData() — core/data.js
calendar: {
    day: 1,
    month: 1,          // 1-basiert (Hammer=1) statt 0-basiert!
    year: 1492,
    events: []
    // Definition wird NICHT in D gespeichert — sie ist konstant in core/constants.js
}
```

**Achtung:** Aktuell ist `month: 0` in `initializeData()` und die Migration 2.4.0 setzt `month: 4` (Mirtul). Der Code nutzt 0-basierte Indizes. Für neue Features empfiehlt sich ENTWEDER Beibehaltung des 0-basierten Schemas (month 0 = Hammer) ODER ein sauberer Übergang auf 1-basiert mit Migration. **Empfehlung:** 1-basiert in neuen Features (Monate 1–12), Migration `4.0.0` ändert `D.calendar.month` von 0-Basis auf 1-Basis (`month + 1` falls `month < 12`).

Die Harptos-Konstante gehört nach `core/constants.js`:

```javascript
// core/constants.js — Ergänzung zu DND_RULES
const HARPTOS_MONTHS = [
    { nr: 1, name: 'Hammer',     jahreszeit: 'winter' },
    { nr: 2, name: 'Alturiak',   jahreszeit: 'winter' },
    { nr: 3, name: 'Ches',       jahreszeit: 'fruehling' },
    { nr: 4, name: 'Tarsakh',    jahreszeit: 'fruehling' },
    { nr: 5, name: 'Mirtul',     jahreszeit: 'fruehling' },
    { nr: 6, name: 'Kythorn',    jahreszeit: 'sommer' },
    { nr: 7, name: 'Flamerule',  jahreszeit: 'sommer' },
    { nr: 8, name: 'Eleasis',    jahreszeit: 'sommer' },
    { nr: 9, name: 'Eleint',     jahreszeit: 'herbst' },
    { nr: 10, name: 'Marpenoth', jahreszeit: 'herbst' },
    { nr: 11, name: 'Uktar',     jahreszeit: 'herbst' },
    { nr: 12, name: 'Nightal',   jahreszeit: 'winter' }
];
const HARPTOS_FESTIVALS = [
    { name: 'Midwinter',        nachMonat: 1 },
    { name: 'Greengrass',       nachMonat: 4 },
    { name: 'Midsummer',        nachMonat: 7 },
    { name: 'Highharvestide',   nachMonat: 9 },
    { name: 'Feast of the Moon', nachMonat: 11 }
];
// Diese werden Teil von DND_RULES.HARPTOS_MONTHS / DND_RULES.HARPTOS_FESTIVALS
```

---

## 5e-Reise- und Wetter-Mechaniken

### Reisetempo (5e PHB S. 182) [ASSUMED — regelnah, kanonisch stabil]

| Tempo | Meilen/Tag | Meilen/Stunde | Effekt |
|-------|-----------|--------------|--------|
| Langsam | 18 | 2 | Stealth möglich; kein Nachteil Wahrnehmung |
| Normal | 24 | 3 | — |
| Schnell | 30 | 4 | −5 Wahrnehmung (passiv) |

**Schwieriges Gelände:** Halbiert die Distanz (× 0,5).

### Terrain-Faktoren aus `encounter-calculator.js` (VERIFIZIERT)

```javascript
// Bereits in features/encounter-calculator.js:78-107
const TERRAIN_MODIFIERS = [
    { id: 'normal',    label: 'Normal',             multiplier: 1.0 },
    { id: 'difficult', label: 'Schwieriges Gelände', multiplier: 1.25 },
    { id: 'hazardous', label: 'Gefährlich',          multiplier: 1.5 },
    { id: 'extreme',   label: 'Extrem',              multiplier: 2.0 }
];
```

Für **Reise-Distanz** gilt: `schwieriges Gelände` → ×0,5 der Basisdistanz. Die `multiplier`-Werte aus `TERRAIN_MODIFIERS` beziehen sich auf XP-Schwierigkeit, nicht auf Distanz. Der Reise-Code braucht eine eigene Mapping-Konstante:

```javascript
// features/reise/reise-tabellen.js
const REISE_GELÄNDE = [
    { id: 'normal',    label: 'Normal',             distanzFaktor: 1.0 },
    { id: 'schwierig', label: 'Schwieriges Gelände', distanzFaktor: 0.5 },
    { id: 'gebirge',   label: 'Gebirge',             distanzFaktor: 0.5 },
    { id: 'sumpf',     label: 'Sumpf',               distanzFaktor: 0.5 },
    { id: 'meer',      label: 'Schiff',              distanzFaktor: 1.0 }  // eigene Logik
];
```

### Begegnungschance-Konvention [ASSUMED — community-standard]

5e gibt keine feste Formel vor; gängigste Praxis am Tisch:

- **1 × pro Tag (normal):** 1 auf 1W20 (5 %).
- **2 × pro Tag (gefährlich):** 2 Würfe à 1W20, je 1 = Begegnung (≈9,75 %).
- **Konfigurierbar:** SL wählt W (d6/d8/d12/d20) + Schwellenwert; Begegnung wenn Wurf ≤ Schwellenwert.

Empfehlung: Im Reise-Modal `encounterDiceType` (d6/d12/d20) + `encounterThreshold` (1–3) als einstellbare Felder.

### Wetter-Tabellen-Schema

Klima × Jahreszeit → gewürfeltes Wetter. Drei Dimensionen:

```javascript
// Struktur in features/reise/reise-tabellen.js
// Format kompatibel mit rollWeightedEntry(table):
const WETTER_TABELLEN = {
    gemässigt: {
        winter:    { id: 'wetter_gem_winter',  diceType: 8, entries: [...] },
        fruehling: { id: 'wetter_gem_frueh',   diceType: 8, entries: [...] },
        sommer:    { id: 'wetter_gem_sommer',  diceType: 8, entries: [...] },
        herbst:    { id: 'wetter_gem_herbst',  diceType: 8, entries: [...] }
    },
    arktisch:   { ... },
    tropisch:   { ... },
    wüste:      { ... }
};
```

Standardklima: „gemässigt" (Sword Coast / Faerûn-Zentrum). Eintrag-Format: `{range: '1-2', text: 'Sonnig und warm (20°C)'}`.

---

## Strategie für Deutsche Default-Tabellen (Build-Time-Skript)

### Warum Build-Time

Die NPC-Namenstabellen für 7+ Völker × 2 Geschlechter umfassen ≥400 Einträge. Hinzu kommen Persönlichkeitszüge (~30), Marotten (~30), Berufe (~40), Aussehensmerkmale (~30), 6 Geländebegegnungstabellen (~60 Einträge je) und 4×4 Wettertabellen (~8 Einträge je) — insgesamt ca. 800–1000 Einträge. Das überschreitet das 32k-Output-Limit eines Implementierungs-Agenten. Gemäß Lektion aus Phase 3 (SRD-Statblocks) MUSS ein Python-Skript die Daten generieren.

### Skript-Ansatz

**Datei:** `tools/generate_npc_tables.py`

```python
# generate_npc_tables.py
# Erzeugt features/npc-generator/npc-default-tables.js
# mit allen eingebauten deutschen Default-Tabellen für den NPC-Generator.
# Aufruf: python tools/generate_npc_tables.py
# Output wird in den Build eingebunden (loader.js + build.py).
```

Das Skript enthält die Rohdaten als Python-Dictionarys und schreibt eine JS-Datei, die eine Konstante `NPC_DEFAULT_TABLES` exportiert:

```javascript
// features/npc-generator/npc-default-tables.js  (GENERIERT)
// [SECTION:NPC_DEFAULT_TABLES]
// ACHTUNG: Diese Datei wird von tools/generate_npc_tables.py generiert.
// Nicht manuell bearbeiten!
const NPC_DEFAULT_TABLES = {
    namen: {
        mensch:   { maennlich: [...], weiblich: [...], neutral: [...] },
        elf:      { maennlich: [...], weiblich: [...] },
        zwerg:    { maennlich: [...], weiblich: [...] },
        halbling: { maennlich: [...], weiblich: [...] },
        halbork:  { maennlich: [...], weiblich: [...] },
        tiefling: { maennlich: [...], weiblich: [...] },
        gnom:     { maennlich: [...], weiblich: [...] }
    },
    persoenlichkeitszuege: ['Redet zu viel', 'Misstrauisch gegenüber Fremden', ...],
    marotten: ['Wiederholt das letzte Wort des Gesprächspartners', ...],
    berufe: ['Schmied', 'Händler', 'Söldner', 'Priester', ...],
    aussehen: ['Narbe über dem linken Auge', 'Ungewöhnlich groß', ...]
};
window.NPC_DEFAULT_TABLES = NPC_DEFAULT_TABLES;
```

**Analog:** `tools/generate_reise_tables.py` für Begegnungs- und Wettertabellen → `features/reise/reise-default-tables.js`.

### Repräsentative Tabelleninhalte (Minimum für Wave 1)

Der Implementierungs-Agent des Skripts befüllt mindestens:

| Tabelle | Mindest-Einträge | Format |
|---------|-----------------|--------|
| Menschliche Vornamen (m/w) | 20 je | Strings |
| Elfen-Vornamen (m/w) | 15 je | Strings |
| Zwerg-Vornamen (m/w) | 15 je | Strings |
| Halbling-Vornamen | 12 je | Strings |
| Halbork-Vornamen | 10 je | Strings |
| Tiefling-Vornamen | 10 je | Strings |
| Gnom-Vornamen | 10 je | Strings |
| Persönlichkeitszüge | 20 | Strings |
| Marotten | 20 | Strings |
| Berufe | 30 | Strings |
| Aussehen/Merkmal | 20 | Strings |
| Wald-Begegnung 1W8 | 8 range-Einträge | `{range, text}` |
| Gebirgs-Begegnung 1W8 | 8 | `{range, text}` |
| Küsten-Begegnung 1W8 | 8 | `{range, text}` |
| Stadt-/Straßen-Begegnung 1W8 | 8 | `{range, text}` |
| Ruinen-Begegnung 1W8 | 8 | `{range, text}` |
| Sumpf-Begegnung 1W8 | 8 | `{range, text}` |
| Wetter gemäßigt × 4 Jahreszeiten | 8 je | `{range, text}` |

---

## Schema-Erweiterungen

### `core/data.js` — `initializeData()` Ergänzungen

```javascript
// Ergänzung in initializeData() — NACH bestiary/bestiaryFavorites
// Phase 5: Welt & Story
sessionPreps: [],      // WELT-01 Session-Prep-Assistent
factions: []           // WELT-05 Fraktionen & Ruf
// D.calendar bleibt unverändert — Erweiterung nur in core/constants.js (HARPTOS_MONTHS)
// D.calendar.events wird bereits in der 2.4.0-Migration angelegt
```

### `D.sessionPreps[]` — Schema

```javascript
{
    id: number,                // nextId('sessionPreps')
    sessionNr: number,         // Sitzungsnummer (manuell oder auto aus sessionNotes)
    datum: string,             // Real-Datum (ISO 8601) — NICHT In-Game-Datum
    inGameDatum: string,       // Freitext z.B. "15 Hammer 1492 DR"
    strongStart: string,       // Rich-Text (sanitizeHTML)
    szenen: [                  // Szenenkarten
        {
            id: number,
            titel: string,
            beschreibung: string,  // Rich-Text mit Entity-Links
            ort: string
        }
    ],
    geheimeHinweise: string,   // Rich-Text
    wichtigeNpcs: string,      // Rich-Text mit NPC-Entity-Links
    belohnungen: string,       // Freitext
    offeneFaeden: [            // Auto-vorgeschlagen aus D.quests + D.storyArcs, manuell ergänzbar
        { text: string, quelleId: number | null, quelleTyp: 'quest' | 'storyArc' | 'manual' }
    ],
    links: [],                 // Entity-Links (Standard-Schema wie andere Entitäten)
    erstellt: number           // Date.now()
}
```

### `D.factions[]` — Schema

```javascript
{
    id: number,
    name: string,
    symbol: string,             // 1-2 Zeichen Emoji (wie in random-tables: maxlength="2")
    agenda: string,             // Rich-Text
    beschreibung: string,       // Rich-Text
    ruf: number,               // −50…+50
    rufHistorie: [
        { delta: number, grund: string, zeitstempel: number }
    ],
    mitgliederNpcIds: number[], // IDs aus D.npcs (factionId rückwärts)
    sitzOrtId: number | null,   // ID aus D.locations
    rivalen: string,           // Freitext (textuell, kein Link)
    verbuendete: string,       // Freitext (textuell, kein Link)
    links: []
}
```

### `D.calendar.events[]` — Schema (bereits in D-10 festgelegt)

```javascript
// Schema ~ {datum, titel, beschreibung, typ}
{
    id: number,
    datum: {                   // In-Game-Datum
        tag: number,           // 1–30
        monat: number,         // 1–12 (Hammer=1)
        jahr: number           // z.B. 1492
    },
    titel: string,
    beschreibung: string,
    typ: 'manuell' | 'reise' | 'session',  // Auto-Vorschlag-Quelle
    quelleId: number | null    // sessionPrep.id oder journey.id
}
```

### `npc.factionId` (optionales neues Feld)

Beim Speichern eines NPC kann optional `factionId: number | null` gesetzt werden. Rückwärts-kompatibel (fehlendes Feld = null). Wird in `features/npcs/npc-crud.js` `saveNPC()` gelesen und gespeichert (neues optionales Input-Feld im NPC-Modal).

### `systems/spellslots/version-migration.js` — neue Migration

```javascript
// Migration 4.0.0 — Phase 5
'4.0.0': data => {
    // Session-Prep-Container
    if (!data.sessionPreps) data.sessionPreps = [];
    // Fraktionen-Container
    if (!data.factions) data.factions = [];
    // Kalender-Monat: 0-basiert → 1-basiert (falls nötig)
    if (data.calendar && data.calendar.month < 1) {
        data.calendar.month = (data.calendar.month || 0) + 1;
    }
    return data;
}
```

---

## Konkrete Wiederverwendungs-Signaturen

### `rollWeightedEntry(table)` (features/random-tables.js, verifiziert)

```javascript
// Eingang: table = { entries: [{range:'1-3', text:'...'}, ...], diceType: 8 }
// Ausgang: { entry: {text:'...'}, roll: number, diceType: number } | null
const result = rollWeightedEntry(npcNameTable);
if (result) {
    const name = result.entry.text;
}
```

Der NPC-Generator ruft `rollWeightedEntry` DIREKT auf (nicht `rollOnTable`, das eine DOM-ID braucht). NPC_DEFAULT_TABLES-Einträge werden als synthetische `table`-Objekte übergeben:

```javascript
function generiereNPCName(volk, geschlecht) {
    const nameArray = NPC_DEFAULT_TABLES.namen[volk]?.[geschlecht] || [];
    // Einfacher Array-Zufall reicht — rollWeightedEntry ist für Gewichtungen
    return nameArray[Math.floor(Math.random() * nameArray.length)] || 'Unbekannt';
}
function generiereNPCZug() {
    const arr = NPC_DEFAULT_TABLES.persoenlichkeitszuege;
    return arr[Math.floor(Math.random() * arr.length)] || '';
}
```

### `TERRAIN_MODIFIERS` (features/encounter-calculator.js, verifiziert)

```javascript
// Bereits global verfügbar (keine window.X-Import nötig)
// Verwendung im Reise-Simulator:
const gelände = TERRAIN_MODIFIERS.find(m => m.id === selectedTerrainId);
// Für Reisedistanz: eigenen distanzFaktor verwenden (s.o.), NICHT multiplier
```

**Achtung Dedup-Falle:** `TERRAIN_MODIFIERS` ist mit `const` deklariert → kein `var TERRAIN_MODIFIERS = window.TERRAIN_MODIFIERS` verwenden — direkter Zugriff genügt.

### `parseEntityLinks(content)` + `showInsertEntityLinkModal(editorId)` (systems/entity-links.js, verifiziert)

```javascript
// In Szenen-Render: parseEntityLinks wandelt [[npcs:42:Elara]] in klickbare Spans
szene.innerHTML = parseEntityLinks(esc(szene.beschreibung));
// Im Szenen-Editor: Link-Einfügen-Button
<button data-action="insert-entity-link" data-value="szene-beschreibung-${idx}">🔗 Link</button>
// Im Handler:
showInsertEntityLinkModal('szene-beschreibung-' + idx);
```

### TAB_RENDER_REGISTRY-Einträge (systems/tab-registry.js, verifiziert)

Vier neue Einträge am Ende des bestehenden Objekts (VOR der schließenden `};`):

```javascript
// In systems/tab-registry.js — TAB_RENDER_REGISTRY ergänzen:
'sessionprep': {
    renders: ['renderSessionPrepList'],
    init: null,
    cleanup: null
},
'kalender': {
    renders: ['renderTimeline', 'renderKalender'],
    init: null,
    cleanup: null
},
'reise': {
    renders: ['renderReise'],
    init: null,
    cleanup: null
},
'fraktionen': {
    renders: ['renderFraktionen'],
    init: null,
    cleanup: null
}
```

Tab-Namen müssen mit `data-view`-Attributen in den HTML-Templates übereinstimmen.

---

## Build/Dedup-Fallstricke (Phase 5 spezifisch)

### 4 neue Module gleichzeitig — Checkliste

1. **Loader.js UND build.py synchron halten.** Beide Listen müssen identisch sein (build.py prüft mit `check_module_list_sync()`). Neue Module nach `features/sessions/sessions.js` einfügen, vor `features/wiki/wiki.js` (ungefähr — Abhängigkeits-Reihenfolge beachten). Empfohlene Reihenfolge:

```
# Session-Prep (kein neues Dep)
'features/session-prep/session-prep-render.js',
'features/session-prep/session-prep-crud.js',
# NPC-Generator (braucht npc-crud.js → danach)
'features/npc-generator/npc-default-tables.js',  # generierte Datei zuerst
'features/npc-generator/npc-generator.js',
# Timeline/Kalender
'features/timeline/timeline-render.js',
'features/timeline/timeline-crud.js',
# Reise
'features/reise/reise-default-tables.js',  # generierte Datei zuerst
'features/reise/reise-render.js',
'features/reise/reise-crud.js',
# Fraktionen
'features/fraktionen/fraktionen-render.js',
'features/fraktionen/fraktionen-crud.js',
```

2. **Keine doppelten Top-Level-Funktionsnamen.** `build.py:check_duplicate_functions()` bricht ab wenn Duplikate gefunden werden. Besonders gefährlich:
   - `renderTimeline` — sicherstellen dass kein anderes Modul diese Funktion hat.
   - `renderKalender` — gleich.
   - `rollOnTable` und `rollWeightedEntry` existieren bereits in `random-tables.js` — NIEMALS in neuen Modulen redefinieren; stattdessen direkt aufrufen.
   - `saveNPC` existiert in `npc-crud.js` — der NPC-Generator ruft `window.saveNPC()` auf, definiert sie NICHT neu.

3. **Kein `const X = window.X` INNERHALB von Funktionen.** Sicheres Muster:

```javascript
// RICHTIG — module-level var für window-attached globals:
var D = window.D;
// RICHTIG — direkt aufrufen für const-Globals:
pushUndo('NPC generiert');  // pushUndo ist global (const in undo.js)
// RICHTIG — window. für Cross-Module-Funktionen die nach dem Laden verfügbar sind:
window.saveNPC({ name, ... });
// FALSCH — löst SyntaxError im Build aus:
function generiereNPC() {
    const saveNPC = window.saveNPC;  // ❌
}
```

4. **CSS-Registrierung in BEIDEN Stellen:**
   - `assets/styles.css`: `@import 'styles/welt.css';`
   - `build.py:css_files`: `'welt.css'` nach `'bestiary.css'`

5. **HTML-Templates:** Neue Views in ein bestehendes Template (z.B. `view-tools.html` oder neues `view-welt.html`). Das neue Template muss in `loader.js:TEMPLATES[]` UND `build.py:html_templates[]` eingetragen werden.

---

## Risiken & Sequenzierung

### Kritischer Pfad

```
Wave 0: Schema + Migration 4.0.0 + Modul-Skelette + Tab-Registrierung
           + HARPTOS_MONTHS/FESTIVALS in core/constants.js
           + D.calendar month-Basiskorrektur (0→1)
   ↓
Wave 1: Tabellen-Generator-Skripte ausführen + npc-default-tables.js +
           reise-default-tables.js (generierte Dateien; im Build registrieren)
   ↓
Wave 2: WELT-01 Session-Prep (Tab + CRUD + Lazy-DM-Vorlage + Entity-Links)
   ↓
Wave 3: WELT-02 NPC-Generator (Vorschau-Karte, Vor-Filter, Speichern-Fluss)
   ↓
Wave 4: WELT-03 Timeline + Kalender-Render
   ↓
Wave 5: WELT-04 Reise-Simulator
   ↓
Wave 6: WELT-05 Fraktionen
```

### Risiken

| Risiko | Wahrscheinlichkeit | Schwere | Mitigation |
|--------|--------------------|---------|-----------|
| `D.calendar.month` 0-vs-1-Basis-Konflikt | HOCH | Mittel | Migration 4.0.0 konvertiert; alle neuen Features nutzen 1-basiert; Bestandscode (version-migration 2.4.0 setzt `month: 4`) explizit prüfen |
| Doppelter Funktionsname über 4 neue Module | MITTEL | Hoch (bricht Build) | Pre-build grep; jeder Entwickler-Agent muss Namen vorab checken |
| NPC-Generator-Tabellen zu groß für einen Implementierungs-Agenten | HOCH | Mittel | Build-Time-Skript (Python) in Wave 1 — kein Hand-Tippen |
| Tab-Name-Kollision mit bestehendem TAB_RENDER_REGISTRY | NIEDRIG | Hoch | Bestehende Keys: dashboard, party, npcs, locations, quests, encounter, initiative, loot, shops, spells, notes, wiki, links, dice, timers, data, dmscreen, bestiary — neue Keys: sessionprep, kalender, reise, fraktionen (kein Konflikt) |
| Loader-Order-Problem: npc-generator lädt vor npc-crud.js | MITTEL | Hoch | `npc-default-tables.js` + `npc-generator.js` NACH `features/npcs/npc-crud.js` in Modulliste |
| `parseEntityLinks` nicht korrekt verkettet mit `esc()` | MITTEL | XSS-Risiko | `parseEntityLinks(sanitizeHTML(szene.beschreibung))` — erst sanitize, dann entity-links parsen |

### Querabhängigkeiten zwischen den 5 Features

- **Timeline ↔ Reise:** Beide schreiben in `D.calendar.events`; gemeinsames Schema + Hilfsfunktion `addCalendarEvent(datum, titel, typ, quelleId)`.
- **Reise → Kalender:** Reise-Abschluss ruft `advanceCalendarDate(tage)` auf — muss vor Reise-Render implementiert sein.
- **NPC-Generator → NPC-CRUD:** Generator ruft `window.saveNPC()` auf — funktioniert nur wenn `npc-crud.js` bereits geladen ist (Ladereihenfolge sicherstellen).
- **Fraktionen → NPCs:** `npc.factionId` erfordert kleines Zusatz-Feld im NPC-Modal + `saveNPC()`-Erweiterung — kann separat in Wave 6 ergänzt werden (ist nicht kritisch für Fraktionen-Basisfeature).
- **Session-Prep → Quests/Story-Arcs:** Nur Lesezugriff auf `D.quests` und `D.storyArcs`; keine Schreibabhängigkeit.

---

## Architektur-Diagramm (Datenfluss)

```
Nutzer-Aktion
    │
    ├── [NPC generieren] ──→ NPC_DEFAULT_TABLES (inline) + rollWeightedEntry()
    │                              │
    │                        Vorschau-Karte
    │                              │ [Als NPC speichern]
    │                         pushUndo() → D.npcs.push() → save()
    │
    ├── [Session-Prep] ──→ D.sessionPreps[]
    │       │                     │ offeneFäden
    │       │               D.quests + D.storyArcs (read-only)
    │       │                     │ Szenenkarten
    │       └────────────→ parseEntityLinks(sanitizeHTML(text))
    │
    ├── [Timeline-Eintrag] ──→ D.calendar.events[]
    │       │                        ↑
    │       └── [Auto-Vorschlag] ← D.sessionPreps + D.reisen (completed)
    │
    ├── [Reise starten] ──→ D.reisen[] (laufende Reise)
    │       │
    │       ├── Tempo × REISE_GELÄNDE.distanzFaktor → Meilen/Tag
    │       ├── Wetter: season(D.calendar.month) → WETTER_TABELLEN[klima][season]
    │       │               → rollWeightedEntry(wetterTabelle)
    │       ├── Begegnung: Math.random() × encounterDiceType ≤ encounterThreshold
    │       │               → rollWeightedEntry(gelaendeTabelle)
    │       └── [Reise abschließen] → advanceCalendarDate(tage) → D.calendar.day/month/year
    │                                → optional: addCalendarEvent(...)
    │
    └── [Fraktion] ──→ D.factions[]
            │               │ Ruf +/−
            └──────→ faction.rufHistorie.push({delta, grund, zeitstempel})
                          → pushUndo() → save()
```

---

## Empfohlene Dateistruktur (neue Module)

```
features/
├── session-prep/
│   ├── session-prep-render.js   # renderSessionPrepList(), renderSessionPrepDetail()
│   └── session-prep-crud.js     # saveSessionPrep(), deleteSessionPrep(), etc.
├── npc-generator/
│   ├── npc-default-tables.js    # NPC_DEFAULT_TABLES (GENERIERT von tools/generate_npc_tables.py)
│   └── npc-generator.js         # generiereNPC(), showNPCGeneratorModal(), saveGeneratedNPC()
├── timeline/
│   ├── timeline-render.js       # renderTimeline(), renderKalender()
│   └── timeline-crud.js         # saveTimelineEvent(), deleteTimelineEvent(), advanceCalendarDate()
├── reise/
│   ├── reise-default-tables.js  # REISE_BEGEGNUNGS_TABELLEN, WETTER_TABELLEN (GENERIERT)
│   ├── reise-render.js          # renderReise(), renderReiseErgebnis()
│   └── reise-crud.js            # startReise(), abschliessenReise(), rollWetter(), rollBegegnung()
└── fraktionen/
    ├── fraktionen-render.js     # renderFraktionen(), renderFraktionDetail()
    └── fraktionen-crud.js       # saveFraktion(), deleteFraktion(), anpassenRuf()

assets/styles/
└── welt.css                     # Alle CSS-Klassen für Phase-5-Features

tools/
├── generate_npc_tables.py       # NEU — erzeugt npc-default-tables.js
└── generate_reise_tables.py     # NEU — erzeugt reise-default-tables.js
```

---

## Ruf-System: Stufen-Mapping (WELT-05)

Direkte Vorlage: `RELATION_STATUS` aus `features/npcs/npc-render.js` (verifiziert):

```javascript
// npc-render.js (bestehend):
const RELATION_STATUS = {
    friendly: { label: 'Freundlich', icon: '🟢', color: 'var(--green)' },
    neutral:  { label: 'Neutral',    icon: '⚪', color: 'var(--text)' },
    hostile:  { label: 'Feindlich',  icon: '🔴', color: 'var(--red)' }
};
```

Für Fraktionen: Erweiterung auf 5 Stufen:

```javascript
// features/fraktionen/fraktionen-render.js
const FRAKTIONS_RUF_STUFEN = [
    { min: -50, max: -21, label: 'Feindlich',     icon: '🔴', farbe: 'var(--red)' },
    { min: -20, max: -1,  label: 'Misstrauisch',  icon: '🟠', farbe: 'var(--yellow)' },
    { min:   0, max:  0,  label: 'Neutral',        icon: '⚪', farbe: 'var(--text)' },
    { min:   1, max:  20, label: 'Freundlich',     icon: '🟡', farbe: 'var(--gold)' },
    { min:  21, max:  50, label: 'Verbündet',      icon: '🟢', farbe: 'var(--green)' }
];
function rufStufe(rufwert) {
    return FRAKTIONS_RUF_STUFEN.find(s => rufwert >= s.min && rufwert <= s.max)
        || FRAKTIONS_RUF_STUFEN[2]; // Fallback: Neutral
}
```

---

## Validierungs-Architektur

> Jede Anforderung ist auf eine beobachtbare Verifikation gemappt.

### WELT-01: Session-Prep-Assistent

| Verhalten | Testtyp | Kommando / Vorgehensweise |
|-----------|---------|--------------------------|
| Tab „Session-Prep" erscheint nach Tab-Klick | E2E (Playwright) | `await page.click('[data-view="sessionprep"]')` → Container sichtbar |
| Neue Prep öffnet Lazy-DM-Modal mit allen 5 Abschnitten | E2E | Felder `#prep-strong-start`, `#prep-szenen`, `#prep-hinweise`, `#prep-npcs`, `#prep-belohnungen` vorhanden |
| Offene Quests erscheinen als vorgeschlagene offene Fäden | E2E / Unit | `D.quests` mit offener Quest → Vorschlags-Badge in Fäden-Liste |
| Entity-Link in Szene ist klickbar | E2E | `[[npcs:1:Elara]]` → gerendert als `.entity-link[data-type="npcs"]` |
| Undo nach Speichern löscht Eintrag aus `D.sessionPreps` | E2E | `Strg+Z` → `D.sessionPreps.length === 0` |

### WELT-02: NPC-Generator

| Verhalten | Testtyp | Kommando / Vorgehensweise |
|-----------|---------|--------------------------|
| Klick „NPC generieren" → Vorschau-Karte mit Name, Zug, Marotte in <1s | E2E | `performance.now()` Delta < 1000ms; alle 3 Felder befüllt |
| Volk-Filter ändert Namens-Pool | Unit | `generiereNPCName('zwerg', 'maennlich')` → Name aus `NPC_DEFAULT_TABLES.namen.zwerg.maennlich` |
| Re-Roll erzeugt anderen NPC (kein Müll im `D.npcs`) | E2E | 3× Re-Roll → `D.npcs.length === 0` (kein Auto-Speichern) |
| „Als NPC speichern" legt Eintrag in `D.npcs` an | E2E | Button-Klick → `D.npcs.length === 1` mit korrekten Feldern |
| Gespeicherter NPC erscheint im NPC-Tab | E2E | `switchView('npcs')` → NPC-Karte sichtbar |

### WELT-03: Kampagnen-Timeline

| Verhalten | Testtyp | Kommando / Vorgehensweise |
|-----------|---------|--------------------------|
| Kalender zeigt Harptos-Monatsnamen | E2E | `#kalender-monat-anzeige` enthält z.B. „Hammer 1492 DR" |
| Timeline-Eintrag mit Datum wird gespeichert | E2E | Formular ausfüllen → `D.calendar.events.length === 1` |
| Einträge erscheinen chronologisch sortiert | Unit | 3 Einträge mit unterschiedlichen Daten → renderTimeline() → Reihenfolge korrekt |
| Auto-Vorschlag nach abgeschlossener Reise | E2E | Reise abschließen → Bestätigungs-Dialog „Timeline-Eintrag hinzufügen?" |

### WELT-04: Reise- & Wetter-Simulator

| Verhalten | Testtyp | Kommando / Vorgehensweise |
|-----------|---------|--------------------------|
| Normales Tempo über normales Gelände → 24 Meilen/Tag | Unit | `berechneTagesmarsch('normal', 'normal') === 24` |
| Langsames Tempo über schwieriges Gelände → 9 Meilen/Tag | Unit | `berechneTagesmarsch('langsam', 'schwierig') === 9` (18 × 0,5) |
| Wetter-Roll gibt Ergebnis basierend auf Jahreszeit | Unit | `rollWetter('gemässigt', 'winter')` → nicht null, `result.entry.text` enthält Text |
| Begegnungs-Roll mit konfigurierbarer Chance | Unit | `rollBegegnung('wald', 20, 1)` → `{begegnung: bool, ergebnis: ...}` |
| Reise-Abschluss rückt `D.calendar` um korrekte Tage vor | E2E | Start-Tag 1, 3 Tage Reise → `D.calendar.day === 4` |

### WELT-05: Fraktionen & Ruf-System

| Verhalten | Testtyp | Kommando / Vorgehensweise |
|-----------|---------|--------------------------|
| Fraktion anlegen → erscheint in Übersichtsliste | E2E | Formular → `D.factions.length === 1`; Tab zeigt Karte |
| Ruf + 10 → Stufe wechselt korrekt | Unit | `rufStufe(15).label === 'Freundlich'`; `rufStufe(21).label === 'Verbündet'` |
| Ruf-Anpassung schreibt Eintrag in `rufHistorie` | E2E | Klick „+10" mit Notiz „Drachenschatz gerettet" → `faction.rufHistorie.length === 1` |
| Undo nach Ruf-Änderung stellt alten Wert wieder her | E2E | Ruf 0 → +10 → Strg+Z → `faction.ruf === 0` |
| NPC mit `factionId` erscheint in Fraktions-Mitgliederliste | E2E | NPC speichern mit factionId → Fraktion-Detail zeigt NPC-Namen |

---

## Projektspezifische Constraints (aus CLAUDE.md)

- Non-ESM: kein `import`/`export`. Alle Globals über `window.X = X` am Dateiende exportieren.
- 3-fach-Registrierung: `loader.js` + `build.py` + `systems/tab-registry.js`.
- `pushUndo(label)` IMMER vor jeder Datenmutation in `D`.
- `esc()` für alle Nutzerinhalte in HTML-Templates; `sanitizeHTML()` für Rich-Text.
- Kein `const X = window.X` innerhalb von Funktionskörpern (Build-Dedup-Falle).
- Keine doppelten Top-Level-Funktionsnamen — `check_duplicate_functions()` bricht Build ab.
- Deutsche UI-Strings; Code-Kommentare Englisch/Deutsch gemischt akzeptiert.
- CSS-Präfixe: neues Feature z.B. `wp-` (Welt-Prep), `npcg-` (NPC-Generator), `tl-` (Timeline), `rs-` (Reise-Simulator), `fr-` (Fraktionen).
- `structuredClone()` statt `JSON.parse(JSON.stringify())`.
- `parseEntityId(id)` für alle ID-Vergleiche.
- Interval/Timeout immer mit Guard (`if (handle) clearInterval(handle)`).

---

## Annahmen-Protokoll

| # | Aussage | Abschnitt | Risiko bei Fehler |
|---|---------|-----------|------------------|
| A1 | Harptos-Monatsnamen und Festtags-Positionen (Forgotten-Realms-Kanon) | Harptos-Daten | Kosmetisch — Namen/Daten leicht korrigierbar |
| A2 | Shieldmeet 1492 DR ist kein Schaltjahr | Harptos-Daten | Shieldmeet fehlt oder ist falsch platziert; leicht korrigierbar |
| A3 | 5e-Reisetempi 18/24/30 Meilen/Tag aus PHB | Reise-Mechanik | Regeln-Inkonsistenz; SL-Konfidenz — kanonisch sehr stabil |
| A4 | 1 auf W20 als Standard-Begegnungschance | Wetter/Begegnung | SL kann konfigurieren; kein harter Fehler |

---

## Umgebungs-Verfügbarkeit

Keine externen Abhängigkeiten für Phase 5. Alle Werkzeuge sind bereits installiert:

| Abhängigkeit | Benötigt von | Verfügbar | Fallback |
|-------------|-------------|-----------|---------|
| Python 3.x | `generate_npc_tables.py` | ✓ (build.py läuft) | — |
| Node.js / npm | Tests, Build | ✓ | — |
| Browser (Chromium) | Playwright E2E | ✓ | — |

---

## Quellen

### Primär (HOCH)
- `core/data.js` — verifiziertes `D.calendar`-Schema + `initializeData()`
- `features/random-tables.js` — verifizierte `rollWeightedEntry()`, `rollOnTable()`-Signaturen
- `systems/entity-links.js` — verifizierte `parseEntityLinks()`, `showInsertEntityLinkModal()`-Signaturen
- `features/npcs/npc-crud.js` — verifizierter NPC-CRUD-Fluss + `saveNPC()`
- `features/npcs/npc-render.js` — verifiziertes `RELATION_STATUS`-Schema
- `features/encounter-calculator.js` — verifiziertes `TERRAIN_MODIFIERS`-Array
- `systems/tab-registry.js` — verifiziertes `TAB_RENDER_REGISTRY`-Format + vorhandene Tab-Keys
- `systems/spellslots/version-migration.js` — verifiziertes Migrations-Muster
- `loader.js` — verifizierte Modullisten-Reihenfolge (140 Einträge Stand heute)
- `build.py` — verifiziertes `css_files`-Array, `html_templates`-Array, Dedup-Mechanismus
- `.planning/codebase/STRUCTURE.md` — verifizierte 3-fach-Registrierungs-Regel
- `.planning/codebase/CONCERNS.md` — verifizierte Build-Dedup-Fallstricke

### Sekundär (ASSUMED)
- D&D 5e PHB Kapitel 8 (Reisetempi 18/24/30 Meilen/Tag) — Training-Wissen, kanonisch sehr stabil
- Forgotten Realms / Harptos-Kalender — Training-Wissen, Faerûn-Setting-Kanon

---

**Konfidenz-Aufschlüsselung:**

| Bereich | Level | Begründung |
|---------|-------|-----------|
| Standard-Stack (Wiederverwendung) | HOCH | Alle Signaturen aus Quellcode verifiziert |
| Architektur (Module, Muster) | HOCH | Bestehendes Muster 1:1 repliziert |
| Harptos-Daten | MITTEL | Kanonisch stabil, aber nicht via Tool verifiziert |
| Reise-Mechaniken | MITTEL | 5e-SRD-Regeln, kanonisch stabil |
| Tabelleninhalte (NPC-Namen etc.) | NIEDRIG | Vom Skript zu befüllen, keine Verifikation in dieser Session |

**Recherche-Datum:** 2026-06-15
**Gültig bis:** ca. 2026-07-15 (stabiles Projekt, kein externer Drift)
