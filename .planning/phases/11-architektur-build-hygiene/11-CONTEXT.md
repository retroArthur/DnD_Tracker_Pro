# Phase 11: Architektur- & Build-Hygiene - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Die Build- und Repo-Hygiene wird abgeschlossen: Modullisten-Drift zwischen `loader.js` und `build.py` wird strukturell unmöglich (ARCH-01), der Dedup-Pfad in `build.py` kann kein still kaputtes Bundle mehr erzeugen (ARCH-02), CI und Browser-Konsole laufen ohne Deprecation-Warnungen und ohne 404 (ARCH-03), und `.planning/codebase/` plus die CONCERNS.md-Restposten spiegeln den finalen Stand nach allen v1.1-Phasen (ARCH-04). Requirements: ARCH-01, ARCH-02, ARCH-03, ARCH-04.

Milestone-Leitplanke v1.1 gilt unverändert: **verhaltensneutral aus Nutzersicht** — an der App ändert sich nichts, was ein Spielleiter am Tisch merkt. Phase 11 fasst Build-Skript, CI-Workflow, HTML-Kopf, Build-Doku und Planungs-Artefakte an, keine Feature-Logik.

**Wichtige Ausgangslage (beim Scouting festgestellt, weicht von CONCERNS.md ab):** Ein harter Modullisten-Gate existiert bereits (`build.py:211-232`, `sys.exit(1)`), ebenso ein Quell-Pre-Check gegen doppelte Funktionsnamen (`build.py:190-208`) und eine Post-Build-Validierung, die doppelte Top-Level-Deklarationen im fertigen Bundle erkennt und den Build abbricht, **bevor** die Datei geschrieben wird (`build.py:657-672`). Phase 11 schließt die verbliebenen Löcher in dieser Kette, sie baut sie nicht neu.

</domain>

<decisions>
## Implementation Decisions

### Modullisten-Sync (ARCH-01)

- **D-01:** **Single Source of Truth statt Gate-Verschärfung.** `build.py` liest die Modulliste zur Build-Zeit aus dem `MODULES`-Array in `loader.js`; die 148-Zeilen-Kopie in `build.py:40-187` entfällt ersatzlos. Drift wird damit nicht mehr *erkannt*, sondern ist *unmöglich* — inklusive Reihenfolge, die der heutige Mengenvergleich in `check_module_list_sync()` gar nicht prüft. Ein fehlschlagender Parse bricht den Build ab (heute: `log.warning` + stilles Überspringen der Prüfung, `build.py:219`). — **Reversibility:** costly — nach dem Entfernen der Liste hängen Build, Tests und Doku am Parser; ein Rückbau müsste die Liste rekonstruieren und die Tests erneut umschreiben.
- **D-02:** **Jede fehlende gelistete Datei bricht den Build ab.** Gilt gleichermaßen für JS-Module (`build.py:518`, heute nur `log.warning("... NICHT GEFUNDEN")` mit Weiterlauf), CSS-Dateien (`build.py:468`) und HTML-Templates. Ein Bundle, dem stillschweigend ein Modul oder Stylesheet fehlt, ist die Fehlerklasse, die erst am Spieltisch auffällt. Es gibt im Repo keine optionalen gelisteten Dateien.
- **D-03:** **`tests/build/` wird echtes CI-Gate.** Der bestehende `test`-Job (`.github/workflows/ci.yml:22-31`) bekommt `actions/setup-python` plus einen `pytest tests/build/`-Schritt. Ohne diesen Schritt sind die ARCH-01/02-Gates nur lokal abgesichert — heute läuft `tests/build/test_build_deduplication.py` (11 Tests, inkl. `test_no_orphaned_return_statements`) in keinem CI-Job.
- **D-04:** **Alle drei Listen bekommen die SSoT-Behandlung, nicht nur die Modulliste.** Neben `MODULES` gilt das für die Template-Liste (`loader.js:220-230` ↔ `build.py:483`) und die CSS-Reihenfolge (`assets/styles.css`-`@import`-Hub ↔ `build.py:450`). Es ist dieselbe Drift-Klasse: ein Template, das nur in `loader.js` landet, sähe im Dev-Modus korrekt aus und fehlte im Bundle. Beim Scouting verifiziert: die 20 `@import`-Zeilen in `assets/styles.css` decken sich 1:1 in Inhalt und Reihenfolge mit `css_files`, die Listen sind also parsebar.

### build.py-Dedup (ARCH-02)

- **D-05:** **Pass 3 (`remove_duplicate_functions`, `build.py:373-425`) wird ersatzlos entfernt.** Er kann faktisch nicht mehr feuern, seit `check_duplicate_functions()` (`build.py:190`) schon vor dem Bündeln hart abbricht — er ist toter Code mit dem bekannten Orphan-Bug (die Brace-Schleife `build.py:402-415` berechnet das Rumpfende und verwirft es). Entfernen erfüllt den Roadmap-Wortlaut „Build-Fehler statt still kaputtem Bundle" strikter als Reparieren: der kaputte Zustand kann nicht mehr entstehen, statt nur besser aufgeräumt zu werden. Reparieren wurde bewusst verworfen — das Ergebnis wäre ein Bundle, dem still eine Funktionsdefinition fehlt. — **Reversibility:** reversible — Git-Revert eines abgegrenzten Funktionsblocks.
- **D-06:** **Der Quell-Pre-Check wird auf `const`/`let`/`class` erweitert.** Heute erkennt `check_duplicate_functions()` nur `^function\s+(\w+)\s*\(` (`build.py:196`); doppelte Top-Level-`const`/`let` sieht erst die Bundle-Validierung — also nach dem Bündeln und ohne Angabe der Quelldatei. Nach der Erweiterung lautet die Meldung „Doppelte Top-Level-Deklaration X: features/a.js und ui/b.js" statt einer Zeilennummer im 59k-Zeilen-Bundle. Die Post-Build-Validierung (`build.py:657-672`) bleibt als Backstop bestehen.
- **D-07:** **Tests prüfen die Verhaltensgarantie, nicht die Interna.** `tests/build/` beweist: ein Quellmodul mit doppelter Top-Level-Deklaration lässt den Build mit Exit-Code ≠ 0 abbrechen **und** es wird keine Ausgabedatei geschrieben (bzw. eine vorhandene bleibt unverändert). Dazu ein Regressionstest, dass im erzeugten Bundle keine `[DEDUP] Removed duplicate function`-Marker mehr vorkommen — das schützt gegen eine spätere Wiederbelebung von Pass 3. `test_no_orphaned_return_statements` verliert seinen Gegenstand und wird durch diese Garantien ersetzt, nicht ersatzlos gestrichen.
- **D-08:** **Build-Doku wird punktgenau nachgezogen, kein Vollaudit.** Betroffen sind in `docs/build-system.md` und `CLAUDE.md`: die Pass-3-Beschreibung, die Drei-Pass-Performance-Tabelle, der Constraint „Modullisten in loader.js und build.py müssen synchron bleiben" und die Dedup-Debugging-Rezepte. Halbwahre Build-Doku ist in diesem Repo teuer, weil `CLAUDE.md` jede künftige Session steuert. Ein Vollaudit älterer Drift (Modulzahlen, Byte-Angaben, „523 window assignments") gehört zur ARCH-04-Triage, nicht hierher.

### CI- & Konsolen-Hygiene (ARCH-03)

- **D-09:** **`node-version` geht von `'20'` auf `'22'` (aktive LTS) an allen sechs Stellen in `ci.yml`.** Beim Scouting festgestellt: alle Actions stehen bereits auf aktuellen Majors (`checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `download-artifact@v4`, `setup-python@v5`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`) — die Deprecation-Warnung stammt aus der Node-Runtime, nicht aus veralteten Action-Versionen. Node 22 statt 24, weil LTS die konservativere Wahl für eine Deploy-Kette ist und die App selbst kein Node braucht (Node läuft hier nur Tooling: Jest, Playwright, ESLint). Der Planer prüft beim Anheben, ob zwischenzeitlich neuere Action-Majors existieren, und zieht sie mit.
- **D-10:** **Favicon: Data-URI im Bundle, Datei-Link im Dev-Modus.** Der `build.py`-HTML-Kopf (`build.py:585-601`) bekommt ein zur Build-Zeit aus `icons/icon.svg` erzeugtes `<link rel="icon" href="data:image/svg+xml,...">`; `index.html` bekommt `<link rel="icon" href="./icons/icon.svg">`. Begründung: `file://`-Doppelklick auf die gebaute Einzeldatei ist der primäre Nutzungsmodus (PROJECT.md-Constraint) — ein relativer Datei-Link wäre dort genau der 404, den wir schließen wollen. `index.html` läuft nie standalone (braucht `loader.js` und `assets/` daneben), dort ist der Datei-Link korrekt. Das Icon wird nicht dupliziert, sondern aus der bestehenden Quelle inlined — konsistent mit der SSoT-Linie aus D-01.
- **D-11:** **`apple-mobile-web-app-capable` wird ergänzt, nicht ersetzt.** `<meta name="mobile-web-app-capable" content="yes">` kommt in beiden HTML-Köpfen hinzu (`build.py:592`, `index.html:7`), das apple-Tag bleibt für iOS-Standalone-Verhalten stehen. Chromium warnt, solange das apple-Tag ohne das Standard-Tag steht. **Empirisch zu verifizieren:** warnt die Konsole nach dem Ergänzen weiterhin, wird das apple-Tag entfernt — iOS ist laut PROJECT.md kein Zielsystem (Windows/Chromium, `file://` + PWA).
- **D-12:** **Erfolgskriterium 4 wird maschinell belegt, nicht behauptet.** `tests/e2e/smoke.spec.js` hört heute nur auf `pageerror` (Zeile 10, 22). Es kommt eine gezielte Assertion hinzu: keine fehlgeschlagenen Requests (`requestfailed`/404) und keine Konsolen-Meldung mit den beiden bekannten Deprecation-Strings. Bewusst eng gefasst statt „keine Warnungen überhaupt" — eine pauschale Assertion wäre flaky. Der Smoke-Job läuft bereits gegen das ausgeführte Production-Bundle über HTTP (`ci.yml:85-109`), ist also der richtige Ort.

### Codebase-Map & CONCERNS-Triage (ARCH-04)

- **D-13:** **Erst triagieren und dokumentieren, dann regenerieren.** `/gsd-map-codebase` überschreibt `CONCERNS.md` vollständig — die Triage-Historie ginge dabei verloren. Reihenfolge deshalb: (1) jeder bestehende CONCERNS.md-Eintrag wird disponiert und das Ergebnis in einem eigenen Phasen-Artefakt (`11-CONCERNS-TRIAGE.md`) festgehalten, (2) danach regeneriert der Map-Refresh den Ist-Stand. So bleibt nachvollziehbar, was erledigt, obsolet oder übernommen wurde.
- **D-14:** **Alle sieben Map-Dateien werden aufgefrischt, nicht nur CONCERNS.md.** Alle stammen vom 2026-06-11 — vor den Phasen 3–10. Sie sprechen von 92 Modulen (heute ~123), kennen weder Bestiary noch PWA/Datei-Backup/Command-Palette noch die heutigen Testzahlen. Ein Teil-Refresh hinterlässt einen in sich widersprüchlichen Satz. Phase 11 ist die letzte Phase des Milestones — der richtige Zeitpunkt für den vollständigen Schnitt.
- **D-15:** **Jede Disposition braucht einen Beleg gegen den Live-Code, nicht gegen die Beschreibung in CONCERNS.md.** Das Dokument ist erwiesenermaßen stale: beim Scouting waren bereits erledigt, ohne dass CONCERNS.md es weiß — die Service-Worker-Cache-Liste (`sw.js` nutzt heute `CORE_ASSETS`/`OPTIONAL_ASSETS`, kein `assets/body.html` mehr), „No automated dist smoke test" (der `smoke-test`-Job führt seit Phase 2 das Production-Bundle im Browser aus), „unit tests exercise copies" (Paritätstest aus Phase 10, D-14), die 26 E2E-Fails (Phase 8), `main.js`/`tsconfig.json.backup`/Lizenz/`validate.py`/Mindmap-Reste (Phase 1), die execCommand-Stellen im Editor (Phase 9). Jeder „erledigt"-Vermerk zitiert Datei:Zeile oder Phase/Commit.
- **D-16:** **Phase 11 fixt keine Restposten aktiv — enge Ausnahme für ohnehin Angefasstes.** Die Roadmap fordert „erledigt, obsolet-markiert oder als Requirement übernommen" — keinen Fix-Zwang; die Milestone-Leitplanke ist verhaltensneutral. Posten mit echter Codeänderung (`_version: '2.11'`-Export-Stempel, ungeschütztes `setInterval` in `systems/backups.js:318`, oversized modules, Tab-Registry-String-Referenzen, weiche Lint-/Typecheck-Gates, die drei `execCommand`-Stellen außerhalb des Editors) werden als benannte Backlog-Requirements nach `.planning/REQUIREMENTS.md` übernommen, mit Rückverweis auf den CONCERNS-Ursprung. Ausnahme: Posten, die im Build-/CI-/Doku-Bereich ohnehin durch D-01..D-12 angefasst werden, dürfen dort direkt miterledigt werden.

### Claude's Discretion

Der Nutzer hat ab der ARCH-03-Frage explizit an mich delegiert („mach weiter mit deinen Empfehlungen, ohne mich zu fragen"). **D-09 bis D-16 sind daher Claude-gewählte Empfehlungen, keine Nutzer-Auswahlen** — sie sind vom Nutzer beim Review von CONTEXT.md oder PLAN.md jederzeit umstoßbar. D-01 bis D-08 wurden vom Nutzer direkt gewählt.

Zusätzlich frei:

- Technische Form des `loader.js`-Parsers (Regex vs. minimaler Tokenizer) und der `assets/styles.css`-`@import`-Auswertung, solange ein Parse-Fehler den Build abbricht (D-01)
- Ob `MODULES` in `build.py` weiterhin als importierbare Modul-Konstante existiert (heute so kommentiert: „fuer Import-Barkeit in Tests") oder die Tests direkt den Parser aufrufen
- Plan-/Wellen-Aufteilung: ob ARCH-01 und ARCH-02 gebündelt werden (beide fassen `build.py` an) oder getrennt laufen
- Genaue Gestalt des `11-CONCERNS-TRIAGE.md` (Tabelle vs. Abschnitte), solange je Eintrag Disposition + Beleg enthalten sind
- Ob der Map-Refresh vor oder nach den Build-/CI-Änderungen läuft — mit der Einschränkung, dass er den Stand *nach* den Phase-11-Änderungen abbilden muss (Roadmap-Kriterium 5)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phasen-Auftrag & Leitplanken
- `.planning/ROADMAP.md` §„Phase 11: Architektur- & Build-Hygiene" (Zeilen 157-170) — Goal und die 5 Erfolgskriterien, wörtlich
- `.planning/REQUIREMENTS.md` §Architektur (ARCH-01..04, Zeilen 26-31) + §„Milestone-Leitplanke" (Zeile 6, verhaltensneutral) + §Out of Scope (Zeile 47: **kein** Flächenumbau der ~504 funktions-lokalen `const X = window.X`)
- `.planning/PROJECT.md` §Constraints — `build.py` ist das einzige Build-System, `file://`-Doppelklick ist primärer Nutzungsmodus, keine Framework-/ESM-Migration

### Betroffener Build-Code (Ist-Stand beim Scouting verifiziert)
- `build.py:40-187` — `MODULES`-Liste, entfällt durch D-01
- `build.py:190-208` — `check_duplicate_functions()`, Quell-Pre-Check, bricht hart ab; wird per D-06 erweitert
- `build.py:211-232` — `check_module_list_sync()`, bestehender harter Gate (Mengenvergleich, Parse-Fehler = stilles Überspringen); entfällt bzw. wird durch D-01 ersetzt
- `build.py:373-425` — `remove_duplicate_functions()` (Pass 3) mit dem Orphan-Bug in `402-415`; entfällt per D-05
- `build.py:448-462` / `build.py:483-495` / `build.py:518` — CSS-, Template- und Modul-Ladeschleifen mit `log.warning`-Weiterlauf; werden per D-02/D-04 hart
- `build.py:585-601` — HTML-Kopf-Template des Bundles (favicon fehlt, `apple-mobile-web-app-capable` in Zeile 592); D-10/D-11
- `build.py:633-682` — Post-Build-Validierung inkl. Depth-0-Duplikatprüfung für `const`/`let`/`function`/`var`; **bleibt als Backstop bestehen**, wird nicht angefasst
- `loader.js:10-187` — `MODULES`-Array (Quelle der Wahrheit ab D-01); `loader.js:220-230` — Template-Liste
- `assets/styles.css` — 20-zeiliger `@import`-Hub, Quelle der CSS-Reihenfolge ab D-04
- `index.html:1-16` — Dev-Einstiegspunkt, HTML-Kopf für D-10/D-11
- `icons/icon.svg` — Quelle für den Favicon-Data-URI (D-10); `icons/icon-192.png`, `icons/icon-512.png` sind PWA-Icons aus `manifest.webmanifest`

### Tests & CI
- `tests/build/test_build_deduplication.py` — 11 bestehende Tests, u. a. `test_module_lists_are_synchronized` (Zeile 243), `test_duplicate_function_check_detects_duplicate` (255), `test_no_orphaned_return_statements` (272); durch D-01/D-05 teils gegenstandslos, werden per D-07 ersetzt
- `.github/workflows/ci.yml` — sechs Jobs: `lint-and-typecheck` (10), `test` (22, bekommt pytest per D-03), `e2e` (44, **blockierender Gate aus Phase 8 D-03 — nicht schwächen**), `build` (65), `smoke-test` (85, Ziel für D-12), `deploy` (113)
- `tests/e2e/smoke.spec.js` — hört bisher nur auf `pageerror` (Zeilen 10, 22); Verankerungspunkt für D-12
- `playwright.smoke.config.js` — Smoke-Config, in CI gegen HTTP-Server auf `dist/`, lokal `file://`-Fallback

### Triage-Gegenstand & Doku
- `.planning/codebase/CONCERNS.md` — Triage-Objekt (Stand 2026-06-11, **nachweislich stale** — siehe D-15); zusammen mit `ARCHITECTURE.md`, `STACK.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `INTEGRATIONS.md` per D-14 komplett zu regenerieren
- `docs/build-system.md` — beschreibt das Drei-Pass-Dedup-System; wird durch D-01/D-05 falsch (D-08)
- `CLAUDE.md` §„Build System & Deduplication Pattern" + §„Duplicate Declaration Debugging Pattern" + §Constraints („Modullisten … müssen synchron bleiben") — dieselbe Nachführung (D-08)

### Fortgeltende Entscheidungen aus früheren Phasen (nicht neu verhandeln)
- `.planning/phases/08-test-fundament-gr-n/08-CONTEXT.md` — D-03 (blockierender e2e-CI-Job), D-04/D-05/D-06 (exakte Assertions, keine `waitForTimeout`, Maskierungs-Kriterium für `page.evaluate`) — gelten für jeden neuen Test in Phase 11
- `.planning/phases/09-editor-regressionsnetz-execcommand-abl-sung/09-CONTEXT.md` — D-04a (Änderungen am 80-Tests-Editor-Netz sind begründungspflichtig)
- `.planning/phases/10-security-h-rtung/10-CONTEXT.md` — D-08 (CSP und die `class`/`style`-Breite in `sanitizeHTML` sind **bewusst akzeptierte Risiken**, in `SECURITY.md` dokumentiert) → die entsprechenden CONCERNS.md-Einträge sind „obsolet/akzeptiert", nicht „offen"; §deferred (die drei `execCommand`-Stellen außerhalb des Editors sind explizit als ARCH-04-Triage-Kandidat vorgemerkt)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Bestehende dreistufige Schutzkette in `build.py`**: Quell-Pre-Check (`190`) → Post-Build-Validierung (`657-672`, bricht ab *bevor* geschrieben wird) → CI-Smoke-Test gegen das ausgeführte Bundle (`ci.yml:85`). Phase 11 schließt Löcher in dieser Kette, statt neue Mechanik zu bauen.
- **`check_module_list_sync()`s `loader.js`-Regex** (`build.py:217`: `const MODULES\s*=\s*\[(.*?)\];` + `'([^']+)'`) — funktioniert bereits und ist der Ausgangspunkt für den SSoT-Parser aus D-01.
- **`tests/build/`-TDD-Muster** mit `tmp_path`-Fixtures und echten Build-Läufen — vorhandenes Muster für die D-07-Tests, kein neues Test-Setup nötig.
- **`icons/icon.svg`** — vorhandene Icon-Quelle für den Favicon-Data-URI (D-10), kein neues Asset.
- **`tests/e2e/smoke.spec.js` + `playwright.smoke.config.js`** — bestehende Infrastruktur, die das Production-Bundle im Browser ausführt; nur um Konsolen-/Request-Assertions zu erweitern (D-12).

### Established Patterns
- **Build bricht ab, statt Kaputtes zu schreiben**: `sys.exit(1)` vor `write_file()` ist das etablierte Muster (`build.py:673-679`) — D-02/D-05/D-06 folgen ihm.
- **Deutsche Fehlermeldungen im Build** (`[FEHLER] …`, `log.warning`/`log.success`) — neue Meldungen halten dieses Register.
- **Phase-8-Testregeln gelten fort**: exakte Assertions, keine `waitForTimeout`, `page.evaluate` nur als dokumentiertes Setup-Vehikel.
- **`PYTHONIOENCODING=utf-8` auf Windows** vor `python build.py` — gilt für jeden lokalen Build-Lauf in dieser Phase.

### Integration Points
- `build()` in `build.py:427` ruft `check_module_list_sync()` und `check_duplicate_functions()` (Zeilen 499-501) — dort hängt die neue SSoT-Beschaffung ein.
- `ci.yml` `test`-Job (Zeile 22) — Einstiegspunkt für den pytest-Schritt (D-03); der `e2e`-Job (44) und `smoke-test`-Job (85) bleiben in ihrer Reihenfolge unberührt.
- Beide HTML-Köpfe (`build.py:585-601` und `index.html:1-16`) müssen bei D-10/D-11 gemeinsam geändert werden — sie driften sonst genau wie die Modullisten.
- `.planning/REQUIREMENTS.md` §v2 Requirements — Ziel für die per D-16 übernommenen Backlog-Posten.

</code_context>

<specifics>
## Specific Ideas

- **Der Roadmap-Wortlaut zu ARCH-02 („ein verwaister Funktionskörper … erzeugt einen Build-Fehler") wird durch D-05 anders erfüllt als er gelesen werden könnte:** Pass 3 entfällt, statt einen Fehler zu werfen — der verwaiste Funktionskörper kann gar nicht mehr entstehen, weil der Pre-Check vorher abbricht. Der Verifier muss das Kriterium so prüfen: *kann* ein still kaputtes Bundle entstehen? Antwort nach Phase 11: nein, an drei Stellen abgefangen. Diese Auslegung gehört in die Verifikation dokumentiert, damit sie nicht als Gap gelesen wird.
- **Der Favicon-404 ist unter `file://` gar nicht sichtbar** — er tritt nur über HTTP auf (PWA/GitHub Pages), weil der Browser dort `/favicon.ico` anfragt. Der Nachweis für Erfolgskriterium 4 muss deshalb über den HTTP-Smoke-Job laufen (D-12), nicht über einen `file://`-Lauf.
- **CONCERNS.md-Zahlen sind als Fakten unbrauchbar** (92 Module, 26 E2E-Fails, 504 window-Imports, „E2E suite absent from CI") — jede Zahl vor Verwendung gegen den Live-Stand prüfen. Das ist der Grund für D-15.

</specifics>

<deferred>
## Deferred Ideas

- **Verschärfung von Pass 2 (`deduplicate_window_assignments`, `build.py:293-371`)** — entfernt heute still 523 window-Zuweisungen. Dieselbe „still statt laut"-Klasse wie Pass 3, aber ohne bekannten Schadensfall und mit echtem Regressionsrisiko für das Bundle. Nicht in Phase 11; Kandidat, falls Pass 2 je einen Fehlgriff produziert.
- **Flächenumbau der ~504 funktions-lokalen `const X = window.X`** — explizit Out of Scope laut `.planning/REQUIREMENTS.md:47`. Bleibt es.
- **Aktive Fixes der CONCERNS-Restposten** (`_version: '2.11'`-Export-Stempel, ungeschütztes `setInterval` in `systems/backups.js:318`, Undo-Snapshot-Performance, oversized modules, Tab-Registry-String-Referenzen, `no-undef` als Error statt Warning, die drei `execCommand`-Stellen außerhalb des Editors) — werden per D-16 als benannte Requirements in den Backlog übernommen, nicht in Phase 11 gefixt.
- **CSP-Meta-Tag und `class`-Präfix-Whitelist in `sanitizeHTML`** — bereits in Phase 10 (D-08) als bewusst akzeptierte Risiken entschieden und in `SECURITY.md` dokumentiert. In der Triage als „akzeptiert", nicht als „offen" zu führen.

</deferred>

---

*Phase: 11-Architektur- & Build-Hygiene*
*Context gathered: 2026-07-25*
