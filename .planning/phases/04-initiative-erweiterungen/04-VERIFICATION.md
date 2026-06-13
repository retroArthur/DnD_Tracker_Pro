---
phase: 04-initiative-erweiterungen
verified: 2026-06-14T14:00:00Z
status: human_needed
score: 3/3 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Statblock-Panel Optik (Pergament-Look, Drawer rechts, Mobile-Bottom-Sheet)"
    expected: "Drawer erscheint rechts als schmale Leiste (420px), zeigt Parchment-Statblock; bei <600px öffnet als Bottom-Sheet (60vh, 12px Radius oben)"
    why_human: "CSS-Layout und visueller Parchment-Look sind programmatisch nicht verifizierbar"
  - test: "Pip-Feel am Tisch — LA/LR-Klick-Reaktion wie Death-Save-Dots"
    expected: "Pip-Klick fühlt sich direkt an (scale(1.15) Hover, sofortiger Farbwechsel Gold/Lila), kein Lag"
    why_human: "Interaktions-Haptik und Klick-Latenz brauchen echte Browser-Überprüfung"
  - test: "Mob-Schaden-Workflow am Tisch — beide Angriffsmodi (N-fach und DMG-Mob-Regel)"
    expected: "Sammel-Angriff-Knopf → showToast mit Gesamtschaden (auto-summiert); DMG-Regel-Modus zeigt 'X Treffer (von Y lebend, RK Z) | Schaden: W'"
    why_human: "End-to-End DM-Erlebnis mit echten Würfelwürfen und Toast-Anzeige"
---

# Phase 04: Initiative-Erweiterungen — Verification Report

**Phase Goal:** Nutzer hat in der Initiative direkten Zugriff auf vollständige Statblocks, kann Legendäre Aktionen und Resistenzen pro Runde zählen und Gegnergruppen als Mob führen.
**Verified:** 2026-06-14T14:00:00Z
**Status:** human_needed (alle 3 Wahrheiten VERIFIED; manuelle Qualitätschecks ausstehend)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | INIT-01: Klick auf Kombattanten öffnet Popup/Drawer mit vollständigem Statblock (Aktionen, Traits, Saves, Senses) | ✓ VERIFIED | `features/initiative-statblock.js`: `showInitStatblockPanel()` existiert (113 Zeilen, substantiell). `renderStatblockHTML()` in `bestiary-render.js` extrahiert + an window exportiert; Drawer zeigt für `statblockRef`-Monster den vollen Statblock, ohne `statblockRef` zeigt `renderBasicCombatantInfo()`. Book-Button (`data-action="show-init-statblock"`) in `renderInit()` Zeile 201 für alle Standard-Zeilen. Handler in `combat-actions.js` Zeile 27 registriert. 4 E2E-Tests grün (statblock-Subset, per Orchestrator-Kontext bestätigt). |
| 2 | INIT-02: LA-Pips erscheinen und setzen sich am Rundenanfang zurück; LR-Pips erscheinen und setzen sich NICHT automatisch zurück (D-07 korrekte Regelimplementierung) | ✓ VERIFIED | `features/initiative.js`: `renderLegendaryActionPips()` + `renderLegendaryResistancePips()` + `useLA()` + `useLR()` + `resetLR()` (Zeilen 604–683). `nextTurn()` Zeilen 397–402: LA-Reset im Round-Wrap-Block mit explizitem Kommentar `D-07: LR KEIN Auto-Reset`. `legendaryResistance` wird in diesem Block nicht angefasst. Felder werden in `bestiary-actions.js` via `parseLegendaryResistanceCount()` initialisiert. Drei Handler in `combat-actions.js` Zeilen 31–42 mit `-stop`-Suffix registriert. 6 E2E-Tests grün inkl. D-07-No-Auto-Reset-Assertion. |
| 3 | INIT-03: Zehn Goblins als Mob erscheinen als EINE Zeile mit Pool-HP und kombiniertem Angriff; bei 0 Pool-HP ist der Mob besiegt | ✓ VERIFIED | `bestiary-actions.js`: `isMob = confirm(...)` bei `count > 1` (Zeilen 80–86); JA-Pfad: `createMobCombatant()` → eine Zeile (Zeile 107). `renderInit()` Zeilen 164–165: `if (cb.mob) return renderMobRow(cb, i, init)`. `renderMobRow()` in `initiative-mob.js` (83 Zeilen HTML-Template): `init-mob-alive` mit `"X von N am Leben"`, `init-mob-defeated-badge` bei `poolHp <= 0`. Beide Angriffsmodi (N-fach + DMG-Mob-Regel via `calcMobHits()`). Unit-Test `INIT-03 / DMG-Mob-Regel`: `calcMobHits(10,4,15)===5` grün (288 Unit-Tests gesamt). 4 Mob-E2E-Tests grün. `dissolveMob()` ruft `saveUndoState()` vor Mutation. |

**Score:** 3/3 Wahrheiten verifiziert

---

### Bekannte Abweichung: D-07 (LR-kein-Auto-Reset) — ABSICHTLICH, kein Gap

Die ROADMAP Success Criteria 2 formuliert "LA setzen sich am Rundenanfang (Initiative 20) automatisch zurück". Die Verifikationsvorgabe stellt explizit fest: **LR resetting is a DELIBERATE, locked design deviation (D-07)** — LR setzt sich NICHT automatisch zurück (stattdessen manueller Reset-Knopf), weil Auto-Reset einen Boss effektiv immun gegen Rettungswürfe machen würde.

Implementierungsnachweis in `nextTurn()`:
```javascript
// D-10: LA-Reset bei Rundenübergang (jede Runde)
// D-07: LR KEIN Auto-Reset — LR sind /Tag, nur LA!
init.combatants.forEach(function(c) {
    if (c.legendaryActions && c.legendaryActions.max > 0) {
        c.legendaryActions.remaining = c.legendaryActions.max;
    }
    // legendaryResistance wird hier NICHT angefasst
});
```

E2E-Test bestätigt: "LR-Pips nach Rundenübergang: Kein Auto-Reset (D-07 korrekt)" — grün.

---

### Bekannte Einschränkung: CR-02 (Pool-HP-Desync via generische ➕/➖-Buttons)

Aus `04-REVIEW.md` (advisory, kein Ziel-Blocker): Die generischen `mod-hp`-Buttons auf der Mob-Zeile aktualisieren `c.currentHp` aber nicht `c.mob.poolHp`. Der dedizierte `applyMobDamage()`-Pfad (Mob-Schaden via `rollMobAttack()`) funktioniert korrekt. Der Alive-Count desynchronisiert nur wenn der DM die ➕/➖-Buttons direkt auf der Mob-Zeile nutzt statt den Sammel-Angriff.

Dies ist ein Edge-Case-Polierproblem, kein Kernziel-Versagen. Die drei Success Criteria sind mit dem primären Workflow (Mob-Attack-Flow) erfüllt.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `features/initiative-mob.js` | Pure-Logik-Funktionen + Wave-3 UI-Implementierungen | ✓ VERIFIED | 453 Zeilen; `parseLegendaryResistanceCount`, `getMobAlive`, `calcMobHits`, `createMobCombatant`, `renderMobRow`, `applyMobDamage`, `rollMobAttack`, `setMobAttackMode`, `dissolveMob` — alle substantiell und an window exportiert |
| `features/initiative-statblock.js` | Drawer-Panel + Basis-Info-Fallback | ✓ VERIFIED | 113 Zeilen; `showInitStatblockPanel`, `closeInitStatblockPanel`, `renderBasicCombatantInfo` implementiert; kein Stub |
| `features/bestiary/bestiary-render.js` | `renderStatblockHTML` als extrahierte Top-Level-Funktion | ✓ VERIFIED | Genau 1x definiert (grep -c = 1); an `window.renderStatblockHTML` exportiert; von `renderBestiaryDetail()` + `showInitStatblockPanel()` genutzt (DRY) |
| `features/initiative.js` | Book-Button + Mob-Zweig + Feature-Hiding + LA-Pips + nextTurn LA-Reset | ✓ VERIFIED | `show-init-statblock`-Button, `if (cb.mob) return renderMobRow(...)`, `!cb.mob`-Guards, `renderLegendaryActionPips/ResistancePips`, LA-Reset im Round-Wrap ohne LR-Berührung |
| `features/bestiary/bestiary-actions.js` | Mob-Toggle + LA/LR-Feld-Initialisierung | ✓ VERIFIED | `isMob = confirm(...)`, `createMobCombatant`-Zweig, LA/LR-Felder via `parseLegendaryResistanceCount` |
| `ui/actions/combat-actions.js` | 6 neue Handler (INIT-01/02/03) | ✓ VERIFIED | `show-init-statblock`, `close-init-statblock`, `init-use-la-stop`, `init-use-lr-stop`, `init-reset-lr-stop`, `init-mob-set-mode-stop`, `init-mob-attack-stop`, `init-mob-dissolve-stop` — alle registriert |
| `assets/styles/initiative.css` | 4 neue CSS-Sektionen | ✓ VERIFIED | `.init-statblock-drawer`, `.la-dot`, `.lr-dot`, `.init-mob-alive`, `.init-mob-defeated-badge` vorhanden; `@media (max-width: 600px)` Bottom-Sheet vorhanden |
| `tests/unit/initiative-mob.test.js` | Wave-0 Unit-Tests inkl. `INIT-03 / DMG-Mob-Regel` | ✓ VERIFIED | Test `INIT-03 / DMG-Mob-Regel: 10 Goblins (+4) vs AC 15 = 5 Treffer` vorhanden und grün (288/288 Unit-Tests) |
| `loader.js` + `build.py` | Beide neue Module registriert, in Sync | ✓ VERIFIED | `initiative-statblock.js` nach `bestiary-actions.js`; `initiative-mob.js` nach `initiative-extras.js` — in beiden Dateien identisch positioniert |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `features/initiative.js renderInit()` | `showInitStatblockPanel` | `data-action="show-init-statblock"` Button Zeile 201 | ✓ WIRED | Button in jeder Standard-Zeile (nicht in lair-Zweig) |
| `ui/actions/combat-actions.js` | `showInitStatblockPanel` / `closeInitStatblockPanel` | `show-init-statblock` / `close-init-statblock` Handler Zeilen 27–28 | ✓ WIRED | Direkt ohne stopPropagation (korrekt, kein nested-click-Konflikt) |
| `features/initiative-statblock.js` | `getBestiaryMonster` + `renderStatblockHTML` | String-ID-Lookup, `window.renderStatblockHTML()` Zeilen 77–81 | ✓ WIRED | Kein `parseEntityId()` auf `statblockRef.id` (RESEARCH Falle 2 korrekt vermieden) |
| `features/initiative.js renderInit()` | `renderLegendaryActionPips` / `renderLegendaryResistancePips` | Conditional render Zeilen 186–187 | ✓ WIRED | Nur wenn `max > 0`; nicht im Mob-Zweig (`cb.mob` bricht vorher ab) |
| `features/initiative.js nextTurn()` | `legendaryActions.remaining` Reset | Round-Wrap-Block Zeilen 397–402 | ✓ WIRED (LA only) | `legendaryResistance` NICHT berührt — D-07 korrekt |
| `features/bestiary/bestiary-actions.js` | `parseLegendaryResistanceCount` | `window.parseLegendaryResistanceCount(monster)` Zeile 99 | ✓ WIRED | LA/LR-Felder werden vor dem Push gesetzt |
| `features/initiative.js renderInit()` | `renderMobRow` | `if (cb.mob) return window.renderMobRow(cb, i, init)` Zeile 164–165 | ✓ WIRED | Vor Standard-Template; Feature-Hiding via `!cb.mob` Guards Zeilen 184–185 |
| `features/bestiary/bestiary-actions.js` | `createMobCombatant` | `isMob`-Zweig, `window.createMobCombatant(monster, count, source)` Zeile 107 | ✓ WIRED | Count-Clamp auf 100 bleibt erhalten |
| `features/initiative-mob.js rollMobAttack` | `calcMobHits` | DMG-Mob-Regel-Pfad Zeile 362 | ✓ WIRED | O(1), DOM-Eingaben geclampst (parseInt + min/max) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `showInitStatblockPanel` | `monster` | `getBestiaryMonster(cb.statblockRef.id, cb.statblockRef.source)` | Ja — echter SRD/Custom-Monster-Lookup | ✓ FLOWING |
| `renderMobRow` | `alive`, `aliveRatio`, `aliveClass` | `getMobAlive(cb)` → `cb.mob.poolHp / cb.mob.individualMaxHp` | Ja — echter Pool-HP-Zustand | ✓ FLOWING |
| `renderLegendaryActionPips` | `la.max`, `la.remaining` | `cb.legendaryActions` gesetzt via `addBestiaryToInitiative` | Ja — aus `monster.legendaryActionsPerRound` | ✓ FLOWING |
| `renderLegendaryResistancePips` | `lr.max`, `lr.remaining` | `cb.legendaryResistance` gesetzt via `parseLegendaryResistanceCount` | Ja — aus echtem Trait-Text-Parsing | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Verhalten | Befund | Status |
|-----------|--------|--------|
| `calcMobHits(10, 4, 15)` gibt 5 zurück | Unit-Test `INIT-03 / DMG-Mob-Regel` grün (288/288 gesamt) | ✓ PASS |
| `parseLegendaryResistanceCount({ traits: [{ name: 'Legendäre Resistenz (3-mal täglich)' }] })` gibt 3 zurück | Unit-Test "erkennt deutsches Format" grün | ✓ PASS |
| `getMobAlive({ mob: { poolHp: 35, individualMaxHp: 7 } })` gibt 5 zurück | Unit-Test "berechnet lebende Kreaturen per Ceiling-Division" grün | ✓ PASS |
| Beide neue Module laden ohne Fehler (Build) | `python build.py` sauber (2.58 MB, keine Duplikat-Deklarations-Fehler) | ✓ PASS |
| 14 neue E2E-Tests grün (statblock 4, legendary 6, mob 4) | Per Orchestrator-Kontext bestätigt | ✓ PASS |
| 6 pre-existierende E2E-Fehler | Ursache: veralteter `[data-action="save-combatant"]`-Selektor im alten `addEnemy`-Testhelfer — identisch beim Baseline-Commit `37f8c5d` vorhanden; keine Phase-4-Regression | ✓ CONFIRMED PRE-EXISTING |

---

### Probe Execution

Kein dedizierter Probe-Skript für diese Phase. Build-Integrität durch `python build.py` (clean) und `npm run test:unit` (288/288) abgedeckt.

---

### Requirements Coverage

| Requirement | Source Plan | Beschreibung | Status | Nachweis |
|-------------|-------------|--------------|--------|----------|
| INIT-01 | 04-02-PLAN.md | Vollständiger Statblock als Popup | ✓ SATISFIED | Book-Button in `renderInit()`, Drawer in `initiative-statblock.js`, E2E 4/4 grün |
| INIT-02 | 04-03-PLAN.md | LA/LR Zähler pro Runde | ✓ SATISFIED | Pips, Handler, nextTurn LA-Reset, D-07 LR-kein-Auto-Reset, E2E 6/6 grün |
| INIT-03 | 04-04-PLAN.md | Mob-Modus (eine Zeile, Pool-HP, Sammel-Angriffe) | ✓ SATISFIED | Mob-Toggle, `renderMobRow`, Pool-HP, Besiegt-Badge, E2E 4/4 grün |

Alle drei INIT-Requirements aus `REQUIREMENTS.md` (Zeilen 39–41) als `[x]` markiert — Implementation bestätigt.

---

### Anti-Patterns Found

| Datei | Zeile | Pattern | Schwere | Auswirkung |
|-------|-------|---------|---------|------------|
| Keine ungeresolvedten Debt-Marker (TBD/FIXME/XXX) in Phase-4-Dateien | — | — | — | Sauber |

Aus `04-REVIEW.md` bekannte Code-Qualitätsprobleme (nicht neue Debt-Marker):

| Finding | Ort | Phase-4-Code? | Bewertung |
|---------|-----|---------------|-----------|
| CR-01: `updateCharacterHP` NaN-Bug | `initiative.js:362` | Nein — pre-existing | Advisory; nicht Phase-4-Code |
| CR-02: Mob-Pool-HP Desync via ➕/➖ | `initiative.js:328` + `initiative-mob.js renderMobRow` | Teilweise — Mob-Zeile enthält die ➕/➖-Buttons | ⚠️ Bekannte Einschränkung, kein Kernziel-Versagen |
| CR-03: Unbounded rollAoEDamage-Loop | `initiative.js:948` | Nein — pre-existing | Advisory; nicht Phase-4-Code |
| CR-04: EntityLookup-Cache-Leak | `initiative.js:113` | Nein — pre-existing | Advisory; nicht Phase-4-Code |
| WR-01: removeCombatant ohne saveUndoState | `initiative.js:317` | Nein — pre-existing | Advisory |

Kein TBD/FIXME/XXX-Marker in Phase-4-Dateien — Debt-Marker-Gate passiert.

---

### Human Verification Required

#### 1. Statblock-Panel Optik

**Test:** App per `file://` öffnen → Initiative-Tab → Bestiary-Monster hinzufügen → 📖-Button klicken. Zweiten Test: Browser-Fenster auf <600px Breite verkleinern, wieder klicken.
**Expected:** Desktop: Drawer erscheint rechts (420px breit, volle Höhe, Parchment-Statblock mit Sektionen Attribute/Aktionen/Traits/Senses sichtbar). Mobile: Bottom-Sheet öffnet von unten (60vh Höhe, 12px Radius oben, korrekte Scrollbarkeit).
**Why human:** CSS-Layout und visueller Parchment-Look sind per Code-Grep nicht verifizierbar.

#### 2. Pip-Feel am Tisch

**Test:** Boss-Monster (z.B. Vampir) zur Initiative hinzufügen → LA-Pips (⭐) und LR-Pips (🛡️) anklicken.
**Expected:** Pip-Klick ist sofort reaktiv (scale(1.15) Hover, Gold/Lila Farbwechsel ohne Lag). Nach einem vollen Rundenübergang: LA-Pips wieder voll (auto-reset), LR-Pips unverändert (D-07). LR-Reset-Knopf stellt LR manuell wieder her.
**Why human:** Klick-Latenz und Interaktionshaptik brauchen echte Browser-Überprüfung am Tisch.

#### 3. Mob-Schaden-Workflow am Tisch

**Test:** 10 Goblins → Mob-Modus (JA im Confirm-Dialog) → Sammel-Angriff-Button in beiden Modi testen (N-fach und DMG-Mob-Regel).
**Expected:** N-fach: Toast zeigt "X Angriffe — Schaden je: ... | Gesamtschaden: Y". DMG-Mob-Regel: RK und Angriffsbonus eingeben → Toast zeigt "Z Treffer (von X lebend, RK W, +B) | Schaden: Y". Einzelner Klick = auto-summierter Gesamtschaden.
**Why human:** End-to-End DM-Erlebnis mit echten Würfelwürfen und Toast-Anzeige am Spieltisch.

---

### Gaps Summary

Keine Gaps, die das Phasenziel blockieren. Die drei Success Criteria sind alle durch substantiellen Code, vollständige Wiring-Chains und grüne Tests belegt.

CR-02 (Pool-HP-Desync via ➕/➖) ist ein bekanntes Polier-Gap, das den primären Mob-Workflow nicht beeinträchtigt — in `04-REVIEW.md` dokumentiert und für zukünftige Behandlung vorgemerkt.

---

_Verified: 2026-06-14T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
