---
phase: 06-spieler-verwaltung
verified: 2026-06-16T00:00:00Z
status: human_needed
score: 13/13 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Inspiration-Stern ist visuell korrekt gestylt (gefuellt gold / ausgegraut)"
    expected: "Aktiver Stern zeigt Goldfarbe (var(--gold)), inaktiver Stern ist ausgegraut (var(--text-dim))"
    why_human: "CSS-Rendering und visuelle Unterscheidbarkeit koennen nur im Browser geprueft werden"
  - test: "XP-Fortschrittsbalken im Detail-Modal rendert korrekt"
    expected: "Balken zeigt prozentualen XP-Fortschritt zur naechsten Stufe; kein Overflow, korrekte Breite"
    why_human: "CSS-Rendering (style=width:N%) und visuelle Ausgabe erfordern Browser-Inspektion"
  - test: "Skills-Sektion im Detail-Modal: nach Attributen gruppiert, lesbar"
    expected: "18 Skills korrekt nach STR/DEX/CON/INT/WIS/CHA gruppiert, deutsche Namen aus SKILL_INFO, Modifier korrekt formatiert"
    why_human: "Visuelle Gruppierung und Lesbarkeit am Spieltisch koennen nur im Browser beurteilt werden"
  - test: "Angriffs-Sektion im Detail-Modal: Treffer- und Schadenswuerfel klar erkennbar"
    expected: "Angriffswuerfel-Spans sind deutlich als klickbar erkennbar (Cursor, Hover), Schaden-Spans ebenfalls"
    why_human: "UX/Click-Affordance-Qualitaet ist visuell zu pruefen"
  - test: "XP-Verteilungs-Modal: Vorschau aktualisiert sich live bei manueller XP-Eingabe"
    expected: "Aenderung des Inputs aktualisiert die 'Je Charakter: +N XP'-Zeile ohne Neuladen"
    why_human: "Echtzeit-UI-Verhalten (input-Event-Listener) erfordert manuelle Interaktion"
---

# Phase 6: Spieler-Verwaltung Verification Report

**Phase Goal:** Spieler-Verwaltung — Inspiration, erweiterte Charakterwerte (Skills/Saves/Angriffe) und XP-/Milestone-Tracker fuer den DM-Spieltisch.
**Verified:** 2026-06-16T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | XP_LEVEL_THRESHOLDS existiert als 20-wertiges PHB-Aufstiegs-Array, getrennt von XP_THRESHOLDS | VERIFIED | `core/constants.js:502-523` — 20 Einträge [0..355000]; JSDoc-Banner warnt vor Verwechslung; `features/encounter-calculator.js:9` hat separates XP_THRESHOLDS-Objekt (Encounter-Schwierigkeit) |
| 2  | Pure Helpers calcSkillModifier, canLevelUp, getXPForCR, distributeXP sind DOM-unabhaengig unit-testbar | VERIFIED | `utils/game-rules.js:148-218` (Implementierungen); `utils/testable-utils.js:388-465` (CommonJS-Mirror); 49/49 Jest-Tests bestehen |
| 3  | Neue Charakterfelder xp/skillProficiencies/skillExpertise/attacks[] und D.settings.levelingMode werden durch Migration 5.0.0 mit sicheren Defaults befuellt | VERIFIED | `systems/spellslots/version-migration.js:86-106` — Migration-Key '5.0.0' vorhanden; backfills alle vier Felder; optional-chaining gegen fehlendes characters-Array (T-06-01) |
| 4  | Wave-0 Teststubs und Unit-Suite vorhanden | VERIFIED | `tests/unit/character-advancement.test.js` (49 Tests), `tests/e2e/features/inspiration.spec.js`, `tests/e2e/features/character-advancement.spec.js` — alle drei Dateien existieren und laufen |
| 5  | Inspiration-Stern ist immer sichtbar; Klick togglet ohne Edit-Formular zu oeffnen | VERIFIED | `features/party/party-render.js:175` — unconditional `<button class="char-inspiration-toggle${ch.inspiration ? ' active' : ''}">` ; `ui/actions/entity-actions.js:29-38` — stopPropagation() zuerst, kein saveUndoState (D-02); E2E-Tests bestaetigen toggle + stop-propagation |
| 6  | Toggle-Persistenz ueber Reload | VERIFIED | E2E-Test "Inspiration bleibt nach Reload erhalten" besteht; plain save() wird aufgerufen |
| 7  | 18 Skills mit Proficiency + optionalem Expertise-Checkbox im Editor | VERIFIED | `assets/templates/view-party.html` — 36 char-skill-* Vorkommen (18 Proficiency), 18 char-skill-exp-* (18 Expertise); `features/party/party-crud.js:214-220` liest und speichert beide |
| 8  | Detail-Modal zeigt Skills (nach Attribut gruppiert), klickbare Saves, klickbare Attribut-Checks, Angriffs-Sektion | VERIFIED | `features/party/party-details.js:53-215` — SKILL_INFO-Schleife, roll-char-skill-stop/roll-char-save-stop/roll-char-attr-stop data-actions; Angriffs-Sektion mit hit/damage spans |
| 9  | Skill-/Save-/Attribut-/Angriffs-Klicks landen in Dice-Historie; -stop verhindert Bubbling | VERIFIED | `ui/actions/entity-actions.js:104-185` — alle vier Handler rufen ctx.event.stopPropagation() und addToDiceHistory() auf; E2E bestaetigt history.length erhoehung |
| 10 | Angriffe sind eine freie Liste {name, attackBonus, damage, damageType}; Bonus und Schaden sind klickbar; Angriffsliste ist auf 20 gecapped | VERIFIED | `features/party/party-crud.js:225-248` — MAX_ATTACKS=20, .slice(0, MAX_ATTACKS), DAMAGE_FORMULA_RE-Validierung; party-details.js:213-216 rendert 1d20+bonus und damage als Dice-Spans |
| 11 | Initiative-Trigger oeffnet XP-Modal mit CR-basierter Auto-Summe + manueller Korrektur | VERIFIED | `assets/templates/view-encounters.html:414` — 'finish-combat-xp'-Button; `features/initiative.js:266-301` — showXpDistributionModal() summiert getXPForCR() ueber enemy/monster-Kombattanten; endCombat() unveraendert |
| 12 | Gleichmaessige XP-Verteilung auf lebende Charaktere; Level-Up-HINWEIS ohne Auto-Bump; undoable | VERIFIED | `features/initiative.js:318-353` — pushUndo('XP verteilt') VOR Mutation; distributeXP() filtert lebende Chars; canLevelUp()-Hinweis toast; level wird NICHT veraendert; E2E 2-Woelfe=100XP besteht |
| 13 | D.settings.levelingMode togglet XP vs. Milestone; Milestone zeigt +1-Level-Button, versteckt XP | VERIFIED | `features/party/party-details.js:239-284` — levelingMode==='milestone' rendert char-xp-milestone-section mit milestone-level-up; XP-Modus rendert char-xp-section mit confirm-level-up; E2E Milestone-Test besteht; `core/data.js:37` hat Default levelingMode:'xp' |

**Score: 13/13 truths verified**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `core/constants.js` | XP_LEVEL_THRESHOLDS + DND_RULES namespace | VERIFIED | Zeilen 502-523 + 550; window.XP_LEVEL_THRESHOLDS=590 |
| `utils/game-rules.js` | calcSkillModifier, canLevelUp, getXPForCR, distributeXP, window-exported | VERIFIED | Zeilen 148-218; alle vier auf window:215-218 |
| `utils/testable-utils.js` | CommonJS-Mirror der vier Helpers fuer Jest | VERIFIED | Zeilen 382-465; module.exports enthaelt alle vier |
| `systems/spellslots/version-migration.js` | Migration-Key '5.0.0' | VERIFIED | Zeile 86; backfills alle vier Felder |
| `core/data.js` | D.settings.levelingMode Default | VERIFIED | Zeile 37 |
| `tests/unit/character-advancement.test.js` | 49 Unit-Tests; alle bestehen | VERIFIED | 49/49 Jest-Pass beobachtet |
| `tests/e2e/features/inspiration.spec.js` | ESM, file://, kein addCombatant | VERIFIED | ESM-Import Zeile 15; file://-URL Zeile 18; kein addCombatant |
| `tests/e2e/features/character-advancement.spec.js` | ESM, file://, kein addCombatant | VERIFIED | ESM-Import Zeile 17; file://-URL Zeile 20; kein addCombatant |
| `features/party/party-render.js` | Always-visible toggle-inspiration-stop button | VERIFIED | Zeile 175 — unconditional button |
| `ui/actions/entity-actions.js` | toggle-inspiration-stop, confirm-level-up, milestone-level-up, vier roll-char-*-stop Handler | VERIFIED | Zeilen 29-185 |
| `assets/styles/party.css` | .char-inspiration-toggle, .char-skills, .char-xp-section | VERIFIED | Zeilen 2470, 2747, 2982 |
| `assets/templates/view-party.html` | 18 char-skill-exp-* Expertise-Checkboxen | VERIFIED | 18 Vorkommen gezaehlt |
| `features/party/party-crud.js` | skillProficiencies/skillExpertise/attacks[] gelesen; MAX_ATTACKS=20-Cap | VERIFIED | Zeilen 214-248 |
| `features/party/party-details.js` | Skills-Sektion, roll-char-skill-stop, canLevelUp, levelingMode | VERIFIED | Zeilen 47-285 |
| `features/initiative.js` | showXpDistributionModal, applyXpDistribution; endCombat unveraendert | VERIFIED | Zeilen 258-356; endCombat:230 enthaelt kein getXPForCR |
| `ui/actions/combat-actions.js` | finish-combat-xp, apply-xp-distribution | VERIFIED | Zeilen 180-183 |
| `assets/templates/modals-entity.html` | xp-distribution-modal | VERIFIED | Zeile 758 |
| `assets/styles/initiative.css` | .xp-distribute-btn, .xp-dist-* | VERIFIED | Zeilen 1226+ |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `core/constants.js` | `DND_RULES.XP_LEVEL_THRESHOLDS` | Object.freeze namespace + window.XP_LEVEL_THRESHOLDS | WIRED | Zeilen 550, 590 |
| `utils/game-rules.js` | `SKILL_INFO + getAbilityModifier + getProficiencyBonus` | calcSkillModifier liest SKILL_INFO[skillKey].attr | WIRED | Zeile 150 direkt (global lexical scope) |
| `systems/spellslots/version-migration.js` | `D.characters[*].xp/skillProficiencies/skillExpertise/attacks` | MIGRATIONS['5.0.0'] forEach-Backfill | WIRED | Zeilen 90-98 |
| `features/party/party-render.js renderCharacterCard` | `entity-actions.js toggle-inspiration-stop` | data-action="toggle-inspiration-stop" data-id | WIRED | party-render.js:175 → entity-actions.js:29 |
| `entity-actions.js toggle-inspiration-stop` | `ch.inspiration + window.save + renderParty` | stopPropagation → toggle → save (kein saveUndoState) | WIRED | Zeilen 30-37 |
| `party-details.js showCharacterDetails` | `calcSkillModifier + SKILL_INFO` | Skills-Schleife ueber SKILL_INFO; calcSkillModifier(ch, key) | WIRED | Zeilen 53-163 |
| `party-crud.js saveCharacter` | `ch.skillProficiencies / ch.skillExpertise / ch.attacks` | Checkbox-Collection + Attack-Row-Collection; slice(0,20)-Cap | WIRED | Zeilen 214-248 |
| `entity-actions.js roll-char-*-stop` | `displayDiceResult + addToDiceHistory` | Jeder Handler berechnet roll, ruft beide auf | WIRED | Zeilen 121-184 |
| `initiative.js showXpDistributionModal` | `getXPForCR ueber enemy/monster-Kombattanten` | sum getXPForCR(cb.cr) fuer cb.type enemy|monster | WIRED | Zeilen 270-273 |
| `combat-actions.js apply-xp-distribution` | `distributeXP + canLevelUp` | applyXpDistribution: pushUndo → distributeXP → canLevelUp-Hints | WIRED | Zeilen 329-351 |
| `party-details.js` | `canLevelUp + D.settings.levelingMode` | levelingMode-Branch; canLevelUp(ch) fuer Hinweis-Badge | WIRED | Zeilen 236-256 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `party-render.js` inspiration button | `ch.inspiration` | D.characters (LocalStorage) via EntityLookup | Yes — toggle-inspiration-stop mutiert D direkt | FLOWING |
| `party-details.js` Skills-Sektion | `calcSkillModifier(ch, key)` | ch.attributes + ch.skillProficiencies + ch.skillExpertise aus D | Yes — Formel-Berechnung auf realen Charakterdaten | FLOWING |
| `party-details.js` XP-Block | `ch.xp, XP_LEVEL_THRESHOLDS, canLevelUp(ch)` | D.characters[n].xp (gesetzt durch applyXpDistribution) | Yes — XP-Verteilung mutiert D.characters[n].xp | FLOWING |
| `features/initiative.js` XP-Modal | `autoSum = sum(getXPForCR(cb.cr))` | D.initiative.combatants (reale Kampfdaten) | Yes — summiert echte Kombattanten-CRs | FLOWING |
| `party-crud.js` attackRows | `attacks[]` aus DOM-Formular | #cf-attacks-container .cf-attack-row Inputs (Nutzereingabe) | Yes — liest echte Formularwerte, validiert und speichert | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 49 Unit-Tests (Helpers + Migration) | `npx jest tests/unit/character-advancement.test.js` | 49 passed | PASS |
| Build liefert valides HTML ohne Dedup-Fehler | `python build.py` (PYTHONIOENCODING=utf-8) | Build SUCCESS, 2.70 MB | PASS |
| 13 E2E-Tests (Inspiration + Character Advancement) | `npx playwright test inspiration.spec.js character-advancement.spec.js` | 13 passed, 7.5s | PASS |
| Kein TBD/FIXME/XXX in Phase-6-Dateien | grep TBD/FIXME/XXX auf alle modifizierten Dateien | 0 Treffer | PASS |
| endCombat enthaelt keine XP-Logik | grep getXPForCR/distributeXP in endCombat-Body | 0 Treffer | PASS |
| Keine function-lokalen const X = window.X in neuen XP-Funktionen | `var D = window.D` in finishCombatXp/showXpDistributionModal | Korrekt: var (nicht const) | PASS |

### Probe Execution

Keine Probe-Skripte deklariert in PLAN/SUMMARY-Dateien. Step 7c: SKIPPED (keine probe-*.sh Dateien fuer Phase 6).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CHAR-01 | 06-04-PLAN.md | XP/Milestones der Gruppe verfolgen; XP aus Encountern uebernehmen | SATISFIED | Initiative-Trigger + XP-Modal + distributeXP + canLevelUp-Hint + Milestone-Modus verifiziert |
| CHAR-02 | 06-02-PLAN.md | Inspiration je Spieler vergeben und einsehen | SATISFIED | Immer-sichtbarer Stern-Toggle + toggle-inspiration-stop + save() (kein Undo) + E2E gruen |
| CHAR-03 | 06-03-PLAN.md | Erweiterte Charakterwerte pflegen (Skill-Proficiencies, Saves, Angriffe) | SATISFIED | 18 Skills + Expertise im Editor; Detail-Modal mit klickbaren Wuerfen; roll-char-*-stop Handler; Angriffe mit Cap+Validierung |

Alle drei CHAR-Anforderungen sind in REQUIREMENTS.md (Zeilen 53-55) korrekt als Phase 6 / Complete markiert.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| Keine Blocker-Anti-Patterns gefunden | — | — | — | — |

**Hinweis:** Die Pattern `const D = window.D` in vorbestehenden Funktionen von initiative.js (z.B. Zeilen 10, 114, 231) sind Pre-Phase-6-Code und nicht Teil dieser Phase. Die neuen XP-Funktionen (Zeilen 258+) verwenden korrekt `var D = window.D` gemaess Build-Dedup-Regeln.

### Human Verification Required

#### 1. Inspiration-Stern Styling

**Test:** Party-Tab oeffnen, Charakter erstellen. Stern-Button ohne und mit Inspiration vergleichen.
**Expected:** Inaktiver Stern (☆) ist ausgegraut/gedaempft (var(--text-dim)); aktiver Stern (⭐) leuchtet gold (var(--gold)). Groesse passt zur Karten-Kopfzeile, kein Layout-Shift beim Toggle.
**Why human:** CSS-Rendering und visuelle Unterscheidbarkeit sind nur im Browser pruefbar.

#### 2. XP-Fortschrittsbalken

**Test:** Detail-Modal eines Charakters mit xp > 0 oeffnen. XP-Fortschrittsbalken pruefen.
**Expected:** Balken zeigt proportionalen Fortschritt; kein Overflow; korrekte Prozent-Breite. Bei Max-Level: "Max Level"-Text statt Balken.
**Why human:** CSS-Rendering (inline style="width:N%") erfordert Browser-Inspektion.

#### 3. Skills-Sektion Gruppenansicht

**Test:** Charakter mit gemischten Skill-Proficiencies anlegen, Detail-Modal oeffnen.
**Expected:** 18 Skills sind nach Attribut (STR/DEX/CON/INT/WIS/CHA) gruppiert; deutsche Namen aus SKILL_INFO; Modifier in Format "+N"/"-N"; profizierte Skills visuell hervorgehoben.
**Why human:** Visuelle Gruppenstruktur und Lesbarkeit am Spieltisch koennen nur im Browser beurteilt werden.

#### 4. Angriffs-Click-Affordance

**Test:** Charakter mit Angriffen anlegen, Detail-Modal oeffnen, Maus ueber Treffer-/Schadenswuerfel-Spans bewegen.
**Expected:** Cursor wechselt auf pointer, hover-Highlighting sichtbar; nach Klick erscheint Wuerfel-Ergebnis im Event-Log.
**Why human:** UX/Click-Affordance ist visuell zu beurteilen.

#### 5. XP-Modal Live-Vorschau

**Test:** Kampf mit Monstern beenden, "XP verteilen"-Button klicken. Manuellen XP-Wert aendern.
**Expected:** Vorschau "Je Charakter: +N XP" aktualisiert sich sofort (ohne Button-Klick) bei Eingabe-Aenderung. Auto-Summe korrekt aus Monster-CRs berechnet.
**Why human:** Echtzeit-Input-Event-Verhalten erfordert manuelle Browser-Interaktion.

### Gaps Summary

Keine Gaps gefunden. Alle 13 Must-Have-Truths sind durch Code-Evidence verifiziert. Alle drei Anforderungen (CHAR-01/02/03) sind implementiert und durch Unit-Tests (49/49) und E2E-Tests (13/13) bestaetigt. Build laeuft fehlerfrei. Kein ungepruefter Undo-Debt, keine FIXME/TBD-Marker, keine orphaned Funktionskörper.

Status ist `human_needed` (nicht `passed`), weil fuenf UI-/Rendering-Aspekte (Styling, Barken-Breite, Gruppenansicht, Click-Affordance, Live-Vorschau) nur im Browser beurteilt werden koennen.

---

_Verified: 2026-06-16T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
