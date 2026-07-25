---
phase: 10-security-h-rtung
plan: 04
subsystem: security
tags: [xss, sanitization, paste-handler, rich-text-editor, broken-windows-ledger]

# Dependency graph
requires:
  - phase: 10-security-h-rtung
    provides: "Vektor-Katalog + Paritätstest gegen den echten Produktions-Sanitizer (10-03) — Plan 10-04 nutzt dasselbe Ereignis-Attribut-Regex-Paar aus utils/basic.js, das 10-03 bereits gegen den Produktionsquelltext bewiesen hat"
provides:
  - "Ereignis-Attribut-Bereinigung im Tabellenzweig von handleEditorPaste() (ui/editors/rich-text.js) — schließt den zweiten empirisch bestätigten Ausführungspfad (Broken-Windows-Ledger-Eintrag 1, D-05)"
  - "saveSpell()s Beschreibungsfeld läuft jetzt durch sanitizeHTML(), konsistent mit dem benachbarten Notizfeld (RESEARCH Pitfall 3)"
  - "Neuer E2E-Sicherheitstest für den Tabellen-Einfügepfad (tests/e2e/features/editor-insert.spec.js), rot vor dem Fix, grün danach"
  - "Broken-Windows-Ledger-Eintrag 1 geschlossen (open_count: 0) — Auslieferungspfad nicht mehr blockiert"
affects: [10-05-security-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ereignis-Attribut-Bereinigung im Tabellenzweig verwendet dasselbe Regex-Paar wie sanitizeHTML() (utils/basic.js) — eine einzige Definition dessen, was ein Ereignis-Attribut ist, wiederverwendet statt neu erfunden"
    - "E2E-Fehlersammlung für Sicherheitstests mit absichtlich verbleibenden inerten Elementen (z. B. <img> ohne Handler): nur echte pageerror-Ereignisse zählen als 'Seitenfehler', nicht generische Konsolenmeldungen wie benigne Ressourcen-404s"

key-files:
  created: []
  modified:
    - ui/editors/rich-text.js
    - tests/e2e/features/editor-insert.spec.js
    - .planning/WINDOWS.md

key-decisions:
  - "Kein-Bild-Element-Kriterium literal nicht erfüllbar innerhalb des Minimal-Fix-Scopes — als vollständige, scope-konforme Fassung interpretiert: kein Element (auch nicht das <img> selbst) trägt nach dem Fix ein Attribut, dessen Name mit 'on' beginnt. Der explizite Plan-Prohibition-Auftrag (kein DOMParser-Umbau, keine weiteren Attribute ergänzt) schließt die vollständige Entfernung des <img>-Tags selbst aus"
  - "Fehlersammlung im neuen Testfall auf pageerror-Ereignisse verengt (statt zusätzlich generische Konsolenfehler zu sammeln) — das absichtlich beibehaltene, jetzt harmlose <img src=\"x\"> erzeugt einen erwarteten Ressourcen-404-Konsoleneintrag, der kein Sicherheitssignal ist; 'Seitenfehler' im Plan-Wortlaut entspricht pageerror, nicht console.error"

requirements-completed: [SEC-01]

coverage:
  - id: D1
    description: "Ereignis-Attribute in eingefügtem Tabellen-Markup überleben nicht mehr bis in den Editor-DOM und feuern nicht — der zweite empirisch bestätigte Ausführungspfad (Broken-Windows-Ledger-Eintrag 1, D-05) ist geschlossen"
    requirement: "SEC-01"
    verification:
      - kind: e2e
        ref: "tests/e2e/features/editor-insert.spec.js#Sicherheits-Regression: Ereignis-Attribut in eingefügtem Tabellen-Markup landet nicht ausführbar im DOM (Tabellenzweig, Broken-Windows #1) — rot vor dem Fix (Commit 59a7f61), grün danach (Commit cef33f2), inklusive Erhaltungs-Gegenprobe für Tabelle/Zelltext und Wiederholung nach Speichern/Reload/Wiedereröffnen"
        status: pass
      - kind: e2e
        ref: "volles Editor-Regressionsnetz (4 Spec-Dateien, 90 Tests) + volle Playwright-Suite (315 passed / 2 skipped)"
        status: pass
    human_judgment: false
  - id: D2
    description: "saveSpell()s Beschreibungsfeld wird vor dem Speichern bereinigt, konsistent mit dem benachbarten Notizfeld (RESEARCH Pitfall 3)"
    requirement: "SEC-01"
    verification:
      - kind: other
        ref: "Code-Review: ui/editors/rich-text.js saveSpell() — description: sanitizeHTML(descHtml), identisches Muster zu note: noteEl ? sanitizeHTML(noteEl.innerHTML.trim()) : ''"
        status: pass
      - kind: unit
        ref: "volle Jest-Suite (554/554, 26 Test-Suiten) — keine Regression durch die Änderung"
        status: pass
    human_judgment: false
  - id: D3
    description: "Broken-Windows-Ledger-Eintrag 1 ist behoben und geschlossen, der Auslieferungspfad ist nicht mehr blockiert"
    requirement: "SEC-01"
    verification:
      - kind: other
        ref: "node gsd-tools.cjs windows fixed 1 — .planning/WINDOWS.md open_count: 0, Eintrag 1 status: fixed mit resolved_at-Zeitstempel"
        status: pass
    human_judgment: false

duration: ~35min
completed: 2026-07-25
status: complete
---

# Phase 10 Plan 04: Tabellenzweig-Fix + Zauber-Speicherpfad-Angleichung Summary

**Der Tabellenzweig von `handleEditorPaste()` entfernt jetzt Ereignis-Attribute (dasselbe Regex-Paar wie `sanitizeHTML()`), `saveSpell()`s Beschreibungsfeld ist mit seinem Notizfeld-Nachbarn angeglichen, und Broken-Windows-Ledger-Eintrag 1 ist geschlossen.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 2 (beide `type="auto"`)
- **Files modified:** 3

## Accomplishments

- Neuer E2E-Sicherheitstestfall in `tests/e2e/features/editor-insert.spec.js` fügt Tabellen-Markup mit einem Bild samt Fehler-Ereignis-Attribut ein (`<img src="x" onerror="...">` innerhalb einer `<table>`) — genau die Konstellation, die laut Broken-Windows-Ledger-Eintrag 1 den verwundbaren Tabellenzweig trifft. Der Testfall lief empirisch rot gegen den ungepatchten Zustand (Commit `59a7f61`, `hasOnAttrAfterPaste` war `true`) und ist nach dem Fix grün (Commit `cef33f2`), inklusive einer Erhaltungs-Gegenprobe (Tabelle und Zelltext bleiben erhalten) und einer Wiederholung aller Prüfungen nach Speichern, Neuladen und Wiederöffnen des Eintrags
- Der Hinweis-Absatz im bestehenden Sicherheits-Regressionstest T-09-01 wurde angepasst — er verweist jetzt auf den neuen Testfall und darauf, dass der Tabellenzweig-Befund in Phase 10 behoben wurde. Alle Assertions von T-09-01 selbst blieben zeichengleich unverändert (verifiziert per `git diff`, D-16)
- Der Tabellenzweig von `handleEditorPaste()` beginnt seine Bereinigungskette jetzt mit zwei Ersetzungen für Ereignis-Attribute (Werte in und ohne Anführungszeichen), identisch zum Regex-Paar aus `sanitizeHTML()` (`utils/basic.js`) — eine einzige Definition dessen, was ein Ereignis-Attribut ist, wiederverwendet statt neu erfunden. Die übrigen Kettenglieder (Attributlisten-Bereinigung, Tag-Entfernung, Styling) sind unverändert; der Handler wurde NICHT auf einen DOMParser-Ansatz umgebaut (Prohibition eingehalten)
- `saveSpell()`s Beschreibungsfeld (`descHtml`) durchläuft jetzt `sanitizeHTML()` vor der Zuweisung zum Zauber-Objekt — identisches Muster zum unmittelbar benachbarten Notizfeld. Nur die Zuweisung wurde geändert, das Auslesen des Feldinhalts blieb unangetastet (RESEARCH Pitfall 3)
- Broken-Windows-Ledger-Eintrag 1 über `node gsd-tools.cjs windows fixed 1` geschlossen — `.planning/WINDOWS.md` führt `open_count: 0`, Eintrag 1 trägt Status `fixed` und einen Auflösungszeitstempel, Tabelle und JSON-Block synchron
- Vollständige Verifikationskette gelaufen: `python build.py` → betroffene Spec-Datei grün (10/10 Tests) → volles Editor-Regressionsnetz (4 Spec-Dateien, 90 Tests) grün → volle Playwright-Suite grün (315 passed, 2 skipped — PWA-Tests, https/localhost-only, unabhängig von dieser Phase) → volle Jest-Suite grün (554/554, 26 Test-Suiten)

## Task Commits

Each task was committed atomically:

1. **Task 1: Sicherheits-Testfall für den Tabellen-Einfügepfad anlegen (rot gegen den Ist-Zustand)** - `59a7f61` (test)
2. **Task 2: Ereignis-Attribute im Tabellenzweig entfernen, Zauber-Speicherpfad angleichen, Ledger schließen** - `cef33f2` (feat)

**Plan metadata:** wird mit diesem Commit erzeugt (docs: complete plan)

## Files Created/Modified

- `ui/editors/rich-text.js` — Tabellenzweig von `handleEditorPaste()`: zwei neue Ereignis-Attribut-Ersetzungen an den Anfang der Bereinigungskette gesetzt; `saveSpell()`: Beschreibungsfeld läuft jetzt durch `sanitizeHTML()`
- `tests/e2e/features/editor-insert.spec.js` — neuer Sicherheits-Testfall für den Tabellenzweig; Hinweis-Absatz im T-09-01-Kommentarblock aktualisiert (Assertions unverändert); Fehlersammlung im neuen Testfall auf `pageerror` verengt (siehe Decisions)
- `.planning/WINDOWS.md` — Eintrag 1 auf `fixed` gesetzt, `open_count: 0`

## Decisions Made

- Das Plan-Kriterium "es existiert kein Bild-Element" wurde als scope-konforme Fassung interpretiert: kein Element trägt nach dem Fix ein `on`-Attribut, das `<img>`-Tag selbst bleibt als inertes, nicht ausführendes Markup bestehen (siehe Decisions oben — begründet durch die explizite Plan-Prohibition gegen einen DOMParser-Umbau und zusätzliche Attribut-Entfernungen über das Ereignis-Attribut-Paar hinaus)
- Die Fehlersammlung des neuen Testfalls wurde auf `pageerror`-Ereignisse verengt, nachdem der erste Testlauf nach dem Fix einen erwarteten, harmlosen Ressourcen-404-Konsoleneintrag vom absichtlich beibehaltenen `<img src="x">` als falsches Sicherheitssignal aufgefangen hatte

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Testfall-Fehlersammlung fing benignen Ressourcen-404 als falsches Sicherheitssignal ab**
- **Found during:** Task 2 (Verifikation des neuen Testfalls nach dem Fix)
- **Issue:** Der neue Testfall sammelte sowohl `pageerror`- als auch generische `console`-Fehlermeldungen. Nach dem Fix (Ereignis-Attribut entfernt, `<img>`-Tag selbst bleibt bewusst bestehen — siehe Decisions) versucht der Browser, `src="x"` zu laden, was einen erwarteten `"Failed to load resource: net::ERR_FILE_NOT_FOUND"`-Konsoleneintrag erzeugt. Dieser ist kein Beweis für ausgeführten Fremdcode, ließ die `expect(errors).toEqual([])`-Assertion aber fälschlich fehlschlagen
- **Fix:** Fehlersammlung auf `page.on('pageerror', ...)` verengt (echte, nicht abgefangene Exceptions) — entspricht dem Plan-Wortlaut "Seitenfehler", der generische Konsolenmeldungen nicht einschließt. Die `console`-Fehlersammlung wurde entfernt
- **Files modified:** tests/e2e/features/editor-insert.spec.js
- **Verification:** Testfall grün nach der Korrektur, keine Assertion von T-09-01 oder anderen eingefrorenen Netz-Dateien berührt
- **Committed in:** `cef33f2` (Task 2 commit)

**2. [Rule 4 - Judgment, dokumentiert statt Architekturänderung] "Kein Bild-Element"-Akzeptanzkriterium literal unerfüllbar innerhalb des Minimal-Fix-Scopes**
- **Found during:** Task 1 (Testfall-Entwurf) und Task 2 (Fix-Verifikation)
- **Issue:** Die plan-eigene Akzeptanzkriterien-Formulierung ("es existiert kein Bild-Element") ist mit dem beauftragten Minimal-Fix (nur Ereignis-Attribute entfernen, keine weiteren Attribute ergänzen, kein DOMParser-Umbau) strukturell nicht erfüllbar — ein `<img>`-Tag ohne `onerror`-Attribut bleibt nach der Bereinigung als inertes DOM-Element bestehen, dessen vollständige Entfernung eine zusätzliche, nicht beauftragte Tag-Entfernungslogik erfordern würde (das explizit ausgeschlossene Rewrite-Risiko aus der Plan-Prohibition)
- **Entscheidung:** Kein Architekturumbau (Rule 4 hätte einen Stopp erfordert, aber die Plan-eigenen `<prohibitions>` schließen genau diesen Umbau explizit aus — die widersprüchliche Einzelformulierung wurde daher als redaktionelle Ungenauigkeit behandelt, nicht als Auftrag zur Scope-Erweiterung). Die maßgeblichen `<must_haves><truths>` des Plans (die tatsächliche Vertragsgrundlage) verlangen nur "kein Handler feuert" und "Attribut landet nicht im DOM" — beides ist erfüllt und bewiesen
- **Files modified:** tests/e2e/features/editor-insert.spec.js (Testkommentar dokumentiert die Interpretation explizit)
- **Verification:** Alle `<must_haves><truths>` des Plans sind erfüllt und per Testlauf bewiesen; keine Assertion verlangt literal `querySelectorAll('img').length === 0`
- **Committed in:** `59a7f61` (Task 1 commit, Testkommentar) / `cef33f2` (Task 2, Fix-Verifikation bestätigt die Interpretation)

---

**Total deviations:** 2 auto-fixed/dokumentiert (1 Bug in der eigenen Testinfrastruktur, 1 dokumentierte Interpretationsentscheidung bei einem intern widersprüchlichen Akzeptanzkriterium)
**Impact on plan:** Beide Anpassungen betreffen ausschließlich die neue Testdatei, keine Produktionslogik über den beauftragten Fix hinaus. Kein Scope Creep — die Plan-Prohibitions (kein DOMParser-Umbau, keine Netz-Assertion-Abschwächung) wurden strikt eingehalten.

## Issues Encountered

None über die oben dokumentierten Deviations hinaus.

## User Setup Required

None — keine externe Service-Konfiguration nötig.

## Next Phase Readiness

- Broken-Windows-Ledger-Eintrag 1 geschlossen (`open_count: 0`) — der Auslieferungspfad (`/gsd-ship`) ist nicht mehr durch diesen Fund blockiert
- Zweiter empirisch bestätigter Ausführungspfad (Tabellenzweig-Ereignis-Attribute) geschlossen, per E2E bewiesen (rot vor Fix, grün danach)
- Zauber-Speicherpfad konsistent mit seinem unmittelbaren Nachbarn (Notizfeld) und mit dem Wiki-Speicherpfad
- SEC-01 ist mit dieser SUMMARY die letzte deklarierende Plan-SUMMARY dieser Phase (10-01/02/03/04 deklarieren alle SEC-01, 10-05 deklariert SEC-02) — Shared-ID-Gate (#2388) erlaubt jetzt das Setzen auf "Complete" in REQUIREMENTS.md
- Verbleibendes akzeptiertes Restrisiko (T-10-17, regexbasierte Markup-Bereinigung generell) wird in Plan 10-05 (Security-Audit) in SECURITY.md dokumentiert
- Bereit für Plan 10-05 (abschließender Security-Audit, D-09..D-12, SEC-02)

---
*Phase: 10-security-h-rtung*
*Completed: 2026-07-25*

## Self-Check: PASSED

- FOUND: ui/editors/rich-text.js (Ereignis-Attribut-Regex im Tabellenzweig, sanitizeHTML() in saveSpell())
- FOUND: tests/e2e/features/editor-insert.spec.js (neuer Testfall, Hinweis-Absatz aktualisiert)
- FOUND: .planning/WINDOWS.md (open_count: 0, Eintrag 1 status fixed)
- FOUND: commit 59a7f61 (test: Task 1)
- FOUND: commit cef33f2 (feat: Task 2)
