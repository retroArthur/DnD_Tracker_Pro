# Phase 7: Komfort & Analyse - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Zwei Komfort-/Analyse-Features für den Spieltisch:

1. **Soundboard (UX-01):** Lokale Audio-Dateien als Ambience nutzen — Szenen, Schnelltasten, Lautstärkeregelung. Muss vollständig offline im `file://`-Modus laufen.
2. **Würfel-Statistiken (UX-02):** Verteilungen und Crit-Quoten aus der Roll-Historie einsehen.

NICHT in dieser Phase: alles andere. Insbesondere KEINE Kopplung von Audio an Spielereignisse und KEIN Export/Teilen von Statistiken (siehe Deferred Ideas).
</domain>

<decisions>
## Implementation Decisions

### Soundboard — Datei-Persistenz
- **D-01:** Audio wird in einem **eigenen, dedizierten IndexedDB-Blob-Store** gespeichert — NIE in `D`, nie in Undo-Snapshots, nie in Exporten (analog zur bestehenden Architektur-Notiz „Würfel-Statistiken: eigener IndexedDB-Store, niemals in D"). Überlebt Reload und funktioniert vollständig im `file://`-Modus (kein File System Access API nötig). **Begründung:** Kernwert der App ist „läuft offline am Spieltisch, verliert keine Daten" — Audio-Dateien pro Session neu auswählen wäre am Tisch untauglich.
- **D-01a:** Absicherung gegen DB-Bloat: Größen-Warnung pro Datei (Richtwert ~> 20 MB) + eigene „Audio-Bibliothek"-Verwaltung zum Auflisten/Entfernen hinterlegter Dateien. Exakte Schwelle/UX an Planner.

### Soundboard — Szenen & Layering
- **D-02:** Eine **Szene = Mix mehrerer gleichzeitig laufender Loop-Spuren** (z.B. Regen + Taverne + Feuer), jede Spur mit eigener Lautstärke. **Crossfade** beim Szenenwechsel (sanft, nicht harter Schnitt). Loop standardmäßig an.
- **D-02a (MVP-Rückfallebene):** Falls der Umfang von D-02 zu groß wird, darf der Planner auf einen schlanken MVP reduzieren (eine Loop pro Szene, harter Schnitt) und das als bewusste Abweichung melden. Das ist KEINE separate Phase, sondern eine dokumentierte Vereinfachungsoption innerhalb dieser Phase.

### Soundboard — Schnelltasten
- **D-03:** Szenen sind per Tastatur-Schnellzugriff (Quick-Slots) umschaltbar. Belegung MUSS Konflikte mit bestehenden Shortcuts vermeiden (1–9 = Tabs, R/T/L/N/P, Space, `/`, Strg+K/F/S/Z/Y, Shift+N). Researcher/Planner prüft die Shortcut-Tabelle in CLAUDE.md und wählt freie Tasten (z.B. Modifier-Kombinationen).

### Würfel-Statistiken — Datenquelle & Umfang
- **D-04:** Würfe werden in einem **eigenen, dedizierten IndexedDB-Store über Sessions hinweg** persistiert (nie in `D`). Erfasst werden **ALLE** Würfe über einen zentralen Hook in `addToDiceHistory()` (dice-core.js) — Dice-Tab, klickbare Charakter-/Save-/Attribut-/Angriffswürfe, Quick-Rolls (`R`), Vorteil/Nachteil. Alle Würfeltypen werden gespeichert; **d20 ist das primäre Histogramm**.
- **D-04a:** `diceHistory` (In-Memory, dice-core.js:7) bleibt als Live-Liste bestehen; der IndexedDB-Stats-Store wird zusätzlich/parallel gefüllt (Persistenz für die Analyse, nicht Ersatz der Live-Historie).

### Würfel-Statistiken — Darstellung
- **D-05:** d20-Histogramm (Seiten 1–20) mit **Erwartungsverteilungs-Overlay** (5 % je Seite); explizite **Crit-(20)- und Patzer-(1)-Quote**; **Gesamtansicht + optionale Aufschlüsselung pro Charakter** (nur wo der Wurf zuordenbar ist — nicht zuordenbare Würfe wie Dice-Tab/Quick-Rolls laufen unter „Allgemein"); **Filter „diese Session / gesamt"**.

### Claude's Discretion
- Konkrete Schnelltasten-Belegung (D-03), IndexedDB-Schema-Details beider Stores, Crossfade-Dauer, Histogramm-Render-Technik (Canvas/SVG/CSS-Balken), Lautstärke-UI-Form — an Researcher/Planner delegiert.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phasen-Scope & Anforderungen
- `.planning/ROADMAP.md` § „Phase 7: Komfort & Analyse" — Goal, Success Criteria (Soundboard-Szenen/Schnelltasten/Lautstärke offline; d20-Histogramm + Erwartung + Crit-Quote)
- `.planning/REQUIREMENTS.md` — UX-01 (Soundboard), UX-02 (Würfel-Statistiken)
- `.planning/PROJECT.md` — Kernwert „offline-first, keine Datenverluste, `file://`-Doppelklick als primärer Modus"; Out-of-Scope-Liste

### Architektur & Konventionen
- `CLAUDE.md` — Architektur-Notiz „Würfel-Statistiken: Eigener IndexedDB-Store — niemals in D"; Keyboard-Shortcuts-Tabelle (für D-03); Regel „neue Module in build.py UND loader.js eintragen"; `data-action`-Delegation; `esc()`/`sanitizeHTML()`
- `.planning/codebase/ARCHITECTURE.md` — Offline-first, non-ESM global-scope, State in `D` + localStorage/IndexedDB
- `.planning/codebase/STRUCTURE.md`, `.planning/codebase/INTEGRATIONS.md` — Modul-/Tab-Struktur, IndexedDB-Integrationsmuster

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `features/dice/dice-core.js` — `diceHistory` (In-Memory-Array, :7) und vor allem `addToDiceHistory(notation, result, rolls)` als **zentraler Sammelpunkt ALLER Würfe** → idealer Hook, um Würfe zusätzlich in den IndexedDB-Stats-Store zu schreiben (D-04). `parseDiceNotation()` liefert `{total, rolls, keptRolls, modifier}`.
- IndexedDB ist im Projekt bereits etabliert (Backups nutzen LocalStorage + IndexedDB; `systems/backups.js`) → bestehende IDB-Helfer/Muster für beide neuen Stores (Audio-Blobs, Würfel-Stats) wiederverwenden.
- `features/timers/timers.js` — einzige bestehende Audio-Nutzung (Timer-Sound); Referenz für `new Audio()`/Playback-Muster. Soundboard ist im Kern Greenfield.
- `systems/tab-registry.js` + Navigation — Muster für neue Tabs (Soundboard, Statistiken), inkl. defensiver Render-Funktionen.

### Established Patterns
- Non-ESM, globale Scope, `<script>`-Tags: jedes NEUE Modul MUSS in `build.py` UND `loader.js` eingetragen werden (sonst still weggelassen).
- Große Binär-/Massendaten NIE in `D` oder Exporten — eigener IndexedDB-Store (gilt für Audio-Blobs UND Würfel-Stats).
- `data-action`-Delegation statt inline-onclick; `esc()`/`sanitizeHTML()` für User-Content; `showToast`/Event-Log für Feedback.

### Integration Points
- `addToDiceHistory()` (dice-core.js) = Hook für die Stats-Erfassung (D-04).
- Neue Tabs: Tab-Registry + Navigation + `assets/templates/*.html` + `assets/styles/*.css`.
- `file://`-Constraint: kein File System Access API → IndexedDB-Blobs sind der einzige Persistenz-Weg für Audio (D-01).
</code_context>

<specifics>
## Specific Ideas

- Primärer Nutzungsmodus ist `file://`-Doppelklick (Windows/Chromium) am Spieltisch — JEDE Entscheidung muss dort funktionieren (treibt D-01: IndexedDB-Blobs statt File System Access API).
- Ambience-Beispiel des Nutzers: gleichzeitig laufende Spuren wie „Regen + Taverne + Feuer" (treibt D-02: Layering).
</specifics>

<deferred>
## Deferred Ideas

- **Audio-Effekt-Trigger an Spielereignisse koppeln** (z.B. automatischer Sound bei Crit/Patzer, Kampfbeginn) — neue Capability, eigene Phase/Backlog.
- **Würfel-Statistiken exportieren/teilen** (CSV/Bild/Handout) — neue Capability, eigene Phase/Backlog.

None weiteren — Diskussion blieb im Phasen-Scope.
</deferred>

---

*Phase: 7-Komfort & Analyse*
*Context gathered: 2026-06-19*
