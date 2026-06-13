---
phase: "04"
plan: "02"
subsystem: initiative
tags: [statblock-drawer, init-01, dry, bestiary, e2e]
dependency_graph:
  requires:
    - features/bestiary/bestiary-render.js (renderStatblockHTML Extraktion)
    - features/bestiary/bestiary-actions.js (getBestiaryMonster)
    - features/initiative.js (renderInit, getCombatant)
    - features/initiative-statblock.js (Wave-0 Skelett)
    - ui/actions/combat-actions.js (CombatActions)
  provides:
    - renderStatblockHTML (shared, window-exported aus bestiary-render.js)
    - showInitStatblockPanel / closeInitStatblockPanel (window-exported)
    - renderBasicCombatantInfo (window-exported)
    - Book-Button in jeder Init-Zeile (INIT-01)
  affects:
    - tests/e2e/features/initiative.spec.js (4 neue gruene Tests)
tech_stack:
  added: []
  patterns:
    - DRY-Extraktion (renderStatblockHTML aus renderBestiaryDetail herausgezogen)
    - Dynamisches Modal-Overlay-Muster (analog showConcentrationModal)
    - evaluate()-basierte E2E-Daten-Injektion (headless-sicher, kein Dialog-Handling)
    - sanitize-then-dice Reihenfolge (RESEARCH.md Falle 3, unveraendert erhalten)
key_files:
  created: []
  modified:
    - features/bestiary/bestiary-render.js
    - features/initiative-statblock.js
    - features/initiative.js
    - ui/actions/combat-actions.js
    - tests/e2e/features/initiative.spec.js
decisions:
  - "renderStatblockHTML als top-level Funktion in bestiary-render.js (nicht initiative-statblock.js): gemeinsame Nutzung durch renderBestiaryDetail() und den Drawer (DRY), window-export ermoeglicht Cross-Modul-Zugriff"
  - "E2E-Daten-Injektion via page.evaluate() statt UI-Interaction: Bestiary-Tab -> prompt-Dialog -> Initiative-Wechsel waere fragil in headless; evaluate() ist deterministisch und schnell (< 3 s fuer alle 4 Tests)"
  - "Book-Button nach dem Loeschen-Button im .init-right Cluster: konsistent mit PATTERNS.md, kein -stop-Suffix benoetigt (Button ist direktes Klickziel, kein Row-Handler-Konflikt)"
metrics:
  duration: "~20 Minuten"
  completed: "2026-06-14"
  tasks_completed: 3
  tasks_total: 3
  files_created: 0
  files_modified: 5
---

# Phase 04 Plan 02: INIT-01 Statblock-Drawer Summary

**Gesamtergebnis:** `renderStatblockHTML` als gemeinsame reine Funktion extrahiert, vollstaendiger rechts-Drawer fuer Bestiary-Monster und Basis-Info-Card fuer Spieler/manuelle Kombattanten implementiert, Buch-Button in jede Init-Zeile eingefuegt, 4 E2E-Tests gruen.

---

## Completed Tasks

| Task | Name | Commit | Schlüsseldateien |
|------|------|--------|-----------------|
| 1 | renderStatblockHTML extrahieren + Drawer implementieren | 997e853 | features/bestiary/bestiary-render.js, features/initiative-statblock.js |
| 2 | Buch-Button + data-actions registrieren | e1c2f26 | features/initiative.js, ui/actions/combat-actions.js |
| 3 | Statblock E2E Suite (4 Tests) | 8efed44 | tests/e2e/features/initiative.spec.js |

---

## Deliverables

### features/bestiary/bestiary-render.js — renderStatblockHTML extrahiert

- **`renderStatblockHTML(monster, source)`** neu als top-level Funktion: kapselt alle 20 HTML-Sektionen des Parchment-Statblocks inkl. nested Helfer `attrMod()`, `renderTraitList()`, `renderInlineList()`.
- **`renderBestiaryDetail()`** bereinigt: Portrait, Aktionsbuttons, Attribution bleiben; ruft jetzt `renderStatblockHTML()` auf (kein Code-Duplikat mehr).
- `window.renderStatblockHTML` exportiert fuer Initiative-Drawer.
- Sanitize-then-dice Reihenfolge in `renderTraitList()` unveraendert erhalten (T-04-04).

### features/initiative-statblock.js — Vollstaendige Implementierung

- Wave-0-Placeholder `renderStatblockHTML()` (gab `''` zurueck) entfernt — keine Duplikat-Deklaration mehr.
- **`showInitStatblockPanel(cbId)`**: Lazy-creates `.modal-overlay.init-statblock-drawer#init-statblock-panel`, befuellt `.init-statblock-content` mit `window.renderStatblockHTML()` (Monster) oder `renderBasicCombatantInfo()` (kein statblockRef / Monster nicht gefunden).
- **`closeInitStatblockPanel()`**: Entfernt `.show`-Klasse.
- **`renderBasicCombatantInfo(cb)`**: HP/AC/Effekte mit `esc()` fuer alle D-Werte (T-04-05).
- `statblockRef.id` via `window.getBestiaryMonster(cb.statblockRef.id, ...)` — String-Vergleich, kein `parseEntityId()` (RESEARCH.md Falle 2, T-04-06).

### features/initiative.js — Buch-Button

- Book-Button `<button class="btn-icon init-statblock-btn" data-action="show-init-statblock" ...>📖</button>` am Ende des `.init-right` Clusters jeder Standard-Init-Zeile.
- `title="Statblock anzeigen"` fuer Monster, `"Basisinfos anzeigen"` fuer Spieler/manuelle Kombattanten.
- Nicht im Lair-Zweig (lines 147-161) — korrekt.

### ui/actions/combat-actions.js — Action-Handler

- `'show-init-statblock': ctx => showInitStatblockPanel(ctx.id)` — kein `-stop` Suffix noetig (Button ist direktes Klickziel).
- `'close-init-statblock': () => closeInitStatblockPanel()` — fuer programmatisches Schliessen.

### tests/e2e/features/initiative.spec.js — 4 Tests, alle gruen

| Test | Assertion | Ergebnis |
|------|-----------|---------|
| A: Button sichtbar | `[data-action="show-init-statblock"]` in Init-Zeile | PASS |
| B: Drawer mit Statblock | `.init-statblock-panel.show` + `.bestiary-statblock` | PASS |
| C: Basic-Info-Card | `.init-statblock-basic` fuer Kombattant ohne statblockRef | PASS |
| D: Klickbare Wuerfel | `[data-action="bestiary-roll-dice"]` Spans vorhanden | PASS |

---

## Deviations from Plan

Keine Bugs gefunden oder gefixt.

### Anpassungen gegenueber Plan-Spezifikation

**1. [Rule 2 - Robustheit] renderBasicCombatantInfo: Leer-Fallback bedingt**

- **Gefunden waehrend:** Task 1
- **Issue:** Plan spezifiziert "Keine weiteren Daten verfuegbar." als Fallback-Text. Da Effekte bereits leer sein koennen, wuerde der Text immer erscheinen auch wenn HP/AC vorhanden sind.
- **Fix:** Fallback-Text nur angezeigt wenn keine Effekte vorhanden — semantisch korrekt.
- **Dateien:** features/initiative-statblock.js

---

## Threat Surface Scan

Keine neuen Netzwerk-Endpunkte, Auth-Pfade oder Schema-Aenderungen eingefuehrt.

| Drohung | Massnahme | Status |
|---------|-----------|--------|
| T-04-04: XSS ueber Statblock-Text | sanitizeHTML vor renderClickableDice in renderTraitList (unveraendert aus renderBestiaryDetail) | Mitigiert |
| T-04-05: XSS in renderBasicCombatantInfo | esc() fuer alle cb.name/HP/AC-Felder, String()-Cast vor esc() fuer numerische Werte | Mitigiert |
| T-04-06: statblockRef.id in Lookup | window.getBestiaryMonster mit String-Vergleich, nie parseEntityId() | Mitigiert |

---

## Known Stubs

Keine neuen Stubs eingefuehrt. Alle Wave-1-Stubs aus SUMMARY 04-01 sind jetzt durch echte Implementierungen ersetzt:
- `renderStatblockHTML()` — implementiert (in bestiary-render.js)
- `renderBasicCombatantInfo()` — implementiert (in initiative-statblock.js)

Wave-3-Stubs in `features/initiative-mob.js` bleiben unveraendert (nicht Scope dieses Plans).

---

## Self-Check

Datei-Check:
features/bestiary/bestiary-render.js — FOUND
features/initiative-statblock.js — FOUND
features/initiative.js — FOUND
ui/actions/combat-actions.js — FOUND
tests/e2e/features/initiative.spec.js — FOUND

Commit-Check:
997e853 — feat(04-02): extract renderStatblockHTML + implement drawer — FOUND
e1c2f26 — feat(04-02): inject book button + register statblock data-actions — FOUND
8efed44 — test(04-02): statblock E2E suite gruen (4/4 Tests) — FOUND

Source-Checks:
grep -c "function renderStatblockHTML" features/bestiary/bestiary-render.js → 1 (korrekt)
grep -c "function renderStatblockHTML" features/initiative-statblock.js → 0 (korrekt, Duplikat entfernt)
python build.py → PASS (keine Duplikat-Deklarationsfehler, 2,560,587 Zeichen)
E2E statblock subset → 4/4 PASS (3.3 s)

## Self-Check: PASSED
