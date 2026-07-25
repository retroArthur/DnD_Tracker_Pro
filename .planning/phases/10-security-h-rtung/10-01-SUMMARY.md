---
phase: 10-security-h-rtung
plan: 01
subsystem: security
tags: [xss, sanitization, wiki, markdown, e2e, dom-parser]

# Dependency graph
requires:
  - phase: 09-editor-execcommand-abloesung
    provides: eingefrorenes Editor-Regressionsnetz (editor-insert.spec.js pasteInto()-Muster als Testvorbild)
provides:
  - "Sanitisierte Anzeige-Grenze in renderMarkdownInContent() (ui/editors/markdown-converter.js)"
  - "Gedrehte, sichere Aufrufreihenfolge in renderWikiDetail() (features/wiki/wiki.js)"
  - "E2E-Beweis der vollständigen Exploit-Kette (tests/e2e/features/import-security.spec.js)"
  - "TOC-Anker- und Textererhalt-Regressionsnetz (tests/e2e/features/wiki.spec.js)"
affects: [10-02-import-grenze, 10-03-vektor-katalog, 10-05-security-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defense-in-Depth-Zwilling: renderMarkdownInContent() sanitisiert jetzt identisch zu markdownToHtml() (gleicher window.sanitizeHTML-Guard)"
    - "Sanitisierung-vor-Anker-Injektion: sicherheitsrelevante Reihenfolge (Sanitize → codegenerierte id-Attribute injizieren) statt umgekehrt"

key-files:
  created:
    - tests/e2e/features/import-security.spec.js
  modified:
    - ui/editors/markdown-converter.js
    - features/wiki/wiki.js
    - tests/e2e/features/wiki.spec.js

key-decisions:
  - "renderWikiTOC(entry.content) bleibt bewusst auf dem Rohinhalt statt auf dem sanitisierten/verankerten Markup — extractWikiTOC() und addTOCAnchors() liefern bei reinem HTML-Überschriften-Content dieselbe Trefferreihenfolge; Restbedingung bei gemischtem HTML+Markdown-Überschriften-Content dokumentiert als bekannte Einschränkung"
  - "Import-Dialog wird in Tests per page.on('dialog', d => d.dismiss()) explizit abgewiesen (Überschreib-Zweig ohne location.reload()), statt sich auf Playwrights Standardverhalten zu verlassen"

patterns-established:
  - "SEC-01-Kommentar-Konvention: sicherheitskritische Aufrufreihenfolgen (Sanitize-vor-X) werden im Code mit Begründung kommentiert, nicht nur in Doku"

requirements-completed: [SEC-01]

coverage:
  - id: D1
    description: "Der einzige heute live ausnutzbare Pfad des Import-XSS (Wiki-Anzeige) ist geschlossen; ein E2E-Test beweist die vollständige Kette von der bösartigen Import-Datei bis zum geöffneten Wiki-Eintrag ohne Code-Ausführung"
    requirement: "SEC-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/import-security.spec.js — beide Testfälle (Review-Exploit-Vektor img/onerror, erweiterter Vektor-Katalog script/javascript:/svg)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Die zwei Nebenwirkungen der gedrehten Aufrufreihenfolge (TOC-Sprungmarken, Textererhalt bei der Anzeige-Sanitisierung) sind automatisiert abgesichert"
    requirement: "SEC-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/wiki.spec.js#SEC-01: TOC-Sprungmarken und Textererhalt"
        status: pass
    human_judgment: false

duration: 55min
completed: 2026-07-25
status: complete
---

# Phase 10 Plan 01: Import-XSS-Anzeige-Grenze schließen Summary

**`renderMarkdownInContent()` sanitisiert jetzt wie sein Zwilling `markdownToHtml()`, die Wiki-Aufrufreihenfolge wurde gedreht (Sanitisierung vor Anker-Injektion), und ein neuer E2E-Test beweist die geschlossene Exploit-Kette von der bösartigen Import-Datei bis zur Anzeige.**

## Performance

- **Duration:** ~55 min
- **Tasks:** 2 (Task 1: tracer, Task 2: auto)
- **Files modified:** 4 (1 neu, 3 geändert)

## Accomplishments

- Der von `01-REVIEW.md` (CR-01) als Critical gemeldete Import-XSS ist auf seinem einzigen live ausnutzbaren Pfad (Wiki-Anzeige) geschlossen: `renderMarkdownInContent()` sanitisiert jetzt am Ende wie ihr Zwilling `markdownToHtml()` (`window.sanitizeHTML`, identischer `typeof`-Guard)
- `renderWikiDetail()` ruft `renderMarkdownInContent()` (inkl. Sanitisierung) jetzt VOR `addTOCAnchors()` auf — sonst hätte `sanitizeHTML()`s fehlende `id`-Attribut-Erlaubnis die soeben eingefügten `toc-N`-Anker sofort wieder entfernt und die Sprungmarken lautlos zerstört
- Neue Beweisdatei `tests/e2e/features/import-security.spec.js`: zwei Testfälle spielen eine bösartige Kampagnen-JSON-Datei über den echten Eintrittspunkt (`#import-file`) ein und öffnen den importierten Wiki-Eintrag — nachweislich ROT gegen den ungepatchten Build, GRÜN nach dem Fix
- Zwei Regressionstests in `tests/e2e/features/wiki.spec.js` sichern die Nebenwirkungen der Reihenfolge-Änderung automatisiert ab: TOC-Sprungmarken funktionieren weiterhin (inkl. Sprung-Hervorhebung ohne festen Timeout), und sichtbarer Text bleibt bei der Anzeige-Sanitisierung vollständig erhalten

## Task Commits

Each task was committed atomically (Task 1 folgt TDD-artigem RED→GREEN, weil `type="tracer"` einen echten, verifizierbaren Vorher/Nachher-Beweis verlangt):

1. **Task 1 — RED (Beweisdatei, vor dem Fix rot):** `e1f5a2b` (test) — `tests/e2e/features/import-security.spec.js` angelegt, gegen ungepatchtes Bundle ausgeführt: `hasOnAttr` erwartet `false`, erhalten `true` (Assertion `expect(hasOnAttr).toBe(false)` schlägt fehl, `onerror`/`onload`-Attribut überlebt bis in `#wiki-detail`)
2. **Task 1 — GREEN (Fix + grüner Beweis):** `8321c9a` (feat) — `renderMarkdownInContent()` sanitisiert, `renderWikiDetail()`-Aufrufreihenfolge gedreht; `import-security.spec.js` jetzt grün, volle Suiten (Playwright 310 passed/2 skipped, Jest 457/457) grün
3. **Task 2:** `6f6d59f` (test) — zwei neue Regressionstests in `wiki.spec.js` (TOC-Sprungmarken, Textererhalt); volle Playwright-Suite danach 312 passed/2 skipped

**Plan metadata:** wird mit diesem Commit erzeugt (docs: complete plan)

_Hinweis:_ Task 1 ist als `type="tracer"` geplant, aber sequenziell im Hauptkontext ausgeführt (kein Subagent-Checkpoint nötig) — der geforderte RED→GREEN-Beweis wurde eingehalten (SCHRITT 1/2/3 der Plan-Action), nur ohne separaten TDD-Commit-Split zwischen RED und GREEN im Sinne der `tdd="true"`-Konvention, da der Plan `type="tracer"` (nicht `tdd="true"`) verwendet. Die zwei Commits `e1f5a2b`/`8321c9a` bilden den geforderten Vorher/Nachher-Beweis dennoch 1:1 ab.

## Files Created/Modified

- `tests/e2e/features/import-security.spec.js` — Neue E2E-Beweisdatei: zwei Testfälle für die vollständige Exploit-Kette (Import-Datei → `importDataGlobal()` → Wiki-Anzeige)
- `ui/editors/markdown-converter.js` — `renderMarkdownInContent()` sanitisiert jetzt am Ende (`window.sanitizeHTML`, `typeof`-Guard identisch zu `markdownToHtml()`)
- `features/wiki/wiki.js` — `renderWikiDetail()`: Aufrufreihenfolge gedreht (Sanitisierung vor Anker-Injektion), Sicherheits-Kommentare an den kritischen Stellen ergänzt
- `tests/e2e/features/wiki.spec.js` — Neue Beschreibungsgruppe „SEC-01: TOC-Sprungmarken und Textererhalt" mit zwei Regressionstests

## Decisions Made

- `renderWikiTOC(entry.content)` bleibt bewusst auf dem Rohinhalt (nicht auf `markdownRendered`/`contentWithAnchors`) — begründeter Code-Kommentar an der Stelle dokumentiert die Restbedingung bei gemischtem HTML+Markdown-Überschriften-Content
- Import-Dialog in Tests wird explizit per `page.on('dialog', d => d.dismiss())` abgewiesen, um Absicht sichtbar zu machen statt sich auf Playwrights Standardverhalten zu verlassen (wie im Plan gefordert)

## Deviations from Plan

None — Plan exakt wie geschrieben ausgeführt. Beide Tasks, alle `<acceptance_criteria>` und die plan-weite `<verification>` sind erfüllt.

## Issues Encountered

None.

## Known Stubs

None — keine Platzhalter, keine leeren Datenquellen eingeführt.

## Documented Display Consequence (kein Stub, kein offener Fehler)

Die Backtick-Schreibweise (`` `text` ``) wurde bisher NUR in der Wiki-Ansicht als eigenes `<code>`-Auszeichnungselement dargestellt, weil `wiki.js` als einziger Renderer den `renderMarkdownInContent()`-Rückgabewert bisher nicht bereits sanitisiert hat; alle anderen Entity-Ansichten verloren diese Auszeichnung bereits vorher, weil `code` nicht in `sanitizeHTML()`s `allowedTags` steht. Nach diesem Fix verhält sich die Wiki-Ansicht konsistent zu allen anderen Renderern — der Text bleibt vollständig erhalten, nur die Hintergrund-Auszeichnung entfällt. Dies ist eine dokumentierte, bewusst zugelassene Folge des Sicherheitsfixes (per `tests/e2e/features/wiki.spec.js#Textererhalt`-Test automatisiert nachgewiesen) und wird in Plan 10-05 (Security-Audit-Konsolidierung) in die Bilanz aufgenommen.

## User Setup Required

None — keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- Der einzige heute live ausnutzbare Exploit-Pfad (SEC-01 Kriterium 1) ist geschlossen und per E2E bewiesen (SEC-01 Kriterium 2)
- Import-seitige Sanitisierung (zweite Grenze aus D-01, Verteidigung in der Tiefe für Rohdaten-at-Rest) ist noch offen — geplant für Plan 10-02
- Volle Suiten grün: `npx playwright test` 312 passed / 2 skipped (PWA-Tests, https/localhost-only, unabhängig von dieser Phase), `npx jest` 457/457
- Nur die vier vorgesehenen Dateien geändert (`git diff --name-only` gegen den Plan-Start-Commit bestätigt exakt: `features/wiki/wiki.js`, `tests/e2e/features/import-security.spec.js`, `tests/e2e/features/wiki.spec.js`, `ui/editors/markdown-converter.js`)
- Bereit für Plan 10-02 (Import-Grenze: `HTML_FIELDS_BY_TYPE` + `sanitizeImportedItem()` in `systems/spellslots/import-export.js`)

---
*Phase: 10-security-h-rtung*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: tests/e2e/features/import-security.spec.js
- FOUND: ui/editors/markdown-converter.js
- FOUND: features/wiki/wiki.js
- FOUND: tests/e2e/features/wiki.spec.js
- FOUND: commit e1f5a2b (test: RED proof)
- FOUND: commit 8321c9a (feat: fix + GREEN proof)
- FOUND: commit 6f6d59f (test: TOC/text-preservation regression net)
