# D&D Kampagnen-Tracker Pro

## What This Is

Ein offline-first Single-Page D&D 5e Kampagnen-Manager (pures JavaScript/HTML/CSS, deutsche UI, v2.6.1), den der Entwickler selbst als Spielleiter am Tisch nutzt — wahlweise per Doppelklick auf die gebaute HTML-Datei (`file://`) oder als **installierbare PWA** (GitHub Pages). Mit v1.0 „Stabilisierung & Ausbau" ist die einst nicht startende App ein vollständiges, getestetes Spielleiter-Werkzeug: Bestiary, Kampf-Tiefe, Weltwerkzeuge, Spieler-Verwaltung, Soundboard und Würfel-Statistiken.

## Core Value

Die App muss am Spieltisch **zuverlässig offline laufen** — ein Spielleiter-Begleiter, der nie im Weg steht und keine Daten verliert.

## Current State (v1.0 shipped 2026-07-22)

- **Version:** v2.6.1, Milestone **v1.0 „Stabilisierung & Ausbau"** geshippt (7 Phasen, 44 Pläne, 31/31 Requirements, UAT 20/20)
- **Codebase:** ~123 Module, ~81.000 Zeilen Quellcode, non-ESM Single-Bundle via `build.py`
- **Qualität:** 453 Unit-Tests grün, Phasen-E2E grün, CI mit Pages-Deploy; alle 7 Phasen-VERIFICATIONs `passed`
- **Live:** https://retroarthur.github.io/DnD_Tracker_Pro/dnd-tracker-optimized.html (PWA installierbar, SW-Updates, Datei-Backup, Migrations-Wizard)

## Next Milestone Goals

Noch nicht definiert — via `/gsd-new-milestone`. Bekannte Kandidaten: Soundboard Per-Track-Play (Layering, Design bereits diskutiert), execCommand-Ablösung (Tech-Debt-Phase), Phase-1-Altlasten (Security-Audit, Import-XSS-Finding), 11 vorbestehende E2E-Fails.

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

**Validated in Phase 2: Technik-Fundament (2026-06-13):**

- ✓ PWA installierbar: echtes `manifest.webmanifest`, Cache-First-Service-Worker mit Update-Hinweis statt Force-Reload, lokal gebündelte Fonts, d20-App-Icon (192/512, maskable), Header-Install-Button, GitHub-Pages-Deploy-Job in der CI (TECH-01)
- ✓ Migration file:// → PWA: Voll-Export aller Kampagnen + Einstellungen + Würfel-Favoriten + DM-Profile, 4-Schritt-Wizard mit Divergenz-Schutz (TECH-02)
- ✓ Automatisches Datei-Backup via File System Access API: laufende `-aktuell.json` je Kampagne + datierte Tages-Snapshots (max. 10), IDB-Handle-Persistenz, Restore-Browser mit Undo-Schutz, file://-Download-Fallback (TECH-03)
- ✓ Command Palette (`Strg+Shift+K`): Aktions-Registry mit Fuzzy-Suche (Wiederverwendung `fuzzyMatch`), Tastaturnavigation (TECH-04)
- ✓ Qualitätszyklus: Code-Review mit 23 behobenen Findings (11 Critical, u. a. TDZ-Bundle-Crash), 300/300 Unit-Tests, Smoke-E2E 7/7 gegen Production-Bundle
- Offen als UAT (02-HUMAN-UAT.md): 6 manuelle Browser-Tests inkl. einmaliger GitHub-Pages-Aktivierung (Settings → Pages → Source: „GitHub Actions")

**Validated in Phase 3: Bestiary (2026-06-13):**

- ✓ Bestiary-Tab: 112 deutsche SRD-5.1-Statblocks offline (inline, `getSRDMonsters()` Lazy-Cache, nie in `D`), Liste mit Einzel-Pass-Filter/CR-Sortierung/Virtual-Scroll, klassischer 5e-Pergament-Statblock mit klickbaren Würfeln (BEST-01)
- ✓ Eigene Kreaturen: `bst-*`-Editor (volles D-04-Schema), CRUD mit Undo, geteilter Render-/Würfel-Pfad mit SRD-Monstern (BEST-02)
- ✓ Übernahme: „Zur Initiative" (Mengen-Dialog, DoS-Cap 100, Auto-Wurf, ±10% HP-Variation, Nummerierung, statblockRef) und „Zu Encounter" (korrekte HP/AC, Undo-bar) (BEST-03)
- ✓ Qualitätszyklus: Verifikation 14/14 must-haves, Production-Build + 308/308 Unit + 11/11 Bestiary-E2E grün, Code-Review (3 Critical + 3 Warnings) vollständig behoben — inkl. Regression im Encounter-Template-Loader durch den `getMonsterTemplates()`-SRD-Alias
- Offen als manuelle Checks (03-VERIFICATION, nicht-blockierend): Offline-Anzeige aller 112 Monster, Pergament-Optik, Klick-Würfel-Feel

**Validated in Phase 4: Initiative-Erweiterungen (2026-06-14):**

- ✓ Statblock-Drawer: 📖-Button je Initiative-Zeile öffnet einen rechts angedockten Drawer (mobil Bottom-Sheet) mit vollem Statblock (geteilte `renderStatblockHTML`, DRY) bzw. Basisinfos; klickbare Würfel, sanitize-then-dice (INIT-01)
- ✓ Legendäre Aktionen & Resistenzen: klickbare Pips in Death-Save-Optik; LA-Auto-Reset bei Init 20 (D-10), LR KEIN Auto-Reset + manueller Reset (D-07, regelkonform); Feld-Init beim Bestiary-Add (INIT-02)
- ✓ Mob-Modus: N>1 identische Monster als eine Pool-HP-Zeile mit „X von N am Leben", zwei Sammel-Angriffsmodi (N-fach + DMG-Mob-Regel), auto-summierter Schaden, Feature-Hiding, Undo-sicheres Auflösen (INIT-03)
- ✓ Qualitätszyklus: Verifikation 3/3 Wahrheiten, Build sauber + 288/288 Unit + Initiative-E2E grün, Code-Review (keine Phase-4-eigenen Critical-Bugs); UAT vom Nutzer approved nach Drawer-Bugfix (links→rechts, schließbar). Test-Härtung: 16 vorbestehend kaputte/no-op Initiative-E2E-Tests repariert → 31/31 grün

**Validated in Phase 6: Spieler-Verwaltung (2026-06-16):**

- ✓ Fundament: `XP_LEVEL_THRESHOLDS` (20-wertige PHB-Tabelle, getrennt von `XP_THRESHOLDS`/Encounter), vier reine DOM-unabhängige Regel-Helfer (`calcSkillModifier`/`canLevelUp`/`getXPForCR`/`distributeXP`), Schema-Migration 5.0.0 (backfillt `xp`/`skillProficiencies`/`skillExpertise`/`attacks`, `settings.levelingMode`)
- ✓ Inspiration (CHAR-02): immer sichtbarer klickbarer ☆/⭐-Stern-Toggle auf der Charakterkarte; `toggle-inspiration-stop` mit `stopPropagation` (öffnet nicht den Editor), plain `save()` ohne Undo
- ✓ Erweiterte Charakterwerte (CHAR-03): 18 Skills (Namen aus `SKILL_INFO`) + Expertise + freie Angriffsliste (Cap 20, Schadensformel-Whitelist) im Editor; Detail-Modal mit nach Attribut gruppierten Skills, klickbaren Saves/Attribut-Checks/Angriffen (Vorteil/Nachteil) → landen in der Würfel-Historie
- ✓ XP-/Milestone-Tracker (CHAR-01): „⭐ XP"-Trigger in der Initiative öffnet XP-Modal (CR-Auto-Summe via `getXPForCR` + immer verfügbare manuelle Korrektur), Gleichverteilung auf lebende Charaktere, Level-Aufstieg-HINWEIS ohne Auto-Bump (`pushUndo` vor Mutation), gruppenweiter `levelingMode`-Toggle (Milestone versteckt XP-UI, zeigt „+1 Level")
- ✓ Qualitätszyklus: Verifikation 13/13 must-haves, Build sauber (2.70 MB) + 421/421 Unit (inkl. 49 neue Advancement-Tests) + 13/13 Phase-6-E2E grün, Code-Review (1 Critical ist ein vorbestehender Dice-Tab-Bug außerhalb Phase 6; 6 Warnings dokumentiert in 06-REVIEW.md)
- Offen als UAT (06-HUMAN-UAT.md): 5 visuelle/UX-Checks (Stern-Styling, XP-Fortschrittsbalken, Skills-Gruppierung, Angriffs-Click-Affordance, XP-Modal-Live-Vorschau)

**Validated in Phase 5: Welt & Story (2026-06-18):**

- ✓ Session-Prep-Assistent: Szenenkarten, Checkliste, offene Fäden (WELT-Requirements, 8/8 Pläne inkl. Gap-Closure 05-08 NPC-Generator-Modal-Overlay)
- ✓ NPC-Generator: deutscher Name + Persönlichkeit + Marotte auf Knopfdruck, zentriertes Modal (UAT: Qualität + <1s-Latenz bestätigt)
- ✓ Harptos-Kalender: 12 Monate + 5 Festtage kanon-konform (UAT-geprüft), 1492 DR, Timeline-Verknüpfung
- ✓ Reise-Simulator: Tagesreisen, Jahreszeiten, Gelände; Fraktionen & Ruf-System (Ruf-Stufen, ±5/±10)
- ✓ Qualitätszyklus: 5/5 must-haves, 37 Unit + 24 E2E grün (E2E-Modulformat-Fix 687eb7d)

**Validated in Phase 7: Komfort & Analyse (2026-06-20):**

- ✓ Soundboard (UX-01): Audio-Bibliothek mit IDB-Blob-Persistenz (20/100-MB-Guards), Web-Audio-Szenen mit Layering + 2s-Crossfade, Alt+Shift+1..5-Quick-Slots; Session-Erweiterungen: Per-Track-Loop-Toggle mit Crossfade-Loop, Fortschrittsbalken, Live-Volume
- ✓ Würfel-Statistiken (UX-02): d20-Histogramm (inline-SVG) mit Erwartungs-Overlay, Crit-/Fumble-Quoten, Per-Character-Breakdown, Session/Gesamt-Filter; Roll-Capture via addToDiceHistory-Tee in eigenem IDB-Store
- ✓ Qualitätszyklus: Verifier 14/14, Audio-UAT 4/4 (dabei 3 Bugs gefunden+gefixt), Code-Review-Critical CR-01 behoben

**Shipped als Milestone v1.0 (2026-07-22)** — alle 31 v1-Requirements validiert, Archiv: `milestones/v1.0-REQUIREMENTS.md`.

### Active

_(leer — nächster Milestone via `/gsd-new-milestone`; Kandidaten siehe „Next Milestone Goals")_

### Out of Scope

- Spieler-Ansicht (zweiter Bildschirm) — vom Nutzer bewusst abgewählt; `file://`-Origin-Isolation macht Fenster-Sync zusätzlich riskant
- Handout-System — vom Nutzer bewusst abgewählt
- Druck-Exporte (Spell-Cards, NPC-Karten) — vom Nutzer bewusst abgewählt
- Backend/Cloud-Server-Funktionen — App bleibt offline-first ohne Server
- Mindmap/Network-Reaktivierung — Feature wurde bewusst entfernt (Commit 7ef9bf5); nur Reste werden bereinigt
- Framework-Migration (React/Vue/ESM) — bewährte non-ESM-Architektur bleibt

## Context

- **Stand nach v1.0 (2026-07-22):** ~123 JS-Module (~81k Zeilen Quellcode), non-ESM Global-Scope-Architektur, `build.py` bündelt alles in eine standalone HTML-Datei (dev + `--production`). GitHub-Pages-Deploy via ci.yml (voll verifiziert: PWA-Install, SW-Update, Datei-Backup, Migrations-Wizard). Codebase-Map in `.planning/codebase/` (Stand 2026-06-11, vor Phasen 3–7 — bei Bedarf via `/gsd-map-codebase` auffrischen).
- **Nutzung:** Einzelnutzer (Entwickler = Spielleiter), Windows, Chromium-Browser; `file://`-Doppelklick UND installierte PWA. Deutsche UI durchgängig.
- **Wichtige Architektur-Lektion aus v1.0-UAT:** `window.save`-Monkey-Patches sind wirkungslos (globale `const`-Bindung überdeckt die window-Property) → expliziter `registerPostSaveHook`-Mechanismus in persistence.js (siehe CLAUDE.md „Live-Sync Pattern").
- **Offene Altlasten (nicht-blockierend, Kandidaten für v1.1):** Phase-1-Code-Review-Findings (1 vorbestehender Import-XSS), Phase-1-Security-Audit (SECURITY.md fehlt), 11 vorbestehende E2E-Fails (Task-Chip existiert), deprecated `document.execCommand` (21 Call-Sites, eigene Tech-Debt-Phase), Phase-3-Browser-Sichtchecks, `D.calendar.month` 0→1-Basis (benign).

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
| Stabilisierung vor allen Features                                               | App startet aktuell nicht; Fundament zuerst                                                                                    | ✓ Good — stabile Basis trug alle 6 Folgephasen |
| Technik-Fundament als erste Feature-Gruppe (PWA, Datei-Backup, Command Palette) | Löst file://-Probleme strukturell und schützt Daten, bevor große Features kommen                                               | ✓ Good — PWA + Backup + Migration in UAT end-to-end bestätigt |
| Spieler-Ansicht/Handouts/Druck-Exporte ausgeklammert                            | Vom Nutzer im Brainstorming bewusst abgewählt                                                                                  | ✓ Good — nie vermisst, Fokus blieb scharf |
| Mindmap bleibt entfernt                                                         | Bereits entschieden (Commit 7ef9bf5, 2026-05-24); nur Reste bereinigen                                                         | ✓ Good |
| Tests grün ist kein hartes Stabilisierungs-Kriterium                            | Nutzer definiert „sauber" als: Konsole fehlerfrei, Build aktuell, Lint/Typecheck grün — Tests laufen mit, sind aber nicht Gate | ✓ Good — Suite wuchs organisch auf 453 grüne Tests |
| Sequenzielle Executor auf `main` statt Worktrees (ab Phase 5)                   | Windows-Stdio-Hänger + geteilte Dateien (view-html, CSS, actions) in fast jedem Plan                                            | ✓ Good — 0 Merge-Konflikte, stabile Läufe |
| Human-UAT als eigener Gate nach jeder Phase                                      | Automatisierte Checks decken Hörbares/Visuelles/Browser-only nicht ab                                                          | ✓ Good — UAT fand 8+ echte Bugs, die alle Test-Suiten verpassten |

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

_Last updated: 2026-07-22 after v1.0 milestone (Stabilisierung & Ausbau shipped: 7 Phasen, 44 Pläne, 31/31 Requirements, UAT 20/20, alle VERIFICATIONs passed; Phase-5- und Phase-7-Validated-Blöcke nachgetragen)._
