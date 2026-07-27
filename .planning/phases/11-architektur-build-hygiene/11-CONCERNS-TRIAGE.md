# CONCERNS.md Triage — Phase 11 (D-13/D-15/D-16)

**Datum:** 2026-07-26
**Bezug:** `.planning/phases/11-architektur-build-hygiene/11-CONTEXT.md` §D-13 (erst triagieren, dann `/gsd-map-codebase` regenerieren), §D-15 (jede Disposition braucht einen Beleg gegen den Live-Code, nicht gegen die Beschreibung in `CONCERNS.md`), §D-16 (Phase 11 fixt keine Restposten aktiv — Ausnahme nur fuer ohnehin durch Plaene 11-01..11-05 Angefasstes).

**Gezaehlte Gesamtzahl diskreter Eintraege in `.planning/codebase/CONCERNS.md`:** 46 (deckt sich mit der Recherche-Erwartung aus `11-06-PLAN.md`). Zaehlmethode: jede fett gesetzte Unterueberschrift (`**...**:`) innerhalb der neun `##`-Abschnitte zaehlt als ein diskreter Eintrag; maschinell nachvollzogen (`grep`-Zaehlung je Abschnitt: Tech Debt 13, Known Bugs 5, Security Considerations 4, Performance Bottlenecks 4, Fragile Areas 6, Scaling Limits 3, Dependencies at Risk 3, Missing Critical Features 3, Test Coverage Gaps 5 = 46). Keine Abweichung zur Recherche-Erwartung.

## Legende (vier zulaessige Dispositionswerte)

- **erledigt** — der beschriebene Zustand existiert im Live-Code nicht mehr. Ein `erledigt`-Eintrag darf einen benannten **Rest-Posten** mit `DEBT-`-ID tragen (Schreibweise in der Dispositions-Spalte: `erledigt (Rest-Posten DEBT-NN)`), wenn der Hauptgegenstand entfernt ist, ein untergeordneter Teil des beschriebenen Zustands aber nachweislich weiterlebt und nach D-16 in den Backlog verschoben wurde statt hier gefixt zu werden. Die `DEBT-`-ID steht dann in der Dispositions-Spalte, damit sie beim maschinellen Scan der Spalte auffindbar ist; die Dispositions-Verteilung zaehlt den Eintrag weiter als `erledigt`.
- **obsolet** — die Beschreibung traf nie zu oder der Gegenstand existiert nicht mehr.
- **akzeptiert** — bewusst getragenes Risiko mit dokumentierter Entscheidung.
- **uebernommen** — als benanntes Requirement in den Backlog verschoben (D-16), mit `DEBT-`-ID (vergeben in `.planning/REQUIREMENTS.md` §v2).

Ein fuenfter Wert „offen" ist NICHT zulaessig — jeder Eintrag erhaelt einen der vier Werte oben. `akzeptiert` ist die in Phase 10 (D-08) etablierte Variante von „obsolet, weil bewusst getragen".

Jeder Beleg zitiert Datei:Zeile, eine Phasen-/Plan-Referenz oder einen Commit-Hash gegen den **heutigen** Code-/Test-/Config-Stand — nicht gegen die Beschreibung in `CONCERNS.md`. Jede in `CONCERNS.md` genannte Zahl (Modulanzahl, Testzaehlung, Fundstellen-Zeile) wurde vor Verwendung gegen den Ist-Stand geprueft.

### Nachtrag: Beleg-Korrekturen nach dem Triage-Commit (2026-07-26)

Ein Audit fand drei Zeilen, deren Beleg dem eigenen D-15-Anspruch nicht genuegte. **Die Dispositionswerte sind unveraendert geblieben** — korrigiert wurde ausschliesslich der zitierte Nachweis. Diese drei Zeilen wurden also NACH dem urspruenglichen Triage-Commit angefasst; Plan 11-07 Task 3 (Cross-Check der regenerierten `CONCERNS.md` gegen dieses Dokument) muss die korrigierte Fassung als Referenz nehmen:

- **Zeile 5** (Mindmap-Residuum, `erledigt (Rest-Posten DEBT-16)`) — `systems/backups.js:232` war als Lese-Kompat-Pfad beschrieben; es ist ein Schreib-seitiger Schema-Seed. Zusaetzlich wurden alle **vier** in `CONCERNS.md:47` genannten Stale-Referenzen geprueft (der erste Nachtrag sprach faelschlich von zwei): zwei sind erledigt (`tests/setup.js` ohne `mindmap`-Treffer, `tools/split-shops.py` in `0627e8a` geloescht), von den zwei verbleibenden ist `tools/debug.js:917` live und `tests/unit/stability.test.js:25` inert. Neuer Rest-Posten DEBT-16 — die ID steht jetzt in der Dispositions-Spalte, damit ein Spalten-Scan sie findet (zweite Korrekturrunde 2026-07-26, nach Audit-Restdefekten).
- **Zeile 18** (Undo/Redo-Asymmetrie, `uebernommen`/DEBT-05) — alle drei Zeilennummern in `systems/undo.js` waren um 4 versetzt (27/35/37 → 31/39/41). Sachverhalt war und bleibt korrekt.
- **Zeile 32** (Loader faehrt nach Ladefehler fort, `akzeptiert`) — `loader.js:224-227` war unveraendert aus `CONCERNS.md:253` uebernommen statt gegen den Live-Code geprueft und zeigt auf HTML-Template-Pfade; korrekt ist der `catch`-Block `loader.js:265-268`.

---

## Tech Debt (13 Eintraege)

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| 1 | Dual-maintained module load order (loader.js + build.py) | Tech Debt | erledigt | `build.py` enthaelt keine `MODULES`-Liste mehr (`grep -c "^MODULES" build.py` = 0); `load_module_list()` parst `loader.js`s `MODULES`-Array zur Build-Zeit (Plan 11-01, Commits bc9e315/cd3d3d6, 11-01-SUMMARY.md) |
| 2 | build.py Pass-3 duplicate-function removal leaves orphaned bodies | Tech Debt | erledigt | `remove_duplicate_functions()` vollstaendig entfernt (`grep -c remove_duplicate_functions build.py` = 0); Quell-Pre-Check `check_duplicate_functions()` bricht bereits vor dem Buendeln ab (Plan 11-03, Commit b1e5e1e, 11-03-SUMMARY.md) |
| 3 | Production debug-flag flip relies on exact string match | Tech Debt | erledigt | `build.py:428-436` bricht mit `sys.exit(1)` ab, falls `"DEBUG_MODE: true"` nach dem Replace noch im Bundle steht (Kommentar „STAB-07"); dieser Schutz existiert bereits vor Phase 11 (Stabilisierungsphase) |
| 4 | Abandoned TypeScript migration leftovers | Tech Debt | uebernommen (DEBT-01) | `main.js`/`tsconfig.json.backup`/`MIGRATION_REPORT.md` existieren nicht mehr (`ls` je „No such file", Phase 1); `package.json:42` traegt bereits `"license": "MIT"`. Verbleibend: `tsconfig.json:11,21` (`checkJs: false`, `strict: false`) siehe DEBT-01. 499 funktions-lokale `const X = window.X`-Imports bestaetigt (`grep`-Zaehlung), aber ein Flaechenumbau ist laut `.planning/REQUIREMENTS.md:47` (§Out of Scope) explizit ausgeschlossen, kein Backlog-Posten |
| 5 | Removed Mindmap/Network feature residue | Tech Debt | erledigt (Rest-Posten DEBT-16) | `systems/campaign-manager/campaign-manager.js` seedet `mindmap` nicht mehr (kein Treffer bei gezieltem `grep`); `types/globals.d.ts`/`types/entities.d.ts` ohne `mindmap`-Referenz mehr; `assets/styles-purged.css` existiert nicht mehr (`ls` „No such file"). `systems/spellslots/import-export.js:446-530` behaelt `mindmap`-Lesecode bewusst fuer Alt-Export-Kompatibilitaet (dokumentierter Kompat-Pfad: Hinweis-Dialog + JSON-Backup, dann `delete imp.mindmap; // danach immer entfernen (Feature ist abgeschafft)` in Zeile 530). **Beleg-Korrektur 2026-07-26:** `systems/backups.js:232` ist KEIN Lese-Kompat-Pfad, sondern ein Schreib-seitiger Schema-Seed im `defaultD`-Literal (Zeilen 218-235) — `mindmap: { nodes: [], edges: [] }`, mit `edges` statt des ueberall sonst verwendeten `connections` (`import-export.js:452,475,526`, `version-migration.js:57`, `tools/debug.js:917`). Ueber `sanitizeBackupData(parsed, defaultD)` (Aufruf `backups.js:238`, Injektions-Zweig `backups.js:161-163`) wird der totgelegte `edges`-Key bei JEDEM Restore neu gesetzt, auch wenn das Backup gar keinen `mindmap`-Key enthaelt. `CONCERNS.md:47` nennt **vier** Stale-Referenzen (`tests/setup.js`, `tests/unit/stability.test.js`, `tools/debug.js`, `tools/split-shops.py`), nicht zwei; zwei davon sind bereits erledigt und entfallen: `tests/setup.js` traegt keine `mindmap`-Referenz mehr (`grep -in mindmap tests/setup.js` = kein Treffer) und `tools/split-shops.py` existiert nicht mehr (in `0627e8a`, Plan 01-05, geloescht). Von den zwei verbleibenden ist `tools/debug.js:917` live: Schreib-Seed `mindmap: { nodes: [], connections: [] }` in `completeReset()` (ab Zeile 849), und `tools/debug.js` steht in `loader.js:162` (also im Bundle), `completeReset` haengt an einem echten UI-Button (`assets/templates/modals-tools.html:187`, Export `tools/debug.js:1118`) — kein blosses Dev-Skript. `tests/unit/stability.test.js:25` ist dagegen inert: reiner `global.D`-Fixture-Key im `beforeEach`, keine Assertion der Datei referenziert `mindmap` (einziger Treffer im File). Disposition bleibt `erledigt` — das Feature selbst ist entfernt; die zwei verbleibenden Schreib-Seeds werden nach D-16 nicht hier gefixt, sondern als DEBT-16 verfolgt. Verbleibende Doku-Nachfuehrung siehe DEBT-02 |
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
| 18 | Undo/redo stack asymmetry on parse failure | Known Bugs | uebernommen (DEBT-05) | `systems/undo.js` `undo()`: `redoStack.push({` (Zeile 31) und `const last = undoStack.pop();` (Zeile 39) laufen vor `const parsed = safeJSONParse(last.state);` (Zeile 41) und dessen Auswertung in `if (parsed)` (Zeile 42) — bei Parse-Fehler bleiben beide Stacks mutiert, es folgt nur `showToast('❌ Undo fehlgeschlagen', 'error')` (Zeile 57). Verhalten identisch zur `CONCERNS.md`-Beschreibung, kein Fix in Phase 8-10 gefunden. **Beleg-Korrektur 2026-07-26:** Zeilennummern waren durchgaengig um 4 versetzt (vorher 27/35/37), am Live-Code nachgezaehlt; die Sachaussage war und bleibt unveraendert korrekt |

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
| 32 | Loader continues after module load failures | Fragile Areas | akzeptiert | `loader.js:265-268`: der `catch`-Block der Modul-Ladeschleife (`for (const module of MODULES)` ab Zeile 246) protokolliert nur (`console.error`, Zeile 266) und faellt per `// Fortfahren trotz Fehler, um zu sehen, welche Module funktionieren` (Zeile 267) in die naechste Iteration; `CONCERNS.md` selbst qualifiziert dies als „acceptable as a debugging aid" — kein gemeldeter Schaden, bewusste Design-Entscheidung fuer Dev-Diagnose. **Beleg-Korrektur 2026-07-26:** das zuvor zitierte `loader.js:224-227` war byte-identisch aus `CONCERNS.md:253` uebernommen statt gegen den Live-Code geprueft und zeigt auf HTML-Template-Pfade im `TEMPLATES`-Array (Zeilen 219-232), nicht auf den Fortfahren-Pfad |

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

**Vergebene `DEBT-`-IDs** (16 insgesamt — 12 aus den 46 CONCERNS-Eintraegen, 4 aus den STATE.md-Ergaenzungen). DEBT-16 wurde erst im Beleg-Nachtrag vom 2026-07-26 vergeben und stammt aus Eintrag 5, der `erledigt` bleibt — die Dispositions-Verteilung oben aendert sich dadurch NICHT (siehe Legende: eine `DEBT-`-ID kann als benannter Rest-Posten an einem `erledigt`-Eintrag haengen). Damit die ID nicht nur im Beleg-Fliesstext steht, traegt Eintrag 5 sie in der Dispositions-Spalte als `erledigt (Rest-Posten DEBT-16)` — gleiche Schreibweise wie die `uebernommen (DEBT-NN)`-Zellen, also fuer einen Spalten-Scan (Plan 11-07 Task 3) auffindbar:

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
- DEBT-16 — Totgelegter `mindmap`-Schreib-Seed in `systems/backups.js:232` (`edges`-Variante, per `sanitizeBackupData()` bei jedem Restore neu injiziert) und `tools/debug.js:917` (`connections`-Variante in `completeReset()`) — Herkunft: Eintrag 5 (Beleg-Korrektur 2026-07-26)

**Kein Restposten wurde in dieser Phase aktiv gefixt** (D-16) — alle 16 `DEBT-`-IDs werden in `.planning/REQUIREMENTS.md` §v2 als benannte Requirements gefuehrt (Task 3 dieses Plans), mit Rueckverweis auf diese Triage. DEBT-02 ist die einzige Ausnahme, die planmaeßig innerhalb dieser Phase (Plan 11-07) statt in einem spaeteren Milestone behoben wird — dennoch als Requirement gefuehrt, bis 11-07 abgeschlossen ist.

---

## Nach dem Map-Refresh hinzugekommen (Plan 11-07 Task 3, D-13/D-14/D-15)

**Kontext:** `/gsd-map-codebase` hat am 2026-07-26 alle sieben `.planning/codebase/`-Dateien
regeneriert, unabhaengig von dieser Triage erstellt (bewusst ohne vorherige Lektuere, damit eine
falsch dispositionierte Wiederkehr auffaellt). Die neue `CONCERNS.md` ist strukturell komplett
anders aufgebaut als die alte, 2026-06-11 datierte Fassung (6 Themenbloecke statt 9, andere
Ueberschriften) und behandelt ueberwiegend Subsysteme, die zum Zeitpunkt der alten Erhebung noch
nicht existierten: Datei-Backup, Migration/Umzugs-Wizard, Soundboard, Wuerfelstatistik (IDB),
Bestiary, Command-Palette.

**Zaehlung (maschinell, diese Sitzung):** `grep -c "^### " .planning/codebase/CONCERNS.md` liefert
**24** diskrete Eintraege (6 in „Datenintegritaet & Persistenz", 3 in „Sicherheit", 4 in
„Performance & Skalierung", 5 in „Fragile Bereiche & Wartungsrisiko", 3 in „Test-Luecken", 3 in
„Build & Architektur"). Das weicht von einer im Auftragskontext dieses Laufs kursierenden Erwartung
von 26 ab — diese Zahl wurde nicht durch ein in dieser Sitzung ausgefuehrtes Kommando bestaetigt und
wird hier verworfen; **24** ist der belastbare Wert.

**Abgleich-Ergebnis:** Von den 24 neuen Eintraegen decken sich **3** inhaltlich mit bereits in
diesem Dokument dispositionierten Alt-Eintraegen — bei allen dreien stimmt die neue Beschreibung mit
der bestehenden Disposition ueberein, kein Widerspruch:

- „`class`-Attribut wird ungefiltert durchgereicht" (neue `CONCERNS.md:134-143`) = Alt-Eintrag 21
  („`sanitizeHTML` allows arbitrary `class` and broad inline styles", `akzeptiert`, Phase 10 D-08).
  Identischer Code-Anker (`utils/basic.js:198-200` vs. dort zitiert `:198-199`), identische
  Bewertung als bewusst getragenes Risiko.
- „`pushUndo()` serialisiert bei JEDER Mutation den kompletten Zustand" (neu `CONCERNS.md:159-169`)
  = Alt-Eintraege 23/34 (`uebernommen`, DEBT-06). Identischer Anker `systems/undo.js:9-20` bzw.
  `:9-20`, `UNDO_LIMIT` 30 aus `core/config.js:28` — bereits im Backlog.
- „`sanitizeHTML` existiert zweimal" (neu `CONCERNS.md:225-236`) = Alt-Eintraege 20/42 (`erledigt`,
  Phase 10, `tests/unit/sanitizer-parity.test.js`). Die neue Fassung bestaetigt selbst „Kein Defekt"
  — deckt sich mit der alten `erledigt`-Disposition, kein Widerspruch aufzuloesen.

Kein Alt-Eintrag, der hier als `erledigt` dispositioniert wurde, taucht in der neuen `CONCERNS.md`
als tatsaechlich noch offener Zustand wieder auf — insbesondere die urspruenglich befuerchtete
Ueberschneidung mit Alt-Eintrag 27 („Global namespace + regex-based build deduplication", `erledigt`,
Plan 11-03) besteht nicht: der neue Befund „`const D` überschattet das globale Datenobjekt"
(`CONCERNS.md:209-223`) grenzt sich selbst explizit ab („Ein SyntaxError im Bundle entsteht dadurch
nicht … Das eigentliche Problem ist Shadowing/Lesbarkeit, nicht der Build") und ist damit ein
eigenstaendiger, neuer Befund, kein Wiederauftauchen des alten Build-Konflikts.

**Die verbleibenden 21 Eintraege sind neu** — sie betreffen ueberwiegend Subsysteme, die im alten
(2026-06-11) `CONCERNS.md` nicht vorkamen (per Grep gegen dieses Dokument bestaetigt: keine Treffer
fuer „file-backup", „soundboard", „migration-wizard", „full-export", „isFreshInstall",
„command-palette", „dice-stats", „GainNode"). Davon werden **13** als `uebernommen` mit neuer
`DEBT-`-ID in den Backlog aufgenommen (Code- oder Testaenderung noetig); die restlichen **8** sind
`akzeptiert` (niedriges, bewusst tragbares Risiko oder zu trivial fuer einen eigenen Backlog-Posten,
gleiche Konvention wie z. B. Alt-Eintrag 13 „SW_CACHE_NAME" oder Alt-Eintrag 38). Jeder Beleg ist
gegen den heutigen Live-Code verifiziert (Datei existiert, Zeilenzitat stimmt, in dieser Sitzung per
`sed`/`grep` nachvollzogen).

| # | Eintrag (Kurztitel) | CONCERNS-Abschnitt (neu) | Disposition | Beleg (Live-Code) |
|---|---|---|---|---|
| N1 | Datei-Backup schreibt leere Kampagne sobald IDB-Modus (>5MB) greift | Datenintegritaet & Persistenz | **erledigt** (DEBT-17, Fix `71fb6ef` 2026-07-26) | `systems/spellslots/persistence.js:64-68`: `saveToIndexedDBFallback()` gefolgt von `StorageAPI.remove(key)`/`StorageAPI.remove(key + '_ts')` entfernt den localStorage-Schatten. `systems/file-backup/file-backup-manager.js:261-264`: `_doBackup()` liest ausschliesslich `StorageAPI.getJSON(campaignKey, {})` — im IDB-Modus also `{}`. `writeBackupForCampaign()` (`:100-118`) schreibt dieses `{}` sowohl in `-aktuell.json` als auch (beim ersten Save des Tages) als Tages-Snapshot und ruft danach `pruneOldSnapshots()` (`:151-173`, Limit `FILE_BACKUP_MAX_SNAPSHOTS`), das den aeltesten echten Snapshot loescht. `setBackupStatus('active')` (`:274`) meldet dabei durchgehend Erfolg. Alle Zeilenzitate in dieser Sitzung gegen den Live-Code verifiziert. Kritischste Neuentdeckung dieses Abgleichs — stiller, kumulativer Totalverlust der Datei-Backups grosser (>5MB) Kampagnen |
| N2 | Umzugs-Export (`file://`→PWA) enthaelt keine IndexedDB-Inhalte — Soundboard-Audio und Wuerfelstatistik gehen verloren | Datenintegritaet & Persistenz | uebernommen (DEBT-18) | `systems/migration/full-export.js:9-18`: `FULL_EXPORT_SCHEMA` listet nur `campaigns`/`settings`/`diceFavorites`/`dmScreenProfiles`/`campaignIndex`, keinen IDB-Store. `features/soundboard/soundboard-idb.js:64-69` und `features/dice-stats/dice-stats-idb.js:20-22` bestaetigen die IDB-Stores `audioBlobs`/`diceStats`, angelegt in `core/init.js:345-350`. Nach dem Import fehlt referenziertes Audio (`features/soundboard/soundboard-player.js:99-101`) |
| N3 | `removeAudioFile()` im Soundboard loescht ohne `saveUndoState`/`pushUndo` — Bruch der projektweiten Undo-Garantie | Datenintegritaet & Persistenz | uebernommen (DEBT-19) | `features/soundboard/soundboard-crud.js:69-101`: `deleteSoundBlob()` + Mutation von `D.soundboard.scenes` + `window.save()` ohne vorherigen Undo-Push, verifiziert per `grep -rn "saveUndoState\|pushUndo" features/soundboard` (kein Treffer in `soundboard-crud.js`). Andere neue Feature-CRUDs (Timeline, Fraktionen, Session-Prep, NPC-Generator) rufen an vergleichbarer Stelle korrekt `pushUndo` |
| N4 | `isFreshInstall()` prueft nur `APP_CONFIG.STORAGE_KEY`, ignoriert benannte Kampagnen und den IDB-only-Pfad | Datenintegritaet & Persistenz | uebernommen (DEBT-20) | `systems/migration/migration-wizard.js:31-36`: `StorageAPI.getJSON(APP_CONFIG.STORAGE_KEY, null)`, kein Zugriff auf `window.STORAGE_KEY_OVERRIDE` (`systems/spellslots/persistence.js:39`) oder Beruecksichtigung des IDB-only-Loeschpfads (`persistence.js:66-67`, derselbe Code-Pfad wie DEBT-17) |
| N5 | Datei-Backup sichert nur die aktive Kampagne — begleitender Kommentar behauptet „je Kampagne einzeln" | Datenintegritaet & Persistenz | uebernommen (DEBT-21) | `file-backup-manager.js:255-266`: genau ein `campaignKey` wird ermittelt und genau eine Kampagne geschrieben; Kommentar in Zeile 261 „(D-13: je Kampagne einzeln)" widerspricht dem Code |
| N6 | Backup-Dateinamen koennen zwischen Kampagnen kollidieren (Sonderzeichen-Normalisierung) | Datenintegritaet & Persistenz | uebernommen (DEBT-22) | `getBackupFilenames()` (`file-backup-manager.js:46-64`): `.replace(/[^a-z0-9-]/gi, '-')` reduziert z. B. „Feywild!" und „Feywild?" auf denselben `safeName`; ein rein nicht-lateinischer Name kollabiert auf den Leerstring |
| N7 | Generische `call`-Aktion ruft `window[ctx.value]` ohne Whitelist auf | Sicherheit | uebernommen (DEBT-23) | `ui/actions/ui-actions.js:186-190` (Zeilenzitat in dieser Sitzung bestaetigt), genutzt u. a. in `features/bestiary/bestiary-render.js:427`. Aktuell defense-in-depth-relevant statt akut ausnutzbar: `sanitizeHTML()` verwirft `data-*`-Attribute (`utils/basic.js:105-118`), daher ist der naheliegende Eskalationspfad ueber importiertes Rich-Text-HTML derzeit blockiert |
| N8 | Avatar-URLs werden nur HTML-escaped, nicht protokollgeprueft | Sicherheit | akzeptiert | `features/bestiary/bestiary-render.js:412`: `esc(monster.avatar)` maskiert Anfuehrungszeichen, prueft aber kein Schema. Kein Codeausfuehrungspfad (Attributausbruch ausgeschlossen, `javascript:` in `img src` in aktuellen Browsern wirkungslos) — verbleibt ein Offline-/Datenschutz-Bruch bei externer `http(s)`-URL. Zu geringe Schwere fuer einen eigenen Backlog-Posten |
| N9 | `JSON.stringify`-Undo verliert Typinformation (z. B. `Date`) | Performance & Skalierung | akzeptiert | Gleicher Code-Anker wie DEBT-06 (`systems/undo.js:9-20`, `JSON.stringify(window.D)`); ein konkret betroffenes `Date`-Feld innerhalb von `D` ist nicht nachgewiesen (die Wuerfelhistorie mit `time: new Date()` liegt ausserhalb von `D`, `features/dice/dice-core.js:436`). Wuerde durch eine DEBT-06-Loesung (structuredClone/Diff-basiertes Undo) automatisch mitbehoben — kein eigener Backlog-Posten, im Fix-Umfang von DEBT-06 vermerkt |
| N10 | Wuerfelstatistik (IDB-Store `diceStats`) waechst unbegrenzt, keine Prune-Funktion, `getAllStats()` laedt alles auf einmal | Performance & Skalierung | uebernommen (DEBT-24) | `features/dice/dice-core.js:440-444`: jeder Wurf schreibt `statsIdbPut()` (`features/dice-stats/dice-stats-idb.js:16-26`, `store.add`, autoIncrement); `grep -rn "clear()\|deleteRecord" features/dice-stats/` liefert keinen Treffer. Im Gegensatz zur in-memory-Historie (bei 30 gedeckelt, `dice-core.js:437`) existiert hier keine Grenze |
| N11 | Alte Szenen-`GainNode`s werden beim Szenenwechsel im Soundboard nicht `disconnect()`-et | Performance & Skalierung | akzeptiert | `features/soundboard/soundboard-player.js` (Bereich um `activateSoundScene()`): pro Track erzeugte `trackGain`-Knoten werden nie explizit getrennt, nur die Iterations-Quellen raeumen sich in `src.onended` auf. GainNodes sind billig, erst bei sehr vielen Wechseln messbar — zu trivial fuer einen eigenen Backlog-Posten |
| N12 | `const D` ueberschattet das globale Datenobjekt an mehreren Stellen (u. a. mit einer Zahl in `soundboard-player.js:145`) | Fragile Bereiche & Wartungsrisiko | uebernommen (DEBT-25) | Verifizierte Vorkommen: `systems/migration/full-export.js:66`, `utils/crud-helpers.js:44,107`, `utils/utilities.js:185,200`, `systems/avatars.js:116,176`, `systems/backups.js:17`, `systems/spellslots/persistence.js:41`, dazu `features/soundboard/soundboard-player.js:145` (`const D = track.duration` — ueberschattet mit einer Zahl). Kein Build-Konflikt (blockskopierte `const`), reines Lesbarkeits-/Wartbarkeitsrisiko — bewusst getrennt von Alt-Eintrag 27 (Build-Deduplizierung, `erledigt`) und vom pauschal ausgeschlossenen 499-Imports-Posten (`.planning/REQUIREMENTS.md` §Out of Scope), da hier konkrete, benennbare Stellen mit Umbenennungsaufwand nahe Null vorliegen |
| N13 | Command-Palette-Aktionsregister (`action-registry.js`, 22 Eintraege) ist eine handgepflegte Parallelwelt zur regulaeren `data-action`-Delegation | Fragile Bereiche & Wartungsrisiko | akzeptiert | `features/command-palette/action-registry.js` (`grep -c "^\s*id: '"` = 22, in dieser Sitzung bestaetigt) ruft Funktionen ueber `window.<name>` auf; `typeof … === 'function'`-Guards schlucken Fehlschlaege still. Vorhandene Absicherung: `tests/unit/action-registry.test.js`, `tests/unit/action-registry-collisions.test.js` — kein akuter Defekt, kein Backlog-Posten |
| N14 | Veralteter Header-Kommentar in `file-backup-manager.js` beschreibt das explizit verbotene `window.save`-Monkey-Patch-Muster | Fragile Bereiche & Wartungsrisiko | uebernommen (DEBT-26) | `file-backup-manager.js:5-6` behauptet „Haengt sich per Live-Sync-Muster in `window.save()` ein"; der Code tut das Gegenteil und begruendet es (`:348-357`: „KEIN window.save-Monkey-Patch (UAT 02) … registerPostSaveHook"). Auch `:213`/`:340` tragen noch irrefuehrende Ueberschriften. Billige Doku-Korrektur, aber die beschriebene Fehlerklasse ist in diesem Projekt bereits einmal produktiv aufgetreten (CLAUDE.md „⚠️ NEVER wrap `window.save`!") |
| N15 | `console.*`-Aufrufe ausserhalb von `DEBUG_MODE`-Guards widersprechen der CLAUDE.md-Zusicherung „Zero console.log in production" | Fragile Bereiche & Wartungsrisiko | uebernommen (DEBT-27) | Verifizierte Fundstellen ohne `DEBUG_MODE`-Bedingung in derselben Zeile: `core/init.js:163`, `utils/basic.js:10,271,286,312,356,366,376,387`, `utils/utilities.js:233`, `systems/backups.js:415-416`, `systems/campaign-manager/campaign-manager.js:106,114,152`, `systems/spellslots/import-export.js:227,272,362,393,623,660,664`, `ui/actions/ui-actions.js:189`. Ob `build.py --production` sie aus dem Bundle entfernt, ist nicht Teil dieses Belegs — die Quellcode-Aussage in CLAUDE.md trifft so, wie sie formuliert ist, auf den Quellstand nicht zu |
| N16 | Keine dedizierten Testdateien fuer Timeline / Reise / Fraktionen / Session-Prep / NPC-Generator — nur Sammel-Specs | Test-Luecken | uebernommen (DEBT-28) | `grep -rl <begriff> tests/unit tests/e2e -i` liefert fuer alle fuenf Begriffe je genau zwei Treffer, beide Male dieselben Sammeldateien `tests/unit/welt-story.test.js`/`tests/e2e/features/welt-story.spec.js`. Feature-Umfang laut `wc -l`: `features/timeline/` 519, `features/reise/` 638, `features/fraktionen/` 555, `features/session-prep/` 623, `features/npc-generator/` 877 Zeilen |
| N17 | Kein Test deckt das Zusammenspiel Persistenz-IDB-Modus ↔ Datei-Backup ab | Test-Luecken | **erledigt** (DEBT-29, `tests/unit/file-backup-idb.test.js`, `71fb6ef`) | `tests/unit/file-backup-hook.test.js`, `tests/unit/file-backup.test.js` und `tests/unit/storage-conflict.test.js` existieren, decken aber nicht den IDB-Fallback-Pfad von `_doBackup()` ab — exakt die Testluecke, die DEBT-17 (Kritisch) unentdeckt liess. Eigener Backlog-Posten, weil die Testluecke unabhaengig vom Bugfix geschlossen werden muss (Regressionsschutz) |
| N18 | `charId` in jedem Wuerfelstatistik-Datensatz ist konstant `null`, nirgends ausgewertet | Test-Luecken | akzeptiert | `features/dice/dice-core.js:443`: `charId: null` fest verdrahtet; `grep -n charId features/dice-stats/dice-stats-render.js` liefert keinen Treffer. Kein Laufzeitfehler, nur unbenutzter Platz im IDB-Datensatz — zu trivial fuer einen eigenen Backlog-Posten |
| N19 | Session-ID der Wuerfelstatistik (`Date.now().toString()`) ist nicht kollisionssicher | Build & Architektur | akzeptiert | `features/dice-stats/dice-stats-idb.js:8`: `const _sbSessionId = Date.now().toString();`. Zwei in derselben Millisekunde gestartete Tabs teilen sich eine Session-ID — unwahrscheinlich, Auswirkung rein kosmetisch (Session-Filter mischt Wuerfe) |
| N20 | Service Worker cacht ausschliesslich `dnd-tracker-optimized.html`, nicht den Dev-Bundle | Build & Architektur | akzeptiert | `sw.js:9-12` (`CORE_ASSETS`) listet nur `./dnd-tracker-optimized.html`; Offline-Fallback (`sw.js:99-101`) nutzt dieselbe Datei. Bewusster Tradeoff fuer die Single-File-Auslieferung; betrifft nur, wer den Dev-Build per HTTP mit aktivem SW testet — Debugging-Falle, kein Produktionsrisiko |
| N21 | Testartefakte (`_smoke_*.png`) liegen im `dist/`-Verzeichnis | Build & Architektur | akzeptiert | `dist/_smoke_fraktionen.png` u. a. (Zeitstempel 15. Juni); `dist/` ist nicht versioniert (`git log -- dist` liefert keine Commits) — reine Aufraeumarbeit ohne funktionalen Impact |

**Neue `DEBT-`-IDs aus diesem Abgleich (13, DEBT-17 bis DEBT-29):**

- DEBT-17 — Datei-Backup schreibt leere Kampagne im IDB-Modus (>5MB), kumulativer Totalverlust ueber `pruneOldSnapshots()` — Herkunft: N1 (Kritisch)
- DEBT-18 — Umzugs-Export enthaelt keine IndexedDB-Inhalte (Soundboard-Audio, Wuerfelstatistik) — Herkunft: N2 (Hoch)
- DEBT-19 — `removeAudioFile()` im Soundboard ohne `saveUndoState`/`pushUndo` — Herkunft: N3
- DEBT-20 — `isFreshInstall()` prueft nur einen von mehreren moeglichen Storage-Zustaenden — Herkunft: N4
- DEBT-21 — Datei-Backup sichert nur die aktive Kampagne, Kommentar behauptet das Gegenteil — Herkunft: N5
- DEBT-22 — Backup-Dateinamen koennen zwischen Kampagnen kollidieren — Herkunft: N6
- DEBT-23 — Generische `call`-Aktion ohne Ziel-Whitelist (defense-in-depth) — Herkunft: N7
- DEBT-24 — Wuerfelstatistik-IDB-Store waechst unbegrenzt, keine Prune-Funktion — Herkunft: N10
- DEBT-25 — `const D` ueberschattet das globale Datenobjekt an mehreren konkreten Stellen — Herkunft: N12
- DEBT-26 — Veralteter, irrefuehrender Header-Kommentar in `file-backup-manager.js` — Herkunft: N14
- DEBT-27 — `console.*` ausserhalb `DEBUG_MODE`-Guards widerspricht CLAUDE.md-Zusicherung — Herkunft: N15
- DEBT-28 — Keine dedizierten Tests fuer Timeline/Reise/Fraktionen/Session-Prep/NPC-Generator — Herkunft: N16
- DEBT-29 — Kein Test fuer Persistenz-IDB-Modus ↔ Datei-Backup-Zusammenspiel — Herkunft: N17

**Gesamtbild nach diesem Abgleich:** 46 Alt-Eintraege (16 `DEBT`-IDs) + 24 neue Eintraege (13 weitere
`DEBT`-IDs) = 70 dispositionierte Eintraege insgesamt, 29 `DEBT`-IDs im Backlog. Kein Widerspruch
zwischen einer bestehenden `erledigt`-Disposition und dem neuen Refresh gefunden; kein Restposten
wurde im Rahmen dieses Abgleichs aktiv im Code gefixt (D-16 gilt weiterhin), ausschliesslich
Dokumentation dieses Triage-Dokuments und Spiegelung nach `.planning/REQUIREMENTS.md`.
