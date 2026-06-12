# Requirements: D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

**Defined:** 2026-06-11
**Core Value:** Die App muss am Spieltisch zuverlässig offline laufen — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

## v1 Requirements

Requirements für diesen Milestone. Jedes wird genau einer Roadmap-Phase zugeordnet.

### Stabilisierung (STAB)

- [x] **STAB-01**: App startet fehlerfrei per `file://`-Doppelklick — der `clearMindmap`-Boot-Crash (tools/debug.js:99) ist behoben
- [x] **STAB-02**: Alle Reste des entfernten Mindmap-Features sind bereinigt (debug.js, campaign-manager-Seed, types/\*.d.ts, styles-purged.css, tests/setup.js, tools/split-shops.py)
- [x] **STAB-03**: dev- und production-Builds sind frisch aus aktuellem Quellcode gebaut; Browser-Konsole bleibt in allen Tabs fehlerfrei
- [x] **STAB-04**: `npm run check` läuft grün (ESLint, TypeScript, Prettier)
- [x] **STAB-05**: Kampagnen über 5MB verlieren beim Neuladen keine Daten mehr (Stale-Shadow-Bug in der Persistenz behoben)
- [x] **STAB-06**: Exporte tragen die echte App-Version (`APP_CONFIG.VERSION`) statt hartkodiert `'2.11'`; Re-Import führt Migrationen korrekt aus
- [x] **STAB-07**: build.py ist gehärtet: Pass-3-Duplikatentfernung hinterlässt keine verwaisten Funktionskörper; Production-Build bricht ab, wenn DEBUG_MODE nicht deaktiviert wurde; Modullisten loader.js/build.py werden auf Sync geprüft
- [x] **STAB-08**: CI erkennt Boot-Crashes: Playwright-Smoke-Test lädt den dist-Build und prüft erfolgreiche App-Initialisierung
- [x] **STAB-09**: Tote Dateien und kaputte Tools sind entfernt/repariert (main.js, tsconfig.json.backup, MIGRATION_REPORT.md, validate.py-Pfade, `python3`→`python` in npm-Scripts)
- [x] **STAB-10**: Doku spiegelt den echten Code-Stand: CLAUDE.md, README und docs/bugfixes.md auditiert; Lizenz einheitlich MIT (package.json korrigiert)
- [x] **STAB-11**: Herkunft der deutschen SRD-Zaubertexte ist geprüft und dokumentiert (Lizenz-Audit, Redistributionsrisiko geklärt)

### Technik-Fundament (TECH)

- [x] **TECH-01**: Nutzer kann die App als PWA installieren (Manifest, Icons, Service Worker) und über ein Desktop-Icon starten statt per file://-Doppelklick
- [x] **TECH-02**: Beim ersten PWA-Start werden bestehende file://-Kampagnendaten per Migrations-Assistent übernommen (kein Datenverlust beim Origin-Wechsel)
- [x] **TECH-03**: Nutzer kann automatische Datei-Backups auf die Festplatte aktivieren (File System Access API; Fallback: manueller Download im file://-Modus)
- [x] **TECH-04**: Nutzer kann per Command Palette Aktionen ausführen (kollisionsfreier Shortcut, Fuzzy-Suche über Aktions-Registry, z.B. „Neuer NPC", „Würfle 8d6")

### Monster-Kompendium (BEST)

- [ ] **BEST-01**: Nutzer kann SRD-Monster offline durchsuchen und filtern (Name, CR, Typ) in einem eigenen Bestiary-Tab
- [ ] **BEST-02**: Nutzer kann eigene Kreaturen anlegen, bearbeiten und löschen
- [ ] **BEST-03**: Nutzer kann Monster direkt aus dem Bestiary in Encounter und Initiative übernehmen

### Initiative-Erweiterungen (INIT)

- [ ] **INIT-01**: Nutzer kann per Klick auf einen Kombattanten den vollständigen Statblock als Popup sehen (Aktionen, Traits, Saves)
- [ ] **INIT-02**: Nutzer kann Legendäre Aktionen und Legendäre Resistenzen pro Runde zählen und zurücksetzen
- [ ] **INIT-03**: Nutzer kann Gegnergruppen als Mob führen (eine Initiative-Zeile, Pool-HP, Sammel-Angriffe)

### Welt & Story (WELT)

- [ ] **WELT-01**: Nutzer kann Sessions mit Szenenkarten vorbereiten (Strong Start, geplante Szenen, offene Fäden der letzten Session)
- [ ] **WELT-02**: Nutzer kann NPCs per Knopfdruck generieren (deutscher Name, Persönlichkeit, Marotte)
- [ ] **WELT-03**: Nutzer kann Kampagnen-Ereignisse chronologisch festhalten (Timeline, mit dem Kalender verknüpft)
- [ ] **WELT-04**: Nutzer kann Reisen tageweise simulieren (Wetter, Zufallsbegegnungen je Gelände, Reisetempo)
- [ ] **WELT-05**: Nutzer kann Fraktionen mit Zielen verwalten und den Ruf der Gruppe je Fraktion verfolgen

### Spieler-Verwaltung (CHAR)

- [ ] **CHAR-01**: Nutzer kann XP/Milestones der Gruppe verfolgen und XP aus abgeschlossenen Encountern übernehmen
- [ ] **CHAR-02**: Nutzer kann Inspiration je Spieler vergeben und einsehen
- [ ] **CHAR-03**: Nutzer kann erweiterte Charakterwerte pflegen (Skill-Proficiencies, Saves, Angriffe) für schnelle Checks am Tisch

### Komfort & Analyse (UX)

- [ ] **UX-01**: Nutzer kann lokale Audio-Dateien als Soundboard nutzen (Ambience-Szenen, Schnelltasten, Lautstärkeregelung)
- [ ] **UX-02**: Nutzer kann Würfel-Statistiken einsehen (Verteilungen, Crit-Quoten aus der Roll-Historie)

## v2 Requirements

Bewusst auf später verschoben. Erfasst, aber nicht in der aktuellen Roadmap.

### Welt & Story

- **WELT-06**: Visuelle Fraktions-Beziehungsmatrix
- **WELT-07**: Horizontale visuelle Timeline mit Zoom/Scroll

### Spieler-Verwaltung

- **CHAR-04**: Fraktions-Ruf pro Charakter (statt nur pro Gruppe)

### Komfort & Analyse

- **UX-03**: Soundboard-Crossfade zwischen Szenen

## Out of Scope

Explizit ausgeschlossen. Dokumentiert, um Scope-Creep zu verhindern.

| Feature                                              | Begründung                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Spieler-Ansicht (zweiter Bildschirm)                 | Vom Nutzer bewusst abgewählt; file://-Origin-Isolation macht Fenster-Sync zusätzlich riskant |
| Handout-System                                       | Vom Nutzer bewusst abgewählt                                                                 |
| Druck-Exporte (Spell-Cards, NPC-Karten, Party-Sheet) | Vom Nutzer bewusst abgewählt                                                                 |
| Backend-/Cloud-/Server-Funktionen                    | App bleibt offline-first ohne Server                                                         |
| Mindmap/Network-Reaktivierung                        | Feature bewusst entfernt (Commit 7ef9bf5); nur Reste werden bereinigt                        |
| Framework-/ESM-Migration                             | Bewährte non-ESM-Vanilla-JS-Architektur bleibt                                               |
| KI-generierte Inhalte                                | Erfordert API/Netzwerk — widerspricht offline-first                                          |
| Streaming-Audio (Spotify/YouTube)                    | Erfordert Netzwerk; lokale Dateien decken den Bedarf                                         |
| Vollständiger digitaler Spieler-Charakterbogen       | D&D Beyond u.a. machen das besser; nur DM-relevante Werte                                    |

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| STAB-01     | Phase 1 | Complete|
| STAB-02     | Phase 1 | Complete|
| STAB-03     | Phase 1 | Complete|
| STAB-04     | Phase 1 | Complete |
| STAB-05     | Phase 1 | Complete|
| STAB-06     | Phase 1 | Complete|
| STAB-07     | Phase 1 | Complete|
| STAB-08     | Phase 1 | Complete|
| STAB-09     | Phase 1 | Complete|
| STAB-10     | Phase 1 | Complete|
| STAB-11     | Phase 1 | Complete|
| TECH-01     | Phase 2 | Complete |
| TECH-02     | Phase 2 | Complete |
| TECH-03     | Phase 2 | Complete |
| TECH-04     | Phase 2 | Complete |
| BEST-01     | Phase 3 | Pending |
| BEST-02     | Phase 3 | Pending |
| BEST-03     | Phase 3 | Pending |
| INIT-01     | Phase 4 | Pending |
| INIT-02     | Phase 4 | Pending |
| INIT-03     | Phase 4 | Pending |
| WELT-01     | Phase 5 | Pending |
| WELT-02     | Phase 5 | Pending |
| WELT-03     | Phase 5 | Pending |
| WELT-04     | Phase 5 | Pending |
| WELT-05     | Phase 5 | Pending |
| CHAR-01     | Phase 6 | Pending |
| CHAR-02     | Phase 6 | Pending |
| CHAR-03     | Phase 6 | Pending |
| UX-01       | Phase 7 | Pending |
| UX-02       | Phase 7 | Pending |

**Coverage:**

- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---

_Requirements defined: 2026-06-11_
_Last updated: 2026-06-11 — Traceability filled by roadmapper_
