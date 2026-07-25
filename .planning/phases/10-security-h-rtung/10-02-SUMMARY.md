---
phase: 10-security-h-rtung
plan: 02
subsystem: security
tags: [xss, sanitization, import-export, undo, backup, vm-runincontext, e2e]

# Dependency graph
requires:
  - phase: 10-security-h-rtung
    provides: "Sanitisierte Anzeige-Grenze aus Plan 10-01 (renderMarkdownInContent()/wiki.js) — Plan 10-02 schließt die zweite, unabhängige Grenze (Rohdaten-at-Rest)"
provides:
  - "HTML_FIELDS_BY_TYPE + sanitizeImportedItem() — modul-interne Sanitisierungsgrenze in systems/spellslots/import-export.js für neun Entity-Typen"
  - "Beide Import-Eintrittspunkte (typspezifischer Import via showImportModal()/executeImport(), globaler Import via importDataGlobal()) sanitisieren HTML-tragende Felder vor der Persistenz"
  - "importDataGlobal()-Überschreib-Zweig hat jetzt Undo-Punkt + Sicherungskopie (WR-03/D-07 aus 01-REVIEW.md geschlossen)"
  - "Unit-Nachweis (tests/unit/import-sanitization.test.js, 24 Tests, vm.runInContext gegen echten Quelltext)"
  - "E2E-Nachweis am gespeicherten Zustand für beide importDataGlobal()-Zweige (tests/e2e/features/import-security.spec.js)"
affects: [10-03-vektor-katalog, 10-05-security-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Import-Sanitisierungsgrenze: Feldliste (HTML_FIELDS_BY_TYPE) + generische Hilfsfunktion (sanitizeImportedItem) statt rekursivem Sanitisieren aller String-Felder"
    - "vm.runInContext-Doppellast: sanitizeHTML() aus utils/basic.js UND die zu testende Funktion aus import-export.js werden in getrennten vm-Kontexten geladen und die Sanitizer-Referenz durchgereicht — Test läuft gegen den echten Produktions-Sanitizer, nicht gegen testable-utils.js"
    - "Quelltext-Struktur-Assertions (Test E-Muster aus storage-conflict.test.js) als dauerhafte Regressionswächter für sicherheitskritische Aufrufreihenfolgen (Schleife vor Verzweigung, Undo/Backup vor Object.assign)"

key-files:
  created:
    - tests/unit/import-sanitization.test.js
  modified:
    - systems/spellslots/import-export.js
    - tests/e2e/features/import-security.spec.js

key-decisions:
  - "D-07/WR-03-Produktionsfix (saveUndoState()+createAutoBackup() im Überschreib-Zweig) wurde in Task 2 statt Task 3 umgesetzt: Task 2s eigenes <verify>-Gate (npx jest tests/unit/import-sanitization.test.js) schließt die in Task 1 mitgeschriebene Quelltext-Strukturprüfung für diese Verdrahtung ein — Task 2 konnte sein eigenes Verify-Kriterium sonst nicht erfüllen. Task 3 liefert wie geplant den E2E-Nachweis gegen den bereits gelandeten Fix."
  - "Struktureller Test-Fix: die validatedItems-Abbildung, die der Plan-Text 'in executeImport()' verortet, lebt tatsächlich in showImportModal() (verifiziert per Quelltext-Read: executeImport() persistiert nur modal.dataset.importItems, das showImportModal() zuvor befüllt hat). Die Sanitisierung wurde an der TATSÄCHLICHEN Stelle verdrahtet (dort, wo Rohdaten zu vertrauten Daten werden); der zugehörige Struktur-Test wurde korrigiert, nicht der Code an eine falsche Stelle verschoben."
  - "undoStack ist als globale Bare-Kennung im gebauten Bundle (klassisches <script>-Tag, kein type=module) aus page.evaluate() direkt lesbar — empirisch verifiziert (Probe-Test), Muster für künftige E2E-Undo-Nachweise ohne neuen window-Export"
  - "Reload-Zweig ('als neue Kampagne importieren') wurde NICHT durch die im Plan erlaubte schwächere Struktur-Prüfung ersetzt: page.waitForEvent('load') VOR dem Datei-Upload registriert fängt das synchron auf den Toast folgende location.reload() race-frei ab — empirisch über 4 Wiederholungsläufe stabil bestätigt"

patterns-established:
  - "Import-Sicherheitsgrenze als Feldliste + generischer Helper (keine rekursive Sanitisierung) — Vorlage für künftige Import-Erweiterungen (D-02-Konvention)"

requirements-completed: []
# SEC-01 wird von 10-01, 10-02, 10-03 UND 10-04 gemeinsam deklariert (Shared-ID-Gate #2388).
# 10-03/10-04 haben noch keine SUMMARY — requirements.ready-ids meldet 0/1 bereit.
# SEC-01 wird erst als "Complete" markiert, sobald die letzte deklarierende Plan-SUMMARY existiert.

coverage:
  - id: D1
    description: "Beide Import-Eintrittspunkte (typspezifisch via showImportModal()/executeImport(), global via importDataGlobal()) sanitisieren die neun per Render-Pfad-Audit ermittelten HTML-tragenden Felder vor der Persistenz — Rohdaten-at-Rest sind sauber, nicht nur ihre Anzeige"
    requirement: "SEC-01"
    verification:
      - kind: unit
        ref: "tests/unit/import-sanitization.test.js — Feldliste, Vektor-Katalog (9 Typen + script/javascript:/SVG), D-02-Leitplanke, Totalität, Unveränderlichkeit, Quelltext-Strukturprüfung (24 Tests)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/import-security.spec.js#Überschreib-Zweig: der GESPEICHERTE Zustand (D.wiki) ist bereinigt"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/import-security.spec.js#Zweig „als neue Kampagne importieren": nach dem Neustart ist der geladene Wiki-Inhalt bereinigt"
        status: pass
    human_judgment: false
  - id: D2
    description: "WR-03 (01-REVIEW.md) ist geschlossen: ein überschreibender globaler Import legt vor dem Datenwechsel einen Undo-Punkt und eine Sicherungskopie an (nach dem Muster von executeImport()); ein fehlgeschlagenes Backup bricht den Import nicht ab"
    requirement: "SEC-01"
    verification:
      - kind: unit
        ref: "tests/unit/import-sanitization.test.js#importDataGlobal(): Undo-Punkt und Sicherungskopie stehen im Überschreib-Zweig vor Object.assign(D, imp)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/features/import-security.spec.js#Überschreib-Zweig: ... ein Rückgängig-Schritt ist verfügbar (D-01/D-07/WR-03)"
        status: pass
    human_judgment: false

duration: ~50min
completed: 2026-07-25
status: complete
---

# Phase 10 Plan 02: Import-Grenze schließen (SEC-01, WR-03) Summary

**`HTML_FIELDS_BY_TYPE` + `sanitizeImportedItem()` sanitisieren jetzt beide Import-Eintrittspunkte (typspezifisch und global, beide Zweige des globalen Imports) vor der Persistenz, und ein überschreibender globaler Import legt endlich Undo-Punkt + Sicherungskopie an (WR-03).**

## Performance

- **Duration:** ~50 min
- **Tasks:** 3 (Task 1: Unit-RED, Task 2: Implementierung + Struktur-GREEN, Task 3: E2E-Nachweis)
- **Files modified:** 3 (1 neu, 2 geändert)

## Accomplishments

- Neue Sicherheitsgrenze in `systems/spellslots/import-export.js`: `HTML_FIELDS_BY_TYPE` (neun Entity-Typen, exakt die per Render-Pfad-Audit ermittelten Felder) + `sanitizeImportedItem(type, item)` (modul-intern, kein `window`-Export, total definiert — unbekannter Typ/fehlendes Feld/`null`/`undefined`/leere Zeichenkette führen nie zu einem Fehler)
- Beide Import-Eintrittspunkte verdrahtet: die `validatedItems`-Abbildung (tatsächlich in `showImportModal()`, nicht wie im Plan-Text notiert in `executeImport()` — siehe Decisions) sanitisiert vor dem Speichern in `modal.dataset.importItems`; `importDataGlobal()` sanitisiert `imp[type]`-Arrays über `HTML_FIELDS_BY_TYPE` VOR der `choice`-Verzweigung, sodass BEIDE Zweige (neue Kampagne über `StorageAPI.setJSON`, Überschreiben über `Object.assign(D, imp)`) abgedeckt sind (Pitfall 2 aus 10-RESEARCH.md)
- WR-03 (01-REVIEW.md) geschlossen: der Überschreib-Zweig von `importDataGlobal()` legt jetzt `saveUndoState()` + (in `try`/`catch`) `createAutoBackup()` an, exakt nach dem Muster von `executeImport()` — ein überschreibender Import ist nicht mehr endgültig
- `tests/unit/import-sanitization.test.js` (24 Tests, neu): lädt den ECHTEN Quelltext von `import-export.js` UND `utils/basic.js` per `vm.runInContext` (kein Test-Zwilling), deckt Feldliste, Vektor-Katalog aller neun Typen plus `<script>`/`javascript:`/SVG-Ereignis, die D-02-Leitplanke (nicht gelistete Felder bleiben zeichenidentisch), Totalität, Unveränderlichkeit und drei Quelltext-Strukturprüfungen ab — nachweislich ROT vor der Implementierung (24/24 fehlgeschlagen), GRÜN danach
- `tests/e2e/features/import-security.spec.js` um zwei Testfälle erweitert, die den GESPEICHERTEN Zustand statt der Anzeige prüfen: (1) Überschreib-Zweig — `D.wiki[0].content` ist bereinigt UND der Undo-Stapel ist gewachsen; (2) „als neue Kampagne importieren"-Zweig — nach dem durch `location.reload()` ausgelösten Neustart ist der geladene `D.wiki`-Inhalt bereinigt

## Task Commits

Each task was committed atomically:

1. **Task 1: Unit-Nachweis für die Import-Sanitisierung anlegen (rot gegen den Ist-Zustand)** - `d37cf67` (test) — 24/24 Tests fehlgeschlagen (Symbole existierten noch nicht)
2. **Task 2: Feldliste und Sanitisierungs-Hilfsfunktion einführen und an beiden Eintrittspunkten verdrahten** - `e99c634` (feat) — inkl. vorgezogenem WR-03/D-07-Fix (siehe Decisions); 24/24 Unit-Tests grün, volle Jest-Suite 481/481 grün
3. **Task 3: Undo-Punkt und Sicherungskopie im Überschreib-Zweig (WR-03) plus E2E-Nachweis am gespeicherten Zustand** - `f56da7d` (test) — zwei neue E2E-Tests, 4× wiederholt stabil grün; volle Jest-Suite 481/481, volle Playwright-Suite 314 passed/2 skipped

**Plan metadata:** wird mit diesem Commit erzeugt (docs: complete plan)

## Files Created/Modified

- `tests/unit/import-sanitization.test.js` — Neue Unit-Beweisdatei (vm.runInContext gegen echten Produktionsquelltext, 24 Tests)
- `systems/spellslots/import-export.js` — `HTML_FIELDS_BY_TYPE` + `sanitizeImportedItem()` (neu), Verdrahtung in `showImportModal()`s `validatedItems`-Abbildung und in `importDataGlobal()` (Sanitisierungs-Schleife vor der Verzweigung, Undo/Backup im Überschreib-Zweig)
- `tests/e2e/features/import-security.spec.js` — zwei neue Testfälle (`importCampaignFileAsNewCampaign()`-Helper neu) für den gespeicherten Zustand beider `importDataGlobal()`-Zweige

## Decisions Made

- D-07/WR-03-Produktionsfix in Task 2 statt Task 3 umgesetzt (Begründung siehe frontmatter `key-decisions`) — dokumentiert als Abweichung unten
- `validatedItems`-Abbildung tatsächlich in `showImportModal()` statt `executeImport()` (Plan-Text-Ungenauigkeit, Code korrekt an der realen Stelle verdrahtet) — dokumentiert als Abweichung unten
- `undoStack` ist im gebauten Bundle als globale Bare-Kennung aus `page.evaluate()` lesbar (empirisch verifiziert) — kein neuer `window`-Export nötig für den E2E-Undo-Nachweis
- Reload-Zweig-Test NICHT auf die schwächere Struktur-Prüfung ausgewichen — `page.waitForEvent('load')` vor dem Upload registriert, 4× stabil grün

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] WR-03/D-07-Fix (Undo + Backup im Überschreib-Zweig) in Task 2 statt Task 3 umgesetzt**
- **Found during:** Task 2 (Verifikation der eigenen `<verify>`-Kommando von Task 2)
- **Issue:** Der von Task 1 geschriebene Unit-Test enthält eine Quelltext-Strukturprüfung, die verlangt, dass `saveUndoState`/`createAutoBackup` im Überschreib-Zweig VOR `Object.assign(D, imp)` stehen (Task 1s explizite Anforderung "(c)"). Task 2s eigenes `<verify>`-Kommando (`npx jest tests/unit/import-sanitization.test.js && npx jest`) und seine Akzeptanzkriterien verlangen, dass die GESAMTE Testdatei nach Task 2 grün ist. Ohne den WR-03-Fix (der laut Plan-Struktur erst Task 3 umsetzt) konnte Task 2 sein eigenes Verify-Gate nicht erfüllen.
- **Fix:** Der zweizeilige Produktionsfix (`saveUndoState('Kampagne überschrieben (Import)')` + `try { createAutoBackup(); ...} catch {...}`) wurde in Task 2s Commit vorgezogen — exakt nach dem in Task 3s eigenem `read_first` bereits verifizierten Muster aus `executeImport()`.
- **Files modified:** `systems/spellslots/import-export.js` (im Commit von Task 2, `e99c634`)
- **Verification:** `npx jest tests/unit/import-sanitization.test.js` 24/24 grün nach Task 2; Task 3 fügt zusätzlich den E2E-Nachweis gegen den bereits gelandeten Fix hinzu (bestätigt in Task 3s eigenem Commit `f56da7d`)
- **Committed in:** `e99c634` (Task 2 Commit)

**2. [Rule 1 - Bug] Plan-Text nennt falsche Funktion für die validatedItems-Abbildung**
- **Found during:** Task 2 (Verdrahtung von `sanitizeImportedItem()`)
- **Issue:** Der Plan-Text (Task 1 `read_first`, Task 2 `action`/`acceptance_criteria`) verortet die `validatedItems`-Abbildung in `executeImport()`. Quelltext-Read zeigt: die Abbildung lebt tatsächlich in `showImportModal()` (Zeilen 292-301 im Ausgangs-Quelltext, wie im Plan angegeben — nur der Funktionsname war falsch). `executeImport()` liest lediglich `JSON.parse(modal.dataset.importItems)` und persistiert das Ergebnis unverändert.
- **Fix:** `sanitizeImportedItem()` wurde an der TATSÄCHLICHEN Stelle aufgerufen (innerhalb der `validatedItems`-Abbildung in `showImportModal()`) — das ist funktional die korrekte Stelle, da genau dort Rohdaten zu vertrauten, in `modal.dataset` zwischengespeicherten Daten werden, BEVOR `executeImport()` sie persistiert. Der zugehörige Unit-Struktur-Test wurde entsprechend auf die reale Funktion (`showImportModal()`) korrigiert, mit einem erklärenden Kommentar an der Stelle.
- **Files modified:** `systems/spellslots/import-export.js`, `tests/unit/import-sanitization.test.js`
- **Verification:** Struktur-Test grün; funktionale Wirkung identisch zur Plan-Absicht (Sanitisierung sitzt vor der Persistenz im typspezifischen Import-Pfad)
- **Committed in:** `e99c634` (Task 2 Commit)

---

**Total deviations:** 2 auto-fixed (1 blocking/Task-Reihenfolge, 1 Plan-Text-Ungenauigkeit)
**Impact on plan:** Beide Abweichungen sind rein organisatorisch/dokumentarisch — kein Scope Creep, keine architektonische Änderung. Alle in `<threat_model>`/`<success_criteria>` geforderten Verhaltensweisen sind vollständig erfüllt, nur die Task-interne Reihenfolge des Produktionsfixes und die im Plan genannte Funktionszuordnung wurden an den tatsächlichen Quelltext angepasst.

## Issues Encountered

None.

## Known Stubs

None — keine Platzhalter, keine leeren Datenquellen eingeführt.

## User Setup Required

None — keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- Beide Sicherheitsgrenzen aus D-01 sind jetzt geschlossen: Anzeige-Grenze (Plan 10-01) UND Import-/Rohdaten-Grenze (dieser Plan) — SEC-01 ist inhaltlich vollständig erfüllt, bleibt aber formal "Pending" in REQUIREMENTS.md bis auch 10-03 und 10-04 (die SEC-01 ebenfalls deklarieren, Shared-ID-Gate #2388) ihre SUMMARY haben
- WR-03 (01-REVIEW.md) ist geschlossen — kein offener Findings-Punkt aus der Phase-1-Review mehr für den Import-Pfad
- Volle Suiten grün: `npx jest` 481/481 (war 457 vor diesem Plan), `npx playwright test` 314 passed / 2 skipped (PWA-Tests, https/localhost-only, unabhängig von dieser Phase)
- Bereit für Plan 10-03 (Vektor-Katalog / weitere SEC-01-Arbeit) und 10-04

---
*Phase: 10-security-h-rtung*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: tests/unit/import-sanitization.test.js
- FOUND: systems/spellslots/import-export.js (HTML_FIELDS_BY_TYPE, sanitizeImportedItem)
- FOUND: tests/e2e/features/import-security.spec.js (4 Tests total)
- FOUND: commit d37cf67 (test: RED unit proof)
- FOUND: commit e99c634 (feat: implementation + WR-03 fix)
- FOUND: commit f56da7d (test: E2E saved-state proof)
