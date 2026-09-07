# Phase 14: Tests & Gates - Research

**Researched:** 2026-09-06
**Domain:** Node-Test-/Lint-/Typecheck-/Coverage-Tooling für eine Non-ESM-Browser-App (kein neuer App-Code, nur Test-Infrastruktur und CI-Gates)
**Confidence:** HIGH für alle live gemessenen Zahlen (per `Read`/`Bash` in dieser Sitzung nachvollzogen), MEDIUM für Tooling-Mechanik (offizielle Docs + installierte `--help`-Ausgaben), einmal LOW/strittig markiert (tsc-`checkJs`-Fehlerzahl, siehe unten)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**TEST-03 — Toast-Race schließen und beweisen**
- **D-01:** Der Seed wandert als `seedCleanSession(page)` nach `tests/e2e/helpers/test-utils.js`; alle fünf CRUD-Specs rufen ihn auf. Keine fünfte Kopie. Der 40-zeilige Ursachenkommentar aus Plan 08-02 wandert mit. Abweichung von Erfolgskriterium 1 (Wortlaut "Seed-Nachzug", tatsächlich Extraktion+Aufruf) ist bewusst und benannt.
- **D-02:** Nachweis über `npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js --repeat-each=N --workers=<hoch> --retries=0`, mit Pflicht-Vorlauf gegen den ungefixten Stand (Falsifikationsprobe). Messprotokoll als Artefakt, nicht als Behauptung.
- **D-03:** `retries: 2` in `playwright.config.js` bleibt unverändert. Retries werden nur im Beweislauf aus D-02 abgeschaltet.

**TEST-04 — Zuschnitt der Welt-Testdateien**
- **D-04:** Beide Sammeldateien werden aufgeteilt (2 → 10). Zielnamen nach Quellverzeichnis: `tests/e2e/features/{session-prep,npc-generator,timeline,reise,fraktionen}.spec.js` und `tests/unit/{session-prep,npc-generator,timeline,reise,fraktionen}.test.js`.
- **D-05:** Aufteilung ist mechanisch und verhaltensneutral. Kein Test verändert, keiner hinzugefügt. Abnahme binär: 26 E2E-Tests / 37 Unit-Tests vorher = nachher, über die je fünf neuen Dateien.
- **D-06:** `welt-story.spec.js`s eigenes `APP_URL` wird NICHT auf `loadApp()` umgestellt (wäre Timing-Änderung, verletzt D-05).

**TEST-05 — Lint schärfen**
- **D-07:** Roter Lint-Fehler (`systems/avatars.js:17`, `no-control-regex`) zuerst, als eigene erste Aufgabe. Gezielter `eslint-disable-next-line` mit Begründung + WR-01-Verweis, keine projektweite Regelabschaltung. Vorrang, weil die gesamte CI-Kette (`e2e`, `build`, `smoke-test`, `deploy`) per `needs:` an `lint-and-typecheck` hängt.
- **D-08:** `no-undef` wird auf `error` gehoben — erst nachdem die Globals-Liste generiert statt handgepflegt wird. Generator leitet Top-Level-Namen aus den in `loader.js MODULES` gelisteten Dateien ab (SSoT, ARCH-01), schreibt sie in ein eingecheckten Artefakt; ein Test schlägt fehl, wenn das Artefakt veraltet ist. Vorbild: `tests/unit/console-hygiene.test.js` (13-08), `tests/unit/tab-registry.test.js` (13-04).
- **D-09:** Die 6 von D-08 freigelegten toten Aktionsziele werden in dieser Phase behoben, nicht nur gemeldet (siehe Tabelle in CONTEXT.md). Entscheidungsregel: kein `data-action` in `assets/templates/**` verweist darauf → Registrierung entfernen; verweist eines darauf → echter Bedienfehler, Funktion fehlt, das ist ein Befund.
- **D-10:** `--max-warnings` wird als Ratsche auf den gemessenen Reststand gesetzt, nicht auf 0. `lint:all` mit `--max-warnings 100` entfällt (zweite Wahrheit über denselben Sachverhalt).

**TEST-05 — Typecheck**
- **D-11:** `checkJs` bleibt global aus. Geschärft wird über eine zweite, wachsende Zulassungsliste (`tsconfig.strict.json`, `checkJs: true`, explizite `include`-Liste, startet mit heute fehlerfreien Dateien). Eigener npm-Befehl, CI hängt ihn an `lint-and-typecheck`. Konflikt mit Erfolgskriterium 3 ("Gates … laufen grün") ist bewusst und benannt: nur für die Zulassungsliste erreicht, Rest bleibt benannter Restposten.

**TEST-05 — Coverage**
- **D-12:** `roots` wird repariert, damit `collectCoverageFrom` überhaupt greift. Die ehrliche Zahl (0,77 %) wird dokumentiert, nicht kaschiert.
- **D-13:** Keine globale Statement-Schwelle. Stattdessen ein Modul-zu-Test-Abdeckungs-Gate aus `loader.js MODULES`, mit datierter Ausnahmeliste als Ratsche. Kriterium vor dem Festschreiben präzisieren und Zahl neu erheben (Basislinie 75/134 ist grobes Substring-Kriterium).
- **D-14:** Bestehende Schwelle für `utils/testable-utils.js` bleibt, wird auf gemessenen Stand angehoben (Werte in dieser Sitzung nachgemessen, siehe unten).

**Reihenfolge**
- **D-15:** `TEST-05` beginnt mit D-07, endet mit D-13; `TEST-04` läuft dazwischen; `TEST-03` kann parallel.

### Claude's Discretion

Nutzer hat alle vier Bereiche nach Empfehlung delegiert ("Führe alle Bereiche nach deinen Empfehlungen aus") — dieselbe Vorgabe wie Phase 13. D-01 bis D-15 sind Empfehlungsentscheidungen, gegen den Live-Stand gemessen, für den Planer bereits getroffen.

Drei Empfehlungen weichen bewusst von der Roadmap-Erwartung ab (D-01 Extraktion statt Nachzug, D-04 zwei statt einer Sammel-Spec, D-11 Typecheck nur teilweise grün) — siehe CONTEXT.md für die volle Begründung.

### Deferred Ideas (OUT OF SCOPE)

- Abdeckungslücken der fünf Welt-Features schließen (TEST-04 verlangt Dateien, nicht mehr Tests)
- `welt-story.spec.js`s `APP_URL` auf `loadApp()` vereinheitlichen (eigener Schritt mit eigenem Nachweis)
- `vm`-Ladepfad instrumentierbar machen (eigenes Testinfrastruktur-Vorhaben)
- `checkJs` über die Zulassungsliste hinaus ausrollen (braucht `D`-Interface statt `any`)
- `tests/unit/markdown-converter.test.js` Platzhalter-Assertions (von keinem der drei Requirements gedeckt)
- Dedizierte DM-Screen-Widget-Tests (aus Phase 13 weitergereicht, nicht von TEST-04 gedeckt)
- `console.*` per Build-Schritt strippen (MAINT-06 ist geschlossen, eigener TDD-Aufwand)
- `retries: 0` als nächtlicher Lauf (D-03 lässt CI-Retries stehen)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-03 | Toast-Race in `locations.spec.js`/`encounters.spec.js` schließen (Seed-Nachzug aus Plan 08-02) | Seed-Block byte-genau verifiziert (md5 `6364cafedc46...`, Zeilen 19-79 in `party`/`npcs`/`quests`); exakte Toast-Assertion-Fundstellen bestätigt; Playwright-CLI-Flags für den Beweislauf per `--help` verifiziert; `PLAYWRIGHT_JSON_OUTPUT_NAME`/`_FILE` für maschinenlesbares Protokoll per offizieller Doku bestätigt |
| TEST-04 | Dedizierte Testdateien für Session-Prep, NPC-Generator, Timeline, Reise, Fraktionen | Beide Sammeldateien vollständig gelesen, Zeilen-/Test-/`describe`-Zahlen live nachgezählt (520/26 E2E, 593/37 Unit); Quellverzeichnisnamen bestätigt (`features/{session-prep,npc-generator,timeline,reise,fraktionen}`) |
| TEST-05 | Lint-/Typecheck-/Coverage-Gates schärfen | Alle Kernzahlen der `<measured_baseline>` live nachgemessen (siehe „Measured Baseline — Re-Verified" unten); ESLint-Flat-Config-Mechanik, Jest-`roots`/`collectCoverageFrom`-Interaktion, `tsconfig`-`extends`/`include`-Semantik und `build.py`s Deklarations-Scan-Algorithmus (Vorbild für den D-08-Generator) recherchiert und mit konkreten Codebeispielen belegt |

</phase_requirements>

## Summary

Diese Phase baut keine neue App-Funktionalität, sondern schärft Test-Infrastruktur und CI-Gates einer bereits fertig geplanten Menge von Entscheidungen (D-01…D-15 in CONTEXT.md). Die Recherche für diese Phase ist deshalb keine Technologie-Auswahl, sondern eine **Verifikation der gemessenen Baseline plus Klärung der exakten Tooling-Mechanik**, die der Planer für jede Entscheidung braucht, um sie in konkrete Tasks zu übersetzen.

Alle Kernzahlen aus `<measured_baseline>` wurden in dieser Sitzung unabhängig nachgemessen. Die überwiegende Mehrheit stimmt exakt überein (Lint-Fehler/Warnungen, `no-undef`-Aufschlüsselung, Seed-Byte-Identität, Welt-Testdatei-Zahlen, Coverage-Zahlen nach `roots`-Fix, `loader.js MODULES`-Zahl). **Zwei Zahlen weichen ab und werden unten mit beiden Werten dokumentiert:** die `vm`-Ladepfad-Zahl (28 statt 30 von 40 Unit-Testdateien) und — deutlich bedeutsamer — die `tsc --checkJs`-Fehlerzahl (in dieser Sitzung 1758 Fehler in 117 von 134 Dateien gemessen, gegenüber der CONTEXT.md-Zahl 1617 Fehler in 98 von 103 Dateien). Diese zweite Abweichung betrifft direkt die Startliste für `tsconfig.strict.json` (D-11) und muss der Planer vor dem Festschreiben der Zulassungsliste neu erheben.

Ein bislang unbekannter, in dieser Sitzung verifizierter Befund: Einer der sechs "toten" Aktionsziele aus D-09 (`export-csv` → `exportDataCSV`) ist **kein reines Aufräum-Item, sondern ein echter, klickbarer Bedienfehler** — der Button dazu existiert in `assets/templates/view-resources.html:143` und ruft eine Funktion, die es im gesamten Quellbaum nicht gibt (die tatsächliche Funktion heißt `exportToCSV()`, `systems/spellslots/import-export.js:233`). Zusätzlich deklariert `types/globals.d.ts:437` die nicht existierende `exportDataCSV` als ambiente TypeScript-Funktion — das ist der Grund, warum selbst ein hypothetischer `checkJs`-Lauf diesen Bug nicht fangen würde: TypeScript hält die Deklaration für gültig, obwohl die Laufzeitimplementierung fehlt. Das ist exakt der Fall, den D-09s Entscheidungsregel „verweist ein `data-action` darauf → echter Bedienfehler" vorgesehen hat.

**Primary recommendation:** Die Reihenfolge aus D-15 einhalten, mit D-07 (roter Lint-Fehler) als allererstem Task. Für D-08 den bereits im Projekt etablierten Brace-Tiefe-0-Scan aus `build.py:check_duplicate_functions()` (Muster `function|const|let|class` auf Top-Level, ohne `var`) als Generator-Kern wiederverwenden statt neu zu erfinden. Für D-11 vor dem Schreiben von `tsconfig.strict.json` die `checkJs`-Fehlerzahl mit dem unten dokumentierten, reproduzierbaren Befehl neu erheben — die 1617/98/103-Zahl aus CONTEXT.md ließ sich mit einer direkten `tsc --checkJs`-Ausführung gegen den bestehenden `tsconfig.json`-`include`-Satz nicht reproduzieren.

## Architectural Responsibility Map

Diese Phase betrifft keine Laufzeit-Architektur der App (Browser/Client), sondern ausschließlich die Node-seitige Entwicklungs-/CI-Tooling-Schicht. Die Tabelle bildet trotzdem ab, welche "Schicht" für welche Fähigkeit zuständig ist, damit der Planer Tasks nicht versehentlich der falschen Stelle zuordnet (z. B. eine Lint-Regel-Änderung in `build.py` statt in `eslint.config.js`).

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Statische Undefined-Variable-Erkennung (`no-undef`) | Dev-Tooling (ESLint, Node) | — | Läuft pro Datei isoliert gegen eine `globals`-Konfiguration; hat keinen Laufzeitbezug zum Browser |
| Globals-Generator (SSoT-Ableitung aus `loader.js MODULES`) | Dev-Tooling (Node-Skript) | Build-Tooling (`build.py`, gleiche Technik) | Reine Textanalyse der Quelldateien, kein Browser-Kontext nötig |
| Typprüfung (`tsc --checkJs`) | Dev-Tooling (TypeScript-Compiler) | — | Statische Analyse, unabhängig vom Laufzeitverhalten im Browser |
| Statement-Coverage-Messung (`jest --coverage`) | Test-Infrastruktur (Jest/Istanbul) | — | Instrumentiert Quelldateien für Node-VM-Ausführung, nicht für den Browser |
| Modul-zu-Test-Abdeckungs-Gate (D-13) | Test-Infrastruktur (Jest-Test als Wächter) | Build-Tooling (`loader.js` als Quelle) | Statische Textanalyse wie `console-hygiene.test.js`, kein Laufzeitbezug |
| E2E-Toast-Race-Fix (Seed-Extraktion) | Test-Infrastruktur (Playwright-Helper) | Browser/Client (`localStorage`-Seed simuliert Boot-Zustand) | Der Seed selbst adressiert einen Boot-Zeit-Race im Browser-Code (`initRandomTables()`, `validateDataIntegrity()`), aber die Lösung liegt vollständig im Test-Setup |
| Toter Aktionsziel-Fund (`export-csv`) | Browser/Client (App-Code, `ui/actions/system-actions.js`) | — | Echter Laufzeitfehler im Produktionscode, kein Tooling-Thema — muss im App-Code gefixt werden |
| CI-Gate-Verdrahtung (`needs:`-Kette) | Build/CI-Tooling (`.github/workflows/ci.yml`) | — | Reine Pipeline-Orchestrierung |

## Measured Baseline — Re-Verified (dieser Sitzung, 2026-09-06)

Alle Zahlen unten wurden per `Bash`/`Read` in dieser Sitzung gegen den Live-Baum erhoben, nicht aus CONTEXT.md übernommen. Wo eine Zahl abweicht, stehen beide Werte nebeneinander.

| Gegenstand | CONTEXT.md-Wert | In dieser Sitzung gemessen | Übereinstimmung | Befehl |
|---|---|---|---|---|
| `npx eslint .` Gesamtergebnis | 1 Fehler, 2196 Warnungen | **1 Fehler, 2196 Warnungen** | ✅ exakt | `npx eslint .` |
| `no-undef`-Vorkommen / eindeutige Namen | 1829 / 539 | **1829 / 539** | ✅ exakt | `npx eslint . --format json` + Auswertungsskript |
| Warnungen ohne `no-undef` (= künftiger `--max-warnings`-Wert nach D-08) | „336 plus ~31 kleinere Treffer" | **367 exakt** (336 `no-unused-vars` + 11 `no-misleading-character-class` + 8 `no-useless-escape` + 4 `no-empty` + 8 „unused eslint-disable directive") | ✅ Summe stimmt exakt (336+31=367) | `npx eslint . --format json`, Aufschlüsselung nach `ruleId` |
| `systems/avatars.js:17` Regex + Commit | `[\x00-\x20\x7F\s]`, WR-01, Commit `d2a521c`, 2026-09-05 | **Bestätigt wortgleich**, Commit `d2a521c` „fix(12): WR-01 validateAvatarURL entfernt Steuerzeichen vor Protokollpruefung", `Sat Sep 5 2026` | ✅ exakt | `Read systems/avatars.js`, `git show d2a521c --stat` |
| `tsc --noEmit` heute (unverändert) | Exit 0 | **Exit 0** | ✅ exakt | `npx tsc --noEmit` |
| `tsc` mit `checkJs: true` | 1617 Fehler, 98/103 Dateien betroffen (1268× TS2339, 240× TS2304, 25× TS2551, ~69 echte Typkonflikte) | **1758 Fehler, 117/134 Dateien betroffen** (1616× TS2339, 40× TS2345, 23× TS2551, 21× TS2538, 12× TS2451, 12× TS2322, 8× TS2304, 6× TS2349, 5× TS2554, 5× TS2300) | ❌ **weicht deutlich ab** — siehe eigener Abschnitt unten | `tsc -p <extends tsconfig.json, checkJs:true>` |
| `jest --coverage` heute (unrepariert) | instrumentiert 2/134 Module, 92,45 % von 159 Statements | **Exakt bestätigt**: `core/srd-monsters.js` 83,33 % (6 Statements), `utils/testable-utils.js` 92,81 % (153 Statements), gesamt 92,45 % / 159 | ✅ exakt | `npx jest --coverage` |
| `utils/testable-utils.js` Einzelwerte | „92,81 % Statements" | **Statements 92,81 % / Branches 89,28 % / Functions 100 % / Lines 94,44 %** — vollständige Werte für D-14 | ✅ Statements exakt, Rest zusätzlich erhoben | `npx jest --coverage` (Tabellenzeile `utils`) |
| Coverage bei repariertem `roots` | 0,77 % (147/18950 Statements) | **0,77 % — exakt 147/18950 Statements, 126/14845 Branches (0,84 %), 26/2816 Functions (0,92 %), 124/16800 Lines (0,73 %)** | ✅ exakt | `npx jest --coverage --roots=.` (43 Suiten/1109 Tests unverändert, kein Test-Explosionsrisiko durch breiteren `roots`) |
| `jest`-Vollsuite heute | 43 Suiten, 1109 Tests | **43 Suiten, 1109 Tests, 50 Snapshots** | ✅ exakt | `npx jest --coverage` |
| `vm`+`readFileSync`-Ladepfad in Unit-Tests | „30 von 40" | **28 von 40** (12 Dateien ohne `vm`: `action-registry-collisions`, `console-hygiene`, `dice-stats-idb`, `dice-stats`, `encounter-calculator`, `entities`, `file-backup-hook`, `markdown-shortcuts`, `soundboard-loop`, `soundboard`, `utilities`, `welt-story`) | ⚠️ **weicht leicht ab** (28 statt 30) — geringe praktische Relevanz für D-13, aber Zahl nicht ungeprüft übernehmen | `grep -l "vm.createContext\|vm.runInContext" tests/unit/*.test.js` |
| Seed-Block `TEST-03` Byte-Identität | 61 Zeilen, md5 `6364cafedc46` | **Bestätigt**: Zeilen 19-79 in `party.spec.js`/`npcs.spec.js`/`quests.spec.js`, md5 `6364cafedc46ba23962c342745340154` in allen drei | ✅ exakt | `sed -n '19,79p' <datei> \| md5sum` je Datei |
| Toast-Race-Assertionen | `locations.spec.js:80`, `encounters.spec.js:131-132` | **Exakt bestätigt** | ✅ exakt | `grep -n "toContainText\|toBeVisible" <datei>` |
| Sammel-Specs `TEST-04` | `welt-story.spec.js` 520 Z./26 Tests, `welt-story.test.js` 593 Z./37 Tests | **Exakt bestätigt**, plus `describe`-Namen: E2E hat `WELT-01…05` als „Session-Prep-Tab/NPC-Generator/Kalender-Tab/Reise-Tab/Fraktionen-Tab", Unit hat „Session-Prep-Assistent/NPC-Generator/Kampagnen-Timeline/Reise- & Wetter-Simulator/Fraktionen & Ruf-System" — **die Beschriftungen weichen zwischen E2E und Unit für WELT-03 ab** (Kalender vs. Timeline), Zielname laut D-04 ist trotzdem einheitlich `timeline` (nach Quellverzeichnis `features/timeline/`) | ✅ Zahlen exakt, Namens-Inkonsistenz zusätzlich dokumentiert | `wc -l`, `grep -n "test.describe(\|^describe("` |
| CI-Wiederholungen | `retries: process.env.CI ? 2 : 0` | **Exakt bestätigt**, Zeile 31 in `playwright.config.js` | ✅ exakt | `Read playwright.config.js` |
| `loader.js MODULES`-Gesamtzahl | 134 | **134** (auch per unabhängigem `find`-Zählung der `.js`-Dateien unter `core/features/ui/utils/systems/render` bestätigt) | ✅ exakt | Node-Skript gegen `loader.js`, plus `find … -name "*.js"` |
| Module ohne Testerwähnung (Basislinie) | „75 von 134 (grobes Substring-Kriterium)" | **Nicht neu erhoben** — CONTEXT.md benennt diese Zahl selbst explizit als grobe Basislinie, die der Planer vor dem Festschreiben präzisieren muss (siehe D-13). Kein Widerspruch, nur nicht reproduziert in dieser Sitzung (Kriterium ist noch nicht definiert) | — offen, Planer-Aufgabe | — |

### Abweichung im Detail: `tsc --checkJs`-Fehlerzahl (D-11)

Diese Abweichung ist die einzige, die eine Entscheidung materiell beeinflussen könnte (die Startliste der `include`-Zulassungsliste in `tsconfig.strict.json`), deshalb ausführlich dokumentiert statt nur tabellarisch:

**Reproduzierbarer Befehl (in dieser Sitzung verwendet):**
```jsonc
// tsconfig.checkjs-test.json — extends die echte tsconfig.json, überschreibt zwei Felder
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "checkJs": true, "noEmit": true, "emitDeclarationOnly": false }
}
```
```bash
npx tsc -p tsconfig.checkjs-test.json
```
Ergebnis: **1758 Fehler** über **117 von 134** Quelldateien (17 Dateien fehlerfrei — Liste unten). Aufschlüsselung: 1616× TS2339 („Property does not exist"), 40× TS2345, 23× TS2551, 21× TS2538, 12× TS2451, 12× TS2322, 8× TS2304 („Cannot find name"), 6× TS2349, 5× TS2554, 5× TS2300.

**CONTEXT.md nennt:** 1617 Fehler über 98 von **103** geprüften Dateien (240× TS2304, 25× TS2551, ~69 „echte Typkonflikte"). Der Nenner 103 ist bereits kleiner als die tatsächliche Gesamtzahl von 134 `.js`-Quelldateien unter `core/features/ui/utils/systems/render` (per `find` unabhängig bestätigt) — das deutet darauf hin, dass die CONTEXT.md-Messung einen anderen (kleineren) Dateisatz geprüft hat als der volle `include`-Satz aus `tsconfig.json`, nicht auf einen Fehler in meiner Reproduktion.

Ein zweiter Versuch ohne die ambienten Deklarationen aus `types/**/*.d.ts` (die reduzieren `TS2304`, da `types/globals.d.ts` ~80 globale Funktionsnamen wie `save`, `renderAll`, `showToast` bereits deklariert) ergab **1680 Fehler über ebenfalls 117 Dateien** — näher an der Gesamtzahl, aber immer noch nicht an 103/98 heran. Die Differenz lässt sich mit den in dieser Sitzung verfügbaren Informationen nicht auflösen.

**Empfehlung für den Planer:** Vor dem Schreiben von `tsconfig.strict.json`s Start-`include` die Zahl mit dem obigen, dokumentierten Befehl frisch erheben (dauert unter 60 Sekunden) und die **17 heute fehlerfreien Dateien** als Kandidaten für die Startliste prüfen (Liste unten) — nicht die 5 aus der CONTEXT.md-Rechnung (103−98), deren Dateisatz nicht rekonstruierbar war.

**Die 17 heute fehlerfreien Dateien (bei `checkJs:true`, mit Ambient-Deklarationen aus `types/**/*.d.ts`):**
```
core/srd-monsters.js
core/srd-spells.js
core/themes.js
features/dmscreen/dmscreen-widgets-combat.js
features/dmscreen/dmscreen-widgets-reference.js
features/initiative-statblock.js
features/npcs/npc-popup.js
systems/session-timer.js
systems/spellslots/notes-templates.js
systems/spellslots/pwa-install.js
systems/spellslots/spell-slots-core.js
systems/spellslots/spellslots-ui.js
systems/spellslots/virtual-list.js
systems/wiki-links.js
ui/actions/wiki-actions.js
ui/layout-profiles.js
utils/testable-utils.js
```

## Standard Stack

Keine neuen Laufzeit-Abhängigkeiten. Alle benötigten Werkzeuge sind bereits installiert — diese Phase konfiguriert sie um, installiert aber nichts grundlegend Neues.

### Core (bereits installiert, Versionen in dieser Sitzung geprüft)

| Tool | Installierte Version | Zweck in dieser Phase | Provenienz |
|---|---|---|---|
| `eslint` | 9.39.2 | D-07/D-08/D-09/D-10 — Lint-Schärfung | `[VERIFIED: node_modules/eslint/package.json]` |
| `typescript-eslint` | 8.51.0 (installiert; `^8.50.1` in `package.json`) | Flat-Config-Basis (`tseslint.config(...)`) | `[VERIFIED: node_modules/typescript-eslint/package.json]` |
| `@eslint/js` | 9.39.2 | `js.configs.recommended` Basis-Regelsatz | `[VERIFIED: node_modules/@eslint/js/package.json]` |
| `eslint-config-prettier` | 10.1.8 | Deaktiviert Stil-Konflikte mit Prettier | `[VERIFIED: node_modules/eslint-config-prettier/package.json]` |
| `typescript` | 5.9.3 | D-11 — zweite `tsconfig.strict.json` | `[VERIFIED: npx tsc --version via require('typescript').version]` |
| `jest` | `^30.2.0` (package.json) | D-12/D-13/D-14 — Coverage-Reparatur + Modul-Gate | `[VERIFIED: package.json devDependencies]` |
| `ts-jest` | `^29.4.6` | TS-Transform in Jest (aktuell ungenutzt für `.js`-Tests) | `[VERIFIED: package.json devDependencies]` |
| `@playwright/test` | 1.57.0 | D-01/D-02/D-03 — E2E-Seed + Beweislauf | `[VERIFIED: npx playwright --version]` |

### Supporting (optional, Claude's Discretion für D-08's Mechanik)

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| `globals` (sindresorhus) | 17.12.0 aktuell auf npm; bereits transitiv in `node_modules/globals` vorhanden, aber **nicht** als direkte `devDependency` in `package.json` gelistet | Vorgefertigte `browser`/`node`/`jest`-Globals-Wörterbücher, würde die 15 fehlenden Browser- und 6 fehlenden Node-Globals aus D-08 durch einen Import statt Handeintrag lösen | Nur für die generischen Browser-/Node-Namen — NICHT für die 510 projekteigenen Namen, die der Generator aus `loader.js MODULES` ableiten muss. Falls verwendet: als explizite `devDependency` eintragen, nicht auf den transitiven Zufallsfund verlassen |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Eigener Generator (D-08, Kern) | `eslint-plugin-no-undef` o.ä. Drittanbieter-Plugins zur Globals-Ableitung | Kein Plugin im Ökosystem leitet Globals aus einem projektspezifischen `MODULES`-Array ab — das ist Non-ESM-Architektur-spezifisch, kein generisches Problem. Eigenbau ist hier die einzige passende Lösung, nicht eine vermeidbare Neuerfindung |
| `roots`-Fix (D-12) | `collectCoverageFrom` mit absoluten statt `<rootDir>`-relativen Pfaden | Löst das eigentliche Problem nicht — `roots` steuert, welche Verzeichnisse Jest überhaupt in seine Haste-Modulkarte aufnimmt; unabhängig vom Pfad-Stil in `collectCoverageFrom` bleiben nicht-`roots`-Verzeichnisse für die Instrumentierung unsichtbar (empirisch in dieser Sitzung bestätigt: Testlauf mit `--roots=.` behebt es, Pfadstil in `collectCoverageFrom` blieb unverändert) |

**Installation:** Keine — alle Pakete sind bereits vorhanden. Falls `globals` (Discretion-Option oben) übernommen wird:
```bash
npm install --save-dev globals@^17.12.0
```

**Package-Legitimacy-Hinweis zu `globals`:** Existenz und Repo per `npm view globals` bestätigt (`repository: github.com/sindresorhus/globals`, Erstveröffentlichung 2012-11-03, aktuell 17.12.0) — `[VERIFIED: npm registry]` für Registry-Fakten, aber der Name selbst stammt aus Trainingswissen, nicht aus offizieller ESLint-Dokumentation in dieser Sitzung nachgelesen — daher `[ASSUMED]` für die Empfehlung selbst. Da die Übernahme rein optional ist (Claude's Discretion, nicht Teil einer D-Entscheidung), reicht ein `checkpoint:human-verify` vor der Installation, falls der Planer sich dafür entscheidet.

## Package Legitimacy Audit

Diese Phase installiert **keine verpflichtenden** neuen Pakete — alle für D-01…D-15 nötigen Werkzeuge (`eslint`, `typescript`, `jest`, `@playwright/test`) sind bereits in `package.json` als Dependencies vorhanden und in `node_modules` installiert (Versionen oben verifiziert). Die einzige optionale Ergänzung ist `globals` (siehe Supporting-Tabelle) — nicht Teil einer D-Entscheidung, reine Implementierungs-Discretion.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---|---|---|---|---|---|---|
| `globals` | npm | ~13 Jahre (seit 2012-11-03) | nicht in dieser Sitzung per Tool abgefragt (kein `gsd-tools`-Shim im Projektbaum auffindbar) | `github.com/sindresorhus/globals` | Nicht über den `package-legitimacy`-Seam geprüft — manuell per `npm view` verifiziert (Alter, Repo, aktuelle Version) | Optional, nur falls Planer sich für D-08s Mechanik dafür entscheidet — `checkpoint:human-verify` vor `npm install` |

**Packages removed due to [SLOP] verdict:** keine (keine verpflichtende Installation)
**Packages flagged as suspicious [SUS]:** keine

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │         loader.js MODULES[]              │
                    │   (134 Quelldateien, SSoT seit ARCH-01)  │
                    └───────────────┬───────────────────────────┘
                                    │ gelesen von
              ┌─────────────────────┼─────────────────────┬──────────────────┐
              ▼                     ▼                     ▼                  ▼
   ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐ ┌─────────────────┐
   │  build.py         │  │ Globals-Generator  │  │ Modul-Test-Gate  │ │ console-hygiene /│
   │  check_duplicate_ │  │ (NEU, D-08)        │  │ (NEU, D-13)      │ │ tab-registry     │
   │  functions()      │  │ brace-depth-0 Scan │  │ Substring-Scan   │ │ (Vorbild-Tests)  │
   │  [VORBILD für     │  │ function|const|let │  │ Modul↔Testdatei  │ │                  │
   │   den Generator]  │  │ |class → Namen     │  │                  │ │                  │
   └──────────────────┘  └─────────┬──────────┘  └────────┬─────────┘ └─────────────────┘
                                    │ schreibt                        │ prüft
                                    ▼                                 ▼
                       ┌────────────────────────┐         ┌───────────────────────┐
                       │ generated-globals.js    │         │ tests/unit/            │
                       │ (eingecheckt, ESM       │         │ module-coverage.test.js│
                       │  export default {...})  │         │ (NEU) + Ausnahmeliste  │
                       └───────────┬─────────────┘         └───────────────────────┘
                                   │ import
                                   ▼
                       ┌────────────────────────┐
                       │ eslint.config.js        │
                       │ languageOptions.globals │──── no-undef: 'error' (D-08)
                       │ (mergt über Config-     │
                       │  Objekte hinweg)        │
                       └────────────────────────┘

   ── separat, parallel ──

   ┌────────────────────┐        ┌─────────────────────┐        ┌──────────────────────┐
   │ tsconfig.json        │        │ tsconfig.strict.json │        │ jest.config.cjs        │
   │ checkJs: false        │◄──────│ extends tsconfig.json│        │ roots: ['<rootDir>']   │
   │ (unverändert, D-11)  │ extends│ checkJs: true         │        │ (FIX, D-12)            │
   │                       │        │ include: [17 Dateien, │        │ coverageThreshold      │
   │                       │        │  wächst]              │        │ (angehoben, D-14)      │
   └───────────────────────┘        └───────────────────────┘        └────────────────────────┘

   ── E2E-Seite (TEST-03/04) ──

   party.spec.js ──┐
   npcs.spec.js  ──┼── byte-identischer Seed (61 Zeilen) ──► EXTRAHIEREN (D-01)
   quests.spec.js──┘                                              │
                                                                   ▼
   locations.spec.js ──(fehlt heute)──► ruft seedCleanSession(page) ──► #toast-Race geschlossen
   encounters.spec.js──(fehlt heute)──►      (tests/e2e/helpers/test-utils.js)

   welt-story.spec.js (520 Z./26 Tests) ──► split ──► 5× tests/e2e/features/{name}.spec.js
   welt-story.test.js (593 Z./37 Tests) ──► split ──► 5× tests/unit/{name}.test.js
```

### Recommended Project Structure (neue/geänderte Dateien dieser Phase)

```
eslint.config.js                          # geändert: no-undef→error, generierte Globals importiert, tests/**+tools/**-Blöcke ergänzt
tools/
├── generate-eslint-globals.js            # NEU (D-08): Generator-Logik, wiederverwendbar von Skript UND Test
eslint.generated-globals.js               # NEU (D-08): eingechecktes Artefakt, `export default {...}`
tests/unit/
├── eslint-globals-freshness.test.js      # NEU (D-08): Drift-Wächter (regeneriert und vergleicht)
├── module-test-coverage.test.js          # NEU (D-13): Modul-zu-Test-Gate mit Ausnahmeliste
├── session-prep.test.js                  # NEU (D-04), aus welt-story.test.js extrahiert
├── npc-generator.test.js                 # NEU (D-04)
├── timeline.test.js                      # NEU (D-04)
├── reise.test.js                         # NEU (D-04)
├── fraktionen.test.js                    # NEU (D-04)
tests/e2e/features/
├── session-prep.spec.js                  # NEU (D-04), aus welt-story.spec.js extrahiert
├── npc-generator.spec.js                 # NEU (D-04)
├── timeline.spec.js                      # NEU (D-04)
├── reise.spec.js                         # NEU (D-04)
├── fraktionen.spec.js                    # NEU (D-04)
tests/e2e/crud/
├── locations.spec.js                     # geändert (D-01): ruft seedCleanSession(page)
├── encounters.spec.js                    # geändert (D-01): ruft seedCleanSession(page)
├── party.spec.js / npcs.spec.js / quests.spec.js  # geändert (D-01): Seed-Block durch Aufruf ersetzt
tests/e2e/helpers/
├── test-utils.js                         # geändert (D-01): + seedCleanSession(page) Export
tsconfig.strict.json                      # NEU (D-11)
jest.config.cjs                           # geändert (D-12/D-14): roots-Fix, angehobene coverageThreshold
package.json                              # geändert: neue/geänderte Scripts (lint, lint:all entfernt, typecheck:strict, test:coverage)
.github/workflows/ci.yml                  # geändert: lint-and-typecheck Job + typecheck:strict-Schritt
systems/avatars.js                        # geändert (D-07): eslint-disable-next-line mit Begründung
ui/actions/entity-actions.js              # geändert (D-09): tote Registrierungen entfernt oder Handler ergänzt
ui/actions/system-actions.js              # geändert (D-09): export-csv-Bug fixen (exportDataCSV → exportToCSV)
ui/actions/ui-actions.js                  # geändert (D-09): set-view-mode prüfen
core/init.js                              # ggf. unverändert (initLootTagSystem ist guarded, kein Zwang)
types/globals.d.ts                        # geändert (Nebenbefund): exportDataCSV-Deklaration korrigieren/entfernen
```

### Pattern 1: Brace-Depth-0-Deklarations-Scan (Vorbild für den D-08-Generator)

**Was:** Textbasiertes Scannen einer Quelldatei, das Klammertiefe zeilenweise mitführt und Top-Level-Deklarationen (Tiefe 0) von verschachtelten unterscheidet — ohne echten Parser.

**Wann verwenden:** Immer wenn projektweite Top-Level-Bezeichner aus dem Nicht-ESM-Quellbaum extrahiert werden müssen (Globals-Generator D-08, Duplikat-Prüfung in `build.py`, Modul-Test-Gate D-13).

**Beispiel (bereits produktiv in `build.py`, hier als exaktes Vorbild):**
```python
# Source: build.py:173-208 (in dieser Sitzung per Read gelesen)
decl_pattern = re.compile(r'^\s*(function|const|let|class)\s+(\w+)')
seen = {}
for module in modules:
    path = os.path.join(source_dir, module)
    if not os.path.exists(path):
        continue
    content = read_file(path)
    depth = 0
    for line in content.split('\n'):
        match = decl_pattern.match(line) if depth == 0 else None
        for ch in line:
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
        if match:
            name = match.group(2)
            # ... Namen sammeln statt (wie hier) auf Duplikate zu prüfen
```
**Wichtig für D-08:** Das Muster enthält bewusst **kein `var`** — `var X = window.X;`-Top-Level-Zeilen (das im Projekt etablierte Cross-Modul-Zugriffsmuster, siehe CLAUDE.md) sind reine lokale Aliase auf bereits anderswo per `const`/`function` deklarierte Globals. Sie in die Generator-Ausbeute aufzunehmen wäre harmlos, aber unnötig — die eigentliche Deklaration wird bereits vom `function|const|let|class`-Muster erfasst. Dieselbe Entscheidung wie in `build.py` treffen (Konsistenz zwischen den beiden Scannern, die dieselbe Datei lesen).

### Pattern 2: SSoT + Drift-Test (Vorbild: `console-hygiene.test.js`, `tab-registry.test.js`)

**Was:** Ein Jest-Test extrahiert Daten direkt aus einer kanonischen Quelle (`loader.js MODULES` oder ein Registry-Literal) statt eine zweite, handgepflegte Liste zu führen — und bricht, sobald Quelle und Erwartung auseinanderlaufen.

**Wann verwenden:** D-08 (Globals-Generator-Drift-Test), D-13 (Modul-zu-Test-Gate).

**Beispiel (D-08-Drift-Test, abgeleitet aus dem `tab-registry.test.js`-Muster):**
```javascript
// Vorbild-Struktur, angelehnt an tests/unit/tab-registry.test.js (13-04)
const { generateGlobalsFromModules } = require('../../tools/generate-eslint-globals');
const checkedIn = require('../../eslint.generated-globals.js').default;

test('eslint.generated-globals.js ist nicht veraltet gegenüber loader.js MODULES', () => {
    const fresh = generateGlobalsFromModules();
    expect(Object.keys(checkedIn).sort()).toEqual(Object.keys(fresh).sort());
});
```

### Pattern 3: Playwright-Beweislauf mit Falsifikationsprobe (D-02)

**Was:** Ein Messprotokoll als Artefakt (`.md`-Datei im Phasenordner, Vorbild `13-PERF-MEASUREMENT.md`), das sowohl den Vorlauf gegen den ungefixten Stand als auch den Nachlauf gegen den gefixten Stand dokumentiert.

**Beispiel (verifizierte CLI-Syntax, Playwright 1.57.0):**
```bash
# Vorlauf (ungefixter Stand, MUSS die Race reproduzieren)
git stash  # oder: auf Commit vor dem Fix wechseln
PLAYWRIGHT_JSON_OUTPUT_NAME=pre-fix-repeat.json \
  npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js \
  --repeat-each=20 --workers=8 --retries=0 --reporter=json,list
git stash pop  # Fix wiederherstellen

# Nachlauf (gefixter Stand, MUSS grün bleiben)
PLAYWRIGHT_JSON_OUTPUT_NAME=post-fix-repeat.json \
  npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js \
  --repeat-each=20 --workers=8 --retries=0 --reporter=json,list
```
`--repeat-each`, `-j/--workers`, `--retries`, `--reporter` (inkl. `json`) sind per `npx playwright test --help` an der installierten Version 1.57.0 verifiziert. `PLAYWRIGHT_JSON_OUTPUT_NAME` (Datei landet im Standard-Output-Verzeichnis) bzw. `PLAYWRIGHT_JSON_OUTPUT_FILE` (voller Pfad) sind laut offizieller Playwright-Dokumentation (`playwright.dev/docs/test-reporters`) die Wege, den JSON-Reporter-Output in eine Datei umzuleiten, ohne `playwright.config.js` anzufassen — `[CITED: playwright.dev/docs/test-reporters]`.

### Anti-Patterns to Avoid

- **`--max-warnings 0` nach D-08 setzen:** Der Reflex, nach dem `no-undef`-Fix auf 0 Warnungen zu gehen, würde erzwingen, das `const X = window.X`-Muster (169 Vorkommen allein für `D`) umzubauen — von `v1.1-REQUIREMENTS.md` §Out of Scope ausdrücklich ausgenommen (D-10).
- **`roots: ['<rootDir>']` ohne Prüfung der Testlauf-Auswirkung ändern:** Ein zu breiter `roots`-Wert könnte theoretisch `testMatch`-Muster gegen unerwartete Verzeichnisse matchen. In dieser Sitzung empirisch mit `--roots=.` geprüft: **keine** neuen Testdateien wurden entdeckt (weiterhin exakt 43 Suiten/1109 Tests) — die Sorge ist für dieses Projekt unbegründet, aber nach der eigentlichen `jest.config.cjs`-Änderung erneut mit einem vollen `jest`-Lauf bestätigen.
- **`checkJs: true` global setzen, um Erfolgskriterium 3 wörtlich zu erfüllen:** Erzeugt (je nach Messung) 1617-1758 Fehler, davon >90 % architektonisches Rauschen (`window.X`/`D.X`-Zugriffsmuster). Ein „grünes" Gate, das durch Wegkonfigurieren der Fehler grün wird, ist genau der Zustand, den diese Phase beheben soll (D-11).
- **Die `exportDataCSV`-Ambient-Deklaration in `types/globals.d.ts` unangetastet lassen, während der Aktionsname im Code auf `exportToCSV` korrigiert wird:** Würde eine zweite, jetzt falsche Wahrheit im Typsystem hinterlassen — die `.d.ts`-Datei muss im selben Task korrigiert werden (siehe Common Pitfalls unten).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Top-Level-Deklarationen aus dem Quellbaum extrahieren | Einen neuen Parser oder eine AST-Bibliothek (`@babel/parser`, `esprima`) für den D-08-Generator | Den bereits produktiven, textbasierten Brace-Tiefe-0-Scan aus `build.py:check_duplicate_functions()` (Pattern 1 oben) nach JS portieren | Das Projekt hat dieses Problem in Phase 11 bereits gelöst und seit Monaten in Produktion (`build.py`); ein AST-Parser wäre eine zweite, abweichende Implementierung mit eigenem Fehlerpotenzial für dasselbe Problem |
| Playwright-JSON-Report in eine Datei umleiten | Eigenes Node-Skript, das `stdout` von `playwright test --reporter=json` abfängt und in eine Datei schreibt | `PLAYWRIGHT_JSON_OUTPUT_NAME`/`PLAYWRIGHT_JSON_OUTPUT_FILE` Umgebungsvariablen (offiziell dokumentiert) | Eingebaute Funktionalität, keine Fehlerquelle durch Shell-Redirection-Eigenheiten auf Windows |
| ESLint-Globals-Wörterbücher für Standard-Browser/Node-Namen | Von Hand 15 Browser- + 6 Node-Namen eintippen und pflegen | Das `globals`-npm-Paket (`globals.browser`, `globals.node`) — optional, siehe Supporting-Tabelle | Community-gepflegte, vollständige Wörterbücher; von Hand gepflegte Teilmengen verrotten genau wie die 510 App-Globals, die D-08 eigentlich vermeiden will |

**Key insight:** Diese Phase hat für ihre drei Kernmechaniken (Globals-Ableitung, Coverage-Instrumentierung, E2E-Beweisführung) bereits funktionierende Vorbilder im selben Repo (`build.py`, `console-hygiene.test.js`/`tab-registry.test.js`, `13-PERF-MEASUREMENT.md`). Die Recherche-Arbeit besteht darin, diese Vorbilder zu identifizieren und ihre exakte Mechanik zu verstehen — nicht darin, neue Lösungen zu suchen.

## Common Pitfalls

### Pitfall 1: `export-csv` ist kein totes Aufräum-Item, sondern ein Live-Bug (D-09-Präzisierung)

**Was schiefgeht:** Die Registrierung `'export-csv': ctx => exportDataCSV(ctx.value)` in `ui/actions/system-actions.js:14` sieht aus wie die anderen 5 Fälle aus D-09 (nirgends implementierte Funktion). Anders als bei diesen fünf verweist aber ein echter Button im Produktions-UI darauf: `assets/templates/view-resources.html:143` — `<button class="export-dropdown-item" data-action="export-csv" data-value="spells">📊 CSV</button>`. Ein DM, der im Zauber-Tab auf „📊 CSV" klickt, löst einen `ReferenceError: exportDataCSV is not defined` aus.

**Warum es passiert:** Die tatsächliche Implementierung existiert bereits unter einem anderen Namen — `exportToCSV(dataType)` in `systems/spellslots/import-export.js:233` — vermutlich ein Tippfehler oder eine Umbenennung, bei der die Aktionsregistrierung nicht nachgezogen wurde. Zusätzlich deklariert `types/globals.d.ts:437` `function exportDataCSV(type: string): void;` als ambiente Funktion — dadurch würde selbst ein `checkJs`-Lauf diesen konkreten Aufruf nicht als Fehler erkennen, weil TypeScript die Deklaration für gültig hält.

**How to avoid:** Gemäß D-09s eigener Entscheidungsregel ("verweist ein `data-action` darauf → echter Bedienfehler, Funktion fehlt") ist dies **kein Entfernen der Registrierung**, sondern ein Fix: entweder `'export-csv': ctx => exportToCSV(ctx.value)` (Aufruf korrigieren) oder `exportDataCSV` als Alias-Funktion ergänzen. Die erste Variante ist konsistenter mit dem Rest der Datei (`import-export.js` ist bereits der etablierte Ort für Export-Logik). **Im selben Task** die verwaiste `exportDataCSV`-Deklaration in `types/globals.d.ts:437` entfernen oder auf `exportToCSV` umbenennen — sonst bleibt eine zweite, jetzt falsche Wahrheit im Typsystem stehen, die bei einem künftigen `checkJs`-Ausbau (Deferred Idea) erneut Verwirrung stiftet.

**Warning signs:** Jeder der 6 D-09-Namen sollte einzeln gegen `assets/templates/**/*.html` per `grep -rn "data-action=\"<name>\""` geprüft werden, nicht pauschal als „6 gleichartige tote Ziele" behandelt — die anderen 5 (`scroll-to-npc`, `remove-loot-tag`, `populate-import-nodes`, `set-view-mode`) sind in dieser Sitzung per Grep **nicht** in `assets/templates/` gefunden worden und sind daher tatsächlich entfernbare tote Registrierungen (kein UI-Element ruft sie auf).

### Pitfall 2: `checkJs`-Fehlerzahl hängt stark vom exakten Befehl und `include`-Satz ab

**Was schiefgeht:** Zwei in dieser Sitzung durchgeführte, plausible Varianten von `tsc --checkJs` (mit vs. ohne Einbindung von `types/**/*.d.ts`) ergaben 1758 bzw. 1680 Fehler — beide deutlich über der in CONTEXT.md dokumentierten Zahl 1617, mit einem anderen Datei-Nenner (134 statt 103 geprüfte Dateien).

**Warum es passiert:** Ohne den exakten Befehl (inkl. `include`-Satz, ob `types/**/*.d.ts` eingebunden war, ob `tsconfig.json` direkt editiert oder über `extends` überlagert wurde) dokumentiert zu haben, ist die Messung nicht exakt reproduzierbar. `types/globals.d.ts` deklariert ~80 globale Funktionsnamen ambient — das reduziert `TS2304` massiv (240 → 8 in meinem Test), hat aber praktisch keinen Effekt auf `TS2339` (`window.X`/`D.X`-Property-Zugriffe bleiben unabhängig von Funktionsdeklarationen ungetypt).

**How to avoid:** Vor dem Schreiben der `include`-Startliste für `tsconfig.strict.json` den in dieser Datei dokumentierten, reproduzierbaren Befehl (`tsconfig.checkjs-test.json` mit `extends`) erneut ausführen und die Ergebnis-Datei (`tsc`-Ausgabe) als Beleg im Plan/Summary referenzieren — nicht auf eine der beiden hier genannten Zahlen ungeprüft aufbauen.

**Warning signs:** Wenn die neu erhobene Zahl wieder von beiden hier genannten Werten abweicht, ist das ein Signal, dass `tsc`-Fehlerzahlen in diesem Projekt nicht stabil über kleine Config-Variationen sind — dann sollte die `include`-Startliste NICHT an einer globalen Fehlerzahl hängen, sondern direkt an der Liste der 17 (oder neu erhobenen) fehlerfreien Dateien.

### Pitfall 3: `no-unused-vars`-Reststand als `--max-warnings`-Ratsche exakt beziffern, nicht schätzen

**Was schiefgeht:** CONTEXT.md rundet auf „336 plus ~31 kleinere Treffer" — ein Planer, der daraus `--max-warnings 370` oder `--max-warnings 400` ableitet, setzt die Ratsche lockerer als nötig.

**Warum es passiert:** Die exakte Summe (2196 Gesamtwarnungen − 1829 `no-undef`, die nach D-08 zu Errors werden) ergibt **367**, exakt zusammengesetzt aus 336 `no-unused-vars` + 11 `no-misleading-character-class` + 8 `no-useless-escape` + 4 `no-empty` + 8 „unused eslint-disable directive" (kein eigener `ruleId`, aber real zählend).

**How to avoid:** `--max-warnings 367` nach Abschluss von D-07/D-08/D-09 als Ratschen-Startwert verwenden — exakt der gemessene Reststand, keine Rundung. Bei jeder künftigen `no-unused-vars`-Bereinigung sinkt die Zahl, das Gate darf dann enger gezogen werden (nie umgekehrt).

## Code Examples

### D-08: Vollständiger Ablauf Generator → Artefakt → ESLint-Config

```javascript
// tools/generate-eslint-globals.js (NEU) — CommonJS, von Skript UND Jest-Test importierbar
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const LOADER_PATH = path.join(REPO_ROOT, 'loader.js');

// Gleiches Muster wie build.py:188 — bewusst OHNE 'var' (siehe Pattern 1 oben)
const DECL_PATTERN = /^\s*(function|const|let|class)\s+(\w+)/;

function extractModulesFromLoader() {
    const source = fs.readFileSync(LOADER_PATH, 'utf8');
    const match = source.match(/const\s+MODULES\s*=\s*\[([\s\S]*?)\];/);
    const entries = [];
    const entryPattern = /'([^']+)'|"([^"]+)"/g;
    let m;
    while ((m = entryPattern.exec(match[1])) !== null) entries.push(m[1] || m[2]);
    return entries;
}

function generateGlobalsFromModules() {
    const modules = extractModulesFromLoader();
    const names = new Set();
    for (const relPath of modules) {
        const absPath = path.join(REPO_ROOT, relPath);
        if (!fs.existsSync(absPath)) continue;
        const content = fs.readFileSync(absPath, 'utf8');
        let depth = 0;
        for (const line of content.split('\n')) {
            const match = depth === 0 ? DECL_PATTERN.exec(line) : null;
            for (const ch of line) {
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
            }
            if (match) names.add(match[2]);
        }
    }
    const result = {};
    for (const name of [...names].sort()) result[name] = 'readonly';
    return result;
}

module.exports = { generateGlobalsFromModules, extractModulesFromLoader };
```

```javascript
// eslint.generated-globals.js (NEU, eingecheckt) — ESM, weil package.json "type": "module" setzt
// AUTO-GENERIERT — nicht von Hand editieren. Regenerieren via:
//   node tools/generate-eslint-globals.js > eslint.generated-globals.js
export default {
    // ... 510 Namen, alphabetisch, 'readonly'
};
```

```javascript
// eslint.config.js — Ergänzung (Auszug), NACH dem bestehenden "Global configuration"-Block einfügen
import generatedGlobals from './eslint.generated-globals.js';

export default tseslint.config(
    js.configs.recommended,
    prettier,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { /* ... bestehende Browser-/App-Globals unverändert ... */ }
        }
    },
    // NEU: generierte projekteigene Globals, eigener Config-Block (mergt automatisch,
    // s. "ESLint Flat Config: languageOptions.globals Merging" unten)
    { languageOptions: { globals: generatedGlobals } },
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error'  // D-08: von 'warn' auf 'error' gehoben
        }
    },
    {
        // Bestehender Block ERGÄNZT um Node-Globals (D-08, kleinerer Teil: 6 Namen)
        files: ['tests/**/*.js'],
        languageOptions: {
            globals: {
                describe: 'readonly', it: 'readonly', test: 'readonly', expect: 'readonly',
                beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly',
                afterAll: 'readonly', jest: 'readonly',
                // NEU:
                require: 'readonly', module: 'writable', __dirname: 'readonly',
                __filename: 'readonly', process: 'readonly', global: 'readonly'
            }
        },
        rules: { 'no-unused-vars': 'off', '@typescript-eslint/no-unused-vars': 'off' }
    },
    {
        // NEU: eigener Block für tools/**, existiert heute gar nicht
        files: ['tools/**/*.js'],
        languageOptions: {
            globals: {
                require: 'readonly', module: 'writable', __dirname: 'readonly',
                __filename: 'readonly', process: 'readonly', global: 'readonly'
            }
        }
    }
    // ... Rest unverändert
);
```

### D-11: `tsconfig.strict.json` mit wachsender Zulassungsliste

```jsonc
// tsconfig.strict.json (NEU)
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "checkJs": true,
        "noEmit": true,
        "emitDeclarationOnly": false
    },
    // Überschreibt (nicht mergt) die Basis-include — bestätigt per offizieller TS-Doku:
    // "files, include, and exclude from the inheriting config file overwrite those
    // from the base config file" (typescriptlang.org/tsconfig/#extends)
    "include": [
        "core/srd-monsters.js",
        "core/srd-spells.js",
        "core/themes.js",
        "features/dmscreen/dmscreen-widgets-combat.js",
        "features/dmscreen/dmscreen-widgets-reference.js",
        "features/initiative-statblock.js",
        "features/npcs/npc-popup.js",
        "systems/session-timer.js",
        "systems/spellslots/notes-templates.js",
        "systems/spellslots/pwa-install.js",
        "systems/spellslots/spell-slots-core.js",
        "systems/spellslots/spellslots-ui.js",
        "systems/spellslots/virtual-list.js",
        "systems/wiki-links.js",
        "ui/actions/wiki-actions.js",
        "ui/layout-profiles.js",
        "utils/testable-utils.js",
        "types/**/*.d.ts"
        // Diese Liste per neu erhobenem tsc-Lauf (siehe Pitfall 2) vor dem Festschreiben bestätigen —
        // die 17 hier gelistet sind der in dieser Sitzung gemessene Stand, nicht CONTEXT.md's Zahl.
    ]
}
```
```jsonc
// package.json — neues Script
"typecheck:strict": "tsc -p tsconfig.strict.json"
```
```yaml
# .github/workflows/ci.yml — im Job lint-and-typecheck, nach dem bestehenden "npm run typecheck"
- run: npm run typecheck:strict
```

### D-12/D-14: `jest.config.cjs`-Fix

```javascript
// jest.config.cjs — geänderte Zeilen
module.exports = {
  testEnvironment: 'jsdom',
  // VORHER: roots: ['<rootDir>/tests'],  ← verhindert collectCoverageFrom (D-12)
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.js', '**/*.test.ts'],   // unverändert, findet weiterhin nur tests/**
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],  // unverändert, verhindert Testlauf gegen Quelldateien
  // ... unverändert bis coverageThreshold
  coverageThreshold: {
    'utils/testable-utils.js': {
      // VORHER: 80/80/80/80 (13 Punkte unter der Wirklichkeit)
      // NACHHER: knapp unter den in dieser Sitzung gemessenen Werten (92,81/89,28/100/94,44)
      statements: 92,
      branches: 89,
      functions: 100,
      lines: 94
    }
  }
};
```
**Wichtig:** `roots: ['<rootDir>']` (Repo-Wurzel) statt `['<rootDir>/tests']` — NICHT `roots: ['.']`, da `<rootDir>` bereits das Projektverzeichnis ist und relative Root-Verzeichnisse in `jest.config.cjs` als Jest-Variable interpretiert werden müssen, nicht als literaler Pfad. In dieser Sitzung wurde der Effekt über den CLI-Flag `--roots=.` nachgewiesen (Ad-hoc-Override), die Config-Datei-Änderung selbst muss `<rootDir>` verwenden, damit sie unabhängig vom Arbeitsverzeichnis funktioniert, aus dem `jest` aufgerufen wird.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `no-undef: 'warn'`, handgepflegte Globals-Liste (~25 Namen) | `no-undef: 'error'`, generierte Globals-Liste aus `loader.js MODULES` | Diese Phase (D-08) | Verhindert stille `ReferenceError`s wie den `exportDataCSV`-Bug (Pitfall 1) künftig bereits beim Lint-Lauf |
| Coverage-Zahl 92,45 % (auf 159 von 18950 tatsächlichen Statements) | Ehrliche 0,77 % dokumentiert, Modul-zu-Test-Gate statt Statement-Schwelle | Diese Phase (D-12/D-13) | Realistische Erwartungshaltung; ein Gate, das etwas prüft, statt eines, das zufällig grün ist |
| `checkJs: false` global, `tsc --noEmit` prüft faktisch kein JS | Zusätzliche `tsconfig.strict.json` mit wachsender Allowlist | Diese Phase (D-11) | Neue Dateien können ab sofort typsicher geschrieben werden, ohne 1600+ Altlast-Fehler zu erben |

**Deprecated/outdated:**
- `lint:all` mit `--max-warnings 100` (package.json): entfällt in D-10, da `lint` nach D-08/D-10 dieselbe Härte über `no-undef: error` + gepinntes `--max-warnings 367` bereits liefert — ein zweiter Befehl mit abweichender Grenze wäre eine zweite Wahrheit über denselben Sachverhalt (dieselbe Begründung wie ARCH-01 für Modullisten, per CONTEXT.md D-10).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Das `globals`-npm-Paket ist die richtige Wahl für die 15 Browser- + 6 Node-Globals aus D-08 (statt Handeintrag) | Standard Stack (Supporting) | Gering — reine Implementierungs-Discretion, betrifft keine D-Entscheidung; Handeintrag funktioniert genauso |
| A2 | `roots: ['<rootDir>']` (nicht `['<rootDir>/tests']` oder ein anderer Wert) ist der korrekte Fix für D-12 | Code Examples (D-12/D-14) | Mittel — falscher `roots`-Wert könnte `testMatch` gegen unerwartete Verzeichnisse matchen; MUSS nach der Änderung mit vollem `jest`-Lauf verifiziert werden (in dieser Sitzung nur der CLI-Override `--roots=.` getestet, nicht die Config-Datei-Variante mit `<rootDir>`-Syntax) |
| A3 | Die 17 in dieser Sitzung gemessenen fehlerfreien Dateien sind die richtige Startliste für `tsconfig.strict.json`, nicht CONTEXT.md's ungenannte 5 | Measured Baseline, Code Examples (D-11) | Hoch für die Genauigkeit der Startliste, gering für den Gesamtansatz — die exakte Zahl muss laut Pitfall 2 vor dem Festschreiben neu erhoben werden, unabhängig davon, welche der beiden Quellen bevorzugt wird |
| A4 | `exportDataCSV` sollte zu `exportToCSV` korrigiert werden (Aufrufstelle ändern), nicht umgekehrt (Funktion umbenennen) | Common Pitfalls (Pitfall 1) | Gering — funktional äquivalent, betrifft nur Konsistenz mit dem Rest von `import-export.js` |

## Open Questions

1. **Warum weicht die `tsc --checkJs`-Fehlerzahl so stark ab (1617/103/98 vs. 1758/134/117)?**
   - What we know: Beide Messungen sind mit `strict: false, noImplicitAny: false, checkJs: true` gegen denselben Quellbaum durchgeführt worden (laut CONTEXT.md-Beschreibung). Der Nenner 103 (statt 134 tatsächlicher Dateien) deutet auf einen kleineren geprüften Dateisatz in der ursprünglichen Messung hin.
   - What's unclear: Welcher exakte Befehl/`include`-Satz die CONTEXT.md-Zahl erzeugt hat — nicht dokumentiert, nicht rekonstruierbar in dieser Sitzung.
   - Recommendation: Vor `tsconfig.strict.json`-Festschreibung den in dieser Datei dokumentierten Befehl erneut laufen lassen und DIESES Ergebnis als Wahrheit für die Planung verwenden (Pitfall 2).

2. **Ist die 75-von-134-Modul-Ausnahmeliste (D-13) mit einem einfachen Substring-Scan reproduzierbar, oder braucht es Sonderfälle?**
   - What we know: CONTEXT.md selbst nennt das Kriterium „grob" und verlangt Präzisierung vor dem Festschreiben.
   - What's unclear: Ob z. B. `srd-monsters.js` (durch Dateinamen-Kollision mit anderen `srd-*`-Dateien) False Positives/Negatives erzeugt, oder ob Testdateien, die ein Modul nur per `vm`+`readFileSync`-Pfad laden (28 von 40, siehe Baseline), überhaupt zuverlässig per Substring gefunden werden.
   - Recommendation: Der Planer sollte das Kriterium exakt definieren (z. B. „Modul-Basisname ohne Endung kommt als String in mindestens einer `tests/**`-Datei vor") und die Zahl mit einem Skript neu erheben, bevor die Ausnahmeliste eingecheckt wird.

## Environment Availability

Alle für diese Phase nötigen Werkzeuge sind lokal installiert und wurden in dieser Sitzung erfolgreich ausgeführt — keine externen Service-Abhängigkeiten.

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | Alle npm-Skripte | ✓ | v24.14.0 (lokal; CI nutzt Node 22 LTS, siehe `ci.yml`) | — |
| `npx eslint` | D-07/D-08/D-09/D-10 | ✓ | 9.39.2 | — |
| `npx tsc` | D-11 | ✓ | 5.9.3 | — |
| `npx jest` | D-12/D-13/D-14 | ✓ | `^30.2.0` | — |
| `npx playwright` | D-01/D-02/D-03 | ✓ | 1.57.0 | — |
| Python (für `build.py`, Vollsuiten-Gate) | CI-Job `test`/`e2e`/`build` | ✓ (impliziert durch bestehende CI-Läufe, nicht separat in dieser Sitzung geprüft) | — | — |

**Missing dependencies with no fallback:** keine
**Missing dependencies with fallback:** keine

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Unit-Framework | Jest `^30.2.0`, Config `jest.config.cjs` |
| E2E-Framework | Playwright `@playwright/test` 1.57.0, Config `playwright.config.js` |
| Quick run command (Unit) | `npx jest tests/unit/<neue-datei>.test.js` |
| Quick run command (E2E) | `npx playwright test tests/e2e/<pfad>/<neue-datei>.spec.js` |
| Full suite command (Unit) | `npx jest` (aktuell 43 Suiten/1109 Tests, live bestätigt) |
| Full suite command (E2E) | `npx playwright test` (CONTEXT.md-Baseline: 321 passed/2 skipped, in dieser Sitzung nicht neu gemessen — Playwright-Voll-Lauf braucht `python build.py` zuvor und wurde aus Zeitgründen nicht wiederholt, da diese Phase E2E-Verhalten nicht in der Breite ändert) |
| Lint | `npx eslint .` (in dieser Sitzung 1 Fehler/2196 Warnungen bestätigt) |
| Typecheck (Standard) | `npx tsc --noEmit` (Exit 0 bestätigt) |
| Typecheck (Strict, NEU) | `npx tsc -p tsconfig.strict.json` (D-11) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-03 | `seedCleanSession(page)` wird von allen 5 CRUD-Specs aufgerufen, Toast-Race unter Volllast nicht reproduzierbar | E2E, Wiederholungslauf | `npx playwright test tests/e2e/crud/locations.spec.js tests/e2e/crud/encounters.spec.js --repeat-each=20 --workers=8 --retries=0` | ❌ Wave 0 — `seedCleanSession` existiert noch nicht in `test-utils.js` |
| TEST-04 | 26 E2E-Tests über 5 neue Dateien, 37 Unit-Tests über 5 neue Dateien, Zahl unverändert | Unit + E2E, Zählprobe | `npx jest tests/unit/{session-prep,npc-generator,timeline,reise,fraktionen}.test.js` (erwartet 37 Tests gesamt) / `npx playwright test tests/e2e/features/{session-prep,npc-generator,timeline,reise,fraktionen}.spec.js` (erwartet 26 Tests gesamt) | ❌ Wave 0 — Dateien existieren noch nicht (aktuell nur `welt-story.*`) |
| TEST-05 (Lint) | `npm run lint` liefert 0 Fehler, `no-undef` ist `error`, `--max-warnings 367` (oder tiefer) | Statisch, Lint | `npm run lint` | ✅ Skript existiert, Konfiguration wird in dieser Phase geändert |
| TEST-05 (Typecheck) | `npm run typecheck:strict` grün für die Allowlist | Statisch, Typecheck | `npm run typecheck:strict` (NEU) | ❌ Wave 0 — Script und `tsconfig.strict.json` existieren noch nicht |
| TEST-05 (Coverage) | Modul-zu-Test-Gate: jedes `loader.js MODULES`-Modul hat mind. eine Testerwähnung, außer Ausnahmeliste | Unit, statischer Wächter | `npx jest tests/unit/module-test-coverage.test.js` (NEU) | ❌ Wave 0 |
| TEST-05 (Coverage, testable-utils) | `utils/testable-utils.js` Coverage bleibt ≥ Ratsche | Unit, Coverage-Threshold | `npx jest --coverage` (Threshold-Check via Jest selbst) | ✅ Mechanismus existiert, Werte werden angehoben |

### Sampling Rate

- **Per task commit:** jeweiliger Quick-Run-Befehl aus der Tabelle oben, plus `npm run lint` nach jeder D-07/D-08/D-09/D-10-Änderung
- **Per wave merge:** `npx jest` (voll) + `npx eslint .` + `npx tsc --noEmit` + `npx tsc -p tsconfig.strict.json` (sobald vorhanden)
- **Phase gate:** Volle Suiten grün (`npx jest`, `npx playwright test` nach `python build.py`, `npx eslint .`, `npx tsc --noEmit`, `npx tsc -p tsconfig.strict.json`, `python -m pytest tests/build/`) vor `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/helpers/test-utils.js` — `seedCleanSession(page)` Export fehlt (TEST-03/D-01)
- [ ] `tools/generate-eslint-globals.js` + `eslint.generated-globals.js` — Generator und Artefakt fehlen (TEST-05/D-08)
- [ ] `tests/unit/eslint-globals-freshness.test.js` — Drift-Wächter fehlt (TEST-05/D-08)
- [ ] `tests/unit/module-test-coverage.test.js` — Modul-zu-Test-Gate fehlt (TEST-05/D-13)
- [ ] `tsconfig.strict.json` — fehlt (TEST-05/D-11)
- [ ] Fünf neue Unit- und fünf neue E2E-Testdateien für Session-Prep/NPC-Generator/Timeline/Reise/Fraktionen — fehlen (TEST-04/D-04)
- [ ] `jest.config.cjs` `roots`-Fix — noch nicht angewendet (TEST-05/D-12)

## Project Constraints (from CLAUDE.md)

- **`saveUndoState()` vor jeder destruktiven Operation:** Nicht direkt einschlägig für diese Phase (reine Test-/Tooling-Änderungen), außer D-09 fasst App-Code an (`ui/actions/*.js`) — dort gilt die Regel unverändert, falls der Fix mehr als eine Umbenennung erfordert.
- **`esc()`/`sanitizeHTML()` für User-Content:** Nicht einschlägig — keine neuen UI-Renderpfade in dieser Phase.
- **Single Source of Truth (`loader.js MODULES`, ARCH-01):** Zentral für D-08 und D-13 — beide leiten ihre Daten aus genau dieser Liste ab, keine zweite Liste anlegen.
- **`var X = window.X` niemals für `const`/`let`-Globals:** Gilt für den D-08-Generator selbst — er DARF `var`-Deklarationen bewusst ignorieren (siehe Pattern 1), aber jeder neue Code, der in dieser Phase entsteht (z. B. `tools/generate-eslint-globals.js`), muss diese Regel selbst einhalten.
- **Deutsche UI-Strings, englische Sektionsmarker im Code:** Gilt für alle neuen Testdateien (D-04) — bestehende deutsche Testnamen und `// ====`-Banner beim Verschieben beibehalten (bereits in CONTEXT.md D-05 festgehalten).
- **Keine neuen Runtime-Dependencies ohne Grund:** `globals`-Paket (Supporting-Tabelle) ist optional und muss, falls übernommen, explizit in `package.json` stehen — nicht auf den transitiven `node_modules`-Fund verlassen.
- **ESLint-Ausnahmen mit Begründung + Verweis (etabliertes Muster, z. B. bereits vorhandene `no-misleading-character-class`-Ausnahme in `eslint.config.js`):** D-07s `eslint-disable-next-line no-control-regex` muss diesem Muster folgen (Kommentarzeile mit Verweis auf WR-01).

## Sources

### Primary (HIGH confidence — in dieser Sitzung per Tool verifiziert)
- `Read`/`Bash` gegen den Live-Quellbaum: `eslint.config.js`, `jest.config.cjs`, `tsconfig.json`, `playwright.config.js`, `package.json`, `.github/workflows/ci.yml`, `loader.js`, `types/globals.d.ts`, `types/index.d.ts`, `tests/unit/console-hygiene.test.js`, `tests/unit/tab-registry.test.js`, `tests/unit/action-registry-collisions.test.js`, `tests/e2e/helpers/test-utils.js`, `tests/e2e/crud/{party,npcs,quests,locations,encounters}.spec.js`, `tests/e2e/features/welt-story.spec.js`, `tests/unit/welt-story.test.js`, `systems/avatars.js`, `build.py` (Funktion `check_duplicate_functions`), `.planning/phases/13-h-rtung-wartbarkeit/13-PERF-MEASUREMENT.md`
- `npx eslint .`, `npx eslint . --format json` + Auswertungsskript, `npx tsc --noEmit`, `npx tsc -p <checkJs-Testconfig>`, `npx jest --coverage`, `npx jest --coverage --roots=.`, `npx playwright --version`, `npx playwright test --help`, `git show d2a521c --stat`, `git log -S`, `npm view globals`
- `[VERIFIED: node_modules/*/package.json]` für alle installierten Tool-Versionen

### Secondary (MEDIUM confidence)
- [ESLint Configuration Files (flat config)](https://eslint.org/docs/latest/use/configure/configuration-files) — `languageOptions.globals`-Merge-Verhalten über mehrere Config-Objekte hinweg
- [ESLint Command Line Interface Reference](https://eslint.org/docs/latest/use/command-line-interface) — `--max-warnings`-Verhalten gegenüber Error-Severity
- [TypeScript tsconfig — extends](https://www.typescriptlang.org/tsconfig/#extends) — `include`/`exclude`-Override- statt Merge-Semantik, Pfadauflösung relativ zur Ursprungsdatei
- [Playwright Test Reporters](https://playwright.dev/docs/test-reporters) — `PLAYWRIGHT_JSON_OUTPUT_NAME`/`PLAYWRIGHT_JSON_OUTPUT_FILE`

### Tertiary (LOW confidence)
- `globals`-npm-Paket als Empfehlung für Standard-Browser/Node-Globals — Name aus Trainingswissen, Registry-Fakten (Alter, Repo) per `npm view` bestätigt, aber nicht über eine offizielle ESLint-Dokumentationsseite in dieser Sitzung gegengelesen — `[ASSUMED]`, siehe Assumptions Log A1

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — alle Versionen live aus `node_modules`/`package.json` gelesen, keine neuen Pakete nötig
- Architecture/Patterns: HIGH — alle drei Kernmuster (Brace-Tiefe-0-Scan, SSoT+Drift-Test, Playwright-Beweislauf) sind entweder bereits im Repo produktiv (`build.py`, `console-hygiene.test.js`) oder per offizieller CLI-`--help`/Doku verifiziert
- Measured Baseline: HIGH für 15 von 17 Kennzahlen (exakt reproduziert), MEDIUM/offen für die `checkJs`-Fehlerzahl (Pitfall 2) und die `vm`-Ladepfad-Zahl (28 vs. 30, geringe praktische Relevanz)
- Pitfalls: HIGH — Pitfall 1 (`export-csv`-Live-Bug) ist ein in dieser Sitzung durch `Read`+`Grep` neu entdeckter, nicht in CONTEXT.md benannter Befund

**Research date:** 2026-09-06
**Valid until:** Zahlen sind an den exakten Commit-Stand gebunden (`state_head: 94db4bde9103a3620f2879566509a16ca1b6448d` laut STATE.md) — bei jeder weiteren Codeänderung vor Planbeginn erneut gegen den Live-Baum prüfen, insbesondere Lint-Warnungszahl und `no-undef`-Aufschlüsselung.
