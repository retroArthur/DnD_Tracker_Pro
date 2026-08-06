---
phase: 05-welt-story
plan: "07"
subsystem: fraktionen-ruf-system
tags: [fraktionen, ruf-system, npc-factionId, welt-05, wave-7]
dependency_graph:
  requires:
    - D.factions[]          # 05-01 core/data.js Schema
    - pushUndo              # systems/undo.js
    - deleteWithConfirm     # utils/crud-helpers.js
    - parseEntityId         # utils/utilities.js
    - EntityLookup          # render/helpers.js
    - nextId                # core/data.js
    - saveNPC               # 05-07 erweitert (npc.factionId)
  provides:
    - FRAKTIONS_RUF_STUFEN
    - rufStufe
    - renderFraktionen
    - selectFraktion
    - saveFraktion
    - deleteFraktion
    - anpassenRuf
    - setzeRuf
    - showFraktionModal
    - npc.factionId persistiert in saveNPC
    - WELT-05-unit-tests-active
    - WELT-05-e2e-tests-active
  affects:
    - features/fraktionen/fraktionen-render.js
    - features/fraktionen/fraktionen-crud.js
    - features/npcs/npc-crud.js
    - assets/templates/modals-entity.html
    - assets/templates/view-welt.html
    - assets/styles/welt.css
    - ui/actions/entity-actions.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
tech_stack:
  added: []
  patterns:
    - 5-Stufen-Ruf-Skala (−50…+50): FRAKTIONS_RUF_STUFEN analog RELATION_STATUS
    - pushUndo-first Pattern: pushUndo('Ruf angepasst') VOR Mutation (T-05-26)
    - clamp(-50,+50) DoS-Schutz für Ruf-Delta (T-05-24)
    - Detail-Panel via selectFraktion() ohne vollständiges Re-Render der Liste
    - npc.factionId optionales Feld — rückwärts-kompatibel (missing = null)
    - fr- CSS-Präfix mit zwei-Spalten-Grid-Layout (320px + 1fr)
key_files:
  created: []
  modified:
    - features/fraktionen/fraktionen-render.js
    - features/fraktionen/fraktionen-crud.js
    - features/npcs/npc-crud.js
    - assets/templates/modals-entity.html
    - assets/templates/view-welt.html
    - assets/styles/welt.css
    - ui/actions/entity-actions.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
decisions:
  - "FRAKTIONS_RUF_STUFEN in fraktionen-render.js (nicht crud.js) — rufStufe() von render + crud genutzt"
  - "Detail-Panel via selectFraktion() aktualisiert nur den #fr-detail-panel-Bereich (kein Voll-Re-Render)"
  - "npc.factionId: parseInt()||null — 0 wird zu null (verhindert falsche FK-Refs)"
  - "Ruf-Buttons ±5 und ±10 (Plan hatte nur ±, konkrete Schrittgröße nach UX-Erwägen)"
  - "E2E-Tests rufen anpassenRuf direkt via page.evaluate (kein DOM-Formular-Roundtrip)"
  - "Symbol max 2 Zeichen via [...symbol].slice(0,2).join('') — analog random-tables"
metrics:
  duration_minutes: 25
  completed_date: "2026-06-15"
  tasks_total: 2
  tasks_completed: 2
  files_created: 0
  files_modified: 9
---

# Phase 05 Plan 07: WELT-05 Fraktionen & Ruf-System Summary

**One-liner:** Fraktionen-Tab mit 5-Stufen-Ruf-Skala (−50…+50: Feindlich/Misstrauisch/Neutral/Freundlich/Verbündet), anpassenRuf mit pushUndo-first + rufHistorie, Mitgliederliste via npc.factionId und Fraktions-Detail-Panel.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Ruf-Stufen-Logik + CRUD + Unit-Tests aktiviert | e157f55 | fraktionen-render.js, fraktionen-crud.js, welt-story.test.js |
| 2 | Render + Mitgliederliste + npc.factionId + View/CSS/Actions/E2E | fd9594c | welt.css, modals-entity.html, view-welt.html, npc-crud.js, entity-actions.js, welt-story.spec.js |

## What Was Built

### Task 1 — Ruf-Stufen-Logik + CRUD

**features/fraktionen/fraktionen-render.js** (Stub → vollständige Implementierung):

- **`FRAKTIONS_RUF_STUFEN`**: 5-Stufen-Array (−50…+50), analog `RELATION_STATUS` aus npc-render.js
  - Feindlich (−50…−21, 🔴), Misstrauisch (−20…−1, 🟠), Neutral (0, ⚪), Freundlich (1…20, 🟡), Verbündet (21…50, 🟢)
- **`rufStufe(rufwert)`**: Stufen-Lookup mit Neutral-Fallback; auf window exportiert

**features/fraktionen/fraktionen-crud.js** (Stub → vollständige Implementierung):

- **`saveFraktion()`**: Liest Formular; symbol auf max 2 Zeichen (analog random-tables); `nextId('factions')` + `pushUndo` + push/update; renderFraktionen + save
- **`deleteFraktion(id)`**: Via `deleteWithConfirm({entityType:'factions',...})`
- **`anpassenRuf(fraktionId, delta, grund)`**: `pushUndo('Ruf angepasst')` VOR Mutation (T-05-26); clamp(ruf, −50, +50) (T-05-24); `rufHistorie.push({delta, grund, zeitstempel})`
- **`setzeRuf(fraktionId, neuerWert, grund)`**: Direktes Setzen mit delta-Berechnung für Historie; ebenfalls pushUndo-first
- **`showFraktionModal(id)`**: Öffnet Modal für Neu/Edit; befüllt Sitz-Ort-Select aus `D.locations`

**tests/unit/welt-story.test.js**: 12 WELT-05-Tests aktiviert (von skip → aktiv):
- `rufStufe(15).label === 'Freundlich'`
- `rufStufe(21).label === 'Verbündet'`
- `rufStufe(-25).label === 'Feindlich'`
- `rufStufe(0).label === 'Neutral'`
- Grenzwerte ±50, ±1, −1
- `anpassenRuf`: rufHistorie-Eintrag, delta, clamp +50, clamp −50

### Task 2 — Render + View + CSS + Actions + E2E

**features/fraktionen/fraktionen-render.js** (erweitert):

- **`renderFraktionen()`**: Zwei-Spalten-Grid-Layout (`fr-layout`: 320px + 1fr); Übersichtsliste mit `fr-faction-card` (Symbol, Name, Ruf-Badge, Mitglieder-Zahl); initial kein Detail ausgewählt → Platzhalter
- **`selectFraktion(id)`**: Selektiert Karte, lädt Detail-Panel
- **`_renderFraktionDetail(fraktionId)`**: Vollständiges Detail mit:
  - Ruf-Statusbar (farblich codiert)
  - Agenda / Beschreibung (sanitizeHTML)
  - +10 / +5 / −5 / −10 Ruf-Buttons + Grund-Eingabe + direktes Setz-Feld
  - Ruf-Historie (neueste zuerst, delta farbig, Zeitstempel)
  - Mitgliederliste: `D.npcs.filter(n => parseEntityId(n.factionId) === id)` (T-05-25: toleriert fehlende Refs)
  - Sitz-Ort via `EntityLookup.location()` (defensiv)
  - Rivalen / Verbündete als `esc()`-Freitext

**Sicherheits-Mitigationen:**
- T-05-23 (XSS): Name/Grund/Rivalen via `esc()`; Agenda/Beschreibung via `sanitizeHTML()`; Symbol auf max 2 Zeichen
- T-05-24 (DoS): `clamp(ruf, -50, 50)` vor Speichern
- T-05-25 (Tampering): `parseEntityId()` für alle FK-Vergleiche; fehlende Refs → leere Anzeige, kein Crash
- T-05-26 (Tampering): `pushUndo()` immer VOR Mutation

**assets/templates/modals-entity.html**:
- Fraktionen-Modal (`#fraktionen-modal`): Name/Symbol/Ruf-Init/Agenda-RTE/Beschreibung-RTE/Sitz-Ort-Select/Rivalen/Verbündete
- NPC-Modal: `#npc-faction`-Select im Tags-Bereich (WELT-05 Erweiterung; rückwärts-kompatibel)

**assets/templates/view-welt.html**:
- `data-action="call"` → `data-action="show-fraktion-modal"` korrigiert (Wave-0-Fehler)
- `#fr-view-content` / `#fraktionen-content` für renderFraktionen()

**assets/styles/welt.css** (+190 Zeilen, fr-* Präfix):
- Layout: `.fr-layout`, `.fr-list`, `.fr-view-content`
- Karten: `.fr-faction-card`, `.fr-card-symbol`, `.fr-card-name`, `.fr-card-ruf`, `.fr-card-meta`, `.fr-card-actions`, `.fr-selected`
- Ruf: `.fr-ruf-badge`, `.fr-ruf-value`, `.fr-ruf-statusbar`
- Detail: `.fr-detail-panel`, `.fr-detail-header`, `.fr-detail-symbol`, `.fr-detail-name`, `.fr-detail-section`, `.fr-section-title`
- Ruf-Controls: `.fr-ruf-controls`, `.fr-ruf-grund-input`, `.fr-ruf-buttons`, `.fr-ruf-btn-plus`, `.fr-ruf-btn-minus`, `.fr-ruf-set-row`, `.fr-ruf-set-input`
- Historie: `.fr-historie-list`, `.fr-historie-eintrag`, `.fr-hist-delta`, `.fr-hist-plus`, `.fr-hist-minus`, `.fr-hist-grund`, `.fr-hist-ts`
- Mitglieder: `.fr-mitglieder-list`, `.fr-mitglied-item`, `.fr-mitglied-name`, `.fr-mitglied-rolle`
- Mobile-Breakpoint (max-width 700px + 500px)

**features/npcs/npc-crud.js** (erweitert):
- `saveNPC()`: `factionId: parseInt($('npc-faction')?.value) || null` — rückwärts-kompatibel
- `editNPC()`: Befüllt `#npc-faction`-Select aus `D.factions`; setzt Vorbelegung via setTimeout
- `clearNPCForm()`: `'npc-faction'` in textFields ergänzt

**ui/actions/entity-actions.js**: 10 neue Handler:
- `show-fraktion-modal` → `showFraktionModal(value||null)`
- `edit-fraktion` → `showFraktionModal(value||id)` (Edit-Modus)
- `save-fraktion` → `saveFraktion()`
- `delete-fraktion` → `deleteFraktion(value||id)`
- `select-fraktion` → `selectFraktion(value||id)`
- `ruf-plus` / `ruf-plus5` / `ruf-minus` / `ruf-minus5` → `anpassenRuf()` mit Grund-Input
- `ruf-set` → `setzeRuf()` mit direktem Wert + Grund-Input

**tests/e2e/features/welt-story.spec.js**: 5 WELT-05-E2E-Tests aktiviert:
- Tab fraktionen sichtbar + anklickbar
- Fraktion anlegen → `D.factions.length === 1` + Karte sichtbar
- Ruf-Anpassung: `anpassenRuf(1, 10, ...)` → `rufHistorie.length === 1`, `ruf === 10`
- Undo nach Ruf-Änderung → `faction.ruf === 0`
- NPC mit `factionId` → erscheint in `.fr-mitglied-name`

## Acceptance Gate Results

| Gate | Ergebnis |
|------|----------|
| `npx jest tests/unit/welt-story.test.js -t "WELT-05"` | BESTANDEN — 12 Tests grün |
| `npx jest tests/unit/welt-story.test.js` | BESTANDEN — 37 Tests grün, 0 skipped |
| `PYTHONIOENCODING=utf-8 python build.py` | BESTANDEN — 2.64 MB, keine SyntaxErrors, keine Duplikat-Funktionen |
| `FRAKTIONS_RUF_STUFEN` auf window exportiert | BESTANDEN |
| `rufStufe` auf window exportiert | BESTANDEN |
| `anpassenRuf` pushUndo VOR Mutation | BESTANDEN — pushUndo ist erste Anweisung in anpassenRuf |
| `saveNPC` nicht dupliziert — nur erweitert | BESTANDEN — function saveNPC() nur einmal definiert |
| Keine doppelten Top-Level-Funktionsnamen | BESTANDEN — build.py Dedup-Check grün |
| Keine const X = window.X in Funktionen | BESTANDEN — nur module-level `var D = window.D; var save = window.save;` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Auto-fix] Wave-0-Button-Pattern korrigiert in view-welt.html**
- **Found during:** Task 2 (Analyse)
- **Issue:** `data-action="call" data-value="saveFraktion"` — `call`-Action existiert nicht in entity-actions.js (Wave-0-Skelett hatte falsches Muster, analog Plan 05-06 Deviation)
- **Fix:** Zu `data-action="show-fraktion-modal"` geändert (öffnet Modal → Formular → saveFraktion)
- **Files modified:** assets/templates/view-welt.html
- **Commit:** fd9594c

**2. [Rule 2 - Missing critical functionality] setzeRuf() als direktes-Setzen-Funktion ergänzt**
- **Found during:** Task 1 (Plan-Analyse: nur +/− Buttons beschrieben, aber direktes Setzfeld im Plan erwähnt)
- **Issue:** Plan beschreibt "+/− Buttons oder direktem Setzen" (D-18) — direkte-Setzen-Logik braucht eigene Funktion die delta berechnet und die gleiche rufHistorie-Struktur schreibt
- **Fix:** `setzeRuf(fraktionId, neuerWert, grund)` implementiert; pushUndo-first, delta-Berechnung, clamp
- **Files modified:** features/fraktionen/fraktionen-crud.js
- **Commit:** e157f55

**3. [Rule 2 - UX] Ruf-Buttons ±5 zusätzlich zu ±10 ergänzt**
- **Found during:** Task 2 (UI-Implementierung)
- **Issue:** Plan hat "+/−-Ruf-Buttons" ohne konkrete Schrittgröße; nur ±10 wäre bei −50…+50 zu grob (5 Klicks max statt granulare Kontrolle)
- **Fix:** Zusätzlich ±5-Buttons (`ruf-plus5`, `ruf-minus5`); beide Handler in entity-actions.js registriert
- **Files modified:** features/fraktionen/fraktionen-render.js, ui/actions/entity-actions.js
- **Commit:** fd9594c

## Known Stubs

Keine — alle WELT-05-Pflichtfunktionen vollständig implementiert.

`npc.factionId` ist ein bewusst optionales Feld (null = keine Fraktion). Das Fehlen des Feldes in bestehenden NPCs ist kein Stub sondern rückwärts-kompatibles Design.

## Threat Flags

| Flag | Datei | Beschreibung |
|------|-------|-------------|
| T-05-23 mitigiert | fraktionen-render.js | Name/Grund/Rivalen via esc(); Agenda/Beschreibung via sanitizeHTML(); Symbol auf max 2 Zeichen |
| T-05-24 mitigiert | fraktionen-crud.js (anpassenRuf, setzeRuf) | clamp(ruf, -50, 50) vor Speichern; delta selbst nicht über Schleifen genutzt |
| T-05-25 mitigiert | fraktionen-render.js (_renderFraktionDetail) | parseEntityId() für FK-Vergleiche; fehlende location/npc → leere Anzeige, kein Crash |
| T-05-26 mitigiert | fraktionen-crud.js (anpassenRuf, setzeRuf) | pushUndo() immer VOR Mutation; E2E prüft Undo stellt ruf===0 wieder her |

## Self-Check: PASSED

- features/fraktionen/fraktionen-render.js: FRAKTIONS_RUF_STUFEN, rufStufe, renderFraktionen, selectFraktion — vorhanden + auf window exportiert
- features/fraktionen/fraktionen-crud.js: saveFraktion, deleteFraktion, anpassenRuf, setzeRuf, showFraktionModal — vorhanden + auf window exportiert
- features/npcs/npc-crud.js: factionId in saveNPC-Objekt; editNPC befüllt #npc-faction-Select; clearNPCForm enthält 'npc-faction'
- assets/templates/modals-entity.html: #fraktionen-modal vorhanden; #npc-faction Select vorhanden
- assets/templates/view-welt.html: data-action="show-fraktion-modal" (korrigiert)
- assets/styles/welt.css: fr-* Klassen vorhanden (>190 neue Regeln)
- ui/actions/entity-actions.js: show-fraktion-modal, edit-fraktion, save-fraktion, delete-fraktion, select-fraktion, ruf-plus, ruf-plus5, ruf-minus, ruf-minus5, ruf-set registriert
- tests/unit/welt-story.test.js: 37 Tests grün (12 neue WELT-05), 0 skipped
- tests/e2e/features/welt-story.spec.js: 5 WELT-05-Tests aktiviert
- Commits: e157f55 (Task 1), fd9594c (Task 2) — beide vorhanden
- `python build.py` grün (2.64 MB, keine SyntaxErrors, keine Duplikat-Funktionen)
