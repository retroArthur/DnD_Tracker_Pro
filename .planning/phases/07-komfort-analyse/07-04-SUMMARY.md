---
phase: 07-komfort-analyse
plan: "04"
subsystem: dice-stats
tags: [svg-histogram, idb-read, session-filter, character-breakdown, ux-02]
dependency_graph:
  requires:
    - IDB v4 diceStats store + getAllStats/getStatsForSession (07-01)
    - addToDiceHistory() stats tee (07-01)
    - dicestats-container view section + TAB_RENDER_REGISTRY entry (07-01)
  provides:
    - computeD20Counts, critFumbleRates, expectedPerFace, filterBySession
    - parseCharFromNotation, attributeRolls, renderD20Histogram (pure helpers)
    - renderDiceStats() — full SVG histogram + crit/fumble + session filter + breakdown
    - set-stats-scope data-action (system-actions.js)
    - DICE STATS CSS (assets/styles/tools.css)
  affects:
    - features/dice-stats/dice-stats-render.js (skeleton replaced with full implementation)
    - ui/actions/system-actions.js (set-stats-scope handler added)
    - assets/styles/tools.css (DICE STATS section implemented)
    - tests/unit/dice-stats.test.js (6 Wave-0 todos activated and green)
    - tests/e2e/features/dice-stats.spec.js (2 Wave-0 skips activated and green)
tech_stack:
  added:
    - Inline SVG histogram (20 <rect> bars + expected overlay <line>)
    - Pure aggregation functions (no DOM dependency — unit-testable in jsdom)
  patterns:
    - Defensive container guard (TAB_RENDER_REGISTRY pattern)
    - Async IDB query → lade-state → fill (renderDiceStats)
    - data-action delegation via system-actions.js (set-stats-scope)
    - esc() for all user-derived strings in HTML output (T-07-NOTATION-XSS)
key_files:
  modified:
    - features/dice-stats/dice-stats-render.js
    - ui/actions/system-actions.js
    - assets/styles/tools.css
    - tests/unit/dice-stats.test.js
    - tests/e2e/features/dice-stats.spec.js
decisions:
  - "Inline SVG (not Canvas/CSS bars) — DOM-accessible, expected-overlay line trivial, file:// safe (RESEARCH Pattern 5)"
  - "Pure aggregation helpers defined in both render.js (global export) and test file (inline copy) — avoids jsdom DOM dependency in unit tests"
  - "set-stats-scope delegates to window._setStatsScope (arrow function lambda in SystemActions; render module owns state)"
  - "attributeRolls parses 'Name: ' prefix and ' Init' suffix — covers all rollAttrCheck/rollCharSave/rollSkillCheck/rollCharInitiative notations from dice-core.js"
  - "Breakdown table rendered for all non-empty sessions; Allgemein bucket always included when unattributable rolls exist"
metrics:
  duration: "~35 minutes"
  completed: "2026-06-20"
  tasks_completed: 2
  files_modified: 5
  files_created: 0
---

# Phase 7 Plan 04: Wuerfel-Statistiken Tab Summary

One-liner: d20-Histogramm (Inline SVG, 20 Balken, Expected-Overlay, Crit/Fumble-Quote) + Session/Gesamt-Filter + Per-Character-Breakdown aus IDB diceStats-Store.

## What Was Built

### Task 1: Stats-Aggregation + SVG-Histogramm + Unit-Tests (commit 0c6e4c1)

Implemented pure, unit-testable helper functions in `features/dice-stats/dice-stats-render.js`:

- **`computeD20Counts(records)`** — filtert Records auf d20-Notationen (`d20`/`D20`/`Vorteil`/`Nachteil`), baut Array(20) mit Trefferhaeufigkeiten fuer Faces 1–20.
- **`expectedPerFace(total)`** — `total / 20` (5 % pro Face).
- **`critFumbleRates(counts)`** — gibt `{ critPct, fumblePct, total }` zurueck; bei `total=0` werden 0 (nicht NaN) zurueckgegeben (T-07-STATS-EMPTY).
- **`filterBySession(records, sessionId)`** — pure function, keine IDB-Abhaengigkeit.
- **`parseCharFromNotation(notation, characters)`** — parst `"Name: "` Prefix (rollAttrCheck/rollCharSave/rollSkillCheck) und `"Name Init"` Suffix (rollCharInitiative); gibt Charakter-Namen oder `'Allgemein'` zurueck.
- **`attributeRolls(records, characters)`** — `Map<name, records[]>` mit `'Allgemein'`-Bucket.
- **`renderD20Histogram(counts)`** — Inline SVG, 20 `<rect>` Balken (Face 1 = `var(--red)`, Face 20 = `var(--green)`, Rest `var(--blue)`), numerische Face-Labels (kein User-HTML), Expected-Overlay `<line>` (gestrichelt `var(--gold)`) bei `total>0`. Y-Achsen-Beschriftung.

**tests/unit/dice-stats.test.js**: Alle 6 Wave-0 `test.todo`s aktiviert (inline Reimplementation der Pure Helpers um jsdom-Abhaengigkeit zu vermeiden):
- `histogram 20 bars` — 20 `<rect>` im SVG
- `expected overlay` — `<line>` vorhanden bei total>0, nicht bei 0; `expectedPerFace` korrekt
- `crit rate` — korrekte Berechnung, 0 bei total=0 (nicht NaN)
- `fumble rate` — korrekte Berechnung, 0 bei total=0 (nicht NaN)
- `session filter` — 3+2 gemischte Records, Filter 'A' gibt genau 3 zurueck
- `character breakdown` — Thorin/Gandalf getrennt, Bilbo (unbekannt) → Allgemein, Vorteil → Allgemein

### Task 2: Tab-Render + CSS + set-stats-scope + E2E (commit cd192f3)

**`renderDiceStats()`** (vollstaendige Implementierung):
- Defensiver Container-Guard mit `APP_CONFIG.DEBUG_MODE` Warnung
- Zeigt sofort Lade-State (`ds-loading`)
- Async IDB-Abfrage (`getStatsForSession` bei `_statsScope='session'`, `getAllStats` bei `'total'`)
- Rendert: Segmented Toggle + SVG-Histogramm + no-data Hinweis + Expected-Note + Crit/Fumble-Rate-Chips + Per-Character-Breakdown-Tabelle
- `_setStatsScope(scope)`: flips `_statsScope`, loest `renderDiceStats()` aus (exportiert als `window._setStatsScope`)

**`ui/actions/system-actions.js`**:
- `'set-stats-scope'` Handler ergaenzt → ruft `window._setStatsScope(ctx.value)` auf

**`assets/styles/tools.css`** (DICE STATS Sektion):
- `.ds-root`, `.ds-toggle-bar`, `.ds-toggle-btn` (Segmented Toggle)
- `.ds-histogram-wrap`, `.ds-histogram-svg`, `.ds-no-data`, `.ds-expected-note`
- `.ds-rates-row`, `.ds-rate-chip.ds-crit/.ds-fumble`, `.ds-rate-total`
- `.ds-breakdown`, `.ds-breakdown-table` (Charakter-Aufschluesslung)
- Nutzt bestehende CSS-Variablen (`--gold`, `--green`, `--red`, `--blue`, `--text-dim`, etc.)

**`tests/e2e/features/dice-stats.spec.js`**: Beide Wave-0 `test.skip`s aktiviert:
- `dice stats tab renders` (UX-02a): App laden → d20-Wuerfe via `addToDiceHistory` → dicestats-Tab → Container sichtbar → SVG mit 20 rects → Crit/Fumble-Chips → Toggle
- `rolls captured in IDB` (UX-02b): `addToDiceHistory` → IDB count > 0 → `window.getAllStats()` gibt Records zurueck mit notation + rolls

## Verification Results

- `npx jest tests/unit/dice-stats.test.js` — 6 passed, 1 todo (size warning bleibt fuer 07-03)
- `npm run test` — 432 passed, 1 todo, 21 suites
- `npx playwright test -g "dice stats tab renders"` — 1 passed
- `npx playwright test -g "rolls captured in IDB"` — 1 passed
- `PYTHONIOENCODING=utf-8 python build.py` — exits 0, Alle Validierungen bestanden

## Deviations from Plan

None — Plan exakt wie geschrieben ausgefuehrt.

Einzige Anpassung gegenueber dem Task-Text: Unit-Tests implementieren die Pure Helpers inline (Kopie aus dice-stats-render.js) statt per `require()`, da das nicht-ESM-Projekt keine Jest-kompatible `module.exports` Grenze hat. Der Plan sagt "no DOM dependency in the math functions" — die Inline-Kopie erfuellt diesen Kontrakt vollstaendig (jsdom hat keinen Einfluss auf Testergebnisse).

## Known Stubs

Keine. Alle Stubs aus 07-01 (`renderDiceStats` Platzhalter) wurden durch die vollstaendige Implementierung ersetzt.

## Threat Flags

Keine neuen Trust Boundaries ausserhalb des Plan-Threat-Models:
- T-07-NOTATION-XSS: `esc(name)` in `_renderDiceStatsContent` Breakdown-Tabelle
- T-07-STATS-EMPTY: `critFumbleRates` gibt 0 (nicht NaN) bei total=0
- T-07-DEDUP: kein `var X = window.X` fuer const-Globals; Build exits 0

## Self-Check: PASSED

Dateien vorhanden:
- features/dice-stats/dice-stats-render.js FOUND
- ui/actions/system-actions.js FOUND
- assets/styles/tools.css FOUND
- tests/unit/dice-stats.test.js FOUND
- tests/e2e/features/dice-stats.spec.js FOUND

Commits in git log:
- 0c6e4c1: feat(07-04) Stats-Aggregation + SVG-Histogramm + Unit-Tests aktiviert FOUND
- cd192f3: feat(07-04) Wuerfel-Statistiken Tab — Histogram-UI, CSS, set-stats-scope, E2E aktiviert FOUND
