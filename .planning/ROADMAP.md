# Roadmap: D&D Kampagnen-Tracker Pro — Stabilisierung & Ausbau

**Milestone:** Stabilisierung & Ausbau
**Granularity:** standard
**Phases:** 7
**Requirements:** 31 v1 — alle gemappt

---

## Phases

- [x] **Phase 1: Stabilisierung** — App startet, Daten sind sicher, CI erkennt Crashes, Doku ist aktuell
- [x] **Phase 2: Technik-Fundament** — Installierbare PWA, Datei-Backup, Command Palette (completed 2026-06-12)
- [ ] **Phase 3: Bestiary** — SRD-Monster-Kompendium offline + eigene Kreaturen + Encounter-Import
- [ ] **Phase 4: Initiative-Erweiterungen** — Statblock-Popup, Legendäre Aktionen & Resistenzen, Mob-Modus
- [ ] **Phase 5: Welt & Story** — Session-Prep, NPC-Generator, Timeline, Reise-Simulator, Fraktionen
- [ ] **Phase 6: Spieler-Verwaltung** — XP/Milestone-Tracker, Inspiration, Erweiterte Charakterwerte
- [ ] **Phase 7: Komfort & Analyse** — Soundboard, Würfel-Statistiken

---

## Phase Details

### Phase 1: Stabilisierung

**Goal**: Die App läuft zuverlässig — kein Boot-Crash, keine stillen Datenverluste, CI erkennt künftige Brüche, Doku und Build-Pipeline spiegeln den echten Code-Stand
**Depends on**: Nothing (first phase)
**Requirements**: STAB-01, STAB-02, STAB-03, STAB-04, STAB-05, STAB-06, STAB-07, STAB-08, STAB-09, STAB-10, STAB-11
**Success Criteria** (what must be TRUE):

1. Nutzer öffnet die gebaute HTML per Doppelklick (`file://`) und die App lädt vollständig ohne Fehlermeldung in der Browser-Konsole — in allen Tabs
2. Nutzer speichert eine Kampagne mit mehr als 5 MB Daten, schließt den Browser, öffnet die App erneut — alle Daten sind vollständig vorhanden
3. Nutzer exportiert Kampagnendaten, importiert sie direkt wieder — keine Migrationen werden übersprungen, alle Felder sind korrekt
4. `npm run check` (ESLint + TypeScript + Prettier) läuft durch ohne Fehler; CI-Pipeline ist grün und ein Playwright-Smoke-Test bestätigt erfolgreiche App-Initialisierung gegen den dist-Build
5. Alle veralteten Dateien (main.js, tsconfig.json.backup, Mindmap-Reste) sind entfernt; CLAUDE.md, README und package.json-Lizenz sind konsistent mit dem tatsächlichen Code-Stand
   **Plans**: 9 plans (5 Wellen — inkl. 2 Gap-Closure-Pläne aus der Verifikation)

- [x] 01-01-PLAN.md — Boot-Crash-Fix (debug.js) + Smoke-Test-Harness (STAB-01, STAB-08)
- [x] 01-02-PLAN.md — Persistenz-Stabilität: >5MB Stale-Shadow-Fix + Export-Versionsstempel (STAB-05, STAB-06)
- [x] 01-03-PLAN.md — Mindmap-Reste bereinigen: Smart-Strip-Migration + tote Dateien/Typen (STAB-02)
- [x] 01-04-PLAN.md — Build-Pipeline härten: Pre-Build-Duplikat-Check, DEBUG_MODE-Assertion, Modullisten-Sync (STAB-07)
- [x] 01-05-PLAN.md — Repo-Hygiene & Config: Lizenz MIT, Version 2.6.1, python3->python, validate.py, tote Dateien (STAB-09, STAB-06)
- [x] 01-06-PLAN.md — CI-Smoke-Integration & Quality-Gate: npm run check, frische Builds (STAB-08, STAB-04, STAB-03)
- [x] 01-07-PLAN.md — Doku- & Lizenz-Audit: CLAUDE.md/README/bugfixes Faktenkorrektur, SRD-Attribution (STAB-10, STAB-11)
- [x] 01-08-PLAN.md — Gap-Closure: CR-01 Endlosrekursion in resolveStorageConflict beheben + echte vm-Regressionstests (STAB-05)
- [x] 01-09-PLAN.md — Gap-Closure: npm run check grün — ESLint-Errors/Config + Prettier-Massenformatierung mit Build-Re-Verifikation (STAB-04)

### Phase 2: Technik-Fundament

**Goal**: Die App ist als PWA installierbar, schreibt automatische Datei-Backups auf die Festplatte und bietet eine Command Palette für schnelle Aktionen
**Depends on**: Phase 1
**Requirements**: TECH-01, TECH-02, TECH-03, TECH-04
**Success Criteria** (what must be TRUE):

1. Nutzer öffnet die PWA-URL in Chrome, sieht den „App installieren"-Dialog, installiert die App und startet sie über das Desktop-Icon — die App startet offline ohne Browser-Chrome
2. Nutzer wechselt erstmalig von `file://` zur installierten PWA und ein Migrations-Assistent überträgt alle bestehenden Kampagnendaten ohne Datenverlust
3. Nutzer aktiviert automatische Datei-Backups, wählt einen Ordner, und nach jedem Speichern liegt eine aktualisierte `.json`-Datei in diesem Ordner (im `file://`-Modus: manueller Download-Fallback ist sichtbar)
4. Nutzer drückt die Command-Palette-Taste, tippt „Neuer NPC", wählt den Eintrag — die NPC-Erstellen-Ansicht öffnet sich; Fuzzy-Suche findet auch Aktionen wie „Würfle 8d6"
   **Plans**: 5 plans (2 Wellen)
   **UI hint**: yes

Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Integrations-Rückgrat & Wave-0-Test-Gerüst: Modul-/CSS-Registrierung, init.js-Verdrahtung, SW-Update-Erkennung (TECH-01–04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — PWA-Deploy: Service Worker + manifest.webmanifest + Font-Bundle + d20-Icon + Install-Button + GitHub-Pages-CI (TECH-01)
- [x] 02-03-PLAN.md — Datenmigration: Voll-Export-Format + PWA-Erststart-Wizard + file://-Umzugs-Flow + Divergenz-Banner (TECH-02)
- [x] 02-04-PLAN.md — Datei-Backup: File System Access API, atomares Schreiben, Snapshots/Pruning, Restore-Browser, Status + file://-Fallback (TECH-03)
- [x] 02-05-PLAN.md — Command Palette: Aktions-Registry + Fuzzy-Suche (fuzzyMatch-Wiederverwendung) + Strg+Shift+K-Overlay (TECH-04)

### Phase 3: Bestiary

**Goal**: Nutzer kann SRD-Monster offline nachschlagen, eigene Kreaturen verwalten und Monster direkt in Encounter und Initiative übernehmen
**Depends on**: Phase 1
**Requirements**: BEST-01, BEST-02, BEST-03
**Success Criteria** (what must be TRUE):

1. Nutzer öffnet den Bestiary-Tab, sucht „Goblin", filtert nach CR und Typ — Ergebnisse erscheinen sofort ohne Netzwerkverbindung
2. Nutzer legt eine eigene Kreatur an, bearbeitet ihre Stats und löscht sie wieder — alle CRUD-Operationen sind mit Undo rückgängig machbar
3. Nutzer wählt im Bestiary ein Monster, klickt „Zu Encounter hinzufügen" — das Monster erscheint im gewählten Encounter mit korrekten HP/AC-Werten; „Zur Initiative" fügt es direkt als Kombattant hinzu
   **Plans**: 5 plans (4 Wellen)
   **UI hint**: yes

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Fundament: D-Schema + Migration 3.0.0, Tab-/Modul-/CSS-/Template-Registrierung (build.py+loader.js), 5 Modul-Stubs, Wave-0-Tests (BEST-01/02/03)

**Wave 2** *(blocked on Wave 1)*

- [ ] 03-02-PLAN.md — SRD-Datenspeicher: ~150 deutsche SRD-5.1-Statblocks inline in core/srd-monsters.js + monster-templates.js-Alias (BEST-01)
- [ ] 03-03-PLAN.md — Bestiary-Tab: Liste+Detail, Suche/Filter, 5e-Pergament-Statblock mit Klick-Würfen, Badges/Favoriten (BEST-01)

**Wave 3** *(blocked on Wave 2)*

- [ ] 03-04-PLAN.md — Eigene Kreaturen: voller bst-*-Editor + CRUD mit Undo + Portrait (BEST-02)

**Wave 4** *(blocked on Wave 3 — teilt sich die E2E-Spec mit 03-04)*

- [ ] 03-05-PLAN.md — Übernahme: Mengen-Dialog→Initiative (Auto-Wurf/HP-Variation/Nummerierung/statblockRef), Zu Encounter, Favoriten, Klick-Würfel-Handler (BEST-03)

### Phase 4: Initiative-Erweiterungen

**Goal**: Nutzer hat in der Initiative direkten Zugriff auf vollständige Statblocks, kann Legendäre Aktionen und Resistenzen pro Runde zählen und Gegnergruppen als Mob führen
**Depends on**: Phase 3
**Requirements**: INIT-01, INIT-02, INIT-03
**Success Criteria** (what must be TRUE):

1. Nutzer klickt auf einen Kombattanten in der Initiative — ein Popup zeigt den vollständigen Statblock (Aktionen, Traits, Saves, Senses) des verknüpften Monsters aus dem Bestiary
2. Nutzer führt einen Boss-Kampf durch — Legendäre Aktionen und Legendäre Resistenzen sind als klickbare Zähler sichtbar und setzen sich am Rundenanfang (Initiative 20) automatisch zurück
3. Nutzer fügt zehn Goblins als Mob zur Initiative hinzu — sie erscheinen als eine Zeile mit Pool-HP und einem kombinierten Angriffswurf; beim Erreichen von 0 Pool-HP ist der Mob besiegt
   **Plans**: TBD
   **UI hint**: yes

### Phase 5: Welt & Story

**Goal**: Nutzer kann Sessions strukturiert vorbereiten, NPCs auf Knopfdruck generieren, Kampagnenereignisse chronologisch festhalten, Reisen simulieren und Fraktionen mit Ruf-Tracking verwalten
**Depends on**: Phase 1
**Requirements**: WELT-01, WELT-02, WELT-03, WELT-04, WELT-05
**Success Criteria** (what must be TRUE):

1. Nutzer öffnet Session-Prep für die nächste Session, legt Szenenkarten mit Strong-Start und geplanten Szenen an, sieht offene Fäden der letzten Session — alles auf einem Blick ohne Hin- und Herspringen in anderen Tabs
2. Nutzer klickt „NPC generieren" — in unter einer Sekunde erscheint ein NPC mit deutschem Namen, Persönlichkeitszug und Marotte; der NPC kann sofort gespeichert werden
3. Nutzer hält Kampagnenereignisse in der Timeline fest und verknüpft sie mit Kalender-Daten — Ereignisse erscheinen in chronologischer Reihenfolge
4. Nutzer startet eine Reise, wählt Gelände und Tempo — die App berechnet Tagesmärsche, würfelt Zufallsbegegnungen aus den passenden Tabellen und zeigt das Wetter an
5. Nutzer legt eine Fraktion an, vergibt einen Rufwert für die Gruppe und kann ihn nach jeder Session anpassen — alle Fraktionen sind in einer Übersicht mit aktuellem Rufstand sichtbar
   **Plans**: TBD
   **UI hint**: yes

### Phase 6: Spieler-Verwaltung

**Goal**: Nutzer kann XP und Milestones der Gruppe tracken, Inspiration vergeben und detaillierte Charakterwerte für schnelle Checks am Tisch pflegen
**Depends on**: Phase 1
**Requirements**: CHAR-01, CHAR-02, CHAR-03
**Success Criteria** (what must be TRUE):

1. Nutzer schließt einen Encounter ab und übernimmt die verdienten XP auf Knopfdruck auf alle aktiven Charaktere; ein Levelaufstieg-Hinweis erscheint, wenn ein Charakter die XP-Schwelle erreicht
2. Nutzer vergibt Inspiration an einen Spieler per Klick — der Inspiration-Marker ist in der Party-Übersicht sofort sichtbar und kann mit einem weiteren Klick wieder entfernt werden
3. Nutzer öffnet den Charakterbogen, sieht Skill-Proficiencies, Saving Throws und Angriffe auf einen Blick — ein Skill-Check für Stealth liefert sofort den korrekten Würfelwurf mit Proficiency-Bonus
   **Plans**: TBD
   **UI hint**: yes

### Phase 7: Komfort & Analyse

**Goal**: Nutzer kann lokale Audio-Dateien als Soundboard für Ambience nutzen und Würfel-Statistiken aus der Roll-Historie einsehen
**Depends on**: Phase 1
**Requirements**: UX-01, UX-02
**Success Criteria** (what must be TRUE):

1. Nutzer lädt lokale Audio-Dateien in das Soundboard, erstellt Ambience-Szenen und wechselt per Schnelltaste zwischen Szenen — Lautstärke ist pro Szene regelbar und läuft ohne Netzwerkverbindung (im `file://`-Modus: Dateien werden pro Session neu ausgewählt)
2. Nutzer öffnet die Würfel-Statistiken, sieht ein Histogramm aller gewürfelten d20-Ergebnisse aus der aktuellen Session und vergleicht seine Trefferquote mit der Erwartungsverteilung — Crit-Quote ist explizit ausgewiesen
   **Plans**: TBD

---

## Progress

| Phase                       | Plans Complete | Status      | Completed |
| --------------------------- | -------------- | ----------- | --------- |
| 1. Stabilisierung           | 9/9            | Complete    | 2026-06-12 |
| 2. Technik-Fundament        | 5/5 | Complete    | 2026-06-12 |
| 3. Bestiary                 | 1/5 | In Progress|  |
| 4. Initiative-Erweiterungen | 0/?            | Not started | -         |
| 5. Welt & Story             | 0/?            | Not started | -         |
| 6. Spieler-Verwaltung       | 0/?            | Not started | -         |
| 7. Komfort & Analyse        | 0/?            | Not started | -         |

---

## Coverage

| Requirement | Phase | Description                             |
| ----------- | ----- | --------------------------------------- |
| STAB-01     | 1     | Boot-Crash behoben                      |
| STAB-02     | 1     | Mindmap-Reste bereinigt                 |
| STAB-03     | 1     | Frische Builds, Konsole fehlerfrei      |
| STAB-04     | 1     | npm run check grün                      |
| STAB-05     | 1     | 5MB Stale-Shadow-Bug behoben            |
| STAB-06     | 1     | Export-Versionsstempel + Migrations-Fix |
| STAB-07     | 1     | build.py gehärtet                       |
| STAB-08     | 1     | CI Playwright-Smoke-Test                |
| STAB-09     | 1     | Tote Dateien entfernt                   |
| STAB-10     | 1     | Doku aktualisiert, Lizenz korrigiert    |
| STAB-11     | 1     | SRD-Spell-Lizenz-Audit                  |
| TECH-01     | 2     | PWA-Installation                        |
| TECH-02     | 2     | file://-Migrations-Assistent            |
| TECH-03     | 2     | Datei-Backup-Sync                       |
| TECH-04     | 2     | Command Palette                         |
| BEST-01     | 3     | SRD-Monster-Suche + Filter              |
| BEST-02     | 3     | Eigene Kreaturen CRUD                   |
| BEST-03     | 3     | Monster zu Encounter/Initiative         |
| INIT-01     | 4     | Statblock-Popup                         |
| INIT-02     | 4     | Legendäre Aktionen & Resistenzen        |
| INIT-03     | 4     | Mob-Modus                               |
| WELT-01     | 5     | Session-Prep-Assistent                  |
| WELT-02     | 5     | NPC-Generator                           |
| WELT-03     | 5     | Kampagnen-Timeline                      |
| WELT-04     | 5     | Reise-Simulator                         |
| WELT-05     | 5     | Fraktionen & Ruf                        |
| CHAR-01     | 6     | XP/Milestone-Tracker                    |
| CHAR-02     | 6     | Inspiration-Tracker                     |
| CHAR-03     | 6     | Erweiterte Charakterwerte               |
| UX-01       | 7     | Soundboard                              |
| UX-02       | 7     | Würfel-Statistiken                      |

**Total mapped: 31/31** ✓

---

_Roadmap created: 2026-06-11_
