---
phase: 01-stabilisierung
plan: "03"
subsystem: migration
tags: [version-migration, mindmap-cleanup, import-export, tdd, typescript]

# Dependency graph
requires:
  - phase: 01-01
    provides: debug.js Boot-Crash-Fix (clearMindmap-Referenz entfernt)

provides:
  - "Migration 2.6.1: leere mindmap-Seeds werden beim Laden still entfernt"
  - "Import-Pfad: Hinweis-Dialog + JSON-Backup (mindmap-backup-{name}.json) bei echten Mindmap-Inhalten"
  - "Neue Kampagnen: mindmap-frei (campaign-manager.js + import-export.js Seeds entfernt)"
  - "Mindmap-Typen entfernt (MindmapNode, MindmapConnection, Mindmap, mindmap-Property)"
  - "assets/styles-purged.css geloescht (D-13)"
  - "Test-Seeds bereinigt (tests/setup.js)"

affects:
  - "01-04 bis 01-07: typecheck-Baseline stabilisiert; kein mindmap-Key in neuen Kampagnen"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Red/Green fuer non-ESM via vm-Kontext: vm.createContext + vm.runInContext statt eval()"
    - "Promise-Dialog-Pattern: showMindmapExportDialog() loest Promise auf wenn Nutzer Fortfahren waehlt"
    - "Modul-intern: showMindmapExportDialog nicht in window exportiert (CLAUDE.md Export-Audit)"

key-files:
  created:
    - "tests/unit/migration.test.js"
  modified:
    - "systems/spellslots/version-migration.js"
    - "systems/spellslots/import-export.js"
    - "systems/campaign-manager/campaign-manager.js"
    - "types/globals.d.ts"
    - "types/entities.d.ts"
    - "tests/setup.js"
  deleted:
    - "assets/styles-purged.css"

key-decisions:
  - "vm.createContext statt eval() fuer non-ESM-Funktionen in Tests: eval() setzt Funktionen nicht zuverlaessig in global-Scope; vm-Kontext ist sauber isoliert"
  - "showMindmapExportDialog modul-intern (kein window-Export): wird nur von importDataGlobal() gerufen, kein anderes Modul braucht es"
  - "mindmap-Property in AppData interface optional gemacht via Entfernung (kein Optional-Marker benoetigt, da kein Code mehr darauf zugreift)"

patterns-established:
  - "Smart-Strip-Migration: delete data.mindmap nur wenn nodes.length === 0 && connections.length === 0"
  - "Dialog-VOR-Migration: Hinweis-Dialog im Import-Pfad VOR migrateData()-Aufruf sichert Nutzer-Inhalte"

requirements-completed: [STAB-02]

# Metrics
duration: 35min
completed: 2026-06-12
---

# Phase 01 Plan 03: Mindmap-Reste bereinigen Summary

**Migration 2.6.1 entfernt leere mindmap-Seeds still; Import-Pfad bietet JSON-Backup vor dem Verwerfen echter Mindmap-Inhalte; alle Mindmap-Typen und der verwaiste CSS-Output geloescht**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-12T08:00:00Z
- **Completed:** 2026-06-12T08:35:00Z
- **Tasks:** 3 (+ TDD RED/GREEN-Commits)
- **Files modified:** 6 modified, 1 created, 1 deleted

## Accomplishments

- Migration 2.6.1 in version-migration.js: entfernt leere mindmap-Seeds still beim Laden; echte Inhalte bleiben unveraendert (Import-Dialog ist zustaendig)
- Import-Pfad in importDataGlobal(): reader.onload async gemacht; Mindmap-Inhalts-Check VOR Meta-Feld-Loeschung; showMindmapExportDialog() bietet JSON-Backup (D-10) mit eigenem Dateinamen mindmap-backup-{name}.json
- Beide mindmap-Seeds entfernt: campaign-manager.js (beide Seed-Templates) + import-export.js (neue-Kampagne-Zweig)
- Mindmap-Typdeklarationen entfernt: MindmapNode, MindmapConnection, Mindmap-Interfaces + mindmap-Property aus AppData
- assets/styles-purged.css geloescht (D-13); tests/setup.js global.D und resetTestState() bereinigt
- 228/228 Unit-Tests gruen; npm run typecheck: Exit-Code 0

## Task Commits

TDD-Ablauf mit separaten RED/GREEN-Commits:

1. **RED Test: migration.test.js** - `a7b4237` (test)
2. **Task 1 GREEN: Smart-Strip-Migration 2.6.1 + Seeds entfernen** - `99ede5c` (feat)
3. **Task 2: Import-Pfad Hinweis-Dialog + JSON-Export** - `3246573` (feat)
4. **Task 3: Tote Reste entfernen** - `3ad5c70` (chore)

## Files Created/Modified

- `tests/unit/migration.test.js` - Neue Migrationstests mit vm-Kontext-Ansatz (3 Tests: leerer Strip, echter Inhalt erhalten, kein Seed in Template)
- `systems/spellslots/version-migration.js` - Migration 2.6.1 nach '2.4.0' eingetragen
- `systems/spellslots/import-export.js` - reader.onload async; showMindmapExportDialog() hinzugefuegt; Mindmap-Check + Seeds entfernt
- `systems/campaign-manager/campaign-manager.js` - Beide mindmap-Seeds entfernt (Zeilen 35 und 111)
- `types/globals.d.ts` - renderMindmap() und MINDMAP FUNCTIONS-Abschnitt entfernt
- `types/entities.d.ts` - MindmapNode, MindmapConnection, Mindmap-Interfaces und mindmap-Property entfernt
- `tests/setup.js` - mindmap-Seeds aus global.D und resetTestState() entfernt
- `assets/styles-purged.css` - geloescht (D-13)

## Decisions Made

- **vm-Kontext statt eval() fuer Tests**: eval() in beforeAll() setzt Funktionen nicht in den Jest-Global-Scope. vm.createContext() erstellt einen sauberen, isolierten Kontext, aus dem Funktionen direkt extrahiert werden koennen.
- **showMindmapExportDialog modul-intern**: Funktion wird nur von importDataGlobal() benoetigt. Kein window-Export entspricht CLAUDE.md Export-Audit-Regel.
- **reader.onload async**: Notwendig fuer await showMindmapExportDialog() — kein anderes Vorgehen moglich ohne den Dialog-Flow zu brechen.

## Deviations from Plan

Keine — Plan exakt umgesetzt. Die vm-Kontext-Loesung fuer Tests war eine Implementierungsdetail-Entscheidung innerhalb der im Plan beschriebenen Freiheit ("falls die Funktion nicht isoliert lauffaehig ist").

## Issues Encountered

- **eval() setzt Funktionen nicht in Jest-Global-Scope**: Erster Ansatz mit eval() in beforeAll() liess migrateData() nach dem RED-Commit fuer Tests 2 und 3 undefiniert. Loesung: vm.createContext + vm.runInContext.

## Known Stubs

Keine — alle implementierten Funktionen sind vollstaendig verdrahtet.

## Threat Flags

Keine neuen Bedrohungsflächen — alle T-03-* aus dem Plan-Threat-Register mitgedacht:
- T-03-01 (XSS): esc() fuer nodeCount und connCount in showMindmapExportDialog() mitigiert
- T-03-02 (Download): JSON.stringify ohne HTML-Kontext; akzeptiert
- T-03-03 (stiller Verlust): D-09-Dialog bietet Export VOR delete imp.mindmap; mitigiert

## Next Phase Readiness

- Mindmap-Reste vollstaendig bereinigt (STAB-02 abgeschlossen)
- Typecheck-Baseline sauber: 0 Fehler nach Entfernung der toten Typen
- 228/228 Unit-Tests gruen
- Bereit fuer Plan 04 (Persistenz-Fix >5MB) und parallele Plans in Wave 2

## Self-Check: PASSED

- All 8 expected files present (including SUMMARY.md)
- styles-purged.css confirmed deleted
- All 4 task commits verified: a7b4237, 99ede5c, 3246573, 3ad5c70
- 228/228 unit tests green
- npm run typecheck: Exit-Code 0

---
*Phase: 01-stabilisierung*
*Completed: 2026-06-12*
