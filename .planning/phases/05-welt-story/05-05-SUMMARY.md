---
phase: 05-welt-story
plan: "05"
subsystem: timeline-kalender
tags: [timeline, calendar, harptos, welt-03, shared-helpers, wave-5]
dependency_graph:
  requires:
    - HARPTOS_MONTHS-in-constants  # 05-01
    - timeline-skeleton             # 05-01
    - entity-actions-js             # 05-03
  provides:
    - advanceCalendarDate
    - addCalendarEvent
    - sortiereTimelineEvents
    - renderKalender
    - renderTimeline
    - showTimelineModal
    - WELT-03-unit-tests-active
    - WELT-03-e2e-tests-active
  affects:
    - features/timeline/timeline-crud.js
    - features/timeline/timeline-render.js
    - assets/templates/view-welt.html
    - assets/styles/welt.css
    - ui/actions/entity-actions.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
tech_stack:
  added: []
  patterns:
    - Shared-Helper-Export-Pattern: advanceCalendarDate/addCalendarEvent auf window (Plan 05-06 konsumiert)
    - Transientes Modal: insertAdjacentHTML + .remove() (analog NPC-Generator in 05-04)
    - Auto-Vorschlag via sessionStorage-Dismissed-Liste (kein D-Schreibzugriff bei Verwerfen)
    - DoS-Cap: tage auf 0..3600 geklemmt vor Datums-Loop
    - pushUndo-first Pattern: pushUndo('Timeline-Eintrag') vor D.calendar.events.push
key_files:
  created: []
  modified:
    - features/timeline/timeline-crud.js
    - features/timeline/timeline-render.js
    - assets/templates/view-welt.html
    - assets/styles/welt.css
    - ui/actions/entity-actions.js
    - tests/unit/welt-story.test.js
    - tests/e2e/features/welt-story.spec.js
decisions:
  - "advanceCalendarDate ruft save() direkt (kein pushUndo) — Reise-Abschluss macht selbst pushUndo vor dem Aufruf"
  - "sortiereTimelineEvents als standalone-Funktion + window-Export (testbar + für Plan 05-06 nutzbar)"
  - "Auto-Vorschlag-Dismissed-State in sessionStorage (nicht D) — kein Undo-State-Aufblähung"
  - "Modal via insertAdjacentHTML (transient) — konsistentes Muster mit NPC-Generator (05-04)"
  - "DoS-Cap MAX_ADVANCE_DAYS = 3600 (ca. 10 Harptos-Jahre) — ausreichend für Kampagnen-Zeitraum"
metrics:
  duration_minutes: 18
  completed_date: "2026-06-15"
  tasks_total: 2
  tasks_completed: 2
  files_created: 0
  files_modified: 7
---

# Phase 05 Plan 05: WELT-03 Kampagnen-Timeline & In-Game-Kalender Summary

**One-liner:** Funktionsfähiger Kalender/Timeline-Tab mit Harptos-Datum-Anzeige, chronologisch sortierten D.calendar.events und geteilten Kalender-Helfern (addCalendarEvent/advanceCalendarDate) für Plan 05-06 Reise.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Kalender-Helfer (advanceCalendarDate, addCalendarEvent, Sortierung) | 00d5b06 | features/timeline/timeline-crud.js, tests/unit/welt-story.test.js |
| 2 | Kalender-/Timeline-Render + Auto-Vorschlag + View/CSS/Actions/E2E | d05ce45 | timeline-render.js, welt.css, view-welt.html, entity-actions.js, welt-story.spec.js |

## What Was Built

### Task 1 — Kalender-Helfer + WELT-03 Unit-Tests

**features/timeline/timeline-crud.js** (55 → 220 Zeilen, Stub → vollständige Implementierung):

- **`sortiereTimelineEvents(events)`** — Stabile chronologische Sortierung nach jahr→monat→tag; gibt neues Array zurück (keine Mutation). Auf `window` exportiert.
- **`advanceCalendarDate(tage)`** — DoS-Cap 0..3600 Tage; addiert auf D.calendar.day/month/year mit 30-Tage-Monaten / 12-Monaten-Jahr; Jahresüberlauf erhöht `year`; ruft `save()`. Auf `window` exportiert (Plan 05-06 Reise konsumiert diese Funktion).
- **`addCalendarEvent(datum, titel, typ, quelleId)`** — `pushUndo('Timeline-Eintrag')` → `D.calendar.events.push({id:nextId('calendarEvents'), ...})` → chronologisch sortieren → `save()`. Auf `window` exportiert (Plan 05-06 Reise konsumiert diese Funktion).
- **`saveTimelineEvent()`** — Liest DOM-Felder (#tl-form-tag, #tl-form-monat, #tl-form-jahr, #tl-form-titel, #tl-form-beschreibung, #tl-form-typ); Validierung (Pflichtfeld Titel); ruft `addCalendarEvent`; Modal schließen; `renderTimeline/renderKalender` aufrufen.
- **`deleteTimelineEvent(id)`** — `parseEntityId` → Bestätigungs-Dialog → `pushUndo('Timeline-Eintrag gelöscht')` → Filter → `save()` → `renderTimeline`.
- **Sicherheits-Mitigationen (T-05-16/17/18):** `sanitizeHTML()` für Titel/Beschreibung beim Speichern; DoS-Cap für `tage`; Monat/Tag geklemmt 1..12/1..30.

**tests/unit/welt-story.test.js:** 7 neue WELT-03-Tests aktiviert (von skip → aktiv):
- Chronologische Sortierung (3 Einträge)
- Sortierung nach Jahr
- advanceCalendarDate: einfacher Fall (day+3)
- advanceCalendarDate: Monatsgrenze (30-Tage)
- advanceCalendarDate: Jahresgrenze (12 Monate)
- advanceCalendarDate: negativer Wert → 0 geklemmt
- advanceCalendarDate: DoS-Cap > 3600 → MAX

### Task 2 — Render + Modal + View + CSS + Actions + E2E

**features/timeline/timeline-render.js** (48 → 195 Zeilen):

- **`renderKalender()`** — Container `#tl-kalender-header`; zeigt `{Tag}. {HARPTOS_MONTHS[month-1].name} {Jahr} DR` mit `#kalender-monat-anzeige`-ID (E2E-Target); Jahreszeit-Badge (❄️/🌱/☀️/🍂) aus `monthObj.jahreszeit`; defensiver Container-Check.
- **`renderTimeline()`** — Listet `D.calendar.events` via `sortiereTimelineEvents()`; Typ-Badges (Manuell/Reise/Session); Löschen-Button via `data-action="delete-timeline-event"`; Auto-Vorschlag-Bereich aus `_sammleAutoVorschlaege(d)` (D.sessionNotes-Quelle); leerer Zustand mit Hinweistext; Zähler `#kalender-count` aktualisiert.
- **`showTimelineModal()`** — Transientes Modal via `insertAdjacentHTML`; Felder Tag/Monat(Select aus HARPTOS_MONTHS)/Jahr/Titel/Beschreibung/Typ; Autofokus Titel; `data-action`-Buttons (save-timeline-event, close-timeline-modal).
- **`_sammleAutoVorschlaege(d)`** — Prüft D.sessionNotes gegen D.calendar.events (deduplizierung via quelleId+typ); sessionStorage-basierte Dismissed-Liste (kein D-Schreibzugriff).

**assets/templates/view-welt.html:** + Ereignis-Button auf `data-action="show-timeline-modal"` geändert (statt `call`-Shim).

**assets/styles/welt.css** (+130 Zeilen, tl--Präfix):
- `.tl-kalender-header`, `.tl-kalender-datum`, `.tl-jahreszeit-badge`, `.tl-kalender-actions`
- `.tl-event-card`, `.tl-event-header`, `.tl-event-datum`, `.tl-event-titel`, `.tl-event-beschreibung`, `.tl-event-actions`
- `.tl-typ-badge`, `.tl-typ-manuell`, `.tl-typ-reise`, `.tl-typ-session`
- `.tl-vorschlag-bereich`, `.tl-vorschlag-header`, `.tl-vorschlag-card`, `.tl-vorschlag-titel`, `.tl-vorschlag-meta`, `.tl-vorschlag-actions`
- `.tl-form-row`, `.tl-form-col`, `.tl-form-col-sm`, `.tl-form-field`, `.tl-empty-hint`
- Mobile-Breakpoint (max-width: 500px)

**ui/actions/entity-actions.js:** 6 neue Handler:
- `show-timeline-modal` → `showTimelineModal()`
- `save-timeline-event` → `saveTimelineEvent()`
- `delete-timeline-event` → `deleteTimelineEvent(ctx.id)`
- `close-timeline-modal` → `document.getElementById('tl-event-modal').remove()`
- `confirm-auto-event` → liest Vorschlag-Card, ruft `addCalendarEvent`, markiert in sessionStorage
- `dismiss-auto-event` → markiert in sessionStorage, ruft `renderTimeline`

**tests/e2e/features/welt-story.spec.js:** 4 WELT-03-E2E-Tests aktiviert:
- Tab kalender sichtbar + anklickbar
- `#kalender-monat-anzeige` enthält „Hammer" + „1492 DR"
- `addCalendarEvent()` → `D.calendar.events.length >= 1`
- `sortiereTimelineEvents()` liefert A→B→C korrekte Reihenfolge

## Acceptance Gate Results

| Gate | Ergebnis |
|------|----------|
| `npx jest tests/unit/welt-story.test.js -t "WELT-03"` | BESTANDEN — 7 Tests grün |
| `npx jest tests/unit/welt-story.test.js` | BESTANDEN — 14 aktiv grün, 8 skipped |
| `PYTHONIOENCODING=utf-8 python build.py` | BESTANDEN — grün, 2.58 MB, keine SyntaxErrors |
| `window.advanceCalendarDate` auf window | BESTANDEN — grep in dist zeigt Export |
| `window.addCalendarEvent` auf window | BESTANDEN — grep in dist zeigt Export |
| `window.sortiereTimelineEvents` auf window | BESTANDEN — grep in dist zeigt Export |
| `#kalender-monat-anzeige` in Render | BESTANDEN — grep in dist zeigt ID |
| Keine doppelten Top-Level-Funktionsnamen | BESTANDEN — build.py Dedup-Check grün |
| Keine const X = window.X in Funktionen | BESTANDEN — nur module-level var D/save |

## Deviations from Plan

**None** — Plan exakt wie spezifiziert ausgeführt.

Einzige Design-Entscheidung (nicht im Plan spezifiziert, Rule 2 Auto-Completeness):
- `_sammleAutoVorschlaege()` nutzt sessionStorage für Dismissed-Tracking statt eines D-Feldes, um Undo-State-Aufblähung zu vermeiden und keinen pushUndo für reine UI-Interaktion zu benötigen. Sicher: sessionStorage-Daten sind tab-lokal und werden bei Browser-Schließung geleert — Auto-Vorschläge erscheinen nach erneutem Laden wieder (bewusstes Design: SL kann Vorschlag dann erneut bestätigen/verwerfen).

## Known Stubs

Keine — alle WELT-03-Pflichtfunktionen vollständig implementiert.

## Threat Flags

| Flag | Datei | Beschreibung |
|------|-------|-------------|
| T-05-16 mitigiert | timeline-render.js, timeline-crud.js | Titel via esc() in Anzeige; sanitizeHTML() beim Speichern in addCalendarEvent/saveTimelineEvent |
| T-05-17 mitigiert | timeline-crud.js | advanceCalendarDate: tage auf 0..3600 geklemmt (MAX_ADVANCE_DAYS) vor Datums-Loop |
| T-05-18 mitigiert | timeline-crud.js | Datum: monat per Select aus HARPTOS_MONTHS (1..12) in Modal; tag via clampen 1..30 in addCalendarEvent |

## Self-Check: PASSED

- features/timeline/timeline-crud.js: sortiereTimelineEvents, advanceCalendarDate, addCalendarEvent, saveTimelineEvent, deleteTimelineEvent — alle vorhanden + auf window exportiert
- features/timeline/timeline-render.js: renderKalender, renderTimeline, showTimelineModal — alle vorhanden + auf window exportiert
- assets/styles/welt.css: tl-* Klassen vorhanden (>50 neue Regeln)
- assets/templates/view-welt.html: show-timeline-modal Action korrekt
- ui/actions/entity-actions.js: show-timeline-modal, save-timeline-event, delete-timeline-event, close-timeline-modal, confirm-auto-event, dismiss-auto-event registriert
- tests/unit/welt-story.test.js: 14 aktive Tests grün (7 WELT-01+02 bereits aktiv, 7 neue WELT-03)
- window.advanceCalendarDate in dist/dnd-tracker-bundled.html: GEFUNDEN (Zeile 53205)
- window.addCalendarEvent in dist/dnd-tracker-bundled.html: GEFUNDEN (Zeile 53206)
- Commits: 00d5b06 (Task 1), d05ce45 (Task 2) — beide vorhanden
