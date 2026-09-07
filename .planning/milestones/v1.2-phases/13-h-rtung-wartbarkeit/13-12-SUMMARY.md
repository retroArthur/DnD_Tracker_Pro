---
phase: 13-h-rtung-wartbarkeit
plan: 12
subsystem: maintainability
tags: [module-split, loader, dm-screen, non-esm, build-system, characterization-test]

# Dependency graph
requires:
  - phase: 13-11
    provides: "Proven MAINT-01 split blueprint (banner-cut, single Task-1 tracer slice, immediate build-after-move, full-suite hard gate), applied a fourth and final time to features/dmscreen/dmscreen-render.js — the file D-04 identified as the riskiest of the four (no dedicated test net before this phase)"
  - phase: 13-05
    provides: "Charakterisierungs-Snapshot (tests/unit/dmscreen-characterization.test.js) gegen das UNGETEILTE dmscreen-render.js — die einzige automatisierte Absicherung dieses Moduls, Vorbedingung fuer Task 1"
provides:
  - "features/dmscreen/dmscreen-render.js (1576 Zeilen) aufgeteilt (D-02) in fuenf Dateien: dmscreen-render.js (Kern: Konstanten, Live-Sync, renderDMScreen(), Widget-Registry getDMScreenWidgets(), Ereignisbehandlung, Tastaturkuerzel — 564 Zeilen), dmscreen-config.js (Profile, Widget-Konfiguration, beide Drag-&-Drop-Systeme — 358 Zeilen), dmscreen-widgets-base.js (8 Basis-Widgets — 280 Zeilen), dmscreen-widgets-combat.js (5 kampfbezogene Referenz-Widgets — 170 Zeilen), dmscreen-widgets-reference.js (8 charakter-/umgebungsbezogene Referenz-Widgets — 276 Zeilen)"
  - "MAINT-01 vollstaendig erfuellt: alle vier uebergrossen Module (wiki.js 13-09, initiative.js 13-10, rich-text.js 13-11, dmscreen-render.js 13-12) sind aufgeteilt, alle 14 Ergebnisdateien liegen unter der 800-Zeilen-Grenze (D-01)"
  - "Charakterisierungs-Snapshot aus 13-05 unveraendert gruen — Verhaltensneutralitaet der Aufteilung ist bewiesen, nicht behauptet (einziges automatisiertes Netz fuer dieses Modul)"
affects: [maint-01, loader.js, phase-14]

actuals:
  tokens: 33500
  tasks: 4
  commits: 4

tech-stack:
  added: []
  patterns:
    - "MAINT-01 file-split convention bestaetigt zum vierten und letzten Mal: [SECTION:X]-Kopf je Datei, Schnitt entlang bestehender // ====-Banner, ausschliessliche Registrierung in loader.js MODULES, python build.py + Charakterisierungs-Snapshot --ci nach JEDER Einzelverschiebung (nicht gebuendelt)"
    - "Fuer Module OHNE eigenes Testnetz: ein Charakterisierungs-Snapshot gegen das UNGETEILTE Modul (hier aus 13-05) ist die Vorbedingung, nicht optional — er ist der einzige automatisierte Beweis, dass eine Aufteilung verhaltensneutral war"

key-files:
  created:
    - features/dmscreen/dmscreen-config.js
    - features/dmscreen/dmscreen-widgets-base.js
    - features/dmscreen/dmscreen-widgets-combat.js
    - features/dmscreen/dmscreen-widgets-reference.js
  modified:
    - features/dmscreen/dmscreen-render.js
    - loader.js
    - tests/build/test_build_deduplication.py
    - .planning/REQUIREMENTS.md
    - .planning/STATE.md

key-decisions:
  - "Task 1 (tracer) verschob die acht charakter- und umgebungsbezogenen Referenz-Widgets (Attribute, Rettungswuerfe, Fertigkeiten, Groessen, Objekte, Ritual & Konzentration, Wissensgebiete, Reisen & Traglast) als erste, risikoaermste Gruppe — reine Referenzdarstellungen ohne Zustand, ohne Ereignisbehandlung, ohne gegenseitige Abhaengigkeit. Der Charakterisierungs-Snapshot war davor und danach zeichengleich gruen."
  - "Task 2 teilte die restlichen vier Verantwortlichkeiten inhaltlich, nicht nach Zeilenbalance oder Alphabet: dmscreen-config.js (Profile + Widget-Konfiguration + beide Drag-&-Drop-Systeme), dmscreen-widgets-base.js (8 Basis-Widgets), dmscreen-widgets-combat.js (5 kampfbezogene Referenz-Widgets). Kernmodul behaelt CONSTANTS, LIVE-SYNC SYSTEM, renderDMScreen(), getDMScreenWidgets(), EVENT HANDLERS, KEYBOARD SHORTCUTS und den BACKWARD-COMPATIBILITY-Exportblock."
  - "Name-Diff (Top-Level-Deklarationen im Original vs. Summe der fuenf neuen Dateien) als explizite Gegenprobe zum 12-fehlenden-Deklarationen-Vorfall aus 13-11: leer — nichts fehlt, nichts ist doppelt."
  - "Plan-Datenabweichung dokumentiert statt 'repariert': die Plan-Vorgabe grep -c registerPostSaveHook dmscreen-render.js == 1 maß tatsaechlich 3 — verifiziert identisch in der ungeteilten Datei (git show 77f78f8:features/dmscreen/dmscreen-render.js), 0 in den vier anderen Dateien. Vierter Fall des gleichen Stale-Count-Musters wie in 13-09/13-10/13-11 (dort Export-Zahlen)."

patterns-established: []

requirements-completed: [MAINT-01]

coverage:
  - id: D1
    description: "Task 1 (Tracer): 8 charakter-/umgebungsbezogene Referenz-Widgets nach dmscreen-widgets-reference.js verschoben, Registry referenziert sie weiterhin als bare Bezeichner"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -c '^function renderDMSSkillsWidget' dmscreen-render.js == 0; == 1 in dmscreen-widgets-reference.js; grep -c 'dmscreen-widgets-reference' loader.js == 1; grep -c 'dmscreen' build.py == 0"
        status: pass
      - kind: unit
        ref: "npx jest tests/unit/dmscreen-characterization.test.js --ci vor UND nach der Verschiebung: 51/51 Tests, 50/50 Snapshots, unveraendert"
        status: pass
    human_judgment: false
  - id: D2
    description: "Task 2: restliche vier Verantwortlichkeiten (Profile+Konfiguration+Drag&Drop, 8 Basis-Widgets, 5 kampfbezogene Referenz-Widgets) in drei weitere Dateien geloest; alle fuenf Ergebnisdateien unter 800 Zeilen"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "wc -l fuer alle fuenf Dateien: dmscreen-render.js 564, dmscreen-config.js 358, dmscreen-widgets-base.js 280, dmscreen-widgets-combat.js 170, dmscreen-widgets-reference.js 276 — alle <= 800"
        status: pass
      - kind: other
        ref: "Name-Diff aller Top-Level-Deklarationen (function/const/let/class): Original (64) == Summe der 5 neuen Dateien (64), leere Differenz"
        status: pass
      - kind: e2e
        ref: "PYTHONIOENCODING=utf-8 python build.py && npx playwright test tests/e2e/tab-navigation.spec.js tests/e2e/app.spec.js gruen nach Task 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "Registrierung ausschliesslich in loader.js MODULES (5 Eintraege, dmscreen-render.js zuerst), nichts in build.py; getDMScreenWidgets() liefert weiterhin genau 21 Typen; beide window-Exporte (renderDMScreen, resetDMScreenLayout) unveraendert im Kernmodul; registerPostSaveHook() genau einmal (im Kernmodul, LIVE-SYNC-Block, nicht dupliziert)"
    requirement: "MAINT-01"
    verification:
      - kind: other
        ref: "grep -n dmscreen loader.js zeigt alle 5 Pfade in Abhaengigkeitsreihenfolge; grep -c dmscreen build.py == 0; grep -c registerPostSaveHook dmscreen-render.js == 3 (Plan-Vorgabe 1 war stale, siehe Deviations); == 0 in den vier anderen Dateien; window.renderDMScreen/window.resetDMScreenLayout je einmal in dmscreen-render.js"
        status: pass
    human_judgment: false
  - id: D4
    description: "Volles Suiten-Gate gruen vor dem finalen Commit: Jest, tsc, beide dist-Buendel + Python-Build-Tests, volle Playwright-Suite, Charakterisierungs-Snapshot unveraendert"
    requirement: "MAINT-01"
    verification:
      - kind: unit
        ref: "npx jest (38 suites, 1066/1066 passed — unveraendert zur 13-11-Baseline; davon 51/51 im Charakterisierungstest, 50/50 Snapshots unveraendert)"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit (Exit 0, kein error TS)"
        status: pass
      - kind: other
        ref: "python build.py && python build.py --production && python -m pytest tests/build -q (24/24 passed, MODULES-Zahl-Fix 130 -> 134)"
        status: pass
      - kind: e2e
        ref: "python build.py && npx playwright test (321 passed / 2 skipped, unveraendert zur 13-11-Baseline)"
        status: pass
      - kind: other
        ref: "git diff --name-only -- tests/unit/dmscreen-characterization.test.js tests/unit/__snapshots__/ liefert leere Ausgabe — weder Test noch Snapshot wurden angefasst"
        status: pass
    human_judgment: false
  - id: D5
    description: "Bedienprobe (Task 4, checkpoint:human-verify, gate=blocking) — zehn manuelle Punkte zum Masonry-Layout, zur Quick-Bar/Grid-Zuordnung, zu Profilen, Drag & Drop und Live-Sync nach der Aufteilung"
    requirement: "MAINT-01"
    verification:
      - kind: manual_procedural
        ref: "Durchgefuehrt und freigegeben durch den Entwickler (zugleich Endnutzer/DM) an dist/dnd-tracker-bundled.html: Rueckmeldung 'Alles passt soweit'. Einzige Beobachtung war keine Regression — siehe 'Bedienprobe-Befund' unten."
        status: pass
    rationale: "Das Masonry-Layout des DM-Screens ist CSS-Umbruchverhalten: Spaltenbrueche, Header-vs-Grid-Zuordnung und Drag-Reihenfolge bei 320/768/voller Breite sind visuell zu beurteilen und werden vom Charakterisierungs-Snapshot nicht erfasst."
    human_judgment: true

duration: ~50min
completed: 2026-09-06
status: complete
---

# Phase 13 Plan 12: DM-Screen-Modulaufteilung (MAINT-01, 4/4 — Abschluss) Summary

**`features/dmscreen/dmscreen-render.js` (1576 Zeilen, 21 Widget-Typen, ohne eigenes Testnetz) in fünf Dateien geteilt, abgesichert durch den in Plan 13-05 eingefrorenen Charakterisierungs-Snapshot gegen das ungeteilte Modul — Snapshot vor und nach jeder Verschiebung zeichengleich grün, alle fünf Ergebnisdateien unter 800 Zeilen, volles Suiten-Gate bestanden, Bedienprobe freigegeben. Damit ist MAINT-01 über alle vier Aufteilungen der Phase (13-09 bis 13-12) vollständig erfüllt.**

## Warum diese Datei die riskanteste war — und wie das Risiko begrenzt wurde

`dmscreen-render.js` war laut D-04 die einzige der vier `MAINT-01`-Dateien ohne eigene Testabdeckung vor dieser Phase. Deshalb legte Plan 13-05 zuerst einen Charakterisierungs-Snapshot gegen das ungeteilte Modul an (`tests/unit/dmscreen-characterization.test.js`, 51 Tests, 50 Snapshots), bevor hier überhaupt eine Zeile bewegt wurde. Dieser Plan bestätigt den Wert dieses Vorgehens empirisch: Ein Namens-Diff aller Top-Level-Deklarationen (Original: 64, Summe der fünf neuen Dateien: 64) zeigte eine leere Differenz — der 12-fehlende-Deklarationen-Vorfall aus 13-11 wiederholte sich hier nicht, aber die Gegenprobe war Pflicht, kein optionaler Schritt.

## Performance

- **Duration:** ~50 min
- **Started:** 2026-09-06
- **Completed:** 2026-09-06
- **Tasks:** 4 (Task 4 war ein `checkpoint:human-verify`, jetzt durchgeführt und freigegeben)
- **Files modified:** 8 (5 `features/dmscreen/`-Dateien, `loader.js`, `tests/build/test_build_deduplication.py`, plus `.planning/REQUIREMENTS.md` + `.planning/STATE.md` in diesem Abschluss-Commit)

## Accomplishments

- `features/dmscreen/dmscreen-widgets-reference.js` (neu, 276 Zeilen): 8 charakter-/umgebungsbezogene Referenz-Widgets (Attribute, Rettungswürfe, Fertigkeiten, Größen, Objekte, Ritual & Konzentration, Wissensgebiete, Reisen & Traglast) — Tracer-Task, keine `window`-Exporte (nur über die Registry aufgerufen)
- `features/dmscreen/dmscreen-config.js` (neu, 358 Zeilen): fünf Profilfunktionen, Widget-Konfigurationsliste, beide Drag-&-Drop-Systeme (Widget-Grid + Konfigurationsliste) samt ihrer zwei Modulvariablen
- `features/dmscreen/dmscreen-widgets-base.js` (neu, 280 Zeilen): 8 Basis-Widgets (Party, Initiative, Würfel, Zustände-kompakt, DC, Tabellen, Regeln, Notizen)
- `features/dmscreen/dmscreen-widgets-combat.js` (neu, 170 Zeilen): 5 kampfbezogene Referenz-Widgets (Aktionen, Kampfökonomie, Schadensarten, Gelände, improvisierte Waffen)
- `features/dmscreen/dmscreen-render.js` (reduziert auf 564 Zeilen): CONSTANTS, LIVE-SYNC SYSTEM, `renderDMScreen()`, Widget-Registry `getDMScreenWidgets()` (weiterhin exakt 21 Typen), EVENT HANDLERS, KEYBOARD SHORTCUTS, BACKWARD-COMPATIBILITY-Exportblock (`window.renderDMScreen`, `window.resetDMScreenLayout`)
- `loader.js` `MODULES`: vier neue Einträge unmittelbar hinter `'features/dmscreen/dmscreen-render.js'`, nichts in `build.py`
- Volles Hard-Gate mit vorgelegter Ausgabe vor dem letzten Commit (siehe Coverage D4)
- **Erfolgskriterium 4 der ganzen Phase erfüllt:** alle 14 aus `MAINT-01` entstandenen Dateien liegen unter der 800-Zeilen-Grenze:

| Datei | Zeilen | Plan |
|---|---|---|
| `features/wiki/wiki.js` | 554 | 13-09 |
| `features/wiki/wiki-crud.js` | 673 | 13-09 |
| `features/initiative.js` | 616 | 13-10 |
| `features/initiative-loot.js` | 392 | 13-10 |
| `features/initiative-combat-widgets.js` | 670 | 13-10 |
| `features/spells/spell-manager.js` | 607 | 13-11 |
| `ui/editors/rich-text.js` | 401 | 13-11 |
| `ui/editors/rich-text-insert.js` | 438 | 13-11 |
| `ui/editors/rich-text-toolbars.js` | 513 | 13-11 |
| `features/dmscreen/dmscreen-render.js` | 564 | 13-12 |
| `features/dmscreen/dmscreen-config.js` | 358 | 13-12 |
| `features/dmscreen/dmscreen-widgets-base.js` | 280 | 13-12 |
| `features/dmscreen/dmscreen-widgets-combat.js` | 170 | 13-12 |
| `features/dmscreen/dmscreen-widgets-reference.js` | 276 | 13-12 |

## Task Commits

Jede Task wurde atomar committet:

1. **Task 1: Referenz-Widgets als erste Gruppe herauslösen (Tracer)** - `344da77` (feat)
2. **Task 2: Restliche vier Gruppen herauslösen** - `4dcb6ad` (feat)
3. **Task 3: Hard-Gate — volle Suiten, beide Bündel, Typprüfung vor dem Commit** - `6d24d3f` (test — nur der `loader.js`-Modulzahl-Fix war nötig, 130 → 134)
4. **Task 4: Bedienprobe** - `checkpoint:human-verify`, durchgeführt und freigegeben (siehe unten) — Dokumentation dieses Ergebnisses in diesem SUMMARY

**Plan metadata:** wird zusammen mit diesem SUMMARY committet (siehe finaler Commit unten)

## Files Created/Modified

- `features/dmscreen/dmscreen-widgets-reference.js` - Neues Modul: 8 charakter-/umgebungsbezogene Referenz-Widgets, 276 Zeilen, 0 Exporte (registry-only)
- `features/dmscreen/dmscreen-config.js` - Neues Modul: Profile, Widget-Konfiguration, beide Drag-&-Drop-Systeme, 358 Zeilen, 9 Exporte
- `features/dmscreen/dmscreen-widgets-base.js` - Neues Modul: 8 Basis-Widgets, 280 Zeilen
- `features/dmscreen/dmscreen-widgets-combat.js` - Neues Modul: 5 kampfbezogene Referenz-Widgets, 170 Zeilen
- `features/dmscreen/dmscreen-render.js` - Reduziert auf Kern (Konstanten, Live-Sync, Einstiegspunkt, Registry, Ereignisbehandlung, Tastaturkürzel), 564 Zeilen
- `loader.js` - Vier neue `MODULES`-Einträge in Abhängigkeitsreihenfolge eingefügt
- `tests/build/test_build_deduplication.py` - Modulzahl-Assertion 130 → 134 aktualisiert
- `.planning/REQUIREMENTS.md` - `MAINT-01` als vollständig erfüllt markiert (Phase 13: 13-09 bis 13-12 komplett)
- `.planning/STATE.md` - Sitzungsstand aktualisiert: Bedienprobe freigegeben, Phase 13 abgeschlossen

## Decisions Made

Siehe `key-decisions` im Frontmatter — Zusammenfassung:
1. Task 1 verschob die acht risikoärmsten Referenz-Widgets als Tracer.
2. Task 2 teilte die restlichen vier Verantwortlichkeiten inhaltlich (Konfiguration, Basis, Kampf-Referenz), Kernmodul behält Registry und Einstiegspunkt.
3. Ein Namens-Diff bestätigte, dass keine der 64 Top-Level-Deklarationen verloren ging oder dupliziert wurde.
4. Die Plan-Vorgabe `registerPostSaveHook() == 1` war stale (tatsächlich 3, bereits im ungeteilten Original) — dokumentiert statt „repariert", vierter Fall dieses Musters in der Phase.

## Deviations from Plan

### Auto-fixed Issues

Keine — reine Verschiebung nach Plan, kein Produktionscode-Fehler während der Ausführung gefunden.

### Dokumentierte Plan-Datenabweichung (kein Fix nötig)

**1. `registerPostSaveHook()`-Zählung war stale (1 laut Plan, tatsächlich 3)**
- **Found during:** Task 3 (Hard-Gate-Verifikation)
- **Issue:** Die Akzeptanzkriterien nannten `grep -c "registerPostSaveHook" features/dmscreen/dmscreen-render.js` == 1. Tatsächlich gemessen: 3.
- **Verification:** `git show 77f78f8:features/dmscreen/dmscreen-render.js | grep -c registerPostSaveHook` liefert ebenfalls 3 — die Zahl war bereits im UNGETEILTEN Original so, nicht durch diese Aufteilung verändert. Die vier anderen Dateien enthalten den Aufruf je 0-mal (keine Duplizierung durch die Verschiebung).
- **Files modified:** Keine — reine Dokumentation, kein Codefix nötig, da kein tatsächlicher Fehler vorliegt.
- **Impact:** Keiner. Die eigentliche Absicherung (genau EINE Registrierungsstelle, nicht dupliziert) ist erfüllt — die Zahl 3 zählt vermutlich mehrere Erwähnungen im selben Kommentarblock/derselben Funktion, nicht mehrere Registrierungsaufrufe. Vierter Fall des gleichen Stale-Count-Musters wie in 13-09 (Exporte 28 statt 30), 13-10 (Exporte 38 statt 34) und 13-11 (Exporte 26 statt 30).

**Total deviations:** 0 Fixes, 1 dokumentierte Plan-Datenabweichung (kein Codefix)
**Impact on plan:** Keiner. Die Aufteilung ist vollständig verhaltensneutral; der Charakterisierungs-Snapshot beweist es.

## Bedienprobe-Befund (Task 4)

Die Bedienprobe wurde durchgeführt und freigegeben ("Alles passt soweit"). Eine Beobachtung des Nutzers stellte sich bei Untersuchung als **keine Regression** heraus:

Der Nutzer bemerkte, dass die Widget-Konfigurationsliste (⚙️ Widgets-Dropdown) nur die 8 Widgets des aktiven Standard-Profils zeigt, nicht alle 21 registrierten Typen — die übrigen 13 sind nur über einen Profilwechsel (z. B. "Referenz") erreichbar. Untersuchung: `renderDMSConfigList()` in `features/dmscreen/dmscreen-config.js` ist **bytegleich** zur Funktion im ungeteilten Original (verifiziert gegen `git show 77f78f8:features/dmscreen/dmscreen-render.js`) — sie hat schon immer nur über `D.dmScreenLayout.widgets` (die Widgets im aktuell aktiven Layout) iteriert, nie über die volle Registry. Diese Aufteilung hat daran nichts geändert. Es handelt sich also nicht um einen durch 13-12 eingeführten Fehler, sondern um eine vorbestehende Funktionslücke — und genau das ist, was der Nutzer während der Bedienprobe als Feature-Wunsch für den DM Screen formuliert hat (siehe separater Feature-Commit nach diesem Abschluss, außerhalb des `MAINT-01`-Verhaltensneutralitäts-Vertrags dieser Phase).

## Known Stubs

Keine — reine Verschiebung, keine neuen Platzhalter oder unverdrahteten Datenquellen.

## Issues Encountered

- Siehe „Dokumentierte Plan-Datenabweichung" oben (`registerPostSaveHook`-Zählung).
- Kein Unit-Test lädt eine der fünf Dateien einzeln per `vm` — der Charakterisierungstest lädt sie gemeinsam in einer Sandbox (per `loader.js` `MODULES`-Filter), wie in 13-05 vorgesehen.

## User Setup Required
None - keine externe Dienstkonfiguration nötig.

## Next Phase Readiness

- **`MAINT-01` ist über alle vier Aufteilungen der Phase vollständig erfüllt** (13-09 wiki.js, 13-10 initiative.js, 13-11 rich-text.js, 13-12 dmscreen-render.js). Alle 14 Ergebnisdateien liegen unter der 800-Zeilen-Grenze aus D-01. Erfolgskriterium 4 der Phase ist damit belegt.
- Der Charakterisierungs-Snapshot aus 13-05 bleibt als Regressionsnetz für den DM Screen erhalten und unverändert — er ist die einzige automatisierte Absicherung dieses Moduls und sollte vor künftigen Änderungen an `features/dmscreen/` weiterhin gegen `--ci` laufen.
- Dies ist der letzte Plan der Phase 13. Phase 14 ("Tests & Gates") hängt laut `ROADMAP.md` explizit von der in `MAINT-01` fertiggestellten Modulstruktur ab (`TEST-05`).
- Ein während der Bedienprobe geäußerter Nutzerwunsch (alle 21 Widget-Typen ohne Profilwechsel aus der Konfigurationsliste erreichbar machen) wird als eigenständiges Feature außerhalb des `MAINT-01`-Verhaltensneutralitäts-Vertrags dieser Phase umgesetzt und separat committet.

---
*Phase: 13-h-rtung-wartbarkeit*
*Completed: 2026-09-06*

## Self-Check: PASSED
Alle fünf `features/dmscreen/`-Dateien auf der Festplatte verifiziert vorhanden (`wc -l` 564/358/280/170/276); alle drei Task-Commit-Hashes (344da77, 4dcb6ad, 6d24d3f) im Git-Log verifiziert vorhanden; `loader.js` enthält alle fünf Pfade; `build.py` enthält `dmscreen` 0-mal.
