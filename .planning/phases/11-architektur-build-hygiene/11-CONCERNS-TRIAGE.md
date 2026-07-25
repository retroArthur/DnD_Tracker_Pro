# CONCERNS.md Triage — Phase 11 (D-13/D-15/D-16)

**Datum:** 2026-07-26
**Bezug:** `.planning/phases/11-architektur-build-hygiene/11-CONTEXT.md` §D-13 (erst triagieren, dann `/gsd-map-codebase` regenerieren), §D-15 (jede Disposition braucht einen Beleg gegen den Live-Code, nicht gegen die Beschreibung in `CONCERNS.md`), §D-16 (Phase 11 fixt keine Restposten aktiv — Ausnahme nur fuer ohnehin durch Plaene 11-01..11-05 Angefasstes).

**Gezaehlte Gesamtzahl diskreter Eintraege in `.planning/codebase/CONCERNS.md`:** 46 (deckt sich mit der Recherche-Erwartung aus `11-06-PLAN.md`). Zaehlmethode: jede fett gesetzte Unterueberschrift (`**...**:`) innerhalb der neun `##`-Abschnitte zaehlt als ein diskreter Eintrag; maschinell nachvollzogen (`grep`-Zaehlung je Abschnitt: Tech Debt 13, Known Bugs 5, Security Considerations 4, Performance Bottlenecks 4, Fragile Areas 6, Scaling Limits 3, Dependencies at Risk 3, Missing Critical Features 3, Test Coverage Gaps 5 = 46). Keine Abweichung zur Recherche-Erwartung.

## Legende (vier zulaessige Dispositionswerte)

- **erledigt** — der beschriebene Zustand existiert im Live-Code nicht mehr.
- **obsolet** — die Beschreibung traf nie zu oder der Gegenstand existiert nicht mehr.
- **akzeptiert** — bewusst getragenes Risiko mit dokumentierter Entscheidung.
- **uebernommen** — als benanntes Requirement in den Backlog verschoben (D-16), mit `DEBT-`-ID (vergeben in `.planning/REQUIREMENTS.md` §v2).

Ein fuenfter Wert „offen" ist NICHT zulaessig — jeder Eintrag erhaelt einen der vier Werte oben. `akzeptiert` ist die in Phase 10 (D-08) etablierte Variante von „obsolet, weil bewusst getragen".

Jeder Beleg zitiert Datei:Zeile, eine Phasen-/Plan-Referenz oder einen Commit-Hash gegen den **heutigen** Code-/Test-/Config-Stand — nicht gegen die Beschreibung in `CONCERNS.md`. Jede in `CONCERNS.md` genannte Zahl (Modulanzahl, Testzaehlung, Fundstellen-Zeile) wurde vor Verwendung gegen den Ist-Stand geprueft.

---

## Tech Debt (13 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 1 | Dual-maintained module load order (loader.js + build.py) | Tech Debt | erledigt | `build.py` enthaelt keine `MODULES`-Liste mehr (`grep -c "^MODULES" build.py` = 0); `load_module_list()` parst `loader.js`s `MODULES`-Array zur Build-Zeit (Plan 11-01, Commits bc9e315/cd3d3d6, 11-01-SUMMARY.md) |
| 2 | build.py Pass-3 duplicate-function removal leaves orphaned bodies | Tech Debt | erledigt | `remove_duplicate_functions()` vollstaendig entfernt (`grep -c remove_duplicate_functions build.py` = 0); Quell-Pre-Check `check_duplicate_functions()` bricht bereits vor dem Buendeln ab (Plan 11-03, Commit b1e5e1e, 11-03-SUMMARY.md) |
| 3 | Production debug-flag flip relies on exact string match | Tech Debt | erledigt | `build.py:428-436` bricht mit `sys.exit(1)` ab, falls `"DEBUG_MODE: true"` nach dem Replace noch im Bundle steht (Kommentar „STAB-07"); dieser Schutz existiert bereits vor Phase 11 (Stabilisierungsphase) |
| 4 | Abandoned TypeScript migration leftovers | Tech Debt | uebernommen (DEBT-01) | `main.js`/`tsconfig.json.backup`/`MIGRATION_REPORT.md` existieren nicht mehr (`ls` je „No such file", Phase 1); `package.json:42` traegt bereits `"license": "MIT"`. Verbleibend: `tsconfig.json:11,21` (`checkJs: false`, `strict: false`) siehe DEBT-01. 499 funktions-lokale `const X = window.X`-Imports bestaetigt (`grep`-Zaehlung), aber ein Flaechenumbau ist laut `.planning/REQUIREMENTS.md:47` (§Out of Scope) explizit ausgeschlossen, kein Backlog-Posten |
| 5 | Removed Mindmap/Network feature residue | Tech Debt | erledigt | `systems/campaign-manager/campaign-manager.js` seedet `mindmap` nicht mehr (kein Treffer bei gezieltem `grep`); `types/globals.d.ts`/`types/entities.d.ts` ohne `mindmap`-Referenz mehr; `assets/styles-purged.css` existiert nicht mehr (`ls` „No such file"). `systems/backups.js:232` und `systems/spellslots/import-export.js:446-530` behalten `mindmap`-Lesecode bewusst fuer Alt-Export-Kompatibilitaet (kein Residuum, sondern dokumentierter Kompat-Pfad, Kommentar „danach immer entfernen (Feature ist abgeschafft)"); verbleibende Doku-Nachfuehrung siehe DEBT-02 |
| 6 | CLAUDE.md significantly stale (multiple claims contradict code) | Tech Debt | uebernommen (DEBT-02) | Divergenz bestaetigt: 0 Inline-Handler statt „~146" (641 `data-action`-Attribute), `rich-text.js` bereits 21→0 `execCommand` migriert, Mindmap-Feature entfernt. Der Nachzug ist laut `11-CONTEXT.md` §D-08 explizit Gegenstand von Plan 11-07 dieser Phase — nicht dieser Triage (Anweisung: nicht selbst editieren, auf 11-07 verweisen) |
| 7 | RESOLVED (Phase 9): `document.execCommand` fully removed from the rich-text editor module | Tech Debt | erledigt | `grep -c "document.execCommand" ui/editors/rich-text.js` = 0 (verifiziert); Eintrag dokumentiert seine eigene Erledigung bereits korrekt in `CONCERNS.md` selbst, gegengeprueft via `09-BASELINE.md` |
| 8 | Three `document.execCommand` call sites remain outside the editor module | Tech Debt | uebernommen (DEBT-03) | Bestaetigt weiterhin vorhanden: `systems/entity-links.js:87`, `features/wiki/wiki.js:831`, `ui/actions/system-actions.js:82` (Zeilennummern leicht verschoben ggue. `CONCERNS.md`s 108/819/79, Sachverhalt identisch — genau 3 `document.execCommand`-Aufrufe) |
| 9 | Stale/broken developer tooling | Tech Debt | erledigt | `validate.py:11` nutzt bereits `SOURCE_DIR = str(Path(__file__).parent)` (script-relativ, kein `/mnt/...`-Pfad mehr); `tools/analyze-render.py` und `tools/migrate-event-handlers.py` existieren nicht mehr (`ls` je „No such file"); alle `package.json`-Scripts (`build`, `build:dev`, `build:prod`, `build:minify`, `dev`, `serve`, `validate`) nutzen durchgaengig `python`, kein `python3` mehr |
| 10 | License metadata mismatch | Tech Debt | erledigt | `package.json:42` traegt bereits `"license": "MIT"`, deckungsgleich mit `LICENSE` und `README.md` |
| 11 | Hardcoded export data version `'2.11'` | Tech Debt | erledigt | `systems/spellslots/quick-roll.js:184` stempelt Exporte bereits mit `exp._version = APP_CONFIG.VERSION` (Kommentar „D-05/STAB-06 Dynamische Versionsnummer statt hartkodiertem Stempel '2.11'"); Zeile 111 normalisiert alte `'2.11'`-Altstempel beim Import zusaetzlich auf `'2.0.0'`, bevor `migrateData()` laeuft |
| 12 | Oversized modules | Tech Debt | uebernommen (DEBT-04) | Aktuelle Zeilenzahlen (`wc -l`): `features/dmscreen/dmscreen-render.js` 1576, `ui/editors/rich-text.js` 1932, `features/initiative.js` 1655, `features/wiki/wiki.js` 1217, `features/encounter-calculator.js` 1292, `features/shops/shops-core.js` 1073 — alle weiterhin >1000 Zeilen (teils gewachsen ggue. den in `CONCERNS.md` genannten Zahlen, z. B. `rich-text.js` durch die execCommand-Migration in Phase 9) |
| 13 | Service Worker cache list duplication and stale entry | Tech Debt | erledigt | `sw.js:4-20` nutzt heute `CACHE_VERSION`/`CORE_ASSETS`/`OPTIONAL_ASSETS`, kein `assets/body.html` mehr in der Asset-Liste; `build.py:438-470` bumpt `CACHE_VERSION` automatisch bei jedem Production-Build (Kommentar „T-02-04"). Das verbliebene `SW_CACHE_NAME` in `core/config.js:24` ist unbenutzter Restwert (kein `grep`-Treffer außerhalb der eigenen Deklaration, also kein Sync-Zwang mehr) — zu trivial fuer einen eigenen Backlog-Posten |

## Known Bugs (5 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 14 | Stale-data shadowing for campaigns over 5MB (data-loss path) | Known Bugs | erledigt | `systems/spellslots/quick-roll.js:37-46`: `resolveStorageConflict()` + Stale-Shadow-Detection (Kommentar „D-01/D-07") loesen den IDB-Vorrang bei abweichenden LS/IDB-Staenden auf; behoben in Phase 1, Gap-Plan 01-08 (STATE.md-Entscheidung „resolveStorageConflict statt showStorageConflictDialog … IDB-Vorrang als deterministischer Fallback erfuellt SC2/STAB-05 code-seitig") |
| 15 | Undo may not restore deleted entities (possible regression) | Known Bugs | erledigt | `tests/e2e/crud/{npcs,locations}.spec.js` „Loeschen kann rueckgaengig gemacht werden" sind Teil der aktuellen gruenen Playwright-Baseline (319 passed / 2 skipped nach Plan 11-05); `.planning/REQUIREMENTS.md` fuehrt TEST-01 als „Complete" (Phase 8) |
| 16 | Duplicate `#random-tables-list` DOM instances at runtime | Known Bugs | erledigt | `tests/e2e/tab-navigation.spec.js` (acht Vorkommen von `#random-tables-list`) ist Teil derselben gruenen Baseline, kein separater Restbefund mehr (Phase 8, TEST-01) |
| 17 | 26 pre-existing Playwright E2E failures (140 total, 114 pass) | Known Bugs | erledigt | Zahlen veraltet: aktuelle Baseline 621/621 Jest, 319 passed / 2 skipped Playwright (Plan 11-05-SUMMARY.md, nach TEST-01/TEST-02 in Phase 8); die einzige bekannte verbleibende Ausnahme ist die separat dokumentierte Toast-Race (siehe DEBT-15 unten), nicht eine der urspruenglichen 26 |
| 18 | Undo/redo stack asymmetry on parse failure | Known Bugs | uebernommen (DEBT-05) | `systems/undo.js` `undo()`: `redoStack.push(...)` (Zeile 27) und `const last = undoStack.pop()` (Zeile 35) laufen vor der `safeJSONParse`-Pruefung (Zeile 37) — Verhalten identisch zur `CONCERNS.md`-Beschreibung, kein Fix in Phase 8-10 gefunden |

## Security Considerations (4 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 19 | XSS via `innerHTML` is the dominant risk class (historically recurring) | Security Considerations | akzeptiert | `SECURITY.md:2` traegt `threats_open: 0`; Phase 10 (SEC-01/SEC-02) hat die Angriffsflaechen Import/Export/Storage/Rich-Text durchgehend auditiert (`.planning/phases/10-security-h-rtung/`); `esc()`/`sanitizeHTML()` sind in den genannten Modulen unveraendert seit dem Audit im Einsatz. Ein zusaetzlicher ESLint-/Grep-Check waere eine Haerte-Option ohne konkreten offenen Befund, kein Restposten |
| 20 | Security-critical sanitizers are unit-tested only via drifted copies | Security Considerations | erledigt | `tests/unit/sanitizer-parity.test.js` existiert (Phase 10, Plan 10-03/10-05): Paritaetstest fuer `esc()`/`sanitizeHTML()` zwischen `utils/basic.js` und `utils/testable-utils.js` mit striktem Byte-Vergleich; die einzige bekannte verbleibende Drift (`esc(0)`) ist in einem eigenen, dokumentierten Testfall (`sanitizer-parity.test.js:152`) explizit als „bekannte Drift, kein Regressionsfehler" festgehalten statt unbemerkt zu bleiben |
| 21 | `sanitizeHTML` allows arbitrary `class` and broad inline styles | Security Considerations | akzeptiert | Phase 10 D-08 (`.planning/phases/10-security-h-rtung/10-CONTEXT.md`): bewusst akzeptiertes Risiko, dokumentiert in `SECURITY.md`; `utils/basic.js:198-199` erlaubt `class` unveraendert seit der Entscheidung |
| 22 | No Content-Security-Policy | Security Considerations | akzeptiert | Phase 10 D-08: bewusst akzeptiertes Risiko (Single-User-Offline-App, `'unsafe-inline'` architekturbedingt noetig); `grep -c "Content-Security-Policy" index.html build.py` = 0, unveraendert seit der Entscheidung, dokumentiert in `SECURITY.md` |

## Performance Bottlenecks (4 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 23 | Full-state JSON snapshot on every undoable operation | Performance Bottlenecks | uebernommen (DEBT-06) | `systems/undo.js:9-20`: `pushUndo()` fuehrt weiterhin `JSON.stringify(window.D)` vor jeder destruktiven Operation aus, `UNDO_LIMIT` unveraendert bei 30 (`core/config.js:28`) — unveraendert seit der `CONCERNS.md`-Erhebung |
| 24 | Every save serializes the full campaign (plus extra IDB writes >2MB) | Performance Bottlenecks | uebernommen (DEBT-07) | `systems/spellslots/persistence.js` fuehrt weiterhin `JSON.stringify(D)` + Blob-Groessenmessung bei jedem `save()`/`saveImmediate()` aus (Zeilen ~34-70, ~192-220) — unveraendert |
| 25 | Debug validation always on outside `--production` builds | Performance Bottlenecks | akzeptiert | `core/config.js:10-11` weiterhin `DEBUG_MODE: true`/`DEBUG_VALIDATE_ON_SAVE: true` per Design fuer den Dev-Modus; `build.py:428-436` verifiziert den Production-Flip und bricht mit `sys.exit(1)` ab, falls er fehlschlaegt (siehe Tech-Debt-Eintrag 3) — Verhalten ist beabsichtigt, kein Restposten |
| 26 | Sequential script loading in dev mode (92 modules) | Performance Bottlenecks | akzeptiert | `loader.js:169-248` laedt weiterhin sequenziell; betrifft nur den Dev-Modus, nicht den primaeren `file://`-Einzeldatei-Nutzungsmodus (`PROJECT.md`-Constraint); `CONCERNS.md` selbst qualifiziert dies als „Dev-only concern", kein gemeldetes Problem. Modulzahl korrigiert: heute ~123 Module, nicht 92 (`11-01-SUMMARY.md`: „123 Module Banner" im Bundle) |

---

## Ergaenzungen aus STATE.md (Phase-10-Zusatzbefunde, nicht Teil der 46 CONCERNS-Eintraege)

Die folgenden vier Posten stammen NICHT aus `.planning/codebase/CONCERNS.md` (Stand 2026-06-11, vor Phase 10), sondern aus `.planning/STATE.md` §„Open TODOs" (bekannte, noch offene Zusatzbefunde aus Phase 10). Sie zaehlen nicht zu den oben gezaehlten 46 Eintraegen, werden aber gemaess `11-06-PLAN.md` Task 3 ebenfalls mit einer `DEBT-`-ID in den Backlog uebernommen, da sie echte, gegen den Live-Code verifizierte offene Zustaende beschreiben.

| # | Eintrag (Kurztitel) | Ursprung | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| S1 | `hasHtmlTags`-Waechter in `ui/editors/markdown-converter.js` nie verdrahtet | STATE.md „Open TODOs" (Phase 10 IN-01) | uebernommen (DEBT-12) | `ui/editors/markdown-converter.js:264`: `const hasHtmlTags = /<[^>]+>/.test(html);` wird berechnet, aber in der Funktion `renderMarkdownInContent()` (Zeilen 258-320+) nie in einer Bedingung referenziert — die Markdown-Konvertierung laeuft unbedingt, auch ueber bereits-HTML-Inhalt |
| S2 | Doppeltes `data-id`-Attribut in `features/wiki/wiki.js` | STATE.md „Open TODOs" (Phase 10 WR-02) | uebernommen (DEBT-13) | `features/wiki/wiki.js:391-392`: zwei identische `data-id="${entry.id}"`-Attribute auf demselben Element bestaetigt |
| S3 | Un-escapte Regex-Capture in `parseWikiLinks()` | STATE.md „Open TODOs" (Phase 10 IN-02) | uebernommen (DEBT-14) | `features/wiki/wiki.js:653`: `linkText` (Regex-Capture aus `[[...]]`) wird roh als Inner-HTML des `<span>` verwendet, waehrend `escapedText` nur fuer das `data-value`-Attribut escaped wird — aktuell nicht ausnutzbar (kein bekannter Angriffsvektor ueber Wiki-Titel), aber strukturell inkonsistent |
| S4 | Latente Toast-Race in `tests/e2e/crud/locations.spec.js` und `encounters.spec.js` | STATE.md „Open TODOs" (fehlender Seed-Nachzug aus Plan 08-02) | uebernommen (DEBT-15) | `tests/e2e/crud/locations.spec.js:17-18`: `beforeEach` ruft nur `loadApp(page)` ohne den vollen `D`-Seed, den `quests`/`npcs`/`party` seit Plan 08-02 tragen — Ursache (Boot-Zeit-`save()` aus `initRandomTables()`/`validateDataIntegrity()` ueberschreibt den geteilten `#toast`-Knoten) bleibt unbehoben fuer diese zwei Dateien |

---

## Fragile Areas (6 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 27 | Global namespace + regex-based build deduplication | Fragile Areas | erledigt | Der beschriebene Gefahrenpfad (Pass 3 / `remove_duplicate_functions`, inkl. Orphan-Bug) existiert nicht mehr (Plan 11-03); der Quell-Pre-Check deckt seither `function|const|let|class` ab (`check_duplicate_functions()`, Plan 11-03 D-06); drei unabhaengige Schutzschichten bestehen: Quell-Pre-Check, Post-Build-Validierung, CI-Smoke-Test gegen das ausgefuehrte Bundle. Die 499 verbleibenden funktions-lokalen `const X = window.X`-Imports sind laut `.planning/REQUIREMENTS.md:47` (§Out of Scope) explizit ausgeschlossen, kein Restposten dieser Phase |
| 28 | `saveImmediate()` can be silently disabled by an optional checkbox | Fragile Areas | uebernommen (DEBT-08) | `systems/spellslots/persistence.js:38-39`: `if (autosaveToggle && !autosaveToggle.checked) return;` gilt weiterhin ungefiltert auch fuer `saveImmediate()`; `core/init.js:44-48` dokumentiert per Kommentar nur die aktuelle Abwesenheit des Elements im UI, ohne Ausnahme fuer kritische Saves fuer den Fall der Rueckkehr |
| 29 | Lint and typecheck gates are too soft to catch global-scope errors | Fragile Areas | uebernommen (DEBT-01) | `eslint.config.js:102` weiterhin `'no-undef': 'warn'`; `package.json:24` `lint:all` mit `--max-warnings 100`; `tsconfig.json:11,21` weiterhin `checkJs: false`/`strict: false`. Teilkorrektur zur `CONCERNS.md`-Beschreibung: die Aussage „CI faehrt nicht Playwright" ist veraltet — der `e2e`-Job ist seit Phase 8 (D-03) ein blockierendes CI-Gate in `.github/workflows/ci.yml` |
| 30 | Tab registry render functions referenced by string name | Fragile Areas | uebernommen (DEBT-09) | `systems/tab-registry.js` referenziert Renderfunktionen weiterhin per String (`renders: ['renderDashboard'], ...`); strukturelle Fragilitaet unveraendert. Teilkorrektur: die zugehoerige Suite `tests/e2e/tab-navigation.spec.js` ist Teil der aktuellen gruenen 319-Test-Baseline, nicht mehr „failing" wie in `CONCERNS.md` beschrieben (Phase 8, TEST-01) |
| 31 | Unguarded interval in performance monitoring | Fragile Areas | uebernommen (DEBT-10) | `systems/backups.js:325`: `initPerformanceMonitoring()` startet weiterhin ein ungeschuetztes `setInterval` ohne Handle-Guard, im Unterschied zu `startAutoBackup()` (Zeile 308, mit Guard) — unveraendert |
| 32 | Loader continues after module load failures | Fragile Areas | akzeptiert | `loader.js:224-227` faehrt bewusst nach einem fehlgeschlagenen Modul-Load fort; `CONCERNS.md` selbst qualifiziert dies als „acceptable as a debugging aid" — kein gemeldeter Schaden, bewusste Design-Entscheidung fuer Dev-Diagnose |

## Scaling Limits (3 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 33 | localStorage single-key campaign storage | Scaling Limits | akzeptiert | Die zugehoerige Known-Bug-Ursache (Stale-Shadowing) ist per Phase-1-Gap-Plan 01-08 behoben (`resolveStorageConflict()`, siehe Known-Bugs-Eintrag 14 oben); die Architektur-Grenze selbst (~5MB LS, danach IDB-only) ist eine bewusste, in `core/config.js:15` verankerte Design-Entscheidung, kein offener Fehler |
| 34 | Undo history memory | Scaling Limits | uebernommen (DEBT-06) | Identischer Code-Pfad wie Performance-Bottleneck-Eintrag 23 oben (`systems/undo.js:9-20`, `UNDO_LIMIT = 30`) — dieselbe DEBT-ID |
| 35 | Render performance with large lists | Scaling Limits | akzeptiert | Virtual Scroll (`VIRTUAL_SCROLL_THRESHOLD`, `core/config.js:46`) und EntityLookup-Caching bereits vorhanden; `CONCERNS.md` selbst nennt „Untested beyond ~500 spells / ~20 combatants", kein gemeldetes Problem — „profile before optimizing further" ist keine aktuelle Handlungsaufforderung |

## Dependencies at Risk (3 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 36 | `document.execCommand` (browser API, deprecated) — 3 remaining call sites outside the editor module | Dependencies at Risk | uebernommen (DEBT-03) | Identisch zu Tech-Debt-Eintrag 8 oben — dieselbe DEBT-ID (`systems/entity-links.js:87`, `features/wiki/wiki.js:831`, `ui/actions/system-actions.js:82`) |
| 37 | Python build toolchain invoked as `python3` from npm | Dependencies at Risk | erledigt | Alle `package.json`-Scripts nutzen durchgaengig `python`, kein `python3` mehr (siehe Tech-Debt-Eintrag 9); `validate.py:11` bereits script-relativ |
| 38 | Zero runtime dependencies (positive) | Dependencies at Risk | obsolet | Der Eintrag beschreibt explizit „Risk: None" — keine tatsaechliche Concern, sondern eine positive Feststellung ohne Handlungsbedarf |

## Missing Critical Features (3 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 39 | E2E suite absent from CI | Missing Critical Features | erledigt | `.github/workflows/ci.yml` fuehrt den `e2e`-Job seit Phase 8 (D-03) als blockierendes Gate aus (`build` benoetigt `needs: [lint-and-typecheck, test, e2e]`), bestaetigt in `11-CONTEXT.md` §Ausgangslage |
| 40 | No enforcement of documented build-safety invariants | Missing Critical Features | erledigt | `check_duplicate_functions()` (Plan 11-03, D-06) prueft `function|const|let|class` bereits vor dem Buendeln und bricht hart ab; `tests/build/` ist seit Plan 11-04 (D-03) ein echtes CI-Gate (`pytest tests/build/` im `test`-Job von `.github/workflows/ci.yml`) |
| 41 | No automated dist smoke test | Missing Critical Features | erledigt | Der `smoke-test`-Job (`.github/workflows/ci.yml`) fuehrt seit Phase 2 das Production-Bundle im Browser aus; erweitert um dedizierte Konsolen-/404-Assertion in Plan 11-05 (`tests/e2e/smoke.spec.js`, Test „Keine Favicon-404 und keine Meta-Tag-Deprecation") |

## Test Coverage Gaps (5 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 42 | Unit tests exercise copies, not production code | Test Coverage Gaps | erledigt | Der sicherheitskritische Kern des Risikos (`esc()`/`sanitizeHTML()`) ist seit Phase 10 durch `tests/unit/sanitizer-parity.test.js` (strikter Byte-Vergleich beider Kopien) geschlossen; verbleibende, nicht-sicherheitskritische Kopien (`debounce`, `nextId`, `parseDiceNotation` etc. in `utils/testable-utils.js`) sind bewusst niedrigeres Risiko, kein eigener Backlog-Posten |
| 43 | Coverage thresholds apply to one file only | Test Coverage Gaps | uebernommen (DEBT-01) | `jest.config.cjs:65-72` weiterhin nur fuer `utils/testable-utils.js` — dieselbe DEBT-ID wie die weichen Lint-/Typecheck-Gates (verwandte Qualitaets-Gate-Schwaeche) |
| 44 | Persistence edge cases untested | Test Coverage Gaps | uebernommen (DEBT-11) | Kein dedizierter Test fuer >5MB-IDB-only-Save+Reload, localStorage-Quota-Fallback oder Export/Import-Versions-Rundlauf gefunden (`tests/unit/` durchsucht) — unveraendert |
| 45 | Initiative/combat flow has zero working E2E coverage | Test Coverage Gaps | erledigt | `tests/e2e/features/initiative.spec.js:16-20` nutzt bereits den aktuellen `addCombatant()`-Helper (`[data-action="call"][data-value="addCombatant"]`) statt des veralteten `#combatant-name`-Selektors; Teil der gruenen 319-Test-Baseline |
| 46 | Build system orphaned-body case untested | Test Coverage Gaps | erledigt | `test_no_dedup_function_marker_in_bundle` (Plan 11-03) und `test_source_duplicate_aborts_build_without_writing_output` (Plan 11-03 D-07) decken genau diesen Fall ab; der Gegenstand (Pass 3) existiert zudem nicht mehr |

---

## Zusammenfassung

**Vollstaendigkeit:** 46 Tabellenzeilen (Eintraege 1-46) entsprechen exakt der im Kopf genannten Gesamtzahl diskreter `CONCERNS.md`-Eintraege (46). Zusaetzlich 4 Ergaenzungszeilen (S1-S4) aus `STATE.md`, außerhalb der 46er-Zaehlung.

**Disposition-Verteilung (der 46 CONCERNS-Eintraege):**

- erledigt: 22
- obsolet: 1
- akzeptiert: 8
- uebernommen: 15
- Summe: 46

**Vergebene `DEBT-`-IDs** (15 insgesamt — 11 aus den 46 CONCERNS-Eintraegen, 4 aus den STATE.md-Ergaenzungen):

- DEBT-01 — Schwache Lint-/Typecheck-/Coverage-Gates (tsconfig strict/checkJs, eslint no-undef:warn, jest coverageThreshold nur 1 Datei) — Herkunft: Eintraege 4, 29, 43
- DEBT-02 — CLAUDE.md / docs/bugfixes.md Build-System-Dokumentation nachziehen (wird in Plan 11-07 dieser Phase behoben) — Herkunft: Eintrag 6
- DEBT-03 — 3 verbleibende `document.execCommand`-Aufrufe außerhalb des Editor-Moduls — Herkunft: Eintraege 8, 36
- DEBT-04 — Oversized modules (6 Dateien >1000 Zeilen) — Herkunft: Eintrag 12
- DEBT-05 — Undo/redo-Stack-Asymmetrie bei Parse-Fehler — Herkunft: Eintrag 18
- DEBT-06 — Undo-Snapshot-Performance (voller `JSON.stringify(D)` je destruktiver Aktion) — Herkunft: Eintraege 23, 34
- DEBT-07 — Jeder Save serialisiert die volle Kampagne — Herkunft: Eintrag 24
- DEBT-08 — `saveImmediate()` durch abwesendes autosave-toggle-Element ohne Ausnahme fuer kritische Saves gefaehrdet — Herkunft: Eintrag 28
- DEBT-09 — Tab-Registry-Renderfunktionen per String-Name referenziert — Herkunft: Eintrag 30
- DEBT-10 — Ungeschuetztes `setInterval` in `initPerformanceMonitoring()` — Herkunft: Eintrag 31
- DEBT-11 — Persistence-Edge-Cases ungetestet (>5MB-IDB-Reload, Quota-Fallback, Export/Import-Rundlauf) — Herkunft: Eintrag 44
- DEBT-12 — `hasHtmlTags`-Waechter in `markdown-converter.js` nie verdrahtet (Anzeigebug bei Unterstrichen in URLs) — Herkunft: Eintrag S1
- DEBT-13 — Doppeltes `data-id`-Attribut in `features/wiki/wiki.js` — Herkunft: Eintrag S2
- DEBT-14 — Un-escapte Regex-Capture in `parseWikiLinks()` — Herkunft: Eintrag S3
- DEBT-15 — Latente Toast-Race in `locations.spec.js`/`encounters.spec.js` (fehlender Seed-Nachzug aus Plan 08-02) — Herkunft: Eintrag S4

**Kein Restposten wurde in dieser Phase aktiv gefixt** (D-16) — alle 15 `DEBT-`-IDs werden in `.planning/REQUIREMENTS.md` §v2 als benannte Requirements gefuehrt (Task 3 dieses Plans), mit Rueckverweis auf diese Triage. DEBT-02 ist die einzige Ausnahme, die planmaeßig innerhalb dieser Phase (Plan 11-07) statt in einem spaeteren Milestone behoben wird — dennoch als Requirement gefuehrt, bis 11-07 abgeschlossen ist.
