---
phase: 06-spieler-verwaltung
plan: 03
subsystem: party
tags: [char-03, skills, proficiencies, expertise, attacks, clickable-rolls, dice-history]
dependency_graph:
  requires: [06-01, 06-02]
  provides: [skill-editor, expertise-editor, attacks-editor, clickable-skill-rolls, clickable-save-rolls, clickable-attr-rolls, clickable-attack-rolls]
  affects: [party-details, party-crud, entity-actions, view-party.html, party.css, dice-core]
tech_stack:
  added: []
  patterns: [roll-char-*-stop handlers, sanitize-then-dice, dedicated attack roll handler, diceHistory window export]
key_files:
  created: []
  modified:
    - assets/templates/view-party.html
    - features/party/party-crud.js
    - features/party/party-details.js
    - ui/actions/entity-actions.js
    - assets/styles/party.css
    - features/dice/dice-core.js
    - tests/e2e/features/character-advancement.spec.js
decisions:
  - "roll-char-attack-stop uses dedicated handler (not bestiary-roll-dice/rollQrefDice) — rollQrefDice does not call addToDiceHistory (A2 from RESEARCH.md)"
  - "window.diceHistory exported from dice-core.js to enable E2E test history-length assertion"
  - "Attack spans use hand-crafted data-action=roll-char-attack-stop with data-value= for E2E assertion compat"
  - "calcSkillModifier global (wave 1) called directly — no reimplementation"
  - "getProficiencyBonus used in template for save modifier calculation"
metrics:
  duration: "~45 minutes"
  completed: "2026-06-15"
  tasks: 2
  files: 7
---

# Phase 06 Plan 03: Erweiterte Charakterwerte — Skills, Angriffe, klickbare Würfe (CHAR-03)

**One-liner:** 18 Skill-Proficiency/Expertise-Checkboxen + freie Angriffsliste im Editor; Skills/Saves/Attribute/Angriffe als klickbare W20-Würfe mit Vorteil/Nachteil im Detail-Modal.

---

## What Was Built

### Task 1: Editor — Skill/Expertise-Checkboxen + Angriffsliste (88b7752)

**view-party.html:**
- `cf-skills-panel` mit 18 Proficiency-Checkboxen (`char-skill-${key}`) + 18 Expertise-Checkboxen (`char-skill-exp-${key}`), gruppiert nach Attribut (STR/DEX/INT/WIS/CHA)
- `cf-attacks-panel` mit `cf-attacks-container` und "+ Angriff"-Button (`data-action="add-attack"`)

**features/party/party-crud.js:**
- `saveCharacter()`: liest `skillProficiencies` + `skillExpertise` über SKILL_KEYS-Loop; sammelt `attacks[]` aus Formular-Rows mit Damage-Whitelist `/^\d+[dD]\d+([+-]\d+)?$/` und 20-Eintrags-DoS-Cap; beide Felder im `ch`-Literal
- `editChar()`: befüllt 18 Skill/Expertise-Checkboxen und `cf-attacks-container` via `buildAttackRowHTML()`
- `cancelCharEdit()`: leert Skill-Checkboxen und Angriffs-Container
- `buildAttackRowHTML(atk)`: neuer Helper, window-exportiert

**ui/actions/entity-actions.js:**
- `add-attack`: fügt Zeile via `window.buildAttackRowHTML({})` hinzu, respektiert 20-Cap
- `delete-attack`: entfernt `.cf-attack-row` via `closest()`

**assets/styles/party.css:**
- `.cf-skills-*` Sections (Grid, Attr-Labels, Skill-Rows, Expertise-Sub-Checkbox)
- `.cf-attacks-*` Sections (Panel, Header, Container, Rows)
- `.char-roll-btn`, `.char-adv-btn`, `.char-skill-item`, `.char-save-box`, `.char-attack-entry` für Modal

### Task 2: Detail-Modal + klickbare Würfe + E2E (ea9a64c)

**features/party/party-details.js (`showCharacterDetails`):**
- Attribut-Grid: jede Box jetzt `data-action="roll-char-attr-stop" data-attr="${attr}"` + Adv/Disadv Mini-Buttons
- Skills-Sektion: alle 18 Skills aus SKILL_INFO, nach Attribut gruppiert, mit `calcSkillModifier()`-Modifikator, proficient/expertise-Klassen, `data-action="roll-char-skill-stop" data-skill="${key}"`
- Rettungswürfe-Sektion: alle 6 Saves als klickbare Boxen mit `roll-char-save-stop` + berechneter Modifier
- Angriffs-Sektion: pro Angriff Treffer-Span `data-action="roll-char-attack-stop" data-value="1d20+N"` und Schaden-Span `data-action="roll-char-attack-stop" data-value="NdN+N"` (hand-crafted statt renderClickableDice, damit addToDiceHistory sicher aufgerufen wird)

**ui/actions/entity-actions.js:**
- `roll-char-skill-stop`: stopPropagation → EntityLookup.character → calcSkillModifier → parseDiceNotation(1d20/2d20kh1/2d20kl1) → displayDiceResult + addToDiceHistory
- `roll-char-save-stop`: stopPropagation → attrMod + (saveProficient ? profBonus : 0) → parseDiceNotation → displayDiceResult + addToDiceHistory
- `roll-char-attr-stop`: stopPropagation → attrMod → parseDiceNotation → displayDiceResult + addToDiceHistory
- `roll-char-attack-stop`: stopPropagation → parseDiceNotation(formula aus data-formula/data-value) → displayDiceResult + addToDiceHistory

**features/dice/dice-core.js:**
- `window.diceHistory = diceHistory` Export hinzugefügt für E2E-History-Längen-Assertion

**tests/e2e/features/character-advancement.spec.js:**
- 4 CHAR-03 Tests von `test.fixme` auf `test` (aktiv) umgestellt:
  - STR-Attribut-Box Klick → History steigt
  - Heimlichkeit-Skill Klick (Expertise) → History steigt
  - Angriff +5/1d6+3 → data-value Spans sichtbar im Modal
  - Angriffs-Trefferwurf Klick → History steigt
- 4 CHAR-01 Wave-4 Tests bleiben `test.fixme` (für 06-04)

---

## Data-Action Names (für Wave 4 Referenz)

| Handler | Scope | Data attributes |
|---------|-------|-----------------|
| `roll-char-skill-stop` | Detail-Modal, skill items | `data-id`, `data-skill`, `data-adv` |
| `roll-char-save-stop` | Detail-Modal, save boxes | `data-id`, `data-attr`, `data-adv` |
| `roll-char-attr-stop` | Detail-Modal, attr boxes | `data-id`, `data-attr`, `data-adv` |
| `roll-char-attack-stop` | Detail-Modal, attack spans | `data-id`, `data-formula`, `data-value`, `data-label` |
| `add-attack` | Char editor, "+ Angriff" button | — |
| `delete-attack` | Char editor, remove button per row | — |

**Attack row id scheme** (form inputs, no explicit id):
- `.cf-attack-row` container per attack
- `.cf-attack-name` (text), `.cf-attack-bonus` (number), `.cf-attack-damage` (text), `.cf-attack-type` (text), `.cf-attack-remove` (remove button)

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing critical functionality] window.diceHistory export**
- **Found during:** Task 2, E2E run #1 — 3 of 4 CHAR-03 tests failing with historyAfter = 0
- **Issue:** `diceHistory` in dice-core.js ist `let` ohne window-Export; E2E liest `window.diceHistory` → undefined → `(undefined || []).length === 0`
- **Fix:** `window.diceHistory = diceHistory` am Ende von dice-core.js; setzt window-Property auf dieselbe Array-Referenz → `.unshift()` Mutationen sind sofort sichtbar
- **Files modified:** `features/dice/dice-core.js`
- **Commit:** ea9a64c

**2. [Rule 1 — Bug] rollQrefDice ruft addToDiceHistory nicht auf (Assumption A2)**
- **Found during:** Task 2, E2E run #1 — Angriffs-Trefferwurf-Test schlägt fehl (historyAfter = 0 trotz diceHistory-Export-Fix bei anderem Test)
- **Issue:** RESEARCH.md Assumption A2 bestätigt: `rollQrefDice` (Ziel von `bestiary-roll-dice`) ruft nur `showToast` + `window.addToHistory` (nicht `addToDiceHistory`) auf — Würfe landen nicht in `diceHistory`
- **Fix:** Angriffs-Spans in party-details.js verwenden statt `renderClickableDice()` (→ bestiary-roll-dice) hand-crafted `<span data-action="roll-char-attack-stop">` Spans; neuer `roll-char-attack-stop`-Handler in entity-actions.js routed direkt zu `displayDiceResult` + `addToDiceHistory`
- **Files modified:** `features/party/party-details.js`, `ui/actions/entity-actions.js`
- **Commit:** ea9a64c

---

## Threat Surface Scan

Keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Schema-Änderungen an Trust-Grenzen. Alle Bedrohungen aus dem Plan-Threat-Register wurden mitigiert:

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-06-07 | `esc(atk.name)` + `esc(atk.damageType)` vor Span-Konstruktion | mitigiert |
| T-06-08 | Damage-Whitelist `/^\d+[dD]\d+([+-]\d+)?$/` in saveCharacter | mitigiert |
| T-06-09 | `MAX_ATTACKS = 20` cap in saveCharacter + add-attack handler | mitigiert |
| T-06-10 | Alle Roll-Handler sind `-stop`-Varianten mit `ctx.event.stopPropagation()` | mitigiert |

---

## Known Stubs

Keine Stubs — alle Phase-03-Anforderungen vollständig implementiert. Wave-4 CHAR-01 Felder (xp, levelingMode) bleiben `.fixme` Tests bis 06-04.

---

## Test Results

- `npx jest tests/unit/character-advancement.test.js`: **49/49 tests pass**
- `npx playwright test tests/e2e/features/character-advancement.spec.js`: **4 passed, 4 skipped (Wave-4 fixme)**
- `python build.py`: **Kein Dedup-/Orphan-Fehler**, Build clean

## Self-Check: PASSED

Files created/modified:
- `assets/templates/view-party.html` — FOUND (18 char-skill-exp- checkboxes confirmed)
- `features/party/party-crud.js` — FOUND (skillExpertise: 4 occurrences, DoS cap: confirmed)
- `features/party/party-details.js` — FOUND (roll-char-skill-stop: 9 occurrences)
- `ui/actions/entity-actions.js` — FOUND (roll-char-attack-stop handler)
- `assets/styles/party.css` — FOUND (cf-skills-*, cf-attacks-*, char-roll-btn sections)
- `features/dice/dice-core.js` — FOUND (window.diceHistory export)
- `tests/e2e/features/character-advancement.spec.js` — FOUND (4 active tests, 4 fixme)

Commits:
- 88b7752 — FOUND
- ea9a64c — FOUND
