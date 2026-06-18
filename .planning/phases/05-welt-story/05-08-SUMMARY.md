---
phase: 05-welt-story
plan: 08
subsystem: ui
tags: [modal, overlay, npc-generator, playwright, e2e, gap-closure]

# Dependency graph
requires:
  - phase: 05-welt-story
    provides: NPC-Generator (showNPCGeneratorModal) aus Plan 05-04; modal-overlay/showModal-API aus navigation.js
provides:
  - NPC-Generator-Modal als korrekte App-Standard-Struktur (modal-overlay > modal, Anzeige via showModal)
  - View-Switch-Cleanup-Hook in switchView (transientes #npc-generator-modal entfernen)
  - Funktionierende Schließ-Pfade (×, Abbrechen, Backdrop, Save) via echtem close-modal-overlay-Handler
  - 2 neue E2E-Fälle: Overlay-Positionierung + Tab-Wechsel-Entfernung
affects:
  - 05-HUMAN-UAT.md (Gap npc-generator-modal-overlay geschlossen)
  - features/npc-generator/npc-generator.js
  - systems/spellslots/navigation.js
  - tests/e2e/features/welt-story.spec.js

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Transiente Modals via insertAdjacentHTML: äußeres Element = .modal-overlay (position:fixed), innere Karte = .modal; Anzeige via window.showModal(); Schließ-Pfade: close-modal-overlay-Handler entfernt das Element aus dem DOM"
    - "View-Switch-Cleanup für transiente Body-Modals: eine Zeile am Anfang von switchView() entfernt ein offenes #element"

key-files:
  created: []
  modified:
    - features/npc-generator/npc-generator.js
    - systems/spellslots/navigation.js
    - tests/e2e/features/welt-story.spec.js

key-decisions:
  - "close-modal-overlay statt hide-modal: Modal ist transient (insertAdjacentHTML), kein persistentes DOM-Skelett — remove() ist korrekt, hide-modal würde nur die .show-Klasse entfernen und einen unsichtbaren Zombie hinterlassen"
  - "E2E Case B via page.evaluate(switchView) statt page.click([data-view]): Modal-Overlay ist position:fixed und interceptiert Pointer-Events auf die dahinterliegenden Tab-Buttons — switchView direkt aufrufen testet den Cleanup-Hook präzise"
  - "Kein neues Modul, keine loader.js/build.py-Änderung: reine Struktur-/Schließ-Pfad-Korrektur"

patterns-established:
  - "Transient-Modal-Pattern: insertAdjacentHTML → window.showModal(id) → close-modal-overlay-Handler; für alle zukünftigen nicht-persistenten Modals"

requirements-completed: [WELT-02]

# Metrics
duration: 15min
completed: 2026-06-18
---

# Phase 5 Plan 08: Gap-Closure npc-generator-modal-overlay Summary

**NPC-Generator-Modal von loser `class="modal"`-Karte am Seitenende auf App-Standard `modal-overlay > modal` umgestellt mit showModal-Anzeige, funktionierenden Schließ-Pfaden und View-Switch-Cleanup**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-18T09:15:00Z
- **Completed:** 2026-06-18T09:30:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- showNPCGeneratorModal injiziert nun `<div id="npc-generator-modal" class="modal-overlay">` als äußeres Element (kein inline `display:flex` mehr) und `<div class="modal npcg-modal-content">` als innere Karte — App-Standard-Zwei-Schicht-Struktur
- Nach der Injektion wird `window.showModal('npc-generator-modal')` aufgerufen → `.modal-overlay.show` setzt `display:flex; opacity:1; position:fixed` mit Backdrop und zentrierter Positionierung
- × und Abbrechen-Button verwenden jetzt `data-action="close-modal-overlay"` (den echten registrierten Handler) statt des toten `data-action="close-modal"`
- `switchView()` in `navigation.js` entfernt ein offenes transientes `#npc-generator-modal` beim View-Wechsel (eine Zeile, kein tab-registry.js-Eingriff)
- 2 neue E2E-Fälle: Overlay-Klasse + `position:fixed` (Case A), DOM-Entfernung nach Tab-Wechsel (Case B, count===0); alle 26 welt-story-E2E-Tests grün

## Task Commits

1. **Task 1: NPC-Generator-Modal auf modal-overlay > modal umstellen + showModal-Anzeige + View-Switch-Cleanup + E2E** - `4cb9a5b` (fix)

**Plan metadata:** *(folgt)*

## Files Created/Modified
- `features/npc-generator/npc-generator.js` — showNPCGeneratorModal: äußeres .modal-overlay, innere .modal.npcg-modal-content, window.showModal nach Injektion, close-modal-overlay-Handler für ×/Abbrechen
- `systems/spellslots/navigation.js` — switchView: Cleanup-Hook entfernt offenes #npc-generator-modal beim View-Wechsel
- `tests/e2e/features/welt-story.spec.js` — 2 neue E2E-Cases im WELT-02-describe-Block (Overlay-Positionierung + Tab-Wechsel-Entfernung)

## Decisions Made
- `close-modal-overlay` statt `hide-modal` für transiente Modals: Das Element wird via `insertAdjacentHTML` dynamisch erzeugt und beim nächsten Öffnen neu injiziert. `remove()` ist korrekt; `hide-modal` würde nur `.show` entfernen und ein unsichtbares Zombie-Element im DOM lassen.
- E2E Case B via `page.evaluate(() => window.switchView('party'))` statt `page.click('[data-view="party"]')`: Das Modal ist `position:fixed` und blockiert als Fullscreen-Overlay alle Pointer-Events auf darunterliegende Elemente. `switchView` direkt aufrufen testet den Cleanup-Hook exakt und ist die sauberste Lösung.
- Kein neues Modul, keine loader.js/build.py-Änderung: Reiner Struktur- und Schließ-Pfad-Fix.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] E2E Case B: `page.click('[data-view="party"]')` wegen Pointer-Interception geändert auf `page.evaluate(switchView)`**
- **Found during:** Task 1 (E2E-Ausführung)
- **Issue:** Das Modal-Overlay ist `position:fixed` und interceptierte alle Pointer-Events auf darunter liegende Tab-Buttons — `page.click('[data-view="party"]')` lief in einen Timeout
- **Fix:** `page.click(...)` durch `page.evaluate(() => window.switchView('party'))` ersetzt; testet den Cleanup-Hook direkt und präzise
- **Files modified:** `tests/e2e/features/welt-story.spec.js`
- **Verification:** 26/26 E2E-Tests grün
- **Committed in:** `4cb9a5b` (Teil des Task-1-Commits)

---

**Total deviations:** 1 auto-fixed (Rule 1 Bug)
**Impact on plan:** Notwendige Anpassung um den E2E-Test tatsächlich ausführbar zu machen. Kein Scope-Creep.

## Issues Encountered
Keine weiteren Probleme — Build exit 0, 421/421 Unit-Tests grün, alle 26 E2E-Tests grün beim ersten sauberen Lauf nach der Deviation-Fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- UAT-Gap `npc-generator-modal-overlay` aus 05-HUMAN-UAT.md ist geschlossen
- Phase 5 ist vollständig abgeschlossen (8/8 Pläne inkl. Gap-Closure)
- Phase 7 (Komfort & Analyse) kann geplant und ausgeführt werden

## Known Stubs
Keine — alle Funktionen (Re-Roll, Vor-Filter, Speichern) sind voll verdrahtet und durch bestehende E2E-Tests abgedeckt.

## Threat Flags
Keine neuen Trust-Boundary-Surfaces — reine Struktur-/Schließ-Pfad-Korrektur ohne neue Eingaben oder Datenflüsse.

## Self-Check: PASSED

- FOUND: features/npc-generator/npc-generator.js
- FOUND: systems/spellslots/navigation.js
- FOUND: tests/e2e/features/welt-story.spec.js
- FOUND: .planning/phases/05-welt-story/05-08-SUMMARY.md
- FOUND: commit 4cb9a5b (fix(05-08): NPC-Generator-Modal auf modal-overlay-Struktur umstellen + View-Switch-Cleanup)

---
*Phase: 05-welt-story*
*Completed: 2026-06-18*
