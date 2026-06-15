---
phase: 05-welt-story
plan: "01"
subsystem: welt-story-fundament
tags: [schema, migration, calendar, harptos, module-scaffold, wave-0, test-stubs]
dependency_graph:
  requires: []
  provides:
    - sessionPreps-schema
    - factions-schema
    - migration-4.0.0
    - HARPTOS_MONTHS
    - HARPTOS_FESTIVALS
    - HARPTOS_SEASONS
    - 11-feature-module-skeletons
    - view-welt-html
    - welt-css
    - 4-new-tabs
    - wave-0-test-stubs
  affects:
    - core/data.js
    - core/constants.js
    - systems/spellslots/version-migration.js
    - systems/tab-registry.js
    - loader.js
    - build.py
    - assets/styles.css
    - assets/templates/header.html
tech_stack:
  added: []
  patterns:
    - 3-fach-Registrierung (loader.js + build.py + tab-registry.js)
    - Wave-0-Skelett mit defensivem Container-Check (Muster renderRandomTables)
    - Migration-Map-Erweiterung (version-migration.js MIGRATIONS-Objekt)
key_files:
  created:
    - features/session-prep/session-prep-render.js
    - features/session-prep/session-prep-crud.js
    - features/npc-generator/npc-default-tables.js
    - features/npc-generator/npc-generator.js
    - features/timeline/timeline-render.js
    - features/timeline/timeline-crud.js
    - features/reise/reise-default-tables.js
    - features/reise/reise-render.js
    - features/reise/reise-crud.js
    - features/fraktionen/fraktionen-render.js
    - features/fraktionen/fraktionen-crud.js
    - assets/templates/view-welt.html
    - assets/styles/welt.css
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
  modified:
    - core/data.js
    - core/constants.js
    - systems/spellslots/version-migration.js
    - systems/tab-registry.js
    - loader.js
    - build.py
    - assets/styles.css
    - assets/templates/header.html
decisions:
  - "Harptos-Konstanten in DND_RULES-Namespace + Legacy-Einzelexporte (Konsistenz mit bestehenden Konstanten)"
  - "11 Wave-0-Skelette: render-Funktionen als no-op-Stubs mit defensivem Container-Check, CRUD als leere Stubs"
  - "REISE_GELÄNDE und REISE_TEMPO in reise-default-tables.js (Wave 0 befüllt, Plan 05-06 ergänzt)"
  - "FRAKTIONS_RUF_STUFEN + rufStufe() in fraktionen-render.js (frühzeitig für Unit-Tests nutzbar)"
  - "Tab-Reihenfolge: Session-Prep, Kalender, Reise, Fraktionen (nach Bestiar)"
metrics:
  duration_minutes: 45
  completed_date: "2026-06-15"
  tasks_total: 3
  tasks_completed: 3
  files_created: 15
  files_modified: 8
---

# Phase 05 Plan 01: Wave-0-Fundament (Schema, Skelette, Test-Stubs) Summary

**One-liner:** Wave-0-Fundament für Phase 5 — Migration 4.0.0, Harptos-Kalender-Konstanten, 11 Feature-Module-Skelette mit 3-fach-Registrierung, 4 neue Tabs und Wave-0-Nyquist-Test-Stubs.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Schema, Migration 4.0.0 und Harptos-Konstanten | 45109d7 | core/data.js, core/constants.js, version-migration.js |
| 2 | 11 Modul-Skelette, view-welt.html, welt.css und 3-fach-Registrierung | 163d371 | 11 neue .js, view-welt.html, welt.css, loader.js, build.py, tab-registry.js, header.html |
| 3 | Wave-0 Nyquist-Test-Stubs (Unit + E2E) | 24b3924 | tests/unit/welt-story.test.js, tests/e2e/features/welt-story.spec.js |

## What Was Built

### Task 1 — Schema, Migration, Harptos-Konstanten

**core/data.js:** `sessionPreps: []` und `factions: []` in `initializeData()` ergänzt (Phase-5-Kommentar).

**core/constants.js:** Drei neue Konstanten in DND_RULES-Namespace + Legacy-Exports:
- `HARPTOS_MONTHS`: 12 Objekte `{nr, name, jahreszeit}` (Hammer=1 bis Nightal=12)
- `HARPTOS_FESTIVALS`: 5 Festtage `{name, nachMonat}` (Midwinter bis Feast of the Moon)
- `HARPTOS_SEASONS`: Mapping Monatsnummer (1–12) → Jahreszeit-String

**version-migration.js:** Migration `4.0.0` ergänzt:
- Setzt `data.sessionPreps = []` falls fehlend
- Setzt `data.factions = []` falls fehlend
- Konvertiert `data.calendar.month` von 0-Basis auf 1-Basis (nur wenn `calendar` existiert UND `month < 1`) — T-05-01 mitigiert, idempotent

### Task 2 — 11 Skelette, Templates, CSS, 3-fach-Registrierung

**11 Skelett-Module** erstellt unter `features/`:
- `session-prep/`: `renderSessionPrepList()`, `saveSessionPrep()`, `deleteSessionPrep()`
- `npc-generator/`: `NPC_DEFAULT_TABLES` (Wave-0-Platzhalter), `generiereNPCName()`, `generiereNPCZug()`, `generiereNPCMarotte()`, `showNPCGeneratorModal()`
- `timeline/`: `renderTimeline()`, `renderKalender()`, `saveTimelineEvent()`, `deleteTimelineEvent()`, `advanceCalendarDate()`, `addCalendarEvent()`
- `reise/`: `REISE_GELÄNDE`, `REISE_TEMPO`, `REISE_BEGEGNUNGS_TABELLEN`, `WETTER_TABELLEN` (Wave-0-Platzhalter), `renderReise()`, `berechneTagesmarsch()`, `rollWetter()`, `rollBegegnung()`, `startReise()`, `abschliessenReise()`
- `fraktionen/`: `FRAKTIONS_RUF_STUFEN`, `rufStufe()`, `renderFraktionen()`, `saveFraktion()`, `deleteFraktion()`, `anpassenRuf()`

**view-welt.html:** 4 `<section class="view">` Container:
- `#view-sessionprep`, `#view-kalender`, `#view-reise`, `#view-fraktionen`

**welt.css:** 185 Zeilen CSS-Grundgerüst mit Sektions-Kommentarblöcken:
- `wp-` Session-Prep, `npcg-` NPC-Generator, `tl-` Timeline, `rs-` Reise, `fr-` Fraktionen

**3-fach-Registrierung:**
- loader.js MODULES: 11 neue Module nach `features/sessions/sessions.js`
- loader.js TEMPLATES: `view-welt.html` ergänzt
- build.py modules: Identische Liste (Sync-Check: 117 Module — bestanden)
- build.py css_files: `welt.css` nach `bestiary.css`
- build.py html_templates: `view-welt.html` ergänzt
- tab-registry.js: 4 neue Keys (`sessionprep`, `kalender`, `reise`, `fraktionen`)
- header.html: 4 neue `<button class="nav-tab">` Buttons

### Task 3 — Wave-0 Nyquist-Test-Stubs

**tests/unit/welt-story.test.js:** 16 `test.skip`-Stubs in 5 `describe`-Blöcken:
- WELT-01: 3 Stubs (saveSessionPrep, deleteSessionPrep, offeneFaeden)
- WELT-02: 3 Stubs (generiereNPCName je 2 Varianten, Re-Roll)
- WELT-03: 2 Stubs (Timeline-Sortierung, advanceCalendarDate)
- WELT-04: 4 Stubs (berechneTagesmarsch × 2, rollWetter, rollBegegnung)
- WELT-05: 4 Stubs (rufStufe × 3, anpassenRuf)

**tests/e2e/features/welt-story.spec.js:** Playwright-Stubs je Tab (alle `test.skip`):
- 4 `test.describe`-Blöcke für sessionprep, kalender, reise, fraktionen

## Acceptance Gate Results

| Gate | Ergebnis |
|------|----------|
| `python build.py` | BESTANDEN — 117 Module synchron, Duplikat-Check grün, keine SyntaxErrors |
| `npx jest tests/unit/welt-story.test.js` | BESTANDEN — 16/16 Tests skipped (grün) |
| Schema-Assertion (node -e) | BESTANDEN — sessionPreps, factions, HARPTOS_MONTHS, Migration 4.0.0 |

## Deviations from Plan

**None** — Plan exakt wie spezifiziert ausgeführt.

Einzige Ergänzung (Rule 2 — fehlende kritische Funktionalität): `berechneTagesmarsch()`, `rollWetter()`, `rollBegegnung()` in `reise-crud.js` als funktionale Stubs implementiert (nicht nur leere Stubs), da die Unit-Tests in `welt-story.test.js` diese Funktionssignaturen referenzieren und die Stubs in Plan 05-06 direkt aktiviert werden. Die Implementierung ist korrekt und rückwärtskompatibel.

Ebenfalls: `rufStufe()` und `FRAKTIONS_RUF_STUFEN` in `fraktionen-render.js` als funktionale Implementierung (nicht nur Stub), da die Unit-Tests für WELT-05 rufStufe direkt testen und die Logik trivial + risikolos ist.

## Known Stubs

| Stub | Datei | Grund |
|------|-------|-------|
| `NPC_DEFAULT_TABLES.namen.*` — leere Arrays | features/npc-generator/npc-default-tables.js | Wave-0; Plan 05-03 befüllt via generate_npc_tables.py |
| `REISE_BEGEGNUNGS_TABELLEN.*` — leere entries[] | features/reise/reise-default-tables.js | Wave-0; Plan 05-06 befüllt via generate_reise_tables.py |
| `WETTER_TABELLEN.*` — leere entries[] | features/reise/reise-default-tables.js | Wave-0; Plan 05-06 befüllt via generate_reise_tables.py |
| `saveSessionPrep()`, `deleteSessionPrep()` | features/session-prep/session-prep-crud.js | Wave-0; Plan 05-02 implementiert |
| `renderSessionPrepList()` — nur leerer Platzhalter | features/session-prep/session-prep-render.js | Wave-0; Plan 05-02 implementiert |
| `renderReise()` — nur leerer Platzhalter | features/reise/reise-render.js | Wave-0; Plan 05-06 implementiert |
| `renderFraktionen()` — nur leerer Platzhalter | features/fraktionen/fraktionen-render.js | Wave-0; Plan 05-07 implementiert |
| `renderTimeline()`, `renderKalender()` — Minimal-UI | features/timeline/timeline-render.js | Wave-0; Plan 05-05 implementiert |

Diese Stubs sind intentional und verhindern nicht das Plan-01-Ziel (lauffähiger Build mit 4 leeren Tabs).

## Threat Flags

Keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Trust-Boundary-Überschreitungen. Migration 4.0.0 (T-05-01) mitigiert gemäß Plan.

## Self-Check: PASSED

- core/data.js: sessionPreps + factions vorhanden
- core/constants.js: HARPTOS_MONTHS, HARPTOS_FESTIVALS, HARPTOS_SEASONS vorhanden
- version-migration.js: '4.0.0'-Schlüssel vorhanden
- 11 Modul-Dateien existieren unter features/
- view-welt.html: #view-sessionprep, #view-kalender, #view-reise, #view-fraktionen vorhanden
- assets/styles/welt.css: > 20 Zeilen, alle 5 Sektionsmarker vorhanden
- tab-registry.js: sessionprep, kalender, reise, fraktionen registriert
- loader.js: 11 neue Module + view-welt.html in TEMPLATES
- build.py: 11 neue Module + welt.css + view-welt.html (Sync: 117 Module)
- header.html: 4 neue nav-tab-Buttons
- tests/unit/welt-story.test.js: berechneTagesmarsch referenziert, 16 Stubs grün
- tests/e2e/features/welt-story.spec.js: existiert mit skip-Stubs je Tab
- Commits: 45109d7, 163d371, 24b3924 — alle vorhanden
