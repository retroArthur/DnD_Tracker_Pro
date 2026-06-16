---
status: partial
phase: 06-spieler-verwaltung
source: [06-VERIFICATION.md]
started: 2026-06-16T00:00:00Z
updated: 2026-06-16T12:30:00Z
---

## Current Test

number: 2
name: XP-Fortschrittsbalken im Detail-Modal
expected: |
  Charakter anklicken → Detail-Modal (im XP-Modus): ein Fortschrittsbalken zeigt
  den prozentualen XP-Fortschritt zur nächsten Stufe; kein Overflow, korrekte Breite.
awaiting: user response

## Tests

### 1. Inspiration-Stern ist visuell korrekt gestylt (gefüllt gold / ausgegraut)
expected: Aktiver Stern zeigt Goldfarbe (var(--gold)), inaktiver Stern ist ausgegraut (var(--text-dim))
result: pass

### 2. XP-Fortschrittsbalken im Detail-Modal rendert korrekt
expected: Balken zeigt prozentualen XP-Fortschritt zur nächsten Stufe; kein Overflow, korrekte Breite
result: [pending]

### 3. Skills-Sektion im Detail-Modal: nach Attributen gruppiert, lesbar
expected: 18 Skills korrekt nach STR/DEX/CON/INT/WIS/CHA gruppiert, deutsche Namen aus SKILL_INFO, Modifier korrekt formatiert
result: [pending]

### 4. Angriffs-Sektion im Detail-Modal: Treffer- und Schadenswürfel klar erkennbar
expected: Angriffswürfel-Spans sind deutlich als klickbar erkennbar (Cursor, Hover), Schaden-Spans ebenfalls
result: [pending]

### 5. XP-Verteilungs-Modal: Vorschau aktualisiert sich live bei manueller XP-Eingabe
expected: Änderung des Inputs aktualisiert die "Je Charakter: +N XP"-Zeile ohne Neuladen
result: [pending]

## Summary

total: 5
passed: 1
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

- truth: "A per-group setting D.settings.levelingMode toggles XP vs Milestone (D-07); the DM can switch a group into Milestone mode from the UI and the XP UI hides / a '+1 Level' button appears"
  status: resolved
  reason: "UAT finding (2026-06-16): D.settings.levelingMode was only READ (party-details.js:236) and only ever WRITTEN to 'xp' (core/data.js:37 default + version-migration.js:103 backfill). No UI control existed to switch a group into Milestone mode. The render branch (party-details.js:239+) was correct but unreachable from the UI."
  resolution: "Closed by gap-closure plan 06-05 (commit 52d973e). Added a `.party-leveling-toggle` segmented control (⭐ XP / 🎯 Meilenstein) in renderPartyOverview() (#party-overview); new `set-leveling-mode` data-action handler (entity-actions.js) whitelists ctx.value to 'xp'|'milestone', writes D.settings.levelingMode, plain save() (no undo), renderParty(), and live-refreshes an open detail modal. New E2E drives the control by clicking (not page.evaluate). Build exit 0, jest 421/421, E2E 9/9 (both D-07 cases green)."
  severity: major
  test: milestone-toggle
  artifacts: ["features/party/party-render.js:419-426", "ui/actions/entity-actions.js:31-49", "assets/styles/party.css", "tests/e2e/features/character-advancement.spec.js"]
  missing: []
