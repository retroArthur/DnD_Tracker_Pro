# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Stabilisierung & Ausbau

**Shipped:** 2026-07-22
**Phases:** 7 | **Plans:** 44 | **Commits:** 517 (28.12.2025 → 22.07.2026)

### What Was Built
- Von „App startet nicht" zum vollständigen offline-first Spielleiter-Begleiter: stabiler file://-Boot mit LS+IDB-Dual-Persistenz, installierbare PWA (Pages-Deploy, SW-Updates, Datei-Backup, Migrations-Wizard)
- 112 deutsche SRD-Statblocks offline, Kampf-Tiefe (Legendary/Mob/Death-Saves/Concentration/AoE), Welt & Story (NPC-Generator, Harptos-Kalender, Reise, Fraktionen), Spieler-Verwaltung (XP/Milestone, klickbare Würfe), Soundboard mit Crossfade-Szenen, Würfel-Statistiken
- Testfundament: 453 Unit-Tests, Phasen-E2E, CI mit Deploy-Gate; 20/20 Human-UAT-Szenarien

### What Worked
- **Sequenzielle Executor auf `main`** (statt Worktrees) ab Phase 5: 0 Merge-Konflikte trotz geteilter Dateien in fast jedem Plan; Spot-Checks (SUMMARY + Commits) fingen Executor-Abbrüche zuverlässig
- **Human-UAT als eigener Gate**: fand 8+ echte Bugs, die alle automatisierten Suiten verpassten (Doppel-Import, Audio-läuft-weiter, Live-Volume, Manifest-CORS, Datei-Backup-Hook, fehlender Ordner-Wechsel) — inklusive eines strukturellen Architektur-Bugs
- **Code-Review-Gate nach Phasen-Execution**: CR-01 (tote Soundboard-Klick-Aktionen) hätte sonst geshippt — E2E war grün, weil der Keyboard-Pfad den Klick-Pfad umging
- **Wave-0-Test-Stubs mit Vertrags-Testnamen** (VALIDATION `-t`/`-g`): Feature-Pläne aktivierten exakt benannte Tests statt eigene zu erfinden

### What Was Inefficient
- **Fixes am falschen Ort durch ungenaue Bug-Reports**: „Sitzung löschen" ≠ „Szene löschen" kostete einen kompletten Fix-Zyklus (deleteCampaign statt deleteScene) — erst die Rückfrage nach dem exakten Klickpfad löste es
- **348 Commits ungepusht über Monate**: Remote-Divergenz (7 Mai-Commits, racender pages.yml-Deploy) musste beim Milestone-Abschluss unter Zeitdruck gemergt werden — früher/regelmäßig pushen
- **Selbst gebaute Test-Snippets mit falschen Annahmen** (window.STORAGE_KEY in der Konsole undefined; Date.now()-IDs > _nextId) erzeugten Schein-Fehlschläge, die von echten Befunden ablenkten
- **SW-/Pages-Cache-Latenz** (max-age=600) machte Live-Re-Tests zäh — „zu früh getestet" wirkte zweimal wie ein fehlgeschlagener Fix

### Patterns Established
- **`registerPostSaveHook` statt `window.save`-Wrapping**: globale `const`-Bindungen überdecken window-Properties dauerhaft — Monkey-Patches auf window-Funktionen sind in dieser Architektur strukturell wirkungslos (CLAUDE.md-Pattern korrigiert)
- **String-IDs immer via `ctx.target.dataset.id`** (nie `ctx.id`/`parseEntityId`) — dritter Vorfall dieser Klasse (03-03, CR-01, toggle-track-loop präventiv)
- **Baseline-Beweis per `git stash` bei Suite-Fehlschlägen**: 11 vorbestehende E2E-Fails sauber von Regressionen getrennt
- **Erst diagnostizieren, welcher Code im Browser läuft** (Version-Marker in Console prüfen), bevor ein „Fix wirkt nicht" untersucht wird

### Key Lessons
1. Grüne E2E-Tests beweisen nur die getesteten Pfade — der Doppel-Import wurde von einem manuellen `dispatchEvent('change')` im Test maskiert; Assertions auf exakte Zählwerte (`toBe(1)` statt `toBeGreaterThan(0)`) hätten ihn gefangen
2. Bei „Fix wirkt nicht" zuerst klären: (a) läuft der neue Code überhaupt (SW-Cache!), (b) war es wirklich der gemeldete Auslöser — bevor tiefer gegraben wird
3. UAT-Bugs sofort fixen und im selben Durchlauf re-testen lassen hält den Kontext heiß und die Fix-Qualität hoch (alle 8 UAT-Bugs am selben Tag verifiziert)

### Cost Observations
- Sessions: GSD-Workflow über ~6 Wochen (Planung 2026-06-11 → Ship 2026-07-22); Ausführung überwiegend sonnet-Executor mit Opus-Orchestrierung
- Notable: UAT-getriebene Fix-Zyklen (verify-work → diagnose → fix → re-test) waren der effizienteste Bug-Finder des Projekts — deutlich höhere Trefferquote als Code-Review auf ruhendem Code

## Cross-Milestone Trends

| Metrik | v1.0 |
|--------|------|
| Phasen / Pläne | 7 / 44 |
| Unit-Tests (Ende) | 453 |
| UAT-Szenarien | 20/20 |
| In UAT gefundene Bugs | 8+ |
| Requirements | 31/31 |
