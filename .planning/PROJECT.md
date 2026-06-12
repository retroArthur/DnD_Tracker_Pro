# D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

## What This Is

Ein offline-first Single-Page D&D 5e Kampagnen-Manager (pures JavaScript/HTML/CSS, deutsche UI, v2.6.0), den der Entwickler selbst als Spielleiter am Tisch nutzt — per Doppelklick auf die gebaute HTML-Datei (`file://`). Dieses Projekt bringt die aktuell **nicht startende App** zurück in einen sauberen, gepflegten Zustand und baut sie danach gezielt zum mächtigeren Spielleiter-Werkzeug aus.

## Core Value

Die App muss am Spieltisch **zuverlässig offline laufen** — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

## Requirements

### Validated

<!-- Aus dem bestehenden Code abgeleitet (.planning/codebase/, 92 Module, ~29k Zeilen). -->

- ✓ Party-Verwaltung (HP/AC/Conditions, Party-Übersicht, Rest-Manager) — existing
- ✓ NPC-Verwaltung mit Beziehungssystem (Relations, Status-Level) — existing
- ✓ Orte, Quests, Wiki, Session-Notizen mit Rich-Text + Markdown — existing
- ✓ Encounter-Verwaltung + Balance-Rechner (Gelände-/Lair-Modifikatoren) — existing
- ✓ Initiative-Tracker mit Death Saves, Concentration, AoE-Schaden, Quick Actions — existing
- ✓ Zauber-Datenbank (deutsche SRD-Zauber) + Spell-Slot-Tracking — existing
- ✓ Loot/Truhe + Verteilung, Shops mit Handout-HTML-Export — existing
- ✓ Würfel-Roller (Floating Panel, Favoriten) + Random Tables — existing
- ✓ DM Screen mit 21 Widget-Typen und Profilen — existing
- ✓ Multi-Kampagnen-Verwaltung (getrennte LocalStorage-Keys) — existing
- ✓ Globale Fuzzy-Suche, Undo/Redo, Auto-Backups (LocalStorage + IndexedDB), Event-Log, Timer, Kalender — existing
- ✓ Build-System (`build.py` bündelt 92 Module in eine HTML-Datei), CI-Pipeline, Jest + Playwright Tests — existing

**Validated in Phase 1: Stabilisierung (2026-06-12):**

- ✓ App startet fehlerfrei via `file://` — `clearMindmap`-Boot-Crash (tools/debug.js) behoben, Smoke-Tests 7/7
- ✓ Mindmap-Reste vollständig bereinigt (debug.js, campaign-manager Seed, types/\*.d.ts, styles-purged.css, tests, tools)
- ✓ Frische Builds (dev + production) aus aktuellem Quellcode, Konsole fehlerfrei in allen Tabs
- ✓ Lint/Typecheck/Format grün (`npm run check` Exit 0, dauerhaft — Lint-Gate error-only, Prettier-Massenformatierung)
- ✓ Repo gepflegt: CI grün, tote Dateien/Tools entfernt (main.js, tsconfig.json.backup, veraltete tools/\*.py, validate.py repariert)
- ✓ Doku aktuell: CLAUDE.md, README, docs/bugfixes.md auditiert; Lizenz einheitlich MIT; SRD-Herkunft dokumentiert
- ✓ Persistenz-Härtung: >5-MB-Stale-Shadow-Fix, Export-Versionsstempel, LS/IDB-Konfliktauflösung ohne Rekursion (`resolveStorageConflict`)

### Active

**Milestone-Teil B — Technik-Fundament (erste Feature-Gruppe):**

- [ ] PWA-Installation (installierbare App mit Icon — löst file://-Beschränkungen strukturell)
- [ ] Datei-Backup-Sync (automatischer Export auf Festplatte über LocalStorage hinaus)
- [ ] Command Palette (Strg+K: Aktionen ausführen, nicht nur suchen)

**Milestone-Teil C — Spielleiter-Features (danach, Reihenfolge bei Roadmap-Erstellung):**

- [ ] Monster-Kompendium / Bestiary-Tab (SRD-Statblocks offline + eigene Kreaturen, Ausbau von monster-templates.js)
- [ ] Statblock-Popup in der Initiative (kompletter Statblock statt nur HP/AC)
- [ ] Tracker für Legendäre Aktionen & Resistenzen in der Initiative
- [ ] Mob-/Massenkampf-Modus (Gegnergruppen, Sammel-Würfe)
- [ ] Soundboard (lokale Audio-Dateien als Ambience mit Schnelltasten)
- [ ] Session-Prep-Assistent (Szenenkarten, Checkliste, offene Fäden)
- [ ] Kampagnen-Timeline (chronologische Ereignisse, verknüpft mit Kalender)
- [ ] NPC-Generator (Name, Persönlichkeit, Marotte auf Knopfdruck, nutzt Random Tables)
- [ ] Reise- & Wetter-Simulator (Tagesreisen, Wetter, Zufallsbegegnungen je Gelände)
- [ ] Fraktionen & Ruf-System (Fraktionsziele, Ruf-Tracker der Gruppe)
- [ ] XP-/Milestone-Tracker (Levelfortschritt, XP aus Encountern)
- [ ] Inspiration-Tracker (Inspiration-Punkte pro Spieler)
- [ ] Erweiterte Charakterbögen (Skills, Saves, Angriffe für schnelle Checks)
- [ ] Würfel-Statistiken (Verteilungen, Crit-Quoten aus Roll-Historie)

### Out of Scope

- Spieler-Ansicht (zweiter Bildschirm) — vom Nutzer bewusst abgewählt; `file://`-Origin-Isolation macht Fenster-Sync zusätzlich riskant
- Handout-System — vom Nutzer bewusst abgewählt
- Druck-Exporte (Spell-Cards, NPC-Karten) — vom Nutzer bewusst abgewählt
- Backend/Cloud-Server-Funktionen — App bleibt offline-first ohne Server
- Mindmap/Network-Reaktivierung — Feature wurde bewusst entfernt (Commit 7ef9bf5); nur Reste werden bereinigt
- Framework-Migration (React/Vue/ESM) — bewährte non-ESM-Architektur bleibt

## Context

- **Brownfield:** v2.6.0, 92 JS-Module (~29k Zeilen), non-ESM Global-Scope-Architektur, `build.py` bündelt alles in eine standalone HTML-Datei. Codebase-Map liegt in `.planning/codebase/` (7 Dokumente, Stand 2026-06-11).
- **Akuter Bruch (behoben in Phase 1):** Der `clearMindmap`-ReferenceError in tools/debug.js ist beseitigt, frische dev-/prod-Builds liegen in `dist/`, CI mit Playwright-Smoke-Test erkennt künftige Boot-Crashes. Offen aus Phase 1: 3 manuelle Browser-Tests (01-HUMAN-UAT.md) + Code-Review-Findings (1 vorbestehender Import-XSS, siehe 01-REVIEW.md).
- **Bekannte Schwächen (aus CONCERNS.md):** doppelt gepflegte Modullisten (loader.js + build.py), build.py Pass-3 hinterlässt verwaiste Funktionskörper, Debug-Flag-Flip per String-Match, ~504 funktions-lokale `const X = window.X`-Imports, veraltete CLAUDE.md (widerspricht Code in mehreren Punkten), kaputte Dev-Tools (validate.py mit Linux-Pfaden, `python3` in npm-Scripts auf Windows), Lizenz-Widerspruch (package.json ISC vs. LICENSE MIT), deprecated `document.execCommand` im Rich-Text-Editor (21 Call-Sites).
- **Nutzung:** Einzelnutzer (Entwickler = Spielleiter), Windows, Chromium-Browser, App wird als `file://` per Doppelklick geöffnet. Deutsche UI durchgängig.

## Constraints

- **Tech-Stack**: Pures JS/HTML/CSS, non-ESM, kein Framework, keine Runtime-Dependencies — bewährte Architektur, bleibt
- **Offline**: Muss ohne Server laufen; `file://`-Doppelklick ist der primäre Nutzungsmodus (PWA als strukturelle Verbesserung geplant)
- **Persistenz**: Nur LocalStorage + IndexedDB, kein Backend
- **Sprache**: Deutsche UI-Texte, Code-Kommentare gemischt DE/EN
- **Plattform**: Windows als primäre Dev-Umgebung (`PYTHONIOENCODING=utf-8`, `python` statt `python3`)
- **Build**: `build.py` ist das einzige Build-System; Modullisten in loader.js und build.py müssen synchron bleiben

## Key Decisions

| Decision                                                                        | Rationale                                                                                                                      | Outcome   |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Stabilisierung vor allen Features                                               | App startet aktuell nicht; Fundament zuerst                                                                                    | — Pending |
| Technik-Fundament als erste Feature-Gruppe (PWA, Datei-Backup, Command Palette) | Löst file://-Probleme strukturell und schützt Daten, bevor große Features kommen                                               | — Pending |
| Spieler-Ansicht/Handouts/Druck-Exporte ausgeklammert                            | Vom Nutzer im Brainstorming bewusst abgewählt                                                                                  | — Pending |
| Mindmap bleibt entfernt                                                         | Bereits entschieden (Commit 7ef9bf5, 2026-05-24); nur Reste bereinigen                                                         | — Pending |
| Tests grün ist kein hartes Stabilisierungs-Kriterium                            | Nutzer definiert „sauber" als: Konsole fehlerfrei, Build aktuell, Lint/Typecheck grün — Tests laufen mit, sind aber nicht Gate | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-06-12 after Phase 1 completion (Stabilisierung verifiziert, 11/11 STAB-Requirements)_
