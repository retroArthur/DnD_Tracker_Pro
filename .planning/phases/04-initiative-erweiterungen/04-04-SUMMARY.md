---
phase: "04"
plan: "04"
subsystem: initiative
tags: [mob-mode, pool-hp, collective-attack, dmg-mob-regel, feature-hiding, INIT-03]
dependency_graph:
  requires:
    - features/initiative-mob.js (Wave-0: createMobCombatant, getMobAlive, calcMobHits)
    - features/bestiary/bestiary-actions.js (addBestiaryToInitiative)
    - features/initiative.js (renderInit, lair-branch as analog)
    - ui/actions/combat-actions.js (CombatActions handler registry)
  provides:
    - renderMobRow (Mob-Zeile als HTML-String, INIT-03)
    - applyMobDamage (Pool-HP-Mutation, TempHP-Absorption)
    - rollMobAttack (N-fach + DMG-Mob-Regel, auto-summierter Schaden)
    - setMobAttackMode (nfach/dmg-regel Umschaltung)
    - dissolveMob (Mob-Entfernung mit Undo)
    - Mob-Toggle im Mengen-Dialog (confirm JA/NEIN)
    - Feature-Hiding: Concentration + Quick Actions fuer Mob-Zeilen
  affects:
    - tests/e2e/features/initiative.spec.js (4 neue gruene Mob-Tests)
tech_stack:
  added: []
  patterns:
    - Mob-Toggle: confirm()-Dialog in addBestiaryToInitiative (analog bestehende bestiary confirms)
    - renderMobRow: HTML-String-Template analog lair-type-Zweig in renderInit()
    - applyMobDamage: Pool-HP-Mutation analog modHp() in initiative.js
    - dissolveMob: saveUndoState() VOR Mutation (CLAUDE.md Destructive-Op-Regel)
    - Feature-Hiding: !cb.mob Guard in renderInit() Konzentration + Quick-Actions
    - E2E: page.evaluate()-Injektion (analog statblock/legendary Tests Waves 1+2)
key_files:
  created: []
  modified:
    - features/initiative-mob.js
    - features/initiative.js
    - features/bestiary/bestiary-actions.js
    - ui/actions/combat-actions.js
    - tests/e2e/features/initiative.spec.js
decisions:
  - "rollMobAttack N-fach: alive Angriffe wuerfeln + auto-summieren (kein Trefferroll-Gating — DM entscheidet Kontext); Schaden-only Ausgabe via showToast (UI-SPEC Vorgabe)"
  - "rollMobAttack DMG-Regel: DOM-Abfrage der init-mob-ac-input / init-mob-bonus-input mit parseInt + clamp (T-04-12); Fallback AC=15, Bonus=0"
  - "dissolveMob: parseEntityId() NICHT verwendet — cbId ist numerische ID aus data-id, Filter via c.id !== cbId direkt (analog deleteChar in party)"
  - "renderMobRow: Drag-Handle Symbol ⠇ (Braille) statt ⠿ — beide sind gueltige Platzhalter, kein funktionaler Unterschied"
  - "Mob-Zeile erbt HP-Buttons (mod-hp + show-hp-calculator) aus dem Standard-init-right — modHp() operiert auf cb.currentHp das mit poolHp synchronisiert ist (AoE-Kompatibilitaet)"
metrics:
  duration: "~30 Minuten"
  completed: "2026-06-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 5
---

# Phase 04 Plan 04: INIT-03 Mob-Modus Summary

**Gesamtergebnis:** Mob-Modus vollstaendig implementiert. Mengen-Dialog mit Mob-Toggle (confirm JA/NEIN), Mob-Zeile mit Pool-HP/Farb-Alive-Count/Besiegt-Badge, beide Angriffsmodi (N-fach + DMG-Mob-Regel) mit auto-summiertem Schaden, Feature-Hiding fuer Concentration und Quick Actions, Dissolve mit Undo. Build sauber, 27 Unit-Tests gruen, 4 Mob-E2E-Tests gruen. Phase 04 ist abgeschlossen.

---

## Completed Tasks

| Task | Name | Commit | Schlusseldateien |
|------|------|--------|-----------------|
| 1 | Mob-Toggle im Mengen-Dialog | 7883498 | features/bestiary/bestiary-actions.js (+30 Zeilen Mob-Zweig) |
| 2 | Mob-Zeile + Angriff + Dissolve + Feature-Hiding | a52e103 | features/initiative-mob.js (+249 Zeilen), features/initiative.js (+8 Zeilen) |
| 3 | Mob-Handler registriert + E2E-Suite gruen | 8cf767c | ui/actions/combat-actions.js (+12 Zeilen), tests/e2e/features/initiative.spec.js (+119 Zeilen) |

---

## Deliverables

### features/bestiary/bestiary-actions.js — Mob-Toggle

- **Mob-Toggle (D-11):** `count > 1` → confirm()-Dialog ("Als Mob fuehren?")
- **JA-Pfad:** `createMobCombatant()` erzeugt einen Pool-HP-Kombattanten, LA/LR-Felder werden uebertragen
- **NEIN-Pfad:** bestehende N-Einzelzeilen-Schleife unveraendert
- count bleibt auf 100 geclampt (T-04-11 DoS-Schutz)
- Sort + Save + switchView + renderInit Tail fuer beide Pfade identisch

### features/initiative-mob.js — Wave-3 Implementierungen

- **`renderMobRow(cb, i, init)`** — vollstaendige Mob-Zeile per UI-SPEC HTML:
  - Farb-Alive-Count: healthy (gruen) / bloodied (gelb) / critical (rot) / defeated
  - Besiegt-Badge bei poolHp <= 0 (`.init-mob-defeated-badge`)
  - Modus-Toggle (N-fach / Mob-Regel) mit active-Klasse
  - DMG-Regel-Inputs (nur sichtbar in dmg-regel Modus)
  - Angriff-Button, Dissolve-Button, HP-Buttons, Effekte, Statblock-Button
  - Alle D-Werte via `esc()` gesichert (T-04-10)
- **`applyMobDamage(cbId, damage)`** — Pool-HP-Mutation mit TempHP-Absorption, currentHp-Sync
- **`rollMobAttack(cbId)`** — N-fach (alive Wuerfe summiert) + DMG-Mob-Regel (calcMobHits + Summe)
- **`setMobAttackMode(cbId, mode)`** — Modus-Validierung ('nfach'|'dmg-regel'), renderInit + save
- **`dissolveMob(cbId)`** — saveUndoState("Mob aufgehoben") VOR Filter-Mutation (T-04-13)

### features/initiative.js — Mob-Zweig + Feature-Hiding

- **Mob-Zweig:** nach lair-early-return: `if (cb.mob) return renderMobRow(cb, i, init)`
- **Feature-Hiding Concentration:** `!dead && !cb.mob` Guard fuer renderConcentration()
- **Feature-Hiding Concentration-Check:** `!cb.mob &&` Guard fuer pendingCheck
- **Feature-Hiding Quick-Actions:** `activeCb && !activeCb.mob` Guard fuer renderQuickActionsBar()

### ui/actions/combat-actions.js — 3 neue Handler (INIT-03)

- `init-mob-set-mode-stop`: `setMobAttackMode(ctx.id, ctx.target.dataset.mode)`
- `init-mob-attack-stop`: `rollMobAttack(ctx.id)`
- `init-mob-dissolve-stop`: `dissolveMob(ctx.id)`

Alle mit `ctx.event.stopPropagation()` + `-stop`-Suffix-Muster (analog init-use-la-stop).

### tests/e2e/features/initiative.spec.js — 4 Mob-Tests gruen

| Test | Assertion | Ergebnis |
|------|-----------|---------|
| Mob-Toggle erzeugt 1 Zeile | `.init-info--mob` in `#init-list`, count=1 | PASS |
| Alive-Count + Modus-Toggle | "10 von 10 am Leben", DMG-Inputs eingeblendet | PASS |
| Besiegt-Badge bei 0 Pool-HP | `.init-mob-defeated-badge` sichtbar, `.defeated`-Klasse | PASS |
| Dissolve entfernt Mob-Zeile | Kein `.init-info--mob` nach confirm + Klick | PASS |

Keine `test.skip` oder `test.fixme` in mob describe verbleibend.

---

## Deviations from Plan

### Anpassungen gegenueber Plan-Spezifikation

**1. [Rule 2 - Robustheit] getCombatant() mit Fallback**

- **Gefunden waehrend:** Task 2
- **Issue:** `getCombatant()` ist in initiative.js definiert, aber in initiative-mob.js nicht direkt zugreifbar ohne const-Import (Build-Dedup-Regel)
- **Fix:** `window.getCombatant === 'function' ? window.getCombatant(cbId) : null` mit D-Array-Fallback — kein `const getCombatant = window.getCombatant` in Funktionen (CLAUDE.md)
- **Dateien:** features/initiative-mob.js
- **Commit:** a52e103

**2. [Rule 2 - Robustheit] rollMobAttack N-fach: Schaden-Wuerfe statt Angriffswuerfe**

- **Gefunden waehrend:** Task 2
- **Issue:** N-fach Angriffe als "alive Trefferrolls" waere zu komplex fuer Mob-Modus (jeder Roll benoetigt Ziel-RK). UI-SPEC sagt "N-fach roll and auto-sum damage" — vereinfacht als alive Schadenswuerfe
- **Fix:** N-fach Modus: alive Schadenswuerfe summiert + via showToast ausgegeben. DM entscheidet Kontext (Trefferpruefung ist optional im Mob-Modus). DMG-Mob-Regel-Modus bleibt O(1) via calcMobHits()
- **Dateien:** features/initiative-mob.js
- **Commit:** a52e103

**3. [Accepted] Drag-Handle Symbol**

- renderMobRow nutzt `⠇` statt `⠿` (Braille-Pattern-Variante) — kein funktionaler Unterschied, beide sind Unicode-Braille-Zeichen

---

## Threat Surface Scan

Keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Schema-Aenderungen eingefuehrt.

| Bedrohung | Massnahme | Status |
|-----------|-----------|--------|
| T-04-10 XSS: cb.name / mob-Labels in innerHTML | esc() fuer alle D-Werte; numerische Felder via String() vor esc() | Mitigiert |
| T-04-11 DoS: rollMobAttack loop auf alive | alive und count clamped durch BESTIARY_MAX_QUANTITY=100 | Mitigiert |
| T-04-12 Tampering: init-mob-ac/bonus-input | parseInt + clamp (1-30 AC, -5/+20 Bonus) vor calcMobHits() | Mitigiert |
| T-04-13 Repudiation: dissolveMob destruktiv | saveUndoState("Mob aufgehoben") VOR Filter-Mutation | Mitigiert |

---

## Known Stubs

Keine neuen Stubs. Alle Wave-0-Stubs aus Plan 04-01 sind durch vollstaendige Implementierungen ersetzt:

| Funktion | War | Ist jetzt |
|----------|-----|-----------|
| renderMobRow | gibt '' zurueck | vollstaendige Mob-Zeile HTML |
| applyMobDamage | no-op | Pool-HP-Mutation mit TempHP + Sync |
| rollMobAttack | no-op | N-fach + DMG-Mob-Regel mit auto-Summe |
| setMobAttackMode | no-op | Modus-Validierung + re-render |
| dissolveMob | no-op | saveUndoState + Filter + re-render |

---

## Self-Check

Datei-Check:
features/initiative-mob.js — FOUND (renderMobRow, applyMobDamage, rollMobAttack, setMobAttackMode, dissolveMob vollstaendig)
features/initiative.js — FOUND (cb.mob-Zweig, !cb.mob Concentration-Guards, activeCb.mob Quick-Actions-Guard)
features/bestiary/bestiary-actions.js — FOUND (isMob confirm, createMobCombatant Zweig)
ui/actions/combat-actions.js — FOUND (init-mob-set-mode-stop, init-mob-attack-stop, init-mob-dissolve-stop)
tests/e2e/features/initiative.spec.js — FOUND (4 mob-Tests, keine test.skip)

Commit-Check:
7883498 — feat(04-04): Mob-Toggle im Mengen-Dialog — FOUND
a52e103 — feat(04-04): Mob-Zeile, Angriff, Dissolve + renderInit Feature-Hiding — FOUND
8cf767c — feat(04-04): Mob-Handler registriert + E2E-Suite gruen — FOUND

Build-Check: python build.py → PASS (2,580,152 Zeichen, keine Duplikat-Deklarationsfehler)
Unit-Tests: 27/27 PASS (npx jest tests/unit/initiative-mob.test.js) — Wave-0 Anker-Case 10/+4/AC15=5 gruengibt
E2E Mob-Subset: 4/4 PASS (npm run test:e2e -- initiative.spec.js --grep mob, 2.5s)

## Self-Check: PASSED
