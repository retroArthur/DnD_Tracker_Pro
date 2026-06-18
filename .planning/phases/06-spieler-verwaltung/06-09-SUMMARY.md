---
phase: 06-spieler-verwaltung
plan: "09"
subsystem: features/initiative — XP-Verteilung
tags: [xp, char-selection, initiative, uat-gap, char-01]
dependency_graph:
  requires: [06-04]
  provides: [xp-exclude-players]
  affects: [features/initiative.js, assets/templates/modals-entity.html, assets/styles/initiative.css, ui/actions/combat-actions.js]
tech_stack:
  added: []
  patterns: [data-action delegation, scoped change listener via flag-property, parseEntityId for DOM→data resolution]
key_files:
  created: []
  modified:
    - features/initiative.js
    - assets/templates/modals-entity.html
    - assets/styles/initiative.css
    - ui/actions/combat-actions.js
    - tests/e2e/features/character-advancement.spec.js
decisions:
  - "xp-exclude-players: keine neuen Module — 4 Dateien geändert, kein build.py/loader.js-Eingriff nötig"
  - "hpCurrent>0-Filter komplett entfernt — lebend/tot-Status gatet die Auswahl nicht"
  - "scoped change-Listener via _xpDistCbListener-Flag (analog zum bestehenden _xpDistListener-Pattern)"
  - "0-Guard: Warn-Toast + return ohne pushUndo/Mutation (T-06-09-03)"
metrics:
  duration: "~20 min"
  completed: "2026-06-18"
  tasks: 1
  files: 5
---

# Phase 06 Plan 09: XP-Verteilung mit manueller Char-Auswahl Summary

XP-Modal zeigt alle Party-Chars als Checkbox-Liste (default alle angehakt, Info-HP-Badge), verteilt XP nur an angehakte — unabhängig vom HP-/Lebend-Status; 4 neue E2E-Tests grün.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | XP-Verteilung mit manueller Pro-Charakter-Auswahl (Checkbox, lebend/tot-unabhängig) + E2E | 1ff49ac | initiative.js, modals-entity.html, initiative.css, combat-actions.js, character-advancement.spec.js |

## What Was Built

### modals-entity.html — #xp-distribution-modal

Zwischen der `.form-group` (Total-Input) und `#xp-dist-preview` wurde eingefügt:
- `.xp-dist-char-select-header` mit „Spieler auswählen:"-Label und zwei Quick-Select-Buttons (`data-action="xp-dist-select-all"` / `data-action="xp-dist-select-none"`, kein inline onclick)
- Leerer Container `<div id="xp-dist-char-list" class="xp-dist-char-list">` — zur Laufzeit befüllt

Der bestehende `#xp-dist-party-info`/`#xp-dist-living-count`-Block bleibt erhalten (Wortlaut per JS auf „M von K ausgewählt" umgestellt).

### features/initiative.js

**`showXpDistributionModal()`:**
- Rendert jeden `D.characters`-Eintrag als `<label class="xp-dist-char-row">` mit Checkbox (`data-id`, default `checked`), `esc(name)`, aktuelle XP, INFO-only HP-Badge (`💀 0 HP` / `❤️ N/M`)
- Scoped `change`-Listener auf `#xp-dist-char-list` (Flag `_xpDistCbListener`) ruft `updateXpDistPreview()`
- Bestehender `input`-Listener auf `#xp-distribution-total` bleibt erhalten
- Initiales `updateXpDistPreview()` am Ende

**`updateXpDistPreview()`:**
- `selectedCount = document.querySelectorAll('#xp-dist-char-list .xp-dist-char-cb:checked').length`
- `#xp-dist-living-count` zeigt „M von K ausgewählt"
- `selectedCount === 0` → „Keine Spieler ausgewählt"-Hinweis; `total > 0` → share/remainder-Zeile; sonst leer

**`applyXpDistribution()`:**
- Sammelt angehakte Checkbox-ids via `parseEntityId(cb.dataset.id)` → `D.characters` (T-06-09-02)
- `selectedChars.length === 0` → `showToast(...,'warning')` + `return` (kein `pushUndo`, keine Mutation) (T-06-09-03)
- `pushUndo('XP verteilt')` VOR `distributeXP(totalXP, selectedChars)` — Reihenfolge unverändert
- Level-Up-Hints, `save()`, `renderParty()`, `hideModal`, Erfolgs-Toast — alles für `selectedChars`
- **Kein `hpCurrent>0`-Filter mehr** — 0-HP-Char bekommt XP wenn angehakt

**`xpDistSelectAll()` / `xpDistSelectNone()`:**
- Setzen alle `.xp-dist-char-cb` auf `checked=true`/`false` + rufen `updateXpDistPreview()`
- Via `window.xpDistSelectAll/xpDistSelectNone` exportiert

### ui/actions/combat-actions.js

`xp-dist-select-all` und `xp-dist-select-none` registriert (neben `apply-xp-distribution`).

### assets/styles/initiative.css

Neue Klassen (CSS-Variablen, keine Inline-Styles, mobil-freundlich):
- `.xp-dist-char-list` — max-height 180px, overflow-y:auto, border/radius wie .xp-dist-autosum
- `.xp-dist-char-row` — flex, min-height 32px, cursor:pointer, Hover-Highlight
- `.xp-dist-char-cb` — accent-color: var(--gold)
- `.xp-dist-char-name` — flex:1, overflow ellipsis
- `.xp-dist-char-xp`, `.xp-dist-char-hp`, `.xp-dist-char-hp--down` — text-dim, 0-HP gedämpft
- `.xp-dist-char-select-header`, `.xp-dist-quick-select` — Header mit Quick-Select-Buttons
- `.xp-dist-preview-hint` — Stil für „Keine Spieler ausgewählt"-Hinweis

### tests/e2e/features/character-advancement.spec.js

4 neue Tests im describe `CHAR-01 / 06-09: XP-Verteilung mit Char-Auswahl`:
- **(a)** Alle 3 Chars gelistet + default checked
- **(b)** Abwählen eines Chars → Share-Update (100/3→50 bei 2)
- **(c)** Nur angehakte erhalten XP (abgewählter = 0 XP, 0-HP angehakt = XP)
- **(d)** Alle abwählen → Guard-Toast „Keine Spieler", keine Mutation

## Verification Results

```
PYTHONIOENCODING=utf-8 python build.py  → exit 0 (Build 2.71 MB, 445 Konflikte bereinigt)
npx jest                                → 421/421 Tests grün
npx playwright test character-advancement.spec.js → 15/15 Tests grün (incl. 4 neue)
```

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat | Mitigation |
|--------|-----------|
| T-06-09-01 (XSS) | `esc(ch.name)` in allen Checkbox-Zeilen |
| T-06-09-02 (Tampering dataset.id) | `parseEntityId(cb.dataset.id)` + Auflösung gegen `D.characters`; nicht auflösbare ids ignoriert |
| T-06-09-03 (DoS / 0-selected) | Guard in `applyXpDistribution`: Warn-Toast + return, kein pushUndo, keine Mutation |

## Known Stubs

None.

## Threat Flags

None — kein neuer Netzwerkendpunkt, kein neuer Auth-Pfad, keine Schema-Änderung.

## Self-Check: PASSED

- [x] `features/initiative.js` — xp-dist-char-list vorhanden: FOUND
- [x] `assets/templates/modals-entity.html` — xp-dist-char-list vorhanden: FOUND
- [x] `assets/styles/initiative.css` — .xp-dist-char-list vorhanden: FOUND
- [x] `ui/actions/combat-actions.js` — xp-dist-select-all registriert: FOUND
- [x] `tests/e2e/features/character-advancement.spec.js` — 4 neue Tests: FOUND
- [x] Commit 1ff49ac: FOUND
