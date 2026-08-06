---
phase: "04"
plan: "01"
subsystem: initiative
tags: [mob-mode, legendary-actions, legendary-resistance, statblock-drawer, wave-0, tdd]
dependency_graph:
  requires: [features/bestiary/bestiary-actions.js, features/initiative.js, features/initiative-extras.js]
  provides:
    - features/initiative-mob.js (parseLegendaryResistanceCount, getMobAlive, calcMobHits, createMobCombatant)
    - features/initiative-statblock.js (showInitStatblockPanel, closeInitStatblockPanel)
  affects: [loader.js, build.py, assets/styles/initiative.css, tests/unit/initiative-mob.test.js, tests/e2e/features/initiative.spec.js]
tech_stack:
  added: []
  patterns:
    - vm.runInContext Unit-Test-Muster (analog srd-monsters.test.js)
    - DMG-Mob-Regel O(1)-Formel (INIT-03 ASSUMED, anchored by test)
    - Dynamisches Modal-Overlay-Muster (analog showConcentrationModal)
    - Build-Dedup-Regel: kein const X=window.X in Funktionen
key_files:
  created:
    - features/initiative-mob.js
    - features/initiative-statblock.js
    - tests/unit/initiative-mob.test.js
  modified:
    - loader.js
    - build.py
    - assets/styles/initiative.css
    - tests/e2e/features/initiative.spec.js
decisions:
  - "DMG-Mob-Regel Formel: hits = floor(count * (21-needed)/20), needed = max(2, AC-bonus); needed>=20 → max(1, floor(count*0.05)). Anker-Case: 10 Goblins +4 vs AC 15 = 5 Treffer."
  - "createMobCombatant ID: window.nextId() wenn verfuegbar, sonst Date.now() Fallback — sicher in Jest-VM-Kontext"
  - "Statblock-Modul: showInitStatblockPanel nutzt window.$ Fallback auf document.getElementById fuer robuste Jest-Kompatibilitaet"
  - "CSS-Tokens: ausschliesslich vorhandene Tokens (--gold, --purple, --red, --green, --yellow, --bg-dark, --bg-card, --border, --text-dim) — keine neuen Tokens eingefuehrt"
metrics:
  duration: "~25 Minuten"
  completed: "2026-06-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 4
---

# Phase 04 Plan 01: Wave-0-Fundament — Mob-Modus + Statblock-Drawer Summary

**Gesamtergebnis:** Zwei neue Initiative-Module mit reiner Logik implementiert, in Build und Loader registriert, vollstaendige CSS-Sektionen angehaengt, 27 Unit-Tests gruengemacht und 3 E2E-describe-Stubs angelegt. Build laeuft sauber durch (1,67 MB, keine Duplikat-Deklarationsfehler).

---

## Completed Tasks

| Task | Name | Commit | Schlüsseldateien |
|------|------|--------|-----------------|
| 1 | Wave-0-Modulgeruest erstellen | 3635437 | features/initiative-mob.js (205 Zeilen), features/initiative-statblock.js (114 Zeilen) |
| 2 | Build/Loader-Registrierung + CSS-Sektionen | 78511a9 | loader.js (+2 Eintraege), build.py (+2 Eintraege), initiative.css (+260 Zeilen) |
| 3 | Unit-Tests + E2E describe-Stubs | 14d7c44 | tests/unit/initiative-mob.test.js (27 Tests), tests/e2e/features/initiative.spec.js (+3 describe-Bloecke) |

---

## Deliverables

### features/initiative-mob.js — Reine Mob-Logik

Vier implementierte Kern-Funktionen:

- **`parseLegendaryResistanceCount(monster)`** — LR-Parsing mit DE/EN-Regex und HTML-String-Fallback fuer Custom-Kreaturen. Gibt 0 zurueck wenn kein Trait gefunden (kein unnötiger Pip-Anzeige, D-06).
- **`getMobAlive(cb)`** — Ceiling-Division `Pool-HP / individualMaxHp`, gibt 0 zurueck bei besiegt, 1 bei Nicht-Mob.
- **`calcMobHits(count, attackBonus, targetAC)`** — O(1) DMG-Mob-Regel ohne Loop: `needed = max(2, AC - bonus)`, `fraction = (21-needed)/20`. Sonderpfad: `needed >= 20` → nur Nat-20-Treffer (5%).
- **`createMobCombatant(monster, count, source)`** — Pool-HP-Summe mit ±10% HP-Variation pro Kreatur (analog bestiary-actions.js). statblockRef korrekt gesetzt (String-ID fuer SRD, numerische ID fuer Custom).

Fuenf Wave-3-Stubs (no-op-safe): `renderMobRow`, `applyMobDamage`, `rollMobAttack`, `setMobAttackMode`, `dissolveMob`.

Alle 9 Funktionen window-exportiert.

### features/initiative-statblock.js — Drawer-Skelett

- **`showInitStatblockPanel(cbId)`** — Dynamisch erzeugtes `.modal-overlay`-Element (analog showConcentrationModal). Overlay-Klick schliesst Drawer. Statblockref → `renderStatblockHTML()` (Wave 1); ohne Ref → `renderBasicCombatantInfo()` (D-03).
- **`closeInitStatblockPanel()`** — Entfernt `.show`-Klasse.
- `renderStatblockHTML()` und `renderBasicCombatantInfo()` als Wave-1-Stubs (geben `''` zurueck).

Kommentar zur kritischen Architektur-Falle: `renderBestiaryDetail()` NICHT aufrufen — tab-spezifisch (RESEARCH.md Falle 1).

### CSS-Sektionen (initiative.css +260 Zeilen)

Vier neue Sektionen, alle Tokens aus variables.css:

1. **Statblock-Drawer (INIT-01):** `.init-statblock-drawer`, `.init-statblock-content`, `@media (max-width: 600px)` Bottom-Sheet.
2. **LA-Pips (INIT-02):** `.la-pips`, `.la-label`, `.la-dots`, `.la-dot`, `.la-dot.active`, `:hover scale(1.15)`.
3. **LR-Pips (INIT-02):** `.lr-pips`, `.lr-label`, `.lr-dots`, `.lr-dot`, `.lr-dot.active`, `.lr-reset-btn`.
4. **Mob-Zeile (INIT-03):** `.init-info--mob`, `.init-mob-alive` (4 Farbvarianten), `.init-mob-controls` (`flex-wrap:wrap`), Modus-Toggle, DMG-Inputs, Attack-Button, Dissolve-Button, `.init-mob-defeated-badge`.

### Unit-Tests (27 Tests, alle gruen)

Titelstruktur:
- `parseLegendaryResistanceCount()` — 7 Tests (DE, EN, leer, null, kein Trait, HTML-String)
- `getMobAlive()` — 5 Tests (Ceiling-Division, defeated, kein-mob)
- `calcMobHits() — INIT-03 / DMG-Mob-Regel` — 5 Tests inkl. **Anker-Case 10/+4/AC15=5**
- `createMobCombatant()` — 10 Tests (count, individualMaxHp, poolHp, name, statblockRef, attackMode)

### E2E describe-Stubs

Drei neue `test.describe` innerhalb `describe('Initiative System', ...)`:
- `describe('statblock', ...)` — 3 `test.skip`-Platzhalter (Wave 1)
- `describe('legendary', ...)` — 6 `test.skip`-Platzhalter (Wave 2)
- `describe('mob', ...)` — 4 `test.skip`-Platzhalter (Wave 3)

Filter `-g "statblock"` / `-g "legendary"` / `-g "mob"` loesen auf nicht-leere Suiten auf.

---

## Deviations from Plan

### Auto-fixed Issues

Keine Bugs gefunden oder gefixt.

### Anpassungen gegenueber Plan-Spezifikation

**1. [Rule 2 - Robustheit] `showInitStatblockPanel` nutzt `window.$` mit Fallback**

- **Gefunden waehrend:** Task 1
- **Issue:** Direkter Aufruf von `$('init-statblock-panel')` wuerde in Jest-VM-Kontext mit `ReferenceError: $ is not defined` scheitern.
- **Fix:** `window.$ ? window.$('init-statblock-panel') : document.getElementById('init-statblock-panel')` — robust in VM und Browser.
- **Dateien:** features/initiative-statblock.js
- **Commit:** 3635437

**2. [Rule 2 - Robustheit] `createMobCombatant` ID-Fallback**

- **Gefunden waehrend:** Task 1
- **Issue:** `nextId('combatants')` ist nicht im Jest-VM-Kontext verfuegbar.
- **Fix:** `window.nextId ? window.nextId('combatants') : Date.now()` — Plan spezifiziert dieses Muster explizit in der `<action>`.
- **Dateien:** features/initiative-mob.js
- **Commit:** 3635437

---

## Threat Surface Scan

Keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Schema-Aenderungen eingefuehrt. Alle neuen Flaechen sind in der Plan-Threat-Table (T-04-01 bis T-04-SC) erfasst:

- **T-04-01 (XSS):** `parseLegendaryResistanceCount` liest Trait-Text — aber nur `match()`/`parseInt()`, kein DOM-Write. Wave 1 traegt `sanitizeHTML()`-Verantwortung.
- **T-04-02 (DoS):** `createMobCombatant` zaehlt `count`-mal — clamped durch `BESTIARY_MAX_QUANTITY=100` upstream; `calcMobHits` ist O(1).

---

## Known Stubs

| Stub | Datei | Zeile | Grund |
|------|-------|-------|-------|
| `renderMobRow()` gibt `''` zurueck | features/initiative-mob.js | ~130 | Wave 3 fuellt vollstaendige Mob-Zeile |
| `applyMobDamage()` ist no-op | features/initiative-mob.js | ~145 | Wave 3 fuellt Pool-HP-Mutation |
| `rollMobAttack()` ist no-op | features/initiative-mob.js | ~157 | Wave 3 fuellt Sammel-Angriff |
| `setMobAttackMode()` ist no-op | features/initiative-mob.js | ~169 | Wave 3 fuellt Modus-Umschaltung |
| `dissolveMob()` ist no-op | features/initiative-mob.js | ~181 | Wave 3 fuellt Mob-Entfernung |
| `renderStatblockHTML()` gibt `''` zurueck | features/initiative-statblock.js | ~30 | Wave 1 fuellt vollstaendigen Statblock |
| `renderBasicCombatantInfo()` gibt `''` zurueck | features/initiative-statblock.js | ~47 | Wave 1 fuellt Basis-Info-Panel |

Diese Stubs sind bewusst und verhindern nicht das Planziel (Wave-0-Fundament legen). Spätere Waves (1-3) ersetzen jeden Stub.

---

## Self-Check

Erstelle-Check fuer alle wichtigen Dateien:
<br>features/initiative-mob.js — FOUND
<br>features/initiative-statblock.js — FOUND
<br>tests/unit/initiative-mob.test.js — FOUND
<br>assets/styles/initiative.css — FOUND (erweiterter Inhalt)

Commit-Check:
<br>3635437 — feat(04-01): Wave-0-Modulgerüst — FOUND
<br>78511a9 — feat(04-01): build/loader Registrierung — FOUND
<br>14d7c44 — test(04-01): Wave-0-Unit-Tests — FOUND

Build-Check: python build.py — PASS (1,672,780 Zeichen, keine Duplikat-Fehler)
Unit-Tests: 27/27 PASS (npm run test:unit initiative-mob)

## Self-Check: PASSED
