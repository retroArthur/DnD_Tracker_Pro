# Phase 11: Architektur- & Build-Hygiene - Research

**Researched:** 2026-07-25
**Domain:** Build-Tooling (Python-Bundler), CI/CD (GitHub Actions), Browser-Konsolen-Hygiene, Planungs-Artefakt-Pflege
**Confidence:** HIGH (empirisch gegen Live-Code verifiziert für alle build.py/loader.js/ci.yml-Aussagen) / MEDIUM (externe Webrecherche zu Action-Majors und Chromium-Verhalten, Datumsangaben mit Vorbehalt s.u.)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Modullisten-Sync (ARCH-01)**
- **D-01:** Single Source of Truth statt Gate-Verschärfung. `build.py` liest die Modulliste zur Build-Zeit aus dem `MODULES`-Array in `loader.js`; die 148-Zeilen-Kopie in `build.py:40-187` entfällt ersatzlos. Ein fehlschlagender Parse bricht den Build ab. Reversibility: costly.
- **D-02:** Jede fehlende gelistete Datei bricht den Build ab (JS-Module, CSS-Dateien, HTML-Templates). Es gibt keine optionalen gelisteten Dateien.
- **D-03:** `tests/build/` wird echtes CI-Gate — `test`-Job bekommt `actions/setup-python` + `pytest tests/build/`.
- **D-04:** Alle drei Listen (MODULES, Template-Liste, CSS-`@import`-Reihenfolge) bekommen die SSoT-Behandlung, nicht nur die Modulliste.

**build.py-Dedup (ARCH-02)**
- **D-05:** Pass 3 (`remove_duplicate_functions`, `build.py:373-425`) wird ersatzlos entfernt — kann faktisch nicht mehr feuern, da `check_duplicate_functions()` schon vor dem Bündeln hart abbricht. Reversibility: reversible (Git-Revert eines abgegrenzten Funktionsblocks).
- **D-06:** Der Quell-Pre-Check wird auf `const`/`let`/`class` erweitert (heute nur `function`). Die Post-Build-Validierung bleibt als Backstop bestehen.
- **D-07:** Tests prüfen die Verhaltensgarantie, nicht die Interna: Build bricht mit Exit-Code ≠ 0 ab UND keine Ausgabedatei wird geschrieben; Regressionstest, dass kein `[DEDUP] Removed duplicate function`-Marker mehr vorkommt. `test_no_orphaned_return_statements` wird durch diese Garantien ersetzt.
- **D-08:** Build-Doku wird punktgenau nachgezogen (docs/build-system.md, CLAUDE.md), kein Vollaudit.

**CI- & Konsolen-Hygiene (ARCH-03)**
- **D-09:** `node-version` geht von `'20'` auf `'22'` an allen sechs Stellen in `ci.yml`. Der Planer prüft beim Anheben, ob zwischenzeitlich neuere Action-Majors existieren, und zieht sie mit.
- **D-10:** Favicon: Data-URI im Bundle (`build.py`-HTML-Kopf), Datei-Link im Dev-Modus (`index.html`).
- **D-11:** `apple-mobile-web-app-capable` wird ergänzt (`mobile-web-app-capable`), nicht ersetzt — empirisch verifizieren, ob die Konsole weiterhin warnt; falls ja, apple-Tag entfernen.
- **D-12:** Erfolgskriterium 4 wird maschinell belegt: `tests/e2e/smoke.spec.js` bekommt Assertions gegen fehlgeschlagene Requests/404 und die zwei bekannten Deprecation-Strings.

**Codebase-Map & CONCERNS-Triage (ARCH-04)**
- **D-13:** Erst triagieren (`11-CONCERNS-TRIAGE.md`), dann `/gsd-map-codebase` regenerieren lassen (überschreibt CONCERNS.md vollständig).
- **D-14:** Alle sieben Map-Dateien werden aufgefrischt, nicht nur CONCERNS.md.
- **D-15:** Jede Disposition braucht einen Beleg gegen den Live-Code (Datei:Zeile oder Phase/Commit).
- **D-16:** Phase 11 fixt keine Restposten aktiv — enge Ausnahme für ohnehin Angefasstes (D-01..D-12). Echte Codeänderungen werden als benannte Requirements nach `.planning/REQUIREMENTS.md` übernommen.

### Claude's Discretion
- Technische Form des `loader.js`-Parsers (Regex vs. minimaler Tokenizer) und der `assets/styles.css`-`@import`-Auswertung, solange ein Parse-Fehler den Build abbricht (D-01)
- Ob `MODULES` in `build.py` weiterhin als importierbare Modul-Konstante existiert oder die Tests direkt den Parser aufrufen
- Plan-/Wellen-Aufteilung: ARCH-01/ARCH-02 gebündelt oder getrennt
- Genaue Gestalt des `11-CONCERNS-TRIAGE.md` (Tabelle vs. Abschnitte), solange je Eintrag Disposition + Beleg enthalten sind
- Ob der Map-Refresh vor oder nach den Build-/CI-Änderungen läuft — muss aber den Stand *nach* Phase-11-Änderungen abbilden
- D-09 bis D-16 sind Claude-gewählte Empfehlungen (Nutzer hat delegiert), umstoßbar; D-01 bis D-08 sind Nutzer-Entscheidungen.

### Deferred Ideas (OUT OF SCOPE)
- Verschärfung von Pass 2 (`deduplicate_window_assignments`, `build.py:293-371`) — nicht in Phase 11.
- Flächenumbau der ~504 funktions-lokalen `const X = window.X` — explizit Out of Scope (`.planning/REQUIREMENTS.md:47`).
- Aktive Fixes der CONCERNS-Restposten (Export-Stempel, `setInterval` in `backups.js:318`, Undo-Performance, oversized modules, Tab-Registry-Strings, drei `execCommand`-Stellen außerhalb des Editors) — werden per D-16 als Requirements übernommen, nicht gefixt.
- CSP-Meta-Tag und `class`-Präfix-Whitelist in `sanitizeHTML` — bereits in Phase 10 als akzeptierte Risiken entschieden.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Modullisten-Drift strukturell unmöglich (SSoT loader.js↔build.py, Tests) | Abschnitt „SSoT-Parser (D-01/D-04)" — exakte Ist-Syntax aller drei Listen, empirisch verifizierter Ist-Divergenzfund bei der Template-Liste, Parser-Hook-Position in `build()` |
| ARCH-02 | Dedup Pass 3 gehärtet: kein still kaputtes Bundle mehr möglich | Abschnitt „Dedup Pass 3 (D-05/D-06)" — Aufrufer-Analyse, Testabdeckungs-Matrix (welche der 10 Tests bleiben/entfallen/werden ersetzt), Regex-Design-Optionen für die Erweiterung |
| ARCH-03 | CI-/Konsolen-Hygiene: Node-Version, Action-Majors, Favicon, Meta-Tag-Deprecation | Abschnitte „Node/Action-Version-Matrix (D-09)", „Favicon-Data-URI (D-10)", „mobile-web-app-capable (D-11)", „Smoke-Test-Assertions (D-12)" — externe Recherche mit Quellenangaben |
| ARCH-04 | Codebase-Map aufgefrischt, CONCERNS.md-Restposten trianguliert | Abschnitt „CONCERNS.md-Triage-Gegenstand (D-13/D-15)" — Entry-Count, Spot-Checks gegen Live-Code, `/gsd-map-codebase`-Verhalten (Refresh/Update/Skip-Prompt) |
</phase_requirements>

## Summary

Phase 11 ist eine reine Build-/CI-/Doku-Hygiene-Phase ohne Feature-Code. Die Recherche bestätigt den Großteil der CONTEXT.md-Annahmen empirisch, deckt aber drei Punkte auf, die den Plan materiell beeinflussen:

1. **Ein live existierender, bisher unentdeckter Drift-Fall**: `loader.js`s `TEMPLATES`-Array (Zeilen 219-230) fehlt `assets/templates/view-bestiary.html`, das `build.py`s `html_templates`-Liste (Zeile 485) enthält. Das MODULES-Array selbst ist dagegen 123/123 inhalts- UND reihenfolgegleich (empirisch nachgerechnet) — nur die Template-Liste driftet. Dieser Fund bestätigt exakt die Bug-Klasse, die D-04 schließen soll, und muss im SSoT-Umbau aktiv korrigiert werden (nicht nur strukturell verhindert).
2. **D-09s Kausalannahme ist falsch verdrahtet**: Die GitHub-Actions-Warnung „Node.js 20 actions are deprecated" bezieht sich auf die Runtime, mit der GitHub Actions selbst den JS-Code einer Action ausführt (`runs.using` in der Action-eigenen `action.yml`) — **nicht** auf das `node-version`-Input von `actions/setup-node`, das nur den Workflow-eigenen `npm ci`/`npm test`-Schritten eine Node-Version zuweist. Das Hochsetzen von `node-version: '20'` → `'22'` behebt diese spezifische Konsolen-/Log-Warnung **nicht**. Was sie behebt: das Hochziehen der Action-Majors selbst — und hier ist die Diskrepanz zur CONTEXT.md-Annahme („alle Actions stehen bereits auf aktuellen Majors") am größten: **alle acht in `ci.yml` verwendeten Actions liegen mehrere Majors hinter der aktuellen Version** (siehe Tabelle unten). Der `node-version`-Bump bleibt trotzdem sinnvoll, aber aus einem anderen Grund: Node 20 selbst ist inzwischen EOL.
3. **Playwright-API-Präzisierung für D-12**: `requestfailed` feuert nur bei echten Netzwerkfehlern, NICHT bei HTTP-404 (ein 404 ist ein vollständiger, "erfolgreicher" Response aus Netzwerksicht). Für den Favicon-404-Nachweis ist `page.on('response', r => r.status() === 404)` der korrekte Mechanismus, nicht `requestfailed`.

**Primary recommendation:** SSoT-Parser zuerst bauen (löst zugleich D-01 und den entdeckten Template-Drift-Bug), danach Pass-3-Entfernung + Pre-Check-Erweiterung (beide fassen build.py an, teilen sich die Testinfrastruktur), danach CI/Konsolen-Hygiene mit den korrigierten Action-Versionen aus diesem Dokument, zuletzt Triage-vor-Map-Refresh exakt wie in D-13 beschrieben.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Modullisten-Sync (ARCH-01) | Build-Tooling (Python) | Loader (Browser-Runtime, Dev-Modus) | `build.py` ist der Bündler; `loader.js` ist die Laufzeit-Quelle der Wahrheit für Dev-Modus-Reihenfolge — beide müssen dieselbe Liste lesen |
| Dedup-Härtung (ARCH-02) | Build-Tooling (Python) | — | Reine Bündelzeit-Logik, keine Laufzeit-Komponente betroffen |
| CI-Node/Action-Hygiene (ARCH-03a) | CI/CD (GitHub Actions YAML) | — | Betrifft ausschließlich die Runner-Ebene, nicht die App |
| Favicon/Meta-Tag-Hygiene (ARCH-03b) | Browser/Client (HTML `<head>`) | Build-Tooling (Python, generiert den Head für das Bundle) | Der Fix läuft über zwei Erzeugungsstellen (`index.html` statisch, `build.py`-Template zur Build-Zeit) für denselben Effekt |
| Smoke-Test-Assertions (ARCH-03c) | Test-Infrastruktur (Playwright, CI) | Browser/Client | Playwright treibt einen echten Chromium-Prozess gegen das ausgeführte Bundle — die Assertion lebt in der Test-Schicht, beobachtet aber Client-Verhalten |
| Codebase-Map-Refresh (ARCH-04) | Planungs-Artefakte (`.planning/codebase/`) | — | Reine Dokumentationsebene, keine Code-/Laufzeit-Komponente |

## Standard Stack

Phase 11 installiert keine neuen Laufzeit- oder Build-Abhängigkeiten. Die einzige neue Toolchain-Ergänzung ist `pytest` als CI-Schritt (D-03) — es ist bereits lokal vorhanden und im Projekt in `tests/build/` etabliert, nur bisher nicht in `ci.yml` verdrahtet.

| Tool | Version (verifiziert) | Zweck | Bereits im Projekt? |
|------|------------------------|-------|----------------------|
| pytest | 9.0.3 (lokal via `python -m pytest --version`) [VERIFIED: lokale Installation] | Testrunner für `tests/build/` | Ja — läuft bereits lokal, fehlt nur in CI |
| Python | 3.14.6 (lokal via `python --version`) [VERIFIED: lokale Installation] | Laufzeit für `build.py`/pytest | Ja — `actions/setup-python@v5` bereits in vier von sechs Jobs vorhanden, fehlt nur im `test`-Job |

**Kein `requirements.txt`/`requirements-dev.txt` im Repo gefunden** [VERIFIED: `find`-Lauf über Projektwurzel]. Der neue CI-Schritt kann daher nicht `pip install -r requirements-dev.txt` nutzen — entweder ein direktes `pip install pytest` im Workflow-Schritt, oder (sauberer, dem Projektstil folgend) eine neue `requirements-dev.txt` mit gepinnter pytest-Version anlegen. Beides ist mit D-03 vereinbar; CONTEXT.md trifft dazu keine Aussage — freie Wahl für den Planer.

### Alternatives Considered
Nicht anwendbar — keine Bibliotheksauswahl in dieser Phase, nur Tooling-Verdrahtung.

## Package Legitimacy Audit

**Nicht anwendbar für diese Phase.** Phase 11 installiert keine neuen npm-, PyPI- oder Cargo-Pakete. Die einzigen "externen" Artefakte, die sich ändern, sind GitHub-Actions-Versionsangaben (`actions/checkout@vN` etc.) — das sind first-party GitHub-Actions aus dem `actions`-Namespace, kein Registry-Install im Sinne des Package-Legitimacy-Gates. Deren Versionsstand ist unten in einer eigenen, quellenbelegten Tabelle dokumentiert (siehe „State of the Art").

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────┐
                    │      loader.js           │  ← Quelle der Wahrheit (D-01)
                    │  MODULES[] (123 Einträge)│
                    │  TEMPLATES[] (11 Eintr.) │
                    └───────────┬──────────────┘
                                │ zur Build-Zeit geparst
                                ▼
   assets/styles.css   ┌─────────────────────────┐
   @import-Hub (20)  ─▶│       build.py           │
                       │  1. SSoT-Parser (NEU)    │──▶ [FEHLER] Parse fehlgeschlagen → sys.exit(1)
                       │  2. Pre-Check Duplikate  │──▶ [FEHLER] const/let/class/function-Kollision
                       │     (D-06 erweitert)     │       → sys.exit(1), Datei+Modul benannt
                       │  3. JS/CSS/HTML laden    │──▶ [FEHLER] gelistete Datei fehlt → sys.exit(1) (D-02)
                       │  4. Pass 1+2 Dedup       │   (Pass 3 entfällt, D-05)
                       │  5. Post-Build-Validierung│──▶ [FEHLER] Depth-0-Duplikat im Bundle → sys.exit(1)
                       │     (Backstop, bleibt)   │       (bricht VOR write_file() ab)
                       └───────────┬──────────────┘
                                   │ nur bei 0 Fehlern
                                   ▼
                    dist/dnd-tracker-*.html (Bundle)
                                   │
                                   ▼
              ┌─────────────────────────────────────┐
              │   CI: test-Job (D-03)                │
              │   pytest tests/build/  ← NEU          │
              └─────────────────────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────┐
              │   CI: smoke-test-Job (gegen HTTP)    │
              │   tests/e2e/smoke.spec.js            │
              │   NEU (D-12): page.on('response')    │
              │   → 404-Check; page.on('console')    │
              │   → Deprecation-String-Check          │
              └─────────────────────────────────────┘
```

### Recommended Project Structure
Keine neuen Verzeichnisse. Betroffene bestehende Dateien:
```
build.py                          # SSoT-Parser (neu), Pre-Check-Erweiterung, Pass-3-Entfernung, HTML-Head-Änderungen
loader.js                         # TEMPLATES-Array: view-bestiary.html ergänzen (Bugfix, s.u.)
index.html                        # Favicon-Link, mobile-web-app-capable-Meta
.github/workflows/ci.yml          # node-version 6x, Action-Majors, neuer pytest-Schritt im test-Job
tests/build/test_build_deduplication.py  # 1 Test ersetzt, 1 Test umgeschrieben, neue Tests für SSoT/const-let-class
tests/e2e/smoke.spec.js           # neue response/console-Assertions
docs/build-system.md              # Pass-3-Referenzen entfernen (7 Fundstellen)
CLAUDE.md                         # zwei betroffene Abschnitte (s.u., mit Korrektur zur Fundstelle)
.planning/phases/11.../11-CONCERNS-TRIAGE.md   # neues Artefakt (D-13)
.planning/codebase/*.md           # sieben Dateien, Regenerierung via /gsd-map-codebase
```

### Pattern 1: SSoT-Parser für loader.js-Arrays (D-01/D-04)

**Was:** `build.py` liest `MODULES`, `TEMPLATES` und die CSS-`@import`-Reihenfolge direkt aus `loader.js`/`assets/styles.css`, statt eigene Kopien zu pflegen.

**Ist-Syntax-Analyse (empirisch, alle drei Listen gelesen):**

- **`MODULES`** (`loader.js:10-166`, `const MODULES = [ ... ];`): 123 einfach-quotierte String-Literale (`'core/config.js'`), meist ein Eintrag pro Zeile, durchsetzt mit `//`-Zeilenkommentaren (reine Gruppierungskommentare, z. B. `// Phase 2 Migrations- und Backup-Module (Welle 2 fuellt Implementierung)`), Leerzeilen erlaubt, kein Trailing-Comma nach dem letzten Eintrag, keine bedingten/berechneten Einträge. Der bestehende Regex in `check_module_list_sync()` (`build.py:217`, `re.search(r'const MODULES\s*=\s*\[(.*?)\];', content, re.DOTALL)` gefolgt von `re.findall(r"'([^']+)'", match.group(1))`) funktioniert bereits korrekt gegen diese Syntax — er ist der Ausgangspunkt für den SSoT-Parser.
- **`TEMPLATES`** (`loader.js:219-231`, `const TEMPLATES = [ ... ];`, innerhalb der `loadModules()`-Funktion, NICHT auf Modulebene wie `MODULES`): 11 Pfade mit `assets/templates/`-Präfix, gleiches Quotier-/Kommentarmuster.
- **CSS-`@import`-Hub** (`assets/styles.css:5-24`): 20 Zeilen `@import url('styles/DATEI.css');`, ein Import pro Zeile, keine Kommentare zwischengeschaltet.

**Empirisch verifizierter Sync-Status (Skript-Diff, nicht nur Stichprobe):**

| Liste | loader.js/styles.css-Anzahl | build.py-Anzahl | Reihenfolge identisch? | Inhalt identisch? |
|-------|------------------------------|-------------------|--------------------------|----------------------|
| MODULES | 123 | 123 | **Ja** | **Ja** |
| TEMPLATES | 11 | 12 | — | **Nein** — `view-bestiary.html` existiert nur in `build.py:485`, fehlt in `loader.js:219-231` |
| CSS `@import` | 20 | 20 | **Ja** | **Ja** |

**Live-Bug-Fund (nicht in CONTEXT.md dokumentiert, empirisch entdeckt in dieser Recherche):** `assets/templates/view-bestiary.html` existiert als Datei [VERIFIED: `ls assets/templates/`] und wird von `tests/e2e/features/bestiary.spec.js:21,134-135` über `#view-bestiary` referenziert — aber diese E2E-Tests laufen ausschließlich gegen `dist/dnd-tracker-bundled.html` (`playwright.config.js:36`: `baseURL: file:///.../dist/dnd-tracker-bundled.html`), niemals gegen `index.html` + `loader.js` direkt. Der Drift ist daher seit Einführung des Bestiary-Features (Phase 3) unentdeckt geblieben — kein Test übt den `loader.js`-Codepfad aus. **Praktische Konsequenz:** Ein Entwickler, der `index.html` direkt öffnet (Dev-Modus ohne Build), bekäme eine App, in der der Bestiary-Tab-Button existiert, aber der `#view-bestiary`-Container nie ins DOM eingefügt wird. Der SSoT-Umbau (D-04) muss `'assets/templates/view-bestiary.html',` aktiv in `loader.js`s `TEMPLATES`-Array ergänzen (Position: nach `view-encounters.html`, analog zu `build.py:485`) — sonst würde der neue Hard-Fail-Parser diesen Drift zwar korrekt erkennen und den Build abbrechen (das ist ja der Sinn von D-01), aber der Plan muss diese Korrektur als expliziten Task einplanen, nicht nur die Struktur bauen.

**Parser-Hook-Position — wichtige Sequenzierungs-Erkenntnis:** In der aktuellen `build()`-Funktion (`build.py:427-508`) laufen CSS-Laden (`448-479`) und Template-Laden (`483-495`) **vor** dem bestehenden Check-Aufruf (`check_module_list_sync`/`check_duplicate_functions`, Zeilen `499-501`) — beide Ladeschleifen iterieren heute über hartkodierte `css_files`/`html_templates`-Listen. Sobald diese Listen durch SSoT-Parsing ersetzt werden, **muss der Parse-Schritt vor Zeile 448 verschoben werden** (nicht an seiner heutigen Position 499-501 bleiben), da CSS- und Template-Ladeschleifen die geparsten Listen als Eingabe brauchen. Dies ist ein struktureller Umbau, keine Ergänzung.

**Tokenizer-Robustheitsrisiko:** Der einfache Regex `r"'([^']+)'"` scannt naiv nach Text zwischen einfachen Anführungszeichen — er unterscheidet nicht zwischen echten String-Literalen und Apostrophen innerhalb von `//`-Kommentaren (z. B. ein hypothetischer künftiger Kommentar `// don't touch this`). Aktuell enthält keiner der drei Listenkörper einen solchen Kommentar-Apostroph [VERIFIED: Sichtprüfung aller Kommentarzeilen in den gelesenen Bereichen], das Risiko ist also heute inaktiv, aber real für künftige Änderungen. Zwei Optionen für den Planer (freie Wahl laut CONTEXT.md „Claude's Discretion"):
1. Regex bleibt naiv, mit Kommentar-Konvention „keine Apostrophe in `//`-Kommentaren innerhalb der Array-Literale" (dokumentieren, nicht technisch erzwingen).
2. Robusterer Tokenizer: Erst `//.*$` pro Zeile strippen (MULTILINE), dann quotierte Strings extrahieren — eliminiert das Risiko vollständig bei minimal höherer Komplexität.

### Pattern 2: Dedup Pass 3 entfernen + Pre-Check erweitern (D-05/D-06)

**Aufrufer-Analyse (empirisch, vollständiger Funktionsgraph geprüft):** `remove_duplicate_functions()` (`build.py:373-425`) wird ausschließlich von `deduplicate_window_assignments()` aufgerufen (`build.py:369`: `js_final = remove_duplicate_functions(js_after_pass2)`). Kein Test importiert `remove_duplicate_functions` direkt — der Test-Import (`tests/build/test_build_deduplication.py:19`) holt nur `deduplicate_window_assignments, build, check_duplicate_functions, check_module_list_sync, MODULES`. Die Entfernung ist damit tatsächlich ein lokal abgegrenzter Eingriff: Zeile 369 (Aufruf) und Zeilen 373-425 (Funktionskörper) löschen, `deduplicate_window_assignments()` gibt stattdessen `'\n'.join(filtered_lines)` (Ergebnis von Pass 2) direkt zurück.

**Marker-Referenzen außerhalb von build.py selbst:** Nur `tests/build/test_build_deduplication.py::test_no_orphaned_return_statements` (Zeilen 272-306) prüft aktiv auf den String `[DEDUP] Removed duplicate function`. `docs/build-system.md` referenziert Pass 3 an sieben Stellen (Zeilen 73, 89, 120, 132, 171, 288, 410) [VERIFIED: `grep -n` über die Datei] — diese müssen laut D-08 mit-aktualisiert werden.

**Bestehende Testabdeckung — genaue Zählung (Korrektur zu CONTEXT.md):** `tests/build/test_build_deduplication.py` enthält **10** Testmethoden [VERIFIED: `pytest --collect-only`], nicht 11 wie in CONTEXT.md/`canonical_refs` angegeben. Vollständige Liste mit Disposition unter D-05/D-06/D-07:

| Test | Betrifft | Disposition unter D-05/D-06 |
|------|----------|-------------------------------|
| `test_deduplicate_removes_duplicate_window_assignments` | Pass 1/2 | Bleibt unverändert (Pass 2 explizit Out of Scope) |
| `test_deduplicate_removes_conflicting_definitions` | Pass 1/2 | Bleibt unverändert |
| `test_deduplicate_handles_multiple_conflicts` | Pass 1/2 | Bleibt unverändert |
| `test_full_build_has_no_duplicate_declarations` | Bundle-Endzustand | Bleibt unverändert (prüft `dist/`-Datei, unabhängig von Pass 3) |
| `test_build_generates_valid_javascript` | Bundle-Endzustand | Bleibt unverändert |
| `test_constants_are_available_in_build` | Bundle-Endzustand | Bleibt unverändert |
| `test_production_build_has_debug_mode_false` | Production-Flip | Bleibt unverändert (kein Bezug zu Pass 3/SSoT) |
| `test_module_lists_are_synchronized` | `check_module_list_sync()` | **Muss umgeschrieben werden** — die Zwei-Listen-Vergleichsfunktion verschwindet unter D-01 (es gibt nur noch eine Liste); der Test muss stattdessen den neuen SSoT-Parser aufrufen und prüfen, dass alle geparsten Pfade existieren |
| `test_duplicate_function_check_detects_duplicate` | `check_duplicate_functions()` | Bleibt als Grundmuster erhalten, wird **erweitert** um Testfälle für `const`/`let`/`class`-Duplikate (D-06) |
| `test_no_orphaned_return_statements` | Pass-3-Orphan-Bug | **Ersetzt** durch D-07: (a) Regressionstest „kein `[DEDUP] Removed duplicate function`-Marker im Bundle" + (b) Verhaltenstest „Build mit Quell-Duplikat bricht mit Exit-Code ≠ 0 ab UND schreibt keine Ausgabedatei" |

**Neue Test-Fixtures brauchen `class`-Fälle, nicht nur `const`:** Der Live-Code enthält bereits vier Top-Level-`class`-Deklarationen (`systems/spellslots/virtual-list.js:7` `VirtualList`, `ui/dom-builder.js:166` `DOMVirtualList`, `ui/safe-render.js:32` `SafeRender`, `ui/safe-render.js:417` `BatchUpdater`) und 231 Top-Level-`const`/`let`-Deklarationszeilen in den gebündelten Verzeichnissen [VERIFIED: `grep -c` über `core/ utils/ systems/ features/ ui/ render/ tools/`]. Die D-06-Erweiterung ist damit keine hypothetische Absicherung, sondern deckt realen, bereits vorhandenen Code ab — Testfixtures für D-07 sollten mindestens einen `class`-Kollisionsfall enthalten, nicht nur `const`.

**Zwei Implementierungsoptionen für die Pre-Check-Erweiterung (offen für Planer-Entscheidung):**
1. **Naiver Zeilenanfang-Regex** (mirrort das bestehende Muster für `function`): `^(function|const|let|class)\s+(\w+)` mit `re.MULTILINE`, ohne führenden Whitespace erlaubt. Funktioniert, weil die Projektkonvention (4-Leerzeichen-Einrückung, `CLAUDE.md`) bedeutet, dass echte Modul-Top-Level-Deklarationen bei Spalte 0 stehen und verschachtelte/funktionsskopierte Deklarationen immer eingerückt sind. Risiko: bricht bei Formatierungsabweichungen (z. B. ein Prettier-Lauf, der Einrückung ändert) unbemerkt.
2. **Tiefen-basiertes Tracking** (mirrort die bestehende Post-Build-Validierung, `build.py:657-663`, die Klammerzählung statt Texteinrückung nutzt): pro Datei Klammertiefe mitzählen, nur bei Tiefe 0 prüfen. Robuster gegen Formatierungsabweichungen, weil es echte Verschachtelung statt Texteinrückung misst — dieselbe Technik existiert bereits nachweislich funktionsfähig im selben File. Etwas mehr Implementierungsaufwand, aber kein neues Muster für die Codebasis.

Da CONTEXT.md die genaue technische Form explizit freistellt („Technische Form … Regex vs. minimaler Tokenizer"), wird hier keine Vorentscheidung getroffen — beide Optionen sind für den Planer dokumentiert, Option 2 wird aus Robustheitsgründen leicht bevorzugt, weil sie ein bereits bewährtes Muster wiederverwendet statt ein neues einzuführen.

**Interpretations-Hinweis für die Verifikation (aus CONTEXT.md übernommen, hier bestätigt):** Der Roadmap-Wortlaut „ein verwaister Funktionskörper … erzeugt einen Build-Fehler" wird durch D-05 anders erfüllt als wörtlich lesbar: Pass 3 entfällt ersatzlos, statt selbst einen Fehler zu werfen. Der verwaiste Zustand kann nach Phase 11 gar nicht mehr entstehen, weil der (erweiterte) Pre-Check vorher abbricht. Die Validierung muss deshalb die Frage „kann ein still kaputtes Bundle entstehen?" beweisen (Antwort: nein, an mehreren Stellen abgefangen), nicht wörtlich „wirft Pass 3 einen Fehler?" (Pass 3 existiert nach dieser Phase nicht mehr).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Doppelte Top-Level-Deklarationen im fertigen Bundle erkennen | Eine zweite, unabhängige Regex-Duplikaterkennung für die Pre-Check-Erweiterung | Dieselbe Tiefen-Tracking-Technik wie die bestehende Post-Build-Validierung (`build.py:657-663`) | Bereits bewährtes, produktiv laufendes Muster im selben File — ein zweites, abweichendes Erkennungsschema erhöht nur die Wartungslast ohne Mehrwert |
| Favicon-Data-URI-Encoding | Eine eigene Ad-hoc-String-Ersetzung ohne dokumentierte Zeichenliste | Die etablierte, community-dokumentierte Minimalliste (`"`→`'`, `%`→`%25`, `#`→`%23`, `{`→`%7B`, `}`→`%7D`, `<`→`%3C`, `>`→`%3E`, in dieser Reihenfolge — `%` zuerst, sonst Doppelkodierung) | Diese SVG enthält mehrfach `#`-Hex-Farben (`#0d0d0d`, `#d4af37`) — ein unvollständiges Encoding würde die Farbwerte als URI-Fragment-Identifier fehlinterpretieren und den Data-URI brechen |

**Key insight:** Beide bestehenden Erkennungsmechanismen (Pre-Check, Post-Build-Backstop) sind bereits funktionsfähige, im Projekt etablierte Muster — Phase 11 schließt Lücken zwischen ihnen, statt neue Erkennungslogik zu erfinden (exakt wie CONTEXT.md unter „Existing Code Insights" bereits festhält).

## Common Pitfalls

### Pitfall 1: `node-version`-Bump wird fälschlich als Fix für die Actions-Deprecation-Warnung verstanden
**What goes wrong:** Ein Entwickler bumpt `node-version: '20'` → `'22'` an allen sechs Stellen und erwartet, dass die Log-Warnung „Node.js 20 actions are deprecated" verschwindet.
**Why it happens:** Beide Dinge heißen „Node 20" und stehen in derselben YAML-Datei, sind aber technisch entkoppelt: `node-version` im `actions/setup-node`-Schritt konfiguriert nur die Runtime für nachfolgende `run:`-Schritte (`npm ci`, `npm test` etc.). Die Deprecation-Warnung bezieht sich auf die Node-Runtime, mit der der GitHub-Actions-Runner selbst den **JavaScript-Code jeder verwendeten Action** ausführt (deklariert in der `action.yml` jeder Action als `runs.using: node20`) — das ist unabhängig vom Workflow-eigenen `node-version`-Input [CITED: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/, abgerufen 2026-07-25].
**How to avoid:** Die Warnung wird durch das Anheben der **Action-Versionen selbst** behoben (siehe Tabelle „State of the Art" unten), nicht durch den `node-version`-Input. Beide Änderungen sind für D-09 sinnvoll, aber aus unterschiedlichen, unabhängigen Gründen — das sollte im Plan explizit getrennt benannt werden (zwei Akzeptanzkriterien, nicht eines).
**Warning signs:** Nach dem `node-version`-Bump prüfen, ob die Warnung im CI-Log tatsächlich verschwunden ist — falls nicht, war die Ursache die Action-Version, nicht die Node-Version.

### Pitfall 2: `page.on('requestfailed')` für 404-Erkennung verwenden
**What goes wrong:** D-12s Formulierung „keine fehlgeschlagenen Requests (`requestfailed`/404)" legt nahe, beide über denselben Listener abzudecken.
**Why it happens:** Playwright unterscheidet strikt zwischen Netzwerkfehlern (`requestfailed` — DNS-Fehler, abgebrochene Verbindung, `net::ERR_FAILED`) und HTTP-Fehlerstatus (404, 500 — vollständige, "erfolgreiche" Responses aus Netzwerksicht, die stattdessen `requestfinished` auslösen) [CITED: https://playwright.dev/docs/api/class-request, „A request will only be considered failed when the client cannot get an HTTP response from the server"].
**How to avoid:** Für den Favicon-404-Nachweis `page.on('response', response => { if (response.status() === 404) ... })` verwenden und auf `response.url()` filtern (z. B. `favicon.ico`). `requestfailed` bleibt als zusätzlicher Listener für echte Netzwerkfehler sinnvoll, deckt aber nicht den in D-12 konkret gemeinten Fall ab.
**Warning signs:** Ein Test, der `requestfailed` auf 404 prüft, wird nie fehlschlagen — auch wenn der 404 objektiv weiter auftritt (stiller Fehlalarm-Freifahrtschein).

### Pitfall 3: Warnung "apple-mobile-web-app-capable" verschwindet NICHT automatisch durch Ergänzen des Standard-Tags
**What goes wrong:** Man geht davon aus, dass `<meta name="mobile-web-app-capable" content="yes">` hinzuzufügen automatisch die Deprecation-Warnung für das `apple-`-Tag stillsetzt.
**Why it happens:** Mehrere unabhängige Quellen (next.js-Issue #70272, Drupal-Metatag-Issue #3483034) bestätigen: Chrome meldet die Warnung, **weil** das `apple-mobile-web-app-capable`-Tag selbst präsent ist — unabhängig davon, ob zusätzlich das Standard-Tag existiert [CITED: https://github.com/vercel/next.js/issues/70272, abgerufen 2026-07-25]. Die Warnmeldung selbst lautet sinngemäß (mehrfach quellenbelegt): `<meta name="apple-mobile-web-app-capable" content="yes"> is deprecated. Please include <meta name="mobile-web-app-capable" content="yes">` [CITED: GitHub Issue foundryvtt/foundryvtt#11696, abgerufen 2026-07-25] — der Wortlaut „Please include" klingt additiv, das beobachtete Laufzeitverhalten in den zitierten Issues ist aber, dass die Warnung bei gleichzeitiger Präsenz beider Tags weiterhin auftritt.
**How to avoid:** D-11s eigener Vorbehalt („empirisch zu verifizieren … wird das apple-Tag entfernt") ist der richtige Ansatz — die verfügbare Evidenz spricht dafür, das Ergebnis dieser Verifikation als „Warnung bleibt, apple-Tag muss entfernt werden" zu erwarten, nicht als Sonderfall.
**Warning signs:** Smoke-Test (D-12) schlägt nach dem reinen Ergänzen fehl — das ist erwartetes Verhalten, kein Testfehler.

### Pitfall 4: `/gsd-map-codebase` interaktiv unterbrechen, wenn `.planning/codebase/` bereits existiert
**What goes wrong:** Der Plan geht davon aus, dass der Map-Refresh (D-13/D-14) ein reiner, unbeaufsichtigter Befehlsaufruf ist.
**Why it happens:** Der Workflow (`map-codebase.md`, Step `check_existing`) prüft explizit, ob `.planning/codebase/` existiert (es existiert — sieben Dateien vom 2026-06-11), und präsentiert dann interaktiv drei Optionen (Refresh/Update/Skip) und **wartet auf Nutzerantwort**, bevor irgendetwas geschrieben wird.
**How to avoid:** Der Plan-Task für D-14 muss diesen Interaktionspunkt einkalkulieren (z. B. als `checkpoint:human-verify`-artiger Schritt oder mit der Erwartung, dass die Ausführung an dieser Stelle eine explizite „Refresh"-Bestätigung braucht) — kein reiner Fire-and-Forget-Bash-Aufruf.
**Warning signs:** Ein Ausführungslauf, der an dieser Stelle "hängt", ist kein Fehler, sondern der erwartete interaktive Prompt.

## Code Examples

### SVG-Favicon-Data-URI-Encoding (D-10) — verifiziertes Ergebnis gegen die echte `icons/icon.svg`
```python
# Quelle: etablierte Community-Technik (yoksel/url-encoder, jennyknuth-Gist),
# gegen icons/icon.svg dieser Codebase durchgerechnet (siehe Recherche-Protokoll)
import re

def build_favicon_data_uri(svg_path):
    svg = open(svg_path, encoding='utf-8').read()
    # Kommentarblock strippen (das icon.svg hat 26 Zeilen erklärenden Kommentar,
    # der im Data-URI nur Ballast ist)
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.DOTALL)
    # Whitespace/Newlines kollabieren
    svg = re.sub(r'>\s+<', '><', svg.strip())
    svg = re.sub(r'\s+', ' ', svg)
    # Minimale Zeichen-Ersetzung — Reihenfolge wichtig: % zuerst, sonst Doppelkodierung
    svg = svg.replace('"', "'")
    svg = svg.replace('%', '%25')
    svg = svg.replace('#', '%23')   # icon.svg nutzt #0d0d0d/#d4af37 mehrfach — kritisch!
    svg = svg.replace('{', '%7B')
    svg = svg.replace('}', '%7D')
    svg = svg.replace('<', '%3C')
    svg = svg.replace('>', '%3E')
    return f'data:image/svg+xml,{svg}'

# Empirisch gemessen gegen icons/icon.svg (3003 Bytes Original):
# - nach Kommentar-Strip + Whitespace-Kollaps: 1079 Zeichen
# - finale Data-URI-Länge: 1158 Zeichen — unproblematisch für ein href-Attribut
```

### Playwright-404- und Console-Assertions (D-12) — korrigierte API-Nutzung
```javascript
// Ergänzung zu tests/e2e/smoke.spec.js — Muster orientiert an der bestehenden
// pageerror-Sammlung (Zeilen 9-14), aber mit den korrekten Events für
// HTTP-Status vs. Konsolen-Text.

const KNOWN_DEPRECATION_STRINGS = [
    'apple-mobile-web-app-capable',   // Meta-Tag-Deprecation-Warnung
    // zweiter bekannter String: Favicon-404 wird NICHT über console erkannt,
    // sondern über das response-Event unten
];

test('Keine Favicon-404 und keine Meta-Tag-Deprecation', async ({ page }) => {
    const failed404s = [];
    const consoleWarnings = [];

    // KORREKT für HTTP-Status (404 ist KEIN requestfailed-Event — das feuert
    // nur bei echten Netzwerkfehlern, siehe playwright.dev/docs/api/class-request)
    page.on('response', response => {
        if (response.status() === 404) failed404s.push(response.url());
    });
    page.on('console', msg => {
        const text = msg.text();
        if (KNOWN_DEPRECATION_STRINGS.some(s => text.includes(s))) {
            consoleWarnings.push(text);
        }
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('.app-title', { timeout: 15000 });

    expect(failed404s).toHaveLength(0);
    expect(consoleWarnings).toHaveLength(0);
});
```

## State of the Art

**Wichtiger Vorbehalt zu den Datumsangaben in dieser Tabelle:** Die Versionsnummern stammen aus direkten GitHub-API-Abfragen (`api.github.com/repos/.../releases/latest`) und sind intern konsistent (2026er Daten, passend zum aktuellen Datum 2026-07-25). Eine erste Abfrage über die gerenderte GitHub-Releases-Weboberfläche (statt der API) lieferte für dieselben Repos offensichtlich falsche 2024er Daten (Artefakt der Fetch-Zusammenfassung, nicht der Quelle) — deshalb wurde ausschließlich die API-JSON-Antwort als Quelle verwendet und hier zitiert. Empfehlung an den Planer: Vor der Umsetzung die exakten Versionsnummern nochmals mit `gh api repos/actions/<name>/releases/latest --jq .tag_name` gegenkontrollieren, da sich der Stand bis zur Ausführung weiter bewegt haben kann.

| Action | In `ci.yml` (Ist) | Aktueller Major (verifiziert 2026-07-25) | Quelle |
|--------|--------------------|---------------------------------------------|--------|
| `actions/checkout` | `@v4` | `v7.0.1` (published 2026-07-20) | [VERIFIED via GitHub API: api.github.com/repos/actions/checkout/releases/latest] |
| `actions/setup-node` | `@v4` | `v7.0.0` (published 2026-07-14) | [VERIFIED via GitHub API: api.github.com/repos/actions/setup-node/releases/latest] |
| `actions/setup-python` | `@v5` | `v7.0.0` (published 2026-07-20) | [VERIFIED via GitHub API: api.github.com/repos/actions/setup-python/releases/latest] |
| `actions/upload-artifact` | `@v4` | `v7.0.1` (published 2026-04-10) | [VERIFIED via GitHub API: api.github.com/repos/actions/upload-artifact/releases/latest] |
| `actions/download-artifact` | `@v4` | `v8.0.1` (published 2026-03-11) | [VERIFIED via GitHub API: api.github.com/repos/actions/download-artifact/releases/latest] |
| `actions/configure-pages` | `@v5` | `v6.0.0` (published 2026-03-25) | [VERIFIED via GitHub API: api.github.com/repos/actions/configure-pages/releases/latest] |
| `actions/upload-pages-artifact` | `@v4` | `v5.0.0` (published 2026-04-10) | [VERIFIED via GitHub API: api.github.com/repos/actions/upload-pages-artifact/releases/latest] |
| `actions/deploy-pages` | `@v4` | `v5.0.0` (published 2026-03-25) | [VERIFIED via GitHub API: api.github.com/repos/actions/deploy-pages/releases/latest] |

**Korrektur zu CONTEXT.md D-09:** Die Annahme „alle Actions stehen bereits auf aktuellen Majors" trifft **nicht zu** — jede der acht Actions ist mindestens einen, teils drei Majors hinter dem aktuellen Stand. D-09s eigener Passus „Der Planer prüft beim Anheben, ob zwischenzeitlich neuere Action-Majors existieren, und zieht sie mit" trifft hier voll zu und ist mit dieser Tabelle direkt umsetzbar. Ein Versionssprung über mehrere Majors kann Breaking Changes enthalten (`actions/checkout@v5` z. B. änderte Default-Verhalten für `persist-credentials`; `actions/upload-artifact` v3→v4/v5/v7 änderte Artefakt-Handling grundlegend — nicht mehr additiv zu bestehenden Artefakten) — jeder Bump sollte einzeln gegen die Release-Notes der jeweiligen Zwischen-Majors geprüft werden, nicht blind auf `@latest`-Major gesetzt werden.

**Node.js-LTS-Status (Grund für den `node-version`-Bump, unabhängig von der Actions-Tabelle oben):**

| Version | Status (Stand 2026-07-25) | Quelle |
|---------|------------------------------|--------|
| Node 20 (Iron) | **End-of-Life** (EOL-Datum 2026-03-24/April 2026 laut mehreren Quellen) | [CITED: nodejs.org/en/about/previous-releases, abgerufen 2026-07-25] |
| Node 22 (Jod) | Maintenance LTS (Active LTS seit 2024-10-29 bis 2025-10-21, seither Maintenance, EOL 2027-04-30) | [CITED: dev.to/endoflifeai/nodejs-22-lts-eol-date-support-timeline-and-what-comes-next-30dm, abgerufen 2026-07-25] |
| Node 24 (Krypton) | Active LTS (seit 2025-10-28, EOL 2028-04-30) | [CITED: dev.to/endoflifeai/nodejs-22-lts-eol-date-support-timeline-and-what-comes-next-30dm, abgerufen 2026-07-25] |

D-09s Wahl von Node 22 (statt 24) bleibt unter diesen Zahlen sinnvoll — Node 22 ist voll unterstützte Maintenance-LTS bis April 2027, die "konservativere Wahl"-Begründung aus CONTEXT.md ist zutreffend. Node 20 ist zum Zeitpunkt dieser Recherche bereits offiziell EOL — der Bump ist unabhängig von der Actions-Deprecation-Warnung ein eigenständig valider Grund.

**Exakter Wortlaut der GitHub-Actions-Deprecation-Warnung** [CITED: mehrere GitHub-Issues, u. a. github.com/actions/upload-pages-artifact/issues/138, github.com/openpubkey/opkssh/issues/494, abgerufen 2026-07-25]:
> „Node.js 20 actions are deprecated. Please update the following actions to use Node.js 24: [Liste betroffener Actions]. For more information see: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/."

Diese Warnung erscheint als Job-Annotation (nicht zwingend als Konsolen-Text im Browser — **wichtige Abgrenzung**: Diese Actions-Warnung ist eine **CI-Log-Warnung des GitHub-Actions-Runners**, komplett getrennt von der `apple-mobile-web-app-capable`-Warnung, die eine **Browser-Konsolen-Warnung** ist. Erfolgskriterium 3 (CI ohne Deprecation-Warnungen) und Erfolgskriterium 4 (Browser-Konsole ohne 404/Deprecation) sind zwei unabhängige Nachweisorte — CI-Logs vs. Playwright-`console`-Event — und brauchen unterschiedliche Verifikationsmechanismen. Das Ist im Plan bereits implizit korrekt getrennt (D-09 vs. D-11/D-12), aber diese Recherche macht die Trennung explizit, damit kein gemeinsamer Test beide Anforderungen fälschlich gemeinsam abdeckt.

**WHATWG-Spezifikation zum impliziten favicon.ico-Fetch (Grundlage für D-10):**
> „In the absence of a link with the icon keyword, for documents obtained over HTTP or HTTPS, user agents may instead attempt to fetch and use an icon [...]" [CITED: WHATWG HTML Living Standard, zitiert über mathiasbynens.be/notes/rel-shortcut-icon, abgerufen 2026-07-25]

Zwei Kernaussagen für die Planung: (1) Die implizite Anfrage ist an das **Fehlen** eines `<link rel="icon">`-Elements gekoppelt — unabhängig vom `href`-Wert (Data-URI, relativer Pfad, egal). Ein `<link rel="icon" href="data:image/svg+xml,...">` erfüllt die Bedingung „link mit icon-keyword vorhanden" und sollte den impliziten Fetch nach Spezifikation unterbinden. (2) Die implizite Anfrage geschieht ausdrücklich nur „for documents obtained over HTTP or HTTPS" — das bestätigt CONTEXT.md/`specifics`-Aussage, dass der 404 unter `file://` gar nicht sichtbar ist, und dass der Nachweis für Erfolgskriterium 4 zwingend über den HTTP-Smoke-Job laufen muss (bereits so in D-12 verankert).

**Deprecated/outdated:**
- Node 20 als CI-Runtime: End-of-Life, siehe Tabelle oben.
- Alle acht in `ci.yml` referenzierten Action-Majors: mehrere Versionen hinter dem aktuellen Stand, siehe Tabelle oben.
- `apple-mobile-web-app-capable` ohne `mobile-web-app-capable`: von Chrome als deprecated markiert seit der Einführung der Web-App-Manifest-Spezifikation als Standardweg.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Die zitierten GitHub-API-Versionsdaten (Actions-Majors) sind zum Ausführungszeitpunkt noch aktuell | State of the Art | Gering — der Planer wird ohnehin angehalten, die Versionen bei Umsetzung erneut zu prüfen (bereits in D-09 verankert); Web-Ökosystem bewegt sich schnell |
| A2 | Der genaue Wortlaut der GitHub-Actions-Deprecation-Job-Annotation ("Node.js 20 actions are deprecated. Please update...") ist über mehrere unabhängige, aber nicht-offizielle Quellen (Issue-Zitate, nicht GitHub-eigene Dokumentation mit Wortlaut-Copy) belegt, nicht direkt aus einem GitHub-eigenen Log-Auszug dieser Repo-CI verifiziert | State of the Art | Mittel — falls der exakte String abweicht, funktioniert eine stringbasierte CI-Log-Assertion (falls der Plan eine solche vorsieht) nicht; Erfolgskriterium 3 sollte daher eher über "keine Action-Version < aktueller Major" geprüft werden als über String-Matching im Log |
| A3 | Chrome/Chromium warnt bei gleichzeitiger Präsenz von `apple-mobile-web-app-capable` UND `mobile-web-app-capable` weiterhin (Pitfall 3) | Common Pitfalls, Pitfall 3 | Mittel — falls das Verhalten sich zwischenzeitlich geändert hat (Chromium-Versionsabhängig) und die Warnung durch reines Ergänzen doch verschwindet, wäre das apple-Tag-Entfernen unnötig; die empirische Verifikation, die D-11 selbst fordert, bleibt der verlässlichste Weg — diese Recherche liefert nur die Erwartungshaltung |
| A4 | Data-URI-`<link rel="icon">` unterbindet den impliziten `/favicon.ico`-Fetch in Chromium konkret (nicht nur laut Spezifikationstext) | State of the Art / D-10 | Mittel — die WHATWG-Spec-Aussage ist eindeutig als SOLL-Verhalten formuliert ("may instead attempt"), aber Implementierungsdetails einzelner Browser können abweichen; sollte im Plan durch den ohnehin vorgesehenen HTTP-Smoke-Test (D-12) empirisch bestätigt werden, nicht nur auf Spec-Text vertraut werden |

**Kein Eintrag zu Paketnamen/Registry-Legitimität nötig** — diese Phase installiert keine neuen npm/PyPI/Cargo-Pakete (siehe „Package Legitimacy Audit").

## Open Questions

1. **Exakte pytest-Installationsmethode in CI (D-03)**
   - What we know: Kein `requirements.txt`/`requirements-dev.txt` im Repo; pytest ist lokal vorhanden (9.0.3), aber nicht als Projekt-Dependency deklariert.
   - What's unclear: Ob der Plan ein einfaches `pip install pytest` im Workflow-Schritt will oder eine neue `requirements-dev.txt` mit gepinnter Version anlegt (konsistenter mit dem Projektstil, der `package.json` für JS-Deps nutzt).
   - Recommendation: `requirements-dev.txt` mit gepinnter Version (`pytest==9.0.3` oder neuer zum Ausführungszeitpunkt) — reproduzierbarer als ungepinntes `pip install pytest`, und ein natürlicher Ort für künftige Python-Test-Deps.

2. **Reihenfolge SSoT-Parser-Umbau vs. Pass-3-Entfernung innerhalb derselben Datei**
   - What we know: Beide Änderungen (D-01/D-04 und D-05/D-06) fassen `build.py` an; CONTEXT.md stellt frei, ob sie gebündelt oder getrennt laufen.
   - What's unclear: Ob eine gemeinsame Welle das Risiko von Merge-Konflikten im selben File reduziert (positiv) oder die Verifikationsfläche pro Plan zu groß macht (negativ) — abhängig vom bevorzugten Wellenzuschnitt des Planers.
   - Recommendation: Getrennte Pläne mit klarer Reihenfolge (SSoT zuerst, da er den entdeckten Template-Drift-Bug mit-fixt und eine Struktur-Voraussetzung für den restlichen build.py-Umbau ist), aber in derselben Welle/Session, um Kontext-Verlust zwischen eng verwandten build.py-Änderungen zu vermeiden.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Python | `build.py`, pytest | ✓ | 3.14.6 [VERIFIED lokal] | — |
| pytest | `tests/build/` (neu in CI) | ✓ (lokal) | 9.0.3 [VERIFIED lokal] | CI braucht expliziten `pip install`-Schritt (kein requirements-File vorhanden) |
| Node.js | npm-Tooling (Jest, ESLint, Playwright) | ✓ | (lokal nicht separat geprüft — nicht Teil dieser Phase, betrifft nur CI-Runner-Konfiguration) | — |
| GitHub-Actions-Runner-Zugriff | Verifikation der Deprecation-Warnung in echtem CI-Lauf | ✗ (nicht in dieser Recherche-Session verfügbar) | — | Verifikation muss im tatsächlichen CI-Lauf nach Umsetzung erfolgen, nicht lokal simulierbar |
| Chromium (via Playwright) | Smoke-Test-Assertions (D-12), Favicon/Meta-Tag-Verifikation (D-10/D-11) | (im Projekt über `npx playwright install` verfügbar, nicht separat in dieser Session geprüft) | — | — |

**Missing dependencies with no fallback:**
- Echter CI-Lauf zur Verifikation der Actions-Deprecation-Warnung — kann nur nach Merge/Push beobachtet werden, nicht vorab simulierbar. Der Plan sollte diesen Nachweis als Teil der Phasen-Verifikation (nicht der lokalen Task-Verifikation) einplanen.

**Missing dependencies with fallback:**
- pytest-Installation in CI: `pip install pytest` als Inline-Schritt ist ein valider Fallback, falls keine `requirements-dev.txt` gewünscht ist.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework (Build-Ebene) | pytest 9.0.3 [VERIFIED lokal], bestehende Suite in `tests/build/test_build_deduplication.py` |
| Framework (E2E-Ebene) | Playwright (Version siehe `package.json`), Config `playwright.config.js` (Dev-Bundle, file://) und `playwright.smoke.config.js` (Production-Bundle, HTTP in CI) |
| Config-Datei (pytest) | keine dedizierte `pytest.ini`/`pyproject.toml`-Sektion gefunden — Tests laufen über Pfad-Discovery (`tests/build/`) |
| Quick-Run-Befehl | `python -m pytest tests/build/ -v` (lokal, < 5s für die aktuellen 10 Tests, da reine String-/Regex-Operationen ohne echten Build-Lauf für die meisten Fälle) |
| Full-Suite-Befehl (Build) | `python -m pytest tests/build/` nach vorherigem `python build.py` und `python build.py --production` (einige Tests skippen ohne vorhandene `dist/`-Artefakte) |
| Full-Suite-Befehl (E2E) | `npx playwright test` (Dev-Bundle) + `npx playwright test --config=playwright.smoke.config.js` (Production-Bundle gegen HTTP) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|---------------|
| ARCH-01 | Divergierender Modul-/Template-/CSS-Eintrag lässt Build hart fehlschlagen | unit (pytest) | `python -m pytest tests/build/test_build_deduplication.py -k synchron -x` (Testname nach Umschreibung von `test_module_lists_are_synchronized`) | ⚠️ Muss umgeschrieben werden (bestehender Test prüft heute nur `check_module_list_sync()`, die unter D-01 verschwindet) |
| ARCH-01 | Fehlende gelistete Datei bricht Build ab (D-02) | unit (pytest, neu) | `python -m pytest tests/build/ -k missing_file` | ❌ Wave 0 — kein bestehender Test deckt diesen Fall ab |
| ARCH-02 | Quell-Duplikat (function/const/let/class) bricht Build mit Exit-Code ≠ 0 ab und schreibt keine Datei | unit (pytest) | `python -m pytest tests/build/test_build_deduplication.py -k duplicate -x` | ⚠️ Teilweise vorhanden (`test_duplicate_function_check_detects_duplicate` deckt nur `function`), muss um const/let/class erweitert werden |
| ARCH-02 | Kein `[DEDUP] Removed duplicate function`-Marker mehr im Bundle möglich | unit (pytest, ersetzt `test_no_orphaned_return_statements`) | `python -m pytest tests/build/ -k no_dedup_function_marker` | ❌ Wave 0 — neuer Test nach D-07 |
| ARCH-03 (Actions-Majors) | Alle Actions auf aktuellem Major, keine Deprecation-Warnung im CI-Log | CI-Job-Beobachtung (manuell/dokument-verifiziert) | Kein automatisiertes Test-Kommando — Verifikation erfolgt durch Betrachten des tatsächlichen CI-Laufs nach Push | — (kein Testfile — CI-Log-Inspektion) |
| ARCH-03 (Favicon/Meta) | Kein Favicon-404, keine `apple-mobile-web-app-capable`-Warnung in der Browser-Konsole | E2E (Playwright, smoke) | `npx playwright test --config=playwright.smoke.config.js` | ⚠️ `tests/e2e/smoke.spec.js` existiert, braucht neue Assertions (D-12, siehe Code-Beispiel oben) |
| ARCH-04 | `.planning/codebase/` aktuell, CONCERNS.md-Einträge trianguliert | Dokument-Verifikation (manuell) | Kein automatisiertes Kommando — Review von `11-CONCERNS-TRIAGE.md` gegen `.planning/codebase/CONCERNS.md` nach Regenerierung | — (reines Planungsartefakt, kein Code) |

### Sampling Rate
- **Per Task-Commit:** `python -m pytest tests/build/ -v` (schnell, < 5s für die meisten Fälle) nach jeder `build.py`-Änderung; `python build.py` manuell ausführen und Konsole auf Fehler prüfen.
- **Per Wave-Merge:** Volle `pytest tests/build/`-Suite + `npm test` (Jest) + `python build.py --production` + `npx playwright test --config=playwright.smoke.config.js` gegen einen lokalen HTTP-Server (mirrort `ci.yml` `smoke-test`-Job).
- **Phasen-Gate:** CI-Lauf nach Push (nicht lokal simulierbar für die Actions-Deprecation-Warnung, s. o.) + volle Suiten grün vor `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/build/test_build_deduplication.py` — neuer Test für „fehlende gelistete Datei bricht Build ab" (D-02), aktuell nicht abgedeckt
- [ ] `tests/build/test_build_deduplication.py` — neue Tests für `const`/`let`/`class`-Duplikaterkennung (D-06), aktuell nur `function` abgedeckt
- [ ] `tests/build/test_build_deduplication.py` — neuer Test „kein `[DEDUP] Removed duplicate function`-Marker im Bundle" (D-07, ersetzt `test_no_orphaned_return_statements`)
- [ ] `tests/build/test_build_deduplication.py` — `test_module_lists_are_synchronized` muss umgeschrieben werden (ruft heute eine Funktion auf, die unter D-01 verschwindet)
- [ ] `requirements-dev.txt` (falls diese Route gewählt wird) — existiert nicht, siehe Open Question 1
- [ ] `tests/e2e/smoke.spec.js` — neue `response`/`console`-Assertions (D-12), siehe Code-Beispiel

**Wichtige Validierungs-Nuance (explizit für den Verifier/Plan-Checker):** Erfolgskriterium 2 der Roadmap ("verwaister Funktionskörper erzeugt Build-Fehler") wird durch D-05 NICHT durch einen Test erfüllt, der beweist "Pass 3 wirft einen Fehler" — Pass 3 existiert nach dieser Phase nicht mehr. Die korrekte Validierungslogik ist: beweise, dass ein Quell-Duplikat (das früher zum Orphan-Bug geführt hätte) jetzt VOR dem Bündeln abgefangen wird (Pre-Check-Exit) und dass kein Pfad mehr existiert, der ein Bundle mit stillem Orphan-Body erzeugen könnte. Ein Plan-Checker, der nach einem "Pass 3 wirft Fehler"-Test sucht, findet keinen — das ist korrektes, nicht lückenhaftes Verhalten.

Erfolgskriterium 5 (Map-Refresh + CONCERNS-Triage) ist **ausschließlich dokument-verifizierbar** — es gibt keinen automatisierten Test, der "jeder CONCERNS.md-Eintrag ist erledigt/obsolet/übernommen" prüfen kann. Die Verifikation läuft über manuellen Abgleich von `11-CONCERNS-TRIAGE.md` gegen die tatsächlichen `.planning/codebase/*.md`-Dateien nach Regenerierung, plus Stichprobenbelege (Datei:Zeile) je Disposition, wie D-15 fordert.

## Security Domain

**`security_enforcement` nicht explizit auf `false` gesetzt in `.planning/config.json`** — Abschnitt wird pro Vorgabe behandelt, fällt aber inhaltlich sehr knapp aus, da Phase 11 keine neue Angriffsfläche schafft (kein neuer User-Input-Pfad, keine neue Datenverarbeitung).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | Nein | Keine Auth-Änderungen in dieser Phase |
| V3 Session Management | Nein | — |
| V4 Access Control | Nein | — |
| V5 Input Validation | Grenzfall — nur für den SSoT-Parser | Der neue `loader.js`-Parser liest eine projekteigene, git-versionierte Datei, kein Benutzer-Input; dennoch sollte der Parser bei unerwartetem Format hart fehlschlagen (D-01 fordert das ohnehin) statt stillschweigend eine leere/falsche Liste zu produzieren — das ist eher ein Robustheits- als ein Sicherheitsaspekt |
| V6 Cryptography | Nein | — |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| CI-Supply-Chain (veraltete/kompromittierte GitHub-Actions-Majors) | Tampering | Version-Pinning auf geprüfte Majors (diese Recherche liefert die aktuellen Versionsnummern); SHA-Pinning statt Tag-Pinning wäre eine weitergehende Härtung, aber außerhalb des D-09-Scopes (der nur Versions-Bumps fordert, kein SHA-Pinning-Regime) |
| Build-Time-Datei-Injection über den SSoT-Parser (theoretisch: manipuliertes `loader.js` könnte beliebige Pfade in den Build einschleusen) | Tampering | Bereits durch D-02 (harter Fail bei fehlender Datei) und die bestehende Post-Build-Validierung abgedeckt — kein neuer Mechanismus nötig, da `loader.js` bereits eine vertrauenswürdige, git-versionierte Projektdatei ist (kein externer Input) |

## Sources

### Primary (HIGH confidence)
- `build.py` (vollständig gelesen, Zeilen 1-708) — alle Aussagen zu Pass 1-3, Pre-Check, Post-Build-Validierung, HTML-Head-Template
- `loader.js` (vollständig gelesen, Zeilen 1-349) — MODULES/TEMPLATES-Arrays
- `assets/styles.css` (vollständig gelesen) — CSS-`@import`-Hub
- `.github/workflows/ci.yml` (vollständig gelesen) — alle sechs `node-version`-Stellen, acht Actions
- `tests/build/test_build_deduplication.py` (vollständig gelesen) — 10 Tests, empirisch nachgezählt via `pytest --collect-only`
- `tests/e2e/smoke.spec.js`, `playwright.config.js`, `playwright.smoke.config.js` (vollständig gelesen)
- `.planning/codebase/CONCERNS.md` (vollständig gelesen, 46 diskrete Einträge gezählt)
- `icons/icon.svg`, `index.html`, `sw.js`, `validate.py`, `package.json` (Spot-Checks gegen D-15-Behauptungen)
- Empirisches Diff-Skript (Python) gegen MODULES/TEMPLATES/CSS-Listen — Ergebnis: MODULES 123/123 identisch inkl. Reihenfolge, TEMPLATES 11 vs. 12 divergent (`view-bestiary.html` fehlt in loader.js)
- GitHub-API-Abfragen (`api.github.com/repos/actions/*/releases/latest`) für alle acht Action-Versionen

### Secondary (MEDIUM confidence)
- [github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) — offizielle GitHub-Changelog-Quelle zur Node-20-Deprecation
- [nodejs.org/en/about/previous-releases](https://nodejs.org/en/about/previous-releases) — Node-LTS-Status-Tabelle
- [html.spec.whatwg.org](https://html.spec.whatwg.org/multipage/links.html) (über Sekundärzitat mathiasbynens.be) — implizites favicon.ico-Fetch-Verhalten
- [github.com/actions/runner/issues/4295](https://github.com/actions/runner/issues/4295) — Deprecation-Warnungstext-Verhalten
- [github.com/vercel/next.js/issues/70272](https://github.com/vercel/next.js/issues/70272), [github.com/foundryvtt/foundryvtt/issues/11696](https://github.com/foundryvtt/foundryvtt/issues/11696) — apple-mobile-web-app-capable-Warnungsverhalten
- [playwright.dev/docs/api/class-request](https://playwright.dev/docs/api/class-request) — requestfailed vs. response-Semantik
- [gist.github.com/jennyknuth/222825e315d45a738ed9d6e04c7a88d0](https://gist.github.com/jennyknuth/222825e315d45a738ed9d6e04c7a88d0) — SVG-Data-URI-Encoding-Zeichenliste

### Tertiary (LOW confidence)
- Aggregierte WebSearch-Zusammenfassungen (nicht die Primärquellen selbst) für allgemeine Kontextaussagen zu Node-LTS-Terminologie — wo möglich durch Primärquellen (nodejs.org, github.blog) ersetzt/gegengeprüft, s. o.

## Metadata

**Confidence breakdown:**
- Repo-interne Aussagen (build.py, loader.js, ci.yml, Tests, CONCERNS.md): HIGH — jede Aussage wurde durch tatsächliches Lesen der Datei oder ein ausführendes Skript/Kommando verifiziert, nicht aus CONTEXT.md übernommen
- Externe Versions-/Deprecation-Aussagen: MEDIUM — GitHub-API-Daten sind strukturiert und intern konsistent, aber der zeitliche Abstand zwischen dieser Recherche und der tatsächlichen Umsetzung kann sie veralten lassen; explizit im Text markiert
- Chromium-Verhaltensaussagen (Favicon-Suppression, Meta-Tag-Warnung-Persistenz): MEDIUM — auf Spezifikationstext und mehrere unabhängige Bug-Tracker-Berichte gestützt, nicht auf einen eigenen Chromium-Test in dieser Session (kein Browser-Zugriff in der Recherche-Umgebung)

**Research date:** 2026-07-25
**Valid until:** Repo-interne Aussagen (build.py/loader.js/Tests): stabil bis zur nächsten Code-Änderung an diesen Dateien (kein Ablaufdatum im klassischen Sinn). Externe Aussagen (Action-Majors, Node-LTS, Chromium-Warnverhalten): 14 Tage — dieses Ökosystem bewegt sich schnell; vor Umsetzung erneut mit `gh api`/DevTools gegenprüfen, wie in den jeweiligen Abschnitten bereits empfohlen.
