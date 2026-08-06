---
phase: 06-spieler-verwaltung
plan: 05
subsystem: ui
tags: [leveling-mode, milestone, xp, party-overview, data-action, e2e]

# Dependency graph
requires:
  - phase: 06-04
    provides: "Milestone render branch in party-details.js (char-xp-milestone-section, milestone-level-up button) and D.settings.levelingMode default/migration"
provides:
  - "Leveling-mode toggle control in #party-overview (data-action=set-leveling-mode)"
  - "set-leveling-mode handler: whitelist, plain save(), renderParty(), live modal refresh"
  - "E2E case that flips mode via UI click (not page.evaluate) and asserts modal branch flip"
affects: [phase-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Settings toggle via data-action with whitelist validation (T-06-16): ctx.value whitelisted to exact enum before writing to D.settings"
    - "Live modal refresh after settings change: read current char id from modal DOM ([data-id]) and re-call showCharacterDetails()"

key-files:
  created: []
  modified:
    - features/party/party-render.js
    - ui/actions/entity-actions.js
    - assets/styles/party.css
    - tests/e2e/features/character-advancement.spec.js

key-decisions:
  - "set-leveling-mode uses plain save() (no saveUndoState/pushUndo) — settings change is trivially reversible by clicking the other option (inspiration precedent, D-02)"
  - "Modal live-refresh derives current character id from [data-id] element inside #char-detail-modal, no new data attribute needed"
  - "E2E back-to-XP step closes modal before clicking toggle (modal overlay intercepts clicks on underlying elements)"

patterns-established:
  - "Settings toggle pattern: whitelist ctx.value → write D.settings.field → plain save() → renderParty() → refresh open modal"

requirements-completed: [CHAR-01]

# Metrics
duration: 25min
completed: 2026-06-16
---

# Phase 6 Plan 5: Leveling-Modus Toggle (Gap-Closure D-07) Summary

**Per-Gruppe Segmented-Control in #party-overview schaltet D.settings.levelingMode zwischen XP und Meilenstein; set-leveling-mode Handler mit Whitelist-Validierung, plain save(), Live-Refresh des offenen Detail-Modals und E2E-Abdeckung via UI-Klick**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-16T00:00:00Z
- **Completed:** 2026-06-16T00:25:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments

- `renderPartyOverview()` rendert `.party-leveling-toggle` Segmented-Control mit zwei Optionen ("XP" / "Meilenstein"); die aktive Option erhalt `class="active"` basierend auf `D.settings.levelingMode`
- `set-leveling-mode` Handler whitelisted ctx.value auf exakt `'xp'|'milestone'` (T-06-16), schreibt D.settings.levelingMode, ruft plain save() (kein Undo — Inspiration-Precedent), renderParty() und refresht offenes Detail-Modal live via showCharacterDetails()
- Party.css: `.party-leveling-toggle` / `.party-leveling-option` / `.active` Styles konsistent mit var(--gold) / var(--bg-dark) / var(--text-dim) Farbschema; mobile-tauglich bei 320px
- Neuer E2E-Test klickt den Toggle (kein page.evaluate um levelingMode zu setzen), prueft XP-Branch-Initial-Zustand, flippt auf Meilenstein, offnet Detail-Modal und assertiert `.char-xp-section` not visible + `[data-action="milestone-level-up"]` visible; wechselt zurück auf XP und bestätigt Branch-Flip
- UAT-Lücke D-07 geschlossen: DM kann Meilenstein-Modus aus der UI umschalten, ohne localStorage per Hand zu editieren

## Task Commits

1. **Task 1: Leveling-mode toggle + handler + CSS + E2E** - `52d973e` (feat)

## Files Created/Modified

- `features/party/party-render.js` — `renderPartyOverview()` liest `levelingMode`, appended `.party-leveling-toggle` HTML-Block vor `container.classList.add('show')`
- `ui/actions/entity-actions.js` — neuer `'set-leveling-mode'` Handler mit Whitelist, plain save(), renderParty(), Modal-Live-Refresh
- `assets/styles/party.css` — `.party-leveling-toggle`, `.party-leveling-toggle-label`, `.party-leveling-options`, `.party-leveling-option`, `.party-leveling-option.active`
- `tests/e2e/features/character-advancement.spec.js` — neuer Test-Case im `CHAR-01 / D-07` describe-Block; bestehender D-07 page.evaluate-Test unverändert

## Decisions Made

- `set-leveling-mode` verwendet plain `save()` ohne `saveUndoState()` — Settings-Änderung ist durch einen Klick reversibel (Inspiration-Precedent, D-02)
- Modal-Live-Refresh liest Charakter-ID aus dem ersten `[data-id]`-Element im Modal-DOM — kein neues data-Attribut nötig, da alle Buttons im `#char-detail-content` bereits `data-id="${ch.id}"` tragen
- E2E-Test schliesst Modal vor dem "Zurück zu XP"-Toggle-Klick, da das offene Modal-Overlay pointer events auf darunter liegende Elemente blockiert

## Deviations from Plan

None — plan executed exactly as written. The E2E test structure required one minor adjustment (close modal before re-clicking toggle) due to overlay pointer-event behavior, but this is correct UX behavior, not a deviation from the acceptance criteria.

## Issues Encountered

- First E2E attempt failed because the open `#char-detail-modal` intercepted the back-to-XP toggle click. Fixed by adding `page.click('[data-action="hide-modal"][data-value="char-detail-modal"]')` before the second toggle click.

## User Setup Required

None — no external service configuration required.

## Self-Check

- [x] `features/party/party-render.js` exists and contains `set-leveling-mode`
- [x] `ui/actions/entity-actions.js` exists and contains `set-leveling-mode`
- [x] Commit `52d973e` exists
- [x] Build: exit 0
- [x] Jest: 421/421
- [x] E2E character-advancement.spec.js: 9/9

## Self-Check: PASSED

## Next Phase Readiness

- D-07 UAT gap fully closed; Milestone mode is reachable from the UI
- Phase 07 (Komfort & Analyse) ready to plan
- No blockers

---
*Phase: 06-spieler-verwaltung*
*Completed: 2026-06-16*
