---
phase: 05-welt-story
plan: "06"
subsystem: reise-wetter-simulator
tags: [reise, wetter, begegnung, kalender, welt-04, tdd, wave-6]
dependency_graph:
  requires:
    - advanceCalendarDate  # 05-05 timeline-crud.js
    - addCalendarEvent     # 05-05 timeline-crud.js
    - REISE_BEGEGNUNGS_TABELLEN  # 05-02 reise-default-tables.js
    - WETTER_TABELLEN            # 05-02 reise-default-tables.js
    - HARPTOS_SEASONS            # 05-01 core/constants.js
  provides:
    - berechneTagesmarsch
    - rollWetter
    - rollBegegnung
    - jahreszeitAusDatum
    - startReise
    - abschliessenReise
    - bestaetigeReiseTimeline
    - renderReise
    - WELT-04-unit-tests-active
    - WELT-04-e2e-tests-active
  affects:
    - features/reise/reise-crud.js
    - features/reise/reise-render.js
    - assets/templates/view-welt.html
    - assets/styles/welt.css
    - ui/actions/entity-actions.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
tech_stack:
  added: []
  patterns:
    - TDD-Inline-Test-Muster (Non-ESM — Inline-Stubs in test.js, analog WELT-01/02/03)
    - Shared-Helper-Consumption: window.advanceCalendarDate / window.addCalendarEvent aus 05-05
    - DoS-Cap-Klemmen: diceType 2..100, threshold 0..diceType, tage 1..3600
    - pushUndo-first Pattern: pushUndo('Reise abgeschlossen') VOR advanceCalendarDate
    - Transientes Modal: insertAdjacentHTML + .remove() (analog Timeline-Modal in 05-05)
    - Fallback-Mapping: jahreszeitAusDatum mit eingebautem Fallback-Dict
key_files:
  created: []
  modified:
    - features/reise/reise-crud.js
    - features/reise/reise-render.js
    - assets/templates/view-welt.html
    - assets/styles/welt.css
    - ui/actions/entity-actions.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
decisions:
  - "jahreszeitAusDatum mit eingebautem Fallback-Dict (kein crash bei fehlendem HARPTOS_SEASONS)"
  - "startReise liest DOM-Felder direkt (kein D.reisen-Array) — reine Berechnungs-UI, keine Persistenz"
  - "Timeline-Vorschlag via transientes Modal (analog 05-05); wird nach Bestätigung/Schließen entfernt"
  - "renderReise befüllt #reise-content (Skeleton bleibt, section-toolbar wird nicht überschrieben)"
  - "E2E-Tests rufen abschliessenReise direkt via page.evaluate (kein DOM-Formular-Roundtrip nötig)"
metrics:
  duration_minutes: 12
  completed_date: "2026-06-15"
  tasks_total: 2
  tasks_completed: 2
  files_created: 0
  files_modified: 7
---

# Phase 05 Plan 06: WELT-04 Reise- & Wetter-Simulator Summary

**One-liner:** Reise-Tab mit 5e-Tagesmarsch-Berechnung (18/24/30 × distanzFaktor), Klima-Jahreszeit-Wetter via rollWeightedEntry, konfigurierbare Gelände-Begegnungschance (diceType/threshold DoS-clamped) und Kalender-Vorrücken per advanceCalendarDate bei Reise-Abschluss.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 (RED) | WELT-04 Unit Tests (Inline-Implementierung) | 3e09fc8 | tests/unit/welt-story.test.js |
| 1 (GREEN) | Reise-Rechenkern + View + CSS + Actions + E2E | 3e9a2d5 | reise-crud.js, reise-render.js, welt.css, view-welt.html, entity-actions.js, welt-story.spec.js |

## What Was Built

### Task 1 (RED) — WELT-04 Unit Tests

**tests/unit/welt-story.test.js:** 11 neue WELT-04-Tests aktiviert (von skip → aktiv):
- `berechneTagesmarsch('normal','normal') === 24`
- `berechneTagesmarsch('langsam','schwierig') === 9` (18 × 0,5 = 9)
- `berechneTagesmarsch('schnell','normal') === 30`
- `berechneTagesmarsch('langsam','gebirge') === 9`
- rollWetter: entry.text zurück für alle 4 Jahreszeiten
- rollWetter: unbekanntes Klima → null
- rollBegegnung: Shape `{begegnung,ergebnis,wurf}` korrekt
- rollBegegnung: threshold 20 → immer Begegnung, ergebnis nicht null
- rollBegegnung: threshold 0 → nie Begegnung, ergebnis null
- rollBegegnung: DoS-Schutz — diceType 0 und 9999 → keine Exception

Inline-Stubs in der Testdatei (Non-ESM-Muster analog WELT-01/02/03): REISE_TEMPO_STUB,
REISE_GELÄNDE_STUB, WETTER_TABELLEN_STUB (mit echten 1W8-Einträgen), rollWeightedEntryStub.

### Task 1 (GREEN) — Rechenkern + View + CSS + Actions + E2E

**features/reise/reise-crud.js** (Stub → vollständige Implementierung):

- **`jahreszeitAusDatum(monat)`** — nutzt `window.HARPTOS_SEASONS`; Fallback-Dict für Monat 1-12 wenn Konstante fehlt (T-05-22 Mitigation).
- **`berechneTagesmarsch(tempo, gelände)`** — REISE_TEMPO[tempo].meilenProTag × REISE_GELÄNDE[id].distanzFaktor; Math.floor für ganze Meilen.
- **`rollWetter(klima, jahreszeit)`** — WETTER_TABELLEN[klima][jahreszeit] → rollWeightedEntry; null bei fehlender Tabelle.
- **`rollBegegnung(gelaendeId, diceType, threshold)`** — DoS-Klemmen: diceType 2..100, threshold 0..diceType; bei Begegnung rollWeightedEntry(REISE_BEGEGNUNGS_TABELLEN[gelaendeId]).
- **`startReise()`** — liest DOM-Felder (rs-tempo, rs-gelaende, rs-tage, rs-klima, rs-dice-type, rs-threshold); DoS-Tage-Klemme; berechnet Tagesmärsche + Wetter + Begegnungen für alle Tage; rendert in #rs-ergebnis mit Abschluss-Button.
- **`abschliessenReise(tage)`** — `pushUndo('Reise abgeschlossen')` → `window.advanceCalendarDate(tage)` → Kalender-Render → zeigt Abschluss-Info → `_zeigeTimelineVorschlag(tage)`.
- **`bestaetigeReiseTimeline(tage)`** — liest #rs-tl-titel; addCalendarEvent mit typ:'reise' und aktuellem D.calendar-Datum.
- **`_zeigeTimelineVorschlag(anzahlTage)`** — privat; transientes Modal via `document.createElement` + `appendChild`.

**Sicherheits-Mitigationen:**
- T-05-19 (DoS): tage auf 1..3600, diceType auf 2..100, threshold auf 0..diceType
- T-05-20 (XSS): alle Ergebnistexte via `esc()` gerendert
- T-05-21 (Tampering): `pushUndo` immer VOR `advanceCalendarDate`
- T-05-22 (ungültiger Monat): `jahreszeitAusDatum` mit Fallback-Dict statt undefined

**features/reise/reise-render.js** (Stub → vollständige Implementierung):

- **`renderReise()`** — befüllt `#reise-content` mit Konfigurationsformular:
  - Select: Tempo (langsam/normal/schnell mit Meilen-Anzeige)
  - Select: Gelände (aus REISE_GELÄNDE-Konstante)
  - Number: Reisetage (1..365)
  - Select: Klima (aus WETTER_TABELLEN-Keys)
  - Select: Begegnungswürfel (W4/W6/W8/W10/W12/W20)
  - Number: Begegnungs-Schwellenwert (0..20)
  - Info-Zeile: aktuelle Jahreszeit aus D.calendar.month
  - Button: `data-action="start-reise"` → startReise()
  - Ergebnisbereich: `#rs-ergebnis` (befüllt by startReise)

**assets/templates/view-welt.html:**
- #view-reise: button mit `data-action="call" data-value="startReise"` entfernt (war falsches Muster)
- Toolbar auf reine Identität reduziert (Aktion ist im renderReise-Formular)

**assets/styles/welt.css** (+95 Zeilen, rs--Präfix):
- `.rs-config-title`, `.rs-config-field`, `.rs-config-field-sm`, `.rs-label`, `.rs-config-info`, `.rs-config-actions`
- `.rs-result-header`, `.rs-result-meta`, `.rs-result-gesamt`, `.rs-result-jahreszeit`
- `.rs-tages-list`, `.rs-tag-eintrag`, `.rs-tag-header`
- `.rs-wetter-badge`, `.rs-begegnung-badge`, `.rs-begegnung-aktiv`
- `.rs-abschluss-bereich`, `.rs-abschluss-info`
- Mobile-Breakpoint (max-width: 500px)

**ui/actions/entity-actions.js:** 4 neue Handler:
- `start-reise` → `startReise()`
- `abschliessen-reise` → `abschliessenReise(tage)` mit `ctx.value`
- `bestaetigen-reise-timeline` → `bestaetigeReiseTimeline(tage)` mit `ctx.value`
- `schliessen-reise-timeline-modal` → `document.getElementById('rs-timeline-modal').remove()`

**tests/e2e/features/welt-story.spec.js:** 4 WELT-04-E2E-Tests aktiviert:
- Tab reise sichtbar + anklickbar
- Reise-Abschluss: start day=1, 3 Tage → D.calendar.day===4
- Wetter-Roll über rollWetter() gibt entry.text zurück
- Globale Verfügbarkeit aller Kernfunktionen + berechneTagesmarsch(24/9)

## Acceptance Gate Results

| Gate | Ergebnis |
|------|----------|
| `npx jest tests/unit/welt-story.test.js -t "WELT-04"` | BESTANDEN — 11 Tests grün |
| `npx jest tests/unit/welt-story.test.js` | BESTANDEN — 25 aktiv grün, 4 skipped |
| `PYTHONIOENCODING=utf-8 python build.py` | BESTANDEN — grün, 2.60 MB, keine SyntaxErrors |
| `window.berechneTagesmarsch` exportiert | BESTANDEN — grep in dist zeigt 2 Treffer |
| `window.advanceCalendarDate` konsumiert (nicht redefiniert) | BESTANDEN — kein `function advanceCalendarDate` in reise-crud.js |
| `rollWeightedEntry` nicht redefiniert in neuen Modulen | BESTANDEN — nur Aufruf, keine Definition |
| `TERRAIN_MODIFIERS` nicht redefiniert | BESTANDEN — kein TERRAIN_MODIFIERS in reise-*.js |
| Keine doppelten Top-Level-Funktionsnamen | BESTANDEN — build.py Dedup-Check grün |
| Keine const X = window.X in Funktionen | BESTANDEN — nur module-level `var D = window.D;` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Removed broken data-action="call" pattern**
- **Found during:** Task 2 (view-welt.html analysis)
- **Issue:** Wave-0-Skelett hatte `data-action="call" data-value="startReise"` — `call`-Action ist kein registrierter Handler (existiert nicht mehr in entity-actions.js)
- **Fix:** Button entfernt; Formular-Button in renderReise() mit `data-action="start-reise"` ist der korrekte Einstiegspunkt
- **Files modified:** assets/templates/view-welt.html
- **Commit:** 3e9a2d5

**2. [Rule 2 - Missing critical functionality] jahreszeitAusDatum Fallback-Dict**
- **Found during:** Task 1 (Threat T-05-22 Analyse)
- **Issue:** Plan forderte Fallback bei ungültigem Monat; ohne Fallback gibt `HARPTOS_SEASONS[monat]` undefined zurück → crash in rollWetter
- **Fix:** Inline-Fallback-Dict `{1:'winter',...}` in `jahreszeitAusDatum` — Funktion gibt immer eine gültige Jahreszeit zurück
- **Files modified:** features/reise/reise-crud.js
- **Commit:** 3e9a2d5

## Known Stubs

Keine — alle WELT-04-Pflichtfunktionen vollständig implementiert.

`D.reisen[]` wird bewusst NICHT eingeführt: `startReise()` ist eine reine Berechnungs-UI
(kein persistenter Zustand); nur der Kalender-Fortschritt via `advanceCalendarDate` ist persistent.
Dies entspricht dem Plan (kein `D.reisen`-Schema spezifiziert).

## Threat Flags

| Flag | Datei | Beschreibung |
|------|-------|-------------|
| T-05-19 mitigiert | reise-crud.js | tage auf 1..3600, diceType auf 2..100, threshold auf 0..diceType geklemmt |
| T-05-20 mitigiert | reise-crud.js (startReise) | alle Ergebnistexte via esc() |
| T-05-21 mitigiert | reise-crud.js (abschliessenReise) | pushUndo('Reise abgeschlossen') VOR advanceCalendarDate |
| T-05-22 mitigiert | reise-crud.js (jahreszeitAusDatum) | Fallback-Dict; gibt immer gültige Jahreszeit zurück |

## Self-Check: PASSED

- features/reise/reise-crud.js: berechneTagesmarsch, rollWetter, rollBegegnung, jahreszeitAusDatum, startReise, abschliessenReise, bestaetigeReiseTimeline — alle vorhanden + auf window exportiert
- features/reise/reise-render.js: renderReise — vorhanden + auf window exportiert
- assets/styles/welt.css: rs-* Klassen vorhanden (>90 neue Regeln)
- assets/templates/view-welt.html: data-action="call" entfernt, rs-view-content + reise-content korrekt
- ui/actions/entity-actions.js: start-reise, abschliessen-reise, bestaetigen-reise-timeline, schliessen-reise-timeline-modal registriert
- tests/unit/welt-story.test.js: 25 aktive Tests grün (11 neue WELT-04)
- tests/e2e/features/welt-story.spec.js: 4 WELT-04-Tests aktiviert
- Commits: 3e09fc8 (RED), 3e9a2d5 (GREEN) — beide vorhanden
- `python build.py` grün (2.60 MB, keine SyntaxErrors, keine Duplikat-Funktionen)
