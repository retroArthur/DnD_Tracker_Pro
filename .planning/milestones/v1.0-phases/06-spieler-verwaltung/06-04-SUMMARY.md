---
phase: 06-spieler-verwaltung
plan: 04
subsystem: character-management
tags: [d&d-5e, xp-tracking, xp-distribution, milestone, level-up, initiative, combat, e2e-testing, playwright]

# Dependency graph
requires:
  - phase: 06-01
    provides: getXPForCR, distributeXP, canLevelUp, XP_LEVEL_THRESHOLDS — Wave-1 pure helpers
  - phase: 06-03
    provides: showCharacterDetails detail-modal structure, roll-char-*-stop handler pattern

provides:
  - Initiative XP-Verteilungs-Trigger (finish-combat-xp) + Modal (#xp-distribution-modal) mit CR-Autosum
  - finishCombatXp / showXpDistributionModal / applyXpDistribution (features/initiative.js)
  - finish-combat-xp + apply-xp-distribution in CombatActions registry
  - XP/Level-Block im Detail-Modal: xp-Wert, Schwelle, Fortschrittsbalken, canLevelUp-Hinweis
  - confirm-level-up + milestone-level-up Handler in EntityActions (pushUndo + level cap 20)
  - CSS: .xp-dist-* (initiative.css), .char-xp-section / .char-level-up-badge / .char-xp-milestone-section (party.css)
  - 4 CHAR-01 E2E-Tests aktiviert und grün

affects: [future-phases-that-read-D.characters.level, future-phases-that-read-D.characters.xp]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Separate XP-Trigger-Aktion (finish-combat-xp) statt endCombat()-Overload — Muster 4 aus RESEARCH.md"
    - "XP-Modal: CR-Autosum via getXPForCR (global lexical), manuell korrigierbar (T-06-11 parseInt+floor)"
    - "Level-up: pushUndo('XP verteilt'/'Stufe erhöht') VOR Mutation — D-14 / undoable-first pattern"
    - "Milestone-Modus: eigene CSS-Klasse .char-xp-milestone-section (ohne .char-xp-section) für E2E-Assertion-Sauberkeit"
    - "E2E Wave-4: 4 test.fixme → test; alle 8 char-advancement Tests grün"

key-files:
  created: []
  modified:
    - features/initiative.js — finishCombatXp, showXpDistributionModal, updateXpDistPreview, applyXpDistribution + window exports
    - ui/actions/combat-actions.js — finish-combat-xp + apply-xp-distribution registriert
    - assets/templates/modals-entity.html — #xp-distribution-modal (Autosum, Korrektur-Input, Party-Info, Preview, Verteilen-Button)
    - assets/templates/view-encounters.html — ⭐ XP-Button in Initiative-Toolbar (data-action="finish-combat-xp")
    - features/party/party-details.js — XP/Level-Block in showCharacterDetails (xp + Milestone Modi)
    - ui/actions/entity-actions.js — confirm-level-up + milestone-level-up Handler
    - assets/styles/initiative.css — .xp-dist-* CSS
    - assets/styles/party.css — .char-xp-section, .char-level-up-badge, .char-xp-milestone-section, .char-milestone-btn
    - tests/e2e/features/character-advancement.spec.js — 4 CHAR-01 test.fixme → test (8/8 grün)

key-decisions:
  - "endCombat() NICHT modifiziert — XP-Trigger ist separate Aktion (finish-combat-xp) per RESEARCH Muster 4"
  - "Milestone-Modus nutzt .char-xp-milestone-section (ohne .char-xp-section) damit E2E-Test 'not.toBeVisible()' auf .char-xp-section korrekt trifft"
  - "confirm-level-up und milestone-level-up als separate Actions registriert (identische Logik, beide aus E2E-Spec nötig)"
  - "pushUndo('XP verteilt') VOR distributeXP-Aufruf — distributeXP mutiert activeChars sofort (T-06-14)"
  - "applyXpDistribution guards T-06-12 (leere Party), T-06-11 (NaN / negative total via parseInt+max(0))"

patterns-established:
  - "XP-Modal Live-Preview: input-Listener einmalig registriert via _xpDistListener-Flag (kein Mehrfach-Attach)"
  - "Level-Up HINT-then-CONFIRM: canLevelUp() zeigt Badge mit Button; Button ruft confirm-level-up; kein Auto-Bump (D-11)"
  - "getProfBonus(ch.level) nach Level-Erhöhung — spiegelt saveCharacter()-Pattern aus party-crud.js"

requirements-completed: [CHAR-01]

# Metrics
duration: ~60min
completed: 2026-06-15
---

# Phase 06 Plan 04: XP-/Milestone-Tracker — Encounter-Abschluss, XP-Verteilung, Levelaufstieg-Hinweis (CHAR-01)

**Initiative-Trigger oeffnet XP-Modal mit CR-Autosum (CR_TO_XP via getXPForCR), manueller Korrektur und gleichmaessiger Verteilung auf lebende Charaktere; Level-up als DM-bestaetiger Hinweis (canLevelUp); Milestone-Modus versteckt XP und zeigt +1-Level-Button**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-06-15T22:00:00Z
- **Completed:** 2026-06-15T23:00:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- XP-Verteilungs-Flow komplett: `finish-combat-xp`-Button in Initiative-Toolbar → Modal mit CR-Autosum (getXPForCR() über alle enemy/monster Combatants) + immer verfügbares manuelles Korrekturfeld → `applyXpDistribution()` verteilt gleichmäßig auf lebende Chars mit pushUndo + Level-up-Hinweise via canLevelUp; endCombat() unberührt
- Detail-Modal XP-Block (D-08): xp-Wert, Schwelle (XP_LEVEL_THRESHOLDS), Fortschrittsbalken, canLevelUp-Hint mit "Stufe bestätigen"-Button (confirm-level-up); NIEMALS Auto-Bump (D-11)
- Milestone-Modus (D-07): `.char-xp-milestone-section` (kein `.char-xp-section`) mit "+1 Level"-Button (milestone-level-up) — E2E-Assertion `not.toBeVisible('.char-xp-section')` korrekt
- 4 CHAR-01 E2E-Tests von test.fixme auf test umgestellt; alle 8 Playwright-Tests grün; alle 421 Jest-Unit-Tests weiterhin grün; Build exit 0

## Task Commits

1. **Task 1: Initiative XP-Trigger + Modal + Handler + CSS** - `2e18db8` (feat)
2. **Task 2: Detail-Modal XP-Block + Levelaufstieg + Milestone + E2E** - `6392d62` (feat)

## Files Created/Modified

- `features/initiative.js` — finishCombatXp, showXpDistributionModal, updateXpDistPreview, applyXpDistribution + window exports; endCombat unberührt
- `ui/actions/combat-actions.js` — finish-combat-xp + apply-xp-distribution in CombatActions
- `assets/templates/modals-entity.html` — #xp-distribution-modal mit Autosum, Korrektur-Input, Living-Count, Preview-Div, Verteilen-Button
- `assets/templates/view-encounters.html` — ⭐ XP-Button in Initiative-Toolbar (btn-warning, xp-distribute-btn)
- `features/party/party-details.js` — XP/Level-Block in showCharacterDetails (IIFE, liest D.settings.levelingMode, ruft canLevelUp + XP_LEVEL_THRESHOLDS auf)
- `ui/actions/entity-actions.js` — confirm-level-up + milestone-level-up Handler (pushUndo, level cap 20, getProfBonus, save, render, re-open modal)
- `assets/styles/initiative.css` — .xp-distribute-btn, .xp-dist-body, .xp-dist-autosum, .xp-dist-preview-line
- `assets/styles/party.css` — .char-xp-section, .char-xp-bar-wrap, .char-xp-bar, .char-level-up-badge, .level-up-hint, .char-xp-milestone-section, .char-milestone-btn
- `tests/e2e/features/character-advancement.spec.js` — 4 CHAR-01 test.fixme → test aktiviert

## Decisions Made

- **endCombat() unberührt:** XP-Verteilung ist separate DM-Aktion (finish-combat-xp Button), nicht Teil des Kampfabschluss-Flows. RESEARCH Muster 4 klar: "Anti-Pattern: don't overload endCombat".
- **Milestone-Modus separate CSS-Klasse:** `.char-xp-milestone-section` statt `.char-xp-section.milestone` damit der E2E-Test `expect(page.locator('.char-xp-section')).not.toBeVisible()` korrekt besteht — der Wave-0-Stub wurde mit dieser Erwartung geschrieben.
- **confirm-level-up UND milestone-level-up registriert:** Die Wave-0-E2E-Stubs nutzten `milestone-level-up` als data-action; der Plan nannte `confirm-level-up`. Beide registriert mit identischer Logik für maximale Kompatibilität.
- **pushUndo vor distributeXP:** distributeXP mutiert die activeChars sofort in-place; pushUndo muss vor dem Aufruf erfolgen sonst enthält der gespeicherte State bereits die mutierten XP-Werte.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Milestone-Sektion nutzt separate CSS-Klasse statt .char-xp-section**
- **Found during:** Task 2 E2E-Run (Milestone-Test schlägt fehl)
- **Issue:** E2E-Test `expect(.char-xp-section).not.toBeVisible()` schlug fehl weil die Milestone-Sektion beide Klassen `char-xp-section char-xp-milestone` trug — `.char-xp-section` war also sichtbar
- **Fix:** Milestone-Block auf `char-xp-milestone-section` (ohne `char-xp-section`) umgestellt; CSS-Klasse entsprechend angepasst
- **Files modified:** features/party/party-details.js, assets/styles/party.css
- **Verification:** `npx playwright test tests/e2e/features/character-advancement.spec.js` → 8/8 passed
- **Committed in:** 6392d62 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — E2E-Assertion Klassen-Namenskonflikt)
**Impact on plan:** Fix war notwendig für E2E-Korrektheit. Kein Scope Creep.

## Issues Encountered

None — Alle anderen Aspekte (CR-Autosum, XP-Verteilung, pushUndo-Reihenfolge, Level-cap, getProfBonus) liefen ohne unerwartete Probleme.

## Known Stubs

Keine — alle CHAR-01-Anforderungen vollständig implementiert und durch Tests verifiziert.

## Threat Surface Scan

Keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Schema-Änderungen an Trust-Grenzen. Bedrohungen aus dem Plan-Threat-Register wurden mitigiert:

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-06-11 | `Math.max(0, parseInt(total, 10) \|\| 0)` in applyXpDistribution | mitigiert |
| T-06-12 | Guard: `if (!activeChars.length) { showToast(...); return; }` | mitigiert |
| T-06-13 | Level niemals auto-gebumpt; nur via confirm-level-up/milestone-level-up mit DM-Klick | mitigiert |
| T-06-14 | pushUndo('XP verteilt') VOR distributeXP-Aufruf; pushUndo('Stufe erhöht') VOR level++ | mitigiert |
| T-06-15 | `esc(ch.name)` in levelUpHints-Array in applyXpDistribution; Labels sind statische Strings | mitigiert |

## Next Phase Readiness

Phase 6 (Spieler-Verwaltung) ist vollständig abgeschlossen:
- CHAR-01 (XP/Milestone): Wave 4 — DONE
- CHAR-02 (Inspiration): Wave 2 — DONE (06-02)
- CHAR-03 (Erweiterte Werte): Wave 3 — DONE (06-03)

Alle 421 Unit-Tests grün, alle 8 CHAR-01/03 E2E-Tests grün, Build exit 0.

---
*Phase: 06-spieler-verwaltung*
*Completed: 2026-06-15*
