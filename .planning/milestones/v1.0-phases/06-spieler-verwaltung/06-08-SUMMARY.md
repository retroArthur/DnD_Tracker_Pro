---
phase: 06-spieler-verwaltung
plan: "08"
subsystem: party-ui / event-log
tags: [gap-closure, ux, z-index, toast, roll-feedback, CHAR-03]
dependency_graph:
  requires: [06-03, 06-06]
  provides: [roll-feedback-toast-over-modal]
  affects: [party-detail-modal, event-log, entity-actions]
tech_stack:
  added: []
  patterns: [module-internal-helper, z-index-stacking-fix]
key_files:
  created: []
  modified:
    - assets/styles/party.css
    - ui/actions/entity-actions.js
    - tests/e2e/features/character-advancement.spec.js
decisions:
  - "_charRollToast modul-intern (kein neuer Global) — 4x-Duplikation vermieden ohne Export-Pollution"
  - "z-index 1200 für .event-log — über .modal-overlay (1100), unter App-Top-Overlays (9999/10000)"
  - "Kein doppeltes esc() in _charRollToast — label bereits esc()'d, showToast escaped erneut"
metrics:
  duration: "15min"
  completed: "2026-06-18"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 3
---

# Phase 06 Plan 08: Roll-Feedback-Toast über Detail-Modal Summary

**One-liner:** z-index-Bump (1000→1200) + _charRollToast-Helfer in allen 4 Modal-Wurf-Handlern — Ergebnis-Toast erscheint jetzt sichtbar über dem geöffneten Detail-Modal.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | z-index-Fix + _charRollToast + E2E | d0a35dc | party.css, entity-actions.js, character-advancement.spec.js |

## What Was Built

**Gap closure for UAT finding `roll-feedback` (CHAR-03):**

Klickt der Nutzer im Charakter-Detail-Modal auf einen Wurf (Attribut-Check, Skill, Save, Angriff), erscheint jetzt ein sofort sichtbarer Ergebnis-Toast ÜBER dem offenen Modal.

**Zwei Ursachen behoben:**

1. **z-index-Bug (Schlüssel-Fix):** `.event-log` hatte `z-index: 1000`, `.modal-overlay` hat `z-index: 1100` — Toast wurde hinter dem Modal verborgen. Fix: `z-index: 1200` für `.event-log` in `assets/styles/party.css`.

2. **Fehlendes Toast-Feedback:** Die 4 Handler (`roll-char-skill-stop`, `roll-char-save-stop`, `roll-char-attr-stop`, `roll-char-attack-stop`) in `ui/actions/entity-actions.js` riefen nur `displayDiceResult` + `addToDiceHistory`. Letztere schreibt in `#dice-hero`, das hinter dem Modal liegt. Ergänzt: modul-interner `_charRollToast(label, total, rolls)` Helfer (kein neuer Global, keine neue Datei), der nach `addToDiceHistory` einen `showToast('🎲 label: total', 'info')` auslöst.

**E2E:** Neuer Test "Klick auf STR-Attribut-Wurf im Modal → sichtbarer Toast über dem Modal" in `tests/e2e/features/character-advancement.spec.js`. Bestehende diceHistory-Assertions unverändert grün.

## Verification Results

- `python build.py` → exit 0 (kein neues Modul, kein loader.js/build.py-Eintrag nötig)
- `npx jest` → 421/421
- `npx playwright test tests/e2e/features/character-advancement.spec.js --reporter=line` → 11/11 grün (inkl. neuem Toast-Test)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Datei-Zugriffe eingeführt.

## Self-Check: PASSED

- `assets/styles/party.css` enthält `z-index: 1200` — FOUND
- `ui/actions/entity-actions.js` enthält `_charRollToast` — FOUND
- `tests/e2e/features/character-advancement.spec.js` enthält `event-log-entry` — FOUND
- Commit d0a35dc existiert — FOUND
