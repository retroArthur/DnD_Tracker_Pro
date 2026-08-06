---
phase: 06-spieler-verwaltung
plan: "06"
subsystem: party-ui
tags: [css, ux, hover, touch-fallback, e2e, gap-closure]
dependency_graph:
  requires: [06-03, 06-05]
  provides: [detail-modal-clutter-closed]
  affects: [assets/styles/party.css, tests/e2e/features/character-advancement.spec.js]
tech_stack:
  added: []
  patterns: [hover-reveal-css, media-query-touch-fallback, playwright-visibility-assertion]
key_files:
  created: []
  modified:
    - assets/styles/party.css
    - tests/e2e/features/character-advancement.spec.js
decisions:
  - "visibility:hidden + opacity:0 bevorzugt gegenüber display:none — kein Layout-Sprung, Playwright .not.toBeVisible() greift zuverlässig"
  - "Touch-Fallback als DEFAULT (außerhalb der Media-Query) statt als explizite @media (hover: none) — einfacher und inklusiver"
  - "Bonus-Tightening (.char-attr-grid gap/margin) im selben @media-Block — gilt nur auf Geräten mit fine pointer, wo der Platz weniger kritisch ist"
metrics:
  duration: "8 min"
  completed: "2026-06-16"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
---

# Phase 06 Plan 06: V/N-Hover-Reveal (Detail-Modal-Clutter) Summary

**One-liner:** Hover-reveal CSS für ~60 V/N-Buttons in `.char-attr-box`/`.char-skill-item`/`.char-save-box` mit verpflichtendem Touch-Fallback via `@media (hover: hover) and (pointer: fine)`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | V/N nur bei Hover + Touch-Fallback + Attribut-Grid-Spacing + E2E-Hover-Case | c74292f | assets/styles/party.css, tests/e2e/features/character-advancement.spec.js |

## What Was Built

### CSS-Änderungen (assets/styles/party.css)

**Touch-Fallback (DEFAULT):** `.char-adv-btns` erhält explizit `visibility: visible; opacity: 1; pointer-events: auto;` außerhalb jeder Media-Query. Coarse-Pointer- und Touch-Geräte sehen V/N dauerhaft — Vorteil/Nachteil bleibt ohne Hover erreichbar (T-06-19 Mitigation).

**Hover-Reveal (`@media (hover: hover) and (pointer: fine)`):**
- Ruhezustand: `visibility: hidden; opacity: 0; pointer-events: none; transition: opacity 0.12s, visibility 0.12s`
- Reveal per Hover der Eltern-Zeile: `.char-attr-box:hover .char-adv-btns`, `.char-skill-item:hover .char-adv-btns`, `.char-save-box:hover .char-adv-btns` → `visibility: visible; opacity: 1; pointer-events: auto`
- `visibility:hidden` statt `display:none` verhindert Layout-Sprung und macht Playwright `.not.toBeVisible()` zuverlässig (opacity:0 allein gilt in Playwright als sichtbar)

**Bonus-Tightening (im selben @media-Block):**
- `.char-attr-grid { gap: 4px; margin-bottom: 8px; }` (vorher: `gap: 6px; margin-bottom: 14px` in core.css)
- `.char-attr-box.clickable { padding-top: 4px; padding-bottom: 4px; }` (vorher: `padding: 6px 4px`)
- Obere Attribut-Check-Zeile wird nicht mehr angeschnitten; Modal-Höhe reduziert

**party-details.js:** Unverändert — alle Hook-Klassen (`.char-adv-btns` als Kind von `.char-attr-box`/`.char-skill-item`/`.char-save-box`) existierten bereits (Phase 06-03).

### E2E-Test (tests/e2e/features/character-advancement.spec.js)

Neuer `describe`-Block `CHAR-03: Detail-Modal aufgeräumt — V/N nur bei Hover`:
- Öffnet Detail-Modal für Rhogar (id: 99902, stealth-Proficienz vorhanden)
- Assertiert: `[data-skill="stealth"] .char-adv-btns` ist `.not.toBeVisible()` im Ruhezustand
- `page.hover()` auf die stealth-Zeile (`:not([data-adv])`)
- Assertiert: `advBtns.toBeVisible()` nach Hover
- Default-Chromium hat fine pointer → `@media (hover: hover)` greift im Test

## Verification Results

- `python build.py` (PYTHONIOENCODING=utf-8): exit 0, 445 window assignment conflicts removed, alle Validierungen bestanden
- `npx jest`: 421/421 Tests grün (keine Regression — reine CSS/E2E-Änderung)
- `npx playwright test tests/e2e/features/character-advancement.spec.js`: 10/10 grün (9 bestehende + 1 neuer Hover-Case)

## Deviations from Plan

None - plan executed exactly as written. party-details.js unverändert. Kein neues Modul, keine build.py/loader.js-Änderung.

## Known Stubs

None.

## Threat Flags

None — reine Präsentations-/Sichtbarkeits-Änderung, keine neuen Eingaben, Datenflüsse oder Persistenz-Pfade berührt.

## Self-Check: PASSED

- [x] `assets/styles/party.css` geändert und im Commit c74292f enthalten
- [x] `tests/e2e/features/character-advancement.spec.js` geändert und im Commit c74292f enthalten
- [x] Commit c74292f existiert: `feat(06-06): V/N-Buttons nur bei Hover im Detail-Modal`
- [x] Build exit 0
- [x] Jest 421/421
- [x] Playwright 10/10 (inkl. neuer Hover-Case)
- [x] party-details.js unverändert
- [x] UAT-Gap `detail-modal-clutter` geschlossen (CHAR-03)
