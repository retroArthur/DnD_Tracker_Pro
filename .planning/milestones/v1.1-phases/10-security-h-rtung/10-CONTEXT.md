# Phase 10: Security-Härtung - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Der vorbestehende Import-XSS (CR-01 aus `01-REVIEW.md`) ist geschlossen — mit Regressionstest, der beweist, dass eine bösartige Import-Datei sanitisiert wird und kein Skript ausgeführt wird. Die kritischen Angriffsflächen der App (Import/Export, Storage/IDB, Datei-Backup, Rich-Text/innerHTML) sind via `/gsd-secure-phase` auditiert und in einer konsolidierten SECURITY.md mit `threats_open: 0` dokumentiert. Requirements: SEC-01, SEC-02.

Zusätzlich in den Phase-10-Scope aufgenommen (Beifang-Entscheidungen, siehe D-05..D-08): der Phase-9-Paste-XSS (Broken-Windows #1), die `<strike>`-Whitelist-Lücke (Datenintegritäts-Item, in Phase 9 explizit für Phase 10 vorgemerkt) und WR-03 (Global-Import ohne Undo/Backup).

Milestone-Leitplanke v1.1 gilt: verhaltensneutral aus Nutzersicht — Security-Bugfixes stellen korrektes Verhalten her, neue Features gibt es nicht.

</domain>

<decisions>
## Implementation Decisions

### Import-XSS-Fix (SEC-01)
- **D-01:** **Defense-in-Depth an beiden Grenzen.** `renderMarkdownInContent()` (`ui/editors/markdown-converter.js`) sanitisiert am Ende identisch zu `markdownToHtml()`, UND der Import-Pfad (`executeImport()` + `importDataGlobal()` in `systems/spellslots/import-export.js`) schleust HTML-tragende Felder durch `sanitizeHTML()`. Begründung: mehrere Render-Pfade vertrauen auf saubere Speicherinhalte; eine Schicht allein lässt Lücken.
- **D-02:** **Feldauswahl per Render-Pfad-Audit.** Der Researcher auditiert, welche importierten Felder tatsächlich ungeschützt in `innerHTML` landen (content, description, notes, traits … je Entity-Typ) und leitet daraus die Sanitisierungs-Feldliste ab. KEIN rekursives Sanitisieren aller String-Felder — `sanitizeHTML()` auf Nicht-HTML-Text (Namen, Würfelformeln mit `<`/`>`) könnte legitime Inhalte verändern (Leitplanken-Risiko).
- **D-03:** **Keine Bestandsdaten-Migration.** Bereits gespeicherte (potenziell unsaubere) Daten werden NICHT migriert — die neue Anzeige-Grenzen-Sanitisierung neutralisiert Altdaten automatisch beim Rendern; der Speichern-Pfad sanitisiert ohnehin. Kein Mutations-Risiko, kein Undo-Bloat.
- **D-04:** **Still säubern.** Der Import meldet Sanitisierungs-Eingriffe nicht (kein Toast, kein Event-Log-Eintrag, kein Dialog) — maximal verhaltensneutral.

### Beifang-Findings (Scope-Erweiterungen)
- **D-05:** **Broken-Windows #1 (Paste-Tabellen-XSS) wird in Phase 10 gefixt.** `handleEditorPaste()`s Tabellen-insertHTML-Zweig (`ui/editors/rich-text.js:594ff`, Zeilen 615/623) strippt künftig auch `on*`-Ereignis-Attribute. Ledger-Eintrag #1 in `.planning/WINDOWS.md` wird auf `fixed` gesetzt (`gsd-tools windows fixed 1`) — `/gsd-ship` ist damit wieder frei. Das bestehende 80-Tests-Editor-Netz sichert die Änderung ab.
- **D-06:** **`<strike>`-Whitelist-Fix in Phase 10.** `<strike>` wird in die `sanitizeHTML`-Whitelist aufgenommen — synchron in `utils/basic.js` UND im Test-Zwilling `utils/testable-utils.js`. Behebt den in Phase 9 eingefrorenen Datenintegritäts-Bug (Strikethrough ging beim Speichern-Roundtrip verloren). Der betroffene Netz-Roundtrip-Test wird mit dokumentierter Begründung angepasst (per Phase-9-D-04a begründungspflichtig; Begründung = diese Entscheidung). — **Reversibility:** costly — einmal in der Whitelist, erzeugen Nutzer-Daten `<strike>`-Markup, das eine spätere Whitelist-Verengung wieder zerstören würde.
- **D-07:** **WR-03 wird in Phase 10 gefixt.** `importDataGlobal()`s Überschreib-Zweig bekommt `saveUndoState()` + `createAutoBackup()` nach dem Muster von `executeImport()` (01-REVIEW.md WR-03-Fixvorschlag).
- **D-08:** **CSP + class/style-Breite: bewusst akzeptierte Risiken.** Keine CSP-Einführung, keine Verengung der `class`/`style`-Erlaubnis in `sanitizeHTML`. SECURITY.md dokumentiert beide mit Begründung (Single-User-Offline-App, Inhalte sind DM-eigene Daten, `'unsafe-inline'` wäre architekturbedingt ohnehin nötig; CSP müsste unter `file://` UND PWA/SW getestet werden — Aufwand ohne nennenswerte Restrisiko-Senkung).

### Audit-Zuschnitt (SEC-02)
- **D-09:** **Angriffsflächen-getrieben: Phasen 1, 2, 9, 10.** `/gsd-secure-phase` läuft über genau die Phasen, die die vier kritischen Flächen implementiert haben: Phase 1 (Import/Export, Storage/IDB), Phase 2 (Datei-Backup), Phase 9 (neue Editor-Implementierung), Phase 10 (die Security-Fixes selbst). Nicht alle 9 Phasen — Flächen ohne Security-Relevanz (Würfel-Statistiken, Kalender …) bringen keinen Erkenntnisgewinn.
- **D-10:** **Eine konsolidierte SECURITY.md im Repo-Root** (GitHub-Konvention, öffentlich sichtbar) als Gesamtbilanz über alle vier Angriffsflächen mit `threats_open: 0`, gespeist aus den per-Phase-Audit-Artefakten (die in `.planning/` bleiben).
- **D-11:** **Fixes zuerst, Audit als Abschluss-Gate.** Erst alle Fixes (D-01..D-07) umsetzen, dann der Audit als letzter Schritt — er dokumentiert den finalen Stand und bestätigt `threats_open: 0`.
- **D-12:** **`threats_open: 0` heißt „gefixt ODER begründet akzeptiert".** Hebt der Abschluss-Audit neue Findings: Triage nach Schwere — Critical/High werden noch in Phase 10 gefixt, Low/Info mit Begründung als akzeptiertes Risiko dokumentiert. Nichts versandet, die Phase bleibt beherrschbar.

### Regressionstest-Design (SEC-01 Kriterium 2)
- **D-13:** **E2E + Unit kombiniert.** E2E-Test beweist die ganze Kette (bösartige Import-Datei → Import → Wiki-Eintrag öffnen → kein Script-Execute, Markup gesäubert) im blockierenden CI-Job; Unit-Tests decken die Sanitizer-Pfade feingranular mit mehreren Payload-Vektoren.
- **D-14:** **Neue Security-Tests laden die ECHTEN Produktions-Sanitizer** (`utils/basic.js`) via `vm.runInContext` — Präzedenz: `tests/unit/storage-conflict.test.js`. Zusätzlich ein Paritäts-Test, der `testable-utils.js` gegen `utils/basic.js` mit einem gemeinsamen Vektor-Set vergleicht — er erzwingt strukturell, dass der `<strike>`-Fix (D-06) in beiden Zwillingen landet, und adressiert den CONCERNS.md-High-Priority-Gap (Drift der Test-Kopien).
- **D-15:** **Kuratierter Payload-Vektor-Katalog** statt Cheatsheet-Overkill: Review-Exploit (`<img src=x onerror=…>`), `javascript:`-URLs, `<script>`-Tags, SVG-Event-Handler, Tabellen-Paste-Payload aus T-09-01 — je Vektor eine Assertion.
- **D-16:** **Paste-XSS-Test im bestehenden Editor-Netz** (`tests/e2e/features/editor-insert.spec.js`, neben T-09-01). Die nötige Anpassung von T-09-01 wird dokumentiert begründet — der Test dokumentierte bisher das verwundbare Verhalten; nach dem D-05-Fix assertiert er das Strippen der `on*`-Attribute.

### Claude's Discretion
- Exakte technische Umsetzung der Sanitisierungs-Aufrufe (wo genau im Import-Flow, Helper-Extraktion ja/nein), solange beide Grenzen (D-01) abgedeckt sind
- Zusammensetzung des Vektor-Katalogs (D-15) über die genannten Pflicht-Vektoren hinaus
- Struktur/Gliederung der SECURITY.md (Format, Frontmatter), solange `threats_open: 0` und die vier Angriffsflächen klar auditierbar sind
- Plan-/Wellen-Aufteilung der Fixes (einzeln vs. gebündelt)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security-Befunde (Ausgangslage)
- `.planning/phases/01-stabilisierung/01-REVIEW.md` — CR-01 (Import-XSS: exakte Kette, Exploit, Fixvorschlag) + WR-03 (importDataGlobal ohne Undo/Backup, Fixvorschlag) — die zwei Haupt-Fix-Aufträge
- `.planning/WINDOWS.md` — Broken-Windows-Ledger, Eintrag #1: Paste-Tabellen-XSS (empirisch bestätigt, Zeilen 615/623), blockiert `/gsd-ship` bis `fixed`
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-BASELINE.md` — A4-Entscheidung (`<strike>`-Freeze mit Phase-10-Vormerkung), T-09-01-Sicherheits-Regressionstest, Netz-Freeze-Protokoll
- `.planning/codebase/CONCERNS.md` §Security Considerations + §Test Coverage Gaps — innerHTML-Risikoklasse, testable-utils-Drift (High Priority), sanitizeHTML class/style-Breite, fehlende CSP (Stand 2026-06-11 — Fakten vor Verwendung gegen Live-Stand prüfen)

### Betroffener Produktions-Code
- `ui/editors/markdown-converter.js` — `renderMarkdownInContent()` (Zeile ~258-300, sanitisiert NICHT) vs. `markdownToHtml()` (Zeile ~242-244, sanitisiert korrekt — das Vorbild)
- `systems/spellslots/import-export.js` — `executeImport()` (~292-301/351-368: Schema-Validierung ohne Sanitisierung) + `importDataGlobal()` (~569-578: `Object.assign(D, imp)` ohne Sanitisierung/Undo/Backup)
- `features/wiki/wiki.js` — Anzeigepfad `entry.content` → `renderMarkdownInContent` → `parseWikiLinks` → `innerHTML` (Zeile ~460); Speichern-Pfad sanitisiert bereits (Zeile ~696)
- `utils/basic.js` — `sanitizeHTML()`-Whitelist (Zeile ~44-156; `<strike>` fehlt) + `esc()`; Produktions-Sanitizer, den D-14-Tests direkt laden
- `utils/testable-utils.js` — Test-Zwilling der Sanitizer (bereits gedriftet); bekommt `<strike>`-Fix synchron + Paritäts-Test (D-14)
- `ui/editors/rich-text.js` — `handleEditorPaste()`-Tabellen-Zweig (Zeile ~594ff, on*-Attribute-Lücke, D-05); Phase-9-Hilfsfunktionen (`insertHtmlAtSelection` …) für neue Editor-Arbeit nutzen, KEIN execCommand

### Tests & CI
- `tests/e2e/features/editor-insert.spec.js` — T-09-01-Sicherheitstest (wird per D-16 angepasst/erweitert); Teil des eingefrorenen 80-Tests-Netzes
- `tests/unit/storage-conflict.test.js` — Präzedenz-Muster für vm.runInContext-Tests gegen echten Quelltext (D-14)
- `tests/e2e/helpers/test-utils.js` + `playwright.config.js` — E2E-Infrastruktur (file:// gegen `dist/dnd-tracker-bundled.html`); vor E2E-Läufen `python build.py`
- `.github/workflows/ci.yml` — blockierender e2e-Job: neue Tests laufen automatisch als Deploy-Gate mit

### Projektregeln & fortgeltende Entscheidungen
- `.planning/ROADMAP.md` — Phase-10-Success-Criteria (4 Kriterien, wörtlich)
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-CONTEXT.md` — D-04a (Netz-Änderungen begründungspflichtig), D-02 (Markup-Identität), fortgeltende Phase-8-Testregeln
- `CLAUDE.md` — §execCommand-Ablösung (Editor-Hilfsfunktionen statt execCommand), XSS-Checkliste, saveUndoState-Regel, Build-Dedup-Regeln

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sanitizeHTML()` (`utils/basic.js`): der vorhandene, DOMParser-basierte Allowlist-Sanitizer — beide neuen Grenzen (D-01) rufen ihn auf, kein neuer Sanitizer wird gebaut
- `markdownToHtml()` (`ui/editors/markdown-converter.js`): zeigt exakt das Sanitisierungs-Muster, das `renderMarkdownInContent()` fehlt
- `executeImport()`-Undo/Backup-Muster (`import-export.js:351/355`): Vorlage für den WR-03-Fix in `importDataGlobal()`
- `tests/unit/storage-conflict.test.js`: vm.runInContext-Muster für Tests gegen echten Quelltext
- 80-Tests-Editor-Regressionsnetz + blockierender e2e-CI-Job: Schutzschicht für die D-05/D-06-Editor-/Sanitizer-Änderungen

### Established Patterns
- E2E gegen das gebaute Bundle via `file://` — vor jedem Lauf `python build.py`; Selektoren via `data-action`; deutsche Testnamen
- Phase-8-Testregeln gelten fort: Maskierungs-Kriterium für `page.evaluate`, keine `waitForTimeout`, exakte Assertions
- Build-Dedup-Regeln: keine funktions-lokalen `const X = window.X`, keine doppelten Top-Level-Funktionsnamen
- Netz-Freeze (Phase 9): Änderungen an Netz-Tests sind begründungspflichtig — gilt für D-06/D-16-Anpassungen

### Integration Points
- Import-Flows: Datei-Import im Kampagnen-/Einstellungs-Bereich (`executeImport`) und globaler Import (`importDataGlobal`) — beide münden in `D` + `save()`
- Wiki-Render-on-Display: einziger bekannter ungeschützter `renderMarkdownInContent`-Konsument; der D-02-Audit prüft, ob weitere Entity-Renderer denselben Pfad nutzen
- `.planning/WINDOWS.md`-Ledger: nach D-05-Fix `gsd-tools windows fixed 1` ausführen, sonst bleibt `/gsd-ship` blockiert

</code_context>

<specifics>
## Specific Ideas

- **Exploit-Referenz (wörtlich aus 01-REVIEW.md):** `wiki[0].content = '<img src=x onerror=alert(document.cookie)>'` in einer Kampagnen-JSON — importieren, Wiki-Eintrag öffnen, Handler feuert. Genau dieser Vektor MUSS im E2E-Regressionstest nachgestellt und als neutralisiert bewiesen werden.
- **Paritäts-Test-Zweck (D-14):** nicht nur Drift erkennen, sondern strukturell erzwingen, dass Whitelist-Änderungen (wie `<strike>`) immer in beiden Sanitizer-Zwillingen landen.
- **`threats_open: 0`-Lesart (D-12, wörtlich für den Auditor):** Ein Threat ist geschlossen, wenn er gefixt ODER mit dokumentierter Begründung als akzeptiertes Risiko eingestuft ist. Offene, unbegründete Threats blocken den Phase-Abschluss.

</specifics>

<deferred>
## Deferred Ideas

- **CSP-Meta-Tag + class-Präfix-Whitelist in sanitizeHTML:** bewusst NICHT in v1.1 (D-08, akzeptierte Risiken mit Audit-Begründung). Kandidat für einen späteren Milestone, falls sich das Nutzungsmodell ändert (z. B. geteilte Kampagnen-Dateien als Kern-Feature).
- **Drei verbleibende `document.execCommand`-Call-Sites außerhalb des Editors** (`systems/entity-links.js:108`, `features/wiki/wiki.js:819`, `ui/actions/system-actions.js:79`): bereits als CONCERNS.md-Posten geführt, Kandidat für Phase 11 (ARCH-04-Triage) oder später — kein Security-Fix, gehört nicht in Phase 10.

</deferred>

---

*Phase: 10-Security-Härtung*
*Context gathered: 2026-07-25*
