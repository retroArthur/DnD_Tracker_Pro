---
phase: "04"
plan: "03"
subsystem: initiative
tags: [legendary-actions, legendary-resistance, pips, D-07, D-10, e2e]
dependency_graph:
  requires:
    - features/initiative-mob.js (parseLegendaryResistanceCount — Wave 0)
    - features/initiative.js (renderDeathSaves, toggleDeathSave als Analogie)
    - features/bestiary/bestiary-actions.js (addBestiaryToInitiative)
    - ui/actions/combat-actions.js (CombatActions handler registry)
  provides:
    - renderLegendaryActionPips / renderLegendaryResistancePips (conditional in renderInit)
    - useLA / useLR / resetLR (pip toggle + reset handler)
    - nextTurn LA-auto-reset (D-10, round-wrap)
    - LA/LR field init on bestiary combatants
    - init-use-la-stop / init-use-lr-stop / init-reset-lr-stop data-actions
  affects:
    - tests/e2e/features/initiative.spec.js (6 neue gruene Tests)
tech_stack:
  added: []
  patterns:
    - Death-Save-Dot-Analogie (renderDeathSaves / toggleDeathSave → renderLegendaryActionPips / useLA)
    - -stop-Suffix + stopPropagation-Muster (analog toggle-death-save-stop)
    - evaluate()-basierte E2E-Rundensteuerung (analog statblock-Tests Wave 1)
    - D-07 Deliberate Deviation (LR kein Auto-Reset — Regelkorrektheit)
key_files:
  created: []
  modified:
    - features/initiative.js
    - features/bestiary/bestiary-actions.js
    - ui/actions/combat-actions.js
    - tests/e2e/features/initiative.spec.js
decisions:
  - "D-07 (deliberate): LR resetten NICHT automatisch bei Rundenuebergang — Auto-Reset wuerde Boss effektiv immun gegen Rettungswuerfe machen (unbegrenzte Wiederherstellung). Manueller Reset via lr-reset-btn statt dessen."
  - "nextTurn()-Aufrufe in E2E via page.evaluate() statt UI-Button-Klick: Initiative-Naechster-Button hat data-action=call/data-value=nextTurn, nicht data-action=next-turn. evaluate() ist zuverlaessiger und deterministischer."
  - "LA/LR-Felder werden einmalig pro addBestiaryToInitiative()-Aufruf berechnet (laCount/lrCount) und fuer alle count-Exemplare angewendet — kein redundanter parseLegendaryResistanceCount-Aufruf pro Schleifeniterierung."
metrics:
  duration: "~15 Minuten"
  completed: "2026-06-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 4
---

# Phase 04 Plan 03: INIT-02 Legendäre Aktionen/Resistenzen Pips Summary

**Gesamtergebnis:** LA/LR-Pip-System implementiert und mit 6 E2E-Tests gruengemacht. LA resetten sich regelkonform bei jedem Rundenuebergang (D-10); LR haben bewusst keinen Auto-Reset und werden nur manuell zurueckgesetzt (D-07). Build sauber, keine Duplikat-Deklarationsfehler.

---

## Completed Tasks

| Task | Name | Commit | Schlüsseldateien |
|------|------|--------|-----------------|
| 1 | LA/LR pips render + use/reset handlers + nextTurn LA-reset | cedf961 | features/initiative.js (+97 Zeilen) |
| 2 | Init LA/LR Felder auf Bestiary-Kombattanten + Handler registrieren | 658b818 | features/bestiary/bestiary-actions.js, ui/actions/combat-actions.js |
| 3 | Legendary E2E Suite (6 Tests gruen incl. D-07) | dbc8fc9 | tests/e2e/features/initiative.spec.js (+170 Zeilen) |

---

## Deliverables

### features/initiative.js — LA/LR Pip-System

Fuenf neue Funktionen (analog renderDeathSaves / toggleDeathSave — D-08):

- **`renderLegendaryActionPips(cb)`** — Gibt `''` zurueck wenn kein `cb.legendaryActions` oder `max <= 0`. Rendert `div.la-pips` mit Gold-Stern-Label "⭐ LA", `div.la-dots` mit N Dots (`.la-dot[.active]`), `data-action="init-use-la-stop"`. Container-Title: "Setzt sich bei Initiative 20 zurueck".
- **`renderLegendaryResistancePips(cb)`** — Analog fuer LR. `div.lr-pips` (Title: "Pro Tag — kein automatischer Reset"), `div.lr-dots` mit `.lr-dot[.active]`s, plus `button.lr-reset-btn` mit `data-action="init-reset-lr-stop"`.
- **`useLA(cbId, index)`** — Toggle-Logik exakt wie `toggleDeathSave()`: `index < remaining → remaining = index` else `remaining = index + 1`. Dann `renderInit() + save()`.
- **`useLR(cbId, index)`** — Identisch fuer `cb.legendaryResistance.remaining`.
- **`resetLR(cbId)`** — Setzt `cb.legendaryResistance.remaining = cb.legendaryResistance.max`. Dann `renderInit() + save()`.

**renderInit():** Beide Pip-Bloecke konditional nach Concentration-Check eingefuegt (nur wenn Feld vorhanden und `max > 0`). Lair-Zeile bleibt unberuehrt.

**nextTurn() LA-Reset (D-10):** Im Round-Wrap-if-Block nach `init.round++` wird `forEach` ueber alle Combatants aufgerufen; wenn `c.legendaryActions && c.legendaryActions.max > 0` → `c.legendaryActions.remaining = c.legendaryActions.max`. Kommentare: `// D-10: LA-Reset bei Rundenübergang` und `// D-07: LR KEIN Auto-Reset`.

### features/bestiary/bestiary-actions.js — LA/LR Feld-Initialisierung

- `laCount = monster.legendaryActionsPerRound || 0` — einmal vor der Schleife berechnet.
- `lrCount = window.parseLegendaryResistanceCount(monster)` — wenn verfuegbar, sonst 0.
- Per Exemplar: `combatant.legendaryActions = { max: laCount, remaining: laCount }` wenn `laCount > 0`.
- Per Exemplar: `combatant.legendaryResistance = { max: lrCount, remaining: lrCount }` wenn `lrCount > 0`.
- Runtime-only Felder — keine Datenmigration noetig.

### ui/actions/combat-actions.js — Handler-Registrierung

Drei neue Handler (Abschnitt INIT-02) mit `-stop`-Suffix + `stopPropagation()`:
- `'init-use-la-stop'` → `useLA(ctx.id, parseInt(ctx.target.dataset.index))`
- `'init-use-lr-stop'` → `useLR(ctx.id, parseInt(ctx.target.dataset.index))`
- `'init-reset-lr-stop'` → `resetLR(ctx.id)`

### tests/e2e/features/initiative.spec.js — 6 Tests, alle gruen

| Test | Assertion | Ergebnis |
|------|-----------|---------|
| A: LA-Pips erscheinen | `.la-pips` und 3 `.la-dot`s bei Boss; keine `.la-pips` bei Goblin | PASS |
| B: Pip-Klick reduziert LA | Klick auf Dot[0] → 0 aktive Dots | PASS |
| C: LA Auto-Reset (D-10) | Nach `nextTurn()` x2 → 3 aktive Dots (LA vollstaendig) | PASS |
| D: LR-Pips erscheinen | `.lr-pips` und 3 `.lr-dot`s und `.lr-reset-btn` bei Boss | PASS |
| E: D-07 LR kein Auto-Reset | Nach `nextTurn()` x2 → 0 aktive Dots (unveraendert) | PASS |
| F: Manueller LR-Reset | Klick auf `.lr-reset-btn` → 3 aktive Dots wiederhergestellt | PASS |

---

## Deviations from Plan

### D-07 Deliberate Deviation (Plan-Konform dokumentiert)

**D-07: LR KEIN Auto-Reset bei Rundenuebergang**

- **Begruendung:** Auto-Reset wuerde den Boss-Gegner effektiv immun gegen Rettungswuerfe machen (3 LR pro Runde = unbegrenzte Wiederherstellung). Die Roadmap-SC2-Formulierung ("auto-resets at round wrap") bezieht sich nur auf LA; LR sind per D&D-5e-Regeln /Tag und werden durch eine Lange Rast zurueckgesetzt.
- **Implementierung:** `nextTurn()` beruehrt `legendaryResistance` nie. Manueller Reset via `lr-reset-btn` → `resetLR()`.
- **Test-Lock:** Test E ("LR resetten NICHT bei legendary Rundenuebergang") assertiert dieses Verhalten explizit — Regression wird sofort erkannt.

### Anpassungen gegenueber Plan-Spezifikation

**1. [Rule 3 - Blocking] E2E verwendet page.evaluate(nextTurn) statt UI-Button-Klick**

- **Gefunden waehrend:** Task 3 (E2E-Lauf Fehler: Timeout bei `[data-action="next-turn"]`)
- **Issue:** Nächster-Turn-Button in view-encounters.html nutzt `data-action="call" data-value="nextTurn"`, NICHT `data-action="next-turn"`. Der Selektor `[data-action="next-turn"]` ist im DOM nicht vorhanden → Timeout nach 30 s.
- **Fix:** `page.evaluate(() => { if (typeof window.nextTurn === 'function') window.nextTurn(); })` — deterministisch, kein Selektor-Abhaengigkeitsrisiko.
- **Dateien:** tests/e2e/features/initiative.spec.js
- **Commit:** dbc8fc9

---

## Threat Surface Scan

Keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Schema-Aenderungen eingefuehrt.

| Drohung | Massnahme | Status |
|---------|-----------|--------|
| T-04-07: parseLegendaryResistanceCount ueber Trait-Text | Regex + parseInt, kein DOM-Write, kein eval. Gibt 0 bei keinem Treffer | Mitigiert |
| T-04-08: XSS durch cb.id/data-index in Pip-HTML | cb.id = interne numerische ID; data-index = Schleifen-Integer. parseInt() in Handler. Kein roher User-Text in Pip-HTML | Mitigiert |
| T-04-09: Pip-Dot-Schleife laueft max-mal | max aus legendaryActionsPerRound (0-3) oder LR-Count (typischerweise 3) — nicht unbegrenzt | Mitigiert |

---

## Known Stubs

Keine neuen Stubs eingefuehrt. Alle LA/LR-Pip-Funktionen sind vollstaendig implementiert.

---

## Self-Check

Datei-Check:
features/initiative.js — FOUND (renderLegendaryActionPips, useLA, useLR, resetLR)
features/bestiary/bestiary-actions.js — FOUND (legendaryActions, legendaryResistance Felder)
ui/actions/combat-actions.js — FOUND (init-use-la-stop, init-use-lr-stop, init-reset-lr-stop)
tests/e2e/features/initiative.spec.js — FOUND (6 legendary Tests, keine test.skip)

Commit-Check:
cedf961 — feat(04-03): LA/LR pips render + use/reset handlers + nextTurn LA-reset — FOUND
658b818 — feat(04-03): init LA/LR fields on bestiary combatants + register pip handlers — FOUND
dbc8fc9 — test(04-03): legendary E2E suite gruen (6/6 Tests, incl. D-07 no-auto-reset) — FOUND

Build-Check: python build.py → PASS (2,565,434 Zeichen, keine Duplikat-Deklarationsfehler)
E2E legendary subset: 6/6 PASS (3.4 s)
D-07 no-auto-reset: explizit assertiert (Test E)

## Self-Check: PASSED
