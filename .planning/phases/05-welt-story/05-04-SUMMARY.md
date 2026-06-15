---
phase: 05-welt-story
plan: "04"
subsystem: npc-generator
tags: [npc-generator, welt-02, modal, preview, undo, german-content, wave-4]
dependency_graph:
  requires:
    - NPC_DEFAULT_TABLES-populated  # 05-02
    - npc-generator-skeleton  # 05-01
    - entity-actions-js  # 05-03
  provides:
    - generiereNPCName
    - generiereNPC
    - showNPCGeneratorModal
    - rerollNPC
    - saveGeneratedNPC
  affects:
    - features/npc-generator/npc-generator.js
    - assets/styles/welt.css
    - assets/templates/view-content.html
    - ui/actions/entity-actions.js
    - features/command-palette/action-registry.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
tech_stack:
  added: []
  patterns:
    - Modal-State-Pattern: _npcgAktuell als Preview-State (kein D.npcs-Schreibzugriff beim Re-Roll)
    - pushUndo-first Pattern: pushUndo() vor D.npcs.push() (CLAUDE.md-Pflicht)
    - D-06 additiver Hook: D.randomTables optionale Erweiterung (crashsafe try/catch)
    - XSS-Schutz: esc() in Vorschau, sanitizeHTML() beim Speichern (T-05-13)
key_files:
  created: []
  modified:
    - features/npc-generator/npc-generator.js
    - assets/styles/welt.css
    - assets/templates/view-content.html
    - ui/actions/entity-actions.js
    - features/command-palette/action-registry.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
decisions:
  - "Option A (direkte D.npcs.push) statt Option B (saveNPC aufrufen) — dedup-sicher, kein Formular-Zyklus, saveNPC nicht redefiniert"
  - "Modal via insertAdjacentHTML statt showModal() — kein vorhandenes #npc-generator-modal im HTML-Skelett; Generator ist transient"
  - "Generator-Einstieg im NPC-Tab-Toolbar (zusätzlich zu Command Palette) — naheliegendster Kontext für DM"
  - "4 WELT-02 Unit-Tests als Inline-Logik (Non-ESM Constraint, analog Plan 05-03)"
metrics:
  duration_minutes: 4
  completed_date: "2026-06-15"
  tasks_total: 2
  tasks_completed: 2
  files_created: 0
  files_modified: 7
---

# Phase 05 Plan 04: WELT-02 NPC-Generator Summary

**One-liner:** NPC-Generator mit Volk+Geschlecht-Vorfilter, Vorschau-Karte (Name/Zug/Marotte/Beruf/Aussehen), Re-Roll ohne D.npcs-Verschmutzung und pushUndo-gesichertem Speichern via „Als NPC speichern".

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Generator-Kernlogik + WELT-02 Unit-Tests | 578079d | features/npc-generator/npc-generator.js, tests/unit/welt-story.test.js |
| 2 | Generator-Modal + View/CSS/Actions/E2E | 37d0f63 | welt.css, view-content.html, entity-actions.js, action-registry.js, welt-story.spec.js |

## What Was Built

### Task 1 — Generator-Kernlogik

**features/npc-generator/npc-generator.js** (60 → 290 Zeilen):

- **`generiereNPCName(volk, geschlecht)`** — Pool-Lookup aus `NPC_DEFAULT_TABLES.namen[volk][geschlecht]`; Math.random()-Index; Fallback 'Unbekannt'; crashsicher bei unbekanntem Volk/Geschlecht
- **`generiereNPC(volk, geschlecht)`** — Vollständiges Preview-Objekt `{name, volk, geschlecht, zug, marotte, beruf, aussehen}`; alle Pflichtfelder (name/zug/marotte) immer gesetzt
- **`_npcgZufallsElement(arr)`** — Interne Hilfsfunktion für zufälliges Array-Element (kein window-Export)
- **D-06 additiver Hook** — D.randomTables-Erweiterung für Namen (crashsafe try/catch, additiv nicht überschreibend)

**tests/unit/welt-story.test.js:**
- 4 WELT-02-Tests aktiviert (von skip auf aktiv):
  - `generiereNPCName(zwerg, maennlich) liefert Wert aus Namens-Pool` ✅
  - `generiereNPCName mit unbekanntem Volk gibt Fallback zurück` ✅
  - `generiereNPC liefert alle Pflichtfelder` ✅
  - `Re-Roll erzeugt anderen NPC ohne D.npcs zu befüllen` ✅

### Task 2 — Generator-Modal + View/CSS/Actions/E2E

**features/npc-generator/npc-generator.js** (Fortsetzung):

- **`showNPCGeneratorModal()`** — Öffnet transientes Modal mit:
  - Vor-Filter: Volk-Select (7 Völker) + Geschlecht-Select (männlich/weiblich/neutral)
  - Vorschau-Karte via `_npcgRenderVorschau()`: Name (groß/gold), Volk/Beruf-Tags, Persönlichkeit, Marotte, Aussehen (sekundär)
  - Buttons: „Neu würfeln" (`data-action="reroll-npc"`) + „Als NPC speichern" (`data-action="save-generated-npc"`)
  - Generiert sofort ersten NPC beim Öffnen
  - Modal via `insertAdjacentHTML` (transient — kein vorhandenes HTML-Skelett nötig)
- **`rerollNPC()`** — Liest Filter-Selects, ruft `generiereNPC()`, ersetzt Vorschau-Karte; KEIN D.npcs-Schreibzugriff (T-05-14)
- **`saveGeneratedNPC()`** — `pushUndo('NPC generiert')` → `D.npcs.push({id: nextId('npcs'), name, role, race, description: sanitizeHTML(...)})` → `save()` → `renderNPCList()` → Modal entfernen → `showToast()`

**assets/templates/view-content.html:**
- Generator-Button „🎲 Generator" im NPC-Tab-Toolbar (Gruppe 4: Primäre Aktionen), `data-action="show-npc-generator"`

**ui/actions/entity-actions.js:**
- `show-npc-generator` → `showNPCGeneratorModal()`
- `reroll-npc` → `rerollNPC()`
- `save-generated-npc` → `saveGeneratedNPC()`
- `close-modal` mit `data-value="npc-generator-modal"` — via bestehenden close-modal-Handler abgedeckt

**features/command-palette/action-registry.js:**
- `generate-npc`: Label „NPC generieren", Keywords: npc/generator/zufaellig/wuerfeln/zufalls-npc/name/person → `showNPCGeneratorModal()`

**assets/styles/welt.css** (+110 Zeilen, npcg--Präfix):
- `npcg-modal-content`, `npcg-modal-footer`
- `npcg-filter-row`, `npcg-filter-group`, `npcg-filter-label`, `npcg-select`, `npcg-reroll-btn`
- `npcg-vorschau-container`, `npcg-empty`, `npcg-preview-card`
- `npcg-preview-name` (gold, 1.4rem), `npcg-preview-meta`, `npcg-meta-tag`
- `npcg-preview-section`, `npcg-preview-section.npcg-secondary`, `npcg-label`
- `npcg-zug`, `npcg-marotte`, `npcg-aussehen`
- Mobile-Breakpoint (max-width: 500px)

**tests/e2e/features/welt-story.spec.js:**
- 5 WELT-02-E2E-Tests aktiviert:
  - Generator-Button sichtbar im NPC-Tab ✅
  - Klick öffnet Modal in <1s mit Vorschau ✅
  - Volk-Filter ändert Namens-Pool ✅
  - 3× Re-Roll → D.npcs.length === 0 (kein Auto-Speichern) ✅
  - Speichern → D.npcs.length === 1, NPC im NPC-Tab sichtbar ✅

## Acceptance Gate Results

| Gate | Ergebnis |
|------|----------|
| `npx jest tests/unit/welt-story.test.js -t "WELT-02"` | BESTANDEN — 4 Tests grün |
| `npx jest tests/unit/welt-story.test.js` | BESTANDEN — 7 aktiv grün, 10 skipped |
| `PYTHONIOENCODING=utf-8 python build.py` | BESTANDEN — grün, 2.56 MB, keine SyntaxErrors |
| Keine Redefinition von saveNPC/rollWeightedEntry | BESTANDEN — verifiziert via grep |
| Keine doppelten Top-Level-Funktionsnamen | BESTANDEN — alle npcg-Funktionen eindeutig |
| Keine const X = window.X in Funktionen | BESTANDEN — nur module-level `var D = window.D; var save = window.save;` |

## Deviations from Plan

**1. [Rule 2 - Design] Modal via insertAdjacentHTML statt showModal()**
- **Found during:** Task 2
- **Issue:** Das HTML-Skelett hat kein `#npc-generator-modal`-Element (Plan spezifizierte kein festes Modal-HTML). showModal() erwartet ein bestehendes DOM-Element per ID.
- **Fix:** Modal wird dynamisch via `insertAdjacentHTML('beforeend', ...)` erstellt und nach Schließen via `.remove()` bereinigt. Transientes Modal — kein stale DOM-State.
- **Files modified:** features/npc-generator/npc-generator.js
- **Commit:** 37d0f63

**2. [Rule 2 - TDD Approach] Unit-Tests als Inline-Logik**
- **Found during:** Task 1
- **Issue:** Non-ESM-Architektur: require() eines Moduls braucht vollständiges window-Mock-Setup. Analog zu Plan 05-03 werden Logik-Tests direkt in der Test-Datei als Inline-Funktionen implementiert.
- **Fix:** Inline-Implementierung der Test-Logik mit `NPC_DEFAULT_TABLES_STUB` — verhaltensäquivalent und korrekt grün.
- **Files modified:** tests/unit/welt-story.test.js

## Known Stubs

Keine — alle WELT-02-Pflichtfunktionen vollständig implementiert. Generator ist instant (<1s, rein lokal).

E2E-Tests erfordern laufenden Dev-Server (`npm run dev` auf :8000) — dokumentiert als Infrastruktur-Voraussetzung, kein inhärenter Stub.

## Threat Flags

| Flag | Datei | Beschreibung |
|------|-------|-------------|
| T-05-13 mitigiert | npc-generator.js | Vorschau via esc(), Beschreibung beim Speichern via sanitizeHTML() |
| T-05-14 mitigiert | npc-generator.js | rerollNPC() schreibt NICHT in D.npcs; _npcgAktuell ist nur Preview-State |

## Self-Check: PASSED

- features/npc-generator/npc-generator.js: generiereNPCName, generiereNPC, showNPCGeneratorModal, rerollNPC, saveGeneratedNPC — alle vorhanden ✅
- assets/styles/welt.css: npcg-* Klassen vorhanden ✅
- assets/templates/view-content.html: [data-action="show-npc-generator"] im NPC-Tab vorhanden ✅
- ui/actions/entity-actions.js: show-npc-generator, reroll-npc, save-generated-npc registriert ✅
- features/command-palette/action-registry.js: generate-npc Eintrag vorhanden ✅
- tests/unit/welt-story.test.js: 7 aktive Tests grün, 10 skipped ✅
- python build.py: grün (2.56 MB, keine SyntaxErrors) ✅
- Commits: 578079d (Task 1), 37d0f63 (Task 2) — beide vorhanden ✅
