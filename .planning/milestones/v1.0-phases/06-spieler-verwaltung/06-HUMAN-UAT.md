---
status: complete
phase: 06-spieler-verwaltung
source: [06-VERIFICATION.md]
started: 2026-06-16T00:00:00Z
updated: 2026-06-20T13:45:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Inspiration-Stern ist visuell korrekt gestylt (gefüllt gold / ausgegraut)
expected: Aktiver Stern zeigt Goldfarbe (var(--gold)), inaktiver Stern ist ausgegraut (var(--text-dim))
result: pass

### 2. XP-Fortschrittsbalken im Detail-Modal rendert korrekt
expected: Balken zeigt prozentualen XP-Fortschritt zur nächsten Stufe; kein Overflow, korrekte Breite
result: pass
note: Bar rendert im Detail-Modal (🔍). Bei xp=0 ist der Balken korrekt 0% breit (leer). Hinweis: Editor hat KEIN XP-Feld — XP nur über ⭐-XP-Verteilung im Initiative-Tab; manuell gelevelte Charaktere zeigen daher dauerhaft einen leeren Balken (vom Nutzer als akzeptabel/separat behandelt).

### 3. Skills-Sektion im Detail-Modal: nach Attributen gruppiert, lesbar
expected: 18 Skills korrekt nach STR/DEX/CON/INT/WIS/CHA gruppiert, deutsche Namen aus SKILL_INFO, Modifier korrekt formatiert
result: pass
reported: "XP Bar ist zu sehen, noch dazu ist es sehr unaufgeräumt in dieser Ansicht."
severity: cosmetic
note: Ursprünglich issue (überladenes Modal, ~60 V/N-Buttons, verstreute Skills). Behoben via Gap-Closure 06-06 (V/N nur bei Hover), 06-07 (balanciertes Skills-Spalten-Layout), 06-08 (Wurf-Toast über Modal). Vom Nutzer nach Reload sicht-bestätigt (2026-06-20) → pass.

### 4. Angriffs-Sektion im Detail-Modal: Treffer- und Schadenswürfel klar erkennbar
expected: Angriffswürfel-Spans sind deutlich als klickbar erkennbar (Cursor, Hover), Schaden-Spans ebenfalls
result: pass
note: Angriffe rendern mit klickbaren Treffer-/Schaden-Spans (1d20+1 / 1d8+2). UAT deckte auf, dass der Klick zwar korrekt würfelt (landet in Würfel-Historie — per Headless-Repro verifiziert, diceHistory 0→1), aber KEIN sichtbares Feedback über dem Modal gab (displayDiceResult schreibt in die Würfel-Tab-Anzeige hinter dem Modal; .event-log z-index 1000 < Modal 1100). Behoben in Gap 06-08 (Toast über Modal + z-index 1200). Gilt für alle Modal-Würfe (Skills/Saves/Attribute/Angriffe).

### 5. XP-Verteilungs-Modal: Vorschau aktualisiert sich live bei manueller XP-Eingabe
expected: Änderung des Inputs aktualisiert die "Je Charakter: +N XP"-Zeile ohne Neuladen
result: pass
note: Live-Vorschau funktioniert (updateXpDistPreview via input-Listener). Nutzer-Folgewunsch (Enhancement, NICHT Teil des UAT-Erwartungswerts): Spieler aus der XP-Verteilung ausschließen können → als Enhancement 06-09 erfasst.

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Bei der XP-Verteilung kann der DM wählen, welche Spieler XP erhalten (alle oder nur einige) — unabhängig vom HP-/Lebend-Status (Enhancement aus UAT)"
  status: resolved
  reason: "Nutzerwunsch (2026-06-16): Wenn ein Spieler fehlt oder nicht mehr Teil der Gruppe ist, soll sein Profil keine XP mehr bekommen. Aktuell verteilte applyXpDistribution() FEST an alle LEBENDEN Charaktere ohne Auswahlmöglichkeit."
  resolution: "Closed by enhancement 06-09 (commit 1ff49ac). XP-Modal listet jetzt ALLE Party-Chars als Checkbox-Liste (default angehakt, info-only HP-Badge inkl. 💀 0 HP), + Alle/Keine-Quick-Select. 'Je Charakter' rechnet live anhand der angehakten ('M von K ausgewählt'). applyXpDistribution verteilt NUR an angehakte (living-only-Filter entfernt) — ein angehakter 0-HP-Char bekommt XP, ein abgewählter (auch lebender) nicht; Guard bei 0 ausgewählten (Warn-Toast, keine Mutation). Visuell per Screenshot geprüft (150 XP / 3 = 50, korrektes Layout); build exit 0, jest 421/421, playwright 15/15 (4 neue Fälle)."
  severity: enhancement
  test: xp-exclude-players
  artifacts: ["features/initiative.js:266-395", "assets/templates/modals-entity.html (#xp-dist-char-list, Alle/Keine)", "assets/styles/initiative.css", "tests/e2e/features/character-advancement.spec.js"]
  missing: []

- truth: "A per-group setting D.settings.levelingMode toggles XP vs Milestone (D-07); the DM can switch a group into Milestone mode from the UI and the XP UI hides / a '+1 Level' button appears"
  status: resolved
  reason: "UAT finding (2026-06-16): D.settings.levelingMode was only READ (party-details.js:236) and only ever WRITTEN to 'xp' (core/data.js:37 default + version-migration.js:103 backfill). No UI control existed to switch a group into Milestone mode. The render branch (party-details.js:239+) was correct but unreachable from the UI."
  resolution: "Closed by gap-closure plan 06-05 (commit 52d973e). Added a `.party-leveling-toggle` segmented control (⭐ XP / 🎯 Meilenstein) in renderPartyOverview() (#party-overview); new `set-leveling-mode` data-action handler (entity-actions.js) whitelists ctx.value to 'xp'|'milestone', writes D.settings.levelingMode, plain save() (no undo), renderParty(), and live-refreshes an open detail modal. New E2E drives the control by clicking (not page.evaluate). Build exit 0, jest 421/421, E2E 9/9 (both D-07 cases green)."
  severity: major
  test: milestone-toggle
  artifacts: ["features/party/party-render.js:419-426", "ui/actions/entity-actions.js:31-49", "assets/styles/party.css", "tests/e2e/features/character-advancement.spec.js"]
  missing: []

- truth: "Das Charakter-Detail-Modal ist am Spieltisch übersichtlich/aufgeräumt lesbar (D-03/D-04 Skills/Saves/Attribut-Checks/Angriffe)"
  status: resolved
  reason: "UAT-Beobachtung (2026-06-16, Screenshot): Das Detail-Modal wirkt 'sehr unaufgeräumt' — ~60 dauerhaft sichtbare inline V/N-Buttons (.char-adv-btns) auf jeder Zeile, obwohl die Zeile bereits Klick-zum-Normalwurf ist."
  resolution: "Closed by gap-closure plan 06-06 (commit c74292f). V/N werden im Ruhezustand ausgeblendet (visibility:hidden, kein Layout-Sprung) und erst bei Hover der Zeile gezeigt — gekapselt in @media (hover: hover) and (pointer: fine). DEFAULT (Touch/coarse pointer) behält V/N sichtbar (T-06-19). Normalwurf-Klick unverändert. Attribut-Check-Zeile entdichtet (kein Anschnitt mehr). Neuer E2E-Hover-Test; build exit 0, jest 421/421, playwright 10/10. Nutzer-Sichtprüfung nach Reload noch offen (Test 3)."
  severity: cosmetic
  test: detail-modal-clutter
  artifacts: ["assets/styles/party.css:3125-3158", "tests/e2e/features/character-advancement.spec.js"]
  missing: []

- truth: "Die Fertigkeiten-Sektion im Detail-Modal ist gleichmäßig/aufgeräumt gelayoutet (nicht über die Modal-Breite zerfließend, keine Waisen-Spalte)"
  status: resolved
  reason: "UAT-Beobachtung (2026-06-16, Screenshot 'Conan'): 'die Fertigkeiten sind zu verteilt und ungerade'. Ursache: .char-skills-by-attr war ein display:grid (auto-fit minmax(150px,1fr)), das die 5 ungleich großen Attribut-Gruppen über die volle Modal-Breite streckte und zeilenweise platzierte → breite Name↔Modifier-Lücken + CHA als Waisen-Zeile."
  resolution: "Closed by gap-closure 06-07. .char-skills-by-attr → balancierter Mehrspalten-Fluss (column-width:215px; column-gap:22px; max-width:960px) + break-inside:avoid auf .char-skill-attr-group. Gruppen packen sich dicht/balanciert, Zeilen kompakt. Per Playwright-Screenshot visuell geprüft; build exit 0, jest 421/421, playwright 10/10. Nutzer-Sichtprüfung nach Reload offen (Test 3)."
  severity: cosmetic
  test: skills-layout
  artifacts: ["assets/styles/party.css:2815-2834"]
  missing: []

- truth: "Ein Klick auf einen Wurf im Detail-Modal (Angriff/Skill/Save/Attribut) zeigt ein sofort sichtbares Ergebnis über dem Modal"
  status: resolved
  reason: "UAT (2026-06-16): Klick auf Schaden-Span '1d8+2' schien wirkungslos. Headless-Repro bewies: der Wurf funktioniert (diceHistory 0→1, kein Fehler) — aber displayDiceResult schreibt in die Würfel-Tab-Elemente (#dice-hero) HINTER dem offenen Modal, und der Toast-Container .event-log war z-index 1000 < .modal-overlay 1100. Kein Funktionsfehler, sondern fehlendes sichtbares Feedback; betrifft alle 4 Modal-Wurf-Typen."
  resolution: "Closed by gap-closure 06-08 (commit d0a35dc). .event-log z-index 1000→1200 (über Modal); module-internes _charRollToast(label,total,rolls) in allen 4 Handlern (roll-char-attr/skill/save/attack-stop) NACH dem unveränderten displayDiceResult+addToDiceHistory → '🎲 {label}: {total}'-Toast über dem Modal. Roll-Mathematik/History unverändert; kein Doppel-Escaping. Neuer E2E-Toast-Test; build exit 0, jest 421/421, playwright 11/11."
  severity: major
  test: roll-feedback
  artifacts: ["ui/actions/entity-actions.js (_charRollToast + 4 Handler)", "assets/styles/party.css:548 (.event-log z-index 1200)", "tests/e2e/features/character-advancement.spec.js"]
  missing: []
